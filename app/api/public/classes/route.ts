import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Uses anon key — RLS policy public_read_slots controls what is visible.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getWeekBounds(weekParam: string | null): { weekStart: Date; weekEnd: Date } {
  const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8

  let weekStart: Date;
  if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    weekStart = new Date(`${weekParam}T00:00:00+08:00`);
  } else {
    // Default: Monday of the current PH week
    const nowPH = new Date(Date.now() + MANILA_OFFSET_MS);
    const dow = nowPH.getUTCDay(); // 0=Sun
    const daysToMonday = dow === 0 ? -6 : 1 - dow;
    weekStart = new Date(nowPH);
    weekStart.setUTCDate(nowPH.getUTCDate() + daysToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

function toDateStr(d: Date): string {
  // Returns YYYY-MM-DD in Asia/Manila (UTC+8)
  const ph = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return ph.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get('week');

  const { weekStart, weekEnd } = getWeekBounds(weekParam);
  const startStr = toDateStr(weekStart);
  const endStr = toDateStr(weekEnd);

  const { data: slots, error } = await supabase
    .from('class_slots')
    .select('id, class_name, category, class_date, start_time, duration_minutes, price, teacher_name, max_capacity, notes')
    .gte('class_date', startStr)
    .lte('class_date', endStr)
    .eq('is_active', true)
    .order('class_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }

  if (!slots || slots.length === 0) {
    return NextResponse.json({ slots: [], weekStart: startStr, weekEnd: endStr });
  }

  // Fetch booking counts for all slots
  const slotIds = slots.map((s) => s.id);
  const { data: bookingCounts } = await supabase
    .from('class_bookings')
    .select('slot_id')
    .in('slot_id', slotIds)
    .neq('payment_status', 'cancelled');

  const countMap: Record<string, number> = {};
  (bookingCounts ?? []).forEach((b: { slot_id: string }) => {
    countMap[b.slot_id] = (countMap[b.slot_id] ?? 0) + 1;
  });

  const result = slots.map((slot) => {
    const bookingCount = countMap[slot.id] ?? 0;
    return {
      ...slot,
      booking_count: bookingCount,
      spots_left: Math.max(0, slot.max_capacity - bookingCount),
    };
  });

  return NextResponse.json({ slots: result, weekStart: startStr, weekEnd: endStr });
}
