import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  inputVariant?: 'default' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, prefixIcon, suffixIcon, inputVariant = 'default', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{label}</label>}
        <div className="relative">
          {prefixIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {prefixIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-yuzu)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              inputVariant === 'default' ? 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)]' : 'border-transparent bg-[var(--color-surface)] text-[var(--color-text-primary)]',
              prefixIcon ? 'pl-10' : 'pl-3',
              suffixIcon ? 'pr-10' : 'pr-3',
              error ? 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]' : '',
              className
            )}
            {...props}
          />
          {suffixIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {suffixIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={cn('mt-1.5 text-xs', error ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
