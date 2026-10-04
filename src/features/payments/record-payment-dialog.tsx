"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
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
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@/types";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  clientId: z.string().min(1, "Client is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  date: z.union([z.date(), z.string()]),
  method: z.enum(["upi", "bank-transfer", "cash", "card", "other"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
}

export function RecordPaymentDialog({ open, onOpenChange, defaultClientId }: RecordPaymentDialogProps) {
  const clients = useClients();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      method: "upi",
      amount: 0,
      clientId: defaultClientId || "",
      reference: "",
      notes: "",
    },
  });

  const watchClientId = watch("clientId");
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === watchClientId);
  }, [clients, watchClientId]);

  useEffect(() => {
    if (open) {
      const client = clients.find(c => c.id === (defaultClientId || clients[0]?.id));
      const initAmount = client && client.outstanding > 0 ? client.outstanding : 0;

      reset({
        date: new Date().toISOString().split('T')[0],
        method: "upi",
        clientId: defaultClientId || clients[0]?.id || "",
        amount: initAmount,
        reference: "",
        notes: "",
      });
    }
  }, [open, defaultClientId, reset, clients]);

  const onSubmit = async (data: FormData) => {
    try {
      const dateStr = data.date instanceof Date ? data.date.toISOString().split('T')[0] : String(data.date);
      await store.addPayment({
        clientId: data.clientId,
        amount: Number(data.amount),
        date: dateStr,
        method: data.method as PaymentMethod,
        reference: data.reference,
        notes: data.notes,
      });
      toast({ title: "✓ Payment recorded" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to record payment", message: err?.message, type: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader title="Record Payment" description="Record a payment to update client balance." />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-3.5 py-2">
            <div>
              <Select
                label="Client"
                options={[{ label: "Select client...", value: "" }, ...clients.map(c => ({ label: `${c.name} (${formatCurrency(c.outstanding)} due)`, value: c.id }))]}
                error={errors.clientId?.message}
                {...register("clientId")}
              />
              {selectedClient && (
                <div className="flex items-center justify-between text-xs mt-1.5 px-1 text-[var(--color-text-secondary)]">
                  <span>
                    Current outstanding: <strong className={selectedClient.outstanding > 0 ? 'text-[var(--color-warning)] font-semibold' : 'text-[var(--color-text-primary)] font-semibold'}>{formatCurrency(selectedClient.outstanding)}</strong>
                  </span>
                  {selectedClient.outstanding > 0 && (
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

            <CurrencyInput
              label="Amount Received (₹)"
              value={watch("amount")}
              onChange={(val) => setValue("amount", val ?? 0)}
              error={errors.amount?.message}
            />

            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                label="Date Received"
                value={typeof watch("date") === 'string' ? watch("date") as string : (watch("date") as Date)?.toISOString().split('T')[0]}
                onChange={(e) => setValue("date", e.target.value)}
                error={errors.date?.message as any}
              />
              <Select
                label="Payment Method"
                options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))}
                error={errors.method?.message}
                {...register("method")}
              />
            </div>

            <Input 
              label="Reference / Transaction ID (Optional)" 
              placeholder="e.g. UPI-58291, NEFT-8392"
              {...register("reference")} 
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Notes (Optional)</label>
              <textarea
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-yuzu)]"
                rows={2}
                placeholder="Partial payment notes, invoice references..."
                {...register("notes")}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              ✓ Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
