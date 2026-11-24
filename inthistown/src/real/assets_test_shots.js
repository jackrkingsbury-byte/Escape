/*
 * src/real/assets_test_shots.js — QA scene for the Blender hero assets (src/real/assets.js). Timeline:
 * src/real/assets_test_timeline.json (8 shots × 2 s).
 *   node render.mjs --timeline src/real/assets_test_timeline.json --shots /src/real/assets_test_shots.js \
 *        --preview 1 --previewDir out/assets_test --workers 1 --timeout 3000
 * Shots: 0 stormy beach + wreck/debris · 1 rock line-up on pebbles · 2 cliff wall, sea stack, cave · 3 rainforest
 *        (buttress trees, ferns, vines, mud) · 4 palms from below · 5 the 11 tileable PBR sets under grazing light ·
 *        6 night beach with a campfire · 7 cave mouth close-up.
 * Plain engine render (ACES, no post) so what you see is the assets + storm_day / storm_night HDR lighting.
 * Everything is static or a pure function of time → deterministic, random-access safe.
 */
import * as THREE from 'three';
import { loadAssets, instance, part, pbrMaterial, loadHDR, envFromHDR, TEXTURE_SETS } from './assets.js';

export const lazySets = true;          // sets are built after init() has loaded the assets
export const cast = {};
export const captionOptions = {};

const ALL_SETS = Object.keys(TEXTURE_SETS);
let ENV = {};                          // name → { bg (equirect), pm (PMREM) }

export async function init(ctx) {
  await loadAssets();                                  // every model
  await loadAssets(ALL_SETS.map((n) => 'tex:' + n));  // tileable sets (decoded before first use)
  for (const n of ['storm_day', 'storm_night']) ENV[n] = { bg: await loadHDR(n), pm: await envFromHDR(ctx.renderer, n) };
}

// ───────────────────────────────────────────── set scaffolding
function makeSet(ctx, { env = 'storm_day', exposure = 1.0, fog = ['#59606a', 0.012], envIntensity = 1, bgIntensity = 0.55,
  sun = { pos: [14, 20, 16], color: '#dfe6ee', intensity: 1.1, box: 14 }, ground = { set: 'wet_sand', size: 400 }, build }) {
  const root = new THREE.Group();
  const set = { root, exposure, background: ENV[env].bg, fog: fog ? new THREE.FogExp2(fog[0], fog[1]) : null, anchors: {} };
  if (ground) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(ground.size, ground.size), pbrMaterial(ground.set, { worldSize: ground.size, ...(ground.opts || {}) }));
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    root.add(g);
  }
  if (sun) {
    const l = new THREE.DirectionalLight(sun.color, sun.intensity);
    l.position.fromArray(sun.pos);
    l.target.position.fromArray(sun.target || [0, 0, 0]);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    const b = sun.box;
    Object.assign(l.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 1, far: 120 });
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.03;
    root.add(l, l.target);
  }
  set.update = () => {
    ctx.scene.environment = ENV[env].pm;
    ctx.scene.environmentIntensity = envIntensity;
    ctx.scene.backgroundIntensity = bgIntensity;
    ctx.scene.backgroundBlurriness = 0;
  };
  build && build(root, set);
  return set;
}

const put = (root, name, position, rotationY = 0, scale = 1, extra = {}) => { const o = instance(name, { position, rotationY, scale, ...extra }); root.add(o); return o; };
const putPart = (root, name, p, position, rotationY = 0) => { const o = part(name, p, { position, rotationY }); root.add(o); return o; };

function sea(root, z0 = -26, color = '#0b0f13') {
  const m = pbrMaterial('wet_sand', { worldSize: 60, normalScale: 0.35, color: '#000000', roughness: 0.18 });
  m.color.set(color);
  m.roughnessMap = null; m.roughness = 0.12; m.aoMap = null; m.map = null;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(800, 400), m);
  s.rotation.x = -Math.PI / 2;
  s.position.set(0, 0.03, z0 - 200);
  root.add(s);
}

// ───────────────────────────────────────────── sets
export const sets = {
  beach: (ctx) => makeSet(ctx, {
    exposure: 1.5, fog: ['#5d646d', 0.010],
    build(root) {
      sea(root, -24);
      put(root, 'wreck_boat', [0, 0, -0.5], 0.35);
      putPart(root, 'planks', 'plank_long', [2.6, 0.0, 1.8], 0.9);
      putPart(root, 'planks', 'plank_broken', [-2.2, 0.0, 2.2], -0.4);
      putPart(root, 'planks', 'hull_fragment', [3.4, 0.0, -0.8], 2.2);
      putPart(root, 'planks', 'plank_splintered', [1.1, 0.0, 3.1], 0.2);
      put(root, 'crate', [-2.6, 0, 0.6], 0.6);
      put(root, 'rope_coil', [1.8, 0, 2.6], 0);
      putPart(root, 'driftwood_logs', 'driftwood_log', [-3.8, 0, 3.2], 0.3);
      putPart(root, 'driftwood_logs', 'driftwood_root', [5.2, 0, 1.0], -1.1);
      put(root, 'rock_boulder', [-5.5, 0, -1.5], 0.4);
      put(root, 'rock_slab', [4.8, 0, -2.8], 1.2);
      put(root, 'rock_spire', [7.5, 0, -9.5], 0.0, 1.3);
      put(root, 'palm_a', [-9, 0, -9], 0.3);
      put(root, 'palm_b', [-4.5, 0, -13], 2.0);
      put(root, 'palm_a', [9, 0, -14], 3.6, 0.9);
      put(root, 'sea_stack', [26, 0, -75], 0.4, 1.1);
      put(root, 'cliff_wall', [-46, 0, -70], 0.6, 1.4);
    },
  }),
  rocks: (ctx) => makeSet(ctx, {
    exposure: 1.6, ground: { set: 'beach_pebbles', size: 300 }, fog: ['#5d646d', 0.03], sun: { pos: [8, 10, 9], color: '#e4e9ef', intensity: 1.6, box: 6 },
    build(root) {
      put(root, 'rock_boulder', [-1.4, 0, 0.6], 0.3);
      put(root, 'rock_slab', [1.3, 0, 0.9], -0.5);
      put(root, 'rock_spire', [-0.2, 0, -1.4], 0.9);
      put(root, 'rock_mossy', [2.6, 0, -1.6], 2.1);
      put(root, 'rock_block', [-2.8, 0, -1.2], 0.6);
      put(root, 'rock_mossy_big', [0.6, 0, -4.4], 1.4);
    },
  }),
  cliffs: (ctx) => makeSet(ctx, {
    exposure: 1.5, fog: ['#5f6670', 0.008], sun: { pos: [30, 35, 25], color: '#dfe6ee', intensity: 1.3, box: 30 },
    build(root) {
      sea(root, -14);
      put(root, 'cave_arch', [-9, 0, -8], 0.35);
      put(root, 'cliff_wall', [8, 0, -20], -0.3);
      put(root, 'sea_stack', [-2, 0, -46], 0.0);
      put(root, 'rock_boulder', [3.5, 0, 6], 0.0, 1.4);
      put(root, 'rock_slab', [-2.5, 0, 9], 1.0);
      put(root, 'rock_spire', [6, 0, 2], 1.0, 1.4);
    },
  }),
  forest: (ctx) => makeSet(ctx, {
    exposure: 2.4, ground: { set: 'forest_mud', size: 300 }, fog: ['#2f3733', 0.03], envIntensity: 0.45, bgIntensity: 0.35,
    sun: { pos: [-10, 30, 12], color: '#d7e0e4', intensity: 0.9, box: 22 },
    build(root) {
      put(root, 'tree_kapok', [-2, 0, -10], 0.4);
      put(root, 'tree_fig', [9, 0, -18], 2.0);
      put(root, 'tree_kapok', [-16, 0, -26], 3.0, 0.9);
      put(root, 'vines_hanging', [1.5, 10.5, -6.5], 0.3);
      put(root, 'vines_hanging', [-4.5, 11, -7], 1.7, 1.1);
      put(root, 'fern_a', [1.6, 0, -1.2], 0.2);
      put(root, 'fern_b', [-1.8, 0, -0.4], 1.0);
      put(root, 'undergrowth_broadleaf', [3.4, 0, -3.5], 2.0);
      put(root, 'fern_a', [-4.2, 0, -4.8], 2.7, 1.2);
      put(root, 'fern_b', [5.5, 0, -7.5], 0.3, 1.1);
      put(root, 'undergrowth_broadleaf', [-6, 0, -9], 0.9, 1.2);
      put(root, 'rock_mossy', [0.3, 0, -3.2], 0.8);
      put(root, 'rock_mossy_big', [-7, 0, -3], 2.2);
      putPart(root, 'driftwood_logs', 'driftwood_log', [2.6, 0, 0.8], 2.6);
    },
  }),
  palms: (ctx) => makeSet(ctx, {
    exposure: 1.5, fog: ['#5d646d', 0.006], sun: { pos: [10, 25, 14], color: '#e2e8ee', intensity: 1.2, box: 14 },
    build(root) {
      sea(root, -30);
      put(root, 'palm_a', [-1.5, 0, -3], 0.2);
      put(root, 'palm_b', [3.5, 0, -6], 2.4);
      put(root, 'palm_a', [-6, 0, -12], 4.0, 0.85);
      put(root, 'fern_b', [0.8, 0, -1.5], 0.0, 0.8);
      put(root, 'rock_boulder', [2.2, 0, -2.0], 1.0, 0.8);
    },
  }),
  swatches: (ctx) => makeSet(ctx, {
    exposure: 1.4, ground: null, fog: null, sun: { pos: [-6, 4.5, -3], color: '#ffffff', intensity: 2.2, box: 6 },
    build(root, set) {
      const cols = 3, S = 1.5, gap = 0.12;
      ALL_SETS.forEach((name, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(S, S), pbrMaterial(name, { worldSize: S }));
        m.rotation.x = -Math.PI / 2;
        m.position.set((c - 1) * (S + gap), 0, (r - 1.5) * (S + gap));
        m.receiveShadow = true;
        root.add(m);
      });
      const base = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#16181a', roughness: 0.9 }));
      base.rotation.x = -Math.PI / 2; base.position.y = -0.01; root.add(base);
    },
  }),
  night: (ctx) => makeSet(ctx, {
    env: 'storm_night', exposure: 2.0, fog: ['#07090c', 0.03], envIntensity: 1.0, bgIntensity: 1.0,
    sun: { pos: [-8, 14, -10], color: '#9fb2cc', intensity: 0.08, box: 10 },
    build(root, set) {
      sea(root, -18, '#05070a');
      put(root, 'wreck_boat', [-1.5, 0, -2.5], 0.2);
      putPart(root, 'driftwood_logs', 'driftwood_log', [0.9, 0, 1.2], 0.5, 0.7);
      putPart(root, 'driftwood_logs', 'driftwood_twisted', [-0.4, 0, 2.2], 2.0);
      put(root, 'rope_coil', [-1.6, 0, 1.6], 0.4);
      put(root, 'crate', [2.0, 0, -0.6], -0.4);
      put(root, 'rock_boulder', [2.8, 0, 1.8], 1.4, 0.8);
      put(root, 'palm_b', [5, 0, -6], 1.2);
      // campfire: a few charred sticks (driftwood parts, scaled) + warm flickering light + ember glow
      const fire = new THREE.Group(); fire.position.set(0.3, 0, 0.8);
      for (let k = 0; k < 5; k++) {
        const st = part('driftwood_logs', 'driftwood_twisted', { scale: 0.32 });
        st.rotation.set(0.35, (k / 5) * Math.PI * 2, 0.0);
        st.position.set(Math.cos(k) * 0.05, 0.02, Math.sin(k) * 0.05);
        fire.add(st);
      }
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(5.0, 1.6, 0.35) }));
      ember.scale.y = 0.35; ember.position.y = 0.04; fire.add(ember);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 2.4, 0.6), transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
      flame.position.y = 0.3; flame.visible = false; fire.add(flame);   // (placeholder; real flames come from the FX kit)
      const fl = new THREE.PointLight('#ff8a3a', 7, 16, 2);
      fl.position.set(0, 0.55, 0); fl.castShadow = true; fl.shadow.mapSize.set(1024, 1024); fl.shadow.bias = -0.002;
      fire.add(fl);
      root.add(fire);
      set.onTime = (t) => { const f = 1 + 0.18 * Math.sin(t * 17.3) + 0.12 * Math.sin(t * 29.1 + 1.3); fl.intensity = 7 * f; flame.scale.set(1, f, 1); };
    },
  }),
  cave: (ctx) => makeSet(ctx, {
    exposure: 1.6, fog: ['#5d646d', 0.012], sun: { pos: [12, 18, 20], color: '#dfe6ee', intensity: 1.4, box: 14 },
    build(root) {
      put(root, 'cave_arch', [0, 0, -4], 0.0);
      put(root, 'rock_mossy', [-3.2, 0, 0.6], 0.5);
      put(root, 'rock_block', [2.6, 0, 1.2], 2.0);
      put(root, 'fern_a', [-4.6, 0, -1.2], 0.6);
      put(root, 'undergrowth_broadleaf', [4.4, 0, -1.6], 1.4);
      put(root, 'vines_hanging', [-1.0, 7.6, -1.8], 0.0, 0.8);
      putPart(root, 'driftwood_logs', 'driftwood_root', [1.0, 0, 2.6], 0.4);
    },
  }),
};

// ───────────────────────────────────────────── shots (2 s each)
const shot = (name, start, set, cam, move) => ({
  name, start, set,
  setup(ctx) { ctx.cam.set(cam); },
  update(ctx, lt, u) {
    if (ctx.set.onTime) ctx.set.onTime(ctx.t);
    if (move) ctx.cam.move(cam, move, ctx.ease.inOutSine ? ctx.ease.inOutSine(u) : u);
  },
});

export const shots = [
  shot('beach wreck', 0, 'beach', { pos: [4.6, 1.25, 5.6], look: [-0.6, 1.3, -2.5], fov: 56 }, { pos: [4.2, 1.2, 5.2], look: [-0.6, 1.3, -2.5], fov: 56 }),
  shot('rock line-up', 2, 'rocks', { pos: [0.4, 1.9, 5.6], look: [0, 0.45, -1.2], fov: 48 }),
  shot('cliffs + cave', 4, 'cliffs', { pos: [2, 2.4, 26], look: [-1, 7.5, -14], fov: 60 }),
  shot('rainforest', 6, 'forest', { pos: [3.0, 1.6, 15], look: [-1.5, 8.5, -10], fov: 66 }),
  shot('palms', 8, 'palms', { pos: [3.5, 1.2, 7.5], look: [-0.5, 6.5, -5], fov: 62 }),
  shot('pbr swatches', 10, 'swatches', { pos: [0, 5.6, 4.6], look: [0, 0, -0.2], fov: 55 }),
  shot('night campfire', 12, 'night', { pos: [2.6, 1.3, 4.4], look: [-0.3, 0.6, -0.6], fov: 50 }),
  shot('cave mouth', 14, 'cave', { pos: [2.5, 1.8, 15], look: [0, 3.2, -4], fov: 56 }),
];
