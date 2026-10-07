"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency, formatMonth } from "@/lib/utils";
import { Client, Deliverable } from "@/types";
import { MessageSquare, Copy, Mail, ExternalLink, Check, Sparkles } from "lucide-react";

interface PaymentReminderDialogProps {
  client: Client;
  outstanding: number;
  deliverables: Deliverable[];
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentReminderDialog({
  client,
  outstanding,
  deliverables,
  isOpen,
  onClose,
}: PaymentReminderDialogProps) {
  const { user, workspace } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const freelancerName = user?.name || "Freelancer";
  const studioName = workspace?.name || `${freelancerName}'s Studio`;
  const defaultUpi = user?.email
    ? `${user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`
    : "yourname@upi";

  const [upiId, setUpiId] = useState(defaultUpi);

  // Generate polite, professional reminder text
  const generatedMessage = useMemo(() => {
    const currentDate = new Date();
    const period = formatMonth(currentDate.toISOString());
    const unpaidItems = deliverables
      .filter((d) => d.status !== "cancelled")
      .slice(0, 4)
      .map((d) => `• ${d.title} (₹${d.amount.toLocaleString("en-IN")})`)
      .join("\n");

    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://yuzu.app";
    const statementLink = `${siteOrigin}/statements?client=${client.id}`;

    return `Hi ${client.name} 👋,

Hope you are doing well!

Here is a quick summary of the creative deliverables completed for ${period}:
${unpaidItems || `• Deliverables for ${period}`}

Total Balance Due: ${formatCurrency(outstanding)}

You can remit the payment via UPI to: ${upiId}

Full statement & breakdown:
${statementLink}

Thank you for the partnership!
— ${freelancerName} (${studioName})`;
  }, [client, outstanding, deliverables, upiId, freelancerName, studioName]);

  const [customMessage, setCustomMessage] = useState(generatedMessage);

  useEffect(() => {
    if (isOpen) {
      setCustomMessage(generatedMessage);
      setCopied(false);
    }
  }, [isOpen, generatedMessage]);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(customMessage);
      setCopied(true);
      toast.success("✓ Copied to clipboard", "Payment reminder message is ready to send.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, "") : "";
    const encoded = encodeURIComponent(customMessage);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
    toast.info("Opening WhatsApp", "Sending reminder message...");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Payment Statement — ${client.name}`);
    const body = encodeURIComponent(customMessage);
    const emailTo = client.email || "";
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--color-yuzu)]/20 text-[var(--color-text-primary)]">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
                Send Payment Reminder
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Polite, executive-grade reminder ready to send in 1 click to {client.name}.
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Quick Balance Banner */}
          <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 flex justify-between items-center text-xs">
            <div>
              <span className="text-[var(--color-text-secondary)]">Client:</span>{" "}
              <strong className="text-[var(--color-text-primary)]">{client.name}</strong>
            </div>
            <div>
              <span className="text-[var(--color-text-secondary)]">Pending Balance:</span>{" "}
              <span className="font-bold text-amber-600 text-sm">{formatCurrency(outstanding)}</span>
            </div>
          </div>

          {/* Editable UPI ID */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Your UPI ID for Remittance
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourhandle@upi"
              className="mt-1 h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-yuzu)]"
            />
          </div>

          {/* Message Preview */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                Message Preview (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy text"}
              </button>
            </div>
            <textarea
              rows={8}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-text-primary)] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-yuzu)] resize-none font-sans"
            />
          </div>
        </DialogBody>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEmail}
              icon={<Mail className="w-3.5 h-3.5" />}
            >
              Email
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleWhatsApp}
              icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-800" />}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium"
            >
              Send on WhatsApp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
