-- NeverMiss — initial schema
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- Design: one owner (auth user) -> many businesses -> leads/conversations/messages/bookings.
-- Security: RLS everywhere; owners see only rows for businesses they own.
-- Server-side webhooks use the service-role key, which bypasses RLS.

-- ---------- extensions ----------
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------- enums ----------
do $$ begin
  create type ai_mode      as enum ('auto', 'approve');
exception when duplicate_object then null; end $$;
do $$ begin
  create type lead_status  as enum ('new', 'qualifying', 'quoted', 'booked', 'won', 'lost');
exception when duplicate_object then null; end $$;
do $$ begin
  create type msg_direction as enum ('in', 'out');
exception when duplicate_object then null; end $$;
do $$ begin
  create type msg_sender    as enum ('customer', 'ai', 'human');
exception when duplicate_object then null; end $$;
do $$ begin
  create type booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

-- ---------- shared helpers ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- businesses ----------
create table if not exists businesses (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  vertical       text,
  city           text,
  timezone       text not null default 'Africa/Johannesburg',
  whatsapp_number text,
  tone           text,
  hours          jsonb not null default '{}'::jsonb,
  service_area   text,
  faq            jsonb not null default '[]'::jsonb,
  price_ranges   jsonb not null default '[]'::jsonb,
  ai_mode        ai_mode not null default 'approve',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_businesses_owner on businesses(owner_user_id);

-- ---------- leads ----------
create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  customer_name   text,
  customer_wa     text,
  status          lead_status not null default 'new',
  estimated_value numeric(12,2) not null default 0,
  captured_value  numeric(12,2) not null default 0,
  source          text not null default 'whatsapp',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_leads_business on leads(business_id);
create index if not exists idx_leads_status   on leads(business_id, status);

-- ---------- conversations ----------
create table if not exists conversations (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references businesses(id) on delete cascade,
  lead_id            uuid references leads(id) on delete set null,
  wa_conversation_id text,
  ai_paused          boolean not null default false,
  last_message_at    timestamptz not null default now(),
  created_at         timestamptz not null default now()
);
create index if not exists idx_conversations_business on conversations(business_id);
create unique index if not exists uq_conversations_wa
  on conversations(business_id, wa_conversation_id)
  where wa_conversation_id is not null;

-- ---------- messages ----------
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction       msg_direction not null,
  sender          msg_sender not null,
  body            text,
  media_url       text,
  wa_message_id   text,
  ai_meta         jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_messages_conversation on messages(conversation_id, created_at);
create unique index if not exists uq_messages_wa_id
  on messages(wa_message_id) where wa_message_id is not null;

-- ---------- bookings ----------
create table if not exists bookings (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid references leads(id) on delete set null,
  business_id      uuid not null references businesses(id) on delete cascade,
  service          text,
  slot_start       timestamptz,
  slot_end         timestamptz,
  status           booking_status not null default 'pending',
  deposit_required boolean not null default false,
  deposit_paid     boolean not null default false,
  yoco_link        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_bookings_business on bookings(business_id);

-- ---------- events (analytics + daily digest source) ----------
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  type        text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_events_business on events(business_id, created_at);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array['profiles','businesses','leads','bookings']
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on %1$s;
       create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ---------- RLS ----------
alter table profiles      enable row level security;
alter table businesses    enable row level security;
alter table leads         enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;
alter table bookings      enable row level security;
alter table events        enable row level security;

-- profiles: user manages only their own row
drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- businesses: owner-scoped
drop policy if exists businesses_owner on businesses;
create policy businesses_owner on businesses
  for all using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- child tables: scoped through the owning business
drop policy if exists leads_owner on leads;
create policy leads_owner on leads
  for all using (business_id in (select id from businesses where owner_user_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_user_id = auth.uid()));

drop policy if exists conversations_owner on conversations;
create policy conversations_owner on conversations
  for all using (business_id in (select id from businesses where owner_user_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_user_id = auth.uid()));

drop policy if exists bookings_owner on bookings;
create policy bookings_owner on bookings
  for all using (business_id in (select id from businesses where owner_user_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_user_id = auth.uid()));

drop policy if exists events_owner on events;
create policy events_owner on events
  for all using (business_id in (select id from businesses where owner_user_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_user_id = auth.uid()));

-- messages: scoped via conversation -> business
drop policy if exists messages_owner on messages;
create policy messages_owner on messages
  for all using (
    conversation_id in (
      select c.id from conversations c
      join businesses b on b.id = c.business_id
      where b.owner_user_id = auth.uid()
    )
  ) with check (
    conversation_id in (
      select c.id from conversations c
      join businesses b on b.id = c.business_id
      where b.owner_user_id = auth.uid()
    )
  );
