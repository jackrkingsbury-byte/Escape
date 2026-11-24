/*
 * src/real/post.js — HDR post-processing pipeline for the photoreal kit (renders through the engine's renderFrame hook).
 *
 *   scene ──► sceneRT (HalfFloat linear HDR + depth texture, MSAA)
 *        ──► [ATMOS pre-pass]  depth-reconstructed height fog with drifting noise wisps + light in-scattering glow,
 *                              optional depth-only SSAO ("SAO-lite"), writes the depth-of-field CoC into alpha
 *        ──► [DOF]             single-pass scatter-as-gather bokeh (golden-angle disk, near/far aware)
 *        ──► [BLOOM]           dual-filter (Kawase) down/up chain with soft-knee threshold, 5 mips from ½ res
 *        ──► [GRADE → screen]  edge chromatic aberration, bloom add, exposure + lightning flash, ACES filmic, sRGB, then
 *                              in display space: cold white balance, bleach-bypass desaturation, S-curve contrast,
 *                              lift/gamma/gain, black crush, teal shadow split-tone, warm highlight tint, vignette,
 *                              deterministic film grain (seeded from ctx.t), letterbox bars, fade.
 *   Every pass but the scene and grade is skipped when its feature is off for the frame.
 *
 * ─── API ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   createPost(ctx, opts?) → post        opts: { msaa: 4 (samples of the HDR target; 0 = off), profile: false }
 *   post.defaults(cfg)                   persistent film-level config (deep-merged into the built-in defaults)
 *   post.set(cfg)                        per-FRAME overrides (deep-merged); cleared after every post.render()
 *   post.render(ctx)                     draw ctx.scene / ctx.camera to the default framebuffer (glCanvas)
 *   post.config                          the merged config used by the last render (read-only)
 *   post.stats                           { ms: {scene, atmos, dof, bloom, grade, total} } — exact only when profiling
 *                                        (opts.profile or cfg.profile: forces a GPU sync after each pass → slower)
 *   post.dispose()
 *   makeRenderFrame(post, { shotKey = 'post' }) → renderFrame(ctx) for the shots module: export it as
 *     `export const renderFrame = makeRenderFrame(post)` (or create post lazily: see test_shots.js). Before rendering it
 *     applies ctx.shot[shotKey] — an object, or a function (ctx, lt, u) → object — via post.set().
 *
 * ─── Config (all optional; colours are '#hex' or [r,g,b] linear 0..1) ─────────────────────────────────────────────────
 *   exposure  1          multiplies renderer.toneMappingExposure (which the engine sets from set.exposure)
 *   flash     0          lightning flash 0..1+: exposure boost + lifted shadows + slight blue-white bias (one frame value)
 *   fog       null | { color '#9aa4a8' (linear HDR scatter colour, may exceed 1), density 0.03 (per m at the base height),
 *                      height 0 (base, world y), falloff 0.12 (1/m: density halves every ln2/falloff m upward),
 *                      start 0 (m before fog begins), max 1 (cap on fog opacity), sky 1 (fog applied to sky pixels, ×),
 *                      noise 0.6 (0..1 wisp contrast), noiseScale 0.045 (1/m), wind [1.2, 0, 0.4] (m/s drift),
 *                      sunDir [0,1,0] (world, toward the light), sunColor '#ffffff' (×color for in-scattering),
 *                      glow 0 (forward-scatter strength), glowPower 6 }
 *   ao        null | { radius 0.5 (m), intensity 1, bias 0.03 }      depth-only SSAO multiplies the lit colour
 *   dof       null | { focus 4 (m, distance along the view ray), aperture 1 (CoC scale: px of blur per unit of
 *                      |1 - focus/dist| at 1080 px wide), maxBlur 16 (px at 1080 wide) }
 *   bloom     { strength 0.1, threshold 1.0 (linear HDR), knee 0.6, radius 1 (0..1 upsample spread) } | false
 *   grade     { temperature -0.25 (−cold … +warm), tint 0 (−green … +magenta), saturation 0.45, bleach 0.35 (0..1),
 *               contrast 1.3, pivot 0.42, blackPoint 0.025, whitePoint 1.0, lift [0,0,0], gamma [1,1,1], gain [1,1,1],
 *               shadowTint '#2b6f78', shadowAmt 0.22, highlightTint '#ffd2a0', highlightAmt 0 (warm for fire shots) }
 *   ca        0.0035     edge chromatic aberration (fraction of the frame at the corners)
 *   vignette  0.5        0..1
 *   grain     0.055      film grain amplitude (display space, strongest in mid-tones)
 *   letterbox 0          bar height as a fraction of the frame height (top and bottom each)
 *   fade      null | { color '#000000', amount 0..1 }   final colour fade (for cuts to black / white)
 *   profile   false
 *
 * Determinism: no clocks or Math.random affect pixels (grain is hashed from gl_FragCoord + a seed derived from ctx.t).
 * Cost (SwiftShader, 810×1440): see the README table in test_shots.js; grade ≈ one full-screen pass, atmos ≈ 1.2–2 passes,
 * DOF the most expensive (≈24 taps), bloom ≈ 0.7 of a full-screen pass in total.
 */
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { getNoiseTex } from './textures.js';

const DEFAULTS = {
  exposure: 1, flash: 0,
  fog: null, ao: null, dof: null,
  bloom: { strength: 0.1, threshold: 1.0, knee: 0.6, radius: 1 },
  grade: {
    temperature: -0.25, tint: 0, saturation: 0.45, bleach: 0.35, contrast: 1.3, pivot: 0.42, blackPoint: 0.025, whitePoint: 1.0,
    lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], shadowTint: '#2b6f78', shadowAmt: 0.22, highlightTint: '#ffd2a0', highlightAmt: 0,
  },
  ca: 0.0035, vignette: 0.5, grain: 0.055, letterbox: 0, fade: null, profile: false,
};
const FOG_DEFAULTS = { color: '#9aa4a8', density: 0.03, height: 0, falloff: 0.12, start: 0, max: 1, sky: 1, noise: 0.6, noiseScale: 0.045,
  wind: [1.2, 0, 0.4], sunDir: [0, 1, 0], sunColor: '#ffffff', glow: 0, glowPower: 6 };
const AO_DEFAULTS = { radius: 0.5, intensity: 1, bias: 0.03 };
const DOF_DEFAULTS = { focus: 4, aperture: 1, maxBlur: 16 };

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof THREE.Color) && !v.isVector3;
function merge(a, b) {
  if (b === undefined) return a;
  if (!isObj(b) || !isObj(a)) return b;
  const o = { ...a };
  for (const k of Object.keys(b)) o[k] = merge(a[k], b[k]);
  return o;
}
const _c = new THREE.Color();
function col3(v, out = new THREE.Vector3()) {
  if (Array.isArray(v)) return out.set(v[0], v[1], v[2]);
  if (v && v.isVector3) return out.copy(v);
  _c.set(v); return out.set(_c.r, _c.g, _c.b);
}
function vec3(v, out = new THREE.Vector3()) { return Array.isArray(v) ? out.set(v[0], v[1], v[2]) : out.copy(v); }

// ═════════════════════════════════════════════ shaders ═══════════════════════════════════════════════════════════
const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const ATMOS_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor, tDepth, tNoise;
uniform mat4 projInv, camWorld;
uniform vec2 resolution;
uniform float time, cameraNear, cameraFar;
uniform vec3 fogColor, sunDir, sunColor, wind;
uniform float fogDensity, fogHeight, fogFalloff, fogStart, fogMax, fogSky, fogNoise, fogNoiseScale, glow, glowPower;
uniform float aoRadius, aoIntensity, aoBias;
uniform float dofFocus, dofAperture, dofMax;

vec3 viewPos(vec2 uv, float d) {
  vec4 p = projInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return p.xyz / p.w;
}
float wisps(vec3 p) {
  vec2 q = p.xz * fogNoiseScale + wind.xz * fogNoiseScale * time;
  q += p.y * fogNoiseScale * vec2(0.71, -0.53);
  float a = texture2D(tNoise, q).r;
  float b = texture2D(tNoise, q * 2.37 + vec2(0.31, 0.77) - wind.xz * fogNoiseScale * time * 0.6).g;
  return a * 0.65 + b * 0.35;
}
void main() {
  vec4 src = texture2D(tColor, vUv);
  vec3 col = src.rgb;
  float d = texture2D(tDepth, vUv).r;
  bool sky = d >= 0.999999;
  vec3 vp = viewPos(vUv, sky ? 0.9999 : d);
  float dist = length(vp);
#ifdef USE_AO
  if (!sky) {
    vec2 px = 1.0 / resolution;
    vec3 vr = viewPos(vUv + vec2(px.x, 0.0), texture2D(tDepth, vUv + vec2(px.x, 0.0)).r);
    vec3 vu = viewPos(vUv + vec2(0.0, px.y), texture2D(tDepth, vUv + vec2(0.0, px.y)).r);
    vec3 n = normalize(cross(vr - vp, vu - vp));
    // radius in pixels from the projected world radius
    float rpx = aoRadius * resolution.y * 0.5 / (max(0.05, -vp.z) * projInv[1][1]);
    rpx = clamp(rpx, 2.0, 60.0);
    float occ = 0.0;
    float ang = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831853;
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      float r = (fi + 0.5) / 8.0;
      float a = ang + fi * 2.3999632;
      vec2 suv = vUv + vec2(cos(a), sin(a)) * r * rpx * px;
      vec3 sp = viewPos(suv, texture2D(tDepth, suv).r);
      vec3 dv = sp - vp;
      float l2 = dot(dv, dv);
      float fall = 1.0 - smoothstep(0.0, aoRadius * aoRadius * 4.0, l2);
      occ += max(0.0, dot(n, dv) * inversesqrt(l2 + 1e-5) - aoBias) * fall;
    }
    occ = clamp(occ / 8.0 * aoIntensity * 1.6, 0.0, 0.85);
    col *= 1.0 - occ;
  }
#endif
#ifdef USE_FOG
  vec3 wp = (camWorld * vec4(vp, 1.0)).xyz;
  vec3 cp = (camWorld * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 rd = normalize(wp - cp);
  float L = sky ? cameraFar * 0.5 : dist;
  L = max(0.0, L - fogStart);
  vec3 c0 = cp + rd * fogStart;
  float k = fogFalloff;
  float ry = rd.y;
  float base = fogDensity * exp(-k * (c0.y - fogHeight));
  float kr = k * ry;
  float integ = abs(kr) > 1e-4 ? base * (1.0 - exp(-kr * L)) / kr : base * L;
  // parallax-correct wisps: sample the drifting noise at fixed world distances along the ray
  float nsum = 0.0, wsum = 0.0;
  for (int i = 0; i < 4; i++) {
    float sd = min(L, 3.0 * pow(2.6, float(i)));
    vec3 sp = c0 + rd * sd;
    float w = 1.0 / (1.0 + float(i) * 0.6);
    nsum += wisps(sp) * w; wsum += w;
  }
  float nz = nsum / wsum;
  integ *= max(0.0, 1.0 + fogNoise * (nz - 0.5) * 2.6);
  float fogA = clamp(1.0 - exp(-integ), 0.0, fogMax) * (sky ? fogSky : 1.0);
  float mu = max(0.0, dot(rd, normalize(sunDir)));
  vec3 fc = fogColor * (1.0 + glow * pow(mu, glowPower) * sunColor);
  col = mix(col, fc, fogA);
#endif
  float coc = 0.0;
#ifdef USE_DOF
  float dd = sky ? 1e5 : dist;
  coc = clamp(dofAperture * (1.0 - dofFocus / dd) * resolution.x / 1080.0, -dofMax, dofMax);
#endif
  gl_FragColor = vec4(col, coc);
}`;

const DOF_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor;
uniform vec2 resolution;
uniform float maxBlur;
#define TAPS 28
void main() {
  vec4 c0 = texture2D(tColor, vUv);
  float cc = c0.a;
  float acoc = abs(cc);
  vec3 acc = c0.rgb; float tot = 1.0;
  vec2 px = 1.0 / resolution;
  for (int i = 1; i < TAPS; i++) {
    float fi = float(i);
    float r = sqrt(fi / float(TAPS)) * maxBlur;
    float a = fi * 2.3999632;
    vec4 s = texture2D(tColor, vUv + vec2(cos(a), sin(a)) * r * px);
    float sc = abs(s.a);
    // a sample behind the centre may not blur over it more than the centre's own CoC allows
    if (s.a > cc) sc = min(sc, acoc * 2.0);
    float m = smoothstep(r - 1.0, r + 1.0, sc);
    acc += mix(acc / tot, s.rgb, m); tot += 1.0;
  }
  gl_FragColor = vec4(acc / tot, cc);
}`;

const BLOOM_PRE = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor; uniform vec2 texel; uniform float threshold, knee;
vec3 pre(vec3 c) {
  float br = max(c.r, max(c.g, c.b));
  float rq = clamp(br - threshold + knee, 0.0, 2.0 * knee);
  rq = rq * rq / (4.0 * knee + 1e-4);
  float w = max(rq, br - threshold) / max(br, 1e-4);
  return c * w;
}
void main() {
  vec3 a = texture2D(tColor, vUv + texel * vec2(-1.0, -1.0)).rgb;
  vec3 b = texture2D(tColor, vUv + texel * vec2(1.0, -1.0)).rgb;
  vec3 c = texture2D(tColor, vUv + texel * vec2(-1.0, 1.0)).rgb;
  vec3 d = texture2D(tColor, vUv + texel * vec2(1.0, 1.0)).rgb;
  vec3 s = (pre(a) + pre(b) + pre(c) + pre(d)) * 0.25;
  gl_FragColor = vec4(min(s, vec3(64.0)), 1.0);
}`;
const BLOOM_DOWN = /* glsl */`
precision highp float;
varying vec2 vUv; uniform sampler2D tColor; uniform vec2 texel;
void main() {
  vec3 s = texture2D(tColor, vUv).rgb * 4.0;
  s += texture2D(tColor, vUv + texel * vec2(-1.0, -1.0)).rgb;
  s += texture2D(tColor, vUv + texel * vec2(1.0, -1.0)).rgb;
  s += texture2D(tColor, vUv + texel * vec2(-1.0, 1.0)).rgb;
  s += texture2D(tColor, vUv + texel * vec2(1.0, 1.0)).rgb;
  gl_FragColor = vec4(s / 8.0, 1.0);
}`;
const BLOOM_UP = /* glsl */`
precision highp float;
varying vec2 vUv; uniform sampler2D tColor, tAdd; uniform vec2 texel; uniform float spread;
void main() {
  vec2 o = texel * (0.5 + spread);
  vec3 s = vec3(0.0);
  s += texture2D(tColor, vUv + vec2(-2.0 * o.x, 0.0)).rgb;
  s += texture2D(tColor, vUv + vec2(2.0 * o.x, 0.0)).rgb;
  s += texture2D(tColor, vUv + vec2(0.0, -2.0 * o.y)).rgb;
  s += texture2D(tColor, vUv + vec2(0.0, 2.0 * o.y)).rgb;
  s += texture2D(tColor, vUv + vec2(-o.x, -o.y)).rgb * 2.0;
  s += texture2D(tColor, vUv + vec2(o.x, -o.y)).rgb * 2.0;
  s += texture2D(tColor, vUv + vec2(-o.x, o.y)).rgb * 2.0;
  s += texture2D(tColor, vUv + vec2(o.x, o.y)).rgb * 2.0;
  gl_FragColor = vec4(s / 12.0 + texture2D(tAdd, vUv).rgb, 1.0);
}`;

const GRADE_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor, tBloom;
uniform vec2 resolution;
uniform float useBloom, bloomStrength, exposure, flash, ca, vignette, grain, seed, letterbox, fadeAmt;
uniform vec3 fadeColor, wb;
uniform float saturation, bleach, contrast, pivot, blackPoint, whitePoint, shadowAmt, highlightAmt;
uniform vec3 lift, gammaV, gain, shadowTint, highlightTint;

vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 color) {
  const mat3 ACESInputMat = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 ACESOutputMat = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color *= 1.0 / 0.6;
  color = ACESInputMat * color; color = RRTAndODTFit(color); color = ACESOutputMat * color;
  return clamp(color, 0.0, 1.0);
}
vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 overlay(vec3 a, vec3 b) { return mix(2.0 * a * b, 1.0 - 2.0 * (1.0 - a) * (1.0 - b), step(0.5, a)); }

void main() {
  vec2 dir = vUv - 0.5;
  float r2 = dot(dir, dir);
  vec2 off = dir * r2 * ca * 4.0;
  vec3 c;
  c.r = texture2D(tColor, vUv - off).r;
  c.g = texture2D(tColor, vUv).g;
  c.b = texture2D(tColor, vUv + off).b;
  if (useBloom > 0.5) c += texture2D(tBloom, vUv).rgb * bloomStrength;
  // lightning flash: exposure boost + lifted shadows, cold-white
  c = c * (1.0 + flash * 2.2) + flash * 0.06 * vec3(0.85, 0.92, 1.0);
  c *= wb;
  c = aces(c * exposure);
  c = toSRGB(c);
  // ── display-space grade
  float l = luma(c);
  vec3 bl = overlay(vec3(l), c);                       // bleach bypass: silver retained → contrasty, desaturated
  c = mix(c, mix(bl, vec3(luma(bl)), 0.35), bleach);
  l = luma(c);
  c = mix(vec3(l), c, saturation);
  // S-curve around the pivot
  vec3 x = clamp(c, 0.0, 1.0);
  vec3 lo = pivot * pow(x / pivot, vec3(contrast));
  vec3 hi = 1.0 - (1.0 - pivot) * pow((1.0 - x) / (1.0 - pivot), vec3(contrast));
  c = mix(lo, hi, step(pivot, x));
  // lift / gamma / gain
  c = gain * (c + lift * (1.0 - c));
  c = pow(max(c, 0.0), 1.0 / gammaV);
  c = clamp((c - blackPoint) / max(1e-3, whitePoint - blackPoint), 0.0, 1.0);
  // split tone
  l = luma(c);
  float sh = (1.0 - smoothstep(0.0, 0.55, l));
  float hl = smoothstep(0.45, 1.0, l);
  c = mix(c, c * (1.0 - shadowAmt) + shadowTint * shadowAmt * (l + 0.06) * 2.2, sh * step(0.0001, shadowAmt));
  c = mix(c, c * mix(vec3(1.0), highlightTint * 1.15, highlightAmt), hl);
  // vignette (elliptical for 9:16)
  vec2 vd = dir * vec2(1.0, 0.78);
  float vig = smoothstep(0.85, 0.18, length(vd) * 1.35);
  c *= mix(1.0, vig, vignette);
  // grain: hashed per pixel and per frame, luminance-weighted (strongest in mid-tones), slightly chromatic
  float g0 = hash12(gl_FragCoord.xy + seed * 17.13) + hash12(gl_FragCoord.xy * 1.37 + seed * 7.91 + 3.1) - 1.0;
  float gc = hash12(gl_FragCoord.yx + seed * 3.3) - 0.5;
  l = luma(c);
  float gw = grain * (0.35 + 1.6 * l * (1.0 - l));
  c += gw * (vec3(g0) + vec3(gc, -gc * 0.5, gc * 0.3) * 0.3);
  c = mix(c, fadeColor, fadeAmt);
  float lb = step(vUv.y, letterbox) + step(1.0 - letterbox, vUv.y);
  c = mix(c, vec3(0.0), lb);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

// ═════════════════════════════════════════════ pipeline ══════════════════════════════════════════════════════════
function hdrTarget(w, h, opts = {}) {
  return new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, colorSpace: THREE.NoColorSpace,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, generateMipmaps: false, ...opts });
}
function mat(frag, uniforms, defines = {}) {
  return new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, defines, depthTest: false, depthWrite: false, toneMapped: false });
}

export function createPost(ctx, opts = {}) {
  const renderer = ctx.renderer;
  const w = ctx.size ? ctx.size.w : renderer.domElement.width, h = ctx.size ? ctx.size.h : renderer.domElement.height;
  const msaa = opts.msaa ?? 4;
  const depthTexture = new THREE.DepthTexture(w, h);
  depthTexture.type = THREE.UnsignedIntType;
  const sceneRT = hdrTarget(w, h, { depthBuffer: true, samples: msaa, depthTexture });
  const rtA = hdrTarget(w, h), rtB = hdrTarget(w, h);
  const LEVELS = 5;
  const mips = [], ups = [];
  for (let i = 0; i < LEVELS; i++) {
    const mw = Math.max(1, Math.round(w / 2 ** (i + 1))), mh = Math.max(1, Math.round(h / 2 ** (i + 1)));
    mips.push(hdrTarget(mw, mh)); ups.push(hdrTarget(mw, mh));
  }
  const noiseTex = getNoiseTex(5, 256);
  const quad = new FullScreenQuad(null);

  const U = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { value: v }]));
  const atmosU = U({ tColor: null, tDepth: depthTexture, tNoise: noiseTex, projInv: new THREE.Matrix4(), camWorld: new THREE.Matrix4(),
    resolution: new THREE.Vector2(w, h), time: 0, cameraNear: 0.1, cameraFar: 1000,
    fogColor: new THREE.Vector3(), sunDir: new THREE.Vector3(0, 1, 0), sunColor: new THREE.Vector3(1, 1, 1), wind: new THREE.Vector3(),
    fogDensity: 0, fogHeight: 0, fogFalloff: 0.1, fogStart: 0, fogMax: 1, fogSky: 1, fogNoise: 0, fogNoiseScale: 0.05, glow: 0, glowPower: 6,
    aoRadius: 0.5, aoIntensity: 1, aoBias: 0.03, dofFocus: 4, dofAperture: 1, dofMax: 16 });
  const atmosMats = new Map();
  const atmosMat = (fog, ao, dof) => {
    const key = `${+!!fog}${+!!ao}${+!!dof}`;
    let m = atmosMats.get(key);
    if (!m) {
      const d = {}; if (fog) d.USE_FOG = ''; if (ao) d.USE_AO = ''; if (dof) d.USE_DOF = '';
      m = mat(ATMOS_FRAG, atmosU, d); atmosMats.set(key, m);
    }
    return m;
  };
  const dofU = U({ tColor: null, resolution: new THREE.Vector2(w, h), maxBlur: 16 });
  const dofMat = mat(DOF_FRAG, dofU);
  const preU = U({ tColor: null, texel: new THREE.Vector2(), threshold: 1, knee: 0.5 });
  const preMat = mat(BLOOM_PRE, preU);
  const downU = U({ tColor: null, texel: new THREE.Vector2() });
  const downMat = mat(BLOOM_DOWN, downU);
  const upU = U({ tColor: null, tAdd: null, texel: new THREE.Vector2(), spread: 1 });
  const upMat = mat(BLOOM_UP, upU);
  const gradeU = U({ tColor: null, tBloom: null, resolution: new THREE.Vector2(w, h), useBloom: 0, bloomStrength: 0.1, exposure: 1, flash: 0,
    ca: 0, vignette: 0, grain: 0, seed: 0, letterbox: 0, fadeAmt: 0, fadeColor: new THREE.Vector3(), wb: new THREE.Vector3(1, 1, 1),
    saturation: 1, bleach: 0, contrast: 1, pivot: 0.42, blackPoint: 0, whitePoint: 1, shadowAmt: 0, highlightAmt: 0,
    lift: new THREE.Vector3(), gammaV: new THREE.Vector3(1, 1, 1), gain: new THREE.Vector3(1, 1, 1),
    shadowTint: new THREE.Vector3(), highlightTint: new THREE.Vector3(1, 1, 1) });
  const gradeMat = mat(GRADE_FRAG, gradeU);

  renderer.info.autoReset = false;
  let base = merge(DEFAULTS, {});
  let frame = {};
  const stats = { ms: { scene: 0, atmos: 0, dof: 0, bloom: 0, grade: 0, total: 0 } };
  const gl = renderer.getContext();
  const px = new Uint8Array(4);

  function blit(material, target) {
    quad.material = material;
    renderer.setRenderTarget(target);
    quad.render(renderer);
  }

  const post = {
    stats, config: base, sceneRT, depthTexture,
    defaults(cfg) { base = merge(base, cfg); return post; },
    set(cfg) { frame = merge(frame, cfg); return post; },
    render(c = ctx) {
      const cfg = merge(base, frame);
      frame = {};
      post.config = cfg;
      const profile = !!(cfg.profile || opts.profile);
      const sync = () => { if (profile) { renderer.setRenderTarget(null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } };
      let T = performance.now(); const T0 = T;
      const lap = (k) => { sync(); const n = performance.now(); stats.ms[k] = n - T; T = n; };
      const scene = c.scene, camera = c.camera;
      renderer.info.reset();
      const prevAutoClear = renderer.autoClear;
      renderer.autoClear = true;
      // 1. scene → HDR
      renderer.setRenderTarget(sceneRT);
      renderer.render(scene, camera);
      lap('scene');
      let cur = sceneRT.texture;
      // 2. atmos pre-pass
      const fog = cfg.fog ? merge(FOG_DEFAULTS, cfg.fog) : null;
      const ao = cfg.ao ? merge(AO_DEFAULTS, cfg.ao) : null;
      const dof = cfg.dof ? merge(DOF_DEFAULTS, cfg.dof) : null;
      if (fog || ao || dof) {
        const u = atmosU;
        u.tColor.value = cur;
        u.projInv.value.copy(camera.projectionMatrixInverse);
        u.camWorld.value.copy(camera.matrixWorld);
        u.time.value = c.t; u.cameraNear.value = camera.near; u.cameraFar.value = camera.far;
        if (fog) {
          col3(fog.color, u.fogColor.value); vec3(fog.sunDir, u.sunDir.value); col3(fog.sunColor, u.sunColor.value); vec3(fog.wind, u.wind.value);
          u.fogDensity.value = fog.density; u.fogHeight.value = fog.height; u.fogFalloff.value = Math.max(1e-4, fog.falloff);
          u.fogStart.value = fog.start; u.fogMax.value = fog.max; u.fogSky.value = fog.sky; u.fogNoise.value = fog.noise;
          u.fogNoiseScale.value = fog.noiseScale; u.glow.value = fog.glow; u.glowPower.value = fog.glowPower;
        }
        if (ao) { u.aoRadius.value = ao.radius; u.aoIntensity.value = ao.intensity; u.aoBias.value = ao.bias; }
        if (dof) { u.dofFocus.value = dof.focus; u.dofAperture.value = dof.aperture * 30; u.dofMax.value = dof.maxBlur * w / 1080; }
        blit(atmosMat(fog, ao, dof), rtA);
        cur = rtA.texture;
      }
      lap('atmos');
      // 3. DOF
      if (dof) {
        dofU.tColor.value = cur; dofU.maxBlur.value = dof.maxBlur * w / 1080;
        blit(dofMat, rtB);
        cur = rtB.texture;
      }
      lap('dof');
      // 4. bloom
      const bloom = cfg.bloom && cfg.bloom.strength > 0 ? merge(DEFAULTS.bloom, cfg.bloom) : null;
      if (bloom) {
        preU.tColor.value = cur; preU.texel.value.set(1 / w, 1 / h); preU.threshold.value = bloom.threshold; preU.knee.value = Math.max(1e-3, bloom.knee);
        blit(preMat, mips[0]);
        for (let i = 1; i < LEVELS; i++) {
          downU.tColor.value = mips[i - 1].texture; downU.texel.value.set(1 / mips[i - 1].width, 1 / mips[i - 1].height);
          blit(downMat, mips[i]);
        }
        let src = mips[LEVELS - 1].texture;
        for (let i = LEVELS - 2; i >= 0; i--) {
          upU.tColor.value = src; upU.tAdd.value = mips[i].texture;
          upU.texel.value.set(1 / mips[i + 1].width, 1 / mips[i + 1].height); upU.spread.value = bloom.radius;
          blit(upMat, ups[i]);
          src = ups[i].texture;
        }
        gradeU.tBloom.value = src;
      }
      lap('bloom');
      // 5. grade → screen
      const g = merge(DEFAULTS.grade, cfg.grade || {});
      const u = gradeU;
      u.tColor.value = cur; u.useBloom.value = bloom ? 1 : 0; u.bloomStrength.value = bloom ? bloom.strength / 0.25 : 0;
      u.exposure.value = renderer.toneMappingExposure * cfg.exposure;
      u.flash.value = cfg.flash || 0;
      u.ca.value = cfg.ca; u.vignette.value = cfg.vignette; u.grain.value = cfg.grain;
      u.seed.value = ((Math.round(c.t * 1000) * 0.618034) % 1) * 97.0 + 1.0;
      u.letterbox.value = cfg.letterbox || 0;
      u.fadeAmt.value = cfg.fade ? cfg.fade.amount ?? 0 : 0;
      col3(cfg.fade && cfg.fade.color ? cfg.fade.color : '#000000', u.fadeColor.value);
      const T_ = g.temperature, Ti = g.tint;
      u.wb.value.set(1 + T_ * 0.18 + Ti * 0.05, 1 - Ti * 0.08, 1 - T_ * 0.22 + Ti * 0.05);
      u.saturation.value = g.saturation; u.bleach.value = g.bleach; u.contrast.value = g.contrast; u.pivot.value = g.pivot;
      u.blackPoint.value = g.blackPoint; u.whitePoint.value = g.whitePoint; u.shadowAmt.value = g.shadowAmt; u.highlightAmt.value = g.highlightAmt;
      col3(g.lift, u.lift.value); col3(g.gamma, u.gammaV.value); col3(g.gain, u.gain.value);
      // tints are authored as sRGB hex: use their display values directly
      const st = new THREE.Color(g.shadowTint), ht = new THREE.Color(g.highlightTint);
      if (Array.isArray(g.shadowTint)) u.shadowTint.value.set(...g.shadowTint); else { const s = st.getRGB(new THREE.Color(), THREE.SRGBColorSpace); u.shadowTint.value.set(s.r, s.g, s.b); }
      if (Array.isArray(g.highlightTint)) u.highlightTint.value.set(...g.highlightTint); else { const s = ht.getRGB(new THREE.Color(), THREE.SRGBColorSpace); u.highlightTint.value.set(s.r, s.g, s.b); }
      blit(gradeMat, null);
      lap('grade');
      stats.ms.total = performance.now() - T0;
      renderer.autoClear = prevAutoClear;
    },
    dispose() {
      [sceneRT, rtA, rtB, ...mips, ...ups].forEach((r) => r.dispose());
      [...atmosMats.values(), dofMat, preMat, downMat, upMat, gradeMat].forEach((m) => m.dispose());
      quad.dispose();
    },
  };
  return post;
}

export function makeRenderFrame(postOrFactory, { shotKey = 'post' } = {}) {
  let post = null;
  return function renderFrame(ctx) {
    if (!post) post = typeof postOrFactory === 'function' ? postOrFactory(ctx) : postOrFactory;
    const s = ctx.shot && ctx.shot[shotKey];
    if (s) post.set(typeof s === 'function' ? s(ctx, ctx.lt, ctx.u) || {} : s);
    post.render(ctx);
  };
}
