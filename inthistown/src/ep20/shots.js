// In This Town — Episode 20: "Biscuit".  A T-rex the size of a skyscraper has lived at the end of our street for twelve
// years; the town looks after him because his arms are too short.  His hiccups bounce the whole town ten feet into the
// air, so I haul the barbershop mirror up the clock tower and scare them out of him… and he finds out he's not a golden
// retriever.  The town dresses up as dinosaurs so he won't feel weird; Grandma's costume is so good he's scared of Grandma.
// Film contract: SPEC.md §8.  Timeline: episodes/ep20/timeline.json.
//
// Sets: 'town' (buildTown + the ep14 tower top on the clock tower, the water tower, the mountain, box clouds).
// Town-local coordinates (T(ctx)): main street along x (centre z = 0), clock tower at (TX, TZ) = (−51, 1.5), deck y = 16.6,
// Biscuit's spot BIS behind the tower (x −84), the stage (S = frameAt('square.stage'), +z toward the audience).
// Biscuit is added to the SCENE (not the set root) so the town can hop under him (set.root.position.y = hop) while he
// stays put.  Every shot resets the root in town().
import * as THREE from 'three';
import { buildTown } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS, extraSpecs } from '../cast.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { frameAt, lastBefore } from '../shots.js';
import { makeConfetti, makeSweatDrop } from '../props.js';
import { makeMicStand } from '../ep2/props2.js';
import { TOWER, makeTowerTop } from '../ep14/props.js';
import { glowSprite } from '../ep18/props.js';
import { makeSoundRings } from '../ep16/props.js';
import { makeFillerCrowd, makeLadder } from '../ep19/props.js';
import {
  makeBiscuit, makeToothbrush, makeFireTruck, makeWaterTower, makeSplash, makeBus, makeDrips, makeNest, makeLibrary, makeBakery,
  makeChefHat, makeTuba, makeMirror, makeShockRing, makeBoxClouds, makeMountain, makeDinoHood, makeGrandmaSuit, makeArrowSign,
  makeBroom, makeDogBowl, makeHats, makeBubbles, makeSpeech,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;
const TX = TOWER.x, TZ = TOWER.z, DY = TOWER.deck;
const BS = 5;                                  // Biscuit scale (unit model ≈ 11.5 tall standing → ≈ 57 m; sitting ≈ 48 m)
const BIS = { x: -86, z: -14 };                 // his usual spot, behind the clock tower, facing down the street (+x)
const MTN = { x: -250, z: -60, s: 1.35 };      // the big hill behind town
const WT = { x: -124, z: -52 };                // water tower (next to his tail)
const DEBUG = true;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const MORE = Object.fromEntries(Object.values(extraSpecs(10, 207)).map((s, i) => { const id = `y${String(i).padStart(2, '0')}`; return [id, { ...s, id, lod: 'low' }]; }));
const MORE_IDS = Object.keys(MORE);
const SPECIAL = {
  okafor: { id: 'okafor', skin: '#6b4226', hair: { style: 'short', color: '#111111' }, top: { style: 'tee', color: '#3f6fb8', accent: '#ffd23f', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#4a3b2f', accessories: ['mustache', 'cap'], capColor: '#ffd23f', scale: 1.0, build: 1.08 },
  grandpa: { id: 'grandpa', skin: '#f0c8a8', hair: { style: 'grandpa', color: '#f4f4f4' }, top: { style: 'cardigan', color: '#8a6a4a', accent: '#f3e3a5' },
    bottom: { style: 'pants', color: '#55575e' }, shoes: '#4a3b2f', accessories: ['glasses', 'beard'], scale: 0.95 },
  grandma: { id: 'grandma', skin: '#f0c8a8', hair: { style: 'bun', color: '#d8d8d8' }, top: { style: 'cardigan', color: '#8a5cff', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#5a4a6a' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.9 },
  baker: { id: 'baker', skin: '#e0ac69', hair: { style: 'short', color: '#3b2416' }, top: { style: 'tee', color: '#ffffff', accent: '#ff4fa3', emblem: 'heart' },
    bottom: { style: 'pants', color: '#3a3d46' }, shoes: '#1d1d22', accessories: ['mustache'], scale: 1.0, build: 1.15 },
  ff1: { id: 'ff1', skin: '#c68642', hair: { style: 'short', color: '#1a120c' }, top: { style: 'suit', color: '#d8231f', accent: '#ffd23f' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#1a1a1a', accessories: ['cap'], capColor: '#ffd23f', scale: 1.0 },
  ff2: { id: 'ff2', skin: '#f1c7a1', hair: { style: 'bun', color: '#c0392b' }, top: { style: 'suit', color: '#d8231f', accent: '#ffd23f' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#1a1a1a', accessories: ['cap'], capColor: '#ffd23f', scale: 0.96 },
  walker: { id: 'walker', skin: '#ffdbac', hair: { style: 'long', color: '#e8c46a' }, top: { style: 'hoodie', color: '#ff7a2f', accent: '#ffffff', emblem: 'star' },
    bottom: { style: 'shorts', color: '#2f4d8a' }, shoes: '#ffffff', accessories: ['headphones'], scale: 0.97 },
  ...Object.fromEntries([0, 1, 2, 3].map((i) => [`band${i}`, { id: `band${i}`, skin: ['#8d5524', '#f1c7a1', '#e0ac69', '#a86b4a'][i], hair: { style: 'short', color: '#1a120c' },
    top: { style: 'suit', color: '#e8232b', accent: '#ffd23f' }, bottom: { style: 'pants', color: '#f2f2f2' }, shoes: '#1d1d22', accessories: ['cap'], capColor: '#ffffff', scale: 0.98 }])),
  ...Object.fromEntries([0, 1, 2, 3, 4].map((i) => [`kid${i}`, { id: `kid${i}`, skin: ['#ffdbac', '#8d5524', '#e0ac69', '#f4d0b5', '#c68642'][i],
    hair: { style: ['spiky', 'bun', 'curly', 'long', 'afro'][i], color: ['#e8c46a', '#1a120c', '#3b2416', '#c0392b', '#111111'][i] },
    top: { style: 'tee', color: ['#4fb3ff', '#ff4fa3', '#5bd65b', '#ffd23f', '#8a5cff'][i], accent: '#ffffff', emblem: ['star', 'heart', null, 'number', 'stripe'][i] },
    bottom: { style: i === 1 ? 'skirt' : 'shorts', color: '#2f4d8a' }, shoes: '#ffffff', accessories: i === 2 ? ['glasses'] : [], scale: 0.72 }])),
};
export const cast = { me: MAIN.me, mayor: MAIN.mayor, pigeon: MAIN.pigeon, ...SPECIAL, ...EXTRAS, ...MORE };
export const lazySets = true;
export const sets = { town: () => buildTown({ seed: 20, banner: ['SCARE', 'THE', 'HICCUPS'] }) };
const TOWNS = [...EXTRA_IDS, ...MORE_IDS];
const KIDS = ['kid0', 'kid1', 'kid2', 'kid3', 'kid4'];
const BAND = ['band0', 'band1', 'band2', 'band3'];

export function init(ctx) {
  const P = ctx.props;
  P.bis = makeBiscuit();
  P.tower = makeTowerTop();
  // the ep14 tower top carries tape-episode clutter on its deck: hide it
  for (const c of P.tower.children) if ((c.isGroup && Math.abs(c.position.y - DY) < 0.01) || (c.isMesh && Math.abs(c.position.y - (DY + 0.17)) < 0.01)) c.visible = false;
  P.mtn = makeMountain(); P.wt = makeWaterTower(); P.splash = makeSplash(80);
  P.clouds = makeBoxClouds(10, 3);
  P.sign = makeArrowSign(['DINOSAUR', 'PARK']);
  P.brush = makeToothbrush(); P.bubbles = makeBubbles(34);
  P.truck = makeFireTruck();
  P.bus = makeBus(); P.drips = makeDrips(46); P.busDrips = makeDrips(30, { size: 0.2 });
  P.nest = makeNest(); P.library = makeLibrary(); P.bakery = makeBakery(); P.chef = makeChefHat();
  P.tubas = BAND.map(() => makeTuba()); P.rings = BAND.map(() => makeSoundRings(4));
  P.mic = makeMicStand({ height: 1.5 });
  P.mirror = makeMirror(); P.ring = makeShockRing(); P.ring2 = makeShockRing();
  P.hoods = Array.from({ length: 22 }, (_, i) => makeDinoHood(['#5fcf4e', '#4fbf6a', '#7ad04a', '#3fae4e'][i % 4]));
  P.suit = makeGrandmaSuit();
  P.brooms = [makeBroom(), makeBroom(), makeBroom()];
  P.ladders = [makeLadder(3.6, 0.6), makeLadder(3.6, 0.6)];
  P.climbLadder = makeLadder(17.6);
  P.bowl = makeDogBowl();
  P.hats = makeHats(24);
  P.filler = makeFillerCrowd(260);
  P.speech = makeSpeech('WALK?', { w: 2.2 });
  P.boo = makeSpeech('boo.', { w: 1.3 });
  P.confetti = makeConfetti({ count: 260, size: 9, speed: 16, spread: 1.0, groundY: -30, seed: 4 });
  P.sweat = makeSweatDrop({ size: 0.16 });
  P.podium = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.1), new THREE.MeshStandardMaterial({ color: '#b07a44', roughness: 0.85 })); P.podium.geometry.translate(0, 0.3, 0); P.podium.castShadow = true;
  P.itch = new THREE.Group();
  { const dot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), new THREE.MeshStandardMaterial({ color: '#ff5a6a', roughness: 0.6 })); dot.scale.set(1, 1, 0.4); P.itch.add(dot);
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.04), new THREE.MeshBasicMaterial({ color: '#e8232b' })); const a = i / 4 * PI * 2 + 0.4; l.position.set(Math.cos(a) * 0.52, Math.sin(a) * 0.52, 0); l.rotation.z = a - PI / 2; P.itch.add(l); } }
  P.tailTip = new THREE.Group();
  { const m = new THREE.MeshStandardMaterial({ color: '#5fcf4e', roughness: 0.65 }), sp = new THREE.MeshStandardMaterial({ color: '#ff9a2a' });
    let p = P.tailTip; for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.position.y = i ? 1.3 : 0; p.add(g); const w = 1.6 - i * 0.32; const b = new THREE.Mesh(new THREE.BoxGeometry(w, 1.45, w), m); b.position.y = 0.7; g.add(b); const c = new THREE.Mesh(new THREE.ConeGeometry(w * 0.22, w * 0.5, 4), sp); c.position.set(0, 0.7, -w * 0.55); c.rotation.x = -PI / 2; g.add(c); p = g; } }
  P.glow = glowSprite('#ff2a1a', 1.2, 0.9); P.glow2 = glowSprite('#ff2a1a', 1.2, 0.9);
  P.fill = new THREE.PointLight('#fff2e0', 5, 12, 1.4);
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
/** Town-local → world, snapshotted (the root may hop later in the frame). */
function T(ctx) { const r = ctx.set.root; r.updateMatrixWorld(true); const M = r.matrixWorld.clone(); const f = (x, y, z) => V(x, y, z).applyMatrix4(M); f.yaw = yawOf(r); f.M = M; return f; }
function put(ctx, id, p, yaw) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); return ctx.cast[id]; }
function addTo(ctx, obj, x, y, z, ry = 0) { ctx.add(obj, ctx.set.root); obj.position.set(x, y, z); obj.rotation.set(0, ry, 0); return obj; }
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.17, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale || 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.26, size: 150, fill: '#ffe14a', stroke: '#000000', line: 12, rot: -0.1, alpha: clamp(d / 0.06, 0, 1), ...o, scale: s * (o.scale || 1) });
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headPt(ch, x = 0, y = 0.3, z = 0) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(x, y, z)); }
const iris = (ctx, t0, cy = 0.45, dur = 0.45) => { const k = clamp((ctx.t - t0) / dur, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, PI * 2, true); g.fill('evenodd'); g.restore(); }); };
function fill(ctx, pos, k = 1, color = '#fff2e0') { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0) { const c = camLerp(a, b, clamp(u, 0, 1)); ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k); return c; }
function setCam(ctx, c, k = 0) { ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k); return c; }
function flash(ctx, t0, dur = 0.25, color = '#ffffff', a = 0.9) { const d = ctx.t - t0; if (d >= 0 && d < dur) ctx.fx.overlay(color, a * (1 - d / dur)); }
function hitPulse(times, t, decay = 0.2) { let p = 0; for (const h of times) if (t >= h) p = Math.max(p, Math.exp(-(t - h) / decay)); return p; }
/** parabolic hops: sum of bumps of height amp lasting dur after each hit time */
function hop(t, hits, amp = 3, dur = 0.55) { let y = 0; for (const h of hits) { const u = (t - h) / dur; if (u > 0 && u < 1) y = Math.max(y, amp * 4 * u * (1 - u)); } return y; }
function shakeOn(ctx, hits, amt = 0.6, dur = 0.35, seed = 7) { for (const h of hits) { const d = ctx.t - h; if (d >= 0 && d < dur) ctx.cam.shake(amt * (1 - d / dur), ctx.t, seed); } }
const dbg = (ctx, lines) => { if (DEBUG) ctx.fx.text(lines.join('\n'), { x: 0.5, y: 0.75, size: 34, fill: '#ffff00', stroke: '#000000' }); };
/** a look point between two targets by ANGLE (w 0 → a, 1 → b) as seen from pos */
function lookMix(pos, a, b, w) { const da = a.clone().sub(pos).normalize(), db = b.clone().sub(pos).normalize(); return pos.clone().add(da.lerp(db, w).normalize().multiplyScalar(10)); }
const fwdOf = (ch) => { ch.root.updateMatrixWorld(true); const q = new THREE.Quaternion(); ch.root.getWorldQuaternion(q); const f = V(0, 0, 1).applyQuaternion(q); f.y = 0; return f.normalize(); };
/** Biscuit's eyes, framed straight on from dist m in front (2 m above eye level), eyes at screen y ≈ ey */
function eyeCam(ctx, dist, { fov = 44, side = 0, dy = 2, drop = 5 } = {}) {
  const e = eyeMid(ctx), fw = bisFwd(ctx), sd = V(-fw.z, 0, fw.x);
  return { pos: e.clone().addScaledVector(fw, dist).addScaledVector(sd, side).add(up(dy)), look: e.clone().add(up(-drop)), fov };
}
/** lift Biscuit so his eyes just clear the mountain peak as seen from camPos (extra m above the sight line) */
function peekOver(ctx, camPos, extra) {
  const L = ctx.store.L, b = ctx.props.bis, peak = L(MTN.x, MTN.s * 66, MTN.z);
  const e = eyeMid(ctx), dP = Math.hypot(peak.x - camPos.x, peak.z - camPos.z), dE = Math.hypot(e.x - camPos.x, e.z - camPos.z);
  const want = camPos.y + (peak.y - camPos.y) * dE / dP + extra;
  b.position.y += want - e.y; b.updateMatrixWorld(true);
}
const f1 = (v) => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
/** Solve a camera at pos so world point A lands at screen (x, yA) and B at (x, yB) (0 = top, 1 = bottom), portrait 9:16.
 *  Returns { pos, look, fov }.  Horizontal: the mean of A and B is put at screen x. */
const _fc = new THREE.PerspectiveCamera(50, 9 / 16, 0.1, 5000);
function frame2(pos, A, yA, B, yB, { x = 0.5, fovMin = 18, fovMax = 78 } = {}) {
  const c = _fc; c.position.copy(pos); c.rotation.order = 'YXZ';
  const mid = A.clone().add(B).multiplyScalar(0.5).sub(pos);
  let yw = Math.atan2(-mid.x, -mid.z), p = Math.atan2(mid.y, Math.hypot(mid.x, mid.z)), fov = 50;
  const pa = V(), pb = V();
  for (let it = 0; it < 60; it++) {
    c.fov = fov; c.updateProjectionMatrix(); c.rotation.set(p, yw, 0); c.updateMatrixWorld(true);
    pa.copy(A).project(c); pb.copy(B).project(c);
    const ay = (1 - pa.y) / 2, by = (1 - pb.y) / 2, ax = ((pa.x + pb.x) / 2 + 1) / 2;
    const fr = fov * PI / 180;
    p -= (((ay + by) / 2) - (yA + yB) / 2) * fr * 0.9;
    yw -= (ax - x) * fr * 0.56 * 0.9;
    const sep = Math.abs(by - ay), want = Math.max(0.02, Math.abs(yB - yA));
    if (sep > 1e-4) fov = clamp(fov * Math.pow(sep / want, 0.6), fovMin, fovMax);
  }
  const d = V(0, 0, -1).applyEuler(new THREE.Euler(p, yw, 0, 'YXZ'));
  return { pos: pos.clone(), look: pos.clone().addScaledVector(d, 10), fov };
}
/** midpoint of Biscuit's two googly eyes (world) */
const eyeMid = (ctx) => { const u = ctx.props.bis.userData; return u.eyeWorld('L').add(u.eyeWorld('R')).multiplyScalar(0.5); };
/** Biscuit's horizontal forward (world) */
function bisFwd(ctx) { const b = ctx.props.bis; b.updateMatrixWorld(true); const q = new THREE.Quaternion(); b.getWorldQuaternion(q); const f = V(0, 0, 1).applyQuaternion(q); f.y = 0; return f.normalize(); }
/** a point ~k up Biscuit's torso (world), follows tumbles */
const bTorso = (ctx, y = 2.0) => { const b = ctx.props.bis; b.updateMatrixWorld(true); return b.userData.parts.torso.localToWorld(V(0, y, 0.5)); };
/** world → town-local */
function toLocal(L, w) { return w.clone().applyMatrix4(L.M.clone().invert()); }
/** warm, filmic flashback treatment: sepia wash, heavy vignette, soft rounded film frame with sprocket ticks + scratches */
function flashFx(ctx) {
  ctx.fx.overlay('#d08a3a', 0.34); ctx.fx.vignette(0.85);
  const t = ctx.t;
  ctx.fx.draw((g, W, H) => {
    g.save();
    const m = W * 0.045, r = W * 0.07;
    g.fillStyle = 'rgba(40,22,8,0.92)'; g.beginPath(); g.rect(0, 0, W, H); g.roundRect(m, m * 1.6, W - 2 * m, H - 3.2 * m, r); g.fill('evenodd');
    g.fillStyle = 'rgba(255,230,180,0.55)';
    for (let y = m * 2.2; y < H - m * 2; y += m * 1.5) { g.fillRect(m * 0.25, y, m * 0.45, m * 0.7); g.fillRect(W - m * 0.7, y, m * 0.45, m * 0.7); }
    g.strokeStyle = 'rgba(255,240,210,0.35)'; g.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const x = W * hash(Math.floor(t * 12) * 3.1 + i * 7.7); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, H); g.stroke(); }
    g.restore();
  });
}
/** quote card with a narrow wrap (two short lines), placed over sky */
function quoteCard2(ctx, lines, by, t0, t1, { y = 0.22, size = 96, byAt = null } = {}) {
  const t = ctx.t; if (t < t0 || t > t1) return false;
  const d = t - t0, out = t1 - t, a = clamp(Math.min(d / 0.12, out / 0.12), 0, 1);
  ctx.fx.overlay('#000000', 0.5 * a); ctx.fx.vignette(0.5 * a);
  const pop = d < 0.2 ? ease.outBack(clamp(d / 0.2, 0, 1)) : 1, nl = lines.split('\n').length;
  ctx.fx.text(lines, { y, size, font: 'narr', fill: '#ffffff', stroke: '#000000', line: 12, scale: 0.6 + 0.4 * pop, alpha: a, rot: -0.02 });
  if (by) ctx.fx.text(`— ${by}`, { y: y + (nl * 0.5 + 0.7) * size * 1.05 / 1920, size: size * 0.62, font: 'narr', fill: '#ffe14a', stroke: '#000000', line: 8, alpha: clamp((byAt != null ? t - byAt : d - 0.25) / 0.12, 0, 1) * a, rot: -0.02 });
  ctx.caption.hide(true);
  return true;
}

// ─── town base (lighting, permanent set dressing)
function town(ctx, { light = 'day', clouds = true, cloudAt = [-10, 30, 30], sign = false, wt = true, wtTip = 0, mtn = true } = {}) {
  const s = ctx.set, P = ctx.props;
  if (P.rootY0 == null) P.rootY0 = s.root.position.y;
  s.root.position.y = P.rootY0; s.root.updateMatrixWorld(true);
  s.setLighting(light); s.set('partyProps', false); s.set('fireworks', false); s.set('foam', 0);
  s.set('windowGlow', light === 'day' ? 0 : 0.8); s.set('standsCrowd', false);
  s.exposure = light === 'dusk' ? 1.05 : 1.0;
  if (s.fog) { s.fog.near = light === 'dusk' ? 70 : 80; s.fog.far = light === 'dusk' ? 320 : 360; }
  const L = T(ctx);
  addTo(ctx, P.tower, TX, 0, TZ);
  if (mtn) { addTo(ctx, P.mtn, MTN.x, 0, MTN.z, 0.3); P.mtn.scale.setScalar(MTN.s); }
  if (wt) { addTo(ctx, P.wt, WT.x, 0, WT.z, PI / 2); P.wt.userData.set(wtTip); }
  if (clouds) { addTo(ctx, P.clouds, cloudAt[0], cloudAt[1], cloudAt[2]); P.clouds.userData.set(ctx.t, 0); }
  P.bis.userData.parts.tongue.scale.set(1, 1, 1); P.bis.userData.parts.tagG.position.z = 1.66;
  if (sign) addTo(ctx, P.sign, -37.5, 0, 15.5, PI / 2 - 0.5);
  ctx.store.L = L;
  return L;
}
function hopTown(ctx, y) { const s = ctx.set; s.root.position.y = ctx.props.rootY0 + y; s.root.updateMatrixWorld(true); }
/** Biscuit into the scene at town-local (x, z), facing yaw (0 = +z; π/2 = down the street, +x).  Returns B(x,y,z) model → world. */
function bisAt(ctx, x, z, yaw = PI / 2, { y = 0, s = BS, tumble = 0 } = {}) {
  const L = ctx.store.L || T(ctx), b = ctx.props.bis;
  ctx.add(b); b.position.copy(L(x, y, z)); b.rotation.order = 'YXZ'; b.rotation.set(tumble, L.yaw + yaw, 0); b.scale.setScalar(s);
  b.updateMatrixWorld(true);
  const M = b.matrixWorld.clone(); const B = (mx, my, mz) => V(mx, my, mz).applyMatrix4(M);
  ctx.store.B = B; return B;
}
const bset = (ctx, o = {}, t = ctx.t) => ctx.props.bis.userData.set(t, o);
const bHead = (ctx, x = 0, y = 0.9, z = 1.8) => ctx.props.bis.userData.headWorld(x, y, z);
/** filler crowd layouts (town-local) */
function fillList(pts) { return pts; }
function streetFill(x0, x1, { zs = [-6.3, -5.6, 5.6, 6.3], step = 1.6, seed = 3, yaw = null, jitter = 0.4 } = {}) {
  const out = []; let k = 0;
  for (let x = x0; x <= x1; x += step) for (const z of zs) { out.push({ x: x + (hash(k * 1.3 + seed) - 0.5) * jitter * 2, z: z + (hash(k * 2.9 + seed) - 0.5) * jitter, yaw: yaw != null ? yaw + (hash(k * 4.1) - 0.5) * 0.8 : (z < 0 ? 0 : PI) + (hash(k * 4.1) - 0.5) * 0.9, k, s: 0.88 + 0.22 * hash(k * 5.7) }); k++; }
  return out;
}
function ringFill(cx, cz, r0, r1, n, { seed = 5, face = 'in', a0 = 0, a1 = PI * 2, tx = null, tz = null } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * hash(i * 1.37 + seed), r = r0 + (r1 - r0) * Math.sqrt(hash(i * 2.71 + seed));
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    const fx = tx ?? cx, fz = tz ?? cz;
    out.push({ x, z, yaw: Math.atan2(fx - x, fz - z) + (face === 'in' ? 0 : PI) + (hash(i * 4.4) - 0.5) * 0.6, k: i, s: 0.88 + 0.22 * hash(i * 3.3) });
  }
  return out;
}
function filler(ctx, list) { const f = ctx.props.filler; ctx.add(f, ctx.set.root); f.position.set(0, 0, 0); f.userData.layout(list); return f; }
/** real characters in a loose grid (town-local), all facing yaw (town-local). Returns list for animCrowd. */
function crowd(ctx, ids, cx, cz, { cols = 4, dx = 1.2, dz = 1.2, yaw = 0, seed = 1, jitter = 0.25, faceTo = null } = {}) {
  const L = ctx.store.L;
  return ids.map((id, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const x = cx + (c - (cols - 1) / 2) * dx + (hash(i * 3.1 + seed) - 0.5) * jitter * 2 + (r % 2 ? dx * 0.5 : 0);
    const z = cz + r * dz + (hash(i * 5.3 + seed) - 0.5) * jitter * 2;
    let yw = yaw;
    if (faceTo) yw = Math.atan2(faceTo[0] - x, faceTo[1] - z);
    const ch = put(ctx, id, L(x, 0, z), L.yaw + yw + (hash(i * 7.7 + seed) - 0.5) * 0.3);
    return { ch, id, k: i, ph: hash(i * 1.9 + seed) * 3, x, z };
  });
}
function animCrowd(list, t, act = 'idle', face = 'smile', params = {}) {
  for (const c of list) {
    const a = typeof act === 'function' ? act(c) : act, f = typeof face === 'function' ? face(c) : face;
    c.ch.pose(a, t + c.ph, { ...params });
    c.ch.face(f, t + c.ph);
  }
}
/** look up at something: head pitch toward a world point */
function lookUp(ch, p) { ch.root.updateMatrixWorld(true); return p; }
/** tiny dinosaur arms: elbows tucked, hands at the chest, wiggling */
function dinoArms(ch, t, k = 1) {
  const J = ch.joints;
  for (const s of ['L', 'R']) {
    const w = Math.sin(t * 10 + (s === 'L' ? 0 : 1.3));
    J['arm' + s].rotation.set(-0.35 * k + 0.1 * w * k, 0, (s === 'L' ? 0.12 : -0.12) * k);
    J['foreArm' + s].rotation.set(-1.95 * k + 0.25 * w * k, 0, 0);
  }
}
/** climbing a ladder (in place: the shot moves the root up) */
function climbPose(ch, t, speed = 2.4) {
  ch.pose('idle', t, { intensity: 0.2 });
  const J = ch.joints, w = Math.sin(t * speed * PI);
  J.armL.rotation.set(-2.7 + 0.35 * w, 0, 0.15); J.armR.rotation.set(-2.7 - 0.35 * w, 0, -0.15);
  J.foreArmL.rotation.set(-0.3, 0, 0); J.foreArmR.rotation.set(-0.3, 0, 0);
  J.legL.rotation.set(-0.7 * Math.max(0, w) - 0.1, 0, 0); J.legR.rotation.set(-0.7 * Math.max(0, -w) - 0.1, 0, 0);
  if (J.shinL) { J.shinL.rotation.set(1.1 * Math.max(0, w) + 0.1, 0, 0); J.shinR.rotation.set(1.1 * Math.max(0, -w) + 0.1, 0, 0); }
  J.head.rotation.x += 0.1;
}
/** holding something up over the head with both hands */
function holdUp(ch, t, k = 1, wob = 0) {
  const J = ch.joints, w = wob * Math.sin(t * 13);
  J.armL.rotation.set(-2.5 * k + w * 0.1, 0, 0.25 * k); J.armR.rotation.set(-2.5 * k - w * 0.1, 0, -0.25 * k);
  J.foreArmL.rotation.set(-0.5 * k, 0, 0); J.foreArmR.rotation.set(-0.5 * k, 0, 0);
}
/** cup hands round the mouth and yell */
function yellPose(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints;
  J.torso.rotation.x += -0.12 * k;
  J.armL.rotation.set(-1.25 * k, 0, -0.55 * k); J.armR.rotation.set(-1.25 * k, 0, 0.55 * k);
  J.foreArmL.rotation.set(-1.6 * k, 0, 0); J.foreArmR.rotation.set(-1.6 * k, 0, 0);
  J.head.rotation.x += -0.3 * k;
}
const SKY_HIT = (ctx) => ctx.hussTimes;

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
const H = (beat, i) => (i === 0 ? `${beat}.h0-0.12` : `${beat}.h${i}-0.03`);
export const shots = [
  // ── b01 "In this town, a T-rex the size of a skyscraper lives at the end of my street."  wave → tilt up to Biscuit
  {
    name: 'tilt up to biscuit', start: 0, set: 'town',
    setup(ctx) {
      const L = town(ctx, { cloudAt: [-10, 34, 40] });
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      put(ctx, 'me', L(-24, 0.0, 1.2), L.yaw + PI / 2 - 0.25);
      filler(ctx, streetFill(-36, 10, { seed: 2, step: 2.6 }));
      const ids = ['x00', 'x01', 'x02', 'x03'];
      ctx.store.walkers = ids.map((id, i) => put(ctx, id, L(-14 + i * 4, 0.12, i % 2 ? 6.0 : -6.0), L.yaw + (i % 2 ? PI : 0)));
    },
    update(ctx, lt) {
      const { L, walkers } = ctx.store, me = ctx.cast.me, t = ctx.t;
      bset(ctx, { sit: 1, wag: 0.4, lean: 0.35, headPitch: 0.3, lookX: 0.1, lookY: -0.6, tongue: 0.25, jaw: 0.12 });
      me.pose('wave', t); me.face('grin', t);
      walkers.forEach((w, i) => { w.root.position.copy(L(-14 + i * 4 + ((t * 0.9 * (i % 2 ? -1 : 1)) % 6), 0.12, i % 2 ? 6.2 : -6.2)); w.pose('walk', t + i); w.face('smile', t + i); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.2 });
      const face = humanFace(me), head = eyeMid(ctx);
      const k = ease.inOutCubic(clamp((t - 1.15) / 2.6, 0, 1));
      const c0 = { pos: L(-20.6, 2.0, 2.2), look: face.clone().add(up(-0.25)), fov: 28 };
      const c1 = frame2(L(-11, 0.8, 4.4), face, 0.84, head, 0.2);
      moveCam(ctx, c0, c1, k);
      shakeOn(ctx, [ctx.time('b01.w4'), ctx.time('b01.w9')], 0.25, 0.3); shakeOn(ctx, [ctx.time('b01.w16')], 0.5, 0.4);
      tag(ctx, 'IN THIS TOWN', 0.25, 2.2, { y: 0.15, size: 80, bg: 'rgba(200,0,40,0.9)' });
      dbg(ctx, ['head ' + f1(head)]);
    },
  },
  // ── b02 "His name is Biscuit."  hero close-up on the face + collar tag
  {
    name: 'name tag', start: 'b02-0.1', set: 'town',
    setup(ctx) { town(ctx, { cloudAt: [-10, 34, 40] }); bisAt(ctx, BIS.x, BIS.z, PI / 2); ctx.props.bis.userData.parts.tagG.position.z = 1.95; },
    update(ctx, lt) {
      const { B } = ctx.store, t = ctx.t;
      bset(ctx, { sit: 1, wag: 0.6, headPitch: 0.05, headTilt: 0.18 * Math.sin(lt * 1.4), tongue: 0.35, jaw: 0.18, lookX: 0, lookY: -0.4 });
      const tagP = ctx.props.bis.userData.parts.tagG.getWorldPosition(V()), eyes = eyeMid(ctx);
      moveCam(ctx, frame2(B(1.2, 7.0, 15), eyes, 0.26, tagP, 0.78), frame2(B(0.9, 7.1, 13.5), eyes, 0.24, tagP, 0.8), lt / 1.5);
      tag(ctx, 'BISCUIT: 300 FT.  AGE: UNKNOWN', ctx.time('b02.w3') - 0.05, Infinity, { y: 0.14, size: 54 });
    },
  },
  // ── b02 "Twelve years ago, he walked out of the dinosaur park, sat down, and never left."
  {
    name: 'walked out of the park', start: 'b02.w4-0.05', set: 'town',
    setup(ctx) {
      const L = town(ctx, { sign: true });
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      ctx.store.peek = crowd(ctx, ['x04', 'x05', 'x06', 'x07', 'x08'], -35.2, 16.6, { cols: 5, dx: 1.25, dz: 0.3, faceTo: [-24, 30] });
      filler(ctx, streetFill(-38, -10, { seed: 5, step: 2.2 }));
    },
    update(ctx, lt) {
      const { L, peek } = ctx.store, t = ctx.t, b = ctx.props.bis;
      const tSat = ctx.time('b02.w14'), tNever = ctx.time('b02.w17');
      const kWalk = clamp((t - ctx.time('b02.w8') + 0.3) / (tSat - ctx.time('b02.w8') + 0.1), 0, 1);
      const x = lerp(-175, BIS.x, ease.outCubic(kWalk));
      b.position.copy(L(x, 0, BIS.z));
      const sit = ease.inOutCubic(clamp((t - tSat + 0.35) / 0.4, 0, 1));
      bset(ctx, { sit, walk: kWalk < 1 ? 0.75 : 0, wag: 0.5, tongue: 0.3, jaw: 0.15, lookY: -0.2 });
      const hits = [tSat + 0.05, tNever];
      const y = hop(t, hits, 1.4, 0.4); hopTown(ctx, y);
      peek.forEach((c, i) => { c.ch.root.position.y = L(0, 0, 0).y + hop(t, hits, 1.6 + 0.2 * i, 0.45); c.ch.pose(t > tSat ? 'surprised' : 'idle', t + c.ph); c.ch.face(t > tSat ? 'shocked' : 'neutral', t + c.ph); });
      ctx.props.filler.userData.set(t, { arms: t > tSat ? 'up' : 'limp', bounce: t > tSat ? 1 : 0.2 });
      const pk = humanFace(peek[2].ch), e = eyeMid(ctx), u = clamp(lt / 4, 0, 1);
      setCam(ctx, frame2(L(lerp(-29, -30.5, u), 1.6 + y, lerp(22.5, 21.5, u)), pk, 0.76, e, 0.16));
      shakeOn(ctx, hits, 0.8, 0.45);
      ctx.fx.overlay('#ffb347', 0.12); ctx.fx.vignette(0.35);
      tag(ctx, '12 YEARS AGO', lt > 0 ? ctx.time('b02.w4') : 0, ctx.time('b02.w13'), { y: 0.14, size: 58, bg: 'rgba(120,70,20,0.85)' });
    },
  },
  // ── b03 HUSS ×3 — the kid slams in the street, Biscuit's head leans down curiously behind him
  ...[0, 1, 2].map((i) => ({
    name: `huss street #${i + 1}`, start: H('b03', i), set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, -98, -11, PI / 2);
      put(ctx, 'me', L(-38, 0, 0), L.yaw + PI / 2);
      filler(ctx, streetFill(-34, -6, { seed: 8, step: 2.0 }));
    },
    update(ctx) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      bset(ctx, { sit: 1, lean: 1, bodyLean: 0.7, headPitch: -1.0, headTilt: 0.35 + 0.1 * i, lookY: -0.7, lookX: 0, wag: 0.3, jaw: 0.1 });
      me.pose('slam', t, { hits }); me.face('huss', t);
      ctx.props.filler.userData.set(t, { arms: 'up' });
      const f = humanFace(me), e = eyeMid(ctx);
      const P0 = L(-34.6, 0.35, 0.9), P1 = L(-34.5, 1.0, -2.8), P2 = L(-35.2, 1.3, 1.6);
      const cams = [frame2(P0, f, 0.37, e, 0.12), frame2(P1, f, 0.4, e, 0.12), frame2(P2, f, 0.34, e, 0.1)];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.1, 0.2);
      dbg(ctx, ['eyes ' + f1(toLocal(L, e)), 'face ' + f1(toLocal(L, f)), 'cam ' + f1(toLocal(L, cams[i].pos)) + ' fov ' + cams[i].fov.toFixed(1), 'look ' + f1(toLocal(L, cams[i].look))]);
    },
  })),
  // ── b04 "His arms are way too short,"  — tiny arms can't reach the itch
  {
    name: 'tiny arms', start: 'b04-0.1', set: 'town',
    setup(ctx) { town(ctx); const B = bisAt(ctx, BIS.x, BIS.z, PI / 2); const it = ctx.props.itch; ctx.add(it, ctx.props.bis.userData.parts.torso); it.position.set(0.0, 2.5, 1.92); it.scale.setScalar(2.0); },
    update(ctx, lt) {
      const { B } = ctx.store, t = ctx.t;
      // strain toward the itch: arms reach down/in, wiggle fast (t scaled), cross brows, gritted teeth
      bset(ctx, { sit: 1, arms: 1.6, armsUp: 0.15 + 0.1 * Math.sin(t * 7), headPitch: 0.1, headYaw: -0.35, lookY: -1, lookX: 0.3, brow: 0.9, wag: 0.2, jaw: 0.12, lid: 0.25, headTilt: 0.12 * Math.sin(t * 5) }, t * 1.8);
      ctx.props.itch.scale.setScalar(2.0 * (1 + 0.15 * Math.sin(t * 14)));
      const tor = ctx.props.bis.userData.parts.torso.localToWorld(V(0, 2.3, 1.6)), e = eyeMid(ctx);
      const itP = ctx.props.itch.getWorldPosition(V());
      moveCam(ctx, frame2(B(5.2, 7.4, 11.6), e, 0.2, itP, 0.72), frame2(B(4.8, 7.4, 10.5), e, 0.2, itP, 0.7), lt / 1.4);
      tag(ctx, 'TOO SHORT', ctx.time('b04.w5'), Infinity, { y: 0.16, size: 80, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── "…so the whole town takes care of him."  — the crowd below, looking up, brooms and ladders
  {
    name: 'town takes care', start: 'b04.w6-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      const ids = ['x09', 'x10', 'x11', 'x12', 'x13', 'x14', 'x15', 'x16'];
      ctx.store.cr = crowd(ctx, ids, -44, -2.2, { cols: 4, dx: 1.6, dz: 1.5, faceTo: [-30, 4] });
      const P = ctx.props, cr = ctx.store.cr;
      [0, 3, 6].forEach((k, j) => { const br = P.brooms[j]; ctx.add(br, cr[k].ch.joints.handR); br.position.set(0, -0.35, 0.05); br.rotation.set(0.2, 0, 0); });
      [[1, 0], [5, 1]].forEach(([k, j]) => { const ld = P.ladders[j]; ctx.add(ld, cr[k].ch.joints.torso); ld.position.set(0.0, -0.6, -0.3); ld.rotation.set(-0.25, 0, 0.1); });
      filler(ctx, streetFill(-40, -14, { seed: 3, step: 1.8, zs: [-7.2, -6.4, -5.6, 5.6, 6.4] }));
    },
    update(ctx, lt) {
      const { L, cr } = ctx.store, t = ctx.t;
      bset(ctx, { sit: 1, lean: 0.9, bodyLean: 0.25, headPitch: -0.5, arms: 0.7, wag: 0.6, lookY: -0.9, lookX: 0.1, tongue: 0.6, jaw: 0.3, headTilt: 0.2 });
      cr.forEach((c) => { c.ch.pose(c.k % 3 === 2 ? 'wave' : c.k % 3 ? 'cheer' : 'idle', t + c.ph, { intensity: 0.6 }); c.ch.face(c.k % 2 ? 'grin' : 'smile', t + c.ph); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.15 });
      const head = eyeMid(ctx), mid = L(-44, 1.4, -1.5);
      const p0 = L(-34, 0.8, 3.2), p1 = L(-35, 0.85, 2.8);
      moveCam(ctx, frame2(p0, mid, 0.74, head, 0.18), frame2(p1, mid, 0.74, head, 0.18), lt / 1.8);
    },
  },
  // ── b05 "Mr. Okafor brushes his teeth with a street sweeper."  — jaw like a garage door, Okafor on the tongue
  {
    name: 'toothbrush', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, -84, -7, PI / 2);
      put(ctx, 'okafor', L(0, 0, 0), 0);
      const P = ctx.props; ctx.add(P.brush, ctx.cast.okafor.root); P.brush.rotation.order = 'ZYX'; P.brush.scale.setScalar(0.62);
      ctx.add(P.bubbles);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, b = ctx.props.bis, P = ctx.props;
      const open = ease.inOutCubic(clamp((t - ctx.time('b05') + 0.05) / 0.7, 0, 1));
      bset(ctx, { sit: 1, lean: 0.3, headPitch: -1.0 * open, jaw: 1.0 * open, lid: 0.7, wag: 0.3, lookY: -0.6 });
      b.userData.parts.tongue.scale.set(1, 1, 0.72);              // tongue pulled back so Okafor can stand behind the front teeth
      const jaw = b.userData.parts.jaw; b.updateMatrixWorld(true);
      const ok = ctx.cast.okafor;
      // stand on the jaw floor just behind the front teeth, the lower tooth (jaw x 0.4, z 3.75) at his front-left
      const feet = jaw.localToWorld(V(0.18, -0.01, 3.28));
      ok.root.position.copy(feet);
      const q = new THREE.Quaternion(); jaw.getWorldQuaternion(q);
      ok.root.quaternion.copy(q); ok.root.rotateY(0.25);
      ok.pose('idle', t, { intensity: 0.3 }); ok.face(t > ctx.time('b05.w2') ? 'determined' : 'grin', t);
      const J = ok.joints, sc = Math.sin(t * 13);
      J.armR.rotation.set(-1.35, 0, 0.35 + 0.18 * sc); J.foreArmR.rotation.set(-0.5, 0, 0);
      J.armL.rotation.set(-1.25, 0, -0.1 + 0.18 * sc); J.foreArmL.rotation.set(-0.7, 0, 0);
      J.torso.rotation.y += 0.12 * sc;
      // the brush, handle pointing forward, bristle head laid on its side against the tooth, scrubbing
      P.brush.position.set(0.25 + 0.22 * sc, 1.0, 0.25); P.brush.rotation.set(PI / 2 - 0.12, 0, PI / 2);
      const toothP = jaw.localToWorld(V(0.4, 0.2, 3.75));
      P.bubbles.position.copy(toothP); P.bubbles.userData.set(t, open);
      const inMouth = jaw.localToWorld(V(0.2, 0.8, 2.6));
      const fwd = L(1, 0, 0).sub(L(0, 0, 0)), side = L(0, 0, 1).sub(L(0, 0, 0));
      const tip = jaw.localToWorld(V(0, 0.5, 4.2));
      const mid = feet.clone().lerp(toothP, 0.5).add(up(0.6));
      const c0 = { pos: tip.clone().addScaledVector(fwd, 16).add(up(5)), look: inMouth, fov: 50 };
      const c1 = { pos: mid.clone().addScaledVector(fwd, 6.2).addScaledVector(side, 2.6).add(up(0.7)), look: mid, fov: 46 };
      moveCam(ctx, c0, c1, ease.inOutSine(clamp(lt / 2.6, 0, 1)));
      tag(ctx, 'DENTAL HYGIENE', ctx.time('b05.w7'), Infinity, { y: 0.15, size: 60, bg: 'rgba(40,120,220,0.9)' });
      dbg(ctx, ['feet ' + f1(feet)]);
    },
  },
  // ── "Firefighters scratch his back with a ladder."  — fire truck, ladder raised, the leg thumps like a happy dog
  {
    name: 'back scratch', start: 'fire-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      const P = ctx.props; addTo(ctx, P.truck, BIS.x - 11, 0, BIS.z + 16, PI);
      put(ctx, 'ff1', L(BIS.x - 7.5, 0, BIS.z + 18), L.yaw + 0.5); put(ctx, 'ff2', L(BIS.x - 14.5, 0, BIS.z + 19), L.yaw - 0.4);
    },
    update(ctx, lt) {
      const { L, B } = ctx.store, t = ctx.t, P = ctx.props;
      const t0 = ctx.time('b05.w10');
      bset(ctx, { sit: 1, thump: t > t0 - 0.2 ? 2.4 : 0.4, thumpT0: t0, lid: 1, tongue: 1, jaw: 0.45, wag: 0.8, wagSpeed: 9, headTilt: 0.3, headPitch: 0.35, headYaw: -0.6, lookY: 0.4 });
      P.truck.userData.set({ yaw: 0, raise: 0.87, extend: 0.8, t, scrub: 1 });
      ['ff1', 'ff2'].forEach((id, i) => { const c = ctx.cast[id]; c.pose(i ? 'point' : 'cheer', t + i); c.face('grin', t + i); });
      const e = eyeMid(ctx), gnd = L(BIS.x - 8, 0, BIS.z + 14);
      moveCam(ctx, frame2(L(BIS.x + 40, 13, BIS.z + 44), e, 0.2, gnd, 0.86), frame2(L(BIS.x + 37, 13, BIS.z + 41), e, 0.2, gnd, 0.86), lt / 2.2);
      const hits = []; for (let k = 0; k < 8; k++) hits.push(t0 + k / 2.6);
      shakeOn(ctx, hits.filter((h) => h > t0 - 0.01), 0.25, 0.2);
      tag(ctx, 'THUMP THUMP THUMP', t0 + 0.05, Infinity, { y: 0.15, size: 58, bg: 'rgba(200,40,30,0.9)' });
    },
  },
  // ── b06 "Every time somebody says walk,"
  {
    name: 'says walk', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      put(ctx, 'walker', L(-26, 0, 0.5), L.yaw + 1.6);
      const sp = ctx.props.speech; ctx.add(sp);
      filler(ctx, streetFill(-40, -4, { seed: 31, step: 2.4 }));
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, w = ctx.cast.walker, tw = ctx.time('b06.w4');
      const happy = t > tw + 0.12;
      bset(ctx, happy ? { sit: 1, lean: 0.5, headPitch: 0.35, eyeScale: 1.15, pupil: 1.25, tongue: 1, jaw: 0.55, wag: 1, wagSpeed: 12, lookY: -0.6, lookX: 0.3, headTilt: 0.2, lid: 0 } : { sit: 1, lean: 0.5, headPitch: 0.35, wag: 0.2, lookY: -0.6, lid0: 0.3 });
      const pointing = t > tw - 0.3;
      w.pose('idle', t, { intensity: 0.5 }); w.face(t > tw - 0.2 ? 'grin' : 'smile', t);
      if (pointing) { const J = w.joints; J.armR.rotation.set(-2.75, 0, -0.25); J.foreArmR.rotation.set(-0.15, 0, 0); J.head.rotation.x -= 0.15; }
      const sp = ctx.props.speech; sp.position.copy(headPt(w, -0.25, 0.95, 0)); sp.userData.set(t > tw - 0.05 ? ease.outBack(clamp((t - tw + 0.05) / 0.2, 0, 1)) : 0);
      ctx.props.filler.userData.set(t, { arms: happy ? 'up' : 'limp', bounce: happy ? 0.6 : 0.2 });
      const wh = humanFace(w), e = eyeMid(ctx), p0 = L(-14.5, 0.6, 3.6), p1 = L(-15.3, 0.65, 3.4);
      moveCam(ctx, frame2(p0, e, 0.3, wh, 0.74), frame2(p1, e, 0.3, wh, 0.74), lt / 1.8);
      tag(ctx, 'NEVER SAY W-A-L-K', tw + 0.15, Infinity, { y: 0.15, size: 62, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── "…his tail wags so hard…"
  {
    name: 'tail wag', start: 'b06.w6-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      filler(ctx, ringFill(-120, 12, 3, 9, 40, { seed: 6, tx: -86, tz: -14 }));
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t;
      const WS = 9;
      bset(ctx, { sit: 1, wag: 1.1, wagSpeed: WS, tailUp: 1.2, tongue: 1, jaw: 0.55, eyeScale: 1.1, lookX: 0.4, lid: 0.05, headTilt: 0.2 * Math.sin(t * 6), hic: 0.03 * Math.abs(Math.sin(t * 7)) });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.3 });
      const u = clamp(lt / 1.8, 0, 1), pos = L(lerp(-104, -106, u), 0.6, lerp(9, 8, u));
      setCam(ctx, frame2(pos, L(-118, 14, -14), 0.3, L(WT.x, 1, WT.z), 0.86));
      // wag peaks: whoosh streaks + a small shake
      const ph = t * WS - 5 * 0.55, sw = Math.cos(ph);
      const peaks = []; for (let k = -2; k < 30; k++) { const tp = (PI / 2 + k * PI + 5 * 0.55) / WS; if (tp > ctx.time('b06.w6') - 0.2 && tp < t + 0.01) peaks.push(tp); }
      shakeOn(ctx, peaks, 0.35, 0.18, 3);
      const a = Math.min(1, Math.abs(sw) * 1.4);
      ctx.fx.draw((g, W, H) => { g.save(); g.strokeStyle = `rgba(255,255,255,${0.55 * a})`; g.lineCap = 'round';
        for (let i = 0; i < 5; i++) { g.lineWidth = 14 - i * 2; const yy = H * (0.2 + i * 0.045), dir = Math.sign(sw) || 1; g.beginPath(); g.moveTo(W * (0.5 - 0.42 * dir), yy + 40); g.quadraticCurveTo(W * 0.5, yy - 60, W * (0.5 + 0.42 * dir), yy + 40); g.stroke(); }
        g.restore(); });
      tag(ctx, 'WAG WAG WAG', ctx.time('b06.w7'), Infinity, { y: 0.12, size: 64, bg: 'rgba(255,140,0,0.9)' });
    },
  },
  // ── "…it knocks over the water tower."
  {
    name: 'water tower', start: 'tower-0.35', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      const P = ctx.props; addTo(ctx, P.splash, 0, 0, 0);
      P.wt.rotation.y = 0;                                   // tips toward +x: toward the camera, in front of the hill
      ctx.store.duck = crowd(ctx, ['x00', 'x02', 'x03', 'x05', 'x07', 'x09'], -88, -45, { cols: 3, dx: 1.7, dz: 1.5, faceTo: [-66, -30] });
    },
    update(ctx, lt) {
      const { L, duck } = ctx.store, t = ctx.t, P = ctx.props, th = ctx.markers.tower;
      const sweep = clamp((t - th + 0.45) / 0.7, 0, 1);
      bset(ctx, { sit: 1, wag: 0.25, wagSpeed: 10, tailYaw: lerp(0.6, -1.45, ease.inOutSine(sweep)), tongue: 1, jaw: 0.5, lookX: -0.5, lid: 0.05 });
      const tip = ease.inCubic(clamp((t - th + 0.02) / 0.42, 0, 1));
      P.wt.userData.set(tip);
      const land = th + 0.4;
      P.splash.position.set(WT.x + 15, 1.5, WT.z);
      P.splash.userData.set(t - land + 0.05);
      duck.forEach((c) => { const ducked = t > th + 0.05; c.ch.pose(ducked ? 'surprised' : 'point', t + c.ph); c.ch.face(ducked ? 'shocked' : 'grin', t + c.ph); if (ducked) { c.ch.joints.torso.rotation.x += 0.6; c.ch.joints.head.rotation.x -= 0.2; } });
      setCam(ctx, frame2(L(-70, 6, -30), L(WT.x, 17, WT.z), 0.22, L(-88, 1.6, -44), 0.74));
      dbg(ctx, ['tip ' + tip.toFixed(2) + ' rz ' + P.wt.userData.pivot.rotation.z.toFixed(2)]);
      shakeOn(ctx, [land], 1.0, 0.5);
      flash(ctx, land, 0.18, '#dff4ff', 0.5);
    },
  },
  // ── b07 "And every morning, he fetches the school bus."
  {
    name: 'fetch the bus', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, -60, 0, PI / 2);
      const P = ctx.props, jaw = P.bis.userData.parts.jaw;
      ctx.add(P.bus, jaw); P.bus.scale.setScalar(1.6 / BS); P.bus.position.set(0, 0.28, 3.2); P.bus.rotation.set(0, 0, 0); P.bus.userData.set({ door: 0 });
      ctx.add(P.drips);
      filler(ctx, streetFill(-30, 26, { seed: 9, step: 2.2, zs: [-6.4, -5.7, 5.7, 6.4] }));
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, b = P.bis;
      const k = clamp(lt / 2.5, 0, 1);
      b.position.copy(L(lerp(-62, -4, k), 0, 0));
      bset(ctx, { sit: 0, walk: 0.85, wag: 1, wagSpeed: 10, jaw: 0.5, lookY: -0.2, lookX: 0, lid: 0.05, eyeScale: 1.08 });
      b.updateMatrixWorld(true);
      const jaw = b.userData.parts.jaw;
      P.drips.userData.set(t, [jaw.localToWorld(V(-0.8, -0.5, 3.6)), jaw.localToWorld(V(0.8, -0.5, 3.6)), jaw.localToWorld(V(0, -0.6, 3.9))], 6);
      P.drips.scale.setScalar(1);
      ctx.props.filler.userData.set(t, { arms: 'cheer' });
      const hb = bHead(ctx, 0, 0.2, 2.5); moveCam(ctx, { pos: L(44, 1.6, 2.2), look: hb.clone().lerp(L(-30, 0, 0), 0.35), fov: 54 }, { pos: L(44, 1.4, 2.2), look: hb.clone().lerp(L(-4, 0, 0), 0.38), fov: 58 }, k);
      shakeOn(ctx, [0, 1, 2, 3, 4].map((i) => ctx.time('b07') + 0.25 + i * 0.59), 0.25, 0.2);
    },
  },
  // ── "Full of kids. Covered in drool."  — bus set down, soggy kids stumble out
  {
    name: 'soggy kids', start: 'kids-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, -4, -1, PI / 2);
      const P = ctx.props; addTo(ctx, P.bus, 34, 0, -1.2, 0); P.bus.scale.setScalar(1);
      ctx.add(P.drips);
      ctx.add(P.busDrips, ctx.set.root); P.busDrips.position.set(0, 0, 0);
      ctx.store.kids = KIDS.map((id, i) => put(ctx, id, L(37.6, 0, 0.6), L.yaw));
      filler(ctx, streetFill(22, 30, { seed: 11, step: 2.0, zs: [-6.4, -5.6] }));
    },
    update(ctx, lt) {
      const { L, kids } = ctx.store, t = ctx.t, P = ctx.props, tk = ctx.markers.kids;
      bset(ctx, { sit: 0.2, lean: 1, bodyLean: 0.6, headPitch: -0.9, wag: 0.9, wagSpeed: 9, tongue: 1, jaw: 0.5, lookY: -0.8, lookX: 0, lid: 0.05 });
      { const jaw = P.bis.userData.parts.jaw; P.bis.updateMatrixWorld(true); P.drips.userData.set(t, [jaw.localToWorld(V(-0.8, -0.5, 3.6)), jaw.localToWorld(V(0.8, -0.5, 3.6)), jaw.localToWorld(V(0, -0.6, 3.9))], 14); }
      const door = ease.outCubic(clamp((t - tk + 0.05) / 0.3, 0, 1)); P.bus.userData.set({ door });
      kids.forEach((c, i) => {
        const t0 = tk + 0.1 + i * 0.32, u = clamp((t - t0) / 1.4, 0, 1);
        const out = t > t0;
        const p = out ? L(37.6 + (i - 2) * 0.9 * u + (i % 2 ? 0.3 : -0.2) * Math.sin(t * 6) * 0.1, 0, 0.9 + u * (2.2 + 0.4 * (i % 3))) : L(37.6, -3, 0.0);
        c.root.position.copy(p); c.root.rotation.set(0, L.yaw + (i - 2) * 0.35 + 0.15 * Math.sin(t * 5 + i), 0.12 * Math.sin(t * 7 + i));
        c.pose(u > 0.85 ? 'shrug' : 'walkSad', t + i, { speed: 1.4 }); c.face('sweat', t + i);
      });
      P.busDrips.userData.set(t, [V(32.5, 2.9, 0.1), V(35.5, 2.9, 0.1), V(30, 2.9, 0.1), V(33.8, 2.9, -2.5), V(37.6, 2.4, 0.1)], 1.6);
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.2 });
      const e = eyeMid(ctx), kd = L(37.6, 1.0, 2.0), u = clamp(lt / 2, 0, 1);
      setCam(ctx, frame2(L(lerp(45, 44, u), 1.6, lerp(7.2, 6.5, u)), e, 0.14, kd, 0.8));
      dbg(ctx, ['eyes ' + f1(toLocal(L, e))]);
      tag(ctx, 'ATTENDANCE: 100% SOGGY', ctx.markers.drool, Infinity, { y: 0.15, size: 58, bg: 'rgba(40,120,220,0.9)' });
    },
  },
  // ── b08 "Then yesterday, he got the hiccups."  — close on the face; eyes snap wide, freeze
  {
    name: 'hiccups', start: 'b08-0.1', set: 'town',
    setup(ctx) { town(ctx, { clouds: false }); bisAt(ctx, BIS.x, BIS.z, PI / 2); },
    update(ctx, lt) {
      const { B } = ctx.store, th = ctx.time('b08.w5') + 0.02;
      const t = Math.min(ctx.t, th + 0.14);
      const hic = ctx.t > th ? 1 : 0;
      bset(ctx, hic ? { sit: 1, hic: clamp((t - th) / 0.08, 0, 1), eyeScale: 1.35, pupil: 0.55, lid: 0, jaw: 0.45, brow: 0.4, lookY: 0 } : { sit: 1, lid0: 0.35, wag: 0.2, jaw: 0.08, lookY: -0.1 }, t);
      const e = eyeMid(ctx), fw = bisFwd(ctx), k = clamp(Math.min(lt, th - ctx.time('b08') + 0.1) / 1.6, 0, 1);
      const pos = e.clone().addScaledVector(fw, lerp(66, 50, ease.outCubic(k))).add(up(2));
      setCam(ctx, { pos, look: e.clone().add(up(-5)), fov: 44 });
      if (ctx.t > th) { ctx.fx.overlay('#ffffff', 0.12 + 0.5 * Math.max(0, 1 - (ctx.t - th) / 0.12)); ctx.fx.vignette(0.55); ctx.cam.punch([th], ctx.t, 0.18, 0.3); stamp(ctx, 'HIC?!', th, { size: 120, y: 0.62 }); }
    },
  },
  // ── b09 "Every hiccup bounced the whole town ten feet into the air."
  {
    name: 'town bounces', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      ctx.store.cr = crowd(ctx, ['x01', 'x03', 'x05', 'x07', 'x09', 'x11', 'x13', 'x15'], -14, -2.5, { cols: 4, dx: 3.2, dz: 2.5, yaw: PI / 2, seed: 4 });
      filler(ctx, streetFill(-36, 14, { seed: 12, step: 2.0 }));
    },
    update(ctx, lt) {
      const { L, cr } = ctx.store, t = ctx.t;
      const hits = [ctx.time('b09.w2'), ctx.time('b09.w6') + 0.0, ctx.time('b09.w10')];
      const amps = [3, 2.2, 3.2];
      let y = 0; hits.forEach((h, i) => { y = Math.max(y, hop(t, [h], amps[i], 0.62)); });
      hopTown(ctx, y);
      const hic = hitPulse(hits, t, 0.12);
      bset(ctx, { sit: 1, hic, eyeScale: 1 + 0.35 * hic, pupil: 1 - 0.4 * hic, jaw: 0.2 + 0.4 * hic, lid: 0.05, lookY: -0.2 });
      const base = L(0, 0, 0).y;
      cr.forEach((c) => { const yy = hop(t, hits, 3.6 + 0.4 * hash(c.k), 0.66); c.ch.root.position.y = base + y + yy * 0.25; c.ch.pose(yy > 0.05 ? 'surprised' : 'idle', t + c.ph); c.ch.face(yy > 0.05 ? 'shocked' : 'sweat', t + c.ph); });
      ctx.props.filler.userData.set(t, { arms: y > 0.1 ? 'up' : 'limp', bounce: 0.3 });
      setCam(ctx, { pos: L(4, 6.5, 7.5), look: L(-50, 14, -3), fov: 52 });
      shakeOn(ctx, hits.map((h) => h + 0.6), 1.0, 0.4); shakeOn(ctx, hits, 0.5, 0.25);
      hits.forEach((h, i) => { if (t > h && t < h + 0.7) stamp(ctx, 'HIC!', h, { rot: i % 2 ? 0.12 : -0.12, y: 0.62 }); });
    },
  },
  // ── b10 HUSS ×3 — the kid hangs mid-air over the street, houses floating behind
  ...[0, 1, 2].map((i) => ({
    name: `airborne #${i + 1}`, start: H('b10', i), set: 'town',
    setup(ctx) { const L = town(ctx); bisAt(ctx, BIS.x, BIS.z, PI / 2); put(ctx, 'me', L(-18, 0, 0.5), L.yaw + PI / 2 - 0.3); filler(ctx, streetFill(-34, 4, { seed: 13, step: 2.4 })); },
    update(ctx) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, hits = ctx.hussTimes('b10').map((h) => h + 0.03);
      const y = 2.2 + hop(t, hits, 1.4, 0.45); hopTown(ctx, y);
      const myY = 3.2 + 0.5 * Math.sin(t * 5) + hop(t, hits, 1.2, 0.45);
      me.root.position.copy(L(-18, myY, 0.5)); me.root.rotation.set(0.15 * Math.sin(t * 4), L.yaw + PI / 2 - 0.3, 0.25 * Math.sin(t * 3.3));
      me.pose('surprised', t, { intensity: 1 }); me.face('huss', t);
      const J = me.joints, w = Math.sin(t * 18);
      J.armL.rotation.z += 0.5 * w; J.armR.rotation.z -= 0.5 * w; J.legL.rotation.x += 0.5 * w; J.legR.rotation.x -= 0.5 * w;
      const hic = hitPulse(hits, t, 0.12);
      bset(ctx, { sit: 1, hic, eyeScale: 1.2, pupil: 0.8, jaw: 0.3 + 0.3 * hic, lid: 0, lookY: -0.3 });
      ctx.props.filler.userData.set(t, { arms: 'up', bounce: 0.6 });
      const f = humanFace(me);
      const cams = [{ pos: L(-13.5, 1.0 + y, 3.5), look: f.clone().add(up(-1.0)), fov: 50 }, { pos: L(-14.8, myY + 2.2, 3.8), look: f.clone().add(up(-1.1)), fov: 46 }, { pos: L(-15.6, myY + 1.6, 1.8), look: f.clone().add(up(-0.75)), fov: 40 }];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.12, 0.2);
    },
  })),
  // ── b11 "Grandpa's teeth landed in a bird's nest."  — toothless Grandpa → pan up to the pigeon on the teeth
  {
    name: 'teeth in nest', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      put(ctx, 'grandpa', L(-9.3, 0.12, -4.35), L.yaw + 0.25);
      const P = ctx.props; addTo(ctx, P.nest, -9, 4.83, -5.15); P.nest.scale.setScalar(1.0);
      put(ctx, 'pigeon', L(-9.15, 4.83 + 0.26, -5.4), L.yaw + 0.3);
      filler(ctx, streetFill(-30, 10, { seed: 14, step: 2.6 }));
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, g = ctx.cast.grandpa, p = ctx.cast.pigeon;
      g.pose('surprised', t, { intensity: 0.6 }); g.face('shocked', 0.5);
      p.pose('idle', t); p.face('smug', t);
      bset(ctx, { sit: 1, lid0: 0.3, lookY: -0.3 });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.1 });
      const tn = ctx.time('b11.w2');
      const k = ease.inOutCubic(clamp((t - tn) / 0.9, 0, 1));
      const face = humanFace(g), nest = L(-9, 5.25, -5.15);
      const pos = L(-8.6, 1.45, -1.55).lerp(L(-8.5, 6.2, -2.9), k);
      setCam(ctx, { pos, look: face.clone().add(up(-0.55)).lerp(nest, k), fov: lerp(40, 38, k) });
      tag(ctx, "GRANDPA'S TEETH", ctx.time('b11.w5') - 0.1, Infinity, { y: 0.15, size: 60 });
    },
  },
  // ── "The bakery landed on the library."
  {
    name: 'bakery on library', start: 'bakery-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      const P = ctx.props;
      addTo(ctx, P.library, -6, 0, 0, PI / 2);
      addTo(ctx, P.bakery, -6.3, P.library.userData.roofTop, 0.3, PI / 2 + 0.18); P.bakery.rotation.z = 0.06;
      put(ctx, 'baker', L(-2.6, P.library.userData.roofTop + 0.0, 1.8), L.yaw + PI / 2 + 0.2);
      ctx.add(P.chef, ctx.cast.baker.joints.head); P.chef.position.set(0, 0.55, -0.02); P.chef.rotation.set(-0.1, 0, 0.08);
      ctx.store.cr = crowd(ctx, ['x04', 'x06', 'x08'], 4, -4.2, { cols: 3, dx: 1.4, faceTo: [-6, 0] });
    },
    update(ctx, lt) {
      const { L, cr } = ctx.store, t = ctx.t, b = ctx.cast.baker;
      b.pose('shrug', t); b.face('sweat', t);
      cr.forEach((c) => { c.ch.pose('point', t + c.ph); c.ch.face('shocked', t + c.ph); });
      bset(ctx, { sit: 1, lid0: 0.25, lookX: -0.5, lookY: -0.4, headYaw: 0.4 });
      moveCam(ctx, { pos: L(15, 0.8, 3.2), look: L(-5, 8.0, 0), fov: 56 }, { pos: L(13.5, 0.9, 2.9), look: L(-5, 8.8, 0), fov: 54 }, lt / 1.7);
      ctx.cam.punch([ctx.time('b11.w12')], t, 0.08, 0.25);
    },
  },
  // ── b12 "The only cure for hiccups? Scare it."  quote: "You gotta scare it." — Grandma at the stage mic
  {
    name: 'grandma quote', start: 'b12-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: true, cloudAt: [-10, 34, 40], wt: false });
      ctx.set.set('standsCrowd', true);
      const S = frameAt(ctx, 'square.stage'), P = ctx.props;
      { const bl = toLocal(L, S(0, 0, -72)); bisAt(ctx, bl.x, bl.z, S.yaw - L.yaw); }
      put(ctx, 'grandma', S(0, 0, 2.5), S.yaw);
      ctx.add(P.mic); P.mic.position.copy(S(0.15, 0, 3.05)); P.mic.rotation.set(0, S.yaw + PI, 0);
      const ids = ['x10', 'x11', 'x12', 'x13', 'x14', 'x15', 'x16', 'x17'];
      ctx.store.cr = ids.map((id, i) => put(ctx, id, S(-3.2 + (i % 4) * 2.1 + (i > 3 ? 1 : 0), -0.8, 5.6 + Math.floor(i / 4) * 1.3), S.yaw + PI + (hash(i) - 0.5) * 0.4));
      ctx.store.S = S;
    },
    update(ctx, lt) {
      const { S, cr } = ctx.store, t = ctx.t, g = ctx.cast.grandma;
      g.pose('point', t, { intensity: 1 }); g.face(t > ctx.time('b12.w5') - 0.1 ? 'determined' : 'smug', t);
      const J = g.joints; J.armR.rotation.x = -2.6; J.armR.rotation.z = -0.2; J.head.rotation.x -= 0.35;
      cr.forEach((c, i) => { c.pose('idle', t + i); c.face('smile', t + i); c.joints.head.rotation.x += 0.25 * Math.max(0, Math.sin(t * 6 + i)); });
      bset(ctx, { sit: 1, lean: 0.6, headPitch: 0.35, lookY: -0.7, lid0: 0.3, wag: 0.3, hic: hitPulse([ctx.time('b12.w2'), ctx.time('b12.w6')], t, 0.12) });
      const gf = humanFace(g), e = eyeMid(ctx), u = clamp(lt / 2.2, 0, 1);
      setCam(ctx, frame2(S(lerp(1.1, 0.8, u), 0.2, lerp(5.4, 4.9, u)), e, 0.42, gf, 0.74));
      quoteCard2(ctx, '“You gotta\nscare it.”', 'Grandma', ctx.time('b12') + 0.15, ctx.time('b13') - 0.12, { y: 0.16, size: 96, byAt: ctx.time('b12.w5') - 0.05 });
    },
  },
  // ── b13 "The mayor yelled boo."
  {
    name: 'mayor boo', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      const P = ctx.props; addTo(ctx, P.podium, -44, 0, -6, 0);
      put(ctx, 'mayor', L(-44, 0.6, -6), L.yaw - PI / 2 - 0.2);
      ctx.add(P.boo);
      filler(ctx, streetFill(-40, -16, { seed: 15, step: 1.8 }));
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, m = ctx.cast.mayor, tb = ctx.time('b13.w3');
      if (t > tb - 0.25) { yellPose(m, t, 1); m.face('huss', t); } else { m.pose('idle', t); m.face('determined', t); }
      const react = t > tb + 0.42;
      bset(ctx, { sit: 1, lid: react ? 0.62 : 0.55, lookY: react ? -0.15 : -0.6, lookX: 0.1, wag: 0.05, jaw: 0.05, brow: 0, headPitch: 0.1 });
      const P = ctx.props; P.boo.position.copy(headPt(m, -0.5, 0.75, 0.3)); P.boo.userData.set(t > tb && !react ? ease.outBack(clamp((t - tb) / 0.18, 0, 1)) : 0);
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.1 });
      if (!react) {
        const mf = humanFace(m), fw = fwdOf(m), sd = V(-fw.z, 0, fw.x), u = clamp(lt / 1.0, 0, 1);
        const pos = mf.clone().addScaledVector(fw, lerp(2.9, 2.4, u)).addScaledVector(sd, 1.0).add(up(-0.7));
        setCam(ctx, { pos, look: mf.clone().add(up(-0.75)), fov: 46 });
      } else {
        setCam(ctx, eyeCam(ctx, 58, { fov: 40, drop: 3 }));
        tag(ctx, '...', tb + 0.42, Infinity, { y: 0.15, size: 90 });
      }
    },
  },
  // ── "The band played their loudest note."
  {
    name: 'tuba blast', start: 'band-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx);
      bisAt(ctx, BIS.x, BIS.z, PI / 2);
      const P = ctx.props;
      ctx.store.band = BAND.map((id, i) => { const c = put(ctx, id, L(-41 - (i % 2) * 0.6, 0, -8.5 + i * 1.5), L.yaw - PI / 2 - 0.25); const tu = P.tubas[i]; ctx.add(tu, c.joints.torso); tu.position.set(-0.05, 0.45, 0.32); tu.rotation.set(0.35, 0, 0.15); tu.scale.setScalar(1.15); return c; });
      P.rings.forEach((r) => ctx.add(r));
      filler(ctx, streetFill(-38, -16, { seed: 16, step: 1.8 }));
    },
    update(ctx, lt) {
      const { L, band } = ctx.store, t = ctx.t, P = ctx.props, tl = ctx.time('b13.w8');
      const loud = t > tl - 0.05 ? 1 : 0.45;
      band.forEach((c, i) => {
        c.pose('idle', t + i, { intensity: 0.4 }); c.face(loud > 0.5 ? 'huss' : 'determined', t + i);
        const J = c.joints; J.armL.rotation.set(-1.1, 0, -0.25); J.armR.rotation.set(-1.0, 0, 0.3); J.foreArmL.rotation.x = -1.2; J.foreArmR.rotation.x = -1.3;
        J.torso.rotation.x += -0.22 * loud; J.head.rotation.x += -0.35;
        const tu = P.tubas[i]; tu.updateMatrixWorld(true);
        const bell = tu.localToWorld(V(-0.4, 1.25, 0));
        const r = P.rings[i]; r.position.copy(bell); r.lookAt(bHead(ctx)); r.userData.set(t + i * 0.2, loud, 5 + 3 * loud, loud > 0.5 ? 0.5 : 1.0);
      });
      bset(ctx, { sit: 1, lid: loud > 0.5 ? 0.4 : 0.55, lookY: -0.6, wag: 0.1, jaw: 0.05, headTilt: loud > 0.5 ? 0.12 : 0 });
      ctx.props.filler.userData.set(t, { arms: loud > 0.5 ? 'up' : 'limp', bounce: 0.2 });
      moveCam(ctx, { pos: L(-42.6, 2.3, -0.6), look: L(-41.0, 2.0, -7.0), fov: 50 }, { pos: L(-42.9, 2.4, -1.4), look: L(-41.0, 2.1, -7.0), fov: 46 }, lt / 1.6);
      if (t > tl - 0.05) ctx.cam.shake(0.25, t, 5);
      tag(ctx, 'LOUDEST NOTE', tl, Infinity, { y: 0.15, size: 64, bg: 'rgba(200,150,0,0.92)' });
    },
  },
  // ── "Ah, almost. Almost."  — face close, tension… HIC jolt
  {
    name: 'almost', start: 'b13.w10-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx); bisAt(ctx, BIS.x, BIS.z, PI / 2);
      ctx.store.cr = crowd(ctx, ['x01', 'x02', 'x03', 'x04', 'x05'], -42, -6.5, { cols: 5, dx: 1.25, faceTo: [-86, -14] });
    },
    update(ctx, lt) {
      const { L, cr, B } = ctx.store, t = ctx.t, ta = ctx.time('b13.w11');
      const hic = hitPulse([ta], t, 0.14), tense = clamp((t - ctx.time('b13.w10')) / 0.5, 0, 1);
      bset(ctx, { sit: 1, hic, lid: lerp(0.5, 0.1, tense) * (1 - hic), eyeScale: 1 + 0.15 * tense + 0.3 * hic, pupil: 1 - 0.3 * tense, jaw: 0.15 + 0.35 * hic, lookY: -0.5, headPitch: -0.15 * tense, brow: 0.3 * tense });
      const y = hop(t, [ta], 2.4, 0.55); hopTown(ctx, y);
      const base = L(0, 0, 0).y;
      cr.forEach((c) => { c.ch.root.position.y = base + y; c.ch.pose(y > 0.05 ? 'surprised' : 'think', t + c.ph, { lookAt: bHead(ctx) }); c.ch.face(y > 0.05 ? 'shocked' : 'sweat', t + c.ph); });
      if (t < ta - 0.02) {                                   // tight on the eyes: tension
        setCam(ctx, eyeCam(ctx, lerp(52, 40, clamp(lt / 0.7, 0, 1)), { fov: 40, drop: 3 }));
        ctx.fx.vignette(0.5);
      } else {                                               // wide: the whole town bounces (camera stays put, 6 m up)
        setCam(ctx, frame2(L(-14, 6, 2), eyeMid(ctx), 0.2, L(-42, 1.4, -6.5), 0.8));
      }
      shakeOn(ctx, [ta + 0.5], 0.8, 0.35);
      tag(ctx, 'ALMOST...', ta - 0.05, Infinity, { y: 0.15, size: 70 });
    },
  },
  // ── "He just yawned."
  {
    name: 'yawn', start: 'b13.w13-0.15', set: 'town',
    setup(ctx) { const L = town(ctx); bisAt(ctx, BIS.x, BIS.z, PI / 2); filler(ctx, streetFill(-40, -14, { seed: 17, step: 1.8 })); },
    update(ctx, lt) {
      const { L, B } = ctx.store, t = ctx.t, ty = ctx.time('b13.w15') - 0.3;
      const yv = clamp((t - ty) / 0.9, 0, 1), yawn = Math.sin(PI * Math.min(1, yv * 0.75)) ;
      bset(ctx, { sit: 1, jaw: 0.05 + 1.15 * yawn, lid: lerp(0.4, 1, yawn), headPitch: -0.45 * yawn, arms: 0.3 + yawn, armsUp: 0.3 * yawn, tongue: 0.2 * yawn, brow: -0.4 * yawn, wag: 0.1 });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.05 });
      const e = eyeMid(ctx), chest = bTorso(ctx, 2.5), u = clamp(lt / 1.1, 0, 1);
      setCam(ctx, frame2(L(lerp(-30, -32, u), 9, lerp(46, 44, u)), e, 0.3, chest, 0.74));
      tag(ctx, 'SCARE ATTEMPTS: 47 — FAILED', ctx.time('b13.w15') - 0.1, Infinity, { y: 0.15, size: 50, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b14 "So I dragged the barbershop mirror to the top of the clock tower."  — up the ladder, mirror on his back
  {
    name: 'climb with mirror', start: 'b14-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx); bisAt(ctx, BIS.x, BIS.z, PI / 2);
      const P = ctx.props; addTo(ctx, P.climbLadder, TX + 0.9, 0, TZ + 4.1); P.climbLadder.rotation.set(-0.065, 0, 0);
      put(ctx, 'me', L(TX + 0.9, 3, TZ + 4.55), L.yaw + PI);
      ctx.add(P.mirror, ctx.cast.me.joints.torso); P.mirror.position.set(0.45, -0.95, -0.4); P.mirror.rotation.set(0.06, PI, -0.22); P.mirror.scale.setScalar(0.72); P.mirror.userData.set('sky');
      ctx.add(P.sweat, ctx.cast.me.joints.head);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me;
      const k = clamp(lt / (ctx.time('b14.w8') - ctx.time('b14') + 0.1), 0, 1);
      const y = lerp(3.5, 12.8, k), z = TZ + 4.4 - 0.065 * y;
      me.root.position.copy(L(TX + 0.9, y, z));
      climbPose(me, t, 2.6); me.face(Math.sin(t * 3) > 0.3 ? 'sweat' : 'determined', t);
      ctx.props.sweat.position.set(0.45, 0.6, 0.25); ctx.props.sweat.scale.setScalar(0.35 * (1 + 0.2 * Math.sin(t * 9)));
      me.joints.head.rotation.y += 0.7; me.joints.head.rotation.x -= 0.25;     // glances back over his shoulder
      bset(ctx, { sit: 1, lookX: 0.7, lookY: -0.35, lid0: 0.2, headYaw: 0.25, wag: 0.15 });
      const f = humanFace(me), mc = ctx.props.mirror.localToWorld(V(0, 1.5, 0));
      setCam(ctx, { pos: me.root.position.clone().add(L(4.6, 0.4, 3.6).sub(L(0, 0, 0))), look: f.clone().lerp(mc, 0.5).add(up(0.3)), fov: 50 });
      shakeOn(ctx, [ctx.time('b14.w2')], 0.25, 0.25);
    },
  },
  // ── "…to the top of the clock tower."  — heaves it up right in front of Biscuit's gigantic eye
  {
    name: 'mirror up', start: 'b14.w8-0.3', set: 'town',
    setup(ctx) {
      const L = town(ctx); bisAt(ctx, -100, 1.5, PI / 2);
      put(ctx, 'me', L(TX - 1.2, DY, TZ + 0.2), L.yaw - PI / 2);
      const P = ctx.props; ctx.add(P.mirror, ctx.set.root); P.mirror.scale.setScalar(1); P.mirror.userData.set('sky');
      ctx.add(P.sweat, ctx.cast.me.joints.head);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, tt = ctx.time('b14.w8');
      const lift = ease.outBack(clamp((t - tt + 0.1) / 0.45, 0, 1));
      me.pose('idle', t, { intensity: 0.3 }); holdUp(me, t, lift, 1); me.face(lift > 0.5 ? 'determined' : 'sweat', t);
      P.mirror.position.set(TX - 1.75, DY - 0.9 + 1.25 * lift, TZ + 0.2); P.mirror.rotation.set(0, -PI / 2, 0);
      P.sweat.position.set(0.36, 0.5, 0.2);
      bset(ctx, { sit: 1, lean: 1.0, bodyLean: 0.3, lookX: 0, lookY: -0.5, lid0: 0.15, wag: 0.2, headTilt: 0.1 });
      const eye = ctx.props.bis.userData.eyeWorld('L');
      const kh = headPt(me, 0, 0.3, 0), u = clamp(lt / 1.6, 0, 1);
      setCam(ctx, frame2(L(TX + lerp(2.9, 2.5, u), DY + 2.0, TZ + lerp(1.5, 1.2, u)), eye, 0.26, kh, 0.8, { fovMax: 60 }));
      shakeOn(ctx, [ctx.time('b14.w8')], 0.3, 0.25);
      dbg(ctx, ['eye ' + f1(eye)]);
    },
  },
  // ── b15 "He leaned down,"  — wide: the giant leans toward the little mirror on the tower
  {
    name: 'leans down', start: 'b15-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx); bisAt(ctx, -100, 1.5, PI / 2);
      put(ctx, 'me', L(TX - 1.2, DY, TZ + 0.2), L.yaw - PI / 2);
      const P = ctx.props; addTo(ctx, P.mirror, TX - 1.75, DY + 0.35, TZ + 0.2, -PI / 2); P.mirror.scale.setScalar(1); P.mirror.userData.set('sky');
      filler(ctx, ringFill(TX, TZ, 5, 13, 70, { seed: 18 }));
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me;
      const lean = ease.inOutCubic(clamp(lt / 0.8, 0, 1));
      bset(ctx, { sit: 1, lean: 0.7 + 0.3 * lean, bodyLean: 0.3 * lean, lookY: -0.6, lookX: 0, lid0: 0.1, headTilt: 0.25 * lean, wag: 0.2 });
      me.pose('idle', t); holdUp(me, t, 1, 1); me.face('sweat', t);
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.1 });
      const eye = ctx.props.bis.userData.eyeWorld('L'), mc = ctx.props.mirror.localToWorld(V(0, 1.5, 0)), u = clamp(lt / 0.9, 0, 1);
      setCam(ctx, frame2(L(TX + 12, DY - 4, TZ + lerp(47, 44, u)), eye, 0.34, mc, 0.6, { fovMax: 64 }));
    },
  },
  // ── "…looked into it,"  — POV: the mirror shows one giant eye… which goes WIDE
  {
    name: 'looked into it', start: 'b15.w3-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx); bisAt(ctx, -100, 1.5, PI / 2);
      put(ctx, 'me', L(TX - 1.2, DY, TZ + 0.2), L.yaw - PI / 2);
      const P = ctx.props; addTo(ctx, P.mirror, TX - 1.75, DY + 0.35, TZ + 0.2, -PI / 2); P.mirror.scale.setScalar(1);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, tw = ctx.time('b15.w5');
      P.mirror.userData.set(t > tw ? 'wide' : 'eye');
      bset(ctx, { sit: 1, lean: 1.0, bodyLean: 0.3, lookY: -0.6, headTilt: 0.25, wag: 0.1 });
      me.pose('idle', t); holdUp(me, t, 1, 1.5); me.face('sweat', t);
      const c = L(TX - 1.75, DY + 1.85, TZ + 0.2);
      moveCam(ctx, { pos: L(TX - 6.5, DY + 2.4, TZ - 1.6), look: c, fov: 44 }, { pos: L(TX - 4.6, DY + 2.1, TZ - 0.6), look: c, fov: 38 }, lt / 0.9);
      if (t > tw) { ctx.cam.punch([tw], t, 0.12, 0.25); }
    },
  },
  // ── "…and screamed"  — ROAR, shockwave
  {
    name: 'ROAR', start: 'scream-0.08', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false }); bisAt(ctx, -100, 1.5, PI / 2);
      const P = ctx.props; ctx.add(P.ring); ctx.add(P.ring2);
      put(ctx, 'me', L(TX - 1.2, DY, TZ + 0.2), L.yaw - PI / 2);
      addTo(ctx, P.mirror, TX - 1.75, DY + 0.35, TZ + 0.2, -PI / 2); P.mirror.scale.setScalar(1); P.mirror.userData.set('wide');
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, ts = ctx.markers.scream;
      const r = clamp((t - ts + 0.05) / 0.12, 0, 1);
      bset(ctx, { sit: 1, lean: 0.75 - 0.25 * r, headPitch: -0.35 * r, jaw: 1.2 * r, eyeScale: 1 + 0.5 * r, pupil: 1 - 0.65 * r, lid: 0, brow: 0.7 * r, arms: 1, armsUp: 0.6 * r, tremble: 0.6 * r, tongue: 0 });
      const me = ctx.cast.me; me.pose('surprised', t); me.face('shocked', t);
      const mouth = P.bis.userData.mouthWorld();
      const cam = L(TX - 3.5, DY + 4.5, TZ + 9);
      P.ring.position.copy(mouth); P.ring.lookAt(cam); P.ring.userData.set(t - ts, 40);
      P.ring2.position.copy(mouth); P.ring2.lookAt(cam); P.ring2.userData.set(t - ts - 0.25, 50);
      setCam(ctx, { pos: cam, look: bHead(ctx, 0, 0.6, 2.2), fov: 58 });
      ctx.cam.shake(1.2 * r, t, 9);
      flash(ctx, ts, 0.15, '#ffffff', 0.6);
      stamp(ctx, 'ROAAAR!', ts + 0.05, { size: 170, fill: '#ff3b2f', stroke: '#ffffff', y: 0.62 });
    },
  },
  // ── "…so loud the clouds left town."  — clouds blown off the sky, hats fly off the crowd
  {
    name: 'clouds leave', start: 'b15.w10-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { cloudAt: [-40, 0, -10] }); bisAt(ctx, BIS.x, BIS.z, PI / 2);
      const P = ctx.props; ctx.add(P.hats, ctx.set.root); P.hats.position.set(0, 0, 0); ctx.add(P.ring);
      const ids = ['x00', 'x01', 'x02', 'x03', 'x04', 'x05', 'x06', 'x07', 'x08', 'x09'];
      ctx.store.cr = crowd(ctx, ids, -30, -3.5, { cols: 5, dx: 1.5, dz: 1.8, faceTo: [-86, -14], seed: 9 });
      ctx.store.hatList = ctx.store.cr.map((c, i) => ({ p0: V(c.x, 2.15 * c.ch.spec?.scale || 2.0, c.z), v: V(9 + 4 * hash(i), 7 + 5 * hash(i * 2), (hash(i * 3) - 0.5) * 6), spin: 1 + hash(i * 5) }));
      filler(ctx, streetFill(-26, 10, { seed: 19, step: 2.0 }));
    },
    update(ctx, lt) {
      const { L, cr, hatList } = ctx.store, t = ctx.t, P = ctx.props, tc = ctx.time('b15.w10');
      const push = ease.inCubic(clamp((t - tc + 0.05) / 0.9, 0, 1));
      P.clouds.userData.set(t, push, V(1, 0.15, 0));
      P.hats.userData.set(hatList, t - tc - 0.05);
      bset(ctx, { sit: 1, jaw: 1.1, eyeScale: 1.4, pupil: 0.4, lid: 0, headPitch: -0.4, brow: 0.6, tremble: 0.4, arms: 1, armsUp: 0.5 });
      const mouth = P.bis.userData.mouthWorld(); P.ring.position.copy(mouth); P.ring.lookAt(L(-20, 30, 0)); P.ring.userData.set(((t - tc) % 0.6) + 0.05, 90);
      cr.forEach((c) => { c.ch.pose('surprised', t + c.ph); c.ch.face('shocked', t + c.ph); c.ch.root.rotation.z = -0.08; });
      ctx.props.filler.userData.set(t, { arms: 'up', bounce: 0.1 });
      setCam(ctx, { pos: L(-16, 1.0, 4.5), look: L(-50, 28, -6), fov: 60 });
      ctx.cam.shake(0.6, t, 11);
      tag(ctx, 'BYE CLOUDS', tc + 0.35, Infinity, { y: 0.15, size: 64 });
    },
  },
  // ── b16 HUSS ×6 — kid clutching the mirror on the tower / Biscuit tumbles back / crowd cheers + confetti
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `victory #${i + 1}`, start: H('b16', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false });
      const hits = ctx.hussTimes('b16');
      bisAt(ctx, -100, 1.5, PI / 2);
      put(ctx, 'me', L(TX + 0.3, DY, TZ - 0.3), L.yaw + PI / 2 - 0.2);
      const P = ctx.props; addTo(ctx, P.mirror, TX + 0.4, DY, TZ + 0.75, PI / 2 - 0.2); P.mirror.scale.setScalar(1); P.mirror.userData.set('sky');
      if (i % 3 === 2) { ctx.store.cr = crowd(ctx, ['x00', 'x01', 'x02', 'x03', 'x04', 'x05', 'x06', 'x07', 'x08', 'x09', 'x10', 'x11'], TX + 9, TZ + 3, { cols: 4, dx: 1.4, dz: 1.4, yaw: -PI / 2, seed: 30 + i }); ctx.add(P.confetti.root); P.confetti.root.position.copy(L(TX + 7, 12, TZ + 4)); }
      filler(ctx, ringFill(TX, TZ, 5, 14, 90, { seed: 20 + i }));
      ctx.store.t0 = hits[0];
    },
    update(ctx) {
      const { L, cr, t0 } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, hits = ctx.hussTimes('b16').map((h) => h + 0.03);
      const fall = ease.inOutSine(clamp((t - t0 + 0.1) / 1.7, 0, 1));
      const b = P.bis; b.rotation.x = -1.25 * fall;
      bset(ctx, { sit: 1 - 0.6 * fall, jaw: 0.7, eyeScale: 1.3, pupil: 0.5, lid: 0, arms: 1.2, armsUp: 0.3, wag: 0.3, tongue: 0.4, lookY: 0.3, headPitch: -0.2 });
      me.pose('idle', t, { intensity: 0.4 }); me.face('huss', t);
      const J = me.joints; J.armL.rotation.set(-1.3, 0, -0.2); J.armR.rotation.set(-1.3, 0, 0.2); J.foreArmL.rotation.x = -0.9; J.foreArmR.rotation.x = -0.9;
      if (cr) { cr.forEach((c) => { c.ch.pose('cheer', t + c.ph); c.ch.face('laugh', t + c.ph); }); P.confetti.update(t - t0 + 0.2); }
      P.filler.userData.set(t, { arms: 'cheer', speed: 1.3 });
      const f = humanFace(me);
      const fallCam = () => frame2(L(-40, 3, 75), bHead(ctx), 0.3, L(-100, 0, 1.5), 0.78, { fovMax: 66 });
      const k6 = ease.inOutCubic(clamp((t - hits[5] + 0.03) / 0.45, 0, 1));
      const cams = [
        { pos: L(TX + 3.2, DY + 1.9, TZ - 1.8), look: f.clone().add(up(-0.6)), fov: 42 },
        fallCam,
        { pos: L(TX + 18, 1.3, TZ + 4.5), look: L(TX + 3, 9, TZ + 1), fov: 58 },
        { pos: L(TX + 2.7, DY + 0.7, TZ - 1.6), look: f.clone().add(up(-0.9)), fov: 44 },
        fallCam,
        () => camLerp({ pos: L(TX + 19, 1.5, TZ + 6), look: L(TX + 9, 1.6, TZ + 3.5), fov: 50 }, { pos: L(TX + 10, DY + 2.4, TZ + 5.5), look: f.clone().add(up(-0.4)), fov: 50 }, k6),
      ];
      setCam(ctx, typeof cams[i] === 'function' ? cams[i]() : cams[i]); ctx.cam.punch(hits, t, 0.1, 0.2);
      if (i === 1 || i === 4) ctx.cam.shake(0.2, t, 4);
    },
  })),
  // ── b17 "The hiccups stopped. But then I realized something."  — quiet: he stares at the mirror, head tilted
  {
    name: 'confused dog', start: 'b17-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false });
      bisAt(ctx, -80, -14, PI / 2 + 0.35);
      const P = ctx.props; addTo(ctx, P.mirror, TX - 3.0, 0, TZ - 4.0, -PI / 2 - 0.55); P.mirror.scale.setScalar(1.4); P.mirror.rotation.x = -0.12; P.mirror.userData.set('tilt');
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t;
      bset(ctx, { sit: 1, lean: 0.7, headPitch: 0.3, headTilt: 0.5 * ease.inOutSine(clamp(lt / 0.9, 0, 1)), lookY: -0.85, lookX: 0.1, lid0: 0.08, wag: 0.05 });
      // over the mirror's shoulder: its silver frame in the foreground, his tilted head beyond
      const P = ctx.props; P.mirror.updateMatrixWorld(true);
      const top = P.mirror.localToWorld(V(0.5, 3.6, 0)), back = P.mirror.localToWorld(V(1.2, 2.4, -3.2)), u = clamp(lt / 1.2, 0, 1);
      setCam(ctx, frame2(back.clone().add(up(lerp(-0.4, 0, u))), eyeMid(ctx), 0.2, top, 0.66, { fovMax: 70 }));
    },
  },
  {
    name: 'realized', start: 'b17.w3-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false });
      bisAt(ctx, -80, -14, PI / 2 + 0.35);
      put(ctx, 'me', L(-36, 0.12, -9), L.yaw + PI / 2 - 0.6);
      const P = ctx.props; addTo(ctx, P.mirror, TX - 3.0, 0, TZ - 4.0, -PI / 2 - 0.55); P.mirror.scale.setScalar(1.4); P.mirror.rotation.x = -0.12; P.mirror.userData.set('tilt');
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me;
      bset(ctx, { sit: 1, lean: 0.7, headPitch: 0.3, headTilt: 0.45, lookY: -0.85, lookX: 0.1, lid0: 0.08, wag: 0.05 });
      me.pose('think', t, { headPitch: -0.45, headYaw: -0.3 }); me.face('squint', 0.4);
      const f = humanFace(me);
      const bh = bHead(ctx); const u = clamp(lt / 1.5, 0, 1); setCam(ctx, frame2(L(lerp(-30.6, -31.2, u), 0.85, -3.5), eyeMid(ctx), 0.18, f, 0.66, { fovMax: 66 }));
    },
  },
  // ── b18 "He had never seen himself before."  — the mirror: his own face, head tilting
  {
    name: 'never seen himself', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false });
      bisAt(ctx, -80, -14, PI / 2 + 0.35);
      const P = ctx.props; addTo(ctx, P.mirror, TX - 3.0, 0, TZ - 4.0, -PI / 2 - 0.55); P.mirror.scale.setScalar(1.4); P.mirror.rotation.x = -0.12;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props;
      P.mirror.userData.set(t > ctx.time('b18.w4') ? 'tilt' : 'face');
      bset(ctx, { sit: 1, lean: 0.5, headTilt: 0.45, lookY: -0.85, wag: 0.0 });
      P.mirror.updateMatrixWorld(true); const c = P.mirror.localToWorld(V(0, 1.5, 0)), nrm = P.mirror.localToWorld(V(0, 1.5, 1)).sub(c).normalize();
      moveCam(ctx, { pos: c.clone().addScaledVector(nrm, 6.5).add(up(-0.6)), look: c, fov: 40 }, { pos: c.clone().addScaledVector(nrm, 5.2).add(up(-0.4)), look: c, fov: 38 }, lt / 1.9);
      tag(ctx, '???', ctx.time('b18.w4'), Infinity, { y: 0.15, size: 90 });
    },
  },
  // ── "For twelve years, he thought he was a golden retriever."  — warm flashback montage
  {
    name: 'flashback wag', start: 'b18.w6-0.1', set: 'town',
    setup(ctx) { const L = town(ctx); bisAt(ctx, BIS.x, BIS.z, PI / 2); filler(ctx, streetFill(-40, -14, { seed: 21, step: 1.8 })); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t;
      bset(ctx, { sit: 1, wag: 1.2, wagSpeed: 13, tongue: 1, jaw: 0.6, lid: 0.0, eyeScale: 1.12, pupil: 1.25, headTilt: 0.25 * Math.sin(t * 7), hic: 0.06 * Math.abs(Math.sin(t * 8)), lookX: 0.2 });
      ctx.props.filler.userData.set(t, { arms: 'cheer' });
      const u = clamp(lt / 1, 0, 1);
      setCam(ctx, frame2(L(lerp(-44, -46, u), 30, lerp(30, 28, u)), eyeMid(ctx), 0.3, bTorso(ctx, 1.0), 0.72));
      flashFx(ctx);
      tag(ctx, 'GOLDEN RETRIEVER MODE', ctx.time('b18.w8'), Infinity, { y: 0.13, size: 54, bg: 'rgba(230,150,30,0.92)' });
    },
  },
  {
    name: 'flashback fetch', start: 'b18.w10-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx); bisAt(ctx, -60, 0, PI / 2);
      const P = ctx.props, jaw = P.bis.userData.parts.jaw;
      ctx.add(P.bus, jaw); P.bus.scale.setScalar(1.6 / BS); P.bus.position.set(0, 0.28, 3.2); P.bus.rotation.set(0, 0, 0); P.bus.userData.set({ door: 0 });
      filler(ctx, streetFill(-40, 30, { seed: 22, step: 2.4 }));
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props;
      P.bis.position.copy(L(lerp(-40, -10, clamp(lt / 1.0, 0, 1)), 0, 0));
      bset(ctx, { sit: 0, walk: 1.1, wag: 1, wagSpeed: 12, jaw: 0.5, lid: 0, eyeScale: 1.1, lookX: -0.4 });
      P.filler.userData.set(t, { arms: 'cheer' });
      const hb = bHead(ctx, 0, 0.2, 2.5); moveCam(ctx, { pos: L(12, 1.0, -3.2), look: hb.clone().lerp(L(-20, 0, 0), 0.3), fov: 58 }, { pos: L(12, 1.0, -3.2), look: hb.clone().lerp(L(-10, 0, 0), 0.3), fov: 58 }, lt / 1);
      flashFx(ctx);
    },
  },
  {
    name: 'flashback good boy', start: 'b18.w14-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx); bisAt(ctx, BIS.x, BIS.z, PI / 2);
      const P = ctx.props; addTo(ctx, P.truck, BIS.x - 11, 0, BIS.z + 16, PI);
      addTo(ctx, P.bowl, BIS.x + 20, 0, BIS.z + 14, PI / 2 + 0.6); P.bowl.scale.setScalar(5);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, tg = ctx.markers.golden;
      bset(ctx, { sit: 1, thump: 2.4, thumpT0: tg, lid: 1, tongue: 1, jaw: 0.45, wag: 1, wagSpeed: 11, headTilt: 0.3, headPitch: 0.35, headYaw: -0.6, lookY: 0.3 });
      P.truck.userData.set({ yaw: 0, raise: 0.87, extend: 0.8, t, scrub: 1 });
      const gnd = L(BIS.x - 6, 0, BIS.z + 10), u = clamp(lt / 1.1, 0, 1);
      setCam(ctx, frame2(L(BIS.x + lerp(34, 31, u), 13, BIS.z + lerp(36, 33, u)), eyeMid(ctx), 0.26, gnd, 0.88));
      flashFx(ctx);
      const hits = []; for (let k = 0; k < 5; k++) hits.push(tg + k / 2.6); shakeOn(ctx, hits, 0.2, 0.2);
      tag(ctx, 'GOOD BOY?', tg, Infinity, { y: 0.16, size: 96, bg: 'rgba(230,150,30,0.92)' });
    },
  },
  // ── b19 "Now he's hiding behind the mountain and won't come out."  — dusk, two sad eyes over the hill
  {
    name: 'behind the mountain', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'dusk', clouds: false, wt: false });
      bisAt(ctx, MTN.x - 26, MTN.z - 7, PI / 2 + 0.25, { s: 7 });
      const P = ctx.props;
      { const cx = -28, cz = -3, dx = MTN.x - cx, dz = MTN.z - cz, dl = Math.hypot(dx, dz), ax = dx / dl, az = dz / dl, rx = -az, rz = ax;
        addTo(ctx, P.tailTip, MTN.x - rx * 34 + ax * 18, 26, MTN.z - rz * 34 + az * 18, 0); P.tailTip.scale.setScalar(6); }
      if (ctx.set.fog) { ctx.set.fog.near = 260; ctx.set.fog.far = 900; }
      ctx.store.walkers = ['x02', 'x04', 'x06', 'x08', 'x10', 'x12', 'grandpa', 'okafor'].map((id, i) => put(ctx, id, L(0, 0, 0), L.yaw));
    },
    update(ctx, lt) {
      const { L, walkers } = ctx.store, t = ctx.t, P = ctx.props, b = P.bis;
      bset(ctx, { sit: 1, lid: 0.45, brow: -1, lookY: -0.35, lookX: 0.35, jaw: 0, wag: 0, headPitch: 0.35, eyeScale: 1.25 });
      // hold just the eyes + brows over the peak
      const u = clamp(lt / 2.8, 0, 1), cp = L(lerp(-28, -29, u), 2.2, -3);
      b.updateMatrixWorld(true); peekOver(ctx, cp, 3.5);
      P.tailTip.rotation.z = 0.3 * Math.sin(t * 1.3) - 0.15;
      walkers.forEach((c, i) => { const z = -7 + ((t * 0.9 + i * 1.9) % 15); c.root.position.copy(L(-37 - (i % 3) * 1.6, 0, z)); c.root.rotation.set(0, L.yaw + 0.1 * (i % 3 - 1), 0); c.pose('walkSad', t + i); c.face('sad', t + i); });
      const wf = humanFace(walkers[1]);
      setCam(ctx, frame2(cp, eyeMid(ctx), 0.3, L(-38, 1.0, 0), 0.86, { fovMax: 50 }));
      fill(ctx, L(-33, 2, -2), 0.6, '#ffd2b0');
    },
  },
  // ── b20 "So today, the whole town dressed up as dinosaurs,"
  {
    name: 'dino costumes', start: 'b20-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false, wt: false });
      bisAt(ctx, MTN.x - 22, MTN.z - 10, 1.12, { s: 7 });
      const ids = ['x00', 'x01', 'x02', 'x03', 'x04', 'x05', 'x06', 'x07', 'x08', 'x09', 'x10', 'x11', 'x12', 'x13', 'x14', 'x15', 'grandpa', 'okafor', 'mayor', 'baker'];
      ctx.store.cr = ids.map((id, i) => { const row = Math.floor(i / 7), col = i % 7; return put(ctx, id, L(-150 - row * 1.8 + (hash(i) - 0.5) * 0.4, 0, -12 + col * 1.5 + (row % 2) * 0.7), L.yaw + PI / 2 + 0.25 + (hash(i * 3) - 0.5) * 0.3); });
      const P = ctx.props; ctx.store.cr.forEach((c, i) => { const h = P.hoods[i]; ctx.add(h, c.joints.head); h.position.set(0, 0, 0); });
    },
    update(ctx, lt) {
      const { L, cr } = ctx.store, t = ctx.t;
      cr.forEach((c, i) => { c.pose(i % 2 ? 'dance2' : 'dance', t + i * 0.37, { intensity: 0.8 }); dinoArms(c, t + i, 1); c.face(i % 3 ? 'grin' : 'laugh', t + i); });
      bset(ctx, { sit: 1, lid: 0.35, brow: -0.6, lookX: 0.2, lookY: -0.4 });
      const u = clamp(lt / 2.8, 0, 1), cp = L(lerp(-134, -136, u), 1.0, lerp(3, 2, u));
      peekOver(ctx, cp, 4);
      setCam(ctx, frame2(cp, eyeMid(ctx), 0.2, L(-151, 1.6, -7), 0.72, { fovMax: 60 }));
      tag(ctx, 'DINOSAUR DAY', ctx.time('b20.w8'), Infinity, { y: 0.15, size: 70, bg: 'rgba(40,150,60,0.92)' });
    },
  },
  // ── "…so he wouldn't feel weird."  — Biscuit peeks out from behind the mountain, tail starts to wag
  {
    name: 'peeks out', start: 'b20.w9-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false, wt: false });
      // camera C looks past the mountain's right flank; Biscuit sits just behind the flank's silhouette, half hidden
      const C = { x: -150, z: 46 }, dx = MTN.x - C.x, dz = MTN.z - C.z, dl = Math.hypot(dx, dz), ax = dx / dl, az = dz / dl;
      const rH = 78.3 * (1 - 40 / 89), a = Math.asin(rH / dl) - 0.012;       // tangent angle at head height, slightly inside
      const ca = Math.cos(-a), sa = Math.sin(-a), bx = ax * ca - az * sa, bz = ax * sa + az * ca, D = dl + 25;
      const Bp = { x: C.x + bx * D, z: C.z + bz * D };
      bisAt(ctx, Bp.x, Bp.z, Math.atan2(C.x - Bp.x, C.z - Bp.z) + 0.5, { s: 5 });
      ctx.store.C = C; ctx.store.dir = { x: bx, z: bz };
      const ids = ['x00', 'x01', 'x02', 'x03', 'x04', 'x05', 'x06', 'x07', 'x08', 'x09', 'x10', 'x11'];
      const cx = C.x + bx * 15, cz = C.z + bz * 15;
      ctx.store.cr = ids.map((id, i) => { const lat = (i % 6 - 2.5) * 1.6, row = Math.floor(i / 6) * 1.8; const x = cx - bz * lat + bx * row, z = cz + bx * lat + bz * row; return put(ctx, id, L(x, 0, z), L.yaw + Math.atan2(C.x - x, C.z - z) + (hash(i) - 0.5) * 0.4); });
      const P = ctx.props; ctx.store.cr.forEach((c, i) => { const h = P.hoods[i]; ctx.add(h, c.joints.head); h.position.set(0, 0, 0); });
    },
    update(ctx, lt) {
      const { L, cr } = ctx.store, t = ctx.t;
      const peek = ease.inOutCubic(clamp(lt / 0.8, 0, 1));
      const { C, dir } = ctx.store;
      bset(ctx, { sit: 1, cower: 0.5 - 0.3 * peek, lean: 0.5, headPitch: 0.25, headTilt: 0.5 * peek, headYaw: -0.4 - 0.5 * peek, wag: 0.6 * peek, wagSpeed: 7, lid: 0.1, eyeScale: 1.15, lookX: -0.2, lookY: -0.5, tongue: 0.4 * peek, jaw: 0.25 * peek });
      cr.forEach((c, i) => { c.pose(i % 2 ? 'dance2' : 'dance', t + i * 0.37, { intensity: 0.8 }); dinoArms(c, t + i, 1); c.face('grin', t + i); });
      const u = clamp(lt / 1.4, 0, 1), cp = L(C.x, lerp(1.2, 1.4, u), C.z);
      setCam(ctx, frame2(cp, eyeMid(ctx), 0.24, L(C.x + dir.x * 15, 1.5, C.z + dir.z * 15), 0.78, { fovMax: 60 }));
      dbg(ctx, ['eyes ' + f1(toLocal(L, eyeMid(ctx)))]);
    },
  },
  // ── b21 "It totally worked."
  {
    name: 'totally worked', start: 'b21-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false, wt: false });
      bisAt(ctx, -210, -4, PI / 2);
      const ids = ['x00', 'x01', 'x02', 'x03', 'x04', 'x05', 'x06', 'x07', 'x08', 'x09', 'x10', 'x11', 'grandpa', 'okafor', 'mayor', 'baker'];
      ctx.store.cr = ids.map((id, i) => put(ctx, id, L(-176 - Math.floor(i / 8) * 1.8 + (hash(i) - 0.5), 0, -14 + (i % 8) * 1.7), L.yaw - PI / 2 + (hash(i) - 0.5) * 0.5));
      const P = ctx.props; ctx.store.cr.forEach((c, i) => { const h = P.hoods[i]; ctx.add(h, c.joints.head); h.position.set(0, 0, 0); });
    },
    update(ctx, lt) {
      const { L, cr } = ctx.store, t = ctx.t;
      bset(ctx, { sit: 1, wag: 1.1, wagSpeed: 12, tongue: 1, jaw: 0.55, lid: 0, eyeScale: 1.1, pupil: 1.2, headTilt: 0.2 * Math.sin(t * 5), arms: 0.8 });
      cr.forEach((c, i) => { c.pose('cheer', t + i * 0.37); c.face('laugh', t + i); });
      moveCam(ctx, { pos: L(-166, 1.2, 0), look: L(-205, 17, -6), fov: 60 }, { pos: L(-167, 1.3, -0.5), look: L(-205, 19, -6), fov: 58 }, lt / 1.2);
    },
  },
  // ── "Except Grandma's costume is so good,"  — low hero angle, glowing red eyes, clacking jaw, ROAR
  {
    name: 'grandma costume', start: 'grandma-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false, wt: false });
      bisAt(ctx, -212, -4, PI / 2);
      put(ctx, 'grandma', L(-182, 0, -4), L.yaw - PI / 2);
      const P = ctx.props; ctx.add(P.suit); ctx.add(P.glow); ctx.add(P.glow2);
      const ids = ['x00', 'x01', 'x02', 'x03', 'x04', 'x05'];
      ctx.store.cr = ids.map((id, i) => put(ctx, id, L(-176 + (i % 2) * 1.2, 0, -9.5 + i * 2.6 + (i > 2 ? 3 : 0)), L.yaw - PI / 2 + (i > 2 ? -0.5 : 0.5)));
      ctx.store.cr.forEach((c, i) => { const h = P.hoods[i]; ctx.add(h, c.joints.head); h.position.set(0, 0, 0); });
    },
    update(ctx, lt) {
      const { L, cr } = ctx.store, t = ctx.t, P = ctx.props, g = ctx.cast.grandma;
      const step = clamp(lt / 1.0, 0, 1), x = lerp(-182, -186, ease.outCubic(step));
      g.root.position.copy(L(x, 0, -4)); g.root.rotation.set(0, L.yaw - PI / 2, 0);
      g.pose('walk', t, { speed: 0.8 }); g.face('smug', t);
      const tr = ctx.time('b21.w7');
      const roar = clamp((t - tr) / 0.2, 0, 1);
      P.suit.position.copy(g.root.position); P.suit.rotation.copy(g.root.rotation);
      P.suit.userData.set(t, { mask: 0, jaw: roar > 0 ? 1 : 0.5 + 0.5 * Math.sin(t * 16), glow: 1, roar, tail: 1 });
      P.suit.updateMatrixWorld(true);
      P.suit.userData.eyes.forEach((e, k) => { const gs = k ? P.glow2 : P.glow; gs.position.copy(e.getWorldPosition(V())); gs.scale.setScalar(1.0 + 0.8 * roar + 0.2 * Math.sin(t * 9)); });
      cr.forEach((c, i) => { c.pose(roar > 0 ? 'surprised' : 'clap', t + i); c.face(roar > 0 ? 'shocked' : 'grin', t + i); });
      bset(ctx, { sit: 1, wag: roar > 0 ? 0 : 0.8, wagSpeed: 10, tongue: roar > 0 ? 0 : 0.8, jaw: roar > 0 ? 0.7 : 0.4, eyeScale: roar > 0 ? 1.4 : 1.05, pupil: roar > 0 ? 0.45 : 1.1, lid: 0, tremble: roar, brow: roar > 0 ? -0.8 : 0 });
      const head = P.suit.userData.maskG.getWorldPosition(V());
      moveCam(ctx, { pos: L(x - 4.6, 0.35, -2.2), look: head.clone().add(up(-0.5)), fov: 54 }, { pos: L(x - 3.6, 0.3, -2.4), look: head.clone().add(up(-0.3)), fov: 52 }, lt / 2.0);
      if (roar > 0) { ctx.cam.shake(0.5 * Math.max(0.3, 1 - (t - tr)), t, 13); stamp(ctx, 'RAWR', tr, { size: 150, fill: '#ff3b2f', stroke: '#ffffff', y: 0.62 }); }
    },
  },
  // ── "…now he's scared of Grandma."  — yelp, leap behind the (tiny) clock tower, paws over his face, trembling
  {
    name: 'scared of grandma', start: 'scared-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false });
      bisAt(ctx, -66, 1.5, PI / 2);
      filler(ctx, streetFill(-36, -14, { seed: 23, step: 2.2 }));
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, ts = ctx.markers.scared;
      const land = ts + 0.15, u = clamp((t - (ts - 0.15)) / 0.3, 0, 1);
      P.bis.position.copy(L(-66, 40 * (1 - u) * (1 - u), 1.5));
      bset(ctx, { sit: 1, cower: 1, armsUp: 1, arms: 0.6, tremble: t > land ? 1 : 0.3, eyeScale: 1.35, pupil: 0.5, lid: 0, brow: -1, jaw: 0.25, lookX: 0.4, lookY: -0.3, headYaw: 0.3, wag: 0, tailUp: -0.3 });
      P.filler.userData.set(t, { arms: 'up', bounce: 0.4 });
      setCam(ctx, { pos: L(-12, 3, 12), look: L(-64, 22, 0), fov: 58 });
      shakeOn(ctx, [land], 1.0, 0.45);
      tag(ctx, 'GRANDMA: 1   BISCUIT: 0', ts + 0.1, Infinity, { y: 0.15, size: 58, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  // ── "Top ten respect."
  {
    name: 'top ten respect', start: 'respect-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false });
      bisAt(ctx, -66, 1.5, PI / 2);
      put(ctx, 'grandma', L(-40, 0, 3), L.yaw + PI / 2 - 0.15);
      const P = ctx.props; ctx.add(P.suit); ctx.add(P.glow); ctx.add(P.glow2);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, g = ctx.cast.grandma;
      g.root.rotation.y = L.yaw + PI / 2 + 0.6; g.pose('idle', t); g.face('smug', t);
      P.suit.position.copy(g.root.position); P.suit.rotation.copy(g.root.rotation);
      P.suit.userData.set(t, { mask: 0, jaw: 0.25 + 0.25 * Math.sin(t * 8), glow: 1, tail: 0.6 });
      P.suit.updateMatrixWorld(true);
      P.suit.userData.eyes.forEach((e, k) => { const gs = k ? P.glow2 : P.glow; gs.position.copy(e.getWorldPosition(V())); gs.scale.setScalar(1.0 + 0.2 * Math.sin(t * 9)); });
      bset(ctx, { sit: 1, cower: 1, armsUp: 1, arms: 0.6, tremble: 1, eyeScale: 1.3, pupil: 0.5, lid: 0, brow: -1, jaw: 0.2, lookX: 0.5, lookY: -0.4, headYaw: 0.3 });
      const u = clamp(lt / 1.2, 0, 1), cp = L(lerp(-31, -31.6, u), 1.1, lerp(-1.2, -1.0, u));
      setCam(ctx, frame2(cp, eyeMid(ctx), 0.42, g.root.position.clone(), 0.92, { fovMax: 66 }));
      top10Card(ctx, 1, ctx.time('b21.w14') - 0.05, Infinity, { popAt: ctx.time('b21.w15') });
    },
  },
  // ── b22 HUSS ×3 — Grandma slams, lifts the mask (huss face), winks; Biscuit shakes behind the tower
  ...[0, 1, 2].map((i) => ({
    name: `grandma huss #${i + 1}`, start: H('b22', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, { clouds: false });
      bisAt(ctx, -66, 1.5, PI / 2);
      put(ctx, 'grandma', L(-40, 0, 3), L.yaw + PI / 2 - 0.15);
      const P = ctx.props; ctx.add(P.suit); ctx.add(P.glow); ctx.add(P.glow2);
    },
    update(ctx) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, g = ctx.cast.grandma, hits = ctx.hussTimes('b22').map((h) => h + 0.03);
      const mask = i === 0 ? 0 : ease.outCubic(clamp((t - hits[1] + 0.1) / 0.18, 0, 1));
      g.pose('slam', t, { hits }); g.joints.torso.rotation.x -= 0.25; g.joints.head.rotation.x -= 0.45; g.face(i === 2 && t > hits[2] + 0.12 ? 'wink' : 'huss', i === 2 ? 0.5 : t);
      P.suit.position.copy(g.root.position); P.suit.rotation.copy(g.root.rotation);
      P.suit.userData.set(t, { mask, jaw: 0.3 + 0.5 * hitPulse(hits, t, 0.15), glow: 1 - 0.7 * mask, tail: 1 });
      P.suit.updateMatrixWorld(true);
      P.suit.userData.eyes.forEach((e, k) => { const gs = k ? P.glow2 : P.glow; gs.position.copy(e.getWorldPosition(V())); gs.scale.setScalar((1.0 + 0.2 * Math.sin(t * 9)) * (1 - 0.7 * mask)); });
      bset(ctx, { sit: 1, cower: 1, armsUp: 1, arms: 0.6, tremble: 1, eyeScale: 1.3, pupil: 0.5, lid: 0, brow: -1, jaw: 0.2, lookX: 0.5, lookY: -0.4, headYaw: 0.3 });
      const f = humanFace(g);
      const cams = [{ pos: L(-36.6, 0.7, 3.9), look: f.clone().add(up(-0.9)), fov: 50 }, { pos: L(-37.6, 1.15, 3.4), look: f.clone().add(up(-0.8)), fov: 42 }, { pos: L(-36.8, 1.45, 4.0), look: f.clone().add(up(-0.85)), fov: 50 }];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.1, 0.2);
      if (i === 2) iris(ctx, ctx.time('b22.end') + 0.4, 0.29);
    },
  })),
];
