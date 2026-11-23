// In This Town — Episode 23 "Low Moon": new props.
//
//   makeMoonEye()            the giant moon that is secretly an eye.  Unit radius (scale it).  +Z of the group = the side
//                            facing the viewer (call userData.face(cameraPos) every frame).  userData.set({ pupil 0..1,
//                            lid 0 open..1 closed, glow, dilate, slit 0 round..1 cat slit, irisGlow, haloColor }) and userData.gaze(worldPoint | null).  The ball carries
//                            craters, iris and pupil; the lid (a moon-skin dome with lashes) does not rotate with the gaze.
//   makeClockFace()          clock face disc (r 0.95, faces +Z) with 3D hands.  userData.set(minuteTurns, hourTurns)
//                            (1 turn = full circle, clockwise from 12).
//   makeBendLamp()           street lamp copy (h 4.3) with a pivot at the base: userData.set({ tilt, dir, on })
//                            tilt (rad) leans the post toward world yaw `dir` (parent frame).
//   makeNoMusicSign()        NO LOUD MUSIC board on a pole (root at the pole foot, faces +Z).
//   makeMustache()           loose handlebar mustache (centred, faces +Z).
//   makeKazoo()              tiny orange kazoo (mouth end at the origin, points +Z).
//   makeSpeakerTower()       huge black stage speaker (1.4 × 2.7 × 1.0), cones on +Z.  userData.set(pulse 0..1, glow)
//   makeTablet()             tablet (0.52 × 0.36), screen on +Z.  userData.set('folder' | 'play' | 'playing')
//   makeSickFacade()         a house front with 2 × 3 lit bedroom windows.  userData.slots[i] = { x, y, z } (local
//                            character root for someone sitting up in bed in window i), userData.blankets[i].
//   makeDoorway()            warm open doorway + hinged door panel (root at the door foot centre, faces +Z).  set(open)
//   makeRoofTile()           one chunky roof tile.
//   makeThermometer()        thin thermometer (points +Z).
//   makeBlanket(color)       a duvet slab for "peeking over the blanket".
import * as THREE from 'three';
import { clamp, lerp, hash, canvasTexture } from '../lib/util.js';
import { std, box, cyl, sph, glowSprite } from '../ep18/props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const FONT_D = (s) => `${s}px "ITT Luckiest", "Luckiest Guy", "DejaVu Sans", sans-serif`;
const FONT_T = (s) => `900 ${s}px "ITT Nunito", "Nunito", "DejaVu Sans", sans-serif`;
function fitFont(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }

// ═════════════════════════════════════════════════════════════════════════════ the moon (eye)
let _moonTex = null;
function moonTex() {
  return _moonTex ??= canvasTexture(1024, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#eef1ff'); gr.addColorStop(0.5, '#f7f8ff'); gr.addColorStop(1, '#dfe3f6');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    // soft maria
    for (let i = 0; i < 16; i++) {
      const x = hash(i * 3.1) * w, y = h * (0.25 + 0.5 * hash(i * 5.7)), r = 40 + 90 * hash(i * 7.3);
      const g2 = c.createRadialGradient(x, y, 2, x, y, r); g2.addColorStop(0, 'rgba(160,168,205,0.55)'); g2.addColorStop(1, 'rgba(160,168,205,0)');
      c.fillStyle = g2; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill();
    }
    // craters: dark bowl + light rim
    for (let i = 0; i < 70; i++) {
      const x = hash(i * 1.37 + 4) * w, y = h * (0.12 + 0.76 * hash(i * 2.91 + 1)), r = 6 + 34 * Math.pow(hash(i * 4.13 + 2), 2);
      c.fillStyle = 'rgba(138,146,186,0.75)'; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill();
      c.fillStyle = 'rgba(118,126,170,0.6)'; c.beginPath(); c.arc(x + r * 0.15, y + r * 0.15, r * 0.7, 0, PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = Math.max(2, r * 0.18); c.beginPath(); c.arc(x - r * 0.08, y - r * 0.08, r, PI * 0.9, PI * 1.75); c.stroke();
    }
  });
}
const MOON_VS = `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const MOON_FS = `uniform sampler2D map; uniform float glow; uniform vec3 tint; uniform float opacity;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  vec3 c = texture2D(map, vUv).rgb * tint;
  float ndv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  c *= mix(0.62, 1.0, smoothstep(0.0, 0.7, ndv));          // limb darkening = round
  c += vec3(0.55, 0.62, 0.9) * pow(1.0 - ndv, 3.0) * 0.6;  // cool rim glow
  gl_FragColor = vec4(c * glow, opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
function moonMat(tint = '#ffffff') {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: moonTex() }, glow: { value: 1.25 }, tint: { value: new THREE.Color(tint) }, opacity: { value: 1 } },
    vertexShader: MOON_VS, fragmentShader: MOON_FS,
  });
}
let _irisTex = null;
const irisTex = () => _irisTex ??= canvasTexture(16, 256, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, '#a8fbff'); gr.addColorStop(0.45, '#39d4e8'); gr.addColorStop(0.75, '#7a4cf0'); gr.addColorStop(0.92, '#2a1660'); gr.addColorStop(1, '#120a30');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
});
function capGeo(r, ang, seg = 48) { const g = new THREE.SphereGeometry(r, seg, 12, 0, PI * 2, 0, ang); g.rotateX(PI / 2); return g; }

export function makeMoonEye() {
  const g = new THREE.Group(); g.name = 'moonEye';
  const ball = new THREE.Group(); g.add(ball);
  const skin = moonMat('#ffffff');
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), skin); ball.add(sphere);
  sphere.rotation.y = -PI / 2;                     // texture seam (u = 0, the −X meridian) turned to the back
  // a few raised crater bowls (darker spheres sunk into the surface)
  const cm = moonMat('#b8bedc');
  const craterGeo = new THREE.SphereGeometry(1, 20, 14);
  const craters = [];
  for (const [yw, pt, r] of [[0.55, 0.45, 0.16], [-0.62, 0.2, 0.12], [0.25, -0.55, 0.2], [-0.35, -0.42, 0.1], [0.9, -0.15, 0.13], [-0.95, 0.55, 0.15], [0.1, 0.78, 0.11]]) {
    const m = new THREE.Mesh(craterGeo, cm);
    const d = V(Math.sin(yw) * Math.cos(pt), Math.sin(pt), Math.cos(yw) * Math.cos(pt));
    m.position.copy(d.multiplyScalar(0.985)); m.scale.set(r, r, r * 0.25); m.lookAt(0, 0, 0); ball.add(m);
    craters.push({ m, inIris: Math.acos(clamp(Math.cos(yw) * Math.cos(pt), -1, 1)) < 0.62 + r });
  }
  // iris + pupil (fade in)
  const OFF = { polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 };
  const irisM = new THREE.MeshBasicMaterial({ map: irisTex(), transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false, ...OFF });
  const iris = new THREE.Mesh(capGeo(1.03, 0.62), irisM); iris.renderOrder = 6; ball.add(iris);   // lifted off the skin (no z-fight)
  const pupM = basic('#06040e', { transparent: true, opacity: 0, fog: false, depthWrite: false, ...OFF, polygonOffsetFactor: -8, polygonOffsetUnits: -8 });
  const pupil = new THREE.Mesh(capGeo(1.045, 0.27), pupM); pupil.renderOrder = 7; ball.add(pupil);
  const hlM = basic('#ffffff', { transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false });
  const hl = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), hlM); hl.renderOrder = 8; g.add(hl);
  const hl2 = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), hlM); hl2.renderOrder = 8; g.add(hl2);
  // the lid: a moon-skin dome with lashes, pivoting about X
  const lid = new THREE.Group(); g.add(lid);
  const lidM = moonMat('#9da3c4');
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.04, 64, 24, 0, PI * 2, 0, PI / 2), lidM); lid.add(dome);
  const rimM = basic('#2a2848', { fog: false });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.05, 8, 96), rimM); rim.rotation.x = PI / 2; lid.add(rim);
  const lashM = basic('#1a1830', { fog: false });
  for (let i = 0; i < 15; i++) {
    const a = PI / 2 + (i - 7) * 0.13;
    const p = V(Math.cos(a), 0, Math.sin(a));
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.26), lashM);
    l.position.copy(p.clone().multiplyScalar(1.15)); l.position.y = -0.06;
    l.lookAt(p.clone().multiplyScalar(3).add(V(0, -1.2, 0))); lid.add(l);
  }
  // glow halo
  const halo = glowSprite('#cdd6ff', 4.4, 0.55); halo.position.z = -0.6; g.add(halo);
  const tmp = new THREE.Matrix4(), inv = new THREE.Matrix4(), p = V();
  g.userData = {
    ball, lid, halo,
    /** turn the group so its front (+Z) faces the camera position (world) */
    face(camPos) { g.lookAt(camPos); },
    /** gaze at a world point (null = straight ahead / at the camera) */
    gaze(target, k = 1) {
      if (!target) { ball.rotation.set(0, 0, 0); return; }
      g.updateMatrixWorld(true); inv.copy(g.matrixWorld).invert(); p.copy(target).applyMatrix4(inv);
      const yaw = Math.atan2(p.x, p.z), pitch = Math.atan2(p.y, Math.hypot(p.x, p.z));
      ball.rotation.set(-pitch * k, yaw * k, 0, 'YXZ');
    },
    set({ pupil: pu = 0, lid: ld = 0, glow = 1.25, dilate = 1, halo: ha = 0.55, rimGlow = 1, slit = 0, irisGlow = 1, haloColor = '#cdd6ff' } = {}) {
      irisM.opacity = clamp(pu, 0, 1); pupM.opacity = clamp(pu * 1.1, 0, 1);
      irisM.color.setScalar(irisGlow); halo.material.color.set(haloColor);
      iris.visible = pu > 0.001; pupil.visible = pu > 0.001;
      for (const c of craters) c.m.visible = !(c.inIris && pu > 0.001);
      pupil.scale.set(dilate * lerp(1, 0.3, clamp(slit, 0, 1)), dilate * lerp(1, 1.35, clamp(slit, 0, 1)), 1);   // round → cat slit
      hlM.opacity = clamp(pu, 0, 1) * 0.9;
      // highlight follows the ball a little (sits in the iris)
      const by = ball.rotation.y, bx = ball.rotation.x;
      hl.position.set(Math.sin(by) * 0.98 - 0.12, -Math.sin(bx) * 0.98 + 0.13, 1.06); hl2.position.set(hl.position.x + 0.12, hl.position.y - 0.1, 1.06);
      lid.visible = ld > 0.02;
      lid.rotation.x = lerp(-PI / 2 - 0.2, PI / 2 + 0.02, clamp(ld, 0, 1));
      for (const m of [skin, cm]) m.uniforms.glow.value = glow;
      lidM.uniforms.glow.value = glow;
      halo.material.opacity = ha;
      void rimGlow; void tmp;
    },
  };
  g.userData.set({});
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ clock face
let _clockTex = null;
const clockTex = () => _clockTex ??= canvasTexture(512, 512, (g, w, h) => {
  g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 6, 0, PI * 2); g.fill();
  g.lineWidth = 22; g.strokeStyle = '#3a2a1c'; g.stroke();
  g.fillStyle = '#3a2a1c';
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * PI * 2, big = i % 5 === 0, r0 = big ? 196 : 206, r1 = 224;
    g.lineWidth = big ? 12 : 4; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * r0, h / 2 - Math.cos(a) * r0); g.lineTo(w / 2 + Math.sin(a) * r1, h / 2 - Math.cos(a) * r1); g.stroke();
  }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT_D(64);
  for (let i = 1; i <= 12; i++) { const a = i / 12 * PI * 2; g.fillText(String(i), w / 2 + Math.sin(a) * 158, h / 2 - Math.cos(a) * 158 + 4); }
});
export function makeClockFace() {
  const g = new THREE.Group(); g.name = 'clockFace';
  const faceM = new THREE.MeshBasicMaterial({ map: clockTex() });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.95, 48), faceM); g.add(disc);
  const handM = std('#2a1c12', { roughness: 0.4 });
  const minute = new THREE.Group(); minute.position.z = 0.03; g.add(minute);
  minute.add(box(0.07, 0.8, 0.035, handM, 0, 0.33, 0));
  const tipM = std('#e8232b', { emissive: '#600000' });
  minute.add(box(0.11, 0.11, 0.035, tipM, 0, 0.72, 0.005));
  const hour = new THREE.Group(); hour.position.z = 0.06; g.add(hour);
  hour.add(box(0.1, 0.52, 0.035, handM, 0, 0.2, 0));
  const hub = cyl(0.07, 0.07, 0.06, handM, 16); hub.rotation.x = PI / 2; hub.position.z = 0.08; g.add(hub);
  const glow = glowSprite('#fff2c0', 2.8, 0.25); glow.position.z = 0.02; g.add(glow);
  g.userData = {
    minute, hour, faceM, glow,
    set(mTurns, hTurns) { minute.rotation.z = -mTurns * PI * 2; hour.rotation.z = -hTurns * PI * 2; },
    tint(c) { faceM.color.set(c); },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ bendable street lamp
const METAL = '#2f3a3a';
export function makeBendLamp(h = 4.3) {
  const g = new THREE.Group(); g.name = 'bendLamp';
  const dir = new THREE.Group(); g.add(dir);
  const tilt = new THREE.Group(); dir.add(tilt);
  const mm = std(METAL, { roughness: 0.6 });
  const base = cyl(0.16, 0.16, 0.5, mm, 10); base.position.y = 0.25; tilt.add(base);
  const post = cyl(0.065, 0.065, h, mm, 8); post.position.y = h / 2; tilt.add(post);
  tilt.add(box(0.46, 0.06, 0.46, mm, 0, h + 0.02, 0));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.3, 4), mm); roof.rotation.y = PI / 4; roof.position.y = h + 0.62; tilt.add(roof);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tilt.add(box(0.04, 0.44, 0.04, mm, sx * 0.18, h + 0.25, sz * 0.18));
  const coreM = basic('#fff1c8', { toneMapped: false });
  const core = box(0.3, 0.4, 0.3, coreM, 0, h + 0.25, 0); core.castShadow = false; tilt.add(core);
  const halo = glowSprite('#ffe2a0', 2.6, 0.75); halo.position.y = h + 0.25; tilt.add(halo);
  g.userData = {
    head() { g.updateMatrixWorld(true); return core.getWorldPosition(V()); },
    set({ tilt: a = 0, dir: d = 0, on = 1 } = {}) {
      dir.rotation.y = d; tilt.rotation.x = a;
      coreM.color.set('#fff1c8').multiplyScalar(0.15 + 0.85 * on); halo.material.opacity = 0.75 * on; halo.visible = on > 0.05;
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ NO LOUD MUSIC sign
export function makeNoMusicSign() {
  const g = new THREE.Group(); g.name = 'noMusicSign';
  const tex = canvasTexture(768, 512, (c, w, h) => {
    c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h);
    c.lineWidth = 34; c.strokeStyle = '#d4202a'; c.strokeRect(17, 17, w - 34, h - 34);
    // crossed-out note
    const cx = w / 2, cy = h * 0.36, r = 92;
    c.fillStyle = '#1d1d22'; c.font = FONT_D(150); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♪', cx, cy + 8);
    c.lineWidth = 22; c.strokeStyle = '#d4202a'; c.beginPath(); c.arc(cx, cy, r, 0, PI * 2); c.stroke();
    c.beginPath(); c.moveTo(cx - r * 0.7, cy - r * 0.7); c.lineTo(cx + r * 0.7, cy + r * 0.7); c.stroke();
    c.fillStyle = '#1d1d22';
    const s = fitFont(c, 'NO LOUD MUSIC', FONT_D, w * 0.84, 104); c.font = FONT_D(s); c.fillText('NO LOUD MUSIC', cx, h * 0.78);
  });
  const pole = cyl(0.06, 0.06, 2.6, '#7a7f88', 10); pole.position.set(0, 1.3, -0.1); g.add(pole);   // behind the board
  const board = box(1.56, 1.06, 0.06, '#e8e2d4', 0, 2.25, 0); g.add(board);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25 }));
  face.position.set(0, 2.25, 0.035); g.add(face);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ small things
export function makeMustache(color = '#3a2416') {
  const g = new THREE.Group(); g.name = 'mustache';
  const m = std(color, { roughness: 0.9 });
  for (const s of [-1, 1]) {
    const a = box(0.2, 0.085, 0.07, m, s * 0.095, 0, 0, 0.03); a.rotation.z = s * 0.18; g.add(a);
    const b = box(0.09, 0.07, 0.06, m, s * 0.215, -0.03, 0, 0.025); b.rotation.z = s * 0.6; g.add(b);
  }
  return g;
}
export function makeKazoo() {
  const g = new THREE.Group(); g.name = 'kazoo';
  const m = std('#ff7a1a', { roughness: 0.45, emissive: '#5a2000' });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.022, 0.22, 14), m); body.rotation.x = PI / 2; body.position.z = 0.11; g.add(body);
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.07, 14, 1, true), m); bell.rotation.x = -PI / 2; bell.position.z = 0.24; g.add(bell);
  const top = cyl(0.022, 0.022, 0.03, '#ffd23f', 10); top.position.set(0, 0.035, 0.12); g.add(top);
  return g;
}
export function makeRoofTile() { const g = new THREE.Group(); g.add(box(0.7, 0.09, 0.45, '#b5543f', 0, 0, 0, 0.03)); g.add(box(0.7, 0.03, 0.08, '#8a3e2e', 0, 0.05, 0.12)); return g; }
export function makeThermometer() {
  const g = new THREE.Group();
  const s = cyl(0.012, 0.012, 0.2, '#f4f4f4', 8); s.rotation.x = PI / 2; s.position.z = 0.1; g.add(s);
  const tip = sph(0.018, std('#e8232b', { emissive: '#700000' }), 8, 6); tip.position.z = 0.2; g.add(tip);
  return g;
}
export function makeBlanket(color = '#3f6fd8') {
  const g = new THREE.Group();
  const tex = canvasTexture(256, 256, (c, w, h) => { c.fillStyle = color; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = 0; y < h; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < w; x += 64) { c.beginPath(); c.arc(x + 16, y + 16, 9, 0, PI * 2); c.fill(); } });
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  g.add(box(1.05, 0.95, 0.16, m, 0, 0.47, 0, 0.07));
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ speaker tower
export function makeSpeakerTower() {
  const g = new THREE.Group(); g.name = 'speakerTower';
  const W = 1.4, H = 2.7, D = 1.0;
  g.add(box(W, H, D, std('#18181d', { roughness: 0.55 }), 0, H / 2, 0, 0.05));
  g.add(box(W + 0.06, 0.08, D + 0.06, '#3a3a44', 0, H, 0));
  g.add(box(W + 0.06, 0.12, D + 0.06, '#3a3a44', 0, 0.06, 0));
  const ringM = std('#8d929c', { roughness: 0.4, metalness: 0.3 });
  const coneM = std('#4a4d55', { roughness: 0.7 });
  const capM = std('#a7acb6', { roughness: 0.35, metalness: 0.2 });
  const glowM = basic('#3ee0c8', { toneMapped: false, transparent: true, opacity: 0.9 });
  const cones = [];
  for (const [y, r] of [[0.85, 0.52], [1.85, 0.34], [2.38, 0.15]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.12, 8, 32), ringM); ring.position.set(0, y, D / 2 + 0.02); g.add(ring);
    const piv = new THREE.Group(); piv.position.set(0, y, D / 2); g.add(piv);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 0.95, r * 0.5, 28, 1, true), coneM); cone.rotation.x = -PI / 2; cone.position.z = -r * 0.1; piv.add(cone);
    const cap = sph(r * 0.32, capM, 16, 10); cap.scale.z = 0.5; cap.position.z = 0.02; piv.add(cap);
    const gl = new THREE.Mesh(new THREE.TorusGeometry(r * 1.16, 0.025, 6, 40), glowM); gl.position.set(0, y, D / 2 + 0.03); g.add(gl);
    cones.push({ piv, r });
  }
  const halo = glowSprite('#3ee0c8', 3.0, 0); halo.position.set(0, 1.3, D / 2 + 0.2); g.add(halo);
  g.userData = {
    front(y = 0.85) { g.updateMatrixWorld(true); return g.localToWorld(V(0, y, D / 2 + 0.05)); },
    set(pulse = 0, glow = 0.5) {
      cones.forEach((c, i) => { const k = pulse * (1 - i * 0.2); c.piv.position.z = D / 2 + 0.22 * k * c.r / 0.52; c.piv.scale.setScalar(1 + 0.12 * k); });
      glowM.opacity = 0.35 + 0.6 * glow; halo.material.opacity = 0.55 * glow;
    },
  };
  g.userData.set(0, 0.3);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ tablet
function tabletTex(mode) {
  return canvasTexture(768, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#16203a'); gr.addColorStop(1, '#0b1020'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (mode === 'folder') {
      // folder icon
      c.fillStyle = '#ffc93a'; c.beginPath(); c.roundRect(w / 2 - 150, 60, 120, 50, 14); c.fill();
      c.beginPath(); c.roundRect(w / 2 - 150, 86, 300, 190, 18); c.fill();
      c.fillStyle = '#e8a91c'; c.fillRect(w / 2 - 150, 120, 300, 8);
      c.fillStyle = '#1d1d22'; let s = fitFont(c, 'SHOUTS', FONT_D, 270, 96); c.font = FONT_D(s); c.fillText('SHOUTS', w / 2, 200);
      c.fillStyle = '#ffffff'; s = fitFont(c, '1,825 files', FONT_T, w * 0.86, 76); c.font = FONT_T(s); c.fillText('1,825 files', w / 2, 360);
      c.fillStyle = '#7fe3ff'; s = fitFont(c, '9:00 PM · every night', FONT_T, w * 0.86, 46); c.font = FONT_T(s); c.fillText('9:00 PM · every night', w / 2, 440);
    } else {
      c.fillStyle = mode === 'playing' ? '#3cff6b' : '#ffffff';
      let s = fitFont(c, mode === 'playing' ? 'PLAYING ALL' : 'PLAY ALL', FONT_D, w * 0.86, 110); c.font = FONT_D(s);
      c.fillText(mode === 'playing' ? 'PLAYING ALL' : 'PLAY ALL', w / 2, 110);
      c.fillStyle = mode === 'playing' ? '#3cff6b' : '#e8232b'; c.beginPath(); c.arc(w / 2, 290, 96, 0, PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(w / 2 - 34, 240); c.lineTo(w / 2 - 34, 340); c.lineTo(w / 2 + 52, 290); c.closePath(); c.fill();
      c.fillStyle = '#7fe3ff'; s = fitFont(c, '1,825 SHOUTS', FONT_T, w * 0.86, 60); c.font = FONT_T(s); c.fillText('1,825 SHOUTS', w / 2, 448);
    }
  });
}
export function makeTablet() {
  const g = new THREE.Group(); g.name = 'tablet';
  g.add(box(0.52, 0.36, 0.025, std('#1b1b20', { roughness: 0.35 }), 0, 0, 0, 0.012));
  const texs = { folder: tabletTex('folder'), play: tabletTex('play'), playing: tabletTex('playing') };
  const scrM = new THREE.MeshBasicMaterial({ map: texs.folder, toneMapped: false });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.47, 0.31), scrM); scr.position.z = 0.0135; g.add(scr);
  const glow = glowSprite('#7fd8ff', 0.9, 0.35); glow.position.z = 0.03; g.add(glow);
  // live counter screen: redrawn only when the number changes (deterministic: depends on n alone)
  let cnt = null, lastN = -1;
  const drawCount = (n) => {
    cnt ??= canvasTexture(768, 512, () => {});
    const c = cnt.image.getContext('2d'), w = 768, h = 512;
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#16203a'); gr.addColorStop(1, '#0b1020'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ffc93a'; c.beginPath(); c.roundRect(w / 2 - 90, 36, 70, 30, 8); c.fill(); c.beginPath(); c.roundRect(w / 2 - 90, 52, 180, 104, 12); c.fill();
    c.fillStyle = '#1d1d22'; let s = fitFont(c, 'SHOUTS', FONT_D, 160, 52); c.font = FONT_D(s); c.fillText('SHOUTS', w / 2, 108);
    const txt = n.toLocaleString('en-US');
    c.fillStyle = n >= 1825 ? '#3cff6b' : '#ffffff'; s = fitFont(c, txt, FONT_D, w * 0.86, 210); c.font = FONT_D(s); c.fillText(txt, w / 2, 300);
    c.fillStyle = '#7fe3ff'; s = fitFont(c, 'files recorded', FONT_T, w * 0.8, 56); c.font = FONT_T(s); c.fillText('files recorded', w / 2, 448);
    cnt.needsUpdate = true;
  };
  g.userData = {
    screen() { g.updateMatrixWorld(true); return scr.getWorldPosition(V()); },
    set(mode = 'folder') { scrM.map = texs[mode] || texs.folder; },
    count(n) { n = Math.max(0, Math.round(n)); if (n !== lastN) { drawCount(n); lastN = n; } scrM.map = cnt; },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ sick facade (2 × 3 windows)
export const FAC = { W: 4.6, H: 7.4, cols: [-1.0, 1.0], rows: [1.75, 3.9, 6.05], ww: 1.32, wh: 1.2 };
export function makeSickFacade({ wall = '#f2c4c4', roof = '#4a5d7e' } = {}) {
  const g = new THREE.Group(); g.name = 'sickFacade';
  const wm = std(wall, { roughness: 0.85 }), trim = std('#fbf6ec');
  const { W, H, cols, rows, ww, wh } = FAC, th = 0.24;
  const xs = [-W / 2, cols[0] - ww / 2, cols[0] + ww / 2, cols[1] - ww / 2, cols[1] + ww / 2, W / 2];
  // vertical strips (full height)
  for (const [a, b] of [[xs[0], xs[1]], [xs[2], xs[3]], [xs[4], xs[5]]]) g.add(box(b - a, H, th, wm, (a + b) / 2, H / 2, 0));
  // horizontal pieces inside each column
  const ys = [0, ...rows.flatMap((r) => [r - wh / 2, r + wh / 2]), H];
  for (const cx of cols) for (let k = 0; k < ys.length; k += 2) { const a = ys[k], b = ys[k + 1]; if (b > a) g.add(box(ww, b - a, th, wm, cx, (a + b) / 2, 0)); }
  // cornice + roof slab
  g.add(box(W + 0.4, 0.3, 0.6, trim, 0, H + 0.12, 0.12));
  const rf = box(W + 0.7, 0.25, 2.2, roof, 0, H + 0.75, -0.6); rf.rotation.x = -0.5; g.add(rf);
  // windows: frame, sill, curtains, a lit bedroom behind with a bed + blanket
  const slots = [], blankets = [], roomM = [];
  const curtainCols = ['#ff7aa8', '#7fd3ff', '#ffd23f', '#9be08a', '#c9a6ff', '#ffb36b'];
  const blanketCols = ['#3f6fd8', '#e8505b', '#4caf50', '#8a5cff', '#ff9a2a', '#2fb8a8'];
  let i = 0;
  for (const cy of [...rows].reverse()) for (const cx of cols) {
    for (const y of [cy - wh / 2, cy + wh / 2]) g.add(box(ww + 0.22, 0.12, 0.34, trim, cx, y, 0.04));
    for (const x of [cx - ww / 2, cx + ww / 2]) g.add(box(0.12, wh + 0.2, 0.34, trim, x, cy, 0.04));
    g.add(box(ww + 0.34, 0.1, 0.5, trim, cx, cy - wh / 2 - 0.04, 0.16));
    for (const s of [-1, 1]) g.add(box(0.26, wh - 0.06, 0.05, curtainCols[i], cx + s * (ww / 2 - 0.17), cy + 0.02, -0.18));
    // room box behind
    const rm = new THREE.MeshStandardMaterial({ color: ['#ffd9a0', '#ffe6b8', '#ffcf9a'][i % 3], roughness: 0.9, emissive: '#ffb860', emissiveIntensity: 0.32 });
    roomM.push(rm);
    const back = box(ww + 0.9, wh + 1.0, 0.06, rm, cx, cy, -1.5); back.castShadow = false; g.add(back);
    for (const s of [-1, 1]) { const sd = box(0.06, wh + 1.0, 1.4, rm, cx + s * (ww / 2 + 0.42), cy, -0.8); sd.castShadow = false; g.add(sd); }
    const ceil = box(ww + 0.9, 0.06, 1.4, rm, cx, cy + wh / 2 + 0.45, -0.8); ceil.castShadow = false; g.add(ceil);
    // picture frame on the back wall
    g.add(box(0.36, 0.28, 0.03, '#8a5a2e', cx + 0.45, cy + 0.42, -1.45));
    g.add(box(0.28, 0.2, 0.03, ['#a8d8ff', '#ffe08a', '#c8f0b0'][i % 3], cx + 0.45, cy + 0.42, -1.43));
    // bed: headboard + mattress + blanket
    g.add(box(1.2, 0.7, 0.08, '#7d5232', cx, cy - 0.3, -1.25));
    const bl = box(1.1, 0.3, 1.0, blanketCols[i], cx, cy - 0.62, -0.62, 0.06); g.add(bl); blankets.push(bl);
    // character root for someone sitting up in this bed (head ≈ window centre)
    slots.push({ x: cx, y: cy - 1.38, z: -0.95 });
    i++;
  }
  const lamp = glowSprite('#ffcf80', 3.5, 0.18); lamp.position.set(0, H / 2, -0.6); g.add(lamp);
  g.userData = { slots, blankets, roomM, glow(k = 1) { roomM.forEach((m) => { m.emissiveIntensity = 0.32 * k; }); } };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ doorway
export function makeDoorway(color = '#7a1f2b') {
  const g = new THREE.Group(); g.name = 'doorway';
  const light = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), basic('#ffcf70', { toneMapped: false })); light.position.set(0, 1.0, 0.01); g.add(light);
  const glow = glowSprite('#ffc860', 2.6, 0); glow.position.set(0, 1.0, 0.3); g.add(glow);
  const hinge = new THREE.Group(); hinge.position.set(-0.5, 0, 0.05); g.add(hinge);
  hinge.add(box(1.0, 2.0, 0.07, std(color), 0.5, 1.0, 0, 0.02));
  const knob = sph(0.05, std('#ffd23f', { metalness: 0.4, roughness: 0.3 }), 10, 8); knob.position.set(0.85, 1.0, 0.06); hinge.add(knob);
  g.userData = { set(open = 0) { hinge.rotation.y = -1.9 * clamp(open, 0, 1); glow.material.opacity = 0.7 * clamp(open * 2, 0, 1); } };
  g.userData.set(0);
  return g;
}
