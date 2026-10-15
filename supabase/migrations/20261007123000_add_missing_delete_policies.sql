-- Migration: 20261007123000_add_missing_delete_policies.sql
-- Description: Add missing DELETE row-level security (RLS) policies for payments, statements, and activities

-- 1. PAYMENTS DELETE POLICY
create policy "Workspace members can delete payments"
  on public.payments for delete
  using (public.is_workspace_member(workspace_id));

-- 2. STATEMENTS DELETE POLICY
create policy "Workspace members can delete statements"
  on public.statements for delete
  using (public.is_workspace_member(workspace_id));

-- 3. ACTIVITIES DELETE POLICY
create policy "Workspace members can delete activities"
  on public.activities for delete
  using (public.is_workspace_member(workspace_id));
