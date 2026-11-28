/*
 * src/real/materials.js — PBR material helpers shared by the photoreal kit (env.js, weather.js, realchar.js).
 *
 * ─── Global per-frame uniforms ─────────────────────────────────────────────────────────────────────────────────────
 *   RU = { uTime, uWind (vec2 m/s), uFlash (0..1 lightning), uRain (0..1 wetness/rain intensity) }  shared uniform objects:
 *   every material patched by this kit references them, so ONE call per frame updates everything:
 *   setFrame({ t, wind?, flash?, rain? })  once per frame, early (test_shots.js: in set.update). Omitted fields reset to defaults.
 *
 *   PRE_RENDER / runPreRender(scene, camera, t) / inScene(obj, scene): render-time CPU hooks (see below; post.js runs them).
 *
 * ─── Material factories ────────────────────────────────────────────────────────────────────────────────────────────
 *   pbr(name, opts) → MeshStandardMaterial (or MeshPhysicalMaterial if opts.physical) with the textures.js set `name`
 *     opts: repeat [rx, ry] | number, color (tint, default white), roughness (× map, default 1), metalness 0,
 *           normalScale 1, envMapIntensity 1, side, alphaTest (foliage default 0.45), physical:false, + any material prop
 *   triplanar(material, setName, opts) → material (patched in place, returns it). Projects the texture set from 3 axes:
 *     albedo × diffuse, roughness × roughness, AO on indirect light, bump from the height channel (forward differences,
 *     per pixel). opts: scale 0.5 (tiles per metre), bump 1, sharpness 4, space 'world' | 'object' (object = sticks to a
 *     moving/skinned mesh), albedo true (false → only roughness/bump/AO detail, e.g. for vertex-coloured characters),
 *     roughnessMix 1 (how strongly the map's roughness applies), aoStrength 1, slopeTint null | { color, amount, up } —
 *     tints up-facing surfaces (moss on rocks / bark): amount 0..1, up = normal.y threshold (default 0.55).
 *   wetSurface(material, opts) → material. Rain-soaked look for ground-like materials, in world space:
 *     wet 0.8 (global darkening + gloss), puddles 0 (0..1 coverage of standing water, collects in low height texels and
 *     low-frequency noise basins, only on up-facing surfaces), puddleScale 0.08 (1/m), ripples 1 (animated rain-drop
 *     rings in the puddles, driven by RU.uTime × RU.uRain), rippleScale 2.6 (cells per m), puddleColor '#0b0d0e'.
 *     Works on top of pbr()/triplanar() (call it last). Requires the material to have a height source: uses the
 *     roughnessMap's B channel when present (pbr sets), else noise only.
 *   windSway(material, opts) → material. Vertex wind for vegetation (works with InstancedMesh): displacement grows with
 *     local height^2, phase from instance position, gusts from RU.uTime. opts: amp 0.15 (m at height 1), freq 1.3,
 *     heightScale 1 (local units per "1 height"), flutter 0.02 (leaf-card jitter), axis 'y'.
 *   foliage(material, opts) → material. Leaf look: light transmitted through the blade (emissive term ∝ albedo, so backlit
 *     leaves glow instead of going black) and a wet sheen. opts: translucency 0.12 (scene-light level), wet 0.5.
 *   All patches chain: each helper appends to material.userData.realPatches and recompiles via a shared onBeforeCompile;
 *   customProgramCacheKey includes the patch list so programs are shared between identical materials.
 */
import * as THREE from 'three';
import { getPBR, getNoiseTex } from './textures.js';

export const RU = {
  uTime: { value: 0 }, uWind: { value: new THREE.Vector2(1.5, 0.4) }, uFlash: { value: 0 }, uRain: { value: 1 },
};
// Render-time hooks: functions (camera, t) run by post.js right before the scene is drawn, i.e. after the shot has placed
// the camera. Anything that must follow the *rendering* camera on the CPU (splash layout, ocean re-centring) registers
// here instead of computing in update(t) (which runs before the camera is final → one-frame lag → non-determinism).
// Each hook receives { camera, t, scene } and should early-out when its object is not in the scene.
export const PRE_RENDER = new Set();
export function runPreRender(scene, camera, t) { for (const f of PRE_RENDER) f({ scene, camera, t }); }
export function inScene(obj, scene) { for (let o = obj; o; o = o.parent) { if (o === scene) return true; if (!o.visible) return false; } return false; }
// Every field not given is RESET to its default (wind [1.5, 0.4], flash 0, rain 1): these uniforms are global, so a
// value left over from another shot (e.g. a lightning flash) must never leak into the next frame. Call it once per frame
// (realSet-style set.update does) BEFORE anything that sets flash (makeLightning.update) runs.
export function setFrame({ t, wind = [1.5, 0.4], flash = 0, rain = 1 } = {}) {
  if (t != null) RU.uTime.value = t;
  RU.uWind.value.set(wind[0], wind[1]);
  RU.uFlash.value = flash;
  RU.uRain.value = rain;
}

// ═════════════════════════════════════════════ patch plumbing ═══════════════════════════════════════════════════
function addPatch(material, key, fn) {
  const ud = material.userData;
  if (!ud.realPatches) {
    ud.realPatches = [];
    material.onBeforeCompile = (shader, renderer) => {
      shader.uniforms.uTime = RU.uTime; shader.uniforms.uWind = RU.uWind; shader.uniforms.uFlash = RU.uFlash; shader.uniforms.uRain = RU.uRain;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform vec2 uWind; uniform float uRain;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform vec2 uWind; uniform float uFlash; uniform float uRain;');
      for (const p of ud.realPatches) p.fn(shader, renderer);
    };
    material.customProgramCacheKey = () => ud.realPatches.map((p) => p.key).join('|');
  }
  ud.realPatches = ud.realPatches.filter((p) => !p.key.startsWith(key.split(':')[0] + ':'));
  ud.realPatches.push({ key, fn });
  material.needsUpdate = true;
  return material;
}
function inject(src, anchor, code, after = true) {
  if (!src.includes(anchor)) throw new Error(`materials.js: shader anchor not found: ${anchor}`);
  return src.replace(anchor, after ? `${anchor}\n${code}` : `${code}\n${anchor}`);
}
// world-space position/normal varyings (instancing aware); object-space ones for 'object' projection
const WORLD_VARY_V = /* glsl */`
  { vec4 rwp = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    rwp = instanceMatrix * rwp;
  #endif
    rwp = modelMatrix * rwp; vRWorldPos = rwp.xyz;
    vec3 rwn = objectNormal;
  #ifdef USE_INSTANCING
    rwn = mat3(instanceMatrix) * rwn;
  #endif
    vRWorldNormal = normalize(mat3(modelMatrix) * rwn);
    vRObjPos = position; vRObjNormal = normal; }`;
function ensureVaryings(shader) {
  if (shader.vertexShader.includes('vRWorldPos')) return;
  shader.vertexShader = inject(shader.vertexShader, '#include <common>', 'varying vec3 vRWorldPos; varying vec3 vRWorldNormal; varying vec3 vRObjPos; varying vec3 vRObjNormal;');
  shader.vertexShader = inject(shader.vertexShader, '#include <project_vertex>', WORLD_VARY_V);
  shader.fragmentShader = inject(shader.fragmentShader, '#include <common>', `varying vec3 vRWorldPos; varying vec3 vRWorldNormal; varying vec3 vRObjPos; varying vec3 vRObjNormal;
vec3 rPerturb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection) {
  vec3 vSigmaX = normalize(dFdx(surf_pos)); vec3 vSigmaY = normalize(dFdy(surf_pos)); vec3 vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN); vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDirection;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
float rHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }`, false);
}

// ═════════════════════════════════════════════ factories ═════════════════════════════════════════════════════════
const FOLIAGE = new Set(['leaf', 'leaves', 'fern', 'palm']);
export function pbr(name, opts = {}) {
  const { repeat = 1, color = '#ffffff', roughness = 1, metalness = 0, normalScale = 1, envMapIntensity = 1, physical = false, texOpts, ...rest } = opts;
  const rep = Array.isArray(repeat) ? repeat : [repeat, repeat];
  const set = getPBR(name, texOpts).repeat(rep[0], rep[1]);
  const C = physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const m = new C({
    map: set.map, normalMap: set.normalMap, roughnessMap: set.roughnessMap, aoMap: null,
    color: new THREE.Color(color), roughness, metalness, envMapIntensity,
    normalScale: new THREE.Vector2(normalScale, normalScale),
    ...(FOLIAGE.has(name) ? { alphaTest: 0.45, side: THREE.DoubleSide } : {}),
    ...rest,
  });
  m.userData.pbrSet = set;
  return m;
}

export function triplanar(material, setName, opts = {}) {
  const { scale = 0.5, bump = 1, sharpness = 4, space = 'world', albedo = true, roughnessMix = 1, aoStrength = 1, slopeTint = null } = opts;
  const set = getPBR(setName);
  material.userData.triUniforms = {
    tTriMap: { value: set.map }, tTriData: { value: set.data }, uTriScale: { value: scale }, uTriBump: { value: bump },
    uTriSharp: { value: sharpness }, uTriRough: { value: roughnessMix }, uTriAO: { value: aoStrength },
    uSlopeColor: { value: new THREE.Color(slopeTint ? slopeTint.color : '#3a4a2a') }, uSlopeAmt: { value: slopeTint ? slopeTint.amount : 0 },
    uSlopeUp: { value: slopeTint ? slopeTint.up ?? 0.55 : 0.55 },
  };
  const P = space === 'object' ? 'vRObjPos' : 'vRWorldPos', N = space === 'object' ? 'vRObjNormal' : 'vRWorldNormal';
  return addPatch(material, `tri:${space}:${albedo ? 1 : 0}:${slopeTint ? 1 : 0}`, (shader) => {
    Object.assign(shader.uniforms, material.userData.triUniforms);
    ensureVaryings(shader);
    let fs = shader.fragmentShader;
    fs = inject(fs, '#include <common>', /* glsl */`
uniform sampler2D tTriMap, tTriData; uniform float uTriScale, uTriBump, uTriSharp, uTriRough, uTriAO, uSlopeAmt, uSlopeUp; uniform vec3 uSlopeColor;
vec3 triW(vec3 n) { vec3 w = pow(abs(n), vec3(uTriSharp)); return w / (w.x + w.y + w.z + 1e-5); }
vec4 triTex(sampler2D t, vec3 p, vec3 w) {
  return texture2D(t, p.zy) * w.x + texture2D(t, p.xz) * w.y + texture2D(t, p.xy) * w.z;
}
// bump height: only the dominant projection (1 tap instead of 3; the blend zone is narrow with sharpness ≥ 4)
float triH(vec3 p, vec3 w) {
  return w.x > w.y && w.x > w.z ? texture2D(tTriData, p.zy).b : (w.y > w.z ? texture2D(tTriData, p.xz).b : texture2D(tTriData, p.xy).b);
}`);
    fs = inject(fs, '#include <map_fragment>', /* glsl */`
  vec3 triP = ${P} * uTriScale;
  vec3 triWt = triW(normalize(${N}));
  vec4 triD = triTex(tTriData, triP, triWt);
  ${albedo ? 'diffuseColor.rgb *= triTex(tTriMap, triP, triWt).rgb;' : ''}
  ${slopeTint ? `{ float up = smoothstep(uSlopeUp - 0.15, uSlopeUp + 0.2, normalize(vRWorldNormal).y) * smoothstep(0.25, 0.6, triD.b + 0.2);
     diffuseColor.rgb = mix(diffuseColor.rgb, uSlopeColor * (0.6 + 0.8 * triD.b), up * uSlopeAmt); }` : ''}`);
    fs = inject(fs, '#include <roughnessmap_fragment>', `roughnessFactor *= mix(1.0, triD.g * 1.15, uTriRough);`);
    fs = inject(fs, '#include <normal_fragment_maps>', /* glsl */`
  { vec3 dpx = dFdx(triP), dpy = dFdy(triP);
    float h0 = triH(triP, triWt), hx = triH(triP + dpx, triWt), hy = triH(triP + dpy, triWt);
    normal = rPerturb(-vViewPosition, normal, vec2(hx - h0, hy - h0) * uTriBump * 0.6, faceDirection); }`);
    fs = inject(fs, '#include <aomap_fragment>', `{ float tao = mix(1.0, triD.r, uTriAO); reflectedLight.indirectDiffuse *= tao; reflectedLight.indirectSpecular *= tao; reflectedLight.directDiffuse *= mix(1.0, tao, 0.5); }`);
    shader.fragmentShader = fs;
  });
}

export function wetSurface(material, opts = {}) {
  const { wet = 0.8, puddles = 0, puddleScale = 0.08, ripples = 1, rippleScale = 2.6, puddleColor = '#0b0d0e', puddleLevel = 0.5 } = opts;
  material.userData.wetUniforms = {
    uWet: { value: wet }, uPuddles: { value: puddles }, uPuddleScale: { value: puddleScale }, uRipples: { value: ripples },
    uRippleScale: { value: rippleScale }, uPuddleColor: { value: new THREE.Color(puddleColor) }, tWetNoise: { value: getNoiseTex(9, 256) },
    uPuddleLevel: { value: puddleLevel },
  };
  const hasH = !!material.roughnessMap;
  return addPatch(material, `wet:${hasH ? 1 : 0}`, (shader) => {
    Object.assign(shader.uniforms, material.userData.wetUniforms);
    ensureVaryings(shader);
    let fs = shader.fragmentShader;
    fs = inject(fs, '#include <common>', /* glsl */`
uniform float uWet, uPuddles, uPuddleScale, uRipples, uRippleScale, uPuddleLevel; uniform vec3 uPuddleColor; uniform sampler2D tWetNoise;
float wetMask = 0.0;
// one layer of rain-drop rings: returns the xz slope of the water surface
vec2 rainRings(vec2 p, float t, float seed) {
  vec2 cell = floor(p); vec2 f = fract(p) - 0.5;
  float h = rHash(cell + seed);
  vec2 c = (vec2(rHash(cell + seed + 1.37), rHash(cell + seed + 7.11)) - 0.5) * 0.5;
  float ph = fract(t * (0.9 + 0.5 * h) + h * 7.0);
  vec2 d = f - c; float r = length(d) + 1e-4;
  float x = r - ph * 0.42;
  float ring = exp(-x * x * 900.0) * sin(x * 140.0) * (1.0 - ph) * (1.0 - ph);
  return d / r * ring;
}`);
    // wetness darkens albedo (water fills the micro pores) — less on already dark texels
    fs = inject(fs, '#include <map_fragment>', /* glsl */`
  float wHeight = ${hasH ? 'texture2D(roughnessMap, vRoughnessMapUv).b' : '0.5'};
  vec2 wq = vRWorldPos.xz * uPuddleScale;
  float basin = texture2D(tWetNoise, wq).r * 0.7 + texture2D(tWetNoise, wq * 3.1 + 0.37).g * 0.3;
  float upF = smoothstep(0.75, 0.95, normalize(vRWorldNormal).y);
  wetMask = upF * smoothstep(uPuddleLevel + 0.06, uPuddleLevel - 0.02, basin + (wHeight - 0.45) * 0.55 + (1.0 - uPuddles) * 0.6);
  wetMask *= step(0.001, uPuddles);
  diffuseColor.rgb *= mix(1.0, 0.55 + 0.3 * wHeight, uWet);
  diffuseColor.rgb = mix(diffuseColor.rgb, uPuddleColor, wetMask * 0.85);`);
    fs = inject(fs, '#include <roughnessmap_fragment>', `roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.45 + 0.04, uWet); roughnessFactor = mix(roughnessFactor, 0.025, wetMask);`);
    fs = inject(fs, '#include <normal_fragment_maps>', /* glsl */`
  if (wetMask > 0.001) {
    vec2 rp = vRWorldPos.xz * uRippleScale;
    vec2 g = rainRings(rp, uTime, 0.0) + rainRings(rp * 1.37 + 3.1, uTime * 1.1, 11.0) * 0.8;
    g *= uRipples * uRain;
    vec3 wn = normalize(vec3(-g.x * 0.9, 1.0, -g.y * 0.9));
    vec3 vn = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
    normal = normalize(mix(normal, vn, wetMask));
  }`);
    shader.fragmentShader = fs;
  });
}

export function windSway(material, opts = {}) {
  const { amp = 0.15, freq = 1.3, heightScale = 1, flutter = 0.02 } = opts;
  material.userData.windUniforms = { uSwayAmp: { value: amp }, uSwayFreq: { value: freq }, uSwayH: { value: heightScale }, uFlutter: { value: flutter } };
  return addPatch(material, 'wind:', (shader) => {
    Object.assign(shader.uniforms, material.userData.windUniforms);
    shader.vertexShader = inject(shader.vertexShader, '#include <common>', 'uniform float uSwayAmp, uSwayFreq, uSwayH, uFlutter;');
    shader.vertexShader = inject(shader.vertexShader, '#include <begin_vertex>', /* glsl */`
  {
    vec3 ip = vec3(0.0);
  #ifdef USE_INSTANCING
    ip = instanceMatrix[3].xyz;
  #endif
    ip += modelMatrix[3].xyz;
    float hh = max(0.0, position.y / uSwayH);
    float ph = dot(ip.xz, vec2(0.37, 0.61));
    float gust = 0.6 + 0.4 * sin(uTime * 0.31 + ip.x * 0.05) * sin(uTime * 0.17 + ip.z * 0.07);
    float s = sin(uTime * uSwayFreq + ph) * 0.6 + sin(uTime * uSwayFreq * 2.3 + ph * 1.7) * 0.25;
    vec2 wdir = normalize(uWind + vec2(1e-4));
    float a = uSwayAmp * hh * hh * gust;
    vec2 disp = wdir * (s * a + a * 0.6);
    // displacement is in world xz; bring it into the instance's local frame
    vec3 dw = vec3(disp.x, 0.0, disp.y);
  #ifdef USE_INSTANCING
    dw = transpose(mat3(instanceMatrix)) * dw / max(1e-3, dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz));
  #endif
    transformed += dw;
    transformed += normal * sin(uTime * 7.0 + ph * 13.0 + position.x * 5.0 + position.z * 3.0) * uFlutter * hh;
  }`);
  });
}

export function foliage(material, opts = {}) {
  const { translucency = 0.12, wet = 0.5 } = opts;
  material.userData.folUniforms = { uTransl: { value: translucency }, uLeafWet: { value: wet } };
  return addPatch(material, 'foliage:', (shader) => {
    Object.assign(shader.uniforms, material.userData.folUniforms);
    let fs = shader.fragmentShader;
    fs = inject(fs, '#include <common>', 'uniform float uTransl, uLeafWet;');
    fs = inject(fs, '#include <emissivemap_fragment>', 'totalEmissiveRadiance += diffuseColor.rgb * vec3(0.9, 1.05, 0.7) * uTransl * (1.0 + uFlash * 6.0);');
    fs = inject(fs, '#include <roughnessmap_fragment>', 'roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.55, uLeafWet);');
    shader.fragmentShader = fs;
  });
}
