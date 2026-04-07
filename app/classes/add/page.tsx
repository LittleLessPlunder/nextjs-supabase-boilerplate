import ClassSlotForm from '@/components/misc/ClassSlotForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function AddClass({ searchParams }: Props) {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');

  const { date } = await searchParams;

  return (
    <DashboardLayout user={user}>
      <ClassSlotForm slotId={null} prefillDate={date} />
    </DashboardLayout>
  );
}
