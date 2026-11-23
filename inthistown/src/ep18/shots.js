// In This Town — Episode 18: "Pirate Token to the Moon".  Everyone is obsessed with the pirate token, a gold skull coin
// that floats higher the more people want it.  The mayor says it's going to the moon, the whole town wants it at once and
// floats into space.  The narrator crashes the hype: "Principal Dunmore just bought pirate token."
// Film contract: SPEC.md §8.  Timeline: episodes/ep18/timeline.json.
//
// Sets: 'town' (buildTown, day/dusk/quiet night; the crashed ship sits behind the stage), 'room' (the narrator's bedroom),
//       'sky' (custom: a mini town that tears out of the ground / floats on an island among purple clouds / night moon).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { frameAt, lastBefore } from '../shots.js';
import { makeMicStand } from '../ep2/props2.js';
import { makeSwarm, makeHeroToken, makeShip, makeTV, makeChest, makeBigSandwich, makeChalkCar, makeFloatHouse, makeCar,
  makeGarden, makeBench, makeBin, makeNewspaper, makeHandbag, makeBackpack, makePuff, makeSparkles, makeCloud, glowSprite,
  buildSkySet } from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const KID_IDS = ['k1', 'k2', 'k3', 'k4'];
const CROWD = EXTRA_IDS.slice(0, 16);
export const cast = {
  me: MAIN.me, mayor: MAIN.mayor,
  higgins: { id: 'higgins', skin: '#f4d0b5', hair: { style: 'curly', color: '#c9c9d0' }, top: { style: 'cardigan', color: '#8a5cff', accent: '#ffd23f' },
    bottom: { style: 'skirt', color: '#4a3a6a' }, shoes: '#7a1f2b', accessories: ['glasses'], scale: 0.95 },
  darnell: { id: 'darnell', skin: '#6b4226', hair: { style: 'short', color: '#111111' }, top: { style: 'tee', color: '#1d1d22', accent: '#ffd23f', emblem: 'star' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#f2f2f2', accessories: ['sunglasses', 'cap', 'chain'], capColor: '#e8232b', scale: 1.0 },
  goon1: { id: 'goon1', skin: '#c68642', hair: { style: 'fade', color: '#1a120c' }, top: { style: 'tee', color: '#e8232b', accent: '#ffffff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#1d1d22' }, shoes: '#f2f2f2', accessories: ['sunglasses', 'chain'], scale: 0.97 },
  goon2: { id: 'goon2', skin: '#e0ac69', hair: { style: 'spiky', color: '#3b2416' }, top: { style: 'tee', color: '#e8232b', accent: '#ffffff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#1d1d22' }, shoes: '#f2f2f2', accessories: ['sunglasses', 'chain'], scale: 0.94 },
  dunmore: { id: 'dunmore', skin: '#f0c8a8', hair: { style: 'bald', color: '#f0c8a8' }, top: { style: 'suit', color: '#7a5a3a', accent: '#c0392b' },
    bottom: { style: 'pants', color: '#5a4030' }, shoes: '#2a1a10', accessories: ['glasses', 'bowtie'], build: 1.12, scale: 1.0 },
  okafor: { id: 'okafor', skin: '#8d5524', hair: { style: 'short', color: '#1a120c' }, top: { style: 'cardigan', color: '#3c8f45', accent: '#e8f0d0' },
    bottom: { style: 'pants', color: '#55575e' }, shoes: '#4a3b2f', accessories: ['beard'], scale: 1.0 },
  ...Object.fromEntries(KID_IDS.map((id, i) => [id, { id, skin: ['#f1c7a1', '#8d5524', '#e0ac69', '#ffdbac'][i],
    hair: { style: ['curly', 'bun', 'spiky', 'afro'][i], color: ['#1a120c', '#c0392b', '#e8c46a', '#111111'][i] },
    top: { style: 'tee', color: ['#4fb3ff', '#ff4fa3', '#5bd65b', '#ffd23f'][i], accent: '#ffffff', emblem: ['star', 'heart', 'number', 'stripe'][i] }, number: 7,
    bottom: { style: i === 1 ? 'skirt' : 'shorts', color: ['#2f4d8a', '#8a5cff', '#3a3d46', '#2f4d8a'][i] }, shoes: '#f2f2f2', scale: 0.68 + 0.04 * (i % 2) }])),
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 18, banner: ['PIRATE', 'TOKEN', 'DAY'] }),
  room: () => buildRoom({ variant: 'hero', window: 'day', poster: 'knight' }),
  sky: () => buildSkySet(),
};

export function init(ctx) {
  const P = ctx.props;
  P.swA = makeSwarm(90, { glow: 1.0 });
  P.swB = makeSwarm(60, { glow: 1.0 });
  P.swBig = makeSwarm(520, { glow: 0.55, strings: false });
  P.hero = makeHeroToken();
  P.giant = makeHeroToken();
  P.ship = makeShip();
  P.tv = makeTV();
  P.chest = makeChest();
  P.sandwich = makeBigSandwich();
  P.chalk = makeChalkCar();
  P.paper = makeNewspaper(); P.bag = makeHandbag(); P.pack = makeBackpack();
  P.mic = makeMicStand({ height: 1.45, tilt: 0.5 });
  P.micHand = makeHandMic();
  P.cars = [makeCar('#4fb3ff'), makeCar('#ffd23f'), makeCar('#5bd65b')];
  P.garden = makeGarden(); P.bench = makeBench(); P.bin = makeBin();
  P.puffs = [0, 1, 2, 3].map((i) => makePuff({ count: 22, radius: 1, seed: 3 + i * 7 }));
  P.sparkles = makeSparkles({ n: 50, w: 6, h: 5, d: 4 });
  P.sparkBig = makeSparkles({ n: 60, w: 18, h: 12, d: 10, size: 0.18 });
  P.dust = makeSparkles({ n: 40, w: 8, h: 3, d: 5, color: '#d9cbb0', size: 0.05 });
  P.skyHouses = [0, 1, 2, 3].map((i) => makeFloatHouse({ wall: ['#e9d8b5', '#c9e4f2', '#f2c4c4', '#d6e8c4'][i], roof: ['#b5543f', '#4a5d7e', '#6b4a3a', '#3f7a5a'][i] }));
  P.tClouds = Array.from({ length: 9 }, (_, i) => makeCloud(40 + i, 2.2 + 1.6 * hash(i * 3.3), { emissive: '#f0d8ff', ei: 0.35 }));
  P.fill = new THREE.PointLight('#c8d8ff', 5, 9, 1.4);
  P.goldLight = new THREE.PointLight('#ffc040', 0, 9, 1.3);
  P.flare = glowSprite('#ffd060', 6, 0.9);
}

// a handheld mic built along −Y of the hand joint (= out of the fist, away from the wrist)
function makeHandMic() {
  const g = new THREE.Group(); g.name = 'handMic';
  const blk = new THREE.MeshStandardMaterial({ color: '#16171b', roughness: 0.35, metalness: 0.3 });
  const grey = new THREE.MeshStandardMaterial({ color: '#b8bcc6', roughness: 0.35, metalness: 0.7, emissive: '#30343c', emissiveIntensity: 0.4 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.022, 0.26, 14), blk); handle.position.y = -0.06; g.add(handle);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.036, 0.03, 16), grey); ring.position.y = -0.2; g.add(ring);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.062, 18, 12), grey); ball.position.y = -0.255; g.add(ball);
  return g;
}
// ────────────────────────────────────────────────────────────────────────────────────── helpers
const CURB = 0.12;
const SHIP_POS = [60, 1.2, 8.5];         // town-local; beside the stage's south edge, bow wedged into its front corner
const SHIP_ROT = { roll: 0.1, pitch: 0.18 };
const SHIP_YAW = PI - 0.25;
function T(ctx) { ctx.set.root.updateMatrixWorld(true); const r = ctx.set.root; const f = (x, y, z) => r.localToWorld(V(x, y, z)); f.yaw = yawOf(r); return f; }
function put(ctx, id, p, yaw) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); return ctx.cast[id]; }
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 70, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.8)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale || 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.26, size: 130, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.1, alpha: clamp(d / 0.06, 0, 1), ...o, scale: s * (o.scale || 1) });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
const gold = (o = {}) => ({ fill: '#ffd23f', stroke: '#3a1e00', bg: 'rgba(40,20,0,0.82)', ...o });
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function handPos(ch, s = 'R') { ch.root.updateMatrixWorld(true); return ch.joints['hand' + s].getWorldPosition(V()); }
function footPos(ch, s = 'R') { ch.root.updateMatrixWorld(true); return ch.joints['foot' + s].getWorldPosition(V()); }
const iris = (ctx, t0, cy = 0.45, dur = 0.45) => { const k = clamp((ctx.t - t0) / dur, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, PI * 2, true); g.fill('evenodd'); g.restore(); }); };
function fill(ctx, pos, k = 1, color = '#c8d8ff') { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0, color) { const c = camLerp(a, b, clamp(u, 0, 1)); ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k, color); return c; }
function flash(ctx, t0, dur = 0.25, color = '#ffffff', a = 0.9) { const d = ctx.t - t0; if (d >= 0 && d < dur) ctx.fx.overlay(color, a * (1 - d / dur)); }
const _pc = new THREE.PerspectiveCamera();
function screenOf(cam, p) { _pc.fov = cam.fov; _pc.aspect = 1080 / 1920; _pc.near = 0.05; _pc.far = 2000; _pc.position.copy(cam.pos); _pc.lookAt(cam.look); _pc.updateProjectionMatrix(); _pc.updateMatrixWorld(true); const v = p.clone().project(_pc); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 }; }
/** token on a string held in a hand: returns { from, pos } */
function balloon(ch, t, k, { len = 1.35, sway = 0.22, hand = 'R', lift = 0, tight = 0 } = {}) {
  ch.root.updateMatrixWorld(true);
  const from = ch.joints['hand' + hand].getWorldPosition(V());
  const head = ch.joints.head.getWorldPosition(V());
  const sw = sway * (1 - 0.8 * tight);
  return { from, pos: V(from.x + sw * Math.sin(t * 1.3 + k * 1.7), Math.max(head.y + 0.75, from.y + len) + lift + 0.1 * Math.sin(t * 1.9 + k) * (1 - tight), from.z + sw * Math.cos(t * 1.1 + k * 2.3)) };
}
/** hanging from a token: right arm straight up, legs dangling */
function hang(ch, t, k = 0, { face = 'neutral', armUp = 'R' } = {}) {
  ch.pose('idle', t + k, { intensity: 0.3 });
  const J = ch.joints, s = armUp;
  J['arm' + s].rotation.x = -3.0; J['arm' + s].rotation.z = s === 'R' ? 0.12 : -0.12;
  if (J['foreArm' + s]) J['foreArm' + s].rotation.x = -0.1;
  J.legL.rotation.x = 0.18 * Math.sin(t * 2.1 + k); J.legR.rotation.x = -0.18 * Math.sin(t * 2.1 + k + 0.6);
  if (J.shinL) { J.shinL.rotation.x = 0.25 + 0.15 * Math.sin(t * 2.1 + k); J.shinR.rotation.x = 0.25 - 0.15 * Math.sin(t * 2.1 + k); }
  ch.face(face, t + k);
}
function bounceY(y0, vy, floor, s, damp = 0.42) {
  let y = y0, v = vy, tt = s; const g = 9.8;
  for (let b = 0; b < 4; b++) {
    const disc = v * v + 2 * g * (y - floor); const tHit = (v + Math.sqrt(Math.max(0, disc))) / g;
    if (tt < tHit) return y + v * tt - 0.5 * g * tt * tt;
    tt -= tHit; v = Math.sqrt(Math.max(0, disc)) * damp; y = floor;
  }
  return floor;
}
function puffAt(ctx, i, p, r = 1, color) { const pf = ctx.props.puffs[i]; ctx.add(pf.root); pf.root.position.copy(p); pf.root.scale.setScalar(r); if (color) pf.root.children[0].material.color.set(color); return pf; }

// ─── town lighting
function dayTown(ctx, { party = false } = {}) {
  const s = ctx.set; s.setLighting?.('day'); s.set?.('partyProps', party); s.set?.('fireworks', false); s.set?.('foam', 0); s.set?.('windowGlow', 0); s.set?.('standsCrowd', false);
  s.exposure = 1.0; skyBase(ctx);
}
function duskTown(ctx) { const s = ctx.set; s.setLighting?.('dusk'); s.set?.('partyProps', false); s.set?.('fireworks', false); s.set?.('foam', 0); s.set?.('windowGlow', 0.6); s.set?.('standsCrowd', 'auto'); s.exposure = 1.0; skyBase(ctx); }
function nightTown(ctx) { const s = ctx.set; s.setLighting?.('quiet_night'); s.set?.('partyProps', false); s.set?.('fireworks', false); s.set?.('foam', 0); s.set?.('windowGlow', 0.7); s.set?.('standsCrowd', false); s.exposure = 1.15; skyBase(ctx); }
const PURPLE = { zenith: new THREE.Color('#1c0b4a'), mid: new THREE.Color('#6a2fb8'), horizon: new THREE.Color('#ff8ac8'), fog: new THREE.Color('#9a5ac8') };
function skyBase(ctx) {
  const sky = ctx.set.root.getObjectByName('sky'); if (!sky) return;
  const u = sky.material.uniforms;
  ctx.store.sky = { u, z: u.uZenith.value.clone(), m: u.uMid.value.clone(), h: u.uHorizon.value.clone(), sun: u.uSunColor.value.clone(), bg: ctx.set.background?.clone?.(), fog: ctx.set.fog?.color?.clone() };
}
/** tint the town sky toward purple (k 0..1); call every frame (after skyBase in setup) */
function townPurple(ctx, k) {
  const s = ctx.store.sky; if (!s) return;
  s.u.uZenith.value.copy(s.z).lerp(PURPLE.zenith, k); s.u.uMid.value.copy(s.m).lerp(PURPLE.mid, k); s.u.uHorizon.value.copy(s.h).lerp(PURPLE.horizon, k);
  s.u.uSunColor.value.copy(s.sun).multiplyScalar(1 - k);
  if (s.bg && ctx.set.background) ctx.set.background.copy(s.bg).lerp(PURPLE.fog, k);
  if (s.fog && ctx.set.fog) ctx.set.fog.color.copy(s.fog).lerp(PURPLE.fog, k);
}
/** floating houses + clouds in the town sky (purple shots) */
function skyDressing(ctx, L, spots, cloudSpots = []) {
  const P = ctx.props;
  spots.forEach(([x, y, z, ry], i) => { const h = P.skyHouses[i]; ctx.add(h); h.position.copy(L(x, y, z)); h.rotation.set(0.15 * Math.sin(i * 2), ry, 0.1 * Math.cos(i * 3)); h.userData.base = h.position.clone(); });
  cloudSpots.forEach(([x, y, z, s], i) => { const c = P.tClouds[i]; ctx.add(c); c.position.copy(L(x, y, z)); c.scale.setScalar(s); c.userData.base = c.position.clone(); });
  ctx.store.dress = { n: spots.length, nc: cloudSpots.length };
}
function skyDressingTick(ctx) {
  const P = ctx.props, d = ctx.store.dress; if (!d) return;
  for (let i = 0; i < d.n; i++) { const h = P.skyHouses[i]; h.position.copy(h.userData.base).add(up(0.4 * Math.sin(ctx.t * 0.7 + i))); }
  for (let i = 0; i < d.nc; i++) { const c = P.tClouds[i]; c.position.copy(c.userData.base).add(V(0.6 * Math.sin(ctx.t * 0.2 + i), 0, 0)); }
}
/** the crashed ship behind the stage */
function placeShip(ctx, L) {
  const s = ctx.props.ship; ctx.add(s);
  s.position.copy(L(...SHIP_POS)); s.rotation.order = 'YXZ'; s.rotation.set(SHIP_ROT.roll, L.yaw + SHIP_YAW, SHIP_ROT.pitch);
  return s;
}
/** square frame + ship + what covers the chess table ('chest' | 'tv' | null) */
function square(ctx, { cover = 'chest', light = 'day', party = false } = {}) {
  if (light === 'day') dayTown(ctx, { party }); else duskTown(ctx);
  const L = T(ctx), S = frameAt(ctx, 'square.stage'), P = ctx.props;
  placeShip(ctx, L);
  if (cover === 'chest') { ctx.add(P.chest); P.chest.position.copy(S(0, 0, 0.75)); P.chest.rotation.set(0, S.yaw, 0); }
  if (cover === 'tv') { ctx.add(P.tv); P.tv.position.copy(S(0, 0, 0.75)); P.tv.rotation.set(0, S.yaw, 0); }
  return { L, S };
}
/** plaza crowd facing the stage.  rows of up to 6 starting at S z = z0 */
function plazaCrowd(ctx, S, ids, { z0 = 5.4, dx = 1.25, dz = 1.3, cols = 6, seed = 1, skip = null, floatH = 0 } = {}) {
  const list = [];
  ids.forEach((id, k) => {
    const col = k % cols, row = Math.floor(k / cols);
    const x = (col - (cols - 1) / 2) * dx + (row % 2 ? dx / 2 : 0) + (hash(k * 3.1 + seed) - 0.5) * 0.35;
    const z = z0 + row * dz + (hash(k * 5.7 + seed) - 0.5) * 0.3;
    if (skip && skip(x, z)) return;
    const ch = put(ctx, id, S(x, -0.8 + floatH * (0.6 + 0.6 * hash(k * 2.2)), z), S.yaw + PI + (hash(k * 7.3 + seed) - 0.5) * 0.5);
    list.push({ ch, k, x, z, ph: hash(k * 1.9 + seed) * 3 });
  });
  return list;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, our money floats."  — sunny main street, a token over every head, the giant token over the tower
  {
    name: 'money floats', start: 0, set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx), P = ctx.props;
      const walkers = [];
      // [z, dir, x0]: a near group on the south road edge / pavement right in front of the lens, the rest further down
      const lanes = [[4.6, -1, 1.2], [3.7, 1, -4.0], [6.6, -1, -1.5], [3.9, 1, -10.5], [6.7, 1, -7.5], [4.5, -1, -13.0],
        [-4.0, 1, -17.0], [6.6, -1, -19.0], [-4.4, -1, -24.0], [4.3, 1, -27.0], [-6.6, 1, -30.0], [6.8, -1, -33.0]];
      CROWD.slice(0, 12).forEach((id, k) => {
        const [z, dir, x0] = lanes[k];
        walkers.push({ id, z, dir, x0, sp: 0.75 + 0.25 * hash(k), k });
        put(ctx, id, L(0, z > 5.15 || z < -5.15 ? CURB : 0, z), 0);
      });
      const houses = (ctx.set.anchors.houses || []).slice(0, 14);
      ctx.add(P.swA.root); ctx.add(P.swB.root);
      const G = P.giant; ctx.add(G); G.scale.setScalar(8); G.position.copy(L(-51, 23.5, 1.5));
      ctx.add(P.sparkBig); P.sparkBig.position.copy(L(-51, 23, 1.5));
      P.cars.slice(0, 2).forEach((c, i) => { ctx.add(c); c.position.copy(L(-18 - 8 * i, 0, i ? -3.0 : 1.9)); c.rotation.set(0, L.yaw + (i ? PI : 0), 0); });
      ctx.store.L = L; ctx.store.walkers = walkers; ctx.store.houses = houses;
    },
    update(ctx, lt, u) {
      const { L, walkers, houses } = ctx.store, P = ctx.props, t = ctx.t;
      const cam = moveCam(ctx, { pos: L(10, 1.7, 4.4), look: L(-40, 7.5, 1.3), fov: 50 }, { pos: L(6, 2.3, 4.1), look: L(-40, 9.5, 1.3), fov: 48 }, ease.inOutSine(clamp(lt / 2.2, 0, 1)));
      P.swA.begin(cam.pos);
      walkers.forEach((w) => {
        const ch = ctx.cast[w.id]; const x = w.x0 + w.dir * t * w.sp * 0.9;
        ch.root.position.copy(L(x, Math.abs(w.z) > 5.15 ? CURB : 0, w.z)); ch.root.rotation.y = L.yaw + (w.dir > 0 ? PI / 2 : -PI / 2);
        ch.pose('walk', t + w.k, { speed: w.sp }); ch.face('smile', t + w.k);
        const b = balloon(ch, t, w.k); P.swA.add(b.pos, { from: b.from, spin: 0.4 * Math.sin(t + w.k) });
      });
      P.swA.end().setDim(0);
      P.swB.begin(cam.pos);
      houses.forEach((h, i) => {
        const door = h.door; door.updateMatrixWorld(true);
        const base = door.localToWorld(V(0, 2.3, 0.15));
        for (let k = 0; k < 3; k++) { const p = door.localToWorld(V((k - 1) * 0.9 + 0.2 * Math.sin(t + i + k), 4.2 + 0.6 * k + 0.2 * Math.sin(t * 1.4 + k + i), 0.6)); P.swB.add(p, { from: base, s: 1.3 }); }
      });
      P.cars.slice(0, 2).forEach((c, i) => { c.updateMatrixWorld(true); const f = c.localToWorld(V(0, 1.55, 0)); for (let k = 0; k < 3; k++) P.swB.add(c.localToWorld(V((k - 1) * 0.6, 3.4 + 0.3 * Math.sin(t * 1.5 + k), 0.3 * Math.sin(t + k))), { from: f, s: 1.2 }); });
      P.swB.end().setDim(0);
      P.giant.rotation.set(0, L.yaw + PI / 2 + 0.6 * Math.sin(t * 0.8), 0); P.giant.userData.set(t, { glowA: 1 });
      P.sparkBig.userData.set(t, 1);
      tag(ctx, 'PIRATE TOKEN', ctx.time('b01.w4'), Infinity, gold({ y: 0.16, size: 84 }));
    },
  },
  // ── b02 "The pirate token. A gold skull coin."  — close on one coin
  {
    name: 'token close', start: 'b02-0.15', set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx), P = ctx.props;
      ctx.add(P.hero); ctx.add(P.sparkles); ctx.add(P.swA.root);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, P = ctx.props, t = ctx.t;
      const tp = L(-2, 3.4 + 0.06 * Math.sin(t * 2), 6.0);
      const c = moveCam(ctx, { pos: L(-0.9, 2.5, 8.7), look: tp, fov: 34 }, { pos: L(-1.5, 2.7, 8.5), look: tp, fov: 31 }, ease.inOutSine(clamp(lt / 2.6, 0, 1)));
      P.hero.position.copy(tp); P.hero.scale.setScalar(1.0);
      P.hero.rotation.set(0, Math.atan2(c.pos.x - tp.x, c.pos.z - tp.z) + 0.35 * Math.sin(t * 1.1), 0.05 * Math.sin(t * 1.7));
      P.hero.userData.set(t, { glowA: 1, flare: ctx.t > ctx.time('b02.w4') && ctx.t < ctx.time('b02.w4') + 0.3 ? 0.6 : 0 });
      P.sparkles.position.copy(tp); P.sparkles.userData.set(t, 1);
      // the string down out of frame
      P.swA.begin(c.pos); P.swA.end();
      if (!ctx.store.str) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 3, 5), new THREE.MeshBasicMaterial({ color: '#f6f2ea' })); ctx.store.str = s; ctx.add(s); }
      ctx.store.str.position.copy(tp).add(up(-1.8)); ctx.store.str.rotation.set(0, 0, 0.02 * Math.sin(t));
      tag(ctx, 'PIRATE TOKEN', ctx.time('b02.w1'), Infinity, gold({ y: 0.15, size: 84 }));
      tag(ctx, 'GOLD SKULL COIN', ctx.time('b02.w4'), Infinity, { y: 0.24, size: 58 });
    },
  },
  // ── b02 "The more it is wanted, the higher it goes."  — two kids stare, the coin rises
  {
    name: 'kids stare', start: 'b02.w7-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx), P = ctx.props;
      put(ctx, 'k1', L(-2.9, CURB, 6.7), L.yaw + PI - 0.35); put(ctx, 'k2', L(-1.7, CURB, 6.8), L.yaw + PI + 0.25);
      put(ctx, 'k3', L(-4.6, CURB, 7.4), L.yaw + PI - 0.7);
      ctx.add(P.hero); ctx.add(P.sparkles); ctx.add(P.swA.root);
      const brick = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: '#b5543f' })); brick.position.copy(L(-2.4, CURB + 0.06, 5.7)); ctx.add(brick);
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 5), new THREE.MeshBasicMaterial({ color: '#f6f2ea' })); s.geometry.translate(0, 0.5, 0); ctx.add(s);
      ctx.store = { ...ctx.store, L, brick, s };
    },
    update(ctx, lt) {
      const { L, s } = ctx.store, P = ctx.props, t = ctx.t;
      const th = ctx.time('b02.w13') - 0.1;
      const rise = ease.inOutCubic(clamp((t - th) / 0.9, 0, 1));
      const tp = L(-2.4 + 0.1 * Math.sin(t * 1.3), 2.9 + 3.2 * rise + 0.06 * Math.sin(t * 2), 5.7);
      const c = moveCam(ctx, { pos: L(0.9, 0.55, 3.6), look: L(-2.4, 1.9, 6.2), fov: 50 }, { pos: L(0.9, 0.5, 3.6), look: L(-2.4, 3.4, 6.0), fov: 54 }, ease.inOutSine(clamp((t - th + 0.2) / 1.1, 0, 1)));
      P.hero.position.copy(tp); P.hero.scale.setScalar(1.15); P.hero.rotation.set(0, Math.atan2(c.pos.x - tp.x, c.pos.z - tp.z) + 0.3 * Math.sin(t), 0);
      P.hero.userData.set(t, { glowA: 1, flare: 0.3 * rise });
      P.sparkles.position.copy(tp); P.sparkles.userData.set(t, 1);
      const from = L(-2.4, CURB + 0.1, 5.7); const d = tp.clone().sub(from); s.position.copy(from); s.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); s.scale.set(1, d.length() - 0.3, 1);
      ['k1', 'k2', 'k3'].forEach((id, k) => { const ch = ctx.cast[id]; ch.pose('idle', t + k, { lookAt: tp, intensity: 0.5 }); ch.face(k === 1 ? 'shocked' : 'grin', t + k * 1.3); if (k === 0) { ch.joints.armR.rotation.x = -1.6 - 0.8 * rise; } });
      P.swA.begin(c.pos); P.swA.end();
      tag(ctx, 'MORE WANTED = HIGHER', ctx.time('b02.w9'), Infinity, gold({ y: 0.16, size: 62 }));
    },
  },
  // ── b03 "Five years ago, a pirate ship crashed into the town square, full of them."  — dusk flashback
  {
    name: 'ship crash', start: 'b03-0.1', set: 'town',
    setup(ctx) {
      const { L, S } = square(ctx, { cover: 'chest', light: 'dusk' });
      ctx.props.chest.visible = true;
      const ids = CROWD.slice(0, 6);
      const crowd = ids.map((id, k) => put(ctx, id, S(-4 + k * 1.6, -0.8, 9 + (k % 2) * 1.4), S.yaw + PI + (k - 2.5) * 0.15));
      ctx.store = { ...ctx.store, L, S, crowd };
    },
    update(ctx, lt) {
      const { L, S, crowd } = ctx.store, P = ctx.props, t = ctx.t, ship = P.ship;
      const t0 = ctx.time('b03') + 0.05, t1 = ctx.time('b03.w6');   // lands on "crashed"
      const u = clamp((t - t0) / (t1 - t0), 0, 1), uu = Math.pow(u, 1.35);
      const P0 = L(98, 24, 18), P1 = L(76, 6, 12), P2 = L(...SHIP_POS);
      const p = P0.clone().multiplyScalar((1 - uu) * (1 - uu)).add(P1.clone().multiplyScalar(2 * uu * (1 - uu))).add(P2.clone().multiplyScalar(uu * uu));
      const dt = t - t1;
      const wob = dt > 0 ? 0.08 * Math.exp(-dt * 4) * Math.sin(dt * 18) : 0;
      ship.position.copy(p); ship.rotation.set(SHIP_ROT.roll * u + wob, L.yaw + SHIP_YAW, lerp(-0.3, SHIP_ROT.pitch, ease.inOutSine(u)) + wob * 0.5);
      if (dt > 0 && dt < 1.4) ctx.cam.shake(1.0 * Math.exp(-dt * 2.2), t, 7);
      const pf = puffAt(ctx, 0, L(51.5, 0.4, 7.0), 2.4); pf.update(clamp(dt / 1.4, 0, 1));
      const pf2 = puffAt(ctx, 1, L(58, 0.3, 11.0), 2.0); pf2.update(clamp((dt - 0.05) / 1.3, 0, 1));
      crowd.forEach((ch, k) => { if (dt < -0.6) { ch.pose('idle', t + k); ch.face('neutral', t); } else { ch.pose('surprised', t + k * 0.1); ch.face('shocked', 1); } });
      ctx.cam.set({ pos: L(44, 5.8, 21), look: p.clone().lerp(L(56, 2.6, 7.5), ease.inOutSine(clamp((u - 0.7) / 0.3, 0, 1))), fov: 62 });
      ctx.fx.overlay('#ffb070', 0.12); ctx.fx.vignette(0.55);
      tag(ctx, '5 YEARS AGO', ctx.time('b03') - 0.05, Infinity, { y: 0.14, size: 66, fill: '#fff4d8', bg: 'rgba(60,30,10,0.85)', rot: 0 });
    },
  },
  {
    name: 'tokens pour', start: 'b03.w11-0.15', set: 'town',
    setup(ctx) {
      const { L, S } = square(ctx, { cover: 'chest', light: 'dusk' });
      ctx.add(ctx.props.swA.root);
      ctx.props.ship.updateMatrixWorld(true);
      const hole = ctx.props.ship.userData.hole.getWorldPosition(V());
      ctx.store = { ...ctx.store, L, S, hole };
    },
    update(ctx, lt) {
      const { L, hole } = ctx.store, P = ctx.props, t = ctx.t, t0 = ctx.time('b03.w11') - 0.25;
      const cam = { pos: hole.clone().add(V(-2.4, 0.2, 6.2)), look: hole.clone().add(V(-0.3, -0.6, 1.4)), fov: 52 };
      ctx.cam.set(cam);
      P.swA.begin(cam.pos);
      for (let k = 0; k < 80; k++) {
        const te = t0 + k * 0.022, s = t - te; if (s < 0) continue;
        const a = (hash(k * 3.7) - 0.5) * 1.6, sp = 1.6 + 2.2 * hash(k * 5.1);
        const vx = -0.25 * sp + Math.sin(a) * sp * 0.7, vz = 0.97 * sp * (0.6 + 0.4 * Math.cos(a)) + 0.4, vy = 0.6 + 2 * hash(k * 9.3);
        const drag = (1 - Math.exp(-s * 1.6)) / 1.6;
        const x = hole.x + vx * drag, z = hole.z + 0.3 + vz * drag;
        const floor = L(0, 0, 0).y;
        const y = bounceY(hole.y - 0.3, vy, floor + 0.3, s);
        P.swA.add(V(x, y, z), { yaw: k + s * (3 + 4 * hash(k)), tilt: s * 5 * hash(k * 2.2), s: 1.0 });
      }
      P.swA.end().setDim(0, 0.2);
      ctx.fx.overlay('#ffb070', 0.12); ctx.fx.vignette(0.5);
      ctx.cam.shake(0.12, t, 3);
    },
  },
  // ── b04 "Each one winks, says arr, and floats."  — extreme close-up
  {
    name: 'wink arr', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      const { L, S } = square(ctx, { cover: 'chest', light: 'dusk' });
      const P = ctx.props; ctx.add(P.hero); ctx.add(P.swA.root); ctx.add(P.sparkles);
      ctx.store = { ...ctx.store, L, S };
    },
    update(ctx, lt) {
      const { L } = ctx.store, P = ctx.props, t = ctx.t;
      const tw = ctx.time('b04.w2'), ta = ctx.time('b04.w4'), tf = ctx.time('b04.w6') - 0.05;
      const fl = clamp(t - tf, 0, 9);
      const base = L(44.6, 0.3, 1.6);
      const tp = base.clone().add(up(1.6 * fl * fl + 0.5 * fl));
      const cam = { pos: L(42.2, 0.55, 2.4), look: base.clone().add(up(0.1)), fov: 36 };
      ctx.cam.set(cam);
      P.hero.position.copy(tp); P.hero.scale.setScalar(1);
      P.hero.rotation.set(0, Math.atan2(cam.pos.x - tp.x, cam.pos.z - tp.z) + (fl > 0 ? 0.6 * Math.sin(fl * 4) : 0), fl > 0 ? 0 : -0.12);
      const dw = t - tw, wink = dw < 0 ? 0 : dw < 0.12 ? dw / 0.12 : dw < 0.45 ? 1 : dw < 0.6 ? 1 - (dw - 0.45) / 0.15 : 0;
      P.hero.userData.set(t, { wink, glowA: 1, flare: fl > 0 ? 0.4 : 0 });
      P.sparkles.position.copy(tp); P.sparkles.userData.set(t, fl > 0 ? 1 : 0.4);
      P.swA.begin(cam.pos);
      for (let k = 0; k < 16; k++) { const a = hash(k * 4.1) * PI * 2, r = 0.5 + 2.2 * hash(k * 2.7); P.swA.add(L(44.6 + Math.cos(a) * r + 0.6, 0.05, 1.6 + Math.sin(a) * r), { yaw: hash(k) * 6, tilt: PI / 2, s: 1 }); }
      P.swA.end().setDim(0);
      if (t > ta) { const sp = screenOf(cam, tp); const d = t - ta; const pop = d < 0.18 ? ease.outBack(clamp(d / 0.18, 0, 1)) : 1;
        ctx.fx.text('ARR!', { x: clamp(sp.x + 0.22, 0.2, 0.8), y: clamp(sp.y - 0.12, 0.08, 0.32), size: 130, fill: '#ffd23f', stroke: '#2a1200', line: 14, bg: 'rgba(255,255,255,0.0)', rot: 0.12, scale: Math.max(0.01, pop) }); }
      ctx.fx.overlay('#ffb070', 0.1); ctx.fx.vignette(0.5);
      if (dw > 0 && dw < 0.6) tag(ctx, 'WINK', tw, tw + 0.6, { y: 0.14, size: 56 });
    },
  },
  // ── b05 "Mrs. Higgins traded her car for one."  — chalk outline, tilt up to her floating
  {
    name: 'chalk car', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx), P = ctx.props;
      ctx.add(P.chalk); P.chalk.position.copy(L(-14, 0.015, 2.9)); P.chalk.rotation.set(0, L.yaw, 0);
      put(ctx, 'higgins', L(-14.2, 3.2, 2.6), L.yaw + 0.3);
      ctx.add(P.paper, ctx.cast.higgins.joints.handL); P.paper.position.set(0, 0.05, 0.12); P.paper.rotation.set(-0.5, 0, 0);
      ctx.add(P.bag, ctx.cast.higgins.joints.foreArmL || ctx.cast.higgins.joints.armL); P.bag.position.set(0, -0.15, 0);
      ctx.add(P.swA.root);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, P = ctx.props, t = ctx.t, h = ctx.cast.higgins;
      h.root.position.copy(L(-14.2, 3.4 + 0.15 * Math.sin(t * 1.5), 2.6));
      hang(h, t, 0, { face: 'smile' }); h.joints.head.rotation.x += 0.35;
      h.joints.armL.rotation.x = -1.1; if (h.joints.foreArmL) h.joints.foreArmL.rotation.x = -0.7;
      const k = ease.inOutCubic(clamp((t - ctx.time('b05.w1') + 0.3) / 1.4, 0, 1));
      const c = moveCam(ctx, { pos: L(-11.2, 1.7, 8.6), look: L(-14, 0.2, 3.0), fov: 48 }, { pos: L(-11.0, 1.4, 8.8), look: L(-14, 4.0, 2.7), fov: 52 }, k);
      const b = balloon(h, t, 0, { len: 1.5 }); P.swA.begin(c.pos).add(b.pos, { from: b.from, s: 2.2 }).end().setDim(0);
      tag(ctx, 'MRS. HIGGINS', ctx.time('b05.w1'), Infinity, { y: 0.15, size: 66 });
      tag(ctx, 'HER CAR', ctx.time('b05.w4') - 0.1, ctx.time('b05.w7'), { y: 0.24, size: 56 });
    },
  },
  {
    name: 'higgins commute', start: 'b05.w7-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx), P = ctx.props;
      put(ctx, 'higgins', L(-10, 3.5, 2.4), L.yaw - PI / 2 + 0.35);
      ctx.add(P.paper, ctx.cast.higgins.joints.handL); P.paper.position.set(0, 0.05, 0.12); P.paper.rotation.set(-0.5, 0, 0);
      ctx.add(P.bag, ctx.cast.higgins.joints.foreArmL || ctx.cast.higgins.joints.armL); P.bag.position.set(0, -0.15, 0);
      const walkers = CROWD.slice(4, 9).map((id, k) => { put(ctx, id, L(0, CURB, 6.6), 0); return { id, k, x0: -20 + k * 3.4, dir: k % 2 ? 1 : -1 }; });
      ctx.add(P.swA.root);
      ctx.store = { ...ctx.store, L, walkers };
    },
    update(ctx, lt) {
      const { L, walkers } = ctx.store, P = ctx.props, t = ctx.t, h = ctx.cast.higgins;
      const x = -10 - 1.3 * lt;
      h.root.position.copy(L(x, 3.5 + 0.12 * Math.sin(t * 1.5), 2.4));
      hang(h, t, 0, { face: 'smile' }); h.joints.head.rotation.x += 0.35;
      h.joints.armL.rotation.x = -1.1; if (h.joints.foreArmL) h.joints.foreArmL.rotation.x = -0.7;
      const c = { pos: L(x - 2.6, 1.3, 7.4), look: L(x - 0.3, 3.9, 2.4), fov: 54 };
      ctx.cam.set(c);
      P.swA.begin(c.pos);
      const b = balloon(h, t, 0, { len: 1.5 }); P.swA.add(b.pos, { from: b.from, s: 2.2 });
      walkers.forEach((w) => { const ch = ctx.cast[w.id]; ch.root.position.copy(L(w.x0 + w.dir * lt * 1.1, CURB, 6.6 + (w.k % 2) * 0.5)); ch.root.rotation.y = L.yaw + w.dir * PI / 2; ch.pose('walk', t + w.k); ch.face('smile', t + w.k); const bb = balloon(ch, t, w.k); P.swA.add(bb.pos, { from: bb.from }); });
      P.swA.end().setDim(0);
      tag(ctx, 'COMMUTE: AIRBORNE', ctx.time('b05.w8'), Infinity, { y: 0.15, size: 60 });
    },
  },
  // ── b06 "Darnell from the Goon Squad tied twelve to his shoes."  — low hero angle
  {
    name: 'goon squad', start: 'b06-0.12', set: 'town',
    setup(ctx) { darnellSetup(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t;
      const c = moveCam(ctx, { pos: L(1.6, 0.45, 7.3), look: L(2, 2.7, 1.0), fov: 54 }, { pos: L(1.8, 0.5, 6.7), look: L(2, 2.9, 1.0), fov: 52 }, clamp(lt / 2.8, 0, 1));
      darnellUpdate(ctx, c);
      stamp(ctx, 'GOON SQUAD!', ctx.markers.goon, { y: 0.17, size: 120, fill: '#ffd23f', stroke: '#1d1d22' });
    },
  },
  {
    name: 'since tuesday', start: 'b06.w10-0.1', set: 'town',
    setup(ctx) { darnellSetup(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store;
      const c = moveCam(ctx, { pos: L(5.8, 1.0, 6.2), look: L(2, 3.3, 1.0), fov: 56 }, { pos: L(5.3, 1.1, 5.6), look: L(2, 3.5, 1.0), fov: 54 }, clamp(lt / 2, 0, 1));
      darnellUpdate(ctx, c);
      tag(ctx, '3 METRES UP', ctx.time('b06.w12'), Infinity, { y: 0.15, size: 58 });
      stamp(ctx, 'SINCE TUESDAY', ctx.time('b06.w16'), { y: 0.25, size: 96, fill: '#ffffff', stroke: '#e8232b' });
      ctx.cam.punch([ctx.time('b06.w16')], ctx.t, 0.1, 0.25);
    },
  },
  // ── b07 HUSS ×3: sneakers, token cluster, smug face
  ...[0, 1, 2].map((i) => ({
    name: `darnell huss #${i + 1}`, start: i === 0 ? 'b07.h0-0.12' : `b07.h${i}-0.03`, set: 'town',
    setup(ctx) { darnellSetup(ctx); },
    update(ctx) {
      const { L } = ctx.store, hits = ctx.hussTimes('b07').map((h) => h + 0.03), d = ctx.cast.darnell;
      d.root.updateMatrixWorld(true);
      const f = footPos(d, 'R').lerp(footPos(d, 'L'), 0.5), face = humanFace(d);
      const cams = [{ pos: f.clone().add(V(0.9, -0.15, 2.2)), look: f.clone().add(up(-0.34)), fov: 34 },
        { pos: f.clone().add(V(-1.1, 0.4, 2.6)), look: f.clone().add(up(0.55)), fov: 40 },
        { pos: face.clone().add(V(0.35, -0.15, 2.1)), look: face.clone().add(up(-0.3)), fov: 34 }];
      darnellUpdate(ctx, cams[i], { huss: hits });
      ctx.cam.set(cams[i]); ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b08 "And me? I didn't buy a single one. I saved my money for a sandwich."  — bedroom, day
  {
    name: 'bedroom sandwich', start: 'b08-0.1', set: 'room',
    setup(ctx) { roomSetup(ctx); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t;
      roomTick(ctx, { hold: 'lap', face: t > ctx.time('b08.w3') ? 'determined' : 'smile' });
      moveCam(ctx, { pos: R(0.85, 1.4, 1.75), look: R(-1.45, 1.0, -0.95), fov: 50 }, { pos: R(0.7, 1.35, 1.5), look: R(-1.45, 1.0, -0.95), fov: 50 }, ease.inOutSine(clamp(lt / 2.3, 0, 1)));
      tag(ctx, '0 TOKENS', ctx.time('b08.w5'), Infinity, { y: 0.15, size: 70, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  {
    name: 'sandwich proud', start: 'b08.w8-0.1', set: 'room',
    setup(ctx) { roomSetup(ctx); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, ts = ctx.time('b08.w13');
      const up1 = ease.outBack(clamp((t - ts + 0.35) / 0.4, 0, 1));
      roomTick(ctx, { hold: 'up', raise: up1, face: 'determined', faceT: 1.0 });
      const me = ctx.cast.me, f = humanFace(me);
      const c = moveCam(ctx, { pos: R(0.65, 1.0, 0.4), look: f.clone().add(V(0, 0.3, 0)), fov: 52 }, { pos: R(0.5, 1.0, 0.25), look: f.clone().add(V(0, 0.35, 0)), fov: 52 }, clamp(lt / 1.8, 0, 1));
      fill(ctx, c.pos, 0.6, '#ffe8c8');
      if (t > ts) stamp(ctx, 'SANDWICH', ts, { y: 0.12, size: 110, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.06 });
    },
  },
  // ── b09 "Darnell floated past laughing. Enjoy your sandwich, peasant!"
  {
    name: 'darnell window', start: 'b09-0.1', set: 'room',
    setup(ctx) { roomSetup(ctx, { darnell: true }); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t;
      roomTick(ctx, { hold: 'lap', face: 'squint', look: true });
      ctx.cam.set({ pos: R(-1.15, 1.8, 2.0), look: R(-0.95, 1.5, -2.6), fov: 52 });
    },
  },
  {
    name: 'peasant card', start: 'b09.w4-0.1', set: 'room',
    setup(ctx) { roomSetup(ctx, { darnell: true }); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t;
      // Darnell hovers in the window, laughing, while he delivers the line; slow push-in through the glass
      roomTick(ctx, { hold: 'lap', face: 'squint', faceT: 1.0, dx: -0.5 + 0.04 * Math.sin(t * 1.7) });
      const d = ctx.cast.darnell; d.root.position.add(up(0.24));   // face in the upper pane, clear of the muntins
      const c = moveCam(ctx, { pos: R(-0.3, 1.55, 0.1), look: R(-0.48, 2.15, -2.7), fov: 48 }, { pos: R(-0.42, 1.6, -0.6), look: R(-0.48, 2.18, -2.7), fov: 46 }, ease.inOutSine(clamp(lt / 1.9, 0, 1)));
      fill(ctx, c.pos, 1.3, '#ffe8c8');
      quoteCard(ctx, 'Enjoy your sandwich, peasant!', 'Darnell', ctx.time('b09.w4') - 0.08, ctx.time('b09.end') + 0.15, { y: 0.27, byAt: ctx.time('b09.w7') - 0.1 });
    },
  },
  // ── b10 "Even Principal Dunmore wanted one. Nobody wants what Principal Dunmore wants."
  {
    name: 'dunmore waves', start: 'b10-0.1', set: 'town',
    setup(ctx) { dunmoreSchool(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store;
      const c = moveCam(ctx, { pos: L(2.2, 2.0, 2.4), look: L(7.2, 1.55, -0.2), fov: 48 }, { pos: L(2.5, 2.0, 2.2), look: L(7.2, 1.6, -0.2), fov: 46 }, clamp(lt / 2.2, 0, 1));
      dunmoreSchoolTick(ctx, c, { scatter: false });
      tag(ctx, 'PRINCIPAL DUNMORE', ctx.time('b10.w1'), Infinity, { y: 0.15, size: 60, bg: 'rgba(122,90,58,0.92)' });
    },
  },
  {
    name: 'nobody', start: 'b10.w5-0.12', set: 'town',
    setup(ctx) { dunmoreSchool(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store;
      const c = moveCam(ctx, { pos: L(10.8, 3.0, 3.4), look: L(5.8, 0.7, 0), fov: 50 }, { pos: L(12.5, 7.5, 2.5), look: L(6.8, 0.8, -0.2), fov: 50 }, ease.inOutSine(clamp((lt - 0.7) / 1.8, 0, 1)));
      dunmoreSchoolTick(ctx, c, { scatter: true });
      tag(ctx, 'NOBODY', ctx.time('b10.w5'), Infinity, { y: 0.15, size: 80, bg: 'rgba(60,60,80,0.9)' });
    },
  },
  // ── b11 "Until yesterday. The mayor went on TV and said pirate token is going to the moon."
  {
    name: 'tv square wide', start: 'b11-0.1', set: 'town',
    setup(ctx) { tvSetup(ctx); },
    update(ctx, lt) {
      const { S } = ctx.store;
      const c = moveCam(ctx, { pos: S(1.0, 1.4, 15.5), look: S(-0.6, 2.6, 0.5), fov: 48 }, { pos: S(0.8, 1.5, 13.5), look: S(-0.4, 2.7, 0.5), fov: 46 }, clamp(lt / 2.1, 0, 1));
      tvTick(ctx, c);
      tag(ctx, 'YESTERDAY', ctx.time('b11.w1'), Infinity, { y: 0.15, size: 76, bg: 'rgba(30,60,140,0.9)' });
    },
  },
  {
    name: 'tv mayor moon', start: 'b11.w5-0.1', set: 'town',
    setup(ctx) { tvSetup(ctx); },
    update(ctx, lt) {
      const { S } = ctx.store;
      const c = moveCam(ctx, { pos: S(0.4, 2.2, 9.5), look: S(0, 2.75, 0.9), fov: 42 }, { pos: S(0.25, 2.5, 6.9), look: S(0, 2.85, 0.9), fov: 40 }, ease.inOutSine(clamp(lt / 2.8, 0, 1)));
      tvTick(ctx, c, { point: true });
      stamp(ctx, 'TO THE MOON', ctx.time('b11.w15'), { y: 0.16, size: 124, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.05 });
    },
  },
  // ── b12 "Everyone wanted it at the same time."  — crowd cheers, every token flares
  {
    name: 'everyone wants', start: 'b12-0.1', set: 'town',
    setup(ctx) {
      const { L, S } = square(ctx, { cover: 'tv' });
      const camP = S(0.6, 1.0, 2.6);
      const crowd = plazaCrowd(ctx, S, CROWD, { z0: 5.0, dx: 1.3, dz: 1.4, seed: 3 });
      ctx.add(ctx.props.swA.root); ctx.add(ctx.props.tv);
      ctx.store = { ...ctx.store, L, S, crowd, camP };
    },
    update(ctx, lt) {
      const { S, crowd, camP } = ctx.store, P = ctx.props, t = ctx.t, t0 = ctx.time('b12');
      const fl = clamp((t - t0) / 0.25, 0, 1) * (1 - 0.4 * clamp((t - t0 - 0.6) / 0.8, 0, 1));
      const c = moveCam(ctx, { pos: camP, look: S(0, 1.4, 9), fov: 58 }, { pos: camP.clone().add(up(-0.2)), look: S(0, 2.4, 9), fov: 62 }, clamp(lt / 1.8, 0, 1));
      P.swA.begin(c.pos);
      crowd.forEach((m) => { const on = t > t0 - 0.05 + 0.02 * m.k; m.ch.pose(on ? 'cheer' : 'idle', t + m.ph); m.ch.face(on ? 'grin' : 'smile', t + m.ph); const b = balloon(m.ch, t, m.k, { tight: fl, len: 1.3 + 0.6 * fl }); P.swA.add(b.pos, { from: b.from, s: 1.2 }); });
      P.swA.end().setDim(0, fl);
      P.tv.userData.set(t, 0);
      flash(ctx, t0, 0.25, '#fff2b0', 0.5);
    },
  },
  // ── b13 "Every token shot into the sky, still tied to everything. Houses. Cars. The clock tower."
  {
    name: 'tokens shoot up', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      const { L, S } = square(ctx, { cover: 'tv' });
      const crowd = plazaCrowd(ctx, S, CROWD.slice(0, 12), { z0: 5.2, dx: 1.35, dz: 1.5, seed: 8 });
      ctx.add(ctx.props.swA.root);
      ctx.store = { ...ctx.store, L, S, crowd };
    },
    update(ctx, lt) {
      const { S, crowd } = ctx.store, P = ctx.props, t = ctx.t, t0 = ctx.time('b13.w2');
      const k = clamp((t - t0) / 0.5, 0, 1);
      townPurple(ctx, 0.85 * clamp((t - ctx.time('b13') - 0.3) / 1.6, 0, 1));
      const c = { pos: S(-1.2, 0.8, 2.6), look: S(1.0, 2.2 + 2.5 * k, 9.5), fov: 60 };   // stage corner: the truss beam stays behind the lens
      ctx.cam.set(c);
      P.swA.begin(c.pos);
      crowd.forEach((m) => {
        const lift = Math.max(0, (t - t0 - 0.15 * (m.k % 4))) * 1.4;
        m.ch.root.position.copy(S(m.x, -0.8 + Math.min(lift, 2.5), m.z));
        if (lift > 0) hang(m.ch, t, m.k, { face: 'shocked' }); else { m.ch.pose('cheer', t + m.ph); m.ch.face('grin', t + m.ph); }
        const b = balloon(m.ch, t, m.k, { tight: k, len: 1.3 + 2.5 * k }); P.swA.add(b.pos, { from: b.from, s: 1.2 });
      });
      P.swA.end().setDim(0, 0.6 * k);
      P.tv.userData.set(t, 0.2);
      if (t > t0) ctx.cam.shake(0.35 * k, t, 13);
      ctx.fx.draw((g, W, H) => { if (k <= 0) return; g.save(); g.strokeStyle = `rgba(255,230,140,${0.5 * k})`; g.lineWidth = 6; for (let i = 0; i < 16; i++) { const x = hash(i * 3.3 + Math.floor(t * 20)) * W, y = hash(i * 7.1 + Math.floor(t * 20)) * H * 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 160); g.stroke(); } g.restore(); });
    },
  },
  {
    name: 'lift wide', start: 'b13.w8-0.1', set: 'sky',
    setup(ctx) { liftSetup(ctx); },
    update(ctx, lt) {
      const c = moveCam(ctx, { pos: V(28, 10, 34), look: V(-2, 3.5, 0), fov: 50 }, { pos: V(26, 12, 31), look: V(-2, 5, 0), fov: 50 }, clamp(lt / 1.4, 0, 1));
      liftTick(ctx, c);
    },
  },
  {
    name: 'house rips', start: 'b13.w10-0.25', set: 'sky',
    setup(ctx) { liftSetup(ctx); },
    update(ctx, lt) {
      const sk = ctx.set, h = sk.houses[2]; h.updateMatrixWorld(true);
      const hp = h.position.clone();
      const c = { pos: V(hp.x + 5.2, 1.0, 2.2), look: V(hp.x, Math.max(2.5, hp.y + 1.5), hp.z), fov: 58 };
      liftTick(ctx, c);
      ctx.cam.set(c);
      stamp(ctx, 'HOUSES', ctx.time('b13.w10'), { y: 0.17, size: 110, fill: '#ffffff', stroke: '#6a2fb8', rot: -0.05 });
    },
  },
  {
    name: 'car floats', start: 'b13.w11-0.12', set: 'sky',
    setup(ctx) { liftSetup(ctx); ctx.set.street.children.forEach((c) => { if (c.position.z > 4.5 && c.position.z < 5.5) c.visible = false; }); },   // south lamp line would cut the car
    update(ctx, lt) {
      const sk = ctx.set; liftTick(ctx, null);
      const cp = sk.car.position.clone();
      const c = { pos: V(cp.x + 2.5, cp.y + 0.7, cp.z + 6.3), look: cp.clone().add(V(-0.2, 1.3, 0)), fov: 50 };
      liftTick(ctx, c); ctx.cam.set(c);
      stamp(ctx, 'CARS', ctx.time('b13.w11'), { y: 0.17, size: 110, fill: '#ffffff', stroke: '#6a2fb8', rot: 0.05 });
    },
  },
  {
    name: 'clock tower lifts', start: 'b13.w12-0.12', set: 'sky',
    setup(ctx) { liftSetup(ctx); },
    update(ctx, lt) {
      const sk = ctx.set; liftTick(ctx, null);
      const tp = sk.tower.position.clone();
      const c = moveCam(ctx, { pos: V(tp.x + 9, 1.2, tp.z + 14), look: tp.clone().add(up(9)), fov: 58 }, { pos: V(tp.x + 9, 1.0, tp.z + 13), look: tp.clone().add(up(11)), fov: 60 }, clamp(lt / 1.2, 0, 1));
      liftTick(ctx, c); ctx.cam.set(c);
      stamp(ctx, 'THE CLOCK TOWER', ctx.time('b13.w13'), { y: 0.15, size: 84, fill: '#ffffff', stroke: '#6a2fb8', rot: -0.04 });
    },
  },
  // ── b14 "Mr. Okafor reached for a lamp post. Ah, almost... almost!"
  {
    name: 'okafor rising', start: 'b14-0.1', set: 'town',
    setup(ctx) { okaforSetup(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, o = ctx.cast.okafor;
      okaforTick(ctx, null);
      const y = o.root.position.y - L(0, 0, 0).y;
      const c = moveCam(ctx, { pos: L(-10.5, 1.2, 0.5), look: L(-8.7, y + 1.4, -4.9), fov: 50 }, { pos: L(-10.6, 1.5, 0.1), look: L(-8.7, y + 1.5, -4.9), fov: 50 }, clamp(lt / 2.5, 0, 1));
      okaforTick(ctx, c);
      tag(ctx, 'MR. OKAFOR', ctx.time('b14.w1'), Infinity, { y: 0.15, size: 66 });
    },
  },
  {
    name: 'almost', start: 'b14.w6-0.12', set: 'town',
    setup(ctx) { okaforSetup(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, o = ctx.cast.okafor;
      okaforTick(ctx, null);
      const hp = handPos(o, 'R');
      const post = L(-9, 0, -5.15); post.y = hp.y;
      const c = { pos: L(-11.4, 0, -2.2).setY(hp.y - 0.9), look: hp.clone().lerp(post, 0.5).add(up(-0.15)), fov: 44 };
      fill(ctx, c.pos, 0.9, '#ffe8c8');
      okaforTick(ctx, c); ctx.cam.set(c);
      const t2 = ctx.time('b14.w9');
      stamp(ctx, 'ALMOST!', ctx.markers.almost, { y: 0.15, size: 120, fill: '#ffd23f', stroke: '#1d1d22' });
      if (ctx.t > t2) stamp(ctx, 'ALMOST!!', t2, { y: 0.27, size: 140, fill: '#e8232b', stroke: '#ffffff', rot: 0.08 });
      ctx.cam.punch([ctx.markers.almost, t2], ctx.t, 0.08, 0.25);
    },
  },
  // ── b15 HUSS ×3: house past camera, Mrs Higgins on a roof, Darnell upside down above the clouds
  {
    name: 'huss house past', start: 'b15.h0-0.12', set: 'sky',
    setup(ctx) { const sk = ctx.set; sk.setMode('ground'); sk.setSky(1); sk.ground.visible = false; sk.slab.visible = false; sk.street.visible = false; sk.island.children.forEach((c) => { if (c !== sk.houses[3]) c.visible = c === sk.slab || c === sk.street ? false : c.visible; }); sk.houses.forEach((h, i) => { h.visible = i === 3; }); sk.tower.visible = false; sk.car.visible = sk.car2.visible = false; sk.shipMini.visible = false; ctx.store.hits = ctx.hussTimes('b15').map((h) => h + 0.03); },
    update(ctx) {
      const sk = ctx.set, t = ctx.t, h = sk.houses[3], hit = ctx.store.hits[0];
      h.userData.under.visible = true;
      h.position.set(6.2, 0.5 + (t - hit) * 10, -7.3); h.rotation.set(0.12, 0.3, 0.08);
      const c = { pos: V(13, 3.5, 4), look: V(6.2, 3.0, -7.3), fov: 58 };
      ctx.cam.set(c); sk.tokens(t, c.pos, { flare: 0.4 });
      ctx.cam.punch(ctx.store.hits, t, 0.1, 0.2); ctx.cam.shake(0.3, t, 5);
    },
  },
  {
    name: 'huss higgins roof', start: 'b15.h1-0.03', set: 'sky',
    setup(ctx) {
      const sk = ctx.set; sk.setMode('sky');
      const h = sk.houses[0]; h.updateMatrixWorld(true);
      const ridge = h.localToWorld(V(1.5, h.userData.roofY - 0.05, 0));   // out at the gable end, the tether strings stay behind her
      const camP = h.localToWorld(V(4.6, h.userData.roofY + 1.1, 2.9));
      put(ctx, 'higgins', ridge, h.userData.yaw + PI / 2);
      ctx.store = { ...ctx.store, ridge, camP, hits: ctx.hussTimes('b15').map((x) => x + 0.03) };
    },
    update(ctx) {
      const sk = ctx.set, t = ctx.t, hg = ctx.cast.higgins;
      hg.pose('sit', t, { seatHeight: 0, hands: 'none' }); hg.face('sweat', t);
      hg.joints.armL.rotation.x = -1.4; hg.joints.armR.rotation.x = -1.4; hg.joints.armL.rotation.z = -0.4; hg.joints.armR.rotation.z = 0.4;
      const c = { pos: ctx.store.camP, look: humanFace(hg).add(up(-0.75)), fov: 44 };
      ctx.cam.set(c); sk.tokens(t, c.pos);
      ctx.cam.punch(ctx.store.hits, t, 0.1, 0.2); ctx.cam.shake(0.15, t, 6);
    },
  },
  {
    name: 'huss darnell spin', start: 'b15.h2-0.03', set: 'sky',
    setup(ctx) {
      const sk = ctx.set; sk.setMode('sky'); sk.island.visible = false;
      put(ctx, 'darnell', V(0, 30, 40), 0);
      ctx.add(ctx.props.swA.root);
      ctx.store.hits = ctx.hussTimes('b15').map((x) => x + 0.03);
    },
    update(ctx) {
      const sk = ctx.set, t = ctx.t, d = ctx.cast.darnell, P = ctx.props;
      d.root.position.set(0, 31, 40); d.root.rotation.set(0, t * 3.0, PI);
      d.root.position.y = 31 + 1.0;   // feet up, head down
      d.pose('surprised', t); d.face('shocked', 1);
      const c = { pos: V(0, 30.6, 46.5), look: V(0, 31.2, 40), fov: 48 };
      ctx.cam.set(c); sk.tokens(t, c.pos);
      P.swA.begin(c.pos);
      for (const s of ['L', 'R']) { const f = footPos(d, s); for (let k = 0; k < 6; k++) P.swA.add(f.clone().add(V((s === 'L' ? -1 : 1) * (0.2 + 0.35 * hash(k)), 0.6 + 0.4 * hash(k * 3), 0.3 * Math.sin(k * 2))), { from: f, s: 1.0 }); }
      P.swA.end().setDim(0);
      ctx.cam.punch(ctx.store.hits, t, 0.1, 0.2);
    },
  },
  // ── b16 "The sky turned purple. The only way down? Make everyone stop wanting it."
  {
    name: 'island in the clouds', start: 'b16-0.1', set: 'sky',
    setup(ctx) { const sk = ctx.set; sk.setMode('sky'); },
    update(ctx, lt) {
      const sk = ctx.set, t = ctx.t;
      sk.island.position.y = 0.6 * Math.sin(t * 0.6); sk.island.rotation.z = 0.01 * Math.sin(t * 0.4);
      const c = moveCam(ctx, { pos: V(46, 16, 62), look: V(0, 0, 0), fov: 46 }, { pos: V(38, 20, 60), look: V(-2, 1, 0), fov: 44 }, ease.inOutSine(clamp(lt / 1.5, 0, 1)));
      sk.tokens(t, c.pos);
      tag(ctx, 'PURPLE', ctx.time('b16.w3'), Infinity, { y: 0.15, size: 76, bg: 'rgba(106,47,184,0.92)' });
    },
  },
  {
    name: 'think on stage', start: 'b16.w4-0.1', set: 'town',
    setup(ctx) { stageSetup(ctx, { mic: false }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, me = ctx.cast.me, tm = ctx.time('b16.w8') - 0.1;
      stageTick(ctx);
      if (t < tm) { me.pose('think', t); me.face('neutral', t); } else { me.pose('idle', t, { intensity: 0.3 }); me.face('determined', 1.0); me.joints.armL.rotation.z = -0.25; me.joints.armR.rotation.z = 0.25; }
      const f = humanFace(me);
      moveCam(ctx, { pos: S(1.0, 1.1, 4.9), look: S(0, 1.5, 2.5), fov: 50 }, { pos: S(0.6, 1.25, 5.0), look: f.clone().add(up(-0.3)), fov: 40 }, ease.inOutSine(clamp((t - tm + 0.4) / 1.4, 0, 1)));
      if (t > tm) tag(ctx, 'MAKE THEM STOP WANTING IT', tm + 0.05, Infinity, { y: 0.14, size: 52 });
    },
  },
  // ── b17 "So I grabbed the mic and said the most uncool thing in history."
  {
    name: 'grab mic', start: 'b17-0.1', set: 'town',
    setup(ctx) { stageSetup(ctx, { mic: true }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, me = ctx.cast.me, tg = ctx.time('b17.w2');
      stageTick(ctx);
      const k = ease.outCubic(clamp((t - tg + 0.3) / 0.35, 0, 1));
      me.pose('idle', t, { intensity: 0.3 }); me.face('determined', 1);
      me.joints.armR.rotation.x = -1.25 * k; if (me.joints.foreArmR) me.joints.foreArmR.rotation.x = -0.35 * k;
      ctx.cam.set({ pos: S(-1.1, 0.9, 4.8), look: S(0, 1.45, 2.8), fov: 48 });
    },
  },
  {
    name: 'crowd turns', start: 'b17.w5-0.1', set: 'town',
    setup(ctx) { stageSetup(ctx, { mic: true }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, me = ctx.cast.me;
      stageTick(ctx, { turnAt: ctx.time('b17.w5') + 0.1 });
      me.pose('idle', t, { intensity: 0.3 }); me.face('determined', 1); me.joints.armR.rotation.x = -1.25; if (me.joints.foreArmR) me.joints.foreArmR.rotation.x = -0.35;
      ctx.cam.set({ pos: S(0.75, 1.9, 1.55), look: S(-0.2, 0.9, 9.0), fov: 46 });
    },
  },
  {
    name: 'push in face', start: 'b17.w8-0.1', set: 'town',
    setup(ctx) { stageSetup(ctx, { mic: true }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, me = ctx.cast.me;
      stageTick(ctx, { turnAt: -1 });
      me.pose('idle', t, { intensity: 0.2 }); me.face('determined', 1); me.joints.armR.rotation.x = -1.25; if (me.joints.foreArmR) me.joints.foreArmR.rotation.x = -0.35;
      const f = humanFace(me);
      moveCam(ctx, { pos: S(0.55, 1.6, 6.0), look: f.clone().add(up(-0.15)), fov: 40 }, { pos: S(0.4, 1.7, 4.4), look: f.clone().add(up(-0.08)), fov: 34 }, ease.inOutSine(clamp(lt / 1.4, 0, 1)));
      ctx.fx.vignette(0.3 + 0.3 * clamp(lt / 1.4, 0, 1));
    },
  },
  // ── b18 "Principal Dunmore just bought pirate token."  — hard cut: floating bench
  {
    name: 'dunmore bought it', start: 'b18-0.1', set: 'sky',
    setup(ctx) {
      const sk = ctx.set; sk.setMode('sky');
      const P = ctx.props, BP = V(-6, 14, 30);
      ctx.add(P.bench); P.bench.position.copy(BP); P.bench.rotation.set(0, 0.25, 0);
      put(ctx, 'dunmore', BP.clone().add(V(0.05, 0, 0.05)), 0.25);
      ctx.add(P.swA.root); ctx.add(P.hero);
      ctx.store = { ...ctx.store, BP };
    },
    update(ctx, lt) {
      const sk = ctx.set, P = ctx.props, t = ctx.t, d = ctx.cast.dunmore, { BP } = ctx.store;
      const bob = 0.15 * Math.sin(t * 1.4);
      P.bench.position.copy(BP).add(up(bob)); d.root.position.copy(BP).add(V(0.05, bob, 0.05));
      d.pose('sit', t, { seatHeight: 0.5, hands: 'none', intensity: 0.5 });
      const w = Math.sin(t * 9);
      d.joints.armL.rotation.set(-2.6 + 0.3 * w, 0, -0.35); d.joints.armR.rotation.set(-2.6 - 0.3 * w, 0, 0.35);
      d.face('grin', 1.0);
      const c = moveCam(ctx, { pos: BP.clone().add(V(1.1, 1.5, 4.4)), look: BP.clone().add(V(0, 1.0, 0)), fov: 46 }, { pos: BP.clone().add(V(0.9, 1.45, 3.8)), look: BP.clone().add(V(0, 1.05, 0)), fov: 44 }, clamp(lt / 2.2, 0, 1));
      sk.tokens(t, c.pos);
      const hp = handPos(d, 'R'); P.hero.position.copy(hp).add(up(0.25)); P.hero.scale.setScalar(0.8); P.hero.rotation.set(0, Math.atan2(c.pos.x - hp.x, c.pos.z - hp.z), 0); P.hero.userData.set(t, {});
      P.bench.updateMatrixWorld(true);
      P.swA.begin(c.pos);
      for (const s of [-1, 1]) { const f = P.bench.localToWorld(V(s * 0.85, 0.7, -0.05)); for (let k = 0; k < 5; k++) P.swA.add(f.clone().add(V(s * (0.2 + 0.5 * hash(k)), 1.8 + 0.7 * hash(k * 3) + 0.1 * Math.sin(t * 2 + k), -0.4 + 0.3 * k)), { from: f, s: 1.0 }); }
      P.swA.end().setDim(0);
      stamp(ctx, 'PRINCIPAL DUNMORE', ctx.time('b18.w1') - 0.2, { y: 0.13, size: 86, fill: '#ffffff', stroke: '#7a5a3a', rot: -0.04 });
      if (t > ctx.time('b18.w3')) stamp(ctx, 'BOUGHT IT', ctx.time('b18.w3'), { y: 0.72, size: 130, fill: '#e8232b', stroke: '#ffffff', rot: 0.06 });
      ctx.cam.punch([ctx.time('b18.w3')], t, 0.12, 0.3);
    },
  },
  // ── b19 "Everyone screamed. Ew! Gross! Instant crash."
  {
    name: 'ew', start: 'b19-0.1', set: 'town',
    setup(ctx) { stageSetup(ctx, { mic: true, me: false }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t;
      stageTick(ctx, { turnAt: -1, faces: 'shocked', faceAt: ctx.time('b19') + 0.05 });
      ctx.cam.set({ pos: S(0.3, 2.7, 1.6), look: S(0, 1.0, 8.5), fov: 54 });
      ctx.cam.shake(0.12, t, 4);
      if (t > ctx.time('b19.w2')) stamp(ctx, 'EW!', ctx.time('b19.w2'), { y: 0.2, size: 170, fill: '#7dd35a', stroke: '#1d3a10', rot: -0.12 });
    },
  },
  {
    name: 'gross', start: 'b19.w2-0.1', set: 'town',
    setup(ctx) { stageSetup(ctx, { mic: true, me: false, letGo: true }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t;
      stageTick(ctx, { turnAt: -1, faces: 'squint', faceAt: -1, letGo: ctx.time('b19.w3') - 0.25 });
      ctx.cam.set({ pos: S(-1.6, 1.9, 3.3), look: S(0.6, 1.4, 7.6), fov: 48 });
      stamp(ctx, 'EW!', ctx.time('b19.w2'), { y: 0.2, size: 170, fill: '#7dd35a', stroke: '#1d3a10', rot: -0.12 });
      if (t > ctx.time('b19.w3')) stamp(ctx, 'GROSS!', ctx.time('b19.w3'), { y: 0.31, size: 150, fill: '#a0e070', stroke: '#1d3a10', rot: 0.1 });
    },
  },
  {
    name: 'instant crash', start: 'b19.w4-0.12', set: 'sky',
    setup(ctx) { const sk = ctx.set; sk.setMode('sky'); sk.ground.visible = true; sk.setSky(0.25); },
    update(ctx, lt) {
      const sk = ctx.set, t = ctx.t, tc = ctx.time('b19.w5');
      const s = clamp((tc - t) / (tc - ctx.time('b19.w4') + 0.12), 0, 1);
      sk.island.position.y = 34 * s * s;
      const dt = t - tc;
      if (dt > 0) { sk.slab.visible = false; sk.houses.forEach((h) => { h.userData.under.visible = false; }); }
      const c = { pos: V(5, 2.0, 24), look: V(0, 3 + 14 * s, 0), fov: 56 };
      ctx.cam.set(c); sk.tokens(t, c.pos, { dim: clamp((t - ctx.time('b19.w4')) / 0.4, 0, 1) });
      if (dt > 0) { ctx.cam.shake(1.7 * Math.exp(-dt * 2.5), t, 9); const pf = puffAt(ctx, 0, V(9, 0, 10), 4, '#d8ccb6'); pf.update(clamp(dt / 1.0, 0, 1)); const pf2 = puffAt(ctx, 1, V(-9, 0, 3), 6, '#d8ccb6'); pf2.update(clamp((dt - 0.05) / 1.0, 0, 1)); const pf3 = puffAt(ctx, 2, V(-1, 0, 7.5), 4.5, '#d8ccb6'); pf3.update(clamp((dt - 0.12) / 1.0, 0, 1)); }
      if (dt > 0) stamp(ctx, 'CRASH', tc, { y: 0.2, size: 190, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.08 });
      flash(ctx, tc, 0.18, '#ffffff', 0.7);
    },
  },
  // ── b20 HUSS ×6: houses thud, tower slams upright, Darnell lands, Okafor hugs the post, crowd cheers, me + mic
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `landing huss #${i + 1}`, start: i === 0 ? 'b20.h0-0.12' : `b20.h${i}-0.03`, set: i < 2 ? 'sky' : 'town',
    setup(ctx) { landSetup(ctx, i); },
    update(ctx) { landTick(ctx, i); },
  })),
  // ── b21 "Top ten respect. Kid saves town with one sentence."  — freeze frame
  {
    name: 'top ten freeze', start: 'b21-0.1', set: 'town',
    setup(ctx) { stageSetup(ctx, { mic: false, party: true, floating: false, dull: true }); },
    update(ctx, lt) {
      const { S } = ctx.store, me = ctx.cast.me, tf = 3.3;
      stageTick(ctx, { freeze: tf, cheer: true });
      micHigh(ctx, me, tf);
      ctx.cam.set({ pos: S(-1.3, 0.35, 4.9), look: S(0.9, 2.5, 1.2), fov: 56 });
      flash(ctx, ctx.time('b21') - 0.1, 0.3, '#ffffff', 0.85);
      ctx.fx.overlay('#2a1a40', 0.12);
      top10Card(ctx, 1, ctx.time('b21') - 0.02, Infinity, { popAt: ctx.markers.top10 });
    },
  },
  // ── b22 "Victory chant! Bonkaroo! Skalla mee! Doobi tash! Arrbanoo!"
  ...[
    ['b22-0.1', null, null, 0], ['b22.w2-0.1', 'BONKAROO!', '#ff4fa3', 1], ['b22.w3-0.1', 'SKALLA MEE!', '#3ee0c8', 2],
    ['b22.w5-0.1', 'DOOBI TASH!', '#ffd23f', 3], ['b22.w7-0.1', 'ARRBANOO!', '#ff7a2f', 4],
  ].map(([start, word, col, i]) => ({
    name: `chant ${i}`, start, set: 'town',
    setup(ctx) { stageSetup(ctx, { mic: false, party: true, floating: false, dull: true, dancers: true }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, me = ctx.cast.me;
      stageTick(ctx, { dance: true });
      me.pose('dance2', t, { speed: 1.1 }); me.face(i % 2 ? 'laugh' : 'grin', t);
      const cams = [{ pos: S(1.2, 1.9, 6.3), look: S(0, 0.6, 2.5), fov: 46 }, { pos: S(-0.9, 0.5, 4.2), look: S(0, 1.6, 2.2), fov: 44 },
        { pos: S(4.5, 3.0, 6.5), look: S(-0.3, 1.2, 1.8), fov: 44 }, { pos: S(0.5, 1.4, 5.0), look: S(0, 1.75, 2.4), fov: 40 }, { pos: S(-2.5, 4.5, 11), look: S(0, 2.0, 1.0), fov: 50 }];
      const c = cams[i]; ctx.cam.set(c);
      if (word) { const tw = ctx.time(start) + 0.1; stamp(ctx, word, tw, { y: 0.2, size: 140, fill: col, stroke: '#1d1d22', rot: i % 2 ? 0.1 : -0.1 }); ctx.cam.punch([tw], t, 0.12, 0.25); }
      else tag(ctx, 'VICTORY CHANT', ctx.time('b22'), Infinity, gold({ y: 0.16, size: 76 }));
    },
  })),
  // ── b23 "While they were floating, by the way, I ate my sandwich."
  {
    name: 'ate my sandwich', start: 'b23-0.1', set: 'town',
    setup(ctx) { stageSetup(ctx, { mic: false, party: true, floating: false, dull: true, dusty: true, sit: true }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, ta = ctx.time('b23.w8');
      stageTick(ctx, { dusty: true });
      me.pose('sit', t, { seatHeight: 0.8, hands: 'none', intensity: 0.4 });
      me.face('smug', 1.0);
      const bite = ta - t < 0.25 && ta - t > -0.25;
      me.joints.armL.rotation.x = -1.35; me.joints.armR.rotation.x = -1.35; me.joints.armL.rotation.z = -0.3; me.joints.armR.rotation.z = 0.3;
      if (me.joints.foreArmL) { me.joints.foreArmL.rotation.x = bite ? -1.3 : -0.9; me.joints.foreArmR.rotation.x = bite ? -1.3 : -0.9; }
      const a = handPos(me, 'L'), b = handPos(me, 'R'), m = a.clone().lerp(b, 0.5);
      ctx.add(P.sandwich); P.sandwich.position.copy(m).add(up(0.05)); P.sandwich.rotation.set(0, me.root.rotation.y, 0); P.sandwich.scale.setScalar(0.7);
      P.sandwich.userData.setBite(t > ta ? 1 : 0);
      moveCam(ctx, { pos: S(1.6, 1.0, 5.3), look: S(0, 1.35, 3.2), fov: 56 }, { pos: S(1.45, 1.0, 5.1), look: S(0, 1.4, 3.2), fov: 54 }, clamp(lt / 2.6, 0, 1));
      if (t > ta) tag(ctx, 'CHOMP', ta, Infinity, { y: 0.16, size: 80, bg: 'rgba(200,120,0,0.9)' });
    },
  },
  // ── b24 "Now nobody wants pirate token. Except Principal Dunmore. And the more he wants it, the higher he goes."
  {
    name: 'free tokens', start: 'b24-0.1', set: 'town',
    setup(ctx) {
      nightTown(ctx);
      const L = T(ctx), P = ctx.props;
      ctx.add(P.bin); P.bin.position.copy(L(-3.6, CURB, 5.7)); P.bin.rotation.set(0, L.yaw + 1.05, 0);   // sign faces the lens
      put(ctx, CROWD[2], L(-7, 0, 3.9), L.yaw + PI / 2);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, w = ctx.cast[CROWD[2]];
      w.root.position.copy(L(-7.5 + 1.0 * lt, 0, 3.9)); w.pose('walk', t); w.face('neutral', t, { lookAt: null });
      const c = moveCam(ctx, { pos: L(-0.5, 1.6, 7.15), look: L(-3.6, 1.15, 5.7), fov: 48 }, { pos: L(-0.75, 1.55, 7.05), look: L(-3.6, 1.15, 5.7), fov: 46 }, clamp(lt / 2, 0, 1));
      fill(ctx, c.pos, 1.2);
      tag(ctx, 'NOBODY', ctx.time('b24.w1'), Infinity, { y: 0.15, size: 76, bg: 'rgba(30,40,60,0.9)' });
    },
  },
  {
    name: 'dunmore garden', start: 'b24.w5-0.12', set: 'town',
    setup(ctx) {
      nightTown(ctx);
      const L = T(ctx), P = ctx.props;
      const GP = L(-21, 0.02, 8.4);
      ctx.add(P.garden); P.garden.position.copy(GP); P.garden.rotation.set(0, L.yaw + PI, 0);
      const DP = L(-21, 0.12, 6.9);   // front of the garden, clear of the tree canopy behind
      put(ctx, 'dunmore', DP, L.yaw + PI);
      ctx.add(P.swBig.root); ctx.add(P.goldLight); ctx.add(P.flare);
      ctx.store = { ...ctx.store, L, GP: DP };
    },
    update(ctx, lt) {
      const { L, GP } = ctx.store, P = ctx.props, t = ctx.t, d = ctx.cast.dunmore;
      const lift = Math.pow(clamp((t - ctx.time('b24.w8')) / 2.2, 0, 1), 1.6) * 0.9;
      d.root.position.copy(GP).add(V(0, lift, 0));
      d.pose('idle', t, { intensity: 0.3 }); d.face('grin', 1.0);
      hugArms(d);
      const cc = clusterCenter(d);
      const c = moveCam(ctx, { pos: L(-19.4, 1.0, 4.0), look: humanFace(d).add(up(0.75)), fov: 58 }, { pos: L(-19.5, 0.85, 4.1), look: humanFace(d).add(up(0.9)), fov: 62 }, ease.inOutSine(clamp(lt / 3.6, 0, 1)));
      bigCluster(ctx, cc, 1.25, c.pos, t);
      P.goldLight.position.copy(cc); P.goldLight.intensity = 9; P.flare.position.copy(cc); P.flare.scale.setScalar(4.5);
      fill(ctx, c.pos, 0.6);
      if (lift > 0.05) tag(ctx, 'HIGHER...', ctx.time('b24.w14'), Infinity, gold({ y: 0.15, size: 70 }));
    },
  },
  // ── b25 "He lives on the moon now. School is cancelled forever."
  {
    name: 'moon drift', start: 'b25-0.1', set: 'sky',
    setup(ctx) { moonSetup(ctx); },
    update(ctx, lt) { moonTick(ctx, { pos: V(0, 10, 30), look: V(0, 24, -40), fov: 30 }); tag(ctx, 'THE MOON', ctx.time('b25.w4'), Infinity, { y: 0.14, size: 66 }); },
  },
  {
    name: 'school cancelled', start: 'b25.w6-0.12', set: 'room',
    setup(ctx) { roomSetup(ctx, { night: true }); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me;
      me.root.position.copy(R(0.2, 0, -0.2)); me.root.rotation.y = ctx.store.Ryaw + 0.15;
      me.pose('cheer', t, { speed: 1.3 }); me.face('laugh', t);
      const c = moveCam(ctx, { pos: R(0.6, 1.4, 3.0), look: R(0.15, 1.42, -0.2), fov: 48 }, { pos: R(0.5, 1.4, 2.6), look: R(0.15, 1.42, -0.2), fov: 48 }, clamp(lt / 1.5, 0, 1));
      fill(ctx, c.pos, 0.8, '#ffe8c8');
      roomTokens(ctx, c);
      stamp(ctx, 'SCHOOL:', ctx.time('b25.w6'), { y: 0.1, size: 84, fill: '#ffffff', stroke: '#1d1d22', rot: -0.04 });
      if (t > ctx.time('b25.w8')) stamp(ctx, 'CANCELLED\nFOREVER', ctx.time('b25.w8'), { y: 0.2, size: 92, fill: '#e8232b', stroke: '#ffffff', rot: -0.08 });
    },
  },
  // ── b26 HUSS ×3: snap zooms on the moon until the tiny waving principal fills the frame
  ...[0, 1, 2].map((i) => ({
    name: `moon zoom #${i + 1}`, start: i === 0 ? 'b26.h0-0.12' : `b26.h${i}-0.03`, set: 'sky',
    setup(ctx) { moonSetup(ctx); },
    update(ctx) {
      const hits = ctx.hussTimes('b26').map((h) => h + 0.03), d = ctx.cast.dunmore;
      moonTick(ctx, null);
      const p = d.root.position.clone().add(up([1.6, 0.75, 0.9][i]));
      moonTick(ctx, { pos: V(-4, 8, 30), look: p, fov: [14, 7, 4.5][i] });   // offset so he sits near the moon's limb (edge + stars in frame)
      ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
      if (i === 2) { stamp(ctx, 'BYE!', hits[2] + 0.15, { y: 0.11, size: 140, fill: '#ffd23f', stroke: '#1d1d22' }); iris(ctx, ctx.timeline.duration - 0.55, 0.45, 0.5); }
    },
  })),
];

// ═════════════════════════════════════════════════════════════════════════════ shot building blocks
// ── Darnell floating over the street with 12 tokens on his sneakers
function darnellSetup(ctx) {
  dayTown(ctx);
  const L = T(ctx);
  put(ctx, 'darnell', L(2, 3.0, 1.0), L.yaw);
  put(ctx, 'goon1', L(0.9, 0, 1.6), L.yaw + 0.2); put(ctx, 'goon2', L(3.1, 0, 1.6), L.yaw - 0.2);
  const walkers = CROWD.slice(9, 13).map((id, k) => { put(ctx, id, L(0, CURB, -6.7), 0); return { id, k, x0: -6 + k * 4.5, dir: k % 2 ? 1 : -1 }; });
  ctx.add(ctx.props.swA.root);
  ctx.store = { ...ctx.store, L, walkers };
}
function darnellUpdate(ctx, cam, { huss = null } = {}) {
  const { L, walkers } = ctx.store, P = ctx.props, t = ctx.t, d = ctx.cast.darnell;
  d.root.position.copy(L(2, 3.0 + 0.12 * Math.sin(t * 1.6), 1.0));
  d.pose('crossArms', t); const hh = huss ? lastBefore(huss, t) : null;
  d.face('smug', 1.0);
  d.joints.legL.rotation.x = 0.1 * Math.sin(t * 1.6); d.joints.legR.rotation.x = -0.1 * Math.sin(t * 1.6);
  for (const [id, k] of [['goon1', 0], ['goon2', 1]]) { const g = ctx.cast[id]; g.pose('crossArms', t + k); g.face('smug', 1.0 + k); }
  P.swA.begin(cam.pos);
  for (const s of ['L', 'R']) {
    const f = footPos(d, s); const sx = s === 'L' ? 1 : -1;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * PI * 1.2 - 0.1; const r = 0.45 + 0.25 * hash(k * 3.3 + (s === 'L' ? 0 : 9));
      const p = L(0, 0, 0).sub(L(0, 0, 0));
      const lp = d.root.worldToLocal(f.clone());
      const q = d.root.localToWorld(V(lp.x + sx * Math.cos(a) * r, lp.y + 0.35 + Math.sin(a) * r * 0.9 + 0.06 * Math.sin(t * 2 + k), lp.z + (k % 2 ? 0.25 : -0.2)));
      P.swA.add(q, { from: f, s: 0.75 });
    }
  }
  walkers.forEach((w) => { const ch = ctx.cast[w.id]; ch.root.position.copy(L(w.x0 + w.dir * (t - 18) * 1.0, CURB, -6.7)); ch.root.rotation.y = L.yaw + w.dir * PI / 2; ch.pose('walk', t + w.k); ch.face('smile', t + w.k); const b = balloon(ch, t, w.k); P.swA.add(b.pos, { from: b.from }); });
  P.swA.end().setDim(0);
}

// ── bedroom
function roomSetup(ctx, { darnell = false, night = false } = {}) {
  const set = ctx.set; set.setLighting?.(night ? 'night' : 'day'); set.set?.('window', night ? 'dark' : 'day');
  set.root.updateMatrixWorld(true);
  const r = set.root, R = (x, y, z) => r.localToWorld(V(x, y, z)), Ryaw = yawOf(r);
  const P = ctx.props;
  if (!night) {
    put(ctx, 'me', R(-1.66, 0, -0.5), Ryaw + PI / 2);
    ctx.add(P.sandwich); P.sandwich.scale.setScalar(1); P.sandwich.userData.setBite(0);
  } else put(ctx, 'me', R(0.2, 0, -0.2), Ryaw);
  if (darnell) { put(ctx, 'darnell', R(-2.6, 0.1, -2.72), Ryaw); }
  ctx.add(P.swA.root);
  ctx.store = { ...ctx.store, R, Ryaw, darnell, night };
}
function roomTokens(ctx, cam) {
  const { R } = ctx.store, P = ctx.props, t = ctx.t;
  P.swA.begin(cam.pos);
  for (let k = 0; k < 7; k++) { const u = ((t * 0.16 + k / 7) % 1); P.swA.add(R(-2.4 + 3.4 * u, 1.05 + 1.1 * hash(k * 3.1) + 0.1 * Math.sin(t * 2 + k), -2.55 - 0.45 * hash(k * 5.5)), { yaw: Math.atan2(cam.pos.x, cam.pos.z) * 0 + PI * 0 + (ctx.store.Ryaw || 0) + 0.4 * Math.sin(t + k), s: 1.0 }); }
  if (ctx.store.darnell) {
    const d = ctx.cast.darnell; d.root.updateMatrixWorld(true);
    for (const s of ['L', 'R']) { const f = footPos(d, s); for (let k = 0; k < 4; k++) P.swA.add(f.clone().add(V((s === 'L' ? 0.3 : -0.3) * (1 + k * 0.3), 0.5 + 0.3 * k, -0.15)), { from: f, s: 0.75 }); }
  }
  P.swA.end().setDim(0);
}
function roomTick(ctx, { hold = 'lap', raise = 0, face = 'determined', faceT = null, look = false, dx = null } = {}) {
  const { R, Ryaw } = ctx.store, P = ctx.props, t = ctx.t, me = ctx.cast.me;
  me.pose('sit', t, { seatHeight: 0.55, hands: 'none', intensity: 0.4 });
  const J = me.joints;
  if (hold === 'lap') { J.armL.rotation.set(-0.75, 0, -0.15); J.armR.rotation.set(-0.75, 0, 0.15); if (J.foreArmL) { J.foreArmL.rotation.x = -0.75; J.foreArmR.rotation.x = -0.75; } }
  else if (hold === 'chest') { J.armL.rotation.set(-1.0, 0, -0.3); J.armR.rotation.set(-1.0, 0, 0.3); if (J.foreArmL) { J.foreArmL.rotation.x = -1.1; J.foreArmR.rotation.x = -1.1; } }
  else { const a = lerp(-0.75, -2.9, raise); J.armL.rotation.set(a, 0, -0.28); J.armR.rotation.set(a, 0, 0.28); if (J.foreArmL) { J.foreArmL.rotation.x = lerp(-0.75, -0.35, raise); J.foreArmR.rotation.x = lerp(-0.75, -0.35, raise); } }
  if (look && ctx.store.darnell) { const df = humanFace(ctx.cast.darnell); J.head.rotation.y = -0.9; J.head.rotation.x = -0.1; }
  me.face(face, faceT ?? t);
  const a = handPos(me, 'L'), b = handPos(me, 'R'), m = a.clone().lerp(b, 0.5);
  P.sandwich.position.copy(m).add(up(0.06 + (hold === 'up' ? 0.2 * raise : 0))); P.sandwich.rotation.set(0, Ryaw + PI / 2 + PI / 2, 0);
  if (ctx.store.darnell) {
    const d = ctx.cast.darnell, t0 = ctx.time('b09') - 0.6;
    d.root.position.copy(R(dx ?? -2.6 + 1.25 * (t - t0), 0.15 + 0.08 * Math.sin(t * 2), -2.72));
    d.pose('pointLaugh', t); d.face('laugh', t);
  }
  roomTokens(ctx, ctx.cam.state || { pos: R(1, 1.4, 1.5) });
}

// ── Principal Dunmore and the kids
function dunmoreSchool(ctx) {
  dayTown(ctx);
  const L = T(ctx);
  put(ctx, 'dunmore', L(7.4, 0, -0.2), L.yaw - PI / 2 + 0.45);
  const kids = [['k1', 4.6, -1.0], ['k2', 4.2, 0.2], ['k3', 4.7, 1.3], ['k4', 3.5, -0.2]].map(([id, x, z], k) => { put(ctx, id, L(x, 0, z), L.yaw + PI / 2); return { id, x, z, k }; });
  ctx.add(ctx.props.swA.root); ctx.add(ctx.props.hero);
  const sign = makeSchoolSign(); ctx.add(sign); sign.position.copy(L(10.5, CURB, -6.4)); sign.rotation.set(0, L.yaw, 0);
  ctx.store = { ...ctx.store, L, kids };
}
let _schoolSign = null;
function makeSchoolSign() {
  if (_schoolSign) return _schoolSign;
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8), new THREE.MeshStandardMaterial({ color: '#3a3d46' })); post.position.y = 1.3; g.add(post);
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#2f4d8a'; x.fillRect(0, 0, 512, 256); x.strokeStyle = '#ffd23f'; x.lineWidth = 14; x.strokeRect(7, 7, 498, 242);
  x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '74px "ITT Luckiest", "Luckiest Guy", sans-serif'; x.fillText('TOWN SCHOOL', 256, 100);
  x.font = '900 40px "ITT Nunito", sans-serif'; x.fillText('PRINCIPAL: DUNMORE', 256, 180);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, side: THREE.DoubleSide })); pl.position.y = 2.6; g.add(pl);
  _schoolSign = g; return g;
}
function dunmoreSchoolTick(ctx, cam, { scatter = false } = {}) {
  const { L, kids } = ctx.store, P = ctx.props, t = ctx.t, d = ctx.cast.dunmore;
  const tn = ctx.time('b10.w5'), sc = scatter ? Math.max(0, t - tn) : 0;
  const sad = scatter && t > tn + 0.5;
  if (!sad) { d.pose('wave', t, { speed: 1.3 }); d.face('grin', t); } else { d.pose('idle', t, { intensity: 0.2 }); d.face('sad', 1.0); d.joints.armR.rotation.x = -0.9; d.joints.head.rotation.x += 0.25; }
  const hp = handPos(d, 'R');
  const droop = scatter ? clamp((t - tn - 0.3) / 1.8, 0, 1) : 0;
  const tp = hp.clone().add(V(0.15 * Math.sin(t * 2), lerp(1.0, 0.25, droop), 0.1));
  P.hero.position.copy(tp); P.hero.scale.setScalar(1.0); P.hero.rotation.set(droop * 0.6, Math.atan2(cam.pos.x - tp.x, cam.pos.z - tp.z), 0); P.hero.userData.set(t, { dim: 0.3 * droop, glowA: 1 - 0.5 * droop });
  P.swA.begin(cam.pos); P.swA.add(V(0, -50, 0)); P.swA.end();
  if (!ctx.store.str) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 5), new THREE.MeshBasicMaterial({ color: '#f6f2ea' })); s.geometry.translate(0, 0.5, 0); ctx.store.str = s; ctx.add(s); }
  const dd = tp.clone().sub(hp); ctx.store.str.position.copy(hp); ctx.store.str.quaternion.setFromUnitVectors(V(0, 1, 0), dd.clone().normalize()); ctx.store.str.scale.set(1, Math.max(0.01, dd.length() - 0.28), 1);
  kids.forEach((k) => {
    const ch = ctx.cast[k.id];
    if (sc <= 0) { ch.root.position.copy(L(k.x, 0, k.z)); ch.root.rotation.y = L.yaw + PI / 2; ch.pose('idle', t + k.k, { lookAt: tp }); ch.face(['squint', 'neutral', 'squint', 'sad'][k.k], t); }
    else {
      const dirs = [[-1, -0.6], [-1, 0.2], [-0.6, 1], [-1, -0.1]]; const [dx, dz] = dirs[k.k];
      const dist = 3.2 * sc; ch.root.position.copy(L(k.x + dx * dist, 0, k.z + dz * dist)); ch.root.rotation.y = L.yaw + Math.atan2(dx, dz);
      ch.pose('walk', t + k.k, { speed: 2.4 }); ch.face('shocked', 1);
    }
  });
}

// ── the TV on the stage
function tvSetup(ctx) {
  const { L, S } = square(ctx, { cover: 'tv' });
  const P = ctx.props; P.tv.updateMatrixWorld(true);
  const sf = P.tv.userData.studioFloor.getWorldPosition(V());
  ctx.place('mayor', sf, { scale: 1.3 }); ctx.cast.mayor.root.rotation.set(0, S.yaw, 0);
  const crowd = plazaCrowd(ctx, S, CROWD, { z0: 5.6, dx: 1.25, dz: 1.35, seed: 5 });
  ctx.add(P.swA.root);
  ctx.store = { ...ctx.store, L, S, crowd };
}
function tvTick(ctx, cam, { point = false } = {}) {
  const { crowd } = ctx.store, P = ctx.props, t = ctx.t, m = ctx.cast.mayor;
  m.pose('idle', t, { intensity: 0.4 }); m.face('grin', t);
  const tp = ctx.time('b11.w9');
  if (point && t > tp - 0.2) { const k = ease.outBack(clamp((t - tp + 0.2) / 0.35, 0, 1)); m.joints.armR.rotation.x = -3.0 * k; m.joints.armR.rotation.z = 0.1; if (m.joints.foreArmR) m.joints.foreArmR.rotation.x = 0; }
  const t0 = ctx.time('b11');
  const st = 0.9 * Math.exp(-Math.max(0, t - t0) * 2.5) + (Math.sin(t * 7.3) > 0.93 ? 0.5 : 0) + (Math.abs(t - ctx.time('b11.w15')) < 0.08 ? 0.6 : 0);
  P.tv.userData.set(t, st);
  P.swA.begin(cam.pos);
  crowd.forEach((c) => { c.ch.pose('idle', t + c.ph, { intensity: 0.4 }); c.ch.face('neutral', t + c.ph); const b = balloon(c.ch, t, c.k); P.swA.add(b.pos, { from: b.from, s: 1.1 }); });
  P.swA.end().setDim(0);
}

// ── the mini town tearing out of the ground (sky set, 'ground' mode)
function liftSetup(ctx) { const sk = ctx.set; sk.setMode('ground'); ctx.add(ctx.props.puffs[0].root); }
function liftAt(ctx) {
  const t0 = ctx.time('b13.w9') - 0.3;
  return { t0, houses: (i) => t0 + 0.12 * ((i * 7) % 10) + (i === 2 ? -0.2 : 0), car: ctx.time('b13.w11') - 0.3, tower: ctx.time('b13.w13') - 0.5 };
}
function liftTick(ctx, cam) {
  const sk = ctx.set, t = ctx.t, A = liftAt(ctx);
  sk.setSky(clamp((t - ctx.time('b13')) / 5.6, 0, 1));
  sk.houses.forEach((h, i) => {
    const s = t - A.houses(i);
    const y = s <= 0 ? 0 : 1.6 * s * s + 1.2 * s;
    const shake = s > -0.4 && s < 0.1 ? 0.06 * Math.sin(t * 60 + i) : 0;
    h.position.set(h.userData.home.x + shake, y, h.userData.home.z); h.rotation.set(0.04 * Math.sin(s * 2 + i) * (s > 0 ? 1 : 0), h.userData.yaw + (s > 0 ? 0.05 * s : 0), 0.04 * Math.cos(s * 1.7 + i) * (s > 0 ? 1 : 0));
    h.userData.under.visible = y > 0.05; sk.holes[i].visible = y > 0.05;
  });
  const sc = t - A.car; sk.car.position.set(3 - (sc > 0 ? 1.5 * sc : 0), sc > 0 ? 1.4 * sc * sc + 1.6 * sc : 0, 1.6 + (sc > 0 ? 0.8 * sc : 0)); sk.car.rotation.set(sc > 0 ? 0.25 * sc : 0, sc > 0 ? 0.4 * sc : 0, sc > 0 ? 0.15 * Math.sin(sc * 3) : 0);
  const s2 = t - A.car + 0.25; sk.car2.position.set(-7, s2 > 0 ? 1.2 * s2 * s2 + 1.4 * s2 : 0, -1.6); sk.car2.rotation.set(s2 > 0 ? -0.2 * s2 : 0, PI, 0);
  const st = t - A.tower;
  const tilt = st <= 0 ? 0 : Math.min(0.35, 0.5 * st);
  sk.tower.position.set(-18.5, st <= 0 ? 0 : 1.1 * st * st + 0.6 * st, 0); sk.tower.rotation.set(0, 0, -tilt); sk.tower.userData.under.visible = st > 0;
  const dz = clamp((t - A.t0) / 0.6, 0, 1);
  if (cam) {
    sk.tokens(t, cam.pos, { flare: 0.3 + 0.4 * dz, lift: 1.5 * dz });
    if (t > A.t0) ctx.cam.shake(0.5 * dz, t, 17);
    const pf = ctx.props.puffs[0]; pf.root.position.set(0.8, 0, -7.2); pf.root.scale.setScalar(5); pf.update(clamp((t - A.houses(2)) / 1.3, 0, 1));
  }
}

// ── Mr. Okafor and the lamp post (north side, x −9)
function okaforSetup(ctx) {
  dayTown(ctx);
  const L = T(ctx), P = ctx.props;
  put(ctx, 'okafor', L(-8.3, 0.5, -4.6), L.yaw - PI / 2 + 0.6);
  ctx.add(P.pack, ctx.cast.okafor.joints.torso); P.pack.position.set(0, 0.28, -0.25); P.pack.rotation.set(0, 0, 0);
  ctx.add(P.swA.root);
  skyDressing(ctx, L, [[-30, 22, -40, 0.3], [-4, 30, -55, 1.2], [-55, 34, -20, 2.0]], [[-20, 14, -30, 2.0], [6, 18, -40, 2.4], [-40, 20, -45, 3]]);
  ctx.store = { ...ctx.store, L };
}
function okaforTick(ctx, cam) {
  const { L } = ctx.store, P = ctx.props, t = ctx.t, o = ctx.cast.okafor;
  townPurple(ctx, 1); skyDressingTick(ctx);
  const t0 = ctx.time('b14'), ta = ctx.markers.almost;
  const y = 0.3 + 0.5 * (t - t0) + 0.12 * Math.max(0, t - ta) * Math.max(0, t - ta) * 3;
  const x = -8.3 + 0.12 * Math.max(0, t - ta);
  o.root.position.copy(L(x, y, -4.7));
  o.pose('point', t, { lookAt: L(-9, y + 1.6, -5.15) }); o.face('sweat', t);
  const J = o.joints; J.armR.rotation.x = -1.45; J.armR.rotation.z = 0.15; J.legL.rotation.x = 0.2 * Math.sin(t * 4); J.legR.rotation.x = -0.2 * Math.sin(t * 4);
  if (cam) {
    P.swA.begin(cam.pos);
    o.root.updateMatrixWorld(true);
    const f = o.joints.torso.localToWorld(V(0, 0.55, -0.25));
    for (let k = 0; k < 9; k++) { const a = hash(k * 3.7) * PI * 2, r = 0.3 + 0.5 * hash(k * 1.9); P.swA.add(f.clone().add(V(Math.cos(a) * r, 1.2 + 0.9 * hash(k * 5.3) + 0.08 * Math.sin(t * 2 + k), Math.sin(a) * r - 0.2)), { from: f, s: 1.0 }); }
    P.swA.end().setDim(0, 0.2);
  }
}

// ── the stage (purple sky, floating crowd, mic)
function stageSetup(ctx, { mic = true, me = true, party = false, floating = true, dull = false, dancers = false, dusty = false, sit = false, letGo = false } = {}) {
  const { L, S } = square(ctx, { cover: 'chest', party });
  const P = ctx.props;
  if (me) put(ctx, 'me', S(0, sit ? -0.8 : 0, sit ? 3.2 : 2.5), S.yaw);
  if (mic) { ctx.add(P.mic); P.mic.position.copy(S(0, 0, 2.98)); P.mic.rotation.set(0, S.yaw + PI, 0); }
  const crowd = plazaCrowd(ctx, S, dancers ? CROWD.slice(0, 10) : CROWD, { z0: 5.6, dx: 1.3, dz: 1.4, seed: 11, floatH: floating ? 1 : 0 });
  const onStage = [];
  if (dancers) { [['goon1', -2.2, 0.6], ['goon2', 2.2, 0.6], ['okafor', -3.6, -0.6], ['higgins', 3.6, -0.6], ['darnell', -1.6, -1.6]].forEach(([id, x, z], k) => { onStage.push({ ch: put(ctx, id, S(x, 0, z), S.yaw), k }); }); }
  if (dusty) { [['okafor', -2.0, 0.6], ['higgins', 2.4, 0.4], ['darnell', -3.4, -0.4]].forEach(([id, x, z], k) => { onStage.push({ ch: put(ctx, id, S(x, 0, z), S.yaw + (k - 1) * 0.6), k }); }); ctx.add(P.dust); P.dust.position.copy(S(0, 1.2, 3)); }
  ctx.add(P.swA.root); ctx.add(P.swB.root);
  if (floating) skyDressing(ctx, L, [[30, 22, -30, 0.5], [70, 26, 22, 2.2], [20, 30, 30, 1.2]], [[86, 6, -34, 3], [84, 9, 36, 3.4], [22, 4, -48, 3], [22, 5, 46, 3], [96, 14, 0, 4]]);
  ctx.store = { ...ctx.store, L, S, crowd, onStage, floating, dull, letGo };
}
function stageTick(ctx, { turnAt = null, faces = null, faceAt = null, letGo = null, freeze = null, cheer = false, dance = false, dusty = false } = {}) {
  const { S, crowd, onStage, floating, dull } = ctx.store, P = ctx.props, t = ctx.t, tt = freeze ?? t;
  if (floating) { townPurple(ctx, 1); skyDressingTick(ctx); }
  const cam = ctx.cam.state || { pos: S(0, 1.5, 8) };
  P.swA.begin(cam.pos);
  crowd.forEach((m) => {
    let fy = 0, faceE = 'grin';
    const tl = letGo != null ? t - letGo - 0.04 * m.k : -1;
    if (floating) {
      const base = 0.6 + 0.6 * hash(m.k * 2.2);
      fy = tl > 0 ? Math.max(0, base - 4.9 * tl * tl) : base + 0.1 * Math.sin(tt * 1.5 + m.k);
      m.ch.root.position.copy(S(m.x, -0.8 + fy, m.z));
    }
    // turning toward the stage
    let yawOff = (hash(m.k * 7.3 + 11) - 0.5) * 0.5;
    if (turnAt != null && turnAt > 0) { const away = PI * 0.75 * (m.k % 2 ? 1 : -1); yawOff = lerp(away, yawOff, ease.inOutCubic(clamp((t - turnAt - 0.05 * m.k) / 0.45, 0, 1))); }
    m.ch.root.rotation.y = S.yaw + PI + yawOff;
    if (faces) faceE = faceAt != null && faceAt > 0 && t < faceAt + 0.03 * m.k ? 'neutral' : faces;
    if (dance) { m.ch.pose(m.k % 3 ? 'dance' : 'dance2', tt + m.ph); m.ch.face('grin', tt + m.ph); }
    else if (cheer) { m.ch.pose('cheer', tt + m.ph); m.ch.face('grin', tt + m.ph); }
    else if (dusty) { m.ch.pose(m.k % 3 === 0 ? 'stunned' : 'idle', tt + m.ph, { intensity: 0.4 }); m.ch.face(m.k % 2 ? 'sweat' : 'squint', tt + m.ph); }
    else if (floating && !(tl > 0 && fy <= 0)) { hang(m.ch, tt, m.k, { face: faces ? faceE : 'neutral' }); if (faces === 'shocked' && t > (faceAt ?? 0)) { m.ch.joints.armL.rotation.x = -2.4; m.ch.joints.armL.rotation.z = -0.5; } }
    else { m.ch.pose(tl > 0 ? 'surprised' : 'idle', tt + m.ph); m.ch.face(faces ? faceE : 'neutral', tt + m.ph); }
    if (!dull && !(tl > 0)) { const b = balloon(m.ch, tt, m.k, { len: 1.4 }); P.swA.add(b.pos, { from: b.from, s: 1.15 }); }
    else if (tl > 0) { const b = balloon(m.ch, tt, m.k, { len: 1.4 }); P.swA.add(b.pos.add(up(2.2 * tl + 3 * tl * tl)), { s: 1.15 }); }
  });
  P.swA.end().setDim(letGo != null ? clamp((t - letGo) / 0.5, 0, 1) : 0);
  // dull tokens lying around after the crash
  P.swB.begin(cam.pos);
  if (dull) for (let k = 0; k < 40; k++) { const x = (hash(k * 2.9) - 0.5) * 11, z = 3.8 + hash(k * 4.3) * 7; P.swB.add(S(x, -0.8 + 0.04, z), { yaw: hash(k) * 6, tilt: PI / 2, s: 1 }); }
  P.swB.end().setDim(dull ? 1 : 0);
  onStage.forEach((o) => {
    if (dance) { o.ch.pose(o.k % 2 ? 'dance' : 'dance2', t + o.k); o.ch.face('grin', t + o.k); }
    else if (dusty) { const u = clamp((t - ctx.time('b23') - 0.4 * o.k) / 1.6, 0, 1); o.ch.pose('sitStand', t, { u }); o.ch.face(o.k % 2 ? 'sweat' : 'squint', 1 + o.k); }
  });
  if (dusty) P.dust.userData.set(t, 1);
}
function micHigh(ctx, me, tt) {
  me.pose('cheer', tt); me.face('grin', 1.2);
  const P = ctx.props; ctx.add(P.micHand, me.joints.handR); P.micHand.position.set(0, 0.0, 0.02); P.micHand.rotation.set(0, 0, 0);
}

// ── after the crash: six HUSS cuts
function landSetup(ctx, i) {
  const hits = ctx.hussTimes('b20').map((h) => h + 0.03);
  ctx.store.hits = hits; ctx.store.hit = hits[i];
  if (i < 2) {
    const sk = ctx.set; sk.setMode('ground'); sk.setSky(0.15);
    ctx.add(ctx.props.puffs[0].root);
    return;
  }
  if (i === 2) {
    dayTown(ctx); const L = T(ctx); ctx.store.L = L;
    put(ctx, 'darnell', L(2, 0, 1.0), L.yaw + 0.3); ctx.add(ctx.props.swA.root);
    return;
  }
  if (i === 3) {
    dayTown(ctx); const L = T(ctx); ctx.store.L = L;
    put(ctx, 'okafor', L(-9.1, CURB, -5.62), L.yaw + 0.15);
    ctx.add(ctx.props.pack, ctx.cast.okafor.joints.torso); ctx.props.pack.position.set(0, 0.28, -0.25);
    ctx.add(ctx.props.swA.root);
    return;
  }
  if (i === 4) { stageSetup(ctx, { mic: false, me: false, party: true, floating: false, dull: true }); return; }
  stageSetup(ctx, { mic: false, party: true, floating: false, dull: true });
}
function landTick(ctx, i) {
  const t = ctx.t, { hits, hit } = ctx.store, dh = t - hit, P = ctx.props;
  if (i === 0) {
    const sk = ctx.set; sk.tokens(t, V(18, 1.2, 14), { dim: 1 });
    sk.houses.forEach((h, k) => { const drop = k % 3 === i % 3 ? Math.max(0, -dh) * 14 : 0; h.position.set(h.userData.home.x, drop, h.userData.home.z); });
    const h = sk.houses[1];
    const c = { pos: V(h.userData.home.x + 7, 1.4, h.userData.home.z + 12), look: V(h.userData.home.x, 2.2, h.userData.home.z), fov: 50 };
    ctx.cam.set(c); sk.tokens(t, c.pos, { dim: 1 });
    const pf = P.puffs[0]; pf.root.position.set(h.userData.home.x, 0, h.userData.home.z + 2.5); pf.root.scale.setScalar(4); pf.update(clamp(dh / 1.0, 0, 1));
    if (dh > 0) ctx.cam.shake(0.6 * Math.exp(-dh * 6), t, 21);
  } else if (i === 1) {
    const sk = ctx.set; const k = dh < 0 ? 1 : Math.max(0, 1 - dh / 0.08);
    sk.tower.rotation.set(0, 0, -0.35 * k - (dh > 0 ? 0.05 * Math.exp(-dh * 8) * Math.sin(dh * 40) : 0));
    const c = { pos: V(-5.5, 1.2, 2.6), look: V(-18.5, 8.0, 0), fov: 60 };
    ctx.cam.set(c); sk.tokens(t, c.pos, { dim: 1 });
    const pf = P.puffs[0]; pf.root.position.set(-18.5, 0, 2); pf.root.scale.setScalar(5); pf.update(clamp(dh / 1.0, 0, 1));
    if (dh > 0) ctx.cam.shake(0.7 * Math.exp(-dh * 6), t, 22);
  } else if (i === 2) {
    const { L } = ctx.store, d = ctx.cast.darnell;
    const y = dh < 0 ? 1.4 * Math.min(1, -dh / 0.2) : 0;
    d.root.position.copy(L(2, y, 1.0));
    d.pose('sit', t, { seatHeight: 0.0, hands: 'none' }); d.face(dh > 0 ? 'shocked' : 'sweat', 1);
    d.joints.armL.rotation.set(-0.3, 0, -0.9); d.joints.armR.rotation.set(-0.3, 0, 0.9);
    const c = { pos: L(3.4, 0.9, 4.4), look: L(2, 0.7, 1.0), fov: 46 }; ctx.cam.set(c);
    P.swA.begin(c.pos); for (let k = 0; k < 12; k++) P.swA.add(L(2 + Math.cos(k) * (0.6 + 0.3 * hash(k)), 0.04, 1.0 + Math.sin(k) * (0.6 + 0.3 * hash(k))), { yaw: k, tilt: PI / 2, s: 0.8 }); P.swA.end().setDim(1);
    const pf = puffAt(ctx, 1, L(2, 0, 0.3), 0.8); pf.update(clamp(dh / 0.8, 0, 1));
    if (dh > 0) ctx.cam.shake(0.4 * Math.exp(-dh * 6), t, 23);
  } else if (i === 3) {
    const { L } = ctx.store, o = ctx.cast.okafor;
    o.pose('idle', t, { intensity: 0.3 }); o.face(dh > 0 ? 'smile' : 'sweat', 1.0);
    const J = o.joints; J.armL.rotation.set(-1.45, 0, 0.55); J.armR.rotation.set(-1.45, 0, -0.55); if (J.foreArmL) { J.foreArmL.rotation.x = -0.9; J.foreArmR.rotation.x = -0.9; }
    J.head.rotation.y = 0.45;
    const c = { pos: L(-7.6, 1.5, -1.6), look: L(-9.0, 1.45, -5.3), fov: 46 }; ctx.cam.set(c);
    P.swA.begin(c.pos); for (let k = 0; k < 7; k++) P.swA.add(L(-9 + Math.cos(k * 1.3) * 0.9, 0.04, -4.2 + Math.sin(k * 1.3) * 0.7), { yaw: k, tilt: PI / 2, s: 0.8 }); P.swA.end().setDim(1);
    tag(ctx, 'SAFE', hit, Infinity, { y: 0.2, size: 80, bg: 'rgba(40,140,60,0.9)' });
  } else if (i === 4) {
    const { S } = ctx.store;
    stageTick(ctx, { cheer: true });
    ctx.cam.set({ pos: S(0.6, 0.5, 3.6), look: S(0, 1.4, 8.0), fov: 54 });
  } else {
    const { S } = ctx.store, me = ctx.cast.me;
    stageTick(ctx, { cheer: true });
    micHigh(ctx, me, t);
    ctx.cam.set({ pos: S(0.9, 0.35, 4.9), look: S(0, 1.15, 2.2), fov: 60 });
  }
  ctx.cam.punch(hits, t, 0.1, 0.2);
}

// ── the garden cluster and the moon
function hugArms(d) {
  const J = d.joints;
  J.armL.rotation.set(-2.75, 0, -0.32); J.armR.rotation.set(-2.75, 0, 0.32);
  if (J.foreArmL) { J.foreArmL.rotation.x = -0.35; J.foreArmR.rotation.x = -0.35; }
}
function clusterCenter(d) { d.root.updateMatrixWorld(true); return d.root.localToWorld(V(0, 3.35, 0.25)); }
function bigCluster(ctx, c, r, camPos, t, { s = 0.62, n = 420 } = {}) {
  const P = ctx.props; P.swBig.begin(camPos);
  for (let k = 0; k < n; k++) {
    const u = hash(k * 1.37), v = hash(k * 2.71), rr = r * Math.cbrt(0.35 + 0.65 * hash(k * 4.13));
    const th = u * PI * 2, ph = Math.acos(2 * v - 1);
    const p = V(c.x + rr * Math.sin(ph) * Math.cos(th), c.y + rr * Math.cos(ph) * 0.95 + 0.03 * Math.sin(t * 2 + k), c.z + rr * Math.sin(ph) * Math.sin(th));
    P.swBig.add(p, { s, spin: (hash(k * 7.7) - 0.5) * 1.6, tilt: (hash(k * 9.1) - 0.5) * 0.8 });
  }
  P.swBig.end().setDim(0, 0.35);
}
function moonSetup(ctx) {
  const sk = ctx.set; sk.setMode('night'); sk.showTokens(false); sk.tokens(ctx.t, V(0, 0, 0)); sk.swarm.root.visible = false;
  put(ctx, 'dunmore', V(0, 21, -30), 0);
  ctx.add(ctx.props.swBig.root); ctx.add(ctx.props.swA.root);
}
function moonTick(ctx, cam) {
  const t = ctx.t, d = ctx.cast.dunmore, P = ctx.props, t0 = ctx.time('b25') - 0.1;
  const x = -7 + 3.2 * (t - t0);
  d.root.position.set(x, 20 + 0.3 * (t - t0), -30); d.root.rotation.set(0, 0.25, 0.08 * Math.sin(t));
  d.pose('wave', t, { speed: 1.4 }); d.face('grin', 1.0);
  d.joints.armL.rotation.set(-2.9, 0, -0.1);
  if (!cam) return;
  ctx.cam.set(cam);
  const hL = handPos(d, 'L'); const cc = hL.clone().add(V(0, 1.6, 0));
  bigCluster(ctx, cc, 1.0, cam.pos, t, { s: 0.5, n: 300 });
  P.swA.begin(cam.pos);
  for (let k = 0; k < 6; k++) P.swA.add(cc.clone().add(V(Math.cos(k) * 0.5, -0.8, Math.sin(k) * 0.5)), { from: hL, s: 0.01 });
  P.swA.end();
  fill(ctx, d.root.position.clone().add(V(0, 1.2, 3)), 1.2, '#ffe0a0');
}
