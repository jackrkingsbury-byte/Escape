// In This Town — Episode 28 "Out of Colour": new props.  Same conventions as src/props.js (SPEC.md §2/§7): ES module,
// metres, Y up, deterministic (no Math.random / clocks); animated things are pure functions of the t / u passed in.
//
//   greyRig(root)           makes any prop "drainable": clones its materials and adds
//                           root.userData.grey(k)  k = number 0..1 or fn(localPos: Vector3) → 0..1 (per mesh / per instance)
//                           (colour → dead grey, emissive dimmed, canvas maps swapped for grayscale copies above k 0.5)
//   makeRainbowArch()       giant arch of 7 bands of blocks (outer radius 15, base on y = 0, spans x ±15, faces +Z).
//                           userData.set(t, { crack 0..1, fall 0..1, glow })
//   makeCubeSwarm(n, cols)  instanced glowing cubes.  userData.plan(fn(i) → { p0, p1, t0, dur, h, s, spin }) then set(t)
//                           (positions in the swarm's parent space; a cube is hidden before t0 and after landing + fade)
//   makeFountain()          town fountain (stacked cylinders, r 3.2 basin).  userData.set(t, { rainbow 0..1, jet 1, geyser 0..1, splash u })
//   makeStall(o)            market stall (counter 2.4 × 1.1, striped canopy, sign, glowing colour cubes on the counter)
//                           o: { sign:[lines], canopy:[c1,c2], cubes:[colours], soldOut }
//   makeFruitStall()        fruit stall with grape bunches (userData.grapes = Group to drain), apples, oranges, bananas
//   makeGrapeBunch()        one bunch (origin = stem top, hangs along −Y)
//   makeCoins(n)            stack of gold coins (origin bottom). userData.set(count)
//   makeRockingChair()      seat height 0.5, faces +Z.  userData.set(rock angle)
//   makeKnitting()          two needles + scarf piece (parent to handR) and makeYarnBall()
//   makeTownMap()           paper map 1.2 × 0.85 on the desk (lies in XZ).  userData.set(nDots 0..6, line 0..1)
//   makePencil(color)       pencil (tip at −Y)
//   makeTrail(points)       ash-grey trail on the ground along a polyline [[x,z],…].  userData.set(u 0..1 revealed), userData.at(u) → [x,z]
//   makeWasher()            front-loading washing machine (door on +Z, origin bottom centre)
//   makeHoodie()            the washed hoodie: impossibly black flat hoodie (origin = shoulders centre, hangs along −Y), glint
//   makeCardigan()          Grandma's black cardigan shell (fits over the torso joint, origin = torso pivot)
//   makeHelmet()            firefighter helmet (parent to joints.head at y ≈ 0.6)
//   makeDoorSlab(w,h)       paint slab for a front door (origin bottom centre). userData.set(u 0..1 left→right, colour)
//   makeSpiral(n)           the impossible new colour: glowing helix of cubes.  userData.set(t, { rise 0..1, spread 0..1 })
//   makeGreyDisc()          flat grey disc (radius 1) to lay over grass for the grey wave
//   makeFencePost()         short fence post with a cap (pigeon perch)
import * as THREE from 'three';
import { clamp, lerp, hash, smooth, canvasTexture } from '../lib/util.js';
import { std, box, cyl, sph, glowSprite, labelPlane, textTex } from '../ep18/props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const _c = new THREE.Color(), _c2 = new THREE.Color();
export const RAINBOW = ['#e8232b', '#ff8a1a', '#ffd23f', '#3fc44a', '#2f8fff', '#4b3bd0', '#a34fe0'];

// ───────────────────────────────────────────────────────────────────────────── grey rig
const _greyTex = new Map();
function greyTex(tex) {
  if (!tex || !tex.image) return null;
  if (_greyTex.has(tex)) return _greyTex.get(tex);
  const img = tex.image, w = img.width || 256, h = img.height || 256;
  const t = canvasTexture(w, h, (g) => { g.filter = 'grayscale(1) brightness(0.92)'; g.drawImage(img, 0, 0, w, h); });
  t.wrapS = tex.wrapS; t.wrapT = tex.wrapT; t.repeat.copy(tex.repeat);
  _greyTex.set(tex, t); return t;
}
export function greyOf(c, out) { const l = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b; return out.setRGB(l * 0.78 + 0.05, l * 0.78 + 0.05, l * 0.8 + 0.055); }
export function greyRig(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const items = [];
  const m4 = new THREE.Matrix4();
  root.traverse((o) => {
    if (!o.isMesh || o.userData.noGrey) return;
    const arr = Array.isArray(o.material) ? o.material : [o.material];
    const mats = arr.map((m) => m.clone());
    o.material = Array.isArray(o.material) ? mats : mats[0];
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const p = o.geometry.boundingBox.getCenter(V()).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
    const rec = { o, mats, p, base: mats.map((m) => (m.color ? m.color.clone() : null)), emis: mats.map((m) => (m.emissive ? m.emissive.clone() : null)),
      maps: mats.map((m) => m.map || null), gmaps: mats.map((m) => (m.map ? greyTex(m.map) : null)), emaps: mats.map((m) => m.emissiveMap || null) };
    if (o.isInstancedMesh && o.instanceColor) {
      rec.ic0 = o.instanceColor.array.slice();
      rec.ip = [];
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); rec.ip.push(V().setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld).applyMatrix4(inv)); }
    }
    items.push(rec);
  });
  root.userData.greyItems = items;
  root.userData.grey = (k) => {
    for (const r of items) {
      const km = typeof k === 'function' ? clamp(k(r.p), 0, 1) : k;
      r.mats.forEach((m, j) => {
        if (r.base[j]) m.color.copy(r.base[j]).lerp(greyOf(r.base[j], _c), km);
        if (r.emis[j]) m.emissive.copy(r.emis[j]).lerp(greyOf(r.emis[j], _c), km).multiplyScalar(1 - 0.6 * km);
        if (r.maps[j]) { const nm = km > 0.5 ? r.gmaps[j] : r.maps[j]; if (m.map !== nm) { m.map = nm; if (r.emaps[j]) m.emissiveMap = nm; m.needsUpdate = true; } }
      });
      if (r.ic0) {
        const a = r.o.instanceColor.array;
        for (let i = 0; i < r.o.count; i++) {
          const ki = typeof k === 'function' ? clamp(k(r.ip[i]), 0, 1) : k;
          _c2.setRGB(r.ic0[i * 3], r.ic0[i * 3 + 1], r.ic0[i * 3 + 2]); greyOf(_c2, _c);
          a[i * 3] = lerp(_c2.r, _c.r, ki); a[i * 3 + 1] = lerp(_c2.g, _c.g, ki); a[i * 3 + 2] = lerp(_c2.b, _c.b, ki);
        }
        r.o.instanceColor.needsUpdate = true;
      }
    }
  };
  return root;
}

// ───────────────────────────────────────────────────────────────────────────── helpers
const UNIT = new THREE.BoxGeometry(1, 1, 1);
function inst(geo, mat, n, { cast = false } = {}) { const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; im.castShadow = cast; im.receiveShadow = false; return im; }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = V(), _s = V();

// ───────────────────────────────────────────────────────────────────────────── rainbow arch
export function makeRainbowArch({ R = 15, band = 1.05, depth = 1.8, per = 34 } = {}) {
  const g = new THREE.Group(); g.name = 'rainbowArch';
  const pivot = new THREE.Group(); g.add(pivot);
  const blocks = [];
  RAINBOW.forEach((col, b) => {
    const r = R - band * (b + 0.5), n = Math.round(per * r / R);
    for (let i = 0; i < n; i++) {
      const a = PI * (i + 0.5) / n, len = PI * r / n;
      blocks.push({ b, a, r, len, col, k: blocks.length });
    }
  });
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const im = inst(UNIT, mat, blocks.length); pivot.add(im);
  const edge = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, transparent: true, opacity: 0.35 });
  blocks.forEach((it) => { _c.set(it.col).multiplyScalar(0.86 + 0.24 * hash(it.k * 2.31)); im.setColorAt(it.k, _c); });
  im.instanceColor.needsUpdate = true;
  const halo = glowSprite('#fff4ff', R * 2.8, 0.35); halo.position.set(0, R * 0.55, -1); g.add(halo);
  void edge;
  g.userData = {
    pivot, im, blocks, halo,
    set(t, { crack = 0, fall = 0, glow = 1 } = {}) {
      pivot.rotation.x = -fall * fall * 1.45;           // topples toward +Z (the camera side) about its base line
      halo.material.opacity = 0.35 * glow * (1 - fall);
      for (const it of blocks) {
        const j = crack * (0.15 + 0.5 * hash(it.k * 1.7)) + fall * 1.2 * hash(it.k * 3.1);
        const rr = it.r + crack * (hash(it.k * 5.3) - 0.5) * 0.7 + j * 0.4;
        _p.set(Math.cos(it.a) * rr, Math.sin(it.a) * rr, (hash(it.k * 4.1) - 0.5) * crack * 1.2);
        _e.set(crack * (hash(it.k) - 0.5) * 0.8 + fall * (hash(it.k * 7) - 0.5) * 2, crack * (hash(it.k * 9) - 0.5) * 0.6, it.a - PI / 2 + crack * (hash(it.k * 11) - 0.5) * 0.7);
        _q.setFromEuler(_e);
        _s.set(it.len * (1 - 0.12 * crack) + 0.02, band * (0.98 - 0.1 * crack), depth);
        _m4.compose(_p, _q, _s); im.setMatrixAt(it.k, _m4);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
  g.userData.set(0);
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── glowing cube swarm
export function makeCubeSwarm(n = 400, cols = RAINBOW, { size = 0.5 } = {}) {
  const g = new THREE.Group(); g.name = 'cubeSwarm';
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const im = inst(new THREE.BoxGeometry(size, size, size), mat, n); g.add(im);
  for (let i = 0; i < n; i++) { _c.set(cols[i % cols.length]).multiplyScalar(0.9 + 0.3 * hash(i * 1.9)); im.setColorAt(i, _c); }
  im.instanceColor.needsUpdate = true;
  let plan = [];
  const Z = new THREE.Matrix4().makeScale(0, 0, 0);
  g.userData = {
    im, mat,
    /** fn(i) → { p0:Vector3, p1:Vector3, t0, dur, h (arc height), s (scale), spin, hold (seconds visible after landing), fade } */
    plan(fn) { plan = []; for (let i = 0; i < n; i++) plan.push(fn(i)); return g.userData; },
    set(t, { scale = 1 } = {}) {
      for (let i = 0; i < n; i++) {
        const f = plan[i];
        if (!f) { im.setMatrixAt(i, Z); continue; }
        const u = (t - f.t0) / f.dur;
        const hold = f.hold ?? 0.25;
        if (u < 0 || u > 1 + hold / f.dur) { im.setMatrixAt(i, Z); continue; }
        const uu = clamp(u, 0, 1), ue = f.ease ? f.ease(uu) : uu;
        _p.copy(f.p0).lerp(f.p1, ue); _p.y += (f.h || 0) * 4 * uu * (1 - uu);
        const sp = (f.spin ?? 6) * (t - f.t0);
        _e.set(sp * (0.5 + hash(i * 1.1)), sp * (0.5 + hash(i * 2.2)), sp * 0.3); _q.setFromEuler(_e);
        let sc = (f.s ?? 1) * scale;
        if (u < 0.08) sc *= u / 0.08;
        if (u > 1) sc *= 1 - (u - 1) * f.dur / hold;
        if (f.shrink) sc *= 1 - 0.85 * uu;
        _s.setScalar(Math.max(0.0001, sc)); _m4.compose(_p, _q, _s); im.setMatrixAt(i, _m4);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── fountain
export function makeFountain() {
  const g = new THREE.Group(); g.name = 'fountain';
  const stone = std('#d8d2c4', { roughness: 0.85 }), stoneD = std('#b8b0a0', { roughness: 0.9 }), trim = std('#8fb8d8', { roughness: 0.6 });
  const ring = cyl(3.3, 3.4, 0.7, stone, 40); ring.position.y = 0.35; g.add(ring);
  const rim = cyl(3.45, 3.45, 0.14, stoneD, 40); rim.position.y = 0.72; g.add(rim);
  const waterMat = new THREE.MeshStandardMaterial({ color: '#3aa8e8', roughness: 0.15, emissive: '#1a5a9a', emissiveIntensity: 0.35 });
  const water = cyl(3.05, 3.05, 0.1, waterMat, 40); water.position.y = 0.62; water.castShadow = false; g.add(water);
  const ped = cyl(0.55, 0.8, 1.6, stone, 20); ped.position.y = 1.2; g.add(ped);
  const bowl = cyl(1.6, 0.7, 0.45, stone, 28); bowl.position.y = 2.15; g.add(bowl);
  const bowlW = cyl(1.45, 1.45, 0.06, waterMat, 28); bowlW.position.y = 2.36; bowlW.castShadow = false; g.add(bowlW);
  const ped2 = cyl(0.3, 0.42, 0.9, stone, 16); ped2.position.y = 2.75; g.add(ped2);
  const bowl2 = cyl(0.8, 0.35, 0.3, stone, 20); bowl2.position.y = 3.3; g.add(bowl2);
  const knob = sph(0.22, trim, 14, 10); knob.position.y = 3.55; g.add(knob);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; const b = box(0.5, 0.18, 0.5, i % 2 ? '#ffd23f' : '#ff4fa3', Math.cos(a) * 3.3, 0.82, Math.sin(a) * 3.3, 0.05); g.add(b); }
  // jet: a stack of translucent cylinders (column) + falling curtain
  const jetMat = new THREE.MeshStandardMaterial({ color: '#cfefff', roughness: 0.1, transparent: true, opacity: 0.75, emissive: '#7fc8ff', emissiveIntensity: 0.4, depthWrite: false });
  const jet = cyl(0.16, 0.24, 1, jetMat, 14); jet.castShadow = false; jet.geometry.translate(0, 0.5, 0); jet.position.y = 3.6; g.add(jet);
  const curtain = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.62, 1, 28, 1, true), jetMat); curtain.position.y = 1.85; curtain.scale.y = 0.95; g.add(curtain);
  // rainbow geyser column: 7 coloured cylinder sections
  const gey = new THREE.Group(); gey.position.y = 0.7; g.add(gey);
  const geyMats = RAINBOW.map((c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.92 }));
  const segs = geyMats.map((m, i) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 18, 1, true), m); s.geometry.translate(0, 0.5, 0); gey.add(s); return s; });
  const glow = glowSprite('#ffffff', 10, 0.0); glow.position.y = 6; g.add(glow);
  g.userData = {
    water, bowlW, jet, curtain, gey, segs, glow, waterMat,
    set(t, { rainbow = 0, jet: jk = 1, geyser = 0, height = 40 } = {}) {
      jet.scale.set(1 + 0.08 * Math.sin(t * 13), 1.6 * jk + 0.15 * Math.sin(t * 9), 1 + 0.08 * Math.sin(t * 11));
      jet.visible = jk > 0.01; curtain.visible = jk > 0.01;
      curtain.rotation.y = t * 0.6;
      const hue = (t * 0.35) % 1;
      if (rainbow > 0) { _c.setHSL(hue, 0.85, 0.55); waterMat.color.set('#3aa8e8').lerp(_c, rainbow); waterMat.emissive.set('#1a5a9a').lerp(_c, rainbow); waterMat.emissiveIntensity = 0.35 + 0.5 * rainbow; }
      else { waterMat.color.set('#3aa8e8'); waterMat.emissive.set('#1a5a9a'); waterMat.emissiveIntensity = 0.35; }
      gey.visible = geyser > 0.001;
      if (gey.visible) {
        const H = height * geyser;
        segs.forEach((s, i) => {
          const r = (1.9 - i * 0.22) * (1 + 0.06 * Math.sin(t * 17 + i));
          s.scale.set(r, H * (1 - i * 0.035), r); s.rotation.y = t * (1 + i * 0.3);
        });
      }
      glow.material.opacity = 0.7 * geyser;
    },
  };
  g.userData.set(0);
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── market stall
export function makeStall({ sign = ['BLUE', '9 COINS'], canopy = ['#2f8fff', '#ffffff'], cubes = ['#2f8fff'], soldOut = false, signBg = '#fff4e0', signFg = '#1d1d22' } = {}) {
  const g = new THREE.Group(); g.name = 'stall';
  const wood = std('#b07a4a'), woodD = std('#7d5232');
  g.add(box(2.4, 0.95, 1.0, wood, 0, 0.475, 0, 0.04));
  g.add(box(2.5, 0.08, 1.1, woodD, 0, 0.99, 0, 0.02));
  g.add(box(2.36, 0.5, 0.04, std(canopy[0]), 0, 0.55, 0.51, 0.01));
  for (const [x, z] of [[-1.15, -0.45], [1.15, -0.45], [-1.15, 0.45], [1.15, 0.45]]) g.add(box(0.08, 2.5, 0.08, woodD, x, 1.25, z));
  for (let i = 0; i < 8; i++) { const s = box(0.31, 0.06, 1.5, std(i % 2 ? canopy[1] : canopy[0]), -1.085 + i * 0.31, 2.55, 0.05); s.rotation.x = -0.18; g.add(s); }
  for (let i = 0; i < 8; i++) { const v = box(0.31, 0.22, 0.04, std(i % 2 ? canopy[1] : canopy[0]), -1.085 + i * 0.31, 2.34, 0.82); g.add(v); }
  const sp = labelPlane(sign, 1.9, 0.62, { bg: signBg, fg: signFg, border: signFg, glow: 0.35 });
  sp.position.set(0, 1.78, 0.5); g.add(sp);
  // trays of glowing colour cubes
  const cubeMats = cubes.map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.4 }));
  const cubeList = [];
  for (let tr = 0; tr < 3; tr++) {
    const tx = -0.75 + tr * 0.75;
    g.add(box(0.62, 0.06, 0.55, '#e8e0d0', tx, 1.06, 0.05, 0.02));
    if (soldOut && tr !== 1) continue;
    const nn = soldOut ? 0 : 6;
    for (let i = 0; i < nn; i++) { const c = box(0.17, 0.17, 0.17, cubeMats[(i + tr) % cubeMats.length], tx - 0.19 + (i % 3) * 0.19, 1.18 + Math.floor(i / 3) * 0.0, 0.05 + (Math.floor(i / 3) - 0.5) * 0.2, 0.02); c.castShadow = false; g.add(c); cubeList.push(c); }
  }
  if (soldOut) { const so = labelPlane(['SOLD', 'OUT'], 0.55, 0.42, { bg: '#e8232b', fg: '#ffffff', border: '#ffffff', glow: 0.4 }); so.position.set(0.0, 1.32, 0.33); so.rotation.x = -0.35; g.add(so); }
  g.userData = { cubeList, cubeMats, set(t) { cubeMats.forEach((m, i) => { m.emissiveIntensity = 0.7 + 0.35 * Math.sin(t * 3 + i * 2); }); } };
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── fruit
const _sphG = new THREE.SphereGeometry(1, 10, 8);
export function makeGrapeBunch(n = 22, seed = 1, color = '#7a2fa8') {
  const g = new THREE.Group();
  const im = new THREE.InstancedMesh(_sphG, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 }), n); im.castShadow = true;
  for (let i = 0; i < n; i++) {
    const layer = Math.floor(Math.sqrt(i * 1.6)), y = -0.035 - layer * 0.045, rr = Math.max(0.01, 0.075 - layer * 0.012);
    const a = i * 2.4 + seed;
    _p.set(Math.cos(a) * rr * hash(i + seed), y, Math.sin(a) * rr * hash(i * 2 + seed));
    _s.setScalar(0.03 + 0.006 * hash(i * 3 + seed)); _q.identity(); _m4.compose(_p, _q, _s); im.setMatrixAt(i, _m4);
    _c.set(color).multiplyScalar(0.8 + 0.4 * hash(i * 7 + seed)); im.setColorAt(i, _c);
  }
  g.add(im);
  const stem = cyl(0.008, 0.008, 0.06, std('#5a8a2a'), 6); stem.position.y = 0.0; g.add(stem);
  const leaf = box(0.07, 0.01, 0.05, '#4caf50', 0.03, 0.01, 0); leaf.rotation.z = 0.4; g.add(leaf);
  return g;
}
export function makeFruitStall() {
  const g = new THREE.Group(); g.name = 'fruitStall';
  const wood = std('#c8955a'), woodD = std('#8a5a2e');
  g.add(box(2.6, 0.85, 1.0, woodD, 0, 0.425, 0, 0.03));
  for (const [x, z] of [[-1.25, -0.45], [1.25, -0.45], [-1.25, 0.45], [1.25, 0.45]]) g.add(box(0.08, 2.4, 0.08, woodD, x, 1.2, z));
  for (let i = 0; i < 9; i++) { const s = box(0.3, 0.06, 1.4, i % 2 ? '#ffffff' : '#3fc44a', -1.2 + i * 0.3, 2.45, 0.05); s.rotation.x = -0.16; g.add(s); }
  const sp = labelPlane(['FRUIT'], 1.4, 0.45, { bg: '#fff4e0', fg: '#3a7a2a', border: '#3a7a2a', glow: 0.3 }); sp.position.set(0, 2.05, 0.48); g.add(sp);
  // three crates tilted toward the customer
  const crates = new THREE.Group(); crates.position.set(0, 0.85, 0.05); crates.rotation.x = 0.22; g.add(crates);
  const grapes = new THREE.Group(); grapes.name = 'grapes';
  const crate = (x, inner) => { crates.add(box(0.78, 0.18, 0.66, wood, x, 0.09, 0, 0.02)); crates.add(box(0.7, 0.04, 0.58, inner, x, 0.17, 0)); };
  crate(-0.85, '#3a2a1a'); crate(0, '#3a2a1a'); crate(0.85, '#3a2a1a');
  crates.add(grapes);
  for (let i = 0; i < 9; i++) { const b = makeGrapeBunch(20, i * 3.1); b.position.set(-0.27 + (i % 3) * 0.27, 0.32 + 0.02 * hash(i), -0.18 + Math.floor(i / 3) * 0.19); b.rotation.set(-PI / 2 + 0.2, 0, hash(i * 5) - 0.5); b.scale.setScalar(1.25); grapes.add(b); }
  const apples = new THREE.InstancedMesh(_sphG, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }), 24); apples.castShadow = true;
  for (let i = 0; i < 24; i++) {
    const left = i < 12, j = i % 12;
    _p.set((left ? -0.85 : 0.85) - 0.25 + (j % 4) * 0.17, 0.25 + (j >= 8 ? 0.08 : 0), -0.2 + (Math.floor(j / 4) % 3) * 0.18);
    _s.setScalar(left ? 0.085 : 0.08); _q.identity(); _m4.compose(_p, _q, _s); apples.setMatrixAt(i, _m4);
    apples.setColorAt(i, _c.set(left ? '#e8232b' : '#ff8a1a').multiplyScalar(0.85 + 0.3 * hash(i * 3)));
  }
  crates.add(apples);
  for (let i = 0; i < 3; i++) { const b = box(0.06, 0.06, 0.32, '#ffd23f', 1.25 + 0.0, 1.05 - i * 0.02, -0.1 + i * 0.09, 0.03); b.rotation.set(0.2, 0.3 * i, 0.5); g.add(b); }
  g.userData = { grapes, crates };
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── coins
export function makeCoins(n = 12) {
  const g = new THREE.Group();
  const m = std('#ffcf3a', { metalness: 0.5, roughness: 0.35, emissive: '#5a3a00', emissiveIntensity: 0.4 });
  const list = [];
  for (let i = 0; i < n; i++) { const c = cyl(0.05, 0.05, 0.014, m, 16); c.position.set((hash(i) - 0.5) * 0.012, 0.007 + i * 0.015, (hash(i * 3) - 0.5) * 0.012); g.add(c); list.push(c); }
  g.userData = { set(k) { list.forEach((c, i) => { c.visible = i < k; }); } };
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── porch
export function makeRockingChair() {
  const g = new THREE.Group();
  const rock = new THREE.Group(); g.add(rock);
  const wood = std('#8a5a2e'), woodL = std('#b07a4a');
  rock.add(box(0.58, 0.07, 0.55, woodL, 0, 0.5, 0, 0.02));
  rock.add(box(0.58, 0.7, 0.06, woodL, 0, 0.88, -0.27, 0.02));
  for (let i = 0; i < 3; i++) rock.add(box(0.06, 0.62, 0.03, wood, -0.18 + i * 0.18, 0.86, -0.235));
  for (const s of [-1, 1]) {
    rock.add(box(0.05, 0.5, 0.05, wood, s * 0.27, 0.25, 0.22)); rock.add(box(0.05, 0.5, 0.05, wood, s * 0.27, 0.25, -0.22));
    rock.add(box(0.06, 0.05, 0.5, wood, s * 0.3, 0.72, 0.0));
    for (let k = 0; k < 7; k++) { const a = -0.55 + k * 0.18; rock.add(box(0.05, 0.05, 0.2, wood, s * 0.27, 0.9 - Math.cos(a) * 0.88, Math.sin(a) * 0.88 * 0.55)); }
  }
  const cushion = box(0.5, 0.06, 0.48, '#c0392b', 0, 0.55, 0.0, 0.03); rock.add(cushion);
  g.userData = { rock, set(a) { rock.rotation.x = a; } };
  return g;
}
export function makeKnitting() {
  const g = new THREE.Group();
  const nm = std('#d9dce2', { metalness: 0.5, roughness: 0.3 });
  for (const s of [-1, 1]) { const n = cyl(0.008, 0.008, 0.36, nm, 6); n.rotation.z = s * 0.9; n.position.set(s * 0.06, 0.02, 0); g.add(n); const b = sph(0.016, std('#ff4fa3'), 8, 6); b.position.set(s * 0.06 + s * Math.sin(0.9) * 0.18, 0.02 + Math.cos(0.9) * 0.18, 0); g.add(b); }
  const scarf = new THREE.Group(); g.add(scarf);
  for (let i = 0; i < 6; i++) scarf.add(box(0.2, 0.05, 0.03, i % 2 ? '#ff4fa3' : '#ffd23f', 0, -0.04 - i * 0.05, 0.02, 0.01));
  return g;
}
export function makeYarnBall(color = '#ff4fa3') { const g = new THREE.Group(); const b = sph(0.1, std(color, { roughness: 1 }), 12, 10); b.position.y = 0.1; g.add(b); for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 20), std('#ffffff')); t.position.y = 0.1; t.rotation.set(i * 1.1, i * 0.7, 0); g.add(t); } return g; }

// ───────────────────────────────────────────────────────────────────────────── map + pencil
// map coords: x 0..1 (west→east), y 0..1 (north→south).  Dots = where it went grey; the line ends at "my house".
const MAP_DOTS = [[0.88, 0.47], [0.62, 0.5], [0.16, 0.38], [0.3, 0.27], [0.36, 0.44], [0.4, 0.6]];
const MAP_LINE = [[0.95, 0.47], [0.62, 0.5], [0.25, 0.5], [0.16, 0.38], [0.3, 0.27], [0.36, 0.44], [0.4, 0.62]];
function mapTex(nDots, lineU) {
  return canvasTexture(1024, 724, (g, w, h) => {
    g.fillStyle = '#f6efdc'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9b98f'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
    // park (west)
    g.fillStyle = '#d6dccb'; g.fillRect(40, 120, 230, 470);
    for (let i = 0; i < 9; i++) { g.fillStyle = '#b9c2ad'; g.beginPath(); g.arc(80 + (i % 3) * 70, 190 + Math.floor(i / 3) * 140, 26, 0, PI * 2); g.fill(); }
    // main street
    g.fillStyle = '#d8d0bc'; g.fillRect(250, 320, 740, 90);
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.setLineDash([24, 18]); g.beginPath(); g.moveTo(260, 365); g.lineTo(980, 365); g.stroke(); g.setLineDash([]);
    // houses
    const houses = [[300, 190], [420, 190], [540, 190], [660, 190], [780, 190], [330, 460], [450, 460], [570, 460], [860, 460]];
    houses.forEach(([x, y], i) => { g.fillStyle = '#e8dcc0'; g.fillRect(x, y, 90, 80); g.strokeStyle = '#8c7b6b'; g.lineWidth = 5; g.strokeRect(x, y, 90, 80); g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 45, y - 34); g.lineTo(x + 96, y); g.stroke(); });
    // my house (star)
    g.fillStyle = '#8c7b6b'; g.font = '900 34px "ITT Nunito", "DejaVu Sans", sans-serif'; g.textAlign = 'center';
    g.fillText('ME', 375, 590);
    // square (east)
    g.strokeStyle = '#8c7b6b'; g.lineWidth = 6; g.strokeRect(900, 240, 100, 250); g.fillText('SQUARE', 950, 230);
    g.fillText('PARK', 155, 110); g.fillText('BAKERY', 345, 175);
    // grey dots (pencil) + the line
    const P = ([x, y]) => [x * w, y * h];
    if (lineU > 0) {
      g.strokeStyle = '#4a4a50'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([]);
      const pts = MAP_LINE.map(P); let L = 0; const segs = [];
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); L += d; }
      let rem = L * lineU; g.beginPath(); g.moveTo(...pts[0]);
      for (let i = 1; i < pts.length && rem > 0; i++) { const k = Math.min(1, rem / segs[i - 1]); g.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); rem -= segs[i - 1]; }
      g.stroke();
      if (lineU >= 1) { const [x, y] = P(MAP_LINE[MAP_LINE.length - 1]); g.strokeStyle = '#e8232b'; g.lineWidth = 12; g.beginPath(); g.arc(x, y, 46, 0, PI * 2); g.stroke(); }
    }
    for (let i = 0; i < nDots; i++) { const [x, y] = P(MAP_DOTS[i]); g.fillStyle = '#3a3a40'; g.beginPath(); g.arc(x, y, 22, 0, PI * 2); g.fill(); g.fillStyle = '#8a8a90'; g.beginPath(); g.arc(x - 6, y - 6, 7, 0, PI * 2); g.fill(); }
  });
}
export function makeTownMap() {
  const g = new THREE.Group();
  const texs = [];
  for (let n = 0; n <= 6; n++) texs.push(mapTex(n, 0));
  const lineT = [0.25, 0.5, 0.75, 1].map((u) => mapTex(6, u));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.85), new THREE.MeshStandardMaterial({ map: texs[0], roughness: 0.9 }));
  m.rotation.x = -PI / 2; m.position.y = 0.004; m.receiveShadow = true; g.add(m);
  g.userData = { mesh: m, dots: MAP_DOTS, set(n, line = 0) { const nn = clamp(Math.floor(n), 0, 6); m.material.map = line > 0 ? lineT[clamp(Math.ceil(line * 4) - 1, 0, 3)] : texs[nn]; } };
  return g;
}
export function makePencil(color = '#8a8a90') {
  const g = new THREE.Group();
  const body = cyl(0.012, 0.012, 0.18, std(color), 6); body.position.y = 0.05; g.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 6), std('#e8c89a')); tip.rotation.x = PI; tip.position.y = -0.058; g.add(tip);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.012, 6), std('#3a3a40')); lead.rotation.x = PI; lead.position.y = -0.077; g.add(lead);
  const er = cyl(0.013, 0.013, 0.025, std('#ff9fb0'), 6); er.position.y = 0.152; g.add(er);
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── grey trail
export function makeTrail(points, { w = 2.2, step = 0.6 } = {}) {
  const g = new THREE.Group(); g.name = 'trail';
  const samples = []; let L = 0;
  for (let i = 1; i < points.length; i++) {
    const [x0, z0] = points[i - 1], [x1, z1] = points[i], d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(d / step));
    for (let k = 0; k < n; k++) { const u = k / n; samples.push({ x: lerp(x0, x1, u), z: lerp(z0, z1, u), yaw: Math.atan2(x1 - x0, z1 - z0), s: L + d * u }); }
    L += d;
  }
  const last = points[points.length - 1]; samples.push({ x: last[0], z: last[1], yaw: samples[samples.length - 1].yaw, s: L });
  const mat = new THREE.MeshLambertMaterial({ color: '#bdbdbd' }), matE = new THREE.MeshLambertMaterial({ color: '#5a5a5e' });
  const im = inst(UNIT, mat, samples.length), ime = inst(UNIT, matE, samples.length * 2);
  im.receiveShadow = true; g.add(im); g.add(ime);
  const Z = new THREE.Matrix4().makeScale(0, 0, 0);
  const at = (u) => { const s = u * L; let i = 0; while (i < samples.length - 1 && samples[i + 1].s < s) i++; const a = samples[i], b = samples[Math.min(i + 1, samples.length - 1)]; const k = b.s > a.s ? clamp((s - a.s) / (b.s - a.s), 0, 1) : 0; return [lerp(a.x, b.x, k), lerp(a.z, b.z, k), a.yaw]; };
  g.userData = {
    L, samples, at,
    set(u, { y = 0.16 } = {}) {
      const s = u * L;
      samples.forEach((it, i) => {
        if (it.s > s) { im.setMatrixAt(i, Z); ime.setMatrixAt(i * 2, Z); ime.setMatrixAt(i * 2 + 1, Z); return; }
        _e.set(0, it.yaw, 0); _q.setFromEuler(_e);
        _m4.compose(_p.set(it.x, y, it.z), _q, _s.set(w, 0.04, step * 1.15)); im.setMatrixAt(i, _m4);
        for (const sg of [-1, 1]) { _m4.compose(_p.set(it.x + Math.cos(it.yaw) * sg * w / 2, y + 0.01, it.z - Math.sin(it.yaw) * sg * w / 2), _q, _s.set(0.22, 0.05, step * 1.15)); ime.setMatrixAt(i * 2 + (sg > 0 ? 1 : 0), _m4); }
      });
      im.instanceMatrix.needsUpdate = true; ime.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── laundry
export function makeWasher() {
  const g = new THREE.Group();
  g.add(box(0.7, 0.9, 0.65, '#f4f4f6', 0, 0.45, 0, 0.05));
  g.add(box(0.66, 0.14, 0.04, '#dfe3ea', 0, 0.8, 0.33, 0.02));
  for (let i = 0; i < 3; i++) { const k = cyl(0.03, 0.03, 0.03, std(['#2f8fff', '#e8232b', '#3fc44a'][i]), 12); k.rotation.x = PI / 2; k.position.set(0.12 + i * 0.08, 0.8, 0.355); g.add(k); }
  const door = new THREE.Group(); door.position.set(-0.2, 0.42, 0.33); g.add(door);   // hinge on the left
  const ringD = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 10, 28), std('#b8bec8', { metalness: 0.4, roughness: 0.3 })); ringD.position.x = 0.2; door.add(ringD);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.2, 28), new THREE.MeshStandardMaterial({ color: '#2a3550', roughness: 0.1, transparent: true, opacity: 0.85 })); glass.position.set(0.2, 0, 0.01); door.add(glass);
  const drum = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), new THREE.MeshBasicMaterial({ color: '#0a0a10' })); drum.position.set(0, 0.42, 0.328); g.add(drum);
  const bubbles = new THREE.Group(); g.add(bubbles);
  for (let i = 0; i < 8; i++) { const b = sph(0.04 + 0.03 * hash(i), new THREE.MeshStandardMaterial({ color: '#e8f6ff', roughness: 0.2, transparent: true, opacity: 0.8 }), 8, 6); b.position.set((hash(i * 2) - 0.5) * 0.5, 0.5 + hash(i * 3) * 0.3, 0.35 + hash(i) * 0.1); bubbles.add(b); }
  g.userData = { door, bubbles, set(open = 0, t = 0) { door.rotation.y = -open * 1.9; bubbles.children.forEach((b, i) => { b.position.y = 0.45 + ((hash(i * 3) + t * 0.2) % 1) * 0.6; }); } };
  return g;
}
export function makeHoodie() {
  const g = new THREE.Group(); g.name = 'hoodie';
  const black = new THREE.MeshBasicMaterial({ color: '#000000' });
  const body = box(0.62, 0.62, 0.07, black, 0, -0.34, 0, 0.04); g.add(body);
  for (const s of [-1, 1]) { const sl = box(0.16, 0.56, 0.07, black, s * 0.4, -0.33, 0, 0.04); sl.rotation.z = s * 0.22; g.add(sl); }
  const hood = box(0.36, 0.22, 0.08, black, 0, 0.02, -0.01, 0.06); g.add(hood);
  const pocket = box(0.36, 0.13, 0.02, new THREE.MeshBasicMaterial({ color: '#050507' }), 0, -0.52, 0.045, 0.02); g.add(pocket);
  const glint = glowSprite('#ffffff', 0.32, 1); glint.position.set(0.16, -0.18, 0.08); g.add(glint);
  const star = new THREE.Group(); star.position.copy(glint.position); g.add(star);
  for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.025), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true })); b.rotation.z = i * PI / 2; b.position.z = 0.01; star.add(b); }
  g.userData = { glint, star, set(t) { const k = 0.6 + 0.4 * Math.sin(t * 5); glint.scale.setScalar(0.32 * k); star.scale.setScalar(0.6 + 0.6 * Math.abs(Math.sin(t * 2.5))); star.rotation.z = t * 1.2; } };
  return g;
}
/** Grandma's cardigan shell: an open black jacket body around the torso (origin = torso joint pivot ≈ hips). */
export function makeCardigan(scale = 1) {
  const g = new THREE.Group(); g.name = 'cardigan';
  const m = std('#1d1d22', { roughness: 0.95 }), btn = std('#e8e0d0');
  const W = 0.7 * scale, Hh = 0.66 * scale, D = 0.42 * scale, T = 0.05;
  const y = 0.3 * scale;
  g.add(box(W, Hh, T, m, 0, y, -D / 2, 0.02));                   // back
  for (const s of [-1, 1]) g.add(box(T, Hh, D, m, s * W / 2, y, 0, 0.02));
  for (const s of [-1, 1]) { g.add(box(W * 0.42, Hh, T, m, s * W * 0.29, y, D / 2, 0.02)); for (let i = 0; i < 3; i++) { const b = cyl(0.025, 0.025, 0.02, btn, 8); b.rotation.x = PI / 2; b.position.set(s * 0.06, y + 0.18 - i * 0.16, D / 2 + 0.03); g.add(b); } }
  g.add(box(W + 0.02, 0.1, D + 0.02, m, 0, y + Hh / 2 - 0.03, 0, 0.04));  // shoulders/collar
  for (const s of [-1, 1]) { const sl = box(0.2 * scale, 0.5 * scale, 0.22 * scale, m, s * (W / 2 + 0.1), y + 0.02, 0, 0.04); g.add(sl); }
  return g;
}
export function makeHelmet() {
  const g = new THREE.Group();
  const red = std('#d8231f', { roughness: 0.35 }), gold = std('#ffd23f', { metalness: 0.4, roughness: 0.3 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 10, 0, PI * 2, 0, PI / 2), red); dome.scale.set(1.0, 0.75, 1.1); g.add(dome);
  const brim = cyl(0.52, 0.56, 0.05, red, 20); brim.scale.set(1, 1, 1.25); brim.position.set(0, 0, -0.08); g.add(brim);
  const ridge = box(0.06, 0.12, 0.7, red, 0, 0.28, 0, 0.03); g.add(ridge);
  const badge = box(0.22, 0.2, 0.04, gold, 0, 0.17, 0.4, 0.03); badge.rotation.x = -0.35; g.add(badge);
  return g;
}
export function makeDoorSlab(w = 1.06, h = 2.12) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#e8232b', roughness: 0.35 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat); slab.geometry.translate(0.5, 0.5, 0); slab.castShadow = false;
  slab.position.set(-w / 2, 0.02, 0); g.add(slab);
  const drips = [];
  for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.03), mat); d.geometry.translate(0, -0.5, 0); g.add(d); drips.push(d); }
  g.userData = {
    mat,
    set(u, color = '#e8232b', wet = 1) {
      mat.color.set(color);
      const uu = clamp(u, 0, 1); slab.visible = uu > 0.001; slab.scale.set(w * Math.max(0.001, uu), h, 0.025);
      drips.forEach((d, i) => { const x = -w / 2 + (i + 0.5) * w / 5; d.visible = wet > 0 && x < -w / 2 + w * uu - 0.05; d.position.set(x, 0.3 + 0.12 * hash(i), 0.015); d.scale.y = 0.08 + 0.12 * hash(i * 3) * wet; });
    },
  };
  return g;
}

// ───────────────────────────────────────────────────────────────────────────── the new colour
export function makeSpiral(n = 360, { H = 46, R0 = 1.2, R1 = 9 } = {}) {
  const g = new THREE.Group(); g.name = 'spiral';
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const im = inst(new THREE.BoxGeometry(1, 1, 1), mat, n); g.add(im);
  const glows = [0, 1, 2].map((i) => { const s = glowSprite('#ffffff', 14, 0.5); g.add(s); return s; });
  const Z = new THREE.Matrix4().makeScale(0, 0, 0);
  g.userData = {
    im, glows,
    set(t, { rise = 1, spread = 0, scale = 1 } = {}) {
      for (let i = 0; i < n; i++) {
        const f = i / n, strand = i % 3;
        const hcur = f * H;
        if (f > rise) { im.setMatrixAt(i, Z); continue; }
        const r = lerp(R0, R1, Math.pow(f, 1.4)) * (1 + spread * 1.8 * f * f) * (0.85 + 0.3 * hash(i * 1.3));
        const a = f * 26 + strand * (2 * PI / 3) - t * 2.2;
        _p.set(Math.cos(a) * r, hcur + 0.6 * Math.sin(t * 3 + i), Math.sin(a) * r);
        _e.set(t * 2 + i, t * 1.5 + i * 0.3, 0); _q.setFromEuler(_e);
        const sz = (0.35 + 0.9 * f) * (0.7 + 0.5 * hash(i * 2.7)) * scale * (f > rise - 0.04 ? clamp((rise - f) / 0.04, 0, 1) : 1);
        _s.setScalar(Math.max(0.0001, sz)); _m4.compose(_p, _q, _s); im.setMatrixAt(i, _m4);
        _c.setHSL((f * 1.3 - t * 0.35 + strand * 0.12) % 1 + (f * 1.3 - t * 0.35 + strand * 0.12 < 0 ? 1 : 0), 0.95, 0.6); im.setColorAt(i, _c);
      }
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
      glows.forEach((s, i) => { const hh = (t * 0.3 + i / 3) % 1; s.material.color.setHSL(hh, 1, 0.6); s.position.set(0, (0.15 + i * 0.3) * H * rise, 0); s.scale.setScalar((10 + i * 8) * (0.4 + rise)); s.material.opacity = 0.45 * Math.min(1, rise * 3); });
    },
  };
  return g;
}
export function makeGreyDisc(color = '#9a9a98') {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshLambertMaterial({ color }));
  m.rotation.x = -PI / 2; m.receiveShadow = true; return m;
}
export function makeFencePost() {
  const g = new THREE.Group();
  g.add(box(0.22, 1.0, 0.22, '#f4f0e6', 0, 0.5, 0, 0.03));
  g.add(box(0.3, 0.08, 0.3, '#e0d8c8', 0, 1.02, 0, 0.02));
  return g;
}
export { textTex };
