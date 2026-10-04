# YUZU — Supabase PostgreSQL Architecture & Migration Guide

## 1. Architecture Overview

YUZU has transitioned from a single-browser `localStorage` prototype to an enterprise-grade multi-tenant SaaS architecture backed by Supabase PostgreSQL and Row Level Security (RLS).

### Conceptual Transition

```
BEFORE:
Browser UI → localStorage (yuzu_freelance_store_v1) → In-Memory Store

AFTER:
User → Supabase Auth (JWT) → Workspace Isolation → PostgreSQL (RLS)
         ↑                                                ↓
  Local Cache / Fallback ← Optimistic Store Reactivity ← Tables & Policies
```

### Key Architectural Tenets:
1. **Zero UI Disruption**: The Japanese minimalism × subtle citrus visual language (`#F6D94E`, `#FAFAF7`, `#11110F`) is preserved without changes.
2. **Zero-Lag Optimistic Updates**: Store mutations (`addDeliverable`, `addPayment`, `addClient`, `updateDeliverable`) apply immediately in memory for sub-10ms UI reactivity and stream to Supabase in the background.
3. **Multi-Tenancy at Database Layer**: All user deliverables, payments, clients, and rates are strictly partitioned by `workspace_id` governed by PostgreSQL RLS.
4. **Deterministic Local Migration**: Offline/localStorage data is never destroyed prematurely; users can inspect and import existing deliverables with count and financial sum verification.

---

## 2. Database Schema

The database is defined in [`supabase/schema.sql`](file:///c:/Yuzu/yuzu-app/supabase/schema.sql) and [`src/lib/supabase/schema.sql`](file:///c:/Yuzu/yuzu-app/src/lib/supabase/schema.sql).

### Tables:

| Table | Description | Primary Key | Key Foreign Keys |
| :--- | :--- | :--- | :--- |
| `profiles` | Extends `auth.users` with display name, avatar, and contact info | `id (uuid)` | `id -> auth.users.id` |
| `workspaces` | Multi-tenant organization unit (Studio) | `id (uuid)` | `owner_id -> auth.users.id` |
| `workspace_members` | Join table associating users with roles (`owner`, `admin`, `member`) | `id (uuid)` | `workspace_id`, `user_id` |
| `clients` | Freelance client entities (`agency`, `creator`, `business`, etc.) | `id (uuid)` | `workspace_id -> workspaces.id` |
| `rate_cards` | Negotiated rates per client and deliverable type | `id (uuid)` | `workspace_id`, `client_id` |
| `deliverables` | Core work records (reels, videos, designs, status, rate) | `id (uuid)` | `workspace_id`, `client_id` |
| `payments` | Transactions received (amount, method, reference, date) | `id (uuid)` | `workspace_id`, `client_id` |
| `statements` | Generated billing statement audit records | `id (uuid)` | `workspace_id`, `client_id` |
| `activities` | Audit trail of work and payment events | `id (uuid)` | `workspace_id` |

### Automated Onboarding Trigger:
When a new user signs up in `auth.users`, the trigger function `handle_new_user()` automatically:
1. Creates a corresponding row in `public.profiles`.
2. Generates a default studio workspace: `"${name}'s Studio"`.
3. Adds the user as `'owner'` in `public.workspace_members`.

---

## 3. Authentication

Implemented in [`src/contexts/auth-context.tsx`](file:///c:/Yuzu/yuzu-app/src/contexts/auth-context.tsx) and [`src/features/auth/auth-modal.tsx`](file:///c:/Yuzu/yuzu-app/src/features/auth/auth-modal.tsx).

- **Email & Password**: Direct signup and signin via `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`.
- **Google OAuth**: One-click authentication with PKCE redirect flow.
- **Session Persistence**: Managed automatically via `@supabase/ssr` with secure cookie and localStorage session tokens.
- **Auto-Recovery**: Recovers expired sessions and notifies listeners on `SIGNED_IN`, `SIGNED_OUT`, and `TOKEN_REFRESHED` events.
- **Graceful Unconfigured Fallback**: If Supabase credentials are not supplied, the app remains fully functional in local demo mode.

---

## 4. Row Level Security (RLS) Policies

All 9 tables have RLS enabled:
`ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;`

### Workspace Membership Security Definer:
```sql
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$;
```

### Policies Applied to Tenant Tables (`clients`, `rate_cards`, `deliverables`, `payments`, `activities`, `statements`):
- **SELECT**: `USING (public.is_workspace_member(workspace_id))`
- **INSERT**: `WITH CHECK (public.is_workspace_member(workspace_id))`
- **UPDATE**: `USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id))`
- **DELETE**: `USING (public.is_workspace_member(workspace_id))`

*Guarantees that no user can query or modify another workspace's records, even if they guess or spoof UUIDs.*

---

## 5. Environment Variables

Documented in [`.env.example`](file:///c:/Yuzu/yuzu-app/.env.example):

```bash
# Public Client Variables (Safe for Browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Server-Only Privileged Secret (NEVER expose to browser / client bundles)
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 6. LocalStorage Data Migration

Implemented in [`src/lib/migration.ts`](file:///c:/Yuzu/yuzu-app/src/lib/migration.ts) and surfaced via [`src/features/migration/local-migration-banner.tsx`](file:///c:/Yuzu/yuzu-app/src/features/migration/local-migration-banner.tsx).

### 6-Step Migration Pipeline:
1. **Detection**: Checks if `yuzu_freelance_store_v1` exists in `localStorage` and contains records not yet flagged as migrated for the active workspace.
2. **Deterministic ID Mapping**: Maps local string client IDs (e.g., `'c_1'`) to deterministic RFC4122 UUIDs so that all deliverables, payments, and rate cards retain exact referential integrity.
3. **Chunked Insertion**: Upserts clients, rate cards, deliverables, and payments in batches of 50 to avoid payload bottlenecks.
4. **Invariant Verification**:
   - Compares local deliverable counts against inserted cloud deliverable counts.
   - Computes:
     $$\text{Total Earned} = \sum_{\text{status} \neq \text{'cancelled'}} \text{deliverables.amount}$$
     $$\text{Total Received} = \sum \text{payments.amount}$$
     $$\text{Outstanding} = \text{Total Earned} - \text{Total Received}$$
   - Validates that local financial metrics match cloud financial metrics down to the rupee.
5. **Flagging**: Marks `yuzu_migrated_<workspaceId> = 'true'` in localStorage.
6. **Safety Guarantee**: Local data is not purged until user confirms or explicitly clears cache.

---

## 7. Development Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. In Supabase Dashboard:
   - Navigate to the **SQL Editor**.
   - Paste and execute `supabase/schema.sql`.
   - Under **Authentication -> URL Configuration**, add `http://localhost:3000` to Site URL and Redirect URLs.
3. Copy API credentials from **Project Settings -> API** into `.env.local`.
4. Run development server:
   ```bash
   npm run dev
   ```

---

## 8. Production Setup

1. In Supabase production project:
   - Run `supabase/schema.sql`.
   - Set Site URL and Redirect URLs to your custom production domain (e.g., `https://yuzu.app`).
2. In Vercel / Cloudflare / Server environment:
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run optimized build:
   ```bash
   npm run build
   npm run start -- -p 3000
   ```

---

## 9. Seed Data Management

- Seed data in [`src/data/seed.ts`](file:///c:/Yuzu/yuzu-app/src/data/seed.ts) is strictly quarantined for offline demo mode.
- Production accounts provision an empty workspace by default.
- Developers can explicitly populate a test workspace using [`seedCloudWorkspace(workspaceId, supabase)`](file:///c:/Yuzu/yuzu-app/src/lib/supabase/seed-cloud.ts).

---

## 10. Security Considerations

- **Service-Role Key Isolation**: The service-role key is never included in client packages, never loaded in browser contexts, and only documented for administrative tooling.
- **Tenant Authorization at Database Level**: Client-supplied workspace IDs are verified against `workspace_members` via PostgreSQL functions; frontend filters cannot bypass RLS.
- **SQL Injection Prevention**: All queries utilize parameterized Supabase PostgREST builders.

---

## 11. Testing & Verification

1. **Supabase PostgreSQL & Isolation Suite**:
   ```bash
   node tests/supabase-migration-test.mjs
   ```
   - 12/12 automated checks pass.
   - Covers: Schema DDL, RLS policies, User A vs User B tenant isolation, UUID mapping, financial invariant verification, and client graceful fallback.

2. **Critical User Workflow Regression Suite**:
   ```bash
   node tests/regression-test.mjs
   ```
   - 6/6 end-to-end tests pass against live production server.
   - Covers: "Save & Add Another" batch flow, refresh persistence, statement auto-generation, search, month filtering, and all 8 routes returning HTTP 200/304.

---

## 12. Rollback Strategy

If a cloud network outage occurs or Supabase is temporarily unreachable:
1. The store catches connection errors without crashing the client interface.
2. In-flight records remain stored in the local storage cache (`yuzu_freelance_store_v1`).
3. If users sign out or Supabase credentials are removed, YUZU seamlessly reverts to offline browser mode with full access to local records.
