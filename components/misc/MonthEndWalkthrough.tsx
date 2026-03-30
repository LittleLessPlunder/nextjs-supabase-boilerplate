'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  getExpenses,
  getRevenue,
  getMonthEndClose,
  upsertMonthEndClose,
} from '@/utils/supabase/queries';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Plus,
  Trash2,
  TrendingUp,
  Receipt,
  Store,
  CreditCard,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  date: string;
  amount: number;
  vat_amount: number;
  status: string;
  declarable_only: boolean;
  category: { name: string; is_cogs: boolean } | null;
}

interface RevenueEntry {
  id: string;
  date: string;
  amount: number;
  revenue_stream: string;
}

interface SetAside {
  id: string;
  label: string;
  amount: number;
}

type CloseStatus = 'draft' | 'reviewing' | 'locked';
type SaveState = 'idle' | 'saving' | 'saved';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function periodBounds(period: string) {
  const [y, m] = period.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    dateFrom: `${period}-01`,
    dateTo: `${period}-${String(lastDay).padStart(2, '0')}`,
  };
}

const STREAM_LABELS: Record<string, string> = {
  yoga: 'Yoga / Pilates',
  fnb: 'F&B',
  boutique: 'Boutique',
};

const STREAM_COLORS: Record<string, string> = {
  yoga: 'bg-blue-100 text-blue-800',
  fnb: 'bg-orange-100 text-orange-800',
  boutique: 'bg-purple-100 text-purple-800',
};

function SectionNumber({ n }: { n: number }) {
  return (
    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
      {n}
    </div>
  );
}

function StatusBadge({ status }: { status: CloseStatus }) {
  if (status === 'locked') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        <Lock className="h-3 w-3" /> Locked
      </span>
    );
  }
  if (status === 'reviewing') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        Under Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
      Draft
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MonthEndWalkthrough({
  user,
  period,
}: {
  user: User;
  period: string;
}) {
  const router = useRouter();
  const { currentTenant } = useTenant();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Editable state ──────────────────────────────────────────────────────────
  const [cashActual, setCashActual] = useState(0);
  const [gcashActual, setGcashActual] = useState(0);
  const [metrobankActual, setMetrobankActual] = useState(0);
  const [setAsides, setSetAsides] = useState<SetAside[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<CloseStatus>('draft');
  const [noSetAsidesNeeded, setNoSetAsidesNeeded] = useState(false);

  // ── Save state ──────────────────────────────────────────────────────────────
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTenant) return;
    const supabase = createClient();
    const { dateFrom, dateTo } = periodBounds(period);
    Promise.all([
      getExpenses(supabase, currentTenant.id, { dateFrom, dateTo }),
      getRevenue(supabase, currentTenant.id, { dateFrom, dateTo }),
      getMonthEndClose(supabase, currentTenant.id, period),
    ])
      .then(([expData, revData, closeRecord]) => {
        setExpenses(expData as Expense[]);
        setRevenue(revData as RevenueEntry[]);
        if (closeRecord) {
          setCashActual(closeRecord.cash_actual ?? 0);
          setGcashActual(closeRecord.gcash_actual ?? 0);
          setMetrobankActual(closeRecord.metrobank_actual ?? 0);
          setSetAsides(
            (closeRecord.set_asides ?? []).map((sa: { label: string; amount: number }, i: number) => ({
              id: String(Date.now() + i),
              label: sa.label,
              amount: sa.amount,
            }))
          );
          setNotes(closeRecord.notes ?? '');
          setStatus(closeRecord.status ?? 'draft');
        }
      })
      .catch((err) => {
        console.error(err);
        toast({ title: 'Error loading data', variant: 'destructive' });
      })
      .finally(() => setDataLoading(false));
  }, [currentTenant, period]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const periodLabel = useMemo(
    () => new Date(period + '-02').toLocaleString('en-PH', { month: 'long', year: 'numeric' }),
    [period]
  );

  const ytwExpenses = useMemo(() => expenses.filter((e) => !e.declarable_only), [expenses]);
  const declExpenses = useMemo(() => expenses.filter((e) => e.declarable_only), [expenses]);
  const unpaidExpenses = useMemo(() => ytwExpenses.filter((e) => e.status === 'Unpaid'), [ytwExpenses]);

  const totalRevenue = useMemo(() => revenue.reduce((s, r) => s + r.amount, 0), [revenue]);
  const totalExpenses = useMemo(() => ytwExpenses.reduce((s, e) => s + e.amount, 0), [ytwExpenses]);
  const netIncome = totalRevenue - totalExpenses;

  const revenueByStream = useMemo(() => {
    const acc: Record<string, { count: number; total: number }> = {};
    for (const r of revenue) {
      if (!acc[r.revenue_stream]) acc[r.revenue_stream] = { count: 0, total: 0 };
      acc[r.revenue_stream].count += 1;
      acc[r.revenue_stream].total += r.amount;
    }
    return acc;
  }, [revenue]);

  const expensesByCategory = useMemo(() => {
    const acc: Record<string, { count: number; total: number }> = {};
    for (const e of ytwExpenses) {
      const key = e.category?.name ?? 'Uncategorized';
      if (!acc[key]) acc[key] = { count: 0, total: 0 };
      acc[key].count += 1;
      acc[key].total += e.amount;
    }
    return acc;
  }, [ytwExpenses]);

  const totalActual = cashActual + gcashActual + metrobankActual;
  const totalSetAsides = setAsides.reduce((s, sa) => s + sa.amount, 0);
  const netCashAvailable = totalActual - totalSetAsides;
  const balanceDiff = totalActual - netIncome;

  // ── Auto-save ────────────────────────────────────────────────────────────────
  const save = useCallback(
    async (overrides?: Record<string, unknown>) => {
      if (!currentTenant) return;
      setSaveState('saving');
      const supabase = createClient();
      try {
        await upsertMonthEndClose(supabase, {
          tenant_id: currentTenant.id,
          period,
          status,
          cash_actual: cashActual,
          gcash_actual: gcashActual,
          metrobank_actual: metrobankActual,
          set_asides: setAsides.map(({ label, amount }) => ({ label, amount })),
          notes,
          ...(overrides ?? {}),
        });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch (err) {
        console.error(err);
        setSaveState('idle');
        toast({ title: 'Failed to save', variant: 'destructive' });
      }
    },
    [currentTenant, period, status, cashActual, gcashActual, metrobankActual, setAsides, notes]
  );

  const triggerDebounce = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(), 1500);
  }, [save]);

  // Trigger auto-save when editable fields change (skip on initial load)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (dataLoading) return;
    triggerDebounce();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cashActual, gcashActual, metrobankActual, setAsides, notes]);

  // ── Set-asides helpers ───────────────────────────────────────────────────────
  function addSetAside() {
    setSetAsides((prev) => [...prev, { id: String(Date.now()), label: '', amount: 0 }]);
  }

  function updateSetAside(id: string, field: 'label' | 'amount', value: string | number) {
    setSetAsides((prev) =>
      prev.map((sa) => (sa.id === id ? { ...sa, [field]: value } : sa))
    );
  }

  function removeSetAside(id: string) {
    setSetAsides((prev) => prev.filter((sa) => sa.id !== id));
  }

  function suggestVat() {
    const vatTotal = ytwExpenses.reduce((s, e) => s + (e.vat_amount ?? 0), 0);
    const existing = setAsides.find((sa) => sa.label === 'VAT Payable');
    if (existing) {
      setSetAsides((prev) =>
        prev.map((sa) => (sa.id === existing.id ? { ...sa, amount: vatTotal } : sa))
      );
    } else {
      setSetAsides((prev) => [
        ...prev,
        { id: String(Date.now()), label: 'VAT Payable', amount: vatTotal },
      ]);
    }
  }

  // ── Status actions ───────────────────────────────────────────────────────────
  async function markUnderReview() {
    setStatus('reviewing');
    await save({ status: 'reviewing' });
    toast({ title: 'Marked as Under Review' });
  }

  async function softLock() {
    setStatus('locked');
    await save({
      status: 'locked',
      locked_at: new Date().toISOString(),
      locked_by: user.id,
    });
    toast({ title: `${periodLabel} is now soft-locked.` });
  }

  async function unlock() {
    setStatus('reviewing');
    await save({ status: 'reviewing', locked_at: null, locked_by: null });
    toast({ title: 'Period unlocked.' });
  }

  const isLocked = status === 'locked';

  // ── Difference color ─────────────────────────────────────────────────────────
  function diffColor(diff: number) {
    const abs = Math.abs(diff);
    if (abs === 0) return 'text-green-700 font-semibold';
    if (abs < 500) return 'text-amber-600 font-semibold';
    return 'text-red-600 font-semibold';
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/finance/close')}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{periodLabel} Close</h1>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400 min-w-16 text-right">
          {saveState === 'saving' && (
            <span className="flex items-center gap-1 justify-end">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          )}
          {saveState === 'saved' && <span className="text-green-600">Saved</span>}
        </div>
      </div>

      {isLocked && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
            <Lock className="h-4 w-4" />
            This period is soft-locked. Editing will generate a warning.
          </div>
          <Button size="sm" variant="outline" onClick={unlock} className="gap-1.5">
            <Unlock className="h-3.5 w-3.5" /> Unlock
          </Button>
        </div>
      )}

      {/* ── Section 1 — Revenue Review ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary">
            <SectionNumber n={1} />
            Revenue Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Revenue encoded: {revenue.length} entries
            </div>
            <div className="text-lg font-bold text-gray-900">{php(totalRevenue)}</div>
          </div>

          {Object.keys(STREAM_LABELS).length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-500">Stream</th>
                  <th className="text-right py-2 font-medium text-gray-500">Entries</th>
                  <th className="text-right py-2 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(STREAM_LABELS).map(([key, label]) => {
                  const row = revenueByStream[key];
                  if (!row) return null;
                  return (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STREAM_COLORS[key]}`}>
                          {label}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-600">{row.count}</td>
                      <td className="py-2 text-right font-medium">{php(row.total)}</td>
                    </tr>
                  );
                })}
                {Object.entries(revenueByStream)
                  .filter(([key]) => !STREAM_LABELS[key])
                  .map(([key, row]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2 text-gray-600">{key}</td>
                      <td className="py-2 text-right text-gray-600">{row.count}</td>
                      <td className="py-2 text-right font-medium">{php(row.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {revenue.length === 0 && (
            <p className="text-sm text-gray-400 italic">No revenue entries for this period.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2 — Expense Review ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary">
            <SectionNumber n={2} />
            Expense Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {ytwExpenses.length} YTW expense{ytwExpenses.length !== 1 ? 's' : ''}
            </span>
            <div className="text-lg font-bold text-gray-900">{php(totalExpenses)}</div>
          </div>

          {Object.keys(expensesByCategory).length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-500">Category</th>
                  <th className="text-right py-2 font-medium text-gray-500">Entries</th>
                  <th className="text-right py-2 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(expensesByCategory)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([cat, row]) => (
                    <tr key={cat} className="border-b last:border-0">
                      <td className="py-2 text-gray-700">{cat}</td>
                      <td className="py-2 text-right text-gray-600">{row.count}</td>
                      <td className="py-2 text-right font-medium">{php(row.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {unpaidExpenses.length > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {unpaidExpenses.length} expense{unpaidExpenses.length !== 1 ? 's' : ''} still marked
                Unpaid — resolve before closing.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              All expenses paid ✓
            </div>
          )}

          {declExpenses.length > 0 && (
            <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm text-violet-700">
              Declaration-only: {declExpenses.length} entr{declExpenses.length !== 1 ? 'ies' : 'y'} ·{' '}
              {php(declExpenses.reduce((s, e) => s + e.amount, 0))} not included in P&amp;L
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 3 — Account Balances ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary">
            <SectionNumber n={3} />
            Account Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" /> Cash on Hand
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={cashActual}
                onChange={(e) => setCashActual(parseFloat(e.target.value) || 0)}
                disabled={isLocked}
                className="text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" /> GCash
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={gcashActual}
                onChange={(e) => setGcashActual(parseFloat(e.target.value) || 0)}
                disabled={isLocked}
                className="text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <Store className="h-3.5 w-3.5" /> Metrobank
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={metrobankActual}
                onChange={(e) => setMetrobankActual(parseFloat(e.target.value) || 0)}
                disabled={isLocked}
                className="text-right"
              />
            </div>
          </div>

          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Total actual</td>
                <td className="py-2 text-right font-medium">{php(totalActual)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">BMS net income</td>
                <td className="py-2 text-right font-medium">{php(netIncome)}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-gray-800">Difference</td>
                <td className={`py-2 text-right ${diffColor(balanceDiff)}`}>
                  {php(balanceDiff)}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-gray-400 italic">
            A non-zero difference may reflect opening balance, timing differences, or missing entries.
          </p>
        </CardContent>
      </Card>

      {/* ── Section 4 — Set-Asides ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary">
            <SectionNumber n={4} />
            Set-Asides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {setAsides.length > 0 && (
            <div className="space-y-2">
              {setAsides.map((sa) => (
                <div key={sa.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Label"
                    value={sa.label}
                    onChange={(e) => updateSetAside(sa.id, 'label', e.target.value)}
                    disabled={isLocked}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={sa.amount}
                    onChange={(e) => updateSetAside(sa.id, 'amount', parseFloat(e.target.value) || 0)}
                    disabled={isLocked}
                    className="w-36 text-right"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSetAside(sa.id)}
                    disabled={isLocked}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {setAsides.length === 0 && (
            <p className="text-sm text-gray-400 italic">No set-asides added yet.</p>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addSetAside}
              disabled={isLocked}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add set-aside
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={suggestVat}
              disabled={isLocked}
              className="text-violet-600 hover:text-violet-700 gap-1.5"
            >
              <TrendingUp className="h-3.5 w-3.5" /> Suggest VAT
            </Button>
          </div>

          <table className="w-full text-sm border-t pt-2">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Total set-asides</td>
                <td className="py-2 text-right font-medium">{php(totalSetAsides)}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-gray-800">Net cash available</td>
                <td className="py-2 text-right font-bold text-primary">{php(netCashAvailable)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── Section 5 — Sign-Off ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary">
            <SectionNumber n={5} />
            Sign-Off
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <Textarea
              placeholder="Any observations, adjustments, or remarks for this period…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLocked}
              rows={4}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Checklist</p>
            <ChecklistItem
              label={`Revenue encoded (${revenue.length} entries)`}
              ok={revenue.length > 0}
            />
            <ChecklistItem
              label="No unpaid expenses"
              ok={unpaidExpenses.length === 0}
            />
            <ChecklistItem
              label="Account balances entered"
              ok={totalActual > 0}
            />
            <ChecklistItem
              label="Set-asides reviewed"
              ok={setAsides.length > 0 || noSetAsidesNeeded}
            />
            {setAsides.length === 0 && !noSetAsidesNeeded && (
              <label className="flex items-center gap-2 ml-6 text-sm text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noSetAsidesNeeded}
                  onChange={(e) => setNoSetAsidesNeeded(e.target.checked)}
                  className="rounded"
                />
                No set-asides needed for this period
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!isLocked && status === 'draft' && (
              <Button onClick={markUnderReview} className="gap-2">
                <Receipt className="h-4 w-4" />
                Mark Under Review
              </Button>
            )}
            {!isLocked && status === 'reviewing' && (
              <Button onClick={softLock} className="gap-2 bg-green-700 hover:bg-green-800">
                <Lock className="h-4 w-4" />
                Soft Lock Period
              </Button>
            )}
            {!isLocked && (
              <Button variant="outline" onClick={() => save()} className="gap-2">
                {saveState === 'saving' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ChecklistItem ────────────────────────────────────────────────────────────

function ChecklistItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${ok ? 'text-green-700' : 'text-red-600'}`}>
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0" />
      )}
      {label}
    </div>
  );
}
