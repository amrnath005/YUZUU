"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Users, 
  ChevronRight, 
  Plus, 
  CreditCard, 
  FileText, 
  Briefcase,
  TrendingUp,
  AlertCircle,
  Building2,
  Mail,
  Phone
} from "lucide-react";
import { useClients } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAddWork } from "@/features/work/add-work-provider";
import { useRecordPayment } from "@/features/payments/record-payment-provider";
import { AddClientDialog } from "@/features/clients/add-client-dialog";

export default function ClientsPage() {
  const router = useRouter();
  const clients = useClients();
  const { openAddWork } = useAddWork();
  const { openRecordPayment } = useRecordPayment();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const lowerQuery = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.type.toLowerCase().includes(lowerQuery) ||
        (c.email && c.email.toLowerCase().includes(lowerQuery))
    );
  }, [clients, searchQuery]);

  // Aggregate totals
  const totals = useMemo(() => {
    return clients.reduce(
      (acc, c) => ({
        earned: acc.earned + c.totalEarned,
        received: acc.received + c.totalReceived,
        outstanding: acc.outstanding + c.outstanding,
      }),
      { earned: 0, received: 0, outstanding: 0 }
    );
  }, [clients]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Clients Hub
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {clients.length} active client accounts • Manage work, billing, and direct ledgers
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddClientOpen(true)}
            className="w-full sm:w-auto"
          >
            Add Client
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3.5">
          <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
            Total Clients
          </p>
          <p className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mt-1">
            {clients.length}
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3.5">
          <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
            Total Billed
          </p>
          <p className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mt-1">
            {formatCurrency(totals.earned)}
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3.5">
          <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
            Total Collected
          </p>
          <p className="text-xl md:text-2xl font-bold text-[var(--color-success)] mt-1">
            {formatCurrency(totals.received)}
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3.5">
          <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
            Net Outstanding
          </p>
          <p
            className={`text-xl md:text-2xl font-bold mt-1 ${
              totals.outstanding > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-text-primary)]"
            }`}
          >
            {formatCurrency(totals.outstanding)}
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <Input
            placeholder="Search clients by name, type, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <p className="text-xs text-[var(--color-text-secondary)] self-start sm:self-center">
            Found {filteredClients.length} of {clients.length} clients
          </p>
        )}
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No clients found"
          description={
            searchQuery
              ? "No clients match your search query."
              : "You haven't added any clients yet. Click below to add your first client."
          }
          action={
            !searchQuery ? (
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAddClientOpen(true)}
              >
                Create First Client
              </Button>
            ) : undefined
          }
        />
      ) : (
        <AnimatePresence>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6"
          >
            {filteredClients.map((client) => {
              const collectedRatio =
                client.totalEarned > 0
                  ? Math.min(100, Math.round((client.totalReceived / client.totalEarned) * 100))
                  : 100;

              return (
                <motion.div
                  key={client.id}
                  variants={item}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-yuzu)] hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Top client header */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] group-hover:underline transition-colors truncate">
                          {client.name}
                        </h2>
                        {client.email && (
                          <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            {client.email}
                          </p>
                        )}
                      </div>
                      <Badge variant="default" className="shrink-0 capitalize text-xs">
                        {client.type}
                      </Badge>
                    </div>

                    {/* Collection Progress Bar */}
                    <div className="mb-4 bg-[var(--color-surface-muted)]/50 p-2.5 rounded-lg border border-[var(--color-border)]/50">
                      <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                        <span className="text-[var(--color-text-secondary)]">Collection Rate</span>
                        <span
                          className={
                            collectedRatio === 100
                              ? "text-[var(--color-success)] font-semibold"
                              : "text-[var(--color-text-primary)] font-semibold"
                          }
                        >
                          {collectedRatio}% Collected
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-surface-muted)] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            collectedRatio === 100
                              ? "bg-[var(--color-success)]"
                              : client.outstanding > 0
                              ? "bg-[var(--color-warning)]"
                              : "bg-[var(--color-yuzu)]"
                          }`}
                          style={{ width: `${collectedRatio}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[var(--color-text-secondary)] mt-1">
                        <span>{formatCurrency(client.totalReceived)} paid</span>
                        <span>{formatCurrency(client.totalEarned)} total</span>
                      </div>
                    </div>

                    {/* Stats Quadrant */}
                    <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-[var(--color-border)]">
                      <div className="p-2 rounded-lg bg-[var(--color-surface-muted)]/30">
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">
                          Work Items
                        </p>
                        <p className="font-semibold text-[var(--color-text-primary)]">
                          {client.deliverableCount} {client.deliverableCount === 1 ? "deliverable" : "deliverables"}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-[var(--color-surface-muted)]/30">
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">
                          Total Earned
                        </p>
                        <p className="font-semibold text-[var(--color-text-primary)]">
                          {formatCurrency(client.totalEarned)}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-[var(--color-surface-muted)]/30">
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">
                          Received
                        </p>
                        <p className="font-semibold text-[var(--color-success)]">
                          {formatCurrency(client.totalReceived)}
                        </p>
                      </div>

                      <div
                        className={`p-2 rounded-lg ${
                          client.outstanding > 0
                            ? "bg-amber-500/10 border border-amber-500/20"
                            : "bg-[var(--color-surface-muted)]/30"
                        }`}
                      >
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">
                          Outstanding
                        </p>
                        <p
                          className={`font-semibold ${
                            client.outstanding > 0
                              ? "text-[var(--color-warning)]"
                              : "text-[var(--color-text-primary)]"
                          }`}
                        >
                          {formatCurrency(client.outstanding)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Toolbar on Card */}
                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs py-1 px-2 h-8"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddWork(client.id);
                        }}
                      >
                        Work
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs py-1 px-2 h-8"
                        icon={<CreditCard className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openRecordPayment(client.id);
                        }}
                      >
                        Payment
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs py-1 px-2 h-8 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                        icon={<FileText className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/statements?client=${client.id}`);
                        }}
                      >
                        Statement
                      </Button>
                    </div>

                    <div className="text-right mt-1">
                      <span className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] inline-flex items-center gap-1 font-medium">
                        Open client workspace <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Add Client Dialog */}
      <AddClientDialog
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onSuccess={(newId) => router.push(`/clients/${newId}`)}
      />
    </div>
  );
}
