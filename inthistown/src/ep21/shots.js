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
  makeKidWindow, makeUpsideTown, makeLampGlows, makeStars, makeLeafBurst, makeDingStar, glowSprite,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;
const TX = TOWER.x, TZ = TOWER.z, DY = TOWER.deck;
const LAMPS = [[-33, -5.15], [-21, -5.15], [-9, -5.15], [3, -5.15], [15, -5.15], [27, -5.15], [-27, 5.15], [-15, 5.15], [-3, 5.15], [9, 5.15], [21, 5.15]];
const UPTOWN = { x: -40, y: 118, z: 1.5 };          // the inverted town's ground (world), flipped upside down

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
  P.layers = makeDeepLayers([32, 46, 62, 80, 100]); P.motes = makeMotes(90, { w: 60, h: 40, d: 60 });
  P.school = makeSchool(40, { len: 60, spread: [10, 3, 8] }); P.school2 = makeSchool(26, { len: 40, spread: [6, 2, 5], cols: ['#ffd23f', '#ff8a2a', '#3ee0c8'] });
  P.fish = makeFish({ body: '#ff8a2a', fin: '#ffd23f', belly: '#ffe0b0' });
  P.fish2 = makeFish({ body: '#3ee0c8', fin: '#ff5a7a', belly: '#d8fff6', stripe: '#1d6f8a' });
  P.whale = makeFish({ body: '#2f5f9a', fin: '#5aa8e0', belly: '#9fe8ff', stripe: '#244a7a', glow: true });
  P.whaleLight = new THREE.PointLight('#7fd8ff', 0, 30, 1.2);
  P.sardines = makeSardines(320, { w: 22, d: 16, top: 15, bottom: 0 });
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
function armFwd(ch, k = 1, s = 'R', pitch = -1.45, yaw = 0) { const J = ch.joints; J['arm' + s].rotation.set(lerp(J['arm' + s].rotation.x, pitch, k), 0, yaw * k); J['foreArm' + s].rotation.set(-0.15 * k, 0, 0); }

// ─── moods: sky colour (= fog), lighting preset, sea look
const MOODS = {
  day: { preset: 'day', bg: '#8ad6ee', fog: [70, 330], hemi: ['#c8f2ff', '#86996a', 1.5], exposure: 1.0, windows: 0, shafts: 1, bubbles: 0.8, lamps: 0,
    sea: { deep: '#1a78c8', shallow: '#62dcf2', light: '#f0ffff', glow: 1.0, opacity: 0.97 } },
  dusk: { preset: 'dusk', bg: '#ee9a8a', fog: [60, 300], hemi: ['#ffc0d0', '#5d3c5c', 1.35], exposure: 1.05, windows: 0.7, shafts: 0.9, bubbles: 0.7, lamps: 0.7,
    sea: { deep: '#3a3aa0', shallow: '#4f9ae6', light: '#ffe0b0', glow: 1.0, opacity: 0.97 } },
  night: { preset: 'quiet_night', bg: '#0b2242', fog: [35, 210], hemi: ['#3a74b8', '#121a28', 1.15], exposure: 1.12, windows: 0.85, shafts: 0.55, bubbles: 0.6, lamps: 1,
    sea: { deep: '#0a2a60', shallow: '#1c7cc0', light: '#8ff0ff', glow: 0.95, opacity: 0.97 } },
  flare: { preset: 'quiet_night', bg: '#123a66', fog: [40, 230], hemi: ['#5aa8e8', '#18243a', 1.5], exposure: 1.1, windows: 0.9, shafts: 0.9, bubbles: 0.7, lamps: 1,
    sea: { deep: '#1a4f9a', shallow: '#4fc8f0', light: '#d8ffff', glow: 1.7, opacity: 0.78 } },
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
function tentOn(ctx, base, tip, t, o = {}) { const T0 = ctx.props.tent; ctx.add(T0); T0.position.set(0, 0, 0); T0.userData.setPath(tentPts(base, tip, t, o), o.r0 ?? 1.5, o.r1 ?? 0.14, t, o); return T0; }
/** crowd of real extras placed in world positions list [{p, yaw}] */
function crowdAt(ctx, ids, spots) { return ids.map((id, i) => ({ ch: put(ctx, id, spots[i].p, spots[i].yaw), k: i, ph: hash(i * 1.9 + 3) * 3 })); }
function animC(list, t, act = 'idle', face = 'smile', params = {}) { for (const c of list) { const a = typeof act === 'function' ? act(c) : act, f = typeof face === 'function' ? face(c) : face; c.ch.pose(a, t + c.ph, params); c.ch.face(f, t + c.ph); } }
/** flinch: arms over the head */
function flinch(ch, t, k = 1) { const J = ch.joints; for (const s of ['L', 'R']) { J['arm' + s].rotation.set(-2.6 * k, 0, (s === 'L' ? -0.5 : 0.5) * k); J['foreArm' + s].rotation.set(-1.7 * k, 0, 0); } J.torso.rotation.x += 0.15 * k; J.head.rotation.x += 0.2 * k; }
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
function panOver(ctx, ch) { const P = ctx.props, top = headTop(ch); ctx.add(P.pan); const h = handW(ch); P.pan.position.copy(h); P.pan.up.set(0, 1, 0); P.pan.lookAt(V(top.x, h.y, top.z)); return P.pan.localToWorld(P.pan.userData.faceCenter.clone()); }
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
      addW(ctx, ctx.props.school, L(-26, 15.5, 0), L.yaw);
      ctx.store.w = walkers(ctx, L, EXTRA_IDS.slice(0, 6), { x0: -32, x1: -8, seed: 2 });
    },
    update(ctx, lt) {
      const { L, w } = ctx.store, t = ctx.t; tick(ctx);
      ctx.props.school.userData.set(t, { speed: 2.4 }); animWalkers(w, L, t, 20);
      const k = ease.inOutCubic(clamp((t - 1.0) / 3.4, 0, 1));
      const pos = L(-4, lerp(0.8, 1.4, k), lerp(2.4, 2.0, k));
      const look = L(-30, 2.6, -0.8).lerp(L(-27, 28, -0.5), k);
      setCam(ctx, { pos, look, fov: lerp(48, 62, k) });
    },
  },
  // ── b02 HUSS ×3 — the kid in the middle of Main Street, a whale glides over, belly glow washes him blue
  ...[0, 1, 2].map((i) => ({
    name: `huss whale #${i + 1}`, start: H('b02', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { shafts: true });
      put(ctx, 'me', L(-16, 0, 0), L.yaw + PI / 2);
      const P = ctx.props; addW(ctx, P.whale, V(), 0); P.whale.scale.setScalar(11); ctx.add(P.whaleLight);
      addW(ctx, P.school, L(-16, 14, 6), L.yaw + PI / 2);
    },
    update(ctx) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, hits = hussHits(ctx, 'b02'); tick(ctx);
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      me.pose('idle', t, { intensity: 0.3, headPitch: -0.55 }); me.face(dh < 0.25 ? 'huss' : 'shocked', t);
      const wx = lerp(2, -36, (t - 4.6) / 2.2);
      P.whale.position.copy(L(wx, 14.5, 0.5)); P.whale.rotation.set(0.04, L.yaw - PI / 2, 0); P.whale.userData.set(t, { wag: 0.6, speed: 0.5 });
      P.whaleLight.position.copy(L(wx + 1, 10, 0.5)); P.whaleLight.intensity = 260 * clamp(1 - Math.abs(wx + 16) / 22, 0, 1);
      P.school.userData.set(t, { speed: 3 });
      const f = humanFace(me);
      const cams = [
        { pos: L(-13.6, 0.35, 1.2), look: L(-16.6, 5.2, 0), fov: 58 },
        faceCam(me, 2.3, { side: 0.4, h: -0.3, fov: 34, below: 0.36 }),
        { pos: L(-27, 1.1, 6.2), look: L(-17, 7.5, 0), fov: 60 },
      ];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.1, 0.2);
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
      const me = put(ctx, 'me', ctx.point('room.bed').add(V(0.15, -0.55, 0.55)), PI / 2 - 0.5);
      ctx.store.w = w;
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, w = ctx.store.w, me = ctx.cast.me;
      me.pose('sit', t, { hands: 'lap', seatHeight: 0.52, headYaw: 0.35, headPitch: -0.12 }); me.face(t > ctx.time('b03.w5') ? 'grin' : 'smile', t);
      if (t > ctx.time('b03.w4')) { me.joints.armR.rotation.set(-2.2, 0, -0.3); me.joints.foreArmR.rotation.set(-0.4, 0, 0.6 * Math.sin(t * 10)); }
      const k = ease.outCubic(clamp(lt / 1.3, 0, 1));
      P.fish.position.copy(w).add(V(lerp(-1.2, 0.05, k), lerp(-0.2, 0.05, k) + 0.05 * Math.sin(t * 2), -0.55));
      P.fish.rotation.set(0, lerp(PI / 2, 0, k), 0); P.fish.userData.set(t, { wag: lerp(1, 0.4, k), mouth: k > 0.9 ? 1 : 0, look: 1 });
      P.school2.userData.set(t, { speed: 1.8 });
      moveCam(ctx, { pos: V(0.9, 1.5, 3.0), look: V(-0.95, 1.25, -1.6), fov: 46 }, { pos: V(0.75, 1.45, 2.5), look: V(-0.95, 1.3, -1.7), fov: 44 }, lt / 2);
    },
  },
  // ── "Every Friday, it rains sardines."  — the square by day, silver sardines patter down, people flinch
  {
    name: 'sardine rain', start: 'b03.w6-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { shaftX: 44 });
      const Q = frameAt(ctx, 'square.center');
      const P = ctx.props; addW(ctx, P.sardines, Q(0, 0, 3), Q.yaw);
      const spots = [[-2.2, 1.5], [0.2, 0.6], [2.4, 1.8], [-1.0, 3.6], [1.5, 4.0], [-3.2, 4.2], [3.4, 3.8], [0.0, 2.6]].map(([x, z], i) => ({ p: Q(x, 0, z), yaw: Q.yaw + PI + (hash(i * 2.2) - 0.5) * 1.2 }));
      ctx.store.c = crowdAt(ctx, EXTRA_IDS.slice(6, 14), spots); ctx.store.Q = Q;
      addW(ctx, P.school, Q(0, 14, 0), Q.yaw + PI / 2);
    },
    update(ctx, lt) {
      const { Q, c } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx);
      P.sardines.userData.set(t, { k: clamp(lt / 0.3, 0, 1), fall: 10 }); P.school.userData.set(t, { speed: 2 });
      animC(c, t, 'idle', 'shocked'); c.forEach((m, i) => flinch(m.ch, t, clamp((lt - 0.1 - 0.12 * (i % 4)) / 0.2, 0, 1)));
      moveCam(ctx, { pos: Q(0.3, 1.5, 11.5), look: Q(0, 2.2, 2.4), fov: 50 }, { pos: Q(0.3, 1.4, 10.0), look: Q(0, 2.1, 2.4), fov: 48 }, lt / 2.2);
      tag(ctx, 'EVERY FRIDAY', ctx.time('b03.w6'), Infinity, { y: 0.15, bg: 'rgba(30,120,200,0.9)' });
    },
  },
  // ── b04 "Mrs. Pemberton doesn't own an umbrella."  — strolling down Main Street, pan over her head, sardines bonk off it
  {
    name: 'pemberton strolls', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'pemberton', L(-6, 0.12, -6.2), L.yaw - PI / 2);
      const P = ctx.props; addW(ctx, P.sardines, L(-12, 0, -4), L.yaw);
      P.bonks.forEach((b) => ctx.add(b)); P.dings.forEach((d) => ctx.add(d));
      ctx.store.w = walkers(ctx, L, EXTRA_IDS.slice(0, 4), { x0: -26, x1: -4, seed: 5 });
      addW(ctx, P.school, L(-12, 15, -2), L.yaw + 0.4);
    },
    update(ctx, lt) {
      const { L, w } = ctx.store, t = ctx.t, P = ctx.props, pb = ctx.cast.pemberton; tick(ctx);
      P.sardines.userData.set(t, { k: 0.6, fall: 9 }); animWalkers(w, L, t, 18); P.school.userData.set(t, { speed: 2.2 });
      const x = -6 - 0.9 * (lt);
      pb.root.position.copy(L(x, 0.12, -6.2)); pb.pose('walk', t, { speed: 1.0 }); pb.face('smug', t);
      armUp(pb, 1, 'R', 0.35);
      const pc = panOver(ctx, pb);
      bonks(ctx, pc, [ctx.time('b04.w2'), ctx.time('b04.w4'), ctx.time('b04.w5') + 0.15, ctx.time('b04.w6')]);
      const f = humanFace(pb);
      setCam(ctx, { pos: L(x - 4.6, 1.25, -3.6), look: f.clone().add(V(0.5, 0.1, 0)), fov: 42 });
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
      pb.pose('idle', t, { intensity: 0.5 }); pb.face('smug', t); armUp(pb, 1, 'R', 0.35);
      const pc = panOver(ctx, pb);
      bonks(ctx, pc, [ctx.time('b04.w7') + 0.05, ctx.time('b04.w9'), ctx.time('b04.w10') + 0.08, ctx.time('b04.w10') + 0.4]);
      const f = humanFace(pb);
      moveCam(ctx, { pos: L(-14.2, 0.55, -3.9), look: f.clone().add(up(0.15)), fov: 42 }, { pos: L(-13.7, 0.6, -4.5), look: f.clone().add(up(0.2)), fov: 40 }, lt / 1.4);
      shakeOn(ctx, [ctx.time('b04.w7') + 0.05, ctx.time('b04.w9')], 0.15, 0.15);
    },
  },
  // ── b05 "There are three rules."  — the town square stage: the mayor points at the blank board
  {
    name: 'three rules wide', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { shaftX: 44, stands: true });
      const S = frameAt(ctx, 'square.stage'), P = ctx.props;
      addW(ctx, P.board, S(0, 0, -2.4), S.yaw);
      put(ctx, 'mayor21', S(-1.6, 0, 2.3), S.yaw + 0.5);
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
      addW(ctx, P.board, S(0, 0, -2.4), S.yaw);
      put(ctx, 'mayor21', S(-1.6, 0, 2.3), S.yaw + 0.5);
      ctx.store.S = S;
    },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, P = ctx.props, m = ctx.cast.mayor21, mk = ctx.markers; tick(ctx);
      P.board.userData.set(clamp((t - mk.r1) / 0.14, 0, 1), clamp((t - mk.r2) / 0.14, 0, 1), 0);
      m.pose('point', t, { intensity: 0.6, headYaw: -0.5 }); m.face('determined', t);
      moveCam(ctx, { pos: S(0, 2.0, 6.4), look: S(0, 2.4, -2.4), fov: 44 }, { pos: S(0, 2.05, 5.8), look: S(0, 2.45, -2.4), fov: 44 }, lt / 3);
      shakeOn(ctx, [mk.r1, mk.r2], 0.25, 0.2);
    },
  },
  // ── "And never, ever shine a light into the deep."  — low hero angle on the stern mayor, rule 3 stamps in red
  {
    name: 'rule three', start: 'r3-0.18', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { shaftX: 44, stands: true });
      const S = frameAt(ctx, 'square.stage'), P = ctx.props;
      addW(ctx, P.board, S(0, 0, -2.4), S.yaw);
      put(ctx, 'mayor21', S(-1.4, 0, 2.2), S.yaw + 0.35);
      const spots = []; for (let i = 0; i < 6; i++) spots.push({ p: S((i % 3 - 1) * 1.7 + 0.8, -0.8, 5.2 + Math.floor(i / 3) * 1.3), yaw: S.yaw + PI + (hash(i * 3) - 0.5) * 0.4 });
      ctx.store.c = crowdAt(ctx, EXTRA_IDS.slice(4, 10), spots); ctx.store.S = S;
    },
    update(ctx, lt) {
      const { S, c } = ctx.store, t = ctx.t, P = ctx.props, m = ctx.cast.mayor21, mk = ctx.markers; tick(ctx);
      P.board.userData.set(1, 1, clamp((t - mk.r3) / 0.14, 0, 1));
      m.pose('point', t, { intensity: 0.8, headYaw: -0.25 }); m.face('determined', t);
      m.joints.armR.rotation.x -= 0.5;
      animC(c, t, 'idle', 'neutral', { intensity: 0.4 }); c.forEach((x, i) => { x.ch.joints.head.rotation.x += 0.18 * Math.max(0, Math.sin((t + i * 0.3) * 6)); });
      const f = humanFace(m);
      moveCam(ctx, { pos: S(1.2, 0.5, 5.8), look: S(-0.6, 2.9, -0.8), fov: 52 }, { pos: S(1.0, 0.55, 5.2), look: S(-0.6, 3.0, -0.8), fov: 50 }, lt / 1.5);
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
      const { L } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx, { sea: { opacity: 0.72 } });
      const cx = lerp(-4, -34, (t - ctx.time('b06')) / 2.0);
      const tl = ctx.time('b06.w2');
      const open = t > tl && t < tl + 0.55 ? Math.sin(PI * (t - tl) / 0.55) : 0;
      deepAt(ctx, L(cx, SEA_Y + 22, -2), { yaw: PI / 2 + 0.3, s: 17, set: { lid: 1 - open, glow: 0.4 + 0.8 * open, coil: 1, reach: 0.1 } });
      P.deep.userData.set(t, { lid: 1 - open, glow: 0.4 + 0.8 * open, coil: 1, reach: 0.1 });
      P.shadow.position.copy(L(cx + 2, SEA_Y + 0.6, -2)); P.shadow.scale.set(26, 1, 18); P.shadow.material.opacity = 0.45;
      const k = ease.inOutSine(clamp(lt / 1.7, 0, 1));
      setCam(ctx, { pos: L(-12, lerp(1.2, 6.5, k), 3.5), look: L(-20, lerp(10, 26, k), -2), fov: 58 });
    },
  },
  // ── b07 "Captain Barnaby cast a fishing line straight up once."  — the park; he casts straight up into the sea
  {
    name: 'barnaby casts', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { shaftX: -50 });
      const b = put(ctx, 'barnaby', L(-52, 0, -12), L.yaw + 0.5); pirate(ctx);
      const P = ctx.props; ctx.add(P.rod); ctx.add(P.line);
      addW(ctx, P.school2, L(-52, 15, -12), L.yaw + 1.2);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, b = ctx.cast.barnaby, tc = ctx.time('b07.w2'); tick(ctx);
      P.school2.userData.set(t, { speed: 1.6 });
      b.pose('idle', t, { intensity: 0.4, headPitch: t > tc ? -0.5 : -0.1 }); b.face(t > tc ? 'grin' : 'determined', t);
      const w = clamp((t - tc + 0.35) / 0.35, 0, 1);
      b.joints.armR.rotation.set(lerp(-1.0, -3.0, ease.outBack(w)) + (w < 0.01 ? 0.6 * Math.sin(clamp((t - tc + 0.9) / 0.55, 0, 1) * PI) : 0), 0, -0.15);
      b.joints.foreArmR.rotation.set(-0.3, 0, 0);
      const dir = V(0.05, 1, 0.12).normalize().lerp(V(0, 0.4, 1).normalize(), 1 - w).normalize();
      holdAlong(P.rod, b, dir); P.rod.userData.set(0.05);
      const tip = P.rod.userData.tip.getWorldPosition(V());
      const len = clamp((t - tc) / 0.6, 0, 1) * (SEA_Y - tip.y + 0.5);
      if (len > 0.05) { P.line.visible = true; stretchLine(P.line, tip, tip.clone().add(V(0.15, len, 0.3))); } else P.line.visible = false;
      const f = humanFace(b);
      moveCam(ctx, { pos: f.clone().add(V(2.0, -0.2, 4.6)), look: f.clone().add(V(0, 1.4, 0)), fov: 52 }, { pos: f.clone().add(V(1.8, -0.4, 4.0)), look: f.clone().add(V(0, 2.4, 0)), fov: 56 }, lt / 2);
    },
  },
  // ── "…straight up once."  — low angle up the line into the water
  {
    name: 'line into the sea', start: 'b07.w6-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { shaftX: -50 });
      const L = ctx.store.L, b = put(ctx, 'barnaby', L(-52, 0, -12), L.yaw + 0.5); pirate(ctx);
      const P = ctx.props; ctx.add(P.rod); ctx.add(P.line);
      addW(ctx, P.school2, L(-52, 17, -12), L.yaw + 1.2);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, b = ctx.cast.barnaby; tick(ctx);
      P.school2.userData.set(t, { speed: 1.6 });
      b.pose('idle', t, { intensity: 0.3, headPitch: -0.6 }); b.face('smile', t);
      b.joints.armR.rotation.set(-3.0, 0, -0.15); b.joints.foreArmR.rotation.set(-0.3, 0, 0);
      holdAlong(P.rod, b, V(0.05, 1, 0.12).normalize()); P.rod.userData.set(0.05);
      const tip = P.rod.userData.tip.getWorldPosition(V()); P.line.visible = true; stretchLine(P.line, tip, tip.clone().add(V(0.15, SEA_Y - tip.y + 0.5, 0.3)));
      const h = handW(b);
      setCam(ctx, { pos: h.clone().add(V(1.2, -1.9, 1.6)), look: h.clone().add(V(0.1, 9, 0.2)), fov: 62 });
    },
  },
  // ── "Something bit."  — BITE! the line snaps taut, he's yanked off his feet
  {
    name: 'something bit', start: 'bit-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { shaftX: -50 });
      const L = ctx.store.L; put(ctx, 'barnaby', L(-52, 0, -12), L.yaw + 0.5); pirate(ctx);
      const P = ctx.props; ctx.add(P.rod); ctx.add(P.line);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, b = ctx.cast.barnaby, tb = ctx.markers.bit; tick(ctx);
      const k = clamp((t - tb - 0.05) / 0.2, 0, 1), yank = ease.outCubic(clamp((t - ctx.time('b07.w10')) / 0.3, 0, 1));
      b.root.position.copy(L(-52, 1.6 * yank, -12));
      b.pose(yank > 0 ? 'surprised' : 'idle', t, { intensity: 1, headPitch: -0.4 }); b.face(k > 0 ? 'shocked' : 'smile', t);
      b.joints.armR.rotation.set(-3.0, 0, -0.15); b.joints.armL.rotation.set(-2.9, 0, 0.2); b.joints.foreArmR.rotation.set(-0.2, 0, 0);
      holdAlong(P.rod, b, V(0.05, 1, 0.12).normalize()); P.rod.userData.set(0.45 * k + 0.1 * Math.sin(t * 30) * k);
      const tip = P.rod.userData.tip.getWorldPosition(V()); P.line.visible = true; stretchLine(P.line, tip, tip.clone().add(V(0.15 + 0.08 * Math.sin(t * 40) * k, SEA_Y - tip.y + 0.5, 0.3)));
      const f = humanFace(b);
      setCam(ctx, { pos: L(-52, 1.25 + 1.1 * yank, -12).add(V(1.5, 0, 3.0).applyAxisAngle(V(0, 1, 0), 0.5)), look: f.clone().add(up(-0.2)), fov: 40 });
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
      setCam(ctx, { pos: L(x - 2.0, 1.6, 6.0), look: L(x + 0.6, 2.6, 0.4), fov: 52 });
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
      const c0 = { pos: L(13.5, 1.6, -0.2), look: L(12, 1.3, -6.6), fov: 46 }, c1 = { pos: f.clone().add(V(0.6, -0.15, 2.5)), look: f.clone().add(V(0, -0.1, 0)), fov: 36 };
      moveCam(ctx, c0, c1, ease.inOutCubic(clamp((t - still) / 0.5, 0, 1)));
      shakeOn(ctx, [tl + 0.25], 0.5, 0.3);
    },
  },
  // ── b08 "Until last night."  — the bedroom at quiet night, dark except the blue glowing window
  {
    name: 'until last night', start: 'b08-0.1', set: 'room',
    setup(ctx) {
      const s = ctx.set, P = ctx.props; s.setLighting('night');
      const wv = s.root.getObjectByName('windowView'); if (wv) wv.visible = false;
      const w = ctx.point('room.window');
      addW(ctx, P.view, w.clone().add(V(0.2, 0.3, -1.6)), 0);
      addW(ctx, P.roofStrip, w.clone().add(V(0, -0.85, -0.65)), 0); P.roofStrip.rotation.x = 0.35;
      addW(ctx, P.fish2, w.clone().add(V(0.4, 0.1, -1.0)), PI / 2); P.fish2.scale.setScalar(0.7);
      ctx.add(P.roomFill); P.roomFill.position.copy(w).add(V(0, 0, 0.9)); P.roomFill.intensity = 10;
      put(ctx, 'me', w.clone().add(V(0.15, -1.62, 0.75)), PI - 0.35);
      ctx.store.w = w;
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, w = ctx.store.w, me = ctx.cast.me;
      me.pose('idle', t, { intensity: 0.3 }); me.face('smile', t); armFwd(me, 1, 'R', -1.3, 0.2);
      torchIn(ctx, me, w.clone().add(V(0.3, 0.1, -1.2)).sub(handW(me)).normalize(), { len: 1.6, width: 0.5 });
      P.fish2.position.copy(w).add(V(0.4 - 0.3 * Math.sin(t), 0.1, -1.0)); P.fish2.userData.set(t, { look: 1 });
      ctx.fx.vignette(0.6);
      setCam(ctx, { pos: V(1.2, 1.5, 2.6), look: V(-0.75, 1.35, -1.6), fov: 46 });
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
      const fishP = W(0.2 + 0.9 * Math.sin(t * 1.1), 4.3 + 0.25 * Math.sin(t * 1.7), 2.3);
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
      me.pose(d > 0 ? 'surprised' : 'idle', t, { intensity: 0.7 }); me.face(d > 0.05 ? 'shocked' : 'grin', t); me.joints.torso.rotation.x += 0.35;
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
      setCam(ctx, { pos: f.clone().addScaledVector(W.fwd, 2.3).addScaledVector(W.left, 0.7).add(up(-0.55)), look: f.clone().add(up(-0.45)), fov: 40 }, 0.9);
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
      tick(ctx, { sea: { flare: 0.8 + 1.4 * k, flarePos: W(0.15, SEA_Y, 2.2), flareR: 2.5 + 30 * k, glow: 0.95 + 1.0 * k, opacity: lerp(0.97, 0.8, k) }, shafts: 0.55 + 0.6 * k });
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
      tick(ctx, { sea: { flare: 1.6, flarePos: W(0.15, SEA_Y, 2.2), flareR: 30 } });
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
      const { L } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx, { sea: { flare: 1.0, flarePos: L(-30, SEA_Y, 3), flareR: 30 } });
      const D = deepAt(ctx, L(-27, SEA_Y - 0.4, 3.0), { yaw: PI, s: 15, set: { lid: 0, glow: 1.4, lookX: 0.15 * Math.sin(t * 2), lookY: 0, coil: 1 } });
      const e = D.userData.eyeWorld(), dir = V(0, -0.85, -0.53).normalize();
      moveCam(ctx, { pos: e.clone().addScaledVector(dir, 21), look: e, fov: 40 }, { pos: e.clone().addScaledVector(dir, 15), look: e, fov: 38 }, lt / 1.0);
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
      tick(ctx, { sea: { flare: 1.6, flarePos: W(0.15, SEA_Y, 2.2), flareR: 30 } });
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
      tick(ctx, { sea: { flare: 1.6, flarePos: W(0.15, SEA_Y, 2.2), flareR: 30 }, flicker: 1 });
      const g = W.roof(0.15, 2.2).add(up(0.2));
      P.torch.position.copy(g); P.torch.rotation.order = 'YXZ'; P.torch.rotation.set(-PI / 2, W.yaw, 0); P.torch.userData.set(1, SEA_Y - g.y - 0.3, 1.3);
      const reach = clamp((t - ctx.time('b11')) / 1.6, 0, 1);
      deepAt(ctx, L(-27, SEA_Y - 0.4, 3.0), { yaw: PI, s: 15, set: { lid: 0, glow: 1.3, coil: 1 - 0.6 * reach, reach, lookY: 0.4, sway: 2 } });
      me.pose('surprised', t, { intensity: 1, headPitch: -0.45 }); me.face(dh < 0.22 ? 'huss' : 'shocked', t); me.joints.torso.rotation.x += 0.25;
      const f = humanFace(me);
      const cams = [
        { pos: f.clone().addScaledVector(W.fwd, 2.4).addScaledVector(W.left, -0.5).add(up(-0.55)), look: f.clone().add(up(-0.4)), fov: 36 },
        { pos: L(-14, 1.2, -2.0), look: L(-26, 16, 3), fov: 68 },
        { pos: L(-21, 1.6, -4.4), look: L(-21, 4.4, -5.15), fov: 50 },
        { pos: f.clone().addScaledVector(W.fwd, 2.0).addScaledVector(W.left, 0.8).add(up(-0.6)), look: f.clone().add(up(-0.4)), fov: 34 },
        { pos: L(-27, 6, -4), look: L(-27, SEA_Y, 3), fov: 52 },
        { pos: L(-34, 2.2, -8.5), look: L(-27, 12, 8), fov: 66 },
      ];
      setCam(ctx, cams[i], 0.9); ctx.cam.punch(hits, t, 0.1, 0.2); shakeOn(ctx, hits, 0.35, 0.25);
    },
  })),
  // ── b12 "A tentacle came down through the water."
  {
    name: 'tentacle comes down', start: 'b12-0.1', set: 'town',
    setup(ctx) { town(ctx, 'flare'); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx, { sea: { flare: 1.2, flarePos: L(-24, SEA_Y, 2), flareR: 30 } });
      deepAt(ctx, L(-27, SEA_Y + 6, 3.0), { yaw: PI, s: 15, set: { lid: 0, glow: 1.0, coil: 0.5, reach: 0.6 } });
      const k = ease.inOutSine(clamp(lt / 1.5, 0, 1));
      const base = L(-6, SEA_Y + 1, 0), tip = L(-6, SEA_Y - 1, 0).lerp(L(-5, 6.0, -4.0), k);
      tentOn(ctx, base, tip, t, { wig: 0.4, r0: 1.4 });
      setCam(ctx, { pos: L(3, 1.3, 4.5), look: L(-6, lerp(14, 10, k), -1), fov: 64 }, 0.3);
    },
  },
  // ── "Slow. Curious."
  {
    name: 'slow curious', start: 'b12.w6-0.1', set: 'town',
    setup(ctx) { town(ctx, 'flare'); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t; tick(ctx, { sea: { flare: 1.2, flarePos: L(-24, SEA_Y, 2), flareR: 30 } });
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
      const { L, wins } = ctx.store, t = ctx.t, P = ctx.props; tick(ctx, { sea: { flare: 1.2, flarePos: L(-20, SEA_Y, 2), flareR: 30 } });
      const dur = ctx.time('b13') - 0.1 - ctx.time('b12.w8') + 0.1, u = clamp(lt / dur, 0, 1) * 3;
      const seg = Math.min(2, Math.floor(u)), f = u - seg;
      const at = (j) => wins[j].p.clone().addScaledVector(fwdOf(wins[j].yaw), 0.9).add(up(-0.1));
      const a = at(Math.max(0, seg - 1 + (f > 0.4 ? 1 : 0))), b = at(seg);
      const tip = seg === 0 ? L(-5, 6, -4).lerp(at(0), ease.inOutCubic(clamp(f / 0.5, 0, 1))) : at(seg - 1).lerp(at(seg), ease.inOutCubic(clamp(f / 0.5, 0, 1)));
      tip.y += 0.6 * Math.sin(PI * clamp(f / 0.5, 0, 1));
      const base = L(lerp(-6, -20, clamp(lt / dur, 0, 1)), SEA_Y + 1, 0);
      tentOn(ctx, base, tip, t, { wig: 0.4, r0: 1.4, approach: V(0, 0, -1) });
      P.curtains.forEach((c, j) => { const arrive = (j + 0.45) / 3 * dur; c.userData.set(clamp((lt - arrive) / 0.25, 0, 1), 1); });
      const cx = lerp(-4, -22, clamp(lt / dur, 0, 1));
      setCam(ctx, { pos: L(cx + 3, 2.2, 4.6), look: L(cx - 3, 4.2, -9), fov: 52 }, 0.4);
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
      tick(ctx, { sea: { flare: 1.2, flarePos: L(-20, SEA_Y, 2), flareR: 30 } });
      const step = ease.outCubic(clamp((t - ctx.time('b13') - 0.2) / 0.5, 0, 1));
      pb.root.position.copy(dp.clone().addScaledVector(fw, lerp(-0.2, 0.6, step)));
      pemBonkPose(pb, t, tb); pb.face(t < tb ? 'determined' : 'smug', t);
      const pc = panAlong(ctx, pb);
      const base = L(-14, SEA_Y + 1, 2), tip = tipAt.clone().add(V(0.05 * Math.sin(t * 1.3), 0.05 * Math.sin(t * 1.1), 0));
      tentOn(ctx, base, tip, t, { wig: 0.25, r0: 1.4, approach: fw.clone().negate() });
      const d = t - tb; P.dings[0].position.copy(pc).add(up(0.3)); P.dings[0].lookAt(ctx.camera.position); P.dings[0].userData.set(d > 0 ? d / 0.5 : 0);
      const f = humanFace(pb);
      if (i === 0) setCam(ctx, { pos: dp.clone().addScaledVector(fw, 4.6).addScaledVector(leftOf(yaw), 1.6).add(up(1.1)), look: dp.clone().addScaledVector(fw, 0.6).add(up(1.5)), fov: 44 }, 0.7);
      else setCam(ctx, { pos: f.clone().addScaledVector(fw, 2.3).addScaledVector(leftOf(yaw), -1.1).add(up(-0.3)), look: lookMix(f.clone().addScaledVector(fw, 2.3).addScaledVector(leftOf(yaw), -1.1).add(up(-0.3)), f.clone().add(up(-0.35)), tipAt, 0.45), fov: 44 }, 0.8);
      if (i === 1) { stamp(ctx, 'BONK!', tb, { y: 0.2, fill: '#ffffff', stroke: '#7b3fbf' }); shakeOn(ctx, [tb], 0.4, 0.25); flash(ctx, tb, 0.08, '#ffffff', 0.4); }
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
      tick(ctx, { sea: { flare: 1.2, flarePos: L(-20, SEA_Y, 2), flareR: 30 } });
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
      tick(ctx, { sea: { flare: 1.2, flarePos: L(-20, SEA_Y, 2), flareR: 30 } });
      pb.root.position.copy(dp.clone().addScaledVector(fw, -0.1));
      pb.pose('idle', t, { intensity: 0.3, lookAt: tipAt }); pb.face('sweat', t);
      pb.joints.armR.rotation.set(-2.7, 0, -0.2); pb.joints.foreArmR.rotation.set(-0.3, 0, 0);
      panAlong(ctx, pb);
      tentOn(ctx, L(-14, SEA_Y + 1, 2), tipAt.clone().add(V(0, 0.15 * Math.sin(t * 2), 0)), t, { wig: 0.2, r0: 1.4, approach: fw.clone().negate() });
      const mid = dp.clone().addScaledVector(fw, 0.6).add(up(1.4));
      moveCam(ctx, { pos: mid.clone().addScaledVector(fw, 6.5).addScaledVector(leftOf(yaw), -2.5).add(up(-0.6)), look: mid.clone().add(up(0.6)), fov: 46 }, { pos: mid.clone().addScaledVector(fw, 5.8).addScaledVector(leftOf(yaw), -2.2).add(up(-0.6)), look: mid.clone().add(up(0.6)), fov: 46 }, lt / 1.2, 0.6);
      tag(ctx, 'TOP 10 RESPECT', ctx.markers.respect, Infinity, { y: 0.13, size: 88, bg: 'rgba(200,0,40,0.9)' });
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
      tick(ctx, { sea: { flare: 1.2, flarePos: L(-27, SEA_Y, 2), flareR: 30 } });
      const sw = Math.sin((t - ctx.time('b14')) * 2.4);
      me.pose('think', t, { intensity: 0.6, headYaw: 0.25 * sw }); me.face(i === 0 ? 'squint' : 'determined', t);
      armFwd(me, 1, 'R', -1.9, 0.55 * sw);
      const h = handW(me), beamDir = W.fwd.clone().applyAxisAngle(V(0, 1, 0), -0.55 * sw).add(up(0.7)).normalize();
      torchIn(ctx, me, beamDir, { len: 4.5, width: 0.9 });
      const tip = h.clone().addScaledVector(beamDir, 3.4).add(V(0, 0.1 * Math.sin(t * 2), 0));
      tentOn(ctx, L(-20, SEA_Y + 1, 0), tip, t, { wig: 0.25, r0: 1.4, approach: beamDir.clone().negate().setY(0).normalize() });
      deepAt(ctx, L(-27, SEA_Y + 3, 3.0), { yaw: PI, s: 15, set: { lid: 0, glow: 1.2, coil: 0.6, reach: 0.5, lookX: -0.9 * sw, lookY: 0.5 } });
      const f = humanFace(me);
      if (i === 0) moveCam(ctx, { pos: f.clone().addScaledVector(W.fwd, 3.0).addScaledVector(W.left, 1.0).add(up(-0.7)), look: f.clone().add(up(-0.35)).addScaledVector(W.fwd, 0.6), fov: 46 }, { pos: f.clone().addScaledVector(W.fwd, 2.6).addScaledVector(W.left, 0.8).add(up(-0.6)), look: f.clone().add(up(-0.3)).addScaledVector(W.fwd, 0.6), fov: 44 }, lt / 1.2, 0.8);
      else if (i === 1) setCam(ctx, { pos: W(-7, 2.0, 7.5), look: W(-0.5, 5.5, 2.5), fov: 54 }, 0.4);
      else { const e = P.deep.userData.eyeWorld(); const pos = W(3, 3.0, 7); setCam(ctx, { pos, look: lookMix(pos, e, f, 0.25), fov: 56 }, 0.4); tag(ctx, 'LIKE A MOTH', ctx.time('b14.w8'), Infinity, { y: 0.14 }); }
    },
  })),
  // ── b15 "So I grabbed the flashlight,"  — running down Main Street toward the tower, the tentacle trailing
  {
    name: 'run to the tower', start: 'b15-0.1', set: 'town',
    setup(ctx) { town(ctx, 'flare'); ctx.add(ctx.props.torch); put(ctx, 'me', V(), 0); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me; tick(ctx, { sea: { flare: 1.2, flarePos: L(-36, SEA_Y, 0), flareR: 30 } });
      const x = -30 - 2.6 * lt;
      me.root.position.copy(L(x, 0, 1.0)); me.root.rotation.set(0, L.yaw - PI / 2, 0);
      me.pose('walk', t, { speed: 2.4 }); me.face('determined', t);
      armUp(me, 1, 'R', 0.5);
      torchIn(ctx, me, V(-0.3, 1, 0).normalize(), { len: 3.5, width: 0.8 });
      const tip = L(x + 3.2, 3.6 + 0.4 * Math.sin(t * 2), 1.0 + 0.6 * Math.sin(t * 1.3));
      tentOn(ctx, L(-22, SEA_Y + 1, 0), tip, t, { wig: 0.4, r0: 1.4 });
      const f = humanFace(me);
      setCam(ctx, { pos: L(x - 3.6, 0.9, 2.6), look: f.clone().add(V(1.5, 0.6, 0)), fov: 54 }, 0.7);
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
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me; tick(ctx, { sea: { flare: 1.2, flarePos: L(-48, SEA_Y, 2), flareR: 30 } });
      const k = clamp(lt / 1.45, 0, 1), y = lerp(4.0, 13.5, k), z = TZ + 4.4 - 0.065 * y;
      me.root.position.copy(L(TX + 0.9, y, z));
      climbPose(me, t, 3.2); me.face('determined', t);
      const tip = L(TX + 2.4 + 0.5 * Math.sin(t * 1.5), y - 1.5, TZ + 7.5);
      tentOn(ctx, L(-30, SEA_Y + 1, 2), tip, t, { wig: 0.4, r0: 1.4 });
      const f = humanFace(me);
      setCam(ctx, { pos: me.root.position.clone().add(V(2.4, -3.6, 6.2)), look: f.clone().add(up(1.4)), fov: 56 }, 0.6);
    },
  },
  // ── "…and threw it as high as I could."
  {
    name: 'throw it up', start: 'throw-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'flare'); const L = ctx.store.L;
      put(ctx, 'me', L(TX + 0.3, DY, TZ + 0.4), L.yaw + 0.3); ctx.add(ctx.props.torch);
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me, tt = ctx.markers.throw + 0.05;
      tick(ctx, { sea: { flare: 1.2, flarePos: L(TX, SEA_Y, TZ), flareR: 30 } });
      const d = t - tt;
      me.pose(d < 0 ? 'idle' : 'cheer', t, { intensity: 0.6, headPitch: -0.6 }); me.face(d < 0 ? 'determined' : 'huss', t);
      const wind = clamp((d + 0.3) / 0.3, 0, 1);
      if (d < 0) { me.joints.armR.rotation.set(lerp(-1.0, 0.9, wind), 0, -0.2); me.joints.foreArmR.rotation.set(-1.2, 0, 0); me.joints.torso.rotation.x += -0.12 * wind; }
      else { me.joints.armR.rotation.set(-3.0, 0, -0.1); me.joints.foreArmR.rotation.set(-0.1, 0, 0); }
      if (d < 0) torchIn(ctx, me, V(0, 1, 0.2).normalize(), { len: 3, width: 0.8 });
      else { const p = throwPos(L, d); P.torch.position.copy(p); P.torch.rotation.set(d * 9, d * 5, 0); P.torch.userData.set(1, 3, 0.8); }
      const f = humanFace(me);
      setCam(ctx, { pos: L(TX + 0.3, DY + 0.55, TZ + 3.2).add(V(1.0, 0, 0)), look: f.clone().add(up(1.0)), fov: 58 }, 0.8);
      shakeOn(ctx, [tt], 0.3, 0.25);
    },
  },
  // ── b16 "The tentacle followed it all the way back up."
  {
    name: 'shooting star backwards', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'flare'); const L = ctx.store.L, P = ctx.props;
      put(ctx, 'me', L(TX + 0.3, DY, TZ + 0.4), L.yaw + 0.3); ctx.add(P.torch); P.trail.forEach((s) => ctx.add(s));
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, me = ctx.cast.me, tt = ctx.markers.throw + 0.05;
      const d = t - tt, p = throwPos(L, d);
      tick(ctx, { sea: { flare: 1.2 + 0.6 * clamp((p.y - SEA_Y) / 10, 0, 1), flarePos: p, flareR: lerp(4, 30, clamp(lt / 2, 0, 1)) } });
      P.torch.position.copy(p); P.torch.rotation.set(d * 9, d * 5, 0); P.torch.userData.set(1, 3, 0.8);
      P.trail.forEach((s, k) => { s.position.copy(throwPos(L, d - (k + 1) * 0.06)); s.material.opacity = 0.8 * (1 - k / P.trail.length); });
      me.pose('idle', t, { intensity: 0.4, headPitch: -0.9 }); me.face('shocked', t); me.joints.armR.rotation.set(-2.6, 0, -0.2);
      const tip = p.clone().add(V(-1.5, -2.5, 0.5));
      tentOn(ctx, L(TX + 6, SEA_Y + 6, TZ - 2), tip, t, { wig: 0.3, r0: 1.3, approach: V(0.3, 0, 0.6).normalize() });
      deepAt(ctx, L(TX + 18, SEA_Y + 4 + 2 * clamp(lt / 2.4, 0, 1), TZ - 4), { yaw: -PI / 2, s: 15, set: { lid: 0, glow: 1.2, coil: 1, reach: 0.2, lookY: 0.6 } });
      const f = humanFace(me);
      setCam(ctx, { pos: f.clone().add(V(1.0, -1.4, 2.0)), look: lookMix(f.clone().add(V(1.0, -1.4, 2.0)), f, p, 0.75), fov: 64 }, 0.8);
    },
  },
  // ── "The eye closed."
  {
    name: 'the eye closed', start: 'close-0.12', set: 'town',
    setup(ctx) { town(ctx, 'flare'); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props, tc = ctx.markers.close; tick(ctx, { sea: { flare: 0.8, flarePos: L(TX + 10, SEA_Y, TZ), flareR: 30, glow: 1.4 } });
      const cl = ease.inOutCubic(clamp((t - tc) / 0.7, 0, 1));
      const D = deepAt(ctx, L(TX + 18, SEA_Y + 6, TZ - 4), { yaw: -PI / 2, s: 15, set: { lid: cl, glow: 1.2 - 0.6 * cl, coil: 1, lookY: 0.6 } });
      const e = D.userData.eyeWorld(), dir = V(-0.53, -0.85, 0).normalize();
      setCam(ctx, { pos: e.clone().addScaledVector(dir, 17), look: e, fov: 40 });
      ctx.fx.vignette(0.5);
    },
  },
  // ── "The deep went dark."
  {
    name: 'the deep went dark', start: 'dark-0.12', set: 'town',
    setup(ctx) { town(ctx, 'night'); const L = ctx.store.L; put(ctx, 'me', L(TX + 0.3, DY, TZ + 0.4), L.yaw + 0.3); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, k = clamp(lt / 0.9, 0, 1);
      tick(ctx, { sea: { glow: lerp(1.5, 0.9, k), flare: 0.8 * (1 - k), flarePos: L(TX + 8, SEA_Y, TZ), flareR: 30 }, shafts: 0.5 });
      me.pose('idle', t, { intensity: 0.3, headPitch: -0.5 }); me.face('neutral', t);
      setCam(ctx, { pos: L(-20, 9, 16), look: L(-48, 13, 0), fov: 56 }, 0);
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
        { pos: f.clone().add(V(0.4, -1.3, 2.6)), look: f.clone().add(up(-0.1)), fov: 50 },
        { pos: L(-33.5, 1.4, 1.2), look: L(-41, 1.5, 1.5), fov: 52 },
        { pos: L(-28, 4, 9), look: L(-48, 10, 1), fov: 60 },
      ];
      setCam(ctx, cams[i], 0.8); ctx.cam.punch(hits, t, 0.1, 0.2);
    },
  })),
  // ── b18 "Way past the deep, I saw lights."
  {
    name: 'lights past the deep', start: 'b18-0.1', set: 'town',
    setup(ctx) { deepTown(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me; deepTick(ctx);
      me.pose('idle', t, { intensity: 0.3, headPitch: -0.8 }); me.face('shocked', t);
      const f = humanFace(me);
      const pos = L(TX + 1.6, DY + 0.8, TZ + 2.8);
      moveCam(ctx, { pos, look: lookMix(pos, f, L(-40, 100, 8), 0.55), fov: 60 }, { pos, look: lookMix(pos, f, L(-40, 100, 8), 0.8), fov: 58 }, lt / 2, 0.9);
    },
  },
  // ── "Another town. Upside down."
  {
    name: 'another town upside down', start: 'town-0.1', set: 'town',
    setup(ctx) { deepTown(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t; deepTick(ctx);
      const k = ease.inOutSine(clamp(lt / 2.2, 0, 1));
      setCam(ctx, { pos: L(-40, lerp(30, 52, k), -26), look: L(-40, 110, 6), fov: 60 });
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
      moveCam(ctx, { pos: b.clone().add(V(0, -14, -9)), look: b.clone().add(V(0, -0.4, 0)), fov: 40 }, { pos: b.clone().add(V(0, -9, -6)), look: b.clone().add(V(0, -0.3, 0)), fov: 38 }, lt / 2.2, 0.9);
    },
  },
  // ── b19 "And I heard his mum shout:"  — close on the upside-down window: she wags her finger
  {
    name: 'his mum shouts', start: 'b19-0.1', set: 'town',
    setup(ctx) { deepTown(ctx, { people: true }); },
    update(ctx, lt) {
      const t = ctx.t; deepTick(ctx, { people: true, wag: true });
      const b = ctx.store.bay;
      moveCam(ctx, { pos: b.clone().add(V(-1.2, -6.2, -4.6)), look: b.clone().add(V(0, -0.2, 0)), fov: 40 }, { pos: b.clone().add(V(-1.0, -5.6, -4.0)), look: b.clone().add(V(0, -0.2, 0)), fov: 38 }, lt / 1.3, 1.0);
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
      const c0 = { pos: b.clone().add(V(0.8, -4.8, -3.2)), look: b.clone().add(V(0, -0.5, 0)), fov: 42 };
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
      const a = clamp(1 - (t - (endT - 0.42)) / 0.2, 0, 1);
      if (t > tu) ctx.fx.text('US.', { x: 0.5, y: 0.2, size: 190, fill: '#ffe14a', stroke: '#000000', line: 14, rot: -0.06, scale: t - tu < 0.12 ? lerp(2, 1, (t - tu) / 0.12) : 1, alpha: a });
      if (t > tu && t - tu < 0.15) ctx.cam.shake(0.3, t, 5);
      iris(ctx, endT - 0.45, 0.42, 0.42);
    },
  },
];

// ─── helpers used by several shots (hoisted)
function bonks(ctx, pc, times) {
  const P = ctx.props, t = ctx.t;
  P.bonks.forEach((b, k) => {
    const tk = times[k % times.length] ?? 1e9, d = t - tk;
    if (k >= times.length || d < -0.6 || d > 1.0) { b.visible = false; return; }
    b.visible = true;
    if (d < 0) { b.position.copy(pc).add(V(0.05 * k, -d * 5.5, 0.03 * k)); b.rotation.set(t * 8, k, t * 6); }
    else { const vx = (k % 2 ? 1 : -1) * 1.6, vz = 0.8 * (k % 3 - 1); b.position.copy(pc).add(V(vx * d, 2.6 * d - 4.9 * d * d, vz * d)); b.rotation.set(t * 14, k, t * 9); }
  });
  P.dings.forEach((dg, j) => { const tk = lastBefore(times, t); const d = tk != null ? t - tk : 9; if (j === 0) { dg.position.copy(pc).add(V(0.25, 0.25, 0)); dg.lookAt(ctx.camera.position); dg.userData.set(d < 0.45 ? d / 0.45 : 0); dg.scale.multiplyScalar(0.6); } else dg.visible = false; });
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
function throwPos(L, d) {
  if (d <= 0) return L(TX + 0.4, DY + 2.0, TZ + 0.5);
  const y = DY + 2.0 + 9 * d + 2.2 * d * d, r = 0.6 + 1.4 * d, a = d * 7;
  return L(TX + 0.4 + Math.cos(a) * r + 2.2 * d, y, TZ + 0.5 + Math.sin(a) * r - 1.0 * d);
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
  s.fog.near = 60; s.fog.far = 420;
  addW(ctx, P.layers, L(-20, 0, 0)); addW(ctx, P.motes, L(-40, 60, 0));
  const U = P.uptown; ctx.add(U); U.position.copy(L(UPTOWN.x, UPTOWN.y, UPTOWN.z)); U.rotation.set(PI, 0, 0); U.updateMatrixWorld(true);
  put(ctx, 'me', L(TX + 0.3, DY, TZ + 0.4), L.yaw + 0.3);
  const hero = U.userData.hero;
  ctx.store.bay = U.localToWorld(hero.bayLocal.clone());
  if (people) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(PI, 0, 0));
    const place = (id, lx, lz, yaw) => { const p = U.localToWorld(hero.pos.clone().add(V(lx, 0, lz))); ctx.place(id, p); const r = ctx.cast[id].root; r.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw)); return ctx.cast[id]; };
    place('mumB', -0.55, -0.1, hero.yaw + 0.5); place('kidB', 0.6, 0.2, hero.yaw - 0.35);
    ctx.add(P.torchB);
    ctx.add(P.key2); P.key2.position.copy(ctx.store.bay).add(V(0, -1.5, -2.5)); P.key2.intensity = 30;
  }
}
function deepTick(ctx, { people = false, wag = false, point = false } = {}) {
  const t = ctx.t, P = ctx.props;
  tick(ctx, { sea: { opacity: 0.32, glow: 1.0, deep: '#0d3a78', shallow: '#2a8ad0', light: '#9ff4ff' }, shafts: 0, bubbles: 0.4 });
  P.layers.userData.set(1); P.motes.userData.set(t, 1); P.uptown.userData.set(t, 1);
  if (people) {
    const mum = ctx.cast.mumB, kid = ctx.cast.kidB;
    mum.pose('idle', t, { intensity: 0.4 }); mum.face(wag || point ? 'determined' : 'neutral', t);
    if (wag) { mum.joints.armR.rotation.set(-1.9, 0.0, -0.3 + 0.35 * Math.sin(t * 12)); mum.joints.foreArmR.rotation.set(-0.6, 0, 0); }
    if (point) { mum.joints.armR.rotation.set(-3.0, 0, -0.15); mum.joints.foreArmR.rotation.set(0, 0, 0); mum.joints.armL.rotation.set(-0.6, 0, 0.6); mum.joints.foreArmL.rotation.set(-1.6, 0, 0); }
    kid.pose('idle', t, { intensity: 0.4 }); kid.face(wag || point ? 'sad' : 'smile', t);
    kid.joints.armR.rotation.set(-1.3, 0, 0.1); kid.joints.foreArmR.rotation.set(-0.4, 0, 0);
    kid.root.updateMatrixWorld(true);
    const down = V(0, -1, 0);
    holdAlong(P.torchB, kid, armDir(kid).lerp(down, 0.5).normalize()); P.torchB.userData.set(1, 3.0, 0.8);
  }
}
