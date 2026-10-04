export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  currency: string;
  createdAt: string;
}

export type ClientType = 'agency' | 'creator' | 'business' | 'startup' | 'individual';

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  isActive: boolean;
}

export type DeliverableType = 'instagram-reel' | 'youtube-video' | 'short' | 'advertisement' | 'thumbnail' | 'motion-graphic' | 'design' | 'development' | 'other';

export interface RateCard {
  id: string;
  workspaceId: string;
  clientId: string;
  deliverableType: DeliverableType;
  rate: number;
  createdAt: string;
}

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  'instagram-reel': 'Instagram Reel',
  'youtube-video': 'YouTube Video',
  'short': 'Short',
  'advertisement': 'Advertisement',
  'thumbnail': 'Thumbnail',
  'motion-graphic': 'Motion Graphic',
  'design': 'Design',
  'development': 'Development',
  'other': 'Other'
};

export type DeliverableStatus = 'in-progress' | 'delivered' | 'revision' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface Deliverable {
  id: string;
  workspaceId: string;
  clientId: string;
  title: string;
  type: DeliverableType;
  amount: number;
  date: string;
  status: DeliverableStatus;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = 'upi' | 'bank-transfer' | 'cash' | 'card' | 'other';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  'upi': 'UPI',
  'bank-transfer': 'Bank Transfer',
  'cash': 'Cash',
  'card': 'Card',
  'other': 'Other'
};

export interface Payment {
  id: string;
  workspaceId: string;
  clientId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface Statement {
  id: string;
  workspaceId: string;
  clientId: string;
  month: number;
  year: number;
  generatedAt: string;
}

export interface Activity {
  id: string;
  workspaceId: string;
  type: 'deliverable_added' | 'payment_received' | 'client_added' | 'statement_generated';
  entityId: string;
  description: string;
  createdAt: string;
}

export interface DashboardStats {
  totalEarned: number;
  totalReceived: number;
  outstanding: number;
  deliverableCount: number;
  monthlyEarnings: MonthlyEarning[];
}

export interface MonthlyEarning {
  month: string;
  earned: number;
  received: number;
}

export interface ClientWithStats extends Client {
  totalEarned: number;
  totalReceived: number;
  outstanding: number;
  deliverableCount: number;
}

export interface OutstandingClient {
  client: Client;
  outstanding: number;
}
