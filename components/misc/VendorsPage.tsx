'use client'

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getVendors, deleteVendor } from '@/utils/supabase/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { Plus, PencilSimple, Trash, SealCheck, Buildings, ShoppingBag } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';

interface Vendor {
  id: string;
  name: string;
  address: string | null;
  tin: string | null;
  is_vat_registered: boolean;
  is_consignor: boolean;
}

export default function VendorsPage({ user }: { user: User }) {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await getVendors(supabase, currentTenant.id);
      setVendors(data as Vendor[]);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentTenant]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove vendor "${name}"?`)) return;
    try {
      const supabase = createClient();
      await deleteVendor(supabase, id);
      toast({ title: 'Removed', description: `${name} removed.` });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground">Suppliers used in expense entries</p>
        </div>
        <Button size="sm" onClick={() => router.push('/finance/vendors/add')}>
          <Plus weight="light" className="h-4 w-4 mr-1.5" />Add Vendor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Loading />
          ) : vendors.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Buildings weight="light" className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No vendors yet. Add your first supplier.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted text-left">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">TIN</th>
                  <th className="p-3 font-medium">Address</th>
                  <th className="p-3 font-medium text-center">VAT</th>
                  <th className="p-3 font-medium text-center">Consignor</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{v.name}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{v.tin ?? '—'}</td>
                    <td className="p-3 text-muted-foreground">{v.address ?? '—'}</td>
                    <td className="p-3 text-center">
                      {v.is_vat_registered
                        ? <SealCheck weight="light" className="h-4 w-4 text-green-600 mx-auto" />
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="p-3 text-center">
                      {v.is_consignor
                        ? <ShoppingBag weight="light" className="h-4 w-4 text-purple-600 mx-auto" />
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push(`/finance/vendors/edit/${v.id}`)}>
                          <PencilSimple weight="light" className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(v.id, v.name)}
                        >
                          <Trash weight="light" className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
