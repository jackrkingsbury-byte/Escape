// Episode 2 ("Bingo") props. Same conventions as src/props.js (SPEC.md §2/§7): ES module, metres, Y up,
// deterministic (no Math.random / clocks), animated things are pure functions of the t / u passed in,
// geometries + materials + textures cached at module level.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   makeDabber({ color='#e8412c', length=0.17 })                 → Object3D
//   makeBingoCard({ seed=1, size=0.13, res=512 })                → { root, setDots(k), setAllDotted(bool), … }
//   makeCardGrid({ rows=8, cols=10, gap=0.012, size=0.11, seed=1, sweep='+x', jitter=1, res=384 })
//                                                                → { root, setProgress(p), … }
//   makeCardStack({ height=0.3, size=0.13, seed=1, wobble=1 })   → { root, setHeight(h), … }
//   makeInkDot({ r=0.03, variant=0, flat=0.35 })                 → Object3D
//   makeBingoCage({ speed=0.9, pedestal=0, balls=8 })            → { root, update(t), … }
//   makeMicStand({ height=1.5, tilt=0.6 })                       → Object3D
//   makeDJDecks()                                                → { root, update(t), setOn(bool) }
//   makeSpoon() / makeFork()                                     → Object3D
//   makeTopHatProp({ scale=1, band='#b3202a' })                  → Object3D
//   makeToupee({ color='#5a4a3a' })                              → Object3D
//   makeHearingAid()                                             → Object3D
//   setProps2EnvIntensity(k=1)   scales the reflections of every metal/gloss material made here (e.g. 0.5 at night)
//   CARD_THICKNESS (0.004), CARD_ASPECT (1.18), TOPHAT_MATCH_SCALE (≈1.206), cardNumbers(seed)
//
// ── Origins / sizes / details ───────────────────────────────────────────────────────────────────
// makeDabber        origin = centre of the felt TIP (lowest point, y=0); long axis +Y; ~0.17 long, body Ø0.056,
//                   tip Ø0.025 (a dot printed by it is about one card square). Slam it straight down: when
//                   root.position = point on the card, the tip touches exactly there. `length` rescales uniformly.
//                   NOTE: character hands are 0.14 cubes, so in a fist the body is partly hidden; scale 1.3–1.5
//                   (length 0.22–0.25) if it needs to read as "held" in a wide shot.
//                   root.userData.length.
// makeBingoCard     thin card (size × 0.004 × size·1.18) in the XZ plane, origin = centre of its TOP surface
//                   → put root at surfaceY + CARD_THICKNESS. Header row "B I N G O" is at −Z, so the text reads
//                   upright for a camera at +Z looking toward −Z (rotate root.rotation.y = π for a reader
//                   sitting at −Z facing +Z). Numbers: real-bingo columns (B 1–15 … O 61–75), FREE centre.
//                   setDots(k) k∈0..25: translucent black ink blobs on the first k squares of a deterministic
//                   (per seed) order. setAllDotted(true) = 25, (false) = 0. Textures/materials are cached per
//                   (seed, k, res) and built lazily, so only levels you actually use cost memory.
//                   Extras: .width .depth .thickness .seed .dots (current k) .order (cell indices 0..24, cell =
//                   row*5+col, row 0 = top/−Z) · dotPosition(i) → Vector3 (card-local, y=0) of the i-th dot's
//                   centre — aim the dabber there so dot #k appears under the tip when you setDots(k+1) ·
//                   cellPosition(col,row) → Vector3 · prewarm(renderer, kMax=25) uploads the textures up front.
// makeCardGrid      rows (along Z) × cols (along X) cards, centred on the origin, top surfaces at y=0
//                   (root at tableTop + CARD_THICKNESS). Uses 6 card variants (seeds seed..seed+5, 6 header
//                   colours) and InstancedMeshes: 1 body mesh + 12 top meshes (clean/dotted per variant) = 13
//                   draw calls for any number of cards. setProgress(p): card i (in sweep order) is fully dotted
//                   when i < p·count. sweep '+x' (default: from −X to +X, column by column), '-x', '+z', '-z'.
//                   Extras: .width .depth .count .cards[{ x, z, yaw, variant, order }] · cardPosition(i) (i in sweep
//                   order) → Vector3 · setProgress returns the number of dotted cards.
// makeCardStack     origin = bottom centre; the top is always a real (clean) bingo card face. setHeight(h) is pure
//                   (rebuilds a few hundred vertices, fine per frame). wobble 0 = perfectly straight; 1 = a gentle
//                   hand-stacked lean (grows with height, a few mm at 0.3 m, a few cm at 2.2 m).
//                   Extras: .topCard (a makeBingoCard object), .height, topPosition() → Vector3 (local, top centre).
// makeInkDot        flattened irregular black blob, origin at its centre, flat axis = local Y (half thickness =
//                   flat·r). To stick on a surface: position at the surface point, rotate so local +Y = surface
//                   normal (e.g. a face facing +Z: rotation.x = π/2). variant 0..3 = 4 shared shapes.
// makeBingoCage     origin = floor under the stand (or under the pedestal if pedestal > 0, which lifts the whole
//                   stand by `pedestal` metres on a slim column, e.g. pedestal: 0.62 puts the cage at hand
//                   height). Brass cube cage (0.30 edge, ~0.33 with knobs) spinning about the X axis (axle),
//                   crank on +X, front = +Z. update(t): angle = speed·t (rad/s), balls tumble at the bottom.
//                   Extras: .cage (rotating group) · .axleHeight (local y of the axle, without pedestal) · .size.
// makeMicStand      origin at the floor; ball (Ø0.086) centre at ≈ height+0.11 (1.61 m). It points toward −Z and up: the speaker
//                   stands at about z = −0.3 facing +Z. root.userData.mic = Object3D at the ball centre.
// makeDJDecks       origin floor centre, top surface at y = 0.95, 1.3 wide (X) × 0.62 deep (Z). LED stripes and
//                   the front face look toward +Z (audience); the DJ stands at about z = −0.55 facing +Z.
//                   update(t): platters spin (33⅓ rpm), LEDs scroll, level meters bounce. setOn(false) = stopped/dark.
// makeSpoon/Fork    ~0.18 long, metalness 0.8 / roughness 0.3, origin at the handle bottom, long axis +Y, the
//                   concave side of the bowl / the flat of the fork faces +Z. They stand on their handle end;
//                   lean them by rotating root (the pivot is the handle bottom).
// makeTopHatProp    origin at the centre of the brim's underside (where the head goes), crown up, 0.32 tall.
//                   Same shape as the characters.js 'topHat' accessory; scale: TOPHAT_MATCH_SCALE × character scale
//                   matches the worn hat exactly (0.386 tall at scale 1). Buckle faces +Z.
// makeToupee        0.32 (X) × 0.28 (Z) sculpted comb-over, y −0.008..+0.068 incl. the front curl (toward +Z);
//                   origin at its centre (the underside is ~flat at y≈−0.008, so sit it on a head top at +0.008).
// makeHearingAid    behind-the-ear aid ~0.055 tall. Origin at the body centre. Body vertical (behind the ear, −Z),
//                   hook arcs over the top and forward to the ear tip (+Z). Geometry lies in the YZ plane, so put
//                   it just outside the ear: on a characters.js head joint, (0.378, 0.255, −0.02) sits on the
//                   +X ear's outer face, below the 'grandpa' hair block (which covers y 0.29–0.45 there);
//                   for the −X ear use x = −0.378 and rotation.y = π.
//
// Metals (spoon, fork, mic pole, cage brass, tonearms) and glossy bits use a small built-in studio reflection
// map (there is no scene environment in this project, and metalness 0.8 would otherwise render nearly black).
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, clamp, lerp, smooth, hash, noise1, canvasTexture, rbox, mat } from '../lib/util.js';

const V3 = THREE.Vector3, V2 = THREE.Vector2;
const TAU = Math.PI * 2;
const FONT = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif';
const PARTY = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff'];

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
  g.userData.v = vAt.map((x) => x / tot);
  g.userData.pts = P;
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

/** Cylinder from point a to point b (for merged rod frames). */
function rod(a, b, r, seg = 8, caps = true) {
  const A = new V3(...a), B = new V3(...b);
  const dir = B.clone().sub(A); const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, !caps);
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
    // dark wall panels (contrast bands) and bright softboxes
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
let _envK = 1;
export function setProps2EnvIntensity(k = 1) {
  _envK = k;
  for (const { m, base } of _envMats) m.envMapIntensity = base * k;
}
const chrome = () => envMat('#e9edf2', { metalness: 0.92, roughness: 0.18 }, 1);
const silver = () => envMat('#eef1f6', { metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide }, 1.3);
const brass = () => envMat('#e0ad3f', { metalness: 0.85, roughness: 0.28 }, 1.0);

// ════════════════════════════════════════════════════════════════════════════════ 1. dabber
const DAB_BAND = [0.064, 0.112];
function dabberGeo() {
  return G('dabber', () => {
    const tip = lathe([[0, 0, 1], [0.0062, 0.0007], [0.0098, 0.0027], [0.0119, 0.0058], [0.0126, 0.0095], [0.0126, 0.017, 1], [0, 0.017, 1]], 28);
    const prof = [[0, 0.013, 1], [0.0124, 0.013, 1], [0.0132, 0.019], [0.0158, 0.027], [0.0215, 0.035], [0.0262, 0.041], [0.028, 0.048],
      [0.028, DAB_BAND[0]], [0.028, DAB_BAND[1]], [0.028, 0.126], [0.0272, 0.131], [0.0255, 0.1335, 1], [0, 0.1335, 1]];
    const body = lathe(prof, 36).rotateY(-Math.PI / 2);      // label words face ±Z
    const P = body.userData.pts, V = body.userData.v;
    const vAt = (y) => V[P.findIndex((p) => Math.abs(p.y - y) < 1e-6 && p.r > 0.02)];
    body.userData.band = [vAt(DAB_BAND[0]), vAt(DAB_BAND[1])];
    const cap = lathe([[0, 0.129, 1], [0.0298, 0.129, 1], [0.0302, 0.1305], [0.0302, 0.1345, 1], [0.0291, 0.1352, 1], [0.0291, 0.1365, 1],
      [0.0302, 0.1372, 1], [0.0302, 0.1625], [0.0289, 0.1672], [0.0255, 0.1695], [0.012, 0.1702], [0, 0.1703]], 36);
    return { tip, body, cap };
  });
}
const _dabTex = new Map();
function dabberBodyMat(color) {
  let m = _dabTex.get(color);
  if (m) return m;
  const [v0, v1] = dabberGeo().body.userData.band;
  const tex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    const y0 = (1 - v1) * h, y1 = (1 - v0) * h, bh = y1 - y0;
    g.fillStyle = '#fbf8f1'; g.fillRect(0, y0, w, bh);
    g.fillStyle = shade(color, -0.35); g.fillRect(0, y0 - 2, w, 3); g.fillRect(0, y1 - 1, w, 3);
    g.font = `bold ${Math.round(bh * 0.5)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color;
    for (const x of [0.25, 0.75]) g.fillText('BINGO', x * w, y0 + bh * 0.53);
    // little stars between the words
    g.fillStyle = '#ffd23f';
    for (const x of [0, 0.5, 1]) star(g, x * w, y0 + bh * 0.5, bh * 0.2, bh * 0.09, 5);
  });
  m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.32, envMap: studioEnv(), envMapIntensity: 0.3 * _envK });
  _envMats.push({ m, base: 0.3 });
  _dabTex.set(color, m);
  return m;
}
function star(g, cx, cy, ro, ri, n = 5, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU, r = i % 2 ? ri : ro;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath(); g.fill();
}

export function makeDabber(opts = {}) {
  const { color = '#e8412c', length = 0.17 } = opts;
  const A = dabberGeo();
  const root = new THREE.Group(); root.name = 'Dabber';
  const inner = new THREE.Group(); inner.scale.setScalar(length / 0.17); root.add(inner);
  inner.add(mesh(A.tip, mat('#121216', { roughness: 0.97 })));
  inner.add(mesh(A.body, dabberBodyMat(color)));
  inner.add(mesh(A.cap, envMat(shade(color, -0.42), { roughness: 0.38 }, 0.3)));
  root.userData.length = length;
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 2. bingo card
export const CARD_THICKNESS = 0.004;
export const CARD_ASPECT = 1.18;
const CARD_COLORS = ['#e8412c', '#2a6be0', '#11a058', '#8a4fff', '#ff7a1a', '#e2307a'];
const CARD_INK = '#1b1b22';
const CARD_PAPER = '#fffbf1';
const CARD_EDGE = '#efe8d8';

const _cardInfo = new Map();
/** Pure per-seed card data: numbers[col][row] (0 = FREE), header colour, dot order and dot shapes. */
function cardInfo(seed) {
  let ci = _cardInfo.get(seed);
  if (ci) return ci;
  const r = rng(seed * 7919 + 17);
  const nums = [];
  for (let c = 0; c < 5; c++) {
    const pool = Array.from({ length: 15 }, (_, i) => c * 15 + i + 1);
    for (let i = 14; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    nums.push(pool.slice(0, 5));
  }
  nums[2][2] = 0;
  const order = Array.from({ length: 25 }, (_, i) => i);
  for (let i = 24; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const dots = [];
  for (let cell = 0; cell < 25; cell++) {
    const d = rng(seed * 1009 + cell * 31 + 5);
    const sats = [];
    const ns = 1 + Math.floor(d() * 3);
    for (let s = 0; s < ns; s++) sats.push({ a: d() * TAU, d: 1.08 + d() * 0.2, r: 0.05 + d() * 0.08 });
    dots.push({ ox: (d() - 0.5) * 0.12, oy: (d() - 0.5) * 0.12, rs: 0.94 + d() * 0.1, a3: 0.04 + d() * 0.05,
      ph1: d() * TAU, ph2: d() * TAU, ph3: d() * TAU, sats });
  }
  const color = CARD_COLORS[((Math.round(seed) % 6) + 6) % 6];
  ci = { nums, order, dots, color };
  _cardInfo.set(seed, ci);
  return ci;
}
/** Numbers of a card: [col][row], 0 = FREE. */
export function cardNumbers(seed = 1) { return cardInfo(seed).nums.map((c) => c.slice()); }

function cardLayout(W, H) {
  const m = W * 0.045, cell = (W - 2 * m) / 5;
  const gy = H - m - 5 * cell;
  return { m, cell, gx: m, gy, hy0: m * 0.5, hy1: gy - m * 0.25 };
}
function dotCentre(L, cell, p) {
  const c = cell % 5, r = Math.floor(cell / 5);
  return [L.gx + (c + 0.5 + p.ox) * L.cell, L.gy + (r + 0.5 + p.oy) * L.cell];
}
function blobPath(g, cx, cy, R, p) {
  g.beginPath();
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const rr = R * (1 + p.a3 * Math.sin(3 * a + p.ph1) + 0.035 * Math.sin(5 * a + p.ph2) + 0.018 * Math.sin(11 * a + p.ph3));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
}
function drawInkDot(g, L, cell, p) {
  const [cx, cy] = dotCentre(L, cell, p);
  const R = L.cell * 0.43 * p.rs;
  blobPath(g, cx, cy, R * 1.05, p); g.fillStyle = 'rgba(12,10,20,0.22)'; g.fill();      // soft bleed
  const gr = g.createRadialGradient(cx - R * 0.18, cy - R * 0.2, R * 0.05, cx, cy, R);
  gr.addColorStop(0, 'rgba(30,26,40,0.76)'); gr.addColorStop(0.7, 'rgba(12,10,20,0.86)'); gr.addColorStop(1, 'rgba(3,3,8,0.96)');
  blobPath(g, cx, cy, R, p); g.fillStyle = gr; g.fill();
  g.fillStyle = 'rgba(5,5,10,0.9)';
  for (const s of p.sats) { g.beginPath(); g.arc(cx + Math.cos(s.a) * R * s.d, cy + Math.sin(s.a) * R * s.d, R * s.r, 0, TAU); g.fill(); }
}
function drawCardBase(g, W, H, info) {
  const L = cardLayout(W, H), col = info.color, dark = shade(col, -0.45);
  g.fillStyle = col; g.fillRect(0, 0, W, H);
  // faint lighter inner bevel on the frame
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = L.m * 0.18;
  g.strokeRect(L.m * 0.22, L.m * 0.22, W - L.m * 0.44, H - L.m * 0.44);
  // header letters
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const hs = L.hy1 - L.hy0, hyc = (L.hy0 + L.hy1) / 2 + hs * 0.05;
  g.font = `bold ${Math.round(hs * 0.84)}px ${FONT}`;
  'BINGO'.split('').forEach((ch, c) => {
    const x = L.gx + (c + 0.5) * L.cell;
    g.lineWidth = hs * 0.12; g.strokeStyle = dark; g.strokeText(ch, x, hyc);
    g.fillStyle = '#ffffff'; g.fillText(ch, x, hyc);
  });
  // grid paper + numbers
  const gw = 5 * L.cell;
  g.fillStyle = CARD_PAPER; g.fillRect(L.gx, L.gy, gw, gw);
  g.font = `bold ${Math.round(L.cell * 0.5)}px ${FONT}`;
  for (let c = 0; c < 5; c++) for (let r = 0; r < 5; r++) {
    const x = L.gx + (c + 0.5) * L.cell, y = L.gy + (r + 0.5) * L.cell;
    const n = info.nums[c][r];
    if (n === 0) {
      g.fillStyle = col; star(g, x, y, L.cell * 0.44, L.cell * 0.2, 5);
      g.font = `bold ${Math.round(L.cell * 0.2)}px ${FONT}`;
      g.lineWidth = L.cell * 0.05; g.strokeStyle = dark; g.strokeText('FREE', x, y + L.cell * 0.04);
      g.fillStyle = '#ffffff'; g.fillText('FREE', x, y + L.cell * 0.04);
      g.font = `bold ${Math.round(L.cell * 0.5)}px ${FONT}`;
    } else {
      g.fillStyle = CARD_INK; g.fillText(String(n), x, y + L.cell * 0.04);
    }
  }
  // grid lines
  g.strokeStyle = shade(col, -0.15); g.lineWidth = L.cell * 0.045;
  g.beginPath();
  for (let i = 1; i < 5; i++) {
    g.moveTo(L.gx + i * L.cell, L.gy); g.lineTo(L.gx + i * L.cell, L.gy + gw);
    g.moveTo(L.gx, L.gy + i * L.cell); g.lineTo(L.gx + gw, L.gy + i * L.cell);
  }
  g.stroke();
  g.lineWidth = L.cell * 0.06; g.strokeStyle = dark; g.strokeRect(L.gx, L.gy, gw, gw);
}

const _cardBase = new Map(), _cardMat = new Map();
function cardMaterial(seed, k, res) {
  const key = `${seed}|${k}|${res}`;
  let m = _cardMat.get(key);
  if (m) return m;
  const W = res, H = Math.round(res * CARD_ASPECT);
  const info = cardInfo(seed);
  const bkey = `${seed}|${res}`;
  let base = _cardBase.get(bkey);
  if (!base) {
    base = document.createElement('canvas'); base.width = W; base.height = H;
    drawCardBase(base.getContext('2d'), W, H, info);
    _cardBase.set(bkey, base);
  }
  const tex = canvasTexture(W, H, (g) => {
    g.drawImage(base, 0, 0);
    const L = cardLayout(W, H);
    for (let i = 0; i < k; i++) drawInkDot(g, L, info.order[i], info.dots[info.order[i]]);
  });
  m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.8 });
  m.name = `bingoCard ${key}`;
  _cardMat.set(key, m);
  return m;
}
function cardGeos(w, d) {
  return G(`card|${w.toFixed(5)}|${d.toFixed(5)}`, () => {
    const top = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
    const box = new THREE.BoxGeometry(w, CARD_THICKNESS, d).translate(0, -CARD_THICKNESS / 2, 0);
    const grp = box.groups[2], idx = box.index.array, keep = [];
    for (let i = 0; i < idx.length; i++) if (i < grp.start || i >= grp.start + grp.count) keep.push(idx[i]);
    box.setIndex(keep); box.clearGroups();
    const sides = prep(box);
    const both = mergeGeometries([prep(top), sides], true);
    return { top, sides, both };
  });
}
const edgeMat = () => mat(CARD_EDGE, { roughness: 0.9 });

/** card-local position (top surface) of a canvas pixel position. */
function canvasToLocal(px, py, W, H, w, d) { return new V3((px / W - 0.5) * w, 0, (py / H - 0.5) * d); }

export function makeBingoCard(opts = {}) {
  const { seed = 1, size = 0.13, res = 512 } = opts;
  const w = size, d = size * CARD_ASPECT;
  const info = cardInfo(seed);
  const geos = cardGeos(w, d);
  const mats = [cardMaterial(seed, 0, res), edgeMat()];
  const m = new THREE.Mesh(geos.both, mats);
  m.castShadow = true; m.receiveShadow = true; m.name = 'cardMesh';
  const root = new THREE.Group(); root.name = 'BingoCard';
  root.add(m);
  const W = res, H = Math.round(res * CARD_ASPECT), L = cardLayout(W, H);
  const card = {
    root, width: w, depth: d, thickness: CARD_THICKNESS, seed, dots: 0, order: info.order.slice(), mesh: m,
    setDots(k) {
      k = clamp(Math.round(k), 0, 25);
      if (k === card.dots) return;
      card.dots = k;
      mats[0] = cardMaterial(seed, k, res);
    },
    setAllDotted(on) { card.setDots(on ? 25 : 0); },
    dotPosition(i) {
      const cell = info.order[clamp(Math.floor(i), 0, 24)];
      const [px, py] = dotCentre(L, cell, info.dots[cell]);
      return canvasToLocal(px, py, W, H, w, d);
    },
    cellPosition(col, row) {
      return canvasToLocal(L.gx + (col + 0.5) * L.cell, L.gy + (row + 0.5) * L.cell, W, H, w, d);
    },
    prewarm(renderer, kMax = 25) {
      for (let k = 0; k <= kMax; k++) renderer.initTexture(cardMaterial(seed, k, res).map);
    },
  };
  return card;
}

// ════════════════════════════════════════════════════════════════════════════════ 3. card grid
export function makeCardGrid(opts = {}) {
  const { rows = 8, cols = 10, gap = 0.012, size = 0.11, seed = 1, sweep = '+x', jitter = 1, res = 384 } = opts;
  const w = size, d = size * CARD_ASPECT;
  const count = rows * cols;
  const root = new THREE.Group(); root.name = 'CardGrid';
  const geos = cardGeos(w, d);
  const width = cols * w + (cols - 1) * gap, depth = rows * d + (rows - 1) * gap;
  const jr = rng(seed * 313 + 7);
  const cards = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c - (cols - 1) / 2) * (w + gap) + (jr() - 0.5) * 0.004 * jitter;
    const z = (r - (rows - 1) / 2) * (d + gap) + (jr() - 0.5) * 0.004 * jitter;
    cards.push({ x, z, yaw: (jr() - 0.5) * 0.07 * jitter, variant: (r * cols + c) % 6, r, c, order: 0 });
  }
  const key = { '+x': (a) => a.c * 1e3 + a.r, '-x': (a) => -a.c * 1e3 + a.r, '+z': (a) => a.r * 1e3 + a.c, '-z': (a) => -a.r * 1e3 + a.c }[sweep] || ((a) => a.c * 1e3 + a.r);
  const sorted = cards.slice().sort((a, b) => key(a) - key(b));
  sorted.forEach((cd, i) => { cd.order = i; });
  const mtx = cards.map((cd) => new THREE.Matrix4().compose(new V3(cd.x, 0, cd.z), new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), cd.yaw), new V3(1, 1, 1)));

  const bodies = new THREE.InstancedMesh(geos.sides, edgeMat(), count);
  bodies.name = 'cardBodies'; bodies.castShadow = true; bodies.receiveShadow = true; bodies.frustumCulled = false;
  mtx.forEach((m4, i) => bodies.setMatrixAt(i, m4));
  root.add(bodies);
  const per = [0, 0, 0, 0, 0, 0];
  for (const cd of cards) per[cd.variant]++;
  const tops = [];   // tops[v] = [clean, dotted]
  for (let v = 0; v < 6; v++) {
    const pair = [0, 25].map((k) => {
      const im = new THREE.InstancedMesh(geos.top, cardMaterial(seed + v, k, res), Math.max(1, per[v]));
      im.name = `cardTops v${v} k${k}`; im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false; im.count = 0;
      root.add(im);
      return im;
    });
    tops.push(pair);
  }
  let last = -1;
  function setProgress(p) {
    const D = clamp(Math.ceil(clamp(p, 0, 1) * count - 1e-9), 0, count);
    if (D === last) return D;
    last = D;
    const n = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
    cards.forEach((cd, i) => {
      const s = cd.order < D ? 1 : 0;
      tops[cd.variant][s].setMatrixAt(n[cd.variant][s]++, mtx[i]);
    });
    for (let v = 0; v < 6; v++) for (let s = 0; s < 2; s++) { tops[v][s].count = n[v][s]; tops[v][s].instanceMatrix.needsUpdate = true; }
    return D;
  }
  setProgress(0);
  return {
    root, setProgress, width, depth, count, cards, thickness: CARD_THICKNESS,
    cardPosition(i) { const cd = sorted[clamp(Math.floor(i), 0, count - 1)]; return new V3(cd.x, 0, cd.z); },
  };
}

// ════════════════════════════════════════════════════════════════════════════════ 4. card stack
const STACK_CARD = 0.006, STACK_TILE = 64;     // visual card thickness on the stack edge, cards per texture tile
let _stackMat = null;
function stackMaterial() {
  if (_stackMat) return _stackMat;
  const tex = canvasTexture(128, 1024, (g, w, h) => {
    const r = rng(41);
    const bh = h / STACK_TILE;
    const pastel = CARD_COLORS.map((c) => shade(c, 0.55));
    for (let i = 0; i < STACK_TILE; i++) {
      const y = i * bh;
      const roll = r();
      g.fillStyle = roll < 0.16 ? pastel[Math.floor(r() * 6)] : ['#fffaf0', '#f6f0e3', '#fbf5ea', '#f1eadb'][Math.floor(r() * 4)];
      g.fillRect(0, y, w, bh);
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(0, y, w, 1.5);
      // separator (slightly wavy, with darker gaps where the cards don't sit flush)
      g.fillStyle = 'rgba(100,86,68,0.62)';
      const ph = r() * TAU, amp = 0.6 + r() * 0.8;
      for (let x = 0; x < w; x += 4) g.fillRect(x, y + bh - 2.6 + Math.sin(x * 0.07 + ph) * amp, 4, 2.6);
      if (r() < 0.45) { g.fillStyle = 'rgba(70,58,44,0.45)'; const x0 = r() * w, ww = 10 + r() * 40; g.fillRect(x0, y + bh - 4, ww, 4); }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  _stackMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.9 });
  return _stackMat;
}

export function makeCardStack(opts = {}) {
  const { height = 0.3, size = 0.13, seed = 1, wobble = 1 } = opts;
  const w = size, d = size * CARD_ASPECT;
  const SEG = 32;
  const geo = new THREE.BoxGeometry(w * 0.992, 1, d * 0.992, 1, SEG, 1);
  const pos = geo.attributes.position, uv = geo.attributes.uv, nor = geo.attributes.normal;
  const base = Float32Array.from(pos.array);           // y in [-0.5, 0.5]
  const body = mesh(geo, stackMaterial());
  body.name = 'stackBody';
  const root = new THREE.Group(); root.name = 'CardStack';
  root.add(body);
  const topCard = makeBingoCard({ seed, size });
  topCard.root.rotation.y = 0.02;
  root.add(topCard.root);
  const ph = rng(seed * 17 + 3);
  const p1 = ph() * TAU, p2 = ph() * TAU, p3 = ph() * TAU, p4 = ph() * TAU;
  const off = (y, out) => {
    const a = wobble * Math.min(1, 0.25 + y * 0.6);
    out.x = a * (0.004 * Math.sin(y * 5.1 + p1) + 0.0025 * Math.sin(y * 13.7 + p2)) - a * 0.004 * Math.sin(p1);
    out.z = a * (0.0035 * Math.sin(y * 4.3 + p3) + 0.002 * Math.sin(y * 11.3 + p4)) - a * 0.0035 * Math.sin(p3);
    return out;
  };
  const o = { x: 0, z: 0 };
  const stack = { root, topCard, height: 0, body };
  stack.setHeight = (h) => {
    h = Math.max(h, CARD_THICKNESS + 0.0005);
    stack.height = h;
    const hb = h - CARD_THICKNESS;
    for (let i = 0; i < pos.count; i++) {
      const y = (base[i * 3 + 1] + 0.5) * hb;
      off(y, o);
      pos.setXYZ(i, base[i * 3] + o.x, y, base[i * 3 + 2] + o.z);
      if (Math.abs(nor.getY(i)) < 0.5) uv.setY(i, y / (STACK_CARD * STACK_TILE));
    }
    pos.needsUpdate = true; uv.needsUpdate = true;
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    off(hb, o);
    topCard.root.position.set(o.x, h, o.z);
  };
  stack.topPosition = () => new V3(topCard.root.position.x, stack.height, topCard.root.position.z);
  stack.setHeight(height);
  return stack;
}

// ════════════════════════════════════════════════════════════════════════════════ 5. ink dot
function inkGeo(v) {
  return G(`ink${v}`, () => {
    let g = new THREE.IcosahedronGeometry(1, 3);
    g.deleteAttribute('normal'); g.deleteAttribute('uv');
    g = mergeVertices(g);
    const p = g.attributes.position, r = rng(91 + v * 13);
    const ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU, r() * TAU];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const k = 1 + 0.085 * Math.sin(3 * a + ph[0]) + 0.05 * Math.sin(5 * a + ph[1]) + 0.035 * Math.sin(2 * a + ph[2]) + 0.02 * Math.sin(9 * a + ph[4]);
      p.setXYZ(i, x * k, y * (1 + 0.1 * Math.sin(2 * a + ph[3])), z * k);
    }
    g.computeVertexNormals();
    return g;
  });
}
export function makeInkDot(opts = {}) {
  const { r = 0.03, variant = 0, flat = 0.35 } = opts;
  const m = new THREE.Mesh(inkGeo(((variant % 4) + 4) % 4), envMat('#09090d', { roughness: 0.2 }, 0.55));
  m.scale.set(r, r * flat, r);
  m.castShadow = false; m.receiveShadow = true;
  m.name = 'InkDot';
  return m;
}

// ════════════════════════════════════════════════════════════════════════════════ 6. bingo cage
const CAGE_S = 0.3;
function cageGeos() {
  return G('cage', () => {
    const h = CAGE_S / 2, br = 0.0065;
    const bars = [];
    const C = [];
    for (const x of [-h, h]) for (const y of [-h, h]) for (const z of [-h, h]) C.push([x, y, z]);
    // 12 edges
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
      const a = C[i], b = C[j];
      const diff = (a[0] !== b[0]) + (a[1] !== b[1]) + (a[2] !== b[2]);
      if (diff === 1) bars.push(rod(a, b, br, 8));
    }
    // wire rails along X on the 4 faces parallel to the axle
    for (const s of [-h, h]) for (const q of [-h / 2, 0, h / 2]) {
      bars.push(rod([-h, s, q], [h, s, q], br * 0.75, 6, false));
      bars.push(rod([-h, q, s], [h, q, s], br * 0.75, 6, false));
    }
    // end faces: spokes from the hub to the corners + a mid ring of bars
    for (const x of [-h, h]) {
      for (const y of [-h, h]) for (const z of [-h, h]) bars.push(rod([x, 0, 0], [x, y, z], br * 0.8, 6, false));
      bars.push(xf(new THREE.CylinderGeometry(0.024, 0.024, 0.016, 18), [x, 0, 0], [0, 0, Math.PI / 2]));
    }
    // corner knobs + door latch on +Z
    const knob = new THREE.SphereGeometry(0.012, 12, 8);
    for (const c of C) bars.push(xf(knob, c));
    bars.push(rod([-0.05, h / 2, h], [0.05, h / 2, h], br * 1.2, 6));
    bars.push(rod([-0.05, -h / 2, h], [0.05, -h / 2, h], br * 1.2, 6));
    bars.push(xf(new THREE.SphereGeometry(0.009, 10, 8), [0.05, 0, h + 0.006]));
    // axle + crank arm (rotate with the cage)
    const ax0 = -(h + 0.07), ax1 = h + 0.105;
    bars.push(rod([ax0, 0, 0], [ax1, 0, 0], 0.007, 10));
    bars.push(rod([ax1 - 0.006, 0, 0], [ax1 - 0.006, 0.085, 0], 0.0075, 8));
    bars.push(xf(new THREE.SphereGeometry(0.011, 10, 8), [ax1 - 0.006, 0, 0]));
    const cage = merge(bars);
    const handle = lathe([[0, 0, 1], [0.011, 0, 1], [0.013, 0.006], [0.0125, 0.035], [0.015, 0.045], [0.0135, 0.052], [0, 0.054]], 14).rotateZ(-Math.PI / 2).translate(ax1, 0.085, 0);
    return { cage, handle };
  });
}
export function makeBingoCage(opts = {}) {
  const { speed = 0.9, pedestal = 0, balls = 8 } = opts;
  const h = CAGE_S / 2;
  const root = new THREE.Group(); root.name = 'BingoCage';
  const lift = new THREE.Group(); lift.position.y = pedestal; root.add(lift);
  if (pedestal > 0) {
    const pm = envMat('#7a1f2b', { roughness: 0.35 }, 0.25);
    root.add(mesh(lathe([[0, 0, 1], [0.2, 0, 1], [0.2, 0.025], [0.17, 0.045], [0.06, 0.06], [0.045, 0.08, 1], [0, 0.08]], 32), pm));
    root.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, Math.max(0.01, pedestal - 0.11), 20), pm, [0, 0.08 + (pedestal - 0.11) / 2, 0]));
    root.add(mesh(rbox(0.5, 0.03, 0.36, 0.03), pm, [0, pedestal - 0.015, 0]));
    root.add(mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 24).rotateX(Math.PI / 2), brass(), [0, pedestal - 0.04, 0]));
  }
  const baseH = 0.04;
  lift.add(mesh(rbox(0.52, baseH, 0.32, 0.05), envMat('#8a4b22', { roughness: 0.45 }, 0.25), [0, baseH / 2, 0]));
  lift.add(mesh(rbox(0.46, 0.012, 0.26, 0.03), envMat('#a65d2c', { roughness: 0.4 }, 0.25), [0, baseH + 0.006, 0]));
  const AH = baseH + CAGE_S * Math.SQRT1_2 + 0.035;
  // A-frame uprights + bearing hubs (static)
  const ux = h + 0.045, parts = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) parts.push(rod([sx * ux, baseH, sz * 0.105], [sx * ux, AH, 0], 0.0075, 8));
    parts.push(rod([sx * ux, baseH + 0.07, -0.08], [sx * ux, baseH + 0.07, 0.08], 0.005, 6));
    parts.push(xf(new THREE.CylinderGeometry(0.018, 0.018, 0.022, 16), [sx * ux, AH, 0], [0, 0, Math.PI / 2]));
    for (const sz of [-1, 1]) parts.push(xf(new THREE.SphereGeometry(0.013, 10, 8), [sx * ux, baseH + 0.006, sz * 0.105]));
  }
  lift.add(mesh(merge(parts), brass()));
  const cg = cageGeos();
  const cage = new THREE.Group(); cage.position.y = AH; lift.add(cage);
  cage.add(mesh(cg.cage, brass()));
  cage.add(mesh(cg.handle, envMat('#c8232e', { roughness: 0.35 }, 0.3)));
  // balls (instanced, static frame relative to the stand)
  const nb = clamp(balls, 0, 8);
  const ballR = 0.021;
  const im = new THREE.InstancedMesh(G('cageBall', () => new THREE.SphereGeometry(ballR, 16, 12)), envMat('#ffffff', { roughness: 0.25 }, 0.5), Math.max(1, nb));
  im.count = nb; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  const col = new THREE.Color();
  const pile = [[-0.09, 0.118, 0.05], [-0.045, 0.118, 0.34], [0, 0.118, -0.03], [0.045, 0.118, 0.27], [0.09, 0.118, 0.08],
    [-0.066, 0.076, 0.24], [0.01, 0.076, 0.12], [0.065, 0.076, 0.36]];
  const ballCols = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#4fb3ff', '#ff7a2f', '#8a5cff', '#ffffff', '#5bd65b'];
  for (let i = 0; i < nb; i++) im.setColorAt(i, col.set(ballCols[i]));
  lift.add(im);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new V3(), one = new V3(1, 1, 1);
  function update(t) {
    const ang = speed * t;
    cage.rotation.x = ang;
    const sg = speed === 0 ? 0 : Math.sign(speed);
    for (let i = 0; i < nb; i++) {
      const [x, rho, phi0] = pile[i];
      const phi = sg * 0.32 + phi0 * (sg || 1) + 0.13 * noise1(t * 1.4 + i * 3.7, i) * (sg ? 1 : 0);
      pv.set(x + 0.006 * noise1(t * 1.1 + i, i + 11) * Math.abs(sg), AH - rho * Math.cos(phi), -rho * Math.sin(phi));
      q.setFromAxisAngle(new V3(1, 0, 0), ang * 2.2 + i);
      m4.compose(pv, q, one);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { root, update, cage, axleHeight: AH, size: CAGE_S };
}

// ════════════════════════════════════════════════════════════════════════════════ 7. mic stand
let _grilleMat = null;
function grilleMat() {
  if (_grilleMat) return _grilleMat;
  const tex = canvasTexture(128, 64, (g, w, h) => {
    g.fillStyle = '#26262b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(150,150,160,0.55)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 4) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); }
    for (let y = 0; y < h; y += 4) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
  });
  _grilleMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.5, metalness: 0.35, envMap: studioEnv(), envMapIntensity: 0.5 * _envK });
  _envMats.push({ m: _grilleMat, base: 0.5 });
  return _grilleMat;
}
export function makeMicStand(opts = {}) {
  const { height = 1.5, tilt = 0.6 } = opts;
  const root = new THREE.Group(); root.name = 'MicStand';
  const black = envMat('#1b1c21', { roughness: 0.4 }, 0.35);
  root.add(mesh(G('micBase', () => lathe([[0, 0, 1], [0.148, 0, 1], [0.152, 0.006], [0.15, 0.018], [0.13, 0.028], [0.06, 0.036], [0.026, 0.042, 1], [0, 0.043]], 40)), black));
  const yC = Math.min(0.95, height * 0.62);
  root.add(mesh(new THREE.CylinderGeometry(0.0125, 0.0125, yC - 0.04, 14), chrome(), [0, 0.04 + (yC - 0.04) / 2, 0]));
  root.add(mesh(G('micClutch', () => lathe([[0, -0.03, 1], [0.017, -0.03, 1], [0.021, -0.024], [0.021, 0.024], [0.016, 0.03, 1], [0, 0.03]], 18)), black, [0, yC, 0]));
  root.add(mesh(new THREE.CylinderGeometry(0.0085, 0.0085, height - yC - 0.03, 12), chrome(), [0, yC + (height - yC - 0.03) / 2 + 0.01, 0]));
  root.add(mesh(rbox(0.024, 0.03, 0.03, 0.01), black, [0, height - 0.01, 0]));
  // mic: built along +Y, then tilted so the ball points toward −Z (the speaker) and up
  const mic = new THREE.Group(); mic.position.set(0, height + 0.005, 0); mic.rotation.x = -tilt; root.add(mic);
  mic.add(mesh(G('micHandle', () => lathe([[0, -0.03, 1], [0.0115, -0.03, 1], [0.0125, -0.026], [0.0175, 0.075], [0.0185, 0.082, 1], [0, 0.082]], 18)), envMat('#16171b', { roughness: 0.35 }, 0.4)));
  mic.add(mesh(G('micRing', () => new THREE.CylinderGeometry(0.024, 0.0195, 0.016, 20)), chrome(), [0, 0.088, 0]));
  mic.add(mesh(G('micBall', () => new THREE.SphereGeometry(0.043, 24, 16)), grilleMat(), [0, 0.126, 0]));
  const tip = new THREE.Object3D(); tip.position.set(0, 0.126, 0); mic.add(tip);
  root.userData.mic = tip;
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 8. DJ decks
const _recordMat = new Map();
function recordMat(label) {
  let m = _recordMat.get(label);
  if (m) return m;
  const tex = canvasTexture(256, 256, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#0b0b0e'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#121216'; g.beginPath(); g.arc(c, c, c - 1, 0, TAU); g.fill();
    for (let r = 44; r < c - 3; r += 1.6) {
      const tr = (r > 70 && r < 73) || (r > 96 && r < 99);
      g.strokeStyle = tr ? 'rgba(255,255,255,0.13)' : `rgba(255,255,255,${0.03 + 0.04 * hash(r)})`;
      g.lineWidth = 1; g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke();
    }
    g.fillStyle = label; g.beginPath(); g.arc(c, c, 40, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(c - 34, c - 6, 26, 12);       // stripe so the spin reads
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(c + 20, c + 14, 6, 0, TAU); g.fill();
    g.fillStyle = '#0b0b0e'; g.beginPath(); g.arc(c, c, 4, 0, TAU); g.fill();
  });
  m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.32, envMap: studioEnv(), envMapIntensity: 0.35 * _envK });
  _envMats.push({ m, base: 0.35 });
  _recordMat.set(label, m);
  return m;
}
function recordGeo() {
  return G('record', () => {
    const g = new THREE.CylinderGeometry(0.146, 0.146, 0.004, 48);
    const uv = g.attributes.uv, side = g.groups[0];
    const idx = g.index.array;
    for (let i = side.start; i < side.start + side.count; i++) uv.setXY(idx[i], 0.01, 0.01);   // edge = black corner
    g.clearGroups();
    return g;
  });
}
let _djFront = null;
function djFrontTex() {
  return (_djFront ??= canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#1c1e26'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 10;
    for (let x = -h; x < w + h; x += 26) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); }
    // big vinyl emblem
    const cx = w / 2, cy = h / 2;
    g.fillStyle = '#111217'; g.beginPath(); g.arc(cx, cy, 92, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2;
    for (let r = 40; r < 90; r += 7) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); }
    g.fillStyle = '#ff4fa3'; g.beginPath(); g.arc(cx, cy, 30, 0, TAU); g.fill();
    g.fillStyle = '#111217'; g.beginPath(); g.arc(cx, cy, 5, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 4; g.strokeRect(14, 14, w - 28, h - 28);
  }));
}
let _ledTex = null;
function ledTexture() {
  return (_ledTex ??= (() => {
    const t = canvasTexture(256, 8, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, 0);
      ['#ff4fa3', '#ffd23f', '#3ee0c8', '#4fb3ff', '#8a5cff', '#ff4fa3'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      for (let x = 0; x < w; x += 8) g.fillRect(x + 6, 0, 2, h);     // LED segments
    });
    t.wrapS = THREE.RepeatWrapping;
    return t;
  })());
}
export function makeDJDecks(opts = {}) {
  const W = 1.3, D = 0.62, TOP = 0.95, slabT = 0.05, bodyH = TOP - slabT;
  const root = new THREE.Group(); root.name = 'DJDecks';
  root.add(mesh(rbox(W, bodyH, D, 0.05), mat('#24262e', { roughness: 0.55 }), [0, bodyH / 2, 0]));
  const front = mesh(new THREE.PlaneGeometry(W - 0.1, bodyH - 0.2), new THREE.MeshStandardMaterial({ color: '#ffffff', map: djFrontTex(), roughness: 0.6 }), [0, bodyH / 2 - 0.01, D / 2 + 0.002]);
  front.castShadow = false; root.add(front);
  const lt = ledTexture().clone(); lt.needsUpdate = true;
  const ledMat = new THREE.MeshBasicMaterial({ color: '#ffffff', map: lt, toneMapped: false });
  const ledG = rbox(W - 0.05, 0.026, 0.014, 0.012);
  for (const y of [bodyH - 0.05, 0.06]) { const l = new THREE.Mesh(ledG, ledMat); l.position.set(0, y, D / 2 + 0.004); root.add(l); }
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(rbox(0.014, bodyH - 0.14, 0.026, 0.012), ledMat); l.position.set(sx * (W / 2 - 0.035), bodyH / 2 - 0.005, D / 2 + 0.004); root.add(l); }
  root.add(mesh(rbox(W + 0.04, slabT, D + 0.04, 0.03), mat('#121318', { roughness: 0.42 }), [0, bodyH + slabT / 2, 0]));
  // turntables
  const platters = [];
  const unitMat = mat('#aeb3bc', { roughness: 0.42 });
  const dark = mat('#1c1d22', { roughness: 0.5 });
  [[-1, '#ff4fa3'], [1, '#3ee0c8']].forEach(([sx, label], k) => {
    const u = new THREE.Group(); u.position.set(sx * 0.41, TOP, -0.01); root.add(u);
    u.add(mesh(rbox(0.44, 0.07, 0.38, 0.03), unitMat, [0, 0.035, 0]));
    const pl = new THREE.Group(); pl.position.set(-0.03 * sx, 0.07, 0); u.add(pl);
    pl.add(mesh(G('platter', () => lathe([[0, 0, 1], [0.152, 0, 1], [0.155, 0.003], [0.155, 0.011], [0.15, 0.014, 1], [0, 0.014]], 48)), chrome()));
    pl.add(mesh(recordGeo(), recordMat(label), [0, 0.016, 0]));
    pl.add(mesh(G('spindle', () => new THREE.CylinderGeometry(0.004, 0.004, 0.014, 8)), chrome(), [0, 0.022, 0]));
    platters.push({ pl, k });
    // tonearm (static), pivot at the back corner
    const tx = 0.165 * sx, tz = 0.12;
    const arm = merge([
      xf(new THREE.CylinderGeometry(0.022, 0.025, 0.02, 16), [tx, 0.08, tz]),
      rod([tx, 0.1, tz], [tx - 0.02 * sx, 0.1, tz - 0.19], 0.0042, 8),
      rod([tx, 0.1, tz], [tx + 0.006 * sx, 0.1, tz + 0.05], 0.0048, 8),
      xf(new THREE.CylinderGeometry(0.012, 0.012, 0.022, 12), [tx + 0.006 * sx, 0.1, tz + 0.05], [Math.PI / 2, 0, 0]),
    ]);
    u.add(mesh(arm, chrome()));
    u.add(mesh(rbox(0.024, 0.012, 0.042, 0.006), dark, [tx - 0.02 * sx, 0.096, tz - 0.205], [0, 0.1 * sx, 0]));
    u.add(mesh(rbox(0.05, 0.01, 0.035, 0.006), dark, [0.165 * sx, 0.073, -0.15]));               // start/stop
    u.add(mesh(rbox(0.016, 0.006, 0.13, 0.004), dark, [-0.19 * sx, 0.072, -0.07]));              // pitch slot
    u.add(mesh(rbox(0.028, 0.012, 0.018, 0.005), mat('#e8e8ea', { roughness: 0.4 }), [-0.19 * sx, 0.078, -0.06 + 0.03 * k]));
  });
  // mixer
  const mx = new THREE.Group(); mx.position.set(0, TOP, -0.01); root.add(mx);
  mx.add(mesh(rbox(0.22, 0.08, 0.36, 0.025), mat('#2f323b', { roughness: 0.5 }), [0, 0.04, 0]));
  const knobs = [];
  for (const x of [-0.05, 0.05]) for (const z of [0.12, 0.07, 0.02]) knobs.push(xf(new THREE.CylinderGeometry(0.011, 0.012, 0.014, 12), [x, 0.087, z]));
  mx.add(mesh(merge(knobs), mat('#e3e5ea', { roughness: 0.4 })));
  const slots = [rbox(0.008, 0.004, 0.1, 0.002), rbox(0.008, 0.004, 0.1, 0.002), rbox(0.09, 0.004, 0.008, 0.002)];
  mx.add(mesh(merge([xf(slots[0], [-0.05, 0.081, -0.06]), xf(slots[1], [0.05, 0.081, -0.06]), xf(slots[2], [0, 0.081, -0.15])]), mat('#0d0d10')));
  const caps = merge([xf(rbox(0.026, 0.014, 0.014, 0.004), [-0.05, 0.088, -0.04]), xf(rbox(0.026, 0.014, 0.014, 0.004), [0.05, 0.088, -0.08]), xf(rbox(0.014, 0.014, 0.026, 0.004), [0.012, 0.088, -0.15])]);
  mx.add(mesh(caps, mat('#f4f4f6', { roughness: 0.35 })));
  // level meters: 2 × 8 LEDs
  const meterMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  const meters = new THREE.InstancedMesh(G('meterLed', () => new THREE.BoxGeometry(0.012, 0.004, 0.008)), meterMat, 16);
  meters.castShadow = false; meters.frustumCulled = false;
  const ledCol = (i, on) => { const c = i < 5 ? '#39e05a' : i < 7 ? '#ffd23f' : '#ff3b3b'; return new THREE.Color(on ? c : shade(c, -0.82)); };
  for (let s = 0; s < 2; s++) for (let i = 0; i < 8; i++) {
    meters.setMatrixAt(s * 8 + i, new THREE.Matrix4().makeTranslation(-0.012 + s * 0.024, 0.082, -0.005 + i * 0.012));
    meters.setColorAt(s * 8 + i, ledCol(i, false));
  }
  mx.add(meters);
  let on = opts.on ?? true;
  function update(t) {
    for (const { pl, k } of platters) pl.rotation.y = on ? -t * 3.49 - k * 1.7 : -k * 1.7;
    lt.offset.x = on ? -((t * 0.25) % 1) : 0;
    ledMat.color.set(on ? '#ffffff' : '#16171c');
    const ph = (((t * 2) % 1) + 1) % 1;
    const kick = on ? Math.exp(-ph * 6) : 0;
    for (let s = 0; s < 2; s++) {
      const lvl = on ? clamp(0.35 + 0.55 * kick + 0.15 * noise1(t * 7 + s * 5, s + 2), 0, 1) : 0;
      const n = Math.round(lvl * 8);
      for (let i = 0; i < 8; i++) meters.setColorAt(s * 8 + i, ledCol(i, i < n));
    }
    meters.instanceColor.needsUpdate = true;
  }
  update(0);
  return { root, update, setOn(v) { on = !!v; } };
}

// ════════════════════════════════════════════════════════════════════════════════ 9. spoon + fork
const EXT = { depth: 0.0034, bevelEnabled: true, bevelThickness: 0.0009, bevelSize: 0.0006, bevelSegments: 2, curveSegments: 12 };
function handleSide(s, right) {
  // from the neck down one side, round the bottom, back up the other side
  if (right) {
    s.bezierCurveTo(0.0055, 0.085, 0.0118, 0.05, 0.0118, 0.016);
    s.absarc(0, 0.016, 0.0118, 0, Math.PI, true);
    s.bezierCurveTo(-0.0118, 0.05, -0.0055, 0.085, -0.0042, 0.12);
  }
}
function finishFlat(g) {
  g.computeBoundingBox();
  const b = g.boundingBox;
  g.translate(0, -b.min.y, -(b.min.z + b.max.z) / 2);
  g.computeVertexNormals();
  return g;
}
function spoonGeo() {
  return G('spoon', () => {
    const s = new THREE.Shape();
    s.moveTo(0.0042, 0.132); s.lineTo(0.0042, 0.12);
    handleSide(s, true);
    s.lineTo(-0.0042, 0.132); s.closePath();
    const handle = new THREE.ExtrudeGeometry(s, EXT);
    handle.computeBoundingBox();
    const y0 = handle.boundingBox.min.y, zc = (handle.boundingBox.min.z + handle.boundingBox.max.z) / 2;
    handle.translate(0, -y0, -zc);
    const bowl = new THREE.SphereGeometry(1, 28, 14, 0, TAU, 0, Math.PI / 2).rotateX(-Math.PI / 2).scale(0.0215, 0.032, 0.011).translate(0, 0.149 - y0, 0.0012);
    const rim = new THREE.TorusGeometry(1, 0.06, 6, 40).scale(0.0215, 0.032, 1).translate(0, 0.149 - y0, 0.0012);
    const rimFix = rim.attributes.position;
    for (let i = 0; i < rimFix.count; i++) rimFix.setZ(i, rimFix.getZ(i) * 0.0013 / 0.06 + 0.0012);
    rim.computeVertexNormals();
    return merge([handle, bowl, rim]);
  });
}
function forkGeo() {
  return G('fork', () => {
    const s = new THREE.Shape();
    const hw = 0.0125, tw = 0.0038, n = 4, gp = (2 * hw - n * tw) / (n - 1), tipY = 0.181, gapY = 0.143;
    s.moveTo(-0.0042, 0.12);
    // up the left neck/flare (neck → head)
    s.bezierCurveTo(-0.0045, 0.128, -hw, 0.128, -hw, 0.138);
    for (let i = 0; i < n; i++) {
      const xl = -hw + i * (tw + gp), xr = xl + tw;
      s.lineTo(xl, tipY - tw / 2);
      s.absarc(xl + tw / 2, tipY - tw / 2, tw / 2, Math.PI, 0, true);
      if (i < n - 1) { s.lineTo(xr, gapY + gp / 2); s.absarc(xr + gp / 2, gapY + gp / 2, gp / 2, Math.PI, 0, false); }
    }
    s.lineTo(hw, 0.138);
    s.bezierCurveTo(hw, 0.128, 0.0045, 0.128, 0.0042, 0.12);
    handleSide(s, true);
    s.closePath();
    return finishFlat(new THREE.ExtrudeGeometry(s, EXT));
  });
}
export function makeSpoon() {
  const g = new THREE.Group(); g.name = 'Spoon';
  g.add(mesh(spoonGeo(), silver()));
  return g;
}
export function makeFork() {
  const g = new THREE.Group(); g.name = 'Fork';
  g.add(mesh(forkGeo(), silver()));
  return g;
}

// ════════════════════════════════════════════════════════════════════════════════ 10. top hat
export const TOPHAT_MATCH_SCALE = 0.386 / 0.32;
function hatGeos() {
  return G('tophat', () => ({
    // unscaled = the characters.js accessory dimensions (0.386 tall)
    brim: lathe([[0, 0.0, 1], [0.24, 0.0], [0.285, 0.004], [0.306, 0.012], [0.313, 0.022], [0.309, 0.031], [0.297, 0.033], [0.28, 0.027], [0.24, 0.024], [0.2, 0.024, 1], [0, 0.024, 1]], 44),
    crown: lathe([[0.215, 0.018, 1], [0.214, 0.12], [0.209, 0.3], [0.206, 0.368], [0.2, 0.38], [0.188, 0.385], [0.16, 0.386, 1], [0, 0.386, 1]], 40),
    band: lathe([[0.212, 0.026, 1], [0.2195, 0.026, 1], [0.2205, 0.03], [0.2205, 0.084], [0.2195, 0.088, 1], [0.212, 0.088, 1]], 40),
    buckle: rbox(0.075, 0.05, 0.012, 0.012),
    hole: rbox(0.045, 0.026, 0.008, 0.006),
  }));
}
export function makeTopHatProp(opts = {}) {
  const { scale = 1, band = '#b3202a', color = '#1c1c22' } = opts;
  const A = hatGeos();
  const root = new THREE.Group(); root.name = 'TopHat';
  const inner = new THREE.Group(); inner.scale.setScalar((0.32 / 0.386) * scale); root.add(inner);
  const felt = envMat(color, { roughness: 0.42 }, 0.35);
  inner.add(mesh(A.brim, felt));
  inner.add(mesh(A.crown, felt));
  inner.add(mesh(A.band, mat(band, { roughness: 0.55 })));
  inner.add(mesh(A.buckle, brass(), [0, 0.057, 0.222]));
  inner.add(mesh(A.hole, mat(band, { roughness: 0.55 }), [0, 0.057, 0.226]));
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 11. toupee
function toupeeGeo() {
  return G('toupee', () => {
    // base: a squashed, scalloped mat (wavy "lock" edge), slightly lifted at the front
    const g = new THREE.SphereGeometry(1, 54, 14);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const k = 1 + 0.055 * Math.pow(Math.abs(Math.sin(4.5 * a + 0.4)), 0.6) - 0.03 + 0.04 * Math.max(0, Math.sin(a));
      x *= k * 0.155; z *= k * 0.135;
      y = y > 0 ? y * 0.02 : y * 0.008;
      if (z > 0.07) y += (z - 0.07) * 0.2;
      p.setXYZ(i, x, y, z);
      uv.setXY(i, x / 0.34 + 0.5, z / 0.3 + 0.5);
    }
    g.computeVertexNormals();
    // combed locks: elongated lumps lying across the top (comb-over toward +X), two tones
    const locksA = [], locksB = [];
    const lock = new THREE.SphereGeometry(1, 18, 8);
    {
      const lp = lock.attributes.position;
      for (let i = 0; i < lp.count; i++) {
        const x = lp.getX(i), cs = Math.sqrt(Math.max(1e-6, 1 - x * x)), g2 = Math.pow(1 - Math.abs(x), 0.7) * (x > 0 ? 1 : 1.15);
        const f = Math.min(1.4, g2 / cs);
        lp.setXYZ(i, x, lp.getY(i) * f, lp.getZ(i) * f + 0.35 * x * x - 0.1);    // pointed ends, gentle comb curve
      }
      lock.computeVertexNormals();
    }
    const rows = [-0.088, -0.044, 0.0, 0.044, 0.084];
    rows.forEach((z, j) => {
      const xs = j === 4 ? [-0.035, 0.05] : [-0.075, 0.0, 0.075];
      xs.forEach((x, i) => {
        const len = j === 4 ? 0.065 : 0.07 - Math.abs(z) * 0.15;
        ((i + j) % 2 ? locksB : locksA).push(xf(lock, [x + j * 0.006, 0.013 + (j === 4 ? 0.006 : 0), z], [0, 0.18 - j * 0.04, 0.05], [len, 0.014, 0.034]));
      });
    });
    // a big front curl and two little ones at the back
    locksA.push(xf(new THREE.TorusGeometry(0.023, 0.0095, 10, 20, Math.PI * 1.5), [0.03, 0.036, 0.106], [0, Math.PI / 2 + 0.25, 0.35]));
    const curl = new THREE.TorusGeometry(0.014, 0.006, 8, 14, Math.PI * 1.3);
    for (const [x, z, ry] of [[-0.07, -0.11, 0.45], [0.05, -0.112, -0.4]]) locksB.push(xf(curl, [x, 0.02, z], [0, Math.PI / 2 + ry, 0.6]));
    return { body: g, locksA: merge(locksA), locksB: merge(locksB) };
  });
}
const _hairMat = new Map();
function hairMat(color) {
  let m = _hairMat.get(color);
  if (m) return m;
  const tex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    const r = rng(23), dk = shade(color, -0.4);
    g.lineCap = 'round'; g.strokeStyle = dk;
    for (let i = 0; i < 22; i++) {
      const y0 = (i + 0.5) * (h / 22) + (r() - 0.5) * 6, ph = r() * TAU;
      g.globalAlpha = 0.18 + r() * 0.14; g.lineWidth = 3 + r() * 4;
      g.beginPath();
      for (let x = -4; x <= w + 4; x += 8) { const y = y0 + Math.sin(x * 0.02 + ph) * 3; if (x < 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 0.85; g.strokeStyle = shade(color, -0.6); g.lineWidth = 4;
    g.beginPath(); g.moveTo(w * 0.12, h * 0.33); g.bezierCurveTo(w * 0.4, h * 0.3, w * 0.7, h * 0.34, w * 0.9, h * 0.31); g.stroke();
    g.globalAlpha = 1;
  });
  m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.62 });
  _hairMat.set(color, m);
  return m;
}
export function makeToupee(opts = {}) {
  const { color = '#5a4a3a' } = opts;
  const A = toupeeGeo();
  const root = new THREE.Group(); root.name = 'Toupee';
  root.add(mesh(A.body, hairMat(color)));
  root.add(mesh(A.locksA, mat(color, { roughness: 0.55 })));
  root.add(mesh(A.locksB, mat(shade(color, -0.1), { roughness: 0.55 })));
  return root;
}

// ════════════════════════════════════════════════════════════════════════════════ 12. hearing aid
function aidGeos() {
  return G('aid', () => {
    const bodyC = new THREE.CatmullRomCurve3([new V3(0, -0.0195, -0.004), new V3(0, -0.006, -0.0085), new V3(0, 0.008, -0.0082), new V3(0, 0.019, -0.0035)]);
    const R = 0.0074;
    const body = merge([
      new THREE.TubeGeometry(bodyC, 16, R, 12, false),
      xf(new THREE.SphereGeometry(R, 12, 8), bodyC.getPoint(0).toArray()),
      xf(new THREE.SphereGeometry(R, 12, 8), bodyC.getPoint(1).toArray()),
    ]);
    const hookC = new THREE.CatmullRomCurve3([new V3(0, 0.024, -0.0015), new V3(0, 0.03, 0.006), new V3(0, 0.026, 0.0145), new V3(0, 0.015, 0.0185), new V3(0, 0.006, 0.0175)]);
    const hook = merge([new THREE.TubeGeometry(hookC, 20, 0.0021, 8, false), xf(new THREE.CylinderGeometry(0.0035, 0.0028, 0.007, 10), [0, 0.0235, -0.0025], [0.4, 0, 0])]);
    const tip = xf(new THREE.SphereGeometry(0.0052, 12, 8), [0, 0.0035, 0.0172], [0, 0, 0], [1, 1.2, 1]);
    const button = xf(new THREE.CylinderGeometry(0.0028, 0.0028, 0.002, 10), [0, 0.006, -0.0158], [Math.PI / 2 + 0.05, 0, 0]);
    return { body, hook, tip, button };
  });
}
export function makeHearingAid() {
  const A = aidGeos();
  const root = new THREE.Group(); root.name = 'HearingAid';
  root.add(mesh(A.body, envMat('#d0a77a', { roughness: 0.42 }, 0.35)));
  root.add(mesh(A.hook, envMat('#f6f3ee', { roughness: 0.2 }, 0.5)));
  root.add(mesh(A.tip, envMat('#fbf8f3', { roughness: 0.35 }, 0.3)));
  root.add(mesh(A.button, mat('#7a5a3c', { roughness: 0.5 })));
  return root;
}
