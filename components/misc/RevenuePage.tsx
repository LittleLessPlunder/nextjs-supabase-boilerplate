'use client'

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getRevenue, deleteRevenueEntry } from '@/utils/supabase/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenueEntry {
  id: string;
  date: string;
  revenue_stream: string;
  amount: number;
  class_type: string | null;
  pax_count: number | null;
  fnb_source: string | null;
  notes: string | null;
  consignors: { vendor: { id: string; name: string } | null }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STREAM_LABELS: Record<string, string> = {
  yoga: 'Yoga / Pilates', fnb: 'F&B', boutique: 'Boutique',
};
const STREAM_COLORS: Record<string, string> = {
  yoga:     'bg-blue-100 text-blue-800',
  fnb:      'bg-orange-100 text-orange-800',
  boutique: 'bg-purple-100 text-purple-800',
};

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function thisMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${last}` };
}

function entryDescription(e: RevenueEntry): string {
  if (e.revenue_stream === 'yoga') {
    const parts = [e.class_type, e.pax_count ? `${e.pax_count} pax` : null].filter(Boolean);
    return parts.join(' · ') || '—';
  }
  if (e.revenue_stream === 'fnb') return e.fnb_source ?? 'POS Report';
  if (e.revenue_stream === 'boutique') {
    const names = e.consignors.map(c => c.vendor?.name).filter(Boolean);
    return names.length > 0 ? names.join(', ') : '—';
  }
  return '—';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RevenuePage({ user }: { user: User }) {
  const router = useRouter();
  const { currentTenant } = useTenant();

  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const range = thisMonthRange();
  const [dateFrom,     setDateFrom]     = useState(range.from);
  const [dateTo,       setDateTo]       = useState(range.to);
  const [filterStream, setFilterStream] = useState('_all');

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await getRevenue(supabase, currentTenant.id, {
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo   || undefined,
        stream:   filterStream !== '_all' ? filterStream : undefined,
      });
      setEntries(data as RevenueEntry[]);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentTenant, dateFrom, dateTo, filterStream]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this revenue entry?')) return;
    try {
      await deleteRevenueEntry(createClient(), id);
      toast({ title: 'Deleted' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const total    = entries.reduce((s, e) => s + e.amount, 0);
  const byStream = ['yoga', 'fnb', 'boutique'].map(s => ({
    stream: s,
    total: entries.filter(e => e.revenue_stream === s).reduce((sum, e) => sum + e.amount, 0),
  })).filter(s => s.total > 0);

  return (
    <div className="container mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Revenue</h1>
          <p className="text-sm text-muted-foreground">Daily revenue log by stream</p>
        </div>
        <Button size="sm" onClick={() => router.push('/finance/revenue/add')}>
          <Plus className="h-4 w-4 mr-1.5" />Log Revenue
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">From</p>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">To</p>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Stream</p>
          <Select value={filterStream} onValueChange={setFilterStream}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All streams</SelectItem>
              <SelectItem value="yoga">Yoga / Pilates</SelectItem>
              <SelectItem value="fnb">F&B</SelectItem>
              <SelectItem value="boutique">Boutique</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        <div className="rounded-lg border p-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg font-bold">{php(total)}</p>
        </div>
        {byStream.map(s => (
          <div key={s.stream} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{STREAM_LABELS[s.stream]}</p>
            <p className="text-lg font-bold">{php(s.total)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No revenue entries for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted text-left">
                    <th className="p-2 font-medium">Date</th>
                    <th className="p-2 font-medium">Stream</th>
                    <th className="p-2 font-medium">Description</th>
                    <th className="p-2 font-medium text-right">Amount</th>
                    <th className="p-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 whitespace-nowrap text-muted-foreground">{e.date}</td>
                      <td className="p-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STREAM_COLORS[e.revenue_stream] ?? ''}`}>
                          {STREAM_LABELS[e.revenue_stream] ?? e.revenue_stream}
                        </span>
                      </td>
                      <td className="p-2 max-w-[260px] truncate text-muted-foreground" title={entryDescription(e)}>
                        {entryDescription(e)}
                      </td>
                      <td className="p-2 text-right font-semibold">{php(e.amount)}</td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => router.push(`/finance/revenue/edit/${e.id}`)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(e.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted font-semibold">
                    <td colSpan={3} className="p-2">Total ({entries.length} entries)</td>
                    <td className="p-2 text-right">{php(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
