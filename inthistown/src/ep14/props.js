// Episode 14 ("Tape Duty") props.  Same conventions as src/props.js (SPEC.md §2/§7): ES module, metres, Y up,
// deterministic (no Math.random / clocks); animated things are pure functions of the t / k passed in.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   TOWER = { x, z, deck }        town-local base of the clock tower and the height of the new roof deck
//   makeTowerTop()                Group (origin = tower base on the ground, town-local axes): a taller shaft that
//        swallows the old clock room + roof, four big glowing clock faces at y ≈ 13.6, a stone roof deck at
//        TOWER.deck with a crenellated parapet, corner lanterns, a TAPE crate and a pile of used cardboard tubes.
//        userData.setClock(h, m) (all four faces), userData.lanterns (Meshes), userData.clockY, userData.half
//   makeSkyCrack({ H, n, seed, wmax })  Group: the jagged crack in the sky. XY plane, faces +Z, origin = bottom tip.
//        userData.set({ t, open, glow, pulse, bulge, tint, seal, sliver, grow, growFrom })
//        userData.tape(i, peel 0..1, t, strain)   userData.nTape     userData.setFingers({ slide, curl, t, flinch })
//        userData.wrap (Group, gift-wrap patch, hidden by default)     userData.xAt(y) centre line x at height y
//        userData.fingerY (heights of the 4 fingers)  userData.slamY (where the first gum blob lands)
//   makeTapeRoll()                Group: giant tape roll, axis along local Z (look through it along Z).
//        userData.set(full 0..1)  (0 = just the brown cardboard tube), userData.tail (hanging tape end)
//   makeLadder(len)               Group: absurdly tall ladder; rails at z = ±0.36, rungs along Z, origin = bottom centre
//   makePicnicTable()             Group: wooden picnic table + two benches (seat 0.45, z = ±0.62), long axis X
//   makePickleJar()               Group: green-lidded jar of pickles (~0.32 tall)
//   makeHomework(), makeSock(), makeGumPack()   small pocket items (origin = bottom centre)
//   makeGlint()                   Group: 4-point star glint.  userData.set(k 0..1)
//   makeGumBlob(r, seed)          Group: cluster of pink spheres (radius ≈ r)
//   makeGumStrings(n)             Group: n thin pink strings.  userData.set(pairs [[Vector3, Vector3], …]) (local coords)
//   makeFogRing({ n, r, h })      Group of soft fog sprites drifting around the origin.  userData.set(t, a)
//   makeMotes({ n, w, h, d, color })  drifting glowing specks.  userData.set(t, a)
//   makeLeaves(n)                 tumbling leaves blowing along +X.  userData.set(t)
//   makeGiantEye()                Group: a huge grey eye (≈ 3 m) with a heavy lid.  userData.set(lid 0..1, lookX, lookY)
//   makeCurtainWindow()           Group: lit window pane with two curtains (1.1 × 1.35).  userData.set(close 0..1, light)
//   makeCheeks(skin)              Group: two puffed cheeks for a human head (parent to joints.head). userData.set(k)
//   makeBubble()                  Group: pink bubble-gum bubble (parent to joints.head).  userData.set(r)
//   makeKnuckles(color)           Group: extra knuckle bumps for a hand (parent to joints.handL/handR)
//   makeGiantHand()               Group: a giant grey hand (palm + 4 many-knuckled fingers), fingers point +Y.
//   buildOtherSide()              Set: the dim purple space on the other side of the crack (own lights/fog).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, hash, lerp, rng, canvasTexture, ease } from '../lib/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const FONTW = (s) => `900 ${s}px "ITT World Text", "Nunito", "DejaVu Sans", Arial, sans-serif`;
const FONTD = (s) => `${s}px "ITT World Display", "Luckiest Guy", Impact, "DejaVu Sans", sans-serif`;
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
function cyl(rt, rb, h, m, seg = 24) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; o.receiveShadow = true; return o; }
function sph(r, m, ws = 16, hs = 12) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }

let _glow = null;
export const glowTex = () => _glow ??= canvasTexture(256, 256, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
let _fog = null;
const fogTex = () => _fog ??= canvasTexture(256, 256, (g, w, h) => {
  for (let i = 0; i < 9; i++) {
    const x = w * (0.3 + 0.4 * hash(i * 1.7)), y = h * (0.35 + 0.3 * hash(i * 2.9)), r = w * (0.18 + 0.16 * hash(i * 4.1));
    const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.42)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
});

// ════════════════════════════════════════════════════════════════════════════ the clock tower top
export const TOWER = { x: -51, z: 1.5, deck: 16.6 };
const _clockTex = new Map();
function clockTex(h, m) {
  const k = `${h}:${m}`;
  if (_clockTex.has(k)) return _clockTex.get(k);
  const t = canvasTexture(512, 512, (g, w) => {
    const c = w / 2;
    const gr = g.createRadialGradient(c, c, 20, c, c, c); gr.addColorStop(0, '#fffdf2'); gr.addColorStop(1, '#f3e2b8');
    g.fillStyle = gr; g.beginPath(); g.arc(c, c, c - 4, 0, PI * 2); g.fill();
    g.lineWidth = 22; g.strokeStyle = '#3a2a1c'; g.beginPath(); g.arc(c, c, c - 14, 0, PI * 2); g.stroke();
    g.fillStyle = '#3a2a1c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2;
      if (i % 3 === 0) { g.font = FONTW(64); g.fillText(String(i === 0 ? 12 : i), c + Math.sin(a) * 176, c - Math.cos(a) * 176 + 4); }
      else { g.beginPath(); g.arc(c + Math.sin(a) * 186, c - Math.cos(a) * 186, 10, 0, PI * 2); g.fill(); }
    }
    for (let i = 0; i < 60; i++) { if (i % 5 === 0) continue; const a = (i / 60) * PI * 2; g.beginPath(); g.arc(c + Math.sin(a) * 214, c - Math.cos(a) * 214, 3.5, 0, PI * 2); g.fill(); }
    const ah = ((h % 12) + m / 60) / 12 * PI * 2, am = (m / 60) * PI * 2;
    g.lineCap = 'round';
    g.strokeStyle = '#1d1410'; g.lineWidth = 30; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(ah) * 110, c - Math.cos(ah) * 110); g.stroke();
    g.strokeStyle = '#c0182b'; g.lineWidth = 18; g.beginPath(); g.moveTo(c - Math.sin(am) * 30, c + Math.cos(am) * 30); g.lineTo(c + Math.sin(am) * 190, c - Math.cos(am) * 190); g.stroke();
    g.fillStyle = '#1d1410'; g.beginPath(); g.arc(c, c, 22, 0, PI * 2); g.fill();
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(c, c, 9, 0, PI * 2); g.fill();
  });
  _clockTex.set(k, t);
  return t;
}
function labelTex(lines, { w = 512, h = 256, bg = '#c98a4b', fg = '#2a1a10', border = '#5a3a22', display = true } = {}) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, i) => { const F = display ? FONTD : FONTW; const s = fit(g, l, F, w * 0.84, Math.floor(h / lines.length * 0.72)); g.font = F(s); g.fillText(l, w / 2, h * (i + 0.5) / lines.length + s * 0.06); });
  });
}
export function makeTowerTop() {
  const g = new THREE.Group();
  const wall = '#e8d9b8', trim = '#c9b48c', stone = '#b9b4ad', stoneD = '#9a958c';
  const W = 4.4, y0 = 9.5, D = TOWER.deck;
  g.add(box(W, D - 0.3 - y0, W, wall, 0, (y0 + D - 0.3) / 2, 0, 0.12));
  g.add(box(W + 0.36, 0.34, W + 0.36, trim, 0, y0 + 0.17, 0, 0.05));
  g.add(box(W + 0.24, 0.24, W + 0.24, trim, 0, 11.9, 0, 0.04));
  g.add(box(W + 0.24, 0.24, W + 0.24, trim, 0, 15.3, 0, 0.04));
  // small arched windows (lit warm at night through emissive)
  const winM = new THREE.MeshStandardMaterial({ color: '#3b4f78', emissive: '#ffcf7a', emissiveIntensity: 0.55, roughness: 0.4 });
  for (let i = 0; i < 4; i++) {
    const yaw = i * PI / 2, n = V(Math.sin(yaw), 0, Math.cos(yaw)), sd = V(Math.cos(yaw), 0, -Math.sin(yaw));
    for (const s of [-1, 1]) { const m = box(0.5, 0.95, 0.08, winM, 0, 10.75, 0); m.position.addScaledVector(n, W / 2 + 0.01).addScaledVector(sd, s * 0.9); m.rotation.y = yaw; g.add(m); }
  }
  // clock faces
  const faceMat = new THREE.MeshBasicMaterial({ map: clockTex(11, 58) });
  const faceGeo = new THREE.CircleGeometry(1.3, 48), rimGeo = new THREE.CylinderGeometry(1.48, 1.48, 0.18, 48);
  const rimM = std('#3a2a1c', { roughness: 0.5 }), goldM = std('#d9a93a', { roughness: 0.35, metalness: 0.4 });
  const clockY = 13.6;
  for (let i = 0; i < 4; i++) {
    const yaw = i * PI / 2, n = V(Math.sin(yaw), 0, Math.cos(yaw));
    const rim = new THREE.Mesh(rimGeo, rimM); rim.rotation.set(PI / 2, 0, 0); const rg = new THREE.Group(); rg.add(rim); rg.position.copy(n).multiplyScalar(W / 2 + 0.05).add(V(0, clockY, 0)); rg.rotation.y = yaw; g.add(rg);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.07, 8, 48), goldM); ring.position.z = 0.1; rg.add(ring);
    const face = new THREE.Mesh(faceGeo, faceMat); face.position.z = 0.1; rg.add(face);
  }
  // deck slab + corbels
  g.add(box(5.5, 0.36, 5.5, stone, 0, D - 0.18, 0, 0.06));
  for (let i = 0; i < 4; i++) {
    const yaw = i * PI / 2, n = V(Math.sin(yaw), 0, Math.cos(yaw)), sd = V(Math.cos(yaw), 0, -Math.sin(yaw));
    for (let k = -2; k <= 2; k++) { const m = box(0.34, 0.4, 0.36, stoneD, 0, D - 0.5, 0); m.position.addScaledVector(n, W / 2 + 0.16).addScaledVector(sd, k * 0.95); m.rotation.y = yaw; g.add(m); }
  }
  // parapet: low wall + merlons, corner pillars with lanterns
  const H = 2.75;
  for (let i = 0; i < 4; i++) {
    const yaw = i * PI / 2, n = V(Math.sin(yaw), 0, Math.cos(yaw)), sd = V(Math.cos(yaw), 0, -Math.sin(yaw));
    const wl = box(5.5, 0.42, 0.28, stone, 0, D + 0.21, 0, 0.04); wl.position.addScaledVector(n, H - 0.14); wl.rotation.y = yaw; g.add(wl);
    for (let k = -2; k <= 2; k++) { const m = box(0.5, 0.36, 0.34, stoneD, 0, D + 0.6, 0, 0.04); m.position.addScaledVector(n, H - 0.14).addScaledVector(sd, k * 1.0); m.rotation.y = yaw; g.add(m); }
  }
  const lanterns = [];
  const lampM = new THREE.MeshStandardMaterial({ color: '#ffe2a0', emissive: '#ffc062', emissiveIntensity: 2.2, roughness: 0.3 });
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    g.add(box(0.5, 1.1, 0.5, stoneD, sx * (H - 0.2), D + 0.55, sz * (H - 0.2), 0.05));
    const cap = box(0.42, 0.08, 0.42, '#2a2a30', sx * (H - 0.2), D + 1.14, sz * (H - 0.2)); g.add(cap);
    const lamp = box(0.26, 0.34, 0.26, lampM, sx * (H - 0.2), D + 1.36, sz * (H - 0.2), 0.03); g.add(lamp); lanterns.push(lamp);
    g.add(box(0.34, 0.07, 0.34, '#2a2a30', sx * (H - 0.2), D + 1.56, sz * (H - 0.2)));
  }
  // set dressing: TAPE crate + used tubes + a bucket
  const crate = new THREE.Group(); crate.position.set(-1.75, D, -1.8); crate.rotation.y = 0.35; g.add(crate);
  crate.add(box(0.9, 0.62, 0.7, '#b07a44', 0, 0.31, 0, 0.03));
  for (const y of [0.12, 0.5]) crate.add(box(0.92, 0.07, 0.72, '#8a5a2e', 0, y, 0));
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), new THREE.MeshStandardMaterial({ map: labelTex(['TAPE'], { w: 512, h: 220, bg: '#e8c48a' }), roughness: 0.8 }));
  lbl.position.set(0, 0.32, 0.356); crate.add(lbl);
  const tubeM = std('#a87a4a'), tubeG = new THREE.CylinderGeometry(0.2, 0.2, 0.22, 20, 1, true);
  const tubes = new THREE.Group(); tubes.position.set(1.85, D, -1.9); g.add(tubes);
  [[0, 0.2, 0], [0.42, 0.2, 0.05], [0.2, 0.55, 0.02], [-0.05, 0.2, 0.42], [0.36, 0.2, 0.44]].forEach(([x, y, z], i) => {
    const t = new THREE.Mesh(tubeG, tubeM); t.material = new THREE.MeshStandardMaterial({ color: '#a87a4a', roughness: 0.85, side: THREE.DoubleSide });
    t.position.set(x, y, z); t.rotation.set(PI / 2, 0.3 * i, 0); t.castShadow = true; tubes.add(t);
  });
  const bucket = cyl(0.2, 0.16, 0.34, '#4f7fbf', 16); bucket.position.set(-1.9, D + 0.17, 1.85); g.add(bucket);
  g.userData = {
    lanterns, clockY, half: W / 2, faceMat,
    setClock(h, m) { faceMat.map = clockTex(h, m); },
  };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ the crack in the sky
function stripGeo(n) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 2 * 3), 3));
  const idx = [];
  for (let i = 0; i < n; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
  geo.setIndex(idx);
  return geo;
}
export function makeSkyCrack({ H = 13, n = 16, seed = 5, wmax = 2.7 } = {}) {
  const g = new THREE.Group();
  const R = rng(seed);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, env = Math.pow(Math.sin(PI * u), 0.6);
    const x = i === 0 ? 0 : (i % 2 ? 1 : -1) * (0.35 + 0.6 * R()) * (0.35 + 0.65 * env) * 1.25;
    const wb = Math.pow(Math.sin(PI * Math.min(1, u * 1.08)), 0.75) * (0.6 + 0.4 * R());
    pts.push({ x, y: u * H, u, env, wb: i === 0 ? 0.02 : wb });
  }
  const xAt = (y) => { const f = clamp(y / H, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return lerp(pts[i].x, pts[i + 1].x, k); };
  const rimMat = basic('#efc3ff', { toneMapped: false, fog: false, side: THREE.DoubleSide });
  const voidMat = basic('#14031f', { fog: false, side: THREE.DoubleSide });
  const coreMat = basic('#4a1490', { toneMapped: false, fog: false, side: THREE.DoubleSide });
  const rim = new THREE.Mesh(stripGeo(n), rimMat), vd = new THREE.Mesh(stripGeo(n), voidMat), core = new THREE.Mesh(stripGeo(n), coreMat);
  rim.renderOrder = 1; vd.renderOrder = 2; core.renderOrder = 3;
  [rim, vd, core].forEach((m) => { m.frustumCulled = false; g.add(m); });
  // halo sprites along the crack + a big sky glow
  const halos = [];
  for (let i = 1; i < n; i += 2) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#a54dff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
    s.position.set(pts[i].x, pts[i].y, -0.3); s.userData.i = i; g.add(s); halos.push(s);
  }
  const sky = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#6d22d8', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, opacity: 0.4 }));
  sky.position.set(0, H * 0.45, -2); sky.scale.set(46, 46, 1); g.add(sky);
  // tape strips
  const tapeMat = new THREE.MeshStandardMaterial({ color: '#f4e49c', emissive: '#7a6a28', emissiveIntensity: 0.45, roughness: 0.4, fog: false });
  const tapeEdge = new THREE.MeshStandardMaterial({ color: '#e0c66a', emissive: '#5a4c18', emissiveIntensity: 0.4, roughness: 0.5, fog: false });
  const tapes = [];
  const TI = [2, 4, 6, 8, 10, 12, 14].filter((i) => i < n);
  TI.forEach((i, k) => {
    const len = 2.6 + 1.3 * pts[i].wb;
    const pivot = new THREE.Group(); g.add(pivot);
    const m = box(len, 0.6, 0.05, tapeMat, len / 2, 0, 0); pivot.add(m);
    for (const s of [-1, 1]) pivot.add(box(len, 0.06, 0.06, tapeEdge, len / 2, s * 0.29, 0.005));
    const tilt = (hash(k * 3.1 + seed) - 0.5) * 0.5;
    tapes.push({ pivot, i, len, tilt, base: V(pts[i].x - len / 2 + (hash(k * 1.7) - 0.5) * 0.3, pts[i].y, 0.14) });
  });
  // fingers
  const FY = [3.2, 4.25, 5.3, 6.3], NS = [6, 7, 7, 6], S = 0.95;
  const boneM = new THREE.MeshStandardMaterial({ color: '#9a9da6', roughness: 0.7, emissive: '#2a2433', emissiveIntensity: 0.6, fog: false });
  const knM = new THREE.MeshStandardMaterial({ color: '#7a7d86', roughness: 0.8, emissive: '#221c2a', emissiveIntensity: 0.6, fog: false });
  const nailM = new THREE.MeshStandardMaterial({ color: '#d0cfd8', roughness: 0.3, emissive: '#3a3444', emissiveIntensity: 0.5, fog: false });
  const lineM = new THREE.MeshStandardMaterial({ color: '#55575f', roughness: 0.9, fog: false });
  const fingers = FY.map((fy, f) => {
    const root = new THREE.Group(); root.position.set(xAt(fy) + (f - 1.5) * 0.1, fy, 0); g.add(root);
    const segs = []; let parent = root;
    for (let j = 0; j < NS[f]; j++) {
      const sg = new THREE.Group(); sg.position.set(0, 0, j ? S : 0); parent.add(sg);
      const th = 0.82 - 0.03 * j;
      sg.add(box(th * 0.96, th * 0.9, S * 0.84, boneM, 0, 0, S * 0.5, 0.12));
      sg.add(box(th * 1.08, th * 1.02, 0.24, knM, 0, 0, 0.04, 0.07));
      for (const dz of [-0.05, 0.05]) sg.add(box(th * 0.55, 0.035, 0.035, lineM, 0, th * 0.52, 0.04 + dz));
      if (j === NS[f] - 1) { sg.add(box(th * 0.6, 0.09, 0.42, nailM, 0, th * 0.45, S * 0.62, 0.03)); sg.add(box(th * 0.92, th * 0.84, 0.3, boneM, 0, 0, S * 0.92, 0.14)); }
      segs.push(sg); parent = sg;
    }
    return { root, segs, ns: NS[f] };
  });
  fingers.forEach((F) => { F.root.visible = false; });
  // gum
  const gumM = new THREE.MeshStandardMaterial({ color: '#ff7ec4', roughness: 0.32, emissive: '#7a1446', emissiveIntensity: 0.55, fog: false });
  const strM = new THREE.MeshStandardMaterial({ color: '#ff9fd3', roughness: 0.4, emissive: '#6a1440', emissiveIntensity: 0.5, fog: false });
  const sphG = new THREE.SphereGeometry(1, 14, 10), cylG = new THREE.CylinderGeometry(1, 1, 1, 6);
  const gums = [];
  const SLAM_SEG = 3;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1], gg = new THREE.Group();
    gg.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, 0.25); g.add(gg);
    const sz = 0.55 + 0.45 * Math.max(a.wb, b.wb);
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Mesh(sphG, gumM); const r = sz * (0.55 + 0.35 * hash(i * 7 + k));
      m.scale.set(r * 1.25, r, r * 0.6); m.position.set((hash(i * 3 + k) - 0.5) * 0.8, (k - 1) * 0.35, 0.05 * k); m.castShadow = true; gg.add(m);
    }
    for (let k = 0; k < 2; k++) { const s = new THREE.Mesh(cylG, strM); s.scale.set(0.05, 1.6 + 0.8 * hash(i + k), 0.05); s.rotation.z = PI / 2 + (hash(i * 5 + k) - 0.5) * 1.2; s.position.set(0, (k - 0.5) * 0.4, 0.15); gg.add(s); }
    gg.visible = false;
    gums.push({ g: gg, i, rank: i === 0 ? 99 : Math.abs(i - SLAM_SEG) + (i < SLAM_SEG ? 0.5 : 0) });
  }
  const ranked = gums.filter((q) => q.i > 0).sort((p, q) => p.rank - q.rank);
  ranked.forEach((q, k) => { q.order = k; });
  // gift wrap patch (b07)
  const wrap = new THREE.Group(); wrap.visible = false; g.add(wrap);
  {
    const red = std('#d8263a', { roughness: 0.45 }), green = std('#1f9a4a', { roughness: 0.5 }), gold = std('#ffd23f', { roughness: 0.35, metalness: 0.2 });
    const cx = xAt(5.2) * 0.4, wy = 5.0, ww = 4.2, wh = 8.6;
    wrap.add(box(ww, wh, 0.3, red, cx, wy, 0.4, 0.08));
    for (let k = 0; k < 7; k++) { const s = box(ww + 0.02, 0.34, 0.32, green, cx, wy - wh / 2 + 0.75 + k * 1.2, 0.41); wrap.add(s); }
    wrap.add(box(0.5, wh + 0.04, 0.36, gold, cx, wy, 0.44));
    wrap.add(box(ww + 0.04, 0.5, 0.36, gold, cx, wy + 1.0, 0.44));
    const bow = new THREE.Group(); bow.position.set(cx, wy + 1.0, 0.7); wrap.add(bow);
    for (const s of [-1, 1]) {
      const c = cyl(0, 0.8, 1.5, gold, 16); c.rotation.z = s * PI / 2; c.rotation.y = s * 0.25; c.position.set(s * 0.75, 0.15, 0); bow.add(c);
      const tail = box(0.4, 1.4, 0.1, gold, s * 0.45, -0.85, 0.05); tail.rotation.z = s * 0.35; bow.add(tail);
    }
    bow.add(sph(0.42, gold));
  }
  const _hw = new Float32Array(n + 1), _z = new Float32Array(n + 1);
  const cVoid = new THREE.Color(), cRim = new THREE.Color(), cCore = new THREE.Color();
  let state = { open: 0.35, bulge: 0 };
  function writeStrip(mesh, wmul, add, zoff) {
    const p = mesh.geometry.attributes.position.array;
    for (let i = 0; i <= n; i++) {
      const hw = _hw[i] > 0.0005 ? _hw[i] * wmul + add * Math.min(1, _hw[i] * 40) : 0;
      p[i * 6] = pts[i].x - hw; p[i * 6 + 1] = pts[i].y; p[i * 6 + 2] = _z[i] + zoff;
      p[i * 6 + 3] = pts[i].x + hw; p[i * 6 + 4] = pts[i].y; p[i * 6 + 5] = _z[i] + zoff;
    }
    mesh.geometry.attributes.position.needsUpdate = true;
  }
  g.userData = {
    H, n, pts, xAt, fingerY: FY, slamY: (pts[SLAM_SEG].y + pts[SLAM_SEG + 1].y) / 2, slamX: (pts[SLAM_SEG].x + pts[SLAM_SEG + 1].x) / 2,
    nTape: tapes.length, tapes, wrap, fingers, gums,
    set({ t = 0, open = 0.35, glow = 1, pulse = 0, bulge = 0, tint = 0, seal = 0, sliver = true, grow = 1, growFrom = 0.4 } = {}) {
      state = { open, bulge };
      const yc = growFrom * H, rr = grow * H * 0.75;
      const nSealed = seal * ranked.length;
      for (let i = 0; i <= n; i++) {
        const p = pts[i];
        let hw = 0.5 * (open + 0.25 * bulge) * wmax * p.wb + 0.012;
        // seal narrows sealed segments to a thin scar
        const near = gums.filter((q) => q.i === i || q.i === i - 1);
        let sealedK = 0;
        for (const q of near) { const k = q.i === 0 ? (sliver ? 0 : 1) : clamp(nSealed - q.order, 0, 1); sealedK = Math.max(sealedK, k); }
        if (i === 0 && !sliver) sealedK = 1;
        hw *= 1 - 0.85 * sealedK;
        if (grow < 1) hw *= clamp((rr - Math.abs(p.y - yc)) / 0.9, 0, 1);
        _hw[i] = hw;
        _z[i] = bulge * 1.4 * p.env + 0.15 * bulge * Math.sin(t * 13 + i);
      }
      const tintK = clamp(tint, 0, 1);
      cRim.set('#efc3ff').lerp(new THREE.Color('#ffb0dc'), tintK).multiplyScalar(0.55 + 0.45 * glow + 0.8 * pulse);
      rimMat.color.copy(cRim);
      cCore.set('#4a1490').lerp(new THREE.Color('#b44dff'), clamp(pulse, 0, 1)).lerp(new THREE.Color('#ff6fb8'), tintK * 0.6);
      coreMat.color.copy(cCore);
      cVoid.set('#14031f').lerp(new THREE.Color('#2a0a44'), clamp(pulse, 0, 1) * 0.6);
      voidMat.color.copy(cVoid);
      writeStrip(rim, 1, 0.09 + 0.07 * glow + 0.12 * pulse, 0.0);
      writeStrip(vd, 1, 0, 0.03);
      writeStrip(core, 0.42, 0, 0.05);
      halos.forEach((s) => {
        const p = pts[s.userData.i];
        const m = grow < 1 ? clamp((rr - Math.abs(p.y - yc)) / 0.9, 0, 1) : 1;
        const sc = (2.6 + 4.5 * open * p.wb + 2.5 * pulse) * (0.6 + 0.4 * p.env) * (1 - 0.5 * tintK);
        s.scale.set(sc, sc * 1.2, 1); s.position.z = _z[s.userData.i] - 0.3;
        s.material.opacity = clamp((0.42 * glow + 0.45 * pulse) * m * (1 - 0.55 * tintK), 0, 1);
        s.material.color.set(tintK > 0.5 ? '#ff6fc0' : '#a54dff');
        s.visible = s.material.opacity > 0.005;
      });
      sky.material.opacity = clamp((0.28 * glow + 0.35 * pulse) * (grow < 1 ? grow : 1) * (1 - 0.6 * tintK), 0, 1);
      sky.material.color.set(tintK > 0.5 ? '#c03a90' : '#6d22d8');
      sky.visible = sky.material.opacity > 0.005;
      gums.forEach((q) => {
        const k = q.i === 0 ? (sliver ? 0 : 1) : clamp(nSealed - q.order, 0, 1);
        q.g.visible = k > 0.001;
        if (q.g.visible) { const s = ease.outBack(k); q.g.scale.set(s, s, s); q.g.position.z = 0.25 + _z[q.i]; }
      });
      tapes.forEach((tp) => { tp.pivot.position.z = tp.base.z + _z[tp.i]; });
    },
    /** tape strip i: peel 0 = stuck, 1 = gone. strain wobbles it (the crack pushing). */
    tape(i, peel = 0, t = 0, strain = 0) {
      const tp = tapes[i]; if (!tp) return;
      const pv = tp.pivot;
      pv.visible = peel < 0.999;
      pv.position.x = tp.base.x; pv.position.y = tp.base.y;
      pv.rotation.set(0, 0, tp.tilt);
      pv.scale.set(1, 1 + 0.12 * strain, 1);
      if (strain > 0) { pv.rotation.x = 0.1 * strain * Math.sin(t * 31 + i * 2); pv.position.z += 0.25 * strain * Math.max(0, Math.sin(t * 9 + i)); }
      if (peel > 0) {
        const a = ease.outCubic(clamp(peel * 2.2, 0, 1));
        pv.rotation.y = -1.25 * a;
        const d = clamp((peel - 0.3) / 0.7, 0, 1);
        pv.position.x += d * 5.5 + 0.4 * Math.sin(t * 7 + i) * d;
        pv.position.y += -d * 6 + 0.5 * Math.sin(t * 5.3 + i) * d;
        pv.position.z += d * 7;
        pv.rotation.x += d * 3.2 + 0.6 * Math.sin(t * 9 + i) * d;
        pv.rotation.z += d * 2.0;
      }
    },
    /** fingers: slide 0 hidden … 1 fully out; curl 0 straight … 1 gripping round the edge; flinch 0..1 */
    setFingers({ slide = 0, curl = 0, t = 0, flinch = 0, retreat = 0 } = {}) {
      fingers.forEach((F, f) => {
        const L = F.ns * S;
        const sl = clamp(slide * (1.12 - 0.06 * f) - retreat, 0, 1);
        F.root.visible = sl > 0.01;
        if (!F.root.visible) return;
        const e = sl * L, z0 = -(L - e);
        F.root.position.z = z0 + _z[Math.round(F.root.position.y / H * n)] * 0.5;
        F.root.rotation.set(0.04 * Math.sin(t * 1.3 + f), 0, 0);
        F.segs.forEach((sg, j) => {
          const sz = z0 + j * S;
          sg.visible = sz + S > -0.05;
          const out = sz > 0 ? 1 : 0;
          const wig = 0.07 * Math.sin(t * 2.6 + j * 0.9 + f * 1.7) + flinch * 0.35 * Math.sin(t * 47 + j + f * 3);
          sg.rotation.y = j === 0 ? 0 : -out * (curl * (0.36 + 0.03 * f) + wig - flinch * 0.25);
          sg.rotation.x = j === 0 ? 0 : out * 0.04 * Math.sin(t * 1.9 + j);
        });
      });
    },
    get state() { return state; },
  };
  g.userData.set({});
  for (let i = 0; i < tapes.length; i++) g.userData.tape(i, 0, 0);
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ tape roll + ladder
export function makeTapeRoll({ R = 0.42, r = 0.26, w = 0.3 } = {}) {
  const g = new THREE.Group();
  const ax = new THREE.Group(); ax.rotation.x = PI / 2; g.add(ax);   // cylinder axis Y → local Z
  const card = new THREE.MeshStandardMaterial({ color: '#b07f4c', roughness: 0.85, side: THREE.DoubleSide });
  const cardIn = new THREE.MeshStandardMaterial({ color: '#7a5230', roughness: 0.9, side: THREE.BackSide });
  const tOut = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.035, r + 0.035, w, 36, 1, true), card); tOut.castShadow = true; ax.add(tOut);
  const tIn = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 36, 1, true), cardIn); ax.add(tIn);
  for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.035, 36), card); ring.rotation.x = -PI / 2 * s; ring.position.y = s * w / 2; ax.add(ring); }
  const tapeM = new THREE.MeshStandardMaterial({ color: '#f2e08f', emissive: '#4a4214', emissiveIntensity: 0.35, roughness: 0.3, side: THREE.DoubleSide });
  const tape = new THREE.Group(); ax.add(tape);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, w * 0.98, 40, 1, true), tapeM); wall.castShadow = true; tape.add(wall);
  const caps = [];
  const tail = box(w * 0.9, 0.012, 0.32, tapeM, 0, 0, 0); tape.add(tail);
  let last = -1;
  g.userData = {
    tail,
    set(full = 1) {
      const f = clamp(full, 0, 1);
      tape.visible = f > 0.01;
      if (!tape.visible) return;
      const Ro = lerp(r + 0.05, R, f);
      wall.scale.set(Ro, 1, Ro);
      const q = Math.round(f * 40);
      if (q !== last) {
        last = q;
        caps.forEach((c) => { tape.remove(c); c.geometry.dispose(); }); caps.length = 0;
        for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.RingGeometry(r + 0.035, Ro, 40), tapeM); c.rotation.x = -PI / 2 * s; c.position.y = s * w * 0.49; tape.add(c); caps.push(c); }
      }
      tail.position.set(0, 0, Ro + 0.0); tail.rotation.set(0, 0, 0); tail.position.x = 0; tail.position.z = 0;
      tail.position.set(Ro + 0.006, 0, 0.16); tail.rotation.set(0, 0, PI / 2);
    },
  };
  g.userData.set(1);
  return g;
}
export function makeLadder(len = 26, w = 0.72) {
  const g = new THREE.Group(), wood = std('#c98a4b', { roughness: 0.7 });
  for (const s of [-1, 1]) g.add(box(0.11, len, 0.1, wood, 0, len / 2, s * w / 2));
  const n = Math.floor((len - 0.3) / 0.42);
  const rung = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.06, w), std('#b8783c'), n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation(0, 0.3 + i * 0.42, 0); rung.setMatrixAt(i, m4); }
  rung.castShadow = true; g.add(rung);
  g.userData = { rungStep: 0.42, len };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ park + house props
export function makePicnicTable() {
  const g = new THREE.Group(), wood = '#a8743f', woodD = '#8a5a2e';
  for (let k = 0; k < 4; k++) g.add(box(1.9, 0.06, 0.19, wood, 0, 0.77, -0.3 + k * 0.2, 0.02));
  for (const s of [-1, 1]) {
    g.add(box(1.9, 0.06, 0.3, wood, 0, 0.45, s * 0.62, 0.02));
    for (const sx of [-0.75, 0.75]) {
      const leg = box(0.08, 0.95, 0.1, woodD, sx, 0.42, s * 0.33); leg.rotation.x = s * 0.62; g.add(leg);
    }
  }
  for (const sx of [-0.75, 0.75]) g.add(box(0.08, 0.07, 1.5, woodD, sx, 0.4, 0));
  return g;
}
export function makePickleJar() {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.26, 24), new THREE.MeshStandardMaterial({ color: '#cfe8c0', roughness: 0.15, transparent: true, opacity: 0.55 }));
  glass.position.y = 0.13; g.add(glass);
  const brine = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 20), new THREE.MeshStandardMaterial({ color: '#a8c84a', roughness: 0.4, transparent: true, opacity: 0.6 }));
  brine.position.y = 0.11; g.add(brine);
  for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.12, 4, 8), std('#5f8a2a')); const a = i * 1.3; p.position.set(Math.cos(a) * 0.05, 0.12, Math.sin(a) * 0.05); p.rotation.z = 0.2 * Math.sin(a); g.add(p); }
  const lid = cyl(0.13, 0.13, 0.06, '#2f8f45', 24); lid.position.y = 0.29; g.add(lid);
  const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.122, 0.09, 24, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: labelTex(['PICKLES'], { w: 512, h: 160, bg: '#fff4d6', fg: '#2f6a2a', border: '#2f6a2a', display: true }), roughness: 0.7 }));
  lbl.position.y = 0.13; g.add(lbl);
  return g;
}
export function makeHomework() {
  const g = new THREE.Group();
  const tex = canvasTexture(256, 192, (c, w, h) => {
    c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#8fb3e8'; c.lineWidth = 3; for (let y = 34; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = '#e8828a'; c.beginPath(); c.moveTo(34, 0); c.lineTo(34, h); c.stroke();
    c.fillStyle = '#2a2a40'; c.font = FONTW(30); c.fillText('MATHS', 48, 28);
    c.fillStyle = '#d0142a'; c.font = FONTD(80); c.fillText('F', 180, 150);
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.19), [std('#fbfaf4'), std('#fbfaf4'), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), std('#fbfaf4'), std('#fbfaf4'), std('#fbfaf4')]);
  m.position.y = 0.015; m.castShadow = true; g.add(m);
  const fold = box(0.26, 0.012, 0.09, '#f0eee4', 0, 0.036, -0.05); fold.rotation.x = 0.12; g.add(fold);
  return g;
}
export function makeSock() {
  const g = new THREE.Group();
  const cols = ['#ff4fa3', '#ffffff', '#3ee0c8', '#ffffff', '#ff4fa3', '#ffffff', '#3ee0c8'];
  cols.forEach((c, i) => g.add(box(0.11, 0.05, 0.05, c, 0, 0.026, -0.15 + i * 0.05, 0.015)));
  g.add(box(0.11, 0.05, 0.16, '#ff4fa3', 0.06, 0.026, 0.2, 0.02));
  g.add(box(0.12, 0.055, 0.06, '#1d1d22', 0.11, 0.028, 0.25, 0.02));
  return g;
}
export function makeGumPack() {
  const g = new THREE.Group();
  const tex = labelTex(['GRANDMA\'S', 'GUM'], { w: 384, h: 192, bg: '#ff6fb8', fg: '#ffffff', border: '#ffffff', display: true });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.04, 0.085), [std('#ff4fa3'), std('#ff4fa3'), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.15 }), std('#ff4fa3'), std('#ff4fa3'), std('#ff4fa3')]);
  m.position.y = 0.02; m.castShadow = true; g.add(m);
  return g;
}
export function makeGlint() {
  const g = new THREE.Group();
  const m = basic('#ffffff', { toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const a = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.035), m), b = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.4), m);
  g.add(a); g.add(b);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffe6f6', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(0.22, 0.22, 1); g.add(halo);
  g.userData = { set(k) { const s = Math.sin(PI * clamp(k, 0, 1)); g.visible = s > 0.01; g.scale.setScalar(Math.max(0.01, s)); g.rotation.z = k * 1.2; m.opacity = s; halo.material.opacity = s; } };
  g.userData.set(0);
  return g;
}
const _gumM = () => new THREE.MeshStandardMaterial({ color: '#ff7ec4', roughness: 0.3, emissive: '#7a1446', emissiveIntensity: 0.45 });
export function makeGumBlob(r = 0.5, seed = 1) {
  const g = new THREE.Group(), m = _gumM(), sg = new THREE.SphereGeometry(1, 16, 12);
  for (let k = 0; k < 6; k++) {
    const s = new THREE.Mesh(sg, m), rr = r * (0.45 + 0.35 * hash(seed * 9 + k));
    const a = hash(seed + k * 2.3) * PI * 2, d = r * 0.5 * hash(seed * 3 + k);
    s.scale.setScalar(rr); s.position.set(Math.cos(a) * d, Math.sin(a) * d * 0.8, (hash(k * 5 + seed) - 0.5) * r * 0.4); s.castShadow = true; g.add(s);
  }
  return g;
}
export function makeGumStrings(n = 6) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#ff8fcb', roughness: 0.35, emissive: '#5a1036', emissiveIntensity: 0.3 });
  const geo = new THREE.CylinderGeometry(1, 1, 1, 6);
  const list = Array.from({ length: n }, () => { const s = new THREE.Mesh(geo, m); g.add(s); return s; });
  const _a = V(), _d = V(), _q = new THREE.Quaternion(), Y = V(0, 1, 0);
  g.userData = {
    set(pairs) {
      list.forEach((s, i) => {
        const p = pairs[i]; s.visible = !!p; if (!p) return;
        _d.subVectors(p[1], p[0]); const L = _d.length();
        s.position.copy(_a.addVectors(p[0], p[1]).multiplyScalar(0.5));
        s.quaternion.setFromUnitVectors(Y, _d.normalize());
        const th = p[2] ?? 0.018; s.scale.set(th, L, th);
      });
    },
  };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ atmosphere
export function makeFogRing({ n = 22, r = 6, h = 3, size = 7, color = '#9fb0d0' } = {}) {
  const g = new THREE.Group(), list = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex(), color, transparent: true, depthWrite: false, opacity: 0.3, fog: false }));
    g.add(s); list.push(s);
  }
  g.userData = {
    set(t, a = 1) {
      list.forEach((s, i) => {
        const ang = hash(i * 1.37) * PI * 2 + t * (0.05 + 0.05 * hash(i * 3.1)) * (i % 2 ? 1 : -1);
        const rr = r * (0.55 + 0.6 * hash(i * 2.2));
        s.position.set(Math.cos(ang) * rr, (hash(i * 4.7) - 0.5) * h + 0.3 * Math.sin(t * 0.4 + i), Math.sin(ang) * rr);
        const sc = size * (0.7 + 0.6 * hash(i * 5.9));
        s.scale.set(sc * 1.6, sc, 1);
        s.material.opacity = a * (0.18 + 0.14 * hash(i * 6.6));
        s.material.rotation = t * 0.05 * (i % 2 ? 1 : -1) + i;
      });
      g.visible = a > 0.001;
    },
  };
  return g;
}
export function makeMotes({ n = 50, w = 8, h = 6, d = 6, color = '#d9a8ff', size = 0.07 } = {}) {
  const g = new THREE.Group(), list = [];
  const mat = basic(color, { toneMapped: false, transparent: true, fog: false });
  const geo = new THREE.OctahedronGeometry(size, 0);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); g.add(m); list.push(m); }
  g.userData = {
    set(t, a = 1) {
      mat.opacity = a;
      list.forEach((m, i) => {
        const u = (hash(i * 1.3) + t * (0.04 + 0.05 * hash(i * 7.7))) % 1;
        m.position.set((hash(i * 2.1) - 0.5) * w + 0.3 * Math.sin(t * 0.9 + i), (u - 0.5) * h, (hash(i * 4.4) - 0.5) * d + 0.3 * Math.cos(t * 0.7 + i));
        const tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 2.3);
        m.scale.setScalar((0.4 + tw) * Math.sin(PI * u));
        m.rotation.y = t + i;
      });
      g.visible = a > 0.001;
    },
  };
  return g;
}
export function makeLeaves(n = 16) {
  const g = new THREE.Group(), list = [];
  const cols = ['#e8892c', '#d9542b', '#f2c14e', '#7fb04a'];
  for (let i = 0; i < n; i++) { const m = box(0.14, 0.02, 0.1, cols[i % 4], 0, 0, 0); m.castShadow = false; g.add(m); list.push(m); }
  g.userData = {
    set(t) {
      list.forEach((m, i) => {
        const u = (hash(i * 2.7) + t * (0.12 + 0.05 * hash(i))) % 1;
        m.position.set(-5 + 10 * u, 0.2 + 2.0 * hash(i * 3.3) + 0.4 * Math.sin(t * 2 + i), (hash(i * 5.1) - 0.5) * 3);
        m.rotation.set(t * 3 + i, t * 2 + i * 1.3, t * 4 + i);
      });
    },
  };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ faces + hands
export function makeGiantEye() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: '#8d9099', roughness: 0.8, emissive: '#1d1824', emissiveIntensity: 0.5 });
  g.add(box(4.2, 3.4, 1.4, skin, 0, 0, -0.5, 0.4));
  const white = sph(1.2, new THREE.MeshStandardMaterial({ color: '#e9e6ee', roughness: 0.35, emissive: '#3a3444', emissiveIntensity: 0.4 }), 28, 20);
  white.scale.set(1, 1, 0.55); white.position.z = 0.2; g.add(white);
  const iris = new THREE.Group(); iris.position.z = 0.82; g.add(iris);
  const ir = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), new THREE.MeshStandardMaterial({ color: '#5a5f6b', roughness: 0.5 })); iris.add(ir);
  const pu = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), basic('#0a0a0e')); pu.position.z = 0.01; iris.add(pu);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), basic('#ffffff')); sh.position.set(0.18, 0.2, 0.02); iris.add(sh);
  const lid = box(2.8, 1.5, 1.0, skin, 0, 1.6, 0.45, 0.3); g.add(lid);
  const low = box(2.8, 0.8, 0.9, skin, 0, -1.25, 0.4, 0.3); g.add(low);
  g.userData = { set(k = 0.3, lx = 0, ly = 0) { lid.position.y = lerp(1.62, 0.35, clamp(k, 0, 1)); iris.position.x = 0.35 * lx; iris.position.y = 0.3 * ly; } };
  return g;
}
export function makeCurtainWindow() {
  const g = new THREE.Group();
  const paneM = new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.24), paneM); g.add(pane);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffc46a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(2.6, 2.6, 1); halo.position.z = 0.05; g.add(halo);
  const cur = new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.85 });
  const L = new THREE.Group(), R = new THREE.Group(); g.add(L); g.add(R);
  for (const [grp, s] of [[L, -1], [R, 1]]) {
    for (let k = 0; k < 4; k++) { const f = box(0.14, 1.22, 0.04 + 0.02 * (k % 2), cur, s * (0.07 + k * 0.125), 0, 0.03 + 0.012 * (k % 2)); grp.add(f); }
  }
  g.add(box(1.25, 0.08, 0.08, '#5a3a22', 0, 0.66, 0.06));
  g.userData = {
    set(close = 0, light = 1) {
      const c = clamp(close, 0, 1);
      L.position.x = -0.5 + 0.5 * c - 0.0; R.position.x = 0.5 - 0.5 * c;
      L.scale.x = lerp(0.35, 1, c); R.scale.x = lerp(0.35, 1, c);
      paneM.color.set('#ffd27a').multiplyScalar(lerp(1.1, 0.25, c) * light);
      halo.material.opacity = lerp(0.85, 0.1, c) * light;
    },
  };
  g.userData.set(0, 1);
  return g;
}
export function makeCheeks(skin = '#f1c7a1') {
  const g = new THREE.Group(), m = std(skin, { roughness: 0.7 }), blush = std('#ff9aa8', { roughness: 0.7 });
  const parts = [];
  for (const s of [-1, 1]) {
    const c = sph(0.13, m, 16, 12); c.position.set(s * 0.25, 0.17, 0.25); g.add(c);
    const b = sph(0.06, blush, 10, 8); b.position.set(s * 0.3, 0.2, 0.34); g.add(b);
    parts.push(c, b);
  }
  g.userData = { set(k) { const s = clamp(k, 0, 1.3); g.visible = s > 0.02; parts.forEach((p, i) => p.scale.setScalar(Math.max(0.01, s))); g.scale.set(1 + 0.25 * s, 1, 1); } };
  return g;
}
export function makeBubble() {
  const g = new THREE.Group();
  const b = sph(1, new THREE.MeshStandardMaterial({ color: '#ff8ccb', roughness: 0.2, emissive: '#5a1036', emissiveIntensity: 0.25 }), 24, 16);
  g.add(b);
  const sh = sph(0.18, basic('#ffe6f4'), 10, 8); sh.position.set(0.4, 0.45, 0.75); b.add(sh);
  g.userData = { set(r) { g.visible = r > 0.01; b.scale.setScalar(Math.max(0.01, r)); b.position.z = r * 0.85; } };
  return g;
}
export function makeKnuckles(color = '#8a8d96') {
  const g = new THREE.Group(), m = std(color, { roughness: 0.75 }), d = std('#6e717a');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.add(box(0.035, 0.035, 0.035, (r + c) % 2 ? m : d, -0.055 + c * 0.037, 0.07 - r * 0.045, 0.075));
  return g;
}
export function makeGiantHand() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: '#8d9099', roughness: 0.75, emissive: '#1d1824', emissiveIntensity: 0.45 });
  const kn = new THREE.MeshStandardMaterial({ color: '#70737c', roughness: 0.8, emissive: '#15111c', emissiveIntensity: 0.45 });
  g.add(box(3.6, 3.2, 1.2, skin, 0, 0, 0, 0.35));
  for (let f = 0; f < 4; f++) {
    let parent = g, y = 1.6;
    for (let j = 0; j < 6; j++) {
      const s = new THREE.Group(); s.position.set(j ? 0 : -1.25 + f * 0.83, j ? 0.82 : y, 0); s.rotation.x = j ? 0.12 : 0; parent.add(s);
      s.add(box(0.7, 0.74, 0.74, skin, 0, 0.4, 0, 0.12));
      s.add(box(0.8, 0.2, 0.82, kn, 0, 0.02, 0, 0.06));
      parent = s;
    }
  }
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ the other side (b21)
export function buildOtherSide() {
  const root = new THREE.Group(); root.name = 'otherSide';
  const background = new THREE.Color('#1c0b33');
  const fog = new THREE.Fog('#2a1048', 6, 34);
  root.add(new THREE.HemisphereLight('#c9a6ff', '#1a0b2e', 1.6));
  const key = new THREE.DirectionalLight('#e6d6ff', 1.6); key.position.set(3, 6, 8); root.add(key); root.add(key.target);
  const back = new THREE.PointLight('#b45cff', 30, 30, 1.2); back.position.set(0, 4, -7); root.add(back);
  const front = new THREE.PointLight('#ff9fd8', 8, 8, 1.3); front.position.set(0, 1.6, 1.2); root.add(front);
  // floating glowing shapes
  const floaters = [];
  const fm = [new THREE.MeshStandardMaterial({ color: '#6d3cc8', emissive: '#5a22b0', emissiveIntensity: 0.9, roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: '#c04aa8', emissive: '#a02a88', emissiveIntensity: 0.8, roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: '#3a6ad0', emissive: '#2244a0', emissiveIntensity: 0.8, roughness: 0.4 })];
  const gs = [new THREE.BoxGeometry(1, 1, 1), new THREE.OctahedronGeometry(0.7, 0), new THREE.TetrahedronGeometry(0.8, 0)];
  for (let i = 0; i < 34; i++) {
    const m = new THREE.Mesh(gs[i % 3], fm[i % 3]);
    const s = 0.3 + 1.2 * hash(i * 3.3);
    m.scale.setScalar(s); m.userData = { x: (hash(i * 1.1) - 0.5) * 30, y: -2 + hash(i * 2.2) * 14, z: -6 - hash(i * 4.4) * 22, ph: hash(i * 5.5) * 6 };
    root.add(m); floaters.push(m);
  }
  // a dim floor of purple haze far below
  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: '#2a1248', roughness: 1 }));
  floor.rotation.x = -PI / 2; floor.position.y = -0.02; root.add(floor);
  const motes = makeMotes({ n: 60, w: 10, h: 6, d: 8, color: '#f0c0ff', size: 0.05 }); motes.position.set(0, 2.5, -3); root.add(motes);
  const anchors = {};
  const mk = (name, x, y, z, yaw = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.y = yaw; root.add(o); anchors[name] = o; return o; };
  mk('other.kid', 0, 0, -1.0); mk('other.cam', 0, 1.5, 1.8);
  return {
    root, anchors, background, fog, options: {},
    setLighting() {}, set() { return this; },
    update(t) {
      floaters.forEach((m) => { const u = m.userData; m.position.set(u.x + 0.4 * Math.sin(t * 0.3 + u.ph), u.y + 0.5 * Math.sin(t * 0.5 + u.ph), u.z); m.rotation.set(t * 0.2 + u.ph, t * 0.3 + u.ph, 0); });
      motes.userData.set(t, 1);
    },
  };
}
