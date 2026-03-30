import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import VendorsPage from '@/components/misc/VendorsPage';

export default async function FinanceVendorsPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');

  return (
    <DashboardLayout user={user}>
      <VendorsPage user={user} />
    </DashboardLayout>
  );
}
