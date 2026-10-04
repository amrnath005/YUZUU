"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Briefcase, Users, CreditCard, Menu } from 'lucide-react';

const mobileNavItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Work', href: '/work', icon: Briefcase },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'More', href: '/settings', icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-safe">
      <div className="flex h-16">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && item.href !== '/settings' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors relative',
                isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[var(--color-yuzu)] rounded-b-full" />
              )}
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
