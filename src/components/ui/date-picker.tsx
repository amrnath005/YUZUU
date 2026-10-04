import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{label}</label>}
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="date"
            className={cn(
              'flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-yuzu)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
              error ? 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]' : '',
              className
            )}
            {...props}
          />
          <Calendar className="pointer-events-none absolute right-3 h-4 w-4 text-gray-500" />
        </div>
        {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
