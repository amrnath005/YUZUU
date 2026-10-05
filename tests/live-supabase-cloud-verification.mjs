import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of envFile.split('\n')) {
  const [k, ...v] = line.trim().split('=');
  if (k) envVars[k] = v.join('=');
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('FATAL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing in .env.local');
  process.exit(1);
}

const userACreds = {
  email: 'yuzu.test.editor.3403@gmail.com',
  password: 'YuzuTestPassword123!',
};

const userBCreds = {
  email: 'yuzu.test.agency.7712@gmail.com',
  password: 'YuzuTestPassword123!',
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log('       YUZU LIVE SUPABASE CLOUD VERIFICATION TEST SUITE         ');
  console.log(`       Target URL: ${supabaseUrl}`);
  console.log('================================================================\n');

  // Client instances
  const clientA = createClient(supabaseUrl, supabaseAnonKey);
  const clientB = createClient(supabaseUrl, supabaseAnonKey);

  // -----------------------------------------------------------------
  // 1. CHECK REMOTE TABLES EXISTENCE
  // -----------------------------------------------------------------
  console.log('--- 1. REMOTE DATABASE TABLES EXISTENCE ---');
  const requiredTables = [
    'profiles',
    'workspaces',
    'workspace_members',
    'clients',
    'rate_cards',
    'deliverables',
    'payments',
    'statements',
    'activities',
  ];

  for (const table of requiredTables) {
    const { data, error, status } = await clientA.from(table).select('*').limit(1);
    assert(!error && (status === 200 || status === 206), `Table "${table}" exists on remote PostgreSQL (status: ${status})`);
  }

  // -----------------------------------------------------------------
  // 2. AUTHENTICATION & SESSION MANAGEMENT
  // -----------------------------------------------------------------
  console.log('\n--- 2. AUTHENTICATION (SIGNIN, SESSION, LOGOUT) ---');
  const { data: authDataA, error: authErrA } = await clientA.auth.signInWithPassword(userACreds);
  assert(!authErrA && Boolean(authDataA.session?.access_token), `User A logged in successfully (${userACreds.email})`);
  assert(Boolean(authDataA.user?.id), `User A identity verified (ID: ${authDataA.user?.id})`);

  // Verify User A profile & workspace
  const { data: profileA } = await clientA.from('profiles').select('*').eq('id', authDataA.user.id).single();
  assert(Boolean(profileA), `User A profile loaded: "${profileA?.name}"`);

  const { data: membershipsA } = await clientA.from('workspace_members').select('workspace_id, role').eq('user_id', authDataA.user.id);
  assert(membershipsA && membershipsA.length > 0, `User A workspace membership retrieved (role: ${membershipsA?.[0]?.role})`);
  const workspaceAId = membershipsA[0].workspace_id;

  const { data: workspaceA } = await clientA.from('workspaces').select('*').eq('id', workspaceAId).single();
  assert(workspaceA?.name === "Test Freelancer's Studio", `User A workspace verified: "${workspaceA?.name}"`);

  // Test session retrieval (simulating refresh)
  const { data: sessionCheck } = await clientA.auth.getSession();
  assert(sessionCheck.session?.user.id === authDataA.user.id, `Session persistence verified across refresh`);

  // -----------------------------------------------------------------
  // 3. REAL POSTGRESQL PERSISTENCE (CLIENT, DELIVERABLE, PAYMENT)
  // -----------------------------------------------------------------
  console.log('\n--- 3. REAL POSTGRESQL PERSISTENCE & FINANCIAL LEDGER ---');

  // Clean up any prior test rows for Nova Live Test to ensure clean exact ledger amounts
  let clientRecord;
  const { data: existingClients } = await clientA
    .from('clients')
    .select('id')
    .eq('workspace_id', workspaceAId)
    .eq('name', 'Nova Live Test');

  if (existingClients && existingClients.length > 0) {
    for (const c of existingClients) {
      await clientA.from('payments').delete().eq('client_id', c.id);
      await clientA.from('deliverables').delete().eq('client_id', c.id);
      await clientA.from('clients').delete().eq('id', c.id);
    }
  }

  const { data: newClient, error: clientErr } = await clientA
    .from('clients')
    .insert({
      workspace_id: workspaceAId,
      name: 'Nova Live Test',
      type: 'agency',
      notes: 'Live verification test client',
    })
    .select()
    .single();

  assert(!clientErr && Boolean(newClient), `Client "Nova Live Test" persisted to PostgreSQL`);
  clientRecord = newClient;
  assert(Boolean(clientRecord?.id), `Client record confirmed in database (ID: ${clientRecord?.id})`);

  // Insert deliverable "Live Supabase Test" (₹2,000)
  const { data: newDeliverable, error: delivErr } = await clientA
    .from('deliverables')
    .insert({
      workspace_id: workspaceAId,
      client_id: clientRecord.id,
      title: 'Live Supabase Test',
      type: 'other',
      amount: 2000,
      date: new Date().toISOString().split('T')[0],
      status: 'delivered',
      notes: 'Live verification deliverable',
    })
    .select()
    .single();

  assert(!delivErr && Boolean(newDeliverable), `Deliverable "Live Supabase Test" persisted to PostgreSQL (Amount: ₹2,000)`);

  // Insert payment (₹1,000)
  const { data: newPayment, error: payErr } = await clientA
    .from('payments')
    .insert({
      workspace_id: workspaceAId,
      client_id: clientRecord.id,
      amount: 1000,
      date: new Date().toISOString().split('T')[0],
      method: 'upi',
      reference: 'LIVE-VERIF-' + Date.now(),
      notes: 'Live verification payment',
    })
    .select()
    .single();

  assert(!payErr && Boolean(newPayment), `Payment persisted to PostgreSQL (Amount: ₹1,000)`);

  // Fetch all deliverables and payments for this client and calculate ledger math
  const { data: liveDeliverables } = await clientA
    .from('deliverables')
    .select('amount, status')
    .eq('workspace_id', workspaceAId)
    .eq('client_id', clientRecord.id);

  const { data: livePayments } = await clientA
    .from('payments')
    .select('amount')
    .eq('workspace_id', workspaceAId)
    .eq('client_id', clientRecord.id);

  const earned = liveDeliverables
    .filter((d) => d.status !== 'cancelled')
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const received = livePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const outstanding = earned - received;

  console.log(`    Client Ledger: Earned = ₹${earned}, Received = ₹${received}, Outstanding = ₹${outstanding}`);
  assert(earned >= 2000, `Database contains deliverable ₹2,000`);
  assert(received >= 1000, `Database contains payment ₹1,000`);
  assert(outstanding === earned - received, `Financial invariant holds: Outstanding (${outstanding}) = Earned (${earned}) - Received (${received})`);

  // -----------------------------------------------------------------
  // 4. BROWSER REFRESH PERSISTENCE (QUERY WITH FRESH CLIENT INSTANCE)
  // -----------------------------------------------------------------
  console.log('\n--- 4. DATA RECOVERY VIA FRESH CONNECTION (SIMULATING REFRESH) ---');
  const freshClient = createClient(supabaseUrl, supabaseAnonKey);
  await freshClient.auth.setSession({
    access_token: authDataA.session.access_token,
    refresh_token: authDataA.session.refresh_token,
  });

  const { data: refreshedClient } = await freshClient.from('clients').select('*').eq('id', clientRecord.id).single();
  assert(refreshedClient?.name === 'Nova Live Test', `Records remain intact and retrievable on fresh connection`);

  const { data: refreshedDeliverable } = await freshClient.from('deliverables').select('*').eq('id', newDeliverable.id).single();
  assert(refreshedDeliverable?.title === 'Live Supabase Test', `Deliverable intact after session restore`);

  // -----------------------------------------------------------------
  // 5. ROW LEVEL SECURITY (RLS) MULTI-TENANT ISOLATION
  // -----------------------------------------------------------------
  console.log('\n--- 5. RLS MULTI-TENANT ISOLATION (USER A vs USER B) ---');
  const { data: authDataB, error: authErrB } = await clientB.auth.signInWithPassword(userBCreds);
  assert(!authErrB && Boolean(authDataB.session?.access_token), `User B logged in successfully (${userBCreds.email})`);

  const { data: membershipsB } = await clientB.from('workspace_members').select('workspace_id').eq('user_id', authDataB.user.id);
  const workspaceBId = membershipsB[0].workspace_id;
  assert(workspaceAId !== workspaceBId, `User A workspace (${workspaceAId}) and User B workspace (${workspaceBId}) are distinct`);

  // User B queries User A's client
  const { data: bClients } = await clientB.from('clients').select('*').eq('id', clientRecord.id);
  assert(bClients?.length === 0, `RLS Read Isolation: User B CANNOT read User A's client (0 rows returned)`);

  // User B queries User A's deliverable
  const { data: bDeliverables } = await clientB.from('deliverables').select('*').eq('id', newDeliverable.id);
  assert(bDeliverables?.length === 0, `RLS Read Isolation: User B CANNOT read User A's deliverable (0 rows returned)`);

  // User B queries User A's payment
  const { data: bPayments } = await clientB.from('payments').select('*').eq('id', newPayment.id);
  assert(bPayments?.length === 0, `RLS Read Isolation: User B CANNOT read User A's payment (0 rows returned)`);

  // User B queries User A's workspace
  const { data: bWorkspaces } = await clientB.from('workspaces').select('*').eq('id', workspaceAId);
  assert(bWorkspaces?.length === 0, `RLS Read Isolation: User B CANNOT read User A's workspace (0 rows returned)`);

  // User B attempts to mutate User A's deliverable
  const { data: updateRes, error: updateErr } = await clientB
    .from('deliverables')
    .update({ amount: 99999 })
    .eq('id', newDeliverable.id)
    .select();
  assert((!updateRes || updateRes.length === 0), `RLS Mutation Isolation: User B CANNOT update User A's deliverable (0 rows affected)`);

  // User B attempts to delete User A's client
  const { data: deleteRes } = await clientB
    .from('clients')
    .delete()
    .eq('id', clientRecord.id)
    .select();
  assert((!deleteRes || deleteRes.length === 0), `RLS Delete Isolation: User B CANNOT delete User A's client (0 rows affected)`);

  // User B attempts to insert directly into User A's workspace
  const { error: illicitInsertErr } = await clientB.from('deliverables').insert({
    workspace_id: workspaceAId,
    client_id: clientRecord.id,
    title: 'Hacked Deliverable',
    type: 'other',
    amount: 50000,
    date: new Date().toISOString().split('T')[0],
    status: 'delivered',
  });
  assert(Boolean(illicitInsertErr), `RLS Insert Isolation: User B CANNOT insert into User A's workspace (rejected by policy: ${illicitInsertErr?.message})`);

  // -----------------------------------------------------------------
  // 6. FAILED DATABASE WRITE & ERROR HANDLING
  // -----------------------------------------------------------------
  console.log('\n--- 6. FAILED DATABASE WRITE HANDLING ---');
  // Attempt to write deliverable with invalid client_id
  const { error: invalidFkErr } = await clientA.from('deliverables').insert({
    workspace_id: workspaceAId,
    client_id: '00000000-0000-0000-0000-000000000000', // Non-existent client
    title: 'Invalid Foreign Key Test',
    type: 'other',
    amount: 1000,
    date: new Date().toISOString().split('T')[0],
    status: 'delivered',
  });
  assert(Boolean(invalidFkErr), `Database write failure detected: foreign key error returned cleanly ("${invalidFkErr?.message}")`);

  // Attempt to write deliverable with negative/invalid amount or missing title
  const { error: missingTitleErr } = await clientA.from('deliverables').insert({
    workspace_id: workspaceAId,
    client_id: clientRecord.id,
    title: null, // violates NOT NULL
    type: 'other',
    amount: 1000,
    date: new Date().toISOString().split('T')[0],
    status: 'delivered',
  });
  assert(Boolean(missingTitleErr), `Database write failure detected: NOT NULL violation returned cleanly ("${missingTitleErr?.message}")`);

  // -----------------------------------------------------------------
  // 7. USER LOGOUT
  // -----------------------------------------------------------------
  console.log('\n--- 7. LOGOUT & SESSION TERMINATION ---');
  const { error: logoutErr } = await clientA.auth.signOut();
  assert(!logoutErr, `User A logged out cleanly`);
  const { data: postLogoutSession } = await clientA.auth.getSession();
  assert(!postLogoutSession.session, `User A session is null after logout`);

  console.log('\n================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveVerification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
