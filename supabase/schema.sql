-- ==============================================================================
-- YUZU — Production Multi-Tenant PostgreSQL Schema
-- Platform: Supabase / PostgreSQL 15+
-- Security: Row Level Security (RLS) enabled on all tables
-- Tenant Isolation: Workspace-scoped via workspace_members
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUM / TYPE DEFINITIONS (Handled via TEXT + CHECK constraints for maximum flexibility)

-- 3. PROFILES (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. WORKSPACES
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. WORKSPACE MEMBERS (Many-to-Many: User <-> Workspace)
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- 6. CLIENTS
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  type text not null default 'agency' check (type in ('agency', 'creator', 'business', 'startup', 'individual', 'other')),
  email text,
  phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. RATE CARDS
create table if not exists public.rate_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  deliverable_type text not null,
  rate numeric not null default 0 check (rate >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, client_id, deliverable_type)
);

-- 8. DELIVERABLES
create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  type text not null,
  amount numeric not null default 0 check (amount >= 0),
  date date not null default current_date,
  status text not null default 'delivered' check (status in ('in-progress', 'delivered', 'revision', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. PAYMENTS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  amount numeric not null default 0 check (amount >= 0),
  method text not null default 'upi' check (method in ('upi', 'bank-transfer', 'cash', 'card', 'other')),
  date date not null default current_date,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. STATEMENTS (Audit record of statements generated)
create table if not exists public.statements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  month integer not null check (month between 0 and 11),
  year integer not null check (year >= 2020),
  generated_at timestamptz not null default now()
);

-- 11. ACTIVITIES
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('deliverable_added', 'payment_received', 'client_added', 'statement_generated')),
  entity_id text not null,
  description text not null,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
create index if not exists idx_workspaces_owner on public.workspaces(owner_id);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_workspace_members_ws on public.workspace_members(workspace_id);
create index if not exists idx_clients_ws on public.clients(workspace_id);
create index if not exists idx_rate_cards_ws_client on public.rate_cards(workspace_id, client_id);
create index if not exists idx_deliverables_ws on public.deliverables(workspace_id);
create index if not exists idx_deliverables_client on public.deliverables(client_id);
create index if not exists idx_deliverables_date on public.deliverables(date);
create index if not exists idx_deliverables_status on public.deliverables(status);
create index if not exists idx_payments_ws on public.payments(workspace_id);
create index if not exists idx_payments_client on public.payments(client_id);
create index if not exists idx_payments_date on public.payments(date);
create index if not exists idx_activities_ws_created on public.activities(workspace_id, created_at desc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

-- Security definer function to avoid RLS recursion when verifying workspace membership
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

-- Security definer function to verify if current user is owner of a workspace
create or replace function public.is_workspace_owner(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspaces
    where id = ws_id
      and owner_id = auth.uid()
  );
$$;

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.rate_cards enable row level security;
alter table public.deliverables enable row level security;
alter table public.payments enable row level security;
alter table public.statements enable row level security;
alter table public.activities enable row level security;

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- PROFILES
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- WORKSPACES
create policy "Members can view their workspaces"
  on public.workspaces for select
  using (
    owner_id = auth.uid() or
    id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

create policy "Users can create workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

create policy "Owners can update their workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid());

create policy "Owners can delete their workspaces"
  on public.workspaces for delete
  using (owner_id = auth.uid());

-- WORKSPACE MEMBERS
create policy "Members can view workspace member lists"
  on public.workspace_members for select
  using (
    user_id = auth.uid() or
    public.is_workspace_member(workspace_id)
  );

create policy "Owners can add workspace members"
  on public.workspace_members for insert
  with check (
    public.is_workspace_owner(workspace_id) or
    user_id = auth.uid() -- Allows user to accept invite or auto-join owned ws
  );

create policy "Owners can delete workspace members"
  on public.workspace_members for delete
  using (
    public.is_workspace_owner(workspace_id) or
    user_id = auth.uid() -- Allows member to leave
  );

-- CLIENTS
create policy "Workspace members can view clients"
  on public.clients for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert clients"
  on public.clients for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update clients"
  on public.clients for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete clients"
  on public.clients for delete
  using (public.is_workspace_member(workspace_id));

-- RATE CARDS
create policy "Workspace members can view rate cards"
  on public.rate_cards for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert rate cards"
  on public.rate_cards for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update rate cards"
  on public.rate_cards for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete rate cards"
  on public.rate_cards for delete
  using (public.is_workspace_member(workspace_id));

-- DELIVERABLES
create policy "Workspace members can view deliverables"
  on public.deliverables for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert deliverables"
  on public.deliverables for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update deliverables"
  on public.deliverables for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete deliverables"
  on public.deliverables for delete
  using (public.is_workspace_member(workspace_id));

-- PAYMENTS
create policy "Workspace members can view payments"
  on public.payments for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert payments"
  on public.payments for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update payments"
  on public.payments for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- STATEMENTS
create policy "Workspace members can view statements"
  on public.statements for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert statements"
  on public.statements for insert
  with check (public.is_workspace_member(workspace_id));

-- ACTIVITIES
create policy "Workspace members can view activities"
  on public.activities for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert activities"
  on public.activities for insert
  with check (public.is_workspace_member(workspace_id));

-- ==============================================================================
-- AUTOMATIC NEW USER ONBOARDING TRIGGER
-- ==============================================================================
-- Whenever a user signs up via Supabase Auth:
-- 1. Create a profile record.
-- 2. Create their initial personal workspace.
-- 3. Add them as 'owner' in workspace_members.
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_workspace_id uuid;
begin
  -- Resolve name from metadata or fallback
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- 1. Create profile
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    v_name,
    new.raw_user_meta_data->>'avatar_url'
  );

  -- 2. Create default workspace
  insert into public.workspaces (owner_id, name, currency)
  values (
    new.id,
    v_name || '''s Studio',
    'INR'
  )
  returning id into v_workspace_id;

  -- 3. Link user as owner
  insert into public.workspace_members (workspace_id, user_id, role)
  values (
    v_workspace_id,
    new.id,
    'owner'
  );

  return new;
end;
$$;

-- Trigger definition on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
