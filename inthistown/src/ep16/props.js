// Episode 16 ("Don't Whistle") props + sets.  Same conventions as src/props.js (SPEC.md §2/§7): ES module, metres,
// Y up, deterministic (no Math.random / clocks); animated things are pure functions of the t / u passed in.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   buildHarbour()   → Set   the harbour town (own sky, sea, lights).  Root at the origin, +X = out to sea.
//        Layout: main street along X (z = 0, road ±4, pavements to ±6.5, house fronts at z = ±7) from x = −70 to the
//        quay; the quay promenade x ∈ [−4, 0] with quay houses facing the sea (+X); quay edge at x = 0, sea level
//        SEA_Y; the wooden pier from x = 0 to PIER.x1 along z = 0 (deck top y = 0, half width PIER.half, end platform
//        wider); the lighthouse on rocks at LH; boats moored around the pier; Mr. Dobbs' front room on the quay
//        (DOBBS); the kid's quay house with an upstairs window (MYWIN); the fish stall + megaphone (STALL); the
//        NO WHISTLING sign at the pier entrance (SIGN).
//        Lighting presets: 'dusk' | 'day' | 'night' | 'storm' | 'dawn'.
//        options: lighting, seaAmp (wave height, m), lamp ('on' | 'off' | 'flicker' | 'gone'), frontRoom (bool),
//                 windowGlow (0..1), bunting (bool), boatsRock (0..1 extra rocking)
//        extras: set.lights = { fill, glow, glow2 } point lights (intensity reset to 0 every frame by update; shots
//                 move/colour them each frame), set.flash(k) lightning boost for this frame, set.bulge(x, z, h, r)
//                 sea bump for this frame, set.lighthouse (Group: userData.lamp, userData.lampHome, userData.crack),
//                 set.frontRoom (Group), set.boats [Group], set.sea (Mesh), set.megaphone (on the stall),
//                 set.stall, set.sign
//   buildUnder()     → Set   underwater: blue fog, light shafts, seaweed, rising bubbles.  set.bubbles, set.lights.glow
//   makeGulp()       → Group  the sea monster, unit size (dome radius 1 at the water line; scale it ~10–16).
//        +Z = front.  userData.set(t, { rise 0..1, lid 0..1, mouth 0..1, sway, limp 0..1, glow, lookX, lookY,
//        flash 0..1, tentRise 0..1, brow }) ; userData.eyeWorld() → Vector3 ; userData.tentacles
//   makeTentacles(count, { nSeg, color })  → Group of instanced chains.  userData.set(i, base:Matrix4, len, r0, r1,
//        angleFn(s, u) → [ax, az]) ; userData.hide(i) ; userData.tip(i) → Vector3 (group-local), userData.tipMatrix(i)
//   shape({ bend, curl, sway, t, phase, wave, limp, twist })  → angleFn for makeTentacles
//   makeBoat(hull, sail), makeSign(kind 'whistle' | 'kettle'), makeKettle(), makeIceCreamVan(), makeBike(),
//   makeMegaphone(), makeMedal(), makeSailorCap(), makeNotes(n, color), makeRain(n), makeBolt(seed),
//   makeSnoreBubbles(n), makeSoundRings(n), makeWindowBay(), makeHuss bubble: makeHussBubble(),
//   makePlanks(n), makeSplash(), makeNightView() (bedroom window backdrop)
//   constants: SEA_Y, PIER, LH, DOBBS, MYWIN, STALL, SIGN, GULP_POS
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, hash, canvasTexture, rng, smooth } from '../lib/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const FONTD = (s) => `${s}px "ITT World Display", "Luckiest Guy", Impact, "DejaVu Sans", sans-serif`;
const FONTW = (s) => `900 ${s}px "ITT World Text", "Nunito", "DejaVu Sans", Arial, sans-serif`;

export const SEA_Y = -0.9;
export const PIER = { x0: 0, x1: 44, half: 2.2, endHalf: 4.2, endX: 38 };
export const LH = { x: 58, z: -24, base: 1.8, gallery: 19.6, lampY: 20.9, top: 25.5 };
export const DOBBS = { x: -4, z: -14, w: 5.2 };            // front room on the quay in front of the house at z −14
export const MYWIN = { x: -3.9, y: 5.0, z: 13 };           // outside face of the kid's upstairs window (faces +X)
export const STALL = { x: -2.2, z: 5.6 };                  // fish stall on the quay, faces −Z (toward the pier mouth)
export const SIGN = { x: 1.2, z: -3.1 };                   // NO WHISTLING sign at the pier entrance, faces −X
export const GULP_POS = { x: 66, z: 3 };

// ───────────────────────────────────────────────────────────────────────────── small helpers
const _mats = new Map();
export function std(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!_mats.has(k)) _mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o }));
  return _mats.get(k);
}
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'string' ? std(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function cyl(rt, rb, h, m, seg = 16) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; o.receiveShadow = true; return o; }
function sph(r, m, ws = 16, hs = 12) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
let _glow = null;
export const glowTex = () => _glow ??= canvasTexture(256, 256, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
export function glowSprite(color, size = 1, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity, fog: false }));
  s.scale.set(size, size, 1); return s;
}
let _fog = null;
const fogTex = () => _fog ??= canvasTexture(256, 256, (g, w, h) => {
  for (let i = 0; i < 9; i++) {
    const x = w * (0.3 + 0.4 * hash(i * 1.7)), y = h * (0.35 + 0.3 * hash(i * 2.9)), r = w * (0.18 + 0.16 * hash(i * 4.1));
    const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.42)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
});
export function makeFogBank({ n = 26, w = 40, d = 14, h = 1.2, size = 7, color = '#9fb3c8', opacity = 0.3 } = {}) {
  const g = new THREE.Group(), list = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex(), color, transparent: true, depthWrite: false, opacity, fog: false }));
    g.add(s); list.push(s);
  }
  g.userData = {
    set(t, a = 1) {
      list.forEach((s, i) => {
        const u = (hash(i * 1.37) + t * 0.012 * (0.5 + hash(i * 3.1))) % 1;
        s.position.set((u - 0.5) * w, h * (0.25 + 0.6 * hash(i * 4.7)) + 0.15 * Math.sin(t * 0.4 + i), (hash(i * 2.2) - 0.5) * d);
        const sc = size * (0.7 + 0.6 * hash(i * 5.9));
        s.scale.set(sc * 1.8, sc * 0.6, 1);
        s.material.opacity = a * opacity * (0.6 + 0.4 * hash(i * 6.6)) * Math.sin(PI * u);
        s.material.rotation = t * 0.03 * (i % 2 ? 1 : -1) + i;
      });
    },
  };
  return g;
}

/** Merges boxes / custom geometries with vertex colours into one mesh. */
class Merger {
  constructor() { this.list = []; this.m = new THREE.Matrix4(); }
  push(g, c) {
    if (g.index) g = g.toNonIndexed();
    if (g.attributes.uv) g.deleteAttribute('uv');
    if (g.attributes.uv1) g.deleteAttribute('uv1');
    g.applyMatrix4(this.m);
    const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    this.list.push(g);
  }
  box(c, x, y, z, w, h, d, ry = 0, rx = 0, rz = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry);
    g.translate(x, y, z); this.push(g, c);
  }
  cyl(c, x, y, z, rt, rb, h, seg = 10, rx = 0, rz = 0) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); g.translate(x, y, z); this.push(g, c);
  }
  sph(c, x, y, z, r, sx = 1, sy = 1, sz = 1, seg = 10) { const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg - 3)); g.scale(sx, sy, sz); g.translate(x, y, z); this.push(g, c); }
  prism(c, x, y, z, w, h, d) { const g = prismGeo(w, h, d); g.translate(x, y, z); this.push(g, c); }
  build(material, { cast = true, receive = true } = {}) {
    const geo = mergeGeometries(this.list, false); this.list.forEach((g) => g.dispose());
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, material); mesh.castShadow = cast; mesh.receiveShadow = receive; return mesh;
  }
}
function prismGeo(w, h, d) {
  const x = w / 2, z = d / 2;
  const p = [
    -x, 0, z, x, 0, z, x, h, 0, -x, 0, z, x, h, 0, -x, h, 0,
    x, 0, -z, -x, 0, -z, -x, h, 0, x, 0, -z, -x, h, 0, x, h, 0,
    x, 0, z, x, 0, -z, x, h, 0,
    -x, 0, -z, -x, 0, z, -x, h, 0,
  ];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
}

// ───────────────────────────────────────────────────────────────────────────── sky + sea
const SKY_PRESETS = {
  dusk: { top: '#3a2c74', mid: '#c9649a', hor: '#ffb07a', fog: ['#c98a92', 40, 230], hemi: ['#ffd6c0', '#4a3a6a', 1.15], key: ['#ffb27a', 2.2, [60, 18, -30]], sea: ['#2b4f7a', '#ff9a7a'], win: 0.85, lamps: 0.8, stars: 0.25, sun: 1, bg: '#c9649a' },
  day: { top: '#3f9be8', mid: '#7cc4ff', hor: '#d8f1ff', fog: ['#cfe8f6', 60, 300], hemi: ['#ffffff', '#6a8a6a', 1.35], key: ['#fff1d8', 2.6, [30, 50, 25]], sea: ['#1f7fb0', '#c8f0ff'], win: 0, lamps: 0, stars: 0, sun: 0, bg: '#7cc4ff' },
  night: { top: '#070b22', mid: '#121a44', hor: '#2a3a6a', fog: ['#16203f', 30, 190], hemi: ['#8aa0ff', '#1a1a2a', 0.55], key: ['#9fb4ff', 0.9, [-30, 40, 20]], sea: ['#0d1a33', '#3a5a8a'], win: 1, lamps: 1, stars: 1, sun: 0, bg: '#121a44' },
  storm: { top: '#0c0f16', mid: '#1b2130', hor: '#2c3445', fog: ['#272e3c', 18, 120], hemi: ['#8a9ab8', '#181c24', 0.6], key: ['#aab8d8', 0.7, [-20, 40, 30]], sea: ['#131c28', '#8aa0b8'], win: 0.9, lamps: 1, stars: 0, sun: 0, bg: '#1b2130' },
  dawn: { top: '#4a5aa8', mid: '#e48aa6', hor: '#ffd29a', fog: ['#f0b8a8', 50, 260], hemi: ['#ffe0d0', '#5a5a7a', 1.25], key: ['#ffc890', 2.3, [70, 14, 20]], sea: ['#3a6a9a', '#ffc0a0'], win: 0.3, lamps: 0.2, stars: 0, sun: 1, bg: '#e48aa6' },
};
function makeSky() {
  const geo = new THREE.SphereGeometry(600, 32, 16);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uFlash: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform float uFlash; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h < 0.0 ? uHor : (h < 0.18 ? mix(uHor, uMid, h / 0.18) : mix(uMid, uTop, clamp((h - 0.18) / 0.6, 0.0, 1.0)));
        c = mix(c, vec3(0.85, 0.9, 1.0), uFlash); gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = -10; m.frustumCulled = false; return m;
}
function makeStars(n = 500) {
  const R = rng(16), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = R() * PI * 2, e = 0.12 + R() * 1.2; pos[i * 3] = Math.cos(a) * Math.cos(e) * 560; pos[i * 3 + 1] = Math.sin(e) * 560; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 560; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }));
  p.frustumCulled = false; return p;
}
/** The animated sea: flat-shaded low-poly waves (vertex shader), foam on the crests, plus an optional bulge. */
function makeSea() {
  const geo = new THREE.PlaneGeometry(420, 420, 168, 168); geo.rotateX(-PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: '#1f5f8a', roughness: 0.32, metalness: 0.05, flatShading: true });
  const U = { uTime: { value: 0 }, uAmp: { value: 0.18 }, uFoam: { value: new THREE.Color('#e8f4ff') }, uFoamK: { value: 0.6 },
    uBulge: { value: new THREE.Vector4(0, 0, 0, 1) }, uGlowC: { value: new THREE.Color('#40ff70') }, uGlow: { value: new THREE.Vector4(0, 0, 0, 1) } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
      uniform float uTime; uniform float uAmp; uniform vec4 uBulge; varying float vH; varying vec2 vXZ;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 wp0 = modelMatrix * vec4(position, 1.0);
      float x = wp0.x, z = wp0.z;
      float w = sin(x * 0.16 + uTime * 0.9) * 0.5 + sin(z * 0.23 - uTime * 1.13) * 0.35 + sin((x + z) * 0.41 + uTime * 1.7) * 0.22 + sin((x - z) * 0.9 + uTime * 2.3) * 0.08;
      vH = w; vXZ = vec2(x, z);
      float bd = length(vec2(x, z) - uBulge.xy);
      float b = uBulge.z * exp(-bd * bd / (uBulge.w * uBulge.w));
      transformed.y += uAmp * w + b; if (b > 0.05) vH += b * 0.8;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform vec3 uFoam; uniform float uFoamK; uniform vec3 uGlowC; uniform vec4 uGlow; varying float vH; varying vec2 vXZ;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb = mix(diffuseColor.rgb, uFoam, smoothstep(0.62, 1.05, vH) * uFoamK);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float gd = length(vXZ - uGlow.xy); totalEmissiveRadiance += uGlowC * uGlow.z * exp(-gd * gd / (uGlow.w * uGlow.w));`);
  };
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.userData.U = U; return m;
}

// ───────────────────────────────────────────────────────────────────────────── town pieces
const WALLS = ['#f2e2c0', '#c9e4f2', '#f2c4c4', '#d6e8c4', '#f3e3a5', '#cbbfe6', '#ffffff', '#ffd8b0', '#bfe3dc'];
const ROOFS = ['#b5543f', '#4a5d7e', '#6b4a3a', '#3f7a5a', '#8a3a4a', '#2f5f8a'];
/** One chunky house into the mergers (local frame set on the mergers: front = +Z, origin = front-centre at ground). */
function addHouse(B, Wm, w, d, floors, wall, roof, seed, { door = true, shop = null } = {}) {
  const h = floors * 2.9 + 0.4;
  B.box(wall, 0, h / 2, -d / 2, w, h, d);
  B.box('#8a8078', 0, 0.2, -d / 2 + 0.03, w + 0.08, 0.4, d + 0.06);         // plinth
  B.prism(roof, 0, h, -d / 2, w + 0.5, 1.6 + 0.5 * hash(seed), d + 0.7);
  B.box(shade(wall, 0.85), 0, h - 0.1, 0.06, w + 0.12, 0.22, 0.14);        // eave band
  if (hash(seed * 3.1) > 0.35) { const cx = (hash(seed * 5.3) - 0.5) * w * 0.6; B.box('#9a5a48', cx, h + 1.4, -d * 0.6, 0.6, 1.6, 0.6); B.box('#5a3a30', cx, h + 2.25, -d * 0.6, 0.72, 0.15, 0.72); }
  const nw = w > 7.5 ? 3 : 2;
  for (let f = 0; f < floors; f++) {
    for (let j = 0; j < nw; j++) {
      const x = (j - (nw - 1) / 2) * (w / nw);
      if (f === 0 && door && j === Math.floor(nw / 2) && !shop) continue;
      const y = f * 2.9 + 1.75;
      B.box('#fbf6ea', x, y, 0.04, 1.25, 1.55, 0.1);                        // frame
      Wm.box('#ffffff', x, y, 0.1, 1.0, 1.3, 0.04);                          // pane (glows)
      B.box('#fbf6ea', x, y, 0.13, 0.07, 1.3, 0.04); B.box('#fbf6ea', x, y, 0.13, 1.0, 0.07, 0.04);
      B.box(shade(wall, 0.8), x, y - 0.82, 0.16, 1.4, 0.12, 0.3);           // sill
      if (f > 0 && hash(seed * 7 + j + f) > 0.5) { B.box('#a0603a', x, y - 0.68, 0.32, 1.2, 0.2, 0.3); for (let k = 0; k < 3; k++) B.sph(['#ff4fa3', '#ffd23f', '#ff7a2f', '#ffffff'][(k + j) % 4], x - 0.4 + k * 0.4, y - 0.5, 0.34, 0.16); }
    }
  }
  if (door) {
    const dx = 0;
    B.box(shade(roof, 1.1), dx, 1.1, 0.06, 1.1, 2.2, 0.1);
    B.box('#ffd23f', dx + 0.35, 1.1, 0.13, 0.08, 0.08, 0.06);
    B.box('#fbf6ea', dx, 2.3, 0.1, 1.4, 0.16, 0.2);
  }
  if (shop) {
    // striped awning + shop window
    const aw = w * 0.85;
    for (let k = 0; k < 8; k++) B.box(k % 2 ? '#ffffff' : shop, -aw / 2 + aw * (k + 0.5) / 8, 2.75, 0.75, aw / 8, 0.1, 1.5, 0, 0.35);
  }
}
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }

/** Street lamp into mergers; returns lantern world pos. */
function addLamp(B, Wm, x, z, h = 4.2) {
  B.cyl('#2b2f3a', x, h / 2, z, 0.08, 0.12, h, 8);
  B.cyl('#2b2f3a', x, 0.15, z, 0.22, 0.26, 0.3, 8);
  B.box('#2b2f3a', x, h + 0.05, z, 0.5, 0.1, 0.5);
  Wm.box('#ffffff', x, h + 0.38, z, 0.36, 0.55, 0.36);
  B.box('#2b2f3a', x, h + 0.72, z, 0.55, 0.12, 0.55);
  return V(x, h + 0.38, z);
}

// ───────────────────────────────────────────────────────────────────────────── the lighthouse
function crackTex() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#26394f'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(160,210,255,0.45)'); gr.addColorStop(1, 'rgba(60,90,130,0.2)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
    const R = rng(9);
    const branch = (x, y, a, len, wd, depth) => {
      g.lineWidth = wd; g.beginPath(); g.moveTo(x, y);
      let cx = x, cy = y;
      for (let k = 0; k < 4; k++) { a += (R() - 0.5) * 0.9; cx += Math.cos(a) * len / 4; cy += Math.sin(a) * len / 4; g.lineTo(cx, cy); }
      g.stroke();
      if (depth > 0) { branch(cx, cy, a + 0.7, len * 0.6, wd * 0.6, depth - 1); branch(cx, cy, a - 0.7, len * 0.55, wd * 0.6, depth - 1); }
    };
    for (let k = 0; k < 5; k++) branch(128, 118, k * 1.26 + 0.3, 110, 8, 2);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128, 118, 12, 0, PI * 2); g.fill();
  });
}
export function makeLighthouse() {
  const g = new THREE.Group();
  // rocks
  const rockM = std('#6f6a66', { roughness: 0.95 }), rockM2 = std('#857e78', { roughness: 0.95 });
  const R = rng(4);
  for (let i = 0; i < 14; i++) {
    const s = 2 + R() * 3.5, a = R() * PI * 2, r = R() * 6;
    const b = box(s * 1.3, s, s, i % 2 ? rockM : rockM2, Math.cos(a) * r, -1 + s * 0.35 + R() * 0.6, Math.sin(a) * r);
    b.rotation.set(R() * 0.6, R() * PI, R() * 0.5); g.add(b);
  }
  const plinth = cyl(3.2, 3.6, 1.2, '#d8d2c8', 20); plinth.position.y = LH.base - 0.6; g.add(plinth);
  // striped tower
  const H = LH.gallery - LH.base, n = 6;
  for (let k = 0; k < n; k++) {
    const y0 = LH.base + k * H / n, r0 = lerp(2.5, 1.75, k / n), r1 = lerp(2.5, 1.75, (k + 1) / n);
    const s = cyl(r1, r0, H / n, k % 2 ? '#d63a3a' : '#f6f2ea', 24); s.position.y = y0 + H / n / 2; g.add(s);
  }
  // door + small windows
  const door = box(1.1, 2.0, 0.3, '#3a2a22', 0, LH.base + 1.0, 2.45); g.add(door);
  for (const y of [7, 12]) { const w = box(0.6, 0.9, 0.3, basic('#ffe7a0'), 0, y, lerp(2.5, 1.75, (y - LH.base) / H) - 0.02); g.add(w); }
  // the cracked window just under the gallery (faces +Z)
  const crackM = new THREE.MeshStandardMaterial({ map: crackTex(), roughness: 0.25, emissive: '#ffffff', emissiveMap: null, emissiveIntensity: 0 });
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.5), crackM); crack.position.set(0, LH.gallery - 1.6, 1.89); crack.rotation.x = -0.03; g.add(crack);
  const cframe = box(1.35, 1.7, 0.12, '#f6f2ea', 0, LH.gallery - 1.6, 1.8); g.add(cframe);
  // gallery
  const deck = cyl(2.7, 2.7, 0.35, '#2b2f3a', 28); deck.position.y = LH.gallery; g.add(deck);
  const railM = std('#2b2f3a');
  const railTop = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.06, 6, 40), railM); railTop.rotation.x = PI / 2; railTop.position.y = LH.gallery + 1.15; g.add(railTop);
  const railMid = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.04, 6, 40), railM); railMid.rotation.x = PI / 2; railMid.position.y = LH.gallery + 0.62; g.add(railMid);
  for (let k = 0; k < 20; k++) { const a = k / 20 * PI * 2; const p = cyl(0.04, 0.04, 1.0, railM, 6); p.position.set(Math.cos(a) * 2.6, LH.gallery + 0.65, Math.sin(a) * 2.6); g.add(p); }
  // lamp room: glass ring + posts + roof
  const glassM = new THREE.MeshStandardMaterial({ color: '#9fd8ff', roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false });
  const glass = cyl(1.45, 1.45, 2.3, glassM, 20); glass.position.y = LH.gallery + 1.35; glass.castShadow = false; g.add(glass);
  for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; const p = cyl(0.07, 0.07, 2.3, '#2b2f3a', 6); p.position.set(Math.cos(a) * 1.47, LH.gallery + 1.35, Math.sin(a) * 1.47); g.add(p); }
  const ring = cyl(1.6, 1.6, 0.25, '#2b2f3a', 20); ring.position.y = LH.gallery + 2.55; g.add(ring);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 2.2, 20), std('#c42f2f', { roughness: 0.55 })); roof.position.y = LH.gallery + 3.75; roof.castShadow = true; g.add(roof);
  const ball = sph(0.28, '#2b2f3a'); ball.position.y = LH.gallery + 5.0; g.add(ball);
  // the lamp (separate so a tentacle can take it): bright core + lens + glow + rotating beam
  const lamp = new THREE.Group(); lamp.position.set(0, LH.lampY, 0); g.add(lamp);
  const lampBase = cyl(0.5, 0.6, 0.35, '#3a3d46', 12); lampBase.position.y = -0.5; lamp.add(lampBase);
  const coreM = basic('#fff3b0', { toneMapped: false });
  const core = sph(0.55, coreM, 16, 12); core.castShadow = false; lamp.add(core);
  const lens = cyl(0.62, 0.62, 0.9, std('#ffd86a', { emissive: '#ffb030', emissiveIntensity: 1.2, roughness: 0.2 }), 10); lamp.add(lens);
  const halo = glowSprite('#fff0a0', 7, 0.9); lamp.add(halo);
  const beamM = new THREE.MeshBasicMaterial({ color: '#fff4c0', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const beamGeo = new THREE.CylinderGeometry(4.5, 0.4, 70, 16, 1, true); beamGeo.translate(0, 35, 0); beamGeo.rotateZ(-PI / 2);
  const beam = new THREE.Group(); lamp.add(beam);
  const b1 = new THREE.Mesh(beamGeo, beamM), b2 = new THREE.Mesh(beamGeo, beamM); b2.rotation.y = PI; beam.add(b1, b2);
  g.userData = { lamp, lampHome: lamp.position.clone(), core, coreM, lens, halo, beam, crack, crackM, glass };
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── boats, signs, misc props
export function makeBoat(hull = '#d6453a', sail = '#ffd23f', seed = 1) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  inner.add(box(4.2, 0.9, 1.8, hull, 0, 0.25, 0));
  const bow = new THREE.Mesh(prismGeo(1.8, 1.3, 0.9), std(hull)); bow.rotation.set(0, PI / 2, PI / 2); bow.position.set(2.1, 0.7, 0); bow.scale.set(1, 1, 1); inner.add(bow);
  inner.add(box(4.25, 0.16, 1.85, '#ffffff', 0, 0.62, 0));
  inner.add(box(3.8, 0.12, 1.5, '#a0703a', 0, 0.6, 0));
  inner.add(box(1.2, 0.9, 1.1, '#f6f2ea', -0.9, 1.1, 0));
  inner.add(box(1.3, 0.1, 1.2, '#2f5f8a', -0.9, 1.6, 0));
  inner.add(box(0.5, 0.35, 0.05, basic('#9fd8ff'), -0.3, 1.2, 0.0));
  const mast = cyl(0.06, 0.07, 4, '#6b4a3a', 8); mast.position.set(0.6, 2.6, 0); inner.add(mast);
  const flags = [];
  const fc = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#ff7a2f', '#4fb3ff', '#8a5cff'];
  for (let k = 0; k < 5; k++) { const f = box(0.42, 0.3, 0.02, fc[(k + seed) % fc.length], 0.6 - 0.35 - k * 0.42, 4.4 - k * 0.55, 0); f.castShadow = false; inner.add(f); flags.push(f); }
  const line = box(2.4, 0.015, 0.015, '#2b2b2b', -0.6, 3.3, 0); line.rotation.z = 0.55; inner.add(line);
  // net + buoys
  inner.add(box(0.8, 0.25, 0.8, '#3f7a5a', 1.2, 0.8, 0.3));
  for (const s of [-1, 1]) { const b = sph(0.16, '#ff7a2f', 10, 8); b.position.set(-1.6, 0.55, s * 0.95); inner.add(b); }
  g.userData = { inner, flags, set(t, rock = 0.05, ph = 0) {
    inner.position.y = SEA_Y - 0.15 + 0.12 * Math.sin(t * 1.3 + ph) * (1 + rock * 4);
    inner.rotation.z = 0.04 * Math.sin(t * 1.1 + ph) + rock * 0.35 * Math.sin(t * 2.4 + ph);
    inner.rotation.x = 0.03 * Math.sin(t * 0.9 + ph * 2) + rock * 0.25 * Math.sin(t * 1.9 + ph * 1.3);
    flags.forEach((f, k) => { f.rotation.y = 0.3 * Math.sin(t * 6 + k + ph); });
  } };
  return g;
}
function signTex(kind) {
  return canvasTexture(512, 360, (g, w, h) => {
    // wood planks
    for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#c58a4a' : '#b97c3e'; g.fillRect(0, k * h / 4, w, h / 4); g.fillStyle = 'rgba(80,40,10,0.35)'; g.fillRect(0, (k + 1) * h / 4 - 4, w, 4); }
    g.strokeStyle = '#5a3416'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16);
    const cx = w / 2, cy = 135, r = 92;
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, r, 0, PI * 2); g.fill();
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'whistle') {
      g.fillStyle = '#ffd23f'; g.strokeStyle = '#1d1d22'; g.lineWidth = 9;
      g.beginPath(); g.arc(cx + 18, cy + 12, 40, 0, PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.rect(cx - 62, cy - 26, 82, 34); g.fill(); g.stroke();
      g.fillStyle = '#1d1d22'; g.fillRect(cx - 10, cy - 24, 16, 12);
      g.beginPath(); g.moveTo(cx + 55, cy - 8); g.quadraticCurveTo(cx + 80, cy - 60, cx + 40, cy - 70); g.stroke();
    } else {
      g.fillStyle = '#c9ccd2'; g.strokeStyle = '#1d1d22'; g.lineWidth = 9;
      g.beginPath(); g.moveTo(cx - 45, cy + 45); g.lineTo(cx + 45, cy + 45); g.lineTo(cx + 38, cy - 25); g.lineTo(cx - 38, cy - 25); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(cx + 40, cy + 10); g.lineTo(cx + 78, cy - 22); g.stroke();
      g.beginPath(); g.arc(cx, cy - 40, 28, PI, 0); g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = 6; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(cx + 82 + k * 4, cy - 40 - k * 16, 8, 0, PI * 2); g.stroke(); }
    }
    g.strokeStyle = '#e8232b'; g.lineWidth = 22; g.beginPath(); g.arc(cx, cy, r, 0, PI * 2); g.stroke();
    g.beginPath(); g.moveTo(cx - r * 0.7, cy - r * 0.7); g.lineTo(cx + r * 0.7, cy + r * 0.7); g.stroke();
    const txt = kind === 'whistle' ? 'NO WHISTLING' : 'NO KETTLES';
    g.fillStyle = '#ffffff'; g.strokeStyle = '#3a1e08'; g.lineWidth = 12; g.textAlign = 'center'; g.textBaseline = 'middle';
    const s = fit(g, txt, FONTD, w * 0.84, 74); g.font = FONTD(s); g.strokeText(txt, cx, 300); g.fillText(txt, cx, 300);
  });
}
/** Wooden sign on two posts (kind 'whistle') or a plate for a lamp post ('kettle').  Front +Z, origin bottom centre. */
export function makeSign(kind = 'whistle') {
  const g = new THREE.Group(), tex = signTex(kind);
  const W = kind === 'whistle' ? 2.3 : 1.1, H = W * 360 / 512;
  const y0 = kind === 'whistle' ? 1.6 : 0;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
  face.position.set(0, y0 + H / 2, 0.07); g.add(face);
  g.add(box(W + 0.1, H + 0.1, 0.12, '#6b4220', 0, y0 + H / 2, 0));
  if (kind === 'whistle') for (const s of [-1, 1]) g.add(box(0.16, y0 + H, 0.16, '#5a3416', s * W * 0.38, (y0 + H) / 2, -0.12));
  g.userData = { W, H, y0 };
  return g;
}
export function makeKettle() {
  const g = new THREE.Group();
  const m = std('#d8dde4', { metalness: 0.75, roughness: 0.18 });
  const body = cyl(0.11, 0.14, 0.2, m, 18); body.position.y = 0.1; g.add(body);
  const lid = sph(0.1, m, 14, 8); lid.scale.y = 0.45; lid.position.y = 0.2; g.add(lid);
  const knob = sph(0.03, '#1d1d22', 8, 6); knob.position.y = 0.25; g.add(knob);
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 10), m); spout.position.set(0, 0.16, 0.14); spout.rotation.x = 1.0; g.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 6, 12, PI), std('#1d1d22')); handle.position.set(0, 0.23, -0.02); handle.rotation.y = PI / 2; g.add(handle);
  const puffs = [];
  for (let k = 0; k < 7; k++) { const p = sph(0.05, basic('#ffffff', { transparent: true, opacity: 0.85 }), 10, 8); p.castShadow = false; g.add(p); puffs.push(p); }
  g.userData = { puffs, spoutTip: V(0, 0.22, 0.2), set(t, steam = 1) {
    puffs.forEach((p, k) => { const u = ((t * 1.6 + k / puffs.length) % 1); p.visible = steam > 0; p.position.set(0.02 * Math.sin(k * 3 + t * 4), 0.24 + u * 0.5, 0.22 + u * 0.18); p.scale.setScalar((0.5 + u * 1.6) * steam); p.material.opacity = 0.85 * (1 - u); });
  } };
  return g;
}
export function makeIceCreamVan() {
  const g = new THREE.Group();
  g.add(box(4.6, 2.2, 2.1, '#f6f2ea', 0, 1.45, 0));
  g.add(box(1.4, 1.5, 2.0, '#ffa6d1', 2.8, 1.1, 0));
  g.add(box(0.06, 0.7, 1.7, basic('#9fd8ff'), 3.5, 1.5, 0));
  g.add(box(4.62, 0.35, 2.12, '#ff7ab8', 0, 0.55, 0));
  g.add(box(2.0, 0.9, 0.06, '#3a2a40', -0.2, 1.75, 1.06));     // serving window
  g.add(box(2.2, 0.12, 0.4, '#ffffff', -0.2, 1.28, 1.2));
  for (let k = 0; k < 6; k++) g.add(box(0.36, 0.15, 0.06, k % 2 ? '#ff4fa3' : '#ffffff', -1.1 + k * 0.36, 2.3, 1.08));
  for (const [x, z] of [[1.9, 1.0], [-1.6, 1.0], [1.9, -1.0], [-1.6, -1.0]]) { const w = cyl(0.42, 0.42, 0.3, '#1d1d22', 14); w.rotation.x = PI / 2; w.position.set(x, 0.42, z); g.add(w); }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 14), std('#e0a860')); cone.rotation.x = PI; cone.position.set(-0.6, 3.15, 0); g.add(cone);
  for (const [c, y] of [['#ffb6d5', 3.85], ['#fff3d8', 4.35]]) { const s = sph(0.55, c); s.position.set(-0.6, y, 0); g.add(s); }
  const cherry = sph(0.14, '#e8232b'); cherry.position.set(-0.6, 4.95, 0); g.add(cherry);
  return g;
}
/** Grandma's bicycle: front = +Z, origin on the ground between the wheels.  userData.set(t, pedal) spins wheels/cranks. */
export function makeBike() {
  const g = new THREE.Group();
  const fr = std('#2fa37a', { roughness: 0.4 }), tire = std('#1d1d22');
  const wheels = [];
  for (const z of [-0.55, 0.55]) {
    const w = new THREE.Group(); w.position.set(0, 0.36, z); g.add(w); wheels.push(w);
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 8, 22), tire); t.rotation.y = PI / 2; w.add(t);
    for (let k = 0; k < 4; k++) { const s = box(0.02, 0.62, 0.02, '#c9ccd2'); s.rotation.x = k * PI / 4; w.add(s); }
  }
  const bar = (x1, y1, z1, x2, y2, z2, r = 0.03) => { const a = V(x1, y1, z1), b = V(x2, y2, z2), l = a.distanceTo(b); const m = cyl(r, r, l, fr, 8); m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); g.add(m); };
  bar(0, 0.36, -0.55, 0, 0.4, 0.0); bar(0, 0.4, 0, 0, 0.82, 0.45); bar(0, 0.36, -0.55, 0, 0.72, -0.15); bar(0, 0.4, 0, 0, 0.72, -0.15); bar(0, 0.36, 0.55, 0, 0.92, 0.45);
  const seat = box(0.2, 0.06, 0.28, '#5a3a2a', 0, 0.78, -0.15); g.add(seat);
  const hb = box(0.6, 0.04, 0.04, '#c9ccd2', 0, 0.98, 0.42); g.add(hb);
  const basket = box(0.38, 0.24, 0.3, '#c8955a', 0, 0.86, 0.72); g.add(basket);
  for (let k = 0; k < 3; k++) { const f = sph(0.06, ['#ff4fa3', '#ffd23f', '#ffffff'][k], 8, 6); f.position.set(-0.1 + k * 0.1, 1.0, 0.72); g.add(f); }
  const crank = new THREE.Group(); crank.position.set(0, 0.4, 0); g.add(crank);
  for (const s of [-1, 1]) { const c = box(0.03, 0.03, 0.34, '#c9ccd2'); c.position.set(s * 0.1, 0, 0); c.rotation.x = s > 0 ? 0 : PI; crank.add(c); const p = box(0.12, 0.03, 0.08, '#1d1d22'); p.position.set(s * 0.15, 0, s * 0.17); crank.add(p); }
  g.userData = { seatY: 0.81, seatZ: -0.15, set(t, pedal = 1) { const a = t * 9 * pedal; wheels.forEach((w) => { w.rotation.x = a; }); crank.rotation.x = a; } };
  return g;
}
export function makeMegaphone() {
  const g = new THREE.Group();
  const m = std('#ff7a2f', { roughness: 0.5 }), w = std('#ffffff');
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.07, 0.5, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#ff7a2f', roughness: 0.5, side: THREE.DoubleSide }));
  horn.rotation.x = PI / 2; horn.position.z = 0.25; horn.castShadow = true; g.add(horn);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 20), w); rim.position.z = 0.5; g.add(rim);
  const back = cyl(0.08, 0.08, 0.16, w, 12); back.rotation.x = PI / 2; back.position.z = -0.05; g.add(back);
  const handle = box(0.05, 0.16, 0.06, '#1d1d22', 0, -0.1, 0.02); g.add(handle);
  g.userData = { mouth: V(0, 0, 0.52) };
  return g;
}
export function makeMedal() {
  const g = new THREE.Group();
  const rib = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 4, 20, PI), std('#e8232b')); rib.rotation.z = PI; rib.scale.set(1.15, 1.35, 1); g.add(rib);
  const disc = cyl(0.1, 0.1, 0.03, std('#ffd23f', { metalness: 0.6, roughness: 0.3, emissive: '#7a5a00', emissiveIntensity: 0.4 }), 18); disc.rotation.x = PI / 2; disc.position.y = -0.3; g.add(disc);
  const star = box(0.08, 0.08, 0.035, '#fff3b0', 0, -0.3, 0.005); star.rotation.z = PI / 4; g.add(star);
  return g;
}
export function makeSailorCap() {
  const g = new THREE.Group();
  const top = cyl(0.36, 0.33, 0.14, '#1d2a4a', 18); top.position.y = 0.07; g.add(top);
  const band = cyl(0.335, 0.335, 0.06, '#ffffff', 18); band.position.y = 0.03; g.add(band);
  const peak = box(0.4, 0.03, 0.18, '#111111', 0, 0.01, 0.3); peak.rotation.x = 0.2; g.add(peak);
  const badge = box(0.12, 0.08, 0.02, '#ffd23f', 0, 0.08, 0.33); g.add(badge);
  return g;
}
function noteTex() {
  return canvasTexture(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128); g.fillStyle = '#ffffff'; g.strokeStyle = '#1d1d22'; g.lineWidth = 8; g.lineJoin = 'round';
    g.beginPath(); g.ellipse(46, 92, 22, 16, -0.4, 0, PI * 2); g.fill(); g.stroke();
    g.fillRect(62, 22, 9, 70); g.strokeRect(62, 22, 9, 70);
    g.beginPath(); g.moveTo(66, 22); g.quadraticCurveTo(100, 34, 98, 62); g.lineWidth = 10; g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(63, 23, 7, 68);
  });
}
/** Floating music notes from `origin` drifting toward +X (local).  userData.set(t, a, dir=[1,0.6,0]) */
export function makeNotes(n = 6, color = '#ffffff') {
  const g = new THREE.Group(), tex = noteTex(), list = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, fog: false })); g.add(s); list.push(s); }
  g.userData = { set(t, a = 1, dir = [1, 0.6, 0], size = 0.35, speed = 0.55) {
    list.forEach((s, i) => {
      const u = (t * speed + i / n) % 1, d = u * 3;
      s.position.set(dir[0] * d + 0.15 * Math.sin(t * 3 + i * 2), dir[1] * d + 0.12 * Math.sin(t * 4 + i), dir[2] * d);
      const sc = size * (0.6 + 0.6 * Math.sin(PI * Math.min(1, u * 1.4)));
      s.scale.set(sc, sc, 1); s.material.opacity = a * Math.sin(PI * u); s.material.rotation = 0.3 * Math.sin(t * 3 + i);
    });
  } };
  return g;
}
/** Rain streaks around the origin (put the group at the camera).  userData.set(t, a, slant) */
export function makeRain(n = 700, w = 26, h = 18, d = 26) {
  const geo = new THREE.BoxGeometry(0.018, 0.7, 0.018);
  const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#c8d8f0', transparent: true, opacity: 0.55, depthWrite: false, fog: false }), n);
  m.frustumCulled = false;
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s = V(1, 1, 1);
  m.userData = { set(t, a = 1, slant = 0.25) {
    m.material.opacity = 0.55 * a; m.visible = a > 0;
    e.set(0, 0, slant); q.setFromEuler(e);
    for (let i = 0; i < n; i++) {
      const u = (hash(i * 1.31) + t * (1.6 + 0.6 * hash(i * 2.7))) % 1;
      p.set((hash(i * 3.7) - 0.5) * w + slant * h * u, h * (0.5 - u), (hash(i * 5.3) - 0.5) * d);
      M.compose(p, q, s); m.setMatrixAt(i, M);
    }
    m.instanceMatrix.needsUpdate = true;
  } };
  return m;
}
/** Jagged lightning bolt in the XY plane (origin = top).  ~30 m tall. */
export function makeBolt(seed = 1) {
  const g = new THREE.Group(), R = rng(seed);
  const m = basic('#f4f8ff', { toneMapped: false, fog: false, transparent: true });
  let x = 0, y = 0;
  const seg = (x0, y0, x1, y1, w) => { const l = Math.hypot(x1 - x0, y1 - y0); const b = new THREE.Mesh(new THREE.BoxGeometry(w, l, w), m); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); b.rotation.z = Math.atan2(x1 - x0, y1 - y0) * -1; g.add(b); };
  for (let k = 0; k < 9; k++) { const nx = x + (R() - 0.5) * 7, ny = y - 3 - R() * 2.5; seg(x, y, nx, ny, 0.5); if (k === 3 || k === 6) seg(nx, ny, nx + (R() - 0.5) * 9, ny - 6, 0.25); x = nx; y = ny; }
  const halo = glowSprite('#bcd0ff', 40, 0.6); halo.position.y = -14; g.add(halo);
  g.userData = { m, halo };
  return g;
}
function zTex() {
  return canvasTexture(128, 128, (c) => {
    c.clearRect(0, 0, 128, 128); c.font = FONTD(96); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = 14; c.strokeStyle = '#1d3a5a'; c.strokeText('Z', 64, 68); c.fillStyle = '#ffffff'; c.fillText('Z', 64, 68);
  });
}
/** Big snore bubbles rising from the water with floating Z letters.  Origin = sea surface spot.  userData.set(t, a) */
export function makeSnoreBubbles(n = 9) {
  const g = new THREE.Group();
  const bm = new THREE.MeshStandardMaterial({ color: '#bfefff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.45, emissive: '#3a8aa0', emissiveIntensity: 0.4, depthWrite: false });
  const geo = new THREE.SphereGeometry(1, 20, 14), bubbles = [], zs = [], tex = zTex();
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(geo, bm); g.add(b); bubbles.push(b);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), basic('#ffffff', { transparent: true, opacity: 0.9 })); hl.position.set(-0.45, 0.5, 0.6); b.add(hl);
    const z = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false })); g.add(z); zs.push(z);
  }
  g.userData = { set(t, a = 1, spread = 6, rise = 9, size = 1) {
    bubbles.forEach((b, i) => {
      const u = (t * 0.22 + i / n) % 1;
      const x = (hash(i * 2.3) - 0.5) * spread + 0.4 * Math.sin(t * 1.3 + i), z = (hash(i * 4.1) - 0.5) * spread * 0.6;
      b.position.set(x, u * rise, z); const r = size * (0.5 + 0.9 * hash(i * 7.7)) * (0.4 + 0.6 * Math.min(1, u * 4)) * (u > 0.92 ? 1 + (u - 0.92) * 4 : 1);
      b.scale.setScalar(Math.max(0.001, r * a)); b.visible = a > 0 && u < 0.985;
      const zz = zs[i]; zz.visible = a > 0 && i % 2 === 0; zz.position.set(x + r * 0.9, u * rise + r * 0.9 + 0.6, z); const zsz = size * (0.9 + 0.6 * u); zz.scale.set(zsz, zsz, 1); zz.material.opacity = a * Math.sin(PI * u); zz.material.rotation = 0.3 * Math.sin(t * 2 + i);
    });
  } };
  return g;
}
/** Expanding sound rings (tori) from the origin along +Z.  userData.set(t, a, color) */
export function makeSoundRings(n = 5) {
  const g = new THREE.Group(), list = [];
  const m = new THREE.MeshBasicMaterial({ color: '#ffe9a0', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
  for (let i = 0; i < n; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 40), m.clone()); g.add(r); list.push(r); }
  g.userData = { set(t, a = 1, dist = 30, period = 1.2) {
    list.forEach((r, i) => { const u = ((t / period) + i / n) % 1; r.position.set(0, 0, u * dist); r.scale.setScalar(0.3 + u * dist * 0.35); r.material.opacity = a * 0.8 * (1 - u); r.visible = a > 0; });
  } };
  return g;
}
/** Giant HUSS bubble bursting out of the water: sphere + "HUSS!" sprite.  userData.set(u 0..1) (hidden outside) */
export function makeHussBubble() {
  const g = new THREE.Group();
  const bm = new THREE.MeshStandardMaterial({ color: '#c8ffd8', roughness: 0.05, transparent: true, opacity: 0.4, emissive: '#2aff70', emissiveIntensity: 0.5, depthWrite: false });
  const b = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), bm); g.add(b);
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), basic('#ffffff')); hl.position.set(-0.45, 0.5, 0.65); b.add(hl);
  const tex = canvasTexture(512, 256, (c) => { c.clearRect(0, 0, 512, 256); c.font = FONTD(150); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 22; c.strokeStyle = '#06301a'; c.strokeText('HUSS!', 256, 140); c.fillStyle = '#9dff6a'; c.fillText('HUSS!', 256, 140); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false })); s.scale.set(1.8, 0.9, 1); g.add(s);
  g.userData = { b, s, set(u) { g.visible = u > 0 && u < 1; const k = smooth(Math.min(1, u * 3)); b.scale.setScalar(Math.max(0.01, k)); b.position.y = u * 2.5; s.position.y = u * 2.5; s.scale.set(1.8 * k, 0.9 * k, 1); bm.opacity = 0.4 * (u > 0.8 ? (1 - u) / 0.2 : 1); s.material.opacity = u > 0.85 ? (1 - u) / 0.15 : 1; } };
  return g;
}
/** Planks flying off the pier.  userData.set(u, seed) — u = time since the slam (s). */
export function makePlanks(n = 8) {
  const g = new THREE.Group(), list = [];
  for (let i = 0; i < n; i++) { const p = box(1.6, 0.1, 0.32, i % 2 ? '#a0703a' : '#8a5e30'); g.add(p); list.push(p); }
  g.userData = { set(u) {
    g.visible = u > 0 && u < 2.5;
    list.forEach((p, i) => {
      const a = hash(i * 3.3) * PI * 2, sp = 3 + 4 * hash(i * 1.7), vy = 6 + 5 * hash(i * 5.1);
      p.position.set(Math.cos(a) * sp * u, vy * u - 4.9 * u * u, Math.sin(a) * sp * u);
      p.rotation.set(u * (4 + 6 * hash(i)), u * 3 * hash(i * 2), u * 5 * hash(i * 4));
    });
  } };
  return g;
}
/** Water splash: instanced droplets.  userData.set(u) (u = time since impact, s), size. */
export function makeSplash(n = 60) {
  const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.25, 0), std('#dff4ff', { roughness: 0.2, emissive: '#557788', emissiveIntensity: 0.3 }), n);
  m.frustumCulled = false;
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V();
  m.userData = { set(u, size = 1) {
    m.visible = u > 0 && u < 2;
    for (let i = 0; i < n; i++) {
      const a = hash(i * 1.9) * PI * 2, sp = (1.5 + 4 * hash(i * 2.9)) * size, vy = (5 + 8 * hash(i * 4.3)) * size;
      const y = vy * u - 4.9 * u * u;
      p.set(Math.cos(a) * sp * u, Math.max(-0.5, y), Math.sin(a) * sp * u);
      const k = (0.5 + hash(i * 6.1)) * size * (y < -0.3 ? 0 : 1) * Math.max(0, 1 - u * 0.5);
      s.set(k, k, k); M.compose(p, q, s); m.setMatrixAt(i, M);
    }
    m.instanceMatrix.needsUpdate = true;
  } };
  return m;
}
/** An open "bay window" alcove: lit back panel, frame, sill hiding the lower body.  Origin = facade at ground, faces +Z.
 *  Put a character at (0, 0, 0.45) facing +Z: head + shoulders show in the window. */
export function makeWindowBay(light = '#ffcf70') {
  const g = new THREE.Group();
  const back = box(1.7, 1.6, 0.05, basic(light), 0, 1.95, 0.02); back.castShadow = false; g.add(back);
  const lamp = glowSprite(light, 2.2, 0.45); lamp.position.set(0, 2.2, 0.1); g.add(lamp);
  g.add(box(1.9, 0.18, 0.95, '#fbf6ea', 0, 2.82, 0.45));          // top
  for (const s of [-1, 1]) g.add(box(0.16, 1.7, 0.95, '#fbf6ea', s * 0.93, 1.95, 0.45));
  g.add(box(1.86, 1.25, 0.12, '#e9d8b5', 0, 0.62, 0.86));        // wall under the sill
  g.add(box(2.0, 0.12, 0.4, '#fbf6ea', 0, 1.28, 0.9));            // sill
  for (const s of [-1, 1]) { const c = box(0.25, 1.5, 0.06, s > 0 ? '#e86a6a' : '#e86a6a', s * 0.72, 2.0, 0.84); c.castShadow = false; g.add(c); }
  return g;
}
/** Bedroom-window backdrop: night harbour painting + pulsing green glow under the water.  userData.set(t, glow) */
export function makeNightView() {
  const g = new THREE.Group();
  const tex = canvasTexture(1024, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h * 0.55); gr.addColorStop(0, '#050816'); gr.addColorStop(1, '#16224a'); c.fillStyle = gr; c.fillRect(0, 0, w, h * 0.55);
    const R = rng(3); c.fillStyle = '#ffffff'; for (let i = 0; i < 90; i++) { c.globalAlpha = 0.4 + R() * 0.6; c.fillRect(R() * w, R() * h * 0.45, 2 + R() * 2, 2 + R() * 2); } c.globalAlpha = 1;
    c.fillStyle = '#f3ecd2'; c.beginPath(); c.arc(w * 0.82, h * 0.14, 26, 0, PI * 2); c.fill();
    c.fillStyle = '#070a14'; c.fillRect(0, h * 0.55, w, h * 0.45);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(80,110,170,${0.15 + R() * 0.2})`; c.fillRect(R() * w, h * 0.57 + R() * h * 0.4, 20 + R() * 60, 2); }
    // lighthouse silhouette (dark) on the right with a dim lamp
    c.fillStyle = '#0d1020'; c.beginPath(); c.moveTo(w * 0.7, h * 0.56); c.lineTo(w * 0.76, h * 0.56); c.lineTo(w * 0.745, h * 0.3); c.lineTo(w * 0.715, h * 0.3); c.closePath(); c.fill();
    c.fillRect(w * 0.705, h * 0.28, w * 0.05, h * 0.025); c.beginPath(); c.moveTo(w * 0.71, h * 0.25); c.lineTo(w * 0.73, h * 0.2); c.lineTo(w * 0.75, h * 0.25); c.fill();
    c.fillStyle = '#26304a'; c.fillRect(w * 0.715, h * 0.25, w * 0.03, h * 0.03);
    // rocks + far headland
    c.fillStyle = '#0a0d18'; c.beginPath(); c.moveTo(w * 0.62, h * 0.57); c.quadraticCurveTo(w * 0.73, h * 0.5, w * 0.84, h * 0.57); c.fill();
    c.beginPath(); c.moveTo(0, h * 0.56); c.quadraticCurveTo(w * 0.15, h * 0.47, w * 0.32, h * 0.56); c.fill();
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), new THREE.MeshBasicMaterial({ map: tex, fog: false })); g.add(p);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#3aff70', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.position.set(-0.2, -0.85, 0.05); g.add(glow);
  const glow2 = glowSprite('#9dffb0', 0.5, 1); glow2.position.set(-0.2, -0.85, 0.06); g.add(glow2);
  g.userData = { glow, set(t, k = 1) { const pulse = 0.55 + 0.45 * Math.sin(t * 2.2); glow.scale.set(2.6 * (0.8 + 0.3 * pulse), 0.9 * (0.8 + 0.3 * pulse), 1); glow.material.opacity = k * (0.35 + 0.5 * pulse); glow2.material.opacity = k * pulse; glow2.scale.set(0.9, 0.25, 1); } };
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── tentacles
const TEAL = '#1f6a6a';
/** count instanced tentacle chains (segments, joint spheres, suckers).  Each chain grows along +Y of its base matrix. */
export function makeTentacles(count, { nSeg = 10, color = TEAL, sucker = '#f0b8c0' } = {}) {
  const g = new THREE.Group();
  const segGeo = new THREE.CylinderGeometry(0.82, 1, 1, 10, 1); segGeo.translate(0, 0.5, 0);
  const ballGeo = new THREE.SphereGeometry(1, 10, 8);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const N = count * nSeg;
  const segs = new THREE.InstancedMesh(segGeo, mat, N), balls = new THREE.InstancedMesh(ballGeo, mat, N), sucks = new THREE.InstancedMesh(ballGeo, std(sucker, { roughness: 0.5 }), N * 2);
  for (const m of [segs, balls, sucks]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; g.add(m); }
  const Z = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < N; i++) { segs.setMatrixAt(i, Z); balls.setMatrixAt(i, Z); sucks.setMatrixAt(i * 2, Z); sucks.setMatrixAt(i * 2 + 1, Z); }
  const tips = Array.from({ length: count }, () => new THREE.Matrix4());
  const M = new THREE.Matrix4(), R = new THREE.Matrix4(), T = new THREE.Matrix4(), S = new THREE.Matrix4(), O = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion();
  g.userData = {
    count, nSeg,
    set(i, base, len, r0, r1, fn) {
      M.copy(base); const sl = len / nSeg;
      for (let s = 0; s < nSeg; s++) {
        const u = s / (nSeg - 1), [ax, az, ay = 0] = fn(s, u), r = lerp(r0, r1, s / nSeg), rn = lerp(r0, r1, (s + 1) / nSeg);
        e.set(ax, ay, az, 'XYZ'); R.makeRotationFromEuler(e); M.multiply(R);
        S.makeScale(r, sl * 1.12, r); O.multiplyMatrices(M, S); segs.setMatrixAt(i * nSeg + s, O);
        S.makeScale(r * 1.02, r * 1.02, r * 1.02); O.multiplyMatrices(M, S); balls.setMatrixAt(i * nSeg + s, O);
        for (let k = 0; k < 2; k++) { T.makeTranslation(0, sl * (0.3 + 0.45 * k), (r + rn) * 0.5 * 0.86); S.makeScale(r * 0.36, r * 0.3, r * 0.22); O.multiplyMatrices(M, T).multiply(S); sucks.setMatrixAt((i * nSeg + s) * 2 + k, O); }
        T.makeTranslation(0, sl, 0); M.multiply(T);
      }
      tips[i].copy(M);
      segs.instanceMatrix.needsUpdate = balls.instanceMatrix.needsUpdate = sucks.instanceMatrix.needsUpdate = true;
    },
    hide(i) { for (let s = 0; s < nSeg; s++) { segs.setMatrixAt(i * nSeg + s, Z); balls.setMatrixAt(i * nSeg + s, Z); sucks.setMatrixAt((i * nSeg + s) * 2, Z); sucks.setMatrixAt((i * nSeg + s) * 2 + 1, Z); } segs.instanceMatrix.needsUpdate = balls.instanceMatrix.needsUpdate = sucks.instanceMatrix.needsUpdate = true; },
    tip(i) { return V().setFromMatrixPosition(tips[i]); },
    tipMatrix(i) { return tips[i]; },
    mat,
  };
  return g;
}
/** Angle function: bend (total, rad, toward +Z), curl (extra toward the tip), sway (side), wave (travelling). */
export function shape({ bend = 0.4, curl = 0, sway = 0, t = 0, phase = 0, wave = 0.15, limp = 0, twist = 0, n = 10 } = {}) {
  return (s, u) => {
    const ax = bend / n + curl * u * u * 3 / n + wave * Math.sin(t * 1.8 - s * 0.7 + phase) * 0.35 + limp * (0.35 + 0.1 * s) / n * 2.2;
    const az = sway / n + wave * 0.6 * Math.sin(t * 1.3 - s * 0.5 + phase * 1.7) * 0.25;
    return [ax, az, twist / n];
  };
}
export function baseMatrix(x, y, z, yaw = 0, tilt = 0, roll = 0, scale = 1) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, roll, 'YXZ'));
  return m.compose(V(x, y, z), q, V(scale, scale, scale));
}

// ───────────────────────────────────────────────────────────────────────────── the Gulp
function eyeTex() {
  return canvasTexture(512, 256, (g, w, h) => {
    // equirect-ish: front of the sphere is the centre of the texture (u = 0.75 for three's sphere uv with default phi)
    g.fillStyle = '#0a4a22'; g.fillRect(0, 0, w, h);
    const cx = w * 0.75, cy = h / 2;
    const gr = g.createRadialGradient(cx, cy, 4, cx, cy, h * 0.55);
    gr.addColorStop(0, '#f8ffb0'); gr.addColorStop(0.25, '#c8ff5a'); gr.addColorStop(0.55, '#48e05a'); gr.addColorStop(0.85, '#138a3a'); gr.addColorStop(1, '#0a4a22');
    g.fillStyle = gr; g.fillRect(cx - h, 0, h * 2, h);
    g.strokeStyle = 'rgba(10,60,20,0.5)'; g.lineWidth = 3;
    for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); g.lineTo(cx + Math.cos(a) * 100, cy + Math.sin(a) * 100); g.stroke(); }
  });
}
export function makeGulp() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const skin = new THREE.MeshStandardMaterial({ color: '#1d5c60', roughness: 0.5, metalness: 0.05 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), skin); body.position.y = -0.1; body.scale.set(1, 0.9, 1); body.castShadow = true; body.receiveShadow = true; inner.add(body);
  // spots + ridges
  const spotM = std('#144448', { roughness: 0.6 });
  const R = rng(21);
  for (let i = 0; i < 26; i++) {
    const a = R() * PI * 2, e = 0.15 + R() * 1.1; if (Math.abs(Math.sin(a)) < 0.25 && Math.cos(a) > 0 && e < 0.9) continue;
    const p = V(Math.sin(a) * Math.cos(e), Math.sin(e) * 0.9 - 0.1, Math.cos(a) * Math.cos(e));
    const s = sph(0.05 + R() * 0.09, spotM, 10, 8); s.position.copy(p.multiplyScalar(0.985)); s.scale.z = 0.4; s.lookAt(0, -0.1, 0); inner.add(s);
  }
  const bumpM = std('#2a7a7a', { roughness: 0.5 });
  for (let i = 0; i < 9; i++) { const a = -1.6 + i * 0.4; const b = sph(0.09, bumpM, 10, 8); b.position.set(Math.sin(a) * 0.62, 0.68 - 0.08 * Math.abs(a), Math.cos(a) * 0.62 - 0.1); b.scale.set(1, 0.7, 1); inner.add(b); }
  // the eye
  const eye = new THREE.Group(); eye.position.set(0, 0.38, 0.84); inner.add(eye);
  const eyeM = new THREE.MeshBasicMaterial({ map: eyeTex(), toneMapped: false });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 20), eyeM); ball.rotation.y = 0; eye.add(ball);
  const look = new THREE.Group(); eye.add(look);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), basic('#050805')); pupil.scale.set(0.035, 0.2, 0.03); pupil.position.z = 0.285; look.add(pupil);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), basic('#ffffff')); glint.position.set(-0.09, 0.1, 0.28); eye.add(glint);
  const socket = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.045, 8, 32), skin); socket.position.z = 0.04; eye.add(socket);
  // lids: upper + lower hemispherical shells
  const lidGeo = new THREE.SphereGeometry(0.325, 28, 12, 0, PI * 2, 0, PI / 2);
  const lidM = new THREE.MeshStandardMaterial({ color: '#174f53', roughness: 0.5, side: THREE.DoubleSide });
  const lidU = new THREE.Mesh(lidGeo, lidM); eye.add(lidU);
  const lidL = new THREE.Mesh(lidGeo, lidM); eye.add(lidL);
  const lash = new THREE.Mesh(new THREE.TorusGeometry(0.325, 0.02, 6, 28, PI), std('#0b2a2c')); lidU.add(lash);
  // brow
  const brow = new THREE.Group(); brow.position.set(0, 0.73, 0.68); inner.add(brow);
  const browM = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), std('#143f42')); browM.scale.set(0.42, 0.08, 0.16); brow.add(browM);
  // mouth (yawns!)
  const mouth = new THREE.Group(); mouth.position.set(0, 0.0, 0.95); inner.add(mouth);
  const mIn = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), basic('#1a0508')); mouth.add(mIn);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), std('#c04060')); tongue.position.set(0, -0.06, 0.02); mouth.add(tongue);
  const teeth = new THREE.Group(); teeth.position.set(0, 0, 0.97); inner.add(teeth);
  for (let k = 0; k < 7; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), std('#f4f0e0')); c.rotation.x = PI; c.position.set(-0.27 + k * 0.09, 0, 0.06); teeth.add(c); }
  // glow
  const glow = glowSprite('#5aff7a', 1.6, 0.6); glow.position.set(0, 0.38, 0.95); inner.add(glow);
  // tentacles
  const tent = makeTentacles(10, { nSeg: 10 }); inner.add(tent);
  const tdefs = [];
  for (let k = 0; k < 10; k++) { const a = (k / 10) * PI * 2 + 0.31; tdefs.push({ a, ph: k * 1.7, len: 1.5 + 0.5 * hash(k * 3.3), lean: 0.25 + 0.2 * hash(k) }); }
  const eyeW = V();
  g.userData = {
    eye, ball, look, lidU, lidL, mouth, brow, glow, tent, skin, eyeM, inner,
    eyeWorld() { g.updateMatrixWorld(true); return eye.getWorldPosition(eyeW.clone()); },
    set(t, { rise = 1, lid = 0, mouth: mo = 0, sway = 1, limp = 0, glow: gl = 1, lookX = 0, lookY = 0, flash = 0, tentRise = 1, brow: br = 0, tentOn = 1 } = {}) {
      inner.position.y = lerp(-1.35, 0, rise) + 0.02 * Math.sin(t * 0.8);
      inner.rotation.z = 0.02 * Math.sin(t * 0.6);
      look.rotation.set(-lookY, lookX, 0);
      const close = clamp(lid, 0, 1);
      lidU.rotation.x = lerp(-1.35, PI / 2 - 0.02, close);
      lidL.rotation.x = lerp(PI + 1.25, PI + PI / 2 + 0.02, close);
      eyeM.color.setScalar(clamp(0.35 + 0.65 * gl + flash * 0.8, 0, 2));
      glow.material.opacity = clamp(0.55 * gl + flash, 0, 1.5) * (1 - close * 0.85); glow.scale.setScalar(1.6 + flash * 1.6);
      brow.rotation.x = br * 0.3; brow.position.y = 0.73 - close * 0.05;
      const o = clamp(mo, 0, 1);
      mouth.scale.set(0.34 + 0.06 * o, 0.015 + 0.2 * o, 0.12);
      tongue.visible = o > 0.2; tongue.scale.set(0.6, 0.35, 0.5);
      teeth.visible = o > 0.15; teeth.position.y = mouth.position.y + mouth.scale.y * 0.82;
      if (!tentOn) { for (let k = 0; k < 10; k++) tent.userData.hide(k); return; }
      tdefs.forEach((d, k) => {
        const r = smooth(clamp(tentRise * 1.6 - k * 0.06, 0, 1));
        const base = baseMatrix(Math.sin(d.a) * 0.92, -0.25 - (1 - r) * 1.6, Math.cos(d.a) * 0.92, d.a, d.lean + 0.25, 0, 1);
        const lim = clamp(limp * 1.4 - (k % 5) * 0.12, 0, 1);
        tent.userData.set(k, base, d.len * (0.4 + 0.6 * r), 0.11, 0.02, shape({ bend: lerp(0.7, 2.4, lim), curl: lerp(-0.9 + 0.4 * Math.sin(t * 0.7 + d.ph), 0.3, lim), sway: 0.3 * Math.sin(t * 0.5 + d.ph), t, phase: d.ph, wave: sway * (1 - lim) * 0.35 }));
      });
    },
  };
  g.userData.set(0);
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── the harbour set
function installSceneHook(root, fn) {
  root.userData.__worldBeforeRender = fn;
  root.addEventListener('added', () => {
    const s = root.parent;
    if (!s || !s.isScene || s.userData.__worldHook) return;
    s.userData.__worldHook = true;
    const prev = s.onBeforeRender;
    s.onBeforeRender = function (renderer, scene, camera, rt) {
      if (prev) prev.call(this, renderer, scene, camera, rt);
      for (const c of scene.children) { const f = c.userData && c.userData.__worldBeforeRender; if (f && c.visible) f(camera, renderer); }
    };
  });
}
const _cp = V(), _cf = V();
function fitShadow(light, camera, dirV) {
  camera.updateMatrixWorld(); camera.getWorldPosition(_cp); camera.getWorldDirection(_cf);
  let d = _cf.y < -0.05 ? clamp(_cp.y / -_cf.y, 2, 40) : clamp(8 + _cp.y * 0.4, 6, 40);
  const half = clamp(d * 0.75 + 6, 9, 46);
  const c = _cp.clone().addScaledVector(_cf, d); c.y = 0;
  const cam = light.shadow.camera;
  light.target.position.copy(c); light.position.copy(c).addScaledVector(dirV, 120);
  cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.near = 1; cam.far = 280; cam.updateProjectionMatrix();
  light.updateMatrixWorld(); light.target.updateMatrixWorld();
}

export function buildHarbour() {
  const root = new THREE.Group(); root.name = 'harbour';
  const B = new Merger(), Wm = new Merger(), Lm = new Merger();
  // ground: land, road, pavements, quay
  B.box('#9c9488', -100, -0.6, 0, 200, 1.2, 240);                            // land block (top y = 0)
  B.box('#3a3d46', -38, 0.005, 0, 68, 0.02, 8);                                // road
  for (const s of [-1, 1]) { B.box('#b9b4ad', -38, 0.06, s * 5.25, 68, 0.12, 2.5); B.box('#8a8580', -38, 0.06, s * 4.02, 68, 0.13, 0.12); }
  B.box('#c4b9a6', -2, 0.03, 0, 4, 0.06, 120);                                 // quay promenade
  B.box('#7a746c', -0.35, -0.75, 0, 0.7, 1.5, 120);                            // quay wall face
  for (let z = -54; z <= 54; z += 6) if (Math.abs(z) > 4) { B.cyl('#3a3d46', -0.5, 0.25, z, 0.16, 0.2, 0.5, 8); B.sph('#3a3d46', -0.5, 0.52, z, 0.2); }   // bollards
  for (let k = 0; k < 12; k++) B.box('#f2f2f2', -36 + k * 5.4, 0.015, 0, 2.4, 0.02, 0.18);   // centre line
  // grass + hills behind
  B.box('#5aa04a', -150, 0.02, 0, 100, 0.04, 240);
  const R = rng(8);
  for (let i = 0; i < 9; i++) B.sph(i % 2 ? '#4c9a48' : '#3f8a45', -110 - R() * 40, -6, -90 + i * 22 + R() * 6, 22 + R() * 10, 1.6, 0.9, 1, 14);
  // headlands framing the bay (rocky + green tops)
  for (const [x, z, r] of [[70, -95, 34], [120, -70, 28], [60, 100, 36], [125, 85, 30], [190, -20, 26]]) { B.sph('#6f6a66', x, -6, z, r, 1.4, 0.55, 1, 14); B.sph('#4c9a48', x, r * 0.32 - 6, z, r * 0.85, 1.4, 0.32, 1, 14); }
  // houses along the main street
  const houses = [];
  let x = -10;
  for (let i = 0; x > -70; i++) {
    for (const side of [-1, 1]) {
      const w = 6.4 + 2.6 * hash(i * 2.1 + side), d = 8, floors = hash(i * 5.7 + side) > 0.4 ? 2 : 3;
      const xc = x - w / 2 - (side > 0 ? 0.8 * hash(i) : 0);
      B.m.makeRotationY(side < 0 ? 0 : PI).setPosition(xc, 0, side * 7); Wm.m.copy(B.m);
      addHouse(B, Wm, w, d, floors, WALLS[(i * 2 + (side > 0 ? 1 : 0)) % WALLS.length], ROOFS[(i * 3 + (side > 0 ? 2 : 0)) % ROOFS.length], i * 7 + side, { shop: i === 0 && side > 0 ? '#3f7aff' : (i === 1 && side < 0 ? '#e8232b' : null) });
      houses.push({ x: xc, z: side * 7, w, side, floors });
    }
    x -= 9.2;
  }
  // quay houses facing the sea (+X)
  const quay = [];
  for (const z of [-14, -22.5, -31, -40, -49, 13, 21.5, 30, 39, 48]) {
    const w = 7.6, floors = (z === 13) ? 2 : (hash(z) > 0.5 ? 2 : 3);
    B.m.makeRotationY(PI / 2).setPosition(-4, 0, z); Wm.m.copy(B.m);
    addHouse(B, Wm, w, 8, floors, WALLS[Math.abs(Math.round(z)) % WALLS.length], ROOFS[Math.abs(Math.round(z * 3)) % ROOFS.length], z * 1.3, { door: z !== -14, shop: z === 21.5 ? '#ff4fa3' : null });
    quay.push({ z, w, floors });
  }
  B.m.identity(); Wm.m.identity();
  B.box('#2a1a14', -3.97, 1.1, DOBBS.z, 0.06, 2.2, 1.2); B.box('#fbf6ea', -3.95, 2.3, DOBBS.z, 0.12, 0.16, 1.5);
  for (const s of [-1, 1]) B.box('#fbf6ea', -3.95, 1.1, DOBBS.z + s * 0.68, 0.12, 2.3, 0.14);
  // street lamps + quay lamps + pier lanterns
  const lampPos = [];
  for (let lx = -16; lx > -70; lx -= 12) for (const s of [-1, 1]) lampPos.push(addLamp(B, Lm, lx + (s > 0 ? 6 : 0), s * 5.9));
  for (const z of [-8, 8, -26, 26, -44, 44]) lampPos.push(addLamp(B, Lm, -1.2, z));
  // the pier
  const deckY = 0;
  B.box('#a0703a', (PIER.x0 + PIER.x1) / 2, deckY - 0.12, 0, PIER.x1 - PIER.x0, 0.24, PIER.half * 2);
  B.box('#a0703a', PIER.endX + (PIER.x1 - PIER.endX) / 2, deckY - 0.12, 0, PIER.x1 - PIER.endX, 0.24, PIER.endHalf * 2);
  for (let px = 0.8; px < PIER.x1; px += 0.8) B.box('#7a5228', px, deckY + 0.002, 0, 0.04, 0.01, PIER.half * 2);   // plank seams
  for (let px = 2; px <= PIER.x1; px += 4) for (const s of [-1, 1]) { const hz = px >= PIER.endX ? PIER.endHalf : PIER.half; B.cyl('#5a3a1e', px, -2.2, s * (hz - 0.15), 0.22, 0.22, 4.4, 8); }
  for (const s of [-1, 1]) {   // side rails
    B.box('#6b4220', PIER.endX / 2, 0.95, s * (PIER.half - 0.08), PIER.endX, 0.1, 0.1);
    for (let px = 1; px < PIER.endX; px += 2) B.box('#6b4220', px, 0.5, s * (PIER.half - 0.08), 0.1, 1.0, 0.1);
    B.box('#6b4220', PIER.endX + (PIER.x1 - PIER.endX) / 2, 0.95, s * (PIER.endHalf - 0.08), PIER.x1 - PIER.endX, 0.1, 0.1);
  }
  B.box('#6b4220', PIER.x1 - 0.08, 0.95, 0, 0.1, 0.1, PIER.endHalf * 2);
  const lanterns = [];
  for (let px = 6; px < PIER.x1; px += 8) {
    const s = (px / 8) % 2 ? 1 : -1, hz = px >= PIER.endX ? PIER.endHalf : PIER.half;
    B.cyl('#3a2a1e', px, 1.6, s * (hz - 0.1), 0.07, 0.08, 3.2, 6);
    B.box('#3a2a1e', px, 3.25, s * (hz - 0.35), 0.1, 0.1, 0.6);
    Lm.box('#ffffff', px, 2.95, s * (hz - 0.6), 0.32, 0.42, 0.32);
    lanterns.push(V(px, 2.95, s * (hz - 0.6)));
  }
  // crates, barrels, lobster pots, nets on the quay + pier
  const crate = (cx, cz, s = 0.7, c = '#b07a3e') => { B.box(c, cx, s / 2, cz, s, s, s); B.box(shade(c, 0.75), cx, s / 2, cz, s + 0.02, 0.08, s + 0.02); };
  crate(-2.8, -6.2); crate(-2.6, -7.0, 0.6); crate(-2.7, -6.6, 0.55, '#c8955a'); crate(3.2, 1.4, 0.6); crate(36, -3.2, 0.7); crate(36.8, -3.4, 0.5, '#c8955a');
  for (const [bx, bz] of [[-1.6, -9.5], [-1.2, -10.3], [2.4, -1.5], [-2.2, 9.8]]) { B.cyl('#7a4a2a', bx, 0.45, bz, 0.32, 0.32, 0.9, 12); B.cyl('#3a3d46', bx, 0.25, bz, 0.335, 0.335, 0.06, 12); B.cyl('#3a3d46', bx, 0.7, bz, 0.335, 0.335, 0.06, 12); }
  for (const [bx, bz] of [[-3.0, 18], [-2.8, 19.2], [40, 3.4]]) { B.box('#e0c070', bx, 0.3, bz, 0.9, 0.6, 0.6); B.box('#3f7a5a', bx, 0.62, bz, 0.95, 0.06, 0.65); }
  // planters with bushes along the quay
  for (const z of [-17.5, -26, 17, 26]) { B.box('#8a5e30', -1.6, 0.3, z, 1.2, 0.6, 1.2); B.sph('#3f8a45', -1.6, 0.95, z, 0.55); B.sph('#ff4fa3', -1.4, 1.2, z + 0.3, 0.12); B.sph('#ffd23f', -1.85, 1.15, z - 0.25, 0.12); }
  // benches on the quay
  for (const z of [-11, 10.5]) { B.box('#a0703a', -2.6, 0.48, z, 0.5, 0.08, 1.8); B.box('#a0703a', -2.85, 0.8, z, 0.08, 0.5, 1.8); for (const s of [-1, 1]) B.box('#2b2f3a', -2.6, 0.24, z + s * 0.75, 0.5, 0.48, 0.08); }
  // the fish stall (faces −Z): counter, ice, fish, striped canopy
  { const sx = STALL.x, sz = STALL.z;
    B.box('#ffffff', sx, 0.5, sz, 2.6, 1.0, 1.2); B.box('#4fb3ff', sx, 0.95, sz - 0.62, 2.62, 0.12, 0.06);
    B.box('#e6f7ff', sx, 1.05, sz - 0.1, 2.4, 0.1, 0.9);
    for (let k = 0; k < 8; k++) { const fx = sx - 1.0 + k * 0.28; B.sph(k % 3 ? '#9fb4c8' : '#e88a6a', fx, 1.14, sz - 0.2 + (k % 2) * 0.3, 0.12, 1.6, 0.6, 0.7, 8); }
    for (const s of [-1, 1]) B.box('#e8e2d6', sx + s * 1.25, 1.6, sz + 0.5, 0.1, 3.2, 0.1);
    for (let k = 0; k < 6; k++) B.box(k % 2 ? '#ffffff' : '#2f6fd6', sx - 1.25 + 2.5 * (k + 0.5) / 6, 2.6, sz - 0.05, 2.5 / 6, 0.08, 1.5, 0, -0.25);
  }
  // Dobbs' house body (the quay house at z −14 has no door; its front room sits on the quay)
  // bunting across the street (day)
  const bunt = new Merger();
  for (const bx of [-14, -26, -38, -50]) for (let k = 0; k < 14; k++) { const bz = -6.4 + k * 0.95, by = 5.4 - 0.5 * Math.sin(PI * k / 13); bunt.prism(['#ff4fa3', '#ffd23f', '#3ee0c8', '#4fb3ff', '#ff7a2f'][k % 5], bx, by - 0.45, bz, 0.04, -0.45, 0.6); }
  // (prism with negative h points down = pennant)
  const buntMesh = bunt.build(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }), { cast: false });
  root.add(buntMesh);
  const body = B.build(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }));
  root.add(body);
  const winMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: '#ffcf70' });
  const wins = Wm.build(winMat, { cast: false, receive: false }); root.add(wins);
  const lampMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: '#ffe7a0', toneMapped: false });
  const lamps = Lm.build(lampMat, { cast: false, receive: false }); root.add(lamps);
  // lamp halos (sprites)
  const halos = new THREE.Group(); root.add(halos);
  for (const p of [...lampPos, ...lanterns]) { const s = glowSprite('#ffcf70', 2.6, 0.7); s.position.copy(p); halos.add(s); }
  // sky, stars, sun/moon, clouds
  const sky = makeSky(); root.add(sky);
  const stars = makeStars(); root.add(stars);
  const sunM = basic('#fff0c8', { fog: false, toneMapped: false });
  const sun = sph(14, sunM, 24, 16); sun.castShadow = false; sun.position.set(420, 50, -150); root.add(sun);
  const sunGlow = glowSprite('#ffb070', 160, 0.7); sunGlow.position.copy(sun.position); root.add(sunGlow);
  const moon = sph(9, basic('#f3ecd2', { fog: false }), 20, 14); moon.castShadow = false; moon.position.set(300, 170, 140); root.add(moon);
  const clouds = new THREE.Group(); root.add(clouds);
  const cloudM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.25, fog: false });
  for (let i = 0; i < 9; i++) { const c = new THREE.Group(); const a = -0.9 + i * 0.25, r = 300 + 60 * hash(i); c.position.set(Math.cos(a) * r, 60 + 30 * hash(i * 3), Math.sin(a) * r); for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(10 + 8 * hash(i * 5 + k), 12, 8), cloudM); s.position.set((k - 2) * 12, 4 * hash(k + i), 6 * hash(k * 3 + i)); s.scale.y = 0.6; c.add(s); } clouds.add(c); }
  const stormClouds = new THREE.Group(); root.add(stormClouds);
  const scM = new THREE.MeshStandardMaterial({ color: '#202634', roughness: 1, emissive: '#0a0d14', fog: true });
  for (let i = 0; i < 26; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(18 + 14 * hash(i), 12, 8), scM); s.position.set(-40 + 220 * hash(i * 1.3), 46 + 10 * hash(i * 2.1), -140 + 280 * hash(i * 3.7)); s.scale.y = 0.4; stormClouds.add(s); }
  // sea
  const sea = makeSea(); sea.position.set(150, SEA_Y, 0); root.add(sea);
  // lighthouse
  const lighthouse = makeLighthouse(); lighthouse.position.set(LH.x, 0, LH.z); root.add(lighthouse);
  // boats
  const boatDefs = [[11, -10, '#d6453a', 0.3], [15, 9, '#2f6fd6', -0.4], [24, -12, '#ffd23f', 2.6], [30, 12, '#3f9a5a', 0.2], [20, 24, '#ff7a2f', -0.8], [14, -26, '#8a5cff', 1.2]];
  const boats = boatDefs.map(([bx, bz, c, yaw], i) => { const b = makeBoat(c, '#ffd23f', i); b.position.set(bx, 0, bz); b.rotation.y = yaw; root.add(b); return b; });
  // NO WHISTLING sign at the pier entrance (faces −X)
  const sign = makeSign('whistle'); sign.position.set(SIGN.x, 0, SIGN.z); sign.rotation.y = -PI / 2; root.add(sign);
  // megaphone on the stall counter
  const megaphone = makeMegaphone(); megaphone.position.set(STALL.x + 0.8, 1.22, STALL.z - 0.2); megaphone.rotation.y = -2.2; root.add(megaphone);
  // Dobbs' front room: a box chunk on the quay in front of the doorless house at z −14 (opens toward the house, −X)
  const frontRoom = new THREE.Group(); frontRoom.position.set(DOBBS.x + 1.9, 0, DOBBS.z); root.add(frontRoom);
  { const fr = frontRoom, W = 3.4, D = 3.8, H = 2.9;
    fr.add(box(W, 0.2, D, '#8a6a4a', 0, 0.1, 0));                       // floor
    fr.add(box(W, 0.2, D, '#e9d8b5', 0, H, 0));                         // ceiling slab
    fr.add(box(W, 0.4, D + 0.2, '#b5543f', 0, H + 0.25, 0));             // roof
    for (const s of [-1, 1]) fr.add(box(W, H, 0.16, '#f2c4c4', 0, H / 2, s * D / 2));     // side walls
    fr.add(box(0.16, 0.9, D, '#f2c4c4', W / 2, 0.45, 0)); fr.add(box(0.16, 0.5, D, '#f2c4c4', W / 2, H - 0.25, 0));   // sea-facing wall with a big window
    for (const s of [-1, 1]) fr.add(box(0.16, H, 0.5, '#f2c4c4', W / 2, H / 2, s * (D / 2 - 0.25)));
    fr.add(box(0.06, 1.5, 2.8, std('#bfe9ff', { transparent: true, opacity: 0.25, roughness: 0.1 }), W / 2, 1.65, 0));
    fr.add(box(0.2, 0.08, 3.0, '#fbf6ea', W / 2 + 0.05, 0.92, 0));
    // kitchen bits: table, stove, shelves, rug, picture
    fr.add(box(0.9, 0.08, 0.9, '#a0703a', 0.2, 0.8, -0.6)); fr.add(box(0.08, 0.76, 0.08, '#6b4a3a', 0.2, 0.4, -0.6));
    fr.add(box(0.7, 0.9, 0.7, '#2b2f3a', -0.9, 0.55, 1.4)); fr.add(box(0.72, 0.06, 0.72, '#c9ccd2', -0.9, 1.02, 1.4));
    fr.add(box(1.2, 0.06, 0.3, '#a0703a', -0.3, 2.1, -1.75)); for (let k = 0; k < 4; k++) fr.add(box(0.14, 0.2, 0.14, ['#ff4fa3', '#4fb3ff', '#ffd23f', '#ffffff'][k], -0.7 + k * 0.28, 2.23, -1.75));
    fr.add(box(1.6, 0.02, 1.6, '#c0392b', 0.1, 0.21, 0.2));
  }
  // lights
  const hemi = new THREE.HemisphereLight('#ffffff', '#444444', 1);
  const key = new THREE.DirectionalLight('#ffffff', 2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.04;
  const fill = new THREE.PointLight('#c8d8ff', 0, 12, 1.4);
  const glowL = new THREE.PointLight('#40ff70', 0, 40, 1.2);
  const glowL2 = new THREE.PointLight('#40ff70', 0, 20, 1.4);
  root.add(hemi, key, key.target, fill, glowL, glowL2);
  const keyDir = V(1, 1, 0).normalize();
  const background = new THREE.Color('#c9649a');
  const fog = new THREE.Fog('#c98a92', 40, 230);
  const options = { lighting: 'dusk', seaAmp: 0.2, lamp: 'on', frontRoom: true, windowGlow: -1, bunting: false, boatsRock: 0 };
  let P = SKY_PRESETS.dusk;
  const U = sea.userData.U, LU = lighthouse.userData;
  const _c = new THREE.Color();
  function applyLighting() {
    P = SKY_PRESETS[options.lighting] || SKY_PRESETS.dusk;
    sky.material.uniforms.uTop.value.set(P.top); sky.material.uniforms.uMid.value.set(P.mid); sky.material.uniforms.uHor.value.set(P.hor);
    background.set(P.bg); fog.color.set(P.fog[0]); fog.near = P.fog[1]; fog.far = P.fog[2];
    hemi.color.set(P.hemi[0]); hemi.groundColor.set(P.hemi[1]); hemi.intensity = P.hemi[2];
    key.color.set(P.key[0]); key.intensity = P.key[1]; keyDir.set(...P.key[2]).normalize();
    sea.material.color.set(P.sea[0]); U.uFoam.value.set(P.sea[1]);
    stars.visible = P.stars > 0; stars.material.opacity = P.stars;
    sun.visible = sunGlow.visible = P.sun > 0; moon.visible = options.lighting === 'night';
    if (options.lighting === 'dawn') { sun.position.set(420, 30, 120); sunGlow.position.copy(sun.position); } else { sun.position.set(420, 46, -150); sunGlow.position.copy(sun.position); }
    clouds.visible = options.lighting !== 'storm' && options.lighting !== 'night';
    cloudM.emissive.set(options.lighting === 'dusk' ? '#ff9a8a' : options.lighting === 'dawn' ? '#ffb0a0' : '#ffffff');
    stormClouds.visible = options.lighting === 'storm';
    const wg = options.windowGlow >= 0 ? options.windowGlow : P.win;
    winMat.color.set(wg > 0.05 ? '#ffcf70' : '#6a8fb0').multiplyScalar(wg > 0.05 ? lerp(0.35, 1, wg) : 1);
    lampMat.color.set('#ffe7a0').multiplyScalar(P.lamps > 0 ? 1 : 0.55);
    halos.visible = P.lamps > 0; halos.children.forEach((s) => { s.material.opacity = 0.7 * P.lamps; });
    buntMesh.visible = !!options.bunting;
    frontRoom.visible = !!options.frontRoom;
  }
  let flashK = 0;
  const set = {
    root, anchors: {}, background, fog, options,
    lights: { fill, glow: glowL, glow2: glowL2, hemi, key },
    lighthouse, frontRoom, boats, sea, sign, megaphone, houses, quay,
    setLighting(name) { options.lighting = name; applyLighting(); },
    set(k, v) { options[k] = v; applyLighting(); return set; },
    flash(k) {
      flashK = Math.max(flashK, k);
      hemi.intensity = P.hemi[2] + 2.6 * flashK; key.intensity = P.key[1] + 3 * flashK;
      sky.material.uniforms.uFlash.value = 0.55 * flashK;
      _c.set(P.bg).lerp(new THREE.Color('#c8d4ff'), 0.6 * flashK); background.copy(_c);
      fog.color.set(P.fog[0]).lerp(new THREE.Color('#8a96b8'), 0.6 * flashK);
    },
    bulge(bx, bz, h, r) { U.uBulge.value.set(bx, bz, h, r); },
    seaGlow(gx, gz, k, r = 6, color = '#40ff70') { U.uGlow.value.set(gx, gz, k, r); U.uGlowC.value.set(color); },
    update(t) {
      flashK = 0; applyLighting(); sky.material.uniforms.uFlash.value = 0;
      U.uTime.value = t; U.uAmp.value = options.seaAmp; U.uFoamK.value = options.lighting === 'storm' ? 0.9 : 0.55;
      U.uBulge.value.set(0, 0, 0, 1); U.uGlow.value.set(0, 0, 0, 1);
      fill.intensity = 0; glowL.intensity = 0; glowL2.intensity = 0;
      frontRoom.position.set(DOBBS.x + 1.9, 0, DOBBS.z); frontRoom.rotation.set(0, 0, 0); megaphone.visible = true;
      LU.crackM.emissiveIntensity = 0;
      boats.forEach((b, i) => b.userData.set(t, options.boatsRock + options.seaAmp * 0.05, i * 1.7));
      // lighthouse lamp
      const lm = options.lamp;
      LU.lamp.visible = lm !== 'gone';
      LU.lamp.position.copy(LU.lampHome); LU.lamp.rotation.set(0, 0, 0); LU.lamp.scale.setScalar(1);
      let on = lm === 'on' ? 1 : lm === 'flicker' ? (Math.sin(t * 23) * Math.sin(t * 7.3 + 1) > -0.2 ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13)) : 0.05) : 0;
      if (options.lighting === 'day') on *= 0.35;
      LU.coreM.color.set('#fff3b0').multiplyScalar(0.15 + 0.85 * on);
      LU.lens.material.emissiveIntensity = 1.2 * on;
      LU.halo.visible = on > 0.05; LU.halo.material.opacity = 0.9 * on;
      LU.beam.visible = on > 0.3 && options.lighting !== 'day'; LU.beam.rotation.y = t * 0.9;
      LU.beam.children.forEach((b) => { b.material.opacity = 0.2 * on; });
      for (const s of halos.children) s.material.opacity = 0.7 * P.lamps * (options.lighting === 'storm' ? 0.75 + 0.25 * Math.sin(t * 17 + s.position.x) : 1);
    },
    info: { kind: 'harbour' },
  };
  installSceneHook(root, (camera) => fitShadow(key, camera, keyDir));
  applyLighting(); set.update(0);
  return set;
}

// ───────────────────────────────────────────────────────────────────────────── underwater set
export function buildUnder() {
  const root = new THREE.Group(); root.name = 'under';
  const background = new THREE.Color('#04182c');
  const fog = new THREE.Fog('#0a2f4f', 3, 60);
  const hemi = new THREE.HemisphereLight('#7ac8ff', '#06121c', 1.2);
  const key = new THREE.DirectionalLight('#9fdcff', 1.4); key.position.set(10, 40, 10);
  const glowL = new THREE.PointLight('#40ff70', 0, 50, 1.2);
  root.add(hemi, key, key.target, glowL);
  // surface seen from below
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 60, 60), new THREE.MeshBasicMaterial({ color: '#5ab8e8', side: THREE.DoubleSide, fog: true }));
  surf.rotation.x = PI / 2; surf.position.y = 14; root.add(surf);
  const surfGlow = glowSprite('#bfefff', 60, 0.5); surfGlow.position.set(0, 13, -20); root.add(surfGlow);
  // light shafts
  const shafts = new THREE.Group(); root.add(shafts);
  const shM = new THREE.MeshBasicMaterial({ color: '#9fe0ff', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(2 + 3 * hash(i), 40), shM); s.position.set(-16 + i * 4.2, -4, -6 - 20 * hash(i * 2)); s.rotation.z = 0.25; s.rotation.y = 0.3 * hash(i * 3); shafts.add(s); }
  // seabed + rocks + seaweed
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), std('#2a4a50', { roughness: 1 })); bed.rotation.x = -PI / 2; bed.position.y = -16; root.add(bed);
  const R = rng(31);
  for (let i = 0; i < 24; i++) { const s = 2 + R() * 5; const b = box(s * 1.4, s, s, i % 2 ? '#2f4a4a' : '#3a5450', (R() - 0.5) * 70, -16 + s * 0.3, -10 - R() * 50); b.rotation.set(R(), R() * PI, R() * 0.4); root.add(b); }
  const weeds = [];
  for (let i = 0; i < 28; i++) {
    const g = new THREE.Group(); g.position.set((R() - 0.5) * 50, -16, -4 - R() * 40); root.add(g);
    let parent = g; const segs = [];
    for (let k = 0; k < 7; k++) { const s = new THREE.Group(); s.position.y = k ? 1.1 : 0; parent.add(s); const m = box(0.35, 1.2, 0.12, k % 2 ? '#2f8a4a' : '#3fa05a'); m.position.y = 0.6; s.add(m); segs.push(s); parent = s; }
    weeds.push({ segs, ph: R() * 6 });
  }
  // bubbles
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: '#d8f6ff', roughness: 0.1, transparent: true, opacity: 0.55, emissive: '#3a7a9a', emissiveIntensity: 0.4 }), 120);
  bubbles.frustumCulled = false; root.add(bubbles);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V();
  // floating particles (plankton)
  const motes = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.05, 0), basic('#bff8ff', { transparent: true, opacity: 0.7 }), 150);
  motes.frustumCulled = false; root.add(motes);
  const set = {
    root, anchors: {}, background, fog, options: {}, lights: { glow: glowL, hemi, key },
    setLighting() {}, set() { return set; },
    update(t) {
      glowL.intensity = 0;
      weeds.forEach((w) => w.segs.forEach((sg, k) => { sg.rotation.z = 0.12 * Math.sin(t * 1.1 + w.ph + k * 0.5); sg.rotation.x = 0.06 * Math.sin(t * 0.8 + w.ph * 2 + k * 0.4); }));
      for (let i = 0; i < 120; i++) {
        const u = (hash(i * 1.7) + t * (0.08 + 0.06 * hash(i * 3.1))) % 1;
        p.set((hash(i * 2.9) - 0.5) * 30 + 0.4 * Math.sin(t * 2 + i), -14 + u * 28, -2 - hash(i * 5.3) * 30);
        const r = 0.06 + 0.22 * hash(i * 7.1); s.set(r, r, r); M.compose(p, q, s); bubbles.setMatrixAt(i, M);
      }
      bubbles.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 150; i++) {
        p.set((hash(i * 4.1) - 0.5) * 30 + Math.sin(t * 0.3 + i), (hash(i * 6.7) - 0.5) * 24 + 0.5 * Math.sin(t * 0.5 + i * 2), -1 - hash(i * 8.3) * 26);
        s.set(1, 1, 1); M.compose(p, q, s); motes.setMatrixAt(i, M);
      }
      motes.instanceMatrix.needsUpdate = true;
      shafts.children.forEach((sh, i) => { sh.material.opacity = 0.08; sh.position.x = -16 + i * 4.2 + 0.8 * Math.sin(t * 0.3 + i); });
    },
    info: { kind: 'under' },
  };
  set.update(0);
  return set;
}
