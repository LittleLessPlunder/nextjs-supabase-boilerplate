'use client'

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getEmployees } from '@/utils/supabase/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { RevenueStream } from '@/utils/types';

interface EmployeesPageProps {
  user: User;
}

type EmploymentStatus = 'active' | 'probationary' | 'on_leave' | 'suspended' | 'under_investigation' | 'resigned' | 'terminated';

const STATUS_META: Record<EmploymentStatus, { label: string; className: string }> = {
  active:               { label: 'Active',               className: 'bg-green-100 text-green-800'  },
  probationary:         { label: 'Probationary',         className: 'bg-blue-100 text-blue-800'    },
  on_leave:             { label: 'On Leave',             className: 'bg-yellow-100 text-yellow-800'},
  suspended:            { label: 'Suspended',            className: 'bg-orange-100 text-orange-800'},
  under_investigation:  { label: 'Under Investigation',  className: 'bg-red-100 text-red-800'      },
  resigned:             { label: 'Resigned',             className: 'bg-gray-100 text-gray-500'    },
  terminated:           { label: 'Terminated',           className: 'bg-gray-200 text-gray-600'    },
};

interface Employee {
  id: string;
  given_name: string;
  surname: string;
  is_active: boolean;
  employment_status: EmploymentStatus | null;
  revenue_stream: RevenueStream | null;
  daily_rate: number | null;
  position: { title: string } | null;
}

const REVENUE_STREAM_LABELS: Record<RevenueStream, string> = {
  fnb: 'F&B',
  yoga: 'Yoga',
  boutique: 'Boutique',
  general: 'General / Admin',
};

export default function EmployeesPage({ user }: EmployeesPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (currentTenant) loadEmployees();
  }, [currentPage, itemsPerPage, currentTenant]);

  async function loadEmployees() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { employees, count } = await getEmployees(supabase, currentTenant!.id, currentPage, itemsPerPage);
      if (employees) {
        setEmployees(employees);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({ title: "Error", description: "Failed to load employees.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Tenant Selected</h2>
          <Button className="mt-4" onClick={() => router.push('/account')}>Go to Account Settings</Button>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employee Registry</CardTitle>
          <Link href="/employees/add">
            <Button variant="default">+ Add New</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Name</th>
                <th className="p-2">Position</th>
                <th className="p-2">Revenue Stream</th>
                <th className="p-2">Daily Rate</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/employees/edit/${employee.id}`)}
                >
                  <td className="p-2">
                    {employee.given_name}{employee.surname ? ` ${employee.surname}` : ''}
                  </td>
                  <td className="p-2">{employee.position?.title ?? '—'}</td>
                  <td className="p-2">
                    {employee.revenue_stream
                      ? REVENUE_STREAM_LABELS[employee.revenue_stream]
                      : '—'}
                  </td>
                  <td className="p-2">
                    {employee.daily_rate != null
                      ? `₱${employee.daily_rate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="p-2">
                    {(() => {
                      const s = employee.employment_status ?? (employee.is_active ? 'active' : 'terminated');
                      const meta = STATUS_META[s as EmploymentStatus] ?? STATUS_META.active;
                      return (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${meta.className}`}>
                          {meta.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/employees/edit/${employee.id}`);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
