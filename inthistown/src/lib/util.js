// Shared helpers (see SPEC.md §4). Everything here is deterministic.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function rng(seed = 1) {
  let a = (Math.floor(seed * 2654435761) ^ 0x9e3779b9) >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, u) => a + (b - a) * u;
export const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

export const ease = {
  linear: (u) => clamp(u, 0, 1),
  inQuad: (u) => { u = clamp(u, 0, 1); return u * u; },
  outQuad: (u) => { u = clamp(u, 0, 1); return 1 - (1 - u) * (1 - u); },
  inOutQuad: (u) => { u = clamp(u, 0, 1); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; },
  inCubic: (u) => { u = clamp(u, 0, 1); return u * u * u; },
  outCubic: (u) => { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); },
  inOutCubic: (u) => { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; },
  outBack: (u) => { u = clamp(u, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
  outElastic: (u) => { u = clamp(u, 0, 1); if (u === 0 || u === 1) return u; return Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1; },
  inOutSine: (u) => { u = clamp(u, 0, 1); return -(Math.cos(Math.PI * u) - 1) / 2; },
};

export function pingpong(t, period = 1) {
  const x = ((t / period) % 1 + 1) % 1;
  return x < 0.5 ? x * 2 : 2 - x * 2;
}

export function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

// Smooth 1D value noise in [-1, 1].
export function noise1(t, seed = 0) {
  const i = Math.floor(t), f = t - i;
  const a = hash(i + seed * 101.3) * 2 - 1;
  const b = hash(i + 1 + seed * 101.3) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

export function canvasTexture(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  drawFn(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const _geoCache = new Map();
// Global 'blockiness': rounded-box corner radii are scaled by this (1 = soft toy, 0.2 = crisp blocks).
export const BLOCKY = 0.22;
export function rbox(w, h, d, r = 0.06, seg = 2) {
  r *= BLOCKY;
  const key = `${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}|${r}|${seg}`;
  let g = _geoCache.get(key);
  if (!g) {
    const rr = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
    g = new RoundedBoxGeometry(w, h, d, seg, Math.max(rr, 0.001));
    _geoCache.set(key, g);
  }
  return g;
}

const _matCache = new Map();
export function mat(color, opts = {}) {
  const key = String(color) + JSON.stringify(opts);
  let m = _matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...opts });
    _matCache.set(key, m);
  }
  return m;
}
