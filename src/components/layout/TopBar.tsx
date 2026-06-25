'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Profile } from '@/types';
import {
  Bell,
  Search,
  Menu,
  LogOut,
  User,
  Settings,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

interface TopBarProps {
  profile: Profile & { schools?: { name: string } | null };
}

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    toast.success('Signed out successfully');
  }

  const displayName = `${profile.first_name} ${profile.last_name}`;
  const roleLabel = profile.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <header className="h-[64px] bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-muted-foreground hover:text-foreground">
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search students, teachers..."
            className="pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg w-72
                       focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background
                       transition-all placeholder:text-muted-foreground"
          />
          <kbd className="absolute right-3 text-[10px] text-muted-foreground bg-border px-1.5 py-0.5 rounded hidden lg:block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {profile.first_name[0]}{profile.last_name[0]}
              </span>
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-foreground leading-none">
                {displayName}
              </span>
              <span className="text-[11px] text-muted-foreground leading-none mt-0.5">
                {roleLabel}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { router.push('/dashboard/profile'); setProfileOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { router.push('/dashboard/settings'); setProfileOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </button>
                </div>

                <div className="py-1 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
