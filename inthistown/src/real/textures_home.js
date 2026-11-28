/*
 * src/real/textures_home.js — deterministic procedural PBR texture sets for INTERIORS / houses (home kit, look v2).
 * Additive companion of textures.js (same PBRSet shape, same plumbing, nothing in textures.js changed).
 *
 * ─── API ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   getHomePBR(name, opts?) → PBRSet   (cached by name + JSON(opts); generated on first use from seeded noise, no clocks)
 *     PBRSet = { name, size:[w,h], map (sRGB), normalMap, roughnessMap (R = AO, G = roughness, B = height), data,
 *                height: Float32Array, repeat(rx, ry) → clone with repeated textures (shares GPU images) }
 *     The albedo of the "paintable" sets is near-white so material.color tints it (wall paint, door colour, tile colour):
 *       'plaster'     smooth painted plaster: faint trowel clouds, roller stipple, hairline cracks          (512², tint)
 *       'paintwood'   painted wood (doors, trim, cabinets): brush streaks along U, a few dents             (256², tint)
 *       'tile'        square ceramic tiles, 4 × 4 per repeat, recessed grout, slight per-tile shade          (512², tint)
 *                     opts { checker: ['#hexA', '#hexB'] } bakes a two-colour checkerboard (then use white tint)
 *       'carpet'      cut-pile carpet / rug (fuzzy, high roughness)                                          (256², tint)
 *       'siding'      exterior clapboard: 6 overlapping boards per repeat along V, grain                     (512², tint)
 *     Coloured sets (use with color '#ffffff'):
 *       'floorboards' honey-oak floor boards: 4 boards across U, staggered butt joints along V, grain, gaps  (1024×512)
 *       'brick'       red-brown brick in running bond, 8 courses per repeat, mortar recessed                 (512²)
 *       'shingle'     roof shingles (dark slate-brown tabs, staggered rows)                                  (512²)
 *       'coir'        doormat coir weave                                                                      (256²)
 *       'oak'         plain wood grain (furniture, tables, frames)                                            (512²)
 *   HOME_PBR_NAMES  list of names.
 *   Texture coordinates are expected in METRES / tile size (see home.js box UVs): one repeat of each set covers
 *   'plaster' 2 m, 'paintwood' 1 m, 'tile' 1.2 m (0.3 m tiles), 'carpet' 1 m, 'siding' 1.2 m (0.2 m boards),
 *   'floorboards' 1.2 × 2.4 m (0.3 m boards), 'brick' 1.0 m, 'shingle' 1.5 m, 'coir' 0.5 m, 'oak' 1 m
 *   (exported as HOME_TILE = { name: [u metres, v metres] }).
 * Cost: all sets together generate in ≈1–2 s on first use (pure JS loops), cached for the life of the page.
 */
import * as THREE from 'three';
import { rng, clamp, lerp } from '../lib/util.js';
import { makePerlin, fbm, ridged, makeWorley, makeDataTexture, heightToNormal } from './textures.js';

export const HOME_TILE = {
  plaster: [2, 2], paintwood: [1, 1], tile: [1.2, 1.2], carpet: [1, 1], siding: [1.2, 1.2],
  floorboards: [1.2, 2.4], brick: [1.0, 1.0], shingle: [1.5, 1.5], coir: [0.5, 0.5], oak: [1, 1],
};

const srgbByte = (v) => clamp(Math.round(v * 255), 0, 255);
function mix3(a, b, u) { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
function hex3(h) { const c = new THREE.Color(h); return [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2)); }
function put(A, i, c, k = 1) { A[i * 4] = srgbByte(c[0] * k); A[i * 4 + 1] = srgbByte(c[1] * k); A[i * 4 + 2] = srgbByte(c[2] * k); A[i * 4 + 3] = 255; }

function finish(name, w, h, albedo, H, rough, ao, { normalStrength = 2 } = {}) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = srgbByte(ao ? ao[i] : 1); data[i * 4 + 1] = srgbByte(rough[i]); data[i * 4 + 2] = srgbByte(H[i]); data[i * 4 + 3] = 255;
  }
  const set = {
    name, size: [w, h], alpha: false, height: H,
    map: makeDataTexture(albedo, w, h, { srgb: true }),
    normalMap: makeDataTexture(heightToNormal(H, w, h, normalStrength, true), w, h, {}),
    roughnessMap: makeDataTexture(data, w, h, {}),
  };
  set.data = set.roughnessMap;
  set.repeat = (rx = 1, ry = rx) => {
    const c = { ...set };
    for (const k of ['map', 'normalMap', 'roughnessMap']) { c[k] = set[k].clone(); c[k].repeat.set(rx, ry); c[k].needsUpdate = true; }
    c.data = c.roughnessMap;
    return c;
  };
  return set;
}
function alloc(w, h) { return { A: new Uint8Array(w * h * 4), H: new Float32Array(w * h), R: new Float32Array(w * h), AO: new Float32Array(w * h) }; }

const GEN = {};

GEN.plaster = ({ seed = 201, size = 512 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), N2 = makePerlin(seed + 3), Wc = makeWorley(seed, 7);
  const { A, H, R, AO } = alloc(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const cloud = fbm(N, u * 4, v * 4, 4, 4);
    const stip = fbm(N2, u * 96, v * 96, 2, 96);
    const [f1, f2] = Wc(u + cloud * 0.03, v + cloud * 0.03);
    const crack = clamp(1 - (f2 - f1) * 60, 0, 1) * clamp(fbm(N, u * 3 + 5, v * 3, 2, 3) * 3 - 0.8, 0, 1);
    H[i] = clamp(0.5 + cloud * 0.25 + stip * 0.12 - crack * 0.3, 0, 1);
    const k = 0.93 + cloud * 0.04 + stip * 0.015 - crack * 0.12;
    put(A, i, [k, k * 0.995, k * 0.985]);
    R[i] = clamp(0.82 + stip * 0.08 - cloud * 0.05, 0, 1);
    AO[i] = clamp(1 - crack * 0.5, 0, 1);
  }
  return finish('plaster', w, h, A, H, R, AO, { normalStrength: 0.9 });
};

GEN.paintwood = ({ seed = 211, size = 256 } = {}) => {
  const w = size, h = size, N = makePerlin(seed);
  const { A, H, R, AO } = alloc(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const brush = fbm(N, u * 2, v * 48, 3, 2, 2, 0.5, 48);      // streaks along U
    const grain = fbm(N, u * 6 + 3, v * 20, 3, 6, 2, 0.5, 20);
    const dent = clamp(fbm(N, u * 10 + 7, v * 10, 2, 10) * 4 - 2.6, 0, 1);
    H[i] = clamp(0.55 + brush * 0.12 + grain * 0.08 - dent * 0.3, 0, 1);
    const k = 0.95 + brush * 0.03 + grain * 0.02 - dent * 0.08;
    put(A, i, [k, k, k]);
    R[i] = clamp(0.48 + brush * 0.1 + dent * 0.15, 0, 1);
    AO[i] = 1 - dent * 0.3;
  }
  return finish('paintwood', w, h, A, H, R, AO, { normalStrength: 0.8 });
};

GEN.tile = ({ seed = 221, size = 512, n = 4, checker = null } = {}) => {
  const w = size, h = size, N = makePerlin(seed), r = rng(seed);
  const ck = checker ? checker.map(hex3) : null;
  const shade = []; for (let k = 0; k < n * n; k++) shade.push(0.94 + r() * 0.08);
  const { A, H, R, AO } = alloc(w, h);
  const grout = 0.035;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const fu = (u * n) % 1, fv = (v * n) % 1;
    const tx = Math.floor(u * n), ty = Math.floor(v * n);
    const e = Math.min(fu, 1 - fu, fv, 1 - fv);
    const g = clamp(1 - e / grout, 0, 1);                    // 1 in the grout
    const bev = clamp(1 - (e - grout) / 0.03, 0, 1) * (1 - g); // rounded tile edge
    const glaze = fbm(N, u * 16, v * 16, 3, 16) * 0.5 + 0.5;
    H[i] = clamp(g > 0.5 ? 0.15 : 0.85 - bev * 0.35 + glaze * 0.04, 0, 1);
    const s = shade[ty * n + tx];
    const base = ck ? ck[(tx + ty) % 2] : [1, 0.995, 0.98];
    const c = g > 0.5 ? [0.72, 0.7, 0.66] : [s * base[0], s * base[1], s * base[2]];
    put(A, i, c, 1 - (g > 0.5 ? 0 : bev * 0.05));
    R[i] = g > 0.5 ? 0.9 : clamp(0.16 + glaze * 0.08, 0, 1);
    AO[i] = g > 0.5 ? 0.55 : 1 - bev * 0.2;
  }
  return finish('tile', w, h, A, H, R, AO, { normalStrength: 2.4 });
};

GEN.carpet = ({ seed = 231, size = 256 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), N2 = makePerlin(seed + 9);
  const { A, H, R, AO } = alloc(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const tuft = fbm(N, u * 64, v * 64, 3, 64) * 0.5 + 0.5;
    const tuft2 = fbm(N2, u * 128, v * 128, 2, 128) * 0.5 + 0.5;
    const wear = fbm(N, u * 3 + 2, v * 3, 3, 3);
    H[i] = clamp(tuft * 0.7 + tuft2 * 0.3, 0, 1);
    const k = 0.82 + tuft * 0.16 + tuft2 * 0.06 + wear * 0.04;
    put(A, i, [k, k, k]);
    R[i] = 0.95; AO[i] = clamp(0.6 + tuft * 0.4, 0, 1);
  }
  return finish('carpet', w, h, A, H, R, AO, { normalStrength: 2.2 });
};

GEN.siding = ({ seed = 241, size = 512, boards = 6 } = {}) => {
  const w = size, h = size, N = makePerlin(seed);
  const { A, H, R, AO } = alloc(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const fv = (v * boards) % 1;                      // 0 at the bottom edge of a board (overlap), 1 at its top
    const lap = fv < 0.06 ? fv / 0.06 : 1;           // shadowed lip under the board above
    const grain = fbm(N, u * 3, v * 60, 3, 3, 2, 0.5, 60);
    H[i] = clamp(0.25 + fv * 0.55 + grain * 0.06, 0, 1) * (0.4 + 0.6 * lap);
    const k = 0.93 + grain * 0.04 - (1 - lap) * 0.25;
    put(A, i, [k, k, k]);
    R[i] = clamp(0.62 + grain * 0.1, 0, 1); AO[i] = 0.55 + 0.45 * lap;
  }
  return finish('siding', w, h, A, H, R, AO, { normalStrength: 2.6 });
};

GEN.floorboards = ({ seed = 251 } = {}) => {
  const w = 1024, h = 512, N = makePerlin(seed), N2 = makePerlin(seed + 1), r = rng(seed);
  // U across boards (4 boards), V along the boards (1 m → 512 px … tile is 1.2 × 2.4 m so V spans 2 board lengths)
  const nb = 4;
  const joints = [], tones = [];
  for (let b = 0; b < nb; b++) { joints.push(r()); tones.push([0.86 + r() * 0.22, r()]); }
  const { A, H, R, AO } = alloc(w, h);
  const light = hex3('#c99a62'), dark = hex3('#8a5a32'), ring = hex3('#6e4423');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const bu = u * nb, b = Math.floor(bu), fu = bu - b;
    // butt joints: each board has 2 joints per repeat (lengths 1.2 m), staggered per board
    const jv = (v * 2 + joints[b]) % 1;
    const seamU = Math.min(fu, 1 - fu), seamV = Math.min(jv, 1 - jv);
    const gapU = clamp(1 - seamU / 0.012, 0, 1), gapV = clamp(1 - seamV / 0.006, 0, 1);
    const seg = Math.floor(v * 2 + joints[b]);
    const sseed = b * 7.3 + seg * 3.1;
    const warp = fbm(N2, fu * 2 + sseed, v * 3, 2, 2 + 0, 2, 0.5, 3) * 0.6;
    const g = Math.sin((fu * 7 + warp * 3 + sseed) * Math.PI * 2) * 0.5 + 0.5;            // long grain lines along V
    const fine = fbm(N, u * 160, v * 12, 2, 160, 2, 0.5, 12) * 0.5 + 0.5;
    const knot = clamp(1 - Math.hypot((fu - 0.5) * 3, ((v * 2 + joints[b] * 3 + sseed) % 1 - 0.5) * 6) * 1.2, 0, 1);
    let c = mix3(light, dark, clamp(g * 0.35 + fine * 0.35 + tones[b][1] * 0.3, 0, 1));
    c = mix3(c, ring, knot * 0.5 + Math.pow(g, 6) * 0.2);
    const k = tones[b][0];
    const gap = Math.max(gapU, gapV);
    H[i] = clamp(0.6 + fine * 0.15 - g * 0.05 - gap * 0.6, 0, 1);
    put(A, i, mix3(c.map((q) => q * k), [0.12, 0.08, 0.05], gap * 0.85));
    R[i] = clamp(0.38 + fine * 0.18 + gap * 0.4, 0, 1);
    AO[i] = 1 - gap * 0.6;
  }
  return finish('floorboards', w, h, A, H, R, AO, { normalStrength: 1.6 });
};

GEN.brick = ({ seed = 261, size = 512, courses = 8 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), r = rng(seed);
  const per = courses * 4;
  const tone = []; for (let k = 0; k < per; k++) tone.push([r(), r()]);
  const { A, H, R, AO } = alloc(w, h);
  const b0 = hex3('#9a4a32'), b1 = hex3('#b8664a'), b2 = hex3('#6e3424'), mortar = hex3('#bdb3a3');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const row = Math.floor(v * courses), fv = v * courses - row;
    const off = row % 2 ? 0.5 : 0;
    const bu = u * 4 + off, col = Math.floor(bu), fu = bu - col;
    const e = Math.min(fu * 2, (1 - fu) * 2, fv, 1 - fv) ;     // bricks are 2:1
    const m = clamp(1 - e / 0.09, 0, 1);
    const id = (row * 4 + ((col % 4) + 4) % 4) % per;
    const n1 = fbm(N, u * 24, v * 24, 3, 24) * 0.5 + 0.5;
    let c = mix3(mix3(b0, b1, tone[id][0]), b2, tone[id][1] * 0.4 + n1 * 0.25);
    c = mix3(c, mortar, m);
    H[i] = clamp(m > 0.5 ? 0.2 : 0.75 + n1 * 0.2, 0, 1);
    put(A, i, c);
    R[i] = clamp(0.82 + n1 * 0.1, 0, 1); AO[i] = m > 0.5 ? 0.6 : 1;
  }
  return finish('brick', w, h, A, H, R, AO, { normalStrength: 2.4 });
};

GEN.shingle = ({ seed = 271, size = 512, rows = 8 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), r = rng(seed);
  const tone = []; for (let k = 0; k < rows * 6; k++) tone.push(r());
  const { A, H, R, AO } = alloc(w, h);
  const s0 = hex3('#4b3a35'), s1 = hex3('#5e4a40'), s2 = hex3('#33282a');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const row = Math.floor(v * rows), fv = v * rows - row;
    const off = row % 2 ? 0.5 : 0;
    const bu = u * 6 + off, col = Math.floor(bu), fu = bu - col;
    const edge = Math.min(fu, 1 - fu);
    const slot = clamp(1 - edge / 0.03, 0, 1);
    const n1 = fbm(N, u * 40, v * 40, 3, 40) * 0.5 + 0.5;
    const id = (row * 6 + ((col % 6) + 6) % 6) % tone.length;
    let c = mix3(mix3(s0, s1, tone[id]), s2, (1 - fv) * 0.5 + slot * 0.7);
    H[i] = clamp(fv * 0.8 + n1 * 0.15 - slot * 0.4, 0, 1);
    put(A, i, c, 0.9 + n1 * 0.15);
    R[i] = 0.85; AO[i] = clamp(0.5 + fv * 0.5 - slot * 0.3, 0, 1);
  }
  return finish('shingle', w, h, A, H, R, AO, { normalStrength: 2.4 });
};

GEN.coir = ({ seed = 281, size = 256 } = {}) => {
  const w = size, h = size, N = makePerlin(seed);
  const { A, H, R, AO } = alloc(w, h);
  const c0 = hex3('#8c6a3c'), c1 = hex3('#b08a52');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const cu = (u * 24) % 1, cv = (v * 24) % 1;
    const over = (Math.floor(u * 24) + Math.floor(v * 24)) % 2;
    const ht = over ? Math.sin(cu * Math.PI) : Math.sin(cv * Math.PI);
    const fib = fbm(N, u * 90, v * 90, 3, 90) * 0.5 + 0.5;
    H[i] = clamp(ht * 0.7 + fib * 0.3, 0, 1);
    put(A, i, mix3(c0, c1, fib * 0.7 + ht * 0.3));
    R[i] = 0.95; AO[i] = clamp(0.5 + ht * 0.5, 0, 1);
  }
  return finish('coir', w, h, A, H, R, AO, { normalStrength: 2.6 });
};

GEN.oak = ({ seed = 291, size = 512 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), N2 = makePerlin(seed + 2);
  const { A, H, R, AO } = alloc(w, h);
  const l = hex3('#b07d4c'), d = hex3('#7a4d2a');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const warp = fbm(N2, u * 2, v * 2, 3, 2) * 0.8;
    const g = Math.sin((u * 9 + warp) * Math.PI * 2) * 0.5 + 0.5;
    const fine = fbm(N, u * 120, v * 8, 2, 120, 2, 0.5, 8) * 0.5 + 0.5;
    H[i] = clamp(0.5 + fine * 0.2 - Math.pow(g, 4) * 0.1, 0, 1);
    put(A, i, mix3(l, d, clamp(g * 0.5 + fine * 0.35, 0, 1)));
    R[i] = clamp(0.45 + fine * 0.2, 0, 1); AO[i] = 1;
  }
  return finish('oak', w, h, A, H, R, AO, { normalStrength: 1.0 });
};

const _cache = new Map();
export function getHomePBR(name, opts = {}) {
  const key = name + JSON.stringify(opts);
  let s = _cache.get(key);
  if (!s) {
    if (!GEN[name]) throw new Error(`textures_home.getHomePBR: unknown texture "${name}" (have ${Object.keys(GEN).join(', ')})`);
    s = GEN[name](opts);
    _cache.set(key, s);
  }
  return s;
}
export const HOME_PBR_NAMES = Object.keys(GEN);
