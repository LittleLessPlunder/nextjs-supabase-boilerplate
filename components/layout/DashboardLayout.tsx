'use client';

import { Sidebar } from './Sidebar';
import { User } from '@supabase/supabase-js';
import { useState, Suspense } from 'react';
import { List, MagnifyingGlass } from '@phosphor-icons/react';
import { Loading } from '@/components/ui/loading';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  user: User;
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0">
            <Sidebar onClose={() => setSidebarOpen(false)} user={user} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar user={user} />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar — mobile only + search */}
        <header className="flex items-center justify-between h-14 px-4 bg-background lg:hidden border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <List weight="light" className="h-5 w-5" />
          </button>
          <button
            onClick={() => router.push('/search')}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <MagnifyingGlass weight="light" className="h-4 w-4" />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <Suspense fallback={<Loading />}>
            <div key={pathname} className="animate-page-in h-full">
              {children}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
