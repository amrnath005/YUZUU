"use client";

import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/contexts/auth-context';
import { RecordPaymentProvider } from '@/features/payments/record-payment-provider';
import { AddWorkProvider } from '@/features/work/add-work-provider';
import { CommandMenuProvider } from '@/features/command-menu/command-menu-provider';
import { store } from '@/data/store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    store.hydrate();
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <RecordPaymentProvider>
          <AddWorkProvider>
            <CommandMenuProvider>
              <AppShell>
                {children}
              </AppShell>
            </CommandMenuProvider>
          </AddWorkProvider>
        </RecordPaymentProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
