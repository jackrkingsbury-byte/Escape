// In This Town — Episode 25: "Nugget".  Everybody rides a dinosaur to school; the kid rides Nugget, a chicken.  She enters
// the Great Dino Race, the town laughs, the race turns into a twelve-dinosaur pile-up, Nugget walks past it, rings the
// bell with her face, sits on the clock tower and lays an egg bigger than the tower.  The dinosaurs flee back into the
// park and fix the fence themselves.  At night the egg cracks… "Ba-gawk."
// Film contract: SPEC.md §8.  Timeline: episodes/ep25/timeline.json.  Props: ./props.js (+ ep20 T-rex, ep18/19/24 bits).
//
// Town-local layout (T(ctx)): main street along x (road |z| < 4.5, pavements 4.5…7.5 at y 0.12), square x 30…62.
//   START line x = 12 (racers face +X, front row roots x ≈ 8.4…9.6, back row ≈ 3); Nugget + the kid at NUG.
//   Starter crate for the mayor at CRATE.  Race stage (seesaw) at STAGE.  T-rex spectator at REX.
//   Pile-up centre PILE at the square entrance.  Clock tower TOWER = (66, −2), front (steps) faces −X.
//   The giant egg lands at EGG = (40, 0), scale 7.4 (19.2 m tall), crack facing −X (toward main street).
//   Dinosaur park fence across the west end at x = −37 (front faces +X), jungle trees behind it.
//   Parked cars (world.js) at (−30,−3.3) (−22,3.3) (20,−3.3) (26,3.3): running racers are squeezed to |z| ≤ 1.3 near them.
import * as THREE from 'three';
import { buildTown } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS, extraSpecs } from '../cast.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { makeConfetti } from '../props.js';
import { glowSprite, makeSparkles } from '../ep18/props.js';
import { makeFillerCrowd } from '../ep19/props.js';
import { makeBiscuit, makeShockRing } from '../ep20/props.js';
import { makePodium } from '../ep24/props.js';
import {
  makeChicken, makeTriceratops, makeRaptor, makeStego, makeLongneck, makeFence, makeTower, makeEgg, makeRaceStage,
  makeStartLine, makeFlag, makeClipboard, makeHammer, makeKeepOut, makeEnvelopes, makeCrumb, makeShades, makeTopHat,
  makeJungleTree, makeFern, makeDust, makeStars,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const SPECIAL = {
  maya: { id: 'maya', skin: '#c68642', hair: { style: 'long', color: '#1a120c' }, top: { style: 'tee', color: '#ffd23f', accent: '#ff4fa3', emblem: 'star' },
    bottom: { style: 'shorts', color: '#2f4d8a' }, shoes: '#ff4fa3', accessories: ['sash'], sashColor: '#ff4fa3', scale: 0.9 },
  bigm: { id: 'bigm', skin: '#8d5a3b', hair: { style: 'fade', color: '#1a120c' }, top: { style: 'tee', color: '#1d1d22', accent: '#8a5cff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#ffffff', accessories: ['sunglasses', 'chain'], scale: 1.08, build: 1.3 },
  mail: { id: 'mail', skin: '#f1c7a1', hair: { style: 'short', color: '#7a4a24' }, top: { style: 'tee', color: '#2f6fc0', accent: '#ffd23f', emblem: 'stripe' },
    bottom: { style: 'shorts', color: '#1d3a6a' }, shoes: '#1d1d22', accessories: ['cap', 'mustache'], capColor: '#2f6fc0' },
};
// kid riders for the other racers (ids r0…r9, separate from the crowd extras x00…x17)
const RIDERS = {};
Object.values(extraSpecs(10, 77)).forEach((s, i) => { RIDERS[`r${i}`] = { ...s, id: `r${i}`, scale: 0.84 + 0.1 * hash(i * 1.7), build: 0.95 }; });
const R = Object.keys(RIDERS);
export const cast = { me: MAIN.me, mayor: MAIN.mayor, pigeon: MAIN.pigeon, ...SPECIAL, ...EXTRAS, ...RIDERS };
export const lazySets = true;
export const sets = { town: () => buildTown({ seed: 25, banner: ['THE GREAT', 'DINO', 'RACE'] }) };
const X = EXTRA_IDS;

// ───────────────────────────────────────────────────────────────────────────────────────── layout (town-local)
const START_X = 12, NUG = { x: 11.3, z: 5.4 }, CRATE = { x: 13.2, z: -7.0 };
const STAGE = { x: 31.5, z: -6.6 }, REX = { x: 41, z: 3.5 }, PILE = { x: 32.8, z: -0.3 };
const TOWER = { x: 66, z: -2 }, EGG = { x: 40, z: 0 }, EGG_S = 7.4;
const FENCE_X = -37;
const KID_N = { x: 33.0, z: 10.0 }, NUG_N = { x: 34.5, z: 10.2 };   // night: beside the egg
const CR_YAW = -0.75, CR_DIR = { x: Math.sin(-0.75), z: Math.cos(-0.75) };   // night egg: the crack faces south-west
const crackPt = (L, out = 0.98, dy = 0) => L(EGG.x + CR_DIR.x * EGG_S * out, 2.6 * EGG_S * 0.52 + dy, EGG.z + CR_DIR.z * EGG_S * out);
// the twelve racers: kind, index, root x/z at the start, rider
const RACERS = [
  { k: 'rap', i: 1, x: 9.6, z: -4.2, rider: R[0] },
  { k: 'tri', i: 1, x: 8.4, z: -2.4, rider: R[1] },
  { k: 'rap', i: 0, x: 9.6, z: -0.5, rider: 'bigm' },        // Sprinkles + Big Marcus
  { k: 'tri', i: 0, x: 8.4, z: 1.4, rider: 'maya' },         // Maya's triceratops
  { k: 'stego', i: 0, x: 9.0, z: 3.3, rider: R[2] },
  { k: 'stego', i: 3, x: 2.8, z: -3.8, rider: R[3] },
  { k: 'rap', i: 3, x: 3.6, z: -2.3, rider: R[4] },
  { k: 'stego', i: 1, x: 3.0, z: -0.7, rider: R[5] },
  { k: 'tri', i: 2, x: 2.4, z: 1.3, rider: R[6] },
  { k: 'rap', i: 2, x: 3.6, z: 3.0, rider: R[7] },
  { k: 'stego', i: 2, x: 3.0, z: 4.4, rider: R[8] },
  { k: 'ln', i: 0, x: -5.0, z: 0.2, rider: 'mail' },
];

export function init(ctx) {
  const P = ctx.props;
  P.nug = makeChicken();
  P.tri = ['#2fc4b2', '#ff8a3d', '#9bd34a'].map((c, i) => makeTriceratops(c, { frill: ['#ffb23f', '#ffe14a', '#ff6fb8'][i], saddle: ['#ff4fa3', '#2f4d8a', '#e8232b'][i] }));
  P.rap = ['#8a5cff', '#3fbf6a', '#f2c230', '#3f8fe0'].map((c, i) => makeRaptor(c, { saddle: ['#ffd23f', '#e8232b', '#2f4d8a', '#ff7a2f'][i] }));
  P.stego = ['#e85a4a', '#ff7ab8', '#9a9a3a', '#5ab8e8'].map((c, i) => makeStego(c, { plate: ['#ffd23f', '#8a5cff', '#ff7a2f', '#ffffff'][i] }));
  P.ln = [makeLongneck('#f0b44a')];
  P.rex = makeBiscuit(); P.rex.userData.parts.tagG.visible = false;
  P.fence = makeFence(); P.trees = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => makeJungleTree(i + 1, i === 7 ? 11.5 : i === 8 ? 14.5 : 11 + (i % 3) * 1.8)); P.ferns = [0, 1, 2, 3, 4].map((i) => makeFern(i + 1, 1.3));
  P.tower = makeTower(); P.egg = makeEgg(); P.stage = makeRaceStage(); P.start = makeStartLine(11.4);
  P.flag = makeFlag(); P.clip = makeClipboard(); P.hammer = makeHammer(); P.keep = makeKeepOut(); P.env = makeEnvelopes(6);
  P.crumb = makeCrumb(); P.shades = makeShades(); P.hat = makeTopHat(); P.podium = makePodium();
  P.crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 1.1), new THREE.MeshStandardMaterial({ color: '#c8955a', roughness: 0.8 })); P.crate.castShadow = true; P.crate.receiveShadow = true;
  P.chimney = new THREE.Group();
  { const m = new THREE.MeshStandardMaterial({ color: '#a8493a', roughness: 0.85 }); const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.6, 1.0), m); b.castShadow = true; P.chimney.add(b); const c = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), new THREE.MeshStandardMaterial({ color: '#7a3328' })); c.position.y = 1.3; P.chimney.add(c); const hole = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.7), new THREE.MeshBasicMaterial({ color: '#1a0e0a' })); hole.position.y = 1.41; P.chimney.add(hole); }
  P.dust = makeDust({ n: 46, radius: 6, seed: 3, life: 3.2, spreadX: 1.4 });
  P.dust2 = makeDust({ n: 30, radius: 3.2, seed: 7, life: 1.8 });
  P.dust3 = makeDust({ n: 30, radius: 4.5, seed: 11, life: 2.2, color: '#c9c0b0' });
  P.dustF = makeDust({ n: 30, radius: 3, seed: 5, life: 1.4, spreadX: 1.4 });
  P.pen = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), new THREE.MeshStandardMaterial({ color: '#2f6fc0', roughness: 0.4 })); P.pen.add(b); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 8), new THREE.MeshStandardMaterial({ color: '#1d1d22' })); tip.position.y = -0.135; tip.rotation.x = PI; P.pen.add(tip); }
  P.lampFG = new THREE.Group();   // foreground street lamp for the night crack shot (flickers)
  { const dk = new THREE.MeshStandardMaterial({ color: '#23312a', roughness: 0.6 }); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 4.4, 10), dk); post.position.y = 2.2; P.lampFG.add(post);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), dk); head.position.y = 4.5; P.lampFG.add(head);
    const coreM = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: '#ffb070', emissiveIntensity: 2.5 }); const core = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.36), coreM); core.position.y = 4.2; P.lampFG.add(core);
    const pl = new THREE.PointLight('#ffb070', 6, 9, 1.5); pl.position.y = 4.0; P.lampFG.add(pl); P.lampFG.userData = { coreM, pl }; }
  P.eye = new THREE.Group();      // the giant eye that glints in the crack on 'Ba-gawk'
  { const iris = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), new THREE.MeshBasicMaterial({ color: '#ffb020', toneMapped: false })); P.eye.add(iris);
    const pup = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.78), new THREE.MeshBasicMaterial({ color: '#120a04' })); pup.position.z = 0.01; P.eye.add(pup);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false })); gl.position.set(0.17, 0.2, 0.02); P.eye.add(gl); }
  P.stars = [0, 1, 2, 3, 4].map(() => makeStars(5));
  P.filler = makeFillerCrowd(120);
  P.rings = [0, 1].map(() => makeShockRing());
  P.sparkles = makeSparkles({ n: 60, w: 18, h: 12, d: 10, color: '#ffe08a', size: 0.1 });
  P.motes = makeSparkles({ n: 50, w: 14, h: 9, d: 10, color: '#ffe9c0', size: 0.05 });
  P.confetti = makeConfetti({ count: 260, t0: 0, origin: [0, 0, 0], speed: 10, spread: 0.7, groundY: 0, size: 5 });
  P.glint = glowSprite('#fff4c0', 3, 0.95); P.eggGlow = glowSprite('#ffe9a0', 14, 0.8);
  P.fill = new THREE.PointLight('#fff2e0', 5, 12, 1.4);
  P.key = new THREE.PointLight('#ffe6b0', 0, 40, 1.2);
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function T(ctx) { const r = ctx.set.root; r.updateMatrixWorld(true); const M = r.matrixWorld.clone(); const f = (x, y, z) => V(x, y, z).applyMatrix4(M); f.yaw = yawOf(r); f.M = M; return f; }
function put(ctx, id, p, yaw, scale) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); if (scale != null) r.scale.setScalar(scale); return ctx.cast[id]; }
function addTo(ctx, obj, x, y, z, ry = 0, s = null) { const o = obj.root && obj.root.isObject3D ? obj.root : obj; ctx.add(o, ctx.set.root); o.visible = true; o.position.set(x, y, z); o.rotation.set(0, ry, 0); if (s != null) o.scale.setScalar(s); return o; }
const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.13, size: 76, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,40,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale ?? 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 150, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.12, alpha: clamp(d / 0.06, 0, 1), ...o, scale: s * (o.scale ?? 1) });
  if (d < 0.18 && !o.noShake) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headTop(ch, y = 0.62) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, y, 0)); }
function worldOf(o, x = 0, y = 0, z = 0) { o.updateWorldMatrix(true, false); return o.localToWorld(V(x, y, z)); }
function toLocal(ctx, w) { return ctx.set.root.worldToLocal(w.clone()); }
function fill(ctx, pos, k = 1, color = '#fff2e0', dist = 12) { const f = ctx.props.fill; if (f.parent !== ctx.scene) ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); f.distance = dist; }
function setCam(ctx, c, k = 0, color, dist) { ctx.cam.set(c); clearView(ctx, c); if (k > 0) fill(ctx, c.pos, k, color, dist); return c; }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0, color, dist) { const c = camLerp(a, b, clamp(u, 0, 1)); return setCam(ctx, c, k, color, dist); }
const _p = new THREE.Vector3(), _d = new THREE.Vector3(), _lk = new THREE.Vector3(), _q = new THREE.Vector3();
function blocks(x, y, z, s0, s1, r0, rk) {
  _q.set(x, y, z).sub(_p); const s = _q.dot(_d);
  if (s < s0 || s > s1) return false;
  return _q.addScaledVector(_d, -s).length() < r0 + rk * Math.max(0, s);
}
/** hide filler fans / crowd extras right in front of the lens (unless they stand by the look point) */
function clearView(ctx, c) {
  const r = ctx.set.root; r.updateMatrixWorld(true);
  _p.copy(c.pos); r.worldToLocal(_p); _lk.copy(c.look); r.worldToLocal(_lk); _d.copy(_lk).sub(_p).normalize();
  const nearLook = (x, z) => Math.hypot(x - _lk.x, z - _lk.z) < 1.6;
  const f = ctx.props.filler, all = ctx.store.fillAll;
  if (all && f.parent) {
    const keep = all.filter((it) => nearLook(it.x, it.z) || !(blocks(it.x, 1.0, it.z, -0.6, 5.0, 0.75, 0.1) || blocks(it.x, 1.8, it.z, -0.6, 5.0, 0.75, 0.1)));
    f.userData.layout(keep); if (ctx.store.fillArgs) f.userData.set(...ctx.store.fillArgs);
  }
  for (const w of ctx.store.crowdAll || []) {
    const o = w.ch.root; if (!o.parent) continue;
    o.getWorldPosition(_q); r.worldToLocal(_q);
    const x = _q.x, z = _q.z, y0 = _q.y;
    o.visible = nearLook(x, z) || !(blocks(x, y0 + 1.0, z, -0.6, 3.2, 0.55, 0.08) || blocks(x, y0 + 1.8, z, -0.6, 3.2, 0.55, 0.08));
  }
}
function fillerSet(ctx, t, o) { ctx.store.fillArgs = [t, o]; ctx.props.filler.userData.set(t, o); }
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
const NUG_STAMP = 'NUGGET:\n1 CHICKEN POWER', NUG_STAMP_O = { y: 0.08, size: 74, fill: '#ffe14a', stroke: '#1d1d22', rot: -0.07 };
const WINNER_O = { y: 0.15, size: 170, fill: '#ffe14a', stroke: '#1d1d22', rot: -0.08 };
const flash = (ctx) => { ctx.fx.overlay('#d89a3a', 0.2); ctx.fx.vignette(0.6); };   // warm flashback grade

function town(ctx, light = 'day', { party = true, glow = 0.85, exposure = null } = {}) {
  const s = ctx.set;
  s.setLighting(light); s.set('partyProps', party); s.set('fireworks', false); s.set('foam', 0);
  s.set('windowGlow', light === 'day' ? 0 : glow); s.set('standsCrowd', false); s.set('crowdMotion', 1);
  s.exposure = exposure ?? (light === 'quiet_night' ? 1.3 : 1.0);
  const L = T(ctx); ctx.store.L = L;
  skyBase(ctx);
  return L;
}
// ─── sky mood (stormy dusk while the egg drops) layered on the preset
const STORM = { z: '#2a2350', m: '#5a3a6a', h: '#ff9a5a', g: '#3a2a3a', s: '#ffb070', fog: '#7a5a7a', hemi: ['#c8a0c0', '#3a2a3a'], dir: '#ffb080' };
const _c = new THREE.Color(), _c2 = new THREE.Color();
function skyBase(ctx) {
  const r = ctx.set.root, sky = r.getObjectByName('sky');
  if (!sky || !sky.material.uniforms) { ctx.store.sky = null; return; }
  const u = sky.material.uniforms, lights = [];
  r.traverse((o) => { if (o.isHemisphereLight) lights.push({ o, c: o.color.clone(), g: o.groundColor.clone(), i: o.intensity }); else if (o.isDirectionalLight) lights.push({ o, c: o.color.clone(), i: o.intensity }); });
  ctx.store.sky = { u, base: { z: u.uZenith.value.clone(), m: u.uMid.value.clone(), h: u.uHorizon.value.clone(), g: u.uGround.value.clone(), s: u.uSunColor.value.clone() }, fog: ctx.set.fog.color.clone(), lights };
}
function skyMood(ctx, k = 0, M = STORM) {
  const S = ctx.store.sky; if (!S) return;
  const { u, base } = S;
  u.uZenith.value.copy(base.z).lerp(_c2.set(M.z), k); u.uMid.value.copy(base.m).lerp(_c2.set(M.m), k);
  u.uHorizon.value.copy(base.h).lerp(_c2.set(M.h), k); u.uGround.value.copy(base.g).lerp(_c2.set(M.g), k);
  u.uSunColor.value.copy(base.s).lerp(_c2.set(M.s), k);
  ctx.set.fog.color.copy(S.fog).lerp(_c2.set(M.fog), k); ctx.set.background.copy(ctx.set.fog.color);
  for (const l of S.lights) {
    if (l.g) { l.o.color.copy(l.c).lerp(_c2.set(M.hemi[0]), k); l.o.groundColor.copy(l.g).lerp(_c2.set(M.hemi[1]), k); l.o.intensity = l.i * (1 - 0.25 * k); }
    else { l.o.color.copy(l.c).lerp(_c2.set(M.dir), k); l.o.intensity = l.i * (1 - 0.35 * k); }
  }
}
function lampFlicker(ctx, k = 1) {
  const lc = ctx.set.root.getObjectByName('lampCores'); if (!lc || !lc.instanceColor) return;
  for (let i = 0; i < lc.count; i++) { const on = hash(Math.floor(ctx.t * 13) + i * 3.3) > 0.45; lc.setColorAt(i, _c.set(on ? '#ffb070' : '#2a1010').multiplyScalar(on ? 2.2 * k : 1)); }
  lc.instanceColor.needsUpdate = true;
}

// ─── dinosaurs, riders, Nugget
function racer(ctx, r) { return ctx.props[r.k][r.i]; }
function ride(ctx, id, seat) { const ch = ctx.cast[id]; ctx.add(ch.root, seat); ch.root.position.set(0, 0, 0); ch.root.rotation.set(0, 0, 0); ch.root.scale.setScalar(1); return ch; }
/** place a racer (+ its rider) at town-local x/z, yaw (default +X) */
function placeRacer(ctx, r, x = r.x, z = r.z, yaw = PI / 2, y = 0) {
  const d = racer(ctx, r); addTo(ctx, d, x, y, z, yaw); d.visible = true;
  if (r.rider) ride(ctx, r.rider, d.userData.seat);
  return d;
}
function riderPose(ch, t, action = 'idle', face = 'grin', params = {}) {
  if (action === 'sit') ch.pose('sit', t, { hands: 'none', ...params }); else ch.pose(action, t, { seated: true, ...params });
  ch.face(face, t + 0.37 * ch.id.length);
}
function nugAt(ctx, x, z, yaw = 0, s = 1, y = 0) { return addTo(ctx, ctx.props.nug, x, y, z, yaw, s); }
/** the kid straddling Nugget (feet flat on the ground either side of her) */
function kidRide(ctx, t, { action = 'idle', face = 'neutral', ft = 0.4, params = {}, nugO = {} } = {}) {
  const me = ctx.cast.me, n = ctx.props.nug;
  n.userData.set(t, { bob: -0.04, ...nugO });
  const p = worldOf(n), yaw = n.rotation.y;
  me.root.position.copy(p).add(V(-Math.sin(yaw) * 0.06, -0.135, -Math.cos(yaw) * 0.06)); me.root.rotation.set(0, yaw, 0);
  me.pose(action, t, { intensity: 0.4, ...params });
  const J = me.joints; J.legL.rotation.z += 0.55; J.legR.rotation.z -= 0.55; J.legL.rotation.x = -0.05; J.legR.rotation.x = -0.05;
  if (J.footL) { J.footL.rotation.z = -0.5; J.footR.rotation.z = 0.5; }
  me.face(face, ft);
}
function kidOn(ctx, x, z, yaw, s = 0.86, y = 0) { nugAt(ctx, x, z, yaw, s, y); ctx.place('me', V(0, 0, 0)); }
function cheerRun(ch, t, speed = 2.1) {
  ch.pose('walk', t, { speed });
  const J = ch.joints; J.armL.rotation.set(-2.8 + 0.2 * Math.sin(t * 12), 0, 0.3); J.armR.rotation.set(-2.8 + 0.2 * Math.sin(t * 12 + 1), 0, -0.3);
  J.foreArmL.rotation.set(-0.2, 0, 0); J.foreArmR.rotation.set(-0.2, 0, 0);
}
/** race distance along +X after the launch (seconds since 'exploded') */
const raceDist = (d) => (d <= 0 ? 0 : d < 0.6 ? 9 * d * d : 3.24 + 10.8 * (d - 0.6));

// ─── crowds
function crowd(ctx, ids, spots) {
  const L = ctx.store.L;
  const out = ids.map((id, i) => { const [x, y, z, yw] = spots[i]; const ch = put(ctx, id, L(x, y, z), L.yaw + yw); return { ch, id, k: i, ph: hash(i * 1.9 + 3) * 3, x, y, z, yw }; });
  (ctx.store.crowdAll ||= []).push(...out);
  return out;
}
function blockFill(x0, x1, z0, z1, n, { seed = 3, faceX = null, faceZ = null, yaw = null, y = 0, avoid = null } = {}) {
  const out = [];
  for (let i = 0; out.length < n && i < n * 6; i++) {
    const x = lerp(x0, x1, hash(i * 1.37 + seed)), z = lerp(z0, z1, hash(i * 2.71 + seed));
    if (avoid && avoid(x, z)) continue;
    if (out.some((q) => Math.hypot(q.x - x, q.z - z) < 0.72)) continue;
    const yw = yaw != null ? yaw : Math.atan2((faceX ?? x) - x, (faceZ ?? z) - z);
    out.push({ x, y, z, yaw: yw + (hash(i * 4.4 + seed) - 0.5) * 0.5, k: i, s: 0.86 + 0.24 * hash(i * 3.3 + seed) });
  }
  return out;
}
function filler(ctx, list) { const f = ctx.props.filler; ctx.add(f, ctx.set.root); f.position.set(0, 0, 0); f.userData.layout(list); ctx.store.fillAll = list; return f; }
function spots(n, { seed = 5, x0, x1, z0, z1, faceX = null, faceZ = null, yaw = null, avoid = null, gap = 1.05 }) {
  const s = [];
  for (let i = 0; s.length < n && i < n * 8; i++) {
    const x = lerp(x0, x1, hash(i * 1.71 + seed)), z = lerp(z0, z1, hash(i * 2.93 + seed));
    if (avoid && avoid(x, z)) continue;
    if (s.some((q) => Math.hypot(q[0] - x, q[2] - z) < gap)) continue;
    const yw = yaw != null ? yaw : Math.atan2((faceX ?? x) - x, (faceZ ?? z) - z);
    s.push([x, 0, z, yw + (hash(i * 3.1 + seed) - 0.5) * 0.5]);
  }
  return s;
}
function animCrowd(list, t, action, face, params = {}) { for (const w of list) { const a = typeof action === 'function' ? action(w) : action; w.ch.pose(a, t + w.ph, params); w.ch.face(typeof face === 'function' ? face(w) : face, t + w.ph); } }

// ─── set dressing
function fenceSet(ctx) {
  const P = ctx.props;
  addTo(ctx, P.fence, FENCE_X, 0, 0, PI / 2);
  const tp = [[-41, -9], [-43, -3.5], [-44.5, 1.5], [-42.5, 6], [-46, -7], [-47.5, 4], [-40.5, 10], [-48.9, 1.5], [-49.6, 0.6]];   // the last two screen the world's clock tower
  P.trees.forEach((tr, i) => addTo(ctx, tr, tp[i][0], 0, tp[i][1], hash(i) * 6));
  const fp = [[-38.6, -11], [-38.4, 9.5], [-39.5, -4.5], [-39.2, 4], [-40, 0]];
  P.ferns.forEach((f, i) => addTo(ctx, f, fp[i][0], 0, fp[i][1], i));
}
function towerSet(ctx, o = {}) { const P = ctx.props; addTo(ctx, P.tower, TOWER.x, 0, TOWER.z, -PI / 2); P.tower.userData.set(ctx.t, o); return P.tower; }
function stageSet(ctx) { addTo(ctx, ctx.props.podium, 50.3, 0.8, 0.0, -PI / 2); }
function startSet(ctx) { addTo(ctx, ctx.props.start, START_X, 0, 0, 0); }
/** all 12 racers at their start spots (+ riders) */
function lineUp(ctx, dx = 0) { return RACERS.map((r) => ({ r, d: placeRacer(ctx, r, r.x + dx, r.z), ch: r.rider ? ctx.cast[r.rider] : null })); }
function stompAll(ctx, list, t, o = {}) {
  list.forEach(({ r, d, ch }, k) => {
    d.userData.set(t + k * 0.37, { walk: o.walk ?? 0.12, gait: 7, headPitch: 0.05 * Math.sin(t * 3 + k), jaw: o.jaw ?? 0, ...(o.per ? o.per(r, k) : {}) });
    if (ch) riderPose(ch, t + k, o.rAction ?? 'idle', o.rFace ?? 'determined');
  });
}
function bellGlint(ctx, pos, k, size = 3) { const g = ctx.props.glint; if (g.parent !== ctx.scene) ctx.add(g); g.position.copy(pos); const s = size * (0.6 + 0.4 * k); g.scale.set(s, s, 1); g.material.opacity = k; }

// ─── pile-up (b14–b17): the racers heaped at PILE, rolled over, legs up
const PILE_LAYOUT = [
  // racer index, dx, y, dz, yaw, roll, pitch
  [3, -1.6, 0.0, 1.8, 0.6, 1.4, 0.0],
  [1, 0.4, 0.0, -2.4, -0.4, -1.5, 0.1],
  [2, -2.6, 0.2, -0.6, 2.2, 1.1, 0.3],
  [4, 2.4, 0.0, 1.6, 1.2, -1.3, 0.0],
  [0, 0.6, 1.4, 0.2, -1.0, 0.9, 0.4],
  [6, -0.6, 2.2, -0.6, 2.8, -1.0, -0.3],
  [7, 1.8, 0.4, -0.8, 0.3, 1.6, 0.0],
  [8, -3.4, 0.0, 2.2, -0.8, 0.0, -0.4],
  [9, 3.0, 0.0, -2.9, 1.9, 1.2, 0.2],
  [10, -0.2, 0.0, 3.2, 2.5, -1.4, 0.0],
  [5, 3.8, 0.0, 0.2, -2.0, 0.8, 0.0],
  [11, -4.5, 0.0, -2.6, 0.4, 0.98, 0.0],
];
function pileUp(ctx) {
  return PILE_LAYOUT.map(([ri, dx, y, dz, yaw, roll, pitch], k) => {
    const r = RACERS[ri], d = racer(ctx, r);
    addTo(ctx, d, PILE.x + dx, r.k === 'ln' ? 0 : y, PILE.z + dz, yaw);
    if (r.k !== 'ln') { d.rotation.order = 'YXZ'; d.rotation.set(pitch, yaw, roll); }
    const ch = r.rider && r.k !== 'ln' ? ride(ctx, r.rider, d.userData.seat) : null;
    return { r, d, ch, k };
  });
}
function animPile(ctx, list, t, kick = 1, o = {}) {
  for (const { r, d, ch, k } of list) {
    if (r.k === 'ln') d.userData.set(t, { tip: 0.98, kick: 0.3 * kick, neckBend: 0.9, lid: 0.5, pupil: 0.6, ...o });
    else d.userData.set(t + k, { kick: kick * 0.7, jaw: 0.6, pupil: 0.55, lid: 0.15, ...o });
    if (ch) riderPose(ch, t + k, 'stunned', k % 2 ? 'sweat' : 'shocked');
  }
}
function pileRex(ctx) { addTo(ctx, ctx.props.rex, PILE.x + 1.0, 1.5, PILE.z + 0.2, -PI / 2 - 0.2, 0.8); }
function mayorOnRex(ctx, t) { const may = ctx.cast.mayor; may.root.position.copy(worldOf(ctx.props.rex.userData.parts.head, 0, 2.0, 1.2)); may.root.rotation.set(0, -PI / 2 - 0.2, 0); may.pose('stunned', t); may.face('sweat', 0.4); }
function keyLight(ctx, pos, k) { const l = ctx.props.key; if (l.parent !== ctx.scene) ctx.add(l); l.position.copy(pos); l.intensity = k; l.color.set('#ffe6a0'); l.distance = 40; }
function eggSprite(ctx, k) {
  const g = ctx.props.eggGlow; if (g.parent !== ctx.scene) ctx.add(g);
  const p = crackPt(ctx.store.L, 1.05);
  g.position.copy(p); const s = 10 + 6 * k; g.scale.set(s, s * 0.6, 1); g.material.opacity = clamp(0.55 * k, 0, 0.9);
}
function nightEgg(ctx) {
  town(ctx, 'quiet_night', { glow: 0.85, party: false });
  addTo(ctx, ctx.props.egg, EGG.x, 0, EGG.z, CR_YAW, EGG_S); ctx.props.egg.visible = true;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody rides a dinosaur to school."  — low hero angle: Maya's triceratops strides at us
  {
    name: 'school run', start: 0, set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      const P = ctx.props;
      ctx.store.parade = [
        { d: P.tri[0], rider: 'maya', x0: -3.5, z: 0.9, v: -1.1 },
        { d: P.rap[0], rider: 'bigm', x0: 0.5, z: -2.2, v: -1.4 },
        { d: P.stego[1], rider: R[5], x0: 6.0, z: 2.6, v: -1.2 },
        { d: P.ln[0], rider: 'mail', x0: 9.0, z: -1.2, v: -1.0 },
      ];
      ctx.store.parade.forEach((p) => { addTo(ctx, p.d, p.x0, 0, p.z, -PI / 2); ride(ctx, p.rider, p.d.userData.seat); });
      ctx.store.walkers = crowd(ctx, [X[13], X[14]], [[-17, 0.12, 6.2, PI / 2], [-12.5, 0.12, -6.3, PI / 2]]);
      ctx.add(P.motes);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      ctx.store.parade.forEach((p, k) => { p.d.position.x = p.x0 + p.v * t; p.d.userData.set(t + k, { walk: 0.8, gait: 5.5 }); riderPose(ctx.cast[p.rider], t + k, k === 0 ? 'wave' : 'idle', 'grin'); });
      ctx.store.walkers.forEach((w) => { w.ch.root.position.copy(L(w.x + 0.9 * t, 0.12, w.z)); w.ch.pose('walk', t + w.ph); w.ch.face('smile', t); });
      const c = moveCam(ctx, { pos: L(-15.5, 0.6, 3.2), look: L(-4, 3.6, 0.2), fov: 60 }, { pos: L(-14.8, 0.8, 3.0), look: L(-4.5, 4.4, 0.2), fov: 58 }, ease.inOutSine(clamp(lt / 1.9, 0, 1)));
      const m = ctx.props.motes; m.position.copy(c.pos.clone().lerp(c.look, 0.4)); m.userData.set(t, 0.5);
      tag(ctx, 'IN THIS TOWN', 0.25, Infinity, { y: 0.12, size: 96, fill: '#ffe14a', bg: 'rgba(20,20,40,0.85)' });
    },
  },
  // ── "…a dinosaur to school"  — crane up the long-neck: its head bobs above the rooftops
  {
    name: 'over the roofs', start: 'b01.w6-0.08', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      const P = ctx.props;
      addTo(ctx, P.ln[0], -14, 0, -1.2, -PI / 2); ride(ctx, 'mail', P.ln[0].userData.seat);
      addTo(ctx, P.rap[1], -9, 0, 2.2, -PI / 2); ride(ctx, R[0], P.rap[1].userData.seat);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      P.ln[0].position.x = -14 - 1.0 * lt; P.ln[0].userData.set(t, { walk: 0.8, gait: 4.5, headYaw: 0.2 * Math.sin(t * 2) });
      P.rap[1].position.x = -9 - 1.6 * lt; P.rap[1].userData.set(t, { walk: 0.9, gait: 7 });
      riderPose(ctx.cast.mail, t, 'wave', 'grin'); riderPose(ctx.cast[R[0]], t, 'cheer', 'grin');
      const hp = worldOf(P.ln[0].userData.parts.head, 0, 0.3, 0.3);
      moveCam(ctx, { pos: L(4, 1.2, 5.5), look: L(-12, 3.6, -1), fov: 50 }, { pos: L(2, 5.5, 6), look: hp.clone().add(up(-1.5)), fov: 50 }, ease.inOutCubic(clamp(lt / 1.25, 0, 1)));
      tag(ctx, 'IN THIS TOWN', 0, Infinity, { y: 0.12, size: 96, fill: '#ffe14a', bg: 'rgba(20,20,40,0.85)' });
    },
  },
  // ── "Except me." → b02 "I ride Nugget…"  — the kid alone on the pavement; the camera tilts down: he's on a chicken
  {
    name: 'except me', start: 'b01.w9-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props;
      kidOn(ctx, -8, 5.4, PI / 2, 0.86, 0.12);
      addTo(ctx, P.tri[1], -16, 0, 1.0, -PI / 2); ride(ctx, R[1], P.tri[1].userData.seat);
      addTo(ctx, P.ln[0], -20, 0, -1.2, -PI / 2); ride(ctx, 'mail', P.ln[0].userData.seat);
      addTo(ctx, P.rap[1], -13, 0, -2.0, -PI / 2); ride(ctx, R[0], P.rap[1].userData.seat);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      [P.tri[1], P.ln[0], P.rap[1]].forEach((d, k) => d.userData.set(t + k, { walk: 0.8, gait: 5.5 }));
      P.tri[1].position.x = -16 - 1.2 * lt; P.ln[0].position.x = -20 - 1.0 * lt; P.rap[1].position.x = -13 - 1.5 * lt;
      riderPose(ctx.cast[R[1]], t, 'idle', 'grin'); riderPose(ctx.cast.mail, t, 'idle', 'grin'); riderPose(ctx.cast[R[0]], t, 'idle', 'grin');
      const tn = ctx.time('b02.w2');
      kidRide(ctx, t, { action: 'idle', face: t < tn ? 'sad' : 'smile', ft: 0.3, params: { headYaw: t < ctx.time('b02') ? -0.35 : 0 } });
      const f = humanFace(ctx.cast.me);
      const a = faceCam(ctx.cast.me, 2.6, 1.6, 0.45, 36, -0.1);
      const b = { pos: L(-3.9, 1.0, 4.3), look: L(-8, 0.72, 5.3), fov: 46 };
      moveCam(ctx, a, b, ease.inOutCubic(clamp((t - ctx.time('b02') + 0.05) / 1.1, 0, 1)));
      tag(ctx, 'EXCEPT ME', ctx.time('b01.w9'), ctx.time('b02') - 0.05, { y: 0.07, size: 70, bg: 'rgba(200,0,40,0.92)' });
      stamp(ctx, NUG_STAMP, ctx.time('b02.w3'), NUG_STAMP_O);
    },
  },
  // ── "Nugget is a chicken."  — close: Nugget blinks at the camera
  {
    name: 'nugget blinks', start: 'chicken-0.08', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      kidOn(ctx, -8, 5.4, PI / 2, 0.86, 0.12);
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props;
      const tb = ctx.time('chicken') + 0.25;
      kidRide(ctx, t, { face: 'smug', nugO: { lid: (t > tb && t < tb + 0.14) ? 1 : 0, lookX: -0.25, headYaw: -0.45 } });
      const hp = worldOf(P.nug.userData.parts.head, 0, 0.15, 0.1);
      moveCam(ctx, { pos: hp.clone().add(V(1.5, 0.05, -0.8)), look: hp.clone().add(up(-0.03)), fov: 40 }, { pos: hp.clone().add(V(1.3, 0.04, -0.7)), look: hp.clone().add(up(-0.03)), fov: 38 }, lt / 0.6);
      stamp(ctx, NUG_STAMP, ctx.time('b02.w3'), NUG_STAMP_O);
    },
  },
  // ── b03 HUSS ×3 — the kid HUSSes on Nugget; she flaps; the dinosaurs behind stare blankly
  ...[0, 1, 2].map((i) => ({
    name: `nugget huss #${i + 1}`, start: H('b03', i), set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      const P = ctx.props;
      kidOn(ctx, -8, 5.4, PI / 2, 0.86, 0.12);
      addTo(ctx, P.tri[0], -14.5, 0, 1.8, yawTo(-14.5, 1.8, -8, 5.4)); ride(ctx, 'maya', P.tri[0].userData.seat);
      addTo(ctx, P.rap[0], -12.2, 0, -1.2, yawTo(-12.2, -1.2, -8, 5.4)); ride(ctx, 'bigm', P.rap[0].userData.seat);
      addTo(ctx, P.ln[0], -21, 0, -0.5, yawTo(-21, -0.5, -8, 5.4)); ride(ctx, 'mail', P.ln[0].userData.seat);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, hits = hussHits(ctx, 'b03');
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      kidRide(ctx, t, { action: 'cheer', face: dh < 0.22 ? 'huss' : 'determined', ft: 0.4, nugO: { flap: 1, beak: 0.6, lid: 0 } });
      const me2 = L(-8, 1.5, 5.4);
      P.tri[0].userData.set(t, { lid: 0.35 }); P.rap[0].userData.set(t, { lid: 0.35 }); P.ln[0].userData.set(t, { lid: 0.35, headPitch: 0.3 });
      riderPose(ctx.cast.maya, t, 'idle', 'neutral', { lookAt: me2 }); riderPose(ctx.cast.bigm, t, 'crossArms', 'neutral', { lookAt: me2 }); riderPose(ctx.cast.mail, t, 'idle', 'neutral', { lookAt: me2 });
      const cams = [
        { pos: L(-3.6, 0.6, 6.2), look: L(-9.8, 1.7, 4.0), fov: 54 },
        faceCam(me, 2.3, 0.3, 0.42, 34, -0.15),
        { pos: L(-6.2, 1.0, 7.1), look: L(-12.5, 2.3, 0.8), fov: 52 },
      ];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.12, 0.2);
    },
  })),
  // ── b04 "Ten years ago, the dinosaur park's fence fell over…"  — warm flashback: the plank wall crashes down
  {
    name: 'fence falls', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day', { party: false }); fenceSet(ctx);
      const P = ctx.props;
      addTo(ctx, P.ln[0], -45, 0, -1.5, PI / 2 - 0.2);
      addTo(ctx, P.tri[2], -40.0, 0, 2.6, PI / 2 + 0.2); addTo(ctx, P.rap[3], -39.5, 0, -2.8, PI / 2);
      addTo(ctx, P.dustF, FENCE_X + 3.0, 0, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tf = ctx.time('fence') - 0.25;
      const fk = (d) => { const u = clamp((t - tf - d) / 0.42, 0, 1); return u * u; };
      P.fence.userData.set(t, { fallL: fk(0.05), fallC: fk(0), fallR: fk(0.1) });
      const ow = Math.max(0, t - tf - 0.3), out = Math.min(ow, 2.2);   // they stroll out through the settling dust
      P.ln[0].userData.set(t, { walk: ow > 0 ? 0.7 : 0, gait: 4, headPitch: 0.1 }); P.ln[0].position.x = -45 + 3.5 * out;
      P.tri[2].userData.set(t, { walk: ow > 0 ? 1 : 0, run: ow > 0 ? 1 : 0, gait: 9, jaw: 0.5 }); P.tri[2].position.x = -40.0 + 5.2 * out;
      P.rap[3].userData.set(t, { walk: ow > 0 ? 1 : 0, run: ow > 0 ? 1 : 0, gait: 10, pupil: 0.8, jaw: 0.6 }); P.rap[3].position.x = -39.5 + 6.2 * out;
      P.dustF.userData.set(t - tf - 0.4);
      moveCam(ctx, { pos: L(-11.0, 1.5, 2.2), look: L(-37, 4.6, 0.2), fov: 54 }, { pos: L(-12.5, 1.4, 2.2), look: L(-37, 4.2, 0.2), fov: 52 }, lt / 2.6);
      shakeOn(ctx, [tf + 0.42], 0.9, 0.5, 3); pop(ctx, tf + 0.42, 0.12, '#fff2d0', 0.35);
      flash(ctx);
      tag(ctx, '10 YEARS AGO', ctx.time('b04') + 0.02, Infinity, { y: 0.12, size: 84, fill: '#ffffff', bg: 'rgba(120,70,20,0.88)' });
    },
  },
  // ── "…and they all moved into town."  — dinosaurs stroll down main street; the long-neck peeks into a window
  {
    name: 'moved in', start: 'b04.w9-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day', { party: false });
      const P = ctx.props;
      let best = null;
      for (let j = 0; j < 8; j++) { let a = null; try { a = ctx.anchor(`house.1.window.${j}`); } catch (e) { a = null; } if (!a) continue; const p = worldOf(a); if (!best || p.y > best.p.y + 0.5 || (Math.abs(p.y - best.p.y) < 0.5 && Math.abs(p.x + 15) < Math.abs(best.p.x + 15))) best = { a, p }; }
      ctx.store.win = best ? best.p : L(-15, 4.4, -10.25);
      addTo(ctx, P.ln[0], ctx.store.win.x + 0.3, 0, 0.2, PI);
      addTo(ctx, P.tri[2], -13.0, 0, -3.6, PI / 2); addTo(ctx, P.rap[3], -11.5, 0, -1.6, PI / 2); addTo(ctx, P.stego[2], -19.5, 0, 2.6, PI / 2);
      ctx.store.peek = crowd(ctx, [X[15]], [[-11.5, 0.12, -6.2, -0.6]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, w = ctx.store.win;
      P.ln[0].userData.set(t, { neckBend: 0.62, headYaw: 0.08 * Math.sin(t * 2), lookY: 0.1, walk: 0 });
      P.tri[2].position.x = -13.0 + 1.8 * lt; P.tri[2].userData.set(t, { walk: 0.8 }); P.rap[3].position.x = -11.5 + 2.2 * lt; P.rap[3].userData.set(t, { walk: 0.9, gait: 8 });
      P.stego[2].position.x = -19.5 + 1.5 * lt; P.stego[2].userData.set(t, { walk: 0.8 });
      ctx.store.peek[0].ch.pose('point', t); ctx.store.peek[0].ch.face('shocked', 0.4);
      const wl = toLocal(ctx, w);
      moveCam(ctx, { pos: L(wl.x + 9.5, 2.4, 7.0), look: L(wl.x + 0.4, wl.y - 2.6, wl.z + 2.6), fov: 50 }, { pos: L(wl.x + 9.1, 2.5, 7.1), look: L(wl.x + 0.4, wl.y - 2.5, wl.z + 2.6), fov: 48 }, lt / 1.6);
      flash(ctx);
      tag(ctx, '10 YEARS AGO', 0, Infinity, { y: 0.12, size: 84, fill: '#ffffff', bg: 'rgba(120,70,20,0.88)' });
    },
  },
  // ── b05 "Maya rides a triceratops."  — name card
  {
    name: 'card maya', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      addTo(ctx, ctx.props.tri[0], -10, 0, 0.8, 1.25); ride(ctx, 'maya', ctx.props.tri[0].userData.seat);
      ctx.add(ctx.props.motes);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, d = ctx.props.tri[0];
      d.userData.set(t, { walk: 0.25, gait: 4, headYaw: -0.2, jaw: 0.3 + 0.2 * Math.sin(t * 3) });
      riderPose(ctx.cast.maya, t, 'wave', 'grin');
      const f = humanFace(ctx.cast.maya);
      moveCam(ctx, { pos: L(-7.0, 3.3, 6.4), look: f.clone().add(V(1.0, -0.75, 0.2)), fov: 58 }, { pos: L(-7.3, 3.3, 6.2), look: f.clone().add(V(1.0, -0.75, 0.2)), fov: 56 }, lt / 1.9);
      const m = ctx.props.motes; m.position.copy(f); m.userData.set(t, 0.5);
      tag(ctx, 'MAYA', ctx.time('b05') + 0.02, Infinity, { y: 0.11, size: 110, bg: 'rgba(255,79,163,0.92)' });
      tag(ctx, 'TRICERATOPS', ctx.time('b05.w3'), Infinity, { y: 0.2, size: 64, bg: 'rgba(47,196,178,0.92)', rot: 0.02 });
    },
  },
  // ── "Big Marcus has a raptor named Sprinkles."  — he rears up on her
  {
    name: 'card marcus', start: 'b05.w4-0.08', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      addTo(ctx, ctx.props.rap[0], -12, 0, -0.5, PI / 2 + 0.5); ride(ctx, 'bigm', ctx.props.rap[0].userData.seat);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, d = ctx.props.rap[0], tr = ctx.time('b05.w8');
      const rear = 0.55 * ease.outBack(clamp((t - tr + 0.25) / 0.45, 0, 1)) * (1 - 0.3 * clamp((t - tr - 0.9) / 0.5, 0, 1));
      d.userData.set(t, { rear, jaw: 0.3 + 0.6 * rear, lookX: 0.3, headPitch: -0.4 * rear });
      riderPose(ctx.cast.bigm, t, 'crossArms', 'smug');
      const fm = humanFace(ctx.cast.bigm);
      moveCam(ctx, { pos: L(-11.0, 2.6, -4.8), look: fm.clone().add(up(-0.45)), fov: 60 }, { pos: L(-11.2, 2.7, -5.0), look: fm.clone().add(up(-0.45)), fov: 60 }, lt / 2.2);
      shakeOn(ctx, [tr], 0.25, 0.3, 4);
      tag(ctx, 'BIG MARCUS', ctx.time('b05.w4') + 0.02, Infinity, { y: 0.11, size: 100, bg: 'rgba(29,29,34,0.92)' });
      tag(ctx, 'SPRINKLES (RAPTOR)', ctx.time('b05.w10'), Infinity, { y: 0.2, size: 60, bg: 'rgba(138,92,255,0.92)', rot: 0.02 });
    },
  },
  // ── "The mailman rides a long-neck and delivers to the roof."  — letters drop down a chimney
  {
    name: 'card mailman', start: 'b05.w11-0.08', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      const P = ctx.props;
      addTo(ctx, P.chimney, -13.0, 8.7, -12.2, 0);
      addTo(ctx, P.ln[0], -13.6, 0, -2.6, PI); ride(ctx, 'mail', P.ln[0].userData.seat);
      ctx.add(P.env); ctx.add(P.motes);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, td = ctx.time('roof');
      P.ln[0].userData.set(t, { headPitch: 0.35, neckBend: 0.08, sway: 0.3 });
      const mail = ctx.cast.mail;
      mail.pose('sit', t, { hands: 'none', intensity: 0.3 }); mail.face(t > td ? 'grin' : 'smile', 0.5);
      if (t > td - 0.3) { mail.joints.armR.rotation.set(-1.4, 0, 0.1); mail.joints.foreArmR.rotation.set(-0.3, 0, 0); }
      const hand = worldOf(mail.joints.handR || mail.joints.foreArmR), ch = L(-13.0, 10.0, -12.2);
      P.env.userData.list.forEach((e, i) => {
        const u = (t - td - i * 0.14) / 0.55;
        e.visible = u > -0.3 && u < 1;
        const uu = clamp(u, 0, 1);
        e.position.copy(hand.clone().lerp(ch, uu)).add(up(0.4 * Math.sin(PI * uu)));
        e.rotation.set(1.2 + i + t * 3, t * 2 + i, 0.3 * i);
      });
      const hp = worldOf(P.ln[0].userData.parts.head);
      moveCam(ctx, { pos: L(-10.2, 10.3, -6.1), look: hp.clone().add(up(0.5)), fov: 50 }, { pos: L(-10.5, 10.4, -6.4), look: hp.clone().add(up(0.5)), fov: 48 }, lt / 2.5);
      const m = P.motes; m.position.copy(hp); m.userData.set(t, 0.4);
      tag(ctx, 'THE MAILMAN', ctx.time('b05.w11') + 0.05, Infinity, { y: 0.08, size: 96, bg: 'rgba(47,111,192,0.92)' });
      tag(ctx, 'LONG-NECK', ctx.time('mail') + 0.8, Infinity, { y: 0.15, size: 60, bg: 'rgba(240,180,74,0.95)', rot: 0.02 });
    },
  },
  // ── b06 "And every single day, they all laugh at me."  — over the kid's shoulder: the square points and laughs
  {
    name: 'they laugh', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      const P = ctx.props;
      kidOn(ctx, 35, 3, PI / 2, 0.86);
      ctx.store.cr = crowd(ctx, X.slice(0, 10), spots(10, { seed: 6, x0: 39.5, x1: 44.5, z0: -3.5, z1: 6.5, faceX: 35, faceZ: 3 }));
      addTo(ctx, P.tri[1], 43.5, 0, -4.5, -PI / 2 - 0.45); ride(ctx, R[1], P.tri[1].userData.seat);
      addTo(ctx, P.rap[2], 46.5, 0, 2.5, -PI / 2 + 0.1); ride(ctx, R[7], P.rap[2].userData.seat);
      filler(ctx, blockFill(45, 49, -6, 8, 26, { seed: 4, faceX: 35, faceZ: 3 }));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      kidRide(ctx, t, { face: 'sad', nugO: { headPitch: 0.6, lookY: -0.6 } });
      animCrowd(ctx.store.cr, t, (w) => (w.k % 2 ? 'pointLaugh' : 'laugh'), 'laugh');
      P.tri[1].userData.set(t, { jaw: 0.6 + 0.3 * Math.sin(t * 16), headPitch: -0.2 + 0.08 * Math.sin(t * 16) });
      P.rap[2].userData.set(t, { jaw: 0.7 + 0.3 * Math.sin(t * 15), rear: 0.25 + 0.08 * Math.sin(t * 15) });
      riderPose(ctx.cast[R[1]], t, 'pointLaugh', 'laugh'); riderPose(ctx.cast[R[7]], t, 'laugh', 'laugh');
      fillerSet(ctx, t, { arms: 'cheer', bounce: 0.7, speed: 1.4 });
      moveCam(ctx, { pos: L(33.0, 2.05, 4.45), look: L(42, 1.9, 1.5), fov: 52 }, { pos: L(33.4, 2.0, 4.3), look: L(42, 1.9, 1.5), fov: 48 }, lt / 1.6);
    },
  },
  {
    name: 'sad kid', start: 'b06.w6-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      kidOn(ctx, 35, 3, PI / 2, 0.86);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      kidRide(ctx, t, { face: 'sad', params: { headPitch: 0.15 }, nugO: { headPitch: 0.7, lookY: -0.7, lid: 0.25 } });
      moveCam(ctx, faceCam(me, 2.6, -0.4, 0.5, 38, -0.25), faceCam(me, 2.2, -0.35, 0.5, 36, -0.25), lt / 0.9);
    },
  },
  // ── b07 "Then came the Great Dino Race."  — the banner, the mayor on the stage, the crowd cheering
  {
    name: 'great dino race', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); stageSet(ctx); towerSet(ctx);
      put(ctx, 'mayor', L(49.6, 0.8, -1.6), -PI / 2);
      ctx.store.cr = crowd(ctx, X.slice(0, 8), spots(8, { seed: 9, x0: 41, x1: 46, z0: -5, z1: 5, faceX: 52, faceZ: 0, avoid: (x, z) => Math.abs(z) < 1.2 }));
      filler(ctx, blockFill(34, 41, -8, 8, 50, { seed: 7, faceX: 52, faceZ: 0, avoid: (x, z) => Math.abs(z) < 1.2 }));
      const P = ctx.props; addTo(ctx, P.confetti.root, 46, 0, 0); ctx.add(P.sparkles);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tr = ctx.time('b07.w5');
      ctx.cast.mayor.pose(t > tr ? 'cheer' : 'wave', t); ctx.cast.mayor.face('grin', t);
      animCrowd(ctx.store.cr, t, 'cheer', 'grin');
      fillerSet(ctx, t, { arms: 'cheer', bounce: 0.8, speed: 1.2 });
      P.confetti.update?.(t - tr + 0.2);
      moveCam(ctx, { pos: L(39.0, 1.8, 0.2), look: L(55, 2.4, -0.4), fov: 52 }, { pos: L(43.6, 1.7, 0.2), look: L(55, 2.2, -0.6), fov: 50 }, ease.inOutSine(clamp(lt / 1.8, 0, 1)));
      P.sparkles.position.copy(L(48, 4, 0)); P.sparkles.userData.set(t, 0.6);
    },
  },
  // ── "First one to ring the clock tower bell wins."  — tilt up the tower to the glinting gold bell
  {
    name: 'the bell', start: 'b07.w6-0.1', set: 'town',
    setup(ctx) { town(ctx, 'day'); stageSet(ctx); },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, tb = ctx.time('b07.w13');
      const tw = towerSet(ctx, { swing: 0.06 * Math.sin(t * 2.2), glint: hitPulse([tb], t, 0.5) * 0.8 });
      const bp = tw.userData.bellWorld(-0.9);
      const u = ease.inOutCubic(clamp(lt / 1.5, 0, 1));
      moveCam(ctx, { pos: L(47.5, 2.6, 4.0), look: L(66, 7.0, -2), fov: 54 }, { pos: L(48.0, 3.0, 3.8), look: bp, fov: 24 }, u);
      bellGlint(ctx, bp.clone().add(V(-0.7, -0.2, 0.6)), clamp(hitPulse([tb], t, 0.35) * 1.4, 0, 1), 4);
      tag(ctx, 'FINISH LINE: THE BELL', ctx.time('b07.w9'), Infinity, { y: 0.12, size: 74, bg: 'rgba(200,140,0,0.92)' });
    },
  },
  // ── b08 "I signed up Nugget."  — at the stage: the kid signs the mayor's clipboard, Nugget tucked under his arm
  {
    name: 'sign up', start: 'b08-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); stageSet(ctx);
      put(ctx, 'mayor', L(49.1, 0, 1.45), -PI / 2 + 0.5);
      put(ctx, 'me', L(47.7, 0, 1.45), PI / 2 - 0.45);
      const P = ctx.props;
      ctx.add(P.clip, ctx.set.root); P.clip.scale.setScalar(1.25);
      ctx.add(P.pen, ctx.set.root);
      ctx.add(P.nug, ctx.cast.me.joints.torso); P.nug.position.set(0.42, 0.06, 0.02); P.nug.rotation.set(0, 0.2, 0); P.nug.scale.setScalar(0.42);
      ctx.store.cr = crowd(ctx, X.slice(10, 14), [[44.5, 0, 4.5, PI / 2], [44, 0, 3.0, PI / 2 + 0.3], [45.5, 0, 5.5, PI / 2 + 0.5], [43.5, 0, 6.5, PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, may = ctx.cast.mayor;
      may.pose('idle', t, { intensity: 0.3 }); may.joints.armR.rotation.set(-1.15, 0, 0.25); may.joints.foreArmR.rotation.set(-0.5, 0, 0); may.face('smug', 0.5);
      me.pose('idle', t, { intensity: 0.4, headPitch: 0.3 });
      me.joints.armL.rotation.set(-0.35, 0, 0.55); me.joints.foreArmL.rotation.set(-1.3, 0, 0);
      const sc = Math.sin(t * 15), sc2 = Math.sin(t * 9.3);
      me.joints.armR.rotation.set(-1.05 + 0.06 * sc2, 0, -0.35); me.joints.foreArmR.rotation.set(-0.55 + 0.08 * sc, 0, 0);
      me.face(t > ctx.time('b08.w3') ? 'smile' : 'determined', 0.4);
      P.nug.userData.set(t, { lid: 0.15, lookX: 0.4 });
      animCrowd(ctx.store.cr, t, 'idle', 'smile');
      // the clipboard in the mayor's hand, sheet turned to the kid (and the camera); the kid scribbles on it
      const hm = worldOf(may.joints.handR || may.joints.foreArmR), cp = hm.clone().add(V(0, 0.12, 0)).lerp(L(48.4, hm.y + 0.12, 1.45), 0.25);
      P.clip.position.copy(toLocal(ctx, cp)); P.clip.lookAt(L(47.2, cp.y + 0.9, 4.6));
      const sheetN = V(0, 0, 1).applyQuaternion(P.clip.getWorldQuaternion(new THREE.Quaternion()));
      const pp = worldOf(P.clip, 0.04 * sc - 0.02, 0.03 * sc2 - 0.02, 0.12);
      P.pen.position.copy(toLocal(ctx, pp)); P.pen.lookAt(pp.clone().add(sheetN).add(up(1.2))); P.pen.rotateX(PI / 2);
      moveCam(ctx, { pos: L(48.4, 1.5, 4.9), look: L(48.4, 1.1, 1.45), fov: 46 }, { pos: L(48.3, 1.45, 4.6), look: L(48.4, 1.1, 1.45), fov: 45 }, lt / 1.3);
    },
  },
  // ── "The whole town laughed so hard…"  — the square erupts
  {
    name: 'town erupts', start: 'b08.w4-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      ctx.store.cr = crowd(ctx, X.slice(0, 12), spots(12, { seed: 12, x0: 37, x1: 44.5, z0: -6.5, z1: 4, faceX: 49, faceZ: -1.5 }));
      filler(ctx, blockFill(31, 37.5, -9, 8, 45, { seed: 8, faceX: 49, faceZ: -1.5 }));
      const P = ctx.props;
      addTo(ctx, P.tri[0], 40.5, 0, 5.8, PI / 2 - 0.2); ride(ctx, 'maya', P.tri[0].userData.seat);
      addTo(ctx, P.rap[0], 36.5, 0, -6.5, PI / 2 + 0.6); ride(ctx, 'bigm', P.rap[0].userData.seat);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      animCrowd(ctx.store.cr, t, (w) => (w.k % 3 ? 'laugh' : 'pointLaugh'), 'laugh');
      fillerSet(ctx, t, { arms: 'cheer', bounce: 0.9, speed: 1.6 });
      P.tri[0].userData.set(t, { jaw: 0.7 + 0.3 * Math.sin(t * 17), headPitch: -0.25 + 0.1 * Math.sin(t * 17) });
      P.rap[0].userData.set(t, { jaw: 0.8 + 0.2 * Math.sin(t * 15), rear: 0.3 + 0.1 * Math.sin(t * 15) });
      riderPose(ctx.cast.maya, t, 'laugh', 'laugh'); riderPose(ctx.cast.bigm, t, 'pointLaugh', 'laugh');
      moveCam(ctx, { pos: L(48.0, 2.2, -1.0), look: L(39, 2.0, -1.2), fov: 56 }, { pos: L(48.5, 2.6, -1.2), look: L(39, 2.0, -1.2), fov: 60 }, lt / 1.5);
      ctx.cam.shake(0.12, t, 5);
    },
  },
  // ── "…the long-neck fell over."  — it laughs so hard it tips onto a house: CRUNCH
  {
    name: 'long-neck falls', start: 'fell-0.15', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      const P = ctx.props;
      addTo(ctx, P.ln[0], 50, 0, -13.5, PI / 2);
      ctx.store.cr = crowd(ctx, X.slice(0, 6), spots(6, { seed: 3, x0: 42, x1: 46, z0: -4, z1: 1, faceX: 50, faceZ: -13 }));
      addTo(ctx, P.dust3, 49.5, 7, -23.5); addTo(ctx, P.dust2, 50, 0, -15);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tf = ctx.time('b08.w12');
      const u = clamp((t - (tf - 0.45)) / 0.45, 0, 1), tip = 0.57 * u * u * u;
      P.ln[0].userData.set(t, { laugh: 1 - u * 0.6, jaw: 0.8, tip, kick: tip > 0.5 ? 0.6 : 0, lid: u > 0.95 ? 0.5 : 0, pupil: u > 0.95 ? 0.6 : 1 });
      animCrowd(ctx.store.cr, t, t > tf + 0.1 ? 'surprised' : 'laugh', t > tf + 0.1 ? 'shocked' : 'laugh');
      P.dust3.userData.set(t - tf); P.dust2.userData.set(t - tf + 0.1);
      moveCam(ctx, { pos: L(59.0, 1.6, -7.6), look: L(52.5, 10.5, -15), fov: 70 }, { pos: L(59.3, 1.7, -7.9), look: L(53.5, 5.6, -19), fov: 64 }, lt / 1.3);
      shakeOn(ctx, [tf], 1.0, 0.5, 9); pop(ctx, tf, 0.1, '#ffffff', 0.35);
    },
  },
  // ── b09 HUSS ×3 — arms crossed, Nugget sitting on his head; the long-neck lies across a squashed house behind
  ...[0, 1, 2].map((i) => ({
    name: `crossarms huss #${i + 1}`, start: H('b09', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props;
      addTo(ctx, P.ln[0], 50, 0, -13.5, PI / 2);
      put(ctx, 'me', L(43.5, 0, -2.5), yawTo(43.5, -2.5, 41.2, 0.6));
      ctx.add(P.nug, ctx.set.root); P.nug.scale.setScalar(0.42);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, hits = hussHits(ctx, 'b09');
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      P.ln[0].userData.set(t, { tip: 0.57, kick: 0.5, lid: 0.55, pupil: 0.6, jaw: 0.5 }); if (i === 0)
      me.pose('crossArms', t); me.face(dh < 0.22 ? 'huss' : 'determined', t);
      P.nug.position.copy(toLocal(ctx, headTop(me, 0.6))); P.nug.rotation.set(0, me.root.rotation.y, 0);
      P.nug.userData.set(t, { sit: 1, smug: 1, flap: dh < 0.2 ? 0.6 : 0 });
      const cams = [
        { pos: L(41.2, 0.45, 0.6), look: L(45.6, 1.15, -6.6), fov: 60 },   // kid left, the long-neck sprawled on the house upper right
        faceCam(me, 3.0, 0.3, 0.15, 40),
        faceCam(me, 3.6, -0.9, 0.45, 54, -1.0),
      ];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.12, 0.2);
    },
  })),
  // ── b10 "Three."  — the start line: twelve dinosaurs in a row… and tiny Nugget at the end
  {
    name: 'start line', start: 'b10-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); startSet(ctx);
      ctx.store.line = lineUp(ctx);
      kidOn(ctx, NUG.x, NUG.z, PI / 2, 0.86, 0.12);
      ctx.store.fans = crowd(ctx, X.slice(13, 17), [[15.5, 0.12, -6.4, PI], [17, 0.12, 6.4, -PI / 2 - 0.5], [16.5, 0.12, -6.9, PI - 0.3], [18.5, 0.12, -6.3, -PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      stompAll(ctx, ctx.store.line, t, { walk: 0.18, jaw: 0.15 });
      kidRide(ctx, t, { face: 'determined', nugO: { lid: 0 } });
      animCrowd(ctx.store.fans, t, 'cheer', 'grin');
      moveCam(ctx, { pos: L(21.5, 1.5, 3.0), look: L(8, 2.4, 0.4), fov: 56 }, { pos: L(20.0, 1.4, 2.8), look: L(8, 2.4, 0.4), fov: 54 }, lt / 0.9);
      stamp(ctx, '3...', ctx.time('three'), { y: 0.39, size: 150, fill: '#ffe14a', stroke: '#1d1d22' });
    },
  },
  // ── "Two."  — snorting triceratops, Maya leaning forward
  {
    name: 'two', start: 'two-0.06', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); startSet(ctx);
      ctx.store.line = lineUp(ctx);
      addTo(ctx, ctx.props.dust2, 0, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      stompAll(ctx, ctx.store.line, t, { walk: 0.22 });
      const tri = P.tri[0]; tri.userData.set(t, { walk: 0.3, gait: 9, headPitch: 0.25 + 0.05 * Math.sin(t * 20), jaw: 0.2, lid: 0.3 });
      const nose = worldOf(tri.userData.parts.head, 0, -0.2, 1.7);
      P.dust2.position.copy(toLocal(ctx, nose)); P.dust2.scale.setScalar(0.14); P.dust2.userData.set(((t - ctx.time('two') + 0.1) % 0.5) * 3);
      riderPose(ctx.cast.maya, t, 'peer', 'determined');
      moveCam(ctx, { pos: L(14.2, 2.0, 3.4), look: L(11.2, 2.6, 1.4), fov: 50 }, { pos: L(13.6, 2.0, 3.0), look: L(11.2, 2.6, 1.4), fov: 48 }, lt / 0.7);
      stamp(ctx, '2...', ctx.time('two'), { y: 0.18, size: 190, fill: '#ffe14a', stroke: '#1d1d22' });
    },
  },
  // ── "One."  — tiny Nugget at the end of the row, next to a giant stegosaurus
  {
    name: 'one', start: 'one-0.06', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); startSet(ctx);
      ctx.store.line = lineUp(ctx);
      kidOn(ctx, NUG.x, NUG.z, PI / 2, 0.86, 0.12);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      stompAll(ctx, ctx.store.line, t, { walk: 0.25 });
      kidRide(ctx, t, { face: 'determined', nugO: { lid: 0, smug: 0.6 } });
      // straight down the pavement: the lamp post hides behind the kid, its head stays above frame; the stego towers beside
      moveCam(ctx, { pos: L(14.5, 0.5, 5.75), look: L(10.3, 0.9, 4.6), fov: 56 }, { pos: L(14.3, 0.5, 5.7), look: L(10.3, 0.95, 4.6), fov: 56 }, lt / 0.7);
      stamp(ctx, '1...', ctx.time('one'), { y: 0.18, size: 190, fill: '#ffe14a', stroke: '#1d1d22' });
    },
  },
  // ── "Go!"  — the mayor drops the starter flag
  {
    name: 'go', start: 'b10.w3-0.06', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); startSet(ctx);
      ctx.store.line = lineUp(ctx);
      addTo(ctx, ctx.props.crate, CRATE.x, 0.47, CRATE.z, 0.2);
      put(ctx, 'mayor', L(CRATE.x, 0.82, CRATE.z), -0.35);
      ctx.add(ctx.props.flag, ctx.cast.mayor.joints.handR || ctx.cast.mayor.joints.foreArmR); ctx.props.flag.position.set(0, -0.05, 0); ctx.props.flag.rotation.set(PI, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, may = ctx.cast.mayor, tg = ctx.time('b10.w3');
      stompAll(ctx, ctx.store.line, t, { walk: 0.3, jaw: 0.4 });
      may.pose('idle', t, { intensity: 0.3 });
      const dn = ease.outCubic(clamp((t - tg) / 0.16, 0, 1));
      may.joints.armR.rotation.set(lerp(-2.9, -0.9, dn), 0, -0.15); may.joints.foreArmR.rotation.set(-0.1, 0, 0);
      may.face(t > tg ? 'huss' : 'determined', 0.3);
      const f = humanFace(may);
      moveCam(ctx, { pos: L(14.6, 1.0, -3.4), look: f.clone().add(up(-0.3)), fov: 50 }, { pos: L(14.8, 1.0, -3.6), look: f.clone().add(up(-0.3)), fov: 46 }, lt / 0.6);
      stamp(ctx, 'GO!', tg, { y: 0.17, size: 230, fill: '#3cff6b', stroke: '#1d1d22' });
    },
  },
  // ── b11 "Twelve dinosaurs exploded off the line."  — a wall of dinosaurs and dust thunders off
  {
    name: 'exploded', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); startSet(ctx);
      ctx.store.line = lineUp(ctx);
      kidOn(ctx, NUG.x, NUG.z, PI / 2, 0.86, 0.12);
      addTo(ctx, ctx.props.dust, 7.5, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, te = ctx.time('go');
      ctx.store.line.forEach(({ r, d, ch }, k) => {
        const dd = t - te - hash(k * 2.3) * 0.15, x = raceDist(dd);
        d.position.x = r.x + x; d.position.z = lerp(r.z, r.z * 0.3, clamp(x / 8, 0, 1));
        d.userData.set(t + k * 0.4, { walk: dd > 0 ? 1 : 0.3, run: dd > 0 ? 1 : 0, gait: dd > 0 ? 12 : 7, jaw: dd > 0 ? 0.7 : 0.3, pitch: dd > 0 ? 0.1 : 0 });
        if (ch) riderPose(ch, t + k, dd > 0 ? 'cheer' : 'idle', dd > 0 ? 'grin' : 'determined');
      });
      kidRide(ctx, t, { face: t > te + 0.3 ? 'shocked' : 'determined', nugO: { lid: 0 } });
      P.dust.userData.set(t - te + 0.05);
      moveCam(ctx, { pos: L(19.5, 0.8, 6.3), look: L(10, 2.0, 0.5), fov: 60 }, { pos: L(19.8, 0.9, 6.4), look: L(14, 2.2, 0.5), fov: 64 }, ease.inOutSine(clamp((t - te + 0.2) / 1.2, 0, 1)));
      shakeOn(ctx, [te], 1.1, 0.9, 2); if (t > te) ctx.cam.shake(0.35, t, 6);
    },
  },
  // ── "Nugget just stood there, pecking at a crumb."  — the dust clears: Nugget alone, pecking; the kid holds his head
  {
    name: 'pecking', start: 'b11.w6-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); startSet(ctx);
      kidOn(ctx, NUG.x, NUG.z, PI / 2, 0.86, 0.12);
      const P = ctx.props; addTo(ctx, P.crumb, NUG.x + 0.45, 0.12, NUG.z); addTo(ctx, P.dust, 1.0, 0, -2.0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, te = ctx.time('go'), tp = ctx.time('b11.w10');
      const pk = (t > tp - 0.1) ? Math.max(0, Math.sin(clamp((t - tp + 0.1) / 0.22, 0, 3) * PI)) : 0;
      kidRide(ctx, t, { action: 'think', face: 'sweat', nugO: { peck: pk, lid: 0 } });
      P.dust.userData.set(t - te + 0.05);
      moveCam(ctx, { pos: L(14.8, 0.9, 2.8), look: L(11.3, 0.95, 5.1), fov: 50 }, { pos: L(14.3, 0.85, 3.1), look: L(11.4, 0.9, 5.1), fov: 46 }, lt / 2.0);
    },
  },
  // ── b12 "Then Sprinkles tripped…"  — tracking the pack
  {
    name: 'pack', start: 'b12-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      ctx.store.pack = RACERS.slice(0, 11).map((r) => ({ r, d: placeRacer(ctx, r, r.x, r.z * 0.32), ch: r.rider ? ctx.cast[r.rider] : null }));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      const v = 7, base = 8 + v * lt;
      const cx = 9.6 + base;
      // Sprinkles + Big Marcus out front on the camera side, Maya's triceratops right on her tail
      const OVR = { 2: [2.4, 1.6], 3: [-1.0, 0.3], 0: [0.6, -1.6], 1: [-3.2, -1.6], 4: [-4.4, 1.9] };
      ctx.store.pack.forEach(({ r, d, ch }, k) => {
        const o = OVR[k]; if (o) d.position.set(cx + o[0], 0, o[1]); else d.position.x = r.x + base - 3.2;
        d.userData.set(t + k * 0.4, { walk: 1, run: 1, gait: 12, jaw: 0.6 }); if (ch) riderPose(ch, t + k, 'cheer', 'grin');
      });
      setCam(ctx, { pos: L(cx + 7.0, 2.0, 7.2), look: L(cx + 1.0, 2.2, 1.0), fov: 52 });
    },
  },
  // ── "…on the triceratops's tail."  — slow motion: the raptor's foot catches the tail; Big Marcus's shades fly off; freeze
  {
    name: 'trip', start: 'b12.w2-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      ctx.store.tri = placeRacer(ctx, RACERS[3], 36, 0.0); ctx.store.rap = placeRacer(ctx, RACERS[2], 33.0, 2.2);
      addTo(ctx, ctx.props.shades, 0, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, t0 = ctx.time('b12.w2') - 0.12;
      const fr = ctx.time('b12.w6') - 0.1;            // freeze from 'tail'
      const st = Math.min(t, fr) - t0, s = st * 0.22;  // slow-mo clock
      const tri = ctx.store.tri, rap = ctx.store.rap;
      tri.position.x = 36 + 7 * s; rap.position.x = 33.0 + 7 * s;
      tri.userData.set(t0 + s, { walk: 1, run: 1, gait: 12, tailYaw: 0.7 });
      const trip = clamp(st / 0.9, 0, 1);
      rap.userData.set(t0 + s, { walk: 1, run: 1, gait: 12, lean: trip * 1.4, pitch: trip * 0.5, jaw: 0.9, pupil: 0.6, lid: 0 });
      rap.position.y = -0.2 * trip;
      riderPose(ctx.cast.maya, t0 + s, 'cheer', 'grin');
      const bm = ctx.cast.bigm; riderPose(bm, t0 + s, 'surprised', 'shocked'); bm.root.rotation.y = -0.75;   // 3/4 to the camera
      bm.setAccessory('sunglasses', st < 0.35);
      const f = humanFace(bm), sh = P.shades; sh.visible = st >= 0.35;
      if (sh.visible) { const d = st - 0.35; sh.position.copy(toLocal(ctx, f.clone().add(V(0.6 + 1.4 * d, 0.35 + 1.6 * d - 0.6 * d * d, 0.4 + 0.6 * d)))); sh.rotation.set(d * 5, d * 7, d * 3); sh.scale.setScalar(2.5); }
      const frozen = t >= fr;
      setCam(ctx, { pos: L(35.2 + 7 * s, 1.7, 9.6), look: L(33.6 + 7 * s, 1.5, 1.4), fov: 54 - (frozen ? 6 * clamp((t - fr) / 0.4, 0, 1) : 0) });
      if (frozen) { ctx.fx.overlay('#203050', 0.25); ctx.fx.vignette(0.6); stamp(ctx, 'UH OH.', fr + 0.05, { y: 0.16, size: 130, fill: '#ffffff', stroke: '#1d1d22', rot: -0.05, noShake: true }); }
      else ctx.fx.vignette(0.35);
    },
  },
  // ── b13 "The triceratops crashed into the stage."  — whip-pan: it tumbles into the starter's stage
  {
    name: 'crash', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props;
      addTo(ctx, P.stage, STAGE.x, 0, STAGE.z, 0);
      put(ctx, 'mayor', L(STAGE.x + 1.4, 1.25, STAGE.z + 0.1), -PI / 2 - 0.4);
      ctx.add(P.flag, ctx.cast.mayor.joints.handR || ctx.cast.mayor.joints.foreArmR); P.flag.position.set(0, -0.05, 0); P.flag.rotation.set(PI, 0, 0);
      ctx.store.tri = placeRacer(ctx, RACERS[3], 19, -1.0);
      addTo(ctx, P.dust2, STAGE.x - 2.2, 0, STAGE.z + 0.5);
      ctx.store.cr = crowd(ctx, X.slice(0, 4), [[34.8, 0, -9.5, -PI / 2 - 0.6], [33.5, 0, -10.6, -PI / 2 - 0.3], [28.5, 0.12, -9.2, PI / 2 - 0.4], [36, 0, -7.8, -PI / 2]]);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tc = ctx.time('crash');
      const u = clamp((t - (tc - 0.85)) / 0.85, 0, 1);
      const tri = ctx.store.tri;
      tri.position.set(lerp(19, STAGE.x - 3.6, u), 0.3 * Math.sin(PI * u), lerp(-1.0, STAGE.z + 0.4, u));
      tri.rotation.set(0, PI / 2 - 0.5 * u, 0);
      tri.userData.set(t, { roll: 1.2 * Math.sin(u * PI) * (t < tc ? 1 : 0) + (t >= tc ? 0.35 : 0), walk: t < tc ? 1 : 0, run: 1, gait: 14, jaw: 0.9, pupil: t > tc ? 0.5 : 0.8, kick: t > tc ? 0.4 : 0 });
      riderPose(ctx.cast.maya, t, 'surprised', 'shocked');
      const tilt = t > tc ? -0.28 * ease.outBack(clamp((t - tc) / 0.25, 0, 1)) : 0;
      P.stage.userData.set(tilt);
      const may = ctx.cast.mayor; may.root.position.copy(worldOf(P.stage.userData.spot)); may.root.rotation.z = tilt * 0.5;
      may.pose(t > tc ? 'surprised' : 'cheer', t); may.face(t > tc ? 'shocked' : 'grin', 0.4);
      animCrowd(ctx.store.cr, t, t > tc ? 'surprised' : 'cheer', t > tc ? 'shocked' : 'grin');
      P.dust2.userData.set(t - tc);
      const whip = ease.outCubic(clamp((t - ctx.time('b13')) / 0.3, 0, 1));
      setCam(ctx, { pos: L(25.5, 2.2, 3.6), look: L(lerp(21, STAGE.x - 1.5, whip), 1.6, lerp(-1.2, STAGE.z + 0.5, whip)), fov: 54 });
      shakeOn(ctx, [tc], 1.0, 0.45, 8); pop(ctx, tc, 0.1, '#ffffff', 0.4);
      if (whip < 1) ctx.cam.shake(0.3 * (1 - whip), t, 3);
    },
  },
  // ── "The stage launched the mayor."  — the seesaw flips; the mayor rockets into the sky, top hat spinning
  {
    name: 'launch', start: 'b13.w6-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props;
      addTo(ctx, P.stage, STAGE.x, 0, STAGE.z, 0);
      put(ctx, 'mayor', L(STAGE.x + 1.4, 1.25, STAGE.z + 0.1), -PI / 2 - 0.4);
      ctx.cast.mayor.setAccessory('topHat', false);
      addTo(ctx, P.hat, 0, 0, 0);
      const tri = addTo(ctx, P.tri[0], STAGE.x - 3.6, 0, STAGE.z + 0.4, PI / 2 - 0.5); ride(ctx, 'maya', tri.userData.seat);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tl = ctx.time('launch');
      P.tri[0].userData.set(t, { roll: 0.35, pupil: 0.5, kick: 0.4, jaw: 0.6, lookY: 0.5 });
      riderPose(ctx.cast.maya, t, 'surprised', 'shocked');
      const f = clamp((t - tl) / 0.18, 0, 1), tilt = lerp(-0.28, 0.55, ease.outCubic(f));
      P.stage.userData.set(tilt);
      const may = ctx.cast.mayor, sp = worldOf(P.stage.userData.spot);
      const d = t - tl;
      if (d < 0.1) { may.root.position.copy(sp); may.root.rotation.set(0, -PI / 2 - 0.4, 0); }
      else { const dd = d - 0.1; may.root.position.copy(sp.clone().add(V(3.0 * dd, 13 * dd - 4.9 * dd * dd, 2.4 * dd))); may.root.rotation.set(dd * 4, -PI / 2, dd * 2); }
      may.pose('surprised', t); may.face('shocked', 0.3);
      const hat = P.hat, hd = Math.max(0, d - 0.05);
      hat.position.copy(toLocal(ctx, d < 0.05 ? headTop(may, 0.6) : sp.clone().add(V(-1.0 * hd, 2.2 + 9 * hd - 4.9 * hd * hd, 1.4 * hd)))); hat.rotation.set(hd * 9, hd * 6, hd * 4);
      const mp = worldOf(may.root, 0, 1, 0);
      setCam(ctx, { pos: L(STAGE.x + 4.8, 0.7, STAGE.z + 5.5), look: d < 0.15 ? L(STAGE.x + 0.6, 1.8, STAGE.z) : mp.clone().lerp(L(STAGE.x + 1, 2, STAGE.z), 0.25), fov: 58 });
      shakeOn(ctx, [tl], 0.7, 0.35, 12); pop(ctx, tl, 0.08, '#ffffff', 0.3);
    },
  },
  // ── "The mayor landed on the T-rex."  — splat onto its head; the T-rex goes cross-eyed
  {
    name: 'land on t-rex', start: 'b13.w11-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props;
      addTo(ctx, P.rex, REX.x, 0, REX.z, -PI / 2 - 0.25, 0.8);
      put(ctx, 'mayor', L(30, 14, -4), -PI / 2);
      ctx.cast.mayor.setAccessory('topHat', false);
      ctx.store.pack = [0, 1, 4, 6, 8].map((k, j) => ({ r: RACERS[k], d: placeRacer(ctx, RACERS[k], 29 + j * 1.6, RACERS[k].z * 0.5, PI / 2 + (j - 2) * 0.4) }));
      addTo(ctx, P.stars[0], 0, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tl = ctx.time('land');
      const rex = P.rex, hp = worldOf(rex.userData.parts.head, 0, 2.0, 1.2);
      const may = ctx.cast.mayor;
      const u = clamp((t - (tl - 0.5)) / 0.5, 0, 1);
      const from = L(33, 15, -5);
      if (t < tl) { may.root.position.copy(from.clone().lerp(hp, u)).add(up(2.5 * Math.sin(PI * u))); may.root.rotation.set(-u * 3, -PI / 2, 0); may.pose('surprised', t); may.face('shocked', 0.4); }
      else { const d = t - tl; may.root.position.copy(hp).add(up(0.25 * Math.abs(Math.sin(d * 10)) * Math.exp(-d * 5))); may.root.rotation.set(0, -PI / 2 - 0.25, 0); may.pose('stunned', t); may.face('sweat', 0.4); }
      const hit = t > tl ? Math.exp(-(t - tl) * 3) : 0;
      rex.userData.set(t, { sit: 0, lean: 0.1 + 0.25 * hit, lookY: 0.9, lookX: 0, pupil: t > tl ? 0.55 : 1, jaw: t > tl ? 0.4 : 0.1, tremble: hit * 0.5, headTilt: t > tl ? 0.15 * Math.sin(t * 4) : 0 });
      ctx.store.pack.forEach(({ r, d }, k) => { d.userData.set(t + k, { pupil: 0.5, kick: 0.3, roll: (k % 2 ? 0.6 : -0.4), jaw: 0.5 }); if (r.rider) riderPose(ctx.cast[r.rider], t + k, 'stunned', 'sweat'); });
      const st = P.stars[0]; st.position.copy(toLocal(ctx, hp.clone().add(up(2.3)))); st.scale.setScalar(2.5); st.userData.set(t, t > tl ? 1 : 0);
      moveCam(ctx, { pos: L(27.5, 3.0, 7.0), look: L(38, 7.5, 1.5), fov: 58 }, { pos: L(28.3, 3.2, 6.8), look: L(39, 8.5, 1.8), fov: 54 }, lt / 1.6);
      shakeOn(ctx, [tl], 0.6, 0.35, 14);
    },
  },
  // ── b14 "And the T-rex sat on everybody."  — it sits straight down on the pack: dust + shake
  {
    name: 't-rex sits', start: 'b14-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props;
      pileRex(ctx); put(ctx, 'mayor', L(0, 0, 0), -PI / 2); ctx.cast.mayor.setAccessory('topHat', false);
      ctx.store.pile = pileUp(ctx);
      addTo(ctx, P.dust, PILE.x, 0, PILE.z, 0, 0.6); addTo(ctx, P.stars[0], 0, 0, 0);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, ts = ctx.time('b14.w3');
      // it hovers in a half-squat above the heap, then drops onto it: squash, dust, shake at 'sat'
      const u = clamp((t - (ts - 0.32)) / 0.32, 0, 1), s = u * u, dk = t > ts ? t - ts : -1;
      const sq = dk >= 0 ? Math.exp(-dk * 7) * Math.cos(dk * 22) : 0;
      P.rex.position.y = lerp(4.2, 1.5, s) - 0.25 * Math.max(0, sq);
      P.rex.scale.set(0.8 * (1 + 0.1 * sq), 0.8 * (1 - 0.16 * sq), 0.8 * (1 + 0.1 * sq));
      P.rex.userData.set(t, { sit: 0.55 + 0.45 * s, lookY: 0.6, pupil: 0.55, jaw: 0.3, headTilt: 0.12 * Math.sin(t * 4), lean: 0.15 });
      mayorOnRex(ctx, t);
      animPile(ctx, ctx.store.pile, t, t > ts ? 1 : 0.3);
      P.dust.userData.set(t - ts + 0.05);
      const st = P.stars[0]; st.position.copy(toLocal(ctx, headTop(ctx.cast.mayor, 0.9))); st.scale.setScalar(1.4); st.userData.set(t, 1);
      moveCam(ctx, { pos: L(33.0, 3.5, 15.5), look: L(33.0, 4.0, -0.3), fov: 56 }, { pos: L(33.0, 3.5, 15.0), look: L(33.0, 3.7, -0.3), fov: 56 }, lt / 1.8);
      shakeOn(ctx, [ts], 1.3, 0.6, 15); pop(ctx, ts, 0.1, '#ffffff', 0.3);
    },
  },
  // ── b15 HUSS ×3 — the pile-up blocks main street; the kid in the foreground HUSSes
  ...[0, 1, 2].map((i) => ({
    name: `pile huss #${i + 1}`, start: H('b15', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      pileRex(ctx); put(ctx, 'mayor', L(0, 0, 0), -PI / 2); ctx.cast.mayor.setAccessory('topHat', false);
      ctx.store.pile = pileUp(ctx);
      kidOn(ctx, 20.5, 3.2, yawTo(20.5, 3.2, 8.2, 6.7), 0.86);   // back to the pile
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, hits = hussHits(ctx, 'b15');
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      P.rex.userData.set(t, { sit: 1, lookY: 0.4, pupil: 0.55, jaw: 0.3, headTilt: 0.12 * Math.sin(t * 4), lean: 0.15 });
      mayorOnRex(ctx, t);
      animPile(ctx, ctx.store.pile, t, 1);
      kidRide(ctx, t, { action: 'slam', face: dh < 0.22 ? 'huss' : 'determined', params: { hits }, nugO: { flap: dh < 0.25 ? 1 : 0.2, lid: 0 } });
      const cams = [
        faceCam(me, 2.4, 0.5, 0.4, 52, -0.75),
        faceCam(me, 2.3, 0.35, 0.42, 36, -0.1),
        { pos: L(16.2, 0.9, 6.4), look: L(26, 5.0, 0.6), fov: 60 },
      ];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.12, 0.2);
    },
  })),
  // ── b16 "Twelve dinosaurs. One giant pile."  — overhead: legs, tails, dizzy stars
  {
    name: 'pile overhead', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day');
      const P = ctx.props;
      pileRex(ctx); put(ctx, 'mayor', L(0, 0, 0), -PI / 2); ctx.cast.mayor.setAccessory('topHat', false);
      ctx.store.pile = pileUp(ctx);
      P.stars.forEach((s) => addTo(ctx, s, 0, 0, 0));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      P.rex.userData.set(t, { sit: 1, lookY: 0.2, pupil: 0.55, jaw: 0.3, headTilt: 0.15 * Math.sin(t * 3), lean: 0.15 });
      mayorOnRex(ctx, t);
      animPile(ctx, ctx.store.pile, t, 1);
      ctx.store.pile.slice(0, 4).forEach((p, k) => { const s = P.stars[k]; s.position.copy(toLocal(ctx, worldOf(p.d.userData.parts.head, 0, 0.9, 0.4))); s.scale.setScalar(2.2); s.userData.set(t + k, 1); });
      { const s = P.stars[4]; s.position.copy(toLocal(ctx, headTop(ctx.cast.mayor, 0.9))); s.scale.setScalar(1.3); s.userData.set(t, 1); }
      const a = -0.5 + 0.18 * lt;
      setCam(ctx, { pos: L(PILE.x + Math.sin(a) * 9, 24, PILE.z + Math.cos(a) * 9), look: L(PILE.x - 0.5, 0.5, PILE.z), fov: 50 });
      stamp(ctx, 'DINO PILE-UP', ctx.time('b16') + 0.05, { y: 0.15, size: 120, fill: '#ffe14a', stroke: '#1d1d22', rot: -0.06 });
    },
  },
  // ── "Nobody could move."  — the long-neck's head waves weakly from the bottom of the pile
  {
    name: 'weak wave', start: 'b16.w5-0.12', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      pileRex(ctx);
      ctx.store.pile = pileUp(ctx);
      // (this shot) the long-neck is squashed belly-down under the heap, its long neck flopped out west along the street
      const ln = ctx.props.ln[0]; ln.position.set(PILE.x - 3.2, -2.3, PILE.z + 0.6); ln.rotation.set(0, -PI / 2, 0);
      ln.userData.set(0, { tip: 0, neckBend: 0.9, headPitch: -0.22 });
      const hd = ln.userData.parts.head, hc = worldOf(hd, 0, 0, 0);
      ctx.store.h0 = new THREE.Box3().setFromObject(hd).getCenter(V()); ctx.store.hf = worldOf(hd, 0, 0, 1).sub(hc).setY(0).normalize();   // the head's facing (flattened)

    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props;
      P.rex.userData.set(t, { sit: 1, lookY: 0.2, pupil: 0.55, jaw: 0.3, lean: 0.15 });
      animPile(ctx, ctx.store.pile, t, 0.5);
      const ln = P.ln[0]; ln.userData.set(t, { tip: 0, neckBend: 0.9, neckYaw: 0.12 * Math.sin(t * 2.2), headRoll: 0.25 * Math.sin(t * 4.4), headPitch: -0.22, lid: 0.45, pupil: 0.6, jaw: 0.3 + 0.2 * Math.sin(t * 4) });
      const hp = worldOf(ln.userData.parts.head, 0, 0.2, 0.4);
      // ground-level, right in front of the droopy head: the head waves in the foreground, the heap rises behind
      const hf = ctx.store.hf, h0 = new THREE.Box3().setFromObject(ln.userData.parts.head).getCenter(V()), hs = ctx.store.h0;
      h0.lerp(hs, 0.5);   // half-track the drooping, waving head
      const cb = V(h0.x + hf.x * 3.6, 0.85, h0.z + hf.z * 3.6);
      const lk = h0.clone().add(up(2.0)).addScaledVector(hf, -4.0);
      moveCam(ctx, { pos: cb, look: lk, fov: 58 }, { pos: cb.clone().addScaledVector(hf, -0.25), look: lk, fov: 56 }, lt / 1.2);
    },
  },
  // ── b17 "And Nugget?"  — Nugget, unbothered
  {
    name: 'and nugget', start: 'b17-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      nugAt(ctx, 28.4, 5.6, yawTo(28.4, 5.6, 26.84, 7.68), 1, 0.12);   // faces the lens, the pile behind her
      ctx.add(ctx.props.motes);
      pileRex(ctx); ctx.store.pile = pileUp(ctx);
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props;
      P.nug.userData.set(t, { smug: 1, lookX: 0.2, headYaw: -0.15 + 0.15 * clamp(lt - 0.3, 0, 1) });
      P.rex.userData.set(t, { sit: 1, lookY: 0.2, pupil: 0.55, jaw: 0.3, lean: 0.15 }); animPile(ctx, ctx.store.pile, t, 0.4);
      const hp = worldOf(P.nug.userData.parts.head, 0, 0.15, 0.1), dir = V(-0.6, 0, 0.8);
      moveCam(ctx, { pos: hp.clone().addScaledVector(dir, 2.8), look: hp.clone().add(up(-0.35)), fov: 36 }, { pos: hp.clone().addScaledVector(dir, 2.6), look: hp.clone().add(up(-0.35)), fov: 36 }, lt / 0.95);
      const m = P.motes; m.position.copy(hp); m.userData.set(t, 0.5);
    },
  },
  // ── "Nugget just walked."  — slow motion: she strolls past the pile; every dinosaur's eyes follow her
  {
    name: 'walk past', start: 'b17.w2-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      pileRex(ctx);
      ctx.store.pile = pileUp(ctx);
      nugAt(ctx, 29, 5.4, PI / 2, 1, 0.12);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      const nx = 29 + 0.75 * lt; P.nug.position.set(nx, nx < 30 ? 0.12 : 0, 5.4); P.nug.userData.set(t * 0.5, { walk: 1, walkSpeed: 9, smug: 0.7, headYaw: -0.2 });
      const k = clamp((nx - PILE.x) / 6, -1, 1);
      P.rex.userData.set(t, { sit: 1, lookX: k, lookY: -0.4, headYaw: 0.25 * k, pupil: 0.8 });
      animPile(ctx, ctx.store.pile, t, 0.15, { lookX: -k, headYaw: 0.3 * k, lookY: -0.3, lid: 0 });
      moveCam(ctx, { pos: L(nx + 1.9, 0.5, 9.0), look: L(nx - 0.2, 1.3, 2.5), fov: 56 }, { pos: L(nx + 1.8, 0.5, 8.9), look: L(nx - 0.2, 1.4, 2.5), fov: 56 }, lt / 1.7);
      ctx.fx.vignette(0.4);
    },
  },
  {
    name: 'right past them', start: 'b17.w5-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day');
      pileRex(ctx);
      ctx.store.pile = pileUp(ctx);
      nugAt(ctx, 31, 5.2, PI / 2, 1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      const nx = 31 + 0.8 * lt; P.nug.position.x = nx; P.nug.userData.set(t * 0.5, { walk: 1, walkSpeed: 9, smug: 0.8 });
      const k = clamp((nx - PILE.x) / 5, -1, 1);
      P.rex.userData.set(t, { sit: 1, lookX: -k, lookY: -0.5, headYaw: -0.3 * k, pupil: 0.8 });
      animPile(ctx, ctx.store.pile, t, 0.15, { lookX: k, headYaw: -0.3 * k, lookY: -0.3, lid: 0 });
      // reverse angle from behind the heap (north side): dinosaur heads in the foreground, eyes tracking her past
      moveCam(ctx, { pos: L(28.6, 7.5, -8.6), look: L(nx, 0.5, 5.2), fov: 46 }, { pos: L(28.8, 7.4, -8.8), look: L(nx, 0.5, 5.2), fov: 44 }, lt / 1.4);
    },
  },
  // ── b18 "Up the steps."  — Nugget hops up the clock tower steps
  {
    name: 'up the steps', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); towerSet(ctx);
      nugAt(ctx, 60.9, TOWER.z, PI / 2, 1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      towerSet(ctx);
      const steps = [[60.9, 0], [61.74, 0.175], [62.16, 0.35], [62.58, 0.525], [63.0, 0.7], [63.7, 0.7]];
      const ph = lt / 0.17, i = Math.min(steps.length - 2, Math.floor(ph)), f = clamp(ph - i, 0, 1);
      const a = steps[i], b = steps[i + 1];
      P.nug.position.set(lerp(a[0], b[0], f), lerp(a[1], b[1], f) + 0.35 * Math.sin(PI * f), TOWER.z);
      P.nug.userData.set(t, { flap: 0.6, walk: 0.5, smug: 0.6 });
      const np = P.nug.position;
      moveCam(ctx, { pos: L(58.6, 0.9, 1.6), look: L(62.0, np.y - 0.45, -2), fov: 52 }, { pos: L(59.4, 1.0, 1.4), look: L(63.2, np.y - 0.45, -2), fov: 52 }, lt / 1.1);
    },
  },
  // ── "Up the tower."  — she flaps straight up the wall; the camera tilts with her
  {
    name: 'up the tower', start: 'b18.w3-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); towerSet(ctx);
      nugAt(ctx, 63.3, -2.6, PI / 2, 1);
      ctx.add(ctx.props.sparkles);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      towerSet(ctx);
      const u = ease.inOutSine(clamp(lt / 1.05, 0, 1)), y = lerp(0.8, 13.0, u);
      P.nug.position.set(lerp(63.3, 62.3, Math.sin(PI * u)), y, -2.6); P.nug.rotation.set(0, -PI / 2 + 0.6, 0);
      P.nug.userData.set(t, { flap: 1, spread: 0.2, lid: 0, pupil: 0.8, lookY: 0.6 });
      setCam(ctx, { pos: L(56.9, lerp(1.5, 9.5, u), 3.4), look: L(62.8, y - 1.0, -2.4), fov: 50 });
      P.sparkles.position.copy(L(62.5, y, -2)); P.sparkles.userData.set(t, 0.4);
    },
  },
  // ── "And she rang the bell with her face."  — DONG.  WINNER.
  {
    name: 'bell headbutt', start: 'b18.w6-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); towerSet(ctx);
      nugAt(ctx, 64.3, TOWER.z, PI / 2, 1, 13.11);
      ctx.props.rings.forEach((r) => ctx.add(r, ctx.set.root));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tb = ctx.time('b18.w13');
      const d = t - tb;
      const sw = d < 0 ? 0 : 0.55 * Math.exp(-d * 1.2) * Math.sin(d * 7.5);
      const tw = towerSet(ctx, { swing: sw, glint: hitPulse([tb], t, 0.4) });
      const wind = clamp((t - (tb - 0.45)) / 0.3, 0, 1), dash = clamp((t - (tb - 0.12)) / 0.12, 0, 1);
      P.nug.position.x = 64.3 - 0.35 * wind + 0.55 * dash - (d > 0 ? 0.2 * clamp(d / 0.2, 0, 1) : 0);
      P.nug.userData.set(t, { pitch: 0.35 * dash - 0.2 * wind, headPitch: 0.3 * dash, squint: d > 0 && d < 0.6 ? 1 : 0, lid: d > 0 && d < 0.6 ? 0.8 : 0, flap: d > 0 ? 0.6 : 0, smug: d > 0.6 ? 1 : 0 });
      const bp = tw.userData.bellWorld(-1.0);
      P.rings.forEach((r, i) => { r.position.copy(toLocal(ctx, bp)); r.lookAt(L(56, 14, 4)); r.scale.setScalar(3); r.userData.set(clamp((d - i * 0.12) / 0.7, 0, 1)); r.visible = d > i * 0.12 && d < 0.8 + i * 0.12; });
      setCam(ctx, { pos: L(66.6, 14.0, 4.2), look: L(65.1, 13.7, -2.0), fov: 44 });   // side-on through the open arch (clear of the corner posts)
      shakeOn(ctx, [tb], 0.9, 0.5, 21); pop(ctx, tb, 0.12, '#fff6c0', 0.45);
      bellGlint(ctx, bp.clone().add(V(-0.6, 0.4, 0.8)), hitPulse([tb], t, 0.5), 5);
      if (d > 0) stamp(ctx, 'WINNER', tb + 0.02, WINNER_O);
    },
  },
  // ── b19 HUSS ×6 — the kid sprints into the square cheering / Nugget atop the tower, wings spread; confetti
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `champion huss #${i + 1}`, start: H('b19', i), set: 'town',
    setup(ctx) {
      const L = town(ctx, 'day'); stageSet(ctx); towerSet(ctx);
      const P = ctx.props;
      nugAt(ctx, TOWER.x, TOWER.z, -PI / 2 + 0.3, 1, P.tower.userData.TOP_Y);
      put(ctx, 'me', L(36, 0, 2), PI / 2);
      ctx.store.cr = crowd(ctx, X.slice(0, 6), spots(6, { seed: 21, x0: 40, x1: 46, z0: -5, z1: 5, faceX: 66, faceZ: -2, avoid: (x, z) => Math.abs(z - 2) < 1.4 }));
      filler(ctx, blockFill(42, 48.5, -8, 8, 40, { seed: 17, faceX: 66, faceZ: -2 }));
      addTo(ctx, P.confetti.root, 44, 9, 1); ctx.add(P.sparkles);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, hits = hussHits(ctx, 'b19');
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9, t0 = ctx.time('b19');
      towerSet(ctx, { swing: 0.12 * Math.exp(-(t - t0) * 0.6) * Math.sin(t * 7) });
      P.nug.userData.set(t, { spread: 1, puff: 0.5, smug: 1, lookY: -0.2, flap: dh < 0.15 ? 0.4 : 0 });
      const run = t - t0, mx = 36 + 3.2 * run; me.root.position.copy(L(mx, 0, 2)); cheerRun(me, t); me.face(dh < 0.22 ? 'huss' : 'grin', t);
      animCrowd(ctx.store.cr, t, 'cheer', 'grin');
      fillerSet(ctx, t, { arms: 'cheer', bounce: 1, speed: 1.5 });
      P.confetti.update?.(t - t0 + 0.6);
      const top = worldOf(P.nug, 0, 0.6, 0);
      const cams = [
        { pos: L(mx + 3.6, 0.6, 3.4), look: L(mx, 1.6, 2), fov: 54 },
        { pos: L(57.5, 3.0, 4.5), look: top.clone().add(up(-1.3)), fov: 19 },
        faceCam(me, 2.4, -0.3, 0.42, 38, -0.1),
        { pos: L(60.5, 17.0, 3.5), look: top.clone().add(up(-0.2)), fov: 42 },
        { pos: L(mx - 4.0, 2.2, 6.5), look: L(60, 9, -2), fov: 62 },
        // crane over Nugget's shoulder: spread wings in the foreground, the cheering square (and the kid) below
        { pos: top.clone().add(V(1.5, 0.8 + 1.4 * clamp(t - ctx.time(H('b19', 5)), 0, 0.6), 0.55)), look: L(49, 3.0, 0.8), fov: 66 },
      ];
      setCam(ctx, cams[i]); ctx.cam.punch(hits, t, 0.12, 0.2);
      if (i < 2) stamp(ctx, 'WINNER', ctx.time('b18.w13') + 0.02, WINNER_O);
      if (i === 5) { ctx.cast.me.pose('wave', t); ctx.cast.me.face('grin', t); }
      P.sparkles.position.copy(cams[i].pos.clone().lerp(cams[i].look, 0.3)); P.sparkles.userData.set(t, 0.7);
    },
  })),
  // ── b20 "Nobody was laughing now."  — silence: the crowd and the dinosaurs stare up, jaws dropped
  {
    name: 'silence', start: 'b20-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); towerSet(ctx);
      const avoidTri = (x, z) => Math.hypot(x - 41.2, z + 1.5) < 3.4 || Math.hypot(x - 45, z - 6.4) < 2.2;
      ctx.store.cr = crowd(ctx, X.slice(0, 10), spots(10, { seed: 31, x0: 38.5, x1: 44.5, z0: -5.0, z1: 5.0, yaw: PI / 2 - 0.15, avoid: avoidTri }));
      filler(ctx, blockFill(33, 39, -8, 8, 40, { seed: 19, yaw: PI / 2 }));
      ctx.store.d = [placeRacer(ctx, RACERS[3], 41.2, -1.5, PI / 2 - 0.35), placeRacer(ctx, RACERS[2], 45.0, 6.4, PI / 2 + 0.1), placeRacer(ctx, RACERS[4], 37.5, 7.0, PI / 2)];
      ctx.cast.bigm.setAccessory('sunglasses', false);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t;
      towerSet(ctx);
      animCrowd(ctx.store.cr, t, 'stunned', 'shocked', { headPitch: -0.55 });
      ctx.store.d.forEach((d, k) => d.userData.set(t + k, { headPitch: -0.5, jaw: 1, lookY: 0.8, pupil: 0.55, lid: 0 }));
      ['maya', 'bigm', R[2]].forEach((id) => riderPose(ctx.cast[id], t, 'stunned', 'shocked', { headPitch: -0.5 }));
      fillerSet(ctx, t, { arms: 'limp', bounce: 0, speed: 0.3 });
      moveCam(ctx, { pos: L(46.8, 0.9, 0.7), look: L(41, 1.0, -0.2), fov: 50 }, { pos: L(46.5, 0.9, 0.6), look: L(41, 1.0, -0.2), fov: 50 }, lt / 1.5);
    },
  },
  // ── "Top ten respect."  — low angle on Nugget atop the tower, sun behind
  {
    name: 'top ten respect', start: 'b20.w4-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'day'); stageSet(ctx);
      const P = ctx.props; towerSet(ctx);
      nugAt(ctx, TOWER.x, TOWER.z, -PI / 2, 1, P.tower.userData.TOP_Y);
      ctx.add(P.sparkles);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      towerSet(ctx);
      P.nug.userData.set(t, { spread: 0.5, puff: 0.6, smug: 1 });
      const top = worldOf(P.nug, 0, 0.5, 0);
      moveCam(ctx, { pos: L(47.0, 1.2, 4.0), look: top.clone().add(up(-2.5)), fov: 34 }, { pos: L(47.3, 1.2, 3.9), look: top.clone().add(up(-2.0)), fov: 28 }, lt / 1.2);
      P.sparkles.position.copy(top); P.sparkles.userData.set(t, 0.8);
      stamp(ctx, 'TOP 10\nRESPECT', ctx.time('respect') + 0.02, { y: 0.17, size: 120, fill: '#ffffff', stroke: '#1d1d22', rot: -0.06 });
    },
  },
  // ── b21 "Then Nugget sat down on top of the clock tower…"  — she fluffs, wiggles, squints… settles
  {
    name: 'nugget sits', start: 'b21-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'dusk', { glow: 0.3 }); towerSet(ctx);
      nugAt(ctx, TOWER.x, TOWER.z, -PI / 2 + 0.35, 1, ctx.props.tower.userData.TOP_Y);
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, ts = ctx.time('sit');
      towerSet(ctx);
      const sit = ease.inOutCubic(clamp((t - ts) / 0.4, 0, 1)), wig = clamp((t - ts - 0.5) / 0.2, 0, 1);
      P.nug.userData.set(t, { puff: 0.4 + 0.5 * sit, sit, wiggle: wig, squint: clamp((t - ts - 0.7) / 0.2, 0, 1), lid: t > ts + 0.7 ? 0.5 : 0 });
      const top = worldOf(P.nug, 0, 0.6, 0);
      moveCam(ctx, { pos: top.clone().add(V(-3.6, 0.15, 1.6)), look: top.clone().add(up(-0.25)), fov: 38 }, { pos: top.clone().add(V(-3.0, 0.1, 1.35)), look: top.clone().add(up(-0.25)), fov: 36 }, lt / 2.4);
    },
  },
  // ── "…and laid an egg."  — POP
  {
    name: 'laid an egg', start: 'b21.w11-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'dusk', { glow: 0.3 }); towerSet(ctx);
      nugAt(ctx, TOWER.x, TOWER.z, -PI / 2 + 0.35, 1, ctx.props.tower.userData.TOP_Y);
      addTo(ctx, ctx.props.egg, TOWER.x, ctx.props.tower.userData.TOP_Y, TOWER.z, -PI / 2, 0.001); ctx.props.egg.visible = true;
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, te = ctx.time('b21.w13');
      towerSet(ctx);
      const g = ease.outBack(clamp((t - te) / 0.2, 0, 1));
      P.egg.scale.setScalar(Math.max(0.001, 0.45 * g)); P.egg.visible = true; P.egg.userData.set(t, {});
      P.nug.position.y = P.tower.userData.TOP_Y + 1.1 * g;
      P.nug.userData.set(t, { puff: 0.9, sit: 1, squint: t < te ? 1 : 0, wiggle: t < te ? 1 : 0, lid: t < te ? 0.5 : 0, pupil: t > te ? 0.6 : 1, beak: t > te ? 0.8 : 0 });
      const top = worldOf(P.tower, 0, P.tower.userData.TOP_Y + 0.4, 0);
      setCam(ctx, { pos: top.clone().add(V(-4.2, -1.6, 2.0)), look: top.clone().add(up(0.4)), fov: 42 });
      pop(ctx, te, 0.1, '#ffffff', 0.35); shakeOn(ctx, [te], 0.3, 0.25, 4);
    },
  },
  // ── b22 "The egg was bigger than the clock tower."  — it swells, the tower top crumbles, the egg drops into the square
  {
    name: 'egg swells', start: 'b22-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'dusk', { glow: 0.5 });
      const P = ctx.props; towerSet(ctx);
      addTo(ctx, P.egg, TOWER.x, P.tower.userData.TOP_Y, TOWER.z, -PI / 2, 0.45); P.egg.visible = true;
      nugAt(ctx, TOWER.x, TOWER.z, -PI / 2, 1, 20);
      addTo(ctx, P.dust3, TOWER.x, 12, TOWER.z); addTo(ctx, P.dust, EGG.x, 0, EGG.z);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tb = ctx.time('b22.w3'), tt = ctx.time('b22.w7');
      const top = P.tower.userData.TOP_Y, t0 = ctx.time('b22') - 0.1;
      const grow = ease.inCubic(clamp((t - t0) / (tb - t0), 0, 1));
      const s = lerp(0.45, EGG_S, grow);
      towerSet(ctx, { crumble: t - tb });
      const fall = clamp((t - tb - 0.05) / 0.55, 0, 1);
      const ex = lerp(TOWER.x, EGG.x, ease.inOutSine(fall)), ey = fall > 0 ? lerp(top - 4, 0, fall * fall) + 6 * Math.sin(PI * fall) * (1 - fall) : top - 2.6 * s * 0.25 * grow;
      P.egg.position.set(ex, Math.max(0, ey), TOWER.z * (1 - fall)); P.egg.scale.setScalar(s);
      P.egg.userData.set(t, { wobble: fall >= 1 ? 1 : 0 });
      P.nug.position.copy(toLocal(ctx, worldOf(P.egg, 0, 2.6, 0))); P.nug.userData.set(t, { sit: 1, puff: 0.6, pupil: 0.6, spread: 0.3 });
      skyMood(ctx, clamp((t - tb) / 0.6, 0, 1) * 0.6);
      P.dust3.userData.set(t - tb); P.dust.userData.set(t - tb - 0.55);
      moveCam(ctx, { pos: L(42.0, 6.0, 11.0), look: L(64, 15.5, -2), fov: 50 }, { pos: L(35.0, 6.5, 19.5), look: L(43, 10.5, -0.5), fov: 64 }, ease.inOutSine(clamp((t - tb) / 0.8, 0, 1)));
      shakeOn(ctx, [tb, tb + 0.6, tt], 1.0, 0.5, 17); pop(ctx, tb, 0.1, '#ffffff', 0.4);
    },
  },
  // ── "…bigger than the clock tower."  — tilt up, and up, and up: dinosaurs at the base, Nugget on top
  {
    name: 'tilt up the egg', start: 'b22.w6-0.05', set: 'town',
    setup(ctx) {
      town(ctx, 'dusk', { glow: 0.5 });
      const P = ctx.props;
      addTo(ctx, P.egg, EGG.x, 0, EGG.z, -PI / 2, EGG_S); P.egg.visible = true;
      nugAt(ctx, EGG.x - 1.0, EGG.z, -PI / 2, 2.2, 2.6 * EGG_S - 0.2);   // perched on the camera side of the dome
      ctx.store.d = [placeRacer(ctx, RACERS[3], 30.5, 3.2, PI / 2 + 0.2), placeRacer(ctx, RACERS[2], 31.5, -2.6, PI / 2 - 0.3), placeRacer(ctx, RACERS[4], 30.0, 6.6, PI / 2 - 0.2)];
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      P.egg.userData.set(t, { wobble: 0.5 });
      P.nug.userData.set(t, { sit: 1, puff: 0.6, smug: 1 });
      ctx.store.d.forEach((d, k) => d.userData.set(t + k, { headPitch: -0.6, jaw: 1, pupil: 0.5, lookY: 1, shake: 0.6, lid: 0 }));
      ['maya', 'bigm', R[2]].forEach((id) => riderPose(ctx.cast[id], t, 'surprised', 'shocked', { headPitch: -0.5 }));
      skyMood(ctx, 0.6);
      const u = ease.inOutCubic(clamp(lt / 0.95, 0, 1));
      moveCam(ctx, { pos: L(15.0, 1.0, -0.6), look: L(31, 2.0, 0), fov: 62 }, { pos: L(14.0, 2.5, -0.6), look: L(EGG.x, 2.6 * EGG_S + 1.5, 0), fov: 68 }, u);
    },
  },
  // ── b23 "Every dinosaur in town ran screaming back…"  — stampede down main street, the egg looming behind
  {
    name: 'run screaming', start: 'b23-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'dusk', { glow: 0.6 });
      addTo(ctx, ctx.props.egg, EGG.x, 0, EGG.z, -PI / 2, EGG_S); ctx.props.egg.visible = true;
      ctx.store.run = RACERS.map((r, k) => ({ r, x0: 12 + (k % 6) * 2.4 + (k > 5 ? 5 : 0), d: placeRacer(ctx, r, 0, r.z * 0.32, -PI / 2) }));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      P.egg.userData.set(t, { wobble: 0.6 });
      ctx.store.run.forEach(({ r, x0, d }, k) => { d.position.x = x0 - 9 * lt; d.userData.set(t + k * 0.3, { walk: 1, run: 1, gait: 13, jaw: 1, pupil: 0.45, lid: 0, headPitch: -0.2 }); if (r.rider) riderPose(ctx.cast[r.rider], t + k, 'surprised', 'shocked'); });
      skyMood(ctx, 0.65);
      moveCam(ctx, { pos: L(-6, 0.5, 2.6), look: L(14, 4.5, 0), fov: 58 }, { pos: L(-7, 0.5, 2.6), look: L(14, 5.5, 0), fov: 60 }, lt / 1.4);
      ctx.cam.shake(0.25, t, 4);
    },
  },
  // ── "…into the dinosaur park"  — they scramble through the gate; the triceratops slams it shut
  {
    name: 'into the park', start: 'b23.w5-0.1', set: 'town',
    setup(ctx) {
      town(ctx, 'dusk', { glow: 0.6, party: false }); fenceSet(ctx);
      // everyone but Maya's-old triceratops (racer 8) is through the gate first; it comes last and tail-slams it shut
      ctx.store.run = RACERS.slice(0, 11).map((r, k) => ({ r, last: k === 8, x0: k === 8 ? -28.6 : -30.0 - (k % 5) * 1.4 - (k > 4 ? 0.7 : 0), z0: k === 8 ? 0.4 : (hash(k * 3.1) - 0.5) * 3, d: placeRacer(ctx, r, 0, 0, -PI / 2) }));
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, ts = ctx.time('b23.w11') - 0.6;   // slam lands ≈ 0.45 s before the cut
      ctx.store.run.forEach(({ r, last, x0, z0, d }, k) => {
        if (last) {
          const x = Math.max(x0 - 10 * lt, FENCE_X - 3.2), stopped = x <= FENCE_X - 3.2;
          d.position.set(x, 0, lerp(z0, 0, clamp((FENCE_X + 6 - x) / 5, 0, 1)));
          const wh = clamp((t - (ts - 0.12)) / 0.2, 0, 1);
          d.userData.set(t + k * 0.3, { walk: stopped ? 0.2 : 1, run: stopped ? 0 : 1, gait: 13, jaw: 1, pupil: 0.45, lid: 0, tailYaw: stopped ? 1.3 * Math.sin(wh * PI) * (t < ts + 0.3 ? 1 : 0.3) : 0, headPitch: -0.2 });
          if (r.rider) riderPose(ctx.cast[r.rider], t + k, 'surprised', 'shocked');
          return;
        }
        const x = x0 - 10 * lt;
        d.position.set(Math.max(x, -50), 0, lerp(z0, z0 * 0.6, clamp((FENCE_X + 6 - x) / 5, 0, 1)));
        d.visible = x > -45;
        d.userData.set(t + k * 0.3, { walk: 1, run: 1, gait: 13, jaw: 1, pupil: 0.45, lid: 0 });
        if (r.rider) riderPose(ctx.cast[r.rider], t + k, 'surprised', 'shocked');
      });
      const g = 1 - ease.outBack(clamp((t - ts) / 0.22, 0, 1));
      P.fence.userData.set(t, { gate: t < ts ? 1 : Math.max(0, g) });
      skyMood(ctx, 0.65);
      moveCam(ctx, { pos: L(-13.5, 4.8, -1.8), look: L(-37, 2.6, 0), fov: 52 }, { pos: L(-15.0, 5.0, -1.8), look: L(-37, 2.8, 0), fov: 50 }, lt / 2.4);
      shakeOn(ctx, [ts + 0.2], 0.8, 0.4, 5); pop(ctx, ts + 0.2, 0.08, '#ffffff', 0.25);
    },
  },
  // ── "…and fixed the fence themselves."  — boards hammered on, KEEP OUT held high by the long-neck
  {
    name: 'fixed the fence', start: 'fix-0.2', set: 'town',
    setup(ctx) {
      town(ctx, 'dusk', { glow: 0.6, party: false }); fenceSet(ctx);
      const P = ctx.props;
      // the long-neck stands at the side (inside the park) and holds KEEP OUT out to the side, so its neck never crosses the letters
      addTo(ctx, P.ln[0], FENCE_X - 3.5, 0, -8.0, 0.25);
      ctx.add(P.keep, P.ln[0].userData.parts.jaw); P.keep.position.set(1.1, -0.3, 1.3); P.keep.rotation.set(0, PI / 2 - 0.25, 0); P.keep.scale.setScalar(1.7);
      // Sprinkles perched on top of the fence, facing us, hammer in her jaws
      addTo(ctx, P.rap[0], FENCE_X + 0.15, 5.9, 3.7, yawTo(FENCE_X, 3.7, -20, 2.6));
      ctx.add(P.hammer, P.rap[0].userData.parts.jaw); P.hammer.position.set(0.0, -0.05, 0.75); P.hammer.rotation.set(PI / 2, 0, 0.3); P.hammer.scale.setScalar(1.6);
      addTo(ctx, P.tri[0], FENCE_X - 3, 0, 8.5, PI / 2 - 0.3);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props;
      const knocks = [ctx.time('fix'), ctx.time('b23.w14'), ctx.time('b23.w15')];
      const nk = knocks.filter((k) => t >= k).length;
      P.fence.userData.set(t, { gate: 0, fixed: clamp(nk / 3 + (nk === 3 ? 0.2 : 0), 0, 1) });
      P.ln[0].userData.set(t, { neckBend: 0.28, headPitch: -0.1, jaw: 0.25, lid: 0.3 });
      // hammer: wind up before each knock, slam down on it
      let sw = 0; for (const k of knocks) { const d = t - k; if (d > -0.22 && d < 0) sw = Math.max(sw, -0.9 * (1 - (-d / 0.22))); }
      const hk = hitPulse(knocks, t, 0.12);
      P.rap[0].userData.set(t, { headPitch: 0.75 * hk + sw - 0.05, lid: hk > 0.5 ? 0.6 : 0.1, jaw: 0.2 });
      P.tri[0].userData.set(t, { headPitch: -0.2, lookY: 0.4 });
      skyMood(ctx, 0.65);
      moveCam(ctx, { pos: L(-20.0, 3.2, 2.6), look: L(-37, 6.4, 0.4), fov: 60 }, { pos: L(-20.8, 3.3, 2.6), look: L(-37, 6.6, 0.4), fov: 58 }, lt / 1.6);
      shakeOn(ctx, knocks, 0.25, 0.15, 6);
    },
  },
  // ── b24 "Now the egg is cracking."  — night, the empty square: the kid and Nugget beside the colossal egg
  {
    name: 'egg at night', start: 'b24-0.1', set: 'town',
    setup(ctx) {
      nightEgg(ctx);
      put(ctx, 'me', V(0, 0, 0), 0); nugAt(ctx, NUG_N.x, NUG_N.z, yawTo(NUG_N.x, NUG_N.z, EGG.x, EGG.z), 1);
      ctx.add(ctx.props.motes);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, tc = ctx.time('crack');
      const ck = ease.outCubic(clamp((t - tc + 0.05) / 0.5, 0, 1));
      P.egg.userData.set(t, { crack: 0.55 * ck, glow: ck * (0.8 + 0.2 * Math.sin(t * 6)), lightK: 0, shake: hitPulse([tc], t, 0.3) });
      me.root.position.copy(L(KID_N.x, 0, KID_N.z)); me.root.rotation.set(0, yawTo(KID_N.x, KID_N.z, EGG.x, EGG.z), 0);
      me.pose(t > tc ? 'surprised' : 'idle', t, { headPitch: -0.45 }); me.face(t > tc ? 'shocked' : 'neutral', 0.5);
      P.nug.userData.set(t, { lookY: 0.8, headPitch: -0.4, pupil: t > tc ? 0.7 : 1, lid: 0 });
      keyLight(ctx, crackPt(L, 1.25), 60 * ck + 4);
      moveCam(ctx, { pos: L(30.0, 1.3, 18.0), look: L(36.5, 6.5, 4.0), fov: 64 }, { pos: L(30.4, 1.4, 17.4), look: L(36.5, 7.2, 4.0), fov: 62 }, lt / 1.4, 0.8, '#cfdcff', 14);
      eggSprite(ctx, ck);
      shakeOn(ctx, [tc], 0.5, 0.35, 3);
      const m = P.motes; m.position.copy(L(33, 3, 11)); m.userData.set(t, 0.6);
    },
  },
  // ── "And something inside just went…"  — the crack pulses; the two of them look up
  {
    name: 'something inside', start: 'b24.w5-0.1', set: 'town',
    setup(ctx) {
      nightEgg(ctx);
      put(ctx, 'me', V(0, 0, 0), 0); nugAt(ctx, NUG_N.x, NUG_N.z, yawTo(NUG_N.x, NUG_N.z, EGG.x, EGG.z), 1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      const pul = 0.75 + 0.25 * Math.sin(t * 9);
      P.egg.userData.set(t, { crack: 0.62, glow: pul, lightK: 0, wobble: 0.3 });
      me.root.position.copy(L(KID_N.x, 0, KID_N.z)); me.root.rotation.set(0, yawTo(KID_N.x, KID_N.z, 31.5, 13.5), 0);
      me.pose('idle', t, { headPitch: -0.5, headYaw: 0.5, intensity: 0.2 }); me.face('sweat', 0.3);
      P.nug.userData.set(t, { lookY: 0.7, headPitch: -0.4, lid: 0 });
      keyLight(ctx, crackPt(L, 1.25), 50 * pul);
      moveCam(ctx, { pos: L(31.6, 0.7, 14.0), look: L(34.0, 4.6, 7.2), fov: 54 }, { pos: L(31.8, 0.7, 13.6), look: L(34.0, 4.8, 7.2), fov: 52 }, lt / 1.6, 1.0, '#cfdcff', 10);
      eggSprite(ctx, pul);
    },
  },
  // ── b25 "Ba-gawk."  — extreme close-up on the glowing crack; the whole town shakes, lamps flicker
  {
    name: 'ba-gawk', start: 'b25-0.1', set: 'town',
    setup(ctx) {
      nightEgg(ctx);
      const P = ctx.props;
      // foreground street lamp (flickers) between us and the egg
      addTo(ctx, P.lampFG, 30.6, 0, 13.2, 0.3);
      ctx.add(P.eye, ctx.set.root);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, tb = ctx.time('b25');
      P.egg.userData.set(t, { crack: 1, glow: 0.9 + 0.3 * Math.sin(t * 30), lightK: 0, shake: 1 });
      const cp = crackPt(L, 0.98), out = V(CR_DIR.x, 0, CR_DIR.z);
      keyLight(ctx, crackPt(L, 1.5), 5);
      const a = { pos: L(29.6, 2.4, 16.6), look: cp.clone().add(up(-1.6)), fov: 62 }, b = { pos: L(29.9, 2.3, 16.0), look: cp.clone().add(up(-1.2)), fov: 58 };
      moveCam(ctx, a, b, ease.outCubic(clamp(lt / 0.9, 0, 1)), 0.6, '#9fb4ff', 10);
      ctx.cam.shake(1.1 * Math.exp(-Math.max(0, t - tb) * 1.2), t, 9);
      lampFlicker(ctx, 1);
      { const on = hash(Math.floor(t * 13) * 1.7 + 0.3) > 0.4, u = P.lampFG.userData; u.coreM.emissiveIntensity = on ? 2.6 : 0.15; u.pl.intensity = on ? 7 : 0.3; }
      // a giant eye opens in the crack and glints
      { const e = P.eye, k = ease.outBack(clamp((t - (tb + 0.02)) / 0.16, 0, 1));
        e.visible = k > 0.01; e.position.copy(toLocal(ctx, crackPt(L, 1.03, 0.1))); e.lookAt(crackPt(L, 3, 0.1)); e.scale.set(2.8, 2.8 * Math.max(0.02, k), 1);
        bellGlint(ctx, crackPt(L, 1.1, 0.5).add(V(0.25, 0, 0)), clamp(hitPulse([tb + 0.12], t, 0.35) * 1.3, 0, 1), 4); }
      { const g = P.eggGlow; if (g.parent !== ctx.scene) ctx.add(g); g.position.copy(crackPt(L, 1.02)); const sz = 13 + 3 * Math.sin(t * 30); g.scale.set(sz, sz * 0.55, 1); g.material.opacity = 0.85; }
      stamp(ctx, 'BA-GAWK.', tb + 0.02, { y: 0.16, size: 160, fill: '#ffe14a', stroke: '#1d1d22', rot: -0.05, noShake: true });
    },
  },
  // ── b26 "In a really, really deep voice."  — the kid slowly turns to us (sweat); Nugget puffs up, proud
  {
    name: 'deep voice', start: 'b26-0.1', set: 'town',
    setup(ctx) {
      nightEgg(ctx);
      put(ctx, 'me', V(0, 0, 0), 0); nugAt(ctx, NUG_N.x, NUG_N.z, yawTo(NUG_N.x, NUG_N.z, 31, 12.5), 1);
    },
    update(ctx, lt) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me;
      P.egg.userData.set(t, { crack: 1, glow: 0.9 + 0.2 * Math.sin(t * 7), lightK: 0, wobble: 0.4 });
      const turn = ease.inOutSine(clamp(lt / 0.5, 0, 1));
      const ye = yawTo(KID_N.x, KID_N.z, EGG.x, EGG.z), y1 = yawTo(KID_N.x, KID_N.z, 30.6, 12.6), y0 = lerp(y1, ye, 0.45);   // opens already 3/4 to us
      me.root.position.copy(L(KID_N.x, 0, KID_N.z)); me.root.rotation.set(0, lerp(y0, y1, turn), 0);
      me.pose('stunned', t, { intensity: 0.4 }); me.face('sweat', 0.3);
      P.nug.userData.set(t, { puff: 1, smug: 1, spread: 0.25, lookX: 0.3 });
      keyLight(ctx, crackPt(L, 1.25, -1), 20);
      const f = humanFace(me), rs = V(0.15, 0, 0.14);   // ~0.35 m to the camera's right so Nugget's puffed chest fits
      moveCam(ctx, { pos: L(30.4, 1.3, 12.8).add(rs), look: f.clone().add(V(0.4, -0.5, 0)).add(rs), fov: 56 }, { pos: L(30.8, 1.3, 12.4).add(rs), look: f.clone().add(V(0.4, -0.45, 0)).add(rs), fov: 53 }, lt / 1.8, 1.0, '#9fb4ff', 10);
      eggSprite(ctx, 0.9);
    },
  },
  // ── b27 HUSS ×3 — slam + HUSS as the egg wobbles; the pigeon flaps away in a panic
  ...[0, 1, 2].map((i) => ({
    name: `egg huss #${i + 1}`, start: H('b27', i), set: 'town',
    setup(ctx) {
      nightEgg(ctx);
      put(ctx, 'me', V(0, 0, 0), 0); nugAt(ctx, NUG_N.x, NUG_N.z, yawTo(NUG_N.x, NUG_N.z, 31, 12.5), 1);
      put(ctx, 'pigeon', V(0, 0, 0), 0);
    },
    update(ctx) {
      const L = ctx.store.L, t = ctx.t, P = ctx.props, me = ctx.cast.me, hits = hussHits(ctx, 'b27');
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9, t0 = ctx.time('b27');
      P.egg.userData.set(t, { crack: 1, glow: 1 + 0.4 * hitPulse(hits, t, 0.2), lightK: 0, wobble: 1, shake: hitPulse(hits, t, 0.25) });
      me.root.position.copy(L(KID_N.x, 0, KID_N.z)); me.root.rotation.set(0, yawTo(KID_N.x, KID_N.z, 30.6, 12.6), 0);
      me.pose('slam', t, { hits }); me.face(dh < 0.22 ? 'huss' : 'determined', t);
      P.nug.userData.set(t, { puff: 1, smug: 1, flap: dh < 0.2 ? 1 : 0, spread: 0.2 });
      const pg = ctx.cast.pigeon, d = Math.max(0, t - t0 + 0.4);   // bolts from beside the kid up past the lens of the wide (#3)
      pg.root.position.copy(L(34.0 - 2.2 * d, 0.3 + 1.8 * d, 11.5 + 2.0 * d)); pg.root.rotation.set(0, yawTo(0, 0, -2.2, 2.0), 0);
      pg.pose('flap', t); pg.face('shocked', 0.3);
      keyLight(ctx, crackPt(L, 1.25, -1), 45 + 30 * hitPulse(hits, t, 0.2));
      const cams = [
        { pos: L(31.4, 0.5, 13.4), look: L(33.4, 1.0, 10.2), fov: 56 },
        faceCam(me, 2.3, 0.3, 0.42, 36, -0.1),
        { pos: L(30.5, 2.2, 16.0), look: L(37, 6.5, 3), fov: 64 },
      ];
      setCam(ctx, cams[i], 1.1, '#e8eeff', 10); ctx.cam.punch(hits, t, 0.12, 0.2);
      eggSprite(ctx, 1 + 0.4 * hitPulse(hits, t, 0.2));
    },
  })),
];
