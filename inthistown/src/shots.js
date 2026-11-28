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
  P.chess = makeChessSet({ size: 0.62, filesAlong: '-x' });   // real-chess handedness from the hero's side
  P.rug = makeChessSet({ size: 3.0, filesAlong: '-x' });         // giant board on the floor for the cat's L-hops
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
  P.confetti = makeConfetti({ count: 160, t0: 0, origin: [0, 0, 0], speed: 4.5, groundY: -0.8 });
  P.splash = makeConfetti({ count: 90, t0: 0, origin: [0, 0, 0], speed: 4, spread: 0.5, colors: ['#bfe9ff', '#ffffff', '#7fd3ff', '#e6f7ff'], groundY: -0.2, life: 1.2 });
  P.car = makeCar('#ff4fa3');
  P.tumbleweed = makeTumbleweed();
  P.boardThick = P.chess.thickness || 0;   // chess root = board top surface; root goes at table top + thickness
}

// ───────────────────────────────────────────────────────────────────────────── gag props
function makeCar(color) {
  const g = new THREE.Group();
  const m = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
  const box = (w, h, d, c, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(c)); b.position.set(x, y, z); b.castShadow = true; g.add(b); };
  box(1.9, 0.5, 0.95, color, 0, 0.45, 0); box(1.0, 0.45, 0.85, color, -0.1, 0.92, 0); box(0.95, 0.36, 0.87, '#bfe9ff', -0.1, 0.92, 0);
  for (const [x, z] of [[0.6, 0.48], [-0.6, 0.48], [0.6, -0.48], [-0.6, -0.48]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 12), m('#1d1d22')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.22, z); g.add(w);
  }
  return g;
}
function makeTumbleweed() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), new THREE.MeshStandardMaterial({ color: '#a07a45', wireframe: true })));
  const g2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), new THREE.MeshStandardMaterial({ color: '#8a6534', wireframe: true }));
  g2.rotation.set(0.5, 0.3, 0.2); g.add(g2);
  return g;
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
  ctx.add(P.chair); P.chair.position.copy(F(0, 0, -0.02)); P.chair.rotation.set(0, yaw, 0);
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
    wide: { pos: F(0.0, 1.8, 4.4), look: F(0, 1.05, 0.25), fov: 42 },
    med: { pos: F(0.8, 1.7, 2.9), look: F(0, 1.2, 0.35), fov: 40 },
    face: { pos: F(0.4, 1.62, 2.0), look: F(0, 1.42, 0.1), fov: 36 },
    faceL: { pos: F(-0.7, 1.58, 1.85), look: F(0, 1.42, 0.1), fov: 36 },
    board: { pos: F(0.8, 1.2, 0.75), look: F(0.0, 0.82, 0.6), fov: 40 },
    boardLow: { pos: F(0.55, 0.98, 1.35), look: F(-0.05, 0.84, 0.55), fov: 40 },
    top: { pos: F(0.2, 2.1, 1.25), look: F(0, 0.78, 0.6), fov: 45 },
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
  // ── b01 "In this town, everybody goes out partying."  (+ a breakdancer and a T-poser in the crowd)
  {
    name: 'party town crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      ctx.store = { crowd: crowdGrid(ctx, [...PARTY_A, ...PARTY_B], 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 2 }) };
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh');
      const d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store.from = { pos: hi, look: c.clone().add(V(0, 0.5, 0)), fov: 50 };
      ctx.store.to = { pos: c.clone().addScaledVector(d, 9).add(V(0, 3.2, 0)), look: ctx.point('street.crowdA').add(V(0, 1.2, 0)), fov: 42 };
      ctx.store.bdBase = ctx.store.crowd[2] ? ctx.store.crowd[2].ch.root.position.clone() : null;
    },
    update(ctx, lt, u) {
      animateCrowd(ctx.store.crowd, ctx.t);
      gagBreakdance(ctx, ctx.store.crowd[2]?.ch, ctx.store.bdBase);
      gagTPose(ctx.store.crowd[7]?.ch);
      ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic);
    },
  },
  // ── b02 "Except me."  → vine boom zoom
  {
    name: 'except me', start: 'b02-0.1', set: 'room',
    setup(ctx) { ctx.store = roomNook(ctx); ctx.store.cams = nookCams(ctx.store.F); },
    update(ctx, lt, u) {
      const { ch, cams, F } = ctx.store;
      const tb = ctx.markers.boomExcept;
      ch.pose('sitIdle', ctx.t); ch.face(ctx.t > tb - 0.1 ? 'determined' : 'neutral', ctx.t);
      boomCam(ctx, tb, cams.med, { pos: F(0.15, 1.55, 1.45), look: F(0, 1.48, 0.1), fov: 34 });
    },
  },
  // ── b03 HUSS ×6 — cut on every HUSS
  ...['board', 'face', 'boardLow', 'med', 'faceL', 'board'].map((camName, i) => ({
    name: `huss b03 #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) {
      ctx.store = roomNook(ctx); ctx.store.cams = nookCams(ctx.store.F);
      ctx.store.practice = practiceTrack(ctx, 'b03', [['e2', 'e4'], ['g1', 'f3'], ['f1', 'c4'], ['c2', 'c3'], ['d2', 'd4'], ['e1', 'g1']],
        [['e7', 'e5'], ['b8', 'c6'], ['f8', 'c5'], ['g8', 'f6'], ['e5', 'd4'], null]);
    },
    update(ctx) {
      slamUpdate(ctx, ctx.store, ctx.store.practice);
      pressClock(ctx, ctx.store.practice.hits.map((h) => h + 0.09));
      ctx.cam.set(ctx.store.cams[camName]); ctx.cam.shake(0.08, ctx.t, i);
    },
  })),
  // ── b04 "Pool parties."  (+ someone backflips into the pool)
  {
    name: 'pool party', start: 'b04-0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const crowd = [];
      EXTRA_IDS.slice(0, 7).forEach((id, i) => {
        const ch = ctx.cast[id];
        ctx.place(ch, `pool.edge${(i % 4) + 1}`, { offset: [(Math.floor(i / 4) - 0.5) * 1.3, 0, 0], yaw: Math.PI + (hash(i) - 0.5) });
        ch.setAccessory?.('partyHat', i % 2 === 0);
        crowd.push({ ch, phase: hash(i + 3) * 2, k: i });
      });
      ctx.place('x08', 'pool.edge1', { offset: [1.2, 0, 0], yaw: Math.PI });
      const c = ctx.point('pool.center'), cam = ctx.point('pool.cam');
      ctx.store = { crowd, c, from: { pos: cam, look: c.clone().add(V(0, 0.6, 0)), fov: 46 }, to: { pos: cam.clone().lerp(c, 0.25).add(V(0, -0.3, 0)), look: c.clone().add(V(0, 0.8, 0)), fov: 44 } };
      ctx.store.e1 = ctx.cast.x08.root.position.clone();
      ctx.store.yaw1 = ctx.cast.x08.root.rotation.y;
      const sp = ctx.props.splash; ctx.add(sp.root); sp.root.position.copy(c).add(V(0, 0.05, 0));
    },
    update(ctx, lt, u) {
      animateCrowd(ctx.store.crowd, ctx.t, { faces: ['grin', 'laugh', 'smile'] });
      // backflip: from the deck edge into the middle of the pool
      const flipper = ctx.cast.x08, t0 = ctx.time('b04') + 0.1, k = clamp((ctx.t - t0) / 0.75, 0, 1);
      const a = ctx.store.e1, b = ctx.store.c;
      flipper.root.position.copy(a.clone().lerp(b, k)).add(V(0, Math.sin(Math.PI * k) * 2.2 - (k > 0.85 ? (k - 0.85) * 8 : 0), 0));
      flipper.root.rotation.set(-Math.PI * 2 * ease.inOutQuad(k), ctx.store.yaw1, 0, 'YXZ');
      flipper.pose(k > 0 && k < 1 ? 'cheer' : 'idle', ctx.t); flipper.face('laugh', ctx.t);
      flipper.root.visible = k < 0.97;
      ctx.props.splash.update(ctx.t - (t0 + 0.72));
      ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.outQuad);
    },
  },
  // ── "Foam parties."  (+ a car flies over)
  {
    name: 'foam party', start: 'b04.w2-0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      ctx.set.set?.('foam', 1);
      ctx.store = { crowd: crowdGrid(ctx, EXTRA_IDS.slice(6, 16), 'foam.center', { cols: 4, dx: 1.2, dz: 1.2, seed: 9, hats: true }) };
      const c = ctx.point('foam.center'), cam = ctx.point('foam.cam');
      ctx.store.c = c; ctx.store.cam = cam;
      ctx.store.from = { pos: cam, look: c.clone().add(V(0, 0.9, 0)), fov: 48 };
      ctx.store.to = { pos: cam.clone().lerp(c, 0.12).add(V(0, 0.4, 0)), look: c.clone().add(V(0, 1.6, 0)), fov: 48 };
      ctx.add(ctx.props.car);
    },
    update(ctx, lt, u) {
      animateCrowd(ctx.store.crowd, ctx.t, { action: 'cheer', faces: ['laugh', 'grin'] });
      const { c, cam } = ctx.store;
      const fwd = V().subVectors(c, cam).setY(0).normalize();
      const across = V(fwd.z, 0, -fwd.x);
      const k = clamp(lt / 1.6, 0, 1);
      ctx.props.car.position.copy(c).addScaledVector(across, lerp(-12, 12, k)).add(V(0, 5 + Math.sin(Math.PI * k) * 2, 0)).addScaledVector(fwd, 6);
      ctx.props.car.rotation.set(k * 5, k * 7, k * 3);
      ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.outQuad);
    },
  },
  // ── b05 "Even a birthday party for the mayor's pigeon."  → vine boom on the pigeon
  {
    name: 'pigeon birthday', start: 'b05-0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'park.table');
      const { cake } = ctx.props;
      ctx.add(cake.root); cake.root.position.copy(F(0.12, 0, -0.05)); cake.root.rotation.set(0, F.yaw, 0);
      const pg = ctx.cast.pigeon;
      ctx.place(pg, F(-0.18, 0, 0.0)); pg.root.rotation.set(0, F.yaw + 0.25, 0);
      pg.setAccessory?.('partyHat', true);
      ctx.place('mayor', F(0, -0.78, -1.1)); ctx.cast.mayor.root.rotation.set(0, F.yaw, 0);
      ctx.place('x03', F(-1.1, -0.78, -0.8)); ctx.cast.x03.root.rotation.set(0, F.yaw + 0.4, 0); ctx.cast.x03.setAccessory?.('partyHat', true);
      ctx.place('x07', F(1.1, -0.78, -0.8)); ctx.cast.x07.root.rotation.set(0, F.yaw - 0.4, 0); ctx.cast.x07.setAccessory?.('partyHat', true);
      ctx.store = { F };
    },
    update(ctx, lt, u) {
      const { F } = ctx.store;
      const tb = ctx.markers.boomPigeon;
      ctx.props.cake.update(ctx.t);
      ctx.cast.mayor.pose('clap', ctx.t); ctx.cast.mayor.face('grin', ctx.t);
      ctx.cast.x03.pose('cheer', ctx.t + 0.4); ctx.cast.x03.face('laugh', ctx.t);
      ctx.cast.x07.pose('clap', ctx.t + 0.2); ctx.cast.x07.face('smile', ctx.t);
      ctx.cast.pigeon.pose('idle', ctx.t, { headYaw: ctx.t > tb ? 0 : 0.4 }); ctx.cast.pigeon.face(ctx.t > tb - 0.05 ? 'smug' : 'smile', ctx.t);
      if (ctx.t < tb) ctx.cam.move({ pos: F(0.4, 1.4, 2.6), look: F(0, 0.35, -0.3), fov: 44 }, { pos: F(0.15, 0.8, 1.7), look: F(-0.1, 0.3, -0.1), fov: 42 }, ease.inOutQuad(clamp(lt / (tb - ctx.time('b05')), 0, 1)));
      else boomCam(ctx, tb, { pos: F(0.15, 0.8, 1.7), look: F(-0.1, 0.3, -0.1), fov: 42 }, { pos: F(-0.12, 0.33, 0.62), look: F(-0.17, 0.3, 0), fov: 34 });
    },
  },
  // ── b06 "My grandad crowd-surfs on Wednesdays."  (+ air horn)
  {
    name: 'grandad crowd surf', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const F = frameAt(ctx, 'street.crowdB');
      const crowd = [];
      [...PARTY_A, ...PARTY_B].slice(0, 14).forEach((id, i) => {
        const row = i % 2, col = Math.floor(i / 2);
        ctx.place(id, F(-4.2 + col * 1.2, 0, row ? 0.55 : -0.55));
        ctx.cast[id].root.rotation.set(0, F.yaw + (hash(i) - 0.5) * 0.5, 0);
        ctx.cast[id].setAccessory?.('partyHat', true);
        crowd.push({ ch: ctx.cast[id], phase: hash(i) * 0.4, k: i });
      });
      ctx.place('grandad', F(0, 2.25, 0));
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
      ctx.cam.set({ pos: F(x * 0.85 - 1.0, 2.7, 7.6), look: F(x, 2.15, 0), fov: 46 });
      ctx.cam.shake(ctx.t > ctx.markers.hornGrandad ? 0.3 : 0.12, ctx.t, 3);
    },
  },
  // ── b07 "But not me. I play chess."
  {
    name: 'but not me', start: 'b07-0.1', set: 'room',
    setup(ctx) { ctx.store = roomNook(ctx); ctx.store.cams = nookCams(ctx.store.F); },
    update(ctx, lt, u) {
      const { ch, cams, F } = ctx.store;
      const chess = ctx.time('b07.w3');
      ch.pose('sitIdle', ctx.t, { headYaw: ctx.t < chess ? 0 : -0.15 });
      ch.face(ctx.t < chess ? 'smug' : 'determined', ctx.t);
      if (ctx.t < chess) ctx.cam.move(cams.med, cams.face, ease.inOutQuad(ctx.progress('b07', 'b07.w3')));
      else ctx.cam.move({ pos: F(0.0, 1.7, 2.0), look: F(0, 0.85, 0.6), fov: 40 }, cams.top, ease.outQuad(ctx.progress('b07.w3', 'b08')));
    },
  },
  // ── b08 HUSS ×3
  ...['faceL', 'board', 'face'].map((camName, i) => ({
    name: `huss b08 #${i + 1}`, start: i === 0 ? 'b08.h0-0.12' : `b08.h${i}-0.03`, set: 'room',
    setup(ctx) {
      ctx.store = roomNook(ctx); ctx.store.cams = nookCams(ctx.store.F);
      ctx.store.practice = practiceTrack(ctx, 'b08', [['d2', 'd4'], ['c2', 'c4'], ['b1', 'c3']], [['d7', 'd5'], ['e7', 'e6'], null]);
    },
    update(ctx) {
      slamUpdate(ctx, ctx.store, ctx.store.practice);
      pressClock(ctx, ctx.store.practice.hits.map((h) => h + 0.09));
      ctx.cam.set(ctx.store.cams[camName]); ctx.cam.shake(0.08, ctx.t, 10 + i);
    },
  })),
  // ── b09 "I don't eat breakfast. I sacrifice it."  → zoom
  {
    name: 'sacrifice breakfast', start: 'b09-0.1', set: 'room',
    setup(ctx) {
      ctx.store = roomNook(ctx, 'me', { lighting: 'day' }); ctx.set.set?.('window', 'day');
      ctx.store.cams = nookCams(ctx.store.F);
      const { F } = ctx.store; const p = ctx.props.plate;
      ctx.add(p.root); p.root.position.copy(F(0.05, TABLE_TOP + 0.02, 0.6)); p.root.rotation.set(0, F.yaw, 0);
    },
    update(ctx, lt, u) {
      const { ch, cams, F } = ctx.store;
      const tS = ctx.time('b09.w5');
      const k = clamp((ctx.t - tS) / 0.55, 0, 1);
      const p = ctx.props.plate;
      p.root.position.copy(F(0.05 + 2.2 * k, TABLE_TOP + 0.02 + 1.6 * k - 2.4 * k * k, 0.6 + 0.4 * k));
      p.root.rotation.set(k * 5, F.yaw + k * 3, k * 2);
      if (p.food) { p.food.position.y = k * 0.25; p.food.rotation.x = k * 6; }
      ch.pose(ctx.t < tS - 0.15 ? 'sitIdle' : 'sitSlam', ctx.t, { hits: [tS] });
      ch.face(ctx.t < ctx.time('b09.w4') ? 'neutral' : 'smug', ctx.t);
      const tb = ctx.markers.bruh1;
      const mid = { pos: F(0.6, 1.55, 2.3), look: F(0, 1.05, 0.45), fov: 40 };
      if (ctx.t < tb) ctx.cam.move(cams.med, mid, ease.inOutQuad(clamp(lt / (tb - ctx.time('b09')), 0, 1)));
      else boomCam(ctx, tb, mid, cams.face);
    },
  },
  // ── b10 "My cat only moves in L-shapes now."
  {
    name: 'cat L hops', start: 'b10-0.1', set: 'room',
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
      const path = [[1, 0], [2, 2], [4, 3], [5, 5]].map(([fx, rz]) => F(-(fx - 3.5) * sq, 0.03, (rz - 3.5) * sq));
      ctx.store = { F, path };
    },
    update(ctx) {
      const { F, path } = ctx.store;
      const cat = ctx.cast.cat;
      const t0 = ctx.time('b10.w1'), hopDur = 0.42;
      const n = path.length - 1;
      const s = clamp((ctx.t - t0) / hopDur, 0, n);
      const i = Math.min(Math.floor(s), n - 1), k = s - i;
      const a = path[i], b = path[i + 1];
      const corner = Math.abs(b.x - a.x) > Math.abs(b.z - a.z) ? V(b.x, a.y, a.z) : V(a.x, a.y, b.z);
      const k1 = clamp(k / 0.62, 0, 1), k2 = clamp((k - 0.62) / 0.38, 0, 1);
      const p = k < 0.62 ? a.clone().lerp(corner, ease.inOutQuad(k1)) : corner.clone().lerp(b, ease.inOutQuad(k2));
      const hopH = k < 0.62 ? Math.sin(Math.PI * k1) * 0.35 : Math.sin(Math.PI * k2) * 0.22;
      cat.root.position.copy(p).add(V(0, s < n ? hopH : 0, 0));
      const dir = (k < 0.62 ? corner.clone().sub(a) : b.clone().sub(corner));
      if (dir.lengthSq() > 1e-6 && s < n) cat.root.rotation.set(0, Math.atan2(dir.x, dir.z), 0);
      cat.pose(s >= n || s <= 0 ? 'sit' : 'hop', ctx.t, { u: k < 0.62 ? k1 : k2 });
      cat.face(s >= n ? 'smug' : 'neutral', ctx.t);
      const cp = cat.root.position;
      ctx.cam.set({ pos: V(cp.x, 0, cp.z).addScaledVector(F.fwd, 2.0).addScaledVector(F.left, 0.4).add(V(0, 2.1, 0)), look: V(cp.x, 0.2, cp.z), fov: 44 });
    },
  },
  // ── b11 HUSS ×6 montage (a different time of day on every hit)
  ...['face', 'board', 'faceL', 'wide', 'boardLow', 'face'].map((camName, i) => ({
    name: `huss b11 #${i + 1}`, start: i === 0 ? 'b11.h0-0.12' : `b11.h${i}-0.03`, set: 'room',
    setup(ctx) {
      ctx.store = roomNook(ctx, 'me', { lighting: ['night', 'day', 'dawn', 'night', 'day', 'dawn'][i] });
      ctx.set.set?.('window', ['party', 'day', 'sunrise', 'party', 'day', 'sunrise'][i]);
      ctx.store.cams = nookCams(ctx.store.F);
      ctx.store.practice = practiceTrack(ctx, 'b11', [['e2', 'e4'], ['g1', 'f3'], ['d2', 'd4'], ['f3', 'd4'], ['b1', 'c3'], ['c1', 'e3']],
        [['c7', 'c5'], ['d7', 'd6'], ['c5', 'd4'], ['g8', 'f6'], ['a7', 'a6'], null]);
    },
    update(ctx) {
      slamUpdate(ctx, ctx.store, ctx.store.practice);
      pressClock(ctx, ctx.store.practice.hits.map((h) => h + 0.09));
      ctx.cam.set(ctx.store.cams[camName]); ctx.cam.shake(0.09, ctx.t, 20 + i);
    },
  })),
  // ── b12 "Then came the Summer Party Chess Match."
  {
    name: 'square establishing', start: 'b12-0.1', set: 'town',
    setup(ctx) {
      tourney(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 30).add(V(0, 16, 0)), look: c.clone().add(V(0, 1, 0)), fov: 44 };
      ctx.store.to = { pos: cam, look: c.clone().add(V(0, 1.5, 0)), fov: 46 };
    },
    update(ctx, lt, u) { tourneyAnim(ctx); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic); },
  },
  {
    name: 'banner', start: 'b12.w3-0.05', set: 'town',
    setup(ctx) {
      tourney(ctx);
      const look = ctx.point('square.banner'), cam = ctx.point('square.bannerCam');
      const away = V().subVectors(cam, look).normalize();
      ctx.store.from = { pos: look.clone().addScaledVector(away, cam.distanceTo(look) * 1.5).add(V(0, -1.5, 0)), look: look.clone().add(V(0, -0.6, 0)), fov: 46 };
      ctx.store.to = { pos: cam.clone().addScaledVector(away, 1.5), look: look.clone().add(V(0, -2.0, 0)), fov: 56 };
    },
    update(ctx, lt, u) { tourneyAnim(ctx); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.outCubic); },
  },
  // ── b13 "Everybody laughed."  (+ laugh SFX, a T-poser and the cat in a party hat in the stands)
  {
    name: 'crowd laughs', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      tourney(ctx); const F = frameAt(ctx, 'square.standA'); ctx.store.F = F;
      const rows = ctx.anchor('square.standA.rows');
      if (Array.isArray(rows) && rows[1]) { ctx.place('cat', rows[1], { offset: [2.9, 0, 0] }); ctx.cast.cat.setAccessory?.('partyHat', true); }
    },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'laugh', face: 'laugh' });
      gagTPose(ctx.store.crowd[9]?.ch);
      ctx.cast.cat.pose('sit', ctx.t); ctx.cast.cat.face('smug', ctx.t);
      const F = ctx.store.F;
      ctx.cam.move({ pos: F(1.5, 2.2, 6.2), look: F(0, 2.0, 0), fov: 40 }, { pos: F(0.6, 2.3, 4.8), look: F(0, 2.1, 0), fov: 38 }, u, ease.outQuad);
      ctx.cam.shake(0.1, ctx.t, 31);
    },
  },
  // ── b14 heckler: "Who brings a chess clock to a party?"
  {
    name: 'heckler', start: 'b14-0.1', set: 'town',
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
  // ── b15 "My opponent?"
  {
    name: 'my opponent?', start: 'b15-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx);
      const me = ctx.cast.me; me.pose('sitIdle', ctx.t, { headYaw: 0.1 }); me.face('determined', ctx.t);
      const hp = headPos(me, 0);
      const FB = ctx.store.FB;
      ctx.cam.move({ pos: FB(0.85, 1.95, -0.75), look: hp, fov: 36 }, { pos: FB(0.8, 1.9, -0.6), look: hp, fov: 33 }, u);
    },
  },
  // ── "The mayor. Undefeated for forty years."  → TOP 10 card
  {
    name: 'the mayor', start: 'b15.w2-0.08', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx);
      const m = ctx.cast.mayor;
      m.pose('sitIdle', ctx.t); m.face(ctx.t > ctx.time('b15.w4') ? 'smug' : 'neutral', ctx.t);
      pigeonOnShoulder(ctx);
      const hp = headPos(m, 0.05);
      const FA = ctx.store.FA;
      const t10 = ctx.markers.top10;
      const near = { pos: FA(-1.05, 1.9, -0.35), look: hp, fov: 34 };
      if (ctx.t < t10) ctx.cam.move({ pos: FA(-1.3, 2.1, -1.2), look: hp.clone().add(V(0, -0.3, 0)), fov: 42 }, near, ease.inOutQuad(ctx.progress('b15.w2', t10)));
      else {
        boomCam(ctx, t10, near, { pos: FA(-0.95, 1.85, -0.1), look: hp, fov: 26 });
        ctx.fx.vignette(0.55); ctx.fx.overlay('#ff0022', 0.12);
        memeText(ctx, 'TOP 10', t10, { y: 0.14, size: 210, fill: '#ffe14a' });
        memeText(ctx, 'SCARIEST\nOPPONENTS', t10 + 0.25, { y: 0.27, size: 120 });
      }
    },
  },
  // ── b16 HUSS ×6: scholar's mate — moves land on HUSS 1,3,4,6, the clock gets slammed on 2 and 5
  ...[0, 2, 3, 5].map((hi, i) => ({
    name: `match huss #${i + 1}`, start: i === 0 ? 'b16.h0-0.12' : `b16.h${hi}-0.03`, set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true, board: true }); },
    update(ctx) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked' });
      const me = ctx.cast.me, m = ctx.cast.mayor;
      const hits = ctx.hussTimes('b16').map((h) => h + 0.03);
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
      if (i === 0) ctx.cam.set({ pos: B(0.62, 0.38, -0.12), look: B(0.0, 0.03, -0.02), fov: 38 });
      if (i === 1) ctx.cam.set({ pos: FB(0.8, 1.9, -0.6), look: headPos(me, 0), fov: 34 });
      if (i === 2) ctx.cam.set({ pos: FA(-1.4, 1.85, -0.05), look: headPos(m, 0), fov: 34 });
      if (i === 3) ctx.cam.set({ pos: B(-0.6, 0.24, 0.22), look: B(0.12, 0.04, 0.1), fov: 38 });
      ctx.cam.shake(0.1, ctx.t, 40 + i);
    },
  })),
  // ── b17 "Checkmate."  — the king topples (+ air horn)
  {
    name: 'checkmate', start: 'b17-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, mayor: true, board: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked' });
      ctx.cast.me.pose('sitIdle', ctx.t); ctx.cast.me.face('smug', ctx.t);
      ctx.cast.mayor.pose('surprised', ctx.t); ctx.cast.mayor.face('shocked', ctx.t);
      pigeonOnShoulder(ctx);
      ctx.store.match.play(ctx.props.chess, ctx.t);
      const k = clamp((ctx.t - ctx.time('b17.w0')) / 0.7, 0, 1);
      ctx.props.chess.topple('e8', ease.outQuad(k));
      const B = ctx.store.FBoard;
      const kw = ctx.props.chess.root.localToWorld(ctx.props.chess.squareToLocal('e8').clone());
      ctx.cam.move({ pos: kw.clone().add(V(0, 0.16, 0)).addScaledVector(B.fwd, -0.12).addScaledVector(B.left, 0.55), look: kw.clone().add(V(0, 0.05, 0)), fov: 34 },
        { pos: kw.clone().add(V(0, 0.12, 0)).addScaledVector(B.fwd, -0.1).addScaledVector(B.left, 0.42), look: kw.clone().add(V(0, 0.04, 0)), fov: 32 }, u);
      if (ctx.t > ctx.markers.checkmate) ctx.cam.shake(0.25, ctx.t, 51);
    },
  },
  // ── "In four moves."  → +1000 RESPECT, confetti
  {
    name: 'in four moves', start: 'b17.w1-0.08', set: 'town',
    setup(ctx) {
      tourney(ctx, { hero: true, mayor: true, board: true });
      const cf = ctx.props.confetti; ctx.add(cf.root); cf.root.position.copy(ctx.store.FBoard(0, 0.6, 0));
    },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked' });
      ctx.cast.me.pose('sitIdle', ctx.t); ctx.cast.me.face('smug', ctx.t);
      ctx.cast.mayor.pose('stunned', ctx.t); ctx.cast.mayor.face('shocked', ctx.t);
      pigeonOnShoulder(ctx);
      ctx.store.match.play(ctx.props.chess, ctx.t);
      ctx.props.chess.topple('e8', 1);
      const tr = ctx.markers.respect1;
      ctx.props.confetti.update(ctx.t - tr);
      const B = ctx.store.FBoard;
      ctx.cam.move({ pos: B(2.6, 1.3, 0.2), look: B(0, 0.45, 0), fov: 42 }, { pos: B(2.2, 1.2, 0.2), look: B(0, 0.5, 0), fov: 40 }, u);
      memeText(ctx, '+1000\nRESPECT', tr, { y: 0.22, size: 150, fill: '#7dff6a', rise: true });
    },
  },
  // ── b18 "The whole crowd went silent."  (record scratch, crickets… a tumbleweed rolls across the stage)
  {
    name: 'silence', start: 'b18-0.25', set: 'town',
    setup(ctx) {
      tourney(ctx, { hero: true, mayor: true, board: true });
      ctx.add(ctx.props.tumbleweed);
    },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked', still: true });
      ctx.cast.me.pose('sitIdle', ctx.t); ctx.cast.me.face('smug', ctx.t);
      ctx.cast.mayor.pose('stunned', ctx.t); ctx.cast.mayor.face('shocked', ctx.t);
      pigeonOnShoulder(ctx); ctx.store.match.play(ctx.props.chess, ctx.t); ctx.props.chess.topple('e8', 1);
      const FB = ctx.store.FBoard;
      const k = clamp(lt / 2.2, 0, 1);
      const tw = ctx.props.tumbleweed;
      tw.position.copy(FB(lerp(-4.5, 4.5, k), -0.78 + 0.32 + Math.abs(Math.sin(k * 18)) * 0.25, 1.4));
      tw.rotation.set(0, 0, -k * 22);
      ctx.cam.move({ pos: FB(4.8, 2.5, -3.8), look: FB(0, 0.3, 0.8), fov: 44 }, { pos: FB(4.3, 2.3, -3.3), look: FB(0, 0.3, 0.8), fov: 42 }, u, ease.inOutSine);
    },
  },
  // ── b19 Marcus: "When did you get so good?"
  {
    name: 'marcus asks', start: 'b19-0.1', set: 'town',
    setup(ctx) { tourney(ctx, { hero: true, standing: true }); },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked', still: true });
      const F = ctx.store.FA, mk = ctx.cast.marcus;
      mk.root.position.copy(F(-1.1, 0, 1.2)); mk.root.rotation.set(0, F.yaw + Math.PI * 0.62, 0);
      mk.pose('shrug', ctx.t); mk.face('shocked', ctx.t);
      ctx.cast.me.pose('idle', ctx.t); ctx.cast.me.face('neutral', ctx.t);
      const mh = headPos(mk, 0), hh = headPos(ctx.cast.me, 0);
      const d = V(hh.x - mh.x, 0, hh.z - mh.z).normalize(), perp = V(d.z, 0, -d.x);
      const camAt = (a, b) => mh.clone().addScaledVector(d, a).addScaledVector(perp, b).add(V(0, 0.08, 0));
      ctx.cam.move({ pos: camAt(2.2, 1.3), look: mh, fov: 38 }, { pos: camAt(1.9, 1.1), look: mh, fov: 37 }, u);
    },
  },
  // ── b20 "While you were out partying."  → deal-with-it shades + boom
  {
    name: 'the truth', start: 'b20-0.1', set: 'town',
    setup(ctx) {
      tourney(ctx, { hero: true, standing: true });
      const me = ctx.cast.me;
      me.setAccessory?.('sunglasses', true);
      const sg = me.root.getObjectByName('acc:sunglasses');
      ctx.store.sg = sg; ctx.store.sgY = sg ? sg.position.y : 0;
    },
    update(ctx, lt, u) {
      tourneyAnim(ctx, { action: 'stunned', face: 'shocked', still: true });
      const F = ctx.store.FA, me = ctx.cast.me;
      const mk = ctx.cast.marcus; mk.root.position.copy(F(-1.1, 0, 1.2)); mk.root.rotation.set(0, F.yaw + Math.PI * 0.62, 0);
      mk.pose('idle', ctx.t); mk.face('shocked', ctx.t);
      me.pose('idle', ctx.t, { headYaw: 0.1 }); me.face('smug', ctx.t);
      const ts = ctx.markers.shades;
      if (ctx.store.sg) {
        const k = ease.outQuad(clamp((ctx.t - (ts - 0.55)) / 0.55, 0, 1));
        ctx.store.sg.position.y = ctx.store.sgY + (1 - k) * 0.9;
        ctx.store.sg.visible = ctx.t > ts - 0.6;
      }
      const hp = headPos(me, 0.3);
      const ry = me.root.rotation.y, f = V(Math.sin(ry), 0, Math.cos(ry));
      const mid = { pos: hp.clone().addScaledVector(f, 2.0).add(V(0, 0.05, 0)), look: hp, fov: 36 };
      if (ctx.t < ts) ctx.cam.move({ pos: hp.clone().addScaledVector(f, 2.6).add(V(0, 0.1, 0)), look: hp, fov: 38 }, mid, ease.inOutQuad(ctx.progress('b20', ts)));
      else { boomCam(ctx, ts, mid, { pos: hp.clone().addScaledVector(f, 1.55), look: hp, fov: 32 }); memeText(ctx, 'DEAL WITH IT', ts, { y: 0.17, size: 120 }); }
    },
  },
  // ── b21 "Now the whole town is grinding."  /  b22 HUSS ×3 from every window
  {
    name: 'grinding town night', start: 'b21-0.1', set: 'town',
    setup(ctx) { quietTown(ctx); ctx.store = { F: frameAt(ctx, 'street.center') }; },
    update(ctx, lt, u) {
      const hs = ctx.hussTimes('b22');
      const n = hs.filter((h) => h <= ctx.t + 0.02).length;
      ctx.set.set?.('windowGlow', (hi, wi) => (((hi * 3 + wi * 5) % 7) < n * 2 + 1 ? 1 : 0.06));
      const F = ctx.store.F;
      ctx.cam.punch(hs, ctx.t, 0.08, 0.25);
      ctx.cam.move({ pos: F(-2, 2.2, 6), look: F(3, 3, -2), fov: 52 }, { pos: F(-1.2, 2.5, 4.8), look: F(3, 3.4, -2), fov: 50 }, u);
    },
  },
  // ── b23 "My grandad plays blindfolded."  /  "He just lost his glasses."  → zoom
  {
    name: 'grandad blindfold?', start: 'b23-0.1', set: 'roomGrandad',
    setup(ctx) { ctx.store = roomNook(ctx, 'grandad', { lighting: 'night', clock: false }); ctx.cast.grandad.setAccessory?.('glasses', false); },
    update(ctx, lt, u) {
      const { ch, F } = ctx.store;
      ch.pose('peer', ctx.t); ch.face('squint', ctx.t);
      ctx.props.chess.setFEN('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R');
      ctx.cam.move({ pos: F(1.2, 1.75, 3.0), look: F(0, 1.1, 0.4), fov: 40 }, { pos: F(0.9, 1.65, 2.5), look: F(0, 1.2, 0.35), fov: 38 }, u);
    },
  },
  {
    name: 'lost his glasses', start: 'b23.w4-0.08', set: 'roomGrandad',
    setup(ctx) { ctx.store = roomNook(ctx, 'grandad', { lighting: 'night', clock: false }); ctx.cast.grandad.setAccessory?.('glasses', false); glassesOnHead(ctx); },
    update(ctx, lt, u) {
      const { ch, F } = ctx.store;
      ch.pose('peer', ctx.t); ch.face('squint', ctx.t);
      ctx.props.chess.setFEN('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R');
      const hp = headPos(ch, 0.28);
      const tb = ctx.markers.bruh2;
      const mid = { pos: F(0.4, 1.95, 2.0), look: hp, fov: 36 };
      if (ctx.t < tb) ctx.cam.move({ pos: F(0.5, 1.95, 2.3), look: hp, fov: 38 }, mid, ease.inOutQuad(clamp(lt / (tb - ctx.time('b23.w4')), 0, 1)));
      else boomCam(ctx, tb, mid, { pos: F(0.3, 1.9, 1.55), look: hp, fov: 32 });
    },
  },
  // ── b24 "And my only opponent left…"  /  "…is the mayor's pigeon."
  {
    name: 'alone in the park', start: 'b24-0.1', set: 'town',
    setup(ctx) { park(ctx); },
    update(ctx, lt, u) {
      parkAnim(ctx);
      const me = ctx.cast.me; me.pose('sitIdle', ctx.t); me.face('sad', ctx.t);
      const F = ctx.store.FT;
      ctx.cam.move({ pos: F(1.3, 1.65, 3.0), look: F(0, 0.95, -0.4), fov: 42 }, { pos: F(1.0, 1.6, 2.5), look: F(0, 1.0, -0.4), fov: 40 }, u);
    },
  },
  {
    name: 'pigeon opponent', start: 'b24.w6-0.08', set: 'town',
    setup(ctx) { park(ctx, { pigeon: true }); },
    update(ctx, lt, u) {
      parkAnim(ctx);
      const me = ctx.cast.me; me.pose('sitIdle', ctx.t); me.face('neutral', ctx.t);
      const pg = ctx.cast.pigeon; pg.pose('idle', ctx.t); pg.face('smug', ctx.t);
      const F = ctx.store.FT;
      const pp = pg.root.position.clone().add(V(0, 0.2, 0));
      ctx.cam.move({ pos: F(2.1, 2.1, -2.7), look: pp, fov: 38 }, { pos: F(1.8, 1.9, -2.2), look: pp, fov: 30 }, u, ease.inOutQuad);
    },
  },
  // ── b25 "Honestly?" — pigeon chaos  /  "He's winning." → boom on the pigeon
  {
    name: 'pigeon chaos', start: 'b25-0.1', set: 'town',
    setup(ctx) { park(ctx, { pigeon: true }); },
    update(ctx, lt, u) {
      parkAnim(ctx);
      const pg = ctx.cast.pigeon, F = ctx.store.FT, chess = ctx.props.chess;
      const tK = ctx.time('b25'), tW = ctx.time('b25.w1');
      chess.reset();
      chess.knockAll(clamp((ctx.t - tK) / 0.7, 0, 1), 7);
      if (ctx.t < tW) { pg.pose('knock', ctx.t); pg.root.position.copy(F(0.0, TABLE_TOP, 0.3)); }
      else {
        const k = (ctx.t - tW) * 0.5;
        pg.root.position.copy(F(Math.sin(k * 2.2) * 0.16, TABLE_TOP, Math.cos(k * 2.2) * 0.12));
        pg.root.rotation.set(0, F.yaw + Math.PI + k * 2.2 + Math.PI / 2, 0);
        pg.pose('strut', ctx.t);
      }
      pg.face('smug', ctx.t);
      ctx.cast.me.pose('sitIdle', ctx.t); ctx.cast.me.face(ctx.t < tW ? 'shocked' : 'sweat', ctx.t);
      const tb = ctx.markers.boomWinning;
      const pp = pg.root.position.clone().add(V(0, 0.22, 0));
      const mid = { pos: F(0.7, 1.35, 0.9), look: F(0, TABLE_TOP + 0.15, 0), fov: 40 };
      if (ctx.t < tb) ctx.cam.move({ pos: F(0.9, 1.55, 1.1), look: F(0, TABLE_TOP + 0.1, 0), fov: 42 }, mid, ease.inOutQuad(ctx.progress('b25', tb)));
      else {
        ctx.cast.me.root.visible = false;
        ctx.store.walkers.forEach((id) => { ctx.cast[id].root.visible = false; });
        boomCam(ctx, tb, mid, { pos: pp.clone().addScaledVector(F.left, 0.3).addScaledVector(F.fwd, -0.9).add(V(0, 0.15, 0)), look: pp, fov: 34 });
      }
    },
  },
  // ── b26 the pigeon: "HUSS! HUSS! HUSS!"  → air horn, +1000 RESPECT, confetti
  {
    name: 'pigeon huss', start: 'b26.h0-0.2', set: 'town',
    setup(ctx) {
      park(ctx, { pigeon: true });
      const cf = ctx.props.confetti; ctx.add(cf.root); cf.root.position.copy(ctx.store.FT(0, TABLE_TOP + 0.6, 0.0));
    },
    update(ctx, lt, u) {
      parkAnim(ctx);
      const pg = ctx.cast.pigeon, F = ctx.store.FT;
      ctx.props.chess.reset(); ctx.props.chess.knockAll(1, 7);
      pg.root.position.copy(F(0.0, TABLE_TOP, 0.05)); pg.root.rotation.set(0, F.yaw + Math.PI, 0);
      const hs = ctx.hussTimes('b26');
      const last = lastBefore(hs, ctx.t + 0.05);
      pg.pose(last != null ? 'huss' : 'idle', ctx.t, { hits: hs }); pg.face(last != null && ctx.t - last < 0.17 ? 'huss' : 'smug', ctx.t);
      ctx.cast.me.root.visible = false;
      ctx.store.walkers.forEach((id) => { ctx.cast[id].root.visible = false; });
      const pp = pg.root.position.clone().add(V(0, 0.22, 0));
      ctx.cam.set({ pos: pp.clone().addScaledVector(F.left, 0.3).addScaledVector(F.fwd, -0.95).add(V(0, 0.18, 0)), look: pp, fov: 36 });
      ctx.cam.punch(hs, ctx.t, 0.14, 0.2);
      ctx.cam.shake(ctx.t > ctx.markers.hornEnd ? 0.3 : 0.05, ctx.t, 61);
      ctx.props.confetti.update(ctx.t - ctx.markers.hornEnd);
      memeText(ctx, '+1000\nRESPECT', ctx.markers.respect2, { y: 0.2, size: 160, fill: '#7dff6a', rise: true });
    },
  },
];

// ───────────────────────────────────────────────────────────────────────────── gag helpers
/** "Vine boom": hold `from` until t0, then snap-zoom to `to` in 0.12 s with a decaying shake. */
function boomCam(ctx, t0, from, to) {
  if (ctx.t < t0) { if (from) ctx.cam.set(from); return; }
  const k = ease.outCubic(clamp((ctx.t - t0) / 0.12, 0, 1));
  ctx.cam.move(from || to, to, k);
  ctx.cam.shake(Math.max(0, 0.6 - (ctx.t - t0) * 1.2), ctx.t, 77);
}

/** Pop-in meme text (scale overshoot), optional slow rise. */
function memeText(ctx, str, t0, o = {}) {
  const d = ctx.t - t0;
  if (d < 0) return;
  const pop = d < 0.18 ? Math.max(0.01, ease.outBack(d / 0.18)) : 1;
  const wob = Math.sin(d * 7) * 0.03;
  ctx.fx.text(str, { ...o, y: (o.y ?? 0.22) - (o.rise ? Math.min(d, 1.5) * 0.03 : 0), scale: pop * (o.scale ?? 1), rot: (o.rot ?? -0.06) + wob });
}

function gagTPose(ch) {
  if (!ch) return;
  ch.pose('idle', 0);
  ch.joints.armL.rotation.set(0, 0, Math.PI / 2);
  ch.joints.armR.rotation.set(0, 0, -Math.PI / 2);
  ch.face('neutral', 0);
}

function gagBreakdance(ctx, ch, base) {
  if (!ch || !base) return;
  ch.pose('dance', ctx.t * 1.5, { intensity: 1 });
  ch.root.position.set(base.x, base.y + 2.0 * (ch.spec?.scale || 1), base.z);
  ch.root.rotation.set(0, ctx.t * 9, Math.PI, 'YXZ');
  ch.face('grin', ctx.t);
}

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
      ctx.cam.move(cams.wide, cams.med, u, ease.inOutQuad);
    },
  };
}

function glassesOnHead(ctx) {
  // Move grandad's glasses up onto his forehead if the character exposes them; otherwise skip.
  const g = ctx.cast.grandad;
  const node = g.root.getObjectByName('acc:glasses');
  if (node) { g.setAccessory?.('glasses', true); node.position.y += 0.19; node.position.z -= 0.03; node.rotation.x = -0.35; }
}

function camAway(ctx, from) {
  const c = ctx.point('square.cam1');
  return V(c.x - from.x, 0, c.z - from.z).normalize();
}

/** Town square at dusk, crowd in party hats in the stands, optional hero / mayor / board at the table. */
function tourney(ctx, { hero = false, mayor = false, board = false, standing = false } = {}) {
  ctx.set.setLighting?.('dusk');
  ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('standsCrowd', true); ctx.set.set?.('crowdMotion', 1);
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
  if (standing) { ctx.place('marcus', st.FA(-1.1, 0, 1.2)); }
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
  if (still) ctx.set.set?.('crowdMotion', 0);
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
  walkers.forEach((id, i) => ctx.place(id, FT(0, 0, 6 + i)));
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

// Shared building blocks for later episodes (src/ep2/shots.js etc.).
export {
  V, TABLE_TOP, PARTY_A, PARTY_B, headPos, frame, frameAt, roomNook, practiceTrack, nookCams, burstAt, lastBefore,
  slamUpdate, pressClock, partyTown, tourney, tourneyAnim, pigeonOnShoulder, quietTown, park, parkAnim, glassesOnHead,
  boomCam, memeText, gagTPose, gagBreakdance, makeCar, makeTumbleweed,
};
