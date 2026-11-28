/*
 * src/real/weather.js — rain, splashes, drips, fog cards, ocean mist, canopy light shafts and lightning for the photoreal kit.
 * All GPU-animated from RU.uTime (materials.js setFrame) or recomputed from t in update(t); nothing accumulates.
 *
 *   makeRain(opts) → { root, mesh, uniforms, update(t) }
 *     Camera-relative streaks: `count` instanced quads live in a box around the camera, wrap seamlessly as it moves,
 *     fall with wind slant, are stretched along their velocity (motion-blur look), fade near/far, glint white in
 *     lightning (RU.uFlash) and brighten when backlit (looking toward lightDir).
 *     opts: count 7000, box [26, 18, 26] (x,y,z m), speed 9 (m/s), wind [2.2, 0.6] (m/s xz), length 0.55 (m),
 *           width 0.009 (m), color '#c9d3d8' (linear, HDR ok), opacity 0.5, lightDir [0,0.4,-1], backlight 2.5,
 *           near 0.6, far 22 (fade distances), blending 'add' | 'normal', y null (if set, streaks don't go below this y),
 *           clip null | { min:[x,y,z], max:[x,y,z] } world box outside which no rain is drawn (e.g. only beyond a cave mouth),
 *           sharp true (puts the streaks on layer 10 = post.js FX layer, drawn after DOF; set false when rendering without post.js)
 *   makeSplashes(opts) → { root, update() }   rain hitting the ground: expanding rings + tiny crowns, world-anchored
 *     around the RENDERING camera (laid out by a PRE_RENDER hook that post.js runs once the camera is final), on heightAt(x,z). opts: count 900, radius 9, heightAt (x,z)→y, size 0.12,
 *     rate 1 (cycles/s per splash), color '#d6dde0', opacity 0.55
 *   makeDrips(opts) → { root, update(t) }   drops falling from fixed points (leaf tips, stalactites), with a ripple ring
 *     at the impact height. opts: points [Vector3|[x,y,z]], floorY 0 | (i)→y, period [0.9, 2.2] s, size 0.018,
 *     color '#e0e8ec', ring true
 *   makeFogCards(opts) → { root, update(t) }   soft noise-textured mist billboards (or horizontal sheets) that drift.
 *     opts: count 24, area [40, 40], center [0,0], y [0.2, 3], size [8, 16], color '#b9c3c6' (linear), opacity 0.35,
 *           horizontal false (true = sheets lying on the water / ground), drift [0.4, 0, 0.15] m/s, seed 7, fadeNear 2
 *   makeLightShafts(opts) → { root, update(t) }   additive god-ray volumes (soft-edged tapered cylinders with drifting
 *     dust/rain streak noise). opts: count 5, origins [[x,y,z]…] | area+y, dir [0.25,-1,0.1], length 30, radius [0.6, 2],
 *     color '#dfe8ea', intensity 0.35, seed 11
 *   makeLightning(opts) → { root, light, bolts, update(t) → flash (0..1+), strikeAt(t) }
 *     Branching bolt meshes (camera-facing ribbons, HDR white-blue) + flash envelope with 2–4 return strokes per strike.
 *     update(t) sets the bolt visibility, the flash DirectionalLight and RU.uFlash, and returns the flash level so the shot
 *     can drive post.set({ flash }), sky.setFlash(flash, dir) and rig.update(t, flash).
 *     opts: strikes [{ t, pos [x,y,z] (top of the bolt), ground [x,y,z] (end), seed, power 1 }], light true,
 *           color '#cfe0ff', branches 6
 */
import * as THREE from 'three';
import { rng, clamp, lerp, hash } from '../lib/util.js';
import { getNoiseTex } from './textures.js';
import { RU, PRE_RENDER, inScene } from './materials.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const arr3 = (v) => (Array.isArray(v) ? V3(v[0], v[1], v[2]) : v.clone());
const C = (h) => new THREE.Color(h);

// ═════════════════════════════════════════════ rain ═══════════════════════════════════════════════════════════════
const RAIN_V = /* glsl */`
attribute vec4 aSeed;
uniform float uTime, uSpeed, uLen, uWidth, uNear, uFar, uFloor; uniform vec3 uClipMin, uClipMax;
uniform vec3 uBox; uniform vec2 uRainWind;
varying float vFade; varying vec2 vQ; varying float vBack;
uniform vec3 uLightDir;
void main() {
  vec3 vel = vec3(uRainWind.x, -uSpeed * (0.8 + 0.4 * aSeed.w), uRainWind.y);
  vec3 p = aSeed.xyz * uBox + vel * uTime;
  vec3 lo = cameraPosition - uBox * vec3(0.5, 0.35, 0.5);
  vec3 wp = lo + mod(p - lo, uBox);
  vec3 axis = normalize(vel);
  vec3 toCam = normalize(cameraPosition - wp);
  vec3 side = normalize(cross(axis, toCam));
  float L = uLen * (0.7 + 0.6 * aSeed.w);
  // quad: position.x in [-0.5,0.5] across, position.y in [0,1] along the streak (tail → head)
  vec3 q = wp - axis * L * position.y + side * position.x * uWidth;
  if (q.y < uFloor || any(lessThan(wp, uClipMin)) || any(greaterThan(wp, uClipMax))) q.y = -1e5;
  float d = length(q - cameraPosition);
  vFade = smoothstep(uNear * 0.5, uNear, d) * (1.0 - smoothstep(uFar * 0.6, uFar, d));
  vQ = position.xy;
  vBack = pow(max(0.0, dot(-toCam, normalize(uLightDir))), 4.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(q, 1.0);
}`;
const RAIN_F = /* glsl */`
precision highp float;
varying float vFade; varying vec2 vQ; varying float vBack;
uniform vec3 uColor; uniform float uOpacity, uFlash, uBacklight;
void main() {
  float across = 1.0 - abs(vQ.x * 2.0);
  float along = smoothstep(0.0, 0.25, vQ.y) * smoothstep(1.0, 0.6, vQ.y);
  float a = across * across * along * vFade * uOpacity;
  vec3 c = uColor * (1.0 + uBacklight * vBack + uFlash * 1.2);
  gl_FragColor = vec4(c * a, a);
}`;
export function makeRain(opts = {}) {
  const o = { count: 7000, box: [26, 18, 26], speed: 9, wind: [2.2, 0.6], length: 0.55, width: 0.009, color: '#c9d3d8', opacity: 0.5,
    lightDir: [0, 0.4, -1], backlight: 2.5, near: 0.6, far: 22, blending: 'add', y: null, seed: 21, ...opts };
  const base = new THREE.PlaneGeometry(1, 1); base.translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position;
  const r = rng(o.seed), s = new Float32Array(o.count * 4);
  for (let i = 0; i < o.count * 4; i++) s[i] = r();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(s, 4));
  g.instanceCount = o.count;
  const uniforms = {
    uTime: RU.uTime, uFlash: RU.uFlash, uSpeed: { value: o.speed }, uLen: { value: o.length }, uWidth: { value: o.width },
    uNear: { value: o.near }, uFar: { value: o.far }, uFloor: { value: o.y ?? -1e5 }, uBox: { value: arr3(o.box) },
    uRainWind: { value: new THREE.Vector2(o.wind[0], o.wind[1]) }, uLightDir: { value: arr3(o.lightDir) },
    uClipMin: { value: arr3(o.clip ? o.clip.min : [-1e6, -1e6, -1e6]) }, uClipMax: { value: arr3(o.clip ? o.clip.max : [1e6, 1e6, 1e6]) },
    uColor: { value: C(o.color) }, uOpacity: { value: o.opacity }, uBacklight: { value: o.backlight },
  };
  const add = o.blending === 'add';
  const material = new THREE.ShaderMaterial({ vertexShader: RAIN_V, fragmentShader: RAIN_F, uniforms, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: add ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor, fog: false, toneMapped: false,
    side: THREE.DoubleSide });   // streak winding depends on the view → never cull
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = 50; mesh.name = 'rain';
  // sharp FX layer: post.js draws layer 10 after depth of field (see post.js). Without post.js pass sharp:false.
  if (o.sharp !== false) mesh.layers.set(10);
  const root = new THREE.Group(); root.add(mesh);
  return { root, mesh, uniforms, update() {} };
}

// ═════════════════════════════════════════════ splashes ═══════════════════════════════════════════════════════════
const SPLASH_V = /* glsl */`
attribute vec3 aPos; attribute float aAge; attribute float aKind;
uniform float uSize;
varying vec2 vUv; varying float vAge; varying float vKind;
void main() {
  vUv = uv; vAge = aAge; vKind = aKind;
  vec3 wp;
  if (aKind < 0.5) {
    // ring lying on the ground
    float s = uSize * (0.25 + aAge * 1.4);
    wp = aPos + vec3(position.x * s, 0.004, -position.y * s);
  } else {
    // crown: small vertical billboard
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    float s = uSize * 0.45;
    float h = sin(min(1.0, aAge * 1.6) * 3.14159) * 0.8 + 0.2;
    wp = aPos + right * position.x * s + vec3(0.0, (position.y + 0.5) * s * h, 0.0);
  }
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const SPLASH_F = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vAge; varying float vKind;
uniform vec3 uColor; uniform float uOpacity, uFlash;
void main() {
  vec2 d = vUv - 0.5; float r = length(d) * 2.0;
  float a;
  if (vKind < 0.5) {
    a = smoothstep(0.08, 0.0, abs(r - 0.8)) * (1.0 - vAge);
  } else {
    // a few droplets thrown up in a crown shape
    float ang = atan(d.y, d.x);
    float spikes = pow(max(0.0, cos(ang * 7.0)), 8.0);
    a = spikes * smoothstep(0.9, 0.2, r) * step(0.0, d.y + 0.25) * (1.0 - vAge) * (1.0 - vAge);
    a += smoothstep(0.18, 0.0, length(d - vec2(0.0, -0.3))) * (1.0 - vAge);
    a *= 0.45;
  }
  a *= uOpacity;
  gl_FragColor = vec4(uColor * (1.0 + uFlash * 1.5) * a, a);
}`;
export function makeSplashes(opts = {}) {
  const o = { count: 900, radius: 9, heightAt: () => 0, size: 0.12, rate: 1, color: '#d6dde0', opacity: 0.55, seed: 31, ...opts };
  const n = o.count * 2;
  const base = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  const pos = new Float32Array(n * 3), age = new Float32Array(n), kind = new Float32Array(n);
  for (let i = 0; i < n; i++) kind[i] = i % 2;
  const aPos = new THREE.InstancedBufferAttribute(pos, 3), aAge = new THREE.InstancedBufferAttribute(age, 1);
  g.setAttribute('aPos', aPos); g.setAttribute('aAge', aAge); g.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 1));
  g.instanceCount = n;
  const uniforms = { uSize: { value: o.size }, uColor: { value: C(o.color) }, uOpacity: { value: o.opacity }, uFlash: RU.uFlash };
  const material = new THREE.ShaderMaterial({ vertexShader: SPLASH_V, fragmentShader: SPLASH_F, uniforms, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, fog: false, toneMapped: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 40;
  const root = new THREE.Group(); root.add(mesh);
  const r = rng(o.seed);
  const phase = Float32Array.from({ length: o.count }, () => r()), per = Float32Array.from({ length: o.count }, () => (0.6 + r() * 0.8) / o.rate);
  const camPos = V3();
  // positions are computed at RENDER time from the camera actually used (set.update runs before the shot places the
  // camera, so doing it there would lag one frame and break random-access determinism)
  function layout(t, camera) {
    camPos.setFromMatrixPosition(camera.matrixWorld);
    const cs = o.radius * 2;
    for (let i = 0; i < o.count; i++) {
      const u = t / per[i] + phase[i], cyc = Math.floor(u), a = u - cyc;
      const hx = hash(i * 12.9898 + cyc * 78.233), hz = hash(i * 39.346 + cyc * 11.135);
      const x = camPos.x - o.radius + hx * cs, z = camPos.z - o.radius + hz * cs;
      const y = o.heightAt(x, z);
      for (let k = 0; k < 2; k++) {
        const j = i * 2 + k;
        pos[j * 3] = x; pos[j * 3 + 1] = y; pos[j * 3 + 2] = z;
        age[j] = clamp(a * 2.2, 0, 1);
      }
    }
    aPos.needsUpdate = true; aAge.needsUpdate = true;
  }
  PRE_RENDER.add(({ scene, camera, t }) => { if (inScene(mesh, scene)) layout(t, camera); });
  return {
    root, mesh,
    update() {},   // kept for API symmetry: layout happens in the PRE_RENDER hook (requires post.js)
  };
}

// ═════════════════════════════════════════════ drips ══════════════════════════════════════════════════════════════
export function makeDrips(opts = {}) {
  const o = { points: [], floorY: 0, period: [0.9, 2.2], size: 0.018, color: '#e0e8ec', ring: true, seed: 41, ...opts };
  const r = rng(o.seed);
  const n = o.points.length;
  const root = new THREE.Group(); root.name = 'drips';
  if (!n) return { root, update() {} };
  const pts = o.points.map(arr3);
  const floors = pts.map((p, i) => (typeof o.floorY === 'function' ? o.floorY(i, p) : o.floorY));
  const per = pts.map(() => lerp(o.period[0], o.period[1], r())), ph = pts.map(() => r());
  const dropGeo = new THREE.SphereGeometry(1, 8, 6);
  const dropMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, transmission: 0, metalness: 0, clearcoat: 1, envMapIntensity: 2.5, emissive: C(o.color), emissiveIntensity: 0.04 });
  const drops = new THREE.InstancedMesh(dropGeo, dropMat, n);
  drops.frustumCulled = false;
  root.add(drops);
  let rings = null;
  if (o.ring) {
    const rg = new THREE.RingGeometry(0.85, 1, 32).rotateX(-Math.PI / 2);
    const rm = new THREE.MeshBasicMaterial({ color: C(o.color), transparent: true, opacity: 0.5, depthWrite: false });
    rings = new THREE.InstancedMesh(rg, rm, n);
    rings.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    rings.frustumCulled = false; rings.renderOrder = 30;
    root.add(rings);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  return {
    root, drops, rings,
    update(t) {
      for (let i = 0; i < n; i++) {
        const P = per[i], u = (t / P + ph[i]), a = u - Math.floor(u), tt = a * P;
        const H = pts[i].y - floors[i], tFall = Math.sqrt(2 * H / 9.81);
        const grow = 0.45;   // the drop swells at the tip, then lets go
        let y, sc, stretch;
        if (tt < grow) { y = pts[i].y - o.size * (tt / grow); sc = o.size * (0.3 + 0.7 * tt / grow); stretch = 1.2; }
        else if (tt < grow + tFall) { const f = tt - grow; y = pts[i].y - 0.5 * 9.81 * f * f; sc = o.size * 0.8; stretch = 1 + Math.min(4, 9.81 * f * 0.35); }
        else { y = -1e4; sc = 0; stretch = 1; }
        m4.compose(V3(pts[i].x, y, pts[i].z), q, V3(sc, sc * stretch, sc));
        drops.setMatrixAt(i, m4);
        if (rings) {
          const ra = (tt - grow - tFall) / 0.9;
          if (ra > 0 && ra < 1) { const s = 0.04 + ra * 0.35; m4.compose(V3(pts[i].x, floors[i] + 0.005, pts[i].z), q, V3(s, 1, s)); rings.setColorAt(i, C('#ffffff').multiplyScalar(1 - ra)); }
          else { m4.compose(V3(0, -1e4, 0), q, V3(0, 0, 0)); rings.setColorAt(i, C('#000000')); }
          rings.setMatrixAt(i, m4);
        }
      }
      drops.instanceMatrix.needsUpdate = true;
      if (rings) { rings.instanceMatrix.needsUpdate = true; rings.instanceColor.needsUpdate = true; }
    },
  };
}

// ═════════════════════════════════════════════ fog cards ══════════════════════════════════════════════════════════
const FOGCARD_V = /* glsl */`
attribute vec4 aCard;   // x, y, z, size
attribute vec2 aSeed;
uniform float uTime, uHorizontal; uniform vec3 uDrift;
varying vec2 vUv; varying float vSeed; varying float vFadeC; varying vec3 vWP;
uniform float uFadeNear;
void main() {
  vUv = uv; vSeed = aSeed.x;
  vec3 c = aCard.xyz + uDrift * uTime * (0.6 + aSeed.y * 0.8);
  vec3 wp;
  if (uHorizontal > 0.5) {
    wp = c + vec3(position.x, 0.0, -position.y) * aCard.w;
  } else {
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 up = vec3(0.0, 1.0, 0.0);
    wp = c + right * position.x * aCard.w + up * position.y * aCard.w * 0.55;
  }
  vWP = wp;
  float d = length(c - cameraPosition);
  vFadeC = smoothstep(uFadeNear, uFadeNear * 3.0, d);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const FOGCARD_F = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vSeed; varying float vFadeC; varying vec3 vWP;
uniform sampler2D tNoise; uniform float uTime, uOpacity, uFlash; uniform vec3 uColor;
void main() {
  vec2 d = vUv - 0.5;
  float edge = smoothstep(0.5, 0.15, length(d * vec2(1.0, 1.15)));
  vec2 q = vUv * 0.8 + vec2(vSeed * 3.1, vSeed * 1.7) + vec2(uTime * 0.01, -uTime * 0.004);
  float n = texture2D(tNoise, q).r * 0.6 + texture2D(tNoise, q * 2.3 + 0.5).g * 0.4;
  float a = edge * smoothstep(0.3, 0.75, n) * uOpacity * vFadeC;
  gl_FragColor = vec4(uColor * (1.0 + uFlash * 1.5) * a, a);
}`;
export function makeFogCards(opts = {}) {
  const o = { count: 24, area: [40, 40], center: [0, 0], y: [0.2, 3], size: [8, 16], color: '#b9c3c6', opacity: 0.35, horizontal: false,
    drift: [0.4, 0, 0.15], seed: 7, fadeNear: 2, ...opts };
  const r = rng(o.seed);
  const base = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  const card = new Float32Array(o.count * 4), sd = new Float32Array(o.count * 2);
  for (let i = 0; i < o.count; i++) {
    card[i * 4] = o.center[0] + (r() - 0.5) * o.area[0]; card[i * 4 + 1] = lerp(o.y[0], o.y[1], r());
    card[i * 4 + 2] = o.center[1] + (r() - 0.5) * o.area[1]; card[i * 4 + 3] = lerp(o.size[0], o.size[1], r());
    sd[i * 2] = r(); sd[i * 2 + 1] = r();
  }
  g.setAttribute('aCard', new THREE.InstancedBufferAttribute(card, 4)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 2));
  g.instanceCount = o.count;
  const uniforms = { uTime: RU.uTime, uFlash: RU.uFlash, uHorizontal: { value: o.horizontal ? 1 : 0 }, uDrift: { value: arr3(o.drift) },
    tNoise: { value: getNoiseTex(6, 256) }, uOpacity: { value: o.opacity }, uColor: { value: C(o.color) }, uFadeNear: { value: o.fadeNear } };
  const material = new THREE.ShaderMaterial({ vertexShader: FOGCARD_V, fragmentShader: FOGCARD_F, uniforms, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 20;
  const root = new THREE.Group(); root.add(mesh);
  return { root, mesh, uniforms, update() {} };
}

// ═════════════════════════════════════════════ light shafts ═══════════════════════════════════════════════════════
const SHAFT_V = /* glsl */`
varying vec3 vN; varying vec3 vV; varying float vAlong; varying vec2 vUv; varying vec3 vWP;
void main() {
  vUv = uv; vAlong = uv.y;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SHAFT_F = /* glsl */`
precision highp float;
varying vec3 vN; varying vec3 vV; varying float vAlong; varying vec2 vUv; varying vec3 vWP;
uniform sampler2D tNoise; uniform float uTime, uIntensity, uSeed; uniform vec3 uColor;
void main() {
  float facing = abs(dot(normalize(vN), normalize(vV)));
  float core = pow(facing, 2.5);
  float n = texture2D(tNoise, vec2(vUv.x * 2.0 + uSeed, vUv.y * 0.6 - uTime * 0.01)).r;
  float streak = texture2D(tNoise, vec2(vUv.x * 9.0 + uSeed, vUv.y * 0.15)).g;
  float lenF = smoothstep(0.0, 0.25, vAlong) * smoothstep(1.0, 0.55, vAlong);
  float camF = smoothstep(1.0, 5.0, length(cameraPosition - vWP));
  float a = core * lenF * camF * (0.55 + 0.6 * n) * (0.7 + 0.6 * streak) * uIntensity;
  gl_FragColor = vec4(uColor * a, 1.0);
}`;
export function makeLightShafts(opts = {}) {
  const o = { count: 5, origins: null, area: [20, 20], center: [0, 0], y: 30, dir: [0.25, -1, 0.1], length: 30, radius: [0.6, 2], color: '#dfe8ea', intensity: 0.35, seed: 11, ...opts };
  const r = rng(o.seed);
  const root = new THREE.Group(); root.name = 'shafts';
  const dir = arr3(o.dir).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, -1, 0), dir);
  const origins = o.origins ? o.origins.map(arr3) : Array.from({ length: o.count }, () => V3(o.center[0] + (r() - 0.5) * o.area[0], o.y, o.center[1] + (r() - 0.5) * o.area[1]));
  const noise = getNoiseTex(8, 256);
  origins.forEach((org, i) => {
    const rad = lerp(o.radius[0], o.radius[1], r());
    const g = new THREE.CylinderGeometry(rad * 0.7, rad * 1.25, o.length, 20, 1, true);
    g.translate(0, -o.length / 2, 0);
    // uv.y: 0 at the top (origin) → 1 at the bottom
    const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setY(k, 1 - uv.getY(k));
    const m = new THREE.ShaderMaterial({ vertexShader: SHAFT_V, fragmentShader: SHAFT_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, fog: false, toneMapped: false,
      uniforms: { tNoise: { value: noise }, uTime: RU.uTime, uIntensity: { value: o.intensity * (0.6 + r() * 0.6) }, uSeed: { value: r() * 10 }, uColor: { value: C(o.color) } } });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.copy(org); mesh.quaternion.copy(q); mesh.renderOrder = 25; mesh.frustumCulled = false;
    root.add(mesh);
  });
  return { root, update() {} };
}

// ═════════════════════════════════════════════ lightning ══════════════════════════════════════════════════════════
function boltPath(a, b, r, depth, out, branches, width) {
  // midpoint displacement
  let pts = [a.clone(), b.clone()];
  const len = a.distanceTo(b);
  let off = len * 0.1;
  for (let d = 0; d < depth; d++) {
    const np = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const m = pts[i].clone().add(pts[i + 1]).multiplyScalar(0.5);
      m.x += (r() - 0.5) * off * 2; m.z += (r() - 0.5) * off * 2; m.y += (r() - 0.5) * off * 0.5;
      np.push(m, pts[i + 1]);
    }
    pts = np; off *= 0.62;
  }
  out.push({ pts, width });
  if (branches > 0) {
    for (let k = 0; k < branches; k++) {
      const i = Math.floor(lerp(0.15, 0.7, r()) * pts.length);
      const s = pts[i], dir = pts[Math.min(pts.length - 1, i + 4)].clone().sub(s).normalize();
      dir.x += (r() - 0.5) * 1.6; dir.z += (r() - 0.5) * 1.6; dir.normalize();
      const e = s.clone().addScaledVector(dir, len * lerp(0.12, 0.3, r()));
      boltPath(s, e, r, depth - 2, out, 0, width * 0.45);
    }
  }
}
const BOLT_V = /* glsl */`
attribute vec3 aNext; attribute float aSide; attribute float aW;
varying float vSide; varying float vW;
void main() {
  vec3 dir = normalize(aNext - position);
  vec3 toCam = normalize(cameraPosition - position);
  vec3 side = normalize(cross(dir, toCam));
  vSide = aSide; vW = aW;
  vec3 wp = position + side * aSide * aW;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const BOLT_F = /* glsl */`
precision highp float;
varying float vSide; varying float vW;
uniform vec3 uColor; uniform float uI;
void main() {
  float x = abs(vSide);
  float core = smoothstep(0.3, 0.0, x), glow = pow(1.0 - x, 4.0);
  gl_FragColor = vec4(uColor * (core * 24.0 + glow * 2.0) * uI, 1.0);
}`;
function boltMesh(paths, color) {
  const pos = [], next = [], side = [], w = [], idx = [];
  let base = 0;
  for (const { pts, width } of paths) {
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], n = pts[Math.min(pts.length - 1, i + 1)], pr = pts[Math.max(0, i - 1)];
      const nx = i === pts.length - 1 ? p.clone().add(p.clone().sub(pr)) : n;
      for (const s of [-1, 1]) { pos.push(p.x, p.y, p.z); next.push(nx.x, nx.y, nx.z); side.push(s); w.push(width * (1 - 0.5 * i / pts.length)); }
      if (i < pts.length - 1) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    base += pts.length * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aNext', new THREE.Float32BufferAttribute(next, 3));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1)); g.setAttribute('aW', new THREE.Float32BufferAttribute(w, 1));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ vertexShader: BOLT_V, fragmentShader: BOLT_F, uniforms: { uColor: { value: C(color) }, uI: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 60;
  return mesh;
}
// flash envelope of one strike at local time x (s): leader flicker then 2-4 return strokes decaying over ~0.8 s
function strikeEnvelope(x, seed, power = 1) {
  if (x < 0 || x > 1.6) return 0;
  const r = rng(seed * 31 + 7);
  const n = 2 + Math.floor(r() * 3);
  let f = 0, tt = 0;
  for (let k = 0; k < n; k++) {
    const dur = 0.05 + r() * 0.06, amp = (k === 0 ? 1 : 0.5 + r() * 0.5);
    const dx = x - tt;
    if (dx >= 0) f = Math.max(f, amp * Math.exp(-dx / dur));
    tt += 0.07 + r() * 0.18;
  }
  f += 0.15 * Math.exp(-Math.max(0, x - tt) / 0.5) * (x > 0.02 ? 1 : 0);
  return f * power;
}
export function makeLightning(opts = {}) {
  const o = { strikes: [], light: true, color: '#cfe0ff', branches: 6, ...opts };
  const root = new THREE.Group(); root.name = 'lightning';
  const bolts = o.strikes.map((s, i) => {
    const r = rng((s.seed ?? i + 1) * 13.7);
    const top = arr3(s.pos || [0, 120, -200]), gnd = arr3(s.ground || [top.x + 20, 0, top.z]);
    const paths = []; boltPath(top, gnd, r, 8, paths, o.branches, (s.width ?? 0.9) * top.distanceTo(gnd) / 120);
    const mesh = boltMesh(paths, o.color); mesh.visible = false;
    root.add(mesh);
    return { s, mesh, top, gnd };
  });
  let light = null;
  if (o.light) {
    light = new THREE.DirectionalLight(o.color, 0);
    root.add(light); root.add(light.target);
  }
  return {
    root, light, bolts,
    strikeAt(t) { return o.strikes.reduce((m, s) => Math.max(m, strikeEnvelope(t - s.t, s.seed ?? 1, s.power ?? 1)), 0); },
    update(t) {
      let flash = 0, best = null, bestF = 0;
      for (const b of bolts) {
        const f = strikeEnvelope(t - b.s.t, b.s.seed ?? 1, b.s.power ?? 1);
        b.mesh.visible = f > 0.12;
        b.mesh.material.uniforms.uI.value = f;
        if (f > bestF) { bestF = f; best = b; }
        flash = Math.max(flash, f);
      }
      if (light) {
        light.intensity = flash * 2.5;
        if (best) { light.position.copy(best.top).multiplyScalar(0.2); light.target.position.set(0, 0, 0); }
      }
      RU.uFlash.value = flash;
      return flash;
    },
    flashDir() { const b = bolts.find((x) => x.mesh.visible) || bolts[0]; return b ? b.top.clone().normalize() : V3(0, 1, 0); },
  };
}
