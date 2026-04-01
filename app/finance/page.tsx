import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import FinanceOverviewPage from '@/components/finance/FinanceOverviewPage';

export default async function FinancePage() {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) redirect('/auth/signin');

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <FinanceOverviewPage user={user} />
      </DashboardLayout>
    </div>
  );
}
