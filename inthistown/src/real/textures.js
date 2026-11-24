/*
 * src/real/textures.js — deterministic procedural PBR textures (no image files) for the photoreal kit.
 *
 * Everything is generated on the CPU from seeded noise (or seeded canvas drawing) the first time it is requested and
 * cached for the life of the page. Same name + options → same pixels, always (no Math.random, no clocks).
 *
 * ─── Main API ──────────────────────────────────────────────────────────────────────────────────────────────────────
 *   getPBR(name, opts?) → PBRSet   (cached by name + JSON(opts))
 *     PBRSet = { name, size:[w,h], map, normalMap, roughnessMap, data, height:Float32Array, alpha?:bool,
 *                repeat(rx, ry) → PBRSet clone whose textures share the GPU image but repeat rx×ry }
 *       map           sRGB albedo (RGBA; A = cut-out alpha for leaf / fern / palm / vine)
 *       normalMap     tangent-space normal map (Sobel of the height field, OpenGL convention, wraps when tileable)
 *       roughnessMap  linear; roughness in G (three reads .g), AO in R, height in B (handy for parallax / triplanar)
 *       data          same texture object as roughnessMap (R = ao, G = roughness, B = height) — used by triplanar shaders
 *     names (tileable unless noted):
 *       'bark'     dark fissured tropical bark with lichen + moss in the cracks        (512²)
 *       'mud'      rainforest floor: dark mud + dense leaf litter + twigs                (1024²)
 *       'rock'     wet volcanic rock: cracks, pits, strata                               (512²)
 *       'sand'     grey beach sand: grain, wind ripples, shell grit                      (512²)
 *       'planks'   weathered driftwood planks (4 per tile, seams, nail holes)            (512²)
 *       'fabric'   knit / fleece weave (hoodie)                                          (256²)
 *       'denim'    twill weave (pants)                                                    (256²)
 *       'leaf'     single broad tropical leaf, alpha cut-out (NOT tileable)               (256×512)
 *       'leaves'   a twig with ~9 broad leaves, alpha (canopy card)                      (512²)
 *       'fern'     one fern frond, alpha (NOT tileable, frond along +V)                  (256×1024)
 *       'palm'     one palm frond (long drooping leaflets), alpha                         (256×1024)
 *       'foam'     sea-foam lace (map = white, alpha = foam coverage)                    (512²)
 *       'moss'     moss / lichen clumps                                                   (256²)
 *   getNoiseTex(seed = 1, size = 256) → THREE.DataTexture, tileable, linear, 4 independent FBM channels (RGBA), mipmapped,
 *     RepeatWrapping. For shaders: fog wisps, flame turbulence, clouds, ripples.
 *   getCloudTex(seed = 7, size = 1024) → DataTexture (R = big cloud masses, G = detail, B = wispy streaks, A = 255), tileable.
 *   getOceanNormalTex(seed = 3, size = 512) → DataTexture normal map (tileable) of small wind waves for water shaders.
 *   getRippleTex(size = 256) → DataTexture: R = ring profile lookup for rain-ripple normals (see materials.js puddles).
 *
 * ─── Low-level helpers (exported for custom textures) ──────────────────────────────────────────────────────────────
 *   makePerlin(seed) → (x, y, period) → [-1, 1]   periodic gradient noise (period = integer lattice size, ≤ 256)
 *   fbm(noise, x, y, octaves, period, lacunarity = 2, gain = 0.5)
 *   ridged(noise, x, y, octaves, period)          1 − |n| ridges, squared
 *   makeWorley(seed, cells) → (u, v) → [F1, F2]    periodic cellular noise on the unit square
 *   heightToNormal(height, w, h, strength, wrap = true) → Uint8Array RGBA normal map
 *   makeDataTexture(rgba, w, h, { srgb, wrap, mips }) → THREE.DataTexture
 *
 * Performance: the whole default set generates in ≈1.5–3 s on first use (pure JS loops), then costs nothing.
 */
import * as THREE from 'three';
import { rng, clamp, lerp } from '../lib/util.js';

// ═════════════════════════════════════════════ noise ══════════════════════════════════════════════════════════════
export function makePerlin(seed = 1) {
  const r = rng(seed * 7.13 + 1);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  const gx = new Float32Array(256), gy = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const a = r() * Math.PI * 2; gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
  return function perlin(x, y, per = 256) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const X0 = ((xi % per) + per) % per, Y0 = ((yi % per) + per) % per;
    const X1 = (X0 + 1) % per, Y1 = (Y0 + 1) % per;
    const h00 = p[(p[X0 & 255] + Y0) & 255], h10 = p[(p[X1 & 255] + Y0) & 255];
    const h01 = p[(p[X0 & 255] + Y1) & 255], h11 = p[(p[X1 & 255] + Y1) & 255];
    const d00 = gx[h00] * xf + gy[h00] * yf;
    const d10 = gx[h10] * (xf - 1) + gy[h10] * yf;
    const d01 = gx[h01] * xf + gy[h01] * (yf - 1);
    const d11 = gx[h11] * (xf - 1) + gy[h11] * (yf - 1);
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const a = d00 + (d10 - d00) * u, b = d01 + (d11 - d01) * u;
    return (a + (b - a) * v) * 1.41;
  };
}
export function fbm(n, x, y, oct, per, lac = 2, gain = 0.5) {
  let s = 0, a = 1, f = 1, norm = 0;
  for (let o = 0; o < oct; o++) { s += a * n(x * f, y * f, Math.max(1, Math.round(per * f))); norm += a; a *= gain; f *= lac; }
  return s / norm;
}
export function ridged(n, x, y, oct, per) {
  let s = 0, a = 1, f = 1, norm = 0;
  for (let o = 0; o < oct; o++) { const v = 1 - Math.abs(n(x * f, y * f, Math.max(1, Math.round(per * f)))); s += a * v * v; norm += a; a *= 0.5; f *= 2; }
  return s / norm;
}
export function makeWorley(seed, cells) {
  const r = rng(seed * 3.7 + 5);
  const px = new Float32Array(cells * cells), py = new Float32Array(cells * cells);
  for (let i = 0; i < cells * cells; i++) { px[i] = r(); py[i] = r(); }
  return function worley(u, v) {
    const x = u * cells, y = v * cells;
    const ci = Math.floor(x), cj = Math.floor(y);
    let f1 = 9, f2 = 9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const i = ci + di, j = cj + dj;
      const wi = ((i % cells) + cells) % cells, wj = ((j % cells) + cells) % cells;
      const k = wj * cells + wi;
      const dx = i + px[k] - x, dy = j + py[k] - y;
      const d = dx * dx + dy * dy;
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    return [Math.sqrt(f1), Math.sqrt(f2)];
  };
}

// ═════════════════════════════════════════════ texture plumbing ══════════════════════════════════════════════════
export function makeDataTexture(rgba, w, h, { srgb = false, wrap = true, mips = true } = {}) {
  const t = new THREE.DataTexture(rgba, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.generateMipmaps = mips;
  t.anisotropy = 4;
  t.flipY = false;
  t.needsUpdate = true;
  return t;
}
export function heightToNormal(H, w, h, strength = 2, wrap = true) {
  const out = new Uint8Array(w * h * 4);
  const at = (x, y) => {
    if (wrap) { x = (x + w) % w; y = (y + h) % h; } else { x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1); }
    return H[y * w + x];
  };
  const s = strength * Math.max(w, h) / 256;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
    const l = at(x - 1, y), r = at(x + 1, y);
    const bl = at(x - 1, y + 1), b = at(x, y + 1), br = at(x + 1, y + 1);
    const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
    const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
    // texture v grows downward in memory (flipY false + UV v up → row 0 is v=0): +dy means height grows with v
    let nx = -dx * s, ny = -dy * s, nz = 1;
    const il = 1 / Math.hypot(nx, ny, nz); nx *= il; ny *= il; nz *= il;
    const i = (y * w + x) * 4;
    out[i] = (nx * 0.5 + 0.5) * 255; out[i + 1] = (ny * 0.5 + 0.5) * 255; out[i + 2] = (nz * 0.5 + 0.5) * 255; out[i + 3] = 255;
  }
  return out;
}
// read a canvas back to RGBA bytes (canvas rasterisation is deterministic for a given Chromium build)
function canvasBytes(c) { return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const srgbByte = (v) => clamp(Math.round(v * 255), 0, 255);

function finish(name, w, h, albedo, H, rough, ao, { normalStrength = 2, wrap = true, alpha = false } = {}) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = srgbByte(ao ? ao[i] : 1);
    data[i * 4 + 1] = srgbByte(rough[i]);
    data[i * 4 + 2] = srgbByte(H[i]);
    data[i * 4 + 3] = 255;
  }
  const set = {
    name, size: [w, h], alpha, height: H,
    map: makeDataTexture(albedo, w, h, { srgb: true, wrap }),
    normalMap: makeDataTexture(heightToNormal(H, w, h, normalStrength, wrap), w, h, { wrap }),
    roughnessMap: makeDataTexture(data, w, h, { wrap }),
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

// colour helpers (albedo authored in sRGB 0..1)
function mix3(a, b, u) { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
function hex3(h) { const c = new THREE.Color(h); return [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2)); }

// ═════════════════════════════════════════════ generators ═════════════════════════════════════════════════════════
const GEN = {};

GEN.bark = ({ seed = 11, size = 512 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), N2 = makePerlin(seed + 1);
  const A = new Uint8Array(w * h * 4), H = new Float32Array(w * h), R = new Float32Array(w * h), AO = new Float32Array(w * h);
  const base = hex3('#3a332c'), dark = hex3('#14110e'), lichen = hex3('#8d917f'), moss = hex3('#2f3a1e');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    const warp = fbm(N2, u * 4, v * 2, 3, 4) * 0.35;
    // vertical fissures: ridged noise strongly stretched along v
    const fis = ridged(N, (u + warp * 0.12) * 10, v * 1.5, 4, 10);
    const plates = fbm(N, u * 6, v * 3, 4, 6);
    const fine = fbm(N2, u * 48, v * 24, 3, 48);
    let ht = 0.55 * fis + 0.25 * (plates * 0.5 + 0.5) + 0.12 * (fine * 0.5 + 0.5);
    const crack = clamp((0.62 - fis) * 3, 0, 1);
    ht -= crack * 0.25;
    const i = y * w + x;
    H[i] = clamp(ht, 0, 1);
    let c = mix3(base, dark, crack * 0.85 + clamp(-plates, 0, 1) * 0.3);
    const lm = clamp((fbm(N2, u * 3 + 9, v * 3, 4, 3) - 0.18) * 3.5, 0, 1) * (1 - crack);
    c = mix3(c, lichen, lm * 0.55 * (0.7 + 0.3 * fine));
    const mm = clamp(crack * 1.4 - 0.2, 0, 1) * clamp(fbm(N, u * 5 + 3, v * 2, 3, 5) * 2 + 0.6, 0, 1);
    c = mix3(c, moss, mm * 0.8);
    const k = 0.85 + 0.3 * (fine * 0.5 + 0.5);
    A[i * 4] = srgbByte(c[0] * k); A[i * 4 + 1] = srgbByte(c[1] * k); A[i * 4 + 2] = srgbByte(c[2] * k); A[i * 4 + 3] = 255;
    R[i] = clamp(0.78 + 0.15 * fine - lm * 0.1 + crack * 0.08, 0.3, 1);
    AO[i] = clamp(1 - crack * 0.7, 0, 1);
  }
  return finish('bark', w, h, A, H, R, AO, { normalStrength: 3.2 });
};

GEN.mud = ({ seed = 21, size = 1024 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), N2 = makePerlin(seed + 5);
  // albedo + height via canvas: mud base then thousands of leaves + twigs (drawn wrapped so the tile is seamless)
  const ca = mkCanvas(w, h), ch = mkCanvas(w, h);
  const ga = ca.getContext('2d'), gh = ch.getContext('2d');
  const base = ga.createImageData(w, h), hb = gh.createImageData(w, h);
  const mudA = hex3('#2a241e'), mudB = hex3('#4a4036'), wet = hex3('#16130f');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    const f = fbm(N, u * 8, v * 8, 6, 8), g = fbm(N2, u * 40, v * 40, 3, 40);
    let c = mix3(mudA, mudB, clamp(f * 0.9 + 0.5, 0, 1));
    c = mix3(c, wet, clamp(-f * 1.5, 0, 0.7));
    const k = 0.9 + 0.2 * g, i = (y * w + x) * 4;
    base.data[i] = srgbByte(c[0] * k); base.data[i + 1] = srgbByte(c[1] * k); base.data[i + 2] = srgbByte(c[2] * k); base.data[i + 3] = 255;
    const hv = srgbByte(0.25 + 0.12 * f + 0.05 * g);
    hb.data[i] = hb.data[i + 1] = hb.data[i + 2] = hv; hb.data[i + 3] = 255;
  }
  ga.putImageData(base, 0, 0); gh.putImageData(hb, 0, 0);
  const r = rng(seed * 13 + 1);
  const leafCols = ['#3b2a1a', '#5a4026', '#6e5532', '#2e2418', '#4b3a24', '#7d6a48', '#33301f', '#584a30', '#262014'];
  const drawWrapped = (fn, x, y, rad) => {
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
      if (x + ox < -rad || x + ox > w + rad || y + oy < -rad || y + oy > h + rad) continue;
      fn(x + ox, y + oy);
    }
  };
  const nLeaves = Math.round(2600 * (w * h) / (1024 * 1024));
  for (let k = 0; k < nLeaves; k++) {
    const x = r() * w, y = r() * h, L = (10 + r() * 26) * w / 1024, Wd = L * (0.35 + r() * 0.25), ang = r() * Math.PI * 2;
    const col = leafCols[Math.floor(r() * leafCols.length)], hv = 0.45 + 0.4 * (k / nLeaves) + r() * 0.1;
    const curl = (r() - 0.5) * 0.6;
    const shape = (g, cx, cy) => {
      g.save(); g.translate(cx, cy); g.rotate(ang);
      g.beginPath(); g.moveTo(-L / 2, 0);
      g.quadraticCurveTo(0, -Wd * (1 + curl), L / 2, 0); g.quadraticCurveTo(0, Wd * (1 - curl), -L / 2, 0); g.fill();
      g.restore();
    };
    ga.fillStyle = col; gh.fillStyle = `rgb(${srgbByte(hv)},${srgbByte(hv)},${srgbByte(hv)})`;
    drawWrapped((cx, cy) => { shape(ga, cx, cy); shape(gh, cx, cy); }, x, y, L);
    // midrib
    if (L > 18 * w / 1024) {
      ga.strokeStyle = 'rgba(20,14,8,0.5)'; ga.lineWidth = Math.max(1, L * 0.04);
      drawWrapped((cx, cy) => { ga.save(); ga.translate(cx, cy); ga.rotate(ang); ga.beginPath(); ga.moveTo(-L / 2, 0); ga.lineTo(L / 2, 0); ga.stroke(); ga.restore(); }, x, y, L);
    }
  }
  const nTw = Math.round(160 * (w * h) / (1024 * 1024));
  for (let k = 0; k < nTw; k++) {
    const x = r() * w, y = r() * h, L = (30 + r() * 90) * w / 1024, ang = r() * Math.PI * 2, lw = (1.5 + r() * 3.5) * w / 1024;
    const hv = 0.7 + r() * 0.2;
    const seg = (g, cx, cy, col) => {
      g.save(); g.translate(cx, cy); g.rotate(ang); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-L / 2, 0); g.quadraticCurveTo(0, (r() - 0.5) * 8, L / 2, 0); g.stroke(); g.restore();
    };
    drawWrapped((cx, cy) => { seg(ga, cx, cy, '#1d1712'); seg(gh, cx, cy, `rgb(${srgbByte(hv)},${srgbByte(hv)},${srgbByte(hv)})`); }, x, y, L);
  }
  const ad = canvasBytes(ca), hd = canvasBytes(ch);
  const A = new Uint8Array(ad.buffer.slice(0)), H = new Float32Array(w * h), R = new Float32Array(w * h), AO = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) H[i] = hd[i * 4] / 255;
  // blur the height a touch (soft leaf edges) and derive AO from local height
  const Hb = boxBlur(H, w, h, 2);
  for (let i = 0; i < w * h; i++) {
    H[i] = H[i] * 0.6 + Hb[i] * 0.4;
    AO[i] = clamp(0.55 + (H[i] - Hb[i]) * 2 + H[i] * 0.5, 0, 1);
    R[i] = clamp(0.9 - H[i] * 0.25, 0.35, 1);
  }
  return finish('mud', w, h, A, H, R, AO, { normalStrength: 2.4 });
};

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let k = -r; k <= r; k++) s += src[y * w + ((k + w) % w)];
    for (let x = 0; x < w; x++) { tmp[y * w + x] = s / n; s += src[y * w + ((x + r + 1) % w)] - src[y * w + ((x - r + w) % w)]; }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let k = -r; k <= r; k++) s += tmp[((k + h) % h) * w + x];
    for (let y = 0; y < h; y++) { out[y * w + x] = s / n; s += tmp[((y + r + 1) % h) * w + x] - tmp[((y - r + h) % h) * w + x]; }
  }
  return out;
}

GEN.rock = ({ seed = 31, size = 512 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), N2 = makePerlin(seed + 2), Wy = makeWorley(seed, 9), Wy2 = makeWorley(seed + 4, 26);
  const A = new Uint8Array(w * h * 4), H = new Float32Array(w * h), R = new Float32Array(w * h), AO = new Float32Array(w * h);
  const c0 = hex3('#4b4b4a'), c1 = hex3('#1c1c1d'), c2 = hex3('#77746d'), algae = hex3('#2d3426');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    const f = fbm(N, u * 4, v * 4, 6, 4);
    const [a1, a2] = Wy(u + f * 0.04, v + f * 0.04);
    const [b1, b2] = Wy2(u, v);
    const facet = clamp((a2 - a1) * 4, 0, 1);       // 0 at cell borders = cracks
    const pits = clamp((b1 - 0.12) * 6, 0, 1);
    const strata = Math.sin((v * 22 + f * 3) * Math.PI) * 0.5 + 0.5;
    const fine = fbm(N2, u * 64, v * 64, 3, 64);
    const ht = 0.45 * Math.pow(facet, 0.5) + 0.22 * (f * 0.5 + 0.5) + 0.12 * pits + 0.06 * strata + 0.1 * (fine * 0.5 + 0.5);
    const i = y * w + x;
    H[i] = clamp(ht, 0, 1);
    let c = mix3(c1, c0, clamp(f * 0.8 + 0.55, 0, 1));
    c = mix3(c, c2, clamp((fine + f) * 0.6 - 0.1, 0, 0.5));
    c = mix3(c, c1, (1 - Math.pow(facet, 0.4)) * 0.8);
    c = mix3(c, algae, clamp(fbm(N2, u * 3 + 7, v * 3, 3, 3) * 2.2 - 0.25, 0, 0.55));
    const k = 0.85 + 0.25 * (fine * 0.5 + 0.5);
    A[i * 4] = srgbByte(c[0] * k); A[i * 4 + 1] = srgbByte(c[1] * k); A[i * 4 + 2] = srgbByte(c[2] * k); A[i * 4 + 3] = 255;
    R[i] = clamp(0.62 + 0.25 * fine + (1 - facet) * 0.1, 0.25, 1);
    AO[i] = clamp(0.35 + 0.65 * Math.pow(facet, 0.35) * (0.7 + 0.3 * pits), 0, 1);
  }
  return finish('rock', w, h, A, H, R, AO, { normalStrength: 3.0 });
};

GEN.sand = ({ seed = 41, size = 512 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), N2 = makePerlin(seed + 3), r = rng(seed);
  const A = new Uint8Array(w * h * 4), H = new Float32Array(w * h), R = new Float32Array(w * h), AO = new Float32Array(w * h);
  const s0 = hex3('#8b857a'), s1 = hex3('#5f5a52'), grit = hex3('#2a2826'), shell = hex3('#d8d4cc');
  const white = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) white[i] = r();
  const grain = boxBlur(white, w, h, 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const f = fbm(N, u * 6, v * 6, 5, 6);
    const warp = fbm(N2, u * 3, v * 3, 3, 3);
    const rip = Math.sin((v * 14 + warp * 1.6 + u * 1) * Math.PI * 2);
    const ripple = Math.pow(rip * 0.5 + 0.5, 1.6);
    const g = grain[i];
    H[i] = clamp(0.35 * ripple + 0.2 * (f * 0.5 + 0.5) + 0.45 * g, 0, 1);
    let c = mix3(s1, s0, clamp(f * 0.7 + 0.55 + (g - 0.5) * 0.6, 0, 1));
    if (white[i] > 0.985) c = mix3(c, grit, 0.7);
    else if (white[i] < 0.006) c = mix3(c, shell, 0.8);
    A[i * 4] = srgbByte(c[0]); A[i * 4 + 1] = srgbByte(c[1]); A[i * 4 + 2] = srgbByte(c[2]); A[i * 4 + 3] = 255;
    R[i] = clamp(0.88 + (g - 0.5) * 0.2, 0.4, 1);
    AO[i] = clamp(0.75 + ripple * 0.25, 0, 1);
  }
  return finish('sand', w, h, A, H, R, AO, { normalStrength: 1.6 });
};

GEN.planks = ({ seed = 51, size = 512, boards = 4 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), N2 = makePerlin(seed + 9), r = rng(seed);
  const A = new Uint8Array(w * h * 4), H = new Float32Array(w * h), R = new Float32Array(w * h), AO = new Float32Array(w * h);
  const wd0 = hex3('#6f665a'), wd1 = hex3('#3d3730'), wd2 = hex3('#a39a8b'), rot = hex3('#2a2620');
  const bOff = Array.from({ length: boards }, () => r() * 10), bTone = Array.from({ length: boards }, () => r());
  const nails = [];
  for (let b = 0; b < boards; b++) for (const ux of [0.06, 0.94]) nails.push([ux + (r() - 0.5) * 0.01, (b + 0.5) / boards + (r() - 0.5) * 0.04]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const bi = Math.min(boards - 1, Math.floor(v * boards)), bv = v * boards - bi;
    const seam = Math.min(bv, 1 - bv);
    const gw = fbm(N, u * 2, v * boards * 0.5 + bOff[bi], 3, 2);
    const grain = Math.sin((bv * 9 + gw * 6 + bOff[bi]) * Math.PI * 2) * 0.5 + 0.5;
    const streak = fbm(N2, u * 3, v * 60, 3, 3) * 0.5 + 0.5;
    const knotsN = fbm(N, u * 6 + bOff[bi], bv * 2, 2, 6);
    const edge = clamp(seam * 40, 0, 1);
    let ht = 0.55 + 0.18 * grain * streak + 0.1 * streak - (1 - edge) * 0.45;
    let c = mix3(wd1, wd0, clamp(0.35 + streak * 0.5 + bTone[bi] * 0.3, 0, 1));
    c = mix3(c, wd2, clamp((grain - 0.6) * 0.9 + bTone[bi] * 0.2, 0, 0.6));
    c = mix3(c, rot, clamp(-knotsN * 2 - 0.3, 0, 0.8) + (1 - edge) * 0.6);
    let nail = 0;
    for (const [nx, ny] of nails) { const d = Math.hypot((u - nx) * w, (v - ny) * h); if (d < 6) nail = Math.max(nail, 1 - d / 6); }
    if (nail > 0) { c = mix3(c, [0.12, 0.08, 0.06], nail * 0.9); ht -= nail * 0.2; }
    H[i] = clamp(ht, 0, 1);
    A[i * 4] = srgbByte(c[0]); A[i * 4 + 1] = srgbByte(c[1]); A[i * 4 + 2] = srgbByte(c[2]); A[i * 4 + 3] = 255;
    R[i] = clamp(0.8 + 0.12 * streak + (1 - edge) * 0.08, 0.3, 1);
    AO[i] = clamp(0.4 + 0.6 * edge, 0, 1);
  }
  return finish('planks', w, h, A, H, R, AO, { normalStrength: 2.5 });
};

function weave(name, { seed = 61, size = 256, twill = false } = {}) {
  const w = size, h = size, N = makePerlin(seed);
  const A = new Uint8Array(w * h * 4), H = new Float32Array(w * h), R = new Float32Array(w * h), AO = new Float32Array(w * h);
  const T = twill ? 32 : 24; // threads per tile
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const fu = u * T, fv = v * T;
    const cu = Math.floor(fu), cv = Math.floor(fv);
    let ht, over;
    if (twill) {
      over = ((cu + cv) % 4) < 2;
      const a = over ? (fv - cv) : (fu - cu);
      ht = Math.sin(a * Math.PI) * 0.8;
      const diag = Math.sin((fu + fv) * Math.PI * 0.5) * 0.5 + 0.5;
      ht = ht * 0.8 + diag * 0.2;
    } else {
      // knit: rows of V-shaped loops
      const lx = fu - cu, ly = fv - cv;
      const vshape = Math.abs(lx - 0.5) * 2;
      const loop = Math.sin(clamp((ly + vshape * 0.5) % 1, 0, 1) * Math.PI);
      ht = loop * (0.6 + 0.4 * Math.sin(lx * Math.PI));
      over = true;
    }
    const fuzz = fbm(N, u * 64, v * 64, 3, 64) * 0.5 + 0.5;
    const blot = fbm(N, u * 4, v * 4, 3, 4);
    H[i] = clamp(ht * 0.8 + fuzz * 0.2, 0, 1);
    const k = clamp(0.82 + ht * 0.18 + (fuzz - 0.5) * 0.12 + blot * 0.05, 0, 1);
    const g = srgbByte(k * (twill ? (over ? 1 : 0.85) : 1));
    A[i * 4] = g; A[i * 4 + 1] = g; A[i * 4 + 2] = g; A[i * 4 + 3] = 255;
    R[i] = clamp(0.86 + fuzz * 0.12, 0, 1);
    AO[i] = clamp(0.55 + ht * 0.45, 0, 1);
  }
  return finish(name, w, h, A, H, R, AO, { normalStrength: 1.6 });
}
GEN.fabric = (o) => weave('fabric', { ...o });
GEN.denim = (o) => weave('denim', { seed: 63, twill: true, ...o });

GEN.moss = ({ seed = 71, size = 256 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), Wy = makeWorley(seed, 18);
  const A = new Uint8Array(w * h * 4), H = new Float32Array(w * h), R = new Float32Array(w * h), AO = new Float32Array(w * h);
  const m0 = hex3('#26331a'), m1 = hex3('#56683a'), m2 = hex3('#151c0f');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const [f1] = Wy(u, v);
    const clump = clamp(1 - f1 * 2.6, 0, 1);
    const fine = fbm(N, u * 48, v * 48, 3, 48) * 0.5 + 0.5;
    H[i] = clamp(clump * 0.7 + fine * 0.3, 0, 1);
    const c = mix3(mix3(m2, m0, clump), m1, fine * clump * 0.7);
    A[i * 4] = srgbByte(c[0]); A[i * 4 + 1] = srgbByte(c[1]); A[i * 4 + 2] = srgbByte(c[2]); A[i * 4 + 3] = 255;
    R[i] = 0.8; AO[i] = clamp(0.4 + clump * 0.6, 0, 1);
  }
  return finish('moss', w, h, A, H, R, AO, { normalStrength: 2 });
};

// ---------------------------------------------------------------------------------------------------- foliage (alpha)
function foliageFinish(name, ca, ch, w, h, { normalStrength = 2.2 } = {}) {
  const ad = canvasBytes(ca), hd = canvasBytes(ch);
  const A = new Uint8Array(ad.buffer.slice(0));
  const H = new Float32Array(w * h), R = new Float32Array(w * h), AO = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { H[i] = hd[i * 4] / 255; R[i] = clamp(0.55 - H[i] * 0.2 + (hd[i * 4 + 1] / 255) * 0.3, 0.2, 1); AO[i] = clamp(0.6 + H[i] * 0.4, 0, 1); }
  // bleed colour into transparent texels so mip-mapped alpha edges don't fringe white/black
  for (let pass = 0; pass < 4; pass++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (A[i + 3] > 8) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const j = (yy * w + xx) * 4; if (A[j + 3] > 8) { A[i] = A[j]; A[i + 1] = A[j + 1]; A[i + 2] = A[j + 2]; break; }
    }
  }
  return finish(name, w, h, A, H, R, AO, { normalStrength, wrap: false, alpha: true });
}
// draws one leaf blade (tip toward +y local), on albedo ctx ga and height ctx gh
function drawBlade(ga, gh, L, W, col, r, { veins = 9, tipBend = 0, tear = 0 } = {}) {
  const path = (g) => {
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(W * 0.9, L * 0.18, W * 0.75 + tipBend * 0.3, L * 0.75, tipBend, L);
    g.bezierCurveTo(-W * 0.75 + tipBend * 0.3, L * 0.75, -W * 0.9, L * 0.18, 0, 0); g.closePath();
  };
  // albedo: gradient from base to tip with a lighter midrib
  const grd = ga.createLinearGradient(-W, 0, W, 0);
  grd.addColorStop(0, col[0]); grd.addColorStop(0.5, col[1]); grd.addColorStop(1, col[0]);
  ga.fillStyle = grd; path(ga); ga.fill();
  const hg = gh.createLinearGradient(-W, 0, W, 0);
  hg.addColorStop(0, 'rgb(90,40,0)'); hg.addColorStop(0.5, 'rgb(200,60,0)'); hg.addColorStop(1, 'rgb(90,40,0)');
  gh.fillStyle = hg; path(gh); gh.fill();
  // veins
  ga.save(); gh.save(); path(ga); ga.clip(); path(gh); gh.clip();
  ga.strokeStyle = 'rgba(210,225,170,0.35)'; ga.lineWidth = Math.max(1, W * 0.05);
  gh.strokeStyle = 'rgb(235,90,0)'; gh.lineWidth = Math.max(1, W * 0.06);
  for (const g of [ga, gh]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(tipBend * 0.2, L * 0.5, tipBend, L); g.stroke(); }
  ga.lineWidth = gh.lineWidth = Math.max(1, W * 0.022);
  ga.strokeStyle = 'rgba(20,30,10,0.35)'; gh.strokeStyle = 'rgb(120,80,0)';
  for (let k = 1; k < veins; k++) {
    const yy = (k / veins) * L * 0.92;
    for (const s of [-1, 1]) for (const g of [ga, gh]) {
      g.beginPath(); g.moveTo(tipBend * (yy / L) * 0.3, yy); g.quadraticCurveTo(s * W * 0.5, yy + L * 0.06, s * W * 0.95, yy + L * 0.16); g.stroke();
    }
  }
  // tears (rain-battered leaves)
  if (tear > 0) {
    ga.globalCompositeOperation = 'destination-out'; gh.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < tear; k++) {
      const yy = (0.25 + r() * 0.6) * L, s = r() < 0.5 ? -1 : 1;
      for (const g of [ga, gh]) { g.beginPath(); g.moveTo(s * W, yy); g.lineTo(s * W * 0.1, yy + L * 0.03); g.lineTo(s * W, yy + L * 0.06); g.closePath(); g.fill(); }
    }
    ga.globalCompositeOperation = 'source-over'; gh.globalCompositeOperation = 'source-over';
  }
  ga.restore(); gh.restore();
}
const LEAF_COLS = [['#1f3a17', '#3d6128'], ['#18301a', '#355a2a'], ['#2a4419', '#4e7330'], ['#162a12', '#2f4f22']];

GEN.leaf = ({ seed = 81 } = {}) => {
  const w = 256, h = 512, r = rng(seed);
  const ca = mkCanvas(w, h), ch = mkCanvas(w, h), ga = ca.getContext('2d'), gh = ch.getContext('2d');
  ga.translate(w / 2, h - 6); ga.scale(1, -1); gh.translate(w / 2, h - 6); gh.scale(1, -1);
  // petiole
  ga.strokeStyle = '#2b3a1a'; ga.lineWidth = 5; ga.beginPath(); ga.moveTo(0, 0); ga.lineTo(0, 40); ga.stroke();
  gh.strokeStyle = 'rgb(150,40,0)'; gh.lineWidth = 5; gh.beginPath(); gh.moveTo(0, 0); gh.lineTo(0, 40); gh.stroke();
  ga.translate(0, 36); gh.translate(0, 36);
  drawBlade(ga, gh, h - 56, w * 0.42, LEAF_COLS[0], r, { veins: 12, tear: 2 });
  return foliageFinish('leaf', ca, ch, w, h);
};

GEN.leaves = ({ seed = 82 } = {}) => {
  const w = 512, h = 512, r = rng(seed);
  const ca = mkCanvas(w, h), ch = mkCanvas(w, h), ga = ca.getContext('2d'), gh = ch.getContext('2d');
  // twig from bottom centre curving up; leaves alternate along it, drooping outward
  const twig = [];
  for (let k = 0; k <= 20; k++) { const s = k / 20; twig.push([w * 0.5 + Math.sin(s * 2.2) * 40, h - 10 - s * h * 0.8]); }
  ga.strokeStyle = '#2a2418'; ga.lineWidth = 7; gh.strokeStyle = 'rgb(160,30,0)'; gh.lineWidth = 7;
  for (const g of [ga, gh]) { g.beginPath(); g.moveTo(...twig[0]); for (const p of twig) g.lineTo(...p); g.stroke(); }
  const n = 10;
  const order = [];
  for (let k = 0; k < n; k++) order.push(k);
  for (const k of order) {
    const s = 0.12 + (k / n) * 0.85, idx = Math.round(s * 20), [px, py] = twig[idx];
    const side = k % 2 ? 1 : -1;
    const ang = side * (0.7 + r() * 0.6) + (r() - 0.5) * 0.3 + Math.PI;   // pointing outward / down-ish in canvas
    const L = (150 + r() * 70) * (1 - s * 0.35), Wd = L * (0.3 + r() * 0.08);
    for (const g of [ga, gh]) { g.save(); g.translate(px, py); g.rotate(ang); }
    drawBlade(ga, gh, L, Wd, LEAF_COLS[Math.floor(r() * LEAF_COLS.length)], r, { veins: 8, tipBend: (r() - 0.5) * 30, tear: r() < 0.3 ? 2 : 0 });
    ga.restore(); gh.restore();
  }
  return foliageFinish('leaves', ca, ch, w, h);
};

function frond(name, { seed = 91, palm = false } = {}) {
  const w = 256, h = 1024, r = rng(seed);
  const ca = mkCanvas(w, h), ch = mkCanvas(w, h), ga = ca.getContext('2d'), gh = ch.getContext('2d');
  // rachis along +V (texture bottom → top), slight S-curve
  const pts = [];
  for (let k = 0; k <= 60; k++) { const s = k / 60; pts.push([w / 2 + Math.sin(s * 3.1) * 6, h - 4 - s * (h - 12)]); }
  ga.strokeStyle = palm ? '#3a3a22' : '#26361a'; ga.lineWidth = palm ? 8 : 5; gh.strokeStyle = 'rgb(200,30,0)'; gh.lineWidth = palm ? 8 : 5;
  for (const g of [ga, gh]) { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); }
  const N = palm ? 46 : 34;
  for (let k = 2; k < N; k++) {
    const s = k / N, [px, py] = pts[Math.round(s * 60)];
    const env = palm ? Math.sin(Math.min(1, s * 1.15) * Math.PI) * 0.75 + 0.25 : Math.sin(Math.min(1, s * 1.08) * Math.PI) * 0.9 + 0.1;
    const L = (palm ? 120 : 100) * env, Wd = palm ? 7 : 11 + 6 * env;
    for (const side of [-1, 1]) {
      const ang = side * (palm ? 1.15 + r() * 0.25 : 1.25 + r() * 0.15) + Math.PI;
      for (const g of [ga, gh]) { g.save(); g.translate(px, py); g.rotate(ang); }
      const col = palm ? [['#2b3b1c', '#4c6530'], ['#34401f', '#5a6e35']][Math.floor(r() * 2)] : LEAF_COLS[Math.floor(r() * LEAF_COLS.length)];
      if (palm) drawBlade(ga, gh, L, Wd, col, r, { veins: 2, tipBend: side * 8 });
      else drawBlade(ga, gh, L, Wd, col, r, { veins: 5, tipBend: 0 });
      ga.restore(); gh.restore();
    }
  }
  return foliageFinish(name, ca, ch, w, h);
}
GEN.fern = (o) => frond('fern', { ...o });
GEN.palm = (o) => frond('palm', { seed: 93, palm: true, ...o });

GEN.foam = ({ seed = 101, size = 512 } = {}) => {
  const w = size, h = size, N = makePerlin(seed), W1 = makeWorley(seed, 14), W2 = makeWorley(seed + 1, 40);
  const A = new Uint8Array(w * h * 4), H = new Float32Array(w * h), R = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = y * w + x;
    const f = fbm(N, u * 5, v * 5, 5, 5);
    const [a1, a2] = W1(u + f * 0.05, v + f * 0.05), [b1, b2] = W2(u, v);
    const lace = clamp(1 - (a2 - a1) * 7, 0, 1);       // bright along cell borders → lacy network
    const bubbles = clamp(1 - (b2 - b1) * 9, 0, 1);
    const cover = clamp(lace * 0.75 + bubbles * 0.45 + f * 0.6, 0, 1);
    H[i] = cover;
    const g = srgbByte(0.85 + 0.15 * cover);
    A[i * 4] = g; A[i * 4 + 1] = g; A[i * 4 + 2] = g; A[i * 4 + 3] = srgbByte(cover);
    R[i] = 0.6;
  }
  const s = finish('foam', w, h, A, H, R, null, { normalStrength: 1.2 });
  s.alpha = true;
  return s;
};

// ═════════════════════════════════════════════ cache / public API ═════════════════════════════════════════════════
const _cache = new Map();
export function getPBR(name, opts = {}) {
  const key = name + JSON.stringify(opts);
  let s = _cache.get(key);
  if (!s) {
    if (!GEN[name]) throw new Error(`textures.getPBR: unknown texture "${name}" (have ${Object.keys(GEN).join(', ')})`);
    s = GEN[name](opts);
    _cache.set(key, s);
  }
  return s;
}
export const PBR_NAMES = Object.keys(GEN);

const _misc = new Map();
function cached(key, fn) { let v = _misc.get(key); if (!v) { v = fn(); _misc.set(key, v); } return v; }

export function getNoiseTex(seed = 1, size = 256) {
  return cached(`noise${seed}|${size}`, () => {
    const ns = [0, 1, 2, 3].map((k) => makePerlin(seed * 10 + k));
    const d = new Uint8Array(size * size * 4);
    const freqs = [4, 8, 2, 16];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, i = (y * size + x) * 4;
      for (let c = 0; c < 4; c++) d[i + c] = srgbByte(fbm(ns[c], u * freqs[c], v * freqs[c], 5, freqs[c]) * 0.75 + 0.5);
    }
    return makeDataTexture(d, size, size, {});
  });
}
export function getCloudTex(seed = 7, size = 1024) {
  return cached(`cloud${seed}|${size}`, () => {
    const N = makePerlin(seed), N2 = makePerlin(seed + 1), N3 = makePerlin(seed + 2);
    const d = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, i = (y * size + x) * 4;
      const wx = fbm(N3, u * 3, v * 3, 3, 3) * 0.25;
      const big = fbm(N, (u + wx) * 3, (v + wx) * 3, 6, 3);
      const det = fbm(N2, u * 12, v * 12, 5, 12);
      const streak = fbm(N3, u * 2, v * 10, 4, 2);
      d[i] = srgbByte(big * 0.75 + 0.5); d[i + 1] = srgbByte(det * 0.75 + 0.5); d[i + 2] = srgbByte(streak * 0.75 + 0.5); d[i + 3] = 255;
    }
    return makeDataTexture(d, size, size, {});
  });
}
export function getOceanNormalTex(seed = 3, size = 512) {
  return cached(`ocean${seed}|${size}`, () => {
    const N = makePerlin(seed), N2 = makePerlin(seed + 7);
    const H = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      // choppy: sharpened crests (1-|n|) mixed with smooth swell detail, slightly anisotropic (wind along +u)
      const a = 1 - Math.abs(fbm(N, u * 6, v * 9, 5, 6));
      const b = fbm(N2, u * 16, v * 20, 4, 16);
      H[y * size + x] = a * a * 0.7 + b * 0.3;
    }
    return makeDataTexture(heightToNormal(H, size, size, 2.2, true), size, size, {});
  });
}
export function getRippleTex(size = 256) {
  // radial ring profile: R = height of an expanding damped ring at radius r (u) and age a (v), used as a 2D lookup
  return cached(`ripple${size}`, () => {
    const d = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const rr = x / (size - 1), age = y / (size - 1), i = (y * size + x) * 4;
      const front = age * 1.0, dist = rr - front;
      const ring = Math.exp(-dist * dist * 900) * Math.cos(dist * 120) * (1 - age) * (rr < front + 0.08 ? 1 : 0);
      d[i] = srgbByte(ring * 0.5 + 0.5); d[i + 1] = d[i]; d[i + 2] = d[i]; d[i + 3] = 255;
    }
    return makeDataTexture(d, size, size, { wrap: false, mips: false });
  });
}
