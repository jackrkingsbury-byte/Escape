// In This Town — Episode 22: "Big Love".  Every pet grows exactly as big as its owner loves it.  Mrs. Lin's goldfish is
// the size of a school bus, Mr. Barnes's dog is the size of a pea, the mayor's hamster burst through his roof… and my cat
// Waffles is normal-sized because I'm way too cool to say it.  Then a storm traps Waffles on the clock tower, and I have to
// shout it in front of the whole town.  He grows taller than the tower — and then he purrs, and I start growing too.
// Film contract: SPEC.md §8.  Timeline: episodes/ep22/timeline.json.
//
// Sets: 'town' (buildTown, seed 22) and 'room' (the bedroom).  Town-local coordinates (the set root is the identity):
// main street along x (centre z = 0, pavements z = ±5.15), clock tower at (−51, 1.5) with the east clock face at
// x = −49.68, y = 11 (faces +x, down the street).  Props from ./props.js are parented to the set root (addTo).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS, extraSpecs } from '../cast.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { top10Card } from '../cards.js';
import { makeSweatDrop } from '../props.js';
import { makeHeart, makeZzz, makeFlashlight } from '../ep9/props9.js';
import { glowSprite, makePuff, makeSparkles } from '../ep18/props.js';
import { makeRain, makeBolt } from '../ep16/props.js';
import { makeFillerCrowd } from '../ep19/props.js';
import { makeFireTruck } from '../ep20/props.js';
import { makeTrafficCone } from '../ep3/props3.js';
import {
  BOWL, makeFishBowl, makeScaffold, makeWheelbarrow, makeFlakes, makeMiniDog, makeLeash, makeMayorHouse, makeWindowRoom,
  makeHamster, makeDebris, makeRulesBoard, makeNoGrandmaSign, makePuppy, makeRoadClosed, makeStormClouds, makeClockHand,
  makeTorchField, makeTears, makeMesa, makePurrLines, makeGroundConfetti,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const KIDS = Object.fromEntries(Object.values(extraSpecs(5, 922)).map((s, i) => [`k${i}`, { ...s, id: `k${i}`, scale: 0.8 + 0.06 * (i % 3), accessories: [] }]));
const KID_IDS = Object.keys(KIDS);
const KSP = [[43.0, -1.0, -PI / 2 + 0.35], [42.8, 0.6, -PI / 2 - 0.1], [43.4, 1.25, -PI / 2 - 0.3], [44.6, -1.7, -PI / 2 + 0.45], [44.6, 1.35, -PI / 2 - 0.35]];
const SPECIAL = {
  lin: { id: 'lin', skin: '#f0c8a8', hair: { style: 'bun', color: '#b8b8b8' }, top: { style: 'cardigan', color: '#4f9a48', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#5a4a3a' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.93 },
  barnes: { id: 'barnes', skin: '#e9b99a', hair: { style: 'bald', color: '#888888' }, top: { style: 'cardigan', color: '#7a5232', accent: '#e8d8b0' },
    bottom: { style: 'pants', color: '#55575e' }, shoes: '#3a2a1c', accessories: ['mustache'], scale: 0.97, build: 1.12 },
  pearl: { id: 'pearl', skin: '#f4d0b5', hair: { style: 'bun', color: '#f4f4f4' }, top: { style: 'cardigan', color: '#8a5cff', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#5a4a6a' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.86 },
  tyler: { id: 'tyler', skin: '#ffdbac', hair: { style: 'spiky', color: '#f0c419' }, top: { style: 'hoodie', color: '#2f6fd8', accent: '#ffffff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2a2f3a' }, shoes: '#ffffff', accessories: [], scale: 0.9 },
  waffles: { creature: 'cat', id: 'waffles' },
};
export const cast = { me: MAIN.me, mayor: MAIN.mayor, pigeon: MAIN.pigeon, ...SPECIAL, ...KIDS, ...EXTRAS };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 22, banner: ['WE LOVE', 'OUR', 'PETS'] }),
  room: () => buildRoom({ variant: 'hero', window: 'day' }),
};
const X = EXTRA_IDS;

// ───────────────────────────────────────────────────────────────────────────────────────── layout (town-local)
const B = { x: -4.5, z: -1.0 };                 // fish bowl centre
const SCAF = { x: B.x + 0.2, z: B.z + BOWL.R + 1.12 };
const BN = { x: 12, z: 2.6, yaw: PI / 2 - 0.4 }; // Mr. Barnes on the road, facing the east camera
const MH = { x: -52, z: -14 };                  // the mayor's house (park), facing +x
const PUP = { x: -44, z: 0.4, s: 3 };
const TW = { x: -51, z: 1.5, face: -49.66, cy: 11 };
const TRUCK = { x: -41, z: 3.9 };
const CAT_BIG = { x: -52, z: -12 };             // giant Waffles after he steps down (root), facing +x
const MESA = { x: -80, z: 50 };
const KD = { x: -33.5, z: 4.6, yaw: -PI / 2 - 0.15 }; KD.fx = Math.sin(KD.yaw); KD.fz = Math.cos(KD.yaw); KD.sx = Math.cos(KD.yaw); KD.sz = -Math.sin(KD.yaw);

export function init(ctx) {
  const P = ctx.props;
  P.bowl = makeFishBowl(); P.scaf = makeScaffold(7.4); P.barrow = makeWheelbarrow(); P.flakes = makeFlakes(130);
  P.dog = makeMiniDog(); P.leash = makeLeash(16, 0.005);
  P.house = makeMayorHouse(); P.winRoom = makeWindowRoom(); P.ham = makeHamster(); P.hamS = makeHamster(); P.debris = makeDebris(70);
  P.board = makeRulesBoard(); P.shop = makeNoGrandmaSign();
  P.pup = makePuppy(); P.barrier = makeRoadClosed(); P.cones = [makeTrafficCone(), makeTrafficCone(), makeTrafficCone()];
  P.zzz = makeZzz(2.2);
  P.clouds = makeStormClouds(16); P.rain = makeRain(900, 22, 16, 22); P.bolt = makeBolt(3); P.bolt2 = makeBolt(8);
  P.hands = makeClockHand(); P.truck = makeFireTruck();
  P.filler = makeFillerCrowd(160); P.torches = makeTorchField(90);
  P.lights = [0, 1, 2, 3].map(() => makeFlashlight());
  P.tears = makeTears(); P.sweat = makeSweatDrop({ size: 0.14 });
  P.mesa = makeMesa(); P.purr = makePurrLines(); P.confetti = makeGroundConfetti(110, 0.8, 0.024);
  P.hearts = Array.from({ length: 8 }, () => makeHeart());
  P.bigHearts = Array.from({ length: 10 }, () => makeHeart());
  P.puffs = [0, 1, 2].map((i) => makePuff({ color: '#ffe8f4', count: 22, radius: 1, seed: 3 + i }));
  P.dust = makePuff({ color: '#c8b8a0', count: 24, radius: 1, seed: 9 });
  P.sparkles = makeSparkles({ n: 40, w: 30, h: 26, d: 14, color: '#ffd6f0', size: 0.25 });
  P.sun = glowSprite('#ffb060', 60, 0.9); P.sunCore = glowSprite('#fff0c0', 18, 1.0);
  P.loop = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 8, 24), new THREE.MeshStandardMaterial({ color: '#e8232b', roughness: 0.45 }));
  P.fill = new THREE.PointLight('#fff2e0', 5, 12, 1.4);
  P.zap = new THREE.PointLight('#d8d0ff', 0, 0, 0);
  P.key = new THREE.PointLight('#ffffff', 0, 60, 1.2);
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function T(ctx) { const r = ctx.set.root; r.updateMatrixWorld(true); const M = r.matrixWorld.clone(); const f = (x, y, z) => V(x, y, z).applyMatrix4(M); f.yaw = yawOf(r); f.M = M; return f; }
function put(ctx, id, p, yaw, scale) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); if (scale != null) r.scale.setScalar(scale); return ctx.cast[id]; }
function addTo(ctx, obj, x, y, z, ry = 0, s = null) { const o = obj.root && obj.root.isObject3D ? obj.root : obj; ctx.add(o, ctx.set.root); o.position.set(x, y, z); o.rotation.set(0, ry, 0); if (s != null) o.scale.setScalar(s); return o; }
const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.17, size: 70, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale ?? 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 170, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.12, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
}
const iris = (ctx, t0, cy = 0.45, dur = 0.45) => { const k = clamp((ctx.t - t0) / dur, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, PI * 2, true); g.fill('evenodd'); g.restore(); }); };
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headPt(ch, y = 0.3) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, y, 0)); }
function fill(ctx, pos, k = 1, color = '#fff2e0', dist = 12) { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); f.distance = dist; }
function setCam(ctx, c, k = 0, color) { ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k, color); return c; }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0, color) { const c = camLerp(a, b, clamp(u, 0, 1)); ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k, color); return c; }
function pop(ctx, t0, dur = 0.12, color = '#ffffff', a = 0.55) { const d = ctx.t - t0; if (d >= 0 && d < dur) ctx.fx.overlay(color, a * (1 - d / dur)); }
function hitPulse(times, t, decay = 0.2) { let p = 0; for (const h of times) if (t >= h) p = Math.max(p, Math.exp(-(t - h) / decay)); return p; }
function lastBefore(times, t) { let r = null; for (const x of times) if (x <= t) r = x; return r; }
function shakeOn(ctx, hits, amt = 0.6, dur = 0.35, seed = 7) { for (const h of hits) { const d = ctx.t - h; if (d >= 0 && d < dur) ctx.cam.shake(amt * (1 - d / dur), ctx.t, seed); } }
const H = (beat, i) => (i === 0 ? `${beat}.h0-0.12` : `${beat}.h${i}-0.03`);
const hussHits = (ctx, beat) => ctx.hussTimes(beat).map((h) => h + 0.03);

// ─── town looks
const STORM = { zenith: new THREE.Color('#0e0420'), mid: new THREE.Color('#341258'), horizon: new THREE.Color('#7a3aa8'), fog: new THREE.Color('#2a1446') };
function town(ctx, light = 'day', { party = false, fireworks = false, glow = 0.8, exposure = null } = {}) {
  const s = ctx.set;
  s.setLighting(light); s.set('partyProps', party); s.set('fireworks', fireworks); s.set('foam', 0);
  s.set('windowGlow', light === 'day' ? 0 : glow); s.set('standsCrowd', false); s.set('crowdMotion', 1);
  s.exposure = exposure ?? (light === 'quiet_night' ? 1.15 : light === 'dusk' ? 1.05 : 1.0);
  if (ctx.props.rootY0 == null) ctx.props.rootY0 = s.root.position.y;
  s.root.position.y = ctx.props.rootY0; s.root.updateMatrixWorld(true);
  const L = T(ctx); ctx.store.L = L; return L;
}
/** the storm look: purple sky, dark clouds, rain that rides the camera, a lightning light */
function storm(ctx, { clouds = true, exposure = 1.25 } = {}) {
  const L = town(ctx, 'quiet_night', { glow: 0.9, exposure });
  const sky = ctx.set.root.getObjectByName('sky');
  if (sky?.material?.uniforms?.uZenith) { const u = sky.material.uniforms; u.uZenith.value.copy(STORM.zenith); u.uMid.value.copy(STORM.mid); u.uHorizon.value.copy(STORM.horizon); u.uSunColor.value.setRGB(0, 0, 0); }
  if (ctx.set.background) ctx.set.background.copy(STORM.fog);
  if (ctx.set.fog) { ctx.set.fog.color.copy(STORM.fog); ctx.set.fog.near = 30; ctx.set.fog.far = 220; }
  const P = ctx.props;
  if (clouds) { addTo(ctx, P.clouds, -40, 0, 0); P.clouds.userData.set(ctx.t, 0); }
  ctx.add(P.rain); ctx.add(P.zap); P.zap.position.copy(L(-30, 80, 40)); P.zap.intensity = 0;
  ctx.store.storm = true;
  return L;
}
/** per-frame storm: rain in front of the camera, lightning (bolts + light) at the given strike times */
function stormFrame(ctx, cam, strikes = [], { slant = 0.25, rainA = 1, boltAt = null, rainDist = 7, popA = 0.45, popDur = 0.12, zapMax = 6 } = {}) {
  const P = ctx.props, t = ctx.t;
  const fwd = cam.look.clone().sub(cam.pos).normalize();
  P.rain.position.copy(cam.pos).addScaledVector(fwd, rainDist); P.rain.userData.set(t, rainA, slant);
  let z = 0; for (const s of strikes) { const d = t - s; if (d >= 0 && d < 0.35) z = Math.max(z, (d < 0.06 ? 1 : 0.5 * Math.exp(-(d - 0.06) / 0.08))); }
  P.zap.intensity = zapMax * z;
  const last = lastBefore(strikes, t);
  for (const [b, k] of [[P.bolt, 0], [P.bolt2, 1]]) {
    const show = last != null && t - last < 0.16 && (strikes.indexOf(last) % 2) === k;
    if (show) { ctx.add(b); const bp = boltAt ? boltAt(strikes.indexOf(last)) : cam.pos.clone().addScaledVector(fwd, 90).add(up(40)); b.position.copy(bp); b.lookAt(cam.pos.x, bp.y, cam.pos.z); b.scale.setScalar(1.4); }
    else ctx.remove(b);
  }
  if (last != null && popA > 0) pop(ctx, last, popDur, '#e8e0ff', popA);
}

// ─── the bowl street
function bowlStreet(ctx, { scaffold = true } = {}) {
  const P = ctx.props;
  addTo(ctx, P.bowl, B.x, 0, B.z, 0);
  if (scaffold) addTo(ctx, P.scaf, SCAF.x, 0, SCAF.z, 0);
}
/** fish looks toward town-local point (x, y, z) */
function fishLook(ctx, x, y, z, t, o = {}) {
  const dx = x - B.x, dz = z - B.z, fy = 4.2 + (o.rise || 0);
  const yaw = Math.atan2(dx, dz), pitch = Math.atan2(fy - y, Math.hypot(dx, dz)) * 0.8;
  ctx.props.bowl.userData.set(t, { yaw, pitch: clamp(pitch, -0.9, 0.7), ...o });
}
/** Barnes with his leash to the (pea) dog.  dogScale 0.06 → pea, 0.16 → mouse */
function barnesRig(ctx, { dogScale = 0.06, pose = 'crossArms', x = BN.x, z = BN.z, yaw = BN.yaw } = {}) {
  const L = ctx.store.L, P = ctx.props;
  const b = put(ctx, 'barnes', L(x, 0, z), L.yaw + yaw);
  const f = V(Math.sin(yaw), 0, Math.cos(yaw)), s = V(Math.cos(yaw), 0, -Math.sin(yaw));
  const dp = { x: x + f.x * 1.25 - s.x * 0.35, z: z + f.z * 1.25 - s.z * 0.35 };
  addTo(ctx, P.dog, dp.x, 0, dp.z, yaw + 0.4, dogScale);
  ctx.add(P.leash, ctx.set.root);
  ctx.store.bn = { b, f, s, dp, pose };
  return ctx.store.bn;
}
function barnesFrame(ctx, t, { face = 'squint', faceT = 0.5, hop = 0, glance = 0, thick = 1, hand: hj = 'handR', end = null } = {}) {
  const P = ctx.props, { b, pose } = ctx.store.bn;
  if (pose === 'heart') heartPose(b, t); else b.pose(pose, t, { headYaw: glance });
  b.face(face, faceT);
  P.dog.userData.set(t, { wag: 1, hop });
  b.root.updateMatrixWorld(true);
  const hand = b.joints[hj].getWorldPosition(V());
  const inv = ctx.store.L.M.clone().invert();
  P.leash.userData.set(hand.applyMatrix4(inv), end ? end.clone() : P.dog.userData.collarWorld().applyMatrix4(inv), 0.12, thick);
}
/** right hand on the heart (left chest), a little sob */
function heartPose(ch, t) {
  ch.pose('idle', t, { intensity: 0.4 });
  const J = ch.joints, sob = 0.04 * Math.sin(t * 14) * (Math.sin(t * 2.2) > 0 ? 1 : 0.3);
  J.armR.rotation.set(-0.5, 0, 0.95); J.foreArmR.rotation.set(-1.9, 0, 0);
  J.armL.rotation.set(-0.25, 0, 0.12); J.foreArmL.rotation.set(-0.35, 0, 0);
  J.torso.rotation.x += 0.05 + sob; J.head.rotation.x += 0.12 + sob * 2;
}
/** cat clinging to the clock hand: body vertical, front paws up on the hand tip, face toward +x (the street) */
function hangCat(ctx, cat, tip, t, { slip = 0, swing = 0.12, face = 'shocked', faceT = 0.3, headPitch = 1.25, spread = 0, reach = 1 } = {}) {
  cat.pose('idle', t);
  const J = cat.joints;
  J.hips.rotation.set(0, 0, 0);
  J.armL.rotation.set(-PI / 2 - 0.25 + 1.6 * slip, 0, 0.15 + spread); J.armR.rotation.set(-PI / 2 - 0.25, 0, -0.15 - spread);
  if (reach !== 1) { J.armL.scale.set(1, reach, 1); J.armR.scale.set(1, reach, 1); }
  J.legL.rotation.set(PI / 2 - 0.25 + 0.4 * Math.sin(t * 7), 0, 0.1); J.legR.rotation.set(PI / 2 - 0.25 + 0.4 * Math.sin(t * 7 + 2), 0, -0.1);
  J.head.rotation.set(headPitch, 0, 0);
  J.tail1.rotation.set(0.2 * Math.sin(t * 3), 0.4 * Math.sin(t * 2.3), 0);
  cat.face(face, faceT);
  const r = cat.root; r.rotation.order = 'YXZ';
  r.rotation.set(-PI / 2 + 0.1, ctx.store.L.yaw + PI / 2, swing * Math.sin(t * 2.6) + slip * 0.35);
  r.position.set(0, 0, 0); r.updateMatrixWorld(true);
  const pa = J.armR.localToWorld(V(0, -0.2, 0)); const pb = J.armL.localToWorld(V(0, -0.2, 0));
  const mid = slip > 0.5 ? pa : pa.add(pb).multiplyScalar(0.5);
  r.position.copy(tip).sub(mid); r.updateMatrixWorld(true);
}
/** cat scrambling up a wall facing +x: body vertical (head up), belly to the wall, back to the street; root = wall point */
function climbCat(ctx, cat, p, t, { gait = 1, look = 0.5, turn = 0, face = 'determined', faceT = 0.3 } = {}) {
  cat.pose('idle', t);
  const J = cat.joints, ph = t * 12 * gait, sw = Math.sin(ph);
  J.hips.rotation.set(0, 0, 0);
  J.armL.rotation.set(-1.35 + 0.5 * sw, 0, 0.14); J.armR.rotation.set(-1.35 - 0.5 * sw, 0, -0.14);
  J.legL.rotation.set(0.8 - 0.45 * sw, 0, 0.12); J.legR.rotation.set(0.8 + 0.45 * sw, 0, -0.12);
  J.head.rotation.set(-look, turn, 0);
  J.tail1.rotation.set(-0.5 + 0.15 * Math.sin(t * 5), 0.5 * Math.sin(t * 4.2), 0);
  cat.face(face, faceT);
  const r = cat.root; r.rotation.order = 'YXZ';
  r.rotation.set(-PI / 2, ctx.store.L.yaw - PI / 2, 0.1 * sw);
  r.position.copy(p); r.updateMatrixWorld(true);
}
/** a cat sitting tall: the shot sets root + scale */
function bigCatSit(cat, t, { face = 'smile', faceT = 0.3, headPitch = 0, headYaw = 0, lick = 0 } = {}) {
  cat.pose('sit', t, { headPitch, headYaw });
  if (lick > 0) {
    const J = cat.joints, w = Math.sin(t * 9);
    J.armR.rotation.x += -1.3 * lick; J.armR.scale.y = 1 + 0.0;
    J.head.rotation.x += 0.35 * lick + 0.06 * w * lick; J.head.rotation.y += -0.3 * lick;
  }
  cat.face(face, faceT);
}
/** crowd of real characters (town-local), animated by animList */
function crowd(ctx, ids, spots) {
  const L = ctx.store.L;
  return ids.map((id, i) => { const [x, z, yw] = spots[i]; const ch = put(ctx, id, L(x, 0, z), L.yaw + yw); return { ch, id, k: i, ph: hash(i * 1.9 + 3) * 3, x, z, yw }; });
}
function animList(list, t, act = 'idle', face = 'smile', params = {}) {
  for (const c of list) {
    const a = typeof act === 'function' ? act(c) : act, f = typeof face === 'function' ? face(c) : face;
    const p = typeof params === 'function' ? params(c) : params;
    c.ch.pose(a, t + c.ph, p); c.ch.face(f, t + c.ph);
  }
}
function filler(ctx, list) { const f = ctx.props.filler; ctx.add(f, ctx.set.root); f.position.set(0, 0, 0); f.userData.layout(list); return f; }
function blockFill(x0, x1, z0, z1, n, { seed = 3, faceX = null, faceZ = null, yaw = null } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(i * 1.37 + seed)), z = lerp(z0, z1, hash(i * 2.71 + seed));
    const yw = yaw != null ? yaw : Math.atan2((faceX ?? x) - x, (faceZ ?? z) - z);
    out.push({ x, z, yaw: yw + (hash(i * 4.4 + seed) - 0.5) * 0.6, k: i, s: 0.86 + 0.24 * hash(i * 3.3 + seed) });
  }
  return out;
}
/** clock tower dressing: the 3D hands on the east face */
function towerHands(ctx, mAng = -PI / 2, hAng = PI / 3) {
  const P = ctx.props; addTo(ctx, P.hands, TW.face, TW.cy, TW.z, PI / 2); P.hands.userData.set(mAng, hAng);
  return P.hands.userData.tipWorld();
}
/** comic freeze-frame speed lines from the frame edges */
function speedLines(ctx, k = 1) {
  ctx.fx.draw((g, W, H) => {
    g.save(); g.strokeStyle = `rgba(255,255,255,${0.75 * k})`; g.lineCap = 'round';
    const cx = W * 0.5, cy = H * 0.42, R0 = Math.hypot(W, H) * 0.62;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * PI * 2 + 0.07 * hash(i * 3.1), r1 = R0 * (0.62 + 0.12 * hash(i * 1.7));
      g.lineWidth = W * (0.004 + 0.006 * hash(i * 5.3));
      g.beginPath(); g.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke();
    }
    g.restore();
  });
}
function surprisedArms(ch, t, k = 1) { ch.pose('surprised', t, { intensity: k }); }
function lookHands(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints;
  J.armL.rotation.set(-1.0 * k, 0, 0.25 * k); J.armR.rotation.set(-1.0 * k, 0, -0.25 * k);
  J.foreArmL.rotation.set(-0.9 * k, 0, 0); J.foreArmR.rotation.set(-0.9 * k, 0, 0);
  J.head.rotation.x += 0.45 * k;
}
function fistsPose(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.6 });
  const J = ch.joints, sh = 0.05 * Math.sin(t * 30);
  J.armL.rotation.set(-0.35 + sh, 0, 0.32); J.armR.rotation.set(-0.35 - sh, 0, -0.32);
  J.foreArmL.rotation.set(-1.25, 0, 0); J.foreArmR.rotation.set(-1.25, 0, 0);
  J.torso.rotation.x += 0.08 * k;
}
function holdUp(ch, t, k = 1) {   // hands together in front of the face (holding a small pet)
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints;
  J.armL.rotation.set(-1.15 * k, 0, -0.35 * k); J.armR.rotation.set(-1.15 * k, 0, 0.35 * k);
  J.foreArmL.rotation.set(-1.0 * k, 0, 0); J.foreArmR.rotation.set(-1.0 * k, 0, 0);
}
function barrowPose(ch, t, tip) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints;
  J.armL.rotation.set(-0.55 - 0.7 * tip, 0, -0.12); J.armR.rotation.set(-0.55 - 0.7 * tip, 0, 0.12);
  J.foreArmL.rotation.set(-0.25, 0, 0); J.foreArmR.rotation.set(-0.25, 0, 0);
  J.torso.rotation.x += 0.15 + 0.1 * tip; J.head.rotation.x += 0.15;
}
function patPose(ch, t) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints, w = Math.sin(t * 7);
  J.armR.rotation.set(-1.25 + 0.18 * w, 0, 0.05); J.foreArmR.rotation.set(-0.35 - 0.2 * w, 0, 0);
  J.torso.rotation.x += 0.1;
}
/** flashlight in a character's right hand, beam along the arm */
function holdLight(ctx, ch, k) { const f = ctx.props.lights[k]; ctx.add(f.root, ch.joints.handR); f.root.position.set(0, -0.02, 0); f.root.rotation.set(PI / 2, 0, 0); f.setOn(1); }
function lightPose(ch, t, look) { ch.pose('point', t, { lookAt: look }); ch.joints.armR.rotation.x += -0.55; }

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, every pet grows exactly as big as you love it."
  {
    name: 'goldfish street', start: 0, set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); bowlStreet(ctx);
      put(ctx, 'lin', L(-0.4, 0, 3.0), L.yaw + 0.2);
      const bn = barnesRig(ctx, { pose: 'crossArms' });
      ctx.remove(ctx.props.dog);
      const lp = ctx.props.loop; addTo(ctx, lp, bn.dp.x, 0.13, bn.dp.z, BN.yaw + PI / 2);
      ctx.store.loopEnd = V(bn.dp.x, 0.2, bn.dp.z);
      ctx.store.walk = crowd(ctx, [X[0], X[1], X[2], X[3], X[4]], [[16, 6.2, -PI / 2], [6, -6.3, PI / 2], [-12, 6.3, -PI / 2], [1.5, 4.4, -2.4], [-0.5, -5.8, PI + 0.4]]);
    },
    update(ctx, lt, u) {
      const L = ctx.store.L, t = ctx.t;
      fishLook(ctx, 18, 2, 6, t, { blink: 0 });
      barnesFrame(ctx, t, { thick: 4.5, end: ctx.store.loopEnd });
      ctx.props.loop.rotation.z = 0.15 * Math.sin(t * 5);
      const lin = ctx.cast.lin; lin.pose('wave', t); lin.face('smile', t);
      const w = ctx.store.walk;
      w.forEach((c, i) => {
        if (i < 3) { const dir = i === 1 ? 1 : -1; c.ch.root.position.copy(L(c.x + dir * 0.9 * lt, 0.12, c.z)); c.ch.pose('walk', t + c.ph); c.ch.face('smile', t + c.ph); }
        else { c.ch.pose('point', t + c.ph, { lookAt: L(B.x, 6, B.z) }); c.ch.face('shocked', 1); }
      });
      ctx.cam.move({ pos: L(26, 9, 8), look: L(-4, 4.6, -1), fov: 46 }, { pos: L(21, 2.8, 7.6), look: L(-3, 3.6, -0.5), fov: 46 }, u, 'inOutSine');
    },
  },
  // ── b02 "Mrs. Lin loves her goldfish so much, it's the size of a school bus."  — wave, tilt up the bowl
  {
    name: 'lin waves', start: 'b02-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); bowlStreet(ctx);
      put(ctx, 'lin', L(-0.2, 0, 2.4), L.yaw + 0.75);
      ctx.store.walk = crowd(ctx, [X[5], X[6]], [[8, 6.3, -PI / 2], [-14, -6.2, PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, lin = ctx.cast.lin, t0 = ctx.time('b02');
      const blink = clamp(1 - Math.abs(t - 6.15) / 0.12, 0, 1);
      fishLook(ctx, -0.2, 1.5, 2.4, t, { blink, swim: 0.5 });
      lin.pose('wave', t, { lookAt: ctx.props.bowl.userData.eyeWorld(0) }); lin.face('grin', t);
      ctx.store.walk.forEach((c, i) => { const dir = i ? 1 : -1; c.ch.root.position.copy(L(c.x + dir * 0.9 * (t - t0), 0.12, c.z)); c.ch.pose('walk', t + c.ph); c.ch.face('smile', t); });
      const k = ease.inOutCubic(clamp((t - t0 - 0.9) / 2.2, 0, 1));
      const pos = L(3.6, 0.8, 4.0);
      const look = L(-0.2, 1.2, 2.4).lerp(L(B.x + 0.8, 2.5, B.z + 0.6), k);
      ctx.cam.set({ pos: pos.clone().lerp(L(6.0, 0.9, 4.2), k), look, fov: lerp(36, 56, k) });
      tag(ctx, 'SIZE: SCHOOL BUS', ctx.time('b02.w12'), Infinity, { y: 0.13, bg: 'rgba(255,122,26,0.92)' });
    },
  },
  // ── b03 "She feeds it with a wheelbarrow."  — tip, pour, GULP
  {
    name: 'wheelbarrow gulp', start: 'b03-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); bowlStreet(ctx);
      const P = ctx.props, deck = 7.4;
      put(ctx, 'lin', L(SCAF.x + 0.15, deck, SCAF.z + 0.75), L.yaw + PI + 1.15);
      addTo(ctx, P.barrow, SCAF.x + 0.15, deck, SCAF.z - 0.25, PI);
      addTo(ctx, P.flakes, 0, 0, 0);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tf = ctx.time('b03.w1'), tw = ctx.time('b03.w5');
      const tip = ease.inOutCubic(clamp((t - tf + 0.05) / 0.3, 0, 1));
      P.barrow.userData.set({ tip, full: 1 - clamp((t - tf - 0.15) / 0.5, 0, 1) });
      barrowPose(ctx.cast.lin, t, tip); ctx.cast.lin.face(t > tw + 0.1 ? 'laugh' : 'determined', 0.5);
      const mo = clamp((t - tf) / 0.45, 0, 1) * (t < tw + 0.12 ? 1 : Math.max(0, 1 - (t - tw - 0.12) / 0.08));
      P.bowl.userData.set(t, { yaw: 0, pitch: -1.05, rise: 2.0, mouth: mo, swim: 0.2 });
      P.bowl.userData.fish.position.z += 1.5;
      const mouthW = P.bowl.userData.mouthWorld().applyMatrix4(L.M.clone().invert());
      const lip = P.barrow.userData.lipWorld().applyMatrix4(L.M.clone().invert());
      P.flakes.userData.set(clamp((t - tf - 0.1) / 0.75, 0, 1), lip, mouthW.add(up(0.2)), 0.7);
      const linP = ctx.cast.lin.root.position.clone().applyMatrix4(L.M.clone().invert());
      const foc = V(lerp(linP.x, mouthW.x, 0.8), mouthW.y - 2.6, lerp(linP.z, mouthW.z, 0.8));
      ctx.cam.set({ pos: L(B.x - 5.0, 13.6, B.z + 8.6), look: L(foc.x, foc.y, foc.z), fov: 52 });
      stamp(ctx, 'GULP!', tw + 0.12, { size: 140, fill: '#ff7a1a', rot: 0.1, y: 0.16 });
    },
  },
  // ── b04 "Grumpy Mr. Barnes owns a dog. We think. Nobody has ever actually seen it."  — zoom down the leash
  {
    name: 'barnes leash', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); bowlStreet(ctx);
      barnesRig(ctx, { pose: 'crossArms' });
      ctx.store.walk = crowd(ctx, [X[7], X[8]], [[20, 6.3, -PI / 2], [4, -6.3, PI / 2]]);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, { f, s, dp } = ctx.store.bn;
      fishLook(ctx, 18, 2, 6, t);
      const think = ctx.time('b04.w6');
      barnesFrame(ctx, t, { face: 'squint', faceT: 0.5, glance: t > think - 0.1 && t < think + 0.7 ? 0.5 : 0, thick: t > ctx.time('b04.w8') ? 0.3 : 1 });
      ctx.store.walk.forEach((c, i) => { const dir = i ? 1 : -1; c.ch.root.position.copy(L(c.x + dir * 0.9 * (t - 9.5), 0.12, c.z)); c.ch.pose('walk', t + c.ph); c.ch.face('smile', t); });
      const bx = BN.x, bz = BN.z;
      const med = { pos: L(bx + f.x * 3.4 + s.x * 0.5, 1.25, bz + f.z * 3.4 + s.z * 0.5), look: L(bx, 1.2, bz), fov: 34 };
      const med2 = { pos: L(bx + f.x * 2.9 + s.x * 0.45, 1.3, bz + f.z * 2.9 + s.z * 0.45), look: L(bx, 1.25, bz), fov: 34 };
      const dw = { x: dp.x + f.x * 0.17 - s.x * 0.03, z: dp.z + f.z * 0.17 - s.z * 0.03 };
      const dw2 = { x: dp.x + f.x * 0.3 - s.x * 0.06, z: dp.z + f.z * 0.3 - s.z * 0.06 };
      const macroA = { pos: L(dw2.x, 0.11, dw2.z), look: L(dp.x, -0.01, dp.z), fov: 32 };
      const macro = { pos: L(dw.x, 0.075, dw.z), look: L(dp.x, -0.01, dp.z), fov: 30 };
      const tn = ctx.time('b04.w8');
      if (t < tn) moveCam(ctx, med, med2, (t - 9.5) / 3);
      else moveCam(ctx, macroA, macro, ease.outCubic(clamp((t - tn) / 0.7, 0, 1)));
      tag(ctx, 'ACTUAL SIZE', ctx.time('b04.w10'), Infinity, { y: 0.12, size: 80, bg: 'rgba(200,0,40,0.9)' });
      if (t > ctx.time('b04.w10')) ctx.fx.text('↓', { x: 0.5, y: 0.2, size: 110, fill: '#ffffff', stroke: '#000000', line: 10 });
    },
  },
  // ── b05 HUSS ×3 — I land in frame, slam; the street laughs at the tiny dog
  ...[0, 1, 2].map((i) => ({
    name: `huss street #${i + 1}`, start: H('b05', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); bowlStreet(ctx);
      barnesRig(ctx, { pose: 'idle' });
      const { dp } = ctx.store.bn;
      put(ctx, 'me', L(BN.x + 2.0, 0, BN.z + 2.1), L.yaw + PI / 2 - 0.15);
      ctx.store.crowd = crowd(ctx, [X[3], X[4], X[5], X[9]], [[dp.x + 1.8, dp.z - 1.4, -0.9], [dp.x - 1.0, dp.z - 1.9, 0.7], [dp.x - 1.2, dp.z - 1.6, 0.5], [dp.x + 1.0, dp.z - 2.4, -0.3]]);
      ctx.store.dpos = L(dp.x, 0.05, dp.z);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, hits = hussHits(ctx, 'b05');
      barnesFrame(ctx, t, { face: 'squint' });
      ctx.cast.barnes.pose('crossArms', t);
      animList(ctx.store.crowd, t, 'pointLaugh', 'laugh', (c) => ({ lookAt: ctx.store.dpos }));
      const h = lastBefore(hits, t), near = h != null && t - h < 0.22;
      me.pose('slam', t, { hits, slamZ: 0.5 }); me.face(near || t < hits[0] ? 'huss' : 'determined', t);
      const mx = BN.x + 2.0, mz = BN.z + 2.1;
      if (i === 0) { const k = clamp((t - (hits[0] - 0.16)) / 0.16, 0, 1); me.root.position.copy(L(mx - 1.2 * (1 - k), 1.1 * Math.sin(PI * Math.min(1, 0.5 + 0.5 * k)) * (1 - k) + 0.0, mz + 0.6 * (1 - k))); }
      const cams = [
        { pos: L(mx + 3.0, 0.45, mz + 0.4), look: L(mx, 1.45, mz), fov: 44 },
        { pos: L(mx + 4.4, 1.5, mz + 2.2), look: L(mx, 1.3, mz), fov: 36 },
        { pos: L(mx + 5.4, 2.2, mz + 3.2), look: L(mx - 0.5, 0.65, mz - 1.0), fov: 44 },
      ];
      ctx.cam.set(cams[i]); ctx.cam.punch(hits, t, 0.1, 0.2);
    },
  })),
  // ── b06 "It started five years ago, when the mayor told his hamster, I love you."  — through the window (flashback)
  {
    name: 'mayor window', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props, W = { x: 70, z: 70 };
      addTo(ctx, P.winRoom, W.x, 0, W.z, 0); P.winRoom.children[9].visible = false; P.winRoom.children[8].visible = false;   // no cross bar / mullion over his face
      put(ctx, 'mayor', L(W.x, 0, W.z - 1.25), L.yaw);
      addTo(ctx, P.hamS, 0, 0, 0, 0, 0.11);
      ctx.store.W = W;
      P.hearts.forEach((h) => addTo(ctx, h, 0, -50, 0));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, W = ctx.store.W, P = ctx.props, m = ctx.cast.mayor, tl = ctx.time('b06.w11');
      const hug = ease.inOutCubic(clamp((t - tl + 0.15) / 0.3, 0, 1));
      holdUp(m, t, 1);
      const J = m.joints;
      J.foreArmL.rotation.x -= 0.6 * hug; J.foreArmR.rotation.x -= 0.6 * hug; J.armL.rotation.x += 0.25 * hug; J.armR.rotation.x += 0.25 * hug;
      J.head.rotation.z += 0.25 * hug; J.head.rotation.x += -0.1 + 0.1 * hug;
      m.face(hug > 0.3 ? 'laugh' : 'smile', 0.3);
      m.root.updateMatrixWorld(true);
      const hm = J.handL.getWorldPosition(V()).add(J.handR.getWorldPosition(V())).multiplyScalar(0.5).add(up(0.1));
      const inv = L.M.clone().invert(); hm.applyMatrix4(inv);
      P.hamS.position.copy(hm); P.hamS.rotation.set(0, 0.3 * hug, 0); P.hamS.userData.set(t, { cheeks: 0.6 + 0.5 * hug, wiggle: 1 });
      const fc = humanFace(m).applyMatrix4(inv);
      P.hearts.forEach((h, k) => {
        const d = t - (tl + 0.08 + k * 0.09);
        if (d < 0) { h.position.set(0, -50, 0); return; }
        // two columns beside his head (never over the eyes), drifting up inside the tight window frame
        const side = k % 2 ? 1 : -1, j = Math.floor(k / 2), rise = Math.min(0.3, 0.45 * d);
        h.position.set(fc.x + side * (0.5 + 0.06 * j), fc.y - 0.3 + 0.17 * j + rise + 0.04 * Math.sin(t * 4 + k), fc.z + 0.35); h.scale.setScalar(0.17 * Math.min(1, d / 0.15) * (1 + 0.1 * Math.sin(t * 9 + k)));
      });
      const k = ease.inOutSine(clamp(lt / 3.6, 0, 1));
      // push in until the window fills the frame; face in the upper third (y≈0.3), hamster + hearts below/around it
      ctx.cam.set({ pos: L(W.x + 0.5, 1.5, W.z + lerp(5.0, 3.0, k)), look: fc.clone().applyMatrix4(L.M).add(up(-0.5)), fov: 32 });
      // flashback treatment
      ctx.fx.overlay('#d89a4a', 0.2); ctx.fx.vignette(0.75);
      ctx.fx.draw((g, Wd, Hd) => { g.save(); const mm = Wd * 0.04; g.fillStyle = 'rgba(40,22,8,0.9)'; g.beginPath(); g.rect(0, 0, Wd, Hd); g.roundRect(mm, mm * 1.6, Wd - 2 * mm, Hd - 3.2 * mm, Wd * 0.06); g.fill('evenodd'); g.restore(); });
      tag(ctx, '5 YEARS AGO', ctx.time('b06') + 0.05, Infinity, { y: 0.12, size: 76, bg: 'rgba(90,50,20,0.9)', fill: '#ffe8c0' });
    },
  },
  // ── b07 "It burst straight through his roof."  — BOOM
  {
    name: 'roof burst', start: 'b07-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); const P = ctx.props;
      addTo(ctx, P.house, MH.x, 0, MH.z, PI / 2);
      addTo(ctx, P.ham, MH.x, 0, MH.z, PI / 2, 2.35);
      addTo(ctx, P.debris, MH.x, 6, MH.z);
      ctx.store.walk = crowd(ctx, [X[10], X[11]], [[MH.x + 7, MH.z + 9, -PI / 2 - 1.0], [MH.x + 9.5, MH.z + 10.5, -PI / 2 - 0.8]]);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tb = ctx.time('b07.w1');
      const k = (t - tb) / 1.1;
      P.house.userData.set(k, -1);
      const pre = t < tb ? 0.04 * Math.sin(t * 60) : 0;
      P.house.rotation.z = pre;
      const hp = ease.outBack(clamp((t - tb) / 0.35, 0, 1));
      P.ham.position.set(MH.x, lerp(3.5, 6.0, hp), MH.z); P.ham.scale.setScalar(lerp(0.8, 2.35, clamp(hp, 0, 1.2))); P.ham.visible = t > tb + 0.02;
      P.ham.userData.set(t, { cheeks: 1, wiggle: 1 });
      P.debris.userData.set(clamp((t - tb) / 1.6, 0, 1), 1);
      animList(ctx.store.walk, t, t > tb ? 'surprised' : 'idle', t > tb ? 'shocked' : 'smile', (c) => ({ lookAt: L(MH.x, 6, MH.z) }));
      ctx.cam.set({ pos: L(MH.x + 17, 3.2, MH.z + 5.5), look: L(MH.x, 5.2, MH.z), fov: 50 });
      shakeOn(ctx, [tb], 1.0, 0.6, 3); pop(ctx, tb, 0.1, '#ffffff', 0.5);
      stamp(ctx, 'BOOM!', tb + 0.02, { y: 0.16 });
    },
  },
  {
    name: 'hamster low', start: 'b07.w3-0.05', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); const P = ctx.props;
      addTo(ctx, P.house, MH.x, 0, MH.z, PI / 2);
      addTo(ctx, P.ham, MH.x, 6.0, MH.z, PI / 2, 2.35);
      addTo(ctx, P.debris, MH.x, 6, MH.z);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tb = ctx.time('b07.w1');
      P.house.userData.set((t - tb) / 1.1, -1);
      P.ham.userData.set(t, { cheeks: 0.7, wiggle: 1.2 });
      P.debris.userData.set(clamp((t - tb) / 1.6, 0, 1), 1);
      ctx.cam.move({ pos: L(MH.x + 11.5, 4.4, MH.z + 4.4), look: L(MH.x, 5.6, MH.z), fov: 52 }, { pos: L(MH.x + 11, 4.6, MH.z + 4.2), look: L(MH.x, 5.8, MH.z), fov: 50 }, clamp(ctx.lt / 0.8, 0, 1));
      ctx.cam.shake(0.15, t, 5);
    },
  },
  // ── b08 "So now there are rules. No saying I love you indoors."  — the sign flips
  {
    name: 'rules board', start: 'b08-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); const P = ctx.props;
      addTo(ctx, P.board, 46, 0, 0, -PI / 2);
      ctx.store.crowd = crowd(ctx, ['lin', 'barnes', X[0], X[1], X[2], X[12]], [[41.2, 1.15, -1.8], [41.0, -1.0, -1.3], [43.2, 1.9, -2.0], [43.0, -1.8, -1.1], [39.4, 1.6, -1.9], [39.2, -1.45, -1.25]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tr = ctx.time('b08.w4'), tn = ctx.time('b08.w5');
      P.board.userData.set(ease.inOutCubic(clamp((t - tr + 0.1) / 0.45, 0, 1)));
      const nod = t > tn + 0.3;
      animList(ctx.store.crowd, t, 'idle', nod ? 'determined' : 'neutral', (c) => ({ headPitch: nod ? 0.2 * Math.max(0, Math.sin((t - tn) * 6 + c.k)) : 0, intensity: 0.3 }));
      const a = { pos: L(31.0, 1.5, 0.9), look: L(46, 2.0, 0), fov: 52 }, b = { pos: L(32.5, 1.6, 0.7), look: L(46, 2.2, 0), fov: 50 };
      moveCam(ctx, a, b, ease.inOutSine(clamp((t - tr) / 1.6, 0, 1)));
      tag(ctx, 'RULE #1: NO "I LOVE YOU" INDOORS', tn, Infinity, { y: 0.12, size: 48, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── "And keep grandmas away from the pet shop."  — red X stamp
  {
    name: 'no grandmas', start: 'b08.w12-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); const P = ctx.props;
      addTo(ctx, P.shop, 15, 0, 7.45, PI);
      put(ctx, 'pearl', L(14.3, 0.12, 6.1), L.yaw + PI);
      ctx.store.walk = crowd(ctx, [X[13]], [[22, 6.0, -PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tg = ctx.time('b08.w13');
      P.shop.userData.setX((t - tg) / 0.12);
      const pe = ctx.cast.pearl; pe.pose(t > tg + 0.2 ? 'shrug' : 'idle', t); pe.face(t > tg + 0.02 ? 'sad' : 'smile', 0.4);
      const w = ctx.store.walk[0]; w.ch.root.position.copy(L(22 - 0.9 * lt, 0.12, 6.0)); w.ch.pose('walk', t); w.ch.face('smile', t);
      ctx.cam.move({ pos: L(15.0, 1.9, -3.6), look: L(15.0, 3.0, 7.4), fov: 52 }, { pos: L(15.0, 2.1, -3.0), look: L(15.0, 3.2, 7.4), fov: 50 }, clamp(lt / 2, 0, 1));
      shakeOn(ctx, [tg], 0.5, 0.3, 4);
    },
  },
  // ── b09 "Grandma Pearl hugged one puppy. We had to close the highway."
  {
    name: 'puppy wide', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); const P = ctx.props;
      addTo(ctx, P.pup, PUP.x, 0, PUP.z, PI / 2, PUP.s);
      addTo(ctx, P.barrier, -24, 0, 0.6, PI / 2);
      P.cones.forEach((c, i) => addTo(ctx, c, -23.6 + (i - 1) * 0.3, 0, [-3.4, 3.6, 4.3][i], i));
      addTo(ctx, P.zzz, PUP.x + 2, 5.6, PUP.z - 3.2);
      put(ctx, 'pearl', L(-37.2, 0, -1.4), L.yaw + 0.5);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      P.pup.userData.set(t); P.barrier.userData.set(t);
      P.zzz.position.set(PUP.x + 3.5, 9.6 + 0.4 * Math.sin(t * 2), PUP.z - 5.5); P.zzz.scale.set(3.6, 3.6, 1); P.zzz.material.rotation = 0.1 * Math.sin(t * 1.5);
      const pe = ctx.cast.pearl; patPose(pe, t); pe.face('smile', 0.4);
      ctx.cam.move({ pos: L(-21.5, 7.4, 3.4), look: L(-41, 2.6, -3.4), fov: 48 }, { pos: L(-22.5, 6.9, 3.2), look: L(-41, 2.4, -3.4), fov: 46 }, clamp(lt / 2, 0, 1));
    },
  },
  {
    name: 'puppy paw', start: 'b09.w5-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); const P = ctx.props;
      addTo(ctx, P.pup, PUP.x, 0, PUP.z, PI / 2, PUP.s);
      addTo(ctx, P.zzz, PUP.x + 2, 5.6, PUP.z - 3.2);
      put(ctx, 'pearl', L(-36.6, 0, -2.0), L.yaw + 0.25);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      P.pup.userData.set(t);
      P.zzz.position.set(PUP.x + 3.4, 5.6 + 0.25 * Math.sin(t * 2), PUP.z - 5.6); P.zzz.scale.set(2.2, 2.2, 1);
      const pe = ctx.cast.pearl; patPose(pe, t); pe.face('smile', 0.4);
      ctx.cam.move({ pos: L(-31.0, 1.3, 1.6), look: L(-39.6, 2.3, -5.0), fov: 54 }, { pos: L(-31.5, 1.25, 1.2), look: L(-39.6, 2.4, -5.0), fov: 52 }, clamp(lt / 1.3, 0, 1));
      tag(ctx, 'ROAD CLOSED', ctx.time('b09.w8'), Infinity, { y: 0.13, size: 84, fill: '#1d1d22', stroke: '#ffffff', bg: 'rgba(255,138,26,0.95)' });
    },
  },
  // ── b10 "Then there's me and my cat, Waffles. He's normal-sized. Because I'm way too cool to say it."
  {
    name: 'waffles bed', start: 'b10-0.1', set: 'room', lighting: 'day',
    setup(ctx) {
      const bed = ctx.point('room.bed');
      ctx.place('waffles', bed.clone().add(V(0.15, 0, 0.35))); ctx.cast.waffles.root.rotation.set(0, 0.25, 0);
      ctx.store.bed = bed;
    },
    update(ctx, lt) {
      const t = ctx.t, w = ctx.cast.waffles, bed = ctx.store.bed;
      w.pose('sit', t); w.face(t > ctx.time('b10.w6') ? 'smile' : 'neutral', 0.4);
      const c = bed.clone().add(V(0.15, 0, 0.35));
      ctx.cam.move({ pos: c.clone().add(V(0.9, 0.85, 2.3)), look: c.clone().add(V(0, 0.22, 0)), fov: 34 }, { pos: c.clone().add(V(0.6, 0.7, 1.6)), look: c.clone().add(V(0, 0.24, 0)), fov: 32 }, clamp(lt / 2.3, 0, 1), 'inOutSine');
      tag(ctx, 'WAFFLES', ctx.time('b10.w6'), Infinity, { y: 0.14, bg: 'rgba(240,138,44,0.95)' });
    },
  },
  {
    name: 'too cool', start: 'b10.w7-0.15', set: 'room', lighting: 'day',
    setup(ctx) {
      const bed = ctx.point('room.bed');
      ctx.place('waffles', bed.clone().add(V(0.15, 0, 0.35))); ctx.cast.waffles.root.rotation.set(0, 0.5, 0);
      const me = ctx.place('me', V(bed.x + 1.15, 0, bed.z + 0.75)); me.root.rotation.set(0, -0.1, 0);
      me.setAccessory('sunglasses', true);
      ctx.store.bed = bed;
    },
    update(ctx, lt) {
      const t = ctx.t, w = ctx.cast.waffles, me = ctx.cast.me, bed = ctx.store.bed;
      w.pose('sit', t, { lookAt: humanFace(me) }); w.face('smile', 0.4);
      me.pose('crossArms', t, { headYaw: 0.75, headPitch: -0.1 }); me.face('smug', 0.4);
      const mid = V(bed.x + 0.7, 0, bed.z + 0.6);
      ctx.cam.move({ pos: mid.clone().add(V(0.35, 1.2, 5.0)), look: mid.clone().add(V(0.25, 1.0, 0)), fov: 42 }, { pos: mid.clone().add(V(0.3, 1.25, 4.3)), look: mid.clone().add(V(0.25, 1.05, 0)), fov: 42 }, clamp(lt / 2.8, 0, 1));
      tag(ctx, 'NORMAL-SIZED', ctx.time('b10.w8'), ctx.time('b10.w13') - 0.05, { y: 0.13 });
      tag(ctx, 'TOO COOL', ctx.time('b10.w13'), Infinity, { y: 0.13, bg: 'rgba(30,30,40,0.92)', fill: '#3ee0c8' });
    },
  },
  // ── b11 "At school, Tyler said, Your cat's so small, your love must be tiny."
  {
    name: 'tyler laughs', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'me', L(38, 0, 1.0), L.yaw + PI / 2);
      put(ctx, 'tyler', L(41.4, 0, 0.2), L.yaw - PI / 2 + 0.1);
      ctx.store.kids = crowd(ctx, KID_IDS, KSP);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, ty = ctx.cast.tyler;
      const ts = ctx.time('b11.w4');
      ty.pose(t > ts ? 'pointLaugh' : 'idle', t, { lookAt: humanFace(me) }); ty.face(t > ts ? 'laugh' : 'smug', t);
      animList(ctx.store.kids, t, (c) => (t > ts + 0.4 + c.k * 0.1 ? (c.k % 2 ? 'laugh' : 'pointLaugh') : 'idle'), (c) => (t > ts + 0.4 ? 'laugh' : 'smile'));
      me.pose('idle', t, { intensity: 0.3 }); me.face('neutral', 0.4);
      ctx.cam.move({ pos: L(35.2, 1.75, 2.72), look: L(43, 0.95, 0.4), fov: 35 }, { pos: L(35.6, 1.75, 2.62), look: L(43, 1.0, 0.4), fov: 32 }, clamp(lt / 2.6, 0, 1));
    },
  },
  {
    name: 'sweat', start: 'b11.w9-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'me', L(38, 0, 1.0), L.yaw + PI / 2 - 0.55);
      put(ctx, 'tyler', L(41.4, 0, 0.2), L.yaw - PI / 2 + 0.1);
      ctx.store.kids = crowd(ctx, KID_IDS, KSP);
      ctx.add(ctx.props.sweat, ctx.cast.me.joints.head); ctx.props.sweat.position.set(0.3, 0.5, 0.2);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      ctx.cast.tyler.pose('pointLaugh', t, { lookAt: humanFace(me) }); ctx.cast.tyler.face('laugh', t);
      animList(ctx.store.kids, t, (c) => (c.k % 2 ? 'laugh' : 'pointLaugh'), 'laugh');
      me.pose('stunned', t); me.face('sweat', 0.4);
      ctx.props.sweat.position.set(0.32, 0.52 - 0.15 * ((lt * 0.8) % 1), 0.22);
      const f = humanFace(me);
      ctx.cam.move({ pos: L(39.9, 1.5, 3.4), look: f.clone().add(up(-0.4)), fov: 36 }, { pos: L(39.6, 1.55, 3.1), look: f.clone().add(up(-0.38)), fov: 32 }, clamp(lt / 1.2, 0, 1));
    },
  },
  // ── b12 HUSS ×3 — fists clenched, punch-ins, the laughing crowd behind
  ...[0, 1, 2].map((i) => ({
    name: `huss fists #${i + 1}`, start: H('b12', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'me', L(38, 0, 1.0), L.yaw - PI / 2 + 0.2);
      put(ctx, 'tyler', L(41.4, 0, 0.2), L.yaw - PI / 2 + 0.1);
      ctx.store.kids = crowd(ctx, KID_IDS, KSP);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, hits = hussHits(ctx, 'b12');
      ctx.cast.tyler.pose('pointLaugh', t, { lookAt: humanFace(me) }); ctx.cast.tyler.face('laugh', t);
      animList(ctx.store.kids, t, (c) => (c.k % 2 ? 'laugh' : 'pointLaugh'), 'laugh');
      fistsPose(me, t); const h = lastBefore(hits, t); me.face(h != null && t - h < 0.2 ? 'huss' : 'determined', t);
      const f = humanFace(me);
      const cams = [
        { pos: L(35.6, 0.6, 2.6), look: f.clone().add(up(-0.45)), fov: 40 },
        { pos: L(33.2, 1.5, -0.9), look: f.clone().add(up(-0.5)), fov: 50 },
        { pos: L(35.0, 1.7, 3.0), look: f.clone().add(up(-0.4)), fov: 32 },
      ];
      ctx.cam.set(cams[i]); ctx.cam.punch(hits, t, 0.12, 0.2);
    },
  })),
  // ── b13 "Then last night, a storm hit."  — the tower in the storm
  {
    name: 'storm tower', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      const L = storm(ctx); towerHands(ctx);
      put(ctx, 'waffles', L(TW.face + 0.25, 9.95, TW.z - 0.5), L.yaw + PI / 2, 1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, w = ctx.cast.waffles;
      w.pose('sit', t); w.face('neutral', 0.3); w.root.position.copy(L(TW.face + 0.22, 9.95, TW.z - 0.4));
      const c = moveCam(ctx, { pos: L(-36.5, 1.6, -9.5), look: L(-51, 9.0, 1.0), fov: 52 }, { pos: L(-37.5, 2.0, -9.0), look: L(-51, 9.8, 1.0), fov: 50 }, clamp(lt / 2.3, 0, 1), 1.0, '#cfc4ff');
      ctx.props.clouds.userData.set(t, 0);
      stormFrame(ctx, c, [ctx.time('b13.w4'), ctx.time('b13.w4') + 0.22], { boltAt: (k) => L(-80, 52, k ? -18 : 12) });
    },
  },
  // ── "Waffles chased the mayor's pigeon all the way up the clock tower."  — close, low on the tower face: the cat
  //    scrambles up the clock (belly to the wall) with the pigeon flapping just above him; the roof in frame; lightning
  {
    name: 'chase up', start: 'b13.w6-0.1', set: 'town',
    setup(ctx) {
      const L = storm(ctx, { exposure: 1.3 }); ctx.store.tip = towerHands(ctx);
      put(ctx, 'waffles', L(TW.face + 0.22, 9.95, TW.z - 0.4), L.yaw + PI / 2, 1.2);   // a touch bigger in this close-up
      put(ctx, 'pigeon', L(TW.face + 0.3, 10.2, TW.z + 0.9), L.yaw + PI / 2 + 0.5, 1.5);
      const P = ctx.props; ctx.add(P.key); P.key.color.set('#ffe6c8');
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, w = ctx.cast.waffles, pg = ctx.cast.pigeon, P = ctx.props;
      const tw = ctx.time('b13.w6'), tc = ctx.time('b13.w7'), tf = ctx.time('b13.w15') - 0.06;   // flip onto the hand on "the clock"
      // Waffles: crouch on the ledge → scramble up the clock face → paws up under the roof trim, swiping at the pigeon
      const kc = clamp((t - (tc - 0.05)) / (tf - tc + 0.05), 0, 1), ky = ease.inOutSine(kc);
      const cy = lerp(10.2, 11.72, ky) + (kc < 1 ? 0.05 * Math.abs(Math.sin(t * 11)) : 0);
      if (t < tc - 0.05) { w.pose('stare', t, { lookAt: pg.root.position.clone() }); w.face('stare', 0.3); w.root.position.copy(L(TW.face + 0.22, 9.95, TW.z - 0.1)); w.root.rotation.set(0, L.yaw + PI / 2 - 0.9, 0); }
      else if (kc < 1) climbCat(ctx, w, L(TW.face + 0.06, cy, TW.z - 0.05), t, { look: 1.0, turn: 0.0 });
      else { climbCat(ctx, w, L(TW.face + 0.06, cy, TW.z - 0.05), t, { gait: 0.25, look: 1.2, turn: 0.0, face: 'shocked' }); const J = w.joints; J.armL.rotation.x = -2.2 + 0.4 * Math.sin(t * 16); J.armR.rotation.x = -1.6; }
      // the pigeon: perched by the cat → flaps up, always ~0.8 m above him → lands smug on the roof trim
      const kp = clamp((t - tc) / (tf - tc - 0.15), 0, 1), land = kp >= 1;
      const py = land ? 12.31 : t < tc ? 10.0 : Math.min(12.31, lerp(10.0, cy + 0.95, ease.outCubic(Math.min(1, (t - tc) / 0.6)))) + 0.1 * Math.sin(t * 22);
      pg.root.position.copy(L(TW.face + (land ? 0.3 : lerp(0.35, 0.55, Math.min(1, kp * 3))), py, TW.z + lerp(0.45, -0.25, Math.min(1, kp * 2))));
      pg.root.rotation.set(0, L.yaw + PI / 2 + (land ? -0.7 : 0.3), 0);
      pg.pose(t >= tc && !land ? 'flap' : 'idle', t); pg.face(t >= tc && !land ? 'shocked' : land ? 'smug' : 'neutral', 0.3);
      // camera: low on the north-east corner looking up the face; cranes up with the climb (cat stays in the upper middle)
      const cyc = lerp(10.2, 11.72, ease.inOutSine(clamp((t - tc + 0.2) / (tf - tc + 0.2), 0, 1)));
      const lo = lerp(-0.3, 0.02, ease.inOutSine(clamp((t - tc) / 0.9, 0, 1)));
      const kin = ease.inOutSine(clamp((t - tw) / 1.2, 0, 1));   // starts a little wider (rain + roof), settles in close
      const c = setCam(ctx, { pos: L(lerp(-46.2, -47.0, kin), cyc - lerp(0.6, 1.0, kin), lerp(-0.2, 0.25, kin)), look: L(-49.7, cyc + lo + 0.15 * (1 - kin), 1.35), fov: 63 }, 1.5, '#ffe8d8');
      P.key.position.copy(L(-46.5, 12.5, 2.5)); P.key.intensity = 14; P.key.distance = 14; P.key.decay = 1.2;
      P.clouds.userData.set(t, 0);
      stormFrame(ctx, c, [tc + 0.02, tf - 0.02], { rainDist: 3, popA: 0.3, popDur: 0.1, boltAt: (kk) => L(-90, 48, kk ? -28 : -6) });
    },
  },
  // ── b14 "The fire ladder was too short."
  {
    name: 'ladder short', start: 'b14-0.1', set: 'town',
    setup(ctx) {
      const L = storm(ctx); const P = ctx.props; ctx.store.tip = towerHands(ctx);
      addTo(ctx, P.truck, TRUCK.x, 0, TRUCK.z, 0);
      put(ctx, 'waffles', L(0, 0, 0), 0, 1);
      const list = blockFill(-38.5, -31, -3.5, 7.5, 90, { seed: 5, faceX: -51, faceZ: 1.5 });
      filler(ctx, list); addTo(ctx, P.torches, 0, 0, 0); P.torches.userData.layout(list);
      const ids = [X[0], X[1], X[2], X[3]];
      ctx.store.holders = crowd(ctx, ids, [[-31.5, 5.4, -PI / 2 - 0.3], [-32.5, 3.8, -PI / 2 - 0.2], [-30.8, 2.2, -PI / 2 - 0.1], [-33.2, 6.6, -PI / 2 - 0.35]]);
      ctx.store.holders.forEach((h, k) => holdLight(ctx, h.ch, k));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tf = ctx.time('b14.w1');
      const k = ease.outCubic(clamp((t - tf) / 0.9, 0, 1));
      P.truck.userData.set({ yaw: -PI / 2, raise: lerp(0.05, 0.42, k), extend: 0.12 * k, t });
      hangCat(ctx, ctx.cast.waffles, ctx.store.tip, t, { face: 'shocked' });
      P.filler.userData.set(t, { arms: 'catch', bounce: 0.1, speed: 0.6 });
      const top = L(-50, 10.5, 1.5);
      ctx.store.holders.forEach((h) => { lightPose(h.ch, t + h.ph, top); h.ch.face('shocked', 0.3); });
      const c = moveCam(ctx, { pos: L(-26.4, 4.3, 8.8), look: L(-44, 6.4, 1.5), fov: 52 }, { pos: L(-27, 4.6, 8.6), look: L(-44, 6.6, 1.5), fov: 50 }, clamp(lt / 1.4, 0, 1), 1.2, '#cfc4ff');
      P.torches.userData.set(t, c.pos);
      P.clouds.userData.set(t, 0);
      stormFrame(ctx, c, [ctx.time('b14') + 0.2], { boltAt: () => L(-85, 50, 14) });
      tag(ctx, 'TOO SHORT', ctx.time('b14.w5'), Infinity, { y: 0.14, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── "The wind got stronger. Waffles started slipping."  — close on the clock hand
  {
    name: 'slipping', start: 'b14.w6-0.12', set: 'town',
    setup(ctx) {
      const L = storm(ctx, { exposure: 1.3 }); ctx.store.tip = towerHands(ctx);
      put(ctx, 'waffles', L(0, 0, 0), 0, 1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, ts = ctx.time('b14.w10'), tw = ctx.time('b14.w6');
      const slip = ease.outCubic(clamp((t - ts) / 0.18, 0, 1));
      const wind = clamp((t - tw) / 0.8, 0, 1);
      // wide grip (face clear of the paws): both paws on the hand, then the last paw slides out to the tip
      const hd = ctx.props.hands.getWorldPosition(V()).sub(ctx.store.tip).normalize();
      const grip = ctx.store.tip.clone().addScaledVector(hd, slip > 0.5 ? lerp(0.36, 0.06, (slip - 0.5) * 2) : 0.18);
      hangCat(ctx, ctx.cast.waffles, grip, t, { slip, swing: (0.12 + 0.25 * wind) * (1 - 0.65 * slip), face: slip > 0 ? 'shocked' : 'sweat', faceT: 0.3, headPitch: 1.35, spread: 0.45, reach: 1.6 });
      // in front of his face, in the town frame (street side of the clock face): face upper third, paw + clock hand above it
      const hp = ctx.cast.waffles.joints.head.getWorldPosition(V());
      const Lx = V(1, 0, 0).transformDirection(L.M), Lz = V(0, 0, 1).transformDirection(L.M);
      // the slip spins him ~20° toward town −z: the lens follows so the shocked face stays front-on
      const c = setCam(ctx, { pos: hp.clone().addScaledVector(Lx, 1.8).addScaledVector(Lz, lerp(0.45, -0.75, slip)).add(up(0.2)), look: hp.clone().add(up(-0.17)), fov: 34 }, 0.8, '#e0d8ff');
      ctx.cam.shake(0.08 + 0.25 * wind + 0.5 * slip * Math.max(0, 1 - (t - ts) / 0.4), t, 11);
      P.clouds.userData.set(t, 0);
      stormFrame(ctx, c, [tw + 0.05, ts + 0.02], { rainDist: 2, popA: 0.25, popDur: 0.08, slant: 0.25 + 0.6 * wind, boltAt: (k) => L(-20, 30, k ? -30 : 25) });
      tag(ctx, 'SLIPPING!', ts + 0.05, Infinity, { y: 0.075, size: 76, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b15 HUSS ×6 — me in the rain, looking up; lightning on every HUSS
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `huss rain #${i + 1}`, start: H('b15', i), set: 'town',
    setup(ctx) {
      const L = storm(ctx); const P = ctx.props; ctx.store.tip = towerHands(ctx);
      put(ctx, 'me', L(KD.x, 0, KD.z), L.yaw + KD.yaw);
      put(ctx, 'waffles', L(0, 0, 0), 0, 1);
      const list = blockFill(-30, -22, -3.5, 7.0, 80, { seed: 7, faceX: -51, faceZ: 1.5 });
      filler(ctx, list); addTo(ctx, P.torches, 0, 0, 0); P.torches.userData.layout(list);
      addTo(ctx, P.truck, TRUCK.x, 0, TRUCK.z, 0); P.truck.userData.set({ yaw: -PI / 2, raise: 0.42, extend: 0.12 });
      ctx.add(P.key); P.key.color.set('#d8d0ff'); P.key.distance = 8; P.key.intensity = 0;
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, hits = hussHits(ctx, 'b15');
      hangCat(ctx, ctx.cast.waffles, ctx.store.tip, t, { slip: 1, swing: 0.3 });
      const h = lastBefore(hits, t), near = h != null && t - h < 0.2;
      me.pose('idle', t, { lookAt: L(-50, 11, 1.2), intensity: 0.5 }); fistsPose(me, t); me.joints.head.rotation.x -= 0.35;
      me.face(near ? 'huss' : 'shocked', 0.3);
      P.filler.userData.set(t, { arms: 'catch', bounce: 0.1, speed: 0.6 });
      const f = humanFace(me);
      const R = (fd, sd, y) => L(KD.x + KD.fx * fd + KD.sx * sd, y, KD.z + KD.fz * fd + KD.sz * sd);
      const cams = [
        { pos: R(2.0, -1.0, 0.35), look: f.clone().add(up(-0.55)), fov: 48 },
        { pos: R(3.0, -1.1, 1.4), look: f.clone().add(up(-0.4)), fov: 32 },
        { pos: R(3.2, 1.2, 2.6), look: f.clone().add(up(-0.6)), fov: 40 },
        { pos: R(2.0, -1.6, 0.3), look: f.clone().add(up(-0.2)), fov: 50 },
        { pos: R(3.1, -0.8, 1.6), look: f.clone().add(up(-0.4)), fov: 32 },
        { pos: R(4.0, -2.2, 1.0), look: f.clone().add(up(-0.7)), fov: 52 },
      ];
      const c = setCam(ctx, cams[i], 1.0, '#e4dcff');
      ctx.cam.punch(hits, t, 0.12, 0.2); shakeOn(ctx, hits, 0.12 + 0.1 * i, 0.3, 13);
      P.torches.userData.set(t, c.pos); P.clouds.userData.set(t, 0);
      stormFrame(ctx, c, hits, { popA: 0.2, popDur: 0.08, zapMax: 3, boltAt: (k) => c.pos.clone().add(V(-40 - 10 * (k % 3), 40, -30 + 20 * (k % 2))) });
      const hp = headPt(me, 0.3), away = hp.clone().sub(c.pos).setY(0).normalize();
      P.key.position.copy(hp).addScaledVector(away, 1.6).add(up(1.2)); P.key.intensity = 14 * hitPulse(hits, t, 0.09);
    },
  })),
  // ── b16 "There was only one way to save him. In front of the whole town."  — slow push; the town turns to stare
  {
    name: 'whole town', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      const L = storm(ctx); const P = ctx.props;
      put(ctx, 'me', L(-38.5, 0, 3.0), L.yaw - PI / 2);
      const list = blockFill(-32, -22, -4, 7, 110, { seed: 11, faceX: -38.5, faceZ: 3.0 });
      filler(ctx, list); addTo(ctx, P.torches, 0, 0, 0); P.torches.userData.layout(list.filter((_, k) => k % 2 === 0));
      ctx.store.crowd = crowd(ctx, ['tyler', 'barnes', 'lin', 'pearl', 'mayor', X[4], X[5], X[6], X[7], X[8]],
        [[-35.2, 4.4, -1.2], [-35.0, 1.4, -2.2], [-33.8, 5.8, -0.9], [-34.0, -0.4, -2.5], [-33.0, 2.8, -1.8], [-32.6, 6.8, -0.6], [-32.4, -1.8, -2.8], [-31.2, 4.6, 2.4], [-31.0, 0.6, 2.8], [-30.4, 2.6, 0.2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, tin = ctx.time('b16.w6'), tf = ctx.time('b16.w8');
      const turn = ease.inOutCubic(clamp((t - tf) / 0.6, 0, 1));
      for (const c of ctx.store.crowd) {
        const want = yawTo(c.x, c.z, -38.5, 3.0) + PI * 0;
        c.ch.root.rotation.y = L.yaw + lerp(c.yw, want, turn);
        c.ch.pose('idle', t + c.ph, { intensity: 0.3 }); c.ch.face(turn > 0.5 ? 'shocked' : 'sad', 0.3);
      }
      P.filler.userData.set(t, { arms: 'limp', bounce: 0, speed: 0.4 });
      me.pose('idle', t, { intensity: 0.3, headPitch: -0.12 }); me.face(t > tin ? 'determined' : 'sweat', 0.3);
      const f = humanFace(me);
      const k = ease.inOutSine(clamp(lt / 3.2, 0, 1));
      const c = setCam(ctx, { pos: L(lerp(-46, -43.8, k), lerp(0.8, 1.0, k), lerp(4.3, 4.0, k)), look: f.clone().add(V(0, lerp(-0.3, -0.4, k), lerp(0.9, 0.7, k))), fov: lerp(50, 40, k) }, 1.4, '#e4dcff');
      P.torches.userData.set(t, c.pos); P.clouds.userData.set(t, 0);
      stormFrame(ctx, c, [], { rainA: 0.8 });
    },
  },
  // ── b17 "I love you, Waffles!"  — cheer at the sky; lightning freezes the frame
  {
    name: 'i love you', start: 'b17-0.1', set: 'town',
    setup(ctx) {
      const L = storm(ctx);
      put(ctx, 'me', L(-38.5, 0, 3.0), L.yaw - PI / 2);
    },
    update(ctx) {
      const L = ctx.store.L, P = ctx.props, tz = ctx.time('b17.w3') + 0.05, t = ctx.t, tt = Math.min(t, tz);
      const me = ctx.cast.me; const k = ease.outBack(clamp((t - ctx.time('b17')) / 0.3, 0, 1));
      me.pose('cheer', tt, { intensity: k, headPitch: -0.45 }); me.face('huss', 0.3);
      const c = setCam(ctx, { pos: L(-42.2, 0.35, 3.9), look: L(-38.5, 2.5, 3.0), fov: 50 }, 1.6, '#e4dcff');
      P.clouds.userData.set(tt, 0);
      stormFrame(ctx, c, [tz - 0.02], { boltAt: () => L(-70, 40, -6) });
      if (t >= tz) { P.rain.userData.set(tz, 1, 0.25); ctx.fx.vignette(0.6); speedLines(ctx, clamp((t - tz) / 0.1, 0, 1)); }
      tag(ctx, 'I LOVE YOU, WAFFLES!', ctx.time('b17') + 0.05, Infinity, { y: 0.15, size: 84, fill: '#ff4fa3', stroke: '#ffffff', bg: null, line: 12 });
    },
  },
  // ── b18 "Waffles grew. And grew. And grew."  — "Waffles": close on him hanging; on each "grew" a locked wide down the
  //    street with the clock tower as the scale ruler beside him: ~house height → ~half the tower → ears at the tower top.
  //    The camera only pulls back / tilts up slowly; each pink puff clears in 0.15 s so his face reads on the word.
  {
    name: 'grew', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      const L = storm(ctx); const P = ctx.props; ctx.store.tip = towerHands(ctx);
      put(ctx, 'waffles', L(0, 0, 0), 0, 1);
      const list = blockFill(-43, -33.5, -4.5, 4.0, 110, { seed: 13, faceX: -52, faceZ: -1.5 });
      filler(ctx, list); addTo(ctx, P.torches, 0, 0, 0); P.torches.userData.layout(list.filter((_, k) => k % 2 === 0));
      P.puffs.forEach((p) => addTo(ctx, p.root, 0, -99, 0));
      P.sparkles && addTo(ctx, P.sparkles, -53, 9, -3);
      ctx.add(P.key); P.key.color.set('#ffe2d0');
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, w = ctx.cast.waffles;
      const g = [ctx.time('b18.w1'), ctx.time('b18.w3'), ctx.time('b18.w5')];
      // sit next to the tower, same depth: front of the cat ≈ the tower front, flank clear of the tower's north side
      const stage = (sc) => ({ s: sc, x: -49.6 - 0.22 * sc, z: -0.6 - 0.13 * sc });
      const stages = [{ s: 1 }, stage(10), stage(15), stage(25)];
      let n = 0; for (const h of g) if (t >= h) n++;
      if (n === 0) hangCat(ctx, w, ctx.store.tip, t, { slip: 1, swing: 0.3, face: 'shocked' });
      else {
        const st = stages[n], k = ease.outBack(clamp((t - g[n - 1]) / 0.16, 0, 1));
        const s0 = n === 1 ? 3 : stages[n - 1].s;
        w.root.scale.setScalar(lerp(s0, st.s, k)); w.root.rotation.set(0, L.yaw + PI / 2 - 0.12, 0); w.root.position.copy(L(st.x, 0, st.z));
        bigCatSit(w, t, { face: n < 3 ? 'shocked' : 'smile', faceT: 0.3, headPitch: -0.12 - 0.04 * n });
      }
      // quick pink puff round his paws (never over the face), gone in 0.15 s
      P.puffs.forEach((p, k) => { const d = t - g[k]; if (d < 0 || d > 0.15) { p.root.position.set(0, -99, 0); p.update(0); return; } const st = stages[k + 1]; p.root.position.copy(L(st.x + st.s * 0.2, st.s * 0.06, st.z)); p.root.scale.setScalar(st.s * 0.2); p.update(0.35 + 0.65 * d / 0.15); });
      P.sparkles.userData.set(t, n > 0 ? 1 : 0);
      P.filler.userData.set(t, { arms: n > 0 ? 'up' : 'catch', bounce: n > 0 ? 0.3 : 0.05, speed: 0.6 });
      let c;
      if (n === 0) {   // "Waffles" — close on him dangling from the minute hand, a pink glow gathering
        const cc = w.joints.hips.getWorldPosition(V()).lerp(w.joints.head.getWorldPosition(V()), 0.5);
        c = setCam(ctx, { pos: cc.clone().add(V(3.0, -1.0, -0.6)), look: cc.clone().add(up(-0.3)), fov: 36 }, 1.2, '#ffd6f0');
        P.key.position.copy(cc).add(V(1.5, 0.5, -1.5)); P.key.intensity = 5; P.key.distance = 6; P.key.decay = 1.2; P.key.color.set('#ff9fd0');
      } else {         // the locked wide: tower left, Waffles right; slow pull-back + tilt-up across the three words
        const u = ease.inOutSine(clamp((t - g[0]) / (ctx.time('b18.w6') - g[0]), 0, 1));
        c = setCam(ctx, { pos: L(lerp(-28.5, -24.5, u), lerp(3.4, 3.2, u), -0.4), look: L(-52, lerp(4.4, 7.4, u), -2.0), fov: 58 }, 0.8, '#e4dcff');
        P.key.position.copy(L(-34, 16, -10)); P.key.intensity = 60; P.key.distance = 0; P.key.decay = 1.0; P.key.color.set('#ffe2d0');
      }
      const part = n >= 2 ? 0.6 * ease.inOutCubic(clamp((t - g[1]) / 0.9, 0, 1)) : 0;
      P.torches.userData.set(t, c.pos); P.clouds.userData.set(t, part, -55, -4);
      for (const h of g) { shakeOn(ctx, [h], 0.6, 0.35, 17); pop(ctx, h, 0.1, '#ffd6f0', 0.3); }
      stormFrame(ctx, c, [], { rainA: 1 });
      const words = ['GREW', 'AND GREW', 'AND GREW!'];
      if (n > 0) tag(ctx, words[n - 1], g[n - 1], Infinity, { y: 0.09, size: 76 + n * 8, bg: 'rgba(255,79,163,0.92)' });
    },
  },
  // ── "Until he was taller than the clock tower."  — the clouds part
  {
    name: 'taller than the tower', start: 'b18.w6-0.15', set: 'town',
    setup(ctx) {
      const L = storm(ctx); const P = ctx.props; towerHands(ctx);
      put(ctx, 'waffles', L(-64, 0, -6), L.yaw + PI / 2, 40);
      ctx.store.crowd = crowd(ctx, ['tyler', 'barnes', 'lin'], [[-33.6, -1.6, PI / 2 + 0.5], [-34.4, 2.4, PI / 2 - 0.6], [-35.6, 0.2, PI / 2 + 0.1]]);
      const list = blockFill(-42, -37, -4, 6, 70, { seed: 17, faceX: -60, faceZ: -4 });
      filler(ctx, list);
      addTo(ctx, P.sparkles, -58, 16, -3);
      ctx.add(P.key); P.key.color.set('#ffe2d0'); P.key.position.copy(L(-40, 18, -12)); P.key.intensity = 60; P.key.distance = 0; P.key.decay = 1.0;   // same key as the 'grew' wide
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, w = ctx.cast.waffles;
      bigCatSit(w, t, { face: 'smile', faceT: 0.3, headPitch: 0.3, headYaw: 0.25 });
      animList(ctx.store.crowd, t, 'surprised', 'shocked', (c) => ({ lookAt: L(-60, 22, -4) }));
      P.filler.userData.set(t, { arms: 'up', bounce: 0.2, speed: 0.6 });
      P.sparkles.userData.set(t, 1);
      const part = ease.inOutCubic(clamp((t - ctx.time('b18.w6')) / 1.4, 0, 1));
      P.clouds.userData.set(t, 0.6 + 0.4 * part, -59, -6);
      const sky = ctx.set.root.getObjectByName('sky');
      if (sky?.material?.uniforms?.uZenith) { const u = sky.material.uniforms; u.uZenith.value.copy(STORM.zenith).lerp(new THREE.Color('#1a2a6a'), part); u.uMid.value.copy(STORM.mid).lerp(new THREE.Color('#5a4aa8'), part); u.uHorizon.value.copy(STORM.horizon).lerp(new THREE.Color('#c890d8'), part); }
      const c = moveCam(ctx, { pos: L(-29.5, 1.1, 0.6), look: L(-54, 13, -3.5), fov: 60 }, { pos: L(-30, 1.0, 0.6), look: L(-54, 14.5, -3.8), fov: 62 }, clamp(lt / 2, 0, 1), 1.6, '#e4dcff');
      stormFrame(ctx, c, [], { rainA: 1 - part });
      tag(ctx, 'TALLER THAN THE TOWER', ctx.time('b18.w6'), Infinity, { y: 0.13, size: 62, bg: 'rgba(255,79,163,0.92)' });
    },
  },
  // ── b19 "He stepped down like it was a curb."
  {
    name: 'curb step', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 1, exposure: 1.3 }); const P = ctx.props; towerHands(ctx);
      put(ctx, 'waffles', L(CAT_BIG.x - 8, 0, CAT_BIG.z), L.yaw + PI / 2, 40);
      addTo(ctx, P.dust.root, 0, -99, 0);
      const list = blockFill(-44, -36, -5, 1, 50, { seed: 19, faceX: -48, faceZ: -10 });
      filler(ctx, list);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, w = ctx.cast.waffles, tc = ctx.time('b19.w7');
      const k = clamp((t - ctx.time('b19.w1') + 0.1) / (tc - ctx.time('b19.w1') + 0.1), 0, 1);
      w.root.position.copy(L(CAT_BIG.x - 8 + 8 * ease.inOutSine(k), 0, CAT_BIG.z));
      w.pose('idle', t, { headPitch: 0.35 }); w.face('smile', 0.3);
      const J = w.joints, lift = Math.sin(PI * clamp(k * 1.05, 0, 1));
      J.armR.rotation.x += -1.1 * lift; J.legL.rotation.x += 0.5 * lift;
      const d = t - tc; const bounce = d > 0 && d < 0.6 ? 0.18 * Math.sin(d * 30) * (1 - d / 0.6) : 0;
      ctx.set.root.position.y = ctx.props.rootY0 + bounce; ctx.set.root.updateMatrixWorld(true);
      const paw = J.armR.localToWorld(V(0, -0.18, 0));
      if (d >= 0 && d < 0.9) { P.dust.root.position.copy(paw.clone().applyMatrix4(L.M.clone().invert()).setY(0.5)); P.dust.root.scale.setScalar(3); P.dust.update(d / 0.9); } else P.dust.update(0);
      P.filler.userData.set(t, { arms: d > 0 ? 'cheer' : 'up', bounce: 0.3, speed: 0.6 });
      const cx = CAT_BIG.x - 8 + 8 * ease.inOutSine(k);
      const hp = headPt(w, 0); void cx;
      const c = setCam(ctx, { pos: L(-25.5, 1.6, 4.2), look: V(lerp(cx, hp.x, 0.6), 10.5, lerp(CAT_BIG.z, hp.z, 0.6)), fov: 66 }, 0);
      shakeOn(ctx, [tc], 0.9, 0.5, 21);
      tag(ctx, 'CASUAL', ctx.time('b19.w3'), Infinity, { y: 0.08, size: 90, bg: 'rgba(30,30,40,0.9)', fill: '#3ee0c8' });
    },
  },
  // ── b20 HUSS ×6 — party lights snap on; the town dances round his paws; me on the fire truck
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `party huss #${i + 1}`, start: H('b20', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'party_night', { party: true, fireworks: true, exposure: 1.05 }); const P = ctx.props; towerHands(ctx);
      put(ctx, 'waffles', L(CAT_BIG.x, 0, CAT_BIG.z), L.yaw + PI / 2, 40);
      addTo(ctx, P.truck, -33, 0, 2.2, PI / 2); P.truck.userData.set({ yaw: 0, raise: 0.05, extend: 0 });
      put(ctx, 'me', L(-33 + 2.6, 3.05, 2.2), L.yaw + PI / 2 - 0.3);
      const list = blockFill(-48, -36, -16, 0, 150, { seed: 23 });
      filler(ctx, list.filter((p) => !(p.x < -42.5 && p.z < -8.5)));
      ctx.store.crowd = crowd(ctx, ['tyler', 'lin', 'pearl', 'mayor', X[9], X[10], X[11], X[12]],
        [[-38.2, -3.2, 1.0], [-36.6, -5.6, 1.4], [-39.6, -6.0, 0.6], [-35.4, -2.4, 1.2], [-41.4, -4.4, 0.9], [-37.8, -8.4, 1.6], [-40.4, -2.0, 0.8], [-34.6, -7.0, 1.5]]);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, w = ctx.cast.waffles, hits = hussHits(ctx, 'b20');
      bigCatSit(w, t, { face: 'smile', faceT: 0.3, lick: i % 3 === 1 ? 1 : 0.6, headPitch: 0.2 });
      const h = lastBefore(hits, t), near = h != null && t - h < 0.22;
      me.pose('slam', t, { hits }); me.face(near ? 'huss' : 'grin', t);
      animList(ctx.store.crowd, t, (c) => (c.k % 2 ? 'dance' : 'cheer'), 'grin');
      P.filler.userData.set(t, { arms: 'cheer', bounce: 1, speed: 1 });
      const mp = L(-30.4, 3.05, 2.2), f = humanFace(me);
      const cams = [
        { pos: L(-26.2, 2.4, 4.6), look: f.clone().add(up(-0.5)), fov: 40 },
        { pos: L(-29, 1.5, 0.0), look: L(-45, 7, -10), fov: 58 },
        { pos: L(-27.9, 4.2, 3.4), look: f.clone().add(up(-0.38)), fov: 34 },
        { pos: L(-18, 15, 14), look: L(-36, 2, -2), fov: 50 },
        { pos: L(-25.2, 1.0, 7.6), look: L(-33, 5.0, 1.0), fov: 58 },
        { pos: L(-21, 3.5, 5.2), look: L(-36, 1.6, -1), fov: 62 },
      ];
      setCam(ctx, cams[i], 0.8, '#ffe0f0');
      ctx.cam.punch(hits, t, 0.12, 0.2); shakeOn(ctx, hits, 0.12, 0.25, 31);
      void mp;
    },
  })),
  // ── b21 "Even grumpy Mr. Barnes cried."
  {
    name: 'barnes cries', start: 'b21-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'party_night', { party: true, fireworks: false, exposure: 1.05 }); const P = ctx.props;
      put(ctx, 'waffles', L(CAT_BIG.x, 0, CAT_BIG.z), L.yaw + PI / 2, 40);
      barnesRig(ctx, { pose: 'heart', x: -30, z: 3.0, yaw: -PI / 2 + 0.35, dogScale: 0.06 });
      ctx.add(P.tears, ctx.cast.barnes.joints.head);
      const list = blockFill(-44, -34, -6, 8, 60, { seed: 29 });
      filler(ctx, list);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      bigCatSit(ctx.cast.waffles, t, { face: 'smile', faceT: 0.3, lick: 0.5 });
      barnesFrame(ctx, t, { face: 'sad', faceT: 0.3, hand: 'handL' });
      P.tears.userData.set(t);
      P.filler.userData.set(t, { arms: 'dance', bounce: 0.6, speed: 0.8 });
      const b = ctx.cast.barnes, f = humanFace(b), { f: fw, s } = ctx.store.bn;
      ctx.cam.move({ pos: f.clone().addScaledVector(fw, 3.0).addScaledVector(s, 0.4).add(up(-0.35)), look: f.clone().add(up(-0.4)), fov: 34 },
        { pos: f.clone().addScaledVector(fw, 2.5).addScaledVector(s, 0.35).add(up(-0.35)), look: f.clone().add(up(-0.38)), fov: 33 }, clamp(lt / 2.3, 0, 1));
      fill(ctx, f.clone().addScaledVector(fw, 2), 1.0, '#ffe8d8');
    },
  },
  // ── "His dog grew three whole inches. Top ten respect."  — at shoe level: Barnes's big brown shoes and the red leash for
  //    scale, the pea-sized dog lit in the upper middle of the frame, then the pop to mouse size
  {
    name: 'mouse dog', start: 'b21.w5-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'party_night', { party: true, fireworks: false, exposure: 1.05 }); const P = ctx.props;
      const bn = barnesRig(ctx, { pose: 'heart', x: -30, z: 3.0, yaw: -PI / 2 + 0.35, dogScale: 0.06 });
      // the dog sits right at his toes for this close-up
      bn.dp = { x: -30 + bn.f.x * 0.5 + bn.s.x * 0.05, z: 3.0 + bn.f.z * 0.5 + bn.s.z * 0.05 };
      P.dog.position.set(bn.dp.x, 0, bn.dp.z); P.dog.rotation.set(0, -PI / 2 + 0.35 + 0.25, 0);
      addTo(ctx, P.confetti, bn.dp.x + bn.f.x * 0.1, 0, bn.dp.z + bn.f.z * 0.1, 0); P.confetti.userData.clear(bn.f.x * 0.25, bn.f.z * 0.25, 0.14);   // none under the lens
      ctx.add(P.tears, ctx.cast.barnes.joints.head);
      ctx.add(P.key); P.key.color.set('#ffe8d0');
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tg = ctx.time('b21.w7');
      const gk = ease.outBack(clamp((t - tg) / 0.3, 0, 1)), gs = lerp(0.06, 0.17, gk);
      P.dog.scale.setScalar(gs);
      barnesFrame(ctx, t, { face: 'sad', faceT: 0.3, hop: t > tg + 0.3 ? 1 : 0, thick: 0.5, hand: 'handL' });
      P.tears.userData.set(t);
      const { dp, f, s: sd } = ctx.store.bn;
      const d = L(dp.x, 0, dp.z);
      // low in front of the dog, looking slightly down past it: dog upper-middle, shoes above it, leash from the top
      const u = ease.inOutCubic(clamp((t - tg) / 0.45, 0, 1)), kcard = ease.inOutCubic(clamp((t - ctx.time('b21.w11') + 0.1) / 0.35, 0, 1));   // tilt up under the top-10 card
      const cam = (back, h, fov) => ({ pos: d.clone().addScaledVector(f, back).addScaledVector(sd, 0.12 * back).add(up(h)), look: d.clone().addScaledVector(f, lerp(0.24 * back, 0.02, kcard)).add(up(0.012 * kcard)), fov });
      ctx.cam.move(cam(0.32, 0.105, 52), cam(0.46, 0.115, 52), u);
      fill(ctx, d.clone().addScaledVector(f, 0.45).add(up(0.05)), 0.9, '#ffe8d8', 3);
      P.key.position.copy(d).addScaledVector(f, 0.25).addScaledVector(sd, -0.35).add(up(0.5)); P.key.intensity = 1.6; P.key.distance = 2.5; P.key.decay = 1.5;
      if (t >= tg) pop(ctx, tg, 0.1, '#ffffff', 0.35);
      tag(ctx, '+3 INCHES', ctx.time('b21.w9'), ctx.time('b21.w11') - 0.1, { y: 0.1, size: 90, bg: 'rgba(60,180,90,0.95)' });
      top10Card(ctx, 3, ctx.time('b21.w11') - 0.02, Infinity, { popAt: ctx.time('b21.w12') });
    },
  },
  // ── b22 "But then Waffles looked down at me, and purred."  — dusk, the giant nuzzle
  {
    name: 'nuzzle', start: 'b22-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk'); const P = ctx.props;
      put(ctx, 'waffles', L(-61, -3.4, -2.5), L.yaw + PI / 2, 40);
      put(ctx, 'me', L(-38.6, 0, 0.6), L.yaw - PI / 2 + 1.25);
      addTo(ctx, P.purr, 0, 0, 0);
      P.hearts.forEach((h) => addTo(ctx, h, 0, -50, 0));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, w = ctx.cast.waffles, me = ctx.cast.me, tp = ctx.time('b22.w8');
      const low = ease.inOutSine(clamp((t - ctx.time('b22.w3')) / 1.0, 0, 1));
      w.pose('loaf', t); const J = w.joints; J.head.rotation.x += 0.05 + 0.12 * low; J.head.rotation.y += 0.3 * low + (t > tp ? 0.08 * Math.sin((t - tp) * 5) : 0);
      w.face(t > tp ? 'smile' : 'neutral', 0.3);
      const ch = L(-44.4, 7.6, -2.7), mp = me.root.position;   // the giant face (fixed: deterministic)
      me.root.rotation.set(0, L.yaw - 0.2, 0); void mp;   // 3/4 to camera, gazing up-left at the giant face
      me.pose('idle', t, { lookAt: L(-39.6, 6.0, 2.9) }); me.face(t > tp ? 'grin' : 'smile', 0.4);
      const kf = humanFace(me), inv = L.M.clone().invert();
      const kfl = kf.clone().applyMatrix4(inv), chl = ch.clone().applyMatrix4(inv);
      const mid = kfl.clone().lerp(chl, 0.5);
      P.purr.position.copy(mid.clone().add(V(0.4, -0.6, 2.2))); P.purr.rotation.y = 0.5; P.purr.scale.setScalar(2.4); void chl; P.purr.userData.set(t, t > tp ? 1 : 0);
      P.hearts.forEach((h, k) => { const d = t - (tp + 0.1 + k * 0.12); if (d < 0) { h.position.set(0, -50, 0); return; } h.position.set(mid.x + (k % 3 - 1) * 1.2, kfl.y + 1.2 + d * 1.5 + (k % 2) * 0.7, mid.z + 1.2 + (k % 2) * 0.6); h.scale.setScalar(0.8 * Math.min(1, d / 0.2)); });
      const k = ease.inOutSine(clamp(lt / 2.8, 0, 1));
      ctx.cam.set({ pos: L(lerp(-34.4, -35.0, k), lerp(1.2, 1.1, k), lerp(7.8, 7.1, k)), look: L(-42.6, 3.8, -1.9), fov: 58 });
      fill(ctx, kf.clone().add(V(1.2, 0.2, 2.5)), 1.4, '#ffe0c8', 8);
    },
  },
  // ── "And I started to grow."
  {
    name: 'i grow', start: 'b22.w10-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk');
      put(ctx, 'me', L(-30, 0, -1.0), L.yaw + PI / 2 - 0.1, 1);
      ctx.store.crowd = crowd(ctx, [X[13], X[14], X[15], X[16]], [[-24, 4.0, -1.8], [-23, -3.2, -1.2], [-25.5, 5.6, -2.2], [-22, 1.2, -1.5]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, tg = ctx.time('b22.w10');
      const s = lerp(1, 7, ease.inOutCubic(clamp((t - tg) / 0.95, 0, 1)));
      me.root.scale.setScalar(s); lookHands(me, t); me.face('shocked', 0.3);
      animList(ctx.store.crowd, t, 'surprised', 'shocked', () => ({ lookAt: L(-30, 2 * s, -1) }));
      const head = headPt(me, 0.2);
      ctx.cam.set({ pos: L(-22.5, 0.8, -2.2), look: head.clone().lerp(L(-30, 1.0, -1), 0.35), fov: 62 });
      ctx.cam.shake(0.08, t, 41);
    },
  },
  // ── b23 "Turns out, in this town, it works both ways."  — two giants on the hill at sunset
  {
    name: 'both ways', start: 'b23-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { glow: 0.9 }); const P = ctx.props;
      addTo(ctx, P.mesa, MESA.x, 0, MESA.z, 0);
      const fy = yawTo(MESA.x, MESA.z, -20, -2);
      const fw = V(Math.sin(fy), 0, Math.cos(fy)), sd = V(Math.cos(fy), 0, -Math.sin(fy));
      const edge = V(MESA.x, 0, MESA.z).addScaledVector(fw, 17.5);
      const kid = edge.clone().addScaledVector(sd, -3.2);
      put(ctx, 'me', L(kid.x, 9.3 - 0.55 * 9, kid.z), L.yaw + fy, 9);
      const cat = edge.clone().addScaledVector(sd, 3.4).addScaledVector(fw, -1.0);
      put(ctx, 'waffles', L(cat.x, 9.3, cat.z), L.yaw + fy - 0.2, 22);
      ctx.store.edge = edge;
      addTo(ctx, P.sun, MESA.x - 60, 34, MESA.z + 70); addTo(ctx, P.sunCore, MESA.x - 60, 34, MESA.z + 70);
      const list = blockFill(-37, -26, 3.5, 9.5, 70, { seed: 31, faceX: MESA.x, faceZ: MESA.z });
      filler(ctx, list);
      ctx.store.fy = fy;
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, w = ctx.cast.waffles;
      me.pose('sit', t, { hands: 'lap' }); me.face('smile', 0.4);
      const J = me.joints; J.armL.rotation.set(-0.3, 0, 1.25); J.foreArmL.rotation.set(-0.5, 0, 0); J.head.rotation.y += 0.15;
      bigCatSit(w, t, { face: 'smile', faceT: 0.3, headPitch: 0.1, headYaw: -0.2 });
      P.filler.userData.set(t, { arms: 'up', bounce: 0.3, speed: 0.8 });
      const k = ease.inOutSine(clamp(lt / 3.3, 0, 1)), e = ctx.store.edge, cy = 5 + 0.8 * k;
      ctx.cam.set({ pos: L(-12 - 3 * k, cy, -10), look: L(e.x, cy + 3.5, e.z), fov: 40 - 2 * k });
      const tw = ctx.time('b23.w5'), te = ctx.time('b23.w8') + 0.32;
      tag(ctx, 'IT WORKS BOTH WAYS', tw, te, { y: 0.13, size: 76, bg: 'rgba(255,122,60,0.92)' });
      iris(ctx, te + 0.02, 0.42, 0.45);
    },
  },
];
