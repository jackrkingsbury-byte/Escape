// Procedural 3D models: every item kind, avatars, podiums and city props are
// built in code from simple shapes + the item's fictional brand palette.
// Items get googly eyes (and legs when they walk the belt): tech, brainrot style.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CatalogItem } from '../backend/types';
import { RARITY } from '../game/rarity';

// ── Caches ───────────────────────────────────────────────────────────────
const geos = new Map<string, THREE.BufferGeometry>();
function geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geos.get(key) as T | undefined;
  if (!g) {
    g = make();
    geos.set(key, g);
  }
  return g;
}
export const gBox = (w: number, h: number, d: number) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const gRBox = (w: number, h: number, d: number, r = 0.04) =>
  geo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)));
export const gCyl = (rt: number, rb: number, h: number, s = 18) => geo(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
export const gSph = (r: number, ws = 16, hs = 12) => geo(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
export const gTor = (r: number, t: number, arc = Math.PI * 2, rs = 8, ts = 24) =>
  geo(`t${r},${t},${arc},${rs},${ts}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc));
export const gPlane = (w: number, h: number) => geo(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h));

const mats = new Map<string, THREE.Material>();
export function std(color: string | number, o: { metal?: number; rough?: number; emissive?: string | number; ei?: number; opacity?: number; flat?: boolean } = {}) {
  const key = `std|${color}|${o.metal ?? 0.1}|${o.rough ?? 0.55}|${o.emissive ?? ''}|${o.ei ?? 1}|${o.opacity ?? 1}|${o.flat ? 1 : 0}`;
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      metalness: o.metal ?? 0.1,
      roughness: o.rough ?? 0.55,
      emissive: o.emissive ?? 0x000000,
      emissiveIntensity: o.ei ?? 1,
      transparent: (o.opacity ?? 1) < 1,
      opacity: o.opacity ?? 1,
      flatShading: !!o.flat,
    });
    mats.set(key, m);
  }
  return m as THREE.MeshStandardMaterial;
}
/** Unlit, bright: glows under bloom. */
export function glow(color: string | number, opacity = 1) {
  const key = `glow|${color}|${opacity}`;
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    mats.set(key, m);
  }
  return m as THREE.MeshBasicMaterial;
}

function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, parent?: THREE.Object3D) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  if (parent) parent.add(o);
  return o;
}

export function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat = false): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  draw(c);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const texCache = new Map<string, THREE.Texture>();
function cachedTex(key: string, make: () => THREE.Texture) {
  let t = texCache.get(key);
  if (!t) {
    t = make();
    texCache.set(key, t);
  }
  return t;
}

// ── Palette ──────────────────────────────────────────────────────────────
interface Pal {
  c: string;
  a: string;
  body: THREE.Material;
  accent: THREE.Material;
  dark: THREE.Material;
  black: THREE.Material;
  metal: THREE.Material;
  gold: THREE.Material;
  white: THREE.Material;
  glass: THREE.Material;
  glowA: THREE.Material;
  glowC: THREE.Material;
  screen: THREE.Material;
  rubber: THREE.Material;
}

function screenMat(it: CatalogItem) {
  const key = 'screen|' + it.brand + it.color + it.accent;
  const tex = cachedTex(key, () =>
    canvasTex(256, 160, (c) => {
      const g = c.createLinearGradient(0, 0, 256, 160);
      g.addColorStop(0, it.accent);
      g.addColorStop(0.55, it.color);
      g.addColorStop(1, '#0b1020');
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 160);
      c.fillStyle = 'rgba(255,255,255,0.14)';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(150, 0);
      c.lineTo(60, 160);
      c.lineTo(0, 160);
      c.fill();
      c.font = "900 40px 'Orbitron', 'Rajdhani', system-ui, sans-serif";
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#ffffff';
      c.shadowColor = it.color;
      c.shadowBlur = 16;
      c.fillText(it.brand, 128, 82);
    }),
  );
  const k2 = 'screenmat|' + key;
  let m = mats.get(k2);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ map: tex, color: '#d8d8d8' });
    mats.set(k2, m);
  }
  return m;
}

function palette(it: CatalogItem): Pal {
  const dk = new THREE.Color(it.accent).multiplyScalar(0.35).getStyle();
  return {
    c: it.color,
    a: it.accent,
    body: std(it.color, { metal: 0.25, rough: 0.4 }),
    accent: std(it.accent, { metal: 0.3, rough: 0.45 }),
    dark: std(dk, { metal: 0.3, rough: 0.5 }),
    black: std('#10131c', { metal: 0.4, rough: 0.3 }),
    metal: std('#c9d1dc', { metal: 0.9, rough: 0.25 }),
    gold: std('#f5c542', { metal: 1, rough: 0.25 }),
    white: std('#f1f5f9', { rough: 0.6 }),
    glass: std('#9ad8ff', { metal: 0.1, rough: 0.05, opacity: 0.35 }),
    glowA: glow(it.accent),
    glowC: glow(it.color),
    screen: screenMat(it),
    rubber: std('#1c1f26', { rough: 0.9 }),
  };
}

// ── Item builders (face +z, sit on y = 0, roughly unit-sized) ────────────
type Builder = (g: THREE.Group, p: Pal, it: CatalogItem) => void;

function screenPanel(g: THREE.Group, p: Pal, w: number, h: number, y: number, depth = 0.08, frame = 0.05) {
  mesh(gRBox(w, h, depth, 0.03), p.black, 0, y, 0, g);
  const s = mesh(gPlane(w - frame * 2, h - frame * 2), p.screen, 0, y, depth / 2 + 0.002, g);
  s.userData.screen = true;
}

function wheel(g: THREE.Object3D, p: Pal, x: number, y: number, z: number, r: number, w = 0.14) {
  const t = mesh(gCyl(r, r, w, 16), p.rubber, x, y, z, g);
  t.rotation.x = Math.PI / 2;
  const hub = mesh(gCyl(r * 0.55, r * 0.55, w + 0.01, 12), p.metal, x, y, z, g);
  hub.rotation.x = Math.PI / 2;
}

function carBody(g: THREE.Group, p: Pal, o: { len: number; h: number; w: number; cabLen: number; cabH: number; cabX: number; wheelR: number; lift: number; spoiler?: boolean; wing?: boolean }) {
  const car = new THREE.Group();
  car.rotation.y = -0.5; // three-quarter view
  g.add(car);
  const by = o.lift + o.h / 2;
  mesh(gRBox(o.len, o.h, o.w, 0.09), p.body, 0, by, 0, car);
  mesh(gRBox(o.cabLen, o.cabH, o.w * 0.86, 0.1), p.glass, o.cabX, by + o.h / 2 + o.cabH / 2 - 0.03, 0, car);
  mesh(gRBox(o.cabLen * 0.96, 0.05, o.w * 0.88, 0.02), p.body, o.cabX, by + o.h / 2 + o.cabH - 0.03, 0, car);
  // stripe
  mesh(gBox(o.len * 0.98, 0.05, o.w + 0.01), p.accent, 0, by + o.h * 0.1, 0, car);
  const wx = o.len * 0.33;
  const wz = o.w / 2 - 0.02;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) wheel(car, p, sx * wx, o.wheelR, sz * wz, o.wheelR);
  // lights
  mesh(gBox(0.04, 0.07, o.w * 0.7), glow('#fffbe6'), o.len / 2 + 0.01, by + 0.02, 0, car);
  mesh(gBox(0.04, 0.06, o.w * 0.7), glow('#ff3b3b'), -o.len / 2 - 0.01, by + 0.03, 0, car);
  if (o.spoiler) mesh(gBox(0.2, 0.04, o.w * 0.9), p.dark, -o.len / 2 + 0.12, by + o.h / 2 + 0.12, 0, car);
  if (o.wing) {
    mesh(gBox(0.32, 0.05, o.w * 1.05), p.accent, -o.len / 2 + 0.1, by + o.h / 2 + 0.3, 0, car);
    mesh(gBox(0.05, 0.3, 0.05), p.dark, -o.len / 2 + 0.1, by + o.h / 2 + 0.15, o.w * 0.3, car);
    mesh(gBox(0.05, 0.3, 0.05), p.dark, -o.len / 2 + 0.1, by + o.h / 2 + 0.15, -o.w * 0.3, car);
    mesh(gBox(o.len * 0.8, 0.02, o.w * 0.8), p.glowA, 0, o.lift - 0.01, 0, car);
  }
}

const B: Record<string, Builder> = {
  tv(g, p, it) {
    const inch = Number((it.name.match(/(\d+)"/) || [])[1] || 50);
    const w = 1.1 + (Math.min(85, Math.max(32, inch)) - 32) / 55;
    const h = w * 0.58;
    mesh(gBox(0.55, 0.04, 0.3), p.dark, 0, 0.02, 0, g);
    mesh(gBox(0.08, 0.26, 0.06), p.dark, 0, 0.16, 0, g);
    screenPanel(g, p, w, h, 0.3 + h / 2);
    mesh(gBox(w, 0.035, 0.1), p.accent, 0, 0.3 + 0.02, 0.0, g);
  },
  monitor(g, p) {
    mesh(gCyl(0.28, 0.3, 0.04, 20), p.dark, 0, 0.02, 0, g);
    mesh(gBox(0.07, 0.42, 0.07), p.metal, 0, 0.23, -0.05, g);
    screenPanel(g, p, 1.1, 0.64, 0.72);
    mesh(gBox(1.1, 0.03, 0.1), p.accent, 0, 0.4, 0, g);
  },
  phone(g, p) {
    mesh(gRBox(0.52, 1.02, 0.08, 0.08), p.body, 0, 0.51, 0, g);
    const s = mesh(gPlane(0.44, 0.92), p.screen, 0, 0.51, 0.042, g);
    s.userData.screen = true;
    mesh(gRBox(0.2, 0.2, 0.04, 0.05), p.dark, -0.1, 0.84, -0.05, g);
    mesh(gCyl(0.05, 0.05, 0.03, 12), p.black, -0.1, 0.84, -0.075, g).rotation.x = Math.PI / 2;
  },
  tablet(g, p) {
    mesh(gRBox(0.95, 1.25, 0.06, 0.07), p.body, 0, 0.63, 0, g);
    const s = mesh(gPlane(0.86, 1.14), p.screen, 0, 0.63, 0.032, g);
    s.userData.screen = true;
    mesh(gBox(0.7, 0.05, 0.25), p.dark, 0, 0.025, 0.05, g);
  },
  laptop(g, p) {
    mesh(gRBox(1.2, 0.06, 0.8, 0.03), p.body, 0, 0.03, 0.1, g);
    mesh(gPlane(1.05, 0.5), p.dark, 0, 0.061, 0.12, g).rotation.x = -Math.PI / 2;
    const lid = new THREE.Group();
    lid.position.set(0, 0.06, -0.3);
    lid.rotation.x = -0.25;
    g.add(lid);
    mesh(gRBox(1.2, 0.78, 0.05, 0.03), p.body, 0, 0.39, 0, lid);
    const s = mesh(gPlane(1.08, 0.66), p.screen, 0, 0.39, 0.027, lid);
    s.userData.screen = true;
  },
  camera(g, p) {
    mesh(gRBox(1.0, 0.62, 0.45, 0.06), p.black, 0, 0.36, 0, g);
    mesh(gRBox(1.0, 0.12, 0.46, 0.04), p.body, 0, 0.66, 0, g);
    const lens = mesh(gCyl(0.22, 0.25, 0.36, 22), p.dark, 0.05, 0.36, 0.38, g);
    lens.rotation.x = Math.PI / 2;
    mesh(gTor(0.23, 0.03), p.accent, 0.05, 0.36, 0.52, g);
    mesh(gCyl(0.17, 0.17, 0.02, 20), glow('#6ee7ff'), 0.05, 0.36, 0.56, g).rotation.x = Math.PI / 2;
    mesh(gBox(0.16, 0.08, 0.1), glow('#ffffff'), -0.35, 0.58, 0.2, g);
    mesh(gRBox(0.18, 0.5, 0.2, 0.06), p.body, -0.44, 0.32, 0.18, g);
  },
  speaker(g, p) {
    mesh(gRBox(0.72, 1.25, 0.62, 0.08), p.body, 0, 0.63, 0, g);
    for (const [y, r] of [[0.95, 0.2], [0.45, 0.27]] as const) {
      const cone = mesh(gCyl(r, r, 0.04, 22), p.black, 0, y, 0.31, g);
      cone.rotation.x = Math.PI / 2;
      mesh(gTor(r + 0.02, 0.025), p.glowA, 0, y, 0.33, g);
    }
  },
  headphones(g, p) {
    const band = mesh(gTor(0.46, 0.06, Math.PI, 8, 24), p.body, 0, 0.42, 0, g);
    band.rotation.z = 0;
    for (const sx of [-1, 1]) {
      const cup = mesh(gCyl(0.22, 0.22, 0.2, 20), p.accent, sx * 0.46, 0.34, 0, g);
      cup.rotation.z = Math.PI / 2;
      const pad = mesh(gCyl(0.19, 0.19, 0.08, 18), p.black, sx * 0.34, 0.34, 0, g);
      pad.rotation.z = Math.PI / 2;
      mesh(gTor(0.12, 0.02), p.glowC, sx * 0.57, 0.34, 0, g).rotation.y = Math.PI / 2;
    }
  },
  smartwatch(g, p) {
    mesh(gBox(0.34, 1.1, 0.06), p.body, 0, 0.6, -0.02, g);
    mesh(gRBox(0.52, 0.6, 0.16, 0.09), p.black, 0, 0.6, 0.04, g);
    const s = mesh(gPlane(0.42, 0.5), p.screen, 0, 0.6, 0.121, g);
    s.userData.screen = true;
    mesh(gCyl(0.05, 0.05, 0.08, 12), p.accent, 0.29, 0.66, 0.04, g).rotation.z = Math.PI / 2;
  },
  luxury_watch(g, p, it) {
    const gold = /GOLD|ONYX|ZENITH/i.test(it.name + it.brand) ? p.gold : p.metal;
    mesh(gBox(0.36, 1.2, 0.07), p.accent, 0, 0.62, -0.04, g);
    const face = mesh(gCyl(0.36, 0.36, 0.14, 32), gold, 0, 0.62, 0.03, g);
    face.rotation.x = Math.PI / 2;
    const dial = mesh(gCyl(0.3, 0.3, 0.02, 32), p.dark, 0, 0.62, 0.105, g);
    dial.rotation.x = Math.PI / 2;
    mesh(gTor(0.32, 0.03, Math.PI * 2, 8, 32), gold, 0, 0.62, 0.11, g);
    mesh(gBox(0.03, 0.22, 0.01), p.glowA, 0, 0.7, 0.12, g);
    mesh(gBox(0.16, 0.03, 0.01), p.white, 0.07, 0.62, 0.12, g);
    mesh(gCyl(0.05, 0.05, 0.08, 12), gold, 0.4, 0.62, 0.03, g).rotation.z = Math.PI / 2;
  },
  controller(g, p) {
    mesh(gRBox(1.0, 0.34, 0.52, 0.14), p.body, 0, 0.42, 0, g);
    for (const sx of [-1, 1]) mesh(gSph(0.24), p.body, sx * 0.4, 0.28, 0.02, g).scale.set(1, 1.3, 1);
    for (const sx of [-1, 1]) mesh(gCyl(0.07, 0.08, 0.12, 12), p.black, sx * 0.18, 0.62, 0.05, g);
    const cols = ['#22c55e', '#ef4444', '#3b82f6', '#facc15'];
    cols.forEach((c, i) => mesh(gSph(0.045, 10, 8), glow(c), 0.34 + (i % 2 ? 0.07 : -0.07) * (i < 2 ? 1 : 0), 0.6, 0.12 + (i >= 2 ? (i === 2 ? 0.07 : -0.07) : 0), g));
    mesh(gBox(0.4, 0.02, 0.05), p.glowA, 0, 0.5, 0.26, g);
  },
  keyboard(g, p) {
    const k = new THREE.Group();
    k.rotation.x = 0.35;
    k.position.y = 0.25;
    g.add(k);
    mesh(gRBox(1.4, 0.1, 0.5, 0.03), p.dark, 0, 0, 0, k);
    const tex = cachedTex('keys|' + p.a, () =>
      canvasTex(256, 96, (c) => {
        c.fillStyle = '#0b0f19';
        c.fillRect(0, 0, 256, 96);
        for (let r = 0; r < 4; r++)
          for (let i = 0; i < 14; i++) {
            c.fillStyle = `hsl(${(i * 26 + r * 40) % 360},90%,60%)`;
            c.fillRect(4 + i * 18, 6 + r * 22, 14, 16);
          }
      }),
    );
    const km = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const top = mesh(gPlane(1.34, 0.44), km, 0, 0.051, 0, k);
    top.rotation.x = -Math.PI / 2;
    top.userData.screen = true;
    mesh(gBox(1.4, 0.03, 0.05), p.glowA, 0, -0.03, 0.26, k);
  },
  handheld(g, p) {
    mesh(gRBox(1.15, 0.56, 0.12, 0.12), p.body, 0, 0.3, 0, g);
    const s = mesh(gPlane(0.56, 0.38), p.screen, 0, 0.32, 0.062, g);
    s.userData.screen = true;
    mesh(gBox(0.14, 0.04, 0.03), p.black, -0.42, 0.3, 0.07, g);
    mesh(gBox(0.04, 0.14, 0.03), p.black, -0.42, 0.3, 0.07, g);
    mesh(gSph(0.04, 8, 6), glow('#ef4444'), 0.42, 0.34, 0.07, g);
    mesh(gSph(0.04, 8, 6), glow('#22c55e'), 0.36, 0.27, 0.07, g);
  },
  console(g, p) {
    mesh(gRBox(0.52, 1.15, 0.9, 0.06), p.body, 0, 0.58, 0, g);
    mesh(gBox(0.54, 1.0, 0.04), p.glowA, 0, 0.58, 0.45, g).scale.set(0.12, 1, 1);
    mesh(gBox(0.3, 0.02, 0.02), p.black, 0.05, 0.9, 0.46, g);
    mesh(gRBox(0.7, 0.05, 1.0, 0.02), p.dark, 0, 0.025, 0, g);
  },
  gaming_pc(g, p) {
    mesh(gRBox(0.62, 1.2, 1.0, 0.04), p.black, 0, 0.6, 0, g);
    mesh(gBox(0.02, 1.05, 0.9), std('#9ad8ff', { rough: 0.05, opacity: 0.25 }), 0.32, 0.6, 0, g);
    const rgb = ['#f43f5e', '#22d3ee', '#a855f7'];
    rgb.forEach((c, i) => {
      mesh(gTor(0.16, 0.025), glow(c), 0.0, 0.95 - i * 0.34, 0.505, g);
      mesh(gCyl(0.13, 0.13, 0.02, 14), p.dark, 0.0, 0.95 - i * 0.34, 0.5, g).rotation.x = Math.PI / 2;
    });
    mesh(gBox(0.64, 0.05, 1.02), p.accent, 0, 1.2, 0, g);
    mesh(gBox(0.3, 0.3, 0.3), glow(p.c), 0.15, 0.6, -0.1, g).scale.set(0.3, 1, 1);
  },
  gpu(g, p) {
    mesh(gRBox(1.4, 0.58, 0.2, 0.04), p.black, 0, 0.35, 0, g);
    mesh(gRBox(1.38, 0.5, 0.05, 0.03), p.body, 0, 0.35, 0.11, g);
    for (const x of [-0.42, 0.0, 0.42]) {
      const f = mesh(gCyl(0.2, 0.2, 0.03, 20), p.dark, x, 0.35, 0.14, g);
      f.rotation.x = Math.PI / 2;
      f.userData.spin = 12;
      mesh(gTor(0.21, 0.02), p.glowA, x, 0.35, 0.15, g);
    }
    mesh(gBox(1.3, 0.04, 0.22), p.glowC, 0, 0.66, 0, g);
    mesh(gBox(0.4, 0.06, 0.18), p.gold, -0.3, 0.04, 0, g);
  },
  gaming_setup(g, p) {
    mesh(gBox(1.7, 0.06, 0.7), p.dark, 0, 0.55, 0, g);
    for (const sx of [-1, 1]) mesh(gBox(0.06, 0.55, 0.6), p.black, sx * 0.8, 0.27, 0, g);
    for (const x of [-0.42, 0.42]) {
      const m = new THREE.Group();
      m.position.set(x, 0.58, -0.12);
      m.rotation.y = -x * 0.5;
      g.add(m);
      screenPanel(m, p, 0.78, 0.46, 0.35, 0.05, 0.03);
    }
    mesh(gRBox(0.25, 0.45, 0.4, 0.03), p.black, 0.62, 0.8, 0.05, g);
    mesh(gBox(0.02, 0.4, 0.3), p.glowA, 0.745, 0.8, 0.05, g);
    mesh(gBox(1.7, 0.02, 0.02), p.glowC, 0, 0.52, 0.35, g);
  },
  vr_headset(g, p) {
    mesh(gRBox(0.95, 0.5, 0.5, 0.18), p.body, 0, 0.5, 0.05, g);
    mesh(gRBox(0.85, 0.4, 0.06, 0.12), p.black, 0, 0.5, 0.3, g);
    for (const sx of [-1, 1]) mesh(gCyl(0.1, 0.1, 0.02, 16), p.glowA, sx * 0.2, 0.5, 0.335, g).rotation.x = Math.PI / 2;
    const strap = mesh(gTor(0.42, 0.045, Math.PI, 8, 20), p.dark, 0, 0.5, -0.2, g);
    strap.rotation.x = -Math.PI / 2;
  },
  drone(g, p) {
    mesh(gRBox(0.55, 0.2, 0.55, 0.08), p.body, 0, 0.45, 0, g);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      const arm = mesh(gBox(0.62, 0.05, 0.08), p.dark, Math.cos(a) * 0.3, 0.45, Math.sin(a) * 0.3, g);
      arm.rotation.y = -a;
      const rx = Math.cos(a) * 0.6;
      const rz = Math.sin(a) * 0.6;
      mesh(gCyl(0.04, 0.04, 0.12, 8), p.black, rx, 0.5, rz, g);
      const rot = mesh(gBox(0.5, 0.01, 0.06), std('#e2e8f0', { opacity: 0.8 }), rx, 0.57, rz, g);
      rot.userData.spin = 30;
      mesh(gSph(0.035, 8, 6), glow(i < 2 ? '#22c55e' : '#ef4444'), rx, 0.44, rz, g);
    }
    mesh(gSph(0.1, 12, 10), p.black, 0, 0.36, 0.2, g);
    for (const sx of [-1, 1]) mesh(gBox(0.05, 0.3, 0.05), p.dark, sx * 0.2, 0.2, 0, g);
  },
  car(g, p) {
    carBody(g, p, { len: 1.6, h: 0.42, w: 0.8, cabLen: 0.95, cabH: 0.38, cabX: -0.05, wheelR: 0.2, lift: 0.12 });
  },
  sports_car(g, p) {
    carBody(g, p, { len: 1.85, h: 0.34, w: 0.84, cabLen: 0.8, cabH: 0.3, cabX: -0.2, wheelR: 0.2, lift: 0.1, spoiler: true });
  },
  supercar(g, p) {
    carBody(g, p, { len: 1.95, h: 0.3, w: 0.88, cabLen: 0.72, cabH: 0.26, cabX: -0.12, wheelR: 0.21, lift: 0.08, spoiler: true });
  },
  hypercar(g, p) {
    carBody(g, p, { len: 2.05, h: 0.27, w: 0.9, cabLen: 0.66, cabH: 0.24, cabX: -0.05, wheelR: 0.21, lift: 0.07, wing: true });
  },
  suv(g, p) {
    carBody(g, p, { len: 1.75, h: 0.6, w: 0.9, cabLen: 1.35, cabH: 0.42, cabX: -0.1, wheelR: 0.27, lift: 0.18 });
  },
  motorbike(g, p) {
    const b = new THREE.Group();
    b.rotation.y = -0.6;
    g.add(b);
    for (const x of [-0.55, 0.55]) {
      mesh(gTor(0.26, 0.07, Math.PI * 2, 10, 24), p.rubber, x, 0.33, 0, b);
      mesh(gCyl(0.1, 0.1, 0.08, 12), p.metal, x, 0.33, 0, b).rotation.x = Math.PI / 2;
    }
    mesh(gRBox(0.8, 0.28, 0.3, 0.08), p.body, 0.02, 0.62, 0, b);
    mesh(gRBox(0.42, 0.12, 0.28, 0.05), p.black, -0.3, 0.8, 0, b);
    mesh(gRBox(0.34, 0.24, 0.32, 0.1), p.accent, 0.18, 0.8, 0, b);
    const fork = mesh(gBox(0.05, 0.6, 0.05), p.metal, 0.47, 0.6, 0, b);
    fork.rotation.z = 0.35;
    mesh(gBox(0.05, 0.05, 0.6), p.black, 0.38, 0.92, 0, b);
    mesh(gBox(0.05, 0.1, 0.2), glow('#fffbe6'), 0.62, 0.78, 0, b);
    mesh(gCyl(0.06, 0.08, 0.4, 10), p.metal, -0.3, 0.42, 0.18, b).rotation.z = Math.PI / 2;
  },
  bicycle(g, p) {
    const b = new THREE.Group();
    b.rotation.y = -0.6;
    g.add(b);
    for (const x of [-0.5, 0.5]) {
      mesh(gTor(0.32, 0.03, Math.PI * 2, 8, 28), p.rubber, x, 0.35, 0, b);
      mesh(gTor(0.29, 0.01, Math.PI * 2, 6, 28), p.metal, x, 0.35, 0, b);
    }
    const bars: [number, number, number, number, number][] = [
      [0, 0.52, 0.72, 0.04, 0.2],
      [-0.25, 0.45, 0.55, 0.04, -1.0],
      [0.22, 0.45, 0.5, 0.04, 1.1],
      [-0.37, 0.35, 0.3, 0.04, 0.0],
    ];
    for (const [x, y, len, t, rz] of bars) {
      const m = mesh(gBox(len, t, t), p.body, x, y, 0, b);
      m.rotation.z = rz;
    }
    mesh(gRBox(0.24, 0.06, 0.12, 0.03), p.black, -0.2, 0.82, 0, b);
    mesh(gBox(0.04, 0.4, 0.04), p.metal, 0.44, 0.62, 0, b);
    mesh(gBox(0.04, 0.04, 0.45), p.black, 0.44, 0.84, 0, b);
  },
  skateboard(g, p) {
    const s = new THREE.Group();
    s.rotation.z = 0.35;
    s.rotation.y = -0.4;
    s.position.y = 0.35;
    g.add(s);
    mesh(gRBox(1.4, 0.06, 0.38, 0.03), p.body, 0, 0.1, 0, s);
    mesh(gBox(1.1, 0.01, 0.3), p.accent, 0, 0.135, 0, s);
    for (const x of [-0.45, 0.45]) {
      mesh(gBox(0.08, 0.06, 0.3), p.metal, x, 0.04, 0, s);
      for (const z of [-0.16, 0.16]) mesh(gCyl(0.06, 0.06, 0.06, 12), glow(p.a), x, 0.0, z, s).rotation.x = Math.PI / 2;
    }
  },
  surfboard(g, p) {
    const b = mesh(gSph(0.5, 20, 16), p.body, 0, 0.72, 0, g);
    b.scale.set(0.42, 1.45, 0.1);
    const st = mesh(gBox(0.06, 1.8, 0.11), p.accent, 0, 0.72, 0, g);
    st.scale.set(1, 1, 1);
    mesh(gBox(0.04, 0.16, 0.14), p.dark, 0, 0.2, -0.08, g);
  },
  sneakers(g, p) {
    for (const z of [-0.24, 0.24]) {
      const s = new THREE.Group();
      s.position.set(z * 0.2, 0, z);
      s.rotation.y = -0.5;
      g.add(s);
      mesh(gRBox(1.0, 0.14, 0.38, 0.06), p.white, 0, 0.07, 0, s);
      mesh(gRBox(0.82, 0.34, 0.36, 0.14), p.body, -0.06, 0.3, 0, s);
      mesh(gRBox(0.36, 0.22, 0.34, 0.1), p.body, 0.3, 0.22, 0, s);
      const sw = mesh(gBox(0.5, 0.06, 0.37), p.accent, 0.0, 0.26, 0, s);
      sw.rotation.z = 0.25;
      for (let i = 0; i < 3; i++) mesh(gBox(0.03, 0.02, 0.2), p.white, 0.12 - i * 0.1, 0.47, 0, s);
      mesh(gBox(0.1, 0.18, 0.2), p.accent, -0.46, 0.4, 0, s);
    }
  },
  cap(g, p) {
    const crown = mesh(new THREE.SphereGeometry(0.42, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), p.body, 0, 0.05, 0, g);
    crown.scale.set(1, 0.9, 1);
    const brim = mesh(gCyl(0.42, 0.42, 0.035, 24), p.accent, 0, 0.06, 0.32, g);
    brim.scale.set(0.9, 1, 0.8);
    mesh(gSph(0.05, 8, 6), p.accent, 0, 0.43, 0, g);
    mesh(gBox(0.22, 0.12, 0.01), p.glowA, 0, 0.22, 0.41, g);
    g.position.y = 0;
  },
  hoodie(g, p) {
    mesh(gRBox(0.82, 0.9, 0.36, 0.12), p.body, 0, 0.55, 0, g);
    for (const sx of [-1, 1]) {
      const sl = mesh(gRBox(0.24, 0.82, 0.28, 0.1), p.body, sx * 0.52, 0.5, 0, g);
      sl.rotation.z = sx * 0.12;
    }
    const hood = mesh(gSph(0.28, 16, 12), p.accent, 0, 1.0, -0.08, g);
    hood.scale.set(1, 0.8, 0.9);
    mesh(gRBox(0.5, 0.2, 0.05, 0.05), p.accent, 0, 0.32, 0.18, g);
    for (const sx of [-1, 1]) mesh(gBox(0.02, 0.25, 0.02), p.white, sx * 0.08, 0.8, 0.19, g);
  },
  jacket(g, p) {
    mesh(gRBox(0.84, 0.95, 0.38, 0.1), p.body, 0, 0.55, 0, g);
    for (const sx of [-1, 1]) {
      const sl = mesh(gRBox(0.24, 0.85, 0.28, 0.08), p.body, sx * 0.53, 0.52, 0, g);
      sl.rotation.z = sx * 0.1;
      mesh(gBox(0.2, 0.25, 0.04), p.accent, sx * 0.2, 0.95, 0.18, g).rotation.z = sx * -0.5;
    }
    mesh(gBox(0.03, 0.9, 0.02), p.gold, 0, 0.55, 0.2, g);
    mesh(gBox(0.84, 0.06, 0.39), p.accent, 0, 0.12, 0, g);
  },
  sunglasses(g, p) {
    for (const sx of [-1, 1]) {
      const l = mesh(gCyl(0.2, 0.2, 0.03, 24), std('#0b0f19', { metal: 0.8, rough: 0.05 }), sx * 0.24, 0.45, 0, g);
      l.rotation.x = Math.PI / 2;
      l.scale.set(1.15, 1, 0.85);
      mesh(gTor(0.2, 0.025, Math.PI * 2, 6, 24), p.body, sx * 0.24, 0.45, 0.01, g).scale.set(1.15, 0.85, 1);
      mesh(gBox(0.03, 0.03, 0.6), p.body, sx * 0.46, 0.5, -0.3, g);
    }
    mesh(gBox(0.1, 0.03, 0.03), p.body, 0, 0.5, 0.01, g);
    mesh(gBox(0.1, 0.04, 0.01), p.glowA, 0.24, 0.52, 0.025, g);
  },
  chain(g, p, it) {
    const mat = /SILVER/i.test(it.name) ? p.metal : p.gold;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const l = mesh(gTor(0.07, 0.022, Math.PI * 2, 6, 14), mat, Math.cos(a) * 0.42, 0.62 + Math.sin(a) * 0.42, 0, g);
      l.rotation.z = a;
      if (i % 2) l.rotation.x = Math.PI / 2;
    }
    mesh(gRBox(0.26, 0.3, 0.06, 0.04), p.body, 0, 0.12, 0.02, g);
    mesh(gBox(0.1, 0.14, 0.02), p.glowA, 0, 0.12, 0.06, g);
  },
  ring(g, p) {
    mesh(gTor(0.32, 0.075, Math.PI * 2, 12, 32), p.gold, 0, 0.42, 0, g);
    const gem = mesh(new THREE.OctahedronGeometry(0.2), std(p.c, { metal: 0.2, rough: 0.05, emissive: p.c, ei: 0.4, flat: true }), 0, 0.86, 0, g);
    gem.scale.set(1, 1.2, 1);
  },
  diamond(g, p) {
    const d = mesh(new THREE.OctahedronGeometry(0.55, 0), std(p.c, { metal: 0.3, rough: 0.02, emissive: p.c, ei: 0.35, flat: true }), 0, 0.62, 0, g);
    d.scale.set(1, 1.15, 1);
    mesh(gCyl(0.3, 0.38, 0.1, 6), p.dark, 0, 0.05, 0, g);
  },
  gold_bar(g, p) {
    for (const [x, y, z] of [[-0.3, 0.16, 0], [0.3, 0.16, 0], [0, 0.46, 0]] as const) {
      const b = mesh(gCyl(0.3, 0.42, 0.3, 4), p.gold, x, y, z, g);
      b.rotation.y = Math.PI / 4;
      b.scale.set(1.4, 1, 0.8);
    }
  },
  perfume(g, p) {
    mesh(gRBox(0.6, 0.72, 0.34, 0.1), std(p.c, { rough: 0.05, opacity: 0.55 }), 0, 0.37, 0, g);
    mesh(gRBox(0.46, 0.5, 0.22, 0.08), glow(p.c, 0.6), 0, 0.33, 0, g);
    mesh(gCyl(0.1, 0.12, 0.08, 12), p.gold, 0, 0.77, 0, g);
    mesh(gRBox(0.3, 0.28, 0.3, 0.06), p.gold, 0, 0.93, 0, g);
    mesh(gPlane(0.3, 0.14), p.white, 0, 0.4, 0.172, g);
  },
  ball(g, p) {
    const tex = cachedTex('ball|' + p.c + p.a, () =>
      canvasTex(128, 64, (c) => {
        c.fillStyle = p.c;
        c.fillRect(0, 0, 128, 64);
        c.fillStyle = p.a;
        for (let i = 0; i < 4; i++) c.fillRect(i * 32 + 12, 0, 6, 64);
        c.fillRect(0, 29, 128, 6);
      }),
    );
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
    mesh(gSph(0.5, 24, 18), m, 0, 0.5, 0, g);
  },
  racket(g, p) {
    const f = mesh(gTor(0.36, 0.04, Math.PI * 2, 8, 28), p.body, 0, 0.95, 0, g);
    f.scale.set(1, 1.3, 1);
    const net = mesh(gPlane(0.66, 0.9), std('#e2e8f0', { opacity: 0.35 }), 0, 0.95, 0, g);
    net.scale.set(1, 1, 1);
    mesh(gCyl(0.045, 0.05, 0.5, 10), p.accent, 0, 0.25, 0, g);
    mesh(gCyl(0.055, 0.055, 0.22, 10), p.black, 0, 0.12, 0, g);
  },
  golf(g, p) {
    const sh = mesh(gCyl(0.02, 0.025, 1.3, 8), p.metal, 0.1, 0.72, 0, g);
    sh.rotation.z = 0.18;
    mesh(gRBox(0.32, 0.12, 0.14, 0.05), p.body, -0.03, 0.08, 0.02, g);
    mesh(gCyl(0.05, 0.05, 0.28, 10), p.black, 0.21, 1.3, 0, g).rotation.z = 0.18;
    mesh(gSph(0.08, 12, 10), p.white, 0.3, 0.12, 0.1, g);
    mesh(gCyl(0.3, 0.35, 0.04, 20), std('#166534'), 0, 0.02, 0, g);
  },
  trophy(g, p, it) {
    const mat = /SILVER/i.test(it.name) ? p.metal : p.gold;
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push(new THREE.Vector2(0.12 + Math.sin(t * Math.PI * 0.5) * 0.3, 0.6 + t * 0.55));
    }
    mesh(new THREE.LatheGeometry(pts, 24), mat, 0, 0, 0, g);
    mesh(gCyl(0.06, 0.1, 0.35, 12), mat, 0, 0.42, 0, g);
    for (const sx of [-1, 1]) mesh(gTor(0.16, 0.03, Math.PI, 8, 16), mat, sx * 0.4, 0.95, 0, g).rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    mesh(gRBox(0.5, 0.25, 0.5, 0.04), p.dark, 0, 0.12, 0, g);
    mesh(gBox(0.3, 0.1, 0.01), p.glowA, 0, 0.12, 0.26, g);
  },
  backpack(g, p) {
    mesh(gRBox(0.75, 0.95, 0.4, 0.16), p.body, 0, 0.5, 0, g);
    mesh(gRBox(0.55, 0.42, 0.14, 0.1), p.accent, 0, 0.35, 0.24, g);
    mesh(gTor(0.12, 0.03, Math.PI, 6, 12), p.dark, 0, 0.98, 0, g);
    for (const sx of [-1, 1]) mesh(gBox(0.08, 0.8, 0.06), p.dark, sx * 0.22, 0.5, -0.22, g);
    mesh(gBox(0.4, 0.02, 0.02), p.glowA, 0, 0.58, 0.315, g);
  },
};

const KIND_SIZE: Record<string, number> = {
  car: 1.9, sports_car: 2.0, supercar: 2.05, hypercar: 2.15, suv: 1.95, motorbike: 1.6, bicycle: 1.5,
  tv: 1.55, monitor: 1.3, gaming_setup: 1.7, gaming_pc: 1.35, console: 1.2, surfboard: 1.6,
  ring: 0.9, chain: 1.0, sunglasses: 1.0, luxury_watch: 1.05, smartwatch: 1.0, diamond: 1.1, cap: 0.95,
};

export interface ItemModel {
  root: THREE.Group; // the thing you place in the world (base at y = 0)
  body: THREE.Group; // spins / bobs
  legs: THREE.Object3D[];
  eyes: THREE.Group;
  height: number;
  width: number;
  pupils: THREE.Object3D[];
}

const EYE_WHITE = () => std('#ffffff', { rough: 0.35 });
const eyeCache = new Map<number, { whites: THREE.BufferGeometry; pupils: THREE.BufferGeometry }>();
function eyeGeos(width: number) {
  const key = Math.round(width * 20) / 20;
  let e = eyeCache.get(key);
  if (e) return e;
  const r = Math.max(0.09, Math.min(0.16, width * 0.1));
  const spread = Math.max(r * 1.25, Math.min(width * 0.22, 0.3));
  const w: THREE.BufferGeometry[] = [];
  const pp: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    w.push(new THREE.SphereGeometry(r, 14, 10).scale(1, 1, 0.55).translate(sx * spread, 0, 0));
    pp.push(new THREE.SphereGeometry(r * 0.5, 10, 8).translate(sx * spread, -r * 0.1, r * 0.42));
  }
  e = { whites: mergeGeometries(w)!, pupils: mergeGeometries(pp)! };
  eyeCache.set(key, e);
  return e;
}
const EYE_BLACK = () => std('#0b0b0f', { rough: 0.2, metal: 0.2 });

const protos = new Map<string, { group: THREE.Group; height: number; width: number; depth: number; eyeY: number; eyeZ: number }>();

/** Bake a built group into one mesh per material (≈20 draw calls → ≈4). */
function bake(g: THREE.Group): THREE.Group {
  g.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    let geom = m.geometry.clone();
    if (geom.index) geom = geom.toNonIndexed();
    for (const k of Object.keys(geom.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') geom.deleteAttribute(k);
    if (!geom.attributes.uv) geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((geom.attributes.position.count) * 2), 2));
    geom.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    const list = buckets.get(m.material) || [];
    list.push(geom);
    buckets.set(m.material, list);
  });
  const out = new THREE.Group();
  for (const [mat, list] of buckets) {
    const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!merged) continue;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    out.add(mesh);
  }
  return out;
}

function proto(it: CatalogItem) {
  let p = protos.get(it.id);
  if (p) return p;
  const built = new THREE.Group();
  const pal = palette(it);
  (B[it.kind] || fallback)(built, pal, it);
  const g = bake(built);
  const bb = new THREE.Box3().setFromObject(g);
  const size = new THREE.Vector3();
  bb.getSize(size);
  const tier = RARITY[it.rarity]?.tier ?? 1;
  const target = (KIND_SIZE[it.kind] ?? 1.2) * (1 + 0.07 * Math.max(0, tier - 3));
  const s = target / Math.max(size.x, size.y, size.z, 0.01);
  const wrap = new THREE.Group();
  g.scale.setScalar(s);
  g.position.set(-((bb.min.x + bb.max.x) / 2) * s, -bb.min.y * s, -((bb.min.z + bb.max.z) / 2) * s);
  wrap.add(g);
  p = {
    group: wrap,
    height: size.y * s,
    width: size.x * s,
    depth: size.z * s,
    eyeY: size.y * s * 0.72,
    eyeZ: (size.z * s) / 2 + 0.02,
  };
  protos.set(it.id, p);
  return p;
}

const fallback: Builder = (g, p) => {
  mesh(gRBox(0.9, 0.9, 0.9, 0.12), p.body, 0, 0.45, 0, g);
  screenPanel(g, p, 0.7, 0.5, 0.5, 0.02, 0.02);
};

// ── Mutations ────────────────────────────────────────────────────────────
export const MUTATION_COLORS: Record<string, string> = {
  gold: '#fbbf24', diamond: '#67e8f9', neon: '#f472b6', holo: '#c4b5fd', glitch: '#22d3ee', rainbow: '#ffffff',
};

const mutMats: Record<string, THREE.Material> = {};
export const rainbowMat = new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: '#ff0000', emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.25 });
export const glitchMat = new THREE.MeshStandardMaterial({ color: '#22d3ee', emissive: '#0ea5e9', emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.3 });

export function mutationMaterial(m: string): THREE.Material | null {
  if (mutMats[m]) return mutMats[m];
  let mat: THREE.Material | null = null;
  switch (m) {
    case 'gold':
      mat = new THREE.MeshStandardMaterial({ color: '#f7c948', metalness: 1, roughness: 0.2, emissive: '#3a2600', emissiveIntensity: 0.4 });
      break;
    case 'diamond':
      mat = new THREE.MeshPhysicalMaterial({ color: '#c9f6ff', metalness: 0.15, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, emissive: '#1b7f99', emissiveIntensity: 0.35, envMapIntensity: 2 });
      break;
    case 'neon':
      mat = new THREE.MeshStandardMaterial({ color: '#ff5fd7', emissive: '#ff2fd0', emissiveIntensity: 1.1, roughness: 0.4 });
      break;
    case 'holo':
      mat = new THREE.MeshPhysicalMaterial({ color: '#eef2ff', metalness: 0.6, roughness: 0.12, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [120, 900], emissive: '#6d28d9', emissiveIntensity: 0.15 });
      break;
    case 'glitch':
      mat = glitchMat;
      break;
    case 'rainbow':
      mat = rainbowMat;
      break;
  }
  if (mat) mutMats[m] = mat;
  return mat;
}

/** Animate the shared "living" mutation materials once per frame. */
export function tickMutations(t: number) {
  const hue = (t * 0.25) % 1;
  rainbowMat.color.setHSL(hue, 0.95, 0.55);
  rainbowMat.emissive.setHSL((hue + 0.05) % 1, 1, 0.45);
  const on = Math.floor(t * 9) % 5 === 0;
  glitchMat.color.set(on ? '#f0f' : '#22d3ee');
  glitchMat.emissive.set(on ? '#c026d3' : '#0ea5e9');
}

/** A fresh placeable copy of an item (shares geometry/materials with its prototype). */
export function buildItem(it: CatalogItem, mutation: string | null = null, opts: { eyes?: boolean; legs?: boolean } = {}): ItemModel {
  const p = proto(it);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const inner = p.group.clone(true);
  body.add(inner);
  const mm = mutation ? mutationMaterial(mutation) : null;
  if (mm) {
    inner.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = mm;
    });
  }
  // googly eyes: both whites in one mesh, both pupils in another (they move together)
  const eyes = new THREE.Group();
  const pupils: THREE.Object3D[] = [];
  if (opts.eyes !== false) {
    const e = eyeGeos(p.width);
    const whites = new THREE.Mesh(e.whites, EYE_WHITE());
    whites.position.set(0, p.eyeY, p.eyeZ);
    const pu = new THREE.Mesh(e.pupils, EYE_BLACK());
    pu.position.set(0, p.eyeY, p.eyeZ);
    pu.userData.base = pu.position.clone();
    pupils.push(pu);
    eyes.add(whites, pu);
    body.add(eyes);
  }
  const legs: THREE.Object3D[] = [];
  if (opts.legs) {
    const legMat = std('#1f2937', { rough: 0.7 });
    const shoe = std('#f8fafc', { rough: 0.6 });
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * Math.min(0.28, p.width * 0.22), 0.34, 0);
      const leg = new THREE.Mesh(gBox(0.07, 0.34, 0.07), legMat);
      leg.position.y = -0.17;
      const foot = new THREE.Mesh(gBox(0.14, 0.06, 0.2), shoe);
      foot.position.set(0, -0.34, 0.04);
      pivot.add(leg, foot);
      root.add(pivot);
      legs.push(pivot);
    }
    body.position.y = 0.34;
  }
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
    }
  });
  return { root, body, legs, eyes, height: p.height + (opts.legs ? 0.34 : 0), width: p.width, pupils };
}

// ── Rarity decorations ───────────────────────────────────────────────────
const beamTex = () =>
  cachedTex('beam', () =>
    canvasTex(8, 128, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0.9)');
      c.fillStyle = g;
      c.fillRect(0, 0, 8, 128);
    }),
  );

export function rarityBeam(color: string, height = 9, radius = 0.55) {
  const m = new THREE.MeshBasicMaterial({ color, map: beamTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, opacity: 0.8 });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.6, radius, height, 16, 1, true), m);
  b.position.y = height / 2;
  b.renderOrder = 2;
  return b;
}

export function glowRing(color: string, r: number) {
  const m = new THREE.Mesh(gTor(r, 0.04, Math.PI * 2, 6, 40), glow(color));
  m.rotation.x = Math.PI / 2;
  return m;
}

const blobTex = () =>
  cachedTex('blob', () =>
    canvasTex(64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(0,0,0,0.55)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    }),
  );

export function blobShadow(r: number) {
  const m = new THREE.Mesh(gPlane(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  return m;
}

export function softDotTexture() {
  return cachedTex('dot', () =>
    canvasTex(64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.8)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    }),
  );
}

// ── Podiums ──────────────────────────────────────────────────────────────
export interface PodiumModel {
  root: THREE.Group;
  ring: THREE.Mesh;
  plate: THREE.Mesh;
  plateMat: THREE.MeshBasicMaterial;
}

export function buildPodium(size: number, color: string, plateOffset: number): PodiumModel {
  const root = new THREE.Group();
  const base = new THREE.Mesh(gCyl(size * 0.5, size * 0.58, 0.42, 24), std('#1b2238', { metal: 0.6, rough: 0.35 }));
  base.position.y = 0.21;
  base.castShadow = true;
  base.receiveShadow = true;
  const top = new THREE.Mesh(gCyl(size * 0.52, size * 0.5, 0.06, 24), std('#2b3552', { metal: 0.7, rough: 0.25 }));
  top.position.y = 0.45;
  top.receiveShadow = true;
  const ring = glowRing(color, size * 0.52);
  ring.position.y = 0.46;
  root.add(base, top, ring);
  const plateMat = new THREE.MeshBasicMaterial({ color: '#22c55e', transparent: true, opacity: 0.25, toneMapped: false });
  const plate = new THREE.Mesh(gRBox(size * 0.9, 0.05, 0.55, 0.02), plateMat);
  plate.position.set(0, 0.03, plateOffset);
  root.add(plate);
  return { root, ring, plate, plateMat };
}

// ── Avatars ──────────────────────────────────────────────────────────────
export interface AvatarRig {
  root: THREE.Group;
  body: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  head: THREE.Object3D;
  hold: THREE.Group;
  walk: number;
}

const faceTex = (bot: boolean) =>
  cachedTex('face' + bot, () =>
    canvasTex(64, 64, (c) => {
      c.clearRect(0, 0, 64, 64);
      if (bot) {
        c.fillStyle = '#0b1020';
        c.fillRect(8, 18, 48, 20);
        c.fillStyle = '#22d3ee';
        c.shadowColor = '#22d3ee';
        c.shadowBlur = 8;
        c.fillRect(14, 24, 12, 8);
        c.fillRect(38, 24, 12, 8);
        c.fillRect(22, 44, 20, 4);
      } else {
        c.fillStyle = '#0b0b0f';
        c.fillRect(16, 22, 8, 12);
        c.fillRect(40, 22, 8, 12);
        c.fillStyle = '#ffffff';
        c.fillRect(18, 24, 3, 4);
        c.fillRect(42, 24, 3, 4);
        c.strokeStyle = '#0b0b0f';
        c.lineWidth = 4;
        c.beginPath();
        c.arc(32, 38, 10, 0.15 * Math.PI, 0.85 * Math.PI);
        c.stroke();
      }
    }),
  );

export function buildAvatar(o: { shirt: string; pants?: string; skin?: string; accent?: string; bot?: boolean; crown?: boolean }): AvatarRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const shirt = std(o.shirt, { rough: 0.6 });
  const pants = std(o.pants || '#1e293b', { rough: 0.7 });
  const skin = o.bot ? std('#a8b3c7', { metal: 0.8, rough: 0.3 }) : std(o.skin || '#f2c9a0', { rough: 0.7 });
  const accent = glow(o.accent || '#22d3ee');
  const mk = (x: number, y: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    body.add(g);
    return g;
  };
  const legL = mk(-0.17, 0.82);
  const legR = mk(0.17, 0.82);
  for (const l of [legL, legR]) {
    const m = new THREE.Mesh(gBox(0.28, 0.82, 0.3), pants);
    m.position.y = -0.41;
    m.castShadow = true;
    const shoe = new THREE.Mesh(gBox(0.3, 0.12, 0.38), std('#0f172a'));
    shoe.position.set(0, -0.78, 0.04);
    l.add(m, shoe);
  }
  const torso = new THREE.Mesh(gRBox(0.74, 0.76, 0.42, 0.06), shirt);
  torso.position.y = 1.2;
  torso.castShadow = true;
  body.add(torso);
  const stripe = new THREE.Mesh(gBox(0.76, 0.06, 0.44), accent);
  stripe.position.y = 1.02;
  body.add(stripe);
  const armL = mk(-0.5, 1.52);
  const armR = mk(0.5, 1.52);
  for (const a of [armL, armR]) {
    const m = new THREE.Mesh(gRBox(0.24, 0.66, 0.26, 0.05), shirt);
    m.position.y = -0.3;
    m.castShadow = true;
    const hand = new THREE.Mesh(gBox(0.22, 0.16, 0.24), skin);
    hand.position.y = -0.7;
    a.add(m, hand);
  }
  const head = new THREE.Group();
  head.position.y = 1.9;
  body.add(head);
  const skull = new THREE.Mesh(gRBox(0.58, 0.56, 0.56, 0.08), skin);
  skull.castShadow = true;
  head.add(skull);
  const face = new THREE.Mesh(gPlane(0.52, 0.52), new THREE.MeshBasicMaterial({ map: faceTex(!!o.bot), transparent: true, toneMapped: !o.bot }));
  face.position.z = 0.285;
  head.add(face);
  if (o.bot) {
    const ant = new THREE.Mesh(gCyl(0.02, 0.02, 0.3, 6), std('#94a3b8', { metal: 0.9 }));
    ant.position.y = 0.42;
    const tip = new THREE.Mesh(gSph(0.06, 10, 8), accent);
    tip.position.y = 0.6;
    head.add(ant, tip);
  } else {
    const hair = new THREE.Mesh(gRBox(0.6, 0.14, 0.58, 0.05), std('#2a1a12', { rough: 0.9 }));
    hair.position.y = 0.3;
    head.add(hair);
  }
  if (o.crown) {
    const cr = new THREE.Mesh(gCyl(0.24, 0.3, 0.2, 8, ), std('#facc15', { metal: 1, rough: 0.2 }));
    cr.position.y = 0.4;
    head.add(cr);
  }
  const hold = new THREE.Group();
  hold.position.set(0, 2.55, 0);
  body.add(hold);
  root.add(blobShadow(0.6));
  return { root, body, legL, legR, armL, armR, head, hold, walk: 0 };
}

/** Pose an avatar for this frame. */
export function animateAvatar(a: AvatarRig, dt: number, o: { speed: number; carrying?: boolean; grabbing?: boolean; air?: boolean; t: number; emote?: boolean }) {
  const moving = o.speed > 0.3;
  a.walk += dt * (moving ? 3 + o.speed * 1.1 : 0);
  const sw = moving ? Math.sin(a.walk) * Math.min(0.9, 0.25 + o.speed * 0.08) : 0;
  a.legL.rotation.x = o.air ? -0.5 : sw;
  a.legR.rotation.x = o.air ? 0.4 : -sw;
  if (o.carrying) {
    a.armL.rotation.set(Math.PI - 0.15, 0, 0.12);
    a.armR.rotation.set(Math.PI - 0.15, 0, -0.12);
  } else if (o.grabbing) {
    const j = Math.sin(o.t * 30) * 0.15;
    a.armL.rotation.set(-1.4 + j, 0, 0);
    a.armR.rotation.set(-1.4 - j, 0, 0);
  } else if (o.emote) {
    a.armL.rotation.set(0, 0, 0.3);
    a.armR.rotation.set(Math.PI * 0.85 + Math.sin(o.t * 12) * 0.4, 0, -0.2);
  } else {
    a.armL.rotation.set(-sw * 0.9, 0, 0.05);
    a.armR.rotation.set(sw * 0.9, 0, -0.05);
  }
  a.body.position.y = moving && !o.air ? Math.abs(Math.sin(a.walk)) * 0.08 : Math.sin(o.t * 2) * 0.015;
}
