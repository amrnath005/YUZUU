"use client";
import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

interface DropdownProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'end' | 'start';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const isCompound = !trigger;

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
        {!isCompound ? (
          <>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
              {trigger}
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    'absolute z-50 mt-2 min-w-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg ring-1 ring-black/5 focus:outline-none',
                    (align === 'right' || align === 'end') ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
                  )}
                >
                  <div className="py-1">{children}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          children
        )}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = useContext(DropdownContext);
  if (!ctx) return <>{children}</>;
  return (
    <div onClick={() => ctx.setIsOpen(!ctx.isOpen)} className={cn("cursor-pointer inline-flex", className)}>
      {children}
    </div>
  );
}

export function DropdownContent({ 
  children, 
  align = 'right', 
  className 
}: { 
  children: React.ReactNode; 
  align?: 'left' | 'right' | 'end' | 'start'; 
  className?: string;
}) {
  const ctx = useContext(DropdownContext);
  const isOpen = ctx?.isOpen ?? false;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ duration: 0.18 }}
          className={cn(
            'absolute z-50 mt-2 min-w-[180px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg focus:outline-none py-1',
            (align === 'right' || align === 'end') ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DropdownItem({ children, onClick, icon, className, danger }: { children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode; className?: string; danger?: boolean }) {
  const ctx = useContext(DropdownContext);
  return (
    <button
      type="button"
      onClick={() => {
        ctx?.setIsOpen(false);
        onClick?.();
      }}
      className={cn(
        'group flex w-full items-center px-4 py-2 text-sm transition-colors text-left',
        danger ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]',
        className
      )}
    >
      {icon && <span className="mr-3 h-4 w-4">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-[var(--color-border)]" />;
}
