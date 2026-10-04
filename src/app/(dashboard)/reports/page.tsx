"use client";

import React, { useMemo } from 'react';
import { useClients, useDeliverables, usePayments } from '@/hooks/useStore';
import { formatCurrency, formatMonth } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DELIVERABLE_TYPE_LABELS, DeliverableType } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#F6D94E', '#55A878', '#6C8EDB', '#E7A83E', '#D95C5C', '#A78BFA', '#F472B6', '#34D399'];

export default function ReportsPage() {
  const clients = useClients();
  const deliverables = useDeliverables({});
  const payments = usePayments({});

  // Summary Metrics
  const validDeliverables = useMemo(() => deliverables.filter(d => d.status !== 'cancelled'), [deliverables]);
  const totalEarned = useMemo(() => validDeliverables.reduce((s, d) => s + d.amount, 0), [validDeliverables]);
  const totalReceived = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);
  const totalOutstanding = Math.max(0, totalEarned - totalReceived);
  const collectionRate = totalEarned > 0 ? Math.round((totalReceived / totalEarned) * 100) : 0;

  // Breakdown by Deliverable Type
  const typeBreakdown = useMemo(() => {
    const map: Record<string, { type: DeliverableType; label: string; count: number; amount: number }> = {};
    validDeliverables.forEach(d => {
      if (!map[d.type]) {
        map[d.type] = {
          type: d.type,
          label: DELIVERABLE_TYPE_LABELS[d.type] || d.type,
          count: 0,
          amount: 0,
        };
      }
      map[d.type].count += 1;
      map[d.type].amount += d.amount;
    });

    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [validDeliverables]);

  // Client Revenue Ranking
  const topClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, 6);
  }, [clients]);

  // Chart data for client earnings
  const clientChartData = useMemo(() => {
    return topClients.map(c => ({
      name: c.name.length > 12 ? c.name.slice(0, 10) + '...' : c.name,
      earned: c.totalEarned,
      received: c.totalReceived,
    }));
  }, [topClients]);

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <header className="pb-2 border-b border-[var(--color-border)]">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Financial Reports & Analytics
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Deep dive into deliverables, client revenue, and cashflow health
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Total Billed
          </span>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mt-2">
            {formatCurrency(totalEarned)}
          </p>
          <span className="text-xs text-[var(--color-text-secondary)] mt-1 block">
            {validDeliverables.length} deliverables
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Total Collected
          </span>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-success)] mt-2">
            {formatCurrency(totalReceived)}
          </p>
          <span className="text-xs text-[var(--color-text-secondary)] mt-1 block">
            {payments.length} transactions
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Unpaid Balance
          </span>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-warning)] mt-2">
            {formatCurrency(totalOutstanding)}
          </p>
          <span className="text-xs text-[var(--color-text-secondary)] mt-1 block">
            To be collected
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Collection Rate
          </span>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mt-2">
            {collectionRate}%
          </p>
          <div className="w-full bg-[var(--color-surface-muted)] h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-[var(--color-success)] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, collectionRate)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Grid: Client Revenue vs Deliverables Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Client Comparison Chart */}
        <Card className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-[var(--color-text-primary)]">Revenue by Client</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Top performing client relationships</p>
            </div>
            <BarChart3 className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface)', 
                    borderColor: 'var(--color-border)', 
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="earned" name="Earned" fill="#F6D94E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="received" name="Received" fill="#55A878" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Deliverable Types Breakdown */}
        <Card className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-[var(--color-text-primary)]">Deliverable Types</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Revenue contribution by skill</p>
            </div>
            <PieIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </div>

          <div className="space-y-3 pt-2">
            {typeBreakdown.slice(0, 5).map((item, idx) => {
              const pct = totalEarned > 0 ? Math.round((item.amount / totalEarned) * 100) : 0;
              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {item.label}
                    </span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {formatCurrency(item.amount)}
                      <span className="text-xs text-[var(--color-text-secondary)] font-normal ml-1">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-muted)] h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card className="p-6">
        <h3 className="font-semibold text-base text-[var(--color-text-primary)] mb-4">
          Client Health & Outstanding Ledger
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="p-3 font-medium">Client</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Deliverables</th>
                <th className="p-3 font-medium">Total Earned</th>
                <th className="p-3 font-medium">Received</th>
                <th className="p-3 font-medium">Outstanding</th>
                <th className="p-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {topClients.map(client => (
                <tr key={client.id} className="hover:bg-[var(--color-surface-muted)]/40 transition-colors">
                  <td className="p-3 font-semibold text-[var(--color-text-primary)]">{client.name}</td>
                  <td className="p-3">
                    <Badge variant="default" className="text-xs capitalize">{client.type}</Badge>
                  </td>
                  <td className="p-3 text-[var(--color-text-secondary)]">{client.deliverableCount}</td>
                  <td className="p-3 font-medium">{formatCurrency(client.totalEarned)}</td>
                  <td className="p-3 text-[var(--color-success)] font-medium">{formatCurrency(client.totalReceived)}</td>
                  <td className="p-3">
                    <span className={`font-semibold ${client.outstanding > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}`}>
                      {formatCurrency(client.outstanding)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link 
                      href={`/clients/${client.id}`}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center"
                    >
                      View <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
