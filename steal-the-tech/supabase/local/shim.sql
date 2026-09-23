-- ============================================================================
-- STEAL THE TECH — local shim
--
-- Recreates the tiny slice of Supabase that the game schema relies on, so the
-- exact same migrations can run on a plain Postgres (tests) or on PGlite in the
-- browser (offline mode).
--
-- NEVER run this file on a real Supabase project: Supabase already provides
-- all of this (auth schema, auth.uid(), the anon/authenticated roles).
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);

-- Same contract as Supabase's auth.uid(): read the JWT "sub" claim that the
-- API layer places in the request settings.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
