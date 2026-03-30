'use client'

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import {
  getRevenue, getExpenses, getSettlements, getExpenseCategories,
  getPnLSettings, upsertPnLSettings,
} from '@/utils/supabase/queries';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Deduction rates (per the YTW P&L template)
const VAT_RATE            = 0.12; // 12% of card settlements
const SERVICE_CHARGE_RATE = 0.08; // 8% of F&B revenue
const CARD_FEE_RATE       = 0.03; // 3% of card settlements

// ─── Helpers ─────────────────────────────────────────────────────────────────

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number) {
  return `${n.toFixed(2)}%`;
}

function monthRange(year: number, month: number) {
  const m = String(month).padStart(2, '0');
  const last = new Date(year, month, 0).getDate();
  return { from: `${year}-${m}-01`, to: `${year}-${m}-${last}` };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3 pb-1 border-b">
      {children}
    </h2>
  );
}

function LineRow({
  label, value, bold, sub, dimmed, color,
}: {
  label: string; value: number;
  bold?: boolean; sub?: boolean; dimmed?: boolean; color?: string;
}) {
  return (
    <div className={`flex justify-between items-center py-[5px] ${bold ? 'border-t mt-1 pt-2' : ''}`}>
      <span className={`text-sm ${sub ? 'pl-3' : ''} ${dimmed ? 'text-muted-foreground' : ''}`}>
        {label}
      </span>
      <span className={`text-sm tabular-nums ${bold ? 'font-bold' : ''} ${color ?? ''}`}>
        {php(value)}
      </span>
    </div>
  );
}

function EditableRow({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex justify-between items-center py-[5px]">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-36 h-7 text-sm text-right"
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PnLPage({ user }: { user: User }) {
  const { currentTenant } = useTenant();
  const now = new Date();

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Raw data
  const [revenue,     setRevenue]     = useState<any[]>([]);
  const [expenses,    setExpenses]    = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [categories,  setCategories]  = useState<any[]>([]);

  // Editable period fields
  const [revolving,   setRevolving]   = useState('0');
  const [metrobank,   setMetrobank]   = useState('0');
  const [cashOnHand,  setCashOnHand]  = useState('0');
  const [gcash,       setGcash]       = useState('0');

  // ── Data loading ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { from, to } = monthRange(year, month);

      const [rev, exp, set, cats, settings] = await Promise.all([
        getRevenue(supabase, currentTenant.id, { dateFrom: from, dateTo: to }),
        getExpenses(supabase, currentTenant.id, { dateFrom: from, dateTo: to }),
        getSettlements(supabase, currentTenant.id, { dateFrom: from, dateTo: to }),
        getExpenseCategories(supabase, currentTenant.id),
        getPnLSettings(supabase, currentTenant.id, year, month),
      ]);

      setRevenue(rev as any[]);
      setExpenses(exp as any[]);
      setSettlements(set as any[]);
      setCategories(cats as any[]);

      if (settings) {
        setRevolving(String(settings.initial_revolving_funds ?? 0));
        setMetrobank(String(settings.dist_metrobank ?? 0));
        setCashOnHand(String(settings.dist_cash ?? 0));
        setGcash(String(settings.dist_gcash ?? 0));
      } else {
        setRevolving('0'); setMetrobank('0'); setCashOnHand('0'); setGcash('0');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentTenant, year, month]);

  useEffect(() => { load(); }, [load]);

  // ── Save period settings ────────────────────────────────────────────────────
  async function handleSave() {
    if (!currentTenant) return;
    setSaving(true);
    try {
      await upsertPnLSettings(createClient(), {
        tenant_id:               currentTenant.id,
        period_year:             year,
        period_month:            month,
        initial_revolving_funds: parseFloat(revolving)  || 0,
        dist_metrobank:          parseFloat(metrobank)   || 0,
        dist_cash:               parseFloat(cashOnHand)  || 0,
        dist_gcash:              parseFloat(gcash)       || 0,
      });
      toast({ title: 'Saved', description: 'Period settings saved.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  // ── Period navigation ───────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  // ── Income calculations ─────────────────────────────────────────────────────
  const yogaTotal     = revenue.filter(r => r.revenue_stream === 'yoga')
    .reduce((s, r) => s + r.amount, 0);
  const fnbTotal      = revenue.filter(r => r.revenue_stream === 'fnb')
    .reduce((s, r) => s + r.amount, 0);
  const boutiqueTotal = revenue.filter(r => r.revenue_stream === 'boutique')
    .reduce((s, r) => s + r.amount, 0);
  const totalIncome   = yogaTotal + fnbTotal + boutiqueTotal;

  // ── Deductions ──────────────────────────────────────────────────────────────
  const totalSettled    = settlements.reduce((s, e) => s + e.amount, 0);
  const vatAmount       = totalSettled * VAT_RATE;
  const serviceCharge   = fnbTotal    * SERVICE_CHARGE_RATE;
  const cardFee         = totalSettled * CARD_FEE_RATE;
  const totalAfterTaxes = totalIncome - vatAmount - serviceCharge - cardFee;

  // ── Expenses (grouped by category, exclude declaration-only) ────────────────
  const expByCategory: Record<string, number> = {};
  expenses.filter((e: any) => !e.declarable_only).forEach(e => {
    const cat = e.category?.name ?? 'Other Expenses';
    expByCategory[cat] = (expByCategory[cat] ?? 0) + e.amount;
  });
  const totalExpenses = Object.values(expByCategory).reduce((s, v) => s + v, 0);

  // All DB categories in sort_order, then any uncategorised entries
  const dbCategoryNames = categories.map((c: any) => c.name as string);
  const orderedCategories = [
    ...dbCategoryNames,
    ...Object.keys(expByCategory).filter(c => !dbCategoryNames.includes(c)),
  ];

  // ── Profit ──────────────────────────────────────────────────────────────────
  const netProfit    = totalAfterTaxes - totalExpenses;
  const netProfitPct = totalAfterTaxes > 0 ? (netProfit / totalAfterTaxes) * 100 : 0;

  // ── Fund tracking ───────────────────────────────────────────────────────────
  const revolvingNum     = parseFloat(revolving) || 0;
  const fundsAfterPeriod = revolvingNum + netProfit;

  // ── Distribution ────────────────────────────────────────────────────────────
  const metrobankNum       = parseFloat(metrobank)  || 0;
  const cashNum            = parseFloat(cashOnHand) || 0;
  const gcashNum           = parseFloat(gcash)      || 0;
  const totalDistribution  = metrobankNum + cashNum + gcashNum;

  // ── Daily chart data ────────────────────────────────────────────────────────
  const dailyMap: Record<string, number> = {};
  revenue.forEach(r => {
    dailyMap[r.date] = (dailyMap[r.date] ?? 0) + r.amount;
  });
  const chartData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({
      day: parseInt(date.split('-')[2]),
      total,
    }));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Profit & Loss Report</h1>
          <p className="text-sm text-muted-foreground">
            Period of {MONTHS[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-muted-foreground">Loading P&L…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ══ LEFT COLUMN ══════════════════════════════════════════════════ */}
          <div className="space-y-5">

            {/* INCOME */}
            <div className="rounded-lg border p-4">
              <SectionTitle>Income</SectionTitle>
              <LineRow label="Yoga Classes"            value={yogaTotal}     sub dimmed />
              <LineRow label="Food and Beverage"       value={fnbTotal}      sub dimmed />
              <LineRow label="Other Income (Boutique)" value={boutiqueTotal} sub dimmed />
              <LineRow label="Returns & Discounts"     value={0}             sub dimmed />
              <LineRow label="Total Income"            value={totalIncome}   bold />
            </div>

            {/* DEDUCTIONS */}
            <div className="rounded-lg border p-4">
              <SectionTitle>Deductions</SectionTitle>
              <p className="text-xs text-muted-foreground mb-2">
                Card settlements this period: <span className="font-medium">{php(totalSettled)}</span>
              </p>
              <LineRow
                label="Less: VAT (12% of Card Sales)"
                value={vatAmount} sub dimmed
              />
              <LineRow
                label="Less: Service Charge (8% of F&B)"
                value={serviceCharge} sub dimmed
              />
              <LineRow
                label="Less: Card Sales Fee (3% of Card Sales)"
                value={cardFee} sub dimmed
              />
              <LineRow label="Total After Taxes" value={totalAfterTaxes} bold />
            </div>

            {/* EXPENSES */}
            <div className="rounded-lg border p-4">
              <SectionTitle>Expenses</SectionTitle>
              {orderedCategories.map(cat => (
                <LineRow
                  key={cat}
                  label={cat}
                  value={expByCategory[cat] ?? 0}
                  sub dimmed
                />
              ))}
              <LineRow label="Total Expenses" value={totalExpenses} bold />
            </div>

          </div>

          {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════ */}
          <div className="space-y-5">

            {/* SHAREHOLDER SCORES */}
            <div className="rounded-lg border p-4">
              <SectionTitle>Shareholder Scores</SectionTitle>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Sales **</p>
                  <p className="text-base font-bold tabular-nums">{php(totalAfterTaxes)}</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Costs</p>
                  <p className="text-base font-bold tabular-nums">{php(totalExpenses)}</p>
                </div>
                <div className={`rounded-md p-3 col-span-1 ${
                  netProfit >= 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-xs text-muted-foreground mb-0.5">Net Profit (PHP)</p>
                  <p className={`text-base font-bold tabular-nums ${
                    netProfit >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>{php(netProfit)}</p>
                </div>
                <div className={`rounded-md p-3 ${
                  netProfit >= 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-xs text-muted-foreground mb-0.5">Net Profit (%)</p>
                  <p className={`text-base font-bold ${
                    netProfit >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>{pct(netProfitPct)}</p>
                </div>
              </div>

              {/* Fund tracking */}
              <div className="border-t pt-3">
                <EditableRow
                  label="Initial Revolving Funds"
                  value={revolving}
                  onChange={setRevolving}
                />
                <div className="flex justify-between items-center py-[5px]">
                  <span className="text-sm text-muted-foreground">Profit / Loss of Period</span>
                  <span className={`text-sm font-semibold tabular-nums ${
                    netProfit >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>{php(netProfit)}</span>
                </div>
                <div className="flex justify-between items-center py-[5px] font-semibold border-t mt-1 pt-2">
                  <span className="text-sm">Funds After Profit / Loss</span>
                  <span className="text-sm tabular-nums">{php(fundsAfterPeriod)}</span>
                </div>
              </div>
            </div>

            {/* REVENUE TREND CHART */}
            <div className="rounded-lg border p-4">
              <SectionTitle>Revenue Trend of the Month</SectionTitle>
              {chartData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                  No revenue data for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v: any) => [php(Number(v)), 'Revenue']}
                      labelFormatter={(l) => `Day ${l}`}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ** Total revenue from {MONTHS[month - 1]} 1 to {MONTHS[month - 1]}{' '}
                {new Date(year, month, 0).getDate()}, {year}
              </p>
            </div>

            {/* FUND DISTRIBUTION */}
            <div className="rounded-lg border p-4">
              <SectionTitle>Distribution of Funds After Period</SectionTitle>
              <EditableRow label="Metrobank"    value={metrobank}  onChange={setMetrobank}  />
              <EditableRow label="Cash on Hand" value={cashOnHand} onChange={setCashOnHand} />
              <EditableRow label="GCash (YTW)"  value={gcash}      onChange={setGcash}      />
              <div className="flex justify-between items-center py-[5px] font-semibold border-t mt-1 pt-2">
                <span className="text-sm">Total</span>
                <span className="text-sm tabular-nums">{php(totalDistribution)}</span>
              </div>
            </div>

            {/* Save button */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving…' : 'Save Period Settings'}
            </Button>

          </div>
        </div>
      )}
    </div>
  );
}
