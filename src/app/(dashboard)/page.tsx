"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, CreditCard, ChevronRight, FileText, CheckCircle2, Calendar } from 'lucide-react';
import { useDashboardStats, useOutstandingClients, useActivities, useDeliverables, usePayments } from '@/hooks/useStore';
import { formatCurrency, getGreeting, getRelativeDate } from '@/lib/utils';
import { useAddWork } from '@/features/work/add-work-provider';
import { useRecordPayment } from '@/features/payments/record-payment-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/ui/stat';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { LocalMigrationBanner } from '@/features/migration/local-migration-banner';

export default function DashboardPage() {
  const { user } = useAuth();
  const { openAddWork } = useAddWork();
  const { openRecordPayment } = useRecordPayment();

  // Current date & month selection
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  const stats = useDashboardStats(selectedMonth, selectedYear);
  const outstandingClients = useOutstandingClients();
  const activities = useActivities(6);
  const deliverables = useDeliverables({});
  const payments = usePayments({});

  // Dynamically generated month options (current month + 5 previous months + historical data)
  const monthOptions = useMemo(() => {
    const today = new Date();
    const map = new Map<string, { value: string; label: string; year: number; month: number }>();

    // 1. Current month + previous 5 months
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${m}`;
      const isCurrent = i === 0;
      const monthLabel = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      map.set(key, {
        value: key,
        label: `${monthLabel}${isCurrent ? ' (Current)' : ''}`,
        year: y,
        month: m,
      });
    }

    // 2. Any historical months with deliverables or payments
    deliverables.forEach(d => {
      const dt = new Date(d.date);
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = dt.getMonth();
        const key = `${y}-${m}`;
        if (!map.has(key)) {
          const monthLabel = dt.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          map.set(key, {
            value: key,
            label: monthLabel,
            year: y,
            month: m,
          });
        }
      }
    });

    payments.forEach(p => {
      const dt = new Date(p.date);
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = dt.getMonth();
        const key = `${y}-${m}`;
        if (!map.has(key)) {
          const monthLabel = dt.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          map.set(key, {
            value: key,
            label: monthLabel,
            year: y,
            month: m,
          });
        }
      }
    });

    // Sort descending (newest month first)
    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [deliverables, payments]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Migration Alert (If local unmigrated data exists) */}
      <LocalMigrationBanner />

      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {getGreeting()}, {user?.name || 'Creator'}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Know your work. Know your money.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-secondary)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
              className="bg-transparent border-none text-[var(--color-text-primary)] focus:outline-none cursor-pointer pr-1"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[var(--color-surface)]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Button variant="secondary" size="sm" onClick={() => openRecordPayment()} icon={<CreditCard className="w-3.5 h-3.5" />}>
            Record payment
          </Button>
          <Button variant="primary" size="sm" onClick={openAddWork} icon={<Plus className="w-3.5 h-3.5" />}>
            + Add work
          </Button>
        </div>
      </header>

      {/* Main Content Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Left Column: Financial Editorial Composition + Trend Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
          {/* Editorial Financial Overview */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Primary Dominant Hero: Earned */}
              <div className="md:col-span-7 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Earned this month
                </span>
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">
                  <AnimatedNumber value={stats.totalEarned} />
                </div>
                <div className="flex items-center gap-2 pt-2 text-sm">
                  <span className="inline-flex items-center font-semibold text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-0.5 rounded-md">
                    <AnimatedNumber value={stats.totalReceived} />
                  </span>
                  <span className="text-[var(--color-text-secondary)]">received this month</span>
                </div>
              </div>

              {/* Supporting Secondary Figures */}
              <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-1 gap-3">
                <div className="p-3.5 rounded-lg bg-[var(--color-surface-muted)]/70 border border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Outstanding
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
                  </div>
                  <div className={`text-xl md:text-2xl font-bold mt-1.5 ${stats.outstanding > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}`}>
                    <AnimatedNumber value={stats.outstanding} />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--color-surface-muted)]/70 border border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Deliverables
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold mt-1.5 text-[var(--color-text-primary)]">
                    <AnimatedNumber value={stats.deliverableCount} isCurrency={false} />
                  </div>
                </div>
              </div>
            </div>

            {/* Restrained Minimalist Area Chart */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Cashflow & Billings</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">6-month comparison of work delivered vs payments received</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E7A83E]" />
                    <span className="text-[var(--color-text-secondary)]">Earned</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                    <span className="text-[var(--color-text-secondary)]">Received</span>
                  </div>
                </div>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyEarnings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="yuzuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F6D94E" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#F6D94E" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#55A878" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#55A878" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} 
                      dy={8}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--color-surface)', 
                        borderColor: 'var(--color-border)', 
                        borderRadius: '8px', 
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                      itemStyle={{ color: 'var(--color-text-primary)' }}
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earned" 
                      stroke="#E7A83E" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#yuzuGrad)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="received" 
                      stroke="#55A878" 
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      fillOpacity={1} 
                      fill="url(#successGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Money to Collect + Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          {/* Money to Collect Section */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
              <div>
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Money to collect</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Outstanding client balances</p>
              </div>
              <Link href="/clients" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors inline-flex items-center">
                All <ChevronRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>

            {outstandingClients.length > 0 ? (
              <div className="divide-y divide-[var(--color-border)]">
                {outstandingClients.slice(0, 5).map(({ client, outstanding }) => (
                  <div key={client.id} className="py-2.5 flex items-center justify-between gap-2 group">
                    <Link href={`/clients/${client.id}`} className="min-w-0 flex-1 pr-1">
                      <p className="font-medium text-xs text-[var(--color-text-primary)] group-hover:underline truncate">
                        {client.name}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] capitalize">
                        {client.type}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-semibold text-xs text-[var(--color-warning)] mr-1">
                        <AnimatedNumber value={outstanding} />
                      </span>
                      <Link
                        href={`/clients/${client.id}`}
                        title="View client"
                        className="rounded hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-[11px] font-medium px-1.5 py-0.5 border border-[var(--color-border)]"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => openRecordPayment(client.id)}
                        title="Record payment"
                        className="rounded bg-[var(--color-yuzu)]/20 hover:bg-[var(--color-yuzu)] text-neutral-900 text-[11px] font-medium px-1.5 py-0.5 transition-colors"
                      >
                        Pay
                      </button>
                      <Link
                        href={`/statements?client=${client.id}`}
                        title="Generate statement"
                        className="rounded hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-[11px] font-medium px-1.5 py-0.5 border border-[var(--color-border)] hidden xl:inline-block"
                      >
                        Stmt
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--color-text-secondary)]">
                No outstanding balances. Everything is collected!
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3 pb-2 border-b border-[var(--color-border)]">
              Recent Activity
            </h3>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-yuzu)] mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[var(--color-text-primary)] leading-snug">
                        {act.description}
                      </p>
                      <span className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 block">
                        {getRelativeDate(act.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--color-text-secondary)]">
                No recent activity.
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
