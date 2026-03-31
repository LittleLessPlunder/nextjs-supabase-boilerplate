'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { Employee, RevenueStream } from '@/utils/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addEmployee, updateEmployee, getEmployee, getPositions } from '@/utils/supabase/queries';

interface Position {
  id: string;
  title: string;
}

const REVENUE_STREAM_LABELS: Record<RevenueStream, string> = {
  fnb: 'F&B',
  yoga: 'Yoga',
  boutique: 'Boutique',
  general: 'General / Admin',
};

export default function AddEmployeeForm({ employeeId }: { employeeId: string | null }) {
  const [formData, setFormData] = useState({
    given_name: '',
    surname: '',
    email: '',
    mobile_number: '',
    home_address: '',
    birth_date: '',
    hire_date: '',
    position_id: '',
    revenue_stream: '' as RevenueStream | '',
    daily_rate: '',
    sss_number: '',
    philhealth_number: '',
    pagibig_number: '',
    is_active: true,
    employment_status: 'active',
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant) return;
      try {
        const supabase: SupabaseClient = createClient();

        const { positions: positionsData } = await getPositions(supabase, currentTenant.id);
        if (positionsData) setPositions(positionsData);

        if (employeeId) {
          const employee = await getEmployee(supabase, employeeId);
          if (employee && employee.tenant_id === currentTenant.id) {
            setFormData({
              given_name: employee.given_name ?? '',
              surname: employee.surname ?? '',
              email: employee.email ?? '',
              mobile_number: employee.mobile_number ?? '',
              home_address: employee.home_address ?? '',
              birth_date: employee.birth_date ?? '',
              hire_date: employee.hire_date ?? '',
              position_id: employee.position_id ?? '',
              revenue_stream: employee.revenue_stream ?? '',
              daily_rate: employee.daily_rate?.toString() ?? '',
              sss_number: employee.sss_number ?? '',
              philhealth_number: employee.philhealth_number ?? '',
              pagibig_number: employee.pagibig_number ?? '',
              is_active: employee.is_active ?? true,
              employment_status: (employee as any).employment_status ?? 'active',
            });
          } else {
            toast({ title: "Error", description: "Employee not found.", variant: "destructive" });
            router.push('/employees');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      }
    };

    fetchData();
  }, [employeeId, currentTenant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentTenant) {
      setError('No tenant selected.');
      return;
    }
    if (!formData.given_name || !formData.email) {
      setError('Given name and email are required.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const employeeData = {
        given_name: formData.given_name,
        surname: formData.surname || null,
        email: formData.email,
        mobile_number: formData.mobile_number || null,
        home_address: formData.home_address || null,
        birth_date: formData.birth_date || null,
        hire_date: formData.hire_date || null,
        position_id: formData.position_id || null,
        revenue_stream: formData.revenue_stream || null,
        daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
        sss_number: formData.sss_number || null,
        philhealth_number: formData.philhealth_number || null,
        pagibig_number: formData.pagibig_number || null,
        is_active: formData.is_active,
        employment_status: formData.employment_status,
        tenant_id: currentTenant.id,
        is_deleted: false,
      };

      if (employeeId) {
        await updateEmployee(supabase, { id: employeeId, ...employeeData });
      } else {
        await addEmployee(supabase, employeeData);
      }

      router.push('/employees');
    } catch (err: any) {
      setError(err.message || 'Failed to save employee.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{employeeId ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">

              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Basic Info</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="given_name">Given Name *</Label>
                      <Input
                        id="given_name"
                        name="given_name"
                        value={formData.given_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="surname">Surname</Label>
                      <Input
                        id="surname"
                        name="surname"
                        value={formData.surname}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mobile_number">Mobile Number</Label>
                      <Input
                        id="mobile_number"
                        name="mobile_number"
                        value={formData.mobile_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="birth_date">Birth Date</Label>
                      <DatePicker value={formData.birth_date} onChange={val => setFormData(prev => ({ ...prev, birth_date: val }))} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="home_address">Home Address</Label>
                    <Input
                      id="home_address"
                      name="home_address"
                      value={formData.home_address}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hire_date">Hire Date</Label>
                      <DatePicker value={formData.hire_date} onChange={val => setFormData(prev => ({ ...prev, hire_date: val }))} />
                    </div>
                    <div>
                      <Label>Employment Status</Label>
                      <Select
                        value={formData.employment_status}
                        onValueChange={(val) => {
                          const inactive = val === 'resigned' || val === 'terminated';
                          setFormData(prev => ({ ...prev, employment_status: val, is_active: !inactive }));
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="probationary">Probationary</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="under_investigation">Under Investigation</SelectItem>
                          <SelectItem value="resigned">Resigned</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* YTW Details */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">YTW Details</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Position</Label>
                      <Select
                        value={formData.position_id}
                        onValueChange={(val) =>
                          setFormData(prev => ({ ...prev, position_id: val }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position..." />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Revenue Stream</Label>
                      <Select
                        value={formData.revenue_stream}
                        onValueChange={(val) =>
                          setFormData(prev => ({ ...prev, revenue_stream: val as RevenueStream }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stream..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(REVENUE_STREAM_LABELS) as [RevenueStream, string][]).map(([val, label]) => (
                            <SelectItem key={val} value={val}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="daily_rate">Daily Rate (PHP)</Label>
                    <Input
                      id="daily_rate"
                      name="daily_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sss_number">SSS Number</Label>
                      <Input
                        id="sss_number"
                        name="sss_number"
                        value={formData.sss_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="philhealth_number">PhilHealth Number</Label>
                      <Input
                        id="philhealth_number"
                        name="philhealth_number"
                        value={formData.philhealth_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pagibig_number">Pag-IBIG Number</Label>
                      <Input
                        id="pagibig_number"
                        name="pagibig_number"
                        value={formData.pagibig_number}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && <div className="text-red-500 bg-red-100 p-2 rounded text-sm">{error}</div>}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push('/employees')}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
