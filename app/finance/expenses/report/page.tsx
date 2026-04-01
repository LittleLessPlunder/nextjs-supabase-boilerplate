import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ExpensesReport from '@/components/misc/ExpensesReport';

export default async function ExpenseReportPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');

  return (
    <DashboardLayout user={user}>
      <ExpensesReport user={user} />
    </DashboardLayout>
  );
}
