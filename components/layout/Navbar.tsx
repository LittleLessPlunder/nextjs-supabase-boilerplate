'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { List, SignOut, MagnifyingGlass } from '@phosphor-icons/react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user: User | null;
  onMenuClick: () => void;
}

function getInitials(email: string | undefined) {
  if (!email) return '?';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/signin');
  }

  return (
    <header className="sticky border-b top-0 z-40 w-full bg-background/95 backdrop-blur-sm">
      <div className="h-14 px-4 flex items-center justify-between lg:justify-end">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <List weight="light" className="h-5 w-5" />
        </Button>

        {/* Right side */}
        <TooltipProvider delayDuration={400}>
          <div className="flex items-center gap-2">
            {/* Search */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/search')}
                  className="text-muted-foreground"
                >
                  <MagnifyingGlass weight="light" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search (⌘K)</TooltipContent>
            </Tooltip>

            {/* User avatar chip */}
            {user && (
              <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {getInitials(user.email)}
                </div>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email?.split('@')[0]}
                </span>
              </div>
            )}

            {/* Sign out */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <SignOut weight="light" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign out</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
