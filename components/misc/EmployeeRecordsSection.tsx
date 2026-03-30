'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  getEmployeeRecords,
  addEmployeeRecord,
  updateEmployeeRecord,
  deleteEmployeeRecord,
  uploadEmployeeRecordAttachment,
} from '@/utils/supabase/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Clock,
  FileText,
  ShieldAlert,
  Star,
  CheckCircle2,
  Paperclip,
  Download,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeRecord {
  id: string;
  employee_id: string;
  tenant_id: string;
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
}

interface Props {
  employeeId: string;
  tenantId: string;
}

type RecordType = EmployeeRecord['type'];

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const TYPE_META: Record<
  RecordType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    badge: string;
  }
> = {
  tardiness: {
    label: 'Tardiness',
    icon: Clock,
    color: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    color: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
  },
  memo: {
    label: 'Memo / NTE',
    icon: FileText,
    color: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800',
  },
  suspension: {
    label: 'Suspension',
    icon: ShieldAlert,
    color: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-800',
  },
  commendation: {
    label: 'Commendation',
    icon: Star,
    color: 'text-green-600',
    badge: 'bg-green-100 text-green-800',
  },
  other: {
    label: 'Other',
    icon: FileText,
    color: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-600',
  },
};

const WARNING_SUBTYPES = [
  { value: 'verbal', label: 'Verbal Warning' },
  { value: '1st_written', label: '1st Written Warning' },
  { value: '2nd_written', label: '2nd Written Warning' },
  { value: 'final_written', label: 'Final Written Warning' },
];

const MEMO_SUBTYPES = [
  { value: 'nte', label: 'Notice to Explain (NTE)' },
  { value: 'nod', label: 'Notice of Decision (NOD)' },
  { value: 'general', label: 'General Memo' },
];

const TITLE_SUGGESTIONS: Partial<Record<string, string>> = {
  tardiness: 'Tardiness Record',
  'warning:verbal': 'Verbal Warning',
  'warning:1st_written': '1st Written Warning',
  'warning:2nd_written': '2nd Written Warning',
  'warning:final_written': 'Final Written Warning',
  'memo:nte': 'Notice to Explain (NTE)',
  'memo:nod': 'Notice of Decision (NOD)',
  'memo:general': 'General Memo',
  suspension: 'Suspension Order',
  commendation: 'Letter of Commendation',
};

function getTitleSuggestion(type: RecordType | '', subtype: string): string {
  if (!type) return '';
  const key = subtype ? `${type}:${subtype}` : type;
  return TITLE_SUGGESTIONS[key] ?? '';
}

// ---------------------------------------------------------------------------
// Default / empty form state
// ---------------------------------------------------------------------------

interface FormState {
  type: RecordType | '';
  subtype: string;
  date: string;
  title: string;
  details: string;
  reference_no: string;
  issued_by: string;
  minutes_late: string;
  acknowledged: boolean;
  acknowledged_at: string;
}

const EMPTY_FORM: FormState = {
  type: '',
  subtype: '',
  date: new Date().toISOString().slice(0, 10),
  title: '',
  details: '',
  reference_no: '',
  issued_by: '',
  minutes_late: '',
  acknowledged: false,
  acknowledged_at: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmployeeRecordsSection({ employeeId, tenantId }: Props) {
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmployeeRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [lastSuggestion, setLastSuggestion] = useState('');

  const supabase = createClient();

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmployeeRecords(supabase, employeeId);
      if (data) {
        const sorted = [...data].sort(
          (a: EmployeeRecord, b: EmployeeRecord) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecords(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch employee records:', err);
      toast({ title: 'Error', description: 'Failed to load records.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // -------------------------------------------------------------------------
  // Dialog helpers
  // -------------------------------------------------------------------------

  function openAdd() {
    setEditingRecord(null);
    setForm(EMPTY_FORM);
    setAttachmentFile(null);
    setLastSuggestion('');
    setDialogOpen(true);
  }

  function openEdit(record: EmployeeRecord) {
    setEditingRecord(record);
    setAttachmentFile(null);
    setForm({
      type: record.type,
      subtype: record.subtype ?? '',
      date: record.date,
      title: record.title,
      details: record.details ?? '',
      reference_no: record.reference_no ?? '',
      issued_by: record.issued_by ?? '',
      minutes_late: record.minutes_late != null ? String(record.minutes_late) : '',
      acknowledged: record.acknowledged,
      acknowledged_at: record.acknowledged_at ?? '',
    });
    setLastSuggestion(getTitleSuggestion(record.type, record.subtype ?? ''));
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingRecord(null);
    setForm(EMPTY_FORM);
    setAttachmentFile(null);
    setLastSuggestion('');
  }

  // -------------------------------------------------------------------------
  // Form field change handlers
  // -------------------------------------------------------------------------

  function handleTypeChange(value: RecordType) {
    const suggestion = getTitleSuggestion(value, '');
    const shouldReplace = form.title === '' || form.title === lastSuggestion;
    setForm((prev) => ({
      ...prev,
      type: value,
      subtype: '',
      title: shouldReplace ? suggestion : prev.title,
    }));
    setLastSuggestion(suggestion);
  }

  function handleSubtypeChange(value: string) {
    const suggestion = getTitleSuggestion(form.type, value);
    const shouldReplace = form.title === '' || form.title === lastSuggestion;
    setForm((prev) => ({
      ...prev,
      subtype: value,
      title: shouldReplace ? suggestion : prev.title,
    }));
    setLastSuggestion(suggestion);
  }

  function handleField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  async function handleSave() {
    if (!form.type || !form.date || !form.title.trim()) {
      toast({ title: 'Validation', description: 'Type, date, and title are required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Upload attachment if a new file was selected
      let attachmentUrl = editingRecord?.attachment_url ?? null;
      let attachmentName = editingRecord?.attachment_name ?? null;
      if (attachmentFile) {
        const uploaded = await uploadEmployeeRecordAttachment(supabase, attachmentFile, tenantId, employeeId);
        attachmentUrl = uploaded.url;
        attachmentName = uploaded.name;
      }

      const payload: Partial<EmployeeRecord> = {
        employee_id: employeeId,
        tenant_id: tenantId,
        type: form.type as RecordType,
        subtype: form.subtype || null,
        date: form.date,
        title: form.title.trim(),
        details: form.details.trim() || null,
        reference_no: form.reference_no.trim() || null,
        issued_by: form.issued_by.trim() || null,
        minutes_late: form.minutes_late ? parseInt(form.minutes_late, 10) : null,
        acknowledged: form.acknowledged,
        acknowledged_at: form.acknowledged && form.acknowledged_at ? form.acknowledged_at : null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      };

      if (editingRecord) {
        await updateEmployeeRecord(supabase, editingRecord.id, payload);
        toast({ title: 'Record updated' });
      } else {
        await addEmployeeRecord(supabase, payload);
        toast({ title: 'Record added' });
      }

      closeDialog();
      fetchRecords();
    } catch (err: any) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: err?.message ?? 'Failed to save record.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  async function handleDelete(record: EmployeeRecord) {
    if (!window.confirm(`Delete "${record.title}"? This cannot be undone.`)) return;
    try {
      await deleteEmployeeRecord(supabase, record.id);
      toast({ title: 'Record deleted' });
      fetchRecords();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({ title: 'Error', description: err?.message ?? 'Failed to delete record.', variant: 'destructive' });
    }
  }

  // -------------------------------------------------------------------------
  // Summary chips
  // -------------------------------------------------------------------------

  const typeCounts = records.reduce<Partial<Record<RecordType, number>>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});

  const typeOrder: RecordType[] = ['tardiness', 'warning', 'memo', 'suspension', 'commendation', 'other'];
  const summaryChips = typeOrder.filter((t) => (typeCounts[t] ?? 0) > 0);

  // -------------------------------------------------------------------------
  // Subtype helpers
  // -------------------------------------------------------------------------

  const showSubtype = form.type === 'warning' || form.type === 'memo';
  const showReference = form.type === 'warning' || form.type === 'memo' || form.type === 'suspension';
  const showIssuedBy = form.type === 'warning' || form.type === 'memo' || form.type === 'suspension';
  const showMinutesLate = form.type === 'tardiness';
  const showAcknowledged = form.type === 'warning' || form.type === 'memo' || form.type === 'suspension';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Disciplinary &amp; HR Records</CardTitle>

          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openAdd} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>

            {/* ---- Dialog ---- */}
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRecord ? 'Edit Record' : 'Add Record'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Type */}
                <div className="space-y-1">
                  <Label htmlFor="rec-type">Type <span className="text-red-500">*</span></Label>
                  <Select value={form.type} onValueChange={(v) => handleTypeChange(v as RecordType)}>
                    <SelectTrigger id="rec-type">
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOrder.map((t) => (
                        <SelectItem key={t} value={t}>{TYPE_META[t].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subtype */}
                {showSubtype && (
                  <div className="space-y-1">
                    <Label htmlFor="rec-subtype">Subtype</Label>
                    <Select value={form.subtype} onValueChange={handleSubtypeChange}>
                      <SelectTrigger id="rec-subtype">
                        <SelectValue placeholder="Select subtype…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(form.type === 'warning' ? WARNING_SUBTYPES : MEMO_SUBTYPES).map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date */}
                <div className="space-y-1">
                  <Label htmlFor="rec-date">Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="rec-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleField('date', e.target.value)}
                  />
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <Label htmlFor="rec-title">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="rec-title"
                    type="text"
                    placeholder="Enter title…"
                    value={form.title}
                    onChange={(e) => handleField('title', e.target.value)}
                  />
                </div>

                {/* Minutes late */}
                {showMinutesLate && (
                  <div className="space-y-1">
                    <Label htmlFor="rec-mins">Minutes Late</Label>
                    <Input
                      id="rec-mins"
                      type="number"
                      min={0}
                      placeholder="e.g. 15"
                      value={form.minutes_late}
                      onChange={(e) => handleField('minutes_late', e.target.value)}
                    />
                  </div>
                )}

                {/* Reference No */}
                {showReference && (
                  <div className="space-y-1">
                    <Label htmlFor="rec-ref">Reference No.</Label>
                    <Input
                      id="rec-ref"
                      type="text"
                      placeholder="e.g. HR-2024-001"
                      value={form.reference_no}
                      onChange={(e) => handleField('reference_no', e.target.value)}
                    />
                  </div>
                )}

                {/* Issued By */}
                {showIssuedBy && (
                  <div className="space-y-1">
                    <Label htmlFor="rec-issued">Issued By</Label>
                    <Input
                      id="rec-issued"
                      type="text"
                      placeholder="Name of issuing officer"
                      value={form.issued_by}
                      onChange={(e) => handleField('issued_by', e.target.value)}
                    />
                  </div>
                )}

                {/* Details */}
                <div className="space-y-1">
                  <Label htmlFor="rec-details">Details</Label>
                  <Textarea
                    id="rec-details"
                    placeholder="Additional details or narrative…"
                    rows={3}
                    value={form.details}
                    onChange={(e) => handleField('details', e.target.value)}
                  />
                </div>

                {/* Acknowledged */}
                {showAcknowledged && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="rec-ack"
                        checked={form.acknowledged}
                        onCheckedChange={(checked) => handleField('acknowledged', checked === true)}
                      />
                      <Label htmlFor="rec-ack" className="cursor-pointer">
                        Employee acknowledged receipt
                      </Label>
                    </div>
                    {form.acknowledged && (
                      <div className="space-y-1 pl-6">
                        <Label htmlFor="rec-ack-date">Acknowledged Date</Label>
                        <Input
                          id="rec-ack-date"
                          type="date"
                          value={form.acknowledged_at}
                          onChange={(e) => handleField('acknowledged_at', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Attachment */}
                <div className="space-y-1">
                  <Label htmlFor="rec-attachment">Attachment <span className="text-xs font-normal text-muted-foreground">(scanned signed copy)</span></Label>
                  {editingRecord?.attachment_url && !attachmentFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <a href={editingRecord.attachment_url} target="_blank" rel="noopener noreferrer" className="truncate underline text-blue-600 hover:text-blue-800">
                        {editingRecord.attachment_name ?? 'View attachment'}
                      </a>
                      <span className="text-xs">(upload a new file to replace)</span>
                    </div>
                  )}
                  <Input
                    id="rec-attachment"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">PDF, JPG, or PNG · max 10 MB</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={closeDialog} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : editingRecord ? 'Save Changes' : 'Add Record'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary chips */}
          {summaryChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summaryChips.map((type) => {
                const meta = TYPE_META[type];
                const Icon = meta.icon;
                const count = typeCounts[type] ?? 0;
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
                  >
                    <Icon className="h-3 w-3" />
                    {count} {meta.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading records…</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No records yet. Use this section to track tardiness, warnings, memos, and disciplinary
              actions for DOLE compliance.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Title / Subtype</th>
                    <th className="py-2 pr-3 font-medium">Issued By</th>
                    <th className="py-2 pr-3 font-medium">Acknowledged</th>
                    <th className="py-2 pr-3 font-medium">Attachment</th>
                    <th className="py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((record) => {
                    const meta = TYPE_META[record.type];
                    const Icon = meta.icon;

                    // Build title cell content
                    let titleDisplay = record.title;
                    if (record.type === 'tardiness' && record.minutes_late != null) {
                      titleDisplay = `${record.title} — ${record.minutes_late} min late`;
                    }

                    // Subtype label
                    let subtypeLabel = '';
                    if (record.type === 'warning' && record.subtype) {
                      subtypeLabel = WARNING_SUBTYPES.find((s) => s.value === record.subtype)?.label ?? record.subtype;
                    } else if (record.type === 'memo' && record.subtype) {
                      subtypeLabel = MEMO_SUBTYPES.find((s) => s.value === record.subtype)?.label ?? record.subtype;
                    }

                    return (
                      <tr key={record.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                          {new Date(record.date).toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="font-medium leading-tight">{titleDisplay}</div>
                          {subtypeLabel && (
                            <div className="text-xs text-muted-foreground">{subtypeLabel}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {record.issued_by || <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="py-2 pr-3">
                          {record.acknowledged ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle2 className="h-4 w-4" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {record.attachment_url ? (
                            <a href={record.attachment_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="h-6 gap-1 text-xs px-2">
                                <Download className="h-3 w-3" />
                                {record.attachment_name ? record.attachment_name.split('.').pop()?.toUpperCase() : 'View'}
                              </Button>
                            </a>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <div className="inline-flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEdit(record)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(record)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DOLE compliance note */}
      <div className="flex gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <span className="mt-0.5 shrink-0 text-blue-500">ⓘ</span>
        <p>
          <span className="font-medium">DOLE compliance: </span>
          DOLE requires two written notices before termination: a Notice to Explain (NTE) giving the
          employee opportunity to be heard, and a Notice of Decision (NOD). Keep all records
          documented here for compliance.
        </p>
      </div>
    </div>
  );
}
