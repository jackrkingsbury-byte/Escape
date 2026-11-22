// In This Town — Episode 13: "Zero Aura".  Everyone has a glowing aura number over their head.  The narrator has 12,
// trips on stage, drops to 1… then discovers the one cheat code: not caring.  One million.  The whole town copies the
// trick, lies, and turns gray.  Then a pigeon lands on the narrator's head.  Two million.
// Film contract: SPEC.md §8.  Timeline: episodes/ep13/timeline.json.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { makeCharacter, WALK_SPEED } from '../characters.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp, canvasTexture } from '../lib/util.js';
import { makeTable } from '../props.js';
import { makePhotoCamera } from '../ep3/props3.js';
import { V, frame, frameAt, lastBefore } from '../shots.js';
import { makeAuraTag, makeTextSprite, makeSegNumber, makeBeams, makeSparkles, makeGoldThrone, makePhone, makeFlash,
  makeBench, makeCloud, makeShades, SHADES_POS } from './props.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const KID = { id: 'me', skin: '#c68642', hair: { style: 'spiky', color: '#111111' }, top: { style: 'hoodie', color: '#ffd23f', accent: '#2f6fd6' },
  bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#f2f2f2', accessories: [], capColor: '#2f6fd6', scale: 0.9 };
/** The narrator, with the blue cap turned backwards. */
function makeKid() {
  const ch = makeCharacter(KID);
  const before = new Set(); ch.root.traverse((o) => before.add(o));
  ch.setAccessory('cap', true);
  let cap = null; ch.root.traverse((o) => { if (!cap && !before.has(o) && before.has(o.parent)) cap = o; });
  if (cap) cap.rotation.y += Math.PI;
  return ch;
}
const SPECS = {
  kevin: { skin: '#f1c7a1', hair: { style: 'fade', color: '#3b2416' }, top: { style: 'hoodie', color: '#e8232b', accent: '#ffffff' }, bottom: { style: 'pants', color: '#1d1d22' }, shoes: '#f2f2f2', accessories: ['chain'] },
  goon1: { skin: '#e0ac69', hair: { style: 'short', color: '#1a120c' }, top: { style: 'tee', color: '#e8232b', accent: '#ffffff', emblem: 'stripe' }, bottom: { style: 'pants', color: '#1d1d22' }, shoes: '#1d1d22' },
  goon2: { skin: '#8d5524', hair: { style: 'curly', color: '#111111' }, top: { style: 'tee', color: '#e8232b', accent: '#ffffff', emblem: 'stripe' }, bottom: { style: 'pants', color: '#1d1d22' }, shoes: '#1d1d22', build: 1.1 },
  patel: { skin: '#a86b4a', hair: { style: 'short', color: '#1a120c' }, top: { style: 'cardigan', color: '#3c8f45', accent: '#f3e3a5' }, bottom: { style: 'pants', color: '#55575e' }, shoes: '#4a3b2f', accessories: ['mustache'], build: 1.08 },
  wanda: { skin: '#f4d0b5', hair: { style: 'long', color: '#7a4a24' }, top: { style: 'dress', color: '#ff7a2f', accent: '#ffd23f', emblem: 'heart' }, bottom: { style: 'skirt', color: '#ff7a2f' }, shoes: '#ff4fa3', scale: 0.96 },
  friend: { skin: '#6b4226', hair: { style: 'afro', color: '#111111' }, top: { style: 'tee', color: '#4fb3ff', accent: '#ffffff', emblem: 'star' }, bottom: { style: 'shorts', color: '#2f4d8a' }, shoes: '#f2f2f2' },
  bowtie: { skin: '#ffdbac', hair: { style: 'short', color: '#7a4a24' }, top: { style: 'suit', color: '#4a5d7e', accent: '#d62839' }, bottom: { style: 'pants', color: '#2a2a33' }, shoes: '#1a1a1a', accessories: ['bowtie', 'glasses'] },
  dancer: { skin: '#e0ac69', hair: { style: 'afro', color: '#2b1d14' }, top: { style: 'tee', color: '#5bd65b', accent: '#ffffff', emblem: 'star' }, bottom: { style: 'shorts', color: '#1d1d22' }, shoes: '#ff4fa3', scale: 0.8 },
  grandma: { skin: '#f0c8a8', hair: { style: 'bun', color: '#e8e8e8' }, top: { style: 'cardigan', color: '#ffa6d1', accent: '#ffffff' }, bottom: { style: 'skirt', color: '#7a6a58' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.9 },
};
const GRAYS = ['#a2a2a6', '#8c8c90', '#b4b4b8', '#7e7e82', '#acacb0'];
function grayOf(spec, i) {
  return { ...spec, id: 'g' + spec.id, skin: '#c4c4c6', hair: { style: (spec.hair && spec.hair.style) || 'short', color: '#6e6e72' },
    top: { style: (spec.top && spec.top.style) || 'tee', color: GRAYS[i % 5], accent: '#9a9a9d', emblem: null },
    bottom: { style: (spec.bottom && spec.bottom.style) || 'pants', color: '#5e5e62' }, shoes: '#6a6a6e',
    accessories: (spec.accessories || []).filter((a) => ['glasses', 'mustache', 'beard'].includes(a)), eyeColor: '#2a2a2a', lod: 'low' };
}
const ALL_SPECS = { ...Object.fromEntries(Object.entries(SPECS).map(([id, s]) => [id, { id, ...s }])), ...EXTRAS };
const GRAY_SRC = [...EXTRA_IDS, 'kevin', 'patel', 'grandma', 'goon1'];
const GRAY_SPECS = Object.fromEntries(GRAY_SRC.map((id, i) => ['g' + id, grayOf(ALL_SPECS[id], i)]));

export const cast = { me: () => makeKid(), pigeon: MAIN.pigeon, ...ALL_SPECS, ...GRAY_SPECS };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 13, banner: ['ALL HAIL THE', 'AURA KING', '* * *'] }),
  room: () => buildRoom({ variant: 'hero', window: 'dark' }),
};

// ───────────────────────────────────────────────────────────────────────────────────────── props
function bannerTex() {
  return canvasTexture(1024, 300, (g, w, h) => {
    g.fillStyle = '#7a1f2b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffd23f'; g.lineWidth = 18; g.strokeRect(14, 14, w - 28, h - 28);
    g.font = '190px "ITT World Display", "ITT Luckiest", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let s = 190; while (g.measureText('AURA KING').width > w - 120 && s > 60) { s -= 6; g.font = `${s}px "ITT World Display", "ITT Luckiest", Impact, sans-serif`; }
    g.lineWidth = 16; g.strokeStyle = '#3a1a00'; g.strokeText('AURA KING', w / 2, h / 2 + 10);
    const gr = g.createLinearGradient(0, h * 0.2, 0, h * 0.8); gr.addColorStop(0, '#fff6b0'); gr.addColorStop(1, '#ffb300');
    g.fillStyle = gr; g.fillText('AURA KING', w / 2, h / 2 + 10);
  });
}
function makeHangingBanner() {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 1.8), new THREE.MeshStandardMaterial({ map: bannerTex(), roughness: 0.7, emissive: '#ffffff', emissiveMap: bannerTex(), emissiveIntensity: 0.25, side: THREE.DoubleSide }));
  g.add(p);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), new THREE.MeshStandardMaterial({ color: '#c7ccd4' })); r.position.set(s * 2.9, 1.6, 0); g.add(r); }
  return g;
}
export function init(ctx) {
  const P = ctx.props;
  P.tags = Array.from({ length: 34 }, () => makeAuraTag());
  P.sign = makeTextSprite();
  P.fly = makeTextSprite();
  P.throne = makeGoldThrone();
  P.banner = makeHangingBanner();
  P.beams = makeBeams({ n: 5, h: 34, r: 0.75, spread: 3.6 });
  P.bigBeams = makeBeams({ n: 7, h: 60, r: 1.3, spread: 12, color: '#ffe9a0' });
  P.sparkles = makeSparkles({ n: 46, w: 5, h: 4.5, d: 2.5 });
  P.mil = makeSegNumber('1,000,000', { h: 1.9 });
  P.mil2 = makeSegNumber('2,000,000', { h: 2.6 });
  P.phone = makePhone(); P.phone.scale.setScalar(1.7);
  P.sideTable = makeTable({ w: 0.6, d: 0.6, h: 1.1 });
  P.photoCam = makePhotoCamera();
  P.flash = makeFlash();
  P.bench = makeBench();
  P.clouds = [makeCloud(1), makeCloud(2), makeCloud(3), makeCloud(4)];
  P.shades = [makeShades(), makeShades(), makeShades()];
  P.fill = new THREE.PointLight('#ffe6cc', 6, 10, 1.4);
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
const PI = Math.PI;
const fmt = (n) => Math.round(n).toLocaleString('en-US');
function T(ctx) { ctx.set.root.updateMatrixWorld(true); const r = ctx.set.root; const f = (x, y, z) => r.localToWorld(V(x, y, z)); f.yaw = yawOf(r); return f; }
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headC(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, ch.kind === 'human' || ch.joints.foreArmL ? 0.29 : 0.03, 0)); }
const sc = (ch) => (ch.body ? ch.body.scale.y : 1);
const isPigeon = (ch) => ch.id === 'pigeon';
function placeTag(tag, ch, o = {}) {
  const p = headC(ch);
  const dy = o.dy != null ? o.dy : isPigeon(ch) ? 0.28 : 0.48 * sc(ch) + 0.1;
  tag.position.copy(p).add(up(dy));
  tag.userData.set(o);
}
function tags(ctx, n, from = 0) { const list = ctx.props.tags.slice(from, from + n); list.forEach((t) => ctx.add(t)); return list; }
function fill(ctx, pos, k = 1) { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 6 * k; }
const _qa = new THREE.Quaternion(), AX = V(1, 0, 0), AY = V(0, 1, 0);
function orient(root, yaw, pitch = 0, roll = 0) {
  root.quaternion.setFromAxisAngle(AY, yaw);
  _qa.setFromAxisAngle(AX, pitch); root.quaternion.multiply(_qa);
  _qa.setFromAxisAngle(AY, roll); root.quaternion.multiply(_qa);
}
function tagText(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 80, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.8)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale || 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.25, size: 170, fill: '#ffd23f', stroke: '#3a1a00', line: 14, rot: -0.12, scale: s * (o.scale || 1), alpha: clamp(d / 0.06, 0, 1), ...o, scale: s * (o.scale || 1) });
  if (d < 0.18 && !o.noShake) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
const iris = (ctx, t0, cy = 0.45) => { const k = clamp((ctx.t - t0) / 0.45, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); }); };
const flicker = (t, seed = 0) => 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 23 + seed)) * (hash(Math.floor(t * 12) + seed) > 0.25 ? 1 : 0.25);

// aura values
const VAL = { kevin: 9500, goon1: 6100, goon2: 5800, patel: 4210, grandma: 7400, wanda: 3300, friend: 2900, bowtie: 2300, dancer: 880 };
EXTRA_IDS.forEach((id, i) => { VAL[id] = [4210, 880, 15300, 2450, 610, 9990, 1200, 3700, 760, 12800, 5050, 330, 2020, 6400, 1440, 870, 21000, 3100][i]; });

// ── town helpers
const CURB = 0.12;
const groundY = (z) => (Math.abs(z) > 4.5 ? CURB : 0);
function dayTown(ctx, party = false) { ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', party); ctx.set.set?.('fireworks', false); ctx.set.set?.('windowGlow', 0); ctx.set.set?.('standsCrowd', false); }
function duskTown(ctx) { ctx.set.setLighting?.('dusk'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('windowGlow', 0.6); ctx.set.set?.('standsCrowd', false); }
function putChar(ctx, id, p, yaw) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); return ctx.cast[id]; }

// ── square: S frame = stage floor centre, +z toward the audience, +x = stage's left (world +z)
const LANE = 3.0, FEET_X = 1.0, LIFT = 0.24;
function square(ctx, { light = 'day', party = true, throne = true, banner = true, fans = true } = {}) {
  if (light === 'day') dayTown(ctx, party); else { duskTown(ctx); ctx.set.set?.('partyProps', party); }
  ctx.set.set?.('standsCrowd', fans);
  const S = frameAt(ctx, 'square.stage'), P = ctx.props;
  if (throne) { ctx.add(P.throne); P.throne.position.copy(S(0, 0, 0.95)); P.throne.rotation.set(0, S.yaw, 0); }
  if (banner) { ctx.add(P.banner); P.banner.position.copy(S(0, 5.2, 2.9)); P.banner.rotation.set(0, S.yaw, 0); }
  return S;
}
function throneSeat(ctx) { const P = ctx.props; P.throne.updateMatrixWorld(true); return P.throne.localToWorld(P.throne.userData.seat.clone()); }
function goldFx(ctx, S, { beams = true, sparkles = true } = {}) {
  const P = ctx.props;
  if (beams) { ctx.add(P.beams); P.beams.position.copy(S(0, 0, 0.3)); P.beams.rotation.set(0, S.yaw, 0); }
  if (sparkles) { ctx.add(P.sparkles); P.sparkles.position.copy(S(0, 1.0, 1.4)); P.sparkles.rotation.set(0, S.yaw, 0); }
}
function goldFxUpdate(ctx, a = 1) { const P = ctx.props; P.beams.userData.set(ctx.t, a); P.sparkles.userData.set(ctx.t, a); }
function giant(ctx, S, which = 'mil', pos = [0, 6.6, 3.8]) {
  const P = ctx.props, n = P[which]; ctx.add(n); n.position.copy(S(...pos)); n.rotation.set(0, S.yaw, 0);
  ctx.add(P.bigBeams); P.bigBeams.position.copy(S(0, 0, 0.0)); P.bigBeams.rotation.set(0, S.yaw, 0);
  return n;
}
/** The kid lying on the stage lane, head toward −x.  pitch π/2 = flat; roll π = on the back. */
function kidLie(ctx, S, { pitch = PI / 2, roll = 0, feetX = FEET_X } = {}) {
  const k = ctx.cast.me; ctx.place('me', S(feetX, 0, LANE));
  const lift = (LIFT + 0.12 * Math.abs(Math.sin(roll))) * Math.sin(pitch);
  k.root.position.copy(S(feetX, lift, LANE)); orient(k.root, S.yaw - PI / 2, pitch, roll);
  return k;
}
function armsBehindHead(ch, k = 1) {
  const J = ch.joints;
  J.armL.rotation.set(-2.75 * k, 0, 0.55 * k); J.armR.rotation.set(-2.75 * k, 0, -0.55 * k);
  if (J.foreArmL) { J.foreArmL.rotation.set(-1.9 * k, 0, 0); J.foreArmR.rotation.set(-1.9 * k, 0, 0); }
}
// crowd slots on the plaza (S frame, ground y = −0.8)
const CROWD = [
  ['x00', -4.0, 6.0], ['kevin', -2.6, 6.0], ['x01', -1.3, 6.1], ['x02', 0.0, 5.9], ['patel', 1.3, 6.0], ['grandma', 2.6, 6.1], ['x03', 3.9, 6.0],
  ['x04', -4.6, 7.3], ['goon1', -3.3, 7.25], ['goon2', -2.0, 7.35], ['wanda', -0.6, 7.3], ['friend', 0.7, 7.3], ['bowtie', 2.0, 7.25], ['x05', 3.3, 7.35], ['x06', 4.6, 7.3],
  ['x07', -4.0, 8.6], ['x08', -2.7, 8.65], ['dancer', -1.35, 8.55], ['x09', 0.0, 8.6], ['x10', 1.35, 8.65], ['x11', 2.7, 8.55], ['x12', 4.0, 8.6],
  ['x13', -3.3, 9.9], ['x14', -2.0, 9.95], ['x15', -0.6, 9.9], ['x16', 0.7, 9.95], ['x17', 2.0, 9.9],
];
function crowdSetup(ctx, S, { ids = null, tagged = true, target = [0, 1.5] } = {}) {
  const list = [];
  CROWD.forEach(([id, x, z], k) => {
    if (ids && !ids.includes(id)) return;
    const jx = (hash(k * 3.7) - 0.5) * 0.25, jz = (hash(k * 5.3) - 0.5) * 0.25;
    const p = S(x + jx, -0.8, z + jz), tp = S(target[0], -0.8, target[1]);
    const yaw = Math.atan2(tp.x - p.x, tp.z - p.z);
    const ch = putChar(ctx, id, p, yaw);
    list.push({ id, ch, p, yaw, k, x, z, ph: hash(k * 1.9) * 3 });
  });
  if (id_has(list, 'kevin')) shadesOn(ctx, 'kevin', 0);
  if (id_has(list, 'goon1')) shadesOn(ctx, 'goon1', 1);
  if (id_has(list, 'goon2')) shadesOn(ctx, 'goon2', 2);
  const tg = tagged ? tags(ctx, list.length) : [];
  return { list, tg };
}
const id_has = (list, id) => list.some((c) => c.id === id);
function shadesOn(ctx, id, i) { const s = ctx.props.shades[i]; ctx.add(s, ctx.cast[id].joints.head); s.position.set(...SHADES_POS); s.rotation.set(0, 0, 0); return s; }
/** Crowd poses: mode 'watch' | 'shocked' | 'cheer' | 'peer' | 'stunned'; returns nothing. */
function crowdAnim(ctx, C, mode, o = {}) {
  const t = ctx.t;
  C.list.forEach((c, i) => {
    const ch = c.ch, ph = c.ph;
    if (mode === 'watch') { ch.pose(i % 4 === 1 ? 'crossArms' : 'idle', t + ph, { intensity: 0.5 }); ch.face(i % 3 ? 'smile' : 'neutral', t + ph); }
    else if (mode === 'shocked') { const k = clamp((t - (o.t0 ?? 0) - 0.04 * (i % 5)) / 0.2, 0, 1); ch.poseMix ? ch.poseMix('idle', t + ph, {}, i % 2 ? 'surprised' : 'stunned', t + ph, {}, k) : ch.pose('surprised', t + ph); ch.face(k > 0.3 ? 'shocked' : 'neutral', t + ph); }
    else if (mode === 'cheer') { ch.pose('cheer', t + ph, { intensity: 1, speed: 1.3 }); ch.face(o.face || 'huss', t + ph); }
    else if (mode === 'peer') { ch.pose('peer', t + ph, { intensity: 0.8 }); ch.face(i % 2 ? 'squint' : 'determined', t + ph); }
    else if (mode === 'stunned') { ch.pose('surprised', 0.3 + ph * 0.1); ch.face('shocked', 1); }
    else if (mode === 'clap') { ch.pose(i % 3 ? 'clap' : 'cheer', t + ph); ch.face('grin', t + ph); }
  });
  if (C.tg.length) C.list.forEach((c, i) => placeTag(C.tg[i], c.ch, { text: fmt(o.val ? o.val(c, i) : VAL[c.id]), style: o.style ? o.style(c, i) : 'gold', w: o.w || 0.85 }));
}
// grandma covering her mouth
function mouthCover(ch, k = 1) {
  const J = ch.joints;
  J.armL.rotation.set(-2.2 * k, 0, -0.25 * k); J.armR.rotation.set(-2.2 * k, 0, 0.25 * k);
  if (J.foreArmL) { J.foreArmL.rotation.set(-1.75 * k, 0, 0); J.foreArmR.rotation.set(-1.75 * k, 0, 0); }
}

// ── park (Kevin): K = Kevin frame (origin Kevin's feet, +z forward, +x = Kevin's left)
function kevinPark(ctx) {
  dayTown(ctx, false);
  const R = T(ctx), yaw = R.yaw + 0.5;
  const K = frame(R(-54.0, 0, -11.65), yaw);
  const kv = putChar(ctx, 'kevin', K(0, 0, 0), yaw);
  shadesOn(ctx, 'kevin', 0);
  putChar(ctx, 'goon1', K(1.05, 0, -0.55), yaw - 0.15); shadesOn(ctx, 'goon1', 1);
  putChar(ctx, 'goon2', K(-1.75, 0, -0.75), yaw + 0.2); shadesOn(ctx, 'goon2', 2);
  // catch pose → where the right hand ends up; table edge goes right above it
  kevinPose(ctx, kv, 99, 13.6);
  kv.root.updateMatrixWorld(true);
  const H = kv.joints.handR.getWorldPosition(V());
  const P = ctx.props, tw = 0.6, top = H.y + 0.3;
  const rightDir = K(-1, 0, 0).sub(K(0, 0, 0)).normalize();
  const tc = H.clone().addScaledVector(rightDir, tw / 2 - 0.03); tc.y = top - 1.1;
  ctx.add(P.sideTable); P.sideTable.position.copy(tc); P.sideTable.rotation.set(0, yaw, 0);
  ctx.add(P.phone);
  return { K, kv, H, top, rightDir, tc };
}
/** Kevin leaning on the tree, staring away (to his left); right arm snaps out at `tc` to catch. */
function kevinPose(ctx, kv, t, tc) {
  kv.pose('idle', t, { intensity: 0.3, headYaw: 1.05 });
  const J = kv.joints;
  kv.root.rotation.x = -0.1;
  const k = clamp((t - (tc - 0.09)) / 0.09, 0, 1);
  J.armR.rotation.x += -0.35 * k; J.armR.rotation.z += 0.95 * k;
  if (J.foreArmR) J.foreArmR.rotation.x += -0.25 * k;
  J.armL.rotation.z += 0.1;
}
function phoneUpdate(ctx, st, t, tSlide, tc) {
  const P = ctx.props, { H, top, rightDir } = st;
  const edge = H.clone(); edge.y = top + 0.008;
  if (t >= tc) { P.phone.position.copy(st.kv.joints.handR.getWorldPosition(V())).add(up(0.05)); P.phone.rotation.set(0.2, st.K.yaw, 0.15); return; }
  const tFall = tc - 0.22;
  if (t < tFall) {
    const k = clamp((t - tSlide) / (tFall - tSlide), 0, 1);
    P.phone.position.copy(edge).addScaledVector(rightDir, 0.22 * (1 - ease.inQuad(k)));
    P.phone.rotation.set(-PI / 2, st.K.yaw + 0.4, 0);
  } else {
    const d = t - tFall;
    P.phone.position.copy(edge).add(up(-(top - H.y - 0.05) * (d * d) / (0.22 * 0.22)));
    P.phone.rotation.set(-PI / 2 + 4 * d, st.K.yaw + 0.4, 2.5 * d);
  }
}

// ── Patel on main street (town-local x along the street)
const PATEL = [-12.6, 0.9], WANDA = [-14.5, 0.6], FRIEND = [-10.9, 1.35];
function patelScene(ctx) {
  dayTown(ctx, false);
  const L = T(ctx);
  putChar(ctx, 'patel', L(PATEL[0], 0, PATEL[1]), L.yaw - PI / 2);
  putChar(ctx, 'wanda', L(WANDA[0], 0, WANDA[1]), L.yaw + PI / 2 + 0.12);
  putChar(ctx, 'friend', L(FRIEND[0], 0, FRIEND[1]), L.yaw - PI / 2 - 0.1);
  return { L, tg: tags(ctx, 3) };
}
function patelAnim(ctx, st, { freezeAt = Infinity } = {}) {
  const t = ctx.t, c = ctx.cast, tw = ctx.time('b06.w2');
  c.wanda.pose('wave', t, { speed: 1.2 }); c.wanda.face('grin', t);
  c.friend.pose(t > tw + 0.4 ? 'wave' : 'idle', t + 0.3, { speed: 1.1 }); c.friend.face('smile', t);
  const pt = Math.min(t, freezeAt);
  if (t < tw) { c.patel.pose('idle', t); c.patel.face('smile', t); }
  else { c.patel.pose('wave', pt, { speed: 1.2 }); c.patel.face(t > freezeAt ? 'sweat' : 'grin', t > freezeAt ? 0.5 : t); }
  const tm = ctx.markers.minus2k;
  const crash = clamp((t - tm) / 0.25, 0, 1);
  placeTag(st.tg[0], c.patel, { text: fmt(t < tm ? 4210 : 2210), style: t < tm ? 'gold' : 'red', w: 0.9, dy: 0.62 - 0.35 * Math.sin(PI * crash) * (1 - crash) - (t > tm ? 0.06 * Math.exp(-(t - tm) * 6) : 0) });
  placeTag(st.tg[1], c.wanda, { text: '3,300', w: 0.8 });
  placeTag(st.tg[2], c.friend, { text: '2,900', w: 0.8 });
}

// ── dusk circles
function grayWalker(ch, t, ph, { head = null } = {}) { ch.pose('walkSad', t + ph, { speed: 0.8, ...(head ? { lookAt: head } : {}) }); ch.face('sleepy', 1.3); }

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
const B01_WALK = [['x00', -6.5, -2.4, 1], ['x01', -9, 1.0, -1], ['x02', -12, -1.2, 1, 'wave'], ['x03', -7.8, 3.0, 1], ['x04', -14, 2.4, -1],
  ['x05', -16, -3.0, 1], ['x06', -11, -3.6, -1, 'wave'], ['x07', -19, 0.4, 1], ['x08', -4.8, 1.6, -1, 'wave']];

export const shots = [
  // ── b01 "In this town, everyone has a glowing number floating over their head."
  {
    name: 'street push', start: 0, set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx);
      B01_WALK.forEach(([id, x, z, d]) => putChar(ctx, id, L(x, 0, z), L.yaw + (d > 0 ? PI / 2 : -PI / 2)));
      ctx.store = { L, tg: tags(ctx, B01_WALK.length) };
    },
    update(ctx, lt, u) {
      const { L, tg } = ctx.store, t = ctx.t;
      B01_WALK.forEach(([id, x, z, d, act], i) => {
        const ch = ctx.cast[id];
        if (act === 'wave') { ch.root.rotation.set(0, L.yaw + PI / 2 + 0.3 * d, 0); ch.pose('wave', t + i, { speed: 1.1 }); ch.face('grin', t + i); }
        else { ch.root.position.copy(L(x + d * WALK_SPEED * t, 0, z)); ch.pose('walk', t + i * 0.37); ch.face(i % 2 ? 'smile' : 'neutral', t + i); }
        placeTag(tg[i], ch, { text: fmt(VAL[id]), w: 0.95 });
      });
      ctx.cam.move({ pos: L(2.2, 2.3, 0.7), look: L(-12, 1.5, 0), fov: 44 }, { pos: L(-0.8, 2.0, 0.4), look: L(-12, 1.45, 0), fov: 42 }, clamp(lt / 3.0, 0, 1), ease.inOutSine);
    },
  },
  {
    name: 'pigeon bench', start: 'b01.w9-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx), P = ctx.props;
      ctx.add(P.bench); P.bench.position.copy(L(-4.6, CURB, 6.45)); P.bench.rotation.set(0, L.yaw + PI, 0);
      ctx.place('pigeon', L(-4.3, CURB + 0.54, 6.4)); ctx.cast.pigeon.root.rotation.set(0, L.yaw + PI + 0.3, 0);
      putChar(ctx, 'x05', L(-9, 0, 2.6), L.yaw + PI / 2); putChar(ctx, 'x01', L(-2, 0, 1.4), L.yaw - PI / 2);
      ctx.store = { L, tg: tags(ctx, 3) };
    },
    update(ctx, lt) {
      const { L, tg } = ctx.store, t = ctx.t, p = ctx.cast.pigeon;
      p.pose('sit', t); p.face('neutral', 0.5);
      ctx.cast.x05.root.position.copy(L(-9 + WALK_SPEED * lt, 0, 2.6)); ctx.cast.x05.pose('walk', t); ctx.cast.x05.face('smile', t);
      ctx.cast.x01.root.position.copy(L(-2 - WALK_SPEED * lt, 0, 1.4)); ctx.cast.x01.pose('walk', t + 0.4); ctx.cast.x01.face('neutral', t);
      placeTag(tg[0], p, { text: '???', style: 'blur', w: 0.85, dy: 0.42, ring: false });
      placeTag(tg[1], ctx.cast.x05, { text: fmt(VAL.x05), w: 0.9 }); placeTag(tg[2], ctx.cast.x01, { text: fmt(VAL.x01), w: 0.9 });
      ctx.cam.move({ pos: L(-5.2, 0.95, 4.4), look: L(-4.3, 0.95, 6.35), fov: 30 }, { pos: L(-5.0, 0.92, 4.8), look: L(-4.3, 0.95, 6.35), fov: 28 }, clamp(lt / 1.0, 0, 1), ease.outCubic);
    },
  },
  // ── b02 "Your aura."  snap zoom onto a glowing tag
  {
    name: 'your aura', start: 'b02-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx);
      putChar(ctx, 'x00', L(-8, 0, 1.0), L.yaw + PI / 2 + 0.15);
      putChar(ctx, 'x02', L(-11, 0, -1.6), L.yaw + PI / 2 - 0.3); putChar(ctx, 'x04', L(-12.5, 0, 2.6), L.yaw - PI / 2);
      ctx.store = { L, tg: tags(ctx, 3) };
    },
    update(ctx, lt) {
      const { L, tg } = ctx.store, t = ctx.t, x = ctx.cast.x00, ta = ctx.time('b02.w1');
      x.pose('idle', t); x.face('smug', t);
      ctx.cast.x02.pose('idle', t + 1); ctx.cast.x02.face('smile', t); ctx.cast.x04.pose('idle', t + 2); ctx.cast.x04.face('neutral', t);
      const pulse = t > ta ? 1 + 0.35 * Math.exp(-(t - ta) * 5) * Math.abs(Math.sin((t - ta) * 14)) : 1;
      placeTag(tg[0], x, { text: '4,210', w: 0.95 * pulse, ringScale: pulse });
      placeTag(tg[1], ctx.cast.x02, { text: fmt(VAL.x02), w: 0.9 }); placeTag(tg[2], ctx.cast.x04, { text: fmt(VAL.x04), w: 0.9 });
      const tp = tg[0].position;
      const k = ease.outCubic(clamp((lt - 0.12) / 0.16, 0, 1));
      ctx.cam.move({ pos: L(-3.6, 1.9, 1.5), look: L(-8, 1.6, 1.0), fov: 40 }, { pos: tp.clone().add(L(2.1, 0, 0.1).sub(L(0, 0, 0))).add(up(-0.15)), look: tp.clone().add(up(0.05)), fov: 34 }, k);
      tagText(ctx, 'AURA', ta, Infinity, { y: 0.14, size: 120, fill: '#ffd23f', stroke: '#3a1a00', bg: null });
    },
  },
  // ── b03 "Do something cool, it goes up."
  {
    name: 'cool = up', start: 'b03-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx);
      putChar(ctx, 'dancer', L(-6, 0, 2.0), L.yaw + PI / 2 - 0.25);
      putChar(ctx, 'x03', L(-9.2, 0, 0.6), L.yaw + PI / 2 + 0.5); putChar(ctx, 'x06', L(-8.6, 0, 3.6), L.yaw + PI / 2 - 0.4);
      ctx.store = { L, tg: tags(ctx, 3) };
    },
    update(ctx, lt) {
      const { L, tg } = ctx.store, t = ctx.t, d = ctx.cast.dancer, tu = ctx.time('b03.w5');
      d.pose('dance2', t, { speed: 1.15 }); d.face('grin', t);
      ctx.cast.x03.pose('clap', t); ctx.cast.x03.face('grin', t); ctx.cast.x06.pose('cheer', t + 0.5); ctx.cast.x06.face('laugh', t);
      const k = clamp((t - tu) / 0.18, 0, 1), green = t > tu && t < tu + 1.4;
      placeTag(tg[0], d, { text: t < tu ? '880' : '1,380', style: green ? 'green' : 'gold', w: 0.9 * (1 + 0.3 * Math.sin(PI * k)), dy: 0.5 * 0.8 + 0.1 + 0.25 * Math.sin(PI * k) });
      placeTag(tg[1], ctx.cast.x03, { text: fmt(VAL.x03), w: 0.85 }); placeTag(tg[2], ctx.cast.x06, { text: fmt(VAL.x06), w: 0.85 });
      if (t > tu) { const f = ctx.props.fly; ctx.add(f); const dd = t - tu; f.position.copy(tg[0].position).add(up(0.35 + 0.6 * dd)); f.userData.set('+500', 'green', 0.7, clamp(1 - (dd - 0.6) / 0.4, 0, 1)); }
      ctx.cam.move({ pos: L(-2.4, 1.3, 3.3), look: L(-6, 1.55, 1.9), fov: 44 }, { pos: L(-2.8, 1.25, 3.1), look: L(-6, 1.6, 1.95), fov: 42 }, clamp(lt / 1.8, 0, 1));
      tagText(ctx, 'COOL = UP', ctx.time('b03.w2'), Infinity, { y: 0.09, size: 96, fill: '#5bff6b', bg: 'rgba(10,40,14,0.85)' });
    },
  },
  // ── b03 "Do something cringe, it goes down."
  {
    name: 'cringe = down', start: 'b03.w6-0.1', set: 'town',
    setup(ctx) {
      dayTown(ctx);
      const L = T(ctx);
      putChar(ctx, 'bowtie', L(-10.4, 0, -1.5), L.yaw + PI / 2);
      putChar(ctx, 'x07', L(-6.8, 0, -2.6), L.yaw - PI / 2 + 0.4); putChar(ctx, 'x09', L(-7.2, 0, -0.2), L.yaw - PI / 2 - 0.3);
      ctx.store = { L, tg: tags(ctx, 3) };
    },
    update(ctx, lt) {
      const { L, tg } = ctx.store, t = ctx.t, b = ctx.cast.bowtie, tc = ctx.time('b03.w8'), td = ctx.time('b03.w11');
      const t0 = ctx.time('b03.w6') - 0.1;
      if (t < tc) { b.root.position.copy(L(-10.4 + WALK_SPEED * (t - t0), 0, -1.5)); b.root.rotation.set(0, L.yaw + PI / 2, 0); b.pose('walk', t); b.face('smile', t); }
      else {
        const x = -10.4 + WALK_SPEED * (tc - t0), k = ease.outCubic(clamp((t - tc) / 0.25, 0, 1));
        b.root.position.copy(L(x + 0.35 * k, 0, -1.5)); b.root.rotation.set(0.28 * k * (1 - 0.3 * clamp((t - tc - 0.4) / 0.5, 0, 1)), L.yaw + PI / 2, 0);
        b.pose('stunned', t); b.face('sweat', 0.4);
      }
      ctx.cast.x07.pose('pointLaugh', t); ctx.cast.x07.face('laugh', t); ctx.cast.x09.pose('laugh', t + 0.4); ctx.cast.x09.face('laugh', t);
      const k = clamp((t - td) / 0.25, 0, 1);
      placeTag(tg[0], b, { text: t < td ? '2,300' : '1,100', style: t < td ? 'gold' : 'red', w: 0.9, dy: 0.58 - 0.4 * Math.sin(PI * k) });
      placeTag(tg[1], ctx.cast.x07, { text: fmt(VAL.x07), w: 0.85 }); placeTag(tg[2], ctx.cast.x09, { text: fmt(VAL.x09), w: 0.85 });
      if (t > td) { const f = ctx.props.fly; ctx.add(f); const dd = t - td; f.position.copy(tg[0].position).add(up(0.3 - 0.5 * dd)); f.userData.set('-1,200', 'red', 0.75, clamp(1 - (dd - 0.5) / 0.3, 0, 1)); }
      ctx.cam.set({ pos: L(-6.6, 1.5, -4.6), look: L(-8.9, 1.75, -1.5), fov: 44 });
      tagText(ctx, 'CRINGE = DOWN', ctx.time('b03.w7'), Infinity, { y: 0.09, size: 92, fill: '#ff5a5a', bg: 'rgba(50,8,8,0.85)' });
    },
  },
  // ── b04 "Whoever has the most aura gets the golden throne."
  {
    name: 'golden throne', start: 'b04-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false }); goldFx(ctx, S); ctx.store = { S }; },
    update(ctx, lt) {
      const { S } = ctx.store; goldFxUpdate(ctx);
      ctx.cam.move({ pos: S(1.4, -0.2, 13.5), look: S(0, 3.2, 1.0), fov: 54 }, { pos: S(0.7, 0.0, 10.2), look: S(0, 3.3, 1.0), fov: 54 }, clamp(lt / 2.6, 0, 1), ease.inOutSine);
    },
  },
  // ── b05 "Kevin from the Goon Squad caught a falling phone without even looking. Plus five hundred."
  {
    name: 'kevin park', start: 'b05-0.1', set: 'town',
    setup(ctx) { ctx.store = { ...kevinPark(ctx), tg: tags(ctx, 3) }; ctx.add(ctx.props.sign); },
    update(ctx, lt) {
      const st = ctx.store, t = ctx.t, c = ctx.cast;
      kevinPose(ctx, c.kevin, t, 99); c.kevin.face('smug', t);
      for (const id of ['goon1', 'goon2']) { c[id].pose('crossArms', t + (id === 'goon1' ? 0 : 0.7)); c[id].face('smug', t); }
      const tg0 = ctx.markers.goon, nod = t > tg0 ? Math.max(0, Math.sin((t - tg0) * 9)) * Math.exp(-(t - tg0) * 1.5) : 0;
      c.goon1.joints.head.rotation.x += 0.3 * nod; c.goon2.joints.head.rotation.x += 0.3 * nod;
      phoneUpdate(ctx, st, t, 99, 199);
      placeTag(st.tg[0], c.kevin, { text: '9,500', w: 0.95 }); placeTag(st.tg[1], c.goon1, { text: '6,100', w: 0.85 }); placeTag(st.tg[2], c.goon2, { text: '5,800', w: 0.85 });
      const sg = ctx.props.sign; const mid = c.goon1.root.position.clone().lerp(c.goon2.root.position, 0.5);
      const pop = t > tg0 ? ease.outBack(clamp((t - tg0) / 0.25, 0, 1)) : 0;
      sg.position.copy(mid).add(up(2.75)); sg.userData.set('GOON SQUAD', 'sign', 2.2 * Math.max(0.01, pop), pop > 0 ? 1 : 0);
      const K = st.K;
      ctx.cam.move({ pos: K(-0.4, 1.6, 6.4), look: K(-0.3, 1.45, -0.2), fov: 44 }, { pos: K(-0.3, 1.55, 5.4), look: K(-0.3, 1.5, -0.2), fov: 44 }, clamp(lt / 1.7, 0, 1));
    },
  },
  {
    name: 'phone catch', start: 'b05.w6-0.1', set: 'town',
    setup(ctx) { ctx.store = { ...kevinPark(ctx), tg: tags(ctx, 1) }; },
    update(ctx, lt) {
      const st = ctx.store, t = ctx.t, kv = ctx.cast.kevin, tc = ctx.time('b05.w8') + 0.02;
      kevinPose(ctx, kv, t, tc); kv.face('smug', t);
      ctx.cast.goon1.pose('crossArms', t); ctx.cast.goon2.pose('crossArms', t + 0.7); ctx.cast.goon1.face('smug', t); ctx.cast.goon2.face('smug', t);
      phoneUpdate(ctx, st, t, ctx.time('b05.w6') - 0.05, tc);
      placeTag(st.tg[0], kv, { text: '9,500', w: 0.95 });
      const K = st.K;
      ctx.cam.set({ pos: K(1.0, 1.35, 3.0), look: K(-0.45, 1.1, 0.0), fov: 44 });
      if (Math.abs(t - tc) < 0.25) ctx.cam.punch([tc], t, 0.06, 0.2);
    },
  },
  {
    name: 'kevin +500', start: 'b05.w11-0.1', set: 'town',
    setup(ctx) { ctx.store = { ...kevinPark(ctx), tg: tags(ctx, 1) }; },
    update(ctx, lt) {
      const st = ctx.store, t = ctx.t, kv = ctx.cast.kevin, tp = ctx.markers.plus500;
      kevinPose(ctx, kv, t, 0); kv.face('smug', t);
      ctx.cast.goon1.pose('clap', t); ctx.cast.goon2.pose('clap', t + 0.3); ctx.cast.goon1.face('grin', t); ctx.cast.goon2.face('grin', t);
      phoneUpdate(ctx, st, t, 0, 0.1);
      const k = clamp((t - tp) / 0.25, 0, 1);
      placeTag(st.tg[0], kv, { text: t < tp ? '9,500' : '10,000', style: t > tp && t < tp + 0.8 ? 'green' : 'gold', w: 0.95 * (1 + 0.35 * Math.sin(PI * k)), dy: 0.58 + 0.3 * Math.sin(PI * k) });
      if (t > tp) { const f = ctx.props.fly; ctx.add(f); const dd = t - tp; f.position.copy(st.tg[0].position).add(up(0.35 + 1.1 * dd)); f.userData.set('+500', 'green', 0.9, clamp(1 - (dd - 0.6) / 0.3, 0, 1)); }
      const K = st.K, f = humanFace(kv);
      ctx.cam.move({ pos: K(0.55, 1.05, 2.3), look: f.clone().add(up(0.45)), fov: 44 }, { pos: K(0.45, 1.1, 1.9), look: f.clone().add(up(0.5)), fov: 44 }, clamp(lt / 1.8, 0, 1));
      stamp(ctx, '+500', tp, { fill: '#5bff6b', stroke: '#063a10', y: 0.15, size: 150 });
    },
  },
  // ── b06 "Mr. Patel waved back at someone who wasn't waving at him. Minus two thousand."
  {
    name: 'patel waves', start: 'b06-0.1', set: 'town',
    setup(ctx) { ctx.store = patelScene(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store; patelAnim(ctx, ctx.store);
      ctx.cam.move({ pos: L(-16.5, 1.95, -1.1), look: L(-12.6, 1.7, 1.0), fov: 38 }, { pos: L(-16.2, 1.9, -1.0), look: L(-12.6, 1.7, 1.0), fov: 36 }, clamp(lt / 2.4, 0, 1));
    },
  },
  {
    name: 'not at him', start: 'b06.w7-0.1', set: 'town',
    setup(ctx) { ctx.store = patelScene(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store; patelAnim(ctx, ctx.store, { freezeAt: ctx.time('b06.w8') });
      ctx.cam.move({ pos: L(-8.4, 1.75, 3.9), look: L(-13.0, 1.35, 0.8), fov: 44 }, { pos: L(-8.9, 1.7, 3.5), look: L(-13.0, 1.4, 0.8), fov: 42 }, clamp(lt / 1.4, 0, 1));
    },
  },
  {
    name: 'patel crash', start: 'minus2k-0.15', set: 'town',
    setup(ctx) { ctx.store = patelScene(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store; patelAnim(ctx, ctx.store, { freezeAt: ctx.time('b06.w8') });
      const f = humanFace(ctx.cast.patel);
      ctx.cam.set({ pos: L(-14.6, 1.7, 2.1), look: f.clone().add(up(0.5)), fov: 40 });
      stamp(ctx, '-2,000', ctx.markers.minus2k, { fill: '#ff3b30', stroke: '#ffffff', y: 0.14, size: 150 });
    },
  },
  // ── b07 HUSS ×3 — snap zooms on the frozen sweaty face
  ...[0, 1, 2].map((i) => ({
    name: `patel huss #${i + 1}`, start: i === 0 ? 'b07.h0-0.12' : `b07.h${i}-0.03`, set: 'town',
    setup(ctx) { ctx.store = patelScene(ctx); },
    update(ctx) {
      const { L } = ctx.store, hits = ctx.hussTimes('b07').map((h) => h + 0.03);
      patelAnim(ctx, ctx.store, { freezeAt: ctx.time('b06.w8') });
      const f = humanFace(ctx.cast.patel), d = [2.7, 1.9, 1.3][i], side = [0.25, -0.35, 0.1][i];
      ctx.cam.set({ pos: f.clone().add(L(-d, 0, side).sub(L(0, 0, 0))).add(up([0.25, 0.1, 0.0][i])), look: f.clone().add(up([0.35, 0.12, 0][i])), fov: 34 });
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2); ctx.cam.shake(0.12, ctx.t, 7 + i);
    },
  })),
  // ── b08 "And if your aura ever hits zero, you turn gray and walk in circles forever, saying, nice weather today."
  ...[0, 1].map((i) => ({
    name: i ? 'nice weather' : 'gray lamp circle', start: i ? 'b08.w15-0.1' : 'b08-0.1', set: 'town',
    setup(ctx) {
      duskTown(ctx);
      const L = T(ctx), ids = ['gx00', 'gx01', 'gx02', 'gx03', 'gx04', 'gx05', 'gx06'];
      ids.forEach((id) => ctx.place(id, L(-9, 0, -5.15)));
      ctx.store = { L, ids };
    },
    update(ctx, lt) {
      const { L, ids } = ctx.store, t = ctx.t, R = 1.7, cx = -9, cz = -5.15;
      const camA = i ? { pos: L(-11.8, 1.6, -1.6), look: L(-9.4, 1.35, -4.4), fov: 42 } : null;
      ids.forEach((id, k) => {
        const a = k / ids.length * PI * 2 + t * 0.16;
        const x = cx + R * Math.sin(a), z = cz + R * Math.cos(a);
        const ch = ctx.cast[id]; ch.root.position.copy(L(x, groundY(z), z)); ch.root.rotation.set(0, L.yaw + a + PI / 2, 0);
        const turner = i && k === 2 && t > ctx.time('b08.w16') - 0.3;
        grayWalker(ch, t, k * 0.7, { head: turner ? camA.pos : null });
      });
      if (!i) ctx.cam.move({ pos: L(-4.6, 2.2, 1.6), look: L(-9, 1.5, -5.0), fov: 46 }, { pos: L(-5.8, 1.9, -0.6), look: L(-9, 1.45, -5.1), fov: 44 }, clamp(lt / 3.8, 0, 1), ease.inOutSine);
      else ctx.cam.set(camA);
      fill(ctx, i ? camA.pos : L(-5.5, 2.0, -0.4), 1.2);
      ctx.fx.overlay('#3a2a50', 0.1);
    },
  })),
  // ── b09 "And me? I had twelve. The lowest in town."
  {
    name: 'bedroom twelve', start: 'b09-0.1', set: 'room',
    setup(ctx) {
      ctx.set.setLighting?.('night'); ctx.set.set?.('window', 'dark');
      const set = ctx.set; set.root.updateMatrixWorld(true);
      const R = (x, y, z) => set.root.localToWorld(V(x, y, z)), yaw = yawOf(set.root);
      putChar(ctx, 'me', R(-1.62, 0, -0.62), yaw + PI / 2);
      ctx.store = { R, tg: tags(ctx, 1) };
    },
    update(ctx, lt) {
      const { R, tg } = ctx.store, t = ctx.t, me = ctx.cast.me;
      me.pose('sit', t, { intensity: 0.3, headPitch: 0.25 }); me.face('sad', 0.6);
      me.joints.torso.rotation.x += 0.18;
      placeTag(tg[0], me, { text: '12', style: 'dim', w: 0.42 * (t > ctx.time('b09.w4') ? 1 : 0.9), alpha: flicker(t, 3), ringScale: 0.6 });
      const f = humanFace(me);
      ctx.cam.move({ pos: R(0.9, 1.2, 1.9), look: f.clone().add(up(0.15)), fov: 42 }, { pos: R(-0.3, 1.1, 0.8), look: f.clone().add(up(0.25)), fov: 40 }, clamp(lt / 2.9, 0, 1), ease.inOutSine);
      fill(ctx, R(-0.2, 1.4, 0.9), 0.9);
    },
  },
  // ── b10 "Because I sneezed during the school photo."
  {
    name: 'school photo', start: 'b10-0.1', set: 'town',
    setup(ctx) {
      const S = square(ctx, { fans: false });
      const ids = ['x05', 'x01', 'me', 'x08', 'x10'];
      ids.forEach((id, k) => putChar(ctx, id, S((k - 2) * 0.95, -0.8, 6.6 + Math.abs(k - 2) * 0.1), S.yaw));
      const P = ctx.props; ctx.add(P.photoCam); P.photoCam.position.copy(S(0.2, -0.8, 10.0)); P.photoCam.rotation.set(0, S.yaw + PI, 0);
      ctx.add(P.flash); P.flash.position.copy(S(0.2, 0.7, 9.7)); P.flash.rotation.set(0, S.yaw, 0);
      ctx.store = { S, ids, tg: tags(ctx, 1) };
    },
    update(ctx, lt) {
      const { S, ids, tg } = ctx.store, t = ctx.t, ts = ctx.time('b10.w2') + 0.12;
      ids.forEach((id, k) => { if (id === 'me') return; const c = ctx.cast[id]; c.pose('idle', t + k, { intensity: 0.3 }); c.face(t > ts + 0.15 ? 'shocked' : 'grin', 1); });
      const me = ctx.cast.me, k = clamp((t - ts) / 0.08, 0, 1) * clamp(1 - (t - ts - 0.35) / 0.4, 0, 1);
      me.pose('idle', t, { intensity: 0.3 }); me.joints.head.rotation.x += 0.55 * k; me.joints.torso.rotation.x += 0.3 * k;
      me.face(t < ts - 0.25 ? 'grin' : t < ts ? 'squint' : 'shocked', 1);
      const fk = t > ts ? Math.exp(-(t - ts) * 9) : 0;
      ctx.props.flash.userData.set(fk);
      if (fk > 0.02) ctx.fx.overlay('#ffffff', 0.85 * fk);
      const drop = clamp((t - ts - 0.25) / 0.35, 0, 1);
      placeTag(tg[0], me, { text: t < ts + 0.25 ? '312' : fmt(312 - 300 * ease.outCubic(drop)), style: t < ts + 0.25 ? 'gold' : 'red', w: 0.8, dy: 0.5 - 0.25 * Math.sin(PI * drop) });
      ctx.cam.set({ pos: S(1.25, 0.75, 11.3), look: S(0, 0.25, 6.6), fov: 38 });
      ctx.fx.overlay('#ffd9a0', 0.12); ctx.fx.vignette(0.35);
      tagText(ctx, 'FLASHBACK', ctx.time('b10') - 0.1, Infinity, { y: 0.07, size: 54, bg: 'rgba(60,40,10,0.75)' });
      if (t > ts + 0.25) stamp(ctx, '-300', ts + 0.25, { fill: '#ff3b30', stroke: '#ffffff', y: 0.22, size: 160 });
    },
  },
  // ── b11 "Yesterday, something went terribly wrong. I tripped on the stage in front of the whole town."
  {
    name: 'stage walk', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      const S = square(ctx); const C = crowdSetup(ctx, S, { tagged: false, ids: ['x01', 'x02', 'patel', 'grandma', 'x03', 'wanda', 'friend', 'bowtie', 'x05', 'x06', 'x09', 'x10', 'x11', 'x12'] });
      ctx.place('me', S(3.3, 0, LANE)); ctx.store = { S, C, tg: tags(ctx, 1, 30) };
    },
    update(ctx, lt) {
      const { S, C, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, t0 = ctx.time('b11') - 0.1;
      crowdAnim(ctx, C, 'watch');
      me.root.position.copy(S(3.3 - WALK_SPEED * (t - t0), 0, LANE)); me.root.rotation.set(0, S.yaw - PI / 2, 0);
      me.pose('walk', t); me.face('smile', t);
      placeTag(tg[0], me, { text: '12', style: 'dim', w: 0.6 });
      ctx.cam.move({ pos: S(3.4, 3.4, 9.6), look: me.root.position.clone().add(up(0.9)), fov: 40 }, { pos: S(2.6, 3.2, 9.0), look: me.root.position.clone().add(up(0.9)), fov: 40 }, clamp(lt / 2.4, 0, 1));
    },
  },
  {
    name: 'trip', start: 'b11.w6-0.1', set: 'town',
    setup(ctx) { const S = square(ctx); ctx.place('me', S(1, 0, LANE)); ctx.store = { S, tg: tags(ctx, 1, 30) }; },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, t0 = ctx.time('b11') - 0.1, ttrip = ctx.time('b11.w6') + 0.05;
      const xTrip = 3.3 - WALK_SPEED * (ttrip - t0);
      if (t < ttrip) { me.root.position.copy(S(3.3 - WALK_SPEED * (t - t0), 0, LANE)); me.root.rotation.set(0, S.yaw - PI / 2, 0); me.pose('walk', t); me.face('smile', t); }
      else {
        const k = ease.inCubic(clamp((t - ttrip) / 0.36, 0, 1)), bounce = t > ttrip + 0.36 ? 0.06 * Math.exp(-(t - ttrip - 0.36) * 9) * Math.abs(Math.sin((t - ttrip - 0.36) * 20)) : 0;
        kidLie(ctx, S, { pitch: (PI / 2) * k - bounce, feetX: xTrip });
        me.pose(k < 1 ? 'surprised' : 'stunned', t); me.face('shocked', 1);
      }
      placeTag(tg[0], me, { text: '12', style: 'dim', w: 0.6 });
      const imp = ttrip + 0.36;
      ctx.cam.set({ pos: S(-2.6, 0.55, 5.4), look: S(0.6, 0.6, LANE), fov: 42 });
      ctx.cam.punch([imp], t, 0.12, 0.25); if (t > imp && t < imp + 0.3) ctx.cam.shake(0.4 * (1 - (t - imp) / 0.3), t, 5);
    },
  },
  {
    name: 'whole town gasps', start: 'b11.w11-0.05', set: 'town',
    setup(ctx) { const S = square(ctx); const C = crowdSetup(ctx, S); kidLie(ctx, S); ctx.store = { S, C }; },
    update(ctx, lt) {
      const { S, C } = ctx.store; crowdAnim(ctx, C, 'shocked', { t0: ctx.time('b11.w11') });
      ctx.cast.me.pose('stunned', ctx.t);
      ctx.cam.move({ pos: S(-1.2, 1.3, 3.2), look: S(0.2, 0.9, 8.0), fov: 46 }, { pos: S(-1.0, 1.25, 3.4), look: S(0.2, 0.95, 8.0), fov: 44 }, clamp(lt / 1.3, 0, 1));
    },
  },
  // ── b12 "My number started dropping. Twelve. Eight. Three..."
  {
    name: 'dropping', start: 'b12-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false }); kidLie(ctx, S); ctx.store = { S, tg: tags(ctx, 1, 30) }; },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, M = ctx.markers;
      me.pose('stunned', t, { intensity: 0.3 });
      const n = t < M.n8 ? 12 : t < M.n3 ? 8 : 3, last = t < M.n12 ? null : t < M.n8 ? M.n12 : t < M.n3 ? M.n8 : M.n3;
      const k = last != null ? clamp((t - last) / 0.2, 0, 1) : 1;
      placeTag(tg[0], me, { text: String(n), style: t < M.n12 - 0.4 ? 'dim' : 'red', w: 0.75 * (1 + 0.25 * Math.sin(PI * k)), alpha: t > M.n12 ? flicker(t, 1) : 1, dy: 0.7 - 0.12 * Math.sin(PI * k) });
      const hp = headC(me);
      ctx.cam.move({ pos: S(-3.6, 1.6, 5.0), look: S(-0.1, 0.55, LANE), fov: 40 }, { pos: S(-3.0, 1.35, 4.6), look: S(-0.3, 0.6, LANE), fov: 38 }, clamp(lt / 3.4, 0, 1));
      ctx.cam.punch([M.n12, M.n8, M.n3], t, 0.06, 0.2);
      for (const [mk, s] of [[M.n12, '12...'], [M.n8, '8...'], [M.n3, '3...']]) if (t > mk && t < mk + 0.7) stamp(ctx, s, mk, { fill: '#ff3b30', stroke: '#ffffff', y: 0.16, size: 150, noShake: true });
    },
  },
  // ── b13 "One. Ah, almost. Almost."
  {
    name: 'one', start: 'b13-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false }); kidLie(ctx, S); ctx.store = { S, tg: tags(ctx, 1, 30) }; },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, ta = ctx.markers.almost;
      me.pose('stunned', t, { intensity: 0.3 });
      placeTag(tg[0], me, { text: '1', style: 'red', w: 0.75, alpha: flicker(t * 1.3, 5), dy: 0.7 });
      const tp = tg[0].position.clone().add(up(0.12));
      ctx.cam.move({ pos: tp.clone().add(S(-0.5, -0.1, 2.2).sub(S(0, 0, 0))), look: tp, fov: 34 }, { pos: tp.clone().add(S(-0.3, -0.05, 1.25).sub(S(0, 0, 0))), look: tp, fov: 32 }, clamp(lt / 2.4, 0, 1), ease.inOutSine);
      ctx.fx.vignette(clamp(0.45 + 0.5 * (t - ctx.time('b13')) / 2.4, 0, 1));
      ctx.fx.overlay('#000000', clamp((t - ta) / 1.5, 0, 0.35));
      tagText(ctx, '1', ctx.time('b13.w0'), Infinity, { y: 0.14, size: 130, fill: '#ff3b30', stroke: '#ffffff', bg: null });
      if (t > ta) tagText(ctx, 'ALMOST', ta, Infinity, { y: 0.25, size: 110, fill: '#ffffff', bg: 'rgba(160,0,20,0.9)' });
      ctx.cam.punch([ta], t, 0.08, 0.3);
    },
  },
  // ── b14 HUSS ×3 — shocked faces: Kevin lowers his shades, Mr. Patel, Grandma
  ...['kevin', 'patel', 'grandma'].map((who, i) => ({
    name: `gasp ${who}`, start: i === 0 ? 'b14.h0-0.12' : `b14.h${i}-0.03`, set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false }); const C = crowdSetup(ctx, S, { tagged: false }); ctx.store = { S, C, tg: tags(ctx, 1, 30) }; },
    update(ctx) {
      const { S, C, tg } = ctx.store, t = ctx.t, hits = ctx.hussTimes('b14').map((h) => h + 0.03), h = hits[i];
      crowdAnim(ctx, C, 'stunned');
      const ch = ctx.cast[who]; ch.pose('idle', t, { intensity: 0.2 }); ch.face('shocked', 1);
      if (who === 'kevin') {
        const k = ease.outCubic(clamp((t - h) / 0.15, 0, 1)), s = ctx.props.shades[0];
        s.position.set(SHADES_POS[0], SHADES_POS[1] - 0.12 * k, SHADES_POS[2] + 0.04 * k);
        const J = ch.joints; J.armR.rotation.x += -2.3 * k * 0.9; J.armR.rotation.z += 0.3; if (J.foreArmR) J.foreArmR.rotation.x += -1.4 * k;
      }
      if (who === 'grandma') mouthCover(ch, ease.outCubic(clamp((t - h + 0.05) / 0.12, 0, 1)));
      if (who === 'patel') { ch.pose('surprised', 0.25); ch.face('shocked', 1); }
      placeTag(tg[0], ch, { text: fmt(VAL[who]), w: 0.85 });
      const f = humanFace(ch), fw = S(0, 0, -1).sub(S(0, 0, 0));
      const side = [0.35, -0.3, 0.25][i];
      ctx.cam.set({ pos: f.clone().addScaledVector(fw, 1.75).add(S(side, 0, 0).sub(S(0, 0, 0))).add(up(0.05)), look: f.clone().add(up(0.12)), fov: 36 });
      ctx.cam.punch(hits, t, 0.1, 0.2);
    },
  })),
  // ── b15 "One aura point left. Everyone backed away like I was contagious."
  {
    name: 'backed away', start: 'b15-0.1', set: 'town',
    setup(ctx) { const S = square(ctx); const C = crowdSetup(ctx, S); kidLie(ctx, S); ctx.store = { S, C, tg: tags(ctx, 1, 30) }; },
    update(ctx, lt) {
      const { S, C, tg } = ctx.store, t = ctx.t, tb = ctx.time('b15.w5'), me = ctx.cast.me;
      me.pose('stunned', t, { intensity: 0.3 });
      const ctr = S(0, -0.8, 3.0);
      C.list.forEach((c, i) => {
        const k = ease.inOutSine(clamp((t - tb - 0.05 * (i % 6)) / 1.6, 0, 1));
        const dir = c.p.clone().sub(ctr); dir.y = 0; dir.normalize();
        c.ch.root.position.copy(c.p).addScaledVector(dir, 3.2 * k);
        if (k > 0 && k < 1) { c.ch.pose('walk', -t * 1.1 + c.ph, { speed: 0.8 }); c.ch.face('sweat', 0.4); }
        else if (k >= 1) { c.ch.pose(i % 3 === 0 ? 'crossArms' : i % 3 === 1 ? 'peer' : 'idle', t + c.ph); c.ch.face(i % 2 ? 'squint' : 'sweat', 0.4); }
        else { c.ch.pose('idle', t + c.ph); c.ch.face('shocked', 1); }
      });
      if (C.tg.length) C.list.forEach((c, i) => placeTag(C.tg[i], c.ch, { text: fmt(VAL[c.id]), w: 0.85 }));
      placeTag(tg[0], me, { text: '1', style: 'red', w: 0.9, alpha: flicker(t, 2) });
      ctx.cam.move({ pos: S(-6.5, 7.5, 13.5), look: S(0, 0.0, 5.0), fov: 46 }, { pos: S(-6.0, 8.2, 14.5), look: S(0, 0.0, 5.5), fov: 48 }, clamp(lt / 3.5, 0, 1));
    },
  },
  // ── b16 "Then a pigeon walked right past me. Didn't care. Not even a little. That's it. The coolest thing you can do is not care."
  {
    name: 'pigeon walks past', start: 'b16-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false }); kidLie(ctx, S); ctx.place('pigeon', S(0, 0, 2.2)); ctx.store = { S, tg: tags(ctx, 2, 30) }; },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, p = ctx.cast.pigeon, t0 = ctx.markers.pigeon16 - 0.3;
      me.pose('stunned', t, { intensity: 0.2 }); me.joints.head.rotation.x -= 1.05; me.joints.torso.rotation.x -= 0.25;
      const hp = headC(me);
      me.face('sad', 0.5);
      void hp;
      const z = Math.min(3.2, 2.5 + 0.32 * Math.max(0, t - ctx.time('b16') + 0.05));
      p.root.position.copy(S(FEET_X - 2.45, 0, z)); p.root.rotation.set(0, S.yaw, 0);
      p.pose('strut', t); p.face('neutral', 0.5);
      placeTag(tg[0], p, { text: '???', style: 'blur', w: 0.75, dy: 0.55, ring: false });
      placeTag(tg[1], me, { text: '1', style: 'red', w: 0.6, alpha: flicker(t, 4), dy: 0.62, ring: false });
      const look = S(FEET_X - 2.3, 0.36, LANE);
      ctx.cam.set({ pos: S(FEET_X - 4.6, 0.42, LANE + 0.15), look, fov: 36 });
    },
  },
  {
    name: 'pigeon blank', start: 'b16.w7-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false }); kidLie(ctx, S); ctx.place('pigeon', S(0, 0, 2.2)); ctx.store = { S, tg: tags(ctx, 1, 30) }; },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, p = ctx.cast.pigeon, t0 = ctx.markers.pigeon16 - 0.3;
      me.pose('stunned', t, { intensity: 0.2 }); me.joints.head.rotation.x -= 1.05; me.joints.torso.rotation.x -= 0.25; me.face('sad', 0.5);
      const z = Math.min(3.2, 2.5 + 0.32 * Math.max(0, t - ctx.time('b16') + 0.05));
      p.root.position.copy(S(FEET_X - 2.45, 0, z)); p.root.rotation.set(0, S.yaw - 0.9, 0);
      p.pose('idle', t); p.face('neutral', 0.5);
      placeTag(tg[0], p, { text: '???', style: 'blur', w: 0.75, dy: 0.55 });
      const pc = headC(p);
      ctx.cam.move({ pos: pc.clone().add(S(-0.95, 0.02, 0.55).sub(S(0, 0, 0))), look: pc.clone().add(up(-0.04)), fov: 34 }, { pos: pc.clone().add(S(-0.75, 0.02, 0.45).sub(S(0, 0, 0))), look: pc.clone().add(up(-0.04)), fov: 32 }, clamp(lt / 1.0, 0, 1));
    },
  },
  {
    name: 'kid copies', start: 'b16.w13-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false }); kidLie(ctx, S); ctx.store = { S, tg: tags(ctx, 1, 30) }; },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, tc = ctx.markers.copy;
      me.pose('stunned', t, { intensity: 0.2 }); me.joints.head.rotation.x -= 1.05; me.joints.torso.rotation.x -= 0.25;
      me.face(t < tc - 0.6 ? 'sad' : t < tc + 0.5 ? 'determined' : 'smug', 0.5);
      placeTag(tg[0], me, { text: '1', style: 'red', w: 0.6, alpha: flicker(t, 4), dy: 0.62, ring: false });
      const f = humanFace(me);
      ctx.cam.move({ pos: f.clone().add(S(-1.7, 0.12, 0.25).sub(S(0, 0, 0))), look: f.clone().add(up(0.1)), fov: 36 }, { pos: f.clone().add(S(-1.25, 0.1, 0.2).sub(S(0, 0, 0))), look: f.clone().add(up(0.12)), fov: 34 }, clamp(lt / 2.6, 0, 1));
    },
  },
  // ── b17 "So I lay there, looked up at the sky, and said, I don't care about aura."
  {
    name: 'roll over', start: 'b17-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false }); kidLie(ctx, S); ctx.store = { S, tg: tags(ctx, 1, 30) }; },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, tr = ctx.time('b17.w2');
      const k = ease.inOutCubic(clamp((t - tr) / 0.55, 0, 1));
      kidLie(ctx, S, { roll: PI * k });
      me.pose('stunned', t, { intensity: 0.2 });
      if (k > 0.5) armsBehindHead(me, clamp((k - 0.5) * 2.5, 0, 1));
      me.face(k > 0.8 ? 'sleepy' : 'sad', 0.5);
      placeTag(tg[0], me, { text: '1', style: 'red', w: 0.6, alpha: flicker(t, 4), dy: 0.62, ring: false });
      const c = S(FEET_X - 0.9, 0, LANE);
      ctx.cam.move({ pos: c.clone().add(up(4.4)).add(S(0.5, 0, 0).sub(S(0, 0, 0))), look: c.clone().add(S(-0.1, 0, 0).sub(S(0, 0, 0))), fov: 46 }, { pos: c.clone().add(up(3.9)).add(S(0.45, 0, 0).sub(S(0, 0, 0))), look: c.clone().add(S(-0.1, 0, 0).sub(S(0, 0, 0))), fov: 46 }, clamp(lt / 1.6, 0, 1));
    },
  },
  {
    name: 'sky', start: 'b17.w8-0.15', set: 'town',
    setup(ctx) {
      const S = square(ctx, { fans: false, banner: false }); kidLie(ctx, S, { roll: PI });
      const P = ctx.props; P.clouds.forEach((c) => ctx.add(c));
      ctx.store = { S, tg: tags(ctx, 1, 30) };
    },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      me.pose('stunned', t, { intensity: 0.2 }); armsBehindHead(me);
      const f = humanFace(me);
      P.clouds.forEach((c, i) => { c.position.copy(f).add(S(-6 + i * 4.2 + lt * 0.9, 16 + 3 * hash(i), (hash(i * 3) - 0.5) * 9).sub(S(0, 0, 0))); c.scale.setScalar(1.6 + hash(i * 7)); });
      const wob = 0.12 * Math.sin(t * 5);
      placeTag(tg[0], me, { text: '1', style: 'red', w: 0.6, alpha: 0, dy: 0.62 });
      tg[0].position.add(S(wob, 0, 0).sub(S(0, 0, 0)));
      ctx.cam.set({ pos: f.clone().add(up(0.05)).add(S(1.2, 0, 0).sub(S(0, 0, 0))), look: f.clone().add(up(5)).add(S(0.3, 0, 2.4).sub(S(0, 0, 0))), fov: 66 });
    },
  },
  {
    name: "don't care", start: 'b17.w11-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false }); kidLie(ctx, S, { roll: PI }); ctx.store = { S, tg: tags(ctx, 1, 30) }; },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me;
      me.pose('stunned', t, { intensity: 0.2 }); armsBehindHead(me); me.face('sleepy', 0.5);
      placeTag(tg[0], me, { text: '1', style: 'red', w: 0.6, alpha: flicker(t, 4), dy: 0.7 + 0.05 * Math.sin(t * 6), ring: false });
      const f = humanFace(me);
      ctx.cam.move({ pos: f.clone().add(up(2.7)).add(S(0.9, 0, 1.4).sub(S(0, 0, 0))), look: f.clone().add(up(0.3)).add(S(0.3, 0, 0).sub(S(0, 0, 0))), fov: 40 }, { pos: f.clone().add(up(2.4)).add(S(0.8, 0, 1.2).sub(S(0, 0, 0))), look: f.clone().add(up(0.3)).add(S(0.3, 0, 0).sub(S(0, 0, 0))), fov: 40 }, clamp(lt / 1.2, 0, 1));
    },
  },
  // ── b18 "My number exploded. One. Million."
  {
    name: 'number charging', start: 'b18-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { fans: false, banner: false }); kidLie(ctx, S, { roll: PI }); ctx.store = { S, tg: tags(ctx, 1, 30) }; },
    update(ctx, lt) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, te = ctx.time('b18.w2');
      me.pose('stunned', t, { intensity: 0.2 }); armsBehindHead(me); me.face(t > te ? 'smug' : 'sleepy', 0.5);
      const k = clamp((t - te) / 0.8, 0, 1);
      placeTag(tg[0], me, { text: '1', style: t > te ? 'gold' : 'red', w: 0.6 * (1 + 0.9 * k), alpha: t > te ? 1 : flicker(t, 4), dy: 0.62 + 0.15 * k, ringScale: 1 + 0.6 * k });
      if (t > te) { tg[0].position.add(V(0.03 * k * Math.sin(t * 60), 0.03 * k * Math.sin(t * 47), 0)); ctx.cam.shake(0.15 + 0.3 * k, t, 3); }
      const f = humanFace(me);
      ctx.cam.set({ pos: f.clone().add(up(1.4)).add(S(0.6, 0, 2.7).sub(S(0, 0, 0))), look: f.clone().add(up(0.55)).add(S(0.4, 0, 0).sub(S(0, 0, 0))), fov: 44 });
      if (t > te) ctx.fx.overlay('#ffcc33', 0.12 * k);
    },
  },
  {
    name: 'one million', start: 'b18.w3-0.1', set: 'town',
    setup(ctx) {
      const S = square(ctx, { banner: false }); const C = crowdSetup(ctx, S); kidLie(ctx, S, { roll: PI });
      giant(ctx, S, 'mil'); goldFx(ctx, S, { sparkles: false });
      ctx.store = { S, C, tg: tags(ctx, 1, 30) };
    },
    update(ctx, lt) {
      const { S, C, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, tm = ctx.markers.million, P = ctx.props;
      me.pose('stunned', t, { intensity: 0.2 }); armsBehindHead(me); me.face('smug', 0.5);
      const k = t > tm ? ease.outBack(clamp((t - tm) / 0.35, 0, 1)) : 0;
      P.mil.userData.set(t, { k }); P.bigBeams.userData.set(t, clamp((t - tm) / 0.3, 0, 1)); goldFxUpdate(ctx, clamp((t - tm) / 0.3, 0, 1));
      const blow = t > tm ? ease.outCubic(clamp((t - tm) / 0.4, 0, 1)) : 0;
      const ctr = S(0, -0.8, 3.0);
      C.list.forEach((c, i) => {
        const dir = c.p.clone().sub(ctr); dir.y = 0; dir.normalize();
        c.ch.root.position.copy(c.p).addScaledVector(dir, 0.9 * blow);
        c.ch.root.rotation.set(-0.25 * blow * Math.exp(-(t - tm) * 2), c.yaw, 0);
        if (t > tm) { c.ch.pose('surprised', 0.3 + c.ph * 0.1); c.ch.face('shocked', 1); } else { c.ch.pose('idle', t + c.ph); c.ch.face('neutral', t + c.ph); }
      });
      C.list.forEach((c, i) => placeTag(C.tg[i], c.ch, { text: fmt(VAL[c.id]), w: 0.85 }));
      placeTag(tg[0], me, { text: t > tm ? '1,000,000' : '1', style: 'gold', w: t > tm ? 1.5 : 1.0, dy: 0.7 });
      ctx.cam.move({ pos: S(1.2, 1.6, 22.5), look: S(0, 5.0, 2.0), fov: 56 }, { pos: S(1.0, 1.6, 21.5), look: S(0, 5.2, 2.0), fov: 56 }, clamp(lt / 1.4, 0, 1));
      if (t > tm) { ctx.fx.overlay('#fff4c0', 0.7 * Math.exp(-(t - tm) * 6)); stamp(ctx, '1,000,000', tm, { y: 0.14, size: 140 }); }
    },
  },
  // ── b19 "Victory chant. Saibao! Ela des! Ela sobi! Nubani!"
  ...[
    { name: 'victory chant', start: 'b19-0.1', word: null },
    { name: 'SAIBAO', start: 'saibao-0.1', word: ['SAIBAO!', '#ff4fa3', 'saibao'] },
    { name: 'ELA DES', start: 'b19.w3-0.08', word: ['ELA DES!', '#3ee0c8', 'b19.w3'] },
    { name: 'ELA SOBI', start: 'b19.w5-0.08', word: ['ELA SOBI!', '#ffd23f', 'b19.w5'] },
    { name: 'NUBANI', start: 'nubani-0.08', word: ['NUBANI!', '#b07bff', 'nubani'] },
  ].map((sh, i) => ({
    name: sh.name, start: sh.start, set: 'town',
    setup(ctx) {
      const S = square(ctx, { banner: false }); giant(ctx, S, 'mil'); goldFx(ctx, S);
      ctx.place('me', S(0, 0, LANE)); ctx.cast.me.root.rotation.set(0, S.yaw, 0);
      const C = i === 0 || i === 3 ? crowdSetup(ctx, S, { tagged: i === 0 }) : null;
      ctx.store = { S, C, tg: tags(ctx, 1, 30) };
    },
    update(ctx, lt) {
      const { S, C, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      P.mil.userData.set(t); P.bigBeams.userData.set(t, 1); goldFxUpdate(ctx);
      me.pose(i % 2 ? 'dance2' : 'dance', t, { speed: 1.35, intensity: 1 }); me.face(i === 0 ? 'grin' : 'huss', t);
      me.root.position.copy(S(0, 0.12 * Math.abs(Math.sin(t * 7)), LANE));
      if (C) crowdAnim(ctx, C, 'clap');
      placeTag(tg[0], me, { text: '1,000,000', w: 1.25 });
      const cams = [
        { pos: S(1.8, 1.4, 8.4), look: S(0, 1.9, LANE), fov: 44 },
        { pos: S(-0.8, 0.15, 5.6), look: S(0, 2.3, LANE), fov: 50 },
        { pos: S(2.6, 2.6, 5.4), look: S(0, 1.1, LANE), fov: 42 },
        { pos: S(-1.6, 1.25, 10.5), look: S(0, 2.2, LANE), fov: 40 },
        { pos: S(0.35, 1.05, 5.3), look: S(0, 1.5, LANE), fov: 38 },
      ];
      ctx.cam.set(cams[i]);
      if (sh.word) { const tw = ctx.time(sh.word[2]); ctx.cam.punch([tw], t, 0.14, 0.25); stamp(ctx, sh.word[0], tw, { fill: sh.word[1], stroke: '#14182a', y: 0.2, size: 160, rot: i % 2 ? 0.1 : -0.1 }); }
    },
  })),
  // ── b20 HUSS ×6 — fast cuts: dance, jaws drop, Kevin's shades fall, Mr. Patel claps, the giant number, the dance again
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `huss party #${i + 1}`, start: i === 0 ? 'b20.h0-0.12' : `b20.h${i}-0.03`, set: 'town',
    setup(ctx) {
      const S = square(ctx, { banner: false }); giant(ctx, S, 'mil'); goldFx(ctx, S);
      ctx.place('me', S(0, 0, LANE)); ctx.cast.me.root.rotation.set(0, S.yaw, 0);
      const C = i === 1 || i === 2 || i === 3 ? crowdSetup(ctx, S, { tagged: false }) : null;
      ctx.store = { S, C, tg: tags(ctx, 1, 30) };
    },
    update(ctx) {
      const { S, C, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, hits = ctx.hussTimes('b20').map((h) => h + 0.03), h = hits[i];
      P.mil.userData.set(t); P.bigBeams.userData.set(t, 1); goldFxUpdate(ctx);
      const hit = lastBefore(hits, t), near = hit != null && t - hit < 0.2;
      me.pose(i % 2 ? 'dance2' : 'dance', t, { speed: 1.4, intensity: 1 }); me.face(near ? 'huss' : 'grin', t);
      me.root.position.copy(S(0, (i === 0 ? 0.35 : 0.12) * Math.abs(Math.sin((t - h) * 6)), LANE));
      placeTag(tg[0], me, { text: '1,000,000', w: 1.25 });
      if (C) crowdAnim(ctx, C, i === 3 ? 'clap' : 'stunned');
      let cam;
      if (i === 0) cam = { pos: S(0.4, 0.1, 6.2), look: S(0, 2.6, LANE), fov: 52 };
      else if (i === 1) cam = { pos: S(0.6, 1.3, 3.9), look: S(-0.4, 1.2, 7.0), fov: 44 };
      else if (i === 2) {
        const kv = ctx.cast.kevin; kv.pose('surprised', 0.3); kv.face('shocked', 1);
        const s = P.shades[0], k = clamp((t - h) / 0.35, 0, 1);
        s.position.set(SHADES_POS[0], SHADES_POS[1] - 0.9 * k * k, SHADES_POS[2] + 0.3 * k); s.rotation.set(2.5 * k, 0, 0.8 * k);
        const f = humanFace(kv), fw = S(0, 0, -1).sub(S(0, 0, 0));
        cam = { pos: f.clone().addScaledVector(fw, 1.7).add(up(0.0)), look: f.clone().add(up(-0.1)), fov: 38 };
      } else if (i === 3) {
        const pt = ctx.cast.patel; pt.pose('clap', t, { speed: 1.5 }); pt.face('grin', t);
        const f = humanFace(pt), fw = S(0, 0, -1).sub(S(0, 0, 0));
        cam = { pos: f.clone().addScaledVector(fw, 2.1).add(S(-0.4, 0, 0).sub(S(0, 0, 0))).add(up(-0.3)), look: f.clone().add(up(-0.35)), fov: 38 };
      } else if (i === 4) { cam = { pos: S(0.5, 1.5, 10.5), look: S(0, 7.6, 3.8), fov: 54 }; ctx.cam.shake(0.6, t, 11); }
      else cam = { pos: humanFace(me).add(S(0.5, 0.1, 1.6).sub(S(0, 0, 0))), look: humanFace(me).add(up(0.1)), fov: 38 };
      ctx.cam.set(cam); ctx.cam.punch(hits, t, 0.12, 0.2);
    },
  })),
  // ── b21 "Everyone wanted my secret. So the whole town shouted, I don't care about aura!"
  {
    name: 'wanted my secret', start: 'b21-0.1', set: 'town',
    setup(ctx) {
      const S = square(ctx, { banner: false }); giant(ctx, S, 'mil'); goldFx(ctx, S, { sparkles: false });
      ctx.place('me', S(0, 0, LANE)); ctx.cast.me.root.rotation.set(0, S.yaw, 0);
      ctx.store = { S, C: crowdSetup(ctx, S), tg: tags(ctx, 1, 30) };
    },
    update(ctx, lt) {
      const { S, C, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      P.mil.userData.set(t); P.bigBeams.userData.set(t, 1); goldFxUpdate(ctx, 0.7);
      me.pose('crossArms', t); me.face('smug', t);
      C.list.forEach((c) => { c.ch.root.position.copy(c.p).add(S(0, 0, -0.5 * clamp(lt / 1.2, 0, 1)).sub(S(0, 0, 0))); });
      crowdAnim(ctx, C, 'peer');
      placeTag(tg[0], me, { text: '1,000,000', w: 1.25 });
      ctx.cam.move({ pos: S(0.9, 2.15, 1.5), look: S(-0.3, 1.0, 8.0), fov: 46 }, { pos: S(0.8, 2.1, 1.9), look: S(-0.3, 1.0, 8.0), fov: 44 }, clamp(lt / 1.6, 0, 1));
    },
  },
  {
    name: 'whole town shouts', start: 'b21.w4-0.1', set: 'town',
    setup(ctx) { const S = square(ctx, { banner: false }); giant(ctx, S, 'mil'); ctx.store = { S, C: crowdSetup(ctx, S, { ids: CROWD.map((c) => c[0]).filter((id) => id !== 'x02') }) }; },
    update(ctx, lt) {
      const { S, C } = ctx.store, t = ctx.t, P = ctx.props;
      P.mil.userData.set(t); P.bigBeams.userData.set(t, 1);
      crowdAnim(ctx, C, 'cheer', { face: t > ctx.time('b21.w9') - 0.1 ? 'huss' : 'determined' });
      ctx.cam.move({ pos: S(0.6, -0.2, 3.8), look: S(-0.2, 2.4, 9.0), fov: 60 }, { pos: S(0.5, -0.25, 3.9), look: S(-0.2, 2.7, 9.0), fov: 62 }, clamp(lt / 2.4, 0, 1));
      tagText(ctx, '"I DON\'T CARE ABOUT AURA!"', ctx.time('b21.w9'), Infinity, { y: 0.16, size: 66, fill: '#ffffff', bg: 'rgba(20,20,30,0.82)' });
    },
  },
  // ── b22 "But they were lying. Zero. Zero. Zero."
  {
    name: 'zero zero zero', start: 'b22-0.1', set: 'town',
    setup(ctx) {
      const S = square(ctx, { banner: false, fans: false });
      const line = ['x00', 'kevin', 'x01', 'x02', 'patel', 'x03', 'grandma', 'x04', 'x05'];
      const L = line.map((id, k) => {
        const p = S(-4.8 + k * 1.2, -0.8, 6.3 + (hash(k) - 0.5) * 0.15), yaw = S.yaw + PI + (hash(k * 2) - 0.5) * 0.3;
        const ch = putChar(ctx, id, p, yaw); const g = putChar(ctx, 'g' + id, p, yaw);
        return { id, ch, g, p, yaw, k };
      });
      shadesOn(ctx, 'kevin', 0);
      ctx.store = { S, L, tg: tags(ctx, line.length) };
    },
    update(ctx, lt) {
      const { S, L, tg } = ctx.store, t = ctx.t, z = [ctx.time('b22.w4'), ctx.time('b22.w5'), ctx.time('b22.w6')];
      L.forEach((c, k) => {
        const hit = z[Math.floor(k / 3)] + 0.11 * (k % 3), gray = t > hit + 0.12;
        c.ch.root.visible = !gray; c.g.root.visible = gray;
        if (!gray) { c.ch.pose('cheer', t + k * 0.3, { speed: 1.2 }); c.ch.face(t > hit ? 'shocked' : 'sweat', 0.4); }
        else { c.g.pose('idle', t + k, { intensity: 0.2 }); c.g.face('sleepy', 1.3); }
        const pop = clamp((t - hit) / 0.12, 0, 1);
        if (t < hit) placeTag(tg[k], c.ch, { text: fmt(VAL[c.id]), w: 0.85 });
        else placeTag(tg[k], gray ? c.g : c.ch, { text: '0', style: 'red', w: 0.85 * (1 + 0.5 * Math.sin(PI * pop)), alpha: clamp(1 - (t - hit - 0.45) / 0.3, 0, 1) });
      });
      ctx.cam.move({ pos: S(-3.9, 1.0, 3.9), look: S(-0.6, 1.15, 6.3), fov: 44 }, { pos: S(-1.6, 1.0, 4.0), look: S(1.6, 1.15, 6.3), fov: 44 }, clamp(lt / 3.0, 0, 1), ease.inOutSine);
      z.forEach((zt) => { if (t > zt && t < zt + 0.6) stamp(ctx, '0', zt, { fill: '#ff3b30', stroke: '#ffffff', y: 0.17, size: 220, noShake: true }); });
      ctx.cam.punch(z, t, 0.08, 0.2);
    },
  },
  // ── b23 "Now the whole town walks in circles, saying nice weather today."   (dusk; gray circle in front of the stage)
  ...[0, 1, 2].map((i) => ({
    name: ['gray town circle', 'throne over the circle', 'throne hero'][i], start: ['b23-0.1', 'b24-0.1', 'btw-0.25'][i], set: 'town',
    setup(ctx) {
      const S = square(ctx, { light: 'dusk', party: false, banner: false, fans: false }); giant(ctx, S, 'mil', i === 2 ? [0, 6.0, 0.5] : undefined); goldFx(ctx, S);
      const ids = Object.keys(GRAY_SPECS); ids.forEach((id) => ctx.place(id, S(0, -0.8, 10)));
      ctx.place('me', throneSeat(ctx)); ctx.cast.me.root.rotation.set(0, S.yaw, 0);
      ctx.store = { S, ids, tg: tags(ctx, 1, 30) };
    },
    update(ctx, lt) {
      const { S, ids, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      P.mil.userData.set(t); P.bigBeams.userData.set(t, 0.8); goldFxUpdate(ctx);
      const Rr = 5.0, cz = 10.2;
      ids.forEach((id, k) => {
        const a = k / ids.length * PI * 2 + t * 0.09 + 0.3 * hash(k);
        const ch = ctx.cast[id]; ch.root.position.copy(S(Rr * Math.sin(a), -0.8, cz + Rr * Math.cos(a))); ch.root.rotation.set(0, S.yaw + a + PI / 2, 0);
        grayWalker(ch, t, k * 0.53);
      });
      me.pose('crossArms', t, { seated: true }); me.joints.torso.rotation.x -= 0.12; me.face('smug', t);
      placeTag(tg[0], me, { text: '1,000,000', w: 1.25 });
      if (i === 0) ctx.cam.move({ pos: S(4.0, 7.2, 21.5), look: S(0, 1.0, 7.5), fov: 48 }, { pos: S(3.2, 6.6, 20.0), look: S(0, 1.2, 7.0), fov: 48 }, clamp(lt / 3.0, 0, 1));
      else if (i === 1) ctx.cam.move({ pos: S(-3.2, 2.7, 11.8), look: S(0, 2.0, 1.5), fov: 42 }, { pos: S(-2.9, 2.6, 11.2), look: S(0, 2.1, 1.5), fov: 42 }, clamp(lt / 1.6, 0, 1));
      else ctx.cam.move({ pos: S(0.9, 0.35, 5.0), look: S(0, 4.0, 1.0), fov: 60 }, { pos: S(0.7, 0.35, 4.8), look: S(0, 4.1, 1.0), fov: 58 }, clamp(lt / 2.6, 0, 1));
      if (i === 2) tagText(ctx, 'MAXIMUM AURA', ctx.time('b24.w13'), Infinity, { y: 0.12, size: 78, fill: '#ffd23f', stroke: '#3a1a00', bg: 'rgba(60,20,0,0.75)' });
    },
  })),
  // ── b25 "Then a pigeon landed on my head. Its number? Two million."
  ...[0, 1, 2].map((i) => ({
    name: ['pigeon lands', 'do I care now', 'two million'][i], start: ['b25-0.1', 'b25.w7-0.1', 'twomil-0.12'][i], set: 'town',
    setup(ctx) {
      const S = square(ctx, { light: 'dusk', party: false, banner: false, fans: false }); goldFx(ctx, S);
      ctx.place('me', throneSeat(ctx)); ctx.cast.me.root.rotation.set(0, S.yaw, 0);
      ctx.place('pigeon', S(0, 3, 1));
      const ids = Object.keys(GRAY_SPECS).slice(0, 14); ids.forEach((id) => ctx.place(id, S(0, -0.8, 10)));
      ctx.store = { S, ids, tg: tags(ctx, 2, 30) };
    },
    update(ctx, lt) {
      const { S, ids, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, p = ctx.cast.pigeon, tl = ctx.markers.landed + 0.32, t2 = ctx.markers.twomil;
      goldFxUpdate(ctx, 0.8);
      ids.forEach((id, k) => {
        const a = k / ids.length * PI * 2 + t * 0.09 + 0.3 * hash(k);
        const ch = ctx.cast[id]; ch.root.position.copy(S(5 * Math.sin(a), -0.8, 10.2 + 5 * Math.cos(a))); ch.root.rotation.set(0, S.yaw + a + PI / 2, 0);
        grayWalker(ch, t, k * 0.53);
      });
      const landed = t > tl, shocked = t > tl + 0.35;
      me.pose(shocked ? 'surprised' : 'crossArms', shocked ? 0.25 : t, { seated: true }); me.face(shocked ? 'shocked' : 'smug', shocked ? 1 : t);
      me.root.updateMatrixWorld(true);
      const top = me.joints.head.localToWorld(V(0, 0.74, 0.02));
      if (landed) { p.root.position.copy(top); p.root.rotation.set(0, S.yaw, 0); p.pose('idle', t); }
      else {
        const k = clamp((t - (tl - 0.75)) / 0.75, 0, 1), from = top.clone().add(S(-2.4, 2.8, 0.6).sub(S(0, 0, 0)));
        p.root.position.copy(from.lerp(top, ease.outCubic(k)).add(up(0.25 * Math.sin(PI * k)))); p.root.rotation.set(0, S.yaw + 0.8 * (1 - k), 0);
        p.pose('flap', t, { speed: 1.4 });
      }
      p.face('neutral', 0.5);
      const tick = t > t2 - 0.4 ? 1000000 - Math.floor((t - t2 + 0.4) * 3777) : 1000000;
      placeTag(tg[0], me, { text: fmt(tick), style: t > t2 - 0.4 ? 'red' : 'gold', w: 1.1, dy: 0.48 * 0.9 + 0.1 + (landed ? 0.0 : 0) });
      if (landed) tg[0].position.add(S(0.75, -0.25, 0).sub(S(0, 0, 0)));
      const big = t > t2 ? ease.outBack(clamp((t - t2) / 0.3, 0, 1)) : 0;
      if (i === 2) placeTag(tg[1], p, { text: '2,000,000', style: 'gold', w: 3.6 * Math.max(0.01, big), alpha: big > 0 ? 1 : 0, dy: 0.45, ringScale: 2.4 });
      else placeTag(tg[1], p, { text: '???', style: 'blur', w: 0.7, dy: 0.42, alpha: landed ? 1 : 0 });
      const f = humanFace(me);
      if (i === 0) ctx.cam.move({ pos: f.clone().add(S(1.3, 0.25, 3.2).sub(S(0, 0, 0))), look: f.clone().add(up(0.35)), fov: 44 }, { pos: f.clone().add(S(1.1, 0.25, 2.8).sub(S(0, 0, 0))), look: f.clone().add(up(0.4)), fov: 44 }, clamp(lt / 1.7, 0, 1));
      else if (i === 1) ctx.cam.set({ pos: f.clone().add(S(-0.45, 0.05, 1.75).sub(S(0, 0, 0))), look: f.clone().add(up(0.25)), fov: 40 });
      else { ctx.cam.move({ pos: S(0.5, 0.2, 7.6), look: S(0, 4.1, 1.2), fov: 56 }, { pos: S(0.4, 0.2, 7.0), look: S(0, 4.3, 1.2), fov: 58 }, clamp(lt / 0.8, 0, 1)); }
      if (i === 1) tagText(ctx, 'wait... do I care now?', t2 - 0.6, Infinity, { y: 0.14, size: 60, font: 'narr', bg: 'rgba(20,20,30,0.8)' });
      if (t > t2) { stamp(ctx, '2,000,000', t2, { y: 0.13, size: 140 }); ctx.fx.overlay('#fff4c0', 0.6 * Math.exp(-(t - t2) * 6)); }
    },
  })),
  // ── b26 HUSS ×3 — snap zooms on the pigeon, completely unbothered
  ...[0, 1, 2].map((i) => ({
    name: `pigeon huss #${i + 1}`, start: i === 0 ? 'b26.h0-0.12' : `b26.h${i}-0.03`, set: 'town',
    setup(ctx) {
      const S = square(ctx, { light: 'dusk', party: false, banner: false, fans: false }); goldFx(ctx, S, { sparkles: false });
      ctx.place('me', throneSeat(ctx)); ctx.cast.me.root.rotation.set(0, S.yaw, 0);
      ctx.place('pigeon', S(0, 3, 1));
      ctx.store = { S, tg: tags(ctx, 1, 30) };
    },
    update(ctx) {
      const { S, tg } = ctx.store, t = ctx.t, me = ctx.cast.me, p = ctx.cast.pigeon, hits = ctx.hussTimes('b26').map((h) => h + 0.03);
      goldFxUpdate(ctx, 0.8);
      me.pose('surprised', 0.25, { seated: true }); me.face('shocked', 1);
      me.root.updateMatrixWorld(true);
      p.root.position.copy(me.joints.head.localToWorld(V(0, 0.74, 0.02))); p.root.rotation.set(0, S.yaw, 0); p.pose('idle', t * 0.3); p.face('neutral', 0.5);
      placeTag(tg[0], p, { text: '2,000,000', style: 'gold', w: 3.6, dy: 0.45, ringScale: 2.4 });
      const pc = headC(p), d = [2.1, 1.5, 1.05][i];
      ctx.cam.set({ pos: pc.clone().add(S([0.15, -0.1, 0.0][i], 0.0, d).sub(S(0, 0, 0))), look: pc.clone().add(up(-0.02)), fov: 32 });
      ctx.cam.punch(hits, t, 0.12, 0.2);
      if (i === 2) iris(ctx, ctx.time('b26.end') + 0.35, 0.45);
    },
  })),
];
