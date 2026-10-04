"use client";
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'right' | 'bottom';
  className?: string;
}

export function Drawer({ isOpen, onClose, children, position = 'right', className }: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const isBottom = position === 'bottom';
  const initial = isBottom ? { y: '100%' } : { x: '100%' };
  const animate = isBottom ? { y: 0 } : { x: 0 };
  const exit = isBottom ? { y: '100%' } : { x: '100%' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={initial}
            animate={animate}
            exit={exit}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-50 flex flex-col bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xl',
              isBottom ? 'mt-auto h-[80vh] w-full rounded-t-xl border-t' : 'ml-auto h-full w-full max-w-md border-l',
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

export function DrawerHeader({ children, className, onClose }: { children: React.ReactNode; className?: string; onClose?: () => void }) {
  return (
    <div className={cn('flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4', className)}>
      <div className="font-semibold text-lg text-[var(--color-text-primary)]">{children}</div>
      {onClose && (
        <button onClick={onClose} className="rounded-md p-1 hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] transition-colors">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function DrawerBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)}>{children}</div>;
}

export function DrawerFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 px-6 py-4', className)}>{children}</div>;
}
