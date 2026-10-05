"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useClients } from "@/hooks/useStore";
import { useAuth } from "@/contexts/auth-context";
import { store } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatMonth, formatDate, formatFullDate } from "@/lib/utils";
import { DELIVERABLE_TYPE_LABELS, PAYMENT_METHOD_LABELS, Deliverable, Payment } from "@/types";
import { Card } from "@/components/ui/card";
import { 
  Printer, 
  Share2, 
  FileCheck, 
  Download, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Settings2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface StatementData {
  client: any;
  monthDate: Date;
  startDate: Date;
  endDate: Date;
  statementNumber: string;
  deliverables: Deliverable[];
  payments: Payment[];
  earned: number;
  received: number;
  outstanding: number;
}

function StatementsContent() {
  const searchParams = useSearchParams();
  const initialClient = searchParams.get("client") || "";

  const clients = useClients();
  const { user, workspace } = useAuth();
  const { toast } = useToast();

  const [selectedClient, setSelectedClient] = useState(initialClient);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [statementData, setStatementData] = useState<StatementData | null>(null);

  // Customizable Remittance / Invoice metadata
  const [showCustomDetails, setShowCustomDetails] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [taxId, setTaxId] = useState("");
  const [customNotes, setCustomNotes] = useState("Payment is appreciated upon receipt. Thank you for your partnership!");

  // Default UPI ID from user email if not set
  useEffect(() => {
    if (!upiId && user?.email) {
      const handle = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      setUpiId(`${handle}@upi`);
    }
  }, [user, upiId]);

  const studioName = workspace?.name || (user?.name ? `${user.name}'s Studio` : "Creative Studio");
  const freelancerName = user?.name || "Freelance Creator";
  const contactEmail = user?.email || "billing@yuzu.app";

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

    // Deterministic statement numbering: STMT-YYYYMM-XXXX
    const clientCode = client.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'CLNT';
    const statementNumber = `STMT-${yearStr}${monthStr}-${clientCode}`;

    setStatementData({
      client,
      monthDate: start,
      startDate: start,
      endDate: end,
      statementNumber,
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
    } else if (clients.length > 0 && !selectedClient) {
      // Auto-select first client if none selected
      setSelectedClient(clients[0].id);
      createStatement(clients[0].id, selectedMonth);
    }
  }, [initialClient, clients, selectedMonth]);

  const generateStatement = () => {
    if (!selectedClient) {
      toast.warning("Please select a client");
      return;
    }
    createStatement(selectedClient, selectedMonth);
  };

  const handleDownloadPDF = () => {
    if (!statementData) return;
    const originalTitle = document.title;
    const sanitizedClient = statementData.client.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const [year, month] = selectedMonth.split("-");
    
    // Set professional filename for browser's "Save as PDF"
    document.title = `${sanitizedClient}_Statement_${month}_${year}_YUZU`;
    
    toast.info(
      "Generating PDF Document",
      "Select 'Save as PDF' in the print dialog to export high-resolution vector PDF."
    );

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 150);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Statement link copied to clipboard");
    } else {
      toast("Link copied");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto pb-24">
      {/* Screen-Only Configuration & Action Toolbar */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[var(--color-border)]">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              Client Statements &amp; Invoices
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Generate executive-grade, Zoho Invoice styled work &amp; billing statements for your clients.
            </p>
          </div>
          {statementData && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>
                Share
              </Button>
              <Button variant="primary" onClick={handleDownloadPDF} icon={<Download className="w-4 h-4" />}>
                Download PDF / Print
              </Button>
            </div>
          )}
        </div>

        {/* Client & Period Selector Card */}
        <Card className="p-5 flex flex-wrap gap-4 items-end bg-[var(--color-surface)] shadow-xs">
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
          <Button 
            variant="ghost" 
            onClick={() => setShowCustomDetails(!showCustomDetails)}
            icon={<Settings2 className="w-4 h-4" />}
          >
            {showCustomDetails ? "Hide Custom Details" : "Invoice Options"}
          </Button>
        </Card>

        {/* Optional Custom Remittance / Tax configuration */}
        {showCustomDetails && (
          <Card className="p-5 bg-[var(--color-surface-muted)]/50 border border-[var(--color-border)] space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[var(--color-yuzu-hover)]" />
              Remittance &amp; Invoice Customization (Zoho Invoice Standard)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">UPI ID / VPA</label>
                <input
                  type="text"
                  placeholder="e.g. creator@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-yuzu)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Bank Transfer / IFSC</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC • A/C: 50100234 • IFSC: HDFC0001"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-yuzu)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">GSTIN / PAN (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-yuzu)]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">Notes / Payment Terms</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-yuzu)]"
              />
            </div>
          </Card>
        )}
      </div>

      {/* Professional Statement Document (Zoho Invoice / Standard Vector Layout) */}
      {statementData ? (
        <div className="mt-4 mx-auto max-w-[800px] bg-white text-zinc-900 p-8 sm:p-12 shadow-lg rounded-2xl border border-zinc-200 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none">
          
          {/* Header Row: Brand Identity & Document Reference */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b-2 border-zinc-900">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black tracking-tight text-zinc-900 font-sans">
                  y<span className="relative inline-block">u<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#F6D94E] rounded-full" /></span>zu
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-l border-zinc-300 pl-2">
                  Billing
                </span>
              </div>
              <p className="text-sm font-bold text-zinc-900 mt-2">{studioName}</p>
              <p className="text-xs text-zinc-500">{freelancerName} • {contactEmail}</p>
              {taxId && <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">Tax / PAN: {taxId}</p>}
            </div>

            <div className="sm:text-right flex flex-col sm:items-end">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200 mb-2">
                {statementData.outstanding === 0 ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Paid in Full
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Payment Due
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-zinc-900">
                Statement of Account
              </h2>
              <p className="text-xs font-mono font-medium text-zinc-500 mt-0.5">
                Ref: <span className="text-zinc-900 font-semibold">{statementData.statementNumber}</span>
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Date: <span className="font-semibold text-zinc-800">{formatFullDate(new Date().toISOString())}</span>
              </p>
              <p className="text-xs text-zinc-500">
                Period: <span className="font-semibold text-zinc-800">{formatMonth(statementData.monthDate)}</span>
              </p>
            </div>
          </div>

          {/* Billed To & Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 py-4 px-6 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
            <div>
              <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                Billed To
              </span>
              <p className="text-lg font-bold text-zinc-900 mt-1">{statementData.client.name}</p>
              <p className="text-xs text-zinc-600 capitalize">
                {statementData.client.type} Account
              </p>
              {statementData.client.email && (
                <p className="text-xs text-zinc-500 mt-0.5">{statementData.client.email}</p>
              )}
            </div>

            <div className="sm:text-right flex flex-col sm:items-end justify-center">
              <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                Billing Cycle
              </span>
              <p className="text-sm font-semibold text-zinc-900 mt-1">
                {formatDate(statementData.startDate.toISOString())} – {formatDate(statementData.endDate.toISOString())}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Currency: <span className="font-semibold text-zinc-800">INR (₹)</span>
              </p>
            </div>
          </div>

          {/* Executive 3-Card Summary Ribbon (Zoho Invoice Style) */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-zinc-200 bg-white">
              <p className="text-[10.5px] uppercase font-bold text-zinc-400 tracking-wider">
                Total Billed
              </p>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 mt-1 tabular-nums">
                {formatCurrency(statementData.earned)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {statementData.deliverables.length} {statementData.deliverables.length === 1 ? 'deliverable' : 'deliverables'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 bg-white">
              <p className="text-[10.5px] uppercase font-bold text-zinc-400 tracking-wider">
                Payments Credited
              </p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 tabular-nums">
                {formatCurrency(statementData.received)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {statementData.payments.length} {statementData.payments.length === 1 ? 'payment' : 'payments'}
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${statementData.outstanding > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-zinc-200 bg-zinc-50/50'}`}>
              <p className="text-[10.5px] uppercase font-bold text-amber-700 tracking-wider">
                Balance Due
              </p>
              <p className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${statementData.outstanding > 0 ? 'text-amber-700' : 'text-zinc-900'}`}>
                {formatCurrency(statementData.outstanding)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {statementData.outstanding === 0 ? 'Settled' : 'Net Outstanding'}
              </p>
            </div>
          </div>

          {/* Itemized Deliverables Table */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                Itemized Work Deliverables
              </h3>
              <span className="text-xs text-zinc-400">
                Count: {statementData.deliverables.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/90 text-zinc-700 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3">Deliverable Description</th>
                    <th className="py-2.5 px-3 w-32">Type</th>
                    <th className="py-2.5 px-3 w-14 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right w-24">Rate</th>
                    <th className="py-2.5 px-3 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 font-sans">
                  {statementData.deliverables.length > 0 ? (
                    statementData.deliverables.map((d, index) => (
                      <tr key={d.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3 px-3 text-center text-zinc-400 font-mono">{index + 1}</td>
                        <td className="py-3 px-3 text-zinc-600 whitespace-nowrap">{formatDate(d.date)}</td>
                        <td className="py-3 px-3 font-semibold text-zinc-900">
                          {d.title}
                          {d.notes && (
                            <p className="text-[11px] text-zinc-500 font-normal mt-0.5">{d.notes}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-600">
                          {DELIVERABLE_TYPE_LABELS[d.type] || d.type}
                        </td>
                        <td className="py-3 px-3 text-center text-zinc-600">1</td>
                        <td className="py-3 px-3 text-right text-zinc-600 font-mono">
                          {formatCurrency(d.amount)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-zinc-900 tabular-nums">
                          {formatCurrency(d.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-zinc-400 italic">
                        No billable deliverables logged for this statement cycle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Receipts & Remittances Table */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-3">
              Payment Receipts &amp; Credits ({statementData.payments.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/90 text-zinc-700 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">Payment Date</th>
                    <th className="py-2.5 px-3 w-32">Payment Mode</th>
                    <th className="py-2.5 px-3">Transaction Ref / UTR</th>
                    <th className="py-2.5 px-3 text-right w-32">Amount Credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 font-sans">
                  {statementData.payments.length > 0 ? (
                    statementData.payments.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 text-center text-zinc-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-zinc-600">{formatDate(p.date)}</td>
                        <td className="py-2.5 px-3 text-zinc-700 capitalize">
                          {PAYMENT_METHOD_LABELS[p.method] || p.method}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{p.reference || "—"}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 tabular-nums">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-zinc-400 italic">
                        No payments received during this cycle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals Calculation Box (Zoho Invoice Style) */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 pb-8 border-b border-zinc-200">
            {/* Payment Details & Remittance Box */}
            <div className="w-full sm:w-7/12 p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-zinc-700" /> Remittance &amp; Payment Details
              </p>
              <div className="text-xs text-zinc-600 space-y-1">
                {upiId && (
                  <p className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-800">UPI ID / VPA:</span> 
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-900 font-bold">{upiId}</span>
                  </p>
                )}
                {bankDetails && (
                  <p>
                    <span className="font-semibold text-zinc-800">Direct Bank:</span> {bankDetails}
                  </p>
                )}
                <p className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/80">
                  {customNotes}
                </p>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-5/12 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-zinc-600">
                <span>Gross Work Total</span>
                <span className="font-medium text-zinc-900 tabular-nums">{formatCurrency(statementData.earned)}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-700">
                <span>Less Total Payments Made</span>
                <span className="font-medium tabular-nums">(-) {formatCurrency(statementData.received)}</span>
              </div>
              <div className="pt-2 border-t-2 border-zinc-900 flex justify-between items-baseline">
                <span className="text-sm font-black uppercase text-zinc-900 tracking-tight">Total Balance Due</span>
                <span className="text-xl font-black text-zinc-900 tabular-nums">
                  {formatCurrency(statementData.outstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* Statement Footer & Sign-off */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-end gap-6 text-[11px] text-zinc-400">
            <div>
              <p className="font-semibold text-zinc-700">Generated via YUZU Cloud</p>
              <p className="text-zinc-500 mt-0.5">This document serves as an official accounting statement for work executed.</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-zinc-900">{freelancerName}</p>
              <p className="text-zinc-500">Authorized Signatory</p>
            </div>
          </div>

          {/* Screen Only Action Buttons */}
          <div className="pt-8 mt-6 border-t border-zinc-200 flex justify-end gap-3 print:hidden">
            <Button variant="secondary" onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>
              Copy Link
            </Button>
            <Button variant="primary" onClick={handleDownloadPDF} icon={<Download className="w-4 h-4" />}>
              Download PDF / Print
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/50">
          <p className="text-base font-medium text-[var(--color-text-primary)]">Ready to generate statement</p>
          <p className="text-sm mt-1">Select a client and month above to create an official statement.</p>
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
