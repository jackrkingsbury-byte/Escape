// Episode 21 ("The Deep Above") props.  Same conventions as src/props.js (SPEC.md §2/§7): ES module, metres, Y up,
// deterministic (no Math.random / clocks); everything animated is a pure function of the t / k passed in.
//
// ── Exports ─────────────────────────────────────────────────────────────────────────────────────
//   SEA_Y                         height of the upside-down sea's lower surface above the town (town-local)
//   makeSea({ w, seg })           Group: the huge rippling water ceiling (custom shader, faces down, origin = centre of
//        the surface).  userData.set(t, { deep, shallow, light, glow, opacity, flare, flarePos(local Vector3), flareR, amp })
//   makeShafts(n, { area, h })    Group: n soft additive light shafts hanging down from the sea.  userData.set(t, k)
//   makeBubbles(n, { w, h, d })   Group: rising bubbles in a box (origin = bottom centre).  userData.set(t, k)
//   makeDeepLayers(ys, w)         Group: stacked faint blue planes between the sea and the far town (water depth).  set(k)
//   makeMotes(n, { w, h, d })     Group: drifting glowing plankton specks (origin = centre).  userData.set(t, k)
//   makeFish({ body, fin, belly, glow })  Group: one blocky fish facing +Z (≈1.1 long).  userData.set(t, { wag, mouth, look })
//   makeSchool(n, { len, spread }) Group: instanced school of small blocky fish swimming along +Z.  userData.set(t, { speed, k })
//   makeSardines(n, { w, d, top, bottom })  Group: instanced falling sardines in a box.  userData.set(t, { rate, k })
//   makeBonkSardine()             Mesh: one sardine (for scripted bounces)
//   makePan()                     Group: frying pan, origin = handle grip, pan along +Z, cooking face up (+Y)
//   makeRulesBoard()              Group: the three-rules board for the stage (≈3.8 × 3.6 m, origin = ground centre,
//        faces +Z).  userData.set(k1, k2, k3)  each 0 (hidden) … 1 (stamped on); stamp = scale 1.9 → 1
//   makeTricorn(), makeEyepatch() pirate bits to parent on joints.head (head-local)
//   makeRod()                     Group: fishing rod, origin = grip, rod along +Z.  userData.set(bend 0..1) ; userData.tip
//   makeLine(color)               Mesh: unit thin cylinder; stretchLine(mesh, a, b) puts it between two world points
//   makeTorch()                   Group: flashlight, origin = grip centre, beam along +Z.  userData.set(on, len, width)
//   makeDeepOne()                 Group: the mountain-sized creature (unit ≈ 1 m body radius; scale it ~16).
//        Eye on the underside looking down/forward.  userData.set(t, { lid, lookX, lookY, glow, coil, reach, sway, tentOn })
//        userData.eyeWorld()
//   makeCurveTentacle(nSeg)       Group: one long tentacle laid along a CatmullRom path.  userData.setPath(pts, r0, r1, t)
//        (pts in the group's local frame, r0 base radius, r1 tip radius) ; userData.tip() (local Vector3)
//   makeHedge()                   Group: a chunky hedge (≈3.2 × 1.3 × 1.2), origin = ground centre
//   makeKidWindow(wall)           Group: an open bedroom window bay + the porch roof below it.  Origin = on the wall plane,
//        bay floor level; +Z out of the wall.  userData: { roofAt(z) → y of the roof top at distance z from the wall,
//        roofEnd (z of the gutter), sill (y), glow(set k) }
//   makeUpsideTown()              Group in UPRIGHT local coords (flip it with rotation.x = π): two rows of small houses with
//        glowing windows + a mini clock tower.  userData.hero = { pos (local floor point inside the hero window bay), yaw }
//        userData.set(t, k) window flicker
//   makeLampGlows(points)         Group of warm glow sprites (one per lamp head).  userData.set(t, k, flicker)
//   makeStars(n)                  Group: little yellow stars circling a head (stunned).  userData.set(t, k)
//   makeLeafBurst(n)              Group: leaves bursting out of the hedge.  userData.set(u 0..1)
//   makeDingStar()                Group: a comic impact star (bonk!).  userData.set(u 0..1)
//   glowSprite (re-export)
import * as THREE from 'three';
import { clamp, lerp, hash, canvasTexture, smooth, ease, rng } from '../lib/util.js';
import { makeTentacles, shape, baseMatrix, glowSprite, glowTex } from '../ep16/props.js';

export { glowSprite };
export const SEA_Y = 21;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const FONTD = (s) => `${s}px "ITT World Display", "Luckiest Guy", Impact, "DejaVu Sans", sans-serif`;
const FONTW = (s) => `900 ${s}px "ITT World Text", "Nunito", "DejaVu Sans", Arial, sans-serif`;
const _mats = new Map();
function std(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!_mats.has(k)) _mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o }));
  return _mats.get(k);
}
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'string' ? std(m) : m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function cyl(rt, rb, h, m, seg = 16) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function sph(r, m, ws = 16, hs = 12) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), typeof m === 'string' ? std(m) : m); o.castShadow = true; return o; }
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = V(), _p = V(), _e = new THREE.Euler(), _c = new THREE.Color();

// ═══════════════════════════════════════════════════════════════════════════════ the sea ceiling
const SEA_VS = /* glsl */`
  uniform float uTime, uAmp;
  varying vec3 vW;
  #include <fog_pars_vertex>
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    float h = sin(w.x * 0.09 + uTime * 0.7) * 0.5 + sin(w.z * 0.12 - uTime * 0.55) * 0.4 + sin((w.x + w.z) * 0.05 + uTime * 0.3) * 0.6;
    w.y += h * uAmp;
    vW = w.xyz;
    vec4 mvPosition = viewMatrix * w;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const SEA_FS = /* glsl */`
  uniform float uTime, uGlow, uOpacity, uFlare, uFlareR, uCaus;
  uniform vec3 uDeep, uShallow, uLight, uFlarePos;
  varying vec3 vW;
  #include <fog_pars_fragment>
  float lines(vec2 p, float t) {
    float a = sin(p.x * 1.7 + sin(p.y * 1.3 + t) * 1.5 + t) * sin(p.y * 1.9 + sin(p.x * 1.1 - t * 0.8) * 1.5 - t * 0.7);
    return pow(1.0 - abs(a), 7.0);
  }
  void main() {
    float t = uTime * 0.55;
    vec2 p = vW.xz * 0.16;
    float c = lines(p, t) * 0.75 + lines(p * 1.9 + vec2(3.1, 1.7), t * 1.3) * 0.45;
    float fade = 1.0 - smoothstep(35.0, 110.0, distance(cameraPosition, vW));
    c *= uCaus * mix(0.18, 1.0, fade);
    float patchy = 0.5 + 0.5 * sin(vW.x * 0.021 + t * 0.25) * sin(vW.z * 0.027 - t * 0.2);
    vec3 col = mix(uDeep, uShallow, 0.25 + 0.55 * patchy);
    col += uLight * c * 0.85;
    col *= uGlow;
    float d = length(vW.xz - uFlarePos.xz);
    col += uLight * uFlare * (exp(-d / uFlareR) * 2.2 + exp(-d / (uFlareR * 7.0)) * 0.3);
    gl_FragColor = vec4(col, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;
/** the sea surface's wave offset (world y) at world x, z — same formula as the vertex shader */
export function seaWave(x, z, t, amp = 1) { return (Math.sin(x * 0.09 + t * 0.7) * 0.5 + Math.sin(z * 0.12 - t * 0.55) * 0.4 + Math.sin((x + z) * 0.05 + t * 0.3) * 0.6) * amp; }
export function makeSea({ w = 900, seg = 96 } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(w, w, seg, seg); geo.rotateX(PI / 2);   // normal → −Y (faces the town)
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uAmp: { value: 1 }, uGlow: { value: 1 }, uCaus: { value: 1 }, uOpacity: { value: 0.96 }, uFlare: { value: 0 }, uFlareR: { value: 6 },
    uDeep: { value: new THREE.Color('#1f6fc0') }, uShallow: { value: new THREE.Color('#5fd8f0') }, uLight: { value: new THREE.Color('#e8ffff') },
    uFlarePos: { value: V() },
  }]);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: SEA_VS, fragmentShader: SEA_FS, side: THREE.DoubleSide, transparent: true, fog: true, depthWrite: true });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'seaSurface'; g.add(mesh);
  const u = uniforms;
  g.userData = {
    mesh, mat,
    set(t, o = {}) {
      u.uTime.value = t;
      u.uAmp.value = o.amp ?? 1;
      u.uGlow.value = o.glow ?? 1;
      u.uCaus.value = o.caus ?? 1;
      u.uOpacity.value = o.opacity ?? 0.96;
      u.uFlare.value = o.flare ?? 0; u.uFlareR.value = o.flareR ?? 6;
      if (o.deep) u.uDeep.value.set(o.deep);
      if (o.shallow) u.uShallow.value.set(o.shallow);
      if (o.light) u.uLight.value.set(o.light);
      if (o.flarePos) { g.updateMatrixWorld(true); u.uFlarePos.value.copy(o.flarePos); }
    },
  };
  return g;
}
let _shaftTex = null;
const shaftTex = () => _shaftTex ??= canvasTexture(64, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
/** n soft light shafts hanging down from y = 0 (place the group at the sea surface). area = [w, d] spread. */
export function makeShafts(n = 12, { area = [80, 26], h = 19, color = '#bff4ff' } = {}) {
  const g = new THREE.Group(), list = [];
  for (let i = 0; i < n; i++) {
    const rt = 0.6 + 1.2 * hash(i * 2.3), rb = rt * (2.2 + hash(i * 4.1));
    const geo = new THREE.CylinderGeometry(rt, rb, h * (0.75 + 0.35 * hash(i * 5.5)), 18, 1, true); geo.translate(0, -geo.parameters.height / 2, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: shaftTex(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, opacity: 0.1 }));
    m.position.set((hash(i * 1.7) - 0.5) * area[0], 0.3, (hash(i * 3.9) - 0.5) * area[1]);
    m.renderOrder = 5; g.add(m); list.push(m);
  }
  g.userData = {
    list,
    set(t, k = 1) {
      list.forEach((m, i) => {
        m.material.opacity = k * (0.07 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.6 + i * 1.9)));
        m.rotation.z = 0.08 * Math.sin(t * 0.25 + i); m.rotation.x = 0.06 * Math.cos(t * 0.21 + i * 1.3);
      });
      g.visible = k > 0.001;
    },
  };
  return g;
}
export function makeBubbles(n = 120, { w = 40, h = 20, d = 16, color = '#dff6ff' } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, emissive: '#7fd8ff', emissiveIntensity: 0.5, roughness: 0.15, transparent: true, opacity: 0.55, depthWrite: false });
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), mat, n); im.frustumCulled = false; im.renderOrder = 4; g.add(im);
  g.userData = {
    set(t, k = 1) {
      mat.opacity = 0.55 * k; g.visible = k > 0.001;
      for (let i = 0; i < n; i++) {
        const sp = 0.35 + 0.5 * hash(i * 7.3);
        const u = (hash(i * 1.1) + t * sp / h) % 1;
        const r = (0.06 + 0.16 * hash(i * 3.7)) * Math.min(1, u * 8, (1 - u) * 10);
        _p.set((hash(i * 2.9) - 0.5) * w + 0.25 * Math.sin(t * 1.3 + i), u * h, (hash(i * 5.1) - 0.5) * d + 0.25 * Math.cos(t * 1.1 + i * 2));
        _m.compose(_p, _q.identity(), _s.set(r, r * (0.9 + 0.1 * Math.sin(t * 6 + i)), r)); im.setMatrixAt(i, _m);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}
export function makeDeepLayers(ys = [30, 42, 56, 72, 90], w = 700, color = '#0d4f86') {
  const g = new THREE.Group(), list = [];
  ys.forEach((y, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w).rotateX(PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.y = y; m.renderOrder = 1; g.add(m); list.push(m);
  });
  g.userData = { list, set(k = 1, col = null) { list.forEach((m) => { m.material.opacity = 0.13 * k; if (col) m.material.color.set(col); }); g.visible = k > 0.001; } };
  return g;
}
export function makeMotes(n = 60, { w = 30, h = 12, d = 30, color = '#9ffff0', size = 0.09 } = {}) {
  const g = new THREE.Group();
  const mat = basic(color, { toneMapped: false, transparent: true, fog: false });
  const im = new THREE.InstancedMesh(new THREE.OctahedronGeometry(size, 0), mat, n); im.frustumCulled = false; g.add(im);
  g.userData = {
    set(t, k = 1) {
      mat.opacity = k; g.visible = k > 0.001;
      for (let i = 0; i < n; i++) {
        const u = (hash(i * 1.3) + t * (0.02 + 0.03 * hash(i * 7.7))) % 1;
        _p.set((hash(i * 2.1) - 0.5) * w + 0.6 * Math.sin(t * 0.5 + i), (u - 0.5) * h, (hash(i * 4.4) - 0.5) * d + 0.6 * Math.cos(t * 0.4 + i));
        const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 2.3), sc = (0.5 + tw) * Math.sin(PI * u);
        _m.compose(_p, _q.setFromEuler(_e.set(0, t + i, 0)), _s.set(sc, sc, sc)); im.setMatrixAt(i, _m);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════ fish
/** One blocky fish facing +Z, ≈1.1 long, origin at the body centre. */
export function makeFish({ body = '#ff8a2a', fin = '#ffd23f', belly = '#ffe0b0', glow = false, stripe = '#ffffff' } = {}) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const bm = std(body, { roughness: 0.55 }), fm = std(fin, { roughness: 0.55 });
  inner.add(box(0.5, 0.56, 0.86, bm, 0, 0, 0));
  inner.add(box(0.42, 0.46, 0.2, bm, 0, -0.01, 0.48));                                          // snout
  const bel = box(0.44, 0.1, 0.76, glow ? new THREE.MeshStandardMaterial({ color: belly, emissive: belly, emissiveIntensity: 0.55, roughness: 0.4 }) : std(belly), 0, -0.29, 0.02); inner.add(bel);
  for (const z of [-0.12, 0.16]) inner.add(box(0.52, 0.5, 0.06, std(stripe, { roughness: 0.6 }), 0, 0.01, z));
  const dorsal = box(0.08, 0.26, 0.38, fm, 0, 0.38, -0.05); dorsal.rotation.x = -0.25; inner.add(dorsal);
  const tail = new THREE.Group(); tail.position.set(0, 0, -0.43); inner.add(tail);
  const tc = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.42, 4), fm); tc.rotation.x = -PI / 2; tc.rotation.y = PI / 4; tc.scale.set(0.35, 1, 1); tc.position.z = -0.2; tc.castShadow = true; tail.add(tc);
  const sideFins = [];
  for (const s of [-1, 1]) { const f = new THREE.Group(); f.position.set(s * 0.26, -0.08, 0.12); inner.add(f); const m = box(0.22, 0.04, 0.16, fm, s * 0.1, 0, 0); f.add(m); sideFins.push(f); }
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * 0.25, 0.1, 0.3); inner.add(e);
    const w = sph(0.13, basic('#ffffff'), 14, 10); w.scale.set(0.6, 1, 1); e.add(w);
    const p = sph(0.075, basic('#111116'), 12, 8); p.position.set(s * 0.06, 0, 0.03); p.scale.set(0.6, 1, 1); e.add(p);
    const gl = sph(0.025, basic('#ffffff'), 8, 6); gl.position.set(s * 0.1, 0.04, 0.06); e.add(gl);
    eyes.push({ e, p });
  }
  const mouth = box(0.2, 0.06, 0.04, basic('#5a1a12'), 0, -0.12, 0.585); inner.add(mouth);
  g.userData = {
    inner, tail, eyes, belly: bel,
    set(t, { wag = 1, mouth: mo = 0, look = 0, speed = 1 } = {}) {
      tail.rotation.y = wag * 0.5 * Math.sin(t * 7 * speed);
      inner.rotation.y = -wag * 0.06 * Math.sin(t * 7 * speed);
      sideFins.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * (0.3 + 0.25 * Math.sin(t * 5 + i)); });
      mouth.scale.y = 1 + 2.5 * clamp(mo, 0, 1) * (0.5 + 0.5 * Math.sin(t * 6));
      eyes.forEach(({ p }, i) => { p.position.z = 0.03 + 0.04 * look; p.position.x = (i ? 1 : -1) * 0.06 + 0.03 * look * (i ? -1 : 1); });
    },
  };
  g.userData.set(0);
  return g;
}
/** Instanced school of small blocky fish (length ≈ 0.55) streaming along +Z over `len` metres. */
export function makeSchool(n = 36, { len = 40, spread = [8, 3, 6], cols = ['#ff8a2a', '#3ee0c8', '#ffd23f', '#ff5a7a', '#4fb3ff'] } = {}) {
  const g = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(0.26, 0.3, 0.46);
  const tailGeo = new THREE.ConeGeometry(0.18, 0.24, 4); tailGeo.rotateX(-PI / 2); tailGeo.rotateZ(PI / 4); tailGeo.scale(0.4, 1, 1); tailGeo.translate(0, 0, -0.12);
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 6), pupGeo = new THREE.SphereGeometry(0.035, 6, 5);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, emissive: '#000000' });
  const bodies = new THREE.InstancedMesh(bodyGeo, mat, n), tails = new THREE.InstancedMesh(tailGeo, mat, n);
  const eyesW = new THREE.InstancedMesh(eyeGeo, basic('#ffffff'), n * 2), pups = new THREE.InstancedMesh(pupGeo, basic('#111116'), n * 2);
  for (const m of [bodies, tails, eyesW, pups]) { m.frustumCulled = false; g.add(m); }
  bodies.castShadow = true;
  for (let i = 0; i < n; i++) { _c.set(cols[i % cols.length]); bodies.setColorAt(i, _c); tails.setColorAt(i, _c.multiplyScalar(0.85)); }
  const M = new THREE.Matrix4(), T = new THREE.Matrix4(), R = new THREE.Matrix4(), O = new THREE.Matrix4();
  g.userData = {
    set(t, { speed = 2.2, k = 1, wave = 1 } = {}) {
      g.visible = k > 0.001;
      for (let i = 0; i < n; i++) {
        const along = ((hash(i * 1.37) * len + t * speed * (0.85 + 0.3 * hash(i * 9.1))) % len) - len / 2;
        const x = (hash(i * 2.71) - 0.5) * spread[0] + 0.4 * Math.sin(t * 0.8 + i) * wave;
        const y = (hash(i * 4.13) - 0.5) * spread[1] + 0.3 * Math.sin(t * 1.1 + i * 2) * wave;
        const z = along + (hash(i * 6.7) - 0.5) * spread[2];
        const s = (0.8 + 0.5 * hash(i * 3.3)) * Math.min(1, (len / 2 - Math.abs(along)) / 2);
        const yaw = 0.15 * Math.sin(t * 7 + i);
        M.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, yaw, 0)), _s.set(s, s, s));
        bodies.setMatrixAt(i, M);
        T.makeTranslation(0, 0, -0.22); R.makeRotationY(0.6 * Math.sin(t * 9 + i * 1.3)); O.multiplyMatrices(M, T).multiply(R); tails.setMatrixAt(i, O);
        for (const sd of [-1, 1]) {
          const j = i * 2 + (sd > 0 ? 1 : 0);
          T.makeTranslation(sd * 0.13, 0.05, 0.13); O.multiplyMatrices(M, T); eyesW.setMatrixAt(j, O);
          T.makeTranslation(sd * 0.16, 0.05, 0.15); O.multiplyMatrices(M, T); pups.setMatrixAt(j, O);
        }
      }
      for (const m of [bodies, tails, eyesW, pups]) m.instanceMatrix.needsUpdate = true;
    },
  };
  g.userData.set(0);
  return g;
}
export function makeSardines(n = 260, { w = 24, d = 16, top = 16, bottom = 0 } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#f4f8ff', metalness: 0.35, roughness: 0.18, emissive: '#a9c4dc', emissiveIntensity: 0.75 });
  const tailM = new THREE.MeshStandardMaterial({ color: '#cfdcea', metalness: 0.3, roughness: 0.3, emissive: '#7f9ab4', emissiveIntensity: 0.6 });
  const bodyGeo = new THREE.BoxGeometry(0.07, 0.05, 0.19);
  const tailGeo = new THREE.ConeGeometry(0.055, 0.09, 4); tailGeo.rotateX(-PI / 2); tailGeo.rotateZ(PI / 4); tailGeo.scale(0.35, 1, 1); tailGeo.translate(0, 0, -0.13);
  const backGeo = new THREE.BoxGeometry(0.075, 0.02, 0.17); backGeo.translate(0, 0.03, 0.005);
  const eyeGeo = new THREE.BoxGeometry(0.076, 0.018, 0.018); eyeGeo.translate(0, 0.008, 0.065);
  const im = new THREE.InstancedMesh(bodyGeo, mat, n), it = new THREE.InstancedMesh(tailGeo, tailM, n);
  const ib = new THREE.InstancedMesh(backGeo, new THREE.MeshStandardMaterial({ color: '#2f5f8f', roughness: 0.3, metalness: 0.3, emissive: '#1a3a5a', emissiveIntensity: 0.5 }), n);
  const ie = new THREE.InstancedMesh(eyeGeo, basic('#111116'), n);
  for (const m of [im, it, ib, ie]) { m.frustumCulled = false; m.castShadow = m !== ie; g.add(m); }
  const H = top - bottom;
  g.userData = {
    set(t, { k = 1, fall = 9 } = {}) {
      g.visible = k > 0.001;
      for (let i = 0; i < n; i++) {
        const u = (hash(i * 1.9) + t * fall * (0.8 + 0.4 * hash(i * 5.3)) / H) % 1;
        const show = hash(i * 8.8) < k;
        _p.set((hash(i * 2.3) - 0.5) * w, top - u * H, (hash(i * 3.1) - 0.5) * d);
        const sc = show ? 1.45 : 0;
        // nose down (≈ −Y), wiggling, spinning slowly about the vertical
        _m.compose(_p, _q.setFromEuler(_e.set(0.75 + 0.3 * Math.sin(t * 9 + i), hash(i * 4.4) * 6.28 + t * (1 + hash(i)), 0.5 * Math.sin(t * 13 + i * 2), 'YXZ')), _s.set(sc, sc, sc));
        im.setMatrixAt(i, _m); it.setMatrixAt(i, _m); ib.setMatrixAt(i, _m); ie.setMatrixAt(i, _m);
      }
      for (const m of [im, it, ib, ie]) m.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}
export function makeBonkSardine() {
  const g = new THREE.Group();
  g.add(box(0.08, 0.05, 0.24, new THREE.MeshStandardMaterial({ color: '#f4f8ff', metalness: 0.35, roughness: 0.18, emissive: '#a9c4dc', emissiveIntensity: 0.75 })));
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 4), std('#aeb8c2')); tail.rotation.x = -PI / 2; tail.position.z = -0.15; g.add(tail);
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════ hand props
export function makePan() {
  const g = new THREE.Group();
  const iron = std('#1f1f26', { roughness: 0.35, metalness: 0.35 });
  const handle = box(0.06, 0.05, 0.36, std('#9a5a2a', { roughness: 0.6 }), 0, 0, 0.05); g.add(handle);
  g.add(box(0.035, 0.03, 0.12, iron, 0, 0.005, 0.27));
  const pan = new THREE.Group(); pan.position.set(0, 0.0, 0.53); g.add(pan);
  const outer = cyl(0.26, 0.22, 0.07, iron, 28); pan.add(outer);
  const inner = cyl(0.225, 0.225, 0.01, std('#8a8a9a', { roughness: 0.22, metalness: 0.5 }), 28); inner.position.y = 0.032; pan.add(inner);
  const shine = cyl(0.07, 0.07, 0.012, basic('#e8eef8'), 16); shine.position.set(-0.07, 0.036, -0.06); shine.scale.set(1, 1, 0.5); pan.add(shine);
  g.userData = { pan, faceCenter: V(0, 0.04, 0.53) };
  return g;
}
function lineTex(lines, { w = 1024, h = 220, bg = null, fg = '#fff4d6', stroke = '#1d1d22', font = FONTD } = {}) {
  return canvasTexture(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    lines.forEach((l, i) => {
      const s = fit(g, l, font, w * 0.92, Math.floor(h / lines.length * 0.78));
      const y = h * (i + 0.5) / lines.length + s * 0.06;
      g.lineWidth = s * 0.16; g.strokeStyle = stroke; g.strokeText(l, w / 2, y);
      g.fillStyle = fg; g.fillText(l, w / 2, y);
    });
  });
}
export function makeRulesBoard() {
  const g = new THREE.Group();
  const W = 3.8, H = 3.3, y0 = 1.2;
  for (const s of [-1, 1]) g.add(box(0.18, y0 + H, 0.18, '#6b4a2f', s * (W / 2 + 0.05), (y0 + H) / 2, -0.06));
  g.add(box(W + 0.3, H + 0.3, 0.12, '#d9a93a', 0, y0 + H / 2, -0.08));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: canvasTexture(512, 448, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#173a6e'); gr.addColorStop(1, '#0d2244'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,230,160,0.5)'; c.lineWidth = 6; c.strokeRect(14, 14, w - 28, h - 28);
    for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(120,200,255,${0.05 + 0.04 * (i % 2)})`; c.beginPath(); c.arc(w * hash(i * 2.2), h * hash(i * 3.3), 30 + 40 * hash(i), 0, PI * 2); c.fill(); }
  }), roughness: 0.8, emissive: '#0d2244', emissiveIntensity: 0.4 }));
  panel.position.set(0, y0 + H / 2, 0); g.add(panel);
  const head = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, 0.62), new THREE.MeshBasicMaterial({ map: lineTex(['THE RULES'], { w: 1024, h: 200, fg: '#ffd23f' }), transparent: true }));
  head.position.set(0, y0 + H - 0.42, 0.01); g.add(head);
  const specs = [
    [['1. NEVER THROW', 'ANYTHING UP'], '#fff4d6'],
    [['2. NEVER SWIM UP'], '#fff4d6'],
    [['3. NEVER SHINE A LIGHT', 'INTO THE DEEP'], '#ff6a5a'],
  ];
  const rows = specs.map(([lines, fg], i) => {
    const hh = lines.length > 1 ? 0.78 : 0.5;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.9, hh), new THREE.MeshBasicMaterial({ map: lineTex(lines, { w: 1024, h: lines.length > 1 ? 300 : 180, fg }), transparent: true, depthWrite: false }));
    m.position.set(0, y0 + H - [1.12, 1.82, 2.55][i], 0.02); m.renderOrder = 3; g.add(m);
    return m;
  });
  g.userData = {
    rows,
    set(...ks) {
      rows.forEach((m, i) => {
        const k = clamp(ks[i] ?? 0, 0, 1);
        m.visible = k > 0;
        const s = lerp(1.9, 1, ease.outCubic(k)); m.scale.set(s, s, 1);
        m.material.opacity = clamp(k * 3, 0, 1);
        m.rotation.z = (1 - k) * (i % 2 ? 0.2 : -0.2);
      });
    },
  };
  g.userData.set(0, 0, 0);
  return g;
}
export function makeTricorn() {
  const g = new THREE.Group();
  const felt = std('#1d1a24', { roughness: 0.8 }), gold = std('#d9a93a', { roughness: 0.4, metalness: 0.3 });
  const crown = box(0.5, 0.24, 0.46, felt, 0, 0.12, 0); g.add(crown);
  for (let i = 0; i < 3; i++) {
    const a = i * PI * 2 / 3 + PI;   // one point at the front
    const side = new THREE.Group(); side.rotation.y = a + PI / 3; g.add(side);
    const b = box(0.78, 0.22, 0.06, felt, 0, 0.1, 0.3); b.rotation.x = -0.35; side.add(b);
    const tr = box(0.8, 0.03, 0.07, gold, 0, 0.21, 0.27); tr.rotation.x = -0.35; side.add(tr);
  }
  const badge = sph(0.06, basic('#f4f0e0'), 10, 8); badge.position.set(0, 0.16, 0.26); badge.scale.z = 0.4; g.add(badge);
  return g;
}
export function makeEyepatch() {
  const g = new THREE.Group();
  const patch = box(0.17, 0.15, 0.03, std('#111114', { roughness: 0.6 }), 0, 0, 0); g.add(patch);
  const strap = box(0.72, 0.035, 0.02, std('#111114'), 0.05, 0.05, -0.005); strap.rotation.z = 0.32; g.add(strap);
  return g;
}
/** Fishing rod (grip at origin, rod along +Z). userData.set(bend 0..1) bends it downward; userData.tip = Object3D at the tip. */
export function makeRod() {
  const g = new THREE.Group();
  const wood = std('#6b4a2f', { roughness: 0.6 }), cork = std('#c8955a'), metal = std('#c0c4cc', { metalness: 0.5, roughness: 0.3 });
  const grip = cyl(0.035, 0.035, 0.32, cork, 10); grip.rotation.x = PI / 2; grip.position.z = 0; g.add(grip);
  const reel = cyl(0.07, 0.07, 0.05, metal, 16); reel.rotation.z = PI / 2; reel.position.set(0, -0.07, 0.08); g.add(reel);
  const segs = []; let parent = g, z0 = 0.16;
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Group(); s.position.z = i ? 0.55 : z0; parent.add(s);
    const r0 = 0.022 - i * 0.004, r1 = r0 - 0.004;
    const c = cyl(r1, r0, 0.56, i % 2 ? wood : std('#3a2a1c'), 8); c.rotation.x = PI / 2; c.position.z = 0.28; s.add(c);
    const ring = cyl(0.012, 0.012, 0.01, metal, 8); ring.rotation.x = PI / 2; ring.position.set(0, -0.025, 0.5); s.add(ring);
    segs.push(s); parent = s;
  }
  const tip = new THREE.Object3D(); tip.position.z = 0.56; segs[3].add(tip);
  g.userData = { tip, set(bend = 0) { segs.forEach((s, i) => { s.rotation.x = bend * (0.12 + 0.18 * i); }); } };
  return g;
}
export function makeLine(color = '#f4f4ff', r = 0.012) {
  const geo = new THREE.CylinderGeometry(r, r, 1, 6); geo.translate(0, 0.5, 0);
  const m = new THREE.Mesh(geo, basic(color, { toneMapped: false })); m.frustumCulled = false;
  return m;
}
/** place a makeLine() mesh between world points a and b (mesh must be parented to the scene / an unrotated parent). */
export function stretchLine(m, a, b) {
  const d = _p.copy(b).sub(a), L = d.length();
  m.position.copy(a);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  m.scale.set(1, Math.max(1e-3, L), 1);
}
let _beamTex = null;
const beamTex = () => _beamTex ??= canvasTexture(64, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,250,225,0)'); gr.addColorStop(0.6, 'rgba(255,250,225,0.45)'); gr.addColorStop(1, 'rgba(255,250,225,1)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
export function makeTorch() {
  const g = new THREE.Group();
  const bodyM = std('#e8432b', { roughness: 0.45 }), dark = std('#2a2a30', { roughness: 0.4, metalness: 0.3 });
  const body = cyl(0.042, 0.042, 0.24, bodyM, 14); body.rotation.x = PI / 2; g.add(body);
  const head = cyl(0.065, 0.045, 0.08, dark, 16); head.rotation.x = PI / 2; head.position.z = 0.15; g.add(head);
  const cap = cyl(0.044, 0.044, 0.03, dark, 12); cap.rotation.x = PI / 2; cap.position.z = -0.13; g.add(cap);
  const btn = box(0.03, 0.02, 0.04, std('#ffd23f'), 0, 0.045, 0.02); g.add(btn);
  const lensM = basic('#fffbe0', { toneMapped: false });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.058, 18), lensM); lens.position.z = 0.191; g.add(lens);
  const glow = glowSprite('#fff4c0', 0.7, 0.9); glow.position.z = 0.22; g.add(glow);
  const piv = new THREE.Group(); piv.position.z = 0.19; piv.rotation.x = PI / 2; g.add(piv);
  const mk = (r0, r1, op) => {
    const geo = new THREE.CylinderGeometry(r1, r0, 1, 24, 1, true); geo.translate(0, 0.5, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamTex(), color: '#fff6d8', transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.renderOrder = 6; m.frustumCulled = false; piv.add(m); return m;
  };
  const outer = mk(0.06, 1, 0.22), core = mk(0.04, 0.35, 0.35);
  g.userData = {
    glow, lensM,
    set(on = 1, len = 1.6, width = 0.5) {
      piv.visible = on > 0.01; glow.visible = on > 0.01;
      piv.scale.set(width, len, width);
      outer.material.opacity = 0.22 * on; core.material.opacity = 0.32 * on;
      glow.material.opacity = 0.9 * on; glow.scale.setScalar(0.5 + 0.4 * on);
      lensM.color.set(on > 0.01 ? '#fffbe0' : '#666655');
    },
  };
  g.userData.set(1);
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════ the creature
function eyeTex() {
  return canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#e07a00'; g.fillRect(0, 0, w, h);
    const cx = w * 0.75, cy = h / 2;
    const gr = g.createRadialGradient(cx, cy, 4, cx, cy, h * 0.62);
    gr.addColorStop(0, '#ffffe8'); gr.addColorStop(0.25, '#fff35a'); gr.addColorStop(0.6, '#ffd81e'); gr.addColorStop(0.88, '#ffa40a'); gr.addColorStop(1, '#e07a00');
    g.fillStyle = gr; g.fillRect(cx - h, 0, h * 2, h);
    g.strokeStyle = 'rgba(200,110,0,0.35)'; g.lineWidth = 3;
    for (let k = 0; k < 28; k++) { const a = k / 28 * PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26); g.lineTo(cx + Math.cos(a) * 110, cy + Math.sin(a) * 110); g.stroke(); }
  });
}
const DEEP_SKIN = '#3b1f63';
export function makeDeepOne() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const skin = new THREE.MeshStandardMaterial({ color: DEEP_SKIN, roughness: 0.5, emissive: '#1c0a36', emissiveIntensity: 0.7 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), skin); body.scale.set(1.15, 0.9, 1.05); inner.add(body);
  const spotM = std('#5a3590', { roughness: 0.55, emissive: '#2a0f50', emissiveIntensity: 0.4 });
  const R = rng(5);
  for (let i = 0; i < 30; i++) {
    const a = R() * PI * 2, e = -0.2 + R() * 1.3;
    const p = V(Math.sin(a) * Math.cos(e) * 1.15, Math.sin(e) * 0.9, Math.cos(a) * Math.cos(e) * 1.05);
    const s = sph(0.06 + R() * 0.1, spotM, 10, 8); s.position.copy(p.multiplyScalar(0.99)); s.scale.z = 0.45; s.lookAt(0, 0, 0); inner.add(s);
  }
  // the eye: underside, looking down + forward
  const eye = new THREE.Group(); eye.position.set(0, -0.48, 0.66); eye.rotation.x = 0.75; inner.add(eye);
  const eyeM = new THREE.MeshBasicMaterial({ map: eyeTex(), toneMapped: false });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.46, 40, 24), eyeM); eye.add(ball);
  const look = new THREE.Group(); eye.add(look);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), basic('#08040c')); pupil.scale.set(0.055, 0.33, 0.05); pupil.position.z = 0.43; look.add(pupil);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), basic('#ffffff')); glint.position.set(-0.14, 0.16, 0.41); eye.add(glint);
  const socket = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.07, 10, 40), skin); socket.position.z = 0.05; eye.add(socket);
  const lidGeo = new THREE.SphereGeometry(0.5, 32, 14, 0, PI * 2, 0, PI / 2);
  const lidM = new THREE.MeshStandardMaterial({ color: '#4a2878', roughness: 0.5, side: THREE.DoubleSide, emissive: '#1c0a36', emissiveIntensity: 0.6 });
  const lidU = new THREE.Mesh(lidGeo, lidM); eye.add(lidU);
  const lidL = new THREE.Mesh(lidGeo, lidM); eye.add(lidL);
  const glow = glowSprite('#ffd84a', 1.6, 0.5); glow.position.set(0, 0, 0.6); eye.add(glow);
  // eight tentacles round the lower body
  const tent = makeTentacles(8, { nSeg: 12, color: '#5a2a8e', sucker: '#5fffe0' });
  tent.userData.mat.emissive.set('#2a0f50'); tent.userData.mat.emissiveIntensity = 0.7;
  tent.children[2].material = basic('#6ffff0', { toneMapped: false });
  inner.add(tent);
  const defs = Array.from({ length: 8 }, (_, k) => ({ a: (k / 8) * PI * 2 + 0.2, ph: k * 1.37, len: 2.2 + 0.8 * hash(k * 3.1) }));
  const eyeW = V();
  g.userData = {
    eye, look, ball, lidU, lidL, glow, inner, tent, skin, eyeM,
    eyeWorld() { g.updateMatrixWorld(true); return eye.getWorldPosition(eyeW.clone()); },
    set(t, { lid = 0, lookX = 0, lookY = 0, glow: gl = 1, coil = 1, reach = 0, sway = 1, tentOn = 1, bob = 1 } = {}) {
      inner.position.y = 0.03 * Math.sin(t * 0.5) * bob; inner.rotation.z = 0.03 * Math.sin(t * 0.35) * bob;
      look.rotation.set(-lookY * 0.5, lookX * 0.6, 0);
      const c = clamp(lid, 0, 1);
      lidU.rotation.x = lerp(-1.4, PI / 2 - 0.02, c);
      lidL.rotation.x = lerp(PI + 1.3, PI + PI / 2 + 0.02, c);
      eyeM.color.setRGB(1, 0.94, 0.8).multiplyScalar(clamp(0.45 + 0.75 * gl, 0, 1.7));
      glow.material.opacity = clamp(0.34 * gl, 0, 1) * (1 - c * 0.95); glow.scale.setScalar(1.6 + 0.9 * gl);
      if (!tentOn) { for (let k = 0; k < 8; k++) tent.userData.hide(k); return; }
      defs.forEach((d, k) => {
        const base = baseMatrix(Math.sin(d.a) * 0.95, -0.35, Math.cos(d.a) * 0.9, d.a, 1.2 + 0.25 * reach, 0, 1);
        tent.userData.set(k, base, d.len * (1 + 0.5 * reach), 0.2, 0.04, shape({ bend: lerp(1.6, 0.5, reach), curl: lerp(2.6, 0.4, reach) * coil + 0.5 * Math.sin(t * 0.6 + d.ph), sway: 0.6 * Math.sin(t * 0.4 + d.ph), t, phase: d.ph, wave: 0.35 * sway, n: 12 }));
      });
    },
  };
  g.userData.set(0);
  return g;
}
/** One long instanced tentacle laid along a CatmullRom curve through local points. */
export function makeCurveTentacle(nSeg = 44) {
  const g = new THREE.Group();
  const segGeo = new THREE.CylinderGeometry(0.86, 1, 1, 12, 1); segGeo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ color: '#6a2fa6', roughness: 0.45, emissive: '#2a0f50', emissiveIntensity: 0.7 });
  const segs = new THREE.InstancedMesh(segGeo, mat, nSeg), balls = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), mat, nSeg + 1);
  const suckM = basic('#6ffff0', { toneMapped: false });
  const sucks = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6), suckM, nSeg * 2);
  const tipGlow = glowSprite('#7ffff0', 1.2, 0.5); g.add(tipGlow);
  for (const m of [segs, balls, sucks]) { m.frustumCulled = false; m.castShadow = true; g.add(m); }
  sucks.castShadow = false;
  const curve = new THREE.CatmullRomCurve3([V(), V(0, -1, 0)], false, 'centripetal');
  const pts = Array.from({ length: nSeg + 1 }, () => V());
  const dir = V(), up = V(0, 1, 0), down = V(0, -1, 0), nrm = V(), side = V(), tip = V();
  g.userData = {
    mat, suckM, tipGlow,
    tip() { return tip.clone(); },
    tipWorld() { g.updateMatrixWorld(true); return g.localToWorld(tip.clone()); },
    /** pts: local Vector3 control points from base to tip. */
    setPath(ctrl, r0 = 1.4, r1 = 0.12, t = 0, { glow = 1 } = {}) {
      curve.points = ctrl;
      for (let i = 0; i <= nSeg; i++) curve.getPointAt(i / nSeg, pts[i]);
      for (let i = 0; i < nSeg; i++) {
        const a = pts[i], b = pts[i + 1];
        dir.copy(b).sub(a); const L = dir.length(); dir.normalize();
        const r = lerp(r0, r1, Math.pow(i / nSeg, 0.9)), rn = lerp(r0, r1, Math.pow((i + 1) / nSeg, 0.9));
        _q.setFromUnitVectors(up, dir);
        _m.compose(a, _q, _s.set(r, L * 1.08, r)); segs.setMatrixAt(i, _m);
        _m.compose(a, _q, _s.set(r * 1.02, r * 1.02, r * 1.02)); balls.setMatrixAt(i, _m);
        nrm.copy(down).addScaledVector(dir, -down.dot(dir)); if (nrm.lengthSq() < 1e-4) nrm.set(0, 0, 1); nrm.normalize();
        side.crossVectors(dir, nrm).normalize();
        for (let k = 0; k < 2; k++) {
          const sx = (k ? 1 : -1) * 0.42;
          _p.copy(a).addScaledVector(dir, L * 0.5).addScaledVector(nrm, (r + rn) * 0.5 * 0.82).addScaledVector(side, sx * (r + rn) * 0.5);
          const sr = (r + rn) * 0.5 * 0.3;
          _m.compose(_p, _q, _s.set(sr, sr * 0.6, sr)); sucks.setMatrixAt(i * 2 + k, _m);
        }
      }
      _m.compose(pts[nSeg], _q.identity(), _s.set(r1 * 1.1, r1 * 1.1, r1 * 1.1)); balls.setMatrixAt(nSeg, _m);
      tip.copy(pts[nSeg]);
      tipGlow.position.copy(tip); tipGlow.material.opacity = 0.5 * glow; tipGlow.scale.setScalar(Math.max(0.6, r1 * 10));
      suckM.color.set('#6ffff0').multiplyScalar(0.5 + 0.5 * glow + 0.15 * Math.sin(t * 3));
      segs.instanceMatrix.needsUpdate = balls.instanceMatrix.needsUpdate = sucks.instanceMatrix.needsUpdate = true;
    },
  };
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════ set pieces
export function makeHedge() {
  const g = new THREE.Group();
  const leaf = std('#3c8f45', { roughness: 0.9 }), leaf2 = std('#4caf50', { roughness: 0.9 });
  const b = box(3.2, 1.2, 1.2, leaf, 0, 0.6, 0); g.add(b);
  const R = rng(9), geo = new THREE.IcosahedronGeometry(1, 0);
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(geo, i % 2 ? leaf : leaf2); const s = 0.25 + 0.2 * R();
    m.position.set((R() - 0.5) * 3.1, 0.75 + R() * 0.6, (R() - 0.5) * 1.15); m.scale.setScalar(s); m.rotation.set(R() * 3, R() * 3, R() * 3); m.castShadow = true; g.add(m);
  }
  return g;
}
export function makeKidWindow(wall = '#bfd8ee', roof = '#3b4f78') {
  const g = new THREE.Group();
  const trim = '#fbf6ea';
  const backM = basic('#3a5a8a');
  const back = box(1.7, 1.55, 0.05, backM, 0, 2.0, 0.04); back.castShadow = false; g.add(back);
  const lamp = glowSprite('#9fdcff', 2.2, 0.35); lamp.position.set(0, 2.2, 0.2); g.add(lamp);
  g.add(box(2.1, 0.22, 1.0, trim, 0, 2.86, 0.5));
  for (const s of [-1, 1]) g.add(box(0.2, 2.95, 1.0, wall, s * 0.95, 1.475, 0.5));
  g.add(box(1.9, 1.15, 0.14, wall, 0, 0.575, 0.93));
  g.add(box(2.1, 0.12, 0.36, trim, 0, 1.21, 0.98));
  for (const s of [-1, 1]) { const c = box(0.22, 1.45, 0.06, '#2f4d8a', s * 0.72, 2.05, 0.9); c.castShadow = false; g.add(c); }
  g.add(box(2.0, 0.08, 0.08, '#5a4632', 0, 2.72, 0.92));
  // porch roof: from the wall below the bay, sloping down toward +Z, with tile ridges and a gutter
  const len = 2.3, drop = 0.95, ang = Math.atan2(drop, len), W = 3.0, th = 0.16;
  const roofG = new THREE.Group(); roofG.position.set(0, -0.02, 0); roofG.rotation.x = ang; g.add(roofG);
  const slab = box(W, th, Math.hypot(len, drop), roof, 0, -th / 2, Math.hypot(len, drop) / 2); roofG.add(slab);
  const ridgeM = std('#2c3b5c');
  for (let k = 1; k < 7; k++) { const r = box(W, 0.035, 0.05, ridgeM, 0, 0.012, k * Math.hypot(len, drop) / 7); r.castShadow = false; roofG.add(r); }
  const gutter = box(W + 0.1, 0.12, 0.14, '#9aa3ad', 0, -0.06 - drop, len + 0.05); g.add(gutter);
  const lip = box(W + 0.1, 0.14, 0.04, '#9aa3ad', 0, 0.02 - drop, len + 0.13); g.add(lip);
  for (const s of [-1, 1]) g.add(box(0.14, 2.6 - drop + 0.1, 0.14, '#e9e3d6', s * (W / 2 - 0.12), -0.02 - drop - (2.6 - drop) / 2 + 0.05, len - 0.05));
  g.userData = {
    backM, lamp,
    roofAt(z) { return -0.02 - drop * clamp(z / len, 0, 1); },
    roofEnd: len, sill: 1.27, ang,
    glow(k = 1, col = '#3a5a8a') { backM.color.set(col).multiplyScalar(k); lamp.material.opacity = 0.35 * k; },
  };
  return g;
}
const glowStd = (c) => std(c, { emissive: c, emissiveIntensity: 0.75 });
const HOUSE_COLS = ['#e9d8b5', '#c9e4f2', '#f2c4c4', '#d6e8c4', '#f3e3a5', '#cbbfe6'];
const ROOF_COLS = ['#b5543f', '#4a5d7e', '#6b4a3a', '#3f7a5a'];
/** Upright local coords: ground top at y = 0, two rows facing each other across a street along X. Flip with rotation.x = π. */
export function makeUpsideTown() {
  const g = new THREE.Group();
  g.add(box(150, 1.0, 70, glowStd('#3c6a4a'), 0, -0.5, 0));
  g.add(box(150, 0.04, 9, '#3a3d46', 0, 0.02, 0));
  const winM = new THREE.MeshBasicMaterial({ color: '#ffe08a', toneMapped: false });
  const winGeo = new THREE.PlaneGeometry(1.6, 1.8), halos = [];
  const prism = (w, h, d) => { const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.closePath(); const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); geo.rotateY(PI / 2); geo.translate(-w / 2, 0, 0); return geo; };
  const hero = { pos: V(), yaw: 0 };
  const rows = [[-11, 0], [11, PI]];
  let k = 0;
  for (const [z, yaw] of rows) {
    for (let i = 0; i < 9; i++, k++) {
      const x = -48 + i * 12;
      const hg = new THREE.Group(); hg.position.set(x, 0, z); hg.rotation.y = yaw; g.add(hg);
      const w = 8.6, d = 7, H = 5.8;
      hg.add(box(w, H, d, glowStd(HOUSE_COLS[k % 6]), 0, H / 2, 0));
      const rf = new THREE.Mesh(prism(w + 0.8, 2.9, d + 0.8), glowStd(ROOF_COLS[k % 4])); rf.position.y = H; hg.add(rf);
      const isHero = z < 0 && i === 4;
      for (const [wx, wy] of [[-2.8, 4.35], [0, 4.35], [2.8, 4.35], [-2.6, 1.55], [2.6, 1.55]]) {
        if (isHero && wx === 0 && wy > 3) continue;
        const m = new THREE.Mesh(winGeo, winM); m.position.set(wx, wy, d / 2 + 0.02); hg.add(m);
        if ((k + wx) % 2 === 0 || isHero || wy < 3) { const hl = glowSprite('#ffc46a', 4.2, 0.7); hl.position.set(wx, wy, d / 2 + 0.3); hg.add(hl); halos.push(hl); }
      }
      hg.add(box(1.1, 2.1, 0.08, '#7d5232', 0, 1.05, d / 2 + 0.03));
      if (isHero) {
        // an open lit bay for the mum + kid
        const bay = new THREE.Group(); bay.position.set(0, 2.9, d / 2); hg.add(bay);
        const back = box(2.6, 2.2, 0.05, basic('#ffcf7a', { toneMapped: false }), 0, 1.1, 0.05); back.castShadow = false; bay.add(back);
        for (const s of [-1, 1]) bay.add(box(0.2, 2.6, 1.6, HOUSE_COLS[k % 6], s * 1.4, 1.3, 0.8));
        bay.add(box(3.0, 0.22, 1.6, '#fbf6ea', 0, 2.6, 0.8));
        bay.add(box(2.6, 0.9, 0.14, HOUSE_COLS[k % 6], 0, 0.45, 1.5));
        bay.add(box(3.0, 0.12, 0.4, '#fbf6ea', 0, 0.95, 1.55));
        for (const s of [-1, 1]) { const c = box(0.3, 2.0, 0.06, '#e8232b', s * 1.12, 1.4, 1.45); c.castShadow = false; bay.add(c); }
        const hl = glowSprite('#ffd27a', 6, 0.7); hl.position.set(0, 1.3, 1.0); bay.add(hl); halos.push(hl);
        hero.pos.set(x, 2.9, z + d / 2 + 0.7); hero.yaw = yaw; hero.bayLocal = V(x, 2.9 + 1.1, z + d / 2 + 1.5);
      }
    }
  }
  // mini clock tower at the west end
  const tw = new THREE.Group(); tw.position.set(-62, 0, 0); g.add(tw);
  tw.add(box(4.4, 15, 4.4, glowStd('#e8d9b8'), 0, 7.5, 0));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4, 4, 4), std('#3f7a5a')); cone.position.y = 17; cone.rotation.y = PI / 4; tw.add(cone);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), basic('#fff6dc', { toneMapped: false })); const a = i * PI / 2; f.position.set(Math.sin(a) * 2.22, 12.5, Math.cos(a) * 2.22); f.rotation.y = a; tw.add(f); }
  const th = glowSprite('#fff0c0', 7, 0.5); th.position.set(0, 12.5, 2.6); tw.add(th);
  // street lamps
  for (let i = 0; i < 12; i++) { const x = -54 + i * 10, z = i % 2 ? 4.8 : -4.8; tw.parent.add(box(0.2, 4.4, 0.2, '#2a2a30', x, 2.2, z)); const l = glowSprite('#ffe2a0', 2.2, 0.8); l.position.set(x, 4.6, z); g.add(l); halos.push(l); }
  g.userData = {
    hero, halos,
    set(t, k = 1) { winM.color.set('#ffe08a').multiplyScalar(k); halos.forEach((h, i) => { h.material.opacity = k * (0.5 + 0.2 * Math.sin(t * 2 + i * 1.7)); }); },
  };
  return g;
}
export function makeLampGlows(points) {
  const g = new THREE.Group(), list = [];
  for (const p of points) { const s = glowSprite('#ffd890', 3.2, 0.7); s.position.copy(p); g.add(s); list.push(s); const c = glowSprite('#fff6e0', 0.8, 1); c.position.copy(p); g.add(c); list.push(c); }
  g.userData = {
    set(t, k = 1, flicker = 0, seq = null) {
      list.forEach((s, i) => {
        const j = i >> 1;
        let on = 1;
        if (seq) on = seq(j, s.position) ? 1 : 0;
        else if (flicker > 0) { const ph = Math.floor(t * 9 + j * 3.7); on = hash(ph * 1.7 + j) < 0.45 * flicker ? 0.05 : 1; }
        s.material.opacity = k * on * (i % 2 ? 1 : 0.7);
      });
    },
  };
  return g;
}
export function makeStars(n = 5) {
  const g = new THREE.Group(), list = [];
  const shp = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 - PI / 2, r = i % 2 ? 0.045 : 0.11; if (i === 0) shp.moveTo(Math.cos(a) * r, Math.sin(a) * r); else shp.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.03, bevelEnabled: false });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, basic('#ffe14a', { toneMapped: false })); g.add(m); list.push(m); }
  g.userData = { set(t, k = 1) { list.forEach((m, i) => { const a = t * 3 + i / n * PI * 2; m.position.set(Math.cos(a) * 0.42, 0.06 * Math.sin(a * 2), Math.sin(a) * 0.42); m.rotation.set(0, -a, t * 4); m.scale.setScalar(k); }); g.visible = k > 0.01; } };
  return g;
}
export function makeLeafBurst(n = 24) {
  const g = new THREE.Group(), list = [];
  const cols = ['#3c8f45', '#4caf50', '#6fcf5a', '#2f6e3a'];
  for (let i = 0; i < n; i++) { const m = box(0.16, 0.03, 0.11, cols[i % 4]); m.castShadow = false; g.add(m); list.push(m); }
  g.userData = {
    set(u) {
      g.visible = u > 0 && u < 1;
      list.forEach((m, i) => {
        const a = hash(i * 1.3) * PI * 2, sp = 1.5 + 2.5 * hash(i * 2.7), tt = u * 1.6;
        m.position.set(Math.cos(a) * sp * tt, 3.5 * tt * (1 - hash(i * 3.3) * 0.4) - 4.9 * tt * tt * 0.9 + 0.6, Math.sin(a) * sp * tt);
        m.rotation.set(tt * 9 + i, tt * 6 + i * 2, tt * 7);
      });
    },
  };
  return g;
}
export function makeDingStar() {
  const g = new THREE.Group();
  const shp = new THREE.Shape(); const n = 16;
  for (let i = 0; i < n; i++) { const a = i / n * PI * 2, r = i % 2 ? 0.22 : 0.5; if (i === 0) shp.moveTo(Math.cos(a) * r, Math.sin(a) * r); else shp.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  const outer = new THREE.Mesh(new THREE.ShapeGeometry(shp), basic('#ffe14a', { toneMapped: false, transparent: true, side: THREE.DoubleSide, depthTest: false })); g.add(outer);
  const inner = new THREE.Mesh(new THREE.ShapeGeometry(shp), basic('#ffffff', { toneMapped: false, transparent: true, side: THREE.DoubleSide, depthTest: false })); inner.scale.setScalar(0.55); inner.position.z = 0.01; g.add(inner);
  outer.renderOrder = inner.renderOrder = 9;
  g.userData = { set(u) { g.visible = u > 0 && u < 1; const s = ease.outBack(clamp(u * 3, 0, 1)) * (1 - clamp((u - 0.6) / 0.4, 0, 1) * 0.3); g.scale.setScalar(Math.max(0.01, s)); outer.material.opacity = inner.material.opacity = 1 - clamp((u - 0.7) / 0.3, 0, 1); g.rotation.z = u * 0.6; } };
  return g;
}
/** expanding ripple rings for the underside of the sea (rings lie flat, visible from below). userData.set(t, k) */
export function makeRipple(n = 3, color = '#e8ffff') {
  const g = new THREE.Group(), list = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48).rotateX(PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }));
    m.renderOrder = 7; g.add(m); list.push(m);
  }
  const core = glowSprite('#ffffff', 2.2, 0.0); g.add(core);
  g.userData = {
    core,
    set(t, k = 1, { size = 4, speed = 0.9 } = {}) {
      g.visible = k > 0.001;
      list.forEach((m, i) => { const u = (t * speed + i / n) % 1; m.scale.setScalar(0.3 + size * u); m.material.opacity = k * 0.8 * (1 - u) * Math.min(1, u * 6); });
      core.material.opacity = 0.6 * k; core.scale.setScalar(size * 0.5);
    },
  };
  return g;
}
/** a dark fish-shaped shadow seen through the water from below (flat, +Z = nose). userData.set(t, k) */
export function makeFishShadow(color = '#04101e') {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(0, 1.0); s.quadraticCurveTo(0.42, 0.55, 0.36, -0.1); s.quadraticCurveTo(0.25, -0.55, 0.06, -0.72); s.lineTo(0.38, -1.15); s.lineTo(-0.38, -1.15); s.lineTo(-0.06, -0.72);
  s.quadraticCurveTo(-0.25, -0.55, -0.36, -0.1); s.quadraticCurveTo(-0.42, 0.55, 0, 1.0);
  const geo = new THREE.ShapeGeometry(s, 16); geo.rotateX(-PI / 2); geo.scale(1, 1, -1);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = 6; g.add(m);
  g.userData = { set(t, k = 1) { mat.opacity = 0.65 * k; m.rotation.y = 0.12 * Math.sin(t * 6); g.visible = k > 0.001; } };
  return g;
}
