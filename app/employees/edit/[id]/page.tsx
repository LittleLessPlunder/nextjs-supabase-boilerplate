import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import AddEmployeeForm from '@/components/misc/AddEmployeeForm';
import EmployeeRecordsSection from '@/components/misc/EmployeeRecordsSection';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEmployee({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) redirect('/auth/signin');

  // Get tenant id for the records section
  const { data: ut } = await supabase
    .from('UserTenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  return (
    <DashboardLayout user={user}>
      <div className="container mx-auto max-w-2xl space-y-6">
        <AddEmployeeForm employeeId={id} />
        {ut?.tenant_id && (
          <EmployeeRecordsSection employeeId={id} tenantId={ut.tenant_id} />
        )}
      </div>
    </DashboardLayout>
  );
}
