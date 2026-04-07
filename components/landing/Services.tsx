'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicSlot } from './BookingModal';

const MANILA_TZ = 'Asia/Manila';

function nowPH(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: MANILA_TZ }));
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string; dot: string; tag: string }> = {
  yoga:             { bg: 'bg-[hsl(16_30%_92%)]',   text: 'text-[hsl(16_55%_38%)]',   dot: 'bg-[hsl(16_55%_43%)]',   tag: 'Yoga' },
  reformer_pilates: { bg: 'bg-[hsl(67_20%_90%)]',   text: 'text-[hsl(67_30%_35%)]',   dot: 'bg-[hsl(67_30%_38%)]',   tag: 'Reformer' },
  sound_healing:    { bg: 'bg-[hsl(270_20%_91%)]',  text: 'text-[hsl(270_30%_45%)]',  dot: 'bg-[hsl(270_30%_50%)]',  tag: 'Sound' },
  private:          { bg: 'bg-[hsl(34_25%_90%)]',   text: 'text-[hsl(34_40%_35%)]',   dot: 'bg-[hsl(34_40%_40%)]',   tag: 'Private' },
};

interface ServicesProps {
  onBook: (slot?: PublicSlot) => void;
}

export function Services({ onBook }: ServicesProps) {
  const [monday, setMonday] = useState<Date>(() => getMondayOfWeek(nowPH()));
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async (mon: Date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/classes?week=${toDateStr(mon)}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots(monday);
  }, [monday, fetchSlots]);

  const now = nowPH();
  const days = getWeekDays(monday);
  const isCurrentWeek = toDateStr(monday) === toDateStr(getMondayOfWeek(now));

  const slotsByDay: Record<string, PublicSlot[]> = {};
  slots.forEach((s) => {
    if (!slotsByDay[s.class_date]) slotsByDay[s.class_date] = [];
    slotsByDay[s.class_date].push(s);
  });

  const weekLabel = (() => {
    const start = days[0].toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    const end = days[6].toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    return `${start} – ${end}`;
  })();

  return (
    <section id="classes" className="py-24 sm:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">
              Weekly schedule
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Classes for every body.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              From energising morning flows to restorative evening sessions — all held
              in our open-air shala overlooking the sea.
            </p>
          </div>
          <Button
            size="lg"
            className="rounded-full px-7 shrink-0"
            onClick={() => onBook()}
          >
            Book a Class
          </Button>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setMonday((m) => { const p = new Date(m); p.setDate(p.getDate() - 7); return p; })}
            disabled={isCurrentWeek}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground">{weekLabel}</span>
          <button
            onClick={() => setMonday((m) => { const n = new Date(m); n.setDate(n.getDate() + 7); return n; })}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <p className="text-muted-foreground">No classes scheduled this week.</p>
            <p className="text-sm text-muted-foreground">
              Follow{' '}
              <a
                href="https://www.instagram.com/yogatayoelnido/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                @yogatayoelnido
              </a>{' '}
              on Instagram to stay updated.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: vertical day list */}
            <div className="md:hidden space-y-6">
              {days.map((day) => {
                const dateStr = toDateStr(day);
                const daySlots = slotsByDay[dateStr] ?? [];
                if (daySlots.length === 0) return null;
                return (
                  <div key={dateStr}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                      {day.toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="space-y-3">
                      {daySlots.map((slot) => {
                        const slotDT = new Date(`${slot.class_date}T${slot.start_time}+08:00`);
                        const isPast = slotDT < now;
                        const full = slot.spots_left === 0;
                        const style = CATEGORY_STYLE[slot.category] ?? CATEGORY_STYLE.yoga;
                        return (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            isPast={isPast}
                            full={full}
                            style={style}
                            onBook={onBook}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: 7-column grid */}
            <div className="hidden md:grid grid-cols-7 gap-3">
              {days.map((day) => {
                const dateStr = toDateStr(day);
                const daySlots = slotsByDay[dateStr] ?? [];
                const isToday = dateStr === toDateStr(now);
                return (
                  <div key={dateStr} className="min-w-0">
                    {/* Day header */}
                    <div className={`text-center mb-3 pb-2 border-b ${isToday ? 'border-primary' : 'border-border'}`}>
                      <p className={`text-[11px] font-medium uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {day.toLocaleDateString('en-PH', { weekday: 'short' })}
                      </p>
                      <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {day.toLocaleDateString('en-PH', { day: 'numeric' })}
                      </p>
                    </div>

                    {/* Slot cards */}
                    <div className="space-y-2">
                      {daySlots.length === 0 && (
                        <div className="h-10 rounded-xl border border-dashed border-border/60" />
                      )}
                      {daySlots.map((slot) => {
                        const slotDT = new Date(`${slot.class_date}T${slot.start_time}+08:00`);
                        const isPast = slotDT < now;
                        const full = slot.spots_left === 0;
                        const style = CATEGORY_STYLE[slot.category] ?? CATEGORY_STYLE.yoga;
                        return (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            isPast={isPast}
                            full={full}
                            style={style}
                            onBook={onBook}
                            compact
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground mt-10">
          Drop-in welcome · Packages available · Gear provided upon request
        </p>
      </div>
    </section>
  );
}

// ─── Slot card ───────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  isPast,
  full,
  style,
  onBook,
  compact = false,
}: {
  slot: PublicSlot;
  isPast: boolean;
  full: boolean;
  style: { bg: string; text: string; dot: string; tag: string };
  onBook: (slot?: PublicSlot) => void;
  compact?: boolean;
}) {
  const disabled = isPast || full;

  if (compact) {
    return (
      <button
        disabled={disabled}
        onClick={() => !disabled && onBook(slot)}
        className={`w-full text-left rounded-xl border p-2.5 transition-all duration-150 ${
          disabled
            ? 'opacity-40 cursor-not-allowed border-border bg-muted/20'
            : `border-border ${style.bg} hover:shadow-sm cursor-pointer hover:border-primary/30`
        }`}
      >
        <div className="flex items-center gap-1 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
          <span className={`text-[10px] font-medium uppercase tracking-wide truncate ${style.text}`}>
            {style.tag}
          </span>
        </div>
        <p className="text-[11px] font-semibold text-foreground leading-snug truncate">{slot.class_name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(slot.start_time)}</p>
        {!isPast && (
          <p className={`text-[10px] mt-0.5 font-medium ${full ? 'text-destructive' : 'text-muted-foreground'}`}>
            {full ? 'Full' : `${slot.spots_left} left`}
          </p>
        )}
      </button>
    );
  }

  return (
    <article
      className={`rounded-2xl border p-5 flex flex-col gap-4 transition-shadow duration-200 ${
        disabled ? 'opacity-50 border-border bg-muted/20' : `border-border bg-card hover:shadow-md`
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium ${style.bg} ${style.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {style.tag}
        </div>
        <span className="text-sm font-semibold text-foreground">PHP {slot.price.toLocaleString()}</span>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">{slot.class_name}</h3>
        <p className="text-sm text-muted-foreground">
          {formatTime(slot.start_time)} · {slot.duration_minutes} min · {slot.teacher_name}
        </p>
        {slot.notes && (
          <p className="text-xs text-muted-foreground mt-1 italic">{slot.notes}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className={`text-sm font-medium ${full ? 'text-destructive' : 'text-muted-foreground'}`}>
          {isPast ? 'Class passed' : full ? 'Fully booked' : `${slot.spots_left} spot${slot.spots_left === 1 ? '' : 's'} left`}
        </span>
        {!disabled && (
          <Button size="sm" variant="outline" onClick={() => onBook(slot)}>
            Book
          </Button>
        )}
      </div>
    </article>
  );
}
