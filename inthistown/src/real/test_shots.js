/*
 * src/real/test_shots.js — look-dev / regression scene for the photoreal kit (src/real/*). Timeline: test_timeline.json.
 *   node render.mjs --timeline src/real/test_timeline.json --shots /src/real/test_shots.js --preview 1 \
 *        --previewDir out/real_test --workers 1 --timeout 3000 --scale 0.75
 * Shots: 0 rainforest wide (rain, fog, light shafts) · 1 avatar close-up in rain (DOF, wet hoodie, drips) ·
 *        2 stormy beach at dusk (waves, foam, wreck, palms, cliff) · 3 night lightning on the beach · 4 campfire in a cave.
 *
 * Pattern for real shots (copy this):
 *   - sets are built with env.js / weather.js builders inside a `realSet(ctx, build)` wrapper that bakes the PMREM
 *     environment, keeps a list of updatables and calls setFrame({t}) every frame;
 *   - `export const renderFrame = makeRenderFrame((ctx) => createPost(ctx, { msaa: 4 }))` routes the engine through post.js;
 *   - each shot may carry `post: (ctx, lt, u) => ({ ...cfg })` (applied each frame by makeRenderFrame) — set-level
 *     defaults come from set.post and are merged first;
 *   - characters get makeReal() once in init(ctx).
 */
import * as THREE from 'three';
import { MAIN } from '../cast.js';
import { clamp, lerp, smooth, ease } from '../lib/util.js';
import { createPost, makeRenderFrame } from './post.js';
import { RU, setFrame } from './materials.js';
import {
  makeSky, bakeEnvironment, makeTerrain, makeForest, makeFerns, makePalms, makeLog, makeOcean, makeBeach, makeWreck, makeCrate,
  makePlanks, makeRock, makeCliff, makeCave, makeCampfire, makeLightRig, makeContactShadow,
} from './env.js';
import { makeRain, makeSplashes, makeDrips, makeFogCards, makeLightShafts, makeLightning } from './weather.js';
import { makeReal } from './realchar.js';

export const cast = { me: MAIN.me };
export const lazySets = false;   // build every set at init in declaration order: set build order then never depends on where rendering starts (bit-exact determinism)
export const captionOptions = {};

// ───────────────────────────────────────────────────────────────────────────── set wrapper
function realSet(ctx, { sky, env = {}, exposure = 1, post = {}, build }) {
  const root = new THREE.Group();
  const parts = [];
  const add = (p) => { if (p && p.root) root.add(p.root); if (p && p.update) parts.push(p); return p; };
  const skyP = add(makeSky(sky));
  const envTex = bakeEnvironment(ctx.renderer, null, sky, env);
  const set = { root, sky: skyP, envTex, exposure, post, background: new THREE.Color('#000000'), fog: null, anchors: {} };
  Object.assign(set, build({ root, add, set }) || {});
  set.update = (t) => {
    setFrame({ t });
    ctx.scene.environment = envTex;
    ctx.scene.environmentIntensity = env.intensity ?? 1;
    for (const p of parts) p.update(t, ctx.camera);
    if (set.onUpdate) set.onUpdate(t);
  };
  return set;
}
const shotPost = (extra) => (ctx, lt, u) => {
  const base = ctx.set && ctx.set.post ? ctx.set.post : {};
  const e = typeof extra === 'function' ? extra(ctx, lt, u) : extra || {};
  return deepMerge(base, e);
};
function deepMerge(a, b) {
  const o = { ...a };
  for (const k of Object.keys(b)) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) ? deepMerge(a[k], b[k]) : b[k];
  return o;
}

// ───────────────────────────────────────────────────────────────────────────── sets
export const sets = {
  forest: (ctx) => realSet(ctx, {
    sky: { zenith: '#9aa3a6', horizon: '#d8dee0', cloudColor: '#c9d0d2', cloudDark: '#7d8689', cover: 0.9, sunDir: [0.35, 0.8, -0.4], sunIntensity: 0.6, brightness: 1.6 },
    env: { intensity: 0.9 },
    exposure: 1.0,
    post: {
      fog: { color: [0.55, 0.6, 0.62], density: 0.028, height: 0, falloff: 0.05, start: 3, noise: 0.75, noiseScale: 0.06, wind: [0.6, 0, 0.2], sunDir: [0.35, 0.8, -0.4], glow: 0.35, glowPower: 4 },
      bloom: { strength: 0.12, threshold: 0.9 }, grade: { saturation: 0.35 },
    },
    build: ({ add, set }) => {
      const terrain = add(makeTerrain({ size: 140, segments: 170, texture: 'mud', tile: 2.2, amp: 1.0, freq: 0.05, puddles: 0.45, seed: 4 }));
      const H = terrain.heightAt;
      const clear = [{ x: 0, z: 0, r: 3.2 }, { x: 0.5, z: 7, r: 3.0 }, { x: 0.5, z: 3.5, r: 2.5 }];
      add(makeForest({ heightAt: H, seed: 3, castShadow: true, placements: [[-3.6, -2.5, 1.15], [4.2, -7, 1.0], [-6.5, -11, 0.9], [2.5, -15, 1.1], [7.5, -1.5, 0.85], [-9, -4, 0.95]] }));
      add(makeForest({ count: 120, area: [130, 130], heightAt: H, clear: [...clear, { x: 0, z: -6, r: 9 }], seed: 31, lod: 'low' }));
      add(makeForest({ count: 14, area: [40, 40], center: [0, -10], heightAt: H, clear, seed: 33 }));
      add(makeFerns({ count: 420, area: [40, 50], center: [0, -6], heightAt: H, clear: [{ x: 0.2, z: 0.4, r: 1.3 }, { x: 0.6, z: 7, r: 1.6 }, { x: 0.4, z: 2.3, r: 1.1 }], seed: 5 }));
      add(makeFerns({ count: 90, area: [36, 40], center: [0, -8], heightAt: H, clear: [{ x: 0.2, z: 0.4, r: 2.2 }, { x: 0.6, z: 6.5, r: 3.2 }, { x: 0.4, z: 3, r: 2 }], seed: 6, kind: 'leafy', scale: [0.9, 1.8] }));
      add(makeLog({ length: 8, radius: 0.5, pos: [3.2, H(3.2, -3.5), -3.5], yaw: 0.5, seed: 13 }));
      add(makeRock({ radius: 0.9, pos: [-2.0, H(-2, 1.5) + 0.1, 1.5], seed: 3, moss: 0.7 }));
      add(makeRock({ radius: 0.5, pos: [1.6, H(1.6, 2.2) + 0.05, 2.2], seed: 5, moss: 0.6 }));
      add(makeLightShafts({ origins: [[-6, 26, -16], [2, 26, -20], [7, 26, -12], [-1, 26, -9]], dir: [0.3, -1, 0.25], length: 34, radius: [0.8, 2.2], intensity: 0.32 }));
      set.rain = add(makeRain({ count: 5000, box: [22, 14, 22], speed: 9.5, wind: [1.4, 0.4], length: 0.5, opacity: 0.36, lightDir: [0.35, 0.8, -0.4], backlight: 1.8 }));
      add(makeSplashes({ count: 700, radius: 8, heightAt: H, size: 0.1, opacity: 0.45 }));
      add(makeFogCards({ count: 14, area: [60, 60], center: [0, -18], y: [0.4, 3.5], size: [8, 16], opacity: 0.26, color: '#b8c2c4' }));
      add(makeDrips({ points: [[-1.2, 1.6, -1.0], [-0.8, 1.4, -1.6], [1.1, 1.2, -1.2], [0.6, 1.8, -2.2]], floorY: (i, p) => H(p.x, p.z) + 0.02 }));
      const rig = makeLightRig('forest', { shadows: true, shadowBox: 7, target: [0, 1, 0], keyDir: [-0.55, 0.75, 0.35] });
      const rigC = makeLightRig('closeup', { shadows: true, shadowBox: 3, target: [0.2, 1.5, 0.4], keyDir: [-0.8, 0.45, 0.45], intensity: 0.6, practical: { pos: [-1.1, 0.35, 0.7], intensity: 3.2, color: '#e6eef2', distance: 5 } });
      set.root.add(rig.root, rigC.root); set.rig = rig; set.rigC = rigC;
      const blob = makeContactShadow(0.75, 0.7); blob.position.set(0.2, H(0.2, 0.4) + 0.03, 0.4); set.root.add(blob);
      return { heightAt: H };
    },
  }),

  beach: (ctx) => realSet(ctx, {
    sky: { zenith: '#20272a', horizon: '#8a8784', cloudColor: '#6e706e', cloudDark: '#16191b', cover: 0.86, sunDir: [-0.25, 0.06, -1], sunColor: '#fff1e0', sunIntensity: 4.0, brightness: 1.0, speed: 2, scale: 1.4 },
    env: { intensity: 0.75 },
    exposure: 1.0,
    post: {
      fog: { color: [0.42, 0.44, 0.45], density: 0.006, height: 0, falloff: 0.04, start: 6, noise: 0.6, noiseScale: 0.02, wind: [2, 0, 0.5], sunDir: [-0.25, 0.07, -1], sunColor: [1.0, 0.92, 0.8], glow: 0.9, glowPower: 8, sky: 0.15 },
      bloom: { strength: 0.16, threshold: 1.0 }, grade: { saturation: 0.4 },
    },
    build: ({ add, set }) => buildBeach(add, set, 'dusk'),
  }),

  night: (ctx) => realSet(ctx, {
    sky: { zenith: '#06080a', horizon: '#1a2026', cloudColor: '#262c30', cloudDark: '#07090a', cover: 0.95, sunDir: [0.4, 0.3, -1], sunColor: '#9fb4cc', sunIntensity: 0.25, brightness: 1.0, speed: 3 },
    env: { intensity: 0.6, groundColor: '#050607' },
    exposure: 1.2,
    post: {
      fog: { color: [0.05, 0.06, 0.07], density: 0.008, height: 0, falloff: 0.04, start: 6, sky: 0.3, noise: 0.6, noiseScale: 0.02, wind: [2, 0, 0.5], sunDir: [0.4, 0.3, -1], glow: 0.5 },
      bloom: { strength: 0.2, threshold: 0.9 }, grade: { saturation: 0.25, contrast: 1.35 },
    },
    build: ({ add, set }) => {
      const r = buildBeach(add, set, 'night');
      const lightning = makeLightning({ strikes: [{ t: 6.25, pos: [-40, 140, -260], ground: [-25, 0, -200], seed: 3, power: 1.2 }, { t: 7.35, pos: [60, 150, -300], ground: [48, 0, -240], seed: 9, power: 0.8 }] });
      set.root.add(lightning.root); set.lightning = lightning;
      return r;
    },
  }),

  cave: (ctx) => realSet(ctx, {
    sky: { zenith: '#8f989b', horizon: '#dfe4e6', cloudColor: '#c8cfd1', cloudDark: '#80898c', cover: 0.9, sunDir: [0, 0.6, 1], sunIntensity: 0.5, brightness: 2.2 },
    env: { intensity: 0.12, groundColor: '#0a0b0c' },
    exposure: 1.0,
    post: {
      fog: { color: [0.42, 0.46, 0.48], density: 0.06, height: 0, falloff: 0.08, start: 14, noise: 0.5, noiseScale: 0.1, wind: [0, 0, 0.3], sunDir: [0, 0.3, 1], sunColor: [1, 1, 1], glow: 0.6, glowPower: 3 },
      bloom: { strength: 0.1, threshold: 1.6 },
      grade: { saturation: 0.55, highlightAmt: 0.55, temperature: -0.1 },
    },
    build: ({ add, set }) => {
      const cave = add(makeCave({ radius: 9, length: 1.6, height: 0.62, seed: 8 }));
      const fire = add(makeCampfire({ scale: 1, intensity: 1.0 }));
      fire.root.position.set(-0.55, 0.02, -0.85);
      const seat = add(makeRock({ radius: 0.45, pos: [-0.9, 0.12, 0.45], seed: 21, squash: [1.2, 0.75, 1.0], moss: 0, wet: 0.3 }));
      add(makeDrips({ points: cave.dripTips, floorY: 0.03, period: [1.0, 2.6] }));
      // rain curtain outside the mouth
      const mz = cave.mouth.z - 1.0;
      add(makeRain({ count: 5000, box: [30, 14, 34], speed: 9, wind: [0.3, 0.2], length: 0.6, opacity: 0.55, lightDir: [0, 0.2, 1], backlight: 3, far: 30, clip: { min: [-40, -5, mz], max: [40, 40, 200] } }));
      const outside = add(makeTerrain({ size: 120, segments: 80, texture: 'mud', tile: 3, amp: 0.8, center: [0, 70], puddles: 0.4, seed: 9 }));
      outside.root.position.y = -0.2;
      add(makeForest({ count: 26, area: [90, 60], center: [0, 55], clear: [{ x: 0, z: 22, r: 10 }], heightAt: outside.heightAt, seed: 44, height: [22, 34] }));
      add(makeFerns({ count: 60, area: [30, 14], center: [0, 24], heightAt: outside.heightAt, seed: 45, kind: 'leafy', scale: [1.2, 2.2] }));
      const rig = makeLightRig('cave', { target: [0, 1, 0] });
      set.root.add(rig.root); set.rig = rig;
      const blob = makeContactShadow(0.7, 0.6); blob.position.set(-0.9, 0.035, 0.6); set.root.add(blob);
      set.fire = fire; set.cave = cave;
      return { heightAt: () => 0 };
    },
  }),
};

function buildBeach(add, set, mode) {
  const beach = add(makeBeach({ size: [220, 140], center: [0, 40], shoreZ: 0, slope: 0.07, wetBand: 6 }));
  const H = beach.heightAt;
  const ocean = add(makeOcean({ size: 700, segments: 300, level: 0.05, shore: beach.shore, scale: mode === 'night' ? 1.25 : 1.1,
    color: mode === 'night' ? '#05090b' : '#0e171a', deepColor: '#020405' }));
  set.ocean = ocean;
  const wreck = add(makeWreck({ length: 8.5, beam: 3, seed: 4, broken: 0.45 }));
  wreck.root.position.set(-4.2, H(-4.2, 6) - 0.75, 6); wreck.root.rotation.set(0.08, 0.6, 0.42);
  const crate = add(makeCrate({ size: 0.85 })); crate.root.position.set(1.6, H(1.6, 4.2) - 0.12, 4.2);
  add(makePlanks({ count: 14, area: [14, 8], center: [-1, 6], heightAt: H }));
  add(makeRock({ radius: 2.2, pos: [9, H(9, 3) + 0.3, 3], seed: 7, moss: 0.15, squash: [1.3, 0.7, 1] }));
  add(makeRock({ radius: 1.2, pos: [6.5, H(6.5, 1.5) + 0.1, 1.5], seed: 8, moss: 0.1 }));
  add(makeRock({ radius: 1.6, pos: [-11, H(-11, 1) + 0.0, 1], seed: 9, moss: 0.05 }));
  add(makeCliff({ length: 70, height: 26, depth: 12, pos: [-48, 0, 10], yaw: 1.25, seed: 6 }));
  add(makeCliff({ length: 50, height: 20, depth: 10, pos: [44, 0, 18], yaw: -1.3, seed: 16 }));
  add(makePalms({ placements: [[6, 16, 1.0, 2.6], [10, 19, 0.9, 2.2], [-8, 20, 1.1, 0.4], [3, 24, 0.95, 1.4], [-14, 17, 1.0, 0.9], [15, 15, 0.85, 3.0]], heightAt: H, lean: 0.5 }));
  add(makeFerns({ count: 120, area: [60, 20], center: [0, 26], heightAt: H, seed: 15, kind: 'leafy', scale: [0.8, 1.6] }));
  set.rain = add(makeRain({ count: 5000, box: [24, 16, 24], speed: 10, wind: [3.5, 1.0], length: 0.6, opacity: mode === 'night' ? 0.3 : 0.38, lightDir: [-0.25, 0.1, -1], backlight: 3 }));
  add(makeSplashes({ count: 600, radius: 9, heightAt: H, size: 0.1, opacity: 0.4 }));
  add(makeFogCards({ count: 14, area: [160, 60], center: [0, -40], y: [0.6, 3], size: [18, 34], opacity: mode === 'night' ? 0.1 : 0.2, horizontal: true, drift: [1.2, 0, 0.3], color: mode === 'night' ? '#20262a' : '#a9b1b3' }));
  const rig = makeLightRig(mode === 'night' ? 'night' : 'beachDusk', { shadows: mode !== 'night', shadowBox: 9, target: [0, 1, 4] });
  set.root.add(rig.root); set.rig = rig;
  return { heightAt: H };
}

// ───────────────────────────────────────────────────────────────────────────── film hooks
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
export const renderFrame = makeRenderFrame((ctx) => {
  const p = createPost(ctx, { msaa: QS.has('msaa') ? +QS.get('msaa') : 0 });
  window.__realPost = p; window.__realCtx = ctx;   // test hooks for the bench / look-dev scripts
  return p;
});

export function init(ctx) {
  ctx.props.real = makeReal(ctx.cast.me, { wet: 0.9, drips: 14 });
}
const real = (ctx) => ctx.props.real;

// ───────────────────────────────────────────────────────────────────────────── shots
export const shots = [
  {
    name: 'rainforest wide', start: 0, set: 'forest', cast: ['me'],
    setup(ctx) {
      const H = ctx.set.heightAt;
      ctx.place('me', [0.2, H(0.2, 0.4), 0.4], { yaw: 0.35 });
      ctx.cast.me.pose('idle', 0); ctx.cast.me.face('neutral', 0);
      real(ctx).setWet(0.9);
      ctx.set.rain.uniforms.uOpacity.value = 0.36; ctx.set.rain.uniforms.uBacklight.value = 1.8;
      ctx.set.rig.root.visible = true; ctx.set.rigC.root.visible = false;
    },
    update(ctx, lt) {
      const H = ctx.set.heightAt;
      ctx.cast.me.pose('idle', lt, { headPitch: -0.35, headYaw: 0.3 });
      real(ctx).update(ctx.t);
      const y = H(0.6, 7.5);
      ctx.cam.set({ pos: [0.9 - lt * 0.12, y + 1.05, 7.6 - lt * 0.35], look: [-0.2, y + 3.2, -12], fov: 50 });
      ctx.cam.shake(0.05, ctx.t, 3);
    },
    post: shotPost({ dof: { focus: 7.5, aperture: 0.35, maxBlur: 10 } }),
  },
  {
    name: 'closeup rain', start: 2, set: 'forest', cast: ['me'],
    setup(ctx) {
      const H = ctx.set.heightAt;
      ctx.place('me', [0.2, H(0.2, 0.4), 0.4], { yaw: 0.25 });
      real(ctx).setWet(1);
      ctx.set.rig.root.visible = false; ctx.set.rigC.root.visible = true;
      ctx.set.rain.uniforms.uOpacity.value = 0.6; ctx.set.rain.uniforms.uBacklight.value = 3.5;
    },
    update(ctx, lt) {
      const H = ctx.set.heightAt, gy = H(0.2, 0.4);
      ctx.cast.me.pose('idle', lt, { headYaw: -0.15, headPitch: -0.08 });
      ctx.cast.me.face('determined', ctx.t);
      real(ctx).update(ctx.t);
      ctx.cam.set({ pos: [1.25 - lt * 0.04, gy + 1.75, 2.95 - lt * 0.08], look: [0.15, gy + 1.45, 0.4], fov: 48 });
      ctx.scene.environmentIntensity = 0.45;
      ctx.cam.shake(0.04, ctx.t, 5);
    },
    post: shotPost({ dof: { focus: 2.75, aperture: 1.6, maxBlur: 18 }, fog: { color: [0.32, 0.36, 0.38] }, exposure: 0.9 }),
  },
  {
    name: 'beach dusk', start: 4, set: 'beach', cast: ['me'],
    setup(ctx) {
      const H = ctx.set.heightAt;
      ctx.place('me', [-0.6, H(-0.6, 3.2), 3.2], { yaw: Math.PI + 0.25 });
      real(ctx).setWet(0.85);
    },
    update(ctx, lt) {
      const H = ctx.set.heightAt;
      ctx.cast.me.pose('idle', lt, { headYaw: 0.2 });
      real(ctx).update(ctx.t);
      ctx.cam.set({ pos: [3.2 - lt * 0.2, H(3.2, 12) + 1.5, 12.5], look: [-2.2, 1.0, -6], fov: 46 });
      ctx.cam.shake(0.06, ctx.t, 7);
    },
    post: shotPost({}),
  },
  {
    name: 'night lightning', start: 6, set: 'night', cast: ['me'],
    setup(ctx) {
      const H = ctx.set.heightAt;
      ctx.place('me', [-0.6, H(-0.6, 3.2), 3.2], { yaw: Math.PI + 0.1 });
      real(ctx).setWet(1);
    },
    update(ctx, lt) {
      const H = ctx.set.heightAt;
      ctx.cast.me.pose('idle', lt, { headPitch: -0.2 });
      real(ctx).update(ctx.t);
      const flash = ctx.set.lightning.update(ctx.t);
      ctx.set.sky.setFlash(flash, ctx.set.lightning.flashDir());
      ctx.set.rig.update(ctx.t, flash);
      ctx.scene.environmentIntensity = 0.6 + flash * 1.0;
      ctx.store.flash = flash;
      ctx.cam.set({ pos: [1.2, H(1.2, 9) + 0.9, 9.5], look: [-1.0, 2.6, -10], fov: 44 });
      ctx.cam.shake(0.05 + flash * 0.2, ctx.t, 9);
    },
    post: shotPost((ctx) => ({ flash: ctx.store.flash || 0 })),
  },
  {
    name: 'cave campfire', start: 8, set: 'cave', cast: ['me'],
    setup(ctx) {
      ctx.place('me', [-0.9, 0, 0.6], { yaw: Math.PI - 0.3 });
      real(ctx).setWet(0.6);
    },
    update(ctx, lt) {
      ctx.cast.me.pose('sit', lt, { hands: 'lap', seatHeight: 0.42 });
      ctx.cast.me.face('sad', ctx.t);
      real(ctx).update(ctx.t);
      ctx.cam.set({ pos: [0.6 - lt * 0.05, 1.15, -5.6], look: [-0.8, 0.85, 1.5], fov: 44 });
      ctx.cam.shake(0.04, ctx.t, 11);
    },
    post: shotPost({ dof: { focus: 6.4, aperture: 0.45, maxBlur: 10 } }),
  },
  {
    name: 'coast overview', start: 10, set: 'beach', cast: [],
    setup(ctx) {},
    update(ctx, lt) {
      ctx.cam.set({ pos: [14 - lt, 16, 30], look: [-6, 0, -20], fov: 50 });
    },
    post: shotPost({}),
  },
];
