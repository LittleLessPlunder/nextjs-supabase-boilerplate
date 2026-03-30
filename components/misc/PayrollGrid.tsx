'use client'

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import {
  getEmployees, getPayrollEntries, upsertPayrollEntries,
  getExpenseCategories, getExpenses, addExpense,
} from '@/utils/supabase/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, AlertCircle, SendToBack, CheckCircle2 } from 'lucide-react';
import { RevenueStream } from '@/utils/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  given_name: string;
  surname: string | null;
  daily_rate: number | null;
  revenue_stream: RevenueStream | null;
}

interface PayrollRow {
  employee_id: string;
  employee_name: string;
  revenue_stream: RevenueStream | null;
  daily_rate: number;
  // inputs
  days_worked: string;
  ot_hours: string;
  rest_day_days: string;
  rest_day_ot_hours: string;
  regular_holiday_days: string;
  special_holiday_days: string;
  undertime_hours: string;
  allowances: string;
  sss_deduction: string;
  philhealth_deduction: string;
  pagibig_deduction: string;
  other_deductions: string;
}

interface Computed {
  regular_pay: number;
  ot_pay: number;
  rest_day_pay: number;
  rest_day_ot_pay: number;
  regular_holiday_pay: number;
  special_holiday_pay: number;
  gross_pay: number;
  undertime_deduction: number;
  total_deductions: number;
  net_pay: number;
}

// ─── DOLE Calculations ───────────────────────────────────────────────────────

function compute(row: PayrollRow): Computed {
  const r = (s: string) => parseFloat(s) || 0;
  const dr = row.daily_rate;
  const hr = dr / 8; // hourly rate

  const regular_pay          = dr * r(row.days_worked);
  const ot_pay               = hr * 1.25 * r(row.ot_hours);
  const rest_day_pay         = dr * 1.30 * r(row.rest_day_days);
  const rest_day_ot_pay      = (dr * 1.30 / 8) * 1.30 * r(row.rest_day_ot_hours);
  const regular_holiday_pay  = dr * 2.00 * r(row.regular_holiday_days);
  const special_holiday_pay  = dr * 1.30 * r(row.special_holiday_days);
  const undertime_deduction  = hr * r(row.undertime_hours);

  const gross_pay = regular_pay + ot_pay + rest_day_pay + rest_day_ot_pay +
    regular_holiday_pay + special_holiday_pay + r(row.allowances);

  const total_deductions = undertime_deduction +
    r(row.sss_deduction) + r(row.philhealth_deduction) +
    r(row.pagibig_deduction) + r(row.other_deductions);

  const net_pay = gross_pay - total_deductions;

  return {
    regular_pay, ot_pay, rest_day_pay, rest_day_ot_pay,
    regular_holiday_pay, special_holiday_pay,
    gross_pay, undertime_deduction, total_deductions, net_pay,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const STREAM_LABELS: Record<RevenueStream, string> = {
  fnb: 'F&B', yoga: 'Yoga', boutique: 'Boutique', general: 'General',
};

const STREAM_COLORS: Record<RevenueStream, string> = {
  fnb:      'bg-orange-100 text-orange-800',
  yoga:     'bg-blue-100 text-blue-800',
  boutique: 'bg-purple-100 text-purple-800',
  general:  'bg-gray-100 text-gray-700',
};

function getPeriodDates(year: number, month: number, period: 1 | 2) {
  const mm = String(month).padStart(2, '0');
  if (period === 1) {
    return { start: `${year}-${mm}-01`, end: `${year}-${mm}-15` };
  }
  const lastDay = new Date(year, month, 0).getDate();
  return { start: `${year}-${mm}-16`, end: `${year}-${mm}-${lastDay}` };
}

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function defaultRow(emp: Employee): PayrollRow {
  return {
    employee_id: emp.id,
    employee_name: [emp.given_name, emp.surname].filter(Boolean).join(' '),
    revenue_stream: emp.revenue_stream,
    daily_rate: emp.daily_rate ?? 0,
    days_worked: '', ot_hours: '', rest_day_days: '', rest_day_ot_hours: '',
    regular_holiday_days: '', special_holiday_days: '',
    undertime_hours: '', allowances: '',
    sss_deduction: '', philhealth_deduction: '', pagibig_deduction: '',
    other_deductions: '',
  };
}

function entryToRow(emp: Employee, entry: any): PayrollRow {
  const str = (n: number | null) => (n && n !== 0) ? String(n) : '';
  return {
    employee_id: emp.id,
    employee_name: [emp.given_name, emp.surname].filter(Boolean).join(' '),
    revenue_stream: emp.revenue_stream,
    daily_rate: emp.daily_rate ?? 0,
    days_worked:           str(entry.days_worked),
    ot_hours:              str(entry.ot_hours),
    rest_day_days:         str(entry.rest_day_days),
    rest_day_ot_hours:     str(entry.rest_day_ot_hours),
    regular_holiday_days:  str(entry.regular_holiday_days),
    special_holiday_days:  str(entry.special_holiday_days),
    undertime_hours:       str(entry.undertime_hours),
    allowances:            str(entry.allowances),
    sss_deduction:         str(entry.sss_deduction),
    philhealth_deduction:  str(entry.philhealth_deduction),
    pagibig_deduction:     str(entry.pagibig_deduction),
    other_deductions:      str(entry.other_deductions),
  };
}

// ─── Compact number input ────────────────────────────────────────────────────

function N({
  value, onChange, placeholder = '0',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      type="number"
      min="0"
      step="any"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-7 w-20 text-xs px-1.5 text-right"
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { year: number; month: number; period: 1 | 2 }

export default function PayrollGrid({ year, month, period }: Props) {
  const router = useRouter();
  const { currentTenant } = useTenant();

  const [rows, setRows]       = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [posting, setPosting] = useState(false);
  const [isPosted, setIsPosted] = useState(false);

  const { start, end } = getPeriodDates(year, month, period);
  const lastDay = new Date(year, month, 0).getDate();
  const periodLabel = period === 1
    ? `1–15 ${MONTHS[month - 1]} ${year}`
    : `16–${lastDay} ${MONTHS[month - 1]} ${year}`;

  // ── Load employees + existing entries ──────────────────────────────────────
  useEffect(() => {
    if (!currentTenant) return;
    (async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const [{ employees }, existingRaw] = await Promise.all([
          getEmployees(supabase, currentTenant.id),
          getPayrollEntries(supabase, currentTenant.id, start, end),
        ]);

        const active = (employees ?? []).filter((e: any) => e.is_active);
        const existing: Record<string, any> = {};
        (existingRaw ?? []).forEach((e: any) => { existing[e.employee_id] = e; });

        setRows(active.map((emp: Employee) =>
          existing[emp.id] ? entryToRow(emp, existing[emp.id]) : defaultRow(emp)
        ));

        // Check if already posted to expenses
        const existingExpenses = await getExpenses(supabase, currentTenant.id, {
          dateFrom: start, dateTo: end,
        });
        const payrollTag = `[PAYROLL] ${start}`;
        setIsPosted(existingExpenses.some((e: any) => e.notes?.startsWith(payrollTag)));
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load payroll data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [currentTenant, start, end]);

  // ── Update a single field ──────────────────────────────────────────────────
  const update = useCallback((idx: number, field: keyof PayrollRow, value: string) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!currentTenant) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const entries = rows.map(row => {
        const c = compute(row);
        const n = (s: string) => parseFloat(s) || 0;
        return {
          tenant_id:             currentTenant.id,
          employee_id:           row.employee_id,
          period_start:          start,
          period_end:            end,
          days_worked:           n(row.days_worked),
          ot_hours:              n(row.ot_hours),
          rest_day_days:         n(row.rest_day_days),
          rest_day_ot_hours:     n(row.rest_day_ot_hours),
          regular_holiday_days:  n(row.regular_holiday_days),
          special_holiday_days:  n(row.special_holiday_days),
          undertime_hours:       n(row.undertime_hours),
          allowances:            n(row.allowances),
          sss_deduction:         n(row.sss_deduction),
          philhealth_deduction:  n(row.philhealth_deduction),
          pagibig_deduction:     n(row.pagibig_deduction),
          other_deductions:      n(row.other_deductions),
          gross_pay:             c.gross_pay,
          total_deductions:      c.total_deductions,
          net_pay:               c.net_pay,
          updated_at:            new Date().toISOString(),
        };
      });
      await upsertPayrollEntries(supabase, entries);
      toast({ title: 'Saved', description: 'Payroll entries saved successfully.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message ?? 'Failed to save.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  // ── Post payroll to expenses ───────────────────────────────────────────────
  async function handlePost() {
    if (!currentTenant) return;

    const totalGross = rows.map(compute).reduce((s, c) => s + c.gross_pay, 0);
    if (totalGross === 0) {
      toast({ title: 'Nothing to post', description: 'Save payroll entries first.', variant: 'destructive' });
      return;
    }
    if (isPosted) {
      if (!confirm('This period is already posted to Expenses. Post again and create a duplicate?')) return;
    }

    setPosting(true);
    try {
      const supabase = createClient();

      // Find the Salaries & Wages category
      const categories = await getExpenseCategories(supabase, currentTenant.id);
      const swCat = (categories as any[]).find(c => c.name === 'Salaries & Wages');
      if (!swCat) {
        toast({
          title: 'Category not found',
          description: 'Add a "Salaries & Wages" expense category first.',
          variant: 'destructive',
        });
        return;
      }

      await addExpense(supabase, {
        tenant_id:   currentTenant.id,
        date:        end,
        category_id: swCat.id,
        amount:      totalGross,
        particulars: `Payroll ${periodLabel} — ${rows.length} employee${rows.length !== 1 ? 's' : ''}`,
        status:      'paid',
        notes:       `[PAYROLL] ${start} to ${end} — ${rows.length} employees, gross ${php(totalGross)}`,
      });

      setIsPosted(true);
      toast({
        title: 'Posted to Expenses',
        description: `${php(totalGross)} added as Salaries & Wages for ${periodLabel}.`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message ?? 'Failed to post.', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  }

  // ── Summary totals ─────────────────────────────────────────────────────────
  const allComputed = rows.map(compute);

  function sumField(field: keyof Computed) {
    return allComputed.reduce((acc, c) => acc + c[field], 0);
  }

  const summaryByStream = (['fnb', 'yoga', 'boutique', 'general'] as RevenueStream[]).map(stream => {
    const streamRows = rows.filter(r => r.revenue_stream === stream);
    const streamComputed = streamRows.map(compute);
    return {
      stream,
      count: streamRows.length,
      gross: streamComputed.reduce((a, c) => a + c.gross_pay, 0),
      deductions: streamComputed.reduce((a, c) => a + c.total_deductions, 0),
      net: streamComputed.reduce((a, c) => a + c.net_pay, 0),
    };
  }).filter(s => s.count > 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="p-8 text-muted-foreground">Loading payroll data...</div>;

  return (
    <div className="container mx-auto px-4 pb-16">

      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/payroll')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Payroll Run</h1>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {period === 1 ? 'SSS deducted this period' : 'PhilHealth + Pag-IBIG deducted this period'}
          </span>
          {isPosted && (
            <span className="flex items-center gap-1 text-xs text-green-700 font-medium bg-green-50 border border-green-200 px-2 py-1 rounded-md">
              <CheckCircle2 className="h-3 w-3" /> Posted to P&L
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePost}
            disabled={posting || saving}
          >
            <SendToBack className="h-3.5 w-3.5 mr-1.5" />
            {posting ? 'Posting…' : 'Post to P&L'}
          </Button>
          <Button onClick={handleSave} disabled={saving || posting} size="sm">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Grid */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <AlertCircle className="h-8 w-8" />
          <p>No active employees found. Add employees first.</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/employees')}>
            Go to Employees
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted border-b">
                {/* Identity */}
                <th className="p-2 text-left font-medium sticky left-0 bg-muted min-w-[160px]">Employee</th>
                <th className="p-2 text-left font-medium min-w-[70px]">Stream</th>
                <th className="p-2 text-right font-medium min-w-[80px]">Daily Rate</th>
                {/* Earnings inputs */}
                <th className="p-2 text-center font-medium min-w-[80px] border-l">Days<br/>Worked</th>
                <th className="p-2 text-center font-medium min-w-[80px]">OT<br/>Hours</th>
                <th className="p-2 text-center font-medium min-w-[80px]">Rest Day<br/>(days)</th>
                <th className="p-2 text-center font-medium min-w-[80px]">Rest Day<br/>OT (hrs)</th>
                <th className="p-2 text-center font-medium min-w-[80px]">Reg. Holiday<br/>(days)</th>
                <th className="p-2 text-center font-medium min-w-[80px]">Spl. Holiday<br/>(days)</th>
                <th className="p-2 text-center font-medium min-w-[80px]">Allowances</th>
                {/* Deductions inputs */}
                <th className="p-2 text-center font-medium min-w-[80px] border-l">Undertime<br/>(hrs)</th>
                {period === 1
                  ? <th className="p-2 text-center font-medium min-w-[80px]">SSS</th>
                  : <>
                      <th className="p-2 text-center font-medium min-w-[80px]">PhilHealth</th>
                      <th className="p-2 text-center font-medium min-w-[80px]">Pag-IBIG</th>
                    </>
                }
                <th className="p-2 text-center font-medium min-w-[80px]">Other<br/>Deductions</th>
                {/* Computed */}
                <th className="p-2 text-right font-medium min-w-[100px] border-l bg-green-50">Gross Pay</th>
                <th className="p-2 text-right font-medium min-w-[100px] bg-red-50">Total Ded.</th>
                <th className="p-2 text-right font-medium min-w-[100px] bg-blue-50">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const c = compute(row);
                const missingRate = row.daily_rate === 0;
                return (
                  <tr key={row.employee_id} className="border-b hover:bg-muted/30">
                    {/* Identity */}
                    <td className="p-2 sticky left-0 bg-white font-medium">
                      {row.employee_name}
                      {missingRate && (
                        <span className="ml-1 text-orange-500" title="No daily rate set">⚠</span>
                      )}
                    </td>
                    <td className="p-2">
                      {row.revenue_stream
                        ? <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STREAM_COLORS[row.revenue_stream]}`}>
                            {STREAM_LABELS[row.revenue_stream]}
                          </span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="p-2 text-right text-muted-foreground">
                      {row.daily_rate ? php(row.daily_rate) : <span className="text-orange-500">Not set</span>}
                    </td>
                    {/* Earnings inputs */}
                    <td className="p-1 text-center border-l"><N value={row.days_worked}          onChange={v => update(i, 'days_worked', v)} /></td>
                    <td className="p-1 text-center"><N value={row.ot_hours}              onChange={v => update(i, 'ot_hours', v)} /></td>
                    <td className="p-1 text-center"><N value={row.rest_day_days}         onChange={v => update(i, 'rest_day_days', v)} /></td>
                    <td className="p-1 text-center"><N value={row.rest_day_ot_hours}     onChange={v => update(i, 'rest_day_ot_hours', v)} /></td>
                    <td className="p-1 text-center"><N value={row.regular_holiday_days}  onChange={v => update(i, 'regular_holiday_days', v)} /></td>
                    <td className="p-1 text-center"><N value={row.special_holiday_days}  onChange={v => update(i, 'special_holiday_days', v)} /></td>
                    <td className="p-1 text-center"><N value={row.allowances}            onChange={v => update(i, 'allowances', v)} /></td>
                    {/* Deductions inputs */}
                    <td className="p-1 text-center border-l"><N value={row.undertime_hours}        onChange={v => update(i, 'undertime_hours', v)} /></td>
                    {period === 1
                      ? <td className="p-1 text-center"><N value={row.sss_deduction}        onChange={v => update(i, 'sss_deduction', v)} /></td>
                      : <>
                          <td className="p-1 text-center"><N value={row.philhealth_deduction} onChange={v => update(i, 'philhealth_deduction', v)} /></td>
                          <td className="p-1 text-center"><N value={row.pagibig_deduction}    onChange={v => update(i, 'pagibig_deduction', v)} /></td>
                        </>
                    }
                    <td className="p-1 text-center"><N value={row.other_deductions}      onChange={v => update(i, 'other_deductions', v)} /></td>
                    {/* Computed */}
                    <td className="p-2 text-right font-medium bg-green-50">{php(c.gross_pay)}</td>
                    <td className="p-2 text-right font-medium bg-red-50">{php(c.total_deductions)}</td>
                    <td className="p-2 text-right font-semibold bg-blue-50">{php(c.net_pay)}</td>
                  </tr>
                );
              })}

              {/* Totals row */}
              <tr className="border-t-2 bg-muted font-semibold">
                <td className="p-2 sticky left-0 bg-muted" colSpan={3}>TOTAL ({rows.length} employees)</td>
                <td colSpan={period === 1 ? 8 : 9} className="border-l" />
                <td className="p-2 text-right bg-green-100">{php(sumField('gross_pay'))}</td>
                <td className="p-2 text-right bg-red-100">{php(sumField('total_deductions'))}</td>
                <td className="p-2 text-right bg-blue-100">{php(sumField('net_pay'))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary by revenue stream */}
      {summaryByStream.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Summary by Revenue Stream
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {summaryByStream.map(s => (
              <div key={s.stream} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STREAM_COLORS[s.stream]}`}>
                    {STREAM_LABELS[s.stream]}
                  </span>
                  <span className="text-xs text-muted-foreground">{s.count} employee{s.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross</span>
                    <span className="font-medium">{php(s.gross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deductions</span>
                    <span className="font-medium text-red-600">−{php(s.deductions)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-semibold">Net Pay</span>
                    <span className="font-bold text-blue-700">{php(s.net)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grand total */}
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-center justify-between">
            <span className="font-semibold text-blue-900">Total Net Payroll — {periodLabel}</span>
            <span className="text-xl font-bold text-blue-700">{php(sumField('net_pay'))}</span>
          </div>
        </div>
      )}

      {/* DOLE reference */}
      <div className="mt-8 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
        <p className="font-medium mb-1">DOLE Rate Reference</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 sm:grid-cols-3">
          <span>Regular OT: +25% of hourly rate</span>
          <span>Rest day: +30% of daily rate</span>
          <span>Rest day OT: +30% of rest day rate</span>
          <span>Regular holiday (worked): 200% of daily rate</span>
          <span>Special holiday (worked): 130% of daily rate</span>
          <span>Undertime: deducted at hourly rate</span>
        </div>
      </div>

    </div>
  );
}
