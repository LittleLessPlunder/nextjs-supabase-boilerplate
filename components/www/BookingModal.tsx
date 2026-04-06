'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ──────────────────────────────────────────────────────────────────

interface YogaClass {
  id: string;
  time: string;
  name: string;
  duration: string;
  instructor: string;
  slots: number;
}

interface BookingForm {
  fullName: string;
  phone: string;
  email: string;
}

type Step = 'calendar' | 'form' | 'confirm';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAILY_CLASSES: YogaClass[] = [
  { id: 'sunrise', time: '06:30', name: 'Sunrise Yoga', duration: '60 min', instructor: 'Open', slots: 8 },
  { id: 'hatha', time: '09:00', name: 'Hatha Flow', duration: '75 min', instructor: 'Open', slots: 10 },
  { id: 'pilates', time: '17:30', name: 'Pilates', duration: '60 min', instructor: 'Open', slots: 6 },
  { id: 'yin', time: '19:00', name: 'Yin & Meditation', duration: '90 min', instructor: 'Open', slots: 8 },
];

const PAYMAYA_LINK = 'https://paymaya.me/yogatayo'; // placeholder — replace with actual

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekDays(anchor: Date): Date[] {
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isPastSlot(day: Date, time: string): boolean {
  const now = new Date();
  if (day < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return true;
  if (isSameDay(day, now)) {
    const [h, m] = time.split(':').map(Number);
    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    return slotDate < now;
  }
  return false;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function CalendarStep({
  onSelect,
}: {
  onSelect: (day: Date, cls: YogaClass) => void;
}) {
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const days = getWeekDays(weekAnchor);

  const prevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
    setSelectedDay(d);
  };
  const nextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
    setSelectedDay(d);
  };

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevWeek} className="p-2 hover:opacity-60 transition-opacity" aria-label="Previous week">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="font-label text-[11px] tracking-[0.2em] uppercase text-ytw-dark/60">
          {MONTH_NAMES[days[0].getMonth()]} {days[0].getDate()} — {MONTH_NAMES[days[6].getMonth()]} {days[6].getDate()}, {days[0].getFullYear()}
        </span>
        <button onClick={nextWeek} className="p-2 hover:opacity-60 transition-opacity" aria-label="Next week">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Day tabs */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {days.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const isSel = isSameDay(day, selectedDay);
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
          return (
            <button
              key={i}
              onClick={() => !isPast && setSelectedDay(day)}
              disabled={isPast}
              className={`
                flex flex-col items-center py-2 px-1 transition-colors duration-200 rounded
                ${isPast ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}
                ${isSel && !isPast ? 'bg-ytw-terracotta text-white' : 'hover:bg-ytw-terracotta/10'}
              `}
            >
              <span className="font-label text-[9px] tracking-[0.15em] uppercase mb-1">{DAY_LABELS[i]}</span>
              <span className={`font-display font-light text-[18px] leading-none ${isToday && !isSel ? 'text-ytw-terracotta' : ''}`}>
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Class list */}
      <div className="space-y-2">
        {DAILY_CLASSES.map((cls) => {
          const past = isPastSlot(selectedDay, cls.time);
          return (
            <button
              key={cls.id}
              onClick={() => !past && onSelect(selectedDay, cls)}
              disabled={past}
              className={`
                w-full flex items-center gap-4 px-5 py-4 border text-left transition-all duration-200
                ${past
                  ? 'border-ytw-dark/10 opacity-35 cursor-not-allowed'
                  : 'border-ytw-dark/15 hover:border-ytw-terracotta hover:bg-ytw-terracotta/5 cursor-pointer'
                }
              `}
            >
              <span className="font-label text-ytw-terracotta text-[12px] tracking-wide w-12 shrink-0">
                {cls.time}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-ytw-dark text-[14px] font-medium">{cls.name}</p>
                <p className="font-label text-ytw-dark/40 text-[10px] tracking-[0.15em] uppercase mt-0.5">
                  {cls.duration} · {cls.slots} spots
                </p>
              </div>
              {!past && (
                <span className="font-label text-ytw-terracotta text-[10px] tracking-[0.2em] uppercase shrink-0">
                  Book →
                </span>
              )}
              {past && (
                <span className="font-label text-ytw-dark/30 text-[10px] tracking-[0.15em] uppercase shrink-0">
                  Past
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormStep({
  selectedDay,
  selectedClass,
  onBack,
  onSubmit,
}: {
  selectedDay: Date;
  selectedClass: YogaClass;
  onBack: () => void;
  onSubmit: (form: BookingForm) => void;
}) {
  const [form, setForm] = useState<BookingForm>({ fullName: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Partial<BookingForm>>({});

  const validate = (): boolean => {
    const errs: Partial<BookingForm> = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!form.phone.trim()) errs.phone = 'Required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const dateStr = `${DAY_LABELS[(selectedDay.getDay() + 6) % 7]}, ${MONTH_NAMES[selectedDay.getMonth()]} ${selectedDay.getDate()}`;

  return (
    <div>
      {/* Summary */}
      <div className="bg-ytw-terracotta/8 border border-ytw-terracotta/20 px-5 py-4 mb-8">
        <p className="font-label text-ytw-terracotta text-[10px] tracking-[0.2em] uppercase mb-1">Your class</p>
        <p className="font-sans text-ytw-dark text-[15px] font-medium">{selectedClass.name}</p>
        <p className="font-label text-ytw-dark/50 text-[11px] tracking-[0.15em] uppercase mt-1">
          {dateStr} · {selectedClass.time} · {selectedClass.duration}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {(
          [
            { key: 'fullName', label: 'Full name', type: 'text', placeholder: 'Maria Santos' },
            { key: 'phone', label: 'Phone number', type: 'tel', placeholder: '+63 917 000 0000' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'maria@example.com' },
          ] as const
        ).map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label className="block font-label text-[10px] tracking-[0.2em] uppercase text-ytw-dark/50 mb-2">
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className={`
                w-full px-4 py-3 border bg-white font-sans text-[15px] text-ytw-dark placeholder:text-ytw-dark/25
                outline-none transition-colors duration-200
                ${errors[key] ? 'border-red-400' : 'border-ytw-dark/15 focus:border-ytw-terracotta'}
              `}
            />
            {errors[key] && (
              <p className="font-label text-red-500 text-[10px] tracking-[0.15em] mt-1">{errors[key]}</p>
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-none px-6 py-3 border border-ytw-dark/20 font-label text-[11px] tracking-[0.2em] uppercase text-ytw-dark/60 hover:border-ytw-dark/40 transition-colors duration-200"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-ytw-terracotta text-white font-label text-[11px] tracking-[0.22em] uppercase hover:bg-ytw-cognac transition-colors duration-200"
          >
            Continue to payment →
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmStep({
  selectedDay,
  selectedClass,
  form,
  onClose,
}: {
  selectedDay: Date;
  selectedClass: YogaClass;
  form: BookingForm;
  onClose: () => void;
}) {
  const dateStr = `${DAY_LABELS[(selectedDay.getDay() + 6) % 7]}, ${MONTH_NAMES[selectedDay.getMonth()]} ${selectedDay.getDate()}`;

  useEffect(() => {
    const params = new URLSearchParams({
      description: `${selectedClass.name} – ${dateStr} ${selectedClass.time}`,
      name: form.fullName,
      email: form.email,
      phone: form.phone,
    });
    const url = `${PAYMAYA_LINK}?${params.toString()}`;
    const timer = setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedClass, dateStr, form]);

  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-ytw-terracotta/15 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C25C3E" strokeWidth="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <p className="font-label text-ytw-terracotta text-[10px] tracking-[0.3em] uppercase mb-3">Almost there!</p>
      <h3 className="font-display font-light text-ytw-dark text-[28px] mb-4">Opening payment…</h3>
      <p className="font-sans text-ytw-dark/55 text-[14px] leading-relaxed mb-6 max-w-xs mx-auto">
        We're redirecting you to PayMaya to complete your booking for{' '}
        <strong className="text-ytw-dark">{selectedClass.name}</strong> on {dateStr}.
      </p>
      <p className="font-label text-ytw-dark/35 text-[10px] tracking-[0.2em] uppercase mb-8">
        Window not opening?
      </p>
      <a
        href={PAYMAYA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-ytw-terracotta text-white font-label text-[11px] tracking-[0.22em] uppercase px-8 py-3 hover:bg-ytw-cognac transition-colors duration-200"
      >
        Pay via PayMaya
      </a>
      <div className="mt-6">
        <button
          onClick={onClose}
          className="font-label text-ytw-dark/35 text-[10px] tracking-[0.2em] uppercase hover:text-ytw-dark/60 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [step, setStep] = useState<Step>('calendar');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<YogaClass | null>(null);
  const [form, setForm] = useState<BookingForm | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const reset = useCallback(() => {
    setStep('calendar');
    setSelectedDay(new Date());
    setSelectedClass(null);
    setForm(null);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(reset, 300);
  }, [onClose, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!mounted) return null;

  const stepTitles: Record<Step, string> = {
    calendar: 'Book a class',
    form: 'Your details',
    confirm: 'Confirmation',
  };

  const modal = (
    <div
      className={`fixed inset-0 z-50 flex items-end md:items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ytw-dark/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={`relative bg-ytw-offwhite w-full md:max-w-lg max-h-[92vh] md:max-h-[85vh] flex flex-col transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-8'}`}
        role="dialog"
        aria-modal
        aria-label="Book a class"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-ytw-dark/10 shrink-0">
          <div>
            <p className="font-label text-ytw-terracotta text-[9px] tracking-[0.3em] uppercase mb-0.5">
              Yoga Tayo
            </p>
            <h2 className="font-display font-light text-ytw-dark text-[22px]">
              {stepTitles[step]}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-ytw-dark/40 hover:text-ytw-dark transition-colors duration-200"
            aria-label="Close booking"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6">
          {step === 'calendar' && (
            <CalendarStep
              onSelect={(day, cls) => {
                setSelectedDay(day);
                setSelectedClass(cls);
                setStep('form');
              }}
            />
          )}
          {step === 'form' && selectedClass && (
            <FormStep
              selectedDay={selectedDay}
              selectedClass={selectedClass}
              onBack={() => setStep('calendar')}
              onSubmit={(f) => { setForm(f); setStep('confirm'); }}
            />
          )}
          {step === 'confirm' && selectedClass && form && (
            <ConfirmStep
              selectedDay={selectedDay}
              selectedClass={selectedClass}
              form={form}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Step indicator */}
        <div className="shrink-0 px-7 py-4 border-t border-ytw-dark/8 flex gap-1.5">
          {(['calendar', 'form', 'confirm'] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-0.5 flex-1 transition-colors duration-400 ${s === step ? 'bg-ytw-terracotta' : step === 'confirm' || (step === 'form' && s === 'calendar') ? 'bg-ytw-terracotta/40' : 'bg-ytw-dark/15'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
