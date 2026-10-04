import { Client, Deliverable, Payment, Activity, RateCard } from '../types';

export interface PersistedStoreData {
  clients: Client[];
  deliverables: Deliverable[];
  payments: Payment[];
  activities: Activity[];
  rateCards: RateCard[];
  lastSelectedClientId?: string;
  lastSelectedDeliverableType?: string;
}

const STORAGE_KEY = 'yuzu_freelance_store_v1';

/**
 * Loads the persisted YUZU state from localStorage.
 * Handles malformed data or parsing exceptions gracefully by returning null.
 */
export function loadPersistedState(): PersistedStoreData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Validate structure
    if (
      parsed &&
      Array.isArray(parsed.clients) &&
      Array.isArray(parsed.deliverables) &&
      Array.isArray(parsed.payments) &&
      Array.isArray(parsed.rateCards)
    ) {
      return parsed as PersistedStoreData;
    }

    // Invalid schema, clear and fallback
    console.warn('[YUZU Storage] Corrupt state detected in localStorage. Clearing.');
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch (err) {
    console.warn('[YUZU Storage] Failed to parse localStorage state:', err);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    return null;
  }
}

/**
 * Persists the current YUZU store data to localStorage.
 */
export function savePersistedState(data: PersistedStoreData): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[YUZU Storage] Failed to save state to localStorage:', err);
  }
}

/**
 * Clears persisted state from localStorage.
 */
export function clearPersistedState(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}
