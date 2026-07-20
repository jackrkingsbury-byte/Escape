-- NeverMiss — hardening pass driven by Supabase advisor findings (2026-07-20).
-- Applied to project oidsuszhljnlitneurqy via MCP apply_migration; kept here
-- so the repo stays the source of truth for the deployed schema.

-- 1) Pin search_path on the trigger helper (advisor 0011_function_search_path_mutable).
alter function public.set_updated_at() set search_path = '';

-- 2) SECURITY DEFINER functions must not be callable through the public RPC
--    surface (advisors 0028/0029). Trigger and event-trigger execution is
--    unaffected by EXECUTE grants.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 3) RLS: wrap auth.uid() in a scalar subquery so Postgres evaluates it once
--    per statement instead of once per row (advisor 0003_auth_rls_initplan).
alter policy profiles_self on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy businesses_owner on public.businesses
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

alter policy leads_owner on public.leads
  using (business_id in (select id from public.businesses where owner_user_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_user_id = (select auth.uid())));

alter policy conversations_owner on public.conversations
  using (business_id in (select id from public.businesses where owner_user_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_user_id = (select auth.uid())));

alter policy bookings_owner on public.bookings
  using (business_id in (select id from public.businesses where owner_user_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_user_id = (select auth.uid())));

alter policy events_owner on public.events
  using (business_id in (select id from public.businesses where owner_user_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_user_id = (select auth.uid())));

alter policy messages_owner on public.messages
  using (
    conversation_id in (
      select c.id from public.conversations c
      join public.businesses b on b.id = c.business_id
      where b.owner_user_id = (select auth.uid())
    )
  ) with check (
    conversation_id in (
      select c.id from public.conversations c
      join public.businesses b on b.id = c.business_id
      where b.owner_user_id = (select auth.uid())
    )
  );

-- 4) Cover FK columns used by joins and cascade deletes (advisor 0001_unindexed_foreign_keys).
create index if not exists idx_bookings_lead      on public.bookings(lead_id);
create index if not exists idx_conversations_lead on public.conversations(lead_id);
