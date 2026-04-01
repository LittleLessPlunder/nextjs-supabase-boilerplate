'use client'

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getPublicHolidays } from '@/utils/supabase/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { format, startOfYear, endOfYear, eachMonthOfInterval, eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, isSameDay } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import BulkImportHolidays from './BulkImportHolidays';
import { Loading } from '@/components/ui/loading';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Holiday {
  id: string;
  date: string;
  name: string;
  type: string; // 'regular' | 'special_non_working'
}

interface PublicHolidaysPageProps {
  user: User;
}

// ─── Pay rule reference ───────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; calendarClass: string; badgeClass: string; notWorked: string; worked: string; workedRestDay: string }> = {
  regular: {
    label: 'Regular Holiday',
    calendarClass: 'bg-blue-200 rounded-full font-semibold text-blue-900',
    badgeClass: 'bg-blue-100 text-blue-800',
    notWorked:    '100% (paid even if absent)',
    worked:       '200% of daily rate',
    workedRestDay:'260% of daily rate',
  },
  special_non_working: {
    label: 'Special Non-Working Day',
    calendarClass: 'bg-amber-200 rounded-full font-semibold text-amber-900',
    badgeClass: 'bg-amber-100 text-amber-800',
    notWorked:    'No pay (no work, no pay)',
    worked:       '130% of daily rate',
    workedRestDay:'150% of daily rate',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublicHolidaysPage({ user }: PublicHolidaysPageProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (currentTenant) loadHolidays();
  }, [selectedYear, currentTenant]);

  async function loadHolidays() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { holidays: data } = await getPublicHolidays(supabase, currentTenant!.id, selectedYear);
      if (data) setHolidays(data as Holiday[]);
    } catch (err) {
      console.error('Error loading holidays:', err);
      toast({ title: 'Error', description: 'Failed to load holidays.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(selectedYear, 0, 1)),
    end:   endOfYear(new Date(selectedYear, 0, 1)),
  });

  function getHoliday(date: Date): Holiday | undefined {
    return holidays.find(h => isSameDay(new Date(h.date + 'T12:00:00'), date));
  }

  function getDayClass(date: Date): string {
    const holiday = getHoliday(date);
    const base = 'h-8 w-8 flex items-center justify-center mx-auto text-sm';
    if (holiday) {
      const meta = TYPE_META[holiday.type] ?? TYPE_META.regular;
      return `${base} ${meta.calendarClass}`;
    }
    if (isWeekend(date)) return `${base} text-red-500`;
    return base;
  }

  function getMonthStartDays(date: Date): null[] {
    return Array(startOfMonth(date).getDay()).fill(null);
  }

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Tenant Selected</h2>
          <p className="text-muted-foreground">Please select a tenant from your account settings.</p>
          <Button className="mt-4" onClick={() => router.push('/account')}>Go to Account Settings</Button>
        </div>
      </div>
    );
  }

  if (loading) return <Loading />;

  const regularHolidays = holidays.filter(h => h.type === 'regular');
  const specialHolidays = holidays.filter(h => h.type === 'special_non_working');

  return (
    <div className="container mx-auto space-y-6">

      {/* ── Calendar card ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <CardTitle>Public Holidays {selectedYear}</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
                <CaretLeft weight="light" className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
                <CaretRight weight="light" className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mr-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block shrink-0" />Regular
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shrink-0" />Special
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block shrink-0" />Weekend
              </span>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Bulk Import</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogTitle>Import Public Holidays</DialogTitle>
                <BulkImportHolidays onComplete={loadHolidays} />
              </DialogContent>
            </Dialog>
            <Link href="/master/holidays/add">
              <Button>+ Add New</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {months.map(month => (
              <Card key={month.toString()}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold">{format(month, 'MMMM')}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <div key={d} className="text-muted-foreground pb-1">{d}</div>
                    ))}
                    {getMonthStartDays(month).map((_, i) => <div key={`e-${i}`} />)}
                    {eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map(date => {
                      const holiday = getHoliday(date);
                      return (
                        <div
                          key={date.toString()}
                          className={getDayClass(date)}
                          title={holiday?.name}
                        >
                          {format(date, 'd')}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Holiday list with pay rules ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Regular holidays */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-300 shrink-0" />
              <CardTitle className="text-base">Regular Holidays ({regularHolidays.length})</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Paid even if not worked. Worked = 200% · Rest day = 260%
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {regularHolidays.length === 0
              ? <p className="text-sm text-muted-foreground px-4 pb-4">None added yet.</p>
              : (
                <div className="overflow-x-auto -mx-0">
                <table className="w-full min-w-[640px] text-sm">
                  <tbody>
                    {regularHolidays.map((h, i) => (
                      <tr key={h.id} className={`border-t ${i === 0 ? 'border-t-0' : ''} hover:bg-muted/30`}>
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap w-24">
                          {format(new Date(h.date + 'T12:00:00'), 'MMM d')}
                        </td>
                        <td className="px-4 py-2 font-medium">{h.name}</td>
                        <td className="px-4 py-2 text-right">
                          <Link href={`/master/holidays/edit/${h.id}`}>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">Edit</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )
            }
          </CardContent>
        </Card>

        {/* Special non-working holidays */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-300 shrink-0" />
              <CardTitle className="text-base">Special Non-Working Days ({specialHolidays.length})</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No work, no pay. Worked = 130% · Rest day = 150%
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {specialHolidays.length === 0
              ? <p className="text-sm text-muted-foreground px-4 pb-4">None added yet.</p>
              : (
                <div className="overflow-x-auto -mx-0">
                <table className="w-full min-w-[640px] text-sm">
                  <tbody>
                    {specialHolidays.map((h, i) => (
                      <tr key={h.id} className={`border-t ${i === 0 ? 'border-t-0' : ''} hover:bg-muted/30`}>
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap w-24">
                          {format(new Date(h.date + 'T12:00:00'), 'MMM d')}
                        </td>
                        <td className="px-4 py-2 font-medium">{h.name}</td>
                        <td className="px-4 py-2 text-right">
                          <Link href={`/master/holidays/edit/${h.id}`}>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">Edit</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )
            }
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
