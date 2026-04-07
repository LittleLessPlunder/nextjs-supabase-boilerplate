'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { ClassSlot, ClassBooking, getClassSlot, getBookingsForSlot } from '@/utils/supabase/queries';

const STATUS_STYLE: Record<ClassBooking['payment_status'], string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  paid:      'bg-green-100  text-green-800',
  cancelled: 'bg-gray-100   text-gray-500',
};

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function SlotBookingsPage({ slotId }: { slotId: string }) {
  const [slot, setSlot] = useState<ClassSlot | null>(null);
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (!currentTenant) return;
    (async () => {
      try {
        const supabase = createClient();
        const [s, b] = await Promise.all([
          getClassSlot(supabase, slotId),
          getBookingsForSlot(supabase, slotId),
        ]);
        if (!s || s.tenant_id !== currentTenant.id) {
          toast({ title: 'Error', description: 'Class not found.', variant: 'destructive' });
          return;
        }
        setSlot(s);
        setBookings(b);
      } catch {
        toast({ title: 'Error', description: 'Failed to load bookings.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [slotId, currentTenant]);

  async function updateStatus(bookingId: string, status: ClassBooking['payment_status']) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('class_bookings')
        .update({ payment_status: status })
        .eq('id', bookingId);
      if (error) throw error;
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, payment_status: status } : b));
      toast({ title: 'Updated', description: `Status set to ${status}.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!slot) return null;

  const active = bookings.filter(b => b.payment_status !== 'cancelled');

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/classes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to schedule
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{slot.class_name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date(slot.class_date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
          {' · '}{formatTime(slot.start_time)}
          {' · '}{slot.duration_minutes} min
          {slot.teacher_name ? ` · ${slot.teacher_name}` : ''}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {active.length} / {slot.max_capacity} spots filled · PHP {slot.price_php.toLocaleString()} per person
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No bookings yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <Card key={b.id}>
              <CardContent className="py-4 flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="font-semibold text-sm">{b.client_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3 shrink-0" />{b.client_phone}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3 shrink-0" />{b.client_email}
                  </p>
                  {b.notes && <p className="text-xs text-muted-foreground italic">{b.notes}</p>}
                  <p className="text-[10px] text-muted-foreground">
                    Booked {new Date(b.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[b.payment_status]}`}>
                    {b.payment_status}
                  </span>
                  <div className="flex gap-1.5">
                    {b.payment_status !== 'paid' && (
                      <button
                        onClick={() => updateStatus(b.id, 'paid')}
                        className="text-[10px] px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors font-medium"
                      >
                        Mark paid
                      </button>
                    )}
                    {b.payment_status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(b.id, 'cancelled')}
                        className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
