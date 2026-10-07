"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { PAYMENT_METHOD_LABELS, Payment, PaymentMethod, Deliverable } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";

const editPaymentSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  deliverableId: z.string().optional(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  date: z.string().min(1, "Select a date"),
  method: z.enum(["upi", "bank-transfer", "cash", "card", "other"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type EditPaymentFormValues = z.infer<typeof editPaymentSchema>;

interface EditPaymentDialogProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPaymentDialog({ payment, isOpen, onClose }: EditPaymentDialogProps) {
  const clients = useClients();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EditPaymentFormValues>({
    resolver: zodResolver(editPaymentSchema),
    defaultValues: {
      clientId: "",
      deliverableId: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      method: "upi",
      reference: "",
      notes: "",
    }
  });

  const watchClientId = watch("clientId");

  // Load client deliverables dynamically
  const clientDeliverables: Deliverable[] = useMemo(() => {
    if (!watchClientId) return [];
    return store.getClientDeliverables(watchClientId);
  }, [watchClientId]);

  useEffect(() => {
    if (payment && isOpen) {
      setConfirmDelete(false);
      reset({
        clientId: payment.clientId,
        deliverableId: "",
        amount: payment.amount,
        date: payment.date.split("T")[0],
        method: payment.method,
        reference: payment.reference || "",
        notes: payment.notes || "",
      });
    }
  }, [payment, isOpen, reset]);

  const handleDeliverableSelect = (delivId: string) => {
    setValue("deliverableId", delivId);
    if (!delivId) return;

    const matched = clientDeliverables.find(d => d.id === delivId);
    if (matched) {
      setValue("amount", matched.amount);
      const currentRef = watch("reference");
      if (!currentRef) {
        setValue("reference", `For: ${matched.title}`);
      }
    }
  };

  const onSubmit = async (data: EditPaymentFormValues) => {
    if (!payment) return;
    try {
      await store.updatePayment(payment.id, {
        clientId: data.clientId,
        amount: Number(data.amount),
        date: data.date,
        method: data.method as PaymentMethod,
        reference: data.reference?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      });

      toast.success(
        "✓ Payment updated",
        `Payment of ${formatCurrency(data.amount)} has been updated.`
      );
      onClose();
    } catch (err: any) {
      console.error("[EditPayment] Update failed:", err);
      toast.error(
        "Failed to update payment",
        err.message || "An unexpected error occurred."
      );
    }
  };

  const handleDelete = async () => {
    if (!payment) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await store.deletePayment(payment.id);
      toast.info(
        "Payment deleted",
        `Payment of ${formatCurrency(payment.amount)} was removed.`
      );
      onClose();
    } catch (err: any) {
      console.error("[EditPayment] Delete failed:", err);
      toast.error(
        "Failed to delete payment",
        err.message || "Could not delete payment."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const clientOptions = clients.map(c => ({
    label: `${c.name} (${formatCurrency(c.outstanding)} due)`,
    value: c.id
  }));

  const deliverableOptions = [
    { label: "General payment / All work", value: "" },
    ...clientDeliverables.map(d => ({
      label: `${d.title} • ${formatCurrency(d.amount)} (${d.status})`,
      value: d.id
    }))
  ];

  const methodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
    label,
    value
  }));

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between w-full pr-6">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              Edit Payment
            </h2>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogBody className="space-y-4">
            {/* Client */}
            <div>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Client"
                    options={clientOptions}
                    error={errors.clientId?.message}
                    {...field}
                  />
                )}
              />
            </div>

            {/* Applicable Work / Deliverable */}
            {clientDeliverables.length > 0 && (
              <div>
                <Controller
                  name="deliverableId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Linked Work / Deliverable (optional)"
                      options={deliverableOptions}
                      value={field.value || ""}
                      onChange={(e) => handleDeliverableSelect(e.target.value)}
                    />
                  )}
                />
              </div>
            )}

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label="Amount Received (₹)"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.amount?.message}
                  />
                )}
              />

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
            </div>

            {/* Payment Method */}
            <div>
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

            {/* Reference */}
            <div>
              <Controller
                name="reference"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Reference / Transaction ID"
                    placeholder="e.g. UPI-58291, NEFT-8392"
                    {...field}
                  />
                )}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">
                Notes <span className="text-[var(--color-text-secondary)] font-normal">(optional)</span>
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={2}
                    placeholder="Payment notes, invoice reference..."
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-yuzu)] resize-none"
                  />
                )}
              />
            </div>
          </DialogBody>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant={confirmDelete ? "danger" : "ghost"}
              size="sm"
              loading={isDeleting}
              onClick={handleDelete}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
