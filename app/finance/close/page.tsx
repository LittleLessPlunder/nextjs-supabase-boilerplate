import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import MonthEndList from '@/components/misc/MonthEndList';

export default async function MonthEndClosePage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');
  return (
    <DashboardLayout user={user}>
      <MonthEndList user={user} />
    </DashboardLayout>
  );
}
