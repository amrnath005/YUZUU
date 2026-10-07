"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MoreVertical, FileText, CheckCircle, CreditCard, Plus, Pencil } from "lucide-react";
import { useClient, useDeliverables, usePayments, useRateCards } from "@/hooks/useStore";
import { formatCurrency, formatFullDate, formatMonth } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown";
import { WorkTable } from "@/features/work/work-table";
import { useRecordPayment } from "@/features/payments/record-payment-provider";
import { EditPaymentDialog } from "@/features/payments/edit-payment-dialog";
import { useAddWork } from "@/features/work/add-work-provider";
import { PAYMENT_METHOD_LABELS, DELIVERABLE_TYPE_LABELS, Deliverable, Payment } from "@/types";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const client = useClient(clientId);
  const deliverables = useDeliverables({ clientId });
  const payments = usePayments({ clientId });
  const rateCards = useRateCards(clientId);
  const { openRecordPayment } = useRecordPayment();
  const { openAddWork } = useAddWork();

  const [activeTab, setActiveTab] = useState("work");
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments]);

  const groupedDeliverables = useMemo(() => {
    const sorted = [...deliverables].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const grouped: Record<string, Deliverable[]> = {};
    sorted.forEach(d => {
      const monthStr = formatMonth(d.date);
      if (!grouped[monthStr]) grouped[monthStr] = [];
      grouped[monthStr].push(d);
    });
    
    return grouped;
  }, [deliverables]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-[var(--color-text-secondary)] mb-4">Client not found.</p>
        <Button onClick={() => router.push("/clients")} variant="secondary">Go back to clients</Button>
      </div>
    );
  }

  const tabs = [
    { id: "work", label: "Work", count: deliverables.length },
    { id: "payments", label: "Payments", count: payments.length },
    { id: "ratecard", label: "Rate Card", count: rateCards.length },
  ];

  const earned = client.totalEarned;
  const received = client.totalReceived;
  const outstanding = client.outstanding;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-4">
          <button 
            onClick={() => router.push("/clients")}
            className="flex items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to clients
          </button>
          
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">{client.name}</h1>
            <Badge variant="yuzu" className="text-sm px-3 py-1">
              {client.type.charAt(0).toUpperCase() + client.type.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => openAddWork()} icon={<Plus className="w-4 h-4" />}>
            Add Work
          </Button>
          <Button variant="primary" onClick={() => openRecordPayment(clientId)} icon={<CreditCard className="w-4 h-4" />}>
            Record Payment
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" icon={<MoreVertical className="w-4 h-4" />}>
                Actions
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onClick={() => router.push(`/statements?client=${clientId}`)}>Generate Statement</DropdownItem>
              <DropdownItem onClick={() => router.push('/clients')}>All Clients</DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[var(--color-surface)] p-4 sm:p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider">Deliverables</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">{deliverables.length}</p>
        </div>
        
        <div className="bg-[var(--color-surface)] p-4 sm:p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider">Earned</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tabular-nums truncate">{formatCurrency(earned)}</p>
        </div>
        
        <div className="bg-[var(--color-surface)] p-4 sm:p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider">Received</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tabular-nums truncate">{formatCurrency(received)}</p>
        </div>
        
        <div className="bg-[var(--color-surface)] p-4 sm:p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--color-text-secondary)] mb-1.5 sm:mb-2">
            <div className={`w-2 h-2 rounded-full ${outstanding > 0 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'}`} />
            <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider">Outstanding</h3>
          </div>
          <p className={`text-xl sm:text-2xl font-bold tabular-nums truncate ${outstanding > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}`}>
            {formatCurrency(outstanding)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "work" && (
          <div className="space-y-8">
            {Object.keys(groupedDeliverables).length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-secondary)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                No deliverables found for this client.
              </div>
            ) : (
              Object.entries(groupedDeliverables).map(([month, monthDeliverables]) => (
                <div key={month} className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] sticky top-0 bg-[var(--color-bg)] py-2 z-10">
                    {month}
                  </h3>
                  <WorkTable deliverables={monthDeliverables} hideClient={true} />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            {sortedPayments.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-secondary)]">
                No payments recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                    <tr>
                      <th className="p-4 font-medium whitespace-nowrap">Date</th>
                      <th className="p-4 font-medium text-right whitespace-nowrap">Amount</th>
                      <th className="p-4 font-medium whitespace-nowrap">Method</th>
                      <th className="p-4 font-medium whitespace-nowrap">Reference</th>
                      <th className="p-4 font-medium whitespace-nowrap">Notes</th>
                      <th className="p-4 font-medium text-right whitespace-nowrap w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {sortedPayments.map((payment) => (
                      <tr 
                        key={payment.id} 
                        onClick={() => setEditingPayment(payment)}
                        className="group hover:bg-[var(--color-surface-muted)]/50 transition-colors cursor-pointer"
                      >
                        <td className="p-4 text-[var(--color-text-secondary)] whitespace-nowrap">{formatFullDate(payment.date)}</td>
                        <td className="p-4 font-semibold text-right text-[var(--color-text-primary)] tabular-nums whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                        <td className="p-4 whitespace-nowrap">
                          <Badge variant="default">
                            {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                          </Badge>
                        </td>
                        <td className="p-4 text-[var(--color-text-secondary)] font-mono text-xs whitespace-nowrap">{payment.reference || "—"}</td>
                        <td className="p-4 text-[var(--color-text-secondary)] max-w-xs truncate">{payment.notes || "—"}</td>
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
            )}
          </div>
        )}

        {activeTab === "ratecard" && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Agreed Rates</h2>
            </div>
            
            {rateCards.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-secondary)]">
                No rate card entries found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rateCards.map((rc) => (
                  <div key={rc.id} className="p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-yuzu)] transition-colors flex justify-between items-center group bg-[var(--color-surface)]">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {DELIVERABLE_TYPE_LABELS[rc.deliverableType] || rc.deliverableType}
                    </span>
                    <span className="text-lg font-semibold text-[var(--color-text-primary)]">{formatCurrency(rc.rate)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Payment Dialog */}
      <EditPaymentDialog
        payment={editingPayment}
        isOpen={Boolean(editingPayment)}
        onClose={() => setEditingPayment(null)}
      />
    </div>
  );
}
