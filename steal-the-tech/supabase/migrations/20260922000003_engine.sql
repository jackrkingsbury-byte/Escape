-- ============================================================================
-- STEAL THE TECH — game engine (internal functions, schema `game`)
--
-- Nothing in here is callable by clients. Public RPCs (20260922000005_api.sql)
-- resolve the caller with auth.uid() and delegate to the act_* functions below,
-- which take the acting player id explicitly so NPC bots can use the exact
-- same rules as humans.
--
-- Conventions
--   * act_* functions lock the acting player's profile row first
--     (SELECT ... FOR UPDATE) so concurrent requests from one player serialize:
--     no double-spending, no duplicated items.
--   * When two players are involved, both profile rows are locked in id order
--     to avoid deadlocks.
--   * Passive income is settled (credited) before anything that changes what a
--     player has on display, so income is always paid at the correct rate.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Small helpers
-- ---------------------------------------------------------------------------
create or replace function game._uid() returns uuid
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare v uuid;
begin
  v := auth.uid();
  if v is null then
    raise exception 'You need to be signed in to play.';
  end if;
  return v;
end $$;

create or replace function game.fmt_money(n numeric) returns text
language sql immutable set search_path = pg_catalog, game, pg_temp as $$
  select '$' || to_char(coalesce(n, 0), 'FM999,999,999,999,999,990')
$$;

create or replace function game.xp_for_level(p_level int) returns bigint
language sql immutable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(round(100 * power(l, 1.5)))::bigint, 0)
  from generate_series(1, greatest(p_level, 1) - 1) l
$$;

create or replace function game.level_for_xp(p_xp bigint) returns int
language plpgsql immutable set search_path = pg_catalog, game, pg_temp as $$
declare l int := 1; need bigint := 0;
begin
  loop
    need := need + round(100 * power(l, 1.5))::bigint;
    exit when p_xp < need or l >= 200;
    l := l + 1;
  end loop;
  return l;
end $$;

create or replace function game.level_title(p_level int) returns text
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce((select title from game.level_titles where level <= p_level order by level desc limit 1), 'Rookie')
$$;

create or replace function game._period_key(p_period text) returns text
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select case when p_period = 'daily'
    then to_char(now() at time zone 'utc', 'YYYY-MM-DD')
    else to_char(now() at time zone 'utc', 'IYYY-"W"IW') end
$$;

create or replace function game._period_end(p_period text) returns timestamptz
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select case when p_period = 'daily'
    then (date_trunc('day', now() at time zone 'utc') + interval '1 day') at time zone 'utc'
    else (date_trunc('week', now() at time zone 'utc') + interval '7 days') at time zone 'utc' end
$$;

create or replace function game._upgrade_value(p_kind text, p_level int) returns int
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select value from game.upgrade_levels where kind = p_kind and level = p_level
$$;

create or replace function game._slots(p_pid uuid) returns int
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select ul.value from game.bases b
  join game.upgrade_levels ul on ul.kind = 'base' and ul.level = b.base_level
  where b.player_id = p_pid
$$;

create or replace function game._vault_capacity(p_pid uuid) returns int
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select ul.value from game.bases b
  join game.upgrade_levels ul on ul.kind = 'vault' and ul.level = b.vault_level
  where b.player_id = p_pid
$$;

create or replace function game._is_bot(p_pid uuid) returns boolean
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce((select is_bot from game.profiles where id = p_pid), false)
$$;

create or replace function game._current_event()
returns table (event_id bigint, type_id text, category text, title text, icon text, description text,
               price_mult numeric, demand_boost numeric, income_mult numeric, luck_mult numeric,
               starts_at timestamptz, ends_at timestamptz)
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select e.id, e.type_id, e.category, t.title, t.icon, t.description,
         t.price_mult, t.demand_boost, t.income_mult, t.luck_mult, e.starts_at, e.ends_at
  from game.events e join game.event_types t on t.id = e.type_id
  where now() >= e.starts_at and now() < e.ends_at
  order by e.starts_at desc
  limit 1
$$;

create or replace function game._emit(p_kind text, p_target uuid, p_actor uuid, p_payload jsonb) returns void
language sql set search_path = pg_catalog, game, pg_temp as $$
  insert into game.server_events (kind, target_id, actor_id, payload)
  values (p_kind, p_target, p_actor, coalesce(p_payload, '{}'::jsonb))
$$;

create or replace function game._item_json(p game.player_items) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'item_id', p.item_id, 'location', p.location, 'slot', p.slot, 'serial', p.serial,
    'soulbound', p.soulbound, 'hot_until', p.hot_until, 'acquired_via', p.acquired_via,
    'acquired_at', p.acquired_at, 'stolen_from', p.stolen_from)
$$;

-- ---------------------------------------------------------------------------
-- Economy core: income, cash, XP
-- ---------------------------------------------------------------------------
create or replace function game._luck(p_pid uuid) returns numeric
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select case when prestige <= 0 then 0 else least(0.5, 0.03 * prestige - 0.01) end
  from game.profiles where id = p_pid
$$;

create or replace function game._income_rate(p_pid uuid) returns double precision
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare r double precision; ev record; pr int;
begin
  select * into ev from game._current_event();
  select prestige into pr from profiles where id = p_pid;
  select coalesce(sum(i.base_income * case when ev.category is not null and i.category = ev.category
                                           then ev.income_mult else 1 end), 0)
    into r
  from player_items pi join items i on i.id = pi.item_id
  where pi.owner_id = p_pid and pi.location = 'display';
  return r * (1 + 0.05 * coalesce(pr, 0));
end $$;

-- Credit passive income earned since the last settle (capped at 12h offline).
create or replace function game._settle(p_pid uuid) returns bigint
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; rate double precision; elapsed double precision; earned double precision; whole bigint;
begin
  select cash, income_remainder, last_income_at, is_bot into p from profiles where id = p_pid;
  if not found then return 0; end if;
  elapsed := extract(epoch from (now() - p.last_income_at));
  if elapsed <= 0 then return p.cash; end if;
  elapsed := least(elapsed, 43200);
  rate := game._income_rate(p_pid);
  earned := rate * elapsed + p.income_remainder;
  whole := floor(earned)::bigint;
  update profiles set cash = cash + whole, income_remainder = earned - whole, last_income_at = now()
  where id = p_pid;
  if whole > 0 and not p.is_bot then
    update player_stats set cash_earned = cash_earned + whole where player_id = p_pid;
    perform game._quest_progress(p_pid, 'earn_cash', whole);
  end if;
  return p.cash + whole;
end $$;

-- Every non-income cash change goes through here and is written to transactions.
create or replace function game._cash(p_pid uuid, p_delta bigint, p_kind text, p_ref jsonb default '{}'::jsonb)
returns bigint
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare bal bigint;
begin
  select cash into bal from profiles where id = p_pid;
  if bal is null then raise exception 'Player not found.'; end if;
  if bal + p_delta < 0 then
    raise exception 'Not enough cash — you need % more.', game.fmt_money(-(bal + p_delta));
  end if;
  if p_delta = 0 then return bal; end if;
  update profiles set cash = cash + p_delta where id = p_pid returning cash into bal;
  insert into transactions (player_id, kind, amount, balance_after, ref)
  values (p_pid, p_kind, p_delta, bal, coalesce(p_ref, '{}'::jsonb));
  return bal;
end $$;

create or replace function game._add_tokens(p_pid uuid, p_drop text, p_n int) returns void
language sql set search_path = pg_catalog, game, pg_temp as $$
  update game.profiles
  set drop_tokens = jsonb_set(drop_tokens, array[p_drop], to_jsonb(greatest(0, coalesce((drop_tokens->>p_drop)::int, 0) + p_n)))
  where id = p_pid
$$;

create or replace function game._quest_progress(p_pid uuid, p_metric text, p_amount bigint) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  if p_amount is null or p_amount <= 0 or game._is_bot(p_pid) then return; end if;
  insert into player_quests (player_id, quest_id, period_key, progress)
  select p_pid, q.id, game._period_key(q.period), p_amount from quests q where q.metric = p_metric
  on conflict (player_id, quest_id, period_key)
  do update set progress = player_quests.progress + excluded.progress;
end $$;

create or replace function game._achieve(p_pid uuid, p_id text) returns boolean
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare a record; n int;
begin
  if game._is_bot(p_pid) then return false; end if;
  insert into player_achievements (player_id, achievement_id) values (p_pid, p_id) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  select * into a from achievements where id = p_id;
  if a.reward_cash > 0 then
    perform game._cash(p_pid, a.reward_cash, 'achievement', jsonb_build_object('id', p_id));
  end if;
  perform game._emit('achievement', p_pid, p_pid,
    jsonb_build_object('id', p_id, 'title', a.title, 'icon', a.icon, 'cash', a.reward_cash, 'xp', a.xp));
  if a.xp > 0 then perform game._xp(p_pid, a.xp, 'achievement'); end if;
  return true;
end $$;

create or replace function game._xp(p_pid uuid, p_amount bigint, p_reason text default null) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; newlvl int; l int; total bigint := 0;
begin
  if p_amount is null or p_amount <= 0 then return; end if;
  update profiles set xp = xp + p_amount where id = p_pid
  returning xp, level, is_bot, username into p;
  if not found then return; end if;
  newlvl := game.level_for_xp(p.xp);
  if newlvl <= p.level then return; end if;
  update profiles set level = newlvl where id = p_pid;
  if p.is_bot then return; end if;
  for l in p.level + 1 .. newlvl loop
    total := total + 250::bigint * l * l;
  end loop;
  perform game._cash(p_pid, total, 'level_reward', jsonb_build_object('level', newlvl));
  insert into player_cosmetics (player_id, cosmetic_id)
    select p_pid, c.id from cosmetics c
    where c.unlock like 'level:%' and split_part(c.unlock, ':', 2)::int <= newlvl
  on conflict do nothing;
  perform game._emit('level_up', p_pid, p_pid,
    jsonb_build_object('level', newlvl, 'title', game.level_title(newlvl), 'cash', total));
  if newlvl in (5, 10, 20, 25, 30, 40, 50) then
    perform game._emit('level_milestone', null, p_pid,
      jsonb_build_object('player', p.username, 'level', newlvl, 'title', game.level_title(newlvl)));
  end if;
  if newlvl >= 10 then perform game._achieve(p_pid, 'level_10'); end if;
  if newlvl >= 25 then perform game._achieve(p_pid, 'level_25'); end if;
end $$;

create or replace function game._check_achievements(p_pid uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; s record; b record; ncol int;
begin
  select * into p from profiles where id = p_pid;
  if not found or p.is_bot then return; end if;
  select * into s from player_stats where player_id = p_pid;
  select * into b from bases where player_id = p_pid;
  if s.drops_opened >= 1 then perform game._achieve(p_pid, 'first_drop'); end if;
  if s.steals_won >= 1 then perform game._achieve(p_pid, 'first_steal'); end if;
  if s.steals_won >= 10 then perform game._achieve(p_pid, 'steal_10'); end if;
  if s.steals_won >= 50 then perform game._achieve(p_pid, 'steal_50'); end if;
  if s.raids_defended >= 1 then perform game._achieve(p_pid, 'defend_1'); end if;
  if s.raids_defended >= 10 then perform game._achieve(p_pid, 'defend_10'); end if;
  if s.trades_done >= 1 then perform game._achieve(p_pid, 'first_trade'); end if;
  if s.trades_done >= 20 then perform game._achieve(p_pid, 'trade_20'); end if;
  if s.market_sales >= 1 then perform game._achieve(p_pid, 'first_sale'); end if;
  if b.base_level >= 3 then perform game._achieve(p_pid, 'base_3'); end if;
  if b.base_level >= 5 then perform game._achieve(p_pid, 'base_5'); end if;
  if b.security_level >= 4 then perform game._achieve(p_pid, 'security_4'); end if;
  if b.security_level >= 6 then perform game._achieve(p_pid, 'security_6'); end if;
  select count(*) into ncol from player_collection where player_id = p_pid;
  if ncol >= 25 then perform game._achieve(p_pid, 'collect_25'); end if;
  if ncol >= 75 then perform game._achieve(p_pid, 'collect_75'); end if;
  if ncol >= 20 and exists (
      select 1 from (
        select i.category, count(*) as total, count(pc.item_id) as got
        from items i
        left join player_collection pc on pc.item_id = i.id and pc.player_id = p_pid
        where i.droppable or i.event_only
        group by i.category) x
      where x.got = x.total) then
    perform game._achieve(p_pid, 'category_complete');
  end if;
  if p.cash >= 1000000 then perform game._achieve(p_pid, 'millionaire'); end if;
  if p.cash >= 1000000000 then perform game._achieve(p_pid, 'billionaire'); end if;
  if p.daily_streak >= 7 then perform game._achieve(p_pid, 'streak_7'); end if;
  if p.prestige >= 1 then perform game._achieve(p_pid, 'prestige_1'); end if;
end $$;

-- ---------------------------------------------------------------------------
-- Items: creation, discovery, transfer, placement
-- ---------------------------------------------------------------------------
create or replace function game._discover(p_pid uuid, p_item text) returns boolean
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  update player_collection set times_found = times_found + 1 where player_id = p_pid and item_id = p_item;
  if found then return false; end if;
  insert into player_collection (player_id, item_id) values (p_pid, p_item) on conflict do nothing;
  return true;
end $$;

-- Mint a brand-new item instance (drops, rewards). Enforces limited supply.
create or replace function game._grant(p_pid uuid, p_item text, p_via text) returns uuid
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare it record; v_serial int; v_id uuid; pname text; pbot boolean; remaining int; mprice bigint;
begin
  select i.*, r.tier, r.xp as rxp into it from items i join rarities r on r.id = i.rarity where i.id = p_item;
  if not found then raise exception 'Unknown item %', p_item; end if;
  if it.max_supply is not null then
    update limited_item_supply set minted = minted + 1
    where item_id = p_item and minted < max_supply
    returning minted into v_serial;
    if v_serial is null then raise exception 'SOLD_OUT'; end if;
    remaining := it.max_supply - v_serial;
  end if;
  insert into player_items (item_id, owner_id, location, serial, soulbound, acquired_via)
  values (p_item, p_pid, 'inventory', v_serial, not it.tradeable, p_via)
  returning id into v_id;
  insert into item_log (player_item_id, item_id, from_id, to_id, via) values (v_id, p_item, null, p_pid, p_via);
  select username, is_bot into pname, pbot from profiles where id = p_pid;
  perform game._discover(p_pid, p_item);
  select price into mprice from market_state where item_id = p_item;
  update player_stats set
    items_found = items_found + 1,
    secrets_found = secrets_found + (it.rarity = 'secret')::int,
    limiteds_found = limiteds_found + (it.rarity = 'limited')::int,
    best_item_value = greatest(best_item_value, coalesce(mprice, it.base_value))
  where player_id = p_pid;
  update market_state set demand = greatest(0, demand - 0.4) where item_id = p_item;

  if not pbot then
    perform game._xp(p_pid, it.rxp, 'find');
    if it.tier >= 3 then perform game._quest_progress(p_pid, 'find_rare', 1); perform game._achieve(p_pid, 'first_rare'); end if;
    if it.tier >= 4 then perform game._achieve(p_pid, 'first_epic'); end if;
    if it.tier >= 5 then perform game._quest_progress(p_pid, 'find_legendary', 1); perform game._achieve(p_pid, 'first_legendary'); end if;
    if it.tier >= 6 then perform game._quest_progress(p_pid, 'find_mythic', 1); perform game._achieve(p_pid, 'first_mythic'); end if;
    if it.rarity in ('ultra', 'secret') then perform game._achieve(p_pid, 'first_ultra'); end if;
    if it.rarity = 'secret' then perform game._achieve(p_pid, 'first_secret'); end if;
    if it.rarity = 'limited' then perform game._achieve(p_pid, 'first_limited'); end if;
  end if;

  if p_via <> 'seed' then
    if it.rarity = 'secret' then
      perform game._emit('secret_found', null, p_pid, jsonb_build_object(
        'player', pname, 'item_id', p_item, 'item', it.name, 'serial', v_serial,
        'max_supply', it.max_supply, 'via', p_via, 'is_bot', pbot));
    elsif it.rarity in ('ultra', 'limited') or (it.rarity = 'mythic' and p_via = 'drop') then
      perform game._emit('big_pull', null, p_pid, jsonb_build_object(
        'player', pname, 'item_id', p_item, 'item', it.name, 'rarity', it.rarity,
        'serial', v_serial, 'max_supply', it.max_supply, 'is_bot', pbot));
    end if;
    if remaining is not null and (remaining in (0, 1, 3, 5, 10, 25)) then
      perform game._emit('supply_alert', null, null, jsonb_build_object(
        'item_id', p_item, 'item', it.name, 'remaining', remaining, 'max_supply', it.max_supply));
    end if;
  end if;
  return v_id;
end $$;

-- Move an existing item to a new owner (steal / trade / market). Always lands in inventory.
create or replace function game._transfer(p_piid uuid, p_to uuid, p_via text, p_amount bigint default null,
                                          p_hot interval default null) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi record;
begin
  select * into pi from player_items where id = p_piid for update;
  if not found then raise exception 'Item vanished.'; end if;
  update player_items set
    owner_id = p_to, location = 'inventory', slot = null, acquired_via = p_via, acquired_at = now(),
    hot_until = case when p_hot is null then null else now() + p_hot end,
    stolen_from = case when p_via = 'steal' then pi.owner_id else null end
  where id = p_piid;
  insert into item_log (player_item_id, item_id, from_id, to_id, via, amount)
  values (p_piid, pi.item_id, pi.owner_id, p_to, p_via, p_amount);
  perform game._discover(p_to, pi.item_id);
end $$;

create or replace function game._free_slot(p_pid uuid) returns int
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select min(g) from generate_series(0, coalesce(game._slots(p_pid), 4) - 1) g
  where not exists (select 1 from game.player_items
                    where owner_id = p_pid and location = 'display' and slot = g)
$$;

-- Put an inventory item into the first free display slot (if any). Caller must have settled.
create or replace function game._autoplace(p_pid uuid, p_piid uuid) returns int
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare s int;
begin
  s := game._free_slot(p_pid);
  if s is null then return null; end if;
  update player_items set location = 'display', slot = s
  where id = p_piid and owner_id = p_pid and location = 'inventory';
  if not found then return null; end if;
  return s;
end $$;

-- Fill display slots with the highest-earning items that aren't vaulted or listed.
create or replace function game._arrange_best(p_pid uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare n int;
begin
  n := coalesce(game._slots(p_pid), 4);
  update player_items set location = 'inventory', slot = null where owner_id = p_pid and location = 'display';
  with c as (
    select pi.id, row_number() over (order by i.base_income desc, pi.acquired_at, pi.id) - 1 as rn
    from player_items pi join items i on i.id = pi.item_id
    where pi.owner_id = p_pid and pi.location = 'inventory')
  update player_items set location = 'display', slot = c.rn
  from c where player_items.id = c.id and c.rn < n;
end $$;

-- ---------------------------------------------------------------------------
-- Drops
-- ---------------------------------------------------------------------------
create or replace function game._roll_rarity(p_weights jsonb, p_luck numeric, p_high_mult numeric) returns text
language plpgsql volatile set search_path = pg_catalog, game, pg_temp as $$
declare rec record; total numeric := 0; pick numeric; acc numeric := 0; last text;
begin
  for rec in
    select ra.id, (p_weights->>ra.id)::numeric
             * (case when ra.tier >= 3 then 1 + coalesce(p_luck, 0) else 1 end)
             * (case when ra.tier >= 6 then coalesce(p_high_mult, 1) else 1 end) as w
    from rarities ra where p_weights ? ra.id order by ra.tier
  loop
    total := total + rec.w;
  end loop;
  pick := random()::numeric * total;
  for rec in
    select ra.id, (p_weights->>ra.id)::numeric
             * (case when ra.tier >= 3 then 1 + coalesce(p_luck, 0) else 1 end)
             * (case when ra.tier >= 6 then coalesce(p_high_mult, 1) else 1 end) as w
    from rarities ra where p_weights ? ra.id order by ra.tier
  loop
    acc := acc + rec.w;
    last := rec.id;
    if pick < acc then return rec.id; end if;
  end loop;
  return last;
end $$;

create or replace function game._pick_item(p_pid uuid, p_rarity text, p_category text, p_event_pool boolean,
                                           p_bot boolean default false) returns text
language plpgsql volatile set search_path = pg_catalog, game, pg_temp as $$
declare v_focus text; res text; cat text;
begin
  if p_rarity in ('limited', 'secret') then
    -- weighted by remaining supply; bots never take the last half of any run
    select i.id into res
    from items i join limited_item_supply s on s.item_id = i.id
    where i.rarity = p_rarity and i.droppable and s.minted < s.max_supply
      and (not p_bot or s.minted < s.max_supply / 2)
    order by -ln(1 - random()) / (s.max_supply - s.minted)
    limit 1;
    return res;
  end if;
  if p_event_pool and random() < 0.35 then
    select i.id into res from items i where i.rarity = p_rarity and i.event_only order by random() limit 1;
    if res is not null then return res; end if;
  end if;
  select collection_focus into v_focus from profiles where id = p_pid;
  cat := p_category;
  if cat is null and v_focus is not null and v_focus <> 'RANDOM' and random() < 0.5 then cat := v_focus; end if;
  select i.id into res from items i
  where i.rarity = p_rarity and i.droppable and (cat is null or i.category = cat)
  order by random() limit 1;
  if res is null then
    select i.id into res from items i where i.rarity = p_rarity and i.droppable order by random() limit 1;
  end if;
  return res;
end $$;

create or replace function game._roll_drop(p_pid uuid, p_drop text, p_bot boolean default false) returns text
language plpgsql volatile set search_path = pg_catalog, game, pg_temp as $$
declare d record; ev record; hm numeric := 1; rar text; v_item text; cat text; tries int := 0;
begin
  select * into d from drop_types where id = p_drop;
  select * into ev from game._current_event();
  if ev.luck_mult is not null then hm := ev.luck_mult; end if;
  if d.event_only and ev.type_id is not null and ev.type_id <> 'market_crash' then cat := ev.category; end if;
  rar := game._roll_rarity(d.weights, game._luck(p_pid), hm);
  loop
    v_item := game._pick_item(p_pid, rar, cat, d.event_only, p_bot);
    exit when v_item is not null;
    tries := tries + 1;
    if tries > 10 then raise exception 'The drop machine jammed — try again.'; end if;
    -- supply exhausted: fall back to the next tier down
    rar := case rar when 'secret' then 'ultra' when 'limited' then 'ultra' when 'ultra' then 'mythic'
                    when 'mythic' then 'legendary' when 'legendary' then 'epic' when 'epic' then 'rare'
                    when 'rare' then 'uncommon' else 'common' end;
  end loop;
  return v_item;
end $$;

create or replace function game.act_open_drop(p_pid uuid, p_drop text, p_use_token boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; d record; ev record; tokens int; v_item text; v_id uuid; is_new boolean; bal bigint;
        v_slot int; it record; pi game.player_items;
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

  update player_stats set drops_opened = drops_opened + 1,
                          events_joined = events_joined + (d.event_only)::int
  where player_id = p_pid;
  v_slot := game._autoplace(p_pid, v_id);
  if not p.is_bot then
    perform game._quest_progress(p_pid, 'open_drops', 1);
    perform game._xp(p_pid, d.xp, 'drop');
    perform game._check_achievements(p_pid);
  end if;

  select i.*, r.xp as rxp into it from items i join rarities r on r.id = i.rarity where i.id = v_item;
  select * into pi from player_items where id = v_id;
  select cash into bal from profiles where id = p_pid;
  return jsonb_build_object(
    'player_item', game._item_json(pi),
    'item_id', v_item, 'rarity', it.rarity, 'serial', pi.serial, 'is_new', is_new,
    'placed', v_slot is not null, 'slot', v_slot,
    'xp', d.xp + it.rxp, 'cash', bal, 'drop', p_drop);
end $$;

-- ---------------------------------------------------------------------------
-- Base management
-- ---------------------------------------------------------------------------
create or replace function game._own_item(p_pid uuid, p_piid uuid) returns game.player_items
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items;
begin
  select * into pi from player_items where id = p_piid and owner_id = p_pid for update;
  if not found then raise exception 'That item isn''t yours.'; end if;
  return pi;
end $$;

create or replace function game._under_raid(p_piid uuid) returns boolean
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select exists (select 1 from game.raids where player_item_id = p_piid and status = 'active')
$$;

create or replace function game.act_place(p_pid uuid, p_piid uuid, p_slot int) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; occ record; n int; v_slot int := p_slot;
begin
  perform 1 from profiles where id = p_pid for update;
  pi := game._own_item(p_pid, p_piid);
  if pi.location = 'listed' then raise exception 'Cancel the market listing first.'; end if;
  n := game._slots(p_pid);
  if v_slot is null then
    if pi.location = 'display' then return jsonb_build_object('ok', true, 'slot', pi.slot); end if;
    v_slot := game._free_slot(p_pid);
    if v_slot is null then raise exception 'Your base is full — upgrade it or swap an item out.'; end if;
  end if;
  if v_slot < 0 or v_slot >= n then raise exception 'That display slot doesn''t exist.'; end if;
  if pi.location = 'display' and pi.slot = v_slot then return jsonb_build_object('ok', true, 'slot', v_slot); end if;
  perform game._settle(p_pid);
  select * into occ from player_items
  where owner_id = p_pid and location = 'display' and slot = v_slot and id <> p_piid for update;
  if found then
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
  perform game._settle(p_pid);
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
  cap := game._vault_capacity(p_pid);
  select count(*) into used from player_items where owner_id = p_pid and location = 'vault';
  if used >= cap then raise exception 'Your vault is full (%/%). Upgrade it to protect more items.', used, cap; end if;
  saved := game._under_raid(p_piid);
  perform game._settle(p_pid);
  update player_items set location = 'vault', slot = null where id = p_piid;
  return jsonb_build_object('ok', true, 'saved_from_raid', saved);
end $$;

create or replace function game.act_auto_arrange(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  perform 1 from profiles where id = p_pid for update;
  perform game._settle(p_pid);
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
  if game._under_raid(p_piid) then raise exception 'Someone is stealing that right now — sound the alarm or vault it!'; end if;
  select price into mprice from market_state where item_id = pi.item_id;
  v_price := greatest(1, floor(mprice * 0.6))::bigint;
  perform game._settle(p_pid);
  delete from player_items where id = p_piid;
  insert into item_log (player_item_id, item_id, from_id, to_id, via, amount)
  values (p_piid, pi.item_id, p_pid, null, 'quick_sell', v_price);
  insert into market_sales (item_id, price, seller_id, kind) values (pi.item_id, v_price, p_pid, 'quick_sell');
  bal := game._cash(p_pid, v_price, 'quick_sell', jsonb_build_object('item_id', pi.item_id));
  update market_state set demand = greatest(0, demand - 1) where item_id = pi.item_id;
  update player_stats set quick_sales = quick_sales + 1 where player_id = p_pid;
  perform game._quest_progress(p_pid, 'sell_item', 1);
  perform game._xp(p_pid, 10, 'sell');
  perform game._check_achievements(p_pid);
  return jsonb_build_object('ok', true, 'price', v_price, 'cash', bal);
end $$;

create or replace function game.act_upgrade(p_pid uuid, p_kind text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; cur int; nxt record; bal bigint; pname text;
begin
  select username into pname from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into b from bases where player_id = p_pid for update;
  cur := case p_kind when 'base' then b.base_level when 'security' then b.security_level
                     when 'vault' then b.vault_level else null end;
  if cur is null then raise exception 'Unknown upgrade.'; end if;
  select * into nxt from upgrade_levels where kind = p_kind and level = cur + 1;
  if not found then raise exception 'Already at the maximum level.'; end if;
  perform game._settle(p_pid);
  bal := game._cash(p_pid, -nxt.cost, 'upgrade', jsonb_build_object('kind', p_kind, 'level', nxt.level));
  update bases set
    base_level = case when p_kind = 'base' then nxt.level else base_level end,
    security_level = case when p_kind = 'security' then nxt.level else security_level end,
    vault_level = case when p_kind = 'vault' then nxt.level else vault_level end
  where player_id = p_pid;
  insert into security_upgrades (player_id, kind, from_level, to_level, cost)
  values (p_pid, p_kind, cur, nxt.level, nxt.cost);
  perform game._xp(p_pid, 40 * nxt.level * nxt.level, 'upgrade');
  perform game._check_achievements(p_pid);
  if nxt.level >= 5 and not game._is_bot(p_pid) then
    perform game._emit('upgrade', null, p_pid,
      jsonb_build_object('player', pname, 'kind', p_kind, 'level', nxt.level, 'name', nxt.name));
  end if;
  return jsonb_build_object('ok', true, 'kind', p_kind, 'level', nxt.level, 'name', nxt.name, 'cash', bal);
end $$;

-- ---------------------------------------------------------------------------
-- Raids & stealing
-- ---------------------------------------------------------------------------
create or replace function game._raid_chance(p_att uuid, p_def uuid, p_item text, p_revenge boolean) returns numeric
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare a record; d record; sec int; pen numeric; c numeric;
begin
  select level, prestige into a from profiles where id = p_att;
  select level into d from profiles where id = p_def;
  select security_level into sec from bases where player_id = p_def;
  select ra.steal_penalty into pen from items i join rarities ra on ra.id = i.rarity where i.id = p_item;
  c := 0.62 - 0.07 * (coalesce(sec, 1) - 1) - coalesce(pen, 0)
       + greatest(-0.10, least(0.10, (a.level - d.level) * 0.01))
       + 0.01 * least(coalesce(a.prestige, 0), 10)
       + case when p_revenge then 0.15 else 0 end;
  return round(greatest(0.05, least(0.90, c)), 3);
end $$;

create or replace function game._raid_seconds(p_def uuid, p_item text, p_revenge boolean) returns numeric
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select greatest(6, 5 + 2 * b.security_level + ra.steal_extra_seconds - case when p_revenge then 2 else 0 end)::numeric
  from game.bases b, game.items i join game.rarities ra on ra.id = i.rarity
  where b.player_id = p_def and i.id = p_item
$$;

-- Why can't `p_att` raid `p_def` right now? (null = they can)
create or replace function game._raid_block_reason(p_att uuid, p_def uuid, p_revenge boolean) returns text
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare d record; b record;
begin
  if p_att = p_def then return 'That''s your own base.'; end if;
  select * into d from profiles where id = p_def;
  if not found then return 'Player not found.'; end if;
  select * into b from bases where player_id = p_def;
  if not d.is_bot and d.level < 3 then return d.username || ' is under new-player protection.'; end if;
  if not p_revenge and b.shield_until > now() then
    return d.username || '''s base is shielded for ' || ceil(extract(epoch from b.shield_until - now()))::text || 's.';
  end if;
  return null;
end $$;

create or replace function game._revenge_row(p_victim uuid, p_thief uuid) returns uuid
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select id from game.raids
  where attacker_id = p_thief and defender_id = p_victim and status = 'success'
    and not revenge_used and resolved_at > now() - interval '24 hours'
  order by resolved_at desc limit 1
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
  if coalesce((d.bot->>'tutorial')::boolean, false) and a.tutorial_step between 7 and 11
     and not coalesce((a.tutorial_flags->>'tutorial_raid')::boolean, false) then
    tut := true; v_chance := 1.0; dur := 6;  -- the one-time beginner raid always works
  end if;
  if not a.is_bot and not d.is_bot then
    dur := greatest(dur, 10);  -- a real owner always gets a chance to react
  end if;
  ends := now() + make_interval(secs => dur);
  insert into raids (attacker_id, defender_id, player_item_id, item_id, chance, ends_at, is_revenge, is_tutorial)
  values (p_pid, pi.owner_id, p_piid, pi.item_id, v_chance, ends, p_revenge, tut)
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
    'defender_id', d.id, 'tutorial', tut, 'revenge', p_revenge);
end $$;

create or replace function game.act_defend(p_pid uuid, p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; dname text;
begin
  select * into r from raids where id = p_raid for update;
  if not found or r.defender_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then raise exception 'That raid is already over.'; end if;
  if now() >= r.ends_at then raise exception 'Too late — they''re already out the door!'; end if;
  if r.defended then return jsonb_build_object('ok', true, 'already', true); end if;
  update raids set defended = true, defended_at = now() where id = p_raid;
  select username into dname from profiles where id = p_pid;
  perform game._emit('raid_defended', r.attacker_id, p_pid, jsonb_build_object('raid_id', p_raid, 'defender', dname));
  return jsonb_build_object('ok', true);
end $$;

create or replace function game._raid_result(p_raid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'raid_id', r.id, 'status', r.status, 'item_id', r.item_id, 'player_item_id', r.player_item_id,
    'attacker_id', r.attacker_id, 'attacker', a.username, 'defender_id', r.defender_id, 'defender', d.username,
    'defended', r.defended, 'fine', r.fine, 'chance', r.chance, 'note', r.note, 'is_revenge', r.is_revenge,
    'is_tutorial', r.is_tutorial, 'resolved_at', r.resolved_at, 'ends_at', r.ends_at)
  from game.raids r
  join game.profiles a on a.id = r.attacker_id
  join game.profiles d on d.id = r.defender_id
  where r.id = p_raid
$$;

create or replace function game._resolve_raid(p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record; a record; d record; pi record; it record; eff numeric; ok boolean; v_fine bigint := 0;
        v_defended boolean; mprice bigint; res jsonb;
begin
  select * into r from raids where id = p_raid for update;
  if not found then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  perform 1 from profiles where id in (r.attacker_id, r.defender_id) order by id for update;
  select * into a from profiles where id = r.attacker_id;
  select * into d from profiles where id = r.defender_id;
  select i.*, ra.tier, ra.xp as rxp into it from items i join rarities ra on ra.id = i.rarity where i.id = r.item_id;
  select price into mprice from market_state where item_id = r.item_id;
  select * into pi from player_items where id = r.player_item_id for update;

  if pi.id is null or pi.owner_id <> r.defender_id or pi.location <> 'display' then
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
  end if;

  v_defended := r.defended;
  if d.is_bot and not v_defended and not r.is_tutorial then
    v_defended := random() < coalesce((d.bot->>'defend')::numeric, 0.2);
    if v_defended then update raids set defended = true, defended_at = now() where id = p_raid; end if;
  end if;
  eff := r.chance * case when v_defended then 0.3 else 1 end;
  ok := random() < eff;

  if ok then
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
    perform game._check_achievements(r.attacker_id);
    res := game._raid_result(p_raid);
    perform game._emit('raid_result', r.attacker_id, r.defender_id, res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
    perform game._emit('item_stolen', r.defender_id, r.attacker_id, res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
    if it.tier >= 5 then
      perform game._emit('steal', null, r.attacker_id, jsonb_build_object(
        'attacker', a.username, 'defender', d.username, 'item_id', it.id, 'item', it.name, 'rarity', it.rarity,
        'revenge', r.is_revenge));
    end if;
  else
    if not r.is_tutorial then
      v_fine := least(floor(a.cash * 0.03), floor(coalesce(mprice, it.base_value) * 0.05))::bigint;
    end if;
    if v_fine > 0 then
      perform game._cash(r.attacker_id, -v_fine, 'raid_fine', jsonb_build_object('raid_id', p_raid));
      perform game._cash(r.defender_id, v_fine, 'raid_bounty', jsonb_build_object('raid_id', p_raid));
    end if;
    update profiles set raid_cooldown_until = now() + case when v_defended then interval '60 seconds' else interval '40 seconds' end
    where id = r.attacker_id;
    update player_stats set steals_failed = steals_failed + 1 where player_id = r.attacker_id;
    if v_defended then
      update player_stats set raids_defended = raids_defended + 1 where player_id = r.defender_id;
      perform game._xp(r.defender_id, 25, 'defend');
    end if;
    update raids set status = 'failed', fine = v_fine, resolved_at = now(),
      note = case when v_defended then 'The alarm went off!' else 'You got spotted by security.' end
    where id = p_raid;
    perform game._xp(r.attacker_id, 5, 'raid');
    perform game._quest_progress(r.attacker_id, 'raid_players', 1);
    perform game._check_achievements(r.attacker_id);
    perform game._check_achievements(r.defender_id);
    res := game._raid_result(p_raid);
    perform game._emit('raid_result', r.attacker_id, r.defender_id, res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
    perform game._emit('raid_over', r.defender_id, r.attacker_id, res || jsonb_build_object('item', it.name, 'rarity', it.rarity));
  end if;
  return res;
end $$;

create or replace function game.act_finish_steal(p_pid uuid, p_raid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  select * into r from raids where id = p_raid;
  if not found or r.attacker_id <> p_pid then raise exception 'Raid not found.'; end if;
  if r.status <> 'active' then return game._raid_result(p_raid); end if;
  if now() < r.ends_at - interval '750 milliseconds' then
    raise exception 'Still stealing… %s to go!', ceil(extract(epoch from r.ends_at - now()));
  end if;
  return game._resolve_raid(p_raid);
end $$;

-- ---------------------------------------------------------------------------
-- Market
-- ---------------------------------------------------------------------------
create or replace function game.act_list(p_pid uuid, p_piid uuid, p_price bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare pi game.player_items; mprice bigint; lo bigint; hi bigint; lid uuid; it record;
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
  select price into mprice from market_state where item_id = pi.item_id;
  lo := greatest(1, floor(mprice * 0.25))::bigint;
  hi := (mprice * 5)::bigint;
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

create or replace function game.act_cancel_listing(p_pid uuid, p_lid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare l record;
begin
  perform 1 from profiles where id = p_pid for update;
  select * into l from market_listings where id = p_lid and seller_id = p_pid for update;
  if not found or l.status <> 'active' then raise exception 'Listing not found.'; end if;
  update market_listings set status = 'cancelled', resolved_at = now() where id = p_lid;
  update player_items set location = 'inventory' where id = l.player_item_id;
  update market_state set listed = greatest(0, listed - 1) where item_id = l.item_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_buy_listing(p_pid uuid, p_lid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare l record; fee bigint; bal bigint; it record; bname text; sname text; sbot boolean; v_slot int;
begin
  select * into l from market_listings where id = p_lid for update;
  if not found or l.status <> 'active' then raise exception 'That listing is no longer available.'; end if;
  if l.seller_id = p_pid then raise exception 'You can''t buy your own listing.'; end if;
  perform 1 from profiles where id in (p_pid, l.seller_id) order by id for update;
  select username into bname from profiles where id = p_pid;
  if bname is null then raise exception 'Create your player first.'; end if;
  select username, is_bot into sname, sbot from profiles where id = l.seller_id;
  select i.*, r.tier into it from items i join rarities r on r.id = i.rarity where i.id = l.item_id;
  perform game._settle(p_pid);
  bal := game._cash(p_pid, -l.price, 'market_buy', jsonb_build_object('listing_id', p_lid, 'item_id', l.item_id));
  fee := ceil(l.price * 0.05)::bigint;
  perform game._cash(l.seller_id, l.price - fee, 'market_sale',
    jsonb_build_object('listing_id', p_lid, 'item_id', l.item_id, 'fee', fee));
  perform game._transfer(l.player_item_id, p_pid, 'market', l.price);
  update market_listings set status = 'sold', buyer_id = p_pid, resolved_at = now() where id = p_lid;
  insert into market_sales (item_id, price, seller_id, buyer_id, kind)
  values (l.item_id, l.price, l.seller_id, p_pid, 'listing');
  update market_state set
    price = greatest(1, round(price * 0.85 + greatest(price * 0.6, least(price * 1.6, l.price)) * 0.15)),
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
-- Trades (both players must confirm: proposing = confirm #1, accepting = confirm #2)
-- ---------------------------------------------------------------------------
create or replace function game._value_of(p_items uuid[]) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(ms.price), 0)::bigint
  from game.player_items pi join game.market_state ms on ms.item_id = pi.item_id
  where pi.id = any(p_items)
$$;

create or replace function game.act_trade_propose(p_pid uuid, p jsonb) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare v_to uuid; oi uuid[]; ri uuid[]; oc bigint; rc bigint; msg text; me record; them record; tid uuid;
begin
  begin
    v_to := (p->>'to')::uuid;
    oi := coalesce(array(select (jsonb_array_elements_text(coalesce(p->'offer_items', '[]'::jsonb)))::uuid), '{}');
    ri := coalesce(array(select (jsonb_array_elements_text(coalesce(p->'request_items', '[]'::jsonb)))::uuid), '{}');
    oc := coalesce((p->>'offer_cash')::bigint, 0);
    rc := coalesce((p->>'request_cash')::bigint, 0);
  exception when others then
    raise exception 'Invalid trade offer.';
  end;
  msg := left(coalesce(p->>'message', ''), 140);
  if v_to is null or v_to = p_pid then raise exception 'Pick someone else to trade with.'; end if;
  if oc < 0 or rc < 0 then raise exception 'Cash amounts can''t be negative.'; end if;
  if cardinality(oi) > 8 or cardinality(ri) > 8 then raise exception 'At most 8 items on each side.'; end if;
  if cardinality(oi) = 0 and cardinality(ri) = 0 then raise exception 'A trade needs at least one item.'; end if;
  if (select count(distinct x) from unnest(oi || ri) x) <> cardinality(oi) + cardinality(ri) then
    raise exception 'Duplicate items in the offer.';
  end if;
  select * into me from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into them from profiles where id = v_to;
  if not found then raise exception 'Player not found.'; end if;
  if oc > me.cash then raise exception 'You don''t have that much cash.'; end if;
  if exists (select 1 from unnest(oi) x left join player_items pi on pi.id = x
             where pi.id is null or pi.owner_id <> p_pid) then
    raise exception 'You can only offer your own items.';
  end if;
  if exists (select 1 from player_items pi join items i on i.id = pi.item_id where pi.id = any(oi)
             and (pi.soulbound or not i.tradeable or pi.location = 'listed' or pi.hot_until > now())) then
    raise exception 'Some offered items can''t be traded right now (starter, listed or too hot).';
  end if;
  if exists (select 1 from unnest(ri) x left join player_items pi on pi.id = x
             where pi.id is null or pi.owner_id <> v_to) then
    raise exception 'Requested items must belong to %.', them.username;
  end if;
  if exists (select 1 from player_items pi join items i on i.id = pi.item_id where pi.id = any(ri)
             and (pi.soulbound or not i.tradeable or pi.location in ('listed', 'vault') or pi.hot_until > now())) then
    raise exception 'Some requested items aren''t available for trade.';
  end if;
  if (select count(*) from trades where from_id = p_pid and status = 'pending') >= 10 then
    raise exception 'You already have 10 open offers — cancel some first.';
  end if;
  insert into trades (from_id, to_id, offer_items, offer_cash, request_items, request_cash, message, snapshot)
  values (p_pid, v_to, oi, oc, ri, rc, msg, jsonb_build_object(
    'offer_value', game._value_of(oi) + oc, 'request_value', game._value_of(ri) + rc))
  returning id into tid;
  perform game._emit('trade_offer', v_to, p_pid, jsonb_build_object(
    'trade_id', tid, 'from', me.username, 'offer_value', game._value_of(oi) + oc,
    'request_value', game._value_of(ri) + rc));
  return jsonb_build_object('ok', true, 'trade_id', tid);
end $$;

create or replace function game._execute_trade(p_trade uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare t record; bad text; v_x uuid; fname text; tname text; total bigint;
begin
  select * into t from trades where id = p_trade for update;
  if t.status <> 'pending' then raise exception 'That offer is no longer pending.'; end if;
  perform 1 from profiles where id in (t.from_id, t.to_id) order by id for update;
  select username into fname from profiles where id = t.from_id;
  select username into tname from profiles where id = t.to_id;
  if exists (select 1 from unnest(t.offer_items) x left join player_items pi on pi.id = x
             where pi.id is null or pi.owner_id <> t.from_id or pi.location = 'listed' or pi.soulbound
                or pi.hot_until > now()) then
    bad := fname || ' no longer has everything they offered.';
  elsif exists (select 1 from unnest(t.request_items) x left join player_items pi on pi.id = x
             where pi.id is null or pi.owner_id <> t.to_id or pi.location in ('listed', 'vault') or pi.soulbound
                or pi.hot_until > now()) then
    bad := tname || ' no longer has everything requested.';
  elsif exists (select 1 from raids where status = 'active' and player_item_id = any(t.offer_items || t.request_items)) then
    bad := 'An item in this trade is being stolen right now!';
  elsif (select cash from profiles where id = t.from_id) < t.offer_cash then
    bad := fname || ' doesn''t have enough cash any more.';
  elsif (select cash from profiles where id = t.to_id) < t.request_cash then
    bad := tname || ' doesn''t have enough cash.';
  end if;
  if bad is not null then
    update trades set status = 'failed', note = bad, resolved_at = now() where id = p_trade;
    perform game._emit('trade_failed', t.from_id, t.to_id, jsonb_build_object('trade_id', p_trade, 'reason', bad));
    perform game._emit('trade_failed', t.to_id, t.from_id, jsonb_build_object('trade_id', p_trade, 'reason', bad));
    return jsonb_build_object('ok', false, 'reason', bad);
  end if;
  total := game._value_of(t.offer_items || t.request_items) + t.offer_cash + t.request_cash;
  perform game._settle(t.from_id);
  perform game._settle(t.to_id);
  foreach v_x in array t.offer_items loop perform game._transfer(v_x, t.to_id, 'trade'); end loop;
  foreach v_x in array t.request_items loop perform game._transfer(v_x, t.from_id, 'trade'); end loop;
  if t.offer_cash > 0 then
    perform game._cash(t.from_id, -t.offer_cash, 'trade', jsonb_build_object('trade_id', p_trade));
    perform game._cash(t.to_id, t.offer_cash, 'trade', jsonb_build_object('trade_id', p_trade));
  end if;
  if t.request_cash > 0 then
    perform game._cash(t.to_id, -t.request_cash, 'trade', jsonb_build_object('trade_id', p_trade));
    perform game._cash(t.from_id, t.request_cash, 'trade', jsonb_build_object('trade_id', p_trade));
  end if;
  foreach v_x in array t.offer_items loop perform game._autoplace(t.to_id, v_x); end loop;
  foreach v_x in array t.request_items loop perform game._autoplace(t.from_id, v_x); end loop;
  update trades set status = 'accepted', resolved_at = now() where id = p_trade;
  update player_stats set trades_done = trades_done + 1 where player_id in (t.from_id, t.to_id);
  perform game._quest_progress(t.from_id, 'complete_trades', 1);
  perform game._quest_progress(t.to_id, 'complete_trades', 1);
  perform game._xp(t.from_id, 30, 'trade');
  perform game._xp(t.to_id, 30, 'trade');
  perform game._check_achievements(t.from_id);
  perform game._check_achievements(t.to_id);
  perform game._emit('trade_done', t.from_id, t.to_id, jsonb_build_object('trade_id', p_trade, 'with', tname));
  perform game._emit('trade_done', t.to_id, t.from_id, jsonb_build_object('trade_id', p_trade, 'with', fname));
  if total >= 1000000 then
    perform game._emit('big_trade', null, t.from_id, jsonb_build_object('a', fname, 'b', tname, 'value', total));
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_trade_respond(p_pid uuid, p_trade uuid, p_accept boolean) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare t record; me text;
begin
  select * into t from trades where id = p_trade for update;
  if not found or t.to_id <> p_pid then raise exception 'Trade not found.'; end if;
  if t.status <> 'pending' then raise exception 'That offer is no longer pending (%).', t.status; end if;
  if not p_accept then
    update trades set status = 'declined', resolved_at = now() where id = p_trade;
    select username into me from profiles where id = p_pid;
    perform game._emit('trade_declined', t.from_id, p_pid, jsonb_build_object('trade_id', p_trade, 'by', me));
    return jsonb_build_object('ok', true, 'status', 'declined');
  end if;
  return game._execute_trade(p_trade);
end $$;

create or replace function game.act_trade_cancel(p_pid uuid, p_trade uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare t record;
begin
  select * into t from trades where id = p_trade for update;
  if not found or t.from_id <> p_pid then raise exception 'Trade not found.'; end if;
  if t.status <> 'pending' then raise exception 'That offer is no longer pending.'; end if;
  update trades set status = 'cancelled', resolved_at = now() where id = p_trade;
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------------
-- Quests, daily rewards, cosmetics, focus, tutorial, prestige
-- ---------------------------------------------------------------------------
create or replace function game._tvs_this_week(p_pid uuid) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select count(distinct l.item_id) from game.item_log l join game.items i on i.id = l.item_id
  where l.to_id = p_pid and i.kind = 'tv'
    and l.created_at >= (date_trunc('week', now() at time zone 'utc') at time zone 'utc')
$$;

create or replace function game.act_quests(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'period', q.period, 'title', q.title, 'metric', q.metric, 'target', q.target, 'reward', q.reward,
    'progress', least(q.target, case when q.metric = 'collect_tvs' then game._tvs_this_week(p_pid) else coalesce(pq.progress, 0) end),
    'claimed', pq.claimed_at is not null,
    'resets_at', game._period_end(q.period)) order by q.sort), '[]'::jsonb)
  from game.quests q
  left join game.player_quests pq on pq.player_id = p_pid and pq.quest_id = q.id and pq.period_key = game._period_key(q.period)
$$;

create or replace function game.act_claim_quest(p_pid uuid, p_quest text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare q record; v_key text; v_progress bigint; v_claimed timestamptz; rate double precision; v_cash bigint := 0;
        r jsonb; tk record;
begin
  perform 1 from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into q from quests where id = p_quest;
  if not found then raise exception 'Unknown quest.'; end if;
  v_key := game._period_key(q.period);
  select progress, claimed_at into v_progress, v_claimed from player_quests
  where player_id = p_pid and quest_id = p_quest and period_key = v_key for update;
  if q.metric = 'collect_tvs' then v_progress := game._tvs_this_week(p_pid); end if;
  if coalesce(v_progress, 0) < q.target then raise exception 'Quest not complete yet.'; end if;
  if v_claimed is not null then raise exception 'Already claimed — new quests soon!'; end if;
  insert into player_quests (player_id, quest_id, period_key, progress, claimed_at)
  values (p_pid, p_quest, v_key, v_progress, now())
  on conflict (player_id, quest_id, period_key) do update set claimed_at = now();
  perform game._settle(p_pid);
  rate := game._income_rate(p_pid);
  r := q.reward;
  v_cash := greatest(coalesce((r->>'cash')::bigint, 0), floor(rate * coalesce((r->>'income_secs')::numeric, 0))::bigint);
  if v_cash > 0 then perform game._cash(p_pid, v_cash, 'quest', jsonb_build_object('quest', p_quest)); end if;
  if r ? 'tokens' then
    for tk in select key, value::int as n from jsonb_each_text(r->'tokens') loop
      perform game._add_tokens(p_pid, tk.key, tk.n);
    end loop;
  end if;
  if r ? 'secret_keys' then
    update profiles set secret_keys = secret_keys + (r->>'secret_keys')::int where id = p_pid;
  end if;
  if r ? 'cosmetic' then
    insert into player_cosmetics (player_id, cosmetic_id) values (p_pid, r->>'cosmetic') on conflict do nothing;
  end if;
  perform game._xp(p_pid, coalesce((r->>'xp')::bigint, 0), 'quest');
  perform game._check_achievements(p_pid);
  return jsonb_build_object('ok', true, 'cash', v_cash, 'tokens', r->'tokens', 'xp', r->'xp',
                            'secret_keys', r->'secret_keys', 'cosmetic', r->'cosmetic');
end $$;

create or replace function game._daily_status(p_pid uuid) returns jsonb
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare p record; today date := (now() at time zone 'utc')::date; nxt int; can boolean;
begin
  select daily_streak, last_daily_day into p from profiles where id = p_pid;
  can := p.last_daily_day is distinct from today;
  nxt := case when p.last_daily_day = today - 1 or p.last_daily_day = today then p.daily_streak + (case when can then 1 else 0 end) else 1 end;
  return jsonb_build_object('can_claim', can, 'streak', case when p.last_daily_day >= today - 1 then p.daily_streak else 0 end,
    'next_day', ((greatest(nxt, 1) - 1) % 7) + 1,
    'resets_at', (date_trunc('day', now() at time zone 'utc') + interval '1 day') at time zone 'utc');
end $$;

create or replace function game.act_claim_daily(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; today date := (now() at time zone 'utc')::date; v_streak int; v_day int; rate double precision;
        reward jsonb; v_cash bigint; v_item text; v_id uuid;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if p.last_daily_day = today then raise exception 'Already claimed today — come back tomorrow!'; end if;
  v_streak := case when p.last_daily_day = today - 1 then p.daily_streak + 1 else 1 end;
  v_day := ((v_streak - 1) % 7) + 1;
  perform game._settle(p_pid);
  rate := game._income_rate(p_pid);
  if v_day = 1 then
    v_cash := greatest(2500, floor(rate * 120))::bigint;
    perform game._cash(p_pid, v_cash, 'daily', jsonb_build_object('day', v_day));
    reward := jsonb_build_object('type', 'cash', 'cash', v_cash);
  elsif v_day = 2 then
    perform game._add_tokens(p_pid, 'basic', 2);
    reward := jsonb_build_object('type', 'tokens', 'drop', 'basic', 'count', 2);
  elsif v_day = 3 then
    v_cash := greatest(6000, floor(rate * 300))::bigint;
    perform game._cash(p_pid, v_cash, 'daily', jsonb_build_object('day', v_day));
    reward := jsonb_build_object('type', 'cash', 'cash', v_cash);
  elsif v_day = 4 then
    select id into v_item from items where rarity = 'rare' and droppable order by random() limit 1;
    v_id := game._grant(p_pid, v_item, 'daily');
    perform game._autoplace(p_pid, v_id);
    reward := jsonb_build_object('type', 'item', 'item_id', v_item, 'player_item_id', v_id);
  elsif v_day = 5 then
    perform game._add_tokens(p_pid, 'premium', 1);
    reward := jsonb_build_object('type', 'tokens', 'drop', 'premium', 'count', 1);
  elsif v_day = 6 then
    v_cash := greatest(30000, floor(rate * 900))::bigint;
    perform game._cash(p_pid, v_cash, 'daily', jsonb_build_object('day', v_day));
    reward := jsonb_build_object('type', 'cash', 'cash', v_cash);
  else
    select id into v_item from items where event_only order by random() limit 1;
    v_id := game._grant(p_pid, v_item, 'daily');
    perform game._autoplace(p_pid, v_id);
    update profiles set secret_keys = secret_keys + 1 where id = p_pid;
    reward := jsonb_build_object('type', 'item', 'item_id', v_item, 'player_item_id', v_id, 'secret_keys', 1);
  end if;
  update profiles set daily_streak = v_streak, last_daily_day = today where id = p_pid;
  insert into daily_rewards (player_id, day, streak, cycle_day, reward) values (p_pid, today, v_streak, v_day, reward)
  on conflict (player_id, day) do update set streak = excluded.streak, cycle_day = excluded.cycle_day, reward = excluded.reward;
  perform game._xp(p_pid, 25 * v_day, 'daily');
  perform game._check_achievements(p_pid);
  return reward || jsonb_build_object('ok', true, 'day', v_day, 'streak', v_streak);
end $$;

create or replace function game.act_buy_cosmetic(p_pid uuid, p_id text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare c record; p record;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  select * into c from cosmetics where id = p_id;
  if not found then raise exception 'Unknown cosmetic.'; end if;
  if exists (select 1 from player_cosmetics where player_id = p_pid and cosmetic_id = p_id) then
    raise exception 'You already own that.';
  end if;
  if c.unlock is not null then
    if c.unlock like 'level:%' and p.level >= split_part(c.unlock, ':', 2)::int then null;
    elsif c.unlock like 'prestige:%' and p.prestige >= split_part(c.unlock, ':', 2)::int then null;
    else raise exception 'Locked — %.', case
        when c.unlock like 'level:%' then 'reach level ' || split_part(c.unlock, ':', 2)
        when c.unlock like 'prestige:%' then 'reach prestige ' || split_part(c.unlock, ':', 2)
        else 'earn it from a quest' end;
    end if;
  else
    perform game._settle(p_pid);
    perform game._cash(p_pid, -c.price, 'cosmetic', jsonb_build_object('id', p_id));
  end if;
  insert into player_cosmetics (player_id, cosmetic_id) values (p_pid, p_id);
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_equip(p_pid uuid, p_id text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare c record;
begin
  perform 1 from profiles where id = p_pid for update;
  select * into c from cosmetics where id = p_id;
  if not found then raise exception 'Unknown cosmetic.'; end if;
  if not exists (select 1 from player_cosmetics where player_id = p_pid and cosmetic_id = p_id) then
    raise exception 'You don''t own that yet.';
  end if;
  update profiles set cosmetics = cosmetics || jsonb_build_object(c.slot, p_id) where id = p_pid;
  return jsonb_build_object('ok', true);
end $$;

create or replace function game.act_set_focus(p_pid uuid, p_focus text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare lvl int;
begin
  select level into lvl from profiles where id = p_pid for update;
  if p_focus not in ('RANDOM', 'TECH', 'GAMING', 'CARS', 'FASHION', 'LUXURY', 'SPORTS') then
    raise exception 'Unknown collection.';
  end if;
  if p_focus <> 'RANDOM' and lvl < 5 then raise exception 'Choosing a collection focus unlocks at level 5.'; end if;
  update profiles set collection_focus = p_focus where id = p_pid;
  return jsonb_build_object('ok', true, 'focus', p_focus);
end $$;

-- Tutorial steps (client and server agree):
--  1 welcome · 2 first TV · 3 your base · 4 income · 5 cash for first drop · 6 open it
--  7 rarities · 8 another base · 9 stealing · 10 beginner raid · 11 market · 12 explore (99 = done)
create or replace function game.act_tutorial(p_pid uuid, p_step int) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; basic bigint; granted bigint := 0;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if p.tutorial_step >= 99 then return jsonb_build_object('ok', true, 'step', 99); end if;
  if p_step is null or p_step <= p.tutorial_step then return jsonb_build_object('ok', true, 'step', p.tutorial_step); end if;
  select price into basic from drop_types where id = 'basic';
  if p_step >= 5 and not coalesce((p.tutorial_flags->>'first_drop_cash')::boolean, false)
     and not exists (select 1 from player_stats where player_id = p_pid and drops_opened > 0) then
    perform game._cash(p_pid, basic, 'tutorial', jsonb_build_object('step', 5));
    granted := basic;
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

create or replace function game.act_prestige(p_pid uuid) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; newp int; burned int; oldcash bigint; newcash bigint;
begin
  select * into p from profiles where id = p_pid for update;
  if not found then raise exception 'Create your player first.'; end if;
  if p.level < 25 then raise exception 'Reach level 25 to prestige.'; end if;
  if exists (select 1 from raids where attacker_id = p_pid and status = 'active') then
    raise exception 'Finish your raid first.';
  end if;
  perform game._settle(p_pid);
  update trades set status = 'cancelled', note = 'Prestige reset', resolved_at = now()
  where status = 'pending' and (from_id = p_pid or to_id = p_pid);
  update market_listings set status = 'cancelled', resolved_at = now() where seller_id = p_pid and status = 'active';
  insert into item_log (player_item_id, item_id, from_id, to_id, via)
    select id, item_id, owner_id, null, 'prestige' from player_items
    where owner_id = p_pid and location <> 'vault' and not soulbound;
  delete from player_items where owner_id = p_pid and location <> 'vault' and not soulbound;
  get diagnostics burned = row_count;
  newp := p.prestige + 1;
  select cash into oldcash from profiles where id = p_pid;
  newcash := 5000::bigint * newp;
  update profiles set prestige = newp, level = 1, xp = 0, cash = newcash, income_remainder = 0,
    drop_tokens = jsonb_build_object('basic', 3, 'premium', 1), raid_cooldown_until = null
  where id = p_pid;
  insert into transactions (player_id, kind, amount, balance_after, ref)
  values (p_pid, 'prestige_reset', newcash - oldcash, newcash, jsonb_build_object('prestige', newp));
  update bases set base_level = 1, security_level = 1, shield_until = now() + interval '30 minutes'
  where player_id = p_pid;
  update player_items set location = 'display', slot = 0 where owner_id = p_pid and soulbound and location <> 'vault';
  insert into player_cosmetics (player_id, cosmetic_id)
    select p_pid, c.id from cosmetics c
    where c.unlock like 'prestige:%' and split_part(c.unlock, ':', 2)::int <= newp
  on conflict do nothing;
  perform game._check_achievements(p_pid);
  perform game._emit('prestige', null, p_pid, jsonb_build_object('player', p.username, 'prestige', newp));
  return jsonb_build_object('ok', true, 'prestige', newp, 'burned', burned);
end $$;

-- ---------------------------------------------------------------------------
-- Player creation
-- ---------------------------------------------------------------------------
create or replace function game.act_join(p_pid uuid, p_username text) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare v_name text := trim(coalesce(p_username, '')); v_id uuid;
begin
  if exists (select 1 from profiles where id = p_pid) then return jsonb_build_object('ok', true, 'existing', true); end if;
  if v_name !~ '^[A-Za-z0-9_]{3,16}$' then
    raise exception 'Usernames are 3–16 characters: letters, numbers or _.';
  end if;
  if exists (select 1 from profiles where lower(username) = lower(v_name)) then
    raise exception 'That username is taken.';
  end if;
  insert into profiles (id, username, cash, cosmetics)
  values (p_pid, v_name, 500, jsonb_build_object(
    'theme', 'theme-neon', 'floor', 'floor-grid', 'wall', 'wall-panel', 'lighting', 'light-cyan',
    'platform', 'plat-basic', 'trail', 'trail-none', 'nameplate', 'name-default', 'emote', 'emote-wave'));
  insert into bases (player_id) values (p_pid);
  insert into player_stats (player_id) values (p_pid);
  insert into player_cosmetics (player_id, cosmetic_id)
    select p_pid, id from cosmetics where price = 0 and unlock is null
  on conflict do nothing;
  v_id := game._grant(p_pid, 'nova-starter-tv', 'starter');
  update player_items set location = 'display', slot = 0 where id = v_id;
  perform game._emit('player_joined', null, p_pid, jsonb_build_object('player', v_name));
  return jsonb_build_object('ok', true, 'existing', false);
end $$;

-- Keep items_rev in sync so clients can skip re-downloading unchanged inventories.
create or replace function game._bump_items_rev() returns trigger
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    update profiles set items_rev = items_rev + 1 where id = new.owner_id;
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.owner_id <> new.owner_id) then
    update profiles set items_rev = items_rev + 1 where id = old.owner_id;
  end if;
  return null;
end $$;

drop trigger if exists player_items_rev on game.player_items;
create trigger player_items_rev after insert or update or delete on game.player_items
  for each row execute function game._bump_items_rev();
