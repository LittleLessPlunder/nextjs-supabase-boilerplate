import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import PayrollGrid from '@/components/misc/PayrollGrid';

interface PageProps {
  params: Promise<{ year: string; month: string; period: string }>;
}

export default async function PayrollGridPage({ params }: PageProps) {
  const { year, month, period } = await params;
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');

  return (
    <DashboardLayout user={user}>
      <PayrollGrid
        year={parseInt(year)}
        month={parseInt(month)}
        period={parseInt(period) as 1 | 2}
      />
    </DashboardLayout>
  );
}
