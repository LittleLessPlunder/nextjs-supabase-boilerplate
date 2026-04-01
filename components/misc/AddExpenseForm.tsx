'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import {
  getVendors, getExpenseCategories,
  addExpense, updateExpense, getExpense,
} from '@/utils/supabase/queries';
import { ArrowLeft, Upload, X, BadgeCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vendor {
  id: string;
  name: string;
  address: string | null;
  tin: string | null;
  is_vat_registered: boolean;
}

interface Category {
  id: string;
  name: string;
  is_cogs: boolean;
}

const PAYMENT_METHODS = ['Cash', 'GCash', 'Bank Transfer', 'Check', 'Reimbursement'];
const STATUSES = ['Paid', 'Unpaid'];

function today() {
  return new Date().toISOString().split('T')[0];
}

// ─── VAT helpers (PH: 12%) ───────────────────────────────────────────────────
const VAT_RATE = 0.12;
function vatFromTotal(total: number) { return total - total / (1 + VAT_RATE); }
function baseFromTotal(total: number) { return total / (1 + VAT_RATE); }

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { expenseId: string | null }

export default function AddExpenseForm({ expenseId }: Props) {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const isEdit = !!expenseId;

  const [vendors,    setVendors]    = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetching,   setFetching]   = useState(true);

  // Vendor search state
  const [vendorSearch,       setVendorSearch]       = useState('');
  const [selectedVendor,     setSelectedVendor]     = useState<Vendor | null>(null);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const vendorRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    date:              today(),
    vendor_name:       '',   // free-text fallback
    particulars:       '',
    or_number:         '',
    category_id:       '',
    amount:            '',
    vat_amount:        '',
    non_vat_amount:    '',
    payment_method:    'Cash',
    reimbursement_to:  '',
    status:            'Paid',
    notes:             '',
  });
  const [declarableOnly, setDeclarableOnly] = useState(false);

  const [receiptFile,   setReceiptFile]   = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // ── Close vendor dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (vendorRef.current && !vendorRef.current.contains(e.target as Node)) {
        setShowVendorDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Load master data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTenant) return;
    (async () => {
      try {
        const supabase = createClient();
        const [vList, cList] = await Promise.all([
          getVendors(supabase, currentTenant.id),
          getExpenseCategories(supabase, currentTenant.id),
        ]);
        setVendors(vList as Vendor[]);
        setCategories(cList as Category[]);

        if (expenseId) {
          const exp = await getExpense(supabase, currentTenant.id, expenseId);
          setForm({
            date:             exp.date ?? today(),
            vendor_name:      exp.vendor_name ?? '',
            particulars:      exp.particulars ?? '',
            or_number:        exp.or_number ?? '',
            category_id:      exp.category_id ?? '',
            amount:           exp.amount != null ? String(exp.amount) : '',
            vat_amount:       exp.vat_amount != null ? String(exp.vat_amount) : '',
            non_vat_amount:   exp.non_vat_amount != null ? String(exp.non_vat_amount) : '',
            payment_method:   exp.payment_method ?? 'Cash',
            reimbursement_to: exp.reimbursement_to ?? '',
            status:           exp.status ?? 'Paid',
            notes:            exp.notes ?? '',
          });
          if (exp.vendor) setSelectedVendor(exp.vendor as Vendor);
          if (exp.receipt_url) setExistingReceiptUrl(exp.receipt_url);
          setDeclarableOnly(exp.declarable_only ?? false);
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setFetching(false);
      }
    })();
  }, [currentTenant, expenseId]);

  // ── Auto-sum total from non_vat + vat when either changes (VAT vendors) ─────
  useEffect(() => {
    if (!selectedVendor?.is_vat_registered) return;
    const base = parseFloat(form.non_vat_amount) || 0;
    const vat  = parseFloat(form.vat_amount)     || 0;
    setForm(prev => ({ ...prev, amount: (base + vat).toFixed(2) }));
  }, [form.non_vat_amount, form.vat_amount, selectedVendor]);

  // ── Vendor selection ────────────────────────────────────────────────────────
  function selectVendor(v: Vendor) {
    setSelectedVendor(v);
    setVendorSearch('');
    setShowVendorDropdown(false);
    // recalc VAT if amount already entered
    const total = parseFloat(form.amount) || 0;
    if (v.is_vat_registered && total > 0) {
      setForm(prev => ({
        ...prev,
        vat_amount:     vatFromTotal(total).toFixed(2),
        non_vat_amount: baseFromTotal(total).toFixed(2),
      }));
    } else if (!v.is_vat_registered) {
      setForm(prev => ({ ...prev, vat_amount: '', non_vat_amount: '' }));
    }
  }

  function clearVendor() {
    setSelectedVendor(null);
    setVendorSearch('');
    setForm(prev => ({ ...prev, vat_amount: '', non_vat_amount: '' }));
  }

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  // ── Receipt file ────────────────────────────────────────────────────────────
  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  // ── Upload receipt to Supabase Storage ─────────────────────────────────────
  async function uploadReceipt(supabase: any, expId: string): Promise<string | null> {
    if (!receiptFile) return existingReceiptUrl;
    const ext  = receiptFile.name.split('.').pop();
    const path = `${currentTenant!.id}/${expId}.${ext}`;
    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, receiptFile, { upsert: true });
    if (error) {
      console.warn('Receipt upload failed:', error.message);
      return null;
    }
    const { data } = supabase.storage.from('receipts').getPublicUrl(path);
    return data?.publicUrl ?? null;
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTenant) return;
    if (!form.particulars.trim()) {
      toast({ title: 'Validation', description: 'Particulars are required.', variant: 'destructive' });
      return;
    }
    if (!form.amount) {
      toast({ title: 'Validation', description: 'Amount is required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const vatAmt  = parseFloat(form.vat_amount)     || 0;
      const baseAmt = parseFloat(form.non_vat_amount)  || 0;
      const isVATVendor = selectedVendor?.is_vat_registered ?? false;
      const totalAmt = isVATVendor ? vatAmt + baseAmt : (parseFloat(form.amount) || 0);

      const payload: any = {
        tenant_id:        currentTenant.id,
        date:             form.date,
        vendor_id:        selectedVendor?.id ?? null,
        vendor_name:      selectedVendor ? selectedVendor.name : form.vendor_name || null,
        particulars:      form.particulars.trim(),
        or_number:        form.or_number.trim() || null,
        category_id:      form.category_id || null,
        amount:           totalAmt,
        vat_amount:       isVATVendor ? vatAmt  : 0,
        non_vat_amount:   isVATVendor ? baseAmt : 0,
        payment_method:   form.payment_method,
        reimbursement_to: form.payment_method === 'Reimbursement' ? form.reimbursement_to.trim() || null : null,
        status:           form.status,
        notes:            form.notes.trim() || null,
        declarable_only:  declarableOnly,
      };

      let expId = expenseId;
      if (isEdit) {
        await updateExpense(supabase, expenseId!, payload);
      } else {
        const created = await addExpense(supabase, payload);
        expId = created.id;
      }

      // Upload receipt after we have the ID
      if (receiptFile && expId) {
        const url = await uploadReceipt(supabase, expId);
        if (url) {
          await updateExpense(supabase, expId!, { receipt_url: url });
        }
      }

      toast({ title: isEdit ? 'Updated' : 'Saved', description: 'Expense recorded.' });
      router.push('/finance/expenses');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message ?? 'Failed to save.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (fetching) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const isVAT = selectedVendor?.is_vat_registered ?? false;

  return (
    <div className="container mx-auto max-w-2xl mt-6 pb-16">

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/finance/expenses')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit Expense' : 'Log Expense'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">

        {/* ── Date ─────────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Basic Info</CardTitle></CardHeader>
          <CardContent className="grid gap-4">

            <div>
              <Label>Date *</Label>
              <DatePicker value={form.date} onChange={val => set('date', val)} />
            </div>

            {/* Vendor search */}
            <div>
              <Label>Vendor / Supplier</Label>
              {selectedVendor ? (
                <div className="flex items-start justify-between rounded-md border p-3 bg-muted/40">
                  <div className="text-sm">
                    <div className="font-medium flex items-center gap-1.5">
                      {selectedVendor.name}
                      {selectedVendor.is_vat_registered && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                          <BadgeCheck className="h-3 w-3" /> VAT
                        </span>
                      )}
                    </div>
                    {selectedVendor.tin && (
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">TIN: {selectedVendor.tin}</div>
                    )}
                    {selectedVendor.address && (
                      <div className="text-xs text-muted-foreground mt-0.5">{selectedVendor.address}</div>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={clearVendor}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="relative" ref={vendorRef}>
                  <Input
                    value={vendorSearch}
                    onChange={e => { setVendorSearch(e.target.value); setShowVendorDropdown(true); }}
                    onFocus={() => setShowVendorDropdown(true)}
                    placeholder="Search vendors or type name for ad-hoc…"
                  />
                  {showVendorDropdown && vendorSearch && (
                    <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredVendors.length > 0
                        ? filteredVendors.map(v => (
                            <button
                              key={v.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                              onClick={() => selectVendor(v)}
                            >
                              <span>{v.name}</span>
                              {v.is_vat_registered && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">VAT</span>
                              )}
                            </button>
                          ))
                        : (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No match — will be saved as "{vendorSearch}".{' '}
                              <a href="/finance/vendors/add" className="text-primary underline">Add vendor</a>
                            </div>
                          )
                      }
                    </div>
                  )}
                  {/* Free-text vendor name when no match selected */}
                  {!showVendorDropdown && vendorSearch && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Will be saved as ad-hoc vendor: <strong>{vendorSearch}</strong>
                    </p>
                  )}
                </div>
              )}
              {!selectedVendor && !vendorSearch && (
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank for cash purchases with no supplier record.
                </p>
              )}
            </div>

            <div>
              <Label>Particulars *</Label>
              <Input
                value={form.particulars}
                onChange={e => set('particulars', e.target.value)}
                placeholder="What was purchased"
              />
            </div>

            <div>
              <Label>OR / Invoice Number</Label>
              <Input
                value={form.or_number}
                onChange={e => set('or_number', e.target.value)}
                placeholder="Official Receipt or Sales Invoice number"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={v => set('category_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* ── Amounts ──────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Amount & VAT</CardTitle></CardHeader>
          <CardContent className="grid gap-4">

            {isVAT ? (
              // VAT vendor: enter the breakdown from the receipt directly
              <>
                <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-green-50 border border-green-200">
                  <div>
                    <Label className="text-xs font-medium">Non-VAT Base (₱) *</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">Amount before VAT on your OR</p>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.non_vat_amount}
                      onChange={e => set('non_vat_amount', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">VAT Amount (₱) *</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">12% VAT shown on your OR</p>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.vat_amount}
                      onChange={e => set('vat_amount', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/40">
                  <span className="text-sm text-muted-foreground">Total (auto-summed)</span>
                  <span className="font-semibold">
                    ₱{(( parseFloat(form.non_vat_amount) || 0) + (parseFloat(form.vat_amount) || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            ) : (
              // Non-VAT: just enter the total
              <div>
                <Label>Total Amount (₱) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

          </CardContent>
        </Card>

        {/* ── Payment ──────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Payment</CardTitle></CardHeader>
          <CardContent className="grid gap-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Method</Label>
                <Select value={form.payment_method} onValueChange={v => set('payment_method', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.payment_method === 'Reimbursement' && (
              <div>
                <Label>Reimburse To</Label>
                <Input
                  value={form.reimbursement_to}
                  onChange={e => set('reimbursement_to', e.target.value)}
                  placeholder="e.g. Isobelle Soriano"
                />
              </div>
            )}

            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any additional notes"
              />
            </div>

            {/* ── Declaration flag ───────────────────────────────────────── */}
            <div className={`flex items-start gap-3 rounded-md border p-3 ${declarableOnly ? 'border-violet-300 bg-violet-50' : ''}`}>
              <Checkbox
                id="declarable_only"
                checked={declarableOnly}
                onCheckedChange={v => setDeclarableOnly(Boolean(v))}
                className="mt-0.5"
              />
              <div>
                <label htmlFor="declarable_only" className="text-sm font-medium cursor-pointer">
                  For declaration only
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This expense is VATable and declarable, but was <strong>not paid by YTW</strong>. It will be tracked but excluded from P&L totals.
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Receipt ──────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Receipt</CardTitle></CardHeader>
          <CardContent>
            {receiptPreview ? (
              <div className="relative inline-block">
                <img src={receiptPreview} alt="Receipt preview" className="max-h-48 rounded-md border object-contain" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 bg-white/80 hover:bg-white"
                  onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : existingReceiptUrl ? (
              <div className="flex items-center gap-3">
                <a href={existingReceiptUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                  View existing receipt
                </a>
                <label className="cursor-pointer">
                  <span className="text-sm text-muted-foreground underline">Replace</span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReceiptChange} />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/30 p-8 cursor-pointer hover:bg-muted/30 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload receipt photo or PDF</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReceiptChange} />
              </label>
            )}
          </CardContent>
        </Card>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Expense'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/finance/expenses')}>
            Cancel
          </Button>
        </div>

      </form>
    </div>
  );
}
