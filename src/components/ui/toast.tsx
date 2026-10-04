"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, generateId } from '@/lib/utils';
import { CheckCircle2, XCircle, Info, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastCallable {
  (options: { title?: string; message?: string; type?: ToastType; duration?: number } | string): void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

export interface ToastContextType {
  toast: ToastCallable;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((t: { title: string; message?: string; type?: ToastType; duration?: number }) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      title: t.title,
      message: t.message,
      type: t.type || 'info',
      duration: t.duration || 3000,
    };
    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  const toastCallable = useMemo(() => {
    const fn = ((options: any) => {
      if (typeof options === 'string') {
        addToast({ title: options, type: 'info' });
      } else if (options && typeof options === 'object') {
        addToast({
          title: options.title || '',
          message: options.message,
          type: options.type || 'info',
          duration: options.duration,
        });
      }
    }) as ToastCallable;

    fn.success = (title: string, message?: string) => addToast({ title, message, type: 'success' });
    fn.error = (title: string, message?: string) => addToast({ title, message, type: 'error' });
    fn.info = (title: string, message?: string) => addToast({ title, message, type: 'info' });
    fn.warning = (title: string, message?: string) => addToast({ title, message, type: 'warning' });

    return fn;
  }, [addToast]);

  const value: ToastContextType = useMemo(() => ({
    toast: toastCallable,
    success: toastCallable.success,
    error: toastCallable.error,
    info: toastCallable.info,
    warning: toastCallable.warning,
  }), [toastCallable]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onClose={() => removeToast(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] shrink-0" />,
    error: <XCircle className="h-5 w-5 text-[var(--color-danger)] shrink-0" />,
    info: <Info className="h-5 w-5 text-[var(--color-info)] shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-[var(--color-warning)] shrink-0" />,
  };

  const bgs = {
    success: 'border-[var(--color-success)]/30',
    error: 'border-[var(--color-danger)]/30',
    info: 'border-[var(--color-info)]/30',
    warning: 'border-[var(--color-warning)]/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={cn(
        'flex w-80 items-start gap-3 rounded-xl border bg-[var(--color-surface)] p-4 shadow-xl ring-1 ring-black/5',
        bgs[toast.type]
      )}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">{toast.title}</h4>
        {toast.message && <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    // Return a safe dummy fallback if outside provider
    const dummyFn = (() => {}) as unknown as ToastCallable;
    dummyFn.success = () => {};
    dummyFn.error = () => {};
    dummyFn.info = () => {};
    dummyFn.warning = () => {};
    return {
      toast: dummyFn,
      success: dummyFn.success,
      error: dummyFn.error,
      info: dummyFn.info,
      warning: dummyFn.warning,
    };
  }
  return context;
}
