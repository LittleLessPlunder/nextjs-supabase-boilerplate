'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getMonthEndCloses } from '@/utils/supabase/queries';
import { useTenant } from '@/utils/tenant-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, FileText, Plus, CaretRight } from '@phosphor-icons/react';
import { Loading } from '@/components/ui/loading';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthEndClose {
  id: string;
  tenant_id: string;
  period: string;
  status: 'draft' | 'reviewing' | 'locked';
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPeriod(period: string) {
  const d = new Date(period + '-02');
  return d.toLocaleString('en-PH', { month: 'long', year: 'numeric' });
}

function prevMonthDefault() {
  const now = new Date();
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const m = now.getMonth() === 0 ? 12 : now.getMonth();
  return `${y}-${String(m).padStart(2, '0')}`;
}

function StatusBadge({ status }: { status: MonthEndClose['status'] }) {
  if (status === 'locked') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        <Lock weight="light" className="h-3 w-3" /> Locked
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

export default function MonthEndList({ user }: { user: User }) {
  const router = useRouter();
  const { currentTenant } = useTenant();

  const [closes, setCloses] = useState<MonthEndClose[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPeriod, setNewPeriod] = useState(prevMonthDefault());

  useEffect(() => {
    if (!currentTenant) return;
    const supabase = createClient();
    getMonthEndCloses(supabase, currentTenant.id)
      .then((data) => setCloses(data as MonthEndClose[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentTenant]);

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!newPeriod) return;
    router.push(`/finance/close/${newPeriod}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Month-End Close</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review revenue, expenses, and account balances before locking each period.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus weight="light" className="h-4 w-4" />
          Start New Close
        </Button>
      </div>

      {/* New close form */}
      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleStart} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select period (YYYY-MM)
                </label>
                <Input
                  type="month"
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <Button type="submit">Open Walkthrough</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Loading />
          ) : closes.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <FileText weight="light" className="h-10 w-10 opacity-40" />
              <p className="text-sm">No month-end closes yet. Start one above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Period</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {closes.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{formatPeriod(c.period)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1"
                        onClick={() => router.push(`/finance/close/${c.period}`)}
                      >
                        Open <CaretRight weight="light" className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
