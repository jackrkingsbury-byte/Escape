// In This Town — Episode 23: "Low Moon".  The moon hangs way too low and creeps closer every night; only the whole town
// shouting at nine pushes it back up.  Then flu season takes everyone's voice, the moon sits on the clock tower… and the
// one indoor kid plays five years of recorded shouting through Dad's speakers.  The moon flies up — and blinks.  It's an eye.
// Film contract: SPEC.md §8.  Timeline: episodes/ep23/timeline.json.
//
// Sets: 'town' (buildTown, seed 23, banner SHOUT TIME 9 PM) and 'room' (the hero bedroom, dark window).
// Town-local coordinates (T(ctx)): main street along x (centre z = 0, pavements z = ±5.15…7.5, house fronts ±10.5),
// clock tower at (−51, 1.5) with the east clock face at x ≈ −49.6, y = 11.  Stage deck y = 0.8, front edge x = 49.5.
// The giant moon (props.moonEye, radius MR) lives in the west; positions per story state are in MO.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS, extraSpecs } from '../cast.js';
import { WALK_SPEED } from '../characters.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { makeZzz } from '../ep9/props9.js';
import { glowSprite, makePuff, makeSparkles } from '../ep18/props.js';
import { makeNotes, makeSoundRings } from '../ep16/props.js';
import { makeFillerCrowd, makeBulb } from '../ep19/props.js';
import { makeShockRing } from '../ep20/props.js';
import { makeHedge } from '../ep21/props.js';
import {
  makeMoonEye, makeClockFace, makeBendLamp, makeNoMusicSign, makeMustache, makeKazoo, makeSpeakerTower, makeTablet,
  makeSickFacade, makeDoorway, makeRoofTile, makeThermometer, makeBlanket,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const PJC = [['#9fd4ff', '#ffffff'], ['#ffb3c8', '#ffffff'], ['#c8f0b0', '#ffffff'], ['#ffe08a', '#ffffff'], ['#d8c4ff', '#ffffff'], ['#ffc89a', '#ffffff']];
const PJ = Object.fromEntries(Object.values(extraSpecs(6, 523)).map((s, i) => [`pj${i}`, {
  ...s, id: `pj${i}`, top: { style: 'tee', color: PJC[i][0], accent: PJC[i][1], emblem: 'stripe' }, bottom: { style: 'pants', color: PJC[i][0] },
  shoes: ['#ff9fb0', '#9fd4ff', '#ffe08a'][i % 3], accessories: [],
}]));
const PJ_IDS = Object.keys(PJ);
const SPECIAL = {
  tony: { id: 'tony', skin: '#e0ac69', hair: { style: 'bald', color: '#e0ac69' }, top: { style: 'tee', color: '#3fae4e', accent: '#ffffff' },
    bottom: { style: 'pants', color: '#3a3d46' }, shoes: '#1d1d22', accessories: [], scale: 1.16, build: 1.45 },
  rose: { id: 'rose', skin: '#f4d0b5', hair: { style: 'bun', color: '#cfcfd4' }, top: { style: 'cardigan', color: '#8a5cff', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#5a4a6a' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.86 },
  otis: { id: 'otis', skin: '#ffdbac', hair: { style: 'short', color: '#c8903a' }, top: { style: 'tee', color: '#7fd3ff', accent: '#ffffff', emblem: 'star' },
    bottom: { style: 'shorts', color: '#ffffff' }, shoes: '#ffffff', accessories: [], scale: 0.42, build: 1.15 },
  otisDad: { id: 'otisDad', skin: '#c68642', hair: { style: 'short', color: '#1a120c' }, top: { style: 'hoodie', color: '#ff7a2f', accent: '#ffffff' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#f2f2f2', accessories: ['beard'], scale: 1.0 },
  dad: { id: 'dad', skin: '#f1c7a1', hair: { style: 'short', color: '#3b2416' }, top: { style: 'tee', color: '#4f8ff0', accent: '#ffffff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#4f8ff0' }, shoes: '#9fd4ff', accessories: ['beard'], scale: 1.02 },
  cat: { creature: 'cat', id: 'cat' },
};
export const cast = { me: MAIN.me, mayor: MAIN.mayor, ...SPECIAL, ...PJ, ...EXTRAS };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 23, banner: ['SHOUT', 'TIME', '9 PM'] }),
  room: () => buildRoom({ variant: 'hero', window: 'dark' }),
};
const X = EXTRA_IDS;

// ───────────────────────────────────────────────────────────────────────────────────────── layout (town-local)
const MR = 22;                                         // moon radius
const MO = {
  base: [-90, 40, 6], flash: [-330, 110, -30], doors: [-90, 30, 2], tower: [-52, 37.4, 1.5], far: [-330, 215, -40],
  up: [[-52, 37.4, 1.5], [-60, 56, 0], [-82, 82, -5], [-122, 112, -12], [-185, 150, -22], [-262, 190, -32], [-330, 215, -40]],
};
const TW = { x: -51, z: 1.5, face: -49.58, cy: 11 };
const LAMPS = [[-33, -5.15], [-21, -5.15], [-9, -5.15], [3, -5.15], [15, -5.15], [27, -5.15], [-27, 5.15], [-15, 5.15], [-3, 5.15], [9, 5.15], [21, 5.15]];
const FACADE = { x: -3, z: -8.75 };
const STAGE_Y = 0.8;
const SPK = { x: 51.5, z: 1.65 };                      // speaker towers at (SPK.x, ±SPK.z), facing −x
const KID_STAGE = { x: 50.35, z: 0 };
const HEDGE = { x: -25.5, z: 8.9 };
const OTIS_ST = { x: 2, z: 1.2 };                      // dad + Otis on the street (b09/b10)
const OTIS_SQ = { x: 41.2, z: 0.4 };                   // dad + Otis in the square (b12)

export function init(ctx) {
  const P = ctx.props;
  P.moon = makeMoonEye(); P.winMoon = makeMoonEye();
  P.clock = makeClockFace();
  P.lamps = LAMPS.map(() => makeBendLamp());
  P.sign = makeNoMusicSign();
  P.mustHead = makeMustache('#4a3426'); P.mustFly = makeMustache('#4a3426');
  P.kazoo = makeKazoo(); P.kazoo.scale.setScalar(1.8); P.notes = makeNotes(6, '#ffffff');
  P.spkA = makeSpeakerTower(); P.spkB = makeSpeakerTower();
  P.tablet = makeTablet();
  P.facade = makeSickFacade();
  P.doors = [0, 1, 2, 3, 4].map((i) => makeDoorway(['#3f7a5a', '#b5543f', '#2f4d8a', '#7a1f2b', '#e0a43a'][i]));
  P.tiles = [makeRoofTile(), makeRoofTile()];
  P.thermo = [0, 1, 2].map(() => makeThermometer());
  P.blanket = makeBlanket('#3f6fd8');
  P.hedge = makeHedge();
  P.zzz = makeZzz(0.55); P.zzz2 = makeZzz(0.4);
  P.filler = makeFillerCrowd(170);
  P.dust = makeSparkles({ n: 90, w: 26, h: 16, d: 10, color: '#eef2ff', size: 0.1 });
  P.dustNear = makeSparkles({ n: 40, w: 5, h: 4, d: 4, color: '#f4f6ff', size: 0.035 });
  P.rings = makeSoundRings(5); P.ringsB = makeSoundRings(5);
  P.shock = makeShockRing();
  P.leaves = makePuff({ color: '#4caf50', count: 16, radius: 0.6, seed: 5 });
  P.poof = makePuff({ color: '#d8d0c0', count: 18, radius: 0.8, seed: 8 });
  P.bulb = makeBulb();
  P.stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 10), new THREE.MeshStandardMaterial({ color: '#2a2a30', roughness: 0.5, metalness: 0.4 }));
  P.flash = makeShockRing();
  P.strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1), new THREE.MeshStandardMaterial({ color: '#e8232b', roughness: 0.6 }));
  { const sm = new THREE.MeshStandardMaterial({ color: '#ffb703', roughness: 0.55, emissive: '#5a3a00', emissiveIntensity: 0.6 });
    P.haul = [0, 1].map(() => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), sm)); }
  { const dm = new THREE.MeshBasicMaterial({ color: '#bfefff', toneMapped: false });
    P.drops = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), dm); m.scale.set(1, 1.5, 1); return m; }); }
  P.sky = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ color: '#0a0d24' }));
  P.moonLight = new THREE.DirectionalLight('#cfdcff', 0.9);
  P.fill = new THREE.PointLight('#f0f2ff', 5, 12, 1.4);
  P.warm = new THREE.PointLight('#ffc070', 0, 9, 1.4);
  P.eyeLight = new THREE.PointLight('#a8f4ff', 0, 7, 1.3);
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function T(ctx) { const r = ctx.set.root; r.updateMatrixWorld(true); const M = r.matrixWorld.clone(); const f = (x, y, z) => V(x, y, z).applyMatrix4(M); f.yaw = yawOf(r); f.M = M; return f; }
function put(ctx, id, p, yaw, scale) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); if (scale != null) r.scale.setScalar(scale); return ctx.cast[id]; }
function addTo(ctx, obj, x, y, z, ry = 0, s = null) { const o = obj.root && obj.root.isObject3D ? obj.root : obj; ctx.add(o, ctx.set.root); o.position.set(x, y, z); o.rotation.set(0, ry, 0); if (s != null) o.scale.setScalar(s); return o; }
const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.15, size: 70, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,40,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale ?? 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 160, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.12, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headPt(ch, y = 0.3, z = 0) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, y, z)); }
function fill(ctx, pos, k = 1, color = '#f0f2ff', dist = 12) { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); f.distance = dist; }
function setCam(ctx, c, k = 0, color, dist) { ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k, color, dist); return c; }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0, color, dist) { const c = camLerp(a, b, clamp(u, 0, 1)); ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k, color, dist); return c; }
function pop(ctx, t0, dur = 0.12, color = '#ffffff', a = 0.5) { const d = ctx.t - t0; if (d >= 0 && d < dur) ctx.fx.overlay(color, a * (1 - d / dur)); }
function hitPulse(times, t, decay = 0.2) { let p = 0; for (const h of times) if (t >= h) p = Math.max(p, Math.exp(-(t - h) / decay)); return p; }
function lastBefore(times, t) { let r = null; for (const x of times) if (x <= t) r = x; return r; }
function shakeOn(ctx, hits, amt = 0.6, dur = 0.35, seed = 7) { for (const h of hits) { const d = ctx.t - h; if (d >= 0 && d < dur) ctx.cam.shake(amt * (1 - d / dur), ctx.t, seed); } }
const H = (beat, i) => (i === 0 ? `${beat}.h0-0.12` : `${beat}.h${i}-0.03`);
const hussHits = (ctx, beat) => ctx.hussTimes(beat).map((h) => h + 0.03);
const vv = (a) => V(a[0], a[1], a[2]);
const lerpA = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

// ─── built-in town pieces we hide / restore (the set's own small moon, its lamp posts)
function builtins(ctx) {
  const r = ctx.set.root; let b = ctx.props.bi;
  if (!b || b.root !== r) {
    b = { root: r, moon: [], lamps: [], view: r.getObjectByName('windowView') };
    r.children.forEach((o) => { if (o.isMesh && o.position.length() > 300 && o.material && o.material.map) b.moon.push(o); });
    for (const n of ['lampPosts', 'lampCores', 'lampHalos', 'lampPools']) { const o = r.getObjectByName(n); if (o) b.lamps.push(o); }
    ctx.props.bi = b;
  }
  return b;
}
function lampsOn(ctx, posts = true, light = true) { const b = builtins(ctx); b.lamps.forEach((o, i) => { o.visible = i === 0 ? posts : light && posts; }); }

// ─── town looks
function town(ctx, light = 'quiet_night', { glow = 0.85, exposure = null, lamps = true, party = false } = {}) {
  const s = ctx.set;
  s.setLighting(light); s.set('partyProps', party); s.set('fireworks', false); s.set('foam', 0);
  s.set('windowGlow', light === 'day' ? 0 : glow); s.set('standsCrowd', false); s.set('crowdMotion', 1);
  s.exposure = exposure ?? (light === 'quiet_night' ? 1.25 : light === 'dusk' ? 1.05 : 1.0);
  const b = builtins(ctx); b.moon.forEach((o) => { o.visible = false; });
  lampsOn(ctx, lamps);
  const L = T(ctx); ctx.store.L = L;
  const P = ctx.props; ctx.add(P.moon); ctx.add(P.moonLight); ctx.add(P.moonLight.target);
  return L;
}
/** per-frame: the moon at town-local position p (array) with radius R, facing the camera; moonlight + dust */
function moonFrame(ctx, cam, p, R = MR, o = {}) {
  const L = ctx.store.L, P = ctx.props, M = P.moon;
  builtins(ctx).moon.forEach((m) => { m.visible = false; });
  const w = Array.isArray(p) ? L(p[0], p[1], p[2]) : p;
  M.position.copy(w); M.scale.setScalar(R); M.userData.face(cam.pos);
  M.userData.gaze(o.gaze ?? null);
  M.userData.set({ pupil: o.pupil ?? 0, lid: o.lid ?? 0, glow: o.glow ?? 1.3, dilate: o.dilate ?? 1, halo: o.halo ?? 0.6, slit: o.slit ?? 0, irisGlow: o.irisGlow ?? 1, haloColor: o.haloColor ?? '#cdd6ff' });
  const ml = P.moonLight; ml.position.copy(w); ml.target.position.copy(cam.look); ml.intensity = o.light ?? 1.0; ml.color.set(o.lightColor ?? '#cfdcff');
  if (o.dust !== false) { const fwd = cam.look.clone().sub(cam.pos).normalize(); ctx.add(P.dust); P.dust.position.copy(cam.pos).addScaledVector(fwd, Math.max(14, o.dustDist ?? 14)); P.dust.lookAt(cam.pos); P.dust.userData.set(ctx.t, o.dustA ?? 0.85); }
  return w;
}
function crowd(ctx, ids, spots) {
  const L = ctx.store.L;
  return ids.map((id, i) => { const [x, y, z, yw] = spots[i]; const ch = put(ctx, id, L(x, y, z), L.yaw + yw); return { ch, id, k: i, ph: hash(i * 1.9 + 3) * 3, x, y, z, yw }; });
}
function blockFill(x0, x1, z0, z1, n, { seed = 3, faceX = null, faceZ = null, yaw = null, y = 0 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(i * 1.37 + seed)), z = lerp(z0, z1, hash(i * 2.71 + seed));
    const yw = yaw != null ? yaw : Math.atan2((faceX ?? x) - x, (faceZ ?? z) - z);
    out.push({ x, y, z, yaw: yw + (hash(i * 4.4 + seed) - 0.5) * 0.5, k: i, s: 0.86 + 0.24 * hash(i * 3.3 + seed) });
  }
  return out;
}
function filler(ctx, list) { const f = ctx.props.filler; ctx.add(f, ctx.set.root); f.position.set(0, 0, 0); f.userData.layout(list); return f; }

// ─── poses
function fistsPose(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.6 });
  const J = ch.joints, sh = 0.05 * Math.sin(t * 30);
  J.armL.rotation.set(-0.35 + sh, 0, 0.32); J.armR.rotation.set(-0.35 - sh, 0, -0.32);
  J.foreArmL.rotation.set(-1.25, 0, 0); J.foreArmR.rotation.set(-1.25, 0, 0);
  J.torso.rotation.x += 0.08 * k;
}
/** shouting at the sky: fists, chest out, head thrown back by `back` */
function shoutPose(ch, t, back = 0.45, hit = 0) {
  fistsPose(ch, t);
  const J = ch.joints;
  J.torso.rotation.x -= 0.18 + 0.08 * hit; J.head.rotation.x -= back + 0.1 * hit;
  J.armL.rotation.z += 0.25 * hit; J.armR.rotation.z -= 0.25 * hit;
}
function earsPose(ch, t) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints, w = 0.04 * Math.sin(t * 20);
  J.armL.rotation.set(-0.35, 0, 2.05); J.foreArmL.rotation.set(0, 0, 2.25 + w);
  J.armR.rotation.set(-0.35, 0, -2.05); J.foreArmR.rotation.set(0, 0, -2.25 - w);
  J.torso.rotation.x += 0.12; J.head.rotation.z = 0.08 * Math.sin(t * 9);
}
function holdUp(ch, t, k = 1, o = {}) {   // hands together in front of the chest (holding a tablet)
  ch.pose('idle', t, { intensity: 0.3, ...o });
  const J = ch.joints;
  J.armL.rotation.set(-1.0 * k, 0, -0.32 * k); J.armR.rotation.set(-1.0 * k, 0, 0.32 * k);
  J.foreArmL.rotation.set(-0.75 * k, 0, 0); J.foreArmR.rotation.set(-0.75 * k, 0, 0);
}
function dragPose(ch, t) {
  ch.pose('walk', t, { speed: 1.1 });
  const J = ch.joints;
  J.torso.rotation.x += 0.22; J.head.rotation.x -= 0.12;
  J.armR.rotation.set(0.85, 0, -0.12); J.foreArmR.rotation.set(-0.1, 0, 0);
}
/** hauling a heavy load with a strap over the right shoulder: leaning hard into it, both hands gripping at the shoulder */
function haulPose(ch, t) {
  ch.pose('walk', t, { speed: 0.5 });
  const J = ch.joints, w = 0.05 * Math.sin(t * 22);
  J.torso.rotation.x += 0.36; J.head.rotation.x -= 0.34; J.head.rotation.z = 0.06 * Math.sin(t * 6);
  J.armR.rotation.set(-2.55 + w, 0, 0.1); J.foreArmR.rotation.set(-1.75, 0, 0);
  J.armL.rotation.set(-2.2 - w, 0, -0.5); J.foreArmL.rotation.set(-1.55, 0, 0);
}
/** a box mesh stretched between two world points (thickness th) */
function beam(m, a, b, th = 0.09) { m.position.copy(a).lerp(b, 0.5); m.lookAt(b); m.scale.set(th, th * 0.55, Math.max(0.01, a.distanceTo(b))); }
function kazooPose(ch, t) {
  ch.pose('idle', t, { intensity: 0.4 });
  const J = ch.joints;
  J.armR.rotation.set(-1.25, 0, 0.55); J.foreArmR.rotation.set(-1.7, 0, 0);
  J.armL.rotation.set(-0.15, 0, 0.1); J.head.rotation.x -= 0.08;
}
/** dad with Otis riding on his head: returns the world point for Otis's root */
function dadArms(ch, t) {
  ch.pose('idle', t, { intensity: 0.4 });
  const J = ch.joints;
  J.armL.rotation.set(-0.2, 0, 2.55); J.foreArmL.rotation.set(0, 0, 0.75);
  J.armR.rotation.set(-0.2, 0, -2.55); J.foreArmR.rotation.set(0, 0, -0.75);
}
function otisOnDad(ctx, dad, otis, t, { act = 'idle', face = 'determined', ft = 0.5, hit = 0 } = {}) {
  dad.root.updateMatrixWorld(true);
  const top = dad.joints.head.localToWorld(V(0, 0.6, -0.04));
  otis.root.position.copy(top).add(up(-0.02)); otis.root.rotation.set(0, dad.root.rotation.y, 0);
  if (act === 'fists') { otis.pose('idle', t, { seated: true, seatHeight: 0.02 }); const J = otis.joints; J.armL.rotation.set(-0.5, 0, 0.5 + 0.3 * hit); J.armR.rotation.set(-0.5, 0, -0.5 - 0.3 * hit); J.foreArmL.rotation.set(-1.3, 0, 0); J.foreArmR.rotation.set(-1.3, 0, 0); J.head.rotation.x -= 0.15 + 0.15 * hit; }
  else otis.pose(act, t, { seated: true, seatHeight: 0.02 });
  otis.face(face, ft);
}
/** dad lying flat (crowdSurf) with his body along town/room X and face toward +Z (window shot) */
const _qBasis = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 1, 0), V(0, 0, 1), V(1, 0, 0)));

// ─── square crowd (b03, b12)
const SQ_SPOTS = (() => {
  const s = [];
  [[40.6, [-2.4, -1.2, 0, 1.2, 2.4]], [41.9, [-3.0, -1.8, -0.6, 0.6, 1.8, 3.0]], [43.1, [-0.2]]].forEach(([x, zs], r) => zs.forEach((z, j) => {
    s.push([x + (hash(r * 7 + j) - 0.5) * 0.3, 0, z + (hash(r * 3 + j * 5) - 0.5) * 0.3, -PI / 2 + (hash(r + j * 2.2) - 0.5) * 0.5]);
  }));
  return s;
})();
function squareCrowd(ctx, ids = X.slice(0, 12)) {
  const list = crowd(ctx, ids, SQ_SPOTS);
  filler(ctx, [...blockFill(43.9, 48.0, -6.5, 6.5, 95, { seed: 4, faceX: -90, faceZ: 6 }), ...blockFill(38.0, 43.5, -7.6, -4.0, 30, { seed: 9, faceX: -90, faceZ: 6 }), ...blockFill(38.0, 43.5, 4.0, 7.6, 30, { seed: 13, faceX: -90, faceZ: 6 })]);
  return list;
}

// ─── bend lamps replacing the built-in posts
function bendLamps(ctx) {
  lampsOn(ctx, false);
  ctx.props.lamps.forEach((l, i) => { l.visible = true; }); ctx.props.lamps.forEach((l, i) => addTo(ctx, l, LAMPS[i][0], LAMPS[i][1] < 0 ? 0.12 : 0.12, LAMPS[i][1], 0));
}
function bendFrame(ctx, k, { flick = 0, mx = MO.tower[0], mz = MO.tower[2], stagger = null } = {}) {
  ctx.props.lamps.forEach((l, i) => {
    const [x, z] = LAMPS[i], d = yawTo(mx, mz, x, z);
    const ki = typeof stagger === 'function' ? stagger(i) : k;
    const on = flick > 0 ? (hash(Math.floor(ctx.t * 14) + i * 3.3) > flick ? 1 : 0.1) : 1;
    l.userData.set({ tilt: 0.52 * ki, dir: d, on });
  });
}

const LAMP_CAM_L = [[[-8.0, 1.1, 7.3], [-22, 4.6, -3.5], 66], [[-8.6, 1.1, 7.1], [-22.4, 4.7, -3.5], 64]];
const lampCam = (ctx) => LAMP_CAM_L.map(([p, l, f]) => ({ pos: ctx.store.L(...p), look: ctx.store.L(...l), fov: f }));
/** tablet held between the hands, screen turned to +x (toward the camera side), tilted back a little; returns its centre */
function tabletHeld(ctx, me, dy = 0.12) {
  const P = ctx.props; me.root.updateMatrixWorld(true);
  const hc = me.joints.handL.getWorldPosition(V()).lerp(me.joints.handR.getWorldPosition(V()), 0.5);
  P.tablet.scale.setScalar(1); P.tablet.position.copy(hc).add(V(0.06, dy, 0)); P.tablet.rotation.set(0, PI / 2 + yawOf(ctx.set.root), 0, 'YXZ'); P.tablet.rotateX(-0.25);
  return P.tablet.position.clone();
}
// ─── room helpers (hero bedroom; window x −1.45…−0.15, y 0.95…2.25, back wall z −2.1)
const WIN = { x: -0.8, y: 1.6, z: -2.16 };
function room(ctx, { light = 'night' } = {}) {
  const s = ctx.set; s.setLighting(light); s.set('window', 'dark'); s.exposure = 1.15;
  const R = T(ctx); ctx.store.R = R;
  const b = builtins(ctx); if (b.view) b.view.visible = true;
  return R;
}
/** the moon seen through the window: flattened disc between window and backdrop */
function windowMoon(ctx, x = -0.55, y = 1.95, s = 0.55, o = {}) {
  const R = ctx.store.R, M = ctx.props.winMoon; ctx.add(M);
  M.position.copy(R(x, y, -3.17)); M.rotation.set(0, yawOf(ctx.set.root), 0); M.scale.set(s, s, 0.06);
  M.userData.gaze(null); M.userData.set({ pupil: 0, lid: 0, glow: 1.25, halo: 0.45, ...o });
  return M;
}
const KID_BED = { x: -1.55, z: -0.75 };   // kid sitting on the bed edge facing +x

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, the moon is way too close. And it's getting closer."  — crane up the quiet street
  {
    name: 'moon street crane', start: 0, set: 'town',
    setup(ctx) {
      const L = town(ctx);
      ctx.store.walk = crowd(ctx, [X[0], X[1], X[2], X[3]], [[5.0, 0.12, 2.0, PI / 2 + 0.55], [2.5, 0.12, -1.1, 0.5], [-1.5, 0.12, 2.3, 2.35], [-3.2, 0.12, -1.5, 0.6]]);
    },
    update(ctx, lt, u) {
      const L = ctx.store.L, t = ctx.t;
      const c = moveCam(ctx, { pos: L(13.5, 0.8, 0.6), look: L(-10, 3.2, 0.4), fov: 58 }, { pos: L(13, 7.5, 0.9), look: L(-60, 20, 4), fov: 46 }, ease.inOutSine(u), 0.6);
      const grow = ease.inOutCubic(clamp((t - 3.0) / 0.7, 0, 1));
      moonFrame(ctx, c, MO.base, MR * (0.94 + 0.1 * grow), { dustDist: 12 });
      const mw = L(MO.base[0], MO.base[1], MO.base[2]);
      ctx.store.walk.forEach((w, i) => {
        if (i === 0) { const sp = WALK_SPEED * 0.6 * lt; w.ch.root.position.copy(L(w.x + sp * Math.sin(w.yw), 0.12, w.z + sp * Math.cos(w.yw))); w.ch.pose('walk', t + w.ph, { speed: 0.6, headPitch: -0.35 }); w.ch.face('shocked', 0.4); }
        else if (i === 1) { w.ch.pose('point', t + w.ph, { headPitch: -0.45, headYaw: -0.3 }); w.ch.face('shocked', 0.4); }
        else { w.ch.pose('idle', t + w.ph, { headPitch: -0.5 }); w.ch.face(i === 2 ? 'sweat' : 'shocked', 0.4); }
      });
      if (t > 3.3) ctx.cam.shake(0.08, t, 3);
    },
  },
  // ── b02 "The only thing that pushes it back up is shouting."  — the kid, low hero angle, the moon behind him
  {
    name: 'kid and moon', start: 'b02-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      put(ctx, 'me', L(-20.2, 0.12, 5.6), yawTo(-20.2, 5.6, -17.25, 5.2) - 0.25);
      put(ctx, X[4], L(-24.5, 0.12, 7.0), yawTo(-24.5, 7, -90, 6));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      fistsPose(me, t); me.joints.head.rotation.x -= 0.42; me.joints.head.rotation.y += 0.3;
      me.face('determined', t);
      const ex = ctx.cast[X[4]]; ex.pose('idle', t, { lookAt: L(-90, 40, 6) }); ex.face('sweat', t);
      const k = ease.inOutSine(clamp(lt / 2.4, 0, 1));
      const c = moveCam(ctx, { pos: L(-16.9, 0.32, 5.1), look: L(-19.6, 1.25, 5.45), fov: 46 }, { pos: L(-17.25, 0.25, 5.2), look: L(-19.8, 1.3, 5.45), fov: 46 }, k, 1.3);
      moonFrame(ctx, c, [MO.base[0], lerp(40, 37, k), MO.base[2]]);
      tag(ctx, 'SHOUTING', ctx.time('b02.w9') + 0.05, Infinity, { y: 0.085, size: 112, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  // ── b03 HUSS ×6 — the town square shouts; the moon jolts up one notch per HUSS
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `shout time #${i + 1}`, start: H('b03', i), set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.9 }); ctx.store.cr = squareCrowd(ctx); },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, hits = hussHits(ctx, 'b03');
      const n = hits.filter((h) => h <= t).length, h = lastBefore(hits, t), dh = h != null ? t - h : 9, hp = hitPulse(hits, t, 0.18);
      ctx.store.cr.forEach((c) => { shoutPose(c.ch, t + c.ph, 0.5, hp); c.ch.face(dh < 0.22 ? 'huss' : 'determined', t + c.ph); });
      ctx.props.filler.userData.set(t, { arms: 'up', bounce: 0.3 + 0.6 * hp, speed: 0.8 });
      const jump = (k) => 37 + 6 * (Math.max(0, n - 1) + ease.outBack(clamp(dh / 0.14, 0, 1)) * (n > 0 ? 1 : 0));
      const my = jump();
      const mp = [MO.base[0], my, MO.base[2]];
      const mw = L(mp[0], mp[1], mp[2]);
      const cams = [
        { pos: L(37.0, 1.2, 1.2), look: L(41.0, 1.45, 0.2), fov: 46 },
        { pos: L(49, 6.5, 2.2), look: mw.clone().add(up(-16)), fov: 42 },
        { pos: L(37.7, 1.5, -1.3), look: L(40.9, 1.5, -0.7), fov: 40 },
        { pos: L(45.5, 4.6, 0.6), look: mw.clone().add(up(-18)), fov: 40 },
        { pos: L(47.5, 10, 10), look: L(0, 16, 3), fov: 54 },
        { pos: L(37.3, 0.5, -2.4), look: L(41.2, 1.3, 0.0), fov: 46 },
      ];
      const c = setCam(ctx, cams[i], 1.6);
      moonFrame(ctx, c, mp, MR, { light: 1.2 });
      ctx.cam.punch(hits, t, 0.1, 0.2); shakeOn(ctx, hits, 0.5, 0.25, 11 + i);
      tag(ctx, 'SHOUT TIME: 9:00 PM', ctx.time('b03') - 0.1, Infinity, { y: 0.12, size: 64, bg: 'rgba(200,0,40,0.9)' });
    },
  })),
  // ── b04 "Five years ago it was a normal moon."  — flashback, dusk, neighbours waving
  {
    name: 'five years ago', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { glow: 0.5 });
      ctx.store.cr = crowd(ctx, [X[4], X[5], X[6], X[7], X[8]], [[-9, 0.12, 6.2, PI / 2], [1.2, 0.12, 6.3, 0.95], [-2.2, 0.12, -5.7, 0.75], [-12, 0.12, -6.4, PI / 2], [-15, 0.12, -6.0, PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, cr = ctx.store.cr;
      cr.forEach((c, i) => {
        if (i === 0 || i === 3) { c.ch.root.position.copy(L(c.x + WALK_SPEED * 0.8 * lt, 0.12, c.z)); c.ch.pose('walk', t + c.ph, { speed: 0.8 }); c.ch.face('smile', t + c.ph); }
        else if (i === 4) { c.ch.root.position.copy(L(c.x + WALK_SPEED * 0.7 * lt, 0.12, c.z)); c.ch.pose('walk', t + c.ph, { speed: 0.7 }); c.ch.face('smile', t + c.ph); }
        else { c.ch.pose('wave', t + c.ph); c.ch.face('grin', t + c.ph); }
      });
      const c = moveCam(ctx, { pos: L(8.5, 1.3, 7.6), look: L(-6, 3.8, 4), fov: 46 }, { pos: L(7.6, 1.3, 7.4), look: L(-6, 3.9, 4), fov: 46 }, lt / 2.1, 0.5, '#fff0d8');
      moonFrame(ctx, c, MO.flash, 13, { light: 0.2, dust: false, halo: 0.5 });
      ctx.fx.overlay('#ffb070', 0.1); ctx.fx.vignette(0.45);
      tag(ctx, '5 YEARS AGO', ctx.time('b04') - 0.05, Infinity, { y: 0.12, bg: 'rgba(120,70,20,0.9)' });
    },
  },
  {
    name: 'tiny polite moon', start: 'b04.w8-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { glow: 0.5 });
      ctx.store.cr = crowd(ctx, [X[5], X[6]], [[-1.5, 0.12, -6.0, 1.0], [0.2, 0.12, -6.4, -0.15]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.store.cr.forEach((c) => { c.ch.pose('wave', t + c.ph); c.ch.face('grin', t + c.ph); });
      const pos = L(3.0, 1.5, 1.0);
      const mw = L(MO.flash[0], MO.flash[1], MO.flash[2]);
      // end look: ~10° below the moon along its bearing, so the moon sits at y ≈ 0.25 above the rooftops / lamp tips
      const dm = mw.clone().sub(pos), hd = Math.hypot(dm.x, dm.z), el = Math.atan2(dm.y, hd) - 0.175;
      const endLook = pos.clone().add(V(dm.x / hd * 40, Math.tan(el) * 40, dm.z / hd * 40));
      const k = ease.inOutCubic(clamp((lt - 0.15) / 1.4, 0, 1));
      const look = L(-0.6, 1.2, -6.2).lerp(endLook, k);
      const c = setCam(ctx, { pos, look, fov: lerp(46, 44, k) }, 0.5, '#fff0d8');
      moonFrame(ctx, c, MO.flash, 13, { light: 0.2, dust: false, halo: 0.6 });
      ctx.fx.overlay('#ffb070', 0.1); ctx.fx.vignette(0.45);
      tag(ctx, '5 YEARS AGO', ctx.time('b04') - 0.05, ctx.time('b04.w8') - 0.02, { y: 0.12, bg: 'rgba(120,70,20,0.9)' });
      const W = { bg: 'rgba(255,255,255,0.92)', fill: '#1d1d22', stroke: '#ffffff', size: 80 };
      tag(ctx, 'TINY', ctx.time('b04.w8'), Infinity, { ...W, y: 0.1, x: 0.24, rot: -0.08 });
      tag(ctx, 'POLITE', ctx.time('b04.w9'), Infinity, { ...W, y: 0.19, x: 0.77, rot: 0.06 });
      tag(ctx, 'FAR AWAY', ctx.time('b04.w10'), Infinity, { ...W, y: 0.36, x: 0.5, rot: -0.04 });
    },
  },
  // ── b05 "Then the mayor banned loud music."  — the sign slams into the square
  {
    name: 'mayor bans', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { glow: 0.5 });
      put(ctx, 'mayor', L(40, 0, 4), yawTo(40, 4, 36.6, 8.4));
      addTo(ctx, ctx.props.sign, 41.3, 0, 4.1, yawTo(41.3, 4.1, 36.6, 8.4));
      addTo(ctx, ctx.props.poof.root, 41.3, 0.05, 4.1, 0, 1);
      ctx.store.cr = crowd(ctx, [X[9], X[10]], [[37.2, 0, 1.6, yawTo(37.2, 1.6, 40.6, 4)], [43.6, 0, 1.0, yawTo(43.6, 1.0, 40.6, 4)]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tb = ctx.markers.ban, m = ctx.cast.mayor, P = ctx.props;
      const k = clamp((t - (tb - 0.22)) / 0.22, 0, 1);
      P.sign.position.copy(L(41.3, lerp(9, -0.35, ease.inCubic(k)), 4.1));
      P.poof.update(clamp((t - tb) / 0.7, 0, 1));
      if (t < tb + 0.1) { m.pose('crossArms', t); m.face('smug', 0.3); }
      else { m.pose('point', t, { lookAt: P.sign.localToWorld(V(0, 2.2, 0)) }); m.face('smug', 0.3); }
      ctx.store.cr.forEach((c) => { c.ch.pose(t > tb ? 'surprised' : 'idle', t > tb ? t - tb : t + c.ph); c.ch.face(t > tb ? 'shocked' : 'smile', 0.3); });
      const c = moveCam(ctx, { pos: L(36.4, 1.0, 8.6), look: L(40.5, 1.4, 4.2), fov: 44 }, { pos: L(36.9, 1.0, 8.0), look: L(40.5, 1.45, 4.2), fov: 42 }, lt / 1.8, 0.6, '#fff0d8');
      moonFrame(ctx, c, MO.far, MR, { light: 0.2, dust: false });
      shakeOn(ctx, [tb], 0.6, 0.35, 5);
      stamp(ctx, 'BANNED', tb + 0.02, { y: 0.17 });
    },
  },
  // ── "That night, the moon came down to check on us."  — one smooth, creepy slide
  {
    name: 'moon comes down', start: 'b05.w6-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.9 });
      ctx.store.cr = crowd(ctx, [X[11], X[12]], [[6, 0.12, -6.5, -PI / 2 - 0.3], [7.2, 0.12, -6.9, -PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tc = ctx.time('b05.w10');
      const k = ease.inOutCubic(clamp((t - (tc - 0.4)) / 1.4, 0, 1));
      const mp = lerpA(MO.far, MO.base, k);
      const mw = L(mp[0], mp[1], mp[2]);
      ctx.store.cr.forEach((c) => { c.ch.pose(k > 0.3 ? 'surprised' : 'idle', k > 0.3 ? t - tc : t, { lookAt: mw }); c.ch.face(k > 0.3 ? 'shocked' : 'neutral', 0.3); });
      const look = L(-60, lerp(40, 17, k), lerp(-8, 3, k));
      const c = setCam(ctx, { pos: L(lerp(19, 17, lt / 2.6), 1.3, -1.0), look, fov: 48 }, 0.8);
      moonFrame(ctx, c, mp, MR, { light: lerp(0.3, 1.1, k) });
      if (k > 0.6) ctx.cam.shake(0.12, t, 4);
    },
  },
  // ── b06 "Now the rules are simple. Every night at nine…"  — the clock tower strikes nine, the moon behind it
  {
    name: 'clock strikes nine', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'quiet_night', { glow: 0.9 });
      addTo(ctx, ctx.props.clock, TW.face, TW.cy, TW.z, PI / 2);
      addTo(ctx, ctx.props.shock, TW.face + 0.1, TW.cy, TW.z, PI / 2);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tn = ctx.time('b06.w8');
      const mm = t < tn ? -0.035 * clamp((tn - t) / 2.0, 0, 1) - (t < tn - 0.05 ? 0.004 : 0) : 0;
      ctx.props.clock.userData.set(mm, 0.75 + mm / 12);
      ctx.props.shock.userData.set(t - tn, 7);
      const c = moveCam(ctx, { pos: L(-37.0, 8.4, 5.6), look: L(-49.6, 13.3, 1.6), fov: 40 }, { pos: L(-40.5, 9.4, 4.6), look: L(-49.6, 12.7, 1.6), fov: 36 }, ease.inOutSine(lt / 2.3), 0.8);
      moonFrame(ctx, c, MO.base, MR);
      pop(ctx, tn, 0.12, '#ffffff', 0.45); shakeOn(ctx, [tn], 0.3, 0.3, 8);
      tag(ctx, '9:00 PM', tn, Infinity, { y: 0.13, size: 96, fill: '#ffe14a', bg: 'rgba(20,20,40,0.85)' });
    },
  },
  // ── "…everyone goes outside and shouts."  — front doors open all down the street, pyjamas, everyone looks up
  {
    name: 'doors open', start: 'b06.w9-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.95 });
      const houses = (ctx.anchor('houses') || []).map((h) => {
        const d = h.door; d.updateMatrixWorld(true);
        const p = d.getWorldPosition(V()), q = d.getWorldQuaternion(new THREE.Quaternion()), f = V(0, 0, 1).applyQuaternion(q).setY(0).normalize();
        return { p, f, yaw: Math.atan2(f.x, f.z) };
      }).filter((h) => h.p.z < 0 && h.p.x > -30 && h.p.x < 5).sort((a, b) => b.p.x - a.p.x).slice(0, 3);
      ctx.store.houses = houses;
      houses.forEach((h, i) => {
        const dp = h.p.clone().addScaledVector(h.f, -0.9);
        const D = ctx.props.doors[i]; ctx.add(D); D.position.copy(dp); D.rotation.set(0, h.yaw, 0);
        const id = PJ_IDS[i]; put(ctx, id, h.p.clone().addScaledVector(h.f, -1.6), h.yaw);
      });
      const h0 = houses[0], side = V(h0.f.z, 0, -h0.f.x);
      ctx.store.side = side;
      ctx.store.nb = [[PJ_IDS[4], 11.0, -2.65, PI / 2 + 0.35], [PJ_IDS[5], 9.5, -5.9, PI / 2 - 0.45], [PJ_IDS[3], 3.5, -6.6, PI / 2 - 0.2]].map(([id, x, z, yw]) => put(ctx, id, L(x, 0.12, z), L.yaw + yw));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, t0 = ctx.time('b06.w9') - 0.05;
      const mw = L(MO.base[0], MO.base[1], MO.base[2]);
      ctx.store.houses.forEach((h, i) => {
        const to = t0 + 0.2 * i, k = clamp((t - to) / 0.35, 0, 1);
        ctx.props.doors[i].userData.set(ease.outCubic(k));
        const ch = ctx.cast[PJ_IDS[i]], w = clamp((t - to - 0.15) / 0.9, 0, 1);
        ch.root.position.copy(h.p.clone().addScaledVector(h.f, lerp(-1.6, 1.3, w)));
        if (w < 1) { ch.pose('walk', t + i, { speed: 1.2 }); ch.face('sleepy', 0.3); }
        else { ch.pose('idle', t + i, { headPitch: -0.45, headYaw: 0.45 }); ch.face('shocked', 0.3); }
      });
      ctx.store.nb.forEach((ch, k) => { ch.pose(k === 1 ? 'idle' : 'point', t + k, { headPitch: -0.5, headYaw: k === 1 ? 0.4 : -0.35 }); ch.face(k === 1 ? 'sweat' : 'shocked', 0.3); });
      // low wide shot along the north house row: doors open in sequence, receding toward the moon at the end of the street
      const c = moveCam(ctx, { pos: L(17.6, 0.7, -2.6), look: L(-15, -1.45, -8.0), fov: 54 }, { pos: L(16.8, 0.7, -2.6), look: L(-15, -1.35, -8.0), fov: 54 }, lt / 2.0, 1.6, '#f0f2ff', 16);
      moonFrame(ctx, c, MO.doors, MR, { dust: false });
      tag(ctx, '9:00 PM', ctx.time('b06') + 0.5, Infinity, { y: 0.12, size: 64, fill: '#ffe14a' });
    },
  },
  // ── b07 "Tony the butcher shouts so hard…"  — low hero angle, moon behind his head
  {
    name: 'tony shouts', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      const tony = put(ctx, 'tony', L(-6, 0, 2.2), yawTo(-6, 2.2, -2.9, 2.0));
      const P = ctx.props; ctx.add(P.mustHead, tony.joints.head); P.mustHead.position.set(0, 0.2, 0.305); P.mustHead.rotation.set(0, 0, 0); P.mustHead.scale.setScalar(1.1);
      ctx.store.cr = crowd(ctx, [X[9], X[10]], [[-9.2, 0, 3.6, PI / 2 - 0.4], [-9.6, 0, 0.7, PI / 2 + 0.4]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tony = ctx.cast.tony, ts = ctx.time('b07.w3');
      const sh = t > ts - 0.1;
      if (sh) { shoutPose(tony, t, 0.2, 0.5 + 0.5 * Math.abs(Math.sin(t * 7))); tony.face('huss', t); } else { fistsPose(tony, t); tony.face('determined', t); }
      ctx.store.cr.forEach((c) => { shoutPose(c.ch, t + c.ph, 0.5, 0.3); c.ch.face('huss', t + c.ph); });
      const c = moveCam(ctx, { pos: L(-2.4, 0.9, 2.0), look: L(-6, 1.45, 2.15), fov: 46 }, { pos: L(-2.9, 0.9, 2.05), look: L(-6, 1.45, 2.15), fov: 46 }, lt / 1.8, 1.5);
      moonFrame(ctx, c, MO.base, MR);
      if (sh) ctx.cam.shake(0.18, t, 6);
    },
  },
  // ── "…his mustache flies off."
  {
    name: 'mustache flies', start: 'b07.w7-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      const tony = put(ctx, 'tony', L(-6, 0, 2.2), yawTo(-6, 2.2, -2.9, 2.0));
      const P = ctx.props; ctx.add(P.mustHead, tony.joints.head); P.mustHead.position.set(0, 0.2, 0.305); P.mustHead.scale.setScalar(1.1);
      ctx.add(P.mustFly); P.mustFly.scale.setScalar(1.25);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tony = ctx.cast.tony, P = ctx.props, tf = ctx.time('b07.w8');
      const off = t >= tf;
      tony.pose('idle', 0); const f = humanFace(tony);          // fixed framing reference (deterministic)
      if (!off) { shoutPose(tony, t, 0.15, 0.6 + 0.4 * Math.abs(Math.sin(t * 8))); tony.face('huss', t); }
      else { tony.pose('stunned', t); tony.joints.head.rotation.x -= 0.1; tony.face('shocked', 0.3); }
      tony.root.updateMatrixWorld(true);
      const p0 = tony.joints.head.localToWorld(V(0, 0.2, 0.32));
      P.mustHead.visible = !off; P.mustFly.visible = off;
      if (off) {
        const d = t - tf, side = V(Math.cos(tony.root.rotation.y), 0, -Math.sin(tony.root.rotation.y));
        P.mustFly.position.copy(p0).addScaledVector(side, -1.2 * d).add(V(0.3 * d, 2.2 * d - 1.0 * d * d, 0));
        P.mustFly.rotation.set(d * 6, d * 4, d * 9);
      }
      const fw = V(Math.sin(tony.root.rotation.y), 0, Math.cos(tony.root.rotation.y));
      const z = ease.outCubic(clamp((t - tf) / 0.25, 0, 1));
      const base = f.clone().add(up(-0.62));
      const follow = off ? ease.inOutSine(clamp((t - tf - 0.1) / 0.6, 0, 1)) * 0.45 : 0;
      const look = base.clone().lerp(P.mustFly.position.clone().add(up(-0.55)), follow);
      const c = setCam(ctx, { pos: f.clone().addScaledVector(fw, lerp(4.2, 3.8, z)).add(V(0, -0.6, 0)).addScaledVector(V(fw.z, 0, -fw.x), 0.5), look, fov: 44 }, 1.6);
      moonFrame(ctx, c, MO.base, MR);
      pop(ctx, tf, 0.1, '#ffffff', 0.35); shakeOn(ctx, [tf], 0.4, 0.25, 9);
      stamp(ctx, 'POP!', tf, { y: 0.1, x: 0.25, size: 110, fill: '#ffe14a', stroke: '#1d1d22', rot: -0.1 });
    },
  },
  // ── b08 "Grandma Rose can't shout, so she brings a kazoo."
  {
    name: 'rose between', start: 'b08-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      const r = put(ctx, 'rose', L(-14, 0.12, -7.0), 0);
      ctx.store.cr = crowd(ctx, [X[11], X[12]], [[-15.15, 0.12, -7.25, 0.25], [-12.85, 0.12, -7.25, -0.25]]);
      ctx.add(ctx.props.kazoo, r.joints.head); ctx.props.kazoo.position.set(0, 0.13, 0.28); ctx.props.kazoo.rotation.set(0.15, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, r = ctx.cast.rose, tb = ctx.time('b08.w6');
      ctx.store.cr.forEach((c) => { shoutPose(c.ch, t + c.ph, 0.5, 0.4 + 0.4 * Math.abs(Math.sin((t + c.ph) * 6))); c.ch.face('huss', t + c.ph); });
      const raise = t > tb;
      if (raise) { kazooPose(r, t); r.face('smug', 0.3); } else { r.pose('idle', t, { headYaw: 0.5 * Math.sin(t * 2.2) }); r.face('neutral', t); }
      ctx.props.kazoo.visible = raise;
      const c = moveCam(ctx, { pos: L(-14, 1.0, -1.7), look: L(-14, 0.85, -7), fov: 42 }, { pos: L(-14, 1.0, -2.4), look: L(-14, 0.85, -7), fov: 42 }, lt / 2, 1.6);
      moonFrame(ctx, c, MO.base, MR);
    },
  },
  {
    name: 'kazoo toot', start: 'b08.w8-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      const r = put(ctx, 'rose', L(-14, 0.12, -7.0), 0);
      const P = ctx.props; ctx.add(P.kazoo, r.joints.head); P.kazoo.position.set(0, 0.13, 0.28); P.kazoo.rotation.set(0.15, 0, 0);
      ctx.add(P.notes, P.kazoo); P.notes.position.set(0, 0, 0.3); P.notes.scale.setScalar(1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, r = ctx.cast.rose;
      kazooPose(r, t); r.face('smug', 0.3);
      r.joints.head.rotation.z = 0.06 * Math.sin(t * 18);
      ctx.props.notes.userData.set(t, 1, [0.9, 0.7, 0.6], 0.16, 1.4);
      const f = humanFace(r);
      const c = setCam(ctx, { pos: f.clone().add(V(0.45, -0.32, 2.1)), look: f.clone().add(up(-0.36)), fov: 34 }, 1.5);
      moonFrame(ctx, c, MO.base, MR, { dust: false });
      ctx.cam.shake(0.05, t, 2);
    },
  },
  {
    name: 'neighbours cringe', start: 'b08.w9-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      const r = put(ctx, 'rose', L(-14, 0.12, -7.0), 0);
      ctx.store.cr = crowd(ctx, [X[11], X[12]], [[-14.9, 0.12, -7.3, 0.55], [-13.1, 0.12, -7.3, 0.15]]);
      const P = ctx.props; ctx.add(P.kazoo, r.joints.head); P.kazoo.position.set(0, 0.13, 0.28); P.kazoo.rotation.set(0.15, 0, 0);
      ctx.add(P.notes, P.kazoo); P.notes.position.set(0, 0, 0.3);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, r = ctx.cast.rose;
      kazooPose(r, t); r.face('smug', 0.3);
      ctx.store.cr.forEach((c, i) => { earsPose(c.ch, t + c.ph); c.ch.face(i ? 'squint' : 'sweat', 0.4); });
      ctx.props.notes.userData.set(t, 1, [0.9, 0.7, 0.6], 0.22, 1.4);
      const c = moveCam(ctx, { pos: L(-11.4, 0.7, -1.5), look: L(-14, 0.62, -7.1), fov: 52 }, { pos: L(-12.0, 0.7, -2.6), look: L(-14, 0.55, -7.1), fov: 52 }, lt / 1.6, 1.6);
      moonFrame(ctx, c, MO.base, MR, { dust: false });
      ctx.cam.shake(0.08, t, 12);
      tag(ctx, 'WORSE', ctx.time('b08.w10'), Infinity, { y: 0.14, size: 92, bg: 'rgba(200,0,40,0.92)', rot: 0.06 });
    },
  },
  // ── b09 "And baby Otis is the loudest person in town. He's six months old."
  {
    name: 'baby otis', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      put(ctx, 'otisDad', L(OTIS_ST.x, 0, OTIS_ST.z), PI / 2);
      put(ctx, 'otis', L(OTIS_ST.x, 2, OTIS_ST.z), PI / 2);
      const ids = [X[0], X[1], X[2], X[3], X[5], X[6], X[7]];
      ctx.store.ring = ids.map((id, i) => { const a = PI * (0.42 + 1.16 * i / (ids.length - 1)); return { id, a, ph: hash(i * 3.3) * 3, ch: put(ctx, id, L(0, 0, 0), 0) }; });
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, dad = ctx.cast.otisDad, otis = ctx.cast.otis, tl = ctx.time('b09.w5');
      dadArms(dad, t); dad.face('smile', t);
      otisOnDad(ctx, dad, otis, t, { act: 'idle', face: 'determined', ft: 0.5 });
      const back = ease.inOutSine(clamp((t - tl) / 2.2, 0, 1));
      ctx.store.ring.forEach((r, i) => {
        const rad = lerp(1.7, 2.9, back) + 0.2 * hash(i);
        const x = OTIS_ST.x + Math.cos(r.a) * rad, z = OTIS_ST.z + Math.sin(r.a) * rad;
        r.ch.root.position.copy(L(x, 0, z)); r.ch.root.rotation.set(0, yawTo(x, z, OTIS_ST.x, OTIS_ST.z), 0);
        r.ch.pose(back > 0.02 && back < 0.98 ? 'walk' : 'idle', t + r.ph, { speed: -0.6, lookAt: headPt(otis, 0.3) });
        r.ch.face(back > 0.1 ? 'sweat' : 'smile', t + r.ph);
      });
      const k = ease.inOutSine(clamp(lt / 3.8, 0, 1));
      const c = moveCam(ctx, { pos: L(OTIS_ST.x + 7.5, 1.1, OTIS_ST.z + 0.9), look: L(OTIS_ST.x - 1.0, 1.15, OTIS_ST.z), fov: 50 }, { pos: L(OTIS_ST.x + 4.6, 1.05, OTIS_ST.z + 0.6), look: L(OTIS_ST.x - 1.0, 1.3, OTIS_ST.z), fov: 48 }, k, 1.4);
      moonFrame(ctx, c, MO.base, MR);
      if (ctx.t < ctx.time('b09.w10')) tag(ctx, 'TOWN RECORD HOLDER', ctx.time('b09') + 0.2, Infinity, { y: 0.07, size: 58, bg: 'rgba(255,190,30,0.95)', fill: '#1d1d22', stroke: '#ffffff' });
      else tag(ctx, '6 MONTHS OLD', ctx.time('b09.w10'), Infinity, { y: 0.07, size: 70, bg: 'rgba(255,79,163,0.95)' });
    },
  },
  // ── b10 HUSS ×3 — Otis: the moon rockets up, lamps flicker, a roof tile pops off, Dad is stunned
  ...[0, 1, 2].map((i) => ({
    name: `otis huss #${i + 1}`, start: H('b10', i), set: 'town',
    setup(ctx) {
      const L = town(ctx);
      put(ctx, 'otisDad', L(OTIS_ST.x, 0, OTIS_ST.z), PI / 2);
      put(ctx, 'otis', L(OTIS_ST.x, 2, OTIS_ST.z), PI / 2);
      const P = ctx.props; ctx.add(P.rings);
      addTo(ctx, P.tiles[0], 0, 0, 0); addTo(ctx, P.tiles[1], 0, 0, 0);
      if (i === 1) { ctx.store.cr = crowd(ctx, [X[0], X[1]], [[-3, 0.12, -6.3, -PI / 2], [-4.2, 0.12, 6.4, -PI / 2]]); }
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, hits = hussHits(ctx, 'b10'), dad = ctx.cast.otisDad, otis = ctx.cast.otis;
      const n = hits.filter((h) => h <= t).length, h = lastBefore(hits, t), dh = h != null ? t - h : 9, hp = hitPulse(hits, t, 0.2);
      dadArms(dad, t); dad.face(n > 0 ? 'shocked' : 'smile', 0.3);
      if (n > 0) { dad.joints.head.rotation.x += 0.1; }
      otisOnDad(ctx, dad, otis, t, { act: 'fists', face: dh < 0.25 ? 'huss' : 'determined', ft: 0.5, hit: hp });
      const mouth = headPt(otis, 0.15, 0.3), fw = V(1, 0, 0);
      P.rings.position.copy(mouth); P.rings.lookAt(mouth.clone().add(V(1, 0.5, 0))); P.rings.userData.set(t, hp > 0.05 && i === 0 ? 1 : 0, 6, 0.5);
      const my = 40 + 6 * (Math.max(0, n - 1) + (n > 0 ? ease.outBack(clamp(dh / 0.14, 0, 1)) : 0));
      // roof tiles flying off the north house roof at hits 1 and 2
      // (#2) launched inside the view cone, tumbling across frame centre toward the camera; (#3) a second one behind Dad
      [[-14, 7.0, -2.2, 0, [7, 6, 5.0]], [-2.5, 5.2, -3.0, 2, [2.5, 3.5, 3.0]]].forEach(([x, y, z, hi, v], k) => {
        const d = t - ((hits[hi] ?? 99) + (k === 0 ? 0.08 : 0)), tile = P.tiles[k];
        tile.visible = d >= 0; tile.scale.setScalar(2.1);
        if (d >= 0) { tile.position.copy(L(x + v[0] * d, y + v[1] * d - 4.9 * d * d, z + v[2] * d)); tile.rotation.set(0.6 + d * 11, d * 5, d * 7); }
      });
      const flick = n > 0 && hash(Math.floor(t * 18)) > 0.45;
      lampsOn(ctx, true, !flick);
      let c;
      if (i === 0) { const f = humanFace(otis); c = setCam(ctx, { pos: f.clone().add(V(1.15, -0.32, 0.12)), look: f.clone().add(up(-0.16)), fov: 36 }, 1.4); }
      else if (i === 1) c = setCam(ctx, { pos: L(7.5, 1.0, 2.4), look: L(-40, 16.5, -1), fov: 52 }, 1.2);
      else { const f = humanFace(dad); c = setCam(ctx, { pos: L(OTIS_ST.x + 3.3, 1.25, OTIS_ST.z - 1.6), look: f.clone().add(up(-0.45)), fov: 44 }, 1.4); }
      moonFrame(ctx, c, [MO.base[0], my, MO.base[2]], MR, { light: 1.0 + 0.6 * hp });
      if (ctx.store.cr) ctx.store.cr.forEach((cc) => { cc.ch.pose('surprised', dh); cc.ch.face('shocked', 0.3); });
      ctx.cam.punch(hits, t, 0.12, 0.2); shakeOn(ctx, hits, 0.7, 0.3, 21 + i);
      pop(ctx, h ?? -9, 0.08, '#ffffff', 0.3);
    },
  })),
  // ── b11 "Then last Tuesday, everybody got the flu."  — every window: someone sick in bed
  {
    name: 'flu windows', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.6 });
      const P = ctx.props, F = P.facade; addTo(ctx, F, FACADE.x, 0, FACADE.z, 0);
      ctx.store.sick = F.userData.slots.map((s, i) => put(ctx, X[6 + i], L(FACADE.x + s.x, s.y, FACADE.z + s.z), 0));
      [0, 2, 5].forEach((si, k) => { const th = P.thermo[k]; ctx.add(th, ctx.store.sick[si].joints.head); th.position.set(0.03, 0.12, 0.28); th.rotation.set(0.35, 0.3, 0); });
      ctx.add(P.warm); P.warm.position.copy(L(FACADE.x, 3.9, FACADE.z - 0.3)); P.warm.intensity = 7; P.warm.distance = 9;
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.store.sick.forEach((ch, i) => { ch.pose('sitIdle', t + i, { intensity: 0.4 }); ch.joints.head.rotation.z = 0.12 * Math.sin(t * 1.3 + i); ch.face(i % 2 ? 'sweat' : 'sleepy', i % 2 ? 0.3 : t + i); });
      const c = moveCam(ctx, { pos: L(FACADE.x, 3.1, -0.4), look: L(FACADE.x, 3.85, FACADE.z), fov: 52 }, { pos: L(FACADE.x, 3.4, -1.6), look: L(FACADE.x, 3.95, FACADE.z), fov: 50 }, ease.inOutSine(lt / 2.5), 0.8);
      moonFrame(ctx, c, MO.base, MR, { dust: false });
      ctx.fx.overlay('#4a7a8a', 0.1);
      tag(ctx, 'FLU SEASON', ctx.time('b11') + 0.1, Infinity, { y: 0.1, size: 72, bg: 'rgba(60,140,90,0.92)' });
    },
  },
  // ── b12 "The whole town lost their voice."  — mouths open, nothing comes out
  {
    name: 'silent crowd', start: 'b12-0.1', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.9 }); ctx.store.cr = squareCrowd(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, to = ctx.time('b12.w3');
      const open = t > to;
      ctx.store.cr.forEach((c) => { if (open) { shoutPose(c.ch, t + c.ph, 0.4, 0); c.ch.face('shocked', 0.3); } else { fistsPose(c.ch, t + c.ph); c.ch.face('determined', t + c.ph); } });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0, speed: 0.5 });
      const c = moveCam(ctx, { pos: L(37.0, 2.3, -3.6), look: L(41.6, 1.55, 0.2), fov: 44 }, { pos: L(37.6, 2.1, -3.0), look: L(41.6, 1.55, 0.2), fov: 42 }, lt / 1.8, 1.6);
      moonFrame(ctx, c, MO.base, MR, { dust: false });
      if (open) tag(ctx, '. . .', to + 0.1, Infinity, { y: 0.14, size: 110, bg: 'rgba(20,20,40,0.85)' });
    },
  },
  {
    name: 'otis squeak', start: 'b12.w6-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.9 });
      put(ctx, 'otisDad', L(OTIS_SQ.x, 0, OTIS_SQ.z), -PI / 2);
      put(ctx, 'otis', L(OTIS_SQ.x, 2, OTIS_SQ.z), -PI / 2);
      ctx.store.cr = crowd(ctx, [X[3], X[4]], [[OTIS_SQ.x + 1.2, 0, OTIS_SQ.z + 1.4, -PI / 2], [OTIS_SQ.x + 1.3, 0, OTIS_SQ.z - 1.3, -PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, dad = ctx.cast.otisDad, otis = ctx.cast.otis, te = ctx.time('b12.w8');
      dadArms(dad, t); dad.face('sweat', 0.3);
      otisOnDad(ctx, dad, otis, t, { act: 'fists', face: 'huss', ft: 0.5, hit: 0.5 + 0.5 * Math.sin(t * 25) });
      ctx.store.cr.forEach((c) => { c.ch.pose('idle', t + c.ph, { lookAt: headPt(otis) }); c.ch.face('sweat', t + c.ph); });
      const f = humanFace(otis);
      const k = ease.inOutSine(clamp(lt / 2.2, 0, 1));
      const c = setCam(ctx, { pos: f.clone().add(V(lerp(-2.4, -1.5, k), -0.42, 0.35)), look: f.clone().add(up(-0.28)), fov: 34 }, 1.5);
      moonFrame(ctx, c, MO.base, MR, { dust: false });
      ctx.cam.shake(0.05, t, 5);
      tag(ctx, '*squeak*', te + 0.05, Infinity, { y: 0.1, x: 0.78, size: 60, bg: 'rgba(255,255,255,0.92)', fill: '#1d1d22', stroke: '#ffffff', rot: 0.1 });
    },
  },
  // ── b13 "Nine o'clock came. Nobody shouted. And the moon came down."  — wide; it settles on the clock tower
  {
    name: 'moon sinks', start: 'b13-0.1', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.45 }); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, td = ctx.markers.down;
      const k = ease.inOutSine(clamp((t - 41.2) / (td + 0.55 - 41.2), 0, 1));
      const settle = t > td + 0.55 ? 0.6 * Math.exp(-(t - td - 0.55) / 0.15) * Math.sin((t - td - 0.55) * 30) : 0;
      const mp = lerpA([-92, 62, 6], MO.tower, k); mp[1] += settle;
      const flood = clamp((t - td) / 0.6, 0, 1);
      const c = moveCam(ctx, { pos: L(28, 15, 16), look: L(-46, 22, 0), fov: 50 }, { pos: L(24, 13.6, 14), look: L(-46, 21, 0.5), fov: 50 }, lt / 3.6, 0.5);
      moonFrame(ctx, c, mp, MR, { light: lerp(0.9, 2.4, flood), dustDist: 18 });
      if (t > ctx.markers.silent) ctx.cam.shake(0.1 + 0.25 * flood, t, 13);
      ctx.fx.overlay('#dfe8ff', 0.12 * flood);
    },
  },
  // ── b14 "It sat on the clock tower."  — low angle, scale contrast
  {
    name: 'moon on tower', start: 'b14-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.45 });
      addTo(ctx, ctx.props.clock, TW.face, TW.cy, TW.z, PI / 2);
      ctx.store.cr = crowd(ctx, [PJ_IDS[0], PJ_IDS[1]], [[-34.4, 0, 3.0, -PI / 2 - 0.55], [-35.4, 0, 0.0, -PI / 2 + 0.55]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.props.clock.userData.set(0.02, 0.75);
      const mw = L(MO.tower[0], MO.tower[1], MO.tower[2]);
      ctx.store.cr.forEach((c) => { c.ch.pose('idle', t + c.ph, { lookAt: mw }); c.ch.face('shocked', 0.3); });
      const c = moveCam(ctx, { pos: L(-23.6, 1.4, 2.2), look: L(-51, 11.0, 1.5), fov: 64 }, { pos: L(-24.4, 1.45, 2.1), look: L(-51, 11.6, 1.5), fov: 62 }, lt / 1.6, 1.0, '#f0f2ff', 16);
      moonFrame(ctx, c, MO.tower, MR, { light: 1.2, glow: 1.1 });
      ctx.cam.shake(0.08, t, 14);
    },
  },
  // ── "The clock started running backwards."
  {
    name: 'clock backwards', start: 'b14.w6-0.12', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.45 }); addTo(ctx, ctx.props.clock, TW.face, TW.cy, TW.z, PI / 2); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tb = ctx.markers.back, d = Math.max(0, t - tb);
      const m = 0.02 - (0.35 * d + 1.5 * d * d);
      ctx.props.clock.userData.set(m, 0.75 + m / 12);
      const c = moveCam(ctx, { pos: L(-42.6, 8.0, 4.8), look: L(-49.6, 13.4, 1.5), fov: 46 }, { pos: L(-43.6, 8.4, 4.2), look: L(-49.6, 12.9, 1.5), fov: 42 }, lt / 1.8, 0.8);
      moonFrame(ctx, c, MO.tower, MR, { light: 1.6, glow: 1.15 });
      ctx.cam.shake(0.06 + 0.2 * clamp(d, 0, 1), t, 15);
      ctx.fx.overlay('#dfe8ff', 0.06);
      tag(ctx, 'BACKWARDS', ctx.time('b14.w10'), Infinity, { y: 0.13, size: 80, bg: 'rgba(80,40,200,0.92)' });
    },
  },
  // ── b15 "Street lamps bent away from it."
  {
    name: 'lamps bend', start: 'b15-0.1', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.45 }); bendLamps(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tl = ctx.time('b15.w2');
      bendFrame(ctx, 0, { stagger: (i) => ease.outBack(clamp((t - tl + 0.25 - 0.04 * Math.abs(LAMPS[i][0] + 40) / 6) / 0.45, 0, 1)), flick: t > tl - 0.2 && t < tl + 0.8 ? 0.35 : 0 });
      const LC = lampCam(ctx); const c = moveCam(ctx, LC[0], LC[1], lt / 1.8, 0.8);
      moonFrame(ctx, c, MO.tower, MR, { light: 2.0 });
      ctx.cam.shake(0.08, t, 16);
      tag(ctx, 'BENT', tl + 0.1, Infinity, { y: 0.13, size: 80, bg: 'rgba(80,40,200,0.92)' });
    },
  },
  // ── "The cat started floating."
  {
    name: 'cat floats', start: 'b15.w7-0.12', set: 'town',
    setup(ctx) { const L = town(ctx, 'quiet_night', { glow: 0.45 }); bendLamps(ctx); put(ctx, 'cat', L(-11.2, 0.12, 4.6), 0.95, 1.35); ctx.add(ctx.props.dustNear); ctx.props.lamps[7].visible = false; },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, cat = ctx.cast.cat, tc = ctx.time('b15.w7');
      bendFrame(ctx, 1);
      const k = clamp((t - tc + 0.1) / 1.3, 0, 1), y = 0.12 + 2.3 * ease.inOutSine(k) + 0.1 * Math.sin(t * 2);
      cat.root.position.copy(L(-11.2, y, 4.6)); cat.root.rotation.set(0.2 * Math.sin(t * 1.7), 0.95 + 0.3 * Math.sin(t * 1.1) * k, 0.25 * Math.sin(t * 1.3));
      cat.pose(k > 0.05 ? 'idle' : 'sit', t); if (k > 0.05) { const J = cat.joints; J.armL.rotation.x -= 0.6; J.armR.rotation.x -= 0.6; J.legL.rotation.x += 0.5; J.legR.rotation.x += 0.5; }
      cat.face(k > 0.05 ? 'shocked' : 'neutral', 0.3);
      P.dustNear.position.copy(L(-11.2, y + 0.5, 4.6)); P.dustNear.userData.set(t, 0.9);
      const cp = L(-11.2, y + 0.3, 4.6);
      const c = setCam(ctx, { pos: L(-8.6, 0.5, 7.2), look: cp.clone().add(V(-0.8, 0.9, -0.3)), fov: 46 }, 1.3);
      moonFrame(ctx, c, MO.tower, MR, { light: 2.0 });
    },
  },
  // ── "Dad floated past my window. Still snoring."
  {
    name: 'dad floats past', start: 'b15.w10-0.12', set: 'room',
    setup(ctx) {
      const R = room(ctx);
      windowMoon(ctx, -0.4, 2.05, 0.55);
      put(ctx, 'dad', R(1.5, 1.55, -2.68), 0);
      ctx.add(ctx.props.zzz); ctx.add(ctx.props.zzz2);
      ctx.add(ctx.props.eyeLight); ctx.props.eyeLight.position.copy(R(-0.8, 1.7, -2.5)); ctx.props.eyeLight.intensity = 0;
    },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, P = ctx.props, dad = ctx.cast.dad, t0 = ctx.time('b15.w10') - 0.05;
      const x = 0.1 - 0.6 * (t - 50.45);
      dad.root.position.copy(R(x, 1.42 + 0.06 * Math.sin(t * 2.2), -2.92));
      dad.root.quaternion.copy(_qBasis).premultiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), 0.05 * Math.sin(t * 1.5)));
      dad.pose('crowdSurf', t, { intensity: 0.15 }); dad.face('sleepy', 1.0);
      const hp = headPt(dad, 0.3, 0.2);
      P.zzz.position.copy(hp).add(V(0.25 + 0.1 * Math.sin(t * 3), 0.35 + 0.25 * ((t * 0.8) % 1), 0.3)); P.zzz.material.opacity = 1;
      P.zzz2.position.copy(hp).add(V(0.55, 0.75 + 0.25 * ((t * 0.8 + 0.5) % 1), 0.3));
      const c = moveCam(ctx, { pos: R(-0.2, 1.45, 1.3), look: R(-0.8, 1.6, -2.1), fov: 44 }, { pos: R(-0.35, 1.45, 0.9), look: R(-0.8, 1.6, -2.1), fov: 44 }, lt / 2.6, 0.9, '#dfe8ff', 8);
      tag(ctx, 'STILL SNORING', ctx.time('b15.w15'), Infinity, { y: 0.14, size: 70, bg: 'rgba(40,90,200,0.92)' });
    },
  },
  // ── b16 "I was the only one not sick. Because I never go outside."
  {
    name: 'not sick', start: 'b16-0.1', set: 'room',
    setup(ctx) {
      const R = room(ctx);
      windowMoon(ctx, -0.55, 1.85, 0.6);
      put(ctx, 'me', R(KID_BED.x, 0, KID_BED.z), PI / 2);
    },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me;
      me.pose('sitIdle', t, { seatHeight: 0.55 }); me.face(t > ctx.time('b16.w7') ? 'smug' : 'smile', t);
      windowMoon(ctx, -0.55, 1.85, lerp(0.6, 0.7, clamp(lt / 3, 0, 1)));
      const c = moveCam(ctx, { pos: R(0.55, 1.2, 2.3), look: R(-1.45, 0.85, -0.75), fov: 46 }, { pos: R(0.4, 1.2, 2.0), look: R(-1.45, 0.87, -0.75), fov: 46 }, lt / 3, 0.9, '#fff0e0', 8);
      tag(ctx, 'NOT SICK  ✓', ctx.time('b16.w6'), ctx.time('b16.w7') - 0.05, { y: 0.13, size: 72, bg: 'rgba(30,160,80,0.92)' });
      tag(ctx, 'NEVER GOES OUTSIDE', ctx.time('b16.w7'), Infinity, { y: 0.13, size: 60, bg: 'rgba(30,30,40,0.9)', fill: '#3ee0c8' });
    },
  },
  {
    name: 'one voice shrug', start: 'b16.w12-0.12', set: 'room',
    setup(ctx) { room(ctx); put(ctx, 'me', ctx.store.R(KID_BED.x, 0, KID_BED.z), PI / 2); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me, tn = ctx.time('b16.w15');
      if (t > tn - 0.15) { me.pose('shrug', t, { seated: true, seatHeight: 0.55 }); me.face('sweat', 0.3); }
      else { me.pose('sitIdle', t, { seatHeight: 0.55, headYaw: 0.35 }); me.face('neutral', t); }
      windowMoon(ctx, -0.55, 1.85, lerp(0.72, 0.95, ease.inOutSine(clamp(lt / 1.9, 0, 1))));
      const f = humanFace(me);
      const c = setCam(ctx, { pos: f.clone().add(V(2.1, -0.4, 1.0)), look: f.clone().add(V(0, -0.36, 0.15)), fov: 40 }, 1.0, '#fff0e0', 8);
      tag(ctx, 'NOT ENOUGH', tn, Infinity, { y: 0.13, size: 80, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b17 "Then I remembered. Every night for five years… I recorded the shouting."
  {
    name: 'remembered', start: 'b17-0.1', set: 'room',
    setup(ctx) { room(ctx); put(ctx, 'me', ctx.store.R(KID_BED.x, 0, KID_BED.z), PI / 2); ctx.add(ctx.props.bulb); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me, tr = ctx.time('b17.w2');
      me.pose('think', t, { seated: true, seatHeight: 0.55 }); const f0 = humanFace(me);   // steady camera anchor (seated face)
      if (t < tr) { me.pose('think', t, { seated: true, seatHeight: 0.55 }); me.face('neutral', t); }
      else { me.pose('surprised', t - tr, { seated: true, seatHeight: 0.55 }); me.face('shocked', 0.3); }
      const hp = humanFace(me).add(V(0.05, 0.4, 0.05));
      ctx.props.bulb.position.copy(hp); ctx.props.bulb.userData.set(t > tr ? 0.78 * ease.outBack(clamp((t - tr) / 0.25, 0, 1)) : 0);
      windowMoon(ctx, -0.55, 1.85, 0.95);
      const f = f0;
      // pulled back + more frontal: whole head (and the bulb above it) in frame, face in the upper third
      const c = moveCam(ctx, { pos: f.clone().add(V(3.1, -0.5, 2.4)), look: f.clone().add(V(0, -0.5, 0.1)), fov: 46 }, { pos: f.clone().add(V(2.85, -0.5, 2.15)), look: f.clone().add(V(0, -0.48, 0.1)), fov: 46 }, ease.inOutSine(clamp(lt / 1.9, 0, 1)), 1.0, '#fff0e0', 8);
      pop(ctx, tr, 0.1, '#fff6c0', 0.3);
    },
  },
  {
    name: 'tablet shouts', start: 'b17.w6-0.1', set: 'room',
    setup(ctx) {
      const R = room(ctx); put(ctx, 'me', R(KID_BED.x, 0, KID_BED.z), PI / 2);
      ctx.add(ctx.props.tablet); ctx.props.tablet.userData.set('folder');
    },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me, td = ctx.time('b17.w9'), P = ctx.props;
      holdUp(me, t, 1, { seated: true, seatHeight: 0.55 }); me.face('determined', t);
      const tc = tabletHeld(ctx, me);
      // insert: the screen fills the upper half, the counter ticks above it
      const k0 = ease.inOutSine(clamp(lt / 1.0, 0, 1));
      const c = setCam(ctx, { pos: tc.clone().add(V(lerp(1.8, 1.6, k0), -0.32, 0.22)), look: tc.clone().add(V(0, -0.22, 0)), fov: 40 }, 1.0, '#fff0e0', 8);
      const k = clamp((t - (ctx.time('b17.w6') + 0.1)) / (td - ctx.time('b17.w6') - 0.1), 0, 1);
      P.tablet.userData.count(1825 * ease.inQuad(k));          // the counter ticks up on the screen itself
    },
  },
  {
    name: 'tablet grin', start: 'b17.w9-0.05', set: 'room',
    setup(ctx) {
      const R = room(ctx); put(ctx, 'me', R(KID_BED.x, 0, KID_BED.z), PI / 2);
      ctx.add(ctx.props.tablet); ctx.props.tablet.userData.set('folder');
      windowMoon(ctx, -0.55, 1.85, 0.95);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, td = ctx.time('b17.w9');
      holdUp(me, t, 0.3, { seated: true, seatHeight: 0.55 }); me.face('grin', t);
      tabletHeld(ctx, me, -0.05);
      const f = humanFace(me);
      const k = ease.outCubic(clamp(lt / 0.5, 0, 1));
      // front-right, slightly low: face upper third, tablet (screen toward camera) below the caption band
      const c = setCam(ctx, { pos: f.clone().add(V(2.55, -0.6, -1.1)).lerp(f.clone().add(V(2.3, -0.6, -1.0)), k), look: f.clone().add(V(0, -0.42, 0)), fov: 44 }, 1.0, '#fff0e0', 8);
      tag(ctx, '1,825 SHOUTS', td, Infinity, { y: 0.07, size: 70, bg: 'rgba(30,160,80,0.92)', scale: t < td + 0.15 ? 1.12 : 1 });
      pop(ctx, td, 0.1, '#ffffff', 0.3);
    },
  },
  // ── b18 "I dragged Dad's speakers onto the stage…"
  {
    name: 'drag speakers', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.45 });
      const P = ctx.props;
      addTo(ctx, P.spkA, 51.6, STAGE_Y, -1.25, -PI / 2);                  // the first one, already in place
      addTo(ctx, P.spkB, 50.2, STAGE_Y, 1.05, PI / 2);                    // the one being hauled (cones toward us)
      put(ctx, 'me', L(52.0, STAGE_Y, 0.7), PI / 2);
      P.haul.forEach((m) => ctx.add(m)); P.drops.forEach((m) => ctx.add(m));
      addTo(ctx, P.poof.root, 50.2, STAGE_Y + 0.05, 1.05, 0, 0.45);
      ctx.add(P.warm);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, t0 = ctx.time('b18.w1');
      const k = ease.inOutSine(clamp((t - t0 + 0.25) / 1.9, 0, 1));
      const kx = lerp(51.75, 53.0, k), jerk = 0.05 * Math.max(0, Math.sin((t - t0) * 7.5));
      me.root.position.copy(L(kx, STAGE_Y, 0.7));
      haulPose(me, t); me.face('sweat', 0.5);
      // the speaker scrapes along behind him, tipped onto its front edge
      const sx = kx - 1.85 - jerk;
      P.spkB.position.copy(L(sx, STAGE_Y, 1.05)); P.spkB.rotation.set(0, L.yaw + PI / 2, 0); P.spkB.rotateX(0.1 + 0.03 * Math.sin(t * 15));
      P.spkA.userData.set(0, 0.45); P.spkB.userData.set(0, 0.7);
      // strap: hands → over the right shoulder → the speaker's top front edge
      me.root.updateMatrixWorld(true);
      const hand = me.joints.handR.getWorldPosition(V()).lerp(me.joints.handL.getWorldPosition(V()), 0.4);
      const sh = me.joints.armR.getWorldPosition(V()).add(up(0.22)).add(L(kx - 0.25, 0, 0.7).sub(L(kx, 0, 0.7)));
      P.spkB.updateMatrixWorld(true);
      const hook = P.spkB.localToWorld(V(0, 2.55, 0.52));
      beam(P.haul[0], hand, sh, 0.11); beam(P.haul[1], sh, hook, 0.11);
      // sweat flying off his head
      const hc = headPt(me, 0.45, 0);
      P.drops.forEach((d, i) => { const u = ((t * 1.6 + i * 0.25) % 1), side = i % 2 ? 1 : -1;
        d.visible = u < 0.8; d.position.copy(hc).add(L(kx + 0.35 * u, 0, 0.7 + side * (0.35 + 0.45 * u)).sub(L(kx, 0, 0.7))).add(up(0.35 * u - 0.9 * u * u)); });
      P.poof.root.position.copy(L(sx + 0.55, STAGE_Y + 0.05, 1.05)); P.poof.update((t * 1.7) % 1);
      // warm key from front-right, moonlight rimming him from behind, a soft fill on the camera
      P.warm.position.copy(L(54.3, 3.4, 2.5)); P.warm.intensity = 16; P.warm.distance = 10; P.warm.color.set('#ffc070');
      const c = moveCam(ctx, { pos: L(55.95, 1.45, -0.15), look: L(44, 5.4, 0.05), fov: 60 }, { pos: L(55.9, 1.5, -0.05), look: L(44, 5.5, 0.15), fov: 57 }, ease.inOutSine(clamp(lt / 2.1, 0, 1)), 0.9, '#f0f2ff', 12);
      moonFrame(ctx, c, MO.tower, MR, { light: 1.8, dustDist: 9, dustA: 0.6 });
      ctx.cam.shake(0.03, t, 18);
      tag(ctx, "DAD'S SPEAKERS", ctx.time('b18.w3'), Infinity, { y: 0.09, size: 64, bg: 'rgba(30,30,40,0.9)', fill: '#3ee0c8' });
    },
  },
  // ── "…and pressed play."
  {
    name: 'press play', start: 'b18.w8-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.45 });
      const P = ctx.props;
      addTo(ctx, P.spkA, SPK.x, STAGE_Y, -SPK.z, -PI / 2); addTo(ctx, P.spkB, SPK.x, STAGE_Y, SPK.z, -PI / 2);
      put(ctx, 'me', L(KID_STAGE.x, STAGE_Y, KID_STAGE.z), -PI / 2);
      ctx.add(P.tablet); P.tablet.userData.set('play'); P.tablet.scale.setScalar(1.7);
      ctx.add(P.stand); ctx.add(P.flash);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, tp = ctx.time('b18.w9') - 0.06;
      me.root.updateMatrixWorld(true);
      const cam = moveCam(ctx, { pos: L(46.2, 3.35, 0.6), look: L(50.0, 1.9, 0.05), fov: 44 }, { pos: L(46.5, 3.3, 0.55), look: L(50.0, 1.92, 0.05), fov: 44 }, lt / 1.0, 1.6);
      const tab = L(KID_STAGE.x - 0.6, STAGE_Y + 0.76, KID_STAGE.z + 0.16);
      // screen faces the camera, top edge tipped back like a music stand
      P.tablet.position.copy(tab); P.tablet.lookAt(cam.pos.clone().lerp(tab.clone().add(up(2.5)), 0.25));
      P.stand.position.copy(tab).add(up(-0.38 - 0.2)); P.stand.scale.set(1, 0.76, 1); P.stand.rotation.set(0, 0, 0);
      me.pose('idle', t, { intensity: 0.3, headPitch: 0.15 }); me.face(t > tp ? 'grin' : 'determined', t);
      { const J = me.joints, kk = ease.inCubic(clamp((t - (tp - 0.16)) / 0.16, 0, 1)), bounce = t > tp ? 0.12 * Math.exp(-(t - tp) / 0.1) : 0;
        J.armR.rotation.set(lerp(-2.7, -0.8, kk) - bounce, 0, 0.12); J.foreArmR.rotation.set(lerp(-0.4, -0.05, kk), 0, 0); }
      P.tablet.userData.set(t > tp ? 'playing' : 'play');
      P.flash.position.copy(P.tablet.localToWorld(V(0, 0, 0.05))); P.flash.quaternion.copy(P.tablet.getWorldQuaternion(new THREE.Quaternion()));
      P.flash.userData.set((t - tp) * 2.6, 0.7);
      const pl = t > tp ? 0.3 * Math.max(0, Math.sin((t - tp) * 20)) : 0;
      P.spkA.userData.set(pl, t > tp ? 1 : 0.3); P.spkB.userData.set(pl, t > tp ? 1 : 0.3);
      const c = cam;
      moonFrame(ctx, c, MO.tower, MR, { light: 1.6, dust: false });
      ctx.cam.punch([tp], t, 0.12, 0.2); shakeOn(ctx, [tp], 0.5, 0.3, 30);
      stamp(ctx, 'PLAY', tp, { y: 0.13, size: 130, fill: '#3cff6b', stroke: '#1d1d22', rot: -0.08 });
    },
  },
  // ── "All of them. At once."  — over the shoulder: speakers framing the street, the moon on the tower
  {
    name: 'all at once', start: 'b18.w10-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.45 });
      const P = ctx.props;
      addTo(ctx, P.spkA, SPK.x, STAGE_Y, -SPK.z, -PI / 2); addTo(ctx, P.spkB, SPK.x, STAGE_Y, SPK.z, -PI / 2);
      put(ctx, 'me', L(KID_STAGE.x - 0.4, STAGE_Y, KID_STAGE.z + 0.15), -PI / 2);
      ctx.add(P.tablet); P.tablet.userData.set('playing'); P.tablet.scale.setScalar(1);
      ctx.add(P.rings); ctx.add(P.ringsB); ctx.add(P.shock);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      me.pose('idle', t); me.joints.armR.rotation.set(-2.6, 0, -0.25); me.joints.foreArmR.rotation.set(-0.2, 0, 0); me.face('determined', t);
      me.root.updateMatrixWorld(true);
      P.tablet.position.copy(me.joints.handR.getWorldPosition(V())).add(up(0.18)); P.tablet.rotation.set(0, PI / 2, 0);
      const build = clamp(lt / 1.6, 0, 1), pl = (0.15 + 0.35 * build) * Math.abs(Math.sin(t * (10 + 10 * build)));
      P.spkA.userData.set(pl, 0.6 + 0.4 * build); P.spkB.userData.set(pl, 0.6 + 0.4 * build);
      const c = moveCam(ctx, { pos: L(55.7, 1.95, 0.0), look: L(20, 9.4, 0.5), fov: 60 }, { pos: L(55.2, 1.9, 0.0), look: L(20, 9.6, 0.5), fov: 58 }, ease.inOutSine(clamp(lt / 1.8, 0, 1)), 1.4);
      const ta = ctx.time('b18.w13'), grow = ease.outCubic(clamp((t - ta + 0.1) / 0.5, 0, 1));
      const mwp = L(MO.tower[0], MO.tower[1] - 8, MO.tower[2]);
      for (const [rg, sz] of [[P.rings, -1], [P.ringsB, 1]]) { const f = L(SPK.x - 0.6, STAGE_Y + 1.2, sz * SPK.z); rg.position.copy(f); rg.lookAt(mwp); rg.scale.setScalar(0.45); rg.userData.set(t, 0.35 + 0.4 * grow, 40 + 40 * grow, 0.9 - 0.3 * grow); }
      P.shock.position.copy(L(SPK.x - 1.2, STAGE_Y + 1.3, 0)); P.shock.lookAt(mwp); P.shock.userData.set((t - ta) * 1.1, 14);
      moonFrame(ctx, c, MO.tower, MR, { light: 1.6 });
      ctx.cam.shake(0.05 + 0.15 * build, t, 31);
      tag(ctx, 'ALL OF THEM', ctx.time('b18.w10'), ctx.time('b18.w13') - 0.05, { y: 0.13, size: 76 });
      tag(ctx, 'AT ONCE', ctx.time('b18.w13'), Infinity, { y: 0.13, size: 92, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  // ── b19 HUSS ×6 — five years of shouting: the moon peels off the tower and shoots up
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `five years #${i + 1}`, start: H('b19', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: i === 2 ? 0.6 : 0.8 });
      const P = ctx.props;
      if (i === 0 || i === 5) {
        addTo(ctx, P.spkA, SPK.x, STAGE_Y, -SPK.z, -PI / 2); addTo(ctx, P.spkB, SPK.x, STAGE_Y, SPK.z, -PI / 2);
        put(ctx, 'me', L(KID_STAGE.x, STAGE_Y, KID_STAGE.z), -PI / 2);
        if (i === 0) { ctx.add(P.rings); ctx.add(P.ringsB); }
      }
      if (i === 1 || i === 3) bendLamps(ctx);
      if (i === 2) {
        const F = P.facade; addTo(ctx, F, FACADE.x, 0, FACADE.z, 0);
        ctx.store.sick = F.userData.slots.map((s, k) => put(ctx, X[6 + k], L(FACADE.x + s.x, s.y, FACADE.z + s.z + 0.35), 0));
        ctx.add(P.warm); P.warm.position.copy(L(FACADE.x, 3.9, FACADE.z - 0.3)); P.warm.intensity = 7; P.warm.distance = 9;
      }
      if (i === 4) addTo(ctx, P.clock, TW.face, TW.cy, TW.z, PI / 2);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, hits = hussHits(ctx, 'b19');
      const n = hits.filter((h) => h <= t).length, h = lastBefore(hits, t), dh = h != null ? t - h : 9, hp = hitPulse(hits, t, 0.2);
      const ka = ease.outCubic(clamp(dh / 0.16, 0, 1));
      const mp = n === 0 ? MO.up[0] : lerpA(MO.up[n - 1], MO.up[n], ka);
      const lampK = Math.max(0, 1 - (n - 1 + ka) / 3);
      let c;
      if (i === 0 || i === 5) {
        const me = ctx.cast.me; me.pose('cheer', t); me.face(dh < 0.22 ? 'huss' : 'grin', t);
        P.spkA.userData.set(hp, 1); P.spkB.userData.set(hp, 1);
        if (i === 0) for (const [rg, s] of [[P.rings, -1], [P.ringsB, 1]]) { const f = L(SPK.x - 0.6, STAGE_Y + 1.1, s * SPK.z); rg.position.copy(f); rg.lookAt(f.clone().add(V(-1, 0.15, 0))); rg.userData.set(t, 1, 14, 0.5); }
        c = i === 0 ? setCam(ctx, { pos: L(46.0, 1.0, 0.3), look: L(51, 2.3, 0), fov: 54 }, 1.6) : setCam(ctx, { pos: L(47.6, 1.5, -1.2), look: L(50.4, 2.0, 0), fov: 44 }, 1.6);
      } else if (i === 1 || i === 3) {
        bendFrame(ctx, lampK);
        { const LC = lampCam(ctx); c = setCam(ctx, LC[i === 1 ? 0 : 1], 0.8); }
      } else if (i === 2) {
        ctx.store.sick.forEach((ch, k) => { ch.pose('cheer', t + k * 0.3, { seated: true, seatHeight: 0.55 }); ch.face(k % 2 ? 'grin' : 'laugh', t + k); });
        c = setCam(ctx, { pos: L(FACADE.x, 3.3, -1.0), look: L(FACADE.x, 4.0, FACADE.z), fov: 52 }, 0.8);
      } else {
        const m = 0.02 + 1.2 * (t - hits[0]) + 2.5 * hp;
        P.clock.userData.set(m, 0.75 + m / 12);
        c = setCam(ctx, { pos: L(-43.6, 9.6, 0.2), look: L(-49.6, 12.75, 1.5), fov: 48 }, 0.8);
      }
      moonFrame(ctx, c, mp, MR, { light: 1.6 });
      ctx.cam.punch(hits, t, 0.12, 0.2); shakeOn(ctx, hits, 0.6, 0.3, 40 + i);
      tag(ctx, 'FIVE YEARS OF SHOUTING', ctx.time('b19') - 0.1, Infinity, { y: 0.11, size: 60, bg: 'rgba(200,0,40,0.92)' });
    },
  })),
  // ── b20 "The moon flew back up."
  {
    name: 'moon flew up', start: 'b20-0.1', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.9 }); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      const k = ease.outCubic(clamp(lt / 1.2, 0, 1));
      const mp = lerpA(MO.up[5], MO.far, k);
      const c = moveCam(ctx, { pos: L(-4, 1.6, -2.0), look: L(-45, 10, 0), fov: 50 }, { pos: L(-5, 1.7, -2.2), look: L(-60, 24, -6), fov: 48 }, ease.inOutSine(clamp(lt / 1.3, 0, 1)), 0.6);
      moonFrame(ctx, c, mp, MR, { light: 0.6 });
    },
  },
  // ── "The cat came down."
  {
    name: 'cat lands', start: 'b20.w6-0.12', set: 'town',
    setup(ctx) { const L = town(ctx, 'quiet_night', { glow: 0.9 }); put(ctx, 'cat', L(-11.2, 3, 4.6), 1.0, 1.35); addTo(ctx, ctx.props.poof.root, -11.75, 0.15, 4.2, 0, 0.3); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, cat = ctx.cast.cat, tl = ctx.time('b20.w7');
      const d = t - tl;
      const y = d < 0 ? 0.12 + 4.9 * d * d * 1.2 : 0.12;
      cat.root.position.copy(L(-11.2, y, 4.6));
      const sq = d > 0 && d < 0.2 ? 1 - 0.25 * Math.sin(PI * d / 0.2) : 1;
      cat.root.scale.set(1.35 * (2 - sq), 1.35 * sq, 1.35 * (2 - sq));
      cat.pose(d < 0 ? 'idle' : 'sit', t); cat.face(d < 0.1 ? 'shocked' : 'smug', 0.3);
      ctx.props.poof.update(clamp(d / 0.6, 0, 1));
      const c = setCam(ctx, { pos: L(-8.4, 0.4, 6.3), look: L(-11.1, 0.75, 4.6), fov: 40 }, 1.3);
      moonFrame(ctx, c, MO.far, MR, { light: 0.6, dust: false });
      shakeOn(ctx, [tl], 0.3, 0.2, 50);
      tag(ctx, 'SMUG', tl + 0.2, Infinity, { y: 0.14, size: 70, bg: 'rgba(240,138,44,0.95)' });
    },
  },
  // ── "Dad didn't wake up."  — flat into the hedge
  {
    name: 'dad hedge', start: 'b20.w9-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.9 });
      addTo(ctx, ctx.props.hedge, HEDGE.x, 0.12, HEDGE.z, 0);
      put(ctx, 'dad', L(HEDGE.x, 5, HEDGE.z), PI + ctx.store.L.yaw);
      addTo(ctx, ctx.props.leaves.root, HEDGE.x, 1.3, HEDGE.z, 0, 0.5);
      ctx.add(ctx.props.zzz);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, dad = ctx.cast.dad, td = ctx.time('b20.w9') + 0.06, P = ctx.props;
      const d = t - td;
      const y = d < 0 ? 1.7 + 9 * d * d : 1.7 + 0.15 * Math.exp(-d / 0.12) * Math.abs(Math.sin(d * 18));
      dad.root.position.copy(L(HEDGE.x, y, HEDGE.z));
      dad.root.rotation.set(0.5, PI + ctx.store.L.yaw, 0, 'YXZ');   // head end raised, face tipped up toward the camera
      dad.pose('crowdSurf', t, { intensity: 0.1 }); dad.face('sleepy', 1.0);
      P.leaves.update(clamp(d / 0.5, 0, 1));
      const hp = headPt(dad, 0.3, 0.2);
      P.zzz.visible = d > 0.15; P.zzz.position.copy(hp).add(V(0.35, 0.3 + 0.2 * ((t * 0.8) % 1), -0.1));
      const c = setCam(ctx, { pos: L(HEDGE.x + 3.0, 3.6, HEDGE.z - 4.4), look: L(HEDGE.x - 0.1, 1.2, HEDGE.z), fov: 44 }, 1.4);
      moonFrame(ctx, c, MO.far, MR, { light: 0.6, dust: false });
      shakeOn(ctx, [td], 0.35, 0.25, 51);
      tag(ctx, 'STILL ASLEEP', td + 0.25, Infinity, { y: 0.08, size: 66, bg: 'rgba(40,90,200,0.92)' });
    },
  },
  // ── b21 "Then, high above the town… the moon slowly blinked."
  {
    name: 'tiny moon push', start: 'b21-0.1', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.7 }); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      const mw = L(MO.far[0], MO.far[1], MO.far[2]);
      const k = ease.inOutSine(clamp(lt / 2.3, 0, 1));
      const pos = L(24, 2.4, 0.3);
      const c = setCam(ctx, { pos, look: L(4, 4.6, 0).lerp(mw, lerp(0.02, 0.06, k)), fov: lerp(46, 30, k) }, 0.5);
      moonFrame(ctx, c, MO.far, MR, { light: 0.5, dustA: 0.5 });
    },
  },
  {
    name: 'moon blinks', start: 'b21.w7-0.1', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.7 }); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tb = ctx.time('b21.w8');
      const mw = L(MO.far[0], MO.far[1], MO.far[2]);
      const lid = t < tb - 0.08 ? clamp((t - (tb - 0.3)) / 0.22, 0, 1) : clamp(1 - (t - (tb + 0.12)) / 0.3, 0, 1);
      const pos = L(30, 1.6, 2.5);
      const c = setCam(ctx, { pos, look: mw.clone().add(up(-4)), fov: lerp(12, 10, clamp(lt / 1, 0, 1)) });
      moonFrame(ctx, c, MO.far, MR, { light: 0.5, lid: ease.inOutSine(lid), dust: false });
    },
  },
  // ── b22 "It's not a moon."  — the kid freezes
  {
    name: 'kid stunned', start: 'b22-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.7 });
      const P = ctx.props;
      addTo(ctx, P.spkA, SPK.x, STAGE_Y, -SPK.z, -PI / 2); addTo(ctx, P.spkB, SPK.x, STAGE_Y, SPK.z, -PI / 2);
      put(ctx, 'me', L(KID_STAGE.x, STAGE_Y, KID_STAGE.z), -PI / 2);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      me.pose('stunned', t, { headPitch: -0.3 }); me.face('shocked', 0.3);
      const f = humanFace(me);
      const c = moveCam(ctx, { pos: f.clone().add(V(-2.5, -0.45, 0.25)), look: f.clone().add(up(-0.4)), fov: 36 }, { pos: f.clone().add(V(-2.1, -0.42, 0.2)), look: f.clone().add(up(-0.38)), fov: 36 }, lt / 0.6, 1.6, '#dfe8ff');
      moonFrame(ctx, c, MO.far, MR, { light: 0.8, dust: false });
    },
  },
  // ── "It's an eye."  — extreme close-up: the pupil fades in and swivels toward the town
  {
    name: 'it is an eye', start: 'b22.w3-0.1', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.7 }); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, te = ctx.time('b22.w6'), ta = ctx.time('b22.w4');
      const mw = L(MO.far[0], MO.far[1], MO.far[2]);
      const pos = L(30, 1.6, 2.5);
      // "moon." slow push-in on the plain disc → "It's an" a faint iris ghosts in, glow turns cold → "eye" the iris and a
      // slit pupil snap open (0.25 s), creepy cyan glow, punch-in.
      const tr = te - 0.16, rv = ease.outCubic(clamp((t - tr) / 0.25, 0, 1));
      const ghost = 0.28 * ease.inOutSine(clamp((t - ta) / 0.35, 0, 1));
      const pu = Math.max(ghost, rv);
      const push = ease.inOutSine(clamp(lt / 1.2, 0, 1)), snap = ease.outCubic(clamp((t - tr) / 0.3, 0, 1));
      const c = setCam(ctx, { pos, look: mw, fov: lerp(10, 7.4, push) - 1.6 * snap });
      const sw = ease.inOutCubic(clamp((t - tr) / 0.45, 0, 1));
      const gz = pos.clone().add(V(-70, 95, 0)).lerp(pos, sw);   // ghost looks off up-left (~15°), then locks on us
      const cold = clamp((t - ta) / 0.4, 0, 1);
      const pulse = 0.25 * Math.max(0, Math.sin((t - tr) * 9)) * (t > tr ? Math.exp(-(t - tr) / 0.5) : 0);
      moonFrame(ctx, c, MO.far, MR, {
        light: 0.5, pupil: pu, gaze: gz, dust: false,
        slit: ease.inOutSine(clamp((t - tr - 0.05) / 0.3, 0, 1)), dilate: 1 + 0.15 * (1 - sw),
        irisGlow: 1 + 0.5 * rv * Math.exp(-Math.max(0, t - tr - 0.25) / 0.4) + pulse,
        glow: lerp(1.3, 1.12, cold), halo: lerp(0.3, 0.9, Math.max(cold * 0.4, rv)), haloColor: rv > 0.01 || cold > 0 ? '#8ff3ff' : '#cdd6ff',
      });
      pop(ctx, tr + 0.04, 0.12, '#9ff6ff', 0.22);
      ctx.cam.punch([tr], t, 0.07, 0.3); shakeOn(ctx, [tr], 0.25, 0.3, 77);
    },
  },
  // ── b23 "And it's looking straight at my window."  — the eye fills the window; hold; cut to black
  {
    name: 'eye in window', start: 'b23-0.1', set: 'room', captions: true,
    setup(ctx) {
      const R = room(ctx);
      const P = ctx.props;
      const b = builtins(ctx); if (b.view) b.view.visible = false;
      ctx.add(P.sky); P.sky.position.copy(R(-0.8, 1.6, -4.6)); P.sky.rotation.set(0, yawOf(ctx.set.root), 0);
      ctx.add(P.winMoon);
      put(ctx, 'me', R(-1.95, 0, -1.5), 0);
      ctx.add(P.blanket); P.blanket.position.copy(R(-1.95, 0.33, -1.13)); P.blanket.rotation.set(-0.12, yawOf(ctx.set.root), 0);
      ctx.add(P.eyeLight); P.eyeLight.position.copy(R(-0.8, 1.6, -2.3)); P.eyeLight.intensity = 9; P.eyeLight.distance = 7;
    },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, P = ctx.props, me = ctx.cast.me, tw = ctx.time('b23.w6'), tcut = 80.2;
      const b = builtins(ctx); if (b.view) b.view.visible = false;
      me.pose('sit', t, { seatHeight: 0.5, hands: 'none' });
      const J = me.joints; J.armL.rotation.set(-1.5, 0, -0.25); J.armR.rotation.set(-1.5, 0, 0.25); J.foreArmL.rotation.set(-1.1, 0, 0); J.foreArmR.rotation.set(-1.1, 0, 0);
      J.head.rotation.x -= 0.05; J.torso.rotation.x -= 0.05;
      me.face('shocked', 0.3);
      const M = P.winMoon; M.position.copy(R(-0.8, 1.6, -3.05)); M.scale.setScalar(0.8);
      const k = ease.inOutSine(clamp(lt / 1.6, 0, 1));
      const z = ease.outCubic(clamp((t - tw) / 0.2, 0, 1));
      const c = setCam(ctx, { pos: R(-0.5, 1.2, lerp(2.2, 1.9, k)), look: R(-1.6, 1.3, -1.6), fov: lerp(54, 52, k) - 4 * z }, 0.5, '#bff4ff', 8);
      M.userData.face(c.pos);
      M.userData.gaze(humanFace(me));
      M.userData.set({ pupil: 1, lid: 0, glow: 1.35, dilate: 1 - 0.2 * z, halo: 0.5, slit: 0.75 + 0.25 * z, irisGlow: 1.15 });   // same slit pupil as the reveal
      shakeOn(ctx, [tw], 0.35, 0.4, 60);
      P.eyeLight.intensity = 9 + 6 * z;
      if (t >= tcut) { ctx.fx.overlay('#000000', 1); ctx.caption.hide(true); }
    },
  },
];
