'use client'

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { format, parse, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { useTenant } from '@/utils/tenant-context';
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Warning } from '@phosphor-icons/react';
import { Loading } from '@/components/ui/loading';

// ─── Types ────────────────────────────────────────────────────────────────────

type PayslipStatus = 'draft' | 'approved' | 'paid';

interface FormData {
  contract_id: string;
  period_start: string;
  period_end: string;
  base_salary: string;
  total_allowances: string;
  total_overtime: string;
  total_holiday_pay: string;
  total_deductions: string;
  net_salary: string;
  status: PayslipStatus;
  payment_date: string;
}

interface WorkLog {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  schedule_type_name: string;
  schedule_type_multiplier: number;
  status: string;
}

interface Holiday {
  id: string;
  date: string;
  name: string;
  type: string; // 'regular' | 'special_non_working'
}

interface HolidayPayItem {
  date: string;
  name: string;
  type: string;
  worked: boolean;
  dailyRate: number;
  premium: number;
  multiplierLabel: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<PayslipStatus, PayslipStatus[]> = {
  draft: ['approved'],
  approved: ['paid'],
  paid: [],
};

const PAYSLIP_STATUSES: { value: PayslipStatus; label: string }[] = [
  { value: 'draft',    label: 'Draft'    },
  { value: 'approved', label: 'Approved' },
  { value: 'paid',     label: 'Paid'     },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Compute holiday pay premiums for a pay period.
 *
 * Assumptions (DOLE rules, monthly-paid employee):
 *  Regular holiday — not worked : 0 premium (already embedded in monthly salary)
 *  Regular holiday — worked     : +100% of daily rate (total = 200%)
 *  Special non-working — not worked : 0 premium
 *  Special non-working — worked     : +30% of daily rate (total = 130%)
 *
 * Daily rate = base_salary / 22 (standard for monthly-paid employees)
 */
function computeHolidayItems(
  holidays: Holiday[],
  workLogs: WorkLog[],
  baseSalary: number
): HolidayPayItem[] {
  const dailyRate = baseSalary / 22;
  const workedDates = new Set(
    workLogs.filter(l => l.status === 'approved').map(l => l.date)
  );

  return holidays.map(h => {
    const worked = workedDates.has(h.date);
    let premium = 0;
    let multiplierLabel = '';

    if (h.type === 'regular') {
      if (worked) {
        premium = dailyRate * 1.0; // extra 100%
        multiplierLabel = '+100% (worked)';
      } else {
        multiplierLabel = 'Included in salary';
      }
    } else {
      // special_non_working
      if (worked) {
        premium = dailyRate * 0.30; // extra 30%
        multiplierLabel = '+30% (worked)';
      } else {
        multiplierLabel = 'No additional pay';
      }
    }

    return { date: h.date, name: h.name, type: h.type, worked, dailyRate, premium, multiplierLabel };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddPayslipForm({
  payslipId,
  periodMonth,
  contractId,
}: {
  payslipId: string | null;
  periodMonth: string;
  contractId: string;
}) {
  const [formData, setFormData] = useState<FormData>({
    contract_id: contractId,
    period_start: '',
    period_end: '',
    base_salary: '',
    total_allowances: '0',
    total_overtime: '0',
    total_holiday_pay: '0',
    total_deductions: '0',
    net_salary: '0',
    status: 'draft',
    payment_date: '',
  });
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const router = useRouter();
  const { currentTenant } = useTenant();

  // ── Computed holiday breakdown ──────────────────────────────────────────────
  const holidayItems = useMemo(
    () => computeHolidayItems(holidays, workLogs, parseFloat(formData.base_salary) || 0),
    [holidays, workLogs, formData.base_salary]
  );

  const computedHolidayTotal = useMemo(
    () => holidayItems.reduce((s, i) => s + i.premium, 0),
    [holidayItems]
  );

  // ── Net salary ──────────────────────────────────────────────────────────────
  const calculateNetSalary = (overrideHoliday?: number) => {
    const base        = parseFloat(formData.base_salary)       || 0;
    const allowances  = parseFloat(formData.total_allowances)  || 0;
    const overtime    = parseFloat(formData.total_overtime)     || 0;
    const holidayPay  = overrideHoliday ?? (parseFloat(formData.total_holiday_pay) || 0);
    const deductions  = parseFloat(formData.total_deductions)  || 0;
    return base + allowances + overtime + holidayPay - deductions;
  };

  // ── Auto-apply computed holiday pay when holidays/work logs change ───────────
  useEffect(() => {
    if (holidays.length === 0) return;
    const total = computedHolidayTotal;
    setFormData(prev => ({
      ...prev,
      total_holiday_pay: total.toFixed(2),
      net_salary: calculateNetSalary(total).toFixed(2),
    }));
  }, [computedHolidayTotal]);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentTenant) loadData();
  }, [currentTenant, contractId, periodMonth]);

  const loadData = async () => {
    try {
      const supabase = createClient();
      let periodStart: string;
      let periodEnd: string;
      let employeeId: string;

      if (payslipId) {
        const { data: payslip, error: pe } = await supabase
          .from('Payslips')
          .select(`*, contract:EmployeeContracts(*, employee:Employees(id, given_name, surname), position:Positions(title), contract_type:ContractTypes(name))`)
          .eq('id', payslipId)
          .single();
        if (pe) throw pe;

        setFormData({
          contract_id:      payslip.contract_id,
          period_start:     payslip.period_start,
          period_end:       payslip.period_end,
          base_salary:      payslip.base_salary.toString(),
          total_allowances: payslip.total_allowances.toString(),
          total_overtime:   payslip.total_overtime.toString(),
          total_holiday_pay:(payslip.total_holiday_pay ?? 0).toString(),
          total_deductions: payslip.total_deductions.toString(),
          net_salary:       payslip.net_salary.toString(),
          status:           payslip.status as PayslipStatus,
          payment_date:     payslip.payment_date || '',
        });

        periodStart  = payslip.period_start;
        periodEnd    = payslip.period_end;
        employeeId   = payslip.contract.employee.id;
      } else {
        const { data: contract } = await supabase
          .from('EmployeeContracts')
          .select('*, position:Positions(title), contract_type:ContractTypes(name), employee:Employees(id)')
          .eq('id', contractId)
          .single();
        if (!contract) throw new Error('Contract not found');

        const monthStart = startOfMonth(parse(periodMonth, 'yyyyMM', new Date()));
        const monthEnd   = endOfMonth(monthStart);
        const nextMonth  = addMonths(monthStart, 1);

        periodStart = format(monthStart, 'yyyy-MM-dd');
        periodEnd   = format(monthEnd,   'yyyy-MM-dd');
        employeeId  = contract.employee.id;

        setFormData(prev => ({
          ...prev,
          period_start:  periodStart,
          period_end:    periodEnd,
          base_salary:   contract.base_salary.toString(),
          payment_date:  format(nextMonth, 'yyyy-MM-dd'),
        }));
      }

      // Fetch work logs and holidays in parallel
      const [logsRes, holidaysRes] = await Promise.all([
        supabase
          .from('WorkLogs')
          .select('*, schedule_type:WorkScheduleTypes(name, multiplier)')
          .eq('employee_id', employeeId)
          .gte('date', periodStart)
          .lte('date', periodEnd)
          .order('date', { ascending: true }),
        supabase
          .from('PublicHolidays')
          .select('id, date, name, type')
          .eq('tenant_id', currentTenant!.id)
          .gte('date', periodStart)
          .lte('date', periodEnd)
          .order('date', { ascending: true }),
      ]);

      if (logsRes.data) {
        setWorkLogs(logsRes.data.map(log => ({
          ...log,
          schedule_type_name:       log.schedule_type.name,
          schedule_type_multiplier: log.schedule_type.multiplier,
        })));
      }
      if (holidaysRes.data) {
        setHolidays(holidaysRes.data as Holiday[]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ── Overtime from work logs ─────────────────────────────────────────────────
  useEffect(() => {
    if (workLogs.length === 0) return;
    let totalOvertime = 0;
    workLogs.forEach(log => {
      if (log.status !== 'approved') return;
      const start   = new Date(`2000-01-01T${log.start_time}`);
      const end     = new Date(`2000-01-01T${log.end_time}`);
      const worked  = (end.getTime() - start.getTime()) / 60000 - log.break_duration;
      const otMins  = Math.max(0, worked - 480);
      const otHours = otMins / 60;
      const hourly  = (parseFloat(formData.base_salary) || 0) / (22 * 8);
      totalOvertime += otHours * hourly * log.schedule_type_multiplier;
    });
    setFormData(prev => ({
      ...prev,
      total_overtime: totalOvertime.toFixed(2),
    }));
  }, [workLogs]);

  // ── Input handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (['base_salary','total_allowances','total_overtime','total_holiday_pay','total_deductions'].includes(name)) {
        updated.net_salary = calculateNetSalary().toFixed(2);
      }
      return updated;
    });
  };

  const canTransitionTo = (s: PayslipStatus) =>
    formData.status === s || (STATUS_TRANSITIONS[formData.status] ?? []).includes(s);

  const handleStatusChange = (s: PayslipStatus) => {
    if (!canTransitionTo(s)) {
      toast({ title: 'Invalid Status Change', description: `Cannot move from ${formData.status} to ${s}`, variant: 'destructive' });
      return;
    }
    setFormData(prev => ({ ...prev, status: s }));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentTenant) { setError('No tenant selected'); return; }

    try {
      const supabase = createClient();
      const payload = {
        ...formData,
        tenant_id:        currentTenant.id,
        total_holiday_pay: parseFloat(formData.total_holiday_pay) || 0,
        net_salary:        calculateNetSalary(),
      };

      if (payslipId) {
        await supabase.from('Payslips').update(payload).eq('id', payslipId);
      } else {
        await supabase.from('Payslips').insert([payload]);
      }

      toast({ title: 'Success', description: `Payslip ${payslipId ? 'updated' : 'created'} successfully.` });
      router.push('/payslips');
    } catch (err) {
      console.error('Error saving payslip:', err);
      setError('Failed to save payslip');
    }
  };

  if (loading) return <Loading />;

  const workedHolidays   = holidayItems.filter(i => i.worked);
  const unworkedHolidays = holidayItems.filter(i => !i.worked);

  return (
    <div className="container mx-auto max-w-2xl space-y-4">

      {/* ── Main payslip form ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            {payslipId ? 'Edit Payslip' : 'New Payslip'}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({PAYSLIP_STATUSES.find(s => s.value === formData.status)?.label})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Period Start</Label>
                <DatePicker value={formData.period_start} onChange={val => setFormData(prev => ({ ...prev, period_start: val }))} />
              </div>
              <div>
                <Label>Period End</Label>
                <DatePicker value={formData.period_end} onChange={val => setFormData(prev => ({ ...prev, period_end: val }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Base Salary</Label>
                <Input name="base_salary" type="number" step="0.01" value={formData.base_salary} onChange={handleInputChange} readOnly required />
              </div>
              <div>
                <Label>Payment Date</Label>
                <DatePicker value={formData.payment_date} onChange={val => setFormData(prev => ({ ...prev, payment_date: val }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Total Allowances</Label>
                <Input name="total_allowances" type="number" step="0.01" value={formData.total_allowances} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Total Overtime</Label>
                <Input name="total_overtime" type="number" step="0.01" value={formData.total_overtime} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>
                  Holiday Pay
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">(auto-computed · editable)</span>
                </Label>
                <Input
                  name="total_holiday_pay"
                  type="number"
                  step="0.01"
                  value={formData.total_holiday_pay}
                  onChange={handleInputChange}
                  className={parseFloat(formData.total_holiday_pay) > 0 ? 'border-status-info-border bg-status-info/30' : ''}
                />
              </div>
              <div>
                <Label>Total Deductions</Label>
                <Input name="total_deductions" type="number" step="0.01" value={formData.total_deductions} onChange={handleInputChange} />
              </div>
            </div>

            <div>
              <Label>Net Salary</Label>
              <Input
                name="net_salary"
                type="number"
                step="0.01"
                value={calculateNetSalary().toFixed(2)}
                readOnly
                className="font-semibold bg-muted"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYSLIP_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value} disabled={!canTransitionTo(s.value)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <div className="text-status-danger-fg bg-status-danger p-2 rounded text-sm">{error}</div>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/payslips')}>Cancel</Button>
              <Button type="submit" disabled={formData.status === 'paid'}>Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Holiday Pay Breakdown ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Holiday Pay Breakdown</CardTitle>
          {holidays.length === 0 && (
            <p className="text-sm text-muted-foreground">No public holidays in this pay period.</p>
          )}
        </CardHeader>
        {holidays.length > 0 && (
          <CardContent className="p-0">
            <div className="overflow-x-auto -mx-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted text-left">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Holiday</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium text-center">Worked</th>
                  <th className="px-4 py-2 font-medium text-right">Premium</th>
                </tr>
              </thead>
              <tbody>
                {holidayItems.map(item => (
                  <tr key={item.date} className={`border-b ${item.premium > 0 ? 'bg-status-info/30' : ''}`}>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.date + 'T12:00:00'), 'MMM d')}
                    </td>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2">
                      {item.type === 'regular'
                        ? <span className="text-xs px-1.5 py-0.5 rounded bg-status-info text-status-info-fg">Regular</span>
                        : <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Special</span>
                      }
                    </td>
                    <td className="px-4 py-2 text-center">
                      {item.worked
                        ? <CheckCircle weight="light" className="h-4 w-4 text-finance-positive mx-auto" />
                        : <XCircle weight="light" className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      }
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {item.premium > 0
                        ? <span className="text-finance-neutral">{php(item.premium)}</span>
                        : <span className="text-muted-foreground text-xs">{item.multiplierLabel}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted font-semibold">
                  <td colSpan={4} className="px-4 py-2">
                    Total holiday premium
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({workedHolidays.length} worked · {unworkedHolidays.length} not worked)
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-finance-neutral">
                    {php(computedHolidayTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>

            {/* Pay rule reference */}
            <div className="px-4 py-3 border-t bg-muted/30 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">DOLE pay rules (monthly-paid)</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span><span className="font-medium text-finance-neutral">Regular</span> not worked → 100% in salary · worked → +100% premium</span>
                <span><span className="font-medium text-finance-pending">Special</span> not worked → no add'l pay · worked → +30% premium</span>
              </div>
            </div>

            {workedHolidays.length > 0 && (
              <div className="px-4 py-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                <Warning weight="light" className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                Verify work logs are marked <strong>approved</strong> for holiday premiums to be included.
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Work Logs ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Work Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {workLogs.length === 0
            ? <p className="px-4 pb-4 text-sm text-muted-foreground">No work logs for this period.</p>
            : (
              <div className="overflow-x-auto -mx-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted text-left">
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Schedule Type</th>
                    <th className="px-4 py-2 font-medium">Time</th>
                    <th className="px-4 py-2 font-medium">Break</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium text-right">Overtime</th>
                  </tr>
                </thead>
                <tbody>
                  {workLogs.map(log => {
                    const start   = new Date(`2000-01-01T${log.start_time}`);
                    const end     = new Date(`2000-01-01T${log.end_time}`);
                    const worked  = (end.getTime() - start.getTime()) / 60000 - log.break_duration;
                    const otHours = Math.max(0, worked - 480) / 60;
                    const isHoliday = holidays.some(h => h.date === log.date);
                    return (
                      <tr key={log.id} className={`border-b ${isHoliday ? 'bg-status-info/30' : ''}`}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {format(new Date(log.date + 'T12:00:00'), 'dd/MM/yyyy')}
                          {isHoliday && <span className="ml-1.5 text-xs px-1 py-0.5 rounded bg-status-info text-status-info-fg">Holiday</span>}
                        </td>
                        <td className="px-4 py-2">{log.schedule_type_name} ({log.schedule_type_multiplier}x)</td>
                        <td className="px-4 py-2">{log.start_time} – {log.end_time}</td>
                        <td className="px-4 py-2">{log.break_duration} min</td>
                        <td className="px-4 py-2">{log.status}</td>
                        <td className="px-4 py-2 text-right">
                          {otHours > 0 ? `${otHours.toFixed(1)} hrs` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )
          }
        </CardContent>
      </Card>

    </div>
  );
}
