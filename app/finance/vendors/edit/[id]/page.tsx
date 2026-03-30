import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import AddVendorForm from '@/components/misc/AddVendorForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVendorPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/auth/signin');

  return (
    <DashboardLayout user={user}>
      <AddVendorForm vendorId={id} />
    </DashboardLayout>
  );
}
