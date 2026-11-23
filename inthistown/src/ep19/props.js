// In This Town — Episode 19 "Battery 1%": props + the custom 'bath' set.
//
// Exports
//   makeEarphones()          on-ear white headphones for a head joint (head-local: band over the top, cups at the ears).
//                            userData.set({ led: '#3cff6b', k: 1 })  LED ring colour / brightness on both cups
//   makeDJBooth()            DJ Noodle's booth (S-frame: +Z toward the audience, floor at y = 0). Two speaker towers at the
//                            sides (they also hide the chess table + throne on the town stage). userData.set(t, { spin, press, glow, beat })
//                            userData.button (Object3D at the top of the big red button)
//   makeNotes(n)             instanced glowing music notes.  begin() / add(pos, { s, rot, c }) / end()
//   makeLoudspeaker()        big grey PA box with black cones + clamps (front = +Z).  userData.set(t, pump)
//   makeSocket()             wall socket box (front = +Z), userData.hole (Object3D where the plug sits)
//   makePlug()               giant glowing plug (prongs along +Z, back = −Z).  userData.set(glow), userData.back (Object3D)
//   makeCable(n)             thick cable through n segments: userData.set(a, b, sag)
//   makeLadder(len, w)       ladder, rails along X, rungs every 0.42 m (base at y = 0)
//   makeShopSign(lines, o)   two-sided sign box (w × h × 0.16) with text on the +Z face
//   makeAwning(w, d, cols)   striped slanted awning (back edge at z = 0, y = 0, slopes down toward +Z)
//   makeCounter()            bakery counter with bread, cakes and a glass case (front = +Z, top at 1.0)
//   makeRulesBoard()         TOWN RULES notice board on two posts (front = +Z, board centre ~2.2 m up)
//   makeHood()               black hood for a head joint (face in shadow) + two glowing green eyes. userData.eyes(k)
//   makeShowerCap()          pastel shower cap for a head joint (fits over the earphones)
//   makeDuck()               yellow rubber duck (~0.3 m)
//   makeBulb()               cartoon light bulb with rays: userData.set(k)  (0 hidden … 1 full)
//   makeSpaceship()          the purple party saucer (centre at origin, radius ≈ 16, underside at y ≈ −2.6).
//                            userData.set(t, { pump, eyes, beams, lights })
//   makeFillerCrowd(n)       instanced blocky dancers for far crowds: layout(list), set(t, opts)
//   makeSparkBurst(n, cols)  deterministic spark burst: userData.set(u) (u = seconds since the burst)
//   makeMoon()               big moon disc with craters + halo
//   makeGrassPatch(w, d)     a small lawn with a few flowers
//   buildBath()              custom set: a tiled shower stall (anchor 'bath.spot' at the floor centre, facing +Z)
import * as THREE from 'three';
import { clamp, ease, hash, lerp, canvasTexture } from '../lib/util.js';
import { std, box, cyl, sph, glowSprite, FONT_T, FONT_D } from '../ep18/props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
function at(parent, o, x = 0, y = 0, z = 0) { o.position.set(x, y, z); parent.add(o); return o; }
function mesh(geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, typeof m === 'string' ? std(m) : m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; }

// ═════════════════════════════════════════════════════════════════════════════ headphones
export function makeEarphones() {
  const g = new THREE.Group(); g.name = 'earphones';
  const white = std('#f4f4f6', { roughness: 0.4 }), pad = std('#3a3b42'), dark = std('#1d1d22');
  const band = mesh(new THREE.TorusGeometry(0.385, 0.042, 8, 28, PI), white, 0, 0.29, 0); g.add(band);
  const cush = mesh(new THREE.TorusGeometry(0.392, 0.03, 6, 16, PI * 0.36), pad, 0, 0.29, 0); cush.rotation.z = PI * 0.32; g.add(cush);
  const ledM = basic('#3cff6b', { toneMapped: false });
  const glows = [];
  for (const sx of [-1, 1]) {
    const cup = new THREE.Group(); cup.position.set(sx * 0.37, 0.27, 0.0); g.add(cup);
    const shell = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 24), white); shell.rotation.z = PI / 2; cup.add(shell);
    const cushion = mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.05, 20), pad, -sx * 0.07, 0, 0); cushion.rotation.z = PI / 2; cup.add(cushion);
    const cap = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), dark, sx * 0.07, 0, 0); cap.rotation.z = PI / 2; cup.add(cap);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 6, 24), ledM); ring.position.x = sx * 0.088; ring.rotation.y = PI / 2; cup.add(ring);
    const gl = glowSprite('#3cff6b', 0.45, 0.8); gl.position.x = sx * 0.12; cup.add(gl); glows.push(gl);
    const yoke = mesh(new THREE.BoxGeometry(0.04, 0.12, 0.06), white, sx * -0.01, 0.13, 0); cup.add(yoke);
  }
  g.userData = {
    set({ led = '#3cff6b', k = 1 } = {}) {
      ledM.color.set(led).multiplyScalar(Math.max(0.08, k));
      glows.forEach((s) => { s.material.color.set(led); s.material.opacity = 0.8 * k; s.visible = k > 0.02; });
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ DJ booth
function boothFrontTex() {
  return canvasTexture(1024, 384, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    ['#ff4fa3', '#8a5cff', '#3ee0c8', '#ffd23f', '#ff4fa3'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c));
    g.fillStyle = '#16131f'; g.fillRect(0, 0, w, h);
    g.fillStyle = gr; g.fillRect(14, 14, w - 28, h - 28);
    g.fillStyle = 'rgba(10,8,20,0.55)'; for (let x = 20; x < w; x += 22) g.fillRect(x, 14, 6, h - 28);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const s = fit(g, 'DJ NOODLE', FONT_D, w * 0.8, 210);
    g.font = FONT_D(s); g.lineWidth = 26; g.strokeStyle = '#16131f'; g.strokeText('DJ NOODLE', w / 2, h / 2 + 10);
    g.fillStyle = '#ffffff'; g.fillText('DJ NOODLE', w / 2, h / 2 + 10);
  });
}
function platterTex(c) {
  return canvasTexture(256, 256, (g, w) => {
    g.fillStyle = '#121216'; g.beginPath(); g.arc(w / 2, w / 2, w / 2, 0, PI * 2); g.fill();
    g.strokeStyle = '#2c2c34'; g.lineWidth = 3; for (let r = 40; r < 124; r += 9) { g.beginPath(); g.arc(w / 2, w / 2, r, 0, PI * 2); g.stroke(); }
    g.fillStyle = c; g.beginPath(); g.arc(w / 2, w / 2, 40, 0, PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(w / 2 - 6, 18, 12, 50);    // marker so the spin reads
    g.fillStyle = '#111'; g.beginPath(); g.arc(w / 2, w / 2, 6, 0, PI * 2); g.fill();
  });
}
export function makeDJBooth() {
  const g = new THREE.Group(); g.name = 'djBooth';
  const W = 2.5, H = 1.05, D = 1.15;
  g.add(box(W, H, D, '#24262e', 0, H / 2, 0, 0.05));
  const ft = boothFrontTex();
  const frontM = new THREE.MeshStandardMaterial({ map: ft, emissive: '#ffffff', emissiveMap: ft, emissiveIntensity: 0.9, roughness: 0.5 });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.12, H - 0.16), frontM); front.position.set(0, H / 2, D / 2 + 0.006); g.add(front);
  g.add(box(W + 0.06, 0.06, D + 0.06, '#121318', 0, H + 0.03, 0, 0.02));
  const ledM = basic('#ff4fa3', { toneMapped: false });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, 0.035, 0.03), ledM); strip.position.set(0, H + 0.02, D / 2 + 0.04); g.add(strip);
  // turntables
  const platters = [];
  for (const sx of [-1, 1]) {
    g.add(box(0.74, 0.08, 0.62, '#3a3d46', sx * 0.72, H + 0.1, -0.05, 0.02));
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 32), [std('#121216'), new THREE.MeshStandardMaterial({ map: platterTex(sx < 0 ? '#ff4fa3' : '#3ee0c8'), roughness: 0.4 }), std('#121216')]);
    pl.position.set(sx * 0.72 - 0.04, H + 0.16, -0.05); pl.castShadow = true; g.add(pl); platters.push(pl);
    const arm = box(0.04, 0.03, 0.34, '#d9d9e0', sx * 0.72 + 0.26, H + 0.2, -0.1); arm.rotation.y = 0.35; g.add(arm);
  }
  // mixer + knobs
  g.add(box(0.46, 0.07, 0.5, '#1a1b22', 0, H + 0.1, -0.12, 0.02));
  ['#ffd23f', '#3ee0c8', '#ff4fa3', '#8a5cff'].forEach((c, i) => { const k = cyl(0.03, 0.03, 0.05, basic(c, { toneMapped: false }), 10); k.position.set(-0.13 + (i % 2) * 0.26, H + 0.16, -0.25 + Math.floor(i / 2) * 0.14); g.add(k); });
  // the big red button (front centre)
  at(g, cyl(0.2, 0.22, 0.08, '#ffd23f', 28), 0, H + 0.1, 0.33);
  const btnM = new THREE.MeshStandardMaterial({ color: '#e8232b', emissive: '#ff1010', emissiveIntensity: 0.6, roughness: 0.35 });
  const btn = cyl(0.15, 0.16, 0.1, btnM, 28); btn.position.set(0, H + 0.18, 0.33); g.add(btn);
  const button = new THREE.Object3D(); button.position.set(0, H + 0.24, 0.33); g.add(button);
  const btnGlow = glowSprite('#ff3030', 0.9, 0.5); btnGlow.position.set(0, H + 0.3, 0.36); g.add(btnGlow);
  // speaker towers (also hide the stage's chess table + throne)
  const rings = [];
  for (const sx of [-1, 1]) {
    const tx = sx * (W / 2 + 0.05);
    g.add(box(0.62, 2.2, 1.2, '#1d1d22', tx, 1.1, 0, 0.05));
    for (const [y, r] of [[0.55, 0.24], [1.25, 0.24], [1.85, 0.14]]) {
      const cone = cyl(r, r * 0.8, 0.08, '#0c0c10', 24); cone.rotation.x = PI / 2; cone.position.set(tx, y, 0.62); g.add(cone);
      const rg = new THREE.Mesh(new THREE.TorusGeometry(r + 0.025, 0.022, 6, 28), basic('#3ee0c8', { toneMapped: false })); rg.position.set(tx, y, 0.64); g.add(rg); rings.push(rg);
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 1.24), ledM); cap.position.set(tx, 2.22, 0); g.add(cap);
  }
  const halo = glowSprite('#c060ff', 4.5, 0.35); halo.position.set(0, 1.0, 0.8); g.add(halo);
  g.userData = {
    button,
    set(t, { spin = 1, press = 0, glow = 1, beat = 0 } = {}) {
      platters.forEach((p, i) => { p.rotation.y = -t * 3.4 * spin * (i ? 1.05 : 1); });
      btn.position.y = H + 0.18 - 0.06 * press; button.position.y = H + 0.24 - 0.06 * press;
      btnM.emissiveIntensity = 0.5 + 1.6 * press + 0.3 * glow * (0.5 + 0.5 * Math.sin(t * 6));
      btnGlow.material.opacity = 0.35 + 0.6 * press;
      frontM.emissiveIntensity = glow * (0.7 + 0.5 * beat);
      const hue = (t * 0.15) % 1;
      ledM.color.setHSL(hue, 1, 0.6);
      rings.forEach((r, i) => { r.material.color.setHSL((hue + i * 0.17) % 1, 1, 0.55); r.scale.setScalar(1 + 0.12 * beat); });
      halo.material.opacity = 0.25 + 0.35 * beat * glow;
    },
  };
  g.userData.set(0);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ music notes
export function makeNotes(n = 40) {
  const g = new THREE.Group(); g.name = 'notes';
  const m = basic('#ffffff', { toneMapped: false, fog: false });
  const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 12, 9), m, n);
  const stem = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 0.46, 0.045).translate(0.13, 0.23, 0), m, n);
  const flag = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.07, 0.045).translate(0.22, 0.43, 0).rotateZ(-0.0), m, n);
  for (const im of [head, stem, flag]) { im.frustumCulled = false; g.add(im); }
  const cols = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#7dff6a', '#4fb3ff'].map((c) => new THREE.Color(c));
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = V(), hs = V(1.15, 0.85, 0.9);
  const Mh = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const c = cols[i % cols.length]; head.setColorAt(i, c); stem.setColorAt(i, c); flag.setColorAt(i, c); }
  let k = 0;
  g.userData = {
    begin() { k = 0; return g.userData; },
    add(p, { s = 1, rot = 0, ci = null } = {}) {
      if (k >= n) return g.userData;
      e.set(0, 0, rot); q.setFromEuler(e); sv.setScalar(s);
      M4.compose(p, q, sv);
      Mh.copy(M4).multiply(new THREE.Matrix4().makeScale(hs.x, hs.y, hs.z));
      head.setMatrixAt(k, Mh); stem.setMatrixAt(k, M4); flag.setMatrixAt(k, M4);
      if (ci != null) { const c = cols[ci % cols.length]; head.setColorAt(k, c); stem.setColorAt(k, c); flag.setColorAt(k, c); }
      k++; return g.userData;
    },
    end() {
      for (const im of [head, stem, flag]) { im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
      g.visible = k > 0; return g.userData;
    },
  };
  g.userData.begin().end();
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ speakers, socket, plug, cable
export function makeLoudspeaker() {
  const g = new THREE.Group(); g.name = 'loudspeaker';
  const grey = '#8a8d96';
  g.add(box(1.35, 1.8, 0.95, grey, 0, 0, 0, 0.08));
  g.add(box(1.2, 1.64, 0.04, '#2a2b31', 0, 0, 0.48, 0.02));
  const woof = new THREE.Group(); woof.position.set(0, -0.32, 0.5); g.add(woof);
  const w1 = cyl(0.48, 0.48, 0.06, '#131317', 28); w1.rotation.x = PI / 2; woof.add(w1);
  const w2 = cyl(0.36, 0.2, 0.12, '#1d1d22', 24); w2.rotation.x = PI / 2; w2.position.z = 0.04; woof.add(w2);
  const dome = sph(0.12, '#2c2c34', 12, 8); dome.position.z = 0.08; woof.add(dome);
  const tw = cyl(0.2, 0.2, 0.06, '#131317', 20); tw.rotation.x = PI / 2; tw.position.set(0, 0.5, 0.5); g.add(tw);
  const twd = sph(0.08, '#3a3b42', 10, 6); twd.position.set(0, 0.5, 0.54); g.add(twd);
  // clamps (arms that hook back over the parapet)
  for (const sx of [-0.45, 0.45]) { g.add(box(0.12, 0.12, 1.6, '#4a4d56', sx, 0.95, -0.4)); g.add(box(0.12, 0.5, 0.12, '#4a4d56', sx, 0.75, -1.15)); }
  const glowM = basic('#5dff6a', { toneMapped: false, transparent: true, opacity: 0.9 });
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 6, 32), glowM); led.position.set(0, -0.32, 0.53); g.add(led);
  g.userData = {
    set(t, pump = 0, on = 1) {
      const b = pump * Math.max(0, Math.sin(t * 2 * PI * 2.1));
      woof.scale.set(1 + 0.06 * b, 1 + 0.06 * b, 1 + 1.4 * b);
      glowM.opacity = 0.9 * on; led.visible = on > 0.02;
    },
  };
  return g;
}
export function makeSocket() {
  const g = new THREE.Group(); g.name = 'socket';
  g.add(box(0.95, 0.85, 0.42, '#d6d2c8', 0, 0.425, 0, 0.06));
  g.add(box(0.75, 0.66, 0.04, '#f2efe6', 0, 0.45, 0.22, 0.03));
  for (const sx of [-0.13, 0.13]) g.add(mesh(new THREE.BoxGeometry(0.07, 0.2, 0.02), '#1d1d22', sx, 0.47, 0.24));
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.12), new THREE.MeshBasicMaterial({ map: canvasTexture(512, 128, (c, w, h) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d1d22'; c.textAlign = 'center'; c.textBaseline = 'middle'; fit(c, '⚡ 10,000 V ⚡', FONT_T, w * 0.9, 80); c.fillText('⚡ 10,000 V ⚡', w / 2, h / 2 + 4); }) }));
  lbl.position.set(0, 0.8, 0.215); g.add(lbl);
  const hole = new THREE.Object3D(); hole.position.set(0, 0.47, 0.25); g.add(hole);
  g.userData = { hole };
  return g;
}
export function makePlug() {
  const g = new THREE.Group(); g.name = 'plug';
  const bodyM = new THREE.MeshStandardMaterial({ color: '#2a2b31', emissive: '#39ff5a', emissiveIntensity: 0.0, roughness: 0.45 });
  const body = mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), bodyM, 0, 0, -0.3); g.add(body);
  const stripeM = basic('#5dff6a', { toneMapped: false });
  for (const z of [-0.18, -0.42]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.06), stripeM); s.position.set(0, 0, z); g.add(s); }
  for (const sx of [-0.13, 0.13]) { const p = cyl(0.035, 0.035, 0.32, '#d9d9e0', 10); p.rotation.x = PI / 2; p.position.set(sx, 0, 0.14); g.add(p); }
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 14).rotateX(PI / 2), '#1d1d22', 0, 0, -0.68));
  const back = new THREE.Object3D(); back.position.set(0, 0, -0.76); g.add(back);
  const glow = glowSprite('#5dff6a', 1.6, 0.6); glow.position.set(0, 0, -0.3); g.add(glow);
  g.userData = {
    back,
    set(k = 1) { bodyM.emissiveIntensity = 0.65 * k; stripeM.color.set('#5dff6a').multiplyScalar(Math.max(0.1, k)); glow.material.opacity = 0.6 * k; glow.visible = k > 0.02; },
  };
  g.userData.set(1);
  return g;
}
export function makeCable(n = 10, r = 0.07) {
  const g = new THREE.Group(); g.name = 'cable';
  const geo = new THREE.CylinderGeometry(r, r, 1, 8).translate(0, 0.5, 0);
  const m = std('#141418', { roughness: 0.6 });
  const segs = Array.from({ length: n }, () => { const s = new THREE.Mesh(geo, m); s.castShadow = true; g.add(s); return s; });
  const _a = V(), _b = V(), _d = V(), Y = V(0, 1, 0);
  g.userData = {
    /** a, b: points in the cable's PARENT space (put the group at the origin of that space). */
    set(a, b, sag = 0.6) {
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n;
        _a.copy(a).lerp(b, u0); _a.y -= sag * 4 * u0 * (1 - u0);
        _b.copy(a).lerp(b, u1); _b.y -= sag * 4 * u1 * (1 - u1);
        _d.copy(_b).sub(_a); const L = _d.length();
        segs[i].position.copy(_a); segs[i].quaternion.setFromUnitVectors(Y, _d.normalize()); segs[i].scale.set(1, L + r, 1);
      }
    },
  };
  return g;
}
export function makeLadder(len = 17.6, w = 0.78) {
  const g = new THREE.Group(), wood = std('#c98a4b', { roughness: 0.7 });
  for (const s of [-1, 1]) g.add(box(0.1, len, 0.12, wood, s * w / 2, len / 2, 0));
  const n = Math.floor((len - 0.3) / 0.42);
  const rung = new THREE.InstancedMesh(new THREE.BoxGeometry(w, 0.06, 0.07), std('#b8783c'), n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation(0, 0.3 + i * 0.42, 0); rung.setMatrixAt(i, m4); }
  rung.castShadow = true; g.add(rung);
  g.userData = { rungStep: 0.42, len };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ shop dressing
function signTex(lines, { w = 1024, h = 320, bg = '#ffd23f', fg = '#1d1d22', border = '#1d1d22' } = {}) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = 20; g.strokeRect(10, 10, w - 20, h - 20); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, i) => { fit(g, l, FONT_D, w * 0.84, Math.floor(h / lines.length * 0.7)); g.fillText(l, w / 2, h * (i + 0.5) / lines.length + 6); });
  });
}
export function makeShopSign(lines, { w = 3.2, h = 0.9, bg = '#ffd23f', fg = '#1d1d22', border = '#1d1d22', glow = 0.25 } = {}) {
  const g = new THREE.Group();
  const tex = signTex(lines, { w: 1024, h: Math.round(1024 * h / w), bg, fg, border });
  const face = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: glow, roughness: 0.6 });
  const side = std(border || '#1d1d22');
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), [side, side, side, side, face, side]); b.castShadow = true; g.add(b);
  return g;
}
export function makeAwning(w = 3.4, d = 1.3, c1 = '#e8232b', c2 = '#ffffff') {
  const tex = canvasTexture(512, 128, (g, W, H) => { const n = 8; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.fillRect(i * W / n, 0, W / n + 1, H); } });
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide });
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), m); top.position.set(0, -d * 0.25, d / 2); top.rotation.x = 0.5; top.castShadow = true; g.add(top);
  const val = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, 0.04), m); val.position.set(0, -d * 0.48 - 0.14, d * 0.92); val.castShadow = true; g.add(val);
  return g;
}
export function makeCounter() {
  const g = new THREE.Group(); g.name = 'counter';
  g.add(box(2.4, 0.96, 0.7, '#f3e3a5', 0, 0.48, 0, 0.04));
  g.add(box(2.5, 0.06, 0.8, '#8a5a2e', 0, 0.99, 0, 0.02));
  const ft = signTex(['FRESH BREAD'], { w: 1024, h: 200, bg: '#ff9ec6', fg: '#7a1f2b', border: null });
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.4), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.7 })); fp.position.set(0, 0.58, 0.356); g.add(fp);
  const loaf = new THREE.CapsuleGeometry(0.09, 0.22, 4, 10).rotateZ(PI / 2);
  for (let i = 0; i < 4; i++) { const l = mesh(loaf, '#c98a3b', -1.0 + i * 0.2, 1.1, -0.15 + (i % 2) * 0.12); l.rotation.y = 0.3 * (i - 1.5); g.add(l); }
  // cake on a stand
  at(g, cyl(0.05, 0.05, 0.12, '#e8e8f0', 12), 0.15, 1.08, 0);
  at(g, cyl(0.2, 0.2, 0.03, '#e8e8f0', 20), 0.15, 1.15, 0);
  at(g, cyl(0.17, 0.17, 0.14, '#ff9ec6', 20), 0.15, 1.24, 0);
  at(g, cyl(0.175, 0.175, 0.03, '#ffffff', 20), 0.15, 1.32, 0);
  at(g, sph(0.04, '#e8232b', 10, 8), 0.15, 1.36, 0);
  // glass case with cupcakes
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.38, 0.5), new THREE.MeshStandardMaterial({ color: '#cfefff', transparent: true, opacity: 0.25, roughness: 0.05 }));
  glass.position.set(0.8, 1.21, 0); g.add(glass);
  ['#ffd23f', '#8a5cff', '#3ee0c8', '#ff4fa3'].forEach((c, i) => { at(g, cyl(0.06, 0.05, 0.07, '#c98a3b', 10), 0.6 + (i % 2) * 0.3, 1.07, -0.1 + Math.floor(i / 2) * 0.2); at(g, sph(0.065, c, 10, 8), 0.6 + (i % 2) * 0.3, 1.13, -0.1 + Math.floor(i / 2) * 0.2); });
  return g;
}
export function makeRulesBoard() {
  const g = new THREE.Group(); g.name = 'rules';
  const tex = canvasTexture(1024, 1280, (c, w, h) => {
    c.fillStyle = '#fff4dc'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8232b'; c.fillRect(0, 0, w, 270);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ffffff'; fit(c, 'TOWN RULES', FONT_D, w * 0.86, 190); c.fillText('TOWN RULES', w / 2, 145);
    const rows = [['1', 'ALWAYS WEAR', 'HEADPHONES'], ['2', 'NEVER', 'HUM'], ['3', 'NEVER LOOK A', 'DANCER IN THE EYES']];
    rows.forEach(([n, a, b], i) => {
      const y = 420 + i * 300;
      c.fillStyle = '#1d1d22'; c.beginPath(); c.arc(130, y, 80, 0, PI * 2); c.fill();
      c.fillStyle = '#ffd23f'; c.font = FONT_D(120); c.fillText(n, 130, y + 8);
      c.fillStyle = '#1d1d22'; c.textAlign = 'left';
      fit(c, a, FONT_D, w - 290, 86); c.fillText(a, 240, y - 50);
      fit(c, b, FONT_D, w - 290, 86); c.fillText(b, 240, y + 50);
      c.textAlign = 'center';
    });
    c.strokeStyle = '#1d1d22'; c.lineWidth = 24; c.strokeRect(12, 12, w - 24, h - 24);
  });
  const face = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.18, roughness: 0.7 });
  const side = std('#7d5232');
  const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.75, 0.12), [side, side, side, side, face, side]); b.position.y = 2.35; b.castShadow = true; g.add(b);
  for (const s of [-1, 1]) g.add(box(0.14, 3.7, 0.14, '#7d5232', s * 0.95, 1.85, -0.1));
  g.add(box(2.5, 0.16, 0.36, '#b5543f', 0, 3.8, 0, 0.03));
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ wearables
export function makeHood() {
  const g = new THREE.Group(); g.name = 'hood';
  const m = std('#0d0d12', { roughness: 0.9 });
  g.add(box(0.8, 0.8, 0.08, m, 0, 0.32, -0.33, 0.03));
  g.add(box(0.8, 0.09, 0.74, m, 0, 0.7, 0.0, 0.03));
  for (const s of [-1, 1]) g.add(box(0.09, 0.82, 0.78, m, s * 0.375, 0.31, 0.02, 0.03));
  g.add(box(0.8, 0.12, 0.1, m, 0, 0.64, 0.37, 0.03));       // brim (shades the face)
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.6), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.82 }));
  shade.position.set(0, 0.3, 0.295); g.add(shade);
  const eyeM = basic('#7dff6a', { toneMapped: false });
  const eyes = [], glows = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), eyeM); e.scale.set(1.3, 0.75, 0.6); e.position.set(s * 0.13, 0.33, 0.31); g.add(e); eyes.push(e);
    const gl = glowSprite('#5dff6a', 0.42, 0.9); gl.position.set(s * 0.13, 0.33, 0.34); g.add(gl); glows.push(gl);
  }
  g.userData = { eyes(k = 1) { eyeM.color.set('#7dff6a').multiplyScalar(Math.max(0.05, k)); glows.forEach((s) => { s.material.opacity = 0.9 * k; }); } };
  return g;
}
export function makeShowerCap() {
  const tex = canvasTexture(256, 128, (c, w, h) => { c.fillStyle = '#ffb3d9'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(hash(i * 1.7) * w, hash(i * 3.1) * h, 7, 0, PI * 2); c.fill(); } });
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
  const g = new THREE.Group(); g.name = 'showerCap';
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.47, 24, 12, 0, PI * 2, 0, PI / 2), m); dome.scale.set(1.04, 0.82, 0.95); dome.position.y = 0.3; dome.castShadow = true; g.add(dome);
  const frill = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.05, 8, 32), std('#ff8fc6')); frill.rotation.x = PI / 2; frill.scale.set(1.04, 0.95, 1); frill.position.y = 0.3; g.add(frill);
  return g;
}
export function makeDuck() {
  const g = new THREE.Group(); g.name = 'duck';
  const y = std('#ffd23f', { roughness: 0.4 });
  const body = sph(0.13, y, 16, 12); body.scale.set(1.25, 0.85, 1); g.add(body);
  const head = sph(0.085, y, 14, 10); head.position.set(0.09, 0.13, 0); g.add(head);
  const beak = box(0.08, 0.035, 0.07, '#ff7a2f', 0.18, 0.12, 0); g.add(beak);
  for (const s of [-1, 1]) { const e = sph(0.015, '#1d1d22', 8, 6); e.position.set(0.14, 0.16, s * 0.05); g.add(e); }
  const tail = box(0.06, 0.06, 0.06, y, -0.15, 0.06, 0); tail.rotation.z = 0.6; g.add(tail);
  return g;
}
export function makeBulb() {
  const g = new THREE.Group(); g.name = 'bulb';
  const glassM = new THREE.MeshStandardMaterial({ color: '#fff3a0', emissive: '#ffd23f', emissiveIntensity: 1.6, roughness: 0.3 });
  const bulb = mesh(new THREE.SphereGeometry(0.24, 20, 14), glassM, 0, 0.12, 0); g.add(bulb);
  const neck = mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.12, 16), glassM, 0, -0.1, 0); g.add(neck);
  const base = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 16), '#9a9da6', 0, -0.22, 0); g.add(base);
  for (const y of [-0.17, -0.22, -0.27]) g.add(mesh(new THREE.TorusGeometry(0.112, 0.012, 4, 16).rotateX(PI / 2), '#6e7078', 0, y, 0));
  const fil = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 4, 12, PI), basic('#ff9a2a', { toneMapped: false })); fil.position.set(0, 0.1, 0); g.add(fil);
  const rays = new THREE.Group(); g.add(rays);
  const rm = basic('#ffe14a', { toneMapped: false });
  for (let i = 0; i < 9; i++) { const a = -PI * 0.1 + (i / 8) * PI * 1.2; const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), rm); r.position.set(Math.cos(a) * 0.42, 0.12 + Math.sin(a) * 0.42, 0); r.rotation.z = a - PI / 2; rays.add(r); }
  const glow = glowSprite('#ffe27a', 1.8, 0.8); glow.position.y = 0.12; g.add(glow);
  g.userData = {
    set(k) {
      g.visible = k > 0.001; const s = Math.max(0.001, k);
      bulb.scale.setScalar(1); g.scale.setScalar(s);
      rays.scale.setScalar(0.6 + 0.4 * clamp(k, 0, 1.3)); glow.material.opacity = 0.8 * clamp(k, 0, 1);
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ the spaceship
function hullTex() {
  return canvasTexture(1024, 128, (c, w, h) => {
    c.fillStyle = '#6a2fd0'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#5321b0'; for (let x = 0; x < w; x += 64) c.fillRect(x, 0, 6, h);
    c.fillStyle = '#8a5cff'; c.fillRect(0, h * 0.12, w, 8); c.fillRect(0, h * 0.82, w, 8);
  });
}
export function makeSpaceship() {
  const g = new THREE.Group(); g.name = 'spaceship';
  const R = 16;
  const hullM = new THREE.MeshStandardMaterial({ color: '#7a3cff', map: hullTex(), roughness: 0.45, metalness: 0.2, emissive: '#3a1080', emissiveIntensity: 0.35 });
  const darkM = std('#3a1a7a', { roughness: 0.5, emissive: '#1a0840', emissiveIntensity: 0.3 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 2.0, 64, 1), hullM); g.add(rim);
  const topSlope = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.62, R, 1.6, 64), hullM); topSlope.position.y = 1.8; g.add(topSlope);
  const under = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.45, 2.2, 64), darkM); under.position.y = -2.1; g.add(under);
  const ringM = std('#ffd23f', { roughness: 0.4, emissive: '#ff9a00', emissiveIntensity: 0.4 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(R + 0.15, 0.4, 8, 72), ringM); band.rotation.x = PI / 2; band.position.y = -1.25; g.add(band);
  // glass dome with a soft glow inside
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R * 0.5, 32, 16, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ color: '#9ef5ff', emissive: '#3ee0c8', emissiveIntensity: 0.35, transparent: true, opacity: 0.55, roughness: 0.05 }));
  dome.position.y = 2.6; g.add(dome);
  const domeGlow = glowSprite('#9ef5ff', 14, 0.35); domeGlow.position.y = 5; g.add(domeGlow);
  // ring of glowing lights around the rim
  const NL = 28, lights = [];
  const lgeo = new THREE.SphereGeometry(0.5, 12, 8);
  const lcols = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#7dff6a'];
  for (let i = 0; i < NL; i++) {
    const a = (i / NL) * PI * 2;
    const m = new THREE.Mesh(lgeo, basic(lcols[i % 4], { toneMapped: false })); m.position.set(Math.cos(a) * (R + 0.35), -1.25, Math.sin(a) * (R + 0.35)); g.add(m); lights.push(m);
  }
  // portholes with green eyes on the rim side
  const NP = 18, eyeM = basic('#7dff6a', { toneMapped: false }), eyeGlows = [];
  const portM = std('#1a0a33', { roughness: 0.3 }), frameM = std('#d9d9e0', { roughness: 0.3, metalness: 0.5 });
  for (let i = 0; i < NP; i++) {
    const a = ((i + 0.5) / NP) * PI * 2, n = V(Math.cos(a), 0, Math.sin(a));
    const p = new THREE.Group(); p.position.copy(n).multiplyScalar(R + 0.02); p.position.y = 0.25; p.lookAt(n.clone().multiplyScalar(R + 10).setY(0.25)); p.scale.setScalar(0.85); g.add(p);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), portM); disc.position.z = 0.02; p.add(disc);
    const fr = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.12, 6, 24), frameM); fr.position.z = 0.04; p.add(fr);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), eyeM); e.scale.set(1.3, 0.7, 0.5); e.position.set(s * 0.28, 0.05, 0.1); p.add(e); }
    const gl = glowSprite('#5dff6a', 2.6, 0.9); gl.position.z = 0.3; p.add(gl); eyeGlows.push(gl);
  }
  // four giant speakers on top
  const woofers = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2 + PI / 4, n = V(Math.cos(a), 0, Math.sin(a));
    const s = new THREE.Group(); s.position.copy(n).multiplyScalar(R * 0.72); s.position.y = 4.0; s.lookAt(n.clone().multiplyScalar(R * 2).setY(4.0)); g.add(s);
    s.add(box(4.2, 5.2, 3.0, '#1d1d22', 0, 0, 0, 0.2));
    for (const [y, r] of [[-1.0, 1.5], [1.6, 0.75]]) {
      const w = new THREE.Group(); w.position.set(0, y, 1.52); s.add(w);
      const c = cyl(r, r, 0.2, '#0c0c10', 28); c.rotation.x = PI / 2; w.add(c);
      const rg = new THREE.Mesh(new THREE.TorusGeometry(r + 0.08, 0.1, 6, 28), basic('#ff4fa3', { toneMapped: false })); rg.position.z = 0.1; w.add(rg);
      const d = sph(r * 0.3, '#2c2c34', 12, 8); d.position.z = 0.15; w.add(d);
      woofers.push(w);
    }
  }
  // mirror ball under the middle
  const ballGeo = new THREE.IcosahedronGeometry(3.2, 2).toNonIndexed();
  const cols = []; const cc = new THREE.Color();
  for (let i = 0; i < ballGeo.attributes.position.count / 3; i++) { const h = hash(i * 1.37); cc.set(h > 0.85 ? '#ffffff' : h > 0.6 ? '#d8c8ff' : h > 0.3 ? '#9a8ac8' : '#6a5a98'); for (let k = 0; k < 3; k++) cols.push(cc.r, cc.g, cc.b); }
  ballGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const ball = new THREE.Mesh(ballGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  ball.position.y = -6.0; g.add(ball);
  at(g, cyl(0.12, 0.12, 2.0, '#d9d9e0', 6), 0, -4.0, 0);
  const ballGlow = glowSprite('#e8d8ff', 12, 0.45); ballGlow.position.y = -6; g.add(ballGlow);
  // light beams from the underside
  const beamM = new THREE.MeshBasicMaterial({ color: '#ff6ad8', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const beams = [];
  for (let i = 0; i < 6; i++) {
    const piv = new THREE.Group(); const a = (i / 6) * PI * 2; piv.position.set(Math.cos(a) * 8, -3.0, Math.sin(a) * 8); g.add(piv);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 5, 30, 20, 1, true).translate(0, -15, 0), beamM.clone()); piv.add(cone);
    cone.material.color.set(['#ff6ad8', '#7dff6a', '#6ad8ff'][i % 3]); beams.push(piv);
  }
  const under2 = glowSprite('#c060ff', 40, 0.5); under2.position.y = -4; g.add(under2);
  g.userData = {
    set(t, { pump = 1, eyes = 0, beams: bk = 1, lights: lk = 1 } = {}) {
      lights.forEach((m, i) => { const on = (Math.floor(t * 8) + i) % 4 === 0 ? 1 : 0.35; m.scale.setScalar(0.8 + 0.4 * on * lk); m.material.color.set(lcols[(i + Math.floor(t * 4)) % 4]).multiplyScalar(0.4 + 0.6 * lk * on + 0.2); });
      const b = Math.max(0, Math.sin(t * 2 * PI * 2.15));
      woofers.forEach((w, i) => { const s = 1 + 0.18 * pump * b; w.scale.set(s, s, 1 + 1.5 * pump * b); });
      eyeM.color.set('#7dff6a').multiplyScalar(Math.max(0.02, eyes)); eyeGlows.forEach((s) => { s.material.opacity = Math.min(1, 1.1 * eyes); s.visible = eyes > 0.02; });
      beams.forEach((p, i) => { p.rotation.set(0.35 * Math.sin(t * 1.1 + i), 0, 0.35 * Math.cos(t * 0.9 + i * 1.7)); p.children[0].material.opacity = 0.16 * bk; p.visible = bk > 0.01; });
      ball.rotation.y = t * 0.8; ballGlow.material.opacity = 0.3 + 0.2 * Math.sin(t * 7);
      domeGlow.material.opacity = 0.3 + 0.15 * b * pump;
    },
  };
  g.userData.set(0);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ far crowd
const PANTS = ['#2f4d8a', '#3a3d46', '#55575e', '#7a6a58', '#1d1d22', '#4a7a4a'];
const SHIRTS = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff', '#5bd65b', '#ff5a5a', '#f2f2f2', '#ffa6d1'];
const SKIN = ['#f1c7a1', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#f4d0b5', '#a86b4a'];
const HAIR = ['#1a120c', '#3b2416', '#7a4a24', '#c0392b', '#e8c46a', '#111111', '#d97b2b'];
/** Instanced blocky dancers.  layout([{ x, y?, z, yaw, k }]) in the crowd's parent space, then set(t, opts) every frame.
 *  opts: { arms: 'dance'|'up'|'catch'|'cheer'|'limp', bounce = 1, flop = 0 | (i) => 0..1, speed = 1, shades = false } */
export function makeFillerCrowd(n = 260) {
  const g = new THREE.Group(); g.name = 'fillerCrowd';
  const m = new THREE.MeshStandardMaterial({ roughness: 0.75 });
  const mk = (geo) => { const im = new THREE.InstancedMesh(geo, m, n); im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; g.add(im); return im; };
  const legs = mk(new THREE.BoxGeometry(0.4, 0.86, 0.24).translate(0, 0.43, 0));
  const torso = mk(new THREE.BoxGeometry(0.54, 0.62, 0.32).translate(0, 1.17, 0));
  const head = mk(new THREE.BoxGeometry(0.56, 0.5, 0.5).translate(0, 1.76, 0));
  const hair = mk(new THREE.BoxGeometry(0.6, 0.16, 0.54).translate(0, 2.05, -0.02));
  const shades = mk(new THREE.BoxGeometry(0.5, 0.12, 0.04).translate(0, 1.8, 0.26));
  const armL = mk(new THREE.BoxGeometry(0.15, 0.62, 0.17).translate(0, -0.28, 0));
  const armR = mk(new THREE.BoxGeometry(0.15, 0.62, 0.17).translate(0, -0.28, 0));
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    legs.setColorAt(i, c.set(PANTS[Math.floor(hash(i * 1.3) * PANTS.length)]));
    const sh = SHIRTS[Math.floor(hash(i * 2.7) * SHIRTS.length)];
    torso.setColorAt(i, c.set(sh)); armL.setColorAt(i, c.set(sh)); armR.setColorAt(i, c.set(sh));
    head.setColorAt(i, c.set(SKIN[Math.floor(hash(i * 3.9) * SKIN.length)]));
    hair.setColorAt(i, c.set(HAIR[Math.floor(hash(i * 5.1) * HAIR.length)]));
    shades.setColorAt(i, c.set('#111111'));
  }
  let list = [];
  const B = new THREE.Matrix4(), P = new THREE.Matrix4(), T1 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s = V(1, 1, 1), one = V(1, 1, 1);
  const Z = new THREE.Matrix4().makeScale(0, 0, 0);
  g.userData = {
    layout(l) { list = l.slice(0, n); return g.userData; },
    set(t, { arms = 'dance', bounce = 1, flop = 0, speed = 1, shades: sh = false, scale = 1 } = {}) {
      const N = list.length;
      for (let i = 0; i < n; i++) {
        if (i >= N) { for (const im of [legs, torso, head, hair, shades, armL, armR]) im.setMatrixAt(i, Z); continue; }
        const it = list[i], k = it.k ?? i, ph = hash(k * 7.7) * 6, w = (t * speed * 2 * PI * 1.05) + ph;
        const fk = typeof flop === 'function' ? flop(i, it) : flop;
        const by = bounce * 0.09 * Math.abs(Math.sin(w)) * (1 - fk);
        e.set(-fk * PI / 2 * 0.98, it.yaw, bounce * 0.12 * Math.sin(w * 0.5) * (1 - fk), 'YXZ'); q.setFromEuler(e);
        p.set(it.x, (it.y || 0) + by + fk * 0.15, it.z); s.setScalar((it.s || 1) * scale);
        B.compose(p, q, s);
        for (const im of [legs, torso, head, hair]) im.setMatrixAt(i, B);
        shades.setMatrixAt(i, sh ? B : Z);
        let aL, aR, zL = -0.15, zR = 0.15;
        if (arms === 'up') { aL = -2.8 + 0.25 * Math.sin(w + 1); aR = -2.8 + 0.25 * Math.sin(w + 2.2); zL = -0.25; zR = 0.25; }
        else if (arms === 'catch') { aL = -2.35 + 0.08 * Math.sin(w); aR = -2.35 + 0.08 * Math.sin(w + 1); zL = -0.1; zR = 0.1; }
        else if (arms === 'cheer') { aL = -2.6 + 0.4 * Math.sin(w * 1.6); aR = -2.6 + 0.4 * Math.sin(w * 1.6 + PI); zL = -0.45; zR = 0.45; }
        else if (arms === 'limp') { aL = -0.1; aR = -0.1; zL = -0.5; zR = 0.5; }
        else { const sw = Math.sin(w); aL = sw > 0 ? -2.7 * sw : -0.4 * sw; aR = sw < 0 ? 2.7 * sw : 0.4 * sw; }
        for (const [im, ax, az, sx] of [[armL, aL, zL, -0.35], [armR, aR, zR, 0.35]]) {
          e.set(ax, 0, az, 'XYZ'); q.setFromEuler(e);
          T1.compose(p.set(sx, 1.42, 0), q, one);
          P.multiplyMatrices(B, T1); im.setMatrixAt(i, P);
        }
      }
      for (const im of [legs, torso, head, hair, shades, armL, armR]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
      return g.userData;
    },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ sparks, moon, lawn
export function makeSparkBurst(n = 46, cols = ['#d4ffb0', '#7dff6a', '#3cff6b', '#ffffff'], { speed = 1, size = 0.035 } = {}) {
  const g = new THREE.Group(), list = [];
  const geo = new THREE.BoxGeometry(size, size, size * 5);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, basic(cols[i % cols.length], { toneMapped: false, fog: false })); g.add(m);
    const a = hash(i * 1.3) * PI * 2, el = (hash(i * 2.7) - 0.25) * 1.6;
    list.push({ m, v: V(Math.cos(a) * Math.cos(el), Math.sin(el) + 0.3, Math.sin(a) * Math.cos(el)).multiplyScalar((1.5 + 3.5 * hash(i * 4.1)) * speed), life: 0.35 + 0.55 * hash(i * 5.3) });
  }
  const flash = glowSprite(cols[1], 2.4, 1); g.add(flash);
  const _d = V();
  g.userData = {
    set(u) {
      g.visible = u > 0 && u < 1.0;
      if (!g.visible) return;
      list.forEach((p) => {
        const k = clamp(u / p.life, 0, 1); p.m.visible = k < 1;
        p.m.position.set(p.v.x * u, p.v.y * u - 4.9 * u * u, p.v.z * u);
        _d.set(p.v.x, p.v.y - 9.8 * u, p.v.z).normalize(); p.m.lookAt(p.m.position.clone().add(_d));
        p.m.scale.setScalar(1.6 * (1 - k));
      });
      flash.material.opacity = clamp(1 - u * 3.5, 0, 1); flash.scale.setScalar(1 + u * 5);
    },
  };
  g.userData.set(0);
  return g;
}
export function makeMoon() {
  const g = new THREE.Group(); g.name = 'moon';
  const tex = canvasTexture(512, 512, (c, w) => {
    const gr = c.createRadialGradient(w * 0.42, w * 0.4, 30, w / 2, w / 2, w / 2); gr.addColorStop(0, '#fffdf0'); gr.addColorStop(1, '#d8dcf0');
    c.fillStyle = gr; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 2, 0, PI * 2); c.fill();
    c.fillStyle = 'rgba(150,155,190,0.45)';
    for (let i = 0; i < 14; i++) { const a = hash(i * 2.3) * PI * 2, r = hash(i * 3.7) * w * 0.36; c.beginPath(); c.arc(w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r, 14 + 34 * hash(i * 5.1), 0, PI * 2); c.fill(); }
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, toneMapped: false }));
  g.add(disc);
  const halo = glowSprite('#dfe6ff', 4.2, 0.55); halo.position.z = -0.05; g.add(halo);
  return g;
}
export function makeGrassPatch(w = 5, d = 3.4) {
  const g = new THREE.Group();
  g.add(box(w, 0.08, d, '#4caf50', 0, 0.04, 0, 0.03));
  const fl = ['#ff4fa3', '#ffd23f', '#ffffff', '#8a5cff'];
  for (let i = 0; i < 14; i++) { const f = sph(0.06, fl[i % 4], 8, 6); f.position.set((hash(i * 1.7) - 0.5) * (w - 0.4), 0.12, (hash(i * 3.3) - 0.5) * (d - 0.4)); g.add(f); }
  for (let i = 0; i < 3; i++) { const b = sph(0.42, '#3c8f45', 12, 8); b.scale.set(1.2, 0.8, 1); b.position.set(-w / 2 + 0.5 + i * 0.5, 0.3, -d / 2 + 0.4); g.add(b); }
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ the shower set
function tileTex() {
  return canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#e8f6ff'; c.fillRect(0, 0, w, h);
    const n = 8, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { c.fillStyle = (x + y) % 5 === 0 ? '#9fdcf5' : '#d4f0ff'; c.fillRect(x * s + 3, y * s + 3, s - 6, s - 6); }
  });
}
export function buildBath() {
  const root = new THREE.Group(); root.name = 'bath';
  const anchors = {};
  const tt = tileTex(); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(2, 2);
  const tileM = new THREE.MeshStandardMaterial({ map: tt, roughness: 0.25 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), tileM); back.position.set(0, 2, -0.9); back.receiveShadow = true; root.add(back);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), tileM); w.position.set(s * 1.3, 2, 0.6); w.rotation.y = -s * PI / 2; w.receiveShadow = true; root.add(w); }
  root.add(box(2.6, 0.12, 2.4, '#bfe8f8', 0, 0.06, 0.3, 0.03));
  // shower head + pipe
  at(root, cyl(0.035, 0.035, 0.9, std('#d9d9e0', { metalness: 0.7, roughness: 0.25 }), 10), 0, 2.8, -0.85);
  const arm = cyl(0.035, 0.035, 0.6, std('#d9d9e0', { metalness: 0.7, roughness: 0.25 }), 10); arm.rotation.x = PI / 2; arm.position.set(0, 3.2, -0.6); root.add(arm);
  const head = cyl(0.26, 0.16, 0.12, std('#d9d9e0', { metalness: 0.7, roughness: 0.25 }), 20); head.position.set(0, 3.1, -0.32); head.rotation.x = 0.3; root.add(head);
  // shelf with bottles
  root.add(box(0.7, 0.05, 0.22, '#ffffff', 0.85, 1.5, -0.78, 0.01));
  ['#ff4fa3', '#3ee0c8', '#ffd23f'].forEach((c, i) => { root.add(box(0.13, 0.3 - i * 0.04, 0.1, c, 0.62 + i * 0.22, 1.67 - i * 0.02, -0.76, 0.03)); });
  // curtain on the left, bunched
  const ctex = canvasTexture(256, 256, (c, w, h) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff7a2f'; for (let i = 0; i < 24; i++) { c.beginPath(); c.arc(hash(i * 1.9) * w, hash(i * 2.9) * h, 12, 0, PI * 2); c.fill(); } });
  const curM = new THREE.MeshStandardMaterial({ map: ctex, roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.1, 0.06), curM); p.position.set(-1.05 + (i % 2) * 0.06, 1.75, -0.6 + i * 0.32); p.rotation.y = 0.6 * (i % 2 ? 1 : -1); root.add(p); }
  at(root, cyl(0.025, 0.025, 2.8, '#d9d9e0', 8), -1.05, 3.32, 0.5).rotation.x = PI / 2;
  // water streaks (instanced)
  const NW = 140;
  const water = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.32, 0.012), basic('#e6f8ff', { transparent: true, opacity: 0.6 }), NW); water.frustumCulled = false; root.add(water);
  // bubbles
  const NB = 18;
  const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.45, emissive: '#bfe8ff', emissiveIntensity: 0.3 }), NB); bub.frustumCulled = false; root.add(bub);
  // steam
  const steam = [];
  for (let i = 0; i < 7; i++) { const s = glowSprite('#ffffff', 1.6, 0.18); s.material.blending = THREE.NormalBlending; root.add(s); steam.push(s); }
  // lights
  root.add(new THREE.HemisphereLight('#ffffff', '#9fc8e0', 1.4));
  const key = new THREE.DirectionalLight('#fff4e0', 2.0); key.position.set(1.5, 4, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); root.add(key); root.add(key.target);
  const pl = new THREE.PointLight('#ffe8f0', 6, 8, 1.4); pl.position.set(0, 2.6, 1.6); root.add(pl);
  const spot = new THREE.Object3D(); spot.position.set(0, 0.12, 0.2); root.add(spot); anchors['bath.spot'] = spot;
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), s = V(1, 1, 1);
  return {
    root, anchors, background: new THREE.Color('#bfe6ff'), fog: null, options: {},
    set() {}, setLighting() {},
    update(t) {
      for (let i = 0; i < NW; i++) {
        const u = (hash(i * 1.31) + t * (1.8 + 0.6 * hash(i * 2.7))) % 1;
        const a = hash(i * 3.7) * PI * 2, r = 0.25 * Math.sqrt(hash(i * 5.3)) + u * 0.45 * hash(i * 6.1);
        p.set(Math.cos(a) * r, 3.0 - u * 3.0, -0.25 + Math.sin(a) * r * 0.8 + u * 0.35);
        M4.compose(p, q, s); water.setMatrixAt(i, M4);
      }
      water.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NB; i++) {
        const u = (hash(i * 2.1) + t * (0.08 + 0.06 * hash(i * 4.4))) % 1;
        p.set((hash(i * 3.3) - 0.5) * 2.0 + 0.2 * Math.sin(t + i), 0.6 + u * 2.6, -0.4 + hash(i * 5.7) * 1.4);
        const r = 0.04 + 0.07 * hash(i * 6.6);
        M4.compose(p, q, V(r, r, r)); bub.setMatrixAt(i, M4);
      }
      bub.instanceMatrix.needsUpdate = true;
      steam.forEach((st, i) => { const u = (hash(i * 1.7) + t * 0.07) % 1; st.position.set((hash(i * 2.9) - 0.5) * 2.2, 1.2 + u * 2.4, -0.3 + hash(i * 4.1) * 1.0); st.scale.setScalar(1.2 + 1.4 * u); st.material.opacity = 0.2 * Math.sin(PI * u); });
    },
  };
}
