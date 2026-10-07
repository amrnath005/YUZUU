"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast";
import { useClients } from "@/hooks/useStore";
import { store } from "@/data/store";
import { PAYMENT_METHOD_LABELS, PaymentMethod, Deliverable } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const recordPaymentSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  deliverableId: z.string().optional(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  date: z.string().min(1, "Select a date"),
  method: z.enum(["upi", "bank-transfer", "cash", "card", "other"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  markDelivered: z.boolean().optional(),
});

type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  defaultDeliverableId?: string;
}

export function RecordPaymentDialog({ open, onOpenChange, defaultClientId, defaultDeliverableId }: RecordPaymentDialogProps) {
  const clients = useClients();
  const { toast } = useToast();

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    setValue, 
    watch, 
    reset 
  } = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      method: "upi",
      amount: 0,
      clientId: defaultClientId || "",
      deliverableId: defaultDeliverableId || "",
      reference: "",
      notes: "",
      markDelivered: true,
    },
  });

  const watchClientId = watch("clientId");
  const watchDeliverableId = watch("deliverableId");

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === watchClientId);
  }, [clients, watchClientId]);

  // Load client deliverables dynamically
  const clientDeliverables: Deliverable[] = useMemo(() => {
    if (!watchClientId) return [];
    return store.getClientDeliverables(watchClientId);
  }, [watchClientId]);

  // Selected deliverable object if any
  const selectedDeliverable = useMemo(() => {
    if (!watchDeliverableId) return null;
    return clientDeliverables.find(d => d.id === watchDeliverableId) || null;
  }, [clientDeliverables, watchDeliverableId]);

  useEffect(() => {
    if (open) {
      const activeClientId = defaultClientId || (clients[0]?.id || "");
      const client = clients.find(c => c.id === activeClientId);
      const delivs = activeClientId ? store.getClientDeliverables(activeClientId) : [];
      const targetDeliv = defaultDeliverableId ? delivs.find(d => d.id === defaultDeliverableId) : null;

      const initAmount = targetDeliv ? targetDeliv.amount : (client && client.outstanding > 0 ? client.outstanding : 0);
      const initRef = targetDeliv ? `For: ${targetDeliv.title}` : "";

      reset({
        date: new Date().toISOString().split('T')[0],
        method: "upi",
        clientId: activeClientId,
        deliverableId: defaultDeliverableId || "",
        amount: initAmount,
        reference: initRef,
        notes: "",
        markDelivered: true,
      });
    }
  }, [open, defaultClientId, defaultDeliverableId, reset, clients]);

  // When deliverable is changed, auto-populate amount and reference
  const handleDeliverableChange = (delivId: string) => {
    setValue("deliverableId", delivId);
    if (!delivId) {
      // Revert to client outstanding if general payment
      if (selectedClient && selectedClient.outstanding > 0) {
        setValue("amount", selectedClient.outstanding);
      }
      return;
    }

    const matched = clientDeliverables.find(d => d.id === delivId);
    if (matched) {
      setValue("amount", matched.amount);
      const currentRef = watch("reference");
      if (!currentRef) {
        setValue("reference", `For: ${matched.title}`);
      }
    }
  };

  const onSubmit = async (data: RecordPaymentFormData) => {
    try {
      const dateStr = typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0];
      
      await store.addPayment({
        clientId: data.clientId,
        amount: Number(data.amount),
        date: dateStr,
        method: data.method as PaymentMethod,
        reference: data.reference?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      });

      // If user selected a deliverable and wants to mark it delivered
      if (data.deliverableId && data.markDelivered && selectedDeliverable && selectedDeliverable.status !== 'delivered') {
        await store.updateDeliverable(data.deliverableId, { status: 'delivered' });
      }

      toast.success(
        "✓ Payment recorded",
        `Received ${formatCurrency(data.amount)} from ${selectedClient?.name || 'client'}.`
      );
      onOpenChange(false);
    } catch (err: any) {
      console.error("[RecordPayment] Error:", err);
      toast.error("Failed to record payment", err?.message || "An unexpected error occurred.");
    }
  };

  const clientOptions = [
    { label: "Select client...", value: "" },
    ...clients.map(c => ({ 
      label: `${c.name} (${formatCurrency(c.outstanding)} due)`, 
      value: c.id 
    }))
  ];

  const deliverableOptions = [
    { label: "General payment / All work", value: "" },
    ...clientDeliverables.map(d => ({
      label: `${d.title} • ${formatCurrency(d.amount)} (${d.status})`,
      value: d.id
    }))
  ];

  const methodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader 
          title="Record Payment" 
          description="Record a received payment and link to client work." 
        />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogBody className="space-y-3.5 py-2">
            {/* 1. Client Selector */}
            <div>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select
                    name="clientId"
                    label="Client"
                    options={clientOptions}
                    error={errors.clientId?.message}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      setValue("deliverableId", "");
                    }}
                  />
                )}
              />
              {selectedClient && (
                <div className="flex items-center justify-between text-xs mt-1.5 px-1 text-[var(--color-text-secondary)]">
                  <span>
                    Current outstanding: <strong className={selectedClient.outstanding > 0 ? 'text-[var(--color-warning)] font-semibold' : 'text-[var(--color-text-primary)] font-semibold'}>{formatCurrency(selectedClient.outstanding)}</strong>
                  </span>
                  {selectedClient.outstanding > 0 && !watchDeliverableId && (
                    <button
                      type="button"
                      onClick={() => setValue("amount", selectedClient.outstanding)}
                      className="text-[var(--color-yuzu)] hover:underline font-semibold"
                    >
                      Fill full balance
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Work / Deliverable Selector */}
            {watchClientId && (
              <div>
                <Controller
                  name="deliverableId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Select Work / Deliverable (optional)"
                      options={deliverableOptions}
                      value={field.value || ""}
                      onChange={(e) => handleDeliverableChange(e.target.value)}
                    />
                  )}
                />
                {selectedDeliverable && (
                  <div className="mt-2 p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-[var(--color-text-primary)] font-medium">
                      <span>{selectedDeliverable.title}</span>
                      <span className="font-bold">{formatCurrency(selectedDeliverable.amount)}</span>
                    </div>
                    {selectedDeliverable.status !== 'delivered' && (
                      <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border)]/50">
                        <input
                          type="checkbox"
                          checked={watch("markDelivered")}
                          onChange={(e) => setValue("markDelivered", e.target.checked)}
                          className="rounded border-[var(--color-border)] text-[var(--color-yuzu)] focus:ring-[var(--color-yuzu)]"
                        />
                        <span>Mark deliverable as <strong>Delivered</strong></span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Amount Received */}
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label="Amount Received (₹)"
                  value={field.value}
                  onChange={(val) => field.onChange(val ?? 0)}
                  error={errors.amount?.message}
                />
              )}
            />

            {/* 4. Date & Method */}
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Date Received"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.date?.message}
                  />
                )}
              />
              <Controller
                name="method"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Payment Method"
                    options={methodOptions}
                    error={errors.method?.message}
                    {...field}
                  />
                )}
              />
            </div>

            {/* 5. Reference */}
            <Controller
              name="reference"
              control={control}
              render={({ field }) => (
                <Input 
                  label="Reference / Transaction ID (Optional)" 
                  placeholder="e.g. UPI-58291, NEFT-8392"
                  {...field}
                />
              )}
            />

            {/* 6. Notes */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">
                Notes <span className="text-[var(--color-text-secondary)] font-normal">(Optional)</span>
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-yuzu)] resize-none"
                    rows={2}
                    placeholder="Partial payment notes, invoice references..."
                    {...field}
                  />
                )}
              />
            </div>
          </DialogBody>
          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              ✓ Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
