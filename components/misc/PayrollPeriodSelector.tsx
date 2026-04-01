'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calculator } from '@phosphor-icons/react';

const MONTHS = [
  { value: 1,  label: 'January' },
  { value: 2,  label: 'February' },
  { value: 3,  label: 'March' },
  { value: 4,  label: 'April' },
  { value: 5,  label: 'May' },
  { value: 6,  label: 'June' },
  { value: 7,  label: 'July' },
  { value: 8,  label: 'August' },
  { value: 9,  label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

function getYearOptions() {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1];
}

function getPeriodDates(year: number, month: number, period: 1 | 2) {
  if (period === 1) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end   = `${year}-${String(month).padStart(2, '0')}-15`;
    return { start, end };
  } else {
    const lastDay = new Date(year, month, 0).getDate();
    const start = `${year}-${String(month).padStart(2, '0')}-16`;
    const end   = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    return { start, end };
  }
}

export default function PayrollPeriodSelector() {
  const router = useRouter();
  const now = new Date();

  const [year,   setYear]   = useState(now.getFullYear());
  const [month,  setMonth]  = useState(now.getMonth() + 1);
  const [period, setPeriod] = useState<1 | 2>(now.getDate() <= 15 ? 1 : 2);

  const { start, end } = getPeriodDates(year, month, period);

  const monthLabel = MONTHS.find(m => m.value === month)?.label ?? '';
  const periodLabel = period === 1
    ? `1–15 ${monthLabel} ${year}`
    : `16–${new Date(year, month, 0).getDate()} ${monthLabel} ${year}`;

  function handleOpen() {
    router.push(`/payroll/${year}/${month}/${period}`);
  }

  return (
    <div className="container mx-auto max-w-lg mt-16">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Calculator weight="light" className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Payroll Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Year</Label>
                <Select
                  value={String(year)}
                  onValueChange={v => setYear(Number(v))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getYearOptions().map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Month</Label>
                <Select
                  value={String(month)}
                  onValueChange={v => setMonth(Number(v))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Pay Period</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {([1, 2] as const).map(p => {
                  const { start: s, end: e } = getPeriodDates(year, month, p);
                  const label = p === 1
                    ? `1–15 ${monthLabel}`
                    : `16–${new Date(year, month, 0).getDate()} ${monthLabel}`;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`rounded-md border p-3 text-left text-sm transition-colors ${
                        period === p
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-input hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{p === 1 ? '1st Period' : '2nd Period'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        {p === 1 ? 'PhilHealth + Pag-IBIG deducted' : 'SSS deducted'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md bg-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">Selected period: </span>
              <span className="font-medium">{periodLabel}</span>
            </div>

            <Button onClick={handleOpen} className="w-full">
              Open Payroll Run →
            </Button>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
