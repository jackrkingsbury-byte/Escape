// In This Town — Episode 25 "Nugget": props.  Same conventions as src/props.js (SPEC.md §2/§7): ES module, metres,
// Y up, feet/base at the origin, facing +Z, deterministic (no Math.random / clocks); every animated prop exposes
// userData.set(t, o) (pure function of its arguments — every call sets every animated value).
//
// Exports
//   makeChicken()            Nugget: white blocky hen ≈ 1.25 m tall (back at ≈ 0.86 m: a kid straddling her keeps his feet
//                            flat on the ground).  set(t, { walk, walkSpeed, peck 0..1, flap 0..1, spread 0..1, sit 0..1,
//                            puff 0..1, wiggle 0..1, lid (null = auto blink), squint 0..1, smug 0..1, lookX, lookY, pupil,
//                            headYaw, headPitch, beak 0..1, pitch, bob })
//   makeTriceratops(c)       rideable triceratops (back ≈ 2.6 m, 5.6 m long).  set(t, o) + userData.seat (rider root)
//   makeRaptor(c)            purple raptor 'Sprinkles' build (≈ 2.9 m, upright).  set(t, o) + userData.seat
//   makeStego(c)             stegosaurus filler racer (plates ≈ 3.3 m).  set(t, o) + userData.seat
//   makeLongneck(c)          long-neck (head ≈ 11.5 m up).  set(t, o) — o.tip 0..1 tips it over its +X side;
//                            userData.seat (on top of the head), userData.parts.head
//      Common dino o:        walk (gait amplitude 0..1), gait (rad/s), run (0..1 more bounce), headYaw, headPitch, jaw 0..1,
//                            lookX, lookY (−1..1), lid (0 open … 1 shut, null = auto blink), pupil (scale), roll, pitch,
//                            tailYaw, kick (legs flail 0..1, for the pile-up), shake 0..1 (scared tremble)
//   makeFence(o)             plank wall with the DINOSAUR PARK gate, along X, front +Z, ≈ 26 m wide, 6 m tall.
//                            set(t, { fallL, fallC, fallR (0..1 tip toward +Z), gate 0..1 (open), fixed 0..1 (boards appear) })
//   makeTower()              clock tower with an open belfry and a big gold bell, front steps on +Z.  ≈ 18.8 m.
//                            set(t, { swing (bell angle, rad), glint 0..1, crumble (seconds since the top broke, <0 = intact) })
//                            userData.bellWorld() / topWorld() / stepTop (Object3D at the top of the front steps)
//                            userData.TOP_Y, BELL_Y
//   makeEgg()                the giant egg, unit size (2.6 tall, r 1): scale it.  set(t, { crack 0..1, glow 0..1, wobble 0..1,
//                            shake 0..1 }) — crack is a zigzag across the +Z face with light leaking out
//   makeRaceStage()          the starter's stage on a fulcrum (deck ≈ 1.25 m, long axis X).  set(tilt rad: + lifts the +X end)
//                            userData.spot (Object3D at the +X end of the deck where the mayor stands)
//   makeStartLine(w)         chalk start line + START arch on two poles (spans z = ±w/2, line along Z at x = 0)
//   makeFlag()               checkered starter flag on a stick (grip at the origin, stick along +Y)
//   makeClipboard()          sign-up clipboard (grip at the origin, face +Z)
//   makeHammer(), makeKeepOut(), makeEnvelopes(n), makeCrumb(), makeShades(), makeTopHat(), makeJungleTree(seed, h)
//   makeBanner(lines, o)     a free-standing vinyl banner on two posts (front +Z)
//   makeDust(o)              big grey dust cloud (instanced spheres): set(u) u = seconds since the burst
//   makeStars(n)             cartoon dizzy stars ring: set(t, k)
//   labelTex(lines, o)       canvas text texture (auto-fit)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, hash, ease, canvasTexture } from '../lib/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const FONTD = (s) => `${s}px "ITT World Display", "ITT Luckiest", "Luckiest Guy", Impact, "DejaVu Sans", sans-serif`;
const FONTW = (s) => `900 ${s}px "ITT World Text", "ITT Nunito", "Nunito", "DejaVu Sans", Arial, sans-serif`;

// ───────────────────────────────────────────────────────────────────────────── builders
const _mats = new Map();
export function std(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!_mats.has(k)) _mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o }));
  return _mats.get(k);
}
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const _geo = new Map();
function rgeo(w, h, d, r) {
  const k = `${w}|${h}|${d}|${r}`;
  if (!_geo.has(k)) _geo.set(k, r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01)) : new THREE.BoxGeometry(w, h, d));
  return _geo.get(k);
}
function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0) {
  const o = new THREE.Mesh(rgeo(w, h, d, r), typeof m === 'string' ? std(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function cyl(rt, rb, h, m, seg = 16) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; o.receiveShadow = true; return o; }
function cone(r, h, m, seg = 8) { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function sph(r, m, ws = 16, hs = 12) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function at(parent, o, x = 0, y = 0, z = 0) { o.position.set(x, y, z); parent.add(o); return o; }
function grp(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; }
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }

const _tex = new Map();
function tex(key, w, h, draw) { if (!_tex.has(key)) _tex.set(key, canvasTexture(w, h, draw)); return _tex.get(key); }
/** Canvas text texture: lines are shrunk until they fit (never cropped). */
export function labelTex(lines, { w = 1024, h = 320, bg = '#ffd23f', fg = '#1d1d22', border = '#1d1d22', bw = 18, display = true, radius = 40, pad = 60, stroke = null } = {}) {
  return tex('lab:' + lines.join('|') + [w, h, bg, fg, border, display, stroke].join(','), w, h, (g) => {
    g.clearRect(0, 0, w, h);
    if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(bw / 2, bw / 2, w - bw, h - bw, radius); g.fill(); }
    if (border) { g.strokeStyle = border; g.lineWidth = bw; g.beginPath(); g.roundRect(bw / 2, bw / 2, w - bw, h - bw, radius); g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length, lh = (h - pad) / n;
    lines.forEach((ln, i) => {
      const s = fit(g, ln, display ? FONTD : FONTW, w - pad * 2, Math.min(lh * 0.86, 260));
      const y = pad / 2 + lh * (i + 0.5) + s * 0.06;
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = s * 0.14; g.lineJoin = 'round'; g.strokeText(ln, w / 2, y); }
      g.fillStyle = fg; g.fillText(ln, w / 2, y);
    });
  });
}
function plane(w, h, map, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map, roughness: 0.7, transparent: !!o.transparent, side: o.double ? THREE.DoubleSide : THREE.FrontSide, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: o.glow ?? 0.15 }));
  m.receiveShadow = true; return m;
}

// ─── cartoon eye (white ball + pupil + skin lid)
function makeEye(parent, r, x, y, z, lidMat, { yaw = 0, pitch = 0 } = {}) {
  const g = grp(parent, x, y, z); g.rotation.set(pitch, yaw, 0);
  g.add(sph(r, std('#ffffff', { roughness: 0.25 }), 16, 12));
  const piv = grp(g);
  const pupil = sph(r * 0.56, std('#151515', { roughness: 0.25 }), 12, 10); pupil.scale.set(1, 1, 0.5); at(piv, pupil, 0, 0, r * 0.8);
  const shine = sph(r * 0.17, basic('#ffffff'), 8, 6); at(piv, shine, r * 0.2, r * 0.22, r * 0.98);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(r * 1.08, 16, 8, 0, PI * 2, 0, PI / 2), lidMat); g.add(lid);
  const low = new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 16, 8, 0, PI * 2, 0, PI / 2), lidMat); g.add(low);
  return {
    g, set(lookX = 0, lookY = 0, lidK = 0, ps = 1, lowK = 0) {
      piv.rotation.set(-lookY * 0.55, lookX * 0.6, 0);
      pupil.scale.set(ps, ps, 0.5); shine.visible = ps > 0.5;
      lid.rotation.x = lerp(-PI / 2 - 0.25, PI / 2 - 0.02, clamp(lidK, 0, 1));
      low.rotation.x = PI - lerp(-PI / 2 - 0.25, PI / 2 - 0.1, clamp(lowK, 0, 0.5));
    },
  };
}
const autoBlink = (t, ph = 0, per = 3.3) => (((t + ph) % per) + per) % per < 0.13 ? 1 : 0;

// ═════════════════════════════════════════════════════════════════════════════ Nugget
export function makeChicken() {
  const root = new THREE.Group(); root.name = 'nugget';
  const W = std('#fbf8ef', { roughness: 0.85 }), Wd = std('#ebe3d2', { roughness: 0.85 }), R = std('#e8232b', { roughness: 0.5 }), O = std('#ff9a1f', { roughness: 0.5 });
  const legs = {};
  for (const s of [-1, 1]) {
    const leg = grp(root, s * 0.15, 0.36, 0.0);
    leg.add(at(grp(null), cyl(0.04, 0.035, 0.36, O, 8), 0, -0.18, 0));
    const foot = grp(leg, 0, -0.345, 0.02);
    for (const a of [-0.55, 0, 0.55]) { const toe = box(0.055, 0.04, 0.2, O, Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08 + 0.02, 0.015); toe.rotation.y = a; foot.add(toe); }
    foot.add(box(0.045, 0.035, 0.09, O, 0, 0, -0.07, 0.01));
    legs[s < 0 ? 'R' : 'L'] = leg;
  }
  const body = grp(root, 0, 0.62, 0);
  const torso = grp(body);
  torso.add(box(0.7, 0.56, 0.8, W, 0, 0, -0.02, 0.22));
  torso.add(box(0.6, 0.5, 0.34, W, 0, -0.03, 0.3, 0.17));
  torso.add(box(0.5, 0.12, 0.5, Wd, 0, -0.27, 0, 0.05));
  for (let i = 0; i < 3; i++) { const f = box(0.13, 0.42, 0.09, i === 1 ? W : Wd, (i - 1) * 0.14, 0.3, -0.38, 0.045); f.rotation.set(-0.55, 0, (i - 1) * -0.3); torso.add(f); }
  const wings = {};
  for (const s of [-1, 1]) {
    const w = grp(body, s * 0.36, 0.17, 0.02);
    const m = box(0.08, 0.36, 0.54, Wd, s * 0.02, -0.17, -0.03, 0.04); w.add(m);
    for (let k = 0; k < 3; k++) w.add(box(0.07, 0.12, 0.16, W, s * 0.02, -0.38, -0.2 + k * 0.17, 0.03));
    wings[s < 0 ? 'R' : 'L'] = w;
  }
  const neck = grp(body, 0, 0.18, 0.27);
  neck.add(box(0.32, 0.36, 0.32, W, 0, 0.12, 0.02, 0.12));
  const head = grp(neck, 0, 0.3, 0.06);
  head.add(box(0.44, 0.42, 0.4, W, 0, 0.13, 0.02, 0.13));
  for (const [y, z, s] of [[0.4, 0.13, 0.12], [0.45, 0.0, 0.15], [0.39, -0.13, 0.11]]) head.add(box(0.09, s * 1.25, s, R, 0, y, z, 0.04));
  const beakTop = cone(0.08, 0.2, O, 4); beakTop.rotation.set(PI / 2, 0, PI / 4); beakTop.scale.set(1, 1, 0.7); at(head, beakTop, 0, 0.09, 0.31);
  const jaw = grp(head, 0, 0.05, 0.22);
  const beakLow = cone(0.06, 0.15, O, 4); beakLow.rotation.set(PI / 2, 0, PI / 4); beakLow.scale.set(1, 1, 0.5); at(jaw, beakLow, 0, -0.01, 0.08);
  head.add(box(0.08, 0.14, 0.06, R, 0, -0.06, 0.25, 0.03));
  // brows (for smug / determined)
  const brows = [-1, 1].map((s) => at(head, box(0.12, 0.03, 0.03, std('#c9bfae'), s * 0.11, 0.31, 0.225, 0.01), s * 0.11, 0.31, 0.225));
  const eyes = [-1, 1].map((s) => makeEye(head, 0.075, s * 0.11, 0.21, 0.17, W, { yaw: s * 0.12 }));
  const parts = { body, torso, neck, head, wings, legs, jaw };
  root.userData = {
    parts,
    set(t, o = {}) {
      const walk = o.walk ?? 0, ph = t * (o.walkSpeed ?? 9), peck = o.peck ?? 0, sit = o.sit ?? 0;
      const flap = o.flap ?? 0, spread = o.spread ?? 0, puff = o.puff ?? 0, wig = o.wiggle ?? 0;
      legs.L.rotation.x = walk * 0.65 * Math.sin(ph); legs.R.rotation.x = -walk * 0.65 * Math.sin(ph);
      legs.L.visible = legs.R.visible = sit < 0.85;
      body.position.set(wig * 0.05 * Math.sin(t * 25), 0.62 + walk * 0.05 * Math.abs(Math.cos(ph)) - sit * 0.3 + (o.bob ?? 0), 0);
      body.rotation.set(peck * 0.45 + (o.pitch ?? 0), walk * 0.08 * Math.sin(ph), wig * 0.2 * Math.sin(t * 24));
      const ps = 1 + puff * 0.22; torso.scale.set(ps, ps * (1 + 0.05 * puff), ps);
      neck.rotation.set(peck * 1.15 + (o.headPitch ?? 0), o.headYaw ?? 0, 0);
      neck.position.z = 0.27 + walk * 0.07 * Math.sin(ph * 2) + puff * 0.05;
      head.rotation.set(-peck * 0.4, 0, 0);
      jaw.rotation.x = (o.beak ?? 0) * 0.6;
      for (const [k, s] of [['L', 1], ['R', -1]]) {
        const w = wings[k];
        const f = flap * (0.25 + 1.05 * (0.5 + 0.5 * Math.sin(t * 34 + (s > 0 ? 0 : 0.3))));
        w.rotation.set(0, 0, s * (f + spread * 1.75 + puff * 0.25));
        w.position.x = s * (0.36 + puff * 0.08);
      }
      const lid = o.lid ?? autoBlink(t, 0.7, 2.9), sq = o.squint ?? 0, smug = o.smug ?? 0;
      eyes.forEach((e) => e.set(o.lookX ?? 0, o.lookY ?? 0, Math.max(lid, sq * 0.55, smug * 0.42), o.pupil ?? 1, sq * 0.45));
      brows.forEach((b, i) => { const s = i ? 1 : -1; b.visible = sq > 0.1 || smug > 0.1 || (o.brow ?? 0) !== 0; b.rotation.z = s * (sq * 0.5 - smug * 0.15 + (o.brow ?? 0) * 0.4); b.position.y = 0.31 - sq * 0.04 - smug * 0.03; });
    },
  };
  root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════════════════════════════════════ dinosaurs
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }
function quadLegs(body, skin, dark, pts, len, w) {
  const legs = [];
  for (const [x, z] of pts) {
    const g = grp(body, x, 0, z);
    g.add(box(w, len, w * 1.05, skin, 0, -len / 2, 0, w * 0.25));
    g.add(box(w * 1.18, 0.24, w * 1.3, dark, 0, -len + 0.06, 0.05, 0.08));
    for (const cx of [-0.3, 0, 0.3]) g.add(box(0.1, 0.1, 0.08, std('#fff4e0'), cx * w, -len + 0.03, w * 0.68, 0.03));
    legs.push(g);
  }
  return legs;
}
function tailChain(parent, skin, n, w0, w1, len, droop = 0.05) {
  const segs = []; let p = parent;
  for (let i = 0; i < n; i++) {
    const w = lerp(w0, w1, i / Math.max(1, n - 1));
    const g = grp(p, 0, 0, i === 0 ? 0 : -len * 0.92);
    g.add(box(w, w * 0.9, len, skin, 0, 0, -len / 2, Math.min(0.25, w * 0.22)));
    g.rotation.x = droop;
    segs.push(g); p = g;
  }
  return segs;
}
/** shared animator for quadrupeds + bipeds */
function dinoSet(P, t, o, { quad = true, baseY, bob = 0.08, eyePh = 0 }) {
  const walk = o.walk ?? 0, run = o.run ?? 0, ph = t * (o.gait ?? 6.5), kick = o.kick ?? 0, sh = o.shake ?? 0;
  const amp = walk * (0.45 + 0.35 * run);
  if (quad) {
    P.legs.forEach((l, i) => {
      const s = (i === 0 || i === 3) ? 1 : -1;
      l.rotation.set(s * amp * Math.sin(ph) + kick * 0.9 * Math.sin(t * 13 + i * 1.7), 0, kick * 0.3 * Math.sin(t * 9 + i));
    });
  } else {
    P.legs.forEach((l, i) => {
      const s = i ? 1 : -1;
      l.thigh.rotation.x = s * amp * 1.1 * Math.sin(ph) - 0.15 * run + kick * 1.0 * Math.sin(t * 13 + i * 2);
      l.shin.rotation.x = 0.35 + amp * 0.6 * Math.max(0, Math.sin(ph * s + 1.2)) + kick * 0.5;
      l.foot.rotation.x = -0.2 - amp * 0.3 * Math.sin(ph * s);
    });
  }
  const b = walk * bob * (1 + run) * Math.abs(Math.sin(ph));
  P.body.position.set(sh * 0.05 * Math.sin(t * 41), baseY + b + (o.lift ?? 0), sh * 0.04 * Math.sin(t * 37));
  P.body.rotation.set((o.pitch ?? 0) + walk * 0.03 * Math.sin(ph * 2), (o.yaw ?? 0) + walk * 0.05 * Math.sin(ph), (o.roll ?? 0) + walk * 0.04 * Math.sin(ph));
  P.neck.rotation.set((o.headPitch ?? 0) + walk * 0.06 * Math.sin(ph * 2 + 0.5), o.headYaw ?? 0, (o.headRoll ?? 0));
  if (P.jaw) P.jaw.rotation.x = (o.jaw ?? 0) * 0.55;
  P.tail.forEach((s, i) => { s.rotation.y = (o.tailYaw ?? 0) / P.tail.length + 0.12 * Math.sin(t * 3.1 - i * 0.7) * (0.4 + walk) + kick * 0.25 * Math.sin(t * 11 + i); });
  const lid = o.lid ?? autoBlink(t, eyePh, 3.1);
  P.eyes.forEach((e) => e.set(o.lookX ?? 0, o.lookY ?? 0, lid, o.pupil ?? 1, o.lowLid ?? 0));
}

export function makeTriceratops(color = '#2fc4b2', { frill = '#ffb23f', saddle = '#e8232b' } = {}) {
  const root = new THREE.Group(); root.name = 'triceratops';
  const skin = std(color, { roughness: 0.65 }), dark = std(shade(color, 0.7)), bel = std(shade(color, 1.35)), hornM = std('#fff4d6', { roughness: 0.4 });
  const body = grp(root, 0, 1.85, 0);
  body.add(box(2.1, 1.7, 3.6, skin, 0, 0, 0, 0.5));
  body.add(box(1.7, 0.3, 3.0, bel, 0, -0.74, 0.1, 0.12));
  for (let i = 0; i < 4; i++) body.add(box(0.5, 0.08, 0.6, dark, (hash(i * 3.1) - 0.5) * 1.2, 0.84, -1.2 + i * 0.7, 0.04));
  const legs = quadLegs(body, skin, dark, [[0.72, 1.15], [-0.72, 1.15], [0.72, -1.15], [-0.72, -1.15]], 1.42, 0.62);
  legs.forEach((l) => { l.position.y = -0.45; });
  const neck = grp(body, 0, 0.1, 1.75);
  const head = grp(neck, 0, 0, 0);
  head.add(box(1.2, 1.05, 1.3, skin, 0, -0.05, 0.6, 0.32));
  head.add(box(0.7, 0.6, 0.55, skin, 0, -0.2, 1.35, 0.22));
  const beak = cone(0.26, 0.5, std('#4a4a52'), 6); beak.rotation.x = PI / 2 + 0.35; at(head, beak, 0, -0.32, 1.72);
  const jaw = grp(head, 0, -0.45, 0.7);
  jaw.add(box(0.75, 0.25, 0.9, bel, 0, -0.05, 0.4, 0.1));
  const fr = cyl(1.3, 1.3, 0.16, std(frill, { roughness: 0.55 }), 22); fr.rotation.x = PI / 2 - 0.45; at(head, fr, 0, 0.5, 0.05);
  const fr2 = cyl(1.0, 1.0, 0.18, skin, 22); fr2.rotation.x = PI / 2 - 0.45; at(head, fr2, 0, 0.45, 0.1);
  for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * 0.42; const c = cone(0.14, 0.34, std(frill), 5); const px = Math.cos(a) * 1.32, py = -Math.sin(a) * 1.32; c.position.set(px, 0.5 + py * Math.cos(0.45), 0.05 - py * Math.sin(0.45)); c.rotation.set(-0.45, 0, -a - PI / 2 + PI); head.add(c); }
  for (const s of [-1, 1]) { const h = cone(0.13, 1.05, hornM, 8); h.rotation.x = PI / 2 - 0.5; at(head, h, s * 0.34, 0.62, 1.05); }
  { const h = cone(0.1, 0.42, hornM, 8); h.rotation.x = PI / 2 - 0.9; at(head, h, 0, 0.18, 1.55); }
  const eyes = [-1, 1].map((s) => makeEye(head, 0.2, s * 0.42, 0.25, 1.12, skin, { yaw: s * 0.25 }));
  for (const s of [-1, 1]) head.add(box(0.08, 0.2, 0.3, std('#ff9ab0'), s * 0.6, -0.15, 0.95, 0.04));
  const tail = tailChain(grp(body, 0, 0.15, -1.75), skin, 3, 1.0, 0.35, 1.2, 0.15);
  const seat = new THREE.Object3D(); seat.position.set(0, 0.92 - 0.55, -0.2); body.add(seat);
  body.add(box(1.25, 0.12, 1.1, std(saddle, { roughness: 0.5 }), 0, 0.86, -0.2, 0.04));
  for (const s of [-1, 1]) body.add(box(0.04, 1.0, 0.12, std('#5a3b2a'), s * 1.06, 0.3, -0.2, 0.01));
  const P = { body, neck, head, jaw, legs, tail, eyes };
  root.userData = { parts: P, seat, set(t, o = {}) { dinoSet(P, t, o, { quad: true, baseY: 1.85, eyePh: 0.4 }); } };
  root.userData.set(0, {});
  return root;
}

export function makeRaptor(color = '#8a5cff', { stripe = null, saddle = '#ffd23f' } = {}) {
  const root = new THREE.Group(); root.name = 'raptor';
  const skin = std(color, { roughness: 0.6 }), dark = std(stripe || shade(color, 0.62)), bel = std(shade(color, 1.45)), clawM = std('#f6f0e0', { roughness: 0.35 });
  const body = grp(root, 0, 1.42, 0);
  const torso = grp(body, 0, 0.25, 0.1); torso.rotation.x = -0.15;
  torso.add(box(0.9, 0.95, 1.75, skin, 0, 0, 0, 0.3));
  torso.add(box(0.7, 0.3, 1.3, bel, 0, -0.38, 0.15, 0.1));
  for (let i = 0; i < 4; i++) torso.add(box(0.94, 0.12, 0.16, dark, 0, 0.36, -0.6 + i * 0.36, 0.04));
  const legs = [];
  for (const s of [-1, 1]) {
    const thigh = grp(body, s * 0.36, 0.05, -0.1);
    thigh.add(box(0.42, 0.8, 0.62, skin, 0, -0.32, 0.05, 0.16));
    const shin = grp(thigh, 0, -0.68, -0.02);
    shin.add(box(0.24, 0.66, 0.26, skin, 0, -0.3, -0.06, 0.08));
    const foot = grp(shin, 0, -0.62, -0.1);
    foot.add(box(0.32, 0.16, 0.58, dark, 0, -0.02, 0.2, 0.06));
    const sickle = cone(0.06, 0.32, clawM, 5); sickle.rotation.x = -0.4; at(foot, sickle, 0, 0.12, 0.12);
    for (const cx of [-0.1, 0.1]) { const c = cone(0.04, 0.14, clawM, 5); c.rotation.x = PI / 2; at(foot, c, cx, -0.02, 0.54); }
    legs.push({ thigh, shin, foot });
  }
  for (const s of [-1, 1]) {
    const arm = grp(torso, s * 0.42, -0.05, 0.7); arm.rotation.x = 0.6;
    arm.add(box(0.15, 0.45, 0.15, skin, 0, -0.2, 0, 0.05));
    for (const cx of [-0.05, 0.05]) { const c = cone(0.03, 0.14, clawM, 5); c.rotation.x = PI * 0.8; at(arm, c, cx, -0.46, 0.04); }
  }
  const neck = grp(torso, 0, 0.35, 0.8);
  neck.add(box(0.46, 0.85, 0.48, skin, 0, 0.32, 0.12, 0.14));
  const head = grp(neck, 0, 0.75, 0.2);
  head.add(box(0.62, 0.55, 0.75, skin, 0, 0.1, 0.2, 0.18));
  head.add(box(0.48, 0.38, 0.8, skin, 0, 0.0, 0.85, 0.14));
  head.add(box(0.5, 0.08, 0.7, dark, 0, 0.34, 0.3, 0.03));
  for (const s of [-1, 1]) head.add(box(0.06, 0.05, 0.08, std('#2a1a3a'), s * 0.13, 0.12, 1.25, 0.01));
  const jaw = grp(head, 0, -0.17, 0.25);
  jaw.add(box(0.44, 0.13, 0.95, bel, 0, -0.04, 0.45, 0.05));
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const tt = cone(0.035, 0.1, clawM, 4); tt.rotation.x = PI; at(head, tt, s * 0.19, -0.2, 0.55 + i * 0.16); }
  const eyes = [-1, 1].map((s) => makeEye(head, 0.14, s * 0.25, 0.27, 0.42, skin, { yaw: s * 0.45 }));
  const tail = tailChain(grp(torso, 0, 0.1, -0.85), skin, 4, 0.6, 0.18, 0.75, 0.04);
  tail.forEach((s, i) => { if (i % 2 === 0) s.add(box(0.62 - i * 0.1, 0.1, 0.18, dark, 0, 0.27 - i * 0.03, -0.35, 0.03)); });
  const seat = new THREE.Object3D(); seat.position.set(0, 0.55 - 0.55, -0.15); torso.add(seat);
  torso.add(box(0.75, 0.1, 0.75, std(saddle, { roughness: 0.5 }), 0, 0.5, -0.15, 0.03));
  const P = { body, neck, head, jaw, legs, tail, eyes, torso };
  root.userData = { parts: P, seat, set(t, o = {}) { dinoSet(P, t, o, { quad: false, baseY: 1.42, bob: 0.12, eyePh: 1.1 }); torso.rotation.x = -0.15 + (o.rear ?? 0) * -0.7 + (o.lean ?? 0) * 0.35; } };
  root.userData.set(0, {});
  return root;
}

export function makeStego(color = '#e85a4a', { plate = '#ffd23f', saddle = '#2f4d8a' } = {}) {
  const root = new THREE.Group(); root.name = 'stego';
  const skin = std(color, { roughness: 0.65 }), dark = std(shade(color, 0.7)), bel = std(shade(color, 1.3)), plM = std(plate, { roughness: 0.5 });
  const body = grp(root, 0, 1.6, 0);
  body.add(box(1.8, 1.55, 3.3, skin, 0, 0, 0, 0.5));
  body.add(box(1.4, 0.25, 2.6, bel, 0, -0.68, 0.1, 0.1));
  const legs = quadLegs(body, skin, dark, [[0.62, 1.05], [-0.62, 1.05], [0.62, -1.0], [-0.62, -1.0]], 1.25, 0.55);
  legs.forEach((l) => { l.position.y = -0.38; });
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
    const sz = 0.55 + 0.35 * Math.sin(PI * (i + 0.5) / 6);
    const p = cone(sz * 0.55, sz * 1.3, plM, 4); p.scale.set(0.25, 1, 1); p.rotation.z = s * 0.25;
    at(body, p, s * 0.25, 0.75 + sz * 0.45, -1.35 + i * 0.5 + (s > 0 ? 0.2 : 0));
  }
  const neck = grp(body, 0, -0.05, 1.6);
  const head = grp(neck);
  head.add(box(0.7, 0.6, 1.0, skin, 0, -0.2, 0.45, 0.2));
  const jaw = grp(head, 0, -0.45, 0.4); jaw.add(box(0.55, 0.15, 0.6, bel, 0, 0, 0.25, 0.05));
  const eyes = [-1, 1].map((s) => makeEye(head, 0.14, s * 0.26, 0.0, 0.78, skin, { yaw: s * 0.3 }));
  const tail = tailChain(grp(body, 0, 0.1, -1.6), skin, 3, 0.8, 0.3, 1.0, 0.12);
  for (const s of [-1, 1]) for (const k of [0, 1]) { const sp = cone(0.08, 0.6, std('#fff4d6'), 6); sp.rotation.set(-0.4 - k * 0.3, 0, s * 1.1); at(tail[2], sp, s * 0.2, 0.15, -0.5 - k * 0.35); }
  const seat = new THREE.Object3D(); seat.position.set(0, 0.85 - 0.55, -0.05); body.add(seat);
  body.add(box(0.9, 0.1, 0.5, std(saddle), 0, 0.8, -0.05, 0.03));
  const P = { body, neck, head, jaw, legs, tail, eyes };
  root.userData = { parts: P, seat, set(t, o = {}) { dinoSet(P, t, o, { quad: true, baseY: 1.6, eyePh: 2.2 }); } };
  root.userData.set(0, {});
  return root;
}

export function makeLongneck(color = '#f0b44a') {
  const root = new THREE.Group(); root.name = 'longneck';
  const skin = std(color, { roughness: 0.65 }), dark = std(shade(color, 0.72)), bel = std(shade(color, 1.25));
  const pivot = grp(root, 1.45, 0, 0);          // tip-over hinge line (outer +X foot edge)
  const inner = grp(pivot, -1.45, 0, 0);
  const body = grp(inner, 0, 3.7, 0);
  body.add(box(2.9, 2.6, 5.6, skin, 0, 0, 0, 0.8));
  body.add(box(2.3, 0.4, 4.4, bel, 0, -1.15, 0.2, 0.15));
  for (let i = 0; i < 5; i++) body.add(box(0.7, 0.1, 0.7, dark, (hash(i * 5.3) - 0.5) * 1.6, 1.3, -1.8 + i * 0.9, 0.05));
  const legs = quadLegs(body, skin, dark, [[1.0, 1.9], [-1.0, 1.9], [1.0, -1.9], [-1.0, -1.9]], 2.6, 0.95);
  legs.forEach((l) => { l.position.y = -1.1; });
  const neck = grp(body, 0, 0.7, 2.5);
  const segs = []; let p = neck;
  for (let i = 0; i < 4; i++) {
    const w = lerp(1.15, 0.62, i / 3), len = 2.25;
    const g = grp(p, 0, 0, i === 0 ? 0 : len * 0.94);
    g.add(box(w, w * 0.95, len, skin, 0, 0, len / 2, 0.22));
    g.add(box(w * 0.7, 0.08, len * 0.8, bel, 0, -w * 0.47, len / 2, 0.03));
    g.rotation.x = i === 0 ? -1.0 : -0.06;
    segs.push(g); p = g;
  }
  const head = grp(p, 0, 0, 2.2);
  head.add(box(0.95, 0.8, 1.45, skin, 0, 0.1, 0.35, 0.3));
  head.add(box(0.7, 0.08, 0.5, std('#3a1a1a'), 0, -0.14, 0.95, 0.03));
  for (const s of [-1, 1]) head.add(box(0.06, 0.22, 0.32, std('#ff9ab0'), s * 0.48, -0.02, 0.55, 0.03));
  const jaw = grp(head, 0, -0.2, 0.2); jaw.add(box(0.8, 0.2, 1.0, bel, 0, -0.05, 0.45, 0.08));
  const eyes = [-1, 1].map((s) => makeEye(head, 0.2, s * 0.36, 0.38, 0.62, skin, { yaw: s * 0.35 }));
  const seat = new THREE.Object3D(); seat.position.set(0, 0.56 - 0.55, 0.15); head.add(seat);
  head.add(box(0.7, 0.08, 0.6, std('#2f4d8a'), 0, 0.52, 0.15, 0.03));
  const tail = tailChain(grp(body, 0, 0.1, -2.7), skin, 4, 1.4, 0.35, 1.5, 0.22);
  const P = { body, neck, head, jaw, legs, tail, eyes, segs };
  root.userData = {
    parts: P, seat,
    set(t, o = {}) {
      dinoSet(P, t, o, { quad: true, baseY: 3.7, bob: 0.1, eyePh: 0.9 });
      const sway = o.sway ?? 0.5, nb = o.neckBend ?? 0, lk = o.laugh ?? 0;
      segs[0].rotation.set(-1.0 + nb + (o.neckPitch ?? 0) + lk * 0.12 * Math.sin(t * 18), sway * 0.05 * Math.sin(t * 1.3), 0);
      for (let i = 1; i < 4; i++) segs[i].rotation.set(-0.06 + nb * 0.25 + lk * 0.08 * Math.sin(t * 18 + i), sway * 0.06 * Math.sin(t * 1.3 - i * 0.6) + (o.neckYaw ?? 0) / 3, 0);
      head.rotation.set(1.18 - nb * 1.6 + (o.headPitch ?? 0), o.headYaw ?? 0, o.headRoll ?? 0);
      P.neck.rotation.set(0, 0, 0);
      pivot.rotation.z = -(o.tip ?? 0) * (PI / 2 + 0.12);
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════════════════════════════════════ fence + gate
export function makeFence({ w = 26, h = 6, gateW = 6.4 } = {}) {
  const root = new THREE.Group(); root.name = 'fence';
  const woodA = std('#b07a4a', { roughness: 0.85 }), woodB = std('#9a6638', { roughness: 0.85 }), woodC = std('#7d5232', { roughness: 0.9 });
  function section(x0, x1, sx) {
    const piv = grp(root, (x0 + x1) / 2, 0, 0.12);
    const g = grp(piv, 0, 0, -0.12);
    const n = Math.round((x1 - x0) / 0.56);
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * (x1 - x0) / n - (x0 + x1) / 2, hh = h + (hash(i * 3.7 + sx) - 0.5) * 0.5;
      g.add(box(0.5, hh, 0.14, i % 2 ? woodA : woodB, x, hh / 2, 0, 0.03));
      const tip = cone(0.36, 0.4, i % 2 ? woodA : woodB, 4); tip.rotation.y = PI / 4; tip.scale.set(1, 1, 0.28); at(g, tip, x, hh + 0.2, 0);
    }
    for (const y of [1.2, h - 1.3]) g.add(box(x1 - x0, 0.3, 0.12, woodC, 0, y, -0.13, 0.03));
    return { piv, g };
  }
  const L = section(-w / 2, -gateW / 2 - 0.4, 1), R = section(gateW / 2 + 0.4, w / 2, 2);
  // gate: posts + arch sign + two doors (hinged at the posts)
  const C = { piv: grp(root, 0, 0, 0.3) }; C.g = grp(C.piv, 0, 0, -0.3);
  for (const s of [-1, 1]) {
    C.g.add(box(0.7, h + 2.4, 0.7, woodC, s * (gateW / 2 + 0.05), (h + 2.4) / 2, 0, 0.08));
    const cap = cone(0.55, 0.7, std('#3f7a5a'), 4); cap.rotation.y = PI / 4; at(C.g, cap, s * (gateW / 2 + 0.05), h + 2.75, 0);
  }
  const signT = labelTex(['DINOSAUR PARK'], { w: 1024, h: 240, bg: '#3f7a5a', fg: '#ffe14a', border: '#1f3a28', bw: 22, stroke: '#1f3a28', radius: 50 });
  C.g.add(box(gateW + 1.4, 1.5, 0.22, std('#1f3a28'), 0, h + 1.35, 0.42, 0.06));   // in front of the gate posts (they used to crop the D and K)
  const sign = plane(gateW + 1.2, 1.32, signT, { glow: 0.25 }); at(C.g, sign, 0, h + 1.35, 0.545);
  // dino footprint icons on the sign corners
  const doors = [];
  for (const s of [-1, 1]) {
    const hinge = grp(C.g, s * (gateW / 2 - 0.3), 0, 0.15);
    for (let i = 0; i < 5; i++) hinge.add(box(0.56, h - 0.6, 0.14, i % 2 ? woodA : woodB, -s * (0.31 + i * 0.58), (h - 0.6) / 2 + 0.15, 0, 0.03));
    for (const y of [1.3, h - 1.6]) hinge.add(box(2.9, 0.26, 0.1, woodC, -s * 1.45, y, 0.12, 0.03));
    const diag = box(0.22, 4.0, 0.08, woodC, -s * 1.45, h / 2 - 0.15, 0.13, 0.02); diag.rotation.z = s * 0.62; hinge.add(diag);
    doors.push({ hinge, s });
  }
  // repair boards (crossed planks + KEEP OUT sign), revealed by fixed
  const boards = [];
  const addBoards = (sec, xs) => xs.forEach((x, k) => {
    for (const r of [0.55, -0.55]) { const b = box(0.36, 4.6, 0.1, std('#c8955a', { roughness: 0.8 }), x, h * 0.5, 0.16, 0.02); b.rotation.z = r; sec.g.add(b); boards.push(b); }
    for (const dy of [-1.4, 1.4]) { const nl = box(0.1, 0.1, 0.06, std('#9aa3ad', { metalness: 0.5, roughness: 0.3 }), x + dy * 0.3, h * 0.5 + dy, 0.24, 0.01); sec.g.add(nl); boards.push(nl); }
  });
  addBoards(L, [-4.5, -1.0, 2.6]); addBoards(R, [-2.6, 1.0, 4.5]);
  const kT = labelTex(['KEEP OUT!'], { w: 768, h: 300, bg: '#ffffff', fg: '#e8232b', border: '#e8232b', bw: 26, radius: 30 });
  const keep = grp(C.g, 0, h * 0.55, 0.35);
  keep.add(box(3.4, 1.4, 0.1, std('#ffffff'), 0, 0, -0.06, 0.03)); at(keep, plane(3.3, 1.3, kT, { glow: 0.2 }), 0, 0, 0.0);
  root.userData = {
    parts: { L, R, C, doors },
    set(t, o = {}) {
      L.piv.rotation.x = (o.fallL ?? 0) * (PI / 2 - 0.03); R.piv.rotation.x = (o.fallR ?? 0) * (PI / 2 - 0.03); C.piv.rotation.x = (o.fallC ?? 0) * (PI / 2 - 0.03);
      const gO = o.gate ?? 0;
      doors.forEach(({ hinge, s }) => { hinge.rotation.y = s * -gO * 1.55; });
      const fx = o.fixed ?? 0, nb = boards.length;
      boards.forEach((b, i) => { b.visible = fx * nb > i; });
      keep.visible = fx > 0.6; keep.scale.setScalar(clamp((fx - 0.6) / 0.15, 0.01, 1));
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════════════════════════════════════ clock tower + bell
function clockTex() {
  return tex('ep25clock', 512, 512, (g, w, h) => {
    g.fillStyle = '#fbf6ec'; g.beginPath(); g.arc(256, 256, 250, 0, PI * 2); g.fill();
    g.lineWidth = 22; g.strokeStyle = '#2b2f6b'; g.beginPath(); g.arc(256, 256, 236, 0, PI * 2); g.stroke();
    g.fillStyle = '#2b2f6b';
    for (let i = 0; i < 12; i++) { const a = i * PI / 6; g.save(); g.translate(256 + Math.sin(a) * 196, 256 - Math.cos(a) * 196); g.rotate(a); g.fillRect(-8, -24, 16, 48); g.restore(); }
    g.lineCap = 'round'; g.lineWidth = 20; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + 0, 256 - 160); g.stroke();
    g.lineWidth = 26; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + 110, 256 + 20); g.stroke();
    g.beginPath(); g.arc(256, 256, 22, 0, PI * 2); g.fill();
  });
}
export function makeBell() {
  const g = new THREE.Group(); g.name = 'bell';
  const gold = new THREE.MeshStandardMaterial({ color: '#ffc928', metalness: 0.55, roughness: 0.28, emissive: '#7a5200', emissiveIntensity: 0.45 });
  const pts = [[0.001, 1.65], [0.3, 1.62], [0.48, 1.5], [0.56, 1.25], [0.6, 0.85], [0.66, 0.5], [0.8, 0.22], [0.95, 0.06], [0.98, 0.0], [0.9, 0.0]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), gold); m.castShadow = true; m.material.side = THREE.DoubleSide;
  m.position.y = -1.72; g.add(m);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.07, 8, 28), gold); lip.rotation.x = PI / 2; lip.position.y = -1.66; g.add(lip);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 24), gold); band.rotation.x = PI / 2; band.position.y = -0.95; g.add(band);
  g.add(at(grp(null), cyl(0.1, 0.1, 0.3, gold, 10), 0, -0.05, 0));
  const clap = sph(0.2, std('#8a6a20', { metalness: 0.5, roughness: 0.4 })); clap.position.y = -1.55; g.add(clap);
  g.userData = { mat: gold, clap };
  return g;
}
export function makeTower() {
  const root = new THREE.Group(); root.name = 'ep25tower';
  const stone = std('#e8d9b8', { roughness: 0.8 }), trim = std('#fbf6ec'), base = std('#a8a196'), roofM = std('#3f7a5a', { roughness: 0.6 }), winM = std('#3b4f78', { roughness: 0.4 });
  root.add(box(5.2, 0.7, 5.2, base, 0, 0.35, 0, 0.06));
  const stepTop = new THREE.Object3D(); stepTop.position.set(0, 0.7, 2.25); root.add(stepTop);
  for (let k = 0; k < 4; k++) root.add(box(2.4, 0.7 - k * 0.175, 0.42, base, 0, (0.7 - k * 0.175) / 2, 2.6 + 0.4 + k * 0.42, 0.03));
  root.add(box(3.6, 9.0, 3.6, stone, 0, 5.2, 0, 0.12));
  for (let i = 0; i < 4; i++) {
    const a = i * PI / 2, s = Math.sin(a), c = Math.cos(a);
    for (const y of [4.2, 7.2]) { const w = box(0.7, 1.4, 0.08, winM, s * 1.81, y, c * 1.81, 0.03); w.rotation.y = a; root.add(w); const sill = box(0.9, 0.12, 0.2, trim, s * 1.86, y - 0.76, c * 1.86, 0.02); sill.rotation.y = a; root.add(sill); }
  }
  root.add(box(1.2, 2.1, 0.1, std('#7d5232'), 0, 1.75, 1.82, 0.03));
  root.add(box(4.0, 0.3, 4.0, trim, 0, 9.85, 0, 0.05));
  // breakable top: clock block quadrants, belfry floor, posts, bell, roof
  const chunks = [];
  const chunk = (o, dir, spin) => { root.add(o); chunks.push({ o, p0: o.position.clone(), r0: o.rotation.clone(), dir: dir.normalize(), spin }); return o; };
  const cm = new THREE.MeshStandardMaterial({ map: clockTex(), roughness: 0.6, emissive: '#ffffff', emissiveMap: clockTex(), emissiveIntensity: 0.22 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const q = grp(null, sx * 0.85, 11.4, sz * 0.85);
    q.add(box(1.7, 2.8, 1.7, stone, 0, 0, 0, 0.06));
    chunk(q, V(sx, 0.6, sz), V(hash(sx + 3) - 0.5, 0.5, hash(sz + 7) - 0.5));
  }
  const faces = grp(null, 0, 11.4, 0);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; const f = new THREE.Mesh(new THREE.CircleGeometry(1.15, 30), cm); f.position.set(Math.sin(a) * 1.72, 0, Math.cos(a) * 1.72); f.rotation.y = a; faces.add(f); const rim = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.09, 8, 30), std('#ffd23f', { metalness: 0.3, roughness: 0.4 })); rim.position.copy(f.position); rim.rotation.y = a; faces.add(rim); }
  chunk(faces, V(0.3, 1, 1), V(0.6, 0.2, 0.3));
  chunk(at(grp(null), box(4.1, 0.32, 4.1, trim, 0, 0, 0, 0.05), 0, 12.95, 0), V(-0.4, 1, 0.5), V(0.3, 0, 0.6));
  const posts = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const p = grp(null, sx * 1.6, 14.55, sz * 1.6);
    p.add(box(0.55, 2.9, 0.55, stone, 0, 0, 0, 0.06));
    posts.push(chunk(p, V(sx, 0.4, sz), V(0.2 * sx, 0.3, 0.8 * sz)));
  }
  const arch = grp(null, 0, 15.85, 0);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; const b = box(3.6, 0.35, 0.3, trim, Math.sin(a) * 1.6, 0, Math.cos(a) * 1.6, 0.04); b.rotation.y = a; arch.add(b); }
  arch.add(box(0.3, 0.3, 3.4, std('#7d5232'), 0, -0.1, 0, 0.03));
  chunk(arch, V(0.5, 1, -0.6), V(0.5, 0.4, -0.3));
  const roof = grp(null, 0, 16.0, 0);
  roof.add(box(4.3, 0.3, 4.3, trim, 0, 0.15, 0, 0.05));
  const pyr = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 3.05, 2.6, 4), roofM); pyr.rotation.y = PI / 4; pyr.position.y = 1.6; pyr.castShadow = true; roof.add(pyr);
  roof.add(box(0.75, 0.14, 0.75, std('#ffd23f', { metalness: 0.3, roughness: 0.4 }), 0, 2.95, 0, 0.04));
  chunk(roof, V(-0.6, 1.2, 0.4), V(-0.4, 0.3, 0.5));
  const bell = makeBell(); bell.position.set(0, 15.75, 0);
  const bellChunk = chunk(grp(null), V(1, 0.3, 0.6), V(0.8, 0, 0.4)); bellChunk.add(bell); bell.position.set(0, 15.75, 0);
  const TOP_Y = 19.02, BELL_Y = 15.75;
  root.userData = {
    TOP_Y, BELL_Y, bell, stepTop, chunks,
    bellWorld(dy = -1.0) { root.updateMatrixWorld(true); return bell.localToWorld(V(0, dy, 0)); },
    topWorld() { root.updateMatrixWorld(true); return root.localToWorld(V(0, TOP_Y, 0)); },
    set(t, o = {}) {
      bell.rotation.set(0, 0, o.swing ?? 0);
      bell.userData.mat.emissiveIntensity = 0.45 + 1.4 * (o.glint ?? 0);
      bell.userData.clap.position.x = -(o.swing ?? 0) * 0.5;
      const c = o.crumble ?? -1;
      chunks.forEach((k, i) => {
        if (c <= 0) { k.o.position.copy(k.p0); k.o.rotation.copy(k.r0); k.o.visible = true; return; }
        const d = Math.max(0, c - hash(i * 2.7) * 0.12), sp = 7 + 5 * hash(i * 1.3);
        k.o.position.set(k.p0.x + k.dir.x * sp * d, k.p0.y + k.dir.y * sp * d - 4.9 * d * d * 1.6, k.p0.z + k.dir.z * sp * d);
        k.o.rotation.set(k.r0.x + k.spin.x * d * 4, k.r0.y + k.spin.y * d * 4, k.r0.z + k.spin.z * d * 4);
        k.o.visible = k.o.position.y > -2;
      });
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════════════════════════════════════ the egg
function eggR(s) { const x = 2 * s - 1; return Math.sqrt(Math.max(0, 1 - x * x)) * (1 + 0.16 * (-x)) ; }
export function makeEgg() {
  const root = new THREE.Group(); root.name = 'egg';
  const H = 2.6, R = 1.0;
  const pts = [];
  for (let i = 0; i <= 40; i++) { const s = i / 40; pts.push(new THREE.Vector2(Math.max(0.001, R * eggR(s)), H * s)); }
  const shell = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshStandardMaterial({ color: '#fbf4e6', roughness: 0.55, emissive: '#fff4d8', emissiveIntensity: 0.06 }));
  shell.castShadow = true; shell.receiveShadow = true;
  const body = grp(root); body.add(shell);
  // speckles
  for (let i = 0; i < 26; i++) {
    const s = 0.12 + 0.8 * hash(i * 3.1), a = hash(i * 7.7) * PI * 2, r = R * eggR(s);
    const sp = sph(0.035 + 0.03 * hash(i), std('#e2cfae', { roughness: 0.7 }), 8, 6); sp.scale.set(1, 1, 0.3);
    sp.position.set(Math.sin(a) * r * 0.995, H * s, Math.cos(a) * r * 0.995); sp.lookAt(Math.sin(a) * 3, H * s, Math.cos(a) * 3); body.add(sp);
  }
  // zigzag crack on the +Z face around s ≈ 0.52 (plus a branch up and one down)
  const glowM = new THREE.MeshBasicMaterial({ color: '#fff2a0', toneMapped: false });
  const darkM = std('#3a2a1a', { roughness: 0.9 });
  const zig = [];
  const N = 14;
  for (let i = 0; i <= N; i++) { const x = lerp(-0.82, 0.82, i / N); zig.push([x, 0.5 + (i % 2 ? 0.07 : -0.05) + 0.02 * Math.sin(i * 1.7)]); }
  const branchA = [[0.1, 0.56], [0.16, 0.64], [0.08, 0.72], [0.15, 0.8]];
  const branchB = [[-0.4, 0.46], [-0.46, 0.38], [-0.38, 0.3]];
  const segs = [];
  const surf = (x, s) => { const r = R * eggR(s), z = Math.sqrt(Math.max(0.0001, r * r - x * x)); return V(x, H * s, z); };
  function addPath(list, order0) {
    for (let i = 0; i < list.length - 1; i++) {
      const a = surf(...list[i]), b = surf(...list[i + 1]), mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, len + 0.03), glowM);
      const holder = grp(body); holder.position.copy(mid); holder.lookAt(b); holder.add(seg);   // +Z along a→b
      const n = mid.clone().setY(mid.y - H * 0.5).normalize(); holder.position.addScaledVector(n, 0.01);
      // dark split around the glowing core: a wider charcoal bar sunk along the surface normal
      holder.updateMatrix(); const nl = n.clone().applyQuaternion(holder.quaternion.clone().invert());
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.085, len + 0.05), darkM); edge.position.copy(nl).multiplyScalar(-0.034); holder.add(edge);
      segs.push({ holder, k: order0 + i });
    }
  }
  addPath(zig.slice(7).concat([]), 0); addPath(zig.slice(0, 8).reverse(), 0);
  addPath(branchA, 6); addPath(branchB, 6);
  const maxK = Math.max(...segs.map((s) => s.k)) + 1;
  const glow = new THREE.PointLight('#ffe9a0', 0, 12, 1.3); glow.position.set(0, H * 0.52, 1.6); body.add(glow);
  root.userData = {
    H, glow, glowM,
    set(t, o = {}) {
      const c = o.crack ?? 0, g = o.glow ?? c, w = o.wobble ?? 0, sh = o.shake ?? 0;
      segs.forEach((s) => { const vis = c * maxK > s.k; s.holder.visible = vis; s.holder.scale.set(1 + g * 0.6, 1 + g * 0.6, 1); });
      glowM.color.setRGB(1, 0.72, 0.18).multiplyScalar(0.8 + 0.6 * g);
      glow.intensity = g * (o.lightK ?? 30);
      body.rotation.set(sh * 0.02 * Math.sin(t * 47), 0, w * 0.06 * Math.sin(t * 7) + sh * 0.03 * Math.sin(t * 53));
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════════════════════════════════════ race stage, start line, small props
export function makeRaceStage() {
  const root = new THREE.Group(); root.name = 'raceStage';
  const wood = std('#c8955a', { roughness: 0.75 });
  // fulcrum base (a striped box)
  root.add(box(1.0, 1.0, 2.6, std('#2b2f6b'), 0, 0.5, 0, 0.06));
  for (const s of [-1, 1]) root.add(box(0.5, 0.35, 2.4, std('#2b2f6b'), s * 1.9, 0.175, 0, 0.04));
  const deck = grp(root, 0, 1.05, 0);
  deck.add(box(4.6, 0.2, 3.0, wood, 0, 0.1, 0, 0.05));
  for (let i = 0; i < 12; i++) deck.add(box(4.6 / 12 - 0.02, 0.55, 0.04, i % 2 ? '#ffd23f' : '#e8232b', -2.3 + (i + 0.5) * 4.6 / 12, -0.2, 1.52, 0.01));
  for (let i = 0; i < 12; i++) deck.add(box(4.6 / 12 - 0.02, 0.55, 0.04, i % 2 ? '#ffd23f' : '#e8232b', -2.3 + (i + 0.5) * 4.6 / 12, -0.2, -1.52, 0.01));
  for (const s of [-1, 1]) deck.add(box(0.04, 0.55, 3.0, '#e8232b', s * 2.3, -0.2, 0, 0.01));
  // rail at the back
  for (const x of [-2.1, 0, 2.1]) deck.add(box(0.08, 0.9, 0.08, '#fbf6ec', x, 0.65, -1.4, 0.02));
  deck.add(box(4.3, 0.1, 0.1, '#fbf6ec', 0, 1.08, -1.4, 0.02));
  const sT = labelTex(['DINO RACE', 'START'], { w: 768, h: 384, bg: '#7a1f2b', fg: '#ffe14a', border: '#ffd23f', bw: 20 });
  const sg = plane(2.2, 1.1, sT, { glow: 0.25 }); at(deck, sg, -0.9, 1.55, -1.33);
  deck.add(box(2.3, 1.2, 0.06, std('#ffd23f'), -0.9, 1.55, -1.38, 0.02));
  const spot = new THREE.Object3D(); spot.position.set(1.4, 0.2, 0.1); deck.add(spot);
  root.userData = { deck, spot, set(tilt = 0) { deck.rotation.z = tilt; } };
  return root;
}
function checkerTex(key, w, h, cells, text = null) {
  return tex(key, w, h, (g) => {
    const c = w / cells;
    for (let y = 0; y < Math.ceil(h / c); y++) for (let x = 0; x < cells; x++) { g.fillStyle = (x + y) % 2 ? '#1d1d22' : '#ffffff'; g.fillRect(x * c, y * c, c, c); }
    if (text) {
      g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(w * 0.2, h * 0.12, w * 0.6, h * 0.76);
      g.strokeStyle = '#1d1d22'; g.lineWidth = 10; g.strokeRect(w * 0.2, h * 0.12, w * 0.6, h * 0.76);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#e8232b';
      const s = fit(g, text, FONTD, w * 0.54, h * 0.6); g.fillText(text, w / 2, h / 2 + s * 0.06);
    }
  });
}
export function makeStartLine(w = 9.2) {
  const root = new THREE.Group(); root.name = 'startLine';
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.45, w), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, emissive: '#ffffff', emissiveIntensity: 0.15 }));
  line.rotation.x = -PI / 2; line.position.y = 0.02; line.receiveShadow = true; root.add(line);
  const chk = new THREE.Mesh(new THREE.PlaneGeometry(0.6, w), new THREE.MeshStandardMaterial({ map: checkerTex('chkLine', 64, 960, 4), roughness: 0.9 }));
  chk.rotation.set(-PI / 2, 0, 0); chk.position.set(-0.55, 0.021, 0); root.add(chk);
  const word = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.4), new THREE.MeshStandardMaterial({ map: labelTex(['START'], { w: 768, h: 240, bg: null, border: null, fg: '#ffffff', pad: 20 }), transparent: true, roughness: 0.9 }));
  word.rotation.set(-PI / 2, 0, -PI / 2); word.position.set(1.4, 0.022, 0); root.add(word);
  // arch
  for (const s of [-1, 1]) {
    const p = cyl(0.12, 0.14, 6.2, std('#e8232b', { roughness: 0.5 }), 10); at(root, p, 0, 3.1, s * (w / 2 + 0.6));
    root.add(at(grp(null), sph(0.22, std('#ffd23f', { roughness: 0.4 })), 0, 6.3, s * (w / 2 + 0.6)));
  }
  // two single-sided faces so START reads correctly from both sides of the line (DoubleSide showed 'TRATS' from +X)
  const banM = new THREE.MeshStandardMaterial({ map: checkerTex('chkBan', 1536, 192, 16, 'START'), roughness: 0.7, emissive: '#ffffff', emissiveMap: checkerTex('chkBan', 1536, 192, 16, 'START'), emissiveIntensity: 0.15 });
  for (const ry of [-PI / 2, PI / 2]) { const ban = new THREE.Mesh(new THREE.PlaneGeometry(w + 1.0, 1.5), banM); ban.rotation.y = ry; ban.position.set(ry > 0 ? 0.01 : -0.01, 5.3, 0); root.add(ban); }
  return root;
}
export function makeFlag() {
  const g = new THREE.Group(); g.name = 'flag';
  g.add(at(grp(null), cyl(0.022, 0.022, 0.95, std('#2a2a30'), 8), 0, 0.3, 0));
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.44), new THREE.MeshStandardMaterial({ map: checkerTex('chkFlag', 256, 192, 6), side: THREE.DoubleSide, roughness: 0.7 }));
  f.position.set(0.33, 0.6, 0); g.add(f);
  return g;
}
export function makeClipboard() {
  const g = new THREE.Group(); g.name = 'clipboard';
  g.add(box(0.36, 0.48, 0.025, std('#8a5a32'), 0, 0, 0, 0.01));
  const t = tex('ep25sheet', 384, 512, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1d1d22'; c.textAlign = 'center'; fit(c, 'DINO RACE', FONTD, w * 0.86, 64); c.fillText('DINO RACE', w / 2, 70);
    c.textAlign = 'left'; c.font = FONTW(26);
    const rows = ['MAYA - TRICERATOPS', 'MARCUS - RAPTOR', 'MAILMAN - LONG-NECK', 'JO - STEGO', 'KAI - RAPTOR', 'BO - STEGO'];
    rows.forEach((r, i) => { c.fillStyle = '#3a3d46'; fit(c, `${i + 1}. ${r}`, FONTW, w * 0.84, 26); c.fillText(`${i + 1}. ${r}`, 26, 130 + i * 44); });
    c.fillStyle = '#e8232b'; fit(c, '13. NUGGET (CHICKEN)', FONTW, w * 0.86, 34); c.fillText('13. NUGGET (CHICKEN)', 22, 130 + 6 * 44 + 40);
  });
  at(g, plane(0.32, 0.42, t, { glow: 0.2 }), 0, -0.02, 0.014);
  g.add(box(0.14, 0.05, 0.04, std('#9aa3ad', { metalness: 0.5, roughness: 0.3 }), 0, 0.23, 0.02, 0.01));
  return g;
}
export function makeHammer() {
  const g = new THREE.Group(); g.name = 'hammer';
  g.add(at(grp(null), cyl(0.05, 0.05, 0.9, std('#c8955a'), 8), 0, 0.3, 0));
  g.add(box(0.42, 0.16, 0.16, std('#5a5d66', { metalness: 0.4, roughness: 0.35 }), 0.05, 0.78, 0, 0.03));
  return g;
}
export function makeKeepOut() {
  const g = new THREE.Group(); g.name = 'keepOut';
  g.add(at(grp(null), cyl(0.06, 0.06, 2.2, std('#c8955a'), 8), 0, -0.6, 0));
  const t = labelTex(['KEEP', 'OUT!'], { w: 512, h: 384, bg: '#ffffff', fg: '#e8232b', border: '#e8232b', bw: 24, radius: 24 });
  g.add(box(1.6, 1.2, 0.08, std('#ffffff'), 0, 0.7, -0.05, 0.03));
  at(g, plane(1.5, 1.1, t, { glow: 0.2 }), 0, 0.7, 0.0);
  const back = plane(1.5, 1.1, t, { glow: 0.2 }); back.rotation.y = PI; at(g, back, 0, 0.7, -0.1);
  return g;
}
export function makeEnvelopes(n = 7) {
  const g = new THREE.Group(); g.name = 'envelopes';
  const t = tex('ep25env', 128, 96, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9c2b4'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(w / 2, h * 0.55); c.lineTo(w, 0); c.stroke(); c.fillStyle = '#e8232b'; c.fillRect(w - 34, 8, 24, 26); });
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, side: THREE.DoubleSide });
  const list = [];
  for (let i = 0; i < n; i++) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), m); e.castShadow = true; g.add(e); list.push(e); }
  g.userData = { list };
  return g;
}
export function makeCrumb() { const g = new THREE.Group(); for (let i = 0; i < 3; i++) g.add(box(0.06 - i * 0.012, 0.04, 0.05, std('#e0a43a', { roughness: 0.8 }), (hash(i) - 0.5) * 0.08, 0.02, (hash(i + 4) - 0.5) * 0.08, 0.01)); return g; }
export function makeShades() {
  const g = new THREE.Group(); g.name = 'shades';
  const m = std('#111114', { roughness: 0.2, metalness: 0.3 });
  for (const s of [-1, 1]) g.add(box(0.24, 0.13, 0.04, m, s * 0.15, 0, 0, 0.03));
  g.add(box(0.1, 0.03, 0.03, m, 0, 0.03, 0, 0.01));
  for (const s of [-1, 1]) g.add(box(0.03, 0.03, 0.28, m, s * 0.28, 0.03, -0.14, 0.01));
  return g;
}
export function makeTopHat() {
  const g = new THREE.Group(); g.name = 'topHat';
  const blk = std('#1d1d22', { roughness: 0.5 });
  g.add(at(grp(null), cyl(0.34, 0.34, 0.04, blk, 20), 0, 0.02, 0));
  g.add(at(grp(null), cyl(0.22, 0.22, 0.42, blk, 20), 0, 0.25, 0));
  g.add(at(grp(null), cyl(0.225, 0.225, 0.08, std('#ffd23f', { roughness: 0.4 }), 20), 0, 0.1, 0));
  return g;
}
export function makeJungleTree(seed = 1, h = 12) {
  const g = new THREE.Group(); g.name = 'jungleTree';
  const trunk = std('#6b4a2a', { roughness: 0.9 });
  const lean = (hash(seed * 3.3) - 0.5) * 0.25;
  const tr = cyl(0.35, 0.6, h, trunk, 8); tr.position.y = h / 2; tr.rotation.z = lean; g.add(tr);
  const top = V(-Math.sin(lean) * h, h, 0);
  const greens = ['#2f8f3a', '#3caf4a', '#24722e', '#4cc45a'];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * PI * 2 + hash(seed + i) * 0.4;
    const leaf = box(0.9, 0.12, 4.2 + hash(seed * 7 + i) * 1.4, std(greens[i % 4], { roughness: 0.75 }), 0, 0, 0, 0.05);
    const hold = grp(g, top.x, top.y, top.z); hold.rotation.set(0, a, 0);
    leaf.position.set(0, -0.6, 2.0); leaf.rotation.x = 0.45; hold.add(leaf);
  }
  g.add(at(grp(null), sph(1.0, std('#2f8f3a', { roughness: 0.8 }), 10, 8), top.x, top.y, top.z));
  return g;
}
export function makeFern(seed = 1, s = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * PI * 2 + hash(seed + i) * 0.5;
    const hold = grp(g); hold.rotation.y = a;
    const l = box(0.5 * s, 0.08, 2.4 * s, std(i % 2 ? '#3caf4a' : '#2f8f3a'), 0, 0.9 * s, 1.0 * s, 0.03); l.rotation.x = -0.6; hold.add(l);
  }
  return g;
}
/** big grey dust cloud (instanced spheres).  set(u): u = seconds since the burst (≤ 0 hidden). */
export function makeDust({ n = 40, radius = 5, color = '#bdb6aa', seed = 3, life = 2.6, spreadX = 1, spreadZ = 1 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.92, depthWrite: false });
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 9), mat, n); im.frustumCulled = false;
  const root = new THREE.Group(); root.add(im); root.name = 'dust';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V();
  const dirs = Array.from({ length: n }, (_, i) => { const a = hash(i * 1.9 + seed) * PI * 2, e = hash(i * 3.7 + seed) * 0.9; return V(Math.cos(a) * spreadX, 0.2 + e, Math.sin(a) * spreadZ); });
  root.userData = {
    set(u) {
      root.visible = u > 0 && u < life;
      if (!root.visible) return;
      const k = 1 - Math.pow(1 - clamp(u / life, 0, 1), 2.4), fade = 1 - clamp((u - life * 0.55) / (life * 0.45), 0, 1);
      mat.opacity = 0.92 * fade;
      dirs.forEach((d, i) => {
        p.copy(d).multiplyScalar(radius * (0.2 + 0.85 * k)); p.y = Math.abs(p.y) * 0.7 + radius * 0.12;
        const r = radius * (0.22 + 0.2 * hash(i * 5.3 + seed)) * (0.5 + 0.8 * k);
        s.setScalar(Math.max(0.001, r)); m4.compose(p, q, s); im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true;
    },
  };
  root.userData.set(0);
  return root;
}
/** cartoon stars circling a head.  set(t, k) */
export function makeStars(n = 5) {
  const g = new THREE.Group(); g.name = 'stars';
  const m = new THREE.MeshBasicMaterial({ color: '#ffe14a', toneMapped: false });
  const list = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), m); g.add(s); list.push(s); }
  g.userData = { set(t, k = 1) { g.visible = k > 0.01; list.forEach((s, i) => { const a = t * 3.2 + i / n * PI * 2; s.position.set(Math.cos(a) * 0.45 * k, 0.05 * Math.sin(t * 5 + i), Math.sin(a) * 0.45 * k); s.scale.setScalar(k); s.rotation.y = t * 4; }); } };
  return g;
}
export function makeBanner(lines, { w = 6, h = 1.6, bg = '#e8232b', fg = '#ffffff', post = 3.2 } = {}) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) at(g, cyl(0.08, 0.08, post + h, std('#fbf6ec'), 8), s * (w / 2 + 0.1), (post + h) / 2, 0);
  const t = labelTex(lines, { w: 1024, h: Math.round(1024 * h / w), bg, fg, border: '#1d1d22', bw: 16, radius: 20 });
  const p = plane(w, h, t, { glow: 0.2, double: true }); at(g, p, 0, post + h / 2, 0);
  return g;
}
