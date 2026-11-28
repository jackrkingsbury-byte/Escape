// In This Town — Episode 22 "Big Love": new props.  All deterministic: every animator is userData.set(t | u, …)
// and sets absolute values.  Units: metres, Y up, +Z = the prop's front unless noted.
//
//   makeFishBowl()        house-sized glass cylinder (R 3.8, glass top y 8.1) with gravel, weed, castle, bubbles and the
//                         giant goldfish.  userData.set(t, { blink, mouth, yaw, pitch, rise, swim }) · fishMouthWorld()
//   makeScaffold(h)       wooden deck on posts with a ladder and railing (deck top at y = h)
//   makeWheelbarrow()     red barrow full of yellow flakes; userData.set({ tip 0..1, full 0..1 })   (wheel at +Z)
//   makeFlakes(n)         falling flake cubes: userData.set(u, from: Vector3, to: Vector3, spread)  (u 0..1, world-free)
//   makeMiniDog()         a dog built ~0.42 m long; scale it down (pea 0.035, mouse 0.12). userData.set(t, { wag, hop })
//   makeLeash(n)          red leash line: userData.set(a: Vector3, b: Vector3, sag)  (parent = scene / identity frame)
//   makeMayorHouse()      6 × 5 m house, roof group (userData.roof) that can fly off: userData.set(u) (0 = on, 1 = gone)
//   makeWindowRoom()      flashback set: a wall with a window (opening 1.5 × 1.4 at y 1.0–2.4) + a cosy room behind it
//   makeHamster()         unit hamster (head r ≈ 1): userData.set(t, { cheeks, blink, wiggle })
//   makeDebris(n)         tumbling roof-tile cubes: userData.set(u, power)
//   makeRulesBoard()      two-sided town sign 4.6 × 3.2 m on posts; userData.set(flip 0..1)   (front faces +Z)
//   makeNoGrandmaSign()   shop-front "PET SHOP" sign board + grandma icon; userData.setX(u) stamps a red 3D X on it
//   makePuppy()           unit sleeping puppy curled up (≈ 3.4 long); userData.set(t, { breathe, ear })
//   makeRoadClosed()      striped barrier + ROAD CLOSED board + blinking amber lamps; userData.set(t)
//   makeStormClouds(n)    dark purple box clouds: userData.set(t, part 0..1, center x)
//   makeClockHand()       3D minute + hour hands for a clock face (pivot at the face centre, hands in the local XY plane)
//   makeTorchField(n)     glowing flashlight heads for filler crowds: userData.layout(list), set(t)
//   makeTears()           two tear drops for a human head (head-local); userData.set(t)
//   makeMesa()            the hill behind town for the final shot: flat top at y 9, radius 20
//   makePurrLines()       vibrating "purr" arcs: userData.set(t, a)
//   makeGroundConfetti()  flat party confetti squares scattered on the road (static)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, ease, hash, canvasTexture } from '../lib/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const FONTD = (s) => `${s}px "ITT World Display", "ITT Luckiest", "Luckiest Guy", Impact, "DejaVu Sans", sans-serif`;
const FONTW = (s) => `900 ${s}px "ITT World Text", "ITT Nunito", "Nunito", "DejaVu Sans", Arial, sans-serif`;

const _mats = new Map();
function std(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!_mats.has(k)) _mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o }));
  return _mats.get(k);
}
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const _geo = new Map();
function rgeo(w, h, d, r) { const k = `${w}|${h}|${d}|${r}`; if (!_geo.has(k)) _geo.set(k, r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d)); return _geo.get(k); }
function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0) {
  const o = new THREE.Mesh(rgeo(w, h, d, r), typeof m === 'string' ? std(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function cyl(rt, rb, h, m, seg = 20, open = false) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), typeof m === 'string' ? std(m) : m); o.castShadow = true; o.receiveShadow = true; return o; }
function cone(r, h, m, seg = 12) { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function sph(r, m, ws = 24, hs = 16) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function at(parent, o, x = 0, y = 0, z = 0) { o.position.set(x, y, z); parent.add(o); return o; }
function grp(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; }
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
function plane(w, h, tex, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, ...o })); return m; }

// ═════════════════════════════════════════════════════════════════════════════════════════ goldfish bowl
const FISH = '#ff7a1a', FISH_D = '#e8560c', FISH_L = '#ffb44a';
export const BOWL = { R: 3.8, top: 8.1, water: 7.55, base: 0.5 };
export function makeFishBowl() {
  const g = new THREE.Group(); g.name = 'fishBowl';
  const { R, top, water, base } = BOWL;
  // plinth + gravel
  g.add(at(g, cyl(R + 0.35, R + 0.45, base, '#8a7a6a', 40), 0, base / 2, 0));
  const gravelTex = canvasTexture(256, 64, (c, w, h) => {
    c.fillStyle = '#d9c08a'; c.fillRect(0, 0, w, h);
    const cols = ['#ff6fa8', '#5fc8ff', '#ffd23f', '#8be07a', '#f4f0e8', '#c09060'];
    for (let i = 0; i < 260; i++) { c.fillStyle = cols[i % cols.length]; c.beginPath(); c.arc(hash(i * 1.3) * w, hash(i * 2.7) * h, 2 + hash(i * 4.1) * 3, 0, PI * 2); c.fill(); }
  });
  gravelTex.wrapS = THREE.RepeatWrapping; gravelTex.repeat.set(4, 1);
  const gravel = cyl(R - 0.06, R - 0.06, 0.55, new THREE.MeshStandardMaterial({ map: gravelTex, roughness: 0.9 }), 40);
  g.add(at(g, gravel, 0, base + 0.27, 0));
  // castle + weed
  const castle = grp(g, 1.6, base + 0.55, -1.4);
  castle.add(box(1.2, 1.4, 1.0, '#f2c4c4', 0, 0.7, 0, 0.05));
  for (const [x, z] of [[-0.6, 0.5], [0.6, 0.5], [-0.6, -0.5], [0.6, -0.5]]) { castle.add(at(castle, cyl(0.22, 0.22, 1.9, '#f2c4c4', 10), x, 0.95, z)); castle.add(at(castle, cone(0.3, 0.5, '#4a5d7e', 10), x, 2.15, z)); }
  castle.add(box(0.4, 0.6, 0.05, '#3a2a1c', 0, 0.3, 0.52));
  const weeds = [];
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * PI * 2 + 0.4, r = R - 0.6 - hash(i) * 0.5;
    const w = grp(g, Math.cos(a) * r, base + 0.5, Math.sin(a) * r);
    let p = w; const segs = [];
    for (let k = 0; k < 5; k++) { const s = grp(p, 0, k ? 0.55 : 0, 0); s.add(box(0.22, 0.6, 0.08, k % 2 ? '#3fae4e' : '#5fcf4e', 0, 0.3, 0, 0.03)); segs.push(s); p = s; }
    weeds.push({ segs, ph: hash(i * 3.3) * 6 });
  }
  // the fish
  const fish = grp(g, 0, 4.2, 0); fish.name = 'fish';
  const body = grp(fish);
  const fm = std(FISH, { roughness: 0.35, emissive: '#ff5a00', emissiveIntensity: 0.18 });
  const bodyM = sph(1.75, fm, 32, 22); bodyM.scale.set(1.0, 0.92, 1.25); body.add(bodyM);
  const belly = sph(1.45, std(FISH_L, { roughness: 0.4, emissive: '#ff9a20', emissiveIntensity: 0.15 }), 24, 16); belly.scale.set(0.9, 0.7, 1.1); belly.position.set(0, -0.55, 0.35); body.add(belly);
  // scales hint: a few darker arcs on top
  for (let i = 0; i < 3; i++) { const s = sph(0.55, std(FISH_D, { roughness: 0.4 }), 12, 8); s.scale.set(1.6, 0.35, 0.9); s.position.set(0, 1.45 - i * 0.05, 0.6 - i * 0.75); body.add(s); }
  // tail
  const tail = grp(fish, 0, 0.1, -2.05);
  for (const s of [-1, 1]) { const c = cone(1.0, 2.2, std(FISH_D, { roughness: 0.4, emissive: '#ff4a00', emissiveIntensity: 0.15 }), 4); c.scale.set(0.22, 1, 1); c.rotation.x = -PI / 2 + s * 0.55; c.position.set(0, s * 0.55, -0.9); tail.add(c); }
  const dorsal = cone(0.8, 1.6, std(FISH_D, { roughness: 0.4 }), 4); dorsal.scale.set(0.2, 1, 1.1); dorsal.rotation.x = -0.5; dorsal.position.set(0, 1.85, -0.3); fish.add(dorsal);
  const fins = [];
  for (const s of [-1, 1]) { const f = grp(fish, s * 1.55, -0.45, 0.4); const c = cone(0.45, 1.1, std(FISH_D, { roughness: 0.4 }), 4); c.scale.set(1, 1, 0.22); c.rotation.z = s * 2.2; c.position.set(s * 0.35, -0.2, 0); f.add(c); fins.push(f); }
  // eyes (big glossy black spheres) + lids
  const eyeM = std('#0d0d14', { roughness: 0.08, metalness: 0.2 }), glintM = basic('#ffffff');
  const eyes = [], lids = [];
  for (const s of [-1, 1]) {
    const e = grp(fish, s * 0.95, 0.55, 1.7);
    const white = sph(0.66, std('#ffffff', { roughness: 0.3 }), 24, 16); e.add(white);
    const pupil = sph(0.52, eyeM, 24, 16); pupil.position.set(s * 0.05, 0, 0.2); e.add(pupil);
    const gl = sph(0.13, glintM, 12, 8); gl.position.set(s * 0.05 - 0.17, 0.2, 0.68); e.add(gl);
    const gl2 = sph(0.06, glintM, 8, 6); gl2.position.set(s * 0.05 + 0.12, -0.15, 0.7); e.add(gl2);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.84, 24, 12, 0, PI * 2, 0, PI / 2), std(FISH, { roughness: 0.35, emissive: '#ff5a00', emissiveIntensity: 0.18, side: THREE.DoubleSide })); e.add(lid);
    eyes.push(e); lids.push(lid);
  }
  // mouth
  const mouth = grp(fish, 0, -0.3, 2.15);
  const lips = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.16, 10, 24), std('#ff5a6a', { roughness: 0.4 })); mouth.add(lips);
  const hole = sph(0.42, basic('#3a0a14'), 16, 12); hole.scale.set(1, 1, 0.35); mouth.add(hole);
  // water + glass
  const waterM = new THREE.MeshStandardMaterial({ color: '#5ec8ff', roughness: 0.15, transparent: true, opacity: 0.26, depthWrite: false });
  const waterMesh = cyl(R - 0.08, R - 0.08, water - base - 0.55, waterM, 48); waterMesh.castShadow = false; waterMesh.position.y = base + 0.55 + (water - base - 0.55) / 2; waterMesh.renderOrder = 1; g.add(waterMesh);
  const surf = new THREE.Mesh(new THREE.CircleGeometry(R - 0.08, 48), new THREE.MeshStandardMaterial({ color: '#bfeaff', roughness: 0.1, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }));
  surf.rotation.x = -PI / 2; surf.position.y = water; surf.renderOrder = 1; g.add(surf);
  const glassM = new THREE.MeshStandardMaterial({ color: '#e8fbff', roughness: 0.05, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide });
  const glass = cyl(R, R, top - base, glassM, 56, true); glass.castShadow = false; glass.position.y = base + (top - base) / 2; glass.renderOrder = 2; g.add(glass);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.12, 10, 64), std('#dff6ff', { roughness: 0.15, transparent: true, opacity: 0.85 })); rim.rotation.x = PI / 2; rim.position.y = top; g.add(rim);
  const rim2 = new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.1, 8, 64), std('#9fd8ef', { roughness: 0.2 })); rim2.rotation.x = PI / 2; rim2.position.y = base + 0.05; g.add(rim2);
  const shineM = basic('#ffffff', { transparent: true, opacity: 0.38, depthWrite: false });
  for (const [a, w] of [[0.55, 0.28], [0.75, 0.12], [2.3, 0.18]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, top - base - 1.2), shineM); s.position.set(Math.cos(a) * (R + 0.02), base + (top - base) / 2, Math.sin(a) * (R + 0.02)); s.rotation.y = PI / 2 - a; s.renderOrder = 3; g.add(s); }
  // bubbles
  const nb = 26, bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 10, 8), std('#e8fbff', { roughness: 0.1, transparent: true, opacity: 0.7 }), nb);
  bub.frustumCulled = false; bub.renderOrder = 1; g.add(bub);
  const M4 = new THREE.Matrix4(), p = V(), q = new THREE.Quaternion(), sc = V();
  g.userData = {
    fish, eyes, lids, mouth, tail, fins,
    set(t, { blink = 0, mouth: mo = 0, yaw = 0, pitch = 0, rise = 0, swim = 1 } = {}) {
      fish.position.set(0.3 * Math.sin(t * 0.7) * swim, 4.2 + 0.25 * Math.sin(t * 1.3) * swim + rise, 0.2 * Math.cos(t * 0.6) * swim);
      fish.rotation.set(pitch, yaw + 0.12 * Math.sin(t * 0.8) * swim, 0.05 * Math.sin(t * 1.1) * swim, 'YXZ');
      tail.rotation.y = 0.35 * Math.sin(t * 4.0);
      fins.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * 0.3 * Math.sin(t * 5 + i); });
      for (const l of lids) l.rotation.set(lerp(-PI / 2, PI / 2, blink), 0, 0);
      mouth.scale.set(1 + 0.9 * mo, 1 + 1.6 * mo, 1);
      weeds.forEach((w) => w.segs.forEach((s, k) => { s.rotation.z = 0.18 * Math.sin(t * 1.1 + w.ph + k * 0.6); }));
      for (let i = 0; i < nb; i++) {
        const u = (hash(i * 1.7) + t * (0.08 + 0.05 * hash(i * 3.1))) % 1;
        const a = hash(i * 5.3) * PI * 2, r = 0.6 + hash(i * 7.1) * (R - 1.2);
        p.set(Math.cos(a) * r + 0.15 * Math.sin(t * 2 + i), base + 0.7 + u * (water - base - 0.9), Math.sin(a) * r);
        sc.setScalar(0.6 + hash(i * 2.2) * 1.2); M4.compose(p, q, sc); bub.setMatrixAt(i, M4);
      }
      bub.instanceMatrix.needsUpdate = true;
    },
    mouthWorld() { g.updateMatrixWorld(true); return mouth.getWorldPosition(V()); },
    eyeWorld(i = 0) { g.updateMatrixWorld(true); return eyes[i].getWorldPosition(V()); },
  };
  g.userData.set(0);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ scaffold / barrow / flakes
export function makeScaffold(h = 7.4) {
  const g = new THREE.Group(), wood = '#c98a4b', dark = '#9a6a38';
  const W = 2.4, D = 2.0;
  for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) g.add(box(0.16, h, 0.16, wood, x, h / 2, z));
  for (let y = 1.6; y < h - 0.5; y += 1.8) { g.add(box(W, 0.1, 0.1, dark, 0, y, D / 2)); g.add(box(W, 0.1, 0.1, dark, 0, y, -D / 2)); g.add(box(0.1, 0.1, D, dark, W / 2, y, 0)); g.add(box(0.1, 0.1, D, dark, -W / 2, y, 0)); }
  g.add(box(W + 0.3, 0.16, D + 0.3, '#d9a060', 0, h - 0.08, 0, 0.02));
  // railing on the back and sides (front −Z faces the bowl: open)
  for (const x of [-W / 2 - 0.1, W / 2 + 0.1]) { g.add(box(0.08, 1.0, 0.08, wood, x, h + 0.5, D / 2 + 0.1)); g.add(box(0.08, 0.08, D + 0.2, wood, x, h + 1.0, 0)); g.add(box(0.08, 1.0, 0.08, wood, x, h + 0.5, -D / 2 - 0.1)); }
  g.add(box(W + 0.28, 0.08, 0.08, wood, 0, h + 1.0, D / 2 + 0.1));
  // ladder on the +X side
  const lad = grp(g, W / 2 + 0.35, 0, 0);
  for (const s of [-1, 1]) lad.add(box(0.08, h + 1.0, 0.08, wood, 0, (h + 1.0) / 2, s * 0.32));
  for (let y = 0.35; y < h + 0.6; y += 0.42) lad.add(box(0.06, 0.05, 0.64, dark, 0, y, 0));
  g.userData = { deck: h };
  return g;
}

export function makeWheelbarrow() {
  const g = new THREE.Group();
  const pivot = grp(g, 0, 0.3, 0.55);          // the wheel axle; the barrow tips about it (forward = +Z)
  const body = grp(pivot, 0, 0, -0.55);
  const red = std('#d8231f', { roughness: 0.45 }), dark = std('#2a2a30');
  body.add(box(0.75, 0.08, 0.9, red, 0, 0.42, 0.05, 0.02));
  for (const s of [-1, 1]) { const w = box(0.06, 0.38, 0.95, red, s * 0.4, 0.6, 0.05, 0.02); w.rotation.z = s * 0.18; body.add(w); }
  const fr = box(0.8, 0.38, 0.06, red, 0, 0.6, 0.55, 0.02); fr.rotation.x = 0.3; body.add(fr);
  body.add(box(0.8, 0.36, 0.06, red, 0, 0.6, -0.42, 0.02));
  for (const s of [-1, 1]) { const hnd = box(0.06, 0.06, 1.3, dark, s * 0.3, 0.42, -0.6); body.add(hnd); body.add(box(0.07, 0.42, 0.07, dark, s * 0.25, 0.2, -0.3)); body.add(box(0.08, 0.1, 0.22, '#1d1d22', s * 0.3, 0.42, -1.2, 0.03)); }
  const wheel = cyl(0.3, 0.3, 0.14, '#1b1b1f', 18); wheel.rotation.z = PI / 2; pivot.add(wheel);
  const hub = cyl(0.12, 0.12, 0.16, '#cfd2d8', 10); hub.rotation.z = PI / 2; pivot.add(hub);
  // flake pile: instanced little cubes
  const n = 90, pile = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.03, 0.09), std('#ffd23f', { roughness: 0.5, emissive: '#ffb000', emissiveIntensity: 0.15 }), n);
  const cols = ['#ffd23f', '#ffb52a', '#ff8a2a', '#ffe680', '#ff6a3a'], c = new THREE.Color();
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < n; i++) {
    const x = (hash(i * 1.3) - 0.5) * 0.66, z = (hash(i * 2.9) - 0.5) * 0.82 + 0.05, dome = 0.32 * (1 - (x * x) / 0.12 - (z * z) / 0.2);
    e.set(hash(i * 4.4) * 3, hash(i * 5.5) * 3, hash(i * 6.6) * 3); q.setFromEuler(e);
    M4.compose(V(x, 0.5 + Math.max(0, dome) * hash(i * 7.7), z), q, V(1, 1, 1)); pile.setMatrixAt(i, M4); pile.setColorAt(i, c.set(cols[i % 5]));
  }
  body.add(pile);
  g.userData = {
    pile, pivot,
    set({ tip = 0, full = 1 } = {}) { pivot.rotation.x = 1.0 * tip; pile.visible = full > 0.02; pile.scale.set(1, Math.max(0.01, full), 1); pile.position.y = (1 - full) * -0.3; },
    lipWorld() { g.updateMatrixWorld(true); return body.localToWorld(V(0, 0.75, 0.6)); },
  };
  return g;
}

export function makeFlakes(n = 120) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.035, 0.1), std('#ffd23f', { roughness: 0.5, emissive: '#ffb000', emissiveIntensity: 0.25 }), n);
  m.frustumCulled = false;
  const cols = ['#ffd23f', '#ffb52a', '#ff8a2a', '#ffe680', '#ff6a3a'], c = new THREE.Color();
  for (let i = 0; i < n; i++) m.setColorAt(i, c.set(cols[i % 5]));
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s = V(1, 1, 1), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  m.userData = {
    /** u 0..1 overall pour progress; each flake leaves `from` at its own time and arcs to `to` (+ spread) */
    set(u, from, to, spread = 0.6, gulp = 2) {
      for (let i = 0; i < n; i++) {
        const t0 = hash(i * 1.1) * 0.55, k = (u - t0) / 0.42;
        if (k <= 0 || k >= 1) { m.setMatrixAt(i, Z); continue; }
        const ox = (hash(i * 2.3) - 0.5) * spread, oz = (hash(i * 3.7) - 0.5) * spread;
        p.set(lerp(from.x, to.x + ox, k), lerp(from.y, to.y, k) + 0.9 * Math.sin(PI * k) * (0.5 + hash(i * 4.9)), lerp(from.z, to.z + oz, k));
        e.set(k * 9 + i, k * 7, i); q.setFromEuler(e); M4.compose(p, q, s); m.setMatrixAt(i, M4);
      }
      m.instanceMatrix.needsUpdate = true;
    },
  };
  return m;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ tiny dog + leash
export function makeMiniDog() {
  const g = new THREE.Group(); g.name = 'miniDog';
  const brown = std('#8a5a2e', { roughness: 0.7 }), dark = std('#5a3a1c', { roughness: 0.7 });
  const bodyG = grp(g, 0, 0.17, 0);
  bodyG.add(box(0.16, 0.13, 0.3, brown, 0, 0, 0, 0.04));
  const head = grp(bodyG, 0, 0.09, 0.16);
  head.add(box(0.15, 0.13, 0.13, brown, 0, 0.02, 0.02, 0.04));
  head.add(box(0.08, 0.06, 0.08, '#c08a5a', 0, -0.01, 0.11, 0.02));
  head.add(box(0.035, 0.03, 0.03, '#1d1d22', 0, 0.015, 0.155, 0.01));
  for (const s of [-1, 1]) {
    head.add(box(0.03, 0.035, 0.01, '#1d1d22', s * 0.04, 0.05, 0.088, 0.005));
    head.add(box(0.012, 0.012, 0.006, '#ffffff', s * 0.04 - 0.008, 0.058, 0.094, 0));
    const ear = box(0.04, 0.08, 0.03, dark, s * 0.075, 0.06, 0.0, 0.01); ear.rotation.z = s * 0.4; head.add(ear);
  }
  const tongue = box(0.03, 0.01, 0.04, '#ff6a8a', 0, -0.045, 0.13, 0.004); head.add(tongue);
  const legs = [];
  for (const [x, z] of [[-0.05, 0.1], [0.05, 0.1], [-0.05, -0.1], [0.05, -0.1]]) { const l = grp(bodyG, x, -0.05, z); l.add(box(0.045, 0.12, 0.045, brown, 0, -0.06, 0, 0.012)); legs.push(l); }
  const tail = grp(bodyG, 0, 0.04, -0.15);
  const tc = cone(0.025, 0.12, dark, 6); tc.position.y = 0.06; tail.add(tc);
  const collar = box(0.17, 0.03, 0.03, '#e8232b', 0, 0.06, 0.13, 0.01); bodyG.add(collar);
  g.userData = {
    head, tail, collarLocal: V(0, 0.23, 0.13),
    set(t, { wag = 1, hop = 0 } = {}) {
      tail.rotation.set(-0.5, 0, wag * 0.8 * Math.sin(t * 22));
      const hp = hop * Math.abs(Math.sin(t * 7));
      bodyG.position.y = 0.17 + 0.12 * hp; bodyG.rotation.x = hop * -0.25 * Math.cos(t * 7);
      head.rotation.set(0.1 * Math.sin(t * 3), 0.25 * Math.sin(t * 1.7), 0);
      legs.forEach((l, i) => { l.rotation.x = (hp > 0.05 ? -0.6 : 0.2 * Math.sin(t * 9 + i * PI)) * (i < 2 ? 1 : -1); });
    },
    collarWorld() { g.updateMatrixWorld(true); return bodyG.localToWorld(V(0, 0.06, 0.13)); },
  };
  g.userData.set(0);
  return g;
}

export function makeLeash(n = 14, r = 0.012, color = '#e8232b') {
  const g = new THREE.Group(); g.name = 'leash';
  const geo = new THREE.CylinderGeometry(r, r, 1, 6); geo.translate(0, 0.5, 0);
  const m = std(color, { roughness: 0.5 });
  const segs = []; for (let i = 0; i < n; i++) { const s = new THREE.Mesh(geo, m); g.add(s); segs.push(s); }
  const a = V(), b = V(), up = V(0, 1, 0), q = new THREE.Quaternion(), d = V();
  g.userData = {
    set(A, B, sag = 0.15, thick = 1) {
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n;
        a.copy(A).lerp(B, u0); a.y -= sag * 4 * u0 * (1 - u0);
        b.copy(A).lerp(B, u1); b.y -= sag * 4 * u1 * (1 - u1);
        d.subVectors(b, a); const L = d.length();
        segs[i].position.copy(a); q.setFromUnitVectors(up, d.normalize()); segs[i].quaternion.copy(q); segs[i].scale.set(thick, Math.max(1e-4, L), thick);
      }
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ mayor's house + hamster
export function makeMayorHouse() {
  const g = new THREE.Group(); g.name = 'mayorHouse';
  const W = 6.2, D = 5.4, Hh = 4.2, wall = '#f2c4c4', trim = '#ffffff';
  g.add(box(W, Hh, D, wall, 0, Hh / 2, 0, 0.05));
  g.add(box(W + 0.3, 0.3, D + 0.3, '#c9b48c', 0, 0.15, 0));
  // front (+Z): door, windows, plaque, flower boxes
  g.add(box(1.1, 2.1, 0.08, '#7a1f2b', 0, 1.05 + 0.3, D / 2 + 0.03, 0.02));
  g.add(box(0.1, 0.1, 0.06, '#ffd23f', 0.38, 1.35, D / 2 + 0.09));
  const plaqueTex = canvasTexture(256, 96, (c, w, h) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a5a10'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#3a2a10'; c.textAlign = 'center'; c.textBaseline = 'middle'; fit(c, 'MAYOR', FONTD, w * 0.8, 64); c.fillText('MAYOR', w / 2, h / 2 + 4); });
  const plaque = plane(0.9, 0.34, plaqueTex); plaque.position.set(0, 2.75, D / 2 + 0.05); g.add(plaque);
  for (const x of [-1.9, 1.9]) for (const y of [1.6, 3.2]) {
    if (y > 3 && Math.abs(x) < 0.1) continue;
    g.add(box(1.1, 1.0, 0.06, std('#9fd0f0', { roughness: 0.15, emissive: '#3a6a9a', emissiveIntensity: 0.25 }), x, y, D / 2 + 0.03));
    g.add(box(1.25, 0.1, 0.12, trim, x, y - 0.55, D / 2 + 0.06)); g.add(box(1.25, 0.1, 0.12, trim, x, y + 0.55, D / 2 + 0.06));
    g.add(box(0.08, 1.0, 0.1, trim, x, y, D / 2 + 0.06));
    if (y < 2) { g.add(box(1.2, 0.25, 0.3, '#8a5a2e', x, y - 0.72, D / 2 + 0.18)); for (let k = 0; k < 4; k++) g.add(at(g, sph(0.12, ['#ff4fa3', '#ffd23f', '#ff7a2f', '#8a5cff'][k], 8, 6), x - 0.42 + k * 0.28, y - 0.55, D / 2 + 0.22)); }
  }
  for (const s of [-1, 1]) for (const y of [1.6, 3.2]) { g.add(box(0.06, 1.0, 1.1, std('#9fd0f0', { roughness: 0.15 }), s * (W / 2 + 0.03), y, 0)); }
  // roof (separate group: flies off)
  const roof = grp(g, 0, Hh, 0); roof.name = 'roof';
  const inner = grp(roof);
  const rh = 2.2, half = W / 2 + 0.35, slope = Math.hypot(half, rh), ang = Math.atan2(rh, half);
  for (const s of [-1, 1]) { const p = box(slope + 0.1, 0.22, D + 0.7, '#7a1f2b', s * half / 2, rh / 2, 0, 0.04); p.rotation.z = -s * ang; inner.add(p); }
  const gableGeo = new THREE.BufferGeometry();
  const gv = new Float32Array([-half + 0.3, 0, 0, half - 0.3, 0, 0, 0, rh - 0.15, 0]); gableGeo.setAttribute('position', new THREE.BufferAttribute(gv, 3)); gableGeo.computeVertexNormals();
  for (const s of [-1, 1]) { const gm = new THREE.Mesh(gableGeo, std(wall, { side: THREE.DoubleSide })); gm.position.z = s * (D / 2 - 0.02); inner.add(gm); }
  inner.add(box(0.6, 1.3, 0.6, '#b5543f', 1.6, 1.6, -0.8));
  inner.add(box(0.75, 0.15, 0.75, '#8a3a2a', 1.6, 2.3, -0.8));
  // little round gold dome-flag on the ridge
  inner.add(at(inner, cyl(0.03, 0.03, 1.1, '#3a3a40', 6), -1.6, rh + 0.25, 0));
  const flag = box(0.6, 0.38, 0.03, '#ffd23f', -1.3, rh + 0.6, 0); inner.add(flag);
  // attic floor (dark) so a missing roof shows a hole
  g.add(box(W - 0.2, 0.1, D - 0.2, '#5a3a2a', 0, Hh - 0.06, 0));
  g.userData = {
    roof, W, D, H: Hh,
    /** u: 0 roof on → 1 gone (flies up + back, spinning). side: +1 → toward +X */
    set(u, side = 1) {
      const k = clamp(u, 0, 1);
      roof.position.set(side * 7 * k, Hh + 16 * k - 8 * k * k, -4 * k);
      roof.rotation.set(-1.6 * k, 0.6 * k, side * 2.2 * k);
      roof.visible = k < 0.999;
    },
  };
  return g;
}

/** the flashback window: a wall with a window and a cosy room behind it.  Origin = wall centre at the floor, wall faces +Z (outside). */
export function makeWindowRoom() {
  const g = new THREE.Group(); g.name = 'windowRoom';
  const wall = std('#f2c4c4'), trim = std('#ffffff');
  const ww = 1.5, wh = 1.4, wy = 1.0;                       // opening 1.5 × 1.4, sill at y 1.0
  const W = 7, H = 5;
  g.add(box((W - ww) / 2, H, 0.3, wall, -(ww / 2 + (W - ww) / 4), H / 2, 0));
  g.add(box((W - ww) / 2, H, 0.3, wall, ww / 2 + (W - ww) / 4, H / 2, 0));
  g.add(box(ww, wy, 0.3, wall, 0, wy / 2, 0));
  g.add(box(ww, H - wy - wh, 0.3, wall, 0, wy + wh + (H - wy - wh) / 2, 0));
  // frame, mullion, sill, flower box, curtains
  for (const y of [wy, wy + wh]) g.add(box(ww + 0.3, 0.14, 0.38, trim, 0, y, 0.02));
  for (const x of [-ww / 2, ww / 2]) g.add(box(0.14, wh + 0.2, 0.38, trim, x, wy + wh / 2, 0.02));
  g.add(box(0.06, wh, 0.06, trim, 0, wy + wh / 2, 0.0));
  g.add(box(ww, 0.06, 0.06, trim, 0, wy + wh * 0.62, 0.0));
  g.add(box(ww + 0.3, 0.3, 0.35, '#8a5a2e', 0, wy - 0.22, 0.32));
  for (let k = 0; k < 7; k++) { g.add(at(g, sph(0.11, ['#ff4fa3', '#ffd23f', '#ff7a2f', '#8a5cff', '#ffffff'][k % 5], 8, 6), -0.66 + k * 0.22, wy - 0.02, 0.36)); g.add(box(0.14, 0.1, 0.1, '#3fae4e', -0.66 + k * 0.22, wy - 0.1, 0.3)); }
  for (const s of [-1, 1]) { const c = box(0.35, wh + 0.1, 0.06, '#ff7aa8', s * (ww / 2 - 0.2), wy + wh / 2 + 0.05, -0.2); g.add(c); const tie = box(0.38, 0.08, 0.08, '#ffd23f', s * (ww / 2 - 0.2), wy + 0.45, -0.18); g.add(tie); }
  // ivy blobs around the frame
  for (let i = 0; i < 9; i++) { const a = i / 9 * PI; g.add(at(g, sph(0.16 + hash(i) * 0.08, '#3c8f45', 8, 6), Math.cos(a) * 1.15 * (i % 2 ? 1 : -1) * 0.9, wy + wh + 0.15 + hash(i * 2) * 0.2, 0.18)); }
  // the room (behind −Z)
  const room = grp(g, 0, 0, -2.6);
  const wpTex = canvasTexture(256, 256, (c, w, h) => { c.fillStyle = '#ffe6b8'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffcf8a'; for (let x = 0; x < w; x += 32) c.fillRect(x, 0, 12, h); c.fillStyle = '#ff9fb0'; for (let i = 0; i < 16; i++) { c.beginPath(); c.arc((i % 4) * 64 + 26, Math.floor(i / 4) * 64 + 30, 7, 0, PI * 2); c.fill(); } });
  wpTex.wrapS = wpTex.wrapT = THREE.RepeatWrapping; wpTex.repeat.set(3, 2);
  const back = plane(6, 4.2, wpTex); back.position.set(0, 2.1, -1.4); room.add(back);
  for (const s of [-1, 1]) { const side = plane(4, 4.2, wpTex); side.rotation.y = -s * PI / 2; side.position.set(s * 3, 2.1, 0.5); room.add(side); }
  room.add(box(6, 0.1, 4, '#b07a44', 0, 0.05, 0.5));
  // picture frame of a hamster, a lamp, a shelf with a little top hat
  const picTex = canvasTexture(256, 200, (c, w, h) => { c.fillStyle = '#a8d8ff'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8b878'; c.beginPath(); c.arc(w / 2, h * 0.6, 60, 0, PI * 2); c.fill(); c.beginPath(); c.arc(w / 2 - 40, h * 0.3, 18, 0, PI * 2); c.arc(w / 2 + 40, h * 0.3, 18, 0, PI * 2); c.fill(); c.fillStyle = '#1d1d22'; c.beginPath(); c.arc(w / 2 - 20, h * 0.55, 7, 0, PI * 2); c.arc(w / 2 + 20, h * 0.55, 7, 0, PI * 2); c.fill(); c.fillStyle = '#ff7aa8'; c.beginPath(); c.arc(w / 2, h * 0.64, 6, 0, PI * 2); c.fill(); c.strokeStyle = '#ff4fa3'; c.lineWidth = 6; c.font = FONTD(30); c.fillStyle = '#ff4fa3'; c.textAlign = 'center'; c.fillText('♥', w * 0.85, h * 0.25); });
  const pic = plane(0.8, 0.62, picTex); pic.position.set(-1.0, 2.6, -1.33); room.add(pic);
  room.add(box(0.95, 0.77, 0.06, '#8a5a2e', -1.0, 2.6, -1.37));
  room.add(box(1.4, 0.08, 0.3, '#8a5a2e', 1.2, 2.3, -1.25));
  room.add(at(room, cyl(0.16, 0.18, 0.04, '#16161c', 16), 1.2, 2.36, -1.25)); room.add(at(room, cyl(0.1, 0.11, 0.22, '#16161c', 16), 1.2, 2.49, -1.25));
  room.add(at(room, cyl(0.04, 0.06, 1.4, '#3a3a40', 8), 2.0, 0.7, -0.9));
  const shade = cyl(0.22, 0.35, 0.36, std('#fff2c8', { emissive: '#ffcf70', emissiveIntensity: 0.9 }), 16); shade.position.set(2.0, 1.55, -0.9); room.add(shade);
  const light = new THREE.PointLight('#ffd9a0', 7, 7, 1.5); light.position.set(0.3, 2.6, 1.0); room.add(light);
  g.userData = { room, light, sillY: wy, openW: ww, openH: wh };
  return g;
}

export function makeHamster() {
  const g = new THREE.Group(); g.name = 'hamster';
  const tan = std('#e8b878', { roughness: 0.75 }), cream = std('#fff1dc', { roughness: 0.8 }), pink = std('#ff9fb0', { roughness: 0.6 });
  const body = sph(1.25, tan, 28, 20); body.scale.set(1.15, 1, 1.0); body.position.set(0, -1.45, -0.2); g.add(body);
  const bellyM = sph(0.95, cream, 24, 16); bellyM.scale.set(1, 0.95, 0.6); bellyM.position.set(0, -1.4, 0.55); g.add(bellyM);
  const head = grp(g, 0, 0, 0);
  const skull = sph(1.0, tan, 28, 20); skull.scale.set(1.05, 0.95, 0.95); head.add(skull);
  const cheeks = [];
  for (const s of [-1, 1]) {
    const ch = sph(0.55, cream, 20, 14); ch.position.set(s * 0.62, -0.32, 0.45); head.add(ch); cheeks.push(ch);
    const ear = grp(head, s * 0.62, 0.78, -0.1); ear.add(sph(0.3, tan, 14, 10)); const ei = sph(0.2, pink, 12, 8); ei.position.z = 0.12; ei.scale.set(1, 1, 0.5); ear.add(ei);
    const eye = grp(head, s * 0.4, 0.2, 0.8);
    eye.add(sph(0.19, std('#0d0d14', { roughness: 0.08, metalness: 0.2 }), 16, 12));
    const gl = sph(0.06, basic('#ffffff'), 8, 6); gl.position.set(s * 0.02 - 0.06, 0.07, 0.16); eye.add(gl);
  }
  const nose = sph(0.12, pink, 12, 8); nose.position.set(0, -0.05, 0.98); head.add(nose);
  const muzzle = sph(0.32, cream, 16, 12); muzzle.scale.set(1.2, 0.8, 0.7); muzzle.position.set(0, -0.25, 0.78); head.add(muzzle);
  for (const s of [-1, 1]) head.add(box(0.09, 0.16, 0.05, '#ffffff', s * 0.05, -0.48, 0.92, 0.02));
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const w = box(0.5, 0.015, 0.015, '#5a4030', s * 0.5, -0.15 + k * 0.08, 0.86); w.rotation.z = s * (k - 1) * 0.18; head.add(w); }
  const paws = [];
  for (const s of [-1, 1]) { const p = grp(g, s * 0.75, -0.95, 0.95); p.add(sph(0.26, pink, 12, 8)); for (let k = 0; k < 3; k++) p.add(at(p, sph(0.08, pink, 8, 6), (k - 1) * 0.11, 0.18, 0.1)); paws.push(p); }
  g.userData = {
    head, cheeks, paws,
    set(t, { cheeks: ck = 1, wiggle = 1, look = 0 } = {}) {
      cheeks.forEach((c) => c.scale.setScalar(0.85 + 0.55 * ck + 0.04 * Math.sin(t * 9)));
      head.rotation.set(0.05 * Math.sin(t * 2.3) * wiggle, look + 0.12 * Math.sin(t * 1.4) * wiggle, 0.08 * Math.sin(t * 1.9) * wiggle);
      nose.position.y = -0.05 + 0.02 * Math.sin(t * 18);
      paws.forEach((p, i) => { p.position.y = -0.95 + 0.06 * Math.sin(t * 6 + i * PI) * wiggle; });
    },
  };
  return g;
}

export function makeDebris(n = 60, cols = ['#7a1f2b', '#b5543f', '#f2c4c4', '#c9b48c', '#5a3a2a', '#ffd23f']) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 0.18, 0.35), std('#ffffff', { roughness: 0.7 }), n);
  m.frustumCulled = false; m.castShadow = true;
  const c = new THREE.Color(); for (let i = 0; i < n; i++) m.setColorAt(i, c.set(cols[i % cols.length]));
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s = V(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  m.userData = {
    set(u, power = 1, dur = 1.6) {
      const tt = u * dur;
      for (let i = 0; i < n; i++) {
        if (u <= 0) { m.setMatrixAt(i, Z); continue; }
        const a = hash(i * 1.9) * PI * 2, el = 0.35 + hash(i * 3.3) * 1.0, sp = (5 + hash(i * 4.7) * 9) * power;
        const vx = Math.cos(a) * Math.cos(el) * sp, vy = Math.sin(el) * sp, vz = Math.sin(a) * Math.cos(el) * sp;
        p.set(vx * tt, vy * tt - 4.9 * tt * tt, vz * tt);
        e.set(tt * (3 + i % 5), tt * 4, i); q.setFromEuler(e); s.setScalar(0.6 + hash(i * 6.1) * 1.4);
        M4.compose(p, q, s); m.setMatrixAt(i, M4);
      }
      m.instanceMatrix.needsUpdate = true;
    },
  };
  return m;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ rules board + pet shop sign
function boardTex(kind) {
  return canvasTexture(1024, 720, (c, w, h) => {
    if (kind === 'front') {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5fc8ff'); gr.addColorStop(1, '#3a8fe0'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#ffffff'; c.lineWidth = 26; c.strokeRect(20, 20, w - 40, h - 40);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      const lines = [['WELCOME', 170, '#ffd23f'], ['TO TOWN', 150, '#ffffff'], ['WE LOVE OUR PETS', 70, '#ffffff']];
      let y = 190; for (const [s, sz, col] of lines) { const f = fit(c, s, FONTD, w * 0.84, sz); c.lineWidth = f * 0.16; c.strokeStyle = '#1d3a6a'; c.strokeText(s, w / 2, y); c.fillStyle = col; c.fillText(s, w / 2, y); y += f * 1.15 + 20; }
      c.fillStyle = '#ff4fa3'; c.font = FONTD(110); c.fillText('♥', w * 0.12, h * 0.82); c.fillText('♥', w * 0.88, h * 0.82);
    } else {
      c.fillStyle = '#fff4d6'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e8232b'; c.fillRect(0, 0, w, 170);
      c.strokeStyle = '#1d1d22'; c.lineWidth = 24; c.strokeRect(12, 12, w - 24, h - 24);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      let f = fit(c, 'TOWN RULES', FONTD, w * 0.8, 130); c.fillStyle = '#ffffff'; c.fillText('TOWN RULES', w / 2, 96);
      const rows = [['1.', 'NO "I LOVE YOU"', 'INDOORS'], ['2.', 'NO GRANDMAS IN', 'THE PET SHOP']];
      let y = 250;
      for (const [n, a, b] of rows) {
        c.fillStyle = '#e8232b'; c.font = FONTD(90); c.textAlign = 'left'; c.fillText(n, 50, y + 40);
        c.textAlign = 'center'; c.fillStyle = '#1d1d22';
        f = fit(c, a, FONTD, w * 0.76, 78); c.fillText(a, w / 2 + 50, y);
        f = fit(c, b, FONTD, w * 0.76, 78); c.fillText(b, w / 2 + 50, y + 84);
        y += 220;
      }
    }
  });
}
export function makeRulesBoard() {
  const g = new THREE.Group(); g.name = 'rulesBoard';
  const W = 4.6, H = 3.2, y0 = 2.6;
  for (const s of [-1, 1]) { g.add(box(0.22, y0 + H / 2 + 0.3, 0.22, '#5a3a24', s * (W / 2 + 0.2), (y0 + H / 2 + 0.3) / 2, 0)); g.add(at(g, sph(0.2, '#ffd23f', 10, 8), s * (W / 2 + 0.2), y0 + H / 2 + 0.45, 0)); }
  const pivot = grp(g, 0, y0, 0);
  pivot.add(box(W + 0.2, H + 0.2, 0.12, '#5a3a24', 0, 0, 0, 0.04));
  const front = plane(W, H, boardTex('front'), { emissive: '#ffffff', emissiveIntensity: 0.12 }); front.position.z = 0.065; pivot.add(front);
  const back = plane(W, H, boardTex('back'), { emissive: '#ffffff', emissiveIntensity: 0.12 }); back.position.z = -0.065; back.rotation.y = PI; pivot.add(back);
  // bunting along the top
  for (let i = 0; i < 9; i++) { const f = cone(0.16, 0.34, ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f'][i % 5], 3); f.rotation.x = PI; f.position.set(-W / 2 + 0.25 + i * (W - 0.5) / 8, H / 2 + 0.08 - 0.06 * Math.sin(PI * i / 8), 0.08); f.scale.z = 0.25; pivot.add(f); }
  g.userData = { pivot, set(flip) { pivot.rotation.x = 0; pivot.rotation.y = PI * clamp(flip, 0, 1); } };
  return g;
}

export function makeNoGrandmaSign() {
  const g = new THREE.Group(); g.name = 'petShop';
  // shop front
  const W = 5.0, H = 3.6;
  g.add(box(W, H, 0.3, '#cbe8c4', 0, H / 2, -0.15, 0.03));
  g.add(box(2.6, 1.7, 0.06, std('#bfe6ff', { roughness: 0.1, emissive: '#5a9ac8', emissiveIntensity: 0.3 }), -0.9, 1.45, 0.02));
  g.add(box(0.95, 2.1, 0.06, '#3f7a5a', 1.6, 1.05, 0.02));
  for (let i = 0; i < 8; i++) { const a = box(W / 8, 0.12, 0.9, i % 2 ? '#ffffff' : '#3fae4e', -W / 2 + W / 16 + i * W / 8, 2.75, 0.45); a.rotation.x = 0.35; g.add(a); }
  // little paw prints + a goldfish in the window (painted plane)
  const winTex = canvasTexture(512, 320, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#ff7a1a'; c.beginPath(); c.ellipse(150, 200, 60, 40, 0, 0, PI * 2); c.fill(); c.beginPath(); c.moveTo(90, 200); c.lineTo(40, 165); c.lineTo(40, 235); c.fill();
    c.fillStyle = '#1d1d22'; c.beginPath(); c.arc(180, 190, 9, 0, PI * 2); c.fill();
    c.fillStyle = '#c08a5a'; c.fillRect(300, 170, 120, 70); c.fillRect(400, 140, 60, 60); c.fillStyle = '#1d1d22'; c.beginPath(); c.arc(440, 160, 6, 0, PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = FONTD(60); c.textAlign = 'center'; c.fillText('PUPPIES!', w / 2, 80);
  });
  const win = plane(2.4, 1.5, winTex, { transparent: true }); win.position.set(-0.9, 1.45, 0.06); g.add(win);
  // the sign board above
  const signTex = canvasTexture(1024, 420, (c, w, h) => {
    c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1d1d22'; c.lineWidth = 22; c.strokeRect(11, 11, w - 22, h - 22);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1d1d22';
    fit(c, 'PET SHOP', FONTD, w * 0.5, 170); c.fillText('PET SHOP', w * 0.36, h * 0.42);
    fit(c, 'NO GRANDMAS', FONTW, w * 0.5, 64); c.fillStyle = '#e8232b'; c.fillText('NO GRANDMAS', w * 0.36, h * 0.8);
    // grandma icon on the right
    const cx = w * 0.8, cy = h * 0.52;
    c.fillStyle = '#e8e8e8'; c.beginPath(); c.arc(cx, cy - 120, 42, 0, PI * 2); c.fill();
    c.fillStyle = '#f0c8a8'; c.fillRect(cx - 70, cy - 95, 140, 120);
    c.fillStyle = '#d8d8d8'; c.fillRect(cx - 78, cy - 110, 156, 30);
    c.strokeStyle = '#1d1d22'; c.lineWidth = 8; c.beginPath(); c.arc(cx - 30, cy - 40, 20, 0, PI * 2); c.stroke(); c.beginPath(); c.arc(cx + 30, cy - 40, 20, 0, PI * 2); c.stroke(); c.beginPath(); c.moveTo(cx - 10, cy - 40); c.lineTo(cx + 10, cy - 40); c.stroke();
    c.beginPath(); c.arc(cx, cy - 2, 22, 0.15 * PI, 0.85 * PI); c.stroke();
    c.fillStyle = '#8a5cff'; c.fillRect(cx - 95, cy + 30, 190, 130);
  });
  const sign = plane(4.4, 1.8, signTex, { emissive: '#ffffff', emissiveIntensity: 0.12 }); sign.position.set(0, 3.6 + 0.95, 0.02); g.add(sign);
  g.add(box(4.6, 2.0, 0.12, '#1d1d22', 0, 3.6 + 0.95, -0.06));
  // the red X (3D), over the grandma icon
  const X = grp(g, 1.32, 3.6 + 0.98, 0.25);
  const xm = std('#e8232b', { emissive: '#ff1a1a', emissiveIntensity: 0.5, roughness: 0.4 });
  for (const s of [-1, 1]) { const b = box(2.0, 0.34, 0.16, xm, 0, 0, 0, 0.06); b.rotation.z = s * PI / 4; X.add(b); }
  X.visible = false;
  g.userData = {
    X,
    setX(u) { X.visible = u > 0; const k = u < 1 ? lerp(2.4, 1, ease.outCubic(clamp(u, 0, 1))) : 1; X.scale.setScalar(k); X.position.z = 0.25 + (k - 1) * 0.5; },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ giant puppy + barrier
export function makePuppy() {
  const g = new THREE.Group(); g.name = 'puppy';
  const grey = std('#9aa0aa', { roughness: 0.85 }), light = std('#cfd3da', { roughness: 0.85 }), dark = std('#5a5f6a', { roughness: 0.85 });
  // curled body: big ellipsoid lying on the ground, along X
  const body = sph(1.5, grey, 32, 20); body.scale.set(1.45, 0.75, 1.0); body.position.set(-0.3, 1.0, -0.2); g.add(body);
  const haunch = sph(1.0, grey, 24, 16); haunch.scale.set(1, 0.85, 1); haunch.position.set(-1.9, 0.9, 0.2); g.add(haunch);
  const spot = sph(0.7, light, 16, 12); spot.scale.set(1.2, 0.5, 0.9); spot.position.set(-0.6, 1.65, -0.3); g.add(spot);
  // head resting on the front paws (front = +Z, head at +X end)
  const head = grp(g, 1.75, 0.95, 0.75);
  const skull = sph(0.95, grey, 28, 20); skull.scale.set(1.05, 0.9, 1); head.add(skull);
  const snout = box(0.85, 0.55, 0.7, light, 0.05, -0.2, 0.7, 0.22); head.add(snout);
  const nose = box(0.32, 0.22, 0.2, '#1d1d22', 0.05, 0.0, 1.07, 0.08); head.add(nose);
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = grp(head, s * 0.82, 0.35, -0.05); const e = sph(0.45, dark, 16, 12); e.scale.set(0.45, 1.2, 0.85); e.position.y = -0.45; ear.add(e); ear.rotation.z = s * 0.5; ears.push(ear);
    const lid = box(0.36, 0.07, 0.06, '#1d1d22', s * 0.36, 0.18, 0.86, 0.03); lid.rotation.z = s * -0.25; head.add(lid);   // closed eyes
    const lash = box(0.06, 0.12, 0.05, '#1d1d22', s * 0.52, 0.12, 0.85, 0.02); lash.rotation.z = s * 0.7; head.add(lash);
  }
  const cheekL = sph(0.16, std('#ffb0c0', { roughness: 0.7 }), 10, 8); cheekL.position.set(-0.55, -0.08, 0.74); cheekL.scale.z = 0.4; head.add(cheekL);
  const cheekR = cheekL.clone(); cheekR.position.x = 0.62; head.add(cheekR);
  // front paws (big boxes) in front of the body
  const paws = [];
  for (const [x, z] of [[1.0, 1.35], [2.2, 1.45]]) { const p = box(1.0, 0.7, 1.2, light, x, 0.35, z, 0.28); g.add(p); for (let k = 0; k < 3; k++) g.add(box(0.06, 0.25, 0.05, dark, x - 0.25 + k * 0.25, 0.4, z + 0.61)); paws.push(p); }
  for (const [x, z] of [[-2.4, 1.0]]) g.add(box(1.1, 0.6, 0.9, light, x, 0.3, z, 0.25));
  // tail curled round the front
  const tail = grp(g, -2.6, 0.7, 0.6);
  let p = tail; for (let k = 0; k < 5; k++) { const s = grp(p, k ? 0.42 : 0, 0, 0); s.add(box(0.5, 0.36, 0.36, k === 4 ? light : grey, 0.22, 0, 0, 0.15)); s.rotation.y = -0.4; p = s; }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.1, 8, 24), std('#3ee0c8', { roughness: 0.4 })); collar.position.set(-0.55, -0.15, 0); collar.rotation.y = PI / 2; head.add(collar);
  const tag = cyl(0.17, 0.17, 0.05, '#ffd23f', 14); tag.rotation.z = PI / 2; tag.position.set(-0.6, -0.85, 0.15); head.add(tag);
  g.userData = {
    head, paws, body,
    set(t, { breathe = 1 } = {}) {
      const b = Math.sin(t * 1.3);
      body.scale.set(1.45, 0.75 * (1 + 0.04 * b * breathe), 1.0 * (1 + 0.02 * b * breathe));
      head.position.y = 0.95 + 0.04 * b * breathe; head.rotation.z = 0.04 * b;
      ears.forEach((e, i) => { e.rotation.x = 0.06 * Math.sin(t * 0.9 + i); });
    },
    pawWorld(i = 0) { g.updateMatrixWorld(true); return paws[i].getWorldPosition(V()); },
  };
  g.userData.set(0);
  return g;
}

export function makeRoadClosed() {
  const g = new THREE.Group(); g.name = 'roadClosed';
  const stripe = canvasTexture(512, 64, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8232b'; for (let x = -64; x < w + 64; x += 64) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 32, h); c.lineTo(x + 64, 0); c.lineTo(x + 32, 0); c.fill(); } });
  const W = 5.2;
  for (const s of [-1, 1]) { g.add(box(0.14, 1.5, 0.14, '#d9d9de', s * (W / 2 - 0.2), 0.75, 0)); g.add(box(0.6, 0.08, 0.5, '#3a3a40', s * (W / 2 - 0.2), 0.04, 0)); }
  for (const y of [0.55, 1.15]) { const b = new THREE.Mesh(new THREE.BoxGeometry(W, 0.32, 0.06), [std('#ffffff'), std('#ffffff'), std('#ffffff'), std('#ffffff'), new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6 })]); b.position.y = y; b.castShadow = true; g.add(b); }
  const signTex = canvasTexture(1024, 400, (c, w, h) => {
    c.fillStyle = '#ff8a1a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1d1d22'; c.lineWidth = 26; c.strokeRect(13, 13, w - 26, h - 26);
    c.fillStyle = '#1d1d22'; c.textAlign = 'center'; c.textBaseline = 'middle';
    fit(c, 'ROAD CLOSED', FONTD, w * 0.86, 190); c.fillText('ROAD CLOSED', w / 2, h * 0.42);
    fit(c, 'SLEEPING PUPPY', FONTW, w * 0.7, 70); c.fillText('SLEEPING PUPPY', w / 2, h * 0.78);
  });
  const sign = plane(2.6, 1.02, signTex, { emissive: '#ffffff', emissiveIntensity: 0.15 }); sign.position.set(0, 1.95, 0.05); g.add(sign);
  g.add(box(2.7, 1.1, 0.06, '#1d1d22', 0, 1.95, 0.0));
  g.add(box(0.1, 0.6, 0.1, '#d9d9de', 0, 1.35, -0.03));
  const lamps = [];
  for (const s of [-1, 1]) { const l = sph(0.13, std('#ffb000', { emissive: '#ffa000', emissiveIntensity: 1.5 }), 12, 8); l.position.set(s * (W / 2 - 0.2), 1.6, 0); g.add(l); lamps.push(l); }
  g.userData = { set(t) { lamps.forEach((l, i) => { l.material.emissiveIntensity = (Math.sin(t * 6 + i * PI) > 0 ? 2.2 : 0.2); }); } };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ storm clouds
export function makeStormClouds(n = 14, seed = 4) {
  const g = new THREE.Group(); g.name = 'stormClouds';
  const m = new THREE.MeshStandardMaterial({ color: '#3a2a5a', roughness: 1, emissive: '#2a1a4a', emissiveIntensity: 0.6, fog: false });
  const mL = new THREE.MeshStandardMaterial({ color: '#6a4a9a', roughness: 1, emissive: '#4a2a7a', emissiveIntensity: 0.5, fog: false });
  const list = [];
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group();
    const k = 3 + Math.floor(hash(i * 3.1 + seed) * 3);
    for (let j = 0; j < k; j++) {
      const s = 7 + hash(i * 7 + j + seed) * 8;
      const b = new THREE.Mesh(rgeo(s * 1.4, s * 0.7, s, s * 0.14), j % 2 ? mL : m);
      b.position.set((j - (k - 1) / 2) * s * 0.85, (hash(i + j * 2.2) - 0.3) * s * 0.35, (hash(j * 1.3 + i) - 0.5) * s * 0.6);
      c.add(b);
    }
    g.add(c);
    list.push({ c, x: (hash(i * 1.9 + seed) - 0.5) * 220, y: 34 + hash(i * 2.7 + seed) * 18, z: (hash(i * 4.3 + seed) - 0.5) * 120, sp: 0.6 + hash(i * 5.5) * 0.8 });
  }
  g.userData = {
    list, m, mL,
    set(t, part = 0, cx = 0, cz = 0) {
      for (const it of list) {
        const dx = it.x - cx, dz = it.z - cz, d = Math.max(1, Math.hypot(dx, dz));
        const push = part * 90;
        it.c.position.set(it.x + 1.2 * Math.sin(t * 0.3 * it.sp) + dx / d * push, it.y + part * 6, it.z + dz / d * push);
      }
    },
  };
  g.userData.set(0, 0);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ clock hands, torches, tears, mesa, purr
export function makeClockHand() {
  const g = new THREE.Group(); g.name = 'clockHands';
  const m = std('#3a2a1c', { roughness: 0.5 });
  const minute = grp(g); minute.add(box(0.11, 0.92, 0.08, m, 0, 0.42, 0.05, 0.02));
  const hour = grp(g); hour.add(box(0.14, 0.58, 0.08, m, 0, 0.26, 0.09, 0.02));
  g.add(at(g, cyl(0.1, 0.1, 0.1, m, 12), 0, 0, 0.08)); g.children[g.children.length - 1].rotation.x = PI / 2;
  g.userData = { minute, hour, set(mAng, hAng) { minute.rotation.z = mAng; hour.rotation.z = hAng; }, tipWorld() { g.updateMatrixWorld(true); return minute.localToWorld(V(0, 0.86, 0.1)); } };
  return g;
}

export function makeTorchField(n = 60) {
  const g = new THREE.Group(); g.name = 'torchField';
  const core = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.04, 0.22, 8), new THREE.MeshBasicMaterial({ color: '#fff4c0', toneMapped: false }), n);
  core.frustumCulled = false; g.add(core);
  const halo = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#ffe8a0', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), n);
  halo.frustumCulled = false; halo.renderOrder = 4; g.add(halo);
  let list = [];
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s = V(1, 1, 1), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  g.userData = {
    layout(l) { list = l.slice(0, n); return g.userData; },
    set(t, camPos = null) {
      for (let i = 0; i < n; i++) {
        if (i >= list.length) { core.setMatrixAt(i, Z); halo.setMatrixAt(i, Z); continue; }
        const it = list[i], sw = 0.15 * Math.sin(t * 1.3 + i);
        p.set(it.x + Math.sin(it.yaw) * 0.3 + Math.cos(it.yaw) * 0.25, 1.55 * (it.s || 1) + 0.05 * Math.sin(t * 2 + i), it.z + Math.cos(it.yaw) * 0.3 - Math.sin(it.yaw) * 0.25);
        e.set(-0.9 + sw, it.yaw, 0); q.setFromEuler(e); s.set(1, 1, 1); M4.compose(p, q, s); core.setMatrixAt(i, M4);
        q.identity(); if (camPos) { const m = new THREE.Matrix4().lookAt(camPos, p, V(0, 1, 0)); q.setFromRotationMatrix(m); }
        s.setScalar(0.9 + 0.15 * Math.sin(t * 7 + i * 1.7)); M4.compose(p, q, s); halo.setMatrixAt(i, M4);
      }
      core.instanceMatrix.needsUpdate = true; halo.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}
let _glowT = null;
export function glowTexture() {
  return _glowT ??= canvasTexture(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}

export function makeTears() {
  const g = new THREE.Group(); g.name = 'tears';
  const m = std('#5ec8ff', { roughness: 0.1, emissive: '#2a8fd0', emissiveIntensity: 0.6 });
  const drops = [];
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const d = sph(0.045, m, 10, 8); d.scale.set(1, 1.4, 0.7); g.add(d); drops.push({ d, s, k }); }
  // streams
  const streams = [];
  for (const s of [-1, 1]) { const st = box(0.05, 0.22, 0.02, std('#7fd8ff', { roughness: 0.1, emissive: '#3aa0e0', emissiveIntensity: 0.5, transparent: true, opacity: 0.85 }), s * 0.15, 0.17, 0.285); g.add(st); streams.push(st); }
  g.userData = {
    set(t) {
      drops.forEach(({ d, s, k }) => { const u = (t * 0.9 + k * 0.5 + (s > 0 ? 0.25 : 0)) % 1; d.position.set(s * (0.15 + 0.03 * u), 0.26 - 0.32 * u, 0.29 + 0.02 * u); d.visible = u < 0.92; });
    },
  };
  return g;
}

export function makeMesa() {
  const g = new THREE.Group(); g.name = 'mesa';
  const geo = new THREE.CylinderGeometry(20, 26, 9, 24, 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x); const j = 1 + 0.06 * Math.sin(a * 5) + 0.04 * Math.sin(a * 9 + y); pos.setXYZ(i, x * j, y, z * j); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, std('#4f9a48', { roughness: 0.95, flatShading: true })); m.position.y = 4.5; m.receiveShadow = true; m.castShadow = true; g.add(m);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(20.6, 20.6, 0.6, 24), std('#5bb050', { roughness: 0.95 })); top.position.y = 9.0; top.receiveShadow = true; g.add(top);
  for (let i = 0; i < 10; i++) { const a = hash(i * 1.3) * PI * 2, r = 6 + hash(i * 2.1) * 12; const t = cone(1.2, 3.4, std(i % 2 ? '#2f6e3a' : '#357a3e'), 6); t.position.set(Math.cos(a) * r, 10.8, Math.sin(a) * r - 6); g.add(t); }
  for (let i = 0; i < 18; i++) { const a = hash(i * 3.3) * PI * 2, r = 4 + hash(i * 4.1) * 15; const f = sph(0.35, ['#ff4fa3', '#ffd23f', '#ffffff', '#8a5cff'][i % 4], 8, 6); f.position.set(Math.cos(a) * r, 9.35, Math.sin(a) * r); g.add(f); }
  g.userData = { top: 9.3 };
  return g;
}

export function makePurrLines() {
  const g = new THREE.Group(); g.name = 'purr';
  const m = basic('#ffffff', { transparent: true, depthWrite: false, toneMapped: false });
  const arcs = [];
  for (let i = 0; i < 3; i++) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.4 + i * 0.25, 0.04, 6, 24, PI * 0.6), m); a.rotation.z = PI * 0.2; g.add(a); arcs.push(a); }
  g.userData = { set(t, a = 1) { m.opacity = a; g.visible = a > 0.01; arcs.forEach((r, i) => { r.position.x = 0.04 * Math.sin(t * 40 + i); r.scale.setScalar(1 + 0.08 * Math.sin(t * 20 + i)); }); } };
  return g;
}

/** party confetti lying on the road: a disc of radius r of small flat paper squares (prop-local, y = 0 is the ground).
 *  userData.clear(x, z, rad) hides the squares within rad of prop-local (x, z) (e.g. right under a low camera). */
export function makeGroundConfetti(n = 70, r = 0.9, size = 0.035) {
  const g = new THREE.Group(); g.name = 'groundConfetti';
  const cols = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ffffff', '#ff7a2f'];
  const geo = new THREE.BoxGeometry(size, 0.003, size * 0.7);
  const items = [];
  cols.forEach((c, ci) => {
    const idx = []; for (let i = 0; i < n; i++) if (i % cols.length === ci) idx.push(i);
    const im = new THREE.InstancedMesh(geo, std(c, { roughness: 0.6 }), idx.length); im.receiveShadow = true;
    const e = new THREE.Euler();
    idx.forEach((i, j) => {
      const a = hash(i * 1.71 + 3) * PI * 2, rr = r * Math.sqrt(hash(i * 2.93 + 1));
      e.set(0.15 * (hash(i * 5.1) - 0.5), hash(i * 3.7) * PI, 0.15 * (hash(i * 6.3) - 0.5));
      items.push({ im, j, p: V(Math.cos(a) * rr, 0.003, Math.sin(a) * rr), q: new THREE.Quaternion().setFromEuler(e) });
    });
    g.add(im);
  });
  const m4 = new THREE.Matrix4(), one = V(1, 1, 1), zero = V(1e-4, 1e-4, 1e-4);
  g.userData = {
    clear(x = 0, z = 0, rad = 0) {
      for (const it of items) { const hide = Math.hypot(it.p.x - x, it.p.z - z) < rad; m4.compose(it.p, it.q, hide ? zero : one); it.im.setMatrixAt(it.j, m4); it.im.instanceMatrix.needsUpdate = true; }
    },
  };
  g.userData.clear();
  return g;
}
