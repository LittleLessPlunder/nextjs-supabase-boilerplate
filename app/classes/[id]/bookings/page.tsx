import SlotBookingsPage from '@/components/misc/SlotBookingsPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingsPage({ params }: Props) {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');

  const { id } = await params;

  return (
    <DashboardLayout user={user}>
      <SlotBookingsPage slotId={id} />
    </DashboardLayout>
  );
}
