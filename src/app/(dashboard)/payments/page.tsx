"use client";

import React, { useState, useMemo } from "react";
import { usePayments, useClients } from "@/hooks/useStore";
import { formatCurrency, formatFullDate, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useRecordPayment } from "@/features/payments/record-payment-provider";
import { EditPaymentDialog } from "@/features/payments/edit-payment-dialog";
import { PAYMENT_METHOD_LABELS, Payment, PaymentMethod } from "@/types";
import { Search, Plus, CreditCard, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientId, setClientId] = useState("all");
  const [method, setMethod] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const itemsPerPage = 15;

  const { openRecordPayment } = useRecordPayment();

  const payments = usePayments({
    clientId: clientId !== "all" ? clientId : undefined,
  });
  const clients = useClients();

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [clients]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (method !== "all" && p.method !== method) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      const clientName = (clientMap[p.clientId] || "").toLowerCase();
      const ref = (p.reference || "").toLowerCase();
      const notes = (p.notes || "").toLowerCase();
      return clientName.includes(q) || ref.includes(q) || notes.includes(q);
    });
  }, [payments, method, searchTerm, clientMap]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Payments</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Total recorded: <span className="font-semibold text-[var(--color-text-primary)]">{formatCurrency(totalAmount)}</span>
          </p>
        </div>
        <Button variant="primary" onClick={() => openRecordPayment()} icon={<Plus className="w-4 h-4" />}>
          Record payment
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
          <Input
            placeholder="Search reference, client, or notes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="sm:col-span-3">
          <Select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: "All Clients", value: "all" },
              ...clients.map((c) => ({ label: c.name, value: c.id })),
            ]}
          />
        </div>
        <div className="sm:col-span-3">
          <Select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: "All Methods", value: "all" },
              ...Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
                label,
                value,
              })),
            ]}
          />
        </div>
      </div>

      {/* Content */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-12 h-12" />}
          title="No payments found"
          description="Record a payment or adjust your filters."
          action={
            <Button variant="primary" onClick={() => openRecordPayment()}>
              Record payment
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            <AnimatePresence>
              {paginatedPayments.map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setEditingPayment(payment)}
                  className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-2 cursor-pointer hover:border-[var(--color-yuzu)] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {clientMap[payment.clientId] || "Unknown Client"}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">
                        {payment.reference || "No ref"}
                      </p>
                    </div>
                    <Badge variant="success" className="font-semibold text-sm">
                      {formatCurrency(payment.amount)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
                    <span>{formatFullDate(payment.date)}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPayment(payment);
                        }}
                        icon={<Pencil className="w-3 h-3" />}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
                <tr>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium">Method</th>
                  <th className="p-4 font-medium">Reference</th>
                  <th className="p-4 font-medium">Notes</th>
                  <th className="p-4 font-medium text-right w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paginatedPayments.map((payment) => (
                  <tr 
                    key={payment.id} 
                    onClick={() => setEditingPayment(payment)}
                    className="group hover:bg-[var(--color-surface-muted)]/50 transition-colors cursor-pointer"
                  >
                    <td className="p-4 whitespace-nowrap text-xs text-[var(--color-text-secondary)]">{formatDate(payment.date)}</td>
                    <td className="p-4 font-medium text-[var(--color-text-primary)]">{clientMap[payment.clientId] || "Unknown"}</td>
                    <td className="p-4 whitespace-nowrap font-bold text-right text-[var(--color-text-primary)]">{formatCurrency(payment.amount)}</td>
                    <td className="p-4 whitespace-nowrap">
                      <Badge variant="default" className="text-[11px] font-normal">{PAYMENT_METHOD_LABELS[payment.method] || payment.method}</Badge>
                    </td>
                    <td className="p-4 font-mono text-xs text-[var(--color-text-secondary)]">{payment.reference || "-"}</td>
                    <td className="p-4 text-xs text-[var(--color-text-secondary)] truncate max-w-[200px]">{payment.notes || "-"}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] opacity-70 group-hover:opacity-100 hover:bg-[var(--color-surface-muted)] transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPayment(payment);
                        }}
                        icon={<Pencil className="w-3 h-3" />}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Page {currentPage} of {totalPages} ({filteredPayments.length} payments)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Payment Dialog */}
      <EditPaymentDialog
        payment={editingPayment}
        isOpen={Boolean(editingPayment)}
        onClose={() => setEditingPayment(null)}
      />
    </div>
  );
}
