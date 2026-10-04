"use client";
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'flex h-10 w-full appearance-none rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] ring-offset-[var(--color-bg)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-yuzu)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]' : '',
              className
            )}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
