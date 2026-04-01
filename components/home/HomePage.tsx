'use client'

import { User } from '@supabase/supabase-js'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import DashboardCharts from '@/components/finance/DashboardCharts'

export default function HomePage({ user }: { user: User }) {
  return (
    <DashboardLayout user={user}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back — here's your business at a glance</p>
        </div>
        <DashboardCharts />
      </div>
    </DashboardLayout>
  );
}
