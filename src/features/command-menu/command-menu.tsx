"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Plus, CreditCard, FileText, Home, Briefcase, Users, Settings } from "lucide-react";
import { useCommandMenu } from "./command-menu-provider";
import { store } from "@/data/store";
import { useRecordPayment } from "@/features/payments/record-payment-provider";
import { useAddWork } from "@/features/work/add-work-provider";

export function CommandMenu() {
  const { isOpen, close } = useCommandMenu();
  const { openRecordPayment } = useRecordPayment();
  const { openAddWork } = useAddWork();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    router.push(path);
    close();
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const { clients, deliverables, payments } = store.search(query);
    return [
      ...clients.map(c => ({ id: c.id, type: 'client' as const, title: c.name, subtitle: `${c.type} client` })),
      ...deliverables.map(d => ({ id: d.id, type: 'deliverable' as const, title: d.title, subtitle: `Work · ₹${d.amount}` })),
      ...payments.map(p => ({ id: p.id, type: 'payment' as const, title: `Payment ₹${p.amount}`, subtitle: p.reference || p.method }))
    ];
  }, [query]);

  const quickActions = useMemo(() => [
    { label: "Add work", icon: Plus, action: () => { close(); openAddWork(); }, iconColor: "text-[var(--color-yuzu)]" },
    { label: "Record payment", icon: CreditCard, action: () => { close(); openRecordPayment(); }, iconColor: "text-[var(--color-success)]" },
    { label: "Generate statement", icon: FileText, action: () => handleNavigate("/statements"), iconColor: "text-[var(--color-info)]" },
  ], [openAddWork, openRecordPayment]);

  const navActions = useMemo(() => [
    { label: "Overview", icon: Home, action: () => handleNavigate("/") },
    { label: "Work", icon: Briefcase, action: () => handleNavigate("/work") },
    { label: "Clients", icon: Users, action: () => handleNavigate("/clients") },
    { label: "Payments", icon: CreditCard, action: () => handleNavigate("/payments") },
    { label: "Reports", icon: FileText, action: () => handleNavigate("/reports") },
    { label: "Statements", icon: FileText, action: () => handleNavigate("/statements") },
    { label: "Settings", icon: Settings, action: () => handleNavigate("/settings") },
  ], []);

  const totalItems = query ? results.length : quickActions.length + navActions.length;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + Math.max(1, totalItems)) % Math.max(1, totalItems));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!query) {
        if (selectedIndex < quickActions.length) {
          quickActions[selectedIndex].action();
        } else {
          navActions[selectedIndex - quickActions.length]?.action();
        }
      } else if (results[selectedIndex]) {
        const item = results[selectedIndex];
        if (item.type === 'client') handleNavigate(`/clients/${item.id}`);
        else if (item.type === 'deliverable') handleNavigate(`/work`);
        else if (item.type === 'payment') handleNavigate(`/payments`);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="flex items-center border-b border-[var(--color-border)] px-4">
              <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search clients, deliverables, or commands..."
                className="flex h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-[var(--color-text-secondary)] text-[var(--color-text-primary)]"
              />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface-muted)] rounded border border-[var(--color-border)]">
                ESC
              </kbd>
            </div>
            
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {!query ? (
                <>
                  <div className="mb-3">
                    <div className="px-2 pb-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Quick Actions
                    </div>
                    {quickActions.map((qa, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <button 
                          key={qa.label}
                          onClick={qa.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-primary)] transition-colors text-left ${
                            isSelected ? 'bg-[var(--color-surface-muted)] ring-1 ring-[var(--color-border)]' : 'hover:bg-[var(--color-surface-muted)]/50'
                          }`}
                        >
                          <qa.icon className={`h-4 w-4 ${qa.iconColor}`} /> {qa.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div>
                    <div className="px-2 pb-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Navigation
                    </div>
                    {navActions.map((na, idx) => {
                      const absoluteIdx = quickActions.length + idx;
                      const isSelected = selectedIndex === absoluteIdx;
                      return (
                        <button 
                          key={na.label}
                          onClick={na.action}
                          onMouseEnter={() => setSelectedIndex(absoluteIdx)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-primary)] transition-colors text-left ${
                            isSelected ? 'bg-[var(--color-surface-muted)] ring-1 ring-[var(--color-border)]' : 'hover:bg-[var(--color-surface-muted)]/50'
                          }`}
                        >
                          <na.icon className="h-4 w-4 text-[var(--color-text-secondary)]" /> Go to {na.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  {results.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[var(--color-text-secondary)]">
                      No results found for &quot;{query}&quot;
                    </div>
                  ) : (
                    results.map((result, index) => {
                      const isSelected = selectedIndex === index;
                      return (
                        <button
                          key={`${result.type}-${result.id}-${index}`}
                          onClick={() => {
                            if (result.type === 'client') handleNavigate(`/clients/${result.id}`);
                            else if (result.type === 'deliverable') handleNavigate(`/work`);
                            else if (result.type === 'payment') handleNavigate(`/payments`);
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-xs transition-colors text-left ${
                            isSelected ? 'bg-[var(--color-surface-muted)] ring-1 ring-[var(--color-border)]' : 'hover:bg-[var(--color-surface-muted)]/50'
                          }`}
                        >
                          <span className="font-semibold text-[var(--color-text-primary)]">{result.title}</span>
                          <span className="text-[10px] text-[var(--color-text-secondary)] capitalize">{result.subtitle}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
