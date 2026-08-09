-- Same Room — schema, row-level security and the geofence.
-- Run in the Supabase SQL editor, or `supabase db push`.
--
-- The shape of this file follows one idea: the browser is not trusted. Every
-- write goes through a `security definer` function that re-derives the fence
-- check from the coordinates it was handed, and every read of a room's contents
-- is gated by an RLS policy that asks "is this person present right now?".
-- A patched client can lie about where it is (no web app can stop that — see
-- README), but it cannot skip the check.
--
-- The constants below mirror RULES in sameroom/core.js. If you change one,
-- change the other; sr_rules() is exposed so the client can verify they match.

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------- constants --

create or replace function sr_rules()
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'maxAccuracyM',       250,
    'minAccuracyBudgetM',  60,
    'edgeSlackM',          15,
    'presenceTtlMs',    75000,
    'graceMs',         150000,
    'doorsOpenBeforeMs',  3600000,
    'doorsCloseAfterMs',  5400000,
    'keepAfterCloseMs',  86400000,
    'maxMessage',         600,
    'minRadiusM',          25,
    'maxRadiusM',        2000
  );
$$;

-- ------------------------------------------------------------------ tables --

create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default 'Someone',
  emoji         text not null default '🦊',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  venue       text not null default '',
  lat         double precision not null,
  lng         double precision not null,
  radius_m    integer not null default 80,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  -- Public rooms show up in "rooms near me". Private ones need the code.
  is_public   boolean not null default false,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint events_radius_ck check (radius_m between 25 and 2000),
  constraint events_window_ck check (ends_at > starts_at),
  constraint events_latlng_ck check (lat between -90 and 90 and lng between -180 and 180)
);
create index if not exists events_public_window_idx on events (is_public, ends_at);
create index if not exists events_bbox_idx on events (lat, lng);

-- One row per person per room. `lat`/`lng` are the last verified fix and are
-- never selectable by anyone else — sr_people() turns them into a coarse band.
create table if not exists check_ins (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  lat            double precision,
  lng            double precision,
  accuracy_m     double precision,
  inside         boolean not null default true,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  left_fence_at  timestamptz,
  unique (event_id, user_id)
);
create index if not exists check_ins_live_idx on check_ins (event_id, last_seen_at desc);

create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  constraint messages_body_ck check (char_length(body) between 1 and 600)
);
create index if not exists messages_event_idx on messages (event_id, created_at desc);

-- A wave is an invitation. Two waves that point at each other make a thread:
-- that is the "connect" step, and it is always mutual.
create table if not exists waves (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  from_user   uuid not null references auth.users(id) on delete cascade,
  to_user     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (event_id, from_user, to_user),
  constraint waves_not_self_ck check (from_user <> to_user)
);
create index if not exists waves_to_idx on waves (event_id, to_user);

create table if not exists threads (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  -- Stored sorted, so a pair can only ever have one thread per room.
  user_a      uuid not null references auth.users(id) on delete cascade,
  user_b      uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (event_id, user_a, user_b),
  constraint threads_sorted_ck check (user_a < user_b)
);

create table if not exists dms (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references threads(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  constraint dms_body_ck check (char_length(body) between 1 and 600)
);
create index if not exists dms_thread_idx on dms (thread_id, created_at);

create table if not exists blocks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  blocked_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, blocked_id)
);

create table if not exists reports (
  id           uuid primary key default gen_random_uuid(),
  reporter     uuid not null references auth.users(id) on delete cascade,
  target_user  uuid references auth.users(id) on delete set null,
  event_id     uuid references events(id) on delete set null,
  reason       text not null default '',
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------- the geofence --

-- Haversine, metres. Mirrors haversineMeters() in core.js.
create or replace function sr_distance_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision language sql immutable parallel safe as $$
  select 2 * 6371008.8 * asin(least(1, sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lng2 - lng1) / 2), 2)
  )));
$$;

-- Mirrors eventPhase() in core.js.
create or replace function sr_phase(starts_at timestamptz, ends_at timestamptz)
returns text language sql stable as $$
  select case
    when now() < starts_at - interval '60 minutes' then 'upcoming'
    when now() < starts_at                         then 'open'
    when now() <= ends_at                          then 'live'
    when now() <= ends_at + interval '90 minutes'  then 'winding_down'
    else 'ended'
  end;
$$;

create or replace function sr_accuracy_budget(radius_m integer)
returns double precision language sql immutable as $$
  select least(250, greatest(60, coalesce(radius_m, 25)))::double precision;
$$;

-- The gate. Mirrors fenceCheck() in core.js and is the only thing that decides
-- whether a person may enter a room. Returns (allowed, reason, distance_m).
create or replace function sr_gate(
  p_event events, p_lat double precision, p_lng double precision, p_accuracy double precision
) returns table (allowed boolean, reason text, distance_m double precision)
language plpgsql stable as $$
declare
  v_phase text := sr_phase(p_event.starts_at, p_event.ends_at);
  v_dist  double precision;
begin
  if v_phase not in ('open', 'live', 'winding_down') then
    return query select false,
      case when v_phase = 'upcoming' then 'not_open_yet' else 'ended' end,
      null::double precision;
    return;
  end if;
  if p_lat is null or p_lng is null then
    return query select false, 'no_fix', null::double precision;
    return;
  end if;
  if p_accuracy is not null and p_accuracy > sr_accuracy_budget(p_event.radius_m) then
    return query select false, 'fix_too_vague', null::double precision;
    return;
  end if;
  v_dist := sr_distance_m(p_lat, p_lng, p_event.lat, p_event.lng);
  if v_dist > p_event.radius_m + 15 then
    return query select false, 'too_far', v_dist;
    return;
  end if;
  return query select true, 'ok', v_dist;
end $$;

-- "Is this person in the room right now?" Used by every read policy.
-- Someone who stepped outside keeps their seat for the grace window.
create or replace function sr_is_present(p_event uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from check_ins c
    where c.event_id = p_event
      and c.user_id  = p_user
      and c.last_seen_at > now() - (case when c.inside then interval '75 seconds'
                                                       else interval '150 seconds' end)
  );
$$;

-- ---------------------------------------------------------------------- RLS --

alter table profiles  enable row level security;
alter table events    enable row level security;
alter table check_ins enable row level security;
alter table messages  enable row level security;
alter table waves     enable row level security;
alter table threads   enable row level security;
alter table dms       enable row level security;
alter table blocks    enable row level security;
alter table reports   enable row level security;

-- Reads only. There is deliberately no INSERT/UPDATE/DELETE policy on any
-- table: writes happen through the sr_* functions below, which run as owner
-- and check the fence first.

drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select to authenticated
  using (
    id = auth.uid()
    -- You can see the name and emoji of people sharing a room with you.
    or exists (
      select 1 from check_ins mine
      join check_ins theirs on theirs.event_id = mine.event_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
        and sr_is_present(mine.event_id, auth.uid())
    )
  );

drop policy if exists events_read on events;
create policy events_read on events for select to authenticated
  using (
    is_public
    or created_by = auth.uid()
    or exists (select 1 from check_ins c where c.event_id = events.id and c.user_id = auth.uid())
  );

-- Your own check-in row, and nobody else's: the raw coordinates in it never
-- leave the database. Other people arrive via sr_people(), already bucketed.
drop policy if exists check_ins_read on check_ins;
create policy check_ins_read on check_ins for select to authenticated
  using (user_id = auth.uid());

-- The whole point of the app: the room is legible only from inside it.
drop policy if exists messages_read on messages;
create policy messages_read on messages for select to authenticated
  using (
    sr_is_present(event_id, auth.uid())
    and not exists (select 1 from blocks b where b.user_id = auth.uid() and b.blocked_id = messages.user_id)
  );

drop policy if exists waves_read on waves;
create policy waves_read on waves for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

drop policy if exists threads_read on threads;
create policy threads_read on threads for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

-- A thread outlives the room: people who connected at an event keep talking
-- after they go home. That is the one conversation distance does not close.
drop policy if exists dms_read on dms;
create policy dms_read on dms for select to authenticated
  using (exists (
    select 1 from threads t
    where t.id = dms.thread_id and auth.uid() in (t.user_a, t.user_b)
  ));

drop policy if exists blocks_read on blocks;
create policy blocks_read on blocks for select to authenticated using (user_id = auth.uid());

drop policy if exists reports_read on reports;
create policy reports_read on reports for select to authenticated using (reporter = auth.uid());

-- ------------------------------------------------------------------- writes --

create or replace function sr_upsert_profile(p_name text, p_emoji text)
returns profiles language plpgsql security definer set search_path = public as $$
declare v_row profiles;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  insert into profiles (id, display_name, emoji)
  values (auth.uid(), left(coalesce(nullif(trim(p_name), ''), 'Someone'), 24),
          left(coalesce(nullif(p_emoji, ''), '🦊'), 8))
  on conflict (id) do update
    set display_name = excluded.display_name,
        emoji        = excluded.emoji,
        updated_at   = now()
  returning * into v_row;
  return v_row;
end $$;

-- Six characters from an alphabet with no I, L or O. Mirrors makeJoinCode().
create or replace function sr_new_code() returns text
language plpgsql volatile as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ0123456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from events e where e.code = candidate);
  end loop;
  return candidate;
end $$;

create or replace function sr_create_event(
  p_name text, p_venue text, p_lat double precision, p_lng double precision,
  p_radius_m integer, p_starts_at timestamptz, p_ends_at timestamptz, p_is_public boolean
) returns events language plpgsql security definer set search_path = public as $$
declare v_row events;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if p_ends_at <= p_starts_at then raise exception 'the end has to come after the start'; end if;
  if p_ends_at - p_starts_at > interval '7 days' then raise exception 'rooms run for a week at most'; end if;
  -- One person cannot flood the place with rooms.
  if (select count(*) from events e
      where e.created_by = auth.uid() and e.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'too many rooms created just now — try again shortly';
  end if;

  insert into events (code, name, venue, lat, lng, radius_m, starts_at, ends_at, is_public, created_by)
  values (sr_new_code(), left(trim(p_name), 60), left(trim(coalesce(p_venue, '')), 80),
          p_lat, p_lng, least(2000, greatest(25, coalesce(p_radius_m, 80))),
          p_starts_at, p_ends_at, coalesce(p_is_public, false), auth.uid())
  returning * into v_row;
  return v_row;
end $$;

-- What a locked-out visitor is allowed to know: that the room exists, how busy
-- it is, and how far they are from it. No names, no messages.
create or replace function sr_peek(p_code text, p_lat double precision, p_lng double precision)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_event events; v_live int; v_pulse int;
begin
  select * into v_event from events where code = upper(trim(p_code));
  if not found then return jsonb_build_object('found', false); end if;

  select count(*) into v_live from check_ins c
   where c.event_id = v_event.id and c.last_seen_at > now() - interval '75 seconds';
  select count(*) into v_pulse from messages m
   where m.event_id = v_event.id and m.created_at > now() - interval '5 minutes';

  return jsonb_build_object(
    'found', true,
    'event', jsonb_build_object(
      'id', v_event.id, 'code', v_event.code, 'name', v_event.name, 'venue', v_event.venue,
      'lat', v_event.lat, 'lng', v_event.lng, 'radiusM', v_event.radius_m,
      'startsAt', v_event.starts_at, 'endsAt', v_event.ends_at, 'isPublic', v_event.is_public),
    'liveCount', v_live,
    'pulse', v_pulse,
    'phase', sr_phase(v_event.starts_at, v_event.ends_at),
    'distanceM', case when p_lat is null then null
                      else sr_distance_m(p_lat, p_lng, v_event.lat, v_event.lng) end
  );
end $$;

-- Public rooms within p_km, nearest first. Coordinates of a public venue are
-- public by definition; a person's are not, and never appear here.
create or replace function sr_nearby(p_lat double precision, p_lng double precision, p_km double precision)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_out jsonb;
begin
  select coalesce(jsonb_agg(x order by x->>'distanceM'), '[]'::jsonb) into v_out from (
    select jsonb_build_object(
      'id', e.id, 'code', e.code, 'name', e.name, 'venue', e.venue,
      'lat', e.lat, 'lng', e.lng, 'radiusM', e.radius_m,
      'startsAt', e.starts_at, 'endsAt', e.ends_at, 'isPublic', e.is_public,
      'distanceM', sr_distance_m(p_lat, p_lng, e.lat, e.lng),
      'liveCount', (select count(*) from check_ins c
                    where c.event_id = e.id and c.last_seen_at > now() - interval '75 seconds')
    ) as x
    from events e
    where e.is_public
      and e.ends_at > now() - interval '90 minutes'
      and e.starts_at < now() + interval '24 hours'
      and sr_distance_m(p_lat, p_lng, e.lat, e.lng) <= coalesce(p_km, 25) * 1000
    limit 50
  ) s;
  return v_out;
end $$;

-- Enter a room. The coordinates are checked here, in the database, against the
-- room's own fence and window. Everything downstream trusts this row.
create or replace function sr_check_in(
  p_code text, p_lat double precision, p_lng double precision, p_accuracy double precision
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_event events; v_gate record;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select * into v_event from events where code = upper(trim(p_code));
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_such_room'); end if;

  select * into v_gate from sr_gate(v_event, p_lat, p_lng, p_accuracy);
  if not v_gate.allowed then
    return jsonb_build_object('ok', false, 'reason', v_gate.reason,
                              'distanceM', v_gate.distance_m, 'eventId', v_event.id);
  end if;

  insert into check_ins (event_id, user_id, lat, lng, accuracy_m, inside)
  values (v_event.id, auth.uid(), p_lat, p_lng, p_accuracy, true)
  on conflict (event_id, user_id) do update
    set lat = excluded.lat, lng = excluded.lng, accuracy_m = excluded.accuracy_m,
        inside = true, left_fence_at = null, last_seen_at = now();

  return jsonb_build_object('ok', true, 'reason', 'ok', 'eventId', v_event.id,
                            'distanceM', v_gate.distance_m);
end $$;

-- Called every ~20s while the room is open. This is what makes presence real:
-- stop sending it, or walk out, and the room closes behind you.
create or replace function sr_heartbeat(
  p_event uuid, p_lat double precision, p_lng double precision, p_accuracy double precision
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_event events; v_gate record; v_row check_ins;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select * into v_event from events where id = p_event;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_such_room'); end if;
  select * into v_row from check_ins where event_id = p_event and user_id = auth.uid();
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_checked_in'); end if;

  select * into v_gate from sr_gate(v_event, p_lat, p_lng, p_accuracy);

  update check_ins
     set lat = coalesce(p_lat, lat),
         lng = coalesce(p_lng, lng),
         accuracy_m = coalesce(p_accuracy, accuracy_m),
         inside = v_gate.allowed,
         left_fence_at = case when v_gate.allowed then null
                              else coalesce(left_fence_at, now()) end,
         -- Stepping outside freezes last_seen_at at the moment you left, so the
         -- grace window is measured from the door, not from the last ping.
         last_seen_at = case when v_gate.allowed then now() else last_seen_at end
   where event_id = p_event and user_id = auth.uid();

  return jsonb_build_object('ok', v_gate.allowed, 'reason', v_gate.reason,
                            'distanceM', v_gate.distance_m);
end $$;

create or replace function sr_leave(p_event uuid)
returns void language sql security definer set search_path = public as $$
  delete from check_ins where event_id = p_event and user_id = auth.uid();
$$;

-- Who else is here. Raw coordinates are turned into a band inside this
-- function; they are never selectable and never cross the wire.
create or replace function sr_people(p_event uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me check_ins; v_event events; v_out jsonb;
begin
  if not sr_is_present(p_event, auth.uid()) then
    return jsonb_build_object('ok', false, 'reason', 'not_present');
  end if;
  select * into v_event from events where id = p_event;
  select * into v_me from check_ins where event_id = p_event and user_id = auth.uid();

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_out from (
    select jsonb_build_object(
      'id', c.user_id,
      'name', coalesce(p.display_name, 'Someone'),
      'emoji', coalesce(p.emoji, '🦊'),
      'inside', c.inside,
      'seenAgoS', extract(epoch from (now() - c.last_seen_at))::int,
      'band', case
        when c.lat is null or v_me.lat is null then null
        when sr_distance_m(v_me.lat, v_me.lng, c.lat, c.lng) < 10 then 'here'
        when sr_distance_m(v_me.lat, v_me.lng, c.lat, c.lng) < 30 then 'steps'
        when sr_distance_m(v_me.lat, v_me.lng, c.lat, c.lng)
             < greatest(60, v_event.radius_m * 0.6) then 'across'
        else 'edge' end,
      'iWaved',   exists (select 1 from waves w where w.event_id = p_event
                           and w.from_user = auth.uid() and w.to_user = c.user_id),
      'wavedMe',  exists (select 1 from waves w where w.event_id = p_event
                           and w.from_user = c.user_id and w.to_user = auth.uid()),
      'threadId', (select t.id from threads t where t.event_id = p_event
                    and t.user_a = least(auth.uid(), c.user_id)
                    and t.user_b = greatest(auth.uid(), c.user_id))
    ) as x
    from check_ins c
    left join profiles p on p.id = c.user_id
    where c.event_id = p_event
      and c.user_id <> auth.uid()
      and c.last_seen_at > now() - (case when c.inside then interval '75 seconds'
                                                       else interval '150 seconds' end)
      and not exists (select 1 from blocks b
                       where b.user_id = auth.uid() and b.blocked_id = c.user_id)
      and not exists (select 1 from blocks b
                       where b.user_id = c.user_id and b.blocked_id = auth.uid())
    order by c.last_seen_at desc
    limit 200
  ) s;

  return jsonb_build_object('ok', true, 'people', v_out);
end $$;

create or replace function sr_post(p_event uuid, p_body text)
returns messages language plpgsql security definer set search_path = public as $$
declare v_row messages; v_body text := left(btrim(p_body), 600);
begin
  if not sr_is_present(p_event, auth.uid()) then
    raise exception 'you have to be in the room to say something';
  end if;
  if v_body = '' then raise exception 'empty message'; end if;
  if (select count(*) from messages m
      where m.user_id = auth.uid() and m.created_at > now() - interval '10 seconds') >= 8 then
    raise exception 'slow down';
  end if;
  insert into messages (event_id, user_id, body) values (p_event, auth.uid(), v_body)
  returning * into v_row;
  return v_row;
end $$;

-- Wave at someone. If they already waved at you, the thread opens for both.
create or replace function sr_wave(p_event uuid, p_to uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_thread threads; v_mutual boolean;
begin
  if not sr_is_present(p_event, auth.uid()) then
    raise exception 'you have to be in the room to wave';
  end if;
  if p_to = auth.uid() then raise exception 'waving at yourself is not a connection'; end if;
  if not sr_is_present(p_event, p_to) then
    return jsonb_build_object('ok', false, 'reason', 'they_left');
  end if;
  if exists (select 1 from blocks b
             where (b.user_id = p_to and b.blocked_id = auth.uid())
                or (b.user_id = auth.uid() and b.blocked_id = p_to)) then
    return jsonb_build_object('ok', false, 'reason', 'blocked');
  end if;

  insert into waves (event_id, from_user, to_user) values (p_event, auth.uid(), p_to)
  on conflict do nothing;

  select exists (select 1 from waves w where w.event_id = p_event
                  and w.from_user = p_to and w.to_user = auth.uid()) into v_mutual;
  if not v_mutual then
    return jsonb_build_object('ok', true, 'mutual', false);
  end if;

  insert into threads (event_id, user_a, user_b)
  values (p_event, least(auth.uid(), p_to), greatest(auth.uid(), p_to))
  on conflict (event_id, user_a, user_b) do update set event_id = excluded.event_id
  returning * into v_thread;

  return jsonb_build_object('ok', true, 'mutual', true, 'threadId', v_thread.id);
end $$;

create or replace function sr_unwave(p_event uuid, p_to uuid)
returns void language sql security definer set search_path = public as $$
  delete from waves where event_id = p_event and from_user = auth.uid() and to_user = p_to;
$$;

-- Threads survive the event. Once you have connected, distance stops mattering
-- — which is the only place in this app where that is true.
create or replace function sr_send_dm(p_thread uuid, p_body text)
returns dms language plpgsql security definer set search_path = public as $$
declare v_row dms; v_thread threads; v_other uuid; v_body text := left(btrim(p_body), 600);
begin
  select * into v_thread from threads where id = p_thread;
  if not found or auth.uid() not in (v_thread.user_a, v_thread.user_b) then
    raise exception 'not your thread';
  end if;
  if v_body = '' then raise exception 'empty message'; end if;
  v_other := case when v_thread.user_a = auth.uid() then v_thread.user_b else v_thread.user_a end;
  if exists (select 1 from blocks b
             where (b.user_id = v_other and b.blocked_id = auth.uid())
                or (b.user_id = auth.uid() and b.blocked_id = v_other)) then
    raise exception 'this thread is closed';
  end if;
  insert into dms (thread_id, user_id, body) values (p_thread, auth.uid(), v_body)
  returning * into v_row;
  return v_row;
end $$;

-- Everyone you have connected with, across every room, with the last line.
create or replace function sr_threads()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_out jsonb;
begin
  select coalesce(jsonb_agg(x order by x->>'lastAt' desc), '[]'::jsonb) into v_out from (
    select jsonb_build_object(
      'id', t.id,
      'eventId', t.event_id,
      'eventName', e.name,
      'withId', other.id,
      'withName', coalesce(other.display_name, 'Someone'),
      'withEmoji', coalesce(other.emoji, '🦊'),
      'lastBody', (select d.body from dms d where d.thread_id = t.id order by d.created_at desc limit 1),
      'lastAt', coalesce((select d.created_at from dms d where d.thread_id = t.id
                          order by d.created_at desc limit 1), t.created_at)
    ) as x
    from threads t
    join events e on e.id = t.event_id
    join profiles other
      on other.id = case when t.user_a = auth.uid() then t.user_b else t.user_a end
    where auth.uid() in (t.user_a, t.user_b)
    limit 200
  ) s;
  return v_out;
end $$;

create or replace function sr_block(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user = auth.uid() then return; end if;
  insert into blocks (user_id, blocked_id) values (auth.uid(), p_user) on conflict do nothing;
  delete from waves where (from_user = auth.uid() and to_user = p_user)
                       or (from_user = p_user and to_user = auth.uid());
end $$;

create or replace function sr_report(p_user uuid, p_event uuid, p_reason text)
returns void language sql security definer set search_path = public as $$
  insert into reports (reporter, target_user, event_id, reason)
  values (auth.uid(), p_user, p_event, left(coalesce(p_reason, ''), 500));
$$;

-- Rooms are temporary and so is what is said in them. Schedule with pg_cron:
--   select cron.schedule('sameroom-purge', '17 * * * *', $q$select sr_purge()$q$);
create or replace function sr_purge() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_msgs int; v_events int;
begin
  delete from messages m using events e
   where m.event_id = e.id and e.ends_at < now() - interval '24 hours';
  get diagnostics v_msgs = row_count;
  delete from check_ins c using events e
   where c.event_id = e.id and e.ends_at < now() - interval '24 hours';
  -- Threads and DMs are deliberately kept: the connection outlives the room.
  delete from events e where e.ends_at < now() - interval '30 days'
    and not exists (select 1 from threads t where t.event_id = e.id);
  get diagnostics v_events = row_count;
  return jsonb_build_object('messages', v_msgs, 'events', v_events);
end $$;

-- ------------------------------------------------------------------- grants --

revoke all on all tables in schema public from anon, authenticated;
grant select on profiles, events, check_ins, messages, waves, threads, dms, blocks, reports
  to authenticated;

grant execute on function
  sr_rules(), sr_upsert_profile(text, text),
  sr_create_event(text, text, double precision, double precision, integer, timestamptz, timestamptz, boolean),
  sr_peek(text, double precision, double precision),
  sr_nearby(double precision, double precision, double precision),
  sr_check_in(text, double precision, double precision, double precision),
  sr_heartbeat(uuid, double precision, double precision, double precision),
  sr_leave(uuid), sr_people(uuid), sr_post(uuid, text),
  sr_wave(uuid, uuid), sr_unwave(uuid, uuid), sr_send_dm(uuid, text), sr_threads(),
  sr_block(uuid), sr_report(uuid, uuid, text)
to authenticated;

-- ----------------------------------------------------------------- realtime --

-- Realtime honours RLS, so a subscriber only receives rows they could have
-- selected — which for messages means only while they are in the room.
do $$ begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table check_ins;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table dms;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table waves;
exception when duplicate_object then null; end $$;
