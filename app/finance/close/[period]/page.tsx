import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import MonthEndWalkthrough from '@/components/misc/MonthEndWalkthrough';

export default async function MonthEndPeriodPage({
  params,
}: {
  params: Promise<{ period: string }>;
}) {
  const { period } = await params;
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');
  return (
    <DashboardLayout user={user}>
      <MonthEndWalkthrough user={user} period={period} />
    </DashboardLayout>
  );
}
