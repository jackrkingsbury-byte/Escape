// Module A — blocky toy characters for "In This Town" (see SPEC.md §5).
//
// Exports (spec):
//   CHARACTER_HEIGHT = 2.0
//   makeCharacter(spec) → Character
//   makeCreature(kind /* 'pigeon' | 'cat' */, spec = {}) → Character
//
// Extra exports:
//   SEAT_HEIGHT = 0.55                     chair seat height the 'sit*' poses are built for
//   ACTIONS                                 every human pose action name
//   CREATURE_ACTIONS = { pigeon:[..], cat:[..] }
//   EXPRESSIONS                             every face expression name
//   WALK_SPEED, WALK_SAD_SPEED              root speed (m/s at params.speed = 1) that matches the stride
//   PIGEON_STRUT_SPEED                      ditto for the pigeon 'strut'
//   CHARACTER_OPTIONS = { skinned:false }   build switch (see below); mutate before building
//
// Extra spec fields (makeCharacter):
//   lod: 'low' (or lowDetail: true)  → crowd/background figure: 1-segment bevels, no fade shell, fewer tiny
//        details, casts NO shadow (still receives). Measured ~35% cheaper per figure. Use for bleacher crowds.
//   sashColor, capColor, blindfoldColor, number (for emblem 'number').
//   Accessory colours otherwise come from top.accent (sash/cap/bowtie/top-hat band) — e.g. mayor accent '#ffd23f'
//   gives a gold sash.  Hair 'fade' = crop + gradient skin-fade shell (the hero's look).
//
// Performance (SwiftShader, 720×1280, no MSAA): ≈4.5 ms per full-detail figure without shadows, ≈8.5 ms with
// a shadow-casting sun (shadow-map pass + PCF receive); lod:'low' ≈4 ms incl. receive. pose() ≈10 µs,
// face() ≈2 µs (textures are cached; the first use of an expression uploads a 512² canvas).
//
// Character extras (beyond the spec):
//   joints also has shinL/shinR (knees), footL/footR (ankles), handL/handR (empty Object3Ds at the
//     centre of each hand — parent props here, e.g. a chess piece) and for skirts/dresses `skirt`.
//   body                                    inner Group carrying spec.scale (root itself stays unscaled)
//   poseMix(actionA, tA, paramsA, actionB, tB, paramsB, w)   blend two poses (w 0 → A, 1 → B)
//   sitInfo = { hipZ, footZ }               where the seated hips / feet end up (body-local, before scale)
//   expression                              last face() expression
//   spec                                    normalised spec
//
// Pose params understood by (almost) every human action:
//   speed (tempo ×), intensity (0..1 amplitude), headYaw (+ turns toward the character's left/+X),
//   headPitch (+ tilts the face DOWN, − looks up), lookAt (THREE.Vector3 world point — place the root
//   before calling pose; replaces the action's head yaw/pitch, clamped), seated (true → the upper body
//   does the action while the hips sit on a seat: works for idle, laugh, clap, cheer, point, pointLaugh,
//   think, peer, shrug, surprised, stunned, wave, crossArms, dance…), seatHeight (world metres, default
//   0.55, e.g. a bleacher row), hipZ (seated hip pivot forward offset from the root, default 0.06).
// Action-specific params:
//   sit / sitIdle / sitSlam / peer: hands 'lap' | 'table' | 'none', tableY (world, default 0.78),
//     tableZ (forward distance from the root to where resting hands go, default 0.40 seated / 0.42 standing)
//   sitSlam / slam: hits [local times], slamZ (forward distance of the impact point, default 0.55 seated /
//     0.44 standing), slamX (lateral, default −0.16 = in front of the right shoulder), slamTarget (world
//     Vector3, overrides slamX/slamZ/tableY). The fist's lowest point touches tableY exactly at every hit.
//     With no hits a slam happens every 0.6 s starting at 0.45 s.
//   sitStand: u (0 seated → 1 standing), forward (default = seated foot position ≈ 0.33: at u = 1 the
//     standing body is that far in front of the root; move the root by sitInfo.footZ afterwards).
//   crowdSurf: lift (back height above the root, default 0). Body lies along Z, head toward −Z, face up,
//     centred over the root.
//   walk / walkSad: in place; move the root at WALK_SPEED / WALK_SAD_SPEED × speed.
//   pigeon huss: hits [times] (puff peaks), otherwise a held comedic puff.   cat hop: u 0..1 (else loops
//     every 1.3 s), height (default 0.42): the pose adds the vertical arc; the shot moves the root along the L.
//   Creatures accept headYaw/headPitch/lookAt too. Creature joints: hips (body), belly (body mesh, scaled
//     for puffs/breaths), torso (neck base / chest), head, armL/armR (pigeon wings | cat front legs),
//     legL/legR, plus pigeon jaw & tail, cat tail1/tail2.  Creature face() takes the human expression names
//     (pigeon beak opens for huss/laugh/shocked/grin); the cat also has 'stare'.
// Seated geometry: with the root on the chair origin (seat 0.55, chair faces +Z) the hip pivot sits at
//   z = +0.06 (hipZ), thigh undersides exactly at y 0.55, thighs horizontal, knees at z ≈ 0.33, shins
//   vertical, soles on the floor (characters with scale < 1 dangle their feet a little; > 1 angle the shins).
// Extra human actions: pointLaugh (point + laugh), crossArms.
//
// Units: metres, Y up, feet at the origin, facing +Z.  Deterministic: pose()/face() are pure functions
// of their arguments (no random, no clocks) — every call resets every joint from the rest pose.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smooth, ease, hash, noise1, canvasTexture, rbox as rboxU } from './lib/util.js';

export const CHARACTER_HEIGHT = 2.0;
export const SEAT_HEIGHT = 0.55;
// Build options read by makeCharacter/makeCreature at construction time (mutate before building).
//   skinned: false → one merged vertex-coloured mesh per joint (default; measured ~5% faster on SwiftShader)
//            true  → one SkinnedMesh per figure (fewest draw calls; pick this if draw calls ever dominate)
export const CHARACTER_OPTIONS = { skinned: false };
let _lowDetail = false;

export const ACTIONS = ['idle', 'dance', 'dance2', 'walk', 'sit', 'sitSlam', 'slam', 'laugh', 'point', 'clap',
  'cheer', 'surprised', 'shrug', 'think', 'peer', 'crowdSurf', 'walkSad', 'stunned', 'wave', 'sitIdle',
  'sitStand', 'pointLaugh', 'crossArms'];
export const CREATURE_ACTIONS = {
  pigeon: ['idle', 'peck', 'strut', 'flap', 'huss', 'knock', 'sit'],
  cat: ['idle', 'hop', 'sit', 'loaf', 'stare'],
};
export const EXPRESSIONS = ['neutral', 'smile', 'grin', 'laugh', 'determined', 'huss', 'shocked', 'sad', 'smug',
  'squint', 'sweat', 'sleepy', 'wink'];

const PI = Math.PI, TAU = PI * 2;

// ---- human body dimensions (unscaled; standard figure is exactly 2.0 tall) ----------------------
const HIP_Y = 0.92;          // hip pivot height when standing
const THIGH = 0.265;         // hip pivot → knee pivot
const SHIN = 0.585;          // knee pivot → ankle pivot (seated: knee 0.655 − ankle 0.07 = exactly SHIN)
const ANKLE_H = 0.07;        // ankle pivot → sole
const LEG_D = 0.21;          // leg depth (= vertical thickness of a horizontal thigh)
const TORSO_TOP = 0.48;      // torso top above the hip pivot
const SHOULDER_Y = 0.40;     // shoulder pivots above the hip pivot
const ARM_D = 0.17;
const UPPER = 0.27;          // shoulder → elbow
const FORE = 0.31;           // elbow → hand centre
const HAND = 0.14;
const NECK_Y = 0.50;         // head pivot above the hip pivot
const HEAD_W = 0.64, HEAD_H = 0.58, HEAD_D = 0.56, HEAD_R = 0.075;
const FACE_Y = 0.285, FACE_SIZE = 0.58;   // face decal centre (head-local) and size
const SIT_HIP_Z = 0.06;

export const WALK_SPEED = 0.9;
export const WALK_SAD_SPEED = 0.4;
export const PIGEON_STRUT_SPEED = 0.22;

// ---- scratch (no state survives a call) -----------------------------------------------------------
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _v5 = new THREE.Vector3(), _v6 = new THREE.Vector3(), _v7 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _e1 = new THREE.Euler();
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
const X_AXIS = new THREE.Vector3(1, 0, 0), Y_AXIS = new THREE.Vector3(0, 1, 0), Z_AXIS = new THREE.Vector3(0, 0, 1);

// ---- colour helpers -------------------------------------------------------------------------------
function hexToRgb(hex) {
  const c = new THREE.Color(hex);
  const s = c.getHexString();
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function rgbStr(r, g, b, a = 1) { return a >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`; }
function mixHex(a, b, u) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const h = (x) => Math.round(x).toString(16).padStart(2, '0');
  return '#' + h(A[0] + (B[0] - A[0]) * u) + h(A[1] + (B[1] - A[1]) * u) + h(A[2] + (B[2] - A[2]) * u);
}
function shade(hex, k) { return k < 1 ? mixHex(hex, '#000000', 1 - k) : mixHex(hex, '#ffffff', k - 1); }
function lum(hex) { const [r, g, b] = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

// ---- materials & geometry caches --------------------------------------------------------------------
// rounded box: small parts get a single bevel segment (indistinguishable at that size, ~3× fewer triangles)
function rbox(w, h, d, r = 0.06, seg) { return rboxU(w, h, d, r, _lowDetail ? 1 : Math.min(seg ?? 9, Math.max(w, h, d) < 0.45 ? 1 : 2)); }
const _vcMats = {};
function vcMat(kind) {
  if (!_vcMats[kind]) {
    const o = { vertexColors: true, roughness: 0.78, metalness: 0 };
    if (kind === 'gloss') o.roughness = 0.3;
    if (kind === 'gold') { o.roughness = 0.36; o.metalness = 0.35; }
    _vcMats[kind] = new THREE.MeshStandardMaterial(o);
  }
  return _vcMats[kind];
}
const _geo = new Map();
function cgeo(key, make) { let g = _geo.get(key); if (!g) { g = make(); _geo.set(key, g); } return g; }
const cyl = (rt, rb, h, seg = 16) => cgeo(`cyl${rt}|${rb}|${h}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
const sph = (r, ws = 14, hs = 10) => cgeo(`sph${r}|${ws}|${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
const ico = (r, d = 1) => cgeo(`ico${r}|${d}`, () => new THREE.IcosahedronGeometry(r, d));
const cone = (r, h, seg = 4) => cgeo(`cone${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg));
const torus = (R, r, rs = 8, ts = 24, arc = TAU) => cgeo(`tor${R}|${r}|${rs}|${ts}|${arc}`, () => new THREE.TorusGeometry(R, r, rs, ts, arc));
const plane = (w, h) => cgeo(`pl${w}|${h}`, () => new THREE.PlaneGeometry(w, h));
// rounded box whose bottom is narrower (taper = bottom width / top width)
function taperBox(w, h, d, r, taper) {
  return cgeo(`tb${w}|${h}|${d}|${r}|${taper}`, () => {
    const g = rbox(w, h, d, r, 2).clone();
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), k = lerp(taper, 1, (y + h / 2) / h);
      p.setX(i, p.getX(i) * k);
    }
    return g;
  });
}

// Collects coloured parts for one joint, then merges them into one vertex-coloured mesh per material
// kind (→ ~1 draw call per joint).
class Bag {
  constructor() { this.items = []; }
  add(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1], kind = 'vc', flat = false) {
    const m = new THREE.Matrix4().compose(_v1.set(pos[0], pos[1], pos[2]),
      _q1.setFromEuler(_e1.set(rot[0], rot[1], rot[2], rot[3] || 'XYZ')),
      _v2.set(scl[0], scl[1], scl[2]));
    this.items.push({ geo, color, m, kind, flat });
    return this;
  }
  build(target, shadow = true) {
    if (_collect) { _collect.take(this, target); return []; }
    const byKind = new Map();
    for (const it of this.items) { if (!byKind.has(it.kind)) byKind.set(it.kind, []); byKind.get(it.kind).push(it); }
    const out = [];
    const col = new THREE.Color();
    for (const [kind, list] of byKind) {
      const geos = list.map((it) => {
        const g = it.geo.index ? it.geo.toNonIndexed() : it.geo.clone();
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
        g.clearGroups();
        g.applyMatrix4(it.m);
        if (it.flat) g.computeVertexNormals();
        col.set(it.color);
        const n = g.attributes.position.count, arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
        g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
        return g;
      });
      const raw = mergeGeometries(geos);
      geos.forEach((g) => g.dispose());
      const merged = mergeVertices(raw, 1e-4);   // re-index: far fewer vertex-shader runs (big win on SwiftShader)
      raw.dispose();
      merged.userData.owned = true;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, vcMat(kind));
      mesh.castShadow = shadow; mesh.receiveShadow = true;
      target.add(mesh); out.push(mesh);
    }
    this.items.length = 0;
    return out;
  }
}

// While a SkinCollector is active, Bag.build() hands its parts to it instead of making meshes; the
// collector then emits ONE SkinnedMesh per material kind for the whole figure (every joint is a Bone).
// Draw calls are the main cost on the software GPU (~0.3 ms each), so this halves a character's cost.
let _collect = null;
class SkinCollector {
  constructor() { this.parts = []; }
  take(bag, bone) { for (const it of bag.items) { it.bone = bone; this.parts.push(it); } bag.items.length = 0; }
  build(container, bones, shadow = true, radius = 2.4, center = [0, 1, 0]) {
    if (!this.parts.length) return [];
    container.updateWorldMatrix(true, true);
    const skeleton = new THREE.Skeleton(bones);
    const invC = new THREE.Matrix4().copy(container.matrixWorld).invert();
    const index = new Map(bones.map((b, i) => [b, i]));
    const byKind = new Map();
    for (const it of this.parts) { if (!byKind.has(it.kind)) byKind.set(it.kind, []); byKind.get(it.kind).push(it); }
    const col = new THREE.Color(), rel = new THREE.Matrix4();
    const out = [];
    for (const [kind, list] of byKind) {
      const geos = list.map((it) => {
        const g = it.geo.index ? it.geo.toNonIndexed() : it.geo.clone();
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
        g.clearGroups();
        g.applyMatrix4(it.m);
        if (it.flat) g.computeVertexNormals();
        g.applyMatrix4(rel.multiplyMatrices(invC, it.bone.matrixWorld));
        col.set(it.color);
        const n = g.attributes.position.count, c = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
        const bi = index.get(it.bone);
        for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; si[i * 4] = bi; sw[i * 4] = 1; }
        g.setAttribute('color', new THREE.BufferAttribute(c, 3));
        g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
        g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
        return g;
      });
      const raw = mergeGeometries(geos);
      geos.forEach((g) => g.dispose());
      const merged = mergeVertices(raw, 1e-4);
      raw.dispose();
      merged.userData.owned = true;
      const mesh = new THREE.SkinnedMesh(merged, vcMat(kind));
      mesh.name = 'skin:' + kind;
      container.add(mesh);
      mesh.bind(skeleton);
      mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(...center), radius);
      mesh.castShadow = shadow; mesh.receiveShadow = true;
      out.push(mesh);
    }
    this.parts.length = 0;
    return out;
  }
}

// ======================================================================================================
//  Painted faces (CanvasTexture decals)
// ======================================================================================================
const LINE = '#151515';
const MOUTH_IN = '#5a1622';
const TONGUE = '#ff6f86';
const _faceTex = new Map();

function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); }
function strokePath(g, color, w, pts, close = false) {
  g.strokeStyle = color; g.lineWidth = w; g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  if (close) g.closePath();
  g.stroke();
}
function strokeQ(g, color, w, x0, y0, cx, cy, x1, y1) {
  g.strokeStyle = color; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke();
}
function erase(g, fn) { g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; fn(); g.restore(); }
function drop(g, x, y, s, fill = '#7fd0ff', edge = '#2b86c8') {
  g.beginPath();
  g.moveTo(x, y - 30 * s);
  g.bezierCurveTo(x + 6 * s, y - 14 * s, x + 20 * s, y - 2 * s, x + 20 * s, y + 12 * s);
  g.arc(x, y + 12 * s, 20 * s, 0, PI);
  g.bezierCurveTo(x - 20 * s, y - 2 * s, x - 6 * s, y - 14 * s, x, y - 30 * s);
  g.closePath();
  g.fillStyle = fill; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = edge; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.9)'; ell(g, x - 7 * s, y + 8 * s, 5 * s, 8 * s, -0.4); g.fill();
}

// --- human face kit (512 px canvas ↔ FACE_SIZE metres) ---
const FX = 108, FEY = 232, FBY = 156, FMY = 374;
const HUMAN_FACES = {
  //            eyes            brows      mouth     extras                       blinkEye
  neutral:    { e: 'open',     b: 'flat',  m: 'small', blush: 0.22, blink: 'closed' },
  smile:      { e: 'open',     b: 'soft',  m: 'smile', blush: 0.3, blink: 'closed' },
  grin:       { e: 'happy',    b: 'raised', m: 'grin', blush: 0.38, blink: 'arc' },
  laugh:      { e: 'arc',      b: 'high',  m: 'laugh', blush: 0.45 },
  determined: { e: 'determined', b: 'angry', m: 'firm', blush: 0, blink: 'detClosed' },
  huss:       { e: 'squeeze',  b: 'furious', m: 'shout', blush: 0.4, vein: true },
  shocked:    { e: 'wide',     b: 'high',  m: 'O', blush: 0, blink: 'closed' },
  sad:        { e: 'sad',      b: 'worried', m: 'frown', blush: 0.15, tear: true, blink: 'closed' },
  smug:       { e: 'half',     b: 'smug',  m: 'smirk', blush: 0.2, blink: 'closed' },
  squint:     { e: 'squint',   b: 'furrow', m: 'pursed', blush: 0 },
  sweat:      { e: 'small',    b: 'worried', m: 'wavy', blush: 0, sweat: true, blink: 'closed' },
  sleepy:     { e: 'sleepy',   b: 'low',   m: 'yawn', blush: 0.15, blink: 'closed' },
  wink:       { e: 'open', eR: 'winkArc', b: 'soft', bR: 'raised', m: 'tongue', blush: 0.3, blink: 'closed' },
};

function humanEye(g, kind, x, y, side, C) {
  const inn = -side; // +1 means "toward the nose" along +x
  g.lineCap = 'round'; g.lineJoin = 'round';
  const oval = (rx = 31, ry = 41, dx = 0) => {
    g.fillStyle = C.eye; ell(g, x + dx, y, rx, ry); g.fill();
  };
  const shine = (dx = 0, s = 1) => {
    g.fillStyle = '#ffffff'; ell(g, x + dx - 10 * s, y - 14 * s, 11 * s, 12 * s); g.fill();
    ell(g, x + dx + 10 * s, y + 13 * s, 5 * s, 5 * s); g.fill();
  };
  switch (kind) {
    case 'open': oval(); shine(); break;
    case 'small': oval(25, 33, 8); shine(8, 0.8); break;
    case 'happy':
      oval(32, 40); shine();
      erase(g, () => { ell(g, x, y + 50, 50, 32); g.fill(); });
      break;
    case 'arc': strokeQ(g, LINE, 17, x - 32, y + 12, x, y - 36, x + 32, y + 12); break;
    case 'winkArc': strokeQ(g, LINE, 16, x - 32, y + 4, x, y - 26, x + 32, y + 4); break;
    case 'closed': strokeQ(g, LINE, 15, x - 31, y + 2, x, y + 18, x + 31, y + 2); break;
    case 'detClosed': strokePath(g, LINE, 16, [x - inn * 32, y - 4, x + inn * 32, y + 10]); break;
    case 'determined':
      oval(31, 38, 0);
      g.fillStyle = '#ffffff'; ell(g, x - 2 * inn, y + 4, 9, 10); g.fill();
      erase(g, () => { g.beginPath(); g.moveTo(x - inn * 60, y - 90); g.lineTo(x + inn * 60, y - 90); g.lineTo(x + inn * 60, y - 4); g.lineTo(x - inn * 60, y - 34); g.closePath(); g.fill(); });
      strokePath(g, LINE, 15, [x - inn * 36, y - 31, x + inn * 36, y - 6]);
      break;
    case 'sad':
      oval(30, 38); shine(0, 0.9);
      erase(g, () => { g.beginPath(); g.moveTo(x - inn * 60, y - 90); g.lineTo(x + inn * 60, y - 90); g.lineTo(x + inn * 60, y - 34); g.lineTo(x - inn * 60, y - 10); g.closePath(); g.fill(); });
      strokePath(g, LINE, 13, [x - inn * 34, y - 12, x + inn * 34, y - 32]);
      break;
    case 'half':
      oval(31, 38); g.fillStyle = '#ffffff'; ell(g, x + 9, y + 10, 8, 8); g.fill();
      erase(g, () => { g.fillRect(x - 60, y - 80, 120, 80); });
      strokeQ(g, LINE, 15, x - 35, y + 2, x, y - 6, x + 35, y + 2);
      break;
    case 'sleepy':
      oval(30, 36); erase(g, () => { g.fillRect(x - 60, y - 80, 120, 92); });
      strokeQ(g, LINE, 14, x - 33, y + 10, x, y + 18, x + 33, y + 10);
      break;
    case 'wide':
      g.fillStyle = '#ffffff'; ell(g, x, y, 44, 47); g.fill();
      g.lineWidth = 9; g.strokeStyle = LINE; g.stroke();
      g.fillStyle = C.eye; ell(g, x + inn * 3, y + 3, 15, 16); g.fill();
      g.fillStyle = '#ffffff'; ell(g, x + inn * 3 - 5, y - 3, 5, 5); g.fill();
      break;
    case 'squeeze':
      strokePath(g, LINE, 17, [x - inn * 28, y - 26, x + inn * 24, y + 2, x - inn * 28, y + 28]);
      break;
    case 'squint':
      strokeQ(g, LINE, 17, x - 34, y + 6, x, y - 6, x + 34, y + 6);
      strokePath(g, LINE, 8, [x - inn * 40, y - 8, x - inn * 52, y - 18]);
      strokePath(g, LINE, 8, [x - inn * 41, y + 12, x - inn * 53, y + 20]);
      break;
    default: oval(); shine();
  }
}

function humanBrow(g, kind, x, y, side, C) {
  const inn = -side;
  const col = C.brow;
  g.lineCap = 'round';
  switch (kind) {
    case 'flat': strokePath(g, col, 18, [x - inn * 34, y - 2, x + inn * 32, y + 2]); break;
    case 'soft': strokeQ(g, col, 18, x - 36, y + 4, x, y - 12, x + 36, y + 4); break;
    case 'raised': strokeQ(g, col, 18, x - 36, y - 6, x, y - 26, x + 36, y - 6); break;
    case 'high': strokeQ(g, col, 18, x - 36, y - 14, x, y - 42, x + 36, y - 14); break;
    case 'angry': strokePath(g, col, 22, [x - inn * 40, y - 12, x + inn * 34, y + 24]); break;
    case 'furious': strokePath(g, col, 24, [x - inn * 42, y - 18, x + inn * 34, y + 30]); break;
    case 'worried': strokePath(g, col, 18, [x - inn * 36, y + 12, x + inn * 32, y - 14]); break;
    case 'furrow': strokePath(g, col, 20, [x - inn * 36, y + 4, x + inn * 30, y + 22]); break;
    case 'low': strokePath(g, col, 17, [x - inn * 36, y + 18, x + inn * 30, y + 14]); break;
    case 'smug': if (side < 0) strokePath(g, col, 18, [x - 34, y + 8, x + 32, y + 10]); else strokeQ(g, col, 18, x - 34, y - 8, x, y - 30, x + 36, y - 6); break;
    default: strokePath(g, col, 18, [x - 34, y, x + 34, y]);
  }
}

function mouthShape(g, pathFn, { teethTop = 0, teethBot = 0, tongue = null } = {}) {
  pathFn(); g.fillStyle = MOUTH_IN; g.fill();
  g.save(); pathFn(); g.clip();
  if (tongue) { g.fillStyle = TONGUE; ell(g, tongue[0], tongue[1], tongue[2], tongue[3]); g.fill(); }
  g.fillStyle = '#ffffff';
  if (teethTop) g.fillRect(0, 0, 512, teethTop);
  if (teethBot) g.fillRect(0, teethBot, 512, 512 - teethBot);
  g.restore();
  pathFn(); g.lineWidth = 12; g.strokeStyle = LINE; g.lineJoin = 'round'; g.stroke();
}

function humanMouth(g, kind) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  const y = FMY;
  switch (kind) {
    case 'small': strokeQ(g, LINE, 13, 228, y - 4, 256, y + 14, 284, y - 4); break;
    case 'smile': strokeQ(g, LINE, 15, 194, y - 20, 256, y + 42, 318, y - 20); break;
    case 'grin':
      mouthShape(g, () => { g.beginPath(); g.moveTo(188, y - 24); g.lineTo(324, y - 24); g.quadraticCurveTo(318, y + 56, 256, y + 56); g.quadraticCurveTo(194, y + 56, 188, y - 24); g.closePath(); },
        { teethTop: y - 4, tongue: [256, y + 52, 40, 24] });
      break;
    case 'laugh':
      mouthShape(g, () => { g.beginPath(); g.moveTo(178, y - 34); g.lineTo(334, y - 34); g.quadraticCurveTo(330, y + 66, 256, y + 66); g.quadraticCurveTo(182, y + 66, 178, y - 34); g.closePath(); },
        { teethTop: y - 12, tongue: [256, y + 62, 52, 30] });
      break;
    case 'firm':
      strokeQ(g, LINE, 18, 210, y + 8, 256, y - 8, 302, y + 8);
      break;
    case 'shout':
      mouthShape(g, () => { g.beginPath(); g.moveTo(192, y - 34); g.quadraticCurveTo(256, y - 46, 320, y - 34); g.quadraticCurveTo(334, y + 30, 300, y + 62); g.quadraticCurveTo(256, y + 72, 212, y + 62); g.quadraticCurveTo(178, y + 30, 192, y - 34); g.closePath(); },
        { teethTop: y - 18, teethBot: y + 54, tongue: [256, y + 56, 40, 22] });
      break;
    case 'O':
      mouthShape(g, () => { ell(g, 256, y + 10, 27, 36); }, { tongue: [256, y + 40, 18, 12] });
      break;
    case 'frown': strokeQ(g, LINE, 15, 208, y + 22, 256, y - 22, 304, y + 22); break;
    case 'smirk':
      strokeQ(g, LINE, 15, 214, y + 8, 268, y + 16, 304, y - 18);
      strokePath(g, LINE, 9, [310, y - 26, 316, y - 10]);
      break;
    case 'pursed':
      g.strokeStyle = LINE; g.lineWidth = 12; g.beginPath(); g.moveTo(234, y + 8);
      g.quadraticCurveTo(246, y - 6, 258, y + 6); g.quadraticCurveTo(270, y + 18, 282, y + 4); g.stroke();
      break;
    case 'wavy': strokePath(g, LINE, 12, [204, y + 8, 220, y - 6, 238, y + 10, 256, y - 6, 274, y + 10, 292, y - 6, 308, y + 8]); break;
    case 'yawn': mouthShape(g, () => { ell(g, 256, y + 12, 17, 22); }); break;
    case 'tongue':
      g.fillStyle = TONGUE; g.beginPath(); g.moveTo(256, y + 18); g.lineTo(296, y + 12);
      g.quadraticCurveTo(300, y + 52, 276, y + 50); g.quadraticCurveTo(256, y + 48, 256, y + 18); g.fill();
      g.lineWidth = 8; g.strokeStyle = LINE; g.stroke();
      strokeQ(g, LINE, 15, 200, y - 14, 256, y + 36, 314, y - 14);
      break;
    default: strokeQ(g, LINE, 13, 228, y, 256, y + 12, 284, y);
  }
}

function drawHumanFace(g, expr, blink, C) {
  g.clearRect(0, 0, 512, 512);
  const F = HUMAN_FACES[expr] || HUMAN_FACES.neutral;
  const L = 256 - FX, R = 256 + FX;
  if (F.blush) {
    g.fillStyle = `rgba(255,92,120,${F.blush})`;
    ell(g, 256 - 150, 316, 38, 22); g.fill(); ell(g, 256 + 150, 316, 38, 22); g.fill();
  }
  // nose: soft little arc in a darker skin tone
  g.lineCap = 'round';
  strokeQ(g, C.nose, 10, 244, 290, 256, 306, 268, 290);
  const eL = blink && F.blink ? F.blink : F.e;
  const eR = blink && F.blink ? F.blink : (F.eR || F.e);
  humanEye(g, eL, L, FEY, -1, C);
  humanEye(g, eR, R, FEY, +1, C);
  humanBrow(g, F.b, L, FBY, -1, C);
  humanBrow(g, F.bR || F.b, R, FBY, +1, C);
  humanMouth(g, F.m);
  if (F.sweat) drop(g, 384, 150, 1.15);
  if (F.tear) drop(g, L - 30, FEY + 62, 0.65);
  if (F.vein) {
    g.strokeStyle = '#e8333b'; g.lineWidth = 10; g.lineCap = 'round';
    const vx = 392, vy = 108;
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.beginPath(); g.moveTo(vx + a * 8, vy + b * 26); g.quadraticCurveTo(vx + a * 6, vy + b * 6, vx + a * 26, vy + b * 8); g.stroke();
    }
  }
}

function humanFaceTexture(expr, blink, C) {
  const key = `h|${expr}|${blink ? 1 : 0}|${C.eye}|${C.brow}|${C.nose}`;
  let t = _faceTex.get(key);
  if (!t) { t = canvasTexture(512, 512, (g) => drawHumanFace(g, expr, blink, C)); _faceTex.set(key, t); }
  return t;
}

// --- pigeon face (256 px ↔ 0.14 m) ---
const PIGEON_FACES = {
  neutral: 'open', smile: 'happy', grin: 'arc', laugh: 'arc', determined: 'det', huss: 'squeeze',
  shocked: 'wide', sad: 'sad', smug: 'half', squint: 'squint', sweat: 'open', sleepy: 'sleepy', wink: 'wink',
};
const PIGEON_BEAK = { huss: 1, laugh: 0.75, shocked: 0.55, grin: 0.35, sweat: 0.15 };
function drawPigeonFace(g, expr, blink) {
  g.clearRect(0, 0, 256, 256);
  let kind = PIGEON_FACES[expr] || 'open';
  if (blink && ['open', 'happy', 'det', 'wide', 'sad', 'half', 'wink'].includes(kind)) kind = kind === 'det' ? 'detClosed' : 'closed';
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const side of [-1, 1]) {
    const x = 128 + side * 64, y = 104, inn = -side;
    let k = kind;
    if (kind === 'wink') k = side > 0 ? 'arc' : 'open';
    const orange = (r = 40, pr = 16) => {
      g.fillStyle = '#ff8a1c'; ell(g, x, y, r, r); g.fill();
      g.lineWidth = 7; g.strokeStyle = '#3a2a1a'; g.stroke();
      g.fillStyle = '#101010'; ell(g, x + inn * 3, y + 2, pr, pr); g.fill();
      g.fillStyle = '#ffffff'; ell(g, x - 10, y - 12, 7, 7); g.fill();
    };
    switch (k) {
      case 'open': orange(); break;
      case 'wide': orange(46, 8); break;
      case 'happy': orange(); erase(g, () => { ell(g, x, y + 46, 46, 28); g.fill(); }); break;
      case 'arc': strokeQ(g, LINE, 12, x - 30, y + 12, x, y - 30, x + 30, y + 12); break;
      case 'closed': strokeQ(g, LINE, 11, x - 30, y, x, y + 14, x + 30, y); break;
      case 'detClosed': strokePath(g, LINE, 12, [x - inn * 30, y - 6, x + inn * 30, y + 8]); break;
      case 'det':
        orange(40, 15);
        erase(g, () => { g.beginPath(); g.moveTo(x - inn * 60, y - 80); g.lineTo(x + inn * 60, y - 80); g.lineTo(x + inn * 60, y - 2); g.lineTo(x - inn * 60, y - 34); g.closePath(); g.fill(); });
        strokePath(g, LINE, 12, [x - inn * 44, y - 32, x + inn * 40, y - 4]);
        break;
      case 'sad':
        orange(38, 15);
        erase(g, () => { g.beginPath(); g.moveTo(x - inn * 60, y - 80); g.lineTo(x + inn * 60, y - 80); g.lineTo(x + inn * 60, y - 32); g.lineTo(x - inn * 60, y - 6); g.closePath(); g.fill(); });
        strokePath(g, LINE, 10, [x - inn * 40, y - 10, x + inn * 40, y - 32]);
        break;
      case 'half':
        orange(); erase(g, () => g.fillRect(x - 60, y - 70, 120, 66)); strokePath(g, LINE, 10, [x - 40, y - 4, x + 40, y - 4]);
        break;
      case 'sleepy':
        orange(); erase(g, () => g.fillRect(x - 60, y - 70, 120, 82)); strokeQ(g, LINE, 10, x - 38, y + 10, x, y + 16, x + 38, y + 10);
        break;
      case 'squeeze': strokePath(g, LINE, 13, [x - inn * 26, y - 24, x + inn * 22, y + 2, x - inn * 26, y + 26]); break;
      case 'squint': strokeQ(g, LINE, 13, x - 32, y + 4, x, y - 6, x + 32, y + 4); break;
      default: orange();
    }
  }
  if (expr === 'sweat') drop(g, 212, 40, 0.75);
}
function pigeonFaceTexture(expr, blink) {
  const key = `p|${expr}|${blink ? 1 : 0}`;
  let t = _faceTex.get(key);
  if (!t) { t = canvasTexture(256, 256, (g) => drawPigeonFace(g, expr, blink)); _faceTex.set(key, t); }
  return t;
}

// --- cat face (512 px ↔ 0.21 m) ---
const CAT_FACES = {
  neutral: 'open', smile: 'arc', grin: 'arc', laugh: 'arc', determined: 'det', huss: 'squeeze', shocked: 'wide',
  sad: 'sad', smug: 'half', squint: 'squint', sweat: 'open', sleepy: 'sleepy', wink: 'wink', stare: 'stare',
};
function drawCatFace(g, expr, blink) {
  g.clearRect(0, 0, 512, 512);
  g.lineCap = 'round'; g.lineJoin = 'round';
  // forehead tabby stripes
  g.fillStyle = '#b8530f';
  for (const dx of [-46, 0, 46]) { g.beginPath(); g.moveTo(256 + dx - 13, 60); g.lineTo(256 + dx + 13, 60); g.lineTo(256 + dx + 5, 132); g.lineTo(256 + dx - 5, 132); g.closePath(); g.fill(); }
  // white muzzle
  g.fillStyle = '#fff3e3'; ell(g, 222, 352, 62, 50); g.fill(); ell(g, 290, 352, 62, 50); g.fill();
  let kind = CAT_FACES[expr] || 'open';
  if (blink && ['open', 'det', 'wide', 'sad', 'half', 'wink', 'stare'].includes(kind)) kind = 'closed';
  for (const side of [-1, 1]) {
    const x = 256 + side * 118, y = 226, inn = -side;
    let k = kind;
    if (kind === 'wink') k = side > 0 ? 'arc' : 'open';
    const almond = (ry = 46, slit = 9) => {
      g.fillStyle = '#c9dc3c'; g.beginPath(); g.moveTo(x - 60, y); g.quadraticCurveTo(x, y - ry * 2, x + 60, y); g.quadraticCurveTo(x, y + ry * 2, x - 60, y); g.closePath(); g.fill();
      g.lineWidth = 9; g.strokeStyle = LINE; g.stroke();
      g.fillStyle = '#121212'; ell(g, x + inn * 2, y, slit, ry * 0.86); g.fill();
      g.fillStyle = '#ffffff'; ell(g, x - 18, y - 16, 9, 9); g.fill();
    };
    switch (k) {
      case 'open': almond(); break;
      case 'stare': almond(52, 6); break;
      case 'wide':
        g.fillStyle = '#c9dc3c'; ell(g, x, y, 56, 56); g.fill(); g.lineWidth = 9; g.strokeStyle = LINE; g.stroke();
        g.fillStyle = '#121212'; ell(g, x, y, 32, 34); g.fill(); g.fillStyle = '#fff'; ell(g, x - 12, y - 14, 10, 10); g.fill();
        break;
      case 'arc': strokeQ(g, LINE, 18, x - 50, y + 14, x, y - 40, x + 50, y + 14); break;
      case 'closed': strokeQ(g, LINE, 16, x - 50, y, x, y + 22, x + 50, y); break;
      case 'det':
        almond(44, 7);
        erase(g, () => { g.beginPath(); g.moveTo(x - inn * 80, y - 100); g.lineTo(x + inn * 80, y - 100); g.lineTo(x + inn * 80, y - 4); g.lineTo(x - inn * 80, y - 40); g.closePath(); g.fill(); });
        strokePath(g, LINE, 16, [x - inn * 60, y - 38, x + inn * 58, y - 6]);
        break;
      case 'sad':
        almond(42, 9);
        erase(g, () => { g.beginPath(); g.moveTo(x - inn * 80, y - 100); g.lineTo(x + inn * 80, y - 100); g.lineTo(x + inn * 80, y - 40); g.lineTo(x - inn * 80, y - 8); g.closePath(); g.fill(); });
        strokePath(g, LINE, 14, [x - inn * 58, y - 10, x + inn * 56, y - 38]);
        break;
      case 'half':
        almond(); erase(g, () => g.fillRect(x - 80, y - 100, 160, 96)); strokePath(g, LINE, 14, [x - 58, y - 4, x + 58, y - 4]);
        break;
      case 'sleepy':
        almond(); erase(g, () => g.fillRect(x - 80, y - 100, 160, 108)); strokeQ(g, LINE, 14, x - 56, y + 8, x, y + 18, x + 56, y + 8);
        break;
      case 'squeeze': strokePath(g, LINE, 18, [x - inn * 44, y - 34, x + inn * 34, y + 2, x - inn * 44, y + 38]); break;
      case 'squint': strokeQ(g, LINE, 18, x - 52, y + 6, x, y - 10, x + 52, y + 6); break;
      default: almond();
    }
  }
  // nose + mouth
  g.fillStyle = '#ff8fa3'; g.beginPath(); g.moveTo(232, 312); g.lineTo(280, 312); g.lineTo(256, 338); g.closePath(); g.fill();
  g.lineWidth = 6; g.strokeStyle = LINE; g.stroke();
  const open = { huss: 1, laugh: 0.8, shocked: 0.6, grin: 0.4 }[expr] || 0;
  if (open > 0) {
    const h = 30 + 50 * open;
    mouthShape(g, () => { g.beginPath(); g.moveTo(214, 352); g.quadraticCurveTo(256, 344, 298, 352); g.quadraticCurveTo(292, 352 + h, 256, 356 + h); g.quadraticCurveTo(220, 352 + h, 214, 352); g.closePath(); }, { tongue: [256, 356 + h, 26, 16] });
    g.fillStyle = '#fff'; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(256 + sx * 34, 352); g.lineTo(256 + sx * 22, 352); g.lineTo(256 + sx * 28, 374); g.closePath(); g.fill(); }
  } else {
    g.strokeStyle = LINE; g.lineWidth = 9; g.beginPath(); g.moveTo(256, 338); g.lineTo(256, 352);
    g.moveTo(218, 350); g.quadraticCurveTo(236, 372, 256, 352); g.quadraticCurveTo(276, 372, 294, 350); g.stroke();
  }
  // whiskers
  g.strokeStyle = '#2a2a2a'; g.lineWidth = 5;
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    g.beginPath(); g.moveTo(256 + side * 92, 340 + i * 16); g.lineTo(256 + side * 190, 322 + i * 26); g.stroke();
  }
  if (expr === 'sweat') drop(g, 410, 120, 1.3);
}
function catFaceTexture(expr, blink) {
  const key = `c|${expr}|${blink ? 1 : 0}`;
  let t = _faceTex.get(key);
  if (!t) { t = canvasTexture(512, 512, (g) => drawCatFace(g, expr, blink)); _faceTex.set(key, t); }
  return t;
}

function makeFaceMaterial(tex) {
  return new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.72, metalness: 0,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
}
function isBlinking(t, phase, period = 3.1, dur = 0.12) {
  const x = (((t + phase) % period) + period) % period;
  return x < dur;
}

// ======================================================================================================
//  Emblems, party hats, misc textures
// ======================================================================================================
function knightPath(g, s, ox, oy) {
  const P = (x, y) => [ox + x * s, oy + y * s];
  g.beginPath();
  const pts = [
    [24, 97], [76, 97], [77, 86], [70, 82], [69, 70], [72, 56], [73, 42], [70, 30], [64, 21], [57, 15],
    [55, 6], [50, 12], [47, 9], [43, 15], [37, 17], [30, 25], [22, 34], [16, 43], [14, 50], [18, 56],
    [25, 58], [33, 55], [40, 51], [45, 52], [44, 58], [38, 66], [33, 75], [31, 82], [24, 86],
  ];
  g.moveTo(...P(...pts[0]));
  for (let i = 1; i < pts.length; i++) g.lineTo(...P(...pts[i]));
  g.closePath();
}
const _emblemMat = new Map();
function emblemMaterial(kind, accent, base, extra = '') {
  const key = `${kind}|${accent}|${base}|${extra}`;
  let m = _emblemMat.get(key);
  if (m) return m;
  const tex = canvasTexture(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = accent; g.strokeStyle = accent; g.lineJoin = 'round'; g.lineCap = 'round';
    if (kind === 'knight') {
      knightPath(g, 2.4, 8, 6); g.fill();
      g.lineWidth = 6; g.stroke();
      erase(g, () => {
        ell(g, 8 + 40 * 2.4, 6 + 28 * 2.4, 7.5, 7.5); g.fill();                  // eye
        ell(g, 8 + 19 * 2.4, 6 + 48 * 2.4, 4, 4); g.fill();                      // nostril
        g.fillRect(8 + 24 * 2.4, 6 + 88.5 * 2.4, 52 * 2.4, 3.5 * 2.4);           // collar line
        g.lineWidth = 7; g.strokeStyle = '#000';
        for (const [a, b, c2, d] of [[62, 30, 70, 36], [66, 44, 73, 48], [64, 58, 71, 62]]) {
          g.beginPath(); g.moveTo(8 + a * 2.4, 6 + b * 2.4); g.lineTo(8 + c2 * 2.4, 6 + d * 2.4); g.stroke();
        }
      });
    } else if (kind === 'star') {
      g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 50 : 112; g.lineTo(128 + Math.cos(a) * r, 136 + Math.sin(a) * r); }
      g.closePath(); g.fill(); g.lineWidth = 10; g.stroke();
    } else if (kind === 'heart') {
      g.beginPath(); g.moveTo(128, 222);
      g.bezierCurveTo(30, 150, 10, 90, 60, 52); g.bezierCurveTo(100, 24, 128, 60, 128, 80);
      g.bezierCurveTo(128, 60, 156, 24, 196, 52); g.bezierCurveTo(246, 90, 226, 150, 128, 222);
      g.fill();
    } else if (kind === 'stripe') {
      g.fillRect(0, 96, 256, 64);
    } else if (kind === 'number') {
      g.font = '900 210px "Arial Black", "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 14; g.strokeStyle = shade(base, 0.6); g.strokeText(extra || '7', 128, 138); g.fillText(extra || '7', 128, 138);
    }
  });
  m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  _emblemMat.set(key, m);
  return m;
}

const _hatMat = new Map();
function partyHatMaterial(color) {
  let m = _hatMat.get(color);
  if (m) return m;
  const tex = canvasTexture(256, 256, (g) => {
    g.fillStyle = color; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#ffffff';
    for (let i = -4; i < 8; i++) {
      g.beginPath(); g.moveTo(i * 64, 256); g.lineTo(i * 64 + 26, 256); g.lineTo(i * 64 + 26 + 128, 0); g.lineTo(i * 64 + 128, 0); g.closePath(); g.fill();
    }
    g.fillStyle = lum(color) > 0.7 ? '#ff4fa3' : '#ffe14a';
    for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { ell(g, i * 32 + 16 + (j % 2) * 16, 200 - j * 70, 7, 7); g.fill(); }
  });
  tex.wrapS = THREE.RepeatWrapping;
  m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65 });
  _hatMat.set(color, m);
  return m;
}
function makePartyHatMesh(color, s = 1) {
  const grp = new THREE.Group(); grp.name = 'partyHat';
  const c = new THREE.Mesh(cgeo('phcone', () => new THREE.ConeGeometry(0.14, 0.36, 20, 1, true)), partyHatMaterial(color));
  c.position.y = 0.18; c.castShadow = true; c.name = 'partyHatCone';
  grp.add(c);
  const bag = new Bag();
  const pom = lum(color) > 0.75 && color.toLowerCase() !== '#ffffff' ? '#ff4fa3' : '#ffffff';
  bag.add(ico(0.05, 1), pom, [0, 0.37, 0]);
  bag.add(torus(0.135, 0.018, 6, 20), shade(color, 0.8), [0, 0.012, 0], [PI / 2, 0, 0]);
  bag.build(grp);
  grp.scale.setScalar(s);
  return grp;
}

const _texCache = new Map();
function cachedTex(key, w, h, fn) { let t = _texCache.get(key); if (!t) { t = canvasTexture(w, h, fn); _texCache.set(key, t); } return t; }

// ======================================================================================================
//  Pose records (pure: reset from rest every call)
// ======================================================================================================
function makeRec(names) {
  const j = {};
  for (const n of names) j[n] = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) };
  return { j, x: {} };
}
function copyRec(dst, src) {
  for (const n in src.j) { const a = dst.j[n], b = src.j[n]; a.p.copy(b.p); a.q.copy(b.q); a.s.copy(b.s); }
  dst.x = Object.assign({}, src.x);
}
function mixRec(dst, A, B, w) {
  for (const n in A.j) {
    const d = dst.j[n], a = A.j[n], b = B.j[n];
    d.p.lerpVectors(a.p, b.p, w); d.q.slerpQuaternions(a.q, b.q, w); d.s.lerpVectors(a.s, b.s, w);
  }
  dst.x = {};
  const keys = new Set([...Object.keys(A.x), ...Object.keys(B.x)]);
  for (const k of keys) {
    const av = A.x[k], bv = B.x[k];
    if (typeof av === 'number' || typeof bv === 'number') dst.x[k] = lerp(av ?? 0, bv ?? 0, w);
    else dst.x[k] = w < 0.5 ? av : bv;
  }
}
function eul(c, name, x, y, z, order = 'XYZ') { c.j[name].q.setFromEuler(_e1.set(x, y, z, order)); }
function pos(c, name, x, y, z) { c.j[name].p.set(x, y, z); }
function addPos(c, name, x, y, z) { c.j[name].p.x += x; c.j[name].p.y += y; c.j[name].p.z += z; }

// basis quaternion: local Y → yAxis, local Z → zAxis (both unit & orthogonal)
function basisQuat(yAxis, zAxis, out) {
  const xAxis = _v7.crossVectors(yAxis, zAxis);
  _m2.makeBasis(xAxis, yAxis, zAxis);
  return out.setFromRotationMatrix(_m2);
}

// Two-bone IK in 3D. S start, T target, pole = direction the middle joint should point.
// Writes upper dir u, lower dir f, perpendicular bend dir w (f's component ⟂ u), bend angle.
const _ik = { u: new THREE.Vector3(), f: new THREE.Vector3(), w: new THREE.Vector3(), pp: new THREE.Vector3(), ang: 0 };
function solve2(S, T, L1, L2, pole) {
  const d = _v3.subVectors(T, S);
  let dist = d.length();
  const dn = dist > 1e-6 ? d.divideScalar(dist) : d.set(0, -1, 0);
  const dc = clamp(dist, Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-5);
  const cosA = clamp((L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc), -1, 1);
  const A = Math.acos(cosA);
  const pp = _ik.pp.copy(pole).addScaledVector(dn, -pole.dot(dn));
  if (pp.lengthSq() < 1e-10) { pp.set(0, 0, 1).addScaledVector(dn, -dn.z); if (pp.lengthSq() < 1e-10) pp.set(1, 0, 0); }
  pp.normalize();
  const u = _ik.u.copy(dn).multiplyScalar(Math.cos(A)).addScaledVector(pp, Math.sin(A)).normalize();
  // elbow
  const E = _v4.copy(S).addScaledVector(u, L1);
  const Tc = _v5.copy(S).addScaledVector(dn, dc);
  const f = _ik.f.subVectors(Tc, E).normalize();
  const w = _ik.w.copy(f).addScaledVector(u, -f.dot(u));
  if (w.lengthSq() < 1e-10) { w.copy(pp).multiplyScalar(-1).addScaledVector(u, pp.dot(u)); }
  w.normalize();
  _ik.ang = Math.acos(clamp(u.dot(f), -1, 1));
  return _ik;
}

// ======================================================================================================
//  Human pose helpers
// ======================================================================================================
function hipsToBody(c, x, y, z, out) {
  return out.set(x, y, z).applyQuaternion(c.j.hips.q).add(c.j.hips.p);
}
// body-frame point → torso frame
function toTorso(c, v, out) {
  const tq = _q2.multiplyQuaternions(c.j.hips.q, c.j.torso.q);
  const tp = _v6.copy(c.j.torso.p).applyQuaternion(c.j.hips.q).add(c.j.hips.p);
  return out.copy(v).sub(tp).applyQuaternion(tq.invert());
}
function headQ(c, out) {
  const h = c.x.head || [0, 0, 0];
  return out.setFromEuler(_e1.set(h[0], h[1], h[2], 'YXZ'));
}
function setHead(c, x, y, z) { c.x.head = [x, y, z]; }
function addHead(c, x, y, z) { const h = c.x.head || [0, 0, 0]; c.x.head = [h[0] + x, h[1] + y, h[2] + z]; }

function footFlat(c, side, yaw = 0) {
  const q = _q1.copy(c.j.hips.q).multiply(c.j['leg' + side].q).multiply(c.j['shin' + side].q).invert();
  _q3.setFromAxisAngle(Y_AXIS, yaw);
  c.j['foot' + side].q.copy(q.multiply(_q3));
}

const _pole = new THREE.Vector3();
function ikLeg(c, side, ankle, pole) {
  const sg = side === 'L' ? 1 : -1;
  const H = hipsToBody(c, sg * c.G.hipX, 0, 0, _v1);
  const r = solve2(H, ankle, THIGH, SHIN, pole);
  const qBody = basisQuat(_v2.copy(r.u).negate(), _v4.copy(r.w).negate(), _q1);
  c.j['leg' + side].q.copy(_q2.copy(c.j.hips.q).invert().multiply(qBody));
  c.j['shin' + side].q.setFromAxisAngle(X_AXIS, r.ang);
  footFlat(c, side, 0);
}
function ikArm(c, side, T, pole) {
  const S = c.j['arm' + side].p;
  const r = solve2(S, T, UPPER, FORE, pole);
  basisQuat(_v2.copy(r.u).negate(), _v4.copy(r.w), c.j['arm' + side].q);
  c.j['foreArm' + side].q.setFromAxisAngle(X_AXIS, -r.ang);
}
// arm IK with a body-frame target
function ikArmBody(c, side, Tbody, pole) { ikArm(c, side, toTorso(c, Tbody, _v6.clone()), pole); }

function restArm(c, side, swing = 0, out = 0, fore = -0.18, twist = 0) {
  const sg = side === 'L' ? 1 : -1;
  eul(c, 'arm' + side, swing, twist * sg, sg * (0.09 + out));
  eul(c, 'foreArm' + side, fore, 0, 0);
}

function stand(c, o = {}) {
  if (c.seated) return seat(c, { dy: Math.max(0, o.dy || 0) * 0.5, ry: o.ry || 0, rz: (o.rz || 0) * 0.4 });
  const dx = o.dx || 0, dy = o.dy || 0, dz = o.dz || 0;
  pos(c, 'hips', dx, HIP_Y + dy, dz);
  eul(c, 'hips', o.rx || 0, o.ry || 0, o.rz || 0);
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const f = o.feet && o.feet[side];
    const ax = f ? f[0] : sg * (c.G.hipX + (o.spread ?? 0.01)) + (o.feetDX || 0);
    const ay = f ? f[1] : ANKLE_H + (o.feetDY || 0);
    const az = f ? f[2] : (o.footZ || 0);
    ikLeg(c, side, _v5.set(ax, ay, az).clone(), _pole.set(sg * 0.12, 0, 1));
  }
  c.x.sit = 0;
}

function seat(c, o = {}) {
  const sH = (c.p.seatHeight ?? SEAT_HEIGHT) / c.s;
  const hy = sH + LEG_D / 2 + (o.dy || 0);
  const hz = c.p.hipZ ?? SIT_HIP_Z;
  pos(c, 'hips', 0, hy, hz + (o.dz || 0));
  eul(c, 'hips', 0, o.ry || 0, o.rz || 0);
  c.x.sit = 1;
  let fz = 0;
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const splay = 0.07 * sg;
    const qBody = _q3.setFromEuler(_e1.set(-PI / 2, splay, 0, 'YXZ'));
    c.j['leg' + side].q.copy(_q2.copy(c.j.hips.q).invert().multiply(qBody));
    const H = hipsToBody(c, sg * c.G.hipX, 0, 0, _v1);
    const K = _v2.set(0, -THIGH, 0).applyQuaternion(qBody).add(H);
    const need = K.y - ANKLE_H;
    const tau = need < SHIN ? Math.acos(clamp(need / SHIN, -1, 1)) : 0;
    c.j['shin' + side].q.setFromAxisAngle(X_AXIS, PI / 2 - tau);
    footFlat(c, side, splay);
    fz = K.z + SHIN * Math.sin(tau);
  }
  c.x.footZ = fz;
}

// hands for seated poses
function seatedHands(c, mode, which = 'LR') {
  const hy = c.j.hips.p.y, hz = c.j.hips.p.z;
  for (const side of which) {
    const sg = side === 'L' ? 1 : -1;
    if (mode === 'table') {
      const ty = (c.p.tableY ?? 0.78) / c.s + HAND / 2 - 0.005;
      ikArmBody(c, side, _v5.set(sg * 0.21, ty, c.p.tableZ ?? 0.40), _pole.set(sg * 0.8, -0.5, -0.6));
    } else if (mode === 'lap') {
      ikArmBody(c, side, _v5.set(sg * 0.17, hy + LEG_D / 2 + HAND / 2 - 0.02, hz + 0.21), _pole.set(sg * 0.5, -0.2, -1));
    } else restArm(c, side, 0, 0.02);
  }
}

// slam timing: returns h (0 = fist on the table … 1 = fully raised) and time since the last impact.
function slamCurve(t, hits) {
  let prev = -Infinity, next = Infinity;
  if (hits && hits.length) {
    for (const x of hits) { if (x <= t && x > prev) prev = x; if (x >= t && x < next) next = x; }
    if (!isFinite(prev)) prev = next - 0.9;           // wind up from resting on the table
  } else {
    const period = 0.6, t0 = 0.45;
    const k = Math.floor((t - t0) / period);
    prev = t0 + k * period; next = prev + period;
    if (t < t0) { prev = t0 - 0.9; next = t0; }
  }
  const s = t - prev, r = next - t;
  if (!isFinite(next)) {                               // after the last hit: lift a little and rest
    const R = 0.06, U = 0.28;
    const h = s < R ? 0 : 0.14 * ease.outCubic((s - R) / U);
    return { h, s };
  }
  const gap = next - prev;
  const D = Math.min(0.15, gap * 0.38), R = Math.min(0.06, gap * 0.12), U = Math.min(0.3, Math.max(0.04, gap - D - R) * 0.85);
  const P = clamp(gap / 0.55, 0.45, 1);
  const up = s < R ? 0 : P * ease.outCubic((s - R) / U) + (s > R + U ? 0.02 * Math.sin((s - R - U) * 9) : 0);
  const down = r >= D ? Infinity : P * (1 - (1 - r / D) * (1 - r / D));
  return { h: Math.max(0, Math.min(up, down)), s };
}

// ======================================================================================================
//  Human actions
// ======================================================================================================
const HUMAN = {};

HUMAN.idle = (c) => {
  const t = c.t, br = Math.sin(TAU * t / 3.4);
  stand(c, { dy: -0.004 + 0.004 * br, rz: 0.012 * noise1(t * 0.2, c.seed + 4) });
  eul(c, 'torso', 0.015 * br, 0, 0);
  setHead(c, 0.03 * noise1(t * 0.3, c.seed + 1), 0.12 * noise1(t * 0.22, c.seed), 0.03 * noise1(t * 0.17, c.seed + 2));
  restArm(c, 'L', 0.02, 0.012 * br); restArm(c, 'R', 0.02, 0.012 * br);
  if (c.seated) seatedHands(c, c.p.hands ?? 'lap');
};

HUMAN.dance = (c) => {
  const b = c.t * 2.0, I = c.I;
  const dip = Math.pow(Math.cos(PI * b), 2);
  const sw = Math.sin(PI * b);
  stand(c, { dy: -0.06 * dip * I, dx: 0.035 * sw * I, rz: 0.08 * sw * I, ry: 0.10 * sw * I });
  eul(c, 'torso', 0.04 * dip, -0.12 * sw * I, -0.1 * sw * I);
  setHead(c, 0.12 * dip * I - 0.06, -0.08 * sw, 0.10 * sw * I);
  const a = smooth(0.5 + 0.5 * Math.cos(PI * b));   // 1 on even beats → arms up
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const T = _v5.set(sg * lerp(0.44, 0.6, a), lerp(0.42, 0.84, a * I), lerp(0.27, 0.14, a));
    ikArm(c, side, T, _pole.set(sg, -0.35, -0.5));
  }
};

HUMAN.dance2 = (c) => {
  const b = c.t * 2.0, I = c.I;
  const k = Math.floor(b), f = b - k;
  const dir = k % 2 === 0 ? -1 : 1;            // moving foot side: −1 right foot, +1 left foot
  const out = Math.sin(PI * f);
  const lift = Math.max(0, Math.sin(TAU * f)) * 0.06 * I;
  const feet = {};
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const moving = sg === dir;
    feet[side] = [sg * (c.G.hipX + 0.03) + (moving ? sg * 0.17 * out * I : 0), ANKLE_H + (moving ? lift : 0), moving ? 0.04 * out : 0];
  }
  stand(c, { dx: -dir * 0.04 * out * I, dy: -0.035 * (1 - out) * I, rz: dir * 0.06 * out * I, feet });
  eul(c, 'torso', 0.05, dir * 0.18 * out * I, -dir * 0.05 * out);
  setHead(c, 0.1 * Math.sin(TAU * f) * I, -dir * 0.1 * out, dir * 0.06 * out);
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const pump = sg === dir ? out : 0;
    const T = _v5.set(sg * lerp(0.26, 0.2, pump), lerp(0.26, 0.86, pump * I), lerp(0.3, 0.42, pump));
    ikArm(c, side, T, _pole.set(sg * 0.9, -0.6, -0.4));
  }
};

function walkCycle(c, cps, amp, knee, armAmp, lean, headDown, slump) {
  const ph = TAU * c.t * cps, I = c.I;
  const s = Math.sin(ph), co = Math.cos(ph);
  const aL = -amp * s * I, aR = amp * s * I;            // rotation.x (negative = forward)
  const kL = knee * Math.max(0, co) * I, kR = knee * Math.max(0, -co) * I;
  const ext = (a, k) => THIGH * Math.cos(a) + SHIN * Math.cos(a + k) + ANKLE_H;
  const hy = Math.max(ext(aL, kL), ext(aR, kR));
  pos(c, 'hips', 0, hy, 0);
  eul(c, 'hips', 0, -0.07 * s * I, 0.025 * co * I);
  eul(c, 'legL', aL, 0, 0); eul(c, 'shinL', kL, 0, 0);
  eul(c, 'legR', aR, 0, 0); eul(c, 'shinR', kR, 0, 0);
  // keep feet nearly flat (toes lift a touch on the swing)
  footFlat(c, 'L', 0); footFlat(c, 'R', 0);
  _q1.setFromAxisAngle(X_AXIS, -0.25 * Math.max(0, co) * I); c.j.footL.q.multiply(_q1);
  _q1.setFromAxisAngle(X_AXIS, -0.25 * Math.max(0, -co) * I); c.j.footR.q.multiply(_q1);
  eul(c, 'torso', lean, 0.07 * s * I, 0);
  setHead(c, headDown + 0.02 * Math.cos(2 * ph), -0.06 * s * I, 0);
  restArm(c, 'L', armAmp * s * I, 0.02, -0.25 - 0.2 * Math.max(0, -s) * I);
  restArm(c, 'R', -armAmp * s * I, 0.02, -0.25 - 0.2 * Math.max(0, s) * I);
  if (slump) { addPos(c, 'armL', 0, -0.035, 0.02); addPos(c, 'armR', 0, -0.035, 0.02); }
  c.x.sit = 0;
}
HUMAN.walk = (c) => walkCycle(c, 0.8, 0.34, 0.62, 0.42, 0.04, 0, false);
HUMAN.walkSad = (c) => {
  walkCycle(c, 0.55, 0.22, 0.35, 0.10, 0.32, 0.38, true);
  // arms dangle a little forward
  const s = Math.sin(TAU * c.t * 0.55);
  restArm(c, 'L', -0.14 + 0.08 * s, -0.04, -0.1); restArm(c, 'R', -0.14 - 0.08 * s, -0.04, -0.1);
};

HUMAN.sit = (c) => {
  const br = Math.sin(TAU * c.t / 3.6);
  seat(c, {});
  eul(c, 'torso', 0.05 + 0.008 * br, 0, 0);
  setHead(c, 0.02, 0, 0);
  seatedHands(c, c.p.hands ?? 'lap');
};
HUMAN.sitIdle = (c) => {
  const t = c.t, br = Math.sin(TAU * t / 3.2);
  seat(c, { dy: 0.004 * br });
  eul(c, 'torso', 0.06 + 0.02 * br, 0.04 * noise1(t * 0.2, c.seed + 9), 0);
  setHead(c, 0.04 + 0.04 * noise1(t * 0.3, c.seed + 1), 0.16 * noise1(t * 0.21, c.seed), 0.03 * noise1(t * 0.15, c.seed + 2));
  seatedHands(c, c.p.hands ?? 'lap');
};

function slamCommon(c, seated) {
  const p = c.p;
  const { h, s } = slamCurve(c.t, p.hits);
  const impact = s >= 0 ? Math.exp(-s / 0.09) : 0;
  const tableY = (p.slamTarget ? p.slamTarget.y : (p.tableY ?? 0.78)) / c.s;
  let sx = p.slamX ?? -0.16, sz = p.slamZ ?? (seated ? 0.55 : 0.44);
  if (p.slamTarget && c.ch.root.parent) {
    c.ch.root.updateWorldMatrix(true, false);
    const loc = _v1.copy(p.slamTarget).applyMatrix4(_m1.copy(c.ch.root.matrixWorld).invert());
    sx = loc.x / c.s; sz = loc.z / c.s;
  }
  if (seated) seat(c, {});
  else stand(c, { dy: -0.035 * (1 - h) - 0.015 * impact, dz: 0.02 * (1 - h) });
  // lean so the impact point is reachable
  let lean = (seated ? 0.16 : 0.26) + 0.08 * (1 - h) + 0.05 * impact;
  const reach = UPPER + FORE - 0.02;
  for (let i = 0; i < 12; i++) {
    eul(c, 'torso', lean, -0.08 * (1 - h), 0);
    const T = toTorso(c, _v5.set(sx, tableY + HAND / 2, sz), _v1);
    if (T.distanceTo(c.j.armR.p) <= reach || lean > 0.9) break;
    lean += 0.06;
  }
  addPos(c, 'armR', 0, 0.03 * h, 0);
  setHead(c, 0.1 + 0.12 * (1 - h) + 0.08 * impact - lean * 0.55, -0.05, 0);
  // impact target (fist bottom exactly on the table): solve, measure the lowest point, re-solve.
  // The elbow pole is chosen so the elbow (and the back of the forearm) stays above the table top.
  const impactT = toTorso(c, _v5.set(sx, tableY + HAND / 2, sz), new THREE.Vector3());
  const poleImp = new THREE.Vector3();
  const tq = new THREE.Quaternion().multiplyQuaternions(c.j.hips.q, c.j.torso.q);
  const tp = new THREE.Vector3().copy(c.j.torso.p).applyQuaternion(c.j.hips.q).add(c.j.hips.p);
  for (let k = 0; k <= 6; k++) {
    poleImp.set(-0.6, -0.5, -0.6).lerp(_v1.set(-0.85, 0.55, -0.15), k / 6).normalize();
    const r = solve2(c.j.armR.p, impactT, UPPER, FORE, poleImp);
    const elbowY = _v2.copy(r.u).multiplyScalar(UPPER).add(c.j.armR.p).applyQuaternion(tq).add(tp).y;
    if (elbowY - ARM_D * 0.75 > tableY) break;
  }
  for (let pass = 0; pass < 2; pass++) {
    ikArm(c, 'R', impactT, poleImp);
    const q = _q1.copy(tq).multiply(c.j.armR.q).multiply(c.j.foreArmR.q);
    const ax = _v1.set(1, 0, 0).applyQuaternion(q).y, ay = _v2.set(0, 1, 0).applyQuaternion(q).y, az = _v4.set(0, 0, 1).applyQuaternion(q).y;
    // exact support of the rounded hand box (+ the thumb) along −Y
    const r = 0.045;
    const handSup = (HAND / 2 - r) * (Math.abs(ax) + Math.abs(az)) + (HAND * 0.475 - r) * Math.abs(ay) + r;
    const cty = ax * 0.07 + ay * 0.005 + az * 0.035;
    const thumbSup = 0.004 * Math.abs(ax) + 0.0175 * Math.abs(ay) + 0.005 * Math.abs(az) + 0.02 - cty;
    const below = Math.max(handSup, thumbSup);
    impactT.copy(toTorso(c, _v5.set(sx, tableY + below, sz), _v3));
  }
  const raisedT = new THREE.Vector3(-0.34, 0.9, 0.04);
  const T = new THREE.Vector3().lerpVectors(impactT, raisedT, h);
  T.z += 0.12 * Math.sin(PI * h);
  const pole = new THREE.Vector3().lerpVectors(poleImp, new THREE.Vector3(-1, 0.15, -0.5), h).normalize();
  ikArm(c, 'R', T, pole);
  // left hand braced on the table
  const ty = tableY + HAND / 2 - 0.005;
  ikArmBody(c, 'L', _v5.set(0.24, ty, sz - 0.1), _pole.set(0.8, -0.5, -0.6));
  c.x.slamH = h;
}
HUMAN.sitSlam = (c) => slamCommon(c, true);
HUMAN.slam = (c) => slamCommon(c, false);

HUMAN.laugh = (c) => {
  const t = c.t, I = c.I;
  const shake = Math.sin(TAU * 6 * t);
  stand(c, { dy: -0.02 - 0.014 * Math.abs(Math.sin(TAU * 3 * t)) * I, rz: 0.03 * Math.sin(TAU * 0.6 * t) });
  eul(c, 'torso', (-0.26 + 0.035 * shake) * I, 0.05 * Math.sin(TAU * 0.6 * t), 0.04 * Math.sin(TAU * 0.6 * t));
  setHead(c, (-0.16 + 0.06 * Math.sin(TAU * 6 * t + 0.6)) * I, 0, 0.06 * Math.sin(TAU * 0.6 * t + 1));
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    ikArm(c, side, _v5.set(sg * 0.15, 0.1 + 0.02 * shake, 0.27), _pole.set(sg, -0.3, -0.6));
  }
  addPos(c, 'armL', 0, 0.012 * shake, 0); addPos(c, 'armR', 0, 0.012 * shake, 0);
};

function pointArm(c, jab) {
  ikArm(c, 'R', _v5.set(-0.24, 0.48 + jab * 0.4, 0.8 + jab), _pole.set(-0.4, -1, -0.3));
  c.x.fingerR = 1;
}
HUMAN.point = (c) => {
  const t = c.t, jab = 0.03 * Math.sin(TAU * 1.4 * t) * c.I;
  stand(c, { rz: 0.03, dx: 0.02 });
  eul(c, 'torso', 0.12, -0.14, 0);
  setHead(c, -0.05, -0.08, 0.03);
  pointArm(c, jab);
  ikArm(c, 'L', _v5.set(0.4, 0.03, 0.03), _pole.set(1, 0.3, -0.5));   // hand on hip
};
HUMAN.pointLaugh = (c) => {
  const t = c.t, I = c.I, shake = Math.sin(TAU * 6 * t);
  stand(c, { dy: -0.02 - 0.012 * Math.abs(Math.sin(TAU * 3 * t)) * I });
  eul(c, 'torso', (-0.16 + 0.03 * shake) * I, -0.16, 0.03);
  setHead(c, (-0.14 + 0.05 * Math.sin(TAU * 6 * t + 0.6)) * I, -0.06, 0.05);
  pointArm(c, 0.02 * shake);
  ikArm(c, 'L', _v5.set(0.12, 0.1 + 0.02 * shake, 0.27), _pole.set(1, -0.3, -0.6));
};

HUMAN.clap = (c) => {
  const t = c.t, f = 2.4;
  const open = Math.pow(Math.abs(Math.sin(PI * f * t)), 0.6) * c.I;
  stand(c, { dy: -0.012 * (1 - open) });
  eul(c, 'torso', 0.05, 0, 0);
  setHead(c, 0.05 * (1 - open) - 0.02, 0, 0);
  const gap = HAND + 0.26 * open;
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    ikArm(c, side, _v5.set(sg * gap / 2, 0.25 + 0.03 * open, 0.37), _pole.set(sg, -0.7, -0.5));
  }
};

HUMAN.cheer = (c) => {
  const t = c.t, f = 2.2, I = c.I;
  const pump = Math.abs(Math.sin(PI * f * t));
  stand(c, { dy: -0.05 * (1 - pump) * I });
  eul(c, 'torso', -0.06, 0, 0.03 * Math.sin(PI * f * t));
  setHead(c, -0.18, 0, 0.06 * Math.sin(PI * f * t));
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    ikArm(c, side, _v5.set(sg * (0.6 + 0.06 * pump), 0.74 + 0.16 * pump * I, 0.1), _pole.set(sg, -0.6, -0.2));
  }
};

HUMAN.surprised = (c) => {
  const t = c.t, I = c.I;
  const tj = clamp(t / 0.32, 0, 1);
  const jump = ease.outCubic(tj), hop = Math.sin(PI * tj) * 0.07 * I;
  const tremble = 0.006 * noise1(t * 14, c.seed + 3);
  const fz = -0.1 * jump * I;
  stand(c, { dz: fz + tremble, dy: hop, footZ: fz, feetDY: hop * 0.9 });
  eul(c, 'torso', -0.14 * jump * I, 0, 0);
  setHead(c, -0.12 * jump * I, 0, 0);
  const a = ease.outBack(tj) * I;
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const T = _v5.set(sg * lerp(0.42, 0.66, a), lerp(-0.16, 0.36, a), lerp(0.05, 0.18, a));
    ikArm(c, side, T, _pole.set(sg * 0.4, -1, -0.4));
  }
};

HUMAN.shrug = (c) => {
  const t = c.t, amt = (0.75 + 0.25 * Math.sin(TAU * t / 1.6)) * c.I;
  stand(c, {});
  eul(c, 'torso', -0.05, 0, 0);
  setHead(c, -0.06, 0.05, 0.22 * amt);
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    addPos(c, 'arm' + side, 0, 0.06 * amt, 0);
    ikArm(c, side, _v5.set(sg * (0.5 + 0.06 * amt), 0.14 + 0.04 * amt, 0.24), _pole.set(sg * 0.2, -1, -0.15));
  }
};

HUMAN.think = (c) => {
  const t = c.t;
  stand(c, { rz: 0.02 });
  eul(c, 'torso', 0.02, 0.06, 0);
  setHead(c, -0.1, 0.12, 0.09);
  // chin point (head frame) → torso frame
  const hq = headQ(c, _q3);
  const chin = _v1.set(-0.03, 0.06 + 0.012 * Math.sin(TAU * 1.3 * t), HEAD_D / 2 + 0.07).applyQuaternion(hq).add(c.j.head.p);
  ikArm(c, 'R', chin.clone(), _pole.set(-0.3, -1, 0));
  ikArm(c, 'L', _v5.set(-0.1, 0.17, 0.28), _pole.set(1, -0.5, -0.6));
};

HUMAN.peer = (c) => {
  const t = c.t, I = c.I;
  const lean = (c.seated ? 0.42 : 0.55) + 0.05 * Math.sin(TAU * t / 3);
  stand(c, { dy: -0.04, dz: -0.02 });
  eul(c, 'torso', lean * I, 0, 0);
  setHead(c, -lean * 0.55 + 0.02 * Math.sin(TAU * t / 2.3), 0.06 * Math.sin(TAU * t / 4.1), 0);
  const mode = c.p.hands ?? 'table';
  if (mode === 'table') {
    const ty = (c.p.tableY ?? 0.78) / c.s + HAND / 2 - 0.005;
    for (const side of ['L', 'R']) {
      const sg = side === 'L' ? 1 : -1;
      ikArmBody(c, side, _v5.set(sg * 0.26, ty, c.p.tableZ ?? (c.seated ? 0.40 : 0.42)), _pole.set(sg * 0.8, -0.4, -0.6));
    }
  } else {
    for (const side of ['L', 'R']) {     // hands on knees
      const sg = side === 'L' ? 1 : -1;
      ikArmBody(c, side, _v5.set(sg * 0.17, c.seated ? c.j.hips.p.y + 0.15 : 0.62, c.seated ? 0.3 : 0.1), _pole.set(sg * 0.6, 0, -1));
    }
  }
};

HUMAN.crowdSurf = (c) => {
  const t = c.t, I = c.I;
  const lift = (c.p.lift ?? 0) / c.s;
  const roll = 0.08 * Math.sin(TAU * 0.5 * t) * I;
  pos(c, 'hips', 0, (c.G.torsoD / 2) + lift + 0.01 * Math.sin(TAU * 0.9 * t), 0.14);
  c.j.hips.q.setFromAxisAngle(X_AXIS, -PI / 2).multiply(_q1.setFromAxisAngle(Y_AXIS, roll));
  eul(c, 'torso', -0.05, 0, 0.04 * Math.sin(TAU * 0.7 * t));
  setHead(c, 0.22, 0.15 * Math.sin(TAU * 0.4 * t), 0);
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1, ph = sg > 0 ? 0 : 1.7;
    eul(c, 'arm' + side, -1.45 + 0.55 * Math.sin(TAU * 1.6 * t + ph) * I, 0, sg * (0.45 + 0.35 * Math.sin(TAU * 1.6 * t + ph + 1) * I));
    eul(c, 'foreArm' + side, -0.35 + 0.3 * Math.sin(TAU * 1.6 * t + ph + 2), 0, 0);
    eul(c, 'leg' + side, -0.18 + 0.22 * Math.sin(TAU * 1.1 * t + ph) * I, 0, sg * 0.1);
    eul(c, 'shin' + side, 0.32 + 0.22 * Math.sin(TAU * 1.1 * t + ph + 1) * I, 0, 0);
    eul(c, 'foot' + side, -0.2, 0, 0);
  }
  c.x.sit = 0;
};

HUMAN.stunned = (c) => {
  const t = c.t, w = TAU * 0.55 * t, I = c.I;
  stand(c, { dx: 0.015 * Math.sin(w) * I, rz: 0.025 * Math.sin(w) * I });
  eul(c, 'torso', 0.02, 0, 0.03 * Math.sin(w + 1.2) * I);
  setHead(c, 0.05, 0.02 * Math.sin(w * 0.5), 0.07 * Math.sin(w + 2.0) * I);
  eul(c, 'armL', 0.06, 0, 0.035); eul(c, 'armR', 0.06, 0, -0.035);
  eul(c, 'foreArmL', -0.02, 0, 0); eul(c, 'foreArmR', -0.02, 0, 0);
  if (c.seated) seatedHands(c, 'lap');
};

HUMAN.wave = (c) => {
  const t = c.t, wv = Math.sin(TAU * 2.2 * t) * c.I;
  stand(c, { rz: -0.02 * wv, dx: -0.01 });
  eul(c, 'torso', 0, -0.05, 0.03);
  setHead(c, -0.04, -0.1, -0.08);
  eul(c, 'armR', -0.3, 0, -2.45);
  eul(c, 'foreArmR', -0.35, 0, 0.5 * wv);
  restArm(c, 'L', 0.02, 0.01);
  if (c.seated) seatedHands(c, c.p.hands ?? 'lap', 'L');
};

HUMAN.crossArms = (c) => {
  const t = c.t, br = Math.sin(TAU * t / 3.4);
  stand(c, { rz: 0.035, dx: 0.02, dy: 0.003 * br });
  eul(c, 'torso', -0.05 + 0.01 * br, 0.04, -0.02);
  setHead(c, -0.07, 0.05 * noise1(t * 0.2, c.seed), 0.03);
  ikArm(c, 'L', _v5.set(-0.27, 0.2, 0.25), _pole.set(1, -0.45, 0.3));
  ikArm(c, 'R', _v5.set(0.27, 0.235, 0.3), _pole.set(-1, -0.45, 0.3));
};

HUMAN.sitStand = (c) => {
  const p = c.p;
  const u = clamp(p.u ?? 0, 0, 1);
  // seated configuration (exact 'sit' at u = 0)
  seat(c, {});
  const sitFootZ = c.x.footZ;
  const sitHy = c.j.hips.p.y, sitHz = c.j.hips.p.z;
  if (u <= 0) { eul(c, 'torso', 0.05, 0, 0); setHead(c, 0.02, 0, 0); seatedHands(c, 'lap'); return; }
  const fwd = p.forward ?? sitFootZ;
  // foot positions in the seat pose (for dangling kids they come down first)
  const sitFootY = Math.max(ANKLE_H, c.j.hips.p.y - LEG_D / 2 + LEG_D / 2 - SHIN);
  const lean = 0.5 * Math.pow(Math.sin(PI * clamp(u / 0.9, 0, 1)), 1.2);
  const hz = lerp(sitHz, fwd, smooth((u - 0.08) / 0.72));
  const hy = lerp(sitHy, HIP_Y, smooth((u - 0.25) / 0.65));
  pos(c, 'hips', 0, hy, hz); eul(c, 'hips', 0, 0, 0);
  const fu = smooth(u / 0.35);
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const sx = sg * c.G.hipX, ex = sg * (c.G.hipX + 0.01);
    const T = _v5.set(lerp(sx + sg * 0.02, ex, smooth(u)), lerp(sitFootY, ANKLE_H, fu), lerp(sitFootZ, fwd, smooth((u - 0.5) / 0.5)));
    ikLeg(c, side, T.clone(), _pole.set(sg * 0.12, 0, 1));
  }
  c.x.sit = 1 - smooth((u - 0.2) / 0.4);
  eul(c, 'torso', lerp(0.05, 0, u) + lean, 0, 0);
  setHead(c, -lean * 0.6, 0, 0);
  // arms: hands push on the knees, then hang
  const qa = {}, qf = {};
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const kneeZ = sitHz + THIGH;
    const T = _v5.set(sg * 0.18, lerp(sitHy + 0.14, sitHy + 0.1, smooth(u / 0.4)), lerp(sitHz + 0.21, kneeZ, smooth(u / 0.35)));
    ikArmBody(c, side, T.clone(), _pole.set(sg * 0.5, -0.2, -1));
    qa[side] = c.j['arm' + side].q.clone(); qf[side] = c.j['foreArm' + side].q.clone();
    restArm(c, side, 0.02, 0);
    const w = smooth((u - 0.5) / 0.45);
    c.j['arm' + side].q.slerpQuaternions(qa[side], c.j['arm' + side].q.clone(), w);
    c.j['foreArm' + side].q.slerpQuaternions(qf[side], c.j['foreArm' + side].q.clone(), w);
  }
};

// ======================================================================================================
//  Human builder
// ======================================================================================================
const HUMAN_JOINTS = ['hips', 'torso', 'head', 'armL', 'foreArmL', 'handL', 'armR', 'foreArmR', 'handR',
  'legL', 'shinL', 'footL', 'legR', 'shinR', 'footR', 'skirt'];

function normSpec(spec) {
  const hair = Object.assign({ style: 'short', color: '#2b1d14' }, spec.hair || {});
  const top = Object.assign({ style: 'hoodie', color: '#1d1d22', accent: '#ffffff', emblem: null }, spec.top || {});
  const bottom = Object.assign({ style: 'pants', color: '#55575e' }, spec.bottom || {});
  return {
    id: spec.id ?? 'me',
    skin: spec.skin ?? '#f1c7a1',
    hair, top, bottom,
    shoes: spec.shoes ?? '#f2f2f2',
    accessories: [...(spec.accessories || [])],
    partyHatColor: spec.partyHatColor ?? '#ff4fa3',
    eyeColor: spec.eyeColor ?? '#1b1b1b',
    scale: spec.scale ?? 1.0,
    build: spec.build ?? 1.0,
    sashColor: spec.sashColor,
    capColor: spec.capColor,
    number: spec.number,
    blindfoldColor: spec.blindfoldColor,
  };
}

function seedOf(id) { let s = 7; const str = String(id); for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) % 99991; return s; }

export function makeCharacter(spec = {}) {
  const low = spec.lod === 'low' || !!spec.lowDetail;
  _lowDetail = low;
  try { return buildHuman(spec, low); } finally { _lowDetail = false; _collect = null; }
}

function buildHuman(spec, low) {
  const S = normSpec(spec);
  const bw = S.build;
  const G = {
    torsoW: 0.58 * bw, torsoD: 0.34 * (1 + (bw - 1) * 0.9), pelvisW: 0.52 * bw, pelvisD: 0.32 * (1 + (bw - 1) * 0.8),
    hipX: 0.14 * bw, armW: 0.16 * (1 + (bw - 1) * 0.5), legW: 0.20 * (1 + (bw - 1) * 0.5),
  };
  G.shoulderX = G.torsoW / 2 + G.armW / 2 - 0.004;
  const skin = S.skin, hairC = S.hair.color, topC = S.top.color, acc = S.top.accent, botC = S.bottom.color;
  const topStyle = S.top.style, botStyle = S.bottom.style;
  const skirtLike = topStyle === 'dress' || botStyle === 'skirt';
  const legC = (botStyle === 'pants' && topStyle !== 'dress') ? botC : skin;
  const thighC = (topStyle === 'dress' || botStyle === 'skirt') ? skin : botC;
  const pelvisC = topStyle === 'dress' ? topC : botC;

  const root = new THREE.Group(); root.name = 'char:' + S.id;
  const body = new THREE.Group(); body.name = 'body'; body.scale.setScalar(S.scale); root.add(body);
  const J = {};
  const mk = (name, parent, x, y, z) => { const o = new THREE.Bone(); o.name = name; o.position.set(x, y, z); parent.add(o); J[name] = o; return o; };
  const skinC = new SkinCollector();
  _collect = CHARACTER_OPTIONS.skinned ? skinC : null;
  mk('hips', body, 0, HIP_Y, 0);
  mk('torso', J.hips, 0, 0, 0);
  mk('head', J.torso, 0, NECK_Y, 0);
  mk('armL', J.torso, G.shoulderX, SHOULDER_Y, 0); mk('foreArmL', J.armL, 0, -UPPER, 0); mk('handL', J.foreArmL, 0, -FORE, 0);
  mk('armR', J.torso, -G.shoulderX, SHOULDER_Y, 0); mk('foreArmR', J.armR, 0, -UPPER, 0); mk('handR', J.foreArmR, 0, -FORE, 0);
  mk('legL', J.hips, G.hipX, 0, 0); mk('shinL', J.legL, 0, -THIGH, 0); mk('footL', J.shinL, 0, -SHIN, 0);
  mk('legR', J.hips, -G.hipX, 0, 0); mk('shinR', J.legR, 0, -THIGH, 0); mk('footR', J.shinR, 0, -SHIN, 0);
  mk('skirt', J.hips, 0, 0, 0);

  // ---------------- legs ----------------
  const shoeC = S.shoes, soleC = lum(shoeC) > 0.6 ? '#9aa0a8' : '#f4f4f4';
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const bt = new Bag();
    const tl = THIGH + LEG_D / 2 + 0.06;
    bt.add(rbox(G.legW, tl, LEG_D, 0.05), thighC, [0, 0.06 - tl / 2, 0]);
    if (botStyle === 'shorts') bt.add(rbox(G.legW + 0.016, 0.1, LEG_D + 0.016, 0.04), shade(botC, 0.9), [0, -0.33, 0]);
    bt.build(J['leg' + side]);
    const bs = new Bag();
    bs.add(rbox(G.legW * 0.96, SHIN + 0.07, LEG_D * 0.96, 0.05), legC, [0, 0.07 - (SHIN + 0.07) / 2, 0]);
    if (botStyle === 'shorts' || skirtLike) bs.add(rbox(G.legW * 0.96 + 0.012, 0.09, LEG_D * 0.96 + 0.012, 0.03), '#f4f4f4', [0, -SHIN + 0.075, 0]);
    else bs.add(rbox(G.legW * 0.96 + 0.014, 0.07, LEG_D * 0.96 + 0.014, 0.03), shade(botC, 0.85), [0, -SHIN + 0.065, 0]);
    bs.build(J['shin' + side]);
    const bf = new Bag();
    bf.add(rbox(G.legW + 0.035, 0.095, 0.30, 0.045), shoeC, [0, -0.012, 0.045]);
    bf.add(rbox(G.legW + 0.045, 0.032, 0.31, 0.014), soleC, [0, -0.054, 0.045]);
    if (!low) bf.add(rbox(0.012, 0.03, 0.12, 0.005), lum(shoeC) > 0.6 ? shade(acc === '#ffffff' ? '#4a6cff' : acc, 1) : '#f4f4f4', [sg * (G.legW / 2 + 0.018), -0.01, 0.03]);
    bf.build(J['foot' + side]);
  }

  // ---------------- hips / skirt ----------------
  {
    const b = new Bag();
    b.add(rbox(G.pelvisW, 0.105 + 0.08, G.pelvisD, 0.05), pelvisC, [0, (0.08 - 0.105) / 2, 0]);
    // the top's hem hangs over the hips (attached to the hips so it stays put when the torso bends)
    const hw = G.torsoW * 0.93 + 0.01, hd = G.torsoD + 0.01;
    if (topStyle === 'hoodie') {
      b.add(rbox(hw, 0.1, hd, 0.04), topC, [0, -0.02, 0]);
      b.add(rbox(hw + 0.012, 0.05, hd + 0.012, 0.022), shade(topC, lum(topC) < 0.2 ? 1.14 : 0.86), [0, -0.075, 0]);
    } else if (topStyle === 'tee') {
      b.add(rbox(hw, 0.08, hd, 0.04), topC, [0, -0.025, 0]);
    } else if (topStyle === 'cardigan') {
      b.add(rbox(hw + 0.01, 0.13, hd + 0.01, 0.04), topC, [0, -0.04, 0]);
      b.add(rbox(0.035, 0.12, 0.02, 0.008), shade(topC, 0.82), [0.08, -0.035, hd / 2 + 0.008]);
      b.add(rbox(0.035, 0.12, 0.02, 0.008), shade(topC, 0.82), [-0.08, -0.035, hd / 2 + 0.008]);
      b.add(rbox(0.125, 0.12, 0.016, 0.006), botC, [0, -0.035, hd / 2 + 0.002]);
    } else if (topStyle === 'suit') {
      b.add(rbox(hw + 0.01, 0.14, hd + 0.01, 0.04), topC, [0, -0.045, 0]);
      b.add(rbox(0.012, 0.13, 0.02, 0.004), shade(topC, 0.7), [0, -0.05, hd / 2 + 0.008]);
    }
    b.build(J.hips);
    if (skirtLike) {
      const sc = topStyle === 'dress' ? topC : botC;
      const hx = G.pelvisW / 2 + 0.025, rTop = hx / Math.SQRT1_2, rBot = rTop * 1.42;
      const g = cgeo(`skirt${rTop.toFixed(3)}`, () => new THREE.CylinderGeometry(rTop, rBot, 0.34, 4, 1));
      const bs = new Bag();
      bs.add(g, sc, [0, -0.13, 0], [0, PI / 4, 0], [1, 1, (G.pelvisD + 0.05) / (G.pelvisW + 0.05)], 'vc', true);
      bs.add(rbox(G.pelvisW + 0.06, 0.05, G.pelvisD + 0.06, 0.02), shade(sc, 0.82), [0, 0.03, 0]);
      bs.build(J.skirt);
    }
  }

  // ---------------- torso ----------------
  const emblemMeshes = [];
  {
    const b = new Bag();
    const tw = G.torsoW, td = G.torsoD, th = TORSO_TOP + 0.04;
    b.add(taperBox(tw, th, td, 0.07, 0.93), topC, [0, (TORSO_TOP - 0.04) / 2, 0]);
    b.add(cyl(0.1, 0.11, 0.12, 10), skin, [0, 0.5, 0]);
    const front = td / 2;
    if (topStyle === 'hoodie') {
      const dk = shade(topC, lum(topC) < 0.2 ? 1.08 : 0.9);
      b.add(torus(0.155, 0.06, 6, 14), topC, [0, 0.47, -0.02], [PI / 2, 0, 0], [1, 1.1, 1]);
      b.add(rbox(0.4, 0.15, 0.12, 0.05), topC, [0, 0.45, -td / 2 + 0.02]);
      b.add(rbox(tw * 0.6, 0.15, 0.026, 0.02), dk, [0, 0.07, front + 0.004]);
      if (!low) for (const sx of [-1, 1]) {
        b.add(cyl(0.012, 0.012, 0.09, 6), acc, [sx * 0.075, 0.385, front + 0.012]);
        b.add(cyl(0.017, 0.017, 0.03, 6), shade(acc, 0.8), [sx * 0.075, 0.33, front + 0.012]);
      }
    } else if (topStyle === 'tee') {
      b.add(torus(0.125, 0.024, 6, 20), shade(topC, 0.8), [0, TORSO_TOP + 0.005, 0.0], [PI / 2, 0, 0]);
    } else if (topStyle === 'cardigan') {
      const shirt = acc === '#ffffff' ? '#f3ecd8' : acc;
      b.add(rbox(0.13, TORSO_TOP - 0.01, 0.02, 0.008), shirt, [0, 0.235, front + 0.002]);
      for (const sx of [-1, 1]) b.add(rbox(0.035, TORSO_TOP - 0.01, 0.026, 0.01), shade(topC, 0.82), [sx * 0.08, 0.235, front + 0.004]);
      for (let i = 0; i < 3; i++) b.add(cyl(0.017, 0.017, 0.02, 10), '#5a3b22', [-0.08, 0.1 + i * 0.11, front + 0.018], [PI / 2, 0, 0]);
      for (const sx of [-1, 1]) b.add(rbox(0.13, 0.1, 0.025, 0.012), shade(topC, 0.9), [sx * tw * 0.27, 0.11, front + 0.004]);
      for (const sx of [-1, 1]) b.add(rbox(0.12, 0.05, 0.03, 0.01), shade(topC, 0.88), [sx * 0.09, 0.455, front - 0.01], [0.3, 0, sx * 0.5]);
    } else if (topStyle === 'suit') {
      const tie = acc === '#ffffff' ? '#b3202a' : (S.accessories.includes('sash') ? '#b3202a' : acc);
      b.add(rbox(0.2, 0.2, 0.02, 0.006), '#f7f7f2', [0, 0.37, front + 0.002]);
      for (const sx of [-1, 1]) b.add(rbox(0.07, 0.26, 0.024, 0.008), shade(topC, 0.78), [sx * 0.085, 0.36, front + 0.008], [0, 0, sx * 0.38]);
      b.add(rbox(0.055, 0.2, 0.02, 0.008), tie, [0, 0.33, front + 0.014]);
      b.add(rbox(0.065, 0.05, 0.028, 0.01), shade(tie, 0.85), [0, 0.445, front + 0.016]);
      for (let i = 0; i < 2; i++) b.add(cyl(0.016, 0.016, 0.02, 10), '#1b1b1b', [0, 0.1 + i * 0.09, front + 0.01], [PI / 2, 0, 0]);
      b.add(rbox(0.07, 0.03, 0.02, 0.006), '#f7f7f2', [tw * 0.28, 0.36, front + 0.006]);
    } else if (topStyle === 'dress') {
      b.add(rbox(tw * 0.93 + 0.014, 0.05, td + 0.014, 0.02), acc, [0, 0.07, 0]);
      b.add(rbox(0.22, 0.05, 0.03, 0.012), skin, [0, TORSO_TOP - 0.03, front - 0.008]);
    }
    b.build(J.torso);
    if (S.top.emblem) {
      const e = S.top.emblem;
      const isStripe = e === 'stripe';
      const w = isStripe ? G.torsoW * 1.0 : 0.25;
      const m = new THREE.Mesh(plane(w, isStripe ? 0.25 : 0.25), emblemMaterial(e, acc, topC, String(S.number ?? '7')));
      m.position.set(0, topStyle === 'hoodie' ? 0.255 : 0.27, G.torsoD / 2 + 0.004);
      if (isStripe) m.scale.set(1, 1, 1);
      m.name = 'emblem';
      J.torso.add(m); emblemMeshes.push(m);
    }
  }

  // ---------------- arms ----------------
  const fingers = {};
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? 1 : -1;
    const longSleeve = topStyle === 'hoodie' || topStyle === 'cardigan' || topStyle === 'suit';
    const ba = new Bag();
    const aw = G.armW;
    const ul = UPPER + 0.14;
    if (longSleeve) ba.add(rbox(aw, ul, ARM_D, 0.05), topC, [0, 0.08 - ul / 2, 0]);
    else {
      ba.add(rbox(aw * 0.94, ul, ARM_D * 0.94, 0.045), skin, [0, 0.08 - ul / 2, 0]);
      ba.add(rbox(aw + 0.02, topStyle === 'dress' ? 0.11 : 0.19, ARM_D + 0.02, 0.05), topC, [0, topStyle === 'dress' ? 0.03 : -0.01, 0]);
    }
    ba.build(J['arm' + side]);
    const bf = new Bag();
    const fl = FORE - HAND / 2 + 0.06;
    bf.add(rbox(aw * 0.95, fl, ARM_D * 0.95, 0.045), longSleeve ? topC : skin, [0, 0.05 - fl / 2, 0]);
    if (longSleeve) {
      const cuff = topStyle === 'suit' ? '#f7f7f2' : shade(topC, lum(topC) < 0.2 ? 1.2 : 0.84);
      bf.add(rbox(aw * 0.95 + 0.014, 0.05, ARM_D * 0.95 + 0.014, 0.02), cuff, [0, -FORE + HAND / 2 + 0.035, 0]);
    }
    bf.add(rbox(HAND, HAND * 0.95, HAND, 0.045), skin, [0, -FORE, 0]);
    if (!low) bf.add(rbox(0.048, 0.075, 0.05, 0.02), skin, [-sg * (HAND / 2), -FORE + 0.005, 0.035], [0, 0, sg * 0.25]);
    bf.build(J['foreArm' + side]);
    const fg = mk('finger' + side, J['foreArm' + side], 0, -FORE - HAND / 2, 0.02);
    const fb = new Bag(); fb.add(rbox(0.046, 0.11, 0.05, 0.02), skin, [0, -0.04, 0]);
    fb.build(fg);
    fingers[side] = fg;
  }

  // ---------------- head ----------------
  const browC = (() => {
    if (S.hair.style === 'bald') return '#3b2a20';
    const L = lum(hairC);
    return L > 0.55 ? mixHex(hairC, '#5a5048', 0.42) : shade(hairC, 0.85);
  })();
  const faceColors = { eye: S.eyeColor, brow: browC, nose: shade(skin, 0.72) };
  let hairTop = 0;
  {
    const b = new Bag();
    b.add(rbox(HEAD_W, HEAD_H, HEAD_D, HEAD_R, 2), skin, [0, HEAD_H / 2, 0]);
    if (S.hair.style !== 'long') for (const sx of [-1, 1]) b.add(rbox(0.07, 0.14, 0.11, 0.03), skin, [sx * (HEAD_W / 2 + 0.012), 0.27, -0.01]);
    const extras = [];
    hairTop = addHair(b, S.hair.style, hairC, skin, S, extras);
    b.build(J.head);
    for (const m of extras) J.head.add(m);
  }
  _collect = null;
  skinC.build(body, [...HUMAN_JOINTS, 'fingerL', 'fingerR'].map((n) => J[n]));
  for (const f of Object.values(fingers)) f.scale.setScalar(1e-5);
  const faceMat = makeFaceMaterial(humanFaceTexture('neutral', false, faceColors));
  const faceMesh = new THREE.Mesh(plane(FACE_SIZE, FACE_SIZE), faceMat);
  faceMesh.position.set(0, FACE_Y, HEAD_D / 2 + 0.0025); faceMesh.name = 'face';
  J.head.add(faceMesh);

  // ---------------- accessories ----------------
  const accs = {};
  const ctx = { S, G, J, hairTop, skin, hairC, acc };
  function ensureAcc(name) {
    if (accs[name] !== undefined) return accs[name];
    const grp = buildHumanAccessory(name, ctx);
    accs[name] = grp;
    if (grp) grp.visible = false;
    return grp;
  }
  for (const a of S.accessories) { const g = ensureAcc(a); if (g) g.visible = true; }
  let hatColor = S.partyHatColor;
  function placePartyHat() {
    const g = accs.partyHat; if (!g) return;
    let y = HEAD_H + hairTop - 0.015;
    if (accs.topHat && accs.topHat.visible) y = HEAD_H + hairTop * 0.5 + 0.385;
    else if (accs.cap && accs.cap.visible) y = HEAD_H + hairTop * 0.3 + 0.1;
    g.position.set(0.06, y, 0.02);
  }
  placePartyHat();

  const rest = makeRec(HUMAN_JOINTS);
  for (const n of HUMAN_JOINTS) { rest.j[n].p.copy(J[n].position); rest.j[n].q.copy(J[n].quaternion); }
  rest.x.sit = 0;
  const recA = makeRec(HUMAN_JOINTS), recB = makeRec(HUMAN_JOINTS), recM = makeRec(HUMAN_JOINTS);
  const seed = seedOf(S.id);
  const blinkPhase = hash(seed * 1.37) * 3.1;

  const ch = {
    id: S.id, root, body, joints: J, spec: S, kind: 'human', expression: 'neutral',
    sitInfo: { hipZ: SIT_HIP_Z, footZ: SIT_HIP_Z + THIGH },
    pose(action, t = 0, params = {}) {
      computeHuman(ch, recA, action, t, params);
      applyHuman(recA);
      return ch;
    },
    poseMix(a, ta, pa, b2, tb, pb, w) {
      computeHuman(ch, recA, a, ta, pa || {});
      computeHuman(ch, recB, b2, tb, pb || {});
      mixRec(recM, recA, recB, clamp(w, 0, 1));
      applyHuman(recM);
      return ch;
    },
    face(expr = 'neutral', t = 0) {
      const e = HUMAN_FACES[expr] ? expr : 'neutral';
      ch.expression = e;
      faceMat.map = humanFaceTexture(e, isBlinking(t, blinkPhase), faceColors);
      return ch;
    },
    setAccessory(name, on = true) {
      const g = ensureAcc(name);
      if (g) { g.visible = !!on; if (low) g.traverse((o) => { if (o.isMesh) o.castShadow = false; }); }
      placePartyHat();
      return ch;
    },
    setPartyHatColor(hex) {
      hatColor = hex;
      const g = ensureAcc('partyHat');
      if (g) { const c = g.getObjectByName('partyHatCone'); if (c) c.material = partyHatMaterial(hex); }
      return ch;
    },
    dispose() {
      root.traverse((o) => {
        if (o.isMesh && o.geometry && o.geometry.userData.owned) o.geometry.dispose();
        if (o.isSkinnedMesh && o.skeleton) o.skeleton.dispose();
      });
      faceMat.dispose();
      if (root.parent) root.parent.remove(root);
    },
  };
  ch._G = G; ch._seed = seed; ch._rest = rest; ch._fingers = fingers; ch.blinkPhase = blinkPhase;
  if (S.partyHatColor !== '#ff4fa3' && accs.partyHat) ch.setPartyHatColor(S.partyHatColor);

  function applyHuman(rec) {
    for (const n of HUMAN_JOINTS) { const o = J[n], r = rec.j[n]; o.position.copy(r.p); o.quaternion.copy(r.q); o.scale.copy(r.s); }
    const sit = rec.x.sit || 0;
    J.skirt.scale.set(1 + 0.05 * sit, 1 - 0.62 * sit, 1 + 0.3 * sit);
    J.skirt.position.set(0, 0, 0.04 * sit);
    for (const sd of ['L', 'R']) { const on = (rec.x['finger' + sd] || 0) > 0.5; fingers[sd].scale.setScalar(on ? 1 : 1e-5); fingers[sd].visible = on; }
    if (rec.x.footZ !== undefined) ch.sitInfo.footZ = rec.x.footZ;
  }
  if (low) root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  ch.lod = low ? 'low' : 'high';
  ch.pose('idle', 0);
  ch.face('neutral', 0);
  return ch;
}

function computeHuman(ch, rec, action, t, params) {
  copyRec(rec, ch._rest);
  const c = { ch, G: ch._G, rec, j: rec.j, x: rec.x, p: params, t: t * (params.speed ?? 1), I: params.intensity ?? 1,
    seed: ch._seed, seated: !!params.seated, s: ch.spec.scale };
  const fn = HUMAN[action] || HUMAN.idle;
  fn(c);
  // head: action (pitch, yaw, roll) + lookAt / headYaw / headPitch
  let [hx, hy, hz] = c.x.head || [0, 0, 0];
  if (params.lookAt && ch.root) {
    ch.root.updateWorldMatrix(true, false);
    _m1.copy(ch.root.matrixWorld).multiply(ch.body.matrix.compose(ch.body.position, ch.body.quaternion, ch.body.scale));
    _m2.compose(rec.j.hips.p, rec.j.hips.q, _v1.set(1, 1, 1)); _m1.multiply(_m2);
    _m2.compose(rec.j.torso.p, rec.j.torso.q, _v1.set(1, 1, 1)); _m1.multiply(_m2);
    const L = _v2.copy(params.lookAt).applyMatrix4(_m1.invert());
    const d = L.sub(_v3.set(0, NECK_Y + 0.31, 0));
    hy = Math.atan2(d.x, d.z);
    hx = -Math.atan2(d.y, Math.hypot(d.x, d.z));
    if (Math.abs(hy) > 2.4) hy = 0;   // target behind: don't spin
  }
  hy += params.headYaw ?? 0;
  hx += params.headPitch ?? 0;
  hy = clamp(hy, -1.25, 1.25); hx = clamp(hx, -0.75, 0.8);
  rec.j.head.q.setFromEuler(_e1.set(hx, hy, hz, 'YXZ'));
}

// ---- hair ------------------------------------------------------------------------------------------
const _shellMats = new Map();
function fadeShell(hc, skin) {
  const key = hc + skin;
  let mat = _shellMats.get(key);
  if (!mat) {
    const tex = canvasTexture(64, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, hc); gr.addColorStop(0.24, hc);
      gr.addColorStop(0.33, mixHex(hc, skin, 0.38)); gr.addColorStop(0.43, mixHex(hc, skin, 0.78)); gr.addColorStop(0.52, skin); gr.addColorStop(1, skin);
      g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
      // stubble speckle in the fade zone (deterministic)
      const [r, gg, bb] = hexToRgb(hc);
      for (let i = 0; i < 700; i++) {
        const x = hash(i * 1.3) * 64, y = 56 + hash(i * 2.7 + 5) * 76;
        const a = 0.35 * (1 - (y - 56) / 76);
        g.fillStyle = rgbStr(r, gg, bb, a); g.fillRect(x, y, 1.5, 1.5);
      }
    });
    mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    _shellMats.set(key, mat);
  }
  const h = 0.6, y0 = -0.005;
  // one material (1 draw): the front face sits 6 mm inside the face so the head hides it
  const m = new THREE.Mesh(rbox(HEAD_W + 0.012, h, HEAD_D, HEAD_R + 0.006, 2), mat);
  m.position.set(0, y0 + h / 2, -0.006); m.castShadow = true; m.receiveShadow = true; m.name = 'fadeShell';
  return m;
}

function addHair(b, style, hc, skin, S, extras = null) {
  const W = HEAD_W, Dp = HEAD_D, Hh = HEAD_H;
  const capFrontZ = (d) => (Dp / 2 - 0.012) - d / 2;   // z centre so the cap front sits just inside the face
  const cap = (h, yTop, extra = 0.022, col = hc, r = 0.075) => {
    const d = Dp + extra;
    b.add(rbox(W + extra, h, d, r, 3), col, [0, yTop - h / 2, capFrontZ(d)]);
  };
  const dark = shade(hc, 0.86);
  switch (style) {
    case 'bald': return 0;
    case 'fade': {
      // crop on top; the sides/back are a gradient shell (hair → skin) = a clean skin fade
      cap(Hh + 0.035 - 0.47, Hh + 0.035, 0.024);
      if (extras && !_lowDetail) extras.push(fadeShell(hc, skin));
      else cap(0.17, Hh + 0.035 - 0.25, 0.014, mixHex(hc, skin, 0.35), 0.07);
      b.add(rbox(0.6, 0.07, 0.5, 0.035), hc, [0, Hh + 0.05, -0.035]);
      b.add(rbox(0.54, 0.1, 0.19, 0.045), hc, [0, Hh + 0.075, 0.115], [-0.3, 0, 0]);
      b.add(rbox(0.34, 0.075, 0.15, 0.035), mixHex(hc, '#7a4e33', 0.55), [0.08, Hh + 0.118, 0.1], [-0.42, 0.14, 0.07]);
      b.add(rbox(0.24, 0.065, 0.13, 0.03), dark, [-0.13, Hh + 0.1, 0.07], [-0.28, -0.2, -0.06]);
      return 0.13;
    }
    case 'short': {
      cap(0.17, Hh + 0.035);
      b.add(rbox(W + 0.02, 0.26, 0.1, 0.05), hc, [0, Hh - 0.16, -Dp / 2 + 0.035]);
      b.add(rbox(W * 0.84, 0.075, 0.05, 0.03), hc, [0.03, Hh - 0.045, Dp / 2 - 0.005], [0, 0, 0.06]);
      return 0.035;
    }
    case 'curly': {
      cap(0.17, Hh + 0.03);
      const pts = [];
      for (const x of [-0.21, 0, 0.21]) for (const z of [-0.17, 0.0, 0.15]) pts.push([x, Hh + 0.05, z]);
      for (const sx of [-1, 1]) for (const z of [-0.14, 0.06]) pts.push([sx * 0.31, Hh - 0.07, z]);
      for (const x of [-0.17, 0.17]) for (const y of [Hh - 0.13, Hh - 0.01]) pts.push([x, y, -0.27]);
      for (const x of [-0.18, 0, 0.18]) pts.push([x, Hh + 0.0, 0.24]);
      pts.forEach((p, i) => b.add(ico(0.09, 0), i % 3 === 0 ? dark : hc, [p[0], p[1] + 0.02 * (hash(i + 3) - 0.5), p[2]], [hash(i) * 3, hash(i + 9) * 3, 0], [1, 1, 1], 'vc', true));
      return 0.12;
    }
    case 'spiky': {
      cap(0.16, Hh + 0.03);
      const sp = [[0, 0.15, -0.05, -0.5, 0], [-0.17, 0.12, -0.02, -0.4, 0.35], [0.17, 0.12, -0.02, -0.4, -0.35],
        [-0.09, 0.12, 0.13, 0.25, 0.25], [0.09, 0.13, 0.15, 0.3, -0.2], [0, 0.11, -0.2, -0.85, 0], [-0.2, 0.08, -0.18, -0.7, 0.5],
        [0.2, 0.08, -0.18, -0.7, -0.5], [0, 0.14, 0.08, 0.05, 0]];
      sp.forEach(([x, y, z, rx, rz], i) => b.add(cone(0.085, 0.24, 4), i % 2 ? hc : dark, [x, Hh + y, z], [rx, PI / 4, rz, 'XZY'], [1, 1, 1], 'vc', true));
      return 0.1;
    }
    case 'bun': {
      cap(0.17, Hh + 0.03);
      b.add(rbox(W + 0.02, 0.28, 0.1, 0.05), hc, [0, Hh - 0.17, -Dp / 2 + 0.035]);
      b.add(rbox(W * 0.6, 0.07, 0.05, 0.03), hc, [-0.12, Hh - 0.04, Dp / 2 - 0.005], [0, 0, -0.18]);
      b.add(sph(0.13, 16, 12), hc, [0, Hh + 0.12, -0.1]);
      b.add(cyl(0.085, 0.095, 0.045, 14), S.top.accent === '#ffffff' ? '#ffd23f' : S.top.accent, [0, Hh + 0.03, -0.08], [-0.25, 0, 0]);
      return 0.05;
    }
    case 'long': {
      cap(0.17, Hh + 0.035);
      for (const sx of [-1, 1]) b.add(rbox(0.07, 0.6, 0.34, 0.035), hc, [sx * (W / 2 + 0.02), 0.28, -0.06]);
      b.add(rbox(W + 0.06, 0.78, 0.09, 0.04), hc, [0, 0.2, -Dp / 2 - 0.02]);
      b.add(rbox(W * 0.86, 0.08, 0.05, 0.03), hc, [-0.03, Hh - 0.045, Dp / 2 - 0.005], [0, 0, -0.07]);
      return 0.035;
    }
    case 'afro': {
      b.add(rbox(W + 0.24, 0.44, Dp + 0.2, 0.19, 3), hc, [0, Hh + 0.05, -0.08]);
      b.add(rbox(W + 0.18, 0.26, Dp - 0.04, 0.1), hc, [0, Hh - 0.22, -0.1]);
      return 0.27;
    }
    case 'grandpa': {
      for (const sx of [-1, 1]) b.add(rbox(0.085, 0.16, 0.32, 0.045), hc, [sx * (W / 2 + 0.02), 0.37, -0.06]);
      b.add(rbox(W * 0.84, 0.15, 0.08, 0.04), hc, [0, 0.35, -Dp / 2 - 0.005]);
      b.add(rbox(0.2, 0.025, 0.3, 0.012), hc, [0.06, Hh + 0.004, -0.02], [0, 0.35, 0.03]);
      return 0.0;
    }
    default: cap(0.17, Hh + 0.035); return 0.035;
  }
}

// ---- accessories -----------------------------------------------------------------------------------
function buildHumanAccessory(name, ctx) {
  const { S, G, J, hairTop, hairC, acc } = ctx;
  const grp = new THREE.Group(); grp.name = 'acc:' + name;
  const b = new Bag();
  const front = G.torsoD / 2;
  const eyeY = FACE_Y + 0.027, faceZ = HEAD_D / 2;
  let parent = J.head;
  switch (name) {
    case 'headphones': {
      parent = J.torso;
      const white = '#f4f4f6', pad = '#3a3b42';
      const pts = [];
      const cx = 0.19 * (0.9 + 0.1 * S.build);
      pts.push(new THREE.Vector3(cx, 0.4, 0.17));
      pts.push(new THREE.Vector3(cx + 0.03, 0.46, 0.05));
      pts.push(new THREE.Vector3(0.17, 0.48, -0.12));
      pts.push(new THREE.Vector3(0, 0.48, -0.2));
      pts.push(new THREE.Vector3(-0.17, 0.48, -0.12));
      pts.push(new THREE.Vector3(-cx - 0.03, 0.46, 0.05));
      pts.push(new THREE.Vector3(-cx, 0.4, 0.17));
      const tube = cgeo(`hpband${cx.toFixed(3)}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.024, 6, false));
      b.add(tube, white);
      for (const sx of [-1, 1]) {
        const rot = [-1.15, 0, sx * 0.5];
        b.add(cyl(0.078, 0.078, 0.055, 14), white, [sx * (cx + 0.01), 0.36, front + 0.035], rot);
        b.add(cyl(0.064, 0.064, 0.03, 12), pad, [sx * (cx + 0.005), 0.385, front + 0.012], rot);
        b.add(cyl(0.05, 0.05, 0.012, 12), shade(white, 0.88), [sx * (cx + 0.016), 0.34, front + 0.055], rot);
      }
      break;
    }
    case 'glasses': {
      const fc = '#3b2a22';
      for (const sx of [-1, 1]) {
        const x = sx * 0.122, z = faceZ + 0.02;
        b.add(rbox(0.17, 0.022, 0.02, 0.008), fc, [x, eyeY + 0.062, z]);
        b.add(rbox(0.17, 0.022, 0.02, 0.008), fc, [x, eyeY - 0.062, z]);
        b.add(rbox(0.022, 0.146, 0.02, 0.008), fc, [x - 0.074, eyeY, z]);
        b.add(rbox(0.022, 0.146, 0.02, 0.008), fc, [x + 0.074, eyeY, z]);
        b.add(rbox(0.018, 0.02, 0.3, 0.006), fc, [sx * (HEAD_W / 2 + 0.012), eyeY + 0.04, z - 0.15]);
      }
      b.add(rbox(0.07, 0.02, 0.02, 0.006), fc, [0, eyeY + 0.03, faceZ + 0.02]);
      break;
    }
    case 'sunglasses': {
      for (const sx of [-1, 1]) {
        b.add(rbox(0.19, 0.12, 0.03, 0.03), '#121218', [sx * 0.125, eyeY + 0.005, faceZ + 0.02], [0, 0, 0], [1, 1, 1], 'gloss');
        b.add(rbox(0.016, 0.022, 0.32, 0.006), '#121218', [sx * (HEAD_W / 2 + 0.012), eyeY + 0.03, faceZ - 0.15]);
        b.add(rbox(0.035, 0.1, 0.006, 0.003), '#9aa3b5', [sx * 0.125 - 0.03, eyeY + 0.005, faceZ + 0.036], [0, 0, -0.6], [1, 1, 1], 'gloss');
      }
      b.add(rbox(0.08, 0.025, 0.025, 0.008), '#121218', [0, eyeY + 0.035, faceZ + 0.02]);
      break;
    }
    case 'mustache': {
      const mc = S.hair.style === 'bald' ? '#4a3426' : hairC;
      for (const sx of [-1, 1]) b.add(rbox(0.15, 0.052, 0.04, 0.022), mc, [sx * 0.066, 0.214, faceZ + 0.008], [0, 0, sx * 0.24]);
      b.add(rbox(0.06, 0.046, 0.04, 0.018), mc, [0, 0.226, faceZ + 0.01]);
      break;
    }
    case 'beard': {
      const mc = S.hair.style === 'bald' ? '#4a3426' : hairC;
      b.add(rbox(HEAD_W * 0.9, 0.13, 0.1, 0.05), mc, [0, 0.03, faceZ - 0.03]);
      for (const sx of [-1, 1]) b.add(rbox(0.06, 0.2, 0.3, 0.03), mc, [sx * (HEAD_W / 2 + 0.005), 0.12, 0.08]);
      break;
    }
    case 'topHat': {
      const band = (acc && acc.toLowerCase() !== '#ffffff' && !S.accessories.includes('sash')) ? acc : '#b3202a';
      const y0 = HEAD_H + hairTop * 0.5;
      b.add(cyl(0.31, 0.31, 0.026, 28), '#1b1b20', [0, y0 + 0.013, 0]);
      b.add(cyl(0.205, 0.215, 0.36, 28), '#1f1f25', [0, y0 + 0.2, 0]);
      b.add(cyl(0.219, 0.219, 0.06, 28), band, [0, y0 + 0.06, 0]);
      grp.rotation.set(-0.03, 0, -0.05);
      break;
    }
    case 'cap': {
      const cc = S.capColor ?? (acc && acc.toLowerCase() !== '#ffffff' ? acc : '#e63946');
      const y0 = HEAD_H + hairTop * 0.3;
      b.add(rbox(HEAD_W + 0.035, 0.15, HEAD_D + 0.035, 0.075, 3), cc, [0, y0 - 0.03, -0.005]);
      b.add(rbox(0.46, 0.028, 0.24, 0.012), shade(cc, 0.85), [0, y0 - 0.095, faceZ + 0.1], [0.08, 0, 0]);
      b.add(cyl(0.03, 0.03, 0.03, 10), shade(cc, 0.85), [0, y0 + 0.05, 0]);
      break;
    }
    case 'bowtie': {
      parent = J.torso;
      const bc = acc && acc.toLowerCase() !== '#ffffff' ? acc : '#d62839';
      for (const sx of [-1, 1]) b.add(rbox(0.09, 0.075, 0.035, 0.02), bc, [sx * 0.05, 0.445, front + 0.02], [0, 0, sx * -0.3]);
      b.add(rbox(0.04, 0.045, 0.04, 0.012), shade(bc, 0.8), [0, 0.445, front + 0.025]);
      break;
    }
    case 'chain': {
      parent = J.torso;
      b.add(torus(0.17, 0.018, 5, 20), '#f2c230', [0, 0.42, 0.04], [PI / 2 + 0.5, 0, 0], [1, 1, 1], 'gold');
      b.add(rbox(0.07, 0.08, 0.02, 0.012), '#f2c230', [0, 0.315, front + 0.02], [0, 0, 0], [1, 1, 1], 'gold');
      break;
    }
    case 'sash': {
      parent = J.torso;
      const sc = S.sashColor ?? (acc && acc.toLowerCase() !== '#ffffff' ? acc : '#ffd23f');
      const tw = G.torsoW, td = G.torsoD;
      const x0 = -tw / 2 + 0.06, y0 = TORSO_TOP - 0.02, x1 = tw / 2 - 0.04, y1 = 0.02;
      const len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
      b.add(rbox(len + 0.04, 0.11, 0.024, 0.01), sc, [(x0 + x1) / 2, (y0 + y1) / 2, td / 2 + 0.012], [0, 0, ang]);
      b.add(rbox(len + 0.04, 0.11, 0.024, 0.01), sc, [(x0 + x1) / 2, (y0 + y1) / 2, -td / 2 - 0.012], [0, 0, -ang]);
      b.add(rbox(0.11, 0.03, td + 0.03, 0.01), sc, [x0 + 0.01, TORSO_TOP + 0.005, 0]);
      b.add(rbox(0.06, 0.13, td + 0.05, 0.01), sc, [x1 + 0.025, y1 + 0.02, 0]);
      const mx = lerp(x0, x1, 0.62), my = lerp(y0, y1, 0.62);
      b.add(cyl(0.055, 0.055, 0.02, 18), '#d62839', [mx, my, td / 2 + 0.03], [PI / 2, 0, 0]);
      b.add(cyl(0.035, 0.035, 0.024, 18), '#f2c230', [mx, my, td / 2 + 0.036], [PI / 2, 0, 0], [1, 1, 1], 'gold');
      break;
    }
    case 'blindfold': {
      const bc = S.blindfoldColor ?? '#2b2d3a';
      b.add(rbox(HEAD_W + 0.032, 0.125, HEAD_D + 0.032, 0.05), bc, [0, eyeY, 0]);
      b.add(rbox(0.09, 0.08, 0.06, 0.03), shade(bc, 0.85), [0.05, eyeY, -HEAD_D / 2 - 0.035]);
      b.add(rbox(0.05, 0.18, 0.02, 0.01), bc, [0.1, eyeY - 0.1, -HEAD_D / 2 - 0.045], [0.1, 0, 0.35]);
      b.add(rbox(0.05, 0.16, 0.02, 0.01), bc, [0.02, eyeY - 0.1, -HEAD_D / 2 - 0.05], [0.1, 0, -0.15]);
      break;
    }
    case 'partyHat': {
      const ph = makePartyHatMesh(S.partyHatColor);
      ph.rotation.set(0.06, 0, -0.2);
      grp.add(ph);
      J.head.add(grp);
      return grp;
    }
    default: return null;
  }
  b.build(grp);
  parent.add(grp);
  return grp;
}

// ======================================================================================================
//  Creatures
// ======================================================================================================
const PIGEON_JOINTS = ['hips', 'belly', 'torso', 'head', 'jaw', 'armL', 'armR', 'legL', 'legR', 'tail'];
const CAT_JOINTS = ['hips', 'belly', 'torso', 'head', 'armL', 'armR', 'legL', 'legR', 'tail1', 'tail2'];

const PIGEON = {};
function pigeonBase(c) { c.x.beak = 0; c.x.wingOpen = 0; }
PIGEON.idle = (c) => {
  const t = c.t;
  pos(c, 'hips', 0, 0.17 + 0.003 * Math.sin(TAU * t / 1.7), 0);
  eul(c, 'hips', -0.15, 0, 0);
  // jerky little head turns (pigeon-y): quantised noise, smoothed quickly
  const k = Math.floor(t * 1.3), f = t * 1.3 - k;
  const a0 = noise1(k, c.seed) * 0.9, a1 = noise1(k + 1, c.seed) * 0.9;
  const yaw = lerp(a0, a1, smooth(f / 0.18));
  eul(c, 'torso', 0.12, 0, 0);
  eul(c, 'head', 0.03 + 0.08 * noise1(t * 0.7, c.seed + 2), yaw, 0.12 * noise1(t * 0.9, c.seed + 5));
  eul(c, 'tail', 0.03 * Math.sin(TAU * t / 2.1), 0, 0);
};
PIGEON.peck = (c) => {
  const t = c.t, ph = (t % 0.75) / 0.75;
  const down = ph < 0.16 ? ease.inQuad(ph / 0.16) : ph < 0.24 ? 1 : ph < 0.5 ? 1 - ease.outCubic((ph - 0.24) / 0.26) : 0;
  pos(c, 'hips', 0, 0.17 - 0.01 * down, 0);
  eul(c, 'hips', -0.15 + 0.45 * down, 0, 0);
  eul(c, 'torso', 0.12 + 0.75 * down, 0, 0);
  eul(c, 'head', 0.4 * down, 0, 0);
  eul(c, 'tail', -0.35 * down, 0, 0);
  c.x.beak = 0.15 * down;
};
PIGEON.strut = (c) => {
  const t = c.t, cyc = t / 0.6, ph = TAU * cyc;
  const s = Math.sin(ph);
  pos(c, 'hips', 0, 0.17 + 0.008 * Math.abs(Math.cos(ph)), 0);
  eul(c, 'hips', -0.15, 0, 0.05 * s);
  // head bob: holds still then snaps forward (twice per cycle)
  const f = (cyc * 2) % 1;
  const bob = f < 0.7 ? -0.025 * (f / 0.7) : -0.025 + 0.025 * ease.outCubic((f - 0.7) / 0.3);
  pos(c, 'torso', 0, 0.065, 0.085 + 0.025 + bob * 1.4);
  eul(c, 'torso', 0.12, 0, 0);
  eul(c, 'head', 0.05, 0.05 * s, 0);
  eul(c, 'legL', -0.55 * s, 0, 0); eul(c, 'legR', 0.55 * s, 0, 0);
  pos(c, 'legL', 0.04, -0.07 + 0.012 * Math.max(0, -s), 0.01); pos(c, 'legR', -0.04, -0.07 + 0.012 * Math.max(0, s), 0.01);
  eul(c, 'tail', 0.06 * Math.sin(ph * 2), 0.08 * s, 0);
};
PIGEON.flap = (c) => {
  const t = c.t, w = Math.sin(TAU * 5.5 * t);
  pos(c, 'hips', 0, 0.17 + 0.025 * Math.abs(w), 0);
  eul(c, 'hips', -0.35, 0, 0);
  eul(c, 'torso', 0.25, 0, 0); eul(c, 'head', 0.1, 0, 0);
  const open = 0.55 + 0.45 * w;
  eul(c, 'armL', 0, 0.3, 0.3 + 1.15 * open); eul(c, 'armR', 0, -0.3, -(0.3 + 1.15 * open));
  c.x.wingOpen = 1;
  eul(c, 'tail', -0.25, 0, 0); c.j.tail.s.set(1.35, 1, 1.1);
  eul(c, 'legL', 0.3, 0, 0); eul(c, 'legR', 0.3, 0, 0);
};
PIGEON.huss = (c) => {
  const t = c.t, p = c.p;
  let puff;
  if (p.hits && p.hits.length) {
    let best = Infinity;
    for (const x of p.hits) { const d = t - x; if (d > -0.25 && d < best) best = d; }
    puff = best === Infinity ? 0 : best < 0 ? ease.inQuad(1 + best / 0.25) : Math.exp(-best / 0.35);
  } else puff = 0.92 + 0.08 * Math.sin(TAU * 9 * t);
  const tr = 0.006 * noise1(t * 20, c.seed) * puff;
  pos(c, 'hips', tr, 0.17 + 0.03 * puff, 0);
  eul(c, 'hips', -0.15 - 0.18 * puff, 0, 0);
  c.j.belly.s.set(1 + 0.34 * puff, 1 + 0.22 * puff, 1 + 0.14 * puff);
  pos(c, 'torso', 0, 0.065 + 0.03 * puff, 0.085 + 0.02 * puff);
  eul(c, 'torso', 0.12 + 0.05 * puff, 0, 0);
  eul(c, 'head', 0.1 * puff, 0, 0);
  eul(c, 'armL', 0, 0, 0.45 * puff); eul(c, 'armR', 0, 0, -0.45 * puff);
  eul(c, 'tail', -0.5 * puff, 0, 0); c.j.tail.s.set(1 + 0.4 * puff, 1, 1);
  // keep feet on the floor while the body is puffed & lifted
  pos(c, 'legL', 0.04, -0.07, 0.01); pos(c, 'legR', -0.04, -0.07, 0.01);
  c.j.legL.s.set(1, 1 + 0.03 * puff / 0.094, 1); c.j.legR.s.copy(c.j.legL.s);
  eul(c, 'legL', 0.18 * puff, 0, 0); eul(c, 'legR', 0.18 * puff, 0, 0);
  c.x.beak = puff;
};
PIGEON.knock = (c) => {
  const t = c.t, ph = (t % 0.9) / 0.9;
  const sweep = ph < 0.35 ? -ease.inOutQuad(ph / 0.35) : ph < 0.55 ? -1 + 2.2 * ease.outCubic((ph - 0.35) / 0.2) : 1.2 - 1.2 * ease.inOutQuad((ph - 0.55) / 0.45);
  const out = ph < 0.75 ? smooth(ph / 0.2) : 1 - smooth((ph - 0.75) / 0.25);
  pos(c, 'hips', 0, 0.17, 0);
  eul(c, 'hips', -0.15, -0.35 * sweep, 0);
  eul(c, 'torso', 0.1, 0.25 * sweep, 0);
  eul(c, 'head', 0, 0.3 * sweep, 0);
  eul(c, 'armR', 0, 0.9 * sweep * out, -1.35 * out, 'ZYX');
  c.x.wingOpen = out;
  eul(c, 'tail', 0, 0.3 * sweep, 0);
  c.x.beak = 0.3 * Math.max(0, sweep);
};
PIGEON.sit = (c) => {
  const t = c.t;
  pos(c, 'hips', 0, 0.105 + 0.002 * Math.sin(TAU * t / 2.4), 0);
  eul(c, 'hips', -0.05, 0, 0);
  c.j.belly.s.set(1.1, 1.0, 1.04);
  pos(c, 'torso', 0, 0.045, 0.08); eul(c, 'torso', 0.05, 0, 0);
  eul(c, 'head', 0.05, 0.25 * noise1(t * 0.4, c.seed), 0);
  c.j.legL.s.set(1, 0.3, 1); c.j.legR.s.set(1, 0.3, 1);
  eul(c, 'tail', 0.1, 0, 0);
};

const CAT = {};
CAT.idle = (c) => {
  const t = c.t, br = Math.sin(TAU * t / 2.6);
  pos(c, 'hips', 0, 0.24, 0); c.j.belly.s.set(1, 1 + 0.012 * br, 1);
  eul(c, 'head', 0.03 * noise1(t * 0.3, c.seed + 1), 0.25 * noise1(t * 0.25, c.seed), 0.05 * noise1(t * 0.2, c.seed + 2));
  eul(c, 'tail1', -0.7, 0.3 * Math.sin(TAU * 0.5 * t), 0); eul(c, 'tail2', -0.5, 0.45 * Math.sin(TAU * 0.5 * t - 0.9), 0);
};
CAT.hop = (c) => {
  const p = c.p;
  const u = p.u !== undefined ? clamp(p.u, 0, 1) : (c.t % 1.3) / 1.3;
  const H = (p.height ?? 0.42);
  let y = 0.24, pitch = 0, legF = 0, legB = 0, sq = 1;
  if (u < 0.25) { const k = ease.inOutQuad(u / 0.25); y -= 0.07 * k; pitch = -0.12 * k; legF = 0.3 * k; legB = -0.5 * k; sq = 1 - 0.1 * k; }
  else if (u < 0.85) {
    const k = (u - 0.25) / 0.6;
    y += -0.07 * (1 - smooth(k / 0.15)) + H * Math.sin(PI * k);
    pitch = lerp(-0.35, 0.35, k); legF = lerp(-0.9, -0.3, k); legB = lerp(0.9, 0.5, k); sq = 1 + 0.12 * Math.sin(PI * k);
  } else { const k = (u - 0.85) / 0.15; y -= 0.06 * Math.sin(PI * k); pitch = 0.2 * (1 - k); legF = -0.2 * (1 - k); legB = 0.3 * (1 - k); sq = 1 - 0.1 * Math.sin(PI * k); }
  pos(c, 'hips', 0, y, 0); eul(c, 'hips', pitch, 0, 0); c.j.belly.s.set(1, 1 / Math.sqrt(sq), sq);
  eul(c, 'armL', legF, 0, 0); eul(c, 'armR', legF, 0, 0); eul(c, 'legL', legB, 0, 0); eul(c, 'legR', legB, 0, 0);
  eul(c, 'head', -pitch * 0.7, 0, 0);
  eul(c, 'tail1', -0.3 - pitch, 0, 0); eul(c, 'tail2', -0.2, 0, 0);
};
function catSit(c, pitch, lean = 0) {
  const sinP = Math.sin(pitch), cosP = Math.cos(pitch);
  // rear bottom corner rests on the floor
  const h = 0.2 * sinP + 0.095 * cosP + 0.005;
  pos(c, 'hips', 0, h, 0.03); eul(c, 'hips', -pitch, 0, 0);
  // front legs straight down: counter-rotate and stretch to reach the floor
  const fy = h + (-0.04 * cosP + 0.14 * sinP);
  const fl = fy / 0.2;
  for (const s of ['L', 'R']) { eul(c, 'arm' + s, pitch + lean * 0.3, 0, 0); c.j['arm' + s].s.set(1, fl, 1); }
  // back legs folded under the haunch
  eul(c, 'legL', -1.2 + pitch, 0, 0.05); eul(c, 'legR', -1.2 + pitch, 0, -0.05);
  c.j.legL.s.set(1, 0.85, 1); c.j.legR.s.set(1, 0.85, 1);
}
CAT.sit = (c) => {
  const t = c.t;
  catSit(c, 0.62);
  eul(c, 'head', 0.55 + 0.04 * noise1(t * 0.3, c.seed), 0.3 * noise1(t * 0.2, c.seed + 1), 0.05 * noise1(t * 0.25, c.seed + 3));
  eul(c, 'tail1', 0.9, 0.9, 0, 'YXZ'); eul(c, 'tail2', 0.1, 1.0 + 0.1 * Math.sin(TAU * 0.4 * t), 0, 'YXZ');
};
CAT.stare = (c) => {
  const t = c.t;
  catSit(c, 0.42, 0.3);
  eul(c, 'head', 0.25, 0, 0);
  const tw = Math.sin(TAU * 6 * t) * smooth(Math.sin(TAU * 0.35 * t));
  eul(c, 'tail1', 0.9, 0.7, 0, 'YXZ'); eul(c, 'tail2', 0.0, 0.9 + 0.35 * tw, 0, 'YXZ');
};
CAT.loaf = (c) => {
  const t = c.t, br = Math.sin(TAU * t / 3.0);
  pos(c, 'hips', 0, 0.1, 0); c.j.belly.s.set(1.06, 1 + 0.015 * br, 1);
  eul(c, 'armL', -1.45, 0, 0); eul(c, 'armR', -1.45, 0, 0);
  c.j.armL.s.set(1, 0.6, 1); c.j.armR.s.set(1, 0.6, 1);
  eul(c, 'legL', 1.45, 0, 0); eul(c, 'legR', 1.45, 0, 0);
  c.j.legL.s.set(1, 0.6, 1); c.j.legR.s.set(1, 0.6, 1);
  pos(c, 'torso', 0, 0.02, 0.16);
  eul(c, 'head', 0.12, 0.08 * noise1(t * 0.2, c.seed), 0);
  eul(c, 'tail1', 0.25, 1.15, 0, 'YXZ'); eul(c, 'tail2', 0.05, 0.9, 0, 'YXZ');
};

function buildPigeon(S) {
  const root = new THREE.Group(); root.name = 'creature:pigeon:' + S.id;
  const body = new THREE.Group(); body.scale.setScalar(S.scale ?? 1); root.add(body);
  const J = {};
  const mk = (name, parent, x, y, z) => { const o = new THREE.Bone(); o.name = name; o.position.set(x, y, z); parent.add(o); J[name] = o; return o; };
  const skin = new SkinCollector(); _collect = CHARACTER_OPTIONS.skinned ? skin : null;
  mk('hips', body, 0, 0.17, 0);
  mk('belly', J.hips, 0, 0, 0);
  mk('torso', J.hips, 0, 0.065, 0.085);
  mk('head', J.torso, 0, 0.075, 0.02);
  mk('jaw', J.head, 0, 0.032, 0.075);
  mk('armL', J.hips, 0.09, 0.045, 0.05); mk('armR', J.hips, -0.09, 0.045, 0.05);
  mk('legL', J.hips, 0.04, -0.07, 0.01); mk('legR', J.hips, -0.04, -0.07, 0.01);
  mk('tail', J.hips, 0, 0.035, -0.13);
  const bodyC = S.color ?? '#8f9db5', belly = shade(bodyC, 1.12), wingC = shade(bodyC, 1.1), bar = '#2f3442', headC = shade(bodyC, 0.9);
  let b = new Bag();
  b.add(rbox(0.18, 0.17, 0.27, 0.075, 3), bodyC, [0, 0, 0]);
  b.add(rbox(0.155, 0.13, 0.08, 0.055, 2), belly, [0, -0.012, 0.098]);
  b.build(J.belly);
  // iridescent neck (textured) — short and chunky, merging into the chest
  const neckTex = cachedTex('pigeonNeck' + bodyC, 64, 128, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, headC); gr.addColorStop(0.18, '#3fbf86'); gr.addColorStop(0.5, '#2fa37a');
    gr.addColorStop(0.78, '#9a5fd6'); gr.addColorStop(1, bodyC);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(0, 44, 64, 10);
  });
  const neck = new THREE.Mesh(rbox(0.135, 0.12, 0.125, 0.05, 2), mat2(neckTex));
  neck.position.set(0, 0.025, 0.0); neck.castShadow = true; J.torso.add(neck);
  b = new Bag();
  b.add(rbox(0.145, 0.135, 0.14, 0.06, 3), headC, [0, 0.06, 0.01]);
  b.add(rbox(0.046, 0.03, 0.066, 0.013), '#3b3b44', [0, 0.045, 0.098]);
  b.add(rbox(0.042, 0.022, 0.032, 0.01), '#e6e6ec', [0, 0.066, 0.085]);
  b.build(J.head);
  b = new Bag(); b.add(rbox(0.036, 0.016, 0.055, 0.007), '#4a4a52', [0, -0.006, 0.026]); b.build(J.jaw);
  const faceMat = makeFaceMaterial(pigeonFaceTexture('neutral', false));
  const face = new THREE.Mesh(plane(0.14, 0.14), faceMat); face.position.set(0, 0.067, 0.0815); J.head.add(face);
  for (const s of ['L', 'R']) {
    const sg = s === 'L' ? 1 : -1;
    b = new Bag();
    b.add(rbox(0.032, 0.125, 0.21, 0.015), wingC, [sg * 0.006, -0.032, -0.085], [0.12, 0, 0]);
    b.add(rbox(0.036, 0.1, 0.017, 0.006), bar, [sg * 0.006, -0.03, -0.07], [0.12, 0, 0]);
    b.add(rbox(0.036, 0.1, 0.017, 0.006), bar, [sg * 0.006, -0.036, -0.112], [0.12, 0, 0]);
    b.add(rbox(0.034, 0.095, 0.06, 0.014), shade(bodyC, 0.62), [sg * 0.006, -0.044, -0.162], [0.12, 0, 0]);
    b.build(J['arm' + s]);
    b = new Bag();
    b.add(rbox(0.024, 0.08, 0.024, 0.008), '#d4707a', [0, -0.045, 0]);
    for (const a of [-0.45, 0, 0.45]) b.add(rbox(0.016, 0.012, 0.055, 0.005), '#d4707a', [Math.sin(a) * 0.018, -0.088, Math.cos(a) * 0.022], [0, a, 0]);
    b.add(rbox(0.014, 0.012, 0.03, 0.005), '#d4707a', [0, -0.088, -0.016]);
    b.build(J['leg' + s]);
  }
  b = new Bag();
  b.add(rbox(0.13, 0.026, 0.14, 0.01), shade(bodyC, 0.82), [0, 0, -0.06], [-0.22, 0, 0]);
  b.add(rbox(0.132, 0.028, 0.035, 0.008), '#2c313d', [0, -0.03, -0.125], [-0.22, 0, 0]);
  b.build(J.tail);
  _collect = null;
  skin.build(body, PIGEON_JOINTS.map((n) => J[n]), true, 0.6, [0, 0.25, 0]);
  // party hat on the head
  const hat = makePartyHatMesh(S.partyHatColor ?? '#ff4fa3', 0.45);
  hat.position.set(0.012, 0.125, 0.0); hat.rotation.set(-0.1, 0, -0.22); hat.visible = false;
  J.head.add(hat);
  return { root, body, J, faceMat, hat };
}

function buildCat(S) {
  const root = new THREE.Group(); root.name = 'creature:cat:' + S.id;
  const body = new THREE.Group(); body.scale.setScalar(S.scale ?? 1); root.add(body);
  const J = {};
  const mk = (name, parent, x, y, z) => { const o = new THREE.Bone(); o.name = name; o.position.set(x, y, z); parent.add(o); J[name] = o; return o; };
  const skin = new SkinCollector(); _collect = CHARACTER_OPTIONS.skinned ? skin : null;
  mk('hips', body, 0, 0.24, 0);
  mk('belly', J.hips, 0, 0, 0);
  mk('torso', J.hips, 0, 0.04, 0.16);
  mk('head', J.torso, 0, 0.08, 0.06);
  mk('armL', J.hips, 0.065, -0.04, 0.14); mk('armR', J.hips, -0.065, -0.04, 0.14);
  mk('legL', J.hips, 0.065, -0.04, -0.14); mk('legR', J.hips, -0.065, -0.04, -0.14);
  mk('tail1', J.hips, 0, 0.05, -0.2); mk('tail2', J.tail1, 0, 0, -0.16);
  const base = S.color ?? '#f08a2c', stripe = shade(base, 0.72), white = '#fff3e3';
  const tabby = cachedTex('tabby' + base, 128, 128, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 128, 128);
    g.fillStyle = stripe;
    for (let i = 0; i < 5; i++) { g.beginPath(); const x = 8 + i * 26; g.moveTo(x, 0); g.lineTo(x + 12, 0); g.lineTo(x + 8 + 6 * Math.sin(i), 128); g.lineTo(x - 2 + 6 * Math.sin(i), 128); g.closePath(); g.fill(); }
  });
  const tm = mat2(tabby);
  const bodyMesh = new THREE.Mesh(rbox(0.2, 0.19, 0.42, 0.065, 2), tm); bodyMesh.castShadow = true; J.belly.add(bodyMesh);
  let b = new Bag();
  b.add(rbox(0.14, 0.1, 0.06, 0.03), white, [0, -0.04, 0.186]);
  b.build(J.belly);
  const headMesh = new THREE.Mesh(rbox(0.23, 0.19, 0.18, 0.065, 2), tm); headMesh.castShadow = true; headMesh.position.set(0, 0.04, 0.03); J.head.add(headMesh);
  b = new Bag();
  for (const sx of [-1, 1]) {
    b.add(cone(0.055, 0.09, 4), base, [sx * 0.07, 0.165, 0.0], [0, PI / 4, sx * -0.12], [1, 1, 0.6], 'vc', true);
    b.add(cone(0.032, 0.055, 4), '#ff9fb0', [sx * 0.07, 0.16, 0.022], [0, PI / 4, sx * -0.12], [1, 1, 0.3], 'vc', true);
  }
  b.build(J.head);
  const faceMat = makeFaceMaterial(catFaceTexture('neutral', false));
  const face = new THREE.Mesh(plane(0.21, 0.21), faceMat); face.position.set(0, 0.035, 0.123); J.head.add(face);
  for (const s of ['L', 'R']) {
    b = new Bag();
    b.add(rbox(0.07, 0.18, 0.075, 0.025), base, [0, -0.08, 0]);
    b.add(rbox(0.078, 0.042, 0.09, 0.018), white, [0, -0.179, 0.008]);
    b.build(J['arm' + s]);
    b = new Bag();
    b.add(rbox(0.08, 0.13, 0.11, 0.035), base, [0, -0.04, 0.0]);
    b.add(rbox(0.068, 0.12, 0.07, 0.025), base, [0, -0.12, 0.0]);
    b.add(rbox(0.078, 0.042, 0.09, 0.018), white, [0, -0.179, 0.01]);
    b.build(J['leg' + s]);
  }
  b = new Bag(); b.add(rbox(0.055, 0.055, 0.18, 0.025), base, [0, 0, -0.08]); b.build(J.tail1);
  b = new Bag(); b.add(rbox(0.05, 0.05, 0.16, 0.022), base, [0, 0, -0.07]); b.add(rbox(0.052, 0.052, 0.05, 0.022), stripe, [0, 0, -0.14]); b.build(J.tail2);
  _collect = null;
  skin.build(body, CAT_JOINTS.map((n) => J[n]), true, 0.8, [0, 0.3, 0]);
  const hat = makePartyHatMesh(S.partyHatColor ?? '#ff4fa3', 0.55);
  hat.position.set(0.0, 0.13, 0.02); hat.rotation.set(-0.05, 0, 0.15); hat.visible = false;
  J.head.add(hat);
  return { root, body, J, faceMat, hat };
}

const _mat2 = new Map();
function mat2(tex) {
  let m = _mat2.get(tex.uuid);
  if (!m) { m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }); _mat2.set(tex.uuid, m); }
  return m;
}

export function makeCreature(kind = 'pigeon', spec = {}) {
  const S = Object.assign({ id: kind, scale: 1, accessories: [], partyHatColor: '#ff4fa3' }, spec);
  const isPigeon = kind !== 'cat';
  const built = isPigeon ? buildPigeon(S) : buildCat(S);
  const { root, body, J, faceMat, hat } = built;
  const names = isPigeon ? PIGEON_JOINTS : CAT_JOINTS;
  const rest = makeRec(names);
  for (const n of names) { rest.j[n].p.copy(J[n].position); rest.j[n].q.copy(J[n].quaternion); }
  const recA = makeRec(names), recB = makeRec(names), recM = makeRec(names);
  const seed = seedOf(S.id + kind);
  const blinkPhase = hash(seed * 1.91) * 3.1;
  const ACT = isPigeon ? PIGEON : CAT;
  let faceBeak = 0;
  root.traverse((o) => { if (o.isMesh && o.material !== faceMat) { o.castShadow = true; o.receiveShadow = true; } });
  const compute = (rec, action, t, params) => {
    copyRec(rec, rest);
    const c = { ch, rec, j: rec.j, x: rec.x, p: params, t: t * (params.speed ?? 1), I: params.intensity ?? 1, seed };
    if (isPigeon) pigeonBase(c);
    (ACT[action] || ACT.idle)(c);
    if (params.lookAt) {   // replace the head's yaw/pitch with a look toward a world point (clamped)
      root.updateWorldMatrix(true, false);
      _m1.copy(root.matrixWorld).multiply(body.matrix.compose(body.position, body.quaternion, body.scale));
      _m2.compose(rec.j.hips.p, rec.j.hips.q, rec.j.hips.s); _m1.multiply(_m2);
      _m2.compose(rec.j.torso.p, rec.j.torso.q, _v1.set(1, 1, 1)); _m1.multiply(_m2);
      const L = _v2.copy(params.lookAt).applyMatrix4(_m1.invert()).sub(_v3.copy(rec.j.head.p).add(_v4.set(0, 0.05, 0)));
      let yaw = Math.atan2(L.x, L.z); if (Math.abs(yaw) > 2.4) yaw = 0;
      rec.j.head.q.setFromEuler(_e1.set(clamp(-Math.atan2(L.y, Math.hypot(L.x, L.z)), -0.8, 0.9), clamp(yaw, -1.3, 1.3), 0, 'YXZ'));
    }
    if (params.headYaw || params.headPitch) {
      _q1.setFromEuler(_e1.set(params.headPitch ?? 0, params.headYaw ?? 0, 0, 'YXZ'));
      rec.j.head.q.multiply(_q1);
    }
  };
  const apply = (rec) => {
    for (const n of names) { const o = J[n], r = rec.j[n]; o.position.copy(r.p); o.quaternion.copy(r.q); o.scale.copy(r.s); }
    if (isPigeon) {
      ch._poseBeak = rec.x.beak || 0;
      J.jaw.rotation.x = 0.75 * Math.max(ch._poseBeak, faceBeak);
      const wo = rec.x.wingOpen || 0;
      J.armL.scale.y *= 1 + 0.7 * wo; J.armR.scale.y *= 1 + 0.7 * wo;
    }
  };
  const ch = {
    id: S.id, root, body, joints: J, kind, spec: S, expression: 'neutral', _poseBeak: 0, blinkPhase,
    pose(action, t = 0, params = {}) { compute(recA, action, t, params); apply(recA); return ch; },
    poseMix(a, ta, pa, b2, tb, pb, w) { compute(recA, a, ta, pa || {}); compute(recB, b2, tb, pb || {}); mixRec(recM, recA, recB, clamp(w, 0, 1)); apply(recM); return ch; },
    face(expr = 'neutral', t = 0) {
      ch.expression = expr;
      const bl = isBlinking(t, blinkPhase, isPigeon ? 2.7 : 3.4, 0.12);
      faceMat.map = isPigeon ? pigeonFaceTexture(expr, bl) : catFaceTexture(expr, bl);
      if (isPigeon) { faceBeak = PIGEON_BEAK[expr] || 0; J.jaw.rotation.x = 0.75 * Math.max(ch._poseBeak, faceBeak); }
      return ch;
    },
    setAccessory(name, on = true) { if (name === 'partyHat') hat.visible = !!on; return ch; },
    setPartyHatColor(hex) { const c = hat.getObjectByName('partyHatCone'); if (c) c.material = partyHatMaterial(hex); return ch; },
    dispose() {
      root.traverse((o) => {
        if (o.isMesh && o.geometry && o.geometry.userData.owned) o.geometry.dispose();
        if (o.isSkinnedMesh && o.skeleton) o.skeleton.dispose();
      });
      faceMat.dispose();
      if (root.parent) root.parent.remove(root);
    },
  };
  if ((S.accessories || []).includes('partyHat')) hat.visible = true;
  if (S.partyHatColor && S.partyHatColor !== '#ff4fa3') ch.setPartyHatColor(S.partyHatColor);
  ch.pose('idle', 0); ch.face('neutral', 0);
  return ch;
}
