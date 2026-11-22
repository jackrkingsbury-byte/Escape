// Episode 12 ("Staff Only") props + the control-room set. Same conventions as src/props.js (SPEC.md §2/§7):
// ES module, metres, Y up, deterministic (no Math.random / clocks), animated things are pure functions of t / u.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   makeSkyPanel({ w=70, h=34 })  → Group   the giant painted sky wall: flat panel (origin = bottom centre, painted
//        side faces +Z, surface at z=0) with 3D box clouds, an orange disc sun, a crooked painted bird, panel seams +
//        a plywood baseboard.  userData: { sun, bird, clouds:[Group], looseCloud (pivot Group, rotation.z tilts it),
//        paintMat (tint with .color), wobble(t, t0) (damped wobble after a bonk at t0), sunPos, birdPos }
//   makeSkyRing({ r=72, h=30 })   → Group   the same painting on the inside of a huge open cylinder around the town
//        (+ plywood back and a white top trim).  userData.paintMat.
//   makeGlowCrack({ h=2.6, seed })→ Group   glowing white jagged sliver (XY plane, facing +Z, origin = bottom centre).
//        userData.set(open 0..1, glow 0..1)
//   makeStaffDoor()               → Group   tiny sky-blue door (0.9 × 1.45) in a glowing white frame with a STAFF ONLY
//        plate; origin bottom centre, faces +Z.  userData.open(k) swings it out (hinge on −X); userData.light = the white
//        light behind it.
//   makeRainCloud()               → Group   dark-grey sphere cloud with falling blue drops.  userData.set(t, fall=0.9)
//   makeMug(), makeBaseball() (userData.textFace: rotate so the text faces you), makePigeonShades(), makePigeonPhones()
//   makeSpinnyChair()             → Group   userData.swivel (rotation.y spins the seat), userData.seatY
//   makeFloatHouse({ wall, roof, sign })  → Group   chunky house on a ripped-up lump of ground (origin = ground level,
//        front +Z).  The lump hangs below y = 0.
//   makePigtails(hairColor)       → Group   two bunches for a human head (parent to joints.head)
//   buildControlRoom()            → Set     the control room behind the sky (see the comment above it)
//   staticNoise(g, W, H, t)       draws deterministic TV static on a 2D canvas context
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, hash, canvasTexture, rng } from '../lib/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const FONTW = (s) => `900 ${s}px "ITT World Text", "Nunito", "DejaVu Sans", Arial, sans-serif`;
const FONTD = (s) => `${s}px "ITT World Display", "Luckiest Guy", Impact, "DejaVu Sans", sans-serif`;
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const o = new THREE.Mesh(g, typeof m === 'string' ? std(m) : m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function cyl(rt, rb, h, m, seg = 24) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
/** Fit a font size so `text` is at most maxW wide. */
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
export function textTex(lines, { w = 512, h = 128, bg = '#ffffff', fg = '#1d1d22', border = null, bw = 10, display = false, pad = 0.86, glow = null } = {}) {
  return canvasTexture(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    if (border) { g.strokeStyle = border; g.lineWidth = bw; g.strokeRect(bw / 2, bw / 2, w - bw, h - bw); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length, F = display ? FONTD : FONTW;
    lines.forEach((l, i) => {
      const t = typeof l === 'string' ? l : l.t, rel = typeof l === 'string' ? 1 : (l.s ?? 1);
      const s = fit(g, t, F, w * pad, Math.floor(h / n * 0.78 * rel));
      g.font = F(s);
      if (glow) { g.shadowColor = glow; g.shadowBlur = s * 0.35; }
      g.fillStyle = typeof l === 'string' ? fg : (l.c ?? fg);
      g.fillText(t, w / 2, h * (i + 0.5) / n + s * 0.04);
      g.shadowBlur = 0;
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════ the painted sky
const SKY_TOP = '#2f7fe0', SKY_MID = '#7cc0f4', SKY_LOW = '#ffc58a', SKY_HOR = '#ff9a6b';
function paintSky(g, w, h, { clouds = false, sun = false, seams = 6 } = {}) {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, SKY_TOP); gr.addColorStop(0.55, SKY_MID); gr.addColorStop(0.95, '#a8daf8'); gr.addColorStop(0.99, SKY_LOW); gr.addColorStop(1, SKY_HOR);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // brush strokes (it's paint)
  const R = rng(7);
  for (let i = 0; i < 140; i++) {
    const y = R() * h, x = R() * w, l = 40 + R() * 160;
    g.strokeStyle = `rgba(255,255,255,${0.04 + R() * 0.05})`; g.lineWidth = 3 + R() * 8;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y + (R() - 0.5) * 12, x + l, y + (R() - 0.5) * 8); g.stroke();
  }
  if (sun) { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(w * 0.62, h * 0.66, h * 0.12, 0, PI * 2); g.fill(); g.fillStyle = '#ff9a1a'; g.beginPath(); g.arc(w * 0.62, h * 0.66, h * 0.1, 0, PI * 2); g.fill(); }
  if (clouds) {
    const cl = (x, y, s) => { g.fillStyle = '#ffffff'; for (const [dx, dy, cw, ch] of [[0, 0, 1.6, 0.42], [0.25, -0.32, 0.8, 0.4], [-0.35, -0.18, 0.6, 0.3]]) { const X = x + dx * s, Y = y + dy * s; g.beginPath(); g.roundRect(X - cw * s / 2, Y - ch * s / 2, cw * s, ch * s, ch * s * 0.4); g.fill(); } g.fillStyle = 'rgba(160,190,230,0.55)'; g.fillRect(x - 0.8 * s, y + 0.17 * s, 1.6 * s, 0.05 * s); };
    cl(w * 0.18, h * 0.3, h * 0.2); cl(w * 0.45, h * 0.18, h * 0.14); cl(w * 0.82, h * 0.34, h * 0.18);
  }
  if (seams) { g.strokeStyle = 'rgba(40,70,120,0.22)'; g.lineWidth = 3; for (let i = 1; i < seams; i++) { const x = w * i / seams; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.fillStyle = 'rgba(40,60,100,0.3)'; for (let i = 1; i < seams; i++) for (let k = 1; k < 8; k++) { g.beginPath(); g.arc(w * i / seams + 8, h * k / 8, 3, 0, PI * 2); g.fill(); } }
}
let _skyTex = null;
const skyTex = () => _skyTex ??= canvasTexture(2048, 1024, (g, w, h) => paintSky(g, w, h, { seams: 10 }));
const WHITE_CLOUD = () => std('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.45, roughness: 0.9 });
function boxCloud(s = 1) {
  const g = new THREE.Group(), m = WHITE_CLOUD(), sh = std('#bcd6f2', { emissive: '#9ec2ea', emissiveIntensity: 0.3 });
  for (const [x, y, w, h] of [[0, 0, 5.2, 1.4], [0.9, 1.0, 2.8, 1.5], [-1.2, 0.6, 2.2, 1.1], [2.0, 0.4, 1.6, 0.9]]) g.add(box(w * s, h * s, 0.35, m, x * s, y * s, 0.2, 0.25 * s));
  g.add(box(5.0 * s, 0.25 * s, 0.3, sh, 0, -0.7 * s, 0.12, 0.08));
  return g;
}
function paintedBird() {
  const tex = canvasTexture(512, 384, (g, w, h) => {
    g.lineJoin = 'round'; g.lineCap = 'round';
    const ol = (f) => { g.lineWidth = 14; g.strokeStyle = '#1d1d22'; g.stroke(); g.fillStyle = f; g.fill(); };
    // back wing (up, mid-flap)
    g.beginPath(); g.moveTo(200, 200); g.quadraticCurveTo(150, 40, 60, 30); g.quadraticCurveTo(170, 120, 260, 200); g.closePath(); ol('#2f6bd8');
    // tail
    g.beginPath(); g.moveTo(130, 230); g.lineTo(40, 200); g.lineTo(60, 260); g.lineTo(40, 300); g.lineTo(140, 270); g.closePath(); ol('#2f6bd8');
    // body
    g.beginPath(); g.ellipse(250, 245, 130, 78, -0.1, 0, Math.PI * 2); ol('#4f9bff');
    g.beginPath(); g.ellipse(270, 275, 80, 40, -0.1, 0, Math.PI * 2); g.fillStyle = '#cfe6ff'; g.fill();
    // head
    g.beginPath(); g.arc(380, 190, 62, 0, Math.PI * 2); ol('#4f9bff');
    // beak
    g.beginPath(); g.moveTo(432, 180); g.lineTo(500, 200); g.lineTo(432, 214); g.closePath(); ol('#ff9a1a');
    // lazy half-closed eye
    g.beginPath(); g.arc(392, 182, 20, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6; g.stroke();
    g.fillStyle = '#4f9bff'; g.fillRect(368, 158, 50, 24); g.lineWidth = 9; g.beginPath(); g.moveTo(368, 182); g.lineTo(416, 182); g.stroke();
    g.fillStyle = '#1d1d22'; g.beginPath(); g.arc(396, 190, 8, 0, Math.PI * 2); g.fill();
    // front wing (up, mid-flap)
    g.beginPath(); g.moveTo(230, 215); g.quadraticCurveTo(230, 30, 330, 6); g.quadraticCurveTo(290, 120, 300, 215); g.closePath(); ol('#3a82f0');
    // zzz
    g.fillStyle = '#ffffff'; g.strokeStyle = '#1d1d22'; g.lineWidth = 8; g.font = FONTD(60); g.strokeText('z', 450, 110); g.fillText('z', 450, 110); g.font = FONTD(42); g.strokeText('z', 490, 60); g.fillText('z', 490, 60);
  });
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05, fog: false }));
  m.position.z = 0.06; g.add(m);
  g.add(box(0.12, 0.12, 0.12, '#8a8f99', 0.15, 0.2, 0.02));   // the nail it hangs on
  return g;
}
export function makeSkyPanel({ w = 70, h = 34 } = {}) {
  const g = new THREE.Group();
  const paintMat = new THREE.MeshBasicMaterial({ map: skyTex(), fog: false });
  const back = std('#a8845a');
  const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), [back, back, back, back, paintMat, back]);
  panel.position.set(0, h / 2, -0.2); g.add(panel);
  g.add(box(w, 0.6, 0.5, '#9a7448', 0, 0.3, 0.05));   // plywood baseboard
  const clouds = [];
  for (const [x, y, s] of [[-10, 20, 1.3], [6.5, 22.5, 1.0], [-1.5, 15.5, 0.9], [14, 13, 1.2], [-18, 11, 1.0]]) { const c = boxCloud(s); c.position.set(x, y, 0); g.add(c); clouds.push(c); }
  // the cloud that comes loose (pivot at its left pin)
  const looseCloud = new THREE.Group(); looseCloud.position.set(-3.8, 6.5, 0.02); g.add(looseCloud);
  const lc = boxCloud(0.75); lc.position.set(2.0, 0, 0); looseCloud.add(lc);
  const pin = box(0.18, 0.18, 0.3, '#8a8f99', 0, 0.1, 0.35); looseCloud.add(pin);
  const sunPos = V(4.2, 7.2, 0);
  const sun = new THREE.Group(); sun.position.copy(sunPos); g.add(sun);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.25, 48), basic('#ff9a1a', { fog: false })); disc.rotation.x = PI / 2; disc.position.z = 0.15; sun.add(disc);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.45, 0.2, 48), basic('#ffd23f', { fog: false })); rim.rotation.x = PI / 2; rim.position.z = 0.08; sun.add(rim);
  const birdPos = V(-4.5, 11.0, 0.05);
  const bird = paintedBird(); bird.position.copy(birdPos); bird.rotation.z = 0.32; bird.scale.setScalar(1.0); g.add(bird);
  g.userData = {
    paintMat, sun, bird, clouds, looseCloud, sunPos, birdPos, w, h,
    tint(c) { paintMat.color.set(c); },
    /** wobble after a bonk at t0 (pure). */
    wobble(t, t0) {
      const d = t - t0;
      const a = d > 0 ? Math.exp(-d * 3.2) * Math.sin(d * 26) : 0;
      g.rotation.x = 0.012 * a; g.position.y = g.userData.baseY ?? g.position.y;
      g.rotation.z = 0.004 * a;
    },
  };
  return g;
}
export function makeSkyRing({ r = 72, h = 30 } = {}) {
  const g = new THREE.Group();
  const tex = canvasTexture(2048, 512, (c, w, hh) => paintSky(c, w, hh, { clouds: true, sun: true, seams: 8 }));
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(5, 1);
  const paintMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false });
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 160, 1, true), paintMat); inner.position.y = h / 2; g.add(inner);
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.6, r + 0.6, h, 160, 1, true), std('#a8845a', { side: THREE.FrontSide })); outer.position.y = h / 2; g.add(outer);
  const trim = new THREE.Mesh(new THREE.RingGeometry(r - 0.2, r + 0.8, 160, 1), std('#f4efe2', { side: THREE.DoubleSide })); trim.rotation.x = -PI / 2; trim.position.y = h + 0.01; g.add(trim);
  g.userData = { paintMat, r, h };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ crack + door
let _glowTex = null;
const glowTex = () => _glowTex ??= canvasTexture(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.35, 'rgba(255,240,180,0.55)'); gr.addColorStop(1, 'rgba(255,230,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
export function makeGlowCrack({ h = 2.6, seed = 3 } = {}) {
  const g = new THREE.Group();
  const n = 14, R = rng(seed), L = [], Rr = [];
  for (let i = 0; i <= n; i++) {
    const y = h * i / n, x = (i % 2 ? 1 : -1) * (0.05 + R() * 0.1) + (R() - 0.5) * 0.06;
    const wdt = (0.02 + 0.07 * Math.sin(PI * i / n)) * (0.7 + R() * 0.6);
    L.push([x - wdt, y]); Rr.push([x + wdt, y]);
  }
  const sh = new THREE.Shape(); sh.moveTo(L[0][0], L[0][1]);
  for (const p of L) sh.lineTo(p[0], p[1]);
  for (const p of Rr.slice().reverse()) sh.lineTo(p[0], p[1]);
  const core = new THREE.Mesh(new THREE.ShapeGeometry(sh), basic('#ffffff', { toneMapped: false, fog: false, side: THREE.DoubleSide }));
  core.position.z = 0.03; g.add(core);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, h * 1.4), basic('#ffffff', { map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  glow.position.set(0, h / 2, 0.05); glow.renderOrder = 3; g.add(glow);
  g.userData = { core, glow, set(open = 0.3, k = 1) { core.scale.set(0.6 + 3.2 * open, 1, 1); glow.scale.set(0.6 + 1.6 * open, 1, 1); glow.material.opacity = k; core.visible = k > 0.01; glow.visible = k > 0.01; } };
  g.userData.set(0.3, 1);
  return g;
}
export function makeStaffDoor() {
  const g = new THREE.Group(), W = 0.9, H = 1.45;
  const white = basic('#ffffff', { toneMapped: false, fog: false });
  // the white light behind the door (seen when it opens)
  const light = new THREE.Mesh(new THREE.PlaneGeometry(W, H), white); light.position.set(0, H / 2, 0.02); g.add(light);
  for (const [x, y, w, h] of [[0, H + 0.05, W + 0.2, 0.1], [-W / 2 - 0.05, H / 2, 0.1, H + 0.1], [W / 2 + 0.05, H / 2, 0.1, H + 0.1]]) g.add(box(w, h, 0.08, white, x, y, 0.04));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(W + 1.6, H + 1.2), basic('#ffffff', { map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.85 }));
  glow.position.set(0, H / 2, 0.01); glow.renderOrder = 3; g.add(glow);
  const hinge = new THREE.Group(); hinge.position.set(-W / 2, 0, 0.06); g.add(hinge);
  const slab = box(W, H, 0.06, std('#4f9be6', { roughness: 0.6 }), W / 2, H / 2, 0); hinge.add(slab);
  const inset = box(W * 0.74, H * 0.36, 0.02, std('#79b8f0'), W / 2, H * 0.28, 0.035); hinge.add(inset);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), std('#ffd23f', { metalness: 0.4, roughness: 0.3 })); knob.position.set(W * 0.86, H * 0.47, 0.06); hinge.add(knob);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.3), new THREE.MeshStandardMaterial({ map: textTex(['STAFF', 'ONLY'], { w: 512, h: 220, bg: '#fbf6ec', fg: '#d81f26', border: '#1d1d22', bw: 14 }), roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.04 }));
  plate.position.set(W / 2, H * 0.72, 0.034); hinge.add(plate);
  g.userData = { hinge, light, glow, plate, open(k) { hinge.rotation.y = -1.9 * clamp(k, 0, 1); } };
  return g;
}

// ════════════════════════════════════════════════════════════════════════════ small props
export function makeRainCloud() {
  const g = new THREE.Group(), m = std('#5d6270', { roughness: 0.95 }), m2 = std('#4a4f5c', { roughness: 0.95 });
  for (const [x, y, z, r] of [[0, 0, 0, 0.26], [0.24, -0.04, 0.05, 0.2], [-0.26, -0.03, -0.02, 0.21], [0.08, 0.12, -0.06, 0.2], [-0.1, -0.06, 0.16, 0.18], [0.12, -0.05, -0.18, 0.17]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), r > 0.2 ? m : m2); s.position.set(x, y, z); s.scale.y = 0.8; g.add(s);
  }
  const N = 26, drop = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.13, 6), std('#3d9cff', { emissive: '#1d6cff', emissiveIntensity: 0.4 }), N);
  drop.frustumCulled = false; g.add(drop);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s1 = V(1, 1, 1), p = V();
  const seeds = Array.from({ length: N }, (_, i) => [(hash(i * 1.3) - 0.5) * 0.5, (hash(i * 2.7) - 0.5) * 0.4, hash(i * 4.1)]);
  g.userData = {
    set(t, fall = 0.9) {
      seeds.forEach(([x, z, ph], i) => { const u = (t * 1.6 + ph) % 1; p.set(x, -0.12 - u * fall, z); m4.compose(p, q, s1); drop.setMatrixAt(i, m4); });
      drop.instanceMatrix.needsUpdate = true;
    },
  };
  g.userData.set(0);
  return g;
}
export function makeMug() {
  const g = new THREE.Group();
  const c = cyl(0.055, 0.05, 0.12, '#f4efe2'); c.position.y = 0.06; g.add(c);
  const tea = cyl(0.048, 0.048, 0.01, '#8a5a2b'); tea.position.y = 0.112; g.add(tea);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 8, 16), std('#f4efe2')); h.position.set(0.07, 0.06, 0); g.add(h);
  const band = cyl(0.056, 0.056, 0.025, '#ff4fa3'); band.position.y = 0.07; g.add(band);
  return g;
}
export function makeBaseball() {
  const tex = canvasTexture(1024, 512, (g, w, h) => {
    g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d81f26'; g.lineWidth = 8; g.setLineDash([14, 10]);
    for (const off of [0.08, 0.92]) { g.beginPath(); for (let i = 0; i <= 64; i++) { const x = w * (off + 0.06 * Math.sin(i / 64 * PI * 2)), y = h * i / 64; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
    g.setLineDash([]);
    g.fillStyle = '#1a2a6c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `italic 900 96px "ITT World Text", "Nunito", sans-serif`; g.fillText('Nice arm.', w / 2, h * 0.38);
    g.font = `italic 900 70px "ITT World Text", "Nunito", sans-serif`; g.fillText('♥ Management', w / 2, h * 0.6);
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 20), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  m.castShadow = true;
  const g = new THREE.Group(); g.add(m);
  g.userData = { ball: m };
  return g;
}
export function makePigeonShades() {
  const g = new THREE.Group(), blk = std('#0d0d12', { roughness: 0.25, metalness: 0.3 }), shine = basic('#7a86a8');
  for (const s of [-1, 1]) { g.add(box(0.062, 0.042, 0.014, blk, s * 0.036, 0, 0, 0.008)); const sh = box(0.018, 0.008, 0.002, shine, s * 0.036 - 0.012, 0.01, 0.008); sh.rotation.z = 0.5; g.add(sh); }
  g.add(box(0.03, 0.01, 0.01, blk, 0, 0.012, 0));
  for (const s of [-1, 1]) g.add(box(0.008, 0.01, 0.09, blk, s * 0.072, 0.008, -0.045));
  return g;
}
export function makePigeonPhones() {
  const g = new THREE.Group(), blk = std('#1d1d22', { roughness: 0.4 }), red = std('#e8232b', { roughness: 0.4 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.013, 8, 24, PI), blk); band.rotation.y = PI / 2; band.rotation.order = 'YXZ'; g.add(band);
  for (const s of [-1, 1]) {
    const cup = cyl(0.042, 0.042, 0.035, red, 20); cup.rotation.z = PI / 2; cup.position.set(s * 0.088, -0.012, 0); g.add(cup);
    const pad = cyl(0.034, 0.034, 0.012, blk, 16); pad.rotation.z = PI / 2; pad.position.set(s * 0.068, -0.012, 0); g.add(pad);
  }
  return g;
}
export function makeSpinnyChair() {
  const g = new THREE.Group(), leather = std('#8a1f2b', { roughness: 0.45 }), blk = std('#1a1a20', { roughness: 0.5, metalness: 0.3 }), chrome = std('#c9ccd2', { metalness: 0.7, roughness: 0.25 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; const leg = box(0.42, 0.06, 0.08, blk, Math.cos(a) * 0.21, 0.09, Math.sin(a) * 0.21); leg.rotation.y = -a; g.add(leg); const w = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), blk); w.position.set(Math.cos(a) * 0.42, 0.045, Math.sin(a) * 0.42); g.add(w); }
  const swivel = new THREE.Group(); g.add(swivel);
  const pole = cyl(0.045, 0.045, 0.4, chrome); pole.position.y = 0.3; swivel.add(pole);
  swivel.add(box(0.72, 0.16, 0.7, leather, 0, 0.56, 0, 0.06));
  swivel.add(box(0.74, 1.05, 0.16, leather, 0, 1.15, -0.34, 0.07));
  swivel.add(box(0.5, 0.18, 0.12, leather, 0, 1.78, -0.36, 0.06));   // headrest
  for (const s of [-1, 1]) { swivel.add(box(0.07, 0.24, 0.07, blk, s * 0.38, 0.72, 0)); swivel.add(box(0.1, 0.06, 0.46, blk, s * 0.38, 0.86, 0.02, 0.02)); }
  g.userData = { swivel, seatY: 0.64 };
  return g;
}
export function makeFloatHouse({ wall = '#f3e3a5', roof = '#b5543f', sign = null, w = 4.2, d = 3.6, h = 3.0 } = {}) {
  const g = new THREE.Group();
  g.add(box(w, h, d, wall, 0, h / 2, 0, 0.05));
  const rg = new THREE.CylinderGeometry(0.01, d * 0.62, w + 0.3, 4, 1); rg.rotateY(PI / 4); rg.rotateZ(PI / 2); rg.scale(1, 0.75, 1.05);
  const r = new THREE.Mesh(rg, std(roof)); r.position.y = h + d * 0.3; r.castShadow = true; g.add(r);
  g.add(box(0.85, 1.6, 0.08, '#7d5232', 0, 0.8, d / 2 + 0.03));
  const win = std('#ffd27a', { emissive: '#ffb84a', emissiveIntensity: 0.5 });
  for (const x of [-1.35, 1.35]) { g.add(box(0.8, 0.8, 0.06, win, x, 1.35, d / 2 + 0.03)); g.add(box(0.95, 0.08, 0.1, '#ffffff', x, 0.92, d / 2 + 0.05)); }
  g.add(box(0.7, 0.6, 0.06, win, 0, h - 0.5, d / 2 + 0.03));
  if (sign) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.75), new THREE.MeshStandardMaterial({ map: textTex([sign], { w: 512, h: 150, bg: '#7a3b1f', fg: '#ffe14a', border: '#ffe14a', bw: 10, display: true }), roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.12 }));
    p.position.set(0, 2.0, d / 2 + 0.09); g.add(p);
    const aw = box(w + 0.1, 0.12, 0.7, '#e8232b', 0, 1.68, d / 2 + 0.35); aw.rotation.x = 0.35; g.add(aw);
  }
  // the ripped-up lump of ground underneath
  const grass = box(w + 1.4, 0.3, d + 1.4, '#4caf50', 0, -0.15, 0, 0.08); g.add(grass);
  const dirt = new THREE.Mesh(new THREE.ConeGeometry((w + 1.2) * 0.62, 2.2, 6), std('#7a5434', { roughness: 1 })); dirt.rotation.x = PI; dirt.position.y = -1.4; dirt.castShadow = true; g.add(dirt);
  return g;
}
export function makePigtails(color = '#3b2416') {
  const g = new THREE.Group(), m = std(color, { roughness: 0.8 }), tie = std('#ff4fa3');
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), m); b.scale.set(0.8, 1.25, 0.8); b.position.set(s * 0.4, 0.3, -0.08); g.add(b);
    const t = cyl(0.06, 0.06, 0.06, tie, 12); t.rotation.z = PI / 2; t.position.set(s * 0.33, 0.42, -0.08); g.add(t);
  }
  return g;
}

/** Deterministic TV static over the whole 2D canvas. */
export function staticNoise(g, W, H, t) {
  const cell = 12, f = Math.floor(t * 30);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += cell) for (let x = 0; x < W; x += cell) {
    const v = hash(x * 0.137 + y * 7.31 + f * 101.7);
    const c = Math.floor(v * v * 255);
    g.fillStyle = `rgb(${c},${c},${c})`; g.fillRect(x, y, cell, cell);
  }
  const band = (f * 37) % H; g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, band, W, 60);
}

// ════════════════════════════════════════════════════════════════════════════ control room set
// Local frame (set root at the world origin): floor y = 0; the lever wall runs along X at z ≈ −4 (console face at
// z = CONSOLE_Z, facing +Z); a 2 × 5 monitor bank above it (x −4.6…4.6, y 2.4…5.0); spinny chair at CHAIR; the STAFF
// ONLY door on the west wall (x = −16); the huge MAIN switch on its own pillar at MAIN; the very last lever alone at
// LAST (far east end, x = 19.5).  Named levers (top row, y = ROW_Y[0]): SUNRISE, RAIN, TUESDAY, GRAVITY.
//   anchors: lever.<NAME> (Object3D at the lever pivot), door, chair, main, last, monitors
//   set(key, v):  alarm 0..1 (red flood), power 0..1 (blackout), screens 'day'|'night'|'cheer'|'tuesday'|'alert'|
//                 'float' or a function(i, t) → mode name, lights fn(i) → 0..1 for the "blink back on" sequence
//   setLever(name, on 0..1) flips a named lever (1 = ON = up).   setMain(u) 0 = up/on … 1 = pulled down.
export const CONSOLE_Z = -3.9, ROW_Y = [1.38, 0.86];
export const NAMED = { SUNRISE: -3.0, RAIN: -1.5, TUESDAY: 0.0, GRAVITY: 4.4 };
export const LAST_X = 19.5;
const GENERIC = ['WIND', 'SNOW', 'MOON', 'TIDES', 'BIRDS', 'MONDAY', 'FRIDAY', 'CLOUDS', 'THUNDER', 'RAINBOW', 'FOG', 'STARS',
  'SPRING', 'HAIL', 'NAPS', 'SOCKS', 'LUNCH', 'WIFI', 'CATS', 'DOGS', 'PIGEONS', 'MUSIC', 'PARTY', 'HOMEWORK', 'TRAFFIC',
  'LEAVES', 'SNOOZE', 'ECHOES', 'SHADOWS', 'BUBBLES', 'HICCUPS', 'YAWNS', 'DUST', 'PUDDLES', 'BREEZE', 'DAWN', 'NOON',
  'JUNE', 'PIZZA', 'GIGGLES', 'SNEEZES', 'GLITTER', 'THURSDAY', 'BEDTIME', 'GRASS', 'WAVES', 'ICE CREAM', 'KITES'];
const LCOL = ['#3ee0c8', '#ffd23f', '#4fb3ff', '#ff7a2f', '#8a5cff', '#5bd65b', '#ff4fa3'];

function townMap(g, w, h, mode, seed = 1) {
  const R = rng(seed);
  const night = mode === 'night', float = mode === 'float';
  g.fillStyle = night ? '#0d1530' : float ? '#5a3a6a' : '#5dbb5a'; g.fillRect(0, 0, w, h);
  g.fillStyle = night ? '#222a44' : '#5a5d66'; g.fillRect(0, h * 0.44, w, h * 0.14); g.fillRect(w * 0.18, 0, w * 0.1, h);
  g.fillStyle = night ? '#3a4260' : '#cfc6b6'; g.fillRect(0, h * 0.42, w, h * 0.02); g.fillRect(0, h * 0.58, w, h * 0.02);
  const cols = ['#f2c4c4', '#c9e4f2', '#f3e3a5', '#d6e8c4', '#cbbfe6'];
  for (let i = 0; i < 7; i++) for (const row of [0.22, 0.72]) {
    const x = w * (0.32 + i * 0.1), y = h * row + (float ? -h * 0.08 - R() * h * 0.1 : 0), s = w * 0.07;
    if (float) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 6, h * row + 6, s, s); }
    g.fillStyle = night ? '#1d2440' : cols[(i + (row > 0.5 ? 2 : 0)) % 5]; g.fillRect(x, y, s, s);
    g.fillStyle = night ? '#ffd27a' : '#b5543f'; if (night) { g.fillRect(x + s * 0.2, y + s * 0.3, s * 0.2, s * 0.2); g.fillRect(x + s * 0.6, y + s * 0.3, s * 0.2, s * 0.2); } else g.fillRect(x, y, s, s * 0.35);
  }
  for (let i = 0; i < 9; i++) { g.fillStyle = night ? '#163a2a' : '#3c8f45'; g.beginPath(); g.arc(w * (0.05 + R() * 0.1), h * (0.1 + R() * 0.8), w * 0.03, 0, PI * 2); g.fill(); }
  if (night) { g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) g.fillRect(R() * w, R() * h * 0.4, 2, 2); }
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2; for (let y = 0; y < h; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
}
function screenTex(mode, seed) {
  return canvasTexture(320, 220, (g, w, h) => {
    if (mode === 'tuesday') { g.fillStyle = '#ffe14a'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d1d22'; g.textAlign = 'center'; g.textBaseline = 'middle'; fit(g, 'TUESDAY', FONTD, w * 0.88, 80); g.fillText('TUESDAY', w / 2, h / 2 + 4); return; }
    if (mode === 'alert') { g.fillStyle = '#c4121b'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONTD(46); g.fillText('GRAVITY', w / 2, h * 0.38); g.font = FONTD(62); g.fillText('OFF', w / 2, h * 0.68); return; }
    if (mode === 'cheer') {
      g.fillStyle = '#7cc0f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#5dbb5a'; g.fillRect(0, h * 0.7, w, h * 0.3);
      const sk = ['#f1c7a1', '#c68642', '#8d5524', '#ffdbac'], tc = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f'];
      for (let i = 0; i < 6; i++) { const x = w * (0.1 + i * 0.16), y = h * (0.42 + (i % 2) * 0.08); g.fillStyle = tc[i % 5]; g.fillRect(x - 16, y + 18, 32, 50); g.fillRect(x - 26, y - 24, 8, 44); g.fillRect(x + 18, y - 24, 8, 44); g.fillStyle = sk[i % 4]; g.fillRect(x - 17, y - 16, 34, 34); g.fillStyle = '#1d1d22'; g.fillRect(x - 9, y - 6, 5, 6); g.fillRect(x + 4, y - 6, 5, 6); g.beginPath(); g.arc(x, y + 6, 7, 0, PI); g.fill(); }
      return;
    }
    townMap(g, w, h, mode, seed);
  });
}

export function buildControlRoom() {
  const root = new THREE.Group(); root.name = 'controlRoom';
  const anchors = {};
  const mk = (name, x, y, z, yaw = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.y = yaw; o.name = name; root.add(o); anchors[name] = o; return o; };
  // ── shell
  const floorTex = canvasTexture(512, 512, (g, w, h) => { g.fillStyle = '#2a2e40'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1c1f2c'; g.lineWidth = 6; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(22, 8);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(46, 0.2, 16), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.1 }));
  floor.position.set(2.5, -0.1, 3.2); floor.receiveShadow = true; root.add(floor);
  // hazard strip along the console foot
  const hz = canvasTexture(512, 32, (g, w, h) => { g.fillStyle = '#ffd23f'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d1d22'; for (let x = -32; x < w; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, h); g.fill(); } });
  hz.wrapS = THREE.RepeatWrapping; hz.repeat.set(14, 1);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(30, 0.18), new THREE.MeshStandardMaterial({ map: hz, roughness: 0.7 })); strip.rotation.x = -PI / 2; strip.position.set(0, 0.005, CONSOLE_Z + 0.55); root.add(strip);
  const wallM = std('#1e2234', { roughness: 0.85 });
  root.add(box(46, 10, 0.4, wallM, 2.5, 5, -4.75));
  root.add(box(0.4, 10, 16, wallM, -16.2, 5, 3.2));
  root.add(box(0.4, 10, 16, wallM, 21.4, 5, 3.2));
  // wall ribs for scale
  for (let x = -14; x <= 20; x += 4) if (Math.abs(x) > 5.5) root.add(box(0.35, 9.5, 0.3, '#262b40', x, 4.75, -4.45));
  // ceiling light strips (for scale)
  const stripM = basic('#9fb4ff', { fog: true });
  for (let x = -13; x <= 18; x += 4.5) root.add(box(2.6, 0.08, 0.25, stripM, x, 8.2, 0.5));
  // ── console with levers
  const consoleM = std('#3a3f58', { roughness: 0.6 });
  root.add(box(28.6, 2.3, 0.6, consoleM, 0, 1.15, CONSOLE_Z - 0.3, 0.04));
  root.add(box(28.8, 0.12, 0.75, std('#555b78'), 0, 2.36, CONSOLE_Z - 0.3, 0.03));
  // instanced generic levers
  const slots = [];
  for (let r = 0; r < 2; r++) for (let x = -13.6; x <= 13.61; x += 0.8) {
    if (r === 0 && [NAMED.SUNRISE, NAMED.RAIN, NAMED.TUESDAY].some((nx) => Math.abs(nx - x) < 0.55)) continue;
    if (Math.abs(x - NAMED.GRAVITY) < 0.95) continue;   // room for the GRAVITY hazard frame
    slots.push({ x, y: ROW_Y[r], on: hash(x * 3.1 + r * 17) > 0.45, k: slots.length });
  }
  const N = slots.length;
  const baseI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.16, 0.08), std('#20232f', { roughness: 0.4, metalness: 0.4 }), N);
  const stemI = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 8), std('#c9ccd2', { metalness: 0.6, roughness: 0.3 }), N);
  const knobI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 12, 8), std('#ffffff', { roughness: 0.4 }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = V(1, 1, 1), p = V(), c = new THREE.Color();
  slots.forEach((s, i) => {
    p.set(s.x, s.y, CONSOLE_Z + 0.04); m4.compose(p, q.identity(), one); baseI.setMatrixAt(i, m4);
    const a = s.on ? -0.7 : 0.7; e.set(PI / 2 + a, 0, 0); q.setFromEuler(e);
    const dir = V(0, 1, 0).applyQuaternion(q);
    p.set(s.x, s.y, CONSOLE_Z + 0.06).addScaledVector(dir, 0.15); m4.compose(p, q, one); stemI.setMatrixAt(i, m4);
    p.set(s.x, s.y, CONSOLE_Z + 0.06).addScaledVector(dir, 0.31); m4.compose(p, q.identity(), one); knobI.setMatrixAt(i, m4);
    knobI.setColorAt(i, c.set(LCOL[i % LCOL.length]));
  });
  root.add(baseI, stemI, knobI);
  // label atlas (one merged mesh)
  const AW = 2048, AH = 1024, CW = 256, CH = 64, perRow = AW / CW;
  const atlas = canvasTexture(AW, AH, (g) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    GENERIC.forEach((name, i) => {
      const cx = (i % perRow) * CW, cy = Math.floor(i / perRow) * CH;
      g.fillStyle = '#10131c'; g.fillRect(cx, cy, CW, CH);
      g.fillStyle = LCOL[i % LCOL.length]; g.fillRect(cx + 4, cy + 4, CW - 8, CH - 8);
      g.fillStyle = '#10131c'; fit(g, name, FONTW, CW - 30, 40); g.fillText(name, cx + CW / 2, cy + CH / 2 + 2);
    });
  });
  const lgeos = [];
  slots.forEach((s, i) => {
    const gi = (i * 7) % GENERIC.length, u0 = (gi % perRow) * CW / AW, v0 = 1 - (Math.floor(gi / perRow) + 1) * CH / AH;
    const pg = new THREE.PlaneGeometry(0.5, 0.125);
    const uv = pg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * CW / AW, v0 + uv.getY(k) * CH / AH);
    pg.translate(s.x, s.y + 0.22, CONSOLE_Z + 0.012); lgeos.push(pg);
  });
  const labels = new THREE.Mesh(mergeGeometries(lgeos), new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false }));
  root.add(labels);
  // ── named levers (separate, animatable)
  const levers = {};
  function namedLever(name, x, y, z, { color = '#3ee0c8', plateW = 0.9, red = false, text = null, scale = 1 } = {}) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); root.add(g);
    g.add(box(0.28, 0.22, 0.1, std('#20232f', { metalness: 0.4, roughness: 0.4 }), 0, 0, 0.03));
    const piv = new THREE.Group(); piv.position.z = 0.08; g.add(piv);
    const stem = cyl(0.03, 0.03, 0.42, std('#c9ccd2', { metalness: 0.6, roughness: 0.3 }), 10); stem.position.y = 0.21; piv.add(stem);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), std(red ? '#e8232b' : '#ffffff', { roughness: 0.35, emissive: red ? '#550000' : '#000000' })); knob.position.y = 0.43; piv.add(knob);
    const tex = textTex(text || [name], { w: 512, h: text ? 200 : 128, bg: red ? '#d81f26' : color, fg: red ? '#ffffff' : '#10131c', border: '#10131c', bw: 10 });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(plateW, plateW * (text ? 200 : 128) / 512), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    plate.position.set(0, text ? 0.66 : 0.6, 0.012); g.add(plate);
    const anchor = new THREE.Object3D(); anchor.position.set(0, 0, 0.1); g.add(anchor); anchors['lever.' + name] = anchor;
    levers[name] = { g, piv, plate, knob, set(on) { piv.rotation.x = 2.3 - 1.95 * clamp(on, 0, 1); } };
    levers[name].set(0);
    return levers[name];
  }
  for (const n of ['SUNRISE', 'RAIN', 'TUESDAY']) namedLever(n, NAMED[n], ROW_Y[0], CONSOLE_Z, { color: n === 'SUNRISE' ? '#ffd23f' : n === 'RAIN' ? '#4fb3ff' : '#5bd65b' });
  // GRAVITY: bigger, red, in a hazard frame
  const gx = NAMED.GRAVITY;
  const hzM = new THREE.MeshStandardMaterial({ map: hz.clone(), roughness: 0.7 }); hzM.map.repeat.set(2, 1); hzM.map.needsUpdate = true;
  root.add(box(1.5, 1.45, 0.05, hzM, gx, 1.45, CONSOLE_Z + 0.005));
  root.add(box(1.32, 1.27, 0.06, '#2a1418', gx, 1.45, CONSOLE_Z + 0.01));
  namedLever('GRAVITY', gx, 1.02, CONSOLE_Z + 0.05, { red: true, text: ['GRAVITY', { t: '(DO NOT TOUCH)', s: 0.62 }], plateW: 1.1, scale: 1.15 });
  levers.GRAVITY.set(1);   // gravity is ON
  // the very last lever: alone at the far east end, on a small pedestal, under a spotlight
  root.add(box(2.1, 1.1, 1.1, consoleM, LAST_X - 0.5, 0.55, CONSOLE_Z, 0.04));
  root.add(box(1.25, 1.3, 0.12, consoleM, LAST_X, 1.75, CONSOLE_Z + 0.06, 0.03));
  namedLever('LAST', LAST_X, 1.3, CONSOLE_Z + 0.13, { text: ['THE PERSON', 'WATCHING THIS'], color: '#ffffff', plateW: 1.0, scale: 1.0 });
  levers.LAST.set(1);
  const onLamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), basic('#3cff6b', { toneMapped: false })); onLamp.position.set(LAST_X + 0.34, 1.32, CONSOLE_Z + 0.16); root.add(onLamp);
  const onTag = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.1), new THREE.MeshBasicMaterial({ map: textTex(['ON'], { w: 128, h: 64, bg: '#10131c', fg: '#3cff6b', border: null }), toneMapped: false })); onTag.position.set(LAST_X + 0.34, 1.19, CONSOLE_Z + 0.125); root.add(onTag);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 7, 32, 1, true), basic('#fff3c8', { transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  beam.position.set(LAST_X - 0.3, 4.3, CONSOLE_Z + 0.25); beam.renderOrder = 4; root.add(beam);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.0, 32), basic('#fff3c8', { transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending })); pool.rotation.x = -PI / 2; pool.position.set(LAST_X - 0.3, 0.01, CONSOLE_Z + 0.75); root.add(pool);
  mk('last', LAST_X, 0, CONSOLE_Z + 0.2);
  // ── monitors
  const modes = ['day', 'night', 'float', 'cheer', 'tuesday', 'alert'];
  const texCache = {};
  const tex = (mode, i) => texCache[mode + (i % 3)] ??= screenTex(mode, i % 3 + 1);
  const screens = [];
  const frameM = std('#14161f', { roughness: 0.5 });
  for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
    const x = -3.8 + k * 1.9, y = 3.1 + r * 1.45;
    root.add(box(1.8, 1.32, 0.18, frameM, x, y, -4.45));
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 1.14), new THREE.MeshBasicMaterial({ map: tex('day', screens.length), toneMapped: false }));
    s.position.set(x, y, -4.35); root.add(s); screens.push(s);
  }
  // side screens (dim, for scale)
  for (const x of [-8.5, -6.6, 6.6, 8.5]) for (const y of [3.2, 4.6]) { root.add(box(1.6, 1.1, 0.16, frameM, x, y, -4.45)); const s = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.94), new THREE.MeshBasicMaterial({ map: tex('night', screens.length), toneMapped: false })); s.position.set(x, y, -4.36); root.add(s); screens.push(s); }
  mk('monitors', 0, 3.6, -4.3);
  // ── MAIN switch on a pillar
  const MX = 8.6, MZ = -2.6;
  root.add(box(0.7, 1.0, 0.7, consoleM, MX, 0.5, MZ, 0.04));
  root.add(box(1.25, 1.35, 0.55, std('#c4121b', { roughness: 0.45 }), MX, 1.65, MZ, 0.06));
  const mainPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), new THREE.MeshBasicMaterial({ map: textTex(['MAIN'], { w: 512, h: 150, bg: '#fbf6ec', fg: '#c4121b', border: '#1d1d22', bw: 12, display: true }), toneMapped: false }));
  mainPlate.position.set(MX, 2.17, MZ + 0.281); root.add(mainPlate);
  const mainPiv = new THREE.Group(); mainPiv.position.set(MX, 1.55, MZ + 0.3); root.add(mainPiv);
  for (const s of [-1, 1]) { const arm = box(0.08, 0.62, 0.08, std('#c9ccd2', { metalness: 0.6, roughness: 0.3 }), s * 0.36, 0.3, 0.12); mainPiv.add(arm); }
  const grip = cyl(0.06, 0.06, 0.95, std('#1d1d22', { roughness: 0.4 }), 14); grip.rotation.z = PI / 2; grip.position.set(0, 0.6, 0.12); mainPiv.add(grip);
  for (const s of [-1, 1]) { const st = cyl(0.064, 0.064, 0.14, std('#ffd23f'), 14); st.rotation.z = PI / 2; st.position.set(s * 0.2, 0.6, 0.12); mainPiv.add(st); }
  mk('main', MX, 0, MZ + 0.3);
  const mainLamps = [];
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), basic('#3cff6b', { toneMapped: false })); l.position.set(MX + s * 0.45, 2.17, MZ + 0.29); root.add(l); mainLamps.push(l); }
  // ── spinny chair spot + door
  mk('chair', 0, 0, -0.7, PI);   // faces −Z (towards the monitors); +Z of the anchor = where it faces
  mk('door', -15.95, 0, 1.5, PI / 2);
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.65), basic('#ffffff', { toneMapped: false }));
  doorGlow.position.set(-15.99, 0.825, 1.5); doorGlow.rotation.y = PI / 2; root.add(doorGlow);
  const doorFrame = box(0.12, 1.85, 1.35, basic('#dfe8ff', { toneMapped: false }), -15.98, 0.92, 1.5); root.add(doorFrame);
  const doorPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.26), new THREE.MeshStandardMaterial({ map: textTex(['STAFF', 'ONLY'], { w: 512, h: 220, bg: '#fbf6ec', fg: '#d81f26', border: '#1d1d22', bw: 14 }), roughness: 0.6 }));
  doorPlate.position.set(-15.9, 2.2, 1.5); doorPlate.rotation.y = PI / 2; root.add(doorPlate);
  // indicator dots on the console (blink in update)
  const dotN = 60, dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ toneMapped: false }), dotN);
  for (let i = 0; i < dotN; i++) { p.set(-13.8 + i * 0.468, 2.2, CONSOLE_Z + 0.02); m4.compose(p, q.identity(), one); dots.setMatrixAt(i, m4); dots.setColorAt(i, c.set('#3cff6b')); }
  root.add(dots);
  // ── lights
  const amb = new THREE.AmbientLight('#8090c0', 0.6); root.add(amb);
  const hemi = new THREE.HemisphereLight('#a8b8ff', '#30303c', 1.1); root.add(hemi);
  const key = new THREE.DirectionalLight('#dfe6ff', 1.5); key.position.set(4, 9, 8); root.add(key); root.add(key.target); key.target.position.set(0, 0, -3);
  const monGlow = new THREE.PointLight('#8fc8ff', 6, 12, 1.2); monGlow.position.set(0, 3.6, -2.4); root.add(monGlow);
  const consoleGlow = new THREE.PointLight('#c8d0ff', 3, 16, 1.2); consoleGlow.position.set(-6, 2.2, -1.5); root.add(consoleGlow);
  const consoleGlow2 = new THREE.PointLight('#c8d0ff', 3, 16, 1.2); consoleGlow2.position.set(7, 2.2, -1.5); root.add(consoleGlow2);
  const lastSpot = new THREE.PointLight('#fff1c8', 0, 6, 1.4); lastSpot.position.set(LAST_X, 3.4, CONSOLE_Z + 1.4); root.add(lastSpot);
  const reds = [new THREE.PointLight('#ff1a1a', 0, 26, 1.0), new THREE.PointLight('#ff1a1a', 0, 26, 1.0)];
  reds[0].position.set(-4, 6, 1); reds[1].position.set(6, 6, 1); reds.forEach((r) => root.add(r));
  const alarmBulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), basic('#5a0d10')); alarmBulb.position.set(0, 6.9, -4.4); root.add(alarmBulb);
  for (const x of [-11, 11]) { const b = alarmBulb.clone(); b.material = alarmBulb.material; b.position.x = x; root.add(b); }

  const background = new THREE.Color('#05060c');
  const fog = new THREE.Fog('#05060c', 20, 60);
  const options = { alarm: 0, power: 1, screens: 'day', lights: null, lastSpot: 0 };
  const base = { amb: 0.6, hemi: 1.1, key: 1.5, mon: 8, cg: 5 };
  const tmpC = new THREE.Color();
  let lastT = 0;
  function apply() {
    const pw = clamp(options.power, 0, 1), al = clamp(options.alarm, 0, 1);
    const pulse = al > 0 ? 0.55 + 0.45 * Math.abs(Math.sin(lastT * 5.5)) : 0;
    amb.intensity = base.amb * pw * (1 - 0.5 * al); hemi.intensity = base.hemi * pw * (1 - 0.6 * al); key.intensity = base.key * pw * (1 - 0.55 * al);
    monGlow.intensity = base.mon * pw; consoleGlow.intensity = base.cg * pw * (1 - 0.4 * al); consoleGlow2.intensity = base.cg * pw * (1 - 0.4 * al);
    reds.forEach((r) => { r.intensity = 60 * al * pulse * pw; });
    alarmBulb.material.color.set(al > 0 ? tmpC.set('#ff2020').multiplyScalar(0.4 + pulse) : tmpC.set('#5a0d10'));
    lastSpot.intensity = 5 * options.lastSpot; beam.material.opacity = 0.02 + 0.05 * options.lastSpot; pool.material.opacity = 0.06 + 0.16 * options.lastSpot;
    const lf = options.lights;
    screens.forEach((s, i) => {
      const md = typeof options.screens === 'function' ? options.screens(i, lastT) : options.screens;
      s.material.map = tex(md || 'day', i);
      const k = (lf ? lf(i) : 1) * pw;
      s.material.color.setScalar(k);
    });
    labels.material.color.setScalar(Math.max(0.05, pw));
    stripM.color.set('#9fb4ff').multiplyScalar(pw);
    doorGlow.visible = pw > 0.2;
    mainLamps.forEach((l) => l.material.color.set(pw > 0.5 ? '#3cff6b' : '#202020'));
    background.set('#05060c').lerp(tmpC.set('#2a0306'), al * pulse * 0.6);
  }
  const set = {
    root, anchors, background, fog, options, levers, screens,
    exposure: 1.0,
    setLighting() { apply(); },
    set(k, v) { options[k] = v; apply(); },
    setLever(name, on) { levers[name]?.set(on); },
    setMain(u) { mainPiv.rotation.x = -2.3 * clamp(u, 0, 1); },
    point(x, y, z) { root.updateMatrixWorld(true); return root.localToWorld(V(x, y, z)); },
    update(t) {
      lastT = t;
      for (let i = 0; i < dotN; i++) { const on = hash(i * 1.7 + Math.floor(t * 3 + hash(i) * 3) * 0.37) > 0.35; dots.setColorAt(i, c.set(on ? (i % 5 === 0 ? '#ff3b30' : i % 3 ? '#3cff6b' : '#ffd23f') : '#1a1d28').multiplyScalar(options.power)); }
      dots.instanceColor.needsUpdate = true;
      apply();
    },
  };
  set.setMain(0);
  apply();
  return set;
}
