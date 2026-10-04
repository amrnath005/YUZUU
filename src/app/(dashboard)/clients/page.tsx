"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, Users, ChevronRight } from "lucide-react";
import { useClients } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default function ClientsPage() {
  const router = useRouter();
  const clients = useClients();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const lowerQuery = searchQuery.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(lowerQuery) || c.type.toLowerCase().includes(lowerQuery));
  }, [clients, searchQuery]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Clients</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {clients.length} active clients with live balances
          </p>
        </div>
        <div className="relative w-full sm:w-64 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <Input 
            placeholder="Search clients by name or type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState 
          icon={<Users className="w-12 h-12" />}
          title="No clients found"
          description={searchQuery ? "No clients match your search query." : "You haven't added any clients yet."}
        />
      ) : (
        <AnimatePresence>
          <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6"
          >
            {filteredClients.map((client) => (
              <motion.div
                key={client.id}
                variants={item}
                onClick={() => router.push(`/clients/${client.id}`)}
                className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-yuzu)] hover:shadow-xs transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] group-hover:underline transition-colors line-clamp-1">
                      {client.name}
                    </h2>
                    {client.email && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{client.email}</p>
                    )}
                  </div>
                  <Badge variant="default" className="shrink-0 ml-2 capitalize">
                    {client.type}
                  </Badge>
                </div>
                
                <div className="mt-auto pt-4 border-t border-[var(--color-border)] grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Deliverables</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{client.deliverableCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Earned</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{formatCurrency(client.totalEarned)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Received</p>
                    <p className="font-semibold text-[var(--color-success)]">{formatCurrency(client.totalReceived)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Outstanding</p>
                    <p className={`font-semibold ${client.outstanding > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}`}>
                      {formatCurrency(client.outstanding)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-right">
                  <span className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] inline-flex items-center">
                    View client workspace <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
