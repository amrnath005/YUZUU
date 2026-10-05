"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { getLocalDataSummary, migrateLocalDataToCloud } from "@/lib/migration";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { store } from "@/data/store";
import { Sun, Moon, Monitor, Cloud, Database, CloudUpload, LogIn, LogOut, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, workspace, signOut, openAuthModal, isConfigured } = useAuth();
  const { toast } = useToast();

  const [localSummary, setLocalSummary] = useState<ReturnType<typeof getLocalDataSummary>>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    setLocalSummary(getLocalDataSummary());
  }, []);

  const handleMigrate = async () => {
    if (!workspace) {
      toast.error("Please sign in to a workspace first");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error("Supabase client is not configured");
      return;
    }

    setIsMigrating(true);
    try {
      const res = await migrateLocalDataToCloud(workspace.id, supabase);
      if (res.success) {
        toast.success(res.message);
        await store.syncFromCloud();
      } else {
        toast.error(res.error || res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Migration failed");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl p-4 md:p-8">
      <header className="pb-4 border-b border-[var(--color-border)]">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Preferences, cloud sync, and workspace settings</p>
      </header>

      {/* Cloud & Persistence Status */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Cloud Architecture</h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                user
                  ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user ? "bg-[var(--color-success)]" : "bg-[var(--color-text-secondary)]"}`} />
                {user ? "PostgreSQL Connected" : "Local Browser Mode"}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {user
                ? "Tenant isolation enabled via PostgreSQL Row Level Security (RLS)."
                : "Data is currently stored in local browser storage. Sign in to sync across devices."}
            </p>
          </div>

          <div>
            {user ? (
              <Button variant="secondary" size="sm" onClick={() => signOut()} className="text-xs">
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => openAuthModal()} className="text-xs">
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Sign In / Sign Up
              </Button>
            )}
          </div>
        </div>

        {/* Local Storage Migration Section */}
        {localSummary && (
          <div className="pt-3 border-t border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                    Local Storage Data
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {localSummary.clientsCount} clients · {localSummary.deliverablesCount} deliverables · {localSummary.paymentsCount} payments ({formatCurrency(localSummary.totalEarned)} total earned)
                  </p>
                </div>
              </div>

              {user && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleMigrate}
                  loading={isMigrating}
                  className="text-xs shrink-0"
                >
                  <CloudUpload className="w-3.5 h-3.5 mr-1.5" />
                  Migrate to Cloud
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Profile */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30">
            <span className="text-xs uppercase font-medium text-[var(--color-text-secondary)]">Name</span>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">
              {user?.name || "Not signed in"}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30">
            <span className="text-xs uppercase font-medium text-[var(--color-text-secondary)]">Email</span>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">
              {user?.email || "Local offline workspace"}
            </p>
          </div>
        </div>
      </Card>

      {/* Workspace */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Workspace</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30">
            <span className="text-xs uppercase font-medium text-[var(--color-text-secondary)]">Workspace Name</span>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">
              {workspace?.name || "Personal Studio"}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30">
            <span className="text-xs uppercase font-medium text-[var(--color-text-secondary)]">Currency</span>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">
              Indian Rupee ({workspace?.currency || "INR"} ₹)
            </p>
          </div>
        </div>
      </Card>

      {/* Theme Setting */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Appearance</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Customize how YUZU looks on your device</p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md pt-2">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
              theme === "light"
                ? "border-[var(--color-yuzu)] bg-[var(--color-yuzu)]/10 text-[var(--color-text-primary)] font-semibold shadow-xs"
                : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
            }`}
          >
            <Sun className="w-5 h-5" />
            Light
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
              theme === "dark"
                ? "border-[var(--color-yuzu)] bg-[var(--color-yuzu)]/10 text-[var(--color-text-primary)] font-semibold shadow-xs"
                : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
            }`}
          >
            <Moon className="w-5 h-5" />
            Dark
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
              theme === "system"
                ? "border-[var(--color-yuzu)] bg-[var(--color-yuzu)]/10 text-[var(--color-text-primary)] font-semibold shadow-xs"
                : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
            }`}
          >
            <Monitor className="w-5 h-5" />
            System
          </button>
        </div>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Keyboard Shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex justify-between items-center p-3 rounded-lg border border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-primary)]">Add Work</span>
            <kbd className="px-2 py-0.5 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded text-xs font-mono font-medium">N</kbd>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg border border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-primary)]">Save & Add Another</span>
            <kbd className="px-2 py-0.5 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded text-xs font-mono font-medium">Shift + Enter</kbd>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg border border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-primary)]">Command Menu</span>
            <kbd className="px-2 py-0.5 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded text-xs font-mono font-medium">⌘ K / Ctrl K</kbd>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg border border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-primary)]">Quick Search</span>
            <kbd className="px-2 py-0.5 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded text-xs font-mono font-medium">/</kbd>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg border border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-primary)]">Close Dialogs</span>
            <kbd className="px-2 py-0.5 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded text-xs font-mono font-medium">Esc</kbd>
          </div>
        </div>
      </Card>
    </div>
  );
}
