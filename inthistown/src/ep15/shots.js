// In This Town — Episode 15: "The 3:33".  Every night at 3:33 a glowing train with no tracks floats down Main Street.
// The narrator's cat walks on board; he dives in after it, past windows into other versions of town, pulls the
// emergency stop… and gets off in a town where the clock runs backwards, with a cat that has a white paw.
// Film contract: SPEC.md §8.  Timeline: episodes/ep15/timeline.json.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { makeCreature, WALK_SPEED } from '../characters.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { yawOf, rel } from '../direct.js';
import { clamp, ease, hash, lerp, canvasTexture } from '../lib/util.js';
import { quoteCard } from '../cards.js';
import { makeTable } from '../props.js';
import { V, frame, frameAt, lastBefore } from '../shots.js';
import { HOVER, makeTrain, makeFogBank, makeMotes, makeClockFace, makeBeard, makeConductorCap, makeSandwich, makeWhitePaw,
  makeLever, makeSparks, makeBookcase, makeBookPile, makeBench, makeBackpack, makeCurtainWindow, makeSign, makeTinyHat,
  glowSprite, buildTrainInterior, CAB } from './props.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const NEIGHBOR_IDS = EXTRA_IDS.slice(0, 5);
function catWithPaw() {
  const c = makeCreature('cat', { id: 'catW', scale: 1.3 });
  const paw = makeWhitePaw(); c.joints.armR.add(paw);
  return c;
}
export const cast = {
  me: MAIN.me,
  me2: { ...MAIN.me, id: 'me2' },
  cat: { creature: 'cat', id: 'cat', scale: 1.3 },
  catW: catWithPaw,
  otto: { id: 'otto', skin: '#e9b99a', hair: { style: 'bald', color: '#e9b99a' }, top: { style: 'cardigan', color: '#e8892c', accent: '#f3e3a5' },
    bottom: { style: 'pants', color: '#5a4a3a' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.95 },
  lacey: { id: 'lacey', skin: '#f4d0b5', hair: { style: 'bun', color: '#b9b9c0' }, top: { style: 'cardigan', color: '#8a5cff', accent: '#ffd23f' },
    bottom: { style: 'skirt', color: '#4a3a6a' }, shoes: '#7a1f2b', accessories: ['glasses'], scale: 0.96 },
  neighbor: { id: 'neighbor', skin: '#e0ac69', hair: { style: 'short', color: '#3b2416' }, top: { style: 'tee', color: '#f2f2f2', accent: '#3c8f45', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#1d1d22', accessories: ['cap', 'mustache'], capColor: '#3c8f45', scale: 1.12 },
  sleeper: { id: 'sleeper', skin: '#ffdbac', hair: { style: 'spiky', color: '#d97b2b' }, top: { style: 'tee', color: '#4f7fbf', accent: '#ffffff', emblem: 'star' },
    bottom: { style: 'pants', color: '#4f7fbf' }, shoes: '#f2f2f2', scale: 0.9 },
  pig1: { creature: 'pigeon', id: 'pig1' }, pig2: { creature: 'pigeon', id: 'pig2' }, pig3: { creature: 'pigeon', id: 'pig3' }, pig4: { creature: 'pigeon', id: 'pig4' },
  ...Object.fromEntries(NEIGHBOR_IDS.map((id) => [id, EXTRAS[id]])),
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 15 }),
  bedroom: () => buildRoom({ variant: 'hero', window: 'dark', poster: 'knight' }),
  library: () => buildRoom({ variant: 'grandad', window: 'day', poster: 'none', wall: '#e6d3ae' }),
  cab: () => buildTrainInterior(),
};

export function init(ctx) {
  const P = ctx.props;
  P.train = makeTrain();
  P.fog = makeFogBank({ n: 36, w: 80, d: 20, h: 1.4, size: 8, color: '#b4c6da', opacity: 0.34 });
  P.fogHi = makeFogBank({ n: 14, w: 60, d: 26, h: 6, size: 14, color: '#8ea4c0', opacity: 0.16 });
  P.motes = makeMotes({ n: 60, w: 14, h: 5, d: 8, color: '#fff2b0', size: 0.035 });
  P.motesCab = makeMotes({ n: 50, w: 16, h: 2.4, d: 2.6, color: '#ffe9a0', size: 0.025 });
  P.clock = makeClockFace(0.95);
  P.beard = makeBeard();
  P.cap = makeConductorCap();
  P.sandwich = makeSandwich();
  P.lever = makeLever();
  P.sparks = makeSparks(60);
  P.backpack = makeBackpack(); P.backpack2 = makeBackpack();
  P.bench = makeBench();
  P.cases = [makeBookcase(1), makeBookcase(2), makeBookcase(3), makeBookcase(4, 1.2, 2.2)];
  P.piles = [1, 2, 3, 4, 5, 6].map((s) => makeBookPile(s, 5 + (s % 4)));
  P.desk = makeTable({ w: 1.5, d: 0.7 });
  P.libSign = makeSign(['LIBRARY'], { w: 1.5, h: 0.4, bg: '#3f7a5a', fg: '#fff4c0', border: '#ffd23f' });
  P.shhSign = makeSign(['SHHH!'], { w: 0.7, h: 0.32, bg: '#fff4e0', fg: '#c0392b', border: '#c0392b' });
  P.lateSign = makeSign(['LATE RETURNS', '10¢'], { w: 0.7, h: 0.42, bg: '#ffffff', fg: '#1d1d22', border: '#1d1d22' });
  P.book = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.08), [
    new THREE.MeshStandardMaterial({ color: '#fbf6ec' }), new THREE.MeshStandardMaterial({ color: '#c0392b' }), new THREE.MeshStandardMaterial({ color: '#fbf6ec' }),
    new THREE.MeshStandardMaterial({ color: '#fbf6ec' }), new THREE.MeshStandardMaterial({ color: '#c0392b' }), new THREE.MeshStandardMaterial({ color: '#c0392b' })]);
  P.curtains = [0, 1, 2, 3, 4, 5, 6, 7].map(() => makeCurtainWindow());
  P.fill = new THREE.PointLight('#c8d8ff', 5, 9, 1.4);
  P.lampGlows = [];
  for (let i = 0; i < 11; i++) P.lampGlows.push(glowSprite('#ffe2a8', 2.6, 0.7));
  P.whiteWin = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
  P.whiteGlow = glowSprite('#ffffff', 4.5, 0.9);
  { const geo = new THREE.SphereGeometry(0.5, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const pp = geo.attributes.position;   // lumpy quilted surface
    for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i); const k = 1 + 0.05 * Math.sin(x * 19) * Math.sin(z * 17) + 0.04 * Math.sin(y * 23); pp.setXYZ(i, x * k, y, z * k); }
    geo.computeVertexNormals();
    const tex = canvasTexture(128, 128, (g) => { g.fillStyle = '#4f7fbf'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#ffd23f'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 3 === 0) { g.beginPath(); g.arc(i * 16 + 8, j * 16 + 8, 3.5, 0, Math.PI * 2); g.fill(); } });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 2);
    P.blanket = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); }
  P.suitcase = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.38, 0.16), new THREE.MeshStandardMaterial({ color: '#7a1f2b', roughness: 0.6 })); P.suitcase.add(b);
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.04), new THREE.MeshStandardMaterial({ color: '#1d1d22' })); h.position.y = 0.21; P.suitcase.add(h); }
  P.frameFG = makeWindowFrameFG();
  P.pigHats = [makeTinyHat('top'), makeTinyHat('bowler', '#7a4a24'), makeTinyHat('cap', '#e8412c'), makeTinyHat('top', '#2f4d8a')];
  P.paw2 = makeWhitePaw();
  P.redLight = new THREE.PointLight('#ff2020', 0, 14, 1.2);
  P.moonOrb = glowSprite('#e8f0ff', 9, 0.9);
  P.fogTower = makeFogBank({ n: 16, w: 14, d: 10, h: 1.6, size: 6, color: '#a8bcd6', opacity: 0.42 });
  P.winLight = new THREE.PointLight('#eef4ff', 0, 7, 1.3);
  P.povFrame = makePovFrame();
}
/** Window frame + curtains sized to sit 0.6 m in front of a fov-42 camera (posts at the frame edges). */
function makePovFrame() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: 0.7, emissive: '#2a2f40', emissiveIntensity: 0.5 });
  const cur = new THREE.MeshStandardMaterial({ color: '#2f4d8a', roughness: 0.85, emissive: '#0c1630', emissiveIntensity: 0.6 });
  const b = (w, h, d, x, y, z, mm = m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mm); o.position.set(x, y, z); g.add(o); };
  b(0.03, 0.6, 0.02, -0.118, 0, 0); b(0.03, 0.6, 0.02, 0.118, 0, 0);       // side posts
  b(0.3, 0.035, 0.02, 0, 0.205, 0); b(0.34, 0.05, 0.06, 0, -0.215, 0.01);  // top bar + sill
  b(0.24, 0.008, 0.008, 0, 0.12, -0.005);                                   // thin transom
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) b(0.035, 0.5, 0.012, s * (0.112 + k * 0.03), 0.01 - 0.01 * k, 0.03 + 0.008 * (k % 2), cur);
  b(0.3, 0.06, 0.02, 0, 0.245, 0.03, cur);                                  // pelmet
  return g;
}
function makeWindowFrameFG() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: 0.7 }), cur = new THREE.MeshStandardMaterial({ color: '#2f4d8a', roughness: 0.85 });
  const b = (w, h, d, x, y, z, mm = m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mm); o.position.set(x, y, z); g.add(o); };
  b(0.1, 1.6, 0.1, -0.62, 0, 0); b(0.1, 1.6, 0.1, 0.62, 0, 0); b(1.34, 0.1, 0.1, 0, 0.75, 0); b(1.5, 0.08, 0.3, 0, -0.75, 0.1); b(0.05, 1.5, 0.05, 0, 0, 0); b(1.24, 0.05, 0.05, 0, 0.05, 0);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) b(0.12, 1.7, 0.06, s * (0.72 + k * 0.1), 0.02, 0.12 + 0.03 * (k % 2), cur);
  return g;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
const CURB = 0.12;
const LAMPS = [[-33, -5.15], [-21, -5.15], [-9, -5.15], [3, -5.15], [15, -5.15], [27, -5.15], [-27, 5.15], [-15, 5.15], [-3, 5.15], [9, 5.15], [21, 5.15]];
const TRAIN_STOP = -27;          // the train stops in front of the narrator's house (door at x = −27, z = +1.4)
const DOOR_Z = 1.4;
const CLOCK = [-51 + 1.34, 11.0, 1.5];   // town-local centre of the east clock face (faces +X)

function T(ctx) { ctx.set.root.updateMatrixWorld(true); const r = ctx.set.root; const f = (x, y, z) => r.localToWorld(V(x, y, z)); f.yaw = yawOf(r); return f; }
function R(ctx) { ctx.set.root.updateMatrixWorld(true); const r = ctx.set.root; const f = (x, y, z) => r.localToWorld(V(x, y, z)); f.yaw = yawOf(r); return f; }
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 70, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.8)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale || 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.26, size: 130, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.1, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
/** The big glowing 3:33 readout. */
function clock333(ctx, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const pop = d < 0.2 ? ease.outBack(clamp(d / 0.2, 0, 1)) : 1;
  const blink = Math.sin(ctx.t * 9) > -0.3 ? 1 : 0.55;
  ctx.fx.text('3:33', { x: 0.5, y: 0.17, size: 200, fill: '#ff3b30', stroke: '#140404', line: 14, bg: 'rgba(8,8,12,0.85)', scale: pop, alpha: blink, ...o });
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function catFace(c) { c.root.updateMatrixWorld(true); return c.joints.head.localToWorld(V(0, 0.04, 0.1)); }
function pawPos(c) { c.root.updateMatrixWorld(true); return c.joints.armR.localToWorld(V(0, -0.15, 0.03)); }
const iris = (ctx, t0, cy = 0.45, dur = 0.45) => { const k = clamp((ctx.t - t0) / dur, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); }); };
function fill(ctx, pos, k = 1, color = '#c8d8ff') { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); }
function setCam(ctx, cam, k = 1, color) { ctx.cam.set(cam); fill(ctx, cam.pos, k, color); }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 1, color) { const c = camLerp(a, b, u); ctx.cam.set(c); fill(ctx, c.pos, k, color); return c; }
/** static noise / glitch overlay */
function glitch(ctx, t0, dur = 0.35, amt = 1) {
  const d = ctx.t - t0; if (d < 0 || d > dur) return;
  const k = amt * (1 - d / dur);
  ctx.fx.draw((g, W, H) => {
    g.save();
    const f = Math.floor(ctx.t * 30);
    for (let i = 0; i < 26; i++) { const y = hash(f * 13 + i) * H, h = 4 + hash(f * 7 + i * 3) * 40; g.fillStyle = `rgba(${200 + 55 * hash(i + f)},${200 + 55 * hash(i * 2 + f)},255,${0.25 * k})`; g.fillRect(0, y, W, h); }
    g.fillStyle = `rgba(0,0,0,${0.25 * k})`; for (let i = 0; i < 40; i++) g.fillRect(hash(f * 3 + i) * W, hash(f * 5 + i * 7) * H, 30 + 80 * hash(i), 3);
    g.restore();
  });
  ctx.cam.shake(0.18 * k, ctx.t, 41);
}
function speedLines(ctx, k = 1, color = 'rgba(255,240,200,') {
  ctx.fx.draw((g, W, H) => {
    g.save(); const f = Math.floor(ctx.t * 30);
    for (let i = 0; i < 14; i++) { const y = hash(i * 3.7 + f) * H, len = W * (0.3 + 0.5 * hash(i + f * 2)), x = hash(i * 9.1 + f * 4) * W - len / 2; g.fillStyle = color + (0.35 * k) + ')'; g.fillRect(x, y, len, 3 + 4 * hash(i)); }
    g.restore();
  });
}

// ─── town
function nightTown(ctx, { glow = 0.45, fogNear = 6, fogFar = 85, fogA = 1, preset = 'quiet_night', motes = 0 } = {}) {
  const set = ctx.set;
  set.setLighting?.(preset); set.set?.('partyProps', false); set.set?.('fireworks', false); set.set?.('foam', 0);
  set.set?.('windowGlow', glow); set.set?.('standsCrowd', false);
  if (set.fog) { set.fog.near = fogNear; set.fog.far = fogFar; if (preset === 'quiet_night') set.fog.color.set('#1a2c3e'); }
  set.exposure = preset === 'quiet_night' ? 1.12 : 1.0;
  const L = T(ctx);
  ctx.store.ticks = [];
  if (fogA > 0) {
    const P = ctx.props;
    ctx.add(P.fog); P.fog.position.copy(L(-20, 0, 0)); P.fog.rotation.set(0, L.yaw, 0);
    ctx.add(P.fogHi); P.fogHi.position.copy(L(-25, 0, 0)); P.fogHi.rotation.set(0, L.yaw, 0);
    ctx.store.ticks.push((t) => { P.fog.userData.set(t, fogA); P.fogHi.userData.set(t, fogA * (preset === 'quiet_night' ? 1 : 0.5)); });
  }
  if (motes > 0) { const P = ctx.props; ctx.add(P.motes); ctx.store.ticks.push((t) => P.motes.userData.set(t, motes)); }
  return L;
}
function dayTown(ctx, preset = 'day') {
  const set = ctx.set;
  set.setLighting?.(preset); set.set?.('partyProps', false); set.set?.('fireworks', false); set.set?.('foam', 0); set.set?.('windowGlow', preset === 'dusk' ? 0.6 : 0); set.set?.('standsCrowd', false);
  set.exposure = 1.0;
  ctx.store.ticks = [];
  return T(ctx);
}
function tick(ctx) { for (const f of ctx.store.ticks || []) f(ctx.t); }
/** Put the train on the street with its centre at town-x `x` (it faces −X, the door faces +Z). */
function trainAt(ctx, L, x, opts = {}, z = 0, y = HOVER) {
  const tr = ctx.props.train; ctx.add(tr);
  tr.position.copy(L(x, y, z)); tr.rotation.set(0, L.yaw + Math.PI, 0);
  tr.userData.set({ t: ctx.t, ...opts });
  return tr;
}
/** world position of a point given in train-local coordinates */
function trainPoint(tr, x, y, z) { tr.updateMatrixWorld(true); return tr.localToWorld(V(x, y, z)); }
/** Lamp-head glows that flicker when the train passes (trainX = town x of the train centre, or null). */
function lampGlows(ctx, L, trainX = null, k = 1) {
  const P = ctx.props;
  LAMPS.forEach(([x, z], i) => {
    const s = P.lampGlows[i]; ctx.add(s); s.position.copy(L(x, 4.55, z));
    let a = 0.55 * k;
    if (trainX != null) { const d = Math.abs(x - trainX); if (d < 14) { const fl = hash(Math.floor(ctx.t * 18) + i * 17); a *= fl > 0.45 ? 1.4 : 0.15; } }
    s.material.opacity = a;
  });
}
function clockOnTower(ctx, L, h, m, bright = 1) {
  const c = ctx.props.clock; ctx.add(c);
  c.position.copy(L(CLOCK[0], CLOCK[1], CLOCK[2])); c.rotation.set(0, L.yaw + Math.PI / 2, 0);
  c.userData.set(h, m); c.userData.bright(bright);
  return c;
}
/** Hold-a-cat arms for a standing human (both forearms across the chest). */
function hugArms(ch, k = 1, tight = 0) {
  const J = ch.joints;
  J.armL.rotation.x += -0.9 * k; J.armL.rotation.z += -0.25 * k; J.foreArmL.rotation.x += -(1.2 + 0.25 * tight) * k; J.foreArmL.rotation.y = (J.foreArmL.rotation.y || 0) + 0.5 * k;
  J.armR.rotation.x += -0.9 * k; J.armR.rotation.z += 0.25 * k; J.foreArmR.rotation.x += -(1.2 + 0.25 * tight) * k; J.foreArmR.rotation.y = (J.foreArmR.rotation.y || 0) - 0.5 * k;
}
/** Parent a cat to a human's chest (in their arms). */
function holdCat(ctx, ch, cat, { x = 0, y = 0.12, z = 0.36, yaw = Math.PI / 2, pitch = 0 } = {}) {
  ctx.add(cat.root, ch.joints.torso);
  cat.root.position.set(x, y, z); cat.root.rotation.set(pitch, yaw, 0, 'YXZ');
}
/** Cat strolling: idle body + swinging legs (the shot moves the root). */
function catWalk(c, t, speed = 1) {
  c.pose('idle', t);
  const J = c.joints, w = t * 9 * speed;
  J.armL.rotation.x += 0.55 * Math.sin(w); J.armR.rotation.x += 0.55 * Math.sin(w + Math.PI);
  J.legL.rotation.x += 0.55 * Math.sin(w + Math.PI); J.legR.rotation.x += 0.55 * Math.sin(w);
  J.hips.position.y += 0.012 * Math.abs(Math.sin(w));
  if (J.tail1) J.tail1.rotation.x = -0.6;
}
/** Waving while walking (right arm up). */
function walkWave(ch, t, speed = 1) {
  ch.pose('walk', t, { speed });
  const J = ch.joints;
  J.armR.rotation.set(0, 0, 0); J.armR.rotation.x = -0.2; J.armR.rotation.z = 2.5 + 0.35 * Math.sin(t * 10);
  J.foreArmR.rotation.set(0, 0, 0.3 * Math.sin(t * 10));
}
function cabRig(ctx) { const set = ctx.set; set.lights.hemi.intensity = 1.25; set.root.updateMatrixWorld(true); const C = (x, y, z) => set.root.localToWorld(V(x, y, z)); C.yaw = yawOf(set.root); ctx.store.ticks = []; (set.pools || []).forEach((p) => { p.material.opacity = 0.7; }); const P = ctx.props; ctx.add(P.motesCab); P.motesCab.position.copy(C(0, 1.3, 0)); ctx.store.ticks.push((t) => P.motesCab.userData.set(t, 0.8)); return C; }
/** the back of the carriage: the white-paw cat on the last seat (left side, facing +x) */
const CAT_SEAT = [-8.62, 0.54, -0.98];
function seatCat(ctx, C, { cap = true, sandwich = true } = {}) {
  const c = ctx.cast.catW; ctx.place('catW', C(CAT_SEAT[0], CAT_SEAT[1], CAT_SEAT[2])); c.root.rotation.set(0, C.yaw + Math.PI / 2, 0);
  const P = ctx.props;
  if (cap) { ctx.add(P.cap, c.joints.head); P.cap.position.set(0, 0.135, 0.01); P.cap.rotation.set(-0.12, 0, 0.1); P.cap.scale.setScalar(1.0); }
  if (sandwich) { ctx.add(P.sandwich, c.joints.armR); P.sandwich.position.set(0.07, -0.2, 0.08); P.sandwich.rotation.set(0.3, 0, 0); P.sandwich.scale.setScalar(0.7); }
  return c;
}
/** cat sitting up holding a sandwich in both front paws */
function catEat(c, t, { chew = 1, expr = 'smug', ft = 0.5, head = null } = {}) {
  c.pose('sit', t, head ? { lookAt: head } : {});
  const J = c.joints;
  J.armL.rotation.x += -1.15; J.armR.rotation.x += -1.15; J.armL.rotation.z += 0.25; J.armR.rotation.z += -0.25;
  J.head.rotation.x += 0.06 * chew * Math.max(0, Math.sin(t * 11));
  c.face(expr, ft);
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
const shots_ = [];
const S = (def) => { shots_.push(def); return def; };

// ── b01 "In this town, a train comes through at three thirty-three every night. There are no tracks."
S({
  name: 'clock 3:33', start: 0, set: 'town',
  setup(ctx) {
    const L = nightTown(ctx, { motes: 0 }); ctx.store.L = L;
    const P = ctx.props; ctx.add(P.moonOrb); P.moonOrb.position.copy(L(-82, 34, -22));
    // extra fog drifting round the tower base
    ctx.add(P.fogTower); P.fogTower.position.copy(L(-47, 0, 2)); P.fogTower.rotation.set(0, L.yaw + Math.PI / 2, 0);
    ctx.store.ticks.push((t) => P.fogTower.userData.set(t, 1));
  },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store;
    const tt = ctx.time('b01.w9');   // "thirty-three"
    const d = ctx.t - tt;
    const m = d < 0 ? 32 : 33 + 0.4 * Math.exp(-d * 9) * Math.sin(d * 40);
    const c = clockOnTower(ctx, L, 3, m, d < 0 ? 0.8 : 1);
    if (d >= 0) c.userData.halo.material.opacity = 0.35 * (1.6 + 0.9 * Math.sin(d * 9)) * (1 + 1.5 * Math.exp(-d * 4));
    // wide night establishing shot (tower against the moonlit sky) → eases into the clock close-up by "thirty-three"
    const w0 = { pos: L(-37, 4.5, 6), look: L(CLOCK[0], 10.4, CLOCK[2]), fov: 40 };
    const a = { pos: L(-43.0, 7.6, 1.2), look: L(CLOCK[0], 10.9, CLOCK[2]), fov: 30 };
    const b = { pos: L(-44.6, 8.6, 1.4), look: L(CLOCK[0], 11.0, CLOCK[2]), fov: 26 };
    const ta = tt;   // shot starts at t = 0, so this is the local time of the hit
    if (lt < ta) moveCam(ctx, w0, a, ease.inOutCubic(clamp(lt / ta, 0, 1)), 0.2);
    else moveCam(ctx, a, b, ease.outSine(clamp((lt - ta) / 0.6, 0, 1)), 0.2);
    if (d > 0 && d < 0.12) ctx.cam.shake(0.15, ctx.t, 3);
    clock333(ctx, tt);
  },
});
S({
  name: 'train arrives', start: 'b01.w10-0.05', set: 'town',
  setup(ctx) { ctx.store.L = nightTown(ctx); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store;
    const x = 16 - 7.5 * (ctx.t - ctx.time('b01.w10'));
    trainAt(ctx, L, x, { t: ctx.t });
    lampGlows(ctx, L, x);
    const c = moveCam(ctx, { pos: L(-11, 2.6, 3.4), look: L(4, 2.2, -0.2), fov: 44 }, { pos: L(-11, 2.3, 3.3), look: L(3, 2.1, -0.2), fov: 40 }, clamp(lt / 1.2, 0, 1), 0.3);
    clock333(ctx, -1);
  },
});
S({
  name: 'no tracks', start: 'b01.w12-0.05', set: 'town',
  setup(ctx) { ctx.store.L = nightTown(ctx); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store;
    const x = 7 - 6.5 * (ctx.t - ctx.time('b01.w12'));
    trainAt(ctx, L, x, { t: ctx.t });
    lampGlows(ctx, L, x);
    moveCam(ctx, { pos: L(-1.0, 0.25, 7.0), look: L(5, 1.3, 0), fov: 50 }, { pos: L(-0.6, 0.25, 6.9), look: L(4, 1.3, 0), fov: 48 }, clamp(lt / 1.2, 0, 1), 0.4);
    tag(ctx, 'NO TRACKS', ctx.time('b01.w14'), Infinity, { y: 0.2, size: 84, bg: 'rgba(200,0,40,0.9)' });
  },
});
// ── b02 "It just floats down Main Street, glowing, without making a sound."
S({
  name: 'glides past houses', start: 'b02-0.1', set: 'town',
  setup(ctx) { ctx.store.L = nightTown(ctx); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store;
    const x = 23.5 - 6 * (ctx.t - ctx.time('b02'));
    trainAt(ctx, L, x, { t: ctx.t });
    lampGlows(ctx, L, x - 12);
    moveCam(ctx, { pos: L(-6, 0.6, 6.6), look: L(8, 2.4, 2.0), fov: 54 }, { pos: L(-6.3, 0.55, 6.7), look: L(7, 2.3, 1.8), fov: 52 }, clamp(lt / 2.2, 0, 1), 0.5);
  },
});
S({
  name: 'headlight in fog', start: 'b02.w7-0.08', set: 'town',
  setup(ctx) { ctx.store.L = nightTown(ctx, { fogNear: 4, fogFar: 70 }); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store;
    const x = -16 - 5 * (ctx.t - ctx.time('b02.w7'));
    trainAt(ctx, L, x, { t: ctx.t });
    lampGlows(ctx, L, x);
    moveCam(ctx, { pos: L(-46, 1.1, 3.6), look: L(-31, 2.0, 0), fov: 32 }, { pos: L(-46.5, 1.0, 3.7), look: L(-32, 1.9, 0), fov: 30 }, clamp(lt / 1.3, 0, 1), 0.3);
  },
});
// ── b03 HUSS ×3 — glowing windows whip past, a silhouette in each
[0, 1, 2].forEach((i) => S({
  name: `windows whip #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'town',
  setup(ctx) { ctx.store.L = nightTown(ctx, { fogA: 0.6 }); },
  update(ctx) {
    tick(ctx); const { L } = ctx.store;
    const hits = ctx.hussTimes('b03').map((h) => h + 0.03), hit = hits[i];
    const camX = -8, win = [5, 6, 8][i];
    const trX = camX + ctx.props.train.userData.winX[win] - 16 * (ctx.t - hit);
    trainAt(ctx, L, trX, { t: ctx.t });
    const cams = [{ pos: L(camX, 2.3, 4.0), look: L(camX, 2.55, 0), fov: 50 }, { pos: L(camX + 0.4, 1.0, 3.6), look: L(camX - 0.4, 2.8, 0), fov: 46 }, { pos: L(camX - 0.5, 4.6, 3.8), look: L(camX, 2.6, 0.5), fov: 42 }];
    setCam(ctx, cams[i], 0.6, '#ffe2b0');
    ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    speedLines(ctx, 1);
  },
}));
// ── b04 "Nobody who gets on comes back the same."  The train stops; the door slides open onto pure white light.
S({
  name: 'door opens white', start: 'b04-0.1', set: 'town',
  setup(ctx) { ctx.store.L = nightTown(ctx, { fogA: 0.8 }); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store;
    const t0 = ctx.time('b04') + 0.15, door = ease.inOutCubic(clamp((ctx.t - t0) / 0.9, 0, 1));
    trainAt(ctx, L, TRAIN_STOP, { t: ctx.t, door });
    lampGlows(ctx, L, null);
    moveCam(ctx, { pos: L(-25.2, 1.1, 9.0), look: L(-27, 2.0, DOOR_Z), fov: 40 }, { pos: L(-25.7, 1.4, 6.8), look: L(-27, 2.15, DOOR_Z), fov: 38 }, ease.inOutSine(clamp(lt / 2, 0, 1)), 0.5);
    ctx.fx.overlay('#ffffff', 0.08 * door * (0.9 + 0.1 * Math.sin(ctx.t * 13)));
  },
});
/** Two townsfolk on the south pavement watching (day). */
function bystanders(ctx, L, spots = [[OTTO_X - 3.2, 6.0, 0.7], [OTTO_X - 1.9, 6.5, 0.4], [OTTO_X + 5.4, 5.7, -1.0]]) {
  const ids = NEIGHBOR_IDS.slice(2, 5);
  spots.forEach(([x, z, y], k) => { ctx.place(ids[k], L(x, z > 5.15 ? CURB : 0, z)); ctx.cast[ids[k]].root.rotation.set(0, L.yaw + Math.PI + y, 0); });
  ctx.store.ticks.push((t) => ids.forEach((id, k) => { const c = ctx.cast[id]; const late = ctx.t > ctx.time('b05.w8'); c.pose(late ? (k === 1 ? 'surprised' : k === 2 ? 'point' : 'clap') : 'idle', t + k); c.face(late ? 'shocked' : 'smile', t + k); }));
}
// ── b05 "Grandpa Otto rode it once. He came back twelve seconds later with a beard down to his knees."
const OTTO_X = -11;
S({
  name: 'otto boards', start: 'b05-0.1', set: 'town',
  setup(ctx) {
    const L = dayTown(ctx); ctx.store.L = L;
    ctx.place('otto', L(OTTO_X, 0, 4.4));
    const P = ctx.props; ctx.add(P.suitcase, ctx.cast.otto.joints.handR); P.suitcase.position.set(0, -0.22, 0); P.suitcase.rotation.set(0, Math.PI / 2, 0);
    bystanders(ctx, L, [[OTTO_X + 2.2, 5.6, 0.5], [OTTO_X + 3.9, 5.8, 0.3], [OTTO_X + 5.6, 5.5, 0.6]]);
  },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store, o = ctx.cast.otto;
    trainAt(ctx, L, OTTO_X, { t: ctx.t, door: 1, glow: 0.8, light: 0.2 });
    const t0 = ctx.time('b05'), k = clamp((ctx.t - t0) / 1.9, 0, 1);
    // walk to the steps, climb, step in
    const z = lerp(4.4, 1.2, k), y = z > 2.4 ? 0 : z > 1.9 ? lerp(0, 0.35, (2.4 - z) / 0.5) : z > 1.5 ? lerp(0.35, 0.7, (1.9 - z) / 0.4) : lerp(0.7, 1.16, (1.5 - z) / 0.3);
    o.root.position.copy(L(OTTO_X, Math.min(y, 1.16), z)); o.root.rotation.set(0, L.yaw + Math.PI, 0);
    if (k < 1) { o.pose('walk', ctx.t, { speed: 0.9 }); } else o.pose('idle', ctx.t);
    if (ctx.t > t0 + 0.1 && ctx.t < t0 + 1.3) { o.joints.armL.rotation.set(0, 0, 2.5 + 0.3 * Math.sin(ctx.t * 10)); o.joints.foreArmL.rotation.set(0, 0, 0.3 * Math.sin(ctx.t * 10)); o.joints.head.rotation.y = 0.8; }
    o.face('grin', 0.5);
    moveCam(ctx, { pos: L(OTTO_X - 4.4, 1.5, 2.15), look: L(OTTO_X + 0.3, 1.45, 3.9), fov: 50 }, { pos: L(OTTO_X - 3.8, 1.6, 2.2), look: L(OTTO_X + 0.3, 1.7, 2.6), fov: 48 }, ease.inOutSine(clamp(lt / 2.3, 0, 1)), 0);
  },
});
S({
  name: '12 seconds later', start: 'b05.w8-0.1', set: 'town',
  setup(ctx) {
    const L = dayTown(ctx); ctx.store.L = L;
    ctx.place('otto', L(OTTO_X, 1.16, 0.9));
    const P = ctx.props; ctx.add(P.beard, ctx.cast.otto.joints.head); P.beard.position.set(0, 0.12, 0.3); P.beard.rotation.set(0, 0, 0);
    bystanders(ctx, L, [[OTTO_X - 1.15, 3.7, -2.02], [OTTO_X + 1.15, 3.9, 2.02], [OTTO_X - 2.4, 5.6, -0.5]]);
  },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store, o = ctx.cast.otto;
    trainAt(ctx, L, OTTO_X, { t: ctx.t, door: 1, glow: 0.8, light: 0.2 });
    const t0 = ctx.time('b05.w8') + 0.05, k = clamp((ctx.t - t0) / 1.0, 0, 1);
    const z = lerp(0.9, 3.0, k), y = z < 1.5 ? 1.16 : z < 1.9 ? 0.7 : z < 2.3 ? 0.35 : 0;
    o.root.position.copy(L(OTTO_X, y, z)); o.root.rotation.set(0, L.yaw, 0);
    if (k < 1) o.pose('walk', ctx.t, { speed: 0.9 }); else o.pose('cheer', ctx.t, { intensity: 0.6 });
    o.face('grin', 0.5);
    moveCam(ctx, { pos: L(OTTO_X, 1.5, 9.2), look: L(OTTO_X, 1.6, 1.6), fov: 48 }, { pos: L(OTTO_X, 1.35, 8.4), look: L(OTTO_X, 1.35, 2.8), fov: 46 }, clamp(lt / 1.4, 0, 1), 0);
    stamp(ctx, '12 SECONDS LATER', ctx.time('b05.w8'), { size: 96, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.06, y: 0.2 });
  },
});
S({
  name: 'beard to the knees', start: 'b05.w13-0.1', set: 'town',
  setup(ctx) {
    const L = dayTown(ctx); ctx.store.L = L;
    ctx.place('otto', L(OTTO_X, 0, 3.0)); ctx.cast.otto.root.rotation.set(0, L.yaw + 0.2, 0);
    const P = ctx.props; ctx.add(P.beard, ctx.cast.otto.joints.head); P.beard.position.set(0, 0.12, 0.3);
  },
  update(ctx, lt) {
    const { L } = ctx.store, o = ctx.cast.otto;
    trainAt(ctx, L, OTTO_X, { t: ctx.t, door: 1, glow: 0.8, light: 0.2 });
    o.pose('idle', ctx.t, { intensity: 0.5 }); o.face('grin', 0.5);
    o.joints.armL.rotation.z += 0.5; o.joints.armR.rotation.z -= 0.5;
    const f = humanFace(o), knees = L(OTTO_X, 0.5, 3.3);
    const k = ease.inOutCubic(clamp((lt - 0.2) / 0.9, 0, 1));
    const look = f.clone().lerp(knees, k);
    setCam(ctx, { pos: L(OTTO_X + 0.9, lerp(1.4, 0.7, k), 5.6), look, fov: 38 }, 0);
    tag(ctx, 'TO THE KNEES', ctx.time('b05.w17'), Infinity, { y: 0.16 });
  },
});
// ── b06 "He says it was the best vacation of his life. He won't say where."  Park bench by day.
function benchRig(ctx) {
  const a = ctx.anchor('park.table'), pa = rel(a); pa.y -= 0.78; const F = frame(pa, yawOf(a)), P = ctx.props;
  ctx.add(P.bench); P.bench.position.copy(F(0, 0, 2.3)); P.bench.rotation.set(0, F.yaw, 0);
  const o = ctx.cast.otto; ctx.place('otto', F(0.35, 0, 2.4)); o.root.rotation.set(0, F.yaw, 0);
  ctx.add(P.beard, o.joints.head); P.beard.position.set(0, 0.1, 0.3); P.beard.rotation.set(-0.15, 0, 0);
  ctx.place('me', F(-0.75, 0, 2.95)); ctx.cast.me.root.rotation.set(0, F.yaw - 1.2, 0);
  return F;
}
function ottoShh(o, t, turn = 0) {
  o.pose('sit', t, { seatHeight: 0.5, hands: 'lap' });
  const J = o.joints;
  J.armR.rotation.set(-2.0, 0, 0.35); J.foreArmR.rotation.set(-1.75, 0, 0);
  J.head.rotation.y += 1.0 * turn; J.head.rotation.x += -0.1;
  o.face('smug', 1.0);
}
S({
  name: 'bench best vacation', start: 'b06-0.1', set: 'town',
  setup(ctx) { dayTown(ctx); ctx.store.F = benchRig(ctx); },
  update(ctx, lt) {
    const { F } = ctx.store, o = ctx.cast.otto, me = ctx.cast.me;
    ottoShh(o, ctx.t, 0);
    me.pose('peer', ctx.t, { intensity: 0.7 }); me.face('neutral', ctx.t);
    moveCam(ctx, { pos: F(-0.75, 1.5, 9.6), look: F(-0.35, 1.0, 2.6), fov: 38 }, { pos: F(-0.7, 1.45, 8.6), look: F(-0.35, 1.0, 2.6), fov: 36 }, clamp(lt / 2.4, 0, 1), 0);
    tag(ctx, 'BEST VACATION EVER', ctx.time('b06.w5'), Infinity, { y: 0.17, bg: 'rgba(255,122,47,0.92)' });
  },
});
S({
  name: "won't say where", start: 'b06.w10-0.1', set: 'town',
  setup(ctx) { dayTown(ctx); ctx.store.F = benchRig(ctx); },
  update(ctx, lt) {
    const { F } = ctx.store, o = ctx.cast.otto, me = ctx.cast.me;
    const turn = ease.inOutCubic(clamp((ctx.t - ctx.time('b06.w11')) / 0.35, 0, 1));
    ottoShh(o, ctx.t, turn);
    me.pose('peer', ctx.t, { intensity: 1 }); me.face(turn > 0.5 ? 'sad' : 'shocked', ctx.t);
    const k = ease.inOutSine(clamp(lt / 1.1, 0, 1));
    setCam(ctx, { pos: F(lerp(-1.95, -1.85, k), 1.6, lerp(4.7, 4.4, k)), look: F(0.25, 1.15, 2.4), fov: 40 }, 0);
    tag(ctx, 'WHERE?!', ctx.time('b06.w13'), Infinity, { y: 0.13, size: 80 });
  },
});
// ── b07 library  "Mrs. Lacey came back speaking only in rhymes. She's a librarian."
function libraryRig(ctx) {
  const set = ctx.set; set.setLighting?.('day'); set.set?.('window', 'day');
  const Rf = R(ctx), P = ctx.props, yaw = Rf.yaw;
  ctx.store.ticks = [];
  // bookcases along the walls (hide the bed), piles everywhere
  const cs = [[-2.05, -1.25, Math.PI / 2], [-2.05, 0.45, Math.PI / 2], [1.05, -1.82, 0], [2.05, 0.6, -Math.PI / 2]];
  P.cases.forEach((c, i) => { ctx.add(c); const [x, z, r] = cs[i]; c.position.copy(Rf(x, 0, z)); c.rotation.set(0, yaw + r, 0); });
  const ps = [[-1.4, 0.9], [-1.65, 1.5], [1.6, 1.4], [1.2, -0.8], [-0.6, -1.7], [1.75, -0.4]];
  P.piles.forEach((p, i) => { ctx.add(p); p.position.copy(Rf(ps[i][0], 0, ps[i][1])); p.rotation.set(0, yaw + i, 0); });
  ctx.add(P.desk); P.desk.position.copy(Rf(0.15, 0, -0.75)); P.desk.rotation.set(0, yaw, 0);
  ctx.add(P.piles[3]); P.piles[3].position.copy(Rf(0.62, 0.78, -0.75));
  ctx.add(P.libSign); P.libSign.position.copy(Rf(0.15, 2.65, -2.07)); P.libSign.rotation.set(0, yaw, 0);
  ctx.add(P.shhSign); P.shhSign.position.copy(Rf(-0.85, 2.55, -2.07)); P.shhSign.rotation.set(0, yaw, 0);
  ctx.add(P.lateSign); P.lateSign.position.copy(Rf(0.45, 1.05, -0.38)); P.lateSign.rotation.set(-0.1, yaw, 0);
  ctx.place('lacey', Rf(0.0, 0, -1.3)); ctx.cast.lacey.root.rotation.set(0, yaw, 0);
  return Rf;
}
function laceyWag(l, t, k = 1) {
  l.pose('idle', t, { intensity: 0.4 });
  const J = l.joints;
  J.armR.rotation.set(-2.2 * k, 0, 0.5 * k); J.foreArmR.rotation.set(-0.45 * k, 0, 0.3 * Math.sin(t * 9) * k);
  J.armL.rotation.z += 0.0; J.torso.rotation.x += 0.08 * k;
}
S({
  name: 'library wide', start: 'b07-0.1', set: 'library',
  setup(ctx) { ctx.store.R = libraryRig(ctx); ctx.place('me', ctx.store.R(0.8, 0, 1.2)); ctx.cast.me.root.rotation.set(0, ctx.store.R.yaw + Math.PI + 0.45, 0); },
  update(ctx, lt) {
    tick(ctx); const { R: Rf } = ctx.store, l = ctx.cast.lacey, me = ctx.cast.me;
    const tr = ctx.markers.rhymes;
    laceyWag(l, ctx.t, ctx.t > tr - 0.3 ? 1 : 0); l.face(ctx.t > tr ? 'smug' : 'smile', ctx.t);
    me.pose('idle', ctx.t); me.face('neutral', ctx.t);
    moveCam(ctx, { pos: Rf(-0.5, 2.4, 5.6), look: Rf(0.3, 1.2, -0.6), fov: 44 }, { pos: Rf(-0.4, 1.9, 4.4), look: Rf(0.3, 1.3, -0.7), fov: 42 }, ease.inOutSine(clamp(lt / 3.2, 0, 1)), 0);
    tag(ctx, 'ONLY RHYMES', tr, Infinity, { y: 0.28, bg: 'rgba(138,92,255,0.92)' });
  },
});
S({
  name: "she's a librarian", start: 'b07.w8-0.1', set: 'library',
  setup(ctx) { ctx.store.R = libraryRig(ctx); },
  update(ctx, lt) {
    tick(ctx); const { R: Rf } = ctx.store, l = ctx.cast.lacey;
    laceyWag(l, ctx.t, 1); l.face('smug', 1.2);
    const f = humanFace(l);
    moveCam(ctx, { pos: Rf(0.5, 1.75, 1.4), look: f.clone().add(up(-0.1)), fov: 36 }, { pos: Rf(0.45, 1.75, 0.8), look: f.clone().add(up(-0.05)), fov: 34 }, clamp(lt / 1.2, 0, 1), 0);
    tag(ctx, 'A LIBRARIAN', ctx.time('b07.w10'), Infinity, { y: 0.17 });
  },
});
// ── b08 quote card — Lacey wags her finger at the nervous kid holding a book
function kidWithBook(ctx, me, raise = 0) {
  const P = ctx.props; ctx.add(P.book, me.joints.handR); P.book.position.set(0.12, -0.1, 0.12); P.book.rotation.set(0, 0, 0);
}
function bookArms(me, raise = 0) {
  const J = me.joints;
  J.armR.rotation.set(lerp(-0.9, -1.9, raise), 0, lerp(0.35, 0.45, raise)); J.foreArmR.rotation.set(lerp(-0.9, -0.9, raise), 0, 0);
  J.armL.rotation.set(lerp(-0.9, -1.9, raise), 0, lerp(-0.35, -0.45, raise)); J.foreArmL.rotation.set(lerp(-0.9, -0.9, raise), 0, 0);
}
S({
  name: 'quote OTS', start: 'quoteLacey-0.06', set: 'library',
  setup(ctx) { const Rf = libraryRig(ctx); ctx.store.R = Rf; ctx.place('me', Rf(0.35, 0, 0.75)); ctx.cast.me.root.rotation.set(0, Rf.yaw + Math.PI + 0.25, 0); kidWithBook(ctx, ctx.cast.me); },
  update(ctx, lt) {
    tick(ctx); const { R: Rf } = ctx.store, l = ctx.cast.lacey, me = ctx.cast.me;
    laceyWag(l, ctx.t, 1); l.face('determined', ctx.t);
    me.pose('idle', ctx.t, { intensity: 0.4 }); bookArms(me, 0.35); me.face('sweat', ctx.t);
    moveCam(ctx, { pos: Rf(-0.15, 1.45, 2.75), look: humanFace(l).add(up(0.3)), fov: 42 }, { pos: Rf(-0.12, 1.45, 2.45), look: humanFace(l).add(up(0.28)), fov: 41 }, clamp(lt / 2.8, 0, 1), 0.6);
    quoteCard(ctx, 'This book is late, and that’s a crime. Return it now, or pay a dime.', 'Mrs. Lacey', ctx.markers.quoteLacey, ctx.time('b08.end') + 0.15, { y: 0.3, size: 72, byAt: ctx.markers.quoteLacey + 0.5 });
  },
});
S({
  name: 'quote nervous kid', start: 'b08.w8-0.05', set: 'library',
  setup(ctx) { const Rf = libraryRig(ctx); ctx.store.R = Rf; ctx.place('me', Rf(0.35, 0, 0.75)); ctx.cast.me.root.rotation.set(0, Rf.yaw + Math.PI, 0); kidWithBook(ctx, ctx.cast.me); },
  update(ctx, lt) {
    tick(ctx); const { R: Rf } = ctx.store, l = ctx.cast.lacey, me = ctx.cast.me;
    laceyWag(l, ctx.t, 1); l.face('determined', ctx.t);
    me.pose('idle', ctx.t, { intensity: 0.4 }); bookArms(me, 0.3); me.face('sweat', ctx.t);
    const f = humanFace(me);
    setCam(ctx, { pos: Rf(-0.35, 1.95, -1.8), look: f.clone().add(up(0.05)), fov: 36 }, 1.4, '#fff0dc');
    ctx.cam.shake(0.03, ctx.t, 7);
    quoteCard(ctx, 'This book is late, and that’s a crime. Return it now, or pay a dime.', 'Mrs. Lacey', ctx.markers.quoteLacey, ctx.time('b08.end') + 0.15, { y: 0.3, size: 72, byAt: ctx.markers.quoteLacey + 0.5 });
  },
});
// ── b09 "It's a problem."  The kid backs out, book up like a shield.
S({
  name: 'backs out', start: 'b09-0.1', set: 'library',
  setup(ctx) { const Rf = libraryRig(ctx); ctx.store.R = Rf; ctx.place('me', Rf(0.35, 0, 0.75)); kidWithBook(ctx, ctx.cast.me); },
  update(ctx, lt) {
    tick(ctx); const { R: Rf } = ctx.store, l = ctx.cast.lacey, me = ctx.cast.me;
    laceyWag(l, ctx.t, 1); l.face('determined', ctx.t);
    const z = 0.75 + 0.9 * lt;
    me.root.position.copy(Rf(0.35, 0, z)); me.root.rotation.set(0, Rf.yaw + Math.PI, 0);
    me.pose('walk', -ctx.t, { speed: 0.8 }); bookArms(me, 1); me.face('sweat', ctx.t);
    setCam(ctx, { pos: Rf(-0.85, 1.7, -1.85), look: Rf(0.35, 1.2, 1.2), fov: 42 }, 0.8, '#fff0dc');
    tag(ctx, 'IT’S A PROBLEM', ctx.time('b09.w1'), Infinity, { y: 0.17, bg: 'rgba(200,0,40,0.9)' });
  },
});
// ── b10 "So the rule is simple. When the train stops, you stay inside, and you don't look."
function curtainRig(ctx, L) {
  const A = ctx.set.anchors.houses || [];
  const picks = [[0, 0], [0, 1], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
  const out = [];
  picks.forEach(([hi, wj], k) => {
    const h = A[hi]; if (!h || !h.windows[wj]) return;
    const c = ctx.props.curtains[k]; ctx.add(c);
    const a = h.windows[wj]; a.updateWorldMatrix(true, false);
    c.position.copy(rel(a, [0, 0, -0.18])); c.rotation.set(0, yawOf(a), 0); c.scale.setScalar(0.95);
    c.userData.hk = h.index; c.userData.wk = wj; c.userData.k = k;
    out.push(c);
  });
  return out;
}
const CURTAIN_T = [0.2, 1.2, 0.5, 1.5, 0.85, 0.65, 1.75, 1.0];
S({
  name: 'curtains close', start: 'b10-0.1', set: 'town',
  setup(ctx) { const L = nightTown(ctx, { glow: 0.0, fogA: 0.7 }); ctx.store.L = L; ctx.store.cur = curtainRig(ctx, L); },
  update(ctx, lt) {
    tick(ctx); const { L, cur } = ctx.store;
    const t0 = ctx.time('b10') + 0.3, set = ctx.set;
    const shut = new Map();   // "house:window" → time its curtain finishes closing
    cur.forEach((c) => { const tk = t0 + CURTAIN_T[c.userData.k] * 1.15; c.userData.set(ease.inOutCubic(clamp((ctx.t - tk) / 0.4, 0, 1)), 1); shut.set(c.userData.hk + ':' + c.userData.wk, tk + 0.4); });
    // every other window up and down the street switches off one by one too
    set.set?.('windowGlow', (hi, wj) => { const ts = shut.get(hi + ':' + wj) ?? (t0 + 0.1 + 2.1 * hash(hi * 7.3 + wj * 3.1)); return ctx.t < ts ? 0.95 : 0; });
    const cold = clamp((ctx.t - t0) / 2.2, 0, 1);
    set.exposure = lerp(1.12, 0.82, cold);
    if (set.fog) set.fog.color.set('#1a2c3e').lerp(new THREE.Color('#0c1a33'), cold);
    lampGlows(ctx, L, null, lerp(0.8, 0.45, cold));
    moveCam(ctx, { pos: L(-3, 3.2, 3.5), look: L(-26, 3.0, -10), fov: 50 }, { pos: L(-3.6, 3.0, 3.2), look: L(-26, 3.0, -10), fov: 48 }, clamp(lt / 2.5, 0, 1), 0.4, '#a8c0ff');
    ctx.fx.overlay('#0a1a40', 0.12 * cold);
    tag(ctx, 'THE RULE', ctx.time('b10.w2'), Infinity, { y: 0.16, bg: 'rgba(200,0,40,0.9)' });
  },
});
function bedroomRig(ctx, { white = 1 } = {}) {
  const set = ctx.set; set.setLighting?.('night'); set.set?.('window', 'dark');
  const Rf = R(ctx), P = ctx.props; ctx.store.ticks = [];
  const w = ctx.anchor('room.window'); w.updateWorldMatrix(true, false);
  ctx.add(P.whiteWin); P.whiteWin.position.copy(rel(w, [0, 0, -0.02])); P.whiteWin.rotation.set(0, yawOf(w), 0); P.whiteWin.scale.set(1, 1, 1);
  ctx.add(P.whiteGlow); P.whiteGlow.position.copy(rel(w, [0, 0, 0.3]));
  P.whiteWin.material.color.setScalar(white); P.whiteGlow.material.opacity = 0.9 * white;
  return Rf;
}
S({
  name: 'blanket over head', start: 'b10.w9-0.1', set: 'bedroom',
  setup(ctx) {
    const Rf = bedroomRig(ctx); ctx.store.R = Rf;
    const b = ctx.anchor('room.bed'), Fb = frame(rel(b), yawOf(b)); ctx.store.Fb = Fb;
    ctx.place('me', Fb(0, -0.02, -0.4)); ctx.cast.me.root.rotation.set(0, Fb.yaw, 0);
    const P = ctx.props; ctx.add(P.blanket); P.blanket.rotation.set(0, Fb.yaw, 0);
    const w = ctx.anchor('room.window'); w.updateWorldMatrix(true, false);
    ctx.add(P.winLight); P.winLight.position.copy(rel(w, [0, -0.1, 0.6]));
  },
  update(ctx, lt) {
    const { R: Rf, Fb } = ctx.store, me = ctx.cast.me, P = ctx.props;
    me.pose('sit', ctx.t, { seated: true, seatHeight: 0.02, intensity: 0.3, hands: 'lap' });
    const tl = ctx.time('b10.w14') - 0.1, k = ease.inOutCubic(clamp((ctx.t - tl) / 0.35, 0, 1));
    me.face(k > 0 ? 'shocked' : 'sweat', 0.4);
    me.joints.armL.rotation.x += -0.5 * k; me.joints.armR.rotation.x += -0.5 * k;
    // blanket: a soft lump that rises from the lap until only his eyes and hair peek out
    const base = Fb(0, 0.0, lerp(0.3, -0.38, k));
    const eyes = humanFace(me).y - 0.12 - base.y;
    P.blanket.position.copy(base); P.blanket.scale.set(lerp(1.4, 1.05, k), Math.max(0.05, lerp(0.22, eyes / 0.5, k)), lerp(1.5, 1.15, k));
    const flick = 0.75 + 0.25 * Math.sin(ctx.t * 23) * Math.sin(ctx.t * 7) + 0.1 * (hash(Math.floor(ctx.t * 14)) > 0.7 ? 1 : 0);
    P.whiteWin.material.color.setScalar(Math.min(1, flick)); P.whiteGlow.material.opacity = 0.9 * flick;
    P.winLight.intensity = 14 * flick;
    setCam(ctx, { pos: Rf(0.9, 1.6, 1.9), look: Fb(0, 0.75, -0.3), fov: 44 }, 0.15);
    ctx.fx.overlay('#dfe8ff', 0.05 * flick);
    tag(ctx, "DON'T LOOK", ctx.time('b10.w15'), Infinity, { y: 0.16, bg: 'rgba(200,0,40,0.9)' });
  },
});
// ── b11 "Last night it stopped outside my house. And my cat walked right on board."
S({
  name: 'POV from window', start: 'b11-0.1', set: 'town',
  setup(ctx) { const L = nightTown(ctx, { fogA: 0.8 }); ctx.store.L = L; },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store;
    trainAt(ctx, L, TRAIN_STOP, { t: ctx.t, door: 1 });
    lampGlows(ctx, L, null);
    const w = ctx.anchor('myHouse.window'); w.updateWorldMatrix(true, false);
    const k = ease.inOutSine(clamp(lt / 2.2, 0, 1));
    const pos = rel(w, [0.3, 0.1, lerp(-0.25, 0.05, k)]), look = L(TRAIN_STOP - 1.4, 1.0, 1.6).add(up(lerp(0.3, 0, k)));
    ctx.cam.set({ pos, look, fov: 42 }); fill(ctx, pos, 0.2);
    const fr = ctx.props.povFrame, dir = look.clone().sub(pos).normalize();
    ctx.add(fr); fr.position.copy(pos).addScaledVector(dir, 0.6); fr.up.set(0, 1, 0); fr.lookAt(pos);
    ctx.fx.draw((g, W, H) => { const gr = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.62); gr.addColorStop(0, 'rgba(0,0,10,0)'); gr.addColorStop(1, 'rgba(0,0,10,0.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    ctx.fx.text('POV: MY WINDOW', { x: 0.5, y: 0.12, size: 48, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.7)', rot: -0.02 });
  },
});
S({
  name: 'cat walks aboard', start: 'b11.w7-0.1', set: 'town',
  setup(ctx) { const L = nightTown(ctx, { fogA: 0.7 }); ctx.store.L = L; ctx.place('cat', L(TRAIN_STOP + 0.15, 0, 5.0)); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store, c = ctx.cast.cat;
    trainAt(ctx, L, TRAIN_STOP, { t: ctx.t, door: 1 });
    lampGlows(ctx, L, null);
    const t0 = ctx.time('b11.w7'), tb = ctx.time('b11.w13') - 0.15;
    const k = clamp((ctx.t - t0) / (tb - t0), 0, 1);
    let z = lerp(5.0, 2.2, k), y = 0;
    const kh = clamp((ctx.t - tb) / 0.45, 0, 1);
    if (kh > 0) { z = lerp(2.2, 0.8, kh); y = 1.16 * ease.outCubic(kh) + 0.25 * Math.sin(Math.PI * kh); }
    c.root.position.copy(L(TRAIN_STOP + 0.15, y, z)); c.root.rotation.set(0, L.yaw + Math.PI, 0);
    if (kh > 0) c.pose('hop', ctx.t, { u: kh, height: 0.01 }); else catWalk(c, ctx.t, 1.1);
    c.face('neutral', ctx.t);
    const cp = L(TRAIN_STOP + 0.15, 0.3, z);
    const cz = Math.max(z, 2.2); setCam(ctx, { pos: L(TRAIN_STOP + 1.1, 0.55, cz + 2.4), look: L(TRAIN_STOP, 0.75, cz - 1.2), fov: 44 }, 0.6);
  },
});
// ── b12 HUSS ×6 — the kid's face pressed to his window ↔ the train door sliding shut
function kidAtWindow(ctx) {
  const w = ctx.anchor('myHouse.window'); w.updateWorldMatrix(true, false);
  const me = ctx.cast.me;
  ctx.place('me', rel(w, [0, -1.74, -0.52])); me.root.rotation.set(0, yawOf(w), 0);
  return w;
}
function pressPose(me, t) {
  me.pose('idle', t, { intensity: 0.2 });
  const J = me.joints;
  J.armL.rotation.set(-2.5, 0, -0.55); J.foreArmL.rotation.set(-0.5, 0, 0);
  J.armR.rotation.set(-2.5, 0, 0.55); J.foreArmR.rotation.set(-0.5, 0, 0);
}
[0, 1, 2, 3, 4, 5].forEach((i) => S({
  name: `window/door #${i + 1}`, start: i === 0 ? 'b12.h0-0.12' : `b12.h${i}-0.03`, set: 'town',
  setup(ctx) { const L = nightTown(ctx, { fogA: 0.7 }); ctx.store.L = L; if (i % 2 === 0) ctx.store.w = kidAtWindow(ctx); },
  update(ctx) {
    tick(ctx); const { L, w } = ctx.store;
    const hits = ctx.hussTimes('b12').map((h) => h + 0.03), n = hits.filter((h) => h <= ctx.t).length, h = lastBefore(hits, ctx.t);
    const door = lerp(1, 0.32, ease.outCubic(clamp((n - 1 + clamp((ctx.t - (h ?? 0)) / 0.15, 0, 1)) / 6, 0, 1)));
    trainAt(ctx, L, TRAIN_STOP, { t: ctx.t, door });
    lampGlows(ctx, L, null);
    if (i % 2 === 0) {
      const me = ctx.cast.me; pressPose(me, ctx.t); me.face('shocked', 0.4);
      const d = [3.2, 2.4, 1.7][i / 2];
      const f = humanFace(me);
      const pos = rel(w, [0.25 * (i / 2 - 1), 0.0, d]);
      setCam(ctx, { pos, look: f.clone().add(up(-0.25)), fov: 34 }, 1.2, '#dde6ff');
    } else {
      const cams = [{ pos: L(TRAIN_STOP + 2.6, 1.0, 5.6), look: L(TRAIN_STOP, 1.9, DOOR_Z), fov: 40 }, { pos: L(TRAIN_STOP - 1.8, 0.6, 4.4), look: L(TRAIN_STOP, 2.0, DOOR_Z), fov: 44 }, { pos: L(TRAIN_STOP + 1.6, 1.6, 5.4), look: L(TRAIN_STOP, 2.0, DOOR_Z), fov: 40 }][(i - 1) / 2];
      setCam(ctx, cams, 0.4);
    }
    ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
  },
}));
// ── b13 "I grabbed my backpack and dove through the doors right before they closed."
S({
  name: 'grab backpack', start: 'b13-0.1', set: 'bedroom',
  setup(ctx) {
    const Rf = bedroomRig(ctx); ctx.store.R = Rf;
    ctx.place('me', Rf(-0.6, 0, -1.2)); const P = ctx.props; ctx.add(P.backpack);
  },
  update(ctx, lt) {
    const { R: Rf } = ctx.store, me = ctx.cast.me, P = ctx.props;
    const tg = ctx.time('b13.w1'), k = ease.inOutCubic(clamp((ctx.t - tg) / 0.35, 0, 1));
    const turn = ease.inOutCubic(clamp((ctx.t - (tg - 0.25)) / 0.3, 0, 1));
    me.root.rotation.set(0, Rf.yaw + lerp(Math.PI, Math.PI * 0.35, turn), 0);
    const run = clamp((ctx.t - (tg + 0.35)) / 0.6, 0, 1);
    me.root.position.copy(Rf(lerp(-0.6, 0.6, run), 0, lerp(-1.2, 1.0, run)));
    if (run > 0) me.pose('walk', ctx.t, { speed: 2.4 }); else me.pose('surprised', ctx.t, { intensity: 0.6 });
    me.face('determined', ctx.t);
    // backpack: from the bed onto his back
    me.root.updateMatrixWorld(true);
    const onBack = me.joints.torso.localToWorld(V(0, 0.25, -0.32));
    const bedP = Rf(-1.95, 0.75, -0.6);
    P.backpack.position.copy(bedP.clone().lerp(onBack, k).add(up(0.5 * Math.sin(Math.PI * k))));
    P.backpack.rotation.set(0, me.root.rotation.y, 0);
    setCam(ctx, { pos: Rf(1.6, 1.6, 2.8), look: Rf(-1.0, 1.0, -0.8), fov: 48 }, 0.3);
    ctx.fx.overlay('#dfe8ff', 0.04);
  },
});
S({
  name: 'sprint across', start: 'b13.w4-0.1', set: 'town',
  setup(ctx) {
    const L = nightTown(ctx, { fogA: 0.9 }); ctx.store.L = L;
    ctx.place('me', L(TRAIN_STOP + 0.3, CURB, 8.0));
    const P = ctx.props; ctx.add(P.backpack, ctx.cast.me.joints.torso); P.backpack.position.set(0, 0.25, -0.32); P.backpack.rotation.set(0, 0, 0);
  },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store, me = ctx.cast.me;
    const t0 = ctx.time('b13.w4'), k = clamp((ctx.t - t0) / 1.15, 0, 1);
    trainAt(ctx, L, TRAIN_STOP, { t: ctx.t, door: lerp(0.32, 0.22, k) });
    lampGlows(ctx, L, null);
    const kz = lerp(8.0, 2.6, k), ky = kz > 5.15 ? CURB : 0;
    me.root.position.copy(L(TRAIN_STOP + 0.3, ky, kz)); me.root.rotation.set(0, L.yaw + Math.PI, 0);
    me.pose('walk', ctx.t, { speed: 2.6 }); me.joints.torso.rotation.x += 0.25; me.face('determined', ctx.t);
    setCam(ctx, { pos: L(TRAIN_STOP + 6.2, 1.3, 6.8), look: L(TRAIN_STOP + 0.3, 1.2, kz - 0.4), fov: 46 }, 1.0);
  },
});
const diveQ = (() => { const m = new THREE.Matrix4().makeBasis(V(-1, 0, 0), V(0, 0, -1), V(0, -1, 0)); return new THREE.Quaternion().setFromRotationMatrix(m); })();
S({
  name: 'dive through doors', start: 'b13.w9-0.1', set: 'town',
  setup(ctx) {
    const L = nightTown(ctx, { fogA: 0.8 }); ctx.store.L = L;
    ctx.place('me', L(TRAIN_STOP, 0, 3.2));
    const P = ctx.props; ctx.add(P.backpack, ctx.cast.me.joints.torso); P.backpack.position.set(0, 0.25, -0.32); P.backpack.rotation.set(0, 0, 0);
  },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store, me = ctx.cast.me;
    const t0 = ctx.time('b13.w9') - 0.05, tc = ctx.time('b13.w12');
    const k = clamp((ctx.t - t0) / (tc - 0.12 - t0), 0, 1);
    const door = ctx.t < tc - 0.15 ? 0.24 : lerp(0.24, 0, ease.inCubic(clamp((ctx.t - (tc - 0.15)) / 0.15, 0, 1)));
    trainAt(ctx, L, TRAIN_STOP, { t: ctx.t, door, steps: door > 0.01 ? 1 : 0 });
    lampGlows(ctx, L, null);
    // the dive: horizontal, head first toward −z, arcing up into the doorway
    const z = lerp(3.4, -0.3, ease.inQuad(k)), y = lerp(0.9, 1.75, k) + 0.5 * Math.sin(Math.PI * k);
    me.root.visible = k < 0.97;
    me.root.position.copy(L(TRAIN_STOP, y, z));
    const qy = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), L.yaw);
    const qUp = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), L.yaw + Math.PI);
    me.root.quaternion.copy(qUp).slerp(qy.clone().multiply(diveQ), clamp(k * 3, 0, 1));
    me.pose('surprised', ctx.t, { intensity: 0.3 });
    me.joints.armL.rotation.set(-3.0, 0, -0.15); me.joints.armR.rotation.set(-3.0, 0, 0.15);
    me.face('determined', ctx.t);
    setCam(ctx, { pos: L(TRAIN_STOP + 3.6, 1.6, 5.0), look: L(TRAIN_STOP + 0.2, 2.0, 1.8), fov: 42 }, 1.0);
    if (ctx.t > tc) { stamp(ctx, 'SLAM!', tc, { size: 150, fill: '#ffffff', stroke: '#1d1d22', rot: 0.08 }); ctx.cam.shake(0.4 * Math.exp(-(ctx.t - tc) * 5), ctx.t, 12); }
  },
});
// ── b14 "Inside, every window showed a different version of our town."
S({
  name: 'carriage reveal', start: 'b14-0.1', set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; ctx.place('me', C(-3.5, 0, -0.3)); ctx.cast.me.root.rotation.set(0, C.yaw + Math.PI / 2, 0);
    const P = ctx.props; ctx.add(P.backpack, ctx.cast.me.joints.torso); P.backpack.position.set(0, 0.25, -0.32); },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, me = ctx.cast.me;
    me.pose('idle', ctx.t, { headYaw: 0.7 * Math.sin(lt * 1.4), headPitch: -0.05 }); me.face('shocked', 0.4);
    moveCam(ctx, { pos: C(-9.5, 2.3, -0.95), look: C(1.5, 1.0, 0.45), fov: 62 }, { pos: C(-8.9, 2.2, -0.85), look: C(1.5, 1.05, 0.4), fov: 58 }, ease.inOutSine(clamp(lt / 3, 0, 1)), 0.6, '#ffe2b0');
  },
});
// ── b15 "One with dinosaurs. One underwater. One where everyone is a pigeon."
/** One continuous dolly along a wall of windows: keys = [[time, windowX], ...] (the camera holds on each window at its time). */
function trackX(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, xa] = keys[i], [tb, xb] = keys[i + 1];
    if (t <= tb) { const u = clamp((t - ta) / (tb - ta), 0, 1); return lerp(xa, xb, ease.inOutCubic(u)); }
  }
  const [tl, xl] = keys[keys.length - 1]; return xl + 0.12 * (t - tl);
}
function trackShot(name, start, side, keysFn, extra = {}) {
  return S({
    name, start, set: 'cab',
    setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; extra.setup?.(ctx, C); },
    update(ctx, lt) {
      tick(ctx); const { C } = ctx.store;
      const x = trackX(keysFn(ctx), ctx.t);
      setCam(ctx, { pos: C(x - 0.15, 1.6, -side * 0.85), look: C(x + 0.1, 1.42, side * 3.0), fov: 40 }, 0.5, '#ffe2b0');
      extra.update?.(ctx, C, x);
    },
  });
}
const PIG_IDS = ['pig1', 'pig2', 'pig3', 'pig4'];
trackShot('windows: dino → water → pigeons', 'b15-0.1', -1, (ctx) => {
  const m = ctx.markers, dx = ctx.set.view('dino').x, wx = ctx.set.view('water').x, px = ctx.set.view('pigeons').x;
  return [[ctx.time('b15') - 0.1, dx - 0.55], [m.dino - 0.15, dx], [m.dino + 0.45, dx + 0.1], [m.water - 0.15, wx], [m.water + 0.75, wx + 0.1], [m.pigeons - 0.15, px]];
}, {
  setup(ctx, C) {
    const v = ctx.set.view('pigeons'), sp = v.v.userData.spots;
    PIG_IDS.forEach((id, k) => {
      const o = sp['p' + k]; o.updateWorldMatrix(true, false);
      ctx.place(id, rel(o), { scale: 1.6 }); ctx.cast[id].root.rotation.set(0, C.yaw + (v.side < 0 ? 0 : Math.PI) + (k - 1.5) * 0.25, 0);
      const hat = ctx.props.pigHats[k]; ctx.add(hat, ctx.cast[id].joints.head); hat.position.set(0, 0.135, -0.005); hat.rotation.set(-0.1, 0, 0.12 * (k % 2 ? -1 : 1));
    });
  },
  update(ctx) {
    PIG_IDS.forEach((id, k) => { const p = ctx.cast[id]; p.pose(k === 3 ? 'strut' : k === 1 ? 'peck' : 'idle', ctx.t + k); p.face(k === 2 ? 'smug' : 'neutral', ctx.t + k); });
    const m = ctx.markers;
    ctx.cam.punch([m.dino, m.water, m.pigeons], ctx.t, 0.08, 0.25);
    tag(ctx, 'DINOSAURS', m.dino, m.water - 0.35, { y: 0.16, bg: 'rgba(60,160,60,0.92)' });
    tag(ctx, 'UNDERWATER', m.water, m.pigeons - 0.35, { y: 0.16, bg: 'rgba(30,110,220,0.92)' });
    tag(ctx, 'PIGEON TOWN', m.pigeons, Infinity, { y: 0.16, bg: 'rgba(110,110,130,0.92)' });
  },
});
// ── b16 "And at the very back, in a tiny conductor's hat, eating a sandwich... my cat."
S({
  name: 'to the back', start: 'b16-0.1', set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; seatCat(ctx, C); ctx.place('me', C(-3.0, 0, 0.55)); const P = ctx.props; ctx.add(P.backpack2, ctx.cast.me.joints.torso); P.backpack2.position.set(0, 0.25, -0.32); },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    catEat(c, ctx.t, { expr: 'neutral' });
    const x = -3.0 - 1.1 * lt;
    me.root.position.copy(C(x, 0, 0.55)); me.root.rotation.set(0, C.yaw - Math.PI / 2, 0);
    me.pose('walk', ctx.t, { speed: 0.7 }); me.face('neutral', ctx.t);
    moveCam(ctx, { pos: C(1.0, 1.8, -0.65), look: C(-8.6, 0.9, -0.85), fov: 40 }, { pos: C(-1.2, 1.6, -0.65), look: C(-8.6, 0.9, -0.9), fov: 34 }, ease.inOutSine(clamp(lt / 1.3, 0, 1)), 0.5, '#ffe2b0');
  },
});
S({
  name: 'cap and sandwich', start: 'b16.w7-0.1', set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; seatCat(ctx, C); },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, c = ctx.cast.catW, P = ctx.props;
    catEat(c, ctx.t, { expr: 'neutral' });
    c.root.updateMatrixWorld(true);
    const capP = P.cap.getWorldPosition(V()).add(up(0.03)), sw = P.sandwich.getWorldPosition(V());
    const ts = ctx.time('b16.w10');   // "eating"
    const k = ease.inOutCubic(clamp((ctx.t - ts + 0.2) / 0.7, 0, 1));
    const look = capP.clone().lerp(sw, k);
    const cp = C(CAT_SEAT[0] + 1.25, lerp(1.25, 0.95, k), CAT_SEAT[2] + 0.35);
    setCam(ctx, { pos: cp, look, fov: lerp(28, 30, k) }, 0.8, '#ffe2b0');
    tag(ctx, 'TINY HAT', ctx.time('b16.w9') - 0.1, ts - 0.1, { y: 0.16, bg: 'rgba(31,42,82,0.92)' });
    tag(ctx, 'SANDWICH', ts + 0.3, Infinity, { y: 0.16, bg: 'rgba(232,162,58,0.92)' });
  },
});
S({
  name: 'MY CAT', start: 'conductor-0.06', set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; seatCat(ctx, C); },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, c = ctx.cast.catW;
    const cp = C(CAT_SEAT[0] + 1.35, 1.0, CAT_SEAT[2] + 0.1);
    catEat(c, ctx.t, { expr: 'smug', head: cp });
    setCam(ctx, { pos: cp, look: catFace(c).add(up(0.14)), fov: 38 }, 0.8, '#ffe2b0');
    ctx.cam.punch([ctx.markers.conductor], ctx.t, 0.14, 0.3);
    stamp(ctx, 'MY CAT?!', ctx.markers.conductor, { size: 140, fill: '#ffd23f', stroke: '#1d1d22' });
  },
});
// ── b17 "He looked at me like I was the one who was late."
S({
  name: 'cat squint', start: 'b17-0.1', set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; seatCat(ctx, C); },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, c = ctx.cast.catW;
    const cp = C(CAT_SEAT[0] + 1.1, 0.95, CAT_SEAT[2] + 0.05);
    catEat(c, ctx.t, { chew: 0, expr: lt > 0.5 ? 'squint' : 'neutral', head: cp });
    const f = catFace(c);
    moveCam(ctx, { pos: cp, look: f, fov: 32 }, { pos: cp.clone().lerp(f, 0.35), look: f, fov: 30 }, ease.inOutSine(clamp(lt / 1.2, 0, 1)), 0.8, '#ffe2b0');
  },
});
function kidFacingCat(ctx, C) {
  ctx.place('me', C(CAT_SEAT[0] + 1.6, 0, CAT_SEAT[2] + 0.6)); ctx.cast.me.root.rotation.set(0, C.yaw - Math.PI / 2 - 0.45, 0);
  const P = ctx.props; ctx.add(P.backpack2, ctx.cast.me.joints.torso); P.backpack2.position.set(0, 0.25, -0.32);
}
S({
  name: 'kid stares back', start: 'b17.w5-0.1', set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; seatCat(ctx, C); kidFacingCat(ctx, C); },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, c = ctx.cast.catW, me = ctx.cast.me;
    catEat(c, ctx.t, { chew: 0, expr: 'squint', head: humanFace(me) });
    me.pose('idle', ctx.t, { intensity: 0.3, lookAt: catFace(c) }); me.face('neutral', 0.5);
    const f = humanFace(me);
    setCam(ctx, { pos: C(CAT_SEAT[0] - 0.12, 1.2, CAT_SEAT[2] + 0.42), look: f.clone().add(up(-0.08)), fov: 40 }, 0.9, '#ffe2b0');
    tag(ctx, 'LATE?!', ctx.time('b17.w11'), Infinity, { y: 0.1 });
  },
});
// ── b18 HUSS ×3 — staredown
[0, 1, 2].forEach((i) => S({
  name: `staredown #${i + 1}`, start: i === 0 ? 'b18.h0-0.12' : `b18.h${i}-0.03`, set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; seatCat(ctx, C); kidFacingCat(ctx, C); },
  update(ctx) {
    tick(ctx); const { C } = ctx.store, c = ctx.cast.catW, me = ctx.cast.me;
    const hits = ctx.hussTimes('b18').map((h) => h + 0.03);
    catEat(c, ctx.t, { chew: 0, expr: 'squint', head: humanFace(me) });
    me.pose('idle', ctx.t, { intensity: 0.3, lookAt: catFace(c) }); me.face(i === 1 ? 'determined' : 'neutral', 0.5);
    const dx = C(1, 0, 0).sub(C(0, 0, 0)), dz = C(0, 0, 1).sub(C(0, 0, 0));
    if (i === 0) { const f = catFace(c); setCam(ctx, { pos: f.clone().addScaledVector(dx, 1.0).addScaledVector(dz, 0.12).add(up(0.04)), look: f.clone().add(up(-0.1)), fov: 34 }, 0.8, '#ffe2b0'); }
    else if (i === 1) { const f = humanFace(me); setCam(ctx, { pos: C(CAT_SEAT[0] + 0.12, 1.2, CAT_SEAT[2] + 0.48), look: f.clone().add(up(-0.13)), fov: 31 }, 0.9, '#ffe2b0'); }
    else { const f = catFace(c); setCam(ctx, { pos: f.clone().addScaledVector(dx, 0.8).addScaledVector(dz, 0.28).add(up(0.06)), look: f.clone().add(up(-0.07)), fov: 30 }, 0.8, '#ffe2b0'); }
    ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
  },
}));
// ── b19 "Then the windows got closer to home. My street. My house. A different kid in my bed. And my cat would not come."
S({
  name: 'windows closer to home', start: 'b19-0.1', set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; ctx.place('me', C(-7.5, 0, 0.35)); const P = ctx.props; ctx.add(P.backpack2, ctx.cast.me.joints.torso); P.backpack2.position.set(0, 0.25, -0.32);
    ctx.set.lights.hemi.intensity = 0.8; },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, me = ctx.cast.me;
    const x = -7.5 + 1.4 * lt;
    me.root.position.copy(C(x, 0, 0.35)); me.root.rotation.set(0, C.yaw + Math.PI / 2, 0);
    me.pose('walk', ctx.t, { speed: 0.8, headYaw: -1.0 }); me.face('neutral', ctx.t);
    setCam(ctx, { pos: C(x + 3.6, 1.8, -1.1), look: C(x - 0.8, 1.35, 1.3), fov: 46 }, 0.5, '#ffe2b0');
  },
});
trackShot('windows: street → house → other kid', 'b19.w7-0.1', 1, (ctx) => {
  const sx = ctx.set.view('street').x, hx = ctx.set.view('house').x, bx = ctx.set.view('bedroom').x;
  return [[ctx.time('b19.w7') - 0.1, sx - 0.4], [ctx.time('b19.w7') + 0.1, sx], [ctx.time('b19.w8') + 0.1, sx + 0.1], [ctx.time('b19.w9') + 0.05, hx], [ctx.time('b19.w10') + 0.1, hx + 0.1], [ctx.markers.otherkid - 0.25, bx]];
}, {
  setup(ctx) {
    const v = ctx.set.view('bedroom'), o = v.v.userData.spots.bed; o.updateWorldMatrix(true, false);
    const s = ctx.cast.sleeper; ctx.place('sleeper', rel(o)); s.root.rotation.set(0, yawOf(o) + 0.25, 0);
  },
  update(ctx) {
    const s = ctx.cast.sleeper; s.pose('sit', ctx.t, { seated: true, seatHeight: 0.02, intensity: 0.2, hands: 'lap', headPitch: 0.25, headYaw: 0.2 }); s.face('sleepy', 1.0);
    ctx.cam.punch([ctx.time('b19.w7'), ctx.time('b19.w9'), ctx.markers.otherkid], ctx.t, 0.07, 0.25);
    tag(ctx, 'MY STREET', ctx.time('b19.w7'), ctx.time('b19.w9') - 0.3, { y: 0.16, bg: 'rgba(47,77,138,0.92)' });
    tag(ctx, 'MY HOUSE', ctx.time('b19.w9'), ctx.markers.otherkid - 0.3, { y: 0.16, bg: 'rgba(47,77,138,0.92)' });
    if (ctx.t > ctx.markers.otherkid) { glitch(ctx, ctx.markers.otherkid, 0.4, 1); ctx.fx.overlay('#2a1050', 0.12); }
    tag(ctx, 'NOT ME', ctx.time('b19.w13'), Infinity, { y: 0.16, bg: 'rgba(90,40,140,0.92)' });
  },
});
S({
  name: 'cat would not come', start: 'b19.w17-0.1', set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; seatCat(ctx, C, { sandwich: false }); kidFacingCat(ctx, C); ctx.set.lights.hemi.intensity = 0.9; },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, c = ctx.cast.catW, me = ctx.cast.me;
    const th = ctx.time('b19.w20') - 0.1;
    const back = ease.outCubic(clamp((ctx.t - th) / 0.4, 0, 1));
    c.root.position.copy(C(CAT_SEAT[0] - 0.12 * back, CAT_SEAT[1], CAT_SEAT[2] - 0.0));
    c.pose(back > 0 ? 'stare' : 'sit', ctx.t, { lookAt: humanFace(me) }); c.face(back > 0 ? 'huss' : 'squint', 0.4);
    c.joints.torso.rotation.x += -0.2 * back; if (c.joints.tail1) c.joints.tail1.rotation.x = -1.2 * back;
    me.root.position.copy(C(-7.0, 0, -0.2)); me.root.rotation.set(0, C.yaw - Math.PI / 2 - 0.55, 0);
    me.pose('idle', ctx.t, { intensity: 0.3, lookAt: catFace(c) }); me.face('sweat', ctx.t);
    const reach = ease.inOutSine(clamp(lt / 0.5, 0, 1)) * (1 - 0.35 * back);
    me.joints.armR.rotation.set(-1.45 * reach, 0, 0.1); me.joints.foreArmR.rotation.set(-0.15 * reach, 0, 0);
    me.joints.armL.rotation.set(-1.25 * reach, 0, -0.15); me.joints.foreArmL.rotation.set(-0.2 * reach, 0, 0);
    me.joints.torso.rotation.x += 0.2 * reach;
    setCam(ctx, { pos: C(-5.1, 1.65, 0.95), look: C(-8.25, 0.85, -0.8), fov: 40 }, 0.8, '#ffe2b0');
    if (back > 0) { ctx.cam.shake(0.12 * (1 - back), ctx.t, 4); tag(ctx, 'HSSSS!', th, Infinity, { y: 0.16, size: 90, fill: '#ff4f4f' }); }
  },
});
// ── b20 "I scooped him up anyway and yanked the emergency stop."
S({
  name: 'scoop', start: 'b20-0.1', set: 'cab',
  setup(ctx) { const C = cabRig(ctx); ctx.store.C = C; kidFacingCat(ctx, C); ctx.cast.me.root.rotation.set(0, C.yaw + Math.PI / 2 - 0.5, 0); holdCat(ctx, ctx.cast.me, ctx.cast.catW);
    const P = ctx.props; ctx.add(P.cap, ctx.cast.catW.joints.head); P.cap.position.set(0, 0.135, 0.01); P.cap.rotation.set(-0.12, 0, 0.1); },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    const k = ease.outBack(clamp((ctx.t - ctx.time('b20.w1')) / 0.35, 0, 1));
    me.pose('idle', ctx.t, { intensity: 0.3 }); hugArms(me, 1, 0.5); me.face('determined', ctx.t);
    c.pose('loaf', ctx.t); c.face('shocked', 0.4); c.root.position.y = lerp(-0.5, 0.12, clamp(k, 0, 1.1));
    const f = humanFace(me);
    setCam(ctx, { pos: C(-4.4, 1.65, 0.7), look: f.clone().add(up(-0.55)), fov: 44 }, 0.7, '#ffe2b0');
  },
});
function leverRig(ctx, C) {
  const P = ctx.props, a = ctx.anchor('cab.lever'); a.updateWorldMatrix(true, false);
  ctx.add(P.lever); P.lever.position.copy(rel(a)); P.lever.rotation.set(0, yawOf(a), 0);
  ctx.add(P.sparks); P.sparks.position.copy(rel(a, [0, 0.3, 0.25]));
  ctx.add(P.redLight); P.redLight.position.copy(C(-6, 2.2, 0));
  return a;
}
S({
  name: 'yank the lever', start: 'b20.w5-0.1', set: 'cab',
  setup(ctx) {
    const C = cabRig(ctx); ctx.store.C = C; const a = leverRig(ctx, C); ctx.store.a = a;
    ctx.place('me', rel(a, [0.05, -1.45, 0.85])); ctx.cast.me.root.rotation.set(0, yawOf(a) + Math.PI - 0.15, 0);
    holdCat(ctx, ctx.cast.me, ctx.cast.catW, { x: 0.2, y: 0.08, z: 0.28 });
    const P = ctx.props; ctx.add(P.cap, ctx.cast.catW.joints.head); P.cap.position.set(0, 0.135, 0.01);
  },
  update(ctx, lt) {
    tick(ctx); const { C, a } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW, P = ctx.props;
    const ty = ctx.markers.estop, pull = clamp((ctx.t - ty) / 0.22, 0, 1);
    P.lever.userData.set(pull, ctx.t, pull > 0.5 ? 1 : 0);
    P.sparks.userData.set(clamp((ctx.t - ty - 0.12) / 0.9, 0, 1));
    P.redLight.intensity = pull > 0.5 ? (Math.sin(ctx.t * 22) > 0 ? 40 : 5) : 0;
    me.pose('idle', ctx.t, { intensity: 0.3 });
    const J = me.joints; J.armR.rotation.set(lerp(-2.65, -1.5, pull), 0, 0.2); J.foreArmR.rotation.set(-0.2, 0, 0);
    J.torso.rotation.x += lerp(0.3, 0.15, pull);
    J.armL.rotation.x += -0.9; J.foreArmL.rotation.x += -1.3; J.foreArmL.rotation.y = 0.5;
    me.face(pull > 0 ? 'huss' : 'determined', 0.4);
    c.pose('loaf', ctx.t); c.face('shocked', 0.4);
    P.lever.updateMatrixWorld(true);
    const hp = P.lever.userData.handle.getWorldPosition(V());
    setCam(ctx, { pos: C(-4.6, 1.7, 0.3), look: rel(a, [-0.1, -0.3, 0.5]), fov: 46 }, 0.7, '#ffe2b0');
    if (pull > 0) { stamp(ctx, 'YANK!', ty, { size: 140, fill: '#ffffff', stroke: '#c0182b', line: 14, y: 0.12, rot: -0.08 }); ctx.cam.shake(0.25, ctx.t, 21); ctx.fx.overlay('#ff1a1a', Math.sin(ctx.t * 22) > 0 ? 0.22 : 0.05); }
  },
});
S({
  name: 'stop! red', start: 'b20.w9-0.1', set: 'cab',
  setup(ctx) {
    const C = cabRig(ctx); ctx.store.C = C; const a = leverRig(ctx, C); ctx.store.a = a;
    ctx.place('me', C(-6.2, 0, -0.2)); ctx.cast.me.root.rotation.set(0, C.yaw + Math.PI / 2 + 0.3, 0);
    holdCat(ctx, ctx.cast.me, ctx.cast.catW);
    const P = ctx.props; ctx.add(P.cap, ctx.cast.catW.joints.head); P.cap.position.set(0, 0.135, 0.01);
    ctx.set.lights.hemi.intensity = 0.5;
  },
  update(ctx, lt) {
    tick(ctx); const { C } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW, P = ctx.props;
    P.lever.userData.set(1, ctx.t, 1); P.sparks.userData.set(clamp(lt / 0.8, 0, 1));
    const on = Math.sin(ctx.t * 22) > 0;
    P.redLight.intensity = on ? 45 : 6;
    me.pose('surprised', ctx.t, { intensity: 0.5 }); hugArms(me, 1, 0.5); me.face('shocked', 0.4);
    me.root.rotation.z = 0.15 * Math.sin(lt * 9) * Math.exp(-lt * 2);
    c.pose('loaf', ctx.t); c.face('shocked', 0.4);
    setCam(ctx, { pos: C(-2.5, 2.0, 0.6), look: C(-6.5, 1.2, -0.3), fov: 50 }, 0.5, '#ff6060');
    const ts = ctx.time('b20.w9');
    ctx.cam.shake(ctx.t > ts ? 0.8 * Math.exp(-(ctx.t - ts) * 3) + 0.1 : 0.2, ctx.t, 33);
    ctx.fx.overlay('#ff1a1a', on ? 0.25 : 0.06);
    stamp(ctx, 'EMERGENCY STOP', ts - 1, { size: 104, fill: '#ffffff', stroke: '#c0182b', line: 14, y: 0.2, rot: -0.08 });
  },
});
// ── b21 "The doors opened. My street. My house. Home."  Dusk.
function homeKid(ctx, L, x, z, yaw) {
  const me = ctx.cast.me; ctx.place('me', L(x, 0, z)); me.root.rotation.set(0, L.yaw + yaw, 0);
  holdCat(ctx, me, ctx.cast.catW);
  const P = ctx.props; ctx.add(P.cap, ctx.cast.catW.joints.head); P.cap.position.set(0, 0.135, 0.01); P.cap.rotation.set(-0.12, 0, 0.1);
  ctx.add(P.backpack2, me.joints.torso); P.backpack2.position.set(0, 0.25, -0.32);
  return me;
}
function hugAnim(ctx, me, c, expr, tight = 0) { me.pose('idle', ctx.t, { intensity: 0.3 }); hugArms(me, 1, tight); me.face(expr, ctx.t); c.pose('loaf', ctx.t); c.face('neutral', ctx.t); }
S({
  name: 'doors open home', start: 'b21-0.1', set: 'town',
  setup(ctx) { const L = dayTown(ctx, 'dusk'); ctx.store.L = L; homeKid(ctx, L, TRAIN_STOP, 0.9, 0); },
  update(ctx, lt) {
    const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    const t0 = ctx.time('b21'), door = ease.inOutCubic(clamp((ctx.t - t0) / 0.6, 0, 1));
    trainAt(ctx, L, TRAIN_STOP, { t: ctx.t, door, glow: 0.8, light: 0.4, beam: 0.4 });
    const k = clamp((ctx.t - t0 - 0.5) / 0.9, 0, 1);
    const z = lerp(0.9, 3.0, k), y = z < 1.5 ? 1.16 : z < 1.9 ? 0.7 : z < 2.3 ? 0.35 : 0;
    me.root.position.copy(L(TRAIN_STOP, y, z));
    hugAnim(ctx, me, c, 'smile'); if (k > 0 && k < 1) { const s = me.pose; }
    setCam(ctx, { pos: L(TRAIN_STOP + 1.6, 1.5, 7.4), look: L(TRAIN_STOP, 1.8, 2.0), fov: 42 }, 0);
  },
});
S({
  name: 'my street my house', start: 'b21.w3-0.1', set: 'town',
  setup(ctx) { const L = dayTown(ctx, 'dusk'); ctx.store.L = L; homeKid(ctx, L, TRAIN_STOP - 1.1, 5.9, 0.15); },
  update(ctx, lt) {
    const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    trainAt(ctx, L, TRAIN_STOP, { t: ctx.t, door: 1, glow: 0.8, light: 0.4, beam: 0.4 });
    hugAnim(ctx, me, c, 'smile');
    lampGlows(ctx, L, null, 0.7);
    moveCam(ctx, { pos: L(TRAIN_STOP - 2.0, 2.0, 2.3), look: L(TRAIN_STOP - 0.2, 2.4, 11), fov: 52 }, { pos: L(TRAIN_STOP - 1.8, 2.5, 2.1), look: L(TRAIN_STOP - 0.2, 3.0, 11), fov: 54 }, ease.inOutSine(clamp(lt / 1.7, 0, 1)), 0);
    tag(ctx, 'HOME', ctx.time('b21.w7'), Infinity, { y: 0.16, bg: 'rgba(255,122,47,0.92)' });
  },
});
S({
  name: 'home smile', start: 'b21.w7-0.1', set: 'town',
  setup(ctx) { const L = dayTown(ctx, 'dusk'); ctx.store.L = L; homeKid(ctx, L, TRAIN_STOP + 0.4, 4.2, Math.PI - 0.3); },
  update(ctx, lt) {
    const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    trainAt(ctx, L, TRAIN_STOP, { t: ctx.t, door: 1, glow: 0.8, light: 0.4, beam: 0.4 });
    hugAnim(ctx, me, c, 'grin', 0.4);
    const f = humanFace(me);
    moveCam(ctx, { pos: L(TRAIN_STOP + 0.0, 1.5, 6.6), look: f.clone().add(up(-0.3)), fov: 34 }, { pos: L(TRAIN_STOP + 0.1, 1.55, 6.1), look: f.clone().add(up(-0.25)), fov: 32 }, clamp(lt / 0.8, 0, 1), 0);
  },
});
// ── b22 "Except the clock tower was ticking backwards."
S({
  name: 'smile drops', start: 'b22-0.1', set: 'town',
  setup(ctx) { const L = dayTown(ctx, 'dusk'); ctx.store.L = L; homeKid(ctx, L, TRAIN_STOP + 0.4, 4.2, -Math.PI / 2 - 0.2); },
  update(ctx, lt) {
    const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    me.pose('idle', ctx.t, { intensity: 0.3, headPitch: -0.35, headYaw: 0.2 }); hugArms(me, 1); me.face(lt > 0.2 ? 'shocked' : 'smile', 0.4);
    c.pose('loaf', ctx.t); c.face('neutral', 0.4);
    const f = humanFace(me);
    setCam(ctx, { pos: L(TRAIN_STOP - 1.3, 0.9, 5.5), look: f.clone().add(up(0.2)), fov: 40 }, 0);
  },
});
S({
  name: 'clock backwards', start: 'b22.w2-0.1', set: 'town',
  setup(ctx) { const L = dayTown(ctx, 'dusk'); ctx.store.L = L; },
  update(ctx, lt) {
    const { L } = ctx.store;
    const m = 30 - lt * 260;   // the minute hand races backwards
    clockOnTower(ctx, L, 6 + m / 60, ((m % 60) + 60) % 60, 1);
    moveCam(ctx, { pos: L(-43.0, 7.8, 1.3), look: L(CLOCK[0], 11, CLOCK[2]), fov: 30 }, { pos: L(-45.6, 9.6, 1.45), look: L(CLOCK[0], 11, CLOCK[2]), fov: 26 }, ease.inOutSine(clamp(lt / 2, 0, 1)), 0);
    glitch(ctx, ctx.time('b22.w2'), 0.25, 0.6);
    const blink = Math.sin(ctx.t * 8) > 0;
    if (blink) ctx.fx.text('◀◀ REWIND', { x: 0.27, y: 0.12, size: 56, fill: '#ffffff', stroke: '#000000', line: 8 });
    tag(ctx, 'BACKWARDS', ctx.time('b22.w6'), Infinity, { y: 0.2, bg: 'rgba(200,0,40,0.9)' });
  },
});
// ── b23 "Bye! See you!"  The neighbour walks UP to the kid, waving as he arrives.
S({
  name: 'neighbour says bye', start: 'b23-0.1', set: 'town',
  setup(ctx) { const L = dayTown(ctx, 'dusk'); ctx.store.L = L; homeKid(ctx, L, TRAIN_STOP - 1.0, 6.4, Math.PI / 2 + 0.1); ctx.place('neighbor', L(TRAIN_STOP + 7, CURB, 6.3)); },
  update(ctx, lt) {
    const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW, n = ctx.cast.neighbor;
    hugAnim(ctx, me, c, 'neutral');
    const k = clamp(lt / 1.4, 0, 1);
    n.root.position.copy(L(lerp(TRAIN_STOP + 7, TRAIN_STOP + 1.4, k), CURB, 6.4)); n.root.rotation.set(0, L.yaw - Math.PI / 2, 0);
    walkWave(n, ctx.t, 1); n.face('grin', ctx.t);
    setCam(ctx, { pos: L(TRAIN_STOP - 3.2, 1.75, 7.6), look: L(TRAIN_STOP + 2.0, 1.6, 6.3), fov: 40 }, 0);
    tag(ctx, 'GOODBYE!', ctx.markers.bye + 0.05, Infinity, { y: 0.2, size: 90, bg: 'rgba(60,143,69,0.92)' });
  },
});
// ── b24 "Everyone said goodbye when they arrived."
S({
  name: 'everyone arrives waving', start: 'b24-0.1', set: 'town',
  setup(ctx) {
    const L = dayTown(ctx, 'dusk'); ctx.store.L = L; homeKid(ctx, L, TRAIN_STOP - 0.5, 6.4, 0.2);
    const plan = [[TRAIN_STOP - 7, 6.6, 1], [TRAIN_STOP + 7, 6.2, -1], [TRAIN_STOP - 5, 2.0, 1], [TRAIN_STOP + 6, 2.5, -1], [TRAIN_STOP + 1.4, 6.4, 0]];
    ctx.store.plan = plan;
    const ids = [...NEIGHBOR_IDS.slice(0, 4), 'neighbor'];
    ctx.store.ids = ids; ids.forEach((id, k) => ctx.place(id, L(plan[k][0], 0, plan[k][1])));
  },
  update(ctx, lt) {
    const { L, plan, ids } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    hugAnim(ctx, me, c, 'sweat', 0.5);
    ids.forEach((id, k) => {
      const ch = ctx.cast[id], [x0, z0, dir] = plan[k];
      const kk = clamp((lt - k * 0.15) / 1.6, 0, 1);
      const tx = TRAIN_STOP - 0.5 + dir * 1.6, tz = z0 > 4 ? 6.4 : 4.6;
      if (dir === 0) { ch.root.position.copy(L(x0, CURB, z0)); ch.root.rotation.set(0, L.yaw - Math.PI / 2, 0); ch.pose('wave', ctx.t); ch.face('grin', ctx.t); return; }
      const p = V(lerp(x0, tx, kk), 0, lerp(z0, tz, kk));
      ch.root.position.copy(L(p.x, p.z > 5.1 ? CURB : 0, p.z)); ch.root.rotation.set(0, L.yaw + (dir > 0 ? Math.PI / 2 : -Math.PI / 2) + (z0 < 4 ? dir * 0.5 : 0), 0);
      walkWave(ch, ctx.t + k, 1); ch.face('grin', ctx.t + k);
    });
    moveCam(ctx, { pos: L(TRAIN_STOP - 0.2, 3.0, 13.2), look: L(TRAIN_STOP - 0.5, 1.0, 5.2), fov: 50 }, { pos: L(TRAIN_STOP - 0.2, 2.6, 12.0), look: L(TRAIN_STOP - 0.5, 1.0, 5.2), fov: 48 }, clamp(lt / 1.2, 0, 1), 0);
    tag(ctx, 'BYE!', ctx.time('b24') + 0.2, Infinity, { x: 0.25, y: 0.3, size: 60, bg: 'rgba(60,143,69,0.9)', rot: 0.1 });
    tag(ctx, 'SEE YA!', ctx.time('b24') + 0.5, Infinity, { x: 0.74, y: 0.27, size: 60, bg: 'rgba(255,79,163,0.9)', rot: -0.08 });
  },
});
S({
  name: 'kid worried', start: 'b24.w3-0.1', set: 'town',
  setup(ctx) { const L = dayTown(ctx, 'dusk'); ctx.store.L = L; homeKid(ctx, L, TRAIN_STOP - 0.5, 6.4, Math.PI + 0.2);
    ['neighbor', NEIGHBOR_IDS[0], NEIGHBOR_IDS[1]].forEach((id, k) => { ctx.place(id, L(TRAIN_STOP - 2.0 + k * 1.6, CURB, 9.4 + (k % 2) * 0.5)); ctx.cast[id].root.rotation.set(0, L.yaw + Math.PI, 0); }); },
  update(ctx, lt) {
    const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    hugAnim(ctx, me, c, 'sweat', 1);
    ['neighbor', NEIGHBOR_IDS[0], NEIGHBOR_IDS[1]].forEach((id, k) => { const ch = ctx.cast[id]; ch.pose('wave', ctx.t + k); ch.face('grin', ctx.t + k); });
    const f = humanFace(me);
    setCam(ctx, { pos: L(TRAIN_STOP - 0.9, 1.6, 4.1), look: f.clone().add(up(-0.35)), fov: 38 }, 0);
    ctx.cam.shake(0.05, ctx.t, 8);
  },
});
// ── b25 "And my cat? My cat never had a white paw."
S({
  name: 'cat in arms', start: 'b25-0.1', set: 'town',
  setup(ctx) { const L = dayTown(ctx, 'dusk'); ctx.store.L = L; homeKid(ctx, L, TRAIN_STOP - 0.5, 6.4, Math.PI); },
  update(ctx, lt) {
    const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    me.pose('idle', ctx.t, { intensity: 0.2, headPitch: 0.45 }); hugArms(me, 1, 0.5); me.face('sweat', ctx.t);
    c.pose('idle', ctx.t, { headYaw: 0.6 }); c.face('neutral', 0.4);
    const cf = catFace(c);
    const mid = cf.clone().lerp(humanFace(me), 0.4), fw = L(0, 0, -1).sub(L(0, 0, 0));
    moveCam(ctx, { pos: mid.clone().addScaledVector(fw, 2.3).add(up(0.1)), look: mid, fov: 38 }, { pos: mid.clone().addScaledVector(fw, 1.8).add(up(0.05)), look: mid, fov: 36 }, clamp(lt / 2, 0, 1), 0);
  },
});
S({
  name: 'white paw', start: 'whitepaw-0.06', set: 'town',
  setup(ctx) { const L = dayTown(ctx, 'dusk'); ctx.store.L = L; homeKid(ctx, L, TRAIN_STOP - 0.5, 6.4, Math.PI); },
  update(ctx, lt) {
    const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    me.pose('idle', ctx.t, { intensity: 0.2 }); hugArms(me, 1, 0.5); me.face('sweat', ctx.t);
    const tw = ctx.markers.whitepaw;
    const turn = ease.inOutCubic(clamp((ctx.t - tw - 0.35) / 0.3, 0, 1));
    const pp = pawPos(c);
    const camP = pp.clone().add(L(TRAIN_STOP - 0.5, 0, 5.2).sub(L(TRAIN_STOP - 0.5, 0, 6.4))).add(up(0.18));
    c.pose('idle', ctx.t, { lookAt: turn > 0 ? camP : undefined }); c.face(turn > 0.7 ? 'wink' : 'neutral', 0.4);
    const look = pp.clone().lerp(catFace(c), turn * 0.6);
    setCam(ctx, { pos: camP.clone().lerp(camP.clone().add(up(0.1)), turn), look, fov: lerp(34, 36, turn) }, 0.3);
    ctx.cam.punch([tw], ctx.t, 0.14, 0.3);
    stamp(ctx, 'WHITE PAW', tw, { size: 120, fill: '#ffffff', stroke: '#1d1d22', y: 0.2 });
  },
});
// ── b26 "At three thirty-three, the train came back. And in the window, waving at me, holding my cat... was me."
S({
  name: 'clock 3:33 again', start: 'b26-0.1', set: 'town',
  setup(ctx) { const L = nightTown(ctx, { fogNear: 4, fogFar: 70 }); ctx.store.L = L; homeKid(ctx, L, -36, 4.0, -Math.PI / 2 - 0.2); ctx.add(ctx.props.moonOrb); ctx.props.moonOrb.position.copy(L(-80, 30, -14)); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    hugAnim(ctx, me, c, 'shocked'); me.joints.head.rotation.x += -0.3;
    clockOnTower(ctx, L, 3, 33, 1);
    moveCam(ctx, { pos: L(-33.4, 0.9, 5.4), look: L(CLOCK[0], 9.5, CLOCK[2]), fov: 34 }, { pos: L(-33.8, 1.0, 5.2), look: L(CLOCK[0], 10.2, CLOCK[2]), fov: 30 }, ease.inOutSine(clamp(lt / 1.1, 0, 1)), 0.6);
    clock333(ctx, ctx.time('b26') + 0.1);
  },
});
S({
  name: 'train came back', start: 'b26.w3-0.1', set: 'town',
  setup(ctx) { const L = nightTown(ctx, { fogA: 0.9 }); ctx.store.L = L; homeKid(ctx, L, -27.4, 4.4, Math.PI - 0.3); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    hugAnim(ctx, me, c, 'shocked', 0.5);
    me.pose('stunned', ctx.t); hugArms(me, 1, 0.5); me.face('shocked', 0.4);
    const x = -10 - 6 * (ctx.t - ctx.time('b26.w3'));
    trainAt(ctx, L, x, { t: ctx.t });
    lampGlows(ctx, L, x);
    setCam(ctx, { pos: L(-25.0, 0.7, 7.6), look: L(-29.5, 2.0, 1.0), fov: 50 }, 0.8);
  },
});
const TWIN_WIN = 3;   // window index (door side) where the twin stands
function twinRig(ctx) {
  const me2 = ctx.cast.me2;
  ctx.place('me2', V(0, -50, 0));
  holdCat(ctx, me2, ctx.cast.cat, { x: 0.12, y: 0.1, z: 0.34 });
}
function twinAnim(ctx, tr) {
  const me2 = ctx.cast.me2, c = ctx.cast.cat;
  const p = trainPoint(tr, tr.userData.winX[TWIN_WIN], 0.16, -0.62);
  me2.root.position.copy(p); me2.root.rotation.set(0, yawOf(tr) + Math.PI, 0);
  me2.pose('idle', ctx.t, { intensity: 0.3 });
  const J = me2.joints;
  J.armR.rotation.set(-0.2, 0, 2.5 + 0.35 * Math.sin(ctx.t * 9)); J.foreArmR.rotation.set(0, 0, 0.3 * Math.sin(ctx.t * 9));
  J.armL.rotation.x += -0.9; J.armL.rotation.z += -0.2; J.foreArmL.rotation.x += -1.3; J.foreArmL.rotation.y = 0.5;
  me2.face('grin', 0.5);
  c.pose('loaf', ctx.t); c.face('smile', 0.5);
}
S({
  name: 'windows slide by', start: 'b26.w7-0.1', set: 'town',
  setup(ctx) { const L = nightTown(ctx, { fogA: 0.7 }); ctx.store.L = L; homeKid(ctx, L, -27.4, 4.6, Math.PI - 0.3);  twinRig(ctx); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    me.pose('stunned', ctx.t); hugArms(me, 1, 0.5); me.face('shocked', 0.4); c.pose('loaf', ctx.t); c.face('neutral', 0.4);
    const tw = ctx.markers.wasme;
    const x = -27.4 + ctx.props.train.userData.winX[TWIN_WIN] + 2.4 * (tw - ctx.t) + 1.2;
    const tr = trainAt(ctx, L, x, { t: ctx.t, twin: TWIN_WIN });
    twinAnim(ctx, tr);
    lampGlows(ctx, L, null);
    setCam(ctx, { pos: L(-23.5, 1.6, 9.0), look: L(-28.5, 2.2, 1.0), fov: 44 }, 0.9);
  },
});
S({
  name: 'twin in the window', start: 'wasme-0.06', set: 'town',
  setup(ctx) { const L = nightTown(ctx, { fogA: 0.6 }); ctx.store.L = L;  twinRig(ctx); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store;
    const tw = ctx.markers.wasme;
    const x = -27.4 + ctx.props.train.userData.winX[TWIN_WIN] - 0.9 * (ctx.t - tw);
    const tr = trainAt(ctx, L, x, { t: ctx.t, twin: TWIN_WIN });
    twinAnim(ctx, tr);
    const wx = x - ctx.props.train.userData.winX[TWIN_WIN];
    const k = ease.inOutSine(clamp(lt / 1.5, 0, 1));
    setCam(ctx, { pos: L(wx + 0.15, 2.45, lerp(6.6, 5.0, k)), look: L(wx, 2.45, 1.0), fov: 36 }, 0.4, '#ffe2b0');
    ctx.cam.punch([tw], ctx.t, 0.12, 0.3);
  },
});
S({
  name: 'was me', start: 'b26.w17-0.1', set: 'town',
  setup(ctx) { const L = nightTown(ctx, { fogA: 0.5 }); ctx.store.L = L;  twinRig(ctx); },
  update(ctx, lt) {
    tick(ctx); const { L } = ctx.store;
    const t0 = ctx.time('b26.w17');
    const x = -27.4 + ctx.props.train.userData.winX[TWIN_WIN] - 0.9 * (ctx.t - ctx.markers.wasme);
    const tr = trainAt(ctx, L, x, { t: ctx.t, twin: TWIN_WIN });
    twinAnim(ctx, tr);
    const f = humanFace(ctx.cast.me2);
    const zk = ease.outCubic(clamp((ctx.t - ctx.time('b26.w18')) / 0.25, 0, 1));
    setCam(ctx, { pos: f.clone().add(L(0, 0, lerp(3.2, 2.1, zk)).sub(L(0, 0, 0))), look: f.clone().add(up(-0.1)), fov: lerp(34, 28, zk) }, 0.5, '#ffe2b0');
    ctx.cam.punch([ctx.time('b26.w18')], ctx.t, 0.15, 0.3);
    if (ctx.t > ctx.time('b26.w18')) stamp(ctx, 'ME?!', ctx.time('b26.w18'), { size: 160, fill: '#ffd23f', stroke: '#1d1d22', y: 0.22 });
  },
});
// ── b27 HUSS ×3 — red tail lights shrink into the fog; the white-paw cat slowly grins
[0, 1, 2].forEach((i) => S({
  name: `tail lights #${i + 1}`, start: i === 0 ? 'b27.h0-0.12' : `b27.h${i}-0.03`, set: 'town',
  setup(ctx) { const L = nightTown(ctx, { fogNear: 3, fogFar: 55 }); ctx.store.L = L; homeKid(ctx, L, -27.4, 4.6, -Math.PI / 2 + 0.1); },
  update(ctx) {
    tick(ctx); const { L } = ctx.store, me = ctx.cast.me, c = ctx.cast.catW;
    const hits = ctx.hussTimes('b27').map((h) => h + 0.03);
    const x = -50 - 8 * (ctx.t - ctx.time('b27'));
    trainAt(ctx, L, x, { t: ctx.t, beam: 0.6 });
    lampGlows(ctx, L, null, 0.6);
    me.pose('stunned', ctx.t); hugArms(me, 1, 0.5); me.face('shocked', 0.4);
    if (i < 2) {
      c.pose('loaf', ctx.t); c.face('neutral', 0.4);
      const cams = [{ pos: L(-23.0, 1.9, 8.4), look: L(-36, 2.0, 0.5), fov: 40 }, { pos: L(-26.0, 2.1, 0.4), look: L(-60, 2.0, 0.0), fov: 26 }];
      setCam(ctx, cams[i], 0.6);
    } else {
      const g = clamp((ctx.t - hits[2]) / 0.5, 0, 1);
      c.pose('idle', ctx.t); const cf0 = catFace(c);
      const camP = cf0.clone().add(L(0, 0, 0).sub(L(1.45, 0, 0.3))).add(up(0.12));
      c.pose('idle', ctx.t, { lookAt: camP }); c.face(g > 0.4 ? 'grin' : 'squint', 0.4);
      const cf = catFace(c);
      setCam(ctx, { pos: camP, look: cf.clone().add(up(-0.04)), fov: lerp(36, 30, g) }, 0.9, '#ffe2b0');
      iris(ctx, ctx.time('b27.end') + 0.2, 0.42, 0.5);
    }
    ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
  },
}));

export const shots = shots_;
