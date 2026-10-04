"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useClients } from "@/hooks/useStore";
import { store } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatMonth, formatDate } from "@/lib/utils";
import { DELIVERABLE_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/types";
import { Card } from "@/components/ui/card";
import { Printer, Share2, FileCheck, ArrowDownToLine } from "lucide-react";

function StatementsContent() {
  const searchParams = useSearchParams();
  const initialClient = searchParams.get("client") || "";

  const clients = useClients();
  const { toast } = useToast();

  const [selectedClient, setSelectedClient] = useState(initialClient);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [statementData, setStatementData] = useState<any>(null);

  const createStatement = (clientId: string, monthVal: string) => {
    if (!clientId) return;
    const client = store.getClient(clientId);
    if (!client) return;
    
    const [yearStr, monthStr] = monthVal.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    
    const deliverables = store.getClientDeliverables(clientId).filter(
      d => new Date(d.date) >= start && new Date(d.date) <= end && d.status !== 'cancelled'
    );
    const payments = store.getClientPayments(clientId).filter(
      p => new Date(p.date) >= start && new Date(p.date) <= end
    );

    const earned = deliverables.reduce((sum, d) => sum + d.amount, 0);
    const received = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, earned - received);

    setStatementData({
      client,
      monthDate: start,
      deliverables,
      payments,
      earned,
      received,
      outstanding,
    });
  };

  useEffect(() => {
    if (initialClient && clients.length > 0) {
      setSelectedClient(initialClient);
      createStatement(initialClient, selectedMonth);
    }
  }, [initialClient, clients, selectedMonth]);

  const generateStatement = () => {
    if (!selectedClient) {
      toast({ title: "Please select a client" });
      return;
    }
    createStatement(selectedClient, selectedMonth);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Statement link copied to clipboard" });
    } else {
      toast({ title: "Link copied" });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto pb-24">
      {/* Non-print Header & Controls */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[var(--color-border)]">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              Client Statements
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Generate official work & earnings statements for your clients
            </p>
          </div>
        </div>

        <Card className="p-5 flex flex-wrap gap-4 items-end bg-[var(--color-surface)]">
          <div className="flex-1 min-w-[220px]">
            <Select
              label="Select Client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              options={[
                { label: "Choose client...", value: "" },
                ...clients.map(c => ({ label: `${c.name} (${c.type})`, value: c.id }))
              ]}
            />
          </div>
          <div className="w-48">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Statement Month</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-yuzu)]"
              />
            </div>
          </div>
          <Button variant="primary" onClick={generateStatement} icon={<FileCheck className="w-4 h-4" />}>
            Generate Statement
          </Button>
        </Card>
      </div>

      {/* Statement Document (Printable) */}
      {statementData ? (
        <div className="mt-8 mx-auto max-w-3xl bg-white text-zinc-900 p-8 sm:p-14 shadow-md rounded-xl border border-zinc-200 print:border-none print:shadow-none print:p-0 print:m-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-10 pb-6 border-b border-zinc-200">
            <div>
              <span className="text-3xl font-bold tracking-tight text-zinc-900 font-sans">
                y<span className="relative inline-block">u<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#F6D94E] rounded-full" /></span>zu
              </span>
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Freelance Work & Billing Platform</p>
            </div>
            <div className="text-right">
              <h3 className="text-base font-bold tracking-wider uppercase text-zinc-400">Statement</h3>
              <p className="text-xl font-semibold text-zinc-900 mt-0.5">{formatMonth(statementData.monthDate)}</p>
            </div>
          </div>
          
          {/* Client Info */}
          <div className="mb-8">
            <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider">Billed To</span>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{statementData.client?.name}</p>
            <p className="text-sm text-zinc-500 capitalize">{statementData.client?.type} Client</p>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-6 mb-10 p-6 bg-zinc-50 rounded-xl border border-zinc-100">
            <div>
              <p className="text-xs uppercase font-semibold text-zinc-400 tracking-wider mb-1">Earned</p>
              <p className="text-2xl font-bold text-zinc-900">{formatCurrency(statementData.earned)}</p>
              <p className="text-xs text-zinc-500 mt-1">{statementData.deliverables.length} deliverables</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-zinc-400 tracking-wider mb-1">Received</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(statementData.received)}</p>
              <p className="text-xs text-zinc-500 mt-1">{statementData.payments.length} payments</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-zinc-400 tracking-wider mb-1">Outstanding</p>
              <p className={`text-2xl font-bold ${statementData.outstanding > 0 ? 'text-amber-600' : 'text-zinc-900'}`}>
                {formatCurrency(statementData.outstanding)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Balance Due</p>
            </div>
          </div>

          {/* Work List */}
          <div className="mb-10">
            <h4 className="text-xs font-bold tracking-wider uppercase text-zinc-400 mb-3 pb-2 border-b border-zinc-200">
              Deliverables ({statementData.deliverables.length})
            </h4>
            {statementData.deliverables.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-zinc-400 pb-2">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Title</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {statementData.deliverables.map((d: any) => (
                    <tr key={d.id}>
                      <td className="py-2.5 text-zinc-500 whitespace-nowrap">{formatDate(d.date)}</td>
                      <td className="py-2.5 font-medium text-zinc-900">{d.title}</td>
                      <td className="py-2.5 text-zinc-500">{(DELIVERABLE_TYPE_LABELS as Record<string, string>)[d.type] || d.type}</td>
                      <td className="py-2.5 text-right font-semibold text-zinc-900">{formatCurrency(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-zinc-500 italic py-2">No deliverables recorded for this period.</p>
            )}
          </div>

          {/* Payments List */}
          <div className="mb-10">
            <h4 className="text-xs font-bold tracking-wider uppercase text-zinc-400 mb-3 pb-2 border-b border-zinc-200">
              Payments Received ({statementData.payments.length})
            </h4>
            {statementData.payments.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-zinc-400 pb-2">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 font-medium">Reference</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {statementData.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2.5 text-zinc-500 whitespace-nowrap">{formatDate(p.date)}</td>
                      <td className="py-2.5 text-zinc-600">{(PAYMENT_METHOD_LABELS as Record<string, string>)[p.method] || p.method}</td>
                      <td className="py-2.5 text-zinc-500 font-mono text-xs">{p.reference || "-"}</td>
                      <td className="py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-zinc-500 italic py-2">No payments received for this period.</p>
            )}
          </div>

          {/* Print / Action Buttons */}
          <div className="pt-6 border-t border-zinc-200 flex justify-end gap-3 print:hidden">
            <Button variant="secondary" onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>
              Share Link
            </Button>
            <Button variant="primary" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
              Download PDF / Print
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/50">
          <p className="text-base font-medium text-[var(--color-text-primary)]">Ready to create a statement</p>
          <p className="text-sm mt-1">Select a client and month above to generate an official PDF-ready statement.</p>
        </div>
      )}
    </div>
  );
}

export default function StatementsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Loading statements...</div>}>
      <StatementsContent />
    </Suspense>
  );
}
