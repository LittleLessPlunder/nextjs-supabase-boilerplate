import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import AddSettlementForm from '@/components/misc/AddSettlementForm';

export default async function Page() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');
  return (
    <DashboardLayout user={user}>
      <AddSettlementForm settlementId={null} />
    </DashboardLayout>
  );
}
