'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTenant } from '@/utils/tenant-context';
import { toast } from "@/components/ui/use-toast";
import { getPublicHoliday, addPublicHoliday, updatePublicHoliday } from '@/utils/supabase/queries';

// ─── Pay rule reference ──────────────────────────────────────────────────────

const PAY_RULES: Record<string, { label: string; badge: string; rules: string[] }> = {
  regular: {
    label: 'Regular Holiday',
    badge: 'bg-blue-100 text-blue-800',
    rules: [
      'Not worked → 100% of daily rate (still paid)',
      'Worked → 200% of daily rate',
      'Worked on rest day → 260% of daily rate',
    ],
  },
  special_non_working: {
    label: 'Special Non-Working Day',
    badge: 'bg-amber-100 text-amber-800',
    rules: [
      'Not worked → No pay (no work, no pay principle)',
      'Worked → 130% of daily rate',
      'Worked on rest day → 150% of daily rate',
    ],
  },
};

interface FormData {
  date: string;
  name: string;
  type: string;
}

const initialFormData: FormData = {
  date: '',
  name: '',
  type: 'regular',
};

export default function AddPublicHolidayForm({ holidayId }: { holidayId: string | null }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const router   = useRouter();
  const supabase: SupabaseClient = createClient();
  const { currentTenant } = useTenant();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant) return;
      try {
        setLoading(true);
        if (holidayId) {
          const holiday = await getPublicHoliday(supabase, holidayId);
          if (holiday) {
            setFormData({
              date: holiday.date.split('T')[0],
              name: holiday.name,
              type: holiday.type ?? 'regular',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [holidayId, currentTenant]);

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
    if (!formData.date || !formData.name) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const holidayData = { ...formData, tenant_id: currentTenant.id };
      if (holidayId) {
        await updatePublicHoliday(supabase, { id: holidayId, ...holidayData });
      } else {
        await addPublicHoliday(supabase, holidayData);
      }
      router.push('/master/holidays');
      toast({ title: 'Success', description: `Holiday ${holidayId ? 'updated' : 'added'} successfully.` });
    } catch (err: any) {
      setError(err.message || 'Failed to save holiday.');
    }
  };

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Tenant Selected</h2>
          <p className="text-muted-foreground">Please select a tenant from your account settings.</p>
          <Button className="mt-4" onClick={() => router.push('/account')}>Go to Account Settings</Button>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  const rule = PAY_RULES[formData.type] ?? PAY_RULES.regular;

  return (
    <div className="container mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{holidayId ? 'Edit Holiday' : 'Add New Holiday'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date" name="date" type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Holiday Name *</Label>
                <Input
                  id="name" name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Holiday Type *</Label>
                <Select value={formData.type} onValueChange={v => setFormData(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Holiday</SelectItem>
                    <SelectItem value="special_non_working">Special Non-Working Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push('/master/holidays')}>
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Pay rule reference card */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${rule.badge}`}>{rule.label}</span>
            <span className="text-xs text-muted-foreground">DOLE pay rules</span>
          </div>
          <ul className="space-y-1">
            {rule.rules.map(r => (
              <li key={r} className="text-sm text-muted-foreground flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">·</span>{r}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
