// Chess Lens — vision: find the board in a screenshot, straighten it, read the pieces.
// Pure functions over ImageData-like objects ({ data: RGBA bytes, width, height }),
// so the same code runs in the browser and in Node tests.

export const LABELS = ['', 'P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k'];
export const CELL = 32;
export const SIZE = CELL * 8;

/* ---------------------------------------------------------------- luminance */

function luminance(img) {
  const { data, width: w, height: h } = img;
  const L = new Float32Array(w * h);
  for (let i = 0, j = 0; i < L.length; i++, j += 4) {
    L[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }
  return L;
}

function integral(L, w, h) {
  const W1 = w + 1;
  const I = new Float64Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += L[y * w + x];
      I[(y + 1) * W1 + x + 1] = I[y * W1 + x + 1] + row;
    }
  }
  return I;
}

// mean over [x0,x1)×[y0,y1) (integers)
function rectMean(I, W1, x0, y0, x1, y1) {
  const s = I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0];
  return s / ((x1 - x0) * (y1 - y0));
}

// Box-filtered downscale of the luminance so the long side is at most maxDim.
function downscale(L, w, h, maxDim) {
  const scale = Math.min(1, maxDim / Math.max(w, h));
  if (scale === 1) return { g: L, w, h, scale };
  const I = integral(L, w, h);
  const W1 = w + 1;
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const g = new Float32Array(nw * nh);
  for (let y = 0; y < nh; y++) {
    const y0 = Math.floor((y * h) / nh), y1 = Math.max(y0 + 1, Math.floor(((y + 1) * h) / nh));
    for (let x = 0; x < nw; x++) {
      const x0 = Math.floor((x * w) / nw), x1 = Math.max(x0 + 1, Math.floor(((x + 1) * w) / nw));
      g[y * nw + x] = rectMean(I, W1, x0, y0, x1, y1);
    }
  }
  return { g, w: nw, h: nh, scale: nw / w };
}

/* ------------------------------------------------------------ board search */

function groupScore(sA, sA2, sB, sB2, n) {
  const mA = sA / n, mB = sB / n;
  const vA = Math.max(0, sA2 / n - mA * mA), vB = Math.max(0, sB2 / n - mB * mB);
  const d = Math.abs(mA - mB);
  if (d < 6) return 0;
  return d / (Math.sqrt(0.5 * (vA + vB)) + 3);
}

// Phase-sensitive checkerboard score for the 8×8 grid at (x, y) with cells cw×ch:
// small patches just inside all four corners of every cell, scored per corner.
// A grid shifted off the real squares makes some patches straddle two squares.
export function cornerScore(I, W1, x, y, cw, ch) {
  const a = 0.05, b = 0.17;
  const offs = [[a, a], [1 - b, a], [a, 1 - b], [1 - b, 1 - b]];
  let total = 0;
  for (const [ox, oy] of offs) {
    let sA = 0, sA2 = 0, sB = 0, sB2 = 0;
    for (let i = 0; i < 8; i++) {
      const y0 = Math.round(y + (i + oy) * ch), y1 = Math.max(y0 + 1, Math.round(y + (i + oy + b - a) * ch));
      for (let j = 0; j < 8; j++) {
        const x0 = Math.round(x + (j + ox) * cw), x1 = Math.max(x0 + 1, Math.round(x + (j + ox + b - a) * cw));
        const v = rectMean(I, W1, x0, y0, x1, y1);
        if ((i + j) & 1) { sB += v; sB2 += v * v; } else { sA += v; sA2 += v * v; }
      }
    }
    total += groupScore(sA, sA2, sB, sB2, 32);
  }
  return total / 4;
}

// Find roughly where (within a cell) and how big the board is.
// For each size, cell values are precomputed on a lattice of quarter cells, so every
// candidate grid is 64 lookups. Values come from the two top corners of each cell —
// pieces sit in the middle and bottom, coordinates in the corners are outvoted.
export function coarseSearch(g, w, h) {
  const I = integral(g, w, h);
  const W1 = w + 1;
  const minDim = Math.min(w, h);
  let best = null;
  for (let s = Math.max(40, minDim * 0.1); s <= minDim; s *= 1.03) {
    const c = s / 8, step = c / 4;
    const nx = Math.floor((w - c) / step) + 1, ny = Math.floor((h - c) / step) + 1;
    if (nx < 29 || ny < 29) continue;
    const V = new Float32Array(nx * ny);
    const pa = c * 0.07, pb = c * 0.27, qa = c * 0.73, qb = c * 0.93;
    for (let l = 0; l < ny; l++) {
      const y = l * step;
      const y0 = Math.round(y + pa), y1 = Math.max(y0 + 1, Math.round(y + pb));
      for (let k = 0; k < nx; k++) {
        const x = k * step;
        const l0 = Math.round(x + pa), l1 = Math.max(l0 + 1, Math.round(x + pb));
        const r0 = Math.round(x + qa), r1 = Math.max(r0 + 1, Math.round(x + qb));
        V[l * nx + k] = 0.5 * (rectMean(I, W1, l0, y0, l1, y1) + rectMean(I, W1, r0, y0, r1, y1));
      }
    }
    for (let l = 0; l + 28 < ny; l++) {
      for (let k = 0; k + 28 < nx; k++) {
        let sA = 0, sA2 = 0, sB = 0, sB2 = 0;
        for (let i = 0; i < 8; i++) {
          const base = (l + 4 * i) * nx + k;
          for (let j = 0; j < 8; j++) {
            const v = V[base + 4 * j];
            if ((i + j) & 1) { sB += v; sB2 += v * v; } else { sA += v; sA2 += v * v; }
          }
        }
        const sc = groupScore(sA, sA2, sB, sB2, 32);
        if (!best || sc > best.score) best = { x: k * step, y: l * step, s, score: sc };
      }
    }
  }
  return best;
}

// Snap the 7 inner grid lines to real edges at full resolution.
// Along a line between two files, half the rows go light→dark and half dark→light,
// so the line has strong positive AND negative gradient; piece outlines rarely do.
function refineAxis(L, w, h, along0, along1, pos0, cell, vertical) {
  const len = vertical ? w : h;
  const lo = Math.max(1, Math.floor(pos0 - cell * 0.8));
  const hi = Math.min(len - 1, Math.ceil(pos0 + cell * 8.8));
  if (hi - lo < cell * 4) return null;
  const n = hi - lo + 1;
  const pos = new Float64Array(n), neg = new Float64Array(n);
  const a0 = Math.max(0, Math.round(along0)), a1 = Math.min(vertical ? h : w, Math.round(along1));
  for (let a = a0; a < a1; a++) {
    for (let k = lo; k <= hi; k++) {
      // gradient across the boundary at coordinate k (between pixel k-1 and k)
      const d = vertical ? L[a * w + k] - L[a * w + k - 1] : L[k * w + a] - L[(k - 1) * w + a];
      if (d > 0) pos[k - lo] += d; else neg[k - lo] -= d;
    }
  }
  const P = new Float64Array(n);
  for (let i = 0; i < n; i++) P[i] = Math.sqrt(pos[i] * neg[i]);
  const S = new Float64Array(n);
  for (let i = 0; i < n; i++) S[i] = 0.25 * (P[Math.max(0, i - 1)] + 2 * P[i] + P[Math.min(n - 1, i + 1)]);
  const at = (coord) => {
    const t = coord - lo;
    if (t < 0 || t > n - 1) return 0;
    const i = Math.floor(t), f = t - i;
    return S[i] * (1 - f) + S[Math.min(n - 1, i + 1)] * f;
  };
  let best = { score: -1 };
  const r = cell * 0.6;
  const dc = Math.max(0.02, cell * 0.002);
  for (let cc = cell * 0.94; cc <= cell * 1.06; cc += dc) {
    for (let p = pos0 - r; p <= pos0 + r; p += 0.25) {
      let s = 0;
      for (let k = 1; k <= 7; k++) s += at(p + k * cc);
      if (s > best.score) best = { score: s, pos: p, cell: cc };
    }
  }
  // the snapped lines must stand out from the general edge level
  let mean = 0;
  for (let i = 0; i < n; i++) mean += S[i];
  mean /= n;
  if (!(best.score / 7 > mean * 2.5)) return null;
  return best;
}

/**
 * Find the chessboard. Returns { quad: [[x,y]×4 TL,TR,BR,BL], score } in source pixels, or null.
 */
export function detectBoard(img) {
  const W = img.width, H = img.height;
  const L = luminance(img);
  const { g, w, h, scale } = downscale(L, W, H, 480);
  const c = coarseSearch(g, w, h);
  if (!c || c.score < 1.0) return null;
  let x = c.x / scale, y = c.y / scale;
  const cell = c.s / scale / 8;
  let cw = cell, ch = cell;
  const vx = refineAxis(L, W, H, y + cell, y + cell * 7, x, cell, true);
  const vy = refineAxis(L, W, H, x + cell, x + cell * 7, y, cell, false);
  if (vx) { x = vx.pos; cw = vx.cell; }
  if (vy) { y = vy.pos; ch = vy.cell; }
  // The grid phase is now exact, but the whole grid could still be one square off:
  // keep the shift whose 64 squares look most like a checkerboard.
  const I = integral(L, W, H);
  let best = { score: -1, x, y };
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const xx = x + i * cw, yy = y + j * ch;
      if (xx < -cw * 0.1 || yy < -ch * 0.1 || xx + 8 * cw > W + cw * 0.1 || yy + 8 * ch > H + ch * 0.1) continue;
      const sc = cornerScore(I, W + 1, Math.max(0, xx), Math.max(0, yy), Math.min(cw, (W - Math.max(0, xx)) / 8), Math.min(ch, (H - Math.max(0, yy)) / 8));
      if (sc > best.score * 1.02) best = { score: sc, x: xx, y: yy };
    }
  }
  x = best.x; y = best.y;
  const sx = cw * 8, sy = ch * 8;
  return {
    quad: [[x, y], [x + sx, y], [x + sx, y + sy], [x, y + sy]],
    score: best.score,
    refined: !!(vx && vy),
  };
}

/* ------------------------------------------------------------------- warp */

// Homography mapping the unit square (0,0),(1,0),(1,1),(0,1) to the quad.
function unitToQuad(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  let g = 0, hh = 0;
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    hh = (dx1 * sy - sx * dy1) / den;
  }
  return [x1 - x0 + g * x1, x3 - x0 + hh * x3, x0, y1 - y0 + g * y1, y3 - y0 + hh * y3, y0, g, hh];
}

/**
 * Straighten the board quad into a SIZE×SIZE RGB image (Uint8ClampedArray, 3 bytes/px).
 * Supersamples so big boards are box-averaged rather than aliased.
 */
export function warpBoard(img, quad, size = SIZE) {
  const { data, width: W, height: H } = img;
  const [a, b, c, d, e, f, g, h] = unitToQuad(quad);
  const side = Math.max(
    Math.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]),
    Math.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1]),
  );
  const ss = Math.max(1, Math.min(5, Math.round(side / size)));
  const out = new Uint8ClampedArray(size * size * 3);
  const inv = 1 / (size * ss);
  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      let r = 0, gg = 0, bb = 0;
      for (let sy = 0; sy < ss; sy++) {
        const v = (oy * ss + sy + 0.5) * inv;
        for (let sx = 0; sx < ss; sx++) {
          const u = (ox * ss + sx + 0.5) * inv;
          const den = g * u + h * v + 1;
          let X = (a * u + b * v + c) / den - 0.5;
          let Y = (d * u + e * v + f) / den - 0.5;
          if (X < 0) X = 0; else if (X > W - 1.001) X = W - 1.001;
          if (Y < 0) Y = 0; else if (Y > H - 1.001) Y = H - 1.001;
          const x0 = X | 0, y0 = Y | 0, fx = X - x0, fy = Y - y0;
          const i00 = (y0 * W + x0) * 4, i10 = i00 + 4, i01 = i00 + W * 4, i11 = i01 + 4;
          const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
          r += data[i00] * w00 + data[i10] * w10 + data[i01] * w01 + data[i11] * w11;
          gg += data[i00 + 1] * w00 + data[i10 + 1] * w10 + data[i01 + 1] * w01 + data[i11 + 1] * w11;
          bb += data[i00 + 2] * w00 + data[i10 + 2] * w10 + data[i01 + 2] * w01 + data[i11 + 2] * w11;
        }
      }
      const n = ss * ss, o = (oy * size + ox) * 3;
      out[o] = r / n; out[o + 1] = gg / n; out[o + 2] = bb / n;
    }
  }
  return out;
}

/* ------------------------------------------------------------- classifier */

function f16(u) {
  const s = u & 0x8000 ? -1 : 1, e = (u >> 10) & 0x1f, m = u & 0x3ff;
  if (e === 0) return s * m * 2 ** -24;
  if (e === 31) return m ? NaN : s * Infinity;
  return s * (1 + m / 1024) * 2 ** (e - 15);
}

/** Parse model.bin: uint16 header [n, (type, d1..d4)×n] then float16 weights + biases per layer. */
export function loadModel(buffer) {
  const ab = buffer instanceof ArrayBuffer ? buffer : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const u16 = new Uint16Array(ab);
  const n = u16[0];
  let off = 1 + n * 5;
  const take = (k) => {
    const a = new Float32Array(k);
    for (let i = 0; i < k; i++) a[i] = f16(u16[off + i]);
    off += k;
    return a;
  };
  const layers = [];
  for (let i = 0; i < n; i++) {
    const h = u16.subarray(1 + i * 5, 6 + i * 5);
    const t = h[0] === 0 ? 'c' : 'f';
    const shape = t === 'c' ? [h[1], h[2], h[3], h[4]] : [h[1], h[2]];
    const w = take(shape.reduce((p, q) => p * q, 1));
    layers.push({ t, shape, w, b: take(shape[shape.length - 1]) });
  }
  if (off !== u16.length) throw new Error(`model size mismatch: ${off} vs ${u16.length}`);
  return { layers };
}

// 3×3 same-padding conv + ReLU + 2×2 max-pool, HWC activations, HWIO weights.
function convReluPool(x, H, W, C, layer) {
  const { w, b, shape } = layer;
  const O = shape[3];
  const y = new Float32Array(H * W * O);
  const acc = new Float32Array(O);
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      acc.set(b);
      for (let ky = 0; ky < 3; ky++) {
        const rr = r + ky - 1;
        if (rr < 0 || rr >= H) continue;
        for (let kx = 0; kx < 3; kx++) {
          const cc = c + kx - 1;
          if (cc < 0 || cc >= W) continue;
          const xi = (rr * W + cc) * C;
          const wi = (ky * 3 + kx) * C * O;
          for (let i = 0; i < C; i++) {
            const v = x[xi + i];
            if (v === 0) continue;
            const wo = wi + i * O;
            for (let o = 0; o < O; o++) acc[o] += v * w[wo + o];
          }
        }
      }
      const yi = (r * W + c) * O;
      for (let o = 0; o < O; o++) y[yi + o] = acc[o] > 0 ? acc[o] : 0;
    }
  }
  const H2 = H >> 1, W2 = W >> 1;
  const p = new Float32Array(H2 * W2 * O);
  for (let r = 0; r < H2; r++) {
    for (let c = 0; c < W2; c++) {
      const o0 = (r * W2 + c) * O;
      const a = ((2 * r) * W + 2 * c) * O, bq = a + O, cq = a + W * O, d = cq + O;
      for (let o = 0; o < O; o++) p[o0 + o] = Math.max(y[a + o], y[bq + o], y[cq + o], y[d + o]);
    }
  }
  return p;
}

function dense(x, layer, relu) {
  const { w, b, shape } = layer;
  const [I, O] = shape;
  const y = Float32Array.from(b);
  for (let i = 0; i < I; i++) {
    const v = x[i];
    if (v === 0) continue;
    const wi = i * O;
    for (let o = 0; o < O; o++) y[o] += v * w[wi + o];
  }
  if (relu) for (let o = 0; o < O; o++) if (y[o] < 0) y[o] = 0;
  return y;
}

function softmax(z) {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((p, q) => p + q, 0);
  return e.map((v) => v / s);
}

/**
 * Classify the 64 cells of a straightened board (RGB, SIZE×SIZE).
 * Returns per cell (row-major from the top-left of the image): label index, probs, feature vector.
 */
export function classifyBoard(model, rgb) {
  const L = model.layers;
  const cells = [];
  for (let i = 0; i < 64; i++) {
    const row = i >> 3, col = i & 7;
    // A flat, uniform cell is an empty square: skip the network (most of the board, usually).
    let s1 = 0, s2 = 0;
    for (let y = 0; y < CELL; y++) {
      for (let k = 0; k < CELL; k++) {
        const o = ((row * CELL + y) * SIZE + col * CELL + k) * 3;
        const l = 0.299 * rgb[o] + 0.587 * rgb[o + 1] + 0.114 * rgb[o + 2];
        s1 += l; s2 += l * l;
      }
    }
    const n = CELL * CELL, sd = Math.sqrt(Math.max(0, s2 / n - (s1 / n) ** 2));
    if (sd < 2.5) {
      const probs = new Array(13).fill(0);
      probs[0] = 1;
      cells.push({ label: 0, conf: 1, probs, feat: null, flat: true });
      continue;
    }
    const x = new Float32Array(CELL * CELL * 3);
    for (let y = 0; y < CELL; y++) {
      const src = ((row * CELL + y) * SIZE + col * CELL) * 3;
      for (let k = 0; k < CELL * 3; k++) x[y * CELL * 3 + k] = rgb[src + k] / 255 - 0.5;
    }
    let a = x, side = CELL, ch = 3, feat = null;
    for (let k = 0; k < L.length - 1; k++) {
      if (L[k].t === 'c') { a = convReluPool(a, side, side, ch, L[k]); side >>= 1; ch = L[k].shape[3]; } else { a = feat = dense(a, L[k], true); }
    }
    const probs = softmax(Array.from(dense(a, L[L.length - 1], false)));
    let label = 0;
    for (let k = 1; k < 13; k++) if (probs[k] > probs[label]) label = k;
    cells.push({ label, conf: probs[label], probs, feat });
  }
  return cells;
}

/* ------------------------------------------------- reading the position */

// Colours of small patches just inside the 4 corners of every cell.
function cornerPatches(rgb) {
  const out = [];
  const p = 1, q = 5; // patch spans p..q px inside each corner of a 32px cell
  for (let i = 0; i < 64; i++) {
    const row = i >> 3, col = i & 7;
    const patches = [];
    for (const [cy, cx] of [[p, p], [p, CELL - q], [CELL - q, p], [CELL - q, CELL - q]]) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = cy; y < cy + q - p; y++) {
        for (let x = cx; x < cx + q - p; x++) {
          const o = ((row * CELL + y) * SIZE + col * CELL + x) * 3;
          r += rgb[o]; g += rgb[o + 1]; b += rgb[o + 2]; n++;
        }
      }
      patches.push([r / n, g / n, b / n]);
    }
    out.push(patches);
  }
  return out;
}

const median = (v) => {
  const s = [...v].sort((a, b) => a - b);
  return s.length % 2 ? s[s.length >> 1] : 0.5 * (s[s.length / 2 - 1] + s[s.length / 2]);
};

/**
 * Cells whose whole square is tinted away from the normal light/dark colour (last-move highlight).
 * A cell counts only if at least 3 of its 4 corners are off-colour, so a piece or a coordinate
 * covering a corner or two doesn't trigger it.
 */
export function findHighlights(rgb) {
  const P = cornerPatches(rgb);
  const par = (i) => ((i >> 3) + (i & 7)) & 1;
  const ref = [0, 1].map((g) => {
    const all = [];
    P.forEach((ps, i) => { if (par(i) === g) all.push(...ps); });
    return [0, 1, 2].map((k) => median(all.map((c) => c[k])));
  });
  const d = P.map((ps, i) => ps.map((c) => Math.hypot(c[0] - ref[par(i)][0], c[1] - ref[par(i)][1], c[2] - ref[par(i)][2])).sort((x, y) => x - y));
  // typical corner noise per colour (textured boards are noisy → higher bar)
  const noise = [0, 1].map((g) => median(d.filter((_, i) => par(i) === g).map((v) => v[1])));
  const hits = [];
  d.forEach((v, i) => { if (v[1] > Math.max(30, 5 * noise[par(i)])) hits.push([v[1], i]); });
  hits.sort((a, b) => b[0] - a[0]);
  // a stray third hit (a piece plus a coordinate in the corners) is usually much weaker
  if (hits.length > 2 && hits[2][0] < 0.6 * hits[1][0]) hits.length = 2;
  return hits.map(([, i]) => i).sort((a, b) => a - b);
}

const isWhite = (ch) => ch && ch === ch.toUpperCase();

/**
 * Turn the 64 image-order labels into a position.
 * opts.orientation: 'white' (white at bottom), 'black', or 'auto'.
 * opts.turn: 'w' | 'b' | 'auto'.
 */
export function readPosition(cells, rgb, opts = {}) {
  const img = cells.map((c) => LABELS[c.label]);
  let orientation = opts.orientation || 'auto';
  let orientationWhy = 'chosen';
  if (orientation === 'auto') {
    // White pieces sit lower in the picture than black ones when white is at the bottom.
    let wr = 0, wn = 0, br = 0, bn = 0;
    img.forEach((ch, i) => {
      if (!ch) return;
      const wgt = 'Kk'.includes(ch) ? 3 : 'Pp'.includes(ch) ? 1.5 : 1;
      if (isWhite(ch)) { wr += (i >> 3) * wgt; wn += wgt; } else { br += (i >> 3) * wgt; bn += wgt; }
    });
    orientation = wn && bn && wr / wn < br / bn ? 'black' : 'white';
    orientationWhy = 'guessed';
  }
  // board[r][f]: r=0 is rank 8, f=0 is file a
  const board = Array.from({ length: 8 }, () => Array(8).fill(''));
  const conf = Array.from({ length: 8 }, () => Array(8).fill(1));
  cells.forEach((c, i) => {
    let r = i >> 3, f = i & 7;
    if (orientation === 'black') { r = 7 - r; f = 7 - f; }
    board[r][f] = LABELS[c.label];
    conf[r][f] = c.conf;
  });

  let turn = opts.turn || 'auto';
  let turnWhy = 'chosen';
  let lastMove = null;
  if (turn === 'auto') {
    turn = orientation === 'white' ? 'w' : 'b';
    turnWhy = 'your side';
    if (rgb) {
      const hl = findHighlights(rgb);
      if (hl.length === 2) {
        const occ = hl.filter((i) => img[i]);
        if (occ.length === 1) {
          const mover = isWhite(img[occ[0]]) ? 'w' : 'b';
          turn = mover === 'w' ? 'b' : 'w';
          turnWhy = 'last-move highlight';
          const toSq = (i) => {
            let r = i >> 3, f = i & 7;
            if (orientation === 'black') { r = 7 - r; f = 7 - f; }
            return 'abcdefgh'[f] + (8 - r);
          };
          const from = hl.find((i) => !img[i]);
          lastMove = { from: toSq(from), to: toSq(occ[0]) };
        }
      }
    }
  }
  return { board, conf, orientation, orientationWhy, turn, turnWhy, lastMove };
}

/** FEN from board + turn, with castling rights inferred from king/rook home squares. */
export function toFen(board, turn) {
  const rows = board.map((row) => {
    let s = '', e = 0;
    for (const ch of row) {
      if (!ch) { e++; continue; }
      if (e) { s += e; e = 0; }
      s += ch;
    }
    return s + (e || '');
  });
  let castle = '';
  if (board[7][4] === 'K') {
    if (board[7][7] === 'R') castle += 'K';
    if (board[7][0] === 'R') castle += 'Q';
  }
  if (board[0][4] === 'k') {
    if (board[0][7] === 'r') castle += 'k';
    if (board[0][0] === 'r') castle += 'q';
  }
  return `${rows.join('/')} ${turn} ${castle || '-'} - 0 1`;
}
