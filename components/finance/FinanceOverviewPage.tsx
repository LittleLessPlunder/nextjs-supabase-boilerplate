'use client';

import { User } from '@supabase/supabase-js';
import DashboardCharts from './DashboardCharts';

export default function FinanceOverviewPage({ user: _user }: { user: User }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue, expenses and profit at a glance</p>
      </div>
      <DashboardCharts />
    </div>
  );
}
