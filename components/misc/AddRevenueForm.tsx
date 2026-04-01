'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { getConsignors, addRevenueEntry, updateRevenueEntry, getRevenueEntry } from '@/utils/supabase/queries';
import { ArrowLeft } from '@phosphor-icons/react';
import { Loading } from '@/components/ui/loading';

// ─── Constants ────────────────────────────────────────────────────────────────

const STREAMS = [
  { value: 'yoga',     label: 'Yoga / Pilates' },
  { value: 'fnb',      label: 'F&B' },
  { value: 'boutique', label: 'Boutique' },
];

const YOGA_CLASS_TYPES = [
  'Tourist Drop-in',
  'Local / Resident Drop-in',
  'Monthly Unlimited Pass',
  '5-Class Pass',
  'Mat Pilates',
  'Reformer Pilates',
  'Sound Healing',
  'Private Session',
  'Other',
];

const FNB_SOURCES = ['POS Report', 'Manual'];

function today() { return new Date().toISOString().split('T')[0]; }

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { revenueId: string | null }

export default function AddRevenueForm({ revenueId }: Props) {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const isEdit = !!revenueId;

  const [consignors,         setConsignors]         = useState<{ id: string; name: string }[]>([]);
  const [selectedConsignors, setSelectedConsignors] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving,   setSaving]   = useState(false);

  const [form, setForm] = useState({
    date:           today(),
    revenue_stream: 'yoga',
    amount:         '',
    // yoga
    class_type:     '',
    pax_count:      '',
    // fnb
    fnb_source:     'POS Report',
    // general
    notes:          '',
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // ── Load master data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTenant) return;
    (async () => {
      try {
        const supabase = createClient();
        const cList = await getConsignors(supabase, currentTenant.id);
        setConsignors(cList as { id: string; name: string }[]);

        if (revenueId) {
          const entry = await getRevenueEntry(supabase, currentTenant.id, revenueId);
          setForm({
            date:           entry.date ?? today(),
            revenue_stream: entry.revenue_stream ?? 'yoga',
            amount:         entry.amount != null ? String(entry.amount) : '',
            class_type:     entry.class_type ?? '',
            pax_count:      entry.pax_count != null ? String(entry.pax_count) : '',
            fnb_source:     entry.fnb_source ?? 'POS Report',
            notes:          entry.notes ?? '',
          });
          const ids = (entry.consignors ?? []).map((c: any) => c.vendor?.id).filter(Boolean);
          setSelectedConsignors(ids);
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setFetching(false);
      }
    })();
  }, [currentTenant, revenueId]);

  // ── Toggle consignor selection ──────────────────────────────────────────────
  function toggleConsignor(id: string) {
    setSelectedConsignors(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTenant) return;
    if (!form.amount) {
      toast({ title: 'Validation', description: 'Amount is required.', variant: 'destructive' });
      return;
    }
    if (form.revenue_stream === 'boutique' && selectedConsignors.length === 0) {
      toast({ title: 'Validation', description: 'Select at least one consignor.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload: any = {
        tenant_id:      currentTenant.id,
        date:           form.date,
        revenue_stream: form.revenue_stream,
        amount:         parseFloat(form.amount) || 0,
        notes:          form.notes.trim() || null,
        // stream-specific
        class_type: form.revenue_stream === 'yoga' ? (form.class_type || null) : null,
        pax_count:  form.revenue_stream === 'yoga' ? (parseInt(form.pax_count) || null) : null,
        fnb_source: form.revenue_stream === 'fnb'  ? form.fnb_source : null,
      };

      const consignorIds = form.revenue_stream === 'boutique' ? selectedConsignors : [];

      if (isEdit) {
        await updateRevenueEntry(supabase, revenueId!, payload, consignorIds);
        toast({ title: 'Updated', description: 'Revenue entry updated.' });
      } else {
        await addRevenueEntry(supabase, payload, consignorIds);
        toast({ title: 'Saved', description: 'Revenue recorded.' });
      }
      router.push('/finance/revenue');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message ?? 'Failed to save.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (fetching) return <Loading />;

  return (
    <div className="container mx-auto max-w-xl mt-6 pb-16">

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/finance/revenue')}>
          <ArrowLeft weight="light" className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit Revenue Entry' : 'Log Revenue'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">

        {/* ── Core fields ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Basic Info</CardTitle></CardHeader>
          <CardContent className="grid gap-4">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Date *</Label>
                <DatePicker value={form.date} onChange={val => set('date', val)} />
              </div>
              <div>
                <Label>Revenue Stream *</Label>
                <Select value={form.revenue_stream} onValueChange={v => set('revenue_stream', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STREAMS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Amount (₱) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00"
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Yoga/Pilates fields ───────────────────────────────────────────── */}
        {form.revenue_stream === 'yoga' && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Class Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Class Type</Label>
                <Select value={form.class_type} onValueChange={v => set('class_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                  <SelectContent>
                    {YOGA_CLASS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>No. of Pax</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.pax_count}
                  onChange={e => set('pax_count', e.target.value)}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── F&B fields ────────────────────────────────────────────────────── */}
        {form.revenue_stream === 'fnb' && (
          <Card>
            <CardHeader><CardTitle className="text-sm">F&B Details</CardTitle></CardHeader>
            <CardContent>
              <Label>Source</Label>
              <Select value={form.fnb_source} onValueChange={v => set('fnb_source', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FNB_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* ── Boutique consignors ───────────────────────────────────────────── */}
        {form.revenue_stream === 'boutique' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Consignors
                {selectedConsignors.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {selectedConsignors.length} selected
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {consignors.map(c => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm transition-colors ${
                      selectedConsignors.includes(c.id)
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedConsignors.includes(c.id)}
                      onChange={() => toggleConsignor(c.id)}
                      className="h-3.5 w-3.5 rounded"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              {consignors.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No consignors found. Add them via Finance → Vendors.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        <div>
          <Label>Notes (optional)</Label>
          <Input
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any additional detail…"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Revenue'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/finance/revenue')}>
            Cancel
          </Button>
        </div>

      </form>
    </div>
  );
}
