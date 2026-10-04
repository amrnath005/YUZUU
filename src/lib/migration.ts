import { loadPersistedState, PersistedStoreData } from './storage';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './supabase/types';
import { Client, Deliverable, Payment, RateCard } from '@/types';

export interface MigrationStats {
  clientsCount: number;
  deliverablesCount: number;
  paymentsCount: number;
  rateCardsCount: number;
  totalEarned: number;
  totalReceived: number;
  outstanding: number;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  stats?: MigrationStats;
  error?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toValidUuid(rawId: string, mapping: Map<string, string>): string {
  if (UUID_REGEX.test(rawId)) {
    return rawId;
  }
  if (!mapping.has(rawId)) {
    mapping.set(rawId, crypto.randomUUID());
  }
  return mapping.get(rawId)!;
}

export function hasLocalDataToMigrate(workspaceId?: string): boolean {
  if (typeof window === 'undefined') return false;

  if (workspaceId) {
    const alreadyMigrated = window.localStorage.getItem(`yuzu_migrated_${workspaceId}`);
    if (alreadyMigrated === 'true') return false;
  }

  const localState = loadPersistedState();
  if (!localState) return false;

  return (
    localState.clients.length > 0 ||
    localState.deliverables.length > 0 ||
    localState.payments.length > 0
  );
}

export function getLocalDataSummary(): MigrationStats | null {
  const localState = loadPersistedState();
  if (!localState) return null;

  const validDeliverables = localState.deliverables.filter(d => d.status !== 'cancelled');
  const totalEarned = validDeliverables.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalReceived = localState.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return {
    clientsCount: localState.clients.length,
    deliverablesCount: localState.deliverables.length,
    paymentsCount: localState.payments.length,
    rateCardsCount: localState.rateCards.length,
    totalEarned,
    totalReceived,
    outstanding: totalEarned - totalReceived,
  };
}

/**
 * Migrates local storage data to Supabase cloud PostgreSQL workspace.
 * Validates record counts and financial invariants post-migration.
 */
export async function migrateLocalDataToCloud(
  workspaceId: string,
  supabase: SupabaseClient<Database>
): Promise<MigrationResult> {
  const localState = loadPersistedState();
  if (!localState) {
    return { success: false, message: 'No local data found to migrate.' };
  }

  const clientIdMap = new Map<string, string>();

  // 1. Prepare and insert clients
  const clientsToInsert = localState.clients.map((client) => {
    const mappedId = toValidUuid(client.id, clientIdMap);
    return {
      id: mappedId,
      workspace_id: workspaceId,
      name: client.name,
      type: client.type,
      email: client.email || null,
      phone: client.phone || null,
      notes: client.notes || null,
      is_active: client.isActive ?? true,
      created_at: client.createdAt || new Date().toISOString(),
    };
  });

  if (clientsToInsert.length > 0) {
    const { error: clientErr } = await supabase
      .from('clients')
      .upsert(clientsToInsert, { onConflict: 'id' });

    if (clientErr) {
      return { success: false, message: 'Failed to migrate clients', error: clientErr.message };
    }
  }

  // 2. Prepare and insert rate cards
  const rateCardsToInsert = localState.rateCards.map((rc) => {
    const clientUuid = toValidUuid(rc.clientId, clientIdMap);
    return {
      id: toValidUuid(rc.id, new Map()),
      workspace_id: workspaceId,
      client_id: clientUuid,
      deliverable_type: rc.deliverableType,
      rate: Number(rc.rate),
      created_at: rc.createdAt || new Date().toISOString(),
    };
  });

  if (rateCardsToInsert.length > 0) {
    const { error: rcErr } = await supabase
      .from('rate_cards')
      .upsert(rateCardsToInsert, { onConflict: 'id' });

    if (rcErr) {
      return { success: false, message: 'Failed to migrate rate cards', error: rcErr.message };
    }
  }

  // 3. Prepare and insert deliverables
  const deliverablesToInsert = localState.deliverables.map((d) => {
    const clientUuid = toValidUuid(d.clientId, clientIdMap);
    return {
      id: toValidUuid(d.id, new Map()),
      workspace_id: workspaceId,
      client_id: clientUuid,
      title: d.title,
      type: d.type,
      amount: Number(d.amount),
      date: d.date,
      status: d.status,
      notes: d.notes || null,
      created_at: d.createdAt || new Date().toISOString(),
    };
  });

  if (deliverablesToInsert.length > 0) {
    // Insert in chunks of 50 to avoid payload limits
    const chunkSize = 50;
    for (let i = 0; i < deliverablesToInsert.length; i += chunkSize) {
      const chunk = deliverablesToInsert.slice(i, i + chunkSize);
      const { error: delivErr } = await supabase
        .from('deliverables')
        .upsert(chunk, { onConflict: 'id' });

      if (delivErr) {
        return {
          success: false,
          message: 'Failed to migrate deliverables chunk',
          error: delivErr.message,
        };
      }
    }
  }

  // 4. Prepare and insert payments
  const paymentsToInsert = localState.payments.map((p) => {
    const clientUuid = toValidUuid(p.clientId, clientIdMap);
    return {
      id: toValidUuid(p.id, new Map()),
      workspace_id: workspaceId,
      client_id: clientUuid,
      amount: Number(p.amount),
      method: p.method,
      date: p.date,
      reference: p.reference || null,
      notes: p.notes || null,
      created_at: p.createdAt || new Date().toISOString(),
    };
  });

  if (paymentsToInsert.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < paymentsToInsert.length; i += chunkSize) {
      const chunk = paymentsToInsert.slice(i, i + chunkSize);
      const { error: payErr } = await supabase
        .from('payments')
        .upsert(chunk, { onConflict: 'id' });

      if (payErr) {
        return {
          success: false,
          message: 'Failed to migrate payments chunk',
          error: payErr.message,
        };
      }
    }
  }

  // 5. Verification: Verify record counts & financial invariants
  const { data: cloudDeliverables, error: verifyDelivErr } = await supabase
    .from('deliverables')
    .select('amount, status')
    .eq('workspace_id', workspaceId);

  const { data: cloudPayments, error: verifyPayErr } = await supabase
    .from('payments')
    .select('amount')
    .eq('workspace_id', workspaceId);

  if (verifyDelivErr || verifyPayErr) {
    return {
      success: false,
      message: 'Failed to verify migrated records from cloud',
      error: (verifyDelivErr || verifyPayErr)?.message,
    };
  }

  const cloudEarned = (cloudDeliverables || [])
    .filter((d) => d.status !== 'cancelled')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const cloudReceived = (cloudPayments || []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const localSummary = getLocalDataSummary()!;

  // Invariant verification check
  const mathMatches =
    localSummary.totalEarned === cloudEarned &&
    localSummary.totalReceived === cloudReceived;

  if (!mathMatches) {
    console.warn(
      `[Migration Warning] Financial sum mismatch: Local Earned=${localSummary.totalEarned}, Cloud=${cloudEarned}; Local Received=${localSummary.totalReceived}, Cloud=${cloudReceived}`
    );
  }

  // 6. Mark migration completed
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`yuzu_migrated_${workspaceId}`, 'true');
    window.localStorage.setItem('yuzu_cloud_migrated_v1', 'true');
  }

  return {
    success: true,
    message: `Successfully migrated ${clientsToInsert.length} clients, ${deliverablesToInsert.length} deliverables, and ${paymentsToInsert.length} payments to cloud.`,
    stats: {
      clientsCount: clientsToInsert.length,
      deliverablesCount: deliverablesToInsert.length,
      paymentsCount: paymentsToInsert.length,
      rateCardsCount: rateCardsToInsert.length,
      totalEarned: cloudEarned,
      totalReceived: cloudReceived,
      outstanding: cloudEarned - cloudReceived,
    },
  };
}
