-- ============================================================================
-- STEAL THE TECH — schema
--
-- Security model
--   * Every game table lives in the private `game` schema with RLS enabled and
--     NO client policies: browsers can never read or write game tables directly.
--   * The only way to change anything is through `public.stt_*` RPC functions
--     (SECURITY DEFINER). They identify the caller with auth.uid(), lock the
--     rows they touch, validate everything and compute all outcomes (money,
--     loot, raid results, prices) on the server.
--   * The one exception is `game.server_events` (the live feed), which
--     signed-in players may SELECT (global rows + rows addressed to them) so
--     Supabase Realtime can push notifications.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create schema if not exists game;

-- Functions in `game` are internal: nobody but the owner may execute them.
alter default privileges in schema game revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Static definitions (seeded by the catalog migration)
-- ---------------------------------------------------------------------------
create table if not exists game.rarities (
  id text primary key,
  tier int not null unique,
  label text not null,
  color text not null,
  steal_penalty numeric not null default 0,
  steal_extra_seconds int not null default 0,
  xp int not null default 0,
  expected_supply int not null default 0
);

create table if not exists game.items (
  id text primary key,
  name text not null,
  brand text not null,
  kind text not null,
  category text not null check (category in ('TECH','GAMING','CARS','FASHION','LUXURY','SPORTS')),
  rarity text not null references game.rarities(id),
  base_value bigint not null check (base_value > 0),
  base_income bigint not null check (base_income >= 0),
  max_supply int check (max_supply is null or max_supply > 0),
  tradeable boolean not null default true,
  droppable boolean not null default true,
  event_only boolean not null default false,
  color text not null default '#7dd3fc',
  accent text not null default '#0e7490',
  flavor text not null default '',
  sort int not null default 0
);

create table if not exists game.limited_item_supply (
  item_id text primary key references game.items(id),
  max_supply int not null check (max_supply > 0),
  minted int not null default 0,
  check (minted >= 0 and minted <= max_supply)
);

create table if not exists game.drop_types (
  id text primary key,
  name text not null,
  price bigint not null check (price > 0),
  min_level int not null default 1,
  requires_key boolean not null default false,
  event_only boolean not null default false,
  weights jsonb not null,
  xp int not null default 0,
  sort int not null default 0,
  description text not null default ''
);

create table if not exists game.upgrade_levels (
  kind text not null check (kind in ('base','security','vault')),
  level int not null,
  cost bigint not null,
  value int not null,
  name text not null,
  primary key (kind, level)
);

create table if not exists game.quests (
  id text primary key,
  period text not null check (period in ('daily','weekly')),
  title text not null,
  metric text not null,
  target bigint not null check (target > 0),
  reward jsonb not null,
  sort int not null default 0
);

create table if not exists game.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  xp int not null default 0,
  reward_cash bigint not null default 0,
  sort int not null default 0
);

create table if not exists game.cosmetics (
  id text primary key,
  slot text not null,
  name text not null,
  price bigint not null default 0,
  unlock text,
  data jsonb not null default '{}'::jsonb,
  sort int not null default 0
);

create table if not exists game.event_types (
  id text primary key,
  title text not null,
  icon text not null,
  description text not null,
  category text,
  price_mult numeric not null default 1,
  demand_boost numeric not null default 0,
  income_mult numeric not null default 1,
  luck_mult numeric not null default 1,
  weight int not null default 1
);

create table if not exists game.level_titles (
  level int primary key,
  title text not null
);

-- ---------------------------------------------------------------------------
-- Players
-- ---------------------------------------------------------------------------
-- profiles.id == auth.users.id for humans; fixed ids for NPC bots.
create table if not exists game.profiles (
  id uuid primary key,
  username text not null,
  is_bot boolean not null default false,
  bot jsonb,
  cash bigint not null default 0 check (cash >= 0),
  income_remainder double precision not null default 0,
  last_income_at timestamptz not null default now(),
  xp bigint not null default 0,
  level int not null default 1,
  prestige int not null default 0,
  collection_focus text not null default 'RANDOM',
  drop_tokens jsonb not null default '{}'::jsonb,
  secret_keys int not null default 0 check (secret_keys >= 0),
  tutorial_step int not null default 0,
  tutorial_flags jsonb not null default '{}'::jsonb,
  cosmetics jsonb not null default '{}'::jsonb,
  daily_streak int not null default 0,
  last_daily_day date,
  raid_cooldown_until timestamptz,
  items_rev bigint not null default 0,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create unique index if not exists profiles_username_ci on game.profiles (lower(username));
create index if not exists profiles_last_seen on game.profiles (last_seen_at desc);

create table if not exists game.bases (
  player_id uuid primary key references game.profiles(id) on delete cascade,
  base_level int not null default 1,
  security_level int not null default 1,
  vault_level int not null default 1,
  shield_until timestamptz
);

create table if not exists game.player_stats (
  player_id uuid primary key references game.profiles(id) on delete cascade,
  drops_opened int not null default 0,
  items_found int not null default 0,
  secrets_found int not null default 0,
  limiteds_found int not null default 0,
  steals_won int not null default 0,
  steals_failed int not null default 0,
  times_robbed int not null default 0,
  raids_defended int not null default 0,
  trades_done int not null default 0,
  market_sales int not null default 0,
  market_buys int not null default 0,
  quick_sales int not null default 0,
  cash_earned bigint not null default 0,
  best_item_value bigint not null default 0,
  events_joined int not null default 0
);

-- One row per physical item instance in the world.
create table if not exists game.player_items (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references game.items(id),
  owner_id uuid not null references game.profiles(id) on delete cascade,
  location text not null default 'inventory' check (location in ('display','vault','inventory','listed')),
  slot int,
  serial int,
  soulbound boolean not null default false,
  acquired_via text not null,
  acquired_at timestamptz not null default now(),
  hot_until timestamptz,
  stolen_from uuid,
  check ((location = 'display') = (slot is not null))
);
create unique index if not exists player_items_display_slot on game.player_items (owner_id, slot) where location = 'display';
create index if not exists player_items_owner on game.player_items (owner_id, location);
create index if not exists player_items_item on game.player_items (item_id);

-- Ownership audit trail: every item creation / transfer / burn.
create table if not exists game.item_log (
  id bigserial primary key,
  player_item_id uuid not null,
  item_id text not null,
  from_id uuid,
  to_id uuid,
  via text not null,
  amount bigint,
  created_at timestamptz not null default now()
);
create index if not exists item_log_to on game.item_log (to_id, created_at);

create table if not exists game.player_collection (
  player_id uuid not null references game.profiles(id) on delete cascade,
  item_id text not null references game.items(id),
  first_found_at timestamptz not null default now(),
  times_found int not null default 1,
  primary key (player_id, item_id)
);

create table if not exists game.player_cosmetics (
  player_id uuid not null references game.profiles(id) on delete cascade,
  cosmetic_id text not null references game.cosmetics(id),
  acquired_at timestamptz not null default now(),
  primary key (player_id, cosmetic_id)
);

create table if not exists game.player_achievements (
  player_id uuid not null references game.profiles(id) on delete cascade,
  achievement_id text not null references game.achievements(id),
  unlocked_at timestamptz not null default now(),
  primary key (player_id, achievement_id)
);

create table if not exists game.player_quests (
  player_id uuid not null references game.profiles(id) on delete cascade,
  quest_id text not null references game.quests(id),
  period_key text not null,
  progress bigint not null default 0,
  claimed_at timestamptz,
  primary key (player_id, quest_id, period_key)
);

create table if not exists game.daily_rewards (
  player_id uuid not null references game.profiles(id) on delete cascade,
  day date not null,
  streak int not null,
  cycle_day int not null,
  reward jsonb not null,
  primary key (player_id, day)
);

create table if not exists game.security_upgrades (
  id bigserial primary key,
  player_id uuid not null references game.profiles(id) on delete cascade,
  kind text not null,
  from_level int not null,
  to_level int not null,
  cost bigint not null,
  created_at timestamptz not null default now()
);

-- Every change to a player's cash except passive income ticks.
create table if not exists game.transactions (
  id bigserial primary key,
  player_id uuid not null references game.profiles(id) on delete cascade,
  kind text not null,
  amount bigint not null,
  balance_after bigint not null,
  ref jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists transactions_player on game.transactions (player_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Market
-- ---------------------------------------------------------------------------
create table if not exists game.market_state (
  item_id text primary key references game.items(id),
  price bigint not null check (price > 0),
  demand numeric not null default 50,
  supply int not null default 0,
  listed int not null default 0,
  volume_24h int not null default 0,
  updated_at timestamptz not null default now(),
  last_alert_at timestamptz
);

create table if not exists game.market_history (
  item_id text not null references game.items(id),
  ts timestamptz not null,
  price bigint not null,
  demand numeric not null default 50,
  supply int not null default 0,
  listed int not null default 0,
  volume int not null default 0,
  primary key (item_id, ts)
);

create table if not exists game.market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references game.profiles(id) on delete cascade,
  player_item_id uuid not null references game.player_items(id) on delete cascade,
  item_id text not null references game.items(id),
  price bigint not null check (price > 0),
  status text not null default 'active' check (status in ('active','sold','cancelled')),
  buyer_id uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index if not exists market_listings_one_active on game.market_listings (player_item_id) where status = 'active';
create index if not exists market_listings_item on game.market_listings (item_id, status, price);
create index if not exists market_listings_seller on game.market_listings (seller_id, status);

create table if not exists game.market_sales (
  id bigserial primary key,
  item_id text not null references game.items(id),
  price bigint not null,
  seller_id uuid,
  buyer_id uuid,
  kind text not null check (kind in ('listing','quick_sell')),
  created_at timestamptz not null default now()
);
create index if not exists market_sales_item on game.market_sales (item_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Trades & raids
-- ---------------------------------------------------------------------------
create table if not exists game.trades (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references game.profiles(id) on delete cascade,
  to_id uuid not null references game.profiles(id) on delete cascade,
  offer_items uuid[] not null default '{}',
  offer_cash bigint not null default 0 check (offer_cash >= 0),
  request_items uuid[] not null default '{}',
  request_cash bigint not null default 0 check (request_cash >= 0),
  message text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','expired','failed')),
  note text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists trades_to on game.trades (to_id, status);
create index if not exists trades_from on game.trades (from_id, status);

create table if not exists game.raids (
  id uuid primary key default gen_random_uuid(),
  attacker_id uuid not null references game.profiles(id) on delete cascade,
  defender_id uuid not null references game.profiles(id) on delete cascade,
  player_item_id uuid not null,
  item_id text not null references game.items(id),
  status text not null default 'active' check (status in ('active','success','failed','blocked')),
  chance numeric not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  defended boolean not null default false,
  defended_at timestamptz,
  is_revenge boolean not null default false,
  is_tutorial boolean not null default false,
  revenge_used boolean not null default false,
  fine bigint not null default 0,
  note text,
  resolved_at timestamptz
);
create unique index if not exists raids_one_active_attacker on game.raids (attacker_id) where status = 'active';
create unique index if not exists raids_one_active_item on game.raids (player_item_id) where status = 'active';
create index if not exists raids_defender on game.raids (defender_id, status, resolved_at desc);
create index if not exists raids_attacker on game.raids (attacker_id, started_at desc);

-- ---------------------------------------------------------------------------
-- World, events & live feed
-- ---------------------------------------------------------------------------
create table if not exists game.world (
  id int primary key default 1 check (id = 1),
  last_tick_at timestamptz,
  last_history_at timestamptz,
  next_event_at timestamptz,
  last_bot_raid_at timestamptz,
  tick_count bigint not null default 0,
  seeded_at timestamptz
);
insert into game.world (id) values (1) on conflict (id) do nothing;

create table if not exists game.events (
  id bigserial primary key,
  type_id text not null references game.event_types(id),
  category text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  announced_end boolean not null default false
);
create index if not exists events_time on game.events (ends_at desc);

create table if not exists game.server_events (
  id bigserial primary key,
  kind text not null,
  target_id uuid,           -- null = everyone
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists server_events_target on game.server_events (target_id, id);
create index if not exists server_events_created on game.server_events (created_at);

-- ---------------------------------------------------------------------------
-- Row level security: deny by default
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'game' loop
    execute format('alter table game.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists server_events_read on game.server_events;
create policy server_events_read on game.server_events
  for select to authenticated
  using (target_id is null or target_id = auth.uid());

revoke all on all tables in schema game from anon, authenticated;
revoke all on all sequences in schema game from anon, authenticated;
grant usage on schema game to authenticated;
grant select on game.server_events to authenticated;

-- Supabase Realtime: stream the live feed (no-op outside Supabase).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'game' and tablename = 'server_events') then
    execute 'alter publication supabase_realtime add table game.server_events';
  end if;
end $$;
