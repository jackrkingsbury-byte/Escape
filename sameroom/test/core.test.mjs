/* Tests for the Same Room core rules.  node --test sameroom/test  */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../core.js');

/* A fixed venue and clock so nothing depends on where or when the tests run. */
const VENUE = { lat: -33.918861, lng: 18.423300 }; // Cape Town
const T0 = Date.parse('2026-08-09T20:00:00Z');

function evt(over = {}) {
  return {
    id: 'e1',
    name: 'Test room',
    lat: VENUE.lat,
    lng: VENUE.lng,
    radiusM: 80,
    startsAt: new Date(T0 - 30 * 60 * 1000).toISOString(),
    endsAt: new Date(T0 + 3 * 60 * 60 * 1000).toISOString(),
    ...over,
  };
}
/* A fix `metres` north of the venue. */
const northOf = (metres, accuracyM = 10) =>
  ({ ...C.offsetPoint(VENUE, metres, 0), accuracyM });

test('haversine matches a known distance', () => {
  // One degree of latitude is ~111.2 km anywhere on the sphere.
  const d = C.haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
  assert.ok(Math.abs(d - 111195) < 200, `got ${d}`);
  assert.equal(C.haversineMeters(VENUE, VENUE), 0);
  assert.equal(C.haversineMeters(VENUE, null), null);
});

test('offsetPoint round-trips through haversine', () => {
  for (const m of [10, 100, 1000, 5000]) {
    const d = C.haversineMeters(VENUE, C.offsetPoint(VENUE, m, 0));
    assert.ok(Math.abs(d - m) / m < 0.01, `${m}m -> ${d}m`);
  }
});

test('bearing and compass point the right way', () => {
  assert.equal(C.compass(C.bearingDeg(VENUE, C.offsetPoint(VENUE, 500, 0))), 'N');
  assert.equal(C.compass(C.bearingDeg(VENUE, C.offsetPoint(VENUE, 0, 500))), 'E');
  assert.equal(C.compass(C.bearingDeg(VENUE, C.offsetPoint(VENUE, -500, 0))), 'S');
  assert.equal(C.compass(C.bearingDeg(VENUE, C.offsetPoint(VENUE, 0, -500))), 'W');
  assert.equal(C.compass(C.bearingDeg(VENUE, C.offsetPoint(VENUE, 500, 500))), 'NE');
});

test('inside the fence opens the room', () => {
  const g = C.fenceCheck(evt(), northOf(20), T0);
  assert.equal(g.allowed, true);
  assert.equal(g.inside, true);
  assert.equal(g.reason, 'ok');
  assert.equal(g.needM, 0);
});

test('outside the fence keeps it shut and says how far', () => {
  const g = C.fenceCheck(evt(), northOf(500), T0);
  assert.equal(g.allowed, false);
  assert.equal(g.inside, false);
  assert.equal(g.reason, 'too_far');
  assert.ok(Math.abs(g.needM - 420) < 15, `needM=${g.needM}`);
});

test('the edge gets slack for GPS jitter, but not much', () => {
  // 85 m from an 80 m fence is inside: within the 15 m slack.
  assert.equal(C.fenceCheck(evt(), northOf(85), T0).inside, true);
  // 120 m is not.
  assert.equal(C.fenceCheck(evt(), northOf(120), T0).inside, false);
});

test('a fix too vague to prove anything is refused', () => {
  const g = C.fenceCheck(evt(), northOf(10, 400), T0);
  assert.equal(g.allowed, false);
  assert.equal(g.reason, 'fix_too_vague');
  // Standing on the exact spot does not rescue a 400 m accuracy circle.
  assert.equal(C.fenceCheck(evt(), { ...VENUE, accuracyM: 400 }, T0).allowed, false);
});

test('accuracy budget scales with the fence but stays sane', () => {
  // A tiny room does not demand impossible precision...
  assert.equal(C.accuracyBudget(25), C.RULES.minAccuracyBudgetM);
  // ...a mid-sized one asks for its own radius...
  assert.equal(C.accuracyBudget(150), 150);
  // ...and a huge one still refuses a city-wide fix.
  assert.equal(C.accuracyBudget(2000), C.RULES.maxAccuracyM);
});

test('no fix means no entry', () => {
  const g = C.fenceCheck(evt(), null, T0);
  assert.equal(g.allowed, false);
  assert.equal(g.reason, 'no_fix');
  assert.equal(g.distanceM, null);
});

test('phases run upcoming -> open -> live -> winding_down -> ended', () => {
  const e = evt({
    startsAt: new Date(T0).toISOString(),
    endsAt: new Date(T0 + 60 * 60 * 1000).toISOString(),
  });
  assert.equal(C.eventPhase(e, T0 - 5 * 60 * 60 * 1000), 'upcoming');
  assert.equal(C.eventPhase(e, T0 - 10 * 60 * 1000), 'open');
  assert.equal(C.eventPhase(e, T0 + 30 * 60 * 1000), 'live');
  assert.equal(C.eventPhase(e, T0 + 90 * 60 * 1000), 'winding_down');
  assert.equal(C.eventPhase(e, T0 + 10 * 60 * 60 * 1000), 'ended');
});

test('standing in the right place at the wrong time is still shut out', () => {
  const early = evt({
    startsAt: new Date(T0 + 6 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(T0 + 8 * 60 * 60 * 1000).toISOString(),
  });
  const g = C.fenceCheck(early, northOf(5), T0);
  assert.equal(g.inside, true, 'physically inside');
  assert.equal(g.allowed, false, 'but the doors are shut');
  assert.equal(g.reason, 'not_open_yet');

  const over = evt({
    startsAt: new Date(T0 - 10 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(T0 - 8 * 60 * 60 * 1000).toISOString(),
  });
  assert.equal(C.fenceCheck(over, northOf(5), T0).reason, 'ended');
});

test('a fix that teleports is not plausible', () => {
  const a = { ...VENUE, at: T0 };
  const walk = { ...C.offsetPoint(VENUE, 30, 0), at: T0 + 30000 };
  const jump = { lat: 51.5, lng: -0.12, at: T0 + 30000 };
  assert.equal(C.speedCheck(a, walk).plausible, true);
  assert.equal(C.speedCheck(a, jump).plausible, false);
  assert.equal(C.speedCheck(a, { ...walk, at: T0 }), null, 'no elapsed time');
});

test('distances are rounded, never exact', () => {
  assert.equal(C.fuzzyDistance(3), 'right here');
  assert.equal(C.fuzzyDistance(18), 'a few steps');
  assert.equal(C.fuzzyDistance(63), '60 m');
  assert.equal(C.fuzzyDistance(437), '425 m');
  assert.equal(C.fuzzyDistance(2345), '2.3 km');
  assert.equal(C.fuzzyDistance(48000), '48 km');
  assert.equal(C.fuzzyDistance(NaN), '');
});

test('people in a room get bands, not coordinates', () => {
  assert.equal(C.distanceBand(4, 80), 'here');
  assert.equal(C.distanceBand(20, 80), 'steps');
  assert.equal(C.distanceBand(50, 80), 'across');
  assert.equal(C.distanceBand(200, 80), 'edge');
  assert.ok(C.bandCopy(C.distanceBand(4, 80)).length > 0);
});

test('join codes avoid the letters people mistype', () => {
  let rnd = 0;
  const code = C.makeJoinCode(() => { rnd += 0.017; return rnd % 1; });
  assert.equal(code.length, C.CODE_LEN);
  assert.match(code, new RegExp(`^[${C.CODE_ALPHABET}]+$`));
  assert.ok(!/[ILO]/.test(C.CODE_ALPHABET), 'I, L and O are not in the alphabet');
});

test('codes read off a poster still resolve', () => {
  assert.equal(C.normalizeCode('ab-cd12'), 'ABCD12');
  assert.equal(C.normalizeCode('  q7 hj2n '), 'Q7HJ2N');
  assert.equal(C.normalizeCode('IL0O11'), '110011', 'I and L fold to 1, O folds to 0');
  assert.equal(C.normalizeCode('ABCDEFGH'), 'ABCDEF', 'capped at the code length');
  assert.equal(C.isCompleteCode('abc'), false);
  assert.equal(C.isCompleteCode('abc123'), true);
});

test('messages are trimmed, capped and stripped of control characters', () => {
  assert.equal(C.sanitizeMessage('  hey  '), 'hey');
  assert.equal(C.sanitizeMessage('a\u0000b'), 'ab');
  assert.equal(C.sanitizeMessage('a\n\n\n\n\nb'), 'a\n\nb');
  assert.equal(C.sanitizeMessage('x'.repeat(900)).length, C.RULES.maxMessage);
  assert.equal(C.sanitizeMessage(null), '');
  assert.equal(C.sanitizeName('  Jack   K\u0007 '), 'Jack K');
});

test('avatars are stable for an id', () => {
  const a = C.avatarFor('user-1');
  assert.deepEqual(a, C.avatarFor('user-1'));
  assert.ok(a.emoji);
  assert.ok(a.hue >= 0 && a.hue < 360);
});

test('a thread key is the same from either side', () => {
  assert.equal(C.threadKey('e1', 'bob', 'ann'), C.threadKey('e1', 'ann', 'bob'));
  assert.notEqual(C.threadKey('e1', 'a', 'b'), C.threadKey('e2', 'a', 'b'));
});

test('event drafts are validated before they become rooms', () => {
  const good = C.validateEventDraft({
    name: 'Launch party',
    venue: 'The Old Biscuit Mill',
    lat: VENUE.lat,
    lng: VENUE.lng,
    radiusM: 120,
    startsAt: new Date(T0).toISOString(),
    endsAt: new Date(T0 + 4 * 3600e3).toISOString(),
  });
  assert.equal(good.ok, true);
  assert.equal(good.value.radiusM, 120);

  assert.equal(C.validateEventDraft({ name: 'x' }).ok, false);
  const backwards = C.validateEventDraft({
    name: 'Ok', lat: 0, lng: 0,
    startsAt: new Date(T0).toISOString(),
    endsAt: new Date(T0 - 3600e3).toISOString(),
  });
  assert.equal(backwards.ok, false);
  assert.match(backwards.errors.join(' '), /after the start/);

  // Radius is clamped, not rejected.
  const clamped = C.validateEventDraft({
    name: 'Ok', lat: 0, lng: 0, radiusM: 99999,
    startsAt: new Date(T0).toISOString(),
    endsAt: new Date(T0 + 3600e3).toISOString(),
  });
  assert.equal(clamped.value.radiusM, C.RULES.maxRadiusM);
});

test('presence expires when the heartbeat stops', () => {
  const inside = { lastSeenAt: new Date(T0).toISOString(), inside: true };
  assert.equal(C.presenceIsLive(inside, T0 + 30e3), true);
  assert.equal(C.presenceIsLive(inside, T0 + 200e3), false);

  // Someone who stepped outside gets the longer grace window instead.
  const stepped = { lastSeenAt: new Date(T0).toISOString(), inside: false, leftFenceAt: new Date(T0).toISOString() };
  assert.equal(C.presenceIsLive(stepped, T0 + 100e3), true);
  assert.equal(C.presenceIsLive(stepped, T0 + 200e3), false);
  assert.equal(C.graceLeftMs(stepped, T0 + 50e3), C.RULES.graceMs - 50e3);
  assert.equal(C.graceLeftMs(stepped, T0 + 999e3), 0);
  assert.equal(C.presenceIsLive(null, T0), false);
});

test('pulse counts only the last five minutes', () => {
  const msgs = [
    { createdAt: new Date(T0 - 60e3).toISOString() },
    { createdAt: new Date(T0 - 120e3).toISOString() },
    { createdAt: new Date(T0 - 40 * 60e3).toISOString() },
  ];
  assert.equal(C.pulse(msgs, T0).count, 2);
  assert.equal(C.pulse([], T0).count, 0);
});

test('rooms sort by walkable first, then by distance', () => {
  const here = evt({ id: 'here' });
  const nearby = evt({ id: 'nearby', ...C.offsetPoint(VENUE, 300, 0) });
  const closed = evt({
    id: 'closed',
    startsAt: new Date(T0 + 20 * 3600e3).toISOString(),
    endsAt: new Date(T0 + 22 * 3600e3).toISOString(),
  });
  const order = C.sortRooms([closed, nearby, here], northOf(5), T0).map((r) => r.event.id);
  assert.deepEqual(order, ['here', 'nearby', 'closed']);
});
