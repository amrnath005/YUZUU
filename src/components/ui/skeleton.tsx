import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect' | 'card';
}

export function Skeleton({ className, variant = 'rect', ...props }: SkeletonProps) {
  const variants = {
    text: 'h-4 w-3/4 rounded',
    circle: 'h-10 w-10 rounded-full',
    rect: 'rounded-md',
    card: 'h-32 w-full rounded-xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--color-border)]',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
