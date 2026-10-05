"use client";
import React from 'react';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { Avatar } from '../ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();
  return (
    <div className="flex h-screen bg-[var(--color-bg)] overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:overflow-visible">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 border-b border-[var(--color-border)] bg-[var(--color-bg)] z-30 print:hidden">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] font-sans relative">
              y<span className="relative inline-block">u<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--color-yuzu)] rounded-full" /></span>zu
            </span>
          </Link>
          <Avatar name={user?.name || "Yuzu"} size="sm" />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-[var(--color-bg)] pb-16 md:pb-0 print:overflow-visible print:p-0 print:m-0 print:bg-white">
          <div className="w-full mx-auto print:w-full print:p-0">
            {children}
          </div>
        </main>
      </div>
      <div className="print:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
