// In This Town — Episode 18 "Pirate Token to the Moon": props + the custom 'sky' set.
//
// Exports
//   makeSwarm(n, opts)        instanced pirate tokens (gold coin + white blocky skull, both faces) + strings + glows.
//                             api: begin(camPos) / add(pos, {yaw, tilt, spin, s, from}) / end() / setDim(k) / setFlare(k)
//   makeHeroToken()           one big detailed token for close-ups: userData.set(t, { wink, glow, dim, spin })
//   makeShip()                blocky crashed pirate ship (bow = local +X, deck y = 1.1). userData: hole (Object3D), sail
//   makeTV()                  stage TV: cabinet (covers the chess table) + bezel + studio box for a character
//                             userData: studioFloor (Object3D, where to stand the mayor), set(t, staticAmt)
//   makeChest()               open treasure chest overflowing with tokens (also covers the chess table)
//   makeBigSandwich()         giant blocky sandwich (≈0.62 m wide), userData.setBite(k)
//   makeChalkCar()            chalk car outline decal (4.4 × 2.2 m, lies on the ground)
//   makeFloatHouse(o)         house on a grass lump with a rock cone underneath (grass top at y = 0)
//   makeClockTower()          copy of the town clock tower (base at y = 0, 15.9 m tall)
//   makeCar(color)            chunky toy car
//   makeGarden()              Principal Dunmore's front garden (grass, picket fence, mailbox 'DUNMORE', bushes)
//   makeBench()               park bench
//   makeBin()                 'FREE TOKENS' bin heaped with dull tokens
//   makeNewspaper(), makeHandbag(), makeBackpack()
//   makePuff(o)               dust burst: update(u 0..1)
//   makeSparkles(o)           drifting gold sparkles: userData.set(t, a)
//   makeCloud(seed, s)        one puffy cloud (merged spheres)
//   glowSprite(color, size, opacity)
//   buildSkySet()             custom set: floating island town (houses, clock tower, ship), clouds, stars, moon,
//                             ground plane. setMode('ground'|'sky'|'night'), setSky(k 0 blue → 1 purple → 2 night)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, ease, hash, lerp, canvasTexture } from '../lib/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
export const FONT_T = (s) => `900 ${s}px "ITT Nunito", "Nunito", "DejaVu Sans", sans-serif`;
export const FONT_D = (s) => `${s}px "ITT Luckiest", "Luckiest Guy", "DejaVu Sans", sans-serif`;

// ───────────────────────────────────────────────────────────────────────────── basic builders
const _mats = new Map();
export function std(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!_mats.has(k)) _mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o }));
  return _mats.get(k);
}
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const _geo = new Map();
function geoBox(w, h, d, r) {
  const k = [w, h, d, r].join(',');
  if (!_geo.has(k)) _geo.set(k, r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01)) : new THREE.BoxGeometry(w, h, d));
  return _geo.get(k);
}
export function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0) {
  const o = new THREE.Mesh(geoBox(w, h, d, r), typeof m === 'string' ? std(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
export function cyl(rt, rb, h, m, seg = 20) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
export function sph(r, m, ws = 16, hs = 12) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
/** Text texture: every line is shrunk until it fits the canvas width (no cropping). */
export function textTex(lines, { w = 512, h = 256, bg = '#fff4e0', fg = '#1d1d22', border = '#1d1d22', bw = 12, display = true, pad = 0.84 } = {}) {
  return canvasTexture(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = bw; g.strokeRect(bw / 2, bw / 2, w - bw, h - bw); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const F = display ? FONT_D : FONT_T;
    lines.forEach((l, i) => { fit(g, l, F, w * pad, Math.floor(h / lines.length * 0.72)); g.fillText(l, w / 2, h * (i + 0.5) / lines.length + 3); });
  });
}
export function labelPlane(lines, pw, ph, o = {}) {
  const tex = textTex(lines, { w: 512, h: Math.round(512 * ph / pw), ...o });
  return new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, transparent: !o.bg, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: o.glow ?? 0.15 }));
}

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
function merged(list) {   // [geometry, matrix] pairs → one geometry
  return mergeGeometries(list.map(([g, m]) => { const c = g.index ? g.toNonIndexed() : g.clone(); if (c.attributes.uv) c.deleteAttribute('uv'); if (c.attributes.uv1) c.deleteAttribute('uv1'); c.applyMatrix4(m); return c; }), false);
}
const Mx = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));

// ═════════════════════════════════════════════════════════════════════════════ pirate token
// Coin radius 0.3, thickness 0.07, axis along Z (faces ±Z).  White blocky skull on BOTH faces.
const TR = 0.3, TT = 0.07, FZ = TT / 2 + 0.012;
let _tokGeo = null;
function tokenGeos() {
  if (_tokGeo) return _tokGeo;
  const coin = new THREE.CylinderGeometry(TR, TR, TT, 36); coin.rotateX(PI / 2);
  const rim = new THREE.TorusGeometry(TR - 0.018, 0.02, 6, 36);
  const gold = merged([[coin, Mx()], [rim, Mx(0, 0, TT / 2)], [rim, Mx(0, 0, -TT / 2)]]);
  const cran = new RoundedBoxGeometry(0.3, 0.215, 0.026, 2, 0.05), jaw = new RoundedBoxGeometry(0.19, 0.085, 0.026, 2, 0.025);
  const white = merged([[cran, Mx(0, 0.035, FZ)], [jaw, Mx(0, -0.105, FZ)], [cran, Mx(0, 0.035, -FZ)], [jaw, Mx(0, -0.105, -FZ)]]);
  const eye = new THREE.BoxGeometry(0.075, 0.075, 0.012), nose = new THREE.BoxGeometry(0.032, 0.045, 0.012), gap = new THREE.BoxGeometry(0.013, 0.07, 0.012);
  const bl = [];
  const blackParts = (withEyes) => { const out = []; for (const s of [1, -1]) { const z = s * (FZ + 0.015); if (withEyes) for (const x of [-0.068, 0.068]) out.push([eye, Mx(x, 0.045, z)]); out.push([nose, Mx(0, -0.025, z)]); for (const x of [-0.045, 0, 0.045]) out.push([gap, Mx(x, -0.105, z)]); } return out; };
  bl.push(...blackParts(true));
  _tokGeo = { gold, white, black: merged(bl), blackNoEyes: merged(blackParts(false)), eye };
  return _tokGeo;
}
function tokenMats() {
  return {
    gold: new THREE.MeshStandardMaterial({ color: '#ffc634', metalness: 0.3, roughness: 0.32, emissive: '#c07a00', emissiveIntensity: 0.55 }),
    white: new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: 0.5, emissive: '#fff1c8', emissiveIntensity: 0.35 }),
    black: new THREE.MeshBasicMaterial({ color: '#1d1410' }),
  };
}
const GOLD = new THREE.Color('#ffc634'), DULL = new THREE.Color('#7a5c40'), EM = new THREE.Color('#c07a00'), WH = new THREE.Color('#fffaf0'), WHD = new THREE.Color('#a89c8a');
function applyDim(m, k, flare = 0) {
  m.gold.color.copy(GOLD).lerp(DULL, k); m.gold.emissive.copy(EM).multiplyScalar(1 - k); m.gold.emissiveIntensity = 0.55 + 1.6 * flare; m.gold.metalness = 0.3 * (1 - k); m.gold.roughness = 0.32 + 0.5 * k;
  m.white.color.copy(WH).lerp(WHD, k); m.white.emissiveIntensity = 0.35 * (1 - k) + 0.8 * flare;
}

/** Instanced tokens with strings and additive glows. */
export function makeSwarm(n = 64, { glow = 1.0, strings = true, stringColor = '#f6f2ea', stringR = 0.008 } = {}) {
  const G = tokenGeos(), mats = tokenMats();
  const root = new THREE.Group(); root.name = 'swarm';
  const mk = (geo, mat) => { const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; im.castShadow = false; root.add(im); return im; };
  const imG = mk(G.gold, mats.gold), imW = mk(G.white, mats.white), imB = mk(G.black, mats.black);
  let imS = null;
  if (strings) { const sg = new THREE.CylinderGeometry(stringR, stringR, 1, 5, 1, true); sg.translate(0, 0.5, 0); imS = mk(sg, new THREE.MeshBasicMaterial({ color: stringColor })); }
  const gpos = new Float32Array(n * 3), gsize = new Float32Array(n);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gpos, 3));
  const gmat = new THREE.PointsMaterial({ map: glowTex(), color: '#ffc94a', size: 1.5 * glow, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.75, fog: false });
  const pts = new THREE.Points(gg, gmat); pts.frustumCulled = false; if (glow > 0) root.add(pts);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), sc = V(), Y = V(0, 1, 0), d = V(), mid = V(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  let i = 0, cam = null, glowK = 1;
  const api = {
    root, mats, n,
    begin(camPos = null) { i = 0; cam = camPos; return api; },
    /** add one token at world pos (root must be at the origin of the world frame — keep root at identity). */
    add(p, { yaw = null, tilt = 0, spin = 0, s = 1, from = null, glowS = 1 } = {}) {
      if (i >= n) return api;
      let y = yaw;
      if (y == null) y = cam ? Math.atan2(cam.x - p.x, cam.z - p.z) : 0;
      e.set(tilt, y + spin, 0); q.setFromEuler(e); sc.setScalar(s); m4.compose(p, q, sc);
      imG.setMatrixAt(i, m4); imW.setMatrixAt(i, m4); imB.setMatrixAt(i, m4);
      if (imS) {
        if (from) {
          d.copy(p).sub(from); const len = Math.max(0.001, d.length() - 0.27 * s); d.normalize();
          q.setFromUnitVectors(Y, d); m4.compose(from, q, sc.set(1, len, 1)); imS.setMatrixAt(i, m4);
        } else imS.setMatrixAt(i, ZERO);
      }
      gpos[i * 3] = p.x; gpos[i * 3 + 1] = p.y; gpos[i * 3 + 2] = p.z;
      i++; return api;
    },
    end() {
      for (let k = i; k < n; k++) { imG.setMatrixAt(k, ZERO); imW.setMatrixAt(k, ZERO); imB.setMatrixAt(k, ZERO); if (imS) imS.setMatrixAt(k, ZERO); gpos[k * 3] = 0; gpos[k * 3 + 1] = -9999; gpos[k * 3 + 2] = 0; }
      for (const im of [imG, imW, imB, imS]) if (im) im.instanceMatrix.needsUpdate = true;
      gg.attributes.position.needsUpdate = true; gg.setDrawRange(0, i);
      return api;
    },
    setDim(k, flare = 0) { applyDim(mats, k, flare); gmat.opacity = 0.75 * (1 - k) * glowK + 0.5 * flare; gmat.size = 1.5 * glow * (1 + 0.8 * flare); return api; },
    setGlow(k) { glowK = k; gmat.opacity = 0.75 * k; return api; },
    get count() { return i; },
  };
  return api;
}

/** One detailed token (close-ups): separate eyes so it can wink.  Faces ±Z, radius 0.3. */
export function makeHeroToken({ glow = true } = {}) {
  const G = tokenGeos(), mats = tokenMats();
  const g = new THREE.Group(); g.name = 'heroToken';
  const spinG = new THREE.Group(); g.add(spinG);
  spinG.add(new THREE.Mesh(G.gold, mats.gold), new THREE.Mesh(G.white, mats.white), new THREE.Mesh(G.blackNoEyes, mats.black));
  const eyes = [];
  for (const s of [1, -1]) for (const x of [-0.068, 0.068]) { const m = new THREE.Mesh(G.eye, mats.black); m.position.set(x, 0.045, s * (FZ + 0.015)); spinG.add(m); eyes.push({ m, wink: (s > 0 ? x > 0 : x < 0) }); }
  // a little bandana knot? keep it clean: a sparkle glint
  const gl = glowSprite('#ffcf4a', 1.6, 0.8); gl.position.z = -0.05; if (glow) g.add(gl);
  const glint = glowSprite('#ffffff', 0.25, 0.9); glint.position.set(-0.17, 0.17, FZ + 0.03); spinG.add(glint);
  g.userData = {
    mats, spinG,
    set(t, { wink = 0, glowA = 1, dim = 0, spin = 0, flare = 0 } = {}) {
      applyDim(mats, dim, flare);
      for (const e of eyes) { e.m.scale.y = e.wink ? lerp(1, 0.14, wink) : 1; e.m.scale.x = e.wink ? lerp(1, 1.25, wink) : 1; }
      spinG.rotation.y = spin;
      gl.material.opacity = 0.8 * glowA * (1 - dim) + 0.5 * flare;
      glint.material.opacity = 0.9 * (0.5 + 0.5 * Math.sin(t * 3.1)) * (1 - dim);
      glint.scale.setScalar(0.18 + 0.12 * Math.abs(Math.sin(t * 2.3)));
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ pirate ship
let _plank = null;
const plankTex = () => _plank ??= (() => {
  const t = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#8a5532'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#7d4b2b' : '#93603a'; g.fillRect(0, i * h / 8, w, h / 8 - 3); g.fillStyle = '#5a3520'; g.fillRect(0, (i + 1) * h / 8 - 3, w, 3); }
    g.fillStyle = '#4a2a18'; for (let i = 0; i < 40; i++) g.fillRect(hash(i * 3.1) * w, Math.floor(hash(i * 7.3) * 8) * h / 8 + 6, 3, h / 8 - 12);
    g.fillStyle = '#e2b448'; g.fillRect(0, 10, w, 7);   // gold trim line
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();
let _sailTex = null;
const sailTex = () => _sailTex ??= canvasTexture(512, 512, (g, w, h) => {
  g.fillStyle = '#f6f0e2'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 1; i < 6; i++) g.fillRect(i * w / 6, 0, 4, h);
  // black blocky skull + crossbones
  const cx = w / 2, cy = h * 0.47;
  g.fillStyle = '#16161c';
  g.save(); g.translate(cx, cy + 40); for (const a of [0.75, -0.75]) { g.save(); g.rotate(a); g.fillRect(-190, -22, 380, 44); g.fillRect(-205, -38, 44, 76); g.fillRect(161, -38, 44, 76); g.restore(); } g.restore();
  g.fillRect(cx - 120, cy - 150, 240, 190);   // cranium
  g.fillRect(cx - 80, cy + 30, 160, 70);      // jaw
  g.fillStyle = '#f6f0e2';
  g.fillRect(cx - 85, cy - 90, 62, 62); g.fillRect(cx + 23, cy - 90, 62, 62);   // eyes
  g.fillRect(cx - 14, cy - 10, 28, 34);                                          // nose
  for (const x of [-50, -10, 30]) g.fillRect(cx + x, cy + 40, 16, 48);           // teeth gaps
});
let _holeTex = null;
const holeTex = () => _holeTex ??= canvasTexture(256, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#120a04'; g.beginPath();
  for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2, r = w * (0.3 + 0.16 * hash(i * 4.7)); const x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r * 0.85; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
  g.closePath(); g.fill();
  const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.32); gr.addColorStop(0, 'rgba(255,214,90,0.95)'); gr.addColorStop(0.6, 'rgba(255,170,40,0.35)'); gr.addColorStop(1, 'rgba(255,170,40,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2, w * 0.3, 0, PI * 2); g.fill();
});
export function makeShip() {
  const g = new THREE.Group(); g.name = 'ship';
  const hullM = new THREE.MeshStandardMaterial({ map: plankTex(), roughness: 0.8 });
  const L = 11, H = 2.2, W = 3.4;
  const hull = new THREE.Mesh(geoBox(L, H, W, 0.15), hullM); hull.castShadow = true; g.add(hull);
  g.add(box(L - 1.6, 0.9, W - 1.0, '#6b3d22', -0.3, -1.45, 0, 0.12));
  const bowG = new THREE.ConeGeometry(1.0, 3.2, 4, 1); bowG.rotateY(PI / 4); bowG.rotateZ(-PI / 2); bowG.scale(1, 1.55, 2.4);
  const bow = new THREE.Mesh(bowG, std('#7d4b2b')); bow.position.set(L / 2 + 1.55, 0.1, 0); bow.castShadow = true; g.add(bow);
  g.add(box(L, 0.14, W - 0.2, '#c8955a', 0, H / 2 + 0.02, 0));                      // deck
  g.add(box(0.5, 0.5, W + 0.1, '#e2b448', L / 2 - 0.1, 0.0, 0));                    // gold band at the bow joint
  for (const s of [-1, 1]) { g.add(box(L - 0.4, 0.14, 0.14, '#5a3520', 0, H / 2 + 0.55, s * (W / 2 - 0.08))); for (let k = 0; k < 9; k++) g.add(box(0.1, 0.5, 0.1, '#5a3520', -L / 2 + 0.7 + k * 1.2, H / 2 + 0.3, s * (W / 2 - 0.08))); }
  // stern cabin with lit windows
  g.add(box(2.8, 1.7, W, '#7a4426', -L / 2 + 1.4, H / 2 + 0.85, 0, 0.08));
  g.add(box(3.1, 0.2, W + 0.3, '#5a3520', -L / 2 + 1.4, H / 2 + 1.8, 0));
  const win = std('#ffd27a', { emissive: '#ffb84a', emissiveIntensity: 0.9 });
  for (const z of [-0.9, 0, 0.9]) g.add(box(0.06, 0.5, 0.5, win, -L / 2 - 0.02, H / 2 + 0.9, z));
  for (const s of [-1, 1]) for (const x of [-L / 2 + 0.8, -L / 2 + 2.0]) g.add(box(0.5, 0.45, 0.06, win, x, H / 2 + 0.95, s * (W / 2 + 0.02)));
  // cannon ports
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { g.add(box(0.42, 0.36, 0.05, '#16161c', -2.6 + k * 1.3, 0.25, s * (W / 2 + 0.01))); const c = cyl(0.11, 0.13, 0.5, '#2a2a30', 10); c.rotation.x = PI / 2; c.position.set(-2.6 + k * 1.3, 0.25, s * (W / 2 + 0.2)); g.add(c); }
  // mast, yard, crow's nest, sail, flag
  const mx = 0.8;
  const mast = cyl(0.2, 0.24, 12.5, '#6b3d22', 12); mast.position.set(mx, H / 2 + 6.2, 0); g.add(mast);
  const yard = cyl(0.11, 0.11, 5.6, '#6b3d22', 8); yard.rotation.x = PI / 2; yard.position.set(mx + 0.1, H / 2 + 10.0, 0); g.add(yard);
  const yard2 = yard.clone(); yard2.position.y = H / 2 + 4.6; g.add(yard2);
  const nest = cyl(0.65, 0.5, 0.55, '#7d4b2b', 12); nest.position.set(mx, H / 2 + 10.9, 0); g.add(nest);
  const sailM = new THREE.MeshStandardMaterial({ map: sailTex(), roughness: 0.9, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: sailTex(), emissiveIntensity: 0.12 });
  const sg = new THREE.PlaneGeometry(5.2, 5.2, 6, 1); const sp = sg.attributes.position;
  for (let k = 0; k < sp.count; k++) { const x = sp.getX(k); sp.setZ(k, 0.55 * Math.cos(x / 2.6 * PI / 2)); }
  sg.computeVertexNormals();
  const sail = new THREE.Mesh(sg, sailM); sail.rotation.y = PI / 2; sail.position.set(mx + 0.2, H / 2 + 7.3, 0); sail.castShadow = true; g.add(sail);
  const flagT = canvasTexture(128, 96, (c, w, h) => { c.fillStyle = '#16161c'; c.fillRect(0, 0, w, h); c.fillStyle = '#f6f0e2'; c.fillRect(48, 20, 32, 26); c.fillRect(54, 46, 20, 10); c.fillStyle = '#16161c'; c.fillRect(53, 27, 8, 8); c.fillRect(67, 27, 8, 8); });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshStandardMaterial({ map: flagT, side: THREE.DoubleSide, roughness: 0.8 })); flag.rotation.y = PI / 2; flag.position.set(mx, H / 2 + 12.9, -0.72); g.add(flag);
  // jib line + bowsprit
  const sprit = cyl(0.09, 0.12, 3.4, '#6b3d22', 8); sprit.rotation.z = -PI / 2 + 0.35; sprit.position.set(L / 2 + 3.1, 1.2, 0); g.add(sprit);
  // the hole (on local −Z side, forward) with broken planks and a golden glow
  const hole = new THREE.Object3D(); hole.position.set(L / 2 - 1.3, 0.0, -W / 2 - 0.02); g.add(hole);
  const hd = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.5), new THREE.MeshBasicMaterial({ map: holeTex(), transparent: true, depthWrite: false })); hd.rotation.y = PI; hd.position.copy(hole.position).add(V(0, 0, -0.01)); g.add(hd);
  for (let k = 0; k < 5; k++) { const p = box(0.9, 0.12, 0.08, '#93603a', hole.position.x + (hash(k * 3.3) - 0.5) * 1.3, hole.position.y + (k - 2) * 0.32, -W / 2 - 0.12); p.rotation.set(0, 0.3 * (hash(k) - 0.5), (hash(k * 9.1) - 0.5) * 1.4); g.add(p); }
  const hg = glowSprite('#ffc94a', 3.2, 0.9); hg.position.copy(hole.position).add(V(0, 0, -0.4)); g.add(hg);
  const pile = makeSwarm(36, { strings: false, glow: 0.6 });
  g.add(pile.root);
  pile.begin(null);
  for (let k = 0; k < 36; k++) { const a = hash(k * 2.7) * PI * 2, r = 0.2 + 0.7 * hash(k * 5.1); pile.add(V(hole.position.x + Math.cos(a) * r, hole.position.y - 0.55 + 0.25 * hash(k), -W / 2 - 0.05 - Math.abs(Math.sin(a)) * r * 0.5), { yaw: hash(k * 9.9) * 6, tilt: 1.2 + hash(k) * 0.8, s: 0.9 }); }
  pile.end();
  g.userData = { hole, sail, pile, L, W, H };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ TV on the stage
let _studioTex = null;
const studioTex = () => _studioTex ??= canvasTexture(512, 384, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1b3d8f'); gr.addColorStop(1, '#3a7ad8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(w / 2, h * 0.4); g.arc(w / 2, h * 0.4, w, i * 0.63, i * 0.63 + 0.3); g.fill(); }
  // moon + rocket doodle top-right
  g.fillStyle = '#f2f0e0'; g.beginPath(); g.arc(w * 0.83, h * 0.2, 34, 0, PI * 2); g.fill();
  g.fillStyle = '#c9c5b0'; g.beginPath(); g.arc(w * 0.81, h * 0.17, 8, 0, PI * 2); g.fill(); g.beginPath(); g.arc(w * 0.86, h * 0.24, 6, 0, PI * 2); g.fill();
  // gold coin top-left
  g.fillStyle = '#ffc634'; g.beginPath(); g.arc(w * 0.15, h * 0.2, 32, 0, PI * 2); g.fill(); g.fillStyle = '#fff'; g.fillRect(w * 0.15 - 14, h * 0.2 - 16, 28, 20); g.fillStyle = '#111'; g.fillRect(w * 0.15 - 10, h * 0.2 - 12, 7, 7); g.fillRect(w * 0.15 + 3, h * 0.2 - 12, 7, 7);
});
let _tickerTex = null;
const tickerTex = () => _tickerTex ??= textTex(['BREAKING: PIRATE TOKEN TO THE MOON'], { w: 1024, h: 96, bg: '#e8232b', fg: '#ffffff', border: null, display: true, pad: 0.92 });
const _noise = [];
function noiseTex(k) {
  if (_noise[k]) return _noise[k];
  _noise[k] = canvasTexture(128, 96, (g, w, h) => {
    const id = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = hash(i * 1.37 + k * 911) * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    g.putImageData(id, 0, 0);
    g.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  });
  return _noise[k];
}
/** Faces +Z.  Cabinet 2.2 × 1.15 × 2.1 (covers the chess table), screen inner 4.0 × 2.5 at y 1.45 … 3.95. */
export function makeTV() {
  const g = new THREE.Group(); g.name = 'tv';
  const blk = std('#1b1c22', { roughness: 0.45 });
  g.add(box(2.3, 1.15, 2.1, '#2a2d36', 0, 0.575, 0, 0.05));
  g.add(box(2.36, 0.1, 2.16, '#e2b448', 0, 1.15, 0));
  const SW = 4.0, SH = 2.5, y0 = 1.45, zf = 0.45;
  const cy = y0 + SH / 2;
  // bezel (4 bars) + depth box
  g.add(box(SW + 0.5, 0.25, 0.3, blk, 0, y0 - 0.125, zf), box(SW + 0.5, 0.25, 0.3, blk, 0, y0 + SH + 0.125, zf));
  g.add(box(0.25, SH + 0.5, 0.3, blk, -SW / 2 - 0.125, cy, zf), box(0.25, SH + 0.5, 0.3, blk, SW / 2 + 0.125, cy, zf));
  const D = 1.3;
  g.add(box(SW + 0.5, SH + 0.5, 0.08, blk, 0, cy, zf - D));
  g.add(box(0.08, SH + 0.5, D, blk, -SW / 2 - 0.21, cy, zf - D / 2), box(0.08, SH + 0.5, D, blk, SW / 2 + 0.21, cy, zf - D / 2));
  g.add(box(SW + 0.5, 0.08, D, blk, 0, y0 + SH + 0.21, zf - D / 2));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: studioTex() })); back.position.set(0, cy, zf - D + 0.05); g.add(back);
  const desk = box(SW - 0.2, 0.5, 0.35, '#e8232b', 0, y0 + 0.1, zf - 0.32); g.add(desk);
  const ticker = new THREE.Mesh(new THREE.PlaneGeometry(SW, 0.34), new THREE.MeshBasicMaterial({ map: tickerTex() })); ticker.position.set(0, y0 + 0.17, zf + 0.02); g.add(ticker);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: noiseTex(0), transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
  glass.position.set(0, cy, zf + 0.04); g.add(glass);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ color: '#9fd0ff', transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false })); scan.position.set(0, cy, zf + 0.035); g.add(scan);
  const light = new THREE.PointLight('#cfe2ff', 4, 4, 1.2); light.position.set(0, cy + 0.3, zf - 0.1); g.add(light);
  const halo = glowSprite('#7fb6ff', 7, 0.35); halo.position.set(0, cy, zf - D - 0.3); g.add(halo);
  // legs from cabinet to bezel
  for (const s of [-1, 1]) g.add(box(0.18, 0.4, 0.18, blk, s * 1.6, 1.2, zf));
  const studioFloor = new THREE.Object3D(); studioFloor.position.set(0, y0 - 1.2, zf - 0.75); g.add(studioFloor);
  g.userData = {
    studioFloor, glass, cy,
    set(t, amt = 0) {
      const f = Math.floor(t * 24) % 4;
      glass.material.map = noiseTex(f); glass.material.opacity = clamp(amt, 0, 1) * 0.9;
      scan.material.opacity = 0.05 + 0.04 * Math.sin(t * 40);
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ treasure chest
export function makeChest() {
  const g = new THREE.Group(); g.name = 'chest';
  const wood = '#7a4426', band = '#e2b448';
  g.add(box(2.2, 1.0, 2.1, wood, 0, 0.5, 0, 0.06));
  for (const x of [-0.9, 0, 0.9]) g.add(box(0.14, 1.04, 2.16, band, x, 0.5, 0));
  g.add(box(2.26, 0.12, 2.16, band, 0, 0.98, 0));
  const lid = new THREE.Group(); lid.position.set(0, 1.0, -1.05); lid.rotation.x = -1.95; g.add(lid);
  lid.add(box(2.2, 0.22, 2.1, wood, 0, 0.11, 1.05, 0.06));
  for (const x of [-0.9, 0, 0.9]) lid.add(box(0.14, 0.26, 2.14, band, x, 0.11, 1.05));
  const lock = box(0.3, 0.36, 0.08, band, 0, 0.72, 1.08); g.add(lock);
  const heap = makeSwarm(70, { strings: false, glow: 0.7 }); g.add(heap.root);
  heap.begin(null);
  for (let k = 0; k < 70; k++) { const a = hash(k * 2.1) * PI * 2, r = Math.sqrt(hash(k * 4.3)); const x = Math.cos(a) * r * 0.95, z = Math.sin(a) * r * 0.9; heap.add(V(x, 1.0 + 0.45 * (1 - r * r) + 0.06 * hash(k * 7), z), { yaw: hash(k * 3.9) * 6, tilt: 1.3 + 0.5 * hash(k * 1.1), s: 1.0 }); }
  heap.end();
  const gl = glowSprite('#ffc94a', 3.5, 0.7); gl.position.set(0, 1.6, 0); g.add(gl);
  g.userData = { heap };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ sandwich, chalk, misc
export function makeBigSandwich() {
  const g = new THREE.Group(); g.name = 'sandwich';
  const inner = new THREE.Group(); g.add(inner);
  const layers = [['#e7b46a', 0.11, 0.62, 0.44, 0.05], ['#5bd65b', 0.045, 0.7, 0.5, 0.02], ['#e8412c', 0.05, 0.6, 0.42, 0.02], ['#ffd23f', 0.03, 0.66, 0.47, 0.01], ['#f0a8b0', 0.05, 0.6, 0.42, 0.02], ['#5bd65b', 0.04, 0.68, 0.48, 0.02], ['#e7b46a', 0.12, 0.62, 0.44, 0.06]];
  let y = 0;
  layers.forEach(([c, h, w, d, r], i) => { const b = box(w, h, d, c, (hash(i) - 0.5) * 0.03, y + h / 2, (hash(i * 3) - 0.5) * 0.02, r); if (i === 3) b.rotation.y = 0.3; inner.add(b); y += h; });
  inner.children.forEach((c) => { c.position.y -= y / 2; });
  for (let k = 0; k < 7; k++) { const s = box(0.03, 0.012, 0.018, '#fff6d8', -0.22 + k * 0.07, y / 2 + 0.005, (hash(k * 5.5) - 0.5) * 0.3); s.rotation.y = hash(k) * 3; inner.add(s); }
  const pick = cyl(0.008, 0.008, 0.26, '#f3e3a5', 6); pick.position.y = y / 2 + 0.08; inner.add(pick);
  const olive = sph(0.035, '#3c8f45', 10, 8); olive.position.y = y / 2 + 0.2; inner.add(olive);
  const bite = sph(0.16, std('#f3dca0'), 14, 10); bite.scale.set(1, 1.6, 1); bite.position.set(0.33, 0, 0.0); bite.visible = false; g.add(bite);
  g.userData = { height: y, setBite(k) { bite.visible = k > 0; inner.scale.x = 1 - 0.18 * k; inner.position.x = -0.06 * k; bite.position.x = 0.33 - 0.12 * k; } };
  return g;
}
let _chalk = null;
const chalkTex = () => _chalk ??= canvasTexture(512, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 9; g.lineJoin = 'round'; g.lineCap = 'round';
  const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); g.stroke(); };
  rr(40, 50, 432, 156, 50);          // body
  rr(150, 72, 200, 112, 26);         // roof/cabin
  g.beginPath(); g.moveTo(150, 128); g.lineTo(80, 128); g.stroke();
  for (const [x, y] of [[110, 40], [400, 40], [110, 216], [400, 216]]) { g.beginPath(); g.ellipse(x, y, 34, 16, 0, 0, PI * 2); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 300; i++) g.fillRect(hash(i * 3.3) * w, hash(i * 7.7) * h, 3, 3);
});
export function makeChalkCar() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), new THREE.MeshBasicMaterial({ map: chalkTex(), transparent: true, depthWrite: false }));
  m.rotation.x = -PI / 2; m.renderOrder = 1;
  const g = new THREE.Group(); g.add(m); return g;
}
export function makeNewspaper() {
  const tex = canvasTexture(256, 192, (g, w, h) => {
    g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d1d22'; g.textAlign = 'center';
    g.font = FONT_D(30); g.fillText('DAILY TOKEN', w / 2, 34); g.fillRect(12, 44, w - 24, 4);
    g.font = FONT_T(22); g.fillText('ARR! UP 900%', w / 2, 76);
    g.fillStyle = '#888'; for (let i = 0; i < 7; i++) { g.fillRect(14, 96 + i * 13, w * 0.44, 6); g.fillRect(w * 0.53, 96 + i * 13, w * 0.42, 6); }
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.012), [std('#f4f0e4'), std('#f4f0e4'), std('#f4f0e4'), std('#f4f0e4'), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })]);
  const g = new THREE.Group(); g.add(m); return g;
}
export function makeHandbag() {
  const g = new THREE.Group();
  g.add(box(0.32, 0.24, 0.12, '#7a1f6b', 0, -0.2, 0, 0.04));
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 16, PI), std('#3a1030')); h.position.y = -0.08; g.add(h);
  g.add(box(0.06, 0.05, 0.13, '#ffd23f', 0, -0.13, 0));
  return g;
}
export function makeBackpack() {
  const g = new THREE.Group();
  g.add(box(0.5, 0.58, 0.26, '#e8892c', 0, 0, 0, 0.07));
  g.add(box(0.46, 0.22, 0.06, '#c96d18', 0, 0.12, 0.15, 0.03));
  g.add(box(0.34, 0.2, 0.08, '#c96d18', 0, -0.16, 0.15, 0.03));
  return g;
}
export function makeCar(color = '#ff4fa3') {
  const g = new THREE.Group();
  g.add(box(2.6, 0.7, 1.4, color, 0, 0.62, 0, 0.12)); g.add(box(1.5, 0.62, 1.26, color, -0.15, 1.25, 0, 0.12));
  g.add(box(1.4, 0.48, 1.3, std('#bfe9ff', { emissive: '#406080', emissiveIntensity: 0.2 }), -0.15, 1.25, 0, 0.06));
  for (const [x, z] of [[0.85, 0.68], [-0.85, 0.68], [0.85, -0.68], [-0.85, -0.68]]) { const w = cyl(0.32, 0.32, 0.24, '#1d1d22', 14); w.rotation.x = PI / 2; w.position.set(x, 0.32, z); g.add(w); const hb = cyl(0.14, 0.14, 0.26, '#d8d8d8', 10); hb.rotation.x = PI / 2; hb.position.set(x, 0.32, z); g.add(hb); }
  for (const s of [-1, 1]) g.add(box(0.06, 0.14, 0.26, std('#fff6c0', { emissive: '#fff0a0', emissiveIntensity: 0.6 }), 1.31, 0.72, s * 0.45));
  return g;
}
export function makeBench() {
  const g = new THREE.Group();
  for (let k = 0; k < 3; k++) g.add(box(1.8, 0.07, 0.14, '#b5743a', 0, 0.48, -0.18 + k * 0.17, 0.02));
  for (let k = 0; k < 2; k++) { const b = box(1.8, 0.07, 0.13, '#b5743a', 0, 0.72 + k * 0.18, -0.3, 0.02); b.rotation.x = -0.15; g.add(b); }
  for (const s of [-1, 1]) { g.add(box(0.08, 0.48, 0.5, '#2a2d36', s * 0.78, 0.24, -0.02)); g.add(box(0.08, 0.5, 0.08, '#2a2d36', s * 0.78, 0.75, -0.32)); g.add(box(0.08, 0.06, 0.5, '#2a2d36', s * 0.78, 0.66, -0.04)); }
  return g;
}
export function makeBin() {
  const g = new THREE.Group();
  const can = cyl(0.42, 0.36, 1.0, '#6f7680', 16); can.position.y = 0.5; g.add(can);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 20), std('#555b63')); rim.rotation.x = PI / 2; rim.position.y = 1.0; g.add(rim);
  const heap = makeSwarm(26, { strings: false, glow: 0 }); g.add(heap.root);
  heap.begin(null);
  for (let k = 0; k < 26; k++) { const a = hash(k * 2.3) * PI * 2, r = 0.36 * Math.sqrt(hash(k * 4.9)); heap.add(V(Math.cos(a) * r, 1.02 + 0.2 * (1 - r / 0.36) + 0.05 * hash(k), Math.sin(a) * r), { yaw: hash(k * 3.1) * 6, tilt: 1.2 + 0.6 * hash(k * 7.3), s: 0.75 }); }
  for (let k = 0; k < 4; k++) heap.add(V(0.55 + 0.25 * hash(k), 0.03, -0.3 + 0.25 * k), { yaw: k, tilt: PI / 2, s: 0.75 });
  heap.end(); heap.setDim(1);
  const sign = labelPlane(['FREE TOKENS', 'PLEASE TAKE'], 0.8, 0.5, { bg: '#fff4e0', fg: '#1d1d22', border: '#1d1d22', bw: 10, display: true, glow: 0.2 });
  sign.position.set(0, 0.55, 0.43); sign.rotation.x = -0.08; g.add(sign);
  return g;
}
export function makeGarden() {
  const g = new THREE.Group(); g.name = 'garden';
  g.add(box(6.0, 0.1, 4.0, '#3f9a48', 0, 0.05, 0));
  for (let k = 0; k < 4; k++) g.add(box(0.7, 0.05, 0.5, '#b9b4ad', 1.6, 0.1, -1.5 + k * 0.95, 0.04));
  const white = std('#f6f3ea');
  for (let k = 0; k < 19; k++) { if (k >= 8 && k <= 9) continue; const x = -2.9 + k * 0.32; const p = box(0.12, 0.8, 0.06, white, x, 0.45, 1.95); g.add(p); const c = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.14, 4), white); c.rotation.y = PI / 4; c.position.set(x, 0.92, 1.95); g.add(c); }
  g.add(box(6.0, 0.08, 0.04, white, 0, 0.3, 1.92), box(6.0, 0.08, 0.04, white, 0, 0.66, 1.92));
  // mailbox
  const post = box(0.1, 1.1, 0.1, '#5a3520', 2.6, 0.55, 1.5); g.add(post);
  g.add(box(0.36, 0.3, 0.55, '#2f4d8a', 2.6, 1.2, 1.5, 0.08));
  const nm = labelPlane(['DUNMORE'], 0.5, 0.16, { bg: '#ffffff', fg: '#1d1d22', border: null, display: true, glow: 0.3 }); nm.rotation.y = PI / 2; nm.position.set(2.79, 1.2, 1.5); g.add(nm);
  const nm2 = nm.clone(); nm2.rotation.y = -PI / 2; nm2.position.x = 2.41; g.add(nm2);
  // bushes + flowers
  for (const [x, z, r] of [[-2.3, -1.3, 0.55], [-1.4, -1.6, 0.45], [2.3, -1.4, 0.5]]) { const b = sph(r, std('#2f7d3a'), 12, 9); b.position.set(x, 0.1 + r * 0.8, z); g.add(b); }
  for (let k = 0; k < 14; k++) { const f = sph(0.07, std(['#ff4fa3', '#ffd23f', '#ffffff', '#8a5cff'][k % 4], { emissive: '#222', emissiveIntensity: 0.2 }), 8, 6); f.position.set(-2.6 + k * 0.28, 0.2, 1.55 - 0.1 * (k % 2)); g.add(f); }
  // gnome
  const gn = new THREE.Group(); gn.position.set(-0.6, 0.1, 0.9); g.add(gn);
  gn.add(box(0.2, 0.24, 0.16, '#2f4d8a', 0, 0.12, 0, 0.04)); const hd = sph(0.08, '#f1c7a1', 10, 8); hd.position.y = 0.3; gn.add(hd);
  const ht = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 10), std('#e8232b')); ht.position.y = 0.45; gn.add(ht);
  const bd = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 8), std('#ffffff')); bd.rotation.x = PI; bd.position.set(0, 0.22, 0.05); gn.add(bd);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ fx bits
const _sph = new THREE.SphereGeometry(1, 10, 8);
export function makePuff({ color = '#cfc6b6', count = 18, radius = 1, seed = 1 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.9 });
  const im = new THREE.InstancedMesh(_sph, mat, count); im.frustumCulled = false;
  const root = new THREE.Group(); root.add(im);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V();
  const dirs = Array.from({ length: count }, (_, i) => { const a = hash(i * 1.9 + seed) * PI * 2, e = (hash(i * 3.7 + seed) - 0.2) * 0.9; return V(Math.cos(a) * Math.cos(e), Math.sin(e) + 0.15, Math.sin(a) * Math.cos(e)); });
  return {
    root, update(u) {
      root.visible = u > 0 && u < 1;
      if (!root.visible) return;
      const k = 1 - Math.pow(1 - u, 3);
      dirs.forEach((d, i) => {
        p.copy(d).multiplyScalar(radius * (0.25 + 0.9 * k)); p.y += radius * 0.35 * u;
        const r = radius * (0.2 + 0.22 * hash(i * 5.3 + seed)) * (0.6 + 0.8 * k) * (1 - 0.6 * u * u);
        s.setScalar(Math.max(0.001, r)); m4.compose(p, q, s); im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true; mat.opacity = 0.95 * (1 - u * u);
    },
  };
}
export function makeSparkles({ n = 40, w = 6, h = 4, d = 3, color = '#ffe08a', size = 0.06 } = {}) {
  const g = new THREE.Group(), list = [];
  const mat = basic(color, { toneMapped: false, transparent: true, fog: false });
  const geo = new THREE.OctahedronGeometry(size, 0);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); g.add(m); list.push(m); }
  g.userData = {
    set(t, a = 1) {
      mat.opacity = a;
      list.forEach((m, i) => {
        const u = (hash(i * 1.3) + t * (0.05 + 0.06 * hash(i * 7.7))) % 1;
        m.position.set((hash(i * 2.1) - 0.5) * w + 0.3 * Math.sin(t * 0.9 + i), (u - 0.5) * h, (hash(i * 4.4) - 0.5) * d + 0.3 * Math.cos(t * 0.7 + i));
        m.scale.setScalar((0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i * 2.3))) * Math.sin(PI * u));
        m.rotation.y = t * 2 + i;
      });
      g.visible = a > 0.001;
    },
  };
  return g;
}
export function makeCloud(seed = 1, s = 1, { color = '#ffffff', emissive = '#e8dcff', ei = 0.35 } = {}) {
  const list = [];
  const n = 6 + Math.floor(hash(seed * 3.3) * 4);
  for (let i = 0; i < n; i++) {
    const r = (0.7 + 0.7 * hash(seed * 9 + i)) * s;
    const g = new THREE.SphereGeometry(r, 12, 9);
    list.push([g, Mx(((i - (n - 1) / 2) * 0.62 + (hash(seed + i * 3) - 0.5) * 0.4) * s, (hash(seed * 2 + i) - 0.3) * 0.5 * s, (hash(seed * 5 + i) - 0.5) * 0.8 * s, 0, 0, 0, 1, 0.8, 1)]);
  }
  const m = new THREE.Mesh(merged(list), new THREE.MeshStandardMaterial({ color, roughness: 1, emissive, emissiveIntensity: ei }));
  m.geometry.computeVertexNormals();
  return m;
}

// ═════════════════════════════════════════════════════════════════════════════ houses / tower
export function makeFloatHouse({ wall = '#f3e3a5', roof = '#b5543f', w = 4.2, d = 3.6, h = 3.0, lump = true, seed = 1 } = {}) {
  const g = new THREE.Group(); g.name = 'house';
  const body = new THREE.Group(); g.add(body);
  body.add(box(w, h, d, wall, 0, h / 2, 0, 0.05));
  const rg = new THREE.CylinderGeometry(0.01, d * 0.62, w + 0.3, 4, 1); rg.rotateY(PI / 4); rg.rotateZ(PI / 2); rg.scale(1, 0.75, 1.05);
  const r = new THREE.Mesh(rg, std(roof)); r.position.y = h + d * 0.3; r.castShadow = true; body.add(r);
  body.add(box(0.5, 1.1, 0.5, '#9a5a44', w * 0.28, h + d * 0.45, -d * 0.15));   // chimney
  body.add(box(0.85, 1.6, 0.08, '#7d5232', 0, 0.8, d / 2 + 0.03));
  const win = std('#ffe8b0', { emissive: '#ffb84a', emissiveIntensity: 0.45 });
  for (const x of [-1.35, 1.35]) { body.add(box(0.8, 0.8, 0.06, win, x * w / 4.2, 1.45, d / 2 + 0.03)); body.add(box(0.95, 0.08, 0.1, '#ffffff', x * w / 4.2, 1.02, d / 2 + 0.05)); }
  body.add(box(0.7, 0.6, 0.06, win, 0, h - 0.5, d / 2 + 0.03));
  body.add(box(1.1, 0.1, 0.7, '#ffffff', 0, 1.72, d / 2 + 0.33));
  const under = new THREE.Group(); g.add(under);
  under.add(box(w + 1.4, 0.3, d + 1.4, '#4caf50', 0, -0.15, 0, 0.08));
  under.add(box(w + 1.3, 0.35, d + 1.3, '#7a5434', 0, -0.45, 0, 0.05));
  const dirt = new THREE.Mesh(new THREE.ConeGeometry((w + 1.2) * 0.62, 2.6, 6), std('#8a8378', { roughness: 1, flatShading: true })); dirt.rotation.x = PI; dirt.position.y = -1.9; dirt.castShadow = true; under.add(dirt);
  const dirt2 = new THREE.Mesh(new THREE.ConeGeometry((w + 1.2) * 0.3, 1.6, 5), std('#6f6a62', { roughness: 1, flatShading: true })); dirt2.rotation.x = PI; dirt2.position.set(w * 0.3, -1.1, d * 0.2); under.add(dirt2);
  under.visible = lump;
  g.userData = { under, roofY: h + d * 0.55, w, d, h };
  return g;
}
let _clockT = null;
const clockTex2 = () => _clockT ??= canvasTexture(256, 256, (g, w, h) => {
  g.fillStyle = '#fff8e6'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 6, 0, PI * 2); g.fill();
  g.lineWidth = 12; g.strokeStyle = '#3a2a1c'; g.stroke(); g.fillStyle = '#3a2a1c';
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; g.beginPath(); g.arc(w / 2 + Math.sin(a) * 96, h / 2 - Math.cos(a) * 96, i % 3 ? 5 : 9, 0, PI * 2); g.fill(); }
  g.lineCap = 'round'; g.lineWidth = 12; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 40, h / 2 - 34); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 6, h / 2 - 88); g.stroke();
});
export function makeClockTower({ lump = false } = {}) {
  const g = new THREE.Group(); g.name = 'clockTower';
  g.add(box(4.0, 0.6, 4.0, '#a8a196', 0, 0.3, 0));
  g.add(box(3.0, 9.4, 3.0, '#e8d9b8', 0, 5.0, 0, 0.1));
  g.add(box(3.4, 0.3, 3.4, '#c9b48c', 0, 9.8, 0));
  g.add(box(2.6, 2.2, 2.6, '#e8d9b8', 0, 11.0, 0, 0.08));
  g.add(box(3.0, 0.22, 3.0, '#f6f3ea', 0, 12.2, 0));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), std('#3f7a5a')); roof.rotation.y = PI / 4; roof.scale.set(3.6 / 1.414 * 1.41, 3.2, 3.6 / 1.414 * 1.41); roof.position.y = 13.9; roof.castShadow = true; g.add(roof);
  const ball = sph(0.35, std('#ffd23f', { emissive: '#a07000', emissiveIntensity: 0.4 })); ball.position.y = 15.6; g.add(ball);
  const cm = new THREE.MeshStandardMaterial({ map: clockTex2(), roughness: 0.6, emissive: '#ffffff', emissiveMap: clockTex2(), emissiveIntensity: 0.25 });
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.95, 28), cm); const a = i * PI / 2; f.position.set(Math.sin(a) * 1.32, 11.0, Math.cos(a) * 1.32); f.rotation.y = a; g.add(f); }
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; for (const y of [4.0, 7.0]) { const w = box(0.6, 1.4, 0.05, '#3b4f78', Math.sin(a) * 1.51, y, Math.cos(a) * 1.51); w.rotation.y = a; g.add(w); } }
  const under = new THREE.Group(); g.add(under);
  under.add(box(5.4, 0.3, 5.4, '#4caf50', 0, -0.15, 0, 0.08));
  const dirt = new THREE.Mesh(new THREE.ConeGeometry(3.4, 3.4, 6), std('#8a8378', { roughness: 1, flatShading: true })); dirt.rotation.x = PI; dirt.position.y = -2.0; under.add(dirt);
  under.visible = lump;
  g.userData = { under };
  return g;
}
function makeLamp() {
  const g = new THREE.Group();
  const p = cyl(0.08, 0.1, 4.2, '#2f3440', 8); p.position.y = 2.1; g.add(p);
  const head = box(0.5, 0.35, 0.5, '#2f3440', 0, 4.35, 0, 0.05); g.add(head);
  g.add(box(0.36, 0.12, 0.36, std('#fff4c0', { emissive: '#ffe08a', emissiveIntensity: 0.8 }), 0, 4.15, 0));
  return g;
}
function makeTree(s = 1, seed = 1) {
  const g = new THREE.Group();
  const t = cyl(0.18 * s, 0.24 * s, 1.6 * s, '#6b4a2f', 8); t.position.y = 0.8 * s; g.add(t);
  const c = sph(1.3 * s, std(['#3c8f45', '#4caf50', '#2f7d3a'][seed % 3], { flatShading: true }), 8, 6); c.position.y = 2.4 * s; c.scale.y = 1.1; g.add(c);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ the custom 'sky' set
const HOUSE_SPOTS = [   // [x, z, yaw, wall, roof] on the island (road along x at z = 0)
  [-10, -7.2, 0, '#e9d8b5', '#b5543f'], [-4.6, -7.4, 0, '#c9e4f2', '#4a5d7e'], [0.8, -7.2, 0, '#f2c4c4', '#6b4a3a'], [6.2, -7.3, 0, '#d6e8c4', '#3f7a5a'], [11.6, -7.2, 0, '#f3e3a5', '#b5543f'],
  [-10.5, 7.2, PI, '#cbbfe6', '#4a5d7e'], [-5, 7.3, PI, '#f3e3a5', '#6b4a3a'], [0.4, 7.2, PI, '#e9d8b5', '#3f7a5a'], [5.8, 7.4, PI, '#c9e4f2', '#b5543f'], [11.2, 7.2, PI, '#f2c4c4', '#4a5d7e'],
];
export function buildSkySet() {
  const root = new THREE.Group(); root.name = 'skySet';
  const background = new THREE.Color('#5a2a9a');
  const fog = new THREE.Fog('#6a3aa8', 60, 260);
  // lights
  const hemi = new THREE.HemisphereLight('#e8d8ff', '#6a4a7a', 1.5); root.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0e0', 2.4); sun.position.set(-30, 50, 40); root.add(sun); root.add(sun.target);
  const rim = new THREE.DirectionalLight('#ff8ad0', 0.9); rim.position.set(40, 10, -50); root.add(rim);
  // sky sphere with vertex colours
  const skyG = new THREE.SphereGeometry(420, 32, 18);
  const cols = new Float32Array(skyG.attributes.position.count * 3); skyG.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const sky = new THREE.Mesh(skyG, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; root.add(sky);
  const PAL = [
    ['#2a7fe0', '#74b6f2', '#d4edfb', '#cfe6f7'],      // blue day: zenith, mid, horizon, fog
    ['#1c0b4a', '#6a2fb8', '#ff8ac8', '#7a3ab8'],      // purple
    ['#020410', '#0b1430', '#1d2a50', '#0c1430'],      // night
  ].map((a) => a.map((c) => new THREE.Color(c)));
  const cz = new THREE.Color(), cm = new THREE.Color(), ch = new THREE.Color(), cf = new THREE.Color(), tmp = new THREE.Color();
  function setSky(k) {
    const i0 = Math.min(1, Math.floor(k)), u = clamp(k - i0, 0, 1), A = PAL[i0], B = PAL[Math.min(2, i0 + 1)];
    cz.copy(A[0]).lerp(B[0], u); cm.copy(A[1]).lerp(B[1], u); ch.copy(A[2]).lerp(B[2], u); cf.copy(A[3]).lerp(B[3], u);
    const pa = skyG.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const h = pa.getY(i) / 420;
      if (h < 0) tmp.copy(ch).lerp(cf, clamp(-h * 4, 0, 1)); else if (h < 0.25) tmp.copy(ch).lerp(cm, h / 0.25); else tmp.copy(cm).lerp(cz, clamp((h - 0.25) / 0.6, 0, 1));
      cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
    }
    skyG.attributes.color.needsUpdate = true;
    background.copy(cf); fog.color.copy(cf);
    stars.material.opacity = clamp(k - 0.6, 0, 1);
    stars.visible = k > 0.6;
    const night = clamp(k - 1, 0, 1), purple = clamp(k, 0, 1) - night;
    hemi.color.set('#ffffff').lerp(tmp.set('#e8d8ff'), purple).lerp(tmp.set('#5a70b0'), night); hemi.intensity = lerp(lerp(1.6, 1.4, purple), 0.7, night);
    sun.color.set('#fff4e0').lerp(tmp.set('#ffd0f0'), purple).lerp(tmp.set('#a8c0ff'), night); sun.intensity = lerp(lerp(2.6, 2.0, purple), 0.8, night);
    rim.intensity = lerp(0.2, 1.1, purple) * (1 - night);
    fog.near = 60; fog.far = lerp(320, 220, clamp(k, 0, 1));
  }
  // stars
  const sp = []; for (let i = 0; i < 500; i++) { const a = hash(i * 1.7) * PI * 2, e = Math.asin(hash(i * 3.1) * 0.95 + 0.02); sp.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380); }
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sgeo, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false })); root.add(stars);
  const bigStars = []; for (let i = 0; i < 26; i++) { const s = glowSprite(['#ffffff', '#ffe8a8', '#c8d8ff'][i % 3], 7 + 6 * hash(i * 9.1), 0.8); const a = hash(i * 2.9) * PI * 2, e = 0.15 + 0.7 * hash(i * 5.3); s.position.set(Math.cos(a) * Math.cos(e) * 300, Math.sin(e) * 300, Math.sin(a) * Math.cos(e) * 300); stars.add(s); bigStars.push(s); }
  // moon
  const moonTex = canvasTexture(512, 512, (g, w, h) => {
    const gr = g.createRadialGradient(w * 0.42, h * 0.4, 20, w / 2, h / 2, w / 2); gr.addColorStop(0, '#fffdf2'); gr.addColorStop(1, '#d8d4c4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const x = hash(i * 3.3) * w, y = hash(i * 5.7) * h, r = 10 + 40 * hash(i * 7.1); g.fillStyle = 'rgba(150,145,130,0.45)'; g.beginPath(); g.arc(x, y, r, 0, PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(x - r * 0.2, y - r * 0.2, r * 0.6, 0, PI * 2); g.fill(); }
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(40, 40, 28), new THREE.MeshBasicMaterial({ map: moonTex, fog: false, color: '#ffffff' }));
  moon.position.set(0, 60, -260); root.add(moon);
  const moonGlow = glowSprite('#dfe8ff', 190, 0.55); moonGlow.position.copy(moon.position).add(V(0, 0, -20)); root.add(moonGlow);
  // ground plane (for 'ground' mode)
  const ground = new THREE.Group(); root.add(ground);
  const gp = new THREE.Mesh(new THREE.CircleGeometry(220, 48), std('#58b85a')); gp.rotation.x = -PI / 2; gp.receiveShadow = true; ground.add(gp);
  ground.add(box(80, 0.04, 6, '#3a3d46', 0, 0.02, 0));
  for (const s of [-1, 1]) ground.add(box(80, 0.12, 2.2, '#b9b4ad', 0, 0.06, s * 4.1));
  for (let k = 0; k < 8; k++) ground.add(box(2.2, 0.05, 0.25, '#f2f2f2', -36 + k * 10, 0.045, 0));
  for (let k = 0; k < 30; k++) { const t = makeTree(0.9 + 0.5 * hash(k * 4.4), k); const a = hash(k * 2.2) * PI * 2, r = 30 + 60 * hash(k * 6.6); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r * 0.8 - 10); ground.add(t); }
  const hills = []; for (let k = 0; k < 9; k++) { const h = sph(30 + 20 * hash(k * 3.3), std('#4a9a50', { flatShading: true }), 10, 6); const a = -PI * 0.9 + k * PI * 0.22; h.position.set(Math.cos(a) * 170, -12, Math.sin(a) * 170); h.scale.y = 0.55; ground.add(h); hills.push(h); }
  // holes left behind by lifted houses
  const holes = [];
  const holeM = std('#4a3220', { roughness: 1 });
  // the island (slab + houses + tower + ship)
  const island = new THREE.Group(); island.name = 'island'; root.add(island);
  const slab = new THREE.Group(); island.add(slab);
  slab.add(box(42, 1.2, 26, '#4caf50', 0, -0.6, 0, 0.6));
  slab.add(box(41.6, 1.6, 25.6, '#7a5434', 0, -1.8, 0, 0.3));
  const rockM = std('#8a8378', { roughness: 1, flatShading: true });
  const rc = new THREE.Mesh(new THREE.ConeGeometry(17, 22, 8), rockM); rc.rotation.x = PI; rc.position.y = -13.5; rc.scale.z = 0.7; slab.add(rc);
  for (let k = 0; k < 7; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(3 + 3 * hash(k), 6 + 8 * hash(k * 3), 6), rockM); c.rotation.x = PI; const a = k / 7 * PI * 2; c.position.set(Math.cos(a) * 14, -4 - 3 * hash(k * 5), Math.sin(a) * 8.5); slab.add(c); }
  const street = new THREE.Group(); island.add(street);
  street.add(box(38, 0.04, 6, '#3a3d46', 0, 0.02, 0));
  for (const s of [-1, 1]) street.add(box(38, 0.12, 2.2, '#b9b4ad', 0, 0.06, s * 4.1));
  for (let k = 0; k < 6; k++) street.add(box(2.2, 0.05, 0.25, '#f2f2f2', -15 + k * 6, 0.045, 0));
  for (const x of [-12, -6, 0, 6, 12]) for (const s of [-1, 1]) { const l = makeLamp(); l.position.set(x + (s > 0 ? 3 : 0), 0, s * 4.9); street.add(l); }
  for (const [x, z] of [[-16, -9], [16, 9], [15.5, -9.5], [-15.5, 9.5], [-2, -11], [8.5, 11]]) { const t = makeTree(1, Math.round(x)); t.position.set(x, 0, z); street.add(t); }
  const houses = HOUSE_SPOTS.map(([x, z, yaw, wall, roof], i) => {
    const h = makeFloatHouse({ wall, roof, lump: true, seed: i }); h.position.set(x, 0, z); h.rotation.y = yaw; island.add(h);
    h.userData.home = V(x, 0, z); h.userData.yaw = yaw;
    const hole = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.04, 4.8), holeM); hole.position.set(x, 0.025, z); hole.rotation.y = yaw; hole.visible = false; ground.add(hole); holes.push(hole);
    return h;
  });
  const tower = makeClockTower({ lump: true }); tower.position.set(-18.5, 0, 0); island.add(tower);
  const car = makeCar('#ff4fa3'); car.position.set(3, 0, 1.6); island.add(car);
  const car2 = makeCar('#4fb3ff'); car2.position.set(-7, 0, -1.6); car2.rotation.y = PI; island.add(car2);
  const shipMini = makeShip(); shipMini.scale.setScalar(0.62); shipMini.position.set(17.5, 1.4, -2); shipMini.rotation.set(0.1, PI * 0.92, 0.12); island.add(shipMini);
  const stage = box(4.5, 0.8, 7, '#2b2f6b', 16, 0.4, 2.5, 0.05); island.add(stage);
  // token clusters on houses / tower / cars (one swarm for the whole island)
  const swarm = makeSwarm(140, { glow: 1.2, stringR: 0.03 }); root.add(swarm.root);
  // clouds
  const clouds = [];
  for (let k = 0; k < 34; k++) {
    const c = makeCloud(k + 3, 3 + 4 * hash(k * 2.9), { emissive: '#f0d8ff', ei: 0.3 });
    const a = hash(k * 1.3) * PI * 2, r = 30 + 90 * hash(k * 7.7);
    c.userData.base = V(Math.cos(a) * r, -18 + 30 * hash(k * 4.1) - (k < 12 ? 14 : 0), Math.sin(a) * r);
    c.userData.speed = 0.6 + 1.2 * hash(k * 9.3);
    root.add(c); clouds.push(c);
  }
  const cloudsLow = [];   // a cloud floor under the island
  for (let k = 0; k < 18; k++) { const c = makeCloud(k + 60, 7 + 5 * hash(k * 3.1), { emissive: '#f4e0ff', ei: 0.4 }); c.userData.base = V((hash(k * 2.3) - 0.5) * 240, -46 - 6 * hash(k), (hash(k * 5.9) - 0.5) * 200); root.add(c); cloudsLow.push(c); }
  // tokens on everything: per house a cluster of 9, tower 14, cars 5, ship 6
  const clusterSpots = [];
  houses.forEach((h, i) => clusterSpots.push({ obj: h, n: 9, from: V(0, h.userData.h + 0.4, 0), top: h.userData.roofY + 3.5, spread: 1.8, seed: i * 11 }));
  clusterSpots.push({ obj: tower, n: 14, from: V(0, 15.6, 0), top: 21, spread: 2.6, seed: 300 });
  clusterSpots.push({ obj: car, n: 5, from: V(0, 1.55, 0), top: 4.5, spread: 1.0, seed: 400 });
  clusterSpots.push({ obj: car2, n: 5, from: V(0, 1.55, 0), top: 4.5, spread: 1.0, seed: 410 });
  const _p = V(), _f = V();
  let mode = 'sky', tokensOn = true, lastCam = null;
  const set = {
    root, background, fog, exposure: 1.0, anchors: {}, options: {},
    island, slab, street, houses, tower, car, car2, ground, holes, swarm, clouds, moon, moonGlow, stars, shipMini,
    setSky,
    set(k, v) { if (k === 'mode') set.setMode(v); },
    setLighting() {},
    setMode(m) {
      mode = m;
      island.children.forEach((c) => { c.visible = true; });   // shots may hide parts: always start from a full island
      houses.forEach((h) => { h.visible = true; }); tower.visible = car.visible = car2.visible = shipMini.visible = street.visible = true;
      street.children.forEach((c) => { c.visible = true; });
      gp.visible = true; ground.children.forEach((c) => { c.visible = true; });
      slab.visible = m !== 'ground'; ground.visible = m === 'ground';
      island.visible = m !== 'night';
      moon.visible = moonGlow.visible = m === 'night';
      cloudsLow.forEach((c) => { c.visible = m !== 'ground'; });
      clouds.forEach((c, i) => { c.visible = m === 'sky' || (m === 'ground' && i % 3 === 0); });
      island.position.set(0, 0, 0); island.rotation.set(0, 0, 0);
      houses.forEach((h, i) => { h.position.copy(h.userData.home); h.rotation.set(0, h.userData.yaw, 0); h.userData.under.visible = m !== 'ground'; holes[i].visible = false; });
      tower.position.set(-18.5, 0, 0); tower.rotation.set(0, 0, 0); tower.userData.under.visible = false;
      car.position.set(3, 0, 1.6); car.rotation.set(0, 0, 0); car2.position.set(-7, 0, -1.6); car2.rotation.set(0, PI, 0);
      tokensOn = m !== 'night';
      swarm.root.visible = m !== 'night';
      if (m === 'night') { swarm.begin(null); swarm.end(); }   // never keep a previous shot's clusters
      setSky(m === 'ground' ? 0 : m === 'night' ? 2 : 1);
    },
    showTokens(on) { tokensOn = on; },
    /** recompute the token clusters (call after moving houses).  dim 0..1, flare 0..1, tight 0..1 */
    tokens(t, camPos, { dim = 0, flare = 0, lift = 0 } = {}) {
      swarm.begin(camPos);
      if (tokensOn) {
        island.updateMatrixWorld(true);
        for (const c of clusterSpots) {
          if (!c.obj.visible) continue;
          for (let k = 0; k < c.n; k++) {
            const a = hash(c.seed + k * 1.7) * PI * 2, r = c.spread * (0.3 + 0.7 * hash(c.seed + k * 3.3));
            _p.set(Math.cos(a) * r + 0.3 * Math.sin(t * 1.3 + k), c.top + (hash(c.seed + k * 5.1) - 0.5) * 2.2 + lift + 0.25 * Math.sin(t * 1.7 + k * 2), Math.sin(a) * r);
            c.obj.localToWorld(_p); _f.copy(c.from); c.obj.localToWorld(_f);
            swarm.add(_p.clone(), { s: 2.4, from: _f.clone(), spin: 0.4 * Math.sin(t + k) });
          }
        }
      }
      swarm.end(); swarm.setDim(dim, flare);
    },
    update(t) {
      clouds.forEach((c) => { const b = c.userData.base; c.position.set(((b.x + t * c.userData.speed + 150) % 300) - 150, b.y + Math.sin(t * 0.3 + b.z) * 0.6, b.z); });
      cloudsLow.forEach((c, i) => { const b = c.userData.base; c.position.set(((b.x + t * 0.8 + 130) % 260) - 130, b.y, b.z); });
      bigStars.forEach((s, i) => { s.material.opacity = 0.5 + 0.4 * Math.sin(t * 2 + i * 1.7); });
    },
  };
  set.setMode('sky');
  return set;
}
