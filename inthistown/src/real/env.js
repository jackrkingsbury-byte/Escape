/*
 * src/real/env.js — photoreal environment builders: storm sky + PMREM reflections, rainforest terrain with puddles,
 * wind-swayed instanced vegetation, Gerstner ocean with foam, beach + wreckage, rocks / cliffs, cave, campfire, light rigs.
 *
 * Conventions: metres, Y up. Every builder returns { root: THREE.Group, update(t), ...extras } and is deterministic
 * (seeded; animation is a pure function of t). Builders never add themselves to a scene; parent `root` where you want.
 * Call update(t) every frame for animated pieces (or let a set's update do it). Materials share RU uniforms
 * (materials.js): setFrame({ t }) once per frame also drives wind sway, ripples and flame shaders.
 *
 * ─── Sky / environment ─────────────────────────────────────────────────────────────────────────────────────────────
 *   makeSky(opts) → { root, mesh, uniforms, update(t), setFlash(v, dir?) }
 *     opts: zenith '#1a2024', horizon '#6b7477', cloudColor '#8a9396', cloudDark '#1d2326', sunDir [0.3,0.25,-1],
 *           sunColor '#ffffff', sunIntensity 1.5 (HDR glow around sunDir), cover 0.75 (0..1 cloud coverage),
 *           speed 1 (cloud drift ×), scale 1, brightness 1, radius 900
 *   bakeEnvironment(renderer, scene, skyOpts?, { groundColor '#141618', intensity }) → PMREM texture. Renders a copy of
 *     the sky (+ a dark ground hemisphere) into a PMREM cube; sets scene.environment (and returns it). Cost ≈ 0.3–1 s.
 *
 * ─── Ground ────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   makeTerrain(opts) → { root, mesh, heightAt(x, z), material }
 *     opts: size 120, segments 160, texture 'mud', tile 3 (m per texture repeat), height (x,z)→y fn | null (default FBM),
 *           amp 1.2, freq 0.04, seed 1, wet 0.85, puddles 0.35, puddleScale 0.07, ripples 1, color '#ffffff',
 *           roughness 1, normalScale 1.2, center [0,0]
 *
 * ─── Vegetation (InstancedMesh + vertex wind) ──────────────────────────────────────────────────────────────────────
 *   makeForest(opts) → { root, trees: [{x,z,s,h}], heightAt }   tall buttressed rainforest trees with canopy cards,
 *     branches, hanging lianas. opts: count 40, area [80, 80] (or radius), center [0,0], clear null | {x,z,r} (keep a
 *     clearing free), heightAt fn (ground), seed 3, height [26, 42], radius [0.5, 1.1], canopy true, vines true,
 *     placements [[x,z,scale], …] (explicit, overrides random)
 *   makeFerns(opts) → { root }   opts: count 220, area [40,40] | radius, center, clear, heightAt, seed 5, scale [0.7,1.6],
 *     kind 'fern' | 'leafy' (elephant-ear broad leaves), placements
 *   makePalms(opts) → { root, palms }   leaning coconut palms. opts: count 8, area, center, heightAt, seed 9, height [7, 12],
 *     lean 0.35, placements [[x,z,scale,leanYaw]]
 *   makeLog(opts) → { root }      fallen mossy log. opts: length 7, radius 0.45, seed, pos [x,y,z], yaw
 *
 * ─── Water / coast ─────────────────────────────────────────────────────────────────────────────────────────────────
 *   makeOcean(opts) → { root, mesh, material, heightAt(x, z, t), update(t) }   Gerstner storm sea.
 *     opts: size 600, segments 260, level 0, waves [{dir:[x,z], len, amp, steep, speed?}…] (default storm set),
 *           scale 1 (amplitude ×), color '#0b1418', deepColor '#030608', foam 1, foamScale 0.06, roughness 0.12,
 *           shore null | { z: 0 (shore line z, sea toward −z), slope 0.06 (beach rise per m toward +z) } (shoaling,
 *           shore foam and breaking bands), follow false | true (re-centres the grid under the rendering camera)
 *   makeBeach(opts) → { root, heightAt(x,z), sand, shore }   sloped wet sand: dry/wet band near the waterline,
 *     opts: size [160, 120], center [0, 20], shoreZ 0, slope 0.06, seed 2, wetBand 7 (m)
 *   makeWreck(opts) → { root }    broken half-buried boat hull of planks + ribs. opts: length 9, beam 3, seed 4, broken 0.4
 *   makeCrate(opts) → { root }    opts: size 0.9, broken true, seed
 *   makePlanks(opts) → { root }   scattered loose planks. opts: count 12, area [10, 6], heightAt, seed
 *   makeRock(opts) → { root, mesh } displaced icosahedron with triplanar wet rock + moss on top.
 *     opts: radius 1.5, detail 5, seed 1, squash [1, 0.7, 1], rough 0.35, moss 0.35, wet 0.7, pos, rot, flatBottom true
 *   makeCliff(opts) → { root }    wall of stacked rock masses. opts: length 60, height 22, depth 10, seed 6, pos, yaw
 *
 * ─── Cave / fire ───────────────────────────────────────────────────────────────────────────────────────────────────
 *   makeCave(opts) → { root, update(t), floorY, pool, mouth: Vector3 }  rock chamber with an opening toward +z,
 *     stalactites, wet floor with puddles, a dark pool with drip ripples. opts: radius 9, length 1.7, height 0.6, seed 8,
 *     pool true, drips 14 (count of dripping stalactites)
 *   makeCampfire(opts) → { root, light, update(t) }  logs, stones, layered flame billboards (HDR, additive),
 *     embers, smoke, flickering point light. opts: scale 1, intensity 1, light true, smoke true, embers 60, seed 12
 *
 * ─── Light / misc ──────────────────────────────────────────────────────────────────────────────────────────────────
 *   makeLightRig(kind, opts) → { root, key, fill, rim, update(t, flash) }   kind: 'forest' | 'beachDusk' | 'night' |
 *     'cave' | 'closeup'. opts: shadows false, shadowBox 8, target [0,1,0], keyDir override, intensity ×,
 *     practical null | { pos [dx,dy,dz] from target, intensity 6, color, distance 6 } (point key → falloff on flat faces)
 *   makeContactShadow(radius = 0.6, opacity = 0.65) → Mesh   soft dark blob (place at feet / under props)
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, clamp, lerp, hash } from '../lib/util.js';
import { makePerlin, fbm, getCloudTex, getNoiseTex, getOceanNormalTex, getPBR } from './textures.js';
import { RU, pbr, triplanar, wetSurface, windSway, foliage, PRE_RENDER, inScene } from './materials.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (h) => new THREE.Color(h);
const arr3 = (v) => (Array.isArray(v) ? V3(v[0], v[1], v[2]) : v.clone());

// 3D value noise for geometry displacement (CPU)
function makeNoise3(seed) {
  const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 53.3) * 43758.5453; return s - Math.floor(s); };
  const n = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), l(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u), v),
      l(l(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u), l(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u), v), w) * 2 - 1;
  };
  n.fbm = (x, y, z, oct = 4) => { let s = 0, a = 1, f = 1, nn = 0; for (let o = 0; o < oct; o++) { s += a * n(x * f, y * f, z * f); nn += a; a *= 0.5; f *= 2.03; } return s / nn; };
  return n;
}
function placeIn(r, { area = [40, 40], radius = null, center = [0, 0], clear = null }) {
  for (let k = 0; k < 40; k++) {
    let x, z;
    if (radius != null) { const a = r() * TAU, d = Math.sqrt(r()) * radius; x = center[0] + Math.cos(a) * d; z = center[1] + Math.sin(a) * d; }
    else { x = center[0] + (r() - 0.5) * area[0]; z = center[1] + (r() - 0.5) * area[1]; }
    if (clear) {
      const cl = Array.isArray(clear) ? clear : [clear];
      if (cl.some((c) => Math.hypot(x - c.x, z - c.z) < c.r)) continue;
    }
    return [x, z];
  }
  return null;
}

// ═════════════════════════════════════════════ sky ════════════════════════════════════════════════════════════════
const SKY_V = /* glsl */`varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_F = /* glsl */`
precision highp float;
varying vec3 vDir;
uniform sampler2D tCloud;
uniform vec3 zenith, horizon, cloudColor, cloudDark, sunDir, sunColor, flashDir;
uniform float sunIntensity, cover, time, speed, scale, brightness, flash;
void main() {
  vec3 d = normalize(vDir);
  float el = d.y;
  vec3 sky = mix(horizon, zenith, pow(clamp(el, 0.0, 1.0), 0.55));
  sky = mix(sky, horizon * 0.55, smoothstep(0.0, -0.25, el));
  vec3 sd = normalize(sunDir);
  float mu = max(0.0, dot(d, sd));
  // clouds on a virtual plane
  vec2 uv = d.xz / max(0.06, el + 0.12) * 0.12 * scale;
  vec2 drift = vec2(0.006, 0.0025) * time * speed;
  vec4 c1 = texture2D(tCloud, uv + drift);
  vec4 c2 = texture2D(tCloud, uv * 2.7 - drift * 1.8 + 0.3);
  float dens = c1.r * 0.7 + c2.g * 0.3 + (c1.b - 0.5) * 0.25;
  float cov = smoothstep(1.0 - cover - 0.12, 1.0 - cover + 0.18, dens);
  float thick = smoothstep(0.3, 0.75, dens + (c2.g - 0.5) * 0.35);
  vec3 cl = mix(cloudColor, cloudDark, thick);
  // silver lining / glow toward the light, darker bellies
  cl += sunColor * pow(mu, 6.0) * (1.0 - thick) * sunIntensity * 0.8;
  cl *= 0.55 + 0.9 * c2.g * c1.r;
  vec3 col = mix(sky, cl, cov * smoothstep(-0.05, 0.08, el));
  col += sunColor * pow(mu, 24.0) * sunIntensity * (1.0 - cov * 0.85);
  col += sunColor * pow(mu, 4.0) * sunIntensity * 0.025;
  // lightning: whole sky lifts + a hot region around the strike direction, lit from inside the clouds
  float fl = flash * (0.35 + 1.4 * pow(max(0.0, dot(d, normalize(flashDir))), 4.0));
  col += vec3(0.75, 0.82, 1.0) * fl * (0.3 + cov * 0.9) * 0.4;
  gl_FragColor = vec4(col * brightness, 1.0);
}`;
export function makeSky(opts = {}) {
  const o = { zenith: '#1a2024', horizon: '#6b7477', cloudColor: '#8a9396', cloudDark: '#1d2326', sunDir: [0.3, 0.25, -1], sunColor: '#ffffff',
    sunIntensity: 1.5, cover: 0.75, speed: 1, scale: 1, brightness: 1, radius: 900, ...opts };
  const uniforms = {
    tCloud: { value: getCloudTex(7, 1024) }, zenith: { value: C(o.zenith) }, horizon: { value: C(o.horizon) },
    cloudColor: { value: C(o.cloudColor) }, cloudDark: { value: C(o.cloudDark) }, sunDir: { value: arr3(o.sunDir) },
    sunColor: { value: C(o.sunColor) }, sunIntensity: { value: o.sunIntensity }, cover: { value: o.cover }, time: { value: 0 },
    speed: { value: o.speed }, scale: { value: o.scale }, brightness: { value: o.brightness }, flash: { value: 0 }, flashDir: { value: V3(0, 0.5, -1) },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: SKY_V, fragmentShader: SKY_F, uniforms, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(o.radius, 48, 24), material);
  mesh.renderOrder = -1000; mesh.frustumCulled = false; mesh.name = 'sky';
  const root = new THREE.Group(); root.add(mesh);
  return {
    root, mesh, uniforms, opts: o,
    update(t) { uniforms.time.value = t; },
    setFlash(v, dir) { uniforms.flash.value = v; if (dir) uniforms.flashDir.value.copy(dir); },
  };
}

export function bakeEnvironment(renderer, scene, skyOpts = {}, { groundColor = '#141618', intensity = 1 } = {}) {
  const envScene = new THREE.Scene();
  const sky = makeSky({ ...skyOpts, radius: 50 });
  sky.uniforms.time.value = 0;
  envScene.add(sky.root);
  const ground = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16, 0, TAU, Math.PI * 0.5, Math.PI * 0.5),
    new THREE.MeshBasicMaterial({ color: C(groundColor), side: THREE.BackSide, fog: false }));
  envScene.add(ground);
  const pm = new THREE.PMREMGenerator(renderer);
  const prevTarget = renderer.getRenderTarget();
  const rt = pm.fromScene(envScene, 0.02, 0.1, 200);
  renderer.setRenderTarget(prevTarget);
  pm.dispose();
  sky.mesh.geometry.dispose(); sky.mesh.material.dispose(); ground.geometry.dispose(); ground.material.dispose();
  if (scene) { scene.environment = rt.texture; if ('environmentIntensity' in scene) scene.environmentIntensity = intensity; }
  return rt.texture;
}

// ═════════════════════════════════════════════ terrain ════════════════════════════════════════════════════════════
export function makeTerrain(opts = {}) {
  const o = { size: 120, segments: 160, texture: 'mud', tile: 3, height: null, amp: 1.2, freq: 0.04, seed: 1, wet: 0.85, puddles: 0.35,
    puddleScale: 0.07, ripples: 1, color: '#ffffff', roughness: 1, normalScale: 1.2, center: [0, 0], ...opts };
  const N = makePerlin(o.seed + 100);
  const heightAt = o.height || ((x, z) => o.amp * (fbm(N, x * o.freq, z * o.freq, 4, 256) + 0.35 * fbm(N, x * o.freq * 4 + 7, z * o.freq * 4, 3, 256) * 0.5));
  const g = new THREE.PlaneGeometry(o.size, o.size, o.segments, o.segments);
  g.rotateX(-Math.PI / 2);
  g.translate(o.center[0], 0, o.center[1]);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const material = pbr(o.texture, { repeat: o.size / o.tile, color: o.color, roughness: o.roughness, normalScale: o.normalScale });
  wetSurface(material, { wet: o.wet, puddles: o.puddles, puddleScale: o.puddleScale, ripples: o.ripples });
  const mesh = new THREE.Mesh(g, material);
  mesh.receiveShadow = true; mesh.name = 'terrain';
  const root = new THREE.Group(); root.add(mesh);
  return { root, mesh, heightAt, material };
}

// ═════════════════════════════════════════════ vegetation ═════════════════════════════════════════════════════════
const _matCache = new Map();
function cachedMat(key, make) { let m = _matCache.get(key); if (!m) { m = make(); _matCache.set(key, m); } return m; }

function trunkGeometry({ height = 32, r0 = 0.8, r1 = 0.32, buttress = 2.2, fins = 5, seed = 1, bend = 0.6, low = false }) {
  const n3 = makeNoise3(seed), r = rng(seed);
  const radial = low ? 18 : 44, hs = low ? 12 : 46;
  const g = new THREE.CylinderGeometry(1, 1, height, radial, hs, true);
  g.translate(0, height / 2, 0);
  const p = g.attributes.position, uv = g.attributes.uv;
  const finOff = r() * TAU, bx = (r() - 0.5) * bend, bz = (r() - 0.5) * bend;
  const finAmp = Array.from({ length: fins }, () => 0.6 + r() * 0.8);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const th = Math.atan2(z, x), yy = y / height;
    let rad = lerp(r0, r1, Math.pow(yy, 0.55));
    // buttress fins: star cross-section that decays with height and spreads at the ground
    let fin = 0;
    for (let k = 0; k < fins; k++) {
      const a = finOff + (k / fins) * TAU + 0.25 * Math.sin(k * 3.1);
      const da = Math.atan2(Math.sin(th - a), Math.cos(th - a));
      fin = Math.max(fin, finAmp[k] * Math.exp(-da * da * 60));
    }
    const decay = Math.exp(-y / (height * 0.055));
    rad += r0 * buttress * fin * decay * (1 + 1.6 * Math.exp(-y / 0.5));
    rad *= 1 + 0.35 * Math.exp(-y / 0.7);
    rad *= 1 + 0.07 * n3.fbm(Math.cos(th) * 2, y * 0.25, Math.sin(th) * 2, 3);
    const bendK = Math.pow(yy, 2) * height * 0.08;
    p.setXYZ(i, Math.cos(th) * rad + bx * bendK, y, Math.sin(th) * rad + bz * bendK);
    uv.setXY(i, (th / TAU + 0.5) * Math.max(2, Math.round(r0 * 6)), y / 2.6);
  }
  g.computeVertexNormals();
  return g;
}
function branchGeometry(height, seed) {
  const r = rng(seed + 50), parts = [];
  const nb = 5 + Math.floor(r() * 3);
  for (let k = 0; k < nb; k++) {
    const len = 5 + r() * 6, rad = 0.12 + r() * 0.12;
    const b = new THREE.CylinderGeometry(rad * 0.4, rad, len, 7, 1, true);
    b.translate(0, len / 2, 0);
    b.rotateZ(0.7 + r() * 0.6); b.rotateY(r() * TAU);
    b.translate(0, height * (0.8 + r() * 0.17), 0);
    parts.push(b);
  }
  return mergeGeometries(parts);
}
function canopyGeometry(height, seed, spread = 7, n = 46) {
  const r = rng(seed + 90), parts = [];
  for (let k = 0; k < n; k++) {
    const s = 2.6 + r() * 2.4;
    const q = new THREE.PlaneGeometry(s, s, 2, 2);
    // droop the card a little so it reads as a bunch, not a flat sheet
    const qp = q.attributes.position;
    for (let i = 0; i < qp.count; i++) { const x = qp.getX(i), y = qp.getY(i); qp.setZ(i, -(x * x + y * y) * 0.08); }
    q.rotateX(-Math.PI / 2 + (r() - 0.5) * 1.2); q.rotateY(r() * TAU);
    const a = r() * TAU, d = Math.sqrt(r()) * spread;
    q.translate(Math.cos(a) * d, height * 0.86 + (r() - 0.3) * 5 - d * 0.25, Math.sin(a) * d);
    parts.push(q);
  }
  const g = mergeGeometries(parts);
  // bent normals: point outward from the crown centre (soft, volumetric shading of the leaf mass)
  const p = g.attributes.position, nrm = g.attributes.normal, c = V3(0, height * 0.8, 0), v = V3();
  for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i), p.getZ(i)).sub(c).normalize(); v.y = Math.abs(v.y) * 0.6 + 0.4; v.normalize(); nrm.setXYZ(i, v.x, v.y, v.z); }
  return g;
}
function vineGeometry(seed, len = 18) {
  const r = rng(seed + 33), parts = [];
  for (let k = 0; k < 3; k++) {
    const pts = [];
    const ox = (r() - 0.5) * 1.5, oz = (r() - 0.5) * 1.5, L = len * (0.5 + r() * 0.5);
    for (let i = 0; i <= 10; i++) { const s = i / 10; pts.push(V3(ox + Math.sin(s * 5 + k) * 0.25, -s * L, oz + Math.cos(s * 4 + k) * 0.2)); }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.025 + r() * 0.03, 5, false));
  }
  return mergeGeometries(parts);
}

export function makeForest(opts = {}) {
  const o = { count: 40, area: [80, 80], radius: null, center: [0, 0], clear: null, heightAt: () => 0, seed: 3, height: [26, 42], radius_: [0.5, 1.1],
    canopy: true, vines: true, placements: null, variants: 3, lod: 'high', castShadow: false, ...opts };
  const low = o.lod === 'low';
  const r = rng(o.seed);
  const root = new THREE.Group(); root.name = 'forest';
  const barkMat = cachedMat('bark', () => {
    const m = pbr('bark', { repeat: 1, roughness: 0.75, normalScale: 1.6, color: '#d8d8d8' });
    wetSurface(m, { wet: 0.75 });
    return m;
  });
  const leafMat = cachedMat('canopyLeaves', () => {
    const m = pbr('leaves', { roughness: 0.55, color: '#9aa79a', envMapIntensity: 0.6 });
    windSway(m, { amp: 0.25, freq: 0.7, heightScale: 30, flutter: 0.05 });
    foliage(m, { translucency: 0.12 });
    return m;
  });
  const vineMat = cachedMat('vine', () => { const m = pbr('bark', { repeat: [1, 6], color: '#556650', roughness: 0.6 }); windSway(m, { amp: 0.0, freq: 0.9 }); return m; });
  // variants share geometry; instances differ by scale / rotation
  const trees = [];
  const list = o.placements ? o.placements.map(([x, z, s]) => [x, z, s ?? 1]) : [];
  if (!o.placements) for (let i = 0; i < o.count; i++) { const pz = placeIn(r, o); if (pz) list.push([pz[0], pz[1], 0.75 + r() * 0.5]); }
  const byVar = Array.from({ length: o.variants }, () => []);
  list.forEach(([x, z, s], i) => byVar[i % o.variants].push([x, z, s, r() * TAU]));
  for (let v = 0; v < o.variants; v++) {
    const items = byVar[v]; if (!items.length) continue;
    const H = lerp(o.height[0], o.height[1], (v + 0.5) / o.variants), R0 = lerp(o.radius_[0], o.radius_[1], ((v * 7) % o.variants + 0.5) / o.variants);
    const seed = o.seed * 100 + v;
    const parts = [[trunkGeometry({ height: H, r0: R0, r1: R0 * 0.38, seed, fins: 4 + (v % 3), low }), barkMat],
      [branchGeometry(H, seed), barkMat]];
    if (o.canopy) parts.push([canopyGeometry(H, seed, 7, low ? 24 : 46), leafMat]);
    if (o.vines && !low) {
      const vg = vineGeometry(seed, H * 0.6); vg.translate(R0 * 1.5, H * 0.85, 0);
      const vg2 = vineGeometry(seed + 1, H * 0.5); vg2.translate(-R0 * 2.5, H * 0.8, R0);
      parts.push([mergeGeometries([vg, vg2]), vineMat]);
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (const [geo, material] of parts) {
      const im = new THREE.InstancedMesh(geo, material, items.length);
      items.forEach(([x, z, s, yaw], i) => {
        q.setFromAxisAngle(V3(0, 1, 0), yaw);
        m4.compose(V3(x, o.heightAt(x, z) - 0.3, z), q, V3(s, s, s));
        im.setMatrixAt(i, m4);
      });
      im.castShadow = o.castShadow && material === barkMat; im.receiveShadow = true;
      im.computeBoundingSphere();
      root.add(im);
    }
    for (const [x, z, s] of items) trees.push({ x, z, s, h: H * s, r: R0 * s });
  }
  return { root, trees, heightAt: o.heightAt, update() {} };
}

function frondStrip(len, width, arch, segs = 10) {
  const g = new THREE.PlaneGeometry(width, len, 1, segs);
  g.translate(0, len / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), s = y / len;
    // arch: rises then droops; fold slightly along the rachis (V-shape)
    const x = p.getX(i);
    p.setXYZ(i, x, Math.sin(s * Math.PI * 0.62) * len * 0.55 - s * s * arch * len, s * len * 0.75 + Math.abs(x) * 0.0);
    p.setY(i, p.getY(i) + Math.abs(x) * 0.25);
  }
  g.computeVertexNormals();
  return g;
}
function plantGeometry(kind, seed) {
  const r = rng(seed), parts = [];
  if (kind === 'fern') {
    const n = 9 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) {
      const f = frondStrip(0.9 + r() * 0.5, 0.42, 0.55 + r() * 0.3);
      f.rotateY((k / n) * TAU + r() * 0.3);
      parts.push(f);
    }
  } else {
    // broad 'elephant ear' leaves on stems
    const n = 5 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const h = 0.6 + r() * 0.7;
      const stem = new THREE.CylinderGeometry(0.012, 0.02, h, 5, 1, true); stem.translate(0, h / 2, 0);
      const L = 0.7 + r() * 0.4;
      const leaf = new THREE.PlaneGeometry(L * 0.6, L, 2, 4); leaf.translate(0, L / 2, 0);
      const lp = leaf.attributes.position;
      for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), y = lp.getY(i); lp.setZ(i, x * x * 0.6 - y * y * 0.25); }
      leaf.rotateX(-1.0 - r() * 0.5); leaf.translate(0, h, 0);
      const g = mergeGeometries([stem.toNonIndexed(), leaf.toNonIndexed()]);
      g.rotateZ((r() - 0.5) * 0.6); g.rotateY((k / n) * TAU + r());
      parts.push(g);
    }
    // stems need uv inside the leaf texture's petiole: crude but invisible at distance
    return mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)));
  }
  return mergeGeometries(parts);
}
export function makeFerns(opts = {}) {
  const o = { count: 220, area: [40, 40], radius: null, center: [0, 0], clear: null, heightAt: () => 0, seed: 5, scale: [0.7, 1.6], kind: 'fern', placements: null, ...opts };
  const r = rng(o.seed);
  const tex = o.kind === 'fern' ? 'fern' : 'leaf';
  const material = cachedMat('plant:' + o.kind, () => {
    const m = pbr(tex, { roughness: 0.5, color: o.kind === 'fern' ? '#a6b39c' : '#8f9c86', envMapIntensity: 0.7 });
    windSway(m, { amp: o.kind === 'fern' ? 0.08 : 0.06, freq: 1.7, heightScale: 1.0, flutter: 0.015 });
    foliage(m, { translucency: 0.1, wet: 0.6 });
    return m;
  });
  const root = new THREE.Group(); root.name = 'plants:' + o.kind;
  const variants = [0, 1, 2].map((k) => plantGeometry(o.kind, o.seed * 10 + k));
  const lists = [[], [], []];
  const items = o.placements || Array.from({ length: o.count }, () => { const p = placeIn(r, o); return p ? [p[0], p[1], lerp(o.scale[0], o.scale[1], r())] : null; }).filter(Boolean);
  items.forEach((it, i) => lists[i % 3].push(it));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  lists.forEach((L, k) => {
    if (!L.length) return;
    const im = new THREE.InstancedMesh(variants[k], material, L.length);
    L.forEach(([x, z, s], i) => { q.setFromEuler(new THREE.Euler((hash(i + k * 13) - 0.5) * 0.2, hash(i * 3.1 + k) * TAU, 0)); m4.compose(V3(x, o.heightAt(x, z) - 0.03, z), q, V3(s, s, s)); im.setMatrixAt(i, m4); });
    im.receiveShadow = true; im.castShadow = false;
    im.computeBoundingSphere();
    root.add(im);
  });
  return { root, update() {} };
}

export function makePalms(opts = {}) {
  const o = { count: 8, area: [40, 20], radius: null, center: [0, 0], clear: null, heightAt: () => 0, seed: 9, height: [7, 12], lean: 0.35, placements: null, ...opts };
  const r = rng(o.seed);
  const root = new THREE.Group(); root.name = 'palms';
  const trunkMat = cachedMat('palmTrunk', () => { const m = pbr('bark', { repeat: [1, 5], color: '#8d8a80', roughness: 0.8, normalScale: 2 }); wetSurface(m, { wet: 0.6 }); windSway(m, { amp: 0.25, freq: 0.9, heightScale: 10, flutter: 0 }); return m; });
  const frondMat = cachedMat('palmFrond', () => { const m = pbr('palm', { roughness: 0.45, color: '#a0a890' }); windSway(m, { amp: 0.6, freq: 1.4, heightScale: 10, flutter: 0.06 }); foliage(m, { translucency: 0.1, wet: 0.6 }); return m; });
  const items = o.placements || Array.from({ length: o.count }, () => { const p = placeIn(r, o); return p ? [p[0], p[1], 0.8 + r() * 0.4, r() * TAU] : null; }).filter(Boolean);
  const palms = [];
  items.forEach(([x, z, s, yaw], i) => {
    const H = lerp(o.height[0], o.height[1], r()) * s, lean = o.lean * (0.6 + r() * 0.8);
    const pts = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push(V3(Math.sin(u * 1.2) * lean * H * 0.45, u * H, 0)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tg = new THREE.TubeGeometry(curve, 30, 0.2, 10, false);
    // taper + ring bumps
    const tp = tg.attributes.position;
    for (let k = 0; k < tp.count; k++) {
      const y = tp.getY(k) / H; const c = curve.getPoint(clamp(y, 0, 1));
      const dx = tp.getX(k) - c.x, dz = tp.getZ(k) - c.z;
      const sc = (1.25 - y * 0.45) * (1 + 0.05 * Math.sin(tp.getY(k) * 9));
      tp.setX(k, c.x + dx * sc); tp.setZ(k, c.z + dz * sc);
    }
    tg.computeVertexNormals();
    const top = curve.getPoint(1);
    const fronds = [];
    const nf = 12 + Math.floor(r() * 4);
    for (let k = 0; k < nf; k++) {
      const f = frondStrip(3.2 + r() * 1.4, 0.9, 1.25 + r() * 0.5, 12);
      f.rotateX(-0.25 + r() * 0.2); f.rotateY((k / nf) * TAU + r() * 0.4);
      f.translate(top.x, top.y - 0.15, top.z);
      fronds.push(f);
    }
    const g = new THREE.Group();
    const tm = new THREE.Mesh(tg, trunkMat); tm.castShadow = true; tm.receiveShadow = true;
    const fm = new THREE.Mesh(mergeGeometries(fronds), frondMat); fm.castShadow = true;
    g.add(tm, fm);
    g.position.set(x, o.heightAt(x, z) - 0.2, z); g.rotation.y = yaw;
    root.add(g);
    palms.push({ x, z, h: H, group: g });
  });
  return { root, palms, update() {} };
}

export function makeLog(opts = {}) {
  const o = { length: 7, radius: 0.45, seed: 13, pos: [0, 0, 0], yaw: 0, ...opts };
  const n3 = makeNoise3(o.seed);
  const g = new THREE.CylinderGeometry(o.radius, o.radius * 1.1, o.length, 20, 24, false);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.12 * n3.fbm(x * 1.5, y * 0.6, z * 1.5, 3) + 0.1 * Math.max(0, Math.sin(y * 3.1)) * 0.3;
    p.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  g.rotateZ(Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
  triplanar(m, 'bark', { scale: 0.7, bump: 1.4, slopeTint: { color: '#2e3f1c', amount: 0.85, up: 0.35 } });
  wetSurface(m, { wet: 0.8 });
  const mesh = new THREE.Mesh(g, m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  const root = new THREE.Group(); root.add(mesh);
  root.position.copy(arr3(o.pos)); root.position.y += o.radius * 0.7; root.rotation.y = o.yaw;
  return { root, mesh, update() {} };
}

// ═════════════════════════════════════════════ ocean ══════════════════════════════════════════════════════════════
const STORM_WAVES = [
  { dir: [0.2, 1], len: 62, amp: 1.25, steep: 0.8 }, { dir: [-0.35, 1], len: 38, amp: 0.75, steep: 0.75 },
  { dir: [0.6, 1], len: 23, amp: 0.42, steep: 0.65 }, { dir: [-0.1, 1], len: 13.5, amp: 0.22, steep: 0.7 },
  { dir: [0.9, 1], len: 8.2, amp: 0.11, steep: 0.7 }, { dir: [-0.7, 1], len: 5.1, amp: 0.06, steep: 0.65 },
];
export function makeOcean(opts = {}) {
  const o = { size: 600, segments: 260, level: 0, waves: STORM_WAVES, scale: 1, color: '#0b1418', deepColor: '#030608', foam: 1, foamScale: 0.06,
    roughness: 0.12, shore: null, follow: null, ...opts };
  const W = o.waves.map((w) => {
    const d = new THREE.Vector2(w.dir[0], w.dir[1]).normalize();
    const k = TAU / w.len, c = Math.sqrt(9.81 / k) * (w.speed ?? 1);
    return { d, k, c, a: w.amp * o.scale, q: w.steep };
  });
  // CPU mirror of the GPU displacement (for bobbing props): iterates the Gerstner inverse a few times
  const shore = o.shore ? { z: o.shore.z ?? 0, slope: o.shore.slope ?? 0.06 } : null;
  const ampAt = (x, z) => {
    if (!shore) return 1;
    const depth = o.level - shore.slope * (z - shore.z) + 0.0;
    return clamp((depth + 0.2) / 1.6, 0.06, 1);
  };
  function disp(x, z, t, out) {
    let dx = 0, dy = 0, dz = 0;
    const A = ampAt(x, z);
    for (const w of W) {
      const f = w.k * (w.d.x * x + w.d.y * z) - w.k * w.c * t;
      const qa = (w.q / (w.k * w.a * W.length + 1e-4)) * w.a * A;
      dx += qa * w.d.x * Math.cos(f); dz += qa * w.d.y * Math.cos(f); dy += w.a * A * Math.sin(f);
    }
    out.set(dx, dy, dz); return out;
  }
  const _d = V3();
  function heightAt(x, z, t) {
    let px = x, pz = z;
    for (let i = 0; i < 3; i++) { disp(px, pz, t, _d); px = x - _d.x; pz = z - _d.z; }
    disp(px, pz, t, _d);
    return o.level + _d.y;
  }
  // radial-density grid: fine near the centre, coarse far away
  const g = new THREE.PlaneGeometry(2, 2, o.segments, o.segments);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.max(Math.abs(x), Math.abs(z)), rr = Math.pow(r, 2.4);
    const s = r > 0 ? rr / r : 0;
    p.setXYZ(i, x * s * o.size * 0.5, 0, z * s * o.size * 0.5);
  }
  g.computeBoundingSphere(); g.boundingSphere.radius = o.size;
  const material = new THREE.MeshPhysicalMaterial({ color: C(o.color), roughness: o.roughness, metalness: 0, ior: 1.333,
    normalMap: getOceanNormalTex(3, 512), normalScale: new THREE.Vector2(0.24, 0.24), envMapIntensity: 1.0 });
  material.normalMap.repeat.set(1, 1);
  const wu = {
    uWaveD: { value: W.map((w) => new THREE.Vector4(w.d.x, w.d.y, w.k, w.c)) },
    uWaveA: { value: W.map((w) => new THREE.Vector2(w.a, w.q / (w.k * w.a * W.length + 1e-4) * w.a)) },
    uLevel: { value: o.level }, uFoam: { value: o.foam }, tFoam: { value: getPBR('foam').map }, tNoiseO: { value: getNoiseTex(4, 256) },
    uFoamScale: { value: o.foamScale }, uDeep: { value: C(o.deepColor) }, uShallow: { value: C(o.color) },
    uShore: { value: new THREE.Vector3(shore ? 1 : 0, shore ? shore.z : 0, shore ? shore.slope : 0) },
    uOceanCenter: { value: new THREE.Vector2() },
  };
  const NW = W.length;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, wu, { uTime: RU.uTime, uFlash: RU.uFlash });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
uniform float uTime, uLevel; uniform vec4 uWaveD[${NW}]; uniform vec2 uWaveA[${NW}]; uniform vec3 uShore; uniform vec2 uOceanCenter;
varying vec3 vOW; varying float vCrest; varying float vDepth;
float shoreAmp(vec2 xz, out float depth) { depth = 100.0; if (uShore.x < 0.5) return 1.0; depth = uLevel - uShore.z * (xz.y - uShore.y); return clamp((depth + 0.2) / 1.6, 0.06, 1.0); }`)
      .replace('#include <beginnormal_vertex>', `
vec3 owp = (modelMatrix * vec4(position, 1.0)).xyz;
float oDepth; float oA = shoreAmp(owp.xz, oDepth);
vec3 oD = vec3(0.0); vec3 oT = vec3(1.0, 0.0, 0.0); vec3 oB = vec3(0.0, 0.0, 1.0); float crest = 0.0;
for (int i = 0; i < ${NW}; i++) {
  vec2 d = uWaveD[i].xy; float k = uWaveD[i].z, c = uWaveD[i].w;
  float a = uWaveA[i].x * oA, qa = uWaveA[i].y * oA;
  float f = k * dot(d, owp.xz) - k * c * uTime;
  float cf = cos(f), sf = sin(f);
  oD += vec3(qa * d.x * cf, a * sf, qa * d.y * cf);
  oT += vec3(-qa * d.x * d.x * k * sf, a * d.x * k * cf, -qa * d.x * d.y * k * sf);
  oB += vec3(-qa * d.x * d.y * k * sf, a * d.y * k * cf, -qa * d.y * d.y * k * sf);
  crest += qa * k * sf * (uWaveA[i].x / max(1e-3, uWaveA[0].x));   // crest pinch (Jacobian proxy), dominated by the big waves
}
vCrest = crest; vDepth = oDepth;
vec3 objectNormal = normalize(cross(oB, oT));
#ifdef USE_TANGENT
vec3 objectTangent = vec3(tangent.xyz);
#endif`)
      .replace('#include <begin_vertex>', `vec3 transformed = position + oD; vOW = owp + oD;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uTime, uFoam, uFoamScale, uFlash; uniform sampler2D tFoam, tNoiseO; uniform vec3 uDeep, uShallow, uShore;
varying vec3 vOW; varying float vCrest; varying float vDepth; float oFoam = 0.0;`)
      .replace('#include <normal_fragment_maps>', `
{
  vec2 uvA = vOW.xz * 0.03 + vec2(0.012, 0.03) * uTime;
  vec2 uvB = vOW.xz * 0.075 - vec2(0.02, -0.035) * uTime;
  vec3 nA = texture2D(normalMap, uvA).xyz * 2.0 - 1.0;
  vec3 nB = texture2D(normalMap, uvB).xyz * 2.0 - 1.0;
  vec3 mapN = normalize(vec3(nA.xy + nB.xy, nA.z * nB.z));
  mapN.xy *= normalScale;
  // world-space perturbation around the Gerstner normal (y-up surface): build TBN from the geometric normal
  vec3 wn = normalize(inverseTransformDirection(normal, viewMatrix));
  vec3 wt = normalize(cross(vec3(0.0, 0.0, 1.0), wn)); vec3 wb = cross(wn, wt);
  vec3 pn = normalize(wt * mapN.x + wb * mapN.y + wn * mapN.z);
  normal = normalize((viewMatrix * vec4(pn, 0.0)).xyz);
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{
  float h = vOW.y;
  float fN = texture2D(tNoiseO, vOW.xz * 0.013 + uTime * 0.004).r;
  float crestF = smoothstep(0.06, 0.13, vCrest + (fN - 0.5) * 0.06);
  // wind-aligned streak coordinates: foam stretches along the wind (+z here) into streaks and lace
  vec2 sq = vec2(vOW.x * uFoamScale * 1.3, vOW.z * uFoamScale * 0.45);
  vec4 ft = texture2D(tFoam, sq + vec2(uTime * 0.004, uTime * 0.012));
  vec4 ft2 = texture2D(tFoam, sq * 2.6 + vec2(0.37, -uTime * 0.02));
  float lace = ft.a * 0.65 + ft2.a * 0.35;
  float patchF = smoothstep(0.42, 0.68, fN);
  oFoam = crestF * smoothstep(0.32, 0.62, lace + crestF * 0.2) * (0.35 + 0.65 * patchF);
  // old foam streaks drifting between the crests
  oFoam = max(oFoam, smoothstep(0.72, 0.95, lace) * patchF * 0.28);
  if (uShore.x > 0.5) {
    float sd = vDepth;
    float band = sin(sd * 2.2 + uTime * 1.6 + fN * 4.0) * 0.5 + 0.5;
    float shoreF = smoothstep(2.6, 0.0, sd) * (0.55 + 0.45 * band) + smoothstep(0.5, 0.0, sd);
    oFoam = max(oFoam, clamp(shoreF, 0.0, 1.0) * smoothstep(0.15, 0.6, lace + 0.25));
  }
  oFoam *= uFoam;
  // water body: dark, slightly lighter (subsurface) where the wave rises toward the viewer
  vec3 body = mix(uDeep, uShallow, clamp(h * 0.4 + 0.45, 0.0, 1.0));
  diffuseColor.rgb = mix(body, vec3(1.0), oFoam);
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
// specular anti-aliasing: far water gets rougher instead of sparkling
roughnessFactor = min(0.6, roughnessFactor + clamp(length(vOW - cameraPosition) / 250.0, 0.0, 1.0) * 0.22);
roughnessFactor = mix(roughnessFactor, 0.75, oFoam);`);
  };
  material.customProgramCacheKey = () => 'realOcean' + NW;
  const mesh = new THREE.Mesh(g, material);
  mesh.position.y = o.level; mesh.receiveShadow = false; mesh.name = 'ocean'; mesh.frustumCulled = false;
  const root = new THREE.Group(); root.add(mesh);
  if (o.follow) {
    // re-centre under the rendering camera at render time (deterministic: no dependence on the previous frame)
    const snap = o.size / o.segments * 4, cp = V3();
    PRE_RENDER.add(({ scene, camera }) => {
      if (!inScene(mesh, scene)) return;
      cp.setFromMatrixPosition(camera.matrixWorld);
      mesh.position.x = Math.round(cp.x / snap) * snap; mesh.position.z = Math.round(cp.z / snap) * snap;
      mesh.updateMatrixWorld();
    });
  }
  return { root, mesh, material, heightAt, uniforms: wu, update() {} };
}

// ═════════════════════════════════════════════ beach / wreckage ═══════════════════════════════════════════════════
export function makeBeach(opts = {}) {
  const o = { size: [160, 120], center: [0, 20], shoreZ: 0, slope: 0.06, seed: 2, wetBand: 7, segments: 180, ...opts };
  const N = makePerlin(o.seed + 40);
  const heightAt = (x, z) => o.slope * (z - o.shoreZ) + 0.25 * fbm(N, x * 0.05, z * 0.05, 4, 256) + 0.06 * fbm(N, x * 0.4, z * 0.4, 2, 256)
    + Math.max(0, z - o.shoreZ - 25) * 0.05;
  const g = new THREE.PlaneGeometry(o.size[0], o.size[1], o.segments, o.segments);
  g.rotateX(-Math.PI / 2); g.translate(o.center[0], 0, o.center[1]);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const sand = pbr('sand', { repeat: [o.size[0] / 2.5, o.size[1] / 2.5], roughness: 1, normalScale: 0.45 });
  wetSurface(sand, { wet: 0.25, puddles: 0.25, puddleScale: 0.05, puddleLevel: 0.42 });
  // extra: wet band along the waterline (dark, glossy, thin water film with reflections)
  const su = { uShoreZ: { value: o.shoreZ }, uWetBand: { value: o.wetBand } };
  const prev = sand.onBeforeCompile;
  sand.onBeforeCompile = (shader, r) => {
    prev(shader, r);
    Object.assign(shader.uniforms, su);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uShoreZ, uWetBand; float shoreWet = 0.0;')
      .replace('#include <map_fragment>', `#include <map_fragment>
  shoreWet = smoothstep(uShoreZ + uWetBand, uShoreZ + uWetBand * 0.25, vRWorldPos.z + texture2D(tWetNoise, vRWorldPos.xz * 0.05).r * 3.0);
  diffuseColor.rgb *= mix(1.0, 0.42, shoreWet);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(roughnessFactor, 0.06, shoreWet * smoothstep(uShoreZ + uWetBand * 0.6, uShoreZ, vRWorldPos.z));`);
  };
  const prevKey = sand.customProgramCacheKey;
  sand.customProgramCacheKey = () => prevKey() + '|beach';
  const mesh = new THREE.Mesh(g, sand);
  mesh.receiveShadow = true; mesh.name = 'beach';
  const root = new THREE.Group(); root.add(mesh);
  return { root, mesh, heightAt, sand, shore: { z: o.shoreZ, slope: o.slope }, update() {} };
}

function plankMat() {
  return cachedMat('planks', () => { const m = pbr('planks', { repeat: [1, 1], roughness: 0.85, normalScale: 1.5 }); wetSurface(m, { wet: 0.7 }); return m; });
}
// a box whose UVs span `len` metres of the planks texture along its length (one board per 1/4 of the texture height)
function boardGeo(len, w, t, board = 0) {
  const g = new THREE.BoxGeometry(len, t, w);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / 2.5, (board + 0.1 + uv.getY(i) * 0.8) / 4);
  return g;
}
export function makeWreck(opts = {}) {
  const o = { length: 9, beam: 3, depth: 1.6, seed: 4, broken: 0.4, ...opts };
  const r = rng(o.seed), parts = [];
  const stations = 16, strakes = 9;
  const hull = (u, v) => {   // u 0..1 bow→stern, v 0..1 keel→gunwale (one side)
    const x = (u - 0.5) * o.length;
    const half = o.beam * 0.5 * Math.pow(Math.sin(Math.PI * clamp(u * 0.92 + 0.04, 0, 1)), 0.6);
    const a = v * Math.PI * 0.5;
    return V3(x, -Math.cos(a) * o.depth + o.depth, Math.sin(a) * half);
  };
  const breakU = 1 - o.broken;
  for (const side of [1, -1]) for (let k = 0; k < strakes; k++) {
    for (let i = 0; i < stations; i++) {
      const u0 = i / stations, u1 = (i + 1) / stations, v = (k + 0.5) / strakes;
      if (u1 > breakU + (r() - 0.5) * 0.15 * (k + 1) / strakes * 2 && k > 1) continue;       // broken stern: planks missing
      if (r() < 0.07 && k > 2) continue;                                                       // random holes
      const a = hull(u0, v), b = hull(u1, v);
      a.z *= side; b.z *= side;
      const len = a.distanceTo(b) + 0.02;
      const g = boardGeo(len, o.depth * 1.6 / strakes, 0.045, (k + i) % 4);
      const m = new THREE.Matrix4().lookAt(a, b, V3(0, 1, 0));
      const dir = b.clone().sub(a).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(V3(1, 0, 0), dir);
      // roll the board so it lies on the hull surface
      const n = hull((u0 + u1) / 2, Math.min(1, v + 0.05)).sub(hull((u0 + u1) / 2, Math.max(0, v - 0.05))); n.z *= side;
      const roll = Math.atan2(n.z * side, n.y) * side;
      const q2 = new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), -roll);
      g.applyQuaternion(q2); g.applyQuaternion(q);
      g.translate((a.x + b.x) / 2, (a.y + b.y) / 2 + (r() - 0.5) * 0.02, (a.z + b.z) / 2);
      parts.push(g); void m;
    }
  }
  // ribs (frames), exposed where planks are gone
  const ribs = [];
  for (let i = 1; i < stations; i += 2) {
    const u = i / stations;
    for (const side of [1, -1]) {
      for (let k = 0; k < 6; k++) {
        const a = hull(u, k / 6), b = hull(u, (k + 1) / 6); a.z *= side; b.z *= side;
        if (u > breakU && k > 3 && r() < 0.6) continue;
        const len = a.distanceTo(b) + 0.03;
        const g = boardGeo(len, 0.09, 0.09, 1);
        const q = new THREE.Quaternion().setFromUnitVectors(V3(1, 0, 0), b.clone().sub(a).normalize());
        g.applyQuaternion(q); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2 - side * 0.05);
        ribs.push(g);
      }
    }
  }
  const keel = boardGeo(o.length * 0.95, 0.16, 0.18, 2); keel.translate(0, 0.02, 0);
  const geo = mergeGeometries([...parts, ...ribs, keel]);
  const mesh = new THREE.Mesh(geo, plankMat());
  mesh.castShadow = true; mesh.receiveShadow = true;
  const root = new THREE.Group(); root.add(mesh);
  // broken mast stub + a torn wet sail draped over the side
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.6, 10), plankMat());
  mast.position.set(-o.length * 0.12, 1.4, 0.1); mast.rotation.z = 0.5; mast.castShadow = true;
  root.add(mast);
  const sail = new THREE.PlaneGeometry(2.4, 1.8, 20, 16);
  const n3 = makeNoise3(o.seed + 5), sp = sail.attributes.position;
  for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i); sp.setZ(i, n3.fbm(x * 0.8, y * 0.8, 1, 3) * 0.35 - (y < 0 ? y * y * 0.4 : 0)); }
  sail.computeVertexNormals();
  const sailMat = new THREE.MeshPhysicalMaterial({ color: '#8d8b84', roughness: 0.6, sheen: 0.6, sheenRoughness: 0.5, side: THREE.DoubleSide,
    map: getPBR('fabric').repeat(6, 4).map, normalMap: getPBR('fabric').repeat(6, 4).normalMap, clearcoat: 0.3, clearcoatRoughness: 0.3 });
  const sm = new THREE.Mesh(sail, sailMat); sm.position.set(-o.length * 0.05, 1.3, o.beam * 0.45); sm.rotation.set(-0.9, 0.2, 0.15); sm.castShadow = true;
  root.add(sm);
  return { root, mesh, update() {} };
}

export function makeCrate(opts = {}) {
  const o = { size: 0.9, broken: true, seed: 17, ...opts };
  const r = rng(o.seed), s = o.size, parts = [];
  const nb = 4, bw = s / nb, th = 0.035;
  // 4 walls + lid + bottom, each made of nb boards; board k of a wall runs along the wall's local x
  const walls = [
    (g) => g.translate(0, 0, s / 2 - th / 2),
    (g) => g.translate(0, 0, -s / 2 + th / 2),
    (g) => { g.rotateY(Math.PI / 2); g.translate(s / 2 - th / 2, 0, 0); },
    (g) => { g.rotateY(Math.PI / 2); g.translate(-s / 2 + th / 2, 0, 0); },
  ];
  walls.forEach((place, wi) => {
    for (let k = 0; k < nb; k++) {
      if (o.broken && wi === 0 && k === 2) continue;
      const g = boardGeo(s, bw * 0.94, th, (k + wi) % 4);   // length x, thickness y, width z
      g.rotateX(Math.PI / 2);                                // width → y, thickness → z
      g.translate(0, -s / 2 + bw * (k + 0.5), 0);
      if (o.broken && wi === 0 && k === 3) { g.rotateZ(0.12); g.translate(0.03, -0.02, 0.02); }
      place(g); parts.push(g);
    }
  });
  for (const y of [s / 2 - th / 2, -s / 2 + th / 2]) for (let k = 0; k < nb; k++) {
    if (o.broken && y > 0 && k === 1) continue;
    const g = boardGeo(s, bw * 0.94, th, k % 4); g.translate(0, y, -s / 2 + bw * (k + 0.5)); parts.push(g);
  }
  // corner battens + mid bands
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const g = boardGeo(s * 1.02, 0.07, 0.07, 3); g.rotateZ(Math.PI / 2); g.translate(x * (s / 2 + 0.01), 0, z * (s / 2 + 0.01)); parts.push(g); }
  const mesh = new THREE.Mesh(mergeGeometries(parts), plankMat());
  mesh.castShadow = true; mesh.receiveShadow = true;
  const root = new THREE.Group(); root.add(mesh); mesh.position.y = s / 2;
  root.rotation.set((r() - 0.5) * 0.2, r() * TAU, (r() - 0.5) * 0.2);
  return { root, mesh, update() {} };
}

export function makePlanks(opts = {}) {
  const o = { count: 12, area: [10, 6], center: [0, 0], heightAt: () => 0, seed: 19, ...opts };
  const r = rng(o.seed), parts = [];
  for (let i = 0; i < o.count; i++) {
    const len = 0.8 + r() * 2.2, g = boardGeo(len, 0.18 + r() * 0.1, 0.04, i % 4);
    const x = o.center[0] + (r() - 0.5) * o.area[0], z = o.center[1] + (r() - 0.5) * o.area[1];
    g.rotateZ((r() - 0.5) * 0.25); g.rotateX((r() - 0.5) * 0.2); g.rotateY(r() * TAU);
    g.translate(x, o.heightAt(x, z) + 0.01, z);
    parts.push(g);
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts), plankMat());
  mesh.castShadow = true; mesh.receiveShadow = true;
  const root = new THREE.Group(); root.add(mesh);
  return { root, mesh, update() {} };
}

// ═════════════════════════════════════════════ rocks / cliffs ═════════════════════════════════════════════════════
function rockMaterial(moss = 0.35, wet = 0.7, scale = 0.35) {
  return cachedMat(`rock${moss}|${wet}|${scale}`, () => {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 });
    triplanar(m, 'rock', { scale, bump: 1.6, sharpness: 5, slopeTint: moss > 0 ? { color: '#2a3a1e', amount: moss, up: 0.55 } : null });
    wetSurface(m, { wet });
    return m;
  });
}
function rockGeometry({ radius = 1.5, detail = 5, seed = 1, squash = [1, 0.7, 1], rough = 0.35, flatBottom = true }) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const n3 = makeNoise3(seed), p = g.attributes.position, v = V3();
  const r = rng(seed); const cut = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1].map((x) => x * 0.4);
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    const n = v.clone().normalize();
    let d = 1 + rough * n3.fbm(n.x * 1.6 + seed, n.y * 1.6, n.z * 1.6, 5);
    // a couple of planar facets (fractured faces)
    const f1 = n.dot(V3(0.6 + cut[0], 0.3, 0.7).normalize()); if (f1 > 0.55) d = Math.min(d, 1 + (0.55 - f1) * 0.4 + 0.1);
    const f2 = n.dot(V3(-0.7, 0.2 + cut[1], 0.3 + cut[2]).normalize()); if (f2 > 0.6) d = Math.min(d, 1 + (0.6 - f2) * 0.5 + 0.08);
    d += 0.04 * n3.fbm(n.x * 9, n.y * 9, n.z * 9, 2);
    v.copy(n).multiplyScalar(d * radius);
    v.x *= squash[0]; v.y *= squash[1]; v.z *= squash[2];
    if (flatBottom && v.y < -radius * squash[1] * 0.35) v.y = -radius * squash[1] * 0.35 + (v.y + radius * squash[1] * 0.35) * 0.15;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
export function makeRock(opts = {}) {
  const o = { radius: 1.5, detail: 5, seed: 1, squash: [1, 0.7, 1], rough: 0.35, moss: 0.35, wet: 0.7, pos: [0, 0, 0], rot: [0, 0, 0], flatBottom: true, texScale: null, ...opts };
  const mesh = new THREE.Mesh(rockGeometry(o), rockMaterial(o.moss, o.wet, o.texScale ?? clamp(0.9 / o.radius, 0.08, 0.6)));
  mesh.castShadow = true; mesh.receiveShadow = true;
  const root = new THREE.Group(); root.add(mesh);
  root.position.copy(arr3(o.pos)); root.rotation.set(...o.rot);
  return { root, mesh, update() {} };
}
export function makeCliff(opts = {}) {
  const o = { length: 60, height: 22, depth: 10, seed: 6, pos: [0, 0, 0], yaw: 0, moss: 0.3, ...opts };
  const r = rng(o.seed), geos = [];
  const n = Math.ceil(o.length / 7);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) {
      const rad = (o.height / 3) * (0.8 + r() * 0.5);
      const g = rockGeometry({ radius: rad, detail: 4, seed: o.seed * 50 + i * 3 + k, squash: [0.9 + r() * 0.5, 0.75 + r() * 0.3, 0.6 + r() * 0.3], rough: 0.4, flatBottom: false });
      g.rotateY(r() * TAU);
      g.translate((i / n - 0.5) * o.length + (r() - 0.5) * 3, rad * 0.6 + k * o.height * 0.3, (r() - 0.5) * o.depth * 0.5 - k * 1.5);
      geos.push(g);
    }
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos), rockMaterial(o.moss, 0.6, 0.08));
  mesh.castShadow = true; mesh.receiveShadow = true;
  const root = new THREE.Group(); root.add(mesh);
  root.position.copy(arr3(o.pos)); root.rotation.y = o.yaw;
  return { root, mesh, update() {} };
}

// ═════════════════════════════════════════════ cave ═══════════════════════════════════════════════════════════════
export function makeCave(opts = {}) {
  const o = { radius: 9, length: 1.7, height: 0.62, seed: 8, pool: true, drips: 14, mouth: true, ...opts };
  const n3 = makeNoise3(o.seed), r = rng(o.seed);
  const root = new THREE.Group(); root.name = 'cave';
  // chamber: inward-facing displaced ellipsoid with an opening toward +z
  let g = new THREE.SphereGeometry(o.radius, 120, 72);
  const p = g.attributes.position, v = V3();
  const floorY = 0;
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    const n = v.clone().normalize();
    let d = 1 + 0.18 * n3.fbm(n.x * 2.2, n.y * 2.2, n.z * 2.2, 5) + 0.05 * n3.fbm(n.x * 9, n.y * 9, n.z * 9, 2);
    // stalactite bumps hanging from the ceiling
    if (n.y > 0.2) d -= 0.08 * Math.pow(Math.max(0, n3(n.x * 14, n.y * 3, n.z * 14)), 3) * 4;
    v.copy(n).multiplyScalar(o.radius * d);
    v.z *= o.length; v.y *= o.height;
    if (v.y < 0) v.y = Math.max(v.y * 0.25, -0.8);   // flattened floor
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  if (o.mouth) {
    // remove triangles of the mouth (an arch at +z)
    const idx = g.index.array, keep = [];
    const mz = o.radius * o.length * 0.72;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      const cz = (p.getZ(a) + p.getZ(b) + p.getZ(c)) / 3, cx = (p.getX(a) + p.getX(b) + p.getX(c)) / 3, cy = (p.getY(a) + p.getY(b) + p.getY(c)) / 3;
      const arch = (cx / (o.radius * 0.5)) ** 2 + (Math.max(0, cy) / (o.radius * o.height * 0.75)) ** 2;
      if (cz > mz && arch < 1 + 0.15 * n3(cx * 0.5, cy * 0.5, 3)) continue;
      keep.push(a, b, c);
    }
    g.setIndex(keep);
  }
  const wallMat = new THREE.MeshStandardMaterial({ color: '#b8b6b0', roughness: 0.8, side: THREE.BackSide });
  triplanar(wallMat, 'rock', { scale: 0.22, bump: 2.2, sharpness: 5 });
  wetSurface(wallMat, { wet: 0.85 });
  const walls = new THREE.Mesh(g, wallMat); walls.receiveShadow = true; walls.castShadow = false; walls.name = 'caveWalls';
  root.add(walls);
  // floor: wet rock + puddles
  const fg = new THREE.CircleGeometry(o.radius * 1.05, 96); fg.rotateX(-Math.PI / 2);
  fg.scale(1, 1, o.length);
  const fp = fg.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), z = fp.getZ(i); fp.setY(i, floorY - 0.02 + 0.12 * n3.fbm(x * 0.3, 0, z * 0.3, 4)); }
  fg.computeVertexNormals();
  const floorMat = new THREE.MeshStandardMaterial({ color: '#9a9690', roughness: 0.9 });
  triplanar(floorMat, 'rock', { scale: 0.4, bump: 1.4 });
  wetSurface(floorMat, { wet: 0.9, puddles: 0.55, puddleScale: 0.12, puddleLevel: 0.55 });
  const floor = new THREE.Mesh(fg, floorMat); floor.receiveShadow = true;
  root.add(floor);
  // stalactites
  const stal = [];
  const tips = [];
  for (let k = 0; k < 70; k++) {
    const a = r() * TAU, d = Math.sqrt(r()) * o.radius * 0.8;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * o.length * 0.85;
    const ceil = o.radius * o.height * Math.sqrt(Math.max(0.05, 1 - (d / (o.radius * 1.02)) ** 2)) * 0.92;
    const len = 0.3 + r() * r() * 2.2, rad = 0.05 + len * 0.09;
    const cg = new THREE.ConeGeometry(rad, len, 7, 4, true);
    const cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) { const yy = cp.getY(i); const w = 1 + 0.25 * n3(cp.getX(i) * 9 + k, yy * 5, cp.getZ(i) * 9); cp.setX(i, cp.getX(i) * w); cp.setZ(i, cp.getZ(i) * w); }
    cg.computeVertexNormals();
    cg.rotateX(Math.PI); cg.translate(x, ceil - len / 2, z);
    stal.push(cg);
    if (tips.length < o.drips && len > 0.5) tips.push(V3(x, ceil - len, z));
  }
  const stalMat = new THREE.MeshStandardMaterial({ color: '#a9a49a', roughness: 0.5 });
  triplanar(stalMat, 'rock', { scale: 0.9, bump: 1 });
  wetSurface(stalMat, { wet: 1 });
  const sm = new THREE.Mesh(mergeGeometries(stal), stalMat); sm.receiveShadow = true;
  root.add(sm);
  // pool
  let pool = null;
  if (o.pool) {
    const pg = new THREE.CircleGeometry(2.6, 64); pg.rotateX(-Math.PI / 2); pg.scale(1.4, 1, 1);
    const pm = new THREE.MeshPhysicalMaterial({ color: '#05080a', roughness: 0.02, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.2 });
    wetSurface(pm, { wet: 0, puddles: 1, puddleScale: 0.001, puddleLevel: 2, ripples: 1.4, rippleScale: 1.6, puddleColor: '#03060a' });
    pool = new THREE.Mesh(pg, pm);
    pool.position.set(-o.radius * 0.3, floorY + 0.06, -o.radius * o.length * 0.25);
    pool.rotation.y = 0.4;
    root.add(pool);
  }
  const mouth = V3(0, o.radius * o.height * 0.35, o.radius * o.length * 0.9);
  return { root, update() {}, floorY, pool, mouth, dripTips: tips, walls };
}

// ═════════════════════════════════════════════ campfire ═══════════════════════════════════════════════════════════
const FLAME_V = /* glsl */`
varying vec2 vUv; varying float vSeed;
attribute float aSeed;
void main() {
  vUv = uv; vSeed = aSeed;
  // cylindrical billboard: keep local up, face the camera around Y
  vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 toCam = cameraPosition - c; toCam.y = 0.0; toCam = normalize(toCam + vec3(1e-4));
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
  float sx = length(instanceMatrix[0].xyz), sy = length(instanceMatrix[1].xyz);
  vec3 wp = c + right * position.x * sx + vec3(0.0, 1.0, 0.0) * position.y * sy;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const FLAME_F = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vSeed;
uniform sampler2D tNoise; uniform float uTime, uIntensity;
void main() {
  vec2 uv = vUv;
  float t = uTime * (1.6 + vSeed * 0.7);
  // two scrolling turbulence layers; the upper flame is stretched and torn into tongues
  vec2 nuv = vec2(uv.x * 1.3 + vSeed * 3.7, uv.y * 0.9 - t * 0.9);
  float n1 = texture2D(tNoise, nuv).r;
  float n2 = texture2D(tNoise, vec2(uv.x * 2.6 - vSeed, uv.y * 1.6 - t * 1.4)).g;
  float n = n1 * 0.6 + n2 * 0.4;
  float x = (uv.x - 0.5) * 2.0;
  x += (n1 - 0.5) * 1.1 * uv.y * uv.y + sin(uv.y * 7.0 - t * 4.0 + vSeed * 9.0) * 0.08 * uv.y;
  float width = mix(0.9, 0.0, pow(uv.y, 0.7));
  float body = 1.0 - smoothstep(width * 0.7, width, abs(x));
  body *= smoothstep(0.0, 0.06, uv.y);
  float tongue = smoothstep(0.42, 0.62, n + 0.55 - uv.y * 0.95);
  float flame = clamp(body * tongue, 0.0, 1.0);
  float core = smoothstep(0.55, 1.0, flame) * smoothstep(0.75, 0.15, uv.y);
  vec3 col = mix(vec3(0.6, 0.08, 0.01), vec3(1.0, 0.36, 0.05), smoothstep(0.0, 0.4, flame));
  col = mix(col, vec3(1.0, 0.7, 0.32), smoothstep(0.4, 0.8, flame));
  col = mix(col, vec3(1.0, 0.93, 0.78), core);
  gl_FragColor = vec4(col * flame * uIntensity * (0.9 + core * 1.6), 1.0);
}`;
const SPRITE_V = /* glsl */`
attribute vec4 aData;   // seed, phase, speed, size
uniform float uTime, uLife, uRise, uSpread, uSize;
varying float vAge; varying vec2 vUv; varying float vSeed;
float h(float n) { return fract(sin(n * 127.1) * 43758.5453); }
void main() {
  float age = fract(uTime / uLife * aData.z + aData.y);
  float cyc = floor(uTime / uLife * aData.z + aData.y);
  float s = aData.x + cyc * 7.31;
  vec3 base = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 p = base + vec3((h(s) - 0.5) * 0.4, 0.0, (h(s + 1.7) - 0.5) * 0.4);
  p.y += age * uRise * (0.7 + 0.6 * h(s + 3.1));
  p.x += sin(age * 6.0 + s) * uSpread * age + (h(s + 5.3) - 0.5) * uSpread * age * 2.0;
  p.z += cos(age * 5.0 + s * 1.3) * uSpread * age + (h(s + 8.9) - 0.5) * uSpread * age * 2.0;
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float sz = uSize * aData.w * (0.4 + age * 1.6);
  vec3 wp = p + (right * position.x + up * position.y) * sz;
  vAge = age; vUv = uv; vSeed = s;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const SMOKE_F = /* glsl */`
precision highp float;
varying float vAge; varying vec2 vUv; varying float vSeed;
uniform sampler2D tNoise; uniform vec3 uColor; uniform float uOpacity;
void main() {
  vec2 d = vUv - 0.5;
  float n = texture2D(tNoise, vUv * 0.7 + vec2(vSeed * 0.13, vAge * 0.2)).r;
  float a = smoothstep(0.5, 0.1, length(d) + (n - 0.5) * 0.35);
  a *= smoothstep(0.0, 0.15, vAge) * (1.0 - vAge) * uOpacity;
  gl_FragColor = vec4(uColor * (0.7 + n * 0.5), a);
}`;
const EMBER_F = /* glsl */`
precision highp float;
varying float vAge; varying vec2 vUv; varying float vSeed;
void main() {
  float d = length(vUv - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  float tw = 0.6 + 0.4 * sin(vAge * 40.0 + vSeed * 9.0);
  vec3 c = mix(vec3(1.0, 0.75, 0.3), vec3(1.0, 0.25, 0.03), vAge);
  gl_FragColor = vec4(c * a * (1.0 - vAge) * tw * 14.0, 1.0);
}`;
function spriteSystem(count, frag, uniforms, blending, seed) {
  const base = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  const r = rng(seed), d = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { d[i * 4] = r() * 100; d[i * 4 + 1] = r(); d[i * 4 + 2] = 0.7 + r() * 0.6; d[i * 4 + 3] = 0.5 + r(); }
  g.setAttribute('aData', new THREE.InstancedBufferAttribute(d, 4));
  g.instanceCount = count;
  const m = new THREE.ShaderMaterial({ vertexShader: SPRITE_V, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, blending, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}
export function makeCampfire(opts = {}) {
  const o = { scale: 1, intensity: 1, light: true, smoke: true, embers: 60, seed: 12, ...opts };
  const r = rng(o.seed);
  const root = new THREE.Group(); root.name = 'campfire';
  const s = o.scale;
  // logs (teepee + two crossed), charred: bark + emissive glowing cracks at the base
  const logMat = new THREE.MeshStandardMaterial({ color: '#4a4440', roughness: 0.9, emissive: new THREE.Color('#ff5a14'), emissiveIntensity: 0 });
  triplanar(logMat, 'bark', { scale: 2.2, bump: 1.2 });
  const glowU = { uGlow: { value: 1 } };
  const pob = logMat.onBeforeCompile;
  logMat.onBeforeCompile = (shader, rr) => {
    pob(shader, rr);
    Object.assign(shader.uniforms, glowU);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uGlow;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ float cracks = 1.0 - triD.b; float low = smoothstep(0.55, 0.0, vRWorldPos.y - ${(0).toFixed(1)});
  float fl = 0.7 + 0.3 * sin(uTime * 6.0 + vRWorldPos.x * 9.0) * sin(uTime * 3.7 + vRWorldPos.z * 7.0);
  totalEmissiveRadiance = vec3(1.0, 0.32, 0.06) * pow(cracks, 3.0) * low * uGlow * fl * 6.0; }`);
  };
  const pk = logMat.customProgramCacheKey; logMat.customProgramCacheKey = () => pk() + '|ember';
  const logs = [];
  for (let k = 0; k < 6; k++) {
    const L = (0.75 + r() * 0.3) * s, rad = (0.045 + r() * 0.03) * s;
    const g = new THREE.CylinderGeometry(rad, rad * 1.15, L, 9, 3);
    const lp = g.attributes.position;
    for (let i = 0; i < lp.count; i++) lp.setX(i, lp.getX(i) * (1 + 0.15 * Math.sin(lp.getY(i) * 20 + k)));
    g.computeVertexNormals();
    const a = (k / 6) * TAU + r() * 0.3;
    const m = new THREE.Mesh(g, logMat);
    if (k < 4) { m.position.set(Math.cos(a) * 0.18 * s, L * 0.36, Math.sin(a) * 0.18 * s); m.rotation.set(Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75); m.rotation.order = 'XZY'; }
    else { m.position.set(0, rad, 0); m.rotation.set(Math.PI / 2, a, 0); m.rotation.order = 'YXZ'; m.scale.y = 1.4; }
    m.castShadow = true; m.receiveShadow = true;
    root.add(m); logs.push(m);
  }
  // stone ring
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * TAU;
    const st = makeRock({ radius: (0.11 + r() * 0.06) * s, detail: 2, seed: o.seed * 10 + k, squash: [1.2, 0.75, 1], moss: 0, wet: 0.4,
      pos: [Math.cos(a) * 0.55 * s, 0.03 * s, Math.sin(a) * 0.55 * s], rot: [0, r() * TAU, 0] });
    st.mesh.castShadow = false;
    root.add(st.root);
  }
  // ash bed
  const ash = new THREE.Mesh(new THREE.CircleGeometry(0.45 * s, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1a1716', roughness: 1, emissive: '#ff3a0a', emissiveIntensity: 0.6 }));
  ash.position.y = 0.01; root.add(ash);
  // flames: instanced cylindrical billboards
  const nf = 7;
  const fg = new THREE.PlaneGeometry(1, 1); fg.translate(0, 0.5, 0);
  fg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(Array.from({ length: nf }, () => r())), 1));
  const flameU = { tNoise: { value: getNoiseTex(3, 256) }, uTime: RU.uTime, uIntensity: { value: o.intensity } };
  const flameMat = new THREE.ShaderMaterial({ vertexShader: FLAME_V, fragmentShader: FLAME_F, uniforms: flameU, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false, toneMapped: false, side: THREE.DoubleSide });
  const flames = new THREE.InstancedMesh(fg, flameMat, nf);
  const m4 = new THREE.Matrix4();
  for (let k = 0; k < nf; k++) {
    const a = (k / nf) * TAU, d = k === 0 ? 0 : 0.08 + r() * 0.08;
    const h = (k === 0 ? 1.05 : 0.55 + r() * 0.45) * s, w = (k === 0 ? 0.55 : 0.3 + r() * 0.2) * s;
    m4.makeScale(w, h, w).setPosition(Math.cos(a) * d * s, 0.04 * s, Math.sin(a) * d * s);
    flames.setMatrixAt(k, m4);
  }
  flames.frustumCulled = false; flames.renderOrder = 10;
  root.add(flames);
  // embers + smoke
  let embers = null, smoke = null;
  const emU = { uTime: RU.uTime, uLife: { value: 2.2 }, uRise: { value: 2.4 * s }, uSpread: { value: 0.35 * s }, uSize: { value: 0.022 * s } };
  if (o.embers) { embers = spriteSystem(o.embers, EMBER_F, emU, THREE.AdditiveBlending, o.seed + 1); root.add(embers); embers.renderOrder = 11; }
  const smU = { uTime: RU.uTime, uLife: { value: 6 }, uRise: { value: 4.5 * s }, uSpread: { value: 0.6 * s }, uSize: { value: 0.9 * s },
    tNoise: { value: getNoiseTex(3, 256) }, uColor: { value: C('#2a2a2c') }, uOpacity: { value: 0.35 } };
  if (o.smoke) { smoke = spriteSystem(18, SMOKE_F, smU, THREE.NormalBlending, o.seed + 2); smoke.position.y = 0.6 * s; root.add(smoke); smoke.renderOrder = 9; }
  // light
  let light = null;
  if (o.light) {
    light = new THREE.PointLight('#ff8a3c', 0, 14 * s, 2);
    light.position.set(0, 0.55 * s, 0);
    root.add(light);
  }
  const fill = new THREE.PointLight('#ff5a1a', 0, 5 * s, 2); fill.position.set(0, 0.15 * s, 0); root.add(fill);
  return {
    root, light, flames, embers, smoke, logs,
    update(t) {
      const fl = 0.78 + 0.12 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1) + 0.1 * Math.sin(t * 17.3 + 2) * Math.sin(t * 2.1);
      if (light) {
        light.intensity = 7 * o.intensity * fl * s * s;
        light.position.x = 0.04 * s * Math.sin(t * 7.3); light.position.z = 0.04 * s * Math.cos(t * 6.1);
      }
      fill.intensity = 2 * o.intensity * fl * s * s;
    },
  };
}

// ═════════════════════════════════════════════ lights ═════════════════════════════════════════════════════════════
const RIGS = {
  forest: { key: ['#cfd8de', 1.4, [0.4, 1, 0.25]], fill: ['#7d8c94', 0.25, [-0.6, 0.4, -0.3]], rim: ['#e8eef2', 0.6, [-0.3, 0.6, -1]], amb: 0.0 },
  beachDusk: { key: ['#ffd7b0', 1.6, [0.35, 0.18, -1]], fill: ['#6d7e8c', 0.3, [-0.5, 0.6, 0.6]], rim: ['#ffe2c4', 0.8, [0.2, 0.25, -1]], amb: 0 },
  night: { key: ['#9db4d0', 0.35, [-0.4, 0.8, -0.5]], fill: ['#2a3542', 0.15, [0.5, 0.3, 0.6]], rim: ['#bcd0ec', 0.5, [0.1, 0.5, -1]], amb: 0 },
  cave: { key: ['#9fb6c8', 0.5, [0.0, 0.35, 1]], fill: ['#334048', 0.1, [0.6, 0.5, -0.4]], rim: ['#b9cfdf', 0.5, [0, 0.3, 1]], amb: 0 },
  closeup: { key: ['#d8e2e8', 1.6, [0.7, 0.6, 0.5]], fill: ['#56646c', 0.3, [-0.7, 0.2, 0.4]], rim: ['#f2f6fa', 2.2, [-0.4, 0.5, -1]], amb: 0 },
};
export function makeLightRig(kind = 'forest', opts = {}) {
  const R = RIGS[kind] || RIGS.forest;
  const o = { shadows: false, shadowBox: 8, target: [0, 1, 0], intensity: 1, ...opts };
  const root = new THREE.Group(); root.name = 'lights:' + kind;
  const tgt = new THREE.Object3D(); tgt.position.copy(arr3(o.target)); root.add(tgt);
  const mk = ([col, inten, dir], shadow) => {
    const l = new THREE.DirectionalLight(col, inten * o.intensity);
    const d = arr3(o[`${shadow ? 'key' : ''}Dir`] && shadow ? o.keyDir : dir).normalize();
    l.position.copy(tgt.position).addScaledVector(d, 30); l.target = tgt;
    if (shadow && o.shadows) {
      l.castShadow = true; l.shadow.mapSize.set(o.shadowMap ?? 1536, o.shadowMap ?? 1536); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02;
      const b = o.shadowBox; Object.assign(l.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 1, far: 80 });
      l.shadow.radius = 3;
    }
    root.add(l); return l;
  };
  const key = mk(R.key, true), fill = mk(R.fill, false), rim = mk(R.rim, false);
  // optional practical: a point light near the subject on the key side gives light FALLOFF across flat (blocky) faces,
  // which directional light can't. opts.practical = { pos:[x,y,z] (relative to target), intensity, color, distance }
  let practical = null;
  if (o.practical) {
    const p = o.practical;
    practical = new THREE.PointLight(p.color || R.key[0], (p.intensity ?? 6) * o.intensity, p.distance ?? 6, 2);
    practical.position.copy(tgt.position).add(arr3(p.pos || [-0.9, 0.3, 0.8]));
    root.add(practical);
  }
  const base = [key.intensity, fill.intensity, rim.intensity];
  return {
    root, key, fill, rim, practical,
    update(t, flash = 0) {
      key.intensity = base[0] + flash * 2.5; fill.intensity = base[1] + flash * 0.6; rim.intensity = base[2] + flash * 1.5;
    },
  };
}

let _blobTex = null;
export function makeContactShadow(radius = 0.6, opacity = 0.65) {
  if (!_blobTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(0.45, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    _blobTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: _blobTex, transparent: true, opacity, depthWrite: false, color: '#000000', polygonOffset: true, polygonOffsetFactor: -2 }));
  m.renderOrder = 2; m.name = 'contactShadow';
  return m;
}
