'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import {
  getFinanceEntries,
  addFinanceEntry,
  deleteFinanceEntry,
  type FinanceEntry,
} from '@/utils/supabase/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

const STREAMS = ['yoga', 'fnb', 'boutique', 'other'] as const;
const STREAM_LABELS: Record<string, string> = { yoga: 'Yoga', fnb: 'F&B', boutique: 'Boutique', other: 'Other' };

type EntryType = 'revenue' | 'expense';

interface Props {
  user: User;
  type: EntryType;
}

function formatCurrency(v: number) {
  return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  const [year, month] = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

export default function FinanceEntriesPage({ user: _user, type }: Props) {
  const { currentTenant } = useTenant();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [date, setDate]         = useState('');
  const [stream, setStream]     = useState<typeof STREAMS[number]>('yoga');
  const [category, setCategory] = useState('');
  const [amount, setAmount]     = useState('');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const title = type === 'revenue' ? 'Revenue' : 'Expenses';

  const load = async () => {
    if (!currentTenant) return;
    setLoading(true);
    const supabase = createClient();
    const all = await getFinanceEntries(supabase, currentTenant.id);
    setEntries(all.filter(e => e.type === type));
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentTenant, type]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    setError(null);
    setSaving(true);
    try {
      const supabase = createClient();
      await addFinanceEntry(supabase, {
        tenant_id: currentTenant.id,
        date,
        type,
        stream,
        category,
        amount: parseFloat(amount),
        notes: notes || null,
      });
      setDialogOpen(false);
      setDate(''); setStream('yoga'); setCategory(''); setAmount(''); setNotes('');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    const supabase = createClient();
    await deleteFinanceEntry(supabase, id);
    await load();
  };

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {entries.length} entries · total {formatCurrency(total)}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add {type === 'revenue' ? 'Revenue' : 'Expense'}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground text-sm">
            No {title.toLowerCase()} entries yet. Click "Add" to record one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Stream</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                    <td className="px-4 py-3">{formatDate(e.date)}</td>
                    <td className="px-4 py-3">{STREAM_LABELS[e.stream] ?? e.stream}</td>
                    <td className="px-4 py-3 capitalize">{e.category}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(e.amount))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add {title.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="date">Month</Label>
              <Input
                id="date"
                type="month"
                value={date.slice(0, 7)}
                onChange={e => setDate(e.target.value + '-01')}
                required
              />
            </div>
            <div>
              <Label htmlFor="stream">Stream</Label>
              <Select value={stream} onValueChange={(v) => setStream(v as typeof STREAMS[number])}>
                <SelectTrigger id="stream">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STREAMS.map(s => (
                    <SelectItem key={s} value={s}>{STREAM_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder={type === 'revenue' ? 'e.g. classes, workshops' : 'e.g. staffing, rent'}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">{error}</div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
