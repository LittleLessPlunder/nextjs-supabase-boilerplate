'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getExpenses, getExpenseCategories, getVendors } from '@/utils/supabase/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown, ChevronRight, BarChart2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  date: string;
  vendor_name: string | null;
  vendor: { name: string; tin: string | null } | null;
  particulars: string;
  or_number: string | null;
  category: { name: string; is_cogs: boolean } | null;
  vat_amount: number;
  non_vat_amount: number;
  amount: number;
  payment_method: string | null;
  reimbursement_to: string | null;
  status: string;
  declarable_only: boolean;
}

type GroupBy = 'category' | 'vendor' | 'payment_method' | 'month';

interface GroupRow {
  key: string;
  label: string;
  count: number;
  amount: number;
  vat: number;
  items: Expense[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function thisYearRange() {
  const y = new Date().getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

const COLORS = [
  '#A55437','#3D4028','#808368','#C4896B','#5A6040',
  '#D4A574','#2D3020','#B0B49A','#8B6914','#6B7A50',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExpensesReport({ user }: { user: User }) {
  const { currentTenant } = useTenant();

  const [expenses,   setExpenses]   = useState<Expense[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [vendors,    setVendors]    = useState<{ id: string; name: string }[]>([]);
  const [loading,    setLoading]    = useState(true);

  const range = thisYearRange();
  const [dateFrom,     setDateFrom]     = useState(range.from);
  const [dateTo,       setDateTo]       = useState(range.to);
  const [filterCat,    setFilterCat]    = useState('_all');
  const [filterVendor, setFilterVendor] = useState('_all');
  const [filterStatus, setFilterStatus] = useState('_all');
  const [filterDecl,   setFilterDecl]   = useState('_all');   // _all | ytw | decl
  const [groupBy,      setGroupBy]      = useState<GroupBy>('category');
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set());

  // ── Load master lists ────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTenant) return;
    const supabase = createClient();
    Promise.all([
      getExpenseCategories(supabase, currentTenant.id),
      getVendors(supabase, currentTenant.id),
    ]).then(([cats, vends]) => {
      setCategories(cats as any[]);
      setVendors(vends as any[]);
    });
  }, [currentTenant]);

  // ── Load expenses ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await getExpenses(supabase, currentTenant.id, {
        dateFrom:   dateFrom || undefined,
        dateTo:     dateTo   || undefined,
        categoryId: filterCat    !== '_all' ? filterCat    : undefined,
        status:     filterStatus !== '_all' ? filterStatus : undefined,
      });
      setExpenses(data as Expense[]);
      setExpanded(new Set());
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentTenant, dateFrom, dateTo, filterCat, filterStatus]);

  useEffect(() => { load(); }, [load]);

  // ── Client-side filters ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (filterVendor !== '_all') {
        const name = e.vendor?.name ?? e.vendor_name ?? '';
        if (!name.toLowerCase().includes(filterVendor.toLowerCase())) return false;
      }
      if (filterDecl === 'ytw')  return !e.declarable_only;
      if (filterDecl === 'decl') return  e.declarable_only;
      return true;
    });
  }, [expenses, filterVendor, filterDecl]);

  // ── Group ────────────────────────────────────────────────────────────────
  const groups: GroupRow[] = useMemo(() => {
    const map = new Map<string, GroupRow>();

    filtered.forEach(e => {
      let key = '';
      let label = '';

      if (groupBy === 'category') {
        key   = e.category?.name ?? 'Uncategorised';
        label = key;
      } else if (groupBy === 'vendor') {
        key   = e.vendor?.name ?? e.vendor_name ?? 'No vendor';
        label = key;
      } else if (groupBy === 'payment_method') {
        const pm = e.payment_method ?? 'Unknown';
        key   = pm === 'Reimbursement' && e.reimbursement_to ? `Reimb. → ${e.reimbursement_to}` : pm;
        label = key;
      } else if (groupBy === 'month') {
        const d = new Date(e.date);
        key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = d.toLocaleString('en-PH', { month: 'long', year: 'numeric' });
      }

      if (!map.has(key)) {
        map.set(key, { key, label, count: 0, amount: 0, vat: 0, items: [] });
      }
      const row = map.get(key)!;
      row.count++;
      row.amount += e.amount;
      row.vat    += e.vat_amount ?? 0;
      row.items.push(e);
    });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filtered, groupBy]);

  const grandTotal  = groups.reduce((s, g) => s + g.amount, 0);
  const grandVAT    = groups.reduce((s, g) => s + g.vat, 0);
  const grandCount  = groups.reduce((s, g) => s + g.count, 0);

  function toggleExpand(key: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ── Vendor search dropdown ───────────────────────────────────────────────
  const [vendorSearch, setVendorSearch] = useState('');
  const vendorOptions = useMemo(() =>
    vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase())).slice(0, 8),
    [vendors, vendorSearch]
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Expense Report</h1>
          <p className="text-sm text-muted-foreground">Group, filter and analyse expenses by any dimension</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">From</p>
              <DatePicker value={dateFrom} onChange={setDateFrom} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">To</p>
              <DatePicker value={dateTo} onChange={setDateTo} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Category</p>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Vendor</p>
              <Input
                placeholder="Search vendor…"
                value={filterVendor === '_all' ? '' : filterVendor}
                onChange={e => setFilterVendor(e.target.value || '_all')}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Type</p>
              <Select value={filterDecl} onValueChange={setFilterDecl}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All</SelectItem>
                  <SelectItem value="ytw">YTW only</SelectItem>
                  <SelectItem value="decl">Declaration only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group by tabs */}
      <div className="flex gap-2 mb-5">
        <p className="text-sm text-muted-foreground self-center mr-1">Group by:</p>
        {(['category','vendor','payment_method','month'] as GroupBy[]).map(g => (
          <Button
            key={g}
            size="sm"
            variant={groupBy === g ? 'default' : 'outline'}
            onClick={() => { setGroupBy(g); setExpanded(new Set()); }}
            className="capitalize"
          >
            {g === 'payment_method' ? 'Payment' : g}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">No expenses match the selected filters.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{groups.length} groups · {grandCount} entries</p>
              <p className="text-xl font-bold">{php(grandTotal)}</p>
              <p className="text-xs text-muted-foreground">Total expenses</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Claimable VAT input</p>
              <p className="text-xl font-bold text-green-700">{php(grandVAT)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Avg per entry</p>
              <p className="text-xl font-bold">{grandCount > 0 ? php(grandTotal / grandCount) : '—'}</p>
            </div>
          </div>

          {/* Bar chart */}
          {groups.length > 0 && (
            <Card className="mb-5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Amount by {groupBy === 'payment_method' ? 'payment method' : groupBy}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={groups.slice(0, 12)} margin={{ top: 4, right: 8, left: 8, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                      width={55}
                    />
                    <Tooltip
                      formatter={(v: any) => [php(Number(v)), 'Amount']}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                      {groups.slice(0, 12).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Breakdown table */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted text-left">
                    <th className="p-3 font-medium">
                      {groupBy === 'payment_method' ? 'Payment Method' : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                    </th>
                    <th className="p-3 font-medium text-right">Entries</th>
                    <th className="p-3 font-medium text-right">VAT</th>
                    <th className="p-3 font-medium text-right">Amount</th>
                    <th className="p-3 font-medium text-right">% of Total</th>
                    <th className="p-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g, gi) => {
                    const pct = grandTotal > 0 ? (g.amount / grandTotal) * 100 : 0;
                    const isOpen = expanded.has(g.key);
                    return (
                      <>
                        {/* Group row */}
                        <tr
                          key={g.key}
                          className="border-b hover:bg-muted/30 cursor-pointer"
                          onClick={() => toggleExpand(g.key)}
                        >
                          <td className="p-3 font-medium flex items-center gap-2">
                            {isOpen
                              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            }
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ background: COLORS[gi % COLORS.length] }}
                            />
                            {g.label}
                          </td>
                          <td className="p-3 text-right text-muted-foreground">{g.count}</td>
                          <td className="p-3 text-right text-green-700 text-xs">{g.vat > 0 ? php(g.vat) : '—'}</td>
                          <td className="p-3 text-right font-semibold">{php(g.amount)}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[gi % COLORS.length] }} />
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td />
                        </tr>

                        {/* Expanded detail rows */}
                        {isOpen && g.items.map(e => {
                          const vendorDisplay = e.vendor?.name ?? e.vendor_name ?? '—';
                          return (
                            <tr key={e.id} className="border-b bg-muted/20 text-xs">
                              <td className="pl-10 pr-3 py-2 text-muted-foreground">
                                <span className="text-foreground font-medium">{e.date}</span>
                                {' · '}
                                {e.particulars}
                                {e.declarable_only && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px]">Decl.</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right text-muted-foreground">{vendorDisplay}</td>
                              <td className="px-3 py-2 text-right text-green-700">{e.vat_amount > 0 ? php(e.vat_amount) : '—'}</td>
                              <td className="px-3 py-2 text-right">{php(e.amount)}</td>
                              <td className="px-3 py-2 text-right text-muted-foreground">
                                <span className={`px-1.5 py-0.5 rounded ${
                                  e.declarable_only ? 'bg-violet-100 text-violet-700' :
                                  e.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {e.declarable_only ? 'Decl.' : e.status}
                                </span>
                              </td>
                              <td />
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted font-semibold">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-right">{grandCount}</td>
                    <td className="p-3 text-right text-green-700">{php(grandVAT)}</td>
                    <td className="p-3 text-right">{php(grandTotal)}</td>
                    <td className="p-3 text-right text-muted-foreground">100%</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
