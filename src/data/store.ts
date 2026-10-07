import { 
  Client, Deliverable, Payment, Activity, RateCard, DashboardStats, 
  OutstandingClient, ClientWithStats, DeliverableStatus, DeliverableType, PaymentMethod, ClientType 
} from '../types';
import { 
  seedClients, seedDeliverables, seedPayments, seedActivities, seedRateCards 
} from './seed';
import { generateId } from '../lib/utils';
import { loadPersistedState, savePersistedState, PersistedStoreData } from '../lib/storage';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../lib/supabase/types';

export interface DeliverableFilters {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: DeliverableType;
  status?: DeliverableStatus;
  search?: string;
}

export interface PaymentFilters {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface StoreData extends PersistedStoreData {}

class YuzuStore {
  private data: StoreData;
  private listeners: Set<() => void>;
  private cloudClient: SupabaseClient<Database> | null = null;
  private activeWorkspaceId: string = 'ws_1';
  private isSyncingCloud: boolean = false;

  constructor(initialData: StoreData) {
    let effectiveData = { ...initialData };
    if (typeof window !== 'undefined') {
      const persisted = loadPersistedState();
      if (persisted) {
        effectiveData = persisted;
      }
    }
    this.data = effectiveData;
    this.listeners = new Set();
  }

  public hydrate(): void {
    if (this.cloudClient && this.activeWorkspaceId !== 'ws_1') {
      this.syncFromCloud();
      return;
    }

    if (typeof window === 'undefined') return;
    const persisted = loadPersistedState();
    if (persisted) {
      this.data = persisted;
      this.notifyListeners();
    }
  }

  private notify() {
    // Only save to offline localStorage if NOT connected to cloud
    if (!this.isCloudConnected()) {
      savePersistedState(this.data);
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    });
  }

  /**
   * Connect store to an authenticated Supabase Cloud workspace
   */
  public async connectCloud(workspaceId: string, supabase: SupabaseClient<Database>): Promise<void> {
    this.cloudClient = supabase;
    this.activeWorkspaceId = workspaceId;
    await this.syncFromCloud();
  }

  /**
   * Disconnect cloud and revert back to local persistence
   */
  public disconnectCloud(): void {
    this.cloudClient = null;
    this.activeWorkspaceId = 'ws_1';
    if (typeof window !== 'undefined') {
      const persisted = loadPersistedState();
      if (persisted) {
        this.data = persisted;
      } else {
        this.data = {
          clients: seedClients,
          deliverables: seedDeliverables,
          payments: seedPayments,
          activities: seedActivities,
          rateCards: seedRateCards,
        };
      }
    }
    this.notifyListeners();
  }

  public isCloudConnected(): boolean {
    return Boolean(this.cloudClient && this.activeWorkspaceId !== 'ws_1');
  }

  public getWorkspaceId(): string {
    return this.activeWorkspaceId;
  }

  /**
   * Syncs latest data from Supabase PostgreSQL
   */
  public async syncFromCloud(): Promise<void> {
    if (!this.cloudClient || this.activeWorkspaceId === 'ws_1' || this.isSyncingCloud) {
      return;
    }

    this.isSyncingCloud = true;
    try {
      const wsId = this.activeWorkspaceId;

      const [
        { data: clientsData },
        { data: rateCardsData },
        { data: deliverablesData },
        { data: paymentsData },
        { data: activitiesData }
      ] = await Promise.all([
        this.cloudClient.from('clients').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
        this.cloudClient.from('rate_cards').select('*').eq('workspace_id', wsId),
        this.cloudClient.from('deliverables').select('*').eq('workspace_id', wsId).order('date', { ascending: false }),
        this.cloudClient.from('payments').select('*').eq('workspace_id', wsId).order('date', { ascending: false }),
        this.cloudClient.from('activities').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }).limit(50),
      ]);

      const mappedClients: Client[] = (clientsData || []).map(c => ({
        id: c.id,
        workspaceId: c.workspace_id,
        name: c.name,
        type: c.type as ClientType,
        email: c.email || undefined,
        phone: c.phone || undefined,
        notes: c.notes || undefined,
        isActive: c.is_active,
        createdAt: c.created_at,
      }));

      const mappedRateCards: RateCard[] = (rateCardsData || []).map(rc => ({
        id: rc.id,
        workspaceId: rc.workspace_id,
        clientId: rc.client_id,
        deliverableType: rc.deliverable_type as DeliverableType,
        rate: Number(rc.rate),
        createdAt: rc.created_at,
      }));

      const mappedDeliverables: Deliverable[] = (deliverablesData || []).map(d => ({
        id: d.id,
        workspaceId: d.workspace_id,
        clientId: d.client_id,
        title: d.title,
        type: d.type as DeliverableType,
        amount: Number(d.amount),
        date: d.date,
        status: d.status as DeliverableStatus,
        notes: d.notes || undefined,
        createdAt: d.created_at,
      }));

      const mappedPayments: Payment[] = (paymentsData || []).map(p => ({
        id: p.id,
        workspaceId: p.workspace_id,
        clientId: p.client_id,
        amount: Number(p.amount),
        date: p.date,
        method: p.method as PaymentMethod,
        reference: p.reference || undefined,
        notes: p.notes || undefined,
        createdAt: p.created_at,
      }));

      const mappedActivities: Activity[] = (activitiesData || []).map(a => ({
        id: a.id,
        workspaceId: a.workspace_id,
        type: a.type as Activity['type'],
        entityId: a.entity_id,
        description: a.description,
        createdAt: a.created_at,
      }));

      // Update in-memory data
      this.data = {
        clients: mappedClients,
        rateCards: mappedRateCards,
        deliverables: mappedDeliverables,
        payments: mappedPayments,
        activities: mappedActivities,
        lastSelectedClientId: this.data.lastSelectedClientId,
        lastSelectedDeliverableType: this.data.lastSelectedDeliverableType,
      };

      this.notify();
    } catch (err) {
      console.error('[YUZU Store] Error syncing from cloud:', err);
    } finally {
      this.isSyncingCloud = false;
    }
  }

  getLastSelection(): { clientId?: string; deliverableType?: string } {
    return {
      clientId: this.data.lastSelectedClientId,
      deliverableType: this.data.lastSelectedDeliverableType,
    };
  }

  setLastSelection(clientId: string, deliverableType: string): void {
    this.data.lastSelectedClientId = clientId;
    this.data.lastSelectedDeliverableType = deliverableType;
    if (!this.isCloudConnected()) {
      savePersistedState(this.data);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getClients(): ClientWithStats[] {
    return this.data.clients.map(client => this.computeClientStats(client));
  }

  getClient(id: string): ClientWithStats | undefined {
    const client = this.data.clients.find(c => c.id === id);
    if (!client) return undefined;
    return this.computeClientStats(client);
  }

  private computeClientStats(client: Client): ClientWithStats {
    const clientDeliverables = this.data.deliverables.filter(d => d.clientId === client.id && d.status !== 'cancelled');
    const clientPayments = this.data.payments.filter(p => p.clientId === client.id);
    
    const totalEarned = clientDeliverables.reduce((sum, d) => sum + d.amount, 0);
    const totalReceived = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      ...client,
      totalEarned,
      totalReceived,
      outstanding: totalEarned - totalReceived,
      deliverableCount: clientDeliverables.length
    };
  }

  getDeliverables(filters?: DeliverableFilters): Deliverable[] {
    let result = [...this.data.deliverables];
    
    if (filters) {
      if (filters.clientId) result = result.filter(d => d.clientId === filters.clientId);
      if (filters.type) result = result.filter(d => d.type === filters.type);
      if (filters.status) result = result.filter(d => d.status === filters.status);
      if (filters.dateFrom) result = result.filter(d => new Date(d.date) >= new Date(filters.dateFrom!));
      if (filters.dateTo) result = result.filter(d => new Date(d.date) <= new Date(filters.dateTo!));
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(d => d.title.toLowerCase().includes(query));
      }
    }
    
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getPayments(filters?: PaymentFilters): Payment[] {
    let result = [...this.data.payments];
    
    if (filters) {
      if (filters.clientId) result = result.filter(p => p.clientId === filters.clientId);
      if (filters.dateFrom) result = result.filter(p => new Date(p.date) >= new Date(filters.dateFrom!));
      if (filters.dateTo) result = result.filter(p => new Date(p.date) <= new Date(filters.dateTo!));
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(p => p.reference?.toLowerCase().includes(query) || p.notes?.toLowerCase().includes(query));
      }
    }
    
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getDashboardStats(month?: number, year?: number): DashboardStats {
    const now = new Date();
    const targetMonth = month !== undefined ? month : now.getMonth();
    const targetYear = year !== undefined ? year : now.getFullYear();

    const validDeliverables = this.data.deliverables.filter(d => d.status !== 'cancelled');
    
    let totalEarnedMonth = 0;
    let totalReceivedMonth = 0;
    let totalEarnedAll = 0;
    let totalReceivedAll = 0;

    validDeliverables.forEach(d => {
      const dDate = new Date(d.date);
      totalEarnedAll += d.amount;
      if (dDate.getMonth() === targetMonth && dDate.getFullYear() === targetYear) {
        totalEarnedMonth += d.amount;
      }
    });

    this.data.payments.forEach(p => {
      const pDate = new Date(p.date);
      totalReceivedAll += p.amount;
      if (pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear) {
        totalReceivedMonth += p.amount;
      }
    });

    // Calculate monthly earnings for last 6 months
    const monthlyEarnings = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetYear, targetMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const mEarned = validDeliverables.filter(dev => {
        const devDate = new Date(dev.date);
        return devDate.getMonth() === m && devDate.getFullYear() === y;
      }).reduce((sum, dev) => sum + dev.amount, 0);
      
      const mReceived = this.data.payments.filter(p => {
        const pDate = new Date(p.date);
        return pDate.getMonth() === m && pDate.getFullYear() === y;
      }).reduce((sum, p) => sum + p.amount, 0);

      monthlyEarnings.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        earned: mEarned,
        received: mReceived
      });
    }

    return {
      totalEarned: totalEarnedMonth,
      totalReceived: totalReceivedMonth,
      outstanding: totalEarnedAll - totalReceivedAll,
      deliverableCount: validDeliverables.length,
      monthlyEarnings
    };
  }

  getOutstandingClients(): OutstandingClient[] {
    const clientsWithStats = this.getClients();
    return clientsWithStats
      .filter(c => c.outstanding > 0)
      .map(c => ({ client: c, outstanding: c.outstanding }))
      .sort((a, b) => b.outstanding - a.outstanding);
  }

  getRateCards(clientId: string): RateCard[] {
    return this.data.rateCards.filter(rc => rc.clientId === clientId);
  }

  getClientDeliverables(clientId: string): Deliverable[] {
    return this.getDeliverables({ clientId });
  }

  getClientPayments(clientId: string): Payment[] {
    return this.getPayments({ clientId });
  }

  getActivities(limit: number = 10): Activity[] {
    return [...this.data.activities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async addDeliverable(data: Omit<Deliverable, 'id' | 'workspaceId' | 'createdAt'>): Promise<Deliverable> {
    const wsId = this.activeWorkspaceId;
    const newDeliverable: Deliverable = {
      ...data,
      id: generateId(),
      workspaceId: wsId,
      createdAt: new Date().toISOString()
    };
    
    const newActivity: Activity = {
      id: generateId(),
      workspaceId: wsId,
      type: 'deliverable_added',
      entityId: newDeliverable.id,
      description: `Added deliverable: ${newDeliverable.title}`,
      createdAt: new Date().toISOString()
    };

    // If Cloud connected, persist first to prevent false success reporting
    if (this.cloudClient && wsId !== 'ws_1') {
      const { error } = await this.cloudClient.from('deliverables').insert({
        id: newDeliverable.id,
        workspace_id: wsId,
        client_id: newDeliverable.clientId,
        title: newDeliverable.title,
        type: newDeliverable.type,
        amount: Number(newDeliverable.amount),
        date: newDeliverable.date,
        status: newDeliverable.status,
        notes: newDeliverable.notes || null,
      });

      if (error) {
        console.error('[YUZU Supabase] Error persisting deliverable:', error);
        throw new Error(error.message || 'Failed to persist deliverable to cloud');
      }

      await this.cloudClient.from('activities').insert({
        id: newActivity.id,
        workspace_id: wsId,
        type: newActivity.type,
        entity_id: newActivity.entityId,
        description: newActivity.description,
      });
    }

    this.data.deliverables = [newDeliverable, ...this.data.deliverables];
    this.data.activities = [newActivity, ...this.data.activities];
    this.notify();

    return newDeliverable;
  }

  async addPayment(data: Omit<Payment, 'id' | 'workspaceId' | 'createdAt'>): Promise<Payment> {
    const wsId = this.activeWorkspaceId;
    const newPayment: Payment = {
      ...data,
      id: generateId(),
      workspaceId: wsId,
      createdAt: new Date().toISOString()
    };
    
    const newActivity: Activity = {
      id: generateId(),
      workspaceId: wsId,
      type: 'payment_received',
      entityId: newPayment.id,
      description: `Received payment of ₹${newPayment.amount.toLocaleString('en-IN')}`,
      createdAt: new Date().toISOString()
    };

    // If Cloud connected, persist first to prevent false success reporting
    if (this.cloudClient && wsId !== 'ws_1') {
      const { error } = await this.cloudClient.from('payments').insert({
        id: newPayment.id,
        workspace_id: wsId,
        client_id: newPayment.clientId,
        amount: Number(newPayment.amount),
        method: newPayment.method,
        date: newPayment.date,
        reference: newPayment.reference || null,
        notes: newPayment.notes || null,
      });

      if (error) {
        console.error('[YUZU Supabase] Error persisting payment:', error);
        throw new Error(error.message || 'Failed to persist payment to cloud');
      }

      await this.cloudClient.from('activities').insert({
        id: newActivity.id,
        workspace_id: wsId,
        type: newActivity.type,
        entity_id: newActivity.entityId,
        description: newActivity.description,
      });
    }

    this.data.payments = [newPayment, ...this.data.payments];
    this.data.activities = [newActivity, ...this.data.activities];
    this.notify();

    return newPayment;
  }

  async addClient(data: Omit<Client, 'id' | 'workspaceId' | 'createdAt'>): Promise<Client> {
    const wsId = this.activeWorkspaceId;
    const newClient: Client = {
      ...data,
      id: generateId(),
      workspaceId: wsId,
      createdAt: new Date().toISOString()
    };
    
    const newActivity: Activity = {
      id: generateId(),
      workspaceId: wsId,
      type: 'client_added',
      entityId: newClient.id,
      description: `Added client: ${newClient.name}`,
      createdAt: new Date().toISOString()
    };

    // If Cloud connected, persist first to prevent false success reporting
    if (this.cloudClient && wsId !== 'ws_1') {
      const { error } = await this.cloudClient.from('clients').insert({
        id: newClient.id,
        workspace_id: wsId,
        name: newClient.name,
        type: newClient.type,
        email: newClient.email || null,
        phone: newClient.phone || null,
        notes: newClient.notes || null,
        is_active: newClient.isActive ?? true,
      });

      if (error) {
        console.error('[YUZU Supabase] Error persisting client:', error);
        throw new Error(error.message || 'Failed to persist client to cloud');
      }

      await this.cloudClient.from('activities').insert({
        id: newActivity.id,
        workspace_id: wsId,
        type: newActivity.type,
        entity_id: newActivity.entityId,
        description: newActivity.description,
      });
    }

    this.data.clients = [...this.data.clients, newClient];
    this.data.activities = [newActivity, ...this.data.activities];
    this.notify();

    return newClient;
  }

  async updateDeliverable(id: string, data: Partial<Deliverable>): Promise<void> {
    if (this.cloudClient && this.activeWorkspaceId !== 'ws_1') {
      const updatePayload: Database['public']['Tables']['deliverables']['Update'] = {};
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.type !== undefined) updatePayload.type = data.type;
      if (data.amount !== undefined) updatePayload.amount = Number(data.amount);
      if (data.date !== undefined) updatePayload.date = data.date;
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.clientId !== undefined) updatePayload.client_id = data.clientId;
      if (data.notes !== undefined) updatePayload.notes = data.notes;

      const { error } = await this.cloudClient
        .from('deliverables')
        .update(updatePayload)
        .eq('id', id)
        .eq('workspace_id', this.activeWorkspaceId);

      if (error) {
        console.error('[YUZU Supabase] Error updating deliverable:', error);
        throw new Error(error.message || 'Failed to update deliverable in cloud');
      }
    }

    this.data.deliverables = this.data.deliverables.map(d => 
      d.id === id ? { ...d, ...data } : d
    );
    this.notify();
  }

  async deleteDeliverable(id: string): Promise<void> {
    if (this.cloudClient && this.activeWorkspaceId !== 'ws_1') {
      const { error } = await this.cloudClient
        .from('deliverables')
        .delete()
        .eq('id', id)
        .eq('workspace_id', this.activeWorkspaceId);

      if (error) {
        console.error('[YUZU Supabase] Error deleting deliverable:', error);
        throw new Error(error.message || 'Failed to delete deliverable in cloud');
      }
    }

    this.data.deliverables = this.data.deliverables.filter(d => d.id !== id);
    this.notify();
  }

  async updatePayment(id: string, data: Partial<Payment>): Promise<void> {
    if (this.cloudClient && this.activeWorkspaceId !== 'ws_1') {
      const updatePayload: Database['public']['Tables']['payments']['Update'] = {};
      if (data.clientId !== undefined) updatePayload.client_id = data.clientId;
      if (data.amount !== undefined) updatePayload.amount = Number(data.amount);
      if (data.method !== undefined) updatePayload.method = data.method;
      if (data.date !== undefined) updatePayload.date = data.date;
      if (data.reference !== undefined) updatePayload.reference = data.reference || null;
      if (data.notes !== undefined) updatePayload.notes = data.notes || null;

      const { error } = await this.cloudClient
        .from('payments')
        .update(updatePayload)
        .eq('id', id)
        .eq('workspace_id', this.activeWorkspaceId);

      if (error) {
        console.error('[YUZU Supabase] Error updating payment:', error);
        throw new Error(error.message || 'Failed to update payment in cloud');
      }
    }

    this.data.payments = this.data.payments.map(p => 
      p.id === id ? { ...p, ...data } : p
    );
    this.notify();
  }

  async deletePayment(id: string): Promise<void> {
    if (this.cloudClient && this.activeWorkspaceId !== 'ws_1') {
      const { error } = await this.cloudClient
        .from('payments')
        .delete()
        .eq('id', id)
        .eq('workspace_id', this.activeWorkspaceId);

      if (error) {
        console.error('[YUZU Supabase] Error deleting payment:', error);
        throw new Error(error.message || 'Failed to delete payment in cloud');
      }
    }

    this.data.payments = this.data.payments.filter(p => p.id !== id);
    this.notify();
  }

  search(query: string) {
    const q = query.toLowerCase();
    return {
      clients: this.data.clients.filter(c => c.name.toLowerCase().includes(q)),
      deliverables: this.data.deliverables.filter(d => d.title.toLowerCase().includes(q)),
      payments: this.data.payments.filter(p => p.reference?.toLowerCase().includes(q))
    };
  }
}

export const store = new YuzuStore({
  clients: seedClients,
  deliverables: seedDeliverables,
  payments: seedPayments,
  activities: seedActivities,
  rateCards: seedRateCards
});
