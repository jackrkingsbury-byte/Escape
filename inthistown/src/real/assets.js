/*
 * src/real/assets.js — loader + helpers for the Blender-made hero assets in /src/real/assets/
 * (generated reproducibly by tools/blender/*.py, see tools/blender/build_all.sh).
 *
 * ─── Catalogue ────────────────────────────────────────────────────────────────────────────────────
 *   MODELS        name → { file, tris, size:[x,y,z] m, kind, parts? }      glTF binary, metres, +Y up, origin at the
 *                 base (y = 0 is the ground; rocks/wreck are already sunk a little), vines: origin at the top anchor.
 *   TEXTURE_SETS  name → { tile (m per repeat), height (m) }               seamless 1024² PBR sets in assets/tex/
 *   ENVS          name → file                                             equirect Radiance .hdr (2048×1024)
 *
 * ─── API ──────────────────────────────────────────────────────────────────────────────────────────
 *   await loadAssets(names?)          loads (and caches) models / texture sets / envs by name; default = all models.
 *                                     returns { name: asset } — model asset = { scene, parts, info, gltf }, texture set
 *                                     = textureSet(set) with every image decoded, env = equirect DataTexture.
 *                                     Names may carry an explicit kind prefix: 'model:x', 'tex:x', 'env:x'.
 *   getAsset(name)                    the cached asset (sync; throws if not loaded).
 *   instance(name, opts)              clone of a model (geometry + materials shared). opts:
 *                                       { position:[x,y,z], rotationY, scale, castShadow=true, receiveShadow=true,
 *                                         part: 'plank_long' (a named child of multi-part files) }
 *   part(name, partName, opts)        = instance(name, { ...opts, part: partName })
 *   partNames(name)                   names of the parts of a multi-part file (planks, driftwood, wreck_boat).
 *   setShadows(obj, cast, receive)    recursively sets castShadow / receiveShadow on meshes.
 *   prepareFoliage(obj, opts)         makes leaf/frond/fern/vine materials alpha-tested + double-sided
 *                                     ({ alphaTest=0.5, alphaToCoverage=false }); done automatically on load.
 *   pbrMaterial(set, opts)            MeshStandardMaterial from a tileable set: { repeat | worldSize (m covered by
 *                                     the UV 0..1 range → repeat = worldSize / tile), color, normalScale=1,
 *                                     roughness=1 (multiplier), aoMapIntensity=1, envMapIntensity=1, anisotropy=8 }
 *   textureSet(set)                   { map, normalMap, roughnessMap, aoMap, heightMap } shared base textures.
 *   await loadHDR(name)               equirect DataTexture (for scene.background; mapping already set).
 *   await envFromHDR(renderer, name)  PMREM-filtered env texture for scene.environment (cached per renderer+name).
 *   ASSET_BASE                        '/src/real/assets/'
 *
 * Notes
 *   • Foliage GLB materials are alphaMode MASK (alphaCutoff 0.5) + doubleSided; shadow depth materials inherit
 *     alphaTest/map automatically (three r170), so leaf shadows are cut out too.
 *   • Bark / foliage / wood GLBs reference the shared PNGs in assets/tex/ ("../tex/…"); identical URIs are
 *     deduplicated to ONE three.js Texture across all models, so the atlases are uploaded once.
 *   • Rocks / cliffs / sea stack / cave embed their own baked maps (basecolor JPEG + normal + ORM PNG).
 *   • Normal maps are OpenGL convention (+Y up), matching three.js.
 *   • The .hdr skies follow three's equirect convention: centre column = +X, u = 0.25 = −Z. storm_day's bright
 *     break sits at −Z (in front of a camera at +Z looking at the origin), low on the horizon; storm_night's
 *     moon patch at azimuth −60° (between −Z and +X), 32° up. Rotate with scene.environmentRotation /
 *     scene.backgroundRotation if a shot needs it elsewhere.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export const ASSET_BASE = '/src/real/assets/';

export const MODELS = {
  // rocks (≤ 4k tris, 1024² baked maps)
  rock_boulder:   { file: 'glb/rock_boulder.glb', kind: 'rock' },
  rock_slab:      { file: 'glb/rock_slab.glb', kind: 'rock' },
  rock_spire:     { file: 'glb/rock_spire.glb', kind: 'rock' },
  rock_mossy:     { file: 'glb/rock_mossy.glb', kind: 'rock' },
  rock_block:     { file: 'glb/rock_block.glb', kind: 'rock' },
  rock_mossy_big: { file: 'glb/rock_mossy_big.glb', kind: 'rock' },
  // cliffs / cave (≤ 10k tris, 2048² baked maps)
  cliff_wall:     { file: 'glb/cliff_wall.glb', kind: 'cliff' },
  sea_stack:      { file: 'glb/sea_stack.glb', kind: 'cliff' },
  cave_arch:      { file: 'glb/cave_arch.glb', kind: 'cave' },
  // vegetation
  palm_a:         { file: 'glb/palm_a.glb', kind: 'palm' },
  palm_b:         { file: 'glb/palm_b.glb', kind: 'palm' },
  tree_kapok:     { file: 'glb/tree_kapok.glb', kind: 'tree' },
  tree_fig:       { file: 'glb/tree_fig.glb', kind: 'tree' },
  fern_a:         { file: 'glb/fern_a.glb', kind: 'fern' },
  fern_b:         { file: 'glb/fern_b.glb', kind: 'fern' },
  undergrowth_broadleaf: { file: 'glb/undergrowth_broadleaf.glb', kind: 'fern' },
  vines_hanging:  { file: 'glb/vines_hanging.glb', kind: 'vine' },
  // wreck + debris
  wreck_boat:     { file: 'glb/wreck_boat.glb', kind: 'prop', parts: ['wreck_boat', 'wreck_mast'] },
  planks:         { file: 'glb/planks.glb', kind: 'prop', parts: ['plank_long', 'plank_broken', 'plank_splintered', 'plank_short', 'hull_fragment'] },
  crate:          { file: 'glb/crate.glb', kind: 'prop' },
  rope_coil:      { file: 'glb/rope_coil.glb', kind: 'prop' },
  driftwood_logs: { file: 'glb/driftwood_logs.glb', kind: 'prop', parts: ['driftwood_log', 'driftwood_twisted', 'driftwood_root'] },
};

export const TEXTURE_SETS = {
  wet_sand:      { tile: 2.0,  height: 0.012 },
  beach_pebbles: { tile: 1.5,  height: 0.05 },
  forest_mud:    { tile: 2.0,  height: 0.035 },
  mossy_rock:    { tile: 2.0,  height: 0.07 },
  cliff_rock:    { tile: 4.0,  height: 0.30 },
  tree_bark:     { tile: 1.5,  height: 0.045 },
  palm_bark:     { tile: 1.0,  height: 0.02 },
  wood_planks:   { tile: 1.2,  height: 0.010 },
  wet_fabric:    { tile: 0.25, height: 0.0015 },
  rope:          { tile: 0.25, height: 0.008 },
  driftwood:     { tile: 1.0,  height: 0.012 },
};

export const ENVS = { storm_day: 'env/storm_day.hdr', storm_night: 'env/storm_night.hdr' };

const FOLIAGE_RE = /foliage|palm_dead|leaf|frond|fern|vine/i;

// ───────────────────────────────────────────── caches
const assets = new Map();        // name → Promise<asset>
const resolved = new Map();      // name → asset
const sharedTex = new Map();     // absolute URL → THREE.Texture (dedupe across GLBs)
const texSets = new Map();       // set → { map, normalMap, roughnessMap, aoMap, heightMap }
const pmrems = new WeakMap();    // renderer → Map(name → Texture)
let gltfLoader = null, rgbeLoader = null, texLoader = null;

function loaders() {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    rgbeLoader = new RGBELoader();
    texLoader = new THREE.TextureLoader();
  }
}

const url = (rel) => new URL(ASSET_BASE + rel, location.href).href;

// ───────────────────────────────────────────── loading
export async function loadAssets(names) {
  loaders();
  const list = names == null ? Object.keys(MODELS) : (Array.isArray(names) ? names : [names]);
  const out = {};
  await Promise.all(list.map(async (n) => { out[n] = await loadOne(n); }));
  return out;
}

function loadOne(key) {
  if (assets.has(key)) return assets.get(key);
  const m = /^(model|tex|env):(.+)$/.exec(key);
  const kind = m ? m[1] : (MODELS[key] ? 'model' : TEXTURE_SETS[key] ? 'tex' : ENVS[key] ? 'env' : null);
  const name = m ? m[2] : key;
  let p;
  if (kind === 'model' && MODELS[name]) p = loadModel(name);
  else if (kind === 'tex' && TEXTURE_SETS[name]) p = (async () => { const ts = textureSet(name); await ts.ready; return ts; })();
  else if (kind === 'env' && ENVS[name]) p = loadHDR(name);
  else p = Promise.reject(new Error(`assets.js: unknown asset "${name}" (models: ${Object.keys(MODELS).join(', ')}; sets: ${Object.keys(TEXTURE_SETS).join(', ')}; envs: ${Object.keys(ENVS).join(', ')})`));
  p = p.then((a) => { resolved.set(key, a); if (kind === 'model') resolved.set(name, a); return a; });
  assets.set(key, p);
  return p;
}

async function loadModel(name) {
  const info = MODELS[name];
  const gltf = await gltfLoader.loadAsync(url(info.file));
  dedupeTextures(gltf, url(info.file));
  const scene = gltf.scene;
  scene.name = name;
  const parts = {};
  scene.traverse((o) => {
    if (o !== scene && o.name && !parts[o.name]) parts[o.name] = o;
    if (o.isMesh) {
      o.castShadow = true; o.receiveShadow = true;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.normalMap) m.normalMap.anisotropy = 4;
        if (m.map) m.map.anisotropy = 8;
      }
    }
  });
  prepareFoliage(scene);
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  let tris = 0;
  scene.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return { name, scene, parts, gltf, info: { ...info, tris, size: size.toArray().map((v) => +v.toFixed(2)), box } };
}

// external "../tex/x.png" images referenced by several GLBs → one Texture per absolute URL
function dedupeTextures(gltf, baseUrl) {
  const parser = gltf.parser, json = parser.json;
  const slots = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'];
  const seen = new Set();
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (seen.has(m)) continue;
      seen.add(m);
      for (const s of slots) {
        const t = m[s];
        if (!t) continue;
        const assoc = parser.associations.get(t);
        if (!assoc || assoc.textures == null) continue;
        const img = json.images[json.textures[assoc.textures].source];
        if (!img || !img.uri) continue;           // embedded → unique to this model
        const key = new URL(img.uri, baseUrl).href + '|' + t.colorSpace + '|' + t.flipY;
        const have = sharedTex.get(key);
        if (have) { if (have !== t) { m[s] = have; t.dispose(); } }
        else sharedTex.set(key, t);
      }
    }
  });
}

export function getAsset(name) {
  const a = resolved.get(name);
  if (!a) throw new Error(`assets.js: "${name}" is not loaded — await loadAssets(['${name}']) first`);
  return a;
}

export function partNames(name) { return Object.keys(getAsset(name).parts); }

// ───────────────────────────────────────────── instancing helpers
export function instance(name, opts = {}) {
  const a = getAsset(name);
  let src = a.scene;
  if (opts.part) {
    src = a.parts[opts.part];
    if (!src) throw new Error(`assets.js: "${name}" has no part "${opts.part}" (parts: ${Object.keys(a.parts).join(', ')})`);
  }
  const obj = src.clone(true);
  if (opts.part) obj.position.set(0, 0, 0);   // parts are laid out side by side in the file; re-centre
  const g = new THREE.Group();
  g.name = opts.part ? `${name}:${opts.part}` : name;
  g.add(obj);
  if (opts.position) g.position.fromArray(opts.position);
  if (opts.rotationY != null) g.rotation.y = opts.rotationY;
  if (opts.rotation) g.rotation.fromArray(opts.rotation);
  if (opts.scale != null) Array.isArray(opts.scale) ? g.scale.fromArray(opts.scale) : g.scale.setScalar(opts.scale);
  setShadows(g, opts.castShadow ?? true, opts.receiveShadow ?? true);
  return g;
}

export const part = (name, partName, opts = {}) => instance(name, { ...opts, part: partName });

export function setShadows(obj, cast = true, receive = true) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}

export function prepareFoliage(obj, { alphaTest = 0.5, alphaToCoverage = false } = {}) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!(FOLIAGE_RE.test(m.name) || m.alphaTest > 0)) continue;
      m.transparent = false;
      m.depthWrite = true;
      m.alphaTest = alphaTest;
      m.alphaToCoverage = alphaToCoverage;
      m.side = THREE.DoubleSide;
      m.shadowSide = THREE.DoubleSide;
      m.needsUpdate = true;
    }
  });
  return obj;
}

// ───────────────────────────────────────────── tileable PBR sets
export function textureSet(set) {
  if (texSets.has(set)) return texSets.get(set);
  if (!TEXTURE_SETS[set]) throw new Error(`assets.js: unknown texture set "${set}"`);
  loaders();
  const pending = [];
  const load = (k, srgb) => {
    let done, fail;
    pending.push(new Promise((res, rej) => { done = res; fail = rej; }));
    const t = texLoader.load(url(`tex/${set}_${k}.png`), () => done(), undefined, () => fail(new Error(`texture failed: tex/${set}_${k}.png`)));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    t.name = `${set}_${k}`;
    return t;
  };
  const ts = { map: load('color', true), normalMap: load('normal', false), roughnessMap: load('rough', false), aoMap: load('ao', false),
    info: TEXTURE_SETS[set] };
  ts.ready = Promise.all(pending).then(() => ts);
  let h = null;
  Object.defineProperty(ts, 'heightMap', { get() { return h || (h = load('height', false)); } });
  texSets.set(set, ts);
  return ts;
}

/** resolves when every image of the given texture sets (default: all created so far) has decoded */
export async function texturesReady(sets) {
  await Promise.all((sets || [...texSets.keys()]).map((s) => textureSet(s).ready));
}

export function pbrMaterial(set, opts = {}) {
  const ts = textureSet(set);
  const rep = opts.repeat != null ? opts.repeat : (opts.worldSize != null ? opts.worldSize / ts.info.tile : 1);
  const rx = Array.isArray(rep) ? rep[0] : rep, ry = Array.isArray(rep) ? rep[1] : rep;
  const tex = (t) => { const c = t.clone(); c.repeat.set(rx, ry); c.anisotropy = opts.anisotropy ?? 8; c.needsUpdate = true; return c; };
  const m = new THREE.MeshStandardMaterial({
    name: `pbr_${set}`,
    map: tex(ts.map), normalMap: tex(ts.normalMap), roughnessMap: tex(ts.roughnessMap), aoMap: tex(ts.aoMap),
    color: opts.color != null ? new THREE.Color(opts.color) : new THREE.Color(1, 1, 1),
    roughness: opts.roughness ?? 1.0, metalness: 0,
    aoMapIntensity: opts.aoMapIntensity ?? 1.0, envMapIntensity: opts.envMapIntensity ?? 1.0,
  });
  const ns = opts.normalScale ?? 1;
  m.normalScale.set(ns, ns);
  return m;
}

// ───────────────────────────────────────────── HDR environments
export async function loadHDR(name) {
  if (resolved.has(name)) return resolved.get(name);
  if (!ENVS[name]) throw new Error(`assets.js: unknown env "${name}" (${Object.keys(ENVS).join(', ')})`);
  loaders();
  const t = await rgbeLoader.loadAsync(url(ENVS[name]));
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.name = name;
  resolved.set(name, t);
  return t;
}

export async function envFromHDR(renderer, name = 'storm_day') {
  let m = pmrems.get(renderer);
  if (!m) { m = new Map(); pmrems.set(renderer, m); }
  if (m.has(name)) return m.get(name);
  const hdr = await loadHDR(name);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromEquirectangular(hdr);
  pm.dispose();
  rt.texture.name = `${name}_pmrem`;
  m.set(name, rt.texture);
  return rt.texture;
}
