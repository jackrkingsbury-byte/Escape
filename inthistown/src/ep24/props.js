// In This Town — Episode 24 "Word of the Day": new props.
//
//   makeSkyCrack()        jagged glowing crack for the sky, built in UNIT height (scale the root, e.g. 30).  Plane XY,
//                         faces +Z.  userData.set({ open 0..1 gap width, len 0..1 how much of the zig-zag exists (splits
//                         from the top), glow 0..2, gold 0..1 (white-gold → hot gold flare), mask bool (depth-only
//                         occluder around the gap so props with renderOrder ≥ 6 behind the plane only show through the
//                         gap) }).  userData.ear = the giant ear (child, hidden by default).
//   makeEar()             giant blocky pink ear with a gold earring ring, unit height, faces +Z (outer side).  Every
//                         mesh has renderOrder 6 (masked by the crack occluder).  userData.set(t, { wiggle, lean, swivel, glow })
//   makeLetterBlock(ch, color, fg)   toy alphabet block, 1 m cube, the letter on all six faces, soft glow.
//   makeMower()           boxy red push lawnmower (faces +Z, handle toward −Z).  userData.set(d): d < 0 intact, d ≥ 0
//                         seconds since it popped: pieces fly out toward +Z and bounce away along +X.
//   makeSpikyHair()       ridiculous tall spiky block hair with frosted tips (parent to joints.head, y = 0.56).
//   makePodium()          PRESS podium with two mics (origin bottom centre, faces +Z).
//   makeBridgeSign()      wooden post + arrow board pointing +X reading BRIDGE (origin post base, text faces +Z).
//   makeHand()            giant blocky hand in a purple star-sleeve reaching down (fingers toward −Y, palm faces +Z).
//                         unit = palm width.  userData.hold (Object3D where a pencil sits, along local X).  renderOrder 6.
//   makePencil()          yellow hex pencil, unit length along +Y (tip at +Y, eraser at −Y), origin centre.
//   makeTears(n)          pool of blue tear drops.  userData.set(t, sources [{ pos, side (unit Vector3), mode }], k)
//   makeWallClock()       ep23 clock face in a red frame (r ≈ 0.95 · scale), faces +Z.  userData.set(m, h)
//   buildCliffSet()       custom set: the end of main street — road, pavements, two houses and a lamp on a grass cliff
//                         that ends in empty air at x = 0; clouds far below; the road continues on a far cliff at x ≈ 70.
//                         anchors: sign (pavement spot for the BRIDGE sign).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, hash, canvasTexture } from '../lib/util.js';
import { std, box, cyl, sph, glowSprite, glowTex, makeCloud } from '../ep18/props.js';
import { makeClockFace } from '../ep23/props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const FONT_D = (s) => `${s}px "ITT Luckiest", "Luckiest Guy", "ITT World Display", Impact, "DejaVu Sans", sans-serif`;
const FONT_T = (s) => `900 ${s}px "ITT Nunito", "Nunito", "ITT World Text", "DejaVu Sans", sans-serif`;
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
const _tex = new Map();
const tex = (key, w, h, draw) => { if (!_tex.has(key)) _tex.set(key, canvasTexture(w, h, draw)); return _tex.get(key); };
function order(obj, k) { obj.traverse((o) => { if (o.isMesh) o.renderOrder = k; }); return obj; }

// ═════════════════════════════════════════════════════════════════════════════ sky crack
function stripGeo(nPts) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nPts * 2 * 3), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nPts * 2 * 2), 2));
  const idx = [];
  for (let i = 0; i < nPts - 1; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
  g.setIndex(idx);
  for (let i = 0; i < nPts; i++) { g.attributes.uv.setXY(i * 2, 0, i / (nPts - 1)); g.attributes.uv.setXY(i * 2 + 1, 1, i / (nPts - 1)); }
  return g;
}
function setStrip(g, A, B, z = 0, uvFromPos = false) {
  const p = g.attributes.position;
  for (let i = 0; i < A.length; i++) {
    p.setXYZ(i * 2, A[i].x, A[i].y, z); p.setXYZ(i * 2 + 1, B[i].x, B[i].y, z);
    if (uvFromPos) { g.attributes.uv.setXY(i * 2, A[i].x + 0.5, A[i].y + 0.5); g.attributes.uv.setXY(i * 2 + 1, B[i].x + 0.5, B[i].y + 0.5); }
  }
  p.needsUpdate = true; if (uvFromPos) g.attributes.uv.needsUpdate = true;
  g.computeBoundingSphere();
}
const gradTex = () => tex('crackGrad', 128, 8, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const voidTex = () => tex('crackVoid', 512, 512, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6); gr.addColorStop(0, '#3a1466'); gr.addColorStop(1, '#0b0418');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { const x = hash(i * 1.7) * w, y = hash(i * 3.1) * h, r = 0.8 + 2.6 * hash(i * 5.3); g.fillStyle = `rgba(255,${200 + Math.floor(55 * hash(i))},${230},${0.5 + 0.5 * hash(i * 7.9)})`; g.beginPath(); g.arc(x, y, r, 0, PI * 2); g.fill(); }
});
export function makeSkyCrack({ n = 12, seed = 3 } = {}) {
  const root = new THREE.Group(); root.name = 'skyCrack';
  const N = n + 1;
  const ZIG = [0, 0.55, -0.45, 0.8, -0.2, 0.65, -0.7, 0.35, -0.55, 0.6, -0.3, 0.25, 0];
  const base = Array.from({ length: N }, (_, i) => V(0.085 * (ZIG[i % ZIG.length] ?? 0) * (i === 0 || i === n ? 0 : 1), 0.5 - i / n, 0));
  const jit = Array.from({ length: N }, (_, i) => 0.75 + 0.5 * hash(i * 3.7 + seed));
  const coreM = new THREE.MeshBasicMaterial({ color: '#fff6d0', toneMapped: false, fog: false, side: THREE.DoubleSide });
  const glowM = new THREE.MeshBasicMaterial({ color: '#ffe9a0', map: gradTex(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide });
  const voidM = new THREE.MeshBasicMaterial({ map: voidTex(), fog: false, side: THREE.DoubleSide, color: '#ffffff' });
  const occM = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, fog: false, side: THREE.DoubleSide });
  const mk = (geo, m, ro) => { const o = new THREE.Mesh(geo, m); o.renderOrder = ro; o.frustumCulled = false; root.add(o); return o; };
  const interior = mk(stripGeo(N), voidM, 3);
  const coreL = mk(stripGeo(N), coreM, 8), coreR = mk(stripGeo(N), coreM, 8);
  const glowL = mk(stripGeo(N), glowM, 9), glowR = mk(stripGeo(N), glowM, 9);
  // occluder: two far strips + top/bottom caps (one geometry: 4·N + 8 vertices)
  const occGeo = new THREE.BufferGeometry();
  const nv = N * 4 + 8;
  occGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  const oi = [];
  for (const off of [0, N * 2]) for (let i = 0; i < n; i++) { const a = off + i * 2, b = a + 1, c = a + 2, d = a + 3; oi.push(a, b, c, b, d, c); }
  const c0 = N * 4; oi.push(c0, c0 + 1, c0 + 2, c0, c0 + 2, c0 + 3, c0 + 4, c0 + 5, c0 + 6, c0 + 4, c0 + 6, c0 + 7);
  occGeo.setIndex(oi);
  const occ = mk(occGeo, occM, 5);
  const glows = [0.2, 0.45, 0.7].map(() => { const s = glowSprite('#ffe6a0', 0.3, 0.6); s.renderOrder = 9; root.add(s); return s; });
  const ear = makeEar(); ear.visible = false; root.add(ear);
  ear.position.set(0, -0.02, -0.07); ear.scale.setScalar(0.42);
  const P = base.map(() => V()), L = base.map(() => V()), R = base.map(() => V()), Lo = base.map(() => V()), Ro = base.map(() => V()), Lg = base.map(() => V()), Rg = base.map(() => V());
  const nrm = base.map(() => V()), wv = new Array(N).fill(0);
  const cWhite = new THREE.Color('#fff6d0'), cGold = new THREE.Color('#ffb31a'), gWhite = new THREE.Color('#ffe9a0'), gGold = new THREE.Color('#ff9a00');
  const BIG = 1.1;
  root.userData = {
    ear, interior, occ,
    set({ open = 0, len = 1, glow = 1, gold = 0, mask = false, Wmax = 0.2 } = {}) {
      root.visible = len > 0.001;
      if (!root.visible) return;
      const sEnd = clamp(len, 0, 1) * n, i0 = Math.min(n - 1, Math.floor(sEnd)), f = sEnd - i0;
      const tip = base[i0].clone().lerp(base[Math.min(n, i0 + 1)], f);
      for (let i = 0; i < N; i++) {
        if (i > sEnd) P[i].copy(tip); else P[i].copy(base[i]);
        const reveal = clamp(sEnd / n, 0, 1);
        wv[i] = i > sEnd ? 0 : Wmax * open * Math.pow(Math.sin(PI * i / n), 0.8) * jit[i] * reveal;
      }
      for (let i = 0; i < N; i++) {
        const a = base[Math.max(0, i - 1)], b = base[Math.min(n, i + 1)];
        const tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
        nrm[i].set(-ty / l, tx / l, 0);   // tangent points down → normal points +x
      }
      const e = 0.007 + 0.004 * glow, g = 0.05 * glow + 0.02;
      for (let i = 0; i < N; i++) {
        L[i].copy(P[i]).addScaledVector(nrm[i], wv[i]); R[i].copy(P[i]).addScaledVector(nrm[i], -wv[i]);
        const ee = i > sEnd ? 0 : e * (0.5 + 0.5 * Math.sin(PI * i / n) + (i === 0 ? 0.3 : 0));
        Lo[i].copy(L[i]).addScaledVector(nrm[i], ee); Ro[i].copy(R[i]).addScaledVector(nrm[i], -ee);
        Lg[i].copy(L[i]).addScaledVector(nrm[i], i > sEnd ? 0 : g); Rg[i].copy(R[i]).addScaledVector(nrm[i], i > sEnd ? 0 : -g);
      }
      setStrip(interior.geometry, L, R, -0.16, true);
      setStrip(coreL.geometry, L, Lo, 0.004); setStrip(coreR.geometry, R, Ro, 0.004);
      setStrip(glowL.geometry, L, Lg, 0.006); setStrip(glowR.geometry, R, Rg, 0.006);
      coreM.color.copy(cWhite).lerp(cGold, gold); glowM.color.copy(gWhite).lerp(gGold, gold); glowM.opacity = clamp(0.35 + 0.3 * glow, 0, 1);
      voidM.color.set('#ffffff').lerp(new THREE.Color('#ffcc55'), gold * 0.9);
      // occluder
      occ.visible = mask;
      if (mask) {
        const p = occGeo.attributes.position;
        for (let i = 0; i < N; i++) {
          p.setXYZ(i * 2, L[i].x, L[i].y, 0); p.setXYZ(i * 2 + 1, -BIG, L[i].y, 0);
          p.setXYZ(N * 2 + i * 2, R[i].x, R[i].y, 0); p.setXYZ(N * 2 + i * 2 + 1, BIG, R[i].y, 0);
        }
        const yt = P[0].y, yb = P[n].y;
        p.setXYZ(c0, -BIG, yt, 0); p.setXYZ(c0 + 1, BIG, yt, 0); p.setXYZ(c0 + 2, BIG, BIG, 0); p.setXYZ(c0 + 3, -BIG, BIG, 0);
        p.setXYZ(c0 + 4, -BIG, yb, 0); p.setXYZ(c0 + 5, -BIG, -BIG, 0); p.setXYZ(c0 + 6, BIG, -BIG, 0); p.setXYZ(c0 + 7, BIG, yb, 0);
        p.needsUpdate = true; occGeo.computeBoundingSphere();
      }
      glows.forEach((s, k) => { const i = Math.round([0.2, 0.45, 0.7][k] * n); s.position.copy(P[i]); s.position.z = 0.01; const sc = (0.25 + 0.35 * open) * glow * (i > sEnd ? 0 : 1); s.scale.set(sc, sc * 1.6, 1); s.visible = sc > 0.001; s.material.color.copy(gWhite).lerp(gGold, gold); });
    },
  };
  root.userData.set({ open: 0, len: 1 });
  return root;
}

// ═════════════════════════════════════════════════════════════════════════════ the giant ear
export function makeEar() {
  const g = new THREE.Group(); g.name = 'ear';
  const pivot = new THREE.Group(); g.add(pivot);
  const skin = std('#ffb09e', { emissive: '#ff5a4a', emissiveIntensity: 0.22, roughness: 0.65 });
  const inner = std('#f07f78', { emissive: '#c0303a', emissiveIntensity: 0.2, roughness: 0.7 });
  const deep = std('#6a1420', { emissive: '#2a0006', emissiveIntensity: 0.3 });
  const gold = std('#ffd23f', { emissive: '#b07a00', emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.3 });
  pivot.add(box(0.6, 0.86, 0.08, skin, 0.02, 0.0, -0.05, 0.04));            // backing
  // helix rim: rounded boxes along an ellipse arc
  const cx = 0.02, cy = 0.06, rx = 0.3, ry = 0.42;
  const A0 = 165, A1 = -95, steps = 11;
  for (let k = 0; k < steps; k++) {
    const a = (A0 + (A1 - A0) * k / (steps - 1)) * PI / 180, a2 = (A0 + (A1 - A0) * (k + 1) / (steps - 1)) * PI / 180;
    const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
    const seg = Math.hypot(rx * (Math.cos(a2) - Math.cos(a)), ry * (Math.sin(a2) - Math.sin(a))) + 0.06;
    const b = box(0.13, Math.max(0.1, seg), 0.17, skin, x, y, 0.02, 0.05);
    b.rotation.z = Math.atan2(ry * Math.cos(a), -rx * Math.sin(a)) + PI / 2; pivot.add(b);
  }
  pivot.add(box(0.36, 0.5, 0.06, inner, 0.04, 0.02, 0.0, 0.04));            // concha bowl
  const ah = box(0.09, 0.4, 0.1, skin, 0.13, 0.06, 0.04, 0.03); ah.rotation.z = -0.18; pivot.add(ah);   // antihelix
  const ah2 = box(0.08, 0.24, 0.09, skin, 0.0, 0.3, 0.04, 0.03); ah2.rotation.z = 1.05; pivot.add(ah2);
  pivot.add(box(0.12, 0.13, 0.04, deep, -0.05, -0.06, 0.035, 0.02));       // canal
  pivot.add(box(0.09, 0.13, 0.12, skin, -0.2, -0.08, 0.04, 0.03));          // tragus
  pivot.add(box(0.1, 0.09, 0.1, skin, -0.02, -0.25, 0.04, 0.03));           // antitragus
  const lobe = box(0.26, 0.22, 0.12, skin, 0.05, -0.42, 0.0, 0.08); pivot.add(lobe);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 10, 28), gold); ring.position.set(0.05, -0.56, 0.05); pivot.add(ring);
  const stud = sph(0.03, gold, 10, 8); stud.position.set(0.05, -0.47, 0.07); pivot.add(stud);
  order(g, 6);
  const mats = [skin, inner];
  g.userData = {
    pivot, ring,
    /** wiggle 0..1 flaps the ear; lean 0..1 tips it toward +Z (through the crack); swivel (rad) turns it */
    set(t, { wiggle = 0, lean = 0, swivel = 0, glow = 1, twitch = 0 } = {}) {
      pivot.rotation.set(-0.55 * lean + 0.06 * twitch * Math.sin(t * 40), swivel, 0.28 * wiggle * Math.sin(t * 26) + 0.02 * Math.sin(t * 1.3));
      pivot.position.set(0, -0.06 * lean, 0.18 * lean);
      const s = 1 + 0.05 * wiggle * Math.sin(t * 13);
      pivot.scale.set(s, s, 1);
      ring.rotation.set(0, 0, 0.5 * Math.sin(t * 3) + 0.6 * wiggle * Math.sin(t * 20));
      mats[0].emissiveIntensity = 0.22 * glow; mats[1].emissiveIntensity = 0.2 * glow;
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ alphabet block
const BLOCK_COLS = { S: '#ff4fa3', K: '#ffd23f', R: '#3ee0c8', O: '#8a5cff', N: '#ff7a2f', B: '#4fb3ff', L: '#5bd65b', E: '#ff5a5a', H: '#ff4fa3', U: '#3ee0c8' };
const _blockGeo = new THREE.BoxGeometry(1, 1, 1);
export function makeLetterBlock(ch, color = BLOCK_COLS[ch] || '#ffd23f', fg = '#ffffff') {
  const t = tex('block:' + ch + color, 256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 14; g.strokeRect(20, 20, w - 40, h - 40);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const s = fit(g, ch, FONT_D, w * 0.7, 210);
    g.lineWidth = s * 0.14; g.strokeStyle = '#1d1d22'; g.lineJoin = 'round'; g.strokeText(ch, w / 2, h / 2 + s * 0.06);
    g.fillStyle = fg; g.fillText(ch, w / 2, h / 2 + s * 0.06);
  });
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.35 });
  const mesh = new THREE.Mesh(_blockGeo, m); mesh.castShadow = true; mesh.receiveShadow = true;
  const gr = new THREE.Group(); gr.add(mesh);
  const halo = glowSprite(color, 2.6, 0.45); gr.add(halo);
  gr.userData = { mesh, halo, mat: m, set(glow = 1) { m.emissiveIntensity = 0.35 * glow; halo.material.opacity = 0.45 * glow; halo.visible = glow > 0.01; } };
  return gr;
}

// ═════════════════════════════════════════════════════════════════════════════ lawnmower
export function makeMower() {
  const g = new THREE.Group(); g.name = 'mower';
  const red = std('#e8232b', { roughness: 0.45 }), red2 = std('#ff5a4a', { roughness: 0.45 }), blk = std('#1d1d22'), grey = std('#8a9099', { metalness: 0.3, roughness: 0.4 }), grn = std('#4caf50');
  const pieces = [];
  const add = (obj, size) => { g.add(obj); pieces.push({ o: obj, p0: obj.position.clone(), r0: obj.rotation.clone(), size }); return obj; };
  add(box(0.62, 0.22, 0.74, red, 0, 0.27, 0.05, 0.05), 0.22);
  add(box(0.44, 0.14, 0.42, red2, 0, 0.45, 0.1, 0.04), 0.14);
  add(box(0.26, 0.2, 0.26, grey, 0, 0.62, 0.12, 0.03), 0.2);
  for (const [x, z] of [[-0.33, 0.33], [0.33, 0.33], [-0.33, -0.25], [0.33, -0.25]]) { const w = cyl(0.12, 0.12, 0.08, blk, 14); w.rotation.z = PI / 2; w.position.set(x, 0.12, z); add(w, 0.24); }
  for (const s of [-1, 1]) { const r = box(0.04, 0.8, 0.04, grey, s * 0.24, 0.7, -0.5); r.rotation.x = -0.6; add(r, 0.04); }
  add(box(0.56, 0.05, 0.05, blk, 0, 1.03, -0.74), 0.05);
  add(box(0.44, 0.34, 0.36, grn, 0, 0.34, -0.48, 0.05), 0.34);
  pieces.forEach((pc, k) => {
    pc.v = V(1.2 + 2.6 * hash(k * 2.3), 2.0 + 2.5 * hash(k * 4.1), 0.9 + 1.8 * hash(k * 1.7));
    pc.spin = V((hash(k * 5.1) - 0.5) * 14, (hash(k * 6.7) - 0.5) * 14, (hash(k * 7.9) - 0.5) * 14);
  });
  g.userData = {
    pieces,
    set(d) {
      for (const pc of pieces) {
        if (d < 0) { pc.o.position.copy(pc.p0); pc.o.rotation.copy(pc.r0); continue; }
        const k = 1.1, s = (1 - Math.exp(-k * d)) / k;
        const x = pc.p0.x + pc.v.x * s * 1.4, z = pc.p0.z + pc.v.z * s;
        // bounces: first arc then smaller ones
        const T0 = 2 * pc.v.y / 9.8; let y;
        if (d < T0) y = pc.p0.y + pc.v.y * d - 4.9 * d * d;
        else {
          let dd = d - T0, vb = pc.v.y * 0.45; y = pc.size / 2;
          for (let m = 0; m < 8; m++) { const Tb = 2 * vb / 9.8; if (dd < Tb) { y = pc.size / 2 + vb * dd - 4.9 * dd * dd; break; } dd -= Tb; vb *= 0.5; }
        }
        pc.o.position.set(x, Math.max(pc.size / 2, y), z);
        const sp = 1 - Math.exp(-1.6 * d);
        pc.o.rotation.set(pc.r0.x + pc.spin.x * sp, pc.r0.y + pc.spin.y * sp, pc.r0.z + pc.spin.z * sp);
      }
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ spiky hair
export function makeSpikyHair() {
  const g = new THREE.Group(); g.name = 'spikyHair';
  const brown = std('#2b1d14', { roughness: 0.5 }), tip = std('#ffe14a', { roughness: 0.4, emissive: '#806000', emissiveIntensity: 0.2 });
  g.add(box(0.66, 0.12, 0.6, brown, 0, 0.02, -0.01, 0.04));
  const spots = [[-0.2, -0.17], [0, -0.19], [0.2, -0.17], [-0.22, 0.02], [0, 0], [0.22, 0.02], [-0.18, 0.2], [0.02, 0.21], [0.2, 0.19]];
  spots.forEach(([x, z], k) => {
    const h = 0.55 + 0.45 * hash(k * 3.1 + 1) + (k === 4 ? 0.35 : 0);
    const s = new THREE.Group(); s.position.set(x, 0.05, z); s.rotation.set(z * 0.9, 0, -x * 0.9); g.add(s);
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, h, 4), brown); c.position.y = h / 2; c.rotation.y = PI / 4; c.castShadow = true; s.add(c);
    const tt = new THREE.Mesh(new THREE.ConeGeometry(0.1 * 0.3, h * 0.3, 4), tip); tt.position.y = h * 0.86; tt.rotation.y = PI / 4; s.add(tt);
  });
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ podium
export function makePodium() {
  const g = new THREE.Group(); g.name = 'podium';
  const wood = std('#7a1f2b', { roughness: 0.6 }), trim = std('#ffd23f', { roughness: 0.4, metalness: 0.2 });
  g.add(box(0.85, 1.05, 0.55, wood, 0, 0.525, 0, 0.04));
  const top = box(0.95, 0.08, 0.66, wood, 0, 1.1, 0.02, 0.02); top.rotation.x = 0.18; g.add(top);
  g.add(box(0.9, 0.06, 0.6, trim, 0, 0.04, 0));
  const t = tex('podium', 512, 384, (c, w, h) => {
    c.fillStyle = '#7a1f2b'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#ffd23f'; c.lineWidth = 14; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(w / 2, 120, 72, 0, PI * 2); c.fill();
    c.fillStyle = '#7a1f2b'; c.textAlign = 'center'; c.textBaseline = 'middle'; fit(c, 'P', FONT_D, 100, 100); c.fillText('P', w / 2, 126);
    c.fillStyle = '#ffffff'; const s = fit(c, 'MAYOR', FONT_D, w * 0.8, 96); c.fillText('MAYOR', w / 2, 270 + s * 0.05);
  });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.54), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.12 }));
  lab.position.set(0, 0.58, 0.281); g.add(lab);
  for (const s of [-1, 1]) {
    const neck = cyl(0.012, 0.012, 0.42, '#2a2a30', 6); neck.position.set(s * 0.14, 1.32, 0.12); neck.rotation.set(0.5, 0, -s * 0.25); g.add(neck);
    const head = sph(0.045, '#1d1d22', 10, 8); head.position.set(s * 0.2, 1.5, 0.24); head.scale.set(1, 1.3, 1); g.add(head);
  }
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ BRIDGE sign
export function makeBridgeSign() {
  const g = new THREE.Group(); g.name = 'bridgeSign';
  const wood = std('#8a5a2e', { roughness: 0.9 });
  g.add(box(0.2, 3.2, 0.2, wood, 0, 1.6, 0, 0.04));
  const shape = new THREE.Shape();
  shape.moveTo(1.9, 0); shape.lineTo(1.2, 0.68); shape.lineTo(1.2, 0.4); shape.lineTo(-1.35, 0.4); shape.lineTo(-1.35, -0.4); shape.lineTo(1.2, -0.4); shape.lineTo(1.2, -0.68); shape.closePath();
  const ex = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  const board = new THREE.Mesh(ex, std('#ffd23f', { roughness: 0.6 })); board.position.set(0, 2.75, 0.11); board.castShadow = true; g.add(board);
  const edge = new THREE.Mesh(ex, std('#5a3a1a')); edge.scale.set(1.05, 1.14, 0.5); edge.position.set(-0.02, 2.75, 0.09); g.add(edge);
  const t = tex('bridgeTxt', 900, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2a1a0a'; const s = fit(c, 'BRIDGE', FONT_D, w - 30, 210); c.fillText('BRIDGE', w / 2, h / 2 + s * 0.06); });
  const txt = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 0.7), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8 }));
  txt.position.set(-0.05, 2.75, 0.22); g.add(txt);
  g.userData = { topY: 3.2 };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ giant hand + pencil
export function makeHand() {
  const g = new THREE.Group(); g.name = 'giantHand';
  const skin = std('#f6c9a4', { emissive: '#ff9a6a', emissiveIntensity: 0.18, roughness: 0.6 });
  const sleeve = std('#5b3fa8', { emissive: '#2a1060', emissiveIntensity: 0.3, roughness: 0.7 });
  const goldM = std('#ffd23f', { emissive: '#a06a00', emissiveIntensity: 0.6 });
  g.add(box(1.0, 1.1, 0.38, skin, 0, 0, 0, 0.1));                        // palm
  g.add(box(0.86, 0.32, 0.34, skin, 0, 0.62, -0.02, 0.1));              // wrist
  const arm = cyl(0.6, 0.62, 30, sleeve, 12); arm.position.y = 0.7 + 15; g.add(arm);
  const cuff = cyl(0.66, 0.66, 0.34, goldM, 16); cuff.position.y = 0.88; g.add(cuff);
  for (let k = 0; k < 18; k++) { const st = box(0.12, 0.12, 0.04, goldM, 0, 0, 0); const a = hash(k * 2.3) * PI * 2, y = 1.4 + hash(k * 5.1) * 12; st.position.set(Math.sin(a) * 0.62, y, Math.cos(a) * 0.62); st.rotation.set(0, a, PI / 4); g.add(st); }
  // fingers: proximal hanging down, distal curled toward +Z
  const fingers = [];
  [-0.36, -0.12, 0.12, 0.36].forEach((x, k) => {
    const len = [0.46, 0.54, 0.5, 0.4][k];
    const p = new THREE.Group(); p.position.set(x, -0.55, 0.0); g.add(p);
    p.add(box(0.22, len, 0.27, skin, 0, -len / 2, 0, 0.06));
    const d = new THREE.Group(); d.position.set(0, -len, 0); p.add(d);
    d.add(box(0.21, 0.36, 0.25, skin, 0, -0.17, 0, 0.06));
    fingers.push({ p, d });
  });
  const thumb = new THREE.Group(); thumb.position.set(-0.52, -0.2, 0.12); g.add(thumb);
  thumb.add(box(0.26, 0.5, 0.27, skin, 0, -0.25, 0, 0.07));
  const hold = new THREE.Object3D(); hold.position.set(0, -1.05, 0.36); g.add(hold);
  order(g, 6);
  g.userData = {
    hold, fingers, thumb,
    set({ curl = 1, wave = 0, t = 0 } = {}) {
      fingers.forEach((f, k) => { f.p.rotation.x = 0.55 * curl + 0.08 * wave * Math.sin(t * 6 + k); f.d.rotation.x = 1.15 * curl; });
      thumb.rotation.set(0.7 * curl, 0, -0.55 + 0.25 * curl);
    },
  };
  g.userData.set({ curl: 1 });
  return g;
}
export function makePencil() {
  const g = new THREE.Group(); g.name = 'pencil';
  const yel = std('#ffc21a', { roughness: 0.45, emissive: '#7a5000', emissiveIntensity: 0.15 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 6), yel); body.castShadow = true; g.add(body);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.061, 0.061, 0.72, 6, 1, true, 0, PI / 3), std('#e6a400')); g.add(stripe);
  const fer = cyl(0.062, 0.062, 0.07, std('#c9ccd2', { metalness: 0.6, roughness: 0.3 }), 16); fer.position.y = -0.395; g.add(fer);
  for (const y of [-0.375, -0.415]) { const r = cyl(0.064, 0.064, 0.01, std('#9aa0a8', { metalness: 0.6 }), 16); r.position.y = y; g.add(r); }
  const er = cyl(0.058, 0.058, 0.08, std('#ff7aa8', { roughness: 0.8 }), 16); er.position.y = -0.47; g.add(er);
  const woodC = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 6), std('#f2c99a')); woodC.position.y = 0.435; g.add(woodC);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 10), std('#2a2a30', { roughness: 0.3 })); lead.position.y = 0.49; g.add(lead);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ tears
export function makeTears(n = 48) {
  const g = new THREE.Group(); g.name = 'tears';
  const m = new THREE.MeshBasicMaterial({ color: '#59c6ff', fog: false });
  const geo = new THREE.SphereGeometry(0.035, 8, 6);
  const im = new THREE.InstancedMesh(geo, m, n); im.frustumCulled = false; g.add(im);
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  g.userData = {
    /** sources: [{ pos: eye point, side: outward horizontal unit vector, mode: 'stream' | 'fountain', rate }] */
    set(t, sources, k = 1) {
      let c = 0;
      const per = sources.length ? Math.floor(n / sources.length) : 0;
      sources.forEach((src, si) => {
        for (let j = 0; j < per && c < n; j++, c++) {
          const rate = src.rate ?? 1.6;
          const u = ((t * rate + j / per + hash(si * 3.3)) % 1 + 1) % 1;
          if (src.mode === 'fountain') {
            p.copy(src.pos).addScaledVector(src.side, 0.15 + 0.9 * u); p.y += 0.55 * u - 1.6 * u * u;
            s.set(1, 1.3, 1).multiplyScalar(k * (1.3 - 0.4 * u));
          } else {
            p.copy(src.pos).addScaledVector(src.side, 0.03 + 0.04 * u); p.y -= 0.05 + 0.75 * u * u;
            p.addScaledVector(src.fwd || V(), 0.04);
            s.set(0.8, 1.4, 0.8).multiplyScalar(k * (1 - 0.3 * u));
          }
          M4.compose(p, q, s); im.setMatrixAt(c, M4);
        }
      });
      for (; c < n; c++) im.setMatrixAt(c, Z);
      im.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ wall clock
export function makeWallClock() {
  const g = new THREE.Group(); g.name = 'wallClock';
  const face = makeClockFace(); g.add(face);
  if (face.userData.glow) face.userData.glow.visible = false;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.1, 10, 40), std('#e8232b', { roughness: 0.5 })); rim.position.z = 0.02; g.add(rim);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 32), std('#c01c24')); back.rotation.x = PI / 2; back.position.z = -0.05; g.add(back);
  g.userData = { face, set(m, h) { face.userData.set(m, h); } };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ the cliff set (end of the road)
function simpleHouse(wall, roof, w = 6, d = 5, h = 4.6) {
  const g = new THREE.Group();
  g.add(box(w, h, d, wall, 0, h / 2, 0, 0.08));
  // gable roof as an extruded triangle along X
  const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.35, 0); sh.lineTo(0, d * 0.45); sh.lineTo(d / 2 + 0.35, 0); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: w + 0.4, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.4) / 2);
  const roofM = new THREE.Mesh(rg, std(roof)); roofM.rotation.y = PI / 2; roofM.position.y = h; roofM.castShadow = true; g.add(roofM);
  g.add(box(1.1, 2.0, 0.08, '#7a1f2b', 0, 1.0, d / 2 + 0.02));
  for (const x of [-1.8, 1.8]) for (const y of [1.6, 3.4]) g.add(box(1.0, 0.9, 0.06, std('#a7d3f0', { emissive: '#5a8ab0', emissiveIntensity: 0.2 }), x, y, d / 2 + 0.03));
  g.add(box(w + 0.1, 0.4, d + 0.1, '#8c7b6b', 0, 0.2, 0));
  return g;
}
function cliffTree(s = 1, seed = 1) {
  const g = new THREE.Group();
  const t = cyl(0.18 * s, 0.24 * s, 1.6 * s, '#6b4a2f', 8); t.position.y = 0.8 * s; g.add(t);
  const c = sph(1.3 * s, std(['#3c8f45', '#4caf50', '#2f7d3a'][seed % 3], { flatShading: true }), 8, 6); c.position.y = 2.4 * s; c.scale.y = 1.1; g.add(c);
  return g;
}
export function buildCliffSet() {
  const root = new THREE.Group(); root.name = 'cliffSet';
  const background = new THREE.Color('#9fd3ff');
  const fog = new THREE.Fog('#cfe8ff', 70, 320);
  // gradient sky sphere
  const sg = new THREE.SphereGeometry(380, 32, 16);
  const col = []; const top = new THREE.Color('#2a7fe0'), mid = new THREE.Color('#7fbcf2'), hor = new THREE.Color('#e4f4ff'), c = new THREE.Color();
  for (let i = 0; i < sg.attributes.position.count; i++) { const y = sg.attributes.position.getY(i) / 380; if (y > 0) c.copy(hor).lerp(mid, Math.min(1, y / 0.25)).lerp(top, clamp((y - 0.2) / 0.7, 0, 1)); else c.copy(hor).lerp(new THREE.Color('#bfe0f5'), clamp(-y / 0.3, 0, 1)); col.push(c.r, c.g, c.b); }
  sg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const sky = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -1; root.add(sky);
  // lights
  const hemi = new THREE.HemisphereLight('#d8ecff', '#7a9a5a', 1.5); root.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.8); sun.position.set(-25, 40, 30); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 120 }); sun.shadow.bias = -0.0008;
  root.add(sun); root.add(sun.target); sun.target.position.set(-4, 0, 0);
  // near cliff block: grass top, rock body; edge at x = 0
  const grass = box(80, 0.6, 90, '#4caf50', -40, -0.3, 0); grass.receiveShadow = true; root.add(grass);
  const rock = box(80, 60, 90, std('#8a8378', { roughness: 1, flatShading: true }), -40.2, -30.6, 0); root.add(rock);
  for (let k = 0; k < 14; k++) { const b = box(2 + 3 * hash(k * 2.1), 2 + 4 * hash(k * 3.3), 3 + 4 * hash(k * 1.9), std(k % 2 ? '#7a7368' : '#958d80', { flatShading: true }), 0.2 + 0.8 * hash(k * 4.4), -3 - 40 * hash(k * 5.5), -40 + 80 * hash(k * 6.6)); b.rotation.set(hash(k) * 0.4, hash(k * 2) * 0.6, hash(k * 3) * 0.3); root.add(b); }
  // road (along X, ending at x = 0), pavements, dashes
  const road = box(70, 0.06, 9, '#3a3d46', -35, 0.03, 0); road.receiveShadow = true; root.add(road);
  for (const s of [-1, 1]) { const pv = box(70, 0.14, 3, '#b9b4ad', -35, 0.07, s * 6); pv.receiveShadow = true; root.add(pv); const cb = box(70, 0.16, 0.2, '#9d978f', -35, 0.08, s * 4.6); root.add(cb); }
  for (let x = -66; x < -1; x += 4) root.add(box(2, 0.012, 0.18, '#f4f1e6', x, 0.065, 0));
  // broken edge chunks + crumbs falling
  for (let k = 0; k < 9; k++) { const z = -7 + k * 1.75; const b = box(0.7 + 0.6 * hash(k * 1.3), 0.5 + 0.4 * hash(k * 2.7), 1.6, std(Math.abs(z) < 4.5 ? '#3a3d46' : '#b9b4ad', { flatShading: true }), 0.25 + 0.3 * hash(k * 3.1), -0.25, z); b.rotation.set(0, 0, -0.2 - 0.3 * hash(k * 4.3)); root.add(b); }
  // stub of the bridge railing
  for (const s of [-1, 1]) { root.add(box(0.25, 1.2, 0.25, '#d8d2c8', -0.4, 0.6, s * 4.4)); const rail = box(1.4, 0.16, 0.16, '#d8d2c8', 0.1, 1.1, s * 4.4); rail.rotation.z = -0.25; root.add(rail); }
  // houses, trees, lamp
  const h1 = simpleHouse('#f3e3a5', '#b5543f'); h1.position.set(-15, 0, -12); root.add(h1);
  const h2 = simpleHouse('#c9e4f2', '#4a5d7e', 6.5, 5, 5.2); h2.position.set(-25, 0, -12.2); root.add(h2);
  const h3 = simpleHouse('#f2c4c4', '#3f7a5a', 6, 5, 4.4); h3.position.set(-18, 0, 12.5); h3.rotation.y = PI; root.add(h3);
  for (const [x, z, s, k] of [[-7, -10.5, 1.0, 0], [-8, 11, 0.9, 1], [-31, -11, 1.1, 2], [-4, -14, 1.2, 1]]) { const t = cliffTree(s, k); t.position.set(x, 0, z); root.add(t); }
  const lamp = new THREE.Group(); { const pole = cyl(0.08, 0.1, 4.2, '#2f3440', 8); pole.position.y = 2.1; lamp.add(pole); } lamp.add(box(0.5, 0.35, 0.5, '#2f3440', 0, 4.35, 0, 0.05)); lamp.add(box(0.36, 0.12, 0.36, std('#fff4c0', { emissive: '#ffe08a', emissiveIntensity: 0.6 }), 0, 4.15, 0)); lamp.position.set(-9, 0.14, 5.4); root.add(lamp);
  // far cliff with the road continuing
  const far = new THREE.Group(); far.position.set(78, 0, -6); root.add(far);
  far.add(box(40, 0.6, 60, '#4caf50', 20, -0.3, 0)); far.add(box(40, 60, 60, std('#8a8378', { flatShading: true }), 20.2, -30.6, 0));
  far.add(box(40, 0.06, 9, '#3a3d46', 20, 0.03, 6));
  const fh = simpleHouse('#cbbfe6', '#b5543f'); fh.position.set(14, 0, -6); far.add(fh);
  const ft = cliffTree(1.3, 2); ft.position.set(6, 0, -2); far.add(ft);
  // clouds far below and around
  for (let k = 0; k < 12; k++) { const cl = makeCloud(k + 3, 2.4 + 2.5 * hash(k * 1.3), { emissive: '#ffffff', ei: 0.25 }); cl.position.set(8 + 90 * hash(k * 2.2), -26 - 14 * hash(k * 3.3), -50 + 100 * hash(k * 4.4)); root.add(cl); }
  for (let k = 0; k < 5; k++) { const cl = makeCloud(k + 31, 3 + 2 * hash(k * 7.1), { emissive: '#ffffff', ei: 0.3 }); cl.position.set(40 + 60 * hash(k * 5.2), 22 + 18 * hash(k * 1.9), -70 - 40 * hash(k * 2.8)); root.add(cl); }
  root.traverse((o) => { if (o.isMesh && o !== sky) { o.castShadow = o.castShadow && o.position.y > -2; } });
  const anchors = {};
  const sgn = new THREE.Object3D(); sgn.position.set(-1.6, 0.14, -5.8); root.add(sgn); anchors['cliff.sign'] = sgn;
  return {
    root, background, fog, anchors, options: {}, info: { kind: 'cliff' },
    setLighting() {}, set() {}, update() {},
  };
}
