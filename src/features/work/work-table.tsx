"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { Deliverable, DELIVERABLE_TYPE_LABELS } from "@/types";
import { formatCurrency, formatFullDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useStore";
import { EditDeliverableDialog } from "./edit-deliverable-dialog";

interface WorkTableProps {
  deliverables: Deliverable[];
  hideClient?: boolean;
}

type SortKey = "date" | "client" | "title" | "type" | "amount" | "status";
type SortDirection = "asc" | "desc";

export function WorkTable({ deliverables, hideClient = false }: WorkTableProps) {
  const clients = useClients();
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach(c => {
      map[c.id] = c.name;
    });
    return map;
  }, [clients]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedDeliverables = useMemo(() => {
    return [...deliverables].sort((a, b) => {
      let aVal: any = a[sortKey as keyof Deliverable];
      let bVal: any = b[sortKey as keyof Deliverable];

      if (sortKey === "date") {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (sortKey === "client") {
        aVal = clientMap[a.clientId] || a.clientId;
        bVal = clientMap[b.clientId] || b.clientId;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [deliverables, sortKey, sortDirection, clientMap]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "delivered": return "success";
      case "in-progress": return "info";
      case "revision": return "warning";
      case "cancelled": return "danger";
      default: return "default";
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.02 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.15 } }
  };

  const renderSortIcon = (columnKey: SortKey) => {
    if (sortKey !== columnKey) return null;
    return sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 inline-block ml-1 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 inline-block ml-1 opacity-70" />;
  };

  if (deliverables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--color-text-secondary)]">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">No deliverables found</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">Adjust your filters or add new work.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card List View (Below md breakpoint) */}
      <div className="block md:hidden space-y-2.5">
        <AnimatePresence>
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-2.5">
            {sortedDeliverables.map((d) => (
              <motion.div 
                key={d.id} 
                variants={item} 
                onClick={() => setEditingDeliverable(d)}
                className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-2 hover:border-[var(--color-yuzu)] transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{d.title}</h3>
                    {!hideClient && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {clientMap[d.clientId] || d.clientId}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={getStatusVariant(d.status)}>
                      {d.status.charAt(0).toUpperCase() + d.status.slice(1).replace("-", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-[var(--color-border)]/50">
                  <span className="text-[var(--color-text-secondary)]">{formatFullDate(d.date)}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-[11px] font-normal">{DELIVERABLE_TYPE_LABELS[d.type] || d.type}</Badge>
                    <span className="font-bold text-sm text-[var(--color-text-primary)]">{formatCurrency(d.amount)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDeliverable(d);
                      }}
                      icon={<Pencil className="w-3 h-3" />}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop Table View (md and up) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)] text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 font-semibold cursor-pointer hover:text-[var(--color-text-primary)] transition-colors select-none w-28" onClick={() => handleSort("date")}>
                Date {renderSortIcon("date")}
              </th>
              {!hideClient && (
                <th className="py-3 px-4 font-semibold cursor-pointer hover:text-[var(--color-text-primary)] transition-colors select-none" onClick={() => handleSort("client")}>
                  Client {renderSortIcon("client")}
                </th>
              )}
              <th className="py-3 px-4 font-semibold cursor-pointer hover:text-[var(--color-text-primary)] transition-colors select-none" onClick={() => handleSort("title")}>
                Deliverable {renderSortIcon("title")}
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer hover:text-[var(--color-text-primary)] transition-colors select-none w-36" onClick={() => handleSort("type")}>
                Type {renderSortIcon("type")}
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-[var(--color-text-primary)] transition-colors select-none w-32" onClick={() => handleSort("amount")}>
                Amount {renderSortIcon("amount")}
              </th>
              <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:text-[var(--color-text-primary)] transition-colors select-none w-32" onClick={() => handleSort("status")}>
                Status {renderSortIcon("status")}
              </th>
              <th className="py-3 px-4 text-right w-20">
                Action
              </th>
            </tr>
          </thead>
          <motion.tbody variants={container} initial="hidden" animate="show" className="divide-y divide-[var(--color-border)]">
            {sortedDeliverables.map((d) => (
              <motion.tr 
                key={d.id} 
                variants={item} 
                onClick={() => setEditingDeliverable(d)}
                className="group hover:bg-[var(--color-surface-muted)]/70 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4 whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                  {formatFullDate(d.date).split(',')[0]}
                </td>
                {!hideClient && (
                  <td className="py-3 px-4 font-medium text-[var(--color-text-primary)] text-sm">
                    {clientMap[d.clientId] || d.clientId}
                  </td>
                )}
                <td className="py-3 px-4 font-medium text-[var(--color-text-primary)] text-sm">
                  <div className="flex items-center gap-1.5">
                    <span>{d.title}</span>
                  </div>
                  {d.notes && (
                    <p className="text-[11px] text-[var(--color-text-secondary)] truncate max-w-xs mt-0.5 font-normal">
                      {d.notes}
                    </p>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Badge variant="default" className="font-normal text-[11px]">
                    {DELIVERABLE_TYPE_LABELS[d.type] || d.type}
                  </Badge>
                </td>
                <td className="py-3 px-4 font-bold text-right text-[var(--color-text-primary)] text-sm tabular-nums">
                  {formatCurrency(d.amount)}
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge variant={getStatusVariant(d.status)}>
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1).replace("-", " ")}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] opacity-70 group-hover:opacity-100 hover:bg-[var(--color-surface-muted)] transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingDeliverable(d);
                    }}
                    icon={<Pencil className="w-3 h-3" />}
                  >
                    Edit
                  </Button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* Edit Deliverable Dialog */}
      <EditDeliverableDialog
        deliverable={editingDeliverable}
        isOpen={Boolean(editingDeliverable)}
        onClose={() => setEditingDeliverable(null)}
      />
    </div>
  );
}
