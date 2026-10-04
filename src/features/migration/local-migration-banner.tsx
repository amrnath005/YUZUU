"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { hasLocalDataToMigrate, getLocalDataSummary, migrateLocalDataToCloud } from '@/lib/migration';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { store } from '@/data/store';
import { CloudUpload, CheckCircle, X, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function LocalMigrationBanner() {
  const { user, workspace } = useAuth();
  const { toast } = useToast();
  const [show, setShow] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [summary, setSummary] = useState<ReturnType<typeof getLocalDataSummary>>(null);

  useEffect(() => {
    if (workspace && user) {
      const hasData = hasLocalDataToMigrate(workspace.id);
      if (hasData) {
        setSummary(getLocalDataSummary());
        setShow(true);
      } else {
        setShow(false);
      }
    } else {
      setShow(false);
    }
  }, [workspace, user]);

  if (!show || !summary || !workspace) {
    return null;
  }

  const handleMigrate = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error('Supabase is not configured.');
      return;
    }

    setIsMigrating(true);
    try {
      const result = await migrateLocalDataToCloud(workspace.id, supabase);
      if (result.success) {
        toast.success(result.message);
        setShow(false);
        // Refresh store from cloud
        await store.syncFromCloud();
      } else {
        toast.error(result.error || result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Migration encountered an error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined' && workspace) {
      window.localStorage.setItem(`yuzu_migrated_${workspace.id}`, 'true');
    }
    setShow(false);
  };

  return (
    <div className="mb-6 p-4 rounded-xl border border-[var(--color-yuzu)]/30 bg-[var(--color-surface)] shadow-xs relative overflow-hidden transition-all">
      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-yuzu)]" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-yuzu)]/15 text-[var(--color-text-primary)] shrink-0 mt-0.5 sm:mt-0">
            <CloudUpload className="w-5 h-5 text-[var(--color-text-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                Local Workspace Data Detected
              </h4>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
                Offline Cache
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
              Found <strong className="text-[var(--color-text-primary)]">{summary.clientsCount} clients</strong>,{' '}
              <strong className="text-[var(--color-text-primary)]">{summary.deliverablesCount} deliverables</strong>, and{' '}
              <strong className="text-[var(--color-text-primary)]">{summary.paymentsCount} payments</strong> ({formatCurrency(summary.totalEarned)} earned) in local storage.
              Import them into your cloud studio <span className="font-medium text-[var(--color-text-primary)]">&ldquo;{workspace.name}&rdquo;</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isMigrating}
            className="text-xs text-[var(--color-text-secondary)]"
          >
            Keep Local
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleMigrate}
            loading={isMigrating}
            className="text-xs flex items-center gap-1.5"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            Import to Cloud
          </Button>
        </div>
      </div>
    </div>
  );
}
