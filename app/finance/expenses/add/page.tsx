import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import AddExpenseForm from '@/components/misc/AddExpenseForm';

export default async function AddExpensePage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');

  return (
    <DashboardLayout user={user}>
      <AddExpenseForm expenseId={null} />
    </DashboardLayout>
  );
}
