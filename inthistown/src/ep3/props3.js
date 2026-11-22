// Episode 3 ("Don't Blink") props. Same conventions as src/props.js / src/ep2/props2.js (SPEC.md §2/§7):
// ES module, metres, Y up, deterministic (no Math.random / clocks), animated things are pure functions of the
// t / u / g passed in, geometries + materials + textures cached at module level.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   makeToaster()                                        → { root, setTremble(t, amount), toast, … }
//   makeCrack({ w=1.2, h=1.0, seed=1, … })               → { root, setGrowth(g), … }
//   makeTrophy({ stone=false })                          → Object3D
//   makePhotoCamera()                                    → Object3D
//   makeCushions()                                       → Object3D
//   makeTrafficCone()                                    → Object3D
//   makeSign({ lines=['HAPPY','RETIREMENT'], w=0.6, h=0.4, color='#ffd23f', … })   → Object3D
//   makeBriefcase()                                      → Object3D
//   makeSack()                                           → Object3D
//   makePlinth({ w=0.9, d=0.9, h=0.35, plaque='NEVER BLINKED', … })               → Object3D
//   setProps3EnvIntensity(k=1)   scales the reflections of every metal/gloss material made here (e.g. 0.4 at
//                                night — the toaster chrome would otherwise look studio-lit in a dark room)
//   crackStage(g, stages=8)      → the stage index setGrowth(g) shows (0 = nothing)
//   STONE_GREY ('#9a9a9a')
//
// ── Origins / sizes / details ───────────────────────────────────────────────────────────────────
// makeToaster       0.26 (X) × 0.17 (Y, top of the body; slot rims reach 0.174) × 0.15 (Z) chrome-grey #c9ccd2 body
//                   on 4 little black feet. Origin = bottom centre (feet on y=0), front = +Z. Slots run along X
//                   (front slot z=+0.0225, back slot z=−0.0225); lever + groove on the +X end, browning dial on the
//                   front face. Returns { root, setTremble(t, amount), toast, inner, setLever(u), toastRestY,
//                   slotTopY, sweatSpot }.
//                   toast: a Group, DIRECT child of root, sitting in the front slot: root-space position
//                   (0, toastRestY=0.0696, 0.0225); its origin is the bottom centre of the slice, which is 0.1136
//                   wide (X) × 0.1226 tall (Y) × 0.02 thick (Z); at rest its top pokes 0.018 above the slot. Animate
//                   toast.position.y yourself (e.g. +0.07 = half out, +0.5 = shot out of frame). The toast faces
//                   ±Z (camera at +Z sees the toasted face). You may re-parent it.
//                   setTremble(t, amount): pure jitter of root.userData.inner (the body group; amount in metres,
//                   0.01 = the faint 1 cm tremble, 0.025 = shivering hard, 0 = rest). It also moves the toast's
//                   internal pivot (toast.children[0]) rigidly with the body as if the toast were at rest in the
//                   slot — toast.position is never touched, so your toast.position.y animation stays yours.
//                   The jitter never pushes the body below y=0 (it hops a hair instead).
//                   setLever(u): 0 = pushed down (toasting, default) … 1 = up (popped). Pure.
//                   sweatSpot: Object3D on the front face, upper right (0.085, 0.14, 0.076), inside the trembling
//                   body — parent a makeSweatDrop({ size: 0.05 }) there so it shivers with the toaster.
// makeCrack         a dark zig-zag crack decal on a transparent plane (w × h) in the XY plane facing +Z
//                   (MeshBasicMaterial, transparent, depthWrite false, polygonOffset −2/−2; renderOrder 2).
//                   Origin = the crack's START point (the impact spot). The plane is NOT centred on the origin:
//                   opts.start = [0.42, 0.58] = where the start sits as fractions of w (from the left) / h (from
//                   the bottom), so root.userData.bounds = { x0: −0.504, x1: 0.696, y0: −0.58, y1: 0.42 } for the
//                   defaults. Put root ON the surface (≈1–2 mm in front of it), facing out.
//                   Growth: the main bolt runs from the origin to the FARTHEST plane corner (default: bottom
//                   right), then `branches` (default 4, 0..6) sprout: #0 from the origin toward the opposite
//                   corner (so with ≥1 branch the crack runs right through the start point), #1/#2 from the main
//                   bolt / #0 toward the two remaining corners, #3+ off to the edges; every line has short twigs and
//                   the start point has a little impact star. At g = 1 every corner is reached (branches ≥ 3).
//                   setGrowth(g) shows the nearest of `stages` (default 8) precomputed stages:
//                   k = round(g·stages), g ≈ 0 → hidden. Stage textures are drawn lazily on first use and cached
//                   across instances (same options → same textures). Default schedule (stages 8, branches 4):
//                     g 0.125 / 0.25 / 0.375 → main bolt 1/3, 2/3, complete (no branches yet)
//                     g 0.5 → branch #0 ~85 %;  0.625 → #0 done, #1 ~70 %;  0.75 → #1 done, #2 ~55 %;
//                     0.875 → #2 done, #3 ~40 %;  1.0 → everything, all four corners reached.
//                   → for "a new branch per HUSS": 0.375 on 'cracked', then 0.625 / 0.875 / 1.0 on HUSS 1/2/3.
//                   Returns { root, setGrowth, mesh, stages, stage (current k), schedule ({ main:[t0,t1],
//                   branches:[[t0,t1],…] } in g units), bounds, prewarm(renderer) }.
//                   Other opts: res=1024 (texture px on the longest side), width=1 (line-width multiplier),
//                   color='#1b1714'. Scaling: line widths and zig-zag size scale with min(w,h), so for the statue
//                   face either pass a small w/h (e.g. { w:0.3, h:0.26, branches:1 } = ONE crack straight across)
//                   or scale root. Branch count 1 gives main + opposite branch = one line through the start.
// makeTrophy        gold cup trophy 0.32 tall: square two-tier base (0.14 × 0.14, 0.075 tall) with a dark plaque
//                   (gold "CHAMPION") on its +Z face, stem with a knob, bowl (rim Ø0.16 at y 0.32), two loop
//                   handles on ±X (total width 0.25). Origin = base bottom centre. { stone: true } = identical shape
//                   in rough stone grey #9a9a9a (plaque a darker grey with carved lettering) for the statue.
//                   root.userData.grip = Object3D at the stem knob (y 0.122): for a character hand,
//                   trophy.position.copy(grip.position).negate() inside joints.handR (hands are 0.14 cubes, so
//                   consider scale 1.3–1.5 for a hero shot). userData.height = 0.32.
// makePhotoCamera   old press camera on a wooden tripod, ~1.44 m tall (flash reflector top). Origin = floor centre
//                   under the tripod head; lens points +Z (the photographer stands at about z = −0.45, between the
//                   two rear legs; front leg points +Z). Body 0.30 × 0.20 × 0.18 (y 1.035..1.235), lens Ø0.16
//                   reaching z = 0.21, flash reflector Ø0.15 on top (+X side) facing +Z.
//                   root.userData.flash = Object3D at the bulb centre (≈ (0.085, 1.355, 0.03)).
//                   root.userData.setFlash(k): k 0..1 makes the bulb glow (emissive, not tone-mapped down) — pure;
//                   the bulb material is per-camera. root.userData.lens = Object3D at the lens front centre.
// makeCushions      two stacked red velvet cushions (#a01830, sheen), each 0.42 × ~0.1 × 0.42 (puffy centre, thinner
//                   pinched corners, gold piping, gold tassel cubes at the 4 corners, gold centre button); the top one
//                   is yawed 0.17 rad. Origin = bottom centre. root.userData.top = 0.196 = y of the top surface
//                   centre (put the cat's root there). root.userData.setSquash(k): k > 0 squashes the stack (k=1 →
//                   ~20 % flatter, a little wider), k < 0 stretches; returns the new top y. Pure.
//                   root.userData.bounce(u, amount=1): convenience damped wobble for a table slam, u = seconds
//                   since the hit (0 → squashed, settles by ~0.6 s); returns the top y (move the cat with it).
// makeTrafficCone   orange cone 0.5 tall (base Ø0.27, rounded tip) with a white band (y 0.27–0.355) on a black
//                   square base 0.36 × 0.035 × 0.36. Origin = bottom centre. root.userData.tip = Object3D at the tip
//                   top (y 0.5); a makePartyHat (brim radius 0.105) at scale 0.45 sits at about y 0.44
//                   (root.userData.hatY = 0.44, hatScale = 0.45).
// makeSign          hand-painted board (w × h × 0.018, painted `color`, darker painted border, lines in bold ink
//                   with a slight hand-lettered wobble, auto-fitted) nailed to a 0.032 × 0.022 wooden stake. Board
//                   bottom at y = 0.5 (stick), so the top is at 0.5 + h; the stake's pointed bottom is the origin.
//                   Text faces +Z. Extra opts: ink (colour or array per line; default alternates red / navy),
//                   stick=0.5 (visible stick length below the board), seed=1 (lettering wobble).
//                   root.userData.board = Object3D at the board centre front.
// makeBriefcase     brown leather briefcase, body 0.42 (X) × 0.275 (Y) × 0.10 (Z) + handle (top at y 0.326), two
//                   gold clasps on the +Z face, standing on 4 gold studs. Origin = bottom centre.
//                   root.userData.handle = Object3D at the handle grip centre (for a hand).
// makeSack          lumpy beige burlap sack 0.45 tall, ~0.39 wide, gathered + tied neck (rope) at the top (+Y).
//                   Origin = the bounding-box centre (y −0.225..+0.225). root.userData.neck = Object3D at the tie
//                   (y ≈ +0.13) — for over-the-shoulder carrying, put the neck at the hand / shoulder and rotate the
//                   sack (e.g. rotation.x ≈ 2.4 so the body hangs behind the back).
// makePlinth        low stone plinth: base course w × 0.06 × d, inset body, top slab (w−0.02) × 0.05 × (d−0.02),
//                   small bevels, speckled warm stone (#aeaaa1, box-projected texture so close-ups don't stretch).
//                   Bronze plaque with raised serif letters on the +Z face of the body. Origin = bottom centre;
//                   root.userData.top = h; root.userData.plaque = Object3D at the plaque's front centre (camera
//                   push-in target). Extra opts: stone (colour), plaqueW (default min(0.62·w, 0.6)).
//                   plaque may contain '\n' for two lines.
//
// Metals / gloss (toaster chrome, trophy gold, camera chrome, plaque bronze, gold piping) use the same tiny built-in
// studio reflection map approach as props2 (there is no scene environment in this project, and metalness ≥ 0.6
// would otherwise render nearly black).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, clamp, lerp, noise1, canvasTexture, mat } from '../lib/util.js';

const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const FONT = '"Inter", "DejaVu Sans", "Liberation Sans", Arial, sans-serif';
const SERIF = '"DejaVu Serif", "Liberation Serif", Georgia, serif';
export const STONE_GREY = '#9a9a9a';

// ════════════════════════════════════════════════════════════════════════════════ small helpers
/** Lathe with per-point crease control. pts: [[r, y, hard?], ...] bottom → top. u = around (0 at +Z), v = arc length. */
function lathe(pts, segs = 32) {
  const P = [];
  for (const p of pts) {
    const q = { r: Math.max(0, p[0]), y: p[1], hard: !!p[2] };
    const l = P[P.length - 1];
    if (l && Math.abs(l.r - q.r) < 1e-7 && Math.abs(l.y - q.y) < 1e-7) continue;
    P.push(q);
  }
  const n = P.length, segN = [], segL = [];
  for (let i = 0; i < n - 1; i++) {
    const dr = P[i + 1].r - P[i].r, dy = P[i + 1].y - P[i].y, L = Math.hypot(dr, dy);
    segN.push([dy / L, -dr / L]); segL.push(L);
  }
  const vAt = [0];
  for (let i = 0; i < n - 1; i++) vAt.push(vAt[i] + segL[i]);
  const tot = vAt[n - 1];
  const avg = (a, b) => { const x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const pos = [], nor = [], uv = [];
  for (let i = 0; i < n - 1; i++) {
    const a = P[i], b = P[i + 1];
    const na = (a.hard || i === 0) ? segN[i] : avg(segN[i - 1], segN[i]);
    const nb = (b.hard || i + 1 === n - 1) ? segN[i] : avg(segN[i], segN[i + 1]);
    const va = vAt[i] / tot, vb = vAt[i + 1] / tot;
    for (let j = 0; j < segs; j++) {
      const t0 = (j / segs) * TAU, t1 = ((j + 1) / segs) * TAU;
      const s0 = Math.sin(t0), c0 = Math.cos(t0), s1 = Math.sin(t1), c1 = Math.cos(t1);
      const A = [a.r * s0, a.y, a.r * c0], B = [a.r * s1, a.y, a.r * c1];
      const C = [b.r * s1, b.y, b.r * c1], D = [b.r * s0, b.y, b.r * c0];
      const nA = [na[0] * s0, na[1], na[0] * c0], nB = [na[0] * s1, na[1], na[0] * c1];
      const nC = [nb[0] * s1, nb[1], nb[0] * c1], nD = [nb[0] * s0, nb[1], nb[0] * c0];
      const u0 = j / segs, u1 = (j + 1) / segs;
      if (a.r > 1e-6) { pos.push(...A, ...B, ...C); nor.push(...nA, ...nB, ...nC); uv.push(u0, va, u1, va, u1, vb); }
      if (b.r > 1e-6) { pos.push(...A, ...C, ...D); nor.push(...nA, ...nC, ...nD); uv.push(u0, va, u1, vb, u0, vb); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
/** Clone + transform a geometry. */
function xf(g, p = [0, 0, 0], r = [0, 0, 0], sc = 1) {
  const s3 = Array.isArray(sc) ? sc : [sc, sc, sc];
  _m4.compose(new V3(...p), _q.setFromEuler(_e.set(r[0], r[1], r[2])), new V3(...s3));
  return g.clone().applyMatrix4(_m4);
}
function prep(g) {
  const h = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(h.attributes)) if (!['position', 'normal', 'uv'].includes(k)) h.deleteAttribute(k);
  if (!h.attributes.uv) h.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(h.attributes.position.count * 2), 2));
  h.clearGroups();
  return h;
}
function merge(list) { return mergeGeometries(list.map(prep), false); }

/** Cylinder from point a to point b. */
function rod(a, b, r, seg = 8, caps = true) {
  const A = new V3(...a), B = new V3(...b);
  const dir = B.clone().sub(A); const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, !caps);
  _m4.compose(A.clone().add(B).multiplyScalar(0.5), _q.setFromUnitVectors(new V3(0, 1, 0), dir.normalize()), new V3(1, 1, 1));
  return g.applyMatrix4(_m4);
}
/** Rounded box from point a to point b (cross-section w × d). */
function beam(a, b, w, d, r = 0.006) {
  const A = new V3(...a), B = new V3(...b);
  const dir = B.clone().sub(A); const len = dir.length();
  const g = softBox(w, len, d, r, 2).clone();
  _m4.compose(A.clone().add(B).multiplyScalar(0.5), _q.setFromUnitVectors(new V3(0, 1, 0), dir.normalize()), new V3(1, 1, 1));
  return g.applyMatrix4(_m4);
}

function mesh(geo, material, p, r, sc) {
  const m = new THREE.Mesh(geo, material);
  if (p) m.position.set(p[0], p[1], p[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  if (sc != null) { if (Array.isArray(sc)) m.scale.set(sc[0], sc[1], sc[2]); else m.scale.setScalar(sc); }
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, clamp(hsl.l + amt * (amt < 0 ? hsl.l : 1 - hsl.l), 0, 1));
  return '#' + c.getHexString();
}

const _geo = new Map();
const G = (key, fn) => { let g = _geo.get(key); if (!g) { g = fn(); _geo.set(key, g); } return g; };

/** Cached RoundedBoxGeometry with an ABSOLUTE corner radius (util.rbox scales radii by BLOCKY; this one doesn't). */
function softBox(w, h, d, r = 0.01, seg = 3) {
  return G(`sb|${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}|${r.toFixed(4)}|${seg}`, () =>
    new RoundedBoxGeometry(w, h, d, seg, Math.max(0.0005, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4))));
}
/** Box-projected UVs (tile = metres per texture repeat), so a tiling texture keeps its scale on every face. */
function boxUV(geo, tile, off = [0, 0, 0]) {
  const g = geo.clone();
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + off[0], y = p.getY(i) + off[1], z = p.getZ(i) + off[2];
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ax >= ay && ax >= az) uv.setXY(i, z / tile, y / tile);
    else if (ay >= az) uv.setXY(i, x / tile, z / tile);
    else uv.setXY(i, x / tile, y / tile);
  }
  uv.needsUpdate = true;
  return g;
}
/** Smooth normals across duplicated vertices (UV seams) by position. */
function smoothNormals(g) {
  const p = g.attributes.position;
  const idx = g.index ? g.index.array : null;
  const n = p.count, acc = new Map(), keys = new Array(n);
  for (let i = 0; i < n; i++) keys[i] = `${Math.round(p.getX(i) * 1e5)},${Math.round(p.getY(i) * 1e5)},${Math.round(p.getZ(i) * 1e5)}`;
  const tri = idx ? idx.length / 3 : n / 3;
  const a = new V3(), b = new V3(), c = new V3(), e1 = new V3(), e2 = new V3();
  for (let t = 0; t < tri; t++) {
    const i0 = idx ? idx[t * 3] : t * 3, i1 = idx ? idx[t * 3 + 1] : t * 3 + 1, i2 = idx ? idx[t * 3 + 2] : t * 3 + 2;
    a.fromBufferAttribute(p, i0); b.fromBufferAttribute(p, i1); c.fromBufferAttribute(p, i2);
    e1.subVectors(b, a); e2.subVectors(c, a); e1.cross(e2);          // area-weighted
    for (const i of [i0, i1, i2]) { let v = acc.get(keys[i]); if (!v) { v = new V3(); acc.set(keys[i], v); } v.add(e1); }
  }
  const nor = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const v = acc.get(keys[i]).clone().normalize(); nor[i * 3] = v.x; nor[i * 3 + 1] = v.y; nor[i * 3 + 2] = v.z; }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}

// ════════════════════════════════════════════════════════════════════════════════ reflections
let _env = null;
/** Tiny equirect "photo studio" (bright top, softboxes, dark floor) so metals read as metal. */
function studioEnv() {
  if (_env) return _env;
  _env = canvasTexture(256, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#f4f7fb'); gr.addColorStop(0.3, '#d5deea'); gr.addColorStop(0.47, '#8e98a8');
    gr.addColorStop(0.5, '#6d675f'); gr.addColorStop(0.6, '#8f867b'); gr.addColorStop(1, '#4a443d');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(28,32,42,0.8)';
    for (const [x, ww] of [[0.3, 0.1], [0.62, 0.08], [0.9, 0.07]]) g.fillRect(x * w, 0.16 * h, ww * w, 0.3 * h);
    g.fillStyle = '#ffffff';
    for (const [x, y, ww, hh] of [[0.08, 0.1, 0.1, 0.2], [0.45, 0.06, 0.12, 0.14], [0.76, 0.18, 0.06, 0.16]]) g.fillRect(x * w, y * h, ww * w, hh * h);
  });
  _env.mapping = THREE.EquirectangularReflectionMapping;
  return _env;
}
const _envMats = [];
const _envMatCache = new Map();
let _envK = 1;
/** Cached MeshStandardMaterial with the studio reflection map. */
function envMat(color, opts = {}, envI = 1) {
  const key = String(color) + JSON.stringify(opts) + envI;
  let m = _envMatCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0, ...opts, envMap: studioEnv(), envMapIntensity: envI * _envK });
    _envMatCache.set(key, m); _envMats.push({ m, base: envI });
  }
  return m;
}
/** Register an uncached material for setProps3EnvIntensity. */
function trackEnv(m, base) { m.envMap = studioEnv(); m.envMapIntensity = base * _envK; _envMats.push({ m, base }); return m; }
export function setProps3EnvIntensity(k = 1) {
  _envK = k;
  for (const { m, base } of _envMats) m.envMapIntensity = base * k;
}
const chrome = () => envMat('#e9edf2', { metalness: 0.92, roughness: 0.18 }, 1);
const gold = () => envMat('#e8b23a', { metalness: 0.9, roughness: 0.24 }, 1.1);
const brass = () => envMat('#d9a441', { metalness: 0.85, roughness: 0.3 }, 1.0);

// ════════════════════════════════════════════════════════════════════════════════ 1. toaster
const TST = { W: 0.26, H: 0.17, D: 0.15, foot: 0.012, slotZ: 0.0225, slotTop: 0.1742, toastH: 0.1226 };
const TOAST_REST = new V3(0, TST.slotTop + 0.018 - TST.toastH, TST.slotZ);   // y = 0.0696

function breadPath(ctx, X, Y) {
  // same outline as the toast extrusion (metres → canvas via X/Y)
  ctx.beginPath();
  ctx.moveTo(X(-0.039), Y(0)); ctx.lineTo(X(0.039), Y(0));
  ctx.quadraticCurveTo(X(0.048), Y(0), X(0.048), Y(0.009));
  ctx.lineTo(X(0.048), Y(0.078));
  ctx.bezierCurveTo(X(0.057), Y(0.083), X(0.058), Y(0.103), X(0.044), Y(0.111));
  ctx.bezierCurveTo(X(0.028), Y(0.119), X(-0.028), Y(0.119), X(-0.044), Y(0.111));
  ctx.bezierCurveTo(X(-0.058), Y(0.103), X(-0.057), Y(0.083), X(-0.048), Y(0.078));
  ctx.lineTo(X(-0.048), Y(0.009));
  ctx.quadraticCurveTo(X(-0.048), Y(0), X(-0.039), Y(0));
  ctx.closePath();
}
function toastGeo() {
  return G('toast', () => {
    const s = new THREE.Shape();
    s.moveTo(-0.039, 0); s.lineTo(0.039, 0);
    s.quadraticCurveTo(0.048, 0, 0.048, 0.009);
    s.lineTo(0.048, 0.078);
    s.bezierCurveTo(0.057, 0.083, 0.058, 0.103, 0.044, 0.111);
    s.bezierCurveTo(0.028, 0.119, -0.028, 0.119, -0.044, 0.111);
    s.bezierCurveTo(-0.058, 0.103, -0.057, 0.083, -0.048, 0.078);
    s.lineTo(-0.048, 0.009);
    s.quadraticCurveTo(-0.048, 0, -0.039, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.0028, bevelSegments: 2, curveSegments: 10 });
    g.translate(0, 0.0028, -0.007);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 0.0625) / 0.125, (p.getY(i) - 0.0028) / 0.125);
    return g;          // groups: 0 = the two faces, 1 = crust sides
  });
}
let _toastMats = null;
function toastMats() {
  if (_toastMats) return _toastMats;
  const tex = canvasTexture(256, 256, (g, w, h) => {
    const k = w / 0.125, X = (x) => (x + 0.0625) * k, Y = (y) => h - y * k;
    g.fillStyle = '#7d4519'; g.fillRect(0, 0, w, h);
    const gr = g.createRadialGradient(X(0), Y(0.06), 4, X(0), Y(0.06), 0.07 * k);
    gr.addColorStop(0, '#f3c77c'); gr.addColorStop(0.55, '#e7aa58'); gr.addColorStop(1, '#c97f35');
    breadPath(g, X, Y); g.fillStyle = gr; g.fill();
    const r = rng(77);
    for (let i = 0; i < 90; i++) {                      // toasted speckles / crumb holes
      g.fillStyle = r() < 0.5 ? 'rgba(150,84,30,0.28)' : 'rgba(255,236,190,0.22)';
      g.beginPath(); g.ellipse(X((r() - 0.5) * 0.09), Y(0.01 + r() * 0.1), 1 + r() * 3, 1 + r() * 2, r() * 3, 0, TAU); g.fill();
    }
    breadPath(g, X, Y); g.lineJoin = 'round';
    g.strokeStyle = '#9a5622'; g.lineWidth = 0.013 * k; g.stroke();           // crust band
    g.strokeStyle = '#6e3a14'; g.lineWidth = 0.004 * k; g.stroke();            // dark rim
  });
  _toastMats = [
    new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.85 }),
    mat('#8a4c1f', { roughness: 0.85 }),
  ];
  return _toastMats;
}
function toasterGeos() {
  return G('toaster', () => {
    const { W, H, D, foot } = TST;
    const bodyH = H - foot;
    const body = xf(softBox(W, bodyH, D, 0.028, 4), [0, foot + bodyH / 2, 0]);
    // light chrome bits: top bezel + two decorative front lines
    const light = merge([
      xf(softBox(0.19, 0.006, 0.085, 0.0028, 2), [0, H + 0.0005, 0]),
      xf(softBox(0.17, 0.0035, 0.003, 0.0012, 1), [-0.01, 0.128, D / 2 + 0.0004]),
      xf(softBox(0.17, 0.0035, 0.003, 0.0012, 1), [-0.01, 0.116, D / 2 + 0.0004]),
    ]);
    const dark = [];
    for (const z of [TST.slotZ, -TST.slotZ]) dark.push(xf(softBox(0.165, 0.03, 0.024, 0.005, 2), [0, TST.slotTop - 0.015, z]));
    dark.push(xf(softBox(0.004, 0.105, 0.016, 0.0018, 1), [W / 2 + 0.0003, 0.095, 0]));               // lever groove
    for (const x of [-0.1, 0.1]) for (const z of [-0.052, 0.052]) dark.push(xf(softBox(0.026, 0.014, 0.026, 0.005, 2), [x, 0.007, z]));
    dark.push(xf(new THREE.CylinderGeometry(0.0165, 0.0175, 0.011, 20), [0.085, 0.054, D / 2 + 0.004], [Math.PI / 2, 0, 0]));   // dial
    const trim = xf(softBox(W + 0.005, 0.017, D + 0.005, 0.006, 2), [0, 0.0245, 0]);
    const tick = xf(softBox(0.0034, 0.012, 0.002, 0.0008, 1), [0.085, 0.06, D / 2 + 0.0098]);
    const leverStem = xf(softBox(0.022, 0.008, 0.008, 0.002, 1), [W / 2 + 0.011, 0, 0]);
    const leverKnob = xf(softBox(0.032, 0.021, 0.036, 0.008, 2), [W / 2 + 0.029, 0, 0]);
    return { body, light, dark: merge(dark), trim, tick, lever: merge([leverStem, leverKnob]) };
  });
}
const toasterChrome = () => envMat('#c9ccd2', { metalness: 0.62, roughness: 0.26 }, 1.0);

export function makeToaster(opts = {}) {
  const A = toasterGeos();
  const root = new THREE.Group(); root.name = 'Toaster';
  const inner = new THREE.Group(); inner.name = 'toasterBody'; root.add(inner);
  inner.add(mesh(A.body, toasterChrome()));
  inner.add(mesh(A.light, envMat('#e3e6ea', { metalness: 0.75, roughness: 0.18 }, 1.1)));
  inner.add(mesh(A.dark, envMat('#141518', { roughness: 0.5 }, 0.25)));
  inner.add(mesh(A.trim, envMat('#2a2b31', { roughness: 0.45 }, 0.3)));
  const tickM = mesh(A.tick, mat('#f4f4f4', { roughness: 0.5 })); tickM.castShadow = false; inner.add(tickM);
  const lever = new THREE.Group(); lever.name = 'lever'; inner.add(lever);
  lever.add(mesh(A.lever, envMat('#17181c', { roughness: 0.32 }, 0.45)));
  const LEVER_DOWN = 0.058, LEVER_UP = 0.136;
  const setLever = (u) => { lever.position.y = lerp(LEVER_DOWN, LEVER_UP, clamp(u, 0, 1)); };
  setLever(opts.lever ?? 0);
  const sweatSpot = new THREE.Object3D(); sweatSpot.name = 'sweatSpot'; sweatSpot.position.set(0.085, 0.14, TST.D / 2 + 0.001); inner.add(sweatSpot);

  const toast = new THREE.Group(); toast.name = 'toast';
  toast.position.copy(TOAST_REST);
  const pivot = new THREE.Group(); pivot.name = 'toastPivot'; toast.add(pivot);
  pivot.add(mesh(toastGeo(), toastMats()));
  toast.userData.restY = TOAST_REST.y; toast.userData.height = TST.toastH;
  root.add(toast);

  const _p = new V3();
  function setTremble(t, amount = 0.01) {
    const a = amount || 0;
    if (a === 0) { inner.position.set(0, 0, 0); inner.rotation.set(0, 0, 0); pivot.position.set(0, 0, 0); pivot.rotation.set(0, 0, 0); return; }
    const rx = a * 1.5 * noise1(t * 33 + 11.7, 4), rz = a * 2.0 * noise1(t * 27 + 5.5, 5), ry = a * 1.2 * noise1(t * 23 + 2.9, 6);
    inner.rotation.set(rx, ry, rz);
    inner.position.set(a * noise1(t * 31, 1), a * 0.3 * Math.abs(noise1(t * 37 + 3.1, 3)) + Math.abs(rz) * TST.W / 2 + Math.abs(rx) * TST.D / 2, a * 0.8 * noise1(t * 29 + 7.3, 2));
    inner.updateMatrix();
    // toast pivot = the body's jitter as seen from the toast's rest position (rigid while it sits in the slot)
    _p.copy(TOAST_REST).applyMatrix4(inner.matrix).sub(TOAST_REST);
    pivot.position.copy(_p); pivot.quaternion.copy(inner.quaternion);
  }
  setTremble(0, 0);
  root.userData.inner = inner;
  root.userData.sweatSpot = sweatSpot;
  return { root, setTremble, toast, inner, setLever, toastRestY: TOAST_REST.y, slotTopY: TST.slotTop, sweatSpot, size: { w: TST.W, h: TST.H, d: TST.D } };
}

// ════════════════════════════════════════════════════════════════════════════════ 2. crack decal
export function crackStage(g, stages = 8) { return clamp(Math.round((Number.isFinite(g) ? g : 0) * stages), 0, stages); }

const _crackData = new Map();
function zigzag(r, A, B, seg, amp) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1e-6;
  const n = Math.max(2, Math.round(L / seg));
  const px = -dy / L, py = dx / L;
  const pts = [[A[0], A[1]]];
  let side = r() < 0.5 ? 1 : -1;
  for (let i = 1; i < n; i++) {
    const u = (i + (r() - 0.5) * 0.5) / n;
    const off = side * amp * (0.35 + 0.65 * r());
    side = r() < 0.82 ? -side : side;
    pts.push([A[0] + dx * u + px * off, A[1] + dy * u + py * off]);
  }
  pts.push([B[0], B[1]]);
  return pts;
}
function polyInfo(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return cum;
}
function pointAt(L, f) {
  const s = f * L.len;
  for (let i = 1; i < L.pts.length; i++) if (L.cum[i] >= s) {
    const u = (s - L.cum[i - 1]) / Math.max(1e-9, L.cum[i] - L.cum[i - 1]);
    const a = L.pts[i - 1], b = L.pts[i];
    return { p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], dir: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  const a = L.pts[L.pts.length - 2], b = L.pts[L.pts.length - 1];
  return { p: b.slice(), dir: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}
function crackData(o) {
  const key = JSON.stringify(o);
  let D = _crackData.get(key);
  if (D) return D;
  const { w, h, seed, sx, sy, branches: B, width: wk } = o;
  const r = rng(seed * 977 + 13);
  const S = Math.min(w, h);
  const x0 = -sx * w, x1 = (1 - sx) * w, y0 = -sy * h, y1 = (1 - sy) * h;
  const ins = 0.012 * S;
  const bx0 = x0 + ins, bx1 = x1 - ins, by0 = y0 + ins, by1 = y1 - ins;
  const inside = (p) => [clamp(p[0], bx0, bx1), clamp(p[1], by0, by1)];
  const corners = [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]];
  const seg = 0.075 * S, amp = 0.042 * S;
  const lines = [];
  const add = (A, Bp, w0, w1, t0, t1, opts = {}) => {
    const pts = zigzag(r, A, Bp, opts.seg ?? seg, opts.amp ?? amp).map(inside);
    const cum = polyInfo(pts);
    const L = { pts, cum, len: cum[cum.length - 1], w0: w0 * wk, w1: w1 * wk, t0, t1, cap: !!opts.cap };
    lines.push(L);
    return L;
  };
  const widthAt = (L, f) => lerp(L.w0, L.w1, f) / wk;
  const ray = (P, ang) => {
    const dx = Math.cos(ang), dy = Math.sin(ang); let t = Infinity;
    if (dx > 1e-6) t = Math.min(t, (bx1 - P[0]) / dx); if (dx < -1e-6) t = Math.min(t, (bx0 - P[0]) / dx);
    if (dy > 1e-6) t = Math.min(t, (by1 - P[1]) / dy); if (dy < -1e-6) t = Math.min(t, (by0 - P[1]) / dy);
    return [P[0] + dx * t, P[1] + dy * t];
  };
  // ── main bolt: origin → farthest corner
  const dist = corners.map((c) => Math.hypot(c[0], c[1]));
  const mi = dist.indexOf(Math.max(...dist));
  const gm = B > 0 ? 0.375 : 1;
  const main = add([0, 0], corners[mi], 0.016 * S, 0.0032 * S, 0, gm, { cap: true });
  const mdir = [corners[mi][0] / dist[mi], corners[mi][1] / dist[mi]];
  // ── branches
  const rest = corners.filter((_, i) => i !== mi).map((c) => ({ c, d: (c[0] * mdir[0] + c[1] * mdir[1]) / Math.hypot(c[0], c[1]) })).sort((a, b) => a.d - b.d);
  const span = B > 0 ? (1 - gm) / B : 0;
  const win = (i) => [Math.max(gm - 0.035, gm + span * (i - 0.3)), gm + span * (i + 1)];
  const brs = [];
  for (let i = 0; i < B; i++) {
    const [t0, t1] = win(i);
    let L;
    if (i === 0) {
      L = add([0, 0], rest[0].c, 0.0105 * S, 0.0026 * S, t0, t1);
    } else if (i <= 2 && rest[i]) {
      const tgt = rest[i].c;
      const cands = [main, brs[0]].filter(Boolean);
      const tdir = Math.atan2(tgt[1], tgt[0]);
      let best = cands[0], bd = -2;
      for (const c of cands) { const e = c.pts[c.pts.length - 1]; const d = Math.cos(Math.atan2(e[1], e[0]) - tdir); if (d > bd) { bd = d; best = c; } }
      const f = (i === 1 ? 0.12 : 0.22) + 0.18 * r();
      const at = pointAt(best, f);
      L = add(at.p, tgt, widthAt(best, f) * 0.62, 0.0024 * S, t0, t1);
    } else {
      const parent = i % 2 ? main : (brs[1] || main);
      const f = 0.45 + 0.25 * r();
      const at = pointAt(parent, f);
      const used = lines.map((l) => l.pts[l.pts.length - 1]);
      let best = null, bd = -1;
      for (const sg of [1, -1]) {
        const end = ray(at.p, at.dir + sg * (0.75 + 0.35 * r()));
        const d = Math.min(...used.map((u) => Math.hypot(u[0] - end[0], u[1] - end[1])));
        if (d > bd) { bd = d; best = end; }
      }
      L = add(at.p, best, widthAt(parent, f) * 0.6, 0.0022 * S, t0, t1);
    }
    brs.push(L);
  }
  // ── twigs on every line (appear when their parent passes the attach point)
  const big = lines.slice();
  for (const P of big) {
    const n = (P === main ? 3 : 2) + (r() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const f = 0.15 + 0.7 * r();
      const at = pointAt(P, f);
      const ang = at.dir + (r() < 0.5 ? 1 : -1) * (0.55 + 0.55 * r());
      const len = (0.035 + 0.075 * r()) * S;
      const end = inside([at.p[0] + Math.cos(ang) * len, at.p[1] + Math.sin(ang) * len]);
      const t0 = P.t0 + f * (P.t1 - P.t0);
      add(at.p, end, Math.max(0.0035 * S, widthAt(P, f) * 0.5), 0.0011 * S, t0, Math.min(1, t0 + 0.07), { seg: 0.03 * S, amp: 0.012 * S });
    }
  }
  // ── impact star at the start point
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * TAU + r() * 0.8;
    const len = (0.012 + 0.022 * r()) * S;
    add([0, 0], [Math.cos(ang) * len, Math.sin(ang) * len], 0.005 * S, 0.0012 * S, 0, 0.06, { seg: 0.012 * S, amp: 0.004 * S });
  }
  D = { lines, bounds: { x0, x1, y0, y1 }, schedule: { main: [0, gm], branches: brs.map((b) => [b.t0, b.t1]) }, S };
  _crackData.set(key, D);
  return D;
}
function drawCrackLine(g, L, f, P, px, pass, tip) {
  // P: metres → px mapper; px = pixels per metre
  const sEnd = f * L.len;
  const pts = [], ss = [];
  for (let i = 0; i < L.pts.length; i++) {
    if (L.cum[i] <= sEnd + 1e-9) { pts.push(P(L.pts[i])); ss.push(L.cum[i]); continue; }
    const u = (sEnd - L.cum[i - 1]) / Math.max(1e-9, L.cum[i] - L.cum[i - 1]);
    const a = L.pts[i - 1], b = L.pts[i];
    pts.push(P([lerp(a[0], b[0], u), lerp(a[1], b[1], u)])); ss.push(sEnd);
    break;
  }
  if (pts.length < 2) return;
  const n = pts.length;
  const hw = ss.map((s, i) => {
    let w = 0.5 * lerp(L.w0, L.w1, s / L.len) * px;
    if (f < 1) w *= clamp((sEnd - s) / tip, 0.12, 1);     // growing front tapers to a point
    if (i === n - 1) w = Math.min(w, 0.35);
    return pass === 0 ? w * 2.3 + 1.1 : w;
  });
  const nrm = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dy) || 1;
    nrm.push([-dy / l, dx / l]);
  }
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    let nx, ny, k = 1;
    if (i === 0) [nx, ny] = nrm[0];
    else if (i === n - 1) [nx, ny] = nrm[n - 2];
    else {
      const a = nrm[i - 1], b = nrm[i];
      nx = a[0] + b[0]; ny = a[1] + b[1]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      k = Math.min(2.2, 1 / Math.max(0.2, nx * a[0] + ny * a[1]));
    }
    left.push([pts[i][0] + nx * hw[i] * k, pts[i][1] + ny * hw[i] * k]);
    right.push([pts[i][0] - nx * hw[i] * k, pts[i][1] - ny * hw[i] * k]);
  }
  g.beginPath();
  g.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) g.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
  g.closePath(); g.fill();
  if (L.cap) { g.beginPath(); g.arc(pts[0][0], pts[0][1], hw[0] * 1.15, 0, TAU); g.fill(); }
}
const crackDataKey = (o) => ({ w: o.w, h: o.h, seed: o.seed, sx: o.sx, sy: o.sy, branches: o.branches, width: o.width });
const _crackMat = new Map();
let _crackHidden = null;
function crackMaterial(o, k) {
  const key = JSON.stringify(o) + '|' + k;
  let m = _crackMat.get(key);
  if (m) return m;
  const D = crackData(crackDataKey(o));
  const { w, h, res, stages, color } = o;
  const cw = w >= h ? res : Math.max(8, Math.round(res * w / h));
  const ch = h >= w ? res : Math.max(8, Math.round(res * h / w));
  const px = cw / w;
  const { x0, y1 } = D.bounds;
  const P = (p) => [(p[0] - x0) * px, (y1 - p[1]) * px];
  const g = k / stages;
  const c = new THREE.Color(color);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  const tex = canvasTexture(cw, ch, (ctx) => {
    ctx.clearRect(0, 0, cw, ch);
    const tip = 0.05 * D.S * px;
    for (const pass of [0, 1]) {
      ctx.fillStyle = pass === 0 ? `rgba(${rgb},0.2)` : `rgb(${rgb})`;
      for (const L of D.lines) {
        const f = clamp((g - L.t0) / Math.max(1e-6, L.t1 - L.t0), 0, 1);
        if (f > 0) drawCrackLine(ctx, L, f, P, px, pass, tip);
      }
    }
  });
  m = new THREE.MeshBasicMaterial({ color: '#ffffff', map: tex, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  m.name = `crack ${key}`;
  _crackMat.set(key, m);
  return m;
}

export function makeCrack(opts = {}) {
  const { w = 1.2, h = 1.0, seed = 1, start = [0.42, 0.58], branches = 4, stages = 8, res = 1024, width = 1, color = '#1b1714' } = opts;
  const o = { w, h, seed, sx: clamp(start[0], 0, 1), sy: clamp(start[1], 0, 1), branches: clamp(Math.round(branches), 0, 6), width, res: Math.round(res), stages: Math.max(1, Math.round(stages)), color };
  const D = crackData({ w, h, seed, sx: o.sx, sy: o.sy, branches: o.branches, width });
  const geo = G(`crackPlane|${w}|${h}|${o.sx}|${o.sy}`, () => new THREE.PlaneGeometry(w, h).translate(w * (0.5 - o.sx), h * (0.5 - o.sy), 0));
  const root = new THREE.Group(); root.name = 'Crack';
  const m = new THREE.Mesh(geo, crackMaterial(o, o.stages));
  m.castShadow = false; m.receiveShadow = false; m.renderOrder = 2; m.name = 'crackDecal';
  root.add(m);
  const dataKey = { w, h, seed, sx: o.sx, sy: o.sy, branches: o.branches, width };
  const crack = {
    root, mesh: m, stages: o.stages, stage: -1, bounds: { ...D.bounds }, schedule: D.schedule,
    setGrowth(gr) {
      const k = crackStage(gr, o.stages);
      if (k === crack.stage) return k;
      crack.stage = k;
      m.visible = k > 0;
      if (k > 0) m.material = crackMaterial({ ...o, ...dataKey }, k);
      return k;
    },
    prewarm(renderer) { for (let k = 1; k <= o.stages; k++) renderer.initTexture(crackMaterial({ ...o, ...dataKey }, k).map); },
  };
  root.userData.bounds = crack.bounds;
  crack.setGrowth(opts.growth ?? 1);
  return crack;
}

// ════════════════════════════════════════════════════════════════════════════════ 3. trophy
function trophyGeos() {
  return G('trophy', () => {
    const cup = lathe([
      [0.034, 0.075, 1], [0.032, 0.081], [0.022, 0.088], [0.0155, 0.096], [0.0155, 0.108, 1], [0.024, 0.112], [0.029, 0.118], [0.029, 0.126], [0.024, 0.132], [0.0155, 0.136, 1],
      [0.0125, 0.152], [0.014, 0.165], [0.03, 0.175], [0.05, 0.19], [0.064, 0.212], [0.072, 0.243], [0.0755, 0.28], [0.079, 0.31], [0.0815, 0.318, 1], [0.0795, 0.32, 1],
      [0.0735, 0.3195, 1], [0.071, 0.31], [0.067, 0.278], [0.06, 0.245], [0.046, 0.218], [0.024, 0.203], [0, 0.199],
    ], 40);
    const handles = [];
    for (const sx of [1, -1]) {
      const c = new THREE.CatmullRomCurve3([new V3(0.071 * sx, 0.292, 0), new V3(0.104 * sx, 0.296, 0), new V3(0.122 * sx, 0.27, 0), new V3(0.112 * sx, 0.232, 0), new V3(0.084 * sx, 0.212, 0), new V3(0.058 * sx, 0.2, 0)]);
      handles.push(new THREE.TubeGeometry(c, 24, 0.0072, 10, false));
      for (const t of [0, 1]) handles.push(xf(new THREE.SphereGeometry(0.0085, 10, 8), c.getPoint(t).toArray()));
    }
    const base = merge([
      xf(softBox(0.14, 0.046, 0.14, 0.006, 2), [0, 0.023, 0]),
      xf(softBox(0.108, 0.03, 0.108, 0.005, 2), [0, 0.0605, 0]),
    ]);
    const plaqueBack = xf(softBox(0.098, 0.03, 0.003, 0.0012, 1), [0, 0.023, 0.0705]);
    const plaque = new THREE.PlaneGeometry(0.09, 0.024).translate(0, 0.023, 0.0723);
    return { cup, handles: merge(handles), base, plaqueBack, plaque };
  });
}
const _plaqueTex = new Map();
function trophyPlaqueMat(stone) {
  let m = _plaqueTex.get(stone);
  if (m) return m;
  const tex = canvasTexture(384, 104, (g, w, h) => {
    g.fillStyle = stone ? '#7c7c7c' : '#1d1915'; g.fillRect(0, 0, w, h);
    g.strokeStyle = stone ? '#5f5f5f' : '#e8b23a'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.font = `900 ${Math.round(h * 0.5)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = stone ? '#5a5a5a' : '#f2c14e';
    g.fillText('CHAMPION', w / 2, h * 0.54);
  });
  m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: stone ? 0.92 : 0.4, metalness: 0 });
  if (!stone) trackEnv(m, 0.25);
  _plaqueTex.set(stone, m);
  return m;
}
export function makeTrophy(opts = {}) {
  const { stone = false } = opts;
  const A = trophyGeos();
  const root = new THREE.Group(); root.name = stone ? 'TrophyStone' : 'Trophy';
  const body = stone ? mat(STONE_GREY, { roughness: 0.93 }) : gold();
  root.add(mesh(A.cup, body));
  root.add(mesh(A.handles, body));
  root.add(mesh(A.base, body));
  root.add(mesh(A.plaqueBack, stone ? mat('#7c7c7c', { roughness: 0.93 }) : envMat('#1d1915', { roughness: 0.4 }, 0.25)));
  const pl = mesh(A.plaque, trophyPlaqueMat(stone)); pl.castShadow = false; root.add(pl);
  const grip = new THREE.Object3D(); grip.name = 'grip'; grip.position.set(0, 0.122, 0); root.add(grip);
  root.userData.grip = grip; root.userData.height = 0.32;
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 4. photo camera on tripod
const CAM = { headY: 1.02, bodyY0: 1.035, bodyH: 0.2, bodyW: 0.3, bodyD: 0.18 };
function cameraGeos() {
  return G('photoCam', () => {
    const { headY, bodyY0, bodyH, bodyW, bodyD } = CAM;
    const bc = bodyY0 + bodyH / 2, top = bodyY0 + bodyH, fz = bodyD / 2;
    // tripod: 3 wooden legs (front leg → +Z), brass collars, rubber feet, hub, column, head
    const wood = [], brs = [], rub = [], blk = [], chr = [], glass = [];
    const hubY = 0.9;
    for (let k = 0; k < 3; k++) {
      const ux = Math.sin((k * TAU) / 3), uz = Math.cos((k * TAU) / 3);      // k=0 → front leg along +Z
      const topP = [ux * 0.045, hubY + 0.01, uz * 0.045], footP = [ux * 0.43, 0.025, uz * 0.43];
      const mid = [lerp(topP[0], footP[0], 0.5), lerp(topP[1], footP[1], 0.5), lerp(topP[2], footP[2], 0.5)];
      wood.push(beam(topP, mid, 0.034, 0.024, 0.006));
      wood.push(beam(mid, footP, 0.024, 0.018, 0.005));
      const cP = [lerp(topP[0], footP[0], 0.47), lerp(topP[1], footP[1], 0.47), lerp(topP[2], footP[2], 0.47)];
      const cQ = [lerp(topP[0], footP[0], 0.53), lerp(topP[1], footP[1], 0.53), lerp(topP[2], footP[2], 0.53)];
      brs.push(beam(cP, cQ, 0.042, 0.032, 0.006));
      rub.push(xf(new THREE.CylinderGeometry(0.02, 0.024, 0.03, 12), [footP[0], 0.015, footP[2]]));
      brs.push(xf(new THREE.SphereGeometry(0.012, 10, 8), [topP[0], topP[1], topP[2]]));
    }
    brs.push(xf(new THREE.CylinderGeometry(0.055, 0.06, 0.05, 20), [0, hubY, 0]));
    chr.push(xf(new THREE.CylinderGeometry(0.017, 0.017, headY - hubY, 14), [0, (headY + hubY) / 2, 0]));
    rub.push(xf(new THREE.CylinderGeometry(0.045, 0.05, 0.022, 18), [0, headY + 0.004, 0]));
    rub.push(xf(softBox(0.14, 0.01, 0.12, 0.004, 1), [0, bodyY0 - 0.005, 0]));
    rub.push(xf(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 8), [-0.05, headY - 0.02, -0.07], [-1.1, 0, 0.25]));     // pan handle
    rub.push(xf(new THREE.SphereGeometry(0.013, 10, 8), [-0.065, headY - 0.045, -0.123]));
    // body
    blk.push(xf(softBox(bodyW, bodyH, bodyD, 0.022, 3), [0, bc, 0]));
    chr.push(xf(softBox(bodyW + 0.006, 0.022, bodyD + 0.006, 0.008, 2), [0, top - 0.004, 0]));                 // top plate
    chr.push(xf(softBox(bodyW + 0.006, 0.014, bodyD + 0.006, 0.006, 2), [0, bodyY0 + 0.004, 0]));              // bottom plate
    // lens: barrel + rings + glass
    const lz0 = fz - 0.005;
    blk.push(xf(new THREE.CylinderGeometry(0.068, 0.072, 0.075, 32), [0, bc - 0.005, lz0 + 0.0375], [Math.PI / 2, 0, 0]));
    blk.push(xf(new THREE.CylinderGeometry(0.078, 0.078, 0.045, 32), [0, bc - 0.005, lz0 + 0.095], [Math.PI / 2, 0, 0]));
    chr.push(xf(new THREE.CylinderGeometry(0.0735, 0.0735, 0.012, 32), [0, bc - 0.005, lz0 + 0.068], [Math.PI / 2, 0, 0]));
    chr.push(xf(new THREE.TorusGeometry(0.071, 0.007, 8, 36), [0, bc - 0.005, lz0 + 0.117]));
    chr.push(xf(new THREE.CylinderGeometry(0.079, 0.079, 0.006, 32), [0, bc - 0.005, lz0 + 0.03], [Math.PI / 2, 0, 0]));
    glass.push(xf(new THREE.SphereGeometry(0.064, 28, 12, 0, TAU, 0, 0.55), [0, bc - 0.005, lz0 + 0.087], [Math.PI / 2, 0, 0]));
    // viewfinder (top left) + eyepiece at the back, winding knob, shutter button, strap lugs
    blk.push(xf(softBox(0.09, 0.05, 0.11, 0.01, 2), [-0.075, top + 0.03, -0.005]));
    glass.push(xf(softBox(0.06, 0.03, 0.004, 0.002, 1), [-0.075, top + 0.032, 0.0505]));
    blk.push(xf(new THREE.CylinderGeometry(0.018, 0.02, 0.025, 16), [-0.075, top + 0.032, -0.07], [Math.PI / 2, 0, 0]));
    chr.push(xf(new THREE.CylinderGeometry(0.02, 0.02, 0.018, 18), [0.02, top + 0.016, -0.04]));
    chr.push(xf(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 8), [0.02, top + 0.028, -0.04]));
    for (const sx of [-1, 1]) chr.push(xf(new THREE.TorusGeometry(0.012, 0.003, 6, 14), [sx * (bodyW / 2 + 0.004), top - 0.03, 0], [0, Math.PI / 2, 0]));
    // flash: post + bracket + chrome reflector dish facing +Z
    const fx = 0.085, fy = top + 0.12, fzz = 0.02;
    chr.push(xf(new THREE.CylinderGeometry(0.008, 0.008, 0.075, 10), [fx, top + 0.045, 0]));
    blk.push(xf(softBox(0.04, 0.03, 0.04, 0.008, 2), [fx, top + 0.012, 0]));
    blk.push(xf(softBox(0.026, 0.05, 0.03, 0.006, 2), [fx, fy - 0.045, fzz - 0.02]));
    const dish = lathe([[0, 0, 1], [0.018, 0.002], [0.04, 0.012], [0.058, 0.03], [0.072, 0.052], [0.076, 0.058, 1], [0.074, 0.06, 1], [0.07, 0.054], [0.054, 0.034], [0.036, 0.018], [0.014, 0.006], [0, 0.004]], 32);
    chr.push(xf(dish, [fx, fy, fzz - 0.03], [Math.PI / 2, 0, 0]));
    return { wood: merge(wood), brass: merge(brs), rubber: merge(rub), black: merge(blk), chrome: merge(chr), glass: merge(glass),
      bulb: [fx, fy, fzz + 0.008], lens: [0, bc - 0.005, lz0 + 0.118], top };
  });
}
export function makePhotoCamera() {
  const A = cameraGeos();
  const root = new THREE.Group(); root.name = 'PhotoCamera';
  root.add(mesh(A.wood, mat('#8d5a31', { roughness: 0.62 })));
  root.add(mesh(A.brass, brass()));
  root.add(mesh(A.rubber, mat('#16171a', { roughness: 0.7 })));
  root.add(mesh(A.black, envMat('#1c1c21', { roughness: 0.55 }, 0.35)));
  root.add(mesh(A.chrome, chrome()));
  root.add(mesh(A.glass, envMat('#1a2440', { roughness: 0.06, metalness: 0.3 }, 1.6)));
  const btn = mesh(G('camBtn', () => new THREE.CylinderGeometry(0.009, 0.009, 0.012, 12)), envMat('#d8262b', { roughness: 0.3 }, 0.4), [0.115, A.top + 0.006, 0.045]);
  root.add(btn);
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#f6f3ea', roughness: 0.25, emissive: '#fff6d8', emissiveIntensity: 0 });
  trackEnv(bulbMat, 0.6);
  const bulb = mesh(G('camBulb', () => new THREE.SphereGeometry(0.02, 16, 12)), bulbMat, A.bulb);
  bulb.castShadow = false; root.add(bulb);
  const flash = new THREE.Object3D(); flash.name = 'flash'; flash.position.set(...A.bulb); root.add(flash);
  const lens = new THREE.Object3D(); lens.name = 'lens'; lens.position.set(...A.lens); root.add(lens);
  root.userData.flash = flash;
  root.userData.lens = lens;
  root.userData.flashBulb = bulb;
  root.userData.setFlash = (k) => { k = clamp(k || 0, 0, 1); bulbMat.emissiveIntensity = 4 * k; bulbMat.toneMapped = k < 0.01; };
  root.userData.height = 1.44;
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 5. velvet cushions
const CUSH = { W: 0.42, T: 0.106 };
function cushionGeos() {
  return G('cushion', () => {
    const { W, T } = CUSH, hw = W / 2;
    const g = new RoundedBoxGeometry(W, T, W, 5, 0.04);
    g.deleteAttribute('uv');
    const p = g.attributes.position;
    let minY = Infinity;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const nx = clamp(Math.abs(x) / hw, 0, 1), nz = clamp(Math.abs(z) / hw, 0, 1);
      const f = (1 - nx ** 3.2) * (1 - nz ** 3.2);
      let yy = y > 0 ? y * (0.6 + 0.4 * f) : y * (0.86 + 0.14 * f);
      if (y > 0) yy -= 0.007 * Math.exp(-(x * x + z * z) / (0.035 * 0.035));   // tufted centre
      const pinch = 1 - 0.035 * (1 - f) * (1 - Math.abs(y) / (T / 2));          // seam pulls in slightly
      p.setXYZ(i, x * pinch, yy, z * pinch);
      minY = Math.min(minY, yy);
    }
    g.translate(0, -minY, 0);
    smoothNormals(g);
    g.computeBoundingBox();
    const seamY = -minY - 0.006;
    const topY = g.boundingBox.max.y;
    // gold piping around the seam (rounded square), tassels at the corners, centre button
    const r = 0.05, e = hw - r - 0.004;
    const pt = (x, z) => new V3(x, seamY, z);
    const arc = (cx, cz, a0) => {
      const pts = [];
      for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); pts.push(pt(cx + Math.cos(a) * (r + 0.002), cz + Math.sin(a) * (r + 0.002))); }
      return pts;
    };
    const ring = [...arc(e, e, 0), ...arc(-e, e, Math.PI / 2), ...arc(-e, -e, Math.PI), ...arc(e, -e, 1.5 * Math.PI)];
    const pipe = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true, 'centripetal'), 120, 0.0058, 6, true);
    const tas = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * (hw - 0.012), cz = sz * (hw - 0.012);
      tas.push(xf(softBox(0.026, 0.026, 0.026, 0.006, 2), [cx, seamY, cz], [0, Math.PI / 4, 0]));
      tas.push(xf(new THREE.CylinderGeometry(0.007, 0.0145, 0.04, 10), [cx + sx * 0.012, seamY - 0.022, cz + sz * 0.012], [sz * 0.45, 0, -sx * 0.45]));
    }
    const button = xf(new THREE.SphereGeometry(0.011, 12, 8), [0, topY - 0.009, 0], [0, 0, 0], [1, 0.55, 1]);
    return { body: g, pipe, tassels: merge(tas), button, topY, seamY };
  });
}
let _velvet = null;
function velvetMat() {
  return (_velvet ??= new THREE.MeshPhysicalMaterial({ color: '#a01830', roughness: 0.78, sheen: 1, sheenColor: new THREE.Color('#ff7a96'), sheenRoughness: 0.42 }));
}
export function makeCushions() {
  const A = cushionGeos();
  const root = new THREE.Group(); root.name = 'Cushions';
  const goldThread = envMat('#e2b13c', { roughness: 0.42, metalness: 0.6 }, 0.9);
  const mk = () => {
    const c = new THREE.Group();
    c.add(mesh(A.body, velvetMat()));
    c.add(mesh(A.pipe, goldThread));
    c.add(mesh(A.tassels, goldThread));
    c.add(mesh(A.button, goldThread));
    return c;
  };
  const bottom = mk(), top = mk();
  bottom.name = 'cushionBottom'; top.name = 'cushionTop';
  const overlap = 0.012;
  const restTopY = A.topY - overlap;
  top.rotation.y = 0.17;
  root.add(bottom, top);
  function setSquash(k = 0) {
    k = clamp(k || 0, -1, 1.5);
    const sb = 1 - 0.24 * k, st = 1 - 0.16 * k, wb = 1 + 0.06 * k, wt = 1 + 0.04 * k;
    bottom.scale.set(wb, sb, wb);
    top.scale.set(wt, st, wt);
    top.position.y = restTopY * sb;
    const y = top.position.y + (A.topY - 0.004) * st;
    root.userData.top = y;
    return y;
  }
  root.userData.setSquash = setSquash;
  root.userData.bounce = (u, amount = 1) => {
    u = Math.max(0, u || 0);
    return setSquash(amount * 0.7 * Math.exp(-6 * u) * Math.cos(u * 15));
  };
  setSquash(0);
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 6. traffic cone
const CONE = { base: 0.035, r0: 0.134, y1: 0.06, r1: 0.03, y2: 0.485, top: 0.5 };
const coneR = (y) => lerp(CONE.r0 - 0.002, CONE.r1, (y - CONE.y1) / (CONE.y2 - CONE.y1));
function coneGeos() {
  return G('cone', () => {
    const body = lathe([[0.15, CONE.base, 1], [0.15, CONE.base + 0.012], [0.144, CONE.base + 0.02, 1], [CONE.r0, CONE.y1 - 0.004], [CONE.r1, CONE.y2], [0.023, 0.495], [0.012, 0.4995], [0, CONE.top]], 36);
    const b0 = 0.27, b1 = 0.355, e = 0.0016;
    const band = lathe([[coneR(b0) + 0.0005, b0, 1], [coneR(b0) + e, b0 + 0.002], [coneR(b1) + e, b1 - 0.002], [coneR(b1) + 0.0005, b1, 1]], 36);
    const base = merge([
      xf(softBox(0.36, CONE.base, 0.36, 0.01, 2), [0, CONE.base / 2, 0]),
      xf(new THREE.CylinderGeometry(0.16, 0.168, 0.01, 36), [0, CONE.base + 0.004, 0]),
    ]);
    return { body, band, base };
  });
}
export function makeTrafficCone() {
  const A = coneGeos();
  const root = new THREE.Group(); root.name = 'TrafficCone';
  root.add(mesh(A.base, mat('#1c1d21', { roughness: 0.78 })));
  root.add(mesh(A.body, envMat('#ff6512', { roughness: 0.48 }, 0.35)));
  root.add(mesh(A.band, envMat('#f5f5f2', { roughness: 0.32 }, 0.45)));
  const tip = new THREE.Object3D(); tip.name = 'tip'; tip.position.set(0, CONE.top, 0); root.add(tip);
  root.userData.tip = tip; root.userData.hatY = 0.44; root.userData.hatScale = 0.45; root.userData.height = CONE.top;
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 7. hand-painted sign
const _signMat = new Map();
function signFrontMat(lines, w, h, color, ink, seed) {
  const key = JSON.stringify([lines, w, h, color, ink, seed]);
  let m = _signMat.get(key);
  if (m) return m;
  const cw = clamp(Math.round(w * 1100), 256, 1024), ch = clamp(Math.round(cw * h / w), 64, 1024);
  const tex = canvasTexture(cw, ch, (g) => {
    const r = rng(seed * 131 + 7);
    g.fillStyle = color; g.fillRect(0, 0, cw, ch);
    // brush streaks
    for (let i = 0; i < 46; i++) {
      g.fillStyle = r() < 0.5 ? shade(color, 0.18) : shade(color, -0.1);
      g.globalAlpha = 0.18 + r() * 0.2;
      const y = r() * ch, hh = 2 + r() * ch * 0.025, x = -20 + r() * cw * 0.6;
      g.fillRect(x, y, cw * (0.3 + r() * 0.7), hh);
    }
    g.globalAlpha = 1;
    // painted border (slightly wobbly)
    const m0 = Math.min(cw, ch) * 0.06;
    g.strokeStyle = shade(color, -0.5); g.lineWidth = Math.min(cw, ch) * 0.035; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath();
    const pts = [[m0, m0], [cw - m0, m0], [cw - m0, ch - m0], [m0, ch - m0]];
    pts.forEach(([x, y], i) => { const jx = (r() - 0.5) * m0 * 0.3, jy = (r() - 0.5) * m0 * 0.3; i ? g.lineTo(x + jx, y + jy) : g.moveTo(x + jx, y + jy); });
    g.closePath(); g.stroke();
    // little painted stars in the corners
    g.fillStyle = '#ff4fa3';
    for (const [x, y] of [[m0 * 2.1, m0 * 2.1], [cw - m0 * 2.1, ch - m0 * 2.1]]) star(g, x, y, m0 * 0.75, m0 * 0.32, 5);
    g.fillStyle = '#3ea0e0';
    for (const [x, y] of [[cw - m0 * 2.1, m0 * 2.1], [m0 * 2.1, ch - m0 * 2.1]]) star(g, x, y, m0 * 0.75, m0 * 0.32, 5);
    // lines of text, auto-fit, hand-lettered wobble
    const n = lines.length;
    const innerW = cw - m0 * 5.2, innerH = ch - m0 * 3.2;
    const lh = innerH / n;
    g.textAlign = 'left'; g.textBaseline = 'middle';
    lines.forEach((line, li) => {
      const txt = String(line).toUpperCase();
      let fs = lh * 0.86;
      g.font = `900 ${fs}px ${FONT}`;
      const track = 0.04;
      const measure = () => [...txt].reduce((s, c) => s + g.measureText(c).width, 0) + track * fs * (txt.length - 1);
      const tw = measure();
      if (tw > innerW) { fs *= innerW / tw; g.font = `900 ${fs}px ${FONT}`; }
      const tw2 = measure();
      let x = (cw - tw2) / 2;
      const yc = m0 * 1.6 + lh * (li + 0.5);
      const col = Array.isArray(ink) ? ink[li % ink.length] : ink;
      for (const c of txt) {
        const cwid = g.measureText(c).width;
        g.save();
        g.translate(x + cwid / 2, yc + (r() - 0.5) * fs * 0.07);
        g.rotate((r() - 0.5) * 0.12);
        g.fillStyle = shade(col, -0.45); g.globalAlpha = 0.35;
        g.fillText(c, -cwid / 2 + fs * 0.03, fs * 0.035);          // soft brush shadow
        g.globalAlpha = 1; g.fillStyle = col;
        g.fillText(c, -cwid / 2, 0);
        g.restore();
        x += cwid + track * fs;
      }
    });
  });
  m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.75 });
  _signMat.set(key, m);
  return m;
}
function star(g, cx, cy, ro, ri, n = 5, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU, rr = i % 2 ? ri : ro;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath(); g.fill();
}
export function makeSign(opts = {}) {
  const { lines = ['HAPPY', 'RETIREMENT'], w = 0.6, h = 0.4, color = '#ffd23f', ink = ['#d62828', '#1d3fa8'], stick = 0.5, seed = 1 } = opts;
  const T = 0.018;
  const root = new THREE.Group(); root.name = 'Sign';
  const side = mat(shade(color, -0.12), { roughness: 0.8 });
  const back = mat(shade(color, -0.05), { roughness: 0.8 });
  const front = signFrontMat(Array.isArray(lines) ? lines : [String(lines)], w, h, color, ink, seed);
  const by = stick + h / 2;
  // RoundedBoxGeometry keeps BoxGeometry's groups: +x, −x, +y, −y, +z (front), −z
  root.add(mesh(softBox(w, h, T, 0.006, 2), [side, side, side, side, front, back], [0, by, 0]));
  const wood = mat('#9b6a3c', { roughness: 0.72 });
  const sh = stick + h * 0.75;
  const stake = G(`stake|${sh.toFixed(3)}`, () => merge([
    xf(softBox(0.032, sh - 0.05, 0.022, 0.004, 1), [0, 0.05 + (sh - 0.05) / 2, 0]),
    xf(new THREE.ConeGeometry(0.019, 0.05, 4, 1), [0, 0.025, 0], [Math.PI, Math.PI / 4, 0], [1, 1, 0.7]),
  ]));
  root.add(mesh(stake, wood, [0, 0, -T / 2 - 0.011]));
  const nails = G('signNails', () => merge([-1, 1].map((s) => xf(new THREE.CylinderGeometry(0.0045, 0.0045, 0.003, 8), [0, s * 0.06, 0], [Math.PI / 2, 0, 0]))));
  root.add(mesh(nails, envMat('#9a9da3', { metalness: 0.7, roughness: 0.35 }, 0.8), [0, by - h * 0.12, T / 2 + 0.0012]));
  const board = new THREE.Object3D(); board.name = 'board'; board.position.set(0, by, T / 2); root.add(board);
  root.userData.board = board; root.userData.height = stick + h;
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 8. briefcase
const BRF = { W: 0.42, H: 0.275, D: 0.1, stud: 0.008 };
function briefGeos() {
  return G('brief', () => {
    const { W, H, D, stud } = BRF;
    const y0 = stud, top = y0 + H;
    const body = xf(softBox(W, H, D, 0.02, 3), [0, y0 + H / 2, 0]);
    const seamY = top - 0.072;
    const dark = merge([
      xf(softBox(W + 0.003, 0.009, D + 0.003, 0.004, 1), [0, seamY, 0]),                       // lid seam band
      xf(softBox(W - 0.06, 0.004, 0.003, 0.0015, 1), [0, y0 + 0.03, D / 2 + 0.0005]),           // stitched welt
    ]);
    const hc = new THREE.CatmullRomCurve3([new V3(-0.062, top + 0.006, 0), new V3(-0.058, top + 0.034, 0), new V3(-0.035, top + 0.046, 0), new V3(0.035, top + 0.046, 0), new V3(0.058, top + 0.034, 0), new V3(0.062, top + 0.006, 0)]);
    const handle = new THREE.TubeGeometry(hc, 28, 0.0105, 10, false);
    const goldParts = [];
    for (const sx of [-1, 1]) {
      goldParts.push(xf(softBox(0.042, 0.034, 0.012, 0.004, 2), [sx * 0.12, seamY, D / 2 + 0.004]));        // clasp plate
      goldParts.push(xf(softBox(0.026, 0.012, 0.008, 0.003, 1), [sx * 0.12, seamY + 0.004, D / 2 + 0.011]));  // clasp latch
      goldParts.push(xf(softBox(0.026, 0.012, 0.03, 0.004, 1), [sx * 0.062, top + 0.004, 0]));              // handle mounts
      for (const sz of [-1, 1]) goldParts.push(xf(new THREE.CylinderGeometry(0.009, 0.011, stud, 10), [sx * 0.17, stud / 2, sz * 0.03]));
    }
    const keyholes = merge([-1, 1].map((sx) => xf(new THREE.CylinderGeometry(0.0038, 0.0038, 0.003, 8), [sx * 0.12, seamY - 0.008, D / 2 + 0.0105], [Math.PI / 2, 0, 0])));
    return { body, dark, handle, gold: merge(goldParts), keyholes, top, handleY: top + 0.046 };
  });
}
export function makeBriefcase() {
  const A = briefGeos();
  const root = new THREE.Group(); root.name = 'Briefcase';
  root.add(mesh(A.body, envMat('#7b4a26', { roughness: 0.48 }, 0.32)));
  root.add(mesh(A.dark, envMat('#4a2a13', { roughness: 0.55 }, 0.25)));
  root.add(mesh(A.handle, envMat('#5a3418', { roughness: 0.45 }, 0.3)));
  root.add(mesh(A.gold, gold()));
  const kh = mesh(A.keyholes, mat('#1a120a')); kh.castShadow = false; root.add(kh);
  const handle = new THREE.Object3D(); handle.name = 'handle'; handle.position.set(0, A.handleY, 0); root.add(handle);
  root.userData.handle = handle; root.userData.height = A.handleY + 0.01;
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 9. burglar sack
let _burlap = null;
function burlapMat() {
  if (_burlap) return _burlap;
  const tex = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#d6c294'; g.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let y = 0; y < h; y += 4) { g.fillStyle = `rgba(120,96,58,${0.12 + r() * 0.1})`; g.fillRect(0, y, w, 1.4); }
    for (let x = 0; x < w; x += 4) { g.fillStyle = `rgba(250,238,205,${0.1 + r() * 0.1})`; g.fillRect(x, 0, 1.4, h); }
    for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(110,85,50,${0.1 + r() * 0.15})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 3);
  _burlap = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.95 });
  return _burlap;
}
function sackGeos() {
  return G('sack', () => {
    const r = rng(404);
    const lumps = [];
    for (let i = 0; i < 9; i++) {
      const th = r() * TAU, y = -0.75 + r() * 1.25, c = Math.sqrt(1 - y * y);
      lumps.push({ d: [Math.cos(th) * c, y, Math.sin(th) * c], a: 0.05 + r() * 0.07, s: 0.05 + r() * 0.08 });
    }
    const g = new THREE.SphereGeometry(1, 44, 30);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      let bump = 0;
      for (const L of lumps) { const dt = x * L.d[0] + y * L.d[1] + z * L.d[2]; bump += L.a * Math.exp(-(1 - dt) / L.s); }
      const k = (y < 0 ? 1 - 0.08 * y * y : 1 - 0.6 * Math.pow(y, 1.7)) * (1 + bump);
      let Y = y * 0.155 * (1 + bump * 0.6);
      if (y < -0.55) Y = -0.155 * (0.55 + (-y - 0.55) * 0.55) * (1 + bump * 0.4);     // flattish bottom
      p.setXYZ(i, x * 0.19 * k, Y, z * 0.19 * k);
    }
    smoothNormals(g);
    // neck: gathered folds up to the tie, flared tuft above
    const y0 = 0.115, yt = 0.215, y2 = 0.29;
    const neck = lathe([[0.075, y0 - 0.025], [0.06, y0 + 0.015], [0.042, y0 + 0.05], [0.03, yt - 0.025], [0.026, yt], [0.03, yt + 0.012], [0.045, yt + 0.035], [0.058, y2 - 0.012], [0.05, y2], [0.03, y2 + 0.002], [0, y2 - 0.006]], 30);
    const np = neck.attributes.position;
    for (let i = 0; i < np.count; i++) {
      const x = np.getX(i), y = np.getY(i), z = np.getZ(i);
      const th = Math.atan2(x, z);
      const k = y > yt ? 1 + 0.2 * Math.sin(7 * th + 0.6) * clamp((y - yt) / (y2 - yt), 0, 1) : 1 + 0.1 * Math.sin(9 * th) * clamp((y - y0) / (yt - y0), 0, 1);
      np.setXYZ(i, x * k, y, z * k);
    }
    smoothNormals(neck);
    const tie = merge([
      xf(new THREE.TorusGeometry(0.03, 0.0085, 8, 22), [0, yt, 0], [Math.PI / 2, 0, 0]),
      xf(new THREE.TorusGeometry(0.03, 0.0075, 8, 22), [0, yt - 0.012, 0], [Math.PI / 2, 0, 0.08]),
      rod([0.028, yt - 0.004, 0.012], [0.05, yt - 0.06, 0.03], 0.0065, 6),
      rod([0.024, yt - 0.006, 0.018], [0.032, yt - 0.07, 0.048], 0.006, 6),
    ]);
    // centre the whole thing on its bounding box
    const bb = new THREE.Box3();
    for (const q of [g, neck, tie]) { q.computeBoundingBox(); bb.union(q.boundingBox); }
    const c = bb.getCenter(new V3());
    for (const q of [g, neck, tie]) q.translate(-c.x, -c.y, -c.z);
    return { body: g, neck, tie, tieY: yt - c.y, size: bb.getSize(new V3()) };
  });
}
export function makeSack() {
  const A = sackGeos();
  const root = new THREE.Group(); root.name = 'Sack';
  root.add(mesh(A.body, burlapMat()));
  root.add(mesh(A.neck, burlapMat()));
  root.add(mesh(A.tie, mat('#8a5a2c', { roughness: 0.85 })));
  const neck = new THREE.Object3D(); neck.name = 'neck'; neck.position.set(0, A.tieY, 0); root.add(neck);
  root.userData.neck = neck; root.userData.height = A.size.y;
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 10. stone plinth
const _stoneMat = new Map();
function stoneMat(color) {
  let m = _stoneMat.get(color);
  if (m) return m;
  const tex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    const r = rng(17);
    for (let i = 0; i < 26; i++) {                       // soft mottling
      const x = r() * w, y = r() * h, rr = 20 + r() * 50;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      const c = r() < 0.5 ? shade(color, 0.1) : shade(color, -0.09);
      gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.5; g.fillStyle = gr;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { g.save(); g.translate(ox, oy); g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); g.restore(); }
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 900; i++) {                      // speckles
      g.fillStyle = r() < 0.6 ? `rgba(60,58,54,${0.15 + r() * 0.3})` : `rgba(255,255,250,${0.15 + r() * 0.3})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 1.6, 1 + r() * 1.6);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.9 });
  _stoneMat.set(color, m);
  return m;
}
const _plinthPlaque = new Map();
function bronzePlaqueMat(text, aspect) {
  const key = text + '|' + aspect.toFixed(3);
  let m = _plinthPlaque.get(key);
  if (m) return m;
  const cw = 1024, ch = Math.max(64, Math.round(cw / aspect));
  const tex = canvasTexture(cw, ch, (g) => {
    const gr = g.createLinearGradient(0, 0, cw, ch);
    gr.addColorStop(0, '#6e4320'); gr.addColorStop(0.5, '#7d4f27'); gr.addColorStop(1, '#5e3819');
    g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
    const r = rng(3);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '40,90,70' : '30,18,8'},${0.05 + r() * 0.08})`; g.fillRect(r() * cw, r() * ch, 2 + r() * 5, 2 + r() * 5); }
    const b = ch * 0.09;
    g.strokeStyle = '#3b230e'; g.lineWidth = b * 0.5; g.strokeRect(b * 0.9, b * 0.9, cw - b * 1.8, ch - b * 1.8);
    g.strokeStyle = '#d9a35c'; g.lineWidth = b * 0.36; g.strokeRect(b * 0.75, b * 0.75, cw - b * 1.8, ch - b * 1.8);
    // screws
    for (const [x, y] of [[b * 1.9, b * 1.9], [cw - b * 1.9, b * 1.9], [b * 1.9, ch - b * 1.9], [cw - b * 1.9, ch - b * 1.9]]) {
      g.fillStyle = '#3b230e'; g.beginPath(); g.arc(x + 1.5, y + 1.5, b * 0.42, 0, TAU); g.fill();
      g.fillStyle = '#d9a35c'; g.beginPath(); g.arc(x, y, b * 0.4, 0, TAU); g.fill();
      g.strokeStyle = '#5e3819'; g.lineWidth = b * 0.12; g.beginPath(); g.moveTo(x - b * 0.28, y); g.lineTo(x + b * 0.28, y); g.stroke();
    }
    const lines = String(text).split('\n');
    const availW = cw - b * 6, availH = ch - b * 4.2, lh = availH / lines.length;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((ln, i) => {
      let fs = lh * 0.8;
      g.font = `bold ${fs}px ${SERIF}`;
      const tw = g.measureText(ln).width;
      if (tw > availW) { fs *= availW / tw; g.font = `bold ${fs}px ${SERIF}`; }
      const y = ch / 2 + (i - (lines.length - 1) / 2) * lh;
      g.fillStyle = '#2e1a09'; g.fillText(ln, cw / 2 + fs * 0.04, y + fs * 0.05);         // emboss shadow
      g.fillStyle = '#f0c27e'; g.fillText(ln, cw / 2 - fs * 0.015, y - fs * 0.02);        // highlight edge
      g.fillStyle = '#d9a35c'; g.fillText(ln, cw / 2, y);
    });
  });
  m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.42, metalness: 0.55 });
  trackEnv(m, 0.9);
  _plinthPlaque.set(key, m);
  return m;
}
export function makePlinth(opts = {}) {
  const { w = 0.9, d = 0.9, h = 0.35, plaque = 'NEVER BLINKED', stone = '#aeaaa1' } = opts;
  const baseH = Math.min(0.06, h * 0.2), capH = Math.min(0.05, h * 0.16), bodyH = h - baseH - capH;
  const ins = Math.min(0.03, w * 0.04, d * 0.04);
  const key = `plinth|${w}|${d}|${h}`;
  const geo = G(key, () => merge([
    boxUV(xf(softBox(w, baseH, d, 0.012, 2), [0, baseH / 2, 0]), 0.45),
    boxUV(xf(softBox(w - 2 * ins, bodyH + 0.01, d - 2 * ins, 0.01, 2), [0, baseH + bodyH / 2, 0]), 0.45),
    boxUV(xf(softBox(w - 0.02, capH, d - 0.02, 0.012, 2), [0, h - capH / 2, 0]), 0.45),
  ]));
  const root = new THREE.Group(); root.name = 'Plinth';
  root.add(mesh(geo, stoneMat(stone)));
  if (plaque) {
    const pw = opts.plaqueW ?? Math.min(0.62 * w, 0.6), ph = Math.min(0.16, bodyH * 0.64);
    const bronzeSide = envMat('#6e4320', { metalness: 0.55, roughness: 0.4 }, 0.9);
    const pm = mesh(softBox(pw, ph, 0.012, 0.004, 2), [bronzeSide, bronzeSide, bronzeSide, bronzeSide, bronzePlaqueMat(plaque, pw / ph), bronzeSide],
      [0, baseH + bodyH / 2, d / 2 - ins + 0.006]);
    root.add(pm);
    const anchor = new THREE.Object3D(); anchor.name = 'plaque'; anchor.position.set(0, baseH + bodyH / 2, d / 2 - ins + 0.012); root.add(anchor);
    root.userData.plaque = anchor;
  }
  root.userData.top = h;
  return root;
}
