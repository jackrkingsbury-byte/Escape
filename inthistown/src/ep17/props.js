// Episode 17 ("Floor Three") props + the two new sets.  Same conventions as src/props.js (SPEC.md §2/§7):
// ES module, metres, Y up, deterministic (no Math.random / clocks); animated things are pure functions of t / u.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   glowTex(), glowSprite(color, size, opacity)     soft additive glow sprite
//   makeFogField({ n, w, d, h, size, color, opacity })   drifting fog sprites over a w × d area (x × z), 0..h high.
//        userData.set(t, a)
//   makeMotes({ n, w, h, d, color, size })          drifting glowing specks.  userData.set(t, a)
//   makeBlob(r)                                       soft dark contact shadow (plane on the ground)
//   CAR = { W, D, H, DW, DH }                         elevator car dimensions (inside: x ±W/2, z ±D/2, door at +Z)
//   makeElevatorCar()   Group, origin = centre of the car floor, door wall at +Z.
//        userData.set({ t, doors 0..1, glow3, glow4, show4, press3, press4, floor:'1'|'2'|'3'|'4', light, tint })
//        userData.hide(names)  names ⊂ ['back','left','right','ceil','front'];  userData.ledge (top of the button
//        panel, where the pigeon sits), userData.btn[n] (button cap meshes), userData.panel, userData.display
//   buildElevatorSet()  Set: the car embedded in a lobby wall (decor 'ground' = tower lobby, 'two' = Grandma's
//        floor-two landing).  set.set('decor', 'ground'|'two'), set.car, anchors 'lift.car', 'lift.out'.
//   makeClockTower({ rows: 2|3 })   the clock tower (front +Z).  userData.win2 (local centre of Grandma's floor-2
//        window, on the wall surface), userData.porch (local point on the porch in front of the door),
//        userData.rowY (window row heights), userData.top (roof tip height), userData.set(t)
//   makePetCloud()      puffy grey cloud with a face.  userData.set(t, { mood:'smug'|'happy'|'angry', rain 0..1, fall })
//        userData.ring (leash attach point)
//   makeLeash(n)        rope of n segments.  userData.set(a, b, sag)  (world points)
//   makeGroceryBag(kind 'bread'|'leek')   paper bag, origin = top of the handles (parent it to a hand)
//   makeGroceryItems()  loose groceries (baguette, leek, apples, milk, cheese, eggs…). userData.set(t, k 0..1 float)
//   makeBall()          soccer ball r 0.11      makeWhistle()  whistle on a cord (parent to joints.torso)
//   makeBanner3()       4.4 × 3 banner: a big 3 with a red slash
//   makeFeedTree()      a whole uprooted tree lying along X (origin = centre), for feeding the giant pigeon
//   makeBellhop()       glowing cyan jellyfish in a red bellhop cap.  origin = centre of the bell rim.
//        userData.set(t, { mood:'smile'|'wink'|'talk'|'sweat'|'happy', red 0..1, bow 0..1, sweep 0..1, glow })
//   makeTally()         three glowing tally bars.  userData.set(t, { appear:[t0,t1,t2], pop:[tp0,tp1,tp2] })
//   makeDoor({ color, seed, keyY })   free-standing wooden door (front +Z, hinge on the −X post).
//        userData.set({ t, open 0..1, key 0..∞ keyhole glow, blaze 0..1, portal 0..1, flash 0..1 })
//        userData.portal (doorway plane; its material is a ShaderMaterial with uniforms map/res/flash),
//        userData.keyhole (Object3D at the front keyhole), userData.leaf
//   makePuff()          fog puff out of a keyhole along +Z.  userData.set(u 0..1)
//   makeBubble()        thought bubble: disc (material map can be swapped to a render target) + trail bubbles
//   buildFloorThree()   Set: the endless starry void, fog, floating tiles, hero doors D[0..4], instanced door field,
//        pastel floaters, the floating elevator car.  set.doors, set.car, set.field.userData.set(t, vanishT0),
//        set.tileY(z) → 0, anchors 'f3.car', 'f3.d1'..'f3.d5' (in front of each hero door, facing it).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, hash, lerp, canvasTexture, ease } from '../lib/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
export const FONT_T = (s) => `900 ${s}px "ITT Nunito", "Nunito", "DejaVu Sans", sans-serif`;
export const FONT_D = (s) => `${s}px "ITT Luckiest", "Luckiest Guy", "DejaVu Sans", sans-serif`;
const _mats = new Map();
function std(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!_mats.has(k)) _mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o }));
  return _mats.get(k);
}
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const _geo = new Map();
function geoBox(w, h, d, r) {
  const k = `${w}|${h}|${d}|${r}`;
  if (!_geo.has(k)) _geo.set(k, r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d));
  return _geo.get(k);
}
function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0) {
  const o = new THREE.Mesh(geoBox(w, h, d, r), typeof m === 'string' ? std(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function cyl(rt, rb, h, m, seg = 20) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function sph(r, m, ws = 16, hs = 12) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
function mergedBoxes(list) {
  const gs = list.map(([w, h, d, x, y, z, r = 0]) => { const g = (r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d)).toNonIndexed(); g.translate(x, y, z); if (g.attributes.uv) g.deleteAttribute('uv'); return g; });
  return mergeGeometries(gs, false);
}
const brassM = () => std('#e2b448', { metalness: 0.25, roughness: 0.32, emissive: '#3a2400', emissiveIntensity: 0.25 });

// ════════════════════════════════════════════════════════════════════════════ glows, fog, motes
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
export function makeFogField({ n = 30, w = 20, d = 20, h = 1.0, size = 5, color = '#b9a8f0', opacity = 0.3, drift = 0.25, seed = 1 } = {}) {
  const g = new THREE.Group(), list = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex(), color, transparent: true, depthWrite: false, opacity, fog: false }));
    g.add(s); list.push(s);
  }
  g.userData = {
    set(t, a = 1) {
      list.forEach((s, i) => {
        const k = i + seed * 31;
        const u = (hash(k * 1.37) + t * 0.01 * drift * (0.5 + hash(k * 3.1))) % 1;
        s.position.set((hash(k * 2.2) - 0.5) * w + Math.sin(t * 0.13 + k) * 0.8, h * (0.2 + 0.7 * hash(k * 4.7)) + 0.1 * Math.sin(t * 0.4 + k), (u - 0.5) * d);
        const sc = size * (0.7 + 0.6 * hash(k * 5.9));
        s.scale.set(sc * 1.8, sc * 0.55, 1);
        s.material.opacity = a * opacity * (0.55 + 0.45 * hash(k * 6.6)) * Math.min(1, Math.sin(PI * u) * 3);
        s.material.rotation = t * 0.03 * (i % 2 ? 1 : -1) + k;
      });
      g.visible = a > 0.001;
    },
  };
  return g;
}
export function makeMotes({ n = 50, w = 8, h = 6, d = 6, color = '#d9a8ff', size = 0.05, seed = 1 } = {}) {
  const g = new THREE.Group(), list = [];
  const mat = basic(color, { toneMapped: false, transparent: true, fog: false });
  const geo = new THREE.OctahedronGeometry(size, 0);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); g.add(m); list.push(m); }
  g.userData = {
    set(t, a = 1) {
      mat.opacity = a;
      list.forEach((m, i) => {
        const k = i + seed * 17;
        const u = (hash(k * 1.3) + t * (0.03 + 0.04 * hash(k * 7.7))) % 1;
        m.position.set((hash(k * 2.1) - 0.5) * w + 0.3 * Math.sin(t * 0.9 + k), (u - 0.5) * h, (hash(k * 4.4) - 0.5) * d + 0.3 * Math.cos(t * 0.7 + k));
        const tw = 0.5 + 0.5 * Math.sin(t * 5 + k * 2.3);
        m.scale.setScalar((0.4 + tw) * Math.sin(PI * u));
        m.rotation.y = t + k;
      });
      g.visible = a > 0.001;
    },
  };
  return g;
}
let _blob = null;
const blobTex = () => _blob ??= canvasTexture(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
export function makeBlob(r = 0.5) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false }));
  m.rotation.x = -PI / 2; m.renderOrder = 1; return m;
}

// ════════════════════════════════════════════════════════════════════════════ canvas art
const _tex = new Map();
function cachedTex(key, w, h, draw) { if (!_tex.has(key)) _tex.set(key, canvasTexture(w, h, draw)); return _tex.get(key); }
const woodPanelTex = () => cachedTex('woodpanel', 512, 512, (g, w, h) => {
  g.fillStyle = '#5e3420'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 80; i++) { g.strokeStyle = `rgba(30,12,4,${0.15 + 0.2 * hash(i)})`; g.lineWidth = 1 + 3 * hash(i * 2.3); const x = hash(i * 1.7) * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, h * 0.3, x - 10, h * 0.6, x + 4, h); g.stroke(); }
  const panel = (x, y, pw, ph) => { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, y, pw, ph); g.strokeStyle = '#8c5734'; g.lineWidth = 10; g.strokeRect(x + 6, y + 6, pw - 12, ph - 12); g.strokeStyle = '#d9a93a'; g.lineWidth = 4; g.strokeRect(x + 14, y + 14, pw - 28, ph - 28); };
  panel(30, 40, w - 60, h * 0.42); panel(30, h * 0.52, w - 60, h * 0.42);
  g.fillStyle = '#d9a93a'; g.fillRect(0, h * 0.475, w, 8);
});
const checkerTex = () => cachedTex('checker', 512, 512, (g, w, h) => {
  const n = 6, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#1f1a24' : '#efe6d2'; g.fillRect(i * s, j * s, s, s); }
  g.strokeStyle = '#b88a2a'; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18);
});
const brassPlateTex = () => cachedTex('brassplate', 256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f2cf6a'); gr.addColorStop(0.5, '#c9962e'); gr.addColorStop(1, '#e8bd55');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#7a5410'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#5a3c08'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = FONT_T(34); g.fillText('LIFT', w / 2, 44);
  for (const [x, y] of [[26, 26], [w - 26, 26], [26, h - 26], [w - 26, h - 26]]) { g.beginPath(); g.arc(x, y, 7, 0, PI * 2); g.fill(); }
});
function btnTex(n, lit) {
  return cachedTex(`btn${n}${lit}`, 128, 128, (g, w, h) => {
    g.fillStyle = lit ? '#f3dcff' : '#f4ead2'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, PI * 2); g.fill();
    if (lit) { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(190,120,255,0.6)'); g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, PI * 2); g.fill(); }
    g.fillStyle = lit ? '#5a1fa8' : '#2a2018'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT_T(88); g.fillText(String(n), w / 2, h / 2 + 6);
  });
}
function displayTex(s) {
  return cachedTex(`disp${s}`, 256, 128, (g, w, h) => {
    g.fillStyle = '#120806'; g.fillRect(0, 0, w, h);
    const col = s === '3' || s === '4' ? '#d98cff' : '#ffb13b';
    g.shadowColor = col; g.shadowBlur = 18; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = FONT_T(104); g.fillText(s, w * 0.62, h / 2 + 6);
    g.beginPath(); g.moveTo(w * 0.22, h * 0.25); g.lineTo(w * 0.32, h * 0.55); g.lineTo(w * 0.12, h * 0.55); g.closePath(); g.fill();
    g.fillRect(w * 0.195, h * 0.55, w * 0.05, h * 0.22);
  });
}

// ════════════════════════════════════════════════════════════════════════════ elevator car
export const CAR = { W: 2.2, D: 1.9, H: 2.6, DW: 1.1, DH: 2.15 };
export function makeElevatorCar() {
  const g = new THREE.Group(); g.name = 'elevatorCar';
  const { W, D, H, DW, DH } = CAR, hw = W / 2, hd = D / 2, T = 0.08;
  const wood = new THREE.MeshStandardMaterial({ map: woodPanelTex(), roughness: 0.55 });
  const floorM = new THREE.MeshStandardMaterial({ map: checkerTex(), roughness: 0.45 });
  const brass = brassM();
  const walls = {};
  const floor = box(W + 2 * T, 0.12, D + 2 * T, floorM, 0, -0.06, 0); g.add(floor);
  walls.back = box(W + 2 * T, H, T, wood, 0, H / 2, -hd - T / 2);
  walls.left = box(T, H, D, wood, hw + T / 2, H / 2, 0);
  walls.right = box(T, H, D, wood, -hw - T / 2, H / 2, 0);
  walls.ceil = new THREE.Group();
  walls.ceil.add(box(W + 2 * T, T, D + 2 * T, std('#2e1c10'), 0, H + T / 2, 0));
  const lightPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), basic('#fff0c8', { toneMapped: false }));
  lightPanel.rotation.x = PI / 2; lightPanel.position.set(0, H - 0.005, 0); walls.ceil.add(lightPanel);
  walls.ceil.add(box(1.42, 0.04, 1.02, brass, 0, H - 0.01, 0));
  lightPanel.position.y = H - 0.035;
  const front = new THREE.Group(); walls.front = front;
  const sideW = hw + T - DW / 2;
  front.add(box(sideW, H, T, wood, DW / 2 + sideW / 2, H / 2, hd + T / 2));
  front.add(box(sideW, H, T, wood, -DW / 2 - sideW / 2, H / 2, hd + T / 2));
  front.add(box(W + 2 * T, H - DH, T, wood, 0, DH + (H - DH) / 2, hd + T / 2));
  // brass door surround (inside + outside)
  for (const z of [hd - 0.01, hd + T + 0.01]) {
    front.add(box(0.07, DH + 0.06, 0.03, brass, DW / 2 + 0.03, DH / 2, z));
    front.add(box(0.07, DH + 0.06, 0.03, brass, -DW / 2 - 0.03, DH / 2, z));
    front.add(box(DW + 0.13, 0.07, 0.03, brass, 0, DH + 0.03, z));
  }
  for (const k of Object.keys(walls)) g.add(walls[k]);
  // handrails
  const rails = new THREE.Group(); g.add(rails);
  { const r = cyl(0.025, 0.025, W - 0.2, brass, 10); r.rotation.z = PI / 2; r.position.set(0, 0.95, -hd + 0.07); rails.add(r); }
  for (const s of [-1, 1]) { const r = cyl(0.025, 0.025, D - 0.4, brass, 10); r.rotation.x = PI / 2; r.position.set(s * (hw - 0.07), 0.95, -0.1); rails.add(r); }
  // sliding doors (outside the front wall)
  const doorTex = cachedTex('liftdoor', 128, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#9b7434'); gr.addColorStop(0.5, '#d6aa52'); gr.addColorStop(1, '#9b7434'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = '#6a4a18'; c.lineWidth = 6; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, h * i / 6); c.lineTo(w, h * i / 6); c.stroke(); } c.strokeRect(3, 3, w - 6, h - 6); });
  const doorM = new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.35, metalness: 0.2 });
  const leaves = [-1, 1].map((s) => { const l = box(DW / 2 + 0.01, DH, 0.04, doorM, s * DW / 4, DH / 2, hd + T + 0.03); g.add(l); return l; });
  // button panel (inside, right of the door when facing out)
  const panel = new THREE.Group(); panel.position.set(-0.8, 1.3, hd - 0.03); panel.rotation.y = PI; g.add(panel);
  panel.add(box(0.34, 0.8, 0.05, new THREE.MeshStandardMaterial({ map: brassPlateTex(), roughness: 0.35, metalness: 0.2, emissive: '#2a1800', emissiveIntensity: 0.3 })));
  const ledgeMesh = box(0.42, 0.035, 0.24, brass, 0, 0.42, 0.085); panel.add(ledgeMesh);
  const ledge = new THREE.Object3D(); ledge.position.set(0, 0.44, 0.09); panel.add(ledge);
  const btn = {}, lit = {}, glows = {};
  const ringM = std('#5a3c10', { roughness: 0.4 });
  const circ = new THREE.CircleGeometry(0.046, 24);
  [1, 2, 3, 4].forEach((n) => {
    const y = -0.27 + (n - 1) * 0.165;
    const ring = cyl(0.064, 0.064, 0.02, ringM, 24); ring.rotation.x = PI / 2; ring.position.set(0, y, 0.03); panel.add(ring);
    const cap = new THREE.Group(); cap.position.set(0, y, 0.045); panel.add(cap);
    const capM = cyl(0.05, 0.05, 0.03, std('#efe2c0', { roughness: 0.5 }), 24); capM.rotation.x = PI / 2; cap.add(capM);
    const faceStd = new THREE.Mesh(circ, new THREE.MeshStandardMaterial({ map: btnTex(n, false), roughness: 0.5 })); faceStd.position.z = 0.0155; cap.add(faceStd);
    const faceLit = new THREE.Mesh(circ, new THREE.MeshBasicMaterial({ map: btnTex(n, true), toneMapped: true })); faceLit.position.z = 0.016; faceLit.visible = false; cap.add(faceLit);
    const gl = glowSprite('#c58cff', 0.32, 0.0); gl.position.set(0, y, 0.09); panel.add(gl);
    btn[n] = cap; lit[n] = { faceStd, faceLit, ring, capM }; glows[n] = gl;
  });
  const blank4 = cyl(0.05, 0.05, 0.012, brass, 20); blank4.rotation.x = PI / 2; blank4.position.set(0, -0.27 + 3 * 0.165, 0.03); panel.add(blank4);
  // floor display above the door (inside)
  const disp = new THREE.Group(); disp.position.set(0, 2.38, hd - 0.03); disp.rotation.y = PI; g.add(disp);
  disp.add(box(0.62, 0.26, 0.05, brass));
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.2), new THREE.MeshBasicMaterial({ map: displayTex('1'), toneMapped: false })); display.position.z = 0.03; disp.add(display);
  // light
  const lamp = new THREE.PointLight('#ffe0b0', 7, 7, 1.5); lamp.position.set(0, 2.25, 0); g.add(lamp);
  const lampBase = new THREE.Color('#ffe0b0'), _c = new THREE.Color();
  g.userData = {
    walls, leaves, panel, ledge, btn, display, lamp, lightPanel,
    hide(names = []) { for (const k of Object.keys(walls)) walls[k].visible = !names.includes(k); rails.visible = !names.includes('back'); },
    set({ t = 0, doors = 0, glow3 = 0.6, glow4 = 0, show4 = false, press3 = 0, press4 = 0, floor = '1', light = 1, tint = null } = {}) {
      const k = clamp(doors, 0, 1);
      leaves.forEach((l, i) => { const s = i ? 1 : -1; l.position.x = s * (DW / 4 + (DW / 2) * k); });
      [1, 2, 3, 4].forEach((n) => {
        const gv = n === 3 ? glow3 : n === 4 ? glow4 : 0;
        const on = gv > 0.02;
        lit[n].faceStd.visible = !on; lit[n].faceLit.visible = on;
        lit[n].faceLit.material.color.setScalar(0.55 + 0.9 * Math.min(gv, 0.75));
        glows[n].material.opacity = clamp(gv * 0.75, 0, 1); glows[n].scale.setScalar(0.25 + 0.22 * gv);
        btn[n].position.z = 0.045 - 0.016 * (n === 3 ? press3 : n === 4 ? press4 : 0);
        const vis = n < 4 || show4;
        btn[n].visible = vis; lit[n].ring.visible = vis; glows[n].visible = vis;
      });
      blank4.visible = !show4;
      display.material.map = displayTex(String(floor));
      _c.copy(lampBase); if (tint) _c.lerp(new THREE.Color(tint), 0.85);
      lamp.color.copy(_c); lamp.intensity = 7 * light;
      lightPanel.material.color.copy(_c).multiplyScalar(0.15 + 0.85 * clamp(light, 0, 1.4));
    },
  };
  g.userData.set({});
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ elevator set (lobby / landing)
const wallTex = (kind) => cachedTex('wall' + kind, 512, 512, (g, w, h) => {
  if (kind === 'ground') {
    g.fillStyle = '#efe3c4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(180,140,80,0.16)' : 'rgba(255,255,255,0.1)'; g.fillRect(i * w / 16, 0, w / 16, h); }
  } else {
    g.fillStyle = '#f6c9d2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      const x = (i + (j % 2) * 0.5) * w / 6 + 20, y = j * h / 6 + 30;
      g.fillStyle = '#e86f8f'; for (let p = 0; p < 5; p++) { const a = p / 5 * PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 0, PI * 2); g.fill(); }
      g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(x, y, 5, 0, PI * 2); g.fill();
      g.strokeStyle = '#5aa86a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y + 12); g.quadraticCurveTo(x + 10, y + 30, x + 2, y + 44); g.stroke();
    }
  }
});
const tileTex = () => cachedTex('lobbytile', 512, 512, (g, w, h) => {
  const n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#b9a07a' : '#d9c8a4'; g.fillRect(i * s, j * s, s, s); g.strokeStyle = '#8a7350'; g.lineWidth = 4; g.strokeRect(i * s, j * s, s, s); }
});
function signTex(lines, { w = 512, h = 256, bg = '#2a1a10', fg = '#ffd23f', border = '#e2b448', display = true } = {}) {
  return cachedTex('sign' + lines.join('|') + bg + fg, w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const F = display ? FONT_D : FONT_T;
    lines.forEach((l, i) => { const s = fit(g, l, F, w * 0.84, Math.floor(h / lines.length * 0.62)); g.font = F(s); g.fillText(l, w / 2, h * (i + 0.5) / lines.length + s * 0.08); });
  });
}
export function makeSignPlane(lines, w, h, opts = {}) {
  const res = 512, rh = Math.round(res * h / w);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTex(lines, { w: res, h: rh, ...opts }), roughness: 0.6 }));
}
function makePlant(s = 1) {
  const g = new THREE.Group();
  g.add(box(0.42 * s, 0.4 * s, 0.42 * s, '#c0603a', 0, 0.2 * s, 0, 0.04));
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; const l = box(0.12 * s, 0.6 * s, 0.04 * s, '#3c8f45', Math.cos(a) * 0.1 * s, 0.62 * s, Math.sin(a) * 0.1 * s, 0.02); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(l); }
  return g;
}
export function buildElevatorSet() {
  const root = new THREE.Group(); root.name = 'elevatorSet';
  const car = makeElevatorCar(); root.add(car);
  const WZ = 1.12;   // lobby wall face
  const wallM = new THREE.MeshStandardMaterial({ map: wallTex('ground'), roughness: 0.85 });
  const wainM = std('#6b3d22', { roughness: 0.6 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), new THREE.MeshStandardMaterial({ map: tileTex(), roughness: 0.6 }));
  floor.material.map.wrapS = floor.material.map.wrapT = THREE.RepeatWrapping; floor.material.map.repeat.set(5, 4.4);
  floor.rotation.x = -PI / 2; floor.position.set(0, 0.002, WZ + 7); floor.receiveShadow = true; root.add(floor);
  const HW = 0.62, HH = 2.25, WH = 4.2, WW = 8;
  const wall = new THREE.Group(); root.add(wall);
  const segW = WW - HW;
  for (const s of [-1, 1]) { const m = box(segW, WH, 0.1, wallM, s * (HW + segW / 2), WH / 2, WZ + 0.05); wall.add(m); wall.add(box(segW, 1.0, 0.04, wainM, s * (HW + segW / 2), 0.5, WZ - 0.0)); }
  wall.add(box(2 * HW, WH - HH, 0.1, wallM, 0, HH + (WH - HH) / 2, WZ + 0.05));
  for (const s of [-1, 1]) { const sw = box(0.1, WH, 14, wallM, s * WW, WH / 2, WZ + 7); wall.add(sw); wall.add(box(0.06, 1.0, 14, wainM, s * (WW - 0.06), 0.5, WZ + 7)); }
  const ceil = box(2 * WW, 0.1, 14, std('#e8dcc4'), 0, WH + 0.05, WZ + 7); wall.add(ceil);
  const brass = brassM();
  // brass surround on the lobby side
  for (const s of [-1, 1]) wall.add(box(0.12, HH + 0.12, 0.06, brass, s * (HW + 0.06), (HH + 0.12) / 2, WZ - 0.03));
  wall.add(box(2 * HW + 0.24, 0.14, 0.06, brass, 0, HH + 0.07, WZ - 0.03));
  // outside floor dial (half circle with 1 2 3 and a needle)
  const dialTex = cachedTex('dial', 512, 256, (g, w, h) => {
    g.fillStyle = '#e2b448'; g.beginPath(); g.arc(w / 2, h - 10, w / 2 - 10, PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#fbf3dc'; g.beginPath(); g.arc(w / 2, h - 10, w / 2 - 34, PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#2a1a10'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT_T(56);
    ['1', '2', '3'].forEach((s, i) => { const a = PI + (i + 1) / 4 * PI; g.fillStyle = i === 2 ? '#8a2be2' : '#2a1a10'; g.fillText(s, w / 2 + Math.cos(a) * 170, h - 10 + Math.sin(a) * 170); });
  });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshStandardMaterial({ map: dialTex, transparent: true, roughness: 0.4 }));
  dial.position.set(0, 2.72, WZ - 0.02); dial.rotation.y = PI; root.add(dial);
  dial.rotation.y = 0; dial.position.z = WZ - 0.065;
  const needle = new THREE.Group(); needle.position.set(0, 2.49, WZ - 0.075); root.add(needle);
  needle.add(box(0.025, 0.36, 0.01, '#2a1a10', 0, 0.18, 0));
  // call button plate
  const call = box(0.16, 0.3, 0.03, brass, HW + 0.4, 1.2, WZ - 0.02); root.add(call);
  const callBtn = sph(0.04, basic('#ffcf6a', { toneMapped: false })); callBtn.position.set(HW + 0.4, 1.22, WZ - 0.05); root.add(callBtn);
  // ── decor: ground (tower lobby)
  const ground = new THREE.Group(); root.add(ground);
  const sign = makeSignPlane(['CLOCK TOWER', 'LIFT'], 1.5, 0.5); sign.position.set(0, 3.45, WZ - 0.02); ground.add(sign);
  const floors = makeSignPlane(['FLOORS: 1 · 2'], 0.9, 0.3, { bg: '#fbf3dc', fg: '#2a1a10', border: '#6b3d22', display: false }); floors.position.set(-HW - 0.75, 1.55, WZ - 0.02); ground.add(floors);
  const p1 = makePlant(1.2); p1.position.set(-2.6, 0, WZ + 0.5); ground.add(p1);
  const p2 = makePlant(1.0); p2.position.set(2.5, 0, WZ + 0.45); ground.add(p2);
  const bench = new THREE.Group(); bench.position.set(-4.4, 0, WZ + 0.45); ground.add(bench);
  bench.add(box(1.6, 0.08, 0.45, '#7d5232', 0, 0.48, 0)); bench.add(box(1.6, 0.45, 0.06, '#7d5232', 0, 0.82, -0.2));
  for (const s of [-1, 1]) bench.add(box(0.07, 0.48, 0.4, '#2f2a2a', s * 0.7, 0.24, 0));
  const poster = makeSignPlane(['EST. 1887', 'TWO FLOORS', 'ONLY'], 0.8, 1.0, { bg: '#3f7a5a', fg: '#fff4c0', border: '#e2b448' }); poster.position.set(3.6, 1.9, WZ - 0.02); ground.add(poster);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 5), std('#9b1d2a', { roughness: 0.95 })); rug.rotation.x = -PI / 2; rug.position.set(0, 0.006, WZ + 2.6); rug.receiveShadow = true; ground.add(rug);
  // ── decor: two (Grandma's landing)
  const two = new THREE.Group(); root.add(two); two.visible = false;
  const gdoor = new THREE.Group(); gdoor.position.set(-2.8, 0, WZ - 0.02); two.add(gdoor);
  gdoor.add(box(1.2, 2.25, 0.06, '#3f7a5a', 0, 1.125, 0)); gdoor.add(box(1.36, 0.12, 0.08, '#f6f0e0', 0, 2.31, 0));
  for (const s of [-1, 1]) gdoor.add(box(0.1, 2.3, 0.08, '#f6f0e0', s * 0.66, 1.15, 0));
  const knob = sph(0.05, brass); knob.position.set(0.42, 1.05, -0.06); gdoor.add(knob);
  const plate = makeSignPlane(['2B'], 0.3, 0.2, { bg: '#e2b448', fg: '#2a1a10', border: '#7a5410' }); plate.position.set(0, 1.7, -0.04); plate.rotation.y = PI; gdoor.add(plate);
  plate.rotation.y = 0; plate.position.z = -0.045;
  const mat2 = makeSignPlane(['HOME'], 1.0, 0.6, { bg: '#c8955a', fg: '#5a2a10', border: '#8a5a2a' }); mat2.rotation.x = -PI / 2; mat2.position.set(-2.8, 0.008, WZ + 0.55); two.add(mat2);
  const table = new THREE.Group(); table.position.set(2.7, 0, WZ + 0.35); two.add(table);
  table.add(box(0.7, 0.05, 0.4, '#7d5232', 0, 0.8, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) table.add(box(0.05, 0.8, 0.05, '#5a3a20', sx * 0.3, 0.4, sz * 0.15));
  const vase = cyl(0.07, 0.09, 0.24, '#4fb3ff', 14); vase.position.set(0, 0.95, 0); table.add(vase);
  for (let i = 0; i < 6; i++) { const f = sph(0.05, ['#ff4fa3', '#ffd23f', '#ff7a2f'][i % 3], 8, 6); f.position.set(Math.cos(i) * 0.08, 1.15 + 0.06 * hash(i), Math.sin(i) * 0.08); table.add(f); }
  const frame1 = makeSignPlane(['♥ NANA ♥'], 0.6, 0.45, { bg: '#fff4e0', fg: '#c0392b', border: '#7d5232' }); frame1.position.set(2.7, 1.8, WZ - 0.02); two.add(frame1);
  const fl2 = makeSignPlane(['FLOOR 2'], 0.8, 0.3, { bg: '#fbf3dc', fg: '#2a1a10', border: '#6b3d22', display: false }); fl2.position.set(HW + 0.8, 1.6, WZ - 0.02); two.add(fl2);
  const p3 = makePlant(1.1); p3.position.set(-4.6, 0, WZ + 0.5); two.add(p3);
  const winL = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.5), basic('#cfeaff', { toneMapped: false })); winL.position.set(-WW + 0.07, 1.9, WZ + 3.5); winL.rotation.y = PI / 2; two.add(winL);
  two.add(box(0.08, 1.7, 1.6, '#f6f0e0', -WW + 0.05, 1.9, WZ + 3.5));
  winL.position.x = -WW + 0.1;
  // lights
  const hemi = new THREE.HemisphereLight('#fff1dc', '#4a3020', 1.05); root.add(hemi);
  const key = new THREE.DirectionalLight('#fff4e0', 1.0); key.position.set(3, 6, 9); key.target.position.set(0, 1, 1); root.add(key, key.target);
  const sconces = [];
  for (const s of [-1, 1]) {
    const x = s * 2.0;
    root.add(box(0.12, 0.2, 0.08, brass, x, 2.45, WZ - 0.04));
    const sh = sph(0.13, basic('#fff0c8', { toneMapped: false }), 12, 8); sh.position.set(x, 2.6, WZ - 0.14); root.add(sh);
    const gl = glowSprite('#ffd9a0', 1.1, 0.5); gl.position.set(x, 2.6, WZ - 0.2); root.add(gl);
    const pl = new THREE.PointLight('#ffcf8a', 3.5, 6, 1.5); pl.position.set(x, 2.6, WZ + 0.4); root.add(pl); sconces.push(pl);
  }
  const anchors = {};
  const mk = (name, x, y, z, yaw = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.y = yaw; root.add(o); anchors[name] = o; return o; };
  mk('lift.car', 0, 0, 0, 0); mk('lift.out', 0, 0, 2.6, PI);
  const options = { decor: 'ground' };
  const set = {
    root, anchors, background: new THREE.Color('#24160e'), fog: null, options, car, needle,
    setLighting() {},
    set(k, v) {
      if (k === 'decor') { options.decor = v; ground.visible = v === 'ground'; two.visible = v === 'two'; wallM.map = wallTex(v === 'two' ? 'two' : 'ground'); wallM.needsUpdate = true; }
      return set;
    },
    /** dial needle: floor 1 … 3 (continuous) */
    dial(f) { needle.rotation.z = -(PI / 2) + (clamp(f, 0, 4) / 4) * PI; needle.rotation.z = PI / 2 - (clamp(f, 0, 4) / 4) * PI; },
    update(t) {},
    info: { kind: 'elevator' },
  };
  set.dial(1);
  return set;
}

// ════════════════════════════════════════════════════════════════════════════ clock tower
const clockTex = () => cachedTex('ctclock', 512, 512, (g, w) => {
  const c = w / 2;
  const gr = g.createRadialGradient(c, c, 20, c, c, c); gr.addColorStop(0, '#fffdf2'); gr.addColorStop(1, '#f1ddb0');
  g.fillStyle = gr; g.beginPath(); g.arc(c, c, c - 4, 0, PI * 2); g.fill();
  g.lineWidth = 22; g.strokeStyle = '#3a2a1c'; g.beginPath(); g.arc(c, c, c - 14, 0, PI * 2); g.stroke();
  g.fillStyle = '#3a2a1c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; if (i % 3 === 0) { g.font = FONT_T(74); g.fillText(String(i === 0 ? 12 : i), c + Math.sin(a) * 168, c - Math.cos(a) * 168 + 4); } else { g.beginPath(); g.arc(c + Math.sin(a) * 186, c - Math.cos(a) * 186, 12, 0, PI * 2); g.fill(); } }
  g.lineCap = 'round'; g.lineWidth = 22; g.beginPath(); g.moveTo(c, c); g.lineTo(c + 70, c - 64); g.stroke();
  g.lineWidth = 14; g.beginPath(); g.moveTo(c, c); g.lineTo(c - 10, c - 170); g.stroke();
  g.beginPath(); g.arc(c, c, 18, 0, PI * 2); g.fill();
});
export function makeClockTower({ rows = 2 } = {}) {
  const g = new THREE.Group(); g.name = 'clockTower' + rows;
  const cream = std('#ecdcb8', { roughness: 0.85 }), creamD = std('#d9c497', { roughness: 0.85 }), stone = std('#a8a196'), trim = std('#f7f1e2', { roughness: 0.6 });
  const roofM = std('#3f7a5a', { roughness: 0.7 }), glass = std('#3b4f78', { roughness: 0.2, emissive: '#1a2a4a', emissiveIntensity: 0.4 });
  const HW = 1.8;
  const rowY = rows === 3 ? [4.0, 7.2, 10.4] : [4.0, 7.2];
  const bodyTop = rows === 3 ? 12.0 : 10.0;
  g.add(box(4.4, 0.66, 4.4, stone, 0, 0.33, 0, 0.04));
  g.add(box(2 * HW, bodyTop - 0.6, 2 * HW, cream, 0, 0.6 + (bodyTop - 0.6) / 2, 0, 0.06));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.34, bodyTop - 0.6, 0.34, creamD, sx * (HW - 0.12), 0.6 + (bodyTop - 0.6) / 2, sz * (HW - 0.12), 0.03));
  for (const y of [2.9, 5.95, 9.15, ...(rows === 3 ? [] : [])]) if (y < bodyTop - 0.4) g.add(box(2 * HW + 0.14, 0.16, 2 * HW + 0.14, trim, 0, y, 0, 0.02));
  g.add(box(2 * HW + 0.35, 0.22, 2 * HW + 0.35, trim, 0, bodyTop + 0.11, 0, 0.03));
  // clock room + roof
  const cr0 = bodyTop + 0.2;
  g.add(box(3.8, 3.0, 3.8, cream, 0, cr0 + 1.5, 0, 0.06));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.36, 3.0, 0.36, creamD, sx * 1.8, cr0 + 1.5, sz * 1.8, 0.03));
  const faceM = new THREE.MeshStandardMaterial({ map: clockTex(), roughness: 0.6, emissive: '#fff4d0', emissiveIntensity: 0.15 });
  for (let i = 0; i < 4; i++) {
    const a = i * PI / 2;
    const f = new THREE.Mesh(new THREE.CircleGeometry(1.15, 40), faceM);
    f.position.set(Math.sin(a) * 1.915, cr0 + 1.5, Math.cos(a) * 1.915); f.rotation.y = a; g.add(f);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.07, 8, 40), brassM()); ring.position.copy(f.position); ring.rotation.y = a; g.add(ring);
  }
  g.add(box(4.25, 0.22, 4.25, trim, 0, cr0 + 3.1, 0, 0.03));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 4.2, 8), roofM); roof.position.y = cr0 + 3.2 + 2.1; roof.rotation.y = PI / 8; roof.castShadow = true; g.add(roof);
  const ball = sph(0.32, brassM()); ball.position.y = cr0 + 3.2 + 4.3; g.add(ball);
  const flagPole = cyl(0.03, 0.03, 1.2, '#5a3a20', 6); flagPole.position.y = cr0 + 3.2 + 4.9; g.add(flagPole);
  const flag = box(0.6, 0.36, 0.02, '#ff4fa3', 0.3, cr0 + 3.2 + 5.3, 0); g.add(flag);
  // windows on four faces
  const purple = basic('#c58cff', { toneMapped: false });
  const purpleGlows = [];
  for (let face = 0; face < 4; face++) {
    const a = face * PI / 2, s = Math.sin(a), c = Math.cos(a);
    const P = (x, y, z) => V(c * x + s * z, y, -s * x + c * z);
    rowY.forEach((y, r) => {
      const isG = face === 0 && r === 1;
      if (isG) return;
      const third = r === 2;
      for (const xo of face === 0 && r === 0 ? [-1.0, 1.0] : [0]) {
        const add = (m) => { m.rotation.y = a; g.add(m); };
        let m = box(0.98, 1.5, 0.08, trim); m.position.copy(P(xo, y, HW + 0.02)); add(m);
        m = box(0.78, 1.3, 0.06, third ? purple : glass); m.position.copy(P(xo, y, HW + 0.05)); add(m);
        m = box(0.06, 1.3, 0.07, trim); m.position.copy(P(xo, y, HW + 0.06)); add(m);
        m = box(0.78, 0.06, 0.07, trim); m.position.copy(P(xo, y + 0.1, HW + 0.06)); add(m);
        m = box(1.15, 0.09, 0.22, trim); m.position.copy(P(xo, y - 0.79, HW + 0.08)); add(m);
        if (third) { const gl = glowSprite('#b46cff', 2.6, 0.55); gl.position.copy(P(xo, y, HW + 0.4)); g.add(gl); purpleGlows.push(gl); }
      }
    });
  }
  // Grandma's big window (front, floor 2) — dark room behind, open shutters, flower box
  const gy = 7.2;
  g.add(box(1.5, 1.9, 0.1, trim, 0, gy, HW + 0.02));
  g.add(box(1.24, 1.64, 0.04, std('#2a2030', { roughness: 1 }), 0, gy, HW + 0.06));
  const warm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), basic('#5a3a3a')); warm.position.set(0, gy, HW + 0.085); g.add(warm);
  for (const s of [-1, 1]) { const sh = box(0.62, 1.64, 0.05, '#3f7a5a', s * 1.08, gy, HW + 0.18); sh.rotation.y = s * 0.55; g.add(sh); }
  g.add(box(1.5, 0.28, 0.36, '#9a5a32', 0, gy - 0.98, HW + 0.22, 0.03));
  for (let i = 0; i < 9; i++) { const f = sph(0.08, ['#ff4fa3', '#ffd23f', '#ff7a2f', '#f2f2f2'][i % 4], 8, 6); f.position.set(-0.6 + i * 0.15, gy - 0.78 + 0.05 * hash(i), HW + 0.24 + 0.06 * (i % 2)); g.add(f); }
  for (let i = 0; i < 6; i++) { const l = box(0.1, 0.18, 0.04, '#3c8f45', -0.5 + i * 0.2, gy - 0.8, HW + 0.38); g.add(l); }
  // door + porch (front)
  const door = box(1.3, 2.3, 0.08, '#6b3d22', 0, 0.66 + 1.15, HW + 0.03); g.add(door);
  const arch = cyl(0.65, 0.65, 0.08, '#6b3d22', 20); arch.rotation.x = PI / 2; arch.position.set(0, 0.66 + 2.3, HW + 0.03); g.add(arch);
  g.add(box(1.55, 0.14, 0.12, trim, 0, 0.66 + 2.38 + 0.6, HW + 0.05));
  for (const s of [-1, 1]) g.add(box(0.14, 2.9, 0.12, trim, s * 0.75, 0.66 + 1.45, HW + 0.05));
  const knob = sph(0.06, brassM()); knob.position.set(0.42, 0.66 + 1.1, HW + 0.1); g.add(knob);
  g.add(box(2.6, 0.22, 1.2, stone, 0, 0.55, HW + 0.6, 0.03));   // porch slab (top 0.66)
  g.add(box(2.4, 0.22, 0.5, stone, 0, 0.33, HW + 1.35, 0.03));  // step (top 0.44)
  g.add(box(2.2, 0.22, 0.5, stone, 0, 0.11, HW + 1.75, 0.03));  // step (top 0.22)
  const canopy = box(2.6, 0.12, 1.3, '#b5543f', 0, 3.75, HW + 0.62); canopy.rotation.x = 0.2; g.add(canopy);
  for (const s of [-1, 1]) { const post = cyl(0.06, 0.06, 3.05, '#f7f1e2', 10); post.position.set(s * 1.15, 0.66 + 1.5, HW + 1.1); g.add(post); }
  for (const s of [-1, 1]) { const pot = makePlant(0.9); pot.position.set(s * 1.0, 0.66, HW + 0.75); g.add(pot); }
  const lantern = box(0.2, 0.32, 0.2, '#2a2a30', 0.95, 2.55, HW + 0.12); g.add(lantern);
  const lglow = sph(0.07, basic('#ffd27a', { toneMapped: false })); lglow.position.set(0.95, 2.55, HW + 0.23); g.add(lglow);
  const mat = makeSignPlane(['WELCOME'], 1.0, 0.5, { bg: '#c8955a', fg: '#5a2a10', border: '#8a5a2a' }); mat.rotation.x = -PI / 2; mat.position.set(0, 0.665, HW + 0.7); g.add(mat);
  g.userData = {
    win2: V(0, gy, HW + 0.08), porch: V(0, 0.66, HW + 0.7), rowY, top: cr0 + 3.2 + 4.6, clockY: cr0 + 1.5, bodyTop,
    set(t) { purpleGlows.forEach((p, i) => { p.material.opacity = 0.45 + 0.2 * Math.sin(t * 2.2 + i); }); flag.rotation.y = 0.25 * Math.sin(t * 2); },
  };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ pet cloud + leash
function cloudFace(mood) {
  return cachedTex('cloudface' + mood, 256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#1d1d22'; g.strokeStyle = '#1d1d22'; g.lineCap = 'round'; g.lineWidth = 12;
    for (const s of [-1, 1]) {
      const x = w / 2 + s * 52, y = 112;
      if (mood === 'smug') { g.beginPath(); g.ellipse(x, y, 16, 20, 0, 0, PI * 2); g.fill(); g.fillStyle = '#c9ced8'; g.fillRect(x - 24, y - 26, 48, 22); g.fillStyle = '#1d1d22'; g.beginPath(); g.moveTo(x - 22, y - 4); g.lineTo(x + 22, y - 4); g.stroke(); }
      else if (mood === 'angry') { g.beginPath(); g.ellipse(x, y + 4, 15, 17, 0, 0, PI * 2); g.fill(); g.beginPath(); g.moveTo(x - s * 26, y - 30); g.lineTo(x + s * 18, y - 14); g.stroke(); }
      else { g.beginPath(); g.ellipse(x, y, 15, 20, 0, 0, PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x - 5, y - 8, 5, 0, PI * 2); g.fill(); g.fillStyle = '#1d1d22'; }
    }
    g.lineWidth = 10;
    if (mood === 'smug') { g.beginPath(); g.moveTo(w / 2 - 30, 168); g.quadraticCurveTo(w / 2 + 10, 186, w / 2 + 40, 156); g.stroke(); }
    else if (mood === 'angry') { g.beginPath(); g.arc(w / 2, 196, 26, 1.15 * PI, 1.85 * PI); g.stroke(); }
    else { g.beginPath(); g.arc(w / 2, 150, 30, 0.15 * PI, 0.85 * PI); g.stroke(); }
    g.fillStyle = 'rgba(255,120,150,0.45)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 86, 150, 18, 11, 0, 0, PI * 2); g.fill(); }
  });
}
export function makePetCloud() {
  const g = new THREE.Group(); g.name = 'petCloud';
  const body = new THREE.Group(); g.add(body);
  const m1 = std('#aeb4c0', { roughness: 0.95, emissive: '#3a3f4a', emissiveIntensity: 0.25 }), m2 = std('#949aa8', { roughness: 0.95, emissive: '#2a2f3a', emissiveIntensity: 0.2 });
  for (const [x, y, z, r] of [[0, 0, 0, 0.3], [0.28, -0.05, 0.02, 0.22], [-0.3, -0.04, -0.02, 0.23], [0.1, 0.16, -0.05, 0.22], [-0.14, 0.12, 0.04, 0.2], [0.14, -0.08, -0.18, 0.2], [-0.12, -0.1, 0.15, 0.18], [0.44, -0.1, -0.04, 0.14], [-0.46, -0.1, 0.0, 0.15]]) {
    const s = sph(r, r > 0.21 ? m1 : m2, 16, 12); s.position.set(x, y, z); s.scale.y = 0.85; body.add(s);
  }
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), new THREE.MeshBasicMaterial({ map: cloudFace('smug'), transparent: true, depthWrite: false })); face.position.set(0, 0.02, 0.305); body.add(face);
  const ring = new THREE.Object3D(); ring.position.set(0, -0.24, 0.05); body.add(ring);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 14), brassM()); loop.position.copy(ring.position); body.add(loop);
  const N = 40, drop = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 5), std('#4aa8ff', { emissive: '#1d6cff', emissiveIntensity: 0.5 }), N);
  drop.frustumCulled = false; g.add(drop);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s1 = V(1, 1, 1), s0 = V(0, 0, 0), p = V();
  g.userData = {
    ring, face, body,
    set(t, { mood = 'smug', rain = 0, fall = 1.6, bob = 1 } = {}) {
      face.material.map = cloudFace(mood);
      body.position.y = 0.05 * bob * Math.sin(t * 2.1);
      body.rotation.z = 0.05 * bob * Math.sin(t * 1.3);
      body.scale.set(1 + 0.03 * Math.sin(t * 3), 1 - 0.03 * Math.sin(t * 3), 1);
      for (let i = 0; i < N; i++) {
        const u = (t * 1.7 + hash(i * 4.1)) % 1;
        p.set((hash(i * 1.3) - 0.5) * 0.7, -0.15 - u * fall, (hash(i * 2.7) - 0.5) * 0.45);
        m4.compose(p, q, i < N * rain ? s1 : s0); drop.setMatrixAt(i, m4);
      }
      drop.instanceMatrix.needsUpdate = true;
    },
  };
  g.userData.set(0);
  return g;
}
export function makeLeash(n = 10) {
  const g = new THREE.Group(); g.name = 'leash';
  const m = std('#c0392b', { roughness: 0.6 });
  const segs = []; for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 5), m); g.add(s); segs.push(s); }
  const a = V(), b = V(), mid = V(), p0 = V(), p1 = V(), up = V(0, 1, 0), d = V();
  const bez = (k, out) => { const u = 1 - k; return out.set(0, 0, 0).addScaledVector(a, u * u).addScaledVector(mid, 2 * u * k).addScaledVector(b, k * k); };
  g.userData = {
    set(A, B, sag = 0.25) {
      a.copy(A); b.copy(B); mid.copy(a).lerp(b, 0.5); mid.y -= sag;
      segs.forEach((s, i) => {
        bez(i / n, p0); bez((i + 1) / n, p1);
        d.subVectors(p1, p0); const L = d.length();
        s.position.copy(p0).lerp(p1, 0.5); s.scale.set(1, Math.max(L, 1e-4), 1);
        s.quaternion.setFromUnitVectors(up, d.normalize());
      });
    },
  };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ groceries
const kraft = () => std('#c8955a', { roughness: 0.95 });
function makeBaguette() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.48, 4, 10), std('#d9a04a', { roughness: 0.8 })); b.castShadow = true; g.add(b); for (let i = 0; i < 4; i++) { const c = box(0.05, 0.012, 0.03, '#f3dca0', 0, -0.18 + i * 0.12, 0.033); c.rotation.z = 0.5; g.add(c); } return g; }
function makeLeek() { const g = new THREE.Group(); const w = cyl(0.035, 0.035, 0.22, '#f4f0e0', 10); w.position.y = -0.15; g.add(w); const gr = cyl(0.04, 0.035, 0.18, '#7dc36b', 10); gr.position.y = 0.05; g.add(gr); for (let i = 0; i < 3; i++) { const l = box(0.05, 0.28, 0.012, '#3c8f45', 0, 0.26, 0); l.rotation.set(0, i * 1.05, (i - 1) * 0.35); g.add(l); } return g; }
export function makeGroceryBag(kind = 'bread') {
  const g = new THREE.Group(); g.name = 'bag-' + kind;
  const bag = box(0.32, 0.36, 0.2, kraft(), 0, -0.26, 0, 0.015); g.add(bag);
  g.add(box(0.33, 0.04, 0.21, std('#b07a40'), 0, -0.09, 0));
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 5, 12, PI), std('#8a5a2a')); h.position.set(0, -0.09, s * 0.07); g.add(h); }
  if (kind === 'bread') { const b = makeBaguette(); b.position.set(0.06, -0.02, 0.02); b.rotation.z = -0.3; g.add(b); for (let i = 0; i < 2; i++) { const a = sph(0.05, '#e8232b', 10, 8); a.position.set(-0.08 + i * 0.07, -0.07, -0.04); g.add(a); } }
  else { const l = makeLeek(); l.position.set(-0.05, 0.02, 0); l.rotation.z = 0.25; g.add(l); const m = box(0.09, 0.16, 0.09, '#f2f2f2', 0.08, -0.04, 0.02, 0.01); g.add(m); g.add(box(0.092, 0.05, 0.092, '#4fb3ff', 0.08, -0.03, 0.02)); }
  return g;
}
export function makeGroceryItems() {
  const g = new THREE.Group(); g.name = 'groceries';
  const items = [];
  const add = (m, x, y, z) => { m.userData.base = V(x, y, z); g.add(m); items.push(m); };
  add(makeBaguette(), 0.2, 0.9, 0.1); add(makeLeek(), -0.3, 0.9, 0.0);
  for (let i = 0; i < 4; i++) add(sph(0.06, i % 2 ? '#e8232b' : '#7dc36b', 10, 8), -0.1 + i * 0.1, 0.8, 0.15 - i * 0.08);
  { const m = new THREE.Group(); m.add(box(0.1, 0.2, 0.1, '#f2f2f2', 0, 0, 0, 0.01)); m.add(box(0.102, 0.07, 0.102, '#4fb3ff', 0, 0.02, 0)); add(m, 0.35, 0.85, -0.1); }
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 3, 1, false, 0, PI / 2.2), std('#ffd23f')); add(m, -0.15, 0.85, -0.15); }
  { const m = box(0.22, 0.07, 0.11, '#c8b89a', 0, 0, 0, 0.01); add(m, 0.05, 0.85, -0.2); }
  add(sph(0.065, '#ff5a3a', 10, 8), -0.4, 0.8, 0.2);
  add(new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.12, 4, 8), std('#ffd23f')), 0.3, 0.8, 0.25);
  g.userData = {
    items,
    set(t, k = 1) {
      items.forEach((m, i) => {
        const b = m.userData.base, h = hash(i * 3.7);
        const lift = k * (0.6 + 0.9 * h);
        m.position.set(b.x * (1 + 0.6 * k) + 0.06 * k * Math.sin(t * 1.7 + i), b.y + lift + 0.05 * k * Math.sin(t * 2.3 + i * 2), b.z * (1 + 0.5 * k));
        m.rotation.set(k * (t * (0.8 + h) + i), k * (t * 0.6 + i * 2), k * 0.7 * Math.sin(t + i));
      });
    },
  };
  g.userData.set(0, 0);
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ park / square props
export function makeBall() {
  const tex = cachedTex('ball', 256, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d1d22'; for (let i = 0; i < 12; i++) { const x = (i % 6) * w / 6 + (i < 6 ? 10 : 30), y = i < 6 ? h * 0.3 : h * 0.72; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; g.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); } g.closePath(); g.fill(); } });
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 })); m.castShadow = true; return m;
}
export function makeWhistle() {
  const g = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 5, 24, PI * 1.1), std('#ffd23f')); cord.rotation.set(0.15, 0, PI + 0.4 - PI * 0.05); cord.position.set(0, 0.42, 0.05); g.add(cord);
  const w = box(0.07, 0.045, 0.04, std('#d9dde3', { metalness: 0.3, roughness: 0.3 }), 0, 0.27, 0.17, 0.01); g.add(w);
  return g;
}
export function makeBanner3() {
  const tex = cachedTex('banner3', 1024, 700, (g, w, h) => {
    g.fillStyle = '#fff4e0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c0392b'; g.fillRect(0, 0, w, 120); g.fillRect(0, h - 60, w, 60);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let s = fit(g, 'TOWN RULE Nº 1', FONT_D, w * 0.86, 92); g.font = FONT_D(s); g.fillText('TOWN RULE Nº 1', w / 2, 66);
    g.fillStyle = '#1d1d22'; g.font = FONT_D(470); g.fillText('3', w / 2, h / 2 + 60);
    g.strokeStyle = '#e8232b'; g.lineWidth = 52; g.beginPath(); g.arc(w / 2, h / 2 + 30, 230, 0, PI * 2); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 163, h / 2 + 30 - 163); g.lineTo(w / 2 + 163, h / 2 + 30 + 163); g.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.2 }));
  return m;
}
export function makeFeedTree() {
  const g = new THREE.Group(); g.name = 'feedTree';
  const trunk = cyl(0.16, 0.24, 4.2, '#7a4a2a', 10); trunk.rotation.z = PI / 2; g.add(trunk);
  for (let i = 0; i < 5; i++) { const r = cyl(0.04, 0.08, 0.6, '#6a3a20', 6); r.rotation.z = PI / 2 + (hash(i) - 0.5) * 1.6; r.rotation.y = i * 1.3; r.position.set(-2.2, 0, 0); g.add(r); }
  const leafM = [std('#4caf50'), std('#3c8f45'), std('#5bc25b')];
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 + 0.4 * hash(i * 3), 0), leafM[i % 3]); s.position.set(1.4 + 1.3 * hash(i * 1.7), (hash(i * 2.3) - 0.5) * 1.4, (hash(i * 5.1) - 0.5) * 1.4); s.castShadow = true; g.add(s); }
  for (let i = 0; i < 6; i++) { const a = sph(0.09, '#e8232b', 8, 6); a.position.set(1.6 + 1.2 * hash(i * 9), (hash(i * 4) - 0.5) * 1.6, 0.7 * Math.sign(hash(i * 7) - 0.5) + (hash(i) - 0.5) * 0.3); g.add(a); }
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ the Bellhop (jellyfish)
function jellyFace(mood) {
  return cachedTex('jelly' + mood, 256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    const ink = '#0d2a3a';
    for (const s of [-1, 1]) {
      const x = w / 2 + s * 50, y = 110;
      g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = 11;
      if (mood === 'wink' && s > 0) { g.beginPath(); g.arc(x, y + 6, 18, 1.1 * PI, 1.9 * PI); g.stroke(); }
      else if (mood === 'happy') { g.beginPath(); g.arc(x, y + 8, 18, 1.1 * PI, 1.9 * PI); g.stroke(); }
      else {
        g.beginPath(); g.ellipse(x, y, 17, 22, 0, 0, PI * 2); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x - 6, y - 8, 6, 0, PI * 2); g.fill();
        if (mood === 'sweat') { g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.moveTo(x - s * 22, y - 30); g.lineTo(x + s * 14, y - 40); g.stroke(); }
      }
    }
    g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 10;
    if (mood === 'talk') { g.beginPath(); g.ellipse(w / 2, 168, 16, 20, 0, 0, PI * 2); g.fill(); }
    else if (mood === 'sweat') { g.beginPath(); g.moveTo(w / 2 - 34, 172); for (let i = 0; i <= 6; i++) g.lineTo(w / 2 - 34 + i * 11.3, 172 + (i % 2 ? -8 : 6)); g.stroke(); g.fillStyle = '#7fd3ff'; g.beginPath(); g.moveTo(206, 60); g.quadraticCurveTo(226, 96, 206, 104); g.quadraticCurveTo(186, 96, 206, 60); g.fill(); }
    else { g.beginPath(); g.arc(w / 2, 150, 30, 0.15 * PI, 0.85 * PI); g.stroke(); }
    g.fillStyle = 'rgba(255,120,170,0.5)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 88, 150, 18, 11, 0, 0, PI * 2); g.fill(); }
  });
}
export function makeBellhop() {
  const g = new THREE.Group(); g.name = 'bellhop';
  const body = new THREE.Group(); g.add(body);
  const cyan = new THREE.Color('#6ff4ff'), red = new THREE.Color('#ff4a5a');
  const domeM = new THREE.MeshStandardMaterial({ color: '#7ff6ff', emissive: '#22c8e8', emissiveIntensity: 0.9, roughness: 0.25, transparent: true, opacity: 0.88 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.44, 32, 18, 0, PI * 2, 0, PI * 0.55), domeM); dome.scale.y = 0.9; body.add(dome);
  const coreM = new THREE.MeshBasicMaterial({ color: '#d8ffff', transparent: true, opacity: 0.55, toneMapped: false });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), coreM); core.position.y = 0.14; body.add(core);
  const rimM = new THREE.MeshStandardMaterial({ color: '#b6fbff', emissive: '#4fe0ff', emissiveIntensity: 0.8, roughness: 0.3 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.045, 8, 32), rimM); rim.rotation.x = PI / 2; rim.position.y = 0.06; body.add(rim);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), rimM); f.position.set(Math.cos(a) * 0.42, 0.02, Math.sin(a) * 0.42); f.scale.y = 0.7; body.add(f); }
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: jellyFace('smile'), transparent: true, depthWrite: false })); face.position.set(0, 0.2, 0.37); face.rotation.x = -0.32; body.add(face);
  // cap
  const cap = new THREE.Group(); cap.position.set(0.06, 0.4, -0.02); cap.rotation.set(-0.15, 0, -0.28); body.add(cap);
  const capRed = std('#d62a2a', { roughness: 0.5 });
  cap.add(cyl(0.14, 0.15, 0.13, capRed, 20)); cap.children[0].position.y = 0.065;
  const top = cyl(0.14, 0.14, 0.02, capRed, 20); top.position.y = 0.135; cap.add(top);
  const band = cyl(0.152, 0.152, 0.035, brassM(), 20); band.position.y = 0.03; cap.add(band);
  const brim = box(0.2, 0.015, 0.1, '#1d1d22', 0, 0.01, 0.15); cap.add(brim);
  const btn = sph(0.025, brassM(), 8, 6); btn.position.set(0, 0.07, 0.15); cap.add(btn);
  // tentacles
  const tentM = new THREE.MeshStandardMaterial({ color: '#8ff8ff', emissive: '#30d8f0', emissiveIntensity: 0.8, roughness: 0.3, transparent: true, opacity: 0.85 });
  const segGeo = new THREE.CylinderGeometry(0.022, 0.016, 0.15, 6); segGeo.translate(0, -0.075, 0);
  const tents = [];
  const NT = 8, NS = 6;
  for (let i = 0; i < NT; i++) {
    const a = (i + 0.5) / NT * PI * 2, r = i % 2 ? 0.33 : 0.22;
    const base = new THREE.Group(); base.position.set(Math.cos(a) * r, 0.03, Math.sin(a) * r); body.add(base);
    const segs = []; let parent = base;
    for (let k = 0; k < NS; k++) { const s = new THREE.Group(); if (k) s.position.y = -0.15; parent.add(s); const m = new THREE.Mesh(segGeo, tentM); m.scale.setScalar(1 - k * 0.1); s.add(m); segs.push(s); parent = s; }
    tents.push({ base, segs, a, ph: hash(i * 3.3) * 6 });
  }
  // the "arm" tentacle (front right) — longer, for gestures
  const armBase = new THREE.Group(); armBase.position.set(-0.26, 0.03, 0.26); body.add(armBase);
  const armSegs = []; { let parent = armBase; for (let k = 0; k < 8; k++) { const s = new THREE.Group(); if (k) s.position.y = -0.15; parent.add(s); const m = new THREE.Mesh(segGeo, tentM); m.scale.set(1.3 - k * 0.1, 1, 1.3 - k * 0.1); s.add(m); armSegs.push(s); parent = s; } }
  const tip = new THREE.Object3D(); tip.position.y = -0.15; armSegs[7].add(tip);
  const glow = glowSprite('#5ff0ff', 2.4, 0.4); glow.position.y = 0.1; g.add(glow);
  const light = new THREE.PointLight('#5ff0ff', 4, 6, 1.4); light.position.set(0, 0.2, 0.5); g.add(light);
  const _c = new THREE.Color();
  g.userData = {
    body, face, tip, light, cap,
    set(t, { mood = 'smile', red: rk = 0, bow = 0, sweep = 0, glow: gk = 1, point = 0 } = {}) {
      face.material.map = jellyFace(mood);
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
      body.position.y = 0.08 * Math.sin(t * 1.6);
      body.scale.set(1 + 0.05 * pulse, 1 - 0.06 * pulse, 1 + 0.05 * pulse);
      body.rotation.x = 0.55 * bow;
      _c.copy(cyan).lerp(red, rk); domeM.color.copy(_c); domeM.emissive.copy(_c).multiplyScalar(0.55 * gk); rimM.emissive.copy(_c).multiplyScalar(0.6 * gk); tentM.emissive.copy(_c).multiplyScalar(0.55 * gk);
      coreM.color.copy(_c).lerp(new THREE.Color('#ffffff'), 0.6).multiplyScalar(0.6 + 0.6 * gk);
      glow.material.color.copy(_c); glow.material.opacity = 0.32 * gk + 0.25 * rk;
      light.color.copy(_c); light.intensity = 4 * gk + 3 * rk;
      tents.forEach((tn, i) => {
        tn.base.rotation.set(0.25 * Math.sin(tn.a) + 0.1 * pulse * Math.sin(tn.a), 0, -0.25 * Math.cos(tn.a) - 0.1 * pulse * Math.cos(tn.a));
        tn.segs.forEach((s, k) => { s.rotation.x = 0.22 * Math.sin(t * 2.1 - k * 0.7 + tn.ph); s.rotation.z = 0.18 * Math.cos(t * 1.7 - k * 0.6 + tn.ph); });
      });
      // arm: idle wiggle → bow (curl across the front) → sweep (extend out to the side, swinging)
      const sw = clamp(sweep, 0, 1), bw = clamp(bow, 0, 1), pt = clamp(point, 0, 1);
      armBase.rotation.set(-0.2 - 1.1 * bw - 1.3 * pt, 0, -0.2 - 1.6 * sw + 0.6 * bw * 0 );
      armBase.rotation.y = 0.6 * sw * Math.sin(t * 2.2) - 0.4 * bw;
      armSegs.forEach((s, k) => {
        const idle = 0.2 * Math.sin(t * 2.0 - k * 0.6);
        s.rotation.x = idle * (1 - Math.max(sw, bw, pt)) - 0.28 * bw - 0.05 * pt;
        s.rotation.z = -0.12 * sw + 0.04 * Math.sin(t * 3 - k);
      });
    },
  };
  g.userData.set(0);
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ tally marks
export function makeTally() {
  const g = new THREE.Group(); g.name = 'tally';
  const m = basic('#ffe14a', { toneMapped: false });
  const bars = [], glows = [], sparks = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group(); b.position.x = (i - 1) * 0.34; g.add(b);
    const bar = box(0.12, 0.72, 0.06, m, 0, 0, 0, 0.03); bar.castShadow = false; b.add(bar);
    const gl = glowSprite('#ffd23f', 1.1, 0.6); b.add(gl);
    bars.push(b); glows.push(gl);
    const sp = []; for (let k = 0; k < 10; k++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), m); s.visible = false; g.add(s); sp.push(s); }
    sparks.push(sp);
  }
  g.userData = {
    set(t, { appear = [0, 0, 0], pop = [1e9, 1e9, 1e9] } = {}) {
      bars.forEach((b, i) => {
        const da = t - appear[i], dp = t - pop[i];
        let s = da < 0 ? 0 : ease.outBack(clamp(da / 0.25, 0, 1));
        if (dp > 0) s = dp < 0.08 ? 1 + 0.5 * dp / 0.08 : 0;
        b.scale.setScalar(Math.max(1e-4, s)); b.visible = s > 0.001;
        b.position.y = 0.04 * Math.sin(t * 2.5 + i);
        glows[i].material.opacity = 0.5 + 0.2 * Math.sin(t * 4 + i * 2);
        sparks[i].forEach((sp, k) => {
          const u = (dp - 0.05) / 0.5;
          sp.visible = u > 0 && u < 1;
          if (sp.visible) { const a = k / 10 * PI * 2 + i; sp.position.set(b.position.x + Math.cos(a) * 0.9 * ease.outCubic(u), Math.sin(a) * 0.9 * ease.outCubic(u), 0.1); sp.scale.setScalar(1 - u); sp.rotation.set(u * 6, u * 4, 0); }
        });
      });
    },
  };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ doors
const DOOR = { HINGE: -0.6, LW: 1.18, LH: 2.5 };
let _doorGeo = null;
function doorGeos() {
  if (_doorGeo) return _doorGeo;
  const frame = mergedBoxes([[0.14, 2.62, 0.2, -0.68, 1.31, 0], [0.14, 2.62, 0.2, 0.68, 1.31, 0], [1.5, 0.16, 0.22, 0, 2.66, 0], [1.5, 0.06, 0.24, 0, 0.03, 0]]);
  const lx = DOOR.LW / 2 + 0.01;
  const leafParts = [[DOOR.LW, DOOR.LH, 0.07, lx, 1.31, 0]];
  for (const z of [-0.042, 0.042]) for (const [x, y] of [[lx - 0.27, 0.78], [lx + 0.27, 0.78], [lx - 0.27, 1.88], [lx + 0.27, 1.88]]) leafParts.push([0.4, 0.9, 0.02, x, y, z]);
  const leaf = mergedBoxes(leafParts);
  const knobs = [];
  for (const z of [-0.075, 0.075]) { const k = new THREE.SphereGeometry(0.055, 10, 8).toNonIndexed(); k.deleteAttribute('uv'); k.translate(1.04, 1.12, z); knobs.push(k); }
  const leafKnob = mergeGeometries([leaf, ...knobs], false);
  _doorGeo = { frame, leaf: leafKnob };
  return _doorGeo;
}
const keyTex = () => cachedTex('keyhole', 256, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const shape = (k) => { g.beginPath(); g.arc(w / 2, h * 0.32, w * 0.3 * k, 0, PI * 2); g.fill(); g.beginPath(); g.moveTo(w * (0.5 - 0.14 * k), h * 0.38); g.lineTo(w * (0.5 + 0.14 * k), h * 0.38); g.lineTo(w * (0.5 + 0.26 * k), h * (0.94 + 0.02 * (k - 1))); g.lineTo(w * (0.5 - 0.26 * k), h * (0.94 + 0.02 * (k - 1))); g.closePath(); g.fill(); };
  g.fillStyle = '#000000'; shape(1.45);   // dark iron rim so the glowing keyhole reads against the brass plate
  g.fillStyle = '#ffffff'; shape(1.0);
});
const DOOR_COLS = ['#7a4a2a', '#8a5532', '#6b3d22', '#9a6038', '#5e3a24', '#3f7a7a', '#7a3f5a', '#4a5d8a', '#8a7a3a', '#a0522d'];
function portalMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, res: { value: new THREE.Vector2(720, 1280) }, flash: { value: 0 }, tint: { value: new THREE.Color('#ffffff') } },
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D map; uniform vec2 res; uniform float flash; uniform vec3 tint;
      void main(){ vec2 uv = gl_FragCoord.xy / res; vec3 c = texture2D(map, uv).rgb * tint; c = mix(c, vec3(4.0, 3.6, 3.0), flash);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
}
export function makeDoor({ color = '#7a4a2a', seed = 1, keyY = 0.92, base = true } = {}) {
  const g = new THREE.Group(); g.name = 'door';
  const G = doorGeos();
  const frameM = std('#4a2c18', { roughness: 0.7 });
  const leafM = new THREE.MeshStandardMaterial({ color, roughness: 0.65 });
  const frame = new THREE.Mesh(G.frame, frameM); frame.castShadow = true; g.add(frame);
  const pivot = new THREE.Group(); pivot.position.x = DOOR.HINGE; g.add(pivot);
  const leaf = new THREE.Mesh(G.leaf, leafM); leaf.castShadow = true; pivot.add(leaf);
  const keyM = new THREE.MeshBasicMaterial({ map: keyTex(), color: '#ffcf6a', transparent: true, toneMapped: false, depthWrite: false });
  const kh = [];
  for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.15), keyM); k.position.set(1.04, keyY, s * 0.056); if (s < 0) k.rotation.y = PI; pivot.add(k); kh.push(k); }
  const plateM = brassM();
  for (const s of [-1, 1]) { const p = box(0.12, 0.26, 0.012, plateM, 1.04, keyY + 0.04, s * 0.042); pivot.add(p); }
  const keyGlow = glowSprite('#ffc94a', 0.5, 0.6); keyGlow.position.set(1.04, keyY, 0.1); pivot.add(keyGlow);
  const keyhole = new THREE.Object3D(); keyhole.position.set(1.04, keyY, 0.06); pivot.add(keyhole);
  const blaze = glowSprite('#ffd36a', 3.5, 0); blaze.position.set(1.04 + DOOR.HINGE, keyY, 0.2); g.add(blaze);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 2.52), portalMaterial()); portal.position.set(0, 1.31, 0.0); portal.visible = false; g.add(portal);
  const spill = glowSprite('#fff1c8', 3.4, 0); spill.position.set(0, 1.3, 0.6); g.add(spill);
  if (base) {
    const slab = box(1.9, 0.3, 1.1, std('#8f8aa8', { roughness: 0.9 }), 0, -0.15, 0, 0.06); g.add(slab);
    const rock = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.2, 6), std('#5e587a', { roughness: 1 })); rock.rotation.x = PI; rock.position.y = -0.3 - 0.6; g.add(rock);
  }
  g.userData = {
    leaf: pivot, keyhole, portal, frame,
    set({ t = 0, open = 0, key = 0.6, blaze: bz = 0, portal: pk = 0, flash = 0 } = {}) {
      pivot.rotation.y = 1.75 * clamp(open, -0.2, 1.2);
      keyM.color.set('#ffcf6a').multiplyScalar(0.6 + key + 2.5 * bz);
      keyGlow.material.opacity = clamp(0.35 * key + 0.8 * bz, 0, 1); keyGlow.scale.setScalar(0.4 + 0.25 * key + 1.2 * bz);
      blaze.material.opacity = clamp(bz, 0, 1); blaze.scale.setScalar(2 + 3 * bz);
      portal.visible = pk > 0.001 && open > 0.02;
      portal.material.uniforms.flash.value = flash;
      spill.material.opacity = clamp(open * 1.4, 0, 1) * pk * 0.5;
    },
  };
  g.userData.set({});
  return g;
}
/** Instanced field of floating doors.  list: [{ x, y, z, yaw, open, color, tv }] (tv = vanish time offset rank). */
function makeDoorField(list) {
  const G = doorGeos(), n = list.length;
  const frames = new THREE.InstancedMesh(G.frame, std('#4a2c18', { roughness: 0.7 }), n);
  const leaves = new THREE.InstancedMesh(G.leaf, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.65 }), n);
  const keyGeo = new THREE.PlaneGeometry(0.075, 0.15); keyGeo.translate(1.04, 0.92, 0.056);
  const keys = new THREE.InstancedMesh(keyGeo, new THREE.MeshBasicMaterial({ map: keyTex(), color: '#ffcf6a', transparent: true, toneMapped: false, depthWrite: false }), n);
  const c = new THREE.Color();
  list.forEach((d, i) => leaves.setColorAt(i, c.set(d.color)));
  leaves.instanceColor.needsUpdate = true;
  for (const m of [frames, leaves, keys]) m.frustumCulled = false;
  const g = new THREE.Group(); g.add(frames, leaves, keys);
  const M = new THREE.Matrix4(), H = new THREE.Matrix4(), R = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s = V();
  g.userData = {
    list,
    set(t, vanishT0 = null, hidden = null) {
      list.forEach((d, i) => {
        let open = d.open + 0.06 * Math.sin(t * 0.7 + i), sink = 0, sc = 1, tilt = 0;
        if (vanishT0 != null) {
          const dv = t - (vanishT0 + d.tv);
          if (dv > 0) { open = d.open * (1 - clamp(dv / 0.1, 0, 1)); const u = clamp((dv - 0.14) / 0.5, 0, 1); sink = 2.5 * u * u; sc = 1 - ease.inCubic(u); tilt = 0.5 * u; }
        }
        if (hidden && hidden(i)) sc = 0;
        p.set(d.x, d.y + 0.25 * Math.sin(t * 0.5 + d.ph) - sink, d.z);
        e.set(tilt, d.yaw, 0.03 * Math.sin(t * 0.4 + d.ph)); q.setFromEuler(e); s.setScalar(Math.max(sc, 1e-4) * d.s);
        M.compose(p, q, s);
        frames.setMatrixAt(i, M);
        H.makeTranslation(DOOR.HINGE, 0, 0); R.makeRotationY(1.75 * open);
        const L = M.clone().multiply(H).multiply(R);
        leaves.setMatrixAt(i, L); keys.setMatrixAt(i, L);
      });
      frames.instanceMatrix.needsUpdate = leaves.instanceMatrix.needsUpdate = keys.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}
export function makePuff() {
  const g = new THREE.Group(); const list = [];
  for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex(), color: '#e8e0ff', transparent: true, depthWrite: false, opacity: 0 })); g.add(s); list.push(s); }
  g.userData = {
    set(u) {
      list.forEach((s, i) => {
        const k = clamp(u * 1.2 - i * 0.03, 0, 1);
        const a = i / 9 * PI * 2;
        s.position.set(Math.cos(a) * 0.25 * k, Math.sin(a) * 0.2 * k + 0.1 * k, 0.15 + 1.1 * ease.outCubic(k));
        s.scale.setScalar(0.25 + 1.2 * k);
        s.material.opacity = k > 0 ? 0.8 * Math.sin(PI * k) : 0;
      });
      g.visible = u > 0 && u < 1;
    },
  };
  g.userData.set(0);
  return g;
}
const circleAlpha = () => cachedTex('circAlpha', 256, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h / 2, w * 0.38, w / 2, h / 2, w * 0.5); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, PI * 2); g.fill(); });
export function makeBubble() {
  const g = new THREE.Group(); g.name = 'bubble';
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false }));
  g.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.04, 8, 48), basic('#fff6c8', { toneMapped: false })); g.add(ring);
  const glow = glowSprite('#ffe9a0', 2.2, 0.45); glow.position.z = -0.05; g.add(glow);
  const trail = [];
  for (let i = 0; i < 3; i++) { const b = sph(0.08 - i * 0.02, basic('#fff6c8', { toneMapped: false }), 10, 8); b.position.set(-0.35 - i * 0.18, -0.75 - i * 0.22, 0); g.add(b); trail.push(b); }
  g.userData = { disc, trail };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ Floor Three (set)
const skyTex = () => cachedTex('f3sky', 2048, 1024, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#0c0628'); gr.addColorStop(0.35, '#22145a'); gr.addColorStop(0.5, '#4a2f8a'); gr.addColorStop(0.58, '#3a2470'); gr.addColorStop(1, '#120a30');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 22; i++) {   // nebula blobs
    const x = hash(i * 1.3) * w, y = h * (0.2 + 0.45 * hash(i * 2.1)), r = 80 + 220 * hash(i * 3.3);
    const col = ['255,110,200', '110,220,255', '170,120,255', '255,180,120'][i % 4];
    const ng = g.createRadialGradient(x, y, 1, x, y, r); ng.addColorStop(0, `rgba(${col},0.22)`); ng.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = ng; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  for (let i = 0; i < 1400; i++) { const x = hash(i * 7.31) * w, y = hash(i * 3.17) * h * 0.62, r = 0.6 + 1.8 * Math.pow(hash(i * 9.1), 3); g.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * hash(i * 1.9)})`; g.beginPath(); g.arc(x, y, r, 0, PI * 2); g.fill(); }
});
export function buildFloorThree() {
  const root = new THREE.Group(); root.name = 'floorThree';
  const background = new THREE.Color('#1a1040');
  const fog = new THREE.Fog('#2e2068', 16, 80);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; root.add(sky);
  // twinkling star points
  const NSt = 500, sp = new Float32Array(NSt * 3);
  for (let i = 0; i < NSt; i++) { const a = hash(i * 1.1) * PI * 2, el = 0.05 + 1.3 * hash(i * 2.3), r = 200; sp[i * 3] = Math.cos(a) * Math.cos(el) * r; sp[i * 3 + 1] = Math.sin(el) * r - 20; sp[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const starM = new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9, depthWrite: false });
  root.add(new THREE.Points(sg, starM));
  // lights
  const hemi = new THREE.HemisphereLight('#cbbcff', '#3a2a66', 1.35); root.add(hemi);
  const key = new THREE.DirectionalLight('#f3e8ff', 1.25); key.position.set(-6, 12, -8); key.target.position.set(0, 0, 10); root.add(key, key.target);
  const front = new THREE.DirectionalLight('#9ad8ff', 0.55); front.position.set(5, 6, 30); front.target.position.set(0, 1, 8); root.add(front, front.target);
  // the floating elevator car (doors open) + its cut cable
  const car = makeElevatorCar(); root.add(car);
  const cable = cyl(0.03, 0.03, 60, '#3a3a44', 6); cable.position.y = CAR.H + 30; root.add(cable);
  const under = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.6, 6), std('#5e587a', { roughness: 1 })); under.rotation.x = PI; under.position.y = -0.92; root.add(under);
  // tile path along +Z
  const NTile = 44, tileZ = [];
  const slabI = new THREE.InstancedMesh(new RoundedBoxGeometry(1.35, 0.32, 1.35, 2, 0.06), std('#958fb0', { roughness: 0.9 }), NTile);
  const rockI = new THREE.InstancedMesh(new THREE.ConeGeometry(0.62, 1.0, 6), std('#5e587a', { roughness: 1 }), NTile);
  const crystalI = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.07, 0), new THREE.MeshBasicMaterial({ color: '#8ff0ff', toneMapped: false }), NTile * 2);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s1 = V(1, 1, 1);
  for (let i = 0; i < NTile; i++) {
    const z = 1.75 + i * 1.45, x = (hash(i * 1.9) - 0.5) * 0.22;
    tileZ.push({ x, z });
    e.set(0, (hash(i * 2.7) - 0.5) * 0.3, 0); q.setFromEuler(e);
    M.compose(p.set(x, -0.16, z), q, s1); slabI.setMatrixAt(i, M);
    e.set(PI, hash(i) * 2, 0); q.setFromEuler(e); M.compose(p.set(x, -0.82, z), q, s1); rockI.setMatrixAt(i, M);
    for (let k = 0; k < 2; k++) { const a = hash(i * 5 + k) * PI * 2; M.compose(p.set(x + Math.cos(a) * 0.62, -0.05, z + Math.sin(a) * 0.62), q, V(1, 1.6, 1)); crystalI.setMatrixAt(i * 2 + k, M); }
  }
  root.add(slabI, rockI, crystalI);
  // hero doors
  const HD = [
    { name: 'd1', x: -2.15, y: 0, z: 7.0, yaw: PI / 2, color: '#8a5532' },
    { name: 'd2', x: 2.15, y: 0, z: 11.5, yaw: -PI / 2, color: '#3f7a7a' },
    { name: 'd3', x: -2.0, y: 0.0, z: 18.4, yaw: PI - 0.36, color: '#7a4a2a', keyY: 1.32 },
    { name: 'd4', x: 0, y: 0.0, z: 19.1, yaw: PI, color: '#6b3d22', keyY: 1.32 },
    { name: 'd5', x: 2.0, y: 0.0, z: 18.4, yaw: PI + 0.36, color: '#9a6038', keyY: 1.32 },
  ];
  const anchors = {};
  const mk = (name, x, y, z, yaw = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.y = yaw; root.add(o); anchors[name] = o; return o; };
  const doors = HD.map((d, i) => {
    const door = makeDoor({ color: d.color, seed: i, keyY: d.keyY ?? 0.92 });
    door.position.set(d.x, d.y, d.z); door.rotation.y = d.yaw; root.add(door);
    door.userData.def = d;
    const fx = Math.sin(d.yaw), fz = Math.cos(d.yaw);
    mk('f3.' + d.name, d.x + fx * 1.15, d.y, d.z + fz * 1.15, d.yaw + PI);
    return door;
  });
  mk('f3.car', 0, 0, 0, 0);
  // instanced door field: two rows along the path + a scattered cloud of doors
  const list = [];
  for (let i = 0; i < 46; i++) for (const side of [-1, 1]) {
    const z = -4 + i * 2.6 + (side > 0 ? 1.3 : 0);
    if (z > 5.5 && z < 21) continue;   // keep the hero area clear
    const x = side * (4.4 + 0.8 * hash(i * 3.1 + side));
    list.push({ x, y: -1.2 + 3.6 * hash(i * 1.7 + side * 9), z, yaw: side < 0 ? PI / 2 + (hash(i) - 0.5) * 0.5 : -PI / 2 + (hash(i * 2) - 0.5) * 0.5, open: 0.12 + 0.35 * hash(i * 5.3 + side), color: DOOR_COLS[(i * 3 + (side > 0 ? 1 : 0)) % DOOR_COLS.length], s: 1, ph: hash(i * 7 + side) * 6, row: true });
  }
  for (let i = 0; i < 26; i++) for (const side of [-1, 1]) {   // a second, closer row in the hero area (behind the hero doors)
    const z = 4 + i * 1.0; if (z > 22) continue;
    if (i % 3) continue;
    list.push({ x: side * (5.6 + hash(i)), y: -0.5 + 2.5 * hash(i * 3.3 + side), z, yaw: side < 0 ? PI / 2 + 0.3 : -PI / 2 - 0.3, open: 0.2 + 0.3 * hash(i + side), color: DOOR_COLS[(i + 4) % DOOR_COLS.length], s: 1, ph: hash(i * 11 + side) * 6, row: true });
  }
  for (let i = 0; i < 170; i++) {
    const side = hash(i * 1.1) < 0.5 ? -1 : 1;
    const x = side * (8 + 46 * Math.pow(hash(i * 2.2), 1.3)), z = -25 + 150 * hash(i * 3.3), y = -9 + 26 * hash(i * 4.4);
    list.push({ x, y, z, yaw: hash(i * 5.5) * PI * 2, open: 0.05 + 0.5 * hash(i * 6.6), color: DOOR_COLS[i % DOOR_COLS.length], s: 0.9 + 0.5 * hash(i * 7.7), ph: hash(i * 8.8) * 6, row: false });
  }
  // vanish order: rows by distance along the path, scattered ones later
  list.forEach((d, i) => { d.tv = d.row ? Math.max(0, (d.z - 20) * 0.05) + 0.02 * hash(i) : 0.35 + 0.9 * hash(i * 9.9); });
  const field = makeDoorField(list); root.add(field);
  // pastel floaters
  const pastel = ['#ffb3d9', '#b3f0ff', '#d4b3ff', '#ffd9a8', '#b8ffcc'].map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.75, roughness: 0.4 }));
  const fgeo = [new THREE.OctahedronGeometry(0.5, 0), new THREE.TorusGeometry(0.45, 0.14, 8, 20), new THREE.IcosahedronGeometry(0.45, 0), new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.TetrahedronGeometry(0.55, 0)];
  const floaters = [];
  for (let i = 0; i < 46; i++) {
    const m = new THREE.Mesh(fgeo[i % 5], pastel[(i * 3) % 5]);
    const side = i % 2 ? 1 : -1;
    m.userData = { x: side * (3 + 30 * hash(i * 1.3)), y: -3 + 14 * hash(i * 2.9), z: -12 + 95 * hash(i * 4.1), ph: hash(i * 5.7) * 6, s: 0.3 + 1.1 * hash(i * 6.1) };
    m.scale.setScalar(m.userData.s); root.add(m); floaters.push(m);
  }
  const floatGlows = floaters.filter((_, i) => i % 3 === 0).map((m) => { const gl = glowSprite(m.material.color.getStyle(), 2.4 * m.userData.s, 0.35); root.add(gl); return { gl, m }; });
  // big distant islands
  const isl = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group(); const side = i % 2 ? 1 : -1;
    const r = 1.5 + 2.5 * hash(i * 3.7);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, 0.5, 7), std('#8f88b0', { roughness: 0.95 })); g.add(top);
    const rk = new THREE.Mesh(new THREE.ConeGeometry(r * 0.9, r * 1.8, 7), std('#544e72', { roughness: 1 })); rk.rotation.x = PI; rk.position.y = -0.25 - r * 0.9; g.add(rk);
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r * 0.98, 0.08, 7), std('#6fd6a8', { emissive: '#2a8a6a', emissiveIntensity: 0.4 })); grass.position.y = 0.28; g.add(grass);
    g.userData = { x: side * (14 + 30 * hash(i * 1.9)), y: -6 + 10 * hash(i * 2.2), z: 5 + 90 * hash(i * 5.1), ph: i };
    root.add(g); isl.push(g);
  }
  // foot fog + motes
  const fogLow = makeFogField({ n: 46, w: 16, d: 46, h: 0.6, size: 4.5, color: '#c4b4ff', opacity: 0.32, seed: 2 }); fogLow.position.set(0, -0.4, 16); root.add(fogLow);
  const fogFar = makeFogField({ n: 26, w: 70, d: 90, h: 4, size: 16, color: '#8a74d8', opacity: 0.2, seed: 5 }); fogFar.position.set(0, -4, 40); root.add(fogFar);
  const motes = makeMotes({ n: 70, w: 14, h: 6, d: 30, color: '#f6d9ff', size: 0.05, seed: 3 }); motes.position.set(0, 2.5, 12); root.add(motes);
  const options = {};
  const set = {
    root, anchors, background, fog, options, doors, car, field, tileZ, hemi, key, fogLow, exposure: 1.05,
    setLighting() {}, set() { return set; },
    tileY() { return 0; },
    update(t) {
      starM.opacity = 0.75 + 0.2 * Math.sin(t * 1.3);
      floaters.forEach((m) => { const u = m.userData; m.position.set(u.x + 0.6 * Math.sin(t * 0.21 + u.ph), u.y + 0.7 * Math.sin(t * 0.37 + u.ph), u.z + 0.4 * Math.cos(t * 0.17 + u.ph)); m.rotation.set(t * 0.25 + u.ph, t * 0.32 + u.ph, 0); });
      floatGlows.forEach(({ gl, m }) => gl.position.copy(m.position));
      isl.forEach((g) => { const u = g.userData; g.position.set(u.x, u.y + 0.4 * Math.sin(t * 0.3 + u.ph), u.z); g.rotation.y = 0.05 * t + u.ph; });
      fogLow.userData.set(t, 1); fogFar.userData.set(t, 1); motes.userData.set(t, 1);
      car.userData.set({ t, doors: 1, glow3: 0.9, floor: '3' });
    },
    info: { kind: 'floorThree', doors: list.length },
  };
  set.update(0);
  field.userData.set(0, null);
  return set;
}
