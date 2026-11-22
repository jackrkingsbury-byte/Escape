// Episode 13 ("Zero Aura") props. Same conventions as src/props.js (SPEC.md §2/§7): ES module, metres, Y up,
// deterministic (no Math.random / clocks); animated things are pure functions of the t / k passed in.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   tagTexture(text, style)     cached CanvasTexture of a glowing number ("4,210", "-2,000", "???" …).
//                               styles: gold | green | red | dim | blur | white | sign (red box, white text) | pink
//   makeAuraTag()               Group: Sprite number (bottom-centre anchored, always faces the camera) over a flat
//                               gold halo ring.  Origin = ring centre (put it ~0.15 m over the head top).
//                               userData.set({ text, style, w = 0.9, ring = true, ringColor, alpha = 1, lift = 0.1 })
//   makeTextSprite()            a bare Sprite (bottom-centre anchor) for floating signs.  userData.set(text, style, w)
//   makeSegNumber(str, { h })   chunky 7-segment number made of gold boxes (digits 0-9 + commas), centred on x,
//                               bottom at y = 0, faces +Z, with a soft additive glow card behind.
//                               userData.set(t, { k = 1 (scale-in), glow = 1 }), userData.width
//   makeBeams({ n, h, r, color, spread })   vertical additive light shafts. userData.set(t, a)
//   makeSparkles({ n, w, h, d })            drifting gold diamonds. userData.set(t, a)
//   makeGoldThrone()            throne on a 1.0 m dais with red-carpet steps. Origin = dais footprint centre (floor),
//                               front +Z (dais z −1.15…1.15, steps to 1.75).  userData.seat = local root spot for a
//                               character that sits ('sit', default seat height 0.55 above that spot).
//   makePhone()                 thin black phone with a glowing screen; origin = centre, screen faces +Z.
//   makeFlash()                 white flash burst (sphere + rays).  userData.set(k 0..1, 0 = hidden)
//   makeBench()                 wooden park bench, seat top y = 0.54, faces +Z.
//   makeCloud(seed)             puffy cloud cluster (~3 m).
//   makeShades()                chunky black sunglasses for a human head: parent to joints.head at SHADES_POS.
//   SHADES_POS                  [x, y, z] head-local spot for makeShades()
import * as THREE from 'three';
import { clamp, hash, canvasTexture } from '../lib/util.js';

const FONT = (s) => `${s}px "ITT World Display", "ITT Luckiest", "Luckiest Guy", Impact, sans-serif`;
const STYLES = {
  gold: { f1: '#fff6b0', f2: '#ffb300', stroke: '#5a2f00', glow: 'rgba(255,200,40,0.95)' },
  green: { f1: '#d8ffcf', f2: '#20c43a', stroke: '#063a10', glow: 'rgba(90,255,110,0.95)' },
  red: { f1: '#ffc4bd', f2: '#e8232b', stroke: '#3a0404', glow: 'rgba(255,40,40,0.95)' },
  dim: { f1: '#bdb08a', f2: '#8a7d58', stroke: '#2a241a', glow: 'rgba(0,0,0,0)' },
  blur: { f1: '#fff6b0', f2: '#ffb300', stroke: '#5a2f00', glow: 'rgba(255,200,40,0.95)', blur: 9 },
  white: { f1: '#ffffff', f2: '#dfe8ff', stroke: '#14182a', glow: 'rgba(255,255,255,0.7)' },
  pink: { f1: '#ffd0ea', f2: '#ff4fa3', stroke: '#3a0420', glow: 'rgba(255,80,170,0.9)' },
  sign: { box: '#d0142a', f1: '#ffffff', f2: '#ffffff', stroke: '#14182a', glow: 'rgba(0,0,0,0)' },
};
const TW = 1024, TH = 320;
const _tex = new Map();
export function tagTexture(text, style = 'gold') {
  const key = text + '|' + style;
  if (_tex.has(key)) return _tex.get(key);
  const st = STYLES[style] || STYLES.gold;
  const tex = canvasTexture(TW, TH, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    let s = 230; g.font = FONT(s);
    const maxW = st.box ? w - 200 : w - 110;
    while (g.measureText(text).width > maxW && s > 40) { s -= 6; g.font = FONT(s); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const y = h / 2 + s * 0.06;
    if (st.box) {
      const tw = g.measureText(text).width + 90, bh = s * 1.25;
      g.fillStyle = '#14182a'; roundRect(g, w / 2 - tw / 2 - 8, h / 2 - bh / 2 - 8, tw + 16, bh + 16, 40); g.fill();
      g.fillStyle = st.box; roundRect(g, w / 2 - tw / 2, h / 2 - bh / 2, tw, bh, 34); g.fill();
    }
    if (st.blur) g.filter = `blur(${st.blur}px)`;
    if (st.glow !== 'rgba(0,0,0,0)') { g.shadowColor = st.glow; g.shadowBlur = 46; }
    g.lineWidth = s * 0.17; g.strokeStyle = st.stroke; g.strokeText(text, w / 2, y);
    g.shadowBlur = 0; g.shadowColor = 'transparent';
    const gr = g.createLinearGradient(0, y - s * 0.5, 0, y + s * 0.5); gr.addColorStop(0, st.f1); gr.addColorStop(1, st.f2);
    g.fillStyle = gr; g.fillText(text, w / 2, y);
    if (!st.box && !st.blur) { g.globalAlpha = 0.5; g.fillStyle = '#ffffff'; g.fillRect(0, 0, 0, 0); g.globalAlpha = 1; }
  });
  _tex.set(key, tex);
  return tex;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

export function makeTextSprite() {
  const m = new THREE.SpriteMaterial({ map: tagTexture('0', 'gold'), transparent: true, depthWrite: false, toneMapped: false, fog: false });
  const s = new THREE.Sprite(m); s.center.set(0.5, 0); s.renderOrder = 5;
  s.userData.set = (text, style = 'gold', w = 0.9, alpha = 1) => {
    m.map = tagTexture(String(text), style); m.opacity = alpha; s.scale.set(w, w * TH / TW, 1); s.visible = alpha > 0.001;
  };
  return s;
}

const RING_GEO = new THREE.TorusGeometry(0.3, 0.032, 8, 36);
export function makeAuraTag() {
  const g = new THREE.Group();
  const sprite = makeTextSprite(); g.add(sprite);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffd23f', toneMapped: false, transparent: true });
  const ring = new THREE.Mesh(RING_GEO, ringMat); ring.rotation.x = Math.PI / 2; g.add(ring);
  g.userData = {
    sprite, ring,
    set({ text = '0', style = 'gold', w = 0.9, ring: showRing = true, ringColor = null, alpha = 1, lift = 0.1, ringScale = 1 } = {}) {
      sprite.userData.set(text, style, w, alpha);
      sprite.position.y = lift;
      ring.visible = showRing && alpha > 0.01;
      ringMat.color.set(ringColor || (style === 'red' ? '#ff3b30' : style === 'green' ? '#5bff6b' : style === 'dim' ? '#8a7d58' : '#ffd23f'));
      ringMat.opacity = alpha;
      ring.scale.setScalar(ringScale);
      g.visible = alpha > 0.001;
    },
  };
  return g;
}

// ── 7-segment gold number
const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
let _glowTex = null;
function glowTex() {
  if (_glowTex) return _glowTex;
  _glowTex = canvasTexture(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,220,120,0.9)'); gr.addColorStop(0.45, 'rgba(255,180,40,0.35)'); gr.addColorStop(1, 'rgba(255,160,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  return _glowTex;
}
export function makeSegNumber(str, { h = 1.6, color = '#ffd23f', emissive = '#ff9d00' } = {}) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.25 });
  const edge = new THREE.MeshStandardMaterial({ color: '#7a4a00', roughness: 0.6 });
  const W = 0.56 * h, T = 0.17 * h, D = 0.22 * h, gap = 0.26 * h, comma = 0.34 * h;
  const chars = String(str).split('');
  let total = 0; for (const c of chars) total += c === ',' ? comma : W + gap; total -= gap;
  let x = -total / 2;
  const seg = (cx, cy, w, hh) => {
    const m = new THREE.Mesh(UNIT_BOX, mat); m.scale.set(w, hh, D); m.position.set(cx, cy, 0); m.castShadow = true; inner.add(m);
    const b = new THREE.Mesh(UNIT_BOX, edge); b.scale.set(w + 0.05 * h, hh + 0.05 * h, D * 0.6); b.position.set(cx, cy, -D * 0.35); inner.add(b);
  };
  for (const c of chars) {
    if (c === ',') {
      seg(x + comma * 0.45, T * 0.5, T, T); seg(x + comma * 0.3, -T * 0.35, T * 0.55, T * 0.9);
      x += comma; continue;
    }
    const s = SEGS[c] || '';
    const L = x, R = x + W, cx = x + W / 2, vh = (h - T) / 2;
    if (s.includes('a')) seg(cx, h - T / 2, W, T);
    if (s.includes('g')) seg(cx, h / 2, W, T);
    if (s.includes('d')) seg(cx, T / 2, W, T);
    if (s.includes('f')) seg(L + T / 2, h * 0.75, T, vh + T * 0.2);
    if (s.includes('b')) seg(R - T / 2, h * 0.75, T, vh + T * 0.2);
    if (s.includes('e')) seg(L + T / 2, h * 0.25, T, vh + T * 0.2);
    if (s.includes('c')) seg(R - T / 2, h * 0.25, T, vh + T * 0.2);
    x += W + gap;
  }
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  glow.scale.set(total * 1.35, h * 3.2, 1); glow.position.set(0, h / 2, -D * 1.2); inner.add(glow);
  g.userData = {
    width: total, mat, glow,
    set(t, { k = 1, glow: gl = 1 } = {}) {
      inner.scale.setScalar(Math.max(0.001, k));
      mat.emissiveIntensity = (0.75 + 0.25 * Math.sin(t * 6)) * gl;
      glow.material.opacity = 0.85 * gl;
      g.visible = k > 0.002;
    },
  };
  return g;
}

const BEAM_GEO = new THREE.CylinderGeometry(0.5, 1, 1, 18, 1, true);
export function makeBeams({ n = 6, h = 40, r = 0.8, color = '#ffe08a', spread = 6 } = {}) {
  const g = new THREE.Group(), beams = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(BEAM_GEO, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
    const x = (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
    m.scale.set(r * (0.8 + 0.4 * hash(i)), h, r * (0.8 + 0.4 * hash(i))); m.position.set(x, h / 2, (hash(i * 3.1) - 0.5) * 0.8);
    m.rotation.z = (i / Math.max(1, n - 1) - 0.5) * -0.25;
    g.add(m); beams.push(m);
  }
  g.userData = { set(t, a = 1) { beams.forEach((b, i) => { b.material.opacity = a * (0.13 + 0.07 * Math.sin(t * 2.3 + i * 1.7)); }); g.visible = a > 0.001; } };
  return g;
}

const SPARK_GEO = new THREE.OctahedronGeometry(0.07, 0);
export function makeSparkles({ n = 40, w = 6, h = 4, d = 3 } = {}) {
  const g = new THREE.Group(), list = [];
  const mat = new THREE.MeshBasicMaterial({ color: '#fff1a8', toneMapped: false, transparent: true });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(SPARK_GEO, mat); g.add(m); list.push(m); }
  g.userData = {
    set(t, a = 1) {
      mat.opacity = a;
      list.forEach((m, i) => {
        const u = (hash(i * 1.3) + t * (0.08 + 0.06 * hash(i * 7.7))) % 1;
        m.position.set((hash(i * 2.1) - 0.5) * w + 0.2 * Math.sin(t * 1.3 + i), u * h, (hash(i * 4.4) - 0.5) * d);
        const tw = 0.5 + 0.5 * Math.sin(t * 7 + i * 2.3);
        m.scale.setScalar((0.5 + tw) * Math.sin(Math.PI * u));
        m.rotation.y = t * 2 + i;
      });
      g.visible = a > 0.001;
    },
  };
  return g;
}

function bx(g, w, h, d, c, x, y, z, mat = null) {
  const m = new THREE.Mesh(UNIT_BOX, mat || new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.15 }));
  m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
export function makeGoldThrone() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#f2b82a', emissive: '#7a4a00', emissiveIntensity: 0.35, roughness: 0.32, metalness: 0.45 });
  const goldD = new THREE.MeshStandardMaterial({ color: '#c88a14', roughness: 0.4, metalness: 0.4 });
  const red = new THREE.MeshStandardMaterial({ color: '#c0182f', roughness: 0.7 });
  const DH = 1.0;
  // dais
  bx(g, 2.6, DH, 2.3, 0, 0, DH / 2, 0, red);
  bx(g, 2.7, 0.1, 2.4, 0, 0, DH - 0.02, 0, gold);
  bx(g, 2.7, 0.12, 2.4, 0, 0, 0.06, 0, goldD);
  for (const s of [-1, 1]) bx(g, 0.12, DH, 0.12, 0, s * 1.3, DH / 2, 1.15, gold);
  // steps (red carpet with gold nosing)
  for (let k = 0; k < 3; k++) {
    const hh = DH * (3 - k) / 4, z = 1.15 + 0.12 + k * 0.24;
    bx(g, 1.8, hh, 0.24, 0, 0, hh / 2, z, red);
    bx(g, 1.84, 0.05, 0.26, 0, 0, hh - 0.02, z, gold);
  }
  // throne on the dais
  const y0 = DH;
  bx(g, 1.3, 0.44, 0.9, 0, 0, y0 + 0.22, 0.38, gold);              // seat block (top at 0.44)
  bx(g, 1.06, 0.11, 0.78, 0, 0, y0 + 0.495, 0.4, red);              // cushion (top at 0.55)
  bx(g, 2.0, 2.5, 0.22, 0, 0, y0 + 1.25, -0.12, gold);               // back
  bx(g, 1.4, 1.75, 0.06, 0, 0, y0 + 1.42, 0.0, red);                 // back cushion
  bx(g, 2.12, 0.16, 0.3, 0, 0, y0 + 2.52, -0.12, goldD);             // top rail
  for (const s of [-1, 1]) {
    bx(g, 0.2, 0.36, 0.9, 0, s * 0.62, y0 + 0.62, 0.38, gold);       // armrests
    bx(g, 0.26, 0.12, 1.0, 0, s * 0.62, y0 + 0.82, 0.4, goldD);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), gold); knob.position.set(s * 0.92, y0 + 2.78, -0.12); knob.castShadow = true; g.add(knob);
    const knob2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), gold); knob2.position.set(s * 0.62, y0 + 0.96, 0.82); g.add(knob2);
  }
  // crown point on top
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 4), gold); cone.position.set(0, y0 + 2.85, -0.12); cone.rotation.y = Math.PI / 4; g.add(cone);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshStandardMaterial({ color: '#ff2b6a', emissive: '#a0003a', emissiveIntensity: 0.8, roughness: 0.2 }));
  gem.position.set(0, y0 + 2.0, 0.05); g.add(gem);
  g.userData = { seat: new THREE.Vector3(0, y0, 0.16), daisH: DH, gem };
  return g;
}

export function makePhone() {
  const g = new THREE.Group();
  bx(g, 0.085, 0.165, 0.014, 0, 0, 0, 0, new THREE.MeshStandardMaterial({ color: '#15151a', roughness: 0.4 }));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.072, 0.145), new THREE.MeshBasicMaterial({ color: '#6fd3ff', toneMapped: false }));
  scr.position.z = 0.0075; g.add(scr);
  return g;
}

export function makeFlash() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, toneMapped: false, depthWrite: false });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), mat); g.add(core);
  const rays = [];
  for (let i = 0; i < 10; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.7, 6), mat); const a = i / 10 * Math.PI * 2; r.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0); r.rotation.z = a - Math.PI / 2; g.add(r); rays.push(r); }
  g.userData = { set(k, base = 1) { g.visible = k > 0.01; mat.opacity = clamp(k, 0, 1); g.scale.setScalar(base * (0.4 + 1.1 * k)); } };
  return g;
}

export function makeBench() {
  const g = new THREE.Group(), w = '#9a6a3c';
  bx(g, 1.6, 0.08, 0.5, w, 0, 0.5, 0);
  bx(g, 1.6, 0.46, 0.06, w, 0, 0.85, -0.22);
  for (const s of [-1, 1]) bx(g, 0.08, 0.5, 0.45, '#2a2a30', s * 0.7, 0.25, 0);
  return g;
}

export function makeCloud(seed = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#dfe8f5', emissiveIntensity: 0.35 });
  for (let i = 0; i < 7; i++) {
    const r = 0.6 + 0.6 * hash(seed * 9 + i);
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
    s.position.set((i - 3) * 0.55 + (hash(seed + i * 3) - 0.5) * 0.4, (hash(seed * 2 + i) - 0.3) * 0.5, (hash(seed * 5 + i) - 0.5) * 0.6);
    g.add(s);
  }
  return g;
}

export const SHADES_POS = [0, 0.335, 0.3];
export function makeShades() {
  const g = new THREE.Group();
  const blk = new THREE.MeshStandardMaterial({ color: '#0d0d12', roughness: 0.25, metalness: 0.3 });
  for (const s of [-1, 1]) {
    const lens = bx(g, 0.24, 0.13, 0.03, 0, s * 0.14, 0, 0, blk);
    const glint = bx(g, 0.05, 0.02, 0.005, 0, s * 0.14 - 0.05, 0.035, 0.017, new THREE.MeshBasicMaterial({ color: '#9fb4d8' }));
    const arm = bx(g, 0.02, 0.025, 0.3, 0, s * 0.31, 0.03, -0.15, blk);
    void lens; void glint; void arm;
  }
  bx(g, 0.1, 0.03, 0.03, 0, 0, 0.035, 0, blk);
  return g;
}
