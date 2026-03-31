'use client'

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import {
  Users, Briefcase, X, Calendar, FileText, Clock, Database,
  Calculator, Receipt, Store, TrendingUp, CreditCard, BarChart2,
  LayoutDashboard, Search, CheckSquare, LogOut,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface SidebarProps {
  onClose?: () => void;
  user?: User | null;
}

type NavChild = { title: string; href: string; icon: React.ElementType };
type NavSection =
  | { kind: 'link';    title: string; href: string; icon: React.ElementType }
  | { kind: 'section'; title: string; children: NavChild[] };

const NAV: NavSection[] = [
  { kind: 'link',    title: 'Dashboard', href: '/',       icon: LayoutDashboard },
  { kind: 'link',    title: 'Search',    href: '/search', icon: Search          },
  {
    kind: 'section', title: 'Finance',
    children: [
      { title: 'P&L Report',       href: '/finance/pnl',             icon: BarChart2   },
      { title: 'Revenue',          href: '/finance/revenue',         icon: TrendingUp  },
      { title: 'Expenses',         href: '/finance/expenses',        icon: Receipt     },
      { title: 'Expense Report',   href: '/finance/expenses/report', icon: BarChart2   },
      { title: 'Card Settlements', href: '/finance/settlements',     icon: CreditCard  },
      { title: 'Vendors',          href: '/finance/vendors',         icon: Store       },
      { title: 'Month-End Close',  href: '/finance/close',           icon: CheckSquare },
    ],
  },
  {
    kind: 'section', title: 'People',
    children: [
      { title: 'Employees',        href: '/employees',         icon: Users      },
      { title: 'Employee Records', href: '/employees/records', icon: FileText   },
      { title: 'Payroll',          href: '/payroll',           icon: Calculator },
    ],
  },
  {
    kind: 'section', title: 'Master Data',
    children: [
      { title: 'Positions',       href: '/master/positions',      icon: Briefcase },
      { title: 'Contract Types',  href: '/master/contract-types', icon: FileText  },
      { title: 'Work Schedules',  href: '/master/schedules',      icon: Clock     },
      { title: 'Public Holidays', href: '/master/holidays',       icon: Calendar  },
    ],
  },
];

function getInitials(email: string | undefined) {
  if (!email) return '?';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Sidebar({ onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/signin');
  }

  return (
    <aside className="bg-[#3D4028] flex flex-col h-full w-64 shrink-0">

      {/* Logo */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <Logo />
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-[#B0B49A] hover:text-white p-1 rounded">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {NAV.map((item) => {
          if (item.kind === 'link') {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <span className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-[#C8CCBA] hover:bg-white/8 hover:text-white'
                }`}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.title}
                </span>
              </Link>
            );
          }

          return (
            <div key={item.title} className="pt-4">
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#7A7F64]">
                {item.title}
              </p>
              <div className="space-y-0.5">
                {item.children.map((child) => {
                  const active = isActive(child.href);
                  return (
                    <Link key={child.href} href={child.href} onClick={onClose}>
                      <span className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-[#A55437]/80 text-white font-medium'
                          : 'text-[#C8CCBA] hover:bg-white/8 hover:text-white'
                      }`}>
                        <child.icon className="h-4 w-4 shrink-0" />
                        {child.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-5 pt-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[#A55437] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {getInitials(user?.email)}
          </div>
          <span className="flex-1 text-xs text-[#B0B49A] truncate">
            {user?.email?.split('@')[0] ?? ''}
          </span>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="text-[#7A7F64] hover:text-white transition-colors p-1 rounded"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
