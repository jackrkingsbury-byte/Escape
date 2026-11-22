// In This Town — Episode 16: "Don't Whistle".  A harbour town where whistling is banned: the Gulp, a giant one-eyed
// sea monster, copies every sound and comes up to find whoever made it.  A storm makes the cracked lighthouse whistle,
// the kid saves the town by yawning into the fish-market megaphone… and that night the harbour answers in his voice.
// Film contract: SPEC.md §8.  Timeline: episodes/ep16/timeline.json.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { crowdGrid, animateCrowd } from '../direct.js';
import { clamp, ease, hash, lerp, smooth } from '../lib/util.js';
import { quoteCard } from '../cards.js';
import { makeSweatDrop } from '../props.js';
import { V, frameAt, lastBefore } from '../shots.js';
import { makeBeard } from '../ep15/props.js';
import { buildHarbour, buildUnder, makeGulp, makeTentacles, shape, baseMatrix, makeBoat, makeSign, makeKettle, makeIceCreamVan,
  makeBike, makeMegaphone, makeMedal, makeSailorCap, makeNotes, makeRain, makeBolt, makeSnoreBubbles, makeSoundRings, makeHussBubble,
  makePlanks, makeSplash, makeWindowBay, makeNightView, makeFogBank, glowSprite, SEA_Y, PIER, LH, DOBBS, STALL, SIGN, GULP_POS } from './props.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const TOWN_IDS = EXTRA_IDS.slice(0, 12);
export const cast = {
  me: MAIN.me,
  mayor: MAIN.mayor,
  keeper: { id: 'keeper', skin: '#e9b99a', hair: { style: 'grandpa', color: '#f2f2f2' }, top: { style: 'cardigan', color: '#22335a', accent: '#f3e3a5' },
    bottom: { style: 'pants', color: '#2a2a3a' }, shoes: '#3a2a1e', accessories: ['mustache'], scale: 0.95 },
  dobbs: { id: 'dobbs', skin: '#f0c8a8', hair: { style: 'bald', color: '#f0c8a8' }, top: { style: 'tee', color: '#ffffff', accent: '#2f6fd6', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#3a3d46' }, shoes: '#1d1d22', accessories: ['mustache'], build: 1.18, scale: 1.0 },
  grandma: { id: 'grandma', skin: '#f4d0b5', hair: { style: 'bun', color: '#c8c8d0' }, top: { style: 'cardigan', color: '#8a5cff', accent: '#ffd23f' },
    bottom: { style: 'skirt', color: '#4a3a6a' }, shoes: '#7a1f2b', accessories: ['glasses'], scale: 0.92 },
  mum: { id: 'mum', skin: '#e0ac69', hair: { style: 'long', color: '#3b2416' }, top: { style: 'dress', color: '#3ee0c8', accent: '#ffffff', emblem: 'heart' },
    bottom: { style: 'skirt', color: '#3ee0c8' }, shoes: '#ff4fa3', scale: 0.98 },
  kid: { id: 'kid', skin: '#f1c7a1', hair: { style: 'spiky', color: '#e8c46a' }, top: { style: 'tee', color: '#ff7a2f', accent: '#ffffff', emblem: 'star' },
    bottom: { style: 'shorts', color: '#2f4d8a' }, shoes: '#f2f2f2', scale: 0.74 },
  tiptoe: { id: 'tiptoe', skin: '#ffdbac', hair: { style: 'short', color: '#7a4a24' }, top: { style: 'tee', color: '#4fb3ff', accent: '#ffffff', emblem: 'number' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#f4f4f4', accessories: ['glasses'], scale: 1.02 },
  oldman: { id: 'oldman', skin: '#e9b99a', hair: { style: 'grandpa', color: '#e0e0e0' }, top: { style: 'cardigan', color: '#6b8e5a', accent: '#f3e3a5' },
    bottom: { style: 'pants', color: '#7a6a58' }, shoes: '#4a3b2f', accessories: ['glasses', 'cap'], capColor: '#3a3d46', scale: 0.95 },
  fishmonger: { id: 'fishmonger', skin: '#c68642', hair: { style: 'short', color: '#1a120c' }, top: { style: 'tee', color: '#ffffff', accent: '#4fb3ff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#1d1d22', accessories: ['cap', 'beard'], capColor: '#2f6fd6', build: 1.1 },
  fisher1: { id: 'fisher1', skin: '#f1c7a1', hair: { style: 'short', color: '#7a4a24' }, top: { style: 'hoodie', color: '#ffd23f', accent: '#1d1d22' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#1d1d22', accessories: ['cap', 'beard'], capColor: '#ffd23f', build: 1.1 },
  fisher2: { id: 'fisher2', skin: '#8d5524', hair: { style: 'short', color: '#111111' }, top: { style: 'hoodie', color: '#ff7a2f', accent: '#1d1d22' },
    bottom: { style: 'pants', color: '#3a3d46' }, shoes: '#1d1d22', accessories: ['cap'], capColor: '#ff7a2f', build: 1.05 },
  gull: { creature: 'pigeon', id: 'gull', color: '#eef0f4', scale: 1.4 },
  ...Object.fromEntries(TOWN_IDS.map((id) => [id, EXTRAS[id]])),
};
export const lazySets = true;
export const sets = {
  harbour: () => buildHarbour(),
  under: () => buildUnder(),
  town: () => buildTown({ seed: 16, banner: ['HARBOUR', 'HERO', 'PARTY'] }),
  bedroom: () => buildRoom({ variant: 'hero', window: 'dark', poster: 'knight' }),
};

export function init(ctx) {
  const P = ctx.props;
  P.gulp = makeGulp();
  P.bigT = makeTentacles(4, { nSeg: 12 });
  P.boatA = makeBoat('#d6453a', '#ffd23f', 1); P.boatB = makeBoat('#2f6fd6', '#ffd23f', 3);
  P.kettleSign = makeSign('kettle');
  P.kettle = makeKettle();
  P.van = makeIceCreamVan();
  P.bike = makeBike();
  P.mega = makeMegaphone();
  P.medal = makeMedal();
  P.cap = makeSailorCap();
  P.beard = makeBeard();
  P.notes = makeNotes(7, '#ffffff');
  P.notesG = makeNotes(7, '#7dff8a');
  P.rain = makeRain(700);
  P.bolt = makeBolt(3); P.bolt2 = makeBolt(8);
  P.snore = makeSnoreBubbles(10);
  P.rings = makeSoundRings(6);
  P.hussB = [makeHussBubble(), makeHussBubble(), makeHussBubble()];
  P.planks = makePlanks(9); P.planks2 = makePlanks(9);
  P.splash = makeSplash(70); P.splash2 = makeSplash(70);
  P.bays = [makeWindowBay('#ffcf70'), makeWindowBay('#ffd99a'), makeWindowBay('#ffcf70'), makeWindowBay('#ffe2a8')];
  P.myBay = makeWindowBay('#ffcf70');
  P.nightView = makeNightView();
  P.fog = makeFogBank({ n: 30, w: 90, d: 50, h: 4, size: 16, color: '#8fa3c0', opacity: 0.28 });
  P.fogU = makeFogBank({ n: 20, w: 60, d: 30, h: 8, size: 14, color: '#2a6a8a', opacity: 0.25 });
  P.fill = new THREE.PointLight('#c8d8ff', 5, 9, 1.4);
  P.greenL = new THREE.PointLight('#40ff70', 0, 7, 1.3);
  P.sweat = makeSweatDrop({ size: 0.11 });
  P.shoeL = shoe(); P.shoeR = shoe();
  P.flagL = flag('#e8232b'); P.flagR = flag('#ffd23f'); P.flagL2 = flag('#3ee0c8'); P.flagR2 = flag('#ff4fa3');
  P.duvet = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 1.55), new THREE.MeshStandardMaterial({ color: '#4f7fbf', roughness: 0.9 })); P.duvet.castShadow = true;
  P.drips = makeDrips(12);
  P.eyeGlow = glowSprite('#5aff7a', 10, 0.8);
}
function shoe() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.3), new THREE.MeshStandardMaterial({ color: '#1d1d22', roughness: 0.6 })); g.add(b); const s = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.31), new THREE.MeshStandardMaterial({ color: '#ffffff' })); s.position.y = -0.06; g.add(s); return g; }
function flag(c) { const g = new THREE.Group(); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 6), new THREE.MeshStandardMaterial({ color: '#6b4a3a' })); st.position.y = 0.3; g.add(st); const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.42), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })); f.position.set(0, 0.52, 0.22); g.add(f); return g; }
function makeDrips(n) {
  const g = new THREE.Group(), list = [];
  const m = new THREE.MeshStandardMaterial({ color: '#dff4ff', roughness: 0.05, transparent: true, opacity: 0.7, emissive: '#6a8aa0', emissiveIntensity: 0.4 });
  for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), m); d.scale.y = 2.6; g.add(d); list.push(d); }
  g.userData = { set(t) { list.forEach((d, i) => { const u = (t * (0.35 + 0.3 * hash(i)) + hash(i * 3.1)) % 1; d.position.set((hash(i * 5.3) - 0.5) * 1.0, 0.7 - u * 1.4, 0.02); }); } };
  return g;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const PI = Math.PI;
const up = (y) => V(0, y, 0);
const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
function put(ctx, id, p, yaw = 0) { ctx.place(id, Array.isArray(p) ? V(...p) : p); ctx.cast[id].root.rotation.set(0, yaw, 0); return ctx.cast[id]; }
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headTop(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.62, 0)); }
/** fill light riding with the camera (harbour: the set's own point light; other sets: P.fill) */
function fill(ctx, pos, k = 1, color = '#c8d8ff') {
  const L = ctx.set.lights && ctx.set.lights.fill ? ctx.set.lights.fill : (ctx.add(ctx.props.fill), ctx.props.fill);
  L.position.copy(Array.isArray(pos) ? V(...pos) : pos).add(up(0.4)); L.intensity = 5 * k; L.color.set(color);
}
function cam(ctx, c, k = 0) { ctx.cam.set(c); if (k) fill(ctx, c.pos, k); }
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 74, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop * (o.scale ?? 1)) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.22, size: 150, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.1, alpha: clamp(d / 0.06, 0, 1), ...o, scale: s * (o.scale ?? 1) });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
const iris = (ctx, t0, cy = 0.45, dur = 0.4) => { const k = clamp((ctx.t - t0) / dur, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); }); };
/** lightning: returns flash 0..1 for strikes at the given times */
function strikeK(t, times, dur = 0.22) { let k = 0; for (const s of times) { const d = t - s; if (d >= 0 && d < dur) k = Math.max(k, (d < 0.05 ? 1 : 1 - (d - 0.05) / (dur - 0.05)) * (d > 0.08 && d < 0.11 ? 0.4 : 1)); } return k; }
function lightning(ctx, times, { bolt = true, at = [70, 46, -40], shake = 0.25 } = {}) {
  const k = strikeK(ctx.t, times);
  if (k > 0) { ctx.set.flash?.(k); ctx.fx.overlay('#dfe8ff', 0.28 * k); if (shake) ctx.cam.shake(shake * k, ctx.t, 7); }
  const B = ctx.props.bolt; ctx.add(B); B.visible = bolt && k > 0.15; B.position.set(...at); B.scale.setScalar(1.4); B.lookAt(ctx.camera.position.x, at[1], ctx.camera.position.z);
  return k;
}
function rain(ctx, a = 1, slant = 0.3) { const R = ctx.props.rain; ctx.add(R); R.position.copy(ctx.camera.position); R.userData.set(ctx.t, a, slant); }
/** after ctx.cam.set in update: the engine applies it later, so pass the cam pos explicitly */
function rainAt(ctx, pos, a = 1, slant = 0.3) { const R = ctx.props.rain; ctx.add(R); R.position.copy(Array.isArray(pos) ? V(...pos) : pos); R.userData.set(ctx.t, a, slant); }
/** Put the Gulp in the harbour at (x, z), facing yaw, scale s. */
function gulpAt(ctx, x, z, s, yaw = -PI / 2, y = SEA_Y) { const G = ctx.props.gulp; ctx.add(G); G.position.set(x, y, z); G.rotation.set(0, yaw, 0); G.scale.setScalar(s); return G; }
function gulpSet(ctx, o = {}) { const G = ctx.props.gulp; G.userData.set(ctx.t, o); return G.userData.eyeWorld(); }
/** glow light + sea glow at the eye */
function eyeLight(ctx, eye, k = 1) {
  const s = ctx.set; if (!s.lights) return;
  s.lights.glow.position.copy(eye).add(V(-7, 1, 0)); s.lights.glow.intensity = 70 * k; s.lights.glow.distance = 45; s.lights.glow.color.set('#40ff70');
  s.seaGlow?.(eye.x - 4, eye.z, 0.4 * k, 9);
}
/** planar CCD: angles (about X, from +Y toward +Z) for an n-chain of length len reaching (ty, tz) */
function reach(n, len, ty, tz, { iters = 26, maxA = 0.6, init = 0.05 } = {}) {
  const a = new Array(n).fill(init), sl = len / n;
  const fk = () => { const p = [[0, 0]]; let A = 0, y = 0, z = 0; for (let s = 0; s < n; s++) { A += a[s]; y += sl * Math.cos(A); z += sl * Math.sin(A); p.push([y, z]); } return p; };
  for (let it = 0; it < iters; it++) for (let s = n - 1; s >= 0; s--) {
    const p = fk(), [jy, jz] = p[s], [ey, ez] = p[n];
    let d = Math.atan2(tz - jz, ty - jy) - Math.atan2(ez - jz, ey - jy);
    while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI;
    a[s] = clamp(a[s] + d * 0.6, -maxA, maxA);
  }
  return a;
}
/** Drive big tentacle i from base (world) to reach target (world).  extra: added curl on the last segments (wrap). */
function tentReach(ctx, i, base, target, len, r0, r1, { wrap = 0, wave = 0.05, t = ctx.t } = {}) {
  const T = ctx.props.bigT, n = T.userData.nSeg;
  const yaw = Math.atan2(target.x - base.x, target.z - base.z);
  const tz = Math.hypot(target.x - base.x, target.z - base.z), ty = target.y - base.y;
  const a = reach(n, len, ty, tz);
  T.userData.set(i, baseMatrix(base.x, base.y, base.z, yaw), len, r0, r1, (s, u) => [a[s] + (s > n - 4 ? wrap * (s - (n - 4)) / 3 : 0) + wave * Math.sin(t * 2 - s * 0.6), 0.04 * Math.sin(t * 1.3 + s * 0.4 + i)]);
  return T.userData.tip(i);
}
function tentShape(ctx, i, base, yaw, len, r0, r1, sh) { const T = ctx.props.bigT; T.userData.set(i, baseMatrix(base.x, base.y, base.z, yaw), len, r0, r1, shape({ n: T.userData.nSeg, t: ctx.t, ...sh })); return T.userData.tip(i); }
function hideTents(ctx, from = 0) { const T = ctx.props.bigT; for (let i = from; i < 4; i++) T.userData.hide(i); }
function bigT(ctx) { const T = ctx.props.bigT; ctx.add(T); T.position.set(0, 0, 0); T.rotation.set(0, 0, 0); T.scale.setScalar(1); hideTents(ctx); return T; }
/** Keeper: beard + sailor cap (cap may fly: pass a world transform). */
function dressKeeper(ctx) {
  const k = ctx.cast.keeper, P = ctx.props;
  ctx.add(P.beard, k.joints.head); P.beard.position.set(0, 0.1, 0.3); P.beard.scale.set(0.9, 0.55, 1); P.beard.rotation.set(0.12, 0, 0);
  ctx.add(P.cap, k.joints.head); P.cap.position.set(0, 0.6, 0.0); P.cap.rotation.set(-0.08, 0, 0); P.cap.scale.setScalar(1);
  return k;
}
/** Keeper leaning on the gallery rail: torso forward, forearms on the rail. */
function keeperLean(k, t, whistle = true) {
  k.pose('idle', t, { intensity: 0.4 });
  const J = k.joints;
  J.torso.rotation.x += 0.28; J.head.rotation.x += -0.2;
  for (const s of ['L', 'R']) { J['arm' + s].rotation.x += -1.15; J['arm' + s].rotation.z += (s === 'L' ? -0.2 : 0.2); J['foreArm' + s].rotation.x += -0.9; }
  J.head.rotation.z += 0.08 * Math.sin(t * 2.2);
  k.face(whistle ? 'shocked' : 'smile', 1.0);
}
/** Grandma on her bike.  pedal: tempo; frantic adds arm flailing. */
function rider(ch, t, pedal = 1, frantic = 0) {
  ch.pose('sit', t, { seatHeight: 0.8, hands: 'none' });
  const J = ch.joints, a = t * 9 * pedal;
  J.legL.rotation.x += 0.45 * Math.sin(a); J.legR.rotation.x += 0.45 * Math.sin(a + PI);
  J.shinL.rotation.x += 0.4 * Math.max(0, Math.sin(a + 1.2)); J.shinR.rotation.x += 0.4 * Math.max(0, Math.sin(a + 1.2 + PI));
  for (const s of ['L', 'R']) { J['arm' + s].rotation.x = -1.25 + frantic * 0.9 * Math.sin(t * 14 + (s === 'L' ? 0 : 2)); J['arm' + s].rotation.z = (s === 'L' ? -0.25 : 0.25) * (1 + frantic * 2); J['foreArm' + s].rotation.x = -0.4; }
  J.torso.rotation.x += 0.15;
}
/** Bike + grandma at world position p (bike origin), yaw. */
function bikeAt(ctx, p, yaw, tilt = 0) {
  const B = ctx.props.bike, g = ctx.cast.grandma;
  ctx.add(B); B.position.copy(p); B.rotation.set(tilt, yaw, 0);
  const off = V(0, 0, B.userData.seatZ - 0.06).applyEuler(B.rotation);
  if (!g.root.parent) ctx.place('grandma', p.clone().add(off)); else g.root.position.copy(p).add(off);
  g.root.rotation.set(tilt, yaw, 0);
}
/** Mum's shush: finger to the lips. */
function shush(ch, t) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints; J.armR.rotation.x = -2.1; J.armR.rotation.z = 0.55; J.foreArmR.rotation.x = -1.9; J.head.rotation.x += 0.12; J.torso.rotation.x += 0.08;
  ch.face('determined', 1.5);
}
/** Whisper: hand beside the mouth, leaning in. */
function whisper(ch, t) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints; J.armL.rotation.x = -1.9; J.armL.rotation.z = -0.65; J.foreArmL.rotation.x = -1.7; J.torso.rotation.x += 0.18; J.head.rotation.y += 0.12;
}
/** megaphone in the right hand */
function holdMega(ctx, ch) { const M = ctx.props.mega; ctx.add(M, ch.joints.handR); M.position.set(0, -0.06, 0.02); M.rotation.set(PI / 2, 0, 0); M.scale.setScalar(1.0); return M; }
function megaUp(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.4 });
  const J = ch.joints; J.armR.rotation.x = lerp(0, -1.5, k); J.armR.rotation.z = lerp(0, 0.35, k); J.foreArmR.rotation.x = lerp(0, -0.9, k);
}
function yawnStretch(ch, t, k) {
  ch.pose('cheer', 0.25, { intensity: 1 });
  const J = ch.joints; J.torso.rotation.x += -0.18 * k; J.head.rotation.x += -0.35 * k;
  J.armL.rotation.z += -0.35 * k; J.armR.rotation.z += 0.35 * k;
}

// ── shared shot pieces
const HARB = (lighting, options = {}, extra = {}) => ({ set: 'harbour', lighting, options, ...extra });
const A = (ctx, a) => ctx.time(a);

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, you are never, ever allowed to whistle."  — dusk establishing, then the sign
  {
    name: 'harbour at dusk', start: 0, ...HARB('dusk', { seaAmp: 0.18 }),
    setup(ctx) {
      const ids = TOWN_IDS.slice(0, 6);
      ids.forEach((id, i) => put(ctx, id, [-30 + i * 4, 0.12, i % 2 ? 5.3 : -5.3], i % 2 ? -PI / 2 : PI / 2));
      ctx.store = { ids };
    },
    update(ctx, lt) {
      ctx.store.ids.forEach((id, i) => { const c = ctx.cast[id], dir = i % 2 ? -1 : 1; c.root.position.x = -30 + i * 4 + dir * 1.2 * ctx.t; c.pose('walk', ctx.t + i, { speed: 1 }); c.face('smile', ctx.t + i); });
      ctx.cam.move({ pos: V(-46, 15, 3), look: V(30, 3, -9), fov: 50 }, { pos: V(-30, 8.5, 1.5), look: V(34, 4, -10), fov: 48 }, clamp(lt / 1.5, 0, 1), ease.inOutSine);
    },
  },
  {
    name: 'no whistling sign', start: 'b01.w5-0.1', ...HARB('dusk', { seaAmp: 0.18 }),
    update(ctx, lt) {
      const a = { pos: V(-7.8, 2.0, -0.2), look: V(1.2, 3.5, -3.0), fov: 40 }, b = { pos: V(-4.6, 2.2, -1.4), look: V(1.2, 3.3, -3.1), fov: 38 };
      ctx.cam.move(a, b, clamp(lt / 1.6, 0, 1), ease.outCubic);
      stamp(ctx, 'NO WHISTLING', A(ctx, 'b01.w9') - 0.05, { y: 0.17, size: 120, rot: -0.06 });
    },
  },
  // ── b02 "Because something under the harbour whistles back."  — sink into the dark, the eye opens
  {
    name: 'under the harbour', start: 'b02-0.15', set: 'under', captions: true,
    setup(ctx) {
      const G = ctx.props.gulp; ctx.add(G); G.position.set(0, -15, -36); G.rotation.set(0, 0, 0); G.scale.setScalar(16);
      const F = ctx.props.fogU; ctx.add(F); F.position.set(0, -6, -14);
    },
    update(ctx, lt) {
      const t0 = A(ctx, 'b02.w2'), t1 = A(ctx, 'b02.w5') + 0.2;
      const lid = 1 - ease.inOutCubic(clamp((ctx.t - t0) / (t1 - t0), 0, 1));
      const eye = gulpSet(ctx, { rise: 1, lid, glow: 1 - 0.6 * lid, tentRise: 1, sway: 1, lookY: -0.08 });
      ctx.props.fogU.userData.set(ctx.t, 1);
      const L = ctx.set.lights.glow; L.position.copy(eye).add(V(0, 0, 8)); L.intensity = 400 * (1 - lid);
      const k = ease.inOutSine(clamp(lt / 2.1, 0, 1));
      ctx.cam.set({ pos: V(0, lerp(11.5, -3.5, k), lerp(4, -2, k)), look: V(0, lerp(4, -7.5, k), -22), fov: lerp(56, 48, k) });
      ctx.fx.vignette(0.55);
    },
  },
  // ── b03 HUSS ×3 — me on the pier, lit green from below
  ...[0, 1, 2].map((i) => ({
    name: `pier huss #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, ...HARB('night', { seaAmp: 0.15, lamp: 'off' }),
    setup(ctx) { put(ctx, 'me', [20, 0, 0], PI / 2 + 0.25); },
    update(ctx) {
      const me = ctx.cast.me, hits = ctx.hussTimes('b03').map((h) => h + 0.03), h = lastBefore(hits, ctx.t);
      me.pose('slam', ctx.t, { hits }); me.face(h != null && ctx.t - h < 0.22 ? 'huss' : 'determined', ctx.t);
      const s = ctx.set; s.lights.glow.position.set(21.6, -0.6, 2.6); s.lights.glow.intensity = 28; s.lights.glow.distance = 10;
      s.lights.glow2.position.set(21.2, -0.4, -2.4); s.lights.glow2.intensity = 12; s.lights.glow2.color.set('#40ff70');
      s.seaGlow(22, 2.8, 0.7, 3.5);
      const f = humanFace(me);
      const cams = [{ pos: V(23.4, 0.7, 1.9), look: f.clone().add(up(-0.2)), fov: 40 }, { pos: V(22.1, 1.85, 0.2), look: f, fov: 30 }, { pos: V(27, 5.5, 6.5), look: V(20.5, 0.6, 0.6), fov: 44 }];
      cam(ctx, cams[i], 0.35); ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
      ctx.fx.vignette(0.45);
    },
  })),
  // ── b04 "Fifty years ago, the lighthouse keeper whistled the same tune every night."  — flashback at dusk
  {
    name: 'flashback lighthouse', start: 'b04-0.1', ...HARB('dusk', { seaAmp: 0.15 }),
    setup(ctx) {
      const th = -0.84, k = dressKeeper(ctx);
      put(ctx, 'keeper', [LH.x + Math.sin(th) * 2.05, LH.gallery + 0.18, LH.z + Math.cos(th) * 2.05], th);
      const N = ctx.props.notes; ctx.add(N);
      ctx.store = { th };
    },
    update(ctx, lt) {
      const k = ctx.cast.keeper; keeperLean(k, ctx.t);
      const N = ctx.props.notes; N.position.copy(humanFace(k)); N.userData.set(ctx.t, 1, [-0.8, 0.7, 0.5], 0.55, 0.5);
      ctx.cam.move({ pos: V(37, 2.2, -6), look: V(LH.x, 15, LH.z), fov: 50 }, { pos: V(39.5, 3.4, -7.5), look: V(LH.x, 17.5, LH.z), fov: 46 }, clamp(lt / 1.6, 0, 1), ease.inOutSine);
      ctx.fx.overlay('#ffb060', 0.1); ctx.fx.vignette(0.6);
      tag(ctx, '50 YEARS AGO', ctx.time('b04') + 0.1, Infinity, { y: 0.14, size: 64, bg: 'rgba(90,50,20,0.85)', fill: '#ffe9c0' });
    },
  },
  {
    name: 'keeper whistling', start: 'b04.w4-0.1', ...HARB('dusk', { seaAmp: 0.15 }),
    setup(ctx) {
      const th = -0.84; dressKeeper(ctx);
      put(ctx, 'keeper', [LH.x + Math.sin(th) * 2.05, LH.gallery + 0.18, LH.z + Math.cos(th) * 2.05], th);
      ctx.add(ctx.props.notes); ctx.store = { th };
    },
    update(ctx, lt) {
      const k = ctx.cast.keeper, th = ctx.store.th; keeperLean(k, ctx.t);
      const f = humanFace(k), N = ctx.props.notes; N.position.copy(f).add(V(0, 0.05, 0)); N.userData.set(ctx.t, 1, [-0.9, 0.6, 0.4], 0.32, 0.55);
      const a = th + 0.55, r0 = 6.2, r1 = 5.0;
      ctx.cam.move({ pos: V(LH.x + Math.sin(a) * r0, LH.gallery + 0.9, LH.z + Math.cos(a) * r0), look: f.clone().add(V(0, -0.15, 0)), fov: 38 },
        { pos: V(LH.x + Math.sin(a) * r1, LH.gallery + 1.1, LH.z + Math.cos(a) * r1), look: f.clone().add(V(0, -0.1, 0)), fov: 36 }, clamp(lt / 2.4, 0, 1), ease.inOutSine);
      fill(ctx, V(LH.x + Math.sin(a) * r1, LH.gallery + 1.4, LH.z + Math.cos(a) * r1), 0.6, '#ffd8b0');
      ctx.fx.overlay('#ffb060', 0.1); ctx.fx.vignette(0.6);
    },
  },
  // ── b05 "Then one night, the sea whistled it back, and a tentacle the size of a bus took his lamp."
  {
    name: 'the sea whistles back', start: 'b05-0.1', ...HARB('night', { seaAmp: 0.2 }),
    setup(ctx) {
      const th = -0.84; dressKeeper(ctx);
      put(ctx, 'keeper', [LH.x + Math.sin(th) * 2.05, LH.gallery + 0.18, LH.z + Math.cos(th) * 2.05], th);
      ctx.add(ctx.props.notesG);
    },
    update(ctx, lt) {
      const k = ctx.cast.keeper; keeperLean(k, ctx.t, false); k.face(ctx.t > A(ctx, 'b05.w5') ? 'shocked' : 'neutral', 1);
      k.joints.head.rotation.x += 0.35;
      const bx = 46, bz = -10, bh = 3.4 * smooth(clamp((ctx.t - A(ctx, 'b05.w3')) / 1.0, 0, 1));
      ctx.set.bulge(bx, bz, bh, 6); ctx.set.seaGlow(bx, bz, 0.22 * bh / 3.4, 5);
      const N = ctx.props.notesG; N.position.set(bx, SEA_Y + bh, bz); N.userData.set(ctx.t, clamp((ctx.t - A(ctx, 'b05.w5')) / 0.3, 0, 1), [0.5, 1.6, -0.6], 1.6, 0.4);
      const c = { pos: V(37, 1.6, 1.5), look: V(LH.x - 3, 12, LH.z + 2), fov: 54 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.5);
      ctx.fx.vignette(0.5);
    },
  },
  {
    name: 'tentacle rises', start: 'b05.w9-0.1', ...HARB('night', { seaAmp: 0.25 }),
    setup(ctx) { bigT(ctx); },
    update(ctx, lt) {
      const tG = ctx.markers.grab, s = ctx.set;
      const base = V(LH.x - 9, SEA_Y - 2, LH.z + 8), lamp = V(LH.x, LH.lampY, LH.z);
      const rise = smooth(clamp((ctx.t - A(ctx, 'b05.w10')) / 0.9, 0, 1));
      const yank = clamp((ctx.t - tG) / 0.45, 0, 1);
      const target = rise < 1 ? base.clone().lerp(lamp.clone().add(V(-1.5, 6, 2)), rise) : lamp.clone().add(V(0, 0.2 + 1.2 * (1 - smooth(clamp((ctx.t - tG + 0.5) / 0.5, 0, 1))), 0));
      const tgt = yank > 0 ? lamp.clone().lerp(V(LH.x - 14, SEA_Y - 6, LH.z + 12), ease.inCubic(yank)) : target;
      const tip = tentReach(ctx, 0, base, tgt, 34, 1.7, 0.35, { wrap: ctx.t > tG - 0.4 ? 0.5 : 0 });
      if (yank > 0) { const LU = s.lighthouse.userData; LU.lamp.position.copy(s.lighthouse.worldToLocal(tip.clone())); }
      const sp = ctx.props.splash; ctx.add(sp); sp.position.set(base.x, SEA_Y, base.z); sp.userData.set(ctx.t - A(ctx, 'b05.w10') + 0.1, 2.2);
      const c = { pos: V(34, 2.0, 4.5), look: V(LH.x - 4, 13, LH.z), fov: 54 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.4);
      if (ctx.t > tG) ctx.cam.shake(0.4 * Math.max(0, 1 - (ctx.t - tG) / 0.5), ctx.t, 3);
      ctx.fx.vignette(0.45);
    },
  },
  {
    name: 'keeper in the dark', start: 'grab+0.32', ...HARB('night', { seaAmp: 0.25, lamp: 'gone' }),
    setup(ctx) {
      const th = -0.84; dressKeeper(ctx);
      put(ctx, 'keeper', [LH.x + Math.sin(th) * 2.05, LH.gallery + 0.18, LH.z + Math.cos(th) * 2.05], th);
      ctx.store = { th };
    },
    update(ctx, lt) {
      const k = ctx.cast.keeper, th = ctx.store.th, P = ctx.props;
      k.pose('stunned', ctx.t); k.face('shocked', 1);
      // the cap flies off
      const u = lt;
      P.cap.position.set(0.05 * u, 0.6 + 1.6 * u - 2.5 * u * u, -0.3 * u); P.cap.rotation.set(-0.08 - 3 * u, 0.8 * u, 1.5 * u);
      const a = th + 0.3, c = { pos: V(LH.x + Math.sin(a) * 4.6, LH.gallery + 1.2, LH.z + Math.cos(a) * 4.6), look: humanFace(k).add(V(0, 0.25, 0)), fov: 40 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.7, '#9fb4ff');
      ctx.cam.shake(0.15, ctx.t, 5);
      ctx.fx.vignette(0.6);
    },
  },
  // ── b06 "We call it the Gulp. One giant green eye, a hundred tentacles, and it copies every sound it hears."
  {
    name: 'gulp rises', start: 'b06-0.12', ...HARB('night', { seaAmp: 0.3, lamp: 'gone' }),
    setup(ctx) {
      gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15);
      const P = ctx.props; ctx.add(P.boatA); P.boatA.position.set(48, 0, -7); P.boatA.rotation.y = 0.5; ctx.add(P.boatB); P.boatB.position.set(51, 0, 12); P.boatB.rotation.y = -0.7;
      ctx.add(P.fog); P.fog.position.set(60, SEA_Y, 0);
    },
    update(ctx, lt) {
      const P = ctx.props, rise = ease.outCubic(clamp((ctx.t - A(ctx, 'b06') + 0.1) / 0.9, 0, 1));
      const eye = gulpSet(ctx, { rise, lid: 0, glow: 1, tentRise: rise, sway: 1 }); eyeLight(ctx, eye, 1);
      P.boatA.userData.set(ctx.t, 0.2, 1); P.boatB.userData.set(ctx.t, 0.2, 2); P.fog.userData.set(ctx.t, 1);
      ctx.set.bulge(GULP_POS.x - 10, GULP_POS.z, 1.2 * (1 - rise), 14);
      const c = { pos: V(27, 1.4, 8), look: V(60, 8 - 3 * (1 - rise), 2), fov: 52 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.3);
      if (ctx.t < A(ctx, 'b06') + 1.3) ctx.cam.shake(0.18, ctx.t, 4);
      stamp(ctx, 'THE GULP', A(ctx, 'b06.w4') - 0.03, { y: 0.16, size: 160, fill: '#5aff7a', stroke: '#06301a', rot: -0.05 });
      ctx.fx.vignette(0.4);
    },
  },
  {
    name: 'the eye', start: 'b06.w5-0.1', ...HARB('night', { seaAmp: 0.3, lamp: 'gone' }),
    setup(ctx) { gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); },
    update(ctx, lt) {
      const blink = Math.max(0, 1 - Math.abs(ctx.t - A(ctx, 'b06.w8') - 0.15) / 0.12);
      const eye = gulpSet(ctx, { rise: 1, lid: blink, glow: 1, lookX: -0.1, lookY: 0.12, sway: 1 }); eyeLight(ctx, eye, 1);
      ctx.cam.move({ pos: V(eye.x - 32, eye.y + 0.4, eye.z + 4), look: eye.clone().add(up(-1)), fov: 36 }, { pos: V(eye.x - 24, eye.y + 0.2, eye.z + 2), look: eye.clone().add(up(-0.8)), fov: 34 }, clamp(lt / 1.1, 0, 1), ease.outCubic);
      ctx.fx.vignette(0.5);
    },
  },
  {
    name: 'hundred tentacles', start: 'b06.w9-0.1', ...HARB('night', { seaAmp: 0.3, lamp: 'gone' }),
    setup(ctx) {
      gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15);
      const P = ctx.props; ctx.add(P.boatA); P.boatA.position.set(46, 0, -8); P.boatA.rotation.y = 0.5; ctx.add(P.boatB); P.boatB.position.set(49, 0, 13); P.boatB.rotation.y = -0.7;
      ctx.add(P.fog); P.fog.position.set(60, SEA_Y, 0);
    },
    update(ctx, lt) {
      const P = ctx.props, eye = gulpSet(ctx, { rise: 1, glow: 1, sway: 1.6 }); eyeLight(ctx, eye, 1);
      P.boatA.userData.set(ctx.t, 0.25, 1); P.boatB.userData.set(ctx.t, 0.25, 2); P.fog.userData.set(ctx.t, 1);
      const c0 = { pos: V(16, 7, 26), look: V(58, 6, 1), fov: 50 }, c1 = { pos: V(19, 13, 31), look: V(58, 5, 1), fov: 50 };
      ctx.cam.move(c0, c1, clamp(lt / 1.3, 0, 1), ease.inOutSine); fill(ctx, c1.pos, 0.3);
      ctx.fx.vignette(0.4);
    },
  },
  {
    name: 'gull squawk copied', start: 'b06.w12-0.1', ...HARB('night', { seaAmp: 0.3, lamp: 'gone' }),
    setup(ctx) {
      gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15);
      put(ctx, 'gull', [PIER.x1 - 0.08, 1.0, PIER.endHalf - 0.08], -PI / 2 + 0.5);
    },
    update(ctx, lt) {
      const tq = A(ctx, 'b06.w14'), tb = tq + 0.55, g = ctx.cast.gull;
      const flash = Math.max(0, 1 - Math.abs(ctx.t - tb) / 0.25);
      const eye = gulpSet(ctx, { rise: 1, glow: 1 + flash, flash, sway: 1, lookX: 0.35 }); eyeLight(ctx, eye, 1 + flash * 1.5);
      if (ctx.t > tq && ctx.t < tq + 0.4) { g.pose('huss', ctx.t); g.face('huss', 0); } else if (ctx.t > tb) { g.pose('flap', ctx.t); g.face('shocked', 0); } else { g.pose('idle', ctx.t); g.face('neutral', 0); }
      const c = { pos: V(PIER.x1 - 4.2, 1.35, PIER.endHalf + 1.6), look: V(PIER.x1 + 2.5, 2.4, 2.6), fov: 42 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.6);
      if (ctx.t > tq && ctx.t < tb) tag(ctx, 'squawk', tq, tb, { x: 0.62, y: 0.42, size: 54, bg: null, rot: 0.1 });
      if (ctx.t > tb) { stamp(ctx, 'SQUAWK!!', tb, { y: 0.2, size: 170, fill: '#5aff7a', stroke: '#06301a' }); ctx.cam.shake(0.5 * Math.max(0, 1 - (ctx.t - tb) / 0.6), ctx.t, 11); }
      ctx.fx.vignette(0.4);
    },
  },
  // ── b07 day montage: "So now there are rules. No whistling. No squeaky shoes. No kettles. And near the water, we only whisper."
  {
    name: 'rules day wide', start: 'b07-0.12', ...HARB('day', { seaAmp: 0.14, bunting: true, lamp: 'off' }),
    setup(ctx) {
      const P = ctx.props; ctx.add(P.van); P.van.position.set(-2.0, 0, 10.5); P.van.rotation.y = PI / 2;
      const ids = TOWN_IDS.slice(0, 8);
      ids.forEach((id, i) => put(ctx, id, [-3.0 + (i % 2) * 0.8, 0, -3 + i * 1.6], 0));
      ctx.store = { ids };
    },
    update(ctx, lt) {
      ctx.store.ids.forEach((id, i) => { const c = ctx.cast[id], dir = i % 2 ? 1 : -1; c.root.position.z = -12 + ((i * 3.1 + ctx.t * 1.1 * dir) % 24 + 24) % 24; c.root.rotation.y = dir > 0 ? 0 : PI; c.pose('walk', ctx.t + i); c.face('smile', ctx.t + i); });
      ctx.cam.move({ pos: V(-9, 4.0, -12), look: V(4, 1.0, 3), fov: 50 }, { pos: V(-8.2, 3.4, -10.5), look: V(5, 1.2, 3), fov: 48 }, clamp(lt / 1.4, 0, 1));
      tag(ctx, 'THE RULES', A(ctx, 'b07.w4'), Infinity, { y: 0.16, size: 84, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  {
    name: 'no whistling: shush', start: 'b07.w5-0.1', ...HARB('day', { seaAmp: 0.14, bunting: true, lamp: 'off' }),
    setup(ctx) { put(ctx, 'mum', [-22.2, 0.12, 5.3], PI / 2 - 0.2); put(ctx, 'kid', [-21.1, 0.12, 5.2], -PI / 2 + 0.3); },
    update(ctx, lt) {
      const m = ctx.cast.mum, k = ctx.cast.kid, ts = A(ctx, 'b07.w6');
      if (ctx.t > ts - 0.1) shush(m, ctx.t); else { m.pose('idle', ctx.t); m.face('smile', 1); }
      k.pose('idle', ctx.t); k.face(ctx.t > ts + 0.25 ? 'sweat' : 'shocked', 1);
      ctx.cam.move({ pos: V(-21.0, 1.1, 1.7), look: V(-21.6, 1.15, 5.3), fov: 36 }, { pos: V(-21.3, 1.15, 2.4), look: V(-21.6, 1.2, 5.3), fov: 34 }, clamp(lt / 1, 0, 1));
      tag(ctx, 'NO WHISTLING', A(ctx, 'b07.w5'), Infinity, { y: 0.16 });
    },
  },
  {
    name: 'no squeaky shoes', start: 'b07.w7-0.1', ...HARB('day', { seaAmp: 0.14, bunting: true, lamp: 'off' }),
    setup(ctx) {
      put(ctx, 'tiptoe', [-30, 0.12, -5.3], PI / 2);
      const P = ctx.props, c = ctx.cast.tiptoe; ctx.add(P.shoeL, c.joints.handL); ctx.add(P.shoeR, c.joints.handR); P.shoeL.position.set(0, -0.1, 0.05); P.shoeR.position.set(0, -0.1, 0.05);
    },
    update(ctx, lt) {
      const c = ctx.cast.tiptoe, x = -30 + lt * 0.7;
      c.root.position.set(x, 0.12 + 0.05 + 0.03 * Math.abs(Math.sin(ctx.t * 5)), -5.3);
      c.pose('walk', ctx.t, { speed: 0.55 }); c.face('determined', 1);
      const J = c.joints; J.torso.rotation.x += 0.12; J.armL.rotation.set(-0.5, 0, -0.5); J.armR.rotation.set(-0.5, 0, 0.5); J.foreArmL.rotation.x = -1.2; J.foreArmR.rotation.x = -1.2;
      J.footL.rotation.x += 0.6; J.footR.rotation.x += 0.6;
      ctx.cam.set({ pos: V(x + 3.2, 0.55, -3.4), look: V(x, 0.7, -5.3), fov: 40 });
      tag(ctx, 'NO SQUEAKY SHOES', A(ctx, 'b07.w7'), Infinity, { y: 0.16, size: 70 });
    },
  },
  {
    name: 'no kettles sign', start: 'b07.w10-0.1', ...HARB('day', { seaAmp: 0.14, bunting: true, lamp: 'off' }),
    setup(ctx) {
      const P = ctx.props; ctx.add(P.kettleSign); P.kettleSign.position.set(-16, 2.3, -5.78); P.kettleSign.rotation.set(0, 0, 0.03);
      put(ctx, TOWN_IDS[3], [-19, 0.12, -5.0], PI / 2);
    },
    update(ctx, lt) {
      const c = ctx.cast[TOWN_IDS[3]]; c.root.position.x = -19 + lt * 1.2; c.pose('walk', ctx.t); c.face('smile', 1);
      ctx.cam.move({ pos: V(-15.0, 2.2, -1.6), look: V(-16, 2.65, -5.8), fov: 40 }, { pos: V(-15.5, 2.5, -3.3), look: V(-16, 2.7, -5.8), fov: 36 }, clamp(lt / 1.1, 0, 1), ease.outCubic);
      stamp(ctx, 'NO KETTLES', A(ctx, 'b07.w11') - 0.05, { y: 0.16, size: 120, rot: 0.05 });
    },
  },
  {
    name: 'whisper at the stall', start: 'b07.w12-0.1', ...HARB('day', { seaAmp: 0.14, bunting: true, lamp: 'off' }),
    setup(ctx) {
      put(ctx, 'fishmonger', [STALL.x - 0.2, 0, STALL.z + 0.75], PI + 0.25);
      put(ctx, 'oldman', [STALL.x + 1.55, 0, STALL.z - 0.35], -PI / 2 - 0.25);
    },
    update(ctx, lt) {
      const f = ctx.cast.fishmonger, o = ctx.cast.oldman;
      f.pose('idle', ctx.t, { intensity: 0.4 }); f.face('squint', 1); f.joints.head.rotation.x += 0.1;
      whisper(o, ctx.t); o.face('sweat', 1);
      ctx.cam.move({ pos: V(-1.5, 2.0, -4.2), look: V(-1.5, 1.45, 5.5), fov: 38 }, { pos: V(-1.5, 1.95, -3.2), look: V(-1.5, 1.6, 5.5), fov: 29 }, clamp(lt / 1.6, 0, 1));
      tag(ctx, 'shhh...', A(ctx, 'b07.w16'), Infinity, { x: 0.36, y: 0.33, size: 64, bg: 'rgba(255,255,255,0.85)', fill: '#1d1d22', stroke: '#ffffff' });
    },
  },
  // ── b08 "Mr. Dobbs bought a kettle anyway. His kitchen is now at the bottom of the harbour."
  {
    name: 'dobbs and his kettle', start: 'b08-0.12', ...HARB('day', { seaAmp: 0.14, lamp: 'off' }),
    setup(ctx) {
      const d = put(ctx, 'dobbs', [DOBBS.x + 0.9, 0.2, DOBBS.z], PI / 2);
      const K = ctx.props.kettle; ctx.add(K, d.joints.handR); K.position.set(0, -0.12, 0.08); K.rotation.set(PI / 2, 0, 0); K.scale.setScalar(1.35);
    },
    update(ctx, lt) {
      const d = ctx.cast.dobbs; d.pose('idle', ctx.t, { intensity: 0.3 }); d.face('grin', 1.2);
      d.joints.armR.rotation.x = -0.9; d.joints.armR.rotation.z = 0.75; d.joints.foreArmR.rotation.x = -0.5;
      ctx.props.kettle.userData.set(ctx.t, 1);
      ctx.cam.move({ pos: V(4.6, 1.65, -13.2), look: V(DOBBS.x + 0.9, 1.5, DOBBS.z), fov: 34 }, { pos: V(3.4, 1.6, -13.5), look: V(DOBBS.x + 0.9, 1.5, DOBBS.z), fov: 32 }, clamp(lt / 1.2, 0, 1));
      tag(ctx, 'FWEEEE', A(ctx, 'b08') + 0.25, Infinity, { x: 0.68, y: 0.36, size: 58, bg: null, rot: 0.15, fill: '#ffffff' });
    },
  },
  {
    name: 'kitchen ripped away', start: 'b08.w2-0.1', ...HARB('day', { seaAmp: 0.18, lamp: 'off' }),
    setup(ctx) {
      bigT(ctx);
      const d = put(ctx, 'dobbs', [DOBBS.x + 0.35, 0.03, DOBBS.z], PI / 2);
      const K = ctx.props.kettle; ctx.add(K, d.joints.handR); K.position.set(0, -0.12, 0.08); K.rotation.set(PI / 2, 0, 0); K.scale.setScalar(1.35);
    },
    update(ctx, lt) {
      const s = ctx.set, FR = s.frontRoom, d = ctx.cast.dobbs, t0 = ctx.time('b08.w2') - 0.05;
      const home = V(DOBBS.x + 1.9, 0, DOBBS.z), base = V(9.5, SEA_Y - 3, DOBBS.z + 1.5);
      const u = ctx.t - t0;
      const rise = smooth(clamp(u / 0.45, 0, 1)), wrapK = smooth(clamp((u - 0.35) / 0.35, 0, 1)), yank = clamp((u - 0.8) / 0.75, 0, 1);
      const roomTop = home.clone().add(V(0.3, 4.3, 0));
      let tgt = base.clone().lerp(roomTop.clone().add(V(2, 3, 0)), rise).lerp(roomTop, wrapK);
      const yk = ease.inCubic(yank);
      const roomPos = home.clone().lerp(V(13, SEA_Y - 5, DOBBS.z + 3), yk); roomPos.y += Math.sin(PI * yank) * 3;
      if (yank > 0) tgt = roomPos.clone().add(V(0.3, 4.3, 0));
      tentReach(ctx, 0, base, tgt, 16, 1.0, 0.25, { wrap: 1.3 * wrapK });
      FR.position.copy(roomPos); FR.rotation.set(0, 0, -0.9 * yk);
      FR.visible = yank < 0.98;
      d.pose(yank > 0 ? 'stunned' : 'idle', ctx.t); d.face(yank > 0 ? 'shocked' : 'grin', 1.2);
      d.joints.armR.rotation.x = -0.9; d.joints.armR.rotation.z = 0.75; d.joints.foreArmR.rotation.x = -0.5;
      ctx.props.kettle.userData.set(ctx.t, 1);
      const sp = ctx.props.splash; ctx.add(sp); sp.position.set(base.x, SEA_Y, base.z); sp.userData.set(u, 1.6);
      const sp2 = ctx.props.splash2; ctx.add(sp2); sp2.position.set(10, SEA_Y, DOBBS.z + 3); sp2.userData.set(u - 1.45, 2.4);
      ctx.cam.set({ pos: V(9.5, 6.5, 1.0), look: V(1.5, 1.8, DOBBS.z - 0.5), fov: 50 });
      if (u > 0.8 && u < 1.6) ctx.cam.shake(0.3, ctx.t, 2);
    },
  },
  {
    name: 'dobbs in the doorway', start: 'b08.w6-0.1', ...HARB('day', { seaAmp: 0.14, lamp: 'off', frontRoom: false }),
    setup(ctx) {
      const d = put(ctx, 'dobbs', [DOBBS.x + 0.35, 0.03, DOBBS.z], PI / 2);
      const K = ctx.props.kettle; ctx.add(K, d.joints.handR); K.position.set(0, -0.12, 0.08); K.rotation.set(PI / 2, 0, 0); K.scale.setScalar(1.35);
      const S = ctx.props.snore; ctx.add(S); S.position.set(6, SEA_Y, DOBBS.z + 2.5);
    },
    update(ctx, lt) {
      const d = ctx.cast.dobbs; d.pose('idle', ctx.t, { intensity: 0.2 }); d.face('neutral', 1.2);
      d.joints.armR.rotation.x = -0.9; d.joints.armR.rotation.z = 0.75; d.joints.foreArmR.rotation.x = -0.5;
      ctx.props.kettle.userData.set(ctx.t, 0.6);
      ctx.props.snore.userData.set(ctx.t, 0.0);
      ctx.cam.move({ pos: V(2.6, 1.55, -13.0), look: V(DOBBS.x + 0.35, 1.3, DOBBS.z), fov: 36 }, { pos: V(1.6, 1.5, -13.3), look: V(DOBBS.x + 0.35, 1.35, DOBBS.z), fov: 34 }, clamp(lt / 2.2, 0, 1));
      quoteCard(ctx, 'It was a really nice kettle.', 'Mr. Dobbs', A(ctx, 'b08.w12') - 0.05, A(ctx, 'b09') - 0.15, { y: 0.3, byAt: A(ctx, 'b08.w12') + 0.45 });
    },
  },
  // ── b09 "The fishermen talk with flags."
  {
    name: 'flag talk', start: 'b09-0.12', ...HARB('day', { seaAmp: 0.14, lamp: 'off' }),
    setup(ctx) {
      const P = ctx.props;
      ctx.add(P.boatA); P.boatA.position.set(12.5, 0, -5.4); P.boatA.rotation.y = 0.35;
      ctx.add(P.boatB); P.boatB.position.set(18.5, 0, -8.0); P.boatB.rotation.y = 0.35;
      put(ctx, 'fisher1', [12.5, 0, -5.4], 1.95); put(ctx, 'fisher2', [18.5, 0, -8.0], 1.95 - PI);
      const f1 = ctx.cast.fisher1, f2 = ctx.cast.fisher2;
      ctx.add(P.flagL, f1.joints.handL); ctx.add(P.flagR, f1.joints.handR); ctx.add(P.flagL2, f2.joints.handL); ctx.add(P.flagR2, f2.joints.handR);
      for (const f of [P.flagL, P.flagR, P.flagL2, P.flagR2]) { f.position.set(0, -0.05, 0); f.rotation.set(PI, 0, 0); }
    },
    update(ctx, lt) {
      const P = ctx.props;
      P.boatA.userData.set(ctx.t, 0.05, 1); P.boatB.userData.set(ctx.t, 0.05, 2.3);
      [['fisher1', P.boatA, 0], ['fisher2', P.boatB, 1]].forEach(([id, b, k]) => {
        const c = ctx.cast[id]; b.updateMatrixWorld(true);
        const deck = b.userData.inner.localToWorld(V(0.6 * (k ? -1 : 1), 0.66, 0));
        c.root.position.copy(deck);
        c.pose('idle', ctx.t, { intensity: 0.2 }); c.face('neutral', 1.5);
        const ph = Math.floor((ctx.t * 1.6 + k * 0.5)) % 4, J = c.joints;
        const poses = [[-2.6, -1.2], [-1.6, -2.7], [-2.9, -0.2], [-0.9, -2.4]];
        const [al, ar] = poses[(ph + k * 2) % 4];
        J.armL.rotation.set(0, 0, al * -1 * 0.95); J.armR.rotation.set(0, 0, ar * 0.95); J.foreArmL.rotation.x = 0; J.foreArmR.rotation.x = 0;
      });
      ctx.cam.move({ pos: V(7.4, 3.2, 3.6), look: V(15.4, 0.9, -6.6), fov: 46 }, { pos: V(7.9, 3.1, 3.2), look: V(15.4, 0.9, -6.6), fov: 45 }, clamp(lt / 1.4, 0, 1));
    },
  },
  // ── b10 "Until last week, when the biggest storm ever hit."
  {
    name: 'storm wide', start: 'b10-0.12', ...HARB('storm', { seaAmp: 1.1, lamp: 'flicker', boatsRock: 1 }),
    setup(ctx) { ctx.add(ctx.props.fog); ctx.props.fog.position.set(30, SEA_Y, 0); },
    update(ctx, lt) {
      const c = { pos: V(-3.2, 3.8, 9.5), look: V(22, 1.0, -5), fov: 52 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.3); rainAt(ctx, c.pos, 1, 0.35);
      lightning(ctx, [A(ctx, 'b10') + 0.05, A(ctx, 'b10.w2'), A(ctx, 'b10.w5') - 0.1], { at: [60, 48, -30] });
      ctx.props.fog.userData.set(ctx.t, 1);
      for (const [k, sp, x] of [[0, ctx.props.splash, 12], [1, ctx.props.splash2, 26]]) { ctx.add(sp); sp.position.set(x, SEA_Y + 0.5, k ? -2.4 : 2.4); sp.userData.set(((ctx.t + k * 0.7) % 1.4), 1.3); }
      ctx.fx.vignette(0.5);
    },
  },
  {
    name: 'waves over the pier', start: 'b10.w5-0.1', ...HARB('storm', { seaAmp: 1.3, lamp: 'flicker', boatsRock: 1.2 }),
    update(ctx, lt) {
      const c = { pos: V(9, 1.6, -6.5), look: V(17, 1.2, 0.5), fov: 48 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.4); rainAt(ctx, c.pos, 1, 0.4);
      lightning(ctx, [A(ctx, 'b10.w6'), A(ctx, 'b10.w8') + 0.05], { at: [40, 44, 30] });
      for (const [k, sp, x] of [[0, ctx.props.splash, 16], [1, ctx.props.splash2, 21]]) { ctx.add(sp); sp.position.set(x, SEA_Y + 0.4, k ? -2.5 : 2.5); sp.userData.set(((ctx.t + k * 0.5) % 1.1), 1.5); }
      ctx.cam.shake(0.15, ctx.t, 8);
      ctx.fx.vignette(0.5);
    },
  },
  // ── b11 "Wind blew through the cracked lighthouse window, and the lighthouse started to whistle."
  {
    name: 'lighthouse in the storm', start: 'b11-0.12', ...HARB('storm', { seaAmp: 1.1, lamp: 'flicker', boatsRock: 1 }),
    update(ctx, lt) {
      const c0 = { pos: V(34, 2.6, -3), look: V(LH.x, 14, LH.z), fov: 50 }, c1 = { pos: V(37, 4.5, -6), look: V(LH.x, 16, LH.z), fov: 46 };
      ctx.cam.move(c0, c1, clamp(lt / 1.6, 0, 1), ease.inOutSine); fill(ctx, c1.pos, 0.3); rainAt(ctx, c1.pos, 1, 0.4);
      lightning(ctx, [A(ctx, 'b11') + 0.2, A(ctx, 'b11.w3')], { at: [80, 44, -40] });
      ctx.fx.vignette(0.5);
    },
  },
  {
    name: 'cracked window', start: 'b11.w4-0.1', ...HARB('storm', { seaAmp: 1.1, lamp: 'flicker' }),
    setup(ctx) { const D = ctx.props.drips; ctx.add(D); D.position.set(LH.x, LH.gallery - 1.6, LH.z + 1.92); },
    update(ctx, lt) {
      const tf = ctx.markers.fweee, s = ctx.set, LU = s.lighthouse.userData;
      ctx.props.drips.userData.set(ctx.t);
      const wk = clamp((ctx.t - tf + 0.6) / 0.6, 0, 1);
      LU.crackM.emissiveIntensity = 0.0; LU.crackM.emissive.set('#bfe8ff'); LU.crackM.emissiveIntensity = wk * (0.35 + 0.25 * Math.sin(ctx.t * 30));
      const wx = LH.x, wy = LH.gallery - 1.6, wz = LH.z + 1.9;
      const c0 = { pos: V(wx + 1.6, wy + 0.2, wz + 5.6), look: V(wx, wy + 0.5, wz), fov: 42 }, c1 = { pos: V(wx + 0.5, wy, wz + 2.4), look: V(wx, wy + 0.1, wz), fov: 40 };
      ctx.cam.move(c0, c1, clamp(lt / 3.2, 0, 1), ease.inOutSine); fill(ctx, c1.pos, 0.8, '#b0c4ff'); rainAt(ctx, c1.pos, 0.8, 0.45);
      lightning(ctx, [A(ctx, 'b11.w6') + 0.1], { at: [70, 44, 10], shake: 0.1 });
      if (ctx.t > tf) { const d = ctx.t - tf; ctx.fx.text('FWEEEEEE', { x: 0.5 + 0.01 * Math.sin(ctx.t * 40), y: 0.2, size: 130, fill: '#bfe8ff', stroke: '#0a1a33', line: 12, rot: -0.06 + 0.03 * Math.sin(ctx.t * 25), scale: d < 0.15 ? ease.outBack(d / 0.15) : 1 }); ctx.cam.shake(0.12, ctx.t, 12); }
      ctx.fx.vignette(0.5);
    },
  },
  // ── b12 "The harbour went dead quiet. Then the sea whistled back."
  {
    name: 'frozen in the windows', start: 'b12-0.12', ...HARB('night', { seaAmp: 0.05, lamp: 'off' }),
    setup(ctx) {
      const P = ctx.props, s = ctx.set;
      const north = s.houses.filter((h) => h.side < 0).slice(0, 4);
      const who = TOWN_IDS.slice(0, 4);
      north.forEach((h, i) => {
        const bx = h.x + (i % 2 ? 1.2 : -1.2), B = P.bays[i]; ctx.add(B); B.position.set(bx, 0, -7.0); B.rotation.set(0, 0, 0);
        put(ctx, who[i], [bx, 0, -6.55], 0);
      });
      ctx.store = { who };
    },
    update(ctx, lt) {
      ctx.store.who.forEach((id, i) => { const c = ctx.cast[id]; c.pose('stunned', ctx.t + i, { intensity: 0.3 }); c.face('shocked', 1); c.root.rotation.y = 0.35; });
      const c0 = { pos: V(-14.5, 2.0, -0.8), look: V(-22, 1.95, -6.6), fov: 42 }, c1 = { pos: V(-15.3, 2.0, -1.4), look: V(-22, 1.95, -6.6), fov: 40 };
      ctx.cam.move(c0, c1, clamp(lt / 1.6, 0, 1)); fill(ctx, c1.pos, 1.6);
      tag(ctx, '...', A(ctx, 'b12.w3'), Infinity, { y: 0.16, size: 90, bg: null });
      ctx.fx.vignette(0.45);
    },
  },
  {
    name: 'the eye rises', start: 'b12.w5-0.1', ...HARB('night', { seaAmp: 0.05, lamp: 'off' }),
    setup(ctx) { gulpAt(ctx, GULP_POS.x - 6, GULP_POS.z, 15); ctx.add(ctx.props.notesG); },
    update(ctx, lt) {
      const tb = ctx.markers.back, rise = ease.outCubic(clamp((ctx.t - tb + 0.42) / 0.6, 0, 1));
      const eye = gulpSet(ctx, { rise, glow: 1, tentRise: rise, sway: 1 }); eyeLight(ctx, eye, rise);
      const bh = 3 * smooth(clamp((ctx.t - A(ctx, 'b12.w7')) / 0.4, 0, 1)) * (1 - rise);
      ctx.set.bulge(GULP_POS.x - 14, GULP_POS.z, bh, 10); ctx.set.seaGlow(GULP_POS.x - 14, GULP_POS.z, 0.6 * smooth(clamp((ctx.t - A(ctx, 'b12.w7')) / 0.4, 0, 1)), 12);
      const N = ctx.props.notesG; N.position.set(GULP_POS.x - 14, SEA_Y + bh, GULP_POS.z); N.userData.set(ctx.t, clamp((ctx.t - A(ctx, 'b12.w8')) / 0.2, 0, 1) * (1 - rise), [-1.5, 1.4, 0], 1.6, 0.5);
      const c = { pos: V(24, 1.6, 0.0), look: V(50, 4 + 3 * rise, 2), fov: 46 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.4);
      if (rise > 0 && rise < 1) ctx.cam.shake(0.3, ctx.t, 6);
      ctx.fx.vignette(0.45);
    },
  },
  // ── b13 HUSS ×6 — sprinting down the pier in the rain, tentacles crashing left and right
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `pier sprint #${i + 1}`, start: i === 0 ? 'b13.h0-0.12' : `b13.h${i}-0.03`, ...HARB('storm', { seaAmp: 0.8, lamp: 'off', boatsRock: 0.6 }),
    setup(ctx) { bigT(ctx); gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); put(ctx, 'me', [8, 0, 0], PI / 2); },
    update(ctx) {
      const me = ctx.cast.me, hits = ctx.hussTimes('b13').map((h) => h + 0.03), h = lastBefore(hits, ctx.t);
      const t0 = A(ctx, 'b13') - 0.12, x = 6 + (ctx.t - t0) * 4.2;
      me.root.position.set(x, 0, 0.2 * Math.sin(ctx.t * 3)); me.pose('walk', ctx.t, { speed: 2.4 }); me.face(h != null && ctx.t - h < 0.25 ? 'huss' : 'determined', ctx.t);
      me.joints.torso.rotation.x += 0.2;
      const eye = gulpSet(ctx, { rise: 1, glow: 1, sway: 1.4, lookX: 0.2 }); eyeLight(ctx, eye, 0.8);
      // tentacles crash down beside the pier at each hit
      hits.forEach((ht, k) => {
        if (k > 3) return; const slot = k % 4, side = k % 2 ? -1 : 1;
        const hx = 6 + (ht - t0) * 4.2 - 3.5 - k * 0.5, dt = ctx.t - (ht - 0.25);
        const base = V(hx, SEA_Y - 1, side * 7.5), yaw = side > 0 ? PI : 0;
        const bend = dt < 0 ? 0.2 : lerp(0.2, 2.3, ease.inCubic(clamp(dt / 0.28, 0, 1)));
        tentShape(ctx, slot, base, yaw, 11, 0.8, 0.2, { bend, curl: 0.4, wave: 0.1, phase: k });
      });
      const k = lightning(ctx, hits, { at: [x + 30, 40, -30], shake: 0.35 });
      const f = humanFace(me);
      const cams = [
        { pos: V(x + 4.2, 0.8, 0.9), look: V(x, 1.3, 0), fov: 44 },
        { pos: V(x + 0.8, 1.6, -4.6), look: V(x + 0.6, 1.2, 0), fov: 44 },
        { pos: V(x - 6.5, 4.2, 2.6), look: V(x + 7, 1.0, 0), fov: 48 },
        { pos: V(x + 2.3, 1.75, 0.5), look: f, fov: 34 },
        { pos: V(x - 1.5, 7.5, 9.5), look: V(x + 4, 0.2, 0), fov: 46 },
        { pos: V(x + 5.5, 0.5, -1.2), look: V(x, 1.5, 0), fov: 42 },
      ];
      cam(ctx, cams[i], 0.6); rainAt(ctx, cams[i].pos, 1, 0.35); ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
      ctx.fx.vignette(0.45);
    },
  })),
  // ── b14 "Tentacles slammed onto the pier. One grabbed Grandma, still on her bike."
  {
    name: 'tentacles slam the pier', start: 'b14-0.12', ...HARB('storm', { seaAmp: 0.8, lamp: 'off', boatsRock: 0.6 }),
    setup(ctx) { bigT(ctx); gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); put(ctx, 'me', [22, 0, 0], PI / 2 + 0.6); ctx.add(ctx.props.planks); ctx.add(ctx.props.planks2); },
    update(ctx, lt) {
      const me = ctx.cast.me; me.pose('surprised', ctx.t); me.face('shocked', 1);
      const eye = gulpSet(ctx, { rise: 1, glow: 1, sway: 1.4 }); eyeLight(ctx, eye, 0.8);
      const hitsT = [A(ctx, 'b14.w1'), A(ctx, 'b14.w4')], P = ctx.props;
      [[0, 14, 1, P.planks], [1, 28, -1, P.planks2]].forEach(([k, hx, side, pl]) => {
        const dt = ctx.t - (hitsT[k] - 0.3);
        const bend = dt < 0 ? 0.15 : lerp(0.15, 2.0, ease.inCubic(clamp(dt / 0.3, 0, 1)));
        tentShape(ctx, k, V(hx, SEA_Y - 1, side * 8), side > 0 ? PI : 0, 13, 1.0, 0.25, { bend, curl: 0.5, wave: 0.08, phase: k });
        pl.position.set(hx, 0.2, side * 0.5); pl.userData.set(ctx.t - hitsT[k]);
      });
      const c = { pos: V(-2.5, 3.6, 7), look: V(20, 1, 0), fov: 46 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.3); rainAt(ctx, c.pos, 1, 0.35);
      for (const ht of hitsT) if (ctx.t > ht && ctx.t < ht + 0.4) ctx.cam.shake(0.6 * (1 - (ctx.t - ht) / 0.4), ctx.t, 13);
      lightning(ctx, [hitsT[0] + 0.02], { at: [50, 44, -30], shake: 0 });
      ctx.fx.vignette(0.45);
    },
  },
  {
    name: 'grandma grabbed', start: 'b14.w5-0.1', ...HARB('storm', { seaAmp: 0.8, lamp: 'off', boatsRock: 0.6 }),
    setup(ctx) { bigT(ctx); bikeAt(ctx, V(15, 0, -0.2), -PI / 2); },
    update(ctx, lt) {
      const tg = A(ctx, 'b14.w6'), g = ctx.cast.grandma, B = ctx.props.bike;
      const u = ctx.t - tg;
      const ride = V(15 - Math.min(u, 0) * -1.8 * 0, 0, -0.2);
      const startX = 16.5 - clamp(ctx.t - A(ctx, 'b14.w5') + 0.1, 0, 0.45) * 2.2;
      const ground = V(startX, 0, -0.2), lift = smooth(clamp(u / 1.1, 0, 1));
      const hold = ground.clone().lerp(V(startX - 1, 7.5, 2.5), lift); hold.y += 0.25 * Math.sin(ctx.t * 5) * lift;
      const base = V(startX + 2, SEA_Y - 1, 8.5);
      const waist = hold.clone().add(V(0, 1.15, 0));
      const tip = u < -0.25 ? tentReach(ctx, 0, base, waist.clone().add(V(1.5, 4 * (1 + u), 2)), 15, 1.0, 0.25) : tentReach(ctx, 0, base, waist, 15, 1.0, 0.25, { wrap: 0.9 });
      bikeAt(ctx, hold, -PI / 2, 0.15 * Math.sin(ctx.t * 4) * lift);
      rider(g, ctx.t, u > 0 ? 2.6 : 1, u > 0 ? 1 : 0); g.face(u > 0 ? 'shocked' : 'determined', 1);
      B.userData.set(ctx.t, u > 0 ? 2.6 : 1);
      const c = { pos: V(12.4, 1.6, -4.6), look: hold.clone().add(V(0, 0.9, 0)), fov: lerp(50, 38, lift) };
      ctx.cam.set(c); fill(ctx, c.pos, 1.6); rainAt(ctx, c.pos, 1, 0.35);
      { const L2 = ctx.set.lights.glow2; L2.color.set('#d8e4ff'); L2.position.copy(hold).add(V(-2, 2.5, -2.5)); L2.intensity = 30; L2.distance = 14; }
      if (u > 0 && u < 0.3) ctx.cam.shake(0.4, ctx.t, 14);
      ctx.fx.vignette(0.45);
    },
  },
  // ── b15 "Then I remembered. It copies everything. So I grabbed the fish market megaphone."
  {
    name: 'i remembered', start: 'b15-0.12', ...HARB('storm', { seaAmp: 0.7, lamp: 'off' }),
    setup(ctx) { put(ctx, 'me', [-0.6, 0, 2.6], PI / 2 - 0.25); },
    update(ctx, lt) {
      const me = ctx.cast.me, tc = A(ctx, 'b15.w3');
      if (ctx.t < tc) { me.pose('think', ctx.t); me.face('squint', 1); } else { me.pose('idle', ctx.t); me.face('determined', 1); }
      const f = humanFace(me);
      const c0 = { pos: V(2.4, 1.7, 2.3), look: f, fov: 40 }, c1 = { pos: V(2.0, 1.72, 2.4), look: f, fov: 38 };
      ctx.cam.move(c0, c1, clamp(lt / 2.4, 0, 1)); fill(ctx, c1.pos, 1.0); rainAt(ctx, c1.pos, 0.9, 0.35);
      lightning(ctx, [tc - 0.05], { at: [40, 40, 40], shake: 0.1, bolt: false });
      tag(ctx, 'IT COPIES EVERYTHING', tc, Infinity, { y: 0.16, size: 64, bg: 'rgba(30,140,60,0.92)' });
      ctx.fx.vignette(0.45);
    },
  },
  {
    name: 'grab the megaphone', start: 'b15.w6-0.1', ...HARB('storm', { seaAmp: 0.7, lamp: 'off' }),
    setup(ctx) { put(ctx, 'me', [STALL.x + 0.8, 0, STALL.z - 1.3], 0); gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); },
    update(ctx, lt) {
      const me = ctx.cast.me, tg = A(ctx, 'b15.w8') + 0.1, s = ctx.set;
      const eye = gulpSet(ctx, { rise: 1, glow: 1, sway: 1.2 }); eyeLight(ctx, eye, 0.8);
      const run = clamp(ctx.t - tg - 0.35, 0, 9);
      if (ctx.t < tg) { me.pose('point', ctx.t, {}); me.face('determined', 1); }
      else {
        s.megaphone.visible = false; holdMega(ctx, me);
        const turn = smooth(clamp((ctx.t - tg) / 0.35, 0, 1));
        me.root.rotation.y = lerp(0, PI / 2, turn);
        me.root.position.set(STALL.x + 0.8 + run * 4.6, 0, lerp(STALL.z - 1.3, 0.3, smooth(clamp(run / 0.8, 0, 1))));
        if (run > 0) { me.pose('walk', ctx.t, { speed: 2.3 }); me.joints.armR.rotation.x = -1.2; } else megaUp(me, ctx.t, 0.6);
        me.face('determined', 1);
      }
      const p = me.root.position;
      const c = { pos: V(p.x + 3.4, 1.7, p.z - 2.6), look: V(p.x - 0.2, 1.3, p.z + 0.4), fov: 46 };
      ctx.cam.set(c); fill(ctx, c.pos, 2.2); rainAt(ctx, c.pos, 0.9, 0.35);
      ctx.fx.vignette(0.45);
    },
  },
  // ── b16 "And I did the biggest, longest, sleepiest yawn in history."
  {
    name: 'megaphone up', start: 'b16-0.12', ...HARB('night', { seaAmp: 0.4, lamp: 'off' }),
    setup(ctx) { put(ctx, 'me', [42, 0, 0], PI / 2 + 0.15); gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); holdMega(ctx, ctx.cast.me); },
    update(ctx, lt) {
      const me = ctx.cast.me, k = smooth(clamp(lt / 0.5, 0, 1));
      const eye = gulpSet(ctx, { rise: 1, glow: 1, sway: 1 }); eyeLight(ctx, eye, 0.8);
      megaUp(me, ctx.t, k); me.face(ctx.t > A(ctx, 'b16.w5') ? 'sleepy' : 'determined', ctx.t > A(ctx, 'b16.w5') ? 0 : 1);
      const f = humanFace(me);
      const c = { pos: V(43.9, 1.15, -1.6), look: f.clone().add(V(0, 0.05, 0)), fov: 38 };
      ctx.cam.set(c); fill(ctx, c.pos, 1.0);
      ctx.fx.vignette(0.4);
    },
  },
  {
    name: 'the yawn', start: 'yawn-0.15', ...HARB('night', { seaAmp: 0.35, lamp: 'off' }),
    setup(ctx) { put(ctx, 'me', [42, 0, 0], PI / 2 + 0.1); gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); holdMega(ctx, ctx.cast.me); const R = ctx.props.rings; ctx.add(R); },
    update(ctx, lt) {
      const me = ctx.cast.me, ty = ctx.markers.yawn, k = smooth(clamp((ctx.t - ty + 0.1) / 0.35, 0, 1));
      const eye = gulpSet(ctx, { rise: 1, glow: 1, sway: 1 }); eyeLight(ctx, eye, 0.8);
      yawnStretch(me, ctx.t, k); me.face('huss', 0);
      const R = ctx.props.rings, f = humanFace(me);
      R.position.copy(f).add(V(0.5, 0.2, 0)); R.lookAt(eye); R.userData.set(ctx.t - ty, k, 24, 0.9);
      const c0 = { pos: V(39.0, 1.6, -0.6), look: V(50, 2.4, 1.6), fov: 54 }, c1 = { pos: V(38.6, 1.7, -0.7), look: V(50, 2.7, 1.6), fov: 54 };
      ctx.cam.move(c0, c1, clamp(lt / 1, 0, 1)); fill(ctx, V(39.5, 2.2, -1.5), 0.8);
      stamp(ctx, 'YAWN', ty, { y: 0.17, size: 200, fill: '#ffe14a', stroke: '#3a2a00', rot: -0.06 });
      ctx.fx.vignette(0.4);
    },
  },
  // ── b17 "The Gulp copied it. Then it yawned again. And again. Yawns are contagious, even for monsters."
  {
    name: 'gulp copies the yawn', start: 'b17-0.12', ...HARB('night', { seaAmp: 0.3, lamp: 'off' }),
    setup(ctx) { gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); },
    update(ctx, lt) {
      const t0 = A(ctx, 'b17.w2');
      const mo = Math.max(0, Math.sin(PI * clamp((ctx.t - t0) / 0.9, 0, 1)));
      const lid = 0.15 + 0.45 * mo + 0.3 * smooth(clamp((ctx.t - t0 - 0.5) / 0.4, 0, 1)) * (1 - smooth(clamp((ctx.t - t0 - 1.0) / 0.3, 0, 1)));
      const eye = gulpSet(ctx, { rise: 1, glow: 1 - 0.3 * lid, sway: 0.7, lid, mouth: mo, lookY: -0.05 }); eyeLight(ctx, eye, 0.8);
      ctx.cam.move({ pos: V(eye.x - 20, eye.y - 1.5, eye.z - 3), look: eye.clone().add(V(0, -3.2, 0)), fov: 48 }, { pos: V(eye.x - 18, eye.y - 1.4, eye.z - 2.5), look: eye.clone().add(V(0, -3.2, 0)), fov: 48 }, clamp(lt / 1.3, 0, 1));
      ctx.fx.vignette(0.4);
    },
  },
  {
    name: 'yawned again', start: 'b17.w4-0.1', ...HARB('night', { seaAmp: 0.3, lamp: 'off' }),
    setup(ctx) { put(ctx, 'me', [42, 0, 0], PI / 2 + 0.1); gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); holdMega(ctx, ctx.cast.me); },
    update(ctx, lt) {
      const me = ctx.cast.me; megaUp(me, ctx.t, 0.3); me.face('sleepy', 0);
      const ys = [A(ctx, 'b17.w6'), A(ctx, 'b17.w9')];
      let mo = 0; for (const y of ys) mo = Math.max(mo, Math.sin(PI * clamp((ctx.t - y + 0.1) / 0.8, 0, 1)));
      const eye = gulpSet(ctx, { rise: 1, glow: 0.8, sway: 0.5, lid: 0.45 + 0.35 * mo, mouth: mo }); eyeLight(ctx, eye, 0.7);
      const c = { pos: V(38.9, 1.7, -1.1), look: V(50, 4.2, 1.3), fov: 52 };
      ctx.cam.set(c); fill(ctx, V(40.5, 1.8, -1), 0.8);
      ctx.fx.vignette(0.4);
    },
  },
  {
    name: 'tentacles go limp', start: 'b17.w10-0.1', ...HARB('night', { seaAmp: 0.25, lamp: 'off' }),
    setup(ctx) { gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); ctx.add(ctx.props.fog); ctx.props.fog.position.set(60, SEA_Y, 0); },
    update(ctx, lt) {
      const limp = smooth(clamp((ctx.t - A(ctx, 'b17.w10')) / 1.9, 0, 1));
      const eye = gulpSet(ctx, { rise: 1, glow: 0.7, sway: 0.4, lid: 0.6, limp, mouth: 0.2 * Math.max(0, Math.sin(ctx.t * 2)) }); eyeLight(ctx, eye, 0.6);
      ctx.props.fog.userData.set(ctx.t, 1);
      const c0 = { pos: V(12, 11, 34), look: V(60, 2, 2), fov: 46 }, c1 = { pos: V(15, 14, 37), look: V(60, 1.5, 2), fov: 46 };
      ctx.cam.move(c0, c1, clamp(lt / 2.3, 0, 1), ease.inOutSine); fill(ctx, c1.pos, 0.3);
      stamp(ctx, 'CONTAGIOUS', A(ctx, 'b17.w12'), { y: 0.17, size: 120, fill: '#ffe14a', stroke: '#3a2a00', rot: 0.05 });
      ctx.fx.vignette(0.4);
    },
  },
  // ── b18 "It put Grandma down, sank under the waves, and started snoring bubbles."
  {
    name: 'grandma set down', start: 'b18-0.12', ...HARB('night', { seaAmp: 0.25, lamp: 'off' }),
    setup(ctx) { bigT(ctx); bikeAt(ctx, V(30, 5, 0), -PI / 2); },
    update(ctx, lt) {
      const g = ctx.cast.grandma, B = ctx.props.bike, td = A(ctx, 'b18.w3');
      const down = smooth(clamp((ctx.t - A(ctx, 'b18') - 0.05) / (td - A(ctx, 'b18') + 0.1), 0, 1));
      const pos = V(30, lerp(5.5, 0, down), lerp(1.5, -0.2, down));
      const base = V(33, SEA_Y - 1, 8.5), rel = clamp((ctx.t - td - 0.15) / 0.6, 0, 1);
      const waist = pos.clone().add(V(0, 1.15, 0));
      tentReach(ctx, 0, base, rel > 0 ? waist.clone().lerp(V(34, SEA_Y - 3, 8), ease.inCubic(rel)) : waist, 15, 1.0, 0.25, { wrap: 0.9 * (1 - rel) });
      bikeAt(ctx, pos, -PI / 2);
      B.userData.set(ctx.t, down < 1 ? 1 : 0);
      if (ctx.t > td + 0.2) { g.pose('crossArms', ctx.t, { seated: true, seatHeight: 0.8 }); g.face('determined', 1); } else { rider(g, ctx.t, 1.2, 0.2); g.face('sweat', 1); }
      const c = { pos: V(25.6, 1.5, 3.6), look: V(30, 1.3 + 2.5 * (1 - down), 0), fov: 46 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.9);
      ctx.fx.vignette(0.4);
    },
  },
  {
    name: 'gulp sinks', start: 'b18.w4-0.1', ...HARB('night', { seaAmp: 0.2, lamp: 'off' }),
    setup(ctx) { gulpAt(ctx, GULP_POS.x, GULP_POS.z, 15); },
    update(ctx, lt) {
      const ts = A(ctx, 'b18.w4'), sink = smooth(clamp((ctx.t - ts) / 1.0, 0, 1));
      const eye = gulpSet(ctx, { rise: 1 - sink, glow: 0.6, sway: 0.2, lid: 0.8 + 0.2 * smooth(clamp((ctx.t - ts) / 0.4, 0, 1)), limp: 1 }); eyeLight(ctx, eye, 0.4 * (1 - sink));
      ctx.set.bulge(GULP_POS.x - 8, GULP_POS.z, 1.5 * sink * (1 - sink) * 4, 12);
      const c = { pos: V(40, 1.6, -2.2), look: V(60, 3.5 - 2 * sink, 2.5), fov: 48 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.3);
      ctx.fx.vignette(0.4);
    },
  },
  {
    name: 'snoring bubbles', start: 'b18.w8-0.1', ...HARB('night', { seaAmp: 0.15, lamp: 'off' }),
    setup(ctx) { const S = ctx.props.snore; ctx.add(S); S.position.set(56, SEA_Y, 3); },
    update(ctx, lt) {
      const S = ctx.props.snore; S.userData.set(ctx.t, clamp(lt / 0.3, 0, 1), 12, 13, 1.7);
      ctx.set.seaGlow(56, 3, 0.35 + 0.15 * Math.sin(ctx.t * 2), 8);
      const c0 = { pos: V(41, 2.0, -3.2), look: V(56, 5, 3), fov: 46 }, c1 = { pos: V(42.5, 2.4, -2.6), look: V(56, 6, 3), fov: 46 };
      ctx.cam.move(c0, c1, clamp(lt / 1.6, 0, 1)); fill(ctx, c1.pos, 0.3);
      tag(ctx, 'Zzz', A(ctx, 'b18.w10'), Infinity, { y: 0.17, size: 110, bg: null, fill: '#bfefff', stroke: '#1d3a5a' });
      ctx.fx.vignette(0.35);
    },
  },
  // ── b19 HUSS ×3 — dawn: the town carries me down the pier; a faint green glow blinks under it
  ...[0, 1, 2].map((i) => ({
    name: `dawn crowd surf #${i + 1}`, start: i === 0 ? 'b19.h0-0.12' : `b19.h${i}-0.03`, ...HARB('dawn', { seaAmp: 0.12, lamp: 'off', windowGlow: 0.3 }),
    setup(ctx) {
      const ids = TOWN_IDS.slice(0, 10);
      ids.forEach((id, k) => put(ctx, id, [9 + (k % 5) * 0.95, 0, (k < 5 ? -0.85 : 0.85)], k < 5 ? 0.3 : PI - 0.3));
      put(ctx, 'me', [10.9, 0, 0], PI / 2); ctx.store = { ids };
    },
    update(ctx) {
      const hits = ctx.hussTimes('b19').map((h) => h + 0.03), h = lastBefore(hits, ctx.t), me = ctx.cast.me;
      ctx.store.ids.forEach((id, k) => { const c = ctx.cast[id]; c.pose('cheer', ctx.t + k * 0.3, { speed: 1.4 }); c.face(h != null && ctx.t - h < 0.2 ? 'huss' : 'grin', ctx.t + k); });
      me.root.position.set(10.9 + 0.1 * Math.sin(ctx.t * 3), 0.1 * Math.abs(Math.sin(ctx.t * 6)), 0); me.root.rotation.set(0, PI / 2, 0);
      me.pose('crowdSurf', ctx.t, { lift: 2.15 }); me.face(h != null && ctx.t - h < 0.22 ? 'huss' : 'grin', ctx.t);
      const blink = i === 1 ? Math.max(0, Math.sin(PI * clamp((ctx.t - hits[1] - 0.05) / 0.25, 0, 1))) : 0;
      if (blink > 0) { ctx.set.seaGlow(11, 3.5, 1.4 * blink, 3); ctx.set.lights.glow.position.set(11, -0.5, 3); ctx.set.lights.glow.intensity = 40 * blink; ctx.set.lights.glow.distance = 8; }
      const f = humanFace(me);
      const cams = [{ pos: V(13.8, 0.9, 5.2), look: V(10.6, 2.2, 0), fov: 48 }, { pos: V(15, 6.5, 8.5), look: V(10.8, 0.4, 1.2), fov: 46 }, { pos: V(11.4, 3.9, 1.6), look: f, fov: 38 }];
      cam(ctx, cams[i], 0.2); ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
    },
  })),
  // ── b20 "Everyone called me a hero. But I forgot one thing."  — party in the town square
  {
    name: 'hero medal', start: 'b20-0.12', set: 'town', lighting: 'party_night', options: { partyProps: true, fireworks: true, windowGlow: 1, foam: 0 },
    setup(ctx) {
      const S = frameAt(ctx, 'square.stage');
      put(ctx, 'me', S(0.25, 0, 1.3), S.yaw); put(ctx, 'mayor', S(-1.0, 0, 1.2), S.yaw + 1.1);
      const crowd = crowdGrid(ctx, TOWN_IDS, 'square.stage', { cols: 6, dx: 1.2, dz: 1.15, seed: 4, offset: [0, -0.8, 4.0], yaw: PI, hats: true });
      ctx.store = { S, crowd };
    },
    update(ctx, lt) {
      const { S, crowd } = ctx.store, me = ctx.cast.me, m = ctx.cast.mayor, P = ctx.props;
      animateCrowd(crowd, ctx.t, { action: 'cheer' });
      const tm = A(ctx, 'b20.w2');
      m.pose(ctx.t < tm ? 'point' : 'clap', ctx.t); m.face('grin', ctx.t);
      me.pose('idle', ctx.t); me.face('grin', ctx.t);
      if (ctx.t > tm) { ctx.add(P.medal, me.joints.torso); P.medal.position.set(0, 0.5, 0.2); P.medal.rotation.set(0, 0, 0); P.medal.scale.setScalar(1.3); }
      ctx.cam.move({ pos: S(0.5, 3.0, 9.0), look: S(0, 1.9, 1.2), fov: 48 }, { pos: S(0.4, 2.8, 7.6), look: S(0, 1.8, 1.2), fov: 44 }, clamp(lt / 1.4, 0, 1));
      tag(ctx, 'HERO', A(ctx, 'b20.w4'), Infinity, { y: 0.16, size: 96, bg: 'rgba(255,79,163,0.92)' });
    },
  },
  {
    name: 'forgot one thing', start: 'b20.w5-0.1', set: 'town', lighting: 'quiet_night', options: { partyProps: true, fireworks: false, windowGlow: 0.8, foam: 0 },
    setup(ctx) {
      const S = frameAt(ctx, 'square.stage');
      put(ctx, 'me', S(0.25, 0, 1.3), S.yaw); const P = ctx.props; ctx.add(P.medal, ctx.cast.me.joints.torso); P.medal.position.set(0, 0.5, 0.2); P.medal.scale.setScalar(1.3);
      ctx.store = { S };
    },
    update(ctx, lt) {
      const { S } = ctx.store, me = ctx.cast.me;
      const turn = smooth(clamp((ctx.t - A(ctx, 'b20.w7')) / 0.5, 0, 1));
      me.pose('idle', ctx.t, { headYaw: 1.0 * turn }); me.face(turn > 0.3 ? 'sweat' : 'neutral', 1);
      const f = humanFace(me);
      const c = { pos: S(0.6, 2.0, 5.4), look: f.clone().add(up(-0.3)), fov: 38 };
      ctx.cam.set(c); fill(ctx, c.pos, 0.8);
      ctx.fx.vignette(0.35 + 0.3 * turn);
    },
  },
  // ── b21 "It copies every voice. And tonight, the harbour whispered back. In my voice."  — bedroom
  {
    name: 'awake in bed', start: 'b21-0.12', set: 'bedroom', lighting: 'night',
    setup(ctx) { bedroomSetup(ctx); },
    update(ctx, lt) {
      bedroomUpdate(ctx);
      const c0 = { pos: V(0.9, 2.3, 1.9), look: V(-1.3, 1.05, -1.3), fov: 50 }, c1 = { pos: V(0.6, 2.2, 1.6), look: V(-1.3, 1.05, -1.4), fov: 48 };
      ctx.cam.move(c0, c1, clamp(lt / 1.5, 0, 1)); fill(ctx, c1.pos, 0.35, '#9fb4ff');
      ctx.fx.vignette(0.5);
    },
  },
  {
    name: 'whisper on my face', start: 'b21.w4-0.1', set: 'bedroom', lighting: 'night',
    setup(ctx) { bedroomSetup(ctx); },
    update(ctx, lt) {
      bedroomUpdate(ctx);
      const f = humanFace(ctx.cast.me);
      const c0 = { pos: V(-1.2, 1.9, -0.4), look: f, fov: 36 }, c1 = { pos: V(-1.35, 1.75, -0.75), look: f, fov: 34 };
      ctx.cam.move(c0, c1, clamp(lt / 2, 0, 1)); fill(ctx, c1.pos, 0.25, '#9fb4ff');
      const a = clamp((ctx.t - A(ctx, 'b21.w8')) / 0.3, 0, 1) * (0.6 + 0.3 * Math.sin(ctx.t * 3));
      if (a > 0) ctx.fx.text('...huss...', { x: 0.3, y: 0.3 - 0.02 * (ctx.t - A(ctx, 'b21.w8')), size: 60, font: 'narr', fill: '#7dff8a', stroke: '#06301a', line: 6, alpha: a, rot: -0.12 });
      ctx.fx.vignette(0.55);
    },
  },
  {
    name: 'in my voice', start: 'b21.w10-0.1', set: 'bedroom', lighting: 'night',
    setup(ctx) { bedroomSetup(ctx); },
    update(ctx, lt) {
      bedroomUpdate(ctx, 1.4);
      const c0 = { pos: V(-1.5, 1.35, 0.3), look: V(-0.8, 1.45, -2.6), fov: 42 }, c1 = { pos: V(-1.0, 1.5, -0.9), look: V(-0.8, 1.5, -2.6), fov: 40 };
      ctx.cam.move(c0, c1, clamp(lt / 1.1, 0, 1), ease.inCubic); fill(ctx, c1.pos, 0.2, '#9fb4ff');
      ctx.fx.text('...in my voice...', { x: 0.5, y: 0.26, size: 58, font: 'narr', fill: '#7dff8a', stroke: '#06301a', line: 6, alpha: 0.75, rot: -0.04 });
      ctx.fx.vignette(0.6);
    },
  },
  // ── b22 HUSS ×3 — the eye snaps open right under my window; HUSS bubbles; cut to black
  ...[0, 1, 2].map((i) => ({
    name: `eye under my window #${i + 1}`, start: i === 0 ? 'b22.h0-0.12' : `b22.h${i}-0.03`, ...HARB('night', { seaAmp: 0.1, lamp: 'off', windowGlow: 0.25 }),
    setup(ctx) {
      gulpAt(ctx, 9.2, 13, 7);
      const P = ctx.props, B = P.myBay; ctx.add(B); B.position.set(-4.0, 2.9, 13); B.rotation.set(0, PI / 2, 0);
      put(ctx, 'me', [-3.55, 2.9, 13], PI / 2);
      P.hussB.forEach((b) => ctx.add(b));
    },
    update(ctx) {
      const hits = ctx.hussTimes('b22').map((h) => h + 0.03), h = lastBefore(hits, ctx.t), me = ctx.cast.me, P = ctx.props;
      me.pose('surprised', ctx.t); me.face('shocked', 1);
      const open = ease.outBack(clamp((ctx.t - hits[0] + 0.08) / 0.15, 0, 1));
      const eye = gulpSet(ctx, { rise: 0.62, lid: 1 - open, glow: 1.2, tentOn: 0, lookY: 0.35, lookX: 0, brow: 1 });
      eyeLight(ctx, eye, 1.4); ctx.set.lights.glow.position.copy(eye).add(V(-3, 1, 0)); ctx.set.lights.glow.distance = 25;
      P.hussB.forEach((b, k) => { b.position.set(1.0 - k * 0.6, SEA_Y, 15.5 - k * 2.4); b.scale.setScalar(1.5); b.userData.set((ctx.t - hits[k]) / 0.8); });
      const cams = [
        { pos: V(13, 0.6, 18.5), look: V(-2, 3.4, 12.6), fov: 52 },
        { pos: V(-3.2, 2.7, 15.6), look: eye, fov: 46 },
        { pos: V(14, 8.5, 6.5), look: V(-1, 3.0, 13), fov: 48 },
      ];
      cam(ctx, cams[i], 0.3); ctx.cam.punch(hits, ctx.t, 0.14, 0.2);
      ctx.fx.vignette(0.5);
      if (i === 2) iris(ctx, A(ctx, 'b22.end') + 0.15, 0.4, 0.35);
    },
  })),
];

// ── bedroom helpers
function bedroomSetup(ctx) {
  const P = ctx.props, me = ctx.cast.me;
  ctx.place('me', ctx.anchor('room.bed')); me.root.position.y = 0.0; me.root.rotation.set(0, 0, 0);
  const bed = ctx.point('room.bed');
  me.root.position.set(bed.x, 0.0, bed.z - 0.05);
  const D = P.duvet; ctx.add(D); D.position.set(bed.x, 0.86, bed.z + 0.38); D.scale.set(1, 1.25, 0.95);
  const NV = P.nightView; ctx.add(NV); NV.position.set(-0.8, 1.6, -2.62);
  const G = P.greenL; ctx.add(G); G.position.set(-0.8, 1.2, -1.75);
}
function bedroomUpdate(ctx, k = 1) {
  const P = ctx.props, me = ctx.cast.me;
  me.pose('crowdSurf', 0, { lift: 0.62, intensity: 0 }); me.face('sweat', 0.7);
  me.joints.head.rotation.y += 0.45; me.joints.head.rotation.x += 0.15;
  for (const sd of ['L', 'R']) { me.joints['arm' + sd].rotation.set(0.1, 0, sd === 'L' ? 0.08 : -0.08); me.joints['foreArm' + sd].rotation.set(0, 0, 0); }
  P.nightView.userData.set(ctx.t, k);
  P.greenL.intensity = (2.5 + 2 * Math.sin(ctx.t * 2.2)) * k; P.greenL.distance = 6;
}
