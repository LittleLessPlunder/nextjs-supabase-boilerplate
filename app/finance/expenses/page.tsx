import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ExpensesPage from '@/components/misc/ExpensesPage';

export default async function FinanceExpensesPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');

  return (
    <DashboardLayout user={user}>
      <ExpensesPage user={user} />
    </DashboardLayout>
  );
}
