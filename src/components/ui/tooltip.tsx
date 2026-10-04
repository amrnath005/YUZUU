"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ children, content, shortcut, position = 'top', className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 translate-y-2 mt-1',
    left: 'right-full top-1/2 -translate-y-1/2 -translate-x-2 mr-1',
    right: 'left-full top-1/2 -translate-y-1/2 translate-x-2 ml-1',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 whitespace-nowrap rounded bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-md dark:bg-neutral-200 dark:text-neutral-900 pointer-events-none',
              positions[position],
              className
            )}
            role="tooltip"
          >
            <div className="flex items-center gap-2">
              <span>{content}</span>
              {shortcut && (
                <span className="rounded bg-neutral-700 px-1 text-[10px] text-neutral-300 dark:bg-neutral-300 dark:text-neutral-700">
                  {shortcut}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
