'use client'

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getSettlements, deleteSettlement } from '@/utils/supabase/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { Plus, PencilSimple, Trash, CreditCard } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';

interface Settlement {
  id: string;
  date: string;
  amount: number;
  reference: string | null;
  notes: string | null;
}

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

export default function SettlementsPage({ user }: { user: User }) {
  const router = useRouter();
  const { currentTenant } = useTenant();

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  const range = thisMonthRange();
  const [dateFrom, setDateFrom] = useState(range.from);
  const [dateTo,   setDateTo]   = useState(range.to);

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await getSettlements(supabase, currentTenant.id, {
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo   || undefined,
      });
      setSettlements(data as Settlement[]);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentTenant, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string, date: string) {
    if (!confirm(`Delete settlement for ${date}?`)) return;
    try {
      await deleteSettlement(createClient(), id);
      toast({ title: 'Deleted' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  const total = settlements.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="container mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Card Settlements</h1>
          <p className="text-sm text-muted-foreground">Daily terminal settlement amounts pushed to bank</p>
        </div>
        <Button size="sm" onClick={() => router.push('/finance/settlements/add')}>
          <Plus weight="light" className="h-4 w-4 mr-1.5" />Log Settlement
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">From</p>
          <DatePicker value={dateFrom} onChange={setDateFrom} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">To</p>
          <DatePicker value={dateTo} onChange={setDateTo} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Total Settled</p>
          <p className="text-lg font-bold text-green-700">{php(total)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Entries</p>
          <p className="text-lg font-bold">{settlements.length}</p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Loading />
          ) : settlements.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <CreditCard weight="light" className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No settlements for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted text-left">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Reference</th>
                  <th className="p-3 font-medium">Notes</th>
                  <th className="p-3 font-medium text-right">Amount</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map(s => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{s.date}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{s.reference ?? '—'}</td>
                    <td className="p-3 text-muted-foreground max-w-[240px] truncate">{s.notes ?? '—'}</td>
                    <td className="p-3 text-right font-semibold text-green-700">{php(s.amount)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => router.push(`/finance/settlements/edit/${s.id}`)}>
                          <PencilSimple weight="light" className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(s.id, s.date)}>
                          <Trash weight="light" className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted font-semibold">
                  <td colSpan={3} className="p-3">Total ({settlements.length} settlements)</td>
                  <td className="p-3 text-right">{php(total)}</td>
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
