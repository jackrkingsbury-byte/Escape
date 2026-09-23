-- ============================================================================
-- STEAL THE TECH — the Tech Belt update
--
--   * MUTATIONS  GOLD · DIAMOND · NEON · HOLO · GLITCH · RAINBOW multiply an
--                item's income and value (1.25× … 10×).
--   * PODIUM CASH  every displayed item piles up cash on its podium; walk over
--                it (act_collect) to bank it. Bots still bank automatically.
--   * TECH BELT  a shared conveyor of items rolling through the middle of the
--                city. Anyone can buy what's on it while it passes.
--   * BASE LOCK  lasers on your door block every raid for 40–90s.
--   * GRAB → CARRY  a steal is two phases: GRAB at the podium (security roll),
--                then CARRY it home. The owner can tag you and take it back.
--
-- Idempotent: safe to run more than once. Replaces some functions from the
-- earlier migrations with mutation / carry aware versions.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
create table if not exists game.mutations (
  id text primary key,
  label text not null,
  mult numeric not null check (mult >= 1),
  color text not null,
  weight int not null check (weight >= 0),
  sort int not null default 0
);
insert into game.mutations (id, label, mult, color, weight, sort) values
  ('gold', 'GOLD', 1.25, '#fbbf24', 50, 1),
  ('diamond', 'DIAMOND', 1.5, '#67e8f9', 25, 2),
  ('neon', 'NEON', 2, '#f472b6', 12, 3),
  ('holo', 'HOLO', 3, '#c4b5fd', 7, 4),
  ('glitch', 'GLITCH', 5, '#22d3ee', 4, 5),
  ('rainbow', 'RAINBOW', 10, '#ffffff', 2, 6)
on conflict (id) do update set label = excluded.label, mult = excluded.mult, color = excluded.color,
  weight = excluded.weight, sort = excluded.sort;

alter table game.player_items add column if not exists mutation text references game.mutations(id);
alter table game.player_items add column if not exists accrued_at timestamptz not null default now();
alter table game.bases add column if not exists lock_until timestamptz;
alter table game.raids add column if not exists phase text not null default 'grab';
alter table game.raids add column if not exists grabbed_at timestamptz;
alter table game.raids add column if not exists carry_until timestamptz;
alter table game.raids add column if not exists deliver_after timestamptz;
alter table game.world add column if not exists belt_next_at timestamptz;
alter table game.player_stats add column if not exists belt_buys int not null default 0;
alter table game.player_stats add column if not exists collects int not null default 0;
alter table game.player_stats add column if not exists mutations_found int not null default 0;
alter table game.player_stats add column if not exists thieves_caught int not null default 0;

do $$
begin
  alter table game.raids add constraint raids_phase_check check (phase in ('grab', 'carry'));
exception when duplicate_object then null;
end $$;

-- The Tech Belt. Rows are scheduled a little ahead of time so every client
-- sees a smooth stream no matter how often the world ticks.
create table if not exists game.belt (
  id bigserial primary key,
  item_id text not null references game.items(id),
  mutation text references game.mutations(id),
  price bigint not null check (price > 0),
  spawned_at timestamptz not null,
  ends_at timestamptz not null,
  sold_to uuid references game.profiles(id) on delete set null,
  sold_at timestamptz,
  player_item_id uuid
);
create index if not exists belt_ends on game.belt (ends_at);
create index if not exists belt_sold on game.belt (sold_at) where sold_at is not null;

alter table game.mutations enable row level security;
alter table game.belt enable row level security;
revoke all on game.mutations, game.belt from anon, authenticated;
revoke all on sequence game.belt_id_seq from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Mutations
-- ---------------------------------------------------------------------------
create or replace function game._mut_mult(p_mut text) returns numeric
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce((select m.mult from game.mutations m where m.id = p_mut), 1)
$$;

create or replace function game._roll_mutation(p_chance numeric) returns text
language plpgsql volatile set search_path = pg_catalog, game, pg_temp as $$
declare total numeric; pick numeric; acc numeric := 0; m record;
begin
  if p_chance is null or random() >= p_chance then return null; end if;
  select sum(weight) into total from mutations;
  if coalesce(total, 0) <= 0 then return null; end if;
  pick := random()::numeric * total;
  for m in select id, weight from mutations order by sort loop
    acc := acc + m.weight;
    if pick < acc then return m.id; end if;
  end loop;
  return null;
end $$;

create or replace function game._item_json(p game.player_items) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'item_id', p.item_id, 'location', p.location, 'slot', p.slot, 'serial', p.serial,
    'soulbound', p.soulbound, 'hot_until', p.hot_until, 'acquired_via', p.acquired_via,
    'acquired_at', p.acquired_at, 'stolen_from', p.stolen_from, 'mutation', p.mutation,
    'accrued_at', p.accrued_at)
$$;

-- ---------------------------------------------------------------------------
-- Income: cash piles up on each podium until the owner walks over it
-- ---------------------------------------------------------------------------
create or replace function game._income_rate(p_pid uuid) returns double precision
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare r double precision; ev record; pr int;
begin
  select * into ev from game._current_event();
  select prestige into pr from profiles where id = p_pid;
  select coalesce(sum(i.base_income * coalesce(m.mult, 1)
                      * case when ev.category is not null and i.category = ev.category then ev.income_mult else 1 end), 0)
    into r
  from player_items pi join items i on i.id = pi.item_id left join mutations m on m.id = pi.mutation
  where pi.owner_id = p_pid and pi.location = 'display';
  return r * (1 + 0.05 * coalesce(pr, 0));
end $$;

-- Income per second of one item for its owner right now.
create or replace function game._item_rate(p_item text, p_mut text, p_owner uuid) returns double precision
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare it record; ev record; pr int;
begin
  select base_income, category into it from items where id = p_item;
  if not found then return 0; end if;
  select * into ev from game._current_event();
  select prestige into pr from profiles where id = p_owner;
  return it.base_income * game._mut_mult(p_mut)
         * (case when ev.category is not null and it.category = ev.category then ev.income_mult else 1 end)
         * (1 + 0.05 * coalesce(pr, 0));
end $$;

-- Cash waiting on a podium (capped at 12 hours of earnings).
create or replace function game._pending(p game.player_items) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select case when p.location <> 'display' then 0::bigint else
    floor(game._item_rate(p.item_id, p.mutation, p.owner_id)
          * least(43200, greatest(0, extract(epoch from now() - p.accrued_at))))::bigint end
$$;

create or replace function game._credit_income(p_pid uuid, p_amount bigint, p_src text) returns bigint
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare bal bigint;
begin
  if p_amount is null or p_amount <= 0 then
    select cash into bal from profiles where id = p_pid;
    return bal;
  end if;
  update profiles set cash = cash + p_amount where id = p_pid returning cash into bal;
  if not found then return null; end if;
  insert into transactions (player_id, kind, amount, balance_after, ref)
  values (p_pid, 'income', p_amount, bal, jsonb_build_object('src', p_src));
  update player_stats set cash_earned = cash_earned + p_amount where player_id = p_pid;
  perform game._quest_progress(p_pid, 'earn_cash', p_amount);
  return bal;
end $$;

-- Bots bank passive income automatically; humans collect it from their podiums.
create or replace function game._settle(p_pid uuid) returns bigint
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; rate double precision; elapsed double precision; earned double precision; whole bigint;
begin
  select cash, income_remainder, last_income_at, is_bot into p from profiles where id = p_pid;
  if not found then return 0; end if;
  if not p.is_bot then return p.cash; end if;
  elapsed := extract(epoch from (now() - p.last_income_at));
  if elapsed <= 0 then return p.cash; end if;
  elapsed := least(elapsed, 43200);
  rate := game._income_rate(p_pid);
  earned := rate * elapsed + p.income_remainder;
  whole := floor(earned)::bigint;
  update profiles set cash = cash + whole, income_remainder = earned - whole, last_income_at = now()
  where id = p_pid;
  return p.cash + whole;
end $$;

-- Whenever an item leaves a podium (stored, vaulted, sold, stolen, traded…) the
-- cash waiting on it goes to its owner first; an item arriving on a podium
-- starts a fresh pile.
create or replace function game._items_accrual() returns trigger
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare bot boolean; amt bigint;
begin
  if tg_op = 'DELETE' then
    if old.location = 'display' then
      select is_bot into bot from profiles where id = old.owner_id;
      if bot is false then
        amt := game._pending(old);
        if amt > 0 then perform game._credit_income(old.owner_id, amt, 'auto'); end if;
      end if;
    end if;
    return old;
  end if;
  if old.location = 'display' and (new.location <> 'display' or new.owner_id <> old.owner_id) then
    select is_bot into bot from profiles where id = old.owner_id;
    if bot is false then
      amt := game._pending(old);
      if amt > 0 then perform game._credit_income(old.owner_id, amt, 'auto'); end if;
    end if;
  end if;
  if new.location = 'display' and (old.location <> 'display' or new.owner_id <> old.owner_id) then
    new.accrued_at := now();
  end if;
  return new;
end $$;

drop trigger if exists player_items_accrual on game.player_items;
create trigger player_items_accrual before update or delete on game.player_items
  for each row execute function game._items_accrual();

-- Walk over a podium (or the base's collect pad) to bank its cash.
create or replace function game.act_collect(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; amt bigint; total bigint := 0; got jsonb := '[]'::jsonb; bal bigint;
begin
  perform 1 from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  for pi in
    select * from player_items where owner_id = p_pid and location = 'display'
      and (p_piid is null or id = p_piid)
    order by slot for update
  loop
    amt := game._pending(pi);
    if amt > 0 then
      update player_items set accrued_at = now() where id = pi.id;
      total := total + amt;
      got := got || jsonb_build_object('id', pi.id, 'slot', pi.slot, 'amount', amt);
    end if;
  end loop;
  if total > 0 then
    bal := game._credit_income(p_pid, total, 'collect');
    update player_stats set collects = collects + 1 where player_id = p_pid;
    perform game._quest_progress(p_pid, 'collects', 1);
    perform game._check_achievements(p_pid);
  else
    select cash into bal from profiles where id = p_pid;
  end if;
  return jsonb_build_object('ok', true, 'collected', total, 'items', got, 'cash', bal);
end $$;

-- ---------------------------------------------------------------------------
-- Value helpers (mutations multiply value)
-- ---------------------------------------------------------------------------
create or replace function game._base_value(p_pid uuid) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(ms.price * coalesce(m.mult, 1)), 0)::bigint from game.player_items pi
  join game.market_state ms on ms.item_id = pi.item_id
  left join game.mutations m on m.id = pi.mutation
  where pi.owner_id = p_pid and pi.location = 'display'
$$;

create or replace function game._value_of(p_items uuid[]) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(ms.price * coalesce(m.mult, 1)), 0)::bigint
  from game.player_items pi join game.market_state ms on ms.item_id = pi.item_id
  left join game.mutations m on m.id = pi.mutation
  where pi.id = any(p_items)
$$;

create or replace function game._being_carried(p_piid uuid) returns boolean
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select exists (select 1 from game.raids where player_item_id = p_piid and status = 'active' and phase = 'carry')
$$;

-- Fill display slots with the best earners. Items somebody is stealing stay put.
create or replace function game._arrange_best(p_pid uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare n int;
begin
  n := coalesce(game._slots(p_pid), 4);
  update player_items set location = 'inventory', slot = null
  where owner_id = p_pid and location = 'display'
    and not exists (select 1 from raids r where r.player_item_id = player_items.id and r.status = 'active');
  with taken as (
    select slot from player_items where owner_id = p_pid and location = 'display'
  ), free as (
    select g as slot, row_number() over (order by g) as k
    from generate_series(0, n - 1) g where g not in (select slot from taken)
  ), c as (
    select pi.id, row_number() over (order by i.base_income * coalesce(m.mult, 1) desc, pi.acquired_at, pi.id) as k
    from player_items pi join items i on i.id = pi.item_id left join mutations m on m.id = pi.mutation
    where pi.owner_id = p_pid and pi.location = 'inventory'
  )
  update player_items set location = 'display', slot = free.slot
  from c join free on free.k = c.k
  where player_items.id = c.id;
end $$;

-- ---------------------------------------------------------------------------
-- Base management: nothing moves while a thief is running off with it
-- ---------------------------------------------------------------------------
create or replace function game.act_place(p_pid uuid, p_piid uuid, p_slot int) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; occ record; n int; v_slot int := p_slot;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if game._being_carried(p_piid) then raise exception 'A thief is running off with that — chase them!'; end if;
  n := game._slots(p_pid);
  if v_slot is null then
    if pi.location = 'display' then return jsonb_build_object('ok', true, 'slot', pi.slot); end if;
    v_slot := game._free_slot(p_pid);
    if v_slot is null then raise exception 'Your base is full — upgrade it or swap an item out.'; end if;
  end if;
  if v_slot < 0 or v_slot >= n then raise exception 'That display slot doesn''t exist.'; end if;
  if pi.location = 'display' and pi.slot = v_slot then return jsonb_build_object('ok', true, 'slot', v_slot); end if;
  select * into occ from player_items
  where owner_id = p_pid and location = 'display' and slot = v_slot and id <> p_piid for update;
  if found then
    if game._being_carried(occ.id) then raise exception 'A thief is running off with the item in that slot!'; end if;
    if pi.location = 'display' then
      update player_items set slot = -1 where id = occ.id;
      update player_items set slot = v_slot where id = p_piid;
      update player_items set slot = pi.slot where id = occ.id;
    else
      update player_items set location = 'inventory', slot = null where id = occ.id;
      update player_items set location = 'display', slot = v_slot where id = p_piid;
    end if;
  else
    update player_items set location = 'display', slot = v_slot where id = p_piid;
  end if;
  return jsonb_build_object('ok', true, 'slot', v_slot);
end $$;

create or replace function game.act_store(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if pi.location = 'inventory' then return jsonb_build_object('ok', true); end if;
  if game._being_carried(p_piid) then raise exception 'A thief is running off with that — chase them!'; end if;
  update player_items set location = 'inventory', slot = null where id = p_piid;
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_vault(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; cap int; used int; saved boolean;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'vault' then return jsonb_build_object('ok', true); end if;
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if game._being_carried(p_piid) then
    raise exception 'Too late for the vault — it''s already out the door. Chase the thief!';
  end if;
  cap := game._vault_capacity(p_pid);
  select count(*) into used from player_items where owner_id = p_pid and location = 'vault';
  if used >= cap then raise exception 'Your vault is full (%/%). Upgrade it to protect more items.', used, cap; end if;
  saved := game._under_raid(p_piid);
  update player_items set location = 'vault', slot = null where id = p_piid;
  return jsonb_build_object('ok', true, 'saved_from_raid', saved);
end $$;

create or replace function game.act_auto_arrange(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  perform 1 from profiles where id = p_pid for update;
  perform game._arrange_best(p_pid);
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_quick_sell(p_pid uuid, p_piid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; mprice bigint; v_price bigint; bal bigint;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.soulbound then raise exception 'Your starter item can''t be sold.'; end if;
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  if pi.hot_until > now() then
    raise exception 'That item is too hot to sell — wait %s.', ceil(extract(epoch from pi.hot_until - now()));
  end if;
  if game._under_raid(p_piid) then raise exception 'Someone is stealing that right now — lock up or chase them!'; end if;
  select price into mprice from market_state where item_id = pi.item_id;
  v_price := greatest(1, floor(mprice * game._mut_mult(pi.mutation) * 0.6))::bigint;
  perform game._settle(p_pid);
  delete from player_items where id = p_piid;
  insert into item_log (player_item_id, item_id, from_id, to_id, via, amount)
  values (p_piid, pi.item_id, p_pid, null, 'quick_sell', v_price);
  insert into market_sales (item_id, price, seller_id, kind)
  values (pi.item_id, round(v_price / game._mut_mult(pi.mutation))::bigint, p_pid, 'quick_sell');
  bal := game._cash(p_pid, v_price, 'quick_sell', jsonb_build_object('item_id', pi.item_id, 'mutation', pi.mutation));
  update market_state set demand = greatest(0, demand - 1) where item_id = pi.item_id;
  update player_stats set quick_sales = quick_sales + 1 where player_id = p_pid;
  perform game._quest_progress(p_pid, 'sell_item', 1);
  perform game._xp(p_pid, 10, 'sell');
  perform game._check_achievements(p_pid);
  return jsonb_build_object('ok', true, 'price', v_price, 'cash', bal);
end $$;

-- ---------------------------------------------------------------------------
-- Market: listing bounds and price discovery use the mutation-adjusted value
-- ---------------------------------------------------------------------------
create or replace function game.act_list(p_pid uuid, p_piid uuid, p_price bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; mprice numeric; lo bigint; hi bigint; lid uuid; it record;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.soulbound then raise exception 'Your starter item can''t be sold.'; end if;
  if pi.location = 'listed' then raise exception 'That item is already listed.'; end if;
  if pi.hot_until > now() then
    raise exception 'That item is too hot to sell — wait %s.', ceil(extract(epoch from pi.hot_until - now()));
  end if;
  if game._under_raid(p_piid) then raise exception 'Someone is stealing that right now!'; end if;
  select i.* into it from items i where i.id = pi.item_id;
  if not it.tradeable then raise exception 'That item can''t be traded.'; end if;
  select price * game._mut_mult(pi.mutation) into mprice from market_state where item_id = pi.item_id;
  lo := greatest(1, floor(mprice * 0.25))::bigint;
  hi := floor(mprice * 5)::bigint;
  if p_price is null or p_price < lo or p_price > hi then
    raise exception 'Price must be between % and %.', game.fmt_money(lo), game.fmt_money(hi);
  end if;
  if (select count(*) from market_listings where seller_id = p_pid and status = 'active') >= 20 then
    raise exception 'You can have at most 20 active listings.';
  end if;
  perform game._settle(p_pid);
  update player_items set location = 'listed', slot = null where id = p_piid;
  insert into market_listings (seller_id, player_item_id, item_id, price)
  values (p_pid, p_piid, pi.item_id, p_price) returning id into lid;
  update market_state set listed = listed + 1 where item_id = pi.item_id;
  return jsonb_build_object('ok', true, 'listing_id', lid);
end $$;

create or replace function game.act_buy_listing(p_pid uuid, p_lid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare l record; fee bigint; bal bigint; it record; bname text; sname text; sbot boolean; v_slot int;
        v_mult numeric; v_norm numeric;
begin
  select * into l from market_listings where id = p_lid for update;
  if not found or l.status <> 'active' then raise exception 'That listing is no longer available.'; end if;
  if l.seller_id = p_pid then raise exception 'You can''t buy your own listing.'; end if;
  perform 1 from profiles where id in (p_pid, l.seller_id) order by id for update;
  select username into bname from profiles where id = p_pid;
  if bname is null then raise exception 'Create your player first.'; end if;
  select username, is_bot into sname, sbot from profiles where id = l.seller_id;
  select i.*, r.tier into it from items i join rarities r on r.id = i.rarity where i.id = l.item_id;
  select game._mut_mult(mutation) into v_mult from player_items where id = l.player_item_id;
  v_norm := l.price / coalesce(v_mult, 1);
  perform game._settle(p_pid);
  bal := game._cash(p_pid, -l.price, 'market_buy', jsonb_build_object('listing_id', p_lid, 'item_id', l.item_id));
  fee := ceil(l.price * 0.05)::bigint;
  perform game._cash(l.seller_id, l.price - fee, 'market_sale',
    jsonb_build_object('listing_id', p_lid, 'item_id', l.item_id, 'fee', fee));
  perform game._transfer(l.player_item_id, p_pid, 'market', l.price);
  update market_listings set status = 'sold', buyer_id = p_pid, resolved_at = now() where id = p_lid;
  insert into market_sales (item_id, price, seller_id, buyer_id, kind)
  values (l.item_id, round(v_norm)::bigint, l.seller_id, p_pid, 'listing');
  update market_state set
    price = greatest(1, round(price * 0.85 + greatest(price * 0.6, least(price * 1.6, v_norm)) * 0.15)),
    demand = least(100, demand + 2),
    listed = greatest(0, listed - 1)
  where item_id = l.item_id;
  update player_stats set market_buys = market_buys + 1 where player_id = p_pid;
  update player_stats set market_sales = market_sales + 1 where player_id = l.seller_id;
  perform game._quest_progress(p_pid, 'complete_trades', 1);
  perform game._quest_progress(l.seller_id, 'complete_trades', 1);
  perform game._quest_progress(l.seller_id, 'sell_item', 1);
  perform game._xp(p_pid, 15, 'market');
  perform game._xp(l.seller_id, 15, 'market');
  v_slot := game._autoplace(p_pid, l.player_item_id);
  perform game._check_achievements(p_pid);
  perform game._check_achievements(l.seller_id);
  perform game._emit('listing_sold', l.seller_id, p_pid, jsonb_build_object(
    'buyer', bname, 'item_id', l.item_id, 'item', it.name, 'price', l.price, 'fee', fee));
  if it.tier >= 6 then
    perform game._emit('big_sale', null, p_pid, jsonb_build_object(
      'buyer', bname, 'seller', sname, 'item_id', l.item_id, 'item', it.name, 'rarity', it.rarity, 'price', l.price));
  end if;
  return jsonb_build_object('ok', true, 'price', l.price, 'cash', bal, 'player_item_id', l.player_item_id,
                            'placed', v_slot is not null);
end $$;

-- ---------------------------------------------------------------------------
-- Drops can come out mutated (3%)
-- ---------------------------------------------------------------------------
create or replace function game.act_open_drop(p_pid uuid, p_drop text, p_use_token boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; d record; ev record; tokens int; v_item text; v_id uuid; is_new boolean; bal bigint;
        v_slot int; it record; pi game.player_items; v_mut text;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into d from drop_types where id = p_drop;
  if not found then raise exception 'Unknown drop.'; end if;
  if p.level < d.min_level then raise exception '% unlocks at level %.', d.name, d.min_level; end if;
  if d.event_only then
    select * into ev from game._current_event();
    if ev.type_id is null then raise exception 'Event Drops are only available during live events.'; end if;
  end if;
  if d.requires_key and p.secret_keys < 1 then
    raise exception 'You need a Secret Key to open the %.', d.name;
  end if;
  perform game._settle(p_pid);
  if p_use_token then
    tokens := coalesce((p.drop_tokens->>p_drop)::int, 0);
    if tokens < 1 then raise exception 'You have no free % tokens.', d.name; end if;
    perform game._add_tokens(p_pid, p_drop, -1);
  else
    perform game._cash(p_pid, -d.price, 'drop', jsonb_build_object('drop', p_drop));
  end if;
  if d.requires_key then
    update profiles set secret_keys = secret_keys - 1 where id = p_pid;
  end if;

  v_item := game._roll_drop(p_pid, p_drop, p.is_bot);
  begin
    is_new := not exists (select 1 from player_collection where player_id = p_pid and item_id = v_item);
    v_id := game._grant(p_pid, v_item, 'drop');
  exception when others then
    if sqlerrm <> 'SOLD_OUT' then raise; end if;
    select id into v_item from items where rarity = 'ultra' and droppable order by random() limit 1;
    is_new := not exists (select 1 from player_collection where player_id = p_pid and item_id = v_item);
    v_id := game._grant(p_pid, v_item, 'drop');
  end;
  v_mut := game._roll_mutation(0.03);
  if v_mut is not null then
    update player_items set mutation = v_mut where id = v_id;
    update player_stats set mutations_found = mutations_found + 1 where player_id = p_pid;
  end if;

  update player_stats set drops_opened = drops_opened + 1,
                          events_joined = events_joined + (d.event_only)::int
  where player_id = p_pid;
  v_slot := game._autoplace(p_pid, v_id);
  if not p.is_bot then
    perform game._quest_progress(p_pid, 'open_drops', 1);
    perform game._xp(p_pid, d.xp, 'drop');
    if v_mut is not null then
      perform game._quest_progress(p_pid, 'mutations', 1);
      perform game._achieve(p_pid, 'first_mutation');
      if v_mut = 'rainbow' then perform game._achieve(p_pid, 'rainbow'); end if;
    end if;
    perform game._check_achievements(p_pid);
  end if;

  select i.*, r.xp as rxp into it from items i join rarities r on r.id = i.rarity where i.id = v_item;
  select * into pi from player_items where id = v_id;
  select cash into bal from profiles where id = p_pid;
  return jsonb_build_object(
    'player_item', game._item_json(pi),
    'item_id', v_item, 'rarity', it.rarity, 'serial', pi.serial, 'is_new', is_new,
    'placed', v_slot is not null, 'slot', v_slot, 'mutation', v_mut,
    'xp', d.xp + it.rxp, 'cash', bal, 'drop', p_drop);
end $$;

-- ---------------------------------------------------------------------------
-- The Tech Belt
-- ---------------------------------------------------------------------------
-- Schedule items onto the belt up to 25 seconds ahead.
create or replace function game._belt_fill() returns int
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare nxt timestamptz; horizon timestamptz := now() + interval '25 seconds'; n int := 0; rar text;
        v_item text; v_mut text; ev record; mprice bigint; w jsonb; cat text; secs numeric := 36;
begin
  select belt_next_at into nxt from world where id = 1 for update;
  -- first run (or after a long sleep): start far enough back that the whole belt is already full
  if nxt is null or nxt < now() - make_interval(secs => secs) then nxt := now() - make_interval(secs => secs - 1); end if;
  select * into ev from game._current_event();
  w := '{"common": 460, "uncommon": 280, "rare": 140, "epic": 70, "legendary": 32, "mythic": 12,
         "ultra": 4.5, "limited": 0.8, "secret": 0.7}'::jsonb;
  while nxt < horizon and n < 40 loop
    rar := game._roll_rarity(w, 0, coalesce(ev.luck_mult, 1));
    v_item := null;
    if rar in ('limited', 'secret') then
      select i.id into v_item from items i join limited_item_supply s on s.item_id = i.id
      where i.rarity = rar and i.droppable and s.minted < s.max_supply
      order by random() limit 1;
    else
      cat := case when ev.category is not null and random() < 0.5 then ev.category else null end;
      select i.id into v_item from items i
      where i.rarity = rar and i.droppable and (cat is null or i.category = cat)
      order by random() limit 1;
      if v_item is null then
        select i.id into v_item from items i where i.rarity = rar and i.droppable order by random() limit 1;
      end if;
    end if;
    if v_item is not null then
      v_mut := game._roll_mutation(0.15);
      select price into mprice from market_state where item_id = v_item;
      insert into belt (item_id, mutation, price, spawned_at, ends_at)
      values (v_item, v_mut, greatest(1, ceil(mprice * game._mut_mult(v_mut) * 1.05))::bigint,
              nxt, nxt + make_interval(secs => secs));
      n := n + 1;
    end if;
    nxt := nxt + make_interval(secs => 2.2 + random() * 1.6);
  end loop;
  update world set belt_next_at = nxt where id = 1;
  delete from belt where ends_at < now() - interval '10 minutes';
  return n;
end $$;

create or replace function game.act_buy_belt(p_pid uuid, p_belt bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; p record; it record; v_id uuid; v_slot int; bal bigint; is_new boolean;
        pi game.player_items; bname text;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into b from belt where id = p_belt for update;
  if not found then raise exception 'That item already left the belt.'; end if;
  if b.sold_to is not null then
    select username into bname from profiles where id = b.sold_to;
    raise exception 'Too slow! % grabbed it first.', coalesce(bname, 'Someone');
  end if;
  if now() < b.spawned_at then raise exception 'That item hasn''t rolled onto the belt yet.'; end if;
  if now() > b.ends_at + interval '1 second' then raise exception 'That item already left the belt.'; end if;
  select i.*, r.tier into it from items i join rarities r on r.id = i.rarity where i.id = b.item_id;
  perform game._settle(p_pid);
  bal := game._cash(p_pid, -b.price, 'belt_buy', jsonb_build_object('belt_id', b.id, 'item_id', b.item_id));
  is_new := not exists (select 1 from player_collection where player_id = p_pid and item_id = b.item_id);
  begin
    v_id := game._grant(p_pid, b.item_id, 'belt');
  exception when others then
    if sqlerrm = 'SOLD_OUT' then raise exception '% just sold out!', it.name; end if;
    raise;
  end;
  if b.mutation is not null then update player_items set mutation = b.mutation where id = v_id; end if;
  update belt set sold_to = p_pid, sold_at = now(), player_item_id = v_id where id = b.id;
  v_slot := game._autoplace(p_pid, v_id);
  update market_state set demand = least(100, demand + 1.5) where item_id = b.item_id;
  update player_stats set belt_buys = belt_buys + 1,
                          mutations_found = mutations_found + (b.mutation is not null)::int
  where player_id = p_pid;
  if not p.is_bot then
    perform game._quest_progress(p_pid, 'belt_buys', 1);
    perform game._xp(p_pid, 5 + it.tier * 3, 'belt');
    if b.mutation is not null then
      perform game._quest_progress(p_pid, 'mutations', 1);
      perform game._achieve(p_pid, 'first_mutation');
      if b.mutation = 'rainbow' then perform game._achieve(p_pid, 'rainbow'); end if;
    end if;
    if it.tier >= 5 then perform game._achieve(p_pid, 'belt_sniper'); end if;
    perform game._check_achievements(p_pid);
  end if;
  if (it.tier between 5 and 6) or b.mutation in ('glitch', 'rainbow') then
    perform game._emit('belt_buy', null, p_pid, jsonb_build_object(
      'player', p.username, 'item_id', b.item_id, 'item', it.name, 'rarity', it.rarity,
      'mutation', b.mutation, 'price', b.price, 'is_bot', p.is_bot));
  end if;
  select * into pi from player_items where id = v_id;
  select cash into bal from profiles where id = p_pid;
  return jsonb_build_object('ok', true, 'player_item', game._item_json(pi), 'belt_id', b.id,
    'item_id', b.item_id, 'rarity', it.rarity, 'mutation', b.mutation, 'serial', pi.serial,
    'is_new', is_new, 'placed', v_slot is not null, 'slot', v_slot, 'price', b.price, 'cash', bal);
end $$;

create or replace function game.q_belt(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object('server_time', game._now_ms(), 'seconds', 36,
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'id', b.id, 'item_id', b.item_id, 'mutation', b.mutation, 'price', b.price,
      'spawned_at', b.spawned_at, 'ends_at', b.ends_at, 'sold_to', b.sold_to, 'buyer', p.username,
      'sold_at', b.sold_at, 'mine', b.sold_to = p_pid) order by b.spawned_at), '[]'::jsonb))
  from game.belt b left join game.profiles p on p.id = b.sold_to
  where b.spawned_at < now() + interval '30 seconds'
    and ((b.sold_to is null and b.ends_at > now() - interval '2 seconds')
         or b.sold_at > now() - interval '12 seconds')
$$;

-- NPCs shop the belt too — but only once an item is well along, so humans get first pick.
create or replace function game._bot_belt() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; v_bot uuid; n int := 0; extra int;
begin
  for b in
    select bl.id, bl.price, bl.mutation, r.tier
    from belt bl join items i on i.id = bl.item_id join rarities r on r.id = i.rarity
    where bl.sold_to is null and bl.spawned_at < now() - interval '15 seconds'
      and bl.ends_at > now() + interval '2 seconds'
    order by r.tier desc, bl.price desc limit 6
  loop
    if random() < (case when b.tier >= 7 then 0.45 when b.tier >= 5 then 0.3 when b.tier >= 3 then 0.12 else 0.05 end
                   + case when b.mutation is not null then 0.1 else 0 end) then
      select p.id into v_bot from profiles p
      where p.is_bot and p.cash > b.price * 1.5 and not coalesce((p.bot->>'tutorial')::boolean, false)
      order by random() limit 1;
      if v_bot is not null then
        begin
          perform game.act_buy_belt(v_bot, b.id);
          perform game._arrange_best(v_bot);
          select count(*) into extra from player_items where owner_id = v_bot and location = 'inventory';
          if extra > 5 then
            perform game.act_quick_sell(v_bot, x.id) from (
              select pi.id from player_items pi join items i on i.id = pi.item_id
              where pi.owner_id = v_bot and pi.location = 'inventory' and not pi.soulbound
                and (pi.hot_until is null or pi.hot_until < now())
              order by i.base_income asc limit 1) x;
          end if;
          n := n + 1;
        exception when others then null;
        end;
      end if;
    end if;
    exit when n >= 2;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Base lock: lasers on the door. 30s + 10s per security level, then a short recharge.
-- ---------------------------------------------------------------------------
create or replace function game.act_lock_base(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; dur int; v_until timestamptz;
begin
  perform 1 from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into b from bases where player_id = p_pid for update;
  if b.lock_until > now() then
    raise exception 'Already locked — %s left.', ceil(extract(epoch from b.lock_until - now()));
  end if;
  if b.lock_until > now() - interval '10 seconds' then
    raise exception 'Lasers recharging — ready in %s.', ceil(extract(epoch from b.lock_until + interval '10 seconds' - now()));
  end if;
  dur := 30 + 10 * b.security_level;
  v_until := now() + make_interval(secs => dur);
  update bases set lock_until = v_until where player_id = p_pid;
  perform game._quest_progress(p_pid, 'lock_base', 1);
  return jsonb_build_object('ok', true, 'lock_until', v_until, 'seconds', dur);
end $$;

-- ---------------------------------------------------------------------------
-- Raids: GRAB (security roll at the podium) → CARRY (run it home)
-- ---------------------------------------------------------------------------
-- Grab time: quick for cheap items in weak bases, slow for secrets behind quantum locks.
create or replace function game._raid_seconds(p_def uuid, p_item text, p_revenge boolean) returns numeric
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select greatest(3, 2 + b.security_level + ra.steal_extra_seconds - case when p_revenge then 1 else 0 end)::numeric
  from game.bases b, game.items i join game.rarities ra on ra.id = i.rarity
  where b.player_id = p_def and i.id = p_item
$$;

create or replace function game._raid_block_reason(p_att uuid, p_def uuid, p_revenge boolean) returns text
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare d record; b record;
begin
  if p_att = p_def then return 'That''s your own base.'; end if;
  select * into d from profiles where id = p_def;
  if not found then return 'Player not found.'; end if;
  select * into b from bases where player_id = p_def;
  if not d.is_bot and d.level < 3 then return d.username || ' is under new-player protection.'; end if;
  if b.lock_until > now() then
    return d.username || '''s base is LOCKED for ' || ceil(extract(epoch from b.lock_until - now()))::text || 's.';
  end if;
  if not p_revenge and b.shield_until > now() then
    return d.username || '''s base is shielded for ' || ceil(extract(epoch from b.shield_until - now()))::text || 's.';
  end if;
  return null;
end $$;

create or replace function game._raid_result(p_raid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'raid_id', r.id, 'status', r.status, 'phase', r.phase, 'item_id', r.item_id, 'player_item_id', r.player_item_id,
    'attacker_id', r.attacker_id, 'attacker', a.username, 'defender_id', r.defender_id, 'defender', d.username,
    'defended', r.defended, 'fine', r.fine, 'chance', r.chance, 'note', r.note, 'is_revenge', r.is_revenge,
    'is_tutorial', r.is_tutorial, 'resolved_at', r.resolved_at, 'ends_at', r.ends_at,
    'grabbed_at', r.grabbed_at, 'carry_until', r.carry_until, 'deliver_after', r.deliver_after,
    'mutation', (select pi.mutation from game.player_items pi where pi.id = r.player_item_id))
  from game.raids r
  join game.profiles a on a.id = r.attacker_id
  join game.profiles d on d.id = r.defender_id
  where r.id = p_raid
$$;

create or replace function game.act_start_steal(p_pid uuid, p_piid uuid, p_revenge boolean default false) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare a record; pi record; d record; it record; v_chance numeric; dur numeric; rid uuid; tut boolean := false;
        ends timestamptz; reason text; rv uuid;
begin
  select * into a from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if a.raid_cooldown_until > now() then
    raise exception 'You''re laying low — you can raid again in %s.', ceil(extract(epoch from a.raid_cooldown_until - now()));
  end if;
  if exists (select 1 from raids where attacker_id = p_pid and status = 'active') then
    raise exception 'You''re already in the middle of a raid.';
  end if;
  select * into pi from player_items where id = p_piid for update;
  if not found then raise exception 'That item is gone.'; end if;
  if pi.owner_id = p_pid then raise exception 'You can''t steal from yourself.'; end if;
  if pi.location <> 'display' then raise exception 'That item isn''t on display any more.'; end if;
  if pi.soulbound then raise exception 'Starter items can''t be stolen.'; end if;
  reason := game._raid_block_reason(p_pid, pi.owner_id, p_revenge);
  if reason is not null then raise exception '%', reason; end if;
  if game._under_raid(p_piid) then raise exception 'Someone else is already stealing that!'; end if;
  select * into d from profiles where id = pi.owner_id;
  if p_revenge then
    rv := game._revenge_row(p_pid, pi.owner_id);
    if rv is null then raise exception 'You have no revenge available against %.', d.username; end if;
    update raids set revenge_used = true where id = rv;
  end if;
  select i.*, r.tier into it from items i join rarities r on r.id = i.rarity where i.id = pi.item_id;
  v_chance := game._raid_chance(p_pid, pi.owner_id, pi.item_id, p_revenge);
  dur := game._raid_seconds(pi.owner_id, pi.item_id, p_revenge);
  if coalesce((d.bot->>'tutorial')::boolean, false) and a.tutorial_step between 8 and 11
     and not coalesce((a.tutorial_flags->>'tutorial_raid')::boolean, false) then
    tut := true; v_chance := 1.0; dur := 3;  -- the one-time beginner raid always works
  end if;
  if not a.is_bot and not d.is_bot then
    dur := greatest(dur, 6);  -- a real owner always gets a moment to react
  end if;
  ends := now() + make_interval(secs => dur);
  insert into raids (attacker_id, defender_id, player_item_id, item_id, chance, ends_at, is_revenge, is_tutorial, phase)
  values (p_pid, pi.owner_id, p_piid, pi.item_id, v_chance, ends, p_revenge, tut, 'grab')
  returning id into rid;
  perform game._emit('raid_warning', pi.owner_id, p_pid, jsonb_build_object(
    'raid_id', rid, 'attacker', a.username, 'attacker_id', p_pid, 'item_id', pi.item_id, 'item', it.name,
    'rarity', it.rarity, 'player_item_id', p_piid, 'ends_at', ends, 'revenge', p_revenge));
  if it.tier >= 7 then
    perform game._emit('raid_alert', null, null, jsonb_build_object(
      'item_id', pi.item_id, 'item', it.name, 'rarity', it.rarity, 'defender', d.username));
  end if;
  return jsonb_build_object('raid_id', rid, 'ends_at', ends, 'started_at', now(), 'duration', dur,
    'chance', v_chance, 'item_id', pi.item_id, 'player_item_id', p_piid, 'defender', d.username,
    'defender_id', d.id, 'tutorial', tut, 'revenge', p_revenge, 'phase', 'grab', 'mutation', pi.mutation);
end $$;

-- The owner changed the item before the thief got it out.
create or replace function game._block_raid(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; d record; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  select * into d from profiles where id = r.defender_id;
  update raids set status = 'blocked', resolved_at = now(), note = 'The owner locked it away just in time!'
  where id = p_raid;
  update profiles set raid_cooldown_until = now() + interval '15 seconds' where id = r.attacker_id;
  perform game._quest_progress(r.attacker_id, 'raid_players', 1);
  if not d.is_bot then
    update player_stats set raids_defended = raids_defended + 1 where player_id = d.id;
    perform game._xp(d.id, 25, 'defend');
    perform game._check_achievements(d.id);
  end if;
  res := game._raid_result(p_raid);
  perform game._emit('raid_result', r.attacker_id, r.defender_id, res);
  perform game._emit('raid_over', r.defender_id, r.attacker_id, res);
  return res;
end $$;

create or replace function game._fail_raid(p_raid uuid, p_defended boolean, p_note text, p_fine boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; a record; d record; it record; mprice bigint; v_fine bigint := 0; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  perform 1 from profiles where id in (r.attacker_id, r.defender_id) order by id for update;
  select * into a from profiles where id = r.attacker_id;
  select * into d from profiles where id = r.defender_id;
  select i.*, ra.tier into it from items i join rarities ra on ra.id = i.rarity where i.id = r.item_id;
  select price into mprice from market_state where item_id = r.item_id;
  if p_fine and not r.is_tutorial then
    v_fine := least(floor(a.cash * 0.03), floor(coalesce(mprice, it.base_value) * 0.05))::bigint;
  end if;
  if v_fine > 0 then
    perform game._cash(r.attacker_id, -v_fine, 'raid_fine', jsonb_build_object('raid_id', p_raid));
    perform game._cash(r.defender_id, v_fine, 'raid_bounty', jsonb_build_object('raid_id', p_raid));
  end if;
  update profiles set raid_cooldown_until = now() + case when p_defended then interval '60 seconds' else interval '40 seconds' end
  where id = r.attacker_id;
  update player_stats set steals_failed = steals_failed + 1 where player_id = r.attacker_id;
  if p_defended then
    update player_stats set raids_defended = raids_defended + 1 where player_id = r.defender_id;
    perform game._xp(r.defender_id, 25, 'defend');
  end if;
  update raids set status = 'failed', fine = v_fine, resolved_at = now(),
    defended = defended or p_defended,
    defended_at = case when p_defended then coalesce(defended_at, now()) else defended_at end,
    note = p_note
  where id = p_raid;
  perform game._xp(r.attacker_id, 5, 'raid');
  perform game._quest_progress(r.attacker_id, 'raid_players', 1);
  perform game._check_achievements(r.attacker_id);
  perform game._check_achievements(r.defender_id);
  res := game._raid_result(p_raid) || jsonb_build_object('item', it.name, 'rarity', it.rarity);
  perform game._emit('raid_result', r.attacker_id, r.defender_id, res);
  perform game._emit('raid_over', r.defender_id, r.attacker_id, res);
  return res;
end $$;

-- The thief made it home: the item changes hands.
create or replace function game._complete_steal(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; a record; d record; pi record; it record; mprice bigint; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  perform 1 from profiles where id in (r.attacker_id, r.defender_id) order by id for update;
  select * into a from profiles where id = r.attacker_id;
  select * into d from profiles where id = r.defender_id;
  select i.*, ra.tier, ra.xp as rxp into it from items i join rarities ra on ra.id = i.rarity where i.id = r.item_id;
  select price into mprice from market_state where item_id = r.item_id;
  select * into pi from player_items where id = r.player_item_id for update;
  if pi.id is null or pi.owner_id <> r.defender_id or pi.location <> 'display' then
    return game._block_raid(p_raid);
  end if;
  perform game._settle(r.defender_id);
  perform game._transfer(r.player_item_id, r.attacker_id, 'steal', null, interval '5 minutes');
  update bases set shield_until = now() + case when d.is_bot then interval '45 seconds' else interval '10 minutes' end
  where player_id = r.defender_id;
  update profiles set raid_cooldown_until = now() + interval '20 seconds' where id = r.attacker_id;
  update player_stats set steals_won = steals_won + 1, best_item_value = greatest(best_item_value, mprice)
  where player_id = r.attacker_id;
  update player_stats set times_robbed = times_robbed + 1 where player_id = r.defender_id;
  update raids set status = 'success', resolved_at = now() where id = p_raid;
  if r.is_tutorial then
    update profiles set tutorial_flags = tutorial_flags || '{"tutorial_raid": true}'::jsonb where id = r.attacker_id;
  end if;
  perform game._settle(r.attacker_id);
  perform game._autoplace(r.attacker_id, r.player_item_id);
  perform game._xp(r.attacker_id, 40 + it.rxp, 'steal');
  perform game._quest_progress(r.attacker_id, 'raid_players', 1);
  if pi.mutation = 'rainbow' then perform game._achieve(r.attacker_id, 'rainbow'); end if;
  perform game._check_achievements(r.attacker_id);
  res := game._raid_result(p_raid);
  perform game._emit('raid_result', r.attacker_id, r.defender_id,
    res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
  perform game._emit('item_stolen', r.defender_id, r.attacker_id,
    res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
  if it.tier >= 5 then
    perform game._emit('steal', null, r.attacker_id, jsonb_build_object(
      'attacker', a.username, 'defender', d.username, 'item_id', it.id, 'item', it.name, 'rarity', it.rarity,
      'revenge', r.is_revenge, 'mutation', pi.mutation));
  end if;
  return res;
end $$;

-- Grab time is up: roll the security check. Pass → the thief is off and running.
create or replace function game._resolve_grab(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; a record; d record; pi record; it record; v_defended boolean; eff numeric; ok boolean; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if not found then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' or r.phase <> 'grab' then return game._raid_result(p_raid); end if;
  select * into a from profiles where id = r.attacker_id;
  select * into d from profiles where id = r.defender_id;
  select * into pi from player_items where id = r.player_item_id;
  if pi.id is null or pi.owner_id <> r.defender_id or pi.location <> 'display' then
    return game._block_raid(p_raid);
  end if;
  v_defended := r.defended;
  if d.is_bot and not v_defended and not r.is_tutorial then
    v_defended := random() < coalesce((d.bot->>'defend')::numeric, 0.2);
    if v_defended then update raids set defended = true, defended_at = now() where id = p_raid; end if;
  end if;
  eff := r.chance * case when v_defended then 0.3 else 1 end;
  ok := random() < eff;
  if not ok then
    return game._fail_raid(p_raid, v_defended,
      case when v_defended then 'The alarm went off — ZAPPED!' else 'The security lasers ZAPPED you!' end, true);
  end if;
  if a.is_bot and d.is_bot then
    update raids set phase = 'carry', grabbed_at = now(), carry_until = now(), deliver_after = now() where id = p_raid;
    return game._complete_steal(p_raid);
  end if;
  update raids set phase = 'carry', grabbed_at = now(),
    carry_until = now() + interval '45 seconds',
    deliver_after = now() + case when a.is_bot then make_interval(secs => 9 + random() * 4)
                                 when r.is_tutorial then interval '1 second'
                                 else interval '3 seconds' end
  where id = p_raid;
  select name, rarity into it from items where id = r.item_id;
  res := game._raid_result(p_raid) || jsonb_build_object('item', it.name, 'rarity', it.rarity);
  perform game._emit('raid_grabbed', r.defender_id, r.attacker_id, res);
  return res;
end $$;

-- Resolve whatever is due on a raid (used by the world tick and by sync).
create or replace function game._resolve_raid(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; abot boolean;
begin
  select * into r from raids where id = p_raid for update;
  if not found then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  if r.phase = 'grab' then return game._resolve_grab(p_raid); end if;
  select is_bot into abot from profiles where id = r.attacker_id;
  if abot then
    if now() >= r.deliver_after then return game._complete_steal(p_raid); end if;
    return game._raid_result(p_raid);
  end if;
  if now() > r.carry_until then
    return game._fail_raid(p_raid, false, 'Too slow — the item snapped back to its podium.', false);
  end if;
  return game._raid_result(p_raid);
end $$;

-- The thief finished grabbing.
create or replace function game.act_finish_steal(p_pid uuid, p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  select * into r from raids where id = p_raid;
  if not found or r.attacker_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' or r.phase <> 'grab' then return game._raid_result(p_raid); end if;
  if now() < r.ends_at - interval '750 milliseconds' then
    raise exception 'Still grabbing… %s to go!', ceil(extract(epoch from r.ends_at - now()));
  end if;
  return game._resolve_grab(p_raid);
end $$;

-- The thief reached their own base.
create or replace function game.act_deliver_steal(p_pid uuid, p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  select * into r from raids where id = p_raid for update;
  if not found or r.attacker_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  if r.phase <> 'carry' then raise exception 'Grab it first!'; end if;
  if now() < r.deliver_after - interval '500 milliseconds' then
    raise exception 'Keep running — %s!', ceil(extract(epoch from r.deliver_after - now()));
  end if;
  if now() > r.carry_until + interval '3 seconds' then
    return game._fail_raid(p_raid, false, 'Too slow — the item snapped back to its podium.', false);
  end if;
  return game._complete_steal(p_raid);
end $$;

-- The thief backs off, or reports being caught by the owner's security.
create or replace function game.act_abort_steal(p_pid uuid, p_raid uuid, p_reason text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; dname text; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if not found or r.attacker_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  select username into dname from profiles where id = r.defender_id;
  if p_reason = 'caught' then
    return game._fail_raid(p_raid, true, 'Caught by ' || dname || '''s security!', true);
  end if;
  res := game._fail_raid(p_raid, false, 'You backed off.', false);
  update profiles set raid_cooldown_until = now() + interval '8 seconds' where id = p_pid;
  return res;
end $$;

-- The owner fights back. Tag = you caught the thief in person (grab or carry).
drop function if exists game.act_defend(uuid, uuid);
create or replace function game.act_defend(p_pid uuid, p_raid uuid, p_tag boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; dname text;
begin
  select * into r from raids where id = p_raid for update;
  if not found or r.defender_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then raise exception 'That raid is already over.'; end if;
  select username into dname from profiles where id = p_pid;
  if p_tag then
    if r.phase = 'carry' and now() > r.carry_until + interval '2 seconds' then
      raise exception 'Too late — they got away!';
    end if;
    update player_stats set thieves_caught = thieves_caught + 1 where player_id = p_pid;
    perform game._achieve(p_pid, 'tagger');
    return game._fail_raid(p_raid, true, 'Tagged by ' || dname || ' — caught red-handed!', true)
           || jsonb_build_object('ok', true, 'tagged', true);
  end if;
  if r.phase = 'carry' then raise exception 'They''re running with it — catch them to get it back!'; end if;
  if now() >= r.ends_at then raise exception 'Too late — they''re already out the door!'; end if;
  if r.defended then return jsonb_build_object('ok', true, 'already', true); end if;
  update raids set defended = true, defended_at = now() where id = p_raid;
  perform game._emit('raid_defended', r.attacker_id, p_pid, jsonb_build_object('raid_id', p_raid, 'defender', dname));
  return jsonb_build_object('ok', true);
end $$;

create or replace function game._tick_raids() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  -- Bots finish on time; humans who closed the tab get resolved fairly a few seconds later.
  for r in
    select rd.id from raids rd join profiles a on a.id = rd.attacker_id
    where rd.status = 'active' and (
      (rd.phase = 'grab' and (rd.ends_at < now() - interval '8 seconds' or (a.is_bot and rd.ends_at <= now())))
      or (rd.phase = 'carry' and ((a.is_bot and rd.deliver_after <= now()) or rd.carry_until < now() - interval '3 seconds')))
    order by rd.ends_at limit 50
  loop
    perform game._resolve_raid(r.id);
  end loop;
end $$;

-- An NPC raider targets an active human (never during the tutorial, never twice in 8 minutes).
create or replace function game._bot_raid_human() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare h record; b record; v_pi record; res jsonb;
begin
  select p.id, p.username into h from profiles p join bases bs on bs.player_id = p.id
  where not p.is_bot and p.level >= 3 and p.tutorial_step >= 99
    and p.last_seen_at > now() - interval '40 seconds'
    and (bs.shield_until is null or bs.shield_until < now())
    and (bs.lock_until is null or bs.lock_until < now())
    and not exists (select 1 from raids r where r.defender_id = p.id and r.status = 'active')
    and not exists (select 1 from raids r join profiles a on a.id = r.attacker_id
                    where r.defender_id = p.id and a.is_bot and r.started_at > now() - interval '8 minutes')
    and exists (select 1 from player_items pi where pi.owner_id = p.id and pi.location = 'display' and not pi.soulbound)
  order by random() limit 1;
  if not found then return; end if;
  select * into b from profiles p
  where p.is_bot and p.bot->>'style' in ('raider', 'whale', 'trader')
    and (p.raid_cooldown_until is null or p.raid_cooldown_until < now())
    and not exists (select 1 from raids r where r.attacker_id = p.id and r.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  select p.id into v_pi from player_items p join market_state ms on ms.item_id = p.item_id
  where p.owner_id = h.id and p.location = 'display' and not p.soulbound
    and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
  order by -ln(1 - random()) / sqrt(ms.price::double precision * game._mut_mult(p.mutation)) limit 1;
  if not found then return; end if;
  res := game.act_start_steal(b.id, v_pi.id, false);
  -- the thief needs time to walk in; the owner always gets at least 8 seconds to react before the grab
  update raids set ends_at = greatest(ends_at, started_at + interval '8 seconds') where id = (res->>'raid_id')::uuid;
  update world set last_bot_raid_at = now() where id = 1;
end $$;

-- Bot-on-bot heists keep the global feed lively.
create or replace function game._bot_heist() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare a record; d record; pi record; res jsonb;
begin
  select * into a from profiles p where p.is_bot and p.bot->>'style' in ('raider', 'whale')
    and (p.raid_cooldown_until is null or p.raid_cooldown_until < now())
    and not exists (select 1 from raids r where r.attacker_id = p.id and r.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  select p.* into d from profiles p join bases bs on bs.player_id = p.id
  where p.is_bot and p.id <> a.id and (bs.shield_until is null or bs.shield_until < now())
    and (bs.lock_until is null or bs.lock_until < now())
    and not coalesce((p.bot->>'tutorial')::boolean, false)
  order by random() limit 1;
  if not found then return; end if;
  select p.id into pi from player_items p where p.owner_id = d.id and p.location = 'display' and not p.soulbound
    and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  res := game.act_start_steal(a.id, pi.id, false);
  perform game._resolve_raid((res->>'raid_id')::uuid);
  perform game._arrange_best(a.id);
end $$;

create or replace function game._bot_market(p_bot uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; l record; pi record; mprice numeric; v_price bigint; nlist int;
begin
  select * into b from profiles where id = p_bot;
  -- Buy a fair or cheap listing (humans first).
  if random() < 0.6 then
    select ml.id, ml.price into l
    from market_listings ml join market_state ms on ms.item_id = ml.item_id
    join profiles s on s.id = ml.seller_id
    join player_items x on x.id = ml.player_item_id
    where ml.status = 'active' and ml.seller_id <> p_bot
      and ml.price <= ms.price * game._mut_mult(x.mutation) * 0.95
      and ml.price * 2 <= b.cash and ml.created_at < now() - interval '20 seconds'
    order by s.is_bot, ml.price::numeric / (ms.price * game._mut_mult(x.mutation)), random() limit 1;
    if found then
      begin
        perform game.act_buy_listing(p_bot, l.id);
        perform game._arrange_best(p_bot);
      exception when others then null;
      end;
    end if;
  end if;
  -- Cancel stale listings.
  perform game.act_cancel_listing(p_bot, x.id) from (
    select id from market_listings where seller_id = p_bot and status = 'active'
      and created_at < now() - interval '25 minutes') x;
  -- List a spare item (or occasionally a displayed one) at a markup.
  select count(*) into nlist from market_listings where seller_id = p_bot and status = 'active';
  if nlist < 3 then
    select p.id, p.item_id, p.mutation into pi from player_items p join items i on i.id = p.item_id
    where p.owner_id = p_bot and p.location in ('inventory', 'display') and not p.soulbound
      and i.rarity not in ('secret', 'limited')  -- NPCs keep their trophies on show
      and (p.hot_until is null or p.hot_until < now())
      and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
    order by (p.location = 'inventory') desc, random() limit 1;
    if found and (random() < 0.5 or exists (select 1 from player_items where id = pi.id and location = 'inventory')) then
      select price * game._mut_mult(pi.mutation) into mprice from market_state where item_id = pi.item_id;
      v_price := greatest(1, round(mprice * (1.03 + random() * 0.22)))::bigint;
      begin
        perform game.act_list(p_bot, pi.id, v_price);
      exception when others then null;
      end;
    end if;
  end if;
end $$;

-- A bot makes a cash (or item) offer for something an active human is showing off.
create or replace function game._bot_offer_trade() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare h record; b record; want record; give record; v_cash bigint;
begin
  select p.id into h from profiles p
  where not p.is_bot and p.tutorial_step >= 99 and p.last_seen_at > now() - interval '60 seconds'
    and not exists (select 1 from trades t join profiles f on f.id = t.from_id
                    where t.to_id = p.id and f.is_bot and t.status = 'pending')
  order by random() limit 1;
  if not found then return; end if;
  select pi.id, pi.item_id, ms.price * game._mut_mult(pi.mutation) as price into want
  from player_items pi join items i on i.id = pi.item_id join rarities r on r.id = i.rarity
  join market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = h.id and pi.location = 'display' and not pi.soulbound and r.tier >= 2
    and (pi.hot_until is null or pi.hot_until < now())
    and not exists (select 1 from raids rd where rd.player_item_id = pi.id and rd.status = 'active')
  order by random() limit 1;
  if not found then return; end if;
  select * into b from profiles
  where is_bot and bot->>'style' in ('trader', 'collector', 'whale') and cash > want.price * 2
  order by random() limit 1;
  if not found then return; end if;
  -- Sometimes offer an item of similar value, otherwise a cash premium.
  select pi.id, ms.price * game._mut_mult(pi.mutation) as price into give
  from player_items pi join market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = b.id and pi.location in ('inventory', 'display') and not pi.soulbound
    and (pi.hot_until is null or pi.hot_until < now())
    and ms.price * game._mut_mult(pi.mutation) between want.price * 0.9 and want.price * 1.3
    and not exists (select 1 from raids r where r.player_item_id = pi.id and r.status = 'active')
  order by random() limit 1;
  if found and random() < 0.4 then
    perform game.act_trade_propose(b.id, jsonb_build_object(
      'to', h.id, 'offer_items', jsonb_build_array(give.id), 'request_items', jsonb_build_array(want.id),
      'message', 'Straight swap? Mine''s worth a little more 😉'));
  else
    v_cash := round(want.price * (1.05 + random() * 0.2))::bigint;
    perform game.act_trade_propose(b.id, jsonb_build_object(
      'to', h.id, 'offer_cash', v_cash, 'request_items', jsonb_build_array(want.id),
      'message', 'I''ll pay over market for that. Deal?'));
  end if;
end $$;

create or replace function game._tick_bots(p_dt double precision) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; f double precision := least(1.0, p_dt / 10.0); t record;
begin
  for b in select id, bot from profiles where is_bot loop
    perform game._settle(b.id);
    update profiles set cash = least(cash, 400000000) where id = b.id;
    begin
      perform game._bot_restock(b.id);
      if random() < 0.10 * f then perform game._bot_open_drop(b.id); end if;
      if b.bot->>'style' in ('trader', 'collector', 'whale') and random() < 0.15 * f then
        perform game._bot_market(b.id);
      end if;
      -- NPCs flip their door lasers on now and then (never the tutorial base)
      if random() < 0.04 * f and not coalesce((b.bot->>'tutorial')::boolean, false) then
        update bases set lock_until = now() + make_interval(secs => 30 + 10 * security_level)
        where player_id = b.id and (lock_until is null or lock_until < now() - interval '10 seconds');
      end if;
    exception when others then
      raise warning 'bot % action failed: %', b.id, sqlerrm;
    end;
  end loop;
  -- bots answer offers after a short "think"
  for t in
    select tr.id from trades tr join profiles p on p.id = tr.to_id
    where tr.status = 'pending' and p.is_bot and tr.created_at < now() - interval '3 seconds'
    order by tr.created_at limit 10
  loop
    begin
      perform game._bot_answer_trade(t.id);
    exception when others then
      raise warning 'bot trade failed: %', sqlerrm;
    end;
  end loop;
  begin
    perform game._bot_belt();
  exception when others then
    raise warning 'bot belt failed: %', sqlerrm;
  end;
  begin
    if random() < 0.35 then perform game._bot_raid_human(); end if;
    if random() < 0.07 * f then perform game._bot_heist(); end if;
    if random() < 0.05 * f then perform game._bot_offer_trade(); end if;
  exception when others then
    raise warning 'bot social action failed: %', sqlerrm;
  end;
end $$;

create or replace function game.world_tick(p_force boolean default false) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare w record; dt double precision;
begin
  select * into w from world where id = 1 for update;
  if not p_force and w.last_tick_at is not null and w.last_tick_at > now() - interval '10 seconds' then
    return jsonb_build_object('skipped', true);
  end if;
  dt := coalesce(extract(epoch from now() - w.last_tick_at), 10);
  dt := least(greatest(dt, 1), 3600);
  update world set last_tick_at = now(), tick_count = tick_count + 1 where id = 1;
  if w.seeded_at is null then
    perform game._seed_bots();
    perform game._seed_history();
    update world set seeded_at = now(), next_event_at = now() + interval '90 seconds', last_history_at = null where id = 1;
  end if;
  perform game._tick_events();
  perform game._tick_market(dt);
  perform game._tick_history();
  perform game._tick_raids();
  perform game._belt_fill();
  perform game._tick_bots(dt);
  if w.tick_count % 30 = 0 then perform game._tick_cleanup(); end if;
  return jsonb_build_object('ok', true, 'dt', dt);
end $$;

-- ---------------------------------------------------------------------------
-- Tutorial (client and server agree):
--  1 welcome · 2 your base · 3 collect · 4 the Tech Belt · 5 mutations · 6 lock
--  7 drops · 8 another base · 9 grab · 10 carry it home · 11 market · 12 done (99)
-- ---------------------------------------------------------------------------
create or replace function game.act_tutorial(p_pid uuid, p_step int) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; basic bigint; granted bigint := 0;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if p.tutorial_step >= 99 then return jsonb_build_object('ok', true, 'step', 99); end if;
  if p_step is null or p_step <= p.tutorial_step then return jsonb_build_object('ok', true, 'step', p.tutorial_step); end if;
  if p_step >= 4 and not coalesce((p.tutorial_flags->>'belt_cash')::boolean, false)
     and not exists (select 1 from player_stats where player_id = p_pid and belt_buys > 0) then
    perform game._cash(p_pid, 600, 'tutorial', jsonb_build_object('step', 4));
    granted := granted + 600;
    update profiles set tutorial_flags = tutorial_flags || '{"belt_cash": true}'::jsonb where id = p_pid;
  end if;
  select price into basic from drop_types where id = 'basic';
  if p_step >= 7 and not coalesce((p.tutorial_flags->>'first_drop_cash')::boolean, false)
     and not exists (select 1 from player_stats where player_id = p_pid and drops_opened > 0) then
    perform game._cash(p_pid, basic, 'tutorial', jsonb_build_object('step', 7));
    granted := granted + basic;
    update profiles set tutorial_flags = tutorial_flags || '{"first_drop_cash": true}'::jsonb where id = p_pid;
  end if;
  if p_step >= 12 then
    if not coalesce((p.tutorial_flags->>'done')::boolean, false) then
      perform game._add_tokens(p_pid, 'basic', 1);
      update profiles set tutorial_flags = tutorial_flags || '{"done": true}'::jsonb where id = p_pid;
    end if;
    update profiles set tutorial_step = 99 where id = p_pid;
    return jsonb_build_object('ok', true, 'step', 99, 'cash', granted, 'tokens', jsonb_build_object('basic', 1));
  end if;
  update profiles set tutorial_step = p_step where id = p_pid;
  return jsonb_build_object('ok', true, 'step', p_step, 'cash', granted);
end $$;

-- ---------------------------------------------------------------------------
-- Read models
-- ---------------------------------------------------------------------------
create or replace function game._plot_json(p_pid uuid, p_viewer uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'username', p.username, 'is_bot', p.is_bot, 'level', p.level, 'prestige', p.prestige,
    'title', game.level_title(p.level), 'bio', coalesce(p.bot->>'bio', ''),
    'base_level', b.base_level, 'slots', game._slots(p.id), 'security_level', b.security_level,
    'vault_level', b.vault_level, 'cosmetics', p.cosmetics, 'base_value', game._base_value(p.id),
    'shield_until', b.shield_until, 'lock_until', b.lock_until, 'protected', (not p.is_bot and p.level < 3),
    'online', p.is_bot or p.last_seen_at > now() - interval '60 seconds',
    'vault_used', (select count(*) from game.player_items v where v.owner_id = p.id and v.location = 'vault'),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'slot', pi.slot,
                'serial', pi.serial, 'soulbound', pi.soulbound, 'hot_until', pi.hot_until, 'mutation', pi.mutation,
                'under_raid', rd.id is not null,
                'raid', case when rd.id is null then null else jsonb_build_object(
                          'id', rd.id, 'phase', rd.phase, 'attacker_id', rd.attacker_id, 'attacker', ra.username,
                          'started_at', rd.started_at, 'ends_at', rd.ends_at, 'grabbed_at', rd.grabbed_at,
                          'deliver_after', rd.deliver_after, 'carry_until', rd.carry_until) end)
                order by pi.slot), '[]'::jsonb)
              from game.player_items pi
              left join game.raids rd on rd.player_item_id = pi.id and rd.status = 'active'
              left join game.profiles ra on ra.id = rd.attacker_id
              where pi.owner_id = p.id and pi.location = 'display'))
  from game.profiles p join game.bases b on b.player_id = p.id
  where p.id = p_pid
$$;

create or replace function game.q_sync(p_pid uuid, p_since bigint, p_items_rev bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; b record; s record; ev record; w record; rate double precision; v_r record;
        v_items jsonb; v_feed jsonb; v_claimable int; v_pending bigint;
begin
  perform 1 from profiles where id = p_pid;
  if not found then
    return jsonb_build_object('needs_join', true, 'server_time', game._now_ms());
  end if;
  -- Resolve raids that are due and involve me, so results appear instantly.
  for v_r in
    select rd.id from raids rd join profiles a on a.id = rd.attacker_id
    where rd.status = 'active' and (
      (rd.defender_id = p_pid and a.is_bot and (
         (rd.phase = 'grab' and rd.ends_at <= now()) or (rd.phase = 'carry' and rd.deliver_after <= now())))
      or (rd.attacker_id = p_pid and (
         (rd.phase = 'grab' and rd.ends_at < now() - interval '8 seconds')
         or (rd.phase = 'carry' and rd.carry_until < now() - interval '3 seconds'))))
  loop
    perform game._resolve_raid(v_r.id);
  end loop;
  update profiles set last_seen_at = now() where id = p_pid;
  select * into p from profiles where id = p_pid;
  select * into b from bases where player_id = p_pid;
  select * into s from player_stats where player_id = p_pid;
  select * into ev from game._current_event();
  select * into w from world where id = 1;
  rate := game._income_rate(p_pid);
  select coalesce(sum(game._pending(pi)), 0) into v_pending
  from player_items pi where pi.owner_id = p_pid and pi.location = 'display';

  if p_items_rev is distinct from p.items_rev then
    select coalesce(jsonb_agg(game._item_json(pi) order by pi.acquired_at, pi.id), '[]'::jsonb) into v_items
    from player_items pi where pi.owner_id = p_pid;
  end if;

  if p_since is null or p_since < 0 then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.id), '[]'::jsonb) into v_feed from (
      select id, kind, target_id, actor_id, payload, created_at from server_events
      where target_id is null or target_id = p_pid order by id desc limit 30) x;
  else
    select coalesce(jsonb_agg(to_jsonb(x) order by x.id), '[]'::jsonb) into v_feed from (
      select id, kind, target_id, actor_id, payload, created_at from server_events
      where id > p_since and (target_id is null or target_id = p_pid) order by id limit 80) x;
  end if;

  select count(*) into v_claimable from jsonb_array_elements(game.act_quests(p_pid)) q
  where (q->>'progress')::bigint >= (q->>'target')::bigint and not (q->>'claimed')::boolean;

  return jsonb_build_object(
    'server_time', game._now_ms(),
    'me', jsonb_build_object(
      'id', p.id, 'username', p.username, 'cash', p.cash, 'income', round(rate::numeric, 2),
      'pending', v_pending, 'base_value', game._base_value(p_pid),
      'xp', p.xp, 'level', p.level, 'title', game.level_title(p.level),
      'xp_level', game.xp_for_level(p.level), 'xp_next', game.xp_for_level(p.level + 1),
      'prestige', p.prestige, 'income_bonus', 0.05 * p.prestige, 'luck', game._luck(p_pid),
      'focus', p.collection_focus, 'drop_tokens', p.drop_tokens, 'secret_keys', p.secret_keys,
      'tutorial_step', p.tutorial_step, 'tutorial_flags', p.tutorial_flags, 'cosmetics', p.cosmetics,
      'owned_cosmetics', (select coalesce(jsonb_agg(cosmetic_id), '[]'::jsonb) from player_cosmetics where player_id = p_pid),
      'raid_cooldown_until', p.raid_cooldown_until, 'items_rev', p.items_rev,
      'base_level', b.base_level, 'slots', game._slots(p_pid), 'security_level', b.security_level,
      'vault_level', b.vault_level, 'vault_capacity', game._vault_capacity(p_pid), 'shield_until', b.shield_until,
      'lock_until', b.lock_until, 'lock_seconds', 30 + 10 * b.security_level,
      'stats', to_jsonb(s) - 'player_id',
      'daily', game._daily_status(p_pid),
      'collection_count', (select count(*) from player_collection where player_id = p_pid),
      'created_at', p.created_at),
    'items', v_items,
    'listings', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'player_item_id', l.player_item_id,
                   'item_id', l.item_id, 'price', l.price, 'created_at', l.created_at) order by l.created_at desc), '[]'::jsonb)
                 from market_listings l where l.seller_id = p_pid and l.status = 'active'),
    'incoming_raids', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'attacker', a.username,
                   'attacker_id', a.id, 'attacker_bot', a.is_bot, 'item_id', r.item_id, 'player_item_id', r.player_item_id,
                   'started_at', r.started_at, 'ends_at', r.ends_at, 'defended', r.defended, 'revenge', r.is_revenge,
                   'phase', r.phase, 'grabbed_at', r.grabbed_at, 'carry_until', r.carry_until,
                   'deliver_after', r.deliver_after)), '[]'::jsonb)
                 from raids r join profiles a on a.id = r.attacker_id
                 where r.defender_id = p_pid and r.status = 'active'),
    'outgoing_raid', (select jsonb_build_object('id', r.id, 'defender', d.username, 'defender_id', d.id,
                   'item_id', r.item_id, 'player_item_id', r.player_item_id, 'started_at', r.started_at,
                   'ends_at', r.ends_at, 'defended', r.defended, 'chance', r.chance, 'revenge', r.is_revenge,
                   'tutorial', r.is_tutorial, 'phase', r.phase, 'grabbed_at', r.grabbed_at,
                   'carry_until', r.carry_until, 'deliver_after', r.deliver_after)
                 from raids r join profiles d on d.id = r.defender_id
                 where r.attacker_id = p_pid and r.status = 'active' limit 1),
    'event', case when ev.type_id is null then null else jsonb_build_object(
                   'type', ev.type_id, 'title', ev.title, 'icon', ev.icon, 'description', ev.description,
                   'category', ev.category, 'price_mult', ev.price_mult, 'income_mult', ev.income_mult,
                   'luck_mult', ev.luck_mult, 'starts_at', ev.starts_at, 'ends_at', ev.ends_at) end,
    'next_event_at', w.next_event_at,
    'feed', v_feed,
    'trades', jsonb_build_object(
      'incoming', (select count(*) from trades where to_id = p_pid and status = 'pending'),
      'outgoing', (select count(*) from trades where from_id = p_pid and status = 'pending')),
    'quests_claimable', v_claimable,
    'revenge', (select count(*) from raids where defender_id = p_pid and status = 'success'
                and not revenge_used and resolved_at > now() - interval '24 hours'),
    'online', (select count(*) from profiles where not is_bot and last_seen_at > now() - interval '60 seconds')
  );
end $$;

create or replace function game.q_catalog() returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'items', (select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'brand', i.brand, 'kind', i.kind,
                'category', i.category, 'rarity', i.rarity, 'base_value', i.base_value, 'base_income', i.base_income,
                'max_supply', i.max_supply, 'tradeable', i.tradeable, 'droppable', i.droppable, 'event_only', i.event_only,
                'color', i.color, 'accent', i.accent, 'flavor', i.flavor) order by i.sort) from game.items i),
    'rarities', (select jsonb_agg(to_jsonb(r) order by r.tier) from game.rarities r),
    'mutations', (select jsonb_agg(to_jsonb(m) order by m.sort) from game.mutations m),
    'drops', (select jsonb_agg(to_jsonb(d) order by d.sort) from game.drop_types d),
    'upgrades', (select jsonb_agg(to_jsonb(u) order by u.kind, u.level) from game.upgrade_levels u),
    'quests', (select jsonb_agg(to_jsonb(q) order by q.sort) from game.quests q),
    'achievements', (select jsonb_agg(to_jsonb(a) order by a.sort) from game.achievements a),
    'cosmetics', (select jsonb_agg(to_jsonb(c) order by c.sort) from game.cosmetics c),
    'event_types', (select jsonb_agg(to_jsonb(e)) from game.event_types e),
    'level_titles', (select jsonb_agg(to_jsonb(l) order by l.level) from game.level_titles l),
    'rules', jsonb_build_object('quick_sell_rate', 0.6, 'market_fee', 0.05, 'list_min', 0.25, 'list_max', 5,
                                'prestige_level', 25, 'focus_level', 5, 'protection_level', 3,
                                'shield_minutes', 10, 'hot_minutes', 5, 'offline_cap_hours', 12,
                                'belt_seconds', 36, 'belt_markup', 1.05, 'carry_seconds', 45,
                                'lock_base_seconds', 30, 'lock_per_security', 10, 'lock_recharge', 10))
$$;

create or replace function game.q_listings(p_viewer uuid, p_filter jsonb) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(x.j order by x.ratio, x.created_at), '[]'::jsonb) from (
    select jsonb_build_object('id', l.id, 'item_id', l.item_id, 'price', l.price,
             'market', round(ms.price * coalesce(m.mult, 1)), 'mutation', pi.mutation,
             'seller', p.username, 'seller_id', p.id, 'seller_bot', p.is_bot, 'serial', pi.serial,
             'created_at', l.created_at, 'mine', l.seller_id = p_viewer) as j,
           l.price::numeric / (ms.price * coalesce(m.mult, 1)) as ratio, l.created_at
    from game.market_listings l
    join game.market_state ms on ms.item_id = l.item_id
    join game.profiles p on p.id = l.seller_id
    join game.player_items pi on pi.id = l.player_item_id
    left join game.mutations m on m.id = pi.mutation
    join game.items i on i.id = l.item_id
    where l.status = 'active'
      and (p_filter->>'category' is null or i.category = p_filter->>'category')
      and (p_filter->>'rarity' is null or i.rarity = p_filter->>'rarity')
      and (not coalesce((p_filter->>'mine')::boolean, false) or l.seller_id = p_viewer)
    order by l.price::numeric / (ms.price * coalesce(m.mult, 1)), l.created_at
    limit 80) x
$$;

create or replace function game.q_market_item(p_viewer uuid, p_item text, p_range text) returns jsonb
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare since timestamptz; hist jsonb; ms record; h24 bigint;
begin
  select * into ms from market_state where item_id = p_item;
  if not found then raise exception 'Unknown item.'; end if;
  since := now() - case p_range when '1H' then interval '1 hour' when '24H' then interval '24 hours'
                                 when '7D' then interval '7 days' when '30D' then interval '30 days'
                                 else interval '100 years' end;
  select coalesce(jsonb_agg(jsonb_build_array((extract(epoch from ts) * 1000)::bigint, price, demand, supply, listed, volume)
           order by ts), '[]'::jsonb) into hist
  from market_history
  where item_id = p_item and ts >= since
    and (p_range in ('1H', '24H')
         or (p_range = '7D' and (ts > now() - interval '48 hours' and date_part('minute', ts at time zone 'utc')::int % 30 = 0
                                 or date_part('minute', ts at time zone 'utc') = 0))
         or (p_range = '30D' and date_part('minute', ts at time zone 'utc') = 0 and date_part('hour', ts at time zone 'utc')::int % 4 = 0)
         or (p_range not in ('1H', '24H', '7D', '30D') and date_part('minute', ts at time zone 'utc') = 0
             and date_part('hour', ts at time zone 'utc') = 0));
  select price into h24 from market_history where item_id = p_item and ts <= now() - interval '24 hours' order by ts desc limit 1;
  return jsonb_build_object(
    'item_id', p_item, 'range', p_range, 'price', ms.price, 'demand', round(ms.demand, 1),
    'supply', ms.supply, 'listed', ms.listed, 'volume_24h', ms.volume_24h,
    'change_24h', case when h24 is null or h24 = 0 then 0 else round(((ms.price - h24)::numeric / h24) * 100, 1) end,
    'owners', (select count(distinct owner_id) from player_items where item_id = p_item),
    'minted', (select minted from limited_item_supply where item_id = p_item),
    'mine', (select count(*) from player_items where item_id = p_item and owner_id = p_viewer),
    'history', hist,
    'sales', (select coalesce(jsonb_agg(jsonb_build_object('price', s.price, 'kind', s.kind, 'at', s.created_at,
                'buyer', b.username, 'seller', sl.username) order by s.created_at desc), '[]'::jsonb)
              from (select * from market_sales where item_id = p_item order by created_at desc limit 12) s
              left join profiles b on b.id = s.buyer_id left join profiles sl on sl.id = s.seller_id),
    'listings', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'price', l.price, 'seller', p.username,
                   'seller_id', p.id, 'seller_bot', p.is_bot, 'serial', pi.serial, 'created_at', l.created_at,
                   'mutation', pi.mutation, 'market', round(ms.price * game._mut_mult(pi.mutation)),
                   'mine', l.seller_id = p_viewer) order by l.price, l.created_at), '[]'::jsonb)
                 from (select * from market_listings where item_id = p_item and status = 'active' order by price limit 30) l
                 join profiles p on p.id = l.seller_id join player_items pi on pi.id = l.player_item_id));
end $$;

create or replace function game.q_trades(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'from_id', t.from_id, 'from', f.username, 'from_bot', f.is_bot,
    'to_id', t.to_id, 'to', tt.username, 'to_bot', tt.is_bot,
    'offer_cash', t.offer_cash, 'request_cash', t.request_cash, 'message', t.message,
    'status', t.status, 'note', t.note, 'created_at', t.created_at, 'resolved_at', t.resolved_at,
    'incoming', t.to_id = p_pid,
    'offer_items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'serial', pi.serial,
                      'mutation', pi.mutation, 'available', pi.owner_id = t.from_id)), '[]'::jsonb)
                    from game.player_items pi where pi.id = any(t.offer_items)),
    'request_items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'serial', pi.serial,
                      'mutation', pi.mutation, 'available', pi.owner_id = t.to_id)), '[]'::jsonb)
                    from game.player_items pi where pi.id = any(t.request_items)),
    'offer_value', game._value_of(t.offer_items) + t.offer_cash,
    'request_value', game._value_of(t.request_items) + t.request_cash,
    'snapshot', t.snapshot) order by (t.status = 'pending') desc, t.created_at desc), '[]'::jsonb)
  from (select * from game.trades where (from_id = p_pid or to_id = p_pid)
          and (status = 'pending' or resolved_at > now() - interval '3 days')
        order by created_at desc limit 40) t
  join game.profiles f on f.id = t.from_id
  join game.profiles tt on tt.id = t.to_id
$$;

create or replace function game.q_raid_targets(p_pid uuid, p_sort text) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  with me as (select level from game.profiles where id = p_pid),
  t as (
    select p.id, p.username, p.is_bot, p.level, p.prestige, b.security_level, b.shield_until, b.lock_until,
           (not p.is_bot and p.level < 3) as protected,
           p.is_bot or p.last_seen_at > now() - interval '60 seconds' as online,
           game._base_value(p.id) as base_value,
           (select count(*) from game.player_items x where x.owner_id = p.id and x.location = 'display') as shown,
           (select jsonb_build_object('item_id', pi.item_id, 'price', round(ms.price * coalesce(m.mult, 1)),
                                      'serial', pi.serial, 'mutation', pi.mutation)
              from game.player_items pi join game.market_state ms on ms.item_id = pi.item_id
              left join game.mutations m on m.id = pi.mutation
              where pi.owner_id = p.id and pi.location = 'display' and not pi.soulbound
              order by ms.price * coalesce(m.mult, 1) desc limit 1) as top_item,
           game._revenge_row(p_pid, p.id) is not null as revenge,
           (select name from game.upgrade_levels ul where ul.kind = 'security' and ul.level = b.security_level) as security_name
    from game.profiles p join game.bases b on b.player_id = p.id
    where p.id <> p_pid
  )
  select coalesce(jsonb_agg(to_jsonb(t) order by
      t.revenge desc,
      case when p_sort = 'value' then -t.base_value
           when p_sort = 'security' then t.security_level
           else abs(t.level - (select level from me)) * 1000 - t.base_value / 1000000.0 end), '[]'::jsonb)
  from (select * from t order by revenge desc, base_value desc limit 60) t
$$;

-- ---------------------------------------------------------------------------
-- Public RPCs
-- ---------------------------------------------------------------------------
create or replace function public.stt_belt(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid(); nxt timestamptz;
begin
  perform game._maybe_tick();
  select belt_next_at into nxt from game.world where id = 1;
  if (nxt is null or nxt < now() + interval '12 seconds') and pg_try_advisory_xact_lock(727275) then
    perform game._belt_fill();
  end if;
  return game.q_belt(uid);
end $$;

create or replace function public.stt_buy_belt(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_buy_belt(uid, game._p_bigint(p, 'belt_id')); end $$;

create or replace function public.stt_collect(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  return game.act_collect(uid, case when p->>'player_item_id' is null then null
                                    else game._p_uuid(p, 'player_item_id') end);
end $$;

create or replace function public.stt_lock_base(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_lock_base(uid); end $$;

create or replace function public.stt_deliver_steal(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_deliver_steal(uid, game._p_uuid(p, 'raid_id')); end $$;

create or replace function public.stt_abort_steal(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_abort_steal(uid, game._p_uuid(p, 'raid_id'), coalesce(p->>'reason', 'abort'));
end $$;

create or replace function public.stt_defend(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  return game.act_defend(uid, game._p_uuid(p, 'raid_id'), coalesce((p->>'tag')::boolean, false));
end $$;

-- ---------------------------------------------------------------------------
-- Privileges: only signed-in players may call stt_*; nobody may call game.*
-- ---------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'stt\_%'
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'game'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
