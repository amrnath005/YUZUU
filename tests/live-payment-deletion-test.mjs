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
  console.error('FATAL: Supabase URL or Anon key missing in .env.local');
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

async function runPaymentDeletionTest() {
  console.log('================================================================');
  console.log('       YUZU LIVE CLOUD PAYMENT DELETION & PERSISTENCE TEST      ');
  console.log(`       Target URL: ${supabaseUrl}`);
  console.log('================================================================\n');

  const clientA = createClient(supabaseUrl, supabaseAnonKey);
  const clientB = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Authenticate User A
  console.log('--- 1. AUTHENTICATING USER A ---');
  const { data: authDataA, error: authErrA } = await clientA.auth.signInWithPassword(userACreds);
  assert(!authErrA && Boolean(authDataA.session), `User A logged in successfully (${userACreds.email})`);

  const { data: membershipsA } = await clientA
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', authDataA.user.id);
  const workspaceAId = membershipsA[0].workspace_id;
  assert(Boolean(workspaceAId), `User A workspace resolved: ${workspaceAId}`);

  // Fetch or create client for User A
  let { data: clientAData } = await clientA
    .from('clients')
    .select('id')
    .eq('workspace_id', workspaceAId)
    .limit(1);

  let targetClientId;
  if (clientAData && clientAData.length > 0) {
    targetClientId = clientAData[0].id;
  } else {
    const { data: newC } = await clientA
      .from('clients')
      .insert({
        workspace_id: workspaceAId,
        name: 'Deletion Test Client',
        type: 'agency'
      })
      .select()
      .single();
    targetClientId = newC.id;
  }

  // 2. Insert test payment
  console.log('\n--- 2. INSERT TEST PAYMENT IN REMOTE POSTGRESQL ---');
  const testRef = 'DEL-TEST-' + Date.now();
  const { data: insertedPayment, error: insertErr } = await clientA
    .from('payments')
    .insert({
      workspace_id: workspaceAId,
      client_id: targetClientId,
      amount: 4500,
      method: 'upi',
      date: new Date().toISOString().split('T')[0],
      reference: testRef,
      notes: 'Testing real deletion persistence',
    })
    .select()
    .single();

  assert(!insertErr && Boolean(insertedPayment), `Payment inserted into PostgreSQL (ID: ${insertedPayment?.id}, Ref: ${testRef})`);

  // Verify payment exists
  const { data: checkExists } = await clientA
    .from('payments')
    .select('*')
    .eq('id', insertedPayment.id);
  assert(checkExists?.length === 1, `Verified payment exists in PostgreSQL prior to deletion`);

  // 3. Test RLS Isolation: User B cannot delete User A's payment
  console.log('\n--- 3. VERIFY RLS ISOLATION (USER B CANNOT DELETE) ---');
  await clientB.auth.signInWithPassword(userBCreds);
  const { data: unauthorizedDelete } = await clientB
    .from('payments')
    .delete()
    .eq('id', insertedPayment.id)
    .select();
  assert(!unauthorizedDelete || unauthorizedDelete.length === 0, `RLS Violation Guard: User B deletion affected 0 rows`);

  // 4. User A deletes their own payment
  console.log('\n--- 4. USER A EXECUTES DELETE OPERATION ---');
  const { data: deletedRows, error: deleteErr } = await clientA
    .from('payments')
    .delete()
    .eq('id', insertedPayment.id)
    .eq('workspace_id', workspaceAId)
    .select();

  assert(!deleteErr, `Delete query executed without PostgreSQL error`);
  assert(deletedRows && deletedRows.length === 1, `PostgreSQL RLS allowed deletion: exactly 1 row deleted`);

  // 5. Fresh connection query (simulating browser F5 refresh)
  console.log('\n--- 5. SIMULATING PAGE REFRESH (FRESH CLIENT QUERY) ---');
  const freshClient = createClient(supabaseUrl, supabaseAnonKey);
  await freshClient.auth.setSession({
    access_token: authDataA.session.access_token,
    refresh_token: authDataA.session.refresh_token,
  });

  const { data: postRefreshCheck } = await freshClient
    .from('payments')
    .select('*')
    .eq('id', insertedPayment.id);

  assert(postRefreshCheck && postRefreshCheck.length === 0, `Permanently Deleted: 0 rows returned on fresh query (NO GHOST PAYMENT)`);

  console.log('\n================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runPaymentDeletionTest().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
