import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'yuzu';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({ className, variant = 'default', size = 'sm', dot = false, children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20',
    danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20',
    info: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20',
    yuzu: 'bg-[var(--color-yuzu)]/10 text-neutral-800 border border-[var(--color-yuzu)]/20 dark:text-[var(--color-yuzu)]',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  const dotColors = {
    default: 'bg-gray-400',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
    info: 'bg-[var(--color-info)]',
    yuzu: 'bg-[var(--color-yuzu)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
