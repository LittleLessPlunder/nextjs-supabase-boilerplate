'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronLeft, ChevronRight, Settings, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import {
  ClassSlot,
  getClassSlots,
  getBookingCountsBySlots,
  deactivateClassSlot,
} from '@/utils/supabase/queries';

// ─── Helpers ────────────────────────────────────────────────────────────────

const PH_TZ = 'Asia/Manila';

/** Returns Monday of the week containing `date` (local date string YYYY-MM-DD) */
function weekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toLocalDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: PH_TZ }); // YYYY-MM-DD
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

const CATEGORY_STYLE: Record<ClassSlot['category'], { bg: string; text: string; dot: string }> = {
  yoga:             { bg: 'bg-[#A55437]/10', text: 'text-[#A55437]',  dot: 'bg-[#A55437]'  },
  reformer_pilates: { bg: 'bg-[#808368]/10', text: 'text-[#808368]',  dot: 'bg-[#808368]'  },
  sound_healing:    { bg: 'bg-purple-50',    text: 'text-purple-700', dot: 'bg-purple-500'  },
  private:          { bg: 'bg-amber-50',     text: 'text-amber-700',  dot: 'bg-amber-500'   },
};

const CATEGORY_LABEL: Record<ClassSlot['category'], string> = {
  yoga:             'Yoga',
  reformer_pilates: 'Reformer',
  sound_healing:    'Sound',
  private:          'Private',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Component ──────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => weekMonday(new Date()));
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { currentTenant } = useTenant();

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const from = toLocalDate(weekStart);
      const to   = toLocalDate(addDays(weekStart, 6));
      const data = await getClassSlots(supabase, currentTenant.id, from, to);
      setSlots(data);
      if (data.length > 0) {
        const counts = await getBookingCountsBySlots(supabase, data.map(s => s.id));
        setBookingCounts(counts);
      } else {
        setBookingCounts({});
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load schedule.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentTenant, weekStart]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(slot: ClassSlot) {
    if (!confirm(`Remove "${slot.class_name}" on ${slot.class_date}?`)) return;
    try {
      const supabase = createClient();
      await deactivateClassSlot(supabase, slot.id);
      toast({ title: 'Removed', description: `${slot.class_name} removed from schedule.` });
      load();
    } catch {
      toast({ title: 'Error', description: 'Failed to remove class.', variant: 'destructive' });
    }
  }

  // Build a map: dateStr → slots[]
  const byDate: Record<string, ClassSlot[]> = {};
  slots.forEach(s => {
    if (!byDate[s.class_date]) byDate[s.class_date] = [];
    byDate[s.class_date].push(s);
  });

  const today = toLocalDate(new Date());
  const weekLabel = (() => {
    const from = weekStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: PH_TZ });
    const to   = addDays(weekStart, 6).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: PH_TZ });
    return `${from} – ${to}`;
  })();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage weekly classes</p>
        </div>
        <Link href="/classes/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add class
          </Button>
        </Link>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="outline" size="icon" onClick={() => setWeekStart(d => addDays(d, -7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[180px] text-center">{weekLabel}</span>
        <Button variant="outline" size="icon" onClick={() => setWeekStart(d => addDays(d, 7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setWeekStart(weekMonday(new Date()))}
        >
          This week
        </Button>
      </div>

      {/* Week grid */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-8">Loading schedule…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAY_NAMES.map((dayName, i) => {
            const dayDate = addDays(weekStart, i);
            const dateStr = toLocalDate(dayDate);
            const daySlots = byDate[dateStr] ?? [];
            const isToday = dateStr === today;
            const isPast  = dateStr < today;

            return (
              <div key={dateStr} className={`rounded-xl border p-3 space-y-2 min-h-[120px] ${isToday ? 'border-[#A55437]/50 bg-[#A55437]/5' : 'border-border bg-card'}`}>
                {/* Day header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${isToday ? 'text-[#A55437]' : 'text-muted-foreground'}`}>
                      {dayName}
                    </p>
                    <p className={`text-lg font-bold leading-none ${isPast && !isToday ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {dayDate.toLocaleDateString('en-PH', { day: 'numeric', timeZone: PH_TZ })}
                    </p>
                  </div>
                  <Link href={`/classes/add?date=${dateStr}`}>
                    <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Add class">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </div>

                {/* Slots */}
                {daySlots.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/60 pt-1">No classes</p>
                ) : (
                  daySlots.map(slot => {
                    const style   = CATEGORY_STYLE[slot.category];
                    const booked  = bookingCounts[slot.id] ?? 0;
                    const full    = booked >= slot.max_capacity;

                    return (
                      <div
                        key={slot.id}
                        className={`rounded-lg p-2 text-xs space-y-1 ${style.bg} ${isPast ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className={`font-semibold leading-tight ${style.text}`}>
                            {slot.class_name}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            <Link href={`/classes/edit/${slot.id}`}>
                              <button className="p-0.5 rounded text-muted-foreground hover:text-foreground" title="Edit">
                                <Settings className="h-3 w-3" />
                              </button>
                            </Link>
                            <button
                              className="p-0.5 rounded text-muted-foreground hover:text-destructive"
                              title="Remove"
                              onClick={() => handleDelete(slot)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-muted-foreground">
                          {formatTime(slot.start_time)} · {slot.duration_minutes} min
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {CATEGORY_LABEL[slot.category]}
                          </span>
                          <Link href={`/classes/${slot.id}/bookings`}>
                            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${full ? 'text-destructive' : 'text-muted-foreground'} hover:underline cursor-pointer`}>
                              <Users className="h-2.5 w-2.5" />
                              {booked}/{slot.max_capacity}
                            </span>
                          </Link>
                        </div>
                        <p className="text-muted-foreground">PHP {slot.price_php.toLocaleString()}</p>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
