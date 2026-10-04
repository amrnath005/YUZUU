import { 
  User, Workspace, Client, RateCard, Deliverable, Payment, Activity, 
  ClientType, DeliverableType, PaymentMethod, DeliverableStatus 
} from '../types';

export const seedUser: User = {
  id: 'u_1',
  name: 'Sahil',
  email: 'sahil@yuzu.app',
  createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
};

export const seedWorkspace: Workspace = {
  id: 'ws_1',
  name: 'Sahil Freelance',
  ownerId: 'u_1',
  currency: 'INR',
  createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
};

export const seedClients: Client[] = [
  { id: 'c_1', workspaceId: 'ws_1', name: 'Nova Media', type: 'agency', email: 'hello@novamedia.in', isActive: true, createdAt: new Date('2026-02-15T00:00:00Z').toISOString() },
  { id: 'c_2', workspaceId: 'ws_1', name: 'Pixel House', type: 'agency', email: 'contact@pixelhouse.co.in', isActive: true, createdAt: new Date('2026-03-10T00:00:00Z').toISOString() },
  { id: 'c_3', workspaceId: 'ws_1', name: 'Arjun Creates', type: 'creator', email: 'arjun@creates.com', isActive: true, createdAt: new Date('2026-04-22T00:00:00Z').toISOString() },
  { id: 'c_4', workspaceId: 'ws_1', name: 'Creator Labs', type: 'business', email: 'team@creatorlabs.in', isActive: true, createdAt: new Date('2026-05-05T00:00:00Z').toISOString() },
  { id: 'c_5', workspaceId: 'ws_1', name: 'Studio 47', type: 'startup', email: 'hi@studio47.in', isActive: true, createdAt: new Date('2026-06-18T00:00:00Z').toISOString() },
  { id: 'c_6', workspaceId: 'ws_1', name: 'FrameForge', type: 'agency', email: 'partners@frameforge.com', isActive: true, createdAt: new Date('2026-07-02T00:00:00Z').toISOString() },
  { id: 'c_7', workspaceId: 'ws_1', name: 'The Content Co.', type: 'business', email: 'projects@contentco.in', isActive: true, createdAt: new Date('2026-08-11T00:00:00Z').toISOString() },
  { id: 'c_8', workspaceId: 'ws_1', name: 'Riya Creates', type: 'individual', email: 'riya.designs@gmail.com', isActive: true, createdAt: new Date('2026-09-01T00:00:00Z').toISOString() },
];

export const seedRateCards: RateCard[] = [
  { id: 'rc_1', workspaceId: 'ws_1', clientId: 'c_1', deliverableType: 'instagram-reel', rate: 1500, createdAt: new Date('2026-02-15T00:00:00Z').toISOString() },
  { id: 'rc_2', workspaceId: 'ws_1', clientId: 'c_1', deliverableType: 'youtube-video', rate: 5000, createdAt: new Date('2026-02-15T00:00:00Z').toISOString() },
  { id: 'rc_3', workspaceId: 'ws_1', clientId: 'c_2', deliverableType: 'thumbnail', rate: 700, createdAt: new Date('2026-03-10T00:00:00Z').toISOString() },
  { id: 'rc_4', workspaceId: 'ws_1', clientId: 'c_2', deliverableType: 'design', rate: 2000, createdAt: new Date('2026-03-10T00:00:00Z').toISOString() },
  { id: 'rc_5', workspaceId: 'ws_1', clientId: 'c_3', deliverableType: 'youtube-video', rate: 6000, createdAt: new Date('2026-04-22T00:00:00Z').toISOString() },
  { id: 'rc_6', workspaceId: 'ws_1', clientId: 'c_3', deliverableType: 'instagram-reel', rate: 2000, createdAt: new Date('2026-04-22T00:00:00Z').toISOString() },
  { id: 'rc_7', workspaceId: 'ws_1', clientId: 'c_4', deliverableType: 'advertisement', rate: 8000, createdAt: new Date('2026-05-05T00:00:00Z').toISOString() },
  { id: 'rc_8', workspaceId: 'ws_1', clientId: 'c_5', deliverableType: 'motion-graphic', rate: 6000, createdAt: new Date('2026-06-18T00:00:00Z').toISOString() },
  { id: 'rc_9', workspaceId: 'ws_1', clientId: 'c_6', deliverableType: 'youtube-video', rate: 4500, createdAt: new Date('2026-07-02T00:00:00Z').toISOString() },
  { id: 'rc_10', workspaceId: 'ws_1', clientId: 'c_7', deliverableType: 'design', rate: 2500, createdAt: new Date('2026-08-11T00:00:00Z').toISOString() },
  { id: 'rc_11', workspaceId: 'ws_1', clientId: 'c_8', deliverableType: 'thumbnail', rate: 800, createdAt: new Date('2026-09-01T00:00:00Z').toISOString() },
];

export const seedDeliverables: Deliverable[] = [];
export const seedPayments: Payment[] = [];
export const seedActivities: Activity[] = [];

// Helper to generate deliverables
let delivIdCounter = 1;
function createDeliverable(clientId: string, type: DeliverableType, amount: number, title: string, status: DeliverableStatus, dateStr: string) {
  const d = {
    id: `d_${delivIdCounter++}`,
    workspaceId: 'ws_1',
    clientId,
    title,
    type,
    amount,
    date: new Date(dateStr).toISOString(),
    status,
    createdAt: new Date(dateStr).toISOString(),
  };
  seedDeliverables.push(d);
  
  seedActivities.push({
    id: `act_d_${d.id}`,
    workspaceId: 'ws_1',
    type: 'deliverable_added',
    entityId: d.id,
    description: `Added deliverable: ${title}`,
    createdAt: new Date(dateStr).toISOString()
  });
  
  return d;
}

// Generate ~150 deliverables across Jul - Oct 2026
const clients = ['c_1', 'c_2', 'c_3', 'c_4', 'c_5', 'c_6', 'c_7', 'c_8'];
const startTime = new Date('2026-07-01T00:00:00Z').getTime();
const endTime = new Date('2026-10-04T00:00:00Z').getTime();

// For realistic totals, we'll track earnings per client
const clientEarned: Record<string, number> = {};
clients.forEach(c => clientEarned[c] = 0);

for(let i=0; i<150; i++) {
  const c = clients[i % clients.length];
  const randTime = startTime + Math.random() * (endTime - startTime);
  const dDate = new Date(randTime).toISOString();
  
  let type: DeliverableType = 'instagram-reel';
  let amount = 1500;
  let title = 'Project Content';
  
  if (c === 'c_1') {
    type = i % 2 === 0 ? 'instagram-reel' : 'youtube-video';
    amount = type === 'instagram-reel' ? 1500 : 5000;
    title = type === 'instagram-reel' ? `Product Reel ${i}` : `Brand Video ${i}`;
  } else if (c === 'c_2') {
    type = i % 2 === 0 ? 'thumbnail' : 'design';
    amount = type === 'thumbnail' ? 700 : 2000;
    title = type === 'thumbnail' ? `Video Thumb ${i}` : `Social Graphic ${i}`;
  } else if (c === 'c_3') {
    type = 'youtube-video';
    amount = 6000;
    title = `Vlog Edit ${i}`;
  } else if (c === 'c_4') {
    type = 'advertisement';
    amount = 8000;
    title = `Promo Campaign ${i}`;
  } else if (c === 'c_5') {
    type = 'motion-graphic';
    amount = 6000;
    title = `UI Animation ${i}`;
  } else if (c === 'c_6') {
    type = 'youtube-video';
    amount = 4500;
    title = `Interview Edit ${i}`;
  } else if (c === 'c_7') {
    type = 'design';
    amount = 2500;
    title = `Carousel Post ${i}`;
  } else if (c === 'c_8') {
    type = 'thumbnail';
    amount = 800;
    title = `Clickable Thumb ${i}`;
  }

  const randStatus = Math.random();
  const status: DeliverableStatus = randStatus > 0.85 ? (randStatus > 0.95 ? 'cancelled' : 'revision') : (randStatus > 0.7 ? 'in-progress' : 'delivered');
  
  createDeliverable(c, type, amount, title, status, dDate);
  
  if (status !== 'cancelled') {
    clientEarned[c] += amount;
  }
}

let payIdCounter = 1;
function createPayment(clientId: string, amount: number, dateStr: string, method: PaymentMethod = 'upi') {
  const p = {
    id: `p_${payIdCounter++}`,
    workspaceId: 'ws_1',
    clientId,
    amount,
    date: new Date(dateStr).toISOString(),
    method,
    reference: `${method.toUpperCase()}-TXN-${Math.floor(Math.random() * 100000)}`,
    createdAt: new Date(dateStr).toISOString(),
  };
  seedPayments.push(p);
  
  seedActivities.push({
    id: `act_p_${p.id}`,
    workspaceId: 'ws_1',
    type: 'payment_received',
    entityId: p.id,
    description: `Received payment of ₹${amount}`,
    createdAt: new Date(dateStr).toISOString()
  });
}

// Add payments based on earnings
Object.keys(clientEarned).forEach(cId => {
  let targetOutstanding = 0;
  if (cId === 'c_1') targetOutstanding = 8000;
  else if (cId === 'c_3') targetOutstanding = 12000;
  else if (cId === 'c_4') targetOutstanding = 10000;
  else if (Math.random() > 0.5) targetOutstanding = Math.floor(clientEarned[cId] * 0.3); // partial
  
  const toPay = Math.max(0, clientEarned[cId] - targetOutstanding);
  
  if (toPay > 0) {
    // split into 2-4 payments
    const numPayments = 1 + Math.floor(Math.random() * 3);
    const chunk = Math.floor(toPay / numPayments);
    
    for (let j = 0; j < numPayments; j++) {
      const pTime = startTime + Math.random() * (endTime - startTime);
      const isLast = j === numPayments - 1;
      const amt = isLast ? (toPay - chunk * (numPayments - 1)) : chunk;
      
      const methods: PaymentMethod[] = ['upi', 'bank-transfer', 'cash', 'card'];
      const method = methods[Math.floor(Math.random() * methods.length)];
      
      createPayment(cId, amt, new Date(pTime).toISOString(), method);
    }
  }
});

seedActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
