'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import {
  ClassSlot,
  addClassSlot,
  updateClassSlot,
  getClassSlot,
} from '@/utils/supabase/queries';

type Category = ClassSlot['category'];

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'yoga',             label: 'Yoga / Mat Pilates' },
  { value: 'reformer_pilates', label: 'Reformer Pilates'   },
  { value: 'sound_healing',    label: 'Sound Healing'      },
  { value: 'private',          label: 'Private Session'    },
];

const DEFAULT_PRICE: Record<Category, number> = {
  yoga:             800,
  reformer_pilates: 1800,
  sound_healing:    1500,
  private:          4500,
};

const DURATION_OPTIONS = [45, 50, 60, 75, 90];

const CLASS_SUGGESTIONS: Record<Category, string[]> = {
  yoga: [
    'Vinyasa – Mellow Flow',
    'Vinyasa – Dynamic Flow',
    'Mat Pilates',
    'Ashtanga Foundations',
    'Primal Mobility',
    'HIIT Pilates',
    'Yin & Restore',
    'Breathwork',
  ],
  reformer_pilates: ['Reformer Pilates'],
  sound_healing:    ['Sound Healing'],
  private:          ['Private Session'],
};

interface FormData {
  class_name: string;
  class_date: string;
  start_time: string;
  duration_minutes: number;
  price_php: number;
  category: Category;
  teacher_name: string;
  max_capacity: number;
  notes: string;
}

const EMPTY_FORM: FormData = {
  class_name:       '',
  class_date:       '',
  start_time:       '09:00',
  duration_minutes: 60,
  price_php:        800,
  category:         'yoga',
  teacher_name:     '',
  max_capacity:     10,
  notes:            '',
};

interface ClassSlotFormProps {
  slotId: string | null;
  prefillDate?: string;   // YYYY-MM-DD from query param
}

export default function ClassSlotForm({ slotId, prefillDate }: ClassSlotFormProps) {
  const [form, setForm] = useState<FormData>({
    ...EMPTY_FORM,
    class_date: prefillDate ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!slotId);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (!slotId || !currentTenant) return;
    (async () => {
      try {
        const supabase = createClient();
        const slot = await getClassSlot(supabase, slotId);
        if (!slot || slot.tenant_id !== currentTenant.id) {
          toast({ title: 'Error', description: 'Class not found.', variant: 'destructive' });
          router.push('/classes');
          return;
        }
        setForm({
          class_name:       slot.class_name,
          class_date:       slot.class_date,
          start_time:       slot.start_time.slice(0, 5), // HH:MM
          duration_minutes: slot.duration_minutes,
          price_php:        slot.price_php,
          category:         slot.category,
          teacher_name:     slot.teacher_name ?? '',
          max_capacity:     slot.max_capacity,
          notes:            slot.notes ?? '',
        });
      } catch {
        toast({ title: 'Error', description: 'Failed to load class.', variant: 'destructive' });
      } finally {
        setFetching(false);
      }
    })();
  }, [slotId, currentTenant]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleCategoryChange(cat: Category) {
    setForm(prev => ({
      ...prev,
      category:  cat,
      price_php: DEFAULT_PRICE[cat],
      class_name: CLASS_SUGGESTIONS[cat][0] ?? '',
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTenant) { toast({ title: 'Error', description: 'No studio selected.', variant: 'destructive' }); return; }
    if (!form.class_name || !form.class_date || !form.start_time) {
      toast({ title: 'Validation', description: 'Class name, date, and start time are required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const payload = {
        class_name:       form.class_name,
        class_date:       form.class_date,
        start_time:       form.start_time + ':00',
        duration_minutes: form.duration_minutes,
        price_php:        form.price_php,
        category:         form.category,
        teacher_name:     form.teacher_name || null,
        max_capacity:     form.max_capacity,
        notes:            form.notes || null,
        is_active:        true,
      };

      if (slotId) {
        await updateClassSlot(supabase, slotId, payload);
        toast({ title: 'Updated', description: `${form.class_name} updated.` });
      } else {
        await addClassSlot(supabase, currentTenant.id, payload);
        toast({ title: 'Added', description: `${form.class_name} added to schedule.` });
      }
      router.push('/classes');
    } catch {
      toast({ title: 'Error', description: 'Failed to save class.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {slotId ? 'Edit class' : 'Add class'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {slotId ? 'Update the details below.' : 'Add a new class to the weekly schedule.'}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={v => handleCategoryChange(v as Category)}>
                <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class name */}
            <div className="space-y-1.5">
              <Label htmlFor="class_name">Class name</Label>
              <Input
                id="class_name"
                list="class-suggestions"
                value={form.class_name}
                onChange={e => set('class_name', e.target.value)}
                placeholder="e.g. Vinyasa – Mellow Flow"
                required
              />
              <datalist id="class-suggestions">
                {CLASS_SUGGESTIONS[form.category].map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            {/* Date + Time row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="class_date">Date</Label>
                <Input
                  id="class_date"
                  type="date"
                  value={form.class_date}
                  onChange={e => set('class_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start_time">Start time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={e => set('start_time', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Duration + Price row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duration (min)</Label>
                <Select
                  value={String(form.duration_minutes)}
                  onValueChange={v => set('duration_minutes', Number(v))}
                >
                  <SelectTrigger id="duration"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(d => (
                      <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price_php">Price (PHP)</Label>
                <Input
                  id="price_php"
                  type="number"
                  min={0}
                  step={50}
                  value={form.price_php}
                  onChange={e => set('price_php', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Teacher + Capacity row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="teacher_name">Teacher</Label>
                <Input
                  id="teacher_name"
                  value={form.teacher_name}
                  onChange={e => set('teacher_name', e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_capacity">Max capacity</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  min={1}
                  max={50}
                  value={form.max_capacity}
                  onChange={e => set('max_capacity', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="e.g. Bring your own mat"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : slotId ? 'Save changes' : 'Add class'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/classes')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
