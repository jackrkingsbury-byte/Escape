-- ============================================================================
-- STEAL THE TECH — public API
--
-- The ONLY functions a browser can call. Every one of them:
--   * takes a single jsonb argument `p`, returns jsonb;
--   * identifies the player with auth.uid() (never trusts an id from the client);
--   * runs SECURITY DEFINER with a pinned search_path;
--   * is executable by `authenticated` only (not anon).
-- supabase-js:  supabase.rpc('stt_open_drop', { p: { drop: 'basic' } })
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Argument helpers (friendly errors instead of cast failures)
-- ---------------------------------------------------------------------------
create or replace function game._p_uuid(p jsonb, k text) returns uuid
language plpgsql immutable set search_path = pg_catalog, game, pg_temp as $$
begin
  if p->>k is null then raise exception 'Missing %.', k; end if;
  return (p->>k)::uuid;
exception when invalid_text_representation then
  raise exception 'Invalid %.', k;
end $$;

create or replace function game._p_bigint(p jsonb, k text) returns bigint
language plpgsql immutable set search_path = pg_catalog, game, pg_temp as $$
begin
  return (p->>k)::numeric::bigint;
exception when others then
  raise exception 'Invalid %.', k;
end $$;

create or replace function game._now_ms() returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select (extract(epoch from now()) * 1000)::bigint
$$;

-- ---------------------------------------------------------------------------
-- Read models
-- ---------------------------------------------------------------------------
create or replace function game._base_value(p_pid uuid) returns bigint
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(sum(ms.price), 0)::bigint from game.player_items pi
  join game.market_state ms on ms.item_id = pi.item_id
  where pi.owner_id = p_pid and pi.location = 'display'
$$;

create or replace function game.q_sync(p_pid uuid, p_since bigint, p_items_rev bigint) returns jsonb
language plpgsql set search_path = pg_catalog, game, pg_temp as $$
declare p record; b record; s record; ev record; w record; rate double precision; v_r record;
        v_items jsonb; v_feed jsonb; v_claimable int;
begin
  perform 1 from profiles where id = p_pid;
  if not found then
    return jsonb_build_object('needs_join', true, 'server_time', game._now_ms());
  end if;
  -- Resolve raids that are due and involve me, so results appear instantly.
  for v_r in
    select rd.id from raids rd join profiles a on a.id = rd.attacker_id
    where rd.status = 'active'
      and ((rd.defender_id = p_pid and a.is_bot and rd.ends_at <= now())
        or (rd.attacker_id = p_pid and rd.ends_at < now() - interval '8 seconds'))
  loop
    perform game._resolve_raid(v_r.id);
  end loop;
  perform game._settle(p_pid);
  update profiles set last_seen_at = now() where id = p_pid;
  select * into p from profiles where id = p_pid;
  select * into b from bases where player_id = p_pid;
  select * into s from player_stats where player_id = p_pid;
  select * into ev from game._current_event();
  select * into w from world where id = 1;
  rate := game._income_rate(p_pid);

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
      'base_value', game._base_value(p_pid),
      'xp', p.xp, 'level', p.level, 'title', game.level_title(p.level),
      'xp_level', game.xp_for_level(p.level), 'xp_next', game.xp_for_level(p.level + 1),
      'prestige', p.prestige, 'income_bonus', 0.05 * p.prestige, 'luck', game._luck(p_pid),
      'focus', p.collection_focus, 'drop_tokens', p.drop_tokens, 'secret_keys', p.secret_keys,
      'tutorial_step', p.tutorial_step, 'tutorial_flags', p.tutorial_flags, 'cosmetics', p.cosmetics,
      'owned_cosmetics', (select coalesce(jsonb_agg(cosmetic_id), '[]'::jsonb) from player_cosmetics where player_id = p_pid),
      'raid_cooldown_until', p.raid_cooldown_until, 'items_rev', p.items_rev,
      'base_level', b.base_level, 'slots', game._slots(p_pid), 'security_level', b.security_level,
      'vault_level', b.vault_level, 'vault_capacity', game._vault_capacity(p_pid), 'shield_until', b.shield_until,
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
                   'started_at', r.started_at, 'ends_at', r.ends_at, 'defended', r.defended, 'revenge', r.is_revenge)), '[]'::jsonb)
                 from raids r join profiles a on a.id = r.attacker_id
                 where r.defender_id = p_pid and r.status = 'active'),
    'outgoing_raid', (select jsonb_build_object('id', r.id, 'defender', d.username, 'defender_id', d.id,
                   'item_id', r.item_id, 'player_item_id', r.player_item_id, 'started_at', r.started_at,
                   'ends_at', r.ends_at, 'defended', r.defended, 'chance', r.chance, 'revenge', r.is_revenge,
                   'tutorial', r.is_tutorial)
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

create or replace function game._plot_json(p_pid uuid, p_viewer uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'username', p.username, 'is_bot', p.is_bot, 'level', p.level, 'prestige', p.prestige,
    'title', game.level_title(p.level), 'bio', coalesce(p.bot->>'bio', ''),
    'base_level', b.base_level, 'slots', game._slots(p.id), 'security_level', b.security_level,
    'vault_level', b.vault_level, 'cosmetics', p.cosmetics, 'base_value', game._base_value(p.id),
    'shield_until', b.shield_until, 'protected', (not p.is_bot and p.level < 3),
    'online', p.is_bot or p.last_seen_at > now() - interval '60 seconds',
    'vault_used', (select count(*) from game.player_items v where v.owner_id = p.id and v.location = 'vault'),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'slot', pi.slot,
                'serial', pi.serial, 'soulbound', pi.soulbound, 'hot_until', pi.hot_until,
                'under_raid', exists (select 1 from game.raids r where r.player_item_id = pi.id and r.status = 'active'))
                order by pi.slot), '[]'::jsonb)
              from game.player_items pi where pi.owner_id = p.id and pi.location = 'display'))
  from game.profiles p join game.bases b on b.player_id = p.id
  where p.id = p_pid
$$;

create or replace function game.q_world(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  with ps as (
    select id, 0 as ord from game.profiles where id = p_pid
    union all
    select id, 1 from game.profiles where is_bot
    union all
    (select id, 2 from game.profiles where not is_bot and id <> p_pid order by last_seen_at desc limit 12)
  )
  select jsonb_build_object(
    'server_time', game._now_ms(),
    'players', coalesce(jsonb_agg(game._plot_json(ps.id, p_pid) order by ps.ord, ps.id), '[]'::jsonb),
    'online', (select count(*) from game.profiles where not is_bot and last_seen_at > now() - interval '60 seconds'))
  from ps
$$;

create or replace function game.q_base(p_viewer uuid, p_target uuid) returns jsonb
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare j jsonb; rv boolean; reason text; items jsonb; sec text;
begin
  j := game._plot_json(p_target, p_viewer);
  if j is null then raise exception 'Player not found.'; end if;
  rv := game._revenge_row(p_viewer, p_target) is not null;
  reason := game._raid_block_reason(p_viewer, p_target, rv);
  select name into sec from upgrade_levels where kind = 'security' and level = (j->>'security_level')::int;
  select coalesce(jsonb_agg(x.it || jsonb_build_object(
           'chance', game._raid_chance(p_viewer, p_target, x.it->>'item_id', rv),
           'seconds', game._raid_seconds(p_target, x.it->>'item_id', rv))), '[]'::jsonb)
    into items from jsonb_array_elements(j->'items') as x(it);
  return j || jsonb_build_object('items', items, 'revenge_available', rv, 'raid_block', reason,
    'security_name', sec, 'income', round(game._income_rate(p_target)::numeric, 2),
    'is_me', p_viewer = p_target);
end $$;

create or replace function game.q_raid_targets(p_pid uuid, p_sort text) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  with me as (select level from game.profiles where id = p_pid),
  t as (
    select p.id, p.username, p.is_bot, p.level, p.prestige, b.security_level, b.shield_until,
           (not p.is_bot and p.level < 3) as protected,
           p.is_bot or p.last_seen_at > now() - interval '60 seconds' as online,
           game._base_value(p.id) as base_value,
           (select count(*) from game.player_items x where x.owner_id = p.id and x.location = 'display') as shown,
           (select jsonb_build_object('item_id', pi.item_id, 'price', ms.price, 'serial', pi.serial)
              from game.player_items pi join game.market_state ms on ms.item_id = pi.item_id
              where pi.owner_id = p.id and pi.location = 'display' and not pi.soulbound
              order by ms.price desc limit 1) as top_item,
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

create or replace function game.q_revenge(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'raid_id', r.id, 'attacker_id', r.attacker_id, 'attacker', a.username, 'attacker_bot', a.is_bot,
    'item_id', r.item_id, 'player_item_id', r.player_item_id, 'resolved_at', r.resolved_at,
    'still_theirs', exists (select 1 from game.player_items pi where pi.id = r.player_item_id and pi.owner_id = r.attacker_id),
    'on_display', exists (select 1 from game.player_items pi where pi.id = r.player_item_id and pi.owner_id = r.attacker_id and pi.location = 'display'),
    'expires_at', r.resolved_at + interval '24 hours') order by r.resolved_at desc), '[]'::jsonb)
  from game.raids r join game.profiles a on a.id = r.attacker_id
  where r.defender_id = p_pid and r.status = 'success' and not r.revenge_used
    and r.resolved_at > now() - interval '24 hours'
$$;

create or replace function game.q_leaderboard(p_pid uuid, p_kind text) returns jsonb
language plpgsql stable set search_path = pg_catalog, game, pg_temp as $$
declare rows jsonb; mine jsonb;
begin
  if p_kind not in ('richest', 'base_value', 'items', 'secrets', 'raids', 'trades', 'level', 'collection') then
    raise exception 'Unknown leaderboard.';
  end if;
  with base as (
    select p.id, p.username, p.is_bot, p.level, p.prestige, p.xp, p.cash,
      case p_kind
        when 'richest' then p.cash::numeric
        when 'base_value' then game._base_value(p.id)::numeric
        when 'items' then (select count(*) from player_items x where x.owner_id = p.id)::numeric
        when 'secrets' then (select count(*) from player_items x join items i on i.id = x.item_id
                             where x.owner_id = p.id and i.rarity = 'secret')::numeric
        when 'raids' then s.steals_won::numeric
        when 'trades' then (s.trades_done + s.market_sales + s.market_buys)::numeric
        when 'level' then p.prestige::numeric * 1000000000000 + p.xp
        when 'collection' then (select count(*) from player_collection c where c.player_id = p.id)::numeric
      end as score
    from profiles p join player_stats s on s.player_id = p.id
  ), ranked as (
    select *, row_number() over (order by score desc, id) as rank from base
  )
  select coalesce(jsonb_agg(jsonb_build_object('rank', rank, 'id', id, 'username', username, 'is_bot', is_bot,
           'level', level, 'prestige', prestige, 'score', score, 'me', id = p_pid) order by rank)
           filter (where rank <= 50), '[]'::jsonb),
         (jsonb_agg(jsonb_build_object('rank', rank, 'id', id, 'username', username, 'is_bot', is_bot,
           'level', level, 'prestige', prestige, 'score', score, 'me', true)) filter (where id = p_pid)) -> 0
    into rows, mine
  from ranked;
  return jsonb_build_object('kind', p_kind, 'rows', rows, 'me', mine);
end $$;

create or replace function game.q_profile(p_viewer uuid, p_target uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'username', p.username, 'is_bot', p.is_bot, 'bio', coalesce(p.bot->>'bio', ''),
    'level', p.level, 'title', game.level_title(p.level), 'prestige', p.prestige,
    'base_value', game._base_value(p.id), 'income', round(game._income_rate(p.id)::numeric, 2),
    'base_level', b.base_level, 'security_level', b.security_level, 'cosmetics', p.cosmetics,
    'collection', (select count(*) from game.player_collection c where c.player_id = p.id),
    'collection_total', (select count(*) from game.items i where i.droppable or i.event_only),
    'rare_items', (select count(*) from game.player_items x join game.items i on i.id = x.item_id
                   join game.rarities r on r.id = i.rarity where x.owner_id = p.id and r.tier >= 5),
    'secrets', (select coalesce(jsonb_agg(jsonb_build_object('item_id', x.item_id, 'serial', x.serial)), '[]'::jsonb)
                from game.player_items x join game.items i on i.id = x.item_id
                where x.owner_id = p.id and i.rarity = 'secret' and x.location <> 'vault'),
    'showcase', (select coalesce(jsonb_agg(s.j), '[]'::jsonb) from (
                   select jsonb_build_object('item_id', x.item_id, 'serial', x.serial) as j
                   from game.player_items x join game.market_state ms on ms.item_id = x.item_id
                   where x.owner_id = p.id and x.location = 'display' order by ms.price desc limit 6) s),
    'achievements', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'icon', a.icon,
                       'unlocked_at', pa.unlocked_at) order by pa.unlocked_at desc), '[]'::jsonb)
                     from game.player_achievements pa join game.achievements a on a.id = pa.achievement_id
                     where pa.player_id = p.id),
    'stats', to_jsonb(st) - 'player_id',
    'online', p.is_bot or p.last_seen_at > now() - interval '60 seconds',
    'shield_until', b.shield_until, 'protected', (not p.is_bot and p.level < 3),
    'created_at', p.created_at, 'is_me', p.id = p_viewer)
  from game.profiles p join game.bases b on b.player_id = p.id join game.player_stats st on st.player_id = p.id
  where p.id = p_target
$$;

create or replace function game.q_collection(p_target uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'player_id', p_target,
    'username', (select username from game.profiles where id = p_target),
    'discovered', (select coalesce(jsonb_agg(jsonb_build_object('item_id', c.item_id, 'first_found_at', c.first_found_at,
                     'times_found', c.times_found)), '[]'::jsonb) from game.player_collection c where c.player_id = p_target),
    'owned', (select coalesce(jsonb_object_agg(item_id, n), '{}'::jsonb) from (
                select item_id, count(*) as n from game.player_items where owner_id = p_target group by item_id) o))
$$;

create or replace function game.q_catalog() returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'items', (select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'brand', i.brand, 'kind', i.kind,
                'category', i.category, 'rarity', i.rarity, 'base_value', i.base_value, 'base_income', i.base_income,
                'max_supply', i.max_supply, 'tradeable', i.tradeable, 'droppable', i.droppable, 'event_only', i.event_only,
                'color', i.color, 'accent', i.accent, 'flavor', i.flavor) order by i.sort) from game.items i),
    'rarities', (select jsonb_agg(to_jsonb(r) order by r.tier) from game.rarities r),
    'drops', (select jsonb_agg(to_jsonb(d) order by d.sort) from game.drop_types d),
    'upgrades', (select jsonb_agg(to_jsonb(u) order by u.kind, u.level) from game.upgrade_levels u),
    'quests', (select jsonb_agg(to_jsonb(q) order by q.sort) from game.quests q),
    'achievements', (select jsonb_agg(to_jsonb(a) order by a.sort) from game.achievements a),
    'cosmetics', (select jsonb_agg(to_jsonb(c) order by c.sort) from game.cosmetics c),
    'event_types', (select jsonb_agg(to_jsonb(e)) from game.event_types e),
    'level_titles', (select jsonb_agg(to_jsonb(l) order by l.level) from game.level_titles l),
    'rules', jsonb_build_object('quick_sell_rate', 0.6, 'market_fee', 0.05, 'list_min', 0.25, 'list_max', 5,
                                'prestige_level', 25, 'focus_level', 5, 'protection_level', 3,
                                'shield_minutes', 10, 'hot_minutes', 5, 'offline_cap_hours', 12))
$$;

create or replace function game.q_market() returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object('server_time', game._now_ms(), 'items', coalesce(jsonb_agg(jsonb_build_object(
    'item_id', ms.item_id, 'price', ms.price, 'demand', round(ms.demand, 1), 'supply', ms.supply,
    'listed', ms.listed, 'volume_24h', ms.volume_24h, 'minted', s.minted,
    'change_24h', case when h.price is null or h.price = 0 then 0
                       else round(((ms.price - h.price)::numeric / h.price) * 100, 1) end,
    'low', (select min(l.price) from game.market_listings l where l.item_id = ms.item_id and l.status = 'active'))), '[]'::jsonb))
  from game.market_state ms
  left join game.limited_item_supply s on s.item_id = ms.item_id
  left join lateral (select price from game.market_history mh
                     where mh.item_id = ms.item_id and mh.ts <= now() - interval '24 hours'
                     order by mh.ts desc limit 1) h on true
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
                   'mine', l.seller_id = p_viewer) order by l.price, l.created_at), '[]'::jsonb)
                 from (select * from market_listings where item_id = p_item and status = 'active' order by price limit 30) l
                 join profiles p on p.id = l.seller_id join player_items pi on pi.id = l.player_item_id));
end $$;

create or replace function game.q_listings(p_viewer uuid, p_filter jsonb) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(x.j order by x.ratio, x.created_at), '[]'::jsonb) from (
    select jsonb_build_object('id', l.id, 'item_id', l.item_id, 'price', l.price, 'market', ms.price,
             'seller', p.username, 'seller_id', p.id, 'seller_bot', p.is_bot, 'serial', pi.serial,
             'created_at', l.created_at, 'mine', l.seller_id = p_viewer) as j,
           l.price::numeric / ms.price as ratio, l.created_at
    from game.market_listings l
    join game.market_state ms on ms.item_id = l.item_id
    join game.profiles p on p.id = l.seller_id
    join game.player_items pi on pi.id = l.player_item_id
    join game.items i on i.id = l.item_id
    where l.status = 'active'
      and (p_filter->>'category' is null or i.category = p_filter->>'category')
      and (p_filter->>'rarity' is null or i.rarity = p_filter->>'rarity')
      and (not coalesce((p_filter->>'mine')::boolean, false) or l.seller_id = p_viewer)
    order by l.price::numeric / ms.price, l.created_at
    limit 80) x
$$;

create or replace function game.q_trades(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'from_id', t.from_id, 'from', f.username, 'from_bot', f.is_bot,
    'to_id', t.to_id, 'to', tt.username, 'to_bot', tt.is_bot,
    'offer_cash', t.offer_cash, 'request_cash', t.request_cash, 'message', t.message,
    'status', t.status, 'note', t.note, 'created_at', t.created_at, 'resolved_at', t.resolved_at,
    'incoming', t.to_id = p_pid,
    'offer_items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'serial', pi.serial,
                      'available', pi.owner_id = t.from_id)), '[]'::jsonb)
                    from game.player_items pi where pi.id = any(t.offer_items)),
    'request_items', (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'item_id', pi.item_id, 'serial', pi.serial,
                      'available', pi.owner_id = t.to_id)), '[]'::jsonb)
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

create or replace function game.q_activity(p_pid uuid) returns jsonb
language sql stable set search_path = pg_catalog, game, pg_temp as $$
  select jsonb_build_object(
    'transactions', (select coalesce(jsonb_agg(to_jsonb(x) - 'player_id' order by x.id desc), '[]'::jsonb) from (
                       select * from game.transactions where player_id = p_pid order by id desc limit 40) x),
    'raids', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'status', r.status, 'item_id', r.item_id,
                'attacker', a.username, 'defender', d.username, 'mine', r.attacker_id = p_pid,
                'fine', r.fine, 'defended', r.defended, 'at', coalesce(r.resolved_at, r.started_at)) order by r.started_at desc), '[]'::jsonb)
              from (select * from game.raids where attacker_id = p_pid or defender_id = p_pid order by started_at desc limit 30) r
              join game.profiles a on a.id = r.attacker_id join game.profiles d on d.id = r.defender_id))
$$;

-- ---------------------------------------------------------------------------
-- Public RPCs
-- ---------------------------------------------------------------------------
create or replace function public.stt_join(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  perform game.act_join(uid, p->>'username');
  return game.q_sync(uid, -1, -1);
end $$;

create or replace function public.stt_sync(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.q_sync(uid, coalesce((p->>'since')::bigint, -1), coalesce((p->>'items_rev')::bigint, -1));
end $$;

create or replace function public.stt_catalog(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin perform game._uid(); return game.q_catalog(); end $$;

create or replace function public.stt_world(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_world(game._uid()); end $$;

create or replace function public.stt_base(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_base(game._uid(), game._p_uuid(p, 'player_id')); end $$;

create or replace function public.stt_raid_targets(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_raid_targets(game._uid(), coalesce(p->>'sort', 'recommended')); end $$;

create or replace function public.stt_revenge(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_revenge(game._uid()); end $$;

create or replace function public.stt_leaderboard(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_leaderboard(game._uid(), coalesce(p->>'kind', 'base_value')); end $$;

create or replace function public.stt_profile(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid(); r jsonb;
begin
  r := game.q_profile(uid, case when p ? 'player_id' then game._p_uuid(p, 'player_id') else uid end);
  if r is null then raise exception 'Player not found.'; end if;
  return r;
end $$;

create or replace function public.stt_collection(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  return game.q_collection(case when p ? 'player_id' then game._p_uuid(p, 'player_id') else uid end);
end $$;

create or replace function public.stt_market(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin perform game._uid(); return game.q_market(); end $$;

create or replace function public.stt_market_item(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_market_item(game._uid(), p->>'item_id', coalesce(p->>'range', '24H')); end $$;

create or replace function public.stt_listings(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_listings(game._uid(), p); end $$;

create or replace function public.stt_trades(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_trades(game._uid()); end $$;

create or replace function public.stt_quests(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  return jsonb_build_object('quests', game.act_quests(uid), 'daily', game._daily_status(uid));
end $$;

create or replace function public.stt_activity(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
begin return game.q_activity(game._uid()); end $$;

-- Writes ---------------------------------------------------------------------
create or replace function public.stt_open_drop(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_open_drop(uid, p->>'drop', coalesce((p->>'use_token')::boolean, false));
end $$;

create or replace function public.stt_place(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_place(uid, game._p_uuid(p, 'player_item_id'),
                        case when p->>'slot' is null then null else game._p_bigint(p, 'slot')::int end);
end $$;

create or replace function public.stt_store(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_store(uid, game._p_uuid(p, 'player_item_id')); end $$;

create or replace function public.stt_vault(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_vault(uid, game._p_uuid(p, 'player_item_id')); end $$;

create or replace function public.stt_auto_arrange(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_auto_arrange(uid); end $$;

create or replace function public.stt_quick_sell(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_quick_sell(uid, game._p_uuid(p, 'player_item_id')); end $$;

create or replace function public.stt_upgrade(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_upgrade(uid, p->>'kind'); end $$;

create or replace function public.stt_start_steal(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_start_steal(uid, game._p_uuid(p, 'player_item_id'), coalesce((p->>'revenge')::boolean, false));
end $$;

create or replace function public.stt_finish_steal(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_finish_steal(uid, game._p_uuid(p, 'raid_id')); end $$;

create or replace function public.stt_defend(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_defend(uid, game._p_uuid(p, 'raid_id')); end $$;

create or replace function public.stt_list(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_list(uid, game._p_uuid(p, 'player_item_id'), game._p_bigint(p, 'price')); end $$;

create or replace function public.stt_cancel_listing(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_cancel_listing(uid, game._p_uuid(p, 'listing_id')); end $$;

create or replace function public.stt_buy_listing(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_buy_listing(uid, game._p_uuid(p, 'listing_id')); end $$;

create or replace function public.stt_trade_propose(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_trade_propose(uid, p); end $$;

create or replace function public.stt_trade_respond(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin
  perform game._maybe_tick();
  return game.act_trade_respond(uid, game._p_uuid(p, 'trade_id'), coalesce((p->>'accept')::boolean, false));
end $$;

create or replace function public.stt_trade_cancel(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_trade_cancel(uid, game._p_uuid(p, 'trade_id')); end $$;

create or replace function public.stt_claim_quest(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_claim_quest(uid, p->>'quest_id'); end $$;

create or replace function public.stt_claim_daily(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_claim_daily(uid); end $$;

create or replace function public.stt_buy_cosmetic(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_buy_cosmetic(uid, p->>'cosmetic_id'); end $$;

create or replace function public.stt_equip(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_equip(uid, p->>'cosmetic_id'); end $$;

create or replace function public.stt_set_focus(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_set_focus(uid, upper(coalesce(p->>'focus', 'RANDOM'))); end $$;

create or replace function public.stt_tutorial(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin return game.act_tutorial(uid, game._p_bigint(p, 'step')::int); end $$;

create or replace function public.stt_prestige(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, game, pg_temp as $$
declare uid uuid := game._uid();
begin perform game._maybe_tick(); return game.act_prestige(uid); end $$;

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
