'use client'

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Receipt, TrendingUp, Store, Search, Loader2, ExternalLink, ArrowRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpenseResult {
  id: string;
  date: string;
  particulars: string;
  or_number: string | null;
  amount: number;
  status: string;
  declarable_only: boolean;
  vendor_name: string | null;
  vendor: { name: string } | null;
  category: { name: string } | null;
}

interface RevenueResult {
  id: string;
  date: string;
  revenue_stream: string;
  amount: number;
  notes: string | null;
  class_type: string | null;
  fnb_source: string | null;
}

interface VendorResult {
  id: string;
  name: string;
  tin: string | null;
  is_vat_registered: boolean;
}

interface Results {
  expenses: ExpenseResult[];
  revenue: RevenueResult[];
  vendors: VendorResult[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STREAM_LABELS: Record<string, string> = {
  yoga: 'Yoga / Pilates',
  fnb: 'F&B',
  boutique: 'Boutique',
};

const STREAM_COLORS: Record<string, string> = {
  yoga:     'bg-blue-100 text-blue-800',
  fnb:      'bg-orange-100 text-orange-800',
  boutique: 'bg-purple-100 text-purple-800',
};

function revenueDescription(e: RevenueResult): string {
  if (e.revenue_stream === 'yoga') return e.class_type ?? '—';
  if (e.revenue_stream === 'fnb')  return e.fnb_source ?? 'POS Report';
  if (e.notes) return e.notes;
  return STREAM_LABELS[e.revenue_stream] ?? e.revenue_stream;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GlobalSearch({ user }: { user: User }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant } = useTenant();

  const [query,   setQuery]   = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalCount = results
    ? results.expenses.length + results.revenue.length + results.vendors.length
    : 0;

  const runSearch = useCallback(async (q: string) => {
    if (!currentTenant || q.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const tid = currentTenant.id;
      const term = `%${q.trim()}%`;

      const [expRes, revRes, venRes] = await Promise.all([
        supabase
          .from('Expenses')
          .select('id, date, particulars, or_number, amount, status, declarable_only, vendor_name, vendor:Vendors(name), category:ExpenseCategories(name)')
          .eq('tenant_id', tid)
          .eq('is_deleted', false)
          .or(`particulars.ilike.${term},or_number.ilike.${term},notes.ilike.${term},vendor_name.ilike.${term}`)
          .order('date', { ascending: false })
          .limit(25),

        supabase
          .from('Revenue')
          .select('id, date, revenue_stream, amount, notes, class_type, fnb_source')
          .eq('tenant_id', tid)
          .eq('is_deleted', false)
          .or(`notes.ilike.${term},class_type.ilike.${term},fnb_source.ilike.${term},revenue_stream.ilike.${term}`)
          .order('date', { ascending: false })
          .limit(25),

        supabase
          .from('Vendors')
          .select('id, name, tin, is_vat_registered')
          .eq('tenant_id', tid)
          .eq('is_deleted', false)
          .or(`name.ilike.${term},tin.ilike.${term}`)
          .order('name')
          .limit(25),
      ]);

      setResults({
        expenses: (expRes.data ?? []) as unknown as ExpenseResult[],
        revenue:  (revRes.data ?? []) as unknown as RevenueResult[],
        vendors:  (venRes.data ?? []) as unknown as VendorResult[],
      });
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  // Debounce search as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Update URL without pushing to history
      const url = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search';
      router.replace(url, { scroll: false });
      runSearch(query);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch, router]);

  // Run search on initial load if q param is present
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) runSearch(q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1">Search</h1>
        <p className="text-sm text-muted-foreground">Search across expenses, revenue entries, and vendors</p>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Input
          autoFocus
          placeholder="Search by vendor, particulars, OR number, TIN…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="h-11 text-base pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Empty state */}
      {!query.trim() && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Start typing to search across the BMS</p>
          <p className="text-xs mt-1 opacity-70">Min. 2 characters · searches expenses, revenue, and vendors</p>
        </div>
      )}

      {query.trim().length === 1 && (
        <p className="text-center text-sm text-muted-foreground py-8">Type at least 2 characters…</p>
      )}

      {/* No results */}
      {results && totalCount === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No results for "{query}"</p>
          <p className="text-xs mt-1">Try a different keyword, vendor name, or OR number</p>
        </div>
      )}

      {/* Results */}
      {results && totalCount > 0 && (
        <div className="space-y-6">

          {/* ── Expenses ── */}
          {results.expenses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Expenses
                </h2>
                <span className="text-xs text-muted-foreground">({results.expenses.length})</span>
              </div>
              <div className="rounded-lg border divide-y overflow-hidden">
                {results.expenses.map(e => {
                  const vendor = e.vendor?.name ?? e.vendor_name ?? null;
                  return (
                    <button
                      key={e.id}
                      onClick={() => router.push(`/finance/expenses/edit/${e.id}`)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 text-left transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {highlight(e.particulars, query)}
                          </span>
                          {e.or_number && (
                            <span className="text-xs font-mono text-muted-foreground">
                              OR {highlight(e.or_number, query)}
                            </span>
                          )}
                          {e.declarable_only && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-medium">
                              Decl. only
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{e.date}</span>
                          {vendor && <><span>·</span><span>{highlight(vendor, query)}</span></>}
                          {e.category && <><span>·</span><span>{e.category.name}</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{php(e.amount)}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            e.status === 'Paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {e.status}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Revenue ── */}
          {results.revenue.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Revenue
                </h2>
                <span className="text-xs text-muted-foreground">({results.revenue.length})</span>
              </div>
              <div className="rounded-lg border divide-y overflow-hidden">
                {results.revenue.map(e => (
                  <button
                    key={e.id}
                    onClick={() => router.push(`/finance/revenue/edit/${e.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 text-left transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${STREAM_COLORS[e.revenue_stream] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STREAM_LABELS[e.revenue_stream] ?? e.revenue_stream}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {highlight(revenueDescription(e), query)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{e.date}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <p className="text-sm font-semibold">{php(e.amount)}</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Vendors ── */}
          {results.vendors.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Vendors
                </h2>
                <span className="text-xs text-muted-foreground">({results.vendors.length})</span>
              </div>
              <div className="rounded-lg border divide-y overflow-hidden">
                {results.vendors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => router.push(`/finance/vendors/edit/${v.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 text-left transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{highlight(v.name, query)}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {v.tin
                          ? <span className="font-mono">{highlight(v.tin, query)}</span>
                          : <span className="italic">No TIN</span>
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        v.is_vat_registered
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {v.is_vat_registered ? 'VAT' : 'Non-VAT'}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
