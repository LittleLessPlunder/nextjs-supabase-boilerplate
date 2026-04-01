'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getAllEmployeeRecords } from '@/utils/supabase/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenant } from '@/utils/tenant-context';
import {
  Warning,
  Clock,
  FileText,
  ShieldWarning,
  Star,
  CheckCircle,
  Download,
  Paperclip,
  Funnel,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeRecord {
  id: string;
  employee_id: string;
  type: 'tardiness' | 'warning' | 'memo' | 'suspension' | 'commendation' | 'other';
  subtype: string | null;
  date: string;
  title: string;
  details: string | null;
  reference_no: string | null;
  issued_by: string | null;
  minutes_late: number | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  employee: { id: string; given_name: string; surname: string | null } | null;
}

type RecordType = EmployeeRecord['type'];

interface Props {
  user: User;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const TYPE_META: Record<RecordType, { label: string; badge: string }> = {
  tardiness:    { label: 'Tardiness',    badge: 'bg-status-warning text-status-warning-fg' },
  warning:      { label: 'Warning',      badge: 'bg-status-danger text-status-danger-fg'   },
  memo:         { label: 'Memo / NTE',   badge: 'bg-status-info text-status-info-fg'       },
  suspension:   { label: 'Suspension',   badge: 'bg-status-warning text-status-warning-fg' },
  commendation: { label: 'Commendation', badge: 'bg-status-success text-status-success-fg' },
  other:        { label: 'Other',        badge: 'bg-gray-100 text-gray-600'                },
};

const TYPE_ICONS: Record<RecordType, React.ComponentType<{ className?: string }>> = {
  tardiness:    Clock,
  warning:      Warning,
  memo:         FileText,
  suspension:   ShieldWarning,
  commendation: Star,
  other:        FileText,
};

const WARNING_SUBTYPES: Record<string, string> = {
  verbal:        'Verbal Warning',
  '1st_written': '1st Written Warning',
  '2nd_written': '2nd Written Warning',
  final_written: 'Final Written Warning',
};

const MEMO_SUBTYPES: Record<string, string> = {
  nte:     'Notice to Explain (NTE)',
  nod:     'Notice of Decision (NOD)',
  general: 'General Memo',
};

const REQUIRES_ACKNOWLEDGEMENT: RecordType[] = ['warning', 'memo', 'suspension'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSubtypeLabel(record: EmployeeRecord): string | null {
  if (!record.subtype) return null;
  if (record.type === 'warning') return WARNING_SUBTYPES[record.subtype] ?? record.subtype;
  if (record.type === 'memo') return MEMO_SUBTYPES[record.subtype] ?? record.subtype;
  return null;
}

function getEmployeeFullName(
  employee: { given_name: string; surname: string | null } | null
): string {
  if (!employee) return '—';
  const parts = [employee.surname, employee.given_name].filter(Boolean);
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmployeeRecordsReport({ user }: Props) {
  const { currentTenant } = useTenant();
  const router = useRouter();

  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAcknowledged, setFilterAcknowledged] = useState('');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await getAllEmployeeRecords(supabase, currentTenant.id);
      setRecords(data as EmployeeRecord[]);
    } catch (err: any) {
      console.error('Failed to load employee records:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------------------------------------------------------------------------
  // Employee list for dropdown
  // ---------------------------------------------------------------------------

  const employeeOptions = useMemo(() => {
    const seen = new Map<string, { id: string; given_name: string; surname: string | null }>();
    for (const r of records) {
      if (r.employee && !seen.has(r.employee.id)) {
        seen.set(r.employee.id, r.employee);
      }
    }
    return Array.from(seen.values()).sort((a, b) => {
      const sA = (a.surname ?? '').toLowerCase();
      const sB = (b.surname ?? '').toLowerCase();
      return sA.localeCompare(sB);
    });
  }, [records]);

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterEmployee && r.employee_id !== filterEmployee) return false;
      if (filterType && r.type !== filterType) return false;
      if (filterDateFrom && r.date < filterDateFrom) return false;
      if (filterDateTo && r.date > filterDateTo) return false;
      if (filterAcknowledged === 'yes' && !r.acknowledged) return false;
      if (filterAcknowledged === 'no' && r.acknowledged) return false;
      return true;
    });
  }, [records, filterEmployee, filterType, filterDateFrom, filterDateTo, filterAcknowledged]);

  // ---------------------------------------------------------------------------
  // Summary card counts
  // ---------------------------------------------------------------------------

  const totalCount = filtered.length;

  const warningsMemos = useMemo(
    () => filtered.filter((r) => r.type === 'warning' || r.type === 'memo').length,
    [filtered]
  );

  const tardinessCount = useMemo(
    () => filtered.filter((r) => r.type === 'tardiness').length,
    [filtered]
  );

  const pendingAcknowledgement = useMemo(
    () =>
      filtered.filter(
        (r) => !r.acknowledged && REQUIRES_ACKNOWLEDGEMENT.includes(r.type)
      ).length,
    [filtered]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <FileText weight="light" className="h-5 w-5 text-primary mt-1 shrink-0" />
        <div>
          <h1 className="text-xl font-semibold">Employee Records</h1>
          <p className="text-sm text-muted-foreground">
            HR and disciplinary records across all employees
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0 self-center">
              <Funnel weight="light" className="h-4 w-4" />
              <span>Filters</span>
            </div>

            {/* Employee */}
            <div className="min-w-[180px]">
              <p className="text-xs text-muted-foreground mb-1">Employee</p>
              <Select value={filterEmployee || '_all'} onValueChange={(v) => setFilterEmployee(v === '_all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All employees</SelectItem>
                  {employeeOptions.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {getEmployeeFullName(emp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="min-w-[160px]">
              <p className="text-xs text-muted-foreground mb-1">Type</p>
              <Select value={filterType || '_all'} onValueChange={(v) => setFilterType(v === '_all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All types</SelectItem>
                  {(Object.keys(TYPE_META) as RecordType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_META[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date From</p>
              <DatePicker value={filterDateFrom} onChange={setFilterDateFrom} />
            </div>

            {/* Date To */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date To</p>
              <DatePicker value={filterDateTo} onChange={setFilterDateTo} />
            </div>

            {/* Acknowledged */}
            <div className="min-w-[150px]">
              <p className="text-xs text-muted-foreground mb-1">Acknowledged</p>
              <Select
                value={filterAcknowledged || '_all'}
                onValueChange={(v) => setFilterAcknowledged(v === '_all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold mt-1">{totalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Warnings &amp; Memos</p>
            <p className="text-2xl font-bold mt-1 text-finance-negative">{warningsMemos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Tardiness Incidents</p>
            <p className="text-2xl font-bold mt-1 text-finance-pending">{tardinessCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Pending Acknowledgement</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{pendingAcknowledgement}</p>
          </CardContent>
        </Card>
      </div>

      {/* Records table */}
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No records found. Adjust your filters or add records from individual employee profiles.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Employee</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Ref No</th>
                    <th className="px-4 py-3 font-medium">Issued By</th>
                    <th className="px-4 py-3 font-medium">Acknowledged</th>
                    <th className="px-4 py-3 font-medium">Attachment</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((record) => {
                    const meta = TYPE_META[record.type];
                    const Icon = TYPE_ICONS[record.type];
                    const subtypeLabel = getSubtypeLabel(record);
                    const requiresAck = REQUIRES_ACKNOWLEDGEMENT.includes(record.type);

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </td>

                        {/* Employee */}
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {getEmployeeFullName(record.employee)}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}
                          >
                            <Icon weight="light" className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="font-medium leading-tight truncate">{record.title}</div>
                          {subtypeLabel && (
                            <div className="text-xs text-muted-foreground mt-0.5">{subtypeLabel}</div>
                          )}
                        </td>

                        {/* Ref No */}
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {record.reference_no ?? <span className="text-muted-foreground/40">—</span>}
                        </td>

                        {/* Issued By */}
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {record.issued_by ?? <span className="text-muted-foreground/40">—</span>}
                        </td>

                        {/* Acknowledged */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {record.acknowledged ? (
                            <span className="inline-flex items-center gap-1 text-finance-positive text-xs font-medium">
                              <CheckCircle weight="light" className="h-4 w-4 shrink-0" />
                              {record.acknowledged_at
                                ? format(new Date(record.acknowledged_at), 'MMM d, yyyy')
                                : 'Yes'}
                            </span>
                          ) : requiresAck ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Pending
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Attachment */}
                        <td className="px-4 py-3">
                          {record.attachment_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                              asChild
                            >
                              <a
                                href={record.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Paperclip weight="light" className="h-3 w-3" />
                                {record.attachment_name ?? 'Download'}
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Navigate to employee profile */}
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => router.push(`/employees/edit/${record.employee_id}`)}
                            aria-label="View employee profile"
                          >
                            →
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
