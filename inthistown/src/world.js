// Module B — sets for "In This Town" (see SPEC.md §6): buildTown(), buildRoom().
//
// ─── Exports ──────────────────────────────────────────────────────────────────────────────────────
//   buildTown({ seed = 3 }) → Set        one compact party town (~120 × 120 m) with every exterior location
//   buildRoom({ wall, floor, window = 'party', poster, variant = 'hero' }) → Set   interior bedroom
//   extras: TABLE_TOP = 0.78, SEAT_H = 0.55, TOWN_PRESETS, ROOM_PRESETS (names), drawKnight(ctx2d, x, y, s, fill)
//
// ─── Set object ───────────────────────────────────────────────────────────────────────────────────
//   { root, anchors, setLighting(preset), update(t), options, set(key, value), background, fog, info }
//   background: one THREE.Color that is mutated in place by setLighting (a sky dome also covers it).
//   fog: one THREE.Fog mutated in place. Lighting presets never add/remove lights or toggle shadows
//   (only colours/intensities/visibility change) so switching presets every frame is cheap and never
//   recompiles shaders.
//   Camera-aware lighting: each set installs a hook on scene.onBeforeRender (chained, idempotent) that
//   fits the single shadow-casting directional light to whatever the camera looks at and (town, night
//   presets) moves 3 coloured "party fill" point lights around the camera's focus. This is a pure function
//   of the camera + the last update(t), so frames stay deterministic. If a set root is not a direct child
//   of the scene, call set.beforeRender(camera) yourself before rendering.
//   options are plain values the engine can snapshot/restore; `lighting` is an option too
//   (set('lighting', p) ≡ setLighting(p)).
//
// ─── Town ─────────────────────────────────────────────────────────────────────────────────────────
//   Layout (metres, +X east, +Z south): main "party street" along X (z = 0, road ±4.5, pavements to
//   ±7.5, house fronts at ±10.5) from the park road (x = −40) to the town square (x 30…62). Foam side
//   street runs south along x = 12. Pool is in the back yard of the north house at x = −3. Park is
//   west of the park road. Hills + starry dome all around.
//   Lighting presets: 'party_night' (default), 'quiet_night', 'dusk', 'day'.
//   Options / set(key, value):
//     lighting     preset name (see above)
//     partyProps   bool  bunting, balloons, string lights, speakers, DJ booth, stage lights, foam cannon
//     foam         0..1  foam heap amount on the foam street (0 = hidden)
//     windowGlow   number 0..1 for every window, or fn(houseIndex, windowIndex) → 0..1
//                  windowIndex: front windows first (0 … nf−1, same j as the house.<i>.window.<j>
//                  anchors), then back windows.
//     fireworks    bool  deterministic bursts over the town (pure function of t in update)
//     standsCrowd  'auto' (= only at dusk) | true | false — simple instanced filler fans on the back two
//                  bleacher rows (the front 3 rows are exposed as anchors for real characters)
//     crowdMotion  0..1  how much the filler fans bounce/wave (set 0 for "the crowd went silent")
//   Anchors (all THREE.Object3D unless noted; +Z of an anchor = the way it faces):
//     myHouse.front   on the front path of the hero's corner house (x −27, south side), facing the street
//     myHouse.door    at the front door, facing out
//     myHouse.window  just outside the lit upstairs window, facing out (towards the street)
//     street.center   middle of the party street (x −16), facing +X (down the street to the square)
//     street.crowdA   dance-crowd spot (x −10), facing −X (towards street.center / camHigh). crowdGrid rows
//                     extend toward the camera; 8 m in front and ±4 m to the sides are clear.
//     street.crowdB   second crowd spot (x 6, z −2.5) facing +Z (across the street); ±5 m along the street
//                     and 7.5 m in front are clear, lit houses + DJ booth behind.
//     street.camHigh  crane position (14 m up, west end) looking down the street
//     street.farEnd   east end of the street by the square, facing back west
//     pool.center     water centre (y = 0 deck level)
//     pool.edge1..4   on the deck ~2.4 m (1,2) / 1.8 m (3,4) outside the water, facing AWAY from the pool
//                     (place with yaw π to face the water). edge1 = house side (lit house behind it).
//     pool.cam        elevated corner view of the pool party
//     foam.center     middle of the foam (heap up to 1.2 m), facing foam.cam
//     foam.cannon     muzzle of the foam cannon, facing along the spray
//     foam.cam        camera spot looking at the foam party
//     square.center   middle of the plaza (ground)
//     square.stage    centre of the stage floor (y = 0.8)
//     square.table    centre of the table top (stage floor + 0.78), same yaw as chairA (+Z = towards chairB)
//     square.chairA   hero's seat: a character root here with 'sit' sits on the folding chair facing the
//                     table (board centre is 0.62 m in front). chairB: the mayor's throne, facing chairA.
//     square.standA / standB   bleacher footprint centres (ground), facing the stage
//     square.standA.rows / standB.rows   ARRAYS of 3 row anchors (front first) at the standing surface of
//                     each row, facing the stage, userData.width = 7.2 (per = 7 people)
//     square.banner   centre of the SUMMER PARTY CHESS MATCH banner (4.4 × 3 m, faces the plaza / cam1);
//                     it fits a 9:16 frame from ≥ 9 m away
//     square.bannerCam  a camera spot that frames the whole banner
//     square.sign     centre of the "knight VS king" sign; square.trophy  trophy on its plinth
//     square.cam1     wide view from the plaza entrance towards the stage; square.cam2  from the stage corner
//                     looking back at stand A + the crowd
//     park.table      centre of the stone table top (y = 0.78), facing south (open lawn, camera side)
//     park.stool1     hero's stool (east side) facing the table (board centre 0.62 m in front); park.stool2
//                     opposite, facing stool1
//     park.cam        wide view of the park corner;   park.tree  base of the big tree
//     house.<i>.window.<j>   outside each FRONT window j of house i (≈0.25 m in front of the glass, facing out)
//     house.<i>.door  at each front door, facing out
//     houses          ARRAY of { index, position: Vector3, yaw, windows: [Object3D], door: Object3D }
//     town.overview   a high camera spot over the west end looking east over the whole town
//     clockTower      base of the clock tower at the west end of the street
//
// ─── Room ─────────────────────────────────────────────────────────────────────────────────────────
//   ~5 × 4.2 m, back wall at z = −2.1, side walls x = ±2.5, open toward +Z (camera side), no ceiling.
//   set.root origin = middle of the floor, and a 3 × 3 m area around it is kept clear (the director puts
//   a table/chair/rug there). Window in the back wall (behind the middle, slightly left), desk against the
//   right wall, bed against the left wall, door + poster + trophy shelf on the back/right walls.
//   window: 'party' | 'dark' | 'day' | 'sunrise'   (also set('window', w) at runtime)
//   variant: 'hero' | 'marcus' | 'brenda' | 'grandad'
//   poster: 'knight' (default for hero) | 'star' | 'music' | 'ball' | 'none'
//   wall / floor: optional colour overrides.
//   Lighting presets: 'night' (default), 'day', 'dawn'.
//   Anchors: room.center (floor centre, facing the open side), room.desk (desk top centre, facing the wall),
//     room.chair (desk chair: character root here with 'sit' faces the desk, desk centre 0.55 m in front),
//     room.bed (top of the mattress centre, facing +Z along the bed), room.window (outside face of the
//     window glass, facing into the room), room.door (in front of the door, facing into the room),
//     room.cam (wide, from the open side), room.camClose, room.shelf, room.poster.
//
// Everything is deterministic: no Math.random / clocks; update(t) sets absolute values from t.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, clamp, lerp, smooth, hash, noise1, canvasTexture, rbox } from './lib/util.js';

export const TABLE_TOP = 0.78;
export const SEAT_H = 0.55;

// ───────────────────────────────────────────────────────────────────────────── fonts (top-level await)
const FONT_DISPLAY = 'ITT World Display';
const FONT_TEXT = 'ITT World Text';
async function loadFonts() {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return;
  const list = [
    [FONT_DISPLAY, '/node_modules/@fontsource/luckiest-guy/files/luckiest-guy-latin-400-normal.woff2', {}],
    [FONT_TEXT, '/node_modules/@fontsource/nunito/files/nunito-latin-900-normal.woff2', { weight: '900' }],
  ];
  const timeout = (ms) => new Promise((res) => setTimeout(res, ms));
  await Promise.all(list.map(async ([fam, url, desc]) => {
    try {
      const f = new FontFace(fam, `url(${url})`, desc);
      await Promise.race([f.load(), timeout(5000)]);
      if (f.status === 'loaded') document.fonts.add(f);
    } catch (e) { console.warn('world.js: font failed', fam, e && e.message); }
  }));
}
await loadFonts();
const fontOK = (fam) => { try { return document.fonts.check(`40px "${fam}"`); } catch (e) { return false; } };
const DISPLAY = () => (fontOK(FONT_DISPLAY) ? `"${FONT_DISPLAY}", ` : '') + 'Impact, "Arial Black", sans-serif';
const TEXTF = () => (fontOK(FONT_TEXT) ? `"${FONT_TEXT}", ` : '') + '"Arial Black", Arial, sans-serif';

// ───────────────────────────────────────────────────────────────────────────── small helpers
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (hex) => new THREE.Color(hex);
const PI = Math.PI;
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
/** Matrix: translate (x,y,z), Euler YXZ (ry yaw, rx pitch, rz roll), scale (sx,sy,sz). */
function M(x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}
/** A local frame on the ground: origin (x,z) with yaw; f(lx, y, lz) → Matrix-ready world coords. */
function frameXZ(x, z, yaw, y0 = 0) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  // local +Z → (sin yaw, cos yaw), local +X → (cos yaw, −sin yaw)
  const f = (lx, ly, lz) => [x + lx * c + lz * s, y0 + ly, z - lx * s + lz * c];
  f.yaw = yaw; f.x = x; f.z = z; f.y = y0;
  return f;
}
function mkAnchor(anchors, parent, name, x, y, z, yaw = 0) {
  const o = new THREE.Object3D();
  o.name = name; o.position.set(x, y, z); o.rotation.set(0, yaw, 0);
  parent.add(o); anchors[name] = o;
  return o;
}
const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);

// ───────────────────────────────────────────────────────────────────────────── base geometries
function prismGeometry() {
  // triangular prism: base width 1 along Z (−.5….5), apex at y = 1, length 1 along X
  const v = [
    [-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, 1, 0], [0.5, 0, -0.5], [0.5, 0, 0.5], [0.5, 1, 0],
  ];
  const tris = [[0, 1, 2], [3, 5, 4], [0, 2, 5], [0, 5, 3], [1, 4, 5], [1, 5, 2], [0, 3, 4], [0, 4, 1]];
  const pos = [];
  for (const t of tris) for (const i of t) pos.push(...v[i]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.computeVertexNormals();
  return g;
}
function flagGeometry() {
  // pennant: hangs from its top edge (y = 0) downward, width 1 along X, length 1 down
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, -1, 0], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0.5, 0], 2));
  return g;
}
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl24: new THREE.CylinderGeometry(0.5, 0.5, 1, 24),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  cone: new THREE.ConeGeometry(0.5, 1, 8),
  cone6: new THREE.ConeGeometry(0.5, 1, 6),
  sphere: new THREE.SphereGeometry(0.5, 14, 10),
  sphereLo: new THREE.SphereGeometry(0.5, 8, 6),
  ico: new THREE.IcosahedronGeometry(0.5, 1),
  ico0: new THREE.IcosahedronGeometry(0.5, 0),
  octa: new THREE.OctahedronGeometry(0.5, 0),
  plane: new THREE.PlaneGeometry(1, 1),
  torus: new THREE.TorusGeometry(0.5, 0.18, 8, 20),
  prism: prismGeometry(),
  flag: flagGeometry(),
};
// 20-face icosahedron with smooth normals (cheap bubble / foam ball)
G.blob = (() => { const g = new THREE.IcosahedronGeometry(0.5, 0); const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) { const v = V3(p.getX(i), p.getY(i), p.getZ(i)).normalize(); n.setXYZ(i, v.x, v.y, v.z); } return g; })();
G.balloon = new THREE.SphereGeometry(0.5, 10, 8);
// put a plane flat on the ground (normal +Y)
const PLANE_FLAT = new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2);

// ───────────────────────────────────────────────────────────────────────────── merged static meshes
const _prepCache = new WeakMap();
function prep(geo) {
  let g = _prepCache.get(geo);
  if (!g) {
    g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.clearGroups();
    _prepCache.set(geo, g);
  }
  return g;
}
/** Collects (geometry, colour, matrix) parts and merges them into one vertex-coloured mesh. */
class Merger {
  constructor() { this.parts = []; }
  add(geo, color, m) {
    const g = prep(geo).clone();
    g.applyMatrix4(m);
    const col = color && color.isColor ? color : C(color);
    const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    this.parts.push(g);
    return this;
  }
  box(color, x, y, z, w, h, d, ry = 0, rx = 0, rz = 0) { return this.add(G.box, color, M(x, y, z, ry, w, h, d, rx, rz)); }
  rbox(color, x, y, z, w, h, d, r = 0.05, ry = 0, rx = 0, rz = 0) { return this.add(rbox(w, h, d, r, 2), color, M(x, y, z, ry, 1, 1, 1, rx, rz)); }
  cyl(color, x, y, z, r, h, seg = 'cyl', ry = 0, rx = 0, rz = 0) { return this.add(G[seg], color, M(x, y, z, ry, r * 2, h, r * 2, rx, rz)); }
  build(material, name, { cast = true, receive = true } = {}) {
    if (!this.parts.length) return null;
    const geo = mergeGeometries(this.parts, false);
    for (const p of this.parts) p.dispose();
    this.parts = [];
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name; mesh.castShadow = cast; mesh.receiveShadow = receive;
    return mesh;
  }
}
const MAT = {
  vc: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.84, metalness: 0 }),
  lam: new THREE.MeshLambertMaterial({ vertexColors: true }),
  lamFlat: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
  vcGloss: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0 }),
  vcFlat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true }),
  vcDouble: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide }),
};

function instanced(geo, material, items, { cast = true, receive = true, name = '' } = {}) {
  const im = new THREE.InstancedMesh(geo, material, Math.max(1, items.length));
  im.name = name;
  items.forEach((it, i) => { im.setMatrixAt(i, it.m); if (it.c) im.setColorAt(i, it.c && it.c.isColor ? it.c : C(it.c)); });
  im.count = items.length;
  im.castShadow = cast; im.receiveShadow = receive;
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere();
  return im;
}

// ───────────────────────────────────────────────────────────────────────────── glow sprites (Points)
const GLOW_VS = /* glsl */`
  attribute float size;
  attribute vec3 color;
  uniform float uScale;
  uniform float uAtten;
  uniform float uMaxPx;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uAtten > 0.5 ? size * uScale / max(0.05, -mv.z) : size * uScale, uMaxPx);
  }`;
const GLOW_FS = /* glsl */`
  uniform float uOpacity;
  uniform float uCore;
  varying vec3 vColor;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    if (r > 1.0) discard;
    float halo = pow(1.0 - r, 2.2);
    float core = smoothstep(0.32, 0.0, r) * uCore;
    gl_FragColor = vec4(vColor * (halo * 0.75 + core) * uOpacity, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const _vp = new THREE.Vector4();
/** Additive camera-facing glows. atten=true: size in world metres; false: size in pixels at 1280 px height. */
function makeGlowPoints(count, { atten = true, core = 0.6, name = 'glow', renderOrder = 5, maxPx = 70 } = {}) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(count), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 600 }, uAtten: { value: atten ? 1 : 0 }, uOpacity: { value: 1 }, uCore: { value: core }, uMaxPx: { value: 80 } },
    vertexShader: GLOW_VS, fragmentShader: GLOW_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = name; pts.frustumCulled = false; pts.renderOrder = renderOrder;
  pts.onBeforeRender = (renderer, scene, camera) => {
    renderer.getCurrentViewport(_vp);
    const h = _vp.w || 720;
    mat.uniforms.uScale.value = atten ? h * 0.5 * camera.projectionMatrix.elements[5] : h / 1280;
    mat.uniforms.uMaxPx.value = maxPx * h / 1280;
  };
  pts.userData.count = count;
  return pts;
}
function setGlow(pts, i, x, y, z, r, g, b, size) {
  const a = pts.geometry.attributes;
  a.position.array[i * 3] = x; a.position.array[i * 3 + 1] = y; a.position.array[i * 3 + 2] = z;
  a.color.array[i * 3] = r; a.color.array[i * 3 + 1] = g; a.color.array[i * 3 + 2] = b;
  a.size.array[i] = size;
}
function glowDirty(pts, pos = true) {
  const a = pts.geometry.attributes;
  if (pos) a.position.needsUpdate = true;
  a.color.needsUpdate = true; a.size.needsUpdate = true;
}

// ───────────────────────────────────────────────────────────────────────────── shared textures
const _texCache = new Map();
function cachedTex(key, w, h, draw, setup) {
  let t = _texCache.get(key);
  if (!t) { t = canvasTexture(w, h, draw); t.anisotropy = 1; if (setup) setup(t); _texCache.set(key, t); }
  return t;
}
function radialTex() {
  return cachedTex('radial', 128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}
function softRectTex() {
  return cachedTex('softrect', 128, 128, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = Math.abs(x / (w - 1) * 2 - 1), dy = Math.abs(y / (h - 1) * 2 - 1);
      const d = Math.max(Math.pow(dx, 3), Math.pow(dy, 3));
      const a = Math.pow(clamp(1 - d, 0, 1), 2.4);
      const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255 * a; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
/** Window pane: white glass with mullions + curtains (instance colour tints it). */
function windowTex() {
  return cachedTex('window', 128, 160, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    // inner glow gradient (brighter centre)
    const gr = g.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, h * 0.75);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(110,110,120,0.55)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // curtains
    g.fillStyle = 'rgba(150,120,140,0.85)';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(30, 0); g.quadraticCurveTo(18, h * 0.5, 26, h); g.lineTo(0, h); g.fill();
    g.beginPath(); g.moveTo(w, 0); g.lineTo(w - 30, 0); g.quadraticCurveTo(w - 18, h * 0.5, w - 26, h); g.lineTo(w, h); g.fill();
    g.fillStyle = 'rgba(120,95,115,0.9)'; g.fillRect(0, 0, w, 10);
    // mullions
    g.fillStyle = '#2a2630'; g.fillRect(w / 2 - 4, 0, 8, h); g.fillRect(0, h * 0.45 - 4, w, 8);
    g.lineWidth = 8; g.strokeStyle = '#2a2630'; g.strokeRect(4, 4, w - 8, h - 8);
  });
}

// ───────────────────────────────────────────────────────────────────────────── chess icons (canvas)
/** Bold chess-knight silhouette (facing left), centred at (x, y), height s. */
export function drawKnight(g, x, y, s, fill = '#fff') {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100); g.fillStyle = fill;
  g.beginPath();
  g.moveTo(-30, 50); g.lineTo(34, 50); g.lineTo(34, 40); g.lineTo(26, 36);
  g.bezierCurveTo(30, 10, 34, -10, 26, -28);
  g.bezierCurveTo(18, -44, 4, -52, -6, -50);
  g.lineTo(-8, -58); g.lineTo(-16, -46);
  g.bezierCurveTo(-28, -38, -38, -22, -42, -8);
  g.lineTo(-44, 2); g.bezierCurveTo(-42, 8, -34, 10, -28, 6);
  g.lineTo(-18, 0); g.bezierCurveTo(-12, -2, -6, 0, -4, 4);
  g.bezierCurveTo(-14, 14, -24, 26, -22, 36);
  g.lineTo(-30, 40); g.closePath(); g.fill();
  // eye + mane notch (cut-outs)
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.arc(-16, -24, 4.5, 0, PI * 2); g.fill();
  g.globalCompositeOperation = 'source-over';
  g.restore();
}
function drawKing(g, x, y, s, fill = '#fff') {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100); g.fillStyle = fill;
  g.fillRect(-5, -58, 10, 26); g.fillRect(-14, -50, 28, 9);           // cross
  g.beginPath();
  g.moveTo(-30, 50); g.lineTo(30, 50); g.lineTo(30, 40); g.lineTo(22, 36);
  g.lineTo(26, -4); g.bezierCurveTo(40, -12, 34, -34, 14, -30); g.lineTo(0, -22);
  g.lineTo(-14, -30); g.bezierCurveTo(-34, -34, -40, -12, -26, -4); g.lineTo(-22, 36); g.lineTo(-30, 40);
  g.closePath(); g.fill();
  g.restore();
}
function drawStar(g, x, y, r, fill, points = 5, inner = 0.45) {
  g.save(); g.fillStyle = fill; g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = -PI / 2 + i * PI / points, rr = i % 2 ? r * inner : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath(); g.fill(); g.restore();
}
function outlinedText(g, text, x, y, font, fill, stroke, lw, shadow = null) {
  g.save(); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  if (shadow) { g.fillStyle = shadow; g.fillText(text, x + lw * 0.35, y + lw * 0.45); g.lineWidth = lw; g.strokeStyle = shadow; g.strokeText(text, x + lw * 0.35, y + lw * 0.45); }
  g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(text, x, y);
  g.fillStyle = fill; g.fillText(text, x, y);
  g.restore();
}
function fitFont(g, text, family, maxW, size) {
  g.font = `${size}px ${family}`;
  const w = g.measureText(text).width;
  return w > maxW ? Math.floor(size * maxW / w) : size;
}

// ───────────────────────────────────────────────────────────────────────────── sky dome
const SKY_VS = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }`;
const SKY_FS = /* glsl */`
  uniform vec3 uZenith, uMid, uHorizon, uGround, uSunDir, uSunColor, uGlowDir, uGlowColor;
  uniform float uSunSize, uSunGlow, uGlowAmt, uSunDisc;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 c;
    if (h >= 0.0) {
      c = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
      c = mix(c, uZenith, smoothstep(0.18, 0.85, h));
    } else {
      c = mix(uHorizon, uGround, smoothstep(0.0, -0.12, h));
    }
    float sd = max(dot(d, uSunDir), 0.0);
    c += uSunColor * (pow(sd, uSunGlow) * 0.55 + pow(sd, uSunGlow * 8.0) * 0.6);
    c += uSunColor * smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.6, sd) * uSunDisc;
    vec3 gd = normalize(vec3(uGlowDir.x, 0.0, uGlowDir.z));
    float gh = max(dot(normalize(vec3(d.x, 0.0, d.z)), gd), 0.0);
    c += uGlowColor * uGlowAmt * pow(gh, 3.0) * exp(-max(h, 0.0) * 9.0) * step(-0.02, h);
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
function makeSky(radius = 450) {
  const u = {
    uZenith: { value: C('#070a24') }, uMid: { value: C('#151a3a') }, uHorizon: { value: C('#2b2f6b') }, uGround: { value: C('#0b0d1c') },
    uSunDir: { value: V3(0, 1, 0) }, uSunColor: { value: C('#000000') }, uSunSize: { value: 0.0 }, uSunGlow: { value: 8 }, uSunDisc: { value: 0 },
    uGlowDir: { value: V3(1, 0, 0) }, uGlowColor: { value: C('#ff4fa3') }, uGlowAmt: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
  mesh.name = 'sky'; mesh.frustumCulled = false; mesh.renderOrder = 2;   // after opaque scenery (cheap fill)
  return mesh;
}
function applySky(sky, p) {
  const u = sky.material.uniforms;
  u.uZenith.value.set(p.zenith); u.uMid.value.set(p.mid); u.uHorizon.value.set(p.horizon); u.uGround.value.set(p.ground);
  u.uSunDir.value.copy(p.sunDir).normalize(); u.uSunColor.value.set(p.sunColor); u.uSunSize.value = p.sunSize ?? 0;
  u.uSunGlow.value = p.sunGlow ?? 8; u.uSunDisc.value = p.sunDisc ?? 0;
  if (p.glowDir) u.uGlowDir.value.copy(p.glowDir);
  u.uGlowColor.value.set(p.glowColor || '#000000'); u.uGlowAmt.value = p.glowAmt || 0;
}
const STAR_VS = /* glsl */`
  attribute float size; attribute float phase;
  uniform float uScale, uTime;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_Position.z = gl_Position.w * 0.9999;
    float tw = 0.65 + 0.35 * sin(uTime * (1.3 + phase * 2.1) + phase * 40.0);
    vA = tw;
    gl_PointSize = size * uScale * (0.8 + 0.3 * tw);
  }`;
const STAR_FS = /* glsl */`
  uniform float uOpacity; uniform vec3 uColor;
  varying float vA;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0) discard;
    float a = pow(1.0 - r, 1.8) * vA * uOpacity;
    gl_FragColor = vec4(uColor * a, 1.0);
    #include <colorspace_fragment>
  }`;
function makeStars(count, seed, radius = 420) {
  const R = rng(seed * 7 + 11);
  const pos = new Float32Array(count * 3), size = new Float32Array(count), phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = R(), v = R();
    const th = u * PI * 2, y = 0.06 + Math.pow(v, 0.8) * 0.94;
    const r = Math.sqrt(1 - y * y);
    pos[i * 3] = Math.cos(th) * r * radius; pos[i * 3 + 1] = y * radius; pos[i * 3 + 2] = Math.sin(th) * r * radius;
    const big = R();
    size[i] = big > 0.97 ? 7 + R() * 3 : big > 0.85 ? 4 + R() * 2 : 2 + R() * 1.8;
    phase[i] = R();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 1 }, uColor: { value: C('#fff6e0') } },
    vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'stars'; pts.frustumCulled = false; pts.renderOrder = 3;
  pts.onBeforeRender = (renderer) => { renderer.getCurrentViewport(_vp); mat.uniforms.uScale.value = (_vp.w || 720) / 1280; };
  return pts;
}
function moonTex() {
  return cachedTex('moon', 256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w * 0.42, h * 0.4, 10, w / 2, h / 2, w / 2);
    gr.addColorStop(0, '#fffdf2'); gr.addColorStop(0.75, '#f3ecd2'); gr.addColorStop(0.96, '#d9cfae'); gr.addColorStop(1, 'rgba(217,207,174,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, PI * 2); g.fill();
    const R = rng(5);
    for (let i = 0; i < 14; i++) {
      const a = R() * PI * 2, rr = R() * w * 0.36, cr = 6 + R() * 18;
      g.fillStyle = `rgba(190,180,150,${0.25 + R() * 0.25})`;
      g.beginPath(); g.arc(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr, cr, 0, PI * 2); g.fill();
    }
  });
}

// ───────────────────────────────────────────────────────────────────────────── camera-aware scene hook
function installSceneHook(root, fn) {
  root.userData.__worldBeforeRender = fn;
  root.addEventListener('added', () => {
    const s = root.parent;
    if (!s || !s.isScene || s.userData.__worldHook) return;
    s.userData.__worldHook = true;
    const prev = s.onBeforeRender;
    s.onBeforeRender = function (renderer, scene, camera, rt) {
      if (prev) prev.call(this, renderer, scene, camera, rt);
      for (const c of scene.children) {
        const f = c.userData && c.userData.__worldBeforeRender;
        if (f && c.visible) f(camera, renderer);
      }
    };
  });
}
const _cp = new THREE.Vector3(), _cf = new THREE.Vector3(), _cr = new THREE.Vector3(), _cu = new THREE.Vector3(), _ct = new THREE.Vector3();
/** Where is the camera looking? → { focus (ground point), dist, pos, fwd, right } in world space. */
function cameraFocus(camera, groundY = 0, maxD = 40) {
  camera.updateMatrixWorld();
  camera.getWorldPosition(_cp);
  camera.getWorldDirection(_cf);
  _cr.set(1, 0, 0).applyQuaternion(camera.getWorldQuaternion(_q)).normalize();
  let d;
  if (_cf.y < -0.04) d = clamp((_cp.y - groundY) / -_cf.y, 1.5, maxD);
  else d = clamp(10 + _cp.y * 0.5, 6, maxD);
  _ct.copy(_cp).addScaledVector(_cf, d);
  _ct.y = groundY;
  return { focus: _ct, dist: d, pos: _cp, fwd: _cf, right: _cr };
}
/** Fit an orthographic directional shadow around `center`, half-size `half`, light coming from `dir`. */
function fitShadow(light, center, half, dir, mapSize) {
  const cam = light.shadow.camera;
  const texel = (half * 2) / mapSize;
  // snap the centre in light space to whole texels to avoid shimmering while the camera moves
  const zAxis = _cu.copy(dir).normalize();
  const xAxis = V3(0, 1, 0).cross(zAxis); if (xAxis.lengthSq() < 1e-6) xAxis.set(1, 0, 0); xAxis.normalize();
  const yAxis = V3().crossVectors(zAxis, xAxis);
  const cx = Math.round(center.dot(xAxis) / texel) * texel, cy = Math.round(center.dot(yAxis) / texel) * texel, cz = center.dot(zAxis);
  const c = V3().addScaledVector(xAxis, cx).addScaledVector(yAxis, cy).addScaledVector(zAxis, cz);
  light.target.position.copy(c);
  light.position.copy(c).addScaledVector(zAxis, 120);
  cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.near = 1; cam.far = 260;
  cam.updateProjectionMatrix();
  light.updateMatrixWorld(); light.target.updateMatrixWorld();
}

// ═════════════════════════════════════════════════════════════════════════════════════════ TOWN
const PAL = {
  party: ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff'],
  walls: ['#e9d8b5', '#c9e4f2', '#f2c4c4', '#d6e8c4', '#f3e3a5', '#cbbfe6'],
  roofs: ['#b5543f', '#4a5d7e', '#6b4a3a', '#3f7a5a'],
  grass: '#4caf50', grass2: '#3c8f45', road: '#3a3d46', pave: '#b9b4ad', curb: '#9d978f', trim: '#fbf6ec',
  doors: ['#3f7a5a', '#b5543f', '#2f4d8a', '#7a1f2b', '#e0a43a', '#5a3b2a'],
  metal: '#2f3a3a', wood: '#b07a4a', woodDark: '#7d5232',
};
const L = {
  roadHW: 4.5, paveW: 3.0, front: 10.5, curb: 0.12,
  x0: -34.5, x1: 30,                                // main street extent (x)
  parkRoad: { x: -40, hw: 3.5, pave: 2.0, z0: -36, z1: 36 },
  foamSt: { x: 12, hw: 3.5, pave: 2.0, z0: 7.5, z1: 44 },
  square: { x0: 30, x1: 62, z0: -18, z1: 18 },
  stage: { x: 53, z: 0, w: 7, d: 12.4, h: 0.8 },   // w along X (depth of the stage), d along Z
  table: { x: 52.2, z: 0 },
  pool: { x: -3, z: -25.5, w: 7.5, d: 4.0 },
  park: { x0: -62, x1: -45.5, z0: -32, z1: 8 },
  parkTable: { x: -53, z: -10 },
};

function townCtx(seed) {
  return {
    R: rng(seed * 13 + 1), seed,
    root: null, party: null, anchors: {},
    m: {
      ground: new Merger(), street: new Merger(), houses: new Merger(), roofs: new Merger(), trim: new Merger(),
      square: new Merger(), stands: new Merger(), park: new Merger(), pool: new Merger(), foam: new Merger(),
      gloss: new Merger(), party: new Merger(), partyGloss: new Merger(), hills: new Merger(),
    },
    windows: [],      // { house, wi, x, y, z, yaw, w, h, front }
    houses: [],       // { index, position, yaw, windows: [], door }
    lamps: [],        // { x, y, z, h }
    bulbs: [],        // { x, y, z, c (palette index), k }
    wires: [],        // flat array of segment endpoints
    flags: [],        // { x, y, z, yaw, c, s, ph }
    balloons: [],     // { x, y, z, c, ph, tx, ty, tz, s }
    trees: [],        // { x, z, s, kind, c }
    glowItems: [],    // { m, base: Color, group: 'party'|'porch'|'stage'|'clock', geo }
    eq: [],           // DJ equaliser bars { x, y, z, yaw, k }
    speakers: [],     // pulsing speaker cones { m, k }
  };
}

// ── catenary helpers
function catenary(a, b, sag, s) {
  return [lerp(a[0], b[0], s), lerp(a[1], b[1], s) - sag * 4 * s * (1 - s), lerp(a[2], b[2], s)];
}
function addStringLights(T, a, b, { sag = 0.6, spacing = 0.55, offset = 0, wire = true } = {}) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const n = Math.max(2, Math.round(len / spacing));
  for (let i = 1; i < n; i++) {
    const p = catenary(a, b, sag, i / n);
    T.bulbs.push({ x: p[0], y: p[1] - 0.07, z: p[2], c: (i + offset) % 6, k: T.bulbs.length });
  }
  if (wire) {
    const segs = 14;
    for (let i = 0; i < segs; i++) T.wires.push(...catenary(a, b, sag, i / segs), ...catenary(a, b, sag, (i + 1) / segs));
  }
}
function addBunting(T, a, b, { sag = 0.5, spacing = 0.48, size = 0.34, offset = 0, wire = true } = {}) {
  const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const n = Math.max(2, Math.round(len / spacing));
  const yaw = Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
  for (let i = 1; i < n; i++) {
    const p = catenary(a, b, sag, i / n);
    T.flags.push({ x: p[0], y: p[1], z: p[2], yaw, c: (i + offset) % 6, s: size, ph: hash(T.flags.length * 1.37 + 0.2) * 6.28 });
  }
  if (wire) {
    const segs = 12;
    for (let i = 0; i < segs; i++) T.wires.push(...catenary(a, b, sag, i / segs), ...catenary(a, b, sag, (i + 1) / segs));
  }
}
function addBalloonCluster(T, x, y, z, n = 5, { spread = 0.35, height = 1.5, s = 1 } = {}) {
  const R = rng(Math.floor(x * 31 + z * 17 + y * 7) + 99);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2 + R() * 0.8, r = spread * (0.4 + R() * 0.8);
    T.balloons.push({
      x: x + Math.cos(a) * r, y: y + height * (0.8 + R() * 0.45), z: z + Math.sin(a) * r,
      c: Math.floor(R() * 6), ph: R() * 6.28, tx: x, ty: y, tz: z, s: s * (0.85 + R() * 0.3),
    });
  }
}
function addTree(T, x, z, s = 1, kind = 'round', c = null) { T.trees.push({ x, z, s, kind, c }); }
function addLamp(T, x, z, y = 0, h = 4.3) { T.lamps.push({ x, y, z, h }); return [x, y + h + 0.38, z]; }
function addGlowBox(T, group, color, m, geo = G.box) { T.glowItems.push({ m, base: C(color), group, geo }); }

// ── ground, roads, pavements, plaza
function plazaTex() {
  return cachedTex('plaza', 512, 512, (g, w, h) => {
    g.fillStyle = '#cfc5b3'; g.fillRect(0, 0, w, h);
    const R = rng(77);
    const n = 16, cs = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = 196 + Math.floor(R() * 22);
      g.fillStyle = `rgb(${v + 8},${v},${v - 14})`;
      g.fillRect(x * cs + 1.5, y * cs + 1.5, cs - 3, cs - 3);
    }
  }, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 7); });
}
function grassTex() {
  return cachedTex('grass', 256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const R = rng(9);
    for (let i = 0; i < 1400; i++) {
      const v = 200 + Math.floor(R() * 55);
      g.fillStyle = `rgba(${v - 30},${v},${v - 40},0.5)`;
      g.fillRect(R() * w, R() * h, 2 + R() * 3, 2 + R() * 3);
    }
  }, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 70); });
}

function buildGround(T) {
  const { m } = T;
  // grass
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(560, 560).rotateX(-PI / 2),
    new THREE.MeshLambertMaterial({ color: PAL.grass, map: grassTex() }));
  ground.position.y = -0.02; ground.receiveShadow = true; ground.name = 'grass'; ground.renderOrder = 1;
  T.root.add(ground);
  const S = m.street;
  const rw = L.roadHW, pw = L.paveW, cb = L.curb;
  // main street road + pavements
  const mx = (L.x0 + L.x1) / 2, ml = L.x1 - L.x0;
  S.box(PAL.road, mx, -0.03, 0, ml + 1, 0.06, rw * 2);
  for (const sg of [-1, 1]) {
    S.box(PAL.pave, mx, cb / 2 - 0.02, sg * (rw + pw / 2), ml, cb + 0.04, pw);
    S.box(PAL.curb, mx, cb / 2 - 0.015, sg * (rw + 0.09), ml, cb + 0.05, 0.18);
  }
  // lane dashes
  for (let x = L.x0 + 2; x < L.x1 - 1; x += 3.2) S.box('#f4f1e6', x, 0.005, 0, 1.6, 0.012, 0.16);
  // park road (north-south, west end)
  const P = L.parkRoad, pl = P.z1 - P.z0, pz = (P.z0 + P.z1) / 2;
  S.box(PAL.road, P.x, -0.03, pz, P.hw * 2, 0.06, pl);
  for (const sg of [-1, 1]) {
    S.box(PAL.pave, P.x + sg * (P.hw + P.pave / 2), cb / 2 - 0.02, pz, P.pave, cb + 0.04, pl);
  }
  for (let z = P.z0 + 2; z < P.z1 - 1; z += 3.2) if (Math.abs(z) > rw + 0.5) S.box('#f4f1e6', P.x, 0.005, z, 0.16, 0.012, 1.6);
  // foam side street (south from the main street)
  const F = L.foamSt, fl = F.z1 - F.z0, fz = (F.z0 + F.z1) / 2;
  S.box(PAL.road, F.x, -0.03, fz, F.hw * 2, 0.06, fl);
  for (const sg of [-1, 1]) S.box(PAL.pave, F.x + sg * (F.hw + F.pave / 2), cb / 2 - 0.02, fz + 0.05, F.pave, cb + 0.04, fl - 0.1);
  // plaza (textured, separate mesh)
  const Q = L.square;
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(Q.x1 - Q.x0, 0.06, Q.z1 - Q.z0),
    new THREE.MeshLambertMaterial({ color: '#ffffff', map: plazaTex() }));
  plaza.position.set((Q.x0 + Q.x1) / 2, -0.03, (Q.z0 + Q.z1) / 2); plaza.receiveShadow = true; plaza.name = 'plaza';
  T.root.add(plaza);
  // giant chessboard inlay in the plaza in front of the stage (8 × 1 m squares) + border
  const sq = T.m.square;
  sq.box('#7d6a52', 42.5, 0.002, 0, 8.6, 0.01, 8.6);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) sq.box((i + j) % 2 ? '#efe2c6' : '#a88b66', 42.5 - 3.5 + i, 0.006, -3.5 + j, 0.98, 0.01, 0.98);
}

// ── houses
/** h: { index, x, z, yaw, w, d, wall, roof, trim, door, kind:'side'|'front', shutters, flowerBox, chimney } */
function buildHouse(T, h) {
  const Hm = T.m.houses, Rf = T.m.roofs, Tr = T.m.trim;
  const f = frameXZ(h.x, h.z, h.yaw);
  const w = h.w, d = h.d, H1 = 3.0, H = 5.8;
  const yaw = h.yaw;
  const P = (lx, ly, lz) => f(lx, ly, lz);
  const box = (mer, col, lx, ly, lz, sx, sy, sz, rx = 0, rz = 0, ryo = 0) => { const p = P(lx, ly, lz); mer.box(col, p[0], p[1], p[2], sx, sy, sz, yaw + ryo, rx, rz); };
  const rb = (mer, col, lx, ly, lz, sx, sy, sz, r = 0.05, rx = 0) => { const p = P(lx, ly, lz); mer.rbox(col, p[0], p[1], p[2], sx, sy, sz, r, yaw, rx); };
  // body
  rb(Hm, h.wall, 0, H / 2, 0, w, H, d, 0.1);
  box(Tr, h.base || '#8c7b6b', 0, 0.22, 0, w + 0.12, 0.44, d + 0.12);
  box(Tr, h.trim, 0, H1, 0, w + 0.1, 0.16, d + 0.1);
  box(Tr, h.trim, 0, H - 0.06, 0, w + 0.14, 0.14, d + 0.14);
  // roof
  const ridgeX = h.kind !== 'front';
  const span = ridgeX ? d : w, len = ridgeX ? w : d;
  const rh = span * 0.42, ov = 0.42, a = Math.atan2(rh, span / 2), th = 0.2;
  const ry = ridgeX ? 0 : PI / 2;
  { const p = P(0, H, 0); Hm.add(G.prism, h.wall, M(p[0], p[1], p[2], yaw + ry, len, rh, span)); }
  const sl = Math.hypot(span / 2 + ov, rh + ov * Math.tan(a));
  for (const sg of [-1, 1]) {
    // slab centre in the roof frame (x along ridge, z across)
    const zc = sg * (span / 2 + ov) / 2, yc = H + (rh - ov * Math.tan(a)) / 2;
    const nz = sg * Math.sin(a) * th / 2, ny = Math.cos(a) * th / 2;
    const lzz = zc + nz, lyy = yc + ny;
    const lx = ridgeX ? 0 : lzz, lz = ridgeX ? lzz : 0;
    const p = P(lx, lyy, lz);
    if (ridgeX) Rf.box(h.roof, p[0], p[1], p[2], len + ov * 2, th, sl, yaw, sg * a, 0);
    else Rf.box(h.roof, p[0], p[1], p[2], sl, th, len + ov * 2, yaw, 0, -sg * a);
  }
  { // ridge cap
    const p = P(0, H + rh + 0.05, 0);
    Rf.box(shade(h.roof, 0.8), p[0], p[1], p[2], ridgeX ? len + ov * 2 + 0.05 : 0.3, 0.16, ridgeX ? 0.3 : len + ov * 2 + 0.05, yaw);
  }
  if (h.chimney !== false) {
    const cx = (h.chimneyX ?? 0.3) * w, cz = ridgeX ? -span * 0.18 : 0;
    const lx = ridgeX ? cx : -w * 0.22, lz = ridgeX ? cz : (h.chimneyX ?? 0.3) * d * -0.5;
    box(Tr, h.chimneyCol || '#9a5b48', lx, H + rh * 0.75, lz, 0.6, rh * 1.3, 0.6);
    box(Tr, '#5d4a42', lx, H + rh * 1.42, lz, 0.72, 0.14, 0.72);
  }
  // door + porch
  const dz = d / 2;
  const doorX = h.doorX ?? 0;
  box(Tr, h.trim, doorX, 1.14, dz + 0.03, 1.36, 2.36, 0.1);
  rb(Hm, h.door, doorX, 1.08, dz + 0.07, 1.06, 2.14, 0.08, 0.03);
  box(Tr, '#e9e3d6', doorX, 1.62, dz + 0.12, 0.6, 0.5, 0.02);          // door panel
  { const p = P(doorX + 0.36, 1.05, dz + 0.14); Tr.add(G.sphereLo, '#ffd23f', M(p[0], p[1], p[2], 0, 0.09, 0.09, 0.09)); }
  box(Tr, '#a8a196', doorX, 0.09, dz + 0.42, 1.7, 0.18, 0.78);           // step
  box(Tr, h.roof, doorX, 2.62, dz + 0.42, 1.9, 0.1, 0.95, -0.18);        // canopy
  for (const sx of [-1, 1]) {                                             // porch lights
    const p = P(doorX + sx * 0.92, 2.0, dz + 0.12);
    Tr.add(G.box, '#2b2b2b', M(p[0], p[1], p[2], yaw, 0.2, 0.3, 0.14));
    addGlowBox(T, 'porch', '#ffd27a', M(...P(doorX + sx * 0.92, 1.98, dz + 0.2), yaw, 0.13, 0.2, 0.05));
  }
  // windows
  const wins = [];
  const addWin = (lx, ly, ww, wh, front, extra = {}) => {
    const sgz = front ? 1 : -1;
    const lz = sgz * (d / 2);
    const fy = yaw + (front ? 0 : PI);
    const pf = P(lx, ly, lz + sgz * 0.035);
    T.m.trim.add(G.box, h.trim, M(pf[0], pf[1], pf[2], fy, ww + 0.2, wh + 0.2, 0.1));
    const ps = P(lx, ly - wh / 2 - 0.12, lz + sgz * 0.1);
    T.m.trim.add(G.box, h.trim, M(ps[0], ps[1], ps[2], fy, ww + 0.36, 0.08, 0.2));
    if (h.shutters && !extra.noShutters) for (const s of [-1, 1]) {
      const pp = P(lx + s * (ww / 2 + 0.26) * sgz, ly, lz + sgz * 0.05);
      Hm.add(G.box, h.shutters, M(pp[0], pp[1], pp[2], fy, 0.34, wh + 0.1, 0.06));
      for (let k = -1; k <= 1; k++) {  // louvre lines
        const pl = P(lx + s * (ww / 2 + 0.26) * sgz, ly + k * wh * 0.28, lz + sgz * 0.085);
        Tr.add(G.box, shade(h.shutters, 0.75), M(pl[0], pl[1], pl[2], fy, 0.28, 0.04, 0.02));
      }
    }
    if (h.flowerBox && front && ly < 3) {
      const pb = P(lx, ly - wh / 2 - 0.26, lz + sgz * 0.2);
      Hm.add(G.box, '#7d5232', M(pb[0], pb[1], pb[2], fy, ww + 0.1, 0.22, 0.26));
      for (let k = 0; k < 5; k++) {
        const pfl = P(lx - ww / 2 + 0.1 + k * (ww - 0.2) / 4, ly - wh / 2 - 0.1, lz + sgz * 0.2);
        Hm.add(G.ico0, PAL.party[(k + h.index) % 6], M(pfl[0], pfl[1], pfl[2], k, 0.17, 0.15, 0.17));
      }
    }
    const pg = P(lx, ly, lz + sgz * 0.092);
    const rec = { house: h.index, wi: wins.length, x: pg[0], y: pg[1], z: pg[2], yaw: fy, w: ww, h: wh, front, round: !!extra.round };
    wins.push(rec); T.windows.push(rec);
    return rec;
  };
  const gx = w * 0.3;
  const ux = [-w * 0.32, 0, w * 0.32];
  // front: upper windows first (they read best from the street), then ground floor
  for (const x of ux) addWin(x, 4.35, 0.96, 1.2, true);
  for (const s of [-1, 1]) addWin(doorX + s * Math.max(gx, 1.7), 1.55, 1.05, 1.3, true);
  if (h.kind === 'front') addWin(0, H + rh * 0.38, 0.7, 0.7, true, { noShutters: true });
  const nFront = wins.length;
  // back
  for (const s of [-1, 1]) addWin(s * w * 0.26, 4.35, 0.96, 1.2, false);
  for (const s of [-1, 1]) addWin(s * w * 0.26, 1.55, 1.05, 1.3, false);
  // side window (upper floor) for corner charm
  // anchors
  const A = T.anchors, root = T.root;
  const winAnchors = [];
  for (let j = 0; j < nFront; j++) {
    const r = wins[j];
    const p = P(0, 0, 0); // unused
    const o = new THREE.Object3D();
    o.name = `house.${h.index}.window.${j}`;
    const out = 0.25;
    o.position.set(r.x + Math.sin(r.yaw) * out, r.y, r.z + Math.cos(r.yaw) * out);
    o.rotation.set(0, r.yaw, 0);
    root.add(o); A[o.name] = o; winAnchors.push(o);
  }
  const door = mkAnchor(A, root, `house.${h.index}.door`, ...P(doorX, 0, dz + 0.95), yaw);
  T.houses.push({ index: h.index, position: V3(h.x, 0, h.z), yaw, windows: winAnchors, door, nFront, spec: h });
  return { f, wins, door, H, rh };
}
function shade(hex, k) { const c = C(hex); c.multiplyScalar(k); return c; }

// ── street furniture & layout
const HOUSE_SPECS = [
  // north row (front faces +Z towards the street)
  { x: -27, z: -14, yaw: 0, w: 8.6, kind: 'side', wall: 2, roof: 0, shutters: '#3f7a5a', flowerBox: true },
  { x: -15, z: -14, yaw: 0, w: 9.0, kind: 'front', wall: 4, roof: 1 },
  { x: -3, z: -14, yaw: 0, w: 9.4, kind: 'side', wall: 1, roof: 2, shutters: '#2f4d8a' },             // pool house
  { x: 9, z: -14, yaw: 0, w: 8.8, kind: 'front', wall: 5, roof: 3, flowerBox: true },
  { x: 21, z: -14, yaw: 0, w: 9.0, kind: 'side', wall: 0, roof: 1, shutters: '#b5543f' },
  // south row (front faces −Z)
  { x: -27, z: 14, yaw: PI, w: 9.0, kind: 'side', wall: '#bfd8ee', roof: '#3b4f78', shutters: '#1d1d22', myHouse: true },
  { x: -15, z: 14, yaw: PI, w: 8.4, kind: 'front', wall: 3, roof: 0, flowerBox: true },
  { x: -3.4, z: 14, yaw: PI, w: 8.6, kind: 'side', wall: 2, roof: 3, shutters: '#7a1f2b' },
  { x: 25, z: 14, yaw: PI, w: 8.6, kind: 'front', wall: 1, roof: 2 },
  // foam street
  { x: 1.5, z: 27, yaw: PI / 2, w: 9.0, kind: 'side', wall: 4, roof: 0, shutters: '#3f7a5a', flowerBox: true },
  { x: 22.5, z: 27, yaw: -PI / 2, w: 9.0, kind: 'front', wall: 5, roof: 1 },
  // around the square
  { x: 37, z: -25, yaw: 0, w: 8.4, kind: 'side', wall: 3, roof: 2, shutters: '#2f4d8a' },
  { x: 48.5, z: -25, yaw: 0, w: 9.0, kind: 'front', wall: 0, roof: 3 },
  { x: 40, z: 25, yaw: PI, w: 9.0, kind: 'front', wall: 1, roof: 0, flowerBox: true },
  { x: 51.5, z: 25, yaw: PI, w: 8.4, kind: 'side', wall: 4, roof: 1, shutters: '#b5543f' },
];
const MY_HOUSE = 5;

function buildStreetscape(T) {
  const S = T.m.street, A = T.anchors, root = T.root;
  // houses
  HOUSE_SPECS.forEach((s, i) => {
    const pick = (v, arr) => (typeof v === 'number' ? arr[v % arr.length] : v);
    const spec = {
      ...s, index: i, d: 7,
      wall: pick(s.wall, PAL.walls), roof: pick(s.roof, PAL.roofs), trim: PAL.trim,
      door: s.myHouse ? '#ffd23f' : PAL.doors[(i * 5 + 1) % PAL.doors.length],
      chimneyX: hash(i * 3.3) > 0.5 ? 0.28 : -0.3, doorX: s.kind === 'front' ? 0 : (hash(i + 0.7) > 0.5 ? -0.6 : 0.6),
    };
    const H = buildHouse(T, spec);
    // front yard: path + fence/hedge (only for houses that face a street with a pavement edge)
    const f = H.f, d = 7;
    const yardDepth = s.yard ?? 3.0;
    const pth = f(spec.doorX, 0.03, d / 2 + yardDepth / 2 + 0.4);
    S.box('#cfc6b6', pth[0], pth[1], pth[2], 1.3, 0.05, yardDepth + 0.8, s.yaw);
    const fenceZ = d / 2 + yardDepth;
    if (i % 3 === 1) {        // hedge
      for (const sg of [-1, 1]) {
        const len = spec.w / 2 + 0.6 - 0.9;
        const p = f(spec.doorX + sg * (0.9 + len / 2), 0.45, fenceZ);
        T.m.park.rbox('#3c8f45', p[0], p[1], p[2], len, 0.9, 0.7, 0.25, s.yaw);
      }
    } else {                  // white picket fence
      for (const sg of [-1, 1]) {
        const x0 = spec.doorX + sg * 0.85, x1 = sg * (spec.w / 2 + 0.6);
        const n = Math.max(2, Math.round(Math.abs(x1 - x0) / 0.3));
        for (let k = 0; k <= n; k++) {
          const p = f(lerp(x0, x1, k / n), 0.4, fenceZ);
          T.m.trim.box(PAL.trim, p[0], p[1], p[2], 0.09, 0.8, 0.05, s.yaw);
        }
        const pr = f((x0 + x1) / 2, 0.55, fenceZ - 0.04);
        T.m.trim.box(PAL.trim, pr[0], pr[1], pr[2], Math.abs(x1 - x0), 0.07, 0.04, s.yaw);
        const pr2 = f((x0 + x1) / 2, 0.25, fenceZ - 0.04);
        T.m.trim.box(PAL.trim, pr2[0], pr2[1], pr2[2], Math.abs(x1 - x0), 0.07, 0.04, s.yaw);
      }
    }
    // mailbox
    const mb = f(spec.doorX + 1.2, 0, fenceZ + 0.35);
    S.box('#5a5a60', mb[0], 0.5, mb[2], 0.07, 1.0, 0.07, s.yaw);
    T.m.gloss.rbox(PAL.party[(i + 2) % 6], mb[0], 1.08, mb[2], 0.3, 0.26, 0.46, 0.08, s.yaw);
    // trees in the yard / behind
    const tl = f(-spec.w / 2 - 1.3, 0, d / 2 + 1.4);
    if (i < 11) addTree(T, tl[0], tl[2], 0.8 + hash(i * 1.7) * 0.35, hash(i * 2.9) > 0.3 ? 'round' : 'pine');
    const tb = f(spec.w * 0.2, 0, -d / 2 - 4 - hash(i) * 3);
    const inPoolYard = tb[0] > -11.5 && tb[0] < 5.5 && tb[2] < -17 && tb[2] > -33.5;
    if (!inPoolYard) addTree(T, tb[0], tb[2], 1.0 + hash(i * 0.9) * 0.5, hash(i * 4.1) > 0.5 ? 'round' : 'pine');
    // bunting across the upper floor of each street-facing house
    if (i < 9) {
      const a = f(-spec.w / 2 + 0.2, 5.55, d / 2 + 0.25), b = f(spec.w / 2 - 0.2, 5.55, d / 2 + 0.25);
      addBunting(T, a, b, { sag: 0.45, offset: i, size: 0.3 });
    }
    if (s.myHouse) {
      // hero's house: knight weather-vane on the roof + anchors
      const vane = f(-spec.w * 0.28, H.H + H.rh * 0.5, 0);
      T.knightVanes = T.knightVanes || [];
      T.knightVanes.push({ x: vane[0], y: vane[1], z: vane[2], yaw: s.yaw });
      const win = H.wins[2];   // upper-right window (from the street)
      win.hero = true;
      mkAnchor(A, root, 'myHouse.window', win.x + Math.sin(win.yaw) * 0.3, win.y, win.z + Math.cos(win.yaw) * 0.3, win.yaw);
      mkAnchor(A, root, 'myHouse.door', ...f(spec.doorX, 0, d / 2 + 0.95), s.yaw);
      mkAnchor(A, root, 'myHouse.front', ...f(spec.doorX, 0.03, d / 2 + yardDepth - 0.6), s.yaw);
    }
  });
  // street lamps (main street) and the zig-zag string lights between them
  const yP = L.curb - 0.02;
  const posts = [];
  for (const x of [-33, -21, -9, 3, 15, 27]) posts.push({ x, z: -5.15, s: 'N' });
  for (const x of [-27, -15, -3, 9, 21]) posts.push({ x, z: 5.15, s: 'S' });
  posts.sort((a, b) => a.x - b.x);
  const tops = posts.map((p) => { const t = addLamp(T, p.x, p.z, yP); return [t[0], t[1] + 0.22, t[2]]; });
  for (let i = 0; i + 1 < tops.length; i++) addStringLights(T, tops[i], tops[i + 1], { sag: 0.75, offset: i * 2 });
  // along each pavement (lower swags)
  for (const side of ['N', 'S']) {
    const ts = posts.map((p, i) => [p, tops[i]]).filter(([p]) => p.s === side).map(([, t]) => t);
    for (let i = 0; i + 1 < ts.length; i++) addStringLights(T, [ts[i][0], ts[i][1] - 0.15, ts[i][2]], [ts[i + 1][0], ts[i + 1][1] - 0.15, ts[i + 1][2]], { sag: 1.0, offset: i * 3 + 1, spacing: 0.6 });
  }
  // bunting straight across the street, lower
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    if (p.s !== 'N') continue;
    addBunting(T, [p.x, 3.9, p.z], [p.x + 0.5, 3.9, -p.z], { sag: 0.35, offset: i });
  }
  // balloons on the lamp posts
  posts.forEach((p, i) => { if (i % 2 === 0) addBalloonCluster(T, p.x, 1.6, p.z, 4, { spread: 0.25, height: 0.9 }); });
  // park road lamps
  for (const z of [-28, -16, -4, 8, 20, 32]) addLamp(T, L.parkRoad.x + (z > 0 ? 4.6 : -4.6), z, yP);
  // foam street lamps
  for (const z of [12, 20, 28, 36]) addLamp(T, L.foamSt.x + (z % 16 === 12 ? -4.6 : 4.6), z, yP);
  // parked cars (away from crowd spots)
  const cars = [
    { x: -30, z: -3.3, yaw: PI / 2, c: '#ff7a2f' }, { x: -22, z: 3.3, yaw: -PI / 2, c: '#4fb3ff' },
    { x: 20, z: -3.3, yaw: PI / 2, c: '#ffd23f' }, { x: 26, z: 3.3, yaw: -PI / 2, c: '#ff4fa3' },
    { x: L.foamSt.x - 2.2, z: 40, yaw: 0, c: '#8a5cff' }, { x: L.parkRoad.x + 2.2, z: 24, yaw: PI, c: '#3ee0c8' },
  ];
  for (const c of cars) buildCar(T, c);
  // trees along the far edges (frame the town)
  const R = rng(T.seed * 3 + 5);
  for (let i = 0; i < 26; i++) {
    const x = -38 + i * 3.4 + R() * 1.5;
    if (!(x > -10 && x < 4)) addTree(T, x, -36 - R() * 6, 1.1 + R() * 0.6, R() > 0.45 ? 'pine' : 'round');
    addTree(T, x + 1.2, 38 + R() * 6, 1.1 + R() * 0.6, R() > 0.45 ? 'pine' : 'round');
  }
  for (let i = 0; i < 9; i++) addTree(T, 64 + R() * 6, -20 + i * 5 + R() * 2, 1.2 + R() * 0.5, R() > 0.5 ? 'pine' : 'round');
  for (let i = 0; i < 6; i++) addTree(T, -44 - R() * 2, 12 + i * 4.5, 1.0 + R() * 0.4, 'round');
  // hills ring
  const Hm = T.m.hills;
  const RH = rng(T.seed * 5 + 3);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * PI * 2 + RH() * 0.15;
    const r = 130 + RH() * 60, s = 40 + RH() * 45;
    const col = ['#3c8f45', '#357a3e', '#4a9a4a', '#2f6e3a'][i % 4];
    Hm.add(G.ico, col, M(Math.cos(a) * r, -s * 0.38, Math.sin(a) * r, RH() * 6, s * 2.2, s * (0.9 + RH() * 0.5), s * 1.6));
  }
  // clock tower (landmark at the west end of the street, in the park)
  buildClockTower(T, -51, 1.5);
  // street anchors
  mkAnchor(A, root, 'street.center', -16, 0, 0, PI / 2);
  mkAnchor(A, root, 'street.crowdA', -10, 0, 0, -PI / 2);
  mkAnchor(A, root, 'street.crowdB', 6, 0, -2.5, 0);
  mkAnchor(A, root, 'street.camHigh', -38, 14, 6, yawTo(-38, 6, -16, 0));
  mkAnchor(A, root, 'street.farEnd', 26, 0, 0, -PI / 2);
  mkAnchor(A, root, 'town.overview', -62, 34, 34, yawTo(-62, 34, 0, -4));
}

function buildCar(T, c) {
  const Mg = T.m.gloss, Mt = T.m.trim;
  const f = frameXZ(c.x, c.z, c.yaw);
  const P = (x, y, z) => f(x, y, z);
  const b = P(0, 0.62, 0); Mg.rbox(c.c, b[0], b[1], b[2], 1.75, 0.62, 3.9, 0.2, c.yaw);
  const cb = P(0, 1.17, -0.25); Mg.rbox(shade(c.c, 0.95), cb[0], cb[1], cb[2], 1.5, 0.55, 2.0, 0.18, c.yaw);
  const gw = P(0, 1.2, -0.25); Mt.rbox('#2b3a52', gw[0], gw[1], gw[2], 1.54, 0.4, 1.86, 0.1, c.yaw);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = P(sx * 0.8, 0.36, sz * 1.25); Mt.add(G.cyl, '#1b1b1f', M(w[0], w[1], w[2], c.yaw, 0.68, 0.32, 0.68, 0, PI / 2));
    const hc = P(sx * 0.82, 0.36, sz * 1.25); Mt.add(G.cyl, '#d9d9de', M(hc[0], hc[1], hc[2], c.yaw, 0.32, 0.34, 0.32, 0, PI / 2));
  }
  for (const sx of [-1, 1]) {
    const hl = P(sx * 0.55, 0.7, 1.96); Mt.box('#fff6d0', hl[0], hl[1], hl[2], 0.34, 0.16, 0.05, c.yaw);
    const tl = P(sx * 0.6, 0.72, -1.96); Mt.box('#d0302a', tl[0], tl[1], tl[2], 0.3, 0.14, 0.05, c.yaw);
  }
}

function clockTex() {
  return cachedTex('clock', 256, 256, (g, w, h) => {
    g.fillStyle = '#fff8e6'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 6, 0, PI * 2); g.fill();
    g.lineWidth = 12; g.strokeStyle = '#3a2a1c'; g.stroke();
    g.fillStyle = '#3a2a1c';
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; g.beginPath(); g.arc(w / 2 + Math.sin(a) * 96, h / 2 - Math.cos(a) * 96, i % 3 ? 5 : 9, 0, PI * 2); g.fill(); }
    g.lineCap = 'round';
    g.lineWidth = 12; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 40, h / 2 - 34); g.stroke();   // hour
    g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 6, h / 2 - 88); g.stroke();     // minute
    g.beginPath(); g.arc(w / 2, h / 2, 10, 0, PI * 2); g.fill();
  });
}
function buildClockTower(T, x, z) {
  const P = T.m.park;
  P.box('#a8a196', x, 0.3, z, 4.0, 0.6, 4.0);
  P.rbox('#e8d9b8', x, 5.0, z, 3.0, 9.4, 3.0, 0.1);
  P.box('#c9b48c', x, 9.8, z, 3.4, 0.3, 3.4);
  P.rbox('#e8d9b8', x, 11.0, z, 2.6, 2.2, 2.6, 0.08);
  P.box(PAL.trim, x, 12.2, z, 3.0, 0.22, 3.0);
  P.add(G.cone, '#3f7a5a', M(x, 13.9, z, PI / 4, 3.6, 3.2, 3.6));
  P.add(G.sphereLo, '#ffd23f', M(x, 15.6, z, 0, 0.35, 0.35, 0.35));
  for (let i = 0; i < 4; i++) {           // door + windows
    const yaw = i * PI / 2;
    const f = frameXZ(x, z, yaw);
    const w1 = f(0, 4.0, 1.51); P.box('#3b4f78', w1[0], w1[1], w1[2], 0.6, 1.4, 0.05, yaw);
    const w2 = f(0, 7.0, 1.51); P.box('#3b4f78', w2[0], w2[1], w2[2], 0.6, 1.4, 0.05, yaw);
  }
  const dd = frameXZ(x, z, PI / 2)(0, 1.1, 1.52); P.box('#7d5232', dd[0], dd[1], dd[2], 1.1, 2.0, 0.06, PI / 2);
  T.clockFaces = [];
  for (let i = 0; i < 4; i++) T.clockFaces.push({ x, y: 11.0, z, yaw: i * PI / 2, r: 0.95 });
  mkAnchor(T.anchors, T.root, 'clockTower', x, 0, z, PI / 2);
}

// ── canvas art for the square
function bannerTex() {
  return cachedTex('banner', 1024, 700, (g, w, h) => {
    // festive background: magenta → purple with sunburst
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#ff3d9a'); bg.addColorStop(1, '#7b3cff');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h * 0.56);
    for (let i = 0; i < 24; i++) {
      g.rotate(PI / 12); g.fillStyle = i % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(255,230,120,0.10)';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, -900); g.lineTo(90, -900); g.closePath(); g.fill();
    }
    g.restore();
    // checkered border
    const cs = 34;
    for (let x = 0; x < w; x += cs) for (const y of [0, h - cs]) { g.fillStyle = ((x / cs + y / cs) | 0) % 2 ? '#1d1d22' : '#fff8e6'; g.fillRect(x, y, cs, cs); }
    for (let y = cs; y < h - cs; y += cs) for (const x of [0, w - cs]) { g.fillStyle = ((x / cs + y / cs) | 0) % 2 ? '#1d1d22' : '#fff8e6'; g.fillRect(x, y, cs, cs); }
    // stars / confetti
    const R = rng(21);
    for (let i = 0; i < 40; i++) drawStar(g, 50 + R() * (w - 100), 50 + R() * (h - 100), 6 + R() * 10, ['#ffd23f', '#3ee0c8', '#ffffff', '#ff7a2f'][i % 4]);
    const F = DISPLAY();
    // text
    let s1 = fitFont(g, 'SUMMER PARTY', F, w - 150, 120);
    outlinedText(g, 'SUMMER PARTY', w / 2, h * 0.22, `${s1}px ${F}`, '#ffffff', '#1d1d22', 22, 'rgba(40,0,60,0.6)');
    let s2 = fitFont(g, 'CHESS', F, w - 180, 250);
    outlinedText(g, 'CHESS', w / 2, h * 0.52, `${s2}px ${F}`, '#ffe14a', '#1d1d22', 30, 'rgba(40,0,60,0.65)');
    let s3 = fitFont(g, 'MATCH', F, w - 220, 170);
    outlinedText(g, 'MATCH', w / 2, h * 0.8, `${s3}px ${F}`, '#3ee0c8', '#1d1d22', 24, 'rgba(40,0,60,0.6)');
    drawKnight(g, 110, h * 0.52, 120, '#ffffff');
    drawKing(g, w - 110, h * 0.52, 120, '#ffe14a');
  });
}
function vsTex() {
  return cachedTex('vs', 512, 300, (g, w, h) => {
    g.fillStyle = '#141633'; g.fillRect(0, 0, w, h);
    g.lineWidth = 14; g.strokeStyle = '#ff4fa3'; g.strokeRect(10, 10, w - 20, h - 20);
    g.lineWidth = 5; g.strokeStyle = '#ffd23f'; g.strokeRect(24, 24, w - 48, h - 48);
    drawKnight(g, 120, h / 2 + 6, 170, '#ffffff');
    drawKing(g, w - 120, h / 2 + 6, 170, '#ffd23f');
    const F = DISPLAY();
    outlinedText(g, 'VS', w / 2, h / 2 + 8, `110px ${F}`, '#3ee0c8', '#000000', 12);
  });
}
function backdropTex() {
  return cachedTex('backdrop', 1024, 420, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#3a2a8c'); bg.addColorStop(1, '#1b1650');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // big checker band at the bottom
    const cs = 48;
    for (let x = 0; x < w; x += cs) for (let y = h - cs * 2; y < h; y += cs) {
      g.fillStyle = ((x / cs + y / cs) | 0) % 2 ? '#f0d9b5' : '#b58863'; g.fillRect(x, y, cs, cs);
    }
    const R = rng(4);
    for (let i = 0; i < 60; i++) drawStar(g, R() * w, R() * (h - 120), 3 + R() * 7, `rgba(255,255,255,${0.35 + R() * 0.5})`);
    drawKnight(g, 120, h * 0.45, 210, 'rgba(255,255,255,0.22)');
    g.save(); g.translate(w - 120, 0); g.scale(-1, 1); drawKnight(g, 0, h * 0.45, 210, 'rgba(255,255,255,0.22)'); g.restore();
  });
}
function stripeTex(a, b, n = 8, vertical = true, key) {
  return cachedTex(key || `stripe${a}${b}${n}${vertical}`, 64, 64, (g, w, h) => {
    for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; if (vertical) g.fillRect(i * w / n, 0, w / n + 1, h); else g.fillRect(0, i * h / n, w, h / n + 1); }
  });
}

// ── town square
function buildSquare(T) {
  const S = T.m.square, A = T.anchors, root = T.root, Pm = T.m.party;
  const st = L.stage, tb = L.table;
  const sx0 = st.x - st.w / 2, sx1 = st.x + st.w / 2, sz = st.d / 2, sh = st.h;
  // stage body + deck + stripes on the front skirt
  S.box('#2b2f6b', st.x, sh / 2 - 0.04, st.z, st.w, sh - 0.08, st.d);
  S.box('#c8955a', st.x, sh - 0.04, st.z, st.w + 0.12, 0.08, st.d + 0.12);
  for (let i = 0; i < 16; i++) S.box(i % 2 ? '#ffd23f' : '#ff4fa3', sx0 - 0.02, sh / 2 - 0.06, -sz + (i + 0.5) * st.d / 16, 0.04, sh - 0.2, st.d / 16 - 0.02);
  // steps (front, south half)
  for (let k = 0; k < 3; k++) S.box('#c8955a', sx0 - 0.35 - k * 0.35, (3 - k) * sh / 4 - sh / 8, 4.2, 0.36, (3 - k) * sh / 4, 1.8);
  // backdrop wall + frame
  const bx = sx1 - 0.25;
  S.box('#1b1650', bx + 0.08, sh + 2.7, 0, 0.3, 5.4, st.d - 0.4);
  const back = new THREE.Mesh(G.plane, new THREE.MeshStandardMaterial({ map: backdropTex(), roughness: 0.9 }));
  back.position.set(bx - 0.08, sh + 2.7, 0); back.rotation.y = -PI / 2; back.scale.set(st.d - 0.4, 5.4, 1); back.receiveShadow = true;
  root.add(back);
  S.box('#ffd23f', bx - 0.1, sh + 5.45, 0, 0.12, 0.14, st.d - 0.3);
  // the banner (on the backdrop, facing the plaza)
  const bw = 4.4, bh = 3.0, by = sh + 3.15;
  const banner = new THREE.Mesh(G.plane, new THREE.MeshStandardMaterial({ map: bannerTex(), roughness: 0.7, emissive: '#ffffff', emissiveMap: bannerTex(), emissiveIntensity: 0.18 }));
  banner.position.set(bx - 0.2, by, 0); banner.rotation.y = -PI / 2; banner.scale.set(bw, bh, 1); banner.name = 'banner';
  root.add(banner); T.bannerMesh = banner;
  S.box('#ffd23f', bx - 0.16, by + bh / 2 + 0.06, 0, 0.1, 0.14, bw + 0.3);
  S.box('#ffd23f', bx - 0.16, by - bh / 2 - 0.06, 0, 0.1, 0.14, bw + 0.3);
  for (const s of [-1, 1]) S.box('#ffd23f', bx - 0.16, by, s * (bw / 2 + 0.1), 0.1, bh + 0.25, 0.14);
  mkAnchor(A, root, 'square.banner', bx - 0.21, by, 0, -PI / 2);
  mkAnchor(A, root, 'square.bannerCam', bx - 11.5, by - 0.6, 0, -PI / 2);
  // truss towers + top beam (front corners)
  const tx = sx0 + 0.35, th = 7.2;
  for (const s of [-1, 1]) {
    const tz = s * (sz + 0.2);
    for (const cx of [-0.2, 0.2]) for (const cz of [-0.2, 0.2]) S.cyl('#c7ccd4', tx + cx, th / 2, tz + cz, 0.035, th, 'cyl6');
    for (let y = 0.6; y < th; y += 0.7) S.box('#c7ccd4', tx, y, tz, 0.44, 0.04, 0.44);
    S.box('#3a3d46', tx, 0.06, tz, 0.9, 0.12, 0.9);
  }
  S.box('#c7ccd4', tx, th + 0.1, 0, 0.44, 0.44, st.d + 0.8);
  // stage lights hanging from the beam
  for (let i = 0; i < 6; i++) {
    const z = -sz + 1.2 + i * (st.d - 2.4) / 5;
    S.cyl('#1d1d22', tx + 0.1, th - 0.35, z, 0.17, 0.42, 'cyl', 0, 0, 0.6);
    addGlowBox(T, 'stage', PAL.party[i % 6], M(tx + 0.1 + 0.125, th - 0.35 - 0.182, z, 0, 0.3, 0.03, 0.3, 0, 0.6), G.cyl);
  }
  // light beams (additive cones from 4 of the cans down to the stage)
  T.beams = [];
  for (const [i, z] of [[0, -3.6], [1, -1.2], [2, 1.2], [3, 3.6]]) T.beams.push({ from: [tx + 0.3, th - 0.6, z * 1.2], to: [tb.x + 0.6, sh, z * 0.45], c: PAL.party[[0, 2, 3, 5][i]] });
  // ── the table (top at stage + 0.78), long axis along X
  const ty = sh + TABLE_TOP;
  S.box('#fbf8f2', tb.x, ty - 0.025, tb.z, 1.74, 0.05, 0.9);
  for (const s of [-1, 1]) S.box('#fbf8f2', tb.x, ty - 0.09, tb.z + s * 0.445, 1.74, 0.13, 0.012);   // short cloth overhang (players' sides)
  for (const s of [-1, 1]) {                                                                               // red skirts on the ends
    S.box('#a3263a', tb.x + s * 0.875, sh + 0.39, tb.z, 0.02, 0.78, 0.9);
    S.box('#ffd23f', tb.x + s * 0.887, ty - 0.12, tb.z, 0.012, 0.07, 0.9);
  }
  for (const sx of [-1, 1]) for (const s of [-1, 1]) S.box('#7d5232', tb.x + sx * 0.78, sh + 0.38, tb.z + s * 0.36, 0.06, 0.76, 0.06);
  // ── chairs.  hero (chairA): white folding chair on the south side facing north (yaw π)
  const seatA = { x: tb.x, z: tb.z + 0.62 + 0.02 };
  buildFoldingChair(T.m.gloss, seatA.x, sh, seatA.z, PI);
  // mayor (chairB): red & gold throne on the north side facing south
  const seatB = { x: tb.x, z: tb.z - 0.62 - 0.02 };
  buildThrone(T.m.gloss, seatB.x, sh, seatB.z, 0);
  mkAnchor(A, root, 'square.chairA', tb.x, sh, tb.z + 0.62, PI);
  mkAnchor(A, root, 'square.chairB', tb.x, sh, tb.z - 0.62, 0);
  mkAnchor(A, root, 'square.table', tb.x, ty, tb.z, PI);
  mkAnchor(A, root, 'square.stage', st.x, sh, st.z, -PI / 2);
  // trophy on a plinth beside the table (audience side, north)
  const trX = tb.x - 1.5, trZ = -2.2;
  S.box('#fbf6ec', trX, sh + 0.45, trZ, 0.5, 0.9, 0.5);
  S.box('#7a1f2b', trX, sh + 0.92, trZ, 0.56, 0.04, 0.56);
  T.trophies = T.trophies || [];
  T.trophies.push({ x: trX, y: sh + 0.94, z: trZ, s: 1.25 });
  mkAnchor(A, root, 'square.trophy', trX, sh + 0.94, trZ, -PI / 2);
  // VS sign on a post (north-front of the stage), facing the plaza
  const sgX = sx0 - 1.6, sgZ = -sz - 1.4, sgYaw = yawTo(sgX, sgZ, 40, 2);
  S.cyl('#3a3d46', sgX, 1.6, sgZ, 0.1, 3.2);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: vsTex(), toneMapped: true }));
  { const f = frameXZ(sgX, sgZ, sgYaw); const p = f(0, 3.55, 0.08); sign.position.set(p[0], p[1], p[2]); sign.rotation.y = sgYaw; sign.scale.set(2.6, 1.52, 1); }
  root.add(sign); T.vsSign = sign;
  { const f = frameXZ(sgX, sgZ, sgYaw); const p = f(0, 3.55, 0); S.box('#1d1d22', p[0], p[1], p[2], 2.8, 1.72, 0.12, sgYaw); mkAnchor(A, root, 'square.sign', ...f(0, 3.55, 0.1), sgYaw); }
  // ── bleachers
  const stands = [
    { name: 'standA', x: 42, z: -9.5 }, { name: 'standB', x: 42, z: 9.5 },
  ];
  T.fillerSlots = [];
  const W = 7.6, rows = 5, rise = 0.42, run = 0.85, D = rows * run;
  for (const sd of stands) {
    const yaw = yawTo(sd.x, sd.z, tb.x, tb.z);
    const f = frameXZ(sd.x, sd.z, yaw);
    const Sb = T.m.stands;
    const b = (col, lx, ly, lz, w, h, d) => { const p = f(lx, ly, lz); Sb.box(col, p[0], p[1], p[2], w, h, d, yaw); };
    const riser = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f'];
    for (let r = 0; r < rows; r++) {
      const zc = D / 2 - (r + 0.5) * run, top = (r + 1) * rise;
      b(riser[r % 5], 0, top / 2 - 0.03, zc, W, top - 0.06, run);
      b('#d9a066', 0, top - 0.03, zc, W + 0.06, 0.07, run + 0.02);
      for (const s of [-1, 1]) b('#fbf6ec', s * (W / 2 + 0.07), top / 2, zc, 0.14, top, run);
    }
    b('#fbf6ec', 0, rows * rise + 0.5, -D / 2 - 0.06, W + 0.3, 1.0, 0.1);          // back rail panel
    b('#2b2f6b', 0, (rows * rise) / 2, -D / 2 - 0.06, W + 0.3, rows * rise, 0.1);  // back wall
    for (const s of [-1, 1]) {
      const pole = f(s * (W / 2 + 0.12), 0, -D / 2 - 0.1);
      Sb.cyl('#c7ccd4', pole[0], 2.3, pole[2], 0.05, 4.6, 'cyl6');
      const fl = f(s * (W / 2 + 0.12), 4.3, -D / 2 - 0.1);
      T.flags.push({ x: fl[0] + Math.cos(yaw) * 0.0, y: fl[1], z: fl[2], yaw: yaw + PI / 2, c: s > 0 ? 0 : 1, s: 0.9, ph: hash(sd.x + s) * 6, big: true });
    }
    const anchor = mkAnchor(A, root, `square.${sd.name}`, sd.x, 0, sd.z, yaw);
    const rowAnchors = [];
    for (let r = 0; r < rows; r++) {
      const p = f(0, (r + 1) * rise, D / 2 - (r + 0.5) * run);
      if (r < 3) {
        const o = new THREE.Object3D(); o.name = `square.${sd.name}.row${r}`;
        o.position.set(p[0], p[1], p[2]); o.rotation.set(0, yaw, 0); o.userData.width = 7.2; o.userData.row = r;
        root.add(o); rowAnchors.push(o); A[o.name] = o;
      } else {
        for (let j = 0; j < 7; j++) {
          const lx = (j - 3) * (7.2 / 7) + (hash(j * 7.7 + r + sd.x) - 0.5) * 0.22;
          const q = f(lx, (r + 1) * rise, D / 2 - (r + 0.5) * run + (hash(j + r * 3.3) - 0.5) * 0.12);
          T.fillerSlots.push({ x: q[0], y: q[1], z: q[2], yaw: yaw + (hash(j * 2.1 + r) - 0.5) * 0.4, k: T.fillerSlots.length });
        }
      }
    }
    A[`square.${sd.name}.rows`] = rowAnchors;
    // balloons at the front corners
    for (const s of [-1, 1]) { const p = f(s * (W / 2 + 0.3), 0, D / 2 + 0.3); addBalloonCluster(T, p[0], 0.9, p[2], 6, { spread: 0.35, height: 1.6 }); }
  }
  // speakers on the stage front corners (party)
  for (const s of [-1, 1]) buildSpeakerStack(T, sx0 + 0.6, sh, s * (sz - 0.9), -PI / 2 + s * 0.25, 2);
  // balloons at the truss bases
  for (const s of [-1, 1]) addBalloonCluster(T, tx - 0.7, 0.9, s * (sz + 0.9), 7, { spread: 0.4, height: 1.9, s: 1.1 });
  // bunting along the stage lip + from the truss tops to plaza lamps; string-light canopy
  addBunting(T, [sx0 - 0.08, sh - 0.02, -sz], [sx0 - 0.08, sh - 0.02, sz], { sag: 0.12, spacing: 0.42, size: 0.3, wire: false });
  const lampsSq = [[33, -16], [33, 16], [41.5, -16.6], [41.5, 16.6], [58.5, -15.5], [58.5, 15.5], [31.8, -9.6], [31.8, 9.6]];
  const lampTops = lampsSq.map(([x, z]) => { const t = addLamp(T, x, z, 0); return [t[0], t[1] + 0.22, t[2]]; });
  for (const s of [-1, 1]) {
    const top = [tx, th + 0.3, s * (sz + 0.2)];
    for (const lt of lampTops) if (Math.sign(lt[2]) === s) addStringLights(T, top, lt, { sag: 1.1, offset: Math.round(lt[0]) });
  }
  addStringLights(T, [tx, th + 0.3, -sz - 0.2], [tx, th + 0.3, sz + 0.2], { sag: 0.5, offset: 2 });
  addStringLights(T, [33, 4.9, -16], [33, 4.9, 16], { sag: 1.6, offset: 4 });
  for (const s of [-1, 1]) addBunting(T, [tx, th - 0.3, s * (sz + 0.2)], [31.8, 4.4, s * 9.6], { sag: 1.0, offset: s > 0 ? 2 : 4 });
  // plaza trees + benches
  for (const [x, z] of [[36, -17], [47, -17.2], [54, -16.5], [36, 17], [47, 17.2], [54, 16.5], [60.5, -6], [60.5, 6]]) {
    S.box('#a8a196', x, 0.25, z, 1.6, 0.5, 1.6);
    addTree(T, x, z, 0.75, 'round');
  }
  // confetti on the plaza floor (party)
  T.confettiFloor = [];
  const RC = rng(T.seed + 404);
  for (let i = 0; i < 360; i++) {
    const a = RC() * PI * 2, r = 2 + Math.pow(RC(), 0.7) * 13;
    T.confettiFloor.push({ x: 45 + Math.cos(a) * r * 0.9, z: Math.sin(a) * r, ry: RC() * PI, c: Math.floor(RC() * 6) });
  }
  // anchors
  mkAnchor(A, root, 'square.center', 44, 0, 0, PI / 2);
  mkAnchor(A, root, 'square.cam1', 31.5, 4.4, 5, yawTo(31.5, 5, tb.x, 0));
  mkAnchor(A, root, 'square.cam2', 55.2, 3.3, 3.2, yawTo(55.2, 3.2, 42, -9.5));
}
function buildFoldingChair(Mg, x, y0, z, yaw) {
  const f = frameXZ(x, z, yaw, y0);
  const P = (a, b, c) => f(a, b, c);
  const c = '#f4f4f0', leg = '#9aa3ad';
  { const p = P(0, 0.52, 0); Mg.rbox(c, p[0], p[1], p[2], 0.46, 0.05, 0.44, 0.02, yaw); }
  { const p = P(0, 0.88, -0.24); Mg.rbox(c, p[0], p[1], p[2], 0.44, 0.24, 0.04, 0.02, yaw, -0.1); }
  for (const s of [-1, 1]) {
    { const p = P(s * 0.21, 0.27, 0.02); Mg.add(G.cyl6, leg, M(p[0], p[1], p[2], yaw, 0.035, 0.6, 0.035, 0.4)); }
    { const p = P(s * 0.21, 0.27, 0.0); Mg.add(G.cyl6, leg, M(p[0], p[1], p[2], yaw, 0.035, 0.6, 0.035, -0.4)); }
    { const p = P(s * 0.21, 0.72, -0.235); Mg.add(G.cyl6, leg, M(p[0], p[1], p[2], yaw, 0.035, 0.5, 0.035, -0.1)); }
  }
}
function buildThrone(Mg, x, y0, z, yaw) {
  const f = frameXZ(x, z, yaw, y0);
  const P = (a, b, c) => f(a, b, c);
  const red = '#a3263a', gold = '#e6b325';
  { const p = P(0, 0.44, 0); Mg.rbox(gold, p[0], p[1], p[2], 0.6, 0.14, 0.54, 0.03, yaw); }
  { const p = P(0, 0.535, 0.01); Mg.rbox(red, p[0], p[1], p[2], 0.52, 0.06, 0.48, 0.03, yaw); }
  { const p = P(0, 1.08, -0.27); Mg.rbox(gold, p[0], p[1], p[2], 0.62, 1.12, 0.1, 0.04, yaw); }
  { const p = P(0, 1.06, -0.215); Mg.rbox(red, p[0], p[1], p[2], 0.48, 0.92, 0.04, 0.03, yaw); }
  for (const s of [-1, 0, 1]) { const p = P(s * 0.2, 1.72 - Math.abs(s) * 0.08, -0.27); Mg.add(G.cone6, gold, M(p[0], p[1], p[2], yaw, 0.14, 0.24, 0.14)); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = P(sx * 0.25, 0.19, sz * 0.22); Mg.cyl(gold, p[0], p[1], p[2], 0.04, 0.38, 'cyl8'); }
}
function buildSpeakerStack(T, x, y0, z, yaw, n = 2, mer = null) {
  const Pm = mer || T.m.party;
  const f = frameXZ(x, z, yaw, y0);
  for (let k = 0; k < n; k++) {
    const yc = 0.45 + k * 0.92;
    const p = f(0, yc, 0); Pm.rbox('#1d1d22', p[0], p[1], p[2], 0.8, 0.88, 0.7, 0.06, yaw);
    const pr = f(0, yc, 0.352); Pm.rbox('#ff4fa3', pr[0], pr[1], pr[2], 0.66, 0.74, 0.01, 0.02, yaw);
    for (const [cy, r] of [[0.15, 0.22], [-0.22, 0.12]]) {
      const pc = f(0, yc + cy, 0.36);
      T.speakers.push({ x: pc[0], y: pc[1], z: pc[2], yaw, r, k: T.speakers.length });
    }
  }
}

// ── backyard pool party
function waterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDeep: { value: C('#0b6fa8') }, uShallow: { value: C('#4fd6e8') }, uLight: { value: C('#ffffff') }, uGlow: { value: 0.0 }, uSpark: { value: 0.6 } },
    vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uGlow, uSpark; uniform vec3 uDeep, uShallow, uLight;
      varying vec2 vUv; varying vec3 vW;
      void main(){
        vec2 p = vW.xz * 1.6;
        float t = uTime;
        float c = sin(p.x * 2.3 + t * 1.4 + sin(p.y * 1.9 + t * 0.8) * 1.5) + sin(p.y * 2.9 - t * 1.1 + sin(p.x * 1.4 - t * 0.6) * 1.5);
        c = pow(clamp(0.5 + 0.25 * c, 0.0, 1.0), 4.0);
        vec2 e = min(vUv, 1.0 - vUv);
        float edge = smoothstep(0.0, 0.18, min(e.x * 1.9, e.y));
        vec3 col = mix(uShallow, uDeep, edge * 0.8);
        col += uLight * c * uSpark;
        col += uShallow * uGlow * (0.6 + 0.4 * edge);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
function buildPool(T) {
  const P = T.m.pool, A = T.anchors, root = T.root, pl = L.pool;
  const wx0 = pl.x - pl.w / 2, wx1 = pl.x + pl.w / 2, wz0 = pl.z - pl.d / 2, wz1 = pl.z + pl.d / 2;
  const dx0 = -10.2, dx1 = 4.2, dz0 = -31.2, dz1 = -19.6, dy = 0.12;
  const deck = '#c9a273';
  // deck around the hole
  P.box(deck, (dx0 + wx0) / 2, dy / 2, (dz0 + dz1) / 2, wx0 - dx0, dy, dz1 - dz0);
  P.box(deck, (wx1 + dx1) / 2, dy / 2, (dz0 + dz1) / 2, dx1 - wx1, dy, dz1 - dz0);
  P.box(deck, pl.x, dy / 2, (dz0 + wz0) / 2, pl.w, dy, wz0 - dz0);
  P.box(deck, pl.x, dy / 2, (wz1 + dz1) / 2, pl.w, dy, dz1 - wz1);
  for (let x = dx0 + 0.3; x < dx1; x += 0.6) P.box('#b48d60', x, dy + 0.002, (dz0 + dz1) / 2, 0.03, 0.004, dz1 - dz0);   // plank lines
  // coping + tiled walls + floor
  const cop = '#f6f3ea';
  P.rbox(cop, pl.x, dy + 0.03, wz0 - 0.15, pl.w + 0.6, 0.08, 0.3, 0.03);
  P.rbox(cop, pl.x, dy + 0.03, wz1 + 0.15, pl.w + 0.6, 0.08, 0.3, 0.03);
  P.rbox(cop, wx0 - 0.15, dy + 0.03, pl.z, 0.3, 0.08, pl.d, 0.03);
  P.rbox(cop, wx1 + 0.15, dy + 0.03, pl.z, 0.3, 0.08, pl.d, 0.03);
  P.box('#7fd0e6', pl.x, -0.5, wz0 + 0.02, pl.w, 1.1, 0.04); P.box('#7fd0e6', pl.x, -0.5, wz1 - 0.02, pl.w, 1.1, 0.04);
  P.box('#7fd0e6', wx0 + 0.02, -0.5, pl.z, 0.04, 1.1, pl.d); P.box('#7fd0e6', wx1 - 0.02, -0.5, pl.z, 0.04, 1.1, pl.d);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(pl.w, pl.d).rotateX(-PI / 2), waterMaterial());
  water.position.set(pl.x, 0.05, pl.z); water.name = 'poolWater'; water.receiveShadow = false;
  root.add(water); T.water = water;
  // ladder
  for (const s of [-1, 1]) {
    P.cyl('#d9dde3', wx1 - 0.6 + s * 0.25, dy + 0.05, wz0 + 0.08, 0.03, 1.0, 'cyl6');
    P.cyl('#d9dde3', wx1 - 0.6 + s * 0.25, dy + 0.55, wz0 - 0.08, 0.03, 0.34, 'cyl6', 0, PI / 2, 0);
  }
  // loungers (north side) + umbrella + drinks table
  for (let i = 0; i < 3; i++) {
    const x = wx0 + 1.2 + i * 2.4, z = dz0 + 1.3;
    P.rbox('#fbf6ec', x, dy + 0.28, z, 0.72, 0.1, 1.9, 0.04);
    P.rbox(PAL.party[(i * 2) % 6], x, dy + 0.36, z + 0.1, 0.66, 0.07, 1.5, 0.03);
    P.rbox(PAL.party[(i * 2) % 6], x, dy + 0.58, z - 0.75, 0.66, 0.5, 0.08, 0.03, 0, 0.9);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box('#d9dde3', x + sx * 0.3, dy + 0.12, z + sz * 0.8, 0.05, 0.24, 0.05);
  }
  const ux = dx0 + 1.3, uz = (dz0 + dz1) / 2 + 1.2;
  P.cyl('#fbf6ec', ux, 1.3, uz, 0.04, 2.6, 'cyl6');
  P.add(G.cone, '#ff4fa3', M(ux, 2.65, uz, 0, 2.4, 0.65, 2.4));
  P.add(G.cone, '#fbf6ec', M(ux, 2.85, uz, 0, 1.2, 0.33, 1.2));
  P.cyl('#fbf6ec', ux, dy + 0.4, uz, 0.45, 0.06);
  for (let i = 0; i < 4; i++) P.cyl(['#d0302a', '#3ee0c8', '#ffd23f', '#d0302a'][i], ux - 0.2 + i * 0.13, dy + 0.5, uz - 0.05 + (i % 2) * 0.1, 0.035, 0.1, 'cyl8');
  // patio at the back of the pool house + fence
  P.box('#cfc6b6', -3, 0.03, -18.6, 7, 0.06, 2.2);
  const fenceRun = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 0.3), yaw = Math.atan2(-(z1 - z0), x1 - x0);
    for (let k = 0; k <= n; k++) T.m.trim.box(PAL.trim, lerp(x0, x1, k / n), 0.5, lerp(z0, z1, k / n), 0.08, 1.0, 0.05, yaw);
    T.m.trim.box(PAL.trim, (x0 + x1) / 2, 0.75, (z0 + z1) / 2, len, 0.07, 0.04, yaw);
    T.m.trim.box(PAL.trim, (x0 + x1) / 2, 0.3, (z0 + z1) / 2, len, 0.07, 0.04, yaw);
  };
  fenceRun(-11, -17.6, -11, -33); fenceRun(5, -17.6, 5, -33); fenceRun(-11, -33, 5, -33);
  // poles + string lights + bunting
  const poles = [[dx0 + 0.2, dz0 + 0.2], [dx1 - 0.2, dz0 + 0.2], [dx0 + 0.2, dz1 - 0.1], [dx1 - 0.2, dz1 - 0.1]];
  for (const [x, z] of poles) P.cyl('#6d4a30', x, 1.7, z, 0.06, 3.4, 'cyl6');
  const pt = poles.map(([x, z]) => [x, 3.35, z]);
  addStringLights(T, pt[0], pt[3], { sag: 0.7, offset: 1 }); addStringLights(T, pt[1], pt[2], { sag: 0.7, offset: 3 });
  addStringLights(T, pt[0], pt[1], { sag: 0.6, offset: 5 }); addStringLights(T, pt[2], pt[3], { sag: 0.6, offset: 2 });
  addStringLights(T, [-7.5, 2.95, -17.6], pt[2], { sag: 0.4 }); addStringLights(T, [1.5, 2.95, -17.6], pt[3], { sag: 0.4, offset: 4 });
  addBunting(T, [pt[2][0], 2.9, pt[2][2]], [pt[1][0], 2.9, pt[1][2]], { sag: 0.6, offset: 1 });
  addBunting(T, [pt[3][0], 2.9, pt[3][2]], [pt[0][0], 2.9, pt[0][2]], { sag: 0.6, offset: 3 });
  buildSpeakerStack(T, dx0 + 0.9, dy, dz1 - 1.2, PI * 0.75, 1);
  addBalloonCluster(T, dx1 - 0.4, dy + 0.9, dz1 - 0.5, 6, { spread: 0.3, height: 1.4 });
  addBalloonCluster(T, dx0 + 0.4, dy + 0.9, dz0 + 0.5, 5, { spread: 0.3, height: 1.4 });
  // floaties (animated)
  T.floaties = { ring: { x: pl.x - 1.6, z: pl.z + 0.4 }, duck: { x: pl.x + 1.7, z: pl.z - 0.6 } };
  // anchors
  mkAnchor(A, root, 'pool.center', pl.x, dy, pl.z, 0);
  mkAnchor(A, root, 'pool.edge1', pl.x, dy, wz1 + 2.4, 0);
  mkAnchor(A, root, 'pool.edge2', pl.x, dy, wz0 - 2.4, PI);
  mkAnchor(A, root, 'pool.edge3', wx0 - 1.8, dy, pl.z, -PI / 2);
  mkAnchor(A, root, 'pool.edge4', wx1 + 1.8, dy, pl.z, PI / 2);
  mkAnchor(A, root, 'pool.cam', 6.2, 5.4, -34.2, yawTo(6.2, -34.2, pl.x, pl.z));
}

// ── foam street
function buildFoam(T) {
  const A = T.anchors, root = T.root, Pm = T.m.party, Fs = L.foamSt;
  const cx = Fs.x, cz = 24;
  // the cannon on its trailer (south end, pointing north)
  const kz = 35.2;
  Pm.rbox('#2f4d8a', cx, 0.62, kz, 2.0, 0.36, 2.8, 0.06);
  for (const s of [-1, 1]) for (const zz of [-0.8, 0.8]) Pm.add(G.cyl, '#1b1b1f', M(cx + s * 1.05, 0.34, kz + zz, 0, 0.66, 0.24, 0.66, 0, PI / 2));
  Pm.rbox('#ffd23f', cx, 1.15, kz + 0.5, 1.2, 0.7, 1.2, 0.08);                 // tank
  Pm.cyl('#d9dde3', cx, 1.45, kz - 0.3, 0.12, 0.8, 'cyl8');                    // mount
  const tilt = 0.42, bl = 2.2;
  const by = 1.95, bz = kz - 0.5;
  Pm.add(G.cyl, '#ff4fa3', M(cx, by, bz, 0, 0.9, bl, 0.9, -PI / 2 + tilt, 0));  // barrel (points −Z, up)
  const mz = bz - Math.cos(tilt) * bl / 2, my = by + Math.sin(tilt) * bl / 2;
  Pm.add(G.cone, '#ffd23f', M(cx, my + Math.sin(tilt) * 0.25, mz - Math.cos(tilt) * 0.25, 0, 1.15, 0.55, 1.15, PI / 2 + tilt, 0));
  for (let i = 0; i < 3; i++) Pm.add(G.cyl, '#fbf6ec', M(cx, by + Math.sin(tilt) * (i - 1) * 0.6, bz - Math.cos(tilt) * (i - 1) * 0.6, 0, 0.96, 0.08, 0.96, -PI / 2 + tilt, 0));
  const muzzle = [cx, my + Math.sin(tilt) * 0.5, mz - Math.cos(tilt) * 0.5];
  T.foamCannon = { muzzle, target: [cx, 1.4, cz + 2.5] };
  mkAnchor(A, root, 'foam.cannon', muzzle[0], muzzle[1], muzzle[2], PI);
  mkAnchor(A, root, 'foam.center', cx, 0, cz, PI);
  mkAnchor(A, root, 'foam.cam', cx + 0.6, 3.4, cz - 9.5, yawTo(cx + 0.6, cz - 9.5, cx, cz));
  // string lights zig-zag + bunting across the side street
  const zs = [13, 19, 25, 31, 37];
  const tops = zs.map((z, i) => [cx + (i % 2 ? 4.4 : -4.4), 4.6, z]);
  for (let i = 0; i < zs.length; i++) T.m.foam.cyl('#6d4a30', tops[i][0], 2.3, tops[i][2], 0.06, 4.6, 'cyl6');
  for (let i = 0; i + 1 < tops.length; i++) addStringLights(T, tops[i], tops[i + 1], { sag: 0.6, offset: i * 2 + 1 });
  for (let i = 0; i < tops.length; i++) addBunting(T, [cx - 4.4, 3.7, zs[i]], [cx + 4.4, 3.7, zs[i] + 0.3], { sag: 0.35, offset: i });
  buildSpeakerStack(T, cx - 4.6, 0.1, cz + 6, PI / 2 + 0.3, 2);
  buildSpeakerStack(T, cx + 4.6, 0.1, cz + 6, -PI / 2 - 0.3, 2);
  // foam heap particles (generated here, instanced in finalize)
  const R = rng(T.seed * 11 + 7);
  T.foamBalls = [];
  for (let i = 0; i < 1500; i++) {
    const x = cx + (R() - 0.5) * 10.4, z = 16.8 + R() * 17.2;
    const hx = (x - cx) / 4.4, hz = (z - (cz + 1.5)) / 6.5;
    const hMax = 0.95 * Math.exp(-hx * hx * 0.9 - hz * hz) + 0.25;
    const y = Math.pow(R(), 0.7) * hMax;
    const r = 0.17 + R() * 0.2 + (y < 0.3 ? 0.06 : 0);
    T.foamBalls.push({ x, y, z, r, ph: R() * 6.28, rank: y / hMax * 0.7 + R() * 0.3 });
  }
  T.foamBase = { x: cx, z: 25.4, w: 10.6, d: 17.4 };
}

// ── park corner
function buildPark(T) {
  const P = T.m.park, A = T.anchors, root = T.root, pt = L.parkTable;
  const path = '#d8cdb0';
  P.box(path, -58.4, 0.01, -12, 2.2, 0.04, 40);
  P.box(path, -51.6, 0.012, -6.2, 12.4, 0.04, 1.8);
  P.box(path, pt.x, 0.014, pt.z, 3.6, 0.04, 3.6);
  // hedge border along the park road side (with a gap for the path)
  for (const [z0, z1] of [[-32, -7.4], [-5.0, 7.5]]) P.rbox('#357a3e', -46.2, 0.5, (z0 + z1) / 2, 0.9, 1.0, z1 - z0, 0.3);
  // stone chess table + stools  (table top at 0.78)
  const stone = '#a9a59c', stoneD = '#8e8a82';
  P.cyl(stoneD, pt.x, 0.04, pt.z, 0.34, 0.08);
  P.cyl(stone, pt.x, 0.4, pt.z, 0.13, 0.72);
  P.cyl(stone, pt.x, TABLE_TOP - 0.035, pt.z, 0.55, 0.07, 'cyl24');
  P.cyl(stoneD, pt.x, TABLE_TOP - 0.075, pt.z, 0.5, 0.03, 'cyl24');
  P.cyl(stoneD, pt.x, TABLE_TOP - 0.09, pt.z, 0.18, 0.04, 'cyl24');
  for (const s of [-1, 1]) {
    const sx = pt.x + s * (0.62 + 0.02);
    P.cyl(stone, sx, SEAT_H / 2 - 0.02, pt.z, 0.16, SEAT_H - 0.04, 'cyl24');
    P.cyl(stoneD, sx, SEAT_H - 0.02, pt.z, 0.2, 0.04, 'cyl24');
    P.cyl(stoneD, sx, 0.03, pt.z, 0.21, 0.06, 'cyl24');
  }
  mkAnchor(A, root, 'park.table', pt.x, TABLE_TOP, pt.z, 0);
  mkAnchor(A, root, 'park.stool1', pt.x + 0.62, 0, pt.z, -PI / 2);
  mkAnchor(A, root, 'park.stool2', pt.x - 0.62, 0, pt.z, PI / 2);
  // the big tree over the table + more trees
  const treeX = pt.x - 1.6, treeZ = pt.z - 2.4;
  addTree(T, treeX, treeZ, 1.75, 'round', '#4caf50');
  mkAnchor(A, root, 'park.tree', treeX, 0, treeZ, 0);
  for (const [x, z, s, k] of [[-60.5, -27, 1.3, 'pine'], [-61, -18, 1.2, 'round'], [-60.6, -3, 1.4, 'pine'], [-55.5, -29.5, 1.1, 'round'],
    [-48.5, -28.5, 1.2, 'pine'], [-49, -18.5, 1.0, 'round'], [-61, 5, 1.1, 'round'], [-55, 5.5, 0.9, 'round'], [-48, 4.5, 1.0, 'pine']]) addTree(T, x, z, s, k);
  // benches along the path
  for (const [z, yaw] of [[-20, PI / 2], [-2, PI / 2], [-14, -PI / 2]]) {
    const x = yaw > 0 ? -59.9 : -56.9;
    const f = frameXZ(x, z, yaw);
    const b = (col, lx, ly, lz, w, h, d, rx = 0) => { const p = f(lx, ly, lz); P.box(col, p[0], p[1], p[2], w, h, d, yaw, rx); };
    b(PAL.wood, 0, 0.45, 0, 1.6, 0.07, 0.45); b(PAL.wood, 0, 0.75, -0.22, 1.6, 0.3, 0.06, -0.15);
    for (const s of [-1, 1]) b('#2f3a3a', s * 0.7, 0.22, 0, 0.07, 0.45, 0.4);
  }
  // pond + flower beds
  P.cyl('#a8a196', -55.5, 0.06, -21.5, 2.3, 0.14, 'cyl');
  P.cyl('#2f8fbf', -55.5, 0.1, -21.5, 2.05, 0.1, 'cyl');
  for (let i = 0; i < 5; i++) P.cyl('#4caf50', -55.5 + Math.cos(i * 1.7) * 1.2, 0.16, -21.5 + Math.sin(i * 1.7) * 1.1, 0.22, 0.02, 'cyl8');
  const RF = rng(31);
  for (let i = 0; i < 40; i++) {
    const z = -30 + i * 0.95, x = -57 + (i % 2) * 0.3;
    if (Math.abs(z + 6.2) < 1.4) continue;
    P.add(G.ico0, PAL.party[i % 6], M(x + RF() * 0.2, 0.16, z, RF() * 3, 0.24, 0.22, 0.24));
    P.add(G.ico0, '#3c8f45', M(x + 0.15, 0.1, z + 0.4, RF() * 3, 0.32, 0.2, 0.32));
  }
  addLamp(T, pt.x + 2.4, pt.z - 2.2, 0);
  addLamp(T, -57, -26, 0); addLamp(T, -57, 2, 0); addLamp(T, -47.3, -6.2, 0);
  // birthday decorations (party props): bunting from the tree to the lamp, balloons on the stools, lights in the crown
  addBunting(T, [treeX + 0.3, 3.3, treeZ + 0.2], [pt.x + 2.4, 4.4, pt.z - 2.2], { sag: 0.5, offset: 2 });
  addBalloonCluster(T, pt.x + 1.05, 0.5, pt.z + 0.35, 3, { spread: 0.15, height: 1.0, s: 0.85 });
  addBalloonCluster(T, pt.x - 1.05, 0.5, pt.z + 0.35, 3, { spread: 0.15, height: 1.0, s: 0.85 });
  for (let i = 0; i < 3; i++) {
    const a0 = i * 2.1, r = 2.3, y = 4.2 + i * 0.5;
    addStringLights(T, [treeX + Math.cos(a0) * r, y, treeZ + Math.sin(a0) * r], [treeX + Math.cos(a0 + 2.0) * r, y + 0.3, treeZ + Math.sin(a0 + 2.0) * r], { sag: 0.6, offset: i, wire: false });
  }
  mkAnchor(A, root, 'park.cam', -47.6, 2.5, -4.4, yawTo(-47.6, -4.4, pt.x, pt.z));
}

// ── DJ booth on the north pavement (party prop)
function buildDJ(T) {
  const Pm = T.m.party, x = -3, z = -6.3, y0 = L.curb - 0.02, yaw = 0;
  const f = frameXZ(x, z, yaw, y0);
  const b = (col, lx, ly, lz, w, h, d, r = 0.04) => { const p = f(lx, ly, lz); Pm.rbox(col, p[0], p[1], p[2], w, h, d, r, yaw); };
  b('#1d1d22', 0, 0.5, 0, 2.6, 1.0, 0.8, 0.06);
  b('#2b2f6b', 0, 1.02, 0, 2.7, 0.06, 0.9);
  for (const s of [-1, 1]) {
    const p = f(s * 0.62, 1.08, 0.02); Pm.cyl('#3a3d46', p[0], p[1], p[2], 0.24, 0.05, 'cyl');
    const p2 = f(s * 0.62, 1.11, 0.02); Pm.cyl('#ff4fa3', p2[0], p2[1], p2[2], 0.09, 0.02, 'cyl8');
  }
  b('#c7ccd4', 0, 1.1, -0.15, 0.5, 0.1, 0.35, 0.02);
  // canopy
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = f(sx * 1.45, 1.35, sz * 0.75); Pm.cyl('#c7ccd4', p[0], p[1], p[2], 0.04, 2.7, 'cyl6'); }
  for (let i = 0; i < 8; i++) b(i % 2 ? '#fbf6ec' : '#ff4fa3', -1.55 + (i + 0.5) * 3.1 / 8, 2.72, 0, 3.1 / 8 + 0.01, 0.1, 1.8, 0.02);
  for (let i = 0; i < 8; i++) { const p = f(-1.55 + (i + 0.5) * 3.1 / 8, 2.52, 0.92); T.flags.push({ x: p[0], y: p[1] + 0.12, z: p[2], yaw, c: i % 2 ? 1 : 0, s: 0.39, ph: i, scallop: true }); }
  // equaliser bars on the front panel
  for (let i = 0; i < 14; i++) { const p = f(-1.04 + i * 0.16, 0.22, 0.42); T.eq.push({ x: p[0], y: p[1], z: p[2], yaw, k: i }); }
  for (const s of [-1, 1]) buildSpeakerStack(T, x + s * 2.1, y0, z + 0.1, yaw - s * 0.2, 2);
  addBalloonCluster(T, x - 1.45, y0 + 2.6, z + 0.75, 4, { spread: 0.25, height: 0.7 });
  addBalloonCluster(T, x + 1.45, y0 + 2.6, z + 0.75, 4, { spread: 0.25, height: 0.7 });
}

// ── 3D chess knight (weather vane / statue)
function knightShape() {
  const s = new THREE.Shape();
  const k = (x, y) => [x / 100, -y / 100];
  s.moveTo(...k(-30, 50)); s.lineTo(...k(34, 50)); s.lineTo(...k(34, 40)); s.lineTo(...k(26, 36));
  s.bezierCurveTo(...k(30, 10), ...k(34, -10), ...k(26, -28));
  s.bezierCurveTo(...k(18, -44), ...k(4, -52), ...k(-6, -50));
  s.lineTo(...k(-8, -58)); s.lineTo(...k(-16, -46));
  s.bezierCurveTo(...k(-28, -38), ...k(-38, -22), ...k(-42, -8));
  s.lineTo(...k(-44, 2)); s.bezierCurveTo(...k(-42, 8), ...k(-34, 10), ...k(-28, 6));
  s.lineTo(...k(-18, 0)); s.bezierCurveTo(...k(-12, -2), ...k(-6, 0), ...k(-4, 4));
  s.bezierCurveTo(...k(-14, 14), ...k(-24, 26), ...k(-22, 36));
  s.lineTo(...k(-30, 40)); s.closePath();
  return s;
}
let _knightGeo = null;
function knightGeometry() {
  if (!_knightGeo) {
    _knightGeo = new THREE.ExtrudeGeometry(knightShape(), { depth: 0.14, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 1, curveSegments: 6 });
    _knightGeo.translate(0, 0.5, -0.07);   // base at y = 0, centred in depth
  }
  return _knightGeo;
}
function faceTex() {
  return cachedTex('fillerFace', 128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b1b1b';
    g.beginPath(); g.ellipse(44, 56, 8, 11, 0, 0, PI * 2); g.fill();
    g.beginPath(); g.ellipse(84, 56, 8, 11, 0, 0, PI * 2); g.fill();
    g.lineWidth = 8; g.lineCap = 'round'; g.strokeStyle = '#1b1b1b';
    g.beginPath(); g.arc(64, 76, 20, 0.15 * PI, 0.85 * PI); g.stroke();
    g.fillStyle = 'rgba(255,120,140,0.45)';
    g.beginPath(); g.arc(32, 80, 9, 0, PI * 2); g.fill(); g.beginPath(); g.arc(96, 80, 9, 0, PI * 2); g.fill();
  });
}
function fillerHeadGeometry() {
  const g = rbox(0.5, 0.46, 0.44, 0.07, 1).clone();
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    if (nor.getZ(i) > 0.6) uv.setXY(i, pos.getX(i) / 0.5 + 0.5, pos.getY(i) / 0.46 + 0.5);
    else uv.setXY(i, 0.02, 0.02);
  }
  return g;
}

// ── lighting presets (town)
const MOON_DIR = V3(0.93, 0.27, -0.25).normalize();
const DUSK_SUN = V3(-0.62, 0.11, 0.78).normalize();
const DAY_SUN = V3(0.42, 0.8, 0.43).normalize();
export const TOWN_PRESETS = {
  party_night: {
    sky: { zenith: '#050822', mid: '#141a46', horizon: '#3b2e7c', ground: '#0d0f22', sunDir: MOON_DIR, sunColor: '#2c3a80', sunGlow: 5, glowDir: V3(1, 0, 0.15), glowColor: '#ff4fa3', glowAmt: 0.5 },
    fog: ['#211e52', 50, 270], bg: '#211e52', stars: 1, moon: 1, clouds: 0,
    hemi: ['#5a6ad0', '#3a2552', 1.15], key: ['#aabaff', 0.9, MOON_DIR],
    front: ['#ffd8b0', 0.95], rimL: ['#ff4fa3', 1.4], rimR: ['#3ee0c8', 1.15], flicker: 0.25,
    win: { dark: '#151b36', lit: ['#ffd27a', '#ffc265', '#ffe2a2', '#ffb46a'], mul: 1.75, halo: 0.6, tv: true },
    lamp: { core: '#ffe4ad', mul: 2.4, pool: '#ffc880', poolA: 0.62, halo: '#ffcf8a', haloI: 1.0, haloS: 1.5 },
    bulbs: { mul: 2.3, halo: 1.0, size: 0.4, twinkle: 0.35 }, porch: 2.0, stage: 2.0, clock: 1.6, beams: 0.12, eq: 1.0,
    water: { deep: '#0a4c8a', shallow: '#33cbef', glow: 0.55, spark: 0.45 }, banner: 0.45, sign: 1.3,
  },
  quiet_night: {
    sky: { zenith: '#02040d', mid: '#0a1124', horizon: '#1a2c3f', ground: '#05080e', sunDir: MOON_DIR, sunColor: '#1a2540', sunGlow: 5, glowAmt: 0 },
    fog: ['#13222f', 22, 170], bg: '#13222f', stars: 0.75, moon: 1, clouds: 0,
    hemi: ['#34507a', '#161c26', 0.95], key: ['#a3bbe6', 0.75, MOON_DIR],
    front: ['#bccbe8', 0.62], rimL: ['#000000', 0], rimR: ['#4fb3c0', 0.22], flicker: 0,
    win: { dark: '#0d121d', lit: ['#e4ecff', '#d8e4ff', '#eef3ff', '#dce6ff'], mul: 1.55, halo: 0.6, tv: false },
    lamp: { core: '#cfd8ea', mul: 1.15, pool: '#9fb3d8', poolA: 0.2, halo: '#a8bcdc', haloI: 0.35, haloS: 1.5 },
    bulbs: { mul: 0.13, halo: 0, size: 0.4, twinkle: 0, off: true }, porch: 0.25, stage: 0.12, clock: 0.55, beams: 0, eq: 0,
    water: { deep: '#06263f', shallow: '#0f4f6c', glow: 0.08, spark: 0.12 }, banner: 0.03, sign: 0.25,
  },
  dusk: {
    sky: { zenith: '#2b3a92', mid: '#c4589c', horizon: '#ffa266', ground: '#3a2a40', sunDir: DUSK_SUN, sunColor: '#ffb066', sunSize: 0.012, sunGlow: 5, sunDisc: 1.6, glowAmt: 0 },
    fog: ['#d98a92', 70, 320], bg: '#d98a92', stars: 0.12, moon: 0.35, clouds: 1,
    hemi: ['#ffb6cc', '#5d3c5c', 1.3], key: ['#ffb27a', 2.5, V3(-0.6, 0.36, 0.72).normalize()],
    front: ['#ffe2c6', 0.55], rimL: ['#ff7aa8', 0.5], rimR: ['#9a6cff', 0.4], flicker: 0.08,
    win: { dark: '#2a2440', lit: ['#ffd27a', '#ffc46b', '#ffe0a0', '#ffb870'], mul: 1.25, halo: 0.25, tv: false },
    lamp: { core: '#ffe4ad', mul: 1.8, pool: '#ffc880', poolA: 0.22, halo: '#ffcf8a', haloI: 0.5, haloS: 1.6 },
    bulbs: { mul: 1.9, halo: 0.65, size: 0.36, twinkle: 0.25 }, porch: 1.4, stage: 1.9, clock: 1.0, beams: 0.06, eq: 0.9,
    water: { deep: '#1a68a0', shallow: '#6fd8e8', glow: 0.12, spark: 0.6 }, banner: 0.2, sign: 1.1,
  },
  day: {
    sky: { zenith: '#2a7fe0', mid: '#74b6f2', horizon: '#d4edfb', ground: '#6a8f5a', sunDir: DAY_SUN, sunColor: '#fff2d2', sunSize: 0.006, sunGlow: 9, sunDisc: 1.0, glowAmt: 0 },
    fog: ['#cfe6f7', 80, 360], bg: '#cfe6f7', stars: 0, moon: 0, clouds: 1,
    hemi: ['#c4e2ff', '#86996a', 1.55], key: ['#fff1d6', 3.0, DAY_SUN],
    front: ['#ffffff', 0.35], rimL: ['#000000', 0], rimR: ['#000000', 0], flicker: 0,
    win: { dark: '#6f8aa8', lit: ['#a7bdd6', '#a7bdd6', '#a7bdd6', '#a7bdd6'], mul: 1.0, halo: 0, tv: false },
    lamp: { core: '#e8e4d8', mul: 0.75, pool: '#000000', poolA: 0, halo: '#000000', haloI: 0, haloS: 1 },
    bulbs: { mul: 0.6, halo: 0, size: 0.4, twinkle: 0, off: true }, porch: 0.6, stage: 0.7, clock: 1.0, beams: 0, eq: 0.5,
    water: { deep: '#1677c0', shallow: '#7fe0f0', glow: 0, spark: 0.85 }, banner: 0.04, sign: 1.0,
  },
};

function finalizeTown(T) {
  const root = T.root, party = T.party;
  const D = {};   // dynamic handles
  // static merged meshes
  const add = (mesh, parent = root) => { if (mesh) parent.add(mesh); return mesh; };
  // shadow policy (SwiftShader budget): only things that matter cast; only walkable surfaces receive
  add(T.m.street.build(MAT.lam, 'streets', { cast: false, receive: true }));
  add(T.m.houses.build(MAT.lam, 'houses', { cast: true, receive: false }));
  add(T.m.roofs.build(MAT.lamFlat, 'roofs', { cast: true, receive: false }));
  add(T.m.trim.build(MAT.lam, 'trim', { cast: false, receive: false }));
  add(T.m.square.build(MAT.vc, 'square', { cast: true, receive: true }));
  add(T.m.stands.build(MAT.vc, 'stands', { cast: true, receive: true }));
  add(T.m.park.build(MAT.vc, 'park', { cast: true, receive: true }));
  add(T.m.pool.build(MAT.vc, 'pool', { cast: false, receive: true }));
  add(T.m.foam.build(MAT.lam, 'foamStreet', { cast: false, receive: false }));
  add(T.m.gloss.build(MAT.vcGloss, 'gloss', { cast: true, receive: false }));
  const hills = add(T.m.hills.build(MAT.lamFlat, 'hills', { cast: false, receive: false })); if (hills) hills.renderOrder = 1;
  add(T.m.party.build(MAT.lam, 'partyStatic', { cast: false, receive: false }), party);
  add(T.m.partyGloss.build(MAT.vcGloss, 'partyGloss', { cast: false, receive: false }), party);

  // ── lamp posts (static parts merged; core / pool / halo dynamic)
  const lm = new Merger();
  for (const l of T.lamps) {
    lm.cyl(PAL.metal, l.x, l.y + 0.25, l.z, 0.16, 0.5, 'cyl8');
    lm.cyl(PAL.metal, l.x, l.y + l.h / 2, l.z, 0.065, l.h, 'cyl8');
    lm.box(PAL.metal, l.x, l.y + l.h + 0.02, l.z, 0.46, 0.06, 0.46);
    lm.add(G.cone, PAL.metal, M(l.x, l.y + l.h + 0.62, l.z, PI / 4, 0.62, 0.3, 0.62));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lm.box(PAL.metal, l.x + sx * 0.18, l.y + l.h + 0.25, l.z + sz * 0.18, 0.04, 0.44, 0.04);
  }
  add(lm.build(MAT.lam, 'lampPosts', { cast: false, receive: false }));
  D.lampCore = instanced(G.box, new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    T.lamps.map((l) => ({ m: M(l.x, l.y + l.h + 0.25, l.z, 0, 0.3, 0.4, 0.3), c: '#ffffff' })), { cast: false, name: 'lampCores' });
  root.add(D.lampCore);
  D.lampPool = instanced(PLANE_FLAT, new THREE.MeshBasicMaterial({ map: radialTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    T.lamps.map((l) => ({ m: M(l.x, l.y + 0.03, l.z, 0, 7.5, 1, 7.5), c: '#ffffff' })), { cast: false, receive: false, name: 'lampPools' });
  D.lampPool.renderOrder = 4; root.add(D.lampPool);
  D.lampHalo = makeGlowPoints(T.lamps.length, { name: 'lampHalos', core: 0.4 });
  T.lamps.forEach((l, i) => setGlow(D.lampHalo, i, l.x, l.y + l.h + 0.25, l.z, 1, 1, 1, 2));
  root.add(D.lampHalo);

  // ── windows + halos
  const W = T.windows;
  D.win = instanced(G.plane, new THREE.MeshBasicMaterial({ map: windowTex() }),
    W.map((w) => ({ m: M(w.x, w.y, w.z, w.yaw, w.w, w.h, 1), c: '#ffffff' })), { cast: false, receive: false, name: 'windows' });
  root.add(D.win);
  D.winHalo = instanced(G.plane, new THREE.MeshBasicMaterial({ map: softRectTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    W.map((w) => ({ m: M(w.x + Math.sin(w.yaw) * 0.04, w.y, w.z + Math.cos(w.yaw) * 0.04, w.yaw, w.w * 1.9, w.h * 1.75, 1), c: '#000000' })), { cast: false, receive: false, name: 'windowHalos' });
  D.winHalo.renderOrder = 4; root.add(D.winHalo);

  // ── string lights: wires, bulbs, halos (all party props)
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(T.wires, 3));
  const wires = new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#1a1a20' })); wires.name = 'wires';
  party.add(wires);
  D.bulbs = instanced(G.octa, new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    T.bulbs.map((b) => ({ m: M(b.x, b.y, b.z, 0, 0.1, 0.13, 0.1), c: '#ffffff' })), { cast: false, receive: false, name: 'bulbs' });
  party.add(D.bulbs);
  D.bulbHalo = makeGlowPoints(T.bulbs.length, { name: 'bulbHalos', core: 0.5 });
  T.bulbs.forEach((b, i) => setGlow(D.bulbHalo, i, b.x, b.y, b.z, 0, 0, 0, 0.5));
  glowDirty(D.bulbHalo);
  party.add(D.bulbHalo);
  D.bulbCols = PAL.party.map((h) => C(h));

  // ── bunting flags (party, gentle sway in update)
  D.flags = instanced(G.flag, new THREE.MeshStandardMaterial({ roughness: 0.75, side: THREE.DoubleSide }),
    T.flags.map((f) => ({ m: M(f.x, f.y, f.z, f.yaw, f.s * 0.8, f.s, 1), c: PAL.party[f.c] })), { cast: false, receive: false, name: 'bunting' });
  party.add(D.flags);

  // ── balloons + strings (party, bobbing)
  D.balloons = instanced(G.balloon, new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0 }),
    T.balloons.map((b) => ({ m: M(b.x, b.y, b.z, 0, 0.36 * b.s, 0.44 * b.s, 0.36 * b.s), c: PAL.party[b.c] })), { cast: false, receive: false, name: 'balloons' });
  party.add(D.balloons);
  const bsg = new THREE.BufferGeometry(); bsg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(T.balloons.length * 6), 3));
  D.balloonStrings = new THREE.LineSegments(bsg, new THREE.LineBasicMaterial({ color: '#e8e8e8' })); D.balloonStrings.frustumCulled = false;
  party.add(D.balloonStrings);

  // ── trees
  const trunks = [], crowns = [], pines = [];
  const crownCols = ['#4caf50', '#3c8f45', '#5cbf5a', '#43a047', '#6cc35a'];
  T.trees.forEach((t, i) => {
    const s = t.s, c0 = C(t.c || crownCols[i % crownCols.length]);
    if (t.kind === 'pine') {
      trunks.push({ m: M(t.x, 0.6 * s, t.z, 0, 0.28 * s, 1.2 * s, 0.28 * s) });
      for (let k = 0; k < 3; k++) pines.push({ m: M(t.x, (1.3 + k * 1.05) * s, t.z, i + k, (2.6 - k * 0.65) * s, (1.9 - k * 0.2) * s, (2.6 - k * 0.65) * s), c: c0.clone().multiplyScalar(0.85 + k * 0.07) });
    } else {
      trunks.push({ m: M(t.x, 1.0 * s, t.z, 0, 0.34 * s, 2.0 * s, 0.34 * s) });
      crowns.push({ m: M(t.x, 3.0 * s, t.z, i, 3.0 * s, 2.7 * s, 3.0 * s), c: c0 });
      crowns.push({ m: M(t.x + 0.75 * s, 2.55 * s, t.z + 0.35 * s, i * 2, 1.9 * s, 1.7 * s, 1.9 * s), c: c0.clone().multiplyScalar(0.9) });
      crowns.push({ m: M(t.x - 0.6 * s, 3.6 * s, t.z - 0.45 * s, i * 3, 1.7 * s, 1.5 * s, 1.7 * s), c: c0.clone().multiplyScalar(1.08) });
    }
  });
  root.add(instanced(G.cyl6, new THREE.MeshLambertMaterial({ color: '#7d5232' }), trunks, { name: 'trunks', cast: true, receive: false }));
  root.add(instanced(G.ico, new THREE.MeshLambertMaterial({ flatShading: true }), crowns, { name: 'crowns', cast: true, receive: false }));
  root.add(instanced(G.cone6, new THREE.MeshLambertMaterial({ flatShading: true }), pines, { name: 'pines', cast: true, receive: false }));

  // ── emissive bits (porch lights, stage lenses) — one InstancedMesh per geometry
  D.glows = [];
  for (const geo of [G.box, G.cyl]) {
    const items = T.glowItems.filter((g) => g.geo === geo);
    if (!items.length) continue;
    const im = instanced(geo, new THREE.MeshBasicMaterial({ color: '#ffffff' }), items.map((g) => ({ m: g.m, c: g.base })), { cast: false, receive: false, name: 'glows' });
    im.userData.items = items; root.add(im); D.glows.push(im);
  }

  // ── DJ equaliser + speaker cones (party, animated)
  D.eq = instanced(G.box, new THREE.MeshBasicMaterial({ color: '#ffffff' }), T.eq.map((e) => ({ m: M(e.x, e.y, e.z, e.yaw, 0.11, 0.3, 0.03), c: PAL.party[e.k % 6] })), { cast: false, receive: false, name: 'eq' });
  party.add(D.eq);
  D.cones = instanced(G.cyl, new THREE.MeshLambertMaterial({ color: '#2a2a30' }), T.speakers.map((s) => ({ m: M(s.x, s.y, s.z, s.yaw, s.r * 2, 0.06, s.r * 2, PI / 2) })), { cast: false, receive: false, name: 'speakerCones' });
  party.add(D.cones);

  // ── stage light beams (party)
  D.beams = [];
  const beamMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexColors: true });
  const beamGeo = new THREE.CylinderGeometry(0.12, 0.9, 1, 16, 4, true).translate(0, -0.5, 0);
  { const pa = beamGeo.attributes.position, ca = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { const k = Math.pow(clamp(1 + pa.getY(i), 0, 1), 1.6); ca[i * 3] = ca[i * 3 + 1] = ca[i * 3 + 2] = k; }
    beamGeo.setAttribute('color', new THREE.BufferAttribute(ca, 3)); }
  for (const b of T.beams || []) {
    const from = V3(...b.from), to = V3(...b.to), len = from.distanceTo(to);
    const m = new THREE.Mesh(beamGeo, beamMat.clone()); m.material.color.set(b.c);
    m.position.copy(from); m.scale.set(1, len, 1);
    m.quaternion.setFromUnitVectors(V3(0, -1, 0), to.clone().sub(from).normalize());
    m.renderOrder = 6; m.userData.base = C(b.c); party.add(m); D.beams.push(m);
  }

  // ── confetti on the plaza (party)
  party.add(instanced(PLANE_FLAT, new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide }),
    T.confettiFloor.map((c) => ({ m: M(c.x, 0.012, c.z, c.ry, 0.13, 1, 0.08), c: PAL.party[c.c] })), { cast: false, receive: false, name: 'confettiFloor' }));

  // ── foam heap + stream
  const fb = T.foamBalls || [];
  D.foamN = fb.length; D.streamN = 46;
  const foamMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45, emissive: '#e6ecff', emissiveIntensity: 0.22 });
  if (T.foamBase) {
    const fbm = T.foamBase;
    D.foamBase = new THREE.Mesh(rbox(fbm.w, 0.6, fbm.d, 0.28, 3), foamMat);
    D.foamBase.position.set(fbm.x, -0.3, fbm.z); D.foamBase.receiveShadow = true; D.foamBase.name = 'foamBase';
    root.add(D.foamBase);
  }
  D.foam = instanced(G.blob, foamMat,
    new Array(D.foamN + D.streamN).fill(0).map(() => ({ m: M(0, -10, 0, 0, 0.01, 0.01, 0.01) })), { cast: false, receive: false, name: 'foam' });
  D.foam.frustumCulled = false; root.add(D.foam);

  // ── pool floaties
  if (T.floaties) {
    const ringMat = new THREE.MeshStandardMaterial({ map: stripeTex('#ff4fa3', '#ffffff', 8, true, 'ringStripes'), roughness: 0.4 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.2, 10, 24).rotateX(PI / 2), ringMat); ring.castShadow = true; ring.name = 'floatRing';
    root.add(ring); D.ring = ring;
    const dm = new Merger();
    dm.add(G.sphere, '#ffd23f', M(0, 0.22, 0, 0, 0.9, 0.62, 1.1));
    dm.add(G.sphere, '#ffd23f', M(0, 0.62, 0.32, 0, 0.5, 0.5, 0.5));
    dm.add(G.cone, '#ff7a2f', M(0, 0.6, 0.62, 0, 0.16, 0.26, 0.16, PI / 2));
    for (const s of [-1, 1]) dm.add(G.sphereLo, '#1b1b1b', M(s * 0.13, 0.7, 0.53, 0, 0.08, 0.1, 0.06));
    dm.add(G.cone, '#ffd23f', M(0, 0.42, -0.52, 0, 0.3, 0.3, 0.3, -PI / 2.6));
    const duck = dm.build(MAT.vcGloss, 'duck'); root.add(duck); D.duck = duck;
  }

  // ── trophies (gold) + knight weather vane
  const gold = new THREE.MeshStandardMaterial({ color: '#ffc93a', roughness: 0.3, metalness: 0.55, emissive: '#5a3a00', emissiveIntensity: 0.25 });
  const gm = new Merger();
  for (const t of T.trophies || []) {
    const s = t.s;
    gm.box('#ffc93a', t.x, t.y + 0.04 * s, t.z, 0.24 * s, 0.08 * s, 0.24 * s);
    gm.cyl('#ffc93a', t.x, t.y + 0.16 * s, t.z, 0.035 * s, 0.18 * s, 'cyl8');
    gm.add(new THREE.CylinderGeometry(0.5, 0.28, 1, 14), '#ffc93a', M(t.x, t.y + 0.36 * s, t.z, 0, 0.3 * s, 0.24 * s, 0.3 * s));
    for (const sd of [-1, 1]) gm.add(G.torus, '#ffc93a', M(t.x + sd * 0.17 * s, t.y + 0.38 * s, t.z, -PI / 2, 0.13 * s, 0.13 * s, 0.13 * s));
  }
  for (const v of T.knightVanes || []) {
    gm.cyl('#3a3d46', v.x, v.y + 0.7, v.z, 0.03, 1.4, 'cyl6');
    gm.add(knightGeometry(), '#ffc93a', M(v.x, v.y + 1.35, v.z, v.yaw + PI / 2, 0.75, 0.75, 0.75));
    gm.box('#3a3d46', v.x, v.y + 1.2, v.z, 0.9, 0.04, 0.04, v.yaw);
  }
  const goldMesh = gm.build(gold, 'gold'); if (goldMesh) { goldMesh.material = gold; root.add(goldMesh); }

  // ── clock faces
  D.clock = [];
  for (const c of T.clockFaces || []) {
    const m = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: clockTex() }));
    const f = frameXZ(c.x, c.z, c.yaw); const p = f(0, c.y, 1.32);
    m.position.set(p[0], p[1], p[2]); m.rotation.y = c.yaw; m.scale.setScalar(c.r * 2);
    root.add(m); D.clock.push(m);
  }

  // ── filler fans on the back bleacher rows
  const slots = T.fillerSlots || [];
  if (slots.length) {
    const shirts = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff', '#ffffff', '#e8455a', '#53c26b'];
    const skins = ['#f1c7a1', '#8d5a3b', '#f4d0b5', '#c68e62', '#e9b48f', '#5a3a28', '#f0c09a'];
    const fm = new THREE.MeshLambertMaterial();
    D.filler = {
      slots,
      legs: instanced(G.box, fm, slots.map(() => ({ m: M(), c: '#2f3550' })), { name: 'fanLegs' }),
      torso: instanced(rbox(0.54, 0.62, 0.34, 0.06, 1), fm, slots.map((s) => ({ m: M(), c: shirts[s.k % shirts.length] })), { name: 'fanTorso' }),
      head: instanced(fillerHeadGeometry(), new THREE.MeshLambertMaterial({ map: faceTex() }), slots.map((s) => ({ m: M(), c: skins[(s.k * 3) % skins.length] })), { name: 'fanHeads' }),
      hat: instanced(G.cone, fm, slots.map((s) => ({ m: M(), c: PAL.party[(s.k + 2) % 6] })), { name: 'fanHats' }),
      arms: instanced(G.box, fm, slots.flatMap((s) => [{ m: M(), c: shirts[s.k % shirts.length] }, { m: M(), c: shirts[s.k % shirts.length] }]), { name: 'fanArms' }),
    };
    D.fillerGroup = new THREE.Group(); D.fillerGroup.name = 'fillerFans';
    for (const k of ['legs', 'torso', 'head', 'hat', 'arms']) { D.filler[k].frustumCulled = false; D.filler[k].receiveShadow = false; D.fillerGroup.add(D.filler[k]); }
    root.add(D.fillerGroup);
  }

  // ── sky, stars, moon, clouds, fireworks
  D.sky = makeSky(); root.add(D.sky);
  D.stars = makeStars(1100, T.seed); root.add(D.stars);
  const moon = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: moonTex(), transparent: true, fog: false, depthWrite: false }));
  moon.position.copy(MOON_DIR).multiplyScalar(330); moon.scale.setScalar(26); moon.lookAt(0, 0, 0); moon.renderOrder = 3;
  moon.material.color.setScalar(1.5);
  const moonHalo = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: radialTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  moonHalo.position.copy(MOON_DIR).multiplyScalar(332); moonHalo.scale.setScalar(110); moonHalo.lookAt(0, 0, 0); moonHalo.renderOrder = 3;
  root.add(moon, moonHalo); D.moon = moon; D.moonHalo = moonHalo;
  const cm = new Merger(); const RC = rng(T.seed + 71);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * PI * 2 + RC() * 0.4, r = 280 + RC() * 50, y = 62 + RC() * 40;
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r, ry = a + PI / 2;
    const n = 4 + Math.floor(RC() * 3);
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * 13;
      cm.add(G.ico, '#ffffff', M(cx + Math.cos(ry) * off, y + RC() * 3 - Math.abs(k - (n - 1) / 2) * 1.5, cz - Math.sin(ry) * off, ry, 24 - Math.abs(k - (n - 1) / 2) * 3, 7 + RC() * 3, 13));
    }
  }
  D.clouds = cm.build(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, fog: false, emissive: '#ffffff', emissiveIntensity: 0.15 }), 'clouds', { cast: false, receive: false });
  root.add(D.clouds);
  D.fw = makeGlowPoints(4 * 90, { name: 'fireworks', core: 0.9, renderOrder: 4 });
  D.fw.visible = false; root.add(D.fw);
  return D;
}

// ── fireworks: 4 lanes of rockets, each a pure function of t
const FW_LANES = 4, FW_PER = 90, FW_PERIOD = 2.7;
function updateFireworks(pts, t, seed) {
  const a = pts.geometry.attributes;
  for (let lane = 0; lane < FW_LANES; lane++) {
    const off = lane * FW_PERIOD / FW_LANES + hash(lane + seed) * 0.3;
    const n = Math.floor((t - off) / FW_PERIOD);
    const tau = t - off - n * FW_PERIOD;
    const h = (k) => hash(n * 17.3 + lane * 5.1 + k + seed * 3.7);
    const cx = -28 + h(1) * 88, cz = -30 + h(2) * 40, cy = 28 + h(3) * 14;
    const col = C(PAL.party[Math.floor(h(4) * 6)]); const col2 = C(PAL.party[Math.floor(h(5) * 6)]);
    const base = lane * FW_PER;
    const rise = 0.75;
    for (let i = 0; i < FW_PER; i++) {
      const j = base + i;
      let x = 0, y = -999, z = 0, r = 0, g = 0, b = 0, s = 0;
      if (tau < rise) {
        if (i < 8) {                               // rocket + short trail
          const u = clamp(tau / rise - i * 0.025, 0, 1);
          const e = 1 - Math.pow(1 - u, 2);
          x = cx + (h(6) - 0.5) * 4 * (1 - e); y = 2 + (cy - 2) * e; z = cz;
          const k = (1 - i / 8) * 1.6; r = 1.0 * k; g = 0.85 * k; b = 0.6 * k; s = 0.9 - i * 0.06;
        }
      } else {
        const te = tau - rise;
        const life = 1.9;
        if (te < life) {
          // fibonacci sphere direction, rotated per burst
          const fi = i + 0.5, phi = Math.acos(1 - 2 * fi / FW_PER), th = PI * (1 + Math.sqrt(5)) * fi + h(7) * 6.28;
          const dx = Math.sin(phi) * Math.cos(th), dy = Math.cos(phi), dz = Math.sin(phi) * Math.sin(th);
          const sp = 9 + h(8) * 4 + (i % 3) * 0.8;
          const dr = (1 - Math.exp(-2.2 * te)) / 2.2;
          x = cx + dx * sp * dr; y = cy + dy * sp * dr - 2.2 * te * te; z = cz + dz * sp * dr;
          const fade = Math.pow(1 - te / life, 1.4) * (0.75 + 0.25 * Math.sin(te * 30 + i));
          const flash = te < 0.12 ? 1.8 : 1;
          const cc = i % 2 ? col : col2;
          r = cc.r * 2.2 * fade * flash + 0.3 * fade; g = cc.g * 2.2 * fade * flash + 0.3 * fade; b = cc.b * 2.2 * fade * flash + 0.3 * fade;
          s = 0.95 * (1 - te / life * 0.5);
        }
      }
      a.position.array[j * 3] = x; a.position.array[j * 3 + 1] = y; a.position.array[j * 3 + 2] = z;
      a.color.array[j * 3] = r; a.color.array[j * 3 + 1] = g; a.color.array[j * 3 + 2] = b; a.size.array[j] = s;
    }
  }
  glowDirty(pts);
}

function makeRig(root, mapSize) {
  const hemi = new THREE.HemisphereLight('#ffffff', '#444444', 1); hemi.name = 'hemi';
  const key = new THREE.DirectionalLight('#ffffff', 1); key.name = 'key';
  key.castShadow = true; key.shadow.mapSize.set(mapSize, mapSize);
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.035;
  const mk = (name) => { const l = new THREE.DirectionalLight('#ffffff', 0); l.name = name; root.add(l, l.target); return l; };
  root.add(hemi, key, key.target);
  return { hemi, key, front: mk('fillFront'), rim: mk('rim') };
}
const _f1 = new THREE.Vector3(), _f2 = new THREE.Vector3(), _f3 = new THREE.Vector3();
/** Point the camera-relative fill lights (no falloff → consistent on close-ups and wides). */
function aimFills(rig, cf, intens) {
  const fwd = _f1.copy(cf.fwd); fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1); fwd.normalize();
  const right = _f2.copy(cf.right); right.y = 0; right.normalize();
  const tgt = cf.focus;
  const set = (l, dx, dy, dz, i) => {
    l.target.position.copy(tgt); l.target.updateMatrixWorld();
    _f3.copy(fwd).multiplyScalar(dz).addScaledVector(right, dx); _f3.y = dy; _f3.normalize();
    l.position.copy(tgt).addScaledVector(_f3, 50); l.updateMatrixWorld(); l.intensity = i;
  };
  set(rig.front, -0.35, 0.55, -0.85, intens.front);
  // one rim light swinging between camera-left (rimL colour) and camera-right (rimR colour)
  const k = intens.rimMix;
  set(rig.rim, lerp(-0.75, 0.75, k), 0.35, 0.75, intens.rim);
}

// non-allocating matrix compose (same convention as M)
function MI(target, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  return target.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _c1 = new THREE.Color(), _c2 = new THREE.Color();

export function buildTown(opts = {}) {
  const seed = opts.seed ?? 3;
  const T = townCtx(seed);
  const root = new THREE.Group(); root.name = 'town'; T.root = root;
  const party = new THREE.Group(); party.name = 'partyProps'; root.add(party); T.party = party;
  buildGround(T);
  buildStreetscape(T);
  buildSquare(T);
  buildPool(T);
  buildFoam(T);
  buildPark(T);
  buildDJ(T);
  const D = finalizeTown(T);
  const rig = makeRig(root, 1024);
  const anchors = T.anchors;
  anchors.houses = T.houses.map((h) => ({ index: h.index, position: h.position.clone(), yaw: h.yaw, windows: h.windows, door: h.door }));

  const background = new THREE.Color('#211e52');
  const fog = new THREE.Fog('#211e52', 50, 270);
  const options = { lighting: 'party_night', partyProps: true, foam: 0, windowGlow: 1, fireworks: false, standsCrowd: 'auto', crowdMotion: 1 };
  let P = TOWN_PRESETS.party_night, keyDir = MOON_DIR.clone(), lastT = 0;

  // window base colours (per window variation)
  const winVar = T.windows.map((w, i) => ({ k: Math.floor(hash(i * 3.17 + 0.5) * 4), tv: hash(i * 7.31 + 2) > 0.88, hero: !!w.hero }));
  const _dark = new THREE.Color(), _lit = new THREE.Color();
  function glowOf(w) {
    const v = options.windowGlow;
    const g = typeof v === 'function' ? v(w.house, w.wi) : v;
    return clamp(Number.isFinite(+g) ? +g : 0, 0, 1);
  }
  function applyWindows() {
    const ci = D.win.instanceColor.array, hi = D.winHalo.instanceColor.array;
    _dark.set(P.win.dark);
    T.windows.forEach((w, i) => {
      const g = glowOf(w), vr = winVar[i];
      _lit.set(vr.tv && P.win.tv ? '#9cc4ff' : P.win.lit[vr.k]);
      if (vr.hero && options.lighting !== 'day') _lit.set('#ffcf70');
      _lit.multiplyScalar(P.win.mul);
      _c1.copy(_dark).lerp(_lit, g);
      ci[i * 3] = _c1.r; ci[i * 3 + 1] = _c1.g; ci[i * 3 + 2] = _c1.b;
      const hg = smooth((g - 0.12) / 0.88) * P.win.halo;
      hi[i * 3] = _lit.r * hg * 0.5; hi[i * 3 + 1] = _lit.g * hg * 0.5; hi[i * 3 + 2] = _lit.b * hg * 0.5;
    });
    D.win.instanceColor.needsUpdate = true; D.winHalo.instanceColor.needsUpdate = true;
    D.winHalo.visible = P.win.halo > 0;
  }
  function applyLamps() {
    const lp = P.lamp;
    _c1.set(lp.core).multiplyScalar(lp.mul);
    for (let i = 0; i < T.lamps.length; i++) D.lampCore.setColorAt(i, _c1);
    D.lampCore.instanceColor.needsUpdate = true;
    _c1.set(lp.pool).multiplyScalar(lp.poolA);
    for (let i = 0; i < T.lamps.length; i++) D.lampPool.setColorAt(i, _c1);
    D.lampPool.instanceColor.needsUpdate = true; D.lampPool.visible = lp.poolA > 0;
    _c1.set(lp.halo).multiplyScalar(lp.haloI);
    const a = D.lampHalo.geometry.attributes;
    for (let i = 0; i < T.lamps.length; i++) { a.color.array[i * 3] = _c1.r; a.color.array[i * 3 + 1] = _c1.g; a.color.array[i * 3 + 2] = _c1.b; a.size.array[i] = lp.haloS; }
    glowDirty(D.lampHalo); D.lampHalo.visible = lp.haloI > 0;
  }
  function applyGlows() {
    for (const im of D.glows) {
      im.userData.items.forEach((it, i) => {
        const k = it.group === 'porch' ? P.porch : it.group === 'stage' ? P.stage : 1;
        _c1.copy(it.base).multiplyScalar(k);
        im.setColorAt(i, _c1);
      });
      im.instanceColor.needsUpdate = true;
    }
  }
  function fillerVisible() {
    const v = options.standsCrowd;
    return !!D.fillerGroup && (v === true || (v === 'auto' && options.lighting === 'dusk'));
  }
  function setLighting(name) {
    if (!TOWN_PRESETS[name]) { console.warn(`buildTown: unknown lighting preset "${name}"`); return; }
    P = TOWN_PRESETS[name]; options.lighting = name;
    applySky(D.sky, P.sky);
    D.stars.visible = P.stars > 0; D.stars.material.uniforms.uOpacity.value = P.stars;
    D.moon.visible = D.moonHalo.visible = P.moon > 0;
    D.moon.material.opacity = P.moon; D.moonHalo.material.opacity = P.moon * 0.3;
    if (D.clouds) {
      D.clouds.visible = P.clouds > 0;
      D.clouds.material.emissive.set(name === 'dusk' ? '#ff9a8a' : '#ffffff');
      D.clouds.material.emissiveIntensity = name === 'dusk' ? 0.35 : 0.2;
    }
    background.set(P.bg); fog.color.set(P.fog[0]); fog.near = P.fog[1]; fog.far = P.fog[2];
    rig.hemi.color.set(P.hemi[0]); rig.hemi.groundColor.set(P.hemi[1]); rig.hemi.intensity = P.hemi[2];
    rig.key.color.set(P.key[0]); rig.key.intensity = P.key[1]; keyDir.copy(P.key[2]);
    rig.front.color.set(P.front[0]);
    const wu = D.sky && T.water.material.uniforms;
    wu.uDeep.value.set(P.water.deep); wu.uShallow.value.set(P.water.shallow); wu.uGlow.value = P.water.glow; wu.uSpark.value = P.water.spark;
    for (const m of D.clock) m.material.color.setScalar(P.clock);
    if (T.bannerMesh) T.bannerMesh.material.emissiveIntensity = P.banner;
    if (T.vsSign) T.vsSign.material.color.setScalar(P.sign);
    for (const b of D.beams) b.visible = P.beams > 0;
    if (D.fillerGroup) D.fillerGroup.visible = fillerVisible();
    applyWindows(); applyLamps(); applyGlows();
    updateDynamic(lastT);
  }

  // ── per-frame animation (pure functions of t)
  function updateBulbs(t) {
    const bp = P.bulbs, ci = D.bulbs.instanceColor.array, a = D.bulbHalo.geometry.attributes;
    for (let i = 0; i < T.bulbs.length; i++) {
      const b = T.bulbs[i], col = D.bulbCols[b.c];
      let k = bp.mul;
      if (!bp.off) k *= 1 - bp.twinkle + bp.twinkle * (0.5 + 0.5 * Math.sin(t * 3.4 - b.k * 0.6)) + 0.12 * Math.max(0, Math.sin(t * 1.3 + b.k * 2.39));
      ci[i * 3] = col.r * k + (bp.off ? 0.03 : 0.18 * k / bp.mul); ci[i * 3 + 1] = col.g * k + (bp.off ? 0.03 : 0.18 * k / bp.mul); ci[i * 3 + 2] = col.b * k + (bp.off ? 0.03 : 0.18 * k / bp.mul);
      const hk = bp.halo * k / Math.max(bp.mul, 1e-3) * 0.55;
      a.color.array[i * 3] = col.r * hk; a.color.array[i * 3 + 1] = col.g * hk; a.color.array[i * 3 + 2] = col.b * hk; a.size.array[i] = bp.size;
    }
    D.bulbs.instanceColor.needsUpdate = true; glowDirty(D.bulbHalo, false);
    D.bulbHalo.visible = bp.halo > 0;
  }
  function updateFlags(t) {
    const im = D.flags;
    for (let i = 0; i < T.flags.length; i++) {
      const f = T.flags[i];
      const sw = Math.sin(t * 2.1 + f.ph) * (f.big ? 0.12 : 0.22) + Math.sin(t * 3.7 + f.ph * 1.7) * 0.06;
      im.setMatrixAt(i, MI(_m1, f.x, f.y, f.z, f.yaw, f.s * 0.8, f.s, 1, sw, 0));
    }
    im.instanceMatrix.needsUpdate = true;
  }
  function updateBalloons(t) {
    const im = D.balloons, sa = D.balloonStrings.geometry.attributes.position.array;
    for (let i = 0; i < T.balloons.length; i++) {
      const b = T.balloons[i];
      const x = b.x + Math.sin(t * 0.9 + b.ph) * 0.05, y = b.y + Math.sin(t * 1.4 + b.ph * 1.3) * 0.06, z = b.z + Math.cos(t * 0.8 + b.ph) * 0.05;
      im.setMatrixAt(i, MI(_m1, x, y, z, 0, 0.36 * b.s, 0.44 * b.s, 0.36 * b.s, Math.sin(t + b.ph) * 0.08, 0));
      sa[i * 6] = b.tx; sa[i * 6 + 1] = b.ty; sa[i * 6 + 2] = b.tz; sa[i * 6 + 3] = x; sa[i * 6 + 4] = y - 0.22 * b.s; sa[i * 6 + 5] = z;
    }
    im.instanceMatrix.needsUpdate = true; D.balloonStrings.geometry.attributes.position.needsUpdate = true;
  }
  function updateEQ(t) {
    const im = D.eq;
    for (let i = 0; i < T.eq.length; i++) {
      const e = T.eq[i];
      const h = (0.06 + 0.42 * (0.5 + 0.5 * Math.sin(t * 7.3 + e.k * 1.7)) * (0.6 + 0.4 * Math.sin(t * 2.3 + e.k * 0.45))) * (0.3 + 0.7 * P.eq);
      im.setMatrixAt(i, MI(_m1, e.x, e.y + h / 2, e.z, e.yaw, 0.11, h, 0.03));
      _c1.set(PAL.party[e.k % 6]).multiplyScalar(0.4 + 1.6 * P.eq); im.setColorAt(i, _c1);
    }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
    const beat = Math.pow(Math.max(0, Math.sin(t * PI * 4)), 6) * P.eq;
    const cm = D.cones;
    for (let i = 0; i < T.speakers.length; i++) {
      const s = T.speakers[i], f = 1 + 0.05 * beat;
      cm.setMatrixAt(i, MI(_m1, s.x + Math.sin(s.yaw) * 0.02 * beat, s.y, s.z + Math.cos(s.yaw) * 0.02 * beat, s.yaw, s.r * 2 * f, 0.06 + 0.06 * beat, s.r * 2 * f, PI / 2));
    }
    cm.instanceMatrix.needsUpdate = true;
    D.beams.forEach((b, i) => { b.material.opacity = P.beams * (0.75 + 0.25 * Math.sin(t * 1.7 + i * 1.9)); });
  }
  function updateFoam(t) {
    const amt = options.foam, im = D.foam;
    im.visible = amt > 0.001;
    if (D.foamBase) { D.foamBase.visible = im.visible; D.foamBase.position.y = -0.3 + 0.42 * amt; }
    if (!im.visible) return;
    const fb = T.foamBalls;
    for (let i = 0; i < D.foamN; i++) {
      const b = fb[i];
      if (b.rank > amt) { im.setMatrixAt(i, MI(_m1, b.x, -5, b.z, 0, 0.001, 0.001, 0.001)); continue; }
      const y = b.y * (0.3 + 0.7 * amt) + Math.sin(t * 1.6 + b.ph) * 0.035;
      const r = b.r * (0.75 + 0.25 * amt) * (1 + 0.06 * Math.sin(t * 2.3 + b.ph * 1.3));
      im.setMatrixAt(i, MI(_m1, b.x, y, b.z, b.ph, r * 2, r * 1.8, r * 2));
    }
    const fc = T.foamCannon, on = party.visible;
    for (let k = 0; k < D.streamN; k++) {
      const i = D.foamN + k;
      if (!on) { im.setMatrixAt(i, MI(_m1, 0, -5, 0, 0, 0.001, 0.001, 0.001)); continue; }
      const s = ((k / D.streamN + t * 0.55) % 1 + 1) % 1;
      const x = lerp(fc.muzzle[0], fc.target[0], s) + Math.sin(k * 2.3 + t * 3) * 0.25 * s;
      const z = lerp(fc.muzzle[2], fc.target[2], s);
      const y = lerp(fc.muzzle[1], fc.target[1], s) + 2.6 * 4 * s * (1 - s);
      const r = (0.14 + 0.3 * s) * Math.min(1, amt * 2);
      im.setMatrixAt(i, MI(_m1, x, y, z, k, r * 2, r * 2, r * 2));
    }
    im.instanceMatrix.needsUpdate = true;
  }
  function updateFiller(t) {
    if (!D.fillerGroup || !D.fillerGroup.visible) return;
    const F = D.filler, mo = options.crowdMotion;
    F.slots.forEach((s, i) => {
      const ph = hash(s.k * 1.31) * 2;
      const bnc = Math.abs(Math.sin(PI * (t * 2.0 + ph))) * 0.07 * mo;
      const cy = Math.cos(s.yaw), sy = Math.sin(s.yaw);
      const L2W = (lx, ly, lz) => [s.x + lx * cy + lz * sy, s.y + ly, s.z - lx * sy + lz * cy];
      F.legs.setMatrixAt(i, MI(_m1, s.x, s.y + 0.4, s.z, s.yaw, 0.44, 0.8, 0.26));
      F.torso.setMatrixAt(i, MI(_m1, s.x, s.y + 1.11 + bnc, s.z, s.yaw));
      F.head.setMatrixAt(i, MI(_m1, s.x, s.y + 1.66 + bnc, s.z, s.yaw + Math.sin(t * 1.1 + ph * 3) * 0.25 * mo, 1, 1, 1, Math.sin(t * 2 + ph) * 0.05 * mo));
      F.hat.setMatrixAt(i, MI(_m1, s.x, s.y + 2.06 + bnc, s.z, s.yaw, 0.26, 0.36, 0.26, 0, 0.12 * (hash(i) - 0.5)));
      const mode = s.k % 3;
      for (const side of [1, -1]) {
        let ang;
        if (mo < 0.01) ang = 0.12;
        else if (mode === 0) ang = 2.55 + Math.sin(t * 6 + ph * 3 + side) * 0.35;
        else if (mode === 1) ang = side > 0 ? 2.8 + Math.sin(t * 5 + ph) * 0.3 : 0.25;
        else ang = 2.9 - Math.abs(Math.sin(t * 4.5 + ph)) * 0.5;
        ang = lerp(0.12, ang, clamp(mo, 0, 1));
        const sh = L2W(side * 0.33, 1.34 + bnc, 0);
        _m1.makeTranslation(sh[0], sh[1], sh[2]);
        _m2.makeRotationY(s.yaw); _m1.multiply(_m2);
        _m2.makeRotationZ(side * ang); _m1.multiply(_m2);
        _m2.makeTranslation(0, -0.25, 0); _m1.multiply(_m2);
        _m2.makeScale(0.15, 0.52, 0.15); _m1.multiply(_m2);
        F.arms.setMatrixAt(i * 2 + (side > 0 ? 0 : 1), _m1);
      }
    });
    for (const k of ['legs', 'torso', 'head', 'hat', 'arms']) F[k].instanceMatrix.needsUpdate = true;
  }
  function updateDynamic(t) {
    if (party.visible) { updateBulbs(t); updateFlags(t); updateBalloons(t); updateEQ(t); }
    updateFoam(t);
    if (D.fw.visible) updateFireworks(D.fw, t, seed);
    updateFiller(t);
  }
  function update(t) {
    t = +t || 0; lastT = t;
    D.stars.material.uniforms.uTime.value = t;
    T.water.material.uniforms.uTime.value = t;
    if (D.ring) {
      const fr = T.floaties.ring, fd = T.floaties.duck;
      D.ring.position.set(fr.x + Math.sin(t * 0.4) * 0.5, 0.1 + Math.sin(t * 1.7) * 0.03, fr.z + Math.cos(t * 0.33) * 0.3);
      D.ring.rotation.set(Math.sin(t * 1.3) * 0.06, t * 0.25, Math.cos(t * 1.1) * 0.06);
      D.duck.position.set(fd.x + Math.sin(t * 0.3 + 1) * 0.6, 0.02 + Math.sin(t * 1.9 + 0.5) * 0.03, fd.z + Math.cos(t * 0.27) * 0.25);
      D.duck.rotation.set(Math.sin(t * 1.5) * 0.05, -0.6 + Math.sin(t * 0.3) * 0.7, Math.cos(t * 1.2) * 0.05);
    }
    updateDynamic(t);
  }
  function setOpt(key, value) {
    switch (key) {
      case 'lighting': setLighting(value); break;
      case 'partyProps': options.partyProps = !!value; party.visible = !!value; updateDynamic(lastT); break;
      case 'foam': options.foam = clamp(+value || 0, 0, 1); updateFoam(lastT); break;
      case 'windowGlow': options.windowGlow = value; applyWindows(); break;
      case 'fireworks': options.fireworks = !!value; D.fw.visible = !!value; if (value) updateFireworks(D.fw, lastT, seed); break;
      case 'standsCrowd': options.standsCrowd = value; if (D.fillerGroup) D.fillerGroup.visible = fillerVisible(); updateFiller(lastT); break;
      case 'crowdMotion': options.crowdMotion = clamp(+value || 0, 0, 1); updateFiller(lastT); break;
      default: console.warn(`buildTown: unknown option "${key}"`); return set;
    }
    return set;
  }
  function beforeRender(camera) {
    const cf = cameraFocus(camera);
    const half = clamp(cf.dist * 0.8 + 5, 8, 50);
    const center = V3().copy(cf.pos).lerp(cf.focus, 0.62); center.y = 0;
    fitShadow(rig.key, center, half, keyDir, 1024);
    const fl = P.flicker;
    const fa = 1 + fl * (0.6 * Math.sin(lastT * 2.3) + 0.4 * Math.sin(lastT * 5.3 + 1.3));
    // rim swings between the two party colours (pure function of t)
    const mix = P.rimR[1] > 0 && P.rimL[1] > 0 ? 0.5 + 0.5 * Math.sin(lastT * 1.6) : (P.rimR[1] > 0 ? 1 : 0);
    _c1.set(P.rimL[0]).multiplyScalar(P.rimL[1]).lerp(_c2.set(P.rimR[0]).multiplyScalar(P.rimR[1]), mix);
    const ri = Math.max(_c1.r, _c1.g, _c1.b);
    if (ri > 1e-4) rig.rim.color.copy(_c1).multiplyScalar(1 / ri);
    aimFills(rig, cf, { front: P.front[1], rim: ri * fa * 1.15, rimMix: mix });
  }
  const set = {
    root, anchors, options, background, fog,
    setLighting, set: setOpt, update, beforeRender,
    info: { kind: 'town', houses: T.houses.length, windows: T.windows.length, lamps: T.lamps.length, bulbs: T.bulbs.length, flags: T.flags.length, balloons: T.balloons.length, trees: T.trees.length, fans: (T.fillerSlots || []).length, presets: Object.keys(TOWN_PRESETS) },
  };
  installSceneHook(root, (cam) => beforeRender(cam));
  setLighting('party_night');
  update(0);
  return set;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ ROOM

export const ROOM_PRESETS = ['night', 'day', 'dawn'];
const ROOM_VARIANTS = {
  hero: { wall: '#3d5a80', wall2: '#2f4766', floor: '#b07a4a', bed: '#1d2a44', bed2: '#ffd23f', curtain: '#ffd23f', rug: '#ff7a2f', poster: 'knight', pattern: 'knights' },
  marcus: { wall: '#ff9a4a', wall2: '#e07a30', floor: '#8a5a3a', bed: '#2f4d8a', bed2: '#ff7a2f', curtain: '#1d1d22', rug: '#3ee0c8', poster: 'music', pattern: 'stripes' },
  brenda: { wall: '#c7aef0', wall2: '#a98ad8', floor: '#d8bf9c', bed: '#ff8fc8', bed2: '#ffffff', curtain: '#fff4fb', rug: '#ffd23f', poster: 'star', pattern: 'dots' },
  grandad: { wall: '#a9c28f', wall2: '#86a06c', floor: '#6b4a2f', bed: '#8a3a2b', bed2: '#e8d9b8', curtain: '#7a1f2b', rug: '#a3263a', poster: 'frames', pattern: 'damask' },
};
function wallTex(v, key) {
  return cachedTex('wall_' + key, 256, 256, (g, w, h) => {
    g.fillStyle = v.wall; g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.14; g.fillStyle = '#ffffff';
    if (v.pattern === 'stripes') { for (let i = 0; i < 8; i += 2) g.fillRect(i * w / 8, 0, w / 8, h); }
    else if (v.pattern === 'dots') { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.beginPath(); g.arc((x + (y % 2) * 0.5) * w / 8, (y + 0.5) * h / 8, 6, 0, PI * 2); g.fill(); } }
    else if (v.pattern === 'damask') { g.globalAlpha = 0.12; g.fillStyle = '#2f4a2a'; for (let i = 0; i < 8; i += 2) g.fillRect(i * w / 8 + 10, 0, 6, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) drawStar(g, (x + 0.5) * w / 4, (y + 0.5) * h / 4, 10, '#2f4a2a', 4, 0.4); }
    else if (v.pattern === 'knights') { g.globalAlpha = 0.07; for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) drawKnight(g, (x + 0.5 + (y % 2) * 0.5) * w / 3, (y + 0.5) * h / 3, 46, '#ffffff'); }
    g.globalAlpha = 1;
  }, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2.5); });
}
function floorTex(color, key) {
  return cachedTex('floor_' + key, 256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    const R = rng(12);
    for (let i = 0; i < 8; i++) {
      const y = i * h / 8;
      g.fillStyle = `rgba(0,0,0,${0.06 + R() * 0.08})`; g.fillRect(0, y, w, h / 8);
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, y, w, 2);
      const off = R() * w; g.fillRect(off, y, 2, h / 8); g.fillRect((off + w / 2) % w, y, 2, h / 8);
      g.fillStyle = `rgba(255,255,255,${R() * 0.06})`; g.fillRect(0, y + 3, w, 3);
    }
  }, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 2.5); });
}
function posterTex(kind) {
  return cachedTex('poster_' + kind, 256, 360, (g, w, h) => {
    const F = DISPLAY();
    if (kind === 'knight') {
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#ffe14a'); bg.addColorStop(1, '#ff9a2f');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(w / 2, h * 0.42, 100, 0, PI * 2); g.fill();
      drawKnight(g, w / 2, h * 0.42, 190, '#1d1d22');
      outlinedText(g, 'HUSS!', w / 2, h * 0.86, `64px ${F}`, '#ffffff', '#1d1d22', 10);
    } else if (kind === 'music') {
      g.fillStyle = '#1d1d22'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) { g.fillStyle = PAL.party[i]; g.fillRect(20 + i * 37, h * 0.62 - (40 + (i * 37) % 90), 26, 40 + (i * 37) % 90); }
      g.fillStyle = '#ff4fa3'; g.beginPath(); g.ellipse(100, 130, 26, 20, -0.4, 0, PI * 2); g.fill(); g.fillRect(118, 40, 10, 92);
      g.beginPath(); g.ellipse(170, 115, 26, 20, -0.4, 0, PI * 2); g.fill(); g.fillRect(188, 25, 10, 92); g.fillRect(118, 36, 80, 14);
      outlinedText(g, 'PARTY', w / 2, h * 0.84, `60px ${F}`, '#3ee0c8', '#000000', 8);
    } else if (kind === 'star') {
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#8a5cff'); bg.addColorStop(1, '#ff4fa3');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      drawStar(g, w / 2, h * 0.4, 100, '#ffe14a'); drawStar(g, w * 0.2, h * 0.15, 18, '#ffffff'); drawStar(g, w * 0.82, h * 0.66, 14, '#ffffff');
      outlinedText(g, 'SHINE', w / 2, h * 0.84, `58px ${F}`, '#ffffff', '#5a1f7a', 8);
    } else if (kind === 'ball') {
      g.fillStyle = '#2f4d8a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ff7a2f'; g.beginPath(); g.arc(w / 2, h * 0.42, 90, 0, PI * 2); g.fill();
      g.strokeStyle = '#1d1d22'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h * 0.42, 90, 0, PI * 2); g.moveTo(w / 2 - 90, h * 0.42); g.lineTo(w / 2 + 90, h * 0.42); g.moveTo(w / 2, h * 0.42 - 90); g.lineTo(w / 2, h * 0.42 + 90); g.stroke();
      outlinedText(g, 'SLAM', w / 2, h * 0.84, `60px ${F}`, '#ffffff', '#000000', 8);
    } else {   // landscape painting for grandad
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#9fd0f0'); bg.addColorStop(0.6, '#f6e7c1'); bg.addColorStop(1, '#6d9a4e');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = '#4f7a3a'; g.beginPath(); g.moveTo(0, h * 0.7); g.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.6, h * 0.68); g.quadraticCurveTo(w * 0.8, h * 0.55, w, h * 0.66); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(w * 0.75, h * 0.25, 26, 0, PI * 2); g.fill();
    }
    g.lineWidth = 10; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.strokeRect(5, 5, w - 10, h - 10);
  });
}
function screenTex() {
  return cachedTex('laptopScreen', 128, 96, (g, w, h) => {
    g.fillStyle = '#1b2233'; g.fillRect(0, 0, w, h);
    const cs = 9, ox = 28, oy = 8;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#b58863' : '#f0d9b5'; g.fillRect(ox + x * cs, oy + y * cs, cs, cs); }
    g.fillStyle = '#3ee0c8'; g.fillRect(ox + 4 * cs + 2, oy + 4 * cs + 2, cs - 4, cs - 4);
    g.fillStyle = '#ff4fa3'; g.fillRect(4, 10, 18, 4); g.fillRect(4, 18, 14, 4); g.fillRect(106, 10, 18, 4);
  });
}
/** Painted outside views behind the window. */
function windowViewTex(mode) {
  return cachedTex('wview_' + mode, 1024, 512, (g, w, h) => {
    const R = rng(mode.length * 7 + 3);
    const skies = {
      party: ['#0b0d2c', '#2a2470', '#5a2f86'], dark: ['#070b1c', '#14204a', '#2a3f66'],
      day: ['#3a8fe6', '#8cc8f6', '#dff1fc'], sunrise: ['#3b3a8a', '#e0679a', '#ffb066'],
    };
    const [c0, c1, c2] = skies[mode];
    const bg = g.createLinearGradient(0, 0, 0, h * 0.8); bg.addColorStop(0, c0); bg.addColorStop(0.6, c1); bg.addColorStop(1, c2);
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (mode === 'party' || mode === 'dark') {
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,250,230,${0.3 + R() * 0.6})`; g.fillRect(R() * w, R() * h * 0.6, 1.5 + R() * 2, 1.5 + R() * 2); }
      g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(w * 0.78, h * 0.16, 26, 0, PI * 2); g.fill();
      g.fillStyle = 'rgba(255,246,220,0.15)'; g.beginPath(); g.arc(w * 0.78, h * 0.16, 60, 0, PI * 2); g.fill();
    }
    if (mode === 'day') for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(255,255,255,0.9)'; const cx = R() * w, cy = 40 + R() * 120; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(cx + k * 26, cy - (k % 2) * 12, 24, 0, PI * 2); g.fill(); } }
    if (mode === 'sunrise') { const sg = g.createRadialGradient(w * 0.35, h * 0.62, 10, w * 0.35, h * 0.62, 220); sg.addColorStop(0, 'rgba(255,240,180,1)'); sg.addColorStop(0.2, 'rgba(255,200,120,0.8)'); sg.addColorStop(1, 'rgba(255,160,100,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, h); }
    // hills + trees
    const hill = { party: '#151436', dark: '#121a2c', day: '#5fae5a', sunrise: '#4a2c5a' }[mode];
    g.fillStyle = hill; g.beginPath(); g.moveTo(0, h * 0.62);
    for (let x = 0; x <= w; x += 32) g.lineTo(x, h * 0.6 - Math.sin(x * 0.008 + 1) * 30 - Math.sin(x * 0.021) * 12);
    g.lineTo(w, h); g.lineTo(0, h); g.fill();
    // houses across the street
    const houseCols = { party: ['#1d1a40', '#231f4a', '#1a1838'], dark: ['#1a2236', '#1e2840', '#172034'], day: ['#f2c4c4', '#c9e4f2', '#f3e3a5', '#d6e8c4', '#cbbfe6'], sunrise: ['#3a2850', '#43305a', '#33244a'] }[mode];
    const roofCols = { party: '#120f2c', dark: '#080c14', day: '#b5543f', sunrise: '#2a1c3c' }[mode];
    const winLit = { party: '#ffd27a', dark: '#2a3550', day: '#7fa0c0', sunrise: '#ffb870' }[mode];
    let x = -20;
    while (x < w) {
      const hw = 120 + R() * 70, hh = 120 + R() * 50, base = h * 0.84;
      g.fillStyle = houseCols[Math.floor(R() * houseCols.length)]; g.fillRect(x, base - hh, hw, hh + 60);
      g.fillStyle = roofCols; g.beginPath(); g.moveTo(x - 10, base - hh); g.lineTo(x + hw / 2, base - hh - 50 - R() * 20); g.lineTo(x + hw + 10, base - hh); g.fill();
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        const lit = mode === 'party' ? R() > 0.25 : mode === 'dark' ? R() > 0.85 : mode === 'sunrise' ? R() > 0.6 : true;
        g.fillStyle = lit ? (mode === 'dark' ? '#d8e2ff' : winLit) : (mode === 'day' ? '#7fa0c0' : 'rgba(0,0,0,0.35)');
        g.fillRect(x + 18 + c * (hw - 36) / 2.6, base - hh + 22 + r * 56, 22, 30);
      }
      x += hw + 26 + R() * 30;
    }
    // street + front trees
    g.fillStyle = { party: '#0d0c22', dark: '#05070c', day: '#55585f', sunrise: '#2a1c34' }[mode]; g.fillRect(0, h * 0.86, w, h);
    const tree = { party: '#0f2a2a', dark: '#060c0c', day: '#3c8f45', sunrise: '#2a2040' }[mode];
    for (let i = 0; i < 6; i++) { g.fillStyle = tree; const tx = R() * w; g.beginPath(); g.arc(tx, h * 0.72, 40 + R() * 20, 0, PI * 2); g.fill(); g.fillRect(tx - 5, h * 0.72, 10, h * 0.2); }
    if (mode === 'party') {   // string lights drawn into the painting (static); flicker added in the shader
      for (let k = 0; k < 2; k++) for (let i = 0; i < 40; i++) {
        const xx = i * w / 39, yy = h * (0.5 + k * 0.12) + Math.sin(i / 39 * PI) * -40 + (i % 2) * 2;
        g.fillStyle = PAL.party[(i + k) % 6]; g.beginPath(); g.arc(xx, yy, 5, 0, PI * 2); g.fill();
      }
    }
  }, (t) => { t.wrapS = THREE.ClampToEdgeWrapping; });
}
function windowViewMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: null }, uTime: { value: 0 }, uBokeh: { value: 1 }, uBright: { value: 1 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uTime, uBokeh, uBright; varying vec2 vUv;
      vec3 pal(float i){ i = mod(i, 6.0);
        return i < 1.0 ? vec3(1.0,0.31,0.64) : i < 2.0 ? vec3(1.0,0.82,0.25) : i < 3.0 ? vec3(0.24,0.88,0.78) : i < 4.0 ? vec3(0.54,0.36,1.0) : i < 5.0 ? vec3(1.0,0.48,0.18) : vec3(0.31,0.70,1.0); }
      float h1(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
      void main(){
        vec4 tex = texture2D(uMap, vUv);
        vec3 c = tex.rgb * uBright;
        if (uBokeh > 0.5) {
          for (int i = 0; i < 18; i++) {
            float fi = float(i);
            vec2 p = vec2(h1(fi * 1.7), 0.42 + h1(fi * 3.1) * 0.35);
            float r = 0.035 + h1(fi * 5.3) * 0.05;
            float d = length((vUv - p) * vec2(2.0, 1.0));
            float fl = 0.55 + 0.45 * sin(uTime * (2.0 + h1(fi) * 3.0) + fi * 2.3);
            c += pal(fi) * smoothstep(r, r * 0.35, d) * 0.55 * fl;
          }
        }
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function buildRoom(opts = {}) {
  const variant = ROOM_VARIANTS[opts.variant] ? opts.variant : 'hero';
  const V0 = ROOM_VARIANTS[variant];
  const VA = { ...V0, ...(opts.wall ? { wall: opts.wall, wall2: opts.wall } : {}), ...(opts.floor ? { floor: opts.floor } : {}) };
  const posterKind = opts.poster || V0.poster;
  const root = new THREE.Group(); root.name = `room:${variant}`;
  const anchors = {};
  const Mr = new Merger(), Mg = new Merger();
  const RW = 2.5, RD = 2.1, WH = 3.1, TH = 0.12;          // half width, half depth, wall height, wall thickness
  // window opening in the back wall
  const wx0 = -1.45, wx1 = -0.15, wy0 = 0.95, wy1 = 2.25, wxc = (wx0 + wx1) / 2, wyc = (wy0 + wy1) / 2;
  // floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(RW * 2 + TH * 2, 0.1, RD * 2 + TH), new THREE.MeshLambertMaterial({ color: '#ffffff', map: floorTex(VA.floor, variant + VA.floor) }));
  floor.position.set(0, -0.05, -TH / 2); floor.receiveShadow = true; root.add(floor);
  // walls (textured), back wall with the window hole
  const wallMat = new THREE.MeshLambertMaterial({ color: '#ffffff', map: wallTex(VA, variant + VA.wall) });
  const wm = new Merger();
  const bz = -RD - TH / 2;
  wm.box('#ffffff', (-RW - TH + wx0) / 2, WH / 2, bz, wx0 + RW + TH, WH, TH);
  wm.box('#ffffff', (wx1 + RW + TH) / 2, WH / 2, bz, RW + TH - wx1, WH, TH);
  wm.box('#ffffff', wxc, wy0 / 2, bz, wx1 - wx0, wy0, TH);
  wm.box('#ffffff', wxc, (wy1 + WH) / 2, bz, wx1 - wx0, WH - wy1, TH);
  for (const s of [-1, 1]) wm.box('#ffffff', s * (RW + TH / 2), WH / 2, -TH / 2, TH, WH, RD * 2 + TH);
  const walls = wm.build(wallMat, 'walls', { cast: true, receive: false }); walls.material = wallMat; root.add(walls);
  // wainscot (lower wall band), baseboards, wall caps
  for (const s of [-1, 1]) Mr.box(VA.wall2, s * (RW - 0.01), 0.45, 0, 0.03, 0.9, RD * 2);
  Mr.box(VA.wall2, (-RW + wx0) / 2, 0.45, -RD + 0.01, wx0 + RW, 0.9, 0.03);
  Mr.box(VA.wall2, (wx1 + RW) / 2, 0.45, -RD + 0.01, RW - wx1, 0.9, 0.03);
  Mr.box(VA.wall2, wxc, 0.45, -RD + 0.01, wx1 - wx0, 0.9, 0.03);
  Mr.box(PAL.trim, 0, 0.92, -RD + 0.03, RW * 2, 0.05, 0.04);
  for (const s of [-1, 1]) Mr.box(PAL.trim, s * (RW - 0.03), 0.92, 0, 0.04, 0.05, RD * 2);
  Mr.box(PAL.trim, 0, 0.06, -RD + 0.03, RW * 2, 0.12, 0.05);
  for (const s of [-1, 1]) Mr.box(PAL.trim, s * (RW - 0.03), 0.06, 0, 0.05, 0.12, RD * 2);
  Mr.box(shade(VA.wall2, 0.8), 0, WH + 0.02, bz, RW * 2 + TH * 2, 0.05, TH + 0.02);
  for (const s of [-1, 1]) { Mr.box(shade(VA.wall2, 0.8), s * (RW + TH / 2), WH + 0.02, -TH / 2, TH + 0.02, 0.05, RD * 2 + TH); Mr.box(shade(VA.wall2, 0.85), s * (RW + TH / 2), WH / 2, RD + 0.005, TH + 0.01, WH, 0.012); }
  Mr.box(shade(VA.floor, 0.7), 0, -0.05, RD + 0.005, RW * 2 + TH * 2, 0.1, 0.012);
  // window frame, mullions, sill, curtains + rod
  Mr.box(PAL.trim, wxc, wy1 + 0.05, -RD + 0.02, wx1 - wx0 + 0.2, 0.1, 0.1);
  Mr.box(PAL.trim, wxc, wy0 - 0.04, -RD + 0.06, wx1 - wx0 + 0.3, 0.07, 0.2);
  for (const s of [-1, 1]) Mr.box(PAL.trim, s > 0 ? wx1 + 0.05 : wx0 - 0.05, wyc, -RD + 0.02, 0.1, wy1 - wy0 + 0.2, 0.1);
  Mr.box(PAL.trim, wxc, wyc, bz, 0.05, wy1 - wy0, 0.05); Mr.box(PAL.trim, wxc, wyc, bz, wx1 - wx0, 0.05, 0.05);
  Mr.cyl('#5a4632', wxc, wy1 + 0.26, -RD + 0.14, 0.025, wx1 - wx0 + 1.1, 'cyl8', 0, 0, PI / 2);
  for (const s of [-1, 1]) {
    const cx = s > 0 ? wx1 + 0.28 : wx0 - 0.28;
    for (let k = 0; k < 4; k++) Mr.cyl(shade(VA.curtain, k % 2 ? 0.9 : 1.0), cx + (k - 1.5) * 0.085, (wy1 + 0.22) / 2 + 0.02, -RD + 0.15 + (k % 2) * 0.03, 0.06, wy1 + 0.2, 'cyl8');
  }
  // backdrop outside the window
  const view = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.1), windowViewMaterial());
  view.position.set(wxc, 1.55, -RD - 1.15); view.name = 'windowView'; root.add(view);
  const viewMat = view.material;
  // ── furniture
  // bed against the left wall (head at the back)
  const bedX = -RW + 0.55, bedZ = -RD + 1.05;
  Mr.rbox(PAL.woodDark, bedX, 0.2, bedZ, 1.04, 0.28, 2.04, 0.04);
  Mr.rbox(PAL.woodDark, bedX, 0.62, -RD + 0.06, 1.1, 1.0, 0.08, 0.04);
  Mr.rbox(PAL.woodDark, bedX, 0.4, bedZ + 1.0, 1.1, 0.6, 0.06, 0.03);
  Mr.rbox('#f6f3ea', bedX, 0.42, bedZ, 0.98, 0.2, 1.96, 0.07);
  Mr.rbox(VA.bed, bedX, 0.5, bedZ + 0.3, 1.04, 0.1, 1.42, 0.05);
  Mr.rbox(VA.bed2, bedX, 0.555, bedZ - 0.38, 1.04, 0.02, 0.14, 0.01);
  for (const s of [-1, 1]) Mr.rbox(VA.bed, bedX + s * 0.53, 0.38, bedZ + 0.3, 0.04, 0.32, 1.42, 0.02);
  Mr.rbox('#ffffff', bedX, 0.6, -RD + 0.35, 0.72, 0.14, 0.38, 0.07);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Mr.box(PAL.woodDark, bedX + sx * 0.46, 0.05, bedZ + sz * 0.95, 0.07, 0.1, 0.07);
  mkAnchor(anchors, root, 'room.bed', bedX, 0.55, bedZ, 0);
  // desk against the right wall (top at 0.78), facing −X
  const dX = RW - 0.32, dZ = -RD + 0.75, dW = 1.3, dD = 0.62;
  Mr.rbox(variant === 'grandad' ? '#6b4a2f' : PAL.wood, dX, TABLE_TOP - 0.025, dZ, dD, 0.05, dW, 0.015);
  Mr.rbox(variant === 'grandad' ? '#5a3b24' : '#e9e3d6', dX + 0.02, 0.37, dZ - dW / 2 + 0.22, dD - 0.06, 0.74, 0.4, 0.02);
  for (const k of [0, 1, 2]) Mr.box('#c7b48c', dX - dD / 2 + 0.03, 0.18 + k * 0.22, dZ - dW / 2 + 0.22, 0.01, 0.03, 0.2);
  for (const sz of [-1, 1]) Mr.box(variant === 'grandad' ? '#5a3b24' : '#e9e3d6', dX + 0.02, 0.37, dZ + dW / 2 - 0.04, dD - 0.06, 0.74, 0.04);
  mkAnchor(anchors, root, 'room.desk', dX, TABLE_TOP, dZ, PI / 2);
  mkAnchor(anchors, root, 'room.chair', dX - 0.55, 0, dZ, PI / 2);
  // desk chair (seat 0.55, back towards −X)
  { const cx = dX - 0.55 - 0.02, cz = dZ;
    Mg.rbox('#2b2f3a', cx, 0.5, cz, 0.46, 0.08, 0.46, 0.03);
    Mg.rbox(VA.rug, cx, 0.55, cz, 0.42, 0.04, 0.42, 0.02);
    Mg.rbox('#2b2f3a', cx - 0.24, 0.86, cz, 0.06, 0.5, 0.42, 0.03, 0, 0, -0.08);
    Mg.cyl('#9aa3ad', cx, 0.27, cz, 0.03, 0.46, 'cyl8');
    for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; Mg.box('#2b2f3a', cx + Math.cos(a) * 0.17, 0.05, cz + Math.sin(a) * 0.17, 0.34, 0.04, 0.05, -a); Mg.add(G.sphereLo, '#1d1d22', M(cx + Math.cos(a) * 0.32, 0.03, cz + Math.sin(a) * 0.32, 0, 0.06, 0.06, 0.06)); }
  }
  // desk lamp (warm bulb glows at night)
  const lampX = dX + 0.12, lampZ = dZ - dW / 2 + 0.2;
  Mg.cyl('#1d1d22', lampX, TABLE_TOP + 0.015, lampZ, 0.09, 0.03, 'cyl');
  Mg.cyl('#1d1d22', lampX - 0.06, TABLE_TOP + 0.2, lampZ + 0.03, 0.015, 0.4, 'cyl6', 0, 0.15, 0.3);
  Mg.add(G.cone, V0.rug, M(lampX - 0.17, TABLE_TOP + 0.4, lampZ + 0.08, 0, 0.22, 0.18, 0.22, 0, 0.7));
  const lampBulb = new THREE.Mesh(G.sphereLo, new THREE.MeshBasicMaterial({ color: '#fff2c0' }));
  lampBulb.position.set(lampX - 0.21, TABLE_TOP + 0.35, lampZ + 0.08); lampBulb.scale.setScalar(0.07); root.add(lampBulb);
  // desk items per variant
  const screen = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: screenTex() }));
  if (variant === 'hero' || variant === 'marcus') {
    Mg.rbox('#c7ccd4', dX + 0.02, TABLE_TOP + 0.012, dZ + 0.22, 0.3, 0.02, 0.4, 0.01);
    Mg.rbox('#c7ccd4', dX + 0.17, TABLE_TOP + 0.14, dZ + 0.22, 0.02, 0.26, 0.4, 0.01, 0, 0, 0.18);
    screen.position.set(dX + 0.155, TABLE_TOP + 0.14, dZ + 0.22); screen.rotation.set(0, -PI / 2, 0.18 * 0 ); screen.rotateX(-0.18 * 0); screen.scale.set(0.36, 0.22, 1);
    screen.rotation.order = 'YXZ'; screen.rotation.set(-0.0, -PI / 2, 0); screen.rotateX(0.18);
    root.add(screen);
  }
  if (variant === 'hero') {
    for (let k = 0; k < 5; k++) Mr.box(PAL.party[k], dX + 0.05, TABLE_TOP + 0.03 + k * 0.045, dZ - 0.15, 0.24, 0.04, 0.17 + (k % 2) * 0.02, k * 0.2);
    Mg.cyl('#fbf6ec', dX - 0.12, TABLE_TOP + 0.05, dZ - 0.38, 0.045, 0.1, 'cyl8');
  } else if (variant === 'grandad') {
    Mg.rbox('#7d5232', dX + 0.05, TABLE_TOP + 0.12, dZ + 0.2, 0.26, 0.24, 0.42, 0.04);
    Mg.cyl('#d9c9a0', dX - 0.08, TABLE_TOP + 0.13, dZ + 0.12, 0.07, 0.01, 'cyl', 0, 0, PI / 2);
    Mg.cyl('#c7ccd4', dX + 0.05, TABLE_TOP + 0.36, dZ + 0.32, 0.008, 0.25, 'cyl6');
  } else if (variant === 'brenda') {
    Mg.rbox('#ffffff', dX + 0.15, TABLE_TOP + 0.3, dZ + 0.2, 0.04, 0.5, 0.4, 0.03);
    Mr.rbox('#cfe8ff', dX + 0.125, TABLE_TOP + 0.3, dZ + 0.2, 0.01, 0.42, 0.32, 0.02);
    for (let k = 0; k < 3; k++) Mg.cyl(PAL.party[k * 2], dX - 0.1 + k * 0.05, TABLE_TOP + 0.06, dZ - 0.25 + k * 0.06, 0.025, 0.12, 'cyl8');
  }
  // shelf + trophies (right part of the back wall) / variant specials
  const shX = 1.65, shY = 1.78;
  Mr.rbox(PAL.wood, shX, shY, -RD + 0.14, 1.3, 0.05, 0.26, 0.01);
  for (const s of [-1, 1]) Mr.box('#5a4632', shX + s * 0.5, shY - 0.08, -RD + 0.1, 0.04, 0.12, 0.18);
  mkAnchor(anchors, root, 'room.shelf', shX, shY + 0.025, -RD + 0.14, 0);
  const gold = new THREE.MeshStandardMaterial({ color: '#ffc93a', roughness: 0.3, metalness: 0.55, emissive: '#5a3a00', emissiveIntensity: 0.3 });
  const gm = new Merger();
  const trophy = (x, y, z, s) => {
    gm.box('#ffc93a', x, y + 0.04 * s, z, 0.2 * s, 0.08 * s, 0.2 * s);
    gm.cyl('#ffc93a', x, y + 0.15 * s, z, 0.03 * s, 0.16 * s, 'cyl8');
    gm.add(new THREE.CylinderGeometry(0.5, 0.28, 1, 12), '#ffc93a', M(x, y + 0.33 * s, z, 0, 0.26 * s, 0.22 * s, 0.26 * s));
    for (const sd of [-1, 1]) gm.add(G.torus, '#ffc93a', M(x + sd * 0.15 * s, y + 0.35 * s, z, 0, 0.11 * s, 0.11 * s, 0.11 * s));
  };
  if (variant === 'hero') {
    trophy(shX - 0.4, shY + 0.025, -RD + 0.15, 0.9); trophy(shX, shY + 0.025, -RD + 0.15, 1.2); trophy(shX + 0.42, shY + 0.025, -RD + 0.15, 0.8);
    gm.add(knightGeometry(), '#ffc93a', M(shX + 0.2, shY + 0.025, -RD + 0.15, PI / 2, 0.24, 0.24, 0.24));
  } else if (variant === 'marcus') {
    trophy(shX - 0.3, shY + 0.025, -RD + 0.15, 0.7);
    Mg.add(G.sphere, '#ff7a2f', M(-0.9, 0.12, 1.2, 0, 0.24, 0.24, 0.24));                   // basketball on the floor
    Mr.rbox('#1d1d22', shX + 0.25, shY + 0.16, -RD + 0.15, 0.3, 0.26, 0.2, 0.03);            // speaker on the shelf
  } else if (variant === 'brenda') {
    for (let k = 0; k < 3; k++) { Mr.cyl('#c9734a', shX - 0.4 + k * 0.4, shY + 0.1, -RD + 0.15, 0.07, 0.14, 'cyl8'); Mr.add(G.ico, '#4caf50', M(shX - 0.4 + k * 0.4, shY + 0.26, -RD + 0.15, k, 0.22, 0.2, 0.22)); }
    Mr.cyl('#e9e3d6', -1.85, 0.22, 1.25, 0.18, 0.44, 'cyl'); Mr.add(G.ico, '#3c8f45', M(-1.85, 0.75, 1.25, 1, 0.75, 0.8, 0.75));   // big plant
  } else {
    for (let k = 0; k < 3; k++) Mr.rbox(['#7a1f2b', '#2f4d8a', '#3f7a5a'][k], shX - 0.35 + k * 0.1, shY + 0.15, -RD + 0.15, 0.08, 0.26, 0.2, 0.01);
    // grandfather clock in the front-right corner
    Mr.rbox('#5a3b24', RW - 0.32, 1.0, 1.55, 0.5, 2.0, 0.4, 0.04);
    Mr.add(G.cyl, '#fff8e6', M(RW - 0.32 - 0.26, 1.6, 1.55, 0, 0.34, 0.02, 0.34, 0, PI / 2));
    Mr.box('#ffc93a', RW - 0.57, 1.0, 1.55, 0.02, 0.4, 0.06);
  }
  const goldMesh = gm.build(gold, 'trophies'); if (goldMesh) { goldMesh.material = gold; root.add(goldMesh); }
  // poster(s) on the back wall
  const posterMat = new THREE.MeshLambertMaterial({ map: posterTex(posterKind === 'none' ? 'frames' : posterKind) });
  const poster = new THREE.Mesh(G.plane, posterMat);
  poster.position.set(0.55, 1.62, -RD + 0.012); poster.scale.set(0.62, 0.87, 1); poster.visible = posterKind !== 'none'; root.add(poster);
  mkAnchor(anchors, root, 'room.poster', 0.55, 1.62, -RD + 0.02, 0);
  if (variant === 'grandad') {
    poster.scale.set(0.7, 0.55, 1); poster.position.y = 1.7;
    Mr.box('#7d5232', 0.55, 1.7, -RD + 0.006, 0.82, 0.67, 0.01);
    for (const [x, y] of [[1.4, 1.3], [1.85, 1.4]]) { Mr.box('#ffc93a', x, y, -RD + 0.01, 0.3, 0.36, 0.02); Mr.box('#e8d9b8', x, y, -RD + 0.022, 0.22, 0.28, 0.01); }
  } else Mr.box('#ffffff', 0.55, 1.62, -RD + 0.006, 0.66, 0.91, 0.01);
  // rating chart poster on the right wall above the desk (hero)
  if (variant === 'hero') {
    const chart = new THREE.Mesh(G.plane, new THREE.MeshLambertMaterial({ map: cachedTex('ratingChart', 256, 200, (g, w, h) => {
      g.fillStyle = '#fbf6ec'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d0c8b8'; g.lineWidth = 2;
      for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(10, i * h / 5); g.lineTo(w - 10, i * h / 5); g.stroke(); }
      g.strokeStyle = '#2fa84f'; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath();
      [[16, 170], [60, 150], [90, 158], [130, 110], [165, 118], [200, 60], [240, 22]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      g.fillStyle = '#2fa84f'; g.beginPath(); g.moveTo(246, 14); g.lineTo(226, 22); g.lineTo(242, 36); g.fill();
    }) }));
    chart.position.set(RW - 0.012, 1.75, dZ + 0.2); chart.rotation.y = -PI / 2; chart.scale.set(0.7, 0.55, 1); root.add(chart);
  }
  // door on the left wall (front part)
  const doorZ = 1.15;
  Mr.rbox(PAL.trim, -RW + 0.02, 1.08, doorZ, 0.06, 2.2, 1.06, 0.02);
  Mr.rbox(variant === 'grandad' ? '#7d5232' : '#e9e3d6', -RW + 0.05, 1.04, doorZ, 0.05, 2.06, 0.9, 0.02);
  Mr.add(G.sphereLo, '#ffc93a', M(-RW + 0.1, 1.0, doorZ + 0.34, 0, 0.07, 0.07, 0.07));
  mkAnchor(anchors, root, 'room.door', -RW + 0.6, 0, doorZ, PI / 2);
  // rug (round, centre — hidden under the director's floor-board prop when it is used)
  const rugTex = cachedTex('rug_' + variant + VA.rug, 256, 256, (g, w, h) => {
    const c = C(VA.rug), hex = (k) => '#' + c.clone().multiplyScalar(k).getHexString();
    g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h);
    const ring = (r, col) => { g.fillStyle = col; g.beginPath(); g.arc(w / 2, h / 2, r, 0, PI * 2); g.fill(); };
    ring(127, hex(0.75)); ring(118, '#fbf6ec'); ring(112, hex(1.0)); ring(84, hex(0.8)); ring(78, '#fbf6ec'); ring(72, hex(1.05));
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; g.fillStyle = '#fbf6ec'; g.beginPath(); g.arc(w / 2 + Math.cos(a) * 98, h / 2 + Math.sin(a) * 98, 5, 0, PI * 2); g.fill(); }
    drawStar(g, w / 2, h / 2, 40, hex(0.7), 8, 0.55);
  });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5).rotateX(-PI / 2), new THREE.MeshLambertMaterial({ map: rugTex, alphaTest: 0.5 }));
  rug.position.set(0, 0.008, 0.1); rug.receiveShadow = true; root.add(rug);
  // variant lights: marcus LED strip, brenda fairy lights
  let fairy = null, led = null;
  if (variant === 'brenda' || variant === 'hero') {
    const n = variant === 'brenda' ? 26 : 0;
    if (n) {
      fairy = makeGlowPoints(n, { name: 'fairyLights', core: 0.6 });
      fairy.userData.pts = [];
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), x = lerp(-2.3, 2.3, u), y = 2.65 - Math.sin(u * PI * 3) * 0.12 - 0.1;
        fairy.userData.pts.push([x, y, -RD + 0.04]); setGlow(fairy, i, x, y, -RD + 0.05, 1, 0.8, 0.5, 0.12);
        Mr.add(G.sphereLo, '#fff2c0', M(x, y, -RD + 0.04, 0, 0.035, 0.035, 0.035));
      }
      glowDirty(fairy); root.add(fairy);
    }
  }
  if (variant === 'marcus') {
    led = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: '#8a5cff' }));
    led.position.set(0, WH - 0.12, -RD + 0.02); led.scale.set(RW * 2, 0.04, 0.02); root.add(led);
    const led2 = led.clone(); led2.material = led.material; led2.position.set(RW - 0.02, WH - 0.12, 0); led2.scale.set(0.02, 0.04, RD * 2); root.add(led2);
  }
  root.add(Mr.build(MAT.lam, 'roomStatic', { cast: true, receive: false }));
  root.add(Mg.build(MAT.vcGloss, 'roomGloss', { cast: true, receive: false }));

  // ── lights
  const hemi = new THREE.HemisphereLight('#ffffff', '#444444', 1);
  const key = new THREE.DirectionalLight('#ffffff', 1); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  const kc = key.shadow.camera; kc.left = -4; kc.right = 4; kc.top = 4; kc.bottom = -4; kc.near = 0.5; kc.far = 30; kc.updateProjectionMatrix();
  const winLight = new THREE.PointLight('#ffffff', 0, 9, 2); winLight.position.set(wxc, 1.7, -RD + 0.5);
  root.add(hemi, key, key.target, winLight);
  // fake light pools (additive): desk lamp pool + sun patch on the floor
  const poolMat = new THREE.MeshBasicMaterial({ map: radialTex(), color: '#000000', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2 });
  const lampPool = new THREE.Mesh(PLANE_FLAT, poolMat); lampPool.position.set(dX - 0.05, TABLE_TOP + 0.003, lampZ + 0.25); lampPool.scale.set(1.0, 1, 1.0); lampPool.renderOrder = 4; root.add(lampPool);
  const sunMat = new THREE.MeshBasicMaterial({ map: softRectTex(), color: '#000000', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2 });
  const sunPatch = new THREE.Mesh(PLANE_FLAT, sunMat); sunPatch.position.set(wxc + 0.25, 0.012, -RD + 1.45); sunPatch.scale.set(1.5, 1, 1.6); sunPatch.renderOrder = 4; root.add(sunPatch);
  // background dome (seen above the walls in high / wide shots)
  const dome = makeSky(40); dome.material.uniforms.uGlowAmt.value = 0; root.add(dome);

  const background = new THREE.Color('#141428');
  const fog = null;
  const options = { lighting: 'night', window: ['party', 'dark', 'day', 'sunrise'].includes(opts.window) ? opts.window : 'party' };
  const L = {
    night: { hemi: ['#4a4f8a', '#2a2030', 0.75], key: ['#ffcf9a', 1.7, V3(0.45, 0.95, 0.75)], fill: ['#9fb0ff', 0.4], lamp: 2.2, lampPool: 0.55, sun: 0,
      sky: { zenith: '#0b0c1e', mid: '#16173a', horizon: '#221f48', ground: '#0b0c1e', sunDir: V3(0, 1, 0), sunColor: '#000000' }, bg: '#141428', bright: 1.0 },
    day: { hemi: ['#eaf2ff', '#b8a080', 1.35], key: ['#fff4e0', 2.4, V3(-0.45, 0.9, 0.6)], fill: ['#ffffff', 0.55], lamp: 0, lampPool: 0, sun: 0.28,
      sky: { zenith: '#9cc6ec', mid: '#cfe3f3', horizon: '#eef4f8', ground: '#cfd8e0', sunDir: V3(0, 1, 0), sunColor: '#000000' }, bg: '#cfe3f3', bright: 1.15 },
    dawn: { hemi: ['#ffb89a', '#5a3f50', 0.95], key: ['#ffc08a', 1.8, V3(-0.4, 0.6, 0.75)], fill: ['#c9b0ff', 0.45], lamp: 0.8, lampPool: 0.25, sun: 0.25,
      sky: { zenith: '#2c2a60', mid: '#8a4f8a', horizon: '#f08a70', ground: '#2c2a40', sunDir: V3(0, 1, 0), sunColor: '#000000' }, bg: '#5a3f6a', bright: 1.0 },
  };
  const WIN = {
    party: { light: '#ff5fb0', i: 2.6, sun: '#000000' }, dark: { light: '#7f9cff', i: 0.9, sun: '#000000' },
    day: { light: '#fff2d0', i: 2.2, sun: '#fff0c8' }, sunrise: { light: '#ffa060', i: 2.8, sun: '#ffb070' },
  };
  let LP = L.night, lastT = 0;
  function applyWindow() {
    const w = options.window;
    viewMat.uniforms.uMap.value = windowViewTex(w);
    viewMat.uniforms.uBokeh.value = w === 'party' ? 1 : 0;
    winLight.color.set(WIN[w].light);
    sunMat.color.set(WIN[w].sun).multiplyScalar(LP.sun);
    updateLights(lastT);
  }
  function setLighting(name) {
    if (!L[name]) { console.warn(`buildRoom: unknown lighting preset "${name}"`); return; }
    LP = L[name]; options.lighting = name;
    hemi.color.set(LP.hemi[0]); hemi.groundColor.set(LP.hemi[1]); hemi.intensity = LP.hemi[2];
    key.color.set(LP.key[0]); key.intensity = LP.key[1];
    key.target.position.set(0, 0.8, -0.3); key.position.copy(key.target.position).addScaledVector(LP.key[2].clone().normalize(), 12);
    hemi.color.lerp(_c1.set(LP.fill[0]), 0.25); hemi.intensity += LP.fill[1] * 0.5;   // fold the old front fill into the hemisphere
    lampBulb.material.color.set('#fff2c0').multiplyScalar(LP.lamp > 0 ? 1.8 : 0.7);
    poolMat.color.set('#ffcf8a').multiplyScalar(LP.lampPool);
    applySky(dome, LP.sky); background.set(LP.bg);
    viewMat.uniforms.uBright.value = LP.bright;
    applyWindow();
  }
  function updateLights(t) {
    const w = options.window;
    let i = WIN[w].i;
    if (w === 'party') {
      const k = 0.5 + 0.5 * Math.sin(t * 2.6);
      winLight.color.set('#ff4fa3').lerp(_c1.set('#3ee0c8'), k);
      i *= 0.8 + 0.2 * Math.sin(t * 7.1) * Math.sin(t * 3.3);
    }
    if (options.lighting === 'day' && (w === 'party' || w === 'dark')) i *= 0.3;
    winLight.intensity = i;
  }
  function update(t) {
    t = +t || 0; lastT = t;
    viewMat.uniforms.uTime.value = t;
    updateLights(t);
    if (fairy) {
      const a = fairy.geometry.attributes;
      fairy.userData.pts.forEach((p, i) => { const k = 0.55 + 0.45 * Math.sin(t * 2.2 + i * 1.9); a.color.array[i * 3] = 1.0 * k; a.color.array[i * 3 + 1] = 0.82 * k; a.color.array[i * 3 + 2] = 0.5 * k; });
      glowDirty(fairy, false);
    }
    if (led) led.material.color.setHSL((t * 0.08) % 1, 0.9, 0.6).multiplyScalar(1.4);
  }
  function setOpt(k, v) {
    if (k === 'lighting') setLighting(v);
    else if (k === 'window') { if (WIN[v]) { options.window = v; applyWindow(); } else console.warn(`buildRoom: unknown window "${v}"`); }
    else console.warn(`buildRoom: unknown option "${k}"`);
    return set;
  }
  // anchors: centre, window, cams
  mkAnchor(anchors, root, 'room.center', 0, 0, 0, 0);
  mkAnchor(anchors, root, 'room.window', wxc, wyc, -RD - TH / 2, 0);
  mkAnchor(anchors, root, 'room.cam', 0.25, 1.75, 4.7, PI);
  mkAnchor(anchors, root, 'room.camClose', 0.55, 1.45, 2.3, PI);
  const set = {
    root, anchors, options, background, fog, setLighting, set: setOpt, update,
    beforeRender() {}, info: { kind: 'room', variant, window: options.window },
  };
  setLighting('night');
  update(0);
  return set;
}
