// In This Town — Episode 20 "Biscuit": props.  Same conventions as src/props.js (SPEC.md §2/§7): ES module, metres,
// Y up, deterministic (no Math.random / clocks); animated things are pure functions of the t / u passed in.
//
// Exports
//   makeBiscuit()          the skyscraper T-rex (unit model ≈ 11.5 tall standing, scale it ~3.5).  Feet at the origin,
//                          faces +Z.  userData.set(t, o) — o (all optional): sit 0..1, walk (phase speed, 0 = still),
//                          wag 0..1, wagSpeed, jaw 0..1, tongue 0..1, lookX/lookY (−1..1), lid (0 wide … 1 shut, null =
//                          auto blink at lid0 0.12), eyeScale, pupil (scale), brow (−1 sad … +1 angry), headTilt (roll),
//                          lean 0..1 (neck forward/down), headPitch, headYaw, arms (wiggle 0..1), armsUp 0..1 (paws to
//                          the face), thump 0..1 (hind-leg thump, needs sit), hic 0..1 (hiccup jolt), tremble 0..1,
//                          cower 0..1 (crouch + head down), tailUp, tailYaw, bodyLean.
//                          userData.eyeWorld(side) → Vector3, userData.parts { head, jaw, neck, torso, tongue, ... }
//   makeToothbrush()       street-sweeper toothbrush (grip at the origin, handle along +Y, bristles face +Z at the top)
//   makeFireTruck()        red fire truck, front +Z, ladder on a turntable at the back.  userData.set({ yaw, raise, extend, t })
//   makeWaterTower()       tank on four legs (≈ 15 m) that tips over its +X leg line.  userData.set(tip 0..1)
//   makeSplash(n)          instanced blue cubes bursting outward.  userData.set(u)  (u = seconds since the hit)
//   makeBus()              yellow school bus, long axis X (front +X), door on the +Z side.  userData.set({ door 0..1, t, drip })
//   makeDrips(n)           translucent blue drool drops falling from a list of local points: userData.set(t, points, fall)
//   makeNest()             bird's nest with Grandpa's false teeth in it (origin = bottom centre, ~0.9 wide)
//   makeLibrary(), makeBakery()   two small buildings (front +Z, origin bottom centre). Bakery userData.roofTop
//   makeChefHat()          puffy chef hat for a head joint
//   makeTuba()             gold tuba (parent to joints.torso; bell up over the right shoulder)
//   makeMirror()           tall silver barbershop mirror (front +Z, origin bottom centre, glass 1.15 × 2.1, centre y ≈ 1.45)
//                          userData.set(mode)  'sky' | 'eye' | 'wide' | 'face' | 'tilt'
//   makeShockRing()        expanding white shockwave ring (torus in XY plane, facing +Z).  userData.set(u)
//   makeBoxClouds(n, seed) white box clouds spread over a 160 × 40 area (XZ), y 45..70.  userData.set(t, push 0..1, dir)
//   makeMountain()         the big hill behind town (≈ 60 m tall, radius ≈ 55), origin = base centre
//   makeDinoHood(color)    green dinosaur hood with cone spikes (parent to a human joints.head)
//   makeGrandmaSuit()      Grandma's huge dinosaur costume: body around a character placed at the origin, hinged mask.
//                          userData.set(t, { mask 0..1 (1 = lifted), jaw 0..1, glow 0..1, roar 0..1, tail })
//   makeArrowSign(lines)   wooden post with an arrow board (points −X), origin = post base, text faces +Z
//   makeBroom()            push broom (grip at the origin, along +Y)
//   makeDogBowl()          giant red dog bowl with BISCUIT on it (origin bottom centre, r ≈ 1)
//   makeHats(n)            instanced flying caps.  userData.set(list [{ p0: Vector3, v: Vector3, spin }], u)
//   makeBubbles(n)         white foam bubbles around a point.  userData.set(t, a)
//   makeSpeech(text)       a speech-bubble sprite (bottom-centre anchor).  userData.set(k)
//   labelTex(lines, o)     canvas text texture (font auto-fit)

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, hash, noise1, canvasTexture, smooth, ease } from '../lib/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const FONTD = (s) => `${s}px "ITT World Display", "ITT Luckiest", "Luckiest Guy", Impact, "DejaVu Sans", sans-serif`;
const FONTW = (s) => `900 ${s}px "ITT World Text", "ITT Nunito", "Nunito", "DejaVu Sans", Arial, sans-serif`;

const _mats = new Map();
function std(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!_mats.has(k)) _mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.72, ...o }));
  return _mats.get(k);
}
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const _geo = new Map();
function rgeo(w, h, d, r) { const k = `${w}|${h}|${d}|${r}`; if (!_geo.has(k)) _geo.set(k, r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d)); return _geo.get(k); }
function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0) {
  const o = new THREE.Mesh(rgeo(w, h, d, r), typeof m === 'string' ? std(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function cyl(rt, rb, h, m, seg = 20) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; o.receiveShadow = true; return o; }
function cone(r, h, m, seg = 8) { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function sph(r, m, ws = 20, hs = 14) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function at(parent, o, x = 0, y = 0, z = 0) { o.position.set(x, y, z); parent.add(o); return o; }
function grp(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; }
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }

const _tex = new Map();
/** Canvas text texture.  lines: strings or { t, size, color }.  Fonts auto-shrink to fit. */
export function labelTex(lines, { w = 1024, h = 320, bg = '#ffd23f', fg = '#1d1d22', border = '#1d1d22', display = true, size = 0, pad = 40, stroke = null, radius = 0 } = {}) {
  const key = JSON.stringify([lines, w, h, bg, fg, border, display, size, pad, stroke, radius]);
  if (_tex.has(key)) return _tex.get(key);
  const tex = canvasTexture(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    if (bg) {
      g.fillStyle = bg;
      if (radius) { g.beginPath(); g.roundRect(0, 0, w, h, radius); g.fill(); } else g.fillRect(0, 0, w, h);
    }
    if (border) { g.strokeStyle = border; g.lineWidth = Math.max(8, h * 0.05); const b = g.lineWidth / 2 + 4; if (radius) { g.beginPath(); g.roundRect(b, b, w - 2 * b, h - 2 * b, Math.max(4, radius - b)); g.stroke(); } else g.strokeRect(b, b, w - 2 * b, h - 2 * b); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const n = lines.length;
    lines.forEach((l, i) => {
      const t = typeof l === 'string' ? l : l.t;
      const font = display ? FONTD : FONTW;
      const s0 = (typeof l === 'string' ? 0 : l.size) || size || (h - 2 * pad) / n * 0.86;
      const s = fit(g, t, font, w - 2 * pad, s0);
      const y = pad + (h - 2 * pad) * (i + 0.5) / n + s * 0.06;
      if (stroke) { g.lineWidth = s * 0.16; g.strokeStyle = stroke; g.strokeText(t, w / 2, y); }
      g.fillStyle = (typeof l === 'string' ? null : l.color) || fg; g.fillText(t, w / 2, y);
    });
  });
  _tex.set(key, tex);
  return tex;
}
function textPlane(w, h, tex, { basicMat = false, side = THREE.FrontSide } = {}) {
  const m = basicMat ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, side }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, transparent: true, side });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

// ═════════════════════════════════════════════════════════════════════════════════════════ BISCUIT
const GREEN = '#5fcf4e', GREEN_D = '#3f9f3a', GREEN_DD = '#2f7a2c', BELLY = '#cdf08a', SPIKE = '#ff9a2a';
const MOUTH = '#7a1428', TONGUE = '#ff7aa8', TOOTH = '#fffaf0', CLAW = '#fff3d6';

export function makeBiscuit() {
  const root = new THREE.Group(); root.name = 'biscuit';
  const skin = std(GREEN, { roughness: 0.65 }), skinD = std(GREEN_D, { roughness: 0.7 }), belly = std(BELLY, { roughness: 0.7 });
  const spikeM = std(SPIKE, { roughness: 0.55 }), toothM = std(TOOTH, { roughness: 0.35 }), clawM = std(CLAW, { roughness: 0.4 });
  const mouthM = std(MOUTH, { roughness: 0.8 }), tongueM = std(TONGUE, { roughness: 0.5 });
  const body = grp(root);                       // whole-body jolt / tremble
  const hips = grp(body, 0, 3.6, 0);
  hips.add(box(3.0, 2.3, 3.3, skin, 0, 0.35, -0.25, 0.3));
  // legs
  const legs = {};
  for (const s of [-1, 1]) {
    const leg = grp(hips, s * 1.3, 0, 0.05);
    leg.add(box(1.55, 2.5, 2.2, skin, 0, -0.75, 0.1, 0.3));
    leg.add(box(1.25, 1.2, 0.2, skinD, s * 0.02, -0.55, 1.21, 0.08));     // thigh patch (tone)
    const knee = grp(leg, 0, -1.9, 0.3);
    knee.add(box(1.05, 1.85, 1.15, skin, 0, -0.75, -0.2, 0.25));
    const ankle = grp(knee, 0, -1.6, -0.3);
    ankle.add(box(1.35, 0.56, 2.3, skinD, 0, 0.18, 0.55, 0.18));
    for (const cx of [-0.42, 0, 0.42]) { const c = cone(0.17, 0.5, clawM, 6); c.rotation.x = PI / 2; at(ankle, c, cx, 0.16, 1.82); }
    legs[s < 0 ? 'R' : 'L'] = { leg, knee, ankle };
  }
  // tail (chain of segments toward −Z)
  const tail = []; let tp = grp(hips, 0, 0.55, -1.75);
  const tailBase = tp;
  for (let i = 0; i < 8; i++) {
    const w = lerp(2.1, 0.45, i / 7), len = 1.45;
    const seg = i === 0 ? tp : grp(tp, 0, 0, -len * 0.92);
    seg.add(box(w, w * 0.92, len, skin, 0, 0, -len / 2, Math.min(0.3, w * 0.2)));
    const sp = cone(w * 0.2, w * 0.45, spikeM, 4); sp.rotation.set(-0.5, PI / 4, 0); at(seg, sp, 0, w * 0.5, -len * 0.45);
    tail.push(seg); tp = seg;
  }
  // torso
  const torso = grp(hips, 0, 0.75, 0);
  torso.add(box(3.4, 4.1, 3.4, skin, 0, 2.0, 0.05, 0.4));
  torso.add(box(2.5, 3.5, 0.24, belly, 0, 1.85, 1.72, 0.1));
  for (let i = 0; i < 4; i++) torso.add(box(2.3, 0.1, 0.06, std('#a8d070'), 0, 0.75 + i * 0.75, 1.86));
  for (let i = 0; i < 5; i++) { const sp = cone(0.32, 0.8, spikeM, 4); sp.rotation.set(-PI / 2 + 0.2, PI / 4, 0); at(torso, sp, 0, 0.6 + i * 0.85, -1.85); }
  // spots
  for (const [x, y, z, s] of [[1.71, 2.6, -0.6, 0.5], [1.71, 1.2, 0.4, 0.35], [-1.71, 2.2, -0.2, 0.45], [-1.71, 3.2, 0.6, 0.3]]) { const sp = box(0.06, s, s, skinD, x, y, z, 0.02); torso.add(sp); }
  // tiny arms
  const arms = {};
  for (const s of [-1, 1]) {
    const arm = grp(torso, s * 1.45, 3.0, 1.25);
    arm.add(box(0.44, 0.9, 0.44, skin, 0, -0.35, 0.08, 0.12));
    const fore = grp(arm, 0, -0.75, 0.12);
    fore.add(box(0.38, 0.62, 0.38, skin, 0, -0.25, 0.08, 0.1));
    for (const cx of [-0.1, 0.1]) { const c = cone(0.07, 0.24, clawM, 5); c.rotation.x = PI; at(fore, c, cx, -0.62, 0.16); }
    arms[s < 0 ? 'R' : 'L'] = { arm, fore };
  }
  // collar + tag
  const collarM = std('#e8232b', { roughness: 0.5 });
  torso.add(box(2.62, 0.5, 2.62, collarM, 0, 4.05, 0.32, 0.12));
  const tagG = grp(torso, 0, 3.8, 1.66);
  tagG.add(cyl(0.08, 0.08, 0.35, std('#c9a43a', { metalness: 0.4, roughness: 0.35 }), 10));
  const tagM = new THREE.MeshStandardMaterial({ map: labelTex(['BISCUIT'], { w: 512, h: 256, bg: '#ffd23f', fg: '#7a1f2b', border: '#b8860b', radius: 110, pad: 50 }), roughness: 0.35, metalness: 0.2 });
  const tagBack = box(1.55, 0.78, 0.1, std('#e8b830', { roughness: 0.35, metalness: 0.3 }), 0, -0.55, 0.0, 0.3); tagG.add(tagBack);
  const tagFace = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), tagM); tagFace.position.set(0, -0.55, 0.056); tagG.add(tagFace);
  // neck + head
  const neck = grp(torso, 0, 3.9, 0.3);
  neck.add(box(2.3, 1.9, 2.3, skin, 0, 0.7, 0.2, 0.35));
  for (let i = 0; i < 2; i++) { const sp = cone(0.28, 0.7, spikeM, 4); sp.rotation.set(-PI / 2 + 0.35, PI / 4, 0); at(neck, sp, 0, 0.4 + i * 0.75, -1.0); }
  const head = grp(neck, 0, 1.45, 0.45);
  head.add(box(3.0, 2.05, 3.6, skin, 0, 0.85, 1.0, 0.45));
  head.add(box(2.65, 1.3, 1.9, skin, 0, 0.55, 3.2, 0.35));
  head.add(box(2.1, 0.35, 1.4, skinD, 0, 1.12, 3.1, 0.15));      // snout top ridge
  for (const s of [-1, 1]) head.add(box(0.36, 0.22, 0.12, std('#1f3a1f'), s * 0.5, 1.02, 4.12, 0.05));
  for (let i = 0; i < 3; i++) { const sp = cone(0.3, 0.7, spikeM, 4); sp.rotation.set(-PI / 2 + 0.6, PI / 4, 0); at(head, sp, 0, 1.75 - i * 0.1, -0.45 - i * 0.4); }
  // cheeks blush
  for (const s of [-1, 1]) { const b = box(0.06, 0.45, 0.8, std('#ff9ab0', { roughness: 0.8 }), s * 1.51, 0.55, 2.0, 0.03); head.add(b); }
  // mouth roof + upper teeth
  head.add(box(2.1, 0.12, 3.2, mouthM, 0, -0.04, 2.35));
  const toothGeo = new THREE.ConeGeometry(0.13, 0.42, 4);
  const addTooth = (parent, x, y, z, down) => { const t = new THREE.Mesh(toothGeo, toothM); t.position.set(x, y, z); t.rotation.set(down ? PI : 0, PI / 4, 0); parent.add(t); return t; };
  for (let i = 0; i < 6; i++) addTooth(head, -1.0 + i * 0.4, -0.25, 4.0, true);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) addTooth(head, s * 1.18, -0.25, 1.3 + i * 0.5, true);
  // eyes (googly, on top of the skull)
  const eyes = {};
  const white = basic('#ffffff'), pupilM = basic('#141418'), lidM = std(GREEN_D, { roughness: 0.6 });
  for (const s of [-1, 1]) {
    const eg = grp(head, s * 0.92, 1.95, 1.75);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.74, 28, 20), white); eg.add(ball);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.07, 8, 32), std('#2a4a2a')); ring.rotation.y = 0; eg.add(ring); ring.visible = false;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 14), pupilM); pupil.scale.z = 0.5; eg.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), basic('#ffffff')); pupil.add(glint); glint.position.set(0.14, 0.15, 0.32);
    const lidPivot = grp(eg);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.8, 28, 14, 0, PI * 2, 0, PI / 2), lidM); lid.castShadow = true; lidPivot.add(lid);
    const lidLow = new THREE.Mesh(new THREE.SphereGeometry(0.79, 28, 14, 0, PI * 2, 0, PI / 2), lidM); lidLow.rotation.x = PI; lidPivot.add(lidLow); lidLow.visible = false;
    const brow = box(1.0, 0.24, 0.4, std(GREEN_DD), 0, 0.84, 0.3, 0.1); eg.add(brow);
    eyes[s < 0 ? 'R' : 'L'] = { eg, ball, pupil, lidPivot, lid, brow, s };
  }
  // jaw
  const jaw = grp(head, 0, 0.05, 0.25);
  jaw.add(box(2.7, 0.8, 4.0, skin, 0, -0.45, 1.95, 0.3));
  jaw.add(box(2.2, 0.3, 3.4, belly, 0, -0.78, 1.85, 0.12));
  jaw.add(box(2.0, 0.1, 3.0, mouthM, 0, -0.06, 2.0));
  for (let i = 0; i < 5; i++) addTooth(jaw, -0.8 + i * 0.4, 0.15, 3.75, false);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) addTooth(jaw, s * 1.15, 0.15, 1.3 + i * 0.5, false);
  const tongue = grp(jaw, 0, 0.05, 0.6);
  const tongueMesh = box(1.7, 0.36, 3.0, tongueM, 0, 0.08, 1.45, 0.17); tongue.add(tongueMesh);
  tongue.add(box(0.08, 0.05, 2.4, std('#e85a8a'), 0, 0.27, 1.5));
  // inner throat (dark) so an open mouth reads
  head.add(box(2.2, 1.0, 0.2, mouthM, 0, -0.4, 0.75));

  const parts = { body, hips, torso, neck, head, jaw, tongue, tail, legs, arms, eyes, tagG };
  const _v = V();
  root.userData = {
    parts, tongueMesh,
    eyeWorld(side = 'L') { root.updateMatrixWorld(true); return eyes[side].eg.getWorldPosition(V()); },
    headWorld(x = 0, y = 0.9, z = 1.5) { root.updateMatrixWorld(true); return head.localToWorld(V(x, y, z)); },
    mouthWorld() { root.updateMatrixWorld(true); return jaw.localToWorld(V(0, 0.4, 2.2)); },
    set(t, o = {}) {
      const sit = o.sit ?? 1, walk = o.walk ?? 0, wag = o.wag ?? 0.15, wagSpeed = o.wagSpeed ?? 6;
      const hic = o.hic ?? 0, tremble = o.tremble ?? 0, cower = o.cower ?? 0, lean = o.lean ?? 0;
      const thump = o.thump ?? 0;
      // body jolt / tremble
      body.position.set(tremble * 0.08 * noise1(t * 30, 3), hic * 1.2 + tremble * 0.05 * noise1(t * 27, 5), 0);
      body.rotation.set(-hic * 0.06, 0, tremble * 0.02 * noise1(t * 24, 7));
      // walk cycle
      const ph = walk ? t * walk * PI * 2 : 0, wk = walk ? 1 : 0;
      const bob = wk * 0.25 * Math.abs(Math.sin(ph));
      hips.position.set(0, lerp(3.6, 1.65, sit) - cower * 0.5 + bob, lerp(0, -0.4, sit));
      hips.rotation.set(0, wk * 0.08 * Math.sin(ph), wk * 0.04 * Math.sin(ph));
      for (const k of ['L', 'R']) {
        const L = legs[k], s = k === 'L' ? 1 : -1;
        const sw = wk * 0.55 * Math.sin(ph + (k === 'L' ? 0 : PI));
        const lift = wk * Math.max(0, Math.cos(ph + (k === 'L' ? 0 : PI))) * 0.6;
        let th = lerp(0, -1.45, sit) - sw - cower * 0.3, kn = lerp(0, 1.75, sit) + lift, an = lerp(0, -0.3, sit) - lift * 0.4 + sw * 0.3;
        let lz = 0;
        if (k === 'R' && thump > 0) {
          const c = Math.abs(Math.sin((t - (o.thumpT0 ?? 0)) * PI * 2.6));
          th += -0.35 * thump * c; lz = 0.25 * thump; kn += 0.2 * thump * c;
        }
        L.leg.rotation.set(th, 0, s * lz);
        L.knee.rotation.set(kn, 0, 0);
        L.ankle.rotation.set(an + (k === 'R' && thump > 0 ? 0.3 * thump * Math.abs(Math.sin((t - (o.thumpT0 ?? 0)) * PI * 2.6)) : 0), 0, 0);
      }
      // torso
      const bl = o.bodyLean ?? 0;
      torso.rotation.set(lerp(0.28, -0.12, sit) + wk * 0.06 + cower * 0.35 + lean * 0.25 + bl - hic * 0.1, wk * -0.06 * Math.sin(ph), 0);
      const breath = 1 + 0.015 * Math.sin(t * 1.6) + hic * 0.08;
      torso.scale.set(breath, 1, breath);
      // tail
      const tailUp = o.tailUp ?? 0, tailYaw = o.tailYaw ?? 0;
      tail.forEach((seg, i) => {
        const w = wag * (0.12 + i * 0.05) * Math.sin(t * wagSpeed - i * 0.55);
        const droop = i === 0 ? lerp(-0.15, -0.55, sit) + tailUp * 0.5 : lerp(-0.04, 0.06, sit) + tailUp * 0.05;
        seg.rotation.set(droop + wk * 0.03 * Math.sin(ph * 2 - i), w + (i === 0 ? tailYaw : 0) + wk * 0.06 * Math.sin(ph - i * 0.5), 0);
      });
      // arms
      const aw = o.arms ?? 0.1, au = o.armsUp ?? 0;
      for (const k of ['L', 'R']) {
        const A = arms[k], s = k === 'L' ? 1 : -1, w = aw * Math.sin(t * 9 + (k === 'L' ? 0 : 1.7));
        A.arm.rotation.set(lerp(-0.5, -1.9, au) + 0.45 * w, 0, s * lerp(0.1, -0.2, au) + 0.15 * w);
        A.fore.rotation.set(lerp(-0.9, -1.4, au) - 0.4 * w, 0, 0);
      }
      // neck / head
      neck.rotation.set(0.12 + lean * 0.85 - cower * 0.1 + hic * -0.12, (o.headYaw ?? 0) * 0.4, 0);
      head.rotation.set(-0.1 + (o.headPitch ?? 0) + lean * 0.35 - hic * 0.15 + cower * 0.3, (o.headYaw ?? 0) * 0.6, (o.headTilt ?? 0));
      jaw.rotation.set(clamp(o.jaw ?? 0, 0, 1.2) * 0.85, 0, 0);
      const tg = o.tongue ?? 0;
      tongue.position.set(0, 0.05 + tg * 0.1, 0.6 + tg * 1.6);
      tongue.rotation.set(tg * 0.85, 0, tg * 0.08 * Math.sin(t * 7));
      // eyes
      const lx = o.lookX ?? 0, ly = o.lookY ?? 0, es = o.eyeScale ?? 1, ps = o.pupil ?? 1;
      const lid0 = o.lid0 ?? 0.12;
      let lid = o.lid;
      if (lid == null) { const b = (t + 0.7) % 3.4; lid = b < 0.16 ? 1 - Math.abs(b - 0.08) / 0.08 * (1 - lid0) : lid0; lid = Math.max(lid, lid0); }
      const br = o.brow ?? 0;
      for (const k of ['L', 'R']) {
        const E = eyes[k], s = E.s;
        E.eg.scale.setScalar(es);
        _v.set(lx * 0.75 + 0.03 * noise1(t * 3, s * 5), ly * 0.6 + 0.1 + 0.03 * noise1(t * 3.3, s * 9), 1).normalize();
        E.pupil.position.copy(_v).multiplyScalar(0.66);
        E.pupil.lookAt(E.eg.localToWorld(_v.clone().multiplyScalar(5)));
        E.pupil.scale.set(ps, ps, ps * 0.5);
        // lid: −1.55 (open, tucked back) … +1.5 (shut)
        E.lidPivot.rotation.set(lerp(-1.55, 1.5, clamp(lid, 0, 1)), 0, 0);
        E.brow.position.set(0, 0.84 + (br < 0 ? -br * 0.05 : 0), 0.3);
        E.brow.rotation.set(0, 0, s * (br > 0 ? -0.45 * br : 0.5 * br));
      }
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ toothbrush
export function makeToothbrush() {
  const g = new THREE.Group();
  const h = cyl(0.09, 0.11, 4.4, std('#4fb3ff', { roughness: 0.4 }), 12); h.position.y = 1.6; g.add(h);
  g.add(box(0.3, 0.6, 0.3, std('#ff4fa3', { roughness: 0.4 }), 0, -0.4, 0, 0.08));
  const headG = grp(g, 0, 3.9, 0);
  headG.add(box(1.7, 0.35, 0.5, std('#f2f2f2', { roughness: 0.5 }), 0, 0, 0, 0.08));
  for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) headG.add(box(0.16, 0.18, 0.32, std(i % 2 ? '#7fd3ff' : '#ffffff', { roughness: 0.9 }), -0.7 + i * 0.2, -0.25 + j * 0.0, 0.18 + j * 0.0));
  // bristles poke toward +Z: tilt the head so bristles face +Z
  headG.children.slice(1).forEach((b) => { b.position.z = 0.36; b.position.y = 0; b.scale.set(1, 1.6, 1); });
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ fire truck
export function makeFireTruck() {
  const g = new THREE.Group();
  const red = std('#d8231f', { roughness: 0.45 }), redD = std('#a3161a', { roughness: 0.5 }), chrome = std('#d9dce2', { roughness: 0.3, metalness: 0.5 });
  g.add(box(2.5, 1.5, 7.6, red, 0, 1.35, -0.4, 0.15));
  g.add(box(2.5, 1.5, 2.2, red, 0, 2.3, 2.6, 0.2));                       // cab
  g.add(box(2.3, 0.75, 0.06, std('#2b3a52', { roughness: 0.2 }), 0, 2.55, 3.71));
  for (const s of [-1, 1]) g.add(box(0.06, 0.65, 1.3, std('#2b3a52', { roughness: 0.2 }), s * 1.26, 2.55, 2.6));
  g.add(box(2.6, 0.3, 0.3, chrome, 0, 0.75, 3.62, 0.08));
  for (const s of [-1, 1]) { g.add(box(0.45, 0.3, 0.06, basic('#fff6c8'), s * 0.8, 1.35, 3.53)); g.add(box(0.35, 0.22, 0.25, basic(s < 0 ? '#ff2a2a' : '#2a7aff'), s * 0.5, 3.12, 2.6)); }
  g.add(box(2.56, 0.18, 7.0, std('#ffffff'), 0, 1.6, -0.6));            // white stripe
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) g.add(box(0.06, 0.5, 1.0, redD, s * 1.27, 1.25, -3.2 + i * 1.3, 0.04));
  const wheelM = std('#1b1b1f', { roughness: 0.8 }), hubM = std('#cfd2d8', { roughness: 0.3, metalness: 0.4 });
  for (const s of [-1, 1]) for (const z of [2.6, -1.6, -3.1]) { const w = cyl(0.62, 0.62, 0.45, wheelM, 16); w.rotation.z = PI / 2; at(g, w, s * 1.15, 0.62, z); const hb = cyl(0.3, 0.3, 0.47, hubM, 12); hb.rotation.z = PI / 2; at(g, hb, s * 1.15, 0.62, z); }
  // turntable + ladder
  const turn = grp(g, 0, 2.15, -2.4);
  turn.add(cyl(0.9, 1.0, 0.35, std('#c8ccd2', { roughness: 0.4, metalness: 0.3 }), 18));
  const pitch = grp(turn, 0, 0.35, 0);
  pitch.add(box(0.5, 0.6, 0.8, std('#9aa0a8'), 0, 0.2, 0));
  const secs = [];
  const railM = std('#e8e8ec', { roughness: 0.35, metalness: 0.4 }), rungM = std('#c8c8cc', { roughness: 0.4, metalness: 0.3 });
  let parent = pitch;
  for (let k = 0; k < 3; k++) {
    const sec = grp(parent, 0, k === 0 ? 0.4 : 0.12, 0);
    const w = 0.95 - k * 0.14, len = 9.0;
    for (const s of [-1, 1]) sec.add(box(0.12, 0.2, len, railM, s * w / 2, 0, len / 2 - 0.3));
    for (let r = 0; r < 17; r++) sec.add(box(w, 0.06, 0.06, rungM, 0, 0, r * 0.5 + 0.1));
    secs.push(sec); parent = sec;
  }
  // bucket brush at the tip (for scratching)
  const tip = grp(secs[2], 0, 0, 8.8);
  tip.add(box(1.6, 0.5, 0.5, std('#ffd23f'), 0, 0.15, 0, 0.1));
  for (let i = 0; i < 6; i++) tip.add(box(0.18, 0.45, 0.18, std('#8a5a2e'), -0.6 + i * 0.24, 0.55, 0));
  g.userData = {
    turn, pitch, secs, tip,
    set({ yaw = 0, raise = 0.9, extend = 1, t = 0, scrub = 0 } = {}) {
      turn.rotation.y = yaw;
      pitch.rotation.x = -raise + scrub * 0.05 * Math.sin(t * 12);
      secs[1].position.z = 8.4 * extend; secs[2].position.z = 8.4 * extend + scrub * 0.4 * Math.sin(t * 12);
    },
    tipWorld() { g.updateMatrixWorld(true); return tip.getWorldPosition(V()); },
  };
  g.userData.set({});
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ water tower
export function makeWaterTower() {
  const g = new THREE.Group();
  const pivot = grp(g, 2.6, 0, 0);            // tip line = the +X legs
  const tw = grp(pivot, -2.6, 0, 0);
  const legM = std('#8a5a3a', { roughness: 0.8 }), tankM = std('#7fc4e8', { roughness: 0.5 }), roofM = std('#d84a3a', { roughness: 0.6 });
  for (const [x, z] of [[2.2, 2.2], [2.2, -2.2], [-2.2, 2.2], [-2.2, -2.2]]) { const l = box(0.45, 10.5, 0.45, legM, x * 0.92, 5.25, z * 0.92); l.rotation.set(z * 0.02, 0, -x * 0.02); tw.add(l); }
  for (const y of [3.2, 6.8]) for (const [x, z, ry] of [[0, 2.05, 0], [0, -2.05, 0], [2.05, 0, PI / 2], [-2.05, 0, PI / 2]]) { const b = box(4.2, 0.25, 0.25, legM, x, y, z); b.rotation.y = ry; tw.add(b); }
  tw.add(cyl(3.6, 3.6, 0.4, std('#6a4a32'), 24)).position.y = 10.6;
  const tank = cyl(3.3, 3.3, 4.6, tankM, 28); tank.position.y = 13.1; tw.add(tank);
  for (const y of [11.3, 14.9]) { const band = cyl(3.36, 3.36, 0.22, std('#3a6a8a', { metalness: 0.3, roughness: 0.4 }), 28); band.position.y = y; tw.add(band); }
  const rf = cone(3.8, 2.2, roofM, 24); rf.position.y = 16.5; tw.add(rf);
  const ball = sph(0.35, std('#ffd23f'), 10, 8); ball.position.y = 17.7; tw.add(ball);
  const lbl = textPlane(4.2, 1.5, labelTex(['WATER'], { w: 768, h: 256, bg: null, border: null, fg: '#ffffff', stroke: '#1d4a6a' }));
  // wrap-ish: two labels (front +Z and toward +X)
  lbl.position.set(0, 13.1, 3.32); tw.add(lbl);
  const lbl2 = lbl.clone(); lbl2.position.set(3.32, 13.1, 0); lbl2.rotation.y = PI / 2; tw.add(lbl2);
  const lbl3 = lbl.clone(); lbl3.position.set(-3.32, 13.1, 0); lbl3.rotation.y = -PI / 2; tw.add(lbl3);
  g.userData = { pivot, set(tip = 0) { pivot.rotation.z = -tip * (PI / 2 + 0.05); } };
  return g;
}
/** blue cube splash; u = seconds since the hit (hidden outside 0..1.6) */
export function makeSplash(n = 70, { speed = 1, size = 0.7, colors = ['#3aa8ff', '#7fd3ff', '#bfeaff', '#ffffff', '#2a7ae0'] } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(size, size, size);
  const ims = colors.map((c) => { const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.25, transparent: true, opacity: 0.88, emissive: c, emissiveIntensity: 0.25 }), Math.ceil(n / colors.length)); im.frustumCulled = false; g.add(im); return im; });
  const list = [];
  for (let i = 0; i < n; i++) {
    const a = hash(i * 1.37) * PI * 2, el = 0.35 + hash(i * 2.11) * 0.9;
    list.push({ v: V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).multiplyScalar((6 + 10 * hash(i * 3.3)) * speed), s: 0.5 + hash(i * 4.4) * 0.9, im: i % colors.length, k: Math.floor(i / colors.length), sp: V(hash(i), hash(i + 3), hash(i + 7)) });
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s = V();
  g.userData = {
    set(u) {
      g.visible = u > 0 && u < 1.8;
      if (!g.visible) return;
      for (const it of list) {
        p.set(it.v.x * u, Math.max(0.3, it.v.y * u - 9.8 * u * u * 0.9), it.v.z * u);
        e.set(it.sp.x * u * 8, it.sp.y * u * 8, it.sp.z * u * 8); q.setFromEuler(e);
        const k = it.s * (u < 1.2 ? 1 : 1 - (u - 1.2) / 0.6);
        s.setScalar(Math.max(0.001, k)); m4.compose(p, q, s); ims[it.im].setMatrixAt(it.k, m4);
      }
      ims.forEach((im) => { im.instanceMatrix.needsUpdate = true; });
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ school bus
export function makeBus() {
  const g = new THREE.Group();
  const yel = std('#ffc21a', { roughness: 0.45 }), blk = std('#1d1d22', { roughness: 0.5 }), glass = std('#2b3a52', { roughness: 0.15, metalness: 0.2 });
  g.add(box(9.0, 2.3, 2.5, yel, 0, 1.75, 0, 0.25));
  g.add(box(1.6, 1.3, 2.4, yel, 5.0, 1.25, 0, 0.2));        // hood
  g.add(box(0.1, 0.9, 2.2, glass, 4.52, 2.45, 0));           // windscreen
  for (const s of [-1, 1]) {
    g.add(box(8.0, 0.8, 0.06, glass, -0.4, 2.35, s * 1.26));
    for (let i = 0; i < 8; i++) g.add(box(0.12, 0.85, 0.08, yel, -4.2 + i * 1.08, 2.35, s * 1.27));
    g.add(box(9.0, 0.12, 0.08, blk, 0, 1.55, s * 1.27));
    g.add(box(9.0, 0.12, 0.08, blk, 0, 1.2, s * 1.27));
  }
  const sign = textPlane(4.6, 0.5, labelTex(['SCHOOL BUS'], { w: 1024, h: 128, bg: '#1d1d22', fg: '#ffc21a', border: null, pad: 14 }));
  sign.position.set(-0.6, 3.02, 1.27); g.add(sign);
  const sign2 = sign.clone(); sign2.rotation.y = PI; sign2.position.z = -1.27; g.add(sign2);
  g.add(box(0.3, 0.3, 2.6, blk, 5.85, 0.8, 0, 0.08));
  for (const s of [-1, 1]) { g.add(box(0.06, 0.3, 0.4, basic('#fff6c8'), 5.82, 1.35, s * 0.85)); }
  // door (front, +Z side): two panels that fold open
  const door = grp(g, 3.6, 0.0, 1.26);
  const doorL = box(0.55, 2.1, 0.08, glass, -0.28, 1.5, 0.02); door.add(doorL);
  const doorR = box(0.55, 2.1, 0.08, glass, 0.28, 1.5, 0.02); door.add(doorR);
  const doorHole = box(1.15, 2.1, 0.04, std('#3a2a20'), 0, 1.5, -0.03); door.add(doorHole);
  const wheelM = std('#1b1b1f', { roughness: 0.8 });
  for (const s of [-1, 1]) for (const x of [3.6, -2.8]) { const w = cyl(0.58, 0.58, 0.4, wheelM, 16); w.rotation.x = PI / 2; at(g, w, x, 0.58, s * 1.15); }
  // stop sign arm on the −Z side
  const stop = box(0.06, 0.55, 0.55, basic('#e8232b'), 2.9, 2.0, -1.33, 0.1); g.add(stop);
  g.userData = {
    door, doorL, doorR,
    set({ door: d = 0 } = {}) { doorL.position.x = -0.28 - 0.5 * d; doorR.position.x = 0.28 + 0.5 * d; doorL.scale.x = doorR.scale.x = 1 - 0.6 * d; },
    doorWorld() { g.updateMatrixWorld(true); return door.localToWorld(V(0, 0, 0.6)); },
  };
  return g;
}
/** drool drops: set(t, points (local Vector3 list), fall = 2.5) */
export function makeDrips(n = 40, { size = 0.16, color = '#6fd0ff' } = {}) {
  const g = new THREE.Group();
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 10, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.1, transparent: true, opacity: 0.75, emissive: '#2a8adf', emissiveIntensity: 0.35 }), n);
  im.frustumCulled = false; g.add(im);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V();
  g.userData = {
    set(t, pts, fall = 2.5, rate = 1) {
      for (let i = 0; i < n; i++) {
        const base = pts[i % pts.length];
        const per = 0.9 + 0.6 * hash(i * 2.3), u = ((t * rate + hash(i * 1.7) * per) % per) / per;
        const stretch = u < 0.35 ? u / 0.35 : 1;
        p.set(base.x + (hash(i * 5.1) - 0.5) * 0.3, base.y - (u < 0.35 ? 0.15 * stretch : 0.15 + (u - 0.35) * (u - 0.35) * fall * 4), base.z + (hash(i * 6.3) - 0.5) * 0.3);
        s.set(0.6 + 0.4 * stretch, u < 0.35 ? 0.6 + stretch : 1.5, 0.6 + 0.4 * stretch);
        if (u > 0.98) s.setScalar(0.0001);
        m4.compose(p, q, s); im.setMatrixAt(i, m4);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ nest + teeth
export function makeNest() {
  const g = new THREE.Group();
  const twig = std('#8a5a2e', { roughness: 0.95 }), twigD = std('#6a4220', { roughness: 0.95 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.13, 8, 18), twig); ring.rotation.x = PI / 2; ring.position.y = 0.12; ring.castShadow = true; g.add(ring);
  g.add(cyl(0.3, 0.22, 0.14, twigD, 14)).position.y = 0.06;
  for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; const t = box(0.4, 0.035, 0.035, i % 2 ? twig : twigD, Math.cos(a) * 0.38, 0.16 + 0.05 * hash(i), Math.sin(a) * 0.38); t.rotation.set(hash(i * 3) * 0.6, -a + PI / 2 + 0.6, hash(i * 5) * 0.5); g.add(t); }
  // false teeth: pink gum horseshoe + white teeth, upper + lower slightly open
  const teeth = grp(g, 0, 0.2, 0);
  const gum = std('#ff8fa8', { roughness: 0.45 }), wht = std('#fffdf5', { roughness: 0.25 });
  for (const [y, rx] of [[0.0, 0], [0.13, -0.5]]) {
    const jaw = grp(teeth, 0, y, -0.08); jaw.rotation.x = rx;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 6, 14, PI), gum); arc.rotation.x = -PI / 2; arc.position.z = 0.08; jaw.add(arc);
    for (let i = 0; i < 7; i++) { const a = (i + 0.5) / 7 * PI; const tt = box(0.06, 0.07, 0.04, wht, Math.cos(a) * 0.16, y > 0 ? -0.05 : 0.05, 0.08 + Math.sin(a) * 0.16, 0.01); tt.rotation.y = -a + PI / 2; jaw.add(tt); }
  }
  g.userData = { teeth, top: 0.32 };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ library + bakery
export function makeLibrary() {
  const g = new THREE.Group();
  const stone = std('#d9d2c2'), stoneD = std('#b9b1a0'), roof = std('#6b7a8a');
  g.add(box(9, 0.5, 6.8, stoneD, 0, 0.25, 0.4));
  g.add(box(8.4, 5.4, 6, stone, 0, 3.2, 0, 0.08));
  g.add(box(9.2, 0.6, 6.6, stoneD, 0, 6.15, 0.1, 0.05));
  for (let i = 0; i < 4; i++) g.add(cyl(0.32, 0.36, 5.0, std('#efe9dc'), 14)).position.set(-3 + i * 2, 3.0, 3.25);
  for (let i = 0; i < 3; i++) g.add(box(9.4 - i * 0.4, 0.22, 0.6, stoneD, 0, 0.15 + i * 0.22, 3.9 - i * 0.35));
  g.add(box(1.6, 2.6, 0.1, std('#5a3a22'), 0, 1.8, 3.01, 0.05));
  for (const x of [-2.9, 2.9]) for (const y of [2.2, 4.4]) g.add(box(1.0, 1.3, 0.08, std('#3b4f78', { roughness: 0.25 }), x, y, 3.02, 0.04));
  const sign = textPlane(5.4, 1.0, labelTex(['LIBRARY'], { w: 1024, h: 200, bg: '#efe9dc', fg: '#2a2a40', border: '#6b7a8a', pad: 22 }));
  sign.position.set(0, 5.35, 3.1); g.add(sign);
  // flat roof with a ledge
  g.add(box(8.6, 0.3, 6.2, roof, 0, 6.6, 0.0));
  g.userData = { roofTop: 6.75 };
  return g;
}
export function makeBakery() {
  const g = new THREE.Group();
  const wall = std('#ffb3cf'), trim = std('#ffffff'), roof = std('#8a3a5a');
  g.add(box(6, 4.2, 5, wall, 0, 2.1, 0, 0.08));
  // gable roof: two slabs
  for (const s of [-1, 1]) { const r = box(6.6, 0.3, 3.3, roof, 0, 5.0, s * 1.25, 0.05); r.rotation.x = s * 0.62; g.add(r); }
  g.add(box(0.5, 1.2, 0.5, std('#a05a3a'), 1.8, 5.6, -0.6));
  // awning (stripes)
  for (let i = 0; i < 8; i++) { const a = box(0.75, 0.08, 1.2, std(i % 2 ? '#ffffff' : '#ff4fa3'), -2.62 + i * 0.75, 3.15, 2.95); a.rotation.x = 0.35; g.add(a); }
  g.add(box(1.2, 2.2, 0.08, std('#7a1f2b'), 0.9, 1.1, 2.52, 0.04));
  g.add(box(2.4, 1.4, 0.08, std('#cfe8ff', { roughness: 0.2 }), -1.4, 1.6, 2.52, 0.04));
  // cake + bread in the window
  g.add(cyl(0.35, 0.35, 0.35, std('#fff0f5'), 14)).position.set(-1.8, 1.2, 2.6);
  g.add(box(0.7, 0.28, 0.3, std('#d89a4a'), -1.0, 1.1, 2.6, 0.12));
  const sign = textPlane(4.4, 0.9, labelTex(['BAKERY'], { w: 1024, h: 210, bg: '#fff4e0', fg: '#7a1f2b', border: '#7a1f2b', pad: 22 }));
  sign.position.set(0, 3.75, 2.56); g.add(sign);
  g.userData = { roofTop: 5.9 };
  return g;
}
export function makeChefHat() {
  const g = new THREE.Group();
  const w = std('#ffffff', { roughness: 0.9 });
  g.add(cyl(0.3, 0.3, 0.22, w, 16)).position.y = 0.11;
  for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; const p = sph(0.17, w, 12, 8); p.position.set(Math.cos(a) * 0.17, 0.36, Math.sin(a) * 0.17); g.add(p); }
  const top = sph(0.22, w, 14, 10); top.position.y = 0.42; g.add(top);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ tuba
export function makeTuba() {
  const g = new THREE.Group();
  const gold = std('#e8b830', { roughness: 0.25, metalness: 0.6, emissive: '#5a3a00', emissiveIntensity: 0.25 });
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 10, 28), gold); coil.castShadow = true; g.add(coil);
  const coil2 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 10, 24), gold); coil2.position.set(0, 0.05, 0.05); g.add(coil2);
  const pipe = cyl(0.09, 0.12, 0.7, gold, 12); pipe.position.set(-0.22, 0.45, 0); pipe.rotation.z = 0.25; g.add(pipe);
  const bell = cyl(0.42, 0.12, 0.55, gold, 24); bell.position.set(-0.36, 0.95, 0); bell.rotation.z = 0.25; g.add(bell);
  const bellIn = cyl(0.36, 0.36, 0.02, std('#3a2a00'), 24); bellIn.position.set(-0.43, 1.22, 0); bellIn.rotation.z = 0.25; g.add(bellIn);
  for (let i = 0; i < 3; i++) g.add(cyl(0.035, 0.035, 0.18, gold, 8)).position.set(0.1 + i * 0.07, 0.3, 0.08);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ mirror
function mirrorTex(mode) {
  return labelTexCustom('mirror:' + mode, 512, 960, (g, w, h) => {
    // base: pale sky reflection
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#9fd2ff'); sky.addColorStop(1, '#eaf6ff');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    if (mode === 'sky' || mode === 'tilt') {
      g.fillStyle = 'rgba(255,255,255,0.85)';
      for (const [x, y, r] of [[120, 220, 60], [190, 200, 80], [270, 230, 55], [360, 620, 70], [430, 600, 50]]) { g.beginPath(); g.arc(x, y, r, 0, PI * 2); g.fill(); }
      if (mode === 'sky') { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(40, 0, 50, h); g.fillRect(120, 0, 18, h); return; }
    }
    if (mode === 'face' || mode === 'tilt') {
      // Biscuit's whole face, small
      const cx = w / 2, cy = h * 0.55;
      g.fillStyle = '#5fcf4e'; g.beginPath(); g.roundRect(cx - 200, cy - 170, 400, 330, 70); g.fill();
      g.fillStyle = '#3f9f3a'; g.beginPath(); g.roundRect(cx - 150, cy + 60, 300, 120, 40); g.fill();
      for (const s of [-1, 1]) {
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + s * 95, cy - 150, 78, 0, PI * 2); g.fill();
        g.lineWidth = 8; g.strokeStyle = '#2f7a2c'; g.stroke();
        g.fillStyle = '#141418'; g.beginPath(); g.arc(cx + s * 95 + (mode === 'tilt' ? 18 : 0), cy - 140, 34, 0, PI * 2); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + s * 95 + 12, cy - 152, 10, 0, PI * 2); g.fill();
      }
      g.fillStyle = '#7a1428'; g.beginPath(); g.roundRect(cx - 140, cy + 30, 280, 40, 18); g.fill();
      g.fillStyle = '#fffaf0'; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(cx - 130 + i * 40, cy + 30); g.lineTo(cx - 110 + i * 40, cy + 60); g.lineTo(cx - 90 + i * 40, cy + 30); g.fill(); }
      g.fillStyle = '#ff9ab0'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 150, cy - 20, 30, 20, 0, 0, PI * 2); g.fill(); }
      g.fillStyle = '#e8232b'; g.fillRect(cx - 170, cy + 175, 340, 40);
      g.fillStyle = '#ffd23f'; g.beginPath(); g.roundRect(cx - 60, cy + 205, 120, 60, 24); g.fill();
    } else if (mode === 'eye' || mode === 'wide') {
      // one giant eye filling the glass (it is RIGHT in front of it)
      g.fillStyle = '#5fcf4e'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#4fb840'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(hash(i) * w, hash(i + 9) * h, 18 + hash(i + 4) * 26, 0, PI * 2); g.fill(); }
      const cx = w / 2, cy = h * 0.5, R = mode === 'wide' ? 245 : 210;
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, R, 0, PI * 2); g.fill();
      g.lineWidth = 16; g.strokeStyle = '#2f7a2c'; g.stroke();
      if (mode === 'eye') { g.fillStyle = '#3f9f3a'; g.beginPath(); g.arc(cx, cy, R + 8, PI * 1.08, PI * 1.92); g.lineTo(cx, cy - R * 0.4); g.fill(); }
      const pr = mode === 'wide' ? 34 : 110;
      g.fillStyle = '#141418'; g.beginPath(); g.arc(cx + (mode === 'wide' ? 0 : -10), cy + (mode === 'wide' ? 0 : 20), pr, 0, PI * 2); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + pr * 0.35, cy - pr * 0.3 + (mode === 'wide' ? 0 : 20), pr * 0.28, 0, PI * 2); g.fill();
      if (mode === 'wide') { g.strokeStyle = '#ff3a3a'; g.lineWidth = 5; for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2 + 0.3; g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)); g.lineTo(cx + Math.cos(a) * (R - 60), cy + Math.sin(a) * (R - 60) + 10); g.stroke(); } }
    }
    // glass sheen
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.beginPath(); g.moveTo(0, h * 0.25); g.lineTo(w * 0.35, 0); g.lineTo(w * 0.55, 0); g.lineTo(0, h * 0.42); g.fill();
  });
}
const _ctex = new Map();
function labelTexCustom(key, w, h, draw) { if (!_ctex.has(key)) _ctex.set(key, canvasTexture(w, h, (g) => draw(g, w, h))); return _ctex.get(key); }
export function makeMirror() {
  const g = new THREE.Group();
  const silver = std('#d6dae2', { roughness: 0.25, metalness: 0.7 }), dark = std('#5a5f6a', { roughness: 0.4, metalness: 0.4 });
  const W = 1.15, H = 2.1, cy = 1.5;
  g.add(box(W + 0.3, 0.18, 0.2, silver, 0, cy + H / 2 + 0.09, 0, 0.05));
  g.add(box(W + 0.3, 0.18, 0.2, silver, 0, cy - H / 2 - 0.09, 0, 0.05));
  for (const s of [-1, 1]) g.add(box(0.16, H + 0.36, 0.2, silver, s * (W / 2 + 0.07), cy, 0, 0.05));
  const crest = sph(0.16, silver, 12, 8); crest.position.set(0, cy + H / 2 + 0.3, 0); g.add(crest);
  g.add(box(W + 0.1, H + 0.1, 0.06, dark, 0, cy, -0.06));
  for (const s of [-1, 1]) { const f = box(0.12, 0.45, 0.5, silver, s * 0.5, 0.22, 0, 0.04); g.add(f); }
  const glassM = new THREE.MeshBasicMaterial({ map: mirrorTex('sky') });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), glassM); glass.position.set(0, cy, 0.02); g.add(glass);
  // red/white barber stripe on the side post
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 10), new THREE.MeshStandardMaterial({ map: labelTexCustom('barber', 64, 256, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8232b'; for (let i = -4; i < 12; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(w, i * 32 + 32); c.lineTo(w, i * 32 + 48); c.lineTo(0, i * 32 + 16); c.fill(); } }), roughness: 0.4 }));
  stripe.position.set(W / 2 + 0.07, cy + H / 2 + 0.45, 0); g.add(stripe);
  g.userData = { glass, W, H, cy, set(mode = 'sky') { glassM.map = mirrorTex(mode); } };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ shockwave + clouds
export function makeShockRing() {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false, fog: false, side: THREE.DoubleSide });
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 64), m); g.add(r1);
  const m2 = m.clone(); m2.color.set('#bfeaff'); m2.opacity = 0.5;
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 64), m2); g.add(r2);
  g.userData = {
    set(u, maxR = 60) {
      g.visible = u > 0 && u < 1.2;
      if (!g.visible) return;
      const k = ease.outCubic(clamp(u / 1.1, 0, 1));
      r1.scale.setScalar(1 + k * maxR); r2.scale.setScalar(0.6 + k * maxR * 0.75);
      m.opacity = 0.9 * (1 - k); m2.opacity = 0.55 * (1 - k);
    },
  };
  return g;
}
export function makeBoxClouds(n = 9, seed = 2) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.35, fog: false });
  const list = [];
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group();
    const k = 3 + Math.floor(hash(i * 3.1 + seed) * 3);
    for (let j = 0; j < k; j++) {
      const s = 5 + hash(i * 7 + j + seed) * 6;
      const b = new THREE.Mesh(rgeo(s * 1.3, s * 0.8, s, s * 0.12), m);
      b.position.set((j - (k - 1) / 2) * s * 0.8, (hash(i + j * 2.2) - 0.3) * s * 0.4 + (j % 2 ? s * 0.25 : 0), (hash(j * 1.3 + i) - 0.5) * s * 0.5);
      c.add(b);
    }
    g.add(c);
    list.push({ c, x: (hash(i * 1.9 + seed) - 0.5) * 160, y: 45 + hash(i * 2.7 + seed) * 25, z: (hash(i * 4.3 + seed) - 0.5) * 40, sp: 0.6 + hash(i * 5.5) * 0.8 });
  }
  g.userData = {
    list,
    set(t, push = 0, dir = V(1, 0, 0)) {
      for (const it of list) {
        const d = push * (180 + 60 * it.sp);
        it.c.position.set(it.x + t * 0.4 * it.sp + dir.x * d, it.y + dir.y * d, it.z + dir.z * d);
        it.c.rotation.z = push * 0.3 * it.sp;
      }
    },
  };
  g.userData.set(0, 0);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ mountain
export function makeMountain() {
  const g = new THREE.Group();
  const geo = new THREE.ConeGeometry(58, 66, 9, 4);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y > 32.9) continue;
    const a = Math.atan2(z, x), j = 1 + 0.12 * Math.sin(a * 3 + y * 0.1) + 0.08 * Math.sin(a * 7);
    pos.setXYZ(i, x * j, y + 4 * Math.sin(a * 5) * (1 - (y + 33) / 66), z * j);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#4f9a48', roughness: 0.95, flatShading: true }));
  m.position.y = 33; m.receiveShadow = true; g.add(m);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(15.5, 17.6, 9, 1), new THREE.MeshStandardMaterial({ color: '#8a8a7a', roughness: 0.9, flatShading: true }));
  cap.position.y = 57.3; g.add(cap);
  const snow = new THREE.Mesh(new THREE.ConeGeometry(7.2, 8.2, 9, 1), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, flatShading: true }));
  snow.position.y = 62; g.add(snow);
  // a few boulders and pines on the slopes
  for (let i = 0; i < 14; i++) {
    const a = hash(i * 1.3) * PI * 2, r = 20 + hash(i * 2.1) * 30, y = 66 * (1 - r / 58) * 0.95;
    const t = cone(2.2, 6, std(i % 2 ? '#2f6e3a' : '#357a3e'), 6); t.position.set(Math.cos(a) * r, y + 2.5, Math.sin(a) * r); g.add(t);
  }
  g.userData = { peak: 66 };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ costumes
/** Dinosaur hood for a human head (head-local: the head box is 0.64 wide, 0.58 tall, top at y ≈ 0.58). */
export function makeDinoHood(color = '#5fcf4e') {
  const g = new THREE.Group();
  const m = std(color, { roughness: 0.75 }), sp = std('#ff9a2a', { roughness: 0.55 }), wht = std('#ffffff', { roughness: 0.4 });
  g.add(box(0.76, 0.22, 0.7, m, 0, 0.66, -0.02, 0.08));      // crown
  g.add(box(0.76, 0.6, 0.14, m, 0, 0.36, -0.33, 0.06));       // back
  for (const s of [-1, 1]) g.add(box(0.1, 0.5, 0.62, m, s * 0.37, 0.4, -0.02, 0.04));
  g.add(box(0.7, 0.14, 0.26, m, 0, 0.74, 0.36, 0.06));         // snout visor over the face
  for (let i = 0; i < 5; i++) { const tt = cone(0.035, 0.08, wht, 4); tt.rotation.x = PI; at(g, tt, -0.24 + i * 0.12, 0.64, 0.46); }
  for (const s of [-1, 1]) { const e = sph(0.07, basic('#ffffff'), 10, 8); at(g, e, s * 0.18, 0.84, 0.3); const p = sph(0.035, basic('#141418'), 8, 6); at(g, p, s * 0.18, 0.86, 0.36); }
  for (let i = 0; i < 4; i++) { const c = cone(0.07, 0.2, sp, 4); c.rotation.x = -0.3 - i * 0.3; at(g, c, 0, 0.82 - i * 0.09, 0.12 - i * 0.16); }
  return g;
}
/** Grandma's costume: body shell around a (scale 0.9) character standing at the origin + a big hinged mask over her head. */
export function makeGrandmaSuit() {
  const g = new THREE.Group();
  const m = std('#3d7a3a', { roughness: 0.7 }), md = std('#2a5a2a', { roughness: 0.75 }), bel = std('#9ab870', { roughness: 0.8 });
  const sp = std('#6a2a1a', { roughness: 0.6 }), tooth = std('#f4efdc', { roughness: 0.35 }), mouth = std('#3a0a10');
  const bodyG = grp(g);
  bodyG.add(box(1.25, 0.98, 1.0, m, 0, 0.83, -0.05, 0.2));
  bodyG.add(box(0.9, 0.78, 0.1, bel, 0, 0.82, 0.47, 0.04));
  for (const s of [-1, 1]) { bodyG.add(box(0.5, 0.75, 0.55, m, s * 0.3, 0.38, 0.0, 0.12)); bodyG.add(box(0.5, 0.18, 0.75, md, s * 0.3, 0.09, 0.12, 0.05)); for (let k = -1; k <= 1; k++) { const c = cone(0.05, 0.16, tooth, 4); c.rotation.x = PI / 2; at(bodyG, c, s * 0.3 + k * 0.14, 0.08, 0.55); } }
  // tail
  const tail = [];
  let tp = grp(bodyG, 0, 0.75, -0.5);
  for (let i = 0; i < 5; i++) { const w = lerp(0.6, 0.18, i / 4); const seg = i === 0 ? tp : grp(tp, 0, 0, -0.5); seg.add(box(w, w * 0.9, 0.55, m, 0, 0, -0.25, 0.08)); const c = cone(w * 0.25, w * 0.5, sp, 4); c.rotation.set(-0.4, PI / 4, 0); at(seg, c, 0, w * 0.5, -0.25); tail.push(seg); tp = seg; }
  for (let i = 0; i < 4; i++) { const c = cone(0.12, 0.32, sp, 4); c.rotation.set(-PI / 2 + 0.2, PI / 4, 0); at(bodyG, c, 0, 0.6 + i * 0.28, -0.56); }
  // tiny costume arms (stubby, at the chest)
  for (const s of [-1, 1]) { const a = box(0.16, 0.32, 0.16, m, s * 0.5, 1.12, 0.5, 0.05); a.rotation.x = -0.9; bodyG.add(a); }
  // the mask: hinge behind the head top, at y ≈ 1.95 (character scale 0.9 → head pivot ≈ 1.27, top ≈ 1.8)
  const hinge = grp(g, 0, 1.92, -0.38);
  const maskG = grp(hinge, 0, 0, 0.38);
  maskG.add(box(1.0, 0.85, 1.05, m, 0, 0.05, 0.05, 0.18));
  maskG.add(box(0.9, 0.5, 0.9, m, 0, -0.05, 0.85, 0.14));
  maskG.add(box(0.8, 0.12, 0.85, mouth, 0, -0.32, 0.8));
  for (let i = 0; i < 6; i++) { const c = cone(0.05, 0.18, tooth, 4); c.rotation.x = PI; at(maskG, c, -0.3 + i * 0.12, -0.36, 1.25); }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const c = cone(0.045, 0.16, tooth, 4); c.rotation.x = PI; at(maskG, c, s * 0.42, -0.36, 0.55 + i * 0.18); }
  const brow = box(1.04, 0.16, 0.3, md, 0, 0.38, 0.5, 0.05); maskG.add(brow);
  const eyeM = new THREE.MeshBasicMaterial({ color: '#ff2a1a', toneMapped: false });
  const eyes = [];
  for (const s of [-1, 1]) { const e = sph(0.1, eyeM, 12, 10); e.scale.set(1.2, 0.8, 0.6); at(maskG, e, s * 0.3, 0.26, 0.58); eyes.push(e); }
  for (let i = 0; i < 4; i++) { const c = cone(0.1, 0.3, sp, 4); c.rotation.set(-0.5 - i * 0.25, PI / 4, 0); at(maskG, c, 0, 0.5 - i * 0.12, 0.1 - i * 0.25); }
  for (const s of [-1, 1]) maskG.add(box(0.14, 0.08, 0.06, std('#1a0a0a'), s * 0.2, 0.06, 1.31));
  const jaw = grp(maskG, 0, -0.32, 0.2);
  jaw.add(box(0.82, 0.22, 1.05, m, 0, -0.1, 0.5, 0.08));
  for (let i = 0; i < 5; i++) { const c = cone(0.045, 0.15, tooth, 4); at(jaw, c, -0.24 + i * 0.12, 0.06, 0.95); }
  g.userData = {
    hinge, maskG, jaw, eyes, eyeM, tail, bodyG,
    set(t, { mask = 0, jaw: jw = 0, glow = 1, roar = 0, tail: tw = 0.5 } = {}) {
      hinge.rotation.x = -mask * 1.9;
      jaw.rotation.x = clamp(jw + roar * 0.6, 0, 1) * 0.75;
      eyeM.color.setRGB(1.0 * (0.4 + 0.8 * glow), 0.16 * glow, 0.08 * glow);
      eyes.forEach((e) => e.scale.set(1.2 * (1 + roar * 0.3), 0.8 * (1 + roar * 0.3), 0.6));
      tail.forEach((s, i) => { s.rotation.set(i === 0 ? -0.35 : 0.05, tw * 0.25 * Math.sin(t * 3 - i * 0.6), 0); });
    },
  };
  g.userData.set(0, {});
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════════════════ signs + small things
export function makeArrowSign(lines = ['DINOSAUR', 'PARK'], { color = '#ffd23f' } = {}) {
  const g = new THREE.Group();
  const wood = std('#8a5a2e', { roughness: 0.9 });
  g.add(box(0.22, 3.4, 0.22, wood, 0, 1.7, 0, 0.04));
  const shape = new THREE.Shape();
  shape.moveTo(-2.1, 0); shape.lineTo(-1.35, 0.75); shape.lineTo(-1.35, 0.42); shape.lineTo(1.5, 0.42); shape.lineTo(1.5, -0.42); shape.lineTo(-1.35, -0.42); shape.lineTo(-1.35, -0.75); shape.closePath();
  const ex = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
  const board = new THREE.Mesh(ex, std(color, { roughness: 0.6 })); board.position.set(0, 2.8, 0.12); board.castShadow = true; g.add(board);
  const edge = new THREE.Mesh(ex, std('#5a3a1a')); edge.scale.set(1.04, 1.12, 0.6); edge.position.set(0, 2.8, 0.1); g.add(edge);
  const txt = textPlane(2.7, 0.76, labelTex(lines, { w: 900, h: 256, bg: null, border: null, fg: '#2a1a0a', pad: 12 }));
  txt.position.set(0.1, 2.8, 0.25); g.add(txt);
  // little dinosaur footprint plaque
  const plaque = textPlane(1.0, 0.4, labelTex(['ESTD. 1999'], { w: 512, h: 200, bg: '#efe2c0', fg: '#5a3a1a', border: '#5a3a1a', pad: 20, display: false }));
  plaque.position.set(0, 1.9, 0.12); g.add(plaque);
  return g;
}
export function makeBroom() {
  const g = new THREE.Group();
  const h = cyl(0.03, 0.03, 1.6, std('#c99a5a'), 8); h.position.y = 0.1; g.add(h);
  g.add(box(0.6, 0.12, 0.14, std('#8a5a2e'), 0, 0.92, 0, 0.03));
  g.add(box(0.58, 0.2, 0.12, std('#e8d080', { roughness: 1 }), 0, 1.08, 0, 0.02));
  return g;
}
export function makeDogBowl() {
  const g = new THREE.Group();
  const red = std('#e8232b', { roughness: 0.45 });
  const outer = cyl(1.0, 1.25, 0.8, red, 28); outer.position.y = 0.4; g.add(outer);
  const inner = cyl(0.88, 0.88, 0.05, std('#7a1018'), 28); inner.position.y = 0.79; g.add(inner);
  const food = cyl(0.84, 0.84, 0.2, std('#b07a3a', { roughness: 1 }), 20); food.position.y = 0.72; g.add(food);
  for (let i = 0; i < 18; i++) { const k = box(0.18, 0.12, 0.18, std(i % 2 ? '#8a5a2e' : '#c08a4a'), Math.cos(i * 2.4) * 0.6 * hash(i), 0.86, Math.sin(i * 2.4) * 0.6 * hash(i), 0.04); k.rotation.y = i; g.add(k); }
  const lbl = textPlane(1.5, 0.42, labelTex(['BISCUIT'], { w: 768, h: 210, bg: null, border: null, fg: '#ffffff', pad: 14 }), { basicMat: false });
  lbl.position.set(0, 0.42, 1.14); lbl.rotation.x = -0.15; g.add(lbl);
  return g;
}
export function makeHats(n = 24) {
  const g = new THREE.Group();
  const cols = ['#e8232b', '#4fb3ff', '#ffd23f', '#3ee0c8', '#ff4fa3', '#8a5cff'];
  const geoC = new THREE.CylinderGeometry(0.2, 0.22, 0.16, 12).translate(0, 0.08, 0);
  const geoB = new THREE.BoxGeometry(0.34, 0.03, 0.22).translate(0, 0.01, 0.18);
  const ims = [];
  for (const c of cols) { const a = new THREE.InstancedMesh(geoC, std(c), Math.ceil(n / cols.length)); const b = new THREE.InstancedMesh(geoB, std(c), Math.ceil(n / cols.length)); a.frustumCulled = b.frustumCulled = false; g.add(a, b); ims.push([a, b]); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s = V(1, 1, 1);
  g.userData = {
    set(list, u) {
      for (let i = 0; i < n; i++) {
        const [a, b] = ims[i % cols.length], k = Math.floor(i / cols.length);
        const it = list[i];
        if (!it) { m4.makeScale(0, 0, 0); a.setMatrixAt(k, m4); b.setMatrixAt(k, m4); continue; }
        const uu = Math.max(0, u);
        p.copy(it.p0).addScaledVector(it.v, uu); p.y += -2.5 * uu * uu;
        e.set(it.spin * uu * 5, it.spin * uu * 3, it.spin * uu * 4); q.setFromEuler(e);
        m4.compose(p, q, s); a.setMatrixAt(k, m4); b.setMatrixAt(k, m4);
      }
      ims.forEach(([a, b]) => { a.instanceMatrix.needsUpdate = true; b.instanceMatrix.needsUpdate = true; });
    },
  };
  return g;
}
export function makeBubbles(n = 30) {
  const g = new THREE.Group();
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, transparent: true, opacity: 0.85, emissive: '#cfefff', emissiveIntensity: 0.4 }), n);
  im.frustumCulled = false; g.add(im);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V();
  g.userData = {
    set(t, a = 1, spread = 1.4) {
      for (let i = 0; i < n; i++) {
        const u = (t * (0.4 + 0.3 * hash(i * 1.1)) + hash(i * 2.2)) % 1;
        p.set((hash(i * 3.3) - 0.5) * spread * 2 + 0.2 * Math.sin(t * 2 + i), u * 2.2, (hash(i * 4.4) - 0.5) * spread);
        s.setScalar(a * (0.4 + 1.2 * hash(i * 5.5)) * Math.sin(PI * u) + 0.0001);
        m4.compose(p, q, s); im.setMatrixAt(i, m4);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}
export function makeSpeech(text, { w = 2.4, color = '#ffffff', fg = '#1d1d22' } = {}) {
  const tex = labelTexCustom('speech:' + text + color, 640, 400, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = color; g.strokeStyle = '#1d1d22'; g.lineWidth = 14;
    g.beginPath(); g.roundRect(20, 20, W - 40, H - 120, 80); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(W * 0.3, H - 104); g.lineTo(W * 0.22, H - 20); g.lineTo(W * 0.46, H - 104); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = color; g.fillRect(W * 0.3 - 2, H - 112, W * 0.17, 16);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const s = fit(g, text, FONTD, W - 110, 170); g.fillStyle = fg; g.fillText(text, W / 2, (H - 100) / 2 + 12);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, fog: false }));
  sp.center.set(0.25, 0); sp.renderOrder = 10;
  sp.userData = { set(k) { sp.visible = k > 0.01; sp.scale.set(w * k, w * 0.625 * k, 1); } };
  sp.userData.set(1);
  return sp;
}
