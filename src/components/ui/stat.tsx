"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatProps {
  label: string;
  value: number;
  trend?: number; // percentage
  trendLabel?: string;
  className?: string;
  prefix?: string;
  isCurrency?: boolean;
}

export function AnimatedNumber({ value, isCurrency = true, prefix = '' }: { value: number; isCurrency?: boolean; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(isCurrency ? formatCurrency(value) : `${prefix}${value.toLocaleString('en-IN')}`);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const fromVal = prevValueRef.current;
    const toVal = value;
    prevValueRef.current = value;

    if (fromVal === toVal) return;

    const controls = animate(fromVal, toVal, {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1], // Restrained spring easing
      onUpdate: (latest) => {
        const rounded = Math.round(latest);
        setDisplayValue(isCurrency ? formatCurrency(rounded) : `${prefix}${rounded.toLocaleString('en-IN')}`);
      },
    });

    return () => controls.stop();
  }, [value, isCurrency, prefix]);

  return <span>{displayValue}</span>;
}

export function Stat({ label, value, trend, trendLabel, className, isCurrency = true, prefix = '' }: StatProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <h3 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          <AnimatedNumber value={value} isCurrency={isCurrency} prefix={prefix} />
        </h3>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center text-xs font-medium',
              trend > 0 ? 'text-[var(--color-success)]' : trend < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'
            )}
          >
            {trend > 0 ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : trend < 0 ? <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" /> : null}
            {Math.abs(trend)}%
            {trendLabel && <span className="ml-1 text-[11px] text-[var(--color-text-secondary)]">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
