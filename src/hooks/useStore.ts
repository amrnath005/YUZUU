"use client";

import { useState, useEffect, useCallback } from 'react';
import { store } from '../data/store';
import { 
  ClientWithStats, Deliverable, Payment, DashboardStats, 
  OutstandingClient, Activity, RateCard 
} from '../types';
import { DeliverableFilters, PaymentFilters } from '../data/store';

// Generic hook that rerenders when store changes
export function useStore<T>(selector: () => T): T {
  const [state, setState] = useState(selector());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(selector());
    });
    return unsubscribe;
  }, [selector]);

  return state;
}

export function useClients(): ClientWithStats[] {
  const selector = useCallback(() => store.getClients(), []);
  return useStore(selector);
}

export function useClient(id: string): ClientWithStats | undefined {
  const selector = useCallback(() => store.getClient(id), [id]);
  return useStore(selector);
}

export function useDeliverables(filters?: DeliverableFilters): Deliverable[] {
  const filterStr = JSON.stringify(filters);
  const selector = useCallback(() => store.getDeliverables(filters), [filterStr]);
  return useStore(selector);
}

export function usePayments(filters?: PaymentFilters): Payment[] {
  const filterStr = JSON.stringify(filters);
  const selector = useCallback(() => store.getPayments(filters), [filterStr]);
  return useStore(selector);
}

export function useDashboardStats(month?: number, year?: number): DashboardStats {
  const selector = useCallback(() => store.getDashboardStats(month, year), [month, year]);
  return useStore(selector);
}

export function useOutstandingClients(): OutstandingClient[] {
  const selector = useCallback(() => store.getOutstandingClients(), []);
  return useStore(selector);
}

export function useActivities(limit: number = 10): Activity[] {
  const selector = useCallback(() => store.getActivities(limit), [limit]);
  return useStore(selector);
}

export function useRateCards(clientId: string): RateCard[] {
  const selector = useCallback(() => store.getRateCards(clientId), [clientId]);
  return useStore(selector);
}
