// Episode 15 ("The 3:33") props.  Same conventions as src/props.js (SPEC.md §2/§7): ES module, metres, Y up,
// deterministic (no Math.random / clocks); animated things are pure functions of the t / u passed in.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   glowTex()                    soft radial white sprite texture (additive glows)
//   makeTrain()                  the floating 3:33 train.  Group, origin = bottom centre of the body, +X = nose,
//        door on the LOCAL −Z side (yaw π when it travels along −X so the door faces +Z).  The body floats:
//        put the origin HOVER (1.0) above the road.  Windows are real holes onto a glowing inner wall.
//        userData.set({ t, door 0..1, beam 1, glow 1, sil 1, twin -1 (window index whose silhouette hides),
//                       light 1, steps 0..1, tail 1 })
//        userData.winX (window x list), userData.winLocal(i, side) → local centre of window i (side −1 / +1),
//        userData.doorLocal (local point in the door opening, floor level), HOVER, LEN.
//   makeFogBank({ n, w, d, h, size, color })   drifting fog sprites over a w × d area.  userData.set(t, a)
//   makeMotes({ n, w, h, d, color, size })     drifting glowing specks.  userData.set(t, a)
//   makeClockFace(r)             clock face (numbers) + real hand meshes.  userData.set(hours, minutes) continuous.
//   makeBeard()                  knee-length white beard: parent to joints.head (top at the chin), hangs to −Y.
//   makeConductorCap()           tiny navy conductor's cap for the cat (parent to cat joints.head).
//   makeSandwich()               stacked sandwich ~0.2 wide, origin centre.
//   makeWhitePaw()               bright white sock for the cat's front leg (parent to joints.armR).
//   makeLever()                  EMERGENCY STOP wall unit.  userData.set(pull 0..1, t, flash 0..1)
//   makeSparks(n)                userData.set(u 0..1)  (hidden outside)
//   makeBookcase(seed)           1.6 × 2.2 × 0.4 bookcase full of books, front +Z, origin bottom centre
//   makeBookPile(seed, n)        a wobbly pile of books, origin bottom centre
//   makeBench()                  park bench (seat 0.5), faces +Z
//   makeBackpack()               small backpack (parent to joints.torso, back side −Z)
//   makeCurtainWindow()          lit window pane with closing curtains.  userData.set(close 0..1, light)
//   makeSign(lines, opts)        canvas sign plane
//   buildTrainInterior()         Set: the glowing carriage (20 m along X, width 3, own lights) + window dioramas.
//        anchors: aisle(x) via userData, views[], lever, backSeat.  userData.set(t, k)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, hash, lerp, canvasTexture, ease } from '../lib/util.js';

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
function cyl(rt, rb, h, m, seg = 20) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function sph(r, m, ws = 14, hs = 10) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
/** merged box geometry: list of [w,h,d,x,y,z,(r)] */
function mergedBoxes(list) {
  const gs = list.map(([w, h, d, x, y, z, r = 0]) => { const g = (r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d)).toNonIndexed(); g.translate(x, y, z); if (g.attributes.uv) g.deleteAttribute('uv'); return g; });
  return mergeGeometries(gs, false);
}

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
let _beamTex = null;
const beamTex = () => _beamTex ??= canvasTexture(64, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);   // v=0 (top of canvas) = far end of the cone? (cone uv: v=1 at apex)
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
export function glowSprite(color, size = 1, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity, fog: false }));
  s.scale.set(size, size, 1); return s;
}
export function makeSign(lines, { w = 1, h = 0.4, res = 512, bg = '#ffd23f', fg = '#1d1d22', border = '#1d1d22', display = true, basicMat = false } = {}) {
  const rh = Math.round(res * h / w);
  const tex = canvasTexture(res, rh, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, res, rh);
    if (border) { g.strokeStyle = border; g.lineWidth = Math.max(6, res * 0.025); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, res - g.lineWidth, rh - g.lineWidth); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const F = display ? FONTD : FONTW;
    lines.forEach((l, i) => { const s = fit(g, l, F, res * 0.86, Math.floor(rh / lines.length * 0.7)); g.font = F(s); g.fillText(l, res / 2, rh * (i + 0.5) / lines.length + s * 0.06); });
  });
  const m = basicMat ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

// ════════════════════════════════════════════════════════════════════════════ the train
export const HOVER = 1.0;
export function makeTrain() {
  const g = new THREE.Group();
  const LEN = 22, half = LEN / 2, W = 2.8, H = 3.0, T = 0.12;
  const wy0 = 1.15, wy1 = 2.35, ww = 1.1;
  const winX = [-9.3, -7.6, -5.9, -4.2, -2.5, 2.5, 4.2, 5.9, 7.6, 9.3];
  const dx0 = -0.65, dx1 = 0.65, dy0 = 0.15, dy1 = wy1;
  const silver = new THREE.MeshStandardMaterial({ color: '#9aa6b8', metalness: 0.5, roughness: 0.38, emissive: '#10141e', emissiveIntensity: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2b3344', metalness: 0.3, roughness: 0.4 });
  const stripeM = new THREE.MeshStandardMaterial({ color: '#2f6fd6', roughness: 0.5, emissive: '#0d2a66', emissiveIntensity: 0.6 });
  // ── body shell (merged): skirt, band, pillars on both sides, floor
  const shell = [];
  for (const s of [-1, 1]) {
    const z = s * (W / 2 - T / 2);
    const door = s < 0;
    // skirt (below windows)
    if (door) { shell.push([dx0 + half, wy0, T, (-half + dx0) / 2, wy0 / 2, z]); shell.push([half - dx1, wy0, T, (half + dx1) / 2, wy0 / 2, z]); shell.push([dx1 - dx0, dy0, T, 0, dy0 / 2, z]); }
    else shell.push([LEN, wy0, T, 0, wy0 / 2, z]);
    // band (above windows)
    shell.push([LEN, H - wy1, T, 0, (wy1 + H) / 2, z]);
    // pillars between windows / door
    const edges = [-half];
    for (const x of winX) edges.push(x - ww / 2, x + ww / 2);
    edges.push(half);
    for (let i = 0; i < edges.length; i += 2) {
      let a = edges[i], b = edges[i + 1];
      if (door && a < dx0 && b > dx1) { shell.push([dx0 - a, wy1 - wy0, T, (a + dx0) / 2, (wy0 + wy1) / 2, z]); shell.push([b - dx1, wy1 - wy0, T, (b + dx1) / 2, (wy0 + wy1) / 2, z]); }
      else if (b > a) shell.push([b - a, wy1 - wy0, T, (a + b) / 2, (wy0 + wy1) / 2, z]);
    }
  }
  shell.push([LEN, 0.16, W, 0, 0.08, 0]);
  const shellMesh = new THREE.Mesh(mergedBoxes(shell), silver); shellMesh.castShadow = true; g.add(shellMesh);
  // roof (rounded) + nose + tail
  const roof = box(LEN + 0.2, 0.42, W + 0.14, silver, 0, H + 0.12, 0, 0.18); g.add(roof);
  const roofRib = box(LEN - 2, 0.12, 1.0, dark, 0, H + 0.38, 0, 0.05); g.add(roofRib);
  const nose = new THREE.Mesh(new RoundedBoxGeometry(3.2, H + 0.3, W + 0.14, 5, 1.1), silver); nose.position.set(half + 0.9, H / 2 + 0.06, 0); nose.castShadow = true; g.add(nose);
  const tail = new THREE.Mesh(new RoundedBoxGeometry(1.4, H + 0.3, W + 0.14, 4, 0.5), silver); tail.position.set(-half - 0.25, H / 2 + 0.06, 0); g.add(tail);
  const screen = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.9, W - 0.5, 3, 0.25), new THREE.MeshStandardMaterial({ color: '#1b2438', metalness: 0.6, roughness: 0.15, emissive: '#3a5a9a', emissiveIntensity: 0.25 }));
  screen.position.set(half + 2.15, 2.25, 0); screen.rotation.z = -0.5; g.add(screen);
  // blue stripes along both sides
  for (const s of [-1, 1]) {
    const st = box(LEN + 3.2, 0.14, 0.04, stripeM, 1.0, wy0 - 0.22, s * (W / 2 + 0.07)); g.add(st);
    const st2 = box(LEN + 3.2, 0.05, 0.04, stripeM, 1.0, wy1 + 0.18, s * (W / 2 + 0.07)); g.add(st2);
  }
  // window frames (dark trim)
  const frames = [];
  for (const s of [-1, 1]) for (const x of winX) {
    const z = s * (W / 2 + 0.01);
    frames.push([ww + 0.12, 0.06, 0.05, x, wy0, z], [ww + 0.12, 0.06, 0.05, x, wy1, z], [0.06, wy1 - wy0, 0.05, x - ww / 2, (wy0 + wy1) / 2, z], [0.06, wy1 - wy0, 0.05, x + ww / 2, (wy0 + wy1) / 2, z]);
  }
  frames.push([dx1 - dx0 + 0.14, 0.07, 0.06, 0, dy1 + 0.02, -(W / 2 + 0.01)], [0.07, dy1 - dy0, 0.06, dx0 - 0.03, (dy0 + dy1) / 2, -(W / 2 + 0.01)], [0.07, dy1 - dy0, 0.06, dx1 + 0.03, (dy0 + dy1) / 2, -(W / 2 + 0.01)]);
  g.add(new THREE.Mesh(mergedBoxes(frames), dark));
  // ── interior: glowing centre wall + floor + end caps (seen through the holes)
  const innerM = new THREE.MeshBasicMaterial({ color: '#ffd98a', toneMapped: false });
  const inner = box(LEN - 0.3, wy1 - wy0 + 0.6, 0.05, innerM, 0, (wy0 + wy1) / 2, 0.12); inner.castShadow = false; g.add(inner);
  const inner2 = box(LEN - 0.3, wy1 - wy0 + 0.6, 0.05, innerM, 0, (wy0 + wy1) / 2, -0.12); inner2.castShadow = false; g.add(inner2);
  const ceilM = new THREE.MeshBasicMaterial({ color: '#fff1c8', toneMapped: false });
  g.add(box(LEN - 0.3, 0.05, W - 0.3, ceilM, 0, H - 0.05, 0));
  // vestibule: pure white light behind the door
  const whiteM = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  const white = box(1.5, dy1 - dy0 + 0.2, 0.05, whiteM, 0, (dy0 + dy1) / 2, -0.3); white.castShadow = false; g.add(white);
  const whiteFloor = box(1.5, 0.02, 1.2, whiteM, 0, 0.17, -0.85); whiteFloor.castShadow = false; g.add(whiteFloor);
  for (const sx of [-1, 1]) { const side = box(0.05, dy1 - dy0 + 0.2, 1.2, whiteM, sx * 0.74, (dy0 + dy1) / 2, -0.85); side.castShadow = false; g.add(side); }
  // silhouettes (instanced: one merged head+body)
  const silGeo = mergedBoxes([[0.46, 0.44, 0.4, 0, 1.55, 0, 0.08], [0.6, 0.75, 0.32, 0, 0.98, 0, 0.06], [0.14, 0.12, 0.14, 0.25, 1.82, 0, 0.03], [0.14, 0.12, 0.14, -0.25, 1.82, 0, 0.03]]);
  const silM = new THREE.MeshBasicMaterial({ color: '#2a1c2a' });
  const nSil = winX.length * 2;
  const sils = new THREE.InstancedMesh(silGeo, silM, nSil); sils.frustumCulled = false; g.add(sils);
  const silSlots = [];
  for (const s of [-1, 1]) winX.forEach((x, i) => silSlots.push({ x: x + (hash(i * 3.1 + s) - 0.5) * 0.4, z: s * 0.62, s, i, on: hash(i * 7.7 + s * 2) > 0.38, ph: hash(i * 1.3 + s) * 6 }));
  // door panels (slide along X inside the wall)
  const doorM = new THREE.MeshStandardMaterial({ color: '#b9c2cf', metalness: 0.5, roughness: 0.3 });
  const panels = [];
  for (const sx of [-1, 1]) {
    const p = box(0.66, dy1 - dy0, 0.07, doorM, sx * 0.33, (dy0 + dy1) / 2, -(W / 2 - 0.16)); g.add(p);
    const win = box(0.36, 0.6, 0.02, innerM, 0, 0.45, -0.04); win.castShadow = false; p.add(win);
    panels.push(p);
  }
  // fold-out steps
  const steps = new THREE.Group(); g.add(steps);
  const stepM = new THREE.MeshStandardMaterial({ color: '#9aa3b0', metalness: 0.5, roughness: 0.35 });
  steps.add(box(1.2, 0.08, 0.4, stepM, 0, -0.3, -(W / 2 + 0.2)));
  steps.add(box(1.2, 0.08, 0.4, stepM, 0, -0.65, -(W / 2 + 0.55)));
  steps.add(box(0.06, 0.8, 0.06, stepM, -0.62, -0.35, -(W / 2 + 0.38)));
  steps.add(box(0.06, 0.8, 0.06, stepM, 0.62, -0.35, -(W / 2 + 0.38)));
  // spill of white light on the road under the door
  const spillTex = canvasTexture(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(w * 0.32, 0); c.lineTo(w * 0.68, 0); c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill(); });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.2), new THREE.MeshBasicMaterial({ map: spillTex, color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  spill.rotation.x = -PI / 2; spill.rotation.z = PI; spill.position.set(0, -HOVER + 0.03, -(W / 2 + 2.1)); g.add(spill);
  // hover glow under the body
  const underM = new THREE.MeshBasicMaterial({ color: '#9ff3ff', toneMapped: false });
  const under = box(LEN - 2, 0.05, W - 0.8, underM, 0, -0.02, 0); under.castShadow = false; g.add(under);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(LEN + 2, W + 3), new THREE.MeshBasicMaterial({ map: glowTex(), color: '#7fe3ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55, fog: false }));
  pool.rotation.x = -PI / 2; pool.position.y = -HOVER + 0.02; g.add(pool);
  // headlight + beam
  const hl = cyl(0.3, 0.3, 0.16, basic('#fffbe6', { toneMapped: false }), 24); hl.rotation.z = PI / 2; hl.position.set(half + 2.45, 1.05, 0); g.add(hl);
  const hlRim = cyl(0.38, 0.38, 0.12, dark, 24); hlRim.rotation.z = PI / 2; hlRim.position.set(half + 2.38, 1.05, 0); g.add(hlRim);
  const hlGlow = glowSprite('#fff6d8', 3.2, 1); hlGlow.position.set(half + 2.7, 1.05, 0); g.add(hlGlow);
  const BL = 16;
  const beamGeo = new THREE.ConeGeometry(2.6, BL, 32, 1, true); beamGeo.rotateZ(PI / 2); beamGeo.translate(BL / 2, 0, 0);
  const beamM = new THREE.MeshBasicMaterial({ map: beamTex(), color: '#fff3cf', transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const beam = new THREE.Mesh(beamGeo, beamM); beam.position.set(half + 2.5, 1.05, 0); beam.rotation.z = -0.07; g.add(beam);
  const beamPool = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: glowTex(), color: '#fff0c0', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5, fog: false }));
  beamPool.rotation.x = -PI / 2; beamPool.position.set(half + 9, -HOVER + 0.03, 0); g.add(beamPool);
  // tail lights
  const tailM = new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false });
  const tailGlows = [];
  for (const s of [-1, 1]) {
    g.add(box(0.08, 0.34, 0.5, tailM, -half - 1.0, 1.0, s * 0.8, 0.03));
    const tg = glowSprite('#ff2020', 3.2, 1); tg.position.set(-half - 1.3, 1.0, s * 0.8); g.add(tg); tailGlows.push(tg);
  }
  // window halos (outside)
  const halos = [];
  for (const s of [-1, 1]) for (const x of winX) { const h = glowSprite('#ffc860', 1.9, 0.5); h.position.set(x, (wy0 + wy1) / 2, s * (W / 2 + 0.3)); g.add(h); halos.push(h); }
  // lights that make the train light up its surroundings
  const streetLight = new THREE.PointLight('#ffd890', 14, 16, 1.6); streetLight.position.set(0, -0.2, 0); g.add(streetLight);
  const doorLight = new THREE.PointLight('#ffffff', 0, 9, 1.5); doorLight.position.set(0, 1.2, -(W / 2 + 1.2)); g.add(doorLight);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = V(), _p = V();
  g.userData = {
    LEN, HOVER, winX, W, wy0, wy1, panels, steps, spill, beam,
    winLocal: (i, s) => V(winX[i], (wy0 + wy1) / 2, s * W / 2),
    doorLocal: V(0, 0.16, -0.9),
    set({ t = 0, door = 0, beam: bm = 1, glow = 1, sil = 1, twin = -1, twinSide = -1, light = 1, steps: st = null, tail = 1 } = {}) {
      const d = clamp(door, 0, 1);
      panels[0].position.x = -0.33 - 0.68 * d; panels[1].position.x = 0.33 + 0.68 * d;
      const sv = st == null ? clamp(d * 1.6 - 0.3, 0, 1) : st;
      steps.visible = sv > 0.01; steps.scale.y = Math.max(0.01, sv); steps.position.y = 0;
      spill.visible = d > 0.01; spill.material.opacity = 0.55 * d * glow; doorLight.intensity = 5 * d * glow;
      white.visible = whiteFloor.visible = d > 0.001;
      innerM.color.set('#ffd98a').multiplyScalar(glow); ceilM.color.set('#fff1c8').multiplyScalar(glow);
      halos.forEach((h, k) => { h.material.opacity = 0.5 * glow * (0.85 + 0.15 * Math.sin(t * 3 + k)); });
      beam.visible = beamPool.visible = hlGlow.visible = bm > 0.01; beamM.opacity = 0.32 * bm * (0.92 + 0.08 * Math.sin(t * 7)); beamPool.material.opacity = 0.5 * bm;
      tailGlows.forEach((tg) => { tg.material.opacity = tail; });
      streetLight.intensity = 14 * light * glow;
      silSlots.forEach((sl, k) => {
        const show = sil > 0 && sl.on && !(sl.i === twin && sl.s === twinSide);
        _p.set(sl.x + 0.05 * Math.sin(t * 0.7 + sl.ph), 0.16 + 0.02 * Math.sin(t * 1.3 + sl.ph), sl.z);
        _q.setFromAxisAngle(V(0, 1, 0), sl.s > 0 ? 0 : PI);
        _s.setScalar(show ? 1 : 0.0001);
        sils.setMatrixAt(k, _m.compose(_p, _q, _s));
      });
      sils.instanceMatrix.needsUpdate = true;
    },
  };
  g.userData.set({});
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ fog + motes
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
      g.visible = a > 0.001;
    },
  };
  return g;
}
export function makeMotes({ n = 50, w = 8, h = 6, d = 6, color = '#d9a8ff', size = 0.05 } = {}) {
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

// ════════════════════════════════════════════════════════════════════════════ clock face
let _cfTex = null;
const clockFaceTex = () => _cfTex ??= canvasTexture(512, 512, (g, w) => {
  const c = w / 2;
  const gr = g.createRadialGradient(c, c, 20, c, c, c); gr.addColorStop(0, '#fffdf2'); gr.addColorStop(1, '#f1ddb0');
  g.fillStyle = gr; g.beginPath(); g.arc(c, c, c - 4, 0, PI * 2); g.fill();
  g.lineWidth = 22; g.strokeStyle = '#3a2a1c'; g.beginPath(); g.arc(c, c, c - 14, 0, PI * 2); g.stroke();
  g.fillStyle = '#3a2a1c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PI * 2;
    if (i % 3 === 0) { g.font = FONTW(70); g.fillText(String(i === 0 ? 12 : i), c + Math.sin(a) * 172, c - Math.cos(a) * 172 + 4); }
    else { g.beginPath(); g.arc(c + Math.sin(a) * 186, c - Math.cos(a) * 186, 11, 0, PI * 2); g.fill(); }
  }
  for (let i = 0; i < 60; i++) { if (i % 5 === 0) continue; const a = (i / 60) * PI * 2; g.beginPath(); g.arc(c + Math.sin(a) * 216, c - Math.cos(a) * 216, 4, 0, PI * 2); g.fill(); }
});
export function makeClockFace(r = 0.95) {
  const g = new THREE.Group();
  const faceM = new THREE.MeshBasicMaterial({ map: clockFaceTex(), toneMapped: false });
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 48), faceM); g.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, r * 0.06, 8, 48), std('#d9a93a', { roughness: 0.35, metalness: 0.4, emissive: '#5a3a08', emissiveIntensity: 0.6 })); rim.position.z = 0.02; g.add(rim);
  const handM = basic('#1d1410'), minM = basic('#c0182b');
  const hourP = new THREE.Group(); hourP.position.z = 0.03; g.add(hourP);
  const hour = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.52, 0.02), handM); hour.position.y = r * 0.22; hourP.add(hour);
  const minP = new THREE.Group(); minP.position.z = 0.05; g.add(minP);
  const min = new THREE.Mesh(new THREE.BoxGeometry(r * 0.075, r * 0.86, 0.02), minM); min.position.y = r * 0.34; minP.add(min);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(r * 0.08, 20), basic('#ffd23f')); cap.position.z = 0.07; g.add(cap);
  const halo = glowSprite('#fff2c8', r * 4.2, 0.35); halo.position.z = -0.05; g.add(halo);
  g.userData = {
    face, halo, faceM,
    set(h, m) { minP.rotation.z = -(m / 60) * PI * 2; hourP.rotation.z = -((h % 12) + m / 60) / 12 * PI * 2; },
    bright(k) { faceM.color.setScalar(k); halo.material.opacity = 0.35 * k; },
  };
  g.userData.set(3, 30);
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ small props
export function makeBeard() {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(0.56, 1.0, 0.16, 2, 8, 1); geo.translate(0, -0.5, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), u = -y;    // 0 at the chin → 1 at the knees
    const k = lerp(1, 0.32, Math.pow(u, 0.9));
    p.setX(i, p.getX(i) * k * (1 + 0.06 * Math.sin(u * 14)));
    p.setZ(i, p.getZ(i) * lerp(1, 0.7, u) + 0.05 * Math.sin(u * 3.2));
  }
  geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.95 });
  const b = new THREE.Mesh(geo, m); b.castShadow = true; g.add(b);
  // fluffy tufts + pointed tip
  for (let i = 0; i < 9; i++) { const t = box(0.14, 0.14, 0.12, m, (hash(i) - 0.5) * 0.4 * (1 - i / 10), -0.08 - i * 0.1, 0.07 + 0.02 * hash(i * 3), 0.05); t.rotation.z = (hash(i * 5) - 0.5) * 0.6; g.add(t); }
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), m); tip.rotation.z = PI; tip.position.y = -1.08; g.add(tip);
  return g;
}
export function makeConductorCap() {
  const g = new THREE.Group();
  const navy = std('#1f2a52', { roughness: 0.5 });
  const crown = cyl(0.1, 0.095, 0.08, navy, 20); crown.position.y = 0.04; g.add(crown);
  const top = cyl(0.11, 0.1, 0.02, navy, 20); top.position.y = 0.085; g.add(top);
  const band = cyl(0.097, 0.097, 0.025, std('#ffd23f', { metalness: 0.4, roughness: 0.35 }), 20); band.position.y = 0.015; g.add(band);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.012, 20, 1, false, -PI / 2, PI), std('#111522', { roughness: 0.3 })); brim.position.set(0, 0.0, 0.04); brim.scale.set(1, 1, 0.7); g.add(brim);
  const badge = box(0.04, 0.03, 0.01, std('#ffd23f', { metalness: 0.5, roughness: 0.3, emissive: '#6a4a00', emissiveIntensity: 0.6 }), 0, 0.05, 0.1); g.add(badge);
  return g;
}
export function makeSandwich() {
  const g = new THREE.Group();
  const layers = [['#e7b46a', 0.035], ['#5bd65b', 0.015], ['#e8412c', 0.018], ['#ffd23f', 0.012], ['#f0a8b0', 0.018], ['#e7b46a', 0.035]];
  let y = 0;
  layers.forEach(([c, h], i) => { const w = i === 1 ? 0.21 : 0.18; const b = box(w, h, i === 1 ? 0.15 : 0.13, c, (hash(i) - 0.5) * 0.01, y + h / 2, 0, i === 0 || i === 5 ? 0.012 : 0); g.add(b); y += h; });
  g.children.forEach((c) => { c.position.y -= y / 2; });
  // toothpick + olive
  const pick = cyl(0.004, 0.004, 0.12, '#f3e3a5', 6); pick.position.y = y / 2 + 0.03; g.add(pick);
  const olive = sph(0.015, '#3c8f45', 10, 8); olive.position.y = y / 2 + 0.08; g.add(olive);
  return g;
}
export function makeWhitePaw() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.55 });
  g.add(box(0.088, 0.13, 0.092, m, 0, -0.125, 0.004, 0.025));
  g.add(box(0.096, 0.05, 0.108, m, 0, -0.18, 0.012, 0.02));
  for (const x of [-0.025, 0, 0.025]) { const toe = box(0.022, 0.018, 0.02, std('#ffb3c6'), x, -0.205, 0.063, 0.006); g.add(toe); }
  return g;
}
export function makeLever() {
  const g = new THREE.Group();
  const plate = makeSign(['EMERGENCY', 'STOP'], { w: 0.7, h: 0.42, bg: '#e8232b', fg: '#ffffff', border: '#ffd23f', basicMat: true }); plate.position.set(0, 0.5, 0.02); g.add(plate);
  // hazard frame
  const stripe = canvasTexture(256, 64, (c, w, h) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d1d22'; for (let x = -h; x < w; x += 40) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 20, h); c.lineTo(x + 20 + h, 0); c.lineTo(x + h, 0); c.closePath(); c.fill(); } });
  const frameM = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6 });
  g.add(box(0.86, 1.25, 0.06, frameM, 0, 0.05, -0.02));
  g.add(box(0.62, 0.7, 0.08, '#2a2a30', 0, -0.2, 0.02, 0.02));
  const slot = box(0.08, 0.5, 0.09, '#0d0d10', 0, -0.2, 0.03); g.add(slot);
  const pivot = new THREE.Group(); pivot.position.set(0, -0.0, 0.1); g.add(pivot);
  const arm = box(0.07, 0.5, 0.07, std('#c9ccd2', { metalness: 0.6, roughness: 0.3 }), 0, 0.25, 0.08); pivot.add(arm);
  const handle = cyl(0.06, 0.06, 0.34, std('#e8232b', { roughness: 0.4, emissive: '#550000', emissiveIntensity: 0.5 }), 16); handle.rotation.z = PI / 2; handle.position.set(0, 0.52, 0.08); pivot.add(handle);
  for (const s of [-1, 1]) { const end = cyl(0.065, 0.065, 0.04, std('#f2f2f2'), 16); end.rotation.z = PI / 2; end.position.set(s * 0.17, 0.52, 0.08); pivot.add(end); }
  const beaconM = new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10, 0, PI * 2, 0, PI / 2), beaconM); beacon.position.set(0, 0.72, 0.05); g.add(beacon);
  const bglow = glowSprite('#ff2020', 1.6, 0.8); bglow.position.set(0, 0.76, 0.1); g.add(bglow);
  g.userData = {
    handle, pivot,
    set(pull = 0, t = 0, flash = 0) {
      pivot.rotation.x = lerp(-0.25, 2.2, ease.inOutCubic(clamp(pull, 0, 1)));
      const k = flash > 0 ? (Math.sin(t * 22) > 0 ? 1 : 0.25) : 0.35;
      beaconM.color.set('#ff2a2a').multiplyScalar(0.5 + k); bglow.material.opacity = 0.25 + 0.75 * k * (flash > 0 ? 1 : 0.4); bglow.scale.setScalar(flash > 0 ? 2.6 : 1.4);
    },
  };
  g.userData.set(0);
  return g;
}
export function makeSparks(n = 40) {
  const g = new THREE.Group(), list = [];
  const geo = new THREE.SphereGeometry(0.022, 6, 4);
  const cols = ['#fff6a0', '#ffd23f', '#ff9a2a', '#ffffff'];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, basic(cols[i % 4], { toneMapped: false })); g.add(m); list.push({ m, vx: (hash(i * 1.3) - 0.5) * 3.2, vy: 0.8 + hash(i * 2.7) * 2.6, vz: 0.4 + hash(i * 4.1) * 1.6, d: 0.3 + hash(i * 5.3) * 0.7 }); }
  const flash = glowSprite('#fff0a0', 1.4, 1); g.add(flash);
  g.userData = {
    set(u) {
      g.visible = u > 0 && u < 1;
      if (!g.visible) return;
      const tt = u * 1.0;
      list.forEach((p) => { const k = clamp(tt / p.d, 0, 1); p.m.visible = k < 1; p.m.position.set(p.vx * tt, p.vy * tt - 4.9 * tt * tt, p.vz * tt); p.m.scale.setScalar(1.4 * (1 - k)); });
      flash.material.opacity = clamp(1 - u * 4, 0, 1); flash.scale.setScalar(0.6 + u * 3);
    },
  };
  g.userData.set(0);
  return g;
}
const SPINES = ['#c0392b', '#2f6fd6', '#3c8f45', '#ffd23f', '#8a5cff', '#ff7a2f', '#1d1d22', '#e9d8b5', '#3ee0c8', '#7a1f2b'];
function spineTex(seed, rows = 5) {
  return canvasTexture(512, 704, (g, w, h) => {
    g.fillStyle = '#5a3b24'; g.fillRect(0, 0, w, h);
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = 14;
      while (x < w - 20) {
        const bw = 18 + hash(seed * 7 + r * 13 + x) * 26, bh = rh * (0.62 + 0.3 * hash(seed + r * 3.3 + x * 0.7));
        if (x + bw > w - 14) break;
        g.fillStyle = SPINES[Math.floor(hash(seed * 3 + r * 11 + x * 1.7) * SPINES.length)];
        g.fillRect(x, r * rh + rh - 12 - bh, bw - 3, bh);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 3, r * rh + rh - 12 - bh * 0.75, bw - 9, 5);
        x += bw;
      }
      g.fillStyle = '#3a2614'; g.fillRect(0, r * rh + rh - 12, w, 12);
    }
  });
}
export function makeBookcase(seed = 1, w = 1.6, h = 2.2) {
  const g = new THREE.Group();
  const wood = std('#6b4a2f');
  g.add(box(w, h, 0.06, wood, 0, h / 2, -0.17));
  for (const s of [-1, 1]) g.add(box(0.06, h, 0.4, wood, s * (w / 2 - 0.03), h / 2, 0));
  g.add(box(w, 0.06, 0.4, wood, 0, h - 0.03, 0)); g.add(box(w, 0.08, 0.4, wood, 0, 0.04, 0));
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.12, h - 0.14), new THREE.MeshStandardMaterial({ map: spineTex(seed), roughness: 0.8 }));
  front.position.set(0, h / 2, 0.1); g.add(front);
  return g;
}
export function makeBookPile(seed = 1, n = 7) {
  const g = new THREE.Group();
  let y = 0;
  for (let i = 0; i < n; i++) {
    const h = 0.06 + hash(seed * 5 + i) * 0.05, w = 0.32 + hash(seed + i * 3.1) * 0.14, d = 0.24 + hash(seed * 2 + i) * 0.06;
    const b = box(w, h, d, SPINES[Math.floor(hash(seed * 9 + i * 1.7) * SPINES.length)], (hash(seed + i * 7) - 0.5) * 0.06, y + h / 2, (hash(seed * 3 + i) - 0.5) * 0.05, 0.01);
    b.rotation.y = (hash(seed * 4 + i * 2.3) - 0.5) * 0.5; g.add(b);
    const pages = box(w - 0.02, h * 0.7, d + 0.005, '#fbf6ec', 0, 0, 0); pages.castShadow = false; b.add(pages); pages.position.x = 0.012;
    y += h;
  }
  return g;
}
export function makeBench() {
  const g = new THREE.Group(), w = '#9a6a3c';
  for (let i = 0; i < 3; i++) g.add(box(1.8, 0.05, 0.15, w, 0, 0.5, -0.17 + i * 0.17, 0.015));
  for (let i = 0; i < 2; i++) { const b = box(1.8, 0.13, 0.04, w, 0, 0.75 + i * 0.18, -0.29, 0.015); b.rotation.x = -0.15; g.add(b); }
  for (const s of [-1, 1]) { g.add(box(0.07, 0.5, 0.46, '#2a2a30', s * 0.78, 0.25, -0.02)); g.add(box(0.06, 0.55, 0.06, '#2a2a30', s * 0.78, 0.78, -0.3)); g.add(box(0.07, 0.05, 0.42, '#2a2a30', s * 0.84, 0.68, 0)); }
  return g;
}
export function makeBackpack() {
  const g = new THREE.Group();
  const c = std('#e8412c', { roughness: 0.6 });
  g.add(box(0.46, 0.52, 0.2, c, 0, 0, -0.1, 0.07));
  g.add(box(0.36, 0.22, 0.08, std('#ffd23f'), 0, -0.1, -0.22, 0.04));
  g.add(box(0.3, 0.03, 0.01, '#1d1d22', 0, 0.0, -0.265));
  for (const s of [-1, 1]) g.add(box(0.06, 0.5, 0.04, '#1d1d22', s * 0.15, 0.02, 0.02, 0.015));
  return g;
}
export function makeCurtainWindow() {
  const g = new THREE.Group();
  const paneM = new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.24), paneM); g.add(pane);
  const halo = glowSprite('#ffc46a', 2.6, 0.8); halo.position.z = 0.05; g.add(halo);
  const cur = new THREE.MeshStandardMaterial({ color: '#d0402e', roughness: 0.85, emissive: '#6a1408', emissiveIntensity: 0.9 });
  const L = new THREE.Group(), R = new THREE.Group(); g.add(L); g.add(R);
  for (const [grp, s] of [[L, -1], [R, 1]]) for (let k = 0; k < 4; k++) grp.add(box(0.14, 1.22, 0.04 + 0.02 * (k % 2), cur, s * (0.07 + k * 0.125), 0, 0.03 + 0.012 * (k % 2)));
  g.add(box(1.25, 0.08, 0.08, '#5a3a22', 0, 0.66, 0.06));
  g.userData = {
    set(close = 0, light = 1) {
      const c = clamp(close, 0, 1);
      L.position.x = -0.5 + 0.5 * c; R.position.x = 0.5 - 0.5 * c;
      L.scale.x = lerp(0.35, 1, c); R.scale.x = lerp(0.35, 1, c);
      paneM.color.set('#ffd27a').multiplyScalar(lerp(1.1, 0.12, c) * light);
      halo.material.opacity = lerp(0.85, 0.0, c) * light;
    },
  };
  g.userData.set(0, 1);
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ window dioramas
function gradTex(top, bottom, extra) {
  return canvasTexture(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); if (extra) extra(g, w, h); });
}
function backdrop(top, bottom, w = 7, h = 4.5, extra) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: gradTex(top, bottom, extra), toneMapped: false, fog: false }));
}
function miniHouse(wall, roof, s = 1, lit = 0) {
  const g = new THREE.Group();
  g.add(box(0.8 * s, 0.6 * s, 0.6 * s, std(wall, { emissive: wall, emissiveIntensity: 0.15 }), 0, 0.3 * s, 0, 0.03));
  const r = new THREE.Mesh(new THREE.ConeGeometry(0.62 * s, 0.42 * s, 4), std(roof)); r.rotation.y = PI / 4; r.position.y = 0.81 * s; r.scale.z = 0.8; g.add(r);
  const winM = lit ? basic('#ffd27a', { toneMapped: false }) : std('#3b4f78');
  for (const x of [-0.2, 0.2]) g.add(box(0.14 * s, 0.14 * s, 0.01, winM, x * s, 0.4 * s, 0.305 * s));
  g.add(box(0.14 * s, 0.24 * s, 0.01, std('#7d5232'), 0, 0.12 * s, 0.305 * s));
  return g;
}
function makeDino() {
  const g = new THREE.Group(), c = std('#6fbf4a', { emissive: '#1f4a10', emissiveIntensity: 0.35 }), c2 = std('#4c9a34');
  const body = new THREE.Group(); g.add(body);
  body.add(box(1.0, 0.5, 0.45, c, 0, 0.75, 0, 0.12));
  body.add(box(0.6, 0.1, 0.46, std('#e8d77a'), 0, 0.55, 0, 0.04));
  const neck = []; let parent = body, px = 0.42, py = 0.9;
  for (let i = 0; i < 4; i++) { const n = new THREE.Group(); n.position.set(px, py, 0); parent.add(n); n.add(box(0.2, 0.36, 0.2, c, 0, 0.16, 0, 0.06)); n.rotation.z = -0.32; neck.push(n); parent = n; px = 0; py = 0.3; }
  const head = box(0.34, 0.18, 0.22, c, 0.1, 0.38, 0, 0.06); parent.add(head);
  for (const s of [-1, 1]) { const e = box(0.05, 0.05, 0.02, basic('#1d1d22'), 0.18, 0.43, s * 0.11); parent.add(e); }
  const tail = []; parent = body; px = -0.5; py = 0.8;
  for (let i = 0; i < 4; i++) { const t = new THREE.Group(); t.position.set(px, py, 0); parent.add(t); t.add(box(0.32, 0.22 - i * 0.04, 0.2 - i * 0.03, c, -0.15, 0, 0, 0.05)); t.rotation.z = 0.15; tail.push(t); parent = t; px = -0.3; py = 0; }
  const legs = [];
  for (const [x, z] of [[0.32, 0.16], [0.32, -0.16], [-0.32, 0.16], [-0.32, -0.16]]) { const l = new THREE.Group(); l.position.set(x, 0.6, z); body.add(l); l.add(box(0.16, 0.6, 0.16, c2, 0, -0.28, 0, 0.04)); legs.push(l); }
  for (let i = 0; i < 5; i++) body.add(box(0.1, 0.12, 0.06, std('#e8a23a'), 0.3 - i * 0.18, 1.04 - Math.abs(i - 1) * 0.02, 0, 0.02));
  g.userData = {
    set(t) {
      legs.forEach((l, i) => { l.rotation.z = 0.35 * Math.sin(t * 4 + (i === 0 || i === 3 ? 0 : PI)); });
      neck.forEach((n, i) => { n.rotation.z = -0.3 + 0.06 * Math.sin(t * 2 + i * 0.6); });
      tail.forEach((n, i) => { n.rotation.y = 0.2 * Math.sin(t * 2.4 - i * 0.7); });
      body.position.y = 0.03 * Math.abs(Math.sin(t * 4));
    },
  };
  return g;
}
function makeFish() {
  const g = new THREE.Group();
  const c = std('#ff7a2f', { emissive: '#8a2a00', emissiveIntensity: 0.4 });
  g.add(box(0.42, 0.3, 0.16, c, 0, 0, 0, 0.06));
  g.add(box(0.12, 0.3, 0.165, std('#ffffff'), 0.06, 0, 0, 0.03));
  const tail = new THREE.Group(); tail.position.x = -0.22; g.add(tail);
  const tm = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 4), c); tm.rotation.z = -PI / 2; tm.position.x = -0.08; tm.scale.z = 0.3; tail.add(tm);
  for (const s of [-1, 1]) { g.add(box(0.06, 0.06, 0.01, basic('#ffffff'), 0.14, 0.05, s * 0.085)); g.add(box(0.03, 0.03, 0.01, basic('#1d1d22'), 0.15, 0.05, s * 0.09)); }
  g.userData = { set(t) { tail.rotation.y = 0.5 * Math.sin(t * 9); } };
  return g;
}
function miniLamp(h = 1.3) {
  const g = new THREE.Group();
  g.add(cyl(0.03, 0.04, h, '#2a2a30', 8)); g.children[0].position.y = h / 2;
  const head = box(0.16, 0.12, 0.16, basic('#ffe9b0', { toneMapped: false }), 0, h + 0.04, 0, 0.03); g.add(head);
  const hg = glowSprite('#ffd890', 0.9, 0.8); hg.position.y = h + 0.04; g.add(hg);
  return g;
}
function makeBusStop() {
  const g = new THREE.Group();
  const frame = std('#2a2a30'), glass = new THREE.MeshStandardMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.35, roughness: 0.1 });
  for (const x of [-0.7, 0.7]) g.add(box(0.05, 1.1, 0.05, frame, x, 0.55, -0.25));
  g.add(box(1.6, 0.06, 0.6, std('#e8412c'), 0, 1.12, -0.05, 0.02));
  g.add(box(1.4, 0.8, 0.02, glass, 0, 0.6, -0.26));
  g.add(box(1.0, 0.05, 0.25, std('#9a6a3c'), 0, 0.32, -0.12));
  const sign = makeSign(['BUS'], { w: 0.34, h: 0.22, bg: '#ffffff', fg: '#2f6fd6', border: '#2f6fd6' }); sign.position.set(0.62, 1.42, 0.05); g.add(sign);
  g.add(box(0.04, 1.4, 0.04, frame, 0.62, 0.7, 0.03));
  return g;
}
export function makeTinyHat(kind = 'top', color = '#16161c') {
  const g = new THREE.Group(), m = std(color, { roughness: 0.45 });
  if (kind === 'top') {
    const brim = cyl(0.075, 0.075, 0.012, m, 20); g.add(brim);
    const crown = cyl(0.048, 0.05, 0.1, m, 20); crown.position.y = 0.055; g.add(crown);
    const band = cyl(0.0505, 0.0505, 0.02, std('#ffd23f'), 20); band.position.y = 0.018; g.add(band);
  } else if (kind === 'bowler') {
    const brim = cyl(0.07, 0.07, 0.01, m, 20); g.add(brim);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 8, 0, PI * 2, 0, PI / 2), m); g.add(dome);
  } else {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 8, 0, PI * 2, 0, PI / 2), m); g.add(cap);
    const bill = cyl(0.05, 0.05, 0.008, m, 14); bill.position.set(0, 0.002, 0.05); bill.scale.z = 0.8; g.add(bill);
  }
  return g;
}
function bubbleField(n = 18) {
  const g = new THREE.Group(), list = [];
  const m = new THREE.MeshStandardMaterial({ color: '#dff6ff', transparent: true, opacity: 0.55, roughness: 0.05, emissive: '#6ac8ff', emissiveIntensity: 0.4 });
  for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.04 + hash(i * 2.3) * 0.07, 12, 8), m); g.add(s); list.push(s); }
  g.userData = { set(t) { list.forEach((s, i) => { const u = (hash(i * 1.7) + t * (0.12 + 0.08 * hash(i * 3.3))) % 1; s.position.set((hash(i * 5.1) - 0.5) * 2.6 + 0.08 * Math.sin(t * 3 + i), -0.2 + u * 2.6, (hash(i * 6.3) - 0.5) * 1.2); }); } };
  return g;
}
function seaweed(x, z, h) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  for (let i = 0; i < 4; i++) { const b = box(0.08, h / 4, 0.04, std('#2fa86a', { emissive: '#0d4a2a', emissiveIntensity: 0.4 }), 0.04 * Math.sin(i * 1.4), h / 8 + i * h / 4, 0, 0.02); g.add(b); }
  return g;
}
/** One window view: content placed in the view's local frame (x along the wall, +z = toward the window/viewer, y up). */
function makeView(kind) {
  const g = new THREE.Group(), spots = {};
  let anim = null;
  if (kind === 'dino') {
    const bd = backdrop('#8af08a', '#d8ffb0', 1.98, 5, (c, w, h) => { c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(40 + i * 60, 60 + 20 * Math.sin(i), 18, 0, PI * 2); c.arc(60 + i * 60, 55 + 20 * Math.sin(i), 22, 0, PI * 2); c.fill(); } });
    bd.position.set(0, 1.2, -3.2); g.add(bd);
    g.add(box(8, 0.1, 4, std('#5aa83a'), 0, -0.05, -1.4));
    g.add(box(8, 0.11, 0.5, std('#7a7d86'), 0, -0.04, -0.9));
    [[-0.55, -2.3, '#e9d8b5', '#b5543f'], [0.5, -2.6, '#c9e4f2', '#4a5d7e'], [-0.2, -3.0, '#f2c4c4', '#6b4a3a']].forEach(([x, z, w, r], i) => { const h = miniHouse(w, r, 0.8); h.position.set(x, 0, z); g.add(h); });
    for (const [x, z] of [[-0.75, -1.7], [0.75, -2.0]]) { const tr = new THREE.Group(); tr.position.set(x, 0, z); tr.add(box(0.1, 0.5, 0.1, '#6b4a2f', 0, 0.25, 0)); const cr = sph(0.32, std('#3c8f45', { emissive: '#103a10', emissiveIntensity: 0.3 }), 8, 6); cr.position.y = 0.7; tr.add(cr); g.add(tr); }
    const dino = makeDino(); g.add(dino);
    anim = (t) => { const u = ((t * 0.16 + 0.35) % 1); dino.position.set(lerp(-1.3, 1.3, u), 0, -1.35); dino.userData.set(t); };
    g.userData.dino = dino;
  } else if (kind === 'water') {
    const bd = backdrop('#1a7fd6', '#0b3a7a', 1.98, 5, (c, w, h) => { c.fillStyle = 'rgba(180,240,255,0.18)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(i * 50, 0); c.lineTo(i * 50 + 30, 0); c.lineTo(i * 50 - 20, h); c.lineTo(i * 50 - 40, h); c.fill(); } });
    bd.position.set(0, 1.2, -3.2); g.add(bd);
    g.add(box(8, 0.1, 4, std('#e8d6a0', { emissive: '#5a4a20', emissiveIntensity: 0.25 }), 0, -0.05, -1.4));
    const lamp = miniLamp(1.7); lamp.position.set(0.45, 0, -1.6); g.add(lamp);
    const h = miniHouse('#c9e4f2', '#4a5d7e', 1.0); h.position.set(-0.45, 0, -2.6); g.add(h);
    for (const [x, z, hh] of [[-0.7, -1.2, 0.8], [0.8, -1.4, 1.0], [-0.2, -1.0, 0.5], [0.7, -2.4, 1.1]]) g.add(seaweed(x, z, hh));
    const fish = makeFish(); g.add(fish); const fish2 = makeFish(); fish2.scale.setScalar(0.6); g.add(fish2);
    const bub = bubbleField(22); g.add(bub);
    anim = (t) => {
      const u = (t * 0.2 + 0.3) % 1; fish.position.set(lerp(-1.2, 1.2, u), 1.25 + 0.1 * Math.sin(t * 2), -1.0); fish.userData.set(t);
      const u2 = (t * 0.17 + 0.5) % 1; fish2.position.set(lerp(1.2, -1.2, u2), 1.5 + 0.08 * Math.sin(t * 2.5), -1.8); fish2.rotation.y = PI; fish2.userData.set(t + 1);
      bub.userData.set(t);
    };
  } else if (kind === 'pigeons') {
    const bd = backdrop('#b8bcc6', '#e3e5ea', 1.98, 5, (c, w, h) => { c.fillStyle = 'rgba(120,124,136,0.5)'; for (let i = 0; i < 5; i++) c.fillRect(i * 56, h * 0.35 + 20 * hash(i), 40, h); });
    bd.position.set(0, 1.2, -3.2); g.add(bd);
    g.add(box(8, 0.1, 4, std('#9a9ca4'), 0, -0.05, -1.4));
    g.add(box(8, 0.12, 0.6, std('#c9c4ba'), 0, 0.01, -1.0));
    const stop = makeBusStop(); stop.position.set(0.0, 0.07, -1.3); stop.scale.set(0.9, 1, 1); g.add(stop);
    for (let i = 0; i < 3; i++) { const o = new THREE.Object3D(); o.position.set(-0.45 + i * 0.4, 0.39, -1.42 + (i % 2) * 0.05); g.add(o); spots['p' + i] = o; }
    const o = new THREE.Object3D(); o.position.set(0.55, 0.07, -0.85); g.add(o); spots.p3 = o;
  } else if (kind === 'street') {
    const bd = backdrop('#0a1240', '#2a3a7a', 1.98, 5, (c, w, h) => { c.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) c.fillRect(hash(i * 3.3) * w, hash(i * 7.1) * h * 0.6, 2, 2); });
    bd.position.set(0, 1.2, -3.2); g.add(bd);
    g.add(box(8, 0.1, 4, std('#2f3a4a'), 0, -0.05, -1.4));
    g.add(box(8, 0.11, 0.7, std('#3a3d46'), 0, -0.04, -0.8));
    [-0.6, 0, 0.6].forEach((x, i) => { const h = miniHouse(['#e9d8b5', '#bfd8ee', '#f2c4c4'][i], ['#b5543f', '#3b4f78', '#6b4a3a'][i], 0.7, 1); h.position.set(x, 0, -2.2 - 0.3 * (i % 2)); g.add(h); });
    for (const x of [-0.35, 0.45]) { const l = miniLamp(1.1); l.position.set(x, 0, -1.2); g.add(l); }
  } else if (kind === 'house') {
    const bd = backdrop('#0a1240', '#2a3a7a', 1.98, 5, (c, w, h) => { c.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) c.fillRect(hash(i * 5.3) * w, hash(i * 2.1) * h * 0.6, 2, 2); });
    bd.position.set(0, 1.2, -3.2); g.add(bd);
    g.add(box(8, 0.1, 4, std('#2f5a3a'), 0, -0.05, -1.4));
    const h = miniHouse('#bfd8ee', '#3b4f78', 1.25, 1); h.position.set(0, 0, -2.3); g.add(h);
    g.add(box(0.2, 0.05, 0.8, std('#cfc6b6'), 0, 0.01, -1.6));
    const l = miniLamp(1.5); l.position.set(0.75, 0, -1.2); g.add(l);
  } else if (kind === 'bedroom') {
    const bd = backdrop('#2a2050', '#463a7a', 1.98, 5, (c, w, h) => { c.fillStyle = '#ffe9a0'; c.fillRect(w * 0.6, h * 0.25, w * 0.18, h * 0.2); c.fillStyle = '#463a7a'; c.fillRect(w * 0.685, h * 0.25, 4, h * 0.2); });
    bd.position.set(0, 1.2, -2.4); g.add(bd);
    g.add(box(8, 0.1, 4, std('#5a4a6a'), 0, -0.05, -1.4));
    const bed = new THREE.Group(); bed.position.set(0.0, 0, -1.25); g.add(bed);
    bed.add(box(2.1, 0.45, 1.0, std('#6b4a2f'), 0, 0.225, 0, 0.04));
    bed.add(box(2.0, 0.18, 0.95, std('#f6f3ea'), 0, 0.5, 0, 0.06));
    bed.add(box(0.1, 0.9, 1.05, std('#6b4a2f'), -1.05, 0.45, 0, 0.03));
    bed.add(box(0.38, 0.14, 0.7, std('#ffffff'), -0.78, 0.65, 0, 0.06));
    const blanket = box(1.4, 0.22, 0.98, std('#4f7fbf', { emissive: '#14244a', emissiveIntensity: 0.3 }), 0.3, 0.66, 0, 0.08); bed.add(blanket);
    const o = new THREE.Object3D(); o.position.set(-0.55, 0.56, -1.25); g.add(o); spots.bed = o;
    const nl = glowSprite('#ffd27a', 1.2, 0.6); nl.position.set(0.8, 0.9, -2.0); g.add(nl);
  } else {
    const cols = { pink: ['#ff6fb8', '#ffd0ea'], orange: ['#ff9a3a', '#ffe0a0'], purple: ['#8a5cff', '#d8c8ff'], teal: ['#2fd6c0', '#c8fff4'], gold: ['#ffd23f', '#fff4c0'], red: ['#ff5a5a', '#ffd0c0'] }[kind] || ['#ffffff', '#cccccc'];
    const bd = backdrop(cols[0], cols[1], 1.98, 5, (c, w, h) => { c.fillStyle = 'rgba(255,255,255,0.3)'; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(hash(i * 2.2 + kind.length) * w, hash(i * 4.4 + kind.length) * h, 6 + 14 * hash(i), 0, PI * 2); c.fill(); } });
    bd.position.set(0, 1.2, -2.6); g.add(bd);
  }
  // box the view so neighbouring windows never show each other's content
  const wallM = std('#1d1a2a');
  for (const sx of [-1, 1]) { const w = box(0.06, 5, 4, wallM, sx * 0.98, 1.2, -1.9); w.castShadow = false; g.add(w); }
  g.add(box(2.0, 0.06, 4, wallM, 0, 3.0, -1.9));
  g.userData = { kind, spots, set(t) { if (anim) anim(t); } };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ train interior set
export const CAB = { LEN: 20, W: 3.0, H: 2.6, WY0: 0.95, WY1: 2.05, WW: 1.2 };
export function buildTrainInterior() {
  const root = new THREE.Group(); root.name = 'trainInterior';
  const { LEN, W, H, WY0, WY1, WW } = CAB, half = LEN / 2, T = 0.1;
  const winX = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
  // views: left wall = −z side, right wall = +z side
  const LEFT = ['pink', 'dino', 'water', 'pigeons', 'purple', 'orange', 'teal', 'gold', 'pink'];
  const RIGHT = ['teal', 'orange', 'street', 'house', 'bedroom', 'pink', 'purple', 'red', 'gold'];
  const wallM = new THREE.MeshStandardMaterial({ color: '#efe6d2', roughness: 0.8 });
  const lowM = new THREE.MeshStandardMaterial({ color: '#7a1f2b', roughness: 0.7 });
  const walls = [], lows = [];
  for (const s of [-1, 1]) {
    const z = s * (W / 2 + T / 2);
    walls.push([LEN, H - WY1, T, 0, (WY1 + H) / 2, z]);
    lows.push([LEN, WY0, T, 0, WY0 / 2, z]);
    const edges = [-half]; for (const x of winX) edges.push(x - WW / 2, x + WW / 2); edges.push(half);
    for (let i = 0; i < edges.length; i += 2) if (edges[i + 1] > edges[i]) walls.push([edges[i + 1] - edges[i], WY1 - WY0, T, (edges[i] + edges[i + 1]) / 2, (WY0 + WY1) / 2, z]);
  }
  walls.push([T, H, W + 0.2, -half - T / 2, H / 2, 0]);
  walls.push([T, H, W + 0.2, half + T / 2, H / 2, 0]);
  const wm = new THREE.Mesh(mergedBoxes(walls), wallM); wm.receiveShadow = true; root.add(wm);
  root.add(new THREE.Mesh(mergedBoxes(lows), lowM));
  // floor + ceiling
  const floorTex = canvasTexture(256, 256, (g, w, h) => { g.fillStyle = '#2f3f6a'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a4c7e'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) g.fillRect(i * 32, j * 32, 32, 32); g.fillStyle = '#ffd23f'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6); });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(LEN / 3, 1);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.1, W), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85 })); floor.position.y = -0.05; floor.receiveShadow = true; root.add(floor);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(LEN + 0.2, 0.1, W + 0.2), std('#e8dcc0')); ceil.position.y = H + 0.05; root.add(ceil);
  const stripM = new THREE.MeshBasicMaterial({ color: '#fff3d0', toneMapped: false });
  for (const s of [-1, 1]) { const st = box(LEN - 0.6, 0.04, 0.22, stripM, 0, H - 0.02, s * 0.75); st.castShadow = false; root.add(st); }
  // brass handrails + straps
  const brass = std('#d9a93a', { metalness: 0.6, roughness: 0.3 });
  for (const s of [-1, 1]) { const r = cyl(0.025, 0.025, LEN - 1, brass, 8); r.rotation.z = PI / 2; r.position.set(0, H - 0.35, s * 0.6); root.add(r); }
  // window frames + sills (brass)
  const fr = [];
  for (const s of [-1, 1]) for (const x of winX) { const z = s * (W / 2 - 0.01); fr.push([WW + 0.12, 0.06, 0.08, x, WY0, z], [WW + 0.12, 0.06, 0.06, x, WY1, z], [0.06, WY1 - WY0, 0.06, x - WW / 2, (WY0 + WY1) / 2, z], [0.06, WY1 - WY0, 0.06, x + WW / 2, (WY0 + WY1) / 2, z]); }
  root.add(new THREE.Mesh(mergedBoxes(fr), brass));
  // seats: facing pairs between windows along each wall
  const seatM = new THREE.MeshStandardMaterial({ color: '#2f8f8a', roughness: 0.7 }), seatBase = std('#5a3b24');
  const seats = [], bases = [];
  const seatXs = [];
  for (const x of winX) seatXs.push(x - 0.62, x + 0.62);
  for (const s of [-1, 1]) for (let k = 0; k < seatXs.length; k++) {
    const x = seatXs[k], face = k % 2 ? -1 : 1;   // pair faces each other across the window centre
    const z = s * (W / 2 - 0.42);
    bases.push([0.5, 0.42, 0.75, x, 0.21, z]);
    seats.push([0.52, 0.12, 0.76, x, 0.48, z, 0.04]);
    seats.push([0.12, 0.7, 0.76, x - face * 0.24, 0.85, z, 0.04]);
  }
  root.add(new THREE.Mesh(mergedBoxes(bases), seatBase));
  const seatMesh = new THREE.Mesh(mergedBoxes(seats), seatM); seatMesh.castShadow = true; root.add(seatMesh);
  // end walls: back (−X) door window + sign, front (+X) cab door
  const backSign = makeSign(['CARRIAGE 3:33'], { w: 1.4, h: 0.3, bg: '#1d1d22', fg: '#ffd23f', border: '#ffd23f', basicMat: true }); backSign.position.set(-half + 0.01, 2.2, 0); backSign.rotation.y = PI / 2; root.add(backSign);
  const frontDoor = box(0.06, 2.0, 0.9, std('#9aa3b0', { metalness: 0.5, roughness: 0.3 }), half - 0.03, 1.0, 0); root.add(frontDoor);
  const fdw = box(0.02, 0.6, 0.5, basic('#ffffff', { toneMapped: false }), half - 0.07, 1.4, 0); root.add(fdw);
  const backDoor = box(0.06, 2.0, 0.9, std('#9aa3b0', { metalness: 0.5, roughness: 0.3 }), -half + 0.03, 1.0, 0); root.add(backDoor);
  const bdw = box(0.02, 0.6, 0.5, basic('#ff9ad0', { toneMapped: false }), -half + 0.07, 1.4, 0); root.add(bdw);
  // views behind the windows
  const views = [];
  [[-1, LEFT], [1, RIGHT]].forEach(([s, kinds]) => {
    winX.forEach((x, i) => {
      const v = makeView(kinds[i]);
      v.position.set(x, WY0 - 0.25, s * (W / 2 + 0.2));
      v.rotation.y = s < 0 ? 0 : PI;   // view local +z points back toward the carriage (−z wall: +z inward)
      // local -z must point away from the carriage
      root.add(v); views.push({ v, kind: kinds[i], side: s, x, i });
    });
  });
  // window light pools on the floor (additive) — colour per view
  const VCOL = { pink: '#ff6fb8', dino: '#8af08a', water: '#2a8fff', pigeons: '#c8ccd6', purple: '#a07aff', orange: '#ff9a3a', teal: '#2fd6c0', gold: '#ffd23f', red: '#ff5a5a', street: '#4a6aff', house: '#6a8aff', bedroom: '#8a6acc' };
  const pools = [];
  views.forEach(({ x, side, kind }) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), new THREE.MeshBasicMaterial({ map: glowTex(), color: VCOL[kind] || '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45 }));
    p.rotation.x = -PI / 2; p.position.set(x, 0.012, side * (W / 2 - 0.55)); root.add(p); pools.push(p);
    const h = glowSprite(VCOL[kind] || '#ffffff', 1.4, 0.18); h.position.set(x, (WY0 + WY1) / 2, side * (W / 2 - 0.12)); root.add(h);
  });
  // lights
  const hemi = new THREE.HemisphereLight('#fff0d8', '#4a3a5a', 1.25);
  const p1 = new THREE.PointLight('#ffe2b0', 9, 12, 1.4); p1.position.set(-5, 2.3, 0);
  const p2 = new THREE.PointLight('#ffe2b0', 9, 12, 1.4); p2.position.set(4, 2.3, 0);
  const key = new THREE.DirectionalLight('#ffffff', 0.6); key.position.set(3, 8, 4); key.target.position.set(0, 0, 0);
  root.add(hemi, p1, p2, key, key.target);
  const lever = new THREE.Object3D(); lever.position.set(-7, 1.45, -(W / 2) + 0.02); root.add(lever);   // on the left wall, faces +z
  const backSeat = new THREE.Object3D(); backSeat.position.set(-8.62, 0.54, 0.98); backSeat.rotation.y = PI / 2; root.add(backSeat);
  const background = new THREE.Color('#1a1030');
  const set = {
    root, anchors: { 'cab.lever': lever, 'cab.backSeat': backSeat }, background, fog: null, views, winX,
    lights: { hemi, p1, p2, key }, stripM, pools,
    options: {},
    set() { return set; },
    setLighting() {},
    view(kind) { return views.find((v) => v.kind === kind); },
    update(t) { views.forEach((v) => v.v.userData.set(t)); },
    info: { kind: 'trainInterior' },
  };
  return set;
}
