import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import FinanceEntriesPage from '@/components/finance/FinanceEntriesPage';

export default async function RevenuePage() {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) redirect('/auth/signin');

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <FinanceEntriesPage user={user} type="revenue" />
      </DashboardLayout>
    </div>
  );
}
