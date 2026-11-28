// In This Town — Episode 26: "Who Bit the Town?".  Every morning one house wakes up with a giant bite out of it.  Two rules:
// paint it green, never touch the string on the clock tower.  Unpaid detective me follows the clues (sweet, sprinkles, a
// gap-toothed bite), sets a hot-sauce trap on our bubblegum-pink roof… and a giant gap-toothed kid yells SPICY.  He was only
// checking if the town was ready: it's his birthday cake, the party's tomorrow, the clock tower is the candle — and somebody
// just struck a match.
// Film contract: SPEC.md §8.  Timeline: episodes/ep26/timeline.json.
//
// Sets: 'town' (buildTown seed 26) and 'room' (hero bedroom).  Town-local coordinates (T(ctx)): main street along x (centre
// z = 0, pavements z = ±4.5…7.5, house fronts ±10.5).  House slots (world.js HOUSE_SPECS) can be hidden and replaced by
// voxel cake houses (props.makeVoxHouse) or repainted (townEdit).  Our house = slot 5 at (−27, 14), front facing −z.
// Clock tower at (−51, 1.5), east clock face x ≈ −49.6, y = 11, roof ball y ≈ 15.6 → the wick stands on it.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { WALK_SPEED } from '../characters.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard } from '../cards.js';
import { makeSweatDrop } from '../props.js';
import { glowSprite, makePuff, makeSparkles } from '../ep18/props.js';
import { makeFillerCrowd } from '../ep19/props.js';
import { makeShockRing } from '../ep20/props.js';
import { makeStormClouds } from '../ep22/props.js';
import { makeClockFace } from '../ep23/props.js';
import { makeHand } from '../ep24/props.js';
import {
  makeVoxHouse, makeBiteWall, makeGarage, makeFork, makeGiantKid, makeMatch, makeWick, makePlateCake, makeSprinkles, makeCrumbs,
  makeHotSauce, makeRoller, makePancakes, makeDetectiveCap, makeMagnifier, makeCorkboard26, makeLawnChair, makeTeeth, makeTongue,
  makeRedRing, makeShadowShape, makeSteam, makeCrumbBurst, makeMoonSky, makeForkShadow,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const SPECIAL = {
  mom: { id: 'mom', skin: '#f1c7a1', hair: { style: 'long', color: '#5a2e1a' }, top: { style: 'dress', color: '#ff7ab8', accent: '#ffffff', emblem: 'heart' },
    bottom: { style: 'skirt', color: '#ff7ab8' }, shoes: '#ffffff', accessories: ['sunglasses'], scale: 1.0 },
  plum: { id: 'plum', skin: '#f4d0b5', hair: { style: 'bun', color: '#9b4fd0' }, top: { style: 'cardigan', color: '#b58ae0', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#5a3a7a' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.9 },
  bramble: { id: 'bramble', skin: '#78d060', hair: { style: 'short', color: '#2f8a2a' }, top: { style: 'tee', color: '#3fae3a', accent: '#a8ff96', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2e7d32' }, shoes: '#1f6a24', accessories: ['mustache'], eyeColor: '#0f3a0f', scale: 1.02, build: 1.12 },
  gcat: { creature: 'cat', id: 'gcat', color: '#5fcf4e' },
  gus: { id: 'gus', skin: '#c68642', hair: { style: 'short', color: '#1a120c' }, top: { style: 'tee', color: '#e8232b', accent: '#ffffff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#1d1d22', accessories: ['beard', 'cap'], capColor: '#ffd23f', scale: 1.28, build: 1.6 },
};
export const cast = { me: MAIN.me, ...SPECIAL, ...EXTRAS };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 26, banner: ['TOWN', 'MEETING', 'WHO BIT US?'] }),
  room: () => buildRoom({ variant: 'hero', window: 'dark' }),
};
const X = EXTRA_IDS;

// ───────────────────────────────────────────────────────────────────────────────────────── layout (town-local)
const SLOTS = [
  { x: -27, z: -14, yaw: 0, w: 8.6 }, { x: -15, z: -14, yaw: 0, w: 9.0 }, { x: -3, z: -14, yaw: 0, w: 9.4 }, { x: 9, z: -14, yaw: 0, w: 8.8 },
  { x: 21, z: -14, yaw: 0, w: 9.0 }, { x: -27, z: 14, yaw: PI, w: 9.0 }, { x: -15, z: 14, yaw: PI, w: 8.4 }, { x: -3.4, z: 14, yaw: PI, w: 8.6 },
  { x: 25, z: 14, yaw: PI, w: 8.6 },
];
const HOME = 5;                                   // our house slot
const HX = -27, HZ = 14;                          // our house centre; front wall at z = 10.5
const ROOF_Y = 8.9;                               // standing height on the ridge cap
const TOWER = { x: -51, z: 1.5, faceX: -49.6, clockY: 11, top: 15.72 };
const LAMP_HOME = [-27, 5.15];
const KS = { x: -170, z: -30, s: 40, y: 50 };      // the giant kid beside the clock tower (seen from our street)

export function init(ctx) {
  const P = ctx.props;
  // houses
  P.home = makeVoxHouse({ wall: '#ff9cc8', roof: '#ff6fae', trim: '#8ff0cf', door: '#8ff0cf', shutters: '#5fd8b0', roofBites2: [{ x: -3.3, y: 8.2, z: 2.0, r: 3.7 }], seed: 5 });
  P.lilac = makeVoxHouse({ wall: '#c9a7f0', roof: '#7a4ab0', shutters: '#5a3a8a', bites: [{ x: 3.4, y: 7.6, z: 2.7, r: 3.7 }], crumbs: 34, seed: 2 });
  P.bakery = makeVoxHouse({ wall: '#ffe9a8', roof: '#e8456f', door: '#7a1f2b', bites: [{ x: -2.0, y: 8.0, z: 2.5, r: 3.4 }], crumbs: 22, seed: 3, sign: { text: 'BAKERY', bg: '#fff4e0', fg: '#c2185b' }, awning: ['#ff4fa3', '#ffffff'] });
  P.post = makeVoxHouse({ wall: '#9fd4ff', roof: '#2f4d8a', door: '#e8232b', chimneyBitten: true, chimneyX: -0.25, bites: [{ x: -2.4, y: 9.3, z: -0.6, r: 1.9 }], crumbs: 16, seed: 4, sign: { text: 'POST OFFICE', bg: '#ffffff', fg: '#2f4d8a' } });
  P.yellow = makeVoxHouse({ wall: '#ffe08a', roof: '#ff8a3a', shutters: '#ff8a3a', seed: 6 });
  P.peach = makeVoxHouse({ wall: '#ffc2a8', roof: '#d0603a', bites: [{ x: -3.6, y: 7.8, z: 2.2, r: 3.4 }], crumbs: 20, seed: 7 });
  P.mint = makeVoxHouse({ wall: '#bff0e0', roof: '#3aa08a', bites: [{ x: 3.0, y: 8.4, z: 1.0, r: 3.9 }], crumbs: 20, seed: 8 });
  P.garage = makeGarage({ wall: '#ffe08a', roof: '#b5543f' });
  P.biteWall = makeBiteWall({ wall: '#ff9cc8' });
  P.fork = makeFork();
  P.kid = makeGiantKid();
  P.match = makeMatch();
  P.wick = makeWick();
  P.plate = makePlateCake();
  P.sprinkles = makeSprinkles(900, 16, 9, 0.11, { seed: 3 });
  P.crumbs = makeCrumbs(26, 3, 1.4);
  P.sauce = makeHotSauce();
  P.rollers = [0, 1, 2].map((i) => makeRoller(2.6, '#5bd65b'));
  P.redRoller = makeRoller(1.1, '#e8232b');
  P.pancakes = makePancakes(13);
  P.cap = makeDetectiveCap();
  P.mag = makeMagnifier();
  P.cork = makeCorkboard26();
  P.chair = makeLawnChair();
  P.gusTeeth = makeTeeth(false);
  P.tongue = makeTongue();
  P.ring = makeRedRing();
  P.shadow = makeForkShadow();
  P.steam = makeSteam(12);
  P.clock = makeClockFace();
  P.hand = makeHand();
  P.hand2 = makeHand();
  P.clouds = makeStormClouds(16, 26);
  P.filler = makeFillerCrowd(160);
  P.sweat = makeSweatDrop({ size: 0.13 }); P.sweat2 = makeSweatDrop({ size: 0.1 });
  P.puff = makePuff({ color: '#f3cf86', count: 22, radius: 2.2, seed: 3 });
  P.puff2 = makePuff({ color: '#fff4e6', count: 16, radius: 1.2, seed: 9 });
  P.shock = makeShockRing();
  P.sparks = makeSparkles({ n: 60, w: 18, h: 10, d: 10, color: '#ffe6b0', size: 0.07 });
  P.dust = makeSparkles({ n: 40, w: 6, h: 4, d: 5, color: '#fff2d0', size: 0.03 });
  P.glint = glowSprite('#ffffff', 2, 1);
  P.moonGlow = glowSprite('#dfe6ff', 30, 0.55);
  P.winGlow = glowSprite('#ffc860', 1, 0.9);
  P.fill = new THREE.PointLight('#f0f2ff', 5, 12, 1.4);
  P.zap = new THREE.PointLight('#c8b8ff', 0, 200, 1.0);
  P.warm = new THREE.PointLight('#ff9a3a', 0, 140, 1.2);
  P.topLight = new THREE.DirectionalLight('#e6ecff', 1.4);
  P.burst = makeCrumbBurst({ n: 46, radius: 3.2, size: 0.42 });
  P.burst2 = makeCrumbBurst({ n: 70, radius: 9, size: 0.75, seed: 9 });
  P.moonSky = makeMoonSky();
  P.crumbRain = makeCrumbs(40, 6, 6, ['#f3cf86', '#fff4e6', '#ff6fae', '#e8232b'], { seed: 11, size: 0.5 });
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
function headPt(ch, y = 0.3, z = 0) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, y, z)); }
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
function hitPulse(times, t, decay = 0.2) { let p = 0; for (const h of times) if (t >= h) p = Math.max(p, Math.exp(-(t - h) / decay)); return p; }
function lastBefore(times, t) { let r = null; for (const x of times) if (x <= t) r = x; return r; }
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
  ctx.fx.overlay('#ffffff', 0.18 * k);
  return c;
}
/** a little flame icon drawn on the 2D layer */
function flameIcon(ctx, x, y, s, t0) {
  const d = ctx.t - t0; if (d < 0) return;
  const sc = d < 0.14 ? ease.outBack(clamp(d / 0.14, 0, 1)) : 1, fl = 1 + 0.06 * Math.sin(ctx.t * 20);
  ctx.fx.draw((g, W, Hh) => {
    g.translate(x * W, y * Hh); g.scale(s * sc, s * sc * fl); g.rotate(0.12);
    g.lineWidth = 10; g.strokeStyle = '#ffffff';
    const path = () => { g.beginPath(); g.moveTo(0, -60); g.bezierCurveTo(46, -16, 40, 34, 0, 38); g.bezierCurveTo(-40, 34, -46, -16, 0, -60); };
    path(); g.fillStyle = '#ff3a1a'; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(0, -18); g.bezierCurveTo(22, 4, 18, 30, 0, 32); g.bezierCurveTo(-18, 30, -22, 4, 0, -18); g.fillStyle = '#ffd21a'; g.fill();
  });
}
/** approximate screen position (0..1) of a world point for the current ctx.store.cam (portrait 9:16) */
function scr(ctx, wp) {
  const c = ctx.store.cam; if (!c) return { x: 0.5, y: 0.5 };
  const f = c.look.clone().sub(c.pos).normalize(), r = V().crossVectors(f, V(0, 1, 0)).normalize(), u = V().crossVectors(r, f);
  const d = wp.clone().sub(c.pos), z = d.dot(f), ty = Math.tan((c.fov * PI) / 360), tx = ty * 9 / 16;
  return { x: 0.5 + (d.dot(r) / z) / tx / 2, y: 0.5 - (d.dot(u) / z) / ty / 2 };
}
/** a pointer arrow (2D) from (x0,y0) to (x1,y1) */
function arrow2d(ctx, x0, y0, x1, y1, color = '#ffffff') {
  ctx.fx.draw((g, W, Hh) => {
    const ax = x0 * W, ay = y0 * Hh, bx = x1 * W, by = y1 * Hh, a = Math.atan2(by - ay, bx - ax);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, col] of [[22, '#000000'], [11, color]]) {
      g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by);
      g.moveTo(bx, by); g.lineTo(bx - 34 * Math.cos(a - 0.5), by - 34 * Math.sin(a - 0.5)); g.moveTo(bx, by); g.lineTo(bx - 34 * Math.cos(a + 0.5), by - 34 * Math.sin(a + 0.5)); g.stroke();
    }
  });
}
/** hard cut to black from t0 (no captions on the black) */
function blackout(ctx, t0) { if (ctx.t >= t0) { ctx.fx.overlay('#000000', 1); ctx.caption.hide(true); } }
/** screen-space red ring around a world point */
function ringAt(ctx, wp, t0, r = 1, o = {}) {
  const P = ctx.props, d = ctx.t - t0;
  if (d < 0) { P.ring.visible = false; return; }
  ctx.add(P.ring); P.ring.visible = true;
  const s = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  P.ring.position.copy(wp); if (ctx.store.cam) P.ring.lookAt(ctx.store.cam.pos); P.ring.scale.setScalar(Math.max(0.01, r * s * (1 + 0.04 * Math.sin(ctx.t * 10))));
}

// ─── town pieces: house slots (hide / repaint), the lamp in front of our house
function slotBox(i) {
  const s = SLOTS[i], f = s.yaw === 0 ? 1 : -1;
  const zA = s.z + f * (3.5 + 1.0), zB = s.z - f * (3.5 + 0.7);
  return { x0: s.x - s.w / 2 - 0.75, x1: s.x + s.w / 2 + 0.75, z0: Math.min(zA, zB), z1: Math.max(zA, zB), y1: 12.5 };
}
function townData(ctx) {
  const r = ctx.set.root; let D = ctx.props.td;
  if (D && D.root === r) return D;
  D = { root: r, meshes: [], insts: [], pts: [] };
  const BX = SLOTS.map((_, i) => slotBox(i));
  const inB = (b, x, y, z) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y < b.y1 && y > -1;
  const lampIn = (x, z) => Math.hypot(x - LAMP_HOME[0], z - LAMP_HOME[1]) < 0.7;
  const carIn = (x, y, z) => x > -24.4 && x < -19.6 && z > 2.0 && z < 4.6 && y < 2.2;
  for (const n of ['houses', 'roofs', 'trim', 'gold', 'lampPosts', 'gloss']) {
    const m = r.getObjectByName(n); if (!m || !m.geometry) continue;
    const pos = m.geometry.attributes.position, col = m.geometry.attributes.color;
    const lists = BX.map(() => []), lamp = [];
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
      if (n === 'lampPosts') { if (lampIn(x, z)) lamp.push(v); continue; }
      if ((n === 'gloss' || n === 'trim') && carIn(x, y, z)) lamp.push(v);
      if (n === 'gloss') continue;
      for (let i = 0; i < BX.length; i++) if (inB(BX[i], x, y, z)) lists[i].push(v);
    }
    D.meshes.push({ n, m, pos, col, pos0: pos.array.slice(), col0: col ? col.array.slice() : null, lists, lamp });
  }
  r.traverse((o) => {
    if (!o.isInstancedMesh || !['windows', 'windowHalos', 'glows', 'lampCores', 'lampPools'].includes(o.name)) return;
    const a = o.instanceMatrix.array, lists = BX.map(() => []), lamp = [];
    for (let k = 0; k < o.count; k++) {
      const x = a[k * 16 + 12], y = a[k * 16 + 13], z = a[k * 16 + 14];
      if (o.name.startsWith('lamp')) { if (lampIn(x, z)) lamp.push(k); continue; }
      for (let i = 0; i < BX.length; i++) if (inB(BX[i], x, y, z)) lists[i].push(k);
    }
    D.insts.push({ o, m0: a.slice(), lists, lamp });
  });
  const halo = r.getObjectByName('lampHalos');
  if (halo && halo.geometry.attributes.position) { const p = halo.geometry.attributes.position; const lamp = []; for (let k = 0; k < p.count; k++) if (lampIn(p.getX(k), p.getZ(k))) lamp.push(k); D.halo = { o: halo, lamp }; }
  ctx.props.td = D; return D;
}
const _pc = new THREE.Color();
/** hide house slots, repaint walls (paint) / roofs (roofPaint), hide the lamp in front of our house */
function townEdit(ctx, { hide = [], paint = {}, roofPaint = {}, hideLamp = false } = {}) {
  const D = townData(ctx);
  for (const M of D.meshes) {
    const pa = M.pos.array; pa.set(M.pos0); if (M.col) M.col.array.set(M.col0);
    for (const i of hide) for (const v of M.lists[i] || []) { pa[v * 3] = 0; pa[v * 3 + 1] = -500; pa[v * 3 + 2] = 0; }
    if (hideLamp) for (const v of M.lamp) { pa[v * 3] = 0; pa[v * 3 + 1] = -500; pa[v * 3 + 2] = 0; }
    const pp = M.n === 'houses' ? paint : M.n === 'roofs' ? roofPaint : null;
    if (pp && M.col) for (const [i, hex] of Object.entries(pp)) { _pc.set(hex); for (const v of M.lists[+i] || []) { M.col.array[v * 3] = _pc.r; M.col.array[v * 3 + 1] = _pc.g; M.col.array[v * 3 + 2] = _pc.b; } }
    M.pos.needsUpdate = true; if (M.col) M.col.needsUpdate = true;
  }
  for (const I of D.insts) {
    const a = I.o.instanceMatrix.array; a.set(I.m0);
    const zero = (k) => { for (let e = 0; e < 16; e++) a[k * 16 + e] = 0; };
    for (const i of hide) for (const k of I.lists[i] || []) zero(k);
    if (hideLamp) for (const k of I.lamp) zero(k);
    I.o.instanceMatrix.needsUpdate = true;
  }
  if (D.halo && hideLamp) { const s = D.halo.o.geometry.attributes.size; if (s) { for (const k of D.halo.lamp) s.array[k] = 0; s.needsUpdate = true; } }
}
/** put a voxel house into a slot (hide that slot first) */
function house(ctx, h, slot) { const s = SLOTS[slot]; addTo(ctx, h, s.x, 0, s.z, s.yaw); return h; }
/** world point from house-local coords of slot */
function slotPt(ctx, slot, lx, ly, lz) { const s = SLOTS[slot], c = Math.cos(s.yaw), sn = Math.sin(s.yaw); return ctx.store.L(s.x + lx * c + lz * sn, ly, s.z - lx * sn + lz * c); }

// ─── sky moods layered on the preset
const MOODS = {
  red: { z: '#2a0206', m: '#7a0a10', h: '#ff4a1a', g: '#2a0606', s: '#ff3010', fog: '#8a2216', hemi: ['#ff7a66', '#3a0808'], dir: '#ff6a4a' },
  storm: { z: '#07031a', m: '#221040', h: '#4a2478', g: '#08040e', s: '#000000', fog: '#1a0e30', hemi: ['#8a7ad8', '#1a1028'], dir: '#a8a0ff' },
  sunrise: { z: '#4f86d8', m: '#ffb48a', h: '#ffd09a', g: '#6a8f5a', s: '#ffd8a0', fog: '#ffcfa8', hemi: ['#ffe6c8', '#8a7a5a'], dir: '#ffcf98' },
  redBright: { z: '#a00a0a', m: '#ff2a14', h: '#ff8a3a', g: '#5a0a08', s: '#ffd080', fog: '#ff3a1a', hemi: ['#ff9a80', '#5a1010'], dir: '#ff8a6a' },
  orange: { z: '#160804', m: '#5a2208', h: '#ff8a2a', g: '#2a1206', s: '#ff9a3a', fog: '#4a2010', hemi: ['#ffb070', '#3a1808'], dir: '#ffb070' },
};
const _m1 = new THREE.Color(), _m2 = new THREE.Color();
function skyBase(ctx) {
  const r = ctx.set.root, sky = r.getObjectByName('sky');
  if (!sky || !sky.material.uniforms) { ctx.store.sky = null; return; }
  const u = sky.material.uniforms, lights = [];
  r.traverse((o) => { if (o.isHemisphereLight) lights.push({ o, c: o.color.clone(), g: o.groundColor.clone(), i: o.intensity }); else if (o.isDirectionalLight && o !== ctx.props.topLight) lights.push({ o, c: o.color.clone(), i: o.intensity }); });
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

// ─── town looks
function town(ctx, light = 'day', { glow = 0.85, exposure = null, edits = {}, lamp = false } = {}) {
  const s = ctx.set;
  s.setLighting(light); s.set('partyProps', false); s.set('fireworks', false); s.set('foam', 0);
  s.set('windowGlow', light === 'day' ? 0 : glow); s.set('standsCrowd', false); s.set('crowdMotion', 1);
  s.exposure = exposure ?? (light === 'quiet_night' ? 1.3 : light === 'dusk' ? 1.05 : 1.0);
  const L = T(ctx); ctx.store.L = L;
  townEdit(ctx, { hideLamp: !lamp, ...edits });
  for (const n of ['grass', 'hills', 'sky', 'stars']) { const o = s.root.getObjectByName(n); if (o) o.visible = true; }
  skyBase(ctx);
  return L;
}
/** our street at night: pink house in its slot (roof on/off), hidden lamp */
function homeStreet(ctx, light = 'quiet_night', { roof = 'red', glow = 0.6, exposure = null, extraHide = [], paint = {} } = {}) {
  const L = town(ctx, light, { glow, exposure, edits: { hide: [HOME, ...extraHide], paint } });
  const h = house(ctx, ctx.props.home, HOME);
  homeRoof(ctx, roof);
  return L;
}
/** roof state of our house: 'pink' | 'red' | 'redBitten' | 'none' */
function homeRoof(ctx, st, glow = null) {
  const h = ctx.props.home, U = h.userData;
  U.roof.visible = st === 'pink' || st === 'red'; U.roofB.visible = st === 'redBitten';
  U.roof.position.set(0, 0, 0); U.roofB.position.set(0, 0, 0); U.roof.rotation.set(0, 0, 0); U.roofB.rotation.set(0, 0, 0);
  U.setRoof(st === 'pink' ? null : '#e8232b', glow ?? (st === 'pink' ? 0 : 0.35));
  U.setLit(0.85, '#ffd27a', false);
}
function storm(ctx, k = 1) {
  skyMood(ctx, 'storm', k);
  const P = ctx.props;
  addTo(ctx, P.clouds, HX, 0, HZ + 20); P.clouds.userData.set(ctx.t, 0);
  ctx.add(P.zap); P.zap.position.copy(ctx.store.L(HX, 70, HZ + 40)); P.zap.intensity = 0;
}
function lightning(ctx, strikes, { popA = 0.35, dur = 0.22, single = false } = {}) {
  const P = ctx.props; let z = 0, zp = 0;
  for (const s of strikes) { const d = ctx.t - s; if (d >= 0 && d < dur) { z = Math.max(z, (1 - d / dur) * (single || d < 0.05 || (d > 0.09 && d < 0.13) ? 1 : 0.35)); if (d < 0.1) zp = Math.max(zp, 1 - d / 0.1); } }
  P.zap.intensity = 900 * z; if (zp > 0 || (!single && z > 0)) ctx.fx.overlay('#d8d0ff', popA * (single ? zp : z));
  P.clouds.userData.m.emissiveIntensity = 0.6 + 1.6 * z; P.clouds.userData.mL.emissiveIntensity = 0.5 + 1.6 * z;
}
function crowd(ctx, ids, spots) {
  const L = ctx.store.L;
  return ids.map((id, i) => { const [x, y, z, yw] = spots[i]; const ch = put(ctx, id, L(x, y, z), L.yaw + yw); return { ch, id, k: i, ph: hash(i * 1.9 + 3) * 3, x, y, z, yw }; });
}
function filler(ctx, list) { const f = ctx.props.filler; ctx.add(f, ctx.set.root); f.position.set(0, 0, 0); f.userData.layout(list); return f; }
function blockFill(x0, x1, z0, z1, n, { seed = 3, faceX = null, faceZ = null, yaw = null, y = 0, avoid = null } = {}) {
  const out = [];
  for (let i = 0; out.length < n && i < n * 5; i++) {
    const x = lerp(x0, x1, hash(i * 1.37 + seed)), z = lerp(z0, z1, hash(i * 2.71 + seed));
    if (avoid && avoid(x, z)) continue;
    if (out.some((q) => Math.hypot(q.x - x, q.z - z) < 0.9)) continue;
    const yw = yaw != null ? yaw : Math.atan2((faceX ?? x) - x, (faceZ ?? z) - z);
    out.push({ x, y, z, yaw: yw + (hash(i * 4.4 + seed) - 0.5) * 0.5, k: i, s: 0.86 + 0.24 * hash(i * 3.3 + seed) });
  }
  return out;
}
/** clock tower dressing: the wick on top (always) + optional 3 AM clock face on the east side */
function towerDress(ctx, { clock = false, h = 3 } = {}) {
  const P = ctx.props;
  addTo(ctx, P.wick, TOWER.x, TOWER.top, TOWER.z, 0.4); P.wick.userData.set(ctx.t, 0);
  if (clock) { addTo(ctx, P.clock, TOWER.faceX + 0.08, TOWER.clockY, TOWER.z, PI / 2); P.clock.userData.set(0, h / 12); }
}
/** the giant kid at town-local p (array), yaw (0 → faces +z), scale s */
function kidAt(ctx, p, yaw, s, st = {}, pitch = 0) {
  const K = ctx.props.kid; addTo(ctx, K, p[0], p[1], p[2], yaw, s); K.rotation.order = 'YXZ'; K.rotation.x = pitch;
  K.userData.set(ctx.t, st); return K;
}

// ─── poses
function holdUp(ch, t, k = 1, o = {}) {   // hands together in front of the chest
  ch.pose('idle', t, { intensity: 0.3, ...o });
  const J = ch.joints;
  J.armL.rotation.set(-1.0 * k, 0, -0.32 * k); J.armR.rotation.set(-1.0 * k, 0, 0.32 * k);
  J.foreArmL.rotation.set(-0.75 * k, 0, 0); J.foreArmR.rotation.set(-0.75 * k, 0, 0);
}
/** long-pole roller painting: both hands on the pole, strokes up and down */
function rollerPose(ch, t, ph = 0) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints, s = Math.sin(t * 3.2 + ph);
  J.armR.rotation.set(-2.2 - 0.45 * s, 0, 0.15); J.foreArmR.rotation.set(-0.3, 0, 0);
  J.armL.rotation.set(-1.6 - 0.35 * s, 0, -0.35); J.foreArmL.rotation.set(-0.6, 0, 0);
  J.torso.rotation.x -= 0.08 + 0.04 * s; J.head.rotation.x -= 0.35;
}
/** pointing straight up at the sky */
function pointUp(ch, t, k = 1, hit = 0) {
  ch.pose('idle', t, { intensity: 0.5 });
  const J = ch.joints;
  J.armR.rotation.set(-2.8 * k - 0.1 * hit, 0, -0.45); J.foreArmR.rotation.set(0, 0, 0);
  J.armL.rotation.set(-0.4, 0, -0.5 - 0.2 * hit); J.foreArmL.rotation.set(-1.2, 0, 0);
  J.torso.rotation.x -= 0.12; J.head.rotation.x -= 0.4 + 0.1 * hit;
}
function facepalm(ch, t) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints;
  J.armR.rotation.set(-1.7, 0, 0.75); J.foreArmR.rotation.set(-1.2, 0, 0);
  J.head.rotation.x += 0.22; J.armL.rotation.set(-0.3, 0, -0.55); J.foreArmL.rotation.set(-0.4, 0, 0);
}
/** dive to the side (u 0 → 1): body tilts toward −x, arms flung out */
function divePose(ch, t, u) {
  ch.pose('surprised', 0.25, {});
  const J = ch.joints;
  J.armL.rotation.z += -1.2 * u; J.armR.rotation.z += 0.9 * u; J.armR.rotation.x += -0.6 * u;
  J.legL.rotation.x += -0.5 * u; J.legR.rotation.x += 0.45 * u; J.shinR.rotation.x += 0.9 * u;
  J.head.rotation.z = 0.25 * u;
}
function paintRoofPose(ch, t) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints, s = Math.sin(t * 4.2);
  J.armR.rotation.set(-0.9 - 0.4 * s, 0, 0.2); J.foreArmR.rotation.set(-0.5, 0, 0);
  J.armL.rotation.set(-0.75 - 0.35 * s, 0, -0.3); J.foreArmL.rotation.set(-0.7, 0, 0);
  J.torso.rotation.x += 0.28 + 0.06 * s; J.head.rotation.x -= 0.1;
}
/** fist into palm: left palm up in front, right fist slams onto it at each hit */
function fistPalm(ch, t, hits) {
  ch.pose('slam', t, { hits, tableY: 1.02, slamZ: 0.42, slamX: 0.0 });
  const J = ch.joints;
  J.armL.rotation.set(-0.95, 0, -0.45); J.foreArmL.rotation.set(-0.55, 0, 0.3);
}

// ─── room helpers (bed against the left wall x ≈ −1.95, desk on the right wall, window x −1.45…−0.15)
function room(ctx, { light = 'night', win = 'dark', exposure = null } = {}) {
  const s = ctx.set; s.setLighting(light); s.set('window', win); s.exposure = exposure ?? (light === 'night' ? 1.2 : 1.0);
  const R = T(ctx); ctx.store.R = R; ctx.store.L = R;
  skyBase(ctx);
  return R;
}
function roomStorm(ctx, k = 1) {   // the open sky over the roofless room
  const S = ctx.store.sky; if (!S) return;
  S.u.uZenith.value.set('#07031a').lerp(_m2.copy(S.base.z), 1 - k); S.u.uMid.value.set('#221040').lerp(_m2.copy(S.base.m), 1 - k); S.u.uHorizon.value.set('#5a2a88').lerp(_m2.copy(S.base.h), 1 - k);
}
const CORK = { x: 1.45, y: 1.72, z: -2.04 };
function detectiveRoom(ctx, light = 'day') {
  const R = room(ctx, { light, win: light === 'day' ? 'day' : 'dark' });
  const P = ctx.props;
  addTo(ctx, P.cork, CORK.x, CORK.y, CORK.z, 0); P.cork.rotation.z = 0;
  const ph = P.cork.userData.photo; ph.position.copy(P.cork.userData.photoHome); ph.rotation.set(0, 0, P.cork.userData.photoRot);
  const me = put(ctx, 'me', R(1.05, 0, -1.05), -0.35);
  ctx.add(P.cap, me.joints.head); P.cap.position.set(0, 0.6, -0.02); P.cap.rotation.set(-0.06, 0, 0);
  return R;
}
function capOn(ctx, ch = ctx.cast.me) { const P = ctx.props; ctx.add(P.cap, ch.joints.head); P.cap.position.set(0, 0.6, -0.02); P.cap.rotation.set(-0.06, 0, 0); }

// ─── plate / cake reveal
function cakeMode(ctx, on) {
  const r = ctx.set.root, P = ctx.props;
  for (const n of ['grass', 'hills', 'sky', 'stars']) { const o = r.getObjectByName(n); if (o) o.visible = !on; }
  if (on) {
    addTo(ctx, P.plate, 0, 0, 0); P.plate.userData.rimOnly(false);
    if (ctx.set.background) ctx.set.background.set('#140a26');
    if (ctx.set.fog) { ctx.set.fog.near = 3000; ctx.set.fog.far = 4000; }
    ctx.add(P.topLight); ctx.add(P.topLight.target); P.topLight.position.copy(ctx.store.L(-60, 200, 120)); P.topLight.target.position.copy(ctx.store.L(0, 0, 0)); P.topLight.intensity = 1.5;
  }
}
const GREEN_SLOTS = { 1: '#4fc24a', 3: '#5bd65b', 7: '#3fb43a' };
const GREEN_ROOFS = { 1: '#2e8a2e', 3: '#2f9a3a', 7: '#1f7a24' };

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, every morning, one house wakes up with a giant bite taken out of it."
  {
    name: 'sunrise street', start: 0, set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { edits: { hide: [1] } });
      house(ctx, ctx.props.lilac, 1);
      towerDress(ctx);
      ctx.store.w = crowd(ctx, [X[0], X[1], X[2], X[3]], [[-6, 0.12, -5.6, PI], [-4.5, 0.12, 5.8, -PI / 2], [2, 0, -1.5, -PI / 2], [-8, 0.12, 6.2, PI / 2]]);
    },
    update(ctx, lt, u) {
      const L = ctx.store.L, t = ctx.t;
      skyMood(ctx, 'sunrise', 0.75);
      ctx.store.w.forEach((w, i) => {
        if (i === 2 || i === 1) { const sp = WALK_SPEED * 0.8 * lt; w.ch.root.position.copy(L(w.x + sp * Math.sin(w.yw), w.y, w.z + sp * Math.cos(w.yw))); w.ch.pose('walk', t + w.ph, { speed: 0.8 }); w.ch.face('smile', t + w.ph); }
        else { w.ch.pose('point', t + w.ph, {}); w.ch.face('shocked', 0.4); }
      });
      moveCam(ctx, { pos: L(12, 7.0, 3.0), look: L(-30, 5.0, -6.0), fov: 60 }, { pos: L(-2, 4.5, -1), look: L(-11.6, 7.0, -11.3), fov: 50 }, ease.inOutSine(clamp(lt / 1.6, 0, 1)));
      ctx.fx.overlay('#ffb070', 0.08);
    },
  },
  {
    name: 'bitten house crowd', start: 'b01.w6-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { edits: { hide: [1] } });
      house(ctx, ctx.props.lilac, 1);
      ctx.store.cr = crowd(ctx, [X[4], X[5], X[6], X[7], X[8], X[9], X[10]], [[-17.2, 0.12, -6.4, PI + 0.1], [-15.6, 0.12, -6.8, PI - 0.1], [-13.8, 0.12, -6.3, PI + 0.3], [-12.2, 0.12, -5.6, PI + 0.5], [-16.6, 0, -4.6, PI], [-14.4, 0, -4.3, PI - 0.2], [-18.4, 0, -4.9, PI + 0.3]]);
      put(ctx, 'me', L(-10.2, 0, 1.0), 0.36);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      skyMood(ctx, 'sunrise', 0.6);
      ctx.store.cr.forEach((c, i) => { if (i % 3 === 0) c.ch.pose('point', t + c.ph, { headPitch: -0.3 }); else c.ch.pose('surprised', t * 0.3 + c.ph, { headPitch: -0.35 }); c.ch.face(i % 2 ? 'shocked' : 'sweat', 0.4); });
      me.pose('surprised', clamp(lt, 0, 0.6) + 0.1, {}); me.face('shocked', 0.4);
      moveCam(ctx, { pos: L(-8.8, 0.65, 4.9), look: L(-12.2, 2.6, -9), fov: 60 }, { pos: L(-9.0, 0.6, 4.2), look: L(-12.2, 2.8, -9), fov: 58 }, ease.inOutSine(clamp(lt / 1.4, 0, 1)), 0);
      tag(ctx, 'EVERY. MORNING.', ctx.time('b01') + 0.1, Infinity, { y: 0.1, size: 56 });
    },
  },
  {
    name: 'the bite', start: 'b01.w12-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { edits: { hide: [1] } });
      house(ctx, ctx.props.lilac, 1);
      ctx.store.cr = crowd(ctx, [X[4], X[5], X[6]], [[-16.6, 0.12, -6.4, PI - 0.4], [-9.8, 0.12, -6.6, PI + 0.2], [-17.6, 0.12, -5.6, PI - 0.6]]);
      const P = ctx.props; addTo(ctx, P.burst.root, -11.6, 7.4, -10.6);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      skyMood(ctx, 'sunrise', 0.5);
      ctx.store.cr.forEach((c, i) => { c.ch.pose(i === 1 ? 'point' : 'surprised', t * 0.3 + c.ph, { headPitch: -0.5 }); c.ch.face('shocked', 0.4); });
      const k = ease.outCubic(clamp(lt / 1.2, 0, 1));
      moveCam(ctx, { pos: L(-6.0, 4.2, -1.4), look: L(-11.6, 7.2, -11.3), fov: 50 }, { pos: L(-6.5, 4.5, -2.5), look: L(-11.6, 7.4, -11.3), fov: 44 }, k);
      const tb = ctx.time('b01.w12');
      ctx.props.burst.update(clamp((t - tb) / 0.9, 0, 1.01));
      shakeOn(ctx, [tb + 0.02], 0.5, 0.35, 3);
      stamp(ctx, 'CHOMP', tb, { y: 0.2, size: 130, fill: '#ff4fa3', rot: 0.1 });
    },
  },
  // ── b02 "First the bakery. Then the post office. Then Mrs. Plum's garage."  — three whip pans, BITES: 19 → 21
  {
    name: 'bakery', start: 'b02-0.1', set: 'town',
    setup(ctx) { town(ctx, 'day', { edits: { hide: [3] } }); house(ctx, ctx.props.bakery, 3); ctx.store.cr = crowd(ctx, [X[11], X[12]], [[6.0, 0.12, -6.2, PI - 0.3], [11.8, 0.12, -6.4, PI + 0.4]]); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.store.cr.forEach((c, i) => { c.ch.pose(i ? 'shrug' : 'point', t + c.ph, { headPitch: -0.4 }); c.ch.face(i ? 'sad' : 'shocked', 0.3); });
      const c = moveCam(ctx, { pos: L(14.5, 4.4, 2.6), look: L(8.0, 6.4, -10.5), fov: 56 }, { pos: L(14, 4.8, 2), look: L(8.0, 6.8, -10.5), fov: 54 }, lt / 1.4);
      whip(ctx, c, lt, 1);
      tag(ctx, 'BITES: 19', ctx.time('b02') - 0.1, Infinity, { y: 0.12, size: 76, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  {
    name: 'post office', start: 'post-0.12', set: 'town',
    setup(ctx) { town(ctx, 'day', { edits: { hide: [8] } }); house(ctx, ctx.props.post, 8); ctx.store.cr = crowd(ctx, [X[13]], [[24.0, 0.12, 6.0, -0.4]]); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.store.cr.forEach((c) => { c.ch.pose('point', t + c.ph, { headPitch: -0.5 }); c.ch.face('shocked', 0.3); });
      const c = moveCam(ctx, { pos: L(31.6, 2.2, -5.2), look: L(25, 6.0, 12), fov: 60 }, { pos: L(31, 2.4, -4.5), look: L(25, 6.2, 12), fov: 58 }, lt / 1.2);
      whip(ctx, c, lt, -1);
      tag(ctx, 'BITES: 20', ctx.markers.post - 0.12, Infinity, { y: 0.12, size: 76, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  {
    name: 'half garage', start: 'garage-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      addTo(ctx, ctx.props.garage, 5.4, 0, 12.6, PI);
      put(ctx, 'plum', L(4.1, 0, 10.6), PI - 0.25);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, pl = ctx.cast.plum;
      pl.pose('crossArms', t); pl.face('sweat', 0.5);
      const k = ease.outCubic(clamp(lt / 1.4, 0, 1));
      const c = moveCam(ctx, { pos: L(3.0, 1.7, 4.2), look: L(5.2, 1.4, 11.2), fov: 52 }, { pos: L(3.4, 1.6, 5.2), look: L(5.2, 1.45, 11.2), fov: 50 }, k);
      whip(ctx, c, lt, 1);
      tag(ctx, 'BITES: 21', ctx.markers.garage - 0.12, Infinity, { y: 0.12, size: 76, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b03 "Nobody has seen who. We just hear one giant crunch at three in the morning."
  {
    name: '3am street', start: 'b03-0.15', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0 }); towerDress(ctx, { clock: true, h: 3 }); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tc = ctx.time('b03.w9');
      const on = t > tc + 0.38;
      ctx.set.set('windowGlow', (h, wi) => (h === 5 && on ? 1 : 0));
      const c = moveCam(ctx, { pos: L(-3, 3.1, 0.9), look: L(-45, 7.6, 5.2), fov: 60 }, { pos: L(-5, 3.2, 1.0), look: L(-45, 8, 5.0), fov: 60 }, lt / 3.2, 2.2, '#9fb0ff', 40);
      { const g = ctx.props.winGlow; ctx.add(g); g.position.copy(L(-27, 4.3, 10.0)); g.scale.setScalar(on ? 7 * (1 + 0.5 * Math.max(0, 1 - (t - tc - 0.38) / 0.2)) : 0.001); }
      shakeOn(ctx, [tc + 0.03], 1.1, 0.5, 5);
      pop(ctx, tc + 0.03, 0.1, '#ffffff', 0.25);
      stamp(ctx, 'CRUNCH', tc + 0.02, { y: 0.24, size: 150, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.08, t1: tc + 0.5 });
    },
  },
  {
    name: 'clock 3:00', start: 'b03.w12-0.1', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0 }); towerDress(ctx, { clock: true, h: 3 }); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.set.set('windowGlow', (h, wi) => (h === 0 && wi === 1 ? 1 : 0));
      const k = ease.outCubic(clamp(lt / 0.25, 0, 1));
      setCam(ctx, { pos: L(-42.5 + 3 * (1 - k), 8.6, 2.6), look: L(-49.6, 10.6, 1.5), fov: 30 }, 1.0, '#ffe6b0', 14);
      tag(ctx, '3:00 AM', ctx.time('b03.w12') - 0.05, Infinity, { y: 0.12, size: 92, bg: 'rgba(30,30,80,0.9)' });
    },
  },
  // ── b04 "So, two rules. One: paint your house green. Nothing ever bites green."
  {
    name: 'paint it green', start: 'b04-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { edits: { hide: [6] } });
      const P = ctx.props, Y = P.yellow; house(ctx, Y, 6);
      ctx.store.cr = crowd(ctx, [X[14], X[15], X[16]], [[-17.6, 0, 9.7, 0.15], [-14.6, 0, 9.8, -0.1], [-12.0, 0, 9.5, -0.3]]);
      ctx.store.cr.forEach((c, i) => { const r = P.rollers[i]; ctx.add(r, c.ch.joints.handR); r.position.set(0, -0.02, 0); r.rotation.set(-PI / 2 + 0.25, 0, 0); r.userData.setColor('#5bd65b'); c.ch.setAccessory('cap', true); });
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      ctx.store.cr.forEach((c, i) => { rollerPose(c.ch, t + c.ph, i * 1.3); c.ch.face(i === 1 ? 'grin' : 'determined', t + c.ph); });
      const u = clamp(0.12 + (t - ctx.time('b04')) / 2.6, 0, 1);
      P.yellow.userData.paint(u, '#5bd65b', 1);
      moveCam(ctx, { pos: L(-12.8, 7.9, 3.6), look: L(-15.0, 3.0, 10.6), fov: 64 }, { pos: L(-13.0, 7.6, 4.2), look: L(-15.0, 3.1, 10.6), fov: 62 }, lt / 2.9);
      tag(ctx, 'RULE 1: PAINT IT GREEN', ctx.markers.r1 - 0.05, Infinity, { y: 0.13, size: 62, bg: 'rgba(40,150,60,0.93)' });
    },
  },
  {
    name: 'nothing bites green', start: 'b04.w8-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { edits: { hide: [2, 4], paint: { 3: '#5bd65b' }, roofPaint: { 3: '#2f9a3a' } } });
      house(ctx, ctx.props.peach, 4); house(ctx, ctx.props.mint, 2);
      ctx.props.yellow.userData.paint(0, null);
    },
    update(ctx, lt) {
      const L = ctx.store.L;
      moveCam(ctx, { pos: L(13.4, 11.4, 12.6), look: L(12.5, 6, -12), fov: 72 }, { pos: L(13, 11, 12), look: L(12.5, 6, -12), fov: 70 }, lt / 1.6);
      { const sp = scr(ctx, L(9, 9.5, -10.5)); stamp(ctx, 'SAFE', ctx.time('b04.w11') - 0.05, { x: clamp(sp.x, 0.2, 0.8), y: 0.22, size: 140, fill: '#3fd04a', stroke: '#ffffff', rot: -0.1 }); }
      tag(ctx, 'RULE 1: PAINT IT GREEN', ctx.time('b04.w8') - 0.12, Infinity, { y: 0.1, size: 54, bg: 'rgba(40,150,60,0.93)' });
    },
  },
  // ── b05 "Two: never touch the string on the clock tower. Nobody knows why."  (dusk)
  {
    name: 'tower tilt', start: 'b05-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { glow: 0.5 }); towerDress(ctx, { clock: true, h: 7 });
      ctx.store.cr = crowd(ctx, [X[2], X[9]], [[-47.6, 0, 3.4, -PI / 2 + 0.4], [-47.4, 0, 0.2, -PI / 2 - 0.3]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, ts = ctx.time('b05.w4');
      ctx.store.cr.forEach((c, i) => { c.ch.pose('idle', t + c.ph, { headPitch: -0.6 }); c.ch.face('neutral', 0.3); });
      const k = ease.inOutSine(clamp(lt / 1.6, 0, 1));
      moveCam(ctx, { pos: L(-41.5, 0.9, 3.0), look: L(-51, 5.0, 1.5), fov: 52 }, { pos: L(-42.5, 1.1, 2.8), look: L(-51, 16.4, 1.5), fov: 40 }, k, 0);
      ctx.props.wick.userData.set(t, 0);
      if (t > ts) { const g = ctx.props.glint; ctx.add(g); g.position.copy(L(TOWER.x + 0.3, TOWER.top + 3.0, TOWER.z)); g.scale.setScalar(2.4 * Math.max(0, 1 - (t - ts) / 0.5)); }
      tag(ctx, "RULE 2: DON'T TOUCH THE STRING", ctx.markers.r2 - 0.05, Infinity, { y: 0.12, size: 54, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  {
    name: 'nobody knows', start: 'b05.w9-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { glow: 0.5 }); towerDress(ctx, { clock: true, h: 7 });
      ctx.store.cr = crowd(ctx, [X[2], X[9]], [[-45.5, 0, 2.6, PI / 2 - 0.35], [-45.3, 0, 1.2, PI / 2 + 0.35]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.store.cr.forEach((c, i) => { if (lt < 0.45) { c.ch.pose('idle', t, { headPitch: -0.7 }); c.ch.face('squint', 0.3); } else { c.ch.pose('shrug', lt - 0.45 + i * 0.1, {}); c.ch.face(i ? 'sweat' : 'neutral', 0.3); } });
      const f = humanFace(ctx.store.cr[0].ch).lerp(humanFace(ctx.store.cr[1].ch), 0.5);
      setCam(ctx, { pos: L(-40.6, 2.8, 1.9), look: f.clone().add(up(-1.0)), fov: 42 }, 0.5, '#ffe0c0');
    },
  },
  // ── b06 "Mr. Bramble painted his house green. And his cat. And himself."
  {
    name: 'bramble proud', start: 'b06-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { edits: { paint: { 7: '#4fc24a' }, roofPaint: { 7: '#1f7a24' } } });
      put(ctx, 'bramble', L(-5.0, 0.12, 6.5), PI - 0.15);
      put(ctx, 'gcat', L(-4.1, 0.12, 6.1), PI + 0.4);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, b = ctx.cast.bramble;
      b.pose('crossArms', t); b.face('smug', 0.5);
      ctx.cast.gcat.pose('sit', t); ctx.cast.gcat.face('smug', 0.5);
      moveCam(ctx, { pos: L(-4.4, 1.25, 1.6), look: L(-5.0, 0.95, 6.5), fov: 54 }, { pos: L(-4.6, 1.3, 2.2), look: L(-5.0, 0.95, 6.5), fov: 52 }, lt / 2.6);
    },
  },
  {
    name: 'green cat', start: 'cat-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { edits: { paint: { 7: '#4fc24a' }, roofPaint: { 7: '#1f7a24' } } });
      put(ctx, 'bramble', L(-5.0, 0.12, 6.5), PI - 0.15);
      put(ctx, 'gcat', L(-4.1, 0.12, 6.1), PI + 0.4);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.cast.bramble.pose('crossArms', t); ctx.cast.bramble.face('smug', 0.5);
      ctx.cast.gcat.pose('sit', t); ctx.cast.gcat.face(lt > 0.4 ? 'smug' : 'neutral', 0.5);
      const cp = L(-4.1, 0.42, 6.1);
      const k = ease.outCubic(clamp(lt / 0.2, 0, 1));
      setCam(ctx, { pos: L(-3.6 - 0.2 * (1 - k), 0.55, 4.6 - 0.6 * (1 - k)), look: cp.clone().add(up(-0.05)), fov: 40 });
      pop(ctx, ctx.time('cat') + 0.3, 0.1, '#ffffff', 0.3);
      tag(ctx, '+ CAT', ctx.time('b06.w8') - 0.02, Infinity, { y: 0.16, size: 80, bg: 'rgba(40,150,60,0.93)' });
    },
  },
  {
    name: 'green himself', start: 'self-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { edits: { paint: { 7: '#4fc24a' }, roofPaint: { 7: '#1f7a24' } } });
      put(ctx, 'bramble', L(-5.0, 0.12, 6.5), PI - 0.15);
    },
    update(ctx, lt) {
      const b = ctx.cast.bramble, t = ctx.t;
      b.pose('crossArms', t); b.face('grin', 0.5);
      const k = ease.outCubic(clamp(lt / 0.2, 0, 1));
      setCam(ctx, faceCam(b, 3.6 - 0.4 * k, 0.3, 0.45, 34));
      tag(ctx, '+ HIMSELF', ctx.markers.self - 0.02, Infinity, { y: 0.08, size: 64, bg: 'rgba(40,150,60,0.93)' });
    },
  },
  // ── b07 "My mom refused. Our house stays bubblegum pink, because it's a vibe."
  {
    name: 'mom refused', start: 'b07-0.12', set: 'town',
    setup(ctx) {
      const L = homeStreet(ctx, 'day', { roof: 'pink' });
      ctx.props.home.userData.setLit(0, '#ffd27a', true);
      const P = ctx.props; addTo(ctx, P.chair, -25.2, 0.12, 6.7, PI - 0.55);
      put(ctx, 'mom', L(-25.2, 0.12, 6.7), PI - 0.55);
      put(ctx, 'me', L(-23.7, 0.12, 6.4), PI + 0.35);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tr = ctx.time('b07.w2');
      const mom = ctx.cast.mom, me = ctx.cast.me;
      if (t < tr) { mom.pose('sit', t, { seatHeight: 0.42, hands: 'lap' }); mom.face('smug', 0.4); }
      else { mom.pose('shrug', t - tr, { seated: true, seatHeight: 0.42 }); mom.face('smug', 0.4); }
      facepalm(me, t); me.face('sad', 0.4);
      const c = { pos: L(-24.5, 1.55, 0.6), look: L(-24.45, 1.0, 6.5), fov: 48 };
      setCam(ctx, c);
      stamp(ctx, 'REFUSED', tr - 0.02, { y: 0.1, size: 130, rot: -0.08 });
      if (t > tr && t < tr + 0.12) ctx.cam.shake(0.25, t, 9);
    },
  },
  {
    name: 'bubblegum pink', start: 'b07.w3-0.1', set: 'town',
    setup(ctx) {
      const L = homeStreet(ctx, 'day', { roof: 'pink' });
      ctx.props.home.userData.setLit(0, '#ffd27a', true);
      const P = ctx.props; addTo(ctx, P.chair, -24.8, 0.12, 7.5, PI - 0.4);
      put(ctx, 'mom', L(-24.8, 0.12, 7.5), PI - 0.4);
      put(ctx, 'me', L(-23.5, 0.12, 7.2), PI + 0.3);
      addTo(ctx, P.sparks, -27, 5, 9);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.cast.mom.pose('sit', t, { seatHeight: 0.42, hands: 'lap' }); ctx.cast.mom.face('smug', 0.4);
      if (t < ctx.time('b07.w5')) { facepalm(ctx.cast.me, t); ctx.cast.me.face('sad', 0.4); } else { ctx.cast.me.pose('shrug', 0.6 + 0.2 * Math.sin(t), {}); ctx.cast.me.face('squint', 0.4); }
      moveCam(ctx, { pos: L(-25.4, 1.2, -1.6), look: L(-24.9, 4.6, 10), fov: 62 }, { pos: L(-25.0, 1.15, -0.6), look: L(-24.7, 4.4, 10), fov: 60 }, lt / 2.6);
      ctx.props.sparks.userData.set(t, 0.9);
      quoteCard(ctx, "It's a vibe.", 'Mom', ctx.time('b07.w8') - 0.1, ctx.time('b07.end') + 0.28, { y: 0.3, byAt: ctx.time('b07.w11') });
    },
  },
  // ── b08 "So I'm investigating. Detective. Unpaid."
  {
    name: 'detective', start: 'b08-0.12', set: 'room',
    setup(ctx) { detectiveRoom(ctx, 'day'); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me;
      me.pose('think', t); me.face(t > ctx.time('b08.w3') ? 'smug' : 'determined', 0.6);
      moveCam(ctx, { pos: R(0.2, 1.45, 2.4), look: R(1.1, 1.4, -1.4), fov: 50 }, { pos: R(0.5, 1.45, 1.6), look: R(1.05, 1.48, -1.2), fov: 46 }, ease.inOutSine(lt / 3.0));
      tag(ctx, 'DETECTIVE', ctx.time('b08.w3') - 0.05, Infinity, { y: 0.075, size: 74, bg: 'rgba(60,40,20,0.92)' });
      stamp(ctx, '(UNPAID)', ctx.time('b08.w4') - 0.03, { y: 0.165, size: 88, rot: -0.06 });
    },
  },
  // ── b09 "First clue: the bites taste sweet. Don't ask how I know."
  {
    name: 'lick', start: 'b09-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { edits: { hide: [1] } }); house(ctx, ctx.props.lilac, 1);
      const P = ctx.props; addTo(ctx, P.biteWall, -6.0, 0.12, -6.9, 0);
      addTo(ctx, P.crumbs, -5.6, 0.12, -6.0);
      const me = put(ctx, 'me', L(-3.55, 0.12, -6.5), -PI / 2); capOn(ctx, me);
      ctx.add(P.tongue, me.joints.head); P.tongue.position.set(0, 0.13, 0.27);
      addTo(ctx, P.sparks, -5.6, 1.9, -6.2);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, P = ctx.props, ts = ctx.time('b09.w5');
      const lean = t < ts ? ease.inOutSine(clamp(lt / 0.7, 0, 1)) : 0;
      const cam = { pos: L(-5.7, 1.8, -3.5), look: L(-4.0, 1.65, -6.6), fov: 42 };
      const target = L(-3.97, 2.0, -6.75);   // cream edge at the bottom of the bite, on the wall's front face
      if (t < ts) {
        me.root.position.copy(L(-3.55, 0.12, -6.5)); me.root.rotation.set(0, -PI / 2, 0);
        me.pose('peer', t, { intensity: 0.4 }); me.joints.torso.rotation.x += 0.25 * lean; me.joints.head.rotation.x -= 0.45 * lean; me.face('laugh', 0.5);
        // slide toward the wall so the tongue tip reaches the bite edge
        me.root.updateMatrixWorld(true); const tip = P.tongue.localToWorld(V(0, 0, 0.14));
        const dlt = target.clone().sub(tip); dlt.y = 0; if (dlt.length() > 0.7) dlt.setLength(0.7);
        me.root.position.addScaledVector(dlt, 0.85 * lean);
        me.root.updateMatrixWorld(true);
        const base = P.tongue.getWorldPosition(V()), dist = base.distanceTo(target);
        P.tongue.lookAt(target); P.tongue.visible = lean > 0.6;
        P.tongue.scale.set(1, 1, clamp(dist / 0.14, 0.4, 4) * (lean > 0.85 ? 1 - 0.12 * Math.abs(Math.sin(t * 9)) : ease.outCubic(clamp((lean - 0.6) / 0.25, 0, 1))));
      } else {
        // snap to face the camera: shocked
        const yaw = Math.atan2(cam.pos.x - me.root.position.x, cam.pos.z - me.root.position.z);
        me.root.rotation.set(0, yaw, 0);
        me.pose('surprised', 0.12 + 0.3 * clamp((t - ts) / 0.4, 0, 1), {}); me.face(t > ctx.time('b09.w6') ? 'wink' : 'shocked', 0.5);
        P.tongue.visible = false;
      }
      setCam(ctx, cam);
      P.sparks.userData.set(t, t > ts ? clamp((t - ts) / 0.2, 0, 1) : 0);
      tag(ctx, 'CLUE #1: SWEET', ctx.time('b09.w1') - 0.05, ts - 0.02, { y: 0.1, size: 66, bg: 'rgba(255,79,163,0.92)' });
      stamp(ctx, 'SWEET!', ts, { y: 0.1, size: 120, fill: '#ff4fa3', rot: 0.06 });
    },
  },
  // ── b10 "Second clue: rainbow sprinkles all over the street."
  {
    name: 'sprinkles', start: 'b10-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      addTo(ctx, ctx.props.sprinkles, -2, 0.005, 0.5);
      const me = put(ctx, 'me', L(-5.0, 0, 0.4), PI / 2 - 0.25); capOn(ctx, me);
      const P = ctx.props; ctx.add(P.mag); P.mag.scale.setScalar(2.0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      skyMood(ctx, 'sunrise', 0.65);
      me.pose('peer', t, { seated: true, seatHeight: 0.42, headPitch: 0.05 }); me.face('squint', 0.5);
      const J = me.joints; J.torso.rotation.x += 0.3;
      J.armR.rotation.set(-1.5, 0, 0.6); J.foreArmR.rotation.set(-1.0, 0, 0);
      { const M = ctx.props.mag; me.root.updateMatrixWorld(true); const eye = J.head.localToWorld(V(-0.15, 0.32, 0.62)); M.position.copy(eye).add(up(-0.2 * 2.0)); M.rotation.set(0, me.root.rotation.y, 0); }
      J.armL.rotation.set(-0.5, 0, -0.25); J.foreArmL.rotation.set(-1.0, 0, 0);
      const k = ease.inOutSine(clamp(lt / 2.6, 0, 1));
      moveCam(ctx, { pos: L(4.0, 0.3, 1.3), look: L(-5, 0.6, 0.3), fov: 46 }, { pos: L(-1.8, 0.45, 0.9), look: L(-5.0, 0.7, 0.3), fov: 42 }, k);
      ctx.fx.overlay('#ffb070', 0.06);
      tag(ctx, 'CLUE #2: SPRINKLES', ctx.time('b10.w1') - 0.05, Infinity, { y: 0.11, size: 66, bg: 'rgba(138,92,255,0.92)' });
    },
  },
  // ── b11 "Third clue: the bite has a gap. The biter's missing a front tooth."
  {
    name: 'gap tooth clue', start: 'b11-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { edits: { hide: [1] } });
      addTo(ctx, ctx.props.biteWall, -15.0, 0.12, -9.6, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, BW = ctx.props.biteWall;
      BW.updateMatrixWorld(true);
      const gap = BW.localToWorld(BW.userData.gap.clone());
      const k = ease.inOutSine(clamp(lt / 3.0, 0, 1));
      const c = moveCam(ctx, { pos: gap.clone().add(V(0.7, -1.6, 4.8)), look: gap.clone().add(V(0.05, 0.45, 0)), fov: 42 }, { pos: gap.clone().add(V(0.5, -1.4, 4.0)), look: gap.clone().add(V(0.0, 0.42, 0)), fov: 40 }, k);
      ringAt(ctx, gap.clone().add(V(0, -0.02, 0.06)), ctx.markers.gap, 0.36);
      if (t > ctx.markers.gap + 0.15) { const sp = scr(ctx, gap.clone().add(up(0.28))); tag(ctx, 'NO TOOTH HERE', ctx.markers.gap + 0.15, Infinity, { x: 0.5, y: 0.2, size: 60, bg: 'rgba(232,35,43,0.92)', rot: 0.02 }); arrow2d(ctx, 0.5, 0.24, sp.x, Math.max(0.27, sp.y - 0.02)); }
      tag(ctx, 'CLUE #3: GAP TOOTH', ctx.time('b11.w1') - 0.05, Infinity, { y: 0.11, size: 66, bg: 'rgba(232,35,43,0.92)' });
    },
  },
  // ── b12 HUSS ×3 — fist into palm, the corkboard shakes, a photo drops
  ...[0, 1, 2].map((i) => ({
    name: `fist #${i + 1}`, start: H('b12', i), set: 'room',
    setup(ctx) { detectiveRoom(ctx, 'day'); ctx.cast.me.root.rotation.y = -0.2; },
    update(ctx) {
      const R = ctx.store.R, t = ctx.t, hits = hussHits(ctx, 'b12'), me = ctx.cast.me, P = ctx.props;
      fistPalm(me, t, hits); const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      me.face(dh < 0.25 ? 'huss' : 'determined', 0.6);
      const hp = hitPulse(hits, t, 0.12);
      P.cork.rotation.z = 0.04 * hp * Math.sin(t * 60);
      const ph = P.cork.userData.photo, fall = clamp((t - hits[2]) / 0.5, 0, 1);
      ph.position.copy(P.cork.userData.photoHome).add(V(0.05 * fall, -1.9 * fall * fall, 0.06 * fall)); ph.rotation.z = P.cork.userData.photoRot + 2.2 * fall;
      const cams = [faceCam(me, 2.6, 0.5, 0.42, 40, -0.2), faceCam(me, 1.7, -0.45, 0.38, 36, -0.1), { pos: R(0.0, 1.35, 1.6), look: R(1.25, 1.35, -1.6), fov: 50 }];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.1, 0.2); shakeOn(ctx, hits, 0.3, 0.2, 4 + i);
    },
  })),
  // ── b13 "Everyone blamed Big Gus. But Gus has all his teeth."
  {
    name: 'blame gus', start: 'b13-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props, gus = put(ctx, 'gus', L(45.0, 0, 0.3), -PI / 2);
      ctx.add(P.pancakes);
      ctx.store.cr = crowd(ctx, [X[0], X[1], X[3], X[5], X[7], X[10], X[12], X[14]], [[40.6, 0, -2.6, PI / 2 - 0.4], [40.0, 0, -1.0, PI / 2 - 0.2], [40.2, 0, 1.4, PI / 2 + 0.2], [41.0, 0, 3.0, PI / 2 + 0.5], [38.8, 0, -2.0, PI / 2], [38.6, 0, 0.4, PI / 2], [38.9, 0, 2.4, PI / 2 + 0.2], [39.8, 0, -2.2, PI / 2 - 0.5]]);
      filler(ctx, blockFill(33, 38, -1.5, 6.5, 40, { seed: 4, faceX: 45, faceZ: 0 }));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, gus = ctx.cast.gus, P = ctx.props;
      gus.pose('idle', t, { intensity: 0.3 }); gus.joints.armL.rotation.set(-0.5, 0, -0.35); gus.joints.foreArmL.rotation.set(-1.2, 0, 0); gus.face(lt > 0.6 ? 'sweat' : 'neutral', 0.5);
      gus.root.updateMatrixWorld(true);
      P.pancakes.position.copy(gus.joints.handL.getWorldPosition(V())).add(up(-0.06)); P.pancakes.rotation.set(0, 0, 0); P.pancakes.scale.setScalar(1.0);
      ctx.store.cr.forEach((c, i) => { c.ch.pose(i % 3 === 2 ? 'pointLaugh' : 'point', t + c.ph, {}); c.ch.face(i % 2 ? 'determined' : 'smug', t + c.ph); });
      P.filler.userData.set(t, { arms: 'cheer', bounce: 0.3, speed: 0.7 });
      moveCam(ctx, { pos: L(38.0, 3.1, -7.0), look: L(44.3, 1.7, 0.3), fov: 44 }, { pos: L(38.5, 3.0, -6.5), look: L(44.3, 1.8, 0.3), fov: 40 }, lt / 1.6);
      tag(ctx, 'SUSPECT: BIG GUS', ctx.time('b13.w2') - 0.05, Infinity, { y: 0.12, size: 70, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  {
    name: 'gus teeth', start: 'b13.w4-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props, gus = put(ctx, 'gus', L(45.0, 0, 0.3), -PI / 2);
      ctx.add(P.pancakes);
      ctx.add(P.gusTeeth, gus.joints.head); P.gusTeeth.position.set(0, 0.155, 0.292); P.gusTeeth.scale.setScalar(1.0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, gus = ctx.cast.gus, P = ctx.props, tt = ctx.time('b13.w9');
      gus.pose('idle', t, { intensity: 0.3 }); gus.joints.armL.rotation.set(-0.5, 0, -0.35); gus.joints.foreArmL.rotation.set(-1.2, 0, 0); gus.face('smile', 0.5);
      gus.root.updateMatrixWorld(true);
      P.pancakes.position.copy(gus.joints.handL.getWorldPosition(V())).add(up(-0.06)); P.pancakes.scale.setScalar(1.0);
      P.gusTeeth.userData.glint.material.opacity = t > tt ? 0.5 + 0.5 * Math.sin(t * 12) : 0.4;
      const k = ease.outCubic(clamp(lt / 0.25, 0, 1));
      setCam(ctx, faceCam(gus, 4.9 - 0.5 * k, 0.35, 0.5, 34));
      stamp(ctx, 'CLEARED', tt - 0.02, { y: 0.09, size: 120, fill: '#3fd04a', stroke: '#ffffff', rot: -0.06 });
      tag(ctx, 'ALL HIS TEETH', ctx.time('b13.w6') - 0.05, tt - 0.03, { y: 0.08, size: 58 });
    },
  },
  // ── b14 "So I made a trap. If it likes sweet, let's see how it likes spicy."  (dusk, on our roof)
  {
    name: 'roof trap wide', start: 'b14-0.12', set: 'town',
    setup(ctx) {
      const L = homeStreet(ctx, 'dusk', { roof: 'pink', glow: 0.5 });
      const P = ctx.props, me = put(ctx, 'me', slotPt(ctx, HOME, 1.4, ROOF_Y, 0), PI + 0.35);
      addTo(ctx, P.sauce, ...slotPt(ctx, HOME, -0.6, ROOF_Y - 0.08, 0.0).toArray(), PI + 0.2, 1.0);
      ctx.add(P.redRoller, me.joints.handR); P.redRoller.position.set(0, 0, 0); P.redRoller.rotation.set(-1.1, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, H0 = ctx.props.home.userData;
      paintRoofPose(me, t); me.face('determined', 0.5);
      const u = clamp((t - ctx.time('b14')) / 2.6 + 0.25, 0, 1);
      paintRoof(ctx, u);
      moveCam(ctx, { pos: L(-22.0, 3.0, 3.2), look: L(-26.0, 8.6, 13), fov: 50 }, { pos: L(-22.6, 3.4, 4.6), look: L(-26.0, 8.9, 13), fov: 46 }, lt / 1.2, 0.6, '#ffd8b0');
      tag(ctx, 'TRAP: EXTRA SPICY', ctx.markers.paint - 0.05, Infinity, { y: 0.12, size: 66, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  {
    name: 'roof trap smug', start: 'b14.w5-0.12', set: 'town',
    setup(ctx) {
      const L = homeStreet(ctx, 'dusk', { roof: 'pink', glow: 0.5 });
      const P = ctx.props, me = put(ctx, 'me', slotPt(ctx, HOME, 1.4, ROOF_Y, 0), PI);
      addTo(ctx, P.sauce, ...slotPt(ctx, HOME, 0.45, ROOF_Y - 0.08, -0.25).toArray(), PI + 0.1, 1.0);
      ctx.add(P.redRoller, me.joints.handR); P.redRoller.position.set(0, 0, 0); P.redRoller.rotation.set(-1.1, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, ts = ctx.time('b14.w14');
      if (t < ts - 0.3) { paintRoofPose(me, t); me.face('determined', 0.5); } else { me.pose('crossArms', t); me.face('smug', 0.5); }
      paintRoof(ctx, clamp((t - ctx.time('b14')) / 2.6 + 0.25, 0, 1));
      const fc = faceCam(me, 4.6, 0.6, 0.45, 42), bt = slotPt(ctx, HOME, 0.45, ROOF_Y + 1.0, -0.25);
      fc.look.lerp(bt.clone().setY(fc.look.y), 0.55);
      setCam(ctx, fc, 0.9, '#ffd8b0');
      stamp(ctx, 'EXTRA SPICY', ts - 0.02, { x: 0.41, y: 0.1, size: 92, rot: -0.06 });
      flameIcon(ctx, 0.85, 0.12, 1.6, ts);
    },
  },
  // ── b15 "Then last night, the crunch was on my street."
  {
    name: 'bolt upright', start: 'b15-0.12', set: 'room',
    setup(ctx) {
      const R = room(ctx, { light: 'night', win: 'dark' });
      put(ctx, 'me', R(-1.95, 0.0, -1.55), 0);
      const P = ctx.props; addTo(ctx, P.moonSky, -0.8, 1.6, -3.05, 0); addTo(ctx, P.shadow, -0.8, 1.6, -2.75, 0);
    },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me, tc = ctx.time('b15.w4'), P = ctx.props;
      const u = ease.outBack(clamp((t - tc - 0.05) / 0.22, 0, 1));
      me.pose('sit', t, { seatHeight: 0.55, hands: 'lap' });
      me.joints.torso.rotation.x += 0.55 * (1 - u); me.joints.head.rotation.x += 0.35 * (1 - u);
      me.face(t < tc ? 'sleepy' : 'shocked', 0.4);
      if (t > tc) { me.joints.armL.rotation.z -= 0.6 * u; me.joints.armR.rotation.z += 0.6 * u; }
      // the giant shadow sliding past the window
      const sx = lerp(-3.2, 1.8, clamp((t - tc + 0.1) / 1.5, 0, 1));
      P.shadow.position.set(sx, 1.75 - 0.25 * clamp((t - tc) / 1.2, 0, 1), -2.75);
      setCam(ctx, { pos: R(0.2, 1.3, 1.7), look: R(-1.75, 1.1, -1.6), fov: 46 }, 0.9, '#c8d0ff');
      shakeOn(ctx, [tc + 0.02], 0.9, 0.6, 12);
      stamp(ctx, 'CRUNCH', tc + 0.02, { y: 0.22, size: 140, fill: '#ffd23f', stroke: '#1d1d22', t1: tc + 0.6 });
    },
  },
  // ── b16 "A giant fork stabbed down and lifted our roof off like a cracker. Then it bit."
  {
    name: 'fork stab', start: 'b16-0.12', set: 'town',
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'red', glow: 0.7 }); storm(ctx);
      const F = ctx.props.fork; addTo(ctx, F, HX, 60, HZ + 0.3, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, F = ctx.props.fork, ts = ctx.time('b16.w3');
      storm(ctx);
      const u = ease.inCubic(clamp((t - ctx.time('b16.w1') + 0.1) / (ts - ctx.time('b16.w1') + 0.1), 0, 1));
      F.position.copy(L(HX + 0.2, lerp(70, 6.6, u), HZ + 0.6)); F.rotation.set(-0.12, 0, 0.05);
      lightning(ctx, [ctx.time('b16') + 0.1, ts + 0.02]);
      setCam(ctx, { pos: L(-30.5, 0.8, 1.2), look: L(-27.2, 10.5, 13), fov: 62 }, 0.6, '#c8b8ff');
      shakeOn(ctx, [ts + 0.02], 1.0, 0.45, 6);
      stamp(ctx, 'STAB', ts + 0.02, { y: 0.2, size: 120, fill: '#dfe4ee', stroke: '#1d1d22', t1: ts + 0.6 });
    },
  },
  {
    name: 'roof lift', start: 'lift-0.12', set: 'town',
    setup(ctx) { homeStreet(ctx, 'quiet_night', { roof: 'red', glow: 0.7 }); storm(ctx); addTo(ctx, ctx.props.fork, HX, 6.6, HZ, 0); addTo(ctx, ctx.props.crumbRain, HX, 6, HZ - 2); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, F = P.fork, tl = ctx.markers.lift;
      storm(ctx);
      const u = ease.inOutCubic(clamp((t - tl) / 1.6, 0, 1));
      const y = lerp(0, 30, u);
      F.position.copy(L(HX + 0.2, 6.6 + y, HZ + 0.6)); F.rotation.set(-0.12, 0, 0.05);
      const R0 = P.home.userData.roof; R0.position.set(0, y, 0); R0.rotation.set(0.06 * u, 0, -0.08 * u);
      P.crumbRain.position.copy(L(HX, 6.2 + y * 0.5 - 6 * u * u, HZ - 1.5)); P.crumbRain.visible = u > 0.05 && u < 0.95;
      lightning(ctx, [tl + 0.9]);
      setCam(ctx, { pos: L(-13.5, 9.2, 7.6), look: L(-27, 10.5 + 0.8 * y, 14), fov: 56 + 6 * u }, 0.5, '#c8b8ff');
      tag(ctx, 'LIKE A CRACKER', ctx.time('b16.w12') - 0.05, Infinity, { y: 0.12, size: 64 });
    },
  },
  {
    name: 'it bit', start: 'b16.w13-0.12', set: 'town',
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'red', glow: 0.7 }); storm(ctx);
      const P = ctx.props; addTo(ctx, P.fork, HX, 36.6, HZ, 0); addTo(ctx, P.crumbRain, HX, 30, HZ);
      addTo(ctx, P.burst2.root, HX, 38, HZ);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tb = ctx.markers.bite;
      storm(ctx);
      const bitten = t >= tb;
      const yy = 30 + 1.5 * lt;
      P.fork.position.copy(L(HX + 0.2, 6.6 + yy, HZ + 0.6)); P.fork.rotation.set(-0.12, 0, 0.05);
      const U = P.home.userData; U.roof.visible = !bitten; U.roofB.visible = bitten;
      for (const R0 of [U.roof, U.roofB]) { R0.position.set(0, yy, 0); R0.rotation.set(0.06, 0, -0.08); }
      const db = t - tb;
      P.crumbRain.visible = db > 0; P.crumbRain.position.copy(L(HX + 1, 36 + yy - 30 - 9 * Math.max(0, db) ** 2 * 3, HZ - 1));
      P.burst2.update(clamp(db / 1.0, 0, 1.01)); P.burst2.root.position.copy(slotPt(ctx, HOME, -4.6, 8.6 + yy, 3.6));
      lightning(ctx, [tb + 0.01], { popA: 0.3, dur: 0.1, single: true });
      const slab = slotPt(ctx, HOME, -0.8, 7.6 + yy, 0);
      setCam(ctx, { pos: slab.clone().add(V(14, 7, -26)), look: slab.clone().add(V(-0.5, 1.5, 0)), fov: 34 }, 0, '#c8b8ff');
      shakeOn(ctx, [tb + 0.01], 1.2, 0.5, 8);
      stamp(ctx, 'CRUNCH!', tb, { y: 0.22, size: 160, fill: '#ffd23f', stroke: '#1d1d22' });
    },
  },
  // ── b17 "Then the fork came back for me."  (roofless bedroom)
  {
    name: 'fork returns', start: 'b17-0.12', set: 'room',
    setup(ctx) { room(ctx, { light: 'night', win: 'dark', exposure: 1.25 }); roomStorm(ctx, 1); put(ctx, 'me', ctx.store.R(0.15, 0, -0.2), 0.15); addTo(ctx, ctx.props.fork, 0, 30, 0, 0, 0.5); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me, F = ctx.props.fork, tm = ctx.time('b17.w5');
      roomStorm(ctx, 1);
      const u = ease.inQuad(clamp((t - ctx.time('b17.w2') + 0.25) / (ctx.time('b17.w6') - ctx.time('b17.w2') + 0.25), 0, 1));
      F.position.copy(R(0.6, lerp(9, 2.0, u), -0.15)); F.rotation.set(0.25, 0.1, 0.05); F.scale.setScalar(0.5);
      const d = clamp((t - tm - 0.05) / 0.3, 0, 1);
      if (d <= 0) { me.pose('stunned', t, { headPitch: -0.6 }); me.face('shocked', 0.4); me.root.position.copy(R(0.15, 0, -0.2)); me.root.rotation.set(0, 0.15, 0); }
      else { divePose(me, t, d); me.face('sweat', 0.4); me.root.position.copy(R(0.15 - 1.1 * d, 0.35 * Math.sin(PI * d), -0.2)); me.root.rotation.set(0, 0.15, 0.9 * d); }
      const dv = ease.inOutSine(d);
      setCam(ctx, { pos: R(lerp(1.6, 2.2, dv), lerp(1.3, 1.2, dv), lerp(2.6, 3.2, dv)), look: R(lerp(0.1, 0.15 - 1.1 * d, 0.7 * dv), lerp(1.1, 1.3, dv), -0.5), fov: lerp(58, 66, dv) }, 1.1, '#d0d8ff');
      shakeOn(ctx, [tm + 0.2], 0.6, 0.3, 4);
    },
  },
  // ── b18 "Ah, almost... almost!"  — freeze frame, slow orbit
  {
    name: 'almost', start: 'b18-0.12', set: 'room',
    setup(ctx) {
      room(ctx, { light: 'night', win: 'dark', exposure: 1.25 }); roomStorm(ctx, 1);
      put(ctx, 'me', ctx.store.R(0.45, 0.32, -0.2), 0.15);
      const P = ctx.props; addTo(ctx, P.fork, 0, 3, 0, 0, 0.5);
      ctx.add(P.sweat); ctx.add(P.sweat2);
    },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me, P = ctx.props, F = P.fork;
      roomStorm(ctx, 1);
      divePose(me, 0, 0.75); me.face('sweat', 0.2);
      me.root.position.copy(R(0.45, 0.32, -0.2)); me.root.rotation.set(0, 0.15, 0.7);
      const head = headPt(me, 0.62, 0.0);
      F.scale.setScalar(0.5); F.rotation.set(0.25, 0.1, 0.05);
      // the nearest tine tip a few cm from the hood
      F.updateMatrixWorld(true);
      const tip = F.userData.tines[1].getWorldPosition(V());
      F.position.add(head.clone().add(V(0.12, 0.16, 0.02)).sub(tip));
      P.sweat.position.copy(headPt(me, 0.55, 0.3).add(V(0.2, 0.15, 0))); P.sweat2.position.copy(headPt(me, 0.4, 0.2).add(V(-0.25, 0.3, 0.1)));
      const a = lerp(-0.5, 0.45, ease.inOutSine(clamp(lt / 2.3, 0, 1)));
      const ctr = head.clone().add(V(0.05, -0.3, 0));
      setCam(ctx, { pos: ctr.clone().add(V(Math.sin(a) * 3.2, 0.25, Math.cos(a) * 3.2)), look: ctr.clone().add(up(-0.2)), fov: 44 }, 1.1, '#d0d8ff');
      ctx.fx.overlay('#3040a0', 0.16); ctx.fx.vignette(0.55);
      stamp(ctx, 'ALMOST!', ctx.time('b18.w1') - 0.02, { y: 0.08, size: 120, rot: -0.06, t1: ctx.time('b18.w2') - 0.05 });
      stamp(ctx, 'ALMOST!!', ctx.time('b18.w2') - 0.02, { y: 0.085, size: 150, rot: 0.05 });
      shakeOn(ctx, [ctx.time('b18.w2')], 0.5, 0.3, 2);
    },
  },
  // ── b19 "Then the sky yelled..."
  {
    name: 'sky yelled', start: 'b19-0.12', set: 'town',
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'none', glow: 0.7 }); storm(ctx);
      const P = ctx.props; addTo(ctx, P.fork, HX, 8, HZ, 0);
      put(ctx, 'me', slotPt(ctx, HOME, 0.6, 5.8, 2.8), PI + 0.3);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, ty = ctx.time('b19.w3'), me = ctx.cast.me, F = P.fork;
      const red = t > ty ? clamp((t - ty) / 0.05, 0, 1) : 0;
      storm(ctx, 1 - red); if (red > 0) skyMood(ctx, 'redBright', red * (0.85 + 0.15 * Math.sin(t * 40)));
      me.pose('stunned', t, { headPitch: -0.6 }); me.face('shocked', 0.4);
      // the fork is yanked up out of frame over ~0.3 s
      const head = headPt(me, 0.62, 0), u = ease.inCubic(clamp((t - ctx.time('b19') + 0.02) / 0.32, 0, 1));
      F.scale.setScalar(1); F.rotation.set(-0.1, 0.2, 0.08); F.position.set(0, 0, 0); F.updateMatrixWorld(true);
      const tip = F.userData.tines[1].getWorldPosition(V());
      F.position.add(head.clone().add(V(0.4, 0.7, -0.6)).sub(tip)).add(up(60 * u));
      const f = humanFace(me), yw = me.root.rotation.y, fw = V(Math.sin(yw), 0, Math.cos(yw)), sd = V(fw.z, 0, -fw.x);
      setCam(ctx, { pos: f.clone().addScaledVector(fw, 2.7).addScaledVector(sd, 0.5).add(up(-0.95)), look: f.clone().add(up(-0.5)), fov: 52 }, 1.4, '#ffd8d0');
      shakeOn(ctx, [ty + 0.02], 1.0, 0.6, 3);
      pop(ctx, ty, 0.12, '#ff2a10', 0.6);
    },
  },
  // ── b20 "Spicy!"  — the giant kid rises over the rooftops behind the clock tower
  {
    name: 'spicy', start: 'b20-0.15', set: 'town',
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'none', glow: 0.7 }); towerDress(ctx);
      const P = ctx.props; kidAt(ctx, [KS.x, 0, KS.z], PI / 2 - 0.12, KS.s, {});
      addTo(ctx, P.hand, -120, 40, 20, 0, 6); addTo(ctx, P.steam, -120, 30, 1.5, 0, 12);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, t0 = ctx.time('b20');
      skyMood(ctx, 'red', 0.85 + 0.15 * Math.sin(t * 30));
      const rise = ease.outBack(clamp((t - t0 + 0.1) / 0.35, 0, 1));
      const K = kidAt(ctx, [KS.x, lerp(-20, KS.y, rise), KS.z], PI / 2 - 0.12, KS.s, { eyes: 'shut', mouth: 'open', open: 0.85, tongue: 1, cheeks: 1, sweat: true, brows: 'worried' });
      K.updateMatrixWorld(true);
      const mouth = K.userData.mouth.getWorldPosition(V());
      const fan = Math.sin(t * 22);
      P.hand.position.copy(mouth.clone().add(V(12, -1 + 3.5 * fan, -9))); P.hand.rotation.set(0.3, -PI / 2 + 0.6, -1.3 + 0.35 * fan); P.hand.scale.setScalar(6); P.hand.userData.set({ curl: 0.1 });
      P.steam.position.copy(mouth.clone().add(V(-4, 34, 0))); P.steam.userData.set(t, rise);
      setCam(ctx, { pos: L(-25.0, 1.6, 2.4), look: L(-51, 5.4, -4.0), fov: 56 }, 0.5);
      shakeOn(ctx, [t0], 1.0, 0.6, 5);
      stamp(ctx, 'SPICY!!!', t0 - 0.02, { y: 0.09, size: 150, fill: '#ff3a1a', stroke: '#ffe14a', rot: -0.06 });
    },
  },
  // ── b21 HUSS ×6 — on the roofless house pointing up; the street lights up, the town pours out
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `point up #${i + 1}`, start: H('b21', i), set: 'town',
    setup(ctx) {
      const L = homeStreet(ctx, 'quiet_night', { roof: 'none', glow: 0 }); towerDress(ctx);
      put(ctx, 'me', slotPt(ctx, HOME, 0.4, 5.8, 2.8), PI + 0.75);
      ctx.store.cr = crowd(ctx, [X[0], X[2], X[4], X[6], X[8], X[11], X[13], X[15]], [
        [-15.4, 0.12, -8.6, -0.3], [-14.2, 0.12, -7.0, 0.2], [-3.4, 0.12, -8.2, 0.1], [-2.1, 0.12, -7.2, -0.2],
        [-16.0, 0.12, 7.6, PI - 0.3], [-13.8, 0.12, 8.3, PI + 0.2], [-4.0, 0.12, 8.0, PI + 0.1], [-2.6, 0.12, 6.8, PI - 0.4]]);
      filler(ctx, blockFill(-12, 6, -3.5, 3.5, 40, { seed: 21, faceX: -150, faceZ: 1.5 }));
      kidAt(ctx, [KS.x, KS.y, KS.z], PI / 2 - 0.12, KS.s, {});
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, hits = hussHits(ctx, 'b21'), me = ctx.cast.me, P = ctx.props;
      const n = hits.filter((h) => h <= t).length, h = lastBefore(hits, t), dh = h != null ? t - h : 9, hp = hitPulse(hits, t, 0.15);
      skyMood(ctx, 'red', 0.35);
      pointUp(me, t, 1, hp); me.face(dh < 0.25 ? 'huss' : 'determined', 0.4);
      kidAt(ctx, [KS.x, KS.y, KS.z], PI / 2 - 0.12, KS.s, { eyes: 'shut', mouth: 'o', tongue: 0.6, cheeks: 0.8, sweat: true, brows: 'worried' });
      // windows light up house by house, east to west, one wave per HUSS
      ctx.set.set('windowGlow', (hh, wi) => { const order = [5, 0, 6, 1, 7, 2, 3, 8, 4]; const k = order.indexOf(hh); return k >= 0 && k < n * 1.6 ? 1 : 0.05; });
      ctx.store.cr.forEach((c, k) => { const out = clamp((t - (hits[Math.min(5, Math.floor(k / 1.6))] ?? 0)) / 0.4, 0, 1); c.ch.pose('point', t + c.ph, { headPitch: -0.6 }); c.ch.face(k % 2 ? 'shocked' : 'sweat', t + c.ph); c.ch.root.position.copy(L(c.x, c.y, c.z - Math.sign(c.z) * 1.2 * out)); });
      P.filler.userData.set(t, { arms: 'up', bounce: 0.4 * hp, speed: 0.6 }); P.filler.visible = n >= 2;
      const mp = me.root.position.clone(), kd = V(KS.x, 0, KS.z).sub(V(mp.x, 0, mp.z)).normalize(), ks = V(-kd.z, 0, kd.x);
      const fc = humanFace(me), yw = me.root.rotation.y, fw = V(Math.sin(yw), 0, Math.cos(yw)), sd = V(fw.z, 0, -fw.x);
      const at = (f, s, y) => fc.clone().addScaledVector(fw, f).addScaledVector(sd, s).add(up(y));
      const cams = [
        { pos: at(2.7, 1.5, -0.6), look: at(0, 0, -0.4), fov: 52 },
        { pos: L(-31.5, 5.5, -2.0), look: L(-2, 3.5, -1.5), fov: 50 },
        { pos: L(-14.8, 1.35, -1.4), look: L(-14.8, 2.5, -9), fov: 54 },
        { pos: at(1.4, 2.9, -0.9), look: at(0, 0, 0.1), fov: 52 },
        { pos: mp.clone().addScaledVector(kd, -3.6).addScaledVector(ks, 0.6).add(up(0.6)), look: mp.clone().addScaledVector(kd, 40).add(up(9)), fov: 66 },
        { pos: at(0.8, 3.3, 0.0), look: at(0, 0, -0.1), fov: 54 },
      ];
      setCam(ctx, cams[i], 1.0, '#ffd8c8', 14); ctx.cam.punch(hits, t, 0.1, 0.2); shakeOn(ctx, hits, 0.45, 0.25, 11 + i);
      tag(ctx, 'THE BITER', ctx.time('b21') - 0.1, Infinity, { y: 0.1, size: 70, bg: 'rgba(200,0,40,0.9)' });
    },
  })),
  // ── b22 "A giant kid. Missing a front tooth."
  {
    name: 'gap grin', start: 'b22-0.12', set: 'town',
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'none', glow: 0.9 });
      kidAt(ctx, [-21, 30, -75], 0, 30, {});
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tt = ctx.time('b22.w6');
      skyMood(ctx, 'red', 0.2);
      const rise = ease.outCubic(clamp(lt / 0.9, 0, 1));
      const K = kidAt(ctx, [-21, lerp(26, 42, rise), -75], 0.05, 30, { eyes: 'happy', mouth: 'grin', cheeks: 0.5, sweat: true, brows: 'worried' }, 0.1);
      K.updateMatrixWorld(true);
      const gap = K.userData.teeth.localToWorld(V(-0.04, 0, 0.02));
      const k = ease.inOutSine(clamp(lt / 1.9, 0, 1));
      moveCam(ctx, { pos: L(-18, 0.6, 7.0), look: L(-20.5, 22.0, -75), fov: 66 }, { pos: L(-18, 0.65, 6.4), look: L(-20.5, 22.5, -75), fov: 62 }, k, 0.6, '#ffe0d0', 14);
      ringAt(ctx, gap, tt, 2.6);
      tag(ctx, 'GAP TOOTH: FOUND', tt - 0.05, Infinity, { y: 0.065, size: 62, bg: 'rgba(232,35,43,0.92)' });
    },
  },
  // ── b23 "He wasn't eating our town. Just checking if it was ready."
  {
    name: 'roof back', start: 'b23-0.12', set: 'town',
    setup(ctx) {
      const L = homeStreet(ctx, 'quiet_night', { roof: 'redBitten', glow: 0.9 });
      kidAt(ctx, [HX - 4, 92, HZ + 150], PI, 46, {}, 0.12);
      addTo(ctx, ctx.props.hand, HX, 20, HZ, PI, 9);
      put(ctx, 'me', L(-23.2, 0.12, -3.4), -0.45);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, tr = ctx.time('b23.w10');
      kidAt(ctx, [HX - 4, 92, HZ + 150], PI, 46, { eyes: 'side', mouth: 'smile', cheeks: 0.4, sweat: true, brows: 'worried', look: [-0.6, -0.6] }, 0.12);
      const u = ease.inOutSine(clamp((t - ctx.time('b23')) / (tr - ctx.time('b23') - 0.05), 0, 1));
      const y = lerp(16, 0, u), U = P.home.userData;
      U.roofB.position.set(0, y, 0); U.roofB.rotation.set(0, 0, 0.05 * (1 - u));
      const top = slotPt(ctx, HOME, 0, 5.8 + 3.2 + y, 0);
      P.hand.position.copy(top.clone().add(V(0, 3.2, 0.6))); P.hand.rotation.set(1.25, PI, 0.15); P.hand.scale.setScalar(4.2); P.hand.userData.set({ curl: 0.35 });
      if (u >= 1) { P.hand.position.y += 6 * clamp((t - tr) / 0.6, 0, 1); }
      me.pose('crossArms', t); me.face('squint', 0.4);
      moveCam(ctx, { pos: L(-21.8, 0.75, -7.0), look: L(-25.5, 9.5, 9), fov: 66 }, { pos: L(-22.0, 0.7, -6.4), look: L(-25.5, 8.5, 9), fov: 64 }, lt / 2.8, 0.9, '#ffe0d0');
      pop(ctx, tr, 0.1, '#ffffff', 0.25);
      if (t > tr) shakeOn(ctx, [tr], 0.3, 0.25, 4);
    },
  },
  // ── b24 "Ready for what?"
  {
    name: 'ready for what', start: 'b24-0.1', set: 'town',
    setup(ctx) { const L = homeStreet(ctx, 'quiet_night', { roof: 'redBitten', glow: 0.9 }); put(ctx, 'me', L(-24.0, 0, -1.6), PI - 0.55); },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t;
      me.pose('shrug', 0.15 + lt, {}); me.face('squint', 0.3);
      const k = ease.outCubic(clamp(lt / 0.3, 0, 1));
      setCam(ctx, faceCam(me, 2.7 - 0.3 * k, -0.35, 0.45, 36, -0.2), 1.3, '#ffe6d8');
    },
  },
  // ── b25 "Then I noticed the silver rim around town. Like a plate."  — crane up and up
  {
    name: 'plate crane', start: 'b25-0.12', set: 'town',
    setup(ctx) {
      const L = homeStreet(ctx, 'quiet_night', { roof: 'redBitten', glow: 0.9, exposure: 1.35, extraHide: [], paint: GREEN_SLOTS });
      towerDress(ctx); cakeMode(ctx, true);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tr = ctx.markers.rim;
      const k = ease.inOutCubic(clamp(lt / 2.9, 0, 1));
      const c = moveCam(ctx, { pos: L(-20, 3, 1), look: L(-27, 5, 13), fov: 56 }, { pos: L(4, 340, 210), look: L(4, -14, -12), fov: 50 }, k);
      if (k < 0.3) fill(ctx, c.pos, 0.6);
      P.plate.userData.glint(t, t > tr ? 1 : 0.2);
      tag(ctx, 'CLUE #4: THE PLATE', tr - 0.05, Infinity, { y: 0.11, size: 66, bg: 'rgba(120,130,150,0.94)' });
    },
  },
  // ── b26 "Our town isn't a town. It's his birthday cake."
  {
    name: 'its a cake', start: 'b26-0.12', set: 'town',
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'redBitten', glow: 0.9, exposure: 1.35, paint: GREEN_SLOTS });
      towerDress(ctx); cakeMode(ctx, true);
      kidAt(ctx, [4, 110, -250], 0, 150, {}, 0.45);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tc = ctx.time('b26.w8');
      const lean = ease.outCubic(clamp(lt / 1.2, 0, 1));
      kidAt(ctx, [4, lerp(30, 72, lean), lerp(-300, -240, lean)], 0, 150, { eyes: 'happy', mouth: 'grin', hat: true, cheeks: 0.5 }, 0.5);
      moveCam(ctx, { pos: L(4, 300, 230), look: L(4, 30, -90), fov: 52 }, { pos: L(4, 280, 205), look: L(4, 40, -100), fov: 50 }, lt / 2.5);
      P.plate.userData.glint(t, 0.6);
      shakeOn(ctx, [tc], 0.8, 0.5, 3);
      stamp(ctx, "IT'S A CAKE", tc - 0.02, { x: 0.3, y: 0.08, size: 100, fill: '#ff4fa3', stroke: '#ffffff', rot: -0.06 });
    },
  },
  // ── b27 "And nothing bites green? No kid eats the vegetables."
  {
    name: 'veggies aerial', start: 'b27-0.12', set: 'town',
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'redBitten', glow: 0.9, exposure: 1.35, paint: GREEN_SLOTS });
      ctx.set.set && townEdit(ctx, { hide: [HOME], paint: GREEN_SLOTS, roofPaint: GREEN_ROOFS });
      towerDress(ctx); cakeMode(ctx, true);
    },
    update(ctx, lt) {
      const L = ctx.store.L;
      moveCam(ctx, { pos: L(-8, 95, 46), look: L(-8, 0, -2), fov: 50 }, { pos: L(-6, 70, 36), look: L(-6, 0, 0), fov: 48 }, ease.inOutSine(lt / 1.6));
      tag(ctx, 'GREEN = VEGGIES', ctx.time('b27.w3') - 0.05, Infinity, { y: 0.12, size: 70, bg: 'rgba(40,150,60,0.93)' });
    },
  },
  {
    name: 'bramble waves', start: 'b27.w4-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.9, exposure: 1.35, edits: { paint: GREEN_SLOTS, roofPaint: GREEN_ROOFS } });
      put(ctx, 'bramble', L(-5.0, 0.12, 6.5), PI); put(ctx, 'gcat', L(-4.2, 0.12, 6.1), PI + 0.3);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, b = ctx.cast.bramble;
      b.pose('wave', t, { headPitch: -0.9 }); b.face('grin', 0.5);
      ctx.cast.gcat.pose('sit', t, { headPitch: -0.6 }); ctx.cast.gcat.face('smile', 0.5);
      const f = humanFace(b);
      moveCam(ctx, { pos: f.clone().add(V(-0.9, 3.6, -3.4)), look: f.clone().add(V(0, -1.6, 0.4)), fov: 42 }, { pos: f.clone().add(V(-0.8, 2.8, -2.7)), look: f.clone().add(V(0, -1.5, 0.3)), fov: 40 }, lt / 1.8, 1.4, '#e8ffe0', 14);
      stamp(ctx, 'NO KID EATS THE VEGGIES', ctx.time('b27.w8') - 0.05, { y: 0.12, size: 60, fill: '#ffffff', stroke: '#145a14', line: 10, bg: 'rgba(10,50,15,0.85)', rot: -0.04 });
    },
  },
  // ── b28 HUSS ×3 — on his roof; behind him the giant kid tries the HUSS
  ...[0, 1, 2].map((i) => ({
    name: `kid huss #${i + 1}`, start: H('b28', i), set: 'town',
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'redBitten', glow: 0.9 });
      put(ctx, 'me', slotPt(ctx, HOME, 1.2, ROOF_Y, 0), PI + 0.2);
      kidAt(ctx, [HX + 6, 26, HZ + 70], PI, 46, {}, 0.1);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, hits = hussHits(ctx, 'b28'), me = ctx.cast.me;
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9, hp = hitPulse(hits, t, 0.15);
      if (h == null) { me.pose('stunned', t); me.face('shocked', 0.3); } else { me.pose('cheer', t, { intensity: 0.6 }); me.face(dh < 0.25 ? 'huss' : 'determined', 0.3); }
      const lag = hitPulse(hits.map((x) => x + 0.08), t, 0.2);
      kidAt(ctx, [HX + 6, 26 + 2 * lag, HZ + 70], PI, 46, { eyes: lag > 0.3 ? 'shut' : 'happy', mouth: lag > 0.2 ? 'open' : 'grin', open: lag > 0.2 ? 1 : null, cheeks: 0.6, hat: true }, 0.1);
      const f = humanFace(me);
      const cams = [{ pos: f.clone().add(V(1.0, 0.3, -3.6)), look: f.clone().add(V(0, -0.6, 0)), fov: 52 }, faceCam(me, 2.3, -0.4, 0.3, 38, -0.3), { pos: f.clone().add(V(0.9, -1.3, -3.0)), look: f.clone().add(V(0.2, 0.2, 4)), fov: 64 }];
      setCam(ctx, cams[i], 1.1, '#ffe0d0', 14); ctx.cam.punch(hits, t, 0.1, 0.2); shakeOn(ctx, hits, 0.35, 0.2, 7 + i);
    },
  })),
  // ── b29 "His party's tomorrow. And that string on the clock tower? It's a candle wick."
  {
    name: 'party tomorrow', start: 'b29-0.12', set: 'town',
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'redBitten', glow: 0.9 }); towerDress(ctx);
      kidAt(ctx, [KS.x, KS.y, KS.z], PI / 2 - 0.12, KS.s, {});
      addTo(ctx, ctx.props.sparks, -60, 30, 1.5, 0, 6);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      kidAt(ctx, [KS.x, KS.y + 2 * Math.abs(Math.sin(t * 5)), KS.z], PI / 2 - 0.12, KS.s, { eyes: 'happy', mouth: 'grin', hat: true, cheeks: 0.5 });
      ctx.props.sparks.userData.set(t, 1);
      moveCam(ctx, { pos: L(-24.0, 1.5, 2.6), look: L(-51, 4.6, -4.2), fov: 58 }, { pos: L(-25.0, 1.6, 2.4), look: L(-51, 5.0, -4.0), fov: 56 }, lt / 1.4, 0.5);
      tag(ctx, 'PARTY: TOMORROW', ctx.markers.party - 0.05, Infinity, { y: 0.12, size: 76, bg: 'rgba(255,79,163,0.93)' });
    },
  },
  {
    name: 'its a wick', start: 'b29.w4-0.12', set: 'town',
    setup(ctx) { town(ctx, 'quiet_night', { glow: 0.6 }); towerDress(ctx, { clock: true, h: 3 }); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tw = ctx.markers.wick;
      const k = ease.inOutSine(clamp(lt / 2.6, 0, 1));
      const c = moveCam(ctx, { pos: L(-41, 4.0, 4.5), look: L(-51, 10.5, 1.5), fov: 48 }, { pos: L(-45.5, 13.5, 5.5), look: L(-50.9, 16.2, 1.5), fov: 42 }, k);
      fill(ctx, c.pos, 0.9, '#ffe6c0', 20);
      { const g = ctx.props.moonGlow; ctx.add(g); const w = L(TOWER.x, TOWER.top + 2, TOWER.z); g.position.copy(w).addScaledVector(w.clone().sub(c.pos).normalize(), 40); }
      ctx.props.wick.userData.set(t, t > tw ? 0.6 : 0);
      if (t > tw) { ringAt(ctx, L(TOWER.x + 0.3, TOWER.top + 2.9, TOWER.z), tw, 0.6); }
      tag(ctx, 'CANDLE WICK', tw - 0.05, Infinity, { y: 0.12, size: 80, bg: 'rgba(255,140,40,0.93)' });
    },
  },
  // ── b30 "And somebody just struck a match."  — the flame descends toward the wick, held to the last frame
  {
    name: 'match', start: 'b30-0.12', set: 'town', captions: true,
    setup(ctx) {
      homeStreet(ctx, 'quiet_night', { roof: 'redBitten', glow: 0.9 }); towerDress(ctx);
      const P = ctx.props; addTo(ctx, P.match, -60, 40, 1.5, 0, 18); addTo(ctx, P.hand, -60, 60, 1.5, 0, 4);
      ctx.add(P.warm);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, ts = ctx.markers.match, S = 11;
      const lit = clamp((t - ts) / 0.08, 0, 1), flare = Math.max(0, 1 - (t - ts) / 0.6) * lit;
      // poised (gentle hover) → quick swipe-strike to the left at ts → slow descent toward the wick (held to the end)
      const strike = ease.inOutCubic(clamp((t - ts + 0.16) / 0.16, 0, 1)), low = ease.inOutSine(clamp((t - ts - 0.2) / 1.4, 0, 1));
      const hover = 0.3 * Math.sin(t * 2.4);
      const hp = strike < 1 ? V(-46.5, lerp(25.0, 24.0, strike) + hover * (1 - strike), lerp(-4.0, -1.0, strike)) : V(lerp(-46.5, -48.6, low), lerp(24.0, 21.8, low), lerp(-1.0, 0.8, low));
      const head = L(hp.x, hp.y, hp.z), dir = V(-0.15, -0.8, 0.58).normalize();
      P.match.quaternion.setFromUnitVectors(V(0, 1, 0), dir); P.match.scale.setScalar(S);
      P.match.position.copy(head).addScaledVector(dir, -1.06 * S);
      P.match.userData.set(t, { lit, flare }); P.match.userData.flame.quaternion.copy(P.match.quaternion).invert();
      P.hand.position.copy(P.match.position).addScaledVector(dir, -0.3).add(V(0.4, 0.6, -0.6)); P.hand.rotation.set(0.3, -PI / 2, -0.35); P.hand.scale.setScalar(4); P.hand.userData.set({ curl: 1 });
      P.warm.position.copy(head.clone().add(V(0, 6, 4))); P.warm.intensity = 2500 * lit * (1 + 1.5 * flare);
      if (lit > 0) skyMood(ctx, 'orange', 0.75 * lit, { lights: true });
      setCam(ctx, { pos: L(-12, 8.5, 2.5), look: L(-49, 20.6, 0.0), fov: 40 }, 0.5);
      pop(ctx, ts, 0.1, '#ffd08a', 0.35);
      shakeOn(ctx, [ts], 0.5, 0.4, 3);
    },
  },
];

/** paint the roof of our house red from one end (u 0..1); pink elsewhere */
function paintRoof(ctx, u) {
  const U = ctx.props.home.userData, R = U.roof, im = R.userData.im, its = R.userData.items, c = new THREE.Color();
  for (let n = 0; n < its.length; n++) {
    const it = its[n]; if (it.c === '#b5543f' || it.c === '#5d4a42') { im.setColorAt(n, c.set(it.c)); continue; }
    const f = (it.x + 5) / 10;
    im.setColorAt(n, c.set(f > 1 - u ? (n % 3 ? '#e8232b' : '#c41a22') : it.c));
  }
  im.instanceColor.needsUpdate = true;
  U.roofMat.emissive.set('#e8232b').multiplyScalar(0.25 * u);
}
