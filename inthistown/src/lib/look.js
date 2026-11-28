/*
 * src/lib/look.js — the series' warm "toy-cinema" look (style bible v2 §8) through src/real/post.js, per-shot depth
 * of field helpers, and cheap motivated-light builders (shadowed key + visible practicals) for SwiftShader.
 *
 * ─── Quick start (a shots module) ───────────────────────────────────────────────────────────────────────────────────
 *   import { renderFrame as lookRender, focusOn, focusPull, lookFrame } from '../lib/look.js';
 *   export const renderFrame = lookRender;              // EVERY frame goes through post.js with the series preset
 *   shots: { …, focus: 'me' }                           // optional per-shot DOF on a cast member's face (each frame)
 *          { …, focus: { target: 'pip', aperture: 0.8, part: 'face' } }  |  focus: (ctx, lt, u) => target|cfg|null
 *          { …, post: { exposure: 0.9, grade: { temperature: 0.2 } } }   |  post: (ctx, lt, u) => cfg   (post.js cfg)
 *   in shot.update:  focusOn(ctx, ctx.cast.me)  ·  focusOn(ctx, 'hall.table.photo', { aperture: 1.2 })
 *                    focusPull(ctx, photoObj, ctx.cast.pip, ctx.progress('pull0', 'pull1'))
 *                    lookFrame(ctx, { exposure: 0.8, fade: { color: '#fff', amount: u } })   (any post.js cfg, this frame)
 *
 * ─── Exports ────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   LOOK                       the series preset (post.js cfg, §8): grade temperature +0.1, saturation 0.95, bleach 0,
 *                              contrast 1.1, shadowAmt 0.1, highlightAmt 0.1; ao radius 0.4; bloom 0.15 / threshold 0.9;
 *                              vignette 0.3; grain 0.02; ca 0.001; fxaa on, msaa 0; fx layer off; dof off (per shot).
 *   MOODS                      small per-lighting-state tweaks merged on top of LOOK (a set's `post` can return them):
 *                              MOODS.night / dusk / morning / dark / warm. Example: set.post = () => MOODS.night.
 *   renderFrame(ctx)           export it from the shots module. Lazily creates post (createPost(ctx, { msaa: 0 })),
 *                              post.defaults(LOOK), then per frame merges, in order: set.post (object or fn(ctx)),
 *                              shot.post (object or fn(ctx, lt, u)), shot.focus, everything queued with lookFrame /
 *                              focusOn / focusPull during this frame's update — then renders.
 *   makeLookRenderFrame({ defaults, msaa = 0, shotKey = 'post', setKey = 'post', focusKey = 'focus' }) → renderFrame
 *                              same, with extra film-level defaults merged over LOOK.
 *   lookFrame(ctx, cfg)        queue post.js overrides for THIS frame only (deep-merged; cleared after the render).
 *   focusOn(ctx, target, opts) per-frame DOF focus on a target; resolved at render time with the FINAL camera (after
 *                              shake / punch), so call it in update every frame. target: cast id ('me'), Character,
 *                              Object3D, Vector3, [x,y,z], or an anchor name ('hall.table'). opts:
 *                                part 'face' (default for characters: middle of the painted face) | 'head' | 'chest' |
 *                                     'hands' | 'feet' ;  offset [x,y,z] (world, added to the point)
 *                                aperture 0.6 (post.js units: CoC px per |1 − focus/dist| ÷ 30 at 1080 wide; 0.3 subtle
 *                                     wide, 0.6 medium close-up, 1.0–1.6 macro / extreme close-up)
 *                                maxBlur 14 (px at 1080 wide), focusBias 0 (m added to the distance)
 *   focusPull(ctx, a, b, u, opts)   focus distance eased (smoothstep) from target a (u = 0) to b (u = 1); opts as focusOn.
 *   focusDistance(ctx, target, opts) → metres from the CURRENT camera position (use only after the camera is final).
 *   targetPoint(ctx, target, part?, out?) → world Vector3 of a target (character part / object / anchor / vec).
 *
 *   Light builders (all return { root, …, setOn(v 0..1) }; nothing animates unless you call the method; deterministic):
 *   COLORS                     motivated practical colours, kept low in saturation so the black hoodie stays black:
 *                              lamp '#ffc893', lantern '#ffbe78', bulb '#ffd9ad', fridge '#e4f0ff', torch '#fff1dc',
 *                              moon '#a9bde0', sunDusk '#ffb36e', sunMorning '#fff0d6', strip '#ffcf8a', candle '#ffb060'
 *   tuneShadow(light, { mapSize = 1024, radius = 4, bias = -0.0006, normalBias = 0.03, near, far, box })
 *                              cheap soft shadows for SwiftShader (post.js uses PCF: `radius` softens the edge).
 *   makeLamp({ shade = '#f3e6cf', base = '#7a5a3c', height = 0.62, on = 1, shadow = true, intensity = 1,
 *              spotAngle = 1.15, color = COLORS.lamp, reach = 9 })
 *     → { root, spot (SpotLight, aims down/out through the shade: the KEY with shadows), glow (PointLight, unshadowed,
 *         short-range warm wash on the nearest wall + ceiling), shade, bulb, setOn(v), aim(targetWorldVec3) }
 *       origin = bottom of the lamp base; spot target defaults to 1.6 m in front (+Z) on the floor.
 *   makeTorch({ color = COLORS.torch, intensity = 1, angle = 0.36, shadow = true, reach = 14 })
 *     → { root (small torch body: parent it into a hand or ctx.add it), spot, lens, setOn(v), aim(fromVec3, toVec3) }
 *       aim() places the whole torch at `from` pointing at `to` (world) — call it every frame from update.
 *   makePointGlow({ color = COLORS.lantern, intensity = 1, distance = 7, size = 0 })
 *     → { root, light, orb|null, setOn(v) }   unshadowed practical (lantern row, candle, night light). size > 0 adds a
 *       visible emissive orb of that radius.
 *   makeFridgeLight({ intensity = 1, shadow = true, angle = 1.05 }) → { root, spot, panel, setOn(v) }
 *       origin = centre of the fridge's open interior; spot points along +Z out of the fridge; panel = emissive back wall.
 *   makeDoorStrip({ width = 1.1, color = COLORS.strip, intensity = 1, depth = 0.9 })
 *     → { root, strip (emissive sliver), pool (soft additive light pool on the floor), light (PointLight), setOn(v),
 *         setFeet(list) }  origin = floor at the middle of the door's bottom edge, +Z = toward the viewer's side.
 *       setFeet([{ x, w }]) darkens 0–2 spans of the strip and pool (foot shadows walking into the strip), x in m.
 *   makeWindowShaft({ width = 1.2, height = 2, dir = [0, -0.35, -1], length = 6, color = '#ffd9a8', intensity = 0.35,
 *                     dust = 0.6, seed = 3 })
 *     → { root, mesh, setOn(v 0..4) }   one additive light-shaft volume cast from a window/door opening: origin = centre
 *       of the opening (local XY plane), the volume follows `dir` (local, must point along −Z = into the room; pass the
 *       light's TRAVEL direction, i.e. −sunDir). Drawn as 7 internal slices (one transparent mesh), soft edges, falls off
 *       with depth, fades within 0.8–3.5 m of the camera (no veil over faces), drifting dust streaks from RU.uTime
 *       (src/real/materials.js setFrame) — pure function of t. Not occluded by characters: keep intensity low (0.1–0.2).
 *   makeDust({ box = [3, 2.5, 6], count = 260, color = '#ffe8c8', size = 0.012, seed = 5, intensity = 1 })
 *     → { root, update(t), setOn(v) }   floating dust motes (additive points, ≤ 7 px, faded out within 1.6 m of the lens)
 *       inside a box centred on root; update(t) sets the time uniform (call every frame, e.g. from set.update).
 *
 * Determinism: no Math.random / clocks. Grain is seeded from ctx.t by post.js. focusOn resolves at render time from
 * the final camera, so a frame rendered twice (or out of order) gets the same focus.
 * Cost (SwiftShader, 810×1440, PCF shadows): the preset's post passes ≈ 0.6–0.8 s/frame (AO + CoC 0.25, DOF 0.25,
 * bloom 0.07, grade+FXAA 0.13); each shadowed spot ≈ +0.15–0.35 s (shadow pass); each unshadowed light ≈ +3–5 %.
 */
import * as THREE from 'three';
import { createPost } from '../real/post.js';
import { RU } from '../real/materials.js';
import { getNoiseTex } from '../real/textures.js';
import { rng, clamp, lerp, smooth } from './util.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ═════════════════════════════════════════════ preset ═════════════════════════════════════════════════════════════
export const LOOK = {
  exposure: 1,
  fog: null,
  ao: { radius: 0.4, intensity: 0.9, bias: 0.03 },
  dof: null,
  bloom: { strength: 0.15, threshold: 0.9, knee: 0.6, radius: 1 },
  grade: {
    temperature: 0.1, tint: 0, saturation: 0.95, bleach: 0, contrast: 1.1, pivot: 0.42, blackPoint: 0.012, whitePoint: 1.0,
    lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1],
    shadowTint: '#3a4f73', shadowAmt: 0.1, highlightTint: '#ffd2a0', highlightAmt: 0.1,
  },
  ca: 0.001, vignette: 0.3, grain: 0.02, letterbox: 0, fade: null, fxaa: true, fx: false,
};
export const MOODS = {
  warm: {},
  dusk: { grade: { temperature: 0.16, highlightAmt: 0.14 }, bloom: { strength: 0.18 } },
  night: { grade: { temperature: 0.04, saturation: 0.9, shadowTint: '#2a3d66', shadowAmt: 0.16 }, bloom: { strength: 0.2, threshold: 0.8 } },
  dark: { grade: { temperature: 0.02, saturation: 0.88, shadowTint: '#25335a', shadowAmt: 0.18, contrast: 1.14 }, bloom: { strength: 0.22, threshold: 0.75 }, vignette: 0.38 },
  morning: { grade: { temperature: 0.08, saturation: 1.0, highlightAmt: 0.06 }, bloom: { strength: 0.17, threshold: 0.95 } },
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof THREE.Color) && !v.isVector3 && !v.isObject3D;
function merge(a, b) {
  if (b === undefined || b === null) return a;
  if (!isObj(b) || !isObj(a)) return b;
  const o = { ...a };
  for (const k of Object.keys(b)) o[k] = merge(a[k], b[k]);
  return o;
}

// ═════════════════════════════════════════════ render hook ════════════════════════════════════════════════════════
let pending = {};
let pendingFocus = null;
export function lookFrame(ctx, cfg) { if (cfg) pending = merge(pending, cfg); }
export function focusOn(ctx, target, opts = {}) { pendingFocus = { a: target, b: null, u: 0, opts }; }
export function focusPull(ctx, a, b, u, opts = {}) { pendingFocus = { a, b, u: clamp(u, 0, 1), opts }; }

const FACE_LOCAL = new THREE.Vector3(0, 0.3, 0.3);
const _v = new THREE.Vector3();
export function targetPoint(ctx, target, part = 'face', out = new THREE.Vector3()) {
  let t = target;
  if (typeof t === 'string' && ctx.cast && ctx.cast[t]) t = ctx.cast[t];
  if (t && t.joints && t.root) {                                   // a Character
    const J = t.joints;
    t.root.updateMatrixWorld(true);
    if (part === 'face' || part === 'head') { out.copy(part === 'face' ? FACE_LOCAL : _v.set(0, 0.3, 0)); return J.head.localToWorld(out); }
    if (part === 'chest') { out.set(0, 0.35, 0.18); return (J.torso || J.hips).localToWorld(out); }
    if (part === 'hands') { const a = (J.handR || J.armR).getWorldPosition(out); const b = (J.handL || J.armL).getWorldPosition(_v); return a.add(b).multiplyScalar(0.5); }
    if (part === 'feet') { const a = (J.footR || J.legR).getWorldPosition(out); const b = (J.footL || J.legL).getWorldPosition(_v); return a.add(b).multiplyScalar(0.5); }
    return J.head.getWorldPosition(out);
  }
  if (t && t.isObject3D) { t.updateMatrixWorld(true); return t.getWorldPosition(out); }
  if (t && t.root && t.root.isObject3D) { t.root.updateMatrixWorld(true); return t.root.getWorldPosition(out); }
  if (t && t.isVector3) return out.copy(t);
  if (Array.isArray(t)) return out.set(t[0], t[1], t[2]);
  if (typeof t === 'string' && ctx.point) return out.copy(ctx.point(t));
  throw new Error(`look.targetPoint: cannot resolve focus target ${String(target)}`);
}
export function focusDistance(ctx, target, opts = {}) {
  const p = targetPoint(ctx, target, opts.part || 'face');
  if (opts.offset) p.add(_v.set(opts.offset[0], opts.offset[1], opts.offset[2]));
  ctx.camera.updateMatrixWorld();
  const c = _v.setFromMatrixPosition(ctx.camera.matrixWorld);
  return Math.max(0.05, c.distanceTo(p) + (opts.focusBias || 0));
}
function resolveFocus(ctx, f) {
  const o = f.opts || {};
  let d = focusDistance(ctx, f.a, o);
  if (f.b != null) d = lerp(d, focusDistance(ctx, f.b, o.partB ? { ...o, part: o.partB } : o), smooth(f.u));
  return { focus: d, aperture: o.aperture ?? 0.6, maxBlur: o.maxBlur ?? 14 };
}

export function makeLookRenderFrame({ defaults = {}, msaa = 0, shotKey = 'post', setKey = 'post', focusKey = 'focus' } = {}) {
  let post = null;
  return function renderFrame(ctx) {
    if (!post) { post = createPost(ctx, { msaa }); post.defaults(merge(LOOK, defaults)); }
    try {
      const set = ctx.set;
      if (set && set[setKey]) post.set(typeof set[setKey] === 'function' ? set[setKey](ctx) || {} : set[setKey]);
      const shot = ctx.shot;
      const s = shot && shot[shotKey];
      if (s) post.set(typeof s === 'function' ? s(ctx, ctx.lt, ctx.u) || {} : s);
      let f = shot && shot[focusKey];
      if (typeof f === 'function') f = f(ctx, ctx.lt, ctx.u);
      if (f != null && !pendingFocus) {
        const isCfg = isObj(f) && f.target !== undefined;
        pendingFocus = { a: isCfg ? f.target : f, b: isCfg ? f.to ?? null : null, u: isCfg ? f.u ?? 0 : 0, opts: isCfg ? f : {} };
      }
      if (pendingFocus) post.set({ dof: resolveFocus(ctx, pendingFocus) });
      post.set(pending);
    } finally { pending = {}; pendingFocus = null; }
    post.render(ctx);
  };
}
export const renderFrame = makeLookRenderFrame();

// ═════════════════════════════════════════════ lights ═════════════════════════════════════════════════════════════
export const COLORS = {
  lamp: '#ffc893', lantern: '#ffbe78', bulb: '#ffd9ad', fridge: '#e4f0ff', torch: '#fff1dc', moon: '#a9bde0',
  sunDusk: '#ffb36e', sunMorning: '#fff0d6', strip: '#ffcf8a', candle: '#ffb060',
};
export function tuneShadow(light, { mapSize = 1024, radius = 4, bias = -0.0006, normalBias = 0.03, near, far, box } = {}) {
  light.castShadow = true;
  light.shadow.mapSize.set(mapSize, mapSize);
  light.shadow.radius = radius; light.shadow.bias = bias; light.shadow.normalBias = normalBias;
  const cam = light.shadow.camera;
  if (near != null) cam.near = near;
  if (far != null) cam.far = far;
  if (box != null && cam.isOrthographicCamera) { cam.left = -box; cam.right = box; cam.top = box; cam.bottom = -box; }
  cam.updateProjectionMatrix();
  return light;
}
const _matCache = new Map();
function cmat(key, make) { let m = _matCache.get(key); if (!m) { m = make(); _matCache.set(key, m); } return m; }
const emissive = (color, k = 1) => new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color(color), emissiveIntensity: k, roughness: 1 });

export function makeLamp(opts = {}) {
  const o = { shade: '#f3e6cf', base: '#7a5a3c', height: 0.62, on: 1, shadow: true, intensity: 1, spotAngle: 1.15, color: COLORS.lamp, reach: 9, ...opts };
  const root = new THREE.Group(); root.name = 'lamp';
  const baseMat = cmat('lampBase' + o.base, () => new THREE.MeshStandardMaterial({ color: o.base, roughness: 0.35, metalness: 0.1 }));
  const H = o.height;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.05, 20), baseMat); foot.position.y = 0.025;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), baseMat); body.scale.set(1, 1.3, 1); body.position.y = 0.17;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, H * 0.45, 8), baseMat); stem.position.y = 0.3 + H * 0.2;
  const shadeH = H * 0.42, shadeY = H * 0.78;
  const shadeMat = new THREE.MeshStandardMaterial({ color: o.shade, roughness: 0.9, side: THREE.DoubleSide, emissive: new THREE.Color(o.color), emissiveIntensity: 0 });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.21, shadeH, 28, 1, true), shadeMat); shade.position.y = shadeY;
  const bulbMat = emissive(COLORS.bulb, 0);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), bulbMat); bulb.position.y = shadeY - 0.02;
  for (const m of [foot, body, stem]) { m.castShadow = true; m.receiveShadow = true; }
  shade.castShadow = false; bulb.castShadow = false;
  root.add(foot, body, stem, shade, bulb);
  // light: a downward-biased spot (casts the shade's cut-off pool + shadows) + a soft unshadowed glow
  const spot = new THREE.SpotLight(o.color, 0, o.reach, o.spotAngle, 0.85, 2);
  spot.position.set(0, shadeY - 0.04, 0);
  const tgt = new THREE.Object3D(); tgt.position.set(0, 0, 1.6); root.add(tgt); spot.target = tgt;
  if (o.shadow) tuneShadow(spot, { mapSize: 1024, radius: 5, near: 0.08, far: o.reach });
  const glow = new THREE.PointLight(o.color, 0, Math.min(o.reach, 4.5), 2);
  glow.position.set(0, shadeY + 0.05, 0);
  root.add(spot, glow);
  const lamp = {
    root, spot, glow, shade, bulb, target: tgt,
    setOn(v) {
      v = clamp(v, 0, 1);
      spot.intensity = 26 * o.intensity * v; glow.intensity = 5 * o.intensity * v;
      spot.visible = v > 0; glow.visible = v > 0;
      shadeMat.emissiveIntensity = 0.55 * v; bulbMat.emissiveIntensity = 6 * v;
    },
    aim(world) { root.updateMatrixWorld(true); tgt.position.copy(root.worldToLocal(world.clone())); },
  };
  lamp.setOn(o.on);
  return lamp;
}

export function makeTorch(opts = {}) {
  const o = { color: COLORS.torch, intensity: 1, angle: 0.36, shadow: true, reach: 14, ...opts };
  const root = new THREE.Group(); root.name = 'torch';
  const bodyMat = cmat('torchBody', () => new THREE.MeshStandardMaterial({ color: '#2b2f38', roughness: 0.4, metalness: 0.4 }));
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.26, 12).rotateX(Math.PI / 2), bodyMat); body.position.z = -0.13;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.036, 0.07, 14).rotateX(Math.PI / 2), bodyMat); head.position.z = 0.02;
  const lensMat = emissive(o.color, 0);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.043, 16), lensMat); lens.position.z = 0.056;
  body.castShadow = head.castShadow = false;
  root.add(body, head, lens);
  const spot = new THREE.SpotLight(o.color, 0, o.reach, o.angle, 0.75, 2);
  spot.position.set(0, 0, 0.06);
  const tgt = new THREE.Object3D(); tgt.position.set(0, 0, 3); root.add(tgt); spot.target = tgt;
  if (o.shadow) tuneShadow(spot, { mapSize: 1024, radius: 3, near: 0.35, far: o.reach });   // near 0.35: the holder's own hand/arm never blocks the beam
  root.add(spot);
  const _m = new THREE.Matrix4();
  return {
    root, spot, lens,
    setOn(v) { v = clamp(v, 0, 1); spot.intensity = 24 * o.intensity * v; spot.visible = v > 0; lensMat.emissiveIntensity = 1.5 * v; },
    aim(from, to) {
      const f = from.isVector3 ? from : new THREE.Vector3(...from), t = to.isVector3 ? to : new THREE.Vector3(...to);
      root.position.copy(f);
      _m.lookAt(t, f, new THREE.Vector3(0, 1, 0));     // object +Z toward t
      root.quaternion.setFromRotationMatrix(_m);
      if (root.parent) { root.parent.updateMatrixWorld(true); const pq = root.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); root.quaternion.premultiply(pq); root.position.copy(root.parent.worldToLocal(f.clone())); }
    },
  };
}

export function makePointGlow(opts = {}) {
  const o = { color: COLORS.lantern, intensity: 1, distance: 7, size: 0, ...opts };
  const root = new THREE.Group(); root.name = 'pointGlow';
  const light = new THREE.PointLight(o.color, 0, o.distance, 2);
  root.add(light);
  let orb = null, orbMat = null;
  if (o.size > 0) { orbMat = emissive(o.color, 0); orb = new THREE.Mesh(new THREE.SphereGeometry(o.size, 14, 10), orbMat); orb.castShadow = false; root.add(orb); }
  return {
    root, light, orb,
    setOn(v) { v = clamp(v, 0, 1); light.intensity = 8 * o.intensity * v; light.visible = v > 0; if (orbMat) orbMat.emissiveIntensity = 5 * v; },
  };
}

export function makeFridgeLight(opts = {}) {
  const o = { intensity: 1, shadow: true, angle: 0.8, color: COLORS.fridge, ...opts };
  const root = new THREE.Group(); root.name = 'fridgeLight';
  const panelMat = emissive(o.color, 0);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.3), panelMat); panel.position.z = -0.25;
  root.add(panel);
  const spot = new THREE.SpotLight(o.color, 0, 10, o.angle, 0.8, 2);
  spot.position.set(0, 0.2, -0.22);
  const tgt = new THREE.Object3D(); tgt.position.set(0, -0.7, 3); root.add(tgt); spot.target = tgt;
  if (o.shadow) tuneShadow(spot, { mapSize: 1024, radius: 4, near: 0.1, far: 10 });
  root.add(spot);
  return {
    root, spot, panel,
    setOn(v) { v = clamp(v, 0, 1); spot.intensity = 26 * o.intensity * v; spot.visible = v > 0; panelMat.emissiveIntensity = 0.6 * v; },
  };
}

let _stripTex = null;
function stripPoolTex() {
  if (_stripTex) return _stripTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 64);
  const side = g.createLinearGradient(0, 0, 128, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)'); side.addColorStop(0.12, 'rgba(0,0,0,0)'); side.addColorStop(0.88, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = side; g.fillRect(0, 0, 128, 64);
  _stripTex = new THREE.CanvasTexture(c);
  return _stripTex;
}
export function makeDoorStrip(opts = {}) {
  const o = { width: 1.1, color: COLORS.strip, intensity: 1, depth: 0.9, ...opts };
  const root = new THREE.Group(); root.name = 'doorStrip';
  const stripMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(o.color) }, uK: { value: 0 }, uFeet: { value: new THREE.Vector4(9, 0, 9, 0) }, uW: { value: o.width } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uColor; uniform float uK, uW; uniform vec4 uFeet; varying vec2 vUv;
      void main(){ float x = (vUv.x - 0.5) * uW;
        float f = 1.0 - (1.0 - smoothstep(0.0, 0.04, abs(x - uFeet.x) - uFeet.y * 0.5)) * 0.92;
        f *= 1.0 - (1.0 - smoothstep(0.0, 0.04, abs(x - uFeet.z) - uFeet.w * 0.5)) * 0.92;
        float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(0.0, 0.06, 1.0 - vUv.x);
        gl_FragColor = vec4(uColor * uK * f * edge, 1.0); }`,
    toneMapped: false,
  });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(o.width, 0.022), stripMat); strip.position.set(0, 0.011, 0.002);
  const poolMat = new THREE.ShaderMaterial({
    uniforms: { tMap: { value: stripPoolTex() }, uColor: { value: new THREE.Color(o.color) }, uK: { value: 0 }, uFeet: stripMat.uniforms.uFeet, uW: { value: o.width } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tMap; uniform vec3 uColor; uniform float uK, uW; uniform vec4 uFeet; varying vec2 vUv;
      void main(){ float a = texture2D(tMap, vec2(vUv.x, 1.0 - vUv.y)).a; float x = (vUv.x - 0.5) * uW;
        float sp = 1.0 + (1.0 - vUv.y) * 0.6;
        float f = 1.0 - (1.0 - smoothstep(0.0, 0.05 * sp, abs(x - uFeet.x) - uFeet.y * 0.5 * sp)) * 0.85;
        f *= 1.0 - (1.0 - smoothstep(0.0, 0.05 * sp, abs(x - uFeet.z) - uFeet.w * 0.5 * sp)) * 0.85;
        gl_FragColor = vec4(uColor * uK * a * f, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(o.width * 1.25, o.depth).rotateX(-Math.PI / 2), poolMat);
  pool.position.set(0, 0.004, o.depth / 2); pool.renderOrder = 3;
  strip.castShadow = pool.castShadow = false; strip.receiveShadow = pool.receiveShadow = false;
  const light = new THREE.PointLight(o.color, 0, 3.2, 2); light.position.set(0, 0.12, 0.25);
  root.add(strip, pool, light);
  return {
    root, strip, pool, light,
    setOn(v) { v = clamp(v, 0, 1); stripMat.uniforms.uK.value = 6 * o.intensity * v; poolMat.uniforms.uK.value = 0.55 * o.intensity * v; light.intensity = 1.6 * o.intensity * v; light.visible = v > 0; },
    setFeet(list = []) {
      const f = stripMat.uniforms.uFeet.value; f.set(9, 0, 9, 0);
      if (list[0]) { f.x = list[0].x; f.y = list[0].w ?? 0.16; }
      if (list[1]) { f.z = list[1].x; f.w = list[1].w ?? 0.16; }
    },
  };
}

// aBase = the UNSHEARED slab position (cross-section stays the opening rectangle at every depth)
const SHAFT_V = /* glsl */`attribute vec3 aBase; varying vec3 vL; varying float vD; varying float vCam; uniform float uLen;
void main(){ vL = aBase; vD = clamp(-aBase.z / uLen, 0.0, 1.0); vec4 mv = modelViewMatrix * vec4(position, 1.0); vCam = -mv.z; gl_Position = projectionMatrix * mv; }`;
const SHAFT_F = /* glsl */`uniform sampler2D tNoise; uniform float uTime, uK, uDust, uSeed; uniform vec3 uColor; uniform vec2 uHalf;
varying vec3 vL; varying float vD; varying float vCam;
void main(){
  vec2 q = vL.xy / uHalf;                                  // -1..1 across the opening (slab cross-section is constant)
  float edge = smoothstep(1.0, 0.55, abs(q.x)) * smoothstep(1.0, 0.55, abs(q.y));
  float fall = pow(1.0 - vD, 1.6) * smoothstep(0.0, 0.05, vD) * 0.28;   // 0.28 ≈ 1 / slices seen through
  float n = texture2D(tNoise, vec2(vL.x * 0.35 + uSeed, vD * 2.0 - uTime * 0.03)).r;
  float d = texture2D(tNoise, vec2(vL.x * 2.3 + uTime * 0.02, vL.y * 2.3 + vD * 1.7 + uSeed)).g;
  float streak = mix(1.0, 0.65 + 0.7 * n + uDust * 0.5 * smoothstep(0.55, 0.85, d), 0.8);
  float nearFade = smoothstep(0.8, 3.5, vCam);             // no milky veil right in front of the lens
  gl_FragColor = vec4(uColor * uK * edge * fall * streak * nearFade, 1.0);
}`;
export function makeWindowShaft(opts = {}) {
  const o = { width: 1.2, height: 2, dir: [0, -0.35, -1], length: 6, color: '#ffd9a8', intensity: 0.35, dust: 0.6, seed: 3, ...opts };
  const root = new THREE.Group(); root.name = 'windowShaft';
  // the slab volume is drawn as a stack of thin internal slices (4 vertical + 3 horizontal planes swept along −Z)
  // — box faces alone would all sit on the slab's zero-intensity border — then sheared so −Z follows `dir`
  const sl = [];
  const NX = 4, NY = 3;
  for (let i = 0; i < NX; i++) { const p = new THREE.PlaneGeometry(o.length, o.height, 6, 1); p.rotateY(Math.PI / 2); p.translate(lerp(-o.width / 2, o.width / 2, (i + 0.5) / NX) * 0.92, 0, -o.length / 2); sl.push(p); }
  for (let i = 0; i < NY; i++) { const p = new THREE.PlaneGeometry(o.width, o.length, 1, 6); p.rotateX(-Math.PI / 2); p.translate(0, lerp(-o.height / 2, o.height / 2, (i + 0.5) / NY) * 0.92, -o.length / 2); sl.push(p); }
  const g = mergeGeometries(sl.map((x) => { x.deleteAttribute('uv'); x.deleteAttribute('normal'); return x; }), false);
  const d = new THREE.Vector3(...o.dir).normalize();
  if (d.z > -0.05) throw new Error('makeWindowShaft: dir must point along −Z (into the room, local space)');
  // shear: x += z·dx/dz, y += z·dy/dz (z ≤ 0 inside the slab), so the far end of the slab follows `dir`
  const base = g.attributes.position.array.slice();
  g.applyMatrix4(new THREE.Matrix4().set(1, 0, d.x / d.z, 0, 0, 1, d.y / d.z, 0, 0, 0, 1, 0, 0, 0, 0, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { tNoise: { value: getNoiseTex(8, 256) }, uTime: RU.uTime, uK: { value: 0 }, uDust: { value: o.dust }, uSeed: { value: o.seed * 0.37 },
      uColor: { value: new THREE.Color(o.color) }, uHalf: { value: new THREE.Vector2(o.width / 2, o.height / 2) }, uLen: { value: o.length } },
    vertexShader: SHAFT_V,
    fragmentShader: SHAFT_F,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  });
  g.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 5; mesh.frustumCulled = false;
  mesh.castShadow = false; mesh.receiveShadow = false;
  root.add(mesh);
  return { root, mesh, setOn(v) { mat.uniforms.uK.value = o.intensity * clamp(v, 0, 4); mesh.visible = v > 0; } };
}

export function makeDust(opts = {}) {
  const o = { box: [3, 2.5, 6], count: 260, color: '#ffe8c8', size: 0.012, seed: 5, intensity: 1, ...opts };
  const r = rng(o.seed);
  const seeds = new Float32Array(o.count * 4);
  for (let i = 0; i < o.count * 4; i++) seeds[i] = r();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(o.count * 3), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBox: { value: new THREE.Vector3(...o.box) }, uColor: { value: new THREE.Color(o.color) }, uK: { value: o.intensity }, uSize: { value: o.size } },
    vertexShader: `attribute vec4 aSeed; uniform float uTime, uSize; uniform vec3 uBox; varying float vA;
      void main(){ vec3 p = aSeed.xyz;
        p.x += 0.03 * sin(uTime * (0.3 + aSeed.w * 0.4) + aSeed.w * 40.0);
        p.y = fract(p.y + uTime * (0.004 + 0.01 * aSeed.w) * (aSeed.x > 0.5 ? 1.0 : -1.0));
        p.z += 0.03 * cos(uTime * (0.25 + aSeed.y * 0.3) + aSeed.z * 30.0);
        vec3 wp = (p - 0.5) * uBox;
        vec4 mv = modelViewMatrix * vec4(wp, 1.0);
        float dz = -mv.z;
        vA = (0.35 + 0.65 * fract(aSeed.w * 7.13)) * smoothstep(0.6, 1.6, dz);   // no giant motes in the lens
        gl_PointSize = clamp(uSize * 1400.0 / max(0.2, dz), 1.0, 7.0);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uK; varying float vA;
      void main(){ vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.1, length(c)); gl_FragColor = vec4(uColor * uK * vA * a, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 6;
  const root = new THREE.Group(); root.name = 'dust'; root.add(pts);
  return {
    root,
    update(t) { mat.uniforms.uTime.value = t; },
    setOn(v) { mat.uniforms.uK.value = o.intensity * clamp(v, 0, 4); pts.visible = v > 0; },
  };
}
