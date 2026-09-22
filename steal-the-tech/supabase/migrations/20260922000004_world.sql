-- ============================================================================
-- STEAL THE TECH — the living world
--
-- world_tick() advances the simulation: live events, the dynamic market,
-- price history, raid resolution, expiring trades and NPC bot behaviour.
-- It runs lazily (at most every 10s) whenever any player calls the API, and
-- can also be scheduled with pg_cron:  select cron.schedule('stt-tick', '* * * * *', 'select game.world_tick()');
-- ============================================================================

create index if not exists market_history_ts on game.market_history (ts);

-- ---------------------------------------------------------------------------
-- One-time world seeding: NPC collections + 30 days of market history
-- ---------------------------------------------------------------------------
create or replace function game._seed_bots() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; r text; v_item text; x text;
begin
  for b in select * from profiles where is_bot and not coalesce((bot->>'seeded')::boolean, false) loop
    for r in select jsonb_array_elements_text(b.bot->'plan') loop
      select id into v_item from items where rarity = r and droppable order by random() limit 1;
      if v_item is not null then perform game._grant(b.id, v_item, 'seed'); end if;
    end loop;
    for x in select jsonb_array_elements_text(coalesce(b.bot->'extra', '[]'::jsonb)) loop
      begin
        perform game._grant(b.id, x, 'seed');
      exception when others then null;  -- sold out or unknown: skip
      end;
    end loop;
    perform game._arrange_best(b.id);
    update profiles set bot = bot || '{"seeded": true}'::jsonb, last_income_at = now() where id = b.id;
  end loop;
end $$;

create or replace function game._seed_history() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare base timestamptz := date_trunc('hour', now());
begin
  if exists (select 1 from market_history limit 1) then return; end if;
  -- Backwards random walk that ends at today's price.
  insert into market_history (item_id, ts, price, demand, supply, listed, volume)
  select item_id, ts,
         greatest(1, round(price * exp(walk)))::bigint,
         round(greatest(5, least(95, 50 + walk * 60))::numeric, 1), 0, 0, 0
  from (
    select ms.item_id, ms.price, t.ts,
           sum(t.step * (random() - 0.5) * 0.05) over (partition by ms.item_id order by t.ts desc
             rows between unbounded preceding and current row) as walk
    from market_state ms
    cross join lateral (
      select g as ts, 1.0 as step from generate_series(base - interval '2 hours', base, interval '10 minutes') g
      union all
      select g, 1.6 from generate_series(base - interval '48 hours', base - interval '3 hours', interval '1 hour') g
      union all
      select g, 2.6 from generate_series(base - interval '7 days', base - interval '52 hours', interval '4 hours') g
      union all
      select g, 4.2 from generate_series(date_trunc('day', base) - interval '30 days', date_trunc('day', base) - interval '8 days', interval '1 day') g
    ) t
  ) w
  on conflict (item_id, ts) do nothing;
end $$;

-- ---------------------------------------------------------------------------
-- Tick pieces
-- ---------------------------------------------------------------------------
create or replace function game._tick_events() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare ev record; w record; et record; cat text; dur interval := interval '8 minutes';
begin
  for ev in
    select e.*, t.title, t.icon from events e join event_types t on t.id = e.type_id
    where e.ends_at <= now() and not e.announced_end
  loop
    update events set announced_end = true where id = ev.id;
    perform game._emit('event_end', null, null, jsonb_build_object('type', ev.type_id, 'title', ev.title, 'icon', ev.icon));
  end loop;
  if exists (select 1 from events where now() >= starts_at and now() < ends_at) then return; end if;
  select * into w from world where id = 1;
  if w.next_event_at is null then
    update world set next_event_at = now() + interval '2 minutes' where id = 1;
    return;
  end if;
  if now() < w.next_event_at then return; end if;
  select * into et from event_types order by -ln(1 - random()) / weight limit 1;
  cat := case when et.category = '*'
              then (array['TECH','GAMING','CARS','FASHION','LUXURY','SPORTS'])[1 + floor(random() * 6)::int]
              else et.category end;
  insert into events (type_id, category, starts_at, ends_at) values (et.id, cat, now(), now() + dur);
  update world set next_event_at = now() + dur + make_interval(mins => 4 + floor(random() * 6)::int) where id = 1;
  perform game._emit('event_start', null, null, jsonb_build_object(
    'type', et.id, 'title', et.title, 'icon', et.icon, 'description', et.description,
    'category', cat, 'ends_at', now() + dur));
end $$;

create or replace function game._tick_market(p_dt double precision) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare ev record; m record; k double precision; newd double precision; tdemand double precision;
        exp_sup double precision; sf double precision; df double precision; lp double precision;
        em double precision; target double precision; newp double precision; old1h bigint; alerted boolean := false;
        chg double precision;
begin
  select * into ev from game._current_event();
  k := 1 - exp(-p_dt / 300.0);
  for m in
    with sup as (select item_id, count(*)::int as c from player_items group by item_id),
         lst as (select item_id, count(*)::int as c from market_listings where status = 'active' group by item_id),
         vol as (select item_id, count(*)::int as c from market_sales
                 where kind = 'listing' and created_at > now() - interval '24 hours' group by item_id)
    select ms.item_id, ms.price, ms.demand, ms.last_alert_at, i.base_value, i.category, i.name, i.rarity,
           i.max_supply, ra.expected_supply, ra.tier,
           coalesce(sup.c, 0) as sup, coalesce(lst.c, 0) as lst, coalesce(vol.c, 0) as vol
    from market_state ms
    join items i on i.id = ms.item_id
    join rarities ra on ra.id = i.rarity
    left join sup on sup.item_id = ms.item_id
    left join lst on lst.item_id = ms.item_id
    left join vol on vol.item_id = ms.item_id
  loop
    tdemand := 50 + case when ev.category is not null and m.category = ev.category then ev.demand_boost else 0 end;
    newd := m.demand + (tdemand - m.demand) * (1 - exp(-p_dt / 240.0)) + (random() - 0.5) * 4 * sqrt(p_dt / 10.0);
    newd := greatest(0, least(100, newd));
    exp_sup := case when m.max_supply is not null then m.max_supply * 0.5 else m.expected_supply end;
    sf := power(greatest(0.4, least(2.5, (exp_sup + 5.0) / (m.sup + 5.0))), 0.35);
    df := 0.6 + 0.8 * newd / 100.0;
    lp := 1 - least(0.15, m.lst::double precision / (m.sup + 1) * 0.3);
    em := case when ev.category is not null and m.category = ev.category then ev.price_mult else 1 end;
    target := m.base_value * sf * df * lp * em;
    newp := m.price + (target - m.price) * k + m.price * (random() - 0.5) * 0.012 * sqrt(p_dt / 10.0);
    newp := greatest(m.base_value * 0.2, least(m.base_value * 6.0, newp));
    update market_state set price = greatest(1, round(newp))::bigint, demand = round(newd::numeric, 2),
      supply = m.sup, listed = m.lst, volume_24h = m.vol, updated_at = now()
    where item_id = m.item_id;
    if not alerted and m.tier >= 3 and (m.last_alert_at is null or m.last_alert_at < now() - interval '30 minutes')
       and random() < 0.25 then
      select price into old1h from market_history
      where item_id = m.item_id and ts <= now() - interval '1 hour' order by ts desc limit 1;
      if old1h is not null and old1h > 0 then
        chg := (newp - old1h) / old1h;
        if abs(chg) >= 0.15 then
          update market_state set last_alert_at = now() where item_id = m.item_id;
          perform game._emit('market_alert', null, null, jsonb_build_object(
            'item_id', m.item_id, 'item', m.name, 'rarity', m.rarity,
            'change', round((chg * 100)::numeric, 1), 'direction', case when chg > 0 then 'up' else 'down' end));
          alerted := true;
        end if;
      end if;
    end if;
  end loop;
end $$;

create or replace function game._tick_history() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare w record; bucket timestamptz; u timestamp := now() at time zone 'utc';
begin
  select * into w from world where id = 1;
  bucket := (date_trunc('hour', u) + floor(extract(minute from u) / 5) * interval '5 minutes') at time zone 'utc';
  if w.last_history_at is not null and w.last_history_at >= bucket then return; end if;
  insert into market_history (item_id, ts, price, demand, supply, listed, volume)
    select item_id, bucket, price, round(demand, 1), supply, listed, volume_24h from market_state
  on conflict (item_id, ts) do update set price = excluded.price, demand = excluded.demand,
    supply = excluded.supply, listed = excluded.listed, volume = excluded.volume;
  update world set last_history_at = bucket where id = 1;
  -- Downsample: 5-min points for 48h, hourly for 30 days, daily after that.
  delete from market_history where ts < now() - interval '48 hours'
    and date_part('minute', ts at time zone 'utc') <> 0;
  delete from market_history where ts < now() - interval '30 days'
    and (date_part('hour', ts at time zone 'utc') <> 0 or date_part('minute', ts at time zone 'utc') <> 0);
end $$;

create or replace function game._tick_raids() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare r record;
begin
  -- Bots finish on time; humans who closed the tab get resolved fairly a few seconds later.
  for r in
    select rd.id from raids rd join profiles a on a.id = rd.attacker_id
    where rd.status = 'active'
      and (rd.ends_at < now() - interval '8 seconds' or (a.is_bot and rd.ends_at <= now()))
    order by rd.ends_at limit 50
  loop
    perform game._resolve_raid(r.id);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- NPC bots
-- ---------------------------------------------------------------------------
create or replace function game._bot_answer_trade(p_trade uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare t record; b record; vin bigint; vout bigint; need numeric; style text; bname text; res jsonb; v_note text;
begin
  select * into t from trades where id = p_trade for update;
  if t.status <> 'pending' then return; end if;
  select * into b from profiles where id = t.to_id;
  style := coalesce(b.bot->>'style', 'trader');
  vin := game._value_of(t.offer_items) + t.offer_cash;
  vout := game._value_of(t.request_items) + t.request_cash;
  need := case style when 'rookie' then 0.9 when 'trader' then 1.03 when 'collector' then 1.08
                     when 'raider' then 1.1 else 1.15 end;
  if vout = 0 or vin >= vout * need then
    res := game._execute_trade(p_trade);
    if not coalesce((res->>'ok')::boolean, false) then return; end if;
  else
    v_note := b.username || ': ' || (array[
      'Nah, that''s a lowball.', 'Not even close. Try again.', 'You''ll have to do better than that.',
      'I know what that''s worth, friend.'])[1 + floor(random() * 4)::int]
      || ' I''d need about ' || game.fmt_money(ceil(vout * need - vin)) || ' more.';
    update trades set status = 'declined', note = v_note, resolved_at = now() where id = p_trade;
    perform game._emit('trade_declined', t.from_id, t.to_id, jsonb_build_object('trade_id', p_trade, 'by', b.username, 'note', v_note));
  end if;
end $$;

create or replace function game._bot_restock(p_bot uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; shown int; inv int; slots int; r text; v_item text;
begin
  select * into b from profiles where id = p_bot;
  slots := game._slots(p_bot);
  select count(*) filter (where location = 'display'), count(*) filter (where location = 'inventory')
    into shown, inv from player_items where owner_id = p_bot;
  if shown < slots and inv > 0 then
    perform game._arrange_best(p_bot);
    return;
  end if;
  -- Robbed bots slowly restock from their personal "plan" so there's always something to raid.
  if shown < least(slots, jsonb_array_length(b.bot->'plan')) and random() < 0.25 then
    r := b.bot->'plan'->>floor(random() * jsonb_array_length(b.bot->'plan'))::int;
    select id into v_item from items where rarity = r and droppable order by random() limit 1;
    if v_item is not null then
      perform game._grant(p_bot, v_item, 'restock');
      perform game._arrange_best(p_bot);
    end if;
  end if;
end $$;

create or replace function game._bot_open_drop(p_bot uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; d record;
begin
  select * into b from profiles where id = p_bot;
  select * into d from drop_types
  where not requires_key and not event_only and min_level <= b.level and price * 4 <= b.cash
  order by price desc limit 1;
  if not found then return; end if;
  -- whales sometimes splurge on a cheaper drop too, keeps the feed varied
  if random() < 0.3 then
    select * into d from drop_types
    where not requires_key and not event_only and min_level <= b.level and price * 4 <= b.cash
    order by random() limit 1;
  end if;
  perform game.act_open_drop(p_bot, d.id, false);
  perform game._arrange_best(p_bot);
  -- keep bot inventories small: sell the weakest spare
  if (select count(*) from player_items where owner_id = p_bot and location = 'inventory') > 4 then
    perform game.act_quick_sell(p_bot, pi.id) from (
      select pi.id from player_items pi join items i on i.id = pi.item_id
      where pi.owner_id = p_bot and pi.location = 'inventory' and not pi.soulbound
        and (pi.hot_until is null or pi.hot_until < now())
      order by i.base_income asc limit 1) pi;
  end if;
end $$;

create or replace function game._bot_market(p_bot uuid) returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare b record; l record; pi record; mprice bigint; v_price bigint; nlist int;
begin
  select * into b from profiles where id = p_bot;
  -- Buy a fair or cheap listing (humans first).
  if random() < 0.6 then
    select ml.id, ml.price into l
    from market_listings ml join market_state ms on ms.item_id = ml.item_id
    join profiles s on s.id = ml.seller_id
    where ml.status = 'active' and ml.seller_id <> p_bot and ml.price <= ms.price * 0.98
      and ml.price * 2 <= b.cash and ml.created_at < now() - interval '20 seconds'
    order by s.is_bot, ml.price::numeric / ms.price, random() limit 1;
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
    select p.id, p.item_id into pi from player_items p
    where p.owner_id = p_bot and p.location in ('inventory', 'display') and not p.soulbound
      and (p.hot_until is null or p.hot_until < now())
      and not exists (select 1 from raids r where r.player_item_id = p.id and r.status = 'active')
    order by (p.location = 'inventory') desc, random() limit 1;
    if found and (random() < 0.5 or exists (select 1 from player_items where id = pi.id and location = 'inventory')) then
      select price into mprice from market_state where item_id = pi.item_id;
      v_price := greatest(1, round(mprice * (1.03 + random() * 0.22)))::bigint;
      begin
        perform game.act_list(p_bot, pi.id, v_price);
      exception when others then null;
      end;
    end if;
  end if;
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
  order by -ln(1 - random()) / sqrt(ms.price::double precision) limit 1;
  if not found then return; end if;
  res := game.act_start_steal(b.id, v_pi.id, false);
  -- humans always get at least 12 seconds to react
  update raids set ends_at = greatest(ends_at, started_at + interval '12 seconds') where id = (res->>'raid_id')::uuid;
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
  select pi.id, pi.item_id, ms.price into want
  from player_items pi join items i on i.id = pi.item_id join rarities r on r.id = i.rarity
  join market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = h.id and pi.location = 'display' and not pi.soulbound and r.tier >= 2
    and (pi.hot_until is null or pi.hot_until < now())
  order by random() limit 1;
  if not found then return; end if;
  select * into b from profiles
  where is_bot and bot->>'style' in ('trader', 'collector', 'whale') and cash > want.price * 2
  order by random() limit 1;
  if not found then return; end if;
  -- Sometimes offer an item of similar value, otherwise a cash premium.
  select pi.id, ms.price into give
  from player_items pi join market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = b.id and pi.location in ('inventory', 'display') and not pi.soulbound
    and (pi.hot_until is null or pi.hot_until < now())
    and ms.price between want.price * 0.9 and want.price * 1.3
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
    if random() < 0.35 then perform game._bot_raid_human(); end if;
    if random() < 0.07 * f then perform game._bot_heist(); end if;
    if random() < 0.05 * f then perform game._bot_offer_trade(); end if;
  exception when others then
    raise warning 'bot social action failed: %', sqlerrm;
  end;
end $$;

create or replace function game._tick_cleanup() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
begin
  update trades set status = 'expired', resolved_at = now()
  where status = 'pending' and created_at < now() - interval '24 hours';
  delete from server_events where created_at < now() - interval '3 days';
  delete from market_sales where created_at < now() - interval '30 days';
end $$;

-- ---------------------------------------------------------------------------
-- The tick itself
-- ---------------------------------------------------------------------------
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
  perform game._tick_bots(dt);
  if w.tick_count % 30 = 0 then perform game._tick_cleanup(); end if;
  return jsonb_build_object('ok', true, 'dt', dt);
end $$;

-- Called at the start of every public RPC. Never blocks and never breaks the caller.
create or replace function game._maybe_tick() returns void
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare last timestamptz;
begin
  select last_tick_at into last from world where id = 1;
  if last is not null and last > now() - interval '10 seconds' then return; end if;
  if not pg_try_advisory_xact_lock(727274) then return; end if;
  begin
    perform game.world_tick(false);
  exception when others then
    raise warning 'world_tick failed: %', sqlerrm;
  end;
end $$;
