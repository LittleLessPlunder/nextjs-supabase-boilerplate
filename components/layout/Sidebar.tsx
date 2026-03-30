'use client'

import { Button } from "@/components/ui/button";
import { Users, Briefcase, X, ChevronLeft, ChevronRight, Calendar, FileText, Clock, Database, Calculator, Receipt, Store, TrendingUp, CreditCard, BarChart2, LayoutDashboard, Search, CheckSquare } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import React, { useState } from 'react';

interface SidebarProps {
  onClose?: () => void;
}

type NavChild = { title: string; href: string; icon: React.ElementType };
type NavItem =
  | { title: string; href: string; icon: React.ElementType; children?: never }
  | { title: string; href?: never; icon: React.ElementType; children: NavChild[] };

const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Search",
    href: "/search",
    icon: Search,
  },
  {
    title: "Finance",
    icon: Receipt,
    children: [
      { title: "P&L Report",       href: "/finance/pnl",         icon: BarChart2      },
      { title: "Revenue",          href: "/finance/revenue",     icon: TrendingUp     },
      { title: "Expenses",         href: "/finance/expenses",    icon: Receipt        },
      { title: "Expense Report",   href: "/finance/expenses/report", icon: BarChart2  },
      { title: "Card Settlements", href: "/finance/settlements", icon: CreditCard     },
      { title: "Vendors",          href: "/finance/vendors",     icon: Store          },
      { title: "Month-End Close",  href: "/finance/close",       icon: CheckSquare    },
    ],
  },
  {
    title: "People",
    icon: Users,
    children: [
      { title: "Employees",       href: "/employees",         icon: Users      },
      { title: "Employee Records", href: "/employees/records", icon: FileText   },
      { title: "Payroll",         href: "/payroll",           icon: Calculator },
    ],
  },
  {
    title: "Master Data",
    icon: Database,
    children: [
      { title: "Positions",       href: "/master/positions",      icon: Briefcase },
      { title: "Contract Types",  href: "/master/contract-types", icon: FileText  },
      { title: "Work Schedules",  href: "/master/schedules",      icon: Clock     },
      { title: "Public Holidays", href: "/master/holidays",       icon: Calendar  },
    ],
  },
];

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSection = (title: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setExpandedSection(title);
    } else {
      setExpandedSection(expandedSection === title ? null : title);
    }
  };

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className={`bg-[#3D4028] text-[#E8EAE0] flex flex-col h-full transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-20'
    }`}>
      <div className="p-4">
        {/* Logo and Title */}
        <div className="mb-8 flex items-center justify-between">
          <Logo iconOnly={!isExpanded} />
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex"
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {NAVIGATION_ITEMS.map((item) => (
            <div key={item.title}>
              {item.children ? (
                // Parent item with children
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className={`w-full ${isExpanded ? 'justify-start' : 'justify-center'} text-[#E8EAE0] hover:bg-white/10 hover:text-white ${expandedSection === item.title ? 'bg-white/10 text-white' : ''}`}
                    onClick={() => toggleSection(item.title)}
                    title={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">{item.title}</span>}
                  </Button>
                  {isExpanded && expandedSection === item.title && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href}>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start text-[#E8EAE0] hover:bg-white/10 hover:text-white text-sm ${
                              isActiveLink(child.href)
                                ? 'bg-[#A55437] text-white hover:bg-[#A55437]/90'
                                : ''
                            }`}
                            size="sm"
                          >
                            <child.icon className="h-4 w-4" />
                            <span className="ml-2">{child.title}</span>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Single item
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full ${isExpanded ? 'justify-start' : 'justify-center'} text-[#E8EAE0] hover:bg-white/10 hover:text-white ${
                      isActiveLink(item.href)
                        ? 'bg-[#A55437] text-white hover:bg-[#A55437]/90'
                        : ''
                    }`}
                    title={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">{item.title}</span>}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}