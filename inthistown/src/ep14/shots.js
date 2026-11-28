// In This Town — Episode 14: "Tape Duty".  There is a crack in the sky.  Every night at midnight something tries to push
// it open, and one family climbs the clock tower to tape it shut.  On the narrator's first solo shift the roll is empty —
// so he gums it shut with Grandma's chewing gum… then looks inside.  The monsters are us.
// Film contract: SPEC.md §8.  Timeline: episodes/ep14/timeline.json.
//
// One function — story(ctx, t) — holds the crack's whole state as a pure function of global time (bulge, knocks, tape
// strips peeling, the split, the fingers, the gum, the pink scar), so every cut sees the same crack.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp, smooth } from '../lib/util.js';
import { quoteCard, wrap } from '../cards.js';
import { makePigeonShades } from '../ep12/props.js';
import { makeCloud, makeBench } from '../ep13/props.js';
import {
  TOWER, makeTowerTop, makeSkyCrack, makeTapeRoll, makeLadder, makePicnicTable, makePickleJar, makeHomework, makeSock,
  makeGumPack, makeGlint, makeGumBlob, makeGumStrings, makeFogRing, makeMotes, makeLeaves, makeGiantEye, makeCurtainWindow,
  makeCheeks, makeBubble, makeKnuckles, makeGiantHand, buildOtherSide, glowTex,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const TX = TOWER.x, TZ = TOWER.z, DY = TOWER.deck;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const SPECS = {
  hamble: { id: 'hamble', skin: '#e9b99a', hair: { style: 'grandpa', color: '#d8d8d8' }, top: { style: 'tee', color: '#3f6fb5', accent: '#ffd23f', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#4a3b2f', accessories: ['cap', 'mustache'], capColor: '#d0302a', scale: 0.97 },
  pell: { id: 'pell', skin: '#f4d0b5', hair: { style: 'curly', color: '#d9542b' }, top: { style: 'cardigan', color: '#3c8f45', accent: '#ffd23f' },
    bottom: { style: 'skirt', color: '#7a1f2b' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.95 },
  grandma: { id: 'grandma', skin: '#f0c8a8', hair: { style: 'bun', color: '#f4f4f4' }, top: { style: 'cardigan', color: '#ffa6d1', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#7a6a58' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.9 },
  dad: { id: 'dad', skin: '#e0ac69', hair: { style: 'short', color: '#5a3a22' }, top: { style: 'tee', color: '#b03a2e', accent: '#2a1a10', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#4a3b2f', accessories: ['beard'], build: 1.1 },
  grey: { id: 'grey', skin: '#a6a8b0', hair: { style: 'spiky', color: '#6e7078' }, top: { style: 'hoodie', color: '#7d8089', accent: '#9a9da6' },
    bottom: { style: 'pants', color: '#5e6068' }, shoes: '#6a6c74', scale: 0.85 },
};
export const cast = { me: MAIN.me, mayor: MAIN.mayor, pigeon: MAIN.pigeon, ...SPECS, ...EXTRAS };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 14, banner: ['TAPE DUTY', 'ROTA', 'PELL / HAMBLE / US'] }),
  room: () => buildRoom({ variant: 'hero', window: 'dark', poster: 'knight' }),
  other: () => buildOtherSide(),
};

export function init(ctx) {
  const P = ctx.props;
  P.tower = makeTowerTop();
  P.crack = makeSkyCrack({ H: 13, seed: 5 });
  P.crackFB = makeSkyCrack({ H: 6, n: 10, seed: 9, wmax: 1.5 });
  P.roll = makeTapeRoll();
  P.ladder = makeLadder(26.5);
  P.clouds = [1, 2, 3, 4, 5].map((s) => makeCloud(s));
  P.picnic = makePicnicTable(); P.bench = makeBench();
  P.jar = makePickleJar();
  P.homework = makeHomework(); P.sock = makeSock(); P.gumPack = makeGumPack(); P.glint = makeGlint();
  P.blob = makeGumBlob(0.32, 3);
  P.splat = makeGumBlob(0.6, 8);
  P.strings = makeGumStrings(8);
  P.seatGum = makeGumBlob(0.14, 5);
  P.fogRing = makeFogRing({ n: 24, r: 9, h: 5, size: 9, color: '#9fb4d6' });
  P.motes = makeMotes({ n: 46, w: 9, h: 9, d: 6, color: '#dcb0ff' });
  P.festive = makeMotes({ n: 50, w: 8, h: 10, d: 4, color: '#ffe27a', size: 0.12 });
  P.leaves = makeLeaves(18);
  P.eye = makeGiantEye(); P.hand = makeGiantHand();
  P.curtain = makeCurtainWindow();
  P.cheeks = makeCheeks(MAIN.me.skin); P.bubble = makeBubble();
  P.knL = makeKnuckles(); P.knR = makeKnuckles();
  P.shades = makePigeonShades();
  P.greyRoll = makeTapeRoll({ R: 0.14, r: 0.075, w: 0.09 });
  P.tapeSheet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: '#f4e49c', emissive: '#6a5a20', emissiveIntensity: 0.5, roughness: 0.4 }));
  P.wrapRoll = makeWrapRoll();
  P.thumb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), new THREE.MeshStandardMaterial({ color: SPECS.pell.skin, roughness: 0.7 }));
  P.sliverGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ff7ad0', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  P.burst = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ff9ad6', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  P.fill = new THREE.PointLight('#c8d8ff', 5, 9, 1.4);
  P.crackLight = new THREE.PointLight('#b46bff', 30, 40, 1.1);
  P.deckLight = new THREE.PointLight('#ffcf90', 5, 8, 1.4);
  P.sun = new THREE.PointLight('#fff1d6', 0, 10, 1.2);
  // soft pink glow along the sealed scar (crack-local, added to the crack in townBase)
  P.scar = new THREE.Group();
  { const C = P.crack.userData; for (let i = 1; i < C.n; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ff7ac8', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, opacity: 0 })); sp.position.set(C.pts[i].x, C.pts[i].y, 0); sp.scale.set(2.2, 2.6, 1); P.scar.add(sp); } }
}
function makeWrapRoll() {
  const g = new THREE.Group();
  const tex = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#d8263a'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#1f9a4a'; for (let i = 0; i < 256; i += 40) x.fillRect(i, 0, 16, 64); return c; })());
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 20), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
  m.rotation.z = PI / 2; m.castShadow = true; g.add(m);
  return g;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
function T(ctx) { ctx.set.root.updateMatrixWorld(true); const r = ctx.set.root; const f = (x, y, z) => r.localToWorld(V(x, y, z)); f.yaw = yawOf(r); return f; }
function frame(origin, yaw) {
  const fwd = V(Math.sin(yaw), 0, Math.cos(yaw)), left = V(Math.cos(yaw), 0, -Math.sin(yaw));
  const f = (x, y, z) => origin.clone().addScaledVector(left, x).addScaledVector(fwd, z).add(V(0, y, 0));
  f.yaw = yaw; f.origin = origin.clone(); return f;
}
function frameAt(ctx, name) { const a = ctx.anchor(name); a.updateWorldMatrix(true, false); return frame(a.getWorldPosition(V()), yawOf(a)); }
function put(ctx, id, p, yaw) { ctx.place(id, p); const c = ctx.cast[id]; c.root.rotation.set(0, yaw, 0); return c; }
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function lastBefore(times, t) { let r = null; for (const x of times) if (x <= t) r = x; return r; }
function hitPulse(times, t, decay = 0.2) { let p = 0; for (const h of times) if (t >= h) p = Math.max(p, Math.exp(-(t - h) / decay)); return p; }
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 70, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.27, size: 150, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.12, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
/** a soft light riding with the camera (faces at night) */
function fill(ctx, cam, k = 1, color = '#c8d8ff') { const f = ctx.props.fill; ctx.add(f); f.color.set(color); f.position.copy(cam.pos).add(up(0.4)); f.intensity = 5 * k; }
const setCam = (ctx, cam, k = 1, color) => { ctx.cam.set(cam); fill(ctx, cam, k, color); };
function moveCam(ctx, a, b, u, e = 'inOutSine', k = 1, color) { ctx.cam.move(a, b, u, e); const p = a.pos.clone().lerp(b.pos, clamp(u, 0, 1)); fill(ctx, { pos: p }, k, color); }

// ───────────────────────────────────────────────────────────────────────────── story clock
let TK = null;
function tk(ctx) {
  if (TK) return TK;
  const h = (id) => ctx.hussTimes(id).map((x) => x + 0.03);
  TK = {
    midnight: ctx.time('b02.w4'), push: ctx.time('b02.w8'), b03h: h('b03'), b04: ctx.time('b04'), crack5: ctx.markers.crack5,
    bumped: ctx.time('b04.w5'), b05: ctx.time('b05'), b06: ctx.time('b06'), b07: ctx.time('b07'), wrap: ctx.time('b07.w8') - 0.1,
    b10h: h('b10'), b12: ctx.time('b12'), knocks: [ctx.time('b14.w0'), ctx.time('b14.w1'), ctx.time('b14.w2')],
    split: ctx.time('b15.w2'), fingers: ctx.time('b15.w4'), slid: ctx.time('b15.w6'), gummed: ctx.markers.gummed,
    b18h: h('b18'), b19: ctx.time('b19'), b20: ctx.time('b20'), us: ctx.markers.us, end: ctx.timeline.duration,
  };
  return TK;
}
/** The crack (+ tower clock + fog) as a pure function of global time. */
function story(ctx, t = ctx.t) {
  const k = tk(ctx);
  const s = { open: 0.42, bulge: 0, pulse: 0.12 * (0.5 + 0.5 * Math.sin(t * 2.2)), glow: 1, tint: 0, seal: 0, sliver: true,
    peel: [0, 0, 0, 0, 0, 0, 0], strain: 0, slide: 0, curl: 0, flinch: 0, retreat: 0, wrap: false, clock: [11, 58], fog: 0 };
  if (t < k.b04) {                                   // the opening: midnight push
    s.clock = t >= k.b03h[0] - 0.05 ? [12, 0] : [11, 59];
    s.bulge = 0.75 * smooth((t - k.midnight) / 1.4);
    s.strain = s.bulge;
    s.pulse += 1.3 * hitPulse(k.b03h, t, 0.16) + 0.25 * s.bulge * (0.5 + 0.5 * Math.sin(t * 9));
    if (t > k.b03h[0] - 0.05) { s.slide = 0.32 + 0.15 * hitPulse(k.b03h, t, 0.25); s.curl = 0.1; }
    s.open = 0.42 + 0.12 * s.bulge;
  } else if (t < k.b12 - 0.3) {                      // flashbacks / Mrs Pell
    if (t >= k.b07 - 0.2) { s.peel = [1, 0, 1, 1, 1, 0, 1]; s.wrap = t >= k.wrap; }
  } else {                                           // the kid's shift
    s.fog = 1 - smooth((t - k.b19 - 0.6) / 1.6);
    k.knocks.forEach((kt, i) => { s.pulse += 1.4 * hitPulse([kt], t, 0.22); s.peel[[3, 1, 5][i]] = clamp((t - kt) / 1.5, 0, 1); });
    const sp = smooth((t - k.split + 0.1) / 0.55);
    s.open = lerp(0.42, 1.0, sp);
    if (t > k.split - 0.1) { s.pulse += 0.9 * hitPulse([k.split], t, 0.4); [0, 2, 4, 6].forEach((i, j) => { s.peel[i] = Math.max(s.peel[i], clamp((t - k.split - 0.06 * j) / 1.1, 0, 1)); }); }
    s.slide = smooth((t - k.fingers + 0.4) / 1.3);
    s.curl = smooth((t - k.fingers - 0.5) / 1.9);
    if (t > k.split) s.pulse += 0.25 * (0.5 + 0.5 * Math.sin(t * 6.5));
    // the gum
    const hits = [k.gummed, ...k.b18h];
    const n = hits.filter((h) => h <= t).length;
    if (n > 0) {
      const last = lastBefore(hits, t), dk = ease.outCubic(clamp((t - last) / 0.14, 0, 1));
      const nb = Math.max(0, n - 1) - 1 + dk;               // b18 hits done (fractional)
      s.seal = n === 1 ? (1 / 15) * dk : clamp((1 + (14 / 6) * Math.max(0, nb + 1)) / 15, 0, 1);
      s.flinch = hitPulse(hits, t, 0.35);
      s.retreat = n > 1 ? clamp((nb + 1) / 6, 0, 1) * 1.1 : 0;
      s.open = lerp(1.0, 0.3, n > 1 ? clamp((nb + 1) / 6, 0, 1) : 0);
      s.pulse += 0.8 * s.flinch;
    }
    if (t >= k.b18h[5] + 0.1) { s.tint = smooth((t - k.b18h[5] - 0.1) / 0.6); s.glow = lerp(1, 0.55, s.tint); s.seal = 1; s.slide = 0; s.open = 0.3; }
    if (t >= k.b19 - 0.15) { s.clock = [12, 0]; s.pulse = 0.08 * (0.5 + 0.5 * Math.sin(t * 1.7)); }
    if (t > k.us - 0.4) s.sliver = false;
  }
  return s;
}
function applyCrack(ctx, s = story(ctx)) {
  const P = ctx.props, C = P.crack.userData, t = ctx.t;
  C.set({ t, open: s.open, glow: s.glow, pulse: s.pulse, bulge: s.bulge, tint: s.tint, seal: s.seal, sliver: s.sliver });
  for (let i = 0; i < C.nTape; i++) C.tape(i, s.peel[i], t, s.strain);
  C.setFingers({ slide: s.slide, curl: s.curl, t, flinch: s.flinch, retreat: s.retreat });
  C.wrap.visible = s.wrap;
  // sealed: the gum flattens into a soft glowing pink scar (no stiff string rods)
  const sealed = s.tint > 0.5;
  for (const q of C.gums) {
    q.g.children.forEach((m) => { if (m.geometry?.type === 'CylinderGeometry') m.visible = !sealed; });
    if (sealed && q.g.visible) q.g.scale.multiply(V(0.72, 0.72, 0.4));
  }
  P.scar.visible = s.tint > 0.01;
  if (P.scar.visible) P.scar.children.forEach((sp, i) => { sp.material.opacity = 0.75 * s.tint * (0.8 + 0.2 * Math.sin(t * 1.6 + i)); });
  P.tower.userData.setClock(s.clock[0], s.clock[1]);
  const L = P.crackLight; L.intensity = (16 * s.glow + 40 * Math.min(1.5, s.pulse)) * (1 - 0.55 * s.tint) * (0.6 + 0.6 * s.open);
  L.color.set(s.tint > 0.5 ? '#ff7ac8' : '#b46bff');
  if (ctx.store.fogRing) { P.fogRing.userData.set(t, s.fog); }
  return s;
}
/** Night town with the tower top, the crack and its light.  Returns T(ctx). */
function townBase(ctx, { lighting = 'quiet_night', crack = true, tower = true, glow = 0.7, fogRing = false, party = false } = {}) {
  const S = ctx.set, P = ctx.props, root = S.root;
  S.setLighting(lighting); S.set('partyProps', party); S.set('fireworks', false); S.set('foam', 0);
  S.set('windowGlow', lighting === 'day' ? 0 : glow);
  if (tower) { ctx.add(P.tower, root); P.tower.position.set(TX, 0, TZ); P.tower.rotation.set(0, 0, 0); }
  if (crack) {
    ctx.add(P.crack, root); P.crack.position.set(TX, DY + 1.2, TZ); P.crack.rotation.set(0, PI / 2, 0);
    ctx.add(P.crackLight, P.crack); P.crackLight.position.set(0, 4.0, 3.2);
    ctx.add(P.scar, P.crack); P.scar.position.set(0, 0, 0.5); P.scar.visible = false;
  }
  if (fogRing) { ctx.add(P.fogRing, root); P.fogRing.position.set(TX, DY + 1.5, TZ); ctx.store.fogRing = true; }
  if (tower && lighting !== 'day') { ctx.add(P.deckLight, root); P.deckLight.position.set(TX + 1.6, DY + 2.6, TZ + 1.2); }
  ctx.store.fog0 = S.fog ? S.fog.color.clone() : null; ctx.store.bg0 = S.background?.clone ? S.background.clone() : null;
  return T(ctx);
}
/** crack-local point → world */
function CR(ctx, x, y, z = 0) { const c = ctx.props.crack; c.updateMatrixWorld(true); return c.localToWorld(V(x, y, z)); }
function nightFog(ctx, near = 16, far = 120) { const f = ctx.set.fog; if (f) { f.near = near; f.far = far; } }
const PURPLE_FOG = new THREE.Color('#3a1660'), PURPLE_BG = new THREE.Color('#2a0f48');
/** tint fog + background toward purple: a pure function of k (base colours captured in setup by townBase). */
function purpleSky(ctx, k) {
  const S = ctx.set, st = ctx.store, kk = clamp(k, 0, 1);
  if (S.fog && st.fog0) S.fog.color.copy(st.fog0).lerp(PURPLE_FOG, kk);
  if (S.background?.copy && st.bg0) S.background.copy(st.bg0).lerp(PURPLE_BG, kk);
}

// kid spots (town-local)
const KE = (L) => ({ p: L(TX + 2.0, DY, TZ + 0.4), yaw: L.yaw + PI / 2 });      // at the east edge, facing the town
const KF = (L) => ({ p: L(TX + 1.15, DY, TZ + 0.05), yaw: L.yaw + PI / 2 });    // under the crack, facing east (camera)
const KC = (L) => ({ p: L(TX + 1.35, DY, TZ + 0.1), yaw: L.yaw - PI / 2 });     // facing the crack
function kid(ctx, spot) { return put(ctx, 'me', spot.p, spot.yaw); }

/** roll carried under the left arm (or held in front with both hands: mode 'front' / at the face: 'eye'). */
function carryRoll(ctx, ch, mode = 'under', full = 1) {
  const R = ctx.props.roll; R.userData.set(full);
  ch.root.updateMatrixWorld(true);
  const J = ch.joints;
  if (mode === 'under') {
    J.armL.rotation.z += 0.42; J.armL.rotation.x += -0.15; J.foreArmL && (J.foreArmL.rotation.x += -0.9);
    R.position.copy(ch.root.localToWorld(V(0.44, 1.02, 0.05))); R.rotation.set(0, ch.root.rotation.y + PI / 2, 0);
  } else if (mode === 'front') {
    for (const s of ['L', 'R']) { J['arm' + s].rotation.x += -1.05; J['arm' + s].rotation.z += (s === 'L' ? -0.32 : 0.32); J['foreArm' + s] && (J['foreArm' + s].rotation.x += -0.5); }
    R.position.copy(ch.root.localToWorld(V(0, 1.12, 0.52))); R.rotation.set(0, ch.root.rotation.y, 0);
  } else if (mode === 'eye') {
    for (const s of ['L', 'R']) { J['arm' + s].rotation.x += -1.75; J['arm' + s].rotation.z += (s === 'L' ? -0.5 : 0.5); J['foreArm' + s] && (J['foreArm' + s].rotation.x += -0.95); }
    R.position.copy(ch.root.localToWorld(V(-0.12, 1.66, 0.62))); R.rotation.set(0, ch.root.rotation.y, 0);
  }
}
function climbPose(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.2 });
  const J = ch.joints, a = Math.sin(t * 6);
  J.armL.rotation.x += (-2.55 + 0.35 * a) * k; J.armR.rotation.x += (-2.55 - 0.35 * a) * k;
  J.legL.rotation.x += -0.5 * Math.max(0, a) * k; J.legR.rotation.x += -0.5 * Math.max(0, -a) * k;
  if (J.shinL) { J.shinL.rotation.x += 0.7 * Math.max(0, a) * k; J.shinR.rotation.x += 0.7 * Math.max(0, -a) * k; }
}
function thumbsUp(ctx, ch, thumb) {
  const J = ch.joints;
  J.armR.rotation.x += -1.2; J.armR.rotation.z += 0.15; J.foreArmR && (J.foreArmR.rotation.x += -1.1);
  ctx.add(thumb, J.handR); thumb.position.set(0, 0.1, 0.02); thumb.rotation.set(0, 0, 0);
}
function smearPose(ch, t, hits) {
  ch.pose('idle', t, { intensity: 0.3, headPitch: -0.45 });
  const J = ch.joints, h = lastBefore(hits, t), d = h != null ? t - h : 9, sw = d < 0.25 ? Math.sin(PI * d / 0.25) : 0;
  J.armR.rotation.x += -2.75 + 0.25 * sw; J.armR.rotation.z += 0.25 - 0.5 * sw; J.foreArmR && (J.foreArmR.rotation.x += -0.2);
  J.armL.rotation.x += -1.9; J.armL.rotation.z += -0.3; J.torso.rotation.x += -0.12;
}
function chew(ch, t, k = 1) { const c = Math.sin(t * 14); ch.joints.head.rotation.x += 0.07 * c * k; ch.joints.head.position.y += 0.0; return c; }
function wipeBrow(ch, k) {
  const J = ch.joints;
  J.armL.rotation.x += -2.5 * k; J.armL.rotation.z += -0.55 * k; J.foreArmL && (J.foreArmL.rotation.x += -1.3 * k);
  J.armL.rotation.y += 0.3 * Math.sin(k * 10) * k;
}

// shared tower-top setups ----------------------------------------------------------------------
function deckShot(ctx, { spot = KF, roll = null, fogRing = true } = {}) {
  const L = townBase(ctx, { fogRing });
  const me = kid(ctx, spot(L));
  if (roll) ctx.add(ctx.props.roll);
  ctx.store.L = L; ctx.store.me = me;
  return L;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
const HUSS3 = [0, 1, 2, 3, 4, 5];
export const shots = [
  // ── b01 "In this town, there's a crack in the sky."  — wide over foggy rooftops to the taped crack
  {
    name: 'crack establishing', start: 0, set: 'town',
    setup(ctx) { const L = townBase(ctx, { glow: 0.65, fogRing: true }); ctx.store.L = L; },
    update(ctx, lt, u) {
      const { L } = ctx.store; applyCrack(ctx); nightFog(ctx, 20, 140);
      ctx.cam.move({ pos: L(4, 16, -15), look: L(TX, DY - 4.5, TZ), fov: 46 }, { pos: L(-2, 15.5, -14.5), look: L(TX, DY - 4.0, TZ), fov: 46 }, u, 'inOutSine');
    },
  },
  // ── b02 "And every night at midnight, something tries to push it open."  — the crack bulges, tape strains
  {
    name: 'crack bulges', start: 'b02-0.15', set: 'town',
    setup(ctx) { const L = townBase(ctx, { fogRing: true }); ctx.store.L = L; },
    update(ctx, lt) {
      const { L } = ctx.store; const s = applyCrack(ctx); nightFog(ctx, 18, 120);
      moveCam(ctx, { pos: L(TX + 6.5, DY + 0.9, TZ + 3.4), look: L(TX, DY + 6.2, TZ), fov: 56 }, { pos: L(TX + 5.2, DY + 1.0, TZ + 2.6), look: L(TX, DY + 6.8, TZ), fov: 58 }, clamp(lt / 2, 0, 1), 'inOutSine', 0.6);
      ctx.cam.shake(0.08 + 0.25 * s.bulge, ctx.t, 3);
    },
  },
  {
    name: 'curtain snaps', start: 'b02.w8-0.1', set: 'town',
    setup(ctx) {
      townBase(ctx, { crack: false, glow: 0.7 });
      const F = frameAt(ctx, 'house.6.window.1'), P = ctx.props;
      ctx.add(P.curtain); P.curtain.position.copy(F(0, 0, -0.2)); P.curtain.rotation.set(0, F.yaw, 0);
      ctx.store = { F };
    },
    update(ctx) {
      const { F } = ctx.store, k = tk(ctx);
      const c = ease.outCubic(clamp((ctx.t - k.push - 0.05) / 0.12, 0, 1));
      ctx.props.curtain.userData.set(c, 1);
      setCam(ctx, { pos: F(-1.2, -2.3, 7.0), look: F(0, -1.0, 0), fov: 40 }, 0.5);
      if (c > 0.9) ctx.cam.shake(0.12 * (1 - clamp((ctx.t - k.push - 0.2) / 0.3, 0, 1)), ctx.t, 4);
    },
  },
  // ── b03 HUSS ×6: midnight — purple flashes, fingertips poke through, the street empties
  ...HUSS3.map((i) => ({
    name: `midnight #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'town',
    setup(ctx) {
      const L = townBase(ctx, { fogRing: i !== 2 && i !== 4, glow: 0.75 });
      ctx.store.L = L;
      if (i === 2) {
        const D = frameAt(ctx, 'house.6.door');
        ctx.store.D = D; ctx.store.runners = [['x00', -0.55, 2.6], ['x04', 0.5, 3.3], ['x07', -0.1, 4.4]];
        ctx.store.runners.forEach(([id]) => ctx.place(id, D(0, 0, 3)));
      }
      if (i === 4) {
        const D = frameAt(ctx, 'house.7.door');
        ctx.store.D = D; put(ctx, 'x03', D(0.3, 0, 3.2), D.yaw + 0.9);
      }
    },
    update(ctx) {
      const { L } = ctx.store, k = tk(ctx), s = applyCrack(ctx), t = ctx.t, P = ctx.props;
      const hits = k.b03h, h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      if (i === 0) {
        setCam(ctx, { pos: L(TX + 12, 14.8, TZ + 3), look: L(TX + 2.0, 15.3, TZ), fov: 40 }, 0.5);
        stamp(ctx, '12:00', hits[0], { fill: '#ffe14a', stroke: '#000000', rot: -0.06, y: 0.12, size: 150 });
      } else if (i === 1) {
        setCam(ctx, { pos: L(TX + 4.6, DY + 0.9, TZ - 2.2), look: L(TX + 0.8, DY + 5.8, TZ), fov: 58 }, 0.6);
      } else if (i === 3) {
        // street-level wide down the street: the crack flashes, the windows go dark one by one
        ctx.set.set('windowGlow', (hi, wi) => (hash(hi * 7.3 + wi * 2.9) < 0.75 - 0.5 * clamp((t - hits[3]) / 0.35, 0, 1) ? 0.9 : 0.04));
        const u = clamp((t - hits[3]) / 0.5, 0, 1);
        moveCam(ctx, { pos: L(-14, 1.7, -8.6), look: L(TX, 11, TZ), fov: 62 }, { pos: L(-15.5, 1.6, -8.4), look: L(TX, 11.5, TZ), fov: 62 }, u, 'outCubic', 0);
      } else if (i === 2) {
        const { D, runners } = ctx.store;
        runners.forEach(([id, x, z0], j) => {
          const ch = ctx.cast[id], u = clamp((t - (hits[2] - 0.05)) / 0.5, 0, 1);
          ch.root.position.copy(D(1.8 + x * (1 - u) + 0.3 * x * u, 0, lerp(z0 + 2.5, 1.7 + 0.25 * j, u)));
          ch.root.rotation.set(0, D.yaw + PI, 0);
          ch.pose('walk', t * 2.2 + j, { speed: 2.5 }); ch.face('shocked', 0.5);
          ch.joints.torso.rotation.x += 0.35; ch.joints.armL.rotation.x += -1.2; ch.joints.armR.rotation.x += -1.2;
        });
        setCam(ctx, { pos: D(1.9, 1.45, 0.35), look: D(1.75, 1.75, 6), fov: 58 }, 1.0, '#c9a0ff');
      } else if (i === 4) {
        const ch = ctx.cast.x03; ch.pose('surprised', 0.25, { lookAt: L(TX, DY + 8, TZ) }); ch.face('shocked', 0.5);
        const f = humanFace(ch); const { D } = ctx.store;
        setCam(ctx, { pos: f.clone().add(V(Math.sin(D.yaw + 0.9) * 2.7, -0.3, Math.cos(D.yaw + 0.9) * 2.7)), look: f.clone().add(up(-0.1)), fov: 36 }, 1.6, '#c58cff');
      } else {
        moveCam(ctx, { pos: L(TX + 22, DY + 4, TZ + 9), look: L(TX, DY + 5.5, TZ), fov: 50 }, { pos: L(TX + 19, DY + 3.5, TZ + 8), look: L(TX, DY + 6, TZ), fov: 50 }, clamp((t - hits[5]) / 0.6, 0, 1), 'outCubic', 0.4);
      }
      ctx.cam.punch(hits, t, 0.1, 0.2);
      ctx.cam.shake(0.2 + 0.3 * hitPulse(hits, t, 0.2), t, 7 + i);
      ctx.fx.overlay('#b45cff', 0.22 * hitPulse(hits, t, 0.12));
      if (i > 0) tag(ctx, '12:00', hits[0], Infinity, { y: 0.14, size: 64, fill: '#ffe14a', bg: 'rgba(30,8,50,0.85)' });
    },
  })),
  // ── b04 "Five years ago, Mr. Hamble bumped the sky with a very tall ladder. Crack."  (day flashback)
  {
    name: 'ladder base', start: 'b04-0.1', set: 'town',
    setup(ctx) { const L = flashback(ctx); ctx.store.L = L; },
    update(ctx, lt) {
      const { L } = ctx.store; flashAnim(ctx);
      const u = ease.inOutCubic(clamp(lt / 1.6, 0, 1));
      ctx.cam.set({ pos: L(TX + 10, 0.7, TZ + 6.5), look: L(TX + 4.2, 3, TZ).lerp(L(TX + 2.6, 21.5, TZ), u), fov: lerp(52, 60, u) });
      flashLook(ctx);
      tag(ctx, '5 YEARS AGO', ctx.time('b04') + 0.05, Infinity, { y: 0.13, size: 74, bg: 'rgba(120,70,20,0.88)' });
    },
  },
  {
    name: 'ladder top tap', start: 'b04.w4-0.1', set: 'town',
    setup(ctx) { const L = flashback(ctx); ctx.store.L = L; ctx.props.clouds[2].position.copy(V(TX - 3.5, 30.5, TZ - 4)); ctx.props.clouds[1].position.copy(V(TX + 8.5, 27.5, TZ - 3)); },
    update(ctx, lt) {
      const { L } = ctx.store; flashAnim(ctx);
      moveCam(ctx, { pos: L(TX + 1.7, 25.1, TZ + 4.4), look: L(TX + 2.2, 24.5, TZ), fov: 44 }, { pos: L(TX + 1.75, 25.1, TZ + 3.8), look: L(TX + 2.2, 24.6, TZ), fov: 44 }, clamp(lt / 2.3, 0, 1), 'inOutSine', 0);
      flashLook(ctx);
      tag(ctx, '5 YEARS AGO', -1, Infinity, { y: 0.13, size: 56, bg: 'rgba(120,70,20,0.88)' });
    },
  },
  {
    name: 'crack! hamble', start: 'b04.w13-0.12', set: 'town',
    setup(ctx) { const L = flashback(ctx); ctx.store.L = L; },
    update(ctx) {
      const { L } = ctx.store, k = tk(ctx); flashAnim(ctx);
      const h = ctx.cast.hamble, f = humanFace(h);
      setCam(ctx, { pos: L(TX + 4.6, 26.2, TZ + 2.6), look: f.clone(), fov: 46 }, 0);
      ctx.cam.shake(0.45 * hitPulse([k.crack5], ctx.t, 0.35) + 0.04, ctx.t, 12);
      ctx.fx.overlay('#ffffff', 0.5 * hitPulse([k.crack5], ctx.t, 0.08));
      flashLook(ctx);
      stamp(ctx, 'CRACK!', k.crack5, { fill: '#b45cff', stroke: '#ffffff', y: 0.2 });
    },
  },
  // ── b05 "So now, every night, one family gets Tape Duty."  — the square at dusk, the rota banner
  {
    name: 'rota banner', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      townBase(ctx, { lighting: 'dusk', crack: false, tower: false }); ctx.set.set('standsCrowd', true); ctx.set.set('crowdMotion', 0.15);
      ctx.store = { banner: ctx.point('square.banner'), bc: ctx.point('square.bannerCam') };
    },
    update(ctx, lt) {
      const { banner, bc } = ctx.store;
      ctx.cam.move({ pos: bc.clone().add(up(-0.3)), look: banner.clone().add(up(-0.2)), fov: 52 }, { pos: bc.clone().lerp(banner, 0.18).add(up(-0.4)), look: banner.clone().add(up(-0.6)), fov: 52 }, clamp(lt / 1.8, 0, 1), 'inOutSine');
    },
  },
  {
    name: 'tape trophy', start: 'b05.w5-0.1', set: 'town',
    setup(ctx) {
      townBase(ctx, { lighting: 'dusk', crack: false, tower: false }); ctx.set.set('standsCrowd', true); ctx.set.set('crowdMotion', 0.1);
      const S = frameAt(ctx, 'square.stage');
      put(ctx, 'mayor', S(0.8, 0, 1.75), S.yaw - PI / 2 + 0.45);
      const fam = [['x01', -0.35, 1.7], ['x02', -1.0, 1.35], ['x05', -1.6, 1.85]];
      fam.forEach(([id, x, z]) => put(ctx, id, S(x, 0, z), S.yaw + PI / 2 - 0.6));
      ctx.cast.x05.root.scale.setScalar(0.82);
      const aud = ['x08', 'x09', 'x10', 'x11', 'x12', 'x13'];
      aud.forEach((id, j) => put(ctx, id, S((j < 3 ? -3.2 - j * 0.9 : 3.2 + (j - 3) * 0.9), -0.8, 3.6 + (j % 2) * 0.8), S.yaw + PI + (j < 3 ? 0.5 : -0.5)));
      ctx.add(ctx.props.roll);
      ctx.store = { S, fam, aud };
    },
    update(ctx, lt) {
      const { S, fam, aud } = ctx.store, t = ctx.t, m = ctx.cast.mayor, R = ctx.props.roll;
      m.pose('idle', t, { intensity: 0.3 }); m.face('grin', t);
      m.joints.armL.rotation.x += -1.0; m.joints.armR.rotation.x += -1.0; m.joints.armL.rotation.z += -0.25; m.joints.armR.rotation.z += 0.25;
      m.root.updateMatrixWorld(true);
      R.userData.set(1); R.position.copy(m.root.localToWorld(V(0, 1.15, 0.6))); R.rotation.set(0, m.root.rotation.y + PI / 2, 0);
      R.position.y += 0.06 * Math.sin(t * 3);
      fam.forEach(([id], j) => { const c = ctx.cast[id]; c.pose('clap', t + j * 0.3, { speed: 0.35, intensity: 0.5 }); c.face(['neutral', 'sleepy', 'sad'][j], 1.0); });
      aud.forEach((id, j) => { const c = ctx.cast[id]; c.pose('clap', t + j, { speed: 0.3, intensity: 0.4 }); c.face('sleepy', 1); });
      ctx.cam.move({ pos: S(1.1, 2.1, 9.4), look: S(-0.2, 1.4, 1.7), fov: 44 }, { pos: S(1.0, 2.0, 8.8), look: S(-0.2, 1.4, 1.7), fov: 44 }, clamp(lt / 1.6, 0, 1), 'inOutSine');
    },
  },
  // ── b06 "Climb the tower. Tape the crack. Never, ever look inside."  — the rules over the tower top
  {
    name: 'rules', start: 'b06-0.1', set: 'town',
    setup(ctx) { const L = townBase(ctx, { fogRing: true }); ctx.store.L = L; const P = ctx.props; ctx.add(P.roll, ctx.set.root); P.roll.position.set(TX + 1.6, DY + 0.42, TZ - 1.2); P.roll.rotation.set(0, 0.6, 0); P.roll.userData.set(1); },
    update(ctx, lt, u) {
      const { L } = ctx.store; applyCrack(ctx); nightFog(ctx, 18, 120);
      moveCam(ctx, { pos: L(TX + 6.6, DY + 7.4, TZ + 5.6), look: L(TX + 0.5, DY + 2.5, TZ), fov: 54 }, { pos: L(TX + 6, DY + 7, TZ + 5), look: L(TX + 0.5, DY + 2.9, TZ), fov: 56 }, u, 'inOutSine', 0.6);
      const M = ctx.markers, o = { size: 66, bg: 'rgba(14,10,30,0.85)', rot: 0 };
      tag(ctx, 'RULE 1: CLIMB', M.rule1, Infinity, { ...o, y: 0.1 });
      tag(ctx, 'RULE 2: TAPE', M.rule2, Infinity, { ...o, y: 0.165 });
      tag(ctx, 'RULE 3: NEVER LOOK INSIDE', M.rule3, Infinity, { ...o, y: 0.23, size: 58, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b07 "Mrs. Pell ran out of tape and used wrapping paper. The sky was festive for a week."
  {
    name: 'mrs pell', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      const L = townBase(ctx, { fogRing: false });
      const p = put(ctx, 'pell', L(TX + 1.3, DY, TZ + 0.4), L.yaw + PI / 2 + 0.25);
      ctx.add(ctx.props.wrapRoll); ctx.add(ctx.props.roll);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, p = ctx.cast.pell, t = ctx.t, P = ctx.props; applyCrack(ctx);
      p.pose('shrug', t, { speed: 0.6 }); p.face('sweat', t);
      p.root.updateMatrixWorld(true);
      P.wrapRoll.position.copy(p.joints.handL.getWorldPosition(V())); P.wrapRoll.rotation.set(0.3, p.root.rotation.y, 0.6);
      P.roll.userData.set(0); P.roll.position.copy(p.joints.handR.getWorldPosition(V())); P.roll.rotation.set(0, p.root.rotation.y + 0.5, 0);
      const f = humanFace(p);
      moveCam(ctx, { pos: L(TX + 4.6, DY + 1.9, TZ + 1.7), look: f.clone().add(up(-0.5)), fov: 40 }, { pos: L(TX + 3.9, DY + 1.8, TZ + 1.4), look: f.clone().add(up(-0.45)), fov: 40 }, clamp(lt / 2.3, 0, 1), 'inOutSine', 1.2);
      tag(ctx, 'OUT OF TAPE', ctx.time('b07.w5'), Infinity, { y: 0.18 });
    },
  },
  {
    name: 'festive sky', start: 'b07.w8-0.1', set: 'town',
    setup(ctx) {
      const L = townBase(ctx, { lighting: 'party_night', party: true, glow: 1 });
      put(ctx, 'pell', L(TX + 1.5, DY, TZ + 0.5), L.yaw + PI / 2 + 0.2);
      const P = ctx.props; ctx.add(P.festive, ctx.set.root); P.festive.position.set(TX + 0.6, DY + 6, TZ);
      ctx.store.L = L;
    },
    update(ctx, lt, u) {
      const { L } = ctx.store, p = ctx.cast.pell, t = ctx.t; applyCrack(ctx);
      p.pose('idle', t, { intensity: 0.4 }); p.face('grin', 0.4); thumbsUp(ctx, p, ctx.props.thumb);
      ctx.props.festive.userData.set(t, 1);
      if (t > ctx.time('b07.w10')) ctx.set.set('fireworks', true);
      moveCam(ctx, { pos: L(TX + 9.5, DY + 1.3, TZ + 3.8), look: L(TX + 0.8, DY + 3.8, TZ), fov: 64 }, { pos: L(TX + 10.5, DY + 1.4, TZ + 4.2), look: L(TX + 0.8, DY + 3.8, TZ), fov: 64 }, u, 'inOutSine', 1.0, '#ffe0c0');
      tag(ctx, 'FESTIVE', ctx.time('b07.w13'), Infinity, { y: 0.16, bg: 'rgba(31,154,74,0.92)', size: 80 });
    },
  },
  // ── b08 "And Grandma's chewing gum is so sticky, the mayor has been stuck to a picnic table since spring."
  {
    name: 'grandma gum', start: 'b08-0.1', set: 'town',
    setup(ctx) { const L = park(ctx); ctx.store.L = L; },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, g = ctx.cast.grandma, P = ctx.props; parkAnim(ctx);
      const k = tk(ctx), tb = ctx.time('b08.w3');
      const r = t < tb ? 0 : t < tb + 0.9 ? 0.32 * ease.outCubic((t - tb) / 0.9) : t < tb + 1.0 ? 0.33 : 0;
      P.bubble.userData.set(r);
      const f = humanFace(g);
      setCam(ctx, { pos: f.clone().add(V(0.35, -0.05, 2.4)), look: f.clone().add(V(0.0, -0.08, 0)), fov: 34 }, 0);
      if (t >= tb + 1.0 && t < tb + 1.15) { ctx.cam.shake(0.2, t, 5); }
    },
  },
  {
    name: 'mayor stuck', start: 'b08.w8-0.1', set: 'town',
    setup(ctx) { const L = park(ctx); ctx.store.L = L; const g = ctx.cast.grandma; g.root.position.copy(L(PT.x - 1.4, 0, PT.z + 1.2)); g.root.rotation.set(0, L.yaw + 0.45, 0); },
    update(ctx, lt, u) {
      const { L } = ctx.store; parkAnim(ctx);
      const C = PT;
      ctx.cam.move({ pos: L(C.x + 3.5, 0.82, C.z + 4.0), look: L(C.x + 0.2, 0.78, C.z + 0.6), fov: 40 }, { pos: L(C.x + 3.2, 0.8, C.z + 3.6), look: L(C.x + 0.2, 0.75, C.z + 0.6), fov: 40 }, u, 'inOutSine');
      stamp(ctx, 'STUCK', ctx.markers.stuck, { y: 0.17, size: 140, fill: '#ff6fb8', stroke: '#ffffff' });
      tag(ctx, 'SINCE SPRING', ctx.time('b08.w16'), Infinity, { y: 0.27, size: 60 });
    },
  },
  // ── b09 "The pigeon flew in there once. He came back wearing sunglasses. He won't talk about it."
  {
    name: 'pigeon bench', start: 'b09-0.1', set: 'town',
    setup(ctx) { const L = pigeonBench(ctx); ctx.store.L = L; },
    update(ctx, lt, u) {
      const { L } = ctx.store; pigeonAnim(ctx, null);
      const B = PB;
      ctx.cam.move({ pos: L(B.x + 3.0, 1.05, B.z - 0.35), look: L(B.x, 0.6, B.z - 0.05), fov: 36 }, { pos: L(B.x + 2.7, 1.05, B.z - 0.33), look: L(B.x, 0.6, B.z - 0.05), fov: 36 }, u, 'inOutSine');
      tag(ctx, 'NO COMMENT', ctx.time('b09.w12'), Infinity, { y: 0.12, size: 62 });
    },
  },
  // ── b10 HUSS ×3 — zoom, zoom, zoom… the pigeon turns to the lens.  "coo." — the pigeon
  ...[0, 1, 2].map((i) => ({
    name: `pigeon zoom #${i + 1}`, start: i === 0 ? 'b10.h0-0.12' : `b10.h${i}-0.03`, set: 'town',
    setup(ctx) { const L = pigeonBench(ctx); ctx.store.L = L; },
    update(ctx) {
      const { L } = ctx.store, k = tk(ctx), t = ctx.t, hits = k.b10h;
      const B = PB, d = [1.8, 1.15, 0.7][i], head = L(B.x, 0.95, B.z - 0.03);
      const dir = V(0.56, 0.12, -0.82).normalize();
      const cam = head.clone().addScaledVector(dir, d);
      pigeonAnim(ctx, i === 2 ? { cam, k: ease.inOutCubic(clamp((t - hits[2] - 0.03) / 0.3, 0, 1)) } : null);
      ctx.cam.set({ pos: cam, look: head.clone().add(up(i === 2 ? 0.1 : -0.02 * i)), fov: 36 });
      ctx.cam.punch(hits, t, 0.12, 0.2);
      if (i === 2) quoteCard(ctx, 'coo.', 'the pigeon', hits[2] + 0.12, ctx.time('b11') - 0.04, { y: 0.17, size: 110, byAt: hits[2] + 0.2 });
    },
  })),
  // ── b11 "Last night was our turn. But Dad pulled his back opening a jar."  (bedroom)
  {
    name: 'dad on floor', start: 'b11-0.1', set: 'room',
    setup(ctx) { const R = bedroom(ctx); ctx.store.R = R; },
    update(ctx, lt, u) {
      const { R } = ctx.store; bedroomAnim(ctx);
      ctx.cam.move({ pos: R(0.5, 3.2, 4.4), look: R(0.4, 0.55, 0.4), fov: 48 }, { pos: R(0.45, 2.9, 3.9), look: R(0.4, 0.55, 0.4), fov: 48 }, u, 'inOutSine');
      tag(ctx, 'OUR TURN', ctx.time('b11.w3'), Infinity, { y: 0.18 });
    },
  },
  {
    name: 'dad close', start: 'b11.w6-0.1', set: 'room',
    setup(ctx) { const R = bedroom(ctx); ctx.store.R = R; },
    update(ctx, lt, u) {
      const { R } = ctx.store; bedroomAnim(ctx);
      const f = humanFace(ctx.cast.dad);
      const o = R(0, 0, 0); ctx.cam.move({ pos: f.clone().add(R(1.15, 1.35, 0.1).sub(o)), look: f.clone().add(R(0.15, 0, 0.12).sub(o)), fov: 42 }, { pos: f.clone().add(R(0.95, 1.1, 0.08).sub(o)), look: f.clone().add(R(0.15, 0, 0.12).sub(o)), fov: 42 }, u, 'inOutSine');
      stamp(ctx, 'OUT OF ACTION', ctx.time('b11.w9'), { size: 104, y: 0.2 });
    },
  },
  // ── b12 "So it was me. Alone. Up the clock tower. At eleven fifty-eight."
  {
    name: 'alone tower wide', start: 'b12-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KE, roll: true }); },
    update(ctx, lt, u) {
      const { L, me } = ctx.store; applyCrack(ctx); nightFog(ctx, 14, 110);
      me.pose('idle', ctx.t, { intensity: 0.5 }); me.face('neutral', ctx.t); carryRoll(ctx, me, 'under', 1);
      moveCam(ctx, { pos: L(TX + 30, DY + 3, TZ + 14), look: L(TX + 0.5, DY + 5.0, TZ), fov: 46 }, { pos: L(TX + 24, DY + 2.5, TZ + 11), look: L(TX + 0.8, DY + 4.5, TZ), fov: 46 }, u, 'inOutSine', 0);
      tag(ctx, 'ALONE', ctx.time('b12.w4'), Infinity, { y: 0.17 });
    },
  },
  {
    name: 'up the tower', start: 'b12.w5-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KE, roll: true }); },
    update(ctx, lt, u) {
      const { L, me } = ctx.store; applyCrack(ctx); nightFog(ctx, 14, 110);
      me.pose('idle', ctx.t, { intensity: 0.4, headPitch: -0.2 }); me.face('determined', ctx.t); carryRoll(ctx, me, 'under', 1);
      moveCam(ctx, { pos: L(TX + 4.4, DY + 0.95, TZ + 2.0), look: L(TX + 1.7, DY + 2.6, TZ + 0.2), fov: 60 }, { pos: L(TX + 4.0, DY + 0.9, TZ + 1.6), look: L(TX + 1.5, DY + 3.2, TZ + 0.1), fov: 62 }, u, 'inOutSine', 1.2);
    },
  },
  {
    name: 'clock 11:58', start: 'b12.w9-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KE, roll: true }); },
    update(ctx, lt, u) {
      const { L, me } = ctx.store; applyCrack(ctx); nightFog(ctx, 14, 110);
      me.pose('idle', ctx.t, { intensity: 0.4 }); me.face('neutral', ctx.t); carryRoll(ctx, me, 'under', 1);
      moveCam(ctx, { pos: L(TX + 9.5, 14.4, TZ + 1.6), look: L(TX + 2.2, 15.4, TZ + 0.2), fov: 56 }, { pos: L(TX + 8.6, 14.5, TZ + 1.4), look: L(TX + 2.2, 15.4, TZ + 0.2), fov: 56 }, u, 'inOutSine', 0.3);
      tag(ctx, '11:58', ctx.time('b12.w10') - 0.2, Infinity, { y: 0.28, size: 100, fill: '#ffe14a', bg: 'rgba(14,10,30,0.85)' });
    },
  },
  // ── b13 "I pulled out the tape. Empty roll. Just cardboard."
  {
    name: 'pull tape', start: 'b13-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KF, roll: true }); },
    update(ctx, lt) {
      const { L, me } = ctx.store, t = ctx.t; applyCrack(ctx); nightFog(ctx, 14, 110);
      const t0 = ctx.time('b13.w1'), full = 1 - ease.inCubic(clamp((t - t0) / 0.85, 0, 1));
      me.pose('idle', t, { intensity: 0.3, headPitch: 0.35 }); me.face(full > 0.05 ? 'determined' : 'shocked', t);
      carryRoll(ctx, me, 'front', full);
      const R = ctx.props.roll; R.rotation.z = (1 - full) * 6;
      setCam(ctx, { pos: L(TX + 3.9, DY + 1.55, TZ + 0.9), look: L(TX + 1.15, DY + 1.25, TZ + 0.05), fov: 40 }, 1.2);
    },
  },
  {
    name: 'empty tube', start: 'b13.w5-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KF, roll: true }); },
    update(ctx, lt) {
      const { L, me } = ctx.store, t = ctx.t; applyCrack(ctx); nightFog(ctx, 14, 110);
      me.pose('idle', 0.5, { intensity: 0.1 }); me.face('shocked', 0.5);
      carryRoll(ctx, me, 'eye', 0);
      const R = ctx.props.roll; R.updateMatrixWorld(true);
      const c = R.position.clone(), fwd = V(Math.sin(me.root.rotation.y), 0, Math.cos(me.root.rotation.y));
      moveCam(ctx, { pos: c.clone().addScaledVector(fwd, 1.55).add(up(0.02)), look: c.clone().add(up(0.0)), fov: 34 }, { pos: c.clone().addScaledVector(fwd, 1.25).add(up(0.02)), look: c.clone(), fov: 34 }, clamp(lt / 1.8, 0, 1), 'inOutSine', 1.4);
      stamp(ctx, 'EMPTY', ctx.markers.empty, { y: 0.18 });
    },
  },
  // ── b14 "Knock. Knock. Knock."  — a pulse + a strip peeling off with each knock
  ...[0, 1, 2].map((i) => ({
    name: `knock #${i + 1}`, start: i === 0 ? 'b14-0.12' : `b14.w${i}-0.08`, set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KC, roll: true }); },
    update(ctx) {
      const { L, me } = ctx.store, t = ctx.t, k = tk(ctx); const s = applyCrack(ctx); nightFog(ctx, 14, 110);
      me.pose('idle', t, { intensity: 0.2, lookAt: CR(ctx, 0, 4.5) }); me.face(i === 0 ? 'neutral' : 'shocked', 0.4); carryRoll(ctx, me, 'under', 0);
      const kh = k.knocks[i], p = hitPulse([kh], t, 0.2);
      if (i === 0) setCam(ctx, { pos: L(TX + 2.4, DY + 1.6, TZ - 3.4), look: L(TX + 0.9, DY + 2.7, TZ), fov: 62 }, 0.8);   // profile: kid vs the crack
      else if (i === 1) setCam(ctx, { pos: L(TX + 3.4, DY + 1.45, TZ + 1.5), look: L(TX + 0.7, DY + 3.0, TZ - 0.1), fov: 62 }, 0.6);              // low over-the-shoulder
      else moveCam(ctx, { pos: L(TX + 17, DY + 2.5, TZ + 7.5), look: L(TX + 1, DY + 4.5, TZ), fov: 50 }, { pos: L(TX + 16, DY + 2.5, TZ + 7), look: L(TX + 2, DY + 4.0, TZ + 1), fov: 50 }, clamp((t - kh) / 0.7, 0, 1), 'outCubic', 0.4);
      ctx.cam.shake(0.05 + 0.4 * p, t, 21 + i); ctx.cam.punch([kh], t, 0.06, 0.2);
      ctx.fx.overlay('#b45cff', 0.18 * p);
      ctx.fx.text('KNOCK', { x: [0.3, 0.68, 0.5][i], y: [0.17, 0.24, 0.16][i], size: 120, fill: '#ffffff', stroke: '#3a0870', line: 14, rot: [-0.18, 0.14, -0.06][i], alpha: clamp((t - kh) / 0.05, 0, 1), scale: 1 + 0.4 * p });
    },
  })),
  // ── b15 "The crack split open. Giant fingers slid through. Long and grey, with way too many knuckles."
  {
    name: 'crack splits', start: 'b15-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KC, roll: true }); },
    update(ctx, lt) {
      const { L, me } = ctx.store, t = ctx.t, k = tk(ctx); const s = applyCrack(ctx); nightFog(ctx, 14, 110);
      purpleSky(ctx, 0.5 * smooth((t - k.split) / 0.6));
      me.pose('surprised', clamp(t - k.split, 0, 0.6), { lookAt: CR(ctx, 0, 5) }); me.face('shocked', 0.4); carryRoll(ctx, me, 'under', 0);
      setCam(ctx, { pos: L(TX + 4.3, DY + 1.7, TZ + 1.9), look: L(TX + 0.6, DY + 3.4, TZ - 0.3), fov: 70 }, 0.8);
      ctx.cam.shake(0.1 + 0.5 * hitPulse([k.split], t, 0.5), t, 31);
      ctx.fx.overlay('#c070ff', 0.25 * hitPulse([k.split], t, 0.15));
    },
  },
  {
    name: 'fingers slide', start: 'b15.w4-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KF, roll: true }); },
    update(ctx, lt) {
      const { L, me } = ctx.store, t = ctx.t, k = tk(ctx); applyCrack(ctx); nightFog(ctx, 14, 110); purpleSky(ctx, 0.5);
      me.pose('surprised', 0.5, { lookAt: CR(ctx, 0, 6, 3) }); me.face('shocked', 0.4); carryRoll(ctx, me, 'under', 0);
      me.root.position.copy(L(TX + 2.3, DY, TZ + 0.9)); me.root.rotation.y = L.yaw + PI / 2 + 0.5;
      const fy = ctx.props.crack.userData.fingerY[1];
      moveCam(ctx, { pos: L(TX + 6.4, DY + 0.9, TZ + 3.3), look: CR(ctx, 0, fy - 0.8, 1.8), fov: 70 }, { pos: L(TX + 6.2, DY + 0.85, TZ + 3.2), look: CR(ctx, 0, fy - 0.6, 1.9), fov: 70 }, clamp(lt / 1.5, 0, 1), 'inOutSine', 1.0, '#d0a8ff');
      ctx.cam.shake(0.25 + 0.6 * hitPulse([ctx.markers.fingers], t, 0.4), t, 33);
    },
  },
  {
    name: 'too many knuckles', start: 'b15.w8-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KF, roll: true, fogRing: false }); ctx.store.fogRing = false; },
    update(ctx, lt, u) {
      const { L, me } = ctx.store, t = ctx.t; applyCrack(ctx); nightFog(ctx, 40, 200); purpleSky(ctx, 0.5);
      me.pose('stunned', t, { lookAt: CR(ctx, 0, 5, 3) }); me.face('shocked', 0.4); carryRoll(ctx, me, 'under', 0);
      me.root.position.copy(L(TX + 1.6, DY, TZ + 0.9)); me.root.rotation.y = L.yaw + PI / 2 + 0.5;
      moveCam(ctx, { pos: L(TX + 12, DY + 3.6, TZ + 6.4), look: L(TX, DY + 5, TZ - 0.3), fov: 46 }, { pos: L(TX + 9.6, DY + 3.9, TZ + 5.0), look: L(TX, DY + 5, TZ - 0.3), fov: 46 }, u, 'linear', 0.5);
      ctx.cam.shake(0.3, t, 35);
    },
  },
  // ── b16 "All I had in my pockets was homework, a sock, and Grandma's chewing gum."
  {
    name: 'pockets', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      deckShot(ctx, { spot: KF, roll: false }); const P = ctx.props;
      ctx.add(P.homework); ctx.add(P.sock); ctx.add(P.gumPack); ctx.add(P.glint);
    },
    update(ctx, lt) {
      const { L, me } = ctx.store, t = ctx.t, P = ctx.props; applyCrack(ctx); nightFog(ctx, 14, 110); purpleSky(ctx, 0.4);
      me.pose('idle', 0.4, { intensity: 0.1, headPitch: 0.75 }); me.face('sweat', 0.4);
      const J = me.joints;                                   // both hands out, palms up, from the first frame
      for (const s of ['L', 'R']) { J['arm' + s].rotation.x += -1.15; J['arm' + s].rotation.z += (s === 'L' ? 0.06 : -0.06); J['foreArm' + s] && (J['foreArm' + s].rotation.x += -0.3); }
      me.root.updateMatrixWorld(true);
      const hl = J.handL.getWorldPosition(V()), hr = J.handR.getWorldPosition(V()), yaw = me.root.rotation.y;
      const mid = hl.clone().lerp(hr, 0.5), fwd = V(Math.sin(yaw), 0, Math.cos(yaw)), lat = V(Math.cos(yaw), 0, -Math.sin(yaw));
      const pop = (w) => ease.outBack(clamp((t - ctx.time(w)) / 0.18, 0, 1));
      // a row just over the open palms: homework (his left), gum pack (centre), sock (his right)
      const C = mid.clone().addScaledVector(fwd, 0.1).add(up(0.08));
      const items = [[P.homework, 0.14, 'b16.w7', PI / 2, 1.35], [P.sock, -0.14, 'b16.w9', 0, 1.0], [P.gumPack, 0, 'b16.w11', PI / 2, 1.6]];
      items.forEach(([o, dx, w, ry, sc], j) => {
        const k = pop(w); o.visible = k > 0.01; o.scale.setScalar(Math.max(0.01, k * sc));
        o.position.copy(C).addScaledVector(lat, dx).add(up((j === 2 ? 0.03 : 0) + 0.2 * (1 - k)));
        o.rotation.set(0, yaw + ry, 0);
      });
      P.glint.userData.set(clamp((t - ctx.time('b16.w13') + 0.05) / 0.5, 0, 1)); P.glint.position.copy(P.gumPack.position).add(up(0.1)); P.glint.lookAt(ctx.camera.position);
      // top-down: camera above the hands, the look point pushed forward so the palms sit high (clear of the caption)
      // front 3/4, a little above the hands: his sweaty face up top, the open palms + items below it
      setCam(ctx, { pos: C.clone().addScaledVector(fwd, 1.9).addScaledVector(lat, 0.3).add(up(0.45)), look: C.clone().add(up(0.32)), fov: 44 }, 1.0);
    },
  },
  // ── b17 "I chewed all twelve pieces at once. And I gummed that crack closed."
  {
    name: 'chew', start: 'b17-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KF }); ctx.add(ctx.props.cheeks, ctx.cast.me.joints.head); },
    update(ctx, lt) {
      const { L, me } = ctx.store, t = ctx.t, P = ctx.props; applyCrack(ctx); nightFog(ctx, 14, 110); purpleSky(ctx, 0.4);
      me.pose('idle', t, { intensity: 0.3 }); me.face('squint', 0.5);
      const c = chew(me, t), puff = clamp((t - ctx.time('b17.w1')) / 0.8, 0, 1);
      P.cheeks.userData.set(puff * (1.0 + 0.15 * c));
      const f = humanFace(me);
      moveCam(ctx, { pos: L(TX + 4.4, DY + 1.25, TZ + 0.7), look: f.clone().add(up(0.35)), fov: 36 }, { pos: L(TX + 3.5, DY + 1.35, TZ + 0.45), look: f.clone().add(up(0.45)), fov: 34 }, clamp(lt / 2, 0, 1), 'inOutSine', 1.3, '#d0a8ff');
      if (t > ctx.time('b17.w3')) ctx.fx.text('x12', { x: 0.74, y: 0.2, size: 150, fill: '#ff6fb8', stroke: '#ffffff', line: 12, rot: 0.15, scale: 1 + 0.25 * Math.max(0, 1 - (t - ctx.time('b17.w3')) / 0.15) });
    },
  },
  {
    name: 'leap', start: 'b17.w7-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KC }); ctx.add(ctx.props.blob); ctx.add(ctx.props.cheeks, ctx.cast.me.joints.head); },
    update(ctx, lt) {
      const { L, me } = ctx.store, t = ctx.t, k = tk(ctx), P = ctx.props; const s = applyCrack(ctx); nightFog(ctx, 14, 110); purpleSky(ctx, 0.4);
      const t0 = ctx.time('b17.w7'), th = k.gummed, u = clamp((t - t0) / (th - t0), 0, 1);
      const jumpY = u < 1 ? 1.5 * Math.sin(PI * 0.5 * ease.outCubic(u)) : Math.max(0, 1.5 - 9 * (t - th) * (t - th) - 2 * (t - th));
      me.root.position.copy(L(TX + 1.35 - 0.55 * u, DY + Math.max(0, jumpY), TZ + 0.1));
      me.pose('cheer', 0.2, { intensity: 1 }); me.face(t < th ? 'determined' : 'huss', t);
      const J = me.joints, wind = t < th ? lerp(0.6, -0.4, u) : -3.0 + 0.4 * clamp((t - th) / 0.3, 0, 1);
      J.armR.rotation.x = t < th ? -3.0 + 2.2 * Math.sin(PI * u) * 0.5 : -2.8; J.legL.rotation.x = -0.6 * Math.sin(PI * u); J.legR.rotation.x = 0.3 * Math.sin(PI * u); void wind;
      P.cheeks.userData.set(t < th ? 1 : 0.3);
      me.root.updateMatrixWorld(true);
      const target = CR(ctx, P.crack.userData.slamX, P.crack.userData.slamY, 0.35);
      if (t < th) { P.blob.visible = true; P.blob.position.copy(J.handR.getWorldPosition(V())).add(up(0.12)); P.blob.scale.setScalar(1); }
      else { P.blob.visible = true; P.blob.position.copy(target); const sq = clamp((t - th) / 0.12, 0, 1); P.blob.scale.set(1 + 1.2 * sq, 1 + 0.6 * sq, 0.6); }
      setCam(ctx, { pos: L(TX + 6.8, DY + 1.2, TZ + 3.8), look: L(TX + 0.6, DY + 3.2, TZ - 0.1), fov: 56 }, 0.8);
      ctx.cam.shake(0.08 + 0.6 * hitPulse([th], t, 0.3), t, 41); ctx.cam.punch([th], t, 0.1, 0.25);
      ctx.fx.overlay('#ff7ad0', 0.3 * hitPulse([th], t, 0.1));
    },
  },
  {
    name: 'gum hits', start: 'gummed+0.32', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KC }); ctx.add(ctx.props.splat); ctx.add(ctx.props.burst); },
    update(ctx, lt) {
      const { L, me } = ctx.store, t = ctx.t, k = tk(ctx), P = ctx.props; const s = applyCrack(ctx); nightFog(ctx, 14, 110); purpleSky(ctx, 0.4);
      smearPose(me, t, [k.gummed]); me.face('determined', t);
      const target = CR(ctx, P.crack.userData.slamX, P.crack.userData.slamY, 0.45);
      P.splat.position.copy(target); P.splat.scale.set(1.25, 0.9, 0.5); P.splat.rotation.set(0, PI / 2, 0);
      P.burst.position.copy(target); const bk = clamp((t - k.gummed) / 0.8, 0, 1); P.burst.scale.setScalar(2 + 8 * bk); P.burst.material.opacity = 0.8 * (1 - bk);
      setCam(ctx, { pos: L(TX + 6.5, DY + 2.6, TZ - 3.4), look: CR(ctx, 0, 4.0), fov: 50 }, 0.5);
      ctx.cam.shake(0.25 + 0.3 * s.flinch, t, 43);
      tag(ctx, 'GUMMED', k.gummed + 0.3, Infinity, { y: 0.18, bg: 'rgba(255,79,163,0.92)', size: 80 });
    },
  },
  // ── b18 HUSS ×6 — smear, smear, smear: the fingers yank back, the crack seals, the town lights up
  ...HUSS3.map((i) => ({
    name: `seal #${i + 1}`, start: i === 0 ? 'b18.h0-0.12' : `b18.h${i}-0.03`, set: 'town',
    setup(ctx) {
      if (i === 2 || i === 4) {
        const L = townBase(ctx, { glow: 0.2 }); ctx.store.L = L;
        const cheer = [['x02', 6, -2.2], ['x06', 6, 1.3], ['x09', 6, 2.0], ['x11', 7, -1.0], ['x14', 7, 1.2], ['x15', 6, -4.3]];
        cheer.forEach(([id, h, x], j) => { const D = frameAt(ctx, `house.${h}.door`); put(ctx, id, D(x, 0.12, 3.5 + (j % 2) * 0.7), D.yaw + (hash(j) - 0.5) * 0.6); });
        ctx.store.cheer = cheer;
        ctx.store.D = frameAt(ctx, 'house.6.door');
      } else { deckShot(ctx, { spot: i === 3 ? KF : KC }); ctx.add(ctx.props.splat); }
    },
    update(ctx) {
      const { L } = ctx.store, t = ctx.t, k = tk(ctx), P = ctx.props, hits = k.b18h; const s = applyCrack(ctx); nightFog(ctx, 14, 110);
      const n = hits.filter((h) => h <= t).length, h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      if (i === 2 || i === 4) {
        const { cheer, D } = ctx.store;
        ctx.set.set('windowGlow', (hi, wi) => (hash(hi * 13.1 + wi * 3.7) < (n + 0.5) / 5 ? 1 : 0.08));
        cheer.forEach(([id], j) => { const c = ctx.cast[id]; c.pose('cheer', t + j * 0.4, { speed: 1.3 }); c.face(j % 2 ? 'laugh' : 'grin', t + j); });
        if (i === 2) setCam(ctx, { pos: D(-3.5, 1.7, 11.5), look: D(-3.0, 2.6, 2.0), fov: 54 }, 1.2, '#ffe0b0');
        else { const c = ctx.cast.x06, f = humanFace(c); const dir = V(Math.sin(c.root.rotation.y - 0.55), 0, Math.cos(c.root.rotation.y - 0.55)); setCam(ctx, { pos: f.clone().addScaledVector(dir, 2.8).add(up(-0.2)), look: f.clone().add(up(-0.2)), fov: 38 }, 1.5, '#ffe0b0'); }
      } else {
        const me = ctx.cast.me;
        smearPose(me, t, hits); me.face(dh < 0.18 ? 'huss' : 'determined', t);
        const target = CR(ctx, P.crack.userData.slamX, P.crack.userData.slamY, 0.45);
        P.splat.position.copy(target); P.splat.scale.set(1.25, 0.9, 0.5); P.splat.rotation.set(0, PI / 2, 0);
        const cams = {
          0: { pos: L(TX + 4.6, DY + 1.0, TZ + 2.6), look: L(TX + 0.8, DY + 3.2, TZ), fov: 62 },
          1: { pos: L(TX + 15, DY + 3.5, TZ - 7), look: L(TX + 0.5, DY + 5.5, TZ), fov: 50 },
          3: { pos: L(TX + 4.6, DY + 0.9, TZ - 1.6), look: L(TX + 0.6, DY + 3.8, TZ), fov: 58 },
          5: { pos: L(TX + 20, DY + 3.5, TZ + 9), look: L(TX, DY + 5.8, TZ), fov: 50 },
        };
        setCam(ctx, cams[i], 0.8);
        if (i === 5) stamp(ctx, 'SEALED!', hits[5], { fill: '#ff6fb8', stroke: '#ffffff', y: 0.2 });
      }
      ctx.cam.punch(hits, t, 0.1, 0.2);
      ctx.cam.shake(0.12 + 0.25 * hitPulse(hits, t, 0.2), t, 51 + i);
      ctx.fx.overlay('#ff7ad0', 0.16 * hitPulse(hits, t, 0.1));
    },
  })),
  // ── b19 "Midnight. Silence. I did it."
  {
    name: 'clock 12:00', start: 'b19-0.1', set: 'town',
    setup(ctx) { const L = townBase(ctx, { fogRing: true, glow: 1 }); ctx.store.L = L; },
    update(ctx, lt) {
      const { L } = ctx.store; applyCrack(ctx);
      moveCam(ctx, { pos: L(TX + 14.5, 2.8, TZ + 8.2), look: L(TX, 15.3, TZ), fov: 44 }, { pos: L(TX + 14, 3, TZ + 8), look: L(TX, 15.6, TZ), fov: 44 }, clamp(lt / 1, 0, 1), 'inOutSine', 0);
      tag(ctx, 'MIDNIGHT', ctx.time('b19') + 0.1, Infinity, { y: 0.12, size: 70, bg: 'rgba(14,10,30,0.85)' });
    },
  },
  {
    name: 'i did it', start: 'b19.w1-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KF, fogRing: true }); ctx.set.set('windowGlow', 1); },
    update(ctx, lt, u) {
      const { L, me } = ctx.store, t = ctx.t, tw = ctx.time('b19.w2'); applyCrack(ctx); nightFog(ctx, 30, 190);
      if (t < tw) { me.pose('idle', t, { intensity: 0.3 }); me.face('neutral', t); } else { me.pose('cheer', t - tw, { speed: 0.9 }); me.face('grin', t); }
      moveCam(ctx, { pos: L(TX + 5.6, DY + 0.9, TZ + 1.6), look: L(TX + 0.8, DY + 3.6, TZ), fov: 56 }, { pos: L(TX + 5.2, DY + 1.0, TZ - 0.4), look: L(TX + 0.8, DY + 3.9, TZ), fov: 56 }, u, 'inOutSine', 1.2, '#ffd8e8');
    },
  },
  // ── b20 "Then I broke rule three. I looked inside."  — one eye to the last sliver
  {
    name: 'peer', start: 'b20-0.1', set: 'town',
    setup(ctx) {
      const L = townBase(ctx, { glow: 1 }); const P = ctx.props, C = P.crack.userData;
      const sx = C.xAt(0.55);
      put(ctx, 'me', L(TX + 0.95, DY, TZ - sx + 0.1), L.yaw - PI / 2);
      ctx.add(P.sliverGlow); ctx.store = { L, sx };
    },
    update(ctx, lt) {
      const { L, sx } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props; applyCrack(ctx); nightFog(ctx, 30, 190);
      const k = clamp((t - ctx.time('b20.w5')) / 0.5, 0, 1);
      me.pose('peer', t, { intensity: 0.3 }); me.face(k > 0.5 ? 'squint' : 'neutral', 0.5);
      me.root.position.copy(L(TX + 0.95 - 0.15 * k, DY, TZ - sx + 0.1));
      const sp = CR(ctx, sx, 0.62, 0.1); P.sliverGlow.position.copy(sp); P.sliverGlow.scale.setScalar(0.9 + 0.2 * Math.sin(t * 5)); P.sliverGlow.material.opacity = 0.9;
      moveCam(ctx, { pos: L(TX + 0.3, DY + 1.85, TZ - sx + 2.6), look: L(TX + 0.28, DY + 1.8, TZ - sx), fov: 44 }, { pos: L(TX + 0.3, DY + 1.83, TZ - sx + 2.0), look: L(TX + 0.28, DY + 1.8, TZ - sx), fov: 46 }, clamp(lt / 2.4, 0, 1), 'inOutSine', 1.2, '#ffd0ec');
      tag(ctx, 'RULE 3', ctx.time('b20.w3'), Infinity, { y: 0.16, size: 90, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  // ── b21 "Phew. The ladder monsters almost got in again." — the other side
  {
    name: 'other side', start: 'b21-0.12', set: 'other',
    setup(ctx) {
      const P = ctx.props;
      const g = put(ctx, 'grey', V(0, 0, -1.05), 0);
      ctx.add(P.knL, g.joints.handL); ctx.add(P.knR, g.joints.handR);
      ctx.add(P.tapeSheet); P.tapeSheet.position.set(0.05, 0.98, -0.44); P.tapeSheet.scale.set(0.7, 0.6, 1);
      ctx.add(P.greyRoll); ctx.add(P.hand); ctx.add(P.eye);
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, g = ctx.cast.grey, k = tk(ctx);
      const tw = ctx.time('b21.w1') - 0.2, wk = clamp((t - tw) / 0.35, 0, 1) * (1 - clamp((t - tw - 1.3) / 0.4, 0, 1));
      g.pose('idle', t, { intensity: 0.5 }); g.face('sweat', t);
      const J = g.joints;
      J.armR.rotation.x += -1.5; J.armR.rotation.z += 0.2; J.foreArmR && (J.foreArmR.rotation.x += -0.4);
      const press = 1 - wk;
      J.armL.rotation.x += -1.5 * press; J.armL.rotation.z += -0.2 * press; J.foreArmL && (J.foreArmL.rotation.x += -0.4 * press);
      wipeBrow(g, wk);
      g.root.updateMatrixWorld(true);
      P.greyRoll.userData.set(0.6); P.greyRoll.position.copy(J.handR.getWorldPosition(V())).add(V(0, 0.08, 0.1)); P.greyRoll.rotation.set(0, 0, 0);
      P.tapeSheet.rotation.set(0, 0, 0.08 * Math.sin(t * 0.7));
      const hl = smooth((t - ctx.time('b21') - 0.2) / 2.4);
      P.hand.position.set(-1.1, lerp(5.0, -0.5, hl), -8.5); P.hand.rotation.set(0.1, 0.25, 0.15);
      P.eye.position.set(1.1, 2.6, -5.6); P.eye.rotation.set(0, -0.3, 0); P.eye.userData.set(0.45 + 0.1 * Math.sin(t * 0.8), -0.6, -0.2);
      ctx.cam.move({ pos: V(0.25, 1.5, 2.1), look: V(0.2, 1.6, -3), fov: 54 }, { pos: V(0.2, 1.45, 1.8), look: V(0.2, 1.6, -3), fov: 52 }, clamp(lt / 2.8, 0, 1), 'inOutSine');
      sliverMask(ctx, t);
      lightCard(ctx, 'Phew. The ladder monsters almost got in again.', 'the other side', ctx.markers.quote2, ctx.time('b22') - 0.06, { byAt: ctx.time('b21.w4') });
    },
  },
  // ── b22 "The monsters. They meant us."  — pull back from the frozen face to the sealed crack; cut to black
  {
    name: 'pull back', start: 'b22-0.1', set: 'town',
    setup(ctx) { deckShot(ctx, { spot: KF, fogRing: false }); ctx.set.set('windowGlow', 1); },
    update(ctx, lt) {
      const { L, me } = ctx.store, t = ctx.t, k = tk(ctx); applyCrack(ctx); nightFog(ctx, 60, 260);
      me.pose('stunned', 0.3); me.face('shocked', 0.5);
      const f = humanFace(me);
      const th = ctx.time('b22.w2') - 0.1;            // hold the frozen face, then crane out
      const u = ease.inOutCubic(clamp((t - th) / (k.us + 0.15 - th), 0, 1));
      const hold = clamp((t - ctx.time('b22') + 0.1) / (th - ctx.time('b22') + 0.1), 0, 1);
      const a = { pos: f.clone().add(V(1.85 - 0.25 * hold, 0.05, 0.27 - 0.04 * hold)), look: f.clone(), fov: 36 };
      const b = { pos: L(TX + 58, DY + 26, TZ + 30), look: L(TX + 4, DY + 3, TZ - 1), fov: 46 };
      const w = ease.inQuad(u);
      ctx.cam.set({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, Math.min(1, w * 1.1)), fov: lerp(a.fov, b.fov, u) });
      fill(ctx, { pos: a.pos }, 1.3 * (1 - u));
      ctx.cam.shake(0.25 * hitPulse([k.us], t, 0.3), t, 61);
      if (t > k.us + 0.45) ctx.fx.overlay('#000000', 1);
    },
  },
];

// ═════════════════════════════════════════════════════════════════════════════════ shot helpers
/** Day flashback: ladder against the clock tower, clouds, Mr Hamble near the top, the small crack. */
function flashback(ctx) {
  const L = townBase(ctx, { lighting: 'day', crack: false });
  const P = ctx.props, root = ctx.set.root;
  ctx.add(P.ladder, root); P.ladder.position.set(TX + 4.0, 0, TZ); P.ladder.rotation.set(0, 0, 0.074);
  const cl = [[TX + 1.5, 28.2, TZ - 4, 2.6], [TX + 6.5, 26.0, TZ + 5, 2.0], [TX - 2.5, 29.5, TZ + 3, 3.0], [TX + 9, 23.5, TZ - 6, 1.7], [TX + 4.5, 31, TZ + 0.5, 2.4]];
  P.clouds.forEach((c, i) => { ctx.add(c, root); c.position.set(cl[i][0], cl[i][1], cl[i][2]); c.scale.setScalar(cl[i][3]); });
  ctx.add(P.crackFB, root); P.crackFB.position.set(TX + 1.45, 23.6, TZ); P.crackFB.rotation.set(0, PI / 2, 0);
  ctx.add(P.sun, P.crackFB); P.sun.position.set(0, 2.5, 3); P.sun.intensity = 0;
  put(ctx, 'hamble', L(0, 0, 0), L.yaw - PI / 2);
  return L;
}
function hamblePos(ctx, t) {
  const L = T(ctx), k = tk(ctx);
  const y = 23.3 - 1.4 * (1 - smooth((t - k.b04) / 1.9));
  const x = TX + 4.0 - y * Math.tan(0.074) + 0.32;
  return L(x, y, TZ);
}
function flashAnim(ctx) {
  const t = ctx.t, k = tk(ctx), h = ctx.cast.hamble, P = ctx.props, L = T(ctx);
  h.root.position.copy(hamblePos(ctx, t));
  const tap = k.bumped - 0.05, turn = ease.inOutCubic(clamp((t - k.crack5 + 0.1) / 0.3, 0, 1));
  h.root.rotation.set(0, L.yaw - PI / 2 + 2.2 * turn, 0);
  if (t < tap - 0.35) { climbPose(h, t); h.face('determined', t); }
  else if (turn < 0.05) {
    h.pose('point', t, { headPitch: -0.75 }); h.face(t > tap + 0.6 ? 'smile' : 'determined', t);
    const jab = Math.max(0, Math.sin((t - tap) * 18)) * (t > tap && t < tap + 0.5 ? 1 : 0);
    h.joints.armR.rotation.x += -1.05 - 0.25 * jab; h.joints.legL.rotation.x += -0.2;
  } else { h.pose('surprised', 0.3); h.face('shocked', 0.5); }
  // the small crack: a nick after the tap, then the big zigzag on "Crack."
  const g1 = 0.12 * ease.outCubic(clamp((t - tap) / 0.4, 0, 1));
  const g2 = ease.outCubic(clamp((t - k.crack5 + 0.02) / 0.3, 0, 1));
  const gr = Math.max(g1, g2);
  P.crackFB.visible = gr > 0.01;
  P.crackFB.userData.set({ t, open: 0.35 + 0.25 * g2, glow: 1, pulse: 1.2 * hitPulse([k.crack5], t, 0.3) + 0.4 * hitPulse([tap], t, 0.2), grow: gr, growFrom: 0.42 });
  P.crackFB.userData.setFingers({ slide: 0 });
  for (let i = 0; i < P.crackFB.userData.nTape; i++) P.crackFB.userData.tape(i, 1, t);
  return L;
}
function flashLook(ctx) { ctx.fx.overlay('#ffbf70', 0.1); ctx.fx.vignette(0.45); }

// park (b08)
const PT = { x: -49.8, z: -14 };
function park(ctx) {
  const L = townBase(ctx, { lighting: 'day', crack: false, tower: true });
  const P = ctx.props, root = ctx.set.root;
  ctx.add(P.picnic, root); P.picnic.position.set(PT.x, 0, PT.z); P.picnic.rotation.set(0, 0, 0);
  put(ctx, 'mayor', L(PT.x + 0.15, 0, PT.z + 0.62 - 0.06), L.yaw);
  put(ctx, 'grandma', L(PT.x + 1.35, 0, PT.z + 1.1), L.yaw - 0.45);
  ctx.add(P.bubble, ctx.cast.grandma.joints.head); P.bubble.position.set(0, 0.2, 0.3);
  ctx.add(P.strings, root); ctx.add(P.seatGum, root); P.seatGum.position.set(PT.x + 0.15, 0.48, PT.z + 0.68); P.seatGum.scale.set(2.4, 0.5, 1.4);
  ctx.add(P.leaves, root); P.leaves.position.set(PT.x + 0.5, 0, PT.z + 1.8);
  ctx.add(P.sun, root); P.sun.position.set(PT.x + 0.8, 2.5, PT.z + 3.5); P.sun.intensity = 4;
  const walkers = ['x16', 'x17'];
  walkers.forEach((id) => ctx.place(id, L(PT.x, 0, PT.z - 4)));
  ctx.store.walkers = walkers;
  return L;
}
function parkAnim(ctx) {
  const t = ctx.t, m = ctx.cast.mayor, g = ctx.cast.grandma, P = ctx.props, L = T(ctx);
  m.pose('wave', t, { seated: true, seatHeight: 0.45, speed: 0.55, intensity: 0.6 }); m.face('sad', 0.8);
  g.pose('crossArms', t); g.face('smug', 0.6);
  chew(g, t, 1.2);
  P.leaves.userData.set(t);
  P.bubble.userData.set(0);                      // per-frame reset (grandma gum overrides it after parkAnim)
  m.root.updateMatrixWorld(true);
  const toLocal = (v) => ctx.set.root.worldToLocal(v);
  const J = m.joints, pairs = [];
  for (const [leg, dx] of [[J.legL, 0.05], [J.legR, -0.05]]) {
    const a = leg.localToWorld(V(dx, -0.12, 0.05)), b = a.clone(); b.y = 0.47; b.x += 0.03 * Math.sin(t * 1.3);
    pairs.push([toLocal(a.clone()), toLocal(b.clone()), 0.05]);
    const a2 = leg.localToWorld(V(-dx, -0.2, 0.18)), b2 = a2.clone(); b2.y = 0.46; b2.z -= 0.05;
    pairs.push([toLocal(a2.clone()), toLocal(b2.clone()), 0.04]);
  }
  const hip = J.hips.localToWorld(V(0, 0.0, -0.12));
  pairs.push([toLocal(hip.clone()), toLocal(L(PT.x + 0.1, 0.77, PT.z + 0.32)), 0.055]);
  pairs.push([toLocal(J.hips.localToWorld(V(0.18, 0.1, -0.1))), toLocal(L(PT.x + 0.45, 0.77, PT.z + 0.3)), 0.045]);
  pairs.push([toLocal(J.hips.localToWorld(V(-0.18, 0.05, -0.1))), toLocal(L(PT.x - 0.2, 0.47, PT.z + 0.75)), 0.045]);
  P.strings.userData.set(pairs);
  ctx.store.walkers.forEach((id, i) => {
    const c = ctx.cast[id], x = -6 + ((t * 1.1 + i * 6) % 12);
    c.root.position.copy(L(PT.x + (i ? -x : x), 0, PT.z - 4.5 - i * 1.2)); c.root.rotation.set(0, L.yaw + (i ? -PI / 2 : PI / 2), 0);
    c.pose('walk', t + i, { speed: 1.2 }); c.face('neutral', t + i);
  });
}
// pigeon bench (b09/b10): a bench on the south pavement, facing the street (−Z), in daylight
const PB = { x: -6.4, z: 6.5 };
function pigeonBench(ctx) {
  const L = townBase(ctx, { lighting: 'day', crack: false, tower: false });
  const P = ctx.props;
  ctx.add(P.bench, ctx.set.root); P.bench.position.set(PB.x, 0.12, PB.z + 0.05); P.bench.rotation.set(0, PI, 0);
  const p = put(ctx, 'pigeon', L(PB.x, 0.66, PB.z), L.yaw + PI);
  ctx.add(P.shades, p.joints.head); P.shades.position.set(0, 0.083, 0.092); P.shades.rotation.set(0, 0, 0);
  ctx.add(P.leaves, ctx.set.root); P.leaves.position.set(PB.x, 0.1, PB.z - 1.5);
  return L;
}
function pigeonAnim(ctx, turn) {
  const p = ctx.cast.pigeon, t = ctx.t;
  if (turn) { p.pose('sit', t, { lookAt: p.root.position.clone().lerp(turn.cam, turn.k).add(V(0, 0.2 * (1 - turn.k), 0)) }); }
  else p.pose('sit', 0.4, { headYaw: 0, headPitch: 0 });
  p.face('neutral', 0.5);
  ctx.props.leaves.userData.set(t);
}
// bedroom (b11)
function bedroom(ctx) {
  const S = ctx.set; S.setLighting?.('night'); S.set?.('window', 'dark');
  S.root.updateMatrixWorld(true);
  const R = (x, y, z) => S.root.localToWorld(V(x, y, z)); const yaw = yawOf(S.root);
  const d = put(ctx, 'dad', R(0.25, 0, 0.15), yaw + PI / 2);
  put(ctx, 'me', R(0.55, 0, -0.85), yaw + 0.15);
  const P = ctx.props;
  ctx.add(P.jar); P.jar.position.copy(R(-0.75, 0, 0.62)); P.jar.rotation.set(0, 0.4, 0);
  ctx.add(P.roll); P.roll.position.copy(R(1.65, 0.42, -1.4)); P.roll.rotation.set(0, yaw + 0.3, 0); P.roll.userData.set(1);
  return R;
}
function bedroomAnim(ctx) {
  const t = ctx.t, d = ctx.cast.dad, me = ctx.cast.me;
  d.pose('crowdSurf', t, { lift: 0.22, intensity: 0.12, speed: 0.4 }); d.face('sweat', t);
  me.pose('crossArms', t); me.face('smug', 0.4);
}
// the sliver mask (b21): black frame with a jagged glowing slit through which we see the other side
function sliverMask(ctx, t) {
  ctx.fx.draw((g, W, H) => {
    const n = 14, L = [], Rr = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, y = H * (0.02 + 0.96 * u);
      const cx = W * (0.5 + (i % 2 ? 0.045 : -0.045) * Math.sin(PI * u) + 0.01 * Math.sin(i * 2.3));
      const hw = W * (0.04 + 0.33 * Math.pow(Math.sin(PI * u), 0.7)) * (0.92 + 0.08 * Math.sin(i * 1.7));
      L.push([cx - hw, y]); Rr.push([cx + hw, y]);
    }
    const path = (nb) => { if (!nb) g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]); for (const p of Rr.slice().reverse()) g.lineTo(p[0], p[1]); g.closePath(); };
    g.save();
    g.fillStyle = '#05010a'; g.beginPath(); g.rect(0, 0, W, H); path(true); g.fill('evenodd');
    path(); g.shadowColor = '#d070ff'; g.shadowBlur = 40; g.strokeStyle = '#f0c0ff'; g.lineWidth = 9; g.lineJoin = 'round'; g.stroke();
    g.shadowBlur = 0; g.strokeStyle = '#ff9ad6'; g.lineWidth = 3; g.stroke();
    g.restore();
  });
}
/** quote card variant with a lighter overlay, near the top (the scene stays readable). */
function lightCard(ctx, quote, by, t0, t1, { y = 0.12, size = 70, byAt = null } = {}) {
  const t = ctx.t; if (t < t0 || t > t1) return;
  const d = t - t0, a = clamp(Math.min(d / 0.12, (t1 - t) / 0.12), 0, 1);
  const pop = d < 0.2 ? ease.outBack(clamp(d / 0.2, 0, 1)) : 1;
  const lines = wrap(`“${quote}”`, 20), nl = lines.split('\n').length;
  ctx.fx.text(lines, { y, size, font: 'narr', fill: '#ffffff', stroke: '#000000', line: 10, scale: 0.6 + 0.4 * pop, alpha: a, rot: -0.02 });
  if (by) ctx.fx.text(`— ${by}`, { y: y + (nl * 0.5 + 0.7) * size * 1.05 / 1920, size: size * 0.66, font: 'narr', fill: '#ffe14a', stroke: '#000000', line: 10, bg: 'rgba(8,2,16,0.85)', alpha: clamp((byAt != null ? t - byAt : d - 0.25) / 0.12, 0, 1) * a, rot: -0.02 });
  ctx.caption.hide(true);
}
