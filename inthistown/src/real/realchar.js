/*
 * src/real/realchar.js — "RTX realistic Roblox" look for the blocky characters of src/characters.js.
 * The figure keeps its exact blocky shape (geometry untouched); only materials change:
 *   - every vertex-coloured joint mesh gets ONE MeshPhysicalMaterial per character whose shader picks a surface
 *     model per vertex (attribute aMat, classified once from the vertex colour vs. the character's spec colours and the
 *     joint the mesh hangs on):
 *       0 skin    soft sheen, pore-scale bump, low specular            1 hair   strand bump, sheen, slightly glossy
 *       2 top     knit/fleece weave bump, fabric sheen, rough          3 accent fabric (drawstrings, cuffs, stripes)
 *       4 bottom  twill (denim/chino) bump, rough                      5 shoes  rubber / leather, fine grain
 *       6 other   glossy plastic (accessories: headphones, glasses frames…)
 *     detail is projected tri-planar in the joint's object space, so it sticks to the moving limbs.
 *   - rain wetness (setWet 0..1): darker saturated fabric, clearcoat water film with bead droplets on fabric and
 *     skin, glossier hair; decals (face, emblem, fade shell) get a matching wet gloss.
 *   - optional dripping: drops gather and fall from the hoodie hem, sleeves, chin and hands (character-local).
 *   Face decals stay readable: they keep their painted textures (face() still swaps expressions); only roughness/
 *   specular change.
 *
 * ─── API ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   makeReal(character, opts?) → real   (call once per character, after makeCharacter / ctx.cast[id])
 *     opts: wet 0 (0..1), drips false | count (e.g. 14), detail 1 (bump strength ×), sheen 1, fabricScale 16
 *           (weave tiles per metre), envMapIntensity 1, clearcoat 1 (max water film), dripColor '#dfe7ea'
 *   real.setWet(v)            0..1, cheap (uniform)
 *   real.update(t)            animates drips (pure function of t); no-op without drips
 *   real.material             the shared body MeshPhysicalMaterial (tweak .roughness etc. if needed)
 *   real.uniforms             { uWet, uDetail, uFabricScale, … } shader uniforms
 *   makeRealCast(cast, ids, opts) → { [id]: real }   convenience for several characters
 * Works with MAIN.me from cast.js (black knight hoodie, grey pants, white shoes, fade, headphones) and any other spec.
 */
import * as THREE from 'three';
import { rng, lerp } from '../lib/util.js';
import { getPBR, getNoiseTex } from './textures.js';
import { RU } from './materials.js';

const JOINT_ALLOW = {
  head: [0, 1, 6], torso: [2, 3, 0, 6], hips: [4, 2, 3], armL: [2, 3, 0], armR: [2, 3, 0], foreArmL: [2, 3, 0], foreArmR: [2, 3, 0],
  fingerL: [0], fingerR: [0], handL: [0], handR: [0], legL: [4, 3, 2], legR: [4, 3, 2], shinL: [4, 3, 5], shinR: [4, 3, 5],
  footL: [5, 4, 3], footR: [5, 4, 3], skirt: [4, 2, 3],
};
function jointOf(o) { for (let p = o.parent; p; p = p.parent) { if (JOINT_ALLOW[p.name]) return p.name; if (p.name && p.name.startsWith('acc:')) return 'acc'; } return null; }
const toLin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const gam = (v) => Math.pow(Math.max(0, v), 1 / 2.2);

const BODY_V_PARS = /* glsl */`
attribute float aMat;
varying float vMat; varying vec3 vOP; varying vec3 vON;`;
const BODY_V = /* glsl */`
vMat = aMat; vOP = position; vON = normal;`;
const BODY_F_PARS = /* glsl */`
varying float vMat; varying vec3 vOP; varying vec3 vON;
uniform sampler2D tFab, tDen, tNz; uniform float uWet, uDetail, uFabricScale, uSheenK, uCoat;
float mIs(float id) { return 1.0 - step(0.5, abs(vMat - id)); }
// tri-planar (dominant-axis blend) height lookup in object space
vec3 rW(vec3 n) { vec3 w = pow(abs(n), vec3(6.0)); return w / (w.x + w.y + w.z + 1e-5); }
float rTriH(sampler2D t, vec3 p, vec3 w, int ch) {
  vec4 a = texture2D(t, p.zy), b = texture2D(t, p.xz), c = texture2D(t, p.xy);
  vec4 s = a * w.x + b * w.y + c * w.z;
  return ch == 2 ? s.b : (ch == 1 ? s.g : s.r);
}
float rDetailH(vec3 p, vec3 w) {
  float fab = mIs(2.0) + mIs(3.0), den = mIs(4.0), skin = mIs(0.0), hair = mIs(1.0), shoe = mIs(5.0);
  float h = 0.0;
  if (fab > 0.5) h = rTriH(tFab, p * uFabricScale, w, 2);
  else if (den > 0.5) h = rTriH(tDen, p * uFabricScale * 1.3, w, 2);
  else if (hair > 0.5) h = rTriH(tNz, p * vec3(9.0, 1.2, 9.0), w, 0) * 0.8 + rTriH(tNz, p * 22.0, w, 1) * 0.2;
  else if (skin > 0.5) h = rTriH(tNz, p * 7.0, w, 1) * 0.25;
  else if (shoe > 0.5) h = rTriH(tNz, p * 14.0, w, 2) * 0.45;
  else h = rTriH(tNz, p * 3.0, w, 3) * 0.05;
  return h;
}
// water beads (only meaningful when wet): returns (height, coverage). Sparse, random sizes, denser on up-facing
// surfaces (shoulders, head top, thighs), faded out once a bead would be smaller than ~1.5 px (no sparkle aliasing).
vec2 rBeads(vec3 p, vec3 n) {
  vec3 an = abs(n);
  vec2 q = an.x > an.y && an.x > an.z ? p.zy : (an.y > an.z ? p.xz : p.xy);
  q *= 46.0;
  vec2 cell = floor(q), f = fract(q) - 0.5;
  float h1 = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  float h2 = fract(sin(dot(cell, vec2(39.346, 11.135))) * 43758.5453);
  float h3 = fract(sin(dot(cell, vec2(73.156, 52.235))) * 43758.5453);
  vec2 c = (vec2(h2, h3) - 0.5) * 0.6;
  float rr = 0.06 + 0.3 * h2 * h2;
  // drops run: elongate downward on vertical faces
  vec2 dd = f - c; if (an.y < 0.5) dd.y *= 0.65 + 0.35 * h3;
  float d = length(dd);
  float dens = 0.22 + 0.45 * max(0.0, n.y);
  float on = step(1.0 - dens, h1);
  float hb = sqrt(max(0.0, rr * rr - d * d)) / rr * on;
  return vec2(hb, step(d, rr) * on);
}
float rWetMat() { return mIs(2.0) + mIs(3.0) + mIs(4.0) * 0.9 + mIs(1.0) * 0.8 + mIs(0.0) * 0.5 + mIs(5.0) * 0.4 + mIs(6.0) * 0.2; }`;

export function makeReal(ch, opts = {}) {
  const o = { wet: 0, drips: false, detail: 1, sheen: 1, fabricScale: 16, envMapIntensity: 1, clearcoat: 1, dripColor: '#dfe7ea', ...opts };
  const S = ch.spec || {};
  const pal = [];
  const addPal = (hex, id) => { if (hex) pal.push({ c: toLin(hex), id }); };
  addPal(S.skin || '#f1c7a1', 0);
  addPal(S.hair && S.hair.color, 1);
  addPal(S.top && S.top.color, 2);
  addPal(S.top && S.top.accent, 3);
  addPal(S.bottom && S.bottom.color, 4);
  addPal(typeof S.shoes === 'string' ? S.shoes : '#f2f2f2', 5);
  const uniforms = {
    tFab: { value: getPBR('fabric').data }, tDen: { value: getPBR('denim').data }, tNz: { value: getNoiseTex(11, 256) },
    uWet: { value: o.wet }, uDetail: { value: o.detail }, uFabricScale: { value: o.fabricScale }, uSheenK: { value: o.sheen }, uCoat: { value: o.clearcoat },
  };
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 1, metalness: 0, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffffff'),
    clearcoat: 1, clearcoatRoughness: 0.08, specularIntensity: 1, envMapIntensity: o.envMapIntensity,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + BODY_V_PARS)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + BODY_V);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + BODY_F_PARS + '\nfloat rWetK = 0.0; vec2 rBead = vec2(0.0); vec3 rTriWt = vec3(0.0);')
      .replace('#include <color_fragment>', `#include <color_fragment>
  rTriWt = rW(normalize(vON));
  rWetK = uWet * rWetMat();
  // fabric soaks: darker and a bit more saturated
  { vec3 c = diffuseColor.rgb; float l = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 wetC = mix(vec3(l), c, 1.25) * mix(1.0, 0.45, (mIs(2.0) + mIs(3.0) + mIs(4.0)));
    diffuseColor.rgb = mix(c, wetC, rWetK * 0.9); }
  float rFw = length(fwidth(vOP));
  float rBeadVis = smoothstep(0.0035, 0.0012, rFw);
  rBead = rBeads(vOP, vON) * step(0.02, uWet) * rBeadVis;
  // black cotton is never albedo 0: lift the floor so the weave and sheen can read
  diffuseColor.rgb = max(diffuseColor.rgb, vec3(0.028) * (mIs(2.0) + mIs(3.0) + mIs(4.0)));
  // subtle AO-ish darkening in the weave valleys
  diffuseColor.rgb *= mix(1.0, 0.82 + 0.3 * rDetailH(vOP, rTriWt), mIs(2.0) + mIs(3.0) + mIs(4.0));`)
      .replace('#include <roughnessmap_fragment>', `
  float roughnessFactor = 0.5 * mIs(0.0) + 0.42 * mIs(1.0) + 0.93 * mIs(2.0) + 0.88 * mIs(3.0) + 0.86 * mIs(4.0) + 0.5 * mIs(5.0) + 0.32 * mIs(6.0);
  roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.65, rWetK);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec3 dpx = dFdx(vOP), dpy = dFdy(vOP);
    float h0 = rDetailH(vOP, rTriWt), hx = rDetailH(vOP + dpx, rTriWt), hy = rDetailH(vOP + dpy, rTriWt);
    float k = uDetail * (0.12 * (mIs(2.0) + mIs(3.0)) + 0.1 * mIs(4.0) + 0.25 * mIs(1.0) + 0.04 * mIs(0.0) + 0.05 * mIs(5.0) + 0.01 * mIs(6.0));
    normal = rPerturbB(-vViewPosition, normal, vec2(hx - h0, hy - h0) * k / max(1e-4, length(dpx) + length(dpy)) * 0.01, faceDirection); }`)
      .replace('#include <clearcoat_normal_fragment_maps>', `#include <clearcoat_normal_fragment_maps>
  { vec3 dpx = dFdx(vOP), dpy = dFdy(vOP);
    float b0 = rBeads(vOP, vON).x, bx = rBeads(vOP + dpx, vON).x, by = rBeads(vOP + dpy, vON).x;
    clearcoatNormal = rPerturbB(-vViewPosition, clearcoatNormal, vec2(bx - b0, by - b0) * 0.003 * rBeadVis * uWet / max(1e-4, length(dpx) + length(dpy)), faceDirection); }`)
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
  {
    float fab = mIs(2.0) + mIs(3.0) + mIs(4.0);
    material.sheenColor = mix(vec3(0.0), mix(diffuseColor.rgb * 0.8 + 0.22, vec3(0.55), 0.35), fab * uSheenK) + vec3(0.08) * mIs(0.0) * uSheenK + diffuseColor.rgb * 0.5 * mIs(1.0) * uSheenK;
    material.sheenColor *= (1.0 - rWetK * 0.6);
    material.sheenRoughness = mix(0.5, 0.35, mIs(1.0));
    material.specularColor *= mix(1.0, 0.45, mIs(0.0) + fab * 0.5);
    material.clearcoat = uCoat * clamp(rWetK * (0.25 + 0.75 * rBead.y) + 0.35 * mIs(6.0) + 0.15 * mIs(5.0) * (1.0 - fab), 0.0, 1.0);
    material.clearcoatRoughness = mix(0.32, 0.03, rBead.y);
  }`);
    // derivative bump helper (own copy so it never collides with three's bumpmap chunk)
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
vec3 rPerturbB(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection) {
  vec3 vSigmaX = normalize(dFdx(surf_pos)); vec3 vSigmaY = normalize(dFdy(surf_pos)); vec3 vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN); vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDirection;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}`);
  };
  material.customProgramCacheKey = () => 'realBody';

  const decals = [];
  ch.root.traverse((m) => {
    if (!m.isMesh) return;
    const mat0 = m.material;
    if (mat0 && mat0.vertexColors && m.geometry.attributes.color) {
      const joint = jointOf(m);
      const allow = joint === 'acc' ? [6] : (JOINT_ALLOW[joint] || [0, 1, 2, 3, 4, 5, 6]);
      const col = m.geometry.attributes.color, n = col.count, ids = new Float32Array(n);
      const cache = new Map();
      for (let i = 0; i < n; i++) {
        const r = col.getX(i), g = col.getY(i), b = col.getZ(i);
        const key = ((r * 255) | 0) * 65536 + ((g * 255) | 0) * 256 + ((b * 255) | 0);
        let id = cache.get(key);
        if (id === undefined) {
          id = 6; let best = 1e9;
          if (allow.length === 1) id = allow[0];
          else {
            for (const p of pal) {
              if (!allow.includes(p.id)) continue;
              const d = (gam(r) - gam(p.c[0])) ** 2 + (gam(g) - gam(p.c[1])) ** 2 + (gam(b) - gam(p.c[2])) ** 2;
              if (d < best) { best = d; id = p.id; }
            }
            if (best > 0.09) id = allow.includes(6) ? 6 : id;   // far from every spec colour → trim / plastic
            if (mat0.roughness < 0.4 || mat0.metalness > 0.2) id = 6;     // 'gloss' / 'gold' kinds
          }
          cache.set(key, id);
        }
        ids[i] = id;
      }
      m.geometry.setAttribute('aMat', new THREE.BufferAttribute(ids, 1));
      m.material = material;
    } else if (mat0 && mat0.map) {
      // decals (face, emblem, fade shell, party hat): own copy, wet-aware gloss, keep the painted texture
      const d = m.name === 'face' ? mat0 : mat0.clone();
      d.roughness = m.name === 'face' ? 0.55 : 0.75; d.envMapIntensity = o.envMapIntensity * 0.8;
      if (m.name === 'face') patchFace(d, uniforms);
      m.material = d;
      decals.push({ mat: d, base: d.roughness, color: d.color.clone() });
    }
  });

  // ── drips: drops gather at the hoodie hem / sleeves / chin / hands and fall, character-local
  let drips = null;
  const dripN = o.drips === true ? 14 : (o.drips | 0);
  if (dripN > 0) {
    const r = rng(77);
    const J = ch.joints;
    const sources = [];
    for (let i = 0; i < dripN; i++) {
      const k = i % 5;
      if (k <= 1) sources.push({ joint: J.hips, p: new THREE.Vector3((r() - 0.5) * 0.5, -0.1, (r() - 0.5) * 0.28) });
      else if (k === 2) sources.push({ joint: J.head, p: new THREE.Vector3((r() - 0.5) * 0.4, 0.0, 0.15 + r() * 0.1) });
      else sources.push({ joint: r() < 0.5 ? (J.foreArmL || J.armL) : (J.foreArmR || J.armR), p: new THREE.Vector3((r() - 0.5) * 0.1, -0.62, (r() - 0.5) * 0.1) });
    }
    const per = sources.map(() => lerp(0.8, 2.0, r())), ph = sources.map(() => r());
    const dm = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, clearcoat: 1, envMapIntensity: 2.5, emissive: new THREE.Color(o.dripColor), emissiveIntensity: 0.05 });
    drips = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), dm, dripN);
    drips.frustumCulled = false;
    ch.root.add(drips);
    drips.userData.sources = sources; drips.userData.per = per; drips.userData.ph = ph;
  }
  const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  const real = {
    ch, material, uniforms, decals, drips,
    setWet(v) {
      uniforms.uWet.value = v;
      for (const d of decals) { d.mat.roughness = lerp(d.base, 0.18, v); d.mat.color.copy(d.color).multiplyScalar(1 - 0.18 * v); }
      return real;
    },
    update(t) {
      if (!drips) return;
      ch.root.updateMatrixWorld(true);
      _inv.copy(ch.root.matrixWorld).invert();
      const { sources, per, ph } = drips.userData;
      sources.forEach((s, i) => {
        const P = per[i], u = t / P + ph[i], a = u - Math.floor(u), tt = a * P;
        _p.copy(s.p).applyMatrix4(s.joint.matrixWorld).applyMatrix4(_inv);
        let sc = 0.008 + 0.006 * Math.min(1, tt / 0.5), y = _p.y, st = 1.2;
        if (tt > 0.5) { const f = tt - 0.5; y -= 0.5 * 9.81 * f * f; st = 1 + Math.min(3, f * 6); if (y < -0.05) sc = 0; }
        _m.compose(_s.set(_p.x, y, _p.z), _q, new THREE.Vector3(sc, sc * st, sc));
        drips.setMatrixAt(i, _m);
      });
      drips.instanceMatrix.needsUpdate = true;
    },
  };
  real.setWet(o.wet);
  return real;
}

// face decal: darker toward the head's bevelled edges (fake curvature / AO), faint pore bump, subsurface warmth
function patchFace(mat, uniforms) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.tNz = uniforms.tNz; shader.uniforms.uWet = uniforms.uWet;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tNz; uniform float uWet;')
      .replace('#include <map_fragment>', `#include <map_fragment>
  { vec2 e = abs(vMapUv - 0.5) * 2.0; float edge = max(e.x, e.y);
    diffuseColor.rgb *= mix(1.0, 0.72, smoothstep(0.62, 1.0, edge)) * (0.96 + 0.08 * texture2D(tNz, vMapUv * 3.0).r);
    diffuseColor.rgb *= vec3(1.0, 0.97, 0.95); }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { float h0 = texture2D(tNz, vMapUv * 9.0).g, hx = texture2D(tNz, vMapUv * 9.0 + dFdx(vMapUv * 9.0)).g, hy = texture2D(tNz, vMapUv * 9.0 + dFdy(vMapUv * 9.0)).g;
    vec3 sx = normalize(dFdx(-vViewPosition)), sy = normalize(dFdy(-vViewPosition));
    normal = normalize(normal - (cross(sy, normal) * (hx - h0) + cross(normal, sx) * (hy - h0)) * 0.35); }`);
  };
  mat.customProgramCacheKey = () => 'realFace';
  mat.needsUpdate = true;
}

export function makeRealCast(cast, ids, opts = {}) {
  const out = {};
  for (const id of ids) if (cast[id]) out[id] = makeReal(cast[id], opts);
  return out;
}
