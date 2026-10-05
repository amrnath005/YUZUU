"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { store } from '@/data/store';
import { useClients } from '@/hooks/useStore';
import { DELIVERABLE_TYPE_LABELS, Deliverable, DeliverableType, DeliverableStatus } from '@/types';
import { Trash2 } from 'lucide-react';

const editWorkSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  title: z.string().min(1, 'Enter a title'),
  type: z.string().min(1, 'Select a type'),
  amount: z.number().min(0, 'Enter an amount'),
  date: z.string().min(1, 'Select a date'),
  status: z.string().min(1, 'Select a status'),
  notes: z.string().optional(),
});

type EditWorkFormValues = z.infer<typeof editWorkSchema>;

interface EditDeliverableDialogProps {
  deliverable: Deliverable | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditDeliverableDialog({ deliverable, isOpen, onClose }: EditDeliverableDialogProps) {
  const clients = useClients();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EditWorkFormValues>({
    resolver: zodResolver(editWorkSchema),
    defaultValues: {
      clientId: '',
      title: '',
      type: 'instagram-reel',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'delivered',
      notes: '',
    }
  });

  useEffect(() => {
    if (deliverable && isOpen) {
      setConfirmDelete(false);
      reset({
        clientId: deliverable.clientId,
        title: deliverable.title,
        type: deliverable.type,
        amount: deliverable.amount,
        date: deliverable.date.split('T')[0],
        status: deliverable.status,
        notes: deliverable.notes || '',
      });
    }
  }, [deliverable, isOpen, reset]);

  const onSubmit = async (data: EditWorkFormValues) => {
    if (!deliverable) return;
    try {
      await store.updateDeliverable(deliverable.id, {
        clientId: data.clientId,
        title: data.title.trim(),
        type: data.type as DeliverableType,
        amount: Number(data.amount),
        date: data.date,
        status: data.status as DeliverableStatus,
        notes: data.notes?.trim() || undefined,
      });

      toast.success(
        "✓ Deliverable updated",
        `Changes to "${data.title}" have been saved.`
      );
      onClose();
    } catch (err: any) {
      console.error('[EditDeliverable] Update failed:', err);
      toast.error(
        "Failed to update",
        err.message || "An unexpected error occurred while saving."
      );
    }
  };

  const handleDelete = async () => {
    if (!deliverable) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await store.deleteDeliverable(deliverable.id);
      toast.info(
        "Deliverable deleted",
        `"${deliverable.title}" was removed.`
      );
      onClose();
    } catch (err: any) {
      console.error('[EditDeliverable] Delete failed:', err);
      toast.error(
        "Failed to delete",
        err.message || "Could not delete this deliverable."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const typeOptions = Object.entries(DELIVERABLE_TYPE_LABELS).map(([value, label]) => ({
    label,
    value
  }));

  const clientOptions = clients.map(c => ({
    label: `${c.name} (${c.type})`,
    value: c.id
  }));

  const statusOptions = [
    { label: "In Progress", value: "in-progress" },
    { label: "Delivered", value: "delivered" },
    { label: "Revision", value: "revision" },
    { label: "Cancelled", value: "cancelled" }
  ];

  if (!deliverable) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between w-full pr-6">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              Edit Deliverable
            </h2>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogBody className="space-y-4">
            {/* Title */}
            <div>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Deliverable Title"
                    placeholder="e.g. Doctor promo video, Reel #2..."
                    error={errors.title?.message}
                    {...field}
                  />
                )}
              />
            </div>

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

            {/* Type & Status */}
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Type"
                    options={typeOptions}
                    error={errors.type?.message}
                    {...field}
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Status"
                    options={statusOptions}
                    error={errors.status?.message}
                    {...field}
                  />
                )}
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label="Rate / Amount"
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
                    label="Date"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.date?.message}
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
                    placeholder="Any specific delivery instructions or notes..."
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
