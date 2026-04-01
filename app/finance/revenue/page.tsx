import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import RevenuePage from '@/components/misc/RevenuePage';

export default async function FinanceRevenuePage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');
  return (
    <DashboardLayout user={user}>
      <RevenuePage user={user} />
    </DashboardLayout>
  );
}
