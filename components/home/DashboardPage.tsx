'use client'

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { getRevenue, getExpenses, getSettlements } from '@/utils/supabase/queries';
import {
  TrendUp, Receipt, CreditCard, ChartBar,
  Users, Calculator, Storefront, Plus, ArrowUpRight,
  MagnifyingGlass,
} from '@phosphor-icons/react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function php(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    from:  `${y}-${m}-01`,
    to:    `${y}-${m}-${last}`,
    label: now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
  };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-PH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function toFirstName(email: string | undefined) {
  if (!email) return 'there';
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  const raw = parts[0];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, loading,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string; loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums tracking-tight">
          {loading ? <span className="text-muted-foreground/40">—</span> : value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Shortcut card ────────────────────────────────────────────────────────────

function Shortcut({
  icon: Icon, label, href, accent = 'bg-gray-100 text-gray-600',
}: {
  icon: React.ElementType; label: string; href: string; accent?: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="group flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 shadow-sm border border-black/5 hover:shadow-md hover:border-black/10 transition-all duration-150 text-left w-full"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage({ user }: { user: User }) {
  const { currentTenant } = useTenant();
  const router = useRouter();
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
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [currentTenant, from, to]);

  useEffect(() => { load(); }, [load]);

  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, {toFirstName(user.email)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{todayLabel()}</p>
        </div>
        <button
          onClick={() => router.push('/search')}
          className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground bg-white border border-black/8 rounded-xl px-3 py-2 hover:border-black/20 transition-colors shadow-sm"
        >
          <MagnifyingGlass weight="light" className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Total Revenue"
          value={php(totalRevenue)}
          sub={label}
          icon={TrendUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
        <StatCard
          label="Total Expenses"
          value={php(totalExpenses)}
          sub={label}
          icon={Receipt}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          loading={loading}
        />
        <StatCard
          label="Net Profit"
          value={php(netProfit)}
          sub={label}
          icon={ChartBar}
          iconBg={netProfit >= 0 ? 'bg-status-info/30' : 'bg-status-danger/30'}
          iconColor={netProfit >= 0 ? 'text-finance-neutral' : 'text-finance-negative'}
          loading={loading}
        />
        <StatCard
          label="Card Settlements"
          value={php(totalSettled)}
          sub="Declared to bank"
          icon={CreditCard}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          loading={loading}
        />
      </div>

      {/* Quick log */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Log
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Shortcut icon={Plus}     label="Log Revenue"    href="/finance/revenue/add"     accent="bg-emerald-50 text-emerald-600" />
          <Shortcut icon={Receipt}  label="Log Expense"    href="/finance/expenses/add"    accent="bg-orange-50 text-orange-500"  />
          <Shortcut icon={CreditCard} label="Log Settlement" href="/finance/settlements/add" accent="bg-violet-50 text-violet-600" />
        </div>
      </div>

      {/* Reports */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Reports
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Shortcut icon={ChartBar}  label="P&L Report"    href="/finance/pnl"              accent="bg-purple-50 text-purple-600" />
          <Shortcut icon={TrendUp} label="Revenue Log"   href="/finance/revenue"          accent="bg-emerald-50 text-emerald-600" />
          <Shortcut icon={Receipt}    label="Expense Log"   href="/finance/expenses"         accent="bg-orange-50 text-orange-500" />
        </div>
      </div>

      {/* People */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          People
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Shortcut icon={Users}      label="Employees"  href="/employees" accent="bg-sky-50 text-sky-600"  />
          <Shortcut icon={Calculator} label="Payroll"    href="/payroll"   accent="bg-rose-50 text-rose-500" />
          <Shortcut icon={Storefront} label="Vendors"    href="/finance/vendors" accent="bg-amber-50 text-amber-600" />
        </div>
      </div>

    </div>
  );
}
