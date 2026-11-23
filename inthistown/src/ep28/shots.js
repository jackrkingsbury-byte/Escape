// In This Town — Episode 28: "Out of Colour".  Fifty years ago a rainbow crashed into the park; it's the only colour the
// town has ever had, so colour is money and it can run out.  Then things nobody used start going grey (park, bakery, the
// sky)… the grey line on my map leads to my own front door: my black hoodie has been soaking up the town.  I cannonball into
// the fountain, colour floods back, and Grandma Mabel takes off her black cardigan: fifty years of colour pour out as a
// brand-new colour nobody can name — except HUSS.
// Film contract: SPEC.md §8.  Timeline: episodes/ep28/timeline.json.
//
// Sets: 'town' (buildTown seed 28) and 'room' (hero bedroom: map at night, Mom's laundry flashback by day).
// Town-local coordinates (T(ctx)): main street along x (centre z = 0, pavements z = ±4.5…7.5 at curb 0.12, house fronts
// ±10.5).  House slots (world.js HOUSE_SPECS) can be hidden / repainted / greyed (townEdit, townColour).
//   slot 0 (−27, −14) → the BAKERY (voxel house from ep26 props)      slot 3 (9, −14)  → the mayor's house (goes purple)
//   slot 5 (−27, 14)  → MY house (myHouse.door)                         slot 6 (−15, 14) → Mrs. Kaur (red door)
//   slot 7 (−3.4, 14) → Grandma Mabel's porch                           fire truck at the east end (24, 1.6)
//   town square: fountain at (40, 0), market stalls at x 34.5, stage at x 53.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { WALK_SPEED } from '../characters.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { makeSweatDrop, makeTable, makeChair } from '../props.js';
import { glowSprite, makeSparkles } from '../ep18/props.js';
import { makeFillerCrowd } from '../ep19/props.js';
import { makeFireTruck, makeSplash, makeShockRing } from '../ep20/props.js';
import { makeVoxHouse, makeRoller } from '../ep26/props.js';
import {
  greyRig, makeRainbowArch, makeCubeSwarm, makeFountain, makeStall, makeFruitStall, makeGrapeBunch, makeCoins, makeRockingChair,
  makeKnitting, makeYarnBall, makeTownMap, makePencil, makeTrail, makeWasher, makeHoodie, makeCardigan, makeHelmet, makeDoorSlab,
  makeSpiral, makeGreyDisc, makeFencePost, RAINBOW,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const SPECIAL = {
  kaur: { id: 'kaur', skin: '#a86b4a', hair: { style: 'bun', color: '#1a120c' }, top: { style: 'dress', color: '#3ee0c8', accent: '#ffd23f', emblem: 'heart' },
    bottom: { style: 'skirt', color: '#3ee0c8' }, shoes: '#ff4fa3', accessories: ['glasses'], scale: 0.97 },
  mabel: { id: 'mabel', skin: '#f4d0b5', hair: { style: 'bun', color: '#dcdce2' }, top: { style: 'cardigan', color: '#1d1d22', accent: '#3a3a42' },
    bottom: { style: 'skirt', color: '#7a6a58' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.9 },
  mabel2: { id: 'mabel2', skin: '#f4d0b5', hair: { style: 'bun', color: '#dcdce2' }, top: { style: 'tee', color: '#fff4e0', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#7a6a58' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.9 },
  mom: { id: 'mom', skin: '#f1c7a1', hair: { style: 'long', color: '#5a2e1a' }, top: { style: 'dress', color: '#ff7ab8', accent: '#ffffff', emblem: 'heart' },
    bottom: { style: 'skirt', color: '#ff7ab8' }, shoes: '#ffffff', accessories: [], scale: 1.0 },
  fireman: { id: 'fireman', skin: '#e0ac69', hair: { style: 'short', color: '#3b2416' }, top: { style: 'hoodie', color: '#2b2b33', accent: '#ffd23f', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2b2b33' }, shoes: '#1d1d22', accessories: ['mustache'], scale: 1.02, build: 1.1 },
  kid: { id: 'kid', skin: '#c68642', hair: { style: 'curly', color: '#1a120c' }, top: { style: 'tee', color: '#3fc44a', accent: '#ffffff', emblem: 'star' },
    bottom: { style: 'shorts', color: '#2f4d8a' }, shoes: '#ffffff', accessories: ['cap'], capColor: '#ff4fa3', scale: 0.78 },
};
export const cast = { me: MAIN.me, mayor: MAIN.mayor, pigeon: MAIN.pigeon, ...SPECIAL, ...EXTRAS };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 28, banner: ['TOWN', 'COLOUR', 'MARKET'] }),
  room: () => buildRoom({ variant: 'hero', window: 'dark' }),
};
const X = EXTRA_IDS;

// ───────────────────────────────────────────────────────────────────────────────────────── layout (town-local)
const SLOTS = [
  { x: -27, z: -14, yaw: 0, w: 8.6 }, { x: -15, z: -14, yaw: 0, w: 9.0 }, { x: -3, z: -14, yaw: 0, w: 9.4 }, { x: 9, z: -14, yaw: 0, w: 8.8 },
  { x: 21, z: -14, yaw: 0, w: 9.0 }, { x: -27, z: 14, yaw: PI, w: 9.0 }, { x: -15, z: 14, yaw: PI, w: 8.4 }, { x: -3.4, z: 14, yaw: PI, w: 8.6 },
  { x: 25, z: 14, yaw: PI, w: 8.6 },
];
const BAKERY = 0, MAYOR = 3, HOME = 5, KAUR = 6, MABEL = 7;
const LAMPS = [...[-33, -21, -9, 3, 15, 27].map((x) => [x, -5.15]), ...[-27, -15, -3, 9, 21].map((x) => [x, 5.15])];
const LAMP_AT = (x, z) => LAMPS.findIndex((l) => l[0] === x && l[1] === z);
const FOUNT = [40, 0];
const TRUCK = { x: 24, z: 1.6, yaw: -PI / 2 };
const KDOOR = { x: -15, z: 10.38 };                // Mrs. Kaur's door surface
const FRUIT = { x: 11.0, z: -6.2 };
const PARK = { x: -53, z: -10, treeX: -54.6, treeZ: -12.4 };
const TRAIL = [[34, 0.8], [-38, 0.8], [-44, -3.2], [-50, -6.2], [-55, -9.2], [-52.5, -14.2], [-47, -12], [-43, -7.2], [-33, -6.6], [-27, -6.6], [-27, 0], [-27, 9.3]];

export function init(ctx) {
  const P = ctx.props;
  P.bakery = greyRig(makeVoxHouse({ wall: '#ffd9e6', roof: '#e8456f', door: '#7a1f2b', trim: '#ffffff', shutters: '#ff8fb8', seed: 3,
    sign: { text: 'BAKERY', bg: '#fff4e0', fg: '#c2185b' }, awning: ['#ff4fa3', '#ffffff'] }));
  P.truck = makeFireTruck(); P.truck.userData.set({ raise: 0, extend: 0 });
  P.truck.updateMatrixWorld(true); greyRig(P.truck);
  P.arch = makeRainbowArch();
  P.swarm = makeCubeSwarm(520, RAINBOW, { size: 0.55 });
  P.mini = makeCubeSwarm(160, ['#e8232b', '#ffd23f', '#2f8fff'], { size: 0.12 });
  P.rain = makeCubeSwarm(420, RAINBOW, { size: 0.32 });
  P.fountain = makeFountain();
  P.stalls = [
    makeStall({ sign: ['BLUE:', '9 COINS'], canopy: ['#2f8fff', '#ffffff'], cubes: ['#2f8fff', '#4fb3ff'] }),
    makeStall({ sign: ['GREEN:', '15 COINS'], canopy: ['#3fc44a', '#ffffff'], cubes: ['#3fc44a', '#7be07f'] }),
    makeStall({ sign: ['YELLOW:', 'SOLD OUT'], canopy: ['#ffd23f', '#ffffff'], cubes: ['#ffd23f'], soldOut: true, signBg: '#ffd23f' }),
  ];
  P.fruit = makeFruitStall(); P.fruit.updateMatrixWorld(true); greyRig(P.fruit.userData.grapes);
  P.bunch = greyRig(makeGrapeBunch(24, 7));
  P.coins = makeCoins(14);
  P.greenCube = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: '#3fc44a', emissive: '#3fc44a', emissiveIntensity: 1.1 }));
  P.cubeGlow = glowSprite('#7bff7f', 0.9, 0.8);
  P.rocker = makeRockingChair(); P.knit = makeKnitting(); P.yarn = makeYarnBall();
  P.map = makeTownMap(); P.pencil = makePencil('#8a8a90');
  P.table = makeTable({ w: 1.3, d: 0.9 }); P.chair = makeChair();
  P.lampLight = new THREE.PointLight('#ffcf8a', 6, 5, 1.5);
  P.trail = makeTrail(TRAIL);
  P.washer = makeWasher(); P.hoodie = makeHoodie();
  P.cardigan = makeCardigan(0.9);
  P.helmet = makeHelmet();
  P.door = makeDoorSlab(1.06, 2.12);
  P.roller = makeRoller(1.0, '#e8232b');
  P.spiral = makeSpiral(380);
  P.disc = makeGreyDisc();
  P.post = makeFencePost();
  P.splash = makeSplash(80, { speed: 0.8, size: 0.35 });
  P.shock = makeShockRing();
  P.sweat = makeSweatDrop({ size: 0.12 });
  P.drop = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), new THREE.MeshStandardMaterial({ color: '#2f8fff', emissive: '#1f5fcf', emissiveIntensity: 0.6, roughness: 0.1 }));
  P.block = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.62), new THREE.MeshStandardMaterial({ color: '#a8a8a6', roughness: 0.8 }));
  P.donut = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.035, 8, 16), new THREE.MeshStandardMaterial({ color: '#ff6fae', roughness: 0.6 }));
  P.filler = makeFillerCrowd(120);
  P.sparks = makeSparkles({ n: 50, w: 10, h: 5, d: 8, color: '#fff2c0', size: 0.06 });
  P.fill = new THREE.PointLight('#f0f2ff', 5, 12, 1.4);
  P.hue = new THREE.PointLight('#ffffff', 0, 14, 1.2);
  P.glint = glowSprite('#ffffff', 1, 1);
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function T(ctx) { const r = ctx.set.root; r.updateMatrixWorld(true); const M = r.matrixWorld.clone(); const f = (x, y, z) => V(x, y, z).applyMatrix4(M); f.yaw = yawOf(r); f.M = M; return f; }
function put(ctx, id, p, yaw, scale) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); if (scale != null) r.scale.setScalar(scale); return ctx.cast[id]; }
function addTo(ctx, obj, x, y, z, ry = 0, s = null) { const o = obj.root && obj.root.isObject3D ? obj.root : obj; ctx.add(o, ctx.set.root); o.position.set(x, y, z); o.rotation.set(0, ry, 0); if (s != null) o.scale.setScalar(s); return o; }
const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.13, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,40,0.84)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale ?? 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0 || (o.t1 != null && ctx.t > o.t1)) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.25, size: 150, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.12, ...o, scale: s * (o.scale ?? 1), alpha: clamp(d / 0.06, 0, 1) });
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function jointPos(ch, j, off = [0, 0, 0]) { ch.root.updateMatrixWorld(true); return ch.joints[j].localToWorld(V(...off)); }
/** camera in front of a character's face (3/4 by `side`), aimed `below` metres under the face → face in the upper third */
function faceCam(ch, d = 2.4, side = 0.4, below = 0.38, fov = 34, lift = -0.15) {
  const f = humanFace(ch), y = ch.root.rotation.y, fw = V(Math.sin(y), 0, Math.cos(y)), l = V(fw.z, 0, -fw.x);
  return { pos: f.clone().addScaledVector(fw, d).addScaledVector(l, side).add(up(lift)), look: f.clone().add(up(-below)), fov };
}
function fill(ctx, pos, k = 1, color = '#f0f2ff', dist = 12) { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); f.distance = dist; }
function setCam(ctx, c, k = 0, color, dist) { ctx.cam.set(c); ctx.store.cam = c; if (k > 0) fill(ctx, c.pos, k, color, dist); return c; }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0, color, dist) { const c = camLerp(a, b, clamp(u, 0, 1)); ctx.cam.set(c); ctx.store.cam = c; if (k > 0) fill(ctx, c.pos, k, color, dist); return c; }
function pop(ctx, t0, dur = 0.12, color = '#ffffff', a = 0.5) { const d = ctx.t - t0; if (d >= 0 && d < dur) ctx.fx.overlay(color, a * (1 - d / dur)); }
function lastBefore(times, t) { let r = null; for (const x of times) if (x <= t) r = x; return r; }
function shakeOn(ctx, hits, amt = 0.6, dur = 0.35, seed = 7) { for (const h of hits) { const d = ctx.t - h; if (d >= 0 && d < dur) ctx.cam.shake(amt * (1 - d / dur), ctx.t, seed); } }
const H = (beat, i) => (i === 0 ? `${beat}.h0-0.12` : `${beat}.h${i}-0.03`);
const hussHits = (ctx, beat) => ctx.hussTimes(beat).map((h) => h + 0.03);
const sm = (x) => { const u = clamp(x, 0, 1); return u * u * (3 - 2 * u); };
/** whip-pan in: the look target swings in from the side during the first `dur` seconds */
function whip(ctx, c, lt, dir = 1, dur = 0.18) {
  const k = 1 - ease.outCubic(clamp(lt / dur, 0, 1));
  if (k <= 0) return c;
  const f = c.look.clone().sub(c.pos), r = V(-f.z, 0, f.x).normalize();
  ctx.cam.set({ ...c, look: c.look.clone().addScaledVector(r, dir * k * f.length() * 0.9), roll: dir * 0.12 * k });
  return c;
}

// ─── town data: hide slots / lamps, recolour walls & roofs, grey anything by position
function slotBox(i) {
  const s = SLOTS[i], f = s.yaw === 0 ? 1 : -1;
  const zA = s.z + f * (3.5 + 1.0), zB = s.z - f * (3.5 + 0.7);
  return { x0: s.x - s.w / 2 - 0.75, x1: s.x + s.w / 2 + 0.75, z0: Math.min(zA, zB), z1: Math.max(zA, zB), y1: 12.5 };
}
const lampOf = (x, z) => { for (let i = 0; i < LAMPS.length; i++) if (Math.hypot(x - LAMPS[i][0], z - LAMPS[i][1]) < 0.7) return i; return -1; };
function townData(ctx) {
  const r = ctx.set.root; let D = ctx.props.td;
  if (D && D.root === r) return D;
  D = { root: r, meshes: [], insts: [], dirtyPos: true, dirtyCol: true };
  const BX = SLOTS.map((_, i) => slotBox(i));
  const inB = (b, x, y, z) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y < b.y1 && y > -1;
  for (const n of ['houses', 'roofs', 'trim', 'gold', 'lampPosts', 'park']) {
    const m = r.getObjectByName(n); if (!m || !m.geometry) continue;
    const pos = m.geometry.attributes.position, col = m.geometry.attributes.color;
    const lists = BX.map(() => []), lamp = LAMPS.map(() => []);
    if (n !== 'park') for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
      if (n === 'lampPosts') { const li = lampOf(x, z); if (li >= 0) lamp[li].push(v); continue; }
      for (let i = 0; i < BX.length; i++) if (inB(BX[i], x, y, z)) lists[i].push(v);
    }
    D.meshes.push({ n, m, pos, col, pos0: pos.array.slice(), col0: col ? col.array.slice() : null, lists, lamp });
  }
  r.traverse((o) => {
    if (!o.isInstancedMesh || !['windows', 'windowHalos', 'glows', 'lampCores', 'lampPools', 'crowns'].includes(o.name)) return;
    const a = o.instanceMatrix.array, lists = SLOTS.map(() => []), lamp = LAMPS.map(() => []);
    for (let k = 0; k < o.count; k++) {
      const x = a[k * 16 + 12], y = a[k * 16 + 13], z = a[k * 16 + 14];
      if (o.name.startsWith('lamp')) { const li = lampOf(x, z); if (li >= 0) lamp[li].push(k); continue; }
      for (let i = 0; i < BX.length; i++) if (inB(BX[i], x, y, z)) lists[i].push(k);
    }
    D.insts.push({ o, m0: a.slice(), c0: o.instanceColor ? o.instanceColor.array.slice() : null, lists, lamp });
  });
  const halo = r.getObjectByName('lampHalos');
  if (halo && halo.geometry.attributes.position) { const p = halo.geometry.attributes.position; const lamp = LAMPS.map(() => []); for (let k = 0; k < p.count; k++) { const li = lampOf(p.getX(k), p.getZ(k)); if (li >= 0) lamp[li].push(k); } D.halo = { o: halo, lamp, s0: halo.geometry.attributes.size ? halo.geometry.attributes.size.array.slice() : null }; }
  ctx.props.td = D; return D;
}
/** hide house slots and lamp posts (indices into LAMPS) */
function townEdit(ctx, { hide = [], lamps = [] } = {}) {
  const D = townData(ctx);
  for (const M of D.meshes) {
    if (M.n === 'park') continue;
    const pa = M.pos.array; pa.set(M.pos0);
    for (const i of hide) for (const v of M.lists[i] || []) { pa[v * 3] = 0; pa[v * 3 + 1] = -500; pa[v * 3 + 2] = 0; }
    for (const li of lamps) for (const v of M.lamp[li] || []) { pa[v * 3] = 0; pa[v * 3 + 1] = -500; pa[v * 3 + 2] = 0; }
    M.pos.needsUpdate = true;
  }
  for (const I of D.insts) {
    if (I.o.name === 'crowns') continue;
    const a = I.o.instanceMatrix.array; a.set(I.m0);
    const zero = (k) => { for (let e = 0; e < 16; e++) a[k * 16 + e] = 0; };
    for (const i of hide) for (const k of I.lists[i] || []) zero(k);
    for (const li of lamps) for (const k of I.lamp[li] || []) zero(k);
    I.o.instanceMatrix.needsUpdate = true;
  }
  if (D.halo && D.halo.s0) { const s = D.halo.o.geometry.attributes.size; s.array.set(D.halo.s0); for (const li of lamps) for (const k of D.halo.lamp[li] || []) s.array[k] = 0; s.needsUpdate = true; }
}
const _pc = new THREE.Color(), _g1 = new THREE.Color();
const greyL = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) * 0.78 + 0.05;
/** recolour: paint = { slot: { c, roof, u (0..1 sweep from −x) } }, grey = fn(x, y, z) → 0..1 (town-local) or null */
function townColour(ctx, { paint = {}, grey = null } = {}) {
  const D = townData(ctx);
  const any = grey || Object.keys(paint).length;
  if (!any && !D.dirtyCol) return;
  D.dirtyCol = !!any;
  for (const M of D.meshes) {
    if (!M.col) continue;
    const ca = M.col.array, p0 = M.pos0; ca.set(M.col0);
    const which = M.n === 'houses' ? 'c' : M.n === 'roofs' ? 'roof' : null;
    if (which) for (const [i, o] of Object.entries(paint)) {
      if (!o[which]) continue;
      _pc.set(o[which]); const s = SLOTS[+i], u = o.u ?? 1, x0 = s.x - s.w / 2 - 0.8, wd = s.w + 1.6;
      for (const v of M.lists[+i] || []) { const f = (p0[v * 3] - x0) / wd; if (f > u) continue; ca[v * 3] = _pc.r; ca[v * 3 + 1] = _pc.g; ca[v * 3 + 2] = _pc.b; }
    }
    if (grey && (M.n === 'houses' || M.n === 'roofs' || M.n === 'trim' || M.n === 'park')) {
      const n = p0.length / 3;
      for (let v = 0; v < n; v++) {
        const k = grey(p0[v * 3], p0[v * 3 + 1], p0[v * 3 + 2]); if (!(k > 0)) continue;
        const r = ca[v * 3], g = ca[v * 3 + 1], b = ca[v * 3 + 2], l = greyL(r, g, b), kk = Math.min(1, k);
        ca[v * 3] = r + (l - r) * kk; ca[v * 3 + 1] = g + (l - g) * kk; ca[v * 3 + 2] = b + (l * 1.02 - b) * kk;
      }
    }
    M.col.needsUpdate = true;
  }
  for (const I of D.insts) {
    if (I.o.name !== 'crowns' || !I.c0) continue;
    const ca = I.o.instanceColor.array, a = I.m0; ca.set(I.c0);
    if (grey) for (let k = 0; k < I.o.count; k++) {
      const kk = Math.min(1, grey(a[k * 16 + 12], a[k * 16 + 13], a[k * 16 + 14])); if (!(kk > 0)) continue;
      const r = ca[k * 3], g = ca[k * 3 + 1], b = ca[k * 3 + 2], l = greyL(r, g, b);
      ca[k * 3] = r + (l - r) * kk; ca[k * 3 + 1] = g + (l - g) * kk; ca[k * 3 + 2] = b + (l - b) * kk;
    }
    I.o.instanceColor.needsUpdate = true;
  }
}
const inPark = (x, z) => x < -44.5 && x > -66 && z > -34 && z < 10;

// ─── sky moods layered on the preset
const MOODS = {
  grey: { z: '#8e9196', m: '#a9abae', h: '#c2c2c0', g: '#6c6c6a', s: '#d8d8d6', fog: '#b6b7b8', hemi: ['#d2d3d6', '#5e5e5c'], dir: '#d8d8d8' },
  pink: { z: '#2a1a5e', m: '#9a3f9e', h: '#ff9ac8', g: '#3a2c48', s: '#ffd0e8', fog: '#b46aa8', hemi: ['#ffb6e4', '#3a2850'], dir: '#ffb0d0' },
};
const _m1 = new THREE.Color(), _m2 = new THREE.Color();
function skyBase(ctx) {
  const r = ctx.set.root, sky = r.getObjectByName('sky');
  if (!sky || !sky.material.uniforms) { ctx.store.sky = null; return; }
  const u = sky.material.uniforms, lights = [];
  r.traverse((o) => { if (o.isHemisphereLight) lights.push({ o, c: o.color.clone(), g: o.groundColor.clone(), i: o.intensity }); else if (o.isDirectionalLight) lights.push({ o, c: o.color.clone(), i: o.intensity }); });
  ctx.store.sky = { u, base: { z: u.uZenith.value.clone(), m: u.uMid.value.clone(), h: u.uHorizon.value.clone(), g: u.uGround.value.clone(), s: u.uSunColor.value.clone() }, fog: ctx.set.fog ? ctx.set.fog.color.clone() : null, bg: ctx.set.background ? ctx.set.background.clone() : null, lights };
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
/** the impossible new colour: hue-cycling sky (k 0 → preset … 1 → full shimmer) */
function skyShimmer(ctx, t, k = 1) {
  const S = ctx.store.sky; if (!S) return;
  const { u, base } = S, kk = clamp(k, 0, 1), h = (t * 0.12) % 1;
  const hsl = (hh, s, l) => _m2.setHSL(((hh % 1) + 1) % 1, s, l);
  u.uZenith.value.copy(base.z).lerp(hsl(h + 0.62, 0.75, 0.42), kk); u.uMid.value.copy(base.m).lerp(hsl(h + 0.85, 0.85, 0.6), kk);
  u.uHorizon.value.copy(base.h).lerp(hsl(h + 0.08, 0.95, 0.72), kk); u.uSunColor.value.copy(base.s).lerp(hsl(h + 0.3, 1, 0.8), kk);
  if (S.fog) { ctx.set.fog.color.copy(S.fog).lerp(hsl(h + 0.08, 0.6, 0.75), kk * 0.7); if (ctx.set.background) ctx.set.background.copy(ctx.set.fog.color); }
}

// ─── town looks
function town(ctx, light = 'day', { hide = [], lamps = [], exposure = null, bakery = true, glow = 0.8 } = {}) {
  const s = ctx.set;
  s.setLighting(light); s.set('partyProps', false); s.set('fireworks', false); s.set('foam', 0);
  s.set('windowGlow', light === 'day' ? 0 : glow); s.set('standsCrowd', false); s.set('crowdMotion', 1);
  s.exposure = exposure ?? (light === 'dusk' ? 1.05 : 1.0);
  const L = T(ctx); ctx.store.L = L;
  townEdit(ctx, { hide: bakery ? [BAKERY, ...hide] : hide, lamps });
  townColour(ctx, {});
  if (bakery) { addTo(ctx, ctx.props.bakery, SLOTS[BAKERY].x, 0, SLOTS[BAKERY].z, 0); ctx.props.bakery.userData.grey(0); }
  skyBase(ctx);
  return L;
}
/** town square dressing: fountain, market stalls, optional crowd in the bleachers */
function square(ctx, { stalls = true, stands = true } = {}) {
  const P = ctx.props;
  addTo(ctx, P.fountain, FOUNT[0], 0, FOUNT[1]); P.fountain.userData.set(ctx.t);
  if (stalls) { addTo(ctx, P.stalls[0], 34.5, 0, -6.6, -PI / 2); addTo(ctx, P.stalls[1], 34.5, 0, -3.3, -PI / 2); addTo(ctx, P.stalls[2], 34.5, 0, 5.2, -PI / 2); }
  ctx.set.set('standsCrowd', stands);
}
function crowd(ctx, ids, spots) {
  const L = ctx.store.L;
  return ids.map((id, i) => { const [x, y, z, yw] = spots[i]; const ch = put(ctx, id, L(x, y, z), L.yaw + yw); return { ch, id, k: i, ph: hash(i * 1.9 + 3) * 3, x, y, z, yw }; });
}
/** characters in a ring around (cx, cz) between angles a0…a1 (radians, 0 = +x), facing the centre */
function ringSpots(n, cx, cz, r0, r1, a0, a1, seed = 1) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = lerp(a0, a1, (i + 0.5) / n) + (hash(i * 3.1 + seed) - 0.5) * 0.12, r = lerp(r0, r1, hash(i * 1.7 + seed)); const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; out.push([x, 0, z, yawTo(x, z, cx, cz)]); }
  return out;
}
function filler(ctx, list) { const f = ctx.props.filler; ctx.add(f, ctx.set.root); f.position.set(0, 0, 0); f.userData.layout(list); return f; }
function ringFill(n, cx, cz, r0, r1, a0, a1, seed = 3, avoid = null) {
  const out = [];
  for (let i = 0; out.length < n && i < n * 6; i++) {
    const a = lerp(a0, a1, hash(i * 1.37 + seed)), r = lerp(r0, r1, hash(i * 2.71 + seed)), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (avoid && avoid(x, z)) continue;
    if (out.some((q) => Math.hypot(q.x - x, q.z - z) < 0.95)) continue;
    out.push({ x, y: 0, z, yaw: yawTo(x, z, cx, cz) + (hash(i * 4.4 + seed) - 0.5) * 0.5, k: i, s: 0.86 + 0.24 * hash(i * 3.3 + seed) });
  }
  return out;
}
/** walkers: [[id, x0, z, dir(+1 → +x), speed]] — loop within ±span around x0 */
function walkers(ctx, list) { ctx.store.walk = list.map(([id, x0, z, dir, sp], i) => { put(ctx, id, ctx.store.L(x0, 0.12, z), 0); return { id, x0, z, dir, sp: sp ?? 1, ph: hash(i * 2.3) * 9 }; }); }
function animWalkers(ctx, span = 9) {
  const L = ctx.store.L;
  for (const w of ctx.store.walk || []) {
    const ch = ctx.cast[w.id], d = ((ctx.t * WALK_SPEED * w.sp + w.ph) % (2 * span)) - span;
    ch.root.position.copy(L(w.x0 + w.dir * d, 0.12, w.z)); ch.root.rotation.set(0, L.yaw + (w.dir > 0 ? PI / 2 : -PI / 2), 0);
    ch.pose('walk', ctx.t + w.ph, { speed: w.sp }); ch.face('smile', ctx.t + w.ph);
  }
}

// ─── poses
function shield(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints;
  J.armL.rotation.set(-2.0 * k, 0, -0.55 * k); J.armR.rotation.set(-2.0 * k, 0, 0.55 * k);
  J.foreArmL.rotation.set(-1.35 * k, 0, 0); J.foreArmR.rotation.set(-1.35 * k, 0, 0);
  J.head.rotation.y += 0.45 * k; J.head.rotation.x += 0.25 * k; J.torso.rotation.x += 0.12 * k;
  ch.face('squint', 0);
}
function tuck(ch, t, k = 1) {
  ch.pose('idle', 0, { intensity: 0 });
  const J = ch.joints;
  J.legL.rotation.x = -2.1 * k; J.legR.rotation.x = -2.1 * k; J.shinL.rotation.x = 2.3 * k; J.shinR.rotation.x = 2.3 * k;
  J.armL.rotation.set(-1.25 * k, 0, -0.45 * k); J.armR.rotation.set(-1.25 * k, 0, 0.45 * k);
  J.foreArmL.rotation.set(-1.5 * k, 0, 0); J.foreArmR.rotation.set(-1.5 * k, 0, 0);
  J.torso.rotation.x = 0.35 * k; J.head.rotation.x = -0.15 * k;
}
function wring(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.2 });
  const J = ch.joints, s = Math.sin(t * 9), s2 = Math.sin(t * 23);
  J.armL.rotation.set(-0.85, 0.1 * s, -0.42); J.armR.rotation.set(-0.85, -0.1 * s, 0.42);
  J.foreArmL.rotation.set(-0.85 + 0.12 * s, 0.4 * s * k, 0); J.foreArmR.rotation.set(-0.85 - 0.12 * s, -0.4 * s * k, 0);
  J.torso.rotation.y = 0.12 * s * k; J.torso.rotation.x += 0.12; J.head.rotation.z = 0.06 * s2 * k; J.head.rotation.x += 0.25;
}
function knitPose(ch, t, look = 0) {
  ch.pose('sit', t, { hands: 'lap', seatHeight: 0.58, intensity: 0.2 });
  const J = ch.joints, s = Math.sin(t * 7);
  J.armL.rotation.set(-0.95 + 0.08 * s, 0, -0.3); J.armR.rotation.set(-0.95 - 0.08 * s, 0, 0.3);
  J.foreArmL.rotation.set(-0.85, 0.15, 0); J.foreArmR.rotation.set(-0.85, -0.15, 0);
  J.head.rotation.x += lerp(0.38, -0.08, look);
}
function holdFront(ch, t, k = 1, lift = 0) {   // both arms forward (holding something up in front)
  ch.pose('idle', t, { intensity: 0.2 });
  const J = ch.joints, a = lerp(-0.35, -1.5 - 0.6 * lift, k);
  J.armL.rotation.set(a, 0, -0.28 * k); J.armR.rotation.set(a, 0, 0.28 * k);
  J.foreArmL.rotation.set(-0.3 * k, 0, 0); J.foreArmR.rotation.set(-0.3 * k, 0, 0);
}
function liftArms(ch, t, u) {   // arms from the sides to straight above the head (pulling something off over the head)
  ch.pose('idle', t, { intensity: 0.15 });
  const J = ch.joints, k = clamp(u, 0, 1);
  J.armL.rotation.set(lerp(-0.25, -2.95, k), 0, lerp(-0.35, -0.12, k)); J.armR.rotation.set(lerp(-0.25, -2.95, k), 0, lerp(0.35, 0.12, k));
  J.foreArmL.rotation.set(lerp(-1.2, -0.1, k), 0, 0); J.foreArmR.rotation.set(lerp(-1.2, -0.1, k), 0, 0);
  J.head.rotation.x += lerp(0.1, -0.25, k);
}
function pointSelf(ch, t) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints;
  J.armR.rotation.set(-1.15, 0, 0.55); J.foreArmR.rotation.set(-1.75, 0, 0);
  J.armL.rotation.set(-0.2, 0, -0.55); J.foreArmL.rotation.set(-0.5, 0, 0);
  J.head.rotation.z = 0.12;
}
function lookUp(ch, t, k = 1, ph = 0) { ch.pose('stunned', t + ph, { headPitch: -0.55 * k }); }
function rollPose(ch, t, ph = 0) {   // roller on the door at her right side
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints, s = Math.sin(t * 5.5 + ph);
  J.armR.rotation.set(-1.2 - 0.45 * s, 0, -0.75); J.foreArmR.rotation.set(-0.35, 0, 0);
  J.armL.rotation.set(-0.3, 0, -0.25); J.foreArmL.rotation.set(-0.6, 0, 0);
  J.torso.rotation.y = -0.18; J.head.rotation.y -= 0.1;
}
/** aim the roller (in the scene) from a character's right hand to a world target */
const _ry = V(0, -1, 0), _rq = new THREE.Quaternion();
function aimRoller(ctx, ch, target) {
  const R = ctx.props.roller; ctx.add(R);
  const h = jointPos(ch, 'handR'); R.position.copy(h);
  const dir = target.clone().sub(h); const len = dir.length(); dir.normalize();
  _rq.setFromUnitVectors(_ry, dir); R.quaternion.copy(_rq); R.scale.set(1, len / 1.42, 1);
}

// ─── locations
/** Mrs. Kaur at her door (slot 6): returns the door frame (x across the door, y up) */
function kaurDoor(ctx, { u = 1, color = '#e8232b', wet = 1 } = {}) {
  const L = ctx.store.L, P = ctx.props;
  addTo(ctx, P.door, KDOOR.x, 0, KDOOR.z, PI); P.door.userData.set(u, color, wet);
  return (x, y) => L(KDOOR.x - x, y, KDOOR.z - 0.05);
}
function mabelPorch(ctx) {
  const L = ctx.store.L, P = ctx.props;
  addTo(ctx, P.rocker, -1.0, 0.12, 9.1, PI);
  addTo(ctx, P.yarn, -1.6, 0.12, 8.7, 0);
  const m = put(ctx, 'mabel', L(-1.0, 0.12, 9.1), L.yaw + PI);
  ctx.add(P.knit, m.joints.handR); P.knit.position.set(0.06, 0.02, 0.05); P.knit.rotation.set(-0.6, 0, 0.3);
  return m;
}
function rock(ctx, ch, t) { const a = 0.07 * Math.sin(t * 1.9); ctx.props.rocker.userData.set(a); ch.root.rotation.x = a; }
function truckAt(ctx) { const P = ctx.props; addTo(ctx, P.truck, TRUCK.x, 0, TRUCK.z, TRUCK.yaw); return P.truck; }
/** truck drains (or refills): front d from bumper (local z 3.8) back & up; dir +1 drain, −1 refill from the ladder */
function truckGrey(ctx, u, dir = 1) {
  const front = lerp(-1, 15, u);
  ctx.props.truck.userData.grey((p) => { const d = (3.9 - p.z) + 0.45 * p.y; return dir > 0 ? clamp((front - d) / 1.2, 0, 1) : clamp((d - (15 - front)) / 1.2, 0, 1); });
}
function fireman(ctx, x, z, yaw) {
  const f = put(ctx, 'fireman', ctx.store.L(x, 0.12, z), ctx.store.L.yaw + yaw);
  const hm = ctx.props.helmet; ctx.add(hm, f.joints.head); hm.position.set(0, 0.56, -0.02); hm.rotation.set(-0.05, 0, 0); hm.scale.setScalar(0.95);
  return f;
}
function parkGrey(ctx, r, { cx = PARK.x - 9, cz = PARK.z - 10, soft = 3 } = {}) {
  const P = ctx.props, L = ctx.store.L;
  townColour(ctx, { grey: (x, y, z) => (inPark(x, z) ? clamp((r - Math.hypot(x - cx, z - cz)) / soft, 0, 1) : 0) });
  ctx.add(P.disc, ctx.set.root); P.disc.position.set(cx, 0.025, cz); P.disc.scale.setScalar(Math.max(0.001, r));
}
/** my desk at night: table + chair in the middle of the room, me facing the open side (+z) */
function deskRoom(ctx) {
  const s = ctx.set; s.setLighting('night'); s.set('window', 'dark'); s.exposure = 1.25;
  const R = T(ctx); ctx.store.R = R; ctx.store.L = R;
  const P = ctx.props;
  addTo(ctx, P.chair, 0, 0, -0.55, 0); addTo(ctx, P.table, 0, 0, 0.1, 0);
  addTo(ctx, P.map, 0, 0.78, 0.12, 0); P.map.scale.setScalar(0.82);
  ctx.add(P.lampLight, s.root); P.lampLight.position.set(0.4, 1.7, 0.4); P.lampLight.intensity = 6;
  const me = put(ctx, 'me', R(0, 0, -0.55), R.yaw);
  return R;
}
function mapDot(ctx, i) { const P = ctx.props, d = P.map.userData.dots[i]; P.map.updateMatrixWorld(true); return P.map.localToWorld(V((d[0] - 0.5) * 1.2, 0.01, (d[1] - 0.5) * 0.85)); }

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
const DOOR_HIDE = [LAMP_AT(-15, 5.15)];
const MABEL_HIDE = [LAMP_AT(-3, 5.15)];
const HOME_HIDE = [LAMP_AT(-27, 5.15)];

export const shots = [
  // ── b01 "In this town, colours can run out."  — bright, busy main street
  {
    name: 'colour town', start: 0, set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      walkers(ctx, [[X[0], -2, -6.2, 1, 0.9], [X[1], 4, 6.0, -1, 1], [X[2], -8, 5.8, 1, 0.8], [X[3], 10, -6.0, -1, 1.1], [X[4], -14, -5.8, -1, 0.9], [X[5], 14, 6.2, 1, 1]]);
      addTo(ctx, ctx.props.sparks, -2, 3, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L; animWalkers(ctx, 8);
      ctx.props.sparks.userData.set(ctx.t, 0.6);
      moveCam(ctx, { pos: L(30, 13, 7), look: L(-12, 2.5, -1), fov: 56 }, { pos: L(20, 5.0, 4.2), look: L(-10, 2.6, -1.5), fov: 50 }, ease.inOutSine(clamp(lt / 2.3, 0, 1)));
    },
  },
  // ── "Paint your door red,"  — Mrs. Kaur rolls red onto her door
  {
    name: 'kaur paints', start: 'paint-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { lamps: DOOR_HIDE });
      put(ctx, 'kaur', L(-16.25, 0.12, 9.55), L.yaw + PI + 0.35);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, k = ctx.cast.kaur, t0 = ctx.markers.paint;
      const u = clamp((t - t0 + 0.15) / 1.4, 0, 1);
      const D = kaurDoor(ctx, { u: 0.08 + 0.92 * u });
      rollPose(k, t); k.face('grin', t);
      const s = Math.sin(t * 5.5);
      aimRoller(ctx, k, D(-0.53 + 1.06 * (0.08 + 0.92 * u) - 0.1, 1.15 + 0.75 * s));
      moveCam(ctx, { pos: L(-14.2, 1.45, 6.1), look: L(-15.6, 1.25, 10.0), fov: 42 }, { pos: L(-14.6, 1.4, 6.9), look: L(-15.6, 1.25, 10.0), fov: 40 }, lt / 1.7);
    },
  },
  // ── "and somewhere a fire truck turns grey."
  {
    name: 'truck drains', start: 'truck-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { lamps: [LAMP_AT(21, 5.15)] });
      truckAt(ctx); ctx.props.truck.userData.grey(0);
      fireman(ctx, 18.0, 4.0, -PI / 2 - 0.9);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, f = ctx.cast.fireman, t0 = ctx.markers.truck + 0.1;
      truckGrey(ctx, clamp((t - t0) / 0.9, 0, 1));
      const shocked = t > t0 + 0.3;
      f.pose(shocked ? 'surprised' : 'idle', shocked ? clamp(t - t0 - 0.3, 0, 0.5) : t, { lookAt: L(22, 2.2, 1.6) }); f.face(shocked ? 'shocked' : 'neutral', 0.3);
      moveCam(ctx, { pos: L(13.6, 0.75, 5.6), look: L(21.5, 2.3, 1.6), fov: 50 }, { pos: L(14.6, 0.8, 5.2), look: L(21.5, 2.4, 1.6), fov: 46 }, ease.outCubic(clamp(lt / 1.2, 0, 1)));
      tag(ctx, 'RED: -1', ctx.markers.truck, Infinity, { y: 0.13, size: 92, fill: '#ff3a3a' });
    },
  },
  // ── b02 "Fifty years ago, a rainbow crashed into the park,"  — flashback: pink dusk, grey town, giant rainbow arch
  {
    name: 'rainbow over park', start: 'b02-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk');
      townColour(ctx, { grey: () => 1 });
      const P = ctx.props; ctx.add(P.disc, ctx.set.root); P.disc.position.set(-30, 0.004, 0); P.disc.scale.setScalar(200); P.disc.material.color.set('#8a8a88');
      addTo(ctx, P.arch, -55, 0, -14, yawTo(-55, -14, -34, 6)); P.arch.userData.set(0);
      ctx.props.bakery.userData.grey(1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      skyMood(ctx, 'pink', 1);
      moveCam(ctx, { pos: L(-31, 1.2, 5.5), look: L(-46, 5.0, -8), fov: 58 }, { pos: L(-33, 4.5, 7.5), look: L(-50, 9.5, -11), fov: 60 }, ease.inOutSine(clamp(lt / 1.5, 0, 1)));
      ctx.fx.overlay('#ff9ad0', 0.07);
      tag(ctx, '50 YEARS AGO', ctx.time('b02') + 0.05, Infinity, { y: 0.12, size: 80, bg: 'rgba(120,40,140,0.88)' });
    },
  },
  {
    name: 'rainbow topples', start: 'b02.w5-0.08', set: 'town',
    setup(ctx) {
      town(ctx, 'dusk');
      townColour(ctx, { grey: () => 1 });
      const P = ctx.props; ctx.add(P.disc, ctx.set.root); P.disc.position.set(-30, 0.004, 0); P.disc.scale.setScalar(200); P.disc.material.color.set('#8a8a88');
      addTo(ctx, P.arch, -55, 0, -14, yawTo(-55, -14, -42, 3)); P.bakery.userData.grey(1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tc = ctx.time('b02.w5');
      skyMood(ctx, 'pink', 1);
      const crack = clamp((t - tc) / 0.25, 0, 1), fall = ease.inQuad(clamp((t - tc - 0.25) / 0.75, 0, 1));
      P.arch.userData.set(t, { crack, fall });
      setCam(ctx, { pos: L(-41.5, 0.6, 3.2), look: L(-52, 9.5, -11), fov: 62 });
      shakeOn(ctx, [tc], 0.45, 0.3, 3); shakeOn(ctx, [tc + 1.0], 1.0, 0.5, 4);
      pop(ctx, tc, 0.1, '#ffffff', 0.3);
      ctx.fx.overlay('#ff9ad0', 0.07);
      tag(ctx, '50 YEARS AGO', ctx.time('b02') + 0.05, Infinity, { y: 0.12, size: 80, bg: 'rgba(120,40,140,0.88)', scale: 1 });
    },
  },
  // ── "and every colour we have spilled out of it."  — a burst of glowing cubes paints the grey houses
  {
    name: 'colour burst', start: 'b02.w9-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk');
      const P = ctx.props, t0 = ctx.time('b02.w9') - 0.1;
      const targets = SLOTS.map((s) => s);
      P.swarm.userData.plan((i) => {
        const s = targets[i % targets.length], x1 = s.x + (hash(i * 1.3) - 0.5) * s.w, y1 = 1 + hash(i * 2.9) * 8, z1 = s.z + (s.yaw === 0 ? 3.6 : -3.6) + (hash(i * 5.1) - 0.5) * 3;
        const p0 = L(-52 + (hash(i * 7.7) - 0.5) * 6, 1 + hash(i * 3.3) * 3, -10 + (hash(i * 8.8) - 0.5) * 6);
        const p1 = L(x1, y1, z1), dist = p0.distanceTo(p1);
        return { p0, p1, t0: t0 + 0.25 * hash(i * 9.1), dur: 0.35 + dist / 42, h: 6 + 14 * hash(i * 4.4), s: 0.7 + 0.8 * hash(i * 6.6), spin: 7, hold: 0.25 };
      });
      ctx.add(P.swarm); P.swarm.position.set(0, 0, 0); ctx.store.t0 = t0;
      const D = P.disc; ctx.add(D, ctx.set.root); D.position.set(-30, 0.004, 0); D.scale.setScalar(200); D.material.color.set('#8a8a88');
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, t0 = ctx.store.t0;
      skyMood(ctx, 'pink', lerp(1, 0.55, clamp((t - t0) / 1.6, 0, 1)));
      const front = -52 + 70 * clamp((t - t0 - 0.35) / 1.3, 0, 1);
      townColour(ctx, { grey: (x) => clamp((x - front) / 4, 0, 1) });
      P.bakery.userData.grey(clamp((-27 - front) / 4, 0, 1));
      P.disc.visible = front < 0; P.disc.material.color.set('#8a8a88');
      P.swarm.userData.set(t);
      moveCam(ctx, { pos: L(-4, 15, 15), look: L(-34, 2.5, -5), fov: 62 }, { pos: L(-6, 13, 13), look: L(-30, 3.0, -4), fov: 60 }, lt / 1.9);
      shakeOn(ctx, [t0], 0.5, 0.4, 2);
      ctx.fx.overlay('#ff9ad0', 0.05);
    },
  },
  // ── b03 "There's no more where that came from."  — the colour market
  {
    name: 'colour market', start: 'b03-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx, { stands: false });
      ctx.store.cr = crowd(ctx, [X[6], X[7], X[8], X[9], 'kid'], [[32.8, 0, -6.4, PI / 2 - 0.2], [32.6, 0, -7.6, PI / 2 + 0.4], [33.0, 0, 5.4, PI / 2 + 0.3], [31.6, 0, 4.4, PI / 2 - 0.5], [33.3, 0, -3.1, PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      P.stalls.forEach((s) => s.userData.set(t)); P.fountain.userData.set(t);
      ctx.store.cr.forEach((c, i) => { c.ch.pose(i === 3 ? 'shrug' : i === 2 ? 'point' : 'idle', t + c.ph, { intensity: 0.5 }); c.ch.face(i === 3 ? 'sad' : 'smile', t + c.ph); });
      moveCam(ctx, { pos: L(26.0, 2.3, 2.6), look: L(35, 1.5, -1.6), fov: 52 }, { pos: L(27.4, 2.0, 2.0), look: L(35, 1.5, -1.8), fov: 48 }, ease.inOutSine(clamp(lt / 1.8, 0, 1)));
    },
  },
  // ── "So colour is basically money."  — a kid counts out coins for one green cube
  {
    name: 'coins for green', start: 'b03.w7-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx, { stands: false });
      const P = ctx.props;
      put(ctx, 'kid', L(33.35, 0, -3.15), L.yaw + PI / 2);
      addTo(ctx, P.coins, 33.95, 1.03, -3.0); addTo(ctx, P.greenCube, 33.98, 1.14, -3.55); addTo(ctx, P.cubeGlow, 33.98, 1.14, -3.55);
      put(ctx, X[10], L(35.5, 0, -3.3), L.yaw - PI / 2);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, kid = ctx.cast.kid, v = ctx.cast[X[10]];
      P.stalls.forEach((s) => s.userData.set(t));
      const n = clamp(3 + Math.floor((t - ctx.time('b03.w7')) * 7), 3, 14); P.coins.userData.set(n);
      P.greenCube.rotation.set(0.3, t * 1.4, 0.2); P.greenCube.position.y = 1.16 + 0.03 * Math.sin(t * 3);
      kid.pose('idle', t, { intensity: 0.3, lookAt: L(33.95, 1.05, -3.0) }); kid.face('determined', t);
      const J = kid.joints, tap = Math.max(0, Math.sin(t * 14)); J.armR.rotation.set(-1.0 - 0.15 * tap, 0, 0.2); J.foreArmR.rotation.set(-0.5, 0, 0); J.armL.rotation.set(-0.9, 0, -0.1); J.foreArmL.rotation.set(-0.6, 0, 0);
      v.pose('crossArms', t); v.face('smug', t);
      moveCam(ctx, { pos: L(35.2, 1.45, -1.6), look: L(33.6, 1.05, -3.1), fov: 40 }, { pos: L(34.9, 1.4, -2.0), look: L(33.6, 1.05, -3.1), fov: 38 }, lt / 1.6, 0);
      tag(ctx, 'COLOUR = MONEY', ctx.time('b03.w11'), Infinity, { y: 0.13, bg: 'rgba(30,120,50,0.9)' });
    },
  },
  // ── b04 "When the mayor painted his house purple,"
  {
    name: 'mayor purple house', start: 'b04-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'mayor', L(9, 0, -8.6), L.yaw);
      walkers(ctx, [[X[11], 6, -5.6, 1, 0.8], [X[12], 12, 5.8, -1, 1]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, m = ctx.cast.mayor, tp = ctx.markers.purple;
      animWalkers(ctx, 6);
      const u = ease.inOutCubic(clamp((t - tp) / 0.55, 0, 1));
      townColour(ctx, { paint: { [MAYOR]: { c: '#9b4fe0', roof: '#5a1f9a', u } } });
      if (t < tp + 0.6) { m.pose('idle', t); m.face('smile', t); } else { m.pose('crossArms', t); m.face('smug', t); }
      moveCam(ctx, { pos: L(10.6, 0.5, -2.6), look: L(9.0, 3.4, -11), fov: 54 }, { pos: L(10.2, 0.55, -3.4), look: L(9.0, 3.6, -11), fov: 52 }, lt / 2);
      if (t > tp && t < tp + 0.6) ctx.cam.shake(0.15, t, 5);
    },
  },
  // ── "every grape in town went grey."  — the fruit stall drains; a shopper holds one up, disgusted
  {
    name: 'grey grapes', start: 'grapes-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      townColour(ctx, { paint: { [MAYOR]: { c: '#9b4fe0', roof: '#5a1f9a' } } });
      addTo(ctx, ctx.props.fruit, FRUIT.x, 0.12, FRUIT.z, 0); ctx.props.fruit.userData.grapes.userData.grey(0);
      put(ctx, X[0], L(13.05, 0.12, -5.4), L.yaw - 0.55);
      ctx.add(ctx.props.bunch); ctx.props.bunch.userData.grey(0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, s = ctx.cast[X[0]], tg = ctx.markers.grapes;
      const u = clamp((t - tg) / 0.6, 0, 1);
      P.fruit.userData.grapes.userData.grey((p) => clamp(u * 2.4 - (p.x + 0.35) / 0.7, 0, 1));
      P.bunch.userData.grey(clamp(u * 1.4, 0, 1));
      holdFront(s, t, 0.9, 0.25); s.joints.armL.rotation.set(-0.3, 0, -0.2); s.joints.foreArmL.rotation.set(-0.3, 0, 0);
      s.face(t > tg + 0.45 ? 'squint' : 'smile', 0.4);
      const h = jointPos(s, 'handR'); P.bunch.position.copy(h).add(up(-0.02)); P.bunch.rotation.set(0, 0, 0); P.bunch.scale.setScalar(1.6);
      moveCam(ctx, { pos: L(12.0, 1.4, -1.6), look: L(12.4, 1.15, -5.6), fov: 46 }, { pos: L(12.2, 1.4, -2.2), look: L(12.5, 1.2, -5.6), fov: 44 }, lt / 1.4);
      tag(ctx, 'PURPLE: 0 LEFT', tg + 0.1, Infinity, { y: 0.13, size: 76, bg: 'rgba(110,40,170,0.9)' });
    },
  },
  // ── b05 HUSS ×3 — me next to the grey grapes, the mayor shrugs in the background
  ...[0, 1, 2].map((i) => ({
    name: `grape huss #${i + 1}`, start: H('b05', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      townColour(ctx, { paint: { [MAYOR]: { c: '#9b4fe0', roof: '#5a1f9a' } } });
      addTo(ctx, ctx.props.fruit, FRUIT.x, 0.12, FRUIT.z, 0); ctx.props.fruit.userData.grapes.userData.grey(1);
      put(ctx, 'me', L(12.9, 0.12, -4.9), L.yaw - 0.15);
      put(ctx, 'mayor', L(8.4, 0, -8.0), L.yaw + 0.3);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, hits = hussHits(ctx, 'b05'), me = ctx.cast.me, m = ctx.cast.mayor;
      const h = lastBefore(hits, t);
      me.pose('slam', t, { hits, tableY: 0.95, slamZ: 0.4 }); me.face(h != null && t - h < 0.2 ? 'huss' : 'determined', t);
      m.pose('shrug', t); m.face('smug', t);
      const cams = [
        { pos: L(13.6, 0.8, -1.7), look: L(12.6, 1.5, -5.6), fov: 46 },
        faceCam(me, 1.9, -0.55, 0.36, 34),
        { pos: L(15.4, 2.6, 1.8), look: L(11.0, 1.3, -6.4), fov: 48 },
      ];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.1, 0.2);
    },
  })),
  // ── b06 "Only Grandma Mabel doesn't care."  — knitting on her porch, rocking chair
  {
    name: 'mabel porch', start: 'b06-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { lamps: MABEL_HIDE });
      mabelPorch(ctx);
      addTo(ctx, ctx.props.post, 1.6, 0.12, 7.7, 0);
      const pg = put(ctx, 'pigeon', L(1.6, 1.18, 7.7), L.yaw + PI + 0.4);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, m = ctx.cast.mabel;
      knitPose(m, t); m.face('smile', 1.0); rock(ctx, m, t);
      ctx.cast.pigeon.pose('idle', t); ctx.cast.pigeon.face('neutral', t);
      moveCam(ctx, { pos: L(1.4, 1.75, 3.6), look: L(-0.9, 1.0, 9.0), fov: 46 }, { pos: L(0.5, 1.55, 5.0), look: L(-0.9, 1.05, 9.0), fov: 44 }, ease.inOutSine(clamp(lt / 2.8, 0, 1)));
    },
  },
  // ── "She's worn the same black cardigan since the day it fell."  — close-up, she looks up and winks
  {
    name: 'mabel wink', start: 'b06.w5-0.12', set: 'town',
    setup(ctx) { town(ctx, 'day', { lamps: MABEL_HIDE }); mabelPorch(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, m = ctx.cast.mabel, tl = ctx.time('b06.w13') - 0.1, tw = ctx.time('b06.w14');
      const look = ease.inOutCubic(clamp((t - tl) / 0.35, 0, 1));
      knitPose(m, t, look); rock(ctx, m, t);
      m.face(t > tw ? 'wink' : look > 0.5 ? 'smile' : 'neutral', t > tw ? 0.5 : 1.0);
      const c = faceCam(m, 1.85, 0.3, 0.34, 34, -0.1);
      const c2 = { ...c, pos: c.pos.clone().lerp(humanFace(m), 0.15) };
      moveCam(ctx, c, c2, lt / 2.2);
      tag(ctx, 'SINCE DAY ONE', ctx.time('b06.w11'), Infinity, { y: 0.13, size: 72, bg: 'rgba(29,29,34,0.92)' });
    },
  },
  // ── b07 "Then last week, colours started vanishing that nobody had used."  — the park drains at dusk
  {
    name: 'park drains', start: 'b07-0.12', set: 'town',
    setup(ctx) { town(ctx, 'dusk'); ctx.props.disc.material.color.set('#9a9a98'); addTo(ctx, ctx.props.sparks, -53, 2, -10); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, t0 = ctx.time('b07.w3');
      const r = 34 * ease.inOutSine(clamp((t - t0) / 2.4, 0, 1));
      parkGrey(ctx, r);
      ctx.props.sparks.userData.set(t, 0.7 * (1 - clamp((t - t0) / 1.8, 0, 1)));
      moveCam(ctx, { pos: L(-45.5, 2.4, -0.8), look: L(-54, 2.2, -12), fov: 52 }, { pos: L(-46.0, 2.6, -1.8), look: L(-56.5, 2.4, -16), fov: 52 }, ease.inOutSine(clamp(lt / 3.4, 0, 1)));
      tag(ctx, 'MONDAY: THE PARK', ctx.time('b07') + 0.05, Infinity, { y: 0.13, size: 70 });
    },
  },
  // ── b08 "Tuesday, the bakery."
  {
    name: 'bakery drains', start: 'b08-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      ctx.store.cr = crowd(ctx, [X[13]], [[-24.6, 0.12, -6.4, PI + 0.35]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, t0 = ctx.time('b08.w2') - 0.1;
      const front = lerp(11, -1.5, ease.inOutSine(clamp((t - t0) / 0.8, 0, 1)));
      ctx.props.bakery.userData.grey((p) => clamp((p.y - front) / 1.2, 0, 1));
      const c = ctx.store.cr[0]; c.ch.pose(t > t0 + 0.3 ? 'surprised' : 'idle', t > t0 + 0.3 ? 0.35 : t); c.ch.face(t > t0 + 0.3 ? 'shocked' : 'smile', 0.3);
      moveCam(ctx, { pos: L(-23.8, 1.5, -0.8), look: L(-27, 3.8, -10.5), fov: 54 }, { pos: L(-24.3, 1.5, -1.8), look: L(-27, 3.9, -10.5), fov: 52 }, lt / 1.6);
      tag(ctx, 'TUESDAY: THE BAKERY', ctx.time('b08') + 0.05, Infinity, { y: 0.13, size: 64 });
    },
  },
  // ── "Wednesday, the whole sky."  — the sky flattens to dead grey, everyone freezes and looks up
  {
    name: 'sky drains', start: 'b08.w3-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      ctx.store.cr = crowd(ctx, [X[1], X[2], X[3], X[4], X[5]], [[-8.6, 0.12, -5.6, 0.3], [-11.0, 0.12, -6.4, 0.1], [-13.4, 0.12, -5.5, -0.2], [-9.9, 0, -2.8, 0.6], [-12.6, 0, -1.4, 0.2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, t0 = ctx.time('b08.w3');
      const k = ease.inOutCubic(clamp((t - t0 - 0.1) / 0.6, 0, 1));
      skyMood(ctx, 'grey', k);
      ctx.store.cr.forEach((c, i) => { if (t < t0 + 0.25) { c.ch.pose('walk', t + c.ph, { speed: 0.6 }); c.ch.face('smile', t); } else { lookUp(c.ch, t, 1, c.ph); c.ch.face('shocked', 0.4); } });
      moveCam(ctx, { pos: L(-5.4, 0.6, 2.6), look: L(-12.5, 6.2, -4), fov: 60 }, { pos: L(-5.8, 0.55, 2.2), look: L(-12.5, 7.4, -4), fov: 60 }, lt / 1.7);
      tag(ctx, 'WEDNESDAY: THE SKY', t0, Infinity, { y: 0.13, size: 64, bg: 'rgba(80,80,86,0.92)' });
    },
  },
  // ── b09 "Everyone blamed everyone."  — a shouting crowd at the stage, all pointing at each other
  {
    name: 'blame crowd', start: 'b09-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx, { stalls: true, stands: true });
      put(ctx, 'mayor', L(51.0, 0.8, 1.0), L.yaw - PI / 2);
      ctx.store.cr = crowd(ctx, [X[14], X[15], X[16], X[17], X[6], X[7]], [[44.6, 0, 3.6, 1.2], [46.0, 0, 4.4, -2.2], [45.4, 0, 1.6, 0.6], [47.0, 0, 2.4, -1.9], [44.2, 0, 5.8, 0.4], [46.6, 0, 6.2, -2.8]]);
      filler(ctx, ringFill(40, 51, 0, 3.2, 7.5, PI * 0.55, PI * 1.45, 5, (x, z) => x < 44 || (x < 48 && z > 1)));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      skyMood(ctx, 'grey', 1);
      ctx.props.fountain.userData.set(t); ctx.props.filler.userData.set(t, { arms: 'cheer', bounce: 0.6, speed: 1.4 });
      const m = ctx.cast.mayor; m.pose('shrug', t); m.face('sweat', t);
      ctx.store.cr.forEach((c, i) => { c.ch.pose(i % 3 === 2 ? 'pointLaugh' : 'point', t * 1.3 + c.ph, {}); c.ch.face(i % 2 ? 'determined' : 'shocked', t + c.ph); });
      moveCam(ctx, { pos: L(41.8, 2.0, 9.0), look: L(48.0, 1.5, 0.5), fov: 54 }, { pos: L(42.6, 1.9, 8.4), look: L(48.0, 1.6, 0.6), fov: 52 }, lt / 1.5);
      shakeOn(ctx, [ctx.time('b09.w1'), ctx.time('b09.w2')], 0.25, 0.25, 6);
    },
  },
  // ── "Mrs. Kaur painted her door grey just to prove it wasn't her."
  {
    name: 'kaur grey door', start: 'b09.w3-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { lamps: DOOR_HIDE });
      const k = put(ctx, 'kaur', L(-16.1, 0.12, 9.5), L.yaw + PI + 0.25);
      const R = ctx.props.roller; ctx.add(R, k.joints.handR); R.position.set(0, 0, 0); R.rotation.set(0.25, 0, 0.1); R.scale.set(1, 0.6, 1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, k = ctx.cast.kaur;
      skyMood(ctx, 'grey', 1);
      kaurDoor(ctx, { u: 1, color: '#8d8d8b', wet: 0.6 });
      k.pose('crossArms', t); k.face(t > ctx.time('b09.w11') ? 'smug' : 'determined', t);
      k.joints.armR.rotation.x -= 0.1;
      moveCam(ctx, { pos: L(-14.4, 1.3, 6.0), look: L(-15.6, 1.2, 9.9), fov: 46 }, { pos: L(-15.0, 1.4, 7.2), look: L(-15.7, 1.35, 9.9), fov: 40 }, ease.inOutSine(clamp(lt / 3.6, 0, 1)));
      tag(ctx, 'NOT ME!', ctx.time('b09.w11'), Infinity, { y: 0.13, size: 80, bg: 'rgba(60,60,66,0.92)' });
    },
  },
  // ── b10 "So I marked every grey spot on a map."  — my room at night
  {
    name: 'map at night', start: 'b10-0.12', set: 'room',
    setup(ctx) {
      const R = deskRoom(ctx), P = ctx.props, me = ctx.cast.me;
      ctx.add(P.pencil, me.joints.handR); P.pencil.position.set(0, -0.02, 0.04); P.pencil.rotation.set(1.2, 0, 0); P.pencil.scale.setScalar(1);
      P.map.userData.set(3);
    },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      me.pose('sit', t, { hands: 'table', tableY: 0.78, tableZ: 0.42 }); me.face('determined', t);
      const tap = Math.max(0, Math.sin(t * 9)); me.joints.armR.rotation.x -= 0.15 * tap; me.joints.head.rotation.x += 0.35;
      P.map.userData.set(3 + Math.floor(clamp((t - ctx.time('b10')) / 1.4, 0, 1) * 2));
      moveCam(ctx, { pos: R(1.5, 1.7, 2.4), look: R(0, 0.95, -0.1), fov: 44 }, { pos: R(1.1, 1.6, 1.9), look: R(0, 1.0, -0.1), fov: 42 }, lt / 1.8, 1.0, '#ffe0b0', 8);
    },
  },
  // ── "And they made a line."  — top-down on the map: the dots line up
  {
    name: 'map line', start: 'b10.w8-0.12', set: 'room',
    setup(ctx) { deskRoom(ctx); const P = ctx.props; ctx.add(P.pencil); P.pencil.scale.setScalar(1.6); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      me.pose('sit', t, { hands: 'table', tableY: 0.78 }); me.face('determined', t);
      const tl = ctx.time('b10.w9'), tf = ctx.time('b10.w13') + 0.1;
      const nd = 5 + (t > ctx.time('b10.w8') + 0.15 ? 1 : 0);
      const line = clamp((t - tl) / (tf - tl), 0, 1);
      P.map.userData.set(nd, line);
      const pi = line > 0 ? null : 5;
      const p = pi != null ? mapDot(ctx, pi) : mapDot(ctx, 5).lerp(mapDot(ctx, 5), 0);
      P.pencil.position.copy(p).add(V(0.05, 0.14 + 0.03 * Math.max(0, Math.sin(t * 12)), 0.06)); P.pencil.rotation.set(0.35, 0, -0.3);
      moveCam(ctx, { pos: R(0.02, 2.0, 0.95), look: R(0, 0.78, 0.18), fov: 40 }, { pos: R(0.02, 1.75, 0.8), look: R(0, 0.78, 0.18), fov: 40 }, lt / 1.6, 0.9, '#ffe0b0', 6);
      if (line >= 1) { stamp(ctx, 'A LINE', tf, { y: 0.2, size: 110, fill: '#ffffff', stroke: '#1d1d22', rot: -0.06 }); }
    },
  },
  // ── b11 "Down Main Street. Through the park. Past the bakery. Straight to my front door."  — drone over the grey trail
  ...[
    { name: 'drone main street', start: 'main-0.12', u0: 0.0, u1: 0.42, label: 'MAIN STREET' },
    { name: 'drone park', start: 'park-0.12', u0: 0.42, u1: 0.66, label: 'THE PARK' },
    { name: 'drone bakery', start: 'b11.w6-0.12', u0: 0.66, u1: 0.86, label: 'THE BAKERY' },
  ].map((S, si) => ({
    name: S.name, start: S.start, set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { lamps: HOME_HIDE });
      addTo(ctx, ctx.props.trail, 0, 0, 0);
      parkGrey(ctx, 40); ctx.props.bakery.userData.grey(1); ctx.props.disc.material.color.set('#9a9a98');
      walkers(ctx, [[X[0], -6, -6.0, 1, 0.9], [X[1], 4, 6.0, -1, 1], [X[2], -14, 6.1, 1, 0.8]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, Tr = P.trail.userData;
      skyMood(ctx, 'grey', 1); animWalkers(ctx, 7);
      const dur = Math.max(0.5, ctx.shotEnd ? ctx.shotEnd - ctx.time(S.start) : 1.1);
      const u = lerp(S.u0, S.u1, clamp(lt / 1.1, 0, 1));
      Tr.set(u);
      const [hx, hz, yw] = Tr.at(u);
      const fx = Math.sin(yw), fz = Math.cos(yw);
      setCam(ctx, { pos: L(hx - fx * 9, 30, hz - fz * 9 + 0.01), look: L(hx + fx * 4, 0, hz + fz * 4), fov: 50 });
      tag(ctx, S.label, ctx.time(S.start) + 0.12, Infinity, { y: 0.13, size: 74, bg: 'rgba(60,60,66,0.9)' });
      void dur;
    },
  })),
  {
    name: 'drone drops to my door', start: 'door-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { lamps: HOME_HIDE });
      addTo(ctx, ctx.props.trail, 0, 0, 0); ctx.props.bakery.userData.grey(1);
      const a = ctx.anchor('myHouse.door'), F = (x, y, z) => a.localToWorld(V(x, y, z));
      put(ctx, 'me', F(0, 0, -0.7), yawOf(a)); ctx.store.F = F;
    },
    update(ctx, lt) {
      const L = ctx.store.L, F = ctx.store.F, t = ctx.t, P = ctx.props, me = ctx.cast.me, td = ctx.time('b11.w13');
      skyMood(ctx, 'grey', 1);
      P.trail.userData.set(lerp(0.86, 1, clamp(lt / 0.8, 0, 1)));
      me.pose('idle', t); me.face(t > td ? 'shocked' : 'neutral', 0.4);
      const k = ease.inOutCubic(clamp(lt / 1.0, 0, 1));
      moveCam(ctx, { pos: F(0, 28, 9), look: F(0, 0, -1.2), fov: 50 }, { pos: F(0.5, 1.15, 4.6), look: F(0, 1.25, -0.6), fov: 42 }, k);
      stamp(ctx, 'FOUND!', td, { y: 0.22, size: 160 });
    },
  },
  // ── b12 HUSS ×6 — me in the doorway, looking down at my own hoodie, the camera spirals in
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `hoodie realisation #${i + 1}`, start: H('b12', i), set: 'town',
    setup(ctx) {
      town(ctx, 'day', { lamps: HOME_HIDE });
      addTo(ctx, ctx.props.trail, 0, 0, 0); ctx.props.trail.userData.set(1);
      const a = ctx.anchor('myHouse.door'), F = (x, y, z) => a.localToWorld(V(x, y, z));
      put(ctx, 'me', F(0, 0, -0.7), yawOf(a)); ctx.store.F = F;
    },
    update(ctx) {
      const F = ctx.store.F, t = ctx.t, me = ctx.cast.me, hits = hussHits(ctx, 'b12'), h = lastBefore(hits, t);
      skyMood(ctx, 'grey', 1);
      const look = clamp(0.2 + i * 0.17, 0, 1);
      me.pose('stunned', t, { headPitch: 0.55 * look }); me.face(h != null && t - h < 0.18 ? 'huss' : 'shocked', 0.3);
      me.joints.armL.rotation.z = -0.3; me.joints.armR.rotation.z = 0.3;
      const r = [5.0, 4.1, 3.3, 2.7, 2.2, 1.8][i], a = [-0.55, 0.45, -0.3, 0.3, -0.15, 0.1][i], hgt = [1.0, 1.1, 1.05, 1.15, 1.2, 1.25][i];
      setCam(ctx, { pos: F(Math.sin(a) * r, hgt, -0.7 + Math.cos(a) * r), look: F(0, 1.25 + i * 0.04, -0.7), fov: 40 - i * 1.2 });
      ctx.cam.punch(hits, t, 0.1, 0.2); shakeOn(ctx, hits, 0.35, 0.25, 11);
    },
  })),
  // ── b13 "I'd been everywhere, right before it went grey."  — three quick flashes
  {
    name: 'flash bakery', start: 'b13-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'me', L(-26.2, 0.12, -6.6), L.yaw + 0.3);
      const d = ctx.props.donut; ctx.add(d, ctx.cast.me.joints.handR); d.position.set(0, -0.02, 0.06); d.rotation.set(0.3, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, t0 = ctx.time('b13');
      skyMood(ctx, 'grey', 0);
      const w = clamp(lt - 0.15, 0, 1);
      me.root.position.copy(L(-26.2 + 0.5 * w, 0.12, -6.6 + 1.4 * w));
      me.pose('walk', t, { speed: 1 }); me.face('grin', t);
      me.joints.armR.rotation.set(-1.4, 0, 0.25); me.joints.foreArmR.rotation.set(-1.2, 0, 0);
      ctx.props.bakery.userData.grey(sm((t - t0 - 0.25) / 0.35));
      setCam(ctx, { pos: L(-24.0, 1.4, -1.2), look: L(-26.6, 2.6, -8.5), fov: 54 });
      pop(ctx, ctx.time('b13') - 0.12, 0.12, '#ffffff', 0.6);
    },
  },
  {
    name: 'flash park', start: 'b13.w2-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const a = ctx.anchor('park.stool1');
      put(ctx, 'me', a.getWorldPosition(V()), yawOf(a) + 0.7);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, t0 = ctx.time('b13.w2');
      const u = clamp((lt - 0.15) / 0.35, 0, 1);
      me.pose('sitStand', t, { u }); me.face('smile', t);
      parkGrey(ctx, 40 * sm((lt - 0.4) / 0.35), { cx: PARK.x, cz: PARK.z, soft: 4 });
      setCam(ctx, { pos: L(-49.6, 1.3, -5.6), look: L(-53.0, 1.3, -10.6), fov: 52 });
      pop(ctx, ctx.time('b13.w2') - 0.15, 0.12, '#ffffff', 0.6);
    },
  },
  {
    name: 'flash sky', start: 'b13.w5-0.08', set: 'town',
    setup(ctx) { const L = town(ctx, 'day'); put(ctx, 'me', L(-10.8, 0, -0.6), L.yaw); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      const walk = clamp((lt - 0.3) / 0.6, 0, 1);
      if (walk <= 0) { me.pose('idle', t, { headPitch: -0.6 }); me.face('smile', 1.0); }
      else { me.root.position.copy(L(-10.8 + 1.6 * walk, 0, -0.6 + 0.3 * walk)); me.root.rotation.set(0, L.yaw + PI / 2 * Math.min(1, walk * 3), 0); me.pose('walk', t); me.face('smile', t); }
      skyMood(ctx, 'grey', sm((lt - 0.4) / 0.35));
      setCam(ctx, { pos: L(-9.2, 0.5, 3.2), look: L(-11.0, 3.6, -2.0), fov: 58 });
      pop(ctx, ctx.time('b13.w5') - 0.08, 0.12, '#ffffff', 0.6);
    },
  },
  // ── b14 "Black soaks up light. Every colour. That's science."  — colour cubes sucked into the hoodie
  ...[0, 1].map((i) => ({
    name: `hoodie vacuum #${i + 1}`, start: i === 0 ? 'b14-0.12' : 'b14.w4-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const me = put(ctx, 'me', L(-13.2, 0.12, -6.2), L.yaw + 0.15);
      me.pose('idle', 0); const chest = jointPos(me, 'torso', [0, 0.28, 0.2]);
      const P = ctx.props, t0 = ctx.time('b14') - 0.3;
      P.mini.userData.plan((k) => {
        const p0 = L(-18.5 + hash(k * 1.3) * 7.5, 1 + hash(k * 2.9) * 5, -10.35);
        return { p0, p1: chest.clone().add(V((hash(k) - 0.5) * 0.1, (hash(k * 3) - 0.5) * 0.1, 0)), t0: t0 + (k / 160) * 3.4, dur: 0.9 + 0.4 * hash(k * 5.5), h: 0.8 * hash(k * 7.1), s: 1.2, spin: 5, hold: 0.02, shrink: true, ease: ease.inQuad };
      });
      ctx.add(P.mini); P.mini.position.set(0, 0, 0);
      const g = P.glint; ctx.add(g); g.position.copy(chest).add(V(0, 0, 0.05));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, P = ctx.props, t0 = ctx.time('b14');
      skyMood(ctx, 'grey', 1);
      P.mini.userData.set(t);
      townColour(ctx, { grey: (x, y, z) => (x > -20 && x < -10 && z < -9 ? 0.55 * clamp((t - t0) / 3, 0, 1) : 0) });
      me.pose('idle', t, { intensity: 0.3, headPitch: 0.3 }); me.face('shocked', 0.4);
      P.glint.scale.setScalar(0.25 + 0.15 * Math.abs(Math.sin(t * 6)));
      const cams = [
        { a: { pos: L(-11.4, 1.05, -2.6), look: L(-13.6, 1.4, -7.2), fov: 46 }, b: { pos: L(-11.7, 1.05, -3.1), look: L(-13.6, 1.45, -7.2), fov: 44 } },
        { a: { pos: L(-12.6, 1.05, -4.5), look: L(-13.15, 1.25, -6.2), fov: 38 }, b: { pos: L(-12.7, 1.1, -4.8), look: L(-13.15, 1.3, -6.2), fov: 36 } },
      ][i];
      moveCam(ctx, cams.a, cams.b, lt / 1.8);
      tag(ctx, 'BLACK ABSORBS\nEVERY COLOUR', ctx.time('b14') + 0.05, Infinity, { y: 0.14, size: 58 });
      if (i === 1) stamp(ctx, 'SCIENCE', ctx.time('b14.w7'), { y: 0.3, size: 110, fill: '#ffd23f', stroke: '#1d1d22', rot: 0.08 });
    },
  })),
  // ── b15 "And I haven't taken this hoodie off in five years."  — me facing the crowd, pointing at the hoodie
  {
    name: 'suspect me', start: 'b15-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { lamps: HOME_HIDE });
      const a = ctx.anchor('myHouse.front'); put(ctx, 'me', a.getWorldPosition(V()), yawOf(a));
      ctx.store.cr = crowd(ctx, [X[0], X[1], X[2], X[3], X[4], 'mayor'], [[-28.8, 0.12, 5.0, 0.15], [-25.4, 0.12, 5.4, -0.2], [-29.6, 0, 3.4, 0.35], [-24.2, 0, 3.6, -0.4], [-27.6, 0, 2.6, 0.05], [-26.2, 0, 2.2, -0.1]]);
      addTo(ctx, ctx.props.post, -24.4, 0.12, 7.35, 0); put(ctx, 'pigeon', L(-24.4, 1.18, 7.35), L.yaw + PI);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      skyMood(ctx, 'grey', 1);
      pointSelf(me, t); me.face('grin', 0.5);
      ctx.store.cr.forEach((c) => { c.ch.pose('crossArms', t + c.ph); c.ch.face('squint', 0.5); });
      ctx.cast.pigeon.pose('idle', t); ctx.cast.pigeon.face('neutral', t);
      moveCam(ctx, { pos: L(-25.9, 1.95, 0.4), look: L(-27.0, 1.45, 8.2), fov: 42 }, { pos: L(-26.1, 1.9, 1.2), look: L(-27.0, 1.5, 8.2), fov: 40 }, lt / 1.6);
      tag(ctx, 'SUSPECT: ME', ctx.time('b15') + 0.05, Infinity, { y: 0.13, size: 82, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  {
    name: 'pigeon looks away', start: 'b15.w6-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { lamps: HOME_HIDE });
      const a = ctx.anchor('myHouse.front'); put(ctx, 'me', a.getWorldPosition(V()), yawOf(a));
      addTo(ctx, ctx.props.post, -24.4, 0.12, 7.35, 0); put(ctx, 'pigeon', L(-24.4, 1.18, 7.35), L.yaw + PI);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, p = ctx.cast.pigeon;
      skyMood(ctx, 'grey', 1);
      pointSelf(me, t); me.face('grin', 0.5);
      const k = ease.outCubic(clamp((lt - 0.35) / 0.25, 0, 1));
      p.pose('idle', t, { headYaw: 1.5 * k, headPitch: -0.2 * k }); p.face(k > 0.5 ? 'smug' : 'neutral', 0.5);
      setCam(ctx, { pos: L(-23.9, 1.32, 5.9), look: L(-24.6, 1.22, 7.6), fov: 38 });
      tag(ctx, 'SUSPECT: ME', ctx.time('b15') + 0.05, Infinity, { y: 0.13, size: 82, bg: 'rgba(200,0,40,0.92)', scale: 1 });
    },
  },
  // ── b16 "Then last week, Mom finally washed it."  — flashback in the laundry
  {
    name: 'mom washer', start: 'b16-0.12', set: 'room',
    setup(ctx) {
      const s = ctx.set; s.setLighting('day'); s.set('window', 'day'); s.exposure = 1.0;
      const R = T(ctx); ctx.store.R = R; ctx.store.L = R; const P = ctx.props;
      addTo(ctx, P.washer, -0.55, 0, -1.2, 0.25);
      put(ctx, 'mom', R(0.45, 0, -0.55), R.yaw - 0.55);
      ctx.add(P.hoodie);
    },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, P = ctx.props, mom = ctx.cast.mom, tw = ctx.markers.wash;
      P.washer.userData.set(clamp((t - ctx.time('b16.w3')) / 0.4, 0, 1), t);
      const pull = ease.inOutCubic(clamp((t - tw + 0.1) / 0.6, 0, 1));
      holdFront(mom, t, pull, 0.2); mom.face(t > tw + 0.4 ? 'shocked' : 'smile', 0.6);
      mom.joints.torso.rotation.y = lerp(0.5, 0, pull);
      const hl = jointPos(mom, 'handL'), hr = jointPos(mom, 'handR'), mid = hl.clone().add(hr).multiplyScalar(0.5);
      P.washer.updateMatrixWorld(true); const drum = P.washer.localToWorld(V(0, 0.42, 0.25));
      P.hoodie.position.copy(drum.clone().lerp(mid.add(up(0.05)), pull)); P.hoodie.rotation.set(0, R.yaw, 0); P.hoodie.scale.setScalar(lerp(0.3, 1, pull));
      P.hoodie.userData.set(t);
      moveCam(ctx, { pos: R(1.6, 1.6, 2.6), look: R(-0.05, 1.0, -0.8), fov: 46 }, { pos: R(1.2, 1.55, 2.1), look: R(0.0, 1.1, -0.8), fov: 44 }, lt / 2.3);
      tag(ctx, 'WASHED: 1ST TIME\nIN 5 YEARS', tw, Infinity, { y: 0.14, size: 58, bg: 'rgba(40,110,200,0.92)' });
    },
  },
  // ── "It came out empty. And thirsty."  — the hoodie: impossibly black, sparkles drift INTO it
  ...[0, 1].map((i) => ({
    name: `thirsty hoodie #${i + 1}`, start: i === 0 ? 'b16.w7-0.1' : 'thirsty-0.12', set: 'room',
    setup(ctx) {
      const s = ctx.set; s.setLighting('day'); s.set('window', 'day'); s.exposure = 1.0;
      const R = T(ctx); ctx.store.R = R; ctx.store.L = R; const P = ctx.props;
      addTo(ctx, P.washer, -0.55, 0, -1.2, 0.25); P.washer.userData.set(1, 0);
      put(ctx, 'mom', R(0.45, 0, -0.55), R.yaw - 0.55);
      ctx.add(P.hoodie);
      const mom = ctx.cast.mom; holdFront(mom, 0, 1, 0.2); mom.joints.torso.rotation.y = 0;
      const hl = jointPos(mom, 'handL'), hr = jointPos(mom, 'handR'); const mid = hl.add(hr).multiplyScalar(0.5).add(up(0.05));
      ctx.store.mid = mid;
      P.mini.userData.plan((k) => {
        const a = hash(k * 1.7) * PI * 2, r = 0.9 + hash(k * 2.3) * 0.9;
        const p0 = mid.clone().add(V(Math.cos(a) * r, -0.3 + (hash(k * 3.1) - 0.2) * 1.4, Math.sin(a) * r * 0.5 + 0.3));
        return { p0, p1: mid.clone().add(V(0, -0.32, 0.03)), t0: ctx.time('b16.w7') - 0.6 + (k / 160) * 3.0, dur: 0.8 + 0.5 * hash(k * 5.5), h: 0.1, s: 0.8, spin: 4, hold: 0.02, shrink: true, ease: ease.inCubic };
      });
      ctx.add(P.mini); P.mini.position.set(0, 0, 0);
    },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, P = ctx.props, mom = ctx.cast.mom, mid = ctx.store.mid;
      holdFront(mom, t, 1, 0.2); mom.joints.torso.rotation.y = 0; mom.face('shocked', 0.6);
      P.hoodie.position.copy(mid); P.hoodie.rotation.set(0, mom.root.rotation.y, 0); P.hoodie.scale.setScalar(1); P.hoodie.userData.set(t);
      P.mini.userData.set(t);
      const fw = V(Math.sin(mom.root.rotation.y), 0, Math.cos(mom.root.rotation.y));
      const c = [{ d: 1.9, d2: 1.6, fov: 40 }, { d: 1.45, d2: 1.15, fov: 38 }][i];
      const tgt = mid.clone().add(up(-0.12));
      moveCam(ctx, { pos: tgt.clone().addScaledVector(fw, c.d).add(up(-0.05)), look: tgt.clone().add(up(0.12)), fov: c.fov }, { pos: tgt.clone().addScaledVector(fw, c.d2).add(up(-0.05)), look: tgt.clone().add(up(0.14)), fov: c.fov }, lt / 1.2);
      ctx.fx.vignette(0.35);
      if (i === 0) tag(ctx, 'EMPTY', ctx.time('b16.w10'), Infinity, { y: 0.13, size: 80, bg: 'rgba(0,0,0,0.9)' });
      if (i === 1) stamp(ctx, 'THIRSTY', ctx.markers.thirsty, { y: 0.25, size: 150, fill: '#1d1d22', stroke: '#ffffff', rot: -0.1 });
    },
  })),
  // ── b17 "I tried wringing it out."
  {
    name: 'wringing', start: 'b17-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'me', L(-6.6, 0.12, -5.8), L.yaw + 0.1);
      ctx.add(ctx.props.sweat, ctx.cast.me.joints.head); ctx.props.sweat.position.set(0.32, 0.5, 0.2);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      skyMood(ctx, 'grey', 1);
      wring(me, t, 1); me.face(Math.sin(t * 4) > 0 ? 'huss' : 'determined', t);
      moveCam(ctx, { pos: L(-5.4, 1.15, -2.2), look: L(-6.6, 1.35, -5.8), fov: 44 }, { pos: L(-5.6, 1.15, -2.9), look: L(-6.6, 1.4, -5.8), fov: 42 }, lt / 1.4);
      ctx.cam.shake(0.12, t, 4, 3);
    },
  },
  // ── "Ah, almost… almost!"  — one blue drop falls and turns a single paving block blue
  {
    name: 'blue drop', start: 'almost-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'me', L(-6.6, 0.12, -5.8), L.yaw + 0.1);
      const P = ctx.props; addTo(ctx, P.block, -6.45, 0.125, -5.05, 0); ctx.add(P.drop); addTo(ctx, P.shock, -6.45, 0.16, -5.05, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, P = ctx.props, ta = ctx.markers.almost, tf = ctx.time('b17.w7');
      skyMood(ctx, 'grey', 1);
      wring(me, t, 0.6); me.face(t < tf + 0.1 ? 'determined' : 'grin', t);
      const hl = jointPos(me, 'handL'), hr = jointPos(me, 'handR'), hem = hl.add(hr).multiplyScalar(0.5).add(up(-0.08));
      const land = L(-6.45, 0.14, -5.05), fallT = tf - 0.25, hitT = tf;
      let p, s = 1;
      if (t < fallT) { const sw = clamp((t - ta + 0.2) / 1.0, 0, 1); p = hem.clone().add(up(-0.04 * sw + 0.02 * Math.sin(t * 9))); s = 0.4 + 0.6 * sw; }
      else if (t < hitT) { const u = (t - fallT) / (hitT - fallT); p = hem.clone().lerp(land, u * u); }
      else p = null;
      P.drop.visible = !!p; if (p) { P.drop.position.copy(p); P.drop.scale.set(s, s * 1.25, s); }
      const blue = t > hitT;
      P.block.material.color.set(blue ? '#2f8fff' : '#a8a8a6'); P.block.material.emissive.set(blue ? '#1f5fcf' : '#000000'); P.block.material.emissiveIntensity = blue ? 0.35 : 0;
      P.shock.rotation.x = -PI / 2; P.shock.scale.setScalar(0.3); P.shock.userData.set(t > hitT ? clamp((t - hitT) / 0.5, 0.001, 1.3) : 0, 1.4);
      setCam(ctx, { pos: L(-5.55, 0.55, -3.0), look: L(-6.45, 0.75, -5.3), fov: 54 });
      pop(ctx, hitT, 0.1, '#bfe0ff', 0.35);
      tag(ctx, 'AH, ALMOST...\nALMOST!', ta, Infinity, { y: 0.14, size: 64, bg: 'rgba(40,110,200,0.92)' });
    },
  },
  // ── b18 "So I cannonballed into the town fountain."
  {
    name: 'sprint', start: 'b18-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      ctx.store.cr = crowd(ctx, [X[6], X[7], X[8], X[9], 'kid', 'mayor'], [[38.2, 0, -4.8, PI * 0.95], [41.0, 0, -4.9, PI * 1.05], [43.6, 0, -3.8, PI * 1.25], [44.4, 0, 3.6, -PI * 0.3], [39.0, 0, 5.2, PI * 0.0], [43.0, 0, 5.0, -PI * 0.25]]);
      filler(ctx, ringFill(30, 40, 0, 6.5, 10, -PI * 0.8, PI * 0.7, 9, (x, z) => x < 35.5 || Math.abs(z) < 2));
      put(ctx, 'me', L(29, 0, -0.1), L.yaw + PI / 2);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      skyMood(ctx, 'grey', 1); P.fountain.userData.set(t); P.filler.userData.set(t, { arms: 'limp', bounce: 0.2 });
      ctx.store.cr.forEach((c) => { c.ch.pose('idle', t + c.ph); c.ch.face('neutral', t + c.ph); });
      const x = 29.0 + 4.6 * lt; me.root.position.copy(L(x, 0, -0.1)); me.root.rotation.set(0, L.yaw + PI / 2, 0);
      me.pose('walk', t, { speed: 4.2 }); me.face('determined', t);
      setCam(ctx, { pos: L(36.8, 1.4, 4.6), look: L(x - 0.5, 1.2, -0.1), fov: 50 });
    },
  },
  {
    name: 'cannonball', start: 'b18.w4-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      ctx.store.cr = crowd(ctx, [X[6], X[7], X[8], 'kid'], [[36.6, 0, -4.6, 0.25], [39.2, 0, -5.0, 0.0], [41.8, 0, -4.4, -0.35], [37.8, 0, -3.2, 0.1]]);
      put(ctx, 'me', L(34.4, 0, -0.1), L.yaw + PI / 2);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      skyMood(ctx, 'grey', 1); P.fountain.userData.set(t);
      const t0 = ctx.time('b18.w4') - 0.15, t1 = ctx.time('b19') - 0.25, u = clamp((t - t0) / (t1 - t0), 0, 1);
      const p = L(lerp(34.4, 37.7, u), 0.62 + 3.6 * 4 * u * (1 - u) - 0.62 * (u > 0.95 ? (u - 0.95) * 20 : 0), lerp(-0.1, 0.2, u));
      me.root.position.copy(p); me.root.rotation.set(0, L.yaw + PI / 2, 0); me.root.rotation.order = 'YXZ'; me.root.rotation.x = -0.8 * u;
      tuck(me, t, clamp(u * 4, 0, 1)); me.face('huss', 0.3);
      ctx.store.cr.forEach((c) => { shield(c.ch, t + c.ph, clamp((t - t0 - 0.1) / 0.25, 0, 1)); });
      const look = p.clone().add(up(0.4));
      setCam(ctx, { pos: L(35.2, 0.45, 4.2), look, fov: 60 });
    },
  },
  // ── b19 "The water turned rainbow and blasted every colour back where it belonged."
  {
    name: 'splash', start: 'b19-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      put(ctx, 'me', L(37.8, -1.15, 0.3), L.yaw - PI / 2 + 0.6);
      addTo(ctx, ctx.props.splash, 37.8, 0.6, 0.3);
      ctx.store.cr = crowd(ctx, [X[6], X[7], X[8]], [[36.6, 0, -4.6, 0.25], [39.2, 0, -5.0, 0.0], [41.8, 0, -4.4, -0.35]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, ti = ctx.time('b19') - 0.25, tr = ctx.time('b19.w2');
      const rb = clamp((t - tr) / 0.3, 0, 1);
      skyMood(ctx, 'grey', 1);
      P.fountain.userData.set(t, { rainbow: rb, jet: 1 + 0.8 * rb, geyser: 0.06 * rb });
      P.splash.userData.set(clamp(t - ti, 0, 2) * 1.2);
      me.pose('idle', t); me.face(t > tr ? 'grin' : 'shocked', 0.4);
      ctx.store.cr.forEach((c) => { c.ch.pose('surprised', 0.3); c.ch.face('shocked', 0.4); });
      setCam(ctx, { pos: L(32.4, 1.7, 4.2), look: L(38.4, 1.6, -0.2), fov: 50 });
      shakeOn(ctx, [ti], 0.9, 0.5, 9);
      pop(ctx, ti, 0.1, '#ffffff', 0.4);
    },
  },
  {
    name: 'rainbow geyser', start: 'rainbow-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      ctx.store.cr = crowd(ctx, [X[10], X[11], X[12]], [[33.4, 0, 6.8, 2.4], [35.0, 0, 7.6, 2.6], [32.2, 0, 8.4, 2.3]]);
      const P = ctx.props, t0 = ctx.markers.rainbow;
      P.rain.userData.plan((i) => {
        const a = hash(i * 1.3) * PI * 2, r = 4 + hash(i * 2.1) * 40;
        return { p0: L(40 + Math.cos(a) * 1.5, 30 + hash(i * 3.3) * 14, Math.sin(a) * 1.5), p1: L(40 + Math.cos(a) * r, 0.3, Math.sin(a) * r), t0: t0 + 0.25 + hash(i * 4.4) * 1.0, dur: 0.9 + 0.6 * hash(i * 5.5), h: 6 + 8 * hash(i * 6.6), s: 1.2, spin: 6, hold: 0.3 };
      });
      ctx.add(P.rain); P.rain.position.set(0, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, t0 = ctx.markers.rainbow;
      const g = ease.outCubic(clamp((t - t0 + 0.05) / 0.5, 0, 1));
      skyMood(ctx, 'grey', 1 - 0.3 * g);
      P.fountain.userData.set(t, { rainbow: 1, jet: 1.6, geyser: g, height: 42 });
      P.rain.userData.set(t);
      ctx.store.cr.forEach((c) => { lookUp(c.ch, t, 1, c.ph); c.ch.face('shocked', 0.4); });
      moveCam(ctx, { pos: L(33.6, 0.5, 9.2), look: L(39.0, 9, -1), fov: 64 }, { pos: L(33.2, 0.6, 9.8), look: L(39.4, 16, -1), fov: 66 }, ease.outCubic(clamp(lt / 0.8, 0, 1)));
      shakeOn(ctx, [t0], 0.8, 0.6, 13);
    },
  },
  {
    name: 'colour wave', start: 'wave-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx, { stalls: false });
      const P = ctx.props, t0 = ctx.markers.wave - 0.1;
      ctx.store.t0 = t0;
      P.rain.userData.plan((i) => {
        const x = 36 - (i / 420) * 100, z = (hash(i * 2.1) - 0.5) * 34;
        const tl = t0 + (36 - x) / 85;
        return { p0: L(x + 6, 16 + hash(i) * 10, z * 0.6), p1: L(x, 0.3 + hash(i * 3) * 6, z), t0: tl - 0.45, dur: 0.45, h: 2, s: 1.7, spin: 6, hold: 0.35 };
      });
      ctx.add(P.rain); P.rain.position.set(0, 0, 0);
      ctx.props.disc.material.color.set('#9a9a98');
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, t0 = ctx.store.t0;
      const front = 36 - 85 * clamp(t - t0, 0, 2);
      skyMood(ctx, 'grey', clamp((front + 10) / 40, 0, 1));
      P.fountain.userData.set(t, { rainbow: 1, jet: 1.6, geyser: 1, height: 42 });
      P.bakery.userData.grey(clamp((front + 27) / 4, 0, 1));
      if (front > -44) parkGrey(ctx, 40); else { parkGrey(ctx, 40 * clamp(1 - (-44 - front) / 15, 0, 1)); }
      P.rain.userData.set(t);
      moveCam(ctx, { pos: L(44, 24, 17), look: L(-4, 0, -4), fov: 56 }, { pos: L(42, 22, 16), look: L(-12, 0, -4), fov: 56 }, lt / 1.1);
    },
  },
  {
    name: 'truck back to red', start: 'b19.w8-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { lamps: [LAMP_AT(21, 5.15)] });
      truckAt(ctx); fireman(ctx, 18.4, 3.6, -PI / 2 - 1.0);
      const P = ctx.props, t0 = ctx.time('b19.w8') - 0.6;
      P.rain.userData.plan((i) => { const x = 10 + hash(i * 1.1) * 22, z = (hash(i * 2.2) - 0.5) * 16; return { p0: L(x, 14 + hash(i * 3) * 6, z), p1: L(x - 2, 0.2, z), t0: t0 + hash(i * 4.4) * 1.6, dur: 0.8, h: 0, s: 1, spin: 6, hold: 0.4 }; });
      ctx.add(P.rain); P.rain.position.set(0, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, f = ctx.cast.fireman, t0 = ctx.time('b19.w8');
      truckGrey(ctx, clamp((t - t0) / 0.8, 0, 1), -1);
      P.rain.userData.set(t);
      if (t > t0 + 0.5) { f.pose('cheer', t); f.face('grin', t); } else { f.pose('idle', t, { lookAt: L(22, 2.2, 1.6) }); f.face('shocked', 0.3); }
      moveCam(ctx, { pos: L(17.0, 1.3, -2.8), look: L(22.0, 2.0, 1.8), fov: 52 }, { pos: L(16.4, 1.4, -3.2), look: L(22.0, 2.1, 1.8), fov: 50 }, lt / 1.4);
    },
  },
  // ── b20 HUSS ×6 — the whole town dances in the rainbow spray
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `rainbow party #${i + 1}`, start: H('b20', i), set: 'town',
    setup(ctx) {
      const kaurShot = i === 1;
      const L = town(ctx, 'day', { lamps: kaurShot ? DOOR_HIDE : [] });
      if (!kaurShot) {
        square(ctx);
        ctx.store.cr = crowd(ctx, ['mayor', 'me', 'kid', 'fireman', X[6], X[7], X[8], X[9]], [[36.4, 0, 6.2, PI * 0.8], [33.6, 0, 3.2, PI * 0.6], [35.2, 0, 8.0, PI * 0.75], [43.8, 0, 5.8, -PI * 0.8], [44.2, 0, -4.8, -PI * 0.3], [38.6, 0, -5.6, 0.1], [35.6, 0, -4.6, PI * 0.25], [41.0, 0, 7.4, PI]]);
        const hm = ctx.props.helmet; ctx.add(hm, ctx.cast.fireman.joints.head); hm.position.set(0, 0.56, -0.02); hm.scale.setScalar(0.95);
        filler(ctx, ringFill(34, 40, 0, 6.5, 11, -PI, PI, 21, (x, z) => x < 36.5 && z > -3 && z < 9));
      } else {
        put(ctx, 'kaur', L(-16.25, 0.12, 9.55), L.yaw + PI + 0.35);
      }
      const P = ctx.props, tb = ctx.time('b20') - 0.6, cx = kaurShot ? -15 : 40, cz = kaurShot ? 7 : 0;
      P.rain.userData.plan((k) => { const a = hash(k * 1.3) * PI * 2, r = 1.5 + hash(k * 2.1) * 12; const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; return { p0: L(x, 14 + hash(k * 3) * 6, z), p1: L(x + 1, 0.2, z), t0: tb + hash(k * 4.4) * 2.6, dur: 0.9, h: 0, s: 0.8, spin: 6, hold: 0.3 }; });
      ctx.add(P.rain); P.rain.position.set(0, 0, 0);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, hits = hussHits(ctx, 'b20'), h = lastBefore(hits, t), near = h != null && t - h < 0.2;
      P.rain.userData.set(t);
      if (i === 1) {
        const k = ctx.cast.kaur, D = kaurDoor(ctx, { u: clamp(0.3 + (t - ctx.time('b20')) * 0.5, 0, 1) });
        rollPose(k, t); k.face(near ? 'huss' : 'laugh', t);
        aimRoller(ctx, k, D(-0.4 + 0.5 * clamp(0.3 + (t - ctx.time('b20')) * 0.5, 0, 1), 1.15 + 0.75 * Math.sin(t * 5.5)));
        setCam(ctx, { pos: L(-15.5, 1.35, 6.6), look: L(-15.7, 1.2, 9.9), fov: 44 });
      } else {
        P.fountain.userData.set(t, { rainbow: 1, jet: 1.6, geyser: 1, height: 42 });
        P.filler.userData.set(t, { arms: 'dance', bounce: 1, speed: 1.3 });
        ctx.store.cr.forEach((c, k) => { c.ch.pose(c.id === 'mayor' ? 'dance2' : (k % 2 ? 'dance' : 'dance2'), t + c.ph); c.ch.face(near && c.id === 'me' ? 'huss' : 'grin', t + c.ph); });
        const mayor = ctx.cast.mayor, me = ctx.cast.me;
        const cams = {
          0: { pos: L(37.6, 0.55, 8.6), look: L(36.4, 1.8, 6.2), fov: 50 },
          2: { pos: L(28.0, 5.5, 13.0), look: L(39.5, 3.0, 0), fov: 60 },
          3: faceCam(me, 2.1, 0.4, 0.36, 36),
          4: { pos: L(39.0, 1.3, 11.6), look: L(42.0, 1.4, 5.8), fov: 46 },
          5: { pos: L(24.0, 13.0, 20.0), look: L(40.0, 6.0, 0), fov: 62 },
        };
        setCam(ctx, cams[i]);
        void mayor;
      }
      ctx.cam.punch(hits, t, 0.1, 0.2);
    },
  })),
  // ── b21 "Then Grandma Mabel took off her cardigan. For the first time in fifty years."
  {
    name: 'square goes quiet', start: 'b21-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      ctx.store.cr = crowd(ctx, ['me', 'mayor', 'kid', X[6], X[7], X[8]], [[36.0, 0, 8.6, 2.5], [44.2, 0, 8.4, -2.6], [38.6, 0, 9.6, PI], [42.0, 0, 10.2, -2.9], [34.6, 0, 6.2, 2.1], [45.8, 0, 6.4, -2.2]]);
      put(ctx, 'mabel', L(40.2, 0, 9.0), L.yaw + PI);
      filler(ctx, ringFill(34, 40, 0, 7.5, 12, 0.15, PI - 0.15, 31));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, m = ctx.cast.mabel;
      P.fountain.userData.set(t, { rainbow: 0.4, jet: 1 }); P.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      const w = clamp(lt / 1.3, 0, 1);
      m.root.position.copy(L(40.2, 0, lerp(9.0, 4.6, w))); m.pose(w < 1 ? 'walk' : 'idle', t, { speed: 0.8 }); m.face('smile', 1.0);
      ctx.store.cr.forEach((c) => { c.ch.pose('idle', t + c.ph, { lookAt: humanFace(m) }); c.ch.face('neutral', 1.0); });
      moveCam(ctx, { pos: L(44.6, 1.7, 0.6), look: L(40.0, 1.1, 7.0), fov: 50 }, { pos: L(44.2, 1.6, 1.4), look: L(40.0, 1.15, 6.4), fov: 48 }, lt / 1.6);
      ctx.fx.vignette(0.3);
    },
  },
  {
    name: 'cardigan off', start: 'b21.w6-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      put(ctx, 'mabel', L(40.0, 0, 4.6), L.yaw); put(ctx, 'mabel2', L(40.0, 0, 4.6), L.yaw);
      ctx.add(ctx.props.cardigan);
      ctx.store.cr = crowd(ctx, [X[6], X[7]], [[37.6, 0, 7.4, 2.4], [42.6, 0, 7.6, -2.5]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, m1 = ctx.cast.mabel, m2 = ctx.cast.mabel2, ts = ctx.time('b21.w6') + 0.15;
      P.fountain.userData.set(t, { rainbow: 0.4, jet: 1 });
      const u = ease.inOutSine(clamp((t - ts) / 1.9, 0, 1)), on = t >= ts;
      m1.root.visible = !on; m2.root.visible = on;
      const m = on ? m2 : m1;
      liftArms(m, t, on ? u : 0); m.face('smile', 1.0);
      const C = P.cardigan; C.visible = on;
      if (on) {
        const base = jointPos(m, 'torso'), hl = jointPos(m, 'handL'), hr = jointPos(m, 'handR'), top = hl.add(hr).multiplyScalar(0.5).add(up(-0.32));
        C.position.copy(base.lerp(top, clamp(u * 1.15, 0, 1))); C.rotation.set(0, m.root.rotation.y, 0);
      }
      ctx.store.cr.forEach((c) => { c.ch.pose('stunned', t + c.ph); c.ch.face('shocked', 0.4); });
      moveCam(ctx, { pos: L(40.4, 1.05, 8.2), look: L(40.0, 1.55, 4.6), fov: 46 }, { pos: L(40.4, 1.0, 7.6), look: L(40.0, 1.75, 4.6), fov: 46 }, lt / 2.5);
      ctx.fx.vignette(0.3);
    },
  },
  // ── b22 "Fifty years of colour, all mixed together, poured out as one nobody has ever seen."
  {
    name: 'colour pours', start: 'b22-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      const m = put(ctx, 'mabel2', L(40.0, 0, 4.6), L.yaw);
      ctx.add(ctx.props.cardigan); addTo(ctx, ctx.props.spiral, 40.0, 0, 4.6);
      ctx.add(ctx.props.hue);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, m = ctx.cast.mabel2;
      P.fountain.userData.set(t, { rainbow: 0.4, jet: 1 });
      liftArms(m, t, 1); m.face('grin', 1.0);
      const hl = jointPos(m, 'handL'), hr = jointPos(m, 'handR'), top = hl.add(hr).multiplyScalar(0.5).add(up(-0.32));
      P.cardigan.position.copy(top); P.cardigan.rotation.set(0, m.root.rotation.y, 0);
      const rise = 0.32 * ease.outCubic(clamp((t - ctx.time('b22') - 0.2) / 1.8, 0, 1));
      P.spiral.position.copy(L(40.0, top.y - 0.1, 4.6)); P.spiral.userData.set(t, { rise: Math.max(0.02, rise), scale: 0.9 });
      P.hue.position.copy(L(40.0, 3.2, 5.6)); P.hue.color.setHSL((t * 0.4) % 1, 1, 0.6); P.hue.intensity = 40;
      skyShimmer(ctx, t, 0.25 * rise / 0.32);
      moveCam(ctx, { pos: L(40.7, 0.45, 8.0), look: L(40.0, 3.6, 4.4), fov: 58 }, { pos: L(40.8, 0.4, 8.4), look: L(40.0, 5.2, 4.4), fov: 60 }, lt / 2.1);
    },
  },
  {
    name: 'sky of the new colour', start: 'pour-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      put(ctx, 'mabel2', L(40.0, 0, 4.6), L.yaw);
      ctx.add(ctx.props.cardigan); addTo(ctx, ctx.props.spiral, 40.0, 2.6, 4.6);
      ctx.store.cr = crowd(ctx, ['me', 'mayor', 'kid', X[6], X[7], X[8], X[9]], ringSpots(7, 40, 4.6, 4.5, 6.5, 0.5, PI - 0.4, 3));
      filler(ctx, ringFill(40, 40, 0, 7.5, 12.5, -PI, PI, 41));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, m = ctx.cast.mabel2, tp = ctx.markers.pour;
      P.fountain.userData.set(t, { rainbow: 0.6, jet: 1 }); P.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      liftArms(m, t, 1); m.face('grin', 1.0);
      const hl = jointPos(m, 'handL'), hr = jointPos(m, 'handR'), top = hl.add(hr).multiplyScalar(0.5).add(up(-0.32));
      P.cardigan.position.copy(top); P.cardigan.rotation.set(0, m.root.rotation.y, 0);
      const k = ease.inOutCubic(clamp((t - tp + 0.1) / 1.2, 0, 1));
      P.spiral.position.copy(L(40.0, top.y - 0.1, 4.6)); P.spiral.userData.set(t, { rise: lerp(0.32, 1, k), spread: k });
      skyShimmer(ctx, t, lerp(0.25, 1, k));
      ctx.store.cr.forEach((c) => { lookUp(c.ch, t, 1, c.ph); c.ch.face('shocked', 0.4); });
      moveCam(ctx, { pos: L(28.0, 2.6, 19.0), look: L(40, 10, 2), fov: 62 }, { pos: L(25.0, 6.5, 23.0), look: L(40, 20, 0), fov: 64 }, ease.inOutSine(clamp(lt / 1.3, 0, 1)));
      tag(ctx, 'NEW COLOUR', ctx.time('b22.w10'), Infinity, { y: 0.13, size: 92, fill: '#ffffff', bg: `hsla(${Math.floor((t * 43) % 360)},85%,45%,0.92)` });
    },
  },
  {
    name: 'faces in the new colour', start: 'b22.w12-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      addTo(ctx, ctx.props.spiral, 40.0, 2.6, 4.6);
      ctx.store.cr = crowd(ctx, ['kid', X[6], 'fireman', X[8]], [[34.0, 0, 3.0, PI / 2 - 0.1], [34.7, 0, 4.4, PI / 2 + 0.1], [33.4, 0, 5.4, PI / 2 + 0.2], [34.2, 0, 1.6, PI / 2 - 0.25]]);
      const hm = ctx.props.helmet; ctx.add(hm, ctx.cast.fireman.joints.head); hm.position.set(0, 0.56, -0.02); hm.scale.setScalar(0.95);
      ctx.add(ctx.props.hue);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      P.fountain.userData.set(t, { rainbow: 0.6, jet: 1 });
      P.spiral.userData.set(t, { rise: 1, spread: 1 });
      skyShimmer(ctx, t, 1);
      ctx.store.cr.forEach((c) => { lookUp(c.ch, t, 0.9, c.ph); c.ch.face('shocked', 0.4); });
      P.hue.position.copy(L(36.2, 2.6, 3.4)); P.hue.color.setHSL((t * 0.4) % 1, 1, 0.6); P.hue.intensity = 30;
      moveCam(ctx, { pos: L(37.2, 1.25, 2.4), look: L(34.2, 1.45, 3.7), fov: 44 }, { pos: L(36.9, 1.25, 2.6), look: L(34.2, 1.5, 3.7), fov: 42 }, lt / 1.0);
    },
  },
  // ── b23 "Nobody can name it. Whoever looks at it can only say…"
  {
    name: 'town stares up', start: 'b23-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      addTo(ctx, ctx.props.spiral, 40.0, 2.6, 4.6);
      ctx.store.cr = crowd(ctx, ['mayor', 'kid', 'kaur', 'fireman', X[6], X[7], X[8], X[9], X[10]], ringSpots(9, 40, 0, 5.2, 8.0, 0.35, PI - 0.2, 7));
      const hm = ctx.props.helmet; ctx.add(hm, ctx.cast.fireman.joints.head); hm.position.set(0, 0.56, -0.02); hm.scale.setScalar(0.95);
      filler(ctx, ringFill(34, 40, 0, 8.5, 13, 0.1, PI - 0.1, 51));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      P.fountain.userData.set(t, { rainbow: 0.6, jet: 1 }); P.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      P.spiral.userData.set(t, { rise: 1, spread: 1 });
      skyShimmer(ctx, t, 1);
      ctx.store.cr.forEach((c) => { lookUp(c.ch, t, 1.1, c.ph); c.ch.face('shocked', 0.4); });
      moveCam(ctx, { pos: L(44.0, 0.8, 1.4), look: L(37.5, 3.6, 8.6), fov: 56 }, { pos: L(43.8, 0.7, 2.0), look: L(37.5, 4.2, 8.6), fov: 56 }, lt / 1.4);
    },
  },
  {
    name: 'push in on me', start: 'b23.w4-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      addTo(ctx, ctx.props.spiral, 40.0, 2.6, 4.6);
      put(ctx, 'me', L(36.8, 0, 6.4), L.yaw + yawTo(36.8, 6.4, 40, 4.6) - 0.35);
      ctx.add(ctx.props.hue);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      P.fountain.userData.set(t, { rainbow: 0.6, jet: 1 });
      P.spiral.userData.set(t, { rise: 1, spread: 1 });
      skyShimmer(ctx, t, 1);
      me.pose('stunned', t, { headPitch: -0.45 }); me.face('shocked', 0.4);
      const hf = humanFace(me); P.hue.position.copy(hf).add(V(0.6, 0.6, 0.4)); P.hue.color.setHSL((t * 0.5) % 1, 1, 0.6); P.hue.intensity = 12; P.hue.distance = 4;
      const a = faceCam(me, 3.0, 0.5, 0.5, 38, -0.35), b = faceCam(me, 1.7, 0.3, 0.42, 34, -0.3);
      moveCam(ctx, a, b, ease.inOutSine(clamp(lt / 1.7, 0, 1)));
    },
  },
  // ── b24 HUSS ×3 — everyone shouts it at the sky; the label slaps onto the colour
  ...[0, 1, 2].map((i) => ({
    name: `colour name huss #${i + 1}`, start: H('b24', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); square(ctx);
      addTo(ctx, ctx.props.spiral, 40.0, 2.6, 4.6);
      ctx.store.cr = crowd(ctx, ['me', 'mayor', 'kid', 'kaur', 'mabel2', X[6], X[7], X[8], X[9]], [[36.8, 0, 6.4, 2.4], ...ringSpots(8, 40, 0, 5.6, 8.0, 0.4, PI - 0.25, 7)]);
      filler(ctx, ringFill(34, 40, 0, 8.5, 13, 0.1, PI - 0.1, 51));
      ctx.add(ctx.props.hue);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, hits = hussHits(ctx, 'b24'), h = lastBefore(hits, t), near = h != null && t - h < 0.22;
      P.fountain.userData.set(t, { rainbow: 0.6, jet: 1 }); P.filler.userData.set(t, { arms: 'cheer', bounce: 1, speed: 1.4 });
      P.spiral.userData.set(t, { rise: 1, spread: 1 });
      skyShimmer(ctx, t, 1);
      ctx.store.cr.forEach((c) => { c.ch.pose('cheer', t + c.ph, { headPitch: -0.35 }); c.ch.face(near ? 'huss' : 'grin', t + c.ph); });
      const me = ctx.cast.me;
      const hf = humanFace(me); P.hue.position.copy(hf).add(V(0.6, 0.6, 0.4)); P.hue.color.setHSL((t * 0.5) % 1, 1, 0.6); P.hue.intensity = 12; P.hue.distance = 4;
      const cams = [faceCam(me, 2.2, 0.35, 0.45, 36, -0.3), { pos: L(44.5, 0.9, 1.0), look: L(37.5, 3.4, 8.4), fov: 58 }, { pos: L(33.0, 1.0, 15.0), look: L(40, 20, 0), fov: 64 }];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.12, 0.2);
      stamp(ctx, 'COLOUR NAME:\nHUSS', hits[2] - 0.03, { y: 0.24, size: 124, fill: '#ffffff', stroke: '#1d1d22', line: 14, rot: -0.1 });
      if (i === 2) shakeOn(ctx, [hits[2]], 0.5, 0.3, 21);
    },
  })),
];
