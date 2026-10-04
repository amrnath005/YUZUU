import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';
import { 
  seedClients, 
  seedDeliverables, 
  seedPayments, 
  seedRateCards 
} from '@/data/seed';

/**
 * Development-only utility to populate a specific workspace with demo seed data in Supabase.
 * Strictly requires explicit invocation with a target workspaceId.
 */
export async function seedCloudWorkspace(
  workspaceId: string,
  supabase: SupabaseClient<Database>
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const clientIdMap = new Map<string, string>();

    // 1. Insert seed clients
    const clientsToInsert = seedClients.map(c => {
      const newUuid = crypto.randomUUID();
      clientIdMap.set(c.id, newUuid);
      return {
        id: newUuid,
        workspace_id: workspaceId,
        name: c.name,
        type: c.type,
        email: c.email || null,
        phone: c.phone || null,
        notes: c.notes || null,
        is_active: c.isActive,
        created_at: c.createdAt,
      };
    });

    const { error: clientErr } = await supabase.from('clients').upsert(clientsToInsert);
    if (clientErr) throw clientErr;

    // 2. Insert rate cards
    const rateCardsToInsert = seedRateCards.map(rc => ({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      client_id: clientIdMap.get(rc.clientId)!,
      deliverable_type: rc.deliverableType,
      rate: Number(rc.rate),
      created_at: rc.createdAt,
    }));

    const { error: rcErr } = await supabase.from('rate_cards').upsert(rateCardsToInsert);
    if (rcErr) throw rcErr;

    // 3. Insert deliverables
    const deliverablesToInsert = seedDeliverables.map(d => ({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      client_id: clientIdMap.get(d.clientId)!,
      title: d.title,
      type: d.type,
      amount: Number(d.amount),
      date: d.date,
      status: d.status,
      notes: d.notes || null,
      created_at: d.createdAt,
    }));

    for (let i = 0; i < deliverablesToInsert.length; i += 50) {
      const chunk = deliverablesToInsert.slice(i, i + 50);
      const { error: delivErr } = await supabase.from('deliverables').upsert(chunk);
      if (delivErr) throw delivErr;
    }

    // 4. Insert payments
    const paymentsToInsert = seedPayments.map(p => ({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      client_id: clientIdMap.get(p.clientId)!,
      amount: Number(p.amount),
      method: p.method,
      date: p.date,
      reference: p.reference || null,
      notes: p.notes || null,
      created_at: p.createdAt,
    }));

    for (let i = 0; i < paymentsToInsert.length; i += 50) {
      const chunk = paymentsToInsert.slice(i, i + 50);
      const { error: payErr } = await supabase.from('payments').upsert(chunk);
      if (payErr) throw payErr;
    }

    return {
      success: true,
      message: `Successfully seeded workspace ${workspaceId} with ${seedDeliverables.length} deliverables.`,
      count: seedDeliverables.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to seed workspace',
    };
  }
}
