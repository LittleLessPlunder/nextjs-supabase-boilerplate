import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import GlobalSearch from '@/components/misc/GlobalSearch';
import { Suspense } from 'react';

export default async function SearchPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');

  return (
    <DashboardLayout user={user}>
      <Suspense>
        <GlobalSearch user={user} />
      </Suspense>
    </DashboardLayout>
  );
}
