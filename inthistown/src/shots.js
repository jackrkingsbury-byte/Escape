// In This Town — "Chess".  The film: cast, sets and the shot list (SPEC.md §8 film contract).
// Shots start on words of the narration ('b14.w5' = word 5 of beat 14, 'b03.h2' = 3rd HUSS of beat 3).
import * as THREE from 'three';
import { buildTown, buildRoom } from './world.js';
import { makeChessSet, makeChessClock, makeCake, makePlate, makeSpeaker, makeImpactBurst, makeSweatDrop,
  makeTable, makeChair, makeBed, makeConfetti } from './props.js';
import { MAIN, EXTRAS, EXTRA_IDS } from './cast.js';
import { moveTrack, crowdGrid, animateCrowd, putProp, rel, yawOf } from './direct.js';
import { clamp, lerp, ease, smooth, hash } from './lib/util.js';

export const cast = { ...MAIN, ...EXTRAS };
export const lazySets = true;

export const sets = {
  town: () => buildTown({ seed: 3 }),
  room: () => buildRoom({ variant: 'hero', poster: 'knight', window: 'party' }),
  roomMarcus: () => buildRoom({ variant: 'marcus', window: 'dark' }),
  roomBrenda: () => buildRoom({ variant: 'brenda', window: 'dark' }),
  roomGrandad: () => buildRoom({ variant: 'grandad', window: 'dark' }),
};

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TABLE_TOP = 0.78;

export function init(ctx) {
  const P = ctx.props;
  P.chess = makeChessSet({ size: 0.62 });
  P.rug = makeChessSet({ size: 3.0 });         // giant board on the floor for the cat's L-hops
  P.clock = makeChessClock();
  P.cake = makeCake();
  P.plate = makePlate();
  P.burst = makeImpactBurst();
  P.sweat = makeSweatDrop();
  P.speaker = makeSpeaker();
  P.table = makeTable({ w: 0.95, d: 0.8 });
  P.chair = makeChair();
  P.chair2 = makeChair();
  P.bed = makeBed();
  P.confetti = makeConfetti({ count: 140, t0: 0, origin: [0, 0, 0] });
  P.boardThick = 0;      // chess root is the board's top surface; table top + this = root height
}

// ───────────────────────────────────────────────────────────────────────────────────── helpers
const _v = V();
function headPos(ch, up = 0.3) {
  ch.root.updateMatrixWorld(true);
  return ch.joints.head.getWorldPosition(V()).add(V(0, up * (ch.root.scale.y || 1), 0));
}

/** A local frame (origin, yaw): f(x, y, z) → world, with +z = facing direction, +x = character's left. */
function frame(origin, yaw) {
  const fwd = V(Math.sin(yaw), 0, Math.cos(yaw));
  const left = V(Math.cos(yaw), 0, -Math.sin(yaw));
  const f = (x, y, z) => V().copy(origin).addScaledVector(left, x).addScaledVector(fwd, z).add(V(0, y, 0));
  f.origin = origin.clone(); f.yaw = yaw; f.fwd = fwd; f.left = left;
  return f;
}

function frameAt(ctx, anchorName, extraYaw = 0) {
  const a = ctx.anchor(anchorName);
  return frame(rel(a), yawOf(a) + extraYaw);
}

/** Room "chess nook": table in the middle of the room, hero facing the open (camera) side. */
function roomNook(ctx, who = 'me', { board = true, clock = true, lighting = 'night' } = {}) {
  const set = ctx.set;
  set.setLighting?.(lighting);
  set.root.updateMatrixWorld(true);
  const center = set.root.getWorldPosition(V());
  const cam = ctx.point('room.cam');
  const d = V(cam.x - center.x, 0, cam.z - center.z).normalize();
  const yaw = Math.atan2(d.x, d.z);
  const F = frame(V().copy(center).addScaledVector(d, -0.35), yaw);
  const ch = ctx.cast[who];
  ctx.use(who);
  ctx.place(ch, F(0, 0, 0), { yaw });
  ch.root.rotation.set(0, yaw, 0);
  const P = ctx.props;
  putProp(ctx, P.chair, F(0, 0, 0), {});
  P.chair.position.copy(F(0, 0, -0.02)); P.chair.rotation.set(0, yaw, 0);
  ctx.add(P.table); P.table.position.copy(F(0, 0, 0.62)); P.table.rotation.set(0, yaw, 0);
  if (board) {
    ctx.add(P.chess.root); P.chess.root.position.copy(F(0, TABLE_TOP + P.boardThick, 0.62)); P.chess.root.rotation.set(0, yaw, 0);
    P.chess.reset();
  }
  if (clock) {
    ctx.add(P.clock.root); P.clock.root.position.copy(F(-0.4, TABLE_TOP, 0.62)); P.clock.root.rotation.set(0, yaw + Math.PI / 2, 0);
  }
  return { F, ch, yaw };
}

// Practice openings: each HUSS lands a white move; black replies instantly in between.
function practiceTrack(ctx, beatId, whiteMoves, blackMoves) {
  const hs = ctx.hussTimes(beatId);
  const moves = [];
  hs.forEach((h, i) => {
    if (whiteMoves[i]) moves.push({ from: whiteMoves[i][0], to: whiteMoves[i][1], at: h + 0.03, dur: 0.16 });
    if (blackMoves[i]) moves.push({ from: blackMoves[i][0], to: blackMoves[i][1], at: h + 0.12, dur: 0.05, noSlam: true });
  });
  return { track: moveTrack(moves), hits: hs.map((h) => h + 0.03) };
}

function nookCams(F) {
  return {
    wide: { pos: F(0.0, 1.75, 3.6), look: F(0, 1.05, 0.25), fov: 42 },
    med: { pos: F(0.75, 1.55, 2.0), look: F(0, 1.25, 0.35), fov: 40 },
    face: { pos: F(0.22, 1.58, 1.15), look: F(0, 1.5, 0.05), fov: 34 },
    faceL: { pos: F(-0.45, 1.5, 1.05), look: F(0, 1.48, 0.05), fov: 36 },
    board: { pos: F(0.5, 1.02, 1.0), look: F(0.0, 0.84, 0.6), fov: 38 },
    boardLow: { pos: F(-0.42, 0.9, 0.95), look: F(0.05, 0.82, 0.55), fov: 40 },
    top: { pos: F(-0.15, 2.0, 0.85), look: F(0, 0.78, 0.6), fov: 45 },
  };
}

function burstAt(ctx, pos, t, hit) {
  const b = ctx.props.burst;
  const u = (t - hit) / 0.3;
  if (u < 0 || u > 1) { b.root.visible = false; return; }
  b.root.visible = true; ctx.add(b.root); b.root.position.copy(pos); b.update(u);
}

function lastBefore(times, t) { let r = null; for (const x of times) if (x <= t) r = x; return r; }

// A sitting slammer at a nook: pose + chess + burst + punch. Used by all HUSS-at-the-board shots.
function slamUpdate(ctx, rig, practice, { face = 'determined', burst = true } = {}) {
  const { ch, F } = rig;
  ch.pose('sitSlam', ctx.t, { hits: practice.hits });
  const hit = lastBefore(practice.hits, ctx.t);
  const near = hit != null && ctx.t - hit < 0.22;
  ch.face(near ? 'huss' : face, ctx.t);
  practice.track.play(ctx.props.chess, ctx.t);
  if (burst && hit != null) burstAt(ctx, F(0, TABLE_TOP + 0.02, 0.5), ctx.t, hit);
  ctx.cam.punch(practice.hits, ctx.t, 0.1, 0.22);
}

function pressClock(ctx, times) {
  const c = ctx.props.clock;
  const h = lastBefore(times, ctx.t);
  c.setTimes?.(300 - Math.floor(ctx.t * 7) % 300, 180 + Math.floor(ctx.t * 3) % 120);
  if (h != null && ctx.t - h < 0.25) c.press('L', (ctx.t - h) / 0.25); else c.press('L', 0);
}

// Town helpers
function partyTown(ctx, { fireworks = true } = {}) {
  ctx.set.setLighting?.('party_night');
  ctx.set.set?.('partyProps', true);
  ctx.set.set?.('fireworks', fireworks);
  ctx.set.set?.('foam', 0);
  ctx.set.set?.('windowGlow', 1);
}

const PARTY_A = EXTRA_IDS.slice(0, 10);
const PARTY_B = EXTRA_IDS.slice(10, 18);

// ═════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody goes out partying."
  {
    name: 'party town crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      ctx.store = { crowd: crowdGrid(ctx, [...PARTY_A, ...PARTY_B], 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 2 }) };
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh');
      const d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store.from = { pos: hi, look: c.clone().add(V(0, 0.5, 0)), fov: 50 };
      ctx.store.to = { pos: c.clone().addScaledVector(d, 9).add(V(0, 3.2, 0)), look: ctx.point('street.crowdA').add(V(0, 1.2, 0)), fov: 42 };
    },
    update(ctx, lt, u) {
      animateCrowd(ctx.store.crowd, ctx.t);
      ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic);
    },
  },
  // ── b02 "Except me."
  {
    name: 'except me', start: 'b02-0.1', set: 'room', captions: true,
    setup(ctx) { ctx.store = roomNook(ctx); ctx.store.cams = nookCams(ctx.store.F); },
    update(ctx, lt, u) {
      const { ch, cams } = ctx.store;
      ch.pose('sitIdle', ctx.t);
      ch.face(ctx.t > ctx.time('b02.w1') ? 'determined' : 'neutral', ctx.t);
      ctx.cam.move(cams.wide, cams.med, u, ease.inOutQuad);
    },
  },
  // ── b03 HUSS ×6 (two tight triplets) — cut on every HUSS
  ...['board', 'face', 'boardLow', 'med', 'faceL', 'board'].map((camName, i) => ({
    name: `huss b03 #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) {
      ctx.store = roomNook(ctx); ctx.store.cams = nookCams(ctx.store.F);
      ctx.store.practice = practiceTrack(ctx, 'b03', [['e2', 'e4'], ['g1', 'f3'], ['f1', 'c4'], ['c2', 'c3'], ['d2', 'd4'], ['e1', 'g1']],
        [['e7', 'e5'], ['b8', 'c6'], ['f8', 'c5'], ['g8', 'f6'], ['e5', 'd4'], null]);
    },
    update(ctx, lt) {
      slamUpdate(ctx, ctx.store, ctx.store.practice);
      pressClock(ctx, ctx.store.practice.hits.map((h) => h + 0.09));
      const c = ctx.store.cams[camName];
      ctx.cam.set(c); ctx.cam.shake(0.08, ctx.t, i);
    },
  })),
  // ── b04 "Every night, there's a party somewhere."
  {
    name: 'street party truck', start: 'b04-0.15', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      ctx.store = { crowd: crowdGrid(ctx, [...PARTY_A, ...PARTY_B], 'street.crowdB', { cols: 6, dx: 1.2, dz: 1.25, seed: 5 }) };
      const F = frameAt(ctx, 'street.crowdB');
      ctx.store.from = { pos: F(-5, 2.2, 7.5), look: F(-1, 1.3, 0), fov: 45 };
      ctx.store.to = { pos: F(4, 2.6, 7.0), look: F(1, 1.3, 0), fov: 45 };
    },
    update(ctx, lt, u) { animateCrowd(ctx.store.crowd, ctx.t); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutSine); },
  },
  // ── b05 "Pool parties."
  {
    name: 'pool party', start: 'b05-0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const ids = EXTRA_IDS.slice(0, 8);
      const crowd = [];
      ids.forEach((id, i) => {
        const ch = ctx.cast[id];
        const edge = `pool.edge${(i % 4) + 1}`;
        ctx.place(ch, edge, { offset: [(Math.floor(i / 4) - 0.5) * 1.3, 0, 0], yaw: Math.PI + (hash(i) - 0.5) });
        ch.setAccessory?.('partyHat', i % 2 === 0);
        crowd.push({ ch, phase: hash(i + 3) * 2, k: i });
      });
      ctx.store = { crowd };
      const c = ctx.point('pool.center'), cam = ctx.point('pool.cam');
      ctx.store.from = { pos: cam, look: c.clone().add(V(0, 0.6, 0)), fov: 46 };
      ctx.store.to = { pos: cam.clone().lerp(c, 0.25).add(V(0, -0.3, 0)), look: c.clone().add(V(0, 0.8, 0)), fov: 44 };
    },
    update(ctx, lt, u) { animateCrowd(ctx.store.crowd, ctx.t, { faces: ['grin', 'laugh', 'smile'] }); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.outQuad); },
  },
  // ── b06 "Foam parties."
  {
    name: 'foam party', start: 'b06-0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      ctx.set.set?.('foam', 1);
      ctx.store = { crowd: crowdGrid(ctx, EXTRA_IDS.slice(6, 16), 'foam.center', { cols: 4, dx: 1.2, dz: 1.2, seed: 9, hats: true }) };
      const c = ctx.point('foam.center'), cam = ctx.point('foam.cam');
      ctx.store.from = { pos: cam, look: c.clone().add(V(0, 0.9, 0)), fov: 48 };
      ctx.store.to = { pos: cam.clone().lerp(c, 0.3), look: c.clone().add(V(0, 1.0, 0)), fov: 44 };
    },
    update(ctx, lt, u) {
      animateCrowd(ctx.store.crowd, ctx.t, { action: 'cheer', faces: ['laugh', 'grin'] });
      ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.outQuad);
    },
  },
  // ── b07 "Even a birthday party for the mayor's pigeon."
  {
    name: 'pigeon birthday', start: 'b07-0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'park.table');
      const { cake } = ctx.props;
      ctx.add(cake.root); cake.root.position.copy(F(0.12, 0, -0.05)); cake.root.rotation.set(0, F.yaw, 0);
      const pg = ctx.cast.pigeon;
      ctx.place(pg, F(-0.18, 0, 0.0), { yaw: F.yaw + 0.5 });
      pg.root.rotation.set(0, F.yaw + 0.6, 0);
      pg.setAccessory?.('partyHat', true);
      ctx.place('mayor', F(0, -0.78, -1.1), {}); ctx.cast.mayor.root.rotation.set(0, F.yaw, 0);
      ctx.place('x03', F(-1.1, -0.78, -0.8), {}); ctx.cast.x03.root.rotation.set(0, F.yaw + 0.4, 0); ctx.cast.x03.setAccessory?.('partyHat', true);
      ctx.place('x07', F(1.1, -0.78, -0.8), {}); ctx.cast.x07.root.rotation.set(0, F.yaw - 0.4, 0); ctx.cast.x07.setAccessory?.('partyHat', true);
      ctx.store = { F };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store;
      ctx.props.cake.update(ctx.t);
      ctx.cast.mayor.pose('clap', ctx.t); ctx.cast.mayor.face('grin', ctx.t);
      ctx.cast.x03.pose('cheer', ctx.t + 0.4); ctx.cast.x03.face('laugh', ctx.t);
      ctx.cast.x07.pose('clap', ctx.t + 0.2); ctx.cast.x07.face('smile', ctx.t);
      ctx.cast.pigeon.pose(ctx.t > ctx.time('b07.w7') ? 'flap' : 'idle', ctx.t);
      ctx.cast.pigeon.face('smile', ctx.t);
      const k = ease.inOutCubic(ctx.progress('b07.w5', 'b07.w7+0.1'));
      ctx.cam.move({ pos: F(0.4, 1.4, 2.6), look: F(0, 0.35, -0.3), fov: 44 }, { pos: F(-0.05, 0.3, 0.75), look: F(-0.15, 0.2, 0), fov: 38 }, k);
    },
  },
  // ── b08 "My best friend Marcus goes to every party."
  {
    name: 'marcus dancing', start: 'b08-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const F = frameAt(ctx, 'street.crowdA');
      ctx.place('marcus', F(0, 0, 2.2), {}); ctx.cast.marcus.root.rotation.set(0, F.yaw, 0);
      ctx.store = { F, crowd: crowdGrid(ctx, PARTY_A, 'street.crowdA', { cols: 5, dx: 1.3, dz: 1.3, seed: 12, hats: true }) };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store;
      animateCrowd(ctx.store.crowd, ctx.t);
      ctx.cast.marcus.pose('dance2', ctx.t, { speed: 1.1, intensity: 1 }); ctx.cast.marcus.face(lt > 0.8 ? 'laugh' : 'grin', ctx.t);
      ctx.cam.move({ pos: F(1.2, 1.6, 6.0), look: F(0, 1.3, 2.2), fov: 40 }, { pos: F(0.4, 1.5, 4.6), look: F(0, 1.45, 2.2), fov: 38 }, u, ease.inOutQuad);
    },
  },
  // ── b09 "My neighbor Brenda goes to every party."
  {
    name: 'brenda dancing', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'pool.edge1');
      ctx.place('brenda', F(0, 0, 0), {}); ctx.cast.brenda.root.rotation.set(0, F.yaw + Math.PI, 0);
      const crowd = [];
      EXTRA_IDS.slice(10, 14).forEach((id, i) => {
        ctx.place(id, F((i - 1.5) * 1.3, 0, -1.2 - (i % 2) * 0.6), {});
        ctx.cast[id].root.rotation.set(0, F.yaw + Math.PI + (hash(i) - 0.5) * 0.6, 0);
        crowd.push({ ch: ctx.cast[id], phase: hash(i * 2) * 2, k: i });
      });
      ctx.store = { F, crowd, back: F(0, 0, 0) };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store;
      animateCrowd(ctx.store.crowd, ctx.t);
      ctx.cast.brenda.pose('dance', ctx.t, { speed: 1.05 }); ctx.cast.brenda.face('grin', ctx.t);
      // Brenda faces -F.z (towards the pool); film from the pool side
      ctx.cam.move({ pos: F(-1.0, 1.4, -3.6), look: F(0, 1.35, 0), fov: 40 }, { pos: F(-0.4, 1.45, -2.8), look: F(0, 1.5, 0), fov: 38 }, u, ease.inOutQuad);
    },
  },
  // ── b10 "Even my grandad crowd-surfs on Wednesdays."
  {
    name: 'grandad crowd surf', start: 'b10-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const F = frameAt(ctx, 'street.crowdB');
      const ids = [...PARTY_A, ...PARTY_B].slice(0, 14);
      const crowd = [];
      ids.forEach((id, i) => {
        const row = i % 2, col = Math.floor(i / 2);
        ctx.place(id, F(-4.2 + col * 1.2, 0, row ? 0.55 : -0.55), {});
        ctx.cast[id].root.rotation.set(0, F.yaw + (row ? Math.PI : 0) * 0 + (hash(i) - 0.5) * 0.5, 0);
        ctx.cast[id].setAccessory?.('partyHat', true);
        crowd.push({ ch: ctx.cast[id], phase: hash(i) * 0.4, k: i });
      });
      ctx.use('grandad');
      ctx.store = { F, crowd };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store;
      animateCrowd(ctx.store.crowd, ctx.t, { action: 'cheer', faces: ['laugh', 'grin', 'shocked'] });
      const g = ctx.cast.grandad;
      const x = lerp(-4.2, 3.2, u);
      g.root.position.copy(F(x, 2.25 + Math.sin(ctx.t * 9) * 0.06, 0));
      g.root.rotation.set(0, F.yaw - Math.PI / 2, 0);
      g.pose('crowdSurf', ctx.t); g.face('laugh', ctx.t);
      ctx.cam.set({ pos: F(x * 0.85 - 1.0, 2.6, 5.2), look: F(x, 2.0, 0), fov: 42 });
      ctx.cam.shake(0.12, ctx.t, 3);
    },
  },
  // ── b11 "But not me. I play chess."
  {
    name: 'but not me', start: 'b11-0.1', set: 'room',
    setup(ctx) { ctx.store = roomNook(ctx); ctx.store.cams = nookCams(ctx.store.F); },
    update(ctx, lt, u) {
      const { ch, cams, F } = ctx.store;
      const chess = ctx.time('b11.w3');
      ch.pose('sitIdle', ctx.t, { headYaw: ctx.t < chess ? 0 : -0.15 });
      ch.face(ctx.t < chess ? 'smug' : 'determined', ctx.t);
      if (ctx.t < chess) ctx.cam.move(cams.med, cams.face, ease.inOutQuad(ctx.progress('b11', 'b11.w3')));
      else ctx.cam.move({ pos: F(0.0, 1.6, 1.6), look: F(0, 0.85, 0.6), fov: 40 }, cams.top, ease.outQuad(ctx.progress('b11.w3', 'b12')));
    },
  },
  // ── b12 HUSS ×3
  ...['faceL', 'board', 'face'].map((camName, i) => ({
    name: `huss b12 #${i + 1}`, start: i === 0 ? 'b12.h0-0.12' : `b12.h${i}-0.03`, set: 'room',
    setup(ctx) {
      ctx.store = roomNook(ctx); ctx.store.cams = nookCams(ctx.store.F);
      ctx.store.practice = practiceTrack(ctx, 'b12', [['d2', 'd4'], ['c2', 'c4'], ['b1', 'c3']], [['d7', 'd5'], ['e7', 'e6'], null]);
    },
    update(ctx) {
      slamUpdate(ctx, ctx.store, ctx.store.practice);
      pressClock(ctx, ctx.store.practice.hits.map((h) => h + 0.09));
      ctx.cam.set(ctx.store.cams[camName]); ctx.cam.shake(0.08, ctx.t, 10 + i);
    },
  })),
  // ── b13 "Three hundred puzzles before breakfast."  (blitz at dawn)
  {
    name: 'puzzles at dawn', start: 'b13-0.1', set: 'room',
    setup(ctx) {
      ctx.store = roomNook(ctx, 'me', { lighting: 'dawn' }); ctx.set.set?.('window', 'sunrise');
      ctx.store.cams = nookCams(ctx.store.F);
      const t0 = ctx.time('b13'), t1 = ctx.time('b14');
      const seq = [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'b5'], ['a7', 'a6'], ['b5', 'a4'], ['g8', 'f6'], ['e1', 'g1'], ['f8', 'e7']];
      const hits = [];
      ctx.store.track = moveTrack(seq.map((m, i) => { const at = t0 + 0.15 + i * (t1 - t0 - 0.3) / seq.length; if (i % 2 === 0) hits.push(at); return { from: m[0], to: m[1], at, dur: 0.1, noSlam: i % 2 === 1 }; }));
      ctx.store.hits = hits;
    },
    update(ctx, lt, u) {
      const { ch, cams } = ctx.store;
      ch.pose('sitSlam', ctx.t, { hits: ctx.store.hits, speed: 2 });
      ch.face('determined', ctx.t);
      ctx.store.track.play(ctx.props.chess, ctx.t);
      pressClock(ctx, ctx.store.hits.map((h) => h + 0.05));
      ctx.cam.move(cams.wide, cams.med, u, ease.inOutSine);
    },
  },
  // ── b14 "I don't eat breakfast. I sacrifice it."
  {
    name: 'sacrifice breakfast', start: 'b14-0.1', set: 'room',
    setup(ctx) {
      ctx.store = roomNook(ctx, 'me', { lighting: 'day' }); ctx.set.set?.('window', 'day');
      ctx.store.cams = nookCams(ctx.store.F);
      const { F } = ctx.store; const p = ctx.props.plate;
      ctx.add(p.root); p.root.position.copy(F(0.05, TABLE_TOP + 0.02, 0.6)); p.root.rotation.set(0, F.yaw, 0);
    },
    update(ctx, lt, u) {
      const { ch, cams, F } = ctx.store;
      const tS = ctx.time('b14.w5');
      const k = clamp((ctx.t - tS) / 0.55, 0, 1);
      const p = ctx.props.plate;
      // sacrifice: the hero flicks the plate off the board — it flies away tumbling
      p.root.position.copy(F(0.05 + 2.2 * k, TABLE_TOP + 0.02 + 1.6 * k - 2.4 * k * k + 0.0, 0.6 + 0.4 * k));
      p.root.rotation.set(k * 5, F.yaw + k * 3, k * 2);
      if (p.food) { p.food.position.y = k * 0.25; p.food.rotation.x = k * 6; }
      ch.pose(ctx.t < tS - 0.15 ? 'sitIdle' : 'sitSlam', ctx.t, { hits: [tS] });
      ch.face(ctx.t < ctx.time('b14.w4') ? 'neutral' : 'smug', ctx.t);
      ctx.cam.move(cams.med, { pos: F(0.6, 1.45, 1.6), look: F(0, 1.05, 0.45), fov: 40 }, ease.inOutQuad(u));
    },
  },
  // ── b15 "I castled my bed."
  {
    name: 'castled bed', start: 'b15-0.1', set: 'room',
    setup(ctx) {
      const set = ctx.set; set.setLighting?.('day'); set.set?.('window', 'day');
      set.root.updateMatrixWorld(true);
      const center = set.root.getWorldPosition(V());
      const cam = ctx.point('room.cam');
      const d = V(cam.x - center.x, 0, cam.z - center.z).normalize();
      const F = frame(center, Math.atan2(d.x, d.z));
      ctx.use('me'); ctx.cast.me.root.position.copy(F(0.0, 0, 0.4)); ctx.cast.me.root.rotation.set(0, F.yaw, 0);
      ctx.add(ctx.props.bed); ctx.props.bed.rotation.set(0, F.yaw + Math.PI / 2, 0);
      ctx.store = { F };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store;
      const t0 = ctx.time('b15.w1') - 0.05;
      const k = ease.inOutQuad(clamp((ctx.t - t0) / 0.7, 0, 1));
      const bed = ctx.props.bed;
      bed.position.copy(F(lerp(1.5, -1.5, k), Math.sin(Math.PI * k) * 2.3, 0.2));
      bed.rotation.set(0, F.yaw + Math.PI / 2, Math.sin(Math.PI * k) * 0.25);
      const me = ctx.cast.me;
      me.pose(k > 0.05 && k < 0.95 ? 'surprised' : 'idle', ctx.t);
      me.face(k > 0.05 && k < 0.95 ? 'shocked' : 'smug', ctx.t);
      ctx.cam.set({ pos: F(0, 1.7, 5.0), look: F(0, 1.1, 0.2), fov: 50 });
      if (ctx.t > t0 + 0.7) ctx.cam.punch([t0 + 0.7], ctx.t, 0.08, 0.3);
    },
  },
  // ── b16 "My cat only moves in L-shapes now."
  {
    name: 'cat L hops', start: 'b16-0.1', set: 'room',
    setup(ctx) {
      const set = ctx.set; set.setLighting?.('day'); set.set?.('window', 'day');
      set.root.updateMatrixWorld(true);
      const center = set.root.getWorldPosition(V());
      const cam = ctx.point('room.cam');
      const d = V(cam.x - center.x, 0, cam.z - center.z).normalize();
      const F = frame(center, Math.atan2(d.x, d.z));
      const rug = ctx.props.rug;
      ctx.add(rug.root); rug.root.position.copy(F(0, 0.03, 0)); rug.root.rotation.set(0, F.yaw, 0);
      rug.setFEN('8/8/8/8/8/8/8/8');
      ctx.use('cat');
      const sq = rug.squareSize || 3.0 / 8;
      // L path in board squares (knight moves): start b1 → c3 → e4 → f6
      const path = [[1, 0], [2, 2], [4, 3], [5, 5]].map(([fx, rz]) => F(-(fx - 3.5) * sq, 0.03, (rz - 3.5) * sq));
      ctx.store = { F, path };
    },
    update(ctx, lt, u) {
      const { F, path } = ctx.store;
      const cat = ctx.cast.cat;
      const t0 = ctx.time('b16.w1'), hopDur = 0.42;
      const n = path.length - 1;
      const s = clamp((ctx.t - t0) / hopDur, 0, n);
      const i = Math.min(Math.floor(s), n - 1), k = s - i;
      // knight move = 2 squares one way, then 1 square the other: do it as two short hops
      const a = path[i], b = path[i + 1];
      const corner = Math.abs(b.x - a.x) > Math.abs(b.z - a.z) ? V(b.x, a.y, a.z) : V(a.x, a.y, b.z);
      const k1 = clamp(k / 0.62, 0, 1), k2 = clamp((k - 0.62) / 0.38, 0, 1);
      const p = k < 0.62 ? a.clone().lerp(corner, ease.inOutQuad(k1)) : corner.clone().lerp(b, ease.inOutQuad(k2));
      const hopH = k < 0.62 ? Math.sin(Math.PI * k1) * 0.35 : Math.sin(Math.PI * k2) * 0.22;
      cat.root.position.copy(p).add(V(0, s < n ? hopH : 0, 0));
      const dir = (k < 0.62 ? corner.clone().sub(a) : b.clone().sub(corner));
      if (dir.lengthSq() > 1e-6 && s < n) cat.root.rotation.set(0, Math.atan2(dir.x, dir.z), 0);
      cat.pose(s >= n || s <= 0 ? 'sit' : 'hop', ctx.t, { u: k < 0.62 ? k1 : k2 });
      cat.face('neutral', ctx.t);
      ctx.cam.set({ pos: F(0.4, 3.6, 3.2), look: F(0, 0, 0), fov: 46 });
    },
  },
  // ── b17 "Day by day."
  {
    name: 'day by day', start: 'b17-0.1', set: 'room',
    setup(ctx) { ctx.store = roomNook(ctx, 'me', { lighting: 'day' }); ctx.store.cams = nookCams(ctx.store.F); },
    update(ctx, lt, u) {
      const { ch, cams } = ctx.store;
      const phase = Math.floor(lt / 0.22) % 3;
      ctx.set.setLighting?.(['day', 'night', 'dawn'][phase]);
      ctx.set.set?.('window', ['day', 'party', 'sunrise'][phase]);
      ch.pose('sitSlam', ctx.t, { hits: [0, 1, 2, 3].map((k) => ctx.time('b17') + 0.15 + k * 0.22) });
      ch.face('determined', ctx.t);
      ctx.cam.move(cams.wide, cams.med, u);
    },
  },
  // ── b18 HUSS ×6 montage (a different time of day on every hit)
  ...['face', 'board', 'faceL', 'wide', 'boardLow', 'face'].map((camName, i) => ({
    name: `huss b18 #${i + 1}`, start: i === 0 ? 'b18.h0-0.12' : `b18.h${i}-0.03`, set: 'room',
    setup(ctx) {
      ctx.store = roomNook(ctx, 'me', { lighting: ['night', 'day', 'dawn', 'night', 'day', 'dawn'][i] });
      ctx.set.set?.('window', ['party', 'day', 'sunrise', 'party', 'day', 'sunrise'][i]);
      ctx.store.cams = nookCams(ctx.store.F);
      ctx.store.practice = practiceTrack(ctx, 'b18', [['e2', 'e4'], ['g1', 'f3'], ['d2', 'd4'], ['f3', 'd4'], ['b1', 'c3'], ['c1', 'e3']],
        [['c7', 'c5'], ['d7', 'd6'], ['c5', 'd4'], ['g8', 'f6'], ['a7', 'a6'], null]);
    },
    update(ctx) {
      slamUpdate(ctx, ctx.store, ctx.store.practice);
      pressClock(ctx, ctx.store.practice.hits.map((h) => h + 0.09));
      ctx.cam.set(ctx.store.cams[camName]); ctx.cam.shake(0.09, ctx.t, 20 + i);
    },
  })),
  // ═══════════════════════════════════════════════════════════════ the Summer Party Chess Match
  // ── b19 "Then came the biggest party of the year."
  {
    name: 'square establishing', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      tourney(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 30).add(V(0, 16, 0)), look: c.clone().add(V(0, 1, 0)), fov: 44 };
      ctx.store.to = { pos: cam, look: c.clone().add(V(0, 1.5, 0)), fov: 46 };
    },
    update(ctx, lt, u) { tourneyAnim(ctx); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic); },
  },
  // ── b20 "The Summer Party Chess Match."  (push into the banner)
  {
    name: 'banner', start: 'b20-0.05', set: 'town',
    setup(ctx) {
      tourney(ctx);
      const F = frameAt(ctx, 'square.table');
      const look = ctx.anchor('square.banner') ? ctx.point('square.banner') : F(0, 3.2, -1.5);
      ctx.store.from = { pos: look.clone().add(V().copy(F.fwd).multiplyScalar(-1).multiplyScalar(0)).add(V(0, -1.2, 0)).addScaledVector(camAway(ctx, look), 9), look, fov: 46 };
      ctx.store.to = { pos: look.clone().add(V(0, -0.4, 0)).addScaledVector(camAway(ctx, look), 5.2), look, fov: 44 };
    },
    update(ctx, lt, u) { tourneyAnim(ctx); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.outCubic); },
  },
  // ── b21 "Everybody showed up in party hats."
  {
    name: 'stands pan', start: 'b21-0.05', set: 'town',
    setup(ctx) {
      tourney(ctx);
      const F = frameAt(ctx, 'square.standA');
      ctx.store.from = { pos: F(-4, 2.4, 6.5), look: F(-2, 1.8, 0), fov: 44 };
      ctx.store.to = { pos: F(4, 2.4, 6.5), look: F(2, 1.8, 0), fov: 44 };
    },
    update(ctx, lt, u) { tourneyAnim(ctx, { action: 'cheer' }); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutSine); },
  },
  // ── b22 "When I sat down, …"
  {
    name: 'hero sits down', start: 'b22-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'clap' });
      const me = ctx.cast.me, F = ctx.store.FA;
      const k = ctx.progress('b22', 'b22.w3+0.2');
      me.pose('sitStand', ctx.t, { u: 1 - k });
      me.face('neutral', ctx.t);
      ctx.cam.move({ pos: F(1.6, 1.9, 3.4), look: F(0, 1.1, 0.4), fov: 42 }, { pos: F(1.1, 1.7, 2.6), look: F(0, 1.25, 0.4), fov: 40 }, u, ease.inOutQuad);
    },
  },
  // ── "… everybody laughed."  + laugh SFX
  {
    name: 'crowd laughs', start: 'b22.w4-0.05', set: 'town',
    setup(ctx) { tourney(ctx); const F = frameAt(ctx, 'square.standA'); ctx.store.F = F; },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'laugh', face: 'laugh' });
      const F = ctx.store.F;
      ctx.cam.move({ pos: F(1.5, 2.2, 6.2), look: F(0, 2.0, 0), fov: 40 }, { pos: F(0.6, 2.3, 4.8), look: F(0, 2.1, 0), fov: 38 }, u, ease.outQuad);
      ctx.cam.shake(0.1, ctx.t, 31);
    },
  },
  // ── b23 heckler: "Who brings a chess clock to a party?"
  {
    name: 'heckler', start: 'b23-0.1', set: 'town',
    setup(ctx) { tourney(ctx); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'laugh', face: 'laugh' });
      const h = ctx.cast.heckler;
      h.pose('point', ctx.t); h.face(lt > 1.2 ? 'laugh' : 'grin', ctx.t);
      const hp = headPos(h, 0.1);
      const F = frame(h.root.position.clone(), h.root.rotation.y);
      ctx.cam.set({ pos: F(0.55, 0.95 + (hp.y - h.root.position.y) * 0.85, 1.9), look: hp, fov: 34 });
      ctx.cam.shake(0.1, ctx.t, 32);
    },
  },
  // ── b24 "My opponent?"
  {
    name: 'my opponent?', start: 'b24-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx);
      const me = ctx.cast.me; me.pose('sitIdle', ctx.t, { headYaw: 0.1 }); me.face('determined', ctx.t);
      const hp = headPos(me, 0);
      const F = ctx.store.FA;
      ctx.cam.move({ pos: F(0.5, 1.55, 1.5), look: hp, fov: 36 }, { pos: F(0.35, 1.55, 1.2), look: hp, fov: 34 }, u);
    },
  },
  // ── "The mayor."  reveal  /  "Undefeated for forty years."
  {
    name: 'the mayor', start: 'b24.w2-0.08', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx);
      const m = ctx.cast.mayor;
      m.pose('sitIdle', ctx.t); m.face(ctx.t > ctx.time('b24.w4') ? 'smug' : 'neutral', ctx.t);
      pigeonOnShoulder(ctx);
      const hp = headPos(m, 0.05);
      const F = ctx.store.FB;
      const k = ctx.progress('b24.w2', 'b25');
      ctx.cam.move({ pos: F(-0.9, 1.5, 2.9), look: hp.clone().add(V(0, -0.15, 0)), fov: 40 }, { pos: F(-0.25, 1.55, 1.25), look: hp, fov: 32 }, ease.inOutQuad(k));
    },
  },
  // ── b25 "Then I touched my first pawn."
  {
    name: 'first pawn', start: 'b25-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true, board: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx);
      const me = ctx.cast.me;
      me.pose('sitSlam', ctx.t, { hits: [ctx.time('b26.h0') + 0.03] }); me.face('determined', ctx.t);
      ctx.cast.mayor.pose('sitIdle', ctx.t); ctx.cast.mayor.face('smug', ctx.t);
      pigeonOnShoulder(ctx);
      ctx.store.match.play(ctx.props.chess, ctx.t);
      const B = ctx.store.FBoard;
      ctx.cam.move({ pos: B(0.55, 0.35, -0.55), look: B(0.05, 0.05, -0.15), fov: 36 }, { pos: B(0.35, 0.2, -0.4), look: B(0.07, 0.04, -0.15), fov: 30 }, u, ease.inOutSine);
    },
  },
  // ── b26 HUSS ×6: scholar's mate — moves land on HUSS 1,3,4,6, the clock gets slammed on 2 and 5
  ...[0, 2, 3, 5].map((hi, i) => ({
    name: `match huss #${i + 1}`, start: i === 0 ? 'b26.h0-0.12' : `b26.h${hi}-0.03`, set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true, board: true }); },
    update(ctx, lt) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked' });
      const me = ctx.cast.me, m = ctx.cast.mayor;
      const hits = ctx.hussTimes('b26').map((h) => h + 0.03);
      me.pose('sitSlam', ctx.t, { hits });
      const hit = lastBefore(hits, ctx.t);
      me.face(hit != null && ctx.t - hit < 0.16 ? 'huss' : 'determined', ctx.t);
      m.pose('sitIdle', ctx.t); m.face(i >= 2 ? 'sweat' : 'shocked', ctx.t);
      pigeonOnShoulder(ctx);
      ctx.store.match.play(ctx.props.chess, ctx.t);
      pressClock(ctx, [hits[1], hits[4]]);
      ctx.cam.punch(hits, ctx.t, 0.12, 0.18);
      const B = ctx.store.FBoard, FA = ctx.store.FA, FB = ctx.store.FB;
      if (hit != null) burstAt(ctx, B(0, 0.02, 0), ctx.t, hit);
      if (i === 0) ctx.cam.set({ pos: B(0.45, 0.32, -0.6), look: B(0.0, 0.03, -0.05), fov: 36 });
      if (i === 1) ctx.cam.set({ pos: FA(0.2, 1.55, 1.05), look: headPos(me, 0), fov: 32 });
      if (i === 2) ctx.cam.set({ pos: FB(-0.2, 1.62, 1.05), look: headPos(m, 0), fov: 30 });
      if (i === 3) ctx.cam.set({ pos: B(-0.35, 0.16, 0.5), look: B(0.15, 0.05, 0.1), fov: 38 });
      ctx.cam.shake(0.1, ctx.t, 40 + i);
    },
  })),
  // ── b27 "Checkmate."  — the king topples
  {
    name: 'checkmate', start: 'b27-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true, board: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked' });
      ctx.cast.me.pose('sitIdle', ctx.t); ctx.cast.me.face('smug', ctx.t);
      ctx.cast.mayor.pose('surprised', ctx.t); ctx.cast.mayor.face('shocked', ctx.t);
      pigeonOnShoulder(ctx);
      ctx.store.match.play(ctx.props.chess, ctx.t);
      const k = clamp((ctx.t - ctx.time('b27.w0')) / 0.7, 0, 1);
      ctx.props.chess.topple('e8', ease.outQuad(k));
      const B = ctx.store.FBoard;
      const king = ctx.props.chess.squareToLocal('e8');
      const kw = ctx.props.chess.root.localToWorld(king.clone());
      ctx.cam.move({ pos: kw.clone().add(V(0, 0.12, 0)).addScaledVector(B.fwd, -0.35).addScaledVector(B.left, 0.2), look: kw.clone().add(V(0, 0.05, 0)), fov: 32 },
        { pos: kw.clone().add(V(0, 0.1, 0)).addScaledVector(B.fwd, -0.28).addScaledVector(B.left, 0.12), look: kw.clone().add(V(0, 0.03, 0)), fov: 30 }, u);
    },
  },
  // ── "In four moves."  — wide: mayor stunned
  {
    name: 'in four moves', start: 'b27.w1-0.08', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true, board: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked' });
      ctx.cast.me.pose('sitIdle', ctx.t); ctx.cast.me.face('smug', ctx.t);
      ctx.cast.mayor.pose('stunned', ctx.t); ctx.cast.mayor.face('shocked', ctx.t);
      pigeonOnShoulder(ctx);
      ctx.store.match.play(ctx.props.chess, ctx.t);
      ctx.props.chess.topple('e8', 1);
      const B = ctx.store.FBoard;
      ctx.cam.move({ pos: B(2.6, 1.3, 0.2), look: B(0, 0.45, 0), fov: 42 }, { pos: B(2.2, 1.2, 0.2), look: B(0, 0.5, 0), fov: 40 }, u);
    },
  },
  // ── b28 "The music stopped. The whole crowd went silent."
  {
    name: 'silence', start: 'b28-0.1', set: 'town',
    setup(ctx) { tourney(ctx); ctx.store.F = frameAt(ctx, 'square.standA'); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked', still: ctx.t > ctx.markers.musicStop });
      const F = ctx.store.F;
      ctx.cam.move({ pos: F(0, 2.3, 7.5), look: F(0, 2.0, 0), fov: 44 }, { pos: F(0, 2.2, 5.0), look: F(0, 2.05, 0), fov: 40 }, u, ease.inOutSine);
    },
  },
  // ── b29 "Marcus asked me,"
  {
    name: 'marcus walks up', start: 'b29-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, standing: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked', still: true });
      const F = ctx.store.FA, mk = ctx.cast.marcus;
      const k = ease.outQuad(clamp(lt / 1.0, 0, 1));
      mk.root.position.copy(F(lerp(-2.6, -1.1, k), 0, 1.2)); mk.root.rotation.set(0, F.yaw + Math.PI * 0.62, 0);
      mk.pose(k < 1 ? 'walk' : 'idle', ctx.t); mk.face('shocked', ctx.t);
      ctx.cast.me.pose('idle', ctx.t); ctx.cast.me.face('neutral', ctx.t);
      ctx.cam.set({ pos: F(0.6, 1.7, 4.4), look: F(-0.9, 1.4, 0.8), fov: 40 });
    },
  },
  // ── b30 Marcus: "When did you get so good?"
  {
    name: 'marcus asks', start: 'b30-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, standing: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked', still: true });
      const F = ctx.store.FA, mk = ctx.cast.marcus;
      mk.root.position.copy(F(-1.1, 0, 1.2)); mk.root.rotation.set(0, F.yaw + Math.PI * 0.62, 0);
      mk.pose('shrug', ctx.t); mk.face('shocked', ctx.t);
      ctx.cast.me.pose('idle', ctx.t); ctx.cast.me.face('neutral', ctx.t);
      const hp = headPos(mk, 0);
      const MF = frame(mk.root.position.clone(), mk.root.rotation.y);
      ctx.cam.move({ pos: MF(0.35, 1.55, 1.6), look: hp, fov: 36 }, { pos: MF(0.25, 1.55, 1.25), look: hp, fov: 33 }, u);
    },
  },
  // ── b31 "I told him the truth."  /  b32 "While you were out partying."
  {
    name: 'the truth', start: 'b31-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, standing: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked', still: true });
      const F = ctx.store.FA, me = ctx.cast.me;
      const mk = ctx.cast.marcus; mk.root.position.copy(F(-1.1, 0, 1.2)); mk.root.rotation.set(0, F.yaw + Math.PI * 0.62, 0);
      mk.pose('idle', ctx.t); mk.face('shocked', ctx.t);
      me.pose('idle', ctx.t, { headYaw: ctx.t < ctx.time('b32') ? 0.5 : 0.1 });
      me.face(ctx.t < ctx.time('b32') ? 'neutral' : 'smug', ctx.t);
      const hp = headPos(me, 0);
      const k = ctx.progress('b31', 'b33');
      ctx.cam.move({ pos: F(0.4, 1.75, 2.2), look: hp, fov: 38 }, { pos: F(0.12, 1.85, 1.05), look: hp, fov: 30 }, ease.inOutQuad(k));
    },
  },
  // ═══════════════════════════════════════════════════════════════ the next night
  // ── b33 "The next night, something was wrong."
  {
    name: 'quiet walk', start: 'b33-0.1', set: 'town',
    setup(ctx) {
      quietTown(ctx);
      const F = frameAt(ctx, 'street.center');
      ctx.use('me'); ctx.store = { F };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store; const me = ctx.cast.me;
      const z = lerp(-3, 1.5, u);
      me.root.position.copy(F(0, 0, z)); me.root.rotation.set(0, F.yaw, 0);
      me.pose(ctx.t < ctx.time('b33.w5') ? 'walk' : 'idle', ctx.t, { headYaw: Math.sin(ctx.t * 1.3) * 0.4 });
      me.face(ctx.t < ctx.time('b33.w3') ? 'neutral' : 'sad', ctx.t);
      ctx.cam.set({ pos: F(1.6, 1.9, z + 4.2), look: F(0, 1.3, z), fov: 44 });
    },
  },
  // ── b34 "No music."  /  "No party lights."  /  "Nothing."
  {
    name: 'no music', start: 'b34-0.1', set: 'town',
    setup(ctx) {
      quietTown(ctx);
      const F = frameAt(ctx, 'street.center');
      ctx.add(ctx.props.speaker.root); ctx.props.speaker.root.position.copy(F(1.4, 0, 1)); ctx.props.speaker.root.rotation.set(0, F.yaw + 0.4, 0);
      ctx.store = { F };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store;
      ctx.props.speaker.update?.(0);
      ctx.cam.move({ pos: F(2.4, 1.0, 2.6), look: F(1.4, 0.6, 1), fov: 38 }, { pos: F(2.1, 0.95, 2.2), look: F(1.4, 0.6, 1), fov: 36 }, u);
    },
  },
  {
    name: 'no party lights', start: 'b34.w2-0.08', set: 'town',
    setup(ctx) { quietTown(ctx); ctx.store = { F: frameAt(ctx, 'street.center') }; },
    update(ctx, lt, u) {
      const { F } = ctx.store;
      ctx.cam.move({ pos: F(0, 1.6, 4), look: F(0, 6, -6), fov: 50 }, { pos: F(0, 1.6, 3.5), look: F(0, 6.5, -7), fov: 48 }, u);
    },
  },
  {
    name: 'nothing', start: 'b34.w5-0.08', set: 'town',
    setup(ctx) {
      quietTown(ctx); const F = frameAt(ctx, 'street.center');
      ctx.use('me'); ctx.cast.me.root.position.copy(F(0, 0, 1.5)); ctx.cast.me.root.rotation.set(0, F.yaw, 0);
      ctx.store = { F };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store;
      ctx.cast.me.pose('idle', ctx.t); ctx.cast.me.face('sad', ctx.t);
      ctx.cam.move({ pos: F(0, 9, 16), look: F(0, 0.5, 0), fov: 44 }, { pos: F(0, 10, 18), look: F(0, 0.5, 0), fov: 44 }, u);
    },
  },
  // ── b35 "Then I heard it. From every single window."
  {
    name: 'heard it', start: 'b35-0.1', set: 'town',
    setup(ctx) {
      quietTown(ctx); const F = frameAt(ctx, 'street.center');
      ctx.use('me'); ctx.cast.me.root.position.copy(F(0, 0, 1.5)); ctx.cast.me.root.rotation.set(0, F.yaw, 0);
      ctx.store = { F };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store; const me = ctx.cast.me;
      const look = ctx.t > ctx.time('b35.w4');
      me.pose('idle', ctx.t, { headPitch: look ? -0.35 : 0, headYaw: look ? 0.6 : 0 }); me.face('shocked', ctx.t);
      const hp = headPos(me, 0);
      if (!look) ctx.cam.move({ pos: F(0.3, 1.7, 2.9), look: hp, fov: 36 }, { pos: F(0.25, 1.7, 2.6), look: hp, fov: 34 }, ctx.progress('b35', 'b35.w4'));
      else ctx.cam.move({ pos: F(-0.6, 1.2, 2.6), look: F(2, 2.5, 0), fov: 46 }, { pos: F(-0.6, 1.2, 2.6), look: F(5, 5, -2), fov: 46 }, ease.inOutQuad(ctx.progress('b35.w4', 'b36')));
    },
  },
  // ── b36 HUSS ×5 from every window — windows light up one by one
  ...[0, 1].map((part) => ({
    name: `windows huss ${part + 1}`, start: part === 0 ? 'b36.h0-0.1' : 'b36.h3-0.1', set: 'town',
    setup(ctx) {
      quietTown(ctx);
      const houses = ctx.anchor('houses') || [];
      ctx.store = { houses, F: frameAt(ctx, 'street.center') };
    },
    update(ctx) {
      const hs = ctx.hussTimes('b36');
      const n = hs.filter((h) => h <= ctx.t + 0.02).length;
      ctx.set.set?.('windowGlow', (hi, wi) => (((hi * 3 + wi * 5) % 7) < n + (n >= 5 ? 2 : 0) ? 1 : 0.06));
      const F = ctx.store.F;
      ctx.cam.punch(hs, ctx.t, 0.07, 0.25);
      if (part === 0) ctx.cam.move({ pos: F(-2, 2.2, 6), look: F(3, 3, -2), fov: 52 }, { pos: F(-1.4, 2.4, 5.2), look: F(3, 3.2, -2), fov: 50 }, ctx.progress('b36.h0', 'b36.h3'));
      else ctx.cam.move({ pos: F(0, 7, 14), look: F(0, 2.5, -4), fov: 52 }, { pos: F(0, 8, 16), look: F(0, 2.5, -4), fov: 52 }, ctx.progress('b36.h3', 'b37'));
    },
  })),
  // ── b37–b40 the neighbours, grinding
  neighbourShot('marcus at night', 'b37-0.1', 'roomMarcus', 'marcus', 'determined'),
  neighbourShot('brenda at night', 'b38-0.1', 'roomBrenda', 'brenda', 'determined'),
  {
    name: 'grandad blindfold?', start: 'b39-0.1', set: 'roomGrandad',
    setup(ctx) { ctx.store = roomNook(ctx, 'grandad', { lighting: 'night', clock: false }); ctx.store.cams = nookCams(ctx.store.F); ctx.cast.grandad.setAccessory?.('glasses', false); },
    update(ctx, lt, u) {
      const { ch, F } = ctx.store;
      ch.pose('peer', ctx.t); ch.face('squint', ctx.t);
      ctx.props.chess.setFEN('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R');
      ctx.cam.move({ pos: F(0.9, 1.6, 2.3), look: F(0, 1.1, 0.4), fov: 40 }, { pos: F(0.5, 1.5, 1.7), look: F(0, 1.25, 0.35), fov: 38 }, u);
    },
  },
  {
    name: 'lost his glasses', start: 'b40-0.1', set: 'roomGrandad',
    setup(ctx) { ctx.store = roomNook(ctx, 'grandad', { lighting: 'night', clock: false }); ctx.cast.grandad.setAccessory?.('glasses', false); glassesOnHead(ctx); },
    update(ctx, lt, u) {
      const { ch, F } = ctx.store;
      ch.pose('peer', ctx.t); ch.face('squint', ctx.t);
      ctx.props.chess.setFEN('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R');
      const hp = headPos(ch, 0.1);
      ctx.cam.move({ pos: F(0.3, 1.75, 1.2), look: hp, fov: 34 }, { pos: F(0.2, 1.8, 0.95), look: hp, fov: 30 }, u);
    },
  },
  // ═══════════════════════════════════════════════════════════════ ending
  // ── b41 "The whole town is grinding now. Which is great."
  {
    name: 'grinding town', start: 'b41-0.1', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
      const F = frameAt(ctx, 'street.center');
      ctx.use('me');
      const joggers = EXTRA_IDS.slice(0, 6);
      joggers.forEach((id, i) => ctx.use(id));
      ctx.store = { F, joggers };
    },
    update(ctx, lt, u) {
      const { F, joggers } = ctx.store;
      joggers.forEach((id, i) => {
        const ch = ctx.cast[id];
        const z = -8 + ((ctx.t * 1.6 + i * 2.7) % 16);
        ch.root.position.copy(F(i % 2 ? 2.4 : -2.4, 0, i % 2 ? -z : z)); ch.root.rotation.set(0, F.yaw + (i % 2 ? Math.PI : 0), 0);
        ch.pose('walk', ctx.t + i, { speed: 1.6 }); ch.face('determined', ctx.t);
      });
      const me = ctx.cast.me; me.root.position.copy(F(0, 0, lerp(-1, 1, u))); me.root.rotation.set(0, F.yaw, 0);
      me.pose('walk', ctx.t); me.face(ctx.t > ctx.time('b41.w6') ? 'grin' : 'smile', ctx.t);
      ctx.cam.move({ pos: F(0, 6, 12), look: F(0, 1, 0), fov: 46 }, { pos: F(0, 3, 6), look: F(0, 1.3, 0), fov: 42 }, u, ease.inOutCubic);
    },
  },
  // ── b42 "Except now, nobody has time to play me."
  {
    name: 'alone in the park', start: 'b42-0.1', set: 'town',
    setup(ctx) { park(ctx); },
    update(ctx, lt, u) {
      parkAnim(ctx, { pigeon: false });
      const me = ctx.cast.me; me.pose('sitIdle', ctx.t); me.face('sad', ctx.t);
      const F = ctx.store.FT;
      ctx.cam.move({ pos: F(1.5, 1.6, -3.0), look: F(0, 0.9, 0), fov: 42 }, { pos: F(1.1, 1.5, -2.4), look: F(0, 1.0, 0), fov: 40 }, u);
    },
  },
  // ── b43 "So my only opponent is the mayor's pigeon."
  {
    name: 'pigeon opponent', start: 'b43.w3-0.08', set: 'town',
    setup(ctx) { park(ctx, { pigeon: true }); },
    update(ctx, lt, u) {
      parkAnim(ctx, { pigeon: true });
      const me = ctx.cast.me; me.pose('sitIdle', ctx.t); me.face('neutral', ctx.t);
      const pg = ctx.cast.pigeon; pg.pose('idle', ctx.t); pg.face('smug', ctx.t);
      const F = ctx.store.FT;
      const pp = pg.root.position.clone().add(V(0, 0.2, 0));
      ctx.cam.move({ pos: F(0.35, 1.45, -1.4), look: pp, fov: 40 }, { pos: F(0.25, 1.3, -1.0), look: pp, fov: 32 }, u, ease.inOutQuad);
    },
  },
  // ── b44 "He knocks over all the pieces, struts around the board..."
  {
    name: 'pigeon chaos', start: 'b44-0.1', set: 'town',
    setup(ctx) { park(ctx, { pigeon: true }); },
    update(ctx, lt, u) {
      parkAnim(ctx, { pigeon: true });
      const pg = ctx.cast.pigeon, F = ctx.store.FT, chess = ctx.props.chess;
      const tK = ctx.time('b44.w1'), tS = ctx.time('b44.w6');
      chess.reset();
      chess.knockAll(clamp((ctx.t - tK) / 0.8, 0, 1), 7);
      if (ctx.t < tS) { pg.pose(ctx.t > tK - 0.1 && ctx.t < tK + 0.6 ? 'knock' : 'idle', ctx.t); pg.root.position.copy(F(0.0, TABLE_TOP + 0.0, 0.3)); }
      else {
        const k = (ctx.t - tS) * 0.35;
        pg.root.position.copy(F(Math.sin(k * 2.2) * 0.18, TABLE_TOP + 0.0, Math.cos(k * 2.2) * 0.14));
        pg.root.rotation.set(0, F.yaw + Math.PI + k * 2.2 + Math.PI / 2, 0);
        pg.pose('strut', ctx.t);
      }
      pg.face('smug', ctx.t);
      ctx.cast.me.pose('sitIdle', ctx.t); ctx.cast.me.face('shocked', ctx.t);
      ctx.cam.move({ pos: F(0.9, 1.55, 1.1), look: F(0, TABLE_TOP + 0.1, 0), fov: 42 }, { pos: F(0.7, 1.35, 0.9), look: F(0, TABLE_TOP + 0.15, 0), fov: 40 }, u);
    },
  },
  // ── b45 "and honestly?"  /  "I think he's winning."
  {
    name: 'honestly?', start: 'b45-0.1', set: 'town',
    setup(ctx) { park(ctx, { pigeon: true }); },
    update(ctx, lt, u) {
      parkAnim(ctx, { pigeon: true });
      const me = ctx.cast.me; me.pose('sitIdle', ctx.t, { headYaw: -0.25 }); me.face('sweat', ctx.t);
      ctx.props.chess.reset(); ctx.props.chess.knockAll(1, 7);
      const F = ctx.store.FS;
      const hp = headPos(me, 0);
      ctx.cam.move({ pos: F(0.3, 1.55, 1.3), look: hp, fov: 34 }, { pos: F(0.2, 1.55, 1.05), look: hp, fov: 31 }, u);
      const pg = ctx.cast.pigeon; pg.pose('strut', ctx.t); pg.face('smug', ctx.t);
    },
  },
  {
    name: 'winning', start: 'b45.w2-0.08', set: 'town',
    setup(ctx) { park(ctx, { pigeon: true }); },
    update(ctx, lt, u) {
      parkAnim(ctx, { pigeon: true });
      const pg = ctx.cast.pigeon, F = ctx.store.FT;
      ctx.props.chess.reset(); ctx.props.chess.knockAll(1, 7);
      pg.root.position.copy(F(0.05, TABLE_TOP, 0.0)); pg.root.rotation.set(0, F.yaw + Math.PI, 0);
      pg.pose('strut', ctx.t); pg.face('smug', ctx.t);
      ctx.cast.me.pose('sitIdle', ctx.t); ctx.cast.me.face('sad', ctx.t);
      ctx.cam.move({ pos: F(-1.6, 1.6, 0.6), look: F(0, 0.95, 0), fov: 44 }, { pos: F(-1.3, 1.5, 0.5), look: F(0, 1.0, 0), fov: 42 }, u);
    },
  },
  // ── b46 the pigeon: "HUSS!"
  {
    name: 'pigeon huss', start: 'b46.h0-0.35', set: 'town',
    setup(ctx) { park(ctx, { pigeon: true }); },
    update(ctx, lt, u) {
      parkAnim(ctx, { pigeon: true });
      const pg = ctx.cast.pigeon, F = ctx.store.FT;
      ctx.props.chess.reset(); ctx.props.chess.knockAll(1, 7);
      pg.root.position.copy(F(0.0, TABLE_TOP, 0.05)); pg.root.rotation.set(0, F.yaw + Math.PI, 0);
      const hs = ctx.hussTimes('b46'), h = hs[0];
      const last = lastBefore(hs, ctx.t + 0.05);
      pg.pose(last != null ? 'huss' : 'idle', ctx.t, { hits: hs }); pg.face(last != null && ctx.t - last < 0.17 ? 'huss' : 'smug', ctx.t);
      const pp = pg.root.position.clone().add(V(0, 0.22, 0));
      const back = V().copy(F.fwd).multiplyScalar(-1);
      ctx.cam.set({ pos: pp.clone().addScaledVector(back, 0.75).add(V(0, 0.05, 0)), look: pp, fov: 34 });
      ctx.cam.punch(hs, ctx.t, 0.14, 0.2);
    },
  },
];

// ───────────────────────────────────────────────────────────────────────── shot-group helpers
function neighbourShot(name, start, set, who, face) {
  return {
    name, start, set,
    setup(ctx) {
      ctx.store = roomNook(ctx, who, { lighting: 'night' });
      ctx.store.cams = nookCams(ctx.store.F);
      const t0 = ctx.time(start.split('-')[0]);
      const hits = [0.35, 0.75, 1.1].map((x) => t0 + x);
      ctx.store.practice = { hits, track: moveTrack([{ from: 'e2', to: 'e4', at: hits[0] }, { from: 'e7', to: 'e5', at: hits[0] + 0.2, noSlam: true }, { from: 'g1', to: 'f3', at: hits[1] }, { from: 'b8', to: 'c6', at: hits[1] + 0.2, noSlam: true }, { from: 'f1', to: 'c4', at: hits[2] }]) };
    },
    update(ctx, lt, u) {
      slamUpdate(ctx, ctx.store, ctx.store.practice, { face, burst: false });
      const { cams } = ctx.store;
      ctx.cam.move(cams.med, cams.face, u, ease.inOutQuad);
    },
  };
}

function glassesOnHead(ctx) {
  // Move grandad's glasses up onto his forehead if the character exposes them; otherwise skip.
  const g = ctx.cast.grandad;
  const node = g.accessories?.glasses || g.root.getObjectByName?.('glasses');
  if (node) { g.setAccessory?.('glasses', true); node.position.y += 0.2; node.rotation.x = -0.3; }
}

function camAway(ctx, from) {
  const c = ctx.point('square.cam1');
  return V(c.x - from.x, 0, c.z - from.z).normalize();
}

/** Town square at dusk, crowd in party hats in the stands, optional hero / mayor / board at the table. */
function tourney(ctx, { hero = false, mayor = false, board = false, standing = false } = {}) {
  ctx.set.setLighting?.('dusk');
  ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  const st = ctx.store = {};
  // stands: main characters front row of stand A, extras fill the rest
  const front = ['marcus', 'brenda', 'grandad', 'heckler'];
  const rowsA = ctx.anchor('square.standA.rows'), rowsB = ctx.anchor('square.standB.rows');
  const crowd = [];
  const fill = (rows, ids, startK) => {
    if (!Array.isArray(rows) || !rows.length) return;
    let k = 0;
    rows.forEach((row, r) => {
      const w = row.userData?.width || 8;
      const per = Math.max(1, Math.floor(w / 1.0));
      for (let j = 0; j < per && k < ids.length; j++, k++) {
        const id = ids[k];
        const x = (j - (per - 1) / 2) * (w / per);
        ctx.place(id, row, { offset: [x + (hash(k + startK) - 0.5) * 0.2, 0, 0] });
        ctx.cast[id].setAccessory?.('partyHat', true);
        crowd.push({ ch: ctx.cast[id], phase: hash(k * 3.1 + startK) * 3, k: k + startK });
      }
    });
  };
  const idsA = [...(standing ? ['brenda', 'grandad', 'heckler'] : front), ...EXTRA_IDS.slice(0, 10)];
  fill(rowsA, idsA, 0);
  fill(rowsB, EXTRA_IDS.slice(10, 18), 50);
  st.crowd = crowd;
  ['marcus', 'brenda', 'grandad'].forEach((id) => ctx.cast[id].setAccessory?.('partyHat', true));
  const ca = ctx.anchor('square.chairA'), cb = ctx.anchor('square.chairB');
  st.FA = frame(rel(ca), yawOf(ca)); st.FB = frame(rel(cb), yawOf(cb));
  const tbl = ctx.anchor('square.table');
  st.FBoard = frame(rel(tbl), yawOf(ca));
  if (hero) {
    ctx.place('me', ca);
    if (standing) { ctx.cast.me.root.position.copy(st.FA(0.3, 0, 0.35)); ctx.cast.me.root.rotation.set(0, st.FA.yaw + 0.9, 0); }
  }
  if (standing) { ctx.use('marcus'); }
  if (mayor) { ctx.place('mayor', cb); }
  if (board || hero) {
    const chess = ctx.props.chess;
    ctx.add(chess.root); chess.root.position.copy(rel(tbl, [0, ctx.props.boardThick, 0])); chess.root.rotation.set(0, yawOf(ca), 0);
    chess.reset();
    ctx.add(ctx.props.clock.root); ctx.props.clock.root.position.copy(st.FBoard(-0.48, 0, 0)); ctx.props.clock.root.rotation.set(0, yawOf(ca) + Math.PI / 2, 0);
    const all = ctx.hussTimes('b26').map((h) => h + 0.03);
    const hs = [all[0], all[2], all[3], all[5]];
    const W = [['e2', 'e4'], ['d1', 'h5'], ['f1', 'c4'], ['h5', 'f7']];
    const Bk = [['e7', 'e5'], ['b8', 'c6'], ['g8', 'f6']];
    const moves = [];
    hs.forEach((h, i) => { moves.push({ from: W[i][0], to: W[i][1], at: h, dur: 0.14 }); if (Bk[i]) moves.push({ from: Bk[i][0], to: Bk[i][1], at: h + 0.12, dur: 0.05, noSlam: true }); });
    st.match = moveTrack(moves);
  }
}

function tourneyAnim(ctx, { action = null, face = null, still = false } = {}) {
  const t = still ? ctx.markers.musicStop : ctx.t;
  animateCrowd(ctx.store.crowd, t, {
    action: action || null,
    faces: face ? [face] : ['grin', 'laugh', 'smile'],
    params: still ? { intensity: 0 } : {},
  });
  if (!action) ctx.store.crowd.forEach((c) => c.ch.pose(c.k % 2 ? 'cheer' : 'clap', t + c.phase));
}

function pigeonOnShoulder(ctx) {
  const pg = ctx.cast.pigeon, m = ctx.cast.mayor;
  if (pg.root.parent !== m.joints.torso) ctx.add(pg.root, m.joints.torso);
  pg.root.position.set(0.32, 0.62, 0.02); pg.root.rotation.set(0, 0.3, 0); pg.root.scale.setScalar(0.85);
  pg.pose('idle', ctx.t); pg.face('smug', ctx.t);
}

function quietTown(ctx) {
  ctx.set.setLighting?.('quiet_night');
  ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('windowGlow', 0.06);
}

function park(ctx, { pigeon = false } = {}) {
  ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  const s1 = ctx.anchor('park.stool1'), tbl = ctx.anchor('park.table');
  const FS = frame(rel(s1), yawOf(s1));
  const FT = frame(rel(tbl, [0, -TABLE_TOP, 0]), yawOf(s1));   // origin at floor under the table centre, facing like the hero
  ctx.store = { FS, FT };
  ctx.place('me', s1);
  const chess = ctx.props.chess;
  ctx.add(chess.root); chess.root.position.copy(rel(tbl, [0, ctx.props.boardThick, 0])); chess.root.rotation.set(0, yawOf(s1), 0);
  chess.reset();
  if (pigeon) {
    const pg = ctx.cast.pigeon;
    ctx.place(pg, FT(0, TABLE_TOP, 0.3)); pg.root.rotation.set(0, yawOf(s1) + Math.PI, 0);
  }
  const walkers = EXTRA_IDS.slice(12, 16);
  walkers.forEach((id) => ctx.use(id));
  ctx.store.walkers = walkers;
}

function parkAnim(ctx) {
  const F = ctx.store.FT;
  ctx.store.walkers.forEach((id, i) => {
    const ch = ctx.cast[id];
    const x = -7 + ((ctx.t * 1.3 + i * 3.4) % 14);
    ch.root.position.copy(F(i % 2 ? x : -x, 0, 4.5 + i * 0.6)); ch.root.rotation.set(0, F.yaw + (i % 2 ? -Math.PI / 2 : Math.PI / 2), 0);
    ch.pose('walk', ctx.t + i, { speed: 1.5 }); ch.face('determined', ctx.t);
  });
}
