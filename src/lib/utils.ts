import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });
}

export function formatFullDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonth(inputOrMonth: string | Date | number, maybeYear?: number): string {
  let date: Date;
  if (typeof inputOrMonth === 'number') {
    const year = maybeYear ?? new Date().getFullYear();
    date = new Date(year, inputOrMonth - 1, 1);
  } else if (typeof inputOrMonth === 'string') {
    date = new Date(inputOrMonth);
  } else {
    date = inputOrMonth;
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const isToday = now.getDate() === date.getDate() && 
                 now.getMonth() === date.getMonth() && 
                 now.getFullYear() === date.getFullYear();
                 
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.getDate() === date.getDate() && 
                      yesterday.getMonth() === date.getMonth() && 
                      yesterday.getFullYear() === date.getFullYear();
                      
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  
  return formatDate(dateStr);
}
