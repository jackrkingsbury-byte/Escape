// Module C — props (SPEC.md §7): chess set, chess clock, party + household props.
// Everything is deterministic: animated things are pure functions of the u / t passed in.
//
// ── Spec exports ────────────────────────────────────────────────────────────────────────────────
//   makeChessSet(opts)   → ChessSet          makeChessClock(opts) → { root, press, setTimes, update }
//   makePartyHat(color)  → Object3D          makeCake(opts)       → { root, update(t) }
//   makeTable(opts)      → Object3D          makeChair(opts)      → Object3D
//   makeBed(opts)        → Object3D          makePlate(opts)      → { root, food }
//   makeSpeaker(opts)    → { root, update }  makeBalloon(color)   → Object3D
//   makeConfetti(opts)   → { root, update }  makeSweatDrop()      → Object3D
//   makeImpactBurst(opts)→ { root, update(u) }
//
// ── Extras / details (all optional) ─────────────────────────────────────────────────────────────
// ChessSet
//   .size .playSize .squareSize
//   .thickness   board top = root (y=0); the board's underside is at y = -thickness.
//                → put the root at tableTop + chess.thickness so the board sits ON the table.
//   .floorY      where knockAll() lands pieces that leave the board (default -thickness = table top).
//   .content     inner group (board + pieces) that hops a few mm on slam(); root itself is never moved.
//   opts.filesAlong '+x' (default, = spec) | '-x'. NOTE: the spec layout (white on −Z, files a..h along
//                +X) is the mirror image of a real board as seen from white's chair (a-file on white's
//                RIGHT). Pass { filesAlong: '-x' } for real-chess handedness; squareToLocal() follows.
//   move(from, to, u, { arc=1, tilt=1, spin=0 })   arc = lift height multiplier, spin = extra yaw (rad)
//   slam(sq, u, { strength=1 })                    also hops the board a few mm at u≈0..0.16
//   topple(sq, u, { toward:'e6' | dir:rad, roll=1 })   default: toward the board's middle (±Z), or the
//                                                  first free direction if a piece is in the way
//                                                  (dir is an angle in the board XZ plane: 0=+X, π/2=+Z)
//   knockAll(u, seed=1, { origin:[x,z], floorY, maxX, maxZ })   origin = where the sweep comes from
//                                                  (default the +Z edge, i.e. black's side / the pigeon)
//   highlight(sq, color) · highlight(sq, null) removes · highlight(null) clears all.
//                reset() clears highlights, setFEN() keeps them.
//   fen() → placement of the last reset/setFEN.   pieceInfo(sq) → { type, white, object } | null
//   move/slam/topple can be combined in one frame (e.g. setFEN → move → topple); each sets absolute values.
// ChessClock
//   'L'/'R' are the clock's OWN left/right, like a character facing +Z: L = +X side, R = −X side.
//   Dials face +Z, origin at the bottom centre, ~0.27 wide. Hands are real meshes (no texture uploads).
//   press(side, u): that button goes down (deepest at u=0.5) and back, the other pops up slightly.
//   setTimes(lSec, rSec); update(t) only animates a fallen flag (time ≤ 0) — cheap no-op otherwise.
//   opts.buttonColors ['#e8412c', '#e8412c'], opts.wood.
// makeCake({ candles=5, frosting, scale=1 })  ~0.3 wide, candle flames flicker in update(t).
// makeSpeaker({ on=true }) → { root, update(t), setOn(bool) }  — call setOn(false) for "no music" shots.
// makeBalloon(color, { string=0.85 })  origin = bottom end of the string, balloon floats above it.
// makeConfetti({ origin=[0,0,0], t0=0, count=120, speed=5.5, spread=0.75, dir=[0,1,0], groundY=0,
//                size=1, life=Infinity, seed=1, colors })   pieces land and lie flat on groundY.
// makeImpactBurst({ size=0.22, overlay=true }) put root ON the table top at the impact point; update(u) u∈[0,1].
//   A camera-facing comic star (drawn on top of everything when overlay=true) + a shock ring + impact lines.
// makeSweatDrop({ size=0.12 }) origin at the drop centre, outlined so it reads at phone size.
// makeTable({ w=1.2, d=0.75, h=0.78, wood }) .userData.top = h.   makeChair({ wood }) seat 0.55, faces +Z.
// makeBed({ w=1.0, l=2.05, blanket }) long axis along Z, headboard at −Z.
// makePartyHat(color, { scale=1 }) origin at the brim centre, ~0.32 tall.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, clamp, lerp, smooth, ease, hash, noise1, canvasTexture, rbox, mat } from './lib/util.js';

const V3 = THREE.Vector3, V2 = THREE.Vector2;
const UP = new V3(0, 1, 0);
const TAU = Math.PI * 2;
const FONT = '"DejaVu Sans", "Helvetica Neue", Arial, sans-serif';

// ════════════════════════════════════════════════════════════════════════════════ geometry helpers
/** Lathe with per-point crease control. pts: [[r, y, hard?], ...] from bottom centre to top centre. */
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

/** Points on a circular arc in the (r, y) profile plane, angles in degrees (-90 bottom .. 90 top). */
function arc(cy, rad, a0, a1, step = 15, cr = 0) {
  const out = [];
  const n = Math.max(1, Math.round(Math.abs(a1 - a0) / step));
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + (a1 - a0) * (i / n)) * Math.PI) / 180;
    out.push([cr + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  return out;
}

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
/** Clone + transform a geometry. */
function xf(g, p = [0, 0, 0], r = [0, 0, 0], sc = 1) {
  const s3 = Array.isArray(sc) ? sc : [sc, sc, sc];
  _m4.compose(new V3(...p), _q.setFromEuler(_e.set(r[0], r[1], r[2])), new V3(...s3));
  return g.clone().applyMatrix4(_m4);
}

function prep(g) {
  let h = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(h.attributes)) if (!['position', 'normal', 'uv'].includes(k)) h.deleteAttribute(k);
  if (!h.attributes.uv) h.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((h.attributes.position.count) * 2), 2));
  h.clearGroups();
  return h;
}
function merge(list) { return mergeGeometries(list.map(prep), false); }

function shadowy(o, cast = true, receive = true) {
  o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = receive; } });
  return o;
}

function mesh(geo, material, p, r, sc) {
  const m = new THREE.Mesh(geo, material);
  if (p) m.position.set(p[0], p[1], p[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  if (sc != null) { if (Array.isArray(sc)) m.scale.set(sc[0], sc[1], sc[2]); else m.scale.setScalar(sc); }
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ════════════════════════════════════════════════════════════════════════════════ wood textures
function drawGrain(g, x, y, w, h, { base, dark = '#000000', light = '#ffffff', seed = 1, along = 'x', density = 1, waves = 1, alpha = 1 }) {
  const r = rng(seed);
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = base; g.fillRect(x, y, w, h);
  const L = along === 'x' ? w : h, Wd = along === 'x' ? h : w;
  const line = (off, amp, fr, ph) => {
    g.beginPath();
    for (let t = -8; t <= L + 8; t += 10) {
      const o = off + Math.sin(t * fr + ph) * amp + Math.sin(t * fr * 2.7 + ph * 1.7) * amp * 0.35;
      if (along === 'x') { if (t < 0) g.moveTo(x + t, y + o); else g.lineTo(x + t, y + o); }
      else { if (t < 0) g.moveTo(x + o, y + t); else g.lineTo(x + o, y + t); }
    }
    g.stroke();
  };
  // broad soft bands
  const nb = Math.ceil((Wd / 22) * density);
  for (let i = 0; i < nb; i++) {
    g.strokeStyle = r() < 0.5 ? dark : light;
    g.globalAlpha = (0.025 + r() * 0.05) * alpha;
    g.lineWidth = 4 + r() * 10;
    line(r() * Wd, (1 + r() * 4) * waves, 0.002 + r() * 0.006, r() * TAU);
  }
  // fine grain lines
  const n = Math.ceil((Wd / 3.2) * density);
  for (let i = 0; i < n; i++) {
    g.strokeStyle = r() < 0.7 ? dark : light;
    g.globalAlpha = (0.035 + r() * 0.11) * alpha;
    g.lineWidth = 0.6 + r() * 1.5;
    line(r() * Wd, (0.4 + r() * 2.4) * waves, 0.003 + r() * 0.011, r() * TAU);
  }
  g.restore();
  g.globalAlpha = 1;
}

const _woodTex = new Map();
function woodTexture(base = '#b9824f', seed = 3) {
  const key = base + seed;
  if (!_woodTex.has(key)) {
    _woodTex.set(key, canvasTexture(512, 256, (g, w, h) => {
      drawGrain(g, 0, 0, w, h, { base, dark: '#3b2412', light: '#fff3d6', seed, along: 'x', density: 1.1 });
    }));
  }
  return _woodTex.get(key);
}
const _woodMat = new Map();
function woodMat(base = '#b9824f', rough = 0.62, seed = 3) {
  const key = base + rough + seed;
  if (!_woodMat.has(key)) _woodMat.set(key, new THREE.MeshStandardMaterial({ color: '#ffffff', map: woodTexture(base, seed), roughness: rough, metalness: 0 }));
  return _woodMat.get(key);
}

// ════════════════════════════════════════════════════════════════════════════════ chess pieces
export const IVORY = '#f5efe0', EBONY = '#2a2626';
const PIECE_ROUGH = 0.35;
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const JIT = { p: 0.5, r: 0.5, n: 0.09, b: 0.35, q: 0.4, k: 0.09 };
const TYPE_CODE = { p: 1, r: 2, n: 3, b: 4, q: 5, k: 6 };
const KNIGHT_TURN = 0.95;   // knights face 54° toward the board's middle files

/** Common Staunton base: chamfered foot, rounded top edge, a ledge and a bead ring. Ends at the stem. */
function baseProfile(R) {
  return [
    [0, 0, 1], [R - 0.016, 0, 1], [R, 0.016, 1],
    [R, 0.056], [R - 0.01, 0.083], [R - 0.038, 0.1], [R - 0.074, 0.106, 1],
    [R - 0.08, 0.118], [R - 0.056, 0.142], [R - 0.08, 0.167], [R - 0.115, 0.178, 1],
  ];
}
/** A collar (two-step ring with chamfers) at height y, outer radius ro, inner neck radius ri. */
function collar(y, ro, ri, h = 0.07) {
  return [[ri, y, 1], [ro - 0.022, y + 0.012, 1], [ro, y + h * 0.36], [ro, y + h * 0.62], [ro - 0.022, y + h * 0.88, 1], [ri - 0.01, y + h, 1]];
}

const PIECE_DEF = {};
function pieceDef(type) {
  if (PIECE_DEF[type]) return PIECE_DEF[type];
  let body, eyes = null, R, H, Rm;
  if (type === 'p') {
    R = 0.34;
    body = lathe([
      ...baseProfile(R),
      [0.18, 0.3], [0.145, 0.42], [0.132, 0.46, 1],
      ...collar(0.46, 0.228, 0.13, 0.095),
      ...arc(0.748, 0.2, -58, 90, 12),
    ], 32);
    H = 0.948; Rm = 0.22;
  } else if (type === 'r') {
    R = 0.37;
    const tower = lathe([
      ...baseProfile(R),
      [0.24, 0.29], [0.226, 0.6], [0.232, 0.64],
      [0.258, 0.68], [0.29, 0.715], [0.304, 0.738, 1],
      [0.32, 0.752, 1], [0.32, 0.884, 1], [0.305, 0.9, 1],
      [0.2, 0.9, 1], [0, 0.9, 1],
    ], 32);
    const parts = [tower];
    const mer = rbox(0.175, 0.2, 0.118, 0.026, 2);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * (Math.PI / 2);
      parts.push(xf(mer, [Math.sin(a) * 0.255, 0.888 + 0.1, Math.cos(a) * 0.255], [0, a, 0]));
    }
    body = merge(parts);
    H = 1.088; Rm = 0.28;
  } else if (type === 'n') {
    R = 0.37;
    const ped = lathe([
      ...baseProfile(R),
      [0.248, 0.214], [0.272, 0.244], [0.278, 0.266, 1], [0.262, 0.28, 1], [0, 0.28, 1],
    ], 32);
    const B = (w, h, d, r) => rbox(w, h, d, r, 2);
    const parts = [ped,
      xf(B(0.3, 0.28, 0.33, 0.08), [0, 0.39, 0.035], [0.05, 0, 0]),          // chest
      xf(B(0.285, 0.6, 0.32, 0.075), [0, 0.55, -0.045], [0.24, 0, 0]),        // neck
      xf(B(0.3, 0.22, 0.25, 0.08), [0, 0.88, -0.03], [0.35, 0, 0]),           // cheeks / jowl
      xf(B(0.262, 0.25, 0.5, 0.085), [0, 0.935, 0.095], [0.56, 0, 0]),        // head
      xf(B(0.232, 0.205, 0.2, 0.08), [0, 0.795, 0.305], [0.56, 0, 0]),        // muzzle
      xf(B(0.066, 0.16, 0.078, 0.028), [0.074, 1.11, -0.055], [-0.22, 0, -0.2]),  // ears
      xf(B(0.066, 0.16, 0.078, 0.028), [-0.074, 1.11, -0.055], [-0.22, 0, 0.2]),
    ];
    for (let i = 0; i < 4; i++) parts.push(xf(B(0.115, 0.15, 0.115, 0.04), [0, 1.03 - i * 0.15, -0.16 - i * 0.034], [0.22, 0, 0]));  // mane
    body = merge(parts);
    const eye = new THREE.SphereGeometry(0.034, 12, 8);
    eyes = merge([xf(eye, [0.13, 0.958, 0.08], [0, 0, 0], [0.6, 1, 1]), xf(eye, [-0.13, 0.958, 0.08], [0, 0, 0], [0.6, 1, 1])]);
    H = 1.2; Rm = 0.26;
  } else if (type === 'b') {
    R = 0.355;
    body = lathe([
      ...baseProfile(R),
      [0.19, 0.31], [0.146, 0.5], [0.134, 0.58, 1],
      ...collar(0.58, 0.238, 0.132, 0.09),
      [0.14, 0.705], [0.18, 0.765], [0.205, 0.835], [0.209, 0.905], [0.192, 0.985], [0.158, 1.055], [0.108, 1.115], [0.058, 1.158], [0.036, 1.172, 1],
      [0.05, 1.188], [0.068, 1.213], [0.073, 1.243], [0.064, 1.273], [0.042, 1.294], [0.0, 1.304],
    ], 32);
    H = 1.304; Rm = 0.22;
  } else if (type === 'q') {
    R = 0.385;
    const cup = lathe([
      ...baseProfile(R),
      [0.215, 0.33], [0.158, 0.58], [0.148, 0.68, 1],
      ...collar(0.68, 0.258, 0.15, 0.1),
      [0.158, 0.83], [0.19, 0.94], [0.235, 1.06], [0.262, 1.108, 1], [0.27, 1.138, 1], [0.25, 1.158, 1],
      [0.2, 1.165], [0.15, 1.19], [0.105, 1.235], [0.07, 1.268, 1], [0, 1.268, 1],
    ], 32);
    const parts = [cup];
    const ball = new THREE.SphereGeometry(0.043, 10, 8);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; parts.push(xf(ball, [Math.sin(a) * 0.246, 1.17, Math.cos(a) * 0.246])); }
    parts.push(xf(new THREE.SphereGeometry(0.074, 16, 12), [0, 1.33, 0]));
    body = merge(parts);
    H = 1.404; Rm = 0.24;
  } else { // king
    R = 0.395;
    const crown = lathe([
      ...baseProfile(R),
      [0.225, 0.35], [0.165, 0.64], [0.155, 0.74, 1],
      ...collar(0.74, 0.272, 0.158, 0.105),
      [0.168, 0.9], [0.2, 1.01], [0.24, 1.11], [0.262, 1.158, 1], [0.268, 1.19, 1], [0.248, 1.21, 1],
      [0.215, 1.225], [0.17, 1.28], [0.11, 1.32], [0.055, 1.337], [0, 1.34],
    ], 32);
    body = merge([crown,
      xf(rbox(0.1, 0.06, 0.1, 0.02, 2), [0, 1.355, 0]),
      xf(rbox(0.088, 0.27, 0.088, 0.024, 2), [0, 1.47, 0]),
      xf(rbox(0.236, 0.082, 0.088, 0.024, 2), [0, 1.495, 0]),
    ]);
    H = 1.605; Rm = 0.25;
  }
  body.computeBoundingSphere();
  PIECE_DEF[type] = { type, body, eyes, R, H, Rm, rest: [] };
  return PIECE_DEF[type];
}

/** Resting contact for a piece falling toward local angle a: { theta (tilt when lying), rb (rim radius) }. */
function restInfo(type, aLocal) {
  const def = pieceDef(type);
  const N = 32;
  let i = Math.round((aLocal / TAU) * N) % N; if (i < 0) i += N;
  if (!def.rest[i]) {
    const a = (i / N) * TAU, cx = Math.cos(a), cz = Math.sin(a);
    const p = def.body.attributes.position.array;
    let rb = 0;
    for (let j = 0; j < p.length; j += 3) if (p[j + 1] < 0.03) rb = Math.max(rb, p[j] * cx + p[j + 2] * cz);
    let th = Math.PI;
    for (let j = 0; j < p.length; j += 3) {
      const y = p[j + 1];
      if (y > 0.06) th = Math.min(th, Math.PI / 2 + Math.atan2(rb - (p[j] * cx + p[j + 2] * cz), y));
    }
    def.rest[i] = { theta: th, rb };
  }
  return def.rest[i];
}

// bishop mitre slit: painted groove (texture per colour; material colour white)
const _slitMat = {};
function bishopMat(white) {
  const key = white ? 'w' : 'b';
  if (_slitMat[key]) return _slitMat[key];
  const def = pieceDef('b');
  const pts = def.body.userData?.pts;
  const vv = def.body.userData?.v;
  // body is a plain lathe for the bishop → userData kept. find v for y on the mitre
  const vAtY = (y) => { for (let i = 1; i < pts.length; i++) if (pts[i].y >= y && pts[i - 1].y < y && pts[i].y > 0.69) { const f = (y - pts[i - 1].y) / (pts[i].y - pts[i - 1].y); return lerp(vv[i - 1], vv[i], f); } return 0.8; };
  const vHi = vAtY(1.07), vLo = vAtY(0.8);
  const tex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = white ? IVORY : EBONY; g.fillRect(0, 0, w, h);
    const x0 = 0.035 * w, y0 = (1 - vHi) * h, x1 = 0.2 * w, y1 = (1 - vLo) * h;
    g.lineCap = 'round';
    g.strokeStyle = white ? '#c9b994' : '#4e4646'; g.lineWidth = 14; g.beginPath(); g.moveTo(x0, y0 + 3); g.lineTo(x1, y1 + 3); g.stroke();   // lit lower lip
    g.strokeStyle = white ? '#6e5f45' : '#0b0909'; g.lineWidth = 10; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();         // groove
  });
  _slitMat[key] = studioize(new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: PIECE_ROUGH, metalness: 0 }), GLOSS[key]);
  return _slitMat[key];
}
// Glossy "studio" reflections used ONLY by chess materials: analytic soft boxes + horizon in world space,
// fresnel weighted, injected into MeshStandardMaterial (pure math, no env-map texture fetches — an env map
// cost ~45% of a close-up frame on SwiftShader). Makes the ebony pieces read in any set's lighting.
const STUDIO_GLSL = `
{
  vec3 sV = normalize( vViewPosition );
  vec3 sNw = inverseTransformDirection( normal, viewMatrix );
  vec3 sVw = inverseTransformDirection( sV, viewMatrix );
  vec3 sR = reflect( -sVw, sNw );
  float sNdV = clamp( dot( normal, sV ), 0.0, 1.0 );
  float sF = 0.04 + 0.96 * pow( 1.0 - sNdV, 5.0 );
  float sTop = smoothstep( 0.5, 0.82, sR.y );
  float sK1 = smoothstep( 0.8, 0.96, dot( sR, vec3( 0.739, 0.296, 0.605 ) ) );
  float sK2 = smoothstep( 0.84, 0.97, dot( sR, vec3( -0.711, 0.203, -0.673 ) ) );
  float sHz = smoothstep( -0.15, 0.25, sR.y );
  vec3 sEnv = vec3( 1.0, 0.98, 0.95 ) * ( sTop * 2.2 + sK1 * 2.6 ) + vec3( 0.85, 0.9, 1.0 ) * sK2 * 1.3 + vec3( 0.16, 0.16, 0.18 ) * sHz;
  outgoingLight += sEnv * sF * uStudio;
}
#include <opaque_fragment>`;
const _studioU = [];   // [uniform, base]
function studioize(material, base) {
  const u = { value: base * GLOSS.k };
  _studioU.push([u, base]);
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uStudio = u;
    sh.fragmentShader = 'uniform float uStudio;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', STUDIO_GLSL);
  };
  material.customProgramCacheKey = () => 'chessStudio1';
  return material;
}
const GLOSS = { w: 0.6, b: 1.0, board: 0.35, k: 1 };
const _pmat = {};
function pieceMat(white) {
  const key = white ? 'w' : 'b';
  return (_pmat[key] ??= studioize(new THREE.MeshStandardMaterial({ color: white ? IVORY : EBONY, roughness: PIECE_ROUGH, metalness: 0 }), GLOSS[key]));
}
/** Scale the studio reflections on all chess pieces/boards (1 = default, 0 = off). Call any time. */
export function setChessGloss(k = 1) {
  GLOSS.k = k;
  for (const [u, b] of _studioU) u.value = b * k;
}

// ════════════════════════════════════════════════════════════════════════════════ chess board
function boardTextures(size, playW, frameW, fileSign) {
  const k = size / 0.62;
  const s = playW / 8;
  // squares (box top face: u along +X, v = 1 at −Z → canvas top row = rank 1 / white side)
  const checker = canvasTexture(1024, 1024, (g, W) => {
    const c = W / 8;
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const dark = (f + r) % 2 === 0;
      const col = fileSign > 0 ? f : 7 - f;
      drawGrain(g, col * c, r * c, c, c, {
        base: dark ? '#b58863' : '#f0d9b5', dark: dark ? '#5e3b1f' : '#a5794a', light: '#fff6e2',
        seed: 11 + r * 8 + f, along: (f + r) % 4 < 2 ? 'x' : 'y', density: 0.9, alpha: dark ? 0.9 : 0.75,
      });
    }
    g.strokeStyle = 'rgba(60,35,15,0.22)'; g.lineWidth = 2;
    for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * c, 0); g.lineTo(i * c, W); g.stroke(); g.beginPath(); g.moveTo(0, i * c); g.lineTo(W, i * c); g.stroke(); }
    g.strokeStyle = 'rgba(40,22,10,0.85)'; g.lineWidth = 7; g.strokeRect(0, 0, W, W);
  });
  checker.anisotropy = 8;
  // frame top (shape coords → uv via repeat/offset; canvas top = white side, canvas left = −X)
  const frame = canvasTexture(1024, 1024, (g, W) => {
    const b = (frameW / size) * W;
    const base = '#6b3f22';
    const clip = (poly, fn) => { g.save(); g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip(); fn(); g.restore(); };
    clip([[0, 0], [W, 0], [W - b, b], [b, b]], () => drawGrain(g, 0, 0, W, b + 2, { base, dark: '#2a160a', light: '#e8b98a', seed: 101, along: 'x', density: 2.2, waves: 0.8 }));
    clip([[0, W], [W, W], [W - b, W - b], [b, W - b]], () => drawGrain(g, 0, W - b - 2, W, b + 2, { base, dark: '#2a160a', light: '#e8b98a', seed: 102, along: 'x', density: 2.2, waves: 0.8 }));
    clip([[0, 0], [b, b], [b, W - b], [0, W]], () => drawGrain(g, 0, 0, b + 2, W, { base: '#70432a', dark: '#2a160a', light: '#e8b98a', seed: 103, along: 'y', density: 2.2, waves: 0.8 }));
    clip([[W, 0], [W - b, b], [W - b, W - b], [W, W]], () => drawGrain(g, W - b - 2, 0, b + 2, W, { base: '#70432a', dark: '#2a160a', light: '#e8b98a', seed: 104, along: 'y', density: 2.2, waves: 0.8 }));
    // the inside of the frame (hidden under the squares) and mitre seams
    g.fillStyle = base; g.fillRect(b, b, W - 2 * b, W - 2 * b);
    g.strokeStyle = 'rgba(25,12,5,0.55)'; g.lineWidth = 1.5;
    for (const [x0, y0, x1, y1] of [[0, 0, b, b], [W, 0, W - b, b], [0, W, b, W - b], [W, W, W - b, W - b]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    // light inlay line just outside the squares
    g.strokeStyle = 'rgba(245,220,170,0.75)'; g.lineWidth = 2.2;
    const il = b - 0.0065 / k / size * W * k;
    g.strokeRect(il, il, W - 2 * il, W - 2 * il);
    // coordinates
    const px = Math.round(b * 0.5);
    g.font = `800 ${px}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const glyph = (t, x, y, rot) => {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = 'rgba(20,10,4,0.55)'; g.fillText(t, 0, 1.5);
      g.fillStyle = '#f2ddb0'; g.fillText(t, 0, 0);
      g.restore();
    };
    const fx = (f) => (0.5 + (fileSign * (f - 3.5) * s) / size) * W;
    const ry = (r) => (0.5 + ((r - 3.5) * s) / size) * W;
    for (let f = 0; f < 8; f++) {
      const L = 'abcdefgh'[f];
      glyph(L, fx(f), b * 0.47, Math.PI);           // white side: readable from white's chair
      glyph(L, fx(f), W - b * 0.47, 0);             // black side: readable from black's chair
    }
    for (let r = 0; r < 8; r++) {
      glyph(String(r + 1), b * 0.47, ry(r), Math.PI);
      glyph(String(r + 1), W - b * 0.47, ry(r), Math.PI);
    }
  });
  frame.anisotropy = 8;
  frame.repeat.set(1 / size, 1 / size);
  frame.offset.set(0.5, 0.5);
  return { checker, frame };
}

function buildBoard(size, playW, frameW, T, lip, bev, fileSign) {
  const g = new THREE.Group();
  g.name = 'board';
  const tex = boardTextures(size, playW, frameW, fileSign);
  const frameMat = studioize(new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex.frame, roughness: 0.4, metalness: 0 }), GLOSS.board);
  const sideMat = mat('#4a2a16', { roughness: 0.6 });
  const checkerMat = studioize(new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex.checker, roughness: 0.46, metalness: 0 }), GLOSS.board * 0.6);
  // frame ring: extruded square with a square hole and bevels on all edges
  const ho = size / 2 - bev, hi = playW / 2 + bev;
  const shape = new THREE.Shape([new V2(-ho, -ho), new V2(ho, -ho), new V2(ho, ho), new V2(-ho, ho)]);
  shape.holes.push(new THREE.Path([new V2(-hi, -hi), new V2(-hi, hi), new V2(hi, hi), new V2(hi, -hi)]));
  const depth = T + lip - 2 * bev;
  const fg = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 1 });
  fg.rotateX(-Math.PI / 2);
  fg.translate(0, lip - depth - bev, 0);
  g.add(mesh(fg, frameMat));
  // playing surface
  const pg = new THREE.BoxGeometry(playW, T * 0.8, playW);
  g.add(mesh(pg, [sideMat, sideMat, checkerMat, sideMat, sideMat, sideMat], [0, -T * 0.4, 0]));
  return g;
}

// ════════════════════════════════════════════════════════════════════════════════ makeChessSet
export function makeChessSet(opts = {}) {
  const size = opts.size ?? 0.62;
  const k = size / 0.62;
  const frameW = size * 0.055, playW = size - 2 * frameW, s = playW / 8;
  const T = 0.032 * k, lip = 0.0035 * k, bev = 0.003 * k;
  const fileSign = opts.filesAlong === '-x' ? -1 : 1;

  const root = new THREE.Group(); root.name = 'ChessSet';
  const content = new THREE.Group(); root.add(content);
  content.add(buildBoard(size, playW, frameW, T, lip, bev, fileSign));
  const piecesG = new THREE.Group(); piecesG.name = 'pieces'; content.add(piecesG);
  const hlG = new THREE.Group(); content.add(hlG);
  const hlGeo = new THREE.PlaneGeometry(s * 0.94, s * 0.94).rotateX(-Math.PI / 2);
  const BA = blobAssets();
  const MAXB = 64;
  const blobs = new THREE.InstancedMesh(BA.geo, BA.material, MAXB);
  blobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  blobs.frustumCulled = false; blobs.castShadow = false; blobs.receiveShadow = false;
  blobs.count = 0;
  content.add(blobs);

  const pool = {};
  const all = [];
  let base = new Array(64).fill(null);
  let landed = {};
  let lastFen = START_FEN;
  const highlights = new Map();

  const sqIdx = (sq) => {
    if (typeof sq === 'number') return sq >= 0 && sq < 64 ? sq : -1;
    if (!sq || sq.length < 2) return -1;
    const f = sq.toLowerCase().charCodeAt(0) - 97, r = +sq[1] - 1;
    return f >= 0 && f < 8 && r >= 0 && r < 8 ? r * 8 + f : -1;
  };
  const sqPos = (i) => new V3(((i % 8) - 3.5) * s * fileSign, 0, (Math.floor(i / 8) - 3.5) * s);
  const restYaw = (P, i) => {
    let y = (P.white ? 0 : Math.PI) + (hash(i * 7.13 + TYPE_CODE[P.type] * 1.71 + (P.white ? 0 : 0.37)) - 0.5) * 2 * JIT[P.type];
    if (P.type === 'n') y += (i % 8 < 4 ? 1 : -1) * fileSign * (P.white ? 1 : -1) * KNIGHT_TURN;
    return y;
  };
  const onBoard = (x, z, m = 0) => Math.abs(x) < size / 2 - m && Math.abs(z) < size / 2 - m;

  function getPiece(code, n) {
    const arr = (pool[code] ??= []);
    while (arr.length <= n) { const P = createPiece(code); arr.push(P); all.push(P); piecesG.add(P.group); }
    return arr[n];
  }

  function rest(P) {
    const p = sqPos(P.sq);
    P.group.position.copy(p);
    P.group.quaternion.setFromAxisAngle(UP, P.yaw);
    P.group.scale.setScalar(s);
    P.group.visible = true;
    P.animated = false;
  }

  const _t1 = new V3(), _t2 = new V3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
  /** Tip P over its base rim toward board angle alpha by theta, spun phi about its own axis, base at pos. */
  function poseTipped(P, pos, alpha, theta, phi, yaw = P.yaw) {
    const ri = restInfo(P.type, alpha + yaw);
    const kAx = _t1.set(Math.sin(alpha), 0, -Math.cos(alpha));
    const piv = _t2.set(Math.cos(alpha), 0, Math.sin(alpha)).multiplyScalar(ri.rb * s);
    _qa.setFromAxisAngle(kAx, theta);
    _qb.setFromAxisAngle(UP, yaw + phi);
    P.group.quaternion.copy(_qa).multiply(_qb);
    P.group.position.copy(pos).add(piv).sub(piv.clone().applyQuaternion(_qa));
    P.group.scale.setScalar(s);
    P.group.visible = true;
    return ri;
  }

  // contact-shadow blobs follow every visible piece (one instanced draw call)
  const _bm = new THREE.Matrix4(), _bq = new THREE.Quaternion(), _bp = new V3(), _bs = new V3(), _ax = new V3();
  function syncBlobs() {
    let n = 0;
    const floorY = api.floorY;
    for (const P of all) {
      if (!P.group.visible || n >= MAXB) continue;
      const b = P.group.position;
      _ax.copy(UP).applyQuaternion(P.group.quaternion);
      const H = P.H * s;
      const tx = b.x + _ax.x * H, ty = b.y + _ax.y * H, tz = b.z + _ax.z * H;
      const tilt = Math.min(1, Math.hypot(_ax.x, _ax.z));
      const cx = (b.x + tx) / 2, cz = (b.z + tz) / 2;
      const surf = onBoard(cx, cz) ? 0 : floorY;
      const lowest = Math.min(b.y, ty) - tilt * P.Rm * s;
      const lift = Math.max(0, lowest - surf);
      const fade = clamp(1 - lift / (0.55 * H), 0, 1);
      if (fade <= 0.02) continue;
      const wdt = 2 * P.R * s * 1.3;
      const along = wdt * (1 - 0.35 * tilt) + H * tilt * 0.95;
      const across = wdt * (1 - 0.3 * tilt);
      const f = 0.35 + 0.65 * fade;
      const ccx = lerp(b.x, cx, tilt), ccz = lerp(b.z, cz, tilt);
      _bq.setFromAxisAngle(UP, tilt > 0.05 ? Math.atan2(-_ax.z, _ax.x) : 0);
      _bm.compose(_bp.set(ccx, surf + 0.0007 * k, ccz), _bq, _bs.set(along * f, 1, across * f));
      blobs.setMatrixAt(n++, _bm);
    }
    blobs.count = n;
    blobs.instanceMatrix.needsUpdate = true;
  }

  function setFEN(fen) {
    lastFen = String(fen || '8/8/8/8/8/8/8/8').trim().split(/\s+/)[0];
    for (const P of all) { P.group.visible = false; P.sq = -1; P.animated = false; }
    base = new Array(64).fill(null);
    landed = {};
    content.position.set(0, 0, 0);
    const counts = {};
    const rows = lastFen.split('/');
    for (let ri = 0; ri < 8 && ri < rows.length; ri++) {
      const rank = 7 - ri; let file = 0;
      for (const ch of rows[ri]) {
        if (ch >= '1' && ch <= '8') file += +ch;
        else if ('prnbqkPRNBQK'.includes(ch)) {
          if (file < 8) {
            const n = (counts[ch] = (counts[ch] ?? -1) + 1);
            const P = getPiece(ch, n);
            const i = rank * 8 + file;
            P.sq = i; P.yaw = restYaw(P, i);
            base[i] = P;
            rest(P);
          }
          file++;
        }
      }
    }
    syncBlobs();
  }

  function reset() {
    highlight(null);
    setFEN(START_FEN);
  }

  function squareToLocal(sq) { const i = sqIdx(sq); return i < 0 ? new V3() : sqPos(i); }
  function pieceAt(sq) { const i = sqIdx(sq); return i < 0 ? null : base[i]?.group ?? null; }
  function pieceInfo(sq) { const i = sqIdx(sq); const P = i < 0 ? null : base[i]; return P ? { type: P.type, white: P.white, code: P.code, object: P.group } : null; }

  function move(from, to, u, o = {}) {
    const fi = sqIdx(from), ti = sqIdx(to);
    if (fi < 0 || ti < 0) return;
    const P = base[fi];
    if (!P) return;
    u = clamp(u, 0, 1);
    const cap = base[ti] && base[ti] !== P ? base[ti] : null;
    if (cap) cap.group.visible = u < 0.85;
    const a = sqPos(fi), b = sqPos(ti);
    const dist = a.distanceTo(b) / s;
    const h = s * (0.55 + 0.2 * Math.min(dist, 5)) * (P.type === 'n' ? 1.25 : 1) * (o.arc ?? 1);
    const p = smooth(u);
    const yaw = lerp(P.yaw, restYaw(P, ti), p) + (o.spin ?? 0) * p;
    const pos = new V3().lerpVectors(a, b, p);
    pos.y = 4 * h * u * (1 - u);
    _qb.setFromAxisAngle(UP, yaw);
    if (u <= 0 || u >= 1) { pos.copy(u <= 0 ? a : b); P.group.quaternion.setFromAxisAngle(UP, u <= 0 ? P.yaw : restYaw(P, ti)); }
    else if (dist > 1e-6) {
      const d = new V3().subVectors(b, a).normalize();
      _qa.setFromAxisAngle(new V3(d.z, 0, -d.x), 0.22 * Math.sin(Math.PI * u) * (o.tilt ?? 1));
      P.group.quaternion.copy(_qa).multiply(_qb);
    } else P.group.quaternion.copy(_qb);
    P.group.position.copy(pos);
    P.group.scale.setScalar(s);
    P.group.visible = true;
    P.animated = u > 0 && u < 1;
    if (u >= 1) landed[ti] = P; else delete landed[ti];
    syncBlobs();
  }

  function slam(sq, u, o = {}) {
    const i = sqIdx(sq);
    if (i < 0) return;
    const P = landed[i] ?? base[i];
    if (!P) return;
    u = clamp(u, 0, 1);
    const str = o.strength ?? 1;
    let sy;
    if (u < 0.14) sy = 1 - 0.25 * str * ease.outQuad(u / 0.14);
    else { const v = (u - 0.14) / 0.86; sy = 1 - 0.25 * str * Math.exp(-4.5 * v) * Math.cos(v * Math.PI * 3.2) * (1 - v); }
    const sxz = 1 / Math.sqrt(sy);
    if (!P.animated) { P.group.position.copy(sqPos(i)); P.group.quaternion.setFromAxisAngle(UP, landed[i] ? restYaw(P, i) : P.yaw); }
    P.group.scale.set(s * sxz, s * sy, s * sxz);
    // neighbours rattle (pure: from rest + offsets)
    const f0 = i % 8, r0 = Math.floor(i / 8);
    const env = Math.exp(-5 * u) * (1 - u);
    for (let j = 0; j < 64; j++) {
      const Q = base[j];
      if (!Q || Q === P || Q.animated || !Q.group.visible || landed[j] === P) continue;
      const cheb = Math.max(Math.abs((j % 8) - f0), Math.abs(Math.floor(j / 8) - r0));
      const fall = cheb <= 1 ? 1 : cheb === 2 ? 0.5 : cheb === 3 ? 0.25 : 0.12;
      const ph = hash(j * 3.7 + 1.3);
      rest(Q);
      Q.group.position.y = s * 0.09 * str * fall * Math.abs(Math.sin((u * 3.5 + ph * 0.3) * TAU)) * env;
      const wob = 0.1 * str * fall * Math.sin((u * 4.2 + ph) * TAU) * env;
      _qa.setFromAxisAngle(_t1.set(Math.cos(ph * TAU), 0, Math.sin(ph * TAU)), wob);
      Q.group.quaternion.premultiply(_qa);
    }
    content.position.y = 0.004 * k * str * (u < 0.16 ? Math.sin((Math.PI * u) / 0.16) : 0);
    syncBlobs();
  }

  function topple(sq, u, o = {}) {
    const i = sqIdx(sq);
    if (i < 0) return;
    const P = landed[i] ?? base[i];
    if (!P) return;
    u = clamp(u, 0, 1);
    let alpha;
    if (o.dir != null) alpha = o.dir;
    else if (o.toward) { const t = sqPos(sqIdx(o.toward)), p0 = sqPos(i); alpha = Math.atan2(t.z - p0.z, t.x - p0.x); }
    else alpha = freeDirection(P, i);
    const yaw = landed[i] ? restYaw(P, i) : P.yaw;
    const ri = restInfo(P.type, alpha + yaw);
    let th, phi = 0;
    if (u < 0.12) th = 0.07 * Math.sin((Math.PI * u) / 0.12);
    else if (u < 0.55) th = ri.theta * Math.pow((u - 0.12) / 0.43, 2.2);
    else {
      const w = (u - 0.55) / 0.45;
      th = ri.theta - 0.2 * Math.exp(-4 * w) * Math.abs(Math.sin(2.6 * Math.PI * w)) * (1 - w);
      phi = 0.55 * (o.roll ?? 1) * (1 - Math.pow(1 - w, 3));
    }
    const pos = sqPos(i);
    pos.x += -Math.sin(alpha) * P.Rm * s * phi;
    pos.z += Math.cos(alpha) * P.Rm * s * phi;
    poseTipped(P, pos, alpha, th, phi, yaw);
    P.animated = u > 0;
    syncBlobs();
  }

  /** Default topple direction: toward the board's middle (±Z) unless a piece is in the way, then the
   *  first free direction (sideways, then diagonals). Based on the position of the last reset/setFEN. */
  function freeDirection(P, i) {
    const toMid = Math.floor(i / 8) >= 4 ? -Math.PI / 2 : Math.PI / 2;
    const p0 = sqPos(i);
    const len = P.H * s;
    const cands = [toMid, 0, Math.PI, toMid + Math.PI / 4, toMid - Math.PI / 4, -toMid];
    for (const a of cands) {
      const dx = Math.cos(a), dz = Math.sin(a);
      let ok = true;
      for (let d = 0.55 * s; d <= len + 1e-6 && ok; d += 0.25 * s) {
        const x = p0.x + dx * d, z = p0.z + dz * d;
        if (Math.abs(x) > playW / 2 || Math.abs(z) > playW / 2) { ok = false; break; }
        for (let j = 0; j < 64; j++) {
          const Q = base[j];
          if (!Q || Q === P || !Q.group.visible) continue;
          const q = Q.group.position;
          if (Math.hypot(q.x - x, q.z - z) < (Q.R + 0.24) * s) { ok = false; break; }
        }
      }
      if (ok) return a;
    }
    return toMid;
  }

  const bounce = (w) => 0.2 * Math.exp(-4 * w) * Math.abs(Math.sin(2.6 * Math.PI * w)) * (1 - w);
  function knockAll(u, seed = 1, o = {}) {
    u = clamp(u, 0, 1);
    const org = o.origin ?? [0, size * 0.48];
    const floorY = o.floorY ?? api.floorY;
    const maxX = o.maxX ?? size * 0.66, maxZ = o.maxZ ?? size * 0.56;
    for (let i = 0; i < 64; i++) {
      const P = base[i];
      if (!P) continue;
      if (u <= 0) { rest(P); continue; }
      const r = rng(seed * 977 + i * 31 + 7);
      const p0 = sqPos(i);
      const ax = p0.x - org[0], az = p0.z - org[1], dO = Math.hypot(ax, az);
      const ang = (dO > 1e-4 ? Math.atan2(az, ax) : r() * TAU) + (r() - 0.5) * 1.3;
      const delay = Math.min(1, dO / (size * 1.15)) * 0.32 + r() * 0.08;
      const dur = 0.3 + r() * 0.16;
      const fly = r() < 0.6;
      const beta = ang + (r() - 0.5) * 2.2;
      const yawL = P.yaw + (r() - 0.5) * 3;
      const spin = (r() < 0.5 ? 1 : 0) * (r() < 0.5 ? -1 : 1) * TAU;
      const slideD = s * (0.25 + r() * 0.5);
      const roll = (r() - 0.5) * 1.6;
      const apex = s * (0.8 + r() * 1.6);
      const L = s * (1.4 + r() * 3.2);
      const tipPush = s * (0.4 + r() * 0.8);
      const v = clamp((u - delay) / dur, 0, 1);
      if (v <= 0) { rest(P); continue; }
      P.animated = true;
      const dx = Math.cos(ang), dz = Math.sin(ang);
      const v2 = clamp((u - delay - dur) / 0.22, 0, 1);
      const e2 = ease.outCubic(v2);
      if (fly) {
        const lx = clamp(p0.x + dx * L, -maxX, maxX), lz = clamp(p0.z + dz * L, -maxZ, maxZ);
        const ly = onBoard(lx, lz, 0.01 * k) ? 0 : floorY;
        const land = new V3(lx, ly, lz);
        if (v < 1) {
          // lying pose at touchdown
          const ri = poseTipped(P, land, beta, restInfo(P.type, beta + yawL).theta, 0, yawL);
          const qL = P.group.quaternion.clone(), pL = P.group.position.clone();
          const c = new V3(0, P.H * s * 0.45, 0);
          const cL = c.clone().applyQuaternion(qL).add(pL);
          const c0 = c.clone().add(p0);
          const q0 = new THREE.Quaternion().setFromAxisAngle(UP, P.yaw);
          const qw = q0.clone().slerp(qL, v);
          _qa.setFromAxisAngle(_t1.set(Math.sin(beta), 0, -Math.cos(beta)), spin * v);
          qw.premultiply(_qa);
          const cw = new V3().lerpVectors(c0, cL, v); cw.y += 4 * apex * v * (1 - v);
          P.group.quaternion.copy(qw);
          P.group.position.copy(cw).sub(c.applyQuaternion(qw));
          void ri;
        } else {
          const pos = land.clone(); pos.x += dx * slideD * e2; pos.z += dz * slideD * e2;
          if (!onBoard(pos.x, pos.z, 0.01 * k)) pos.y = ly;
          poseTipped(P, pos, beta, restInfo(P.type, beta + yawL).theta - bounce(v2), roll * e2, yawL);
        }
      } else {
        const theta = restInfo(P.type, ang + P.yaw).theta;
        const push = tipPush * ease.outQuad(v) + (v >= 1 ? slideD * 0.5 * e2 : 0);
        const pos = p0.clone(); pos.x += dx * push; pos.z += dz * push;
        const th = v < 1 ? theta * v * v : theta - bounce(v2);
        poseTipped(P, pos, ang, th, v < 1 ? 0 : roll * e2, P.yaw);
      }
    }
    syncBlobs();
  }

  function highlight(sq, color) {
    if (sq == null) { for (const m of highlights.values()) hlG.remove(m); highlights.clear(); return; }
    const i = sqIdx(sq);
    if (i < 0) return;
    let m = highlights.get(i);
    if (color == null || color === false) { if (m) { hlG.remove(m); highlights.delete(i); } return; }
    if (!m) { m = new THREE.Mesh(hlGeo, hlMat(color)); m.renderOrder = 1; highlights.set(i, m); hlG.add(m); }
    m.material = hlMat(color);
    const p = sqPos(i);
    m.position.set(p.x, 0.0005 * k, p.z);
  }

  const api = {
    root, content, size, playSize: playW, squareSize: s, thickness: T, floorY: -T,
    get pieces() { return all.filter((P) => P.group.visible).map((P) => P.group); },
    reset, setFEN, squareToLocal, pieceAt, pieceInfo, move, slam, topple, knockAll, highlight,
    fen: () => lastFen,
  };
  reset();
  return api;
}

// ════════════════════════════════════════════════════════════════════════════════ chess clock
let _dialTex = null;
function dialTexture() {
  return (_dialTex ??= canvasTexture(256, 256, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#fbf6e8'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
    // red zone: the last five minutes
    g.fillStyle = 'rgba(226,58,40,0.85)';
    g.beginPath(); g.moveTo(c, c); g.arc(c, c, c * 0.93, -Math.PI / 2 - (5 / 60) * TAU, -Math.PI / 2); g.closePath(); g.fill();
    g.fillStyle = '#fbf6e8'; g.beginPath(); g.arc(c, c, c * 0.8, 0, TAU); g.fill();
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU - Math.PI / 2, big = i % 5 === 0;
      g.strokeStyle = '#1b1b1b'; g.lineWidth = big ? 7 : 2.5;
      const r0 = big ? c * 0.74 : c * 0.82;
      g.beginPath(); g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); g.lineTo(c + Math.cos(a) * c * 0.93, c + Math.sin(a) * c * 0.93); g.stroke();
    }
    g.fillStyle = '#1b1b1b'; g.font = `900 40px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    [['12', 0], ['3', 3], ['6', 6], ['9', 9]].forEach(([t, h]) => { const a = (h / 12) * TAU - Math.PI / 2; g.fillText(t, c + Math.cos(a) * c * 0.53, c + Math.sin(a) * c * 0.53 + 2); });
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.beginPath(); g.arc(c, c, c - 3, 0, TAU); g.stroke();
  }));
}

export function makeChessClock(opts = {}) {
  const root = new THREE.Group(); root.name = 'ChessClock';
  const body = new THREE.Group(); root.add(body);
  const W = 0.27, bev = 0.006;
  // side profile (z, y): flat bottom, slanted front face, vertical back
  const prof = new THREE.Shape([new V2(-0.045 + bev, bev), new V2(0.05 - bev, bev), new V2(0.024 - bev * 0.7, 0.105 - bev), new V2(-0.045 + bev, 0.105 - bev)]);
  const cg = new THREE.ExtrudeGeometry(prof, { depth: W - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 1 });
  cg.rotateY(-Math.PI / 2);
  cg.translate((W - 2 * bev) / 2, 0, 0);
  const woodTex = woodTexture(opts.wood ?? '#7a4a2a', 21).clone();
  woodTex.needsUpdate = true; woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(4, 4);
  const caseMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: woodTex, roughness: 0.45, metalness: 0 });
  body.add(mesh(cg, caseMat));
  // feet strip + a brass name plate between the dials
  const brass = mat('#e2b85c', { roughness: 0.32 });
  const black = mat('#161616', { roughness: 0.4 });
  const red = mat('#e23a28', { roughness: 0.4 });
  const tilt = Math.atan2(0.026, 0.105);
  const faceZ = (y) => 0.05 - 0.026 * (y / 0.105);
  const dials = {};
  const dialGeo = new THREE.CircleGeometry(0.0385, 40);
  const bezelGeo = new THREE.TorusGeometry(0.0405, 0.0055, 10, 40);
  const dialMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: dialTexture(), roughness: 0.35, metalness: 0 });
  const handG = {
    hour: new THREE.BoxGeometry(0.0055, 0.022, 0.0016).translate(0, 0.0085, 0),
    min: new THREE.BoxGeometry(0.0038, 0.0335, 0.0016).translate(0, 0.0138, 0),
    sec: new THREE.BoxGeometry(0.0015, 0.036, 0.001).translate(0, 0.012, 0),
    cap: new THREE.CylinderGeometry(0.0042, 0.0042, 0.003, 14).rotateX(Math.PI / 2),
    flag: new THREE.BufferGeometry().setFromPoints([new V3(0, 0, 0), new V3(0.012, 0.004, 0), new V3(0, 0.009, 0)]),
  };
  handG.flag.computeVertexNormals();
  for (const side of ['L', 'R']) {
    const x = side === 'L' ? 0.068 : -0.068;
    const dg = new THREE.Group();
    const y = 0.058;
    dg.position.set(x, y, faceZ(y) + 0.0035);
    dg.rotation.x = -tilt;
    dg.add(mesh(bezelGeo, brass, [0, 0, 0.001]));
    dg.add(mesh(dialGeo, dialMat, [0, 0, 0.0005]));
    const hour = mesh(handG.hour, black, [0, 0, 0.0025]);
    const min = mesh(handG.min, black, [0, 0, 0.004]);
    const sec = mesh(handG.sec, red, [0, 0, 0.0055]);
    const cap = mesh(handG.cap, brass, [0, 0, 0.006]);
    const flagPivot = new THREE.Group(); flagPivot.position.set(0.0045, 0.0325, 0.0052);
    const flagMat = new THREE.MeshStandardMaterial({ color: '#e23a28', roughness: 0.5, side: THREE.DoubleSide });
    flagPivot.add(new THREE.Mesh(handG.flag, flagMat));
    dg.add(hour, min, sec, cap, flagPivot);
    for (const m of [hour, min, sec, cap]) m.castShadow = false;
    body.add(dg);
    dials[side] = { hour, min, sec, flag: flagPivot, value: null };
  }
  body.add(mesh(rbox(0.05, 0.016, 0.004, 0.0015), brass, [0, 0.094, faceZ(0.094) + 0.002], [-tilt, 0, 0]));
  // buttons
  const bc = opts.buttonColors ?? ['#e8412c', '#e8412c'];
  const stemGeo = new THREE.CylinderGeometry(0.0085, 0.0085, 0.024, 16);
  const capGeo = lathe([[0, 0, 1], [0.019, 0, 1], [0.022, 0.003], [0.022, 0.008], [0.019, 0.013], [0.012, 0.0165], [0, 0.0175]], 24);
  const buttons = {};
  ['L', 'R'].forEach((side, i) => {
    const bg = new THREE.Group();
    bg.position.set(side === 'L' ? 0.068 : -0.068, 0.105, -0.011);
    bg.add(mesh(stemGeo, mat('#c9c9c9', { roughness: 0.3 }), [0, 0.004, 0]));
    bg.add(mesh(capGeo, mat(bc[i], { roughness: 0.3 }), [0, 0.0135, 0]));
    body.add(bg);
    buttons[side] = bg;
  });
  shadowy(body);

  const times = { L: 300, R: 300 };
  function showTime(side, sec) {
    const d = dials[side];
    const v = Math.round(sec * 10) / 10;
    if (d.value === v) return;
    d.value = v;
    const T = Math.max(0, sec);
    d.min.rotation.z = -TAU * (1 - ((T / 3600) % 1));
    d.hour.rotation.z = -TAU * (1 - ((T / 43200) % 1));
    d.sec.rotation.z = -TAU * (1 - ((Math.floor(T) % 60) / 60));
    // flag: rests tilted, gets lifted by the minute hand in the last 2 minutes, falls at 0
    d.flag.rotation.z = sec <= 0 ? -1.9 : T < 120 ? lerp(0.7, -0.35, T / 120) : -0.35;
  }
  function setTimes(l, r) { times.L = l; times.R = r; showTime('L', l); showTime('R', r); }
  function press(side, u) {
    u = clamp(u, 0, 1);
    const bump = u <= 0 || u >= 1 ? 0 : u < 0.5 ? ease.outCubic(u / 0.5) : 1 - ease.inOutQuad((u - 0.5) / 0.5);
    const other = side === 'L' ? 'R' : 'L';
    if (buttons[side]) buttons[side].position.y = 0.105 - 0.0105 * bump;
    if (buttons[other]) buttons[other].position.y = 0.105 + 0.0035 * bump;
    body.position.y = -0.0012 * bump;
    body.rotation.z = (side === 'L' ? -1 : 1) * 0.018 * bump;
  }
  function update(t) {
    for (const side of ['L', 'R']) if (times[side] <= 0) dials[side].flag.rotation.z = -1.9 + 0.12 * Math.sin(t * 9) * Math.exp(-((t * 0.5) % 3));
  }
  setTimes(times.L, times.R);
  press('L', 0);
  return { root, press, setTimes, update, get times() { return { ...times }; } };
}

// ════════════════════════════════════════════════════════════════════════════════ party hat
const _hatTex = new Map();
function hatTexture(color) {
  if (!_hatTex.has(color)) {
    _hatTex.set(color, canvasTexture(256, 256, (g, W, H) => {
      g.fillStyle = color; g.fillRect(0, 0, W, H);
      // spiral stripes (periodic in u)
      const n = 4;
      for (let i = -n; i < 2 * n; i++) {
        const x0 = (i / n) * W;
        g.fillStyle = 'rgba(255,255,255,0.95)';
        g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + W * 0.09, 0); g.lineTo(x0 + W * 0.09 + W * 0.5, H); g.lineTo(x0 + W * 0.5, H); g.closePath(); g.fill();
        g.fillStyle = '#ffd23f';
        g.beginPath(); g.moveTo(x0 + W * 0.13, 0); g.lineTo(x0 + W * 0.15, 0); g.lineTo(x0 + W * 0.15 + W * 0.5, H); g.lineTo(x0 + W * 0.13 + W * 0.5, H); g.closePath(); g.fill();
      }
    }));
  }
  return _hatTex.get(color);
}
let _hatGeo = null;
export function makePartyHat(color = '#ff4fa3', opts = {}) {
  _hatGeo ??= {
    cone: new THREE.ConeGeometry(0.105, 0.27, 28, 1, true).translate(0, 0.145, 0),
    brim: new THREE.TorusGeometry(0.105, 0.016, 8, 28).rotateX(Math.PI / 2).translate(0, 0.012, 0),
    pom: new THREE.IcosahedronGeometry(0.036, 1).translate(0, 0.29, 0),
  };
  const g = new THREE.Group(); g.name = 'PartyHat';
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: hatTexture(color), roughness: 0.55, side: THREE.DoubleSide });
  g.add(mesh(_hatGeo.cone, m));
  g.add(mesh(_hatGeo.brim, mat('#ffffff', { roughness: 0.9 })));
  const pom = mesh(_hatGeo.pom, mat('#ffd23f', { roughness: 0.95, flatShading: true }));
  g.add(pom);
  if (opts.scale) g.scale.setScalar(opts.scale);
  return g;
}

// ════════════════════════════════════════════════════════════════════════════════ cake
let _flame = null;
function flameAssets() {
  if (_flame) return _flame;
  const outer = lathe([[0, 0], ...arc(0.0065, 0.0065, -90, 0, 30), [0.0055, 0.011], [0.0035, 0.017], [0.0012, 0.022], [0, 0.024]], 12);
  const inner = lathe([[0, 0], ...arc(0.0038, 0.0038, -90, 0, 30), [0.003, 0.007], [0.0015, 0.011], [0, 0.013]], 10);
  const glowTex = canvasTexture(64, 64, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,220,120,0.9)'); gr.addColorStop(0.35, 'rgba(255,170,60,0.35)'); gr.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
  _flame = {
    outer, inner,
    outerMat: new THREE.MeshBasicMaterial({ color: '#ffb02e', toneMapped: false }),
    innerMat: new THREE.MeshBasicMaterial({ color: '#fff4c2', toneMapped: false }),
    glowMat: new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }),
  };
  return _flame;
}
const _candleTex = {};
function candleTexture(color) {
  return (_candleTex[color] ??= canvasTexture(64, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = color;
    for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 22); g.lineTo(w, i * 22 + 26); g.lineTo(w, i * 22 + 36); g.lineTo(0, i * 22 + 10); g.closePath(); g.fill(); }
  }));
}
const _cakeSideTex = {};
function cakeSideTexture(frost, cream) {
  const key = frost + cream;
  return (_cakeSideTex[key] ??= canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = frost; g.fillRect(0, 0, w, h);
    // cream drips from the top edge (periodic)
    g.fillStyle = cream;
    g.fillRect(0, 0, w, 16);
    const r = rng(5);
    for (let x = 0; x < w; x += 22) {
      const len = 20 + r() * 52, wd = 9 + r() * 7;
      g.beginPath(); g.moveTo(x - wd, 10); g.lineTo(x - wd, 10 + len - wd); g.arc(x, 10 + len - wd, wd, Math.PI, 0, true); g.lineTo(x + wd, 10); g.closePath(); g.fill();
    }
    // sprinkles
    const cols = ['#ffffff', '#3ee0c8', '#ffd23f', '#8a5cff', '#4fb3ff'];
    for (let i = 0; i < 120; i++) {
      const x = r() * w, y = 70 + r() * 50;
      g.save(); g.translate(x, y); g.rotate(r() * TAU); g.fillStyle = cols[i % cols.length]; g.fillRect(-4, -1.5, 8, 3); g.restore();
    }
    g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, h - 10, w, 10);
  }));
}

export function makeCake(opts = {}) {
  const { candles = 5, frosting = '#ff8fc8', cream = '#fff4e6', scale = 1 } = opts;
  const root = new THREE.Group(); root.name = 'Cake';
  const inner = new THREE.Group(); inner.scale.setScalar(scale); root.add(inner);
  // cake stand
  const stand = lathe([[0, 0, 1], [0.075, 0, 1], [0.078, 0.006], [0.07, 0.012], [0.028, 0.022], [0.022, 0.04], [0.028, 0.052, 1], [0.19, 0.056, 1], [0.198, 0.06], [0.195, 0.066, 1], [0.18, 0.066, 1], [0, 0.066, 1]], 40);
  inner.add(mesh(stand, mat('#f4f7fb', { roughness: 0.25 })));
  const y0 = 0.066;
  // sponge body with frosting texture
  const sideMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: cakeSideTexture(frosting, cream), roughness: 0.6 });
  const bodyG = new THREE.CylinderGeometry(0.15, 0.15, 0.11, 48, 1, true);
  inner.add(mesh(bodyG, sideMat, [0, y0 + 0.055, 0]));
  const top = lathe([[0, 0, 1], [0.15, 0, 1], [0.153, 0.004], [0.154, 0.012], [0.147, 0.018], [0.12, 0.02], [0, 0.02]], 48);
  inner.add(mesh(top, mat(cream, { roughness: 0.55 }), [0, y0 + 0.104, 0]));
  inner.add(mesh(new THREE.CircleGeometry(0.15, 48).rotateX(Math.PI / 2), mat(frosting, { roughness: 0.6 }), [0, y0 + 0.0005, 0]));
  // piped border
  const bead = new THREE.SphereGeometry(0.014, 8, 6);
  const beads = [];
  for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU; beads.push(xf(bead, [Math.sin(a) * 0.14, y0 + 0.124, Math.cos(a) * 0.14], [0, 0, 0], [1, 0.8, 1])); }
  for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; beads.push(xf(bead, [Math.sin(a) * 0.152, y0 + 0.006, Math.cos(a) * 0.152], [0, 0, 0], [1, 0.75, 1])); }
  inner.add(mesh(merge(beads), mat(cream, { roughness: 0.55 })));
  // sprinkles on top (instanced, one draw)
  const sprCols = ['#ffffff', '#3ee0c8', '#ffd23f', '#8a5cff', '#4fb3ff', '#ff7a2f'];
  const spr = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.004, 0.004), mat('#ffffff', { roughness: 0.5 }), 46);
  const r = rng(77); const m4 = new THREE.Matrix4(); const col = new THREE.Color();
  for (let i = 0; i < 46; i++) {
    const a = r() * TAU, rr = Math.sqrt(r()) * 0.11;
    m4.compose(new V3(Math.sin(a) * rr, y0 + 0.126, Math.cos(a) * rr), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new V3(1, 1, 1));
    spr.setMatrixAt(i, m4); spr.setColorAt(i, col.set(sprCols[i % sprCols.length]));
  }
  inner.add(spr);
  // candles
  const F = flameAssets();
  const candleGeo = new THREE.CylinderGeometry(0.0075, 0.0075, 0.07, 12);
  const wickGeo = new THREE.CylinderGeometry(0.0012, 0.0012, 0.008, 5);
  const ccols = ['#4fb3ff', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#ff4fa3'];
  const flames = [];
  for (let i = 0; i < candles; i++) {
    const a = (i / candles) * TAU + 0.3, rr = candles > 1 ? 0.085 : 0;
    const cg = new THREE.Group(); cg.position.set(Math.sin(a) * rr, y0 + 0.124, Math.cos(a) * rr);
    cg.add(mesh(candleGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', map: candleTexture(ccols[i % ccols.length]), roughness: 0.5 }), [0, 0.035, 0]));
    cg.add(mesh(wickGeo, mat('#2a2018'), [0, 0.074, 0]));
    const fl = new THREE.Group(); fl.position.set(0, 0.077, 0);
    const o = new THREE.Mesh(F.outer, F.outerMat), inn = new THREE.Mesh(F.inner, F.innerMat);
    inn.position.y = 0.002;
    fl.add(o, inn);
    const glow = new THREE.Sprite(F.glowMat); glow.scale.setScalar(0.07); glow.position.y = 0.01;
    fl.add(glow);
    cg.add(fl);
    inner.add(cg);
    flames.push({ fl, glow, i });
  }
  shadowy(inner);
  for (const f of flames) f.fl.traverse((m) => { m.castShadow = false; m.receiveShadow = false; });
  spr.castShadow = false;
  function update(t) {
    for (const { fl, glow, i } of flames) {
      const n1 = noise1(t * 9 + i * 3.1, i), n2 = noise1(t * 6.3 + i * 1.7, i + 9);
      fl.scale.set(1 + 0.08 * n2, 1 + 0.2 * n1, 1 + 0.08 * n2);
      fl.rotation.z = 0.14 * noise1(t * 5 + i * 2.3, i + 3);
      fl.rotation.x = 0.1 * noise1(t * 4.4 + i, i + 5);
      glow.scale.setScalar(0.07 * (1 + 0.12 * n1));
    }
  }
  update(0);
  return { root, update };
}

// ════════════════════════════════════════════════════════════════════════════════ table / chair / bed
export function makeTable(opts = {}) {
  const { w = 1.2, d = 0.75, h = 0.78, wood = '#b9824f' } = opts;
  const g = new THREE.Group(); g.name = 'Table';
  const top = woodMat(wood, 0.55, 5), leg = woodMat(shade(wood, -0.18), 0.65, 6);
  g.add(mesh(rbox(w, 0.05, d, 0.016), top, [0, h - 0.025, 0]));
  const ix = w / 2 - 0.07, iz = d / 2 - 0.07;
  for (const [x, z] of [[-ix, -iz], [ix, -iz], [-ix, iz], [ix, iz]]) g.add(mesh(rbox(0.06, h - 0.05, 0.06, 0.012), leg, [x, (h - 0.05) / 2, z]));
  g.add(mesh(rbox(w - 0.16, 0.07, 0.03, 0.01), leg, [0, h - 0.085, -iz]));
  g.add(mesh(rbox(w - 0.16, 0.07, 0.03, 0.01), leg, [0, h - 0.085, iz]));
  g.add(mesh(rbox(0.03, 0.07, d - 0.16, 0.01), leg, [-ix, h - 0.085, 0]));
  g.add(mesh(rbox(0.03, 0.07, d - 0.16, 0.01), leg, [ix, h - 0.085, 0]));
  g.userData.top = h;
  return g;
}

export function makeChair(opts = {}) {
  const { wood = '#a8703f' } = opts;
  const g = new THREE.Group(); g.name = 'Chair';
  const wm = woodMat(wood, 0.6, 7), dk = woodMat(shade(wood, -0.15), 0.65, 8);
  g.add(mesh(rbox(0.46, 0.05, 0.44, 0.016), wm, [0, 0.525, 0]));
  for (const [x, z] of [[-0.19, 0.18], [0.19, 0.18]]) g.add(mesh(rbox(0.045, 0.5, 0.045, 0.012), dk, [x, 0.25, z]));
  for (const x of [-0.19, 0.19]) g.add(mesh(rbox(0.045, 0.98, 0.045, 0.012), dk, [x, 0.49, -0.19]));
  g.add(mesh(rbox(0.42, 0.1, 0.035, 0.012), wm, [0, 0.93, -0.19]));
  g.add(mesh(rbox(0.38, 0.05, 0.03, 0.01), wm, [0, 0.76, -0.19]));
  g.add(mesh(rbox(0.36, 0.03, 0.03, 0.008), dk, [0, 0.14, -0.19]));
  g.add(mesh(rbox(0.36, 0.03, 0.03, 0.008), dk, [0, 0.14, 0.18]));
  return g;
}

const _blanketTex = {};
function blanketTexture(color) {
  return (_blanketTex[color] ??= canvasTexture(256, 512, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    // checker band (chess, obviously)
    const c = w / 8;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#f4efe2' : '#1d1d22'; g.fillRect(i * c, 60 + j * c, c, c); }
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 2);
  }));
}
export function makeBed(opts = {}) {
  const { w = 1.0, l = 2.05, wood = '#9c6b43', blanket = '#3f5fb5', sheet = '#f4f1ea' } = opts;
  const g = new THREE.Group(); g.name = 'Bed';
  const wm = woodMat(wood, 0.6, 9);
  const hz = -l / 2, fz = l / 2;
  g.add(mesh(rbox(w + 0.08, 0.95, 0.07, 0.03), wm, [0, 0.475, hz]));
  g.add(mesh(rbox(w - 0.12, 0.5, 0.03, 0.02), woodMat(shade(wood, 0.12), 0.6, 10), [0, 0.6, hz + 0.04]));
  g.add(mesh(rbox(w + 0.08, 0.6, 0.06, 0.03), wm, [0, 0.3, fz]));
  for (const x of [-w / 2, w / 2]) g.add(mesh(rbox(0.05, 0.16, l, 0.02), wm, [x, 0.25, 0]));
  g.add(mesh(rbox(w, 0.05, l - 0.04, 0.01), mat('#6b4a33'), [0, 0.27, 0]));
  g.add(mesh(rbox(w - 0.04, 0.2, l - 0.08, 0.06), mat(sheet, { roughness: 0.9 }), [0, 0.39, 0]));
  const bm = new THREE.MeshStandardMaterial({ color: '#ffffff', map: blanketTexture(blanket), roughness: 0.92 });
  const bl = l * 0.64;
  g.add(mesh(rbox(w + 0.02, 0.06, bl, 0.03), bm, [0, 0.49, fz - bl / 2 - 0.03]));
  g.add(mesh(rbox(w + 0.025, 0.07, 0.13, 0.03), mat(sheet, { roughness: 0.9 }), [0, 0.5, fz - bl - 0.03]));
  g.add(mesh(rbox(w + 0.022, 0.32, 0.05, 0.02), bm, [0, 0.36, fz - 0.03]));
  const pil = mesh(rbox(w * 0.62, 0.12, 0.34, 0.06), mat('#ffffff', { roughness: 0.95 }), [0, 0.55, hz + 0.25], [0.08, 0.04, 0]);
  g.add(pil);
  return g;
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, clamp(hsl.l + amt * (amt < 0 ? hsl.l : 1 - hsl.l), 0, 1));
  return '#' + c.getHexString();
}

// ════════════════════════════════════════════════════════════════════════════════ breakfast plate
export function makePlate(opts = {}) {
  const root = new THREE.Group(); root.name = 'Plate';
  const plate = lathe([[0, 0.004, 1], [0.07, 0.004, 1], [0.072, 0], [0.078, 0.0], [0.08, 0.006], [0.1, 0.009], [0.122, 0.016], [0.134, 0.024], [0.136, 0.027], [0.133, 0.028], [0.12, 0.022], [0.098, 0.015], [0.078, 0.012, 1], [0, 0.012, 1]], 48);
  root.add(mesh(plate, mat('#fbfbf8', { roughness: 0.25 })));
  root.add(mesh(new THREE.TorusGeometry(0.115, 0.0022, 6, 48).rotateX(Math.PI / 2), mat('#3d6fd1', { roughness: 0.3 }), [0, 0.0205, 0]));
  const food = new THREE.Group(); food.name = 'food';
  root.add(food);
  const y = 0.012;
  // eggs: wobbly whites + glossy yolks
  const eggWhite = (seed) => {
    const r = rng(seed), pts = [];
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; const rr = 0.042 * (1 + 0.16 * Math.sin(a * 3 + r() * 2) + 0.08 * (r() - 0.5)); pts.push(new V2(Math.cos(a) * rr, Math.sin(a) * rr)); }
    const shp = new THREE.Shape(new THREE.SplineCurve([...pts, pts[0]]).getPoints(36));
    const ge = new THREE.ExtrudeGeometry(shp, { depth: 0.003, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.003, bevelSegments: 2 });
    ge.rotateX(-Math.PI / 2);
    return ge;
  };
  const yolkG = new THREE.SphereGeometry(0.02, 18, 12, 0, TAU, 0, Math.PI / 2).scale(1, 0.62, 1);
  [[-0.035, 0.028, 31], [0.02, 0.05, 32]].forEach(([x, z, sd]) => {
    food.add(mesh(eggWhite(sd), mat('#fffdf6', { roughness: 0.45 }), [x, y + 0.002, z]));
    food.add(mesh(yolkG, mat('#ffb21e', { roughness: 0.2 }), [x + 0.004, y + 0.006, z - 0.003]));
  });
  // toast
  const toastTex = canvasTexture(128, 128, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, w * 0.15, w / 2, w / 2, w * 0.62);
    gr.addColorStop(0, '#f2c27a'); gr.addColorStop(0.7, '#d9984a'); gr.addColorStop(0.86, '#8f5424'); gr.addColorStop(1, '#6e3d18');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    const r = rng(9); g.fillStyle = 'rgba(120,70,30,0.25)';
    for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(r() * w, r() * w, 1 + r() * 2, 0, TAU); g.fill(); }
  });
  const toastMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: toastTex, roughness: 0.8 });
  food.add(mesh(rbox(0.088, 0.016, 0.092, 0.008), toastMat, [0.045, y + 0.01, -0.035], [0, 0.35, 0]));
  food.add(mesh(rbox(0.088, 0.016, 0.092, 0.008), toastMat, [0.03, y + 0.03, -0.05], [0.22, -0.25, 0.12]));
  // bacon: wavy strips
  const baconTex = canvasTexture(256, 32, (g, w, h) => {
    g.fillStyle = '#a8331f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2c9a6'; g.fillRect(0, h * 0.18, w, h * 0.16); g.fillRect(0, h * 0.62, w, h * 0.12);
    g.fillStyle = 'rgba(80,20,10,0.35)'; g.fillRect(0, 0, w, h * 0.08); g.fillRect(0, h * 0.92, w, h * 0.08);
  });
  const baconMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: baconTex, roughness: 0.55 });
  [[-0.05, -0.045, 0.5, 1], [-0.028, -0.07, 0.62, 2]].forEach(([x, z, rot, sd]) => {
    const bg = new THREE.BoxGeometry(0.13, 0.004, 0.024, 24, 1, 1);
    const p = bg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + 0.006 * Math.sin(p.getX(i) * 75 + sd) + 0.003);
    bg.computeVertexNormals();
    food.add(mesh(bg, baconMat, [x, y, z], [0, rot, 0]));
  });
  shadowy(root);
  return { root, food };
}

// ════════════════════════════════════════════════════════════════════════════════ party speaker
export function makeSpeaker(opts = {}) {
  const root = new THREE.Group(); root.name = 'Speaker';
  const W = 0.46, H = 0.82, D = 0.4, fy = 0.03;
  const cab = mat('#1f2128', { roughness: 0.62 });
  root.add(mesh(rbox(W, H, D, 0.045), cab, [0, fy + H / 2, 0]));
  for (const [x, z] of [[-0.17, -0.14], [0.17, -0.14], [-0.17, 0.14], [0.17, 0.14]]) root.add(mesh(rbox(0.06, fy, 0.06, 0.01), mat('#111214'), [x, fy / 2, z]));
  root.add(mesh(rbox(0.22, 0.03, 0.045, 0.012), mat('#2c2f37', { roughness: 0.5 }), [0, fy + H + 0.045, 0]));
  for (const x of [-0.1, 0.1]) root.add(mesh(rbox(0.025, 0.05, 0.035, 0.008), mat('#2c2f37'), [x, fy + H + 0.02, 0]));
  const fz = D / 2;
  // front baffle (slightly lighter)
  root.add(mesh(rbox(W - 0.05, H - 0.05, 0.012, 0.02), mat('#2a2d35', { roughness: 0.7 }), [0, fy + H / 2, fz - 0.002]));
  // woofer
  const wy = fy + 0.3;
  const woofer = new THREE.Group(); woofer.position.set(0, wy, fz + 0.006); root.add(woofer);
  woofer.add(mesh(new THREE.TorusGeometry(0.165, 0.012, 10, 48), mat('#3a3d45', { roughness: 0.35 })));
  const cone = new THREE.Group(); woofer.add(cone);
  const coneG = lathe([[0.152, 0], [0.13, -0.012], [0.08, -0.032], [0.045, -0.045, 1], [0, -0.045]], 40).rotateX(Math.PI / 2);
  cone.add(mesh(coneG, mat('#15161a', { roughness: 0.8, side: THREE.DoubleSide })));
  cone.add(mesh(new THREE.TorusGeometry(0.148, 0.01, 8, 40), mat('#202228', { roughness: 0.6 })));
  cone.add(mesh(new THREE.SphereGeometry(0.05, 20, 10, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 0.6), mat('#4a4e58', { roughness: 0.25 }), [0, 0, -0.04]));
  // tweeter horn
  const tw = new THREE.Group(); tw.position.set(0, fy + 0.64, fz + 0.004); root.add(tw);
  tw.add(mesh(lathe([[0.075, 0], [0.06, -0.012], [0.035, -0.03], [0.015, -0.04, 1], [0, -0.04]], 32).rotateX(Math.PI / 2), mat('#15161a', { roughness: 0.5, side: THREE.DoubleSide })));
  tw.add(mesh(new THREE.TorusGeometry(0.078, 0.008, 8, 36), mat('#3a3d45', { roughness: 0.35 })));
  tw.add(mesh(new THREE.SphereGeometry(0.016, 12, 8), mat('#9aa0ad', { roughness: 0.2 }), [0, 0, -0.03]));
  // LED rings (emissive)
  const ledMat = new THREE.MeshBasicMaterial({ color: '#ff4fa3', toneMapped: false });
  const led1 = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.0065, 6, 56), ledMat);
  led1.position.set(0, wy, fz + 0.008); root.add(led1);
  const led2 = new THREE.Mesh(new THREE.TorusGeometry(0.093, 0.005, 6, 40), ledMat);
  led2.position.set(0, fy + 0.64, fz + 0.006); root.add(led2);
  // little control strip on top-front
  root.add(mesh(rbox(0.3, 0.035, 0.01, 0.006), mat('#111214'), [0, fy + H - 0.06, fz + 0.004]));
  shadowy(root);
  led1.castShadow = led2.castShadow = false;
  let on = opts.on ?? true;
  const col = new THREE.Color();
  function update(t) {
    const ph = (t * 2) % 1;
    const kick = on ? Math.exp(-ph * 7) : 0;
    cone.position.z = 0.014 * kick;
    if (on) {
      col.setHSL((((t * 0.12) % 1) + 1) % 1, 0.95, 0.42 + 0.22 * kick);
      ledMat.color.copy(col);
    } else ledMat.color.set('#1a1b20');
  }
  update(0);
  return { root, update, setOn(v) { on = !!v; } };
}

// ════════════════════════════════════════════════════════════════════════════════ balloon
let _balloonGeo = null;
export function makeBalloon(color = '#ff4fa3', opts = {}) {
  const sl = opts.string ?? 0.85;
  _balloonGeo ??= {
    body: lathe([[0, 0], [0.03, 0.012], [0.075, 0.05], [0.115, 0.1], [0.143, 0.16], [0.152, 0.22], [0.146, 0.27], [0.125, 0.315], [0.09, 0.35], [0.05, 0.37], [0, 0.377]], 28),
    knot: lathe([[0, -0.018, 1], [0.01, -0.016], [0.012, -0.01], [0.006, -0.004], [0.004, 0.004], [0, 0.006]], 12),
    shine: new THREE.SphereGeometry(0.03, 10, 8).scale(0.75, 1.2, 0.35),
  };
  const g = new THREE.Group(); g.name = 'Balloon';
  const curve = new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(0.02, sl * 0.33, 0.01), new V3(-0.018, sl * 0.66, -0.005), new V3(0, sl, 0)]);
  const str = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.0032, 5, false), mat('#f2f2f2', { roughness: 0.8 }));
  str.castShadow = true; g.add(str);
  const bm = mat(color, { roughness: 0.22 });
  const b = new THREE.Group(); b.position.y = sl + 0.018; g.add(b);
  b.add(mesh(_balloonGeo.knot, bm));
  b.add(mesh(_balloonGeo.body, bm));
  const sh = new THREE.Mesh(_balloonGeo.shine, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }));
  sh.position.set(-0.06, 0.27, 0.115); sh.rotation.set(-0.5, -0.45, 0.35);
  b.add(sh);
  g.userData.balloon = b;
  return g;
}

// ════════════════════════════════════════════════════════════════════════════════ confetti
const PARTY = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff', '#ffffff'];
export function makeConfetti(opts = {}) {
  const { count = 120, t0 = 0, speed = 5.5, spread = 0.75, groundY = 0, size = 1, life = Infinity, seed = 1, colors = PARTY } = opts;
  const origin = new V3(...(opts.origin ?? [0, 0, 0]));
  const dir = new V3(...(opts.dir ?? [0, 1, 0])).normalize();
  const geo = new THREE.PlaneGeometry(0.03 * size, 0.018 * size);
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(geo, material, count);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false; im.castShadow = false;
  const g = 9.8;
  // an orthonormal basis around dir
  const tA = Math.abs(dir.y) < 0.9 ? new V3(0, 1, 0) : new V3(1, 0, 0);
  const bx = new V3().crossVectors(dir, tA).normalize(), bz = new V3().crossVectors(dir, bx).normalize();
  const P = [];
  const col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = rng(seed * 1013 + i * 7 + 1);
    const th = Math.sqrt(r()) * spread, ph = r() * TAU;
    const d = dir.clone().multiplyScalar(Math.cos(th)).addScaledVector(bx, Math.sin(th) * Math.cos(ph)).addScaledVector(bz, Math.sin(th) * Math.sin(ph));
    const sp = speed * (0.55 + 0.45 * r());
    const p = {
      v: d.multiplyScalar(sp), k: 3.2 + r() * 2.6,
      fa: 0.04 + r() * 0.08, fw: 4 + r() * 5, fp: r() * TAU,
      w: new V3((r() - 0.5) * 22, (r() - 0.5) * 18, (r() - 0.5) * 22), r0: new V3(r() * TAU, r() * TAU, r() * TAU),
      sc: 0.7 + r() * 0.6, sq: r() < 0.3, yaw: r() * TAU, tl: Infinity,
    };
    // landing time (bisection on y(τ) = groundY, after the apex)
    const yAt = (tau) => origin.y + ((p.v.y + g / p.k) / p.k) * (1 - Math.exp(-p.k * tau)) - (g / p.k) * tau;
    if (yAt(12) < groundY) {
      let a = 0.05, b = 12;
      if (yAt(a) < groundY) a = 0;
      for (let it = 0; it < 40; it++) { const m = (a + b) / 2; if (yAt(m) > groundY) a = m; else b = m; }
      p.tl = b;
    }
    p.yAt = yAt;
    P.push(p);
    im.setColorAt(i, col.set(colors[i % colors.length]));
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new V3(), scl = new V3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  function at(p, tau, out) {
    const ex = (1 - Math.exp(-p.k * tau)) / p.k;
    out.set(origin.x + p.v.x * ex, p.yAt(tau), origin.z + p.v.z * ex);
    const fl = Math.min(1, tau * 2) * p.fa;
    out.x += Math.sin(tau * p.fw + p.fp) * fl; out.z += Math.cos(tau * p.fw * 0.8 + p.fp) * fl;
    return out;
  }
  function update(t) {
    const tau0 = t - t0;
    for (let i = 0; i < count; i++) {
      const p = P[i];
      if (tau0 < 0) { im.setMatrixAt(i, zero); continue; }
      const sz = p.sc * (tau0 > life ? clamp(1 - (tau0 - life) / 0.6, 0, 1) : 1) * (tau0 < 0.04 ? tau0 / 0.04 : 1);
      if (tau0 >= p.tl) {
        at(p, p.tl, pos); pos.y = groundY + 0.0015 + (i % 7) * 0.0003;
        q.setFromEuler(e.set(-Math.PI / 2, 0, p.yaw));
      } else {
        at(p, tau0, pos);
        q.setFromEuler(e.set(p.r0.x + p.w.x * tau0, p.r0.y + p.w.y * tau0, p.r0.z + p.w.z * tau0));
      }
      m4.compose(pos, q, scl.set(sz * (p.sq ? 0.65 : 1), sz, sz));
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
  }
  update(t0 - 1);
  const root = new THREE.Group(); root.name = 'Confetti'; root.add(im);
  return { root, update, mesh: im };
}

// ════════════════════════════════════════════════════════════════════════════════ sweat drop
let _dropGeo = null;
export function makeSweatDrop(opts = {}) {
  const size = opts.size ?? 0.12;
  _dropGeo ??= lathe([[0, -0.5], ...arc(-0.18, 0.32, -70, 25, 12), [0.18, 0.12], [0.1, 0.3], [0.035, 0.44], [0, 0.5]], 24);
  const g = new THREE.Group(); g.name = 'SweatDrop';
  const body = new THREE.Mesh(_dropGeo, new THREE.MeshStandardMaterial({ color: '#5ec8ff', roughness: 0.15, emissive: '#1f7fc4', emissiveIntensity: 0.45 }));
  const outline = new THREE.Mesh(_dropGeo, new THREE.MeshBasicMaterial({ color: '#0d3a66', side: THREE.BackSide }));
  outline.scale.setScalar(1.12); outline.position.y = -0.005;
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8).scale(0.7, 1.3, 0.4), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  shine.position.set(-0.12, -0.12, 0.25); shine.rotation.z = 0.35;
  g.add(outline, body, shine);
  g.scale.setScalar(size);
  return g;
}

// ════════════════════════════════════════════════════════════════════════════════ impact burst
let _burstTex = null;
function burstTexture() {
  return (_burstTex ??= canvasTexture(256, 256, (g, W) => {
    const c = W / 2;
    const star = (n, ro, ri, seed, rot = 0) => {
      const r = rng(seed); g.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * TAU + rot;
        const rr = i % 2 === 0 ? ro * (0.78 + 0.3 * r()) : ri * (0.85 + 0.3 * r());
        const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.closePath();
    };
    g.lineJoin = 'round';
    star(12, c * 0.97, c * 0.5, 3, 0.1); g.fillStyle = '#ff7a2f'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#3a1606'; g.stroke();
    star(12, c * 0.74, c * 0.4, 3, 0.1); g.fillStyle = '#ffe14a'; g.fill();
    star(9, c * 0.42, c * 0.24, 8, 0.35); g.fillStyle = '#ffffff'; g.fill();
  }));
}
export function makeImpactBurst(opts = {}) {
  const R = opts.size ?? 0.22;
  const overlay = opts.overlay ?? true;
  const root = new THREE.Group(); root.name = 'ImpactBurst';
  const inner = new THREE.Group(); root.add(inner);
  const bm = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  // comic star: a sprite, so it always faces the camera
  const sMat = new THREE.SpriteMaterial({ map: burstTexture(), transparent: true, depthWrite: false, depthTest: !overlay, toneMapped: false });
  const star = new THREE.Sprite(sMat);
  star.renderOrder = 10;
  inner.add(star);
  // shock ring on the table
  const mRing = bm('#ffffff');
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.0, 48).rotateX(-Math.PI / 2), mRing); ring.position.y = 0.002;
  inner.add(ring);
  // impact lines radiating low over the table (crossed quads so they read from any side)
  const diamond = new THREE.BufferGeometry();
  diamond.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.5, 0.5, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0.5, -0.5, 0, 0, 0, 0, 0.5, 0, 0.5, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0.5, 0, -0.5], 3));
  const mSpk = bm('#ffffff'), mSpk2 = bm('#ffe14a');
  const spikes = [];
  const rs = rng(17);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + rs() * 0.35, el = 0.12 + rs() * 0.4;
    const pivot = new THREE.Group();
    pivot.rotation.set(0, a, el, 'YXZ');
    pivot.position.y = 0.06;
    const sp = new THREE.Mesh(diamond, i % 2 ? mSpk : mSpk2);
    pivot.add(sp); inner.add(pivot);
    spikes.push({ sp, len: 0.55 + rs() * 0.35, w: 0.045 + rs() * 0.02, delay: rs() * 0.05 });
  }
  const rot0 = rs() * TAU;
  inner.scale.setScalar(R);
  function update(u) {
    inner.visible = u > 0 && u < 1;
    if (!inner.visible) return;
    const pop = u < 0.12 ? ease.outBack(u / 0.12) : 1 + 0.12 * (u - 0.12);
    const sz = 0.82 * pop;
    star.scale.set(sz, sz, 1);
    star.position.y = 0.3 + 0.12 * u;
    sMat.rotation = rot0 + 0.25 * u;
    sMat.opacity = 1 - smooth((u - 0.35) / 0.4);
    ring.scale.setScalar(0.3 + 1.3 * ease.outCubic(u));
    mRing.opacity = Math.pow(1 - u, 1.6) * 0.85;
    for (const s of spikes) {
      const v = clamp((u - s.delay) / (1 - s.delay), 0, 1);
      const ro = (0.25 + 1.05 * ease.outCubic(Math.min(1, v / 0.35))) * s.len;
      const ri = (0.2 + 1.1 * ease.inOutQuad(Math.max(0, (v - 0.15) / 0.85))) * s.len;
      const L = Math.max(0.0001, ro - ri), w = s.w * (1 - 0.6 * v) + 0.0001;
      s.sp.position.x = ri; s.sp.scale.set(L, w, w);
      s.sp.visible = v > 0;
    }
    mSpk.opacity = mSpk2.opacity = 1 - smooth((u - 0.5) / 0.4);
  }
  update(0.0001); inner.visible = false;
  return { root, update };
}
