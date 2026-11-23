// In This Town — Episode 21: "The Deep Above".  There is no sky: a sea hangs upside down over the rooftops.  Three rules,
// the last one: never shine a light into the deep.  The narrator's flashlight rolls onto the porch roof pointing straight up,
// a mountain-sized creature opens one glowing eye and feels its way down Main Street… it's only following the light.  He
// throws the flashlight back up from the clock tower — and sees another town hanging upside down on the far side of the deep,
// where a mum is telling her kid the same rule.  Something lives down there.  Us.
// Film contract: SPEC.md §8.  Timeline: episodes/ep21/timeline.json.  New props: ./props.js
//
// Sets: 'town' (buildTown + the ep14 tower top + the sea ceiling at SEA_Y) and 'room' (hero bedroom, window = the sea).
// Everything in the town is placed in WORLD coordinates through L = T(ctx) (town-local → world).  Main street along x
// (centre z = 0), my house = south row x −27 (front at z 10.5, facing −z), clock tower at (TX, TZ), deck y = DY.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { frameAt } from '../shots.js';
import { TOWER, makeTowerTop, makeCurtainWindow } from '../ep14/props.js';
import { makeLadder } from '../ep19/props.js';
import {
  SEA_Y, makeSea, makeShafts, makeBubbles, makeDeepLayers, makeMotes, makeFish, makeSchool, makeSardines, makeBonkSardine, makePan,
  makeRulesBoard, makeTricorn, makeEyepatch, makeRod, makeLine, stretchLine, makeTorch, makeDeepOne, makeCurveTentacle, makeHedge,
  makeKidWindow, makeUpsideTown, makeLampGlows, makeStars, makeLeafBurst, makeDingStar, glowSprite, seaWave, makeRipple, makeFishShadow,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;
const TX = TOWER.x, TZ = TOWER.z, DY = TOWER.deck;
const LAMPS = [[-33, -5.15], [-21, -5.15], [-9, -5.15], [3, -5.15], [15, -5.15], [27, -5.15], [-27, 5.15], [-15, 5.15], [-3, 5.15], [9, 5.15], [21, 5.15]];
const UPTOWN = { x: -40, y: 80, z: 1.5 };          // the inverted town's ground (world), flipped upside down

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const SPECIAL = {
  pemberton: { id: 'pemberton', skin: '#f0c8a8', hair: { style: 'bun', color: '#a9a9b8' }, top: { style: 'dress', color: '#7b3fbf', accent: '#ffd23f', emblem: 'heart' },
    bottom: { style: 'skirt', color: '#7b3fbf' }, shoes: '#1d1d22', accessories: ['sunglasses'], scale: 0.98, build: 1.12 },
  mayor21: { id: 'mayor21', skin: '#e9b99a', hair: { style: 'short', color: '#4a3a2a' }, top: { style: 'suit', color: '#2f6f5a', accent: '#ffd23f' },
    bottom: { style: 'pants', color: '#1f2a26' }, shoes: '#1a1a1a', accessories: ['topHat', 'sash', 'mustache', 'bowtie'], build: 1.18, scale: 1.05 },
  barnaby: { id: 'barnaby', skin: '#e9b99a', hair: { style: 'grandpa', color: '#f4f4f4' }, top: { style: 'suit', color: '#24508f', accent: '#ffd23f' },
    bottom: { style: 'pants', color: '#3a2a1f' }, shoes: '#3a2a1c', accessories: ['beard'], scale: 0.97, build: 1.12 },
  kidB: { id: 'kidB', skin: '#e0ac69', hair: { style: 'curly', color: '#3b2416' }, top: { style: 'hoodie', color: '#ffd23f', accent: '#1d1d22', emblem: 'star' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#ffffff', accessories: [], scale: 0.78 },
  mumB: { id: 'mumB', skin: '#e0ac69', hair: { style: 'long', color: '#2b1d14' }, top: { style: 'cardigan', color: '#e8232b', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#3a3d46' }, shoes: '#1d1d22', accessories: [], scale: 1.0 },
};
export const cast = { me: MAIN.me, ...SPECIAL, ...EXTRAS };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 21, banner: ['RULES', 'OF THE', 'DEEP'] }),
  room: () => buildRoom({ variant: 'hero', poster: 'knight', window: 'dark' }),
};

export function init(ctx) {
  const P = ctx.props;
  P.tower = makeTowerTop();
  for (const c of P.tower.children) if ((c.isGroup && Math.abs(c.position.y - DY) < 0.01) || (c.isMesh && Math.abs(c.position.y - (DY + 0.17)) < 0.01)) c.visible = false;
  P.sea = makeSea(); P.shafts = makeShafts(14, { area: [110, 34] }); P.bubbles = makeBubbles(140, { w: 60, h: 21, d: 26 });
  P.layers = makeDeepLayers([30, 42, 54, 66]); P.motes = makeMotes(90, { w: 60, h: 40, d: 60 });
  P.school = makeSchool(40, { len: 60, spread: [10, 3, 8] }); P.school2 = makeSchool(26, { len: 40, spread: [6, 2, 5], cols: ['#ffd23f', '#ff8a2a', '#3ee0c8'] });
  P.fish = makeFish({ body: '#ff8a2a', fin: '#ffd23f', belly: '#ffe0b0' });
  P.fish2 = makeFish({ body: '#3ee0c8', fin: '#ff5a7a', belly: '#d8fff6', stripe: '#1d6f8a' });
  P.whale = makeFish({ body: '#2f5f9a', fin: '#5aa8e0', belly: '#9fe8ff', stripe: '#244a7a', glow: true });
  P.whaleLight = new THREE.PointLight('#7fd8ff', 0, 30, 1.2);
  P.sardines = makeSardines(320, { w: 22, d: 16, top: 15, bottom: 0 }); P.sardines2 = makeSardines(150, { w: 7, d: 5, top: 7, bottom: 0 });
  P.bonks = Array.from({ length: 5 }, () => makeBonkSardine());
  P.dings = [makeDingStar(), makeDingStar()];
  P.pan = makePan();
  P.board = makeRulesBoard();
  P.tricorn = makeTricorn(); P.patch = makeEyepatch(); P.rod = makeRod(); P.line = makeLine('#f4f8ff', 0.014);
  P.torch = makeTorch(); P.torchB = makeTorch();
  P.deep = makeDeepOne();
  P.tent = makeCurveTentacle(44);
  P.hedge = makeHedge(); P.stars = makeStars(5); P.leaves = makeLeafBurst(26);
  P.bay = makeKidWindow();
  P.uptown = makeUpsideTown();
  P.lamps = makeLampGlows(LAMPS.map(([x, z]) => V(x, 4.72, z)));
  P.curtains = [makeCurtainWindow(), makeCurtainWindow(), makeCurtainWindow()];
  P.ladder = makeLadder(17.6);
  P.trail = Array.from({ length: 14 }, (_, i) => glowSprite('#fff4c0', 1.6 - i * 0.08, 0.8));
  P.spot = glowSprite('#bff8ff', 10, 0.0);
  P.shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(PI / 2), new THREE.MeshBasicMaterial({ color: '#02040c', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
  P.fill = new THREE.PointLight('#d8ecff', 5, 12, 1.4);
  P.key2 = new THREE.PointLight('#ffd890', 0, 14, 1.3);
  P.roomFill = new THREE.PointLight('#7fc8ff', 0, 7, 1.2);
  P.view = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.6), new THREE.MeshBasicMaterial({ map: seaViewTex(), toneMapped: false }));
  P.roofStrip = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.4), new THREE.MeshStandardMaterial({ color: '#3b4f78', roughness: 0.8 }));
  P.warm = new THREE.PointLight('#ffc890', 0, 40, 1.0);
  P.apron = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.25, 0.1), new THREE.MeshStandardMaterial({ color: '#6b4a2f', roughness: 0.8 }));
  P.ripple = makeRipple(3); P.fishShadow = makeFishShadow();
  P.star = glowSprite('#fff6d0', 4, 0.9);
  P.trail.forEach((s) => { s.material.depthTest = false; s.renderOrder = 12; });
  P.star.material.depthTest = false; P.star.renderOrder = 13;
}
function seaViewTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2a9ad8'); gr.addColorStop(0.55, '#1a5aa0'); gr.addColorStop(1, '#0b2a50');
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = 'rgba(200,250,255,0.55)'; g.lineWidth = 3;
  for (let i = 0; i < 40; i++) { const x = hash(i * 1.7) * 1024, y = hash(i * 2.9) * 220; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30, y + 20 * hash(i), x + 70, y + 4); g.stroke(); }
  // rooftops across the street
  g.fillStyle = '#16233a';
  for (let i = 0; i < 6; i++) { const x = i * 190 - 30, h = 300 + 30 * hash(i); g.beginPath(); g.moveTo(x, 512); g.lineTo(x, h); g.lineTo(x + 85, h - 70); g.lineTo(x + 170, h); g.lineTo(x + 170, 512); g.fill(); }
  g.fillStyle = '#ffd27a';
  for (let i = 0; i < 6; i++) for (let k = 0; k < 2; k++) if (hash(i * 3 + k) > 0.35) g.fillRect(i * 190 + 20 + k * 80, 380, 40, 46);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function T(ctx) { const r = ctx.set.root; r.updateMatrixWorld(true); const M = r.matrixWorld.clone(); const f = (x, y, z) => V(x, y, z).applyMatrix4(M); f.yaw = yawOf(r); f.M = M; return f; }
function put(ctx, id, p, yaw) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); return ctx.cast[id]; }
function addW(ctx, obj, p, ry = 0) { ctx.add(obj); obj.position.copy(p); obj.rotation.set(0, ry, 0); return obj; }
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.17, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale || 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.24, size: 150, fill: '#ffe14a', stroke: '#000000', line: 12, rot: -0.1, alpha: clamp(d / 0.06, 0, 1), ...o, scale: s * (o.scale || 1) });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headTop(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.62, 0)); }
function handW(ch, s = 'R') { ch.root.updateMatrixWorld(true); return ch.joints['hand' + s].getWorldPosition(V()); }
function shoulderW(ch, s = 'R') { ch.root.updateMatrixWorld(true); return ch.joints['arm' + s].getWorldPosition(V()); }
const iris = (ctx, t0, cy = 0.42, dur = 0.45) => { const k = clamp((ctx.t - t0) / dur, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, PI * 2, true); g.fill('evenodd'); g.restore(); }); };
function fill(ctx, pos, k = 1, color = '#d8ecff') { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0) { const c = camLerp(a, b, clamp(u, 0, 1)); ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k); return c; }
function setCam(ctx, c, k = 0) { ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k); return c; }
function flash(ctx, t0, dur = 0.12, color = '#ffffff', a = 0.8) { const d = ctx.t - t0; if (d >= 0 && d < dur) ctx.fx.overlay(color, a * (1 - d / dur)); }
function shakeOn(ctx, hits, amt = 0.6, dur = 0.35, seed = 7) { for (const h of hits) { const d = ctx.t - h; if (d >= 0 && d < dur) ctx.cam.shake(amt * (1 - d / dur), ctx.t, seed); } }
function lastBefore(times, t) { let r = null; for (const x of times) if (x <= t) r = x; return r; }
const mixHex = (a, b, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), clamp(k, 0, 1)).getHexString();
const fwdOf = (yaw) => V(Math.sin(yaw), 0, Math.cos(yaw));
const leftOf = (yaw) => V(Math.cos(yaw), 0, -Math.sin(yaw));
/** a camera in front of a character's face: d metres along its facing, side metres to its left, h up; looks `below` under the face. */
function faceCam(ch, d = 2.4, { side = 0, h = -0.15, fov = 34, below = 0.38, yawOff = 0 } = {}) {
  const f = humanFace(ch), yaw = ch.root.rotation.y + yawOff;
  return { pos: f.clone().addScaledVector(fwdOf(yaw), d).addScaledVector(leftOf(yaw), side).add(up(h)), look: f.clone().add(up(-below)), fov };
}
/** a point at angle-mix between two targets as seen from pos */
function lookMix(pos, a, b, w) { const da = a.clone().sub(pos).normalize(), db = b.clone().sub(pos).normalize(); return pos.clone().add(da.lerp(db, w).normalize().multiplyScalar(10)); }
/** prop held in the right hand, pointing along dir (world) */
function holdAlong(obj, ch, dir, s = 'R') { const h = handW(ch, s); obj.position.copy(h); obj.up.set(0, 1, 0); obj.lookAt(h.clone().add(dir)); }
function armDir(ch, s = 'R') { return handW(ch, s).sub(shoulderW(ch, s)).normalize(); }
function armUp(ch, k = 1, s = 'R', fwd = 0.15) { const J = ch.joints; J['arm' + s].rotation.set(lerp(J['arm' + s].rotation.x, -PI + fwd, k), 0, (s === 'R' ? -0.12 : 0.12) * k); J['foreArm' + s].rotation.set(-0.12 * k, 0, 0); }
/** point an arm (shoulder joint) straight at a world target; arms hang along −Y in joint space */
function aimArm(ch, s, target, bend = 0) {
  const J = ch.joints, a = J['arm' + s]; ch.root.updateMatrixWorld(true);
  const d = target.clone().sub(a.getWorldPosition(V()));
  d.applyQuaternion(a.parent.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
  a.rotation.set(Math.atan2(-d.z, -d.y), 0, Math.asin(clamp(d.x, -1, 1))); J['foreArm' + s].rotation.set(-bend, 0, 0);
}
function armFwd(ch, k = 1, s = 'R', pitch = -1.45, yaw = 0) { const J = ch.joints; J['arm' + s].rotation.set(lerp(J['arm' + s].rotation.x, pitch, k), 0, yaw * k); J['foreArm' + s].rotation.set(-0.15 * k, 0, 0); }

// ─── moods: sky colour (= fog), lighting preset, sea look
const MOODS = {
  day: { preset: 'day', bg: '#8ad6ee', fog: [70, 330], hemi: ['#c8f2ff', '#86996a', 1.5], exposure: 1.0, windows: 0, shafts: 1, bubbles: 0.8, lamps: 0,
    sea: { deep: '#1a78c8', shallow: '#62dcf2', light: '#f0ffff', glow: 1.0, opacity: 0.97 } },
  dusk: { preset: 'dusk', bg: '#ee9a8a', fog: [60, 300], hemi: ['#ffc0d0', '#5d3c5c', 1.35], exposure: 1.05, windows: 0.7, shafts: 0.9, bubbles: 0.7, lamps: 0.7,
    sea: { deep: '#24308e', shallow: '#3a78d4', light: '#9a8ad0', glow: 0.95, opacity: 0.97, caus: 0.3, amp: 0.6 } },
  night: { preset: 'quiet_night', bg: '#0b2242', fog: [35, 210], hemi: ['#3a74b8', '#121a28', 1.15], exposure: 1.12, windows: 0.85, shafts: 0.55, bubbles: 0.6, lamps: 1,
    sea: { deep: '#051636', shallow: '#0c3a78', light: '#4aa8d8', glow: 0.55, opacity: 0.97, caus: 0.5 } },
  flare: { preset: 'quiet_night', bg: '#0f2f58', fog: [40, 230], hemi: ['#5aa8e8', '#18243a', 1.45], exposure: 1.08, windows: 0.9, shafts: 0.7, bubbles: 0.7, lamps: 1,
    sea: { deep: '#0e2a6a', shallow: '#1d64b8', light: '#9fe8ff', glow: 0.9, opacity: 0.97, caus: 0.75 } },
};
function town(ctx, mood = 'night', o = {}) {
  const s = ctx.set, P = ctx.props, M = MOODS[mood];
  s.setLighting(M.preset); s.set('partyProps', false); s.set('fireworks', false); s.set('foam', 0); s.set('standsCrowd', o.stands ?? false);
  s.set('windowGlow', o.windows ?? M.windows);
  for (const n of ['sky', 'stars', 'clouds']) { const ob = s.root.getObjectByName(n); if (ob) ob.visible = false; }
  P.moonObjs ??= s.root.children.filter((c) => c.isMesh && c.position.length() > 300);
  P.moonObjs.forEach((m) => { m.visible = false; });
  s.background.set(M.bg); s.fog.color.set(M.bg); s.fog.near = M.fog[0]; s.fog.far = M.fog[1];
  const hemi = s.root.getObjectByName('hemi'); if (hemi) { hemi.color.set(M.hemi[0]); hemi.groundColor.set(M.hemi[1]); hemi.intensity = M.hemi[2]; }
  s.exposure = M.exposure;
  const L = T(ctx); ctx.store.L = L; ctx.store.mood = mood;
  ctx.add(P.tower, s.root); P.tower.position.set(TX, 0, TZ); P.tower.rotation.set(0, 0, 0);
  addW(ctx, P.sea, L(-20, SEA_Y, 0));
  if (o.shafts !== false) addW(ctx, P.shafts, L(o.shaftX ?? -20, SEA_Y, o.shaftZ ?? 0));
  if (o.bubbles !== false) addW(ctx, P.bubbles, L(o.bubX ?? -20, 0, o.bubZ ?? 0));
  if (M.lamps > 0) addW(ctx, P.lamps, L(0, 0, 0));
  return L;
}
function tick(ctx, o = {}) {
  const P = ctx.props, t = ctx.t, M = MOODS[ctx.store.mood];
  P.sea.userData.set(t, { ...M.sea, ...(o.sea || {}) });
  P.shafts.userData.set(t, o.shafts ?? M.shafts);
  P.bubbles.userData.set(t, o.bubbles ?? M.bubbles);
  if (P.lamps.parent) P.lamps.userData.set(t, o.lamps ?? M.lamps, o.flicker ?? 0);
}
/** the creature: eye at world point `eye`, facing yaw (π = facing −z toward the north side), scale s */
function deepAt(ctx, eye, { yaw = PI, s = 15, set = {} } = {}) {
  const D = ctx.props.deep; addW(ctx, D, V(), yaw); D.scale.setScalar(s);
  D.userData.set(ctx.t, set); D.updateMatrixWorld(true);
  const e = D.userData.eyeWorld(); D.position.add(eye.clone().sub(e)); D.updateMatrixWorld(true);
  return D;
}
/** the kid's window frame: W(x, y, z): x along the wall (bay-local), y world height, z out from the wall toward the street */
function kidWin(ctx) {
  const a = ctx.anchor('myHouse.window'); a.updateWorldMatrix(true, false);
  const p = a.getWorldPosition(V()), yaw = yawOf(a), fwd = fwdOf(yaw), left = leftOf(yaw);
  const o = p.clone().addScaledVector(fwd, -0.39); o.y = 0;
  const W = (x, y, z) => o.clone().addScaledVector(left, x).addScaledVector(fwd, z).add(V(0, y, 0));
  W.yaw = yaw; W.fwd = fwd; W.left = left; W.floor = 2.55;
  W.roof = (x, z) => W(x, 2.55 + ctx.props.bay.userData.roofAt(z), z);
  return W;
}
function bayIn(ctx, W, glow = 1, col = '#3a5a8a') { addW(ctx, ctx.props.bay, W(0, W.floor, 0), W.yaw); ctx.props.bay.userData.glow(glow, col); }
/** tentacle control points from a base (in the sea) to the tip, sagging + wiggling */
function tentPts(base, tip, t, { wig = 0.6, drop = 0.55, approach = null } = {}) {
  const d = tip.clone().sub(base), hor = V(d.x, 0, d.z);
  const p1 = base.clone().add(up(-Math.min(6, Math.abs(d.y) * 0.35))).addScaledVector(hor, 0.12);
  const p2 = base.clone().addScaledVector(hor, 0.42).add(up(d.y * drop));
  const ap = approach || hor.clone().normalize();
  const p3 = tip.clone().addScaledVector(ap, -3.2).add(up(0.9));
  const p4 = tip.clone().addScaledVector(ap, -1.2).add(up(0.25));
  const side = V(-ap.z, 0, ap.x);
  p2.addScaledVector(side, wig * 1.6 * Math.sin(t * 0.9)); p3.addScaledVector(side, wig * Math.sin(t * 1.3 + 1)); p3.y += wig * 0.5 * Math.sin(t * 1.1);
  p4.addScaledVector(side, wig * 0.4 * Math.sin(t * 1.9 + 2));
  return [base.clone().add(up(3)), base.clone(), p1, p2, p3, p4, tip.clone()];
}
function tentOn(ctx, base, tip, t, o = {}) { const T0 = ctx.props.tent; ctx.add(T0); T0.position.set(0, 0, 0); T0.userData.mat.emissiveIntensity = o.emi ?? 0.7; T0.userData.setPath(tentPts(base, tip, t, o), o.r0 ?? 1.5, o.r1 ?? 0.14, t, o); return T0; }
/** crowd of real extras placed in world positions list [{p, yaw}] */
function crowdAt(ctx, ids, spots) { return ids.map((id, i) => ({ ch: put(ctx, id, spots[i].p, spots[i].yaw), k: i, ph: hash(i * 1.9 + 3) * 3 })); }
function animC(list, t, act = 'idle', face = 'smile', params = {}) { for (const c of list) { const a = typeof act === 'function' ? act(c) : act, f = typeof face === 'function' ? face(c) : face; c.ch.pose(a, t + c.ph, params); c.ch.face(f, t + c.ph); } }
/** flinch: arms over the head */
function flinch(ch, t, k = 1) {
  const J = ch.joints, sh = 0.12 * Math.sin(t * 31) * k;
  for (const s of ['L', 'R']) { const sg = s === 'L' ? 1 : -1; J['arm' + s].rotation.set(-2.75 * k + sh, 0, 0.32 * sg * k); J['foreArm' + s].rotation.set(0, 0, -1.65 * sg * k); }
  J.torso.rotation.x += 0.38 * k; J.head.rotation.x += 0.3 * k;
}
function climbPose(ch, t, speed = 2.4) {
  ch.pose('idle', t, { intensity: 0.2 });
  const J = ch.joints, w = Math.sin(t * speed * PI);
  J.armL.rotation.set(-2.7 + 0.35 * w, 0, 0.15); J.armR.rotation.set(-2.7 - 0.35 * w, 0, -0.15);
  J.foreArmL.rotation.set(-0.3, 0, 0); J.foreArmR.rotation.set(-0.3, 0, 0);
  J.legL.rotation.set(-0.7 * Math.max(0, w) - 0.1, 0, 0); J.legR.rotation.set(-0.7 * Math.max(0, -w) - 0.1, 0, 0);
  if (J.shinL) { J.shinL.rotation.set(1.1 * Math.max(0, w) + 0.1, 0, 0); J.shinR.rotation.set(1.1 * Math.max(0, -w) + 0.1, 0, 0); }
}
/** Barnaby's pirate gear on his head */
function pirate(ctx) { const b = ctx.cast.barnaby, P = ctx.props; ctx.add(P.tricorn, b.joints.head); P.tricorn.position.set(0, 0.6, -0.02); P.tricorn.rotation.set(-0.08, 0, 0); P.tricorn.scale.setScalar(1.05); ctx.add(P.patch, b.joints.head); P.patch.position.set(-0.15, 0.34, 0.29); P.patch.rotation.set(0, 0, 0); return b; }
/** the pan in the right hand: over the head (mode 'over') or along the arm */
function panOver(ctx, ch, camPos = null, { tilt = 0.6, yawOff = 0 } = {}) {
  const P = ctx.props, top = headTop(ch); ctx.add(P.pan); const h = handW(ch); P.pan.position.copy(h);
  const dir = V(top.x - h.x, 0, top.z - h.z); if (dir.lengthSq() < 1e-4) dir.copy(leftOf(ch.root.rotation.y)); dir.normalize().applyAxisAngle(V(0, 1, 0), yawOff);
  const upv = V(0, 1, 0);
  if (camPos) { const c = camPos.clone().sub(h); c.y = 0; c.addScaledVector(dir, -c.dot(dir)); if (c.lengthSq() > 1e-4) { c.normalize(); upv.multiplyScalar(Math.cos(tilt)).addScaledVector(c, Math.sin(tilt)); } }
  P.pan.position.add(up(0.12)); P.pan.up.copy(upv); P.pan.lookAt(P.pan.position.clone().add(dir).add(up(0.55)));
  return P.pan.localToWorld(P.pan.userData.faceCenter.clone());
}
function panAlong(ctx, ch) { const P = ctx.props; ctx.add(P.pan); holdAlong(P.pan, ch, armDir(ch)); return P.pan.localToWorld(P.pan.userData.faceCenter.clone()); }
function torchIn(ctx, ch, dir, { on = 1, len = 2.2, width = 0.6 } = {}) { const tt = ctx.props.torch; ctx.add(tt); holdAlong(tt, ch, dir); tt.userData.set(on, len, width); return tt; }
/** walkers on the pavements (day life) */
function walkers(ctx, L, ids, { x0 = -30, x1 = 0, seed = 1 } = {}) {
  return ids.map((id, i) => { const z = (i % 2 ? 1 : -1) * (6.0 + 0.6 * hash(i * 3 + seed)); const dir = i % 2 ? -1 : 1; return { ch: put(ctx, id, L(x0, 0.12, z), L.yaw + (dir > 0 ? PI / 2 : -PI / 2)), i, z, dir, x0: lerp(x0, x1, hash(i * 7 + seed)) }; });
}
function animWalkers(list, L, t, span = 30) { for (const w of list) { const x = w.x0 + w.dir * ((t * 0.9 + w.i * 3) % span) - (w.dir > 0 ? 0 : 0); w.ch.root.position.copy(L(x, 0.12, w.z)); w.ch.pose('walk', t + w.i); w.ch.face('smile', t + w.i); } }

const H = (beat, i) => (i === 0 ? `${beat}.h0-0.12` : `${beat}.h${i}-0.03`);
const hussHits = (ctx, b) => ctx.hussTimes(b).map((h) => h + 0.03);

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, there's no sky. There's a sea, hanging upside down over the rooftops."
  {
    name: 'tilt up to the sea', start: 0, set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk');
      ctx.set.exposure = 1.15;
      addW(ctx, ctx.props.school, L(-26, 15.5, 0), L.yaw);
      ctx.store.w = walkers(ctx, L, EXTRA_IDS.slice(0, 6), { x0: -32, x1: -8, seed: 2 });
      // a few people crossing / strolling down the middle of the street, right in frame
      ctx.store.sw = [[-14.5, 2.4, -1], [-16.5, -0.6, 1], [-19.0, 1.5, -1], [-21.5, -2.0, 1]].map(([x, z, dir], i) =>
        ({ ch: put(ctx, EXTRA_IDS[6 + i], L(x, 0, z), L.yaw + (dir > 0 ? PI / 2 : -PI / 2)), x, z, dir, i }));
      const P = ctx.props; ctx.add(P.warm); P.warm.position.copy(L(-13, 5.5, 1.5)); P.warm.intensity = 90; P.warm.distance = 34;
    },
    update(ctx, lt) {
      const { L, w, sw } = ctx.store, t = ctx.t; tick(ctx);
      ctx.props.school.userData.set(t, { speed: 2.4 }); animWalkers(w, L, t, 20);
      for (const m of sw) { m.ch.root.position.copy(L(m.x + m.dir * 0.85 * t, 0, m.z)); m.ch.pose('walk', t + m.i * 0.4); m.ch.face('smile', t + m.i); }
      const k = ease.inOutCubic(clamp((t - 1.0) / 3.4, 0, 1));
      const pos = L(-4, lerp(1.0, 1.5, k), lerp(3.8, 2.6, k));
      const look = L(-30, 4.5, -2.5).lerp(L(-25, 19, -8.5), k);
      setCam(ctx, { pos, look, fov: lerp(48, 60, k) });
    },
  },
  // ── b02 HUSS ×3 — the kid in the middle of Main Street, a whale glides over, belly glow washes him blue
  ...[0, 1, 2].map((i) => ({
    name: `huss whale #${i + 1}`, start: H('b02', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { shafts: true });
      put(ctx, 'me', L(-16, 0, 0), L.yaw + PI / 2);
      const P = ctx.props; addW(ctx, P.whale, V(), 0); P.whale.scale.setScalar(8.5); ctx.add(P.whaleLight);
      addW(ctx, P.school, L(-16, 14, 6), L.yaw + PI / 2);
    },
    update(ctx) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, hits = hussHits(ctx, 'b02'); tick(ctx);
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      me.pose('idle', t, { intensity: 0.3, headPitch: -0.55 }); me.face(dh < 0.25 ? 'huss' : 'shocked', t);
      const wx = lerp(-8, -24, (t - 5.0) / 0.9);
      if (i === 2) me.root.rotation.y = L.yaw - 0.76;
      P.whale.position.copy(L(wx, 16.0, -6.5)); P.whale.rotation.set(0.04, L.yaw - PI / 2, 0); P.whale.userData.set(t, { wag: 0.6, speed: 0.5 });
      P.whaleLight.position.copy(L(-14.5, 4.5, 0.5)); P.whaleLight.intensity = 50 * clamp(1 - Math.abs(wx + 16) / 22, 0, 1);
      P.school.userData.set(t, { speed: 3 });
      const f = humanFace(me);
      const cams = [
        null,
        faceCam(me, 3.0, { side: 0.5, h: -0.35, fov: 38, below: 0.58 }),
        null,
      ];
      if (i === 0) { const cp = L(-14.0, 0.5, 2.3); cams[0] = { pos: cp, look: lookMix(cp, f.clone().add(up(-0.2)), P.whale.position, 0.55), fov: 72 }; }
      if (i === 2) { const cp = L(-16.6, 0.5, 3.8); cams[2] = { pos: cp, look: lookMix(cp, f.clone().add(up(-0.3)), P.whale.position, 0.58), fov: 74 }; }
      setCam(ctx, cams[i], 0.6); ctx.cam.punch(hits, t, 0.1, 0.2);
      ctx.fx.overlay('#2a8cff', 0.12 * clamp(1 - Math.abs(wx + 16) / 14, 0, 1));
    },
  })),
  // ── b03 "Fish swim past our bedroom windows."
  {
    name: 'fish at the bedroom window', start: 'b03-0.1', set: 'room',
    setup(ctx) {
      const s = ctx.set, P = ctx.props; s.setLighting('day');
      const wv = s.root.getObjectByName('windowView'); if (wv) wv.visible = false;
      const w = ctx.point('room.window');
      addW(ctx, P.view, w.clone().add(V(0.2, 0.3, -1.6)), 0);
      addW(ctx, P.roofStrip, w.clone().add(V(0, -0.85, -0.65)), 0); P.roofStrip.rotation.x = 0.35;
      addW(ctx, P.fish, V(), 0); P.fish.scale.setScalar(0.9);
      addW(ctx, P.school2, w.clone().add(V(0, 0.4, -2.4)), PI / 2); P.school2.scale.setScalar(0.6);
      ctx.add(P.roomFill); P.roomFill.position.copy(w).add(V(0, 0.2, 0.8)); P.roomFill.intensity = 14;
      put(ctx, 'me', ctx.point('room.bed').add(V(0.15, -0.55, 0.55)), PI / 2);
      ctx.store.w = w;
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, w = ctx.store.w, me = ctx.cast.me;
      const k = ease.outCubic(clamp(lt / 1.3, 0, 1));
      P.fish.position.copy(w).add(V(lerp(-1.2, 0.05, k), lerp(-0.2, 0.05, k) + 0.05 * Math.sin(t * 2), -0.55));
      P.fish.rotation.set(0, lerp(PI / 2, 0, k), 0); P.fish.userData.set(t, { wag: lerp(1, 0.4, k), mouth: k > 0.9 ? 1 : 0, look: 1 });
      me.pose('sit', t, { hands: 'lap', seatHeight: 0.52, lookAt: P.fish.position }); me.face(t > ctx.time('b03.w5') ? 'grin' : 'smile', t);
      if (t > ctx.time('b03.w4')) { me.joints.armR.rotation.set(-2.2, 0, -0.3); me.joints.foreArmR.rotation.set(-0.4, 0, 0.6 * Math.sin(t * 10)); }
      P.school2.userData.set(t, { speed: 1.8 });
      moveCam(ctx, { pos: V(0.5, 1.5, 3.6), look: V(-1.3, 1.15, -1.3), fov: 52 }, { pos: V(0.4, 1.45, 3.2), look: V(-1.3, 1.2, -1.3), fov: 50 }, lt / 2);
    },
  },
  // ── "Every Friday, it rains sardines."  — the square by day, silver sardines patter down, people flinch
  {
    name: 'sardine rain', start: 'b03.w6-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { shaftX: 44 });
      const Q = frameAt(ctx, 'square.center');
      const P = ctx.props; addW(ctx, P.sardines, Q(0, 0, 3), Q.yaw); addW(ctx, P.sardines2, Q(0, 0, 0.5), Q.yaw);
      const spots = [[-2.2, 1.5], [0.2, 0.6], [2.4, 1.8], [-1.0, 3.6], [1.5, 4.0], [-3.2, 4.2], [3.4, 3.8], [0.0, 2.6]].map(([x, z], i) => ({ p: Q(x, 0, z), yaw: Q.yaw + PI + (hash(i * 2.2) - 0.5) * 1.2 }));
      ctx.store.c = crowdAt(ctx, EXTRA_IDS.slice(6, 14), spots); ctx.store.Q = Q;
      addW(ctx, P.school, Q(0, 14, 0), Q.yaw + PI / 2);
    },
    update(ctx, lt) {
      const { Q, c } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx);
      P.sardines.userData.set(t, { k: clamp(lt / 0.3, 0, 1), fall: 10 }); P.sardines2.userData.set(t + 3, { k: clamp(lt / 0.3, 0, 1), fall: 8 }); P.school.userData.set(t, { speed: 2 });
      animC(c, t, 'idle', 'shocked'); c.forEach((m, i) => flinch(m.ch, t, clamp((lt - 0.1 - 0.12 * (i % 4)) / 0.2, 0, 1)));
      const fy = humanFace(c[1].ch).y - Q(0, 0, 0).y;
      moveCam(ctx, { pos: Q(0.3, 0.75, -3.2), look: Q(0, fy - 0.55, 2.4), fov: 56 }, { pos: Q(0.3, 0.75, -2.6), look: Q(0, fy - 0.55, 2.4), fov: 54 }, lt / 2.2);
      tag(ctx, 'EVERY FRIDAY', ctx.time('b03.w6'), Infinity, { y: 0.15, bg: 'rgba(30,120,200,0.9)' });
    },
  },
  // ── b04 "Mrs. Pemberton doesn't own an umbrella."  — strolling down Main Street, pan over her head, sardines bonk off it
  {
    name: 'pemberton strolls', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'pemberton', L(-11.5, 0.12, -6.2), L.yaw - PI / 2);
      const P = ctx.props; addW(ctx, P.sardines, L(-12, 0, -4), L.yaw);
      P.bonks.forEach((b) => ctx.add(b)); P.dings.forEach((d) => ctx.add(d));
      ctx.store.w = walkers(ctx, L, EXTRA_IDS.slice(0, 4), { x0: -26, x1: -4, seed: 5 });
      addW(ctx, P.school, L(-12, 15, -2), L.yaw + 0.4);
    },
    update(ctx, lt) {
      const { L, w } = ctx.store, t = ctx.t, P = ctx.props, pb = ctx.cast.pemberton; tick(ctx);
      P.sardines.userData.set(t, { k: 0.6, fall: 9 }); animWalkers(w, L, t, 18); P.school.userData.set(t, { speed: 2.2 });
      const x = -11.5 - 0.9 * (lt);
      pb.root.position.copy(L(x, 0.12, -6.2)); pb.pose('walk', t, { speed: 1.0 }); pb.face('smug', t);
      armUp(pb, 1, 'R', 0.05);
      const f = humanFace(pb), cp = L(x - 4.6, 1.25, -3.6);
      const pc = panOver(ctx, pb, cp, { tilt: 0.8 });
      const cam = setCam(ctx, { pos: cp, look: f.clone().add(V(0.5, -0.4, 0)), fov: 42 });
      bonks(ctx, pc, [ctx.time('b04.w2'), ctx.time('b04.w4'), ctx.time('b04.w5') + 0.15, ctx.time('b04.w6')], cam.pos);
    },
  },
  // ── "She owns a frying pan."  — low angle: smug, sardines bonk, ding!
  {
    name: 'she owns a frying pan', start: 'b04.w6-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'pemberton', L(-12, 0.12, -6.2), L.yaw - PI / 2 + 0.35);
      const P = ctx.props; P.bonks.forEach((b) => ctx.add(b)); P.dings.forEach((d) => ctx.add(d));
      addW(ctx, P.sardines, L(-12, 0, -4), L.yaw);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, pb = ctx.cast.pemberton; tick(ctx);
      P.sardines.userData.set(t, { k: 0.5, fall: 9 });
      pb.pose('idle', t, { intensity: 0.5 }); pb.face('smug', t); armUp(pb, 1, 'R', 0.05);
      const f = humanFace(pb);
      const c0 = faceCam(pb, 3.7, { side: 0.7, h: -0.62, below: 0.4, fov: 44 }), c1 = faceCam(pb, 3.4, { side: 0.6, h: -0.6, below: 0.4, fov: 44 });
      const cam = moveCam(ctx, c0, c1, lt / 1.4);
      const pc = panOver(ctx, pb, cam.pos, { tilt: 0.75, yawOff: 0 });
      bonks(ctx, pc, [ctx.time('b04.w7') + 0.05, ctx.time('b04.w9'), ctx.time('b04.w10') + 0.08, ctx.time('b04.w10') + 0.4], cam.pos);
      shakeOn(ctx, [ctx.time('b04.w7') + 0.05, ctx.time('b04.w9')], 0.15, 0.15);
    },
  },
  // ── b05 "There are three rules."  — the town square stage: the mayor points at the blank board
  {
    name: 'three rules wide', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { shaftX: 44, stands: true });
      const S = frameAt(ctx, 'square.stage'), P = ctx.props;
      boardOn(ctx, S);
      put(ctx, 'mayor21', S(-1.5, 0, 3.0), S.yaw + 0.5);
      const spots = []; for (let i = 0; i < 10; i++) spots.push({ p: S((i % 5 - 2) * 1.5 + (hash(i) - 0.5) * 0.5, -0.8, 6.0 + Math.floor(i / 5) * 1.4), yaw: S.yaw + PI + (hash(i * 3) - 0.5) * 0.4 });
      ctx.store.c = crowdAt(ctx, EXTRA_IDS.slice(4, 14), spots); ctx.store.S = S;
    },
    update(ctx, lt) {
      const { S, c } = ctx.store, t = ctx.t, P = ctx.props, m = ctx.cast.mayor21; tick(ctx);
      P.board.userData.set(0, 0, 0);
      m.pose('point', t, { intensity: 0.6, headYaw: -0.5 }); m.face('determined', t);
      animC(c, t, 'idle', 'neutral', { intensity: 0.5 });
      moveCam(ctx, { pos: S(1.0, 1.8, 13.5), look: S(0, 2.6, -0.5), fov: 50 }, { pos: S(0.8, 1.9, 12.0), look: S(0, 2.7, -0.5), fov: 48 }, lt / 1.6);
      shakeOn(ctx, [ctx.time('b05.w3')], 0.2, 0.2);
    },
  },
  // ── "Never throw anything up. Never swim up."  — the board, rules stamping on
  {
    name: 'rules board', start: 'r1-0.18', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { shaftX: 44, stands: true });
      const S = frameAt(ctx, 'square.stage'), P = ctx.props;
      boardOn(ctx, S);
      put(ctx, 'mayor21', S(-1.35, 0, 3.15), S.yaw + 0.25);
      ctx.store.S = S;
    },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, P = ctx.props, m = ctx.cast.mayor21, mk = ctx.markers; tick(ctx);
      P.board.userData.set(clamp((t - mk.r1) / 0.14, 0, 1), clamp((t - mk.r2) / 0.14, 0, 1), 0);
      const cam = moveCam(ctx, { pos: S(-1.4, 1.9, 9.8), look: S(0.15, 2.45, 1.9), fov: 54 }, { pos: S(-1.3, 1.9, 9.2), look: S(0.15, 2.45, 1.9), fov: 54 }, lt / 3);
      m.pose('idle', t, { intensity: 0.5, lookAt: cam.pos }); m.face('determined', t);
      const line = t < mk.r2 - 0.1 ? 0 : 1;
      aimArm(m, 'L', boardLine(S, line).add(up(0.05 * Math.sin(t * 7))));
      shakeOn(ctx, [mk.r1, mk.r2], 0.25, 0.2);
    },
  },
  // ── "And never, ever shine a light into the deep."  — low hero angle on the stern mayor, rule 3 stamps in red
  {
    name: 'rule three', start: 'r3-0.18', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { shaftX: 44, stands: true });
      const S = frameAt(ctx, 'square.stage'), P = ctx.props;
      boardOn(ctx, S);
      put(ctx, 'mayor21', S(-2.6, 0, 3.0), S.yaw + 0.0);
      const spots = []; for (let i = 0; i < 6; i++) spots.push({ p: S((i % 3 - 1) * 1.7 + 0.8, -0.8, 5.2 + Math.floor(i / 3) * 1.3), yaw: S.yaw + PI + (hash(i * 3) - 0.5) * 0.4 });
      ctx.store.c = crowdAt(ctx, EXTRA_IDS.slice(4, 10), spots); ctx.store.S = S;
    },
    update(ctx, lt) {
      const { S, c } = ctx.store, t = ctx.t, P = ctx.props, m = ctx.cast.mayor21, mk = ctx.markers; tick(ctx);
      P.board.userData.set(1, 1, clamp((t - mk.r3) / 0.14, 0, 1));
      animC(c, t, 'idle', 'neutral', { intensity: 0.4 }); c.forEach((x, i) => { x.ch.joints.head.rotation.x += 0.18 * Math.max(0, Math.sin((t + i * 0.3) * 6)); });
      const fm = humanFace(m), u = clamp(lt / 1.5, 0, 1);
      const cp = S(-3.6, 1.15, 7.4).lerp(S(-3.45, 1.15, 7.0), u);
      const a0 = fm.clone().setY(cp.y + 0.05), b0 = boardLine(S, 2).setY(cp.y + 0.05);
      const cam = setCam(ctx, { pos: cp, look: lookMix(cp, a0, b0, 0.5), fov: 62 });
      m.pose('idle', t, { intensity: 0.6, lookAt: cam.pos }); m.face('determined', t);
      aimArm(m, 'L', boardLine(S, 2));
      shakeOn(ctx, [mk.r3], 0.3, 0.25);
      tag(ctx, 'RULE #3', mk.r3, Infinity, { y: 0.12, size: 64, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  // ── b06 "Because something lives up there."  — night, the camera drifts up; a colossal shadow slides past, one eye flickers
  {
    name: 'something lives up there', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'night');
      const P = ctx.props; addW(ctx, P.shadow, V(), 0);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx, { sea: { opacity: 0.62, glow: 0.5, caus: 0.35 } });
      const cx = lerp(-38, -58, (t - ctx.time('b06')) / 2.0);
      const tl = ctx.time('b06.w2');
      const open = t > tl && t < tl + 0.6 ? Math.sin(PI * (t - tl) / 0.6) : 0;
      const st = { lid: 1 - 0.45 * open, glow: 0.25 + 0.9 * open, coil: 1, reach: 0.1, lookY: 0.4 };
      deepAt(ctx, L(cx, SEA_Y + 20, -3), { yaw: PI / 2 + 0.35, s: 10, set: st }); P.deep.userData.set(t, st);
      P.shadow.position.copy(L(cx + 3, SEA_Y + 0.6, -3)); P.shadow.scale.set(24, 1, 16); P.shadow.material.opacity = 0.5;
      const k = ease.inOutSine(clamp(lt / 1.7, 0, 1));
      setCam(ctx, { pos: L(-4, lerp(1.4, 2.4, k), 0.8), look: L(-30, lerp(10, 16, k), -1.5), fov: 70 }, 0.4);
    },
  },
  // ── b07 "Captain Barnaby cast a fishing line straight up once."  — the park; he casts straight up into the sea
  {
    name: 'barnaby casts', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { shaftX: -50 });
      const b = put(ctx, 'barnaby', L(-52, 0, -17), L.yaw + 0.5); pirate(ctx);
      const P = ctx.props; ctx.add(P.rod); ctx.add(P.line);
      addW(ctx, P.school2, L(-52, 15, -17), L.yaw + 1.2);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, b = ctx.cast.barnaby, tc = ctx.time('b07.w2'); tick(ctx);
      P.school2.userData.set(t, { speed: 1.6 });
      b.pose('idle', t, { intensity: 0.4, headPitch: t > tc ? -0.5 : -0.1 }); b.face(t > tc ? 'grin' : 'determined', t);
      // big cast: hold forward → wind way back over the shoulder → whip up and point straight at the sky
      const wind = ease.inOutCubic(clamp((t - (tc - 0.75)) / 0.4, 0, 1)), whip = ease.outBack(clamp((t - (tc - 0.3)) / 0.3, 0, 1));
      const ax = whip > 0 ? lerp(-4.0, -3.05, whip) : lerp(-0.9, -4.0, wind);
      b.joints.armR.rotation.set(ax, 0, -0.15); b.joints.foreArmR.rotation.set(-0.25 + 0.2 * wind * (1 - whip), 0, 0);
      b.joints.torso.rotation.x += 0.18 * wind * (1 - whip) - 0.08 * whip;
      const dir = armDir(b).lerp(V(0.05, 1, 0.12).normalize(), 0.35 * whip).normalize();
      holdAlong(P.rod, b, dir); P.rod.userData.set(whip > 0 && whip < 1 ? 0.35 * Math.sin(whip * PI) : 0.05);
      const tip = P.rod.userData.tip.getWorldPosition(V());
      const len = clamp((t - tc) / 0.6, 0, 1) * (SEA_Y - tip.y + 0.5);
      if (len > 0.05) { P.line.visible = true; stretchLine(P.line, tip, tip.clone().add(V(0.15, len, 0.3))); } else P.line.visible = false;
      const f = humanFace(b);
      moveCam(ctx, { pos: f.clone().add(V(2.0, -0.3, 4.6)), look: f.clone().add(up(1.0)), fov: 54 }, { pos: f.clone().add(V(1.8, -0.4, 4.1)), look: f.clone().add(up(1.0)), fov: 56 }, lt / 2);
    },
  },
  // ── "…straight up once."  — low angle up the line into the water
  {
    name: 'line into the sea', start: 'b07.w6-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { shaftX: -50 });
      const L = ctx.store.L, b = put(ctx, 'barnaby', L(-52, 0, -17), L.yaw + 0.5); pirate(ctx);
      const P = ctx.props; ctx.add(P.rod); ctx.add(P.line); ctx.add(P.ripple); ctx.add(P.fishShadow);
      addW(ctx, P.school2, L(-52, 17, -17), L.yaw + 1.2);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, b = ctx.cast.barnaby; tick(ctx);
      P.school2.userData.set(t, { speed: 1.6 });
      b.pose('idle', t, { intensity: 0.3, headPitch: -0.6 }); b.face('smile', t);
      b.joints.armR.rotation.set(-3.0, 0, -0.15); b.joints.foreArmR.rotation.set(-0.3, 0, 0);
      holdAlong(P.rod, b, V(0.05, 1, 0.12).normalize()); P.rod.userData.set(0.05);
      const tip = P.rod.userData.tip.getWorldPosition(V()), top = tip.clone().add(V(0.15, SEA_Y - tip.y + 0.5, 0.3));
      P.line.visible = true; stretchLine(P.line, tip, top);
      // where the line pierces the water: ripples; a dark fish shadow glides in toward it
      const amp = MOODS.day.sea.amp ?? 1, wy = (x, z) => SEA_Y + seaWave(x, z, t, amp);
      P.ripple.position.set(top.x, wy(top.x, top.z) - 0.25, top.z); P.ripple.userData.set(t, 1, { size: 2.6, speed: 1.1 });
      const u = ease.inOutSine(clamp((t - ctx.time('b07.w6')) / (ctx.markers.bit - ctx.time('b07.w6') + 0.05), 0, 1));
      const from = top.clone().add(V(7, 0, -5)), sp = from.lerp(top, u);
      P.fishShadow.position.set(sp.x, wy(sp.x, sp.z) - 0.3, sp.z); P.fishShadow.rotation.set(0, Math.atan2(top.x - sp.x, top.z - sp.z), 0); P.fishShadow.scale.setScalar(2.4);
      P.fishShadow.userData.set(t, 1);
      const f = humanFace(b), yaw = b.root.rotation.y, bk = fwdOf(yaw).negate(), rt = leftOf(yaw).negate();
      const cp = f.clone().addScaledVector(bk, 1.05).addScaledVector(rt, 0.55).add(up(-0.35));
      const lk = cp.clone().addScaledVector(fwdOf(yaw), Math.cos(1.08) * 10).add(up(Math.sin(1.08) * 10)).addScaledVector(leftOf(yaw), 1.2);
      setCam(ctx, { pos: cp, look: lk, fov: 74 });
    },
  },
  // ── "Something bit."  — BITE! the line snaps taut, he's yanked off his feet
  {
    name: 'something bit', start: 'bit-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { shaftX: -50 });
      const L = ctx.store.L; put(ctx, 'barnaby', L(-52, 0, -17), L.yaw + 0.5); pirate(ctx);
      const P = ctx.props; ctx.add(P.rod); ctx.add(P.line);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, b = ctx.cast.barnaby, tb = ctx.markers.bit; tick(ctx);
      const k = clamp((t - tb - 0.05) / 0.2, 0, 1), yank = ease.outCubic(clamp((t - ctx.time('b07.w10')) / 0.3, 0, 1));
      b.root.position.copy(L(-52, 1.6 * yank, -17));
      b.pose(yank > 0 ? 'surprised' : 'idle', t, { intensity: 1, headPitch: -0.4 }); b.face(k > 0 ? 'shocked' : 'smile', t);
      b.joints.armR.rotation.set(-3.0, 0, -0.15); b.joints.armL.rotation.set(-2.9, 0, 0.2); b.joints.foreArmR.rotation.set(-0.2, 0, 0);
      holdAlong(P.rod, b, V(0.05, 1, 0.12).normalize()); P.rod.userData.set(0.45 * k + 0.1 * Math.sin(t * 30) * k);
      const tip = P.rod.userData.tip.getWorldPosition(V()); P.line.visible = true; stretchLine(P.line, tip, tip.clone().add(V(0.15 + 0.08 * Math.sin(t * 40) * k, SEA_Y - tip.y + 0.5, 0.3)));
      const f = humanFace(b);
      setCam(ctx, { pos: L(-52, 1.25 + 1.1 * yank, -17).add(V(1.5, 0, 3.0).applyAxisAngle(V(0, 1, 0), 0.5)), look: f.clone().add(up(-0.2)), fov: 40 });
      stamp(ctx, 'BITE!', tb + 0.05, { y: 0.22 }); flash(ctx, tb + 0.05, 0.1, '#ffffff', 0.5);
    },
  },
  // ── "We found him three streets away…"  — dragged flat down Main Street at speed by something in the sea
  {
    name: 'dragged down main street', start: 'b07.w10+0.3', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      const L = ctx.store.L, b = put(ctx, 'barnaby', L(-30, 2.2, 0.5), L.yaw - PI / 2); pirate(ctx);
      const P = ctx.props; ctx.add(P.rod); ctx.add(P.line);
      ctx.store.w = walkers(ctx, L, EXTRA_IDS.slice(10, 14), { x0: -24, x1: 4, seed: 9 });
    },
    update(ctx, lt) {
      const { L, w } = ctx.store, t = ctx.t, P = ctx.props, b = ctx.cast.barnaby; tick(ctx);
      animWalkers(w, L, t, 10); w.forEach((x) => { x.ch.pose('surprised', t + x.i); x.ch.face('shocked', t); });
      const x = lerp(-34, 9, lt / 1.15);
      b.root.position.copy(L(x, 2.0 + 0.25 * Math.sin(t * 9), 0.4));
      b.pose('crowdSurf', t, { intensity: 1 }); b.face('shocked', t);
      b.joints.armR.rotation.set(-3.0, 0, -0.1); b.joints.foreArmR.rotation.set(-0.1, 0, 0);
      const pull = L(x + 14, SEA_Y + 0.3, 0.6);
      const h = handW(b); holdAlong(P.rod, b, pull.clone().sub(h).normalize()); P.rod.userData.set(0.5);
      const tip = P.rod.userData.tip.getWorldPosition(V()); P.line.visible = true; stretchLine(P.line, tip, pull);
      setCam(ctx, { pos: L(x - 1.2, 1.7, 4.4), look: L(x + 0.5, 2.5, 0.4), fov: 52 });
      ctx.fx.draw((g, W, Hh) => { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 6; for (let i = 0; i < 14; i++) { const y = Hh * (0.1 + 0.8 * hash(i * 3.1 + Math.floor(t * 20))); const x0 = W * hash(i * 1.7 + Math.floor(t * 20) * 0.3); g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 - 200, y); g.stroke(); } });
    },
  },
  // ── "…still holding the rod."  — stuck in a hedge, stunned, rod still up
  {
    name: 'hedge landing', start: 'b07.w16-0.25', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props; addW(ctx, P.hedge, L(12, 0.12, -6.7), L.yaw); addW(ctx, P.leaves, L(12, 0.6, -6.7), 0);
      put(ctx, 'barnaby', L(12, 0, -6.6), L.yaw); pirate(ctx);
      ctx.add(P.rod); ctx.add(P.line); ctx.add(P.stars, ctx.cast.barnaby.joints.head); P.stars.position.set(0, 0.85, 0);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, b = ctx.cast.barnaby, tl = ctx.time('b07.w16') - 0.05; tick(ctx);
      const land = clamp((t - tl) / 0.25, 0, 1), fly = 1 - land;
      b.root.position.copy(L(12 - 6 * fly, 0.35 + 2.0 * fly, -6.55));
      b.pose('stunned', t, { seated: true, seatHeight: 0.95, intensity: 1 }); b.face(land >= 1 ? 'sweat' : 'shocked', 1.0);
      b.joints.armR.rotation.set(-2.9, 0, -0.25); b.joints.foreArmR.rotation.set(-0.2, 0, 0);
      holdAlong(P.rod, b, V(0.15, 1, 0.25).normalize()); P.rod.userData.set(0.9);
      const tip = P.rod.userData.tip.getWorldPosition(V()); P.line.visible = true; stretchLine(P.line, tip, tip.clone().add(V(0.3, -0.9, 0.4)));
      P.leaves.userData.set(clamp((t - tl) / 0.9, 0, 1));
      P.stars.userData.set(t, land >= 1 ? 1 : 0);
      const f = humanFace(b), still = ctx.time('b07.w17') - 0.1;
      const c0 = { pos: L(13.5, 1.6, -0.2), look: L(12, 1.3, -6.6), fov: 46 }, c1 = { pos: f.clone().add(V(0.6, -0.45, 2.5)), look: f.clone().add(up(-0.4)), fov: 36 };
      moveCam(ctx, c0, c1, ease.inOutCubic(clamp((t - still) / 0.5, 0, 1)));
      shakeOn(ctx, [tl + 0.25], 0.5, 0.3);
    },
  },
  // ── b08 "Until last night."  — the bedroom at quiet night, dark except the blue glowing window
  {
    name: 'until last night', start: 'b08-0.1', set: 'room',
    setup(ctx) {
      const s = ctx.set, P = ctx.props; s.setLighting('night');
      // dark room: only the glowing window lights him (a cold blue rim)
      s.root.traverse((o) => { if (o.isHemisphereLight) o.intensity *= 0.28; else if (o.isDirectionalLight) o.intensity *= 0.12; else if (o.isPointLight && o !== P.roomFill) o.intensity *= 0.4; });
      const wv = s.root.getObjectByName('windowView'); if (wv) wv.visible = false;
      const w = ctx.point('room.window');
      addW(ctx, P.view, w.clone().add(V(0.2, 0.3, -1.6)), 0);
      addW(ctx, P.roofStrip, w.clone().add(V(0, -0.85, -0.65)), 0); P.roofStrip.rotation.x = 0.35;
      addW(ctx, P.fish2, w.clone().add(V(0.4, 0.1, -1.0)), PI / 2); P.fish2.scale.setScalar(0.7);
      ctx.add(P.roomFill); P.roomFill.position.copy(w).add(V(0.1, 0.1, 0.15)); P.roomFill.intensity = 7; P.roomFill.distance = 4.5;
      put(ctx, 'me', w.clone().add(V(-0.62, -1.6, 1.0)), 3 * PI / 4);
      ctx.store.w = w;
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, w = ctx.store.w, me = ctx.cast.me;
      me.pose('idle', t, { intensity: 0.3, lookAt: w.clone().add(V(0.3, 0.0, -1.0)) }); me.face('smile', t); armFwd(me, 1, 'R', -1.3, 0.1);
      torchIn(ctx, me, w.clone().add(V(0.3, 0.1, -1.2)).sub(handW(me)).normalize(), { len: 1.6, width: 0.5 });
      P.fish2.position.copy(w).add(V(0.4 - 0.3 * Math.sin(t), 0.1, -1.0)); P.fish2.userData.set(t, { look: 1 });
      ctx.fx.vignette(0.6);
      const f = humanFace(me), cp = w.clone().add(V(1.6, -0.28, 0.72));
      setCam(ctx, { pos: cp, look: lookMix(cp, f.clone().add(up(-0.4)), w.clone().add(V(0.0, -0.1, 0)), 0.45), fov: 60 });
    },
  },
  // ── b09 "I was shining my flashlight at the fish outside my window."  — exterior, kid leaning out, a curious fish
  {
    name: 'flashlight at the fish', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'night', { bubX: -28, bubZ: 6 });
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W;
      put(ctx, 'me', W(0, W.floor, 0.42), W.yaw);
      const P = ctx.props; addW(ctx, P.fish, V(), 0); P.fish.scale.setScalar(1.5);
      addW(ctx, P.school2, W(0, 9, 4), W.yaw + PI / 2);
    },
    update(ctx, lt) {
      const { W } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me; tick(ctx);
      me.pose('idle', t, { intensity: 0.3 }); me.face('grin', t); me.joints.torso.rotation.x += 0.3;
      const sw = Math.sin(t * 2.2);
      armFwd(me, 1, 'R', -1.6, 0.25 * sw);
      const fishP = W(1.5 + 0.4 * Math.sin(t * 1.1), 4.5 + 0.25 * Math.sin(t * 1.7), 2.0);
      const tt = torchIn(ctx, me, fishP.clone().sub(handW(me)).normalize(), { len: 2.2, width: 0.6 });
      P.fish.position.copy(fishP); P.fish.lookAt(humanFace(me)); P.fish.userData.set(t, { wag: 0.7, look: 1, mouth: 0.4 });
      P.school2.userData.set(t, { speed: 1.4 });
      const f = humanFace(me);
      moveCam(ctx, { pos: W(-1.9, 3.2, 6.2), look: f.clone().add(V(0, -0.5, 0)).addScaledVector(W.fwd, 1.0), fov: 40 }, { pos: W(-1.6, 3.4, 5.4), look: f.clone().add(V(0, -0.45, 0)).addScaledVector(W.fwd, 1.0), fov: 38 }, lt / 3.2, 0.8);
    },
  },
  // ── "It slipped."
  {
    name: 'it slipped', start: 'slip-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'night', { bubX: -28, bubZ: 6 });
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W;
      put(ctx, 'me', W(0, W.floor, 0.42), W.yaw);
      ctx.add(ctx.props.torch);
    },
    update(ctx, lt) {
      const { W } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me, ts = ctx.markers.slip; tick(ctx);
      const d = t - ts;
      me.pose(d > 0 ? 'surprised' : 'idle', t, { intensity: 0.7 }); me.face(d > 0.05 ? 'shocked' : 'grin', 0.5); me.joints.torso.rotation.x += 0.35;
      armFwd(me, 1, 'R', -1.5, 0);
      const h = handW(me);
      if (d < 0) holdAlong(P.torch, me, W.fwd.clone().add(up(0.2)).normalize());
      else {
        const p = h.clone().addScaledVector(W.fwd, 0.6 * d).add(up(1.0 * d - 4.9 * d * d));
        const ry = W.roof(0.1, 0.9 + 0.6 * d).y + 0.07; if (p.y < ry) p.y = ry;
        P.torch.position.copy(p); P.torch.rotation.set(d * 9, W.yaw + d * 3, d * 5);
      }
      P.torch.userData.set(1, 1.2, 0.45);
      const f = humanFace(me);
      setCam(ctx, { pos: f.clone().addScaledVector(W.fwd, 2.5).addScaledVector(W.left, 0.7).add(up(-0.5)), look: f.clone().add(up(-0.33)), fov: 42 }, 0.9);
    },
  },
  // ── "Rolled down the roof."
  {
    name: 'rolled down the roof', start: 'b09.w13-0.08', set: 'town',
    setup(ctx) {
      town(ctx, 'night', { bubX: -28, bubZ: 6 });
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W;
      put(ctx, 'me', W(0, W.floor, 0.42), W.yaw);
      ctx.add(ctx.props.torch);
    },
    update(ctx, lt) {
      const { W } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me; tick(ctx);
      me.pose('surprised', t, { intensity: 0.6 }); me.face('shocked', t); me.joints.torso.rotation.x += 0.4;
      const u = clamp(lt / 1.25, 0, 1), z = lerp(0.6, W.roof ? 2.15 : 2.1, ease.inQuad(u));
      const p = W.roof(0.15, z).add(up(0.08)).addScaledVector(W.fwd, 0);
      P.torch.position.copy(p); P.torch.rotation.order = 'YXZ'; P.torch.rotation.set(0, W.yaw + PI / 2, z * 6);
      P.torch.userData.set(1, 1.0, 0.4);
      const c = W.roof(1.6, 1.2);
      setCam(ctx, { pos: c.clone().add(up(0.75)).addScaledVector(W.fwd, 1.6), look: p.clone().add(up(0.05)), fov: 42 }, 0.7);
    },
  },
  // ── "And stopped…"  — wobbles in the gutter and stands up
  {
    name: 'and stopped', start: 'b09.w17-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'night', { bubX: -28, bubZ: 6 });
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W;
      ctx.add(ctx.props.torch);
    },
    update(ctx, lt) {
      const { W } = ctx.store, t = ctx.t, P = ctx.props, ts = ctx.time('b09.w18'); tick(ctx);
      const g = W.roof(0.15, 2.2).add(up(0.12));
      const k = ease.inOutCubic(clamp((t - ts - 0.15) / 0.5, 0, 1)), wob = Math.max(0, 1 - lt / 0.8) * Math.sin(t * 22) * 0.25;
      P.torch.position.copy(g).add(up(0.08 * k)); P.torch.rotation.order = 'YXZ';
      P.torch.rotation.set(-PI / 2 * k + wob * (1 - k), W.yaw + PI / 2 * (1 - k), 13.2 * (1 - k));
      P.torch.userData.set(1, lerp(0.8, 2.5, k), 0.45);
      setCam(ctx, { pos: g.clone().addScaledVector(W.fwd, 1.6).addScaledVector(W.left, -0.9).add(up(0.2)), look: g.clone().add(up(0.25)), fov: 40 }, 0.8);
    },
  },
  // ── "…pointing straight up."  — low angle: the beam shoots up into the sea
  {
    name: 'pointing straight up', start: 'up-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'night', { bubX: -28, bubZ: 6 });
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W;
      put(ctx, 'me', W(0, W.floor, 0.42), W.yaw);
      ctx.add(ctx.props.torch);
    },
    update(ctx, lt) {
      const { W } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me; tick(ctx, { sea: { flare: clamp(lt / 0.8, 0, 1) * 0.8, flarePos: W(0.15, SEA_Y, 2.2), flareR: 2.5 } });
      me.pose('idle', t, { intensity: 0.3, headPitch: 0.5 }); me.face('shocked', t); me.joints.torso.rotation.x += 0.35;
      const g = W.roof(0.15, 2.2).add(up(0.2));
      P.torch.position.copy(g); P.torch.rotation.order = 'YXZ'; P.torch.rotation.set(-PI / 2, W.yaw, 0);
      const len = ease.outCubic(clamp(lt / 0.5, 0, 1)) * (SEA_Y - g.y - 0.3);
      P.torch.userData.set(1, Math.max(0.5, len), 1.3);
      const pos = g.clone().addScaledVector(W.fwd, 3.2).addScaledVector(W.left, 1.6).add(up(-1.4));
      setCam(ctx, { pos, look: g.clone().add(up(8)), fov: 60 }, 0.6);
    },
  },
  // ── b10 "The whole deep lit up."
  {
    name: 'the deep lit up', start: 'b10-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'night', { bubX: -28, bubZ: 6 });
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W;
      put(ctx, 'me', W(0, W.floor, 0.42), W.yaw); ctx.add(ctx.props.torch);
    },
    update(ctx, lt) {
      const { W, L } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me, tl = ctx.markers.lit;
      const k = ease.outCubic(clamp((t - tl + 0.15) / 0.6, 0, 1));
      const pk = Math.exp(-Math.max(0, t - tl) * 3) * k;   // a hard flare that settles into the lit-up deep
      tick(ctx, { sea: { flare: 0.8 + 0.6 * k + 0.6 * pk, flarePos: W(0.15, SEA_Y, 2.2), flareR: 2.5 + 4 * k, glow: lerp(0.55, 0.95, k) + 0.5 * pk, caus: lerp(0.5, 0.8, k),
        deep: mixHex('#051636', '#0e2a6a', k), shallow: mixHex('#0c3a78', '#1d64b8', k), light: mixHex('#4aa8d8', '#9fe8ff', k) }, shafts: 0.3 + 0.5 * k });
      me.pose('surprised', t, { intensity: 0.5, headPitch: -0.5 }); me.face('shocked', t); me.joints.torso.rotation.x += 0.2;
      const g = W.roof(0.15, 2.2).add(up(0.2));
      P.torch.position.copy(g); P.torch.rotation.order = 'YXZ'; P.torch.rotation.set(-PI / 2, W.yaw, 0); P.torch.userData.set(1, SEA_Y - g.y - 0.3, 1.3);
      moveCam(ctx, { pos: L(-21, 1.3, -3.5), look: L(-28, 13, 9), fov: 60 }, { pos: L(-21.5, 1.2, -4.2), look: L(-28, 15, 8), fov: 62 }, lt / 1.4, 0.4);
      flash(ctx, tl, 0.12, '#cff8ff', 0.6); shakeOn(ctx, [tl], 0.2, 0.3);
    },
  },
  // ── "And something opened one giant, glowing eye."
  {
    name: 'eye opens', start: 'b10.w5-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'flare', { bubX: -28, bubZ: 6 });
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W; ctx.add(ctx.props.torch);
    },
    update(ctx, lt) {
      const { W, L } = ctx.store, t = ctx.t, P = ctx.props, te = ctx.markers.eye;
      tick(ctx, { sea: { flare: 1.0, flarePos: W(0.15, SEA_Y, 2.2), flareR: 5 } });
      const g = W.roof(0.15, 2.2).add(up(0.2));
      P.torch.position.copy(g); P.torch.rotation.order = 'YXZ'; P.torch.rotation.set(-PI / 2, W.yaw, 0); P.torch.userData.set(1, SEA_Y - g.y - 0.3, 1.3);
      const open = ease.inOutCubic(clamp((t - te) / 0.8, 0, 1));
      deepAt(ctx, L(-27, SEA_Y - 0.4, 3.0), { yaw: PI, s: 15, set: { lid: 1 - open, glow: 0.6 + 0.8 * open, coil: 1, reach: 0 } });
      moveCam(ctx, { pos: L(-19, 1.4, -4.0), look: L(-26, 15, 4), fov: 66 }, { pos: L(-19.5, 1.5, -3.2), look: L(-27, 16.5, 3.5), fov: 60 }, lt / 1.4, 0.4);
      shakeOn(ctx, [te + 0.5], 0.35, 0.4);
    },
  },
  // ── eye fills the frame
  {
    name: 'eye close-up', start: 'b10.w9-0.1', set: 'town',
    setup(ctx) { town(ctx, 'flare'); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx, { sea: { flare: 1.0, flarePos: L(-30, SEA_Y, 3), flareR: 5 } });
      const D = deepAt(ctx, L(-27, SEA_Y - 0.4, 3.0), { yaw: PI, s: 15, set: { lid: 0, glow: 1.4, lookX: 0.15 * Math.sin(t * 2), lookY: 0.5, coil: 1 } });
      const e = D.userData.eyeWorld();
      moveCam(ctx, { pos: e.clone().add(V(1.5, -15, -12.5)), look: e.clone().add(up(-2.0)), fov: 42 }, { pos: e.clone().add(V(1.2, -14, -11)), look: e.clone().add(up(-2.0)), fov: 40 }, lt / 1.0);
      ctx.fx.vignette(0.45);
    },
  },
  // ── "Right above my house."
  {
    name: 'right above my house', start: 'b10.w12-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'flare');
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W; ctx.add(ctx.props.torch);
    },
    update(ctx, lt) {
      const { W, L } = ctx.store, t = ctx.t, P = ctx.props;
      tick(ctx, { sea: { flare: 1.0, flarePos: W(0.15, SEA_Y, 2.2), flareR: 5 } });
      const g = W.roof(0.15, 2.2).add(up(0.2));
      P.torch.position.copy(g); P.torch.rotation.order = 'YXZ'; P.torch.rotation.set(-PI / 2, W.yaw, 0); P.torch.userData.set(1, SEA_Y - g.y - 0.3, 1.3);
      deepAt(ctx, L(-27, SEA_Y - 0.4, 3.0), { yaw: PI, s: 15, set: { lid: 0, glow: 1.3, coil: 1, lookY: 0.4 } });
      moveCam(ctx, { pos: L(-31, 3.0, -9.0), look: L(-27, 12, 10), fov: 64 }, { pos: L(-31.5, 2.6, -9.6), look: L(-27, 13, 10), fov: 66 }, lt / 1.3, 0.3);
    },
  },
  // ── b11 HUSS ×6 — shocked kid at the window / tentacles uncurl / lamps flicker
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `huss tentacles #${i + 1}`, start: H('b11', i), set: 'town',
    setup(ctx) {
      town(ctx, 'flare');
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W; ctx.add(ctx.props.torch);
      put(ctx, 'me', W(0, W.floor, 0.42), W.yaw);
    },
    update(ctx) {
      const { W, L } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me, hits = hussHits(ctx, 'b11');
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9, n = hits.filter((x) => x <= t).length;
      tick(ctx, { sea: { flare: 1.0, flarePos: W(0.15, SEA_Y, 2.2), flareR: 5 }, flicker: 1 });
      const g = W.roof(0.15, 2.2).add(up(0.2));
      P.torch.position.copy(g); P.torch.rotation.order = 'YXZ'; P.torch.rotation.set(-PI / 2, W.yaw, 0); P.torch.userData.set(1, SEA_Y - g.y - 0.3, 1.3);
      const reach = clamp((t - ctx.time('b11')) / 1.6, 0, 1);
      // #4 cheats the eye back over the roof so it looms above his head from the porch roof
      const eyeAt = i === 3 ? L(-27, SEA_Y - 0.4, 13.5) : L(-27, SEA_Y - 0.4, 3.0);
      const unfurl = i === 4 ? ease.outCubic(clamp((t - hits[4] + 0.05) / 0.3, 0, 1)) : 0;
      deepAt(ctx, eyeAt, { yaw: PI, s: 15, set: { lid: 0, glow: 1.3, coil: 1 - 0.6 * reach - 0.4 * unfurl, reach: Math.max(reach, unfurl), lookY: i === 3 ? -0.3 : 0.4, sway: 2 } });
      me.pose('surprised', t, { intensity: 1, headPitch: -0.45 }); me.face(dh < 0.22 ? 'huss' : 'shocked', t); me.joints.torso.rotation.x += 0.25;
      const f = humanFace(me);
      if (i === 2) P.lamps.userData.set(t, 1, 0, (j, p) => Math.sin(t * 22 - p.x * 0.28) > -0.1);
      if (i === 4) { const tip = L(-12, SEA_Y - 1.5, 3).lerp(L(10, SEA_Y - 4.5, -1.5), unfurl); tentOn(ctx, L(-14, SEA_Y + 1.5, 3), tip, t, { wig: 0.8, r0: 1.6, r1: 0.2 }); }
      const rp = W(0.6, W.floor + 0.25, 4.3);
      const cams = [
        { pos: f.clone().addScaledVector(W.fwd, 3.7).addScaledVector(W.left, -0.7).add(up(0.85)), look: f.clone().add(up(-0.6)), fov: 44 },
        { pos: L(-14, 1.2, -2.0), look: L(-26, 16, 3), fov: 68 },
        { pos: L(-1.5, 1.3, -1.8), look: L(-30, 7.5, -3.5), fov: 60 },
        { pos: rp, look: lookMix(rp, f.clone().add(up(0.1)), eyeAt, 0.5), fov: 68 },
        { pos: L(-7, 0.7, 3.0), look: L(6, 14, -1.5), fov: 70 },
        { pos: L(-36, 1.6, -1), look: L(-27, 12, 8), fov: 66 },
      ];
      setCam(ctx, cams[i], 0.9); ctx.cam.punch(hits, t, 0.1, 0.2); shakeOn(ctx, hits, 0.35, 0.25);
    },
  })),
  // ── b12 "A tentacle came down through the water."
  {
    name: 'tentacle comes down', start: 'b12-0.1', set: 'town',
    setup(ctx) { town(ctx, 'flare'); ctx.add(ctx.props.ripple); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx, { sea: { flare: 1.2, flarePos: L(-24, SEA_Y, 2), flareR: 5 } });
      deepAt(ctx, L(-27, SEA_Y + 6, 3.0), { yaw: PI, s: 15, set: { lid: 0, glow: 1.0, coil: 0.5, reach: 0.6 } });
      const k = ease.inOutSine(clamp(lt / 1.5, 0, 1));
      const base = L(-6, SEA_Y + 1, 0), tip = L(-6, SEA_Y - 1, 0).lerp(L(-5, 6.0, -4.0), k);
      tentOn(ctx, base, tip, t, { wig: 0.4, r0: 1.6 });
      const rp = L(-6, 0, -0.3); P.ripple.position.set(rp.x, SEA_Y + seaWave(rp.x, rp.z, t) - 0.3, rp.z); P.ripple.userData.set(t, 1, { size: 6, speed: 1.0 });
      setCam(ctx, { pos: L(-0.5, 0.75, 3.2), look: L(-5.5, lerp(13, 9.5, k), -1.5), fov: 70 }, 0.3);
    },
  },
  // ── "Slow. Curious."
  {
    name: 'slow curious', start: 'b12.w6-0.1', set: 'town',
    setup(ctx) { town(ctx, 'flare'); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t; tick(ctx, { sea: { flare: 1.2, flarePos: L(-24, SEA_Y, 2), flareR: 5 } });
      const base = L(-6, SEA_Y + 1, 0), tip = L(-5 + 0.5 * Math.sin(t * 1.2), 6.0 + 0.4 * Math.sin(t * 0.9), -4.0);
      const T0 = tentOn(ctx, base, tip, t, { wig: 0.5, r0: 1.4 });
      const tp = T0.userData.tipWorld();
      moveCam(ctx, { pos: tp.clone().add(V(2.6, -1.2, 3.2)), look: tp.clone().add(V(0, 0.6, 0)), fov: 42 }, { pos: tp.clone().add(V(2.0, -1.0, 2.6)), look: tp.clone().add(V(0, 0.6, 0)), fov: 40 }, lt / 1.3, 0.6);
    },
  },
  // ── "Feeling its way down Main Street, window by window."  — the tip peeks into lit windows, curtains snap shut
  {
    name: 'window by window', start: 'b12.w8-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'flare');
      const P = ctx.props, wins = ['house.2.window.1', 'house.1.window.1', 'house.0.window.2'];
      ctx.store.wins = wins.map((n, i) => { const a = ctx.anchor(n); a.updateWorldMatrix(true, false); const p = a.getWorldPosition(V()), yaw = yawOf(a); addW(ctx, P.curtains[i], p.clone().addScaledVector(fwdOf(yaw), -0.2), yaw); return { p, yaw }; });
    },
    update(ctx, lt) {
      const { L, wins } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx, { sea: { flare: 1.2, flarePos: L(-20, SEA_Y, 2), flareR: 5 } });
      const dur = ctx.time('b13') - 0.1 - ctx.time('b12.w8') + 0.1, u = clamp(lt / dur, 0, 1) * 3;
      const seg = Math.min(2, Math.floor(u)), f = u - seg;
      const at = (j) => wins[j].p.clone().addScaledVector(fwdOf(wins[j].yaw), 0.9).add(up(-0.1));
      const a = at(Math.max(0, seg - 1 + (f > 0.4 ? 1 : 0))), b = at(seg);
      const tip = seg === 0 ? L(-5, 6, -4).lerp(at(0), ease.inOutCubic(clamp(f / 0.5, 0, 1))) : at(seg - 1).lerp(at(seg), ease.inOutCubic(clamp(f / 0.5, 0, 1)));
      tip.y += 0.6 * Math.sin(PI * clamp(f / 0.5, 0, 1));
      const base = L(lerp(-6, -20, clamp(lt / dur, 0, 1)), SEA_Y + 1, 0);
      const T1 = tentOn(ctx, base, tip, t, { wig: 0.4, r0: 1.4, approach: V(0, 0, -1) });
      P.curtains.forEach((c, j) => { const arrive = (j + 0.45) / 3 * dur; c.userData.set(clamp((lt - arrive) / 0.25, 0, 1), 1); });
      const tw = T1.userData.tipWorld();
      // camera on the pavement in front of the houses (inside the lamp line) so no lamp post stands in the foreground
      const cp = V(tw.x + 2.6, 1.3, L(0, 0, -6.6).z);
      setCam(ctx, { pos: cp, look: tw.clone().add(V(-0.5, -1.2, 0)), fov: 62 }, 0.5);
    },
  },
  // ── b13 "Mrs. Pemberton bonked it with the frying pan."
  ...[0, 1].map((i) => ({
    name: i === 0 ? 'pemberton bursts out' : 'BONK', start: i === 0 ? 'b13-0.1' : 'bonk-0.2', set: 'town',
    setup(ctx) {
      town(ctx, 'flare');
      const a = ctx.anchor('house.6.door'); a.updateWorldMatrix(true, false);
      const dp = a.getWorldPosition(V()), yaw = yawOf(a), fw = fwdOf(yaw);
      const pb = put(ctx, 'pemberton', dp.clone().addScaledVector(fw, -0.2), yaw);
      // where her pan lands at the bonk → the tentacle tip goes there
      const tb = ctx.markers.bonk; pemBonkPose(pb, tb, tb); pb.root.position.copy(dp.clone().addScaledVector(fw, 0.6));
      ctx.add(ctx.props.pan); const pc = panAlong(ctx, pb);
      ctx.store.tipAt = pc.clone().add(up(-0.22)); ctx.store.dp = dp; ctx.store.fw = fw; ctx.store.yaw = yaw;
      ctx.props.dings.forEach((d) => ctx.add(d));
    },
    update(ctx, lt) {
      const { L, tipAt, dp, fw, yaw } = ctx.store, t = ctx.t, P = ctx.props, pb = ctx.cast.pemberton, tb = ctx.markers.bonk;
      tick(ctx, { sea: { flare: 1.2, flarePos: L(-20, SEA_Y, 2), flareR: 5 } });
      const step = ease.outCubic(clamp((t - ctx.time('b13') - 0.2) / 0.5, 0, 1));
      pb.root.position.copy(dp.clone().addScaledVector(fw, lerp(-0.2, 0.6, step)));
      pemBonkPose(pb, t, tb); pb.face(t < tb ? 'determined' : 'smug', t);
      const pc = panAlong(ctx, pb);
      const base = L(-14, SEA_Y + 1, 2), tip = tipAt.clone().add(V(0.05 * Math.sin(t * 1.3), 0.05 * Math.sin(t * 1.1), 0));
      tentOn(ctx, base, tip, t, { wig: 0.25, r0: 1.4, approach: fw.clone().negate() });
      const f = humanFace(pb);
      let cam;
      if (i === 0) { const cp = tipAt.clone().addScaledVector(fw, 2.0).addScaledVector(leftOf(yaw), -0.9).add(up(0.25)); cam = setCam(ctx, { pos: cp, look: lookMix(cp, dp.clone().addScaledVector(fw, 0.3).add(up(1.2)), tipAt, 0.3), fov: 50 }, 0.7); }
      else {
        // frame so the impact sits at y≈0.4 and her face at ≈0.2 (just under the BONK! stamp)
        const H = Math.max(0.9, 2 * (f.y - tipAt.y)), dd = H / Math.tan(23 * PI / 180);
        const mid = f.clone().lerp(tipAt, 0.5), lk = mid.clone(); lk.y = tipAt.y - 0.2 * H;
        const cp = mid.clone().addScaledVector(fw, dd * 0.93).addScaledVector(leftOf(yaw), -dd * 0.36); cp.y = f.y + 0.1;
        cam = setCam(ctx, { pos: cp, look: lk, fov: 46 }, 0.8);
      }
      const d = t - tb; P.dings[0].position.copy(pc).add(up(0.3)); P.dings[0].lookAt(cam.pos); P.dings[0].userData.set(d > 0 ? d / 0.5 : 0); P.dings[0].scale.multiplyScalar(0.3); P.dings[0].position.lerp(tipAt, 0.5); P.dings[1].visible = false;
      if (i === 1) { stamp(ctx, 'BONK!', tb, { y: 0.11, size: 120, fill: '#ffffff', stroke: '#7b3fbf' }); shakeOn(ctx, [tb], 0.4, 0.25); flash(ctx, tb, 0.08, '#ffffff', 0.4); }
    },
  })),
  // ── "It didn't even notice."  — the tip doesn't twitch; she backs inside with a sweat face
  {
    name: 'did not notice', start: 'b13.w7-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'flare');
      const a = ctx.anchor('house.6.door'); a.updateWorldMatrix(true, false);
      const dp = a.getWorldPosition(V()), yaw = yawOf(a), fw = fwdOf(yaw);
      const pb = put(ctx, 'pemberton', dp.clone().addScaledVector(fw, 0.6), yaw);
      pemBonkPose(pb, ctx.markers.bonk, ctx.markers.bonk); const pc = panAlong(ctx, pb);
      ctx.store.tipAt = pc.clone().add(up(-0.22)); ctx.store.dp = dp; ctx.store.fw = fw; ctx.store.yaw = yaw;
    },
    update(ctx, lt) {
      const { L, tipAt, dp, fw, yaw } = ctx.store, t = ctx.t, pb = ctx.cast.pemberton;
      tick(ctx, { sea: { flare: 1.2, flarePos: L(-20, SEA_Y, 2), flareR: 5 } });
      const back = ease.inOutSine(clamp((lt - 0.6) / 2.0, 0, 1));
      pb.root.position.copy(dp.clone().addScaledVector(fw, lerp(0.6, -0.1, back)));
      pb.pose('idle', t, { intensity: 0.3, lookAt: tipAt }); pb.face('sweat', t);
      pb.joints.armR.rotation.set(-0.5, 0, -0.1); pb.joints.foreArmR.rotation.set(-0.9, 0, 0);
      panAlong(ctx, pb);
      tentOn(ctx, L(-14, SEA_Y + 1, 2), tipAt, t, { wig: 0.2, r0: 1.4, approach: fw.clone().negate() });
      const f = humanFace(pb);
      moveCam(ctx, { pos: f.clone().addScaledVector(fw, 3.2).addScaledVector(leftOf(yaw), 1.4).add(up(-0.4)), look: f.clone().add(up(-0.3)).addScaledVector(fw, 0.6), fov: 42 }, { pos: f.clone().addScaledVector(fw, 2.6).addScaledVector(leftOf(yaw), 1.1).add(up(-0.4)), look: f.clone().add(up(-0.3)).addScaledVector(fw, 0.6), fov: 40 }, lt / 2, 0.8);
    },
  },
  // ── "Top ten respect."
  {
    name: 'top ten respect', start: 'respect-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'flare');
      const a = ctx.anchor('house.6.door'); a.updateWorldMatrix(true, false);
      const dp = a.getWorldPosition(V()), yaw = yawOf(a), fw = fwdOf(yaw);
      const pb = put(ctx, 'pemberton', dp.clone().addScaledVector(fw, 0.6), yaw);
      pemBonkPose(pb, ctx.markers.bonk, ctx.markers.bonk); const pc = panAlong(ctx, pb);
      ctx.store.tipAt = pc.clone().add(up(-0.22)); ctx.store.dp = dp; ctx.store.fw = fw; ctx.store.yaw = yaw;
    },
    update(ctx, lt) {
      const { L, tipAt, dp, fw, yaw } = ctx.store, t = ctx.t, pb = ctx.cast.pemberton;
      tick(ctx, { sea: { flare: 1.2, flarePos: L(-20, SEA_Y, 2), flareR: 5 } });
      pb.root.position.copy(dp.clone().addScaledVector(fw, -0.1));
      pb.pose('idle', t, { intensity: 0.3, lookAt: tipAt }); pb.face('sweat', t);
      pb.joints.armR.rotation.set(-2.7, 0, -0.2); pb.joints.foreArmR.rotation.set(-0.3, 0, 0);
      panAlong(ctx, pb);
      tentOn(ctx, L(-14, SEA_Y + 1, 2), tipAt.clone().add(V(0, 0.15 * Math.sin(t * 2), 0)), t, { wig: 0.2, r0: 1.4, approach: fw.clone().negate() });
      const f = humanFace(pb), sd = leftOf(yaw);
      const c0 = { pos: f.clone().addScaledVector(fw, 3.7).addScaledVector(sd, -1.2).add(up(-0.35)), look: f.clone().add(up(-0.45)).addScaledVector(sd, 0.35), fov: 46 };
      const c1 = { pos: f.clone().addScaledVector(fw, 3.4).addScaledVector(sd, -1.1).add(up(-0.35)), look: f.clone().add(up(-0.45)).addScaledVector(sd, 0.35), fov: 46 };
      moveCam(ctx, c0, c1, lt / 1.2, 0.8);
      tag(ctx, 'TOP 10 RESPECT', ctx.markers.respect, Infinity, { y: 0.12, size: 88, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b14 "It wasn't hunting. It was following the light. Like a moth."  — on the roof, the tip sways after the beam
  ...[0, 1, 2].map((i) => ({
    name: ['moth: kid on the roof', 'moth: tip follows', 'moth: eye follows'][i], start: ['b14-0.1', 'b14.w3-0.1', 'b14.w8-0.1'][i], set: 'town',
    setup(ctx) {
      town(ctx, 'flare');
      const W = kidWin(ctx); bayIn(ctx, W, 0.9); ctx.store.W = W;
      put(ctx, 'me', W.roof(-0.7, 1.0), W.yaw);
      ctx.add(ctx.props.torch);
    },
    update(ctx, lt) {
      const { W, L } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      tick(ctx, { sea: { flare: 1.2, flarePos: L(-27, SEA_Y, 2), flareR: 5 } });
      const sw = Math.sin((t - ctx.time('b14')) * 2.4);
      me.pose('think', t, { intensity: 0.6, headYaw: 0.25 * sw }); me.face(i === 0 ? 'think' : 'determined', 0.5);
      armFwd(me, 1, 'R', -1.9, 0.55 * sw);
      const h = handW(me), beamDir = i === 0 ? up(1).addScaledVector(W.left, -0.7 * sw).addScaledVector(W.fwd, 0.3).normalize() : W.fwd.clone().applyAxisAngle(V(0, 1, 0), -0.55 * sw).add(up(0.7)).normalize();
      torchIn(ctx, me, beamDir, { len: 4.5, width: 0.9 });
      const tip = h.clone().addScaledVector(beamDir, i === 0 ? 4.2 : 3.4).add(V(0, 0.1 * Math.sin(t * 2), 0));
      tentOn(ctx, L(-20, SEA_Y + 1, 0), tip, t, { wig: 0.25, r0: 1.4, approach: beamDir.clone().negate().setY(0).normalize() });
      deepAt(ctx, i === 2 ? L(-31, SEA_Y + 1, 6.5) : L(-27, SEA_Y + 3, 3.0), { yaw: i === 2 ? PI - 0.5 : PI, s: 15, set: { lid: 0, glow: 1.2, coil: 0.6, reach: 0.5, lookX: -0.9 * sw, lookY: 0.5 } });
      const f = humanFace(me);
      if (i === 0) {
        const c0 = f.clone().addScaledVector(W.fwd, 2.7).addScaledVector(W.left, 1.1).add(up(-0.85)), c1 = f.clone().addScaledVector(W.fwd, 2.4).addScaledVector(W.left, 1.0).add(up(-0.8));
        const cp = c0.lerp(c1, clamp(lt / 1.2, 0, 1));
        setCam(ctx, { pos: cp, look: f.clone().add(up(-0.42)), fov: 56 }, 0.8);
      } else if (i === 1) setCam(ctx, { pos: W(3, 1.8, 7), look: W(-0.4, 5.0, 2.5), fov: 60 }, 0.5);
      else { const e = P.deep.userData.eyeWorld(); const pos = W(3.5, 0.8, 9.5); setCam(ctx, { pos, look: lookMix(pos, f, e, 0.5), fov: 76 }, 0.5); tag(ctx, 'LIKE A MOTH', ctx.time('b14.w8'), Infinity, { y: 0.13, size: 86 }); }
    },
  })),
  // ── b15 "So I grabbed the flashlight,"  — running down Main Street toward the tower, the tentacle trailing
  {
    name: 'run to the tower', start: 'b15-0.1', set: 'town',
    setup(ctx) { town(ctx, 'flare'); ctx.add(ctx.props.torch); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me; tick(ctx, { sea: { flare: 1.2, flarePos: L(-36, SEA_Y, 0), flareR: 5 } });
      const x = -30 - 2.6 * lt;
      me.root.position.copy(L(x, 0, 1.0)); me.root.rotation.set(0, L.yaw - PI / 2, 0);
      me.pose('walk', t, { speed: 2.4 }); me.face('determined', t);
      armUp(me, 1, 'R', 0.5);
      torchIn(ctx, me, V(-0.3, 1, 0).normalize(), { len: 3.5, width: 0.8 });
      const tip = L(x + 3.2, 3.6 + 0.4 * Math.sin(t * 2), 1.0 + 0.6 * Math.sin(t * 1.3));
      tentOn(ctx, L(-22, SEA_Y + 1, 0), tip, t, { wig: 0.4, r0: 1.4 });
      const f = humanFace(me);
      setCam(ctx, { pos: L(x - 3.6, 0.6, 2.6), look: f.clone().add(V(1.5, -0.4, 0)), fov: 54 }, 0.7);
    },
  },
  // ── "…climbed the clock tower,"
  {
    name: 'climb the tower', start: 'climb-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'flare'); const L = ctx.store.L, P = ctx.props;
      ctx.add(P.ladder, ctx.set.root); P.ladder.position.set(TX + 0.9, 0, TZ + 4.1); P.ladder.rotation.set(-0.065, 0, 0);
      put(ctx, 'me', L(TX + 0.9, 3, TZ + 4.55), L.yaw);
      ctx.add(P.torch, ctx.cast.me.joints.torso); P.torch.position.set(0.0, 0.1, -0.3); P.torch.rotation.set(-PI / 2, 0, 0); P.torch.userData.set(1, 3.0, 0.7);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me; tick(ctx, { sea: { flare: 1.2, flarePos: L(-48, SEA_Y, 2), flareR: 5 } });
      const k = clamp(lt / 1.45, 0, 1), y = lerp(4.0, 13.5, k), z = TZ + 4.4 - 0.065 * y;
      me.root.position.copy(L(TX + 0.9, y, z));
      climbPose(me, t, 3.2); me.face('determined', t);
      const tip = L(TX + 3.0 + 0.4 * Math.sin(t * 1.5), y - 1.9, TZ + 5.2);
      tentOn(ctx, L(TX + 26, SEA_Y + 1, TZ + 8), tip, t, { wig: 0.4, r0: 1.4, approach: V(-1, 0, 0) });
      const f = humanFace(me);
      setCam(ctx, { pos: me.root.position.clone().add(V(-2.2, -3.2, 6.4)), look: f.clone().add(up(-1.3)), fov: 58 }, 0.6);
    },
  },
  // ── "…and threw it as high as I could."
  {
    name: 'throw it up', start: 'throw-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'flare'); const L = ctx.store.L, P = ctx.props;
      put(ctx, 'me', L(TX + 0.3, DY, TZ + 0.4), L.yaw + 0.3); ctx.add(P.torch); P.trail.forEach((s) => ctx.add(s)); ctx.add(P.star);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me, tt = ctx.markers.throw + 0.05;
      const d = t - tt, tp = throwPos(L, Math.max(0, d));
      tick(ctx, { sea: { flare: 0.7, flarePos: tp, flareR: 2.5, glow: 0.7, caus: 0.5, deep: '#0a2458', shallow: '#164f96' }, shafts: 0.25 });
      trailOn(ctx, L, d);
      me.pose(d < 0 ? 'idle' : 'cheer', t, { intensity: 0.6, headPitch: -0.25 }); me.face(d < 0 ? 'determined' : 'huss', t);
      const wind = clamp((d + 0.3) / 0.3, 0, 1);
      if (d < 0) { me.joints.armR.rotation.set(lerp(-1.0, 0.9, wind), 0, -0.2); me.joints.foreArmR.rotation.set(-1.2, 0, 0); me.joints.torso.rotation.x += -0.12 * wind; }
      else { me.joints.armR.rotation.set(-3.0, 0, -0.1); me.joints.foreArmR.rotation.set(-0.1, 0, 0); }
      if (d < 0) torchIn(ctx, me, V(0, 1, 0.2).normalize(), { len: 3, width: 0.8 });
      else { const p = throwPos(L, d); P.torch.position.copy(p); P.torch.rotation.set(d * 9, d * 5, 0); P.torch.userData.set(1, 3, 0.8); }
      setCam(ctx, { pos: L(TX + 4.2, DY + 0.9, TZ + 5.2), look: L(TX + 0.5, DY + 5, TZ), fov: 60 }, 0);
      fill(ctx, humanFace(me).addScaledVector(fwdOf(me.root.rotation.y), 1.6), 0.9);
      shakeOn(ctx, [tt], 0.3, 0.25);
    },
  },
  // ── b16 "The tentacle followed it all the way back up."
  {
    name: 'shooting star backwards', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'flare'); const L = ctx.store.L, P = ctx.props;
      put(ctx, 'me', L(TX + 0.3, DY, TZ + 0.4), L.yaw + 0.3); ctx.add(P.torch); P.trail.forEach((s) => ctx.add(s)); ctx.add(P.star);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me, tt = ctx.markers.throw + 0.05;
      const d = t - tt, p = throwPos(L, d);
      tick(ctx, { sea: { flare: 0.7, flarePos: p, flareR: 2.5, glow: 0.7, opacity: 0.9, caus: 0.45, deep: '#0a2458', shallow: '#164f96' }, shafts: 0.2 });
      P.torch.position.copy(p); P.torch.rotation.set(d * 9, d * 5, 0); P.torch.userData.set(1, 3, 0.8);
      trailOn(ctx, L, d);
      me.pose('idle', t, { intensity: 0.4, headPitch: -0.9 }); me.face('shocked', t); me.joints.armR.rotation.set(-2.6, 0, -0.2);
      const tip = throwPos(L, d - 0.45).add(V(2.5, 1.0, -2.5)); tip.y = Math.max(tip.y, DY + 7);
      tentOn(ctx, L(TX + 16, SEA_Y + 2, TZ - 5), tip, t, { wig: 0.5, r0: 1.4, approach: V(-0.6, 0, 0.6).normalize(), emi: 0.25 });
      deepAt(ctx, L(TX + 17, SEA_Y + 5 + 2 * clamp(lt / 2.4, 0, 1), TZ - 6), { yaw: -0.4, s: 15, set: { lid: 0, glow: 1.2, coil: 1, reach: 0, lookY: 0.6 } });
      const k = ease.inOutSine(clamp(lt / 2.4, 0, 1));
      setCam(ctx, { pos: L(TX + 5.5, DY + 0.2, TZ + 7.0), look: L(TX + 1.2, lerp(DY + 7, DY + 10, k), TZ - 1.0), fov: 66 }, 0);
      fill(ctx, humanFace(me).add(V(0, 0.4, 0)).addScaledVector(fwdOf(me.root.rotation.y), 1.2), 1.0);
    },
  },
  // ── "The eye closed."
  {
    name: 'the eye closed', start: 'close-0.12', set: 'town',
    setup(ctx) { town(ctx, 'flare'); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, tc = ctx.markers.close, cl0 = clamp((t - tc) / 0.7, 0, 1);
      tick(ctx, { sea: { flare: 0.8 * (1 - cl0), flarePos: L(TX + 12, SEA_Y, TZ - 3), flareR: 6, glow: lerp(1.1, 0.75, cl0), caus: lerp(0.9, 0.6, cl0) } });
      const cl = ease.inOutCubic(clamp((t - tc) / 0.7, 0, 1));
      deepAt(ctx, L(TX + 16, SEA_Y + 3, TZ - 5), { yaw: 1.07, s: 15, set: { lid: cl, glow: 1.4 - 1.0 * cl, coil: 1, lookY: 0.5 } });
      const pos = L(-24, 1.6, 2.5), lk = L(-40, 16, -1.5);
      setCam(ctx, { pos, look: lk, fov: 68 }, 0);
      ctx.fx.vignette(0.35);
    },
  },
  // ── "The deep went dark."
  {
    name: 'the deep went dark', start: 'dark-0.12', set: 'town',
    setup(ctx) { town(ctx, 'night'); const L = ctx.store.L; put(ctx, 'me', L(TX + 0.3, DY, TZ + 0.4), L.yaw + 0.3); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, k = ease.inOutSine(clamp(lt / 0.8, 0, 1));
      tick(ctx, { sea: { glow: lerp(0.8, 0.3, k), caus: lerp(0.6, 0, k), flare: 0.5 * (1 - k), flarePos: L(TX + 8, SEA_Y, TZ), flareR: 5 }, shafts: lerp(0.5, 0, k), bubbles: lerp(0.6, 0.1, k), lamps: lerp(1, 0.5, k) });
      ctx.set.set('windowGlow', lerp(0.85, 0.12, k));
      me.pose('idle', t, { intensity: 0.3, headPitch: -0.5 }); me.face('neutral', 0.5);
      const kf = humanFace(me);
      setCam(ctx, { pos: L(TX + 3.0, DY + 1.0, TZ + 3.4), look: kf.clone().add(V(0, 1.5, 0)), fov: 58 }, 0);
      fill(ctx, kf.clone().add(V(0.6, 0.5, 1.2)), 0.5, '#8fb8ff');
    },
  },
  // ── b17 HUSS ×3 — cheering on the tower; the town spills out; wide
  ...[0, 1, 2].map((i) => ({
    name: `huss cheer #${i + 1}`, start: H('b17', i), set: 'town',
    setup(ctx) {
      town(ctx, 'night'); const L = ctx.store.L, P = ctx.props;
      put(ctx, 'me', L(TX + 0.3, DY, TZ + 0.4), L.yaw + 0.6);
      const b = put(ctx, 'barnaby', L(-41.5, 0.12, 4.2), L.yaw - PI / 2 - 0.4); pirate(ctx); ctx.add(P.rod);
      put(ctx, 'pemberton', L(-42.5, 0.12, 1.6), L.yaw - PI / 2 - 0.2); ctx.add(P.pan);
      const spots = []; for (let k = 0; k < 9; k++) spots.push({ p: L(-38.5 + (k % 3) * 1.6, 0.12, -2.6 + Math.floor(k / 3) * 2.2 + (k % 2) * 0.4), yaw: L.yaw - PI / 2 + (hash(k) - 0.5) * 0.6 });
      ctx.store.c = crowdAt(ctx, EXTRA_IDS.slice(0, 9), spots);
    },
    update(ctx) {
      const { L, c } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me, hits = hussHits(ctx, 'b17'); tick(ctx);
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      me.pose('cheer', t); me.face(dh < 0.2 ? 'huss' : 'grin', t);
      animC(c, t, (m) => (m.k % 2 ? 'clap' : 'cheer'), 'grin');
      const b = ctx.cast.barnaby; b.pose('wave', t); b.face('grin', t); b.joints.armR.rotation.set(-2.8, 0, -0.3 - 0.3 * Math.sin(t * 8));
      holdAlong(P.rod, b, V(0.3, 1, 0).normalize()); P.rod.userData.set(1);
      const pb = ctx.cast.pemberton; pb.pose('idle', t); pb.face('grin', t); armUp(pb, 1, 'R', 0.2); panOver(ctx, pb);
      const f = humanFace(me);
      const cams = [
        { pos: f.clone().add(V(-0.5, -1.1, 2.0)), look: f.clone().add(up(-0.2)), fov: 52 },
        { pos: L(-47, 1.4, 0.5), look: L(-41, 1.5, 2.5), fov: 60 },
        { pos: L(-37.5, 2.6, 8.5), look: L(-47.5, 10.5, 0.5), fov: 70 },
      ];
      setCam(ctx, cams[i], 0.8); ctx.cam.punch(hits, t, 0.1, 0.2);
      if (i === 2) { ctx.add(P.key2); P.key2.position.copy(f).add(V(2.5, 1.5, 2.5)); P.key2.intensity = 40; P.key2.distance = 14; }
    },
  })),
  // ── b18 "Way past the deep, I saw lights."
  {
    name: 'lights past the deep', start: 'b18-0.1', set: 'town',
    setup(ctx) { deepTown(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me; deepTick(ctx);
      me.pose('idle', t, { intensity: 0.3, headPitch: -0.4 }); me.face('shocked', t);
      const f = humanFace(me);
      // over his shoulder, ~40° off vertical, up at the inverted houses beyond the water layers
      const pos = f.clone().add(V(1.0, -0.15, 0.9));
      moveCam(ctx, { pos, look: pos.clone().add(V(-7.0, 9.0, -0.6)), fov: 66 }, { pos: pos.clone().add(up(0.1)), look: pos.clone().add(V(-7.4, 9.0, -0.8)), fov: 62 }, lt / 2, 0);
      fill(ctx, f.clone().add(V(0.5, -0.8, -1.0)), 0.25, '#9fd0ff');
    },
  },
  // ── "Another town. Upside down."
  {
    name: 'another town upside down', start: 'town-0.1', set: 'town',
    setup(ctx) { deepTown(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t; deepTick(ctx);
      const k = ease.inOutSine(clamp(lt / 2.2, 0, 1));
      const pos = L(TX + 3.2, DY - 1.2, TZ + 5.5);
      setCam(ctx, { pos, look: L(-100, lerp(58, 62, k), -1.5).lerp(pos, 0.0), fov: 62 }, 0);
      tag(ctx, 'UPSIDE DOWN', ctx.markers.town + 0.6, Infinity, { y: 0.15, rot: PI - 0.03, bg: 'rgba(13,79,134,0.9)' });
    },
  },
  // ── "A kid at a window, holding my flashlight."
  {
    name: 'kid with my flashlight', start: 'kid-0.1', set: 'town',
    setup(ctx) { deepTown(ctx, { people: true }); },
    update(ctx, lt) {
      const t = ctx.t; deepTick(ctx, { people: true });
      const b = ctx.store.bay;
      moveCam(ctx, { pos: b.clone().add(V(0, -9, -24)), look: b.clone().add(V(0, -1.4, 0)), fov: 44 }, { pos: b.clone().add(V(0, -1.6, -5.0)), look: b.clone().add(V(0, -1.3, 0)), fov: 40 }, ease.inOutSine(clamp(lt / 2.2, 0, 1)), 1.0);
    },
  },
  // ── b19 "And I heard his mum shout:"  — close on the upside-down window: she wags her finger
  {
    name: 'his mum shouts', start: 'b19-0.1', set: 'town',
    setup(ctx) { deepTown(ctx, { people: true }); },
    update(ctx, lt) {
      const t = ctx.t; deepTick(ctx, { people: true, wag: true });
      const b = ctx.store.bay;
      moveCam(ctx, { pos: b.clone().add(V(-0.3, -1.25, -4.4)), look: b.clone().add(V(0, -1.05, 0)), fov: 40 }, { pos: b.clone().add(V(-0.25, -1.2, -3.9)), look: b.clone().add(V(0, -1.05, 0)), fov: 40 }, lt / 1.3, 1.0);
    },
  },
  // ── "Never shine a light into the deep. Something lives down there."  — she points down at us; we fall back down to our town
  {
    name: 'something lives down there', start: 'b19.w6-0.12', set: 'town',
    setup(ctx) { deepTown(ctx, { people: true }); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t; deepTick(ctx, { people: true, point: true });
      const b = ctx.store.bay, ts = ctx.time('b19.w13') - 0.1;
      const k = ease.inOutCubic(clamp((t - ts) / 0.75, 0, 1));
      const c0 = { pos: b.clone().add(V(0.8, -1.3, -5.5)), look: b.clone().add(V(0, -0.4, 0)), fov: 42 };
      const kidF = L(TX + 0.3, DY + 1.7, TZ + 0.4);
      const c1 = { pos: kidF.clone().add(V(0.6, 5.5, 3.0)), look: kidF, fov: 50 };
      const c = camLerp(c0, c1, k); setCam(ctx, c, 1.0);
      quoteCard(ctx, 'Never shine a light into the deep.', 'his mum', ctx.time('b19.w6') - 0.05, ts - 0.05, { y: 0.24, byAt: ctx.time('b19.w12') });
    },
  },
  // ── b20 "Us."  — slow push on our kid on the tower, stunned, the far window's light glinting on his face
  {
    name: 'us', start: 'b19.w15-0.05', set: 'town',
    setup(ctx) { deepTown(ctx, { people: true }); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props; deepTick(ctx, { people: true, point: true });
      me.pose('stunned', t, { intensity: 0.4, headPitch: -0.55 }); me.face('shocked', 0.5);
      const f = humanFace(me);
      const gl = Math.max(0, Math.sin((t - ctx.time('b20')) * 3.2));
      ctx.add(P.key2); P.key2.position.copy(f).add(V(0.6, 2.2, 1.2)); P.key2.intensity = 6 + 18 * gl;
      const c0 = { pos: f.clone().add(V(0.5, -1.0, 3.2)), look: f.clone().add(up(-0.2)), fov: 46 }, c1 = { pos: f.clone().add(V(0.3, -0.6, 1.9)), look: f.clone().add(up(-0.3)), fov: 40 };
      moveCam(ctx, c0, c1, ease.inOutSine(clamp(lt / 1.9, 0, 1)), 0.9);
      const tu = ctx.time('b20'), endT = ctx.timeline.duration;
      const a = clamp(1 - (t - (endT - 0.3)) / 0.1, 0, 1);
      if (t > tu && a > 0) ctx.fx.text('US.', { x: 0.5, y: 0.2, size: 190, fill: '#ffe14a', stroke: '#000000', line: 14, rot: -0.06, scale: t - tu < 0.12 ? lerp(2, 1, (t - tu) / 0.12) : 1, alpha: a });
      if (t > tu && t - tu < 0.15) ctx.cam.shake(0.3, t, 5);
      const fade = clamp((t - (endT - 0.2)) / 0.18, 0, 1); if (fade > 0) { ctx.fx.overlay('#000000', fade); ctx.caption.hide(true); }
    },
  },
];

// ─── helpers used by several shots (hoisted)
/** the rules board on the stage, in front of the table + throne, with a wooden apron under the panel */
function boardOn(ctx, S) { const P = ctx.props; addW(ctx, P.board, S(0, 0, 1.9), S.yaw); addW(ctx, P.apron, S(0, 0.62, 1.86), S.yaw); }
function boardLine(S, i) { return S(0, 1.2 + 3.3 - [1.12, 1.82, 2.55][i], 1.95); }
function bonks(ctx, pc, times, camPos) {
  const P = ctx.props, t = ctx.t;
  P.bonks.forEach((b, k) => {
    const tk = times[k % times.length] ?? 1e9, d = t - tk;
    if (k >= times.length || d < -0.6 || d > 1.0) { b.visible = false; return; }
    b.visible = true;
    if (d < 0) { b.position.copy(pc).add(V(0.05 * k, -d * 5.5, 0.03 * k)); b.rotation.set(t * 8, k, t * 6); }
    else { const vx = (k % 2 ? 1 : -1) * 1.6, vz = 0.8 * (k % 3 - 1); b.position.copy(pc).add(V(vx * d, 2.6 * d - 4.9 * d * d, vz * d)); b.rotation.set(t * 14, k, t * 9); }
  });
  P.dings.forEach((dg, j) => { const tk = lastBefore(times, t); const d = tk != null ? t - tk : 9; if (j === 0) { dg.position.copy(pc).add(V(0.35, 0.45, 0)); dg.lookAt(camPos); dg.userData.set(d < 0.45 ? d / 0.45 : 0); dg.scale.multiplyScalar(0.32); } else dg.visible = false; });
  const tk = lastBefore(times, t);
  if (tk != null && t - tk < 0.15) { P.pan.rotation.z += 0.15 * Math.sin((t - tk) * 60) * (1 - (t - tk) / 0.15); }
}
/** Pemberton's swing: pan raised behind, slamming forward at tb */
function pemBonkPose(pb, t, tb) {
  pb.pose('idle', t, { intensity: 0.4 });
  const d = t - tb, J = pb.joints;
  const raise = clamp((t - (tb - 0.55)) / 0.35, 0, 1), hit = clamp((d + 0.12) / 0.12, 0, 1);
  const x = d < -0.12 ? lerp(-0.4, -3.0, ease.outCubic(raise)) : lerp(-3.0, -1.35, ease.inCubic(hit));
  J.armR.rotation.set(x, 0, -0.15); J.foreArmR.rotation.set(-0.25, 0, 0);
  J.torso.rotation.x += d < -0.12 ? -0.1 * raise : 0.18 * hit;
}
function trailOn(ctx, L, d) {
  const P = ctx.props, n = P.trail.length;
  P.trail.forEach((s, k) => { const dd = d - (k + 1) * 0.05; s.visible = dd > 0; s.position.copy(throwPos(L, dd)); s.material.opacity = 0.85 * (1 - k / n); s.scale.setScalar(3.6 * (1 - 0.6 * k / n)); });
  P.star.visible = d > 0; P.star.position.copy(throwPos(L, Math.max(0, d))); P.star.material.opacity = 0.95; P.star.scale.setScalar(5);
}
function throwPos(L, d) {
  if (d <= 0) return L(TX + 0.4, DY + 2.0, TZ + 0.5);
  const y = DY + 2.0 + 5 * d + 0.6 * d * d, r = 0.6 + 1.2 * d, a = d * 6;
  return L(TX + 0.4 + Math.cos(a) * r + 1.6 * d, y, TZ + 0.5 + Math.sin(a) * r - 0.8 * d);
}
function quoteCard(ctx, quote, by, t0, t1, { y = 0.3, size = 84, byAt = null } = {}) {
  const t = ctx.t; if (t < t0 || t > t1) return false;
  const d = t - t0, out = t1 - t, a = clamp(Math.min(d / 0.12, out / 0.12), 0, 1);
  ctx.fx.overlay('#001020', 0.5 * a); ctx.fx.vignette(0.5 * a);
  const pop = d < 0.2 ? ease.outBack(clamp(d / 0.2, 0, 1)) : 1;
  const lines = 'Never shine a light\ninto the deep.', nl = 2;
  ctx.fx.text(`“${lines}”`, { y, size, font: 'narr', fill: '#ffffff', stroke: '#000000', line: 12, scale: 0.6 + 0.4 * pop, alpha: a, rot: -0.02 });
  if (by) ctx.fx.text(`— ${by}`, { y: y + (nl * 0.5 + 0.7) * size * 1.05 / 1920, size: size * 0.62, font: 'narr', fill: '#ffe14a', stroke: '#000000', line: 8, alpha: clamp((byAt != null ? t - byAt : d - 0.25) / 0.12, 0, 1) * a, rot: -0.02 });
  ctx.caption.hide(true);
  return true;
}
/** the far side: clear water, deep layers, the inverted town; our kid on the tower */
function deepTown(ctx, { people = false } = {}) {
  const L = town(ctx, 'night', { shafts: false });
  const P = ctx.props, s = ctx.set;
  s.fog.near = 120; s.fog.far = 700;
  const hemi = s.root.getObjectByName('hemi'); if (hemi) { hemi.groundColor.set('#6a9ad8'); hemi.intensity = 1.7; }
  addW(ctx, P.layers, L(-20, 0, 0)); addW(ctx, P.motes, L(-40, 60, 0));
  const U = P.uptown; ctx.add(U); U.position.copy(L(UPTOWN.x, UPTOWN.y, UPTOWN.z)); U.rotation.set(PI, 0, 0); U.updateMatrixWorld(true);
  put(ctx, 'me', L(TX + 0.3, DY, TZ + 0.4), L.yaw + 0.3);
  const hero = U.userData.hero;
  ctx.store.bay = U.localToWorld(hero.bayLocal.clone());
  if (people) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(PI, 0, 0));
    const place = (id, lx, lz, yaw) => { const p = U.localToWorld(hero.pos.clone().add(V(lx, 0, lz))); ctx.place(id, p); const r = ctx.cast[id].root; r.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw)); return ctx.cast[id]; };
    place('mumB', -0.45, -0.05, hero.yaw + 0.35); place('kidB', 0.5, 0.2, hero.yaw - 0.3);
    ctx.add(P.torchB);
    ctx.add(P.key2); P.key2.position.copy(ctx.store.bay).add(V(0, -1.5, -2.5)); P.key2.intensity = 30;
  }
}
function deepTick(ctx, { people = false, wag = false, point = false } = {}) {
  const t = ctx.t, P = ctx.props;
  tick(ctx, { sea: { opacity: 0.32, glow: 1.0, deep: '#0d3a78', shallow: '#2a8ad0', light: '#9ff4ff' }, shafts: 0, bubbles: 0.4 });
  P.layers.userData.set(1.3, '#3a9ae8'); P.motes.userData.set(t, 1); P.uptown.userData.set(t, 1.25);
  if (people) {
    const mum = ctx.cast.mumB, kid = ctx.cast.kidB;
    mum.pose('idle', t, { intensity: 0.4 }); mum.face(wag || point ? 'determined' : 'neutral', t);
    if (wag) { const w = Math.sin(t * 5.5); mum.joints.armR.rotation.set(-2.5, 0.0, -0.25 + 0.6 * w); mum.joints.foreArmR.rotation.set(-0.7 - 0.35 * w, 0, 0); mum.joints.armL.rotation.set(-0.3, 0, 0.7); mum.joints.foreArmL.rotation.set(-1.7, 0, 0); }
    if (point) { mum.joints.armR.rotation.set(-3.0, 0, -0.15); mum.joints.foreArmR.rotation.set(0, 0, 0); mum.joints.armL.rotation.set(-0.6, 0, 0.6); mum.joints.foreArmL.rotation.set(-1.6, 0, 0); }
    kid.pose('idle', t, { intensity: 0.4 }); kid.face(wag || point ? 'sad' : 'smile', t);
    kid.joints.armR.rotation.set(-1.3, 0, 0.1); kid.joints.foreArmR.rotation.set(-0.4, 0, 0);
    kid.root.updateMatrixWorld(true);
    const down = V(0, -1, 0);
    holdAlong(P.torchB, kid, V(1, 0.25, 0.35).normalize()); P.torchB.userData.set(0.55, 0.9, 0.3);
  }
}
