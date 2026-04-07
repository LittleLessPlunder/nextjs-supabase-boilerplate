'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PublicSlot {
  id: string;
  class_name: string;
  category: 'yoga' | 'reformer_pilates' | 'sound_healing' | 'private';
  class_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  duration_minutes: number;
  price_php: number;
  teacher_name: string;
  max_capacity: number;
  notes: string | null;
  booking_count: number;
  spots_left: number;
}

interface BookingModalProps {
  open: boolean;
  preselectedSlot: PublicSlot | null;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MANILA_TZ = 'Asia/Manila';

function nowPH(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: MANILA_TZ }));
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatDayHeader(d: Date): { short: string; num: string } {
  return {
    short: d.toLocaleDateString('en-PH', { weekday: 'short', timeZone: MANILA_TZ }),
    num: d.toLocaleDateString('en-PH', { day: 'numeric', timeZone: MANILA_TZ }),
  };
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatSlotDate(slot: PublicSlot): string {
  const d = new Date(`${slot.class_date}T${slot.start_time}+08:00`);
  return d.toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: MANILA_TZ,
  });
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  yoga:             { bg: 'bg-[hsl(16_30%_92%)]',   text: 'text-[hsl(16_55%_38%)]',   dot: 'bg-[hsl(16_55%_43%)]' },
  reformer_pilates: { bg: 'bg-[hsl(67_20%_90%)]',   text: 'text-[hsl(67_30%_35%)]',   dot: 'bg-[hsl(67_30%_38%)]' },
  sound_healing:    { bg: 'bg-[hsl(270_20%_91%)]',  text: 'text-[hsl(270_30%_45%)]',  dot: 'bg-[hsl(270_30%_50%)]' },
  private:          { bg: 'bg-[hsl(34_25%_90%)]',   text: 'text-[hsl(34_40%_35%)]',   dot: 'bg-[hsl(34_40%_40%)]' },
};

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    yoga: 'Yoga',
    reformer_pilates: 'Reformer',
    sound_healing: 'Sound',
    private: 'Private',
  };
  return map[cat] ?? cat;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SlotCard({
  slot,
  isPast,
  onSelect,
}: {
  slot: PublicSlot;
  isPast: boolean;
  onSelect: (slot: PublicSlot) => void;
}) {
  const style = CATEGORY_STYLE[slot.category] ?? CATEGORY_STYLE.yoga;
  const full = slot.spots_left === 0;

  return (
    <button
      disabled={isPast || full}
      onClick={() => onSelect(slot)}
      className={`w-full text-left rounded-xl border p-3 transition-all duration-150 ${
        isPast || full
          ? 'opacity-40 cursor-not-allowed border-border bg-muted/30'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-sm cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${isPast || full ? 'opacity-40' : ''}`} />
        <span className={`text-[10px] font-medium uppercase tracking-wider ${isPast || full ? 'text-muted-foreground' : style.text}`}>
          {categoryLabel(slot.category)}
        </span>
      </div>
      <p className="text-xs font-semibold text-foreground leading-snug mb-1">{slot.class_name}</p>
      <p className="text-[11px] text-muted-foreground">{formatTime(slot.start_time)} · {slot.duration_minutes} min</p>
      {!isPast && (
        <p className={`text-[11px] mt-1 font-medium ${full ? 'text-destructive' : 'text-muted-foreground'}`}>
          {full ? 'Full' : `${slot.spots_left} spot${slot.spots_left === 1 ? '' : 's'} left`}
        </p>
      )}
    </button>
  );
}

function WeekGrid({
  slots,
  loading,
  monday,
  onPrev,
  onNext,
  onSelect,
}: {
  slots: PublicSlot[];
  loading: boolean;
  monday: Date;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (slot: PublicSlot) => void;
}) {
  const days = getWeekDays(monday);
  const now = nowPH();
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
    <div className="flex flex-col h-full">
      {/* Week nav */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button
          onClick={onPrev}
          disabled={isCurrentWeek}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium text-foreground">{weekLabel}</p>
        <button
          onClick={onNext}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Mobile: vertical list */}
          <div className="md:hidden space-y-4">
            {days.map((day) => {
              const dateStr = toDateStr(day);
              const daySlots = slotsByDay[dateStr] ?? [];
              const header = formatDayHeader(day);
              return (
                <div key={dateStr}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{header.short} {header.num}</span>
                    {daySlots.length === 0 && <span className="text-xs text-muted-foreground/60">No classes</span>}
                  </div>
                  <div className="space-y-2">
                    {daySlots.map((slot) => {
                      const slotDT = new Date(`${slot.class_date}T${slot.start_time}+08:00`);
                      return (
                        <SlotCard key={slot.id} slot={slot} isPast={slotDT < now} onSelect={onSelect} />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: 7-column grid */}
          <div className="hidden md:grid grid-cols-7 gap-2">
            {days.map((day) => {
              const dateStr = toDateStr(day);
              const daySlots = slotsByDay[dateStr] ?? [];
              const header = formatDayHeader(day);
              return (
                <div key={dateStr} className="min-w-0">
                  <div className="text-center mb-2">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{header.short}</p>
                    <p className="text-sm font-semibold text-foreground">{header.num}</p>
                  </div>
                  <div className="space-y-2">
                    {daySlots.length === 0 && (
                      <div className="h-8 rounded-lg border border-dashed border-border" />
                    )}
                    {daySlots.map((slot) => {
                      const slotDT = new Date(`${slot.class_date}T${slot.start_time}+08:00`);
                      return (
                        <SlotCard key={slot.id} slot={slot} isPast={slotDT < now} onSelect={onSelect} />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {slots.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              No classes scheduled this week — follow{' '}
              <a
                href="https://www.instagram.com/yogatayoelnido/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                @yogatayoelnido
              </a>{' '}
              to stay updated.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function BookingModal({ open, preselectedSlot, onClose }: BookingModalProps) {
  const [step, setStep] = useState<'pick' | 'form' | 'done'>(preselectedSlot ? 'form' : 'pick');
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(preselectedSlot);

  const [monday, setMonday] = useState<Date>(() => getMondayOfWeek(nowPH()));
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // Sync preselectedSlot when modal reopens
  useEffect(() => {
    if (open) {
      if (preselectedSlot) {
        setSelectedSlot(preselectedSlot);
        setStep('form');
      } else {
        setStep('pick');
        setSelectedSlot(null);
      }
      setName('');
      setPhone('');
      setEmail('');
      setFormError('');
      setWhatsappUrl('');
    }
  }, [open, preselectedSlot]);

  // Fetch slots for current week view
  const fetchSlots = useCallback(async (mon: Date) => {
    setLoadingSlots(true);
    try {
      const weekParam = toDateStr(mon);
      const res = await fetch(`/api/public/classes?week=${weekParam}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots ?? []);
      }
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (open && step === 'pick') {
      fetchSlots(monday);
    }
  }, [open, step, monday, fetchSlots]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  function handleSelectSlot(slot: PublicSlot) {
    setSelectedSlot(slot);
    setStep('form');
  }

  function handleBack() {
    setStep('pick');
    setSelectedSlot(null);
    setFormError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;

    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlot.id,
          client_name: name.trim(),
          client_phone: phone.trim(),
          client_email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setWhatsappUrl(data.whatsapp_url);
      setStep('done');
    } catch {
      setFormError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Book a class"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-3xl bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {step === 'form' && !preselectedSlot && (
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Back to schedule"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {step === 'pick' && 'Choose a class'}
                {step === 'form' && 'Reserve your spot'}
                {step === 'done' && 'You\'re on the list!'}
              </h2>
              {step === 'pick' && (
                <p className="text-xs text-muted-foreground">Select a class from the schedule below</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden px-6 py-5">

          {/* Step 1 — Pick a slot */}
          {step === 'pick' && (
            <WeekGrid
              slots={slots}
              loading={loadingSlots}
              monday={monday}
              onPrev={() => setMonday((m) => { const p = new Date(m); p.setDate(p.getDate() - 7); return p; })}
              onNext={() => setMonday((m) => { const n = new Date(m); n.setDate(n.getDate() + 7); return n; })}
              onSelect={handleSelectSlot}
            />
          )}

          {/* Step 2 — Form */}
          {step === 'form' && selectedSlot && (
            <div className="h-full overflow-y-auto space-y-5">
              {/* Slot summary */}
              <div className={`rounded-xl p-4 ${CATEGORY_STYLE[selectedSlot.category]?.bg ?? 'bg-muted'}`}>
                <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${CATEGORY_STYLE[selectedSlot.category]?.text ?? 'text-foreground'}`}>
                  {categoryLabel(selectedSlot.category)}
                </p>
                <p className="text-base font-semibold text-foreground">{selectedSlot.class_name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatSlotDate(selectedSlot)} · {formatTime(selectedSlot.start_time)} · {selectedSlot.duration_minutes} min
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  PHP {selectedSlot.price_php.toLocaleString()}
                </p>
                {selectedSlot.notes && (
                  <p className="text-xs text-muted-foreground mt-1.5 italic">{selectedSlot.notes}</p>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="bm-name">
                    Full name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="bm-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="bm-phone">
                    Phone number <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="bm-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="bm-email">
                    Email address <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="bm-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Studio reminders */}
                <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground text-xs mb-1">Before you come</p>
                  <p>· Arrive 5–10 minutes early</p>
                  <p>· Bring water · Wear comfortable clothes</p>
                  <p>· Mats and props available on-site</p>
                </div>

                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Reserving…</>
                  ) : (
                    'Reserve my spot'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Step 3 — Confirmation */}
          {step === 'done' && selectedSlot && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-1">You&apos;re on the list!</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedSlot.class_name} · {formatSlotDate(selectedSlot)} · {formatTime(selectedSlot.start_time)}
                </p>
              </div>

              <div className="max-w-sm rounded-xl border border-border bg-card p-5 text-left space-y-3 w-full">
                <p className="text-sm text-foreground font-medium">Next step: confirm via WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  To lock in your spot and arrange payment, send us a quick message. We&apos;ll confirm within minutes.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] hover:bg-[#20BD5C] text-white font-medium text-sm py-3 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message us on WhatsApp
                </a>
              </div>

              <p className="text-xs text-muted-foreground">See you on the mat 🌿</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
