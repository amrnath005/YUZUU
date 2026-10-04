"use client";
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, open, onOpenChange, children, className }: DialogProps) {
  const isDialogOpen = isOpen ?? open ?? false;
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isDialogOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isDialogOpen]);

  return (
    <AnimatePresence>
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-50 w-full max-w-lg overflow-hidden rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl',
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('', className)}>{children}</div>;
}

export function DialogHeader({ children, className, onClose, title, description }: { 
  children?: React.ReactNode; 
  className?: string; 
  onClose?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4', className)}>
      <div>
        {title ? (
          <>
            <div className="font-semibold text-lg text-[var(--color-text-primary)]">{title}</div>
            {description && <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{description}</p>}
          </>
        ) : (
          <div className="font-semibold text-lg text-[var(--color-text-primary)]">{children}</div>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} className="rounded-md p-1 hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] transition-colors">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 px-6 py-4', className)}>{children}</div>;
}

export function DialogClose({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-end gap-3', className)}>{children}</div>;
}
