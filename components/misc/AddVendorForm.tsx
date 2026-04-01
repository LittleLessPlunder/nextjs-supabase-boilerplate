'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { addVendor, getVendor, updateVendor } from '@/utils/supabase/queries';
import { ArrowLeft } from '@phosphor-icons/react';
import { Loading } from '@/components/ui/loading';

interface Props { vendorId: string | null }

export default function AddVendorForm({ vendorId }: Props) {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const isEdit = !!vendorId;

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    tin: '',
    is_vat_registered: false,
    is_consignor: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!vendorId || !currentTenant) return;
    (async () => {
      try {
        const supabase = createClient();
        const vendor = await getVendor(supabase, currentTenant.id, vendorId);
        setFormData({
          name:              vendor.name ?? '',
          address:           vendor.address ?? '',
          tin:               vendor.tin ?? '',
          is_vat_registered: vendor.is_vat_registered ?? false,
          is_consignor:      vendor.is_consignor ?? false,
        });
      } catch {
        toast({ title: 'Error', description: 'Could not load vendor.', variant: 'destructive' });
      } finally {
        setFetching(false);
      }
    })();
  }, [vendorId, currentTenant]);

  const set = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTenant) return;
    if (!formData.name.trim()) {
      toast({ title: 'Validation', description: 'Vendor name is required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      if (isEdit) {
        await updateVendor(supabase, vendorId!, formData);
        toast({ title: 'Saved', description: 'Vendor updated.' });
      } else {
        await addVendor(supabase, { ...formData, tenant_id: currentTenant.id });
        toast({ title: 'Added', description: 'Vendor created.' });
      }
      router.push('/finance/vendors');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message ?? 'Failed to save.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <Loading />;

  return (
    <div className="container mx-auto max-w-lg mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/finance/vendors')}>
          <ArrowLeft weight="light" className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit Vendor' : 'New Vendor'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendor Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">

            <div>
              <Label>Vendor / Supplier Name *</Label>
              <Input
                value={formData.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Aethan Fruit & Vegetables Stall"
              />
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={e => set('address', e.target.value)}
                placeholder="e.g. Villa Libertad, El Nido"
              />
            </div>

            <div>
              <Label>TIN (Tax Identification Number)</Label>
              <Input
                value={formData.tin}
                onChange={e => set('tin', e.target.value)}
                placeholder="e.g. 007-793-938-00013"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                id="vat"
                type="checkbox"
                checked={formData.is_vat_registered}
                onChange={e => set('is_vat_registered', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="vat" className="cursor-pointer">
                VAT-registered supplier
                <span className="block text-xs font-normal text-muted-foreground">
                  VAT (12%) will be auto-calculated when logging expenses
                </span>
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="consignor"
                type="checkbox"
                checked={formData.is_consignor}
                onChange={e => set('is_consignor', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="consignor" className="cursor-pointer">
                Boutique consignor
                <span className="block text-xs font-normal text-muted-foreground">
                  Appears in the consignor selector when logging boutique revenue
                </span>
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vendor'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/finance/vendors')}>
                Cancel
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
