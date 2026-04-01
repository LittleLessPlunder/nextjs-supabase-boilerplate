'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { addSettlement, getSettlement, updateSettlement } from '@/utils/supabase/queries';
import { ArrowLeft } from '@phosphor-icons/react';
import { Loading } from '@/components/ui/loading';

function today() { return new Date().toISOString().split('T')[0]; }

interface Props { settlementId: string | null }

export default function AddSettlementForm({ settlementId }: Props) {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const isEdit = !!settlementId;

  const [form, setForm] = useState({
    date:      today(),
    amount:    '',
    reference: '',
    notes:     '',
  });
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!settlementId || !currentTenant) return;
    (async () => {
      try {
        const supabase = createClient();
        const s = await getSettlement(supabase, currentTenant.id, settlementId);
        setForm({
          date:      s.date ?? today(),
          amount:    s.amount != null ? String(s.amount) : '',
          reference: s.reference ?? '',
          notes:     s.notes ?? '',
        });
      } catch {
        toast({ title: 'Error', description: 'Could not load settlement.', variant: 'destructive' });
      } finally {
        setFetching(false);
      }
    })();
  }, [settlementId, currentTenant]);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTenant) return;
    if (!form.amount) {
      toast({ title: 'Validation', description: 'Amount is required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const payload = {
        tenant_id: currentTenant.id,
        date:      form.date,
        amount:    parseFloat(form.amount) || 0,
        reference: form.reference.trim() || null,
        notes:     form.notes.trim()     || null,
      };

      if (isEdit) {
        await updateSettlement(supabase, settlementId!, payload);
        toast({ title: 'Saved', description: 'Settlement updated.' });
      } else {
        await addSettlement(supabase, payload);
        toast({ title: 'Added', description: 'Settlement recorded.' });
      }
      router.push('/finance/settlements');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message ?? 'Failed to save.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <Loading />;

  return (
    <div className="container mx-auto max-w-lg mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/finance/settlements')}>
          <ArrowLeft weight="light" className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">
          {isEdit ? 'Edit Settlement' : 'Log Card Settlement'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settlement Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Record the total amount settled by the card terminal for the day.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Date *</Label>
                <DatePicker value={form.date} onChange={val => set('date', val)} />
              </div>
              <div>
                <Label>Settlement Amount (₱) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Terminal Reference / Batch No.</Label>
              <Input
                value={form.reference}
                onChange={e => set('reference', e.target.value)}
                placeholder="e.g. BATCH-20260329"
              />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any additional detail…"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Settlement'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/finance/settlements')}>
                Cancel
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
