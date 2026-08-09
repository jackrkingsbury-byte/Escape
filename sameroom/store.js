/* Same Room — backends.

   One interface, two implementations:

     LocalBackend     everything in localStorage, live across tabs via
                      BroadcastChannel. No account, no server, works offline.
                      Seeds a demo room at wherever you are so the app has
                      something to show on the first run. Clearly labelled.

     SupabaseBackend  real rooms, real strangers, real time. Every write goes
                      through the sr_* functions in supabase/0001_init.sql,
                      which re-check the fence in the database.

   The app (app.js) never knows which one it is talking to. Both return the same
   shapes and both refuse to hand over a room's contents to someone who is not
   in it — the local one because core.fenceCheck() says so, the hosted one
   because Postgres says so. */
(function (root) {
'use strict';

const C = root.SameRoomCore;
const nowMs = () => Date.now();

/* ---------------------------------------------------------------- storage -- */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

const KEYS = {
  me: 'sameroom.me.v1',
  data: 'sameroom.data.v1',
  config: 'sameroom.config.v1',
};

function loadConfig() {
  return readJSON(KEYS.config, { url: '', anonKey: '' });
}
function saveConfig(cfg) {
  writeJSON(KEYS.config, { url: (cfg.url || '').trim(), anonKey: (cfg.anonKey || '').trim() });
}

/* ------------------------------------------------------------ local backend -- */

const EMPTY = {
  events: [], checkIns: [], messages: [], waves: [], threads: [], dms: [], blocks: [],
  seeded: false,
};

/* Lines the demo strangers have already said, so a first-run room isn't an
   empty box. They do not talk back on their own — see wave() for the one
   scripted moment, which exists to show what connecting looks like. */
const DEMO_PEOPLE = [
  { id: 'demo-nia', name: 'Nia', emoji: '🦋', north: 12, east: -8 },
  { id: 'demo-thabo', name: 'Thabo', emoji: '🐢', north: -20, east: 25 },
  { id: 'demo-rae', name: 'Rae', emoji: '🦉', north: 45, east: 40 },
];
const DEMO_LINES = [
  { by: 'demo-nia', body: 'anyone else here for the second set?', agoMin: 14 },
  { by: 'demo-thabo', body: 'queue at the door is gone now, walk straight in', agoMin: 11 },
  { by: 'demo-rae', body: 'the food truck round the back is the good one 🌮', agoMin: 6 },
  { by: 'demo-nia', body: 'saving a spot near the sound desk if anyone wants it', agoMin: 2 },
];

function LocalBackend() {
  const self = {};
  let data = readJSON(KEYS.data, null) || JSON.parse(JSON.stringify(EMPTY));
  let channel = null;
  const listeners = new Set();

  function persist() {
    writeJSON(KEYS.data, data);
    if (channel) { try { channel.postMessage({ t: 'changed' }); } catch (err) { /* closed */ } }
    emit();
  }
  function emit() { listeners.forEach((fn) => { try { fn(); } catch (err) { /* keep going */ } }); }

  function identity() {
    let me = readJSON(KEYS.me, null);
    if (!me || !me.id) {
      me = { id: C.randomId(), name: '', emoji: C.avatarFor(C.randomId()).emoji };
      writeJSON(KEYS.me, me);
    }
    return me;
  }

  /* The demo rooms are pinned to wherever you actually are the first time the
     app gets a fix: one you are standing inside, one across town that you are
     not. That pair is the whole idea of the app in a single screen. */
  function seedIfNeeded(fix) {
    if (data.seeded || !C.isPoint(fix)) return false;
    const t = nowMs();
    const here = {
      id: 'demo-here',
      code: 'DEMO01',
      name: 'Rooftop session',
      venue: 'Wherever you are right now',
      lat: fix.lat, lng: fix.lng, radiusM: 120,
      startsAt: new Date(t - 45 * 60000).toISOString(),
      endsAt: new Date(t + 5 * 3600000).toISOString(),
      isPublic: true, createdBy: 'demo', demo: true,
      createdAt: new Date(t).toISOString(),
    };
    const away = C.offsetPoint(fix, 1900, 1500);
    const across = {
      id: 'demo-away',
      code: 'DEMO02',
      name: 'Warehouse party',
      venue: 'Across town',
      lat: away.lat, lng: away.lng, radiusM: 150,
      startsAt: new Date(t - 20 * 60000).toISOString(),
      endsAt: new Date(t + 6 * 3600000).toISOString(),
      isPublic: true, createdBy: 'demo', demo: true,
      createdAt: new Date(t).toISOString(),
    };
    data.events.push(here, across);

    DEMO_PEOPLE.forEach((p) => {
      const spot = C.offsetPoint(fix, p.north, p.east);
      data.checkIns.push({
        eventId: here.id, userId: p.id, name: p.name, emoji: p.emoji, demo: true,
        lat: spot.lat, lng: spot.lng, accuracyM: 12, inside: true,
        firstSeenAt: new Date(t - 40 * 60000).toISOString(),
        lastSeenAt: new Date(t).toISOString(),
      });
    });
    DEMO_LINES.forEach((line, i) => {
      const who = DEMO_PEOPLE.find((p) => p.id === line.by);
      data.messages.push({
        id: `demo-msg-${i}`, eventId: here.id, userId: line.by,
        name: who.name, emoji: who.emoji, demo: true,
        body: line.body,
        createdAt: new Date(t - line.agoMin * 60000).toISOString(),
      });
    });
    /* The across-town room is busy too — that is what you're missing out on. */
    for (let i = 0; i < 3; i++) {
      data.checkIns.push({
        eventId: across.id, userId: `demo-far-${i}`, name: 'Someone', emoji: '🎧', demo: true,
        lat: away.lat, lng: away.lng, accuracyM: 20, inside: true,
        firstSeenAt: new Date(t).toISOString(), lastSeenAt: new Date(t).toISOString(),
      });
    }
    for (let i = 0; i < 9; i++) {
      data.messages.push({
        id: `demo-far-msg-${i}`, eventId: across.id, userId: `demo-far-${i % 3}`,
        name: 'Someone', emoji: '🎧', demo: true, body: '…',
        createdAt: new Date(t - i * 40000).toISOString(),
      });
    }
    data.seeded = true;
    persist();
    return true;
  }

  /* Demo people never go stale, or the demo room empties out while you read it. */
  function freshenDemo() {
    const t = new Date().toISOString();
    let touched = false;
    data.checkIns.forEach((c) => {
      if (c.demo) { c.lastSeenAt = t; touched = true; }
    });
    if (touched) writeJSON(KEYS.data, data);
  }

  const eventById = (id) => data.events.find((e) => e.id === id) || null;
  const myCheckIn = (eventId) =>
    data.checkIns.find((c) => c.eventId === eventId && c.userId === identity().id) || null;

  function liveCheckIns(eventId) {
    return data.checkIns.filter((c) =>
      c.eventId === eventId && C.presenceIsLive(c, nowMs()));
  }

  function guard(eventId) {
    const row = myCheckIn(eventId);
    if (!C.presenceIsLive(row, nowMs())) {
      const err = new Error('You have to be in the room for that.');
      err.reason = 'not_present';
      throw err;
    }
    return row;
  }

  /* ---- interface ---- */

  self.mode = 'local';
  self.label = 'On this device';
  self.isLocal = true;

  self.init = async function () {
    if (typeof BroadcastChannel === 'function') {
      channel = new BroadcastChannel('sameroom.v1');
      channel.onmessage = () => {
        data = readJSON(KEYS.data, null) || data;
        emit();
      };
    }
    /* Another tab may have written while we were away. */
    root.addEventListener('storage', (e) => {
      if (e.key === KEYS.data) {
        data = readJSON(KEYS.data, null) || data;
        emit();
      }
    });
    return self;
  };

  self.me = async function () {
    const me = identity();
    return { id: me.id, name: me.name, emoji: me.emoji };
  };

  self.setProfile = async function (profile) {
    const me = identity();
    me.name = C.sanitizeName(profile.name) || me.name;
    if (profile.emoji) me.emoji = profile.emoji;
    writeJSON(KEYS.me, me);
    /* Anything already said keeps the name it was said under, except your own. */
    data.messages.forEach((m) => {
      if (m.userId === me.id) { m.name = me.name; m.emoji = me.emoji; }
    });
    data.checkIns.forEach((c) => {
      if (c.userId === me.id) { c.name = me.name; c.emoji = me.emoji; }
    });
    persist();
    return { id: me.id, name: me.name, emoji: me.emoji };
  };

  self.nearby = async function (fix) {
    seedIfNeeded(fix);
    freshenDemo();
    return data.events
      .filter((e) => e.isPublic || e.createdBy === identity().id || myCheckIn(e.id))
      .map((e) => ({ ...e, liveCount: liveCheckIns(e.id).length }));
  };

  self.findByCode = async function (code) {
    const wanted = C.normalizeCode(code);
    return data.events.find((e) => C.normalizeCode(e.code) === wanted) || null;
  };

  self.peek = async function (eventRef, fix) {
    freshenDemo();
    const eventId = eventRef && eventRef.id ? eventRef.id : eventRef;
    const event = eventById(eventId);
    if (!event) return null;
    const msgs = data.messages.filter((m) => m.eventId === eventId);
    return {
      event,
      liveCount: liveCheckIns(eventId).length,
      pulse: C.pulse(msgs, nowMs()).count,
      distanceM: C.isPoint(fix) ? C.haversineMeters(fix, event) : null,
    };
  };

  self.createEvent = async function (draft) {
    const check = C.validateEventDraft(draft);
    if (!check.ok) throw new Error(check.errors.join(' '));
    const event = {
      ...check.value,
      id: C.randomId(),
      code: C.makeJoinCode(),
      createdBy: identity().id,
      createdAt: new Date().toISOString(),
    };
    data.events.push(event);
    persist();
    return event;
  };

  self.checkIn = async function (eventRef, fix) {
    const eventId = eventRef && eventRef.id ? eventRef.id : eventRef;
    const event = eventById(eventId);
    if (!event) return { ok: false, reason: 'no_such_room' };
    const gate = C.fenceCheck(event, fix, nowMs());
    if (!gate.allowed) return { ok: false, reason: gate.reason, distanceM: gate.distanceM };

    const me = identity();
    const existing = myCheckIn(eventId);
    const row = existing || {
      eventId, userId: me.id, firstSeenAt: new Date().toISOString(),
    };
    Object.assign(row, {
      name: me.name, emoji: me.emoji,
      lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracyM,
      inside: true, leftFenceAt: null,
      lastSeenAt: new Date().toISOString(),
    });
    if (!existing) data.checkIns.push(row);
    persist();
    return { ok: true, reason: 'ok', eventId, distanceM: gate.distanceM };
  };

  self.heartbeat = async function (eventId, fix) {
    const event = eventById(eventId);
    const row = myCheckIn(eventId);
    if (!event) return { ok: false, reason: 'no_such_room' };
    if (!row) return { ok: false, reason: 'not_checked_in' };
    const gate = C.fenceCheck(event, fix, nowMs());
    if (gate.allowed) {
      Object.assign(row, {
        lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracyM,
        inside: true, leftFenceAt: null, lastSeenAt: new Date().toISOString(),
      });
    } else if (row.inside) {
      /* First ping from outside starts the grace clock; last_seen stays put so
         the countdown runs from the door, not from the last ping. */
      row.inside = false;
      row.leftFenceAt = new Date().toISOString();
    }
    persist();
    return { ok: gate.allowed, reason: gate.reason, distanceM: gate.distanceM };
  };

  self.leave = async function (eventId) {
    data.checkIns = data.checkIns.filter(
      (c) => !(c.eventId === eventId && c.userId === identity().id));
    persist();
  };

  self.people = async function (eventId) {
    guard(eventId);
    freshenDemo();
    const me = identity();
    const mine = myCheckIn(eventId);
    const event = eventById(eventId);
    return liveCheckIns(eventId)
      .filter((c) => c.userId !== me.id)
      .filter((c) => !data.blocks.some((b) => b.blockedId === c.userId))
      .map((c) => {
        const band = (C.isPoint(mine) && C.isPoint(c))
          ? C.distanceBand(C.haversineMeters(mine, c), event.radiusM) : null;
        const thread = data.threads.find(
          (t) => t.key === C.threadKey(eventId, me.id, c.userId));
        return {
          id: c.userId,
          name: c.name || 'Someone',
          emoji: c.emoji || C.avatarFor(c.userId).emoji,
          demo: !!c.demo,
          inside: c.inside !== false,
          band,
          iWaved: data.waves.some(
            (w) => w.eventId === eventId && w.from === me.id && w.to === c.userId),
          wavedMe: data.waves.some(
            (w) => w.eventId === eventId && w.from === c.userId && w.to === me.id),
          threadId: thread ? thread.id : null,
        };
      });
  };

  self.messages = async function (eventId) {
    guard(eventId);
    const me = identity();
    return data.messages
      .filter((m) => m.eventId === eventId)
      .filter((m) => !data.blocks.some((b) => b.blockedId === m.userId))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((m) => ({ ...m, mine: m.userId === me.id }));
  };

  self.post = async function (eventId, body) {
    guard(eventId);
    const clean = C.sanitizeMessage(body);
    if (!clean) return null;
    const me = identity();
    const msg = {
      id: C.randomId(), eventId, userId: me.id,
      name: me.name || 'You', emoji: me.emoji,
      body: clean, createdAt: new Date().toISOString(),
    };
    data.messages.push(msg);
    persist();
    return msg;
  };

  self.wave = async function (eventId, userId) {
    guard(eventId);
    const me = identity();
    if (userId === me.id) return { ok: false, reason: 'self' };
    if (!data.waves.some((w) => w.eventId === eventId && w.from === me.id && w.to === userId)) {
      data.waves.push({ eventId, from: me.id, to: userId, at: new Date().toISOString() });
    }
    /* A demo stranger waves back, once, so the connection flow is visible on a
       single device. Real people do this at their own pace. */
    const target = data.checkIns.find((c) => c.eventId === eventId && c.userId === userId);
    if (target && target.demo &&
        !data.waves.some((w) => w.eventId === eventId && w.from === userId && w.to === me.id)) {
      data.waves.push({ eventId, from: userId, to: me.id, at: new Date().toISOString() });
    }
    const mutual = data.waves.some(
      (w) => w.eventId === eventId && w.from === userId && w.to === me.id);
    if (!mutual) { persist(); return { ok: true, mutual: false }; }

    const key = C.threadKey(eventId, me.id, userId);
    let thread = data.threads.find((t) => t.key === key);
    if (!thread) {
      thread = {
        id: C.randomId(), key, eventId,
        members: [me.id, userId].sort(),
        createdAt: new Date().toISOString(),
      };
      data.threads.push(thread);
      if (target && target.demo) {
        data.dms.push({
          id: C.randomId(), threadId: thread.id, userId,
          body: 'hey! whereabouts are you standing?',
          createdAt: new Date().toISOString(), demo: true,
        });
      }
    }
    persist();
    return { ok: true, mutual: true, threadId: thread.id };
  };

  self.unwave = async function (eventId, userId) {
    const me = identity();
    data.waves = data.waves.filter(
      (w) => !(w.eventId === eventId && w.from === me.id && w.to === userId));
    persist();
  };

  self.threads = async function () {
    const me = identity();
    return data.threads
      .filter((t) => t.members.indexOf(me.id) !== -1)
      .map((t) => {
        const otherId = t.members.find((m) => m !== me.id);
        const other = data.checkIns.find((c) => c.userId === otherId) || {};
        const lines = data.dms.filter((d) => d.threadId === t.id)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const last = lines[lines.length - 1];
        const event = eventById(t.eventId);
        return {
          id: t.id,
          eventId: t.eventId,
          eventName: event ? event.name : 'A room',
          withId: otherId,
          withName: other.name || 'Someone',
          withEmoji: other.emoji || C.avatarFor(otherId).emoji,
          lastBody: last ? last.body : null,
          lastAt: last ? last.createdAt : t.createdAt,
        };
      })
      .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  };

  self.dms = async function (threadId) {
    const me = identity();
    const thread = data.threads.find((t) => t.id === threadId);
    if (!thread || thread.members.indexOf(me.id) === -1) throw new Error('Not your thread.');
    return data.dms
      .filter((d) => d.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((d) => ({ ...d, mine: d.userId === me.id }));
  };

  self.sendDm = async function (threadId, body) {
    const me = identity();
    const thread = data.threads.find((t) => t.id === threadId);
    if (!thread || thread.members.indexOf(me.id) === -1) throw new Error('Not your thread.');
    const clean = C.sanitizeMessage(body);
    if (!clean) return null;
    const dm = {
      id: C.randomId(), threadId, userId: me.id,
      body: clean, createdAt: new Date().toISOString(),
    };
    data.dms.push(dm);
    persist();
    return dm;
  };

  self.block = async function (userId) {
    const me = identity();
    if (!data.blocks.some((b) => b.blockedId === userId)) {
      data.blocks.push({ userId: me.id, blockedId: userId });
    }
    data.waves = data.waves.filter((w) => w.from !== userId && w.to !== userId);
    persist();
  };

  self.report = async function () { /* Nothing to send to on a local device. */ };

  self.subscribe = function (handler) {
    listeners.add(handler);
    return () => listeners.delete(handler);
  };

  self.reset = async function () {
    data = JSON.parse(JSON.stringify(EMPTY));
    localStorage.removeItem(KEYS.data);
    persist();
  };

  return self;
}

/* --------------------------------------------------------- supabase backend -- */

function SupabaseBackend(config) {
  const self = {};
  let client = null;
  let uid = null;
  let profile = null;
  const listeners = new Set();
  let channel = null;
  let channelEventId = null;

  const emit = () => listeners.forEach((fn) => { try { fn(); } catch (err) { /* keep going */ } });

  async function rpc(name, args) {
    const { data, error } = await client.rpc(name, args || {});
    if (error) throw new Error(error.message);
    return data;
  }

  self.mode = 'supabase';
  self.label = 'Live rooms';
  self.isLocal = false;

  self.init = async function () {
    /* Loaded only when Supabase is configured, so the page stays dependency
       free for anyone who never turns this on. */
    const mod = await import('https://esm.sh/@supabase/supabase-js@2');
    client = mod.createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    const { data: sessionData } = await client.auth.getSession();
    let session = sessionData && sessionData.session;
    if (!session) {
      const { data, error } = await client.auth.signInAnonymously();
      if (error) {
        throw new Error(
          `${error.message} — check that anonymous sign-ins are enabled for this project.`);
      }
      session = data.session;
    }
    uid = session.user.id;
    const rows = await client.from('profiles').select('*').eq('id', uid).maybeSingle();
    profile = rows.data;
    return self;
  };

  self.me = async function () {
    return {
      id: uid,
      name: profile ? profile.display_name : '',
      emoji: profile ? profile.emoji : C.avatarFor(uid || '').emoji,
    };
  };

  self.setProfile = async function (p) {
    const row = await rpc('sr_upsert_profile', {
      p_name: C.sanitizeName(p.name), p_emoji: p.emoji || '🦊',
    });
    profile = row;
    return { id: uid, name: row.display_name, emoji: row.emoji };
  };

  self.nearby = async function (fix) {
    if (!C.isPoint(fix)) return [];
    const rows = await rpc('sr_nearby', { p_lat: fix.lat, p_lng: fix.lng, p_km: 25 });
    return (rows || []).map((e) => ({ ...e, radiusM: e.radiusM }));
  };

  self.findByCode = async function (code) {
    const res = await rpc('sr_peek', { p_code: C.normalizeCode(code), p_lat: null, p_lng: null });
    return res && res.found ? res.event : null;
  };

  self.peek = async function (eventRef, fix) {
    /* sr_peek takes a code: it is the only handle a stranger is given. */
    const code = (eventRef && eventRef.code) || eventRef;
    const res = await rpc('sr_peek', {
      p_code: C.normalizeCode(code),
      p_lat: C.isPoint(fix) ? fix.lat : null,
      p_lng: C.isPoint(fix) ? fix.lng : null,
    });
    if (!res || !res.found) return null;
    return {
      event: res.event,
      liveCount: res.liveCount,
      pulse: res.pulse,
      distanceM: res.distanceM,
    };
  };

  self.createEvent = async function (draft) {
    const check = C.validateEventDraft(draft);
    if (!check.ok) throw new Error(check.errors.join(' '));
    const v = check.value;
    const row = await rpc('sr_create_event', {
      p_name: v.name, p_venue: v.venue, p_lat: v.lat, p_lng: v.lng,
      p_radius_m: v.radiusM, p_starts_at: v.startsAt, p_ends_at: v.endsAt,
      p_is_public: v.isPublic,
    });
    return {
      id: row.id, code: row.code, name: row.name, venue: row.venue,
      lat: row.lat, lng: row.lng, radiusM: row.radius_m,
      startsAt: row.starts_at, endsAt: row.ends_at, isPublic: row.is_public,
      createdBy: row.created_by,
    };
  };

  self.checkIn = async function (eventRef, fix) {
    return rpc('sr_check_in', {
      p_code: C.normalizeCode((eventRef && eventRef.code) || eventRef),
      p_lat: C.isPoint(fix) ? fix.lat : null,
      p_lng: C.isPoint(fix) ? fix.lng : null,
      p_accuracy: fix && fix.accuracyM != null ? fix.accuracyM : null,
    });
  };

  self.heartbeat = async function (eventId, fix) {
    return rpc('sr_heartbeat', {
      p_event: eventId,
      p_lat: C.isPoint(fix) ? fix.lat : null,
      p_lng: C.isPoint(fix) ? fix.lng : null,
      p_accuracy: fix && fix.accuracyM != null ? fix.accuracyM : null,
    });
  };

  self.leave = async function (eventId) { await rpc('sr_leave', { p_event: eventId }); };

  self.people = async function (eventId) {
    const res = await rpc('sr_people', { p_event: eventId });
    if (!res || !res.ok) {
      const err = new Error('You have to be in the room for that.');
      err.reason = res ? res.reason : 'not_present';
      throw err;
    }
    return res.people || [];
  };

  self.messages = async function (eventId) {
    const { data, error } = await client
      .from('messages')
      .select('id, event_id, user_id, body, created_at, profiles(display_name, emoji)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data || []).map((m) => ({
      id: m.id,
      eventId: m.event_id,
      userId: m.user_id,
      name: m.profiles ? m.profiles.display_name : 'Someone',
      emoji: m.profiles ? m.profiles.emoji : C.avatarFor(m.user_id).emoji,
      body: m.body,
      createdAt: m.created_at,
      mine: m.user_id === uid,
    }));
  };

  self.post = async function (eventId, body) {
    const clean = C.sanitizeMessage(body);
    if (!clean) return null;
    return rpc('sr_post', { p_event: eventId, p_body: clean });
  };

  self.wave = async function (eventId, userId) {
    return rpc('sr_wave', { p_event: eventId, p_to: userId });
  };
  self.unwave = async function (eventId, userId) {
    return rpc('sr_unwave', { p_event: eventId, p_to: userId });
  };

  self.threads = async function () { return (await rpc('sr_threads')) || []; };

  self.dms = async function (threadId) {
    const { data, error } = await client
      .from('dms').select('*').eq('thread_id', threadId)
      .order('created_at', { ascending: true }).limit(500);
    if (error) throw new Error(error.message);
    return (data || []).map((d) => ({
      id: d.id, threadId: d.thread_id, userId: d.user_id,
      body: d.body, createdAt: d.created_at, mine: d.user_id === uid,
    }));
  };

  self.sendDm = async function (threadId, body) {
    const clean = C.sanitizeMessage(body);
    if (!clean) return null;
    return rpc('sr_send_dm', { p_thread: threadId, p_body: clean });
  };

  self.block = async function (userId) { await rpc('sr_block', { p_user: userId }); };
  self.report = async function (userId, eventId, reason) {
    await rpc('sr_report', { p_user: userId, p_event: eventId, p_reason: reason || '' });
  };

  /* Realtime respects RLS, so these rows only ever arrive while you are in the
     room. Walking out doesn't just hide the feed — it stops being sent. */
  self.watchRoom = function (eventId) {
    if (channelEventId === eventId) return;
    if (channel) { client.removeChannel(channel); channel = null; }
    channelEventId = eventId;
    if (!eventId) return;
    channel = client
      .channel(`room:${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `event_id=eq.${eventId}` },
        emit)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'check_ins', filter: `event_id=eq.${eventId}` },
        emit)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dms' }, emit)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waves' }, emit)
      .subscribe();
  };

  self.subscribe = function (handler) {
    listeners.add(handler);
    return () => listeners.delete(handler);
  };

  self.reset = async function () {
    if (client) await client.auth.signOut();
  };

  return self;
}

/* ------------------------------------------------------------------ picker -- */

async function createBackend() {
  const cfg = loadConfig();
  if (cfg.url && cfg.anonKey) {
    try {
      return await SupabaseBackend(cfg).init();
    } catch (err) {
      /* A misconfigured project must not lock you out of the app. Fall back and
         say so, rather than showing a blank screen. */
      root.SameRoomStore.lastError = err.message || String(err);
    }
  }
  return LocalBackend().init();
}

root.SameRoomStore = {
  createBackend,
  LocalBackend,
  SupabaseBackend,
  loadConfig,
  saveConfig,
  KEYS,
  lastError: null,
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
