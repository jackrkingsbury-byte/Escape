// Episode 9 ("The Heist") props. Same conventions as src/props.js (SPEC.md §2/§7): ES module, metres, Y up,
// deterministic (no Math.random / clocks); animated things are pure functions of the t / u passed in.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   dressBurglar(ch)            adds the eye mask (black band with eye holes), black beanie and white jumper stripes
//                               to a makeCharacter() figure (meshes parented to joints.head / joints.torso).
//   makeCrowbar()               thin black bar, 0.8 long, bent hook at the top. Origin = bottom tip, long axis +Y.
//   makeFlashlight()            → { root, setOn(k) }  body along +Z (beam direction), origin = grip centre; soft additive cone.
//   makeOffice()                small box building 3.2 × 3.0 × 3.0 with a dark doorway (1.1 × 1.5) and an OFFICE sign. Front +Z.
//   makeTV()                    → { root, update(t) }  0.62 × 0.42 telly on little feet, emissive screen. Origin bottom centre.
//   makeJewelBox()              → { root, update(t) }  small gold box, lid open, sparkle dots twinkle. Origin bottom centre.
//   makeCorkboard()             1.1 × 1.45 corkboard (one canvas): party flyers joined by red string, red X over ELECTION.
//                               Plane in XY facing +Z, origin = centre.
//   makeDoormat()               0.95 × 0.03 × 0.55 WELCOME mat, text readable from +Z side. Origin bottom centre.
//   makeCatFlapDoor()           → { root, flap, hole }  door 1.2 × 2.2 × 0.1 with a 0.78 × 0.72 hole at the bottom and a
//                               hinged flap (flap.rotation.x). Origin bottom centre, faces +Z.
//   makeHeart()                 pink heart sprite (~0.25). makeZzz(size) "Z z Z" sprite.
//   makePuff({ color, count })  → { root, update(u) }  instanced puff spheres bursting out (u 0..1; hidden outside).
//   makeRing()                  → { root, update(u) }  flat shockwave ring on the ground expanding / fading.
//   makeBeds(n, { names })      → { root, set(i, pos, quat), bedTop: 0.5, count }  instanced simple beds (headboard at −Z,
//                               long axis Z, foot +Z), optional name sign on each bed's +X long side.
//   makeDuvet()                 → { root, setCover(z) }  duvet that covers the bed from the foot (+1.0) to z.
//   makeFoamHeap(w, d, h, n)    → { root, update(t) }   instanced foam blobs heaped over a w × d rectangle.
//   makePillowHeap()            pink cushion heap (instanced rounded boxes) ~1.0 × 0.6 × 1.6. Origin bottom centre.
//   makeLimboPillow()           striped bar 1.0 long lying along X. Origin centre.
//   makePapers()                stack of papers 0.3 × 0.16 × 0.22. Origin bottom centre.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { hash, clamp, canvasTexture } from '../lib/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const FONT = '"Luckiest Guy", "ITT World Display", "DejaVu Sans", Arial, sans-serif';
const FONTB = '900 {s}px "Nunito", "ITT World Text", "DejaVu Sans", Arial, sans-serif';
const fontB = (s) => FONTB.replace('{s}', s);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
function boxMesh(w, h, d, mat, x = 0, y = 0, z = 0, r = 0) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}

// ───────────────────────────────────────────────────────────────────────────── burglar dress-up
const HEAD_W = 0.64, HEAD_H = 0.58, HEAD_D = 0.56, EYE_Y = 0.285 + 0.027;
export function dressBurglar(ch) {
  const blk = M('#0d0d10', { roughness: 0.45 });
  const g = new THREE.Group(); g.name = 'burglarMask';
  const fz = HEAD_D / 2 + 0.012, H = 0.15;
  g.add(boxMesh(HEAD_W + 0.03, 0.03, 0.025, blk, 0, EYE_Y + 0.062, fz));       // top bar
  g.add(boxMesh(HEAD_W + 0.03, 0.028, 0.025, blk, 0, EYE_Y - 0.061, fz));      // bottom bar
  for (const s of [-1, 1]) g.add(boxMesh(0.125, H, 0.025, blk, s * 0.27, EYE_Y, fz));   // outer cheeks
  g.add(boxMesh(0.085, H, 0.025, blk, 0, EYE_Y, fz));                          // bridge
  for (const s of [-1, 1]) g.add(boxMesh(0.02, H, HEAD_D, blk, s * (HEAD_W / 2 + 0.012), EYE_Y, 0));
  g.add(boxMesh(HEAD_W + 0.03, H, 0.02, blk, 0, EYE_Y, -HEAD_D / 2 - 0.012));
  g.add(boxMesh(0.08, 0.07, 0.05, blk, 0.04, EYE_Y, -HEAD_D / 2 - 0.04));       // knot
  for (const [x, r] of [[0.07, 0.35], [0.0, -0.2]]) { const t = boxMesh(0.045, 0.17, 0.02, blk, x, EYE_Y - 0.1, -HEAD_D / 2 - 0.05); t.rotation.z = r; g.add(t); }
  ch.joints.head.add(g);
  const bm = M('#1b1c24', { roughness: 0.95 });
  const b = new THREE.Group(); b.name = 'beanie';
  b.add(boxMesh(HEAD_W + 0.05, 0.24, HEAD_D + 0.05, bm, 0, HEAD_H - 0.02, 0, 0.09));
  b.add(boxMesh(HEAD_W + 0.075, 0.085, HEAD_D + 0.075, M('#2a2b36', { roughness: 0.95 }), 0, HEAD_H - 0.1, 0, 0.035));
  b.add(boxMesh(0.12, 0.08, 0.12, bm, 0, HEAD_H + 0.12, 0, 0.035));
  ch.joints.head.add(b);
  const wm = M('#f2f2f2', { roughness: 0.85 });
  const st = new THREE.Group(); st.name = 'stripes';
  for (const y of [0.1, 0.22, 0.34]) st.add(boxMesh(0.596, 0.052, 0.356, wm, 0, y, 0, 0.02));
  ch.joints.torso.add(st);
  for (const side of ['armL', 'armR']) {
    const a = ch.joints[side]; if (!a) continue;
    const s = new THREE.Group();
    for (const y of [-0.12, -0.24]) s.add(boxMesh(0.175, 0.045, 0.185, wm, 0, y, 0, 0.015));
    a.add(s);
  }
  return ch;
}

// ───────────────────────────────────────────────────────────────────────────── small props
export function makeCrowbar() {
  const g = new THREE.Group();
  const m = M('#1a1a1e', { roughness: 0.35, metalness: 0.3 });
  const red = M('#c0392b', { roughness: 0.5 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 10), m); bar.position.y = 0.36; bar.castShadow = true; g.add(bar);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 10), red); grip.position.y = 0.2; g.add(grip);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16, Math.PI * 1.1), m);
  hook.position.set(0.06, 0.72, 0); hook.rotation.set(0, 0, 0); g.add(hook);
  const claw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.03), m); claw.position.set(0.0, 0.0, 0.015); claw.rotation.z = 0.5; g.add(claw);
  return g;
}

let _coneTex = null;
export function makeFlashlight() {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 12), M('#2d2f38', { roughness: 0.4, metalness: 0.4 }));
  body.rotation.x = Math.PI / 2; root.add(body);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.034, 0.07, 14), M('#3a3d48', { roughness: 0.35, metalness: 0.4 }));
  head.rotation.x = Math.PI / 2; head.position.z = 0.12; root.add(head);
  const lensM = new THREE.MeshBasicMaterial({ color: '#fffbe8' });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), lensM); lens.position.z = 0.156; root.add(lens);
  _coneTex ??= canvasTexture(64, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,250,225,0)'); gr.addColorStop(1, 'rgba(255,250,225,1)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const coneM = new THREE.MeshBasicMaterial({ map: _coneTex, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.42, 1.1, 20, 1, true), coneM);
  cone.rotation.x = Math.PI / 2; cone.position.z = 0.16 + 0.55; cone.renderOrder = 3; root.add(cone);
  return { root, cone, setOn(k) { cone.visible = k > 0; coneM.opacity = 0.38 * k; lensM.color.set(k > 0 ? '#fffbe8' : '#555555'); } };
}

export function makeOffice() {
  const g = new THREE.Group();
  const wall = M('#d8cdb8'), trim = M('#7a6a58');
  const W = 3.2, H = 3.0, D = 3.0, dw = 1.1, dh = 1.5;
  g.add(boxMesh((W - dw) / 2, H, D, wall, -(W + dw) / 4, H / 2, 0));
  g.add(boxMesh((W - dw) / 2, H, D, wall, (W + dw) / 4, H / 2, 0));
  g.add(boxMesh(dw, H - dh, D, wall, 0, dh + (H - dh) / 2, 0));
  const inside = boxMesh(dw, dh, 0.05, new THREE.MeshBasicMaterial({ color: '#0b0b10' }), 0, dh / 2, -D / 2 + 0.3); g.add(inside);
  g.add(boxMesh(W + 0.2, 0.18, D + 0.2, trim, 0, H + 0.09, 0));
  g.add(boxMesh(dw + 0.16, 0.1, 0.12, trim, 0, dh + 0.05, D / 2 + 0.02));
  for (const s of [-1, 1]) g.add(boxMesh(0.08, dh, 0.12, trim, s * (dw / 2 + 0.04), dh / 2, D / 2 + 0.02));
  for (const s of [-1, 1]) {   // windows
    const w = boxMesh(0.6, 0.55, 0.04, M('#9fd3f0', { emissive: '#3a6a8a', emissiveIntensity: 0.3, roughness: 0.2 }), s * 1.15, 1.9, D / 2 + 0.01); g.add(w);
  }
  const tex = canvasTexture(512, 160, (c, w, h) => {
    c.fillStyle = '#1d3a8a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffd23f'; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14);
    c.fillStyle = '#ffffff'; c.font = fontB(118); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('OFFICE', w / 2, h / 2 + 6);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25 }));
  sign.position.set(0, H + 0.6, D / 2 - 0.2); g.add(sign);
  g.add(boxMesh(2.5, 0.85, 0.06, trim, 0, H + 0.6, D / 2 - 0.25));
  g.userData = { door: V(0, 0, D / 2), depth: D };
  return g;
}

export function makeTV() {
  const root = new THREE.Group();
  root.add(boxMesh(0.66, 0.46, 0.16, M('#202228', { roughness: 0.5 }), 0, 0.29, 0, 0.03));
  for (const s of [-1, 1]) root.add(boxMesh(0.06, 0.06, 0.12, M('#202228'), s * 0.22, 0.03, 0));
  const tex = canvasTexture(256, 176, (c, w, h) => {
    const cols = ['#ffffff', '#ffd23f', '#3ee0c8', '#5bd65b', '#ff4fa3', '#e8232b', '#4fb3ff'];
    cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(i * w / 7, 0, w / 7 + 1, h * 0.72); });
    c.fillStyle = '#1d1d22'; c.fillRect(0, h * 0.72, w, h); c.fillStyle = '#ffffff'; c.font = fontB(30); c.textAlign = 'center'; c.fillText('TELLY', w / 2, h * 0.9);
  });
  const sm = new THREE.MeshBasicMaterial({ map: tex });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.37), sm); scr.position.set(0, 0.29, 0.082); root.add(scr);
  return { root, update(t) { const k = 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7.3); sm.color.setScalar(k); } };
}

export function makeJewelBox() {
  const root = new THREE.Group();
  const gold = M('#e8b730', { roughness: 0.3, metalness: 0.5, emissive: '#5a3a00', emissiveIntensity: 0.4 });
  root.add(boxMesh(0.22, 0.1, 0.15, gold, 0, 0.05, 0, 0.012));
  root.add(boxMesh(0.2, 0.02, 0.13, M('#7a1f2b'), 0, 0.1, 0));
  const lid = boxMesh(0.22, 0.03, 0.15, gold, 0, 0, 0.075, 0.01); const lp = new THREE.Group(); lp.position.set(0, 0.105, -0.075); lid.position.set(0, 0.015, 0.075); lp.add(lid); lp.rotation.x = -1.2; root.add(lp);
  const gems = []; const cols = ['#ffffff', '#ff4fa3', '#4fb3ff', '#5bd65b', '#ffffff', '#ffd23f'];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.MeshBasicMaterial({ color: cols[i % cols.length] });
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.022, 0), m);
    s.position.set((hash(i * 3.1) - 0.5) * 0.16, 0.12 + hash(i * 1.7) * 0.03, (hash(i * 5.3) - 0.5) * 0.1); root.add(s); gems.push(s);
  }
  const sparks = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), new THREE.MeshBasicMaterial({ color: '#fffbe0' }));
    s.scale.set(0.3, 1.6, 0.3); root.add(s); sparks.push(s);
  }
  return {
    root, update(t) {
      sparks.forEach((s, i) => {
        const ph = (t * 1.7 + hash(i * 2.9)) % 1; const k = Math.sin(Math.PI * clamp(ph / 0.5, 0, 1));
        s.visible = k > 0.05; s.scale.set(0.3 * k + 0.01, 1.6 * k + 0.01, 0.3 * k + 0.01);
        s.position.set((hash(i * 7.7) - 0.5) * 0.3, 0.16 + hash(i * 4.4) * 0.12, (hash(i * 9.1) - 0.5) * 0.14);
        s.rotation.z = 0.785 * (i % 2);
      });
    },
  };
}

export function makeCorkboard() {
  const W = 1.1, H = 1.45;
  const tex = canvasTexture(660, 870, (c, w, h) => {
    c.fillStyle = '#b5844f'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) { c.fillStyle = hash(i * 1.3) > 0.5 ? 'rgba(90,55,25,0.35)' : 'rgba(230,190,130,0.3)'; c.fillRect(hash(i * 2.7) * w, hash(i * 5.1) * h, 3, 3); }
    c.strokeStyle = '#6b4424'; c.lineWidth = 26; c.strokeRect(13, 13, w - 26, h - 26);
    const fly = [
      ['CHESS\nMATCH', 120, 130, '#fff4b0', -0.06], ['BINGO\nFINAL', 470, 150, '#bfe9ff', 0.07], ['STARING\nCONTEST', 300, 330, '#ffd0e4', 0.04],
      ['FREEZE\nDANCE', 120, 520, '#d6f5c4', -0.05], ['FANCY\nDINNER', 500, 470, '#ffe0b0', 0.05], ['LIMBO', 160, 740, '#e6d6ff', 0.06], ['ELECTION', 470, 720, '#ffffff', -0.04],
    ];
    const pts = fly.map((f) => [f[1], f[2]]);
    c.strokeStyle = '#d0141e'; c.lineWidth = 6;
    const order = [0, 2, 1, 4, 2, 3, 5, 6, 4, 0, 3];
    c.beginPath(); order.forEach((k, i) => { const [x, y] = pts[k]; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke();
    for (const [txt, x, y, col, r] of fly) {
      c.save(); c.translate(x, y); c.rotate(r);
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-95, -64, 200, 138);
      c.fillStyle = col; c.fillRect(-100, -70, 200, 138);
      c.fillStyle = '#1d1d22'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const ls = txt.split('\n'); const fs = ls.some((l) => l.length > 7) ? 40 : 50; c.font = fontB(fs);
      ls.forEach((l, i) => c.fillText(l, 0, (i - (ls.length - 1) / 2) * fs * 1.05));
      c.restore();
      c.fillStyle = '#e8232b'; c.beginPath(); c.arc(x, y - 60, 11, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = '#e8001a'; c.lineWidth = 22; c.lineCap = 'round';
    c.beginPath(); c.moveTo(365, 640); c.lineTo(580, 800); c.moveTo(580, 640); c.lineTo(365, 800); c.stroke();
  });
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25 }));
  p.position.z = 0.012; g.add(p);
  g.add(boxMesh(W + 0.02, H + 0.02, 0.02, M('#4a2e18'), 0, 0, 0));
  return g;
}

export function makeDoormat() {
  const tex = canvasTexture(512, 300, (c, w, h) => {
    c.fillStyle = '#8a5a2b'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#3b2412'; c.lineWidth = 18; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = '#2a170a'; c.font = fontB(104); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('WELCOME', w / 2, h / 2 + 6);
  });
  const g = new THREE.Group();
  const mats = [M('#7a4e24'), M('#7a4e24'), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.15 }), M('#7a4e24'), M('#7a4e24'), M('#7a4e24')];
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.03, 0.55), mats); m.position.y = 0.015; m.receiveShadow = true; g.add(m);
  return g;
}

export function makeCatFlapDoor() {
  const g = new THREE.Group();
  const W = 1.2, H = 2.2, D = 0.1, hw = 0.78, hh = 0.72, hy = 0.06;
  const dm = M('#2f6b4a', { roughness: 0.6 }), tr = M('#efe6d2');
  g.add(boxMesh((W - hw) / 2, H, D, dm, -(W + hw) / 4, H / 2, 0));
  g.add(boxMesh((W - hw) / 2, H, D, dm, (W + hw) / 4, H / 2, 0));
  g.add(boxMesh(hw, H - hh - hy, D, dm, 0, hy + hh + (H - hh - hy) / 2, 0));
  g.add(boxMesh(hw, hy, D, dm, 0, hy / 2, 0));
  // frame round the hole
  g.add(boxMesh(hw + 0.08, 0.05, D + 0.03, tr, 0, hy + hh + 0.025, 0));
  for (const s of [-1, 1]) g.add(boxMesh(0.04, hh, D + 0.03, tr, s * (hw / 2 + 0.02), hy + hh / 2, 0));
  const flapPivot = new THREE.Group(); flapPivot.position.set(0, hy + hh, D / 2 + 0.02); g.add(flapPivot);
  const flap = boxMesh(hw - 0.03, hh - 0.02, 0.025, M('#c8d4dc', { roughness: 0.3, transparent: true, opacity: 0.85 }), 0, -(hh - 0.02) / 2, 0); flapPivot.add(flap);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M('#ffd23f', { metalness: 0.4, roughness: 0.3 })); knob.position.set(0.42, 1.1, D / 2 + 0.04); g.add(knob);
  g.add(boxMesh(0.5, 0.6, 0.02, tr, 0, 1.65, D / 2 + 0.005));
  return { root: g, flap: flapPivot, holeCenter: V(0, hy + hh / 2, 0) };
}

const _spriteTex = new Map();
function spriteTex(key, w, h, draw) { if (!_spriteTex.has(key)) _spriteTex.set(key, canvasTexture(w, h, draw)); return _spriteTex.get(key); }
export function makeHeart() {
  const tex = spriteTex('heart', 128, 128, (c) => {
    c.clearRect(0, 0, 128, 128);
    c.beginPath(); c.moveTo(64, 112); c.bezierCurveTo(6, 72, 8, 22, 40, 18); c.bezierCurveTo(56, 16, 64, 30, 64, 38); c.bezierCurveTo(64, 30, 72, 16, 88, 18); c.bezierCurveTo(120, 22, 122, 72, 64, 112);
    c.fillStyle = '#ff5fa8'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#ffffff'; c.stroke();
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(0.25, 0.25, 1); return s;
}
export function makeZzz(size = 0.6) {
  const tex = spriteTex('zzz', 256, 256, (c) => {
    c.clearRect(0, 0, 256, 256); c.font = '110px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for (const [t, x, y, s] of [['Z', 70, 190, 1], ['z', 140, 120, 0.75], ['Z', 200, 60, 0.6]]) {
      c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 16; c.strokeStyle = '#1d1d22'; c.strokeText(t, 0, 0); c.fillStyle = '#ffffff'; c.fillText(t, 0, 0); c.restore();
    }
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(size, size, 1); s.renderOrder = 5; return s;
}

const _sph = new THREE.IcosahedronGeometry(1, 1);
export function makePuff({ color = '#cfc6b6', count = 18, radius = 1, seed = 1 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.9 });
  const im = new THREE.InstancedMesh(_sph, mat, count); im.frustumCulled = false;
  const root = new THREE.Group(); root.add(im);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V();
  const dirs = Array.from({ length: count }, (_, i) => { const a = hash(i * 1.9 + seed) * Math.PI * 2, e = (hash(i * 3.7 + seed) - 0.2) * 1.2; return V(Math.cos(a) * Math.cos(e), Math.sin(e) + 0.3, Math.sin(a) * Math.cos(e)); });
  return {
    root, update(u) {
      root.visible = u > 0 && u < 1;
      if (!root.visible) return;
      const k = 1 - Math.pow(1 - u, 3);
      dirs.forEach((d, i) => {
        p.copy(d).multiplyScalar(radius * (0.25 + 0.9 * k)); p.y += radius * 0.5 * u;
        const r = radius * (0.18 + 0.22 * hash(i * 5.3 + seed)) * (0.6 + 0.8 * k) * (1 - 0.6 * u * u);
        s.setScalar(Math.max(0.001, r)); m4.compose(p, q, s); im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true; mat.opacity = 0.95 * (1 - u * u);
    },
  };
}

export function makeRing() {
  const mat = new THREE.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64), mat); m.rotation.x = -Math.PI / 2; m.renderOrder = 4;
  const root = new THREE.Group(); root.add(m);
  return { root, update(u) { root.visible = u > 0 && u < 1; const r = 0.5 + 14 * u; m.scale.set(r, r, r); mat.opacity = 0.85 * (1 - u); } };
}

// ───────────────────────────────────────────────────────────────────────────── beds
const BLANKETS = ['#3f5fb5', '#e8412c', '#5bd65b', '#ff4fa3', '#ffd23f', '#8a5cff', '#3ee0c8', '#ff7a2f', '#4fb3ff', '#c0392b'];
const _signTex = new Map();
function nameTex(name) {
  if (_signTex.has(name)) return _signTex.get(name);
  const t = canvasTexture(320, 120, (c, w, h) => {
    c.fillStyle = '#fff6dc'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a1f2b'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
    c.fillStyle = '#1d1d22'; let fs = 74; c.font = fontB(fs); while (c.measureText(name).width > w - 30 && fs > 30) { fs -= 4; c.font = fontB(fs); }
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, w / 2, h / 2 + 4);
  });
  _signTex.set(name, t); return t;
}
export function makeBeds(n, { names = null, seed = 1 } = {}) {
  const root = new THREE.Group();
  const parts = [
    [new THREE.BoxGeometry(1.0, 0.3, 2.05).translate(0, 0.17, 0), M('#9c6b43')],                // frame
    [new RoundedBoxGeometry(0.94, 0.2, 1.95, 2, 0.05).translate(0, 0.4, 0), M('#f4f1ea')],     // mattress
    [new RoundedBoxGeometry(0.62, 0.13, 0.36, 2, 0.05).translate(0, 0.55, -0.72), M('#ffffff')], // pillow
    [new THREE.BoxGeometry(1.06, 0.8, 0.08).translate(0, 0.4, -1.03), M('#7d5232')],          // headboard
    [new THREE.BoxGeometry(1.06, 0.5, 0.07).translate(0, 0.25, 1.03), M('#7d5232')],          // footboard
  ];
  const blanketGeo = new RoundedBoxGeometry(1.0, 0.08, 1.35, 2, 0.03).translate(0, 0.52, 0.3);
  const ims = parts.map(([geo, mat]) => { const im = new THREE.InstancedMesh(geo, mat, n); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; root.add(im); return im; });
  const bl = new THREE.InstancedMesh(blanketGeo, M('#ffffff'), n); bl.castShadow = true; bl.frustumCulled = false; root.add(bl); ims.push(bl);
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) { col.set(BLANKETS[(i * 7 + seed) % BLANKETS.length]); bl.setColorAt(i, col); }
  bl.instanceColor.needsUpdate = true;
  const signs = [];
  if (names) for (let i = 0; i < n; i++) {
    const nm = names[i % names.length];
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.23), new THREE.MeshStandardMaterial({ map: nameTex(nm), roughness: 0.7, emissive: '#ffffff', emissiveMap: nameTex(nm), emissiveIntensity: 0.3 }));
    root.add(s); signs.push(s);
  }
  const m4 = new THREE.Matrix4(), one = V(1, 1, 1), sl = V(0.535, 0.2, 0), sq = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI / 2);
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    root, count: n, bedTop: 0.5, ims, signs,
    set(i, pos, quat, scale = 1) {
      if (!pos) { ims.forEach((im) => im.setMatrixAt(i, hidden)); if (signs[i]) signs[i].visible = false; }
      else {
        m4.compose(pos, quat, one.set(scale, scale, scale)); ims.forEach((im) => im.setMatrixAt(i, m4));
        if (signs[i]) { const s = signs[i]; s.visible = true; s.position.copy(sl).multiplyScalar(scale).applyQuaternion(quat).add(pos); s.quaternion.copy(quat).multiply(sq); s.scale.setScalar(scale); }
      }
      ims.forEach((im) => { im.instanceMatrix.needsUpdate = true; });
    },
  };
}
export function makeDuvet(color = '#ffd23f') {
  const root = new THREE.Group();
  const m = boxMesh(1.04, 0.1, 1, M(color, { roughness: 0.9 }), 0, 0, 0, 0.04);
  root.add(m);
  return { root, setCover(z0, z1 = 1.02, y = 0.86) { const L = Math.max(0.05, z1 - z0); m.scale.set(1, 1, L); m.position.set(0, y, (z0 + z1) / 2); } };
}

export function makeFoamHeap(w = 7, d = 3.6, h = 1.0, n = 160, seed = 3) {
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, emissive: '#c8d8ff', emissiveIntensity: 0.15 });
  const im = new THREE.InstancedMesh(_sph, mat, n); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  const root = new THREE.Group(); root.add(im);
  const items = Array.from({ length: n }, (_, i) => {
    const x = (hash(i * 1.31 + seed) - 0.5) * w, z = (hash(i * 2.77 + seed) - 0.5) * d;
    const edge = Math.min(1, Math.min(w / 2 - Math.abs(x), d / 2 - Math.abs(z)) / 0.8 + 0.25);
    return { x, z, y: h * edge * (0.35 + 0.65 * hash(i * 4.1 + seed)), r: 0.35 + 0.35 * hash(i * 6.3 + seed), ph: hash(i * 8.9) * 6 };
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V();
  const api = {
    root, update(t, amount = 1) {
      items.forEach((it, i) => {
        p.set(it.x, it.y * amount + 0.05 * Math.sin(t * 2.1 + it.ph), it.z);
        s.setScalar(Math.max(0.001, it.r * (0.92 + 0.08 * Math.sin(t * 3 + it.ph)) * amount)); m4.compose(p, q, s); im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true;
    },
  };
  api.update(0); return api;
}

export function makePillowHeap() {
  const n = 16, geo = new RoundedBoxGeometry(0.55, 0.22, 0.45, 3, 0.1);
  const im = new THREE.InstancedMesh(geo, M('#ffffff', { roughness: 0.95 }), n); im.castShadow = true;
  const col = new THREE.Color(), cs = ['#ffb3d9', '#ff7ac0', '#ffd6ec', '#ff9ad0', '#f6c1ff'];
  const m4 = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion(), one = V(1, 1, 1);
  for (let i = 0; i < n; i++) {
    const layer = i < 7 ? 0 : i < 12 ? 1 : 2;
    const p = V((hash(i * 1.7) - 0.5) * (0.7 - layer * 0.15), 0.12 + layer * 0.2 + hash(i * 2.3) * 0.05, (hash(i * 3.9) - 0.5) * (1.6 - layer * 0.3));
    e.set((hash(i * 5.1) - 0.5) * 0.6, hash(i * 6.7) * 3, (hash(i * 7.3) - 0.5) * 0.6); q.setFromEuler(e);
    m4.compose(p, q, one); im.setMatrixAt(i, m4); col.set(cs[i % cs.length]); im.setColorAt(i, col);
  }
  const g = new THREE.Group(); g.add(im); return g;
}
export function makeLimboPillow() {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.125, 14), M(i % 2 ? '#ffffff' : '#e8232b', { roughness: 0.5 }));
    c.rotation.z = Math.PI / 2; c.position.x = -0.4375 + i * 0.125; c.castShadow = true; g.add(c);
  }
  return g;
}
export function makePapers() {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) { const p = boxMesh(0.3, 0.02, 0.22, M(i % 3 ? '#fbfbf5' : '#f1ead2', { roughness: 0.95 }), (hash(i) - 0.5) * 0.03, 0.01 + i * 0.021, (hash(i * 2) - 0.5) * 0.03); p.rotation.y = (hash(i * 3) - 0.5) * 0.2; g.add(p); }
  return g;
}
