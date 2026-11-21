// src/shots.demo.js — standalone engine demo (MODULE D). Primitives only: it does NOT import characters.js,
// world.js or props.js (those are written in parallel). Use with:
//   index.html?shotsModule=/src/shots.demo.js&timeline=audio/timeline.demo.json
// It exercises: lazy/eager sets, cast as factory functions, use/place/anchor, ctx.add auto-cleanup,
// cam.set/move/shake/punch/orbit, hussTimes, time('+offset') anchors, props store, setAccessory reset,
// set options reset, fx overlay/vignette, quote + sfx captions.
import * as THREE from 'three';
import { rbox, mat, canvasTexture, rng, ease, clamp, lerp } from './lib/util.js';

// ───────────────────────────── stub character (a blocky toy figure, ~2.0 tall, faces +Z) ─────────────────
const faceCache = new Map();
function faceTexture(skin, expr) {
  const key = skin + expr;
  if (faceCache.has(key)) return faceCache.get(key);
  const tex = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = skin; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b1b1b'; g.strokeStyle = '#1b1b1b'; g.lineCap = 'round'; g.lineWidth = 7;
    const eye = (x, y) => { g.beginPath(); g.ellipse(x, y, 7, 10, 0, 0, Math.PI * 2); g.fill(); };
    if (expr === 'huss') { // squeezed > < eyes + shouting mouth
      g.beginPath(); g.moveTo(32, 44); g.lineTo(48, 52); g.lineTo(32, 60); g.stroke();
      g.beginPath(); g.moveTo(96, 44); g.lineTo(80, 52); g.lineTo(96, 60); g.stroke();
      g.fillStyle = '#5a1010'; g.beginPath(); g.ellipse(64, 92, 20, 16, 0, 0, Math.PI * 2); g.fill();
    } else if (expr === 'laugh') {
      g.beginPath(); g.arc(40, 56, 10, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.beginPath(); g.arc(88, 56, 10, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.fillStyle = '#5a1010'; g.beginPath(); g.arc(64, 82, 22, 0, Math.PI); g.fill();
    } else {
      eye(42, 54); eye(86, 54);
      if (expr === 'determined') { g.beginPath(); g.moveTo(28, 34); g.lineTo(54, 42); g.stroke(); g.beginPath(); g.moveTo(100, 34); g.lineTo(74, 42); g.stroke(); }
      g.beginPath();
      if (expr === 'smile' || expr === 'grin') g.arc(64, 80, 18, 0.15 * Math.PI, 0.85 * Math.PI);
      else { g.moveTo(50, 92); g.lineTo(78, 92); }
      g.stroke();
    }
  });
  faceCache.set(key, tex);
  return tex;
}

function stubCharacter(id, { skin = '#f1c7a1', top = '#1d1d22', pants = '#55575e', hair = '#2b1d14', emblem = null } = {}) {
  const root = new THREE.Group(); root.name = id;
  const hips = new THREE.Group(); hips.position.y = 0.9; root.add(hips);
  const torso = new THREE.Group(); hips.add(torso);
  const body = new THREE.Mesh(rbox(0.62, 0.62, 0.36, 0.08), mat(top)); body.position.y = 0.31; torso.add(body);
  if (emblem) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), mat(emblem, { roughness: 0.5 })); e.position.set(0, 0.36, 0.182); torso.add(e); }
  const head = new THREE.Group(); head.position.y = 0.63; torso.add(head);
  const headMesh = new THREE.Mesh(rbox(0.56, 0.5, 0.48, 0.09), mat(skin)); headMesh.position.y = 0.25; head.add(headMesh);
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTexture(skin, 'neutral'), roughness: 0.8 });
  const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.42), faceMat); facePlane.position.set(0, 0.24, 0.242); head.add(facePlane);
  const hairMesh = new THREE.Mesh(rbox(0.6, 0.14, 0.52, 0.06), mat(hair)); hairMesh.position.y = 0.52; head.add(hairMesh);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 16), mat('#ff4fa3', { roughness: 0.6 }));
  hat.position.set(0.06, 0.74, 0); hat.rotation.z = -0.2; hat.visible = false; hat.castShadow = true; head.add(hat);
  const mkArm = (s) => { const p = new THREE.Group(); p.position.set(0.4 * s, 0.56, 0); torso.add(p);
    const m = new THREE.Mesh(rbox(0.18, 0.6, 0.2, 0.06), mat(top)); m.position.y = -0.27; p.add(m);
    const hand = new THREE.Mesh(rbox(0.17, 0.15, 0.17, 0.05), mat(skin)); hand.position.y = -0.6; p.add(hand); return p; };
  const mkLeg = (s) => { const p = new THREE.Group(); p.position.set(0.16 * s, 0.9, 0); root.add(p);
    const m = new THREE.Mesh(rbox(0.24, 0.8, 0.26, 0.06), mat(pants)); m.position.y = -0.42; p.add(m);
    const shoe = new THREE.Mesh(rbox(0.26, 0.12, 0.36, 0.05), mat('#f2f2f2')); shoe.position.set(0, -0.84, 0.05); p.add(shoe); return p; };
  const armL = mkArm(1), armR = mkArm(-1), legL = mkLeg(1), legR = mkLeg(-1);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const joints = { hips, torso, head, armL, armR, legL, legR };
  const ch = {
    id, root, joints,
    pose(action, t, p = {}) {
      const sp = p.speed || 1, T = t * sp;
      hips.position.set(0, 0.9, 0); hips.rotation.set(0, 0, 0); torso.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0);
      armL.rotation.set(0, 0, 0.08); armR.rotation.set(0, 0, -0.08); legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0);
      if (action === 'idle') { hips.position.y = 0.9 + Math.sin(T * 2.4) * 0.008; head.rotation.x = Math.sin(T * 1.2) * 0.03; }
      else if (action === 'dance') {
        const b = Math.sin(T * Math.PI * 4); hips.position.y = 0.9 + Math.abs(b) * 0.07; hips.rotation.z = Math.sin(T * Math.PI * 2) * 0.12;
        armL.rotation.z = 2.4 + Math.sin(T * Math.PI * 4) * 0.5; armR.rotation.z = -2.4 - Math.sin(T * Math.PI * 4 + 1) * 0.5;
        head.rotation.z = -hips.rotation.z * 0.8; legL.rotation.x = Math.max(0, b) * 0.3; legR.rotation.x = Math.max(0, -b) * 0.3;
      } else if (action === 'laugh') {
        torso.rotation.x = -0.25 + Math.sin(T * 30) * 0.03; head.rotation.x = -0.2; armL.rotation.set(-0.6, 0, 0.5); armR.rotation.set(-0.6, 0, -0.5);
      } else if (action === 'point') { armR.rotation.set(-1.5, 0, -0.1); torso.rotation.x = 0.08; head.rotation.x = Math.sin(T * 9) * 0.05; }
      else if (action === 'sit' || action === 'sitSlam') {
        hips.position.y = 0.55; legL.rotation.x = -Math.PI / 2; legR.rotation.x = -Math.PI / 2; legL.position.y = 0.55; legR.position.y = 0.55;
        armL.rotation.set(-1.1, 0, 0.1); armR.rotation.set(-1.1, 0, -0.1); torso.rotation.x = 0.12;
        if (action === 'sitSlam') {
          // arm at its lowest exactly at each hit time; lifts between hits
          let k = 1;
          for (const h of p.hits || []) { const d = t - h; if (d > -0.18 && d < 0.2) k = Math.min(k, d < 0 ? -d / 0.18 : d / 0.2); }
          armR.rotation.x = -1.0 - 1.6 * ease.outQuad(k); torso.rotation.x = 0.12 + (1 - k) * 0.18; head.rotation.x = (1 - k) * 0.15;
        }
        return;
      }
      legL.position.y = 0.9; legR.position.y = 0.9;
    },
    face(expr) { const tex = faceTexture(skin, expr); if (faceMat.map !== tex) { faceMat.map = tex; faceMat.needsUpdate = true; } },
    setAccessory(name, on) { if (name === 'partyHat') hat.visible = !!on; },
    setPartyHatColor(c) { hat.material = mat(c, { roughness: 0.6 }); },
  };
  ch.pose('idle', 0);
  return ch;
}

export const cast = {
  me: () => stubCharacter('me', { top: '#1d1d22', emblem: '#ffffff' }),
  marcus: () => stubCharacter('marcus', { skin: '#8d5a3b', top: '#ff7a2f', pants: '#2f4d8a', hair: '#1a120c' }),
  brenda: () => stubCharacter('brenda', { skin: '#f4d0b5', top: '#8a5cff', pants: '#8a5cff', hair: '#c0392b' }),
  heckler: () => stubCharacter('heckler', { top: '#3ee0c8', pants: '#33364a', hair: '#f0c419' }),
};

// ───────────────────────────── sets (simple, self-contained) ─────────────────────────────────────────────
function buildDemoTown() {
  const root = new THREE.Group(); root.name = 'demoTown';
  const R = rng(7);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat('#3c8f45')); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 120), mat('#3a3d46')); road.rotation.x = -Math.PI / 2; road.position.y = 0.01; road.receiveShadow = true; root.add(road);
  for (const s of [-1, 1]) { const pv = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 120), mat('#b9b4ad')); pv.position.set(s * 4.7, 0.07, 0); pv.receiveShadow = true; root.add(pv); }
  const walls = ['#e9d8b5', '#c9e4f2', '#f2c4c4', '#d6e8c4', '#f3e3a5', '#cbbfe6'], roofs = ['#b5543f', '#4a5d7e', '#6b4a3a', '#3f7a5a'];
  const winGeo = new THREE.PlaneGeometry(0.9, 1.0);
  const winMat = new THREE.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffb347', emissiveIntensity: 1.6 });
  const houses = [];
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1, z = -30 + Math.floor(i / 2) * 9;
    const hw = 5 + R() * 1.5, hh = 4.6 + R() * 1.2, hd = 5;
    const h = new THREE.Group(); h.position.set(side * (9.5 + hd / 2), 0, z); h.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; root.add(h);
    const body = new THREE.Mesh(rbox(hw, hh, hd, 0.12), mat(walls[i % walls.length])); body.position.y = hh / 2; body.castShadow = body.receiveShadow = true; h.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(hw, hd) * 0.78, 2.4, 4), mat(roofs[i % roofs.length])); roof.position.y = hh + 1.2; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, hd / hw); roof.castShadow = true; h.add(roof);
    for (const [wx, wy] of [[-1.3, hh - 1.4], [1.3, hh - 1.4], [-1.3, 1.6]]) { const wm = new THREE.Mesh(winGeo, winMat); wm.position.set(wx, wy, hd / 2 + 0.01); h.add(wm); }
    const door = new THREE.Mesh(rbox(1.0, 1.9, 0.12, 0.04), mat('#6b4a3a')); door.position.set(1.3, 0.95, hd / 2); h.add(door);
    houses.push(h);
  }
  // zig-zag string lights across the street (instanced emissive bulbs)
  const party = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff'];
  const pts = [];
  for (let k = 0; k < 6; k++) {
    const z0 = -22 + k * 6, a = new THREE.Vector3(-5.6, 5.2, z0), b = new THREE.Vector3(5.6, 5.2, z0 + 3);
    for (let j = 0; j <= 14; j++) { const u = j / 14; const p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * 0.9; pts.push(p); }
  }
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), pts.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  pts.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); bulbs.setMatrixAt(i, m4); bulbs.setColorAt(i, col.set(party[i % party.length])); });
  root.add(bulbs);
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 5.4, 8), mat('#2a2d36'), 12);
  for (let k = 0; k < 6; k++) for (const s of [-1, 1]) { m4.makeTranslation(s * 5.6, 2.7, -22 + k * 6 + (s > 0 ? 3 : 0)); poles.setMatrixAt(k * 2 + (s > 0 ? 1 : 0), m4); }
  poles.castShadow = true; root.add(poles);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(3, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff4cf' })); moon.position.set(-30, 40, -80); root.add(moon);
  const starGeo = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 400; i++) { const th = R() * Math.PI * 2, ph = 0.15 + R() * 1.2; sp.push(Math.cos(th) * Math.cos(ph) * 150, Math.sin(ph) * 150, Math.sin(th) * Math.cos(ph) * 150); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  root.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 1.4, sizeAttenuation: false, fog: false })));
  // lights
  const hemi = new THREE.HemisphereLight('#7f8cff', '#2a3a2a', 1.1); root.add(hemi);
  const moonLight = new THREE.DirectionalLight('#c9d4ff', 1.3); moonLight.position.set(-14, 22, 10); moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024); Object.assign(moonLight.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 }); root.add(moonLight);
  const warm = new THREE.PointLight('#ff9a5a', 30, 22, 1.6); warm.position.set(0, 4.5, -2); root.add(warm);
  const anchors = {};
  const A = (name, x, y, z, ry = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.y = ry; o.name = name; root.add(o); anchors[name] = o; };
  A('street.center', 0, 0, 0); A('street.crowdA', -1.6, 0, -1.5, 0.3); A('street.crowdB', 1.7, 0, -1.0, -0.4); A('street.camHigh', 0, 16, 26);
  const set = {
    root, anchors, background: new THREE.Color('#151a3a'), fog: new THREE.Fog('#1d2250', 28, 110), options: { partyProps: true },
    setLighting(name) { const quiet = name === 'quiet_night'; warm.visible = !quiet; winMat.emissive.set(quiet ? '#9fb4ff' : '#ffb347'); hemi.intensity = quiet ? 0.7 : 1.1; },
    set(k, v) { this.options[k] = v; if (k === 'partyProps') bulbs.visible = poles.visible = !!v; },
    update(t) { // bulbs twinkle — pure function of t
      for (let i = 0; i < pts.length; i++) { const on = 0.55 + 0.45 * Math.sin(t * 5 + i * 1.7); bulbs.setColorAt(i, col.set(party[i % party.length]).multiplyScalar(0.35 + on)); }
      bulbs.instanceColor.needsUpdate = true;
    },
  };
  return set;
}

function buildDemoRoom() {
  const root = new THREE.Group(); root.name = 'demoRoom';
  const floor = new THREE.Mesh(rbox(5, 0.2, 5, 0.04), mat('#b07a4f')); floor.position.y = -0.1; floor.receiveShadow = true; root.add(floor);
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.02, 32), mat('#c94f6d')); rug.position.set(0.3, 0.01, 0.6); rug.receiveShadow = true; root.add(rug);
  const wallM = mat('#5b6bb5');
  const back = new THREE.Mesh(rbox(5, 3.2, 0.2, 0.04), wallM); back.position.set(0, 1.6, -2.5); back.receiveShadow = true; root.add(back);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(rbox(0.2, 3.2, 5, 0.04), wallM); w.position.set(s * 2.5, 1.6, 0); w.receiveShadow = true; root.add(w); }
  // window with party lights outside
  const view = canvasTexture(256, 192, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#151a3a'); grd.addColorStop(1, '#2b2f6b'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const cols = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff']; const R = rng(3);
    for (let i = 0; i < 26; i++) { g.fillStyle = cols[i % 6]; g.globalAlpha = 0.6; g.beginPath(); g.arc(R() * w, 60 + R() * 110, 6 + R() * 12, 0, 7); g.fill(); }
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), new THREE.MeshBasicMaterial({ map: view })); win.position.set(-0.9, 1.85, -2.39); root.add(win);
  const frame = new THREE.Mesh(rbox(1.6, 1.25, 0.08, 0.03), mat('#f5f0e6')); frame.position.set(-0.9, 1.85, -2.42); root.add(frame);
  // desk + chair
  const desk = new THREE.Group(); desk.position.set(0.6, 0, -1.6); root.add(desk);
  const top = new THREE.Mesh(rbox(1.6, 0.08, 0.8, 0.03), mat('#8b5a3c')); top.position.y = 0.74; top.castShadow = top.receiveShadow = true; desk.add(top);
  for (const [x, z] of [[-0.72, -0.32], [0.72, -0.32], [-0.72, 0.32], [0.72, 0.32]]) { const l = new THREE.Mesh(rbox(0.08, 0.72, 0.08, 0.02), mat('#6b4a3a')); l.position.set(x, 0.36, z); l.castShadow = true; desk.add(l); }
  const chair = new THREE.Mesh(rbox(0.5, 0.08, 0.5, 0.03), mat('#3f7a5a')); chair.position.set(0.6, 0.51, -0.75); chair.castShadow = true; root.add(chair);
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 16, 1, true), mat('#ffd23f', { emissive: '#ffb020', emissiveIntensity: 0.6, side: THREE.DoubleSide })); lampShade.position.set(1.2, 1.18, -1.8); root.add(lampShade);
  const shelf = new THREE.Mesh(rbox(1.2, 0.06, 0.3, 0.02), mat('#8b5a3c')); shelf.position.set(1.5, 2.1, -2.33); root.add(shelf);
  for (let i = 0; i < 3; i++) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.22, 12), mat('#ffd23f', { roughness: 0.3, metalness: 0.4 })); tr.position.set(1.15 + i * 0.35, 2.24, -2.33); root.add(tr); }
  // lights
  root.add(new THREE.HemisphereLight('#8a90ff', '#3a2a20', 0.55));
  const lamp = new THREE.PointLight('#ffc070', 9, 8, 1.4); lamp.position.set(1.1, 1.3, -1.5); root.add(lamp);   // no shadow: ≤1 shadow-casting light per set (SPEC §2)
  const spill = new THREE.PointLight('#ff4fa3', 4, 6, 1.5); spill.position.set(-0.9, 1.8, -1.6); root.add(spill);
  const key = new THREE.DirectionalLight('#ffe6c8', 0.9); key.position.set(3, 5, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 15 }); root.add(key);
  const anchors = {};
  const A = (name, x, y, z, ry = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.y = ry; o.name = name; root.add(o); anchors[name] = o; };
  A('room.desk', 0.6, 0.78, -1.6); A('room.chair', 0.6, 0, -0.8, Math.PI); A('room.cam', 0.2, 1.7, 3.6); A('room.camClose', 0.9, 1.25, 0.5);
  return {
    root, anchors, background: new THREE.Color('#0d0f22'), fog: null, options: {},
    setLighting() {}, set() {},
    update(t) { spill.intensity = 3 + 1.5 * Math.sin(t * 6.3) * Math.sin(t * 2.1); },
  };
}

export const sets = { town: () => buildDemoTown(), room: () => buildDemoRoom() };

// ───────────────────────────── props (stored in ctx.props, created once in init) ──────────────────────────
function makeDemoBoard() {
  const root = new THREE.Group();
  const tex = canvasTexture(256, 256, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#b58863' : '#f0d9b5'; g.fillRect(x * 32, y * 32, 32, 32); } });
  const base = new THREE.Mesh(rbox(0.66, 0.04, 0.66, 0.012), mat('#5a3a24')); base.position.y = 0.02; base.castShadow = true; root.add(base);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); face.rotation.x = -Math.PI / 2; face.position.y = 0.041; root.add(face);
  const pieces = [];
  const geo = new THREE.CylinderGeometry(0.022, 0.03, 0.07, 12), headGeo = new THREE.SphereGeometry(0.022, 12, 8);
  for (let i = 0; i < 16; i++) {
    const p = new THREE.Group(); const white = i < 8; const m = mat(white ? '#f5efe0' : '#2a2626', { roughness: 0.5 });
    const b = new THREE.Mesh(geo, m); b.position.y = 0.035; p.add(b); const hd = new THREE.Mesh(headGeo, m); hd.position.y = 0.08; p.add(hd);
    p.userData.home = new THREE.Vector3(-0.2625 + (i % 8) * 0.075, 0.041, white ? 0.19 : -0.19);
    p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    root.add(p); pieces.push(p);
  }
  return {
    root, pieces,
    jump(hits, t) { // every piece hops a little on each HUSS — pure function of t
      pieces.forEach((p, i) => {
        let y = 0;
        for (const h of hits) { const d = t - h - i * 0.006; if (d > 0 && d < 0.3) y = Math.max(y, Math.sin((d / 0.3) * Math.PI) * 0.05); }
        p.position.copy(p.userData.home); p.position.y += y; p.rotation.z = y * 2.2 * (i % 2 ? 1 : -1);
      });
    },
  };
}

export function init(ctx) { ctx.props.board = makeDemoBoard(); }

// ───────────────────────────── shots ─────────────────────────────────────────────────────────────────────
export const shots = [
  {
    name: 'opening crane', start: 'b01', set: 'town', lighting: 'party_night',
    cast: ['marcus', 'brenda', 'heckler'],
    setup(ctx) {
      ctx.place('marcus', 'street.crowdA');
      ctx.place('brenda', 'street.crowdB');
      ctx.place('heckler', 'street.center', { offset: [0.2, 0, -3.2], yaw: 0.2 });
      ctx.cast.heckler.setAccessory('partyHat', true);   // engine restores this at the next shot change
    },
    update(ctx, lt, u) {
      const { marcus, brenda, heckler } = ctx.cast;
      marcus.pose('dance', lt); brenda.pose('dance', lt + 0.37, { speed: 1.1 }); heckler.pose('dance', lt + 0.8);
      marcus.face('grin'); brenda.face('smile'); heckler.face('laugh');
      ctx.cam.move({ pos: 'street.camHigh', look: [0, 1, -4], fov: 46 }, { pos: [1.8, 2.3, 6.5], look: [0, 1.3, -1], fov: 42 }, u, ctx.ease.inOutCubic);
      ctx.cam.shake(0.08, ctx.t, 1);
    },
  },
  {
    name: 'except me', start: 'b02-0.2', set: 'room', cast: ['me'],
    setup(ctx) {
      ctx.place('me', 'room.chair');
      ctx.add(ctx.props.board.root, ctx.anchor('room.desk'));   // parented to the desk anchor, auto-removed later
      ctx.props.board.root.position.set(-0.05, 0, 0.05);
    },
    update(ctx, lt, u) {
      const me = ctx.cast.me;
      me.pose('sit', lt); me.face(lt > 0.6 ? 'determined' : 'neutral');
      ctx.props.board.jump([], ctx.t);
      ctx.cam.move({ pos: 'room.cam', look: [0.5, 1.0, -1.3], fov: 44 }, { pos: [0.4, 1.55, 1.9], look: [0.55, 1.05, -1.3], fov: 38 }, u, 'inOutSine');
      ctx.fx.vignette(0.35);
    },
  },
  {
    name: 'huss grind', start: 'b03-0.25', set: 'room', cast: ['me'],
    setup(ctx) {
      ctx.place('me', 'room.chair');
      ctx.add(ctx.props.board.root, ctx.anchor('room.desk'));
      ctx.props.board.root.position.set(-0.05, 0, 0.05);
      ctx.cam.set({ pos: [1.75, 1.22, 0.15], look: [0.45, 0.95, -1.45], fov: 40 });
    },
    update(ctx, lt) {
      const hits = ctx.hussTimes('b03');
      const me = ctx.cast.me;
      me.pose('sitSlam', ctx.t, { hits });
      const near = hits.some((h) => ctx.t > h - 0.08 && ctx.t < h + 0.22);
      me.face(near ? 'huss' : 'determined');
      ctx.props.board.jump(hits, ctx.t);
      ctx.cam.orbit([0.55, 1.0, -1.25], 1.9, 0.45, 1.1 - lt * 0.08, 36);   // stays inside the room (walls at x = ±2.4)
      ctx.cam.punch(hits, ctx.t, 0.09, 0.22);
      ctx.cam.shake(0.12, ctx.t, 3, 1.5);
      ctx.fx.vignette(0.45);
    },
  },
  {
    name: 'heckler', start: 'b04-0.15', set: 'town', cast: ['heckler', 'marcus', 'brenda'],
    setup(ctx) {
      ctx.set.set('partyProps', false);   // engine restores set options at the next shot change
      ctx.place('heckler', 'street.center', { yaw: -0.25 });
      ctx.place('marcus', 'street.center', { offset: [-1.4, 0, -1.6], yaw: 0.5 });
      ctx.place('brenda', 'street.center', { offset: [1.5, 0, -1.9], yaw: -0.5 });
      ctx.cast.heckler.setAccessory('partyHat', true);
      ctx.cast.heckler.setPartyHatColor('#ffd23f');
    },
    update(ctx, lt) {
      const { heckler, marcus, brenda } = ctx.cast;
      const laughing = ctx.t >= ctx.time('b05');
      heckler.pose(laughing ? 'laugh' : 'point', lt); heckler.face(laughing ? 'laugh' : 'grin');
      marcus.pose(laughing ? 'laugh' : 'idle', lt + 0.2); marcus.face(laughing ? 'laugh' : 'smile');
      brenda.pose(laughing ? 'laugh' : 'idle', lt + 0.5); brenda.face(laughing ? 'laugh' : 'smile');
      ctx.cam.set({ pos: [0.9, 1.75, 3.3], look: [0, 1.45, 0], fov: 36 });
      ctx.cam.shake(0.1, ctx.t, 7);
      ctx.fx.overlay('#000', ctx.progress('b05.end', 9.0));   // fade out at the end
    },
  },
];
