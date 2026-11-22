// In This Town — Episode 12: "Staff Only".  The sky is a painted wall.  A kid follows his cat through a crack in it,
// finds a STAFF ONLY door, a control room full of levers and the pigeon who runs the world… and floats the town.
// Film contract: SPEC.md §8.  Timeline: episodes/ep12/timeline.json.  New props + the control-room set: ./props.js
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { EXTRAS, EXTRA_IDS } from '../cast.js';
import { MAIN } from '../cast.js';
import { WALK_SPEED } from '../characters.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard } from '../cards.js';
import { makeTable, makeChair, makeImpactBurst } from '../props.js';
import { makePuff, makeRing } from '../ep9/props9.js';
import {
  makeSkyPanel, makeSkyRing, makeGlowCrack, makeStaffDoor, makeRainCloud, makeMug, makeBaseball, makePigeonShades,
  makePigeonPhones, makeSpinnyChair, makeFloatHouse, makePigtails, buildControlRoom, staticNoise, NAMED, CONSOLE_Z, LAST_X,
} from './props.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
export const cast = {
  me: { id: 'me', skin: '#f1c7a1', hair: { style: 'short', color: '#4a2f1d' }, top: { style: 'hoodie', color: '#ffc81f', accent: '#e8232b', emblem: 'star' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#e8232b', accessories: ['cap'], capColor: '#e8232b', scale: 0.9 },
  becky: { id: 'becky', skin: '#c68642', hair: { style: 'long', color: '#2b1d14' }, top: { style: 'tee', color: '#21a650', accent: '#ffffff', emblem: 'number' },
    number: 7, bottom: { style: 'shorts', color: '#f2f2f2' }, shoes: '#ffffff', scale: 0.86 },
  finch: { id: 'finch', skin: '#f0c8a8', hair: { style: 'grandpa', color: '#bdbdbd' }, top: { style: 'cardigan', color: '#8a6b9a', accent: '#f3e3a5' },
    bottom: { style: 'pants', color: '#5a5040' }, shoes: '#4a3b2f', accessories: ['glasses', 'mustache'], scale: 0.95 },
  mayor: MAIN.mayor,
  pigeon: { creature: 'pigeon', id: 'pigeon', scale: 1.7 },
  cat: { creature: 'cat', id: 'cat' },
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 12, banner: ['OFFICIAL', 'SKY', 'RULES'] }),
  room: () => buildRoom({ variant: 'grandad', window: 'day' }),
  control: () => buildControlRoom(),
};

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
function frame(origin, yaw) {
  const fwd = V(Math.sin(yaw), 0, Math.cos(yaw)), left = V(Math.cos(yaw), 0, -Math.sin(yaw));
  const f = (x, y, z) => V().copy(origin).addScaledVector(left, x).addScaledVector(fwd, z).add(V(0, y, 0));
  f.origin = origin.clone(); f.yaw = yaw; f.fwd = fwd; f.left = left;
  return f;
}
const lastBefore = (times, t) => { let r = null; for (const x of times) if (x <= t) r = x; return r; };

export function init(ctx) {
  const P = ctx.props;
  P.panel = makeSkyPanel();
  P.ring = makeSkyRing();
  P.crack = makeGlowCrack({ h: 2.4 });
  P.door = makeStaffDoor();
  P.cloud = makeRainCloud(); P.cloud2 = makeRainCloud();
  P.mug = makeMug(); P.mug2 = makeMug();
  P.ball = makeBaseball();
  P.trail = Array.from({ length: 5 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 - i * 0.09 })); return m; });
  P.shades = makePigeonShades(); P.phones = makePigeonPhones();
  P.chair = makeSpinnyChair();
  P.table = makeTable({ w: 0.95, d: 0.75 }); P.woodChair = makeChair(); P.woodChair2 = makeChair();
  P.bakery = makeFloatHouse({ wall: '#f3d2a0', roof: '#b5543f', sign: 'BAKERY' });
  P.fh1 = makeFloatHouse({ wall: '#c9e4f2', roof: '#4a5d7e' }); P.fh2 = makeFloatHouse({ wall: '#f2c4c4', roof: '#3f7a5a' }); P.fh3 = makeFloatHouse({ wall: '#d6e8c4', roof: '#6b4a3a' });
  P.pigtails = makePigtails('#2b1d14');
  P.burst = makeImpactBurst({ size: 0.5 });
  P.ringFx = makeRing();
  P.puffs = Array.from({ length: 6 }, (_, i) => makePuff({ color: '#e8dcc4', count: 14, radius: 0.7, seed: i + 1 }));
  P.bigPuff = makePuff({ color: '#d9c9a8', count: 22, radius: 2.4, seed: 9 });
  P.fill = new THREE.PointLight('#fff1dc', 5, 9, 1.4);
  P.crackLight = new THREE.PointLight('#fff4c8', 6, 5, 1.5);
  P.redLight = new THREE.PointLight('#ff2a2a', 0, 6, 1.4);
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function T(ctx) { ctx.set.root.updateMatrixWorld(true); const r = ctx.set.root; const f = (x, y, z) => r.localToWorld(V(x, y, z)); f.yaw = yawOf(r); return f; }
const C = T;   // control room / room: same thing, the set's local frame
/** The end of the main street (west, x = −36.2) where the road runs into the painted wall.  +z = back toward town. */
const EDGE = (ctx) => { const L = T(ctx); return frame(L(-36.2, 0, 0), L.yaw + Math.PI / 2); };
/** The wall right behind the park (world x = −57.4, crack at local x = 1). */
const PARK = (ctx) => { const L = T(ctx); return frame(L(-57.4, 0, -9.0), L.yaw + Math.PI / 2); };
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 72, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop * (o.scale ?? 1)) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.24, size: 170, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.12, alpha: clamp(d / 0.06, 0, 1), ...o, scale: s * (o.scale ?? 1) });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headOf(ch, y = 0.06) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, y, 0.02)); }
function fill(ctx, cam, k = 1, color = '#fff1dc') { const f = ctx.props.fill; ctx.add(f); f.color.set(color); f.position.copy(cam.pos).add(up(0.4)); f.intensity = 5 * k; }
const setCam = (ctx, cam, k = 1, color) => { ctx.cam.set(cam); fill(ctx, cam, k, color); };
const moveCam = (ctx, a, b, u, e = ease.inOutSine, k = 1, color) => { ctx.cam.move(a, b, u, e); fill(ctx, { pos: a.pos.clone().lerp(b.pos, e(clamp(u, 0, 1))) }, k, color); };
const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
function dayTown(ctx, preset = 'day') {
  ctx.set.setLighting?.(preset); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('windowGlow', preset === 'day' ? 0.2 : 0.8); ctx.set.set?.('standsCrowd', false);
}
function placePanel(ctx, F, tint = '#ffffff') {
  const P = ctx.props.panel; ctx.add(P); P.position.copy(F(0, 0, 0)); P.rotation.set(0, F.yaw, 0); P.userData.baseY = P.position.y; P.userData.tint(tint);
  P.userData.looseCloud.rotation.set(0, 0, 0); P.userData.looseCloud.position.set(-3.8, 6.5, 0.02);
  return P;
}
function putAt(ctx, id, p, yaw) { ctx.place(id, p); ctx.cast[id].root.rotation.set(0, yaw, 0); return ctx.cast[id]; }
const iris = (ctx, t0, cy = 0.45) => { const k = clamp((ctx.t - t0) / 0.45, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); }); };

/** Hand on the forehead, wobbling (after the bonk). */
function rubForehead(ch, t, k = 1) {
  ch.pose('stunned', t, { intensity: 0.6 });
  const J = ch.joints;
  J.armR.rotation.x += -2.5 * k; J.armR.rotation.z += 0.35 * k; J.foreArmR.rotation.x += -1.3 * k + 0.25 * Math.sin(t * 16) * k;
  J.head.rotation.x += -0.15 * k;
}
/** The overhead throw: windup → release at tr. */
function throwPose(ch, t, tr) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints, a = prog(t, tr - 0.45, tr - 0.05), b = prog(t, tr - 0.05, tr + 0.12);
  J.armR.rotation.x += lerp(lerp(0, -3.4, ease.inOutCubic(a)), -1.1, ease.outCubic(b));
  J.foreArmR.rotation.x += -0.9 * a * (1 - b);
  J.torso.rotation.y += lerp(0.4 * a, -0.35, b); J.torso.rotation.x += 0.25 * b;
  J.armL.rotation.x += -1.2 * a * (1 - b * 0.6);
}
/** Both hands together in front (catching / holding the ball). */
function holdPose(ch, t, base = 'idle') {
  ch.pose(base, t, { intensity: 0.3 });
  const J = ch.joints;
  for (const s of ['L', 'R']) { J['arm' + s].rotation.x += -1.0; J['arm' + s].rotation.z += (s === 'L' ? -0.45 : 0.45); J['foreArm' + s].rotation.x += -0.9; }
}
function ballInHands(ctx, ch) {
  ch.root.updateMatrixWorld(true);
  const a = ch.joints.handL.getWorldPosition(V()), b = ch.joints.handR.getWorldPosition(V());
  return a.lerp(b, 0.5).add(up(0.1));
}
const quadArc = (a, b, h, u) => a.clone().lerp(b, u).add(up(4 * h * u * (1 - u)));

// pigeon accessories (parented to its head joint)
function dressPigeon(ctx, slide = 0) {
  const p = ctx.cast.pigeon, P = ctx.props;
  ctx.add(P.shades, p.joints.head); P.shades.position.set(0, 0.083 - 0.03 * slide, 0.092 + 0.012 * slide); P.shades.rotation.set(0.25 * slide, 0, 0);
  ctx.add(P.phones, p.joints.head); P.phones.position.set(0, 0.07, 0.0); P.phones.rotation.set(0, 0, 0);
}
/** The control room with the spinny chair + pigeon.  spin: chair yaw offset (0 = facing the monitors). */
function controlRoom(ctx, { chair = true, pigeon = true, spin = Math.PI } = {}) {
  const S = ctx.set, Cc = C(ctx);
  S.set('alarm', 0); S.set('power', 1); S.set('screens', 'day'); S.set('lights', null); S.set('lastSpot', 0);
  S.setLever('GRAVITY', 1); S.setLever('SUNRISE', 0); S.setLever('RAIN', 0); S.setLever('TUESDAY', 0); S.setLever('LAST', 1); S.setMain(0);
  const st = { Cc };
  if (chair) {
    const ch = ctx.props.chair; ctx.add(ch); ch.position.copy(Cc(0, 0, -0.7)); ch.rotation.set(0, Math.PI, 0); ch.scale.setScalar(1.25); ch.userData.swivel.rotation.y = spin;
    st.chair = ch;
    if (pigeon) { ctx.place('pigeon', Cc(0, 0, 0)); dressPigeon(ctx); seatPigeon(ctx, spin); }
  }
  return st;
}
function seatPigeon(ctx, spin) {
  const ch = ctx.props.chair, p = ctx.cast.pigeon;
  ch.userData.swivel.rotation.y = spin; ch.updateMatrixWorld(true);
  p.root.position.copy(ch.userData.swivel.localToWorld(V(0, 0.65, 0.04)));
  p.root.rotation.set(0, Math.PI + spin, 0);
}
const pigeonHead = (ctx) => headOf(ctx.cast.pigeon, 0.06);
/** Wings together in front of the chest (k = 1 closed / clap, 0 = apart). */
function pigeonClap(p, t, k) {
  p.pose('idle', t);
  const J = p.joints;
  J.armL.rotation.set(-0.6, 2.35 + 0.5 * k, 0.5); J.armR.rotation.set(-0.6, -(2.35 + 0.5 * k), -0.5);
}
function kidAt(ctx, Cc, x, z, yaw) { return putAt(ctx, 'me', Cc(x, 0, z), yaw); }
function hussShots(beat, n, def) {
  return Array.from({ length: n }, (_, i) => ({ start: i === 0 ? `${beat}.h0-0.12` : `${beat}.h${i}-0.03`, ...def(i) }));
}
const hitsOf = (ctx, beat) => ctx.hussTimes(beat).map((h) => h + 0.03);
function ruleCards(ctx) {
  const rules = [['1. DON\'T TOUCH', ctx.markers.r1, '#ffffff'], ['2. DON\'T PEEL', ctx.markers.r2, '#ffffff'], ['3. NEVER KNOCK', ctx.markers.r3, '#ffe14a']];
  rules.forEach(([s, t0, c], i) => {
    const d = ctx.t - t0; if (d < 0) return;
    const sc = d < 0.12 ? lerp(1.9, 1, ease.outCubic(d / 0.12)) : 1;
    ctx.fx.text(s, { x: 0.5, y: 0.1 + i * 0.075, size: 76, fill: c, stroke: '#000000', bg: i === 2 ? 'rgba(200,0,30,0.92)' : 'rgba(20,20,40,0.85)', rot: i % 2 ? 0.03 : -0.03, scale: sc });
    if (d < 0.15) ctx.cam.shake(0.18 * (1 - d / 0.15), ctx.t, 40 + i);
  });
}
/** Mayor at the front of the stage (S = stage frame, +z = audience). */
function mayorStage(ctx) {
  const S = frameAt(ctx, 'square.stage');
  putAt(ctx, 'mayor', S(0.4, 0, 2.55), S.yaw);
  // audience on the plaza (backs to the camera), facing the stage
  const ids = EXTRA_IDS.slice(0, 10);
  ids.forEach((id, k) => { const row = Math.floor(k / 5), col = k % 5; putAt(ctx, id, S(-2.6 + col * 1.3 + (row ? 0.6 : 0) + (hash(k) - 0.5) * 0.3, -0.8, 6.0 + row * 1.3), S.yaw + Math.PI + (hash(k * 3) - 0.5) * 0.4); });
  return { S, ids };
}
function frameAt(ctx, name, extraYaw = 0) { const a = ctx.anchor(name); a.updateWorldMatrix(true, false); return frame(a.getWorldPosition(V()), yawOf(a) + extraYaw); }
function mayorPoint(ctx, t, wag = 0) {
  const m = ctx.cast.mayor; m.pose('point', t, { intensity: 0.8 });
  m.joints.armR.rotation.x += 0.15 * wag * Math.sin(t * 13); m.joints.foreArmR.rotation.x += -0.3 * wag * Math.abs(Math.sin(t * 13));
}
/** Mr Finch's living room: table + chair, Finch sipping tea under his personal rain cloud. */
function finchRoom(ctx) {
  const S = ctx.set; S.setLighting?.('day'); S.set?.('window', 'day');
  const R = C(ctx), yaw = yawOf(S.root), P = ctx.props;
  ctx.add(P.table); P.table.position.copy(R(0.1, 0, 0.25)); P.table.rotation.set(0, yaw, 0);
  ctx.add(P.woodChair); P.woodChair.position.copy(R(0.1, 0, -0.45)); P.woodChair.rotation.set(0, yaw, 0);
  putAt(ctx, 'finch', R(0.1, 0, -0.45), yaw);
  ctx.add(P.mug, ctx.cast.finch.joints.handR); P.mug.position.set(0, -0.02, 0.06); P.mug.rotation.set(0, 0, 0);
  ctx.add(P.cloud); P.cloud.position.copy(R(0.1, 2.45, -0.38)); P.cloud.rotation.set(0, 0, 0); P.cloud.scale.setScalar(1);
  return { R, yaw };
}
function finchSip(ctx, t, sipAt = []) {
  const f = ctx.cast.finch;
  f.pose('sit', t, { hands: 'table', tableY: 0.78, intensity: 0.3 });
  const h = lastBefore(sipAt, t + 0.35); const d = h != null ? t - h : 9;
  const k = d > -0.35 && d < 1.0 ? (d < 0 ? ease.inOutCubic(1 + d / 0.35) : d < 0.6 ? 1 : 1 - ease.inOutCubic((d - 0.6) / 0.4)) : 0;
  f.joints.armR.rotation.x += -0.9 * k; f.joints.foreArmR.rotation.x += -1.25 * k; f.joints.armR.rotation.z += 0.25 * k;
  f.joints.head.rotation.x += -0.12 * k;
  f.face('neutral', 1.5);
}
const finchCloud = (ctx, t) => ctx.props.cloud.userData.set(t, 0.95);

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, if you walk far enough in any direction, you bonk into the sky."
  {
    name: 'walk to the wall', start: 0, set: 'town',
    setup(ctx) { dayTown(ctx); const E = EDGE(ctx); placePanel(ctx, E); ctx.store = { E }; },
    update(ctx, lt, u) {
      const { E } = ctx.store, me = ctx.cast.me, tb = ctx.markers.bonk;
      const z = 0.45 + (tb - ctx.t) * WALK_SPEED * 1.25;
      putAt(ctx, 'me', E(0.3, 0, z), E.yaw + Math.PI); me.pose('walk', ctx.t, { speed: 1.25 }); me.face('smile', ctx.t);
      moveCam(ctx, { pos: E(0.9, 1.5, 15.5), look: E(1.2, 7.2, 0), fov: 60 }, { pos: E(0.8, 1.4, 12.5), look: E(1.0, 7.0, 0), fov: 58 }, u);
    },
  },
  {
    name: 'bonk', start: 'b01.w8-0.15', set: 'town',
    setup(ctx) { dayTown(ctx); const E = EDGE(ctx); placePanel(ctx, E); ctx.store = { E }; ctx.add(ctx.props.burst.root); },
    update(ctx) {
      const { E } = ctx.store, me = ctx.cast.me, tb = ctx.markers.bonk, d = ctx.t - tb;
      const z = d < 0 ? 0.45 + -d * WALK_SPEED * 1.25 : 0.45 + 0.55 * ease.outCubic(clamp(d / 0.35, 0, 1));
      putAt(ctx, 'me', E(0.3, 0, z), E.yaw + Math.PI);
      if (d < 0) { me.pose('walk', ctx.t, { speed: 1.25 }); me.face('smile', ctx.t); }
      else { me.pose('surprised', 0.2 + d * 0.5); me.face(d < 0.3 ? 'huss' : 'shocked', 0.5); me.joints.torso.rotation.x += -0.25 * Math.exp(-d * 4); }
      ctx.props.panel.userData.wobble(ctx.t, tb);
      const B = ctx.props.burst; B.root.position.copy(E(0.3, 1.62, 0.06)); B.root.rotation.set(Math.PI / 2, 0, 0); B.root.rotation.y = 0; B.root.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, E.yaw, 0, 'YXZ')); B.update(clamp(d / 0.4, 0, 1)); B.root.visible = d > 0 && d < 0.4;
      setCam(ctx, { pos: E(3.6, 1.45, 2.4), look: E(0.1, 1.35, 0.7), fov: 42 });
      if (d > 0) { ctx.cam.shake(0.6 * Math.exp(-d * 3), ctx.t, 7); stamp(ctx, 'BONK.', tb, { fill: '#ffffff', stroke: '#000000', size: 190, y: 0.22 }); }
    },
  },
  // ── b02 HUSS ×3 — staggering back, rubbing his forehead; a painted cloud comes loose
  ...hussShots('b02', 3, (i) => ({
    name: `stagger #${i + 1}`, set: 'town',
    setup(ctx) { dayTown(ctx); const E = EDGE(ctx); placePanel(ctx, E); ctx.store = { E }; },
    update(ctx) {
      const { E } = ctx.store, me = ctx.cast.me, hits = hitsOf(ctx, 'b02'), n = hits.filter((h) => h <= ctx.t).length;
      const h = lastBefore(hits, ctx.t), dh = h != null ? ctx.t - h : 9;
      const z = 1.0 + 0.4 * (n - 1 + ease.outCubic(clamp(dh / 0.15, 0, 1))) * (n > 0 ? 1 : 0);
      const turn = ease.inOutCubic(prog(ctx.t, hits[0] - 0.12, hits[0] + 0.12));
      putAt(ctx, 'me', E(0.3 + 0.12 * Math.sin(ctx.t * 9), 0, z), E.yaw + Math.PI * (1 - turn) + 0.55 * turn);
      rubForehead(me, ctx.t); me.face(dh < 0.15 ? 'huss' : 'shocked', 0.4);
      ctx.props.panel.userData.wobble(ctx.t, ctx.markers.bonk);
      const tilt = [0, 0.32, 0.75, 1.3][n], prev = [0, 0, 0.32, 0.75][n];
      const LC = ctx.props.panel.userData.looseCloud; LC.rotation.z = -lerp(prev, tilt, ease.outBack(clamp(dh / 0.18, 0, 1))) - 0.03 * Math.sin(ctx.t * 7);
      const face = humanFace(me);
      const cams = [{ pos: E(1.5, 1.55, 4.9), look: E(0.35, 1.5, 1.5), fov: 38 }, { pos: E(2.4, 0.5, 8.0), look: E(-0.6, 6.0, 0), fov: 56 }, { pos: E(-1.3, 1.6, 4.0), look: face, fov: 34 }];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
    },
  })),
  // ── b03 "It's a wall. A painted wall. Clouds, sunset, one very lazy bird."
  {
    name: 'the wall goes all the way round', start: 'b03-0.1', set: 'town',
    setup(ctx) { dayTown(ctx); const L = T(ctx), R = ctx.props.ring; ctx.add(R); R.position.copy(L(-4, 0, -2)); R.rotation.set(0, L.yaw, 0); ctx.store = { L }; },
    update(ctx, lt) {
      const { L } = ctx.store;
      const u = ease.inOutCubic(prog(ctx.t, ctx.time('b03') + 0.1, ctx.time('b03.w8') - 0.2));
      ctx.cam.move({ pos: L(-27, 1.6, 1.0), look: L(-75, 9, -1), fov: 55 }, { pos: L(30, 58, 52), look: L(-40, 4, -18), fov: 52 }, u);
      tag(ctx, 'A PAINTED WALL', ctx.time('b03.w3'), Infinity, { y: 0.16 });
    },
  },
  {
    name: 'lazy bird', start: 'b03.w8-0.1', set: 'town',
    setup(ctx) { dayTown(ctx); const E = EDGE(ctx); placePanel(ctx, E); ctx.store = { E }; },
    update(ctx, lt) {
      const { E } = ctx.store, b = ctx.props.panel.userData.birdPos;
      ctx.props.panel.userData.bird.rotation.z = 0.42 + 0.04 * Math.sin(ctx.t * 2.2);
      moveCam(ctx, { pos: E(b.x + 0.4, b.y - 0.6, 10.5), look: E(b.x, b.y + 0.1, 0), fov: 38 }, { pos: E(b.x + 0.3, b.y - 0.4, 7.5), look: E(b.x, b.y + 0.1, 0), fov: 38 }, prog(lt, 0, 1.4));
    },
  },
  // ── b04 "The grown-ups have three rules. Don't touch the sky. Don't peel the sky. And never, ever knock on the sky."
  {
    name: 'sky rules wide', start: 'b04-0.1', set: 'town',
    setup(ctx) { dayTown(ctx); ctx.store = mayorStage(ctx); },
    update(ctx, lt) {
      const { S, ids } = ctx.store; mayorPoint(ctx, ctx.t); ctx.cast.mayor.face('determined', ctx.t);
      ids.forEach((id, k) => { const c = ctx.cast[id]; c.pose('idle', ctx.t + k, { intensity: 0.4 }); c.face('neutral', ctx.t + k); });
      moveCam(ctx, { pos: S(1.2, 0.9, 14.5), look: S(0, 2.6, -1.2), fov: 46 }, { pos: S(1.0, 0.9, 12.5), look: S(0, 2.7, -1.2), fov: 46 }, prog(lt, 0, 2));
    },
  },
  {
    name: 'mayor low angle', start: 'r1-0.3', set: 'town',
    setup(ctx) { dayTown(ctx); ctx.store = mayorStage(ctx); },
    update(ctx, lt) {
      const { S } = ctx.store; mayorPoint(ctx, ctx.t, 1); ctx.cast.mayor.face('determined', ctx.t);
      moveCam(ctx, { pos: S(1.4, -0.35, 5.2), look: S(0.2, 2.5, 0.5), fov: 52 }, { pos: S(1.2, -0.35, 4.8), look: S(0.2, 2.6, 0.5), fov: 52 }, prog(lt, 0, 2.5));
      ruleCards(ctx);
    },
  },
  {
    name: 'never ever knock', start: 'b04.w13-0.1', set: 'town',
    setup(ctx) { dayTown(ctx); ctx.store = mayorStage(ctx); },
    update(ctx, lt) {
      const { S } = ctx.store, m = ctx.cast.mayor; mayorPoint(ctx, ctx.t, 1.5); m.face(ctx.t > ctx.markers.r3 ? 'shocked' : 'determined', ctx.t);
      const f = humanFace(m);
      moveCam(ctx, { pos: S(0.1, 1.9, 5.4), look: f.clone().add(up(-0.1)), fov: 34 }, { pos: S(0.05, 1.9, 4.6), look: f.clone().add(up(-0.05)), fov: 32 }, prog(lt, 0, 1.6));
      ruleCards(ctx);
    },
  },
  // ── b05 "Mr. Finch peeled a corner once. Now it rains on him. Only him. Indoors."
  {
    name: 'mr finch', start: 'b05-0.1', set: 'room',
    setup(ctx) { ctx.store = finchRoom(ctx); },
    update(ctx, lt) {
      const { R } = ctx.store; finchSip(ctx, ctx.t, [ctx.time('b05') + 0.6]); finchCloud(ctx, ctx.t);
      moveCam(ctx, { pos: R(1.1, 1.55, 4.0), look: R(0.1, 1.45, -0.4), fov: 42 }, { pos: R(0.9, 1.5, 3.4), look: R(0.1, 1.5, -0.4), fov: 42 }, prog(lt, 0, 2.3));
    },
  },
  {
    name: 'it rains on him', start: 'b05.w6-0.1', set: 'room',
    setup(ctx) { ctx.store = finchRoom(ctx); },
    update(ctx, lt) {
      const { R } = ctx.store; finchSip(ctx, ctx.t, [ctx.time('b05.w8') + 0.1]); finchCloud(ctx, ctx.t);
      const f = humanFace(ctx.cast.finch);
      setCam(ctx, { pos: R(-0.35, 1.75, 1.75), look: f.clone().add(up(0.35)), fov: 40 }, 0.6);
    },
  },
  {
    name: 'indoors', start: 'b05.w11-0.1', set: 'room',
    setup(ctx) { ctx.store = finchRoom(ctx); },
    update(ctx, lt) {
      const { R } = ctx.store; finchSip(ctx, ctx.t, [ctx.time('b05.w13') + 0.15]); finchCloud(ctx, ctx.t);
      moveCam(ctx, { pos: R(0.6, 1.6, 2.6), look: R(-0.2, 1.5, -0.8), fov: 44 }, { pos: R(1.2, 2.1, 4.8), look: R(-0.4, 1.4, -1.2), fov: 48 }, prog(lt, 0, 1.4), ease.inOutCubic);
      stamp(ctx, 'INDOORS.', ctx.markers.indoors, { fill: '#4fb3ff', stroke: '#ffffff', size: 150, y: 0.2 });
    },
  },
  // ── b06 "Becky threw a baseball at the sunset. It came back. Signed."
  {
    name: 'becky throws', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx); const E = EDGE(ctx); placePanel(ctx, E);
      const b = putAt(ctx, 'becky', E(1.6, 0, 9.0), E.yaw + Math.PI); ctx.add(ctx.props.pigtails, b.joints.head);
      ctx.add(ctx.props.ball); ctx.props.trail.forEach((m) => ctx.add(m)); ctx.add(ctx.props.ringFx.root);
      ctx.store = { E };
    },
    update(ctx, lt) {
      const { E } = ctx.store, b = ctx.cast.becky, P = ctx.props, tr = ctx.time('b06.w1') + 0.2, th = ctx.time('b06.w7');
      throwPose(b, ctx.t, tr); b.face(ctx.t < tr ? 'determined' : 'grin', ctx.t);
      b.root.updateMatrixWorld(true);
      const sun = E(P.panel.userData.sunPos.x, P.panel.userData.sunPos.y, 0.4);
      const hand = b.joints.handR.getWorldPosition(V());
      const pos = (t) => t < tr ? b.joints.handR.getWorldPosition(V()) : t < th ? quadArc(E(1.4, 2.4, 8.7), sun, 1.2, ease.inQuad(prog(t, tr, th))) : quadArc(sun, E(1.6, 1.2, 8.6), 2.5, prog(t, th, th + 0.9));
      P.ball.position.copy(pos(ctx.t)); P.ball.scale.setScalar(ctx.t > tr ? 1.6 : 1);
      P.trail.forEach((m, k) => { m.position.copy(pos(ctx.t - (k + 1) * 0.035)); m.visible = ctx.t > tr + 0.05; m.scale.setScalar(1.5 - k * 0.15); });
      const R = P.ringFx; R.root.position.copy(sun); R.root.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, E.yaw, 0, 'YXZ')); R.update(prog(ctx.t, th, th + 0.5) * 0.35);
      moveCam(ctx, { pos: E(-0.2, 0.8, 14.2), look: E(3.0, 5.4, 0), fov: 54 }, { pos: E(-0.1, 0.9, 13.4), look: E(3.4, 5.8, 0), fov: 54 }, prog(lt, 0, 2));
      void hand;
    },
  },
  {
    name: 'it came back', start: 'b06.w7-0.15', set: 'town',
    setup(ctx) {
      dayTown(ctx); const E = EDGE(ctx); placePanel(ctx, E);
      const b = putAt(ctx, 'becky', E(1.6, 0, 9.0), E.yaw + Math.PI); ctx.add(ctx.props.pigtails, b.joints.head);
      ctx.add(ctx.props.ball); ctx.store = { E };
    },
    update(ctx) {
      const { E } = ctx.store, b = ctx.cast.becky, P = ctx.props, th = ctx.time('b06.w7'), tc = ctx.markers.back;
      const caught = ctx.t >= tc;
      holdPose(b, ctx.t); b.face(caught ? 'shocked' : 'neutral', 0.5);
      const hands = ballInHands(ctx, b);
      const sun = E(P.panel.userData.sunPos.x, P.panel.userData.sunPos.y, 0.4);
      P.ball.position.copy(caught ? hands : quadArc(sun, hands, 1.5, ease.inQuad(prog(ctx.t, th - 0.1, tc)))); P.ball.scale.setScalar(caught ? 1.1 : 1.5);
      P.ball.rotation.set(0, E.yaw + 2.2, 0);
      setCam(ctx, { pos: E(2.6, 1.55, 5.6), look: E(1.6, 1.35, 9.0), fov: 40 });
    },
  },
  // ── b07 "It said, nice arm. Love, Management."
  {
    name: 'signed ball', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx); const E = EDGE(ctx); placePanel(ctx, E);
      const b = putAt(ctx, 'becky', E(1.6, 0, 9.0), E.yaw + Math.PI); ctx.add(ctx.props.pigtails, b.joints.head);
      ctx.add(ctx.props.ball); ctx.store = { E };
    },
    update(ctx, lt) {
      const { E } = ctx.store, b = ctx.cast.becky, P = ctx.props;
      holdPose(b, 0.5); b.face('shocked', 0.5);
      const hands = ballInHands(ctx, b); P.ball.position.copy(hands); P.ball.scale.setScalar(1.25);
      P.ball.rotation.set(0, E.yaw + Math.PI * 1.5, 0);
      moveCam(ctx, { pos: hands.clone().add(E(0, 0.12, 0).sub(E(0, 0, 0))).addScaledVector(E.fwd, -1.05), look: hands, fov: 34 }, { pos: hands.clone().add(up(0.1)).addScaledVector(E.fwd, -0.85), look: hands, fov: 34 }, prog(lt, 0, 2.5));
      quoteCard(ctx, 'Nice arm.', 'Management', ctx.time('b07.w2') - 0.1, ctx.time('b08') - 0.12, { y: 0.3, byAt: ctx.markers.mgmt - 0.05 });
    },
  },
  // ── b08 HUSS ×3 — Becky stunned; behind her the crowd turns to look up at the sky wall
  ...hussShots('b08', 3, (i) => ({
    name: `crowd looks up #${i + 1}`, set: 'town',
    setup(ctx) {
      dayTown(ctx); const E = EDGE(ctx); placePanel(ctx, E);
      const b = putAt(ctx, 'becky', E(1.6, 0, 9.0), E.yaw + Math.PI); ctx.add(ctx.props.pigtails, b.joints.head);
      ctx.add(ctx.props.ball);
      const ids = EXTRA_IDS.slice(4, 13);
      ids.forEach((id, k) => { const col = k % 3, row = Math.floor(k / 3); putAt(ctx, id, E(0.2 + col * 1.4 + (row % 2) * 0.5, 0, 11.6 + row * 1.5), E.yaw); });
      ctx.store = { E, ids };
    },
    update(ctx) {
      const { E, ids } = ctx.store, b = ctx.cast.becky, hits = hitsOf(ctx, 'b08'), t0 = hits[0] - 0.12, t1 = hits[2] + 0.3;
      holdPose(b, 0.5, 'stunned'); b.face('shocked', 0.5); ctx.props.ball.position.copy(ballInHands(ctx, b)); ctx.props.ball.scale.setScalar(1.1);
      ids.forEach((id, k) => {
        const c = ctx.cast[id], u = ease.inOutCubic(prog(ctx.t, t0 + k * 0.05, t1 + k * 0.04));
        c.root.rotation.set(0, E.yaw + Math.PI * u + (hash(k) - 0.5) * 0.3, 0);
        c.pose('stunned', ctx.t + k, { headPitch: -0.55 * u }); c.face(u > 0.5 ? 'shocked' : 'neutral', 0.7);
      });
      const cams = [{ pos: E(2.0, 1.55, 6.6), look: E(1.6, 1.4, 9.8), fov: 40 }, { pos: E(1.8, 0.6, 7.4), look: E(1.7, 2.2, 13), fov: 44 }, { pos: E(1.6, 0.9, 19.5), look: E(2.5, 7.0, 0), fov: 56 }];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
    },
  })),
  // ── b09 "Yesterday my cat squeezed through a crack in the sky behind the park."
  {
    name: 'cat to the crack', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx, 'dusk'); const F = PARK(ctx); placePanel(ctx, F, '#ffc6a8');
      const cr = ctx.props.crack; ctx.add(cr); cr.position.copy(F(1.0, 0.0, 0.02)); cr.rotation.set(0, F.yaw, 0); cr.userData.set(0.25, 1);
      ctx.place('cat', F(0, 0, 0)); ctx.store = { F };
    },
    update(ctx, lt) {
      const { F } = ctx.store, cat = ctx.cast.cat, t0 = ctx.time('b09'), t1 = ctx.time('b09.w6');
      const u = prog(ctx.t, t0, t1 + 0.5), a = F(-1.6, 0, 7.5), b = F(1.0, 0, 0.6);
      cat.root.position.copy(a.clone().lerp(b, u)); cat.root.rotation.set(0, F.yaw + Math.PI + Math.atan2(2.6, 6.9) * -1 + Math.PI, 0);
      cat.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      cat.pose('hop', (ctx.t * 2.2) % 1.3, { height: 0.12 }); cat.face('neutral', ctx.t);
      moveCam(ctx, { pos: F(-3.0, 0.45, 10.5), look: F(0.4, 3.0, 0), fov: 56 }, { pos: F(-2.6, 0.5, 9.5), look: F(0.6, 3.2, 0), fov: 56 }, prog(lt, 0, 1.8));
    },
  },
  {
    name: 'cat squeezes in', start: 'b09.w6-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx, 'dusk'); const F = PARK(ctx); placePanel(ctx, F, '#ffc6a8');
      const cr = ctx.props.crack; ctx.add(cr); cr.position.copy(F(1.0, 0.0, 0.02)); cr.rotation.set(0, F.yaw, 0);
      ctx.add(ctx.props.crackLight); ctx.props.crackLight.position.copy(F(1.0, 0.9, 0.6));
      ctx.place('cat', F(0, 0, 0)); ctx.store = { F };
    },
    update(ctx, lt) {
      const { F } = ctx.store, cat = ctx.cast.cat, t0 = ctx.time('b09.w6') - 0.1;
      const walk = prog(ctx.t, t0, t0 + 0.8), sq = prog(ctx.t, t0 + 0.8, t0 + 1.8);
      cat.root.position.copy(F(1.0 + 0.4 * (1 - walk), 0, 0.6 * (1 - walk) + 0.15 - 0.75 * sq));
      cat.root.rotation.set(0, F.yaw + Math.PI, 0); cat.root.scale.set(1 - 0.55 * Math.sin(Math.PI * Math.min(1, sq * 1.5)), 1, 1);
      if (sq > 0) { cat.pose('loaf', ctx.t); } else cat.pose('hop', (ctx.t * 2.2) % 1.3, { height: 0.1 });
      cat.face('neutral', ctx.t);
      ctx.props.crack.userData.set(0.25 + 0.25 * Math.sin(Math.PI * sq), 1);
      setCam(ctx, { pos: F(2.3, 0.45, 2.4), look: F(1.0, 0.55, 0), fov: 42 }, 0.5);
    },
  },
  // ── b10 "I followed him. Behind the crack, there was a tiny door. It said, Staff Only."
  {
    name: 'i followed him', start: 'b10-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx, 'dusk'); const F = PARK(ctx); placePanel(ctx, F, '#ffc6a8');
      const cr = ctx.props.crack; ctx.add(cr); cr.position.copy(F(1.0, 0.0, 0.02)); cr.rotation.set(0, F.yaw, 0); cr.userData.set(0.3, 1);
      ctx.store = { F };
    },
    update(ctx, lt) {
      const { F } = ctx.store, me = ctx.cast.me, t0 = ctx.time('b10') - 0.1;
      const z = lerp(4.2, 1.2, prog(ctx.t, t0, t0 + 1.2));
      putAt(ctx, 'me', F(1.15, 0, z), F.yaw + Math.PI); me.pose('walk', ctx.t, { speed: 1.1 }); me.face('determined', ctx.t);
      setCam(ctx, { pos: F(0.0, 1.0, 6.8), look: F(1.0, 1.6, 0), fov: 46 }, 0.6);
    },
  },
  {
    name: 'peering in', start: 'b10.w3-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx, 'dusk'); const F = PARK(ctx); placePanel(ctx, F, '#ffc6a8');
      const cr = ctx.props.crack; ctx.add(cr); cr.position.copy(F(1.0, 0.0, 0.02)); cr.rotation.set(0, F.yaw, 0); cr.userData.set(0.45, 1);
      ctx.add(ctx.props.crackLight); ctx.props.crackLight.position.copy(F(1.0, 1.5, 0.4));
      putAt(ctx, 'me', F(1.1, 0, 0.75), F.yaw + Math.PI);
      ctx.store = { F };
    },
    update(ctx, lt) {
      const { F } = ctx.store, me = ctx.cast.me;
      me.pose('peer', ctx.t, { tableY: 1.0 }); me.face('squint', 0.3);
      ctx.props.crack.userData.set(0.45 + 0.05 * Math.sin(ctx.t * 6), 1);
      setCam(ctx, { pos: F(2.3, 1.45, 2.0), look: F(1.0, 1.35, 0.35), fov: 36 }, 0.5);
    },
  },
  {
    name: 'tiny door', start: 'b10.w8-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx, 'dusk'); const F = PARK(ctx); placePanel(ctx, F, '#ffc6a8');
      const cr = ctx.props.crack; ctx.add(cr); cr.position.copy(F(1.0, 0.0, 0.01)); cr.rotation.set(0, F.yaw, 0); cr.userData.set(1, 0.9); cr.scale.set(1.6, 0.8, 1);
      const D = ctx.props.door; ctx.add(D); D.position.copy(F(1.0, 0, 0.02)); D.rotation.set(0, F.yaw, 0); D.userData.open(0);
      putAt(ctx, 'me', F(2.25, 0, 0.9), F.yaw + Math.PI - 0.9);
      ctx.add(ctx.props.crackLight); ctx.props.crackLight.position.copy(F(1.0, 1.2, 0.8));
      ctx.store = { F };
    },
    update(ctx, lt) {
      const { F } = ctx.store, me = ctx.cast.me, ts = ctx.markers.staff;
      me.pose('idle', ctx.t, { intensity: 0.3, lookAt: F(1.0, 1.0, 0) }); me.face('shocked', 0.4);
      moveCam(ctx, { pos: F(0.3, 0.75, 4.6), look: F(1.3, 1.05, 0), fov: 44 }, { pos: F(0.85, 1.0, 2.0), look: F(1.0, 1.0, 0), fov: 40 }, prog(ctx.t, ctx.time('b10.w8'), ts - 0.05), ease.inOutCubic, 0.6);
      tag(ctx, 'STAFF ONLY', ts, Infinity, { y: 0.17, fill: '#e8232b', bg: 'rgba(251,246,236,0.95)', stroke: '#1d1d22', size: 96 });
    },
  },
  // ── b11 "So obviously, I went in."
  {
    name: 'obviously', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx, 'dusk'); const F = PARK(ctx); placePanel(ctx, F, '#ffc6a8');
      const cr = ctx.props.crack; ctx.add(cr); cr.position.copy(F(1.0, 0.0, 0.01)); cr.rotation.set(0, F.yaw, 0); cr.userData.set(1, 0.9); cr.scale.set(1.6, 0.8, 1);
      const D = ctx.props.door; ctx.add(D); D.position.copy(F(1.0, 0, 0.02)); D.rotation.set(0, F.yaw, 0);
      ctx.add(ctx.props.crackLight); ctx.props.crackLight.position.copy(F(1.0, 1.2, 0.8));
      ctx.store = { F };
    },
    update(ctx, lt) {
      const { F } = ctx.store, me = ctx.cast.me, t0 = ctx.time('b11'), tt = ctx.time('b11.w2'), to = ctx.time('b11.w4');
      const turn = ease.inOutCubic(prog(ctx.t, tt - 0.1, tt + 0.25));
      putAt(ctx, 'me', F(1.75, 0, 1.05 - 0.25 * prog(ctx.t, tt, to)), F.yaw + lerp(0.15, Math.PI - 0.45, turn));
      if (turn < 0.5) { me.pose('shrug', ctx.t - t0 + 0.2); me.face('smug', 0.4); }
      else { me.pose('point', ctx.t, { intensity: 0.6 }); me.face('determined', ctx.t); }
      ctx.props.door.userData.open(ease.outCubic(prog(ctx.t, to - 0.15, to + 0.25)));
      setCam(ctx, { pos: F(1.85, 1.4, 3.6), look: F(1.45, 1.2, 0.6), fov: 40 }, 0.6);
      const w = prog(ctx.t, to, ctx.time('b11.end') + 0.2); if (w > 0) ctx.fx.overlay('#ffffff', ease.inQuad(w));
    },
  },
  // ── b12 "A giant control room. Hundreds of levers. Sunrise. Rain. Tuesday. Gravity, do not touch."
  {
    name: 'giant control room', start: 'b11.end+0.22', set: 'control',
    setup(ctx) { const st = controlRoom(ctx); kidAt(ctx, st.Cc, -14.4, 1.9, Math.PI / 2 + 0.35); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, me = ctx.cast.me; seatPigeon(ctx, Math.PI); ctx.cast.pigeon.pose('idle', ctx.t);
      me.pose('idle', ctx.t, { headYaw: 0.5 * Math.sin(lt * 1.6), headPitch: -0.25 }); me.face('shocked', 0.4);
      moveCam(ctx, { pos: Cc(-15.3, 1.3, 3.7), look: Cc(-2, 2.6, -2.8), fov: 62 }, { pos: Cc(-15.0, 1.6, 3.5), look: Cc(-2, 2.9, -2.8), fov: 60 }, prog(lt, 0, 1.4), ease.inOutSine, 0.8);
      const w = 1 - prog(lt, 0, 0.45); if (w > 0) ctx.fx.overlay('#ffffff', w);
    },
  },
  {
    name: 'hundreds of levers', start: 'b12.w4-0.1', set: 'control',
    setup(ctx) { ctx.store = controlRoom(ctx); },
    update(ctx, lt) {
      const { Cc } = ctx.store; seatPigeon(ctx, Math.PI);
      moveCam(ctx, { pos: Cc(-12.5, 0.95, -2.75), look: Cc(-4, 1.05, -3.95), fov: 48 }, { pos: Cc(-9.5, 1.05, -2.75), look: Cc(-1, 1.1, -3.95), fov: 48 }, prog(lt, 0, 1.3), ease.linear, 0.8);
    },
  },
  {
    name: 'sunrise rain tuesday', start: 'b12.w7-0.1', set: 'control',
    setup(ctx) { ctx.store = controlRoom(ctx); },
    update(ctx, lt) {
      const { Cc } = ctx.store, S = ctx.set;
      const keys = [[ctx.time('b12.w7'), NAMED.SUNRISE, 'SUNRISE'], [ctx.time('b12.w8'), NAMED.RAIN, 'RAIN'], [ctx.time('b12.w9'), NAMED.TUESDAY, 'TUESDAY']];
      let x = NAMED.SUNRISE - 0.25;
      keys.forEach(([t, kx], k) => { if (k > 0) x = lerp(x, kx, ease.inOutCubic(prog(ctx.t, t - 0.3, t + 0.05))); });
      x += 0.12 * (ctx.t - keys[0][0]);
      for (const [t, , name] of keys) { const d = ctx.t - t; const L = S.levers[name]; L.plate.scale.setScalar(d > 0 && d < 0.25 ? 1 + 0.15 * Math.sin(Math.PI * d / 0.25) : 1); }
      setCam(ctx, { pos: Cc(x + 0.15, 1.75, -1.25), look: Cc(x, 1.55, -3.9), fov: 42 }, 0.9);
    },
  },
  {
    name: 'gravity do not touch', start: 'b12.w10-0.1', set: 'control',
    setup(ctx) { ctx.store = controlRoom(ctx); const r = ctx.props.redLight; ctx.add(r); r.position.copy(ctx.store.Cc(NAMED.GRAVITY, 1.6, -2.9)); r.intensity = 5; },
    update(ctx, lt) {
      const { Cc } = ctx.store, g = NAMED.GRAVITY;
      ctx.props.redLight.intensity = 4 + 2 * Math.sin(ctx.t * 6);
      moveCam(ctx, { pos: Cc(g + 0.7, 0.55, -1.5), look: Cc(g, 1.45, -3.9), fov: 44 }, { pos: Cc(g + 0.45, 0.65, -2.1), look: Cc(g, 1.5, -3.9), fov: 42 }, prog(lt, 0, 1.6), ease.inOutSine, 0.5);
    },
  },
  // ── b13 "And in the big spinny chair, wearing headphones... a pigeon."
  {
    name: 'the chair', start: 'b13-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx); kidAt(ctx, st.Cc, -2.3, 3.0, Math.PI - 0.5); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, me = ctx.cast.me; seatPigeon(ctx, Math.PI); ctx.cast.pigeon.pose('idle', ctx.t);
      me.pose('idle', ctx.t, { intensity: 0.3 }); me.face('shocked', 0.4);
      moveCam(ctx, { pos: Cc(-0.4, 1.3, 6.4), look: Cc(0, 2.4, -3.5), fov: 52 }, { pos: Cc(-0.3, 1.25, 5.6), look: Cc(0, 2.3, -3.5), fov: 52 }, prog(lt, 0, 1.5), ease.inOutSine, 0.8);
    },
  },
  {
    name: 'chair turns', start: 'b13.w6-0.2', set: 'control',
    setup(ctx) { ctx.store = controlRoom(ctx); },
    update(ctx, lt) {
      const { Cc } = ctx.store, p = ctx.cast.pigeon, tp = ctx.markers.pigeon;
      const spin = Math.PI * (1 - ease.inOutCubic(prog(ctx.t, tp - 0.75, tp - 0.02)));
      seatPigeon(ctx, spin); p.pose('idle', 1.2); p.face('smug', 1.0);
      const a = { pos: Cc(0.25, 1.35, 3.4), look: Cc(0, 1.2, -0.7), fov: 40 }, b = { pos: Cc(0.12, 1.3, 1.75), look: Cc(0, 1.42, -0.6), fov: 38 };
      moveCam(ctx, a, b, prog(ctx.t, ctx.time('b13.w6') - 0.2, tp + 0.1), ease.inOutSine, 0.9);
      ctx.cam.punch([tp], ctx.t, 0.14, 0.3);
    },
  },
  // ── b14 HUSS ×6 — staredown: kid / pigeon / kid / pigeon … the sunglasses slide down on the sixth
  ...hussShots('b14', 6, (i) => ({
    name: `staredown #${i + 1}`, set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { spin: 0 }); kidAt(ctx, st.Cc, 0.1, 2.3, Math.PI); ctx.store = st; },
    update(ctx) {
      const { Cc } = ctx.store, hits = hitsOf(ctx, 'b14'), h = lastBefore(hits, ctx.t), dh = h != null ? ctx.t - h : 9;
      const me = ctx.cast.me, p = ctx.cast.pigeon;
      seatPigeon(ctx, 0); p.pose('idle', 1.2); p.face(dh < 0.15 ? 'shocked' : 'neutral', 1.0);
      me.pose('surprised', 0.3, { intensity: 0.6 }); me.face(dh < 0.12 ? 'huss' : 'shocked', 0.4);
      if (i === 5) { const k = ease.outBounce ? ease.outBounce(prog(ctx.t, hits[5], hits[5] + 0.25)) : ease.outCubic(prog(ctx.t, hits[5], hits[5] + 0.25)); dressPigeon(ctx, k); p.face('shocked', 1.0); }
      const kf = humanFace(me), ph = pigeonHead(ctx);
      const cams = [
        { pos: Cc(0.45, 1.45, 0.05), look: kf, fov: 34 },
        { pos: Cc(-0.35, 1.5, 1.55), look: ph, fov: 30 },
        { pos: Cc(-0.4, 1.35, 0.2), look: kf, fov: 30 },
        { pos: Cc(0.4, 1.45, 1.35), look: ph, fov: 28 },
        { pos: Cc(0.1, 1.55, 0.6), look: kf, fov: 26 },
        { pos: ph.clone().add(V(0.05, 0.02, 0.85)), look: ph.clone().add(up(0.02)), fov: 30 },
      ];
      setCam(ctx, cams[i], 0.9); ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
    },
  })),
  // ── b15 "I screamed. He screamed. I fell backwards, right onto Gravity."
  {
    name: 'i screamed', start: 'b15-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { spin: 0 }); kidAt(ctx, st.Cc, 0.1, 2.3, Math.PI); ctx.store = st; },
    update(ctx) {
      const { Cc } = ctx.store, me = ctx.cast.me; seatPigeon(ctx, 0); ctx.cast.pigeon.pose('idle', 1.2); ctx.cast.pigeon.face('shocked', 1);
      me.pose('surprised', ctx.t, { intensity: 1 }); me.face('huss', 0.4);
      setCam(ctx, { pos: Cc(0.7, 1.3, 0.3), look: humanFace(me).add(up(-0.15)), fov: 40 }, 0.9);
      ctx.cam.shake(0.25, ctx.t, 3);
    },
  },
  {
    name: 'he screamed', start: 'b15.w2-0.1', set: 'control',
    setup(ctx) { ctx.store = controlRoom(ctx, { spin: 0 }); },
    update(ctx) {
      const { Cc } = ctx.store, p = ctx.cast.pigeon; seatPigeon(ctx, 0); p.pose('flap', ctx.t); p.face('huss', 1);
      setCam(ctx, { pos: Cc(-0.55, 1.55, 1.75), look: pigeonHead(ctx).add(up(-0.12)), fov: 36 }, 0.9);
      ctx.cam.shake(0.25, ctx.t, 4);
    },
  },
  {
    name: 'fell backwards', start: 'b15.w4-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { spin: 0.8 }); ctx.store = st; },
    update(ctx) {
      const { Cc } = ctx.store, me = ctx.cast.me, tf = ctx.time('b15.w5'), tg = ctx.markers.gravity;
      seatPigeon(ctx, 0.8); ctx.cast.pigeon.pose('flap', ctx.t); ctx.cast.pigeon.face('huss', 1);
      const k = ease.inCubic(prog(ctx.t, tf, tg)), g = NAMED.GRAVITY;
      const base = Cc(g + 0.35, 0, -2.55 + 0.25 * k);
      ctx.place('me', base); me.root.rotation.set(-0.62 * k, 0.45, 0, 'YXZ');
      me.pose('surprised', ctx.t * 1.3, { intensity: 1 }); me.face('huss', 0.4);
      me.joints.armL.rotation.x += 0.8 * k; me.joints.armR.rotation.x += 0.8 * k;
      setCam(ctx, { pos: Cc(g + 3.4, 1.35, 0.8), look: Cc(g + 0.2, 1.1, -2.9), fov: 44 }, 0.9);
    },
  },
  {
    name: 'gravity off', start: 'gravity-0.12', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { pigeon: false, chair: false }); ctx.store = st; ctx.add(ctx.props.redLight); },
    update(ctx) {
      const { Cc } = ctx.store, S = ctx.set, tg = ctx.markers.gravity, g = NAMED.GRAVITY, d = ctx.t - tg;
      S.setLever('GRAVITY', 1 - ease.outCubic(clamp(d / 0.1, 0, 1)));
      S.set('alarm', d > 0.05 ? 1 : 0); S.set('screens', d > 0.05 ? 'alert' : 'day');
      const me = ctx.cast.me; ctx.place('me', Cc(g + 0.35, 0, -2.3)); me.root.rotation.set(-0.62, 0.45, 0, 'YXZ'); me.pose('surprised', 0.4); me.face('shocked', 0.4);
      ctx.props.redLight.position.copy(Cc(g, 1.8, -2.6)); ctx.props.redLight.intensity = d > 0.05 ? 8 * (0.6 + 0.4 * Math.abs(Math.sin(ctx.t * 5.5))) : 0;
      setCam(ctx, { pos: Cc(g - 0.9, 1.0, -2.2), look: Cc(g, 1.35, -3.9), fov: 44 }, 0.7);
      if (d > 0) { ctx.cam.shake(0.4 * Math.exp(-d * 2), ctx.t, 11); stamp(ctx, 'GRAVITY: OFF', tg + 0.05, { size: 130, y: 0.2, fill: '#ff2a2a', stroke: '#ffffff' }); }
    },
  },
  // ── b16 "Outside, the whole town floated up. The bakery. The mayor. Mr. Finch and his little rain cloud."
  {
    name: 'town floats up', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx, 'dusk'); const L = T(ctx), P = ctx.props;
      ctx.add(P.bakery); P.bakery.rotation.set(0, L.yaw + Math.PI, 0);
      for (const [h, x, z] of [[P.fh1, -10, 26], [P.fh2, 16, 30], [P.fh3, -22, 28]]) { ctx.add(h); h.position.copy(L(x, 0, z)); h.rotation.set(0, L.yaw + Math.PI, 0); }
      const ids = EXTRA_IDS.slice(0, 9);
      ids.forEach((id, k) => putAt(ctx, id, L(-1 + (k % 3) * 2.2 + (hash(k) - 0.5), 0, -1.5 + Math.floor(k / 3) * 2.0), L.yaw + Math.PI + (hash(k * 2) - 0.5) * 2));
      ctx.store = { L, ids };
    },
    update(ctx, lt) {
      const { L, ids } = ctx.store, P = ctx.props, t0 = ctx.time('b16');
      ids.forEach((id, k) => {
        const c = ctx.cast[id], tl = t0 + 0.3 + k * 0.12, d = ctx.t - tl;
        const base = L(-1 + (k % 3) * 2.2 + (hash(k) - 0.5), 0, -1.5 + Math.floor(k / 3) * 2.0);
        if (d < 0) { c.root.position.copy(base); c.root.rotation.set(0, L.yaw + Math.PI + (hash(k * 2) - 0.5) * 2, 0); c.pose('surprised', 0.3); c.face('shocked', 0.5); }
        else { const y = 0.6 + d * (1.1 + 0.4 * hash(k)); c.root.position.copy(base).add(up(y)); c.root.rotation.set(0.3 * Math.sin(d + k), L.yaw + k + d * 0.4, 0.2 * Math.sin(d * 0.7 + k)); c.pose('crowdSurf', ctx.t + k, { lift: 0 }); c.face('shocked', 0.5); }
      });
      const lift = (t, s) => Math.max(0, t - t0 - s);
      P.bakery.position.copy(L(3.8, 0.2 + 0.9 * lift(ctx.t, 0.5) ** 1.3, 13.3)); P.bakery.rotation.set(0.06 * Math.sin(ctx.t), L.yaw + Math.PI + 0.1 * lift(ctx.t, 0.5), 0.05 * Math.sin(ctx.t * 0.8));
      [P.fh1, P.fh2, P.fh3].forEach((h, k) => { h.position.y = 5 + k * 2 + 1.1 * lift(ctx.t, 0); h.rotation.z = 0.1 * Math.sin(ctx.t * 0.6 + k); });
      moveCam(ctx, { pos: L(-6.5, 0.8, -4.2), look: L(2.5, 3.6, 6), fov: 56 }, { pos: L(-6.8, 0.7, -4.6), look: L(2.5, 5.2, 7), fov: 58 }, prog(lt, 0, 2.2));
    },
  },
  {
    name: 'the bakery', start: 'b16.w6-0.1', set: 'town',
    setup(ctx) { dayTown(ctx, 'dusk'); const L = T(ctx); ctx.add(ctx.props.bakery); ctx.store = { L }; },
    update(ctx, lt) {
      const { L } = ctx.store, B = ctx.props.bakery, y = 7.5 + 0.9 * lt;
      B.position.copy(L(3.8, y, 13.3)); B.rotation.set(0.08 * Math.sin(ctx.t), L.yaw + Math.PI + 0.25 + 0.1 * lt, 0.1 * Math.sin(ctx.t * 0.8));
      setCam(ctx, { pos: L(1.2, 2.0, 2.2), look: L(3.8, y + 1.5, 13.3), fov: 46 });
    },
  },
  {
    name: 'the mayor', start: 'b16.w8-0.1', set: 'town',
    setup(ctx) { dayTown(ctx, 'dusk'); ctx.store = { L: T(ctx) }; },
    update(ctx, lt) {
      const { L } = ctx.store, m = ctx.cast.mayor;
      ctx.place('mayor', L(-1.2 + 1.3 * lt, 7.4 + 0.5 * lt, 2.0));
      m.root.rotation.set(0, L.yaw - 0.3, Math.PI + 0.35 * lt);
      m.pose('surprised', 0.25); m.face('shocked', 0.5);
      setCam(ctx, { pos: L(1.5, 6.2, -6.0), look: L(-0.2 + 1.3 * lt, 6.5 + 0.5 * lt, 2.0), fov: 42 });
    },
  },
  {
    name: 'finch floats by', start: 'b16.w10-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx, 'dusk'); const L = T(ctx), P = ctx.props;
      ctx.add(P.woodChair2); ctx.place('finch', L(0, 0, 0));
      ctx.add(P.mug2, ctx.cast.finch.joints.handR); P.mug2.position.set(0, -0.02, 0.06);
      ctx.add(P.cloud2);
      ctx.store = { L };
    },
    update(ctx, lt) {
      const { L } = ctx.store, P = ctx.props, f = ctx.cast.finch;
      const p = L(-1.0 + 0.55 * lt, 5.0 + 0.35 * lt, 1.5), e = new THREE.Euler(0.12 * Math.sin(lt * 0.9), L.yaw + 0.5 + 0.1 * lt, 0.15 * Math.sin(lt * 0.7), 'YXZ');
      P.woodChair2.position.copy(p); P.woodChair2.rotation.copy(e);
      f.root.position.copy(p); f.root.rotation.copy(e);
      f.pose('sit', ctx.t, { hands: 'lap', intensity: 0.3 }); f.joints.armR.rotation.x += -0.9; f.joints.foreArmR.rotation.x += -1.1; f.face('neutral', 1.5);
      f.root.updateMatrixWorld(true);
      P.cloud2.position.copy(f.root.localToWorld(V(0, 2.35, 0.08))); P.cloud2.userData.set(ctx.t, 0.95);
      setCam(ctx, { pos: L(1.8, 4.6, -4.2), look: p.clone().add(up(1.4)), fov: 44 });
    },
  },
  // ── b17 "I grabbed Sunrise to steady myself. Then Tuesday. It was Tuesday three times."
  {
    name: 'grab sunrise', start: 'b17-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { pigeon: false, chair: false }); kidAt(ctx, st.Cc, NAMED.SUNRISE + 0.12, -3.0, Math.PI); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, S = ctx.set, me = ctx.cast.me, ts = ctx.markers.sunrise;
      S.set('alarm', 1); S.setLever('GRAVITY', 0);
      const k = ease.inOutCubic(prog(ctx.t, ts - 0.4, ts));
      S.setLever('SUNRISE', k);
      S.set('screens', (i, t) => t < ts ? 'alert' : (Math.floor((t - ts) * 5 + i * 0.5) % 2 ? 'night' : 'day'));
      me.pose('idle', ctx.t, { intensity: 0.5 }); me.face('sweat', ctx.t);
      me.joints.armR.rotation.x += -1.9 - 0.6 * k; me.joints.armR.rotation.z += 0.1; me.joints.armL.rotation.z += -0.6 + 0.2 * Math.sin(ctx.t * 7);
      setCam(ctx, { pos: Cc(NAMED.SUNRISE + 1.9, 1.7, -0.6), look: Cc(NAMED.SUNRISE - 0.1, 1.9, -3.7), fov: 50 }, 0.9);
    },
  },
  {
    name: 'grab tuesday', start: 'b17.w6-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { pigeon: false, chair: false }); kidAt(ctx, st.Cc, NAMED.TUESDAY + 0.12, -3.0, Math.PI); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, S = ctx.set, me = ctx.cast.me, tt = ctx.markers.tuesday;
      S.set('alarm', 1); S.setLever('GRAVITY', 0); S.setLever('SUNRISE', 1);
      const k = ease.inOutCubic(prog(ctx.t, tt - 0.35, tt));
      S.setLever('TUESDAY', k + 0 * Math.sin(ctx.t));
      S.set('screens', (i, t) => t < tt ? (Math.floor(t * 5 + i * 0.5) % 2 ? 'night' : 'day') : ((i + Math.floor((t - tt) * 4)) % 3 === 0 ? 'tuesday' : (Math.floor(t * 5 + i) % 2 ? 'night' : 'day')));
      me.pose('idle', ctx.t, { intensity: 0.5 }); me.face('sweat', ctx.t);
      me.joints.armR.rotation.x += -1.9 - 0.6 * k; me.joints.armL.rotation.x += -1.7;
      setCam(ctx, { pos: Cc(NAMED.TUESDAY - 1.45, 1.55, -2.0), look: Cc(NAMED.TUESDAY + 0.1, 1.7, -3.8), fov: 40 }, 0.9);
      tag(ctx, 'TUESDAY x1', tt, Infinity, { y: 0.16, size: 84, fill: '#ffe14a', bg: 'rgba(10,10,20,0.88)' });
    },
  },
  {
    name: 'tuesday three times', start: 'b17.w10-0.12', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { pigeon: false, chair: false }); kidAt(ctx, st.Cc, 0.3, -1.4, Math.PI); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, S = ctx.set, me = ctx.cast.me, t2 = ctx.time('b17.w10'), t3 = ctx.markers.three;
      S.set('alarm', 0.6); S.setLever('GRAVITY', 0); S.setLever('SUNRISE', 1); S.setLever('TUESDAY', 1);
      S.set('screens', (i, t) => (t > t3 || (i + Math.floor(t * 6)) % 2) ? 'tuesday' : 'day');
      me.pose('stunned', ctx.t, { headPitch: -0.5 }); me.face('shocked', 0.4);
      moveCam(ctx, { pos: Cc(0.6, 0.9, 2.4), look: Cc(0.1, 3.4, -4.3), fov: 54 }, { pos: Cc(0.5, 0.95, 1.8), look: Cc(0.1, 3.5, -4.3), fov: 54 }, prog(lt, 0, 1.2), ease.inOutSine, 0.7);
      const n = ctx.t >= t3 ? 3 : 2, tn = ctx.t >= t3 ? t3 : t2;
      const d = ctx.t - tn, sc = d < 0.12 ? lerp(1.6, 1, ease.outCubic(d / 0.12)) : 1;
      ctx.fx.text(`TUESDAY x${n}`, { x: 0.5, y: 0.16, size: 96, fill: '#ffe14a', stroke: '#000000', bg: 'rgba(10,10,20,0.88)', rot: -0.03, scale: sc });
      ctx.cam.punch([t3], ctx.t, 0.1, 0.25);
    },
  },
  // ── b18 "Then I remembered how my mom fixes the TV. I switched everything off... and on again."
  {
    name: 'remembered', start: 'b18-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { pigeon: false, chair: false }); kidAt(ctx, st.Cc, 8.6, -1.3, 0.25); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, S = ctx.set, me = ctx.cast.me;
      S.set('alarm', 1); S.setLever('GRAVITY', 0); S.set('screens', (i, t) => ((i + Math.floor(t * 5)) % 2 ? 'tuesday' : 'alert'));
      const idea = ctx.time('b18.w5');
      if (ctx.t < idea) { me.pose('think', ctx.t); me.face('sweat', ctx.t); } else { me.pose('idle', ctx.t, { intensity: 0.4 }); me.face('determined', 0.4); }
      const f = humanFace(me);
      moveCam(ctx, { pos: Cc(9.0, 1.45, 1.6), look: f.clone().add(up(0.1)), fov: 40 }, { pos: Cc(8.95, 1.5, 0.6), look: f.clone().add(up(0.05)), fov: 36 }, prog(lt, 0, 2.4), ease.inOutSine, 1.0);
      if (ctx.t > idea) tag(ctx, 'TURN IT OFF AND ON', idea + 0.1, Infinity, { y: 0.17, size: 64 });
    },
  },
  {
    name: 'main switch', start: 'b18.w9-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { pigeon: false, chair: false }); kidAt(ctx, st.Cc, 8.6, -1.95, Math.PI); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, S = ctx.set, me = ctx.cast.me, toff = ctx.markers.off18, ton = ctx.markers.on18;
      const down = ease.inCubic(prog(ctx.t, toff - 0.3, toff)) * (1 - ease.outCubic(prog(ctx.t, ton - 0.25, ton - 0.02)));
      S.setMain(down);
      const dark = ctx.t >= toff && ctx.t < ton;
      const steps = [[0, 0.35], [0.1, 0.0], [0.2, 0.7], [0.3, 0.3], [0.42, 1]];
      let pw = ctx.t < toff ? 1 : 0; if (ctx.t >= ton) for (const [dt, v] of steps) if (ctx.t - ton >= dt) pw = v;
      S.set('power', pw); S.set('alarm', ctx.t < toff ? 1 : 0); S.setLever('GRAVITY', ctx.t < ton ? 0 : 1);
      S.set('screens', ctx.t < toff ? 'alert' : 'day'); S.set('lights', ctx.t >= ton ? (i) => (ctx.t - ton > 0.08 + i * 0.045 ? 1 : 0) : null);
      me.pose('cheer', 0.3, { intensity: 0.4 }); me.face(dark ? 'squint' : 'determined', 0.4);
      me.joints.armL.rotation.x += 0.2 + 1.3 * down; me.joints.armR.rotation.x += 0.2 + 1.3 * down; me.joints.torso.rotation.x += 0.25 * down;
      setCam(ctx, { pos: Cc(7.3, 0.45, 0.2), look: Cc(8.6, 1.75, -2.4), fov: 52 }, ctx.t < toff ? 1 : pw * 0.9);
      if (dark) ctx.fx.overlay('#000000', 0.9);
      if (ctx.t >= toff) tag(ctx, 'OFF...', toff, Infinity, { y: 0.17, size: 96, bg: 'rgba(0,0,0,0)' });
      if (ctx.t >= ton - 0.15) tag(ctx, '...AND ON AGAIN', ton - 0.15, Infinity, { y: 0.25, size: 88, fill: '#3cff6b', bg: 'rgba(0,0,0,0.7)' });
    },
  },
  // ── b19 "Everyone landed. The pigeon gave me a slow clap. With wings."
  {
    name: 'everyone landed', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx, 'day'); const L = T(ctx), P = ctx.props;
      ctx.add(P.bakery); P.bigPuff.root && ctx.add(P.bigPuff.root);
      const ids = EXTRA_IDS.slice(0, 6); ids.forEach((id) => ctx.place(id, L(0, 0, 0)));
      P.puffs.forEach((p) => ctx.add(p.root));
      ctx.store = { L, ids };
    },
    update(ctx, lt) {
      const { L, ids } = ctx.store, P = ctx.props, t0 = ctx.time('b19');
      const land = (tl) => { const d = ctx.t - tl; return d < 0 ? 9.8 * 0.5 * d * d : 0; };
      const tb = t0 + 0.05, db = ctx.t - tb;
      P.bakery.position.copy(L(3.8, Math.min(6, land(tb)) - (db > 0 && db < 0.3 ? 0.15 * Math.sin(Math.PI * db / 0.3) : 0), 13.3)); P.bakery.rotation.set(0, L.yaw + Math.PI, 0);
      P.bigPuff.root.position.copy(L(3.8, 0.1, 11.8)); P.bigPuff.update(prog(ctx.t, tb, tb + 1.1));
      ids.forEach((id, k) => {
        const c = ctx.cast[id], tl = t0 + 0.12 + k * 0.1, d = ctx.t - tl, base = L(-0.8 + (k % 3) * 2.0, 0, -0.5 + Math.floor(k / 3) * 2.4);
        c.root.position.copy(base).add(up(Math.min(8, land(tl)) + (d > 0 && d < 0.25 ? -0.1 * Math.sin(Math.PI * d / 0.25) : 0)));
        c.root.rotation.set(0, L.yaw - 0.4 + k * 0.5, 0);
        if (d < 0) c.pose('cheer', ctx.t + k); else if (d < 0.5) c.pose('stunned', 0.2); else c.pose('clap', ctx.t + k);
        c.face(d < 0.5 ? 'shocked' : 'grin', ctx.t + k);
        const pf = P.puffs[k]; pf.root.position.copy(base).add(up(0.05)); pf.update(prog(ctx.t, tl, tl + 0.7));
      });
      setCam(ctx, { pos: L(-5.5, 2.3, -5.0), look: L(2.6, 1.6, 7.0), fov: 50 });
      if (db > 0 && db < 0.4) ctx.cam.shake(0.5 * (1 - db / 0.4), ctx.t, 21);
    },
  },
  {
    name: 'slow clap', start: 'b19.w2-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { spin: 0 }); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, p = ctx.cast.pigeon; seatPigeon(ctx, 0);
      const claps = [ctx.time('b19.w5'), ctx.time('b19.w8'), ctx.time('b19.w10') + 0.1];
      const h = lastBefore(claps, ctx.t + 0.2), d = h != null ? ctx.t - h : 9;
      const k = d > -0.2 && d < 0.35 ? (d < 0 ? ease.inQuad(1 + d / 0.2) : 1 - ease.outCubic(d / 0.35)) : 0;
      pigeonClap(p, ctx.t, k); p.face('smug', 1.0);
      const ph = pigeonHead(ctx);
      const wide = ctx.t < ctx.time('b19.w9') - 0.05;
      setCam(ctx, wide ? { pos: Cc(0.5, 1.25, 1.7), look: ph.clone().add(up(-0.25)), fov: 40 } : { pos: Cc(-0.35, 1.05, 1.05), look: ph.clone().add(up(-0.35)), fov: 34 }, 0.9);
    },
  },
  // ── b20 HUSS ×3 — the kid cheers, monitors show the town cheering, the pigeon nods
  ...hussShots('b20', 3, (i) => ({
    name: `cheer #${i + 1}`, set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { spin: 0.5 }); kidAt(ctx, st.Cc, 1.6, 0.6, -0.1); ctx.set.set('screens', 'cheer'); ctx.store = st; },
    update(ctx) {
      const { Cc } = ctx.store, hits = hitsOf(ctx, 'b20'), h = lastBefore(hits, ctx.t), dh = h != null ? ctx.t - h : 9;
      const me = ctx.cast.me, p = ctx.cast.pigeon;
      me.pose('cheer', ctx.t); me.face(dh < 0.15 ? 'huss' : 'grin', ctx.t);
      seatPigeon(ctx, 0.5); p.pose('idle', 1.2, { headPitch: dh < 0.2 ? 0.5 * Math.sin(Math.PI * dh / 0.2) : 0 }); p.face('smug', 1);
      const cams = [{ pos: Cc(2.0, 1.2, 4.4), look: Cc(1.4, 2.4, -1.5), fov: 50 }, { pos: pigeonHead(ctx).add(V(0.3, 0.05, 1.0)), look: pigeonHead(ctx), fov: 34 }, { pos: Cc(4.2, 2.1, 4.6), look: Cc(0.8, 1.4, -0.6), fov: 46 }];
      setCam(ctx, cams[i], 0.9); ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
    },
  })),
  // ── b21 "Then I saw the very last lever. It wasn't labeled rain, or sky."
  {
    name: 'the very last lever', start: 'b21-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { pigeon: false, chair: false }); ctx.set.set('power', 0.55); ctx.store = st; },
    update(ctx, lt, u) {
      const { Cc } = ctx.store; ctx.set.set('lastSpot', prog(ctx.t, ctx.time('b21.w5'), ctx.time('b21.w7')));
      moveCam(ctx, { pos: Cc(5.5, 1.55, -2.3), look: Cc(9, 1.3, -3.9), fov: 46 }, { pos: Cc(LAST_X - 1.3, 1.6, -1.2), look: Cc(LAST_X, 1.55, -3.7), fov: 44 }, u, ease.inOutSine, 0.4);
    },
  },
  // ── b22 "It said, the person watching this. And it's switched on."
  {
    name: 'the person watching this', start: 'b22-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { pigeon: false, chair: false }); ctx.set.set('power', 0.5); ctx.set.set('lastSpot', 1); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store;
      moveCam(ctx, { pos: Cc(LAST_X + 0.15, 1.65, -1.9), look: Cc(LAST_X, 1.68, -3.7), fov: 40 }, { pos: Cc(LAST_X + 0.08, 1.66, -2.55), look: Cc(LAST_X, 1.68, -3.7), fov: 40 }, prog(lt, 0, 2.2), ease.inOutSine, 0.4);
    },
  },
  {
    name: 'pigeon turns to camera', start: 'b22.w6-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { chair: false }); ctx.set.set('power', 0.5); ctx.set.set('lastSpot', 1); putAt(ctx, 'pigeon', st.Cc(LAST_X - 0.42, 1.1, -3.95), Math.PI / 2); dressPigeon(ctx, 1); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, p = ctx.cast.pigeon, ts = ctx.markers.on;
      const k = ease.inOutCubic(prog(ctx.t, ts - 0.45, ts + 0.05));
      p.pose('idle', 1.2, { headYaw: -1.25 * k }); p.face(k > 0.5 ? 'smug' : 'neutral', 1.0);
      const ph = pigeonHead(ctx);
      setCam(ctx, { pos: Cc(LAST_X - 0.15, 1.75, -2.25), look: ph.clone().add(V(0.12, -0.05, 0)), fov: 36 }, 0.6);
      ctx.cam.punch([ts], ctx.t, 0.14, 0.3);
      tag(ctx, 'THE PERSON WATCHING THIS:\nON', ts, Infinity, { y: 0.17, size: 60, fill: '#3cff6b', bg: 'rgba(8,10,14,0.9)' });
    },
  },
  // ── b23 "So, uh... don't scroll."
  {
    name: 'wing reaches', start: 'b23-0.1', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { chair: false }); ctx.set.set('power', 0.5); ctx.set.set('lastSpot', 1); putAt(ctx, 'pigeon', st.Cc(LAST_X - 0.42, 1.1, -3.95), Math.PI / 2); dressPigeon(ctx, 1); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, p = ctx.cast.pigeon, k = ease.inOutSine(prog(lt, 0.1, 1.1));
      p.pose('idle', 1.2, { headYaw: -1.0 }); p.face('smug', 1.0);
      p.joints.armL.rotation.set(-0.4 * k, 0.9 * k, 0.9 * k);
      setCam(ctx, { pos: Cc(LAST_X - 0.1, 1.45, -2.2), look: Cc(LAST_X - 0.15, 1.45, -3.8), fov: 40 }, 0.5);
    },
  },
  {
    name: 'dont scroll', start: 'b23.w2-0.2', set: 'control',
    setup(ctx) { const st = controlRoom(ctx, { pigeon: false, chair: false }); ctx.set.set('power', 0.5); ctx.set.set('lastSpot', 1); kidAt(ctx, st.Cc, LAST_X - 2.2, -2.6, 0.15); ctx.store = st; },
    update(ctx, lt) {
      const { Cc } = ctx.store, me = ctx.cast.me, lean = ease.inOutSine(prog(lt, 0, 0.6));
      me.pose('idle', ctx.t, { intensity: 0.2 }); me.face('sweat', 0.4);
      me.joints.torso.rotation.x += 0.35 * lean; me.joints.head.rotation.x += -0.15 * lean;
      me.joints.armR.rotation.x += -2.2 * lean; me.joints.foreArmR.rotation.x += -1.4 * lean; me.joints.armR.rotation.z += 0.25;
      const f = humanFace(me);
      setCam(ctx, { pos: f.clone().add(V(0.05, 0.05, 1.6)), look: f.clone().add(up(-0.08)), fov: 36 }, 0.8);
      tag(ctx, "DON'T SCROLL", ctx.time('b23.w2'), Infinity, { y: 0.17, size: 96, fill: '#ffe14a', bg: 'rgba(200,0,30,0.92)' });
    },
  },
  {
    name: 'static', start: 'b23.end+0.15', set: 'control', captions: false,
    setup(ctx) { controlRoom(ctx, { pigeon: false, chair: false }); },
    update(ctx) { ctx.fx.draw((g, W, H) => staticNoise(g, W, H, ctx.t)); },
  },
];
