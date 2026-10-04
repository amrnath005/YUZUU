"use client";
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { IndianRupee } from 'lucide-react';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, label, error, value, onChange, ...props }, ref) => {
    
    // Simplistic number handling for input
    const [inputValue, setInputValue] = React.useState<string>(value ? value.toString() : '');

    React.useEffect(() => {
      if (value !== undefined && value.toString() !== inputValue.replace(/,/g, '')) {
        setInputValue(value.toString());
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9.]/g, '');
      setInputValue(rawValue);
      
      const numValue = parseFloat(rawValue);
      if (onChange) {
        onChange(isNaN(numValue) ? undefined : numValue);
      }
    };

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{label}</label>}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <IndianRupee className="h-4 w-4" />
          </div>
          <input
            ref={ref}
            type="text"
            value={inputValue}
            onChange={handleChange}
            className={cn(
              'flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 pl-9 text-sm text-[var(--color-text-primary)] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-yuzu)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
