// In This Town — Episode 27 "Moving Night": new props.  Same conventions as src/props.js (SPEC.md §2/§7): ES module,
// metres, Y up, +Z = the prop's front, deterministic (every animator sets absolute values from the t / u passed in).
//
//   makeLegHouse(o)     a town house (same look/footprint as world.js houses: w × 7 m, walls 5.8 m, gable roof along X)
//                       on four chunky legs.  root origin = ground point under the body centre.  o: { w, d, wall, roof,
//                       trim, door, shutters, legColor, bootColor, bay (hero bedroom bay window you can see into),
//                       backDoor, sign (text over the door), chimneyX, seed }
//                       userData.set(t, s) — s (all optional):
//                         rise 0 (sitting on the ground, legs tucked away) … 1 (standing tall), mode 'stand' | 'walk' |
//                         'tiptoe' | 'gallop' | 'scramble', freq (steps/s), stride (m), lift (m), phase (overrides t·freq),
//                         bob (gallop body bounce m), pitch, roll, yaw (body), stretch 0..1 (cat stretch), crouch 0..1,
//                         spread (feet out to the sides), wag 0..1 (front door swings like a tail), glow 0..1 window light,
//                         glowColor, halo 0..1 (big soft glow on the facade), bell 0..1 (doorbell glow), smoke 0..1,
//                         smokeDrift (m the puffs trail backwards), frost 0..1, porch 0..1 (porch lamps), bayLight 0..1,
//                         stomp (index of a leg lifted high, -1 none), stompU 0..1, legsOn (force legs visible)
//                       userData.body (Group, body frame: origin bottom centre of the walls), userData.pt(name) → WORLD
//                       point of 'bay' (character root spot in the bay), 'bell', 'handle' (front door handle), 'backHandle',
//                       'canopy' (front edge of the porch canopy top), 'ridge', 'chimney', 'door' (on the step), 'win'
//                       (front upper middle window centre); userData.foot(i) → world sole centre of leg i (0 FL, 1 FR,
//                       2 BL, 3 BR); userData.dims { w, d, H, rh, STAND }
//   makeMini(kind, o)   the babies: kind 'shed' (tiny wooden shed with a tiny chimney) | 'garage' (tiny garage), on four
//                       stubby wobbly legs.  Origin = ground centre, front +Z.  userData.set(t, { run 0..1, freq, hop 0..1
//                       (body hop height ×), wobble 0..1, wag 0..1 (door), smoke 0..1, lean, yawWiggle, squash })
//                       userData.parts { leg: [..], door, chimney }, userData.pt(name) world 'door' | 'chimney' | 'leg0' | 'collar'
//   makeChain(n)        heavy chain of n links (instanced).  userData.set(A, B, sag)  (points in the parent frame)
//   makePadlock()       giant gold padlock, origin = body centre, faces +Z.  userData.set(closed 0..1)
//   makeAlarmClock()    red twin-bell alarm clock (≈0.3 m), face +Z showing 6:00.  userData.set(t, ring 0..1)
//   makeSleepingBag(c)  sleeping bag lying along Z (origin ground centre, ≈0.85 × 2.1)
//   makeBagTube(c)      sleeping bag pulled up to the waist (for a standing character; origin ground centre)
//   makeMonitor()       desk monitor (screen 0.6 × 0.38) with a glowing game screen, faces +Z.  userData.set(t, k)
//   makeFrostPane(w, h) frost growing in from the edges of a window pane (plane, faces +Z).  userData.set(k 0..1)
//   makeSwingPoster(o)  poster hanging from a pin (pivot at the top edge).  userData.set(angle)
//   makeLampGlow()      glow sprite + small warm light core (for the dragged lamp)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, hash, canvasTexture } from '../lib/util.js';
import { std, glowSprite, textTex } from '../ep18/props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _col = new THREE.Color();
const _e = new THREE.Euler(), _q = new THREE.Quaternion();
const Mx = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(V(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), V(sx, sy, sz));
const _rg = new Map();
function rgeo(w, h, d, r) { const k = [w, h, d, r].join(','); if (!_rg.has(k)) _rg.set(k, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01))); return _rg.get(k); }
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
function shadeHex(hex, k) { _col.set(hex); return '#' + _col.multiplyScalar(k).getHexString(); }

/** vertex-coloured merge builder: many coloured parts → one mesh */
class VC {
  constructor() { this.parts = []; }
  add(geo, hex, m) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(m);
    _col.set(hex); const n = g.attributes.position.count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { c[i * 3] = _col.r; c[i * 3 + 1] = _col.g; c[i * 3 + 2] = _col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    this.parts.push(g); return this;
  }
  box(hex, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) { return this.add(UNIT, hex, Mx(x, y, z, rx, ry, rz, sx, sy, sz)); }
  rbox(hex, x, y, z, sx, sy, sz, r = 0.06, rx = 0, ry = 0, rz = 0) { return this.add(rgeo(sx, sy, sz, r), hex, Mx(x, y, z, rx, ry, rz)); }
  build(mat, { cast = true, receive = true } = {}) {
    if (!this.parts.length) return null;
    const m = new THREE.Mesh(mergeGeometries(this.parts, false), mat); m.castShadow = cast; m.receiveShadow = receive; return m;
  }
}
const VCMAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 });
function prism(len, rh, span) {
  const s = new THREE.Shape(); s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, rh); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.rotateY(PI / 2); g.translate(-len / 2, 0, 0); return g;
}

// ═════════════════════════════════════════════════════════════════════════════ house on legs
const LEG_L = 2.0, ANKLE_H = 0.5, THIGH_R = 0.56, SHIN_R = 0.46, KNEE_R = 0.62;
const STAND = ANKLE_H + 2 * LEG_L * 0.94;
const _thighG = new THREE.CylinderGeometry(THIGH_R, THIGH_R * 0.9, 1, 12).translate(0, 0.5, 0);
const _shinG = new THREE.CylinderGeometry(SHIN_R * 0.95, SHIN_R, 1, 12).translate(0, 0.5, 0);
const _kneeG = new THREE.SphereGeometry(KNEE_R, 14, 10);
const _sockG = new THREE.CylinderGeometry(SHIN_R * 1.18, SHIN_R * 1.18, 0.5, 12);
const _bootG = new RoundedBoxGeometry(1.25, 0.62, 1.7, 2, 0.2).translate(0, -ANKLE_H + 0.31, 0.3);
const _soleG = new THREE.BoxGeometry(1.32, 0.14, 1.78).translate(0, -ANKLE_H + 0.07, 0.3);
const _puffG = new THREE.SphereGeometry(1, 10, 8);
const SMOKE_M = new THREE.MeshStandardMaterial({ color: '#f0ecf6', roughness: 1, emissive: '#6a6080', emissiveIntensity: 0.25 });
const GAITS = { walk: [0, 0.5, 0.75, 0.25], tiptoe: [0, 0.5, 0.75, 0.25], gallop: [0, 0.12, 0.5, 0.62], scramble: [0, 0.41, 0.73, 0.19], stand: [0, 0, 0, 0] };

export function makeLegHouse(o = {}) {
  const {
    w = 8.6, d = 7, H = 5.8, wall = '#f2c4c4', roof = '#b5543f', trim = '#fbf6ea', door = '#ffd23f', shutters = null,
    legColor = '#f4eee2', bootColor = '#3a302c', bay = false, backDoor = false, sign = null, chimneyX = 0.28, seed = 1,
    sideWindows = true,
  } = o;
  const root = new THREE.Group(); root.name = 'legHouse';
  const body = new THREE.Group(); body.name = 'body'; root.add(body);
  const vc = new VC(), glass = new VC(), frost = new VC();
  const doorX = 0, dz = d / 2;
  const span = d, rh = span * 0.42, ov = 0.42, th = 0.2, a = Math.atan2(rh, span / 2);
  const bd = 1.5, hw = 0.78, y0 = 3.42, y1 = 4.98;           // hero bay: half width, sill / lintel heights, depth
  // ── walls
  if (bay) {
    vc.rbox(wall, 0, H / 2, -bd / 2, w, H, d - bd, 0.1);
    const zc = dz - bd / 2 + 0.05, dd = bd - 0.1;
    vc.box(wall, -(w / 2 + hw) / 2, H / 2, zc, w / 2 - hw, H, dd);
    vc.box(wall, (w / 2 + hw) / 2, H / 2, zc, w / 2 - hw, H, dd);
    vc.box(wall, 0, y0 / 2, zc, hw * 2 + 0.02, y0, dd);
    vc.box(wall, 0, (y1 + H) / 2, zc, hw * 2 + 0.02, H - y1, dd);
    // bay lining (the bedroom nook)
    const bz = dz - bd;
    vc.box('#3d5a80', 0, (y0 + y1) / 2, bz + 0.02, hw * 2, y1 - y0, 0.04);
    vc.box('#2f4766', -hw + 0.02, (y0 + y1) / 2, dz - bd / 2, 0.04, y1 - y0, bd);
    vc.box('#2f4766', hw - 0.02, (y0 + y1) / 2, dz - bd / 2, 0.04, y1 - y0, bd);
    vc.box('#b07a4a', 0, y0 + 0.02, dz - bd / 2, hw * 2, 0.04, bd);
    vc.box('#263a56', 0, y1 - 0.02, dz - bd / 2, hw * 2, 0.04, bd);
    vc.box('#ffd23f', -0.42, 4.35, bz + 0.05, 0.42, 0.56, 0.02);          // poster
    vc.box('#1d1d22', -0.42, 4.35, bz + 0.06, 0.3, 0.42, 0.02);
    vc.box('#ffffff', 0.45, 4.55, bz + 0.05, 0.36, 0.26, 0.02);
    for (const s of [-1, 1]) { vc.box('#ffd23f', s * (hw - 0.16), (y0 + y1) / 2 + 0.05, dz - 0.25, 0.22, y1 - y0 - 0.12, 0.12); }   // curtains
    // frame
    vc.box(trim, 0, y1 + 0.08, dz + 0.04, hw * 2 + 0.3, 0.16, 0.12);
    vc.box(trim, 0, y0 - 0.06, dz + 0.1, hw * 2 + 0.46, 0.1, 0.26);
    for (const s of [-1, 1]) vc.box(trim, s * (hw + 0.07), (y0 + y1) / 2, dz + 0.04, 0.14, y1 - y0 + 0.2, 0.12);
  } else vc.rbox(wall, 0, H / 2, 0, w, H, d, 0.1);
  vc.box('#8c7b6b', 0, 0.22, 0, w + 0.12, 0.44, d + 0.12);
  vc.box(trim, 0, 3.0, 0, w + 0.1, 0.16, d + 0.1);
  vc.box(trim, 0, H - 0.06, 0, w + 0.14, 0.14, d + 0.14);
  // hip joints under the body
  const HX = w / 2 - 1.25, HZ = d / 2 - 1.15;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) vc.add(_kneeG, shadeHex(legColor, 0.86), Mx(sx * HX, -0.02, sz * HZ, 0, 0, 0, 1.05, 0.7, 1.05));
  // ── roof
  vc.add(prism(w, rh, span), wall, Mx(0, H, 0));
  const sl = Math.hypot(span / 2 + ov, rh + ov * Math.tan(a));
  for (const sg of [-1, 1]) {
    const zc = sg * (span / 2 + ov) / 2, yc = H + (rh - ov * Math.tan(a)) / 2;
    const nz = sg * Math.sin(a) * th / 2, ny = Math.cos(a) * th / 2;
    vc.box(roof, 0, yc + ny, zc + nz, w + ov * 2, th, sl, sg * a);
    // frost layer on the upper 65 % of each slope
    const fz = zc + nz * 2.3 - sg * Math.cos(a) * sl * 0.17, fy = yc + ny * 2.3 + Math.sin(a) * sl * 0.17;
    frost.box('#eef6ff', 0, fy, fz, w + ov * 2 - 0.1, 0.05, sl * 0.66, sg * a);
  }
  vc.box(shadeHex(roof, 0.8), 0, H + rh + 0.05, 0, w + ov * 2 + 0.05, 0.16, 0.3);
  frost.box('#f4faff', 0, H + rh + 0.15, 0, w + ov * 2 + 0.05, 0.06, 0.34);
  const cx = chimneyX * w, cz = -span * 0.18;
  vc.box('#9a5b48', cx, H + rh * 0.75, cz, 0.6, rh * 1.3, 0.6);
  vc.box('#5d4a42', cx, H + rh * 1.42, cz, 0.72, 0.14, 0.72);
  frost.box('#f4faff', cx, H + rh * 1.42 + 0.09, cz, 0.74, 0.05, 0.74);
  const chimTop = V(cx, H + rh * 1.42 + 0.2, cz);
  // ── door + porch
  vc.box(trim, doorX, 1.14, dz + 0.03, 1.36, 2.36, 0.1);
  vc.box('#2a1d16', doorX, 1.08, dz + 0.085, 1.06, 2.14, 0.02);               // dark doorway behind the door leaf
  vc.box('#a8a196', doorX, 0.09, dz + 0.42, 1.7, 0.18, 0.78);
  vc.box(roof, doorX, 2.62, dz + 0.42, 1.9, 0.1, 0.95, -0.18);
  frost.box('#f4faff', doorX, 2.7, dz + 0.42, 1.86, 0.04, 0.9, -0.18);
  for (const sx of [-1, 1]) vc.box('#2b2b2b', doorX + sx * 0.92, 2.0, dz + 0.12, 0.2, 0.3, 0.14);
  const doorPivot = new THREE.Group(); doorPivot.position.set(doorX - 0.53, 0, dz + 0.1); body.add(doorPivot);
  const leafVC = new VC();
  leafVC.rbox(door, 0.53, 1.08, 0, 1.06, 2.14, 0.08, 0.03);
  leafVC.box('#e9e3d6', 0.53, 1.62, 0.05, 0.6, 0.5, 0.02);
  leafVC.add(_kneeG, '#ffd23f', Mx(0.89, 1.05, 0.07, 0, 0, 0, 0.14, 0.14, 0.14));
  const leaf = leafVC.build(VCMAT); doorPivot.add(leaf);
  // doorbell: brass plate + glowing button
  vc.box('#c8a040', doorX + 0.95, 1.25, dz + 0.04, 0.2, 0.3, 0.06);
  const bellM = basic('#a07a30', { toneMapped: false });
  const bellBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 16).rotateX(PI / 2), bellM); bellBtn.position.set(doorX + 0.95, 1.25, dz + 0.085); body.add(bellBtn);
  const bellGlow = glowSprite('#fff27a', 1.4, 0.9); bellGlow.position.set(doorX + 0.95, 1.25, dz + 0.2); body.add(bellGlow);
  if (sign) {
    const tex = textTex([sign], { w: 512, h: 128, bg: '#fff4e0', fg: '#2a1a0a', border: '#2a1a0a', bw: 10 });
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
    sp.position.set(doorX, 2.9, dz + 0.9); sp.rotation.x = -0.18; body.add(sp);
  }
  if (backDoor) {
    vc.box(trim, 0, 1.14, -dz - 0.03, 1.36, 2.36, 0.1);
    vc.rbox(shadeHex(door, 0.85), 0, 1.08, -dz - 0.08, 1.06, 2.14, 0.08, 0.03);
    vc.add(_kneeG, '#ffd23f', Mx(-0.36, 1.05, -dz - 0.16, 0, 0, 0, 0.13, 0.13, 0.13));
    vc.box('#a8a196', 0, 0.09, -dz - 0.42, 1.7, 0.18, 0.78);
  }
  // ── windows
  const porchGlow = new VC();
  for (const sx of [-1, 1]) porchGlow.box('#ffffff', doorX + sx * 0.92, 1.98, dz + 0.2, 0.13, 0.2, 0.05);
  const addWin = (x, y, ww, wh, face) => {   // face: 0 front, 1 back, 2 left (−x), 3 right (+x)
    const ry = [0, PI, -PI / 2, PI / 2][face];
    const out = (k) => { const c = Math.cos(ry), s = Math.sin(ry); const lz = face < 2 ? (face ? -dz : dz) : 0, lx = face >= 2 ? (face === 2 ? -w / 2 : w / 2) : 0; return [lx + x * c + k * s, lz - x * s + k * c]; };
    let p = out(0.035); vc.box(trim, p[0], y, p[1], ww + 0.2, wh + 0.2, 0.1, 0, ry);
    p = out(0.1); vc.box(trim, p[0], y - wh / 2 - 0.12, p[1], ww + 0.36, 0.08, 0.2, 0, ry);
    p = out(0.15); frost.box('#f4faff', p[0], y - wh / 2 - 0.07, p[1], ww + 0.36, 0.04, 0.2, 0, ry);
    if (shutters) for (const s of [-1, 1]) { const q = out(0.05); const c = Math.cos(ry), sn = Math.sin(ry); vc.box(shutters, q[0] + s * (ww / 2 + 0.26) * c, y, q[1] - s * (ww / 2 + 0.26) * sn, 0.34, wh + 0.1, 0.06, 0, ry); }
    p = out(0.092); glass.box('#ffffff', p[0], y, p[1], ww, wh, 0.01, 0, ry);
    p = out(0.11); vc.box(trim, p[0], y, p[1], 0.06, wh, 0.03, 0, ry); vc.box(trim, p[0], y, p[1], ww, 0.06, 0.03, 0, ry);
  };
  for (const x of [-w * 0.32, 0, w * 0.32]) if (!(bay && x === 0)) addWin(x, 4.35, 0.96, 1.2, 0);
  for (const s of [-1, 1]) addWin(doorX + s * Math.max(w * 0.3, 1.7), 1.55, 1.05, 1.3, 0);
  for (const s of [-1, 1]) { addWin(s * w * 0.26, 4.35, 0.96, 1.2, 1); if (!(backDoor && s === 0)) addWin(s * w * 0.3, 1.55, 1.05, 1.3, 1); }
  if (sideWindows) { addWin(0, 4.35, 0.96, 1.2, 2); addWin(0, 4.35, 0.96, 1.2, 3); addWin(0, 1.55, 0.96, 1.2, 2); addWin(0, 1.55, 0.96, 1.2, 3); }
  const bodyMesh = vc.build(VCMAT); body.add(bodyMesh);
  const glassM = basic('#2b3a52', { toneMapped: false });
  const glassMesh = glass.build(glassM, { cast: false, receive: false }); body.add(glassMesh);
  const frostM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: '#bcd4ff', emissiveIntensity: 0.25 });
  const frostMesh = frost.build(frostM, { cast: false }); body.add(frostMesh);
  const porchM = basic('#ffd27a', { toneMapped: false });
  const porchMesh = porchGlow.build(porchM, { cast: false, receive: false }); body.add(porchMesh);
  const halo = glowSprite('#b77aff', 13, 0.0); halo.position.set(0, 3.6, dz + 1.2); body.add(halo);
  let bayLight = null, bayGlass = null;
  if (bay) {
    bayLight = new THREE.PointLight('#ffcf8a', 0, 5, 1.6); bayLight.position.set(0, 4.75, dz - 0.6); body.add(bayLight);
    bayGlass = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, y1 - y0), new THREE.MeshStandardMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.16, roughness: 0.1, depthWrite: false }));
    bayGlass.position.set(0, (y0 + y1) / 2, dz + 0.02); body.add(bayGlass);
  }
  // ── smoke puffs (body frame)
  const NP = 7;
  const smoke = new THREE.InstancedMesh(_puffG, SMOKE_M, NP); smoke.frustumCulled = false; smoke.castShadow = false; body.add(smoke);
  // ── legs (root frame)
  const legM = std(legColor, { roughness: 0.6 }), kneeM = std(roof, { roughness: 0.6 }), sockM = std(wall, { roughness: 0.7 }), bootM = std(bootColor, { roughness: 0.7 }), soleM = std('#f2ede4');
  const legs = [];
  const hipLocal = [V(-HX, -0.05, HZ), V(HX, -0.05, HZ), V(-HX, -0.05, -HZ), V(HX, -0.05, -HZ)];
  for (let i = 0; i < 4; i++) {
    const thigh = new THREE.Mesh(_thighG, legM), shin = new THREE.Mesh(_shinG, legM), knee = new THREE.Mesh(_kneeG, kneeM), sock = new THREE.Mesh(_sockG, sockM);
    const foot = new THREE.Group(); foot.add(new THREE.Mesh(_bootG, bootM), new THREE.Mesh(_soleG, soleM));
    for (const m of [thigh, shin, knee, sock, ...foot.children]) { m.castShadow = true; m.receiveShadow = true; }
    root.add(thigh, shin, knee, sock, foot);
    legs.push({ thigh, shin, knee, sock, foot, sx: i % 2 ? 1 : -1, sz: i < 2 ? 1 : -1 });
  }
  const _h = V(), _a = V(), _d = V(), _k = V(), _p = V(), _bend = V(), _up = V(0, 1, 0), _qq = new THREE.Quaternion(), _m4 = new THREE.Matrix4(), _s = V();
  const dark = new THREE.Color('#2b3a52'), _gc = new THREE.Color();
  const bayPt = V(0, y0 - 0.95, dz - 0.6);
  const pts = {
    bay: bayPt, bell: V(doorX + 0.95, 1.25, dz + 0.1), handle: V(doorX + 0.36, 1.05, dz + 0.2), backHandle: V(-0.36, 1.05, -dz - 0.2),
    canopy: V(doorX, 2.68, dz + 0.86), ridge: V(0, H + rh + 0.13, 0), chimney: chimTop, door: V(doorX, 0.18, dz + 0.6), win: V(0, 4.2, dz + 0.1),
  };
  let lastSet = null;
  function solve(L, hip, ank, bend) {
    _d.subVectors(ank, hip); const dist = Math.max(1e-4, _d.length());
    const Ls = Math.min(LEG_L, dist / (2 * 0.9));
    const hh = Math.sqrt(Math.max(0, Ls * Ls - (dist / 2) * (dist / 2)));
    const dir = _d.clone().divideScalar(dist);
    _bend.copy(bend).addScaledVector(dir, -bend.dot(dir)); if (_bend.lengthSq() < 1e-6) _bend.set(0, 0, 1); _bend.normalize();
    _k.copy(hip).addScaledVector(_d, 0.5).addScaledVector(_bend, hh);
    _p.subVectors(_k, hip); const l1 = _p.length(); L.thigh.position.copy(hip); L.thigh.quaternion.setFromUnitVectors(_up, _p.normalize()); L.thigh.scale.set(1, Math.max(1e-3, l1), 1);
    _p.subVectors(ank, _k); const l2 = _p.length(); L.shin.position.copy(_k); L.shin.quaternion.setFromUnitVectors(_up, _p.normalize()); L.shin.scale.set(1, Math.max(1e-3, l2), 1);
    L.knee.position.copy(_k); L.knee.scale.setScalar(clamp(Ls / LEG_L, 0.5, 1));
    L.sock.position.copy(_k).lerp(ank, 0.82); L.sock.quaternion.copy(L.shin.quaternion);
  }
  root.userData = {
    body, dims: { w, d, H, rh, STAND, HX, HZ }, glassM, legs, bayGlass, bellM,
    set(t, s = {}) {
      lastSet = s;
      const rise = s.rise ?? 1, mode = s.mode || 'stand', freq = s.freq ?? 1.6;
      const stride = s.stride ?? (mode === 'gallop' ? 1.3 : mode === 'scramble' ? 0.9 : mode === 'tiptoe' ? 0.55 : 0.8);
      const lift = s.lift ?? (mode === 'gallop' ? 1.2 : mode === 'scramble' ? 0.9 : mode === 'tiptoe' ? 0.7 : 0.6);
      const ph = s.phase ?? t * freq;
      const offs = GAITS[mode] || GAITS.stand, moving = mode !== 'stand';
      const stretch = s.stretch ?? 0, crouch = s.crouch ?? 0, tip = mode === 'tiptoe' ? 0.35 : 0;
      let by = rise * STAND * (1 - 0.32 * crouch) + tip * rise;
      let pitch = s.pitch ?? 0, roll = s.roll ?? 0;
      if (moving) {
        const bobA = s.bob ?? (mode === 'gallop' ? 0.45 : mode === 'scramble' ? 0.3 : 0.18);
        by += bobA * rise * Math.abs(Math.sin(2 * PI * ph));
        pitch += (mode === 'gallop' ? 0.07 : 0.03) * Math.sin(2 * PI * ph + 0.8);
        roll += (mode === 'scramble' ? 0.07 : 0.025) * Math.sin(PI * ph * 2 + 1.7);
      }
      pitch += 0.17 * stretch; by += 0.35 * stretch * rise;
      body.position.set(0, by, 0); body.rotation.order = 'YXZ'; body.rotation.set(pitch, s.yaw ?? 0, roll);
      body.updateMatrix();
      const legsOn = s.legsOn ?? (by > 0.3);
      const spread = s.spread ?? 0;
      for (let i = 0; i < 4; i++) {
        const L = legs[i];
        for (const m of [L.thigh, L.shin, L.knee, L.sock, L.foot]) m.visible = legsOn;
        if (!legsOn) continue;
        _h.copy(hipLocal[i]).applyMatrix4(body.matrix);
        let fx = L.sx * (HX + 0.25 + spread), fz = L.sz * HZ, fy = 0, fp = 0;
        if (moving) {
          const p = 2 * PI * (ph + offs[i]);
          fz += -stride * Math.cos(p); const sw = Math.max(0, Math.sin(p)); fy = lift * sw; fp = 0.45 * sw * (mode === 'tiptoe' ? 1.6 : 1);
        }
        if (mode === 'tiptoe') fp += 0.5;
        if (L.sz > 0) fz += 1.5 * stretch; else fz -= 0.3 * stretch;
        if (s.stomp === i) { const u = s.stompU ?? 0; fy += 2.2 * Math.sin(PI * clamp(u, 0, 1)); fz += 0.6 * Math.sin(PI * clamp(u, 0, 1)); }
        _a.set(fx, fy + ANKLE_H, fz);
        solve(L, _h, _a, _bend.set(L.sx * 0.25, 0.1, 1));
        L.foot.position.copy(_a); L.foot.rotation.set(fp, 0, 0);
      }
      // door wag, windows, bell, porch, frost, smoke
      const wag = s.wag ?? 0; doorPivot.rotation.y = -wag * (0.25 + 0.75 * Math.abs(Math.sin(t * 11)));
      const gk = s.glow ?? 0; _gc.set(s.glowColor || '#ffd27a'); glassM.color.copy(dark).lerp(_gc, clamp(gk, 0, 1));
      if (s.frost) glassM.color.lerp(_gc.set('#cfe2ff'), 0.25 * s.frost);
      halo.material.color.set(s.glowColor || '#b77aff'); halo.material.opacity = 0.6 * clamp(s.halo ?? 0, 0, 1.5); halo.visible = (s.halo ?? 0) > 0.01;
      const bk = s.bell ?? 0; bellM.color.set('#a07a30').lerp(_gc.set('#fff6a0'), clamp(bk, 0, 1)); bellGlow.material.opacity = 0.95 * clamp(bk, 0, 1); bellGlow.scale.setScalar(0.6 + 1.6 * bk); bellGlow.visible = bk > 0.02;
      porchM.color.set('#ffd27a').multiplyScalar(0.25 + 0.75 * clamp(s.porch ?? 1, 0, 1));
      frostMesh.visible = (s.frost ?? 0) > 0.02;
      if (bayLight) { bayLight.intensity = 6 * (s.bayLight ?? 0); bayLight.visible = (s.bayLight ?? 0) > 0.01; }
      const sk = s.smoke ?? 0, drift = s.smokeDrift ?? 0;
      for (let i = 0; i < NP; i++) {
        const u = (hash(i * 1.7 + seed) * 0 + i / NP + t * 0.45) % 1;
        _p.copy(chimTop).add(_s.set(Math.sin(i * 2.1 + t) * 0.3 * u, 3.2 * u, -drift * u));
        const r = sk > 0 ? (0.28 + 0.75 * u) * Math.sin(PI * Math.min(1, u * 1.15 + 0.05)) * sk : 0;
        _m4.compose(_p, _qq.identity(), _s.set(1, 1, 1).multiplyScalar(Math.max(1e-4, r))); smoke.setMatrixAt(i, _m4);
      }
      smoke.instanceMatrix.needsUpdate = true; smoke.visible = sk > 0.01;
    },
    /** world position of a named body point */
    pt(name) { root.updateMatrixWorld(true); return body.localToWorld(pts[name].clone()); },
    local(name) { return pts[name].clone(); },
    foot(i) { root.updateMatrixWorld(true); return legs[i].foot.getWorldPosition(V()).add(V(0, -ANKLE_H, 0)); },
    /** world quaternion of the body */
    quat() { root.updateMatrixWorld(true); return body.getWorldQuaternion(new THREE.Quaternion()); },
  };
  root.userData.set(0, { rise: 0 });
  return root;
}

// ═════════════════════════════════════════════════════════════════════════════ baby shed / tiny garage
export function makeMini(kind = 'shed', o = {}) {
  const shed = kind === 'shed';
  const { wall = shed ? '#c98a4b' : '#ffe08a', roof = shed ? '#3f7a5a' : '#e8456f', door = shed ? '#8a5a2e' : '#ffffff', trim = '#fbf6ea', seed = 1 } = o;
  const W = shed ? 1.0 : 1.2, Hh = shed ? 0.9 : 0.8, D = shed ? 0.85 : 1.0, LEG = 0.34, R = 0.085;
  const root = new THREE.Group(); root.name = kind;
  const body = new THREE.Group(); root.add(body);
  const vc = new VC();
  vc.rbox(wall, 0, Hh / 2, 0, W, Hh, D, 0.05);
  vc.box(shadeHex(wall, 0.7), 0, 0.04, 0, W + 0.04, 0.08, D + 0.04);
  if (shed) {
    for (let i = 0; i < 6; i++) { const x = -W / 2 + (i + 0.5) * W / 6; vc.box(shadeHex(wall, 0.78), x, Hh / 2, D / 2 + 0.005, 0.02, Hh - 0.05, 0.01); }
    const rh = 0.42;
    vc.add(prism(W, rh, D), wall, Mx(0, Hh, 0));
    const a = Math.atan2(rh, D / 2), sl = Math.hypot(D / 2 + 0.1, rh + 0.1 * Math.tan(a));
    for (const sg of [-1, 1]) vc.box(roof, 0, Hh + rh / 2 + 0.03, sg * (D / 2 + 0.1) / 2, W + 0.2, 0.07, sl, sg * a);
    vc.box(shadeHex(roof, 0.8), 0, Hh + rh + 0.03, 0, W + 0.22, 0.06, 0.09);
    vc.box('#fff2b0', W / 2 + 0.005, Hh * 0.6, 0, 0.01, 0.22, 0.22);          // side window
    vc.box(trim, W / 2 + 0.01, Hh * 0.6, 0, 0.012, 0.26, 0.04);
  } else {
    vc.box(roof, 0, Hh + 0.04, 0, W + 0.12, 0.09, D + 0.12);
    vc.box(trim, 0, Hh * 0.45, D / 2 + 0.01, W * 0.82, Hh * 0.72, 0.02);
    for (let i = 0; i < 5; i++) vc.box(shadeHex(trim, 0.82), 0, Hh * 0.13 + i * Hh * 0.14, D / 2 + 0.025, W * 0.8, 0.015, 0.01);
    vc.box('#8fd0ff', -W / 2 - 0.005, Hh * 0.6, 0, 0.01, 0.2, 0.3);
    vc.box(shadeHex(roof, 0.8), 0, Hh * 0.86, D / 2 + 0.01, W * 0.86, 0.05, 0.03);
  }
  body.add(vc.build(VCMAT));
  // door (shed) on a hinge
  const doorP = new THREE.Group(); doorP.position.set(-0.17, 0, D / 2 + 0.02); body.add(doorP);
  if (shed) {
    const dv = new VC(); dv.rbox(door, 0.17, 0.33, 0, 0.34, 0.58, 0.03, 0.02); dv.add(_kneeG, '#ffd23f', Mx(0.29, 0.32, 0.03, 0, 0, 0, 0.03, 0.03, 0.03));
    dv.box('#fff2b0', 0.17, 0.5, 0.017, 0.12, 0.1, 0.005);
    doorP.add(dv.build(VCMAT));
  }
  // tiny chimney
  const chim = V(shed ? 0.28 : 0.35, shed ? Hh + 0.5 : Hh + 0.3, shed ? -0.12 : -0.2);
  { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, shed ? 0.34 : 0.3, 8), std('#5a5a62')); c.position.copy(chim).add(V(0, -0.14, 0)); c.castShadow = true; body.add(c);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 8), std('#3a3a40')); cap.position.copy(chim).add(V(0, 0.03, 0)); body.add(cap); }
  const NP = 4, puffM = SMOKE_M;
  const smoke = new THREE.InstancedMesh(_puffG, puffM, NP); smoke.frustumCulled = false; body.add(smoke);
  // stubby legs: pivot at the body bottom corners
  const legs = [];
  const legM = std(o.legColor || '#f4eee2', { roughness: 0.6 }), bootM = std(o.bootColor || '#3a302c', { roughness: 0.7 });
  const lg = new THREE.CylinderGeometry(R, R * 0.9, LEG, 10).translate(0, -LEG / 2, 0);
  const bg = new RoundedBoxGeometry(0.17, 0.1, 0.24, 2, 0.04).translate(0, -LEG - 0.02, 0.04);
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Group(); p.position.set((i % 2 ? 1 : -1) * (W / 2 - 0.16), 0.02, (i < 2 ? 1 : -1) * (D / 2 - 0.14)); root.add(p);
    const l = new THREE.Mesh(lg, legM), b = new THREE.Mesh(bg, bootM); l.castShadow = b.castShadow = true; p.add(l, b);
    legs.push(p);
  }
  const _m = new THREE.Matrix4(), _p = V(), _s = V(), _qq = new THREE.Quaternion();
  root.userData = {
    body, parts: { legs, door: doorP }, dims: { W, Hh, D, LEG },
    set(t, s = {}) {
      const run = s.run ?? 0, f = s.freq ?? 3.2, ph = t * f * 2 * PI, hop = s.hop ?? 0, wob = s.wobble ?? 0.5;
      const bounce = Math.abs(Math.sin(ph)) * (0.06 * run + 0.35 * hop);
      const sq = 1 - 0.12 * (s.squash ?? 0);
      root.children.forEach(() => {});
      body.position.set(0, LEG + 0.04 + bounce, 0);
      body.rotation.order = 'YXZ';
      body.rotation.set((s.lean ?? 0) + 0.08 * run * Math.sin(ph * 2), (s.yawWiggle ?? 0) * Math.sin(t * 5), wob * 0.09 * Math.sin(t * 7.3 + seed) + 0.05 * run * Math.sin(ph));
      body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      legs.forEach((p, i) => {
        const o2 = [0, 0.5, 0.5, 0][i] * PI * 2;
        p.position.y = 0.02 + bounce;
        p.rotation.set(0.75 * run * Math.sin(ph + o2) + wob * 0.12 * Math.sin(t * 9 + i * 1.7), 0, wob * 0.1 * Math.sin(t * 6.1 + i));
      });
      doorP.rotation.y = -(s.wag ?? 0) * (0.3 + 0.7 * Math.abs(Math.sin(t * 12)));
      const sk = s.smoke ?? 0;
      for (let i = 0; i < NP; i++) {
        const u = (i / NP + t * 0.7) % 1;
        _p.copy(chim).add(_s.set(0.05 * Math.sin(i * 2 + t * 3), 0.1 + 0.6 * u, -0.05 * u));
        const r = sk > 0 ? (0.04 + 0.11 * u) * Math.sin(PI * Math.min(1, u * 1.1 + 0.05)) * sk : 0;
        _m.compose(_p, _qq, _s.setScalar(Math.max(1e-4, r))); smoke.setMatrixAt(i, _m);
      }
      smoke.instanceMatrix.needsUpdate = true; smoke.visible = sk > 0.01;
    },
    pt(name) {
      root.updateMatrixWorld(true);
      if (name === 'door') return body.localToWorld(V(0, 0.33, D / 2 + 0.05));
      if (name === 'chimney') return body.localToWorld(chim.clone());
      if (name === 'collar') return body.localToWorld(V(0, Hh * 0.55, D / 2 + 0.03));
      if (name === 'leg0') return legs[0].localToWorld(V(0, -LEG / 2, 0));
      return body.localToWorld(V());
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════════════════════════════════════ chain + padlock
export function makeChain(n = 24, { r = 0.2, thick = 0.07, color = '#b9bec8' } = {}) {
  const g = new THREE.Group(); g.name = 'chain';
  const geo = new THREE.TorusGeometry(r, thick, 6, 12).scale(1, 1.45, 1);
  const im = new THREE.InstancedMesh(geo, std(color, { roughness: 0.32, metalness: 0.65 }), n); im.castShadow = true; im.frustumCulled = false; g.add(im);
  const a = V(), b = V(), d = V(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), s = V(1, 1, 1), Y = V(0, 1, 0);
  g.userData = {
    set(A, B, sag = 0.5) {
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, du = 0.5 / n;
        a.copy(A).lerp(B, u - du); a.y -= sag * 4 * (u - du) * (1 - u + du);
        b.copy(A).lerp(B, u + du); b.y -= sag * 4 * (u + du) * (1 - u - du);
        d.subVectors(b, a).normalize();
        q.setFromUnitVectors(Y, d); q2.setFromAxisAngle(Y, i % 2 ? PI / 2 : 0); q.multiply(q2);
        m.compose(a.lerp(b, 0.5), q, s); im.setMatrixAt(i, m);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}
export function makePadlock() {
  const g = new THREE.Group(); g.name = 'padlock';
  const gold = std('#ffc634', { roughness: 0.3, metalness: 0.5, emissive: '#5a3a00', emissiveIntensity: 0.3 });
  const bodyM = new THREE.Mesh(rgeo(0.62, 0.52, 0.26, 0.08), gold); bodyM.castShadow = true; g.add(bodyM);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10).rotateX(PI / 2), basic('#1d1410')); hole.position.set(0, 0.04, 0.135); g.add(hole);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.02), basic('#1d1410')); slot.position.set(0, -0.04, 0.135); g.add(slot);
  const sh = new THREE.Group(); g.add(sh);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.055, 8, 18, PI), std('#c8ccd4', { roughness: 0.3, metalness: 0.7 })); arc.position.y = 0.3; sh.add(arc);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.2, 8), arc.material); p.position.set(sx * 0.2, 0.22, 0); sh.add(p); }
  g.userData = { set(k) { sh.position.y = 0.2 * (1 - clamp(k, 0, 1)); sh.rotation.y = 0.9 * (1 - clamp(k, 0, 1)); } };
  g.userData.set(1);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ alarm clock
export function makeAlarmClock() {
  const g = new THREE.Group(); g.name = 'alarmClock';
  const inner = new THREE.Group(); g.add(inner);
  const red = std('#e8232b', { roughness: 0.35, metalness: 0.2 });
  const caseM = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.09, 28).rotateX(PI / 2), red); caseM.castShadow = true; inner.add(caseM);
  const tex = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 4, 0, PI * 2); c.fill();
    c.fillStyle = '#1d1d22'; c.font = '900 44px "ITT Nunito", "Nunito", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const [n, ang] of [[12, 0], [3, PI / 2], [6, PI], [9, PI * 1.5]]) c.fillText(String(n), w / 2 + Math.sin(ang) * 88, h / 2 - Math.cos(ang) * 88);
    c.lineCap = 'round'; c.strokeStyle = '#1d1d22';
    c.lineWidth = 14; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2, h / 2 + 62); c.stroke();       // hour → 6
    c.lineWidth = 9; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2, h / 2 - 92); c.stroke();        // minute → 12
    c.fillStyle = '#e8232b'; c.beginPath(); c.arc(w / 2, h / 2, 12, 0, PI * 2); c.fill();
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.128, 28), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35 }));
  face.position.z = 0.047; inner.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.016, 6, 28), std('#d8dde4', { metalness: 0.6, roughness: 0.3 })); rim.position.z = 0.048; inner.add(rim);
  const bells = [];
  for (const sx of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 8, 0, PI * 2, 0, PI / 2), std('#ffc634', { metalness: 0.6, roughness: 0.3 }));
    b.position.set(sx * 0.1, 0.15, 0); b.rotation.z = -sx * 0.5; inner.add(b); bells.push(b);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.06, 6), red); leg.position.set(sx * 0.09, -0.16, 0); leg.rotation.z = sx * 0.4; inner.add(leg);
  }
  const ham = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.02), std('#d8dde4')); ham.position.set(0, 0.2, 0); inner.add(ham);
  g.userData = {
    set(t, ring = 0) {
      const k = clamp(ring, 0, 1);
      inner.rotation.z = k * 0.09 * Math.sin(t * 60); inner.position.x = k * 0.008 * Math.sin(t * 47);
      ham.rotation.z = k * 0.8 * Math.sin(t * 70);
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ sleeping bags
export function makeSleepingBag(color = '#3f6fd8', lining = '#ffd23f') {
  const vc = new VC();
  vc.rbox(color, 0, 0.17, 0, 0.82, 0.32, 2.0, 0.15);
  vc.rbox(shadeHex(color, 0.82), 0, 0.3, 0.55, 0.78, 0.1, 0.8, 0.05);
  vc.rbox(lining, 0, 0.21, -0.78, 0.7, 0.2, 0.42, 0.08);
  vc.rbox('#ffffff', 0, 0.3, -0.86, 0.56, 0.14, 0.3, 0.07);
  for (let i = 0; i < 4; i++) vc.box(shadeHex(color, 0.7), 0, 0.33, -0.4 + i * 0.4, 0.84, 0.02, 0.04);
  const m = vc.build(VCMAT); m.name = 'sleepingBag'; return m;
}
export function makeBagTube(color = '#3f6fd8') {
  const vc = new VC();
  vc.rbox(color, 0, 0.55, 0, 0.78, 1.1, 0.5, 0.18);
  vc.rbox(shadeHex(color, 0.8), 0, 1.08, 0, 0.82, 0.12, 0.54, 0.05);
  for (let i = 0; i < 3; i++) vc.box(shadeHex(color, 0.72), 0, 0.25 + i * 0.3, 0.255, 0.7, 0.03, 0.02);
  const m = vc.build(VCMAT); m.name = 'bagTube'; return m;
}

// ═════════════════════════════════════════════════════════════════════════════ monitor
export function makeMonitor() {
  const g = new THREE.Group(); g.name = 'monitor';
  const dk = std('#1d1d22', { roughness: 0.5 });
  const frame = new THREE.Mesh(rgeo(0.66, 0.44, 0.05, 0.02), dk); frame.position.y = 0.4; frame.castShadow = true; g.add(frame);
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.04), dk); st.position.set(0, 0.12, -0.02); g.add(st);
  const ft = new THREE.Mesh(rgeo(0.26, 0.02, 0.16, 0.008), dk); ft.position.y = 0.01; g.add(ft);
  const tex = canvasTexture(320, 200, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a2a8a'); gr.addColorStop(1, '#0e6a8a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#5bd65b'; c.fillRect(0, h * 0.78, w, h * 0.22);
    for (let i = 0; i < 6; i++) { c.fillStyle = ['#ffd23f', '#ff4fa3', '#3ee0c8'][i % 3]; c.fillRect(20 + i * 48, h * 0.78 - 18 - (i % 3) * 12, 26, 18 + (i % 3) * 12); }
    c.fillStyle = '#ffffff'; c.fillRect(140, h * 0.78 - 46, 18, 28); c.fillStyle = '#f1c7a1'; c.fillRect(140, h * 0.78 - 60, 18, 14);
    c.fillStyle = '#ffffff'; c.font = '900 22px "ITT Nunito", sans-serif'; c.fillText('PAUSED', 18, 30);
  });
  const scrM = basic('#ffffff', { map: tex, toneMapped: false });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38), scrM); scr.position.set(0, 0.4, 0.027); g.add(scr);
  const glow = glowSprite('#7ab8ff', 1.6, 0.5); glow.position.set(0, 0.4, 0.2); g.add(glow);
  g.userData = { set(t, k = 1) { scrM.color.setScalar(0.55 + 0.45 * k * (0.92 + 0.08 * Math.sin(t * 9))); glow.material.opacity = 0.5 * k; } };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ frost pane
export function makeFrostPane(w = 1.3, h = 1.3) {
  const tex = canvasTexture(256, 256, (c, W, Hh) => {
    const img = c.createImageData(W, Hh);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const e = Math.min(x, y, W - 1 - x, Hh - 1 - y) / (W / 2);                  // 0 edge … 1 centre
      const n = 0.5 * hash(Math.floor(x / 3) * 7.1 + Math.floor(y / 3) * 13.3) + 0.5 * Math.abs(Math.sin(x * 0.21 + y * 0.13) * Math.cos(x * 0.07 - y * 0.29));
      const v = clamp(1 - e * 1.25 + (n - 0.5) * 0.55, 0, 1);
      const i = (y * W + x) * 4; img.data[i] = 235; img.data[i + 1] = 245; img.data[i + 2] = 255; img.data[i + 3] = Math.round(255 * v);
    }
    c.putImageData(img, 0, 0);
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2;
    for (let k = 0; k < 40; k++) { const a = hash(k * 3.3) * PI * 2, x0 = hash(k * 1.1) < 0.5 ? 0 : W, y0 = hash(k * 2.2) * Hh; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * 40 * (x0 ? -1 : 1), y0 + Math.sin(a) * 40); c.stroke(); }
  });
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, depthWrite: false, color: '#e8f2ff' });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.name = 'frostPane';
  mesh.userData.set = (k) => { m.alphaTest = clamp(1 - 0.92 * k, 0.04, 0.999); mesh.visible = k > 0.01; };
  mesh.userData.set(0);
  return mesh;
}

// ═════════════════════════════════════════════════════════════════════════════ swinging poster
export function makeSwingPoster({ w = 0.6, h = 0.8, bg = '#ff4fa3', fg = '#ffffff', lines = ['GG'] } = {}) {
  const g = new THREE.Group();
  const tex = textTex(lines, { w: 256, h: Math.round(256 * h / w), bg, fg, border: '#ffffff', bw: 14 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }));
  p.position.y = -h / 2; g.add(p);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), std('#e8232b')); pin.position.z = 0.01; g.add(pin);
  g.userData = { set(a) { g.rotation.z = a; } };
  return g;
}
