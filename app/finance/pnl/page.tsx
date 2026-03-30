import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import PnLPage from '@/components/misc/PnLPage';

export default async function Page() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');
  return (
    <DashboardLayout user={user}>
      <PnLPage user={user} />
    </DashboardLayout>
  );
}
