'use client'

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { getRevenue, getExpenses, getSettlements } from '@/utils/supabase/queries';
import {
  TrendingUp, Receipt, CreditCard, BarChart2,
  Users, Calculator, Store, Plus, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    from: `${y}-${m}-01`,
    to:   `${y}-${m}-${last}`,
    label: now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
  };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ─── Shortcut card ────────────────────────────────────────────────────────────

interface ShortcutProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  accent?: string;
  action?: string;
}

function Shortcut({ icon: Icon, label, description, href, accent = 'bg-primary/10 text-primary', action = 'Open' }: ShortcutProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left hover:shadow-md hover:border-primary/30 transition-all duration-150"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
        {action} <ArrowRight className="h-3 w-3" />
      </div>
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${color ?? ''}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage({ user }: { user: User }) {
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(true);

  const [totalRevenue,  setTotalRevenue]  = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSettled,  setTotalSettled]  = useState(0);

  const { from, to, label } = monthRange();

  const load = useCallback(async () => {
    if (!currentTenant) return;
    try {
      const supabase = createClient();
      const [rev, exp, set] = await Promise.all([
        getRevenue(supabase, currentTenant.id, { dateFrom: from, dateTo: to }),
        getExpenses(supabase, currentTenant.id, { dateFrom: from, dateTo: to }),
        getSettlements(supabase, currentTenant.id, { dateFrom: from, dateTo: to }),
      ]);
      setTotalRevenue((rev  as any[]).reduce((s, r) => s + r.amount, 0));
      setTotalExpenses((exp as any[]).reduce((s, e) => s + e.amount, 0));
      setTotalSettled((set  as any[]).reduce((s, e) => s + e.amount, 0));
    } catch {
      // silently fail — stats are non-critical
    } finally {
      setLoading(false);
    }
  }, [currentTenant, from, to]);

  useEffect(() => { load(); }, [load]);

  const netProfit = totalRevenue - totalExpenses;
  const VAT_RATE = 0.12, CARD_FEE_RATE = 0.03;
  const totalAfterTaxes = totalRevenue
    - totalSettled * VAT_RATE
    - totalSettled * CARD_FEE_RATE;

  const firstName = user.email?.split('@')[0] ?? 'there';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{greeting()}, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">
          Here's a snapshot of <span className="font-medium">{label}</span>.
        </p>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="Total Revenue"
          value={loading ? '—' : php(totalRevenue)}
          sub={label}
        />
        <StatCard
          label="Total Expenses"
          value={loading ? '—' : php(totalExpenses)}
          sub={label}
        />
        <StatCard
          label="Net Profit"
          value={loading ? '—' : php(netProfit)}
          sub={label}
          color={netProfit >= 0 ? 'text-green-700' : 'text-red-600'}
        />
        <StatCard
          label="Card Settlements"
          value={loading ? '—' : php(totalSettled)}
          sub="Declared to bank"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Shortcut
            icon={Plus}
            label="Log Revenue"
            description="Record daily income by stream — yoga, F&B, or boutique."
            href="/finance/revenue/add"
            accent="bg-blue-100 text-blue-700"
            action="Log now"
          />
          <Shortcut
            icon={Receipt}
            label="Log Expense"
            description="Add a new expense entry with vendor, VAT, and receipt."
            href="/finance/expenses/add"
            accent="bg-orange-100 text-orange-700"
            action="Log now"
          />
          <Shortcut
            icon={CreditCard}
            label="Log Settlement"
            description="Record today's card terminal settlement amount."
            href="/finance/settlements/add"
            accent="bg-green-100 text-green-700"
            action="Log now"
          />
          <Shortcut
            icon={BarChart2}
            label="P&L Report"
            description="View the full profit & loss breakdown for any month."
            href="/finance/pnl"
            accent="bg-purple-100 text-purple-700"
            action="View"
          />
          <Shortcut
            icon={Users}
            label="Employees"
            description="Manage staff profiles, contracts, and departments."
            href="/employees"
            accent="bg-sky-100 text-sky-700"
            action="View"
          />
          <Shortcut
            icon={Calculator}
            label="Payroll"
            description="Compute, review, and export payroll for any period."
            href="/payroll"
            accent="bg-rose-100 text-rose-700"
            action="View"
          />
        </div>
      </div>

      {/* Finance shortcuts */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Finance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Shortcut
            icon={TrendingUp}
            label="Revenue Log"
            description="Browse and filter all revenue entries by stream and date."
            href="/finance/revenue"
            action="Browse"
          />
          <Shortcut
            icon={Receipt}
            label="Expense Log"
            description="Review all logged expenses, filter by category or vendor."
            href="/finance/expenses"
            action="Browse"
          />
          <Shortcut
            icon={Store}
            label="Vendors"
            description="Manage suppliers, VAT registration, and boutique consignors."
            href="/finance/vendors"
            action="Manage"
          />
        </div>
      </div>

    </div>
  );
}
