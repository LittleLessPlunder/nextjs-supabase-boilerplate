'use client'

import { User } from '@supabase/supabase-js'
import DashboardPage from "@/components/home/DashboardPage"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function HomePage({ user }: { user: User }) {
  return (
    <DashboardLayout user={user}>
      <DashboardPage user={user} />
    </DashboardLayout>
  );
}
