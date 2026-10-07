"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { store } from "@/data/store";
import { ClientType } from "@/types";
import { UserPlus } from "lucide-react";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (clientId: string) => void;
}

const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: "agency", label: "Agency" },
  { value: "creator", label: "Content Creator" },
  { value: "business", label: "Business / Brand" },
  { value: "startup", label: "Startup" },
  { value: "individual", label: "Individual" },
];

export function AddClientDialog({ open, onOpenChange, onSuccess }: AddClientDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<ClientType>("agency");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a client or company name");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await store.addClient({
        name: trimmed,
        type,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive: true,
      });

      toast.success(`Client "${created.name}" created successfully`);
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setType("agency");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(created.id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create client");
      toast.error(err?.message || "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader
          title="Add New Client"
          description="Create a client profile to track deliverables, invoices, and payments."
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogBody className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-[var(--color-danger)] rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Client / Company Name *
              </label>
              <Input
                placeholder="e.g. Acme Corp, Arjun Creates"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Client Type
              </label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as ClientType)}
                options={CLIENT_TYPE_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Phone / WhatsApp (Optional)
                </label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Notes / Terms (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Payment terms, contract notes, or specific requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-yuzu)] resize-none"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Add Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
