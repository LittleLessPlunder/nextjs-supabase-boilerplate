'use client'

import { User } from '@supabase/supabase-js'
import EmployeesPage from "@/components/misc/EmployeesPage"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function HomePage({ user }: { user: User }) {
  return (
    <DashboardLayout user={user}>
      <EmployeesPage user={user} />
    </DashboardLayout>
  );
}
