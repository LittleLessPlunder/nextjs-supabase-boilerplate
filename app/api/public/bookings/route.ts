import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const bookingSchema = z.object({
  slot_id: z.string().uuid(),
  client_name: z.string().min(2).max(100),
  client_phone: z.string().min(7).max(20),
  client_email: z.string().email(),
});

const WHATSAPP_NUMBER = '639166832927';

function buildWhatsAppUrl(params: {
  class_name: string;
  class_date: string;
  start_time: string;
  price: number;
  client_name: string;
}): string {
  const { class_name, class_date, start_time, price, client_name } = params;

  // Format date nicely: "Wed Apr 9"
  const dateObj = new Date(`${class_date}T${start_time}+08:00`);
  const dateFmt = dateObj.toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  });
  const timeFmt = dateObj.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  });

  const msg = `Hi! I'd like to book ${class_name} on ${dateFmt} at ${timeFmt} (PHP ${price.toLocaleString()}). My name is ${client_name}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { slot_id, client_name, client_phone, client_email } = parsed.data;

  // Fetch the slot to verify it exists, is active, and has capacity
  const { data: slot, error: slotError } = await supabase
    .from('class_slots')
    .select('id, class_name, category, class_date, start_time, price, max_capacity, tenant_id, is_active')
    .eq('id', slot_id)
    .eq('is_active', true)
    .single();

  if (slotError || !slot) {
    return NextResponse.json({ error: 'Class not found or no longer available' }, { status: 404 });
  }

  // Check slot is in the future (PH time)
  const slotDateTime = new Date(`${slot.class_date}T${slot.start_time}+08:00`);
  if (slotDateTime < new Date()) {
    return NextResponse.json({ error: 'This class has already passed' }, { status: 400 });
  }

  // Count existing non-cancelled bookings
  const { count, error: countError } = await supabase
    .from('class_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', slot_id)
    .neq('payment_status', 'cancelled');

  if (countError) {
    return NextResponse.json({ error: 'Failed to check capacity' }, { status: 500 });
  }

  if ((count ?? 0) >= slot.max_capacity) {
    return NextResponse.json({ error: 'This class is fully booked' }, { status: 409 });
  }

  // Insert booking
  const { data: booking, error: insertError } = await supabase
    .from('class_bookings')
    .insert({
      tenant_id: slot.tenant_id,
      slot_id,
      class_date: slot.class_date,
      client_name,
      client_phone,
      client_email,
      payment_status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !booking) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  const whatsapp_url = buildWhatsAppUrl({
    class_name: slot.class_name,
    class_date: slot.class_date,
    start_time: slot.start_time,
    price: slot.price,
    client_name,
  });

  return NextResponse.json({ booking_id: booking.id, whatsapp_url }, { status: 201 });
}
