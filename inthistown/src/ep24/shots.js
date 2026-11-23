// In This Town — Episode 24: "Word of the Day".  Every morning at eight a giant new word falls out of a crack in the sky
// and the whole town has to say it all day.  The kid refuses (cringe).  Then one morning nothing falls, the town forgets
// how to talk, the sky turns red and a giant EAR leans through the crack, listening.  The kid climbs on stage… HUSS!
// The town chants it back, the sky turns gold — and a giant hand hands him a pencil: tomorrow's word is due at eight.
// Film contract: SPEC.md §8.  Timeline: episodes/ep24/timeline.json.
//
// Sets: 'town' (buildTown seed 24, banner WORD OF THE DAY / PRESS / CONFERENCE), 'room' (hero bedroom, dark window),
// 'cliff' (custom: the end of main street where the bridge used to be).
// Town-local coordinates (T(ctx)): square plaza x 30…62, z ±18; stage deck y 0.8, front edge x 49.5; our clock tower
// stands behind the stage at TOWER; the sky crack hangs east above it (CRACK).  Letter blocks land on the plaza
// chessboard in a row along z at x = BLOCK_X.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { WALK_SPEED, WALK_SAD_SPEED } from '../characters.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard } from '../cards.js';
import { makeConfetti } from '../props.js';
import { makeTumbleweed } from '../shots.js';
import { glowSprite, makePuff, makeSparkles, makeClockTower } from '../ep18/props.js';
import { makeFillerCrowd } from '../ep19/props.js';
import { makeShockRing, makeSpeech } from '../ep20/props.js';
import { makeClockFace, makeDoorway } from '../ep23/props.js';
import {
  makeSkyCrack, makeLetterBlock, makeMower, makeSpikyHair, makePodium, makeBridgeSign, makeHand, makePencil, makeTears,
  makeWallClock, buildCliffSet,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const SPECIAL = {
  grandma: { id: 'grandma', skin: '#f4d0b5', hair: { style: 'bun', color: '#ececec' }, top: { style: 'cardigan', color: '#ff8fc0', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#7a5a8a' }, shoes: '#5a3b2f', accessories: ['glasses'], scale: 0.88 },
  dunbar: { id: 'dunbar', skin: '#e9b99a', hair: { style: 'short', color: '#a3a3a3' }, top: { style: 'tee', color: '#3f8f5a', accent: '#ffffff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#6b5a48' }, shoes: '#3a2a20', accessories: ['beard', 'cap'], capColor: '#2f4d8a', scale: 1.0, build: 1.12 },
  g1: { id: 'g1', skin: '#c68642', hair: { style: 'fade', color: '#1a120c' }, top: { style: 'tee', color: '#1d1d22', accent: '#e8232b', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#1d1d22', accessories: ['sunglasses', 'chain'], scale: 1.04, build: 1.3 },
  g2: { id: 'g2', skin: '#f1c7a1', hair: { style: 'spiky', color: '#e8c46a' }, top: { style: 'tee', color: '#1d1d22', accent: '#e8232b', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#1d1d22', accessories: ['sunglasses', 'cap'], capColor: '#1d1d22', scale: 1.0, build: 1.25 },
  g3: { id: 'g3', skin: '#8d5524', hair: { style: 'bald', color: '#8d5524' }, top: { style: 'tee', color: '#1d1d22', accent: '#e8232b', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#1d1d22', accessories: ['sunglasses', 'chain', 'beard'], scale: 1.08, build: 1.4 },
  g4: { id: 'g4', skin: '#e0ac69', hair: { style: 'short', color: '#3b2416' }, top: { style: 'tee', color: '#1d1d22', accent: '#e8232b', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#1d1d22', accessories: ['sunglasses'], scale: 0.98, build: 1.2 },
};
export const cast = { me: MAIN.me, mayor: MAIN.mayor, pigeon: MAIN.pigeon, ...SPECIAL, ...EXTRAS };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 24, banner: ['WORD OF THE DAY', 'PRESS', 'CONFERENCE'] }),
  room: () => buildRoom({ variant: 'hero', window: 'dark' }),
  cliff: () => buildCliffSet(),
};
const X = EXTRA_IDS;
const GOONS = ['g1', 'g2', 'g3', 'g4'];

// ───────────────────────────────────────────────────────────────────────────────────────── layout (town-local)
const STAGE_Y = 0.8;
// the clock tower stands BESIDE the stage (north-west of it), turned to face the plaza, so the stage truss never crosses
// it from the plaza; the sky crack hangs high above and to the right of it (north-east), well above the truss beam.
const TOWER = { x: 52, z: -13.5, yaw: Math.atan2(40 - 52, 2 + 13.5) };
const CLOCK = { x: 52 + 1.37 * Math.sin(TOWER.yaw), y: 11, z: -13.5 + 1.37 * Math.cos(TOWER.yaw) };
const CRACK_POS = [86, 56, -34], CRACK_H = 30, CRACK_FACE = [40, 4, 2];
const BLOCK_X = 45.2, BLOCK_DZ = 1.76, BLOCK_S = 1.6;
const SKRONK = ['S', 'K', 'R', 'O', 'N', 'K'], HUSSW = ['H', 'U', 'S', 'S'];
const PODIUM = { x: 50.25, z: 0 }, MAYOR_ST = { x: 50.9, z: 0 };
const KID_STAGE = { x: 50.4, z: 0 };
const KID_LAMP = { x: 30.8, z: 10.1 };                 // the plaza lamp the kid leans on (west edge, by the street)
const MOWER = { x: 6.9, z: -9.0 };                     // Dunbar's front yard (north house at x = 9; fence z −7.5)
const ROW = (n, z0 = null) => Array.from({ length: n }, (_, i) => (z0 ?? -(n - 1) / 2 * BLOCK_DZ) + i * BLOCK_DZ);

export function init(ctx) {
  const P = ctx.props;
  P.crack = makeSkyCrack();
  P.crackWin = makeSkyCrack({ seed: 7 });
  P.tower = makeClockTower(); P.clock = makeClockFace();
  P.blocks = SKRONK.map((c) => makeLetterBlock(c));
  P.bonkle = ['B', 'O', 'N', 'K', 'L', 'E'].map((c) => makeLetterBlock(c));
  P.huss = HUSSW.map((c, i) => makeLetterBlock(c, ['#ff4fa3', '#3ee0c8', '#ffd23f', '#8a5cff'][i]));
  P.puffs = [0, 1, 2, 3, 4, 5].map((i) => makePuff({ color: '#e8dcc8', count: 16, radius: 1.3, seed: 3 + i }));
  P.popPuff = makePuff({ color: '#ffffff', count: 16, radius: 0.7, seed: 9 });
  P.mower = makeMower();
  P.hair = makeSpikyHair();
  P.podium = makePodium();
  P.sign = makeBridgeSign();
  P.hand = makeHand(); P.pencil = makePencil(); P.pencil2 = makePencil();
  P.tears = makeTears(60);
  P.wallClock = makeWallClock();
  P.tumble = makeTumbleweed();
  P.filler = makeFillerCrowd(150);
  { const u = P.filler.userData, orig = u.set; u._set = orig; u.set = (t, o) => { u._last = [t, o]; orig(t, o); }; }
  P.rings = [0, 1, 2].map(() => makeShockRing());
  P.sparkles = makeSparkles({ n: 70, w: 24, h: 14, d: 10, color: '#ffe08a', size: 0.12 });
  P.dust = makeSparkles({ n: 50, w: 12, h: 7, d: 8, color: '#ffd8c8', size: 0.06 });
  P.confetti = makeConfetti({ count: 140, t0: 0, origin: [0, 0, 0], speed: 6, spread: 0.9, groundY: 0 });
  P.doors = [0, 1, 2].map((i) => makeDoorway(['#3f7a5a', '#b5543f', '#2f4d8a'][i]));
  P.mono = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.6, 2.0), new THREE.MeshStandardMaterial({ color: '#7a1f2b', roughness: 0.5 }));
  P.monoTrim = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.12, 2.2), new THREE.MeshStandardMaterial({ color: '#ffd23f', roughness: 0.4, emissive: '#806000', emissiveIntensity: 0.3 }));
  P.nightSky = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshBasicMaterial({ color: '#0b1030', fog: false }));
  const B = (t, o) => makeSpeech(t, o);
  P.bub = {
    skronk: [B('SKRONK!'), B('SKRONK!', { color: '#ffe14a' }), B('SKRONK!', { color: '#bff4ff' }), B('SKRONK!', { color: '#ffd0e8' }), B('SKRONK!')],
    gubbins: B('GUBBINS!', { color: '#ffe14a' }), flimbo: [B('FLIMBO!', { color: '#ffd0e8' }), B('FLIMBO!', { color: '#bff4ff' })],
    bonkle: B('BONKLE!', { color: '#bff4ff' }), flimbo2: B('FLIMBO!', { color: '#ffe14a' }), gubbins2: B('GUBBINS!', { color: '#ffd0e8' }),
    dots: [B('. . .'), B('. . .'), B('?', { color: '#ffe14a' })], bridge: B("WHERE'S THE BRIDGE?", { color: '#ffffff' }),
    huss: [0, 1, 2, 3, 4, 5].map((i) => B('HUSS!', { color: ['#ffe14a', '#ffffff', '#bff4ff', '#ffd0e8', '#ffe14a', '#c8ffb0'][i] })),
  };
  P.fill = new THREE.PointLight('#fff2e0', 5, 12, 1.4);
  P.glowLight = new THREE.PointLight('#fff2c0', 0, 60, 1.2);
  P.redLight = new THREE.PointLight('#ff3a2a', 0, 80, 1.0);
  P.winLight = new THREE.PointLight('#ffe6a0', 0, 7, 1.3);
  P.handGlow = glowSprite('#fff2c0', 6, 0.5);
  P.flashGlow = glowSprite('#fff6d0', 1, 0.8);
  P.earGlow = glowSprite('#ff7ab0', 1, 0.7); P.earGlow.renderOrder = 9;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function T(ctx) { const r = ctx.set.root; r.updateMatrixWorld(true); const M = r.matrixWorld.clone(); const f = (x, y, z) => V(x, y, z).applyMatrix4(M); f.yaw = yawOf(r); f.M = M; return f; }
function put(ctx, id, p, yaw, scale) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); if (scale != null) r.scale.setScalar(scale); return ctx.cast[id]; }
function addTo(ctx, obj, x, y, z, ry = 0, s = null) { const o = obj.root && obj.root.isObject3D ? obj.root : obj; ctx.add(o, ctx.set.root); o.position.set(x, y, z); o.rotation.set(0, ry, 0); if (s != null) o.scale.setScalar(s); return o; }
const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.14, size: 72, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,40,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale ?? 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 150, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.12, scale: s * (o.scale ?? 1), alpha: clamp(d / 0.06, 0, 1), ...o, scale: s * (o.scale ?? 1) });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
function camRight(c) { const f = c.look.clone().sub(c.pos); f.y = 0; f.normalize(); return V(-f.z, 0, f.x); }
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headTop(ch, y = 0.62) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, y, 0)); }
function fill(ctx, pos, k = 1, color = '#fff2e0', dist = 12) { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); f.distance = dist; }
function setCam(ctx, c, k = 0, color, dist) { ctx.cam.set(c); clearView(ctx, c); if (k > 0) fill(ctx, c.pos, k, color, dist); return c; }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0, color, dist) { const c = camLerp(a, b, clamp(u, 0, 1)); ctx.cam.set(c); clearView(ctx, c); if (k > 0) fill(ctx, c.pos, k, color, dist); return c; }
/** keep the lens clear: hide filler fans and crowd extras that sit right in front of (or around) the camera,
 *  unless they stand near the look point (the subject).  Pure function of the current camera. */
const _p = new THREE.Vector3(), _d = new THREE.Vector3(), _lk = new THREE.Vector3(), _q = new THREE.Vector3();
function blocks(x, y, z, s0, s1, r0, rk) {
  _q.set(x, y, z).sub(_p); const s = _q.dot(_d);
  if (s < s0 || s > s1) return false;
  const perp = _q.addScaledVector(_d, -s).length();
  return perp < r0 + rk * Math.max(0, s);
}
function clearView(ctx, c) {
  const r = ctx.set.root; r.updateMatrixWorld(true);
  _p.copy(c.pos); r.worldToLocal(_p); _lk.copy(c.look); r.worldToLocal(_lk); _d.copy(_lk).sub(_p).normalize();
  const nearLook = (x, z) => Math.hypot(x - _lk.x, z - _lk.z) < 1.6;
  const f = ctx.props.filler, all = ctx.store.fillAll;
  if (all && f.parent) {
    const keep = all.filter((it) => nearLook(it.x, it.z) || !(blocks(it.x, 1.0, it.z, -0.6, 5.0, 0.75, 0.1) || blocks(it.x, 1.8, it.z, -0.6, 5.0, 0.75, 0.1)));
    f.userData.layout(keep);
    if (f.userData._last) f.userData._set(...f.userData._last);
  }
  for (const w of ctx.store.crowdAll || []) {
    const o = w.ch.root; if (!o.parent) continue;
    _q.copy(o.position); if (o.parent !== r) { o.getWorldPosition(_q); r.worldToLocal(_q); }
    const x = _q.x, z = _q.z, y0 = _q.y;
    const hide = !nearLook(x, z) && (blocks(x, y0 + 1.0, z, -0.6, 3.2, 0.55, 0.08) || blocks(x, y0 + 1.8, z, -0.6, 3.2, 0.55, 0.08));
    o.visible = !hide;
  }
}
function pop(ctx, t0, dur = 0.12, color = '#ffffff', a = 0.5) { const d = ctx.t - t0; if (d >= 0 && d < dur) ctx.fx.overlay(color, a * (1 - d / dur)); }
function hitPulse(times, t, decay = 0.2) { let p = 0; for (const h of times) if (t >= h) p = Math.max(p, Math.exp(-(t - h) / decay)); return p; }
function lastBefore(times, t) { let r = null; for (const x of times) if (x <= t) r = x; return r; }
function shakeOn(ctx, hits, amt = 0.6, dur = 0.35, seed = 7) { for (const h of hits) { const d = ctx.t - h; if (d >= 0 && d < dur) ctx.cam.shake(amt * (1 - d / dur), ctx.t, seed); } }
const H = (beat, i) => (i === 0 ? `${beat}.h0-0.12` : `${beat}.h${i}-0.03`);
const hussHits = (ctx, beat) => ctx.hussTimes(beat).map((h) => h + 0.03);
const faceCam = (ch, d = 2.4, side = 0.35, below = 0.38, fov = 34, lift = -0.2) => {
  const f = humanFace(ch), y = ch.root.rotation.y, fw = V(Math.sin(y), 0, Math.cos(y)), l = V(fw.z, 0, -fw.x);
  return { pos: f.clone().addScaledVector(fw, d).addScaledVector(l, side).add(up(lift)), look: f.clone().add(up(-below)), fov };
};

// ─── built-in town pieces
function builtins(ctx) {
  const r = ctx.set.root; let b = ctx.props.bi;
  if (!b || b.root !== r) {
    b = { root: r, sky: r.getObjectByName('sky'), lampCores: r.getObjectByName('lampCores'), view: r.getObjectByName('windowView') };
    ctx.props.bi = b;
  }
  return b;
}
function town(ctx, light = 'day', { party = false, glow = 0.85, exposure = null, fireworks = false } = {}) {
  const s = ctx.set;
  s.setLighting(light); s.set('partyProps', party); s.set('fireworks', fireworks); s.set('foam', 0);
  s.set('windowGlow', light === 'day' ? 0 : glow); s.set('standsCrowd', false); s.set('crowdMotion', 1);
  s.exposure = exposure ?? (light === 'quiet_night' ? 1.25 : light === 'party_night' ? 1.1 : 1.0);
  const L = T(ctx); ctx.store.L = L;
  skyBase(ctx);
  return L;
}
function tower(ctx, m = 0, h = 8 / 12) {
  const P = ctx.props; addTo(ctx, P.tower, TOWER.x, 0, TOWER.z, TOWER.yaw); addTo(ctx, P.clock, CLOCK.x, CLOCK.y, CLOCK.z, TOWER.yaw);
  P.clock.userData.set(m, h);
}
/** the sky crack at a fixed town spot (default above the tower), facing the plaza */
function crack(ctx, pos = CRACK_POS, H = CRACK_H, face = CRACK_FACE) {
  const C = ctx.props.crack; addTo(ctx, C, pos[0], pos[1], pos[2], 0, H); C.lookAt(ctx.store.L(...face)); C.userData.ear.visible = false; return C;
}
/** the crack placed relative to a camera: screen point (sx, sy in −1…1) at distance dist */
function crackInView(ctx, cam, { sx = 0, sy = 0.45, dist = 75, H = CRACK_H } = {}) {
  const C = ctx.props.crack; ctx.add(C, ctx.set.root);
  const f = cam.look.clone().sub(cam.pos).normalize(), r = new THREE.Vector3().crossVectors(f, V(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f);
  const tv = Math.tan(cam.fov * PI / 360), th = tv * 9 / 16;
  const d = f.clone().addScaledVector(u, tv * sy).addScaledVector(r, th * sx).normalize();
  const w = cam.pos.clone().addScaledVector(d, dist);
  C.position.copy(ctx.set.root.worldToLocal(w)); C.scale.setScalar(H); C.rotation.set(0, 0, 0); C.lookAt(cam.pos);
  C.userData.ear.visible = false;
  return C;
}
/** crack state; with `ear` the giant ear fills the opening: ear ×2.2 the old size, a wider gap (Wmax) and a pink rim glow
 *  so the ear reads as ONE pink shape at phone size */
const EAR_S = 0.92;
function crackState(ctx, st, ear = null) {
  const C = ctx.props.crack; C.userData.set(ear ? { Wmax: 0.34, ...st } : st);
  const E = C.userData.ear; E.visible = !!ear; if (ear) { E.userData.set(ctx.t, ear); E.scale.setScalar(EAR_S * (ear.scale ?? 1)); E.position.set(0, 0.02, -0.07 + (ear.z ?? 0)); }
  const G = ctx.props.earGlow;
  if (G.parent !== C) C.add(G);
  G.visible = !!ear;
  if (ear) { const o = st.open ?? 0; G.position.set(0, 0.0, 0.03); G.scale.set(0.35 + 0.55 * o, 0.95, 1); G.material.opacity = 0.35 + 0.35 * o; G.material.color.set(st.gold ? '#ffd27a' : '#ff6aa8'); }
}
function crackWorld(ctx, lx = 0, ly = 0) { const C = ctx.props.crack; C.updateMatrixWorld(true); return C.localToWorld(V(lx, ly, 0)); }

// ─── sky moods (red / gold) layered on whatever preset the shot set
const RED = { z: '#2a0206', m: '#7a0a10', h: '#ff4a1a', g: '#2a0606', s: '#ff3010', fog: '#8a2216', hemi: ['#ff7a66', '#3a0808'], dir: '#ff6a4a' };
const GOLD = { z: '#e8962e', m: '#ffcf6a', h: '#fff3cf', g: '#9a7a4a', s: '#fff2a0', fog: '#ffe2a8', hemi: ['#ffe9b8', '#a08a5a'], dir: '#fff0c8' };
const _c = new THREE.Color(), _c2 = new THREE.Color();
function skyBase(ctx) {
  const r = ctx.set.root, sky = r.getObjectByName('sky');
  if (!sky || !sky.material.uniforms) { ctx.store.sky = null; return; }
  const u = sky.material.uniforms, lights = [];
  r.traverse((o) => { if (o.isHemisphereLight) lights.push({ o, c: o.color.clone(), g: o.groundColor.clone(), i: o.intensity }); else if (o.isDirectionalLight) lights.push({ o, c: o.color.clone(), i: o.intensity }); });
  ctx.store.sky = { u, base: { z: u.uZenith.value.clone(), m: u.uMid.value.clone(), h: u.uHorizon.value.clone(), g: u.uGround.value.clone(), s: u.uSunColor.value.clone() }, fog: ctx.set.fog.color.clone(), bg: ctx.set.background.clone(), lights };
}
function mix3(base, a, ka, b, kb) { _c.copy(base).lerp(_c2.set(a), ka); if (kb > 0) _c.lerp(_c2.set(b), kb); return _c; }
function skyMood(ctx, red = 0, gold = 0) {
  const S = ctx.store.sky; if (!S) return;
  const { u, base } = S;
  u.uZenith.value.copy(mix3(base.z, RED.z, red, GOLD.z, gold)); u.uMid.value.copy(mix3(base.m, RED.m, red, GOLD.m, gold));
  u.uHorizon.value.copy(mix3(base.h, RED.h, red, GOLD.h, gold)); u.uGround.value.copy(mix3(base.g, RED.g, red, GOLD.g, gold));
  u.uSunColor.value.copy(mix3(base.s, RED.s, red, GOLD.s, gold));
  ctx.set.fog.color.copy(mix3(S.fog, RED.fog, red, GOLD.fog, gold)); ctx.set.background.copy(ctx.set.fog.color);
  for (const l of S.lights) {
    if (l.g) { l.o.color.copy(mix3(l.c, RED.hemi[0], red, GOLD.hemi[0], gold)); l.o.groundColor.copy(mix3(l.g, RED.hemi[1], red, GOLD.hemi[1], gold)); l.o.intensity = l.i * (1 - 0.15 * red + 0.1 * gold); }
    else { l.o.color.copy(mix3(l.c, RED.dir, red, GOLD.dir, gold)); l.o.intensity = l.i * (1 - 0.3 * red + 0.1 * gold); }
  }
}
function lampFlicker(ctx, k = 1) {
  const lc = builtins(ctx).lampCores; if (!lc || !lc.instanceColor) return;
  const n = lc.count;
  for (let i = 0; i < n; i++) { const on = hash(Math.floor(ctx.t * 13) + i * 3.3) > 0.4; lc.setColorAt(i, _c.set(on ? '#ffb070' : '#2a1010').multiplyScalar(on ? 2.2 * k : 1)); }
  lc.instanceColor.needsUpdate = true;
}

// ─── speech bubbles
function bubble(ctx, sp, at, t0, { k = 0.52, t1 = Infinity } = {}) {
  const d = ctx.t - t0;
  if (d < 0 || ctx.t > t1) { sp.userData.set(0); return; }
  const s = d < 0.18 ? ease.outBack(clamp(d / 0.18, 0, 1)) : 1;
  sp.position.copy(at); sp.userData.set(k * Math.max(0.01, s));
}
function addBubbles(ctx, list) { list.forEach((b) => { ctx.add(b); b.userData.set(0); }); }

// ─── crowds
function crowd(ctx, ids, spots) {
  const L = ctx.store.L;
  const out = ids.map((id, i) => { const [x, y, z, yw] = spots[i]; const ch = put(ctx, id, L(x, y, z), L.yaw + yw); return { ch, id, k: i, ph: hash(i * 1.9 + 3) * 3, x, y, z, yw }; });
  (ctx.store.crowdAll ||= []).push(...out);
  return out;
}
function blockFill(x0, x1, z0, z1, n, { seed = 3, faceX = null, faceZ = null, yaw = null, y = 0, avoid = null } = {}) {
  const out = [];
  for (let i = 0; out.length < n && i < n * 4; i++) {
    const x = lerp(x0, x1, hash(i * 1.37 + seed)), z = lerp(z0, z1, hash(i * 2.71 + seed));
    if (avoid && avoid(x, z)) continue;
    const yw = yaw != null ? yaw : Math.atan2((faceX ?? x) - x, (faceZ ?? z) - z);
    out.push({ x, y, z, yaw: yw + (hash(i * 4.4 + seed) - 0.5) * 0.5, k: i, s: 0.86 + 0.24 * hash(i * 3.3 + seed) });
  }
  return out;
}
function filler(ctx, list) { const f = ctx.props.filler; ctx.add(f, ctx.set.root); f.position.set(0, 0, 0); f.userData.layout(list); ctx.store.fillAll = list; return f; }
/** the town gathered in the plaza facing east (toward the stage / sky).  corridor: keep |z| < 0.95 free (dolly lane) */
function plazaSpots(n, { seed = 5, x0 = 39.4, x1 = 46.8, z0 = -6, z1 = 6, corridor = false, yaw = PI / 2 } = {}) {
  const s = [];
  for (let i = 0; s.length < n && i < n * 6; i++) {
    const x = lerp(x0, x1, hash(i * 1.71 + seed)), z = lerp(z0, z1, hash(i * 2.93 + seed));
    if (corridor && Math.abs(z) < 0.95) continue;
    if (s.some((q) => Math.hypot(q[0] - x, q[2] - z) < 1.05)) continue;
    s.push([x, 0, z, yaw + (hash(i * 3.1 + seed) - 0.5) * 0.6]);
  }
  return s;
}
function plazaFiller(ctx, { n = 110, seed = 4, corridor = false, x0 = 36, x1 = 48.2 } = {}) {
  const avoid = (x, z) => (corridor && Math.abs(z) < 1.1) || (x > 38.8 && x < 47.2 && Math.abs(z) < 6.3);
  return filler(ctx, [...blockFill(x0, x1, -8.5, 8.5, n, { seed, yaw: PI / 2, avoid })]);
}

/** turn a crowd to face the sky crack (they look up at it) */
function faceCrack(ctx, list, jit = 0.25) { const L = ctx.store.L; list.forEach((w) => { w.ch.root.rotation.y = L.yaw + yawTo(w.x, w.z, CRACK_POS[0], CRACK_POS[2]) + (hash(w.k * 1.7 + 2) - 0.5) * jit; }); }
// ─── poses
function raiseHand(ch, t, k = 1, wave = 0) {
  ch.pose('idle', t, { intensity: 0.4 });
  const J = ch.joints; J.armR.rotation.set(-2.85 * k + 0.12 * wave * Math.sin(t * 9), 0, -0.12); J.foreArmR.rotation.set(-0.15, 0, 0);
}
function pointSelf(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints; J.armR.rotation.set(-0.75 * k, 0, 0.45 * k); J.foreArmR.rotation.set(-1.85 * k, 0, 0); J.torso.rotation.x += 0.05 * k; J.head.rotation.x += 0.08 * k;
}
function hugPose(ch, t) {
  ch.pose('sit', t, { seatHeight: 0.5, hands: 'none', intensity: 0.25 });
  const J = ch.joints;
  J.armL.rotation.set(-1.15, 0, -0.42); J.armR.rotation.set(-1.15, 0, 0.42);
  J.foreArmL.rotation.set(-1.0, 0, 0); J.foreArmR.rotation.set(-1.0, 0, 0);
}
function leanBack(ch, k = 0.12) { ch.root.rotation.x = -k; }

// ─── letter blocks
const BLOCK_TOP = BLOCK_S / 2;
function placeBlocks(ctx, blocks, zs, x = BLOCK_X, y = BLOCK_TOP) { blocks.forEach((b, i) => { addTo(ctx, b, x, y, zs[i], -PI / 2, BLOCK_S); b.userData.set(1); }); }
/** S-K-R-O-N-K lands as a 3 × 2 wall that reads in portrait: SKR on top, ONK below (block i → town-local rest spot) */
const WALL = (i) => [BLOCK_X, BLOCK_TOP + (i < 3 ? BLOCK_S : 0), ((i % 3) - 1) * 1.7];
function placeWall(ctx) { ctx.props.blocks.forEach((b, i) => { const w = WALL(i); addTo(ctx, b, w[0], w[1], w[2], -PI / 2, BLOCK_S); b.userData.set(1); }); }
/** block i falls from `from` (town-local) and lands at its rest spot at time tl (flight dur) */
function fallBlock(ctx, b, from, rest, tl, dur = 0.7, spin = 1) {
  const t = ctx.t, u = (t - (tl - dur)) / dur;
  if (u < 0) { b.visible = false; return -1; }
  b.visible = true;
  if (u < 1) {
    b.position.set(lerp(from[0], rest[0], u), lerp(from[1], rest[1], u * u), lerp(from[2], rest[2], u));
    b.rotation.set(spin * 4 * (1 - u), -PI / 2 + spin * 3 * (1 - u), spin * 2.5 * (1 - u));
    b.scale.setScalar(BLOCK_S);
    return -1;
  }
  const d = t - tl;
  b.position.set(rest[0], rest[1] + 0.35 * Math.abs(Math.sin(PI * d / 0.22)) * Math.exp(-7 * d), rest[2]);
  b.rotation.set(0, -PI / 2, 0);
  const sq = Math.exp(-10 * d) * 0.18;
  b.scale.set(BLOCK_S * (1 + sq), BLOCK_S * (1 - sq), BLOCK_S * (1 + sq));
  return d;
}

// ─── crowd surf
function surfer(ctx, me, p, dir, t, lift = 2.35) {
  me.root.position.copy(p); me.root.rotation.set(0, Math.atan2(dir.x, dir.z) + PI, 0);
  me.pose('crowdSurf', t, { lift });
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, every morning at eight…"  — bright morning, the square and the clock tower at 8:00
  {
    name: 'morning square', start: 0, set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true }); tower(ctx, 0, 8 / 12);
      const sp = [[37.5, 0, 7.5, PI / 2 + 0.6], [43, 0, -5.5, -0.4], [36, 0, -2.5, 1.9], [46.5, 0, 4.5, PI + 0.4], [41.5, 0, 3.6, PI / 2], [45, 0, -1.5, -PI / 2 - 0.3], [34.5, 0, 4, 2.5], [47.5, 0, -6.5, -1.2]];
      ctx.store.walk = crowd(ctx, X.slice(0, 8), sp);
      plazaFiller(ctx, { n: 40, seed: 11, x0: 44, x1: 48.5 });
      ctx.add(ctx.props.sparkles);
    },
    update(ctx, lt, u) {
      const L = ctx.store.L, t = ctx.t;
      ctx.store.walk.forEach((w) => { const sp = WALK_SPEED * 0.7 * t; w.ch.root.position.copy(L(w.x + sp * Math.sin(w.yw) * 0.6, 0, w.z + sp * Math.cos(w.yw) * 0.6)); w.ch.pose('walk', t + w.ph, { speed: 0.7 }); w.ch.face('smile', t + w.ph); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.25, speed: 0.6 });
      // push in on the tower: the 8:00 clock face lands in the upper third (y ≈ 0.35), clear of the caption
      const c = moveCam(ctx, { pos: L(36.4, 1.7, 6.6), look: L(50.6, 8.0, -11.6), fov: 54 }, { pos: L(41.4, 3.9, 0.2), look: L(CLOCK.x, 9.25, CLOCK.z), fov: 38 }, ease.inOutSine(clamp(lt / 1.75, 0, 1)));
      const sp = ctx.props.sparkles; sp.position.copy(c.pos.clone().lerp(c.look, 0.25)); sp.userData.set(t, 0.5);
      tag(ctx, '8:00 AM', 0.9, Infinity, { y: 0.1, size: 96, fill: '#ffe14a', bg: 'rgba(20,20,40,0.85)' });
    },
  },
  // ── "…a new word falls out of the sky."  — the crack rips open above the tower; S-K-R-O-N-K tumble out and slam
  //    into the square as a 3 × 2 wall (SKR / ONK); the camera rides the blocks down and holds the whole word.
  {
    name: 'skronk falls', start: 'b01.w6-0.05', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { party: true }); tower(ctx, 0, 8 / 12); crack(ctx);
      const P = ctx.props; placeWall(ctx); P.puffs.forEach((p) => addTo(ctx, p, 0, 0, 0));
      ctx.add(P.glowLight);
      ctx.store.extras = crowd(ctx, X.slice(8, 11), [[42.4, 0, -2.75, PI / 2 + 0.7], [40.2, 0, 3.1, PI / 2 + 0.35], [42.6, 0, 2.9, PI / 2 - 0.9]]);
      plazaFiller(ctx, { n: 30, seed: 14, x0: 46.5, x1: 48.5 });
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, to = 2.2;
      const len = ease.outCubic(clamp((t - to) / 0.3, 0, 1)), open = 0.12 + 0.3 * ease.outCubic(clamp((t - 2.45) / 0.3, 0, 1)) - 0.2 * clamp((t - 3.7) / 0.5, 0, 1);
      crackState(ctx, { len, open, glow: 1.3 + 0.6 * hitPulse([to, 2.5], t, 0.2) });
      const cw = crackWorld(ctx, 0, -0.05), cp = P.crack.position;
      const order = [3, 4, 5, 0, 1, 2], lands = [];
      order.forEach((bi, k) => {
        const tl = 3.0 + k * 0.13; lands.push(tl); const w = WALL(bi);
        const d = fallBlock(ctx, P.blocks[bi], [cp.x - 2, cp.y - 8, cp.z + (bi % 3 - 1) * 2.5], w, tl, 0.75, k % 2 ? -1 : 1);
        const pf = P.puffs[k]; pf.root.position.copy(V(BLOCK_X - 0.4, 0.1, w[2])); pf.update(d < 0 || bi < 3 ? 0 : d / 0.7);
      });
      P.filler.userData.set(t, { arms: t > 3.1 ? 'cheer' : 'limp', bounce: t > 3.1 ? 0.5 : 0.1 });
      ctx.store.extras.forEach((e) => { e.ch.pose(t > 3.1 ? 'surprised' : 'peer', t + e.ph, { headPitch: -0.5 }); e.ch.face(t > 3.0 ? 'shocked' : 'smile', 0.4); });
      P.glowLight.position.copy(cw); P.glowLight.intensity = 30 * len;
      // A: low, looking up at the tower with the crack ripping open above it → B: whip down with the blocks onto the wall
      const A = { pos: L(37.5, 1.3, 4.0), look: L(62, 24, -22), fov: 62 }, B = { pos: L(33.6, 2.4, 0.7), look: L(45.2, 0.15, 0), fov: 52 };
      moveCam(ctx, A, B, ease.inOutCubic(clamp((t - 2.55) / 0.7, 0, 1)));
      pop(ctx, to + 0.05, 0.12, '#fff6d0', 0.35);
      shakeOn(ctx, [to, ...lands], 0.45, 0.3, 11);
      tag(ctx, '8:00 AM', 0, 2.6, { y: 0.1, size: 96, fill: '#ffe14a', bg: 'rgba(20,20,40,0.85)' });
    },
  },
  // ── b02 "And everyone has to say it."  — high wide: the town swarms the six blocks
  {
    name: 'swarm the blocks', start: 'b02-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true }); tower(ctx, 0, 8 / 12); crack(ctx);
      placeWall(ctx);
      const ids = X.slice(0, 14);
      const sp = ids.map((id, i) => { const a = hash(i * 2.3 + 1) * PI - PI / 2, r = 6 + 4 * hash(i * 3.7); return [BLOCK_X - 2.2 - Math.cos(a) * r * 0.6, 0, Math.sin(a) * r * 0.9, 0]; });
      ctx.store.sw = crowd(ctx, ids, sp);
      plazaFiller(ctx, { n: 50, seed: 21, x0: 34, x1: 40 });
      ctx.store.bubs = P_bubs(ctx, [0, 1]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      crackState(ctx, { len: 1, open: 0.18, glow: 1 });
      ctx.store.sw.forEach((w, k) => {
        const dst = V(BLOCK_X - 1.6 - (k % 3) * 0.9, 0, (k - 6.5) * 0.75), src = V(w.x, 0, w.z);
        const u = clamp((t - ctx.time('b02') + 0.3 + hash(k) * 0.2) / 1.0, 0, 1), p = src.clone().lerp(dst, ease.outCubic(u));
        w.ch.root.position.copy(L(p.x, 0, p.z)); w.ch.root.rotation.y = L.yaw + yawTo(src.x, src.z, BLOCK_X, dst.z);
        if (u < 0.95) w.ch.pose('walk', t + w.ph, { speed: 1.6 }); else w.ch.pose(k % 2 ? 'cheer' : 'point', t + w.ph);
        w.ch.face('grin', t + w.ph);
      });
      ctx.props.filler.userData.set(t, { arms: 'cheer', bounce: 0.6, speed: 0.9 });
      setCam(ctx, { pos: L(28.8, 8.2, 0.6), look: L(45.0, 1.0, 0), fov: 60 });
      const b = ctx.props.bub.skronk, w = ctx.store.sw;
      bubble(ctx, b[0], headTop(w[3].ch).add(up(0.3)), ctx.time('b02.w1'), { k: 0.9 });
      bubble(ctx, b[1], headTop(w[9].ch).add(up(0.3)), ctx.time('b02.w4'), { k: 0.9 });
    },
  },
  // ── "All day long."  — Grandma, Mr. Dunbar and the Mayor shout SKRONK! at each other
  {
    name: 'skronk trio', start: 'b02.w6-0.15', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      placeWall(ctx);
      ctx.store.trio = crowd(ctx, ['grandma', 'dunbar', 'mayor'], [[42.0, 0, -0.85, -PI / 2 + 0.5], [42.6, 0, 0.0, -PI / 2], [42.0, 0, 0.88, -PI / 2 - 0.5]]);
      ctx.store.bg = crowd(ctx, X.slice(0, 5), [[44.6, 0, -2.4, -PI / 2], [44.9, 0, 2.3, -PI / 2], [45.3, 0, -0.6, -PI / 2 + 0.3], [44.2, 0, 1.0, -PI / 2 + 0.6], [44.0, 0, -1.4, -PI / 2 - 0.4]]);
      plazaFiller(ctx, { n: 40, seed: 12, x0: 44, x1: 48.5 });
      ctx.store.bubs = P_bubs(ctx, [2, 3, 4]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, b = ctx.props.bub.skronk;
      ctx.store.trio.forEach((w, k) => { w.ch.pose(['cheer', 'point', 'cheer'][k], t + w.ph); w.ch.face(k === 1 ? 'laugh' : 'grin', t + k); });
      ctx.store.bg.forEach((w) => { w.ch.pose('cheer', t + w.ph); w.ch.face('grin', t + w.ph); });
      ctx.props.filler.userData.set(t, { arms: 'cheer', bounce: 0.6 });
      const c = moveCam(ctx, { pos: L(34.6, 1.3, 0.2), look: L(42.3, 1.45, 0.0), fov: 46 }, { pos: L(35.0, 1.3, 0.2), look: L(42.3, 1.5, 0.0), fov: 46 }, lt / 1.2);
      const t0 = ctx.time('b02.w6'), R = camRight(c);
      // bubbles stacked in a staircase so none leaves the frame (the sprite grows to the right of its anchor)
      ctx.store.trio.forEach((w, k) => bubble(ctx, b[2 + k], headTop(w.ch).add(up([0.05, 0.75, 0.05][k])).addScaledVector(R, [-0.25, -0.45, -0.75][k]), t0 - 0.05 + k * 0.14, { k: 0.42 }));
    },
  },
  // ── b03 "Everyone except me."  — the kid leans on a lamp at the edge of the square, arms crossed, smug
  {
    name: 'except me', start: 'b03-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      placeWall(ctx);
      put(ctx, 'me', L(KID_LAMP.x + 0.45, 0, KID_LAMP.z), PI / 2);
      ctx.store.bg = crowd(ctx, X.slice(0, 10), plazaSpots(10, { seed: 3, x0: 40, x1: 44.5, z0: -4, z1: 4 }));
      plazaFiller(ctx, { n: 50, seed: 8 });
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      me.pose('crossArms', t); leanBack(me, 0.1); me.face('smug', 0.6);
      ctx.store.bg.forEach((w) => { w.ch.pose('cheer', t + w.ph); w.ch.face('grin', t + w.ph); });
      ctx.props.filler.userData.set(t, { arms: 'cheer', bounce: 0.7 });
      moveCam(ctx, faceCam(me, 3.4, -0.55, 0.42, 40, -0.15), faceCam(me, 2.7, -0.45, 0.4, 38, -0.15), ease.inOutSine(clamp(lt / 1.0, 0, 1)));
      tag(ctx, 'EXCEPT ME', ctx.time('b03.w1'), Infinity, { y: 0.12, size: 88, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  // ── b04 HUSS ×3 — the kid snaps out three HUSSes; the crowd turns to stare
  ...[0, 1, 2].map((i) => ({
    name: `kid huss #${i + 1}`, start: H('b04', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      placeWall(ctx);
      put(ctx, 'me', L(KID_LAMP.x + 0.45, 0, KID_LAMP.z), PI / 2);
      ctx.store.bg = crowd(ctx, X.slice(0, 10), plazaSpots(10, { seed: 3, x0: 40, x1: 44.5, z0: -4, z1: 4 }));
      filler(ctx, blockFill(43.5, 49, -7, 7, 50, { seed: 8, faceX: KID_LAMP.x, faceZ: KID_LAMP.z, avoid: (x, z) => x < 45.2 && Math.abs(z) < 4.6 }));
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, hits = hussHits(ctx, 'b04');
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      me.pose('slam', t, { hits }); me.face(dh < 0.25 ? 'huss' : 'determined', t);
      const stare = clamp((t - hits[0]) / 0.25, 0, 1);
      ctx.store.bg.forEach((w) => { w.ch.root.rotation.y = L.yaw + lerp(w.yw, yawTo(w.x, w.z, KID_LAMP.x, KID_LAMP.z), stare); w.ch.pose(stare > 0.5 ? 'stunned' : 'cheer', t + w.ph); w.ch.face(stare > 0.5 ? 'shocked' : 'grin', 0.5); });
      ctx.props.filler.userData.set(t, { arms: stare > 0.5 ? 'limp' : 'cheer', bounce: stare > 0.5 ? 0 : 0.7 });
      const cams = [faceCam(me, 2.4, -0.3, 0.42, 36, -0.1), { pos: L(KID_LAMP.x + 3.1, 0.55, KID_LAMP.z - 1.3), look: humanFace(me).add(up(-0.2)), fov: 46 }, { pos: L(KID_LAMP.x + 1.5, 2.4, KID_LAMP.z - 0.8), look: L(42.0, 0.55, 1.2), fov: 34 }];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.12, 0.2);
    },
  })),
  // ── b05 "Five years ago, the sky cracked open above the clock tower."  — flashback, quiet night: low from the plaza
  //    looking up the tower (clock low in frame, below the caption) at the sky; the crack rips open above it in a flash.
  //    The stage and its banner are behind the camera's left shoulder (out of frame).
  {
    name: 'five years ago', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.8 }); tower(ctx, 0.2, 0.95);
      const P = ctx.props;
      ctx.store.cA = { pos: L(39.6, 1.2, 4.6), look: L(CLOCK.x, 17.6, CLOCK.z), fov: 60 };
      ctx.store.cB = { pos: L(41.0, 1.4, 3.0), look: L(CLOCK.x, 18.4, CLOCK.z), fov: 57 };
      crackInView(ctx, ctx.store.cB, { sx: 0.12, sy: 0.5, dist: 75, H: 24 });
      ctx.add(P.glowLight); ctx.add(P.flashGlow, ctx.set.root);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tc = ctx.time('b05.w5') - 0.05, P = ctx.props;
      const len = ease.outCubic(clamp((t - tc) / 0.28, 0, 1)), fl = hitPulse([tc], t, 0.18);
      crackState(ctx, { len, open: 0.08 + 0.16 * len + 0.3 * fl, glow: 1.5 + 1.4 * fl });
      P.crack.scale.setScalar(24 * (1 + 0.25 * fl));
      moveCam(ctx, ctx.store.cA, ctx.store.cB, lt / 3.2);
      const cw = crackWorld(ctx);
      P.glowLight.position.copy(cw); P.glowLight.intensity = 60 * len + 260 * fl;
      P.flashGlow.position.copy(ctx.set.root.worldToLocal(cw.clone())); P.flashGlow.scale.setScalar(4 + 70 * fl + 10 * len); P.flashGlow.material.opacity = 0.35 * len + 0.65 * fl;
      pop(ctx, tc, 0.13, '#fff6d0', 0.6); shakeOn(ctx, [tc], 0.7, 0.45, 5);
      ctx.fx.overlay('#1a2a60', 0.12); ctx.fx.vignette(0.55);
      tag(ctx, '5 YEARS AGO', ctx.time('b05') + 0.05, Infinity, { y: 0.08, size: 74, fill: '#ffffff', bg: 'rgba(40,60,120,0.85)' });
    },
  },
  // ── "Townspeople peer up from their doorways."  — low on the street under one house front: three glowing doorways side
  //    by side, a face peering up out of each; the crack glows above the roofline.
  {
    name: 'doorways peer up', start: 'b05.w7-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'quiet_night', { glow: 0.9 });
      const P = ctx.props, xs = [-5.55, -3.6, -1.6];
      xs.forEach((x, k) => addTo(ctx, P.doors[k], x, 0, -10.43, 0));
      P.doors.forEach((d) => d.userData.set?.(1));
      ctx.store.peer = crowd(ctx, ['grandma', X[2], 'dunbar'], [[-5.55, 0, -9.85, 0.3], [-3.6, 0, -9.85, 0.0], [-1.6, 0, -9.85, -0.3]]);
      const cam = { pos: L(-3.6, 0.45, -2.7), look: L(-3.6, 4.1, -10.0), fov: 64 };
      ctx.store.cam = cam; crackInView(ctx, cam, { sx: 0.1, sy: 0.8, dist: 75, H: 20 });
      ctx.add(P.glowLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      crackState(ctx, { len: 1, open: 0.14, glow: 1.6 + 0.4 * Math.sin(t * 7) });
      ctx.store.peer.forEach((w, k) => { w.ch.pose('peer', t + w.ph, { headPitch: -0.55, headYaw: [0.25, 0.05, -0.2][k] }); w.ch.face(k === 1 ? 'shocked' : 'squint', 0.4); });
      const c0 = ctx.store.cam, c = moveCam(ctx, c0, { pos: c0.pos.clone().add(V(0, 0.05, 0.5)), look: c0.look, fov: 60 }, lt / 1.3, 0.9, '#dfe8ff', 14);
      P.glowLight.position.copy(L(-3.6, 9, -6)); P.glowLight.intensity = 14 + 30 * Math.max(0, Math.sin(t * 23)) * Math.exp(-(lt) * 2); P.glowLight.distance = 30; P.glowLight.color.set('#fff2c0');
      ctx.fx.overlay('#1a2a60', 0.1); ctx.fx.vignette(0.5);
      tag(ctx, '5 YEARS AGO', 0, Infinity, { y: 0.08, size: 74, fill: '#ffffff', bg: 'rgba(40,60,120,0.85)' });
    },
  },
  // ── b06 "Monday's word was skronk."  — Mr. Dunbar's front lawn
  {
    name: 'monday lawn', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      addTo(ctx, ctx.props.mower, MOWER.x, 0, MOWER.z, -PI / 2); ctx.props.mower.userData.set(-1);
      put(ctx, 'dunbar', L(MOWER.x + 1.05, 0, MOWER.z), yawTo(MOWER.x + 1.05, MOWER.z, 4.6, -5.9));
      ctx.store.wk = crowd(ctx, [X[5], X[6]], [[3.5, 0.12, -5.3, PI / 2], [16, 0.12, -6.0, -PI / 2]]);
      addBubbles(ctx, [ctx.props.bub.skronk[0], ctx.props.bub.skronk[1]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, d = ctx.cast.dunbar;
      d.pose('wave', t); d.face('grin', t);
      ctx.store.wk.forEach((w, k) => { const s = WALK_SPEED * 0.8 * (t - 11.5) * (k ? -1 : 1); w.ch.root.position.copy(L(w.x + s, 0.12, w.z)); w.ch.pose('walk', t + w.ph, { speed: 0.8 }); w.ch.face('smile', t); });
      const f = humanFace(d);
      const c = moveCam(ctx, { pos: L(4.3, 1.25, -5.7), look: f.clone().add(up(-0.5)), fov: 46 }, { pos: L(4.7, 1.25, -5.9), look: f.clone().add(up(-0.45)), fov: 44 }, lt / 1.5);
      tag(ctx, 'MONDAY: SKRONK', ctx.time('b06') + 0.05, Infinity, { y: 0.08, size: 76, bg: 'rgba(255,79,163,0.92)' });
      // the bubble sits beside his head (camera-right), not above it, so the tag never covers it
      bubble(ctx, ctx.props.bub.skronk[0], humanFace(d).addScaledVector(camRight(c), 0.42).add(up(0.1)), ctx.markers.skronk - 0.05, { k: 0.4 });
      bubble(ctx, ctx.props.bub.skronk[1], headTop(ctx.store.wk[0].ch).add(up(0.15)), ctx.markers.skronk + 0.25, { k: 0.4 });
    },
  },
  // ── "By lunch, Mr. Dunbar had skronked his lawnmower."  — one pat, it pops apart and bounces down the street
  {
    name: 'skronked mower', start: 'mower-0.05', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      const P = ctx.props; addTo(ctx, P.mower, MOWER.x, 0, MOWER.z, -PI / 2); addTo(ctx, P.popPuff, MOWER.x, 0.5, MOWER.z);
      put(ctx, 'dunbar', L(MOWER.x + 1.05, 0, MOWER.z), -PI / 2 + 0.25);
      ctx.store.wk = crowd(ctx, [X[5]], [[2.6, 0.12, -5.4, PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, d = ctx.cast.dunbar, P = ctx.props, tp = ctx.time('b06.w8') + 0.02, ts = tp + 0.45;
      P.mower.userData.set(t - tp);
      if (t < ts) { d.pose('slam', t, { hits: [tp], slamTarget: L(MOWER.x + 0.62, 0.98, MOWER.z) }); d.face(t < tp ? 'smile' : 'shocked', 0.5); }
      else { d.pose('shrug', t - ts); d.face('grin', 0.5); }
      const w = ctx.store.wk[0]; w.ch.root.position.copy(L(w.x + WALK_SPEED * 0.6 * (t - 13.3), 0.12, w.z)); w.ch.pose(t > tp + 0.2 ? 'surprised' : 'walk', t, { speed: 0.6 }); w.ch.face(t > tp + 0.1 ? 'shocked' : 'smile', 0.3);
      P.popPuff.update((t - tp) / 0.5);
      const pan = ease.inOutSine(clamp((t - tp - 0.05) / 0.9, 0, 1));
      const c = moveCam(ctx, { pos: L(4.6, 3.1, -3.4), look: L(7.4, 0.9, -8.8), fov: 44 }, { pos: L(4.2, 3.4, -2.6), look: L(6.6, 0.7, -7.6), fov: 52 }, pan);
      shakeOn(ctx, [tp], 0.35, 0.3, 13); pop(ctx, tp, 0.1, '#ffffff', 0.3);
      if (t > tp) stamp(ctx, 'SKRONKED', tp + 0.02, { y: 0.14, size: 120, fill: '#ffe14a', stroke: '#1d1d22', rot: -0.08 });
      tag(ctx, 'MONDAY: SKRONK', 0, tp, { y: 0.08, size: 76, bg: 'rgba(255,79,163,0.92)' });
    },
  },
  // ── b07 "Tuesday was gubbins."  — the kid on the doorstep with a ridiculous tall spiky haircut
  {
    name: 'gubbins hair', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      const a = ctx.anchor('myHouse.door'), yw = yawOf(a); ctx.store.F = { a, yw };
      const me = put(ctx, 'me', a.getWorldPosition(V()), yw);
      ctx.add(ctx.props.hair, me.joints.head); ctx.props.hair.position.set(0, 0.56, -0.02);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, { a } = ctx.store.F;
      me.pose('idle', t); me.face('sweat', 0.6);
      const F = (x, y, z) => a.localToWorld(V(x, y, z));
      moveCam(ctx, { pos: F(0.4, 1.2, 4.8), look: F(0, 1.3, 0), fov: 50 }, { pos: F(0.35, 1.2, 4.3), look: F(0, 1.3, 0), fov: 50 }, ease.inOutSine(clamp(lt / 1.3, 0, 1)), 0.6);
      tag(ctx, 'TUESDAY: GUBBINS', ctx.time('b07') + 0.05, Infinity, { y: 0.1, size: 76, bg: 'rgba(63,143,90,0.92)' });
    },
  },
  // ── "Grandma said my haircut was absolute gubbins."  — she points, then bursts out laughing
  {
    name: 'grandma laughs', start: 'gub-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      const a = ctx.anchor('myHouse.door'), yw = yawOf(a); ctx.store.a = a;
      const F = (x, y, z) => a.localToWorld(V(x, y, z));
      const me = put(ctx, 'me', F(0, 0, 0), yw + 0.3);
      ctx.add(ctx.props.hair, me.joints.head); ctx.props.hair.position.set(0, 0.56, -0.02);
      put(ctx, 'grandma', F(0.95, 0, 0.95), yw - 0.95);
      addBubbles(ctx, [ctx.props.bub.gubbins]);
    },
    update(ctx, lt) {
      const t = ctx.t, a = ctx.store.a, me = ctx.cast.me, g = ctx.cast.grandma, tl = ctx.time('b07.w7');
      const F = (x, y, z) => a.localToWorld(V(x, y, z));
      me.pose('idle', t); me.face(t > tl ? 'sad' : 'sweat', 0.6);
      if (t < tl) { g.pose('point', t); g.joints.armR.rotation.x -= 0.55; g.face('grin', 0.4); }
      else { g.pose('laugh', t); g.face('laugh', t); }
      const c = setCam(ctx, { pos: F(0.3, 1.3, 4.9), look: F(0.55, 1.15, 0.6), fov: 52 }, 0.5);
      bubble(ctx, ctx.props.bub.gubbins, headTop(g).add(up(0.1)).addScaledVector(camRight(c), -0.35), ctx.time('b07.w9') - 0.05, { k: 0.5 });
      tag(ctx, 'TUESDAY: GUBBINS', 0, Infinity, { y: 0.1, size: 76, bg: 'rgba(63,143,90,0.92)' });
    },
  },
  // ── b08 "Wednesday was flimbo."  — PRESS CONFERENCE: the Mayor at the podium, hands up everywhere
  {
    name: 'press conference', start: 'b08-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      addTo(ctx, ctx.props.podium, PODIUM.x, STAGE_Y, PODIUM.z, -PI / 2);
      put(ctx, 'mayor', L(MAYOR_ST.x, STAGE_Y, MAYOR_ST.z), -PI / 2);
      ctx.store.press = crowd(ctx, X.slice(0, 12), plazaSpots(12, { seed: 7, x0: 44.2, x1: 48.3, z0: -3.6, z1: 3.6 }));
      plazaFiller(ctx, { n: 50, seed: 9, x0: 36, x1: 40 });
      addBubbles(ctx, [ctx.props.bub.flimbo[0]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, m = ctx.cast.mayor;
      m.pose('idle', t); m.face('smug', 0.6);
      ctx.store.press.forEach((w, k) => raiseHand(w.ch, t + w.ph, 1, 1));
      ctx.store.press.forEach((w, k) => w.ch.face('grin', t + w.ph));
      ctx.props.filler.userData.set(t, { arms: 'up', bounce: 0.2, speed: 0.6 });
      // from behind the press pack: a row of raised hands fills the lower third, the Mayor's face at y ≈ 0.35
      const c = moveCam(ctx, { pos: L(40.6, 2.45, 1.45), look: L(50.6, 2.0, 0), fov: 42 }, { pos: L(41.2, 2.4, 1.35), look: L(50.6, 2.0, 0), fov: 41 }, lt / 1.3);
      tag(ctx, 'WEDNESDAY: FLIMBO', ctx.time('b08') + 0.05, Infinity, { y: 0.08, size: 70, bg: 'rgba(122,31,43,0.92)' });
      bubble(ctx, ctx.props.bub.flimbo[0], humanFace(m).addScaledVector(camRight(c), 0.55).add(up(0.25)), ctx.time('b08.w2') - 0.05, { k: 0.5 });
    },
  },
  // ── "The mayor answered everything with it."  — he points at each reporter, smug
  {
    name: 'mayor points', start: 'b08.w3-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      addTo(ctx, ctx.props.podium, PODIUM.x, STAGE_Y, PODIUM.z, -PI / 2);
      put(ctx, 'mayor', L(MAYOR_ST.x, STAGE_Y, MAYOR_ST.z), -PI / 2);
      ctx.store.press = crowd(ctx, X.slice(0, 6), [[46.85, 0, -0.9, PI / 2 - 0.1], [48.0, 0, 1.0, PI / 2 + 0.2], [47.6, 0, 2.6, PI / 2], [47.9, 0, -2.6, PI / 2], [45.3, 0, 2.0, PI / 2], [44.6, 0, -3.6, PI / 2]]);
      addBubbles(ctx, ctx.props.bub.flimbo);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, m = ctx.cast.mayor, te = ctx.time('b08.w6');
      const flip = Math.floor((t - ctx.time('b08.w3')) / 0.55) % 2;
      m.root.rotation.y = L.yaw - PI / 2 + (flip ? 0.45 : -0.45);
      m.pose('point', t); m.face('smug', 0.6);
      ctx.store.press.forEach((w) => { raiseHand(w.ch, t + w.ph, 1, 1); w.ch.face('grin', t + w.ph); });
      { const J = ctx.store.press[0].ch.joints; J.armL.rotation.set(-2.7 + 0.12 * Math.sin(t * 8), 0, 0.15); J.foreArmL.rotation.set(-0.15, 0, 0); }
      // just behind a reporter (raised hand in the foreground), the Mayor pointing left / right with a FLIMBO! beside his head
      const c = { pos: L(45.0, 2.15, -2.0), look: humanFace(m).add(up(-0.75)), fov: 48 }; ctx.cam.set(c);
      const R = camRight(c), side = flip ? 1 : -1;
      bubble(ctx, ctx.props.bub.flimbo[0], humanFace(m).addScaledVector(R, side > 0 ? 0.55 : -1.45).add(up(0.25)), ctx.time('b08.w3') + 0.1, { k: 0.42, t1: te - 0.05 });
      bubble(ctx, ctx.props.bub.flimbo[1], humanFace(m).addScaledVector(R, 0.55).add(up(0.25)), te - 0.05, { k: 0.46 });
      tag(ctx, 'WEDNESDAY: FLIMBO', 0, Infinity, { y: 0.08, size: 70, bg: 'rgba(122,31,43,0.92)' });
    },
  },
  // ── b09 "Someone asked where the bridge went."  — a reporter's hand, the question bubble
  {
    name: 'where is the bridge', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      addTo(ctx, ctx.props.podium, PODIUM.x, STAGE_Y, PODIUM.z, -PI / 2);
      put(ctx, 'mayor', L(MAYOR_ST.x, STAGE_Y, MAYOR_ST.z), -PI / 2);
      ctx.store.press = crowd(ctx, [X[5], X[1], X[2], X[3], X[7]], [[46.1, 0, 0.5, PI / 2 + 0.55], [44.9, 0, -1.6, PI / 2], [44.6, 0, 2.2, PI / 2], [43.6, 0, 0.0, PI / 2], [43.2, 0, -3.0, PI / 2]]);
      plazaFiller(ctx, { n: 40, seed: 13, x0: 36, x1: 43 });
      addBubbles(ctx, [ctx.props.bub.bridge]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, m = ctx.cast.mayor, pr = ctx.store.press;
      m.pose('idle', t); m.face('smug', 0.6);
      raiseHand(pr[0].ch, t, 1, 1); pr[0].ch.face('determined', t);
      pr.slice(1).forEach((w) => { w.ch.pose('idle', t + w.ph, { headYaw: -0.4 }); w.ch.face('neutral', t + w.ph); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.1 });
      const r = pr[0].ch;
      moveCam(ctx, faceCam(r, 3.7, 0.65, 0.42, 47, -0.1), faceCam(r, 3.4, 0.6, 0.42, 46, -0.1), lt / 1.6);
      bubble(ctx, ctx.props.bub.bridge, headTop(r).add(up(0.02)), ctx.time('b09.w1'), { k: 0.46 });
    },
  },
  // ── quote card "Flimbo." — over the smug Mayor
  {
    name: 'flimbo card', start: 'flimbo-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      addTo(ctx, ctx.props.podium, PODIUM.x, STAGE_Y, PODIUM.z, -PI / 2);
      put(ctx, 'mayor', L(MAYOR_ST.x, STAGE_Y, MAYOR_ST.z), -PI / 2 + 0.25);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, m = ctx.cast.mayor;
      m.pose('shrug', t); m.face('smug', 0.6);
      setCam(ctx, faceCam(m, 2.6, -0.35, 0.4, 36, -0.1));
      quoteCard(ctx, 'Flimbo.', 'Mayor Pickles,\nwhen asked where\nthe bridge went', ctx.markers.flimbo - 0.1, ctx.time('b09.w7') - 0.06, { y: 0.26, size: 120, byAt: ctx.markers.flimbo + 0.12 });
    },
  },
  // ── "The bridge is still missing."  — the road ends in empty air; the BRIDGE sign points at nothing; the pigeon on top
  {
    name: 'bridge missing', start: 'b09.w7-0.1', set: 'cliff',
    setup(ctx) {
      const s = ctx.set; s.exposure = 1.0;
      const P = ctx.props; ctx.add(P.sign, s.root); P.sign.position.set(-0.9, 0.14, -5.4); P.sign.rotation.set(0, -0.55, 0);
      put(ctx, 'pigeon', V(-0.9, 3.3, -5.4), -1.2, 2.2);
    },
    update(ctx, lt) {
      const t = ctx.t, p = ctx.cast.pigeon;
      p.pose(t > ctx.markers.missing ? 'idle' : 'peck', t); p.face('neutral', t);
      // from the pavement behind the sign, a little high, looking along the road: it just stops at the cliff edge
      moveCam(ctx, { pos: V(-9.6, 3.5, -0.9), look: V(2.8, -0.1, -4.6), fov: 54 }, { pos: V(-8.9, 3.4, -1.2), look: V(2.8, -0.3, -4.6), fov: 53 }, ease.inOutSine(clamp(lt / 1.5, 0, 1)));
      tag(ctx, 'STILL MISSING', ctx.markers.missing, Infinity, { y: 0.12, size: 84, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  // ── b10 "Number one word of all time? Bonkle."  — TOP 10 SKY WORDS; the BONKLE monument in golden light
  {
    name: 'bonkle monument', start: 'b10-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { party: true, glow: 0.7 });
      const P = ctx.props;
      addTo(ctx, P.mono, BLOCK_X, 0.3, 0, PI / 2); addTo(ctx, P.monoTrim, BLOCK_X, 0.62, 0, PI / 2);
      P.bonkle.forEach((b, i) => { const row = i < 3 ? 1 : 0, col = i % 3; addTo(ctx, b, BLOCK_X, 0.68 + BLOCK_TOP + row * BLOCK_S, (col - 1) * 1.7, -PI / 2, BLOCK_S); });
      ctx.add(P.sparkles); ctx.add(P.glowLight);
      filler(ctx, blockFill(33, 42.5, -8, 8, 60, { seed: 15, yaw: PI / 2, avoid: (x, z) => Math.abs(z) < 2.6 }));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tb = ctx.markers.bonkle;
      const flare = hitPulse([tb], t, 0.4);
      P.bonkle.forEach((b, i) => { b.userData.set(1 + 2.5 * flare); const row = i < 3 ? 1 : 0; b.position.y = 0.68 + BLOCK_TOP + row * BLOCK_S + 0.06 * Math.sin(t * 2 + i); b.rotation.y = -PI / 2 + 0.06 * Math.sin(t * 1.3 + i); });
      ctx.props.filler.userData.set(t, { arms: t > tb ? 'cheer' : 'limp', bounce: t > tb ? 0.5 : 0.1 });
      const c = moveCam(ctx, { pos: L(33.6, 1.5, 0.2), look: L(45.2, 3.1, 0), fov: 54 }, { pos: L(35.4, 1.6, 0.1), look: L(45.2, 3.0, 0), fov: 52 }, lt / 4.0);
      P.sparkles.position.copy(L(43, 3, 0)); P.sparkles.userData.set(t, 0.8);
      P.glowLight.position.copy(L(41, 4, 0)); P.glowLight.intensity = 20 + 120 * flare; P.glowLight.color.set('#ffd27a');
      shakeOn(ctx, [tb], 0.5, 0.3, 21); pop(ctx, tb, 0.1, '#fff2c0', 0.35);
      const t0 = ctx.time('b10');
      tag(ctx, 'TOP 10 SKY WORDS\nOF ALL TIME', t0, Infinity, { y: 0.09, size: 66, bg: 'rgba(200,0,40,0.9)', rot: -0.02 });
      tag(ctx, '#3  WOBBLETON', t0 + 0.45, Infinity, { y: 0.205, size: 58, bg: 'rgba(20,20,40,0.85)', rot: 0.01 });
      tag(ctx, '#2  SKRONK', t0 + 0.9, Infinity, { y: 0.26, size: 58, bg: 'rgba(20,20,40,0.85)', rot: -0.01 });
      if (t > tb) stamp(ctx, '#1 BONKLE (2022)', tb, { y: 0.33, size: 78, fill: '#ffe14a', stroke: '#1d1d22', line: 10, rot: -0.05 });
    },
  },
  // ── "Fourteen people cried."  — the town claps with sad, teary faces
  {
    name: 'fourteen cried', start: 'cried-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { party: true, glow: 0.7 });
      const P = ctx.props;
      addTo(ctx, P.mono, BLOCK_X, 0.3, 0, PI / 2); addTo(ctx, P.monoTrim, BLOCK_X, 0.62, 0, PI / 2);
      P.bonkle.forEach((b, i) => { const row = i < 3 ? 1 : 0, col = i % 3; addTo(ctx, b, BLOCK_X, 0.68 + BLOCK_TOP + row * BLOCK_S, (col - 1) * 1.7, -PI / 2, BLOCK_S); b.userData.set(1); });
      ctx.store.cry = crowd(ctx, ['grandma', 'dunbar', X[6], X[7], X[8], X[9], X[10]], [[41.6, 0, -1.25, -PI / 2 + 0.2], [41.5, 0, 0.0, -PI / 2], [41.7, 0, 1.25, -PI / 2 - 0.2], [42.7, 0, -1.9, -PI / 2], [42.8, 0, -0.6, -PI / 2], [42.8, 0, 0.7, -PI / 2], [42.7, 0, 1.95, -PI / 2]]);
      ctx.add(P.tears);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      const src = [];
      ctx.store.cry.forEach((w) => { w.ch.pose('clap', t + w.ph, { speed: 0.6 }); w.ch.face('sad', 1.5); const fw = V(Math.sin(w.ch.root.rotation.y), 0, Math.cos(w.ch.root.rotation.y)), side = V(fw.z, 0, -fw.x); w.ch.root.updateMatrixWorld(true); for (const s of [-1, 1]) src.push({ pos: w.ch.joints.head.localToWorld(V(s * 0.12, 0.3, 0.29)), side: side.clone().multiplyScalar(s), fwd: fw, rate: 1.4 }); });
      ctx.props.tears.userData.set(t, src.slice(0, 10), 1.1);
      moveCam(ctx, { pos: L(38.1, 2.3, 4.6), look: L(41.8, 1.2, 0), fov: 50 }, { pos: L(38.5, 2.2, 4.2), look: L(41.8, 1.2, 0), fov: 48 }, lt / 1.5);
      tag(ctx, '14 PEOPLE CRIED', ctx.markers.cried, Infinity, { y: 0.12, size: 84, fill: '#bff4ff', bg: 'rgba(20,40,90,0.9)' });
    },
  },
  // ── "The Goon Squad cried twice."  — four tough guys in shades, tear fountains
  {
    name: 'goon squad', start: 'b10.w15-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'dusk', { party: true, glow: 0.7 });
      ctx.store.g = crowd(ctx, GOONS, [[41.9, 0, -1.12, -PI / 2 + 0.15], [41.6, 0, -0.37, -PI / 2 + 0.05], [41.6, 0, 0.38, -PI / 2 - 0.05], [41.9, 0, 1.13, -PI / 2 - 0.15]]);
      ctx.add(ctx.props.tears);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tw = ctx.time('b10.w19');
      const src = [];
      ctx.store.g.forEach((w, k) => { w.ch.pose('crossArms', t + w.ph); w.ch.face('sad', 1.5); const fw = V(Math.sin(w.ch.root.rotation.y), 0, Math.cos(w.ch.root.rotation.y)), side = V(fw.z, 0, -fw.x); w.ch.root.updateMatrixWorld(true); for (const s of [-1, 1]) src.push({ pos: w.ch.joints.head.localToWorld(V(s * 0.2, 0.3, 0.3)), side: side.clone().multiplyScalar(s), mode: 'fountain', rate: t > tw ? 2.6 : 1.6 }); });
      ctx.props.tears.userData.set(t, src, t > tw ? 1.6 : 1.2);
      setCam(ctx, { pos: L(36.0, 0.8, 0.25), look: L(41.7, 1.62, 0), fov: 54 });
      tag(ctx, 'THE GOON SQUAD', ctx.time('b10.w16'), Infinity, { y: 0.11, size: 80, bg: 'rgba(20,20,20,0.92)' });
      if (t > tw) stamp(ctx, 'CRIED TWICE', tw, { y: 0.23, size: 100, fill: '#59c6ff', stroke: '#1d1d22', rot: 0.06 });
    },
  },
  // ── b11 "Me? I don't say the words."  — the park table; the kid sits alone, smug; word bubbles pop around him
  {
    name: 'park smug', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      put(ctx, 'me', L(-52.38, 0, -10), 0);
      ctx.store.walk = crowd(ctx, ['grandma', X[11], 'mayor', X[12]], [[-54.7, 0, -12.3, PI / 2], [-50.2, 0, -13.3, -PI / 2], [-50.0, 0, -12.5, -PI / 2], [-55.4, 0, -13.6, PI / 2]]);
      addBubbles(ctx, [ctx.props.bub.bonkle, ctx.props.bub.flimbo2, ctx.props.bub.gubbins2]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      me.pose('sit', t, { hands: 'lap' }); me.joints.head.rotation.y = 0.15 * Math.sin(t * 0.8); me.face('smug', 0.6);
      ctx.store.walk.forEach((w, k) => { const s = WALK_SPEED * 0.75 * (t - ctx.time('b11') + 0.1) * Math.sin(w.yw); w.ch.root.position.copy(L(w.x + s, 0, w.z)); w.ch.pose('walk', t + w.ph, { speed: 0.75 }); w.ch.face('grin', t + w.ph); });
      const c = setCam(ctx, { pos: L(-51.4, 1.3, -5.6), look: L(-52.6, 1.05, -10.4), fov: 54 }), R = camRight(c);
      const w = ctx.store.walk, b = ctx.props.bub;
      bubble(ctx, b.bonkle, headTop(w[0].ch).add(up(0.12)).addScaledVector(R, -0.3), ctx.time('b11.w1'), { k: 0.45 });
      bubble(ctx, b.flimbo2, headTop(w[2].ch).add(up(0.12)).addScaledVector(R, -1.05), ctx.time('b11.w3'), { k: 0.45 });
      bubble(ctx, b.gubbins2, headTop(w[1].ch).add(up(0.12)).addScaledVector(R, -0.3), ctx.time('b11.w5'), { k: 0.45 });
    },
  },
  {
    name: 'cringe', start: 'b11.w6-0.1', set: 'town',
    setup(ctx) { const L = town(ctx, 'day', { party: true }); put(ctx, 'me', L(-52.38, 0, -10), 0); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      me.pose('sit', t, { hands: 'lap' }); me.joints.head.rotation.z = 0.12; me.face('smug', 0.6);
      moveCam(ctx, faceCam(me, 3.2, 0.4, 0.3, 36, -0.15), faceCam(me, 3.0, 0.35, 0.3, 36, -0.15), lt / 1.0);
      stamp(ctx, 'CRINGE', ctx.time('b11.w7') - 0.03, { y: 0.09, size: 130, rot: -0.1 });
    },
  },
  // ── b12 "Then this morning, eight o'clock…"  — the clock clicks to 8:00; tilt up to the crack: nothing
  {
    name: 'clock clicks eight', start: 'b12-0.1', set: 'town',
    setup(ctx) { town(ctx, 'day'); tower(ctx); crack(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, te = ctx.time('b12.w3');
      const tick = t < te ? 59 / 60 : 1 + 0.02 * Math.exp(-(t - te) * 12) * Math.sin((t - te) * 60);
      ctx.props.clock.userData.set(tick, (7 + tick) / 12);
      crackState(ctx, { len: 1, open: 0.06, glow: 0.9 + 0.1 * Math.sin(t * 3) });
      const k = ease.inOutSine(clamp((t - te - 0.25) / 0.75, 0, 1));
      const n = V(Math.sin(TOWER.yaw), 0, Math.cos(TOWER.yaw)), cp = V(CLOCK.x + n.x * 9.5, 9.6, CLOCK.z + n.z * 9.5);
      const look = L(CLOCK.x, CLOCK.y - 0.85, CLOCK.z).lerp(L(CRACK_POS[0], CRACK_POS[1] - 2, CRACK_POS[2]), k);
      setCam(ctx, { pos: L(cp.x, cp.y, cp.z), look, fov: lerp(30, 52, k) });
      ctx.cam.punch([te], t, 0.06, 0.25);
      tag(ctx, '8:00 AM', te, Infinity, { y: 0.12, size: 96, fill: '#ffe14a', bg: 'rgba(20,20,40,0.85)' });
    },
  },
  {
    name: 'nothing fell', start: 'b12.w5-0.15', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); tower(ctx); crack(ctx);
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', 'mayor', ...X.slice(0, 11)], plazaSpots(14, { seed: 31, x0: 37.6, x1: 46, z0: -5, z1: 4.5 }));
      faceCrack(ctx, ctx.store.cr);
      plazaFiller(ctx, { n: 110, seed: 6, x0: 38, x1: 48.5 });
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.store.cr.forEach((w) => { w.ch.pose('peer', t + w.ph, { headPitch: -0.6 }); w.ch.face('squint', 0.3); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      crackState(ctx, { len: 1, open: 0.08, glow: 0.9 });
      // low behind the gathered town: rows of upturned heads along the bottom, the tower, and the empty crack above
      moveCam(ctx, { pos: L(35.4, 1.25, 4.6), look: L(60, 15.5, -17), fov: 64 }, { pos: L(35.9, 1.3, 4.3), look: L(60, 16, -17), fov: 62 }, lt / 1.0);
    },
  },
  // ── b13 "No word."  — the empty landing spot; a tumbleweed rolls through; the pigeon walks across
  {
    name: 'no word', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      addTo(ctx, ctx.props.tumble, BLOCK_X, 0.32, 0);
      put(ctx, 'pigeon', L(BLOCK_X - 0.8, 0, -1), PI);
      ctx.store.cr = crowd(ctx, X.slice(0, 6), [[47.6, 0, -2.4, -PI / 2], [47.9, 0, 1.6, -PI / 2], [43.0, 0, 3.3, PI / 2], [43.2, 0, -3.4, PI / 2], [48.6, 0, -1.4, -PI / 2], [47.2, 0, 3.4, -PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, lt0 = t - ctx.time('b13') + 0.1;
      // the tumbleweed rolls right → left across the empty landing spot; the pigeon struts in from the left, close to the lens
      const tw = ctx.props.tumble; tw.position.copy(L(45.0, 0.32 + 0.12 * Math.abs(Math.sin(lt0 * 7)), 1.25 - 3.0 * clamp(lt0 / 0.8, 0, 1.3))); tw.rotation.set(lt0 * 9, 0.4, 0);
      const p = ctx.cast.pigeon; p.root.position.copy(L(44.6, 0, -0.45 + 0.55 * clamp(lt0 / 0.9, 0, 1.2))); p.root.rotation.y = L.yaw; p.pose('strut', t); p.face('neutral', t);
      ctx.store.cr.forEach((w) => { w.ch.pose('stunned', 0.5); w.ch.face('sad', 1.5); });
      setCam(ctx, { pos: L(41.0, 0.55, 0.9), look: L(BLOCK_X, 1.2, 0.1), fov: 50 });
      stamp(ctx, 'NO WORD', ctx.time('b13.w0'), { y: 0.17, size: 160 });
    },
  },
  // ── b14 "And the whole town forgot how to talk."  — Dunbar and Grandma stare at each other, mouths open, nothing
  {
    name: 'forgot how to talk', start: 'b14-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      put(ctx, 'dunbar', L(42.1, 0, -0.62), -0.65); put(ctx, 'grandma', L(42.1, 0, 0.62), -2.38);
      ctx.store.bg = crowd(ctx, X.slice(0, 6), [[45.3, 0, -2.2, -PI / 2 + 0.4], [45.8, 0, 0.4, -PI / 2], [45.2, 0, 2.6, -PI / 2 - 0.5], [47.2, 0, -1.0, -PI / 2], [47.4, 0, 1.8, -PI / 2], [46.6, 0, 3.8, -PI]]);
      addBubbles(ctx, ctx.props.bub.dots);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, d = ctx.cast.dunbar, g = ctx.cast.grandma;
      d.pose('shrug', t); d.face('shocked', 0.4); g.pose('stunned', t); g.face('shocked', 0.4);
      ctx.store.bg.forEach((w, k) => { w.ch.pose(k % 2 ? 'shrug' : 'point', t + w.ph); w.ch.face(k % 2 ? 'shocked' : 'sweat', 0.5); });
      setCam(ctx, { pos: L(38.2, 1.35, 0.35), look: L(42.1, 1.35, 0), fov: 48 });
      const b = ctx.props.bub.dots, t0 = ctx.time('b14');
      bubble(ctx, b[0], headTop(d).add(up(0.15)), t0 + 0.15, { k: 0.42 });
      bubble(ctx, b[1], headTop(g).add(up(0.15)), t0 + 0.45, { k: 0.42 });
      bubble(ctx, b[2], headTop(ctx.store.bg[1].ch).add(up(0.15)), t0 + 0.9, { k: 0.3 });
    },
  },
  // ── b15 "The mayor tried a speech."  — jazz hands at a silent crowd; the counter races to 40:00
  {
    name: 'speech', start: 'b15-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      addTo(ctx, ctx.props.podium, PODIUM.x, STAGE_Y, PODIUM.z, -PI / 2);
      put(ctx, 'mayor', L(MAYOR_ST.x, STAGE_Y, MAYOR_ST.z), -PI / 2);
      plazaFiller(ctx, { n: 120, seed: 17, x0: 38, x1: 48 });
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, m = ctx.cast.mayor;
      m.pose('dance2', t, { speed: 1.6 }); m.face('grin', t);
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      moveCam(ctx, { pos: L(46.0, 1.85, 1.3), look: L(50.9, 2.45, 0), fov: 40 }, { pos: L(46.6, 1.9, 1.15), look: L(50.9, 2.5, 0), fov: 38 }, lt / 1.4);
      speechCounter(ctx);
    },
  },
  {
    name: 'silent crowd', start: 'b15.w5-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      addTo(ctx, ctx.props.podium, PODIUM.x, STAGE_Y, PODIUM.z, -PI / 2);
      put(ctx, 'mayor', L(MAYOR_ST.x, STAGE_Y, MAYOR_ST.z), -PI / 2 + 0.3);
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', ...X.slice(0, 10)], plazaSpots(12, { seed: 41, x0: 42.5, x1: 47.5, z0: -4.5, z1: 4.5 }));
      plazaFiller(ctx, { n: 110, seed: 18, x0: 36, x1: 48 });
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, m = ctx.cast.mayor;
      m.pose('dance2', t, { speed: 1.6 }); m.face('grin', t);
      ctx.store.cr.forEach((w) => { w.ch.pose('stunned', 0.5 + w.ph * 0.1); w.ch.face('neutral', 1.5); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      setCam(ctx, { pos: L(52.6, 3.1, 1.0), look: L(44, 1.3, -0.3), fov: 54 });
      speechCounter(ctx);
      tag(ctx, 'NOBODY CLAPS', ctx.time('b15.w8'), Infinity, { y: 0.27, size: 60, bg: 'rgba(20,20,40,0.85)' });
    },
  },
  // ── b16 "Then the sky turned red…"  — low from the plaza behind the gathered town: tower + crack; the sky floods red
  {
    name: 'sky turns red', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); tower(ctx); crack(ctx);
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', 'mayor', ...X.slice(0, 9)], plazaSpots(12, { seed: 51, x0: 38, x1: 46, z0: -5, z1: 4.5 }));
      faceCrack(ctx, ctx.store.cr);
      plazaFiller(ctx, { n: 110, seed: 7, x0: 38, x1: 48.5 });
      ctx.add(ctx.props.redLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tr = ctx.markers.red;
      const red = ease.inOutSine(clamp((t - tr + 0.35) / 0.6, 0, 1));
      skyMood(ctx, red, 0); if (red > 0.3) lampFlicker(ctx, red);
      ctx.store.cr.forEach((w) => { w.ch.pose(t > tr ? 'surprised' : 'peer', t + w.ph, { headPitch: -0.55 }); w.ch.face(t > tr ? 'shocked' : 'squint', 0.4); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      crackState(ctx, { len: 1, open: 0.08 + 0.14 * red, glow: 1 + 0.6 * red });
      const P = ctx.props; P.redLight.position.copy(L(56, 18, -10)); P.redLight.intensity = 400 * red;
      moveCam(ctx, { pos: L(35.2, 1.5, 5.4), look: L(60, 18.5, -17.5), fov: 62 }, { pos: L(36.0, 1.45, 5.0), look: L(60, 19.5, -17.5), fov: 60 }, lt / 1.6);
      pop(ctx, tr, 0.13, '#ffffff', 0.55); shakeOn(ctx, [tr], 0.6, 0.4, 3);
    },
  },
  // ── "…and a giant ear leaned down through the crack."  — low close-up on Grandma's shocked face; the giant pink ear
  //    bursts through the crack and fills the red sky above her
  {
    name: 'giant ear', start: 'b16.w7-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const G = { x: 40.6, z: 1.6 }, yw = yawTo(G.x, G.z, CRACK_POS[0], CRACK_POS[2]);
      const g = put(ctx, 'grandma', L(G.x, 0, G.z), L.yaw + yw);
      ctx.store.cr = crowd(ctx, [X[3], X[4], 'dunbar'], [[42.6, 0, 3.4, yw + 0.2], [39.2, 0, -0.6, yw - 0.1], [43.4, 0, 0.2, yw]]);
      plazaFiller(ctx, { n: 90, seed: 7, x0: 40, x1: 48.5 });
      // camera low in front-left of her, looking up past her face into the sky
      const f = humanFace(g), a = yw + 0.55, d = V(Math.sin(a), 0, Math.cos(a));
      const lf = ctx.set.root.worldToLocal(f.clone());
      const pos = L(lf.x + d.x * 2.5, 0.55, lf.z + d.z * 2.5);
      const cam = { pos, look: L(lf.x, lf.y + 0.9, lf.z), fov: 58 };
      ctx.store.cam = cam; crackInView(ctx, cam, { sy: 0.5, sx: 0.0, dist: 80, H: 30 });
      ctx.add(ctx.props.redLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, te = ctx.time('b16.w8'), g = ctx.cast.grandma;
      skyMood(ctx, 1, 0); lampFlicker(ctx, 1);
      const rip = ease.outCubic(clamp((t - te + 0.35) / 0.4, 0, 1)), push = ease.outBack(clamp((t - te + 0.05) / 0.45, 0, 1));
      crackState(ctx, { len: 1, open: 0.3 + 0.6 * rip, glow: 1.5, mask: true }, { lean: 0.1 + 0.15 * push, z: -0.25 * (1 - push), scale: lerp(0.7, 1, push), twitch: 1, glow: 1.3 });
      g.pose('surprised', t, { headPitch: -0.5 }); g.face('shocked', 0.4);
      ctx.store.cr.forEach((w) => { w.ch.pose('surprised', t + w.ph, { headPitch: -0.6 }); w.ch.face('shocked', 0.4); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      const P = ctx.props; P.redLight.position.copy(L(56, 18, -10)); P.redLight.intensity = 400;
      const c0 = ctx.store.cam; moveCam(ctx, c0, { pos: c0.pos.clone().add(up(-0.08)), look: c0.look, fov: 55 }, lt / 1.8, 1.2, '#ffd0c8', 8);
      shakeOn(ctx, [te], 0.9, 0.5, 9); ctx.cam.shake(0.06, t, 4);
    },
  },
  // ── b17 "If nobody gave it a new word, the crack would close…"  — high angle: townspeople walk sad little circles
  {
    name: 'sad circles', start: 'b17-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); tower(ctx);
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', 'mayor', X[0], X[1], X[2], X[3], X[4]], [[40.9, 0, -1.6, 0], [43.6, 0, 1.2, 0], [40.6, 0, 2.6, 0], [44.4, 0, -2.0, 0], [42.2, 0, 4.2, 0], [45.6, 0, 3.2, 0], [42.4, 0, -0.3, 0], [38.6, 0, 0.6, 0]]);
      plazaFiller(ctx, { n: 70, seed: 27, x0: 47, x1: 49 });
      ctx.add(ctx.props.redLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      skyMood(ctx, 1, 0); lampFlicker(ctx, 0.7);
      ctx.store.cr.forEach((w, k) => { const r = 0.55, a = (t * WALK_SAD_SPEED / r) * (k % 2 ? 1 : -1) + w.ph; w.ch.root.position.copy(L(w.x + r * Math.cos(a), 0, w.z + r * Math.sin(a))); w.ch.root.rotation.y = L.yaw + Math.atan2(-Math.sin(a), Math.cos(a)) * (k % 2 ? 1 : -1) + (k % 2 ? 0 : PI); w.ch.pose('walkSad', t + w.ph); w.ch.face('sad', 1.5); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      const P = ctx.props; P.redLight.position.copy(L(56, 18, -10)); P.redLight.intensity = 260;
      moveCam(ctx, { pos: L(42.3, 7.4, 7.2), look: L(42.4, 0.5, 0.7), fov: 55 }, { pos: L(42.5, 7.0, 6.5), look: L(42.5, 0.5, 0.6), fov: 55 }, lt / 1.6);
      fill(ctx, L(42.5, 3.2, 2.4), 3.2, '#ffb48a', 16);
    },
  },
  // ── "…and the silence would last forever."  — looking straight up at the crack: its glowing edges slide shut on the ear
  {
    name: 'crack closing', start: 'b17.w7-0.1', set: 'town',
    setup(ctx) { town(ctx, 'day'); tower(ctx); crack(ctx); ctx.add(ctx.props.redLight); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tc = ctx.time('b17.w10');
      skyMood(ctx, 1, 0);
      const k = clamp((t - ctx.time('b17.w7')) / 2.2, 0, 1);
      crackState(ctx, { len: 1, open: lerp(0.95, 0.4, ease.inOutSine(k)), glow: 1.3 + 0.3 * Math.sin(t * 9) * (t > tc ? 1 : 0), mask: true }, { lean: 0.35, twitch: 1, glow: 1.1 });
      const P = ctx.props; P.redLight.position.copy(L(56, 18, -10)); P.redLight.intensity = 360;
      const cw = crackWorld(ctx, 0, 0.0);
      moveCam(ctx, { pos: L(43.6, 1.4, 3.4), look: cw, fov: 27 }, { pos: L(43.6, 1.4, 3.4), look: cw, fov: 23 }, k);
      if (t > tc) ctx.cam.shake(0.12, t, 8);
      tag(ctx, 'SILENCE: FOREVER', tc + 0.05, Infinity, { y: 0.1, size: 80, fill: '#ffffff', bg: 'rgba(120,0,10,0.92)' });
    },
  },
  // ── b18 "Only one person in town never needed the sky words. Me."  — push through the frozen crowd to the kid
  {
    name: 'only me', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); tower(ctx); crack(ctx);
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', 'mayor', ...X.slice(0, 13)], plazaSpots(16, { seed: 61, x0: 35, x1: 44.5, z0: -4.6, z1: 4.6, corridor: true }));
      plazaFiller(ctx, { n: 100, seed: 19, corridor: true, x0: 44, x1: 48.5 });
      put(ctx, 'me', ctx.store.L(41.9, 0, 0.2), PI / 2);
      ctx.add(ctx.props.redLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, tm = ctx.time('b18.w10');
      skyMood(ctx, 1, 0);
      crackState(ctx, { len: 1, open: 0.32, glow: 1.3, mask: true }, { lean: 0.45, twitch: 0.6 });
      ctx.store.cr.forEach((w) => { w.ch.pose('stunned', 0.4, { headPitch: -0.5 }); w.ch.face('sad', 1.5); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      const turn = ease.inOutCubic(clamp((t - (tm - 1.1)) / 0.5, 0, 1));
      me.root.rotation.y = L.yaw + PI / 2 + PI * turn;
      if (turn < 1) { me.pose('stunned', 0.4, { headPitch: -0.5 * (1 - turn) }); me.face('sad', 1.5); }
      else { pointSelf(me, t, ease.outCubic(clamp((t - (tm - 0.5)) / 0.4, 0, 1))); me.face('sweat', 0.6); }
      const P = ctx.props; P.redLight.position.copy(L(60, 20, -2)); P.redLight.intensity = 360;
      const k = ease.inOutSine(clamp(lt / 3.3, 0, 1));
      const f = humanFace(me);
      moveCam(ctx, { pos: L(32.6, 1.85, 0.45), look: L(48, 4.5, 0.1), fov: 50 }, { pos: L(38.9, 1.55, 0.35), look: L(41.9, f.y - 0.42, 0.2), fov: 40 }, k, 1.2, '#ffe0d8');
      tag(ctx, 'EXCEPT ME', tm, Infinity, { y: 0.09, size: 84, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  // ── b19 "I climbed on stage."
  {
    name: 'climb stage', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); tower(ctx); crack(ctx);
      put(ctx, 'me', ctx.store.L(48.9, 0, 0.3), PI / 2);
      plazaFiller(ctx, { n: 90, seed: 23, x0: 36, x1: 46 });
      ctx.add(ctx.props.redLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, tc = ctx.time('b19.w1');
      skyMood(ctx, 1, 0);
      crackState(ctx, { len: 1, open: 0.3, glow: 1.3, mask: true }, { lean: 0.45, twitch: 0.6 });
      const u = ease.inOutCubic(clamp((t - tc + 0.1) / 0.42, 0, 1)), hop = Math.sin(PI * u) * 0.6;
      const tt = ease.inOutCubic(clamp((t - tc - 0.22) / 0.36, 0, 1));
      me.root.position.copy(L(lerp(48.9, KID_STAGE.x, u), lerp(0, STAGE_Y, u) + hop, lerp(0.3, 0, u)));
      me.root.rotation.y = L.yaw + PI / 2 + PI * tt;
      if (u > 0 && u < 1) me.pose('cheer', t); else me.pose('idle', t);
      me.face('sweat', 0.6);
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      const P = ctx.props; P.redLight.position.copy(L(60, 20, -2)); P.redLight.intensity = 360;
      moveCam(ctx, { pos: L(44.6, 1.5, 3.2), look: L(50.2, 1.75, -0.2), fov: 50 }, { pos: L(45.2, 1.5, 2.9), look: L(50.4, 1.85, -0.2), fov: 48 }, lt / 2.4);
      fill(ctx, L(48.5, 3.0, 1.5), 1.9, '#ffe6d8', 12);
    },
  },
  // ── "The whole town stared."  — reverse: over the kid's shoulder at the silent crowd
  {
    name: 'town stares', start: 'stare-0.15', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      put(ctx, 'me', ctx.store.L(KID_STAGE.x, STAGE_Y, KID_STAGE.z), -PI / 2);
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', 'mayor', ...X.slice(0, 13)], plazaSpots(16, { seed: 71, x0: 41, x1: 47.6, z0: -5, z1: 5 }));
      ctx.store.cr.forEach((w) => { w.ch.root.rotation.y = ctx.store.L.yaw + yawTo(w.x, w.z, KID_STAGE.x, KID_STAGE.z); });
      plazaFiller(ctx, { n: 120, seed: 29, x0: 35, x1: 47 });
      ctx.add(ctx.props.redLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      skyMood(ctx, 1, 0);
      me.pose('idle', t, { intensity: 0.3 }); me.face('sweat', 0.6);
      ctx.store.cr.forEach((w) => { w.ch.pose('stunned', 0.4, { headPitch: -0.22 }); w.ch.face('neutral', 1.5); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      const P = ctx.props; P.redLight.position.copy(L(30, 15, 0)); P.redLight.intensity = 250;
      moveCam(ctx, { pos: L(52.4, 2.9, 1.25), look: L(43, 1.25, -0.5), fov: 50 }, { pos: L(52.2, 2.85, 1.15), look: L(43, 1.25, -0.5), fov: 48 }, lt / 1.2);
    },
  },
  // ── "The ear leaned closer."  — low angle: the kid tiny on stage, the ear leaning out of the crack above him
  {
    name: 'ear leans closer', start: 'b19.w8-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); tower(ctx);
      put(ctx, 'me', ctx.store.L(KID_STAGE.x, STAGE_Y, KID_STAGE.z), -PI / 2 + 0.3);
      // back on the plaza, low: the kid small and whole at the bottom, the truss beam low in frame, the crack above it
      const cam = { pos: ctx.store.L(42.3, 0.8, 3.0), look: ctx.store.L(50.4, 5.1, 0), fov: 64 };
      ctx.store.cam = cam; crackInView(ctx, cam, { sy: 0.79, sx: 0.0, dist: 70, H: 21 });
      ctx.add(ctx.props.redLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, te = ctx.time('b19.w9');
      skyMood(ctx, 1, 0);
      const k = ease.inOutSine(clamp((t - te + 0.1) / 0.9, 0, 1));
      crackState(ctx, { len: 1, open: 0.62, glow: 1.4, mask: true }, { lean: 0.45 + 0.5 * k, swivel: -0.45 * k, scale: 1 + 0.12 * k, twitch: 0.6 });
      me.pose('idle', t, { headPitch: -0.45, headYaw: 0.5 }); me.face('shocked', 0.4);
      const P = ctx.props; P.redLight.position.copy(L(40, 8, 3)); P.redLight.intensity = 150;
      setCam(ctx, ctx.store.cam); fill(ctx, L(48.4, 2.6, 1.6), 1.8, '#ffd8d0', 10);
      ctx.cam.shake(0.05 + 0.1 * k, t, 12);
    },
  },
  // ── b20 "I opened my mouth, and out came…"  — extreme slow push into his face; the crack almost shut behind him
  {
    name: 'big breath', start: 'b20-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      put(ctx, 'me', ctx.store.L(KID_STAGE.x, STAGE_Y, KID_STAGE.z), -PI / 2);
      const L = ctx.store.L, f = humanFace(ctx.cast.me);
      const A = { pos: L(46.2, 1.75, 0.5), look: f.clone().add(up(-0.2)), fov: 40 }, B = { pos: L(47.6, 2.05, 0.2), look: f.clone().add(up(-0.32)), fov: 38 };
      ctx.store.A = A; ctx.store.B = B;
      crackInView(ctx, B, { sy: 0.8, sx: 0.05, dist: 6.5, H: 1.7 });   // a thin glowing slit in the top third behind his head (in front of the backdrop)
      ctx.add(ctx.props.redLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me;
      skyMood(ctx, 1, 0);
      crackState(ctx, { len: 1, open: 0.14, glow: 1.7 + 0.3 * Math.sin(t * 7) });
      const br = ease.inOutSine(clamp((t - ctx.time('b20.w4')) / 0.9, 0, 1));
      me.pose('idle', t, { intensity: 0.2 });
      const J = me.joints; J.torso.rotation.x -= 0.12 * br; J.head.rotation.x -= 0.1 * br; J.armL.rotation.z += 0.18 * br; J.armR.rotation.z -= 0.18 * br;
      J.torso.scale.set(1 + 0.06 * br, 1 + 0.04 * br, 1 + 0.1 * br);
      me.face(br > 0.4 ? 'determined' : 'sweat', 0.6);
      const P = ctx.props; P.redLight.position.copy(L(44, 5, 2)); P.redLight.intensity = 120;
      moveCam(ctx, ctx.store.A, ctx.store.B, ease.inOutSine(clamp(lt / 2.1, 0, 1)), 1.2, '#ffe6dc');
    },
  },
  // ── b21 HUSS ×3 — shockwave rings blast up toward the ear
  ...[0, 1, 2].map((i) => ({
    name: `huss to the sky #${i + 1}`, start: H('b21', i), set: 'town',
    setup(ctx) {
      town(ctx, 'day'); if (i === 1) tower(ctx);
      const L = ctx.store.L;
      put(ctx, 'me', L(KID_STAGE.x, STAGE_Y, KID_STAGE.z), -PI / 2);
      const me = ctx.cast.me, f = humanFace(me);
      // #1 face (aimed low: face in the upper third, clear of the HUSS! caption) · #2 low wide from the plaza ·
      // #3 low hero angle right under the stage lip: the kid whole at the bottom, the rings rising into the ear at the top
      const cams = [{ pos: L(46.9, 1.85, 0.35), look: f.clone().add(up(-0.52)), fov: 38 }, { pos: L(43.2, 0.7, 3.0), look: L(54, 7.5, -0.6), fov: 62 }, { pos: L(47.7, 0.6, -2.5), look: L(52.6, 6.6, 1.4), fov: 66 }];
      const cam = cams[i]; ctx.store.cam = cam;
      if (i === 0) crackInView(ctx, cam, { sy: 0.7, dist: 70, H: 24 });
      else if (i === 1) crackInView(ctx, cam, { sy: 0.62, sx: 0.15, dist: 75, H: 30 });
      else crackInView(ctx, cam, { sy: 0.62, sx: -0.05, dist: 70, H: 30 });
      ctx.props.rings.forEach((r) => ctx.add(r, ctx.set.root));
      plazaFiller(ctx, { n: 100, seed: 33, x0: 36, x1: 47 });
      ctx.add(ctx.props.redLight);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, me = ctx.cast.me, P = ctx.props, hits = hussHits(ctx, 'b21');
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      skyMood(ctx, 1, 0);
      me.pose('slam', t, { hits }); me.face(dh < 0.28 ? 'huss' : 'determined', t);
      const n = hits.filter((x) => x <= t).length;
      crackState(ctx, { len: 1, open: (i === 2 ? 0.35 : 0.14) + 0.06 * n + 0.12 * hitPulse(hits, t, 0.15), glow: 1.5 + hitPulse(hits, t, 0.2), mask: true }, { lean: 0.35, twitch: 1, wiggle: 0.15 * hitPulse(hits, t, 0.3) });
      const mouth = humanFace(me).add(up(-0.12)), ear = crackWorld(ctx, 0, 0);
      hits.forEach((hh, k) => {
        const r = P.rings[k], u = (t - hh) / 0.9;
        const p = mouth.clone().lerp(ear, ease.inCubic(clamp(u, 0, 1)));
        r.position.copy(ctx.set.root.worldToLocal(p)); r.lookAt(ear); r.userData.set(u < 0 ? -1 : 0.25 + u * 0.75, i === 2 ? 6 : 4);
      });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      P.redLight.position.copy(L(44, 5, 2)); P.redLight.intensity = 150;
      setCam(ctx, ctx.store.cam, i === 1 ? 0 : 1.3, '#ffe6dc');
      ctx.cam.punch(hits, t, 0.12, 0.2); shakeOn(ctx, hits, 0.6, 0.3, 40 + i);
      pop(ctx, hits[i], 0.1, '#ffffff', 0.3);
    },
  })),
  // ── b22 "The giant ear wiggled."  — new angle: from the stage, straight up at the crack; the ear fills the frame and
  //    flaps, the crack flares gold
  {
    name: 'ear wiggles', start: 'b22-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const cam = { pos: L(53.6, 2.4, 4.6), look: L(60, 30, -8), fov: 40 };
      ctx.store.cam = cam; crackInView(ctx, cam, { sy: 0.0, sx: 0.0, dist: 70, H: 34 });
      ctx.add(ctx.props.glowLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tw = ctx.markers.wig;
      const g = ease.inOutSine(clamp((t - tw - 0.1) / 0.5, 0, 1));
      skyMood(ctx, 1 - 0.3 * g, 0.3 * g);
      const wig = t > tw - 0.05 ? 1 : 0;
      crackState(ctx, { len: 1, open: lerp(0.75, 1.0, g), glow: 1.4 + 0.8 * g, gold: g, mask: true }, { lean: 0.35, wiggle: wig, glow: 1.2 + 0.6 * g });
      const cw = crackWorld(ctx, 0, -0.02);
      const c0 = ctx.store.cam; setCam(ctx, { pos: c0.pos, look: c0.look, fov: c0.fov - 2 * clamp(lt / 1.4, 0, 1) });
      const P = ctx.props; P.glowLight.position.copy(cw); P.glowLight.intensity = 200 * g; P.glowLight.color.set('#ffd27a');
      if (wig) tag(ctx, '*WIGGLE*', tw, Infinity, { y: 0.1, size: 90, fill: '#ffe14a', bg: 'rgba(20,20,40,0.85)', rot: 0.05 * Math.sin(t * 30) });
    },
  },
  // ── "The sky turned gold."  — the red floods back to bright golden day
  {
    name: 'sky turns gold', start: 'b22.w4-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { party: true }); tower(ctx); crack(ctx);
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', 'mayor', ...X.slice(0, 11)], plazaSpots(14, { seed: 81, x0: 38, x1: 46, z0: -5, z1: 4.5 }));
      faceCrack(ctx, ctx.store.cr);
      plazaFiller(ctx, { n: 110, seed: 37, x0: 38, x1: 48.5 });
      ctx.add(ctx.props.sparkles); ctx.add(ctx.props.glowLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tg = ctx.time('b22.w7');
      const g = ease.inOutSine(clamp((t - ctx.time('b22.w5')) / (tg - ctx.time('b22.w5') + 0.2), 0, 1));
      skyMood(ctx, 0.7 * (1 - g), 0.3 + 0.7 * g);
      crackState(ctx, { len: 1, open: 0.9, glow: 2.0, gold: 1, mask: true }, { lean: 0.5, wiggle: 0.4, glow: 1.6 });
      ctx.store.cr.forEach((w) => { w.ch.pose('peer', t + w.ph, { headPitch: -0.6 }); w.ch.face(g > 0.5 ? 'smile' : 'shocked', 0.4); });
      ctx.props.filler.userData.set(t, { arms: 'limp', bounce: 0.1 });
      const c = moveCam(ctx, { pos: L(36.4, 1.1, 5.2), look: L(60, 17.5, -17.5), fov: 62 }, { pos: L(35.8, 1.4, 5.5), look: L(60, 18.5, -17.5), fov: 62 }, lt / 1.4);
      const P = ctx.props; P.sparkles.position.copy(c.pos.clone().lerp(c.look, 0.2)); P.sparkles.userData.set(t, g);
      P.glowLight.position.copy(crackWorld(ctx)); P.glowLight.intensity = 150; P.glowLight.color.set('#ffd27a');
      pop(ctx, tg, 0.1, '#fff2c0', 0.35);
    },
  },
  // ── "And the whole town shouted it back."  — fists up, mouths open: HUSS!
  {
    name: 'town shouts back', start: 'b22.w8-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: true });
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', 'mayor', ...X.slice(0, 11)], plazaSpots(14, { seed: 91, x0: 41, x1: 47, z0: -4.5, z1: 4.5, yaw: PI / 2 }));
      ctx.store.cr.forEach((w) => { w.ch.root.rotation.y = L.yaw + yawTo(w.x, w.z, 49.5, 0.5) + (hash(w.k) - 0.5) * 0.4; });
      plazaFiller(ctx, { n: 110, seed: 39, x0: 36, x1: 47 });
      addBubbles(ctx, ctx.props.bub.huss);
      ctx.add(ctx.props.sparkles);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, ts = ctx.time('b22.w12');
      skyMood(ctx, 0, 1);
      ctx.store.cr.forEach((w, k) => { const on = t > ts - 0.1 + (k % 4) * 0.06; w.ch.pose(on ? 'cheer' : 'idle', t + w.ph, { headPitch: -0.2 }); w.ch.face(on ? 'huss' : 'smile', 0.4); });
      ctx.props.filler.userData.set(t, { arms: t > ts - 0.1 ? 'cheer' : 'limp', bounce: t > ts ? 0.8 : 0.1 });
      const c = moveCam(ctx, { pos: L(48.6, 1.25, 1.5), look: L(43, 1.0, -0.5), fov: 54 }, { pos: L(48.4, 1.15, 1.3), look: L(43, 1.05, -0.5), fov: 52 }, lt / 1.6);
      const P = ctx.props; P.sparkles.position.copy(c.pos.clone().lerp(c.look, 0.3)); P.sparkles.userData.set(t, 0.8);
      const cr = ctx.store.cr, picks = [0, 1, 2, 5, 8, 11];
      picks.forEach((ci, k) => bubble(ctx, P.bub.huss[k], headTop(cr[ci].ch).add(up(0.15)), ts - 0.05 + k * 0.08, { k: 0.42 }));
      shakeOn(ctx, [ts], 0.35, 0.3, 17);
    },
  },
  // ── b23 HUSS ×6 — party night: the town chants, the kid crowd-surfs, H-U-S-S blocks drop out of the crack
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `party huss #${i + 1}`, start: H('b23', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'party_night', { party: true, fireworks: true });
      const P = ctx.props;
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', 'mayor', ...X.slice(0, 13)], plazaSpots(16, { seed: 101, x0: 39.5, x1: 46.5, z0: -4.8, z1: 4.8 }));
      plazaFiller(ctx, { n: 130, seed: 41, x0: 35, x1: 47 });
      put(ctx, 'me', L(43, 0, 0), 0);
      P.huss.forEach((b) => addTo(ctx, b, 0, 0, 0));
      P.puffs.slice(0, 4).forEach((p) => addTo(ctx, p, 0, 0, 0));
      if (i === 0 || i === 2 || i === 5) { tower(ctx); crack(ctx); }
      ctx.add(P.confetti.root, ctx.set.root); P.confetti.root.position.set(43, 0, 0);
      if (i === 3) addBubbles(ctx, P.bub.huss.slice(0, 3));
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, hits = hussHits(ctx, 'b23'), me = ctx.cast.me;
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      ctx.store.cr.forEach((w, k) => { w.ch.pose(k % 3 ? 'cheer' : 'dance', t + w.ph, { speed: 1.4 }); w.ch.face(dh < 0.2 ? 'huss' : 'laugh', t + w.ph); });
      P.filler.userData.set(t, { arms: 'up', bounce: 1, speed: 1.3 });
      // the kid crowd-surfing across the plaza
      const s = clamp((t - hits[0] + 0.4) / 2.0, 0, 1), sp = V(lerp(40.2, 45.6, s), 0, lerp(-2.4, 2.0, s)), dir = V(1, 0, 0.8).normalize();
      surfer(ctx, me, L(sp.x, 0, sp.z), dir, t, 2.35 + 0.12 * Math.sin(t * 9)); me.face(dh < 0.2 ? 'huss' : 'laugh', 0.3);
      if (i === 1) me.root.rotation.z = 0.75;          // roll him toward the side camera so his face reads
      // H-U-S-S blocks land on hits 0..3 in a row in front of the stage
      const zs = ROW(4), from = [100, 38, -4];
      P.huss.forEach((b, k) => { const d = fallBlock(ctx, b, [from[0], from[1], from[2] + zs[k]], [47.7, BLOCK_TOP, zs[k]], hits[k], 0.55, k % 2 ? 1 : -1); b.userData.set(1.6); P.puffs[k].root.position.set(47.7, 0.1, zs[k]); P.puffs[k].update(d < 0 ? 0 : d / 0.6); });
      if (i === 0 || i === 2 || i === 5) crackState(ctx, { len: 1, open: 0.5 + 0.2 * hitPulse(hits, t, 0.2), glow: 1.8, gold: 1 });
      P.confetti.update?.(t - hits[0] + 0.3);
      let cam;
      me.root.updateMatrixWorld(true);
      const hd = ctx.set.root.worldToLocal(me.joints.head.localToWorld(V(0, 0.3, 0)));
      const side = V(dir.z, 0, -dir.x);
      if (i === 0) cam = { pos: L(34.4, 6.6, 8.6), look: L(46.5, -1.2, -2.2), fov: 56 };                                  // wide: the surfer in the upper third
      else if (i === 1) cam = { pos: L(hd.x + side.x * 2.5 - dir.x * 0.4, 2.75, hd.z + side.z * 2.5 - dir.z * 0.4), look: L(hd.x, hd.y - 0.35, hd.z), fov: 44 };   // side-on, his face
      else if (i === 2) cam = { pos: L(45.6, 1.35, 7.6), look: L(47.9, 1.9, -0.4), fov: 54 };
      else if (i === 3) cam = { pos: L(49.4, 3.3, 0.0), look: L(43.5, 1.6, -0.2), fov: 52 };
      else if (i === 4) cam = { pos: L(sp.x - dir.x * 1.3, 6.4, sp.z - dir.z * 1.3), look: L(sp.x + dir.x * 0.5, 1.6, sp.z + dir.z * 0.5), fov: 50 };   // top-down, head at the top
      else cam = { pos: L(43.0, 2.3, 6.4), look: L(47.7, 0.05, 0), fov: 60 };                                                  // the H-U-S-S row
      setCam(ctx, cam, 0.8);
      if (i === 3) { const cr = ctx.store.cr; [0, 1, 2].forEach((ci, k) => bubble(ctx, P.bub.huss[k], headTop(cr[ci].ch).add(up(0.15)), hits[3] - 0.04 + k * 0.05, { k: 0.4 })); }
      ctx.cam.punch(hits, t, 0.12, 0.2); shakeOn(ctx, hits.slice(0, 4), 0.45, 0.28, 50 + i);
      if (i >= 4) tag(ctx, 'H U S S', hits[4], Infinity, { y: 0.13, size: 110, fill: '#ffe14a', bg: 'rgba(138,92,255,0.9)' });
    },
  })),
  // ── b24 "Then a giant hand reached down from the crack…"  — music cut; the hand lowers beside the kid with a big pencil.
  //    Low from the side, just in front of the truss line (the beam stays above the frame); the kid lit, turned 3/4 to us.
  {
    name: 'giant hand', start: 'b24-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'party_night', { party: false });
      tower(ctx); crack(ctx);
      put(ctx, 'me', L(KID_STAGE.x, STAGE_Y, KID_STAGE.z), yawTo(KID_STAGE.x, KID_STAGE.z, 48.3, 4.6) + 0.55);
      ctx.store.cr = crowd(ctx, ['grandma', 'dunbar', 'mayor', ...X.slice(0, 9)], plazaSpots(12, { seed: 111, x0: 40.5, x1: 46.5 }));
      faceCrack(ctx, ctx.store.cr);
      plazaFiller(ctx, { n: 100, seed: 43, x0: 35, x1: 47 });
      const P = ctx.props; ctx.add(P.hand); P.hand.scale.setScalar(2.4); ctx.add(P.pencil, P.hand.userData.hold); P.pencil.scale.setScalar(2.5); P.pencil.rotation.set(0, 0, -PI / 2); P.pencil.position.set(0, 0, 0);
      ctx.add(P.glowLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      crackState(ctx, { len: 1, open: 0.55, glow: 1.6, gold: 0.8, mask: true });
      const k = ease.inOutSine(clamp((t - ctx.time('b24.w2') + 0.3) / 1.9, 0, 1));
      const cw = crackWorld(ctx, 0, 0), end = L(53.0, 4.6, -1.6), p = cw.clone().lerp(end, k);
      orientHand(P.hand, p, cw.clone().sub(p).normalize().lerp(V(0.3, 1, 0).normalize(), 0.3), V(-1, 0, 0.4));
      P.hand.userData.set({ curl: 1 });
      me.pose('stunned', t, { headPitch: -0.45, headYaw: -0.35 }); me.face('shocked', 0.4);
      ctx.store.cr.forEach((w) => { w.ch.pose('stunned', 0.4, { headPitch: -0.45 }); w.ch.face('shocked', 0.4); });
      P.filler.userData.set(t, { arms: 'limp', bounce: 0 });
      P.glowLight.position.copy(p.clone().add(V(0, 2.5, 0))); P.glowLight.intensity = 20; P.glowLight.color.set('#ffe9c0');
      moveCam(ctx, { pos: L(48.0, 1.0, 4.9), look: L(54.2, 6.6, -3.8), fov: 66 }, { pos: L(48.3, 1.0, 4.6), look: L(54.0, 6.1, -3.6), fov: 64 }, lt / 2.3);
      fill(ctx, L(49.2, 2.6, 2.0), 2.0, '#ffe9c0', 9);
    },
  },
  // ── "…and handed me a pencil."
  {
    name: 'handed a pencil', start: 'b24.w9-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'party_night', { party: false });
      put(ctx, 'me', L(KID_STAGE.x, STAGE_Y, KID_STAGE.z), PI / 2 - 0.75);
      const P = ctx.props; ctx.add(P.hand); P.hand.scale.setScalar(2.4); ctx.add(P.pencil, P.hand.userData.hold); P.pencil.scale.setScalar(2.2); P.pencil.rotation.set(PI / 2, 0, 0); P.pencil.position.set(0, 0, 0.35);
      ctx.add(P.glowLight);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, th = ctx.markers.pencil;
      const k = ease.inOutSine(clamp((t - th + 0.4) / 0.8, 0, 1));
      const p = L(54.4, 5.4, -0.4).lerp(L(52.7, 3.9, 0.0), k);
      P.hand.scale.setScalar(1.45);
      orientHand(P.hand, p, V(0.55, 1, -0.1).normalize(), V(-1, 0, 0.35));
      me.pose('stunned', t, { headPitch: -0.2 }); me.face('shocked', 0.4);
      const J = me.joints; J.armL.rotation.x -= 0.6 * k; J.armR.rotation.x -= 0.6 * k;
      P.glowLight.position.copy(p.clone().add(V(0.5, 2.5, 0))); P.glowLight.intensity = 10; P.glowLight.color.set('#ffe9c0');
      // palm + pencil fill the upper right, his face at y ≈ 0.4
      moveCam(ctx, { pos: L(51.5, 1.95, 6.6), look: L(51.85, 3.25, 0), fov: 56 }, { pos: L(51.4, 1.9, 6.2), look: L(51.8, 3.2, 0), fov: 54 }, lt / 1.5, 0.7, '#ffe9c0', 14);
      if (t > th) tag(ctx, 'A PENCIL?!', th + 0.05, Infinity, { y: 0.1, size: 84, fill: '#ffe14a', bg: 'rgba(20,20,40,0.85)' });
    },
  },
  // ── b25 "Turns out the old word-maker just retired. Tomorrow's word is due at eight."  — his bedroom, 7:59
  {
    name: 'bedroom 7:59', start: 'b25-0.1', set: 'room',
    setup(ctx) { bedroom(ctx); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t;
      bedroomFrame(ctx);
      moveCam(ctx, { pos: R(-0.35, 1.45, 3.4), look: R(-0.55, 1.3, -2.1), fov: 60 }, { pos: R(-0.4, 1.42, 3.05), look: R(-0.6, 1.3, -2.1), fov: 59 }, lt / 2.5, 0.9, '#ffe6c0', 9);
      tag(ctx, 'NEW JOB: WORD-MAKER', ctx.time('b25.w4'), Infinity, { y: 0.09, size: 66, bg: 'rgba(20,20,40,0.85)' });
    },
  },
  {
    name: 'due at eight', start: 'b25.w7-0.1', set: 'room',
    setup(ctx) { bedroom(ctx); },
    update(ctx, lt) {
      const R = ctx.store.R, t = ctx.t, me = ctx.cast.me, tS = ctx.time('b25.w7') - 0.02, tE = tS + 1.62;
      bedroomFrame(ctx);
      // a close 3/4 on his face with the 7:59 wall clock in the top-right corner; the iris starts ≥1.5 s after the stamp
      const f = humanFace(me);
      moveCam(ctx, { pos: R(-0.75, 1.32, 2.95), look: R(-0.86, 0.95, -1.4), fov: 51 }, { pos: R(-0.7, 1.3, 2.6), look: R(-0.84, 0.94, -1.4), fov: 50 }, lt / 2.0, 0.8, '#ffe6c0', 8);
      const k = clamp((t - tE) / 0.38, 0, 1);
      if (k <= 0) stamp(ctx, 'DUE: 8:00 AM', tS, { x: 0.38, y: 0.085, size: 92, rot: -0.08 });
      if (k > 0) { ctx.fx.draw((g, W, Hh) => { const r = Math.hypot(W, Hh) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, Hh); g.arc(W * 0.5, Hh * 0.36, Math.max(0.5, r), 0, PI * 2, true); g.fill('evenodd'); g.restore(); }); ctx.caption.hide(true); }
    },
  },
];

// ─── shared shot pieces (declared after the list; hoisted function declarations)
function P_bubs(ctx, idx) { const b = ctx.props.bub.skronk; addBubbles(ctx, idx.map((i) => b[i])); return idx.map((i) => b[i]); }
function speechCounter(ctx) {
  const t0 = ctx.time('b15.w4'), t1 = ctx.time('b15.w9') + 0.1, t = ctx.t;
  const k = clamp((t - t0) / (t1 - t0), 0, 1), sec = Math.round(2400 * ease.inQuad(k));
  const mm = Math.floor(sec / 60), ss = sec % 60;
  ctx.fx.text('SPEECH LENGTH', { x: 0.5, y: 0.085, size: 54, fill: '#ffffff', stroke: '#000000', line: 8, bg: 'rgba(8,10,14,0.85)' });
  ctx.fx.text(`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, { x: 0.5, y: 0.16, size: 130, fill: k >= 1 ? '#ff4f4f' : '#3cff6b', stroke: '#000000', line: 10, bg: 'rgba(8,10,14,0.88)', scale: k >= 1 && t - t1 < 0.15 ? 1.15 : 1 });
}
/** hand at world position p; its arm (+Y) points along upDir; palm (+Z) toward `facing` */
function orientHand(hand, p, upDir, facing) {
  const y = upDir.clone().normalize(), z = facing.clone().addScaledVector(y, -facing.dot(y)).normalize(), x = new THREE.Vector3().crossVectors(y, z);
  hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); hand.position.copy(p);
}
// ─── the bedroom (hero room; window x −1.45…−0.15, y 0.95…2.25, back wall z −2.1; bed against the left wall)
function bedroom(ctx) {
  const s = ctx.set; s.setLighting('night'); s.set('window', 'dark'); s.exposure = 1.15;
  const R = T(ctx); ctx.store.R = R;
  const P = ctx.props, b = builtins(ctx); if (b.view) b.view.visible = false;
  const yw = yawOf(s.root);
  ctx.add(P.nightSky); P.nightSky.position.copy(R(-0.8, 1.6, -5.2)); P.nightSky.rotation.set(0, yw, 0);
  const C = P.crackWin; ctx.add(C); C.position.copy(R(-0.85, 1.65, -3.2)); C.rotation.set(0, yw, 0); C.scale.setScalar(1.35);
  put(ctx, 'me', R(-1.55, 0, -0.75), yw + PI / 2 - 0.6);
  ctx.add(P.pencil2); P.pencil2.scale.setScalar(1.45);
  ctx.add(P.wallClock); P.wallClock.position.copy(R(-0.2, 2.66, -2.07)); P.wallClock.rotation.set(0, yw, 0); P.wallClock.scale.setScalar(0.2); P.wallClock.userData.set(59 / 60, (7 + 59 / 60) / 12);
  ctx.add(P.winLight); P.winLight.position.copy(R(-0.8, 1.7, -1.6)); P.winLight.intensity = 6;
}
function bedroomFrame(ctx) {
  const t = ctx.t, me = ctx.cast.me, P = ctx.props;
  const b = builtins(ctx); if (b.view) b.view.visible = false;
  hugPose(me, t); me.face('sweat', 0.6);
  me.root.updateMatrixWorld(true);
  const c = me.joints.torso.localToWorld(V(0.22, 0.3, 0.38));
  P.pencil2.position.copy(c); P.pencil2.quaternion.copy(me.root.quaternion); P.pencil2.rotateZ(-0.62); P.pencil2.rotateX(0.15);
  const C = P.crackWin; C.userData.set({ len: 1, open: 0.95, glow: 1.4, gold: 0.6, mask: true, Wmax: 0.34 });
  const E = C.userData.ear; E.visible = true; E.scale.setScalar(EAR_S); E.position.set(0, 0.02, -0.07); E.userData.set(t, { lean: 0.45, twitch: 0.5, glow: 1.6 });
}
