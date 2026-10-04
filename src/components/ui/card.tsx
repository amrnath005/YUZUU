import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({ className, variant = 'default', padding = 'md', hover = false, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-[var(--color-surface)] border-[var(--color-border)]',
    muted: 'bg-[var(--color-surface-muted)] border-transparent',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        variants[variant],
        paddings[padding],
        hover && 'hover:border-[var(--color-border)] hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
