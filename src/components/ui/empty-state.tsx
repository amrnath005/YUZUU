import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  action?: React.ReactNode | { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === 'function') return <Icon className="h-8 w-8" strokeWidth={1.5} />;
    return null;
  };

  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) return action;
    if (typeof action === 'object' && 'label' in action && 'onClick' in action) {
      return (
        <Button variant="primary" onClick={(action as any).onClick}>
          {(action as any).label}
        </Button>
      );
    }
    return null;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">{description}</p>
      {renderAction()}
    </div>
  );
}
