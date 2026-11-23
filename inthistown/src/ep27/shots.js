// In This Town — Episode 27: "Moving Night".  Every house in town has legs; on the first cold night they all stand up and
// run off.  I fell asleep at my desk, my house galloped to a field past the edge of town where every house stood in a ring
// humming… I rang my own doorbell, it sprinted home, and next morning a tiny shed on wobbly legs follows it around.
// Film contract: SPEC.md §8.  Timeline: episodes/ep27/timeline.json.
//
// Sets: 'town' (buildTown seed 27) and 'room' (hero bedroom).  Town-local coordinates (T(ctx)): main street along x (centre
// z = 0, pavements z = ±4.5…7.5, house fronts ±10.5), lamp posts north x = −33,−21,−9,3,15,27 (z −5.15), south x = −27,−15,
// −3,9,21 (z +5.15).  Street house slots can be hidden (townEdit) and replaced by walking houses (props.makeLegHouse).
// Our house = slot 5 at (−27, 14), front facing −z.  Mr. Pillay = slot 6 at (−15, 14).  Clock tower (−51, 1.5).
// The field past the edge of town is the open grass north of town around FIELD (houses stand in a ring of radius RING).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { WALK_SPEED } from '../characters.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { makeSweatDrop, makeBed } from '../props.js';
import { glowSprite, makePuff, makeSparkles } from '../ep18/props.js';
import { makeFillerCrowd, makeSparkBurst, makeBulb, makeEarphones } from '../ep19/props.js';
import { makeShockRing, makeArrowSign } from '../ep20/props.js';
import { makeFogField, makeMotes } from '../ep17/props.js';
import { makeLeash } from '../ep22/props.js';
import { makeBendLamp, makeBlanket } from '../ep23/props.js';
import { makeStars } from '../ep21/props.js';
import {
  makeLegHouse, makeMini, makeChain, makePadlock, makeAlarmClock, makeSleepingBag, makeBagTube, makeMonitor, makeFrostPane,
  makeSwingPoster,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const PJ = (id, c, c2, hair, hc, skin, extra = {}) => ({ id, skin, hair: { style: hair, color: hc }, top: { style: 'tee', color: c, accent: c2, emblem: 'stripe' },
  bottom: { style: 'pants', color: c }, shoes: '#f2f2f2', accessories: [], scale: 0.95, ...extra });
const SPECIAL = {
  pillay: { id: 'pillay', skin: '#a86b4a', hair: { style: 'short', color: '#1a120c' }, top: { style: 'tee', color: '#2f9a8a', accent: '#ffd23f', emblem: 'star' },
    bottom: { style: 'pants', color: '#3a3d46' }, shoes: '#1d1d22', accessories: ['beard', 'cap'], capColor: '#e8232b', partyHatColor: '#ffd23f', scale: 1.06, build: 1.25 },
  mokoena: { id: 'mokoena', skin: '#6b4226', hair: { style: 'bun', color: '#d8d8d8' }, top: { style: 'dress', color: '#c9b3f0', accent: '#ffffff', emblem: 'heart' },
    bottom: { style: 'skirt', color: '#c9b3f0' }, shoes: '#ffffff', accessories: ['glasses'], scale: 0.94 },
  pj1: PJ('pj1', '#8fc8ff', '#ffffff', 'curly', '#1a120c', '#8d5524'),
  pj2: PJ('pj2', '#ffb3d1', '#ffffff', 'long', '#7a4a24', '#f1c7a1'),
  pj3: PJ('pj3', '#b8f0b0', '#2f7a3a', 'short', '#3b2416', '#e0ac69'),
  pj4: PJ('pj4', '#ffe08a', '#e8456f', 'afro', '#111111', '#6b4226'),
  pj5: PJ('pj5', '#c9b3f0', '#ffffff', 'bun', '#c0392b', '#ffdbac'),
  pj6: PJ('pj6', '#ff9a6a', '#ffffff', 'spiky', '#e8c46a', '#f4d0b5'),
  pigeon: MAIN.pigeon,
};
export const cast = { me: MAIN.me, ...SPECIAL, ...EXTRAS };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 27, banner: ['MOVING', 'NIGHT', 'PARTY'] }),
  room: () => buildRoom({ variant: 'hero', window: 'dark' }),
};
const X = EXTRA_IDS;
const PJS = ['pj1', 'pj2', 'pj3', 'pj4', 'pj5', 'pj6'];

// ───────────────────────────────────────────────────────────────────────────────────────── layout (town-local)
const SLOTS = [
  { x: -27, z: -14, yaw: 0, w: 8.6 }, { x: -15, z: -14, yaw: 0, w: 9.0 }, { x: -3, z: -14, yaw: 0, w: 9.4 }, { x: 9, z: -14, yaw: 0, w: 8.8 },
  { x: 21, z: -14, yaw: 0, w: 9.0 }, { x: -27, z: 14, yaw: PI, w: 9.0 }, { x: -15, z: 14, yaw: PI, w: 8.4 }, { x: -3.4, z: 14, yaw: PI, w: 8.6 },
  { x: 25, z: 14, yaw: PI, w: 8.6 },
];
const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const HOME = 5, PIL = 6;
const LAMPS = { home: [-27, 5.15], pil: [-15, 5.15] };
const TOWER = { x: -51, z: 1.5 };
const FIELD = { x: -14, z: -64 };
const RING = 16;
const MOK = { x: -28, z: -72, yaw: 0.35 };
// house look table (walls / roofs follow world.js palette)
const LOOKS = [
  { wall: '#bfd8ee', roof: '#3b4f78', shutters: '#1d1d22', door: '#ffd23f' },            // 0 mine
  { wall: '#f3e3a5', roof: '#b5543f', door: '#2f9a8a', shutters: '#2f9a8a' },           // 1 Pillay
  { wall: '#f2c4c4', roof: '#6b4a3a', door: '#3f7a5a' },
  { wall: '#d6e8c4', roof: '#3f7a5a', door: '#b5543f', shutters: '#3f7a5a' },
  { wall: '#cbbfe6', roof: '#4a5d7e', door: '#ffd23f' },
  { wall: '#e9d8b5', roof: '#b5543f', door: '#2f4d8a', shutters: '#2f4d8a' },
  { wall: '#c9e4f2', roof: '#6b4a3a', door: '#e8456f' },
  { wall: '#ffd0a8', roof: '#3f7a5a', door: '#7a1f2b', shutters: '#7a1f2b' },
  { wall: '#f3e3a5', roof: '#4a5d7e', door: '#ff7a2f' },
  { wall: '#d6e8c4', roof: '#b5543f', door: '#8a5cff', shutters: '#b5543f' },
];

export function init(ctx) {
  const P = ctx.props;
  P.home = makeLegHouse({ ...LOOKS[0], bay: true, backDoor: true, seed: 1 });
  P.pil = makeLegHouse({ ...LOOKS[1], sign: 'PILLAY', seed: 2, chimneyX: -0.3 });
  P.herd = LOOKS.slice(2).map((l, i) => makeLegHouse({ ...l, seed: 3 + i, chimneyX: i % 2 ? 0.28 : -0.3, sideWindows: i % 2 === 0 }));
  P.shed = makeMini('shed');
  P.gar1 = makeMini('garage', { wall: '#f3e3a5', roof: '#b5543f', seed: 2 });
  P.gar2 = makeMini('garage', { wall: '#f3e3a5', roof: '#b5543f', seed: 5 });
  P.chain = makeChain(26, { r: 0.27, thick: 0.09 }); P.chain2 = makeChain(14, { r: 0.24, thick: 0.08 });
  P.lock = makePadlock();
  P.clock = makeAlarmClock();
  P.bags = [['#3f6fd8', '#ffd23f'], ['#e8456f', '#ffffff'], ['#5bd65b', '#ffd23f'], ['#8a5cff', '#ffe08a'], ['#ff7a2f', '#ffffff'], ['#2fb4c4', '#ffd23f']].map(([a, b]) => makeSleepingBag(a, b));
  P.tubes = ['#3f6fd8', '#e8456f', '#5bd65b', '#8a5cff', '#ff7a2f', '#2fb4c4'].map((c) => makeBagTube(c));
  P.monitor = makeMonitor();
  P.frost = makeFrostPane(1.3, 1.3);
  P.posters = [makeSwingPoster({ lines: ['GG'], bg: '#ff4fa3' }), makeSwingPoster({ lines: ['LVL', '99'], bg: '#3ee0c8', fg: '#1d1d22', w: 0.5, h: 0.7 })];
  P.ear = makeEarphones();
  P.lamp = makeBendLamp();
  P.sparks = [0, 1, 2].map(() => makeSparkBurst(30, ['#fff2a0', '#ffb43a', '#ff7a2f', '#ffffff'], { speed: 1.2, size: 0.05 }));
  P.puffs = [0, 1, 2, 3, 4, 5].map((i) => makePuff({ color: '#d8cfc0', count: 16, radius: 1.8, seed: 3 + i }));
  P.bulb = makeBulb();
  P.shock = makeShockRing();
  P.sign = makeArrowSign(['HOME', '3 TOWNS'], { color: '#ffd23f' });
  P.sign2 = makeArrowSign(['LEAVING', 'TOWN'], { color: '#ff9a3a' });
  P.bed = makeBed({ blanket: '#8a5cff' });
  P.blanket = makeBlanket('#8a5cff');
  P.leash = makeLeash(16, 0.018, '#e8232b');
  P.fog = makeFogField({ n: 34, w: 60, d: 60, h: 2.2, size: 9, color: '#b48cf0', opacity: 0.32 });
  P.motes = makeMotes({ n: 60, w: 30, h: 10, d: 30, color: '#e0b8ff', size: 0.08 });
  P.snow = makeSparkles({ n: 70, w: 26, h: 14, d: 16, color: '#eaf4ff', size: 0.07 });
  P.gold = makeSparkles({ n: 50, w: 14, h: 8, d: 8, color: '#ffe6a0', size: 0.07 });
  P.filler = makeFillerCrowd(60);
  P.sweat = makeSweatDrop({ size: 0.13 });
  P.stars = makeStars(5);
  P.fill = new THREE.PointLight('#f0f2ff', 5, 12, 1.4);
  P.key = new THREE.PointLight('#ffd8a0', 0, 30, 1.2);
  P.glow = glowSprite('#ffffff', 2, 1);
  P.sun = glowSprite('#ffb060', 60, 0.9);
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function T(ctx) { const r = ctx.set.root; r.updateMatrixWorld(true); const M = r.matrixWorld.clone(); const f = (x, y, z) => V(x, y, z).applyMatrix4(M); f.yaw = yawOf(r); f.M = M; return f; }
function put(ctx, id, p, yaw, scale) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); if (scale != null) r.scale.setScalar(scale); return ctx.cast[id]; }
function addTo(ctx, obj, x, y, z, ry = 0, s = null) { const o = obj.root && obj.root.isObject3D ? obj.root : obj; ctx.add(o, ctx.set.root); o.position.set(x, y, z); o.rotation.set(0, ry, 0); if (s != null) o.scale.setScalar(s); return o; }
const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.14, size: 68, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,40,0.84)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale ?? 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0 || (o.t1 != null && ctx.t > o.t1)) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.25, size: 150, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.12, ...o, scale: s * (o.scale ?? 1), alpha: clamp(d / 0.06, 0, 1) });
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
/** camera in front of a character's face (3/4 by `side`), aimed `below` metres under the face → face in the upper third */
function faceCam(ch, d = 2.4, side = 0.4, below = 0.38, fov = 34, lift = -0.15) {
  const f = humanFace(ch), q = ch.root.getWorldQuaternion(new THREE.Quaternion()), fw = V(0, 0, 1).applyQuaternion(q); fw.y = 0; fw.normalize();
  const l = V(fw.z, 0, -fw.x);
  return { pos: f.clone().addScaledVector(fw, d).addScaledVector(l, side).add(up(lift)), look: f.clone().add(up(-below)), fov };
}
function fill(ctx, pos, k = 1, color = '#f0f2ff', dist = 12) { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); f.distance = dist; }
function setCam(ctx, c, k = 0, color, dist) { ctx.cam.set(c); ctx.store.cam = c; if (k > 0) fill(ctx, c.pos, k, color, dist); return c; }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0, color, dist) { const c = camLerp(a, b, clamp(u, 0, 1)); ctx.cam.set(c); ctx.store.cam = c; if (k > 0) fill(ctx, c.pos, k, color, dist); return c; }
function key(ctx, pos, k = 1, color = '#ffd8a0', dist = 30) { const L = ctx.props.key; ctx.add(L); L.position.copy(pos); L.intensity = 40 * k; L.color.set(color); L.distance = dist; }
function pop(ctx, t0, dur = 0.12, color = '#ffffff', a = 0.5) { const d = ctx.t - t0; if (d >= 0 && d < dur) ctx.fx.overlay(color, a * (1 - d / dur)); }
function shakeOn(ctx, hits, amt = 0.6, dur = 0.35, seed = 7) { for (const h of hits) { const d = ctx.t - h; if (d >= 0 && d < dur) ctx.cam.shake(amt * (1 - d / dur), ctx.t, seed); } }
const H = (beat, i) => (i === 0 ? `${beat}.h0-0.12` : `${beat}.h${i}-0.03`);
const hussHits = (ctx, beat) => ctx.hussTimes(beat).map((h) => h + 0.03);
/** whip-pan in: the look target swings in from the side during the first `dur` seconds */
function whip(ctx, c, lt, dir = 1, dur = 0.18) {
  const k = 1 - ease.outCubic(clamp(lt / dur, 0, 1));
  if (k <= 0) return c;
  const f = c.look.clone().sub(c.pos), r = V(-f.z, 0, f.x).normalize();
  const look = c.look.clone().addScaledVector(r, dir * k * f.length() * 0.9);
  ctx.cam.set({ ...c, look, roll: dir * 0.12 * k });
  ctx.fx.overlay('#ffffff', 0.16 * k);
  return c;
}
/** approximate screen position (0..1) of a world point for the current ctx.store.cam (portrait 9:16) */
function scr(ctx, wp) {
  const c = ctx.store.cam; if (!c) return { x: 0.5, y: 0.5 };
  const f = c.look.clone().sub(c.pos).normalize(), r = V().crossVectors(f, V(0, 1, 0)).normalize(), u = V().crossVectors(r, f);
  const d = wp.clone().sub(c.pos), z = d.dot(f), ty = Math.tan((c.fov * PI) / 360), tx = ty * 9 / 16;
  return { x: 0.5 + (d.dot(r) / z) / tx / 2, y: 0.5 - (d.dot(u) / z) / ty / 2 };
}

// ─── town pieces: house slots (hide / repaint), lamps
function slotBox(i) {
  const s = SLOTS[i], f = s.yaw === 0 ? 1 : -1;
  const zA = s.z + f * (3.5 + 1.0), zB = s.z - f * (3.5 + 0.7);
  return { x0: s.x - s.w / 2 - 0.75, x1: s.x + s.w / 2 + 0.75, z0: Math.min(zA, zB), z1: Math.max(zA, zB), y1: 12.5 };
}
const LAMP_LIST = [LAMPS.home, LAMPS.pil];
function townData(ctx) {
  const r = ctx.set.root; let D = ctx.props.td;
  if (D && D.root === r) return D;
  D = { root: r, meshes: [], insts: [] };
  const BX = SLOTS.map((_, i) => slotBox(i));
  const inB = (b, x, y, z) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y < b.y1 && y > -1;
  const lampOf = (x, z) => LAMP_LIST.findIndex((l) => Math.hypot(x - l[0], z - l[1]) < 0.7);
  for (const n of ['houses', 'roofs', 'trim', 'gold', 'lampPosts']) {
    const m = r.getObjectByName(n); if (!m || !m.geometry) continue;
    const pos = m.geometry.attributes.position;
    const lists = BX.map(() => []), lamp = LAMP_LIST.map(() => []);
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
      if (n === 'lampPosts') { const li = lampOf(x, z); if (li >= 0) lamp[li].push(v); continue; }
      for (let i = 0; i < BX.length; i++) if (inB(BX[i], x, y, z)) lists[i].push(v);
    }
    D.meshes.push({ n, m, pos, pos0: pos.array.slice(), lists, lamp });
  }
  r.traverse((o) => {
    if (!o.isInstancedMesh || !['windows', 'windowHalos', 'glows', 'lampCores', 'lampPools'].includes(o.name)) return;
    const a = o.instanceMatrix.array, lists = BX.map(() => []), lamp = LAMP_LIST.map(() => []);
    for (let k = 0; k < o.count; k++) {
      const x = a[k * 16 + 12], y = a[k * 16 + 13], z = a[k * 16 + 14];
      if (o.name.startsWith('lamp')) { const li = lampOf(x, z); if (li >= 0) lamp[li].push(k); continue; }
      for (let i = 0; i < BX.length; i++) if (inB(BX[i], x, y, z)) lists[i].push(k);
    }
    D.insts.push({ o, m0: a.slice(), lists, lamp });
  });
  const halo = r.getObjectByName('lampHalos');
  if (halo && halo.geometry.attributes.position) { const p = halo.geometry.attributes.position; const lamp = LAMP_LIST.map(() => []); for (let k = 0; k < p.count; k++) { const li = lampOf(p.getX(k), p.getZ(k)); if (li >= 0) lamp[li].push(k); } D.halo = { o: halo, lamp, s0: halo.geometry.attributes.size ? halo.geometry.attributes.size.array.slice() : null }; }
  ctx.props.td = D; return D;
}
/** hide house slots and (lamp indices into LAMP_LIST) lamps */
function townEdit(ctx, { hide = [], lamps = [] } = {}) {
  const D = townData(ctx);
  for (const M of D.meshes) {
    const pa = M.pos.array; pa.set(M.pos0);
    for (const i of hide) for (const v of M.lists[i] || []) { pa[v * 3] = 0; pa[v * 3 + 1] = -500; pa[v * 3 + 2] = 0; }
    for (const li of lamps) for (const v of M.lamp[li] || []) { pa[v * 3] = 0; pa[v * 3 + 1] = -500; pa[v * 3 + 2] = 0; }
    M.pos.needsUpdate = true;
  }
  for (const I of D.insts) {
    const a = I.o.instanceMatrix.array; a.set(I.m0);
    const zero = (k) => { for (let e = 0; e < 16; e++) a[k * 16 + e] = 0; };
    for (const i of hide) for (const k of I.lists[i] || []) zero(k);
    for (const li of lamps) for (const k of I.lamp[li] || []) zero(k);
    I.o.instanceMatrix.needsUpdate = true;
  }
  if (D.halo && D.halo.s0) { const s = D.halo.o.geometry.attributes.size; s.array.set(D.halo.s0); for (const li of lamps) for (const k of D.halo.lamp[li]) s.array[k] = 0; s.needsUpdate = true; }
}

// ─── sky moods layered on the preset
const MOODS = {
  purple: { z: '#12052e', m: '#3a1468', h: '#a24ad0', g: '#0e0818', s: '#000000', fog: '#2e1550', hemi: ['#b08aff', '#2a1040'], dir: '#c8a8ff' },
  sunrise: { z: '#4f86d8', m: '#ffb48a', h: '#ffd09a', g: '#6a8f5a', s: '#ffd8a0', fog: '#ffcfa8', hemi: ['#ffe6c8', '#8a7a5a'], dir: '#ffcf98' },
  dawn: { z: '#2a2a6a', m: '#d0608a', h: '#ff9a5a', g: '#2a1a2a', s: '#ffb060', fog: '#8a4a6a', hemi: ['#ffb0a0', '#3a2040'], dir: '#ffb080' },
  cold: { z: '#0a1430', m: '#1e3a6a', h: '#4a78b0', g: '#0a0e1a', s: '#000000', fog: '#1a2a4a', hemi: ['#a8c8ff', '#1a2440'], dir: '#c8dcff' },
};
const _m1 = new THREE.Color(), _m2 = new THREE.Color();
function skyBase(ctx) {
  const r = ctx.set.root, sky = r.getObjectByName('sky');
  if (!sky || !sky.material.uniforms) { ctx.store.sky = null; return; }
  const u = sky.material.uniforms, lights = [];
  r.traverse((o) => { if (o.isHemisphereLight) lights.push({ o, c: o.color.clone(), g: o.groundColor.clone(), i: o.intensity }); else if (o.isDirectionalLight) lights.push({ o, c: o.color.clone(), i: o.intensity }); });
  ctx.store.sky = { u, base: { z: u.uZenith.value.clone(), m: u.uMid.value.clone(), h: u.uHorizon.value.clone(), g: u.uGround.value.clone(), s: u.uSunColor.value.clone() }, fog: ctx.set.fog ? ctx.set.fog.color.clone() : null, lights };
}
function skyMood(ctx, name, k = 1, { lights = true } = {}) {
  const S = ctx.store.sky; if (!S) return;
  const M = MOODS[name], { u, base } = S, kk = clamp(k, 0, 1);
  const mix = (b, hex) => _m1.copy(b).lerp(_m2.set(hex), kk);
  u.uZenith.value.copy(mix(base.z, M.z)); u.uMid.value.copy(mix(base.m, M.m)); u.uHorizon.value.copy(mix(base.h, M.h)); u.uGround.value.copy(mix(base.g, M.g));
  u.uSunColor.value.copy(mix(base.s, M.s));
  if (S.fog) { ctx.set.fog.color.copy(mix(S.fog, M.fog)); if (ctx.set.background) ctx.set.background.copy(ctx.set.fog.color); }
  if (lights) for (const l of S.lights) {
    if (l.g) { l.o.color.copy(_m1.copy(l.c).lerp(_m2.set(M.hemi[0]), kk)); l.o.groundColor.copy(_m1.copy(l.g).lerp(_m2.set(M.hemi[1]), kk)); }
    else l.o.color.copy(_m1.copy(l.c).lerp(_m2.set(M.dir), kk));
  }
}
/** two moods: a → b by u (both blended over the preset) */
function skyMood2(ctx, a, b, u) {
  const S = ctx.store.sky; if (!S) return;
  const A = MOODS[a], B = MOODS[b], k = clamp(u, 0, 1);
  const mx = (ha, hb) => _m1.set(ha).lerp(_m2.set(hb), k);
  const { u: un } = S;
  un.uZenith.value.copy(mx(A.z, B.z)); un.uMid.value.copy(mx(A.m, B.m)); un.uHorizon.value.copy(mx(A.h, B.h)); un.uGround.value.copy(mx(A.g, B.g)); un.uSunColor.value.copy(mx(A.s, B.s));
  if (S.fog) { ctx.set.fog.color.copy(mx(A.fog, B.fog)); if (ctx.set.background) ctx.set.background.copy(ctx.set.fog.color); }
  for (const l of S.lights) { if (l.g) { l.o.color.copy(mx(A.hemi[0], B.hemi[0])); l.o.groundColor.copy(mx(A.hemi[1], B.hemi[1])); } else l.o.color.copy(mx(A.dir, B.dir)); }
}

// ─── town looks
function town(ctx, light = 'day', { glow = 0.85, exposure = null, hide = [], lamps = [], party = false } = {}) {
  const s = ctx.set;
  s.setLighting(light); s.set('partyProps', party); s.set('fireworks', false); s.set('foam', 0);
  s.set('windowGlow', light === 'day' ? 0 : glow); s.set('standsCrowd', false); s.set('crowdMotion', 1);
  s.exposure = exposure ?? (light === 'quiet_night' ? 1.3 : light === 'dusk' ? 1.05 : 1.0);
  const L = T(ctx); ctx.store.L = L;
  townEdit(ctx, { hide, lamps });
  for (const n of ['grass', 'hills', 'sky', 'stars']) { const o = s.root.getObjectByName(n); if (o) o.visible = true; }
  skyBase(ctx);
  return L;
}
/** night stampede look: quiet night + purple sky, all street houses gone */
function nightTown(ctx, { k = 0.8, hide = ALL, lamps = [], exposure = 1.35 } = {}) {
  const L = town(ctx, 'quiet_night', { glow: 0, hide, lamps, exposure });
  skyMood(ctx, 'purple', k);
  return L;
}
/** a walking house at town-local (x, z) with yaw */
function hs(ctx, h, x, z, yaw = 0) { addTo(ctx, h, x, 0, z, yaw); h.rotation.order = 'YXZ'; return h; }
function hset(h, t, s) { h.userData.set(t, s); return h; }
/** puff (dust burst) i at town-local point, u = seconds-normalised progress */
function dust(ctx, i, x, y, z, u, s = 1) { const p = ctx.props.puffs[i]; addTo(ctx, p.root, x, y, z, 0, s); p.update(clamp(u, 0, 1.01)); return p; }
/** world-space dust burst at a world point */
function dustW(ctx, i, wp, u, s = 1) { const p = ctx.props.puffs[i]; ctx.add(p.root); p.root.position.copy(wp); p.root.scale.setScalar(s); p.update(clamp(u, 0, 1.01)); return p; }
/** stick a character to a house's bay (inside my bedroom window), facing out of the house */
function inBay(ctx, ch, h, dx = 0, dz = 0) {
  const b = h.userData.body; h.updateMatrixWorld(true);
  ch.root.position.copy(b.localToWorld(h.userData.local('bay').add(V(dx, 0, dz))));
  ch.root.quaternion.copy(b.getWorldQuaternion(new THREE.Quaternion()));
}
/** a point in a house's body frame → world */
function hb(h, x, y, z) { h.updateMatrixWorld(true); return h.userData.body.localToWorld(V(x, y, z)); }
/** a camera rigidly attached to a house body: pos / look in body-local coords */
function houseCam(h, pos, look, fov = 50) { return { pos: hb(h, ...pos), look: hb(h, ...look), fov }; }
/** both hands pressed on the glass in front of the face */
function pressGlass(ch, t, k = 1) {
  ch.pose('surprised', 0.35, { intensity: 0.5 });
  const J = ch.joints;
  J.armL.rotation.set(-2.2 * k, 0, -0.25); J.armR.rotation.set(-2.2 * k, 0, 0.25);
  J.foreArmL.rotation.set(-0.6 * k, 0, 0); J.foreArmR.rotation.set(-0.6 * k, 0, 0);
  J.torso.rotation.x += 0.05 * Math.sin(t * 9);
}
function holdUp(ch, t, k = 1, o = {}) {   // hands together in front of the chest (holding something)
  ch.pose('idle', t, { intensity: 0.3, ...o });
  const J = ch.joints;
  J.armL.rotation.set(-1.0 * k, 0, -0.32 * k); J.armR.rotation.set(-1.0 * k, 0, 0.32 * k);
  J.foreArmL.rotation.set(-0.75 * k, 0, 0); J.foreArmR.rotation.set(-0.75 * k, 0, 0);
}
function crowd(ctx, ids, spots) {
  const L = ctx.store.L;
  return ids.map((id, i) => { const [x, y, z, yw] = spots[i]; const ch = put(ctx, id, L(x, y, z), L.yaw + yw); return { ch, id, k: i, ph: hash(i * 1.9 + 3) * 3, x, y, z, yw }; });
}

// ─── more helpers
/** gait settings for a house running at v m/s */
function gait(v, mode = 'gallop', o = {}) { const stride = o.stride ?? (mode === 'gallop' ? 1.3 : mode === 'scramble' ? 0.9 : mode === 'tiptoe' ? 0.55 : 0.8); return { rise: 1, mode, stride, freq: v / (4 * stride), ...o }; }
function place(h, x, z, yaw) { h.position.set(x, 0, z); h.rotation.set(0, yaw, 0); return h; }
/** ring slot i of n around FIELD: { x, z, yaw (front toward the centre) } */
function ringSlot(i, n = 9, r = RING, a0 = 0) { const a = a0 + (i / n) * PI * 2; const x = FIELD.x + Math.sin(a) * r, z = FIELD.z + Math.cos(a) * r; return { x, z, yaw: yawTo(x, z, FIELD.x, FIELD.z) }; }
const RING_HOUSES = (P) => [P.home, ...P.herd.slice(0, 5), P.pil, P.herd[5], P.herd[6]];
/** the ring of houses in the field; mine is slot 0 (south side, facing north) */
function fieldRing(ctx, { skip = [] } = {}) {
  const P = ctx.props, list = RING_HOUSES(P);
  list.forEach((h, i) => { if (skip.includes(i)) return; const s = ringSlot(i); hs(ctx, h, s.x, s.z, s.yaw); });
  return list;
}
/** field at night: quiet night + purple sky + fog + motes */
function fieldNight(ctx, { k = 1, fog = 1, exposure = 1.2 } = {}) {
  const L = town(ctx, 'quiet_night', { glow: 0, exposure });
  skyMood(ctx, 'purple', k);
  const P = ctx.props;
  if (fog > 0) { addTo(ctx, P.fog, FIELD.x, 0, FIELD.z); ctx.store.fogK = fog; }
  addTo(ctx, P.motes, FIELD.x, 4, FIELD.z);
  return L;
}
function fieldTick(ctx, t) { const P = ctx.props; if (ctx.store.fogK) P.fog.userData.set(t, ctx.store.fogK); P.motes.userData.set(t, 0.8); }
/** humming pulse 0..1 synced across the ring */
const hum = (t) => 0.5 + 0.5 * Math.sin(2 * PI * 1.15 * t);
/** horizontal speed lines on the 2D layer */
function speedLines(ctx, k = 1, dir = 1, seed = 1) {
  if (k <= 0) return; const t = ctx.t;
  ctx.fx.draw((g, W, Hh) => {
    g.globalAlpha = 0.55 * k; g.strokeStyle = '#ffffff'; g.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const y = Hh * (0.08 + 0.84 * hash(i * 3.1 + seed)), len = W * (0.18 + 0.3 * hash(i * 5.7 + seed));
      const x = ((hash(i * 7.3 + seed) + t * (2.2 + 1.5 * hash(i))) % 1.4 - 0.2) * W;
      g.lineWidth = 3 + 5 * hash(i * 2.2 + seed); g.beginPath();
      const x0 = dir > 0 ? W - x : x; g.moveTo(x0, y); g.lineTo(x0 + dir * len, y); g.stroke();
    }
  });
}
/** hanging from the porch canopy by the right hand, left arm stretching down/out to the bell */
function hangPose(ch, t, reach = 1, jab = 0) {
  ch.pose('surprised', 0.3, { intensity: 0.4 });
  const J = ch.joints, sw = Math.sin(t * 3.1);
  J.armR.rotation.set(-3.05, 0, 0.12); J.foreArmR.rotation.set(-0.05, 0, 0);
  J.armL.rotation.set(-0.35 - 0.2 * reach + 0.3 * jab, 0, -0.95 * reach); J.foreArmL.rotation.set(-0.15 - 0.3 * jab, 0, 0);
  J.legL.rotation.set(0.15 + 0.12 * sw, 0, -0.08); J.legR.rotation.set(-0.1 - 0.12 * sw, 0, 0.08);
  J.shinL.rotation.x = 0.35; J.shinR.rotation.x = 0.2;
  J.torso.rotation.z = -0.12 * reach; J.head.rotation.set(0.18, 0.3, 0);
}
/** flying flat behind the house holding the handle (root yaw: head toward the house) */
function flagPose(ch, t) {
  ch.pose('surprised', 0.3, { intensity: 0.3 });
  const J = ch.joints;
  J.armL.rotation.set(-3.0, 0, 0.12); J.armR.rotation.set(-3.0, 0, -0.12); J.foreArmL.rotation.set(0, 0, 0); J.foreArmR.rotation.set(0, 0, 0);
  const w = Math.sin(t * 16), w2 = Math.sin(t * 16 + 1.4);
  J.legL.rotation.set(0.35 * w, 0, -0.18); J.legR.rotation.set(-0.35 * w, 0, 0.18); J.shinL.rotation.x = 0.2 + 0.2 * w2; J.shinR.rotation.x = 0.2 - 0.2 * w2;
  J.torso.rotation.x = 0.06 * w2; J.head.rotation.set(-0.25, 0, 0);
}
/** dog-pat: reach forward-down with the right hand */
function patPose(ch, t) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints; J.armR.rotation.set(-1.9 + 0.25 * Math.sin(t * 8), 0, 0.15); J.foreArmR.rotation.set(-0.2, 0, 0); J.torso.rotation.x += 0.12;
}
function sleepPose(ch, t, k = 1) {
  ch.pose('sit', t, { hands: 'table' });
  const J = ch.joints, b = 0.04 * Math.sin(t * 1.3);
  J.torso.rotation.x += 0.55 * k + b; J.head.rotation.x += 0.35 * k;
  J.armL.rotation.set(-1.55 * k, 0, 0.5 * k); J.armR.rotation.set(-1.55 * k, 0, -0.5 * k); J.foreArmL.rotation.set(-1.1 * k, 0, 0.9 * k); J.foreArmR.rotation.set(-1.1 * k, 0, -0.9 * k);
}
function earOn(ctx, ch) { const P = ctx.props; ch.setAccessory('headphones', false); ctx.add(P.ear, ch.joints.head); P.ear.position.set(0, 0.05, 0); P.ear.rotation.set(0, 0, 0); }
/** bedroom (room set) at night, root bounce b */
const RM = { chair: [1.63, 0, -1.35], desk: [2.18, 0.78, -1.35], bed: [-1.95, 0.55, -1.05], win: [-0.8, 1.6, -2.1] };
function room(ctx, { light = 'night', exposure = 1.5 } = {}) {
  const s = ctx.set; s.setLighting(light); s.set('window', 'dark'); s.exposure = exposure;
  s.root.position.set(0, 0, 0); s.root.rotation.set(0, 0, 0);
  const P = ctx.props;
  const R = T(ctx); ctx.store.R = R; ctx.store.L = R;
  addTo(ctx, P.monitor, 2.3, 0.78, -1.62, -PI / 2);
  addTo(ctx, P.frost, RM.win[0], RM.win[1], RM.win[2] + 0.09, 0);
  addTo(ctx, P.posters[0], -2.47, 2.45, 0.35, PI / 2); addTo(ctx, P.posters[1], 2.47, 2.55, 0.25, -PI / 2);
  return R;
}
function roomBounce(ctx, b) { const r = ctx.set.root; r.position.y = b; ctx.store.R = T(ctx); ctx.store.L = ctx.store.R; return ctx.store.R; }
const bounceAt = (t) => 0.16 * Math.abs(Math.sin(t * PI / 0.42));

/** Mrs. Mokoena's lonely house in a morning field, bed in front of the door */
function mokSetup(ctx) {
  const P = ctx.props, L = town(ctx, 'day');
  hs(ctx, P.herd[7], MOK.x, MOK.z, MOK.yaw);
  const f = V(Math.sin(MOK.yaw), 0, Math.cos(MOK.yaw)), r = V(f.z, 0, -f.x);
  const b = V(MOK.x, 0, MOK.z).addScaledVector(f, 5.4).addScaledVector(r, 0.3);
  addTo(ctx, P.bed, b.x, 0, b.z, MOK.yaw + PI / 2);
  ctx.store.bed = { b, yaw: MOK.yaw + PI / 2 };
  const sg = V(MOK.x, 0, MOK.z).addScaledVector(f, 3).addScaledVector(r, 7.5);
  addTo(ctx, P.sign, sg.x, 0, sg.z, MOK.yaw + 0.3);
  put(ctx, 'mokoena', V(), 0);
  return L;
}
function mokTick(ctx, t) {
  const L = ctx.store.L, P = ctx.props, mk = ctx.cast.mokoena, { b, yaw } = ctx.store.bed;
  skyMood(ctx, 'sunrise', 0.45);
  hset(P.herd[7], t, { rise: 0.16, glow: 0, smoke: 0.5, spread: 1.0 });
  const yw = L.yaw + yaw;
  mk.root.position.copy(L(b.x, 0, b.z)).add(V(Math.sin(yw), 0, Math.cos(yw)).multiplyScalar(-0.55)); mk.root.rotation.set(0, yw, 0);
}

const angDiff = (a, b) => { let d = (b - a) % (2 * PI); if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI; return d; };
function filler(ctx, list) { const f = ctx.props.filler; ctx.add(f, ctx.set.root); f.position.set(0, 0, 0); f.userData.layout(list); return f; }
/** Mr. Pillay's ripped-out lamp post dragged on the chain behind his house (running toward −x); base at town-local (lx, z) */
function dragLamp(ctx, t, lx, z) {
  const P = ctx.props, L = ctx.store.L, h = P.pil;
  const by = 0.25 + 0.4 * Math.abs(Math.sin(t * 8.5));
  P.lamp.position.set(lx, by, z); P.lamp.userData.set({ tilt: PI / 2 - 0.2 - 0.12 * Math.sin(t * 8.5 + 1), dir: PI / 2 + 0.15 * Math.sin(t * 5), on: 0.75 + 0.25 * Math.sin(t * 37) });
  const f2 = h.userData.foot(2), f3 = h.userData.foot(3), f = (Math.abs(f2.z - L(0, 0, z).z) < Math.abs(f3.z - L(0, 0, z).z) ? f2 : f3).add(up(1.0));
  P.chain.userData.set(f, L(lx - 0.1, by + 0.25, z), 0.25);
  P.sparks.forEach((s, k) => { s.position.set(lx + 0.15, 0.12, z + (k - 1) * 0.2); s.userData.aim(V(1, 0.5, (k - 1) * 0.3), 0.6); s.userData.set(((t + k * 0.13) % 0.4)); });
  key(ctx, L(lx, 1.2, z), 0.8 + 0.4 * Math.abs(Math.sin(t * 23)), '#ffb04a', 12);
}
/** the town square at party night: Mr. Pillay dancing on the stage with friends, crowd in the plaza, his house galloping behind */
function partySquare(ctx) {
  const L = town(ctx, 'party_night', { party: true, glow: 1, hide: [PIL], exposure: 1.1 });
  ctx.set.set('standsCrowd', true);
  const P = ctx.props;
  const pl = put(ctx, 'pillay', L(50.4, 0.8, -0.5), L.yaw - PI / 2); pl.setAccessory('cap', false); pl.setAccessory('partyHat', true);
  ctx.store.fr = crowd(ctx, [X[3], X[4], X[5]], [[50.9, 0.8, 1.9, -PI / 2 - 0.35], [51.0, 0.8, -2.9, -PI / 2 + 0.35], [51.8, 0.8, 4.0, -PI / 2 - 0.2]]);
  ctx.store.fr.forEach((c) => c.ch.setAccessory('partyHat', true));
  const list = []; for (let i = 0; i < 44; i++) { const x = 44.6 + (i % 4) * 1.1 + hash(i * 3.1) * 0.5, z = -7.5 + Math.floor(i / 4) * 1.4 + hash(i * 1.7) * 0.4; if (Math.abs(z - 4) < 1.0 && x < 45) continue; list.push({ x, y: 0, z, yaw: PI / 2 + (hash(i) - 0.5) * 0.6, k: i, s: 0.9 + 0.2 * hash(i * 2.3) }); }
  filler(ctx, list);
  hs(ctx, P.pil, 70, -30, 0);
}
function partyTick(ctx, t, lt) {
  const P = ctx.props, pl = ctx.cast.pillay;
  pl.pose('dance', t, { speed: 1.2 }); pl.face('laugh', 0.3);
  ctx.store.fr.forEach((c, i) => { c.ch.pose(i % 2 ? 'dance2' : 'cheer', t + c.ph, {}); c.ch.face(i % 2 ? 'grin' : 'laugh', t + c.ph); });
  P.filler.userData.set(t, { arms: 'up', bounce: 1 });
  place(P.pil, 69, -36 + 18 * lt, 0);
  hset(P.pil, t, { ...gait(18), glow: 0.5, porch: 0.6, smoke: 1, smokeDrift: 5 });
}
/** every ring house hums: purple pulsing windows + halos, chimneys puffing together */
function ringHum(ctx, t, { bell = 0, skip = [] } = {}) {
  fieldTick(ctx, t);
  const p = hum(t), L = ctx.store.L;
  ctx.store.ring.forEach((h, i) => { if (skip.includes(i)) return; hset(h, t, { rise: 0.08, glow: 0.55 + 0.45 * p, glowColor: '#c77dff', halo: 0.5 + 0.6 * p, porch: 0.4, smoke: 1, bayLight: i === 0 ? 0.45 : 0, frost: 0.5, bell: i === 0 ? bell : 0 }); });
  key(ctx, L(FIELD.x, 3, FIELD.z), 0.45 + 0.5 * p, '#b070ff', 40);
}
function clockInHands(ctx, me) { ctx.add(ctx.props.clock); ctx.store.clockMe = me; }
function clockTick(ctx, me) {
  const P = ctx.props; me.root.updateMatrixWorld(true);
  const a = me.joints.handL.getWorldPosition(V()), b = me.joints.handR.getWorldPosition(V()), q = me.root.getWorldQuaternion(new THREE.Quaternion());
  P.clock.position.copy(a.add(b).multiplyScalar(0.5)).add(V(0, 0.14, 0)).addScaledVector(V(0, 0, 1).applyQuaternion(q), 0.06);
  P.clock.quaternion.copy(q);
}
/** me hanging from the right end of the porch canopy; jab 0..1 moves the left hand onto the doorbell */
function hangAt(ctx, me, h, t, reach, jab) {
  const q = h.userData.quat(); me.root.quaternion.copy(q);
  me.root.position.copy(hb(h, 1.0, 0.7, 3.5 + 0.5));
  hangPose(me, t, reach, jab);
  me.root.updateMatrixWorld(true);
  const grab = hb(h, 0.98, 2.56, 3.5 + 0.5), hr = me.joints.handR.getWorldPosition(V());
  me.root.position.add(grab.sub(hr));
  if (jab > 0) {
    me.root.updateMatrixWorld(true);
    const hl = me.joints.handL.getWorldPosition(V()), tgt = h.userData.pt('bell').add(V(0, 0, 0.05).applyQuaternion(q));
    me.root.position.add(tgt.sub(hl).multiplyScalar(jab));
  }
}
/** me flying flat behind the galloping house, both hands on the back-door handle */
function flagOn(ctx, me, h, t) {
  const q = h.userData.quat(), fw = V(0, 0, 1).applyQuaternion(q), phi = Math.atan2(fw.x, fw.z);
  me.root.rotation.order = 'YXZ'; me.root.rotation.set(-PI / 2 + 0.12 * Math.sin(t * 13), phi + PI, 0.25 * Math.sin(t * 9));
  me.root.position.set(0, 0, 0);
  flagPose(me, t);
  me.root.updateMatrixWorld(true);
  const a = me.joints.handL.getWorldPosition(V()), b = me.joints.handR.getWorldPosition(V()), mid = a.add(b).multiplyScalar(0.5);
  const tgt = h.userData.pt('backHandle').add(V(0, 0.25 * Math.sin(t * 15), 0));
  me.root.position.add(tgt.sub(mid));
}
/** sunrise main street: the houses are still gone, people in pyjamas and sleeping bags on the road */
const CROWD19 = [['pj1', -18.0, 0, 2.4], ['pj2', -19.7, 0, 3.6], ['pj3', -21.3, 0, 2.0], ['pj4', -17.2, 0, 4.6], ['pj5', -20.6, 0.12, 5.9], ['pj6', -22.6, 0.12, 6.6]];
function sunriseStreet(ctx) {
  const L = town(ctx, 'day', { hide: ALL, exposure: 1.05 });
  skyBase(ctx); skyMood(ctx, 'sunrise', 0.75);
  const P = ctx.props;
  hs(ctx, P.home, -27, 2.2, -PI / 2);
  ctx.store.cr = CROWD19.map(([id, x, y, z], i) => { const ch = put(ctx, id, L(x, y, z), L.yaw + PI + 0.5 + (hash(i) - 0.5) * 0.6); const tb = P.tubes[i]; ctx.add(tb); return { ch, tb, x, y, z, ph: hash(i * 3.3) * 2, i }; });
  [[-12.5, -1.6, 0.3], [-14.6, -2.6, -0.2], [-10.4, 1.8, 0.5], [-24.2, -3.4, 0.1], [-15.2, 1.2, -0.4]].forEach(([x, z, yw], i) => addTo(ctx, P.bags[i], x, 0, z, yw));
  const list = []; for (let i = 0; i < 26; i++) list.push({ x: -8 - i * 0.75 - hash(i) * 0.3, y: 0.12, z: 6.6 + hash(i * 2.1) * 0.9, yaw: PI + (hash(i * 4.4) - 0.5) * 0.8, k: i, s: 0.9 + 0.15 * hash(i * 1.3) });
  filler(ctx, list);
  return L;
}
function crowdTick(ctx, t, ts) {
  const L = ctx.store.L, P = ctx.props;
  ctx.store.cr.forEach((c) => {
    const jump = t > ts ? 0.38 * Math.abs(Math.sin((t + c.ph) * 6.5)) : 0;
    c.ch.root.position.copy(L(c.x, c.y + jump, c.z));
    if (t > ts) { c.ch.pose('cheer', t + c.ph, {}); c.ch.face(c.i % 2 ? 'laugh' : 'grin', t + c.ph); } else { c.ch.pose('surprised', 0.3, {}); c.ch.face('shocked', 0.3); }
    c.tb.position.copy(c.ch.root.position); c.tb.quaternion.copy(c.ch.root.quaternion);
  });
  P.filler.userData.set(t, { arms: t > ts ? 'cheer' : 'up', bounce: t > ts ? 1 : 0.2 });
}
/** my front garden, morning: the house stands relaxed in its slot */
function garden(ctx) {
  const L = town(ctx, 'day', { hide: [HOME] });
  const P = ctx.props; hs(ctx, P.home, -27, 14, PI); hs(ctx, P.shed, -27, 9, PI); P.shed.visible = true;
  return L;
}
function gardenTick(ctx, t, extra = {}) { hset(ctx.props.home, t, { rise: 0.72, smoke: 0.5, glow: 0, porch: 0.3, ...extra }); }
function shedAt(ctx, x, z, yaw, t, s = {}) { const P = ctx.props; place(P.shed, x, z, yaw); P.shed.visible = true; hset(P.shed, t, s); }

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, the houses have legs. And last night, mine ran away with me inside."
  {
    name: 'dusk street', start: 0, set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { glow: 0.55, hide: [HOME], lamps: [0] });
      hs(ctx, ctx.props.home, -27, 14, PI);
      put(ctx, 'me', V(), 0);
      ctx.store.w = crowd(ctx, [X[0], X[1], X[2]], [[-34, 0.12, 6.4, PI / 2], [-16.5, 0.12, 6.6, -PI / 2], [-32, 0.12, 7.4, PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, h = ctx.props.home, me = ctx.cast.me;
      hset(h, t, { rise: 0, glow: 0.9, bayLight: 1, porch: 1, smoke: 0.7 });
      inBay(ctx, me, h, 0, -0.15); me.pose('idle', t); me.face('smile', t);
      ctx.store.w.forEach((w) => { const sp = WALK_SPEED * 0.7 * t; w.ch.root.position.copy(L(w.x + sp * Math.sin(w.yw), w.y, w.z + sp * Math.cos(w.yw))); w.ch.pose('walk', t + w.ph, { speed: 0.7 }); w.ch.face('smile', t + w.ph); });
      moveCam(ctx, { pos: L(-17.2, 2.6, -5.6), look: L(-27, 6.2, 12), fov: 62 }, { pos: L(-18.6, 2.4, -4.4), look: L(-27, 6.0, 12), fov: 58 }, ease.inOutSine(clamp(lt / 1.8, 0, 1)), 1.5, '#ffd8b0', 18);
    },
  },
  {
    name: 'house rises', start: 'b01.w6-0.15', set: 'town',
    setup(ctx) { town(ctx, 'dusk', { glow: 0.55, hide: [HOME], lamps: [0] }); hs(ctx, ctx.props.home, -27, 14, PI); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, h = ctx.props.home, tl = ctx.time('b01.w6'), me = ctx.cast.me;
      const r = ease.outBack(clamp((t - tl) / 0.7, 0, 1)), st = clamp((t - tl - 0.8) / 0.4, 0, 1) * (1 - clamp((t - tl - 1.2) / 0.3, 0, 1));
      hset(h, t, { rise: r, glow: 0.9, bayLight: 1, porch: 1, smoke: 0.7, stretch: ease.inOutSine(st), roll: 0.03 * Math.sin(t * 13) * (1 - r) });
      inBay(ctx, me, h, 0, 0.05); pressGlass(me, t, r); me.face('shocked', 0.4);
      for (let i = 0; i < 4; i++) dustW(ctx, i, h.userData.foot(i), (t - tl - 0.05) / 1.1, 1.2);
      moveCam(ctx, { pos: L(-33.0, 0.9, 1.6), look: L(-27, 6.0, 13), fov: 62 }, { pos: L(-33.6, 0.8, 0.6), look: L(-27, 7.0, 13), fov: 64 }, ease.inOutSine(clamp(lt / 1.4, 0, 1)), 1.2, '#ffd8b0', 24);
      shakeOn(ctx, [tl + 0.05], 0.5, 0.6, 3);
    },
  },
  {
    name: 'me at window', start: 'b01.w10-0.1', set: 'town',
    setup(ctx) { town(ctx, 'dusk', { glow: 0.55, hide: [HOME], lamps: [0] }); hs(ctx, ctx.props.home, -27, 14, PI); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const t = ctx.t, h = ctx.props.home, me = ctx.cast.me;
      const z = 14 - 5 * Math.max(0, lt - 0.15) ** 2;
      place(h, -27, Math.max(2, z), PI);
      hset(h, t, { ...gait(lt > 0.2 ? 6 : 0.01, lt > 0.2 ? 'gallop' : 'stand'), glow: 0.9, bayLight: 1, porch: 1, smoke: 0.7, smokeDrift: 2 });
      inBay(ctx, me, h, 0, 0.05); pressGlass(me, t); me.face('shocked', 0.4);
      setCam(ctx, houseCam(h, [2.0, 3.0, 3.5 + 4.2], [0.15, 3.85, 3.5], 44), 0.6, '#ffe0c0', 8);
      ctx.cam.shake(0.25, t, 4);
    },
  },
  // ── b02 "Once a year, on the first cold night, they stand up and leave. Nobody knows where."
  {
    name: 'first cold night', start: 'b02-0.15', set: 'town',
    setup(ctx) {
      town(ctx, 'quiet_night', { glow: 0.5, hide: [HOME], lamps: [0] });
      hs(ctx, ctx.props.home, -27, 14, PI);
      addTo(ctx, ctx.props.snow, -27, 6, 6);
      const P = ctx.props; addTo(ctx, P.frost, -27, 4.2, 14 - 3.5 - 0.06, PI); P.frost.scale.set(1.2, 1.2, 1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, h = ctx.props.home, P = ctx.props;
      skyMood(ctx, 'cold', 0.9);
      const fk = clamp(lt / 1.6, 0, 1);
      hset(h, t, { rise: 0, glow: 0.35, glowColor: '#9fc8ff', porch: 0.6, frost: 1, smoke: 0.5, bayLight: 0.35 });
      P.frost.userData.set(0.15 + 0.85 * fk);
      P.snow.userData.set(t, 1);
      moveCam(ctx, { pos: L(-20.6, 3.0, -2.6), look: L(-27, 7.2, 12), fov: 58 }, { pos: L(-21.6, 3.2, -1.4), look: L(-27, 7.4, 12), fov: 54 }, ease.inOutSine(lt / 2.2), 2.0, '#c8dcff', 20);
      ctx.fx.overlay('#3a6ac8', 0.08);
      tag(ctx, 'FIRST COLD NIGHT', ctx.time('b02.w6') - 0.05, Infinity, { y: 0.11, size: 62, bg: 'rgba(40,90,180,0.9)' });
    },
  },
  {
    name: 'tiptoe past tower', start: 'b02.w9-0.12', set: 'town',
    setup(ctx) {
      const P = ctx.props;
      town(ctx, 'quiet_night', { glow: 0.3, hide: [0, 5] });
      ctx.store.line = [P.herd[0], P.herd[1], P.herd[2], P.herd[3]];
      ctx.store.line.forEach((h) => hs(ctx, h, -60, 0, PI));
      ctx.store.w = crowd(ctx, ['pj1', 'pj2', 'pj3'], [[-34.0, 0.0, 4.3, -PI / 2 - 0.2 + 0.8], [-34.6, 0.0, 5.9, -PI / 2 - 0.2 - 0.8], [-37.4, 0.0, 4.6, -PI / 2 + 0.5]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      skyMood(ctx, 'purple', 0.9);
      ctx.store.line.forEach((h, i) => { place(h, -61 + (i % 2) * 3, 16 - i * 12.5 - 3.2 * lt, PI); hset(h, t + i * 0.3, { ...gait(3.2, 'tiptoe'), glow: 0.4, glowColor: '#ffd27a', frost: 1, porch: 0.3, smoke: 0.5 }); });
      ctx.store.w.forEach((w, i) => { w.ch.pose(i === 0 ? 'point' : 'idle', t + w.ph, { headYaw: i === 1 ? 0.6 : -0.4 }); w.ch.face(i === 0 ? 'shocked' : 'squint', 0.4); });
      moveCam(ctx, { pos: L(-30.5, 1.5, 6.4), look: L(-52, 8.5, -0.5), fov: 58 }, { pos: L(-31.2, 1.6, 6.0), look: L(-52, 9.0, -1.0), fov: 56 }, lt / 1.3, 1.4, '#c8b8ff', 9);
    },
  },
  {
    name: 'nobody knows', start: 'b02.w13-0.12', set: 'town',
    setup(ctx) {
      const P = ctx.props;
      town(ctx, 'quiet_night', { glow: 0.3, hide: [0, 5] });
      ctx.store.line = [P.herd[0], P.herd[1]];
      ctx.store.line.forEach((h) => hs(ctx, h, -62, -20, PI));
      ctx.store.w = crowd(ctx, ['pj1', 'pj2'], [[-36.4, 0, 2.0, PI / 2 - 0.35], [-36.5, 0, 3.4, PI / 2 + 0.3]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      skyMood(ctx, 'purple', 0.85);
      ctx.store.line.forEach((h, i) => { place(h, -66 - i * 9, -14 - i * 8 - 3 * lt, PI + 0.4); hset(h, t + i * 0.3, { ...gait(3, 'tiptoe'), glow: 0.2, frost: 1, porch: 0.2 }); });
      ctx.store.w.forEach((w, i) => { if (lt < 0.3) { w.ch.pose('idle', t, {}); w.ch.face('squint', 0.3); } else { w.ch.pose('shrug', lt - 0.3 + i * 0.1, {}); w.ch.face(i ? 'sweat' : 'neutral', 0.3); } });
      const f = humanFace(ctx.store.w[0].ch).lerp(humanFace(ctx.store.w[1].ch), 0.5);
      setCam(ctx, { pos: L(-31.4, 1.7, 3.6), look: f.clone().add(up(-0.55)), fov: 44 }, 1.4, '#d8c8ff', 10);
    },
  },
  // ── b03 "Rules: chain your house to a lamp post. Never be inside when it runs. And if it runs off, ring its doorbell. It comes home like a dog."
  {
    name: 'chain it', start: 'b03-0.15', set: 'town',
    setup(ctx) {
      const P = ctx.props;
      town(ctx, 'day', { hide: [PIL] });
      hs(ctx, P.pil, -15, 14, PI);
      ctx.add(P.chain); ctx.add(P.lock);
      put(ctx, 'pillay', V(), 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, pl = ctx.cast.pillay, tl = ctx.time('b03.w7') + 0.15;
      hset(P.pil, t, { rise: 0.92, glow: 0, smoke: 0.4, roll: 0.01 * Math.sin(t * 2) });
      const a = P.pil.userData.foot(1).add(up(1.1)), b = L(-15, 1.05, 5.15);
      P.chain.userData.set(a, b, 0.35);
      P.lock.position.copy(b).add(V(0.25, -0.45, -0.35)); P.lock.rotation.set(0, L.yaw + 0.5, 0); P.lock.scale.setScalar(1.5); P.lock.userData.set(t < tl ? clamp((t - tl + 0.6) / 0.6, 0, 0.6) * 0 : 1);
      pl.root.position.copy(L(-14.1, 0.12, 4.4)); pl.root.rotation.set(0, L.yaw + yawTo(-14.1, 4.4, -13.4, 0), 0);
      if (t < tl) { holdUp(pl, t); pl.face('determined', t); } else { pl.pose('crossArms', t); pl.face('smug', 0.5); }
      moveCam(ctx, { pos: L(-11.6, 1.0, 1.0), look: L(-15.6, 2.6, 8.0), fov: 62 }, { pos: L(-12.0, 1.0, 1.8), look: L(-15.6, 2.6, 8.0), fov: 60 }, lt / 2.2);
      pop(ctx, tl, 0.1, '#ffffff', 0.35);
      stamp(ctx, 'CLICK!', tl, { y: 0.27, size: 110, fill: '#ffd23f', stroke: '#1d1d22', rot: 0.08, x: 0.62 });
      tag(ctx, 'RULE 1: CHAIN IT', ctx.markers.r1 - 0.05, Infinity, { y: 0.11, size: 64, bg: 'rgba(40,110,200,0.93)' });
    },
  },
  {
    name: 'get out', start: 'b03.w8-0.12', set: 'town',
    setup(ctx) {
      const P = ctx.props;
      town(ctx, 'day', { hide: [1] });
      hs(ctx, P.herd[4], -15, -14, 0);
      put(ctx, 'pj4', V(), 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.herd[4], pj = ctx.cast.pj4, tj = ctx.time('b03.w8') + 0.1;
      const r = ease.outBack(clamp((t - tj + 0.25) / 0.6, 0, 1));
      hset(h, t, { rise: r * 0.85, glow: 0, smoke: 0.4, roll: 0.03 * Math.sin(t * 14) });
      const u = clamp((t - tj) / 0.75, 0, 1);
      const d0 = P.herd[4].userData.pt('door');
      const p = d0.clone().lerp(L(-14.2, 0.12, -6.4), u); p.y = lerp(d0.y, 0.12, u) + 2.4 * Math.sin(PI * u);
      pj.root.position.copy(p); pj.root.rotation.set(-0.5 * Math.sin(PI * u), L.yaw + 0.2, 0);
      if (u < 1) { pj.pose('surprised', 0.3, {}); pj.face('shocked', 0.4); } else { pj.pose('stunned', t, {}); pj.face('sweat', 0.4); }
      for (let i = 0; i < 4; i++) dustW(ctx, i, h.userData.foot(i), (t - tj + 0.2) / 1.0, 1.0);
      moveCam(ctx, { pos: L(-10.2, 1.4, 1.8), look: L(-14.6, 4.0, -9.5), fov: 64 }, { pos: L(-10.6, 1.3, 1.2), look: L(-14.6, 4.6, -9.5), fov: 62 }, lt / 1.6);
      shakeOn(ctx, [tj - 0.2], 0.4, 0.5, 4);
      tag(ctx, 'RULE 2: GET OUT', ctx.markers.r2 - 0.05, Infinity, { y: 0.11, size: 64, bg: 'rgba(200,40,40,0.93)' });
    },
  },
  {
    name: 'ring the bell', start: 'b03.w12-0.12', set: 'town',
    setup(ctx) {
      const P = ctx.props;
      town(ctx, 'day', { hide: [PIL] });
      hs(ctx, P.pil, -9, 1.0, PI / 2);
      put(ctx, 'pillay', V(), 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, pl = ctx.cast.pillay, tr = ctx.markers.r3;
      const ring = clamp((t - tr) / 0.12, 0, 1);
      hset(P.pil, t, { rise: 0.3, pitch: 0.06 + 0.03 * Math.sin(t * 3), glow: 0, smoke: 0.4, bell: ring * (0.8 + 0.2 * Math.sin(t * 20)), mode: t < tr ? 'walk' : 'stand', freq: 0.6, stride: 0.15, lift: 0.15, wag: ring * 0.6 });
      const bell = P.pil.userData.pt('bell');
      const pp = bell.clone().add(V(0.95, 0, 0.45)); pp.y = L(0, 0.12, 0).y;
      pl.root.position.copy(pp); pl.root.rotation.set(0, Math.atan2(bell.x - pp.x, bell.z - pp.z), 0);
      pl.pose('point', t, { lookAt: bell });
      const J = pl.joints, k = clamp((t - tr + 0.35) / 0.3, 0, 1);
      J.armR.rotation.x = lerp(-1.4, -1.85, k) + 0.15 * Math.sin(clamp(t - tr, 0, 0.3) * 30);
      pl.face(t < tr ? 'determined' : 'smug', 0.5);
      setCam(ctx, { pos: pp.clone().add(V(1.6, 1.5, -3.2)), look: bell.clone().add(V(0.3, -0.1, 0.4)), fov: 54 });
      if (t > tr) { const g = P.glow; ctx.add(g); g.position.copy(bell).add(V(0.2, 0, 0)); g.material.color.set('#fff27a'); g.scale.setScalar(2.4 * (1 + 0.15 * Math.sin(t * 25))); }
      pop(ctx, tr, 0.1, '#fff6c0', 0.3);
      stamp(ctx, 'DING!', tr, { y: 0.27, x: 0.4, size: 120, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.1 });
      tag(ctx, 'RULE 3: RING THE BELL', ctx.markers.r3 - 0.05, Infinity, { y: 0.11, size: 60, bg: 'rgba(230,160,0,0.95)' });
    },
  },
  {
    name: 'like a dog', start: 'b03.w23-0.12', set: 'town',
    setup(ctx) {
      const P = ctx.props;
      town(ctx, 'day', { hide: [PIL] });
      hs(ctx, P.pil, -6, 1.5, -PI / 2);
      put(ctx, 'pillay', V(), 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, pl = ctx.cast.pillay;
      const u = ease.inOutSine(clamp(lt / 1.1, 0, 1));
      const x = lerp(-4, -15, u), z = lerp(1.5, 12, ease.inOutSine(clamp((lt - 0.35) / 0.75, 0, 1)));
      place(P.pil, x, z, lerp(-PI / 2, -PI, ease.inOutSine(clamp((lt - 0.3) / 0.7, 0, 1))));
      hset(P.pil, t, { rise: 0.55, mode: u < 1 ? 'walk' : 'stand', freq: 2.6, stride: 0.5, lift: 0.5, wag: 1, glow: 0, smoke: 0.6, pitch: -0.05, bob: 0.25 });
      pl.root.position.copy(L(-17.6, 0.12, 4.9)); pl.root.rotation.set(0, L.yaw + yawTo(-17.6, 4.9, -14, -3), 0);
      pl.pose('clap', t, { lookAt: P.pil.userData.pt('door') }); pl.face('grin', 0.4);
      moveCam(ctx, { pos: L(-13.6, 2.0, -3.4), look: L(-16.2, 3.4, 7.5), fov: 62 }, { pos: L(-14.0, 1.9, -2.6), look: L(-16.2, 3.2, 7.5), fov: 60 }, ease.inOutSine(lt / 1.3));
      tag(ctx, 'RULE 3: RING THE BELL', -1, Infinity, { y: 0.11, size: 60, bg: 'rgba(230,160,0,0.95)', scale: 1 });
      stamp(ctx, 'GOOD HOUSE', ctx.markers.dog + 0.4, { y: 0.24, size: 96, fill: '#5bd65b', stroke: '#ffffff', rot: 0.06 });
    },
  },
  // ── b04 "Mrs. Mokoena overslept once. She woke up three towns away. Still in bed."
  {
    name: 'three towns away', start: 'b04-0.15', set: 'town',
    setup(ctx) { mokSetup(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, mk = ctx.cast.mokoena;
      mokTick(ctx, t);
      mk.pose('sit', t, { seatHeight: 0.5, hands: 'lap' }); mk.face('sleepy', 0.5);
      const f = V(Math.sin(MOK.yaw), 0, Math.cos(MOK.yaw)), r = V(f.z, 0, -f.x);
      const c0 = V(MOK.x, 0, MOK.z).addScaledVector(f, 24).addScaledVector(r, -6), c1 = V(MOK.x, 0, MOK.z).addScaledVector(f, 17).addScaledVector(r, -4.5);
      moveCam(ctx, { pos: L(c0.x, 3.4, c0.z), look: L(MOK.x, 3.2, MOK.z), fov: 50 }, { pos: L(c1.x, 2.6, c1.z), look: L(MOK.x, 2.6, MOK.z), fov: 48 }, ease.inOutSine(lt / 4.0));
      tag(ctx, '3 TOWNS AWAY', ctx.time('b04.w7') - 0.05, Infinity, { y: 0.12, size: 92, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  {
    name: 'still in bed', start: 'bed-0.12', set: 'town',
    setup(ctx) { mokSetup(ctx); },
    update(ctx, lt) {
      const t = ctx.t, mk = ctx.cast.mokoena;
      mokTick(ctx, t);
      mk.pose('stunned', t, { seated: true, seatHeight: 0.5 }); mk.face(lt < 0.35 ? 'sleepy' : 'squint', 0.5);
      const J = mk.joints; J.armR.rotation.set(-2.6, 0, 0.3); J.foreArmR.rotation.set(-0.6, 0, 0);
      setCam(ctx, faceCam(mk, 2.6, -0.9, 0.42, 36, -0.2), 1.0, '#fff0e0');
    },
  },
  // ── b05 "So last night, I fell asleep at my desk."
  {
    name: 'asleep at desk', start: 'b05-0.15', set: 'room',
    setup(ctx) { const R = room(ctx); const me = put(ctx, 'me', R(...RM.chair), R.yaw + PI / 2 - 0.35); earOn(ctx, me); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      sleepPose(me, t); me.face('sleepy', 0.05);
      P.frost.userData.set(clamp(0.1 + lt / 2.3, 0, 1)); P.monitor.userData.set(t, 1);
      P.posters.forEach((p) => p.userData.set(0));
      moveCam(ctx, { pos: R(2.15, 2.35, 1.3), look: R(0.6, 0.85, -1.5), fov: 58 }, { pos: R(2.0, 2.15, 0.7), look: R(0.8, 0.85, -1.5), fov: 54 }, ease.inOutSine(lt / 2.4), 1.0, '#9fb8ff', 6);
      const hp = scr(ctx, humanFace(me));
      ctx.fx.text('z z Z', { x: clamp(hp.x + 0.08, 0.2, 0.8), y: clamp(hp.y - 0.12 - 0.02 * Math.sin(t * 3), 0.1, 0.3), size: 64, fill: '#cfe2ff', stroke: '#1d1d22', rot: -0.15 });
    },
  },
  // ── b06 "I woke up because my room was... bouncing."
  {
    name: 'room bouncing', start: 'b06-0.12', set: 'room',
    setup(ctx) { const R = room(ctx); ctx.store.R0 = R; const me = put(ctx, 'me', R(...RM.chair), R.yaw + PI / 2 - 0.35); earOn(ctx, me); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, me = ctx.cast.me, R0 = ctx.store.R0;
      const R = roomBounce(ctx, bounceAt(t));
      me.root.position.copy(R(...RM.chair));
      sleepPose(me, t); me.face('sleepy', 0.05);
      P.frost.userData.set(1); P.monitor.userData.set(t, 1);
      P.posters.forEach((p, i) => p.userData.set(0.45 * Math.sin(t * 7.4 + i * 1.3)));
      setCam(ctx, { pos: R0(2.15, 2.25, 1.5), look: R0(0.3, 0.95, -1.4), fov: 62 }, 1.0, '#9fb8ff', 6);
      const ph = (t % 0.42) / 0.42; if (ph < 0.18) ctx.cam.shake(0.35 * (1 - ph / 0.18), t, 3);
    },
  },
  {
    name: 'eyes snap open', start: 'b06.w7-0.15', set: 'room',
    setup(ctx) { const R = room(ctx); const me = put(ctx, 'me', R(...RM.chair), R.yaw + PI / 2 - 0.55); earOn(ctx, me); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, me = ctx.cast.me, tw = ctx.time('b06.w7');
      const R = roomBounce(ctx, bounceAt(t) * 0.6);
      me.root.position.copy(R(...RM.chair));
      if (t < tw) { sleepPose(me, t); me.face('sleepy', 0.05); } else { sleepPose(me, t, Math.max(0, 1 - (t - tw) / 0.12)); me.face('shocked', 0.3); }
      P.monitor.userData.set(t, 1);
      const f = humanFace(me);
      setCam(ctx, { pos: f.clone().add(V(0.55, -0.2, 1.5)), look: f.clone().add(V(0, -0.34, 0)), fov: 40 }, 1.0, '#cfe0ff', 5);
      ctx.cam.punch([tw + 0.02], t, 0.12, 0.25); pop(ctx, tw, 0.1, '#ffffff', 0.25);
    },
  },
  // ── b07 HUSS ×3: out of the chair, onto the bed, onto the floor
  {
    name: 'huss thrown', start: H('b07', 0), set: 'room',
    setup(ctx) { const R = room(ctx); ctx.store.R0 = R; const me = put(ctx, 'me', R(...RM.chair), R.yaw + PI / 2 - 0.55); earOn(ctx, me); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, me = ctx.cast.me, h = hussHits(ctx, 'b07'), R0 = ctx.store.R0;
      const R = roomBounce(ctx, 0.25 * Math.exp(-Math.max(0, t - h[0]) * 6));
      const u = clamp((t - h[0] + 0.05) / 0.25, 0, 1);
      me.root.position.copy(R(RM.chair[0] - 0.5 * u, 0.9 * Math.sin(PI * Math.min(1, u * 0.8)), RM.chair[2] + 0.4 * u));
      me.root.rotation.set(-0.5 * u, R0.yaw + PI / 2 - 0.55, 0.4 * u, 'YXZ');
      me.pose('surprised', 0.25, {}); me.face('shocked', 0.3);
      P.posters.forEach((p, i) => p.userData.set(0.6 * Math.sin(t * 9 + i)));
      setCam(ctx, { pos: R0(0.2, 0.9, 1.6), look: R0(1.3, 1.5, -1.3), fov: 62 }, 1.0, '#cfe0ff', 6);
      ctx.cam.punch(h, t, 0.1, 0.2); shakeOn(ctx, h, 0.8, 0.3, 2);
    },
  },
  {
    name: 'huss bed', start: H('b07', 1), set: 'room',
    setup(ctx) { const R = room(ctx); ctx.store.R0 = R; const me = put(ctx, 'me', R(...RM.bed), R.yaw); earOn(ctx, me); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, h = hussHits(ctx, 'b07'), R0 = ctx.store.R0;
      const R = roomBounce(ctx, 0.2 * Math.exp(-Math.max(0, t - h[1]) * 6));
      const d = Math.max(0, t - h[1]), by = 0.45 * Math.abs(Math.sin(d * 9)) * Math.exp(-d * 3);
      me.root.position.copy(R(RM.bed[0], RM.bed[1] + by, RM.bed[2] + 0.1));
      me.pose('crowdSurf', t, { lift: 0.12 }); me.face('shocked', 0.3);
      setCam(ctx, { pos: R0(-1.45, 2.3, 0.1), look: R0(-1.95, 0.75, -1.35), fov: 52 }, 1.0, '#cfe0ff', 6);
      ctx.cam.punch(h, t, 0.1, 0.2); shakeOn(ctx, h, 0.8, 0.3, 5);
    },
  },
  {
    name: 'huss floor', start: H('b07', 2), set: 'room',
    setup(ctx) { const R = room(ctx); ctx.store.R0 = R; const me = put(ctx, 'me', R(0.3, 0.0, 0.6), R.yaw + 0.3); earOn(ctx, me); ctx.add(ctx.props.stars); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, me = ctx.cast.me, h = hussHits(ctx, 'b07'), R0 = ctx.store.R0;
      const R = roomBounce(ctx, 0.2 * Math.exp(-Math.max(0, t - h[2]) * 6));
      me.root.position.copy(R(0.3, 0.02, 0.6));
      me.pose('crowdSurf', t * 0.3, { lift: 0.05, intensity: 0.2 }); me.face('shocked', 0.3);
      const hd = humanFace(me);
      P.stars.position.copy(hd).add(V(0, 0.35, 0)); P.stars.userData.set(t, 1);
      setCam(ctx, { pos: hd.clone().add(V(0.35, 1.25, 1.05)), look: hd.clone().add(V(0, -0.1, -0.2)), fov: 46 }, 0.8, '#cfe0ff', 6);
      ctx.cam.punch(h, t, 0.1, 0.2); shakeOn(ctx, h, 0.8, 0.3, 8);
    },
  },
  // ── b08 "I looked out the window. My house was running down Main Street."
  {
    name: 'look out window', start: 'b08-0.15', set: 'town',
    setup(ctx) { nightTown(ctx); hs(ctx, ctx.props.home, 6, 0.6, -PI / 2); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const t = ctx.t, h = ctx.props.home, me = ctx.cast.me;
      place(h, 6 - 11 * lt, 0.6, -PI / 2);
      hset(h, t, { ...gait(11), glow: 0.9, bayLight: 1, porch: 1, smoke: 0.8, smokeDrift: 4 });
      inBay(ctx, me, h, -0.34, -0.1); me.pose('idle', t, { headPitch: -0.05, headYaw: -0.25 }); me.face('shocked', 0.3);
      const J = me.joints; J.armL.rotation.set(-1.9, 0, -0.3); J.foreArmL.rotation.set(-0.5, 0, 0);
      const c = houseCam(h, [0.5, 4.3, 3.5 - 1.35], [0.1, 4.05, 3.5 + 10], 70);
      setCam(ctx, c, 0.5, '#ffd8b0', 4);
    },
  },
  {
    name: 'gallop main street', start: 'b08.w5-0.15', set: 'town',
    setup(ctx) { nightTown(ctx); hs(ctx, ctx.props.home, 4, 1.0, -PI / 2); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, h = ctx.props.home, me = ctx.cast.me;
      const x = 4 - 11.5 * lt;
      place(h, x, 1.0, -PI / 2);
      const g = gait(11.5); hset(h, t, { ...g, glow: 0.9, bayLight: 1, porch: 1, smoke: 0.8, smokeDrift: 4 });
      inBay(ctx, me, h, 0, 0.05); pressGlass(me, t); me.face('shocked', 0.4);
      for (let i = 0; i < 4; i++) { const u = ((t * g.freq + [0, 0.12, 0.5, 0.62][i] + 0.5) % 1); dustW(ctx, i, h.userData.foot(i), u * 1.3, 0.9); }
      setCam(ctx, { pos: L(-30, 1.0, -2.6), look: L(x - 2, 5.0, 0.8), fov: 58 }, 2.0, '#d8c8ff', 30);
      key(ctx, L(x - 9, 7, -5), 1.0, '#c8b0ff', 30);
      ctx.cam.shake(0.12, t, 2);
    },
  },
  // ── b09 "It wasn't alone. Every house in town was running, like a herd."
  {
    name: 'not alone', start: 'b09-0.12', set: 'town',
    setup(ctx) {
      nightTown(ctx);
      const P = ctx.props;
      ctx.store.pack = [[P.home, 1.0, 0], [P.herd[0], -13, 4], [P.herd[1], -12, -12], [P.herd[2], -1.5, 15], [P.herd[3], -14, 19], [P.herd[4], 0.5, -15], [P.pil, -12.5, 31]];
      ctx.store.pack.forEach(([h]) => hs(ctx, h, 0, 0, -PI / 2));
      put(ctx, 'me', V(), 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      const x0 = -6 - 11 * lt;
      ctx.store.pack.forEach(([h, z, dx], i) => { place(h, x0 + dx, z, -PI / 2 + 0.03 * Math.sin(t * 2 + i)); hset(h, t + i * 0.17, { ...gait(11), glow: 0.75, glowColor: '#ffd27a', bayLight: 1, porch: 0.8, smoke: 0.8, smokeDrift: 4, frost: 0.8 }); });
      inBay(ctx, me, ctx.props.home, 0, 0.05); pressGlass(me, t); me.face('shocked', 0.4);
      const k = ease.inOutCubic(clamp((lt - 0.15) / 0.9, 0, 1));
      moveCam(ctx, { pos: L(x0 + 2, 4.2, 9.5), look: L(x0 - 1, 5.0, 1), fov: 54 }, { pos: L(x0 + 22, 21, 30), look: L(x0 + 2, 3, -2), fov: 56 }, k, 1.5, '#d8c8ff', 30);
      key(ctx, L(x0 + 8, 18, 14), 1.4, '#c8b0ff', 60);
      tag(ctx, 'NOT ALONE', ctx.time('b09.w2') - 0.05, Infinity, { y: 0.1, size: 70, bg: 'rgba(110,40,180,0.9)' });
    },
  },
  {
    name: 'herd drone', start: 'b09.w3-0.15', set: 'town',
    setup(ctx) {
      nightTown(ctx);
      const P = ctx.props;
      ctx.store.circ = [[P.herd[0], 13, 0], [P.herd[1], 13, PI], [P.herd[2], 21, 0.8], [P.herd[3], 21, 0.8 + 2.1], [P.herd[4], 21, 0.8 + 4.2], [P.herd[5], 29, 0.3], [P.herd[6], 29, 2.4], [P.pil, 29, 4.5], [P.home, 37, 1.2]];
      ctx.store.circ.forEach(([h]) => hs(ctx, h, 0, 0, 0));
      put(ctx, 'pigeon', V(), 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, pg = ctx.cast.pigeon;
      ctx.store.circ.forEach(([h, r, a0], i) => {
        const w = 10 / r, a = a0 + w * t;
        const x = TOWER.x + Math.cos(a) * r, z = TOWER.z + Math.sin(a) * r;
        place(h, x, z, Math.atan2(-Math.sin(a), Math.cos(a)) + 0);
        hset(h, t + i * 0.21, { ...gait(10), glow: 0.7, porch: 0.7, smoke: 1, smokeDrift: 3, bayLight: 1, frost: 0.8, roll: -0.06 });
        if (i < 4) { const u = ((t * 1.9 + i * 0.37) % 1); dustW(ctx, i, h.userData.foot(i % 4), u * 1.2, 2.2); }
      });
      const hp = ctx.store.circ[2][0]; pg.root.position.copy(hp.userData.pt('ridge')); pg.root.quaternion.copy(hp.userData.quat()); pg.pose('flap', t); pg.face('grin', t);
      const k = ease.inOutSine(clamp(lt / 1.5, 0, 1));
      moveCam(ctx, { pos: L(-22, 36, 34), look: L(-51, 2, 0), fov: 56 }, { pos: L(-26, 30, 30), look: L(-51, 3, 1), fov: 54 }, k, 0);
      key(ctx, L(-51, 30, 10), 2.0, '#d0b8ff', 80);
    },
  },
  {
    name: 'pigeon rider', start: 'b09.w11-0.15', set: 'town',
    setup(ctx) {
      nightTown(ctx);
      const P = ctx.props;
      ctx.store.pack = [[P.herd[2], -1, 0], [P.herd[3], -13, 14], [P.herd[0], 12, 12], [P.herd[1], 0, 26]];
      ctx.store.pack.forEach(([h]) => hs(ctx, h, 0, 0, -PI / 2));
      put(ctx, 'pigeon', V(), 0);
    },
    update(ctx, lt) {
      const t = ctx.t, pg = ctx.cast.pigeon;
      const x0 = 10 - 11 * lt;
      ctx.store.pack.forEach(([h, z, dx], i) => { place(h, x0 + dx, z, -PI / 2); hset(h, t + i * 0.23, { ...gait(11), glow: 0.75, porch: 0.8, smoke: 0.9, smokeDrift: 4, frost: 0.8 }); });
      const h = ctx.store.pack[0][0], D = h.userData.dims;
      pg.root.position.copy(hb(h, 1.6, D.H + D.rh + 0.12, 0)); pg.root.quaternion.copy(h.userData.quat());
      pg.pose('flap', t, { speed: 1.4 }); pg.face('grin', t);
      setCam(ctx, houseCam(h, [2.05, D.H + D.rh + 0.62, 1.35], [1.5, D.H + D.rh + 0.32, -0.4], 52), 1.6, '#e0d0ff', 6);
      tag(ctx, 'LIKE A HERD', ctx.time('b09.w11') - 0.05, Infinity, { y: 0.1, size: 70, bg: 'rgba(110,40,180,0.9)' });
    },
  },
  // ── b10 "Mr. Pillay's house dragged its lamp post along."
  {
    name: 'pillay gallops', start: 'b10-0.12', set: 'town',
    setup(ctx) { nightTown(ctx, { lamps: [1] }); const P = ctx.props; hs(ctx, P.pil, 0, 1.5, -PI / 2); ctx.add(P.chain); addTo(ctx, P.lamp, 0, 0, 0); P.sparks.forEach((s) => addTo(ctx, s, 0, 0, 0)); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      const x = 14 - 11 * lt;
      place(P.pil, x, 1.5, -PI / 2);
      hset(P.pil, t, { ...gait(11), glow: 0.6, porch: 0.6, smoke: 0.9, smokeDrift: 4, frost: 0.6 });
      dragLamp(ctx, t, x + 10.5, 1.8);
      setCam(ctx, { pos: L(x + 6.5, 3.2, 25), look: L(x + 5.5, 3.8, 1.5), fov: 58 }, 0);
      key(ctx, L(x - 4, 9, 9), 1.2, '#c8b0ff', 40);
      ctx.cam.shake(0.1, t, 3);
    },
  },
  {
    name: 'dragged lamp', start: 'b10.w3-0.1', set: 'town',
    setup(ctx) { nightTown(ctx, { lamps: [1] }); const P = ctx.props; hs(ctx, P.pil, 0, 1.5, -PI / 2); ctx.add(P.chain); addTo(ctx, P.lamp, 0, 0, 0); P.sparks.forEach((s) => addTo(ctx, s, 0, 0, 0)); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      const x = -4 - 11 * lt, lx = x + 10.5;
      place(P.pil, x, 1.5, -PI / 2);
      hset(P.pil, t, { ...gait(11), glow: 0.6, porch: 0.6, smoke: 0.9, smokeDrift: 4, frost: 0.6 });
      dragLamp(ctx, t, lx, 1.8);
      setCam(ctx, { pos: L(lx + 1.2, 1.5, 6.2), look: L(lx + 0.6, 0.8, 1.8), fov: 60 }, 1.6, '#ffd8b0', 12);
      key(ctx, L(lx, 4, 6), 1.2, '#ffb060', 20);
      ctx.cam.shake(0.25, t, 6);
      speedLines(ctx, 0.6, 1);
    },
  },
  // ── b11 "While he's out partying, by the way."
  {
    name: 'pillay partying', start: 'b11-0.12', set: 'town',
    setup(ctx) { partySquare(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      partyTick(ctx, t, lt);
      moveCam(ctx, { pos: L(40.5, 3.0, 4.0), look: L(51.5, 5.2, -0.6), fov: 56 }, { pos: L(41.5, 2.9, 3.6), look: L(51.5, 5.4, -0.6), fov: 54 }, lt / 1.2, 1.2, '#ffd0f0', 14);
    },
  },
  {
    name: 'by the way', start: 'b11.w4-0.12', set: 'town',
    setup(ctx) { partySquare(ctx); },
    update(ctx, lt) {
      const t = ctx.t, pl = ctx.cast.pillay, tw = ctx.time('b11.w6');
      partyTick(ctx, t, lt + 1.1);
      const k = ease.outCubic(clamp(lt / 0.16, 0, 1));
      const c = faceCam(pl, 4.2 - 0.9 * k, 0.35, 0.55, 36);
      setCam(ctx, c, 1.3, '#ffd0f0', 8);
      ctx.cam.punch([tw + 0.02], t, 0.12, 0.3); shakeOn(ctx, [tw + 0.02], 0.7, 0.4, 4);
      stamp(ctx, 'BY THE WAY', ctx.time('b11.w4') - 0.02, { y: 0.085, size: 104, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.06 });
    },
  },
  // ── b12 "They ran past the edge of town, into a field, and stopped in a circle."
  {
    name: 'edge of town', start: 'b12-0.12', set: 'town',
    setup(ctx) {
      fieldNight(ctx);
      const P = ctx.props;
      ctx.store.run = [[P.home, -14, 0], [P.herd[0], -26, 7], [P.herd[1], -2, 5], [P.herd[2], -20, 15], [P.herd[3], -6, 17], [P.pil, -30, 21], [P.herd[4], 4, 24]];
      ctx.store.run.forEach(([h]) => hs(ctx, h, 0, 0, PI));
      addTo(ctx, P.sign2, -8.5, 0, -52, PI - 0.4);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      fieldTick(ctx, t);
      ctx.store.run.forEach(([h, x, dz], i) => { const z = -18 - 9 * lt - dz * 0.6; place(h, x, z, PI); hset(h, t + i * 0.19, { ...gait(9), glow: 0.6, porch: 0.6, smoke: 0.9, smokeDrift: 4, bayLight: 1, frost: 0.6 }); });
      setCam(ctx, { pos: L(-3, 1.3, -60), look: L(-12, 5.5, -26), fov: 56 }, 1.4, '#d8c8ff', 30);
      key(ctx, L(-12, 14, -55), 2.0, '#c8a8ff', 60);
      ctx.cam.shake(0.08, t, 2);
    },
  },
  {
    name: 'ring settle', start: 'b12.w11-0.15', set: 'town',
    setup(ctx) { fieldNight(ctx); ctx.store.ring = fieldRing(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, t0 = ctx.time('b12.w11') - 0.6;
      fieldTick(ctx, t);
      ctx.store.ring.forEach((h, i) => {
        const s = ringSlot(i), sx = FIELD.x + (i - 4) * 5, sz = FIELD.z + 40 + (i % 3) * 6;
        const u = ease.outCubic(clamp((t - t0 - i * 0.04) / 1.1, 0, 1));
        const x = lerp(sx, s.x, u), z = lerp(sz, s.z, u);
        const yRun = Math.atan2(s.x - sx, s.z - sz);
        place(h, x, z, lerp(yRun, yRun + angDiff(yRun, s.yaw), clamp((u - 0.6) / 0.4, 0, 1)));
        const fold = clamp((t - t0 - 1.05 - i * 0.04) / 0.35, 0, 1);
        hset(h, t + i * 0.13, { ...gait(u < 1 ? 9 * (1 - u) + 1 : 0.01, u < 1 ? 'gallop' : 'stand'), rise: 1 - 0.92 * ease.inOutSine(fold), glow: 0.5, porch: 0.5, smoke: 0.8, bayLight: 1, frost: 0.5 });
      });
      moveCam(ctx, { pos: L(FIELD.x + 6, 42, FIELD.z + 34), look: L(FIELD.x, 0, FIELD.z - 2), fov: 54 }, { pos: L(FIELD.x + 5, 34, FIELD.z + 28), look: L(FIELD.x, 0, FIELD.z - 1), fov: 54 }, ease.inOutSine(lt / 1.4));
      key(ctx, L(FIELD.x, 20, FIELD.z), 2.4, '#c8a8ff', 70);
    },
  },
  // ── b13 "Then they all started... humming."
  {
    name: 'humming', start: 'b13-0.12', set: 'town',
    setup(ctx) { fieldNight(ctx); ctx.store.ring = fieldRing(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, th = ctx.time('b13.w4') - 0.3;
      fieldTick(ctx, t);
      const on = clamp((t - th) / 0.5, 0, 1), p = hum(t);
      ctx.store.ring.forEach((h, i) => hset(h, t, { rise: 0.08, glow: lerp(0.45, 0.55 + 0.45 * p, on), glowColor: on > 0 ? '#c77dff' : '#ffd27a', halo: on * (0.5 + 0.6 * p), porch: 0.4, smoke: 0.6 + 0.4 * on, bayLight: 0.6, frost: 0.5, roll: on * 0.012 * Math.sin(t * 40 + i) }));
      const a = lerp(PI - 0.45, PI + 0.2, ease.inOutSine(clamp(lt / 2.1, 0, 1)));
      const c = { pos: L(FIELD.x + Math.sin(a) * 4.5, 3.2, FIELD.z + Math.cos(a) * 4.5), look: L(FIELD.x + Math.sin(a + PI) * 16, 4.6, FIELD.z + Math.cos(a + PI) * 16), fov: 70 };
      setCam(ctx, c, 0.4, '#d8b8ff', 20);
      key(ctx, L(FIELD.x, 3, FIELD.z), 0.5 + 1.0 * on * p, '#b070ff', 40);
      ctx.fx.overlay('#8a2be2', 0.07 + 0.06 * on * p);
    },
  },
  // ── b14 "School was at eight. I needed my house home."
  {
    name: 'alarm clock', start: 'b14-0.12', set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); const me = put(ctx, 'me', V(), 0); clockInHands(ctx, me); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, me = ctx.cast.me, h = P.home;
      ringHum(ctx, t);
      inBay(ctx, me, h, 0, 0.12); holdUp(me, t); me.face('sweat', 0.3); clockTick(ctx, me);
      P.clock.userData.set(t, 1);
      const cp = P.clock.getWorldPosition(V()), fw = V(0, 0, 1).applyQuaternion(h.userData.quat());
      setCam(ctx, { pos: cp.clone().addScaledVector(fw, 0.95 - 0.12 * lt).add(V(0, 0.08, 0)), look: cp.clone().add(V(0, -0.12, 0)), fov: 40 }, 0.3, '#e8d0ff', 4);
      pop(ctx, ctx.time('b14.w3'), 0.1, '#ffffff', 0.25);
      tag(ctx, 'SCHOOL IN 2 HOURS', ctx.time('b14') + 0.05, Infinity, { y: 0.12, size: 70, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  {
    name: 'sweating at window', start: 'b14.w4-0.15', set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); const me = put(ctx, 'me', V(), 0); clockInHands(ctx, me); ctx.add(ctx.props.sweat, me.joints.head); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, me = ctx.cast.me, h = P.home;
      ringHum(ctx, t);
      inBay(ctx, me, h, 0, 0.05); holdUp(me, t); me.face('sweat', 0.3); clockTick(ctx, me);
      P.clock.userData.set(t, 0.6);
      P.sweat.position.set(0.36, 0.5 - 0.1 * ((t * 1.4) % 1), 0.2);
      const k = ease.inOutSine(clamp(lt / 1.4, 0, 1));
      setCam(ctx, houseCam(h, [0.75 - 0.3 * k, 3.75, 3.5 + 3.0 - 0.8 * k], [0.05, 3.85, 3.5], 38), 0.35, '#e0c0ff', 6);
      tag(ctx, 'SCHOOL IN 2 HOURS', -1, Infinity, { y: 0.1, size: 62, bg: 'rgba(200,0,40,0.9)', scale: 1 });
    },
  },
  // ── b15 "Then I remembered rule three. The doorbell."
  {
    name: 'rule three', start: 'b15-0.12', set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); put(ctx, 'me', V(), 0); ctx.add(ctx.props.bulb); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, me = ctx.cast.me, h = P.home, tb = ctx.time('b15.w3');
      ringHum(ctx, t);
      inBay(ctx, me, h, 0.1, 0.05); me.pose('think', t); me.face(t < tb ? 'determined' : 'grin', 0.3);
      const k = t < tb ? 0 : ease.outBack(clamp((t - tb) / 0.25, 0, 1));
      P.bulb.position.copy(hb(h, 0.55, 5.35, 3.5 + 0.45)); P.bulb.userData.set(k * 1.1);
      setCam(ctx, houseCam(h, [-1.0, 3.75, 3.5 + 3.2], [0.05, 4.15, 3.5], 42), 0.35, '#e0c0ff', 6);
      tag(ctx, 'RULE 3: RING THE BELL', tb - 0.05, Infinity, { y: 0.1, size: 60, bg: 'rgba(230,160,0,0.95)' });
    },
  },
  {
    name: 'doorbell glows', start: 'b15.w5-0.12', set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, h = P.home, tb = ctx.time('b15.w6');
      ringHum(ctx, t, { bell: clamp((t - tb) / 0.15, 0, 1) * (0.85 + 0.15 * Math.sin(t * 14)) });
      const k = ease.inOutSine(clamp(lt / 0.9, 0, 1));
      setCam(ctx, houseCam(h, [2.1 - 0.5 * k, 1.35, 3.5 + 2.0 - 0.7 * k], [0.8, 1.2, 3.5], 42), 0.3, '#e0c0ff', 6);
      pop(ctx, tb, 0.1, '#fff6c0', 0.25);
    },
  },
  // ── b16 "So I hung off the porch and pressed it."
  {
    name: 'hang off porch', start: 'b16-0.12', set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, h = P.home, me = ctx.cast.me;
      ringHum(ctx, t, { bell: 0.8 + 0.2 * Math.sin(t * 14) });
      const reach = ease.inOutSine(clamp(lt / 0.9, 0, 1));
      hangAt(ctx, me, h, t, reach, 0);
      me.face('determined', 0.3);
      setCam(ctx, houseCam(h, [3.4, 1.6, 3.5 + 4.2], [0.6, 1.75, 3.5 + 0.4], 48), 0.45, '#e8d0ff', 8);
    },
  },
  {
    name: 'press', start: 'press-0.1', set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); put(ctx, 'me', V(), 0); addTo(ctx, ctx.props.shock, 0, 0, 0); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, h = P.home, me = ctx.cast.me, tp = ctx.markers.press;
      const hit = clamp((t - tp) / 0.06, 0, 1);
      ringHum(ctx, t, { bell: 0.8 + 0.6 * hit });
      hangAt(ctx, me, h, t, 1, hit);
      me.face(t < tp ? 'determined' : 'huss', 0.3);
      const bell = h.userData.pt('bell');
      const S = P.shock; S.position.copy(bell); S.quaternion.copy(h.userData.quat()); S.userData.set(clamp((t - tp) / 0.5, 0, 1));
      setCam(ctx, houseCam(h, [1.85, 1.55, 3.5 + 1.35], [0.9, 1.3, 3.5 + 0.1], 42), 0.3, '#e8d0ff', 5);
      ctx.cam.punch([tp + 0.02], t, 0.14, 0.25);
      pop(ctx, tp, 0.12, '#fff6c0', 0.4);
      stamp(ctx, 'DING!', tp, { y: 0.2, x: 0.62, size: 130, fill: '#ffd23f', stroke: '#1d1d22', rot: 0.1 });
    },
  },
  // ── b17 HUSS ×6: the house whips round, scrambles and bolts out of the ring
  {
    name: 'huss jolt', start: H('b17', 0), set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, hh = hussHits(ctx, 'b17');
      ringHum(ctx, t, { skip: [0] });
      const r = ease.outBack(clamp((t - hh[0] + 0.02) / 0.22, 0, 1));
      hset(h, t, { rise: 0.08 + 0.92 * r, glow: 0.9, glowColor: '#ffd27a', porch: 1, smoke: 1, bayLight: 1, bell: 1, roll: 0.05 * Math.sin(t * 30) });
      for (let i = 0; i < 4; i++) dustW(ctx, i, h.userData.foot(i), (t - hh[0]) / 0.8, 1.6);
      const s = ringSlot(0), f = V(Math.sin(s.yaw), 0, Math.cos(s.yaw));
      setCam(ctx, { pos: L(s.x + f.x * 10 + 2, 0.6, s.z + f.z * 10), look: L(s.x, 6, s.z), fov: 64 }, 1.4, '#e8d0ff', 30);
      ctx.cam.punch(hh, t, 0.1, 0.2); shakeOn(ctx, hh, 0.9, 0.3, 2);
    },
  },
  {
    name: 'huss whip', start: H('b17', 1), set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, hh = hussHits(ctx, 'b17');
      ringHum(ctx, t, { skip: [0] });
      const s = ringSlot(0), u = ease.inOutCubic(clamp((t - hh[1] + 0.05) / 0.22, 0, 1));
      place(h, s.x, s.z, s.yaw + PI * u);
      hset(h, t, { ...gait(8, 'scramble'), glow: 0.9, glowColor: '#ffd27a', porch: 1, smoke: 1, bayLight: 1, roll: 0.08 * Math.sin(t * 25) });
      setCam(ctx, { pos: L(s.x - 9, 16, s.z - 12), look: L(s.x, 3, s.z), fov: 52 }, 0);
      ctx.cam.punch(hh, t, 0.1, 0.2); shakeOn(ctx, hh, 0.9, 0.3, 4);
      if (lt < 0.15) ctx.fx.overlay('#ffffff', 0.12 * (1 - lt / 0.15));
    },
  },
  {
    name: 'huss scramble', start: H('b17', 2), set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, hh = hussHits(ctx, 'b17');
      ringHum(ctx, t, { skip: [0] });
      const s = ringSlot(0);
      place(h, s.x, s.z + 0.4 * lt, s.yaw + PI);
      hset(h, t, { ...gait(9, 'scramble'), freq: 4.5, glow: 0.9, glowColor: '#ffd27a', porch: 1, smoke: 1, bayLight: 1 });
      for (let i = 0; i < 4; i++) { const u = ((t * 4.5 + [0, 0.41, 0.73, 0.19][i] + 0.5) % 1); dustW(ctx, i, h.userData.foot(i), u * 1.2, 1.3); }
      setCam(ctx, { pos: L(s.x + 5.5, 0.7, s.z + 3.5), look: L(s.x + 1, 1.6, s.z + 0.5), fov: 58 }, 1.2, '#e8d0ff', 20);
      ctx.cam.punch(hh, t, 0.1, 0.2); shakeOn(ctx, hh, 0.9, 0.3, 6);
    },
  },
  {
    name: 'huss cling', start: H('b17', 3), set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, h = P.home, me = ctx.cast.me, hh = hussHits(ctx, 'b17');
      ringHum(ctx, t, { skip: [0] });
      const s = ringSlot(0);
      place(h, s.x, s.z + 0.4, s.yaw + PI);
      hset(h, t, { rise: 0.55, mode: 'scramble', freq: 4.5, stride: 0.5, lift: 0.5, glow: 0.9, glowColor: '#ffd27a', porch: 1, smoke: 1, bayLight: 1 });
      const hd = h.userData.pt('handle');
      me.root.quaternion.copy(h.userData.quat()); me.root.position.copy(hd).add(V(0, -1.9, 0)).addScaledVector(V(0, 0, 1).applyQuaternion(me.root.quaternion), 0.25);
      me.pose('surprised', 0.3, {}); const J = me.joints; J.armR.rotation.set(-2.9, 0, 0.3); J.foreArmR.rotation.set(-0.1, 0, 0); J.legL.rotation.x = 0.4 * Math.sin(t * 20); J.legR.rotation.x = -0.4 * Math.sin(t * 20);
      me.face('shocked', 0.3);
      setCam(ctx, faceCam(me, 2.2, 0.5, 0.36, 36), 1.4, '#ffe0c0', 6);
      ctx.cam.punch(hh, t, 0.1, 0.2); shakeOn(ctx, hh, 0.7, 0.3, 8);
    },
  },
  {
    name: 'huss bolt', start: H('b17', 4), set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, hh = hussHits(ctx, 'b17');
      ringHum(ctx, t, { skip: [0] });
      skyMood2(ctx, 'purple', 'dawn', 0.25);
      const s = ringSlot(0), z = s.z + 2 + 12 * lt;
      place(h, s.x, z, 0);
      hset(h, t, { ...gait(12), glow: 0.9, glowColor: '#ffd27a', porch: 1, smoke: 1, smokeDrift: 4, bayLight: 1 });
      for (let i = 0; i < 4; i++) { const u = ((t * gait(12).freq + [0, 0.12, 0.5, 0.62][i] + 0.5) % 1); dustW(ctx, i, h.userData.foot(i), u * 1.2, 1.4); }
      setCam(ctx, { pos: L(s.x - 13, 1.4, s.z + 4.5), look: L(s.x, 5.0, s.z + 2.5), fov: 62 }, 0.6, '#ffd8c0', 30);
      ctx.cam.punch(hh, t, 0.1, 0.2); shakeOn(ctx, hh, 0.8, 0.3, 9);
    },
  },
  {
    name: 'huss sunrise', start: H('b17', 5), set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.6 }); ctx.store.ring = fieldRing(ctx); ctx.add(ctx.props.sun); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, hh = hussHits(ctx, 'b17');
      ringHum(ctx, t, { skip: [0] });
      skyMood2(ctx, 'purple', 'dawn', 0.45 + 0.4 * clamp(lt / 0.5, 0, 1));
      const s = ringSlot(0), z = s.z + 8 + 12 * lt;
      place(h, s.x, z, 0);
      hset(h, t, { ...gait(12), glow: 0.9, glowColor: '#ffd27a', porch: 1, smoke: 1, smokeDrift: 4, bayLight: 1 });
      P.sun.position.copy(L(60, 14, 160)); P.sun.material.opacity = 0.9;
      setCam(ctx, { pos: L(s.x - 2, 9.5, s.z - 20), look: L(s.x + 2, 4.5, s.z + 30), fov: 56 }, 0);
      ctx.cam.punch(hh, t, 0.1, 0.2); shakeOn(ctx, hh, 0.8, 0.3, 11);
    },
  },
  // ── b18 "It sprinted home so fast I flapped behind it like a flag."
  {
    name: 'sprint home', start: 'b18-0.12', set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.5, exposure: 1.1 }); ctx.add(ctx.props.sun); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, me = ctx.cast.me;
      fieldTick(ctx, t);
      skyMood2(ctx, 'dawn', 'sunrise', 0.2 + 0.5 * clamp(lt / 1.5, 0, 1));
      const x = -52 + 14 * lt, g = gait(14);
      place(h, x, -46, PI / 2);
      hset(h, t, { ...g, glow: 0.4, porch: 0.6, smoke: 1, smokeDrift: 5 });
      flagOn(ctx, me, h, t); me.face('shocked', 0.3);
      for (let i = 0; i < 4; i++) { const u = ((t * g.freq + [0, 0.12, 0.5, 0.62][i] + 0.5) % 1); dustW(ctx, i, h.userData.foot(i), u * 1.2, 1.6); }
      P.sun.position.copy(L(160, 16, -60)); P.sun.material.opacity = 0.9;
      setCam(ctx, { pos: L(x + 17, 2.2, -46 - 9), look: L(x, 5.0, -46), fov: 58 }, 0.5, '#ffd8c0', 30);
      ctx.cam.shake(0.15, t, 3); speedLines(ctx, 0.5, 1, 3);
    },
  },
  {
    name: 'like a flag', start: 'flag-0.12', set: 'town',
    setup(ctx) { fieldNight(ctx, { fog: 0.5, exposure: 1.05 }); ctx.add(ctx.props.sun); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, me = ctx.cast.me;
      fieldTick(ctx, t);
      skyMood2(ctx, 'dawn', 'sunrise', 0.75);
      const x = -30 + 14 * lt, g = gait(14);
      place(h, x, -46, PI / 2);
      hset(h, t, { ...g, glow: 0.3, porch: 0.5, smoke: 1, smokeDrift: 5 });
      flagOn(ctx, me, h, t);
      me.face('shocked', 0.3);
      const hd = h.userData.pt('backHandle');
      P.sun.position.copy(L(x + 150, 14, -60)); P.sun.material.opacity = 0.9;
      setCam(ctx, { pos: hd.clone().add(V(-1.8, 2.4, -6.2)), look: hd.clone().add(V(-1.4, -0.7, 0)), fov: 50 }, 0.8, '#ffe0c0', 10);
      ctx.cam.shake(0.18, t, 5); speedLines(ctx, 0.7, -1, 7);
    },
  },
  // ── b19 "The whole street went wild. Dingalo! Oba stomp! Oba roofi! Porchani!"
  {
    name: 'skid home', start: 'b19-0.12', set: 'town',
    setup(ctx) { sunriseStreet(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, ts = ctx.time('b19') + 0.9;
      skyMood(ctx, 'sunrise', 0.75);
      const u = clamp((t - ctx.time('b19') + 0.12) / 1.0, 0, 1), x = lerp(-2, -27, ease.outCubic(u));
      place(h, x, 2.2, -PI / 2);
      hset(h, t, { ...gait(u < 0.95 ? 12 * (1 - u) + 0.5 : 0.01, u < 0.95 ? 'gallop' : 'stand'), pitch: -0.12 * clamp((t - ts + 0.3) / 0.3, 0, 1) * (1 - clamp((t - ts) / 0.4, 0, 1)), glow: 0, smoke: 1 });
      dust(ctx, 0, -24.5, 0.2, 2.2, (t - ts + 0.3) / 1.0, 1.3); dust(ctx, 1, -30, 0.2, 3.5, (t - ts + 0.25) / 1.0, 1.1);
      crowdTick(ctx, t, ts);
      moveCam(ctx, { pos: L(-12, 2.0, -6.8), look: L(-22, 3.6, 3), fov: 62 }, { pos: L(-13, 1.9, -6.4), look: L(-24, 3.4, 3), fov: 60 }, lt / 1.5, 0);
      shakeOn(ctx, [ts], 0.5, 0.5, 3);
    },
  },
  {
    name: 'dingalo', start: 'dingalo-0.15', set: 'town',
    setup(ctx) { sunriseStreet(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home;
      skyMood(ctx, 'sunrise', 0.75);
      place(h, -27, 2.2, -PI / 2); hset(h, t, { rise: 1, glow: 0, smoke: 1, wag: 0.5 });
      crowdTick(ctx, t, -10);
      setCam(ctx, { pos: L(-17.2, 1.3, -2.8), look: L(-19.6, 1.7, 4.5), fov: 50 });
      ctx.cam.punch([ctx.markers.dingalo], t, 0.1, 0.25);
      stamp(ctx, 'DINGALO!', ctx.markers.dingalo - 0.02, { y: 0.18, size: 140, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.1 });
    },
  },
  {
    name: 'oba stomp', start: 'stomp-0.15', set: 'town',
    setup(ctx) { sunriseStreet(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, ts = ctx.markers.stomp;
      skyMood(ctx, 'sunrise', 0.75);
      const u = clamp((t - ts + 0.35) / 0.4, 0, 1);
      place(h, -27, 2.2, -PI / 2); hset(h, t, { rise: 1, glow: 0, smoke: 1, stomp: 1, stompU: u, roll: -0.04 * Math.sin(PI * u) });
      const f = h.userData.foot(1);
      dustW(ctx, 0, f, (t - ts - 0.05) / 0.9, 2.2);
      crowdTick(ctx, t, -10);
      setCam(ctx, { pos: L(-19.5, 0.7, -5.6), look: L(-29, 3.2, 1.0), fov: 60 });
      ctx.cam.punch([ts + 0.05], t, 0.12, 0.25); shakeOn(ctx, [ts + 0.05], 1.0, 0.45, 5);
      stamp(ctx, 'OBA STOMP!', ts - 0.02, { y: 0.17, size: 130, fill: '#ff7a2f', stroke: '#ffffff', rot: 0.08 });
    },
  },
  {
    name: 'oba roofi', start: 'roofi-0.15', set: 'town',
    setup(ctx) { sunriseStreet(ctx); put(ctx, 'pigeon', V(), 0); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, tr = ctx.markers.roofi, pg = ctx.cast.pigeon;
      skyMood(ctx, 'sunrise', 0.75);
      const d = t - tr, hop = d > 0 ? Math.abs(Math.sin(d * 9)) * Math.exp(-d * 2.5) : 0;
      place(h, -27, 2.2, -PI / 2); hset(h, t, { rise: 1 - 0.25 * (d < 0 ? clamp((d + 0.3) / 0.3, 0, 1) : 0), glow: 0, smoke: 1, bob: 0, roll: 0.08 * Math.sin(t * 18) * hop, pitch: 0.06 * hop });
      h.userData.body.position.y += 1.6 * hop;
      const D = h.userData.dims, rp = hb(h, -1.5, D.H + D.rh + 0.12, 0);
      const fl = clamp(d / 0.6, 0, 1); pg.root.position.copy(rp).add(V(0, 3.0 * fl, 0)); pg.root.quaternion.copy(h.userData.quat()); pg.pose(d > 0 ? 'flap' : 'idle', t); pg.face('shocked', t);
      crowdTick(ctx, t, -10);
      setCam(ctx, { pos: L(-13.5, 5.5, -12.5), look: L(-27, 10.5, 2.2), fov: 58 });
      ctx.cam.punch([tr + 0.03], t, 0.1, 0.25); shakeOn(ctx, [tr + 0.03], 0.7, 0.4, 2);
      stamp(ctx, 'OBA ROOFI!', tr - 0.02, { y: 0.14, size: 130, fill: '#3ee0c8', stroke: '#1d1d22', rot: -0.07 });
    },
  },
  {
    name: 'porchani', start: 'porch-0.12', set: 'town',
    setup(ctx) { sunriseStreet(ctx); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, h = P.home, me = ctx.cast.me, tp = ctx.markers.porch;
      skyMood(ctx, 'sunrise', 0.75);
      place(h, -27, 2.2, -PI / 2); hset(h, t, { rise: 0.35, glow: 0, smoke: 1, wag: 1, porch: 1 });
      const dp = h.userData.pt('door');
      me.root.position.copy(dp).add(V(-0.9, 0, -1.4)); me.root.position.y = L(0, 0, 0).y; me.root.rotation.set(0, L.yaw - PI / 2 + 0.9, 0);
      me.pose('cheer', t); me.face('grin', t);
      crowdTick(ctx, t, -10);
      setCam(ctx, { pos: L(-38.5, 1.7, -1.2), look: L(-31.5, 2.2, 1.5), fov: 54 });
      ctx.cam.punch([tp + 0.03], t, 0.1, 0.25);
      stamp(ctx, 'PORCHANI!', tp - 0.02, { y: 0.15, size: 130, fill: '#ff4fa3', stroke: '#ffffff', rot: 0.06 });
    },
  },
  // ── b20 "This morning, something tiny was following my house around."
  {
    name: 'morning garden', start: 'b20-0.12', set: 'town',
    setup(ctx) { garden(ctx); put(ctx, 'me', V(), 0); put(ctx, 'pigeon', V(), 0); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      gardenTick(ctx, t);
      me.root.position.copy(L(-24.2, 0, 8.2)); me.root.rotation.set(0, L.yaw + PI - 0.5, 0); me.pose('idle', t, { headPitch: -0.2 }); me.face('smile', t);
      const pg = ctx.cast.pigeon; pg.root.position.copy(L(-29.5, 0, 8.6)); pg.root.rotation.set(0, L.yaw + 1, 0); pg.pose('peck', t);
      hset(P.shed, t, {}); P.shed.visible = false;
      moveCam(ctx, { pos: L(-31.0, 2.4, -1.2), look: L(-27, 4.8, 12), fov: 62 }, { pos: L(-30.4, 2.2, 0.0), look: L(-27, 4.5, 12), fov: 58 }, ease.inOutSine(lt / 1.3));
    },
  },
  {
    name: 'peek', start: 'b20.w3-0.12', set: 'town',
    setup(ctx) { garden(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      gardenTick(ctx, t);
      const pk = ease.inOutSine(clamp((lt - 0.3) / 0.5, 0, 1)) * (1 - ease.inOutSine(clamp((lt - 1.5) / 0.4, 0, 1)) * 0.6);
      P.shed.visible = true; place(P.shed, -30.4 + 0.9 * pk, 16.9, PI - 0.5); hset(P.shed, t, { lean: 0.15 * pk, wobble: 0.4 });
      P.shed.rotation.z = -0.25 * pk;
      const k = ease.inOutSine(clamp(lt / 2.0, 0, 1));
      moveCam(ctx, { pos: L(-24.0, 1.0, 3.0), look: L(-29.8, 0.9, 16.5), fov: 50 }, { pos: L(-26.0, 0.8, 8.6), look: L(-29.9, 0.75, 16.6), fov: 40 }, k);
    },
  },
  // ── b21 HUSS ×3: tiny leg, tiny door, tiny chimney
  {
    name: 'huss tiny leg', start: H('b21', 0), set: 'town',
    setup(ctx) { garden(ctx); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, hh = hussHits(ctx, 'b21');
      gardenTick(ctx, t);
      shedAt(ctx, -27.6, 9.2, PI, t, { wobble: 0.8, smoke: 0.6 });
      const lp = P.shed.userData.pt('leg0');
      setCam(ctx, { pos: lp.clone().add(V(-0.55, 0.28, -1.25)), look: lp.clone().add(V(0.05, 0.12, 0)), fov: 40 }, 0.6, '#fff6e8', 4);
      ctx.cam.punch(hh, t, 0.12, 0.2); shakeOn(ctx, hh, 0.5, 0.25, 2);
    },
  },
  {
    name: 'huss tiny door', start: H('b21', 1), set: 'town',
    setup(ctx) { garden(ctx); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, hh = hussHits(ctx, 'b21');
      gardenTick(ctx, t);
      shedAt(ctx, -27.6, 9.2, PI, t, { wobble: 0.5, wag: 1, smoke: 0.6 });
      const dp = P.shed.userData.pt('door');
      setCam(ctx, { pos: dp.clone().add(V(0.15, 0.05, -1.05)), look: dp.clone().add(V(0, -0.1, 0)), fov: 36 }, 0.6, '#fff6e8', 4);
      ctx.cam.punch(hh, t, 0.12, 0.2); shakeOn(ctx, hh, 0.5, 0.25, 4);
    },
  },
  {
    name: 'huss tiny chimney', start: H('b21', 2), set: 'town',
    setup(ctx) { garden(ctx); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, hh = hussHits(ctx, 'b21');
      gardenTick(ctx, t);
      shedAt(ctx, -27.6, 9.2, PI, t, { wobble: 0.5, smoke: 1.0 });
      const cp = P.shed.userData.pt('chimney');
      setCam(ctx, { pos: cp.clone().add(V(0.45, -0.05, -1.1)), look: cp.clone().add(V(0, 0.12, 0)), fov: 42 }, 0.6, '#fff6e8', 4);
      ctx.cam.punch(hh, t, 0.12, 0.2); shakeOn(ctx, hh, 0.5, 0.25, 6);
    },
  },
  // ── b22 "A shed. On tiny legs. That's what the humming was. My house had a baby."
  {
    name: 'its a shed', start: 'b22-0.12', set: 'town',
    setup(ctx) { garden(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      gardenTick(ctx, t);
      const u = clamp(lt / 1.6, 0, 1);
      shedAt(ctx, -27.6 + 1.2 * Math.sin(u * PI * 2) * 0.3, 10.8 - 3.0 * u, PI + 0.3 * Math.sin(t * 3), t, { hop: 1, run: 0.6, freq: 2.2, wobble: 0.6, smoke: 0.8 });
      setCam(ctx, { pos: L(-26.0, 1.55, 5.2), look: L(-27.4, 0.75, 9.2), fov: 48 }, 0.5, '#fff6e8', 8);
      stamp(ctx, "IT'S A SHED!", ctx.markers.shed - 0.02, { y: 0.16, size: 120, fill: '#5bd65b', stroke: '#ffffff', rot: -0.08 });
    },
  },
  {
    name: 'puppy shed', start: 'b22.w5-0.12', set: 'town',
    setup(ctx) { garden(ctx); put(ctx, 'me', V(), 0); put(ctx, 'pigeon', V(), 0); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, pg = ctx.cast.pigeon;
      gardenTick(ctx, t);
      const a = t * 2.6, cx = -27.4, cz = 9.9, r = 1.9;
      shedAt(ctx, cx + Math.sin(a) * r, cz + Math.cos(a) * r, a + PI / 2, t, { run: 1, freq: 4, hop: 0.5, wobble: 0.6, smoke: 0.8 });
      const b = a + 0.9; pg.root.position.copy(L(cx + Math.sin(b) * r, 0, cz + Math.cos(b) * r)); pg.root.rotation.set(0, L.yaw + b + PI / 2, 0); pg.pose('strut', t, { speed: 2 }); pg.face('shocked', t);
      me.root.position.copy(L(-24.3, 0.12, 6.6)); me.root.rotation.set(0, L.yaw + PI + 0.55, 0); me.pose('stunned', t, { lookAt: P.shed.userData.pt('door') }); me.face('shocked', 0.3);
      setCam(ctx, { pos: L(-26.4, 1.7, 2.6), look: L(-26.4, 1.05, 8.6), fov: 54 }, 0.8, '#fff6e8', 8);
    },
  },
  {
    name: 'my house had a baby', start: 'baby-0.15', set: 'town',
    setup(ctx) { garden(ctx); put(ctx, 'me', V(), 0); addTo(ctx, ctx.props.gold, -27, 2, 9); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      const nz = ease.inOutSine(clamp(lt / 0.6, 0, 1));
      gardenTick(ctx, t, { crouch: 0.9 * nz, pitch: 0.2 * nz + 0.04 * Math.sin(t * 4) * nz });
      shedAt(ctx, -27.0, 9.0, PI, t, { hop: 0.6, wobble: 0.8, wag: 1, smoke: 1 });
      P.gold.userData.set(t, 0.9);
      me.root.position.copy(L(-24.6, 0.12, 6.4)); me.root.rotation.set(0, L.yaw + PI + 0.7, 0); me.pose('stunned', t, {}); me.face('shocked', 0.3);
      setCam(ctx, { pos: L(-28.6, 1.5, 2.0), look: L(-26.6, 2.0, 9.0), fov: 58 }, 1.0, '#fff6e8', 8);
      tag(ctx, 'IT\'S A BABY', ctx.markers.baby + 0.6, Infinity, { y: 0.12, size: 70, bg: 'rgba(255,90,160,0.92)' });
    },
  },
  // ── b23 "Mom says I have to walk it. And Mr. Pillay's house had twins."
  {
    name: 'walk it', start: 'b23-0.12', set: 'town',
    setup(ctx) { town(ctx, 'day', { hide: [HOME, PIL] }); const P = ctx.props; hs(ctx, P.home, -27, 14, PI); hs(ctx, P.pil, -15, 14, PI); hs(ctx, P.shed, 0, 0, 0); ctx.add(P.leash); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      hset(P.home, t, { rise: 0.72, smoke: 0.5 }); hset(P.pil, t, { rise: 0.7, smoke: 0.5 });
      const mx = -20.5 - 0.8 * lt;
      me.root.position.copy(L(mx, 0.12, 6.4)); me.root.rotation.set(0, L.yaw - PI / 2 + 0.15, 0);
      me.pose('walk', t, { speed: 0.9 }); me.face('neutral', 0.3);
      const J = me.joints; J.armR.rotation.set(-0.9, 0, 0.1); J.foreArmR.rotation.set(-0.3, 0, 0);
      const tug = 0.5 + 0.5 * Math.sin(t * 5);
      place(P.shed, mx - 2.3 - 0.25 * tug, 5.6 - 0.2 * tug, -PI / 2 - 0.5);
      hset(P.shed, t, { run: 1, freq: 5, hop: 0.2, lean: -0.25 - 0.1 * tug, wobble: 0.5, smoke: 0.6 });
      P.shed.position.y = 0.12;
      me.root.updateMatrixWorld(true);
      P.leash.userData.set(me.joints.handR.getWorldPosition(V()), P.shed.userData.pt('collar'), 0.08);
      setCam(ctx, { pos: L(-29.4, 1.3, 5.3), look: L(mx + 0.2, 1.05, 6.2), fov: 46 }, 0);
    },
  },
  {
    name: 'twins', start: 'b23.w7-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { hide: [PIL] }); const P = ctx.props; hs(ctx, P.pil, -15, 14, PI); hs(ctx, P.gar1, 0, 0, 0); hs(ctx, P.gar2, 0, 0, 0);
      const pl = put(ctx, 'pillay', V(), 0); pl.setAccessory('cap', false); pl.setAccessory('partyHat', true);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, pl = ctx.cast.pillay, tw = ctx.markers.twins;
      hset(P.pil, t, { rise: 0.7, smoke: 0.6, wag: 0.4 });
      pl.root.position.copy(L(-15, 0.12, 6.4)); pl.root.rotation.set(0, L.yaw + PI, 0);
      pl.pose('stunned', t, {}); pl.face(t < tw ? 'shocked' : 'sweat', 0.3);
      [P.gar1, P.gar2].forEach((g, i) => {
        const a = t * 2.4 + i * PI, r = 1.35;
        place(g, -15 + Math.sin(a) * r * 1.25, 5.6 + Math.cos(a) * r * 0.8, a + PI / 2); g.position.y = 0.12;
        hset(g, t + i * 0.4, { run: 1, freq: 4.5, hop: 0.8, wobble: 0.7 });
      });
      const k = ease.inOutSine(clamp(lt / 2.0, 0, 1));
      setCam(ctx, { pos: L(-14.4, 1.45, 0.6 + 0.9 * k), look: L(-15, 1.05, 6.2), fov: 48 }, 0.8, '#fff6e8', 8);
      ctx.cam.punch([tw + 0.03], t, 0.12, 0.3); shakeOn(ctx, [tw + 0.03], 0.7, 0.4, 3); pop(ctx, tw, 0.1, '#ffffff', 0.3);
      stamp(ctx, 'TWINS', tw - 0.02, { y: 0.16, size: 170, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.1 });
    },
  },
];
