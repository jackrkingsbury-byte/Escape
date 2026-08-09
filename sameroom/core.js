/* Same Room — pure core.

   Every rule about "is this person actually at the event" lives here. No DOM,
   no network, no globals beyond SameRoomCore, so the app (app.js), the two
   backends (store.js) and the node tests (test/core.test.mjs) all decide the
   same thing the same way.

   The one rule the whole app hangs off: a room is readable only while you are
   inside its fence, during its window, with a fix precise enough to prove it. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SameRoomCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
'use strict';

/* Mean Earth radius (IUGG). Haversine on a sphere is good to ~0.5% — far
   better than any phone's fix, which is the thing that actually limits us. */
const EARTH_R = 6371008.8;

const RULES = {
  /* A fix vaguer than this proves nothing about a venue-sized fence. */
  maxAccuracyM: 250,
  /* Smallest accuracy budget we ever demand, so a 25 m room doesn't require
     25 m accuracy — that is below what most phones report indoors. */
  minAccuracyBudgetM: 60,
  /* GPS jitter around a doorway. Being 10 m past the line still counts. */
  edgeSlackM: 15,

  heartbeatMs: 20000,
  /* Silent for this long and you drop off the people list. */
  presenceTtlMs: 75000,
  /* You may step outside (smoke, toilet, phone call) for this long. */
  graceMs: 150000,

  /* Doors open before the start time and stay open after the end time. */
  doorsOpenBeforeMs: 60 * 60 * 1000,
  doorsCloseAfterMs: 90 * 60 * 1000,
  /* Messages are readable for this long after the doors shut, then purged. */
  keepAfterCloseMs: 24 * 60 * 60 * 1000,

  maxMessage: 600,
  maxName: 24,
  minRadiusM: 25,
  maxRadiusM: 2000,
  /* Faster than a passenger jet is a spoofed fix, not a walk to the bar. */
  maxSpeedMps: 340,
};

/* ---------- geometry ---------- */

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

function isPoint(p) {
  return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
}

/* Great-circle distance in metres. */
function haversineMeters(a, b) {
  if (!isPoint(a) || !isPoint(b)) return null;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/* Initial bearing from a to b, degrees clockwise from north. */
function bearingDeg(a, b) {
  if (!isPoint(a) || !isPoint(b)) return null;
  const dLng = rad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLng);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function compass(bearing) {
  if (!Number.isFinite(bearing)) return '';
  return COMPASS[Math.round(((bearing % 360) + 360) % 360 / 45) % 8];
}

/* Metres per degree of longitude at a latitude — used to draw the radar and to
   offset demo events without pretending to do real projection maths. */
function offsetPoint(p, metresNorth, metresEast) {
  const dLat = metresNorth / 111320;
  const dLng = metresEast / (111320 * Math.cos(rad(p.lat)) || 1);
  return { lat: p.lat + dLat, lng: p.lng + dLng };
}

/* ---------- the fence ---------- */

/* How precise a fix has to be before it can prove anything about this fence.
   Small rooms don't get to demand impossible precision; big ones don't get to
   accept a city-block-wide fix. */
function accuracyBudget(radiusM) {
  const r = Number.isFinite(radiusM) ? radiusM : RULES.minRadiusM;
  return Math.min(RULES.maxAccuracyM, Math.max(RULES.minAccuracyBudgetM, r));
}

/* upcoming -> open (doors) -> live -> winding_down -> ended */
function eventPhase(event, now) {
  const t = now instanceof Date ? now.getTime() : Number(now);
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'ended';
  if (t < start - RULES.doorsOpenBeforeMs) return 'upcoming';
  if (t < start) return 'open';
  if (t <= end) return 'live';
  if (t <= end + RULES.doorsCloseAfterMs) return 'winding_down';
  return 'ended';
}

const OPEN_PHASES = ['open', 'live', 'winding_down'];
const phaseIsOpen = (phase) => OPEN_PHASES.indexOf(phase) !== -1;

/* The gate. Given an event, a browser fix and the time, may this person read
   and write the room? Every backend calls this; the SQL mirrors it server-side
   so a patched client can't talk its way in. */
function fenceCheck(event, fix, now) {
  const phase = eventPhase(event, now == null ? Date.now() : now);
  const centre = { lat: event.lat, lng: event.lng };
  const radius = Number.isFinite(event.radiusM) ? event.radiusM : RULES.minRadiusM;
  const distanceM = isPoint(fix) ? haversineMeters(fix, centre) : null;
  const out = {
    phase,
    distanceM,
    bearingDeg: isPoint(fix) ? bearingDeg(fix, centre) : null,
    radiusM: radius,
    inside: false,
    allowed: false,
    reason: 'ok',
    /* Metres still to walk before the room opens. */
    needM: 0,
  };

  if (!phaseIsOpen(phase)) {
    out.reason = phase === 'upcoming' ? 'not_open_yet' : 'ended';
  }
  if (!isPoint(fix)) {
    out.reason = out.reason === 'ok' ? 'no_fix' : out.reason;
    return out;
  }

  const budget = accuracyBudget(radius);
  const acc = Number.isFinite(fix.accuracyM) ? fix.accuracyM : null;
  if (acc != null && acc > budget) {
    out.reason = out.reason === 'ok' ? 'fix_too_vague' : out.reason;
    out.accuracyBudgetM = budget;
    return out;
  }

  out.inside = distanceM <= radius + RULES.edgeSlackM;
  out.needM = out.inside ? 0 : Math.round(distanceM - radius);
  if (!out.inside && out.reason === 'ok') out.reason = 'too_far';
  out.allowed = out.inside && phaseIsOpen(phase);
  return out;
}

const GATE_COPY = {
  ok: 'You’re in the room.',
  no_fix: 'We can’t see where you are yet.',
  fix_too_vague: 'Your location is too fuzzy to prove you’re here.',
  too_far: 'You’re not at the venue.',
  not_open_yet: 'Doors haven’t opened yet.',
  ended: 'This room has closed.',
};
const gateCopy = (reason) => GATE_COPY[reason] || GATE_COPY.too_far;

/* A fix that moves faster than a jet is spoofed, not walked. Returns null when
   there's nothing to compare against yet. */
function speedCheck(prev, next) {
  if (!isPoint(prev) || !isPoint(next)) return null;
  const dt = (next.at - prev.at) / 1000;
  if (!Number.isFinite(dt) || dt <= 0) return null;
  const mps = haversineMeters(prev, next) / dt;
  return { mps, plausible: mps <= RULES.maxSpeedMps };
}

/* ---------- distance, said out loud ---------- */

/* How far you'd have to travel. Deliberately rounded: nobody needs six
   decimal places of someone else's whereabouts. */
function fuzzyDistance(m) {
  if (!Number.isFinite(m)) return '';
  if (m < 8) return 'right here';
  if (m < 25) return 'a few steps';
  if (m < 100) return `${Math.round(m / 10) * 10} m`;
  if (m < 950) return `${Math.round(m / 25) * 25} m`;
  if (m < 10000) return `${(m / 1000).toFixed(1)} km`;
  if (m < 500000) return `${Math.round(m / 1000)} km`;
  return 'a long way';
}

/* Distance between two people who are already in the same fence. Bucketed on
   purpose — inside a room, "across the room" is the useful answer and an exact
   metre count is a tracking device. */
const BANDS = {
  here: 'right next to you',
  steps: 'a few steps away',
  across: 'across the room',
  edge: 'the far side',
};
function distanceBand(m, radiusM) {
  if (!Number.isFinite(m)) return null;
  const r = Number.isFinite(radiusM) ? radiusM : RULES.minRadiusM;
  if (m < 10) return 'here';
  if (m < 30) return 'steps';
  if (m < Math.max(60, r * 0.6)) return 'across';
  return 'edge';
}
const bandCopy = (band) => BANDS[band] || '';

/* ---------- time, said out loud ---------- */

function countdown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 'now';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

function relativeTime(ts, now) {
  const t = new Date(ts).getTime();
  const n = now == null ? Date.now() : (now instanceof Date ? now.getTime() : now);
  const s = Math.round((n - t) / 1000);
  if (!Number.isFinite(s)) return '';
  if (s < 10) return 'now';
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function clockTime(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* One line describing where an event is in its life, for the card. */
function phraseForPhase(event, now) {
  const t = now == null ? Date.now() : now;
  const phase = eventPhase(event, t);
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  if (phase === 'upcoming') return `starts in ${countdown(start - t)}`;
  if (phase === 'open') return `doors open · starts in ${countdown(start - t)}`;
  if (phase === 'live') return `live · ends in ${countdown(end - t)}`;
  if (phase === 'winding_down') return 'winding down';
  return 'closed';
}

/* ---------- join codes ---------- */

/* No I, L or O: the letters people mistype as 1 and 0. Input is folded back
   onto the alphabet so a code read off a poster still works. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ0123456789';
const CODE_LEN = 6;

function makeJoinCode(rnd) {
  const r = rnd || Math.random;
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) {
    out += CODE_ALPHABET[Math.floor(r() * CODE_ALPHABET.length) % CODE_ALPHABET.length];
  }
  return out;
}

function normalizeCode(input) {
  return String(input == null ? '' : input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .slice(0, CODE_LEN);
}

const isCompleteCode = (code) => normalizeCode(code).length === CODE_LEN;

/* ---------- text ---------- */

function sanitizeMessage(text) {
  return String(text == null ? '' : text)
    /* Strip control characters but keep newlines and tabs. */
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .trim()
    .slice(0, RULES.maxMessage);
}

function sanitizeName(text) {
  return String(text == null ? '' : text)
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, RULES.maxName);
}

/* ---------- identity ---------- */

const AVATARS = ['🦊', '🐙', '🦉', '🐝', '🦄', '🐳', '🦋', '🐢', '🦁', '🐸',
  '🦩', '🐼', '🦚', '🐧', '🦔', '🐨', '🦜', '🦡', '🦈', '🐬'];

function hashString(s) {
  let h = 2166136261;
  const str = String(s == null ? '' : s);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function avatarFor(seed) {
  const h = hashString(seed);
  return { emoji: AVATARS[h % AVATARS.length], hue: h % 360 };
}

function randomId(rnd) {
  const r = rnd || Math.random;
  return `${Date.now().toString(36)}-${Math.floor(r() * 1e12).toString(36)}`;
}

/* Threads are keyed by the pair, not by who waved first. */
function threadKey(eventId, a, b) {
  return `${eventId}:${[a, b].sort().join('~')}`;
}

/* ---------- events ---------- */

function validateEventDraft(draft) {
  const errors = [];
  const name = sanitizeName(draft && draft.name);
  const venue = sanitizeName(draft && draft.venue);
  if (name.length < 2) errors.push('Give the room a name.');
  const lat = Number(draft && draft.lat);
  const lng = Number(draft && draft.lng);
  if (!isPoint({ lat, lng })) errors.push('Set the venue location.');
  let radiusM = Math.round(Number(draft && draft.radiusM));
  if (!Number.isFinite(radiusM)) radiusM = 80;
  radiusM = Math.min(RULES.maxRadiusM, Math.max(RULES.minRadiusM, radiusM));
  const startsAt = new Date(draft && draft.startsAt).getTime();
  const endsAt = new Date(draft && draft.endsAt).getTime();
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
    errors.push('Set a start and an end time.');
  } else if (endsAt <= startsAt) {
    errors.push('The end has to come after the start.');
  } else if (endsAt - startsAt > 7 * 24 * 60 * 60 * 1000) {
    errors.push('Rooms run for a week at most.');
  }
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      name,
      venue,
      lat,
      lng,
      radiusM,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      isPublic: !!(draft && draft.isPublic),
    },
  };
}

/* Present = checked in, seen recently, and either inside the fence or still
   inside the grace period after stepping out. */
function presenceIsLive(row, now) {
  if (!row) return false;
  const n = now == null ? Date.now() : now;
  const seen = new Date(row.lastSeenAt).getTime();
  if (!Number.isFinite(seen)) return false;
  const ttl = row.inside === false ? RULES.graceMs : RULES.presenceTtlMs;
  return n - seen <= ttl;
}

/* How long you have left outside before the room locks again. */
function graceLeftMs(row, now) {
  if (!row || row.inside !== false) return RULES.graceMs;
  const n = now == null ? Date.now() : now;
  const left = RULES.graceMs - (n - new Date(row.leftFenceAt || row.lastSeenAt).getTime());
  return Math.max(0, left);
}

/* Messages per minute over the last five, so a locked-out visitor can see the
   room is alive without seeing a word of it. */
function pulse(messages, now) {
  const n = now == null ? Date.now() : now;
  const window = 5 * 60 * 1000;
  const recent = (messages || []).filter((m) => n - new Date(m.createdAt).getTime() <= window);
  return { count: recent.length, perMin: Math.round((recent.length / 5) * 10) / 10 };
}

/* Nearest first, but a room you can actually walk into beats a closer one that
   hasn't opened. */
function sortRooms(events, fix, now) {
  const n = now == null ? Date.now() : now;
  return (events || [])
    .map((e) => {
      const gate = fenceCheck(e, fix, n);
      return { event: e, gate };
    })
    .sort((a, b) => {
      const openA = phaseIsOpen(a.gate.phase) ? 0 : 1;
      const openB = phaseIsOpen(b.gate.phase) ? 0 : 1;
      if (openA !== openB) return openA - openB;
      if (a.gate.inside !== b.gate.inside) return a.gate.inside ? -1 : 1;
      const da = a.gate.distanceM == null ? Infinity : a.gate.distanceM;
      const db = b.gate.distanceM == null ? Infinity : b.gate.distanceM;
      return da - db;
    });
}

return {
  RULES,
  EARTH_R,
  isPoint,
  haversineMeters,
  bearingDeg,
  compass,
  offsetPoint,
  accuracyBudget,
  eventPhase,
  phaseIsOpen,
  fenceCheck,
  gateCopy,
  speedCheck,
  fuzzyDistance,
  distanceBand,
  bandCopy,
  countdown,
  relativeTime,
  clockTime,
  phraseForPhase,
  CODE_ALPHABET,
  CODE_LEN,
  makeJoinCode,
  normalizeCode,
  isCompleteCode,
  sanitizeMessage,
  sanitizeName,
  avatarFor,
  hashString,
  randomId,
  threadKey,
  validateEventDraft,
  presenceIsLive,
  graceLeftMs,
  pulse,
  sortRooms,
};
});
