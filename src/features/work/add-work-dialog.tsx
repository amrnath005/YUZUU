"use client";

import React, { useEffect, useRef } from 'react';
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
import { DELIVERABLE_TYPE_LABELS, DeliverableType, DeliverableStatus } from '@/types';

const addWorkSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  title: z.string().min(1, 'Enter a title'),
  type: z.string().min(1, 'Select a type'),
  amount: z.number().min(0, 'Enter an amount'),
  date: z.string().min(1, 'Select a date'),
  status: z.string().min(1, 'Select a status'),
  notes: z.string().optional(),
});

type AddWorkFormValues = z.infer<typeof addWorkSchema>;

interface AddWorkDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddWorkDialog({ isOpen, onClose }: AddWorkDialogProps) {
  const clients = useClients();
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AddWorkFormValues>({
    resolver: zodResolver(addWorkSchema),
    defaultValues: {
      clientId: '',
      title: '',
      type: 'instagram-reel',
      amount: 1500,
      date: new Date().toISOString().split('T')[0],
      status: 'delivered',
      notes: '',
    }
  });

  const watchClientId = watch('clientId');
  const watchType = watch('type');

  // Auto-populate rate card when client or type changes
  useEffect(() => {
    if (watchClientId && watchType) {
      const rateCards = store.getRateCards(watchClientId);
      const matchedRate = rateCards.find(r => r.deliverableType === watchType);
      if (matchedRate) {
        setValue('amount', matchedRate.rate);
      }
    }
  }, [watchClientId, watchType, setValue]);

  // When dialog opens, hydrate with last selected client & type if available
  useEffect(() => {
    if (isOpen && clients.length > 0) {
      const lastSelection = store.getLastSelection();
      const defaultClient = (lastSelection.clientId && clients.some(c => c.id === lastSelection.clientId))
        ? lastSelection.clientId
        : clients[0].id;

      const defaultType = (lastSelection.deliverableType as DeliverableType) || 'instagram-reel';

      const rateCards = store.getRateCards(defaultClient);
      const matchedRate = rateCards.find(r => r.deliverableType === defaultType);
      const defaultAmount = matchedRate ? matchedRate.rate : 1500;

      reset({
        clientId: defaultClient,
        title: '',
        type: defaultType,
        amount: defaultAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'delivered',
        notes: '',
      });

      // Auto-focus Title input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, reset, clients]);

  const saveDeliverableInternal = async (data: AddWorkFormValues) => {
    await store.addDeliverable({
      clientId: data.clientId,
      title: data.title.trim(),
      type: data.type as DeliverableType,
      amount: Number(data.amount),
      date: data.date,
      status: data.status as DeliverableStatus,
      notes: data.notes?.trim() || undefined,
    });
    // Remember client & type
    store.setLastSelection(data.clientId, data.type);
  };

  // Primary Action: Save & Close (Enter)
  const onSave = async (data: AddWorkFormValues) => {
    try {
      await saveDeliverableInternal(data);
      toast.success('Deliverable saved');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save deliverable');
    }
  };

  // Secondary Action: Save & Add Another (Shift + Enter)
  const onSaveAndAddAnother = async (data: AddWorkFormValues) => {
    try {
      await saveDeliverableInternal(data);
      toast.success('Deliverable saved • Ready for next');

      // Clear title and notes, preserve client, type, rate, date, status
      setValue('title', '');
      setValue('notes', '');

      // Focus Title input for immediate next entry
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save deliverable');
    }
  };

  // Keyboard shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const isTextarea = (e.target as HTMLElement).tagName.toLowerCase() === 'textarea';
      if (e.shiftKey) {
        e.preventDefault();
        handleSubmit(onSaveAndAddAnother)();
      } else if (!isTextarea) {
        e.preventDefault();
        handleSubmit(onSave)();
      }
    }
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.name} (${c.type})` }));
  const typeOptions = Object.entries(DELIVERABLE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const statusOptions = [
    { value: 'delivered', label: 'Delivered' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'revision', label: 'Revision' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader title="Add Work" description="Record a new deliverable in seconds." />
        <form
          id="add-work-form"
          onSubmit={handleSubmit(onSave)}
          onKeyDown={handleKeyDown}
          className="space-y-4"
        >
          <DialogBody>
            <div className="grid gap-3.5 py-1">
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Client"
                    options={[{ label: 'Select client...', value: '' }, ...clientOptions]}
                    error={errors.clientId?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Deliverable Title"
                    placeholder="e.g. Daily Short 101, Brand Promo"
                    error={errors.title?.message}
                    {...field}
                    ref={(el) => {
                      field.ref(el);
                      titleInputRef.current = el;
                    }}
                  />
                )}
              />
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
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      label="Rate / Amount"
                      error={errors.amount?.message}
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Date"
                      error={errors.date?.message}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
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

              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Notes (Optional)</label>
                    <textarea
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-yuzu)]"
                      rows={2}
                      placeholder="Brief context or links..."
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>
          </DialogBody>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button variant="ghost" type="button" onClick={onClose} size="sm">
              Cancel
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="secondary"
                type="button"
                onClick={handleSubmit(onSaveAndAddAnother)}
                disabled={isSubmitting}
                size="sm"
                title="Shift + Enter"
              >
                Save & Add Another
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                size="sm"
                title="Enter"
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
