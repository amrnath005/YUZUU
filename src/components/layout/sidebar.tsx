"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  Moon,
  Sun,
  Cloud,
  LogOut,
  LogIn
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Work', href: '/work', icon: Briefcase },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Statements', href: '/statements', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, workspace, openAuthModal, signOut, isConfigured } = useAuth();

  const displayName = user?.name || (isConfigured ? 'Guest Freelancer' : 'Demo Workspace');
  const displayEmail = user?.email || (workspace ? workspace.name : (isConfigured ? 'Not signed in' : 'Local demo'));

  return (
    <div className="hidden md:flex flex-col w-60 h-screen border-r border-[var(--color-border)] bg-[var(--color-bg)] sticky top-0">
      <div className="p-6">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-sans relative">
            y<span className="relative inline-block">u<span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-[var(--color-yuzu)] rounded-full" /></span>zu
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative',
                  isActive
                    ? 'text-[var(--color-text-primary)] bg-[var(--color-surface-muted)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]/50'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--color-yuzu)] rounded-r-full" />
                )}
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[var(--color-border)]">
        <div className="space-y-1 mb-4">
          <Link
            href="/settings"
            className={cn(
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative',
              pathname.startsWith('/settings')
                ? 'text-[var(--color-text-primary)] bg-[var(--color-surface-muted)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]/50'
            )}
          >
            {pathname.startsWith('/settings') && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--color-yuzu)] rounded-r-full" />
            )}
            <Settings className="mr-3 h-5 w-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            Settings
          </Link>
        </div>
        
        <div className="flex items-center justify-between px-3 mb-3">
          <span className="text-sm text-[var(--color-text-secondary)]">Theme</span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* User / Auth Status Section */}
        <div className="p-2 rounded-lg bg-[var(--color-surface-muted)]/40 border border-[var(--color-border)]/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar name={displayName} size="sm" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                  {displayName}
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)] truncate">
                  {displayEmail}
                </span>
              </div>
            </div>

            {user ? (
              <button
                onClick={() => signOut()}
                title="Sign out"
                className="p-1.5 rounded-md hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => openAuthModal()}
                title="Cloud Sign In"
                className="p-1.5 rounded-md hover:bg-[var(--color-yuzu)]/20 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
              >
                <Cloud className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!user && (
            <button
              onClick={() => openAuthModal()}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-medium rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-yuzu)] text-[var(--color-text-primary)] transition-colors shadow-2xs"
            >
              <LogIn className="w-3 h-3 text-[var(--color-text-secondary)]" />
              Sign in to Cloud
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
