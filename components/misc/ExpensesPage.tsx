'use client'

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getExpenses, getExpenseCategories, deleteExpense } from '@/utils/supabase/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Receipt, ImageIcon, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  receipt_url: string | null;
  notes: string | null;
  declarable_only: boolean;
}

interface Category { id: string; name: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function thisMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${lastDay}` };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExpensesPage({ user }: { user: User }) {
  const router = useRouter();
  const { currentTenant } = useTenant();

  const [expenses,   setExpenses]   = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);

  const range = thisMonthRange();
  const [dateFrom,    setDateFrom]    = useState(range.from);
  const [dateTo,      setDateTo]      = useState(range.to);
  const [filterCat,   setFilterCat]   = useState('_all');
  const [filterStatus,setFilterStatus]= useState('_all');
  const [filterDecl,  setFilterDecl]  = useState('_all');

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
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentTenant, dateFrom, dateTo, filterCat, filterStatus]);

  useEffect(() => {
    if (!currentTenant) return;
    createClient().from('ExpenseCategories')
      .select('id, name')
      .eq('tenant_id', currentTenant.id)
      .order('sort_order')
      .then(({ data }) => setCategories((data ?? []) as Category[]));
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string, particulars: string) {
    if (!confirm(`Delete expense "${particulars}"?`)) return;
    try {
      const supabase = createClient();
      await deleteExpense(supabase, id);
      toast({ title: 'Deleted', description: 'Expense removed.' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  // ── Filter declarable_only client-side ──────────────────────────────────────
  const visibleExpenses = expenses.filter(e => {
    if (filterDecl === 'decl_only') return e.declarable_only;
    if (filterDecl === 'ytw_only')  return !e.declarable_only;
    return true;
  });

  // ── Totals (exclude declaration-only from YTW totals) ───────────────────────
  const ytwExpenses     = visibleExpenses.filter(e => !e.declarable_only);
  const totalAmount     = ytwExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalVAT        = visibleExpenses.reduce((s, e) => s + (e.vat_amount ?? 0), 0);
  const totalUnpaid     = ytwExpenses.filter(e => e.status === 'Unpaid').reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalDeclOnly   = visibleExpenses.filter(e => e.declarable_only).reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <div className="container mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">Daily expense log with VAT tracking</p>
        </div>
        <Button size="sm" onClick={() => router.push('/finance/expenses/add')}>
          <Plus className="h-4 w-4 mr-1.5" />Log Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
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
              <SelectItem value="ytw_only">YTW expenses</SelectItem>
              <SelectItem value="decl_only">Declaration only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">YTW Expenses</p>
          <p className="text-lg font-bold">{php(totalAmount)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total VAT</p>
          <p className="text-lg font-bold text-green-700">{php(totalVAT)}</p>
        </div>
        <div className="rounded-lg border border-orange-200 p-3 bg-orange-50">
          <p className="text-xs text-muted-foreground">Unpaid</p>
          <p className="text-lg font-bold text-orange-700">{php(totalUnpaid)}</p>
        </div>
        {totalDeclOnly > 0 && (
          <div className="rounded-lg border border-violet-200 p-3 bg-violet-50">
            <p className="text-xs text-muted-foreground">Declaration only</p>
            <p className="text-lg font-bold text-violet-700">{php(totalDeclOnly)}</p>
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : visibleExpenses.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No expenses for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted text-left">
                    <th className="p-2 font-medium">Date</th>
                    <th className="p-2 font-medium">Vendor</th>
                    <th className="p-2 font-medium">Particulars</th>
                    <th className="p-2 font-medium">OR #</th>
                    <th className="p-2 font-medium">Category</th>
                    <th className="p-2 font-medium text-right">VAT</th>
                    <th className="p-2 font-medium text-right">Amount</th>
                    <th className="p-2 font-medium">Payment</th>
                    <th className="p-2 font-medium text-center">Status</th>
                    <th className="p-2 font-medium text-center">Rcpt</th>
                    <th className="p-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExpenses.map(exp => {
                    const vendorDisplay = exp.vendor?.name ?? exp.vendor_name ?? '—';
                    const paymentDisplay = exp.payment_method === 'Reimbursement' && exp.reimbursement_to
                      ? `Reimb. → ${exp.reimbursement_to}`
                      : (exp.payment_method ?? '—');
                    return (
                      <tr key={exp.id} className={`border-b hover:bg-muted/30 ${exp.declarable_only ? 'bg-violet-50/40' : ''}`}>
                        <td className="p-2 whitespace-nowrap text-muted-foreground">{exp.date}</td>
                        <td className="p-2 max-w-[140px] truncate" title={vendorDisplay}>{vendorDisplay}</td>
                        <td className="p-2 max-w-[180px] truncate" title={exp.particulars}>{exp.particulars}</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground">{exp.or_number ?? '—'}</td>
                        <td className="p-2">
                          {exp.category
                            ? <span className={`text-xs px-1.5 py-0.5 rounded ${
                                exp.category.is_cogs
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {exp.category.name}
                              </span>
                            : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                        <td className="p-2 text-right text-xs text-green-700">
                          {exp.vat_amount > 0 ? php(exp.vat_amount) : '—'}
                        </td>
                        <td className="p-2 text-right font-medium">{php(exp.amount)}</td>
                        <td className="p-2 text-xs text-muted-foreground max-w-[120px] truncate" title={paymentDisplay}>
                          {paymentDisplay}
                        </td>
                        <td className="p-2 text-center">
                          {exp.declarable_only ? (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-violet-100 text-violet-700">
                              Decl. only
                            </span>
                          ) : (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              exp.status === 'Paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {exp.status}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {exp.receipt_url
                            ? <a href={exp.receipt_url} target="_blank" rel="noreferrer" title="View receipt">
                                <ExternalLink className="h-3.5 w-3.5 text-primary mx-auto" />
                              </a>
                            : <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
                          }
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push(`/finance/expenses/edit/${exp.id}`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(exp.id, exp.particulars)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted font-semibold">
                    <td colSpan={5} className="p-2">YTW Total ({ytwExpenses.length} entries)</td>
                    <td className="p-2 text-right text-green-700">{php(totalVAT)}</td>
                    <td className="p-2 text-right">{php(totalAmount)}</td>
                    <td colSpan={4} />
                  </tr>
                  {totalDeclOnly > 0 && (
                    <tr className="border-t bg-violet-50 text-violet-700 text-sm">
                      <td colSpan={5} className="p-2">Declaration only ({visibleExpenses.filter(e => e.declarable_only).length} entries)</td>
                      <td className="p-2 text-right">—</td>
                      <td className="p-2 text-right font-medium">{php(totalDeclOnly)}</td>
                      <td colSpan={4} />
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
