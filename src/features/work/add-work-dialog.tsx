"use client";

import React, { useEffect, useRef, useState } from 'react';
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
import { DELIVERABLE_TYPE_LABELS, DeliverableType, DeliverableStatus, ClientType } from '@/types';

const addWorkSchema = z.object({
  clientId: z.string().optional(),
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
  defaultClientId?: string;
}

export function AddWorkDialog({ isOpen, onClose, defaultClientId }: AddWorkDialogProps) {
  const clients = useClients();
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const newClientInputRef = useRef<HTMLInputElement | null>(null);

  const [isCreatingClient, setIsCreatingClient] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientType, setNewClientType] = useState<ClientType>('agency');
  const [clientError, setClientError] = useState<string | null>(null);

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
    if (watchClientId && watchType && !isCreatingClient) {
      const rateCards = store.getRateCards(watchClientId);
      const matchedRate = rateCards.find(r => r.deliverableType === watchType);
      if (matchedRate) {
        setValue('amount', matchedRate.rate);
      }
    }
  }, [watchClientId, watchType, isCreatingClient, setValue]);

  // When dialog opens, hydrate with last selected client & type if available
  useEffect(() => {
    if (isOpen) {
      setClientError(null);
      if (clients.length === 0) {
        setIsCreatingClient(true);
        setNewClientName('');
        reset({
          clientId: '',
          title: '',
          type: 'instagram-reel',
          amount: 1500,
          date: new Date().toISOString().split('T')[0],
          status: 'delivered',
          notes: '',
        });
        setTimeout(() => {
          newClientInputRef.current?.focus();
        }, 80);
      } else {
        setIsCreatingClient(false);
        const lastSelection = store.getLastSelection();
        const defaultClient = (defaultClientId && clients.some(c => c.id === defaultClientId))
          ? defaultClientId
          : (lastSelection.clientId && clients.some(c => c.id === lastSelection.clientId))
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

        setTimeout(() => {
          titleInputRef.current?.focus();
        }, 80);
      }
    }
  }, [isOpen, reset, clients, defaultClientId]);

  const resolveClientId = async (): Promise<string | null> => {
    if (isCreatingClient || clients.length === 0) {
      const trimmed = newClientName.trim();
      if (!trimmed) {
        setClientError('Enter a client name');
        newClientInputRef.current?.focus();
        return null;
      }
      setClientError(null);
      const created = await store.addClient({
        name: trimmed,
        type: newClientType,
        isActive: true,
      });
      return created.id;
    } else {
      const cid = watch('clientId');
      if (!cid) {
        setClientError('Select a client');
        return null;
      }
      setClientError(null);
      return cid;
    }
  };

  const saveDeliverableInternal = async (data: AddWorkFormValues, resolvedClientId: string) => {
    await store.addDeliverable({
      clientId: resolvedClientId,
      title: data.title.trim(),
      type: data.type as DeliverableType,
      amount: Number(data.amount),
      date: data.date,
      status: data.status as DeliverableStatus,
      notes: data.notes?.trim() || undefined,
    });
    // Remember client & type
    store.setLastSelection(resolvedClientId, data.type);
  };

  // Primary Action: Save & Close (Enter)
  const onSave = async (data: AddWorkFormValues) => {
    try {
      const resolvedId = await resolveClientId();
      if (!resolvedId) return;

      await saveDeliverableInternal(data, resolvedId);
      toast.success('Deliverable saved');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save deliverable');
    }
  };

  // Secondary Action: Save & Add Another (Shift + Enter)
  const onSaveAndAddAnother = async (data: AddWorkFormValues) => {
    try {
      const resolvedId = await resolveClientId();
      if (!resolvedId) return;

      await saveDeliverableInternal(data, resolvedId);
      toast.success('Deliverable saved • Ready for next');

      // Once created, switch back to selecting this client for subsequent items
      setIsCreatingClient(false);
      setNewClientName('');
      setValue('clientId', resolvedId);
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
              {/* Client Selection / Inline Creation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                    {isCreatingClient || clients.length === 0 ? 'Client Name' : 'Client'}
                  </label>
                  {clients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingClient(!isCreatingClient);
                        setClientError(null);
                      }}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline transition-colors"
                    >
                      {isCreatingClient ? '← Select existing' : '+ New client'}
                    </button>
                  )}
                </div>

                {isCreatingClient || clients.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <Input
                        placeholder="e.g. Nova Media, Pixel House"
                        value={newClientName}
                        onChange={(e) => {
                          setNewClientName(e.target.value);
                          if (clientError) setClientError(null);
                        }}
                        error={clientError || undefined}
                        ref={newClientInputRef}
                      />
                    </div>
                    <div>
                      <Select
                        options={[
                          { value: 'agency', label: 'Agency' },
                          { value: 'creator', label: 'Creator' },
                          { value: 'business', label: 'Business' },
                          { value: 'startup', label: 'Startup' },
                          { value: 'individual', label: 'Individual' },
                        ]}
                        value={newClientType}
                        onChange={(e) => setNewClientType(e.target.value as ClientType)}
                      />
                    </div>
                  </div>
                ) : (
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        name="clientId"
                        options={[
                          { label: 'Select client...', value: '' },
                          ...clientOptions,
                          { label: '+ Add new client...', value: '__new__' }
                        ]}
                        value={field.value}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setIsCreatingClient(true);
                            setNewClientName('');
                            setTimeout(() => {
                              newClientInputRef.current?.focus();
                            }, 50);
                          } else {
                            field.onChange(e);
                          }
                        }}
                        error={clientError || errors.clientId?.message}
                      />
                    )}
                  />
                )}
              </div>

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
                    <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                      Notes (Optional)
                    </label>
                    <textarea
                      placeholder="Brief context or links..."
                      rows={2}
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-yuzu)]"
                      {...field}
                    />
                  </div>
                )}
              />
            </div>
          </DialogBody>
          <DialogFooter className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSubmit(onSaveAndAddAnother)}
                loading={isSubmitting}
                title="Save and quickly add another item (Shift+Enter)"
              >
                Save &amp; Add Another
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isSubmitting}
                title="Save deliverable (Enter)"
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
