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
  P.chain = makeChain(30); P.chain2 = makeChain(14);
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
  P.sign = makeArrowSign(['TOWN', '3 TOWNS'], { color: '#ffd23f' });
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
function fieldNight(ctx, { k = 1, fog = 1, exposure = 1.4 } = {}) {
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
function room(ctx, { light = 'night', exposure = 1.25 } = {}) {
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
      moveCam(ctx, { pos: L(-19.5, 2.2, -2.5), look: L(-27, 5.2, 12), fov: 56 }, { pos: L(-21.0, 2.0, -1.2), look: L(-27, 5.0, 12), fov: 52 }, ease.inOutSine(clamp(lt / 1.8, 0, 1)), 1.5, '#ffd8b0', 18);
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
      moveCam(ctx, { pos: L(-21.0, 2.4, 0.2), look: L(-27, 6.2, 12), fov: 54 }, { pos: L(-22.2, 2.8, 1.8), look: L(-27, 6.4, 12), fov: 50 }, ease.inOutSine(lt / 2.2), 2.0, '#c8dcff', 20);
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
      ctx.store.w = crowd(ctx, ['pj1', 'pj2', 'pj3'], [[-35.6, 0.12, 6.8, -PI / 2 + 0.9], [-34.2, 0.0, 2.6, -PI / 2 - 0.9], [-36.6, 0.12, 7.8, -PI / 2 + 0.6]]);
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
      P.lock.position.copy(b).add(V(0.18, -0.38, -0.02)); P.lock.rotation.set(0, L.yaw + 0.5, 0); P.lock.userData.set(t < tl ? clamp((t - tl + 0.6) / 0.6, 0, 0.6) * 0 : 1);
      pl.root.position.copy(L(-14.1, 0.12, 4.4)); pl.root.rotation.set(0, L.yaw + yawTo(-14.1, 4.4, -13.4, 0), 0);
      if (t < tl) { holdUp(pl, t); pl.face('determined', t); } else { pl.pose('crossArms', t); pl.face('smug', 0.5); }
      moveCam(ctx, { pos: L(-9.0, 1.2, -1.4), look: L(-14.4, 3.2, 8.0), fov: 62 }, { pos: L(-9.6, 1.2, -0.4), look: L(-14.4, 3.2, 8.0), fov: 60 }, lt / 2.2);
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
      setCam(ctx, { pos: pp.clone().add(V(2.6, 1.9, 2.4)), look: bell.clone().add(V(-0.6, 0.6, -0.8)), fov: 52 });
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
      pl.root.position.copy(L(-18.2, 0.12, 6.2)); pl.root.rotation.set(0, L.yaw + yawTo(-18.2, 6.2, -14, -3), 0);
      pl.pose('clap', t, { lookAt: P.pil.userData.pt('door') }); pl.face('grin', 0.4);
      moveCam(ctx, { pos: L(-12.6, 2.2, -5.2), look: L(-16.0, 3.8, 7.5), fov: 62 }, { pos: L(-13.2, 2.0, -4.2), look: L(-16.0, 3.6, 7.5), fov: 60 }, ease.inOutSine(lt / 1.3));
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
];
