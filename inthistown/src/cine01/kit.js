/*
 * src/cine01/kit.js — film kit for "The Other Me" (cine01). Everything every act needs, built once.
 * Set builders live in sets.js; the film entry is shots.js; acts are act1.js … act4.js.
 *
 * ─── Loading ────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   await loadFilm()                 Blender models + texture sets + both HDR skies + Inter fonts ('Cine Inter').
 *                                    shots.js awaits it at module top level, so sets (built before init) can use assets.
 * ─── Look / post ────────────────────────────────────────────────────────────────────────────────────────────────────
 *   LOOK                             film-wide grade (cold, near-monochrome, bleach bypass, crushed blacks). post.defaults.
 *   makeFilmRenderFrame()            → renderFrame export (createPost + LOOK). window.__realPost / __realCtx test hooks.
 *   shotPost(extra)                  per-shot post: set.post ⊕ extra (object or (ctx, lt, u) → object) ⊕ the frame's
 *                                    flash (ctx.store.flash, written by K.flash). Use it for EVERY shot.
 *   deepMerge(a, b)
 *   realSet(ctx, { hdr | sky, env, bg, exposure, post, build })   set wrapper (see sets.js)
 * ─── Lightning ──────────────────────────────────────────────────────────────────────────────────────────────────────
 *   flash(ctx, specs, opts) → f      call once per frame in update(). specs = [ 'flash1', 'b02.w4-0.05', 12.3,
 *                                    { at, power = 1, hold = 0.4 (12 f), decay = 0.27 (8 f), attack = 0, floor, seed, bolt,
 *                                    + any of the opts below (a strike's own keys override them) } ].
 *                                    Runs the whole chain: rain/foam/fog-card glint (RU.uFlash), HDR sky, PMREM level,
 *                                    the set's shadow-casting flash light, the bolt mesh, and ctx.store.flash for shotPost.
 *                                    opts: { dir:[x,y,z] toward the strike, light (×), sky (×), env (+), post (× → shotPost),
 *                                    cap (max post flash, default 1), bolt: index into set.bolts | null }
 *   flashEnv(dt, o)                  the envelope alone (peak on frame 0, a 12-frame plateau, one 8-frame decay: no flicker).
 *   flicker(t, seed, rate)           soft far-lightning flicker 0..1 (cloud flicker, never a full flash).
 * ─── Camera / overlays / captions ───────────────────────────────────────────────────────────────────────────────────
 *   frameA(set)                      the locked frame A of beats 1, 2, 8, 10 (cam spec { pos, look, fov }), and its helpers:
 *                                    frameASetup(ctx) in setup; in update frameAPose(ctx, { look }), frameAFlash(ctx, strikes)
 *                                    → f, frameAFloor(ctx, f, level), frameAKid(ctx, f, { warm }), frameAFoam(ctx, at, amb),
 *                                    doubleTells(ctx, level); post: frameAPost(extra). All four uses share them.
 *   emblemFrame(ch, o)               the beat 6 / beat 25 macro: computed from the character's emblem → identical framing.
 *   poolSplit(set) / poolTop(set)    split-level and top-down pool set-ups (cave set).
 *   dist(ctx, p)                     camera→point distance (for dof.focus), after cam.set.
 *   stamp(ctx, text, o)              '3:12 AM' found-footage clock: thin white Inter, top-left ('tl') or bottom-left ('bl').
 *   drawCaptions(g, tl, t, state)    the film's caption renderer (REAL / COPY / MOM / HUSS). Per shot: captionY, captionX
 *                                    (0..1, centre of the spoken line), momY. The first sentence is a two-line hook block.
 * ─── Cast / props ───────────────────────────────────────────────────────────────────────────────────────────────────
 *   castSpecs                        { me, copy (whole body mirrored: scale.x = −1), captain }
 *   initCast(ctx)                    makeReal on all three + the white rag on handR of me and copy → ctx.props.real.{id}
 *                                    (+ the film's low-taper haircut, round headphones with a band behind the neck, the sewn
 *                                    knight). real.{id}.bandMesh / bandBack / ragMat / material.envMapIntensity may be poked
 *                                    in update(): the set puts them back every frame.
 *   setMirror(ch, on)                mirror / un-mirror a character in X (emblem nose + rag hand swap sides).
 *   filmPose(ch, name, t, p)         'stand' | 'kneel' | 'huddle' | 'prone' | 'supine' film poses (see FILM_POSES);
 *   joint(ch, name, x, y, z)         tweak one joint after a pose; follow(ctx, prop, joint, o) = held but not parented.
 *   filmFace(ch, 'creep1'|'creep'|'shout')   film-only faces, swapped in after ch.face() (see buildFilmFace).
 *   makePhone()                      cracked phone: map screen / torch, light, beam. hold(ch, phone, 'L'|'R', ctx);
 *   phoneToward(ctx, ch, phone, side, target)   phone raised in the hand, screen to the eyes (POV macro); eyePoint(ch).
 *   makeFootprints(points, o)        sneaker-sole decals (wet depressions, L/R mirrored); printTrail(from, to, o) → points.
 *   makeMirrorPool(ctx, o)           planar-reflection still pool with actor substitution + see-through mode.
 */
import * as THREE from 'three';
import { MAIN } from '../cast.js';
import { makeCharacter } from '../characters.js';
import { rng, clamp, lerp, smooth, ease, hash, noise1, canvasTexture } from '../lib/util.js';
import { createPost, makeRenderFrame } from '../real/post.js';
import { RU, setFrame, PRE_RENDER, inScene } from '../real/materials.js';
import { makeSky, bakeEnvironment, makeContactShadow } from '../real/env.js';
import { loadAssets, getAsset, loadHDR, textureSet } from '../real/assets.js';
import { makeReal } from '../real/realchar.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const RAG_GLOW = 0.022;      // the rag's own faint glow (so the white cloth reads in the dark)
const arr3 = (v) => (Array.isArray(v) ? V3(v[0], v[1], v[2]) : v.clone());
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
export const FONT = 'Cine Inter';
export const W = 1080, H = 1920;

// ═════════════════════════════════════════════ loading ════════════════════════════════════════════════════════════
export const TEX_SETS = ['wet_sand', 'wood_planks', 'wet_fabric', 'rope', 'driftwood', 'cliff_rock', 'beach_pebbles', 'mossy_rock'];
let _ready = null;
export function loadFilm() {
  if (_ready) return _ready;
  _ready = (async () => {
    await loadAssets();                                   // every Blender model
    await loadAssets(TEX_SETS.map((n) => 'tex:' + n));
    await loadHDR('storm_night'); await loadHDR('storm_day');
    for (const w of [400, 500, 600, 700, 800]) {
      const f = new FontFace(FONT, `url(/node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff2)`, { weight: String(w) });
      await f.load(); document.fonts.add(f);
    }
    await Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 60px "${FONT}"`, 'Ag')));
    await document.fonts.ready;
    return true;
  })();
  return _ready;
}
const _pm = new Map();
/** PMREM of a loaded HDR sky (sync; loadFilm() must have resolved). */
export function pmremFromHDR(renderer, name) {
  if (_pm.has(name)) return _pm.get(name);
  const pm = new THREE.PMREMGenerator(renderer);
  const prev = renderer.getRenderTarget();
  const rt = pm.fromEquirectangular(getAsset(name));
  renderer.setRenderTarget(prev);
  pm.dispose();
  _pm.set(name, rt.texture);
  return rt.texture;
}

// ═════════════════════════════════════════════ look / post ════════════════════════════════════════════════════════
// ONE look for the whole film: cold, near-monochrome, high contrast, crushed blacks, white highlights, bleach bypass.
export const LOOK = {
  bloom: { strength: 0.16, threshold: 0.95, knee: 0.6, radius: 1 },
  grade: {
    temperature: -0.3, tint: -0.02, saturation: 0.3, bleach: 0.5, contrast: 1.4, pivot: 0.4, blackPoint: 0.035, whitePoint: 0.96,
    shadowTint: '#1d5a6a', shadowAmt: 0.2, highlightTint: '#ffd2a0', highlightAmt: 0,
  },
  ca: 0.003, vignette: 0.55, grain: 0.06, fxaa: true,
};
export function deepMerge(a, b) {
  const o = { ...a };
  for (const k of Object.keys(b || {})) {
    const x = a ? a[k] : undefined, y = b[k];
    o[k] = (y && typeof y === 'object' && !Array.isArray(y) && x && typeof x === 'object' && !Array.isArray(x)) ? deepMerge(x, y) : y;
  }
  return o;
}
/** per-shot post config: set.post ⊕ extra ⊕ this frame's lightning flash (from K.flash via ctx.store). */
export const shotPost = (extra) => (ctx, lt, u) => {
  const base = ctx.set && ctx.set.post ? ctx.set.post : {};
  const e = typeof extra === 'function' ? extra(ctx, lt, u) || {} : extra || {};
  const cfg = deepMerge(base, e);
  const f = ctx.store && ctx.store.flash ? ctx.store.flash : 0;
  if (f > 0 && cfg.flash == null) cfg.flash = Math.min(ctx.store.flashCap ?? 1, f * (ctx.store.flashPost ?? 1));
  return cfg;
};
export function makeFilmRenderFrame() {
  return makeRenderFrame((ctx) => {
    const p = createPost(ctx, { msaa: QS.has('msaa') ? +QS.get('msaa') : 0 });
    p.defaults(LOOK);
    if (typeof window !== 'undefined') { window.__realPost = p; window.__realCtx = ctx; }
    return p;
  });
}

/**
 * Set wrapper. Either `hdr: 'storm_night' | 'storm_day'` (Blender HDR as background + PMREM) or `sky: {makeSky opts}`.
 *   env: { intensity, rotation (rad about Y), flash (+intensity per unit flash) }
 *   bg:  { intensity, rotation (defaults to env.rotation), blur, flash (× per unit flash) }
 * build({ root, add, set }) adds parts (`add(p)` parents p.root / an Object3D and registers p.update) and returns extras.
 * set.update(t): setFrame({t}) (resets wind/flash/rain uniforms), environment + background state, flash reset, parts.
 */
export function realSet(ctx, { hdr = null, sky = null, env = {}, bg = {}, exposure = 1, post = {}, build }) {
  const root = new THREE.Group();
  const parts = [];
  const add = (p) => { if (!p) return p; if (p.root) root.add(p.root); else if (p.isObject3D) root.add(p); if (p.update) parts.push(p); return p; };
  let envTex, skyP = null, background = new THREE.Color('#000000');
  if (hdr) { envTex = pmremFromHDR(ctx.renderer, hdr); background = getAsset(hdr); }
  else { skyP = add(makeSky(sky || {})); envTex = bakeEnvironment(ctx.renderer, null, sky || {}, env); }
  const set = {
    root, sky: skyP, envTex, exposure, post, background, fog: null, anchors: {}, parts, add,
    env: { intensity: env.intensity ?? 1, rotation: env.rotation ?? 0, flash: env.flash ?? 0.8 },
    bg: { intensity: bg.intensity ?? 1, rotation: bg.rotation ?? env.rotation ?? 0, blur: bg.blur ?? 0, flash: bg.flash ?? 2.5 },
    wind: [1.5, 0.4], rainAmount: 1, flashLight: null, flashPower: 3, bolts: [], rig: null,
  };
  Object.assign(set, build({ root, add, set }) || {});
  set.update = (t) => {
    setFrame({ t, wind: set.wind, rain: set.rainAmount });
    const sc = ctx.scene;
    sc.environment = set.envTex; sc.environmentIntensity = set.env.intensity;
    if (sc.environmentRotation) sc.environmentRotation.set(0, set.env.rotation, 0);
    sc.backgroundIntensity = set.bg.intensity; sc.backgroundBlurriness = set.bg.blur;
    if (sc.backgroundRotation) sc.backgroundRotation.set(0, set.bg.rotation, 0);
    // no flash unless the shot asks for one this frame (K.flash runs later, in shot.update)
    if (set.flashLight) set.flashLight.intensity = 0;
    for (const b of set.bolts) b.visible = false;
    if (set.sky) set.sky.setFlash(0);
    if (set.rig) set.rig.update(t, 0);
    // rain-soak of the kid and the double comes from the set's `wet` option (engine-restored per shot): calling
    // real.x.setWet() in a shot's setup would leak into other shots (random-access determinism) — use the option, or
    // call setWet in update().
    const R = ctx.props && ctx.props.real;
    if (R && set.options && set.options.wet != null) { if (R.me) R.me.setWet(set.options.wet); if (R.copy) R.copy.setWet(set.options.wet); }
    // fabric weave strength: 1 unless a shot raises it THIS frame (the knight macros): K.weave(ctx, id, k) in update()
    // per-frame pokes a shot may make on the kid and the double are undone here: fabric weave (K.weave), the glow of the
    // headphone band behind the neck and of the rag (K.frameAKid), that band's visibility (real.bandMesh: it was added in
    // init, so the engine's cast snapshot does not restore it), the sky's light on the body (b15: the double as a cut-out)
    if (R) for (const id of ['me', 'copy']) if (R[id]) { R[id].uniforms.uDetail.value = 1; if (R[id].bandBack) { R[id].bandBack.emissiveIntensity = 0; R[id].bandMesh.visible = true; } if (R[id].ragMat) R[id].ragMat.emissiveIntensity = RAG_GLOW; R[id].material.envMapIntensity = 1; }
    for (const p of parts) p.update(t, ctx.camera);
    if (set.onUpdate) set.onUpdate(t);
  };
  return set;
}

// ═════════════════════════════════════════════ lightning ══════════════════════════════════════════════════════════
/**
 * Flash envelope at dt seconds after the strike: ONE flash = one attack (peak on frame 0), a plateau (`floor` × the peak:
 * the script's 12 frames) and one decay (8 frames). One up-transition, one down-transition: no return strokes by default.
 * (The old default drew 3-4 return strokes over a 0.4 floor: every strike was a 7-10 Hz flicker, which breaks the film's
 * "one flash" rule and is a photosensitivity problem the moment a flash is really white.) o: { power 1, hold 0.4, decay
 * 0.27, attack 0, floor 0.85, strokes 1 (> 1 = extra return strokes inside the hold, for far sheet lightning only), seed }.
 * Pure function.
 */
export function flashEnv(dt, o = {}) {
  const hold = o.hold ?? 0.4, decay = o.decay ?? 0.27, power = o.power ?? 1, attack = o.attack ?? 0, seed = o.seed ?? 1;
  if (dt < -attack || dt > hold + decay) return 0;
  if (dt < 0) return power * Math.pow(1 + dt / attack, 2);
  const r = rng(seed * 17 + 3);
  const n = o.strokes ?? 1;
  let f = 0, tk = 0;
  for (let k = 0; k < n; k++) {
    const amp = k === 0 ? 1 : 0.6 + 0.4 * r(), tau = 0.045 + 0.05 * r(), d = dt - tk;
    if (d >= 0) f = Math.max(f, amp * Math.exp(-d / tau));
    tk += (hold / n) * (0.75 + 0.5 * r());
  }
  const env = dt <= hold ? 1 : Math.pow(1 - (dt - hold) / decay, 1.7);
  return power * Math.max(f, o.floor ?? 0.85) * env;
}
/** soft far-off cloud flicker 0..1 (for "one far lightning flicker, soft, not a full-frame flash"): a few short pulses per `rate` s */
export function flicker(t, seed = 1, rate = 2.6) {
  const k = Math.floor(t / rate), ph = hash(k * 7.3 + seed * 31.7), t0 = (k + 0.15 + 0.6 * ph) * rate, d = t - t0;
  if (d < 0 || d > 0.5) return 0;
  return (0.5 + 0.5 * hash(k + seed)) * Math.max(Math.exp(-d / 0.06), 0.7 * Math.exp(-Math.abs(d - 0.16) / 0.05), 0.2 * (1 - d / 0.5));
}
const _fd = V3();
/** One call per frame (in shot.update): evaluates the strikes and runs lightning → rain/foam glint → sky → flash light → bolt → post. */
export function flash(ctx, specs = [], opts = {}) {
  let f = 0, best = null;
  (Array.isArray(specs) ? specs : [specs]).forEach((s0, i) => {
    const s = s0 && typeof s0 === 'object' ? s0 : { at: s0 };
    const t0 = typeof s.at === 'number' ? s.at : ctx.time(s.at);
    const v = flashEnv(ctx.t - t0, { seed: Math.round(t0 * 10) + 1 + i, ...s });
    if (v > f) { f = v; best = s; }
  });
  return applyFlash(ctx, f, best ? { ...opts, ...best } : opts);
}
/** Apply a flash level f (0..1+) to everything. Also usable directly with your own curve (e.g. the beat 19 white-out). */
export function applyFlash(ctx, f, o = {}) {
  const set = ctx.set, sc = ctx.scene;
  RU.uFlash.value = f * (o.glint ?? 1);
  if (set) {
    sc.backgroundIntensity = set.bg.intensity * (1 + f * (o.sky ?? set.bg.flash));
    sc.environmentIntensity = set.env.intensity + f * (o.env ?? set.env.flash);
    const dir = o.dir || set.flashDir;
    if (set.sky) set.sky.setFlash(f, dir ? _fd.fromArray(dir).normalize() : undefined);
    if (set.rig) set.rig.update(ctx.t, f * (o.rig ?? 0.25));
    if (set.flashLight) {
      set.flashLight.intensity = f * (o.light ?? 1) * set.flashPower;
      if (dir) { _fd.fromArray(dir).normalize(); set.flashLight.position.copy(set.flashLight.target.position).addScaledVector(_fd, 60); }
    }
    const bi = o.bolt === undefined ? set.defaultBolt : o.bolt;
    set.bolts.forEach((b, i) => { b.visible = bi === i && f > 0.12; b.material.uniforms.uI.value = f; });
  }
  ctx.store.flash = f; ctx.store.flashPost = o.post ?? (set && set.flashPost) ?? 1; ctx.store.flashCap = o.cap ?? 1;
  return f;
}

// ═════════════════════════════════════════════ camera helpers ═════════════════════════════════════════════════════
/** distance from the camera state to a point (call after cam.set): dof.focus */
export function dist(ctx, p) { return ctx.cam.state.pos.distanceTo(ctx.point(p)); }
/**
 * FRAME A (beats 1, 2, 8, 10 and the loop target): locked long lens, 10 m behind the kid and 1.6 m inland, a little above
 * his head. He stands on anchors.kidA (+ FRAME_A_DZ) at the water's edge with his back to us, WHOLE in the lower right
 * (head, shoulders, both arms, the white rag fist, legs): the same silhouette as the one up the beach, which is the point
 * of the frame. The foam line runs up the middle; the double stands on it on anchors `double18/12/9/7/5`, 16 % → 30 % of
 * the frame height, his right edge always ~200 px clear of the kid's head. The storm sky and the headland fill the top
 * 45 %; the wreck cuts the left edge; the near strikes (set.bolts[4], [5]) come down in the gap between the two of them.
 * DOF off. Shots use the helpers below: frameASetup (setup), then in update frameAPose, frameAFlash / frameAFloor,
 * frameAKid, frameAFoam, doubleTells, and `post: K.frameAPost()`.
 */
export function frameA(set) {
  const k = set.anchors.kidA, z = k.z + FRAME_A_DZ;
  const back = 10, side = 1.6, h = 2.55, fov = 27.8, kidX = 820, headY = 1020;
  // the lens axis: the kid's axis sits at screen x = kidX and the top of his hair (2.2 m) at screen y = headY
  const vf = fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * W / H), pxh = (W / 2) / Math.tan(hf / 2), pxv = (H / 2) / Math.tan(vf / 2);
  const yaw = Math.atan2(side, back) - Math.atan((kidX - W / 2) / pxh);                 // bearing of the axis off −X, + = toward the sea
  const pitch = Math.atan2(2.2 - h, Math.hypot(back, side)) + Math.atan((headY - H / 2) / pxv);   // + = up
  const d = 28;
  return { pos: [k.x + back, k.y + h, z + side], look: [k.x + back - d * Math.cos(yaw), k.y + h + d * Math.tan(pitch), z + side - d * Math.sin(yaw)], fov };
}
/** frame A: the kid stands this far (m, +Z = inland) from anchors.kidA */
export const FRAME_A_DZ = -0.1;
/** frame A: the kid's body yaw: his back to the lens, turned a little inland, so the lens sees his back and his LEFT side */
export const FRAME_A_YAW = -Math.PI / 2 + 0.3;
/** frame A: the kid's right upper-arm euler (K.filmPose 'stand' armR): swung back and out, so the white rag fist shows beside his hip */
export const FRAME_A_ARM = [0.42, 0, 0.26];
/** frame A set-up (call in setup): the kid on his mark, the locked lens, a soft contact shadow under him */
export function frameASetup(ctx) {
  const k = ctx.set.anchors.kidA;
  ctx.place('me', [k.x, k.y, k.z + FRAME_A_DZ], { yaw: FRAME_A_YAW });
  ctx.cam.set(frameA(ctx.set));
  const b = makeContactShadow(0.7, 0.5); b.position.set(k.x, k.y + 0.025, k.z + FRAME_A_DZ); ctx.add(b);
}
/** frame A: the kid's pose for this frame (call in update). p: { look: the point he looks at (Vector3), breathe } */
export function frameAPose(ctx, p = {}) {
  const me = ctx.cast.me, r = me.root.position;
  const hy = p.look ? Math.atan2(p.look.x - r.x, p.look.z - r.z) - FRAME_A_YAW : -0.3;       // head yaw relative to the body
  filmPose(me, 'stand', ctx.t, { breathe: p.breathe ?? 1, headYaw: Math.atan2(Math.sin(hy), Math.cos(hy)) + (p.headYaw ?? 0), headPitch: p.headPitch ?? 0,
    armR: [FRAME_A_ARM[0], 0, FRAME_A_ARM[2]], foreR: -0.3, armL: [0.02, 0, 0.1], foreL: -0.12 });
  ctx.props.real.me.update(ctx.t);
}
/**
 * Frame A: the strikes. One call per frame in update(). strikes = [{ at, bolt: 4 | 5 | null, power = 1.3 }]:
 *   with a bolt   ONE flash in two steps down: a white pop (5 frames at full level: sky, fog and sea burn out, the two
 *                 figures are black cut-outs), then it sinks to ~45 % and holds there, the forked bolt now crisp against the
 *                 sky, and dies over 9 frames. One rise, one fall: no flicker.
 *   bolt: null    sheet lightning far out over the sea: one soft swell (power 0.8).
 * Sets ctx.store.strike (the level frameAPost works from) and ctx.store.glowDir (the fog's glow sits on the foot of the
 * strike that is lit). Returns the level.
 */
export function frameAFlash(ctx, strikes) {
  const specs = [], t = ctx.t, c = ctx.cam.state.pos, feet = ctx.set.boltFeet || [];
  let foot = null, lit = -1;
  for (const s of strikes) {
    const P = s.power ?? (s.bolt == null ? 0.8 : 1.3), t0 = ctx.time(s.at);
    if (s.bolt == null) specs.push({ at: s.at, bolt: null, power: P, hold: 0.3, decay: 0.3, floor: 0.9, ...FA_LOOK });
    else specs.push({ at: s.at, bolt: s.bolt, power: P, hold: 0.15, decay: 0.25, floor: 1, ...FA_LOOK }, { at: s.at, bolt: s.bolt, power: P * 0.42, hold: 0.55, decay: 0.3, floor: 1, ...FA_LOOK });
    const e = flashEnv(t - t0, { power: P, hold: 0.55, decay: 0.3 });
    if (e > lit || (lit <= 0 && t >= t0 - 0.2)) { lit = e; foot = s.bolt == null ? [-60, 12, -34] : feet[s.bolt]; }
  }
  const f = flash(ctx, specs);
  for (const s of strikes) if (s.bolt != null) ctx.set.bolts[s.bolt].material.uniforms.uI.value = 0.8 * f;      // a line, not a smear: at full level the bloom swallows the bolt
  ctx.store.strike = f;
  if (foot) { const n = Math.hypot(foot[0] - c.x, foot[1] - c.y, foot[2] - c.z); ctx.store.glowDir = [(foot[0] - c.x) / n, (foot[1] - c.y) / n, (foot[2] - c.z) / n]; }
  return f;
}
// frame A: how a strike is spread over the picture (K.flash opts): little on the grade's flash (the fog, the sky and the exposure
// do the work: frameAPost), the storm sky x 3.2 per unit, a hard light on the wet sand, nothing extra from the environment
const FA_LOOK = { post: 0.25, sky: 3.2, light: 3.4, env: 0 };
/**
 * Frame A: the storm's floor under the picture (sheet lightning far out at sea: never black). Call right after
 * frameAFlash with its level f; `level` is the floor (flash units). The floor and the strike are joined component by
 * component (the larger wins), so a dying strike lands on the floor without a step.
 */
export function frameAFloor(ctx, f, level) {
  const set = ctx.set, m = Math.max(f, level);
  RU.uFlash.value = m;
  ctx.scene.backgroundIntensity = set.bg.intensity * (1 + m * FA_LOOK.sky);
  if (set.flashLight) {
    set.flashLight.intensity = Math.max(f * FA_LOOK.light, level * 0.45) * set.flashPower;
    // (its direction too, every frame: a shot that has no strike never went through applyFlash, and the light would keep
    // whatever direction the last rendered shot left it with)
    if (set.flashDir) { _fd.fromArray(set.flashDir).normalize(); set.flashLight.position.copy(set.flashLight.target.position).addScaledVector(_fd, 60); }
  }
  ctx.store.flash = Math.max(f * FA_LOOK.post, level); ctx.store.flashPost = 1; ctx.store.flashCap = 1;
}
/**
 * Frame A's look in a flash (use as the shot's `post`): the exposure opens a little, the fog beyond the two of them lights
 * up with a glow round the foot of the strike, the cloud deck and the headland show through it, the bloom is pulled down so
 * the silhouettes stay hard. `extra` is merged on top (object or (ctx, lt, u) → object).
 */
export const frameAPost = (extra) => shotPost((ctx, lt, u) => {
  const f = Math.min(1.3, ctx.store.strike || 0), g = Math.min(1, f), c = 0.1, moon = [-0.7, 0.5, -0.5], gd = ctx.store.glowDir || moon;
  const e = typeof extra === 'function' ? extra(ctx, lt, u) || {} : extra || {};
  return deepMerge({ exposure: 1 + 0.62 * f,
    fog: { start: lerp(9, 30, g), sky: lerp(0.9, 0.3, g), density: 0.012 * (1 + 0.6 * f), color: [lerp(0.055, 0.86 * c, g), lerp(0.07, 0.93 * c, g), lerp(0.085, c, g)],
      sunDir: gd.map((v, i) => lerp(moon[i], v, g)), glow: lerp(0.9, 8, g), glowPower: lerp(6, 400, g) },
    bloom: { strength: lerp(0.2, 0.07, g), threshold: lerp(0.9, 1.2, g) },
    grade: { contrast: 1.4 + 0.12 * g } }, e);
});
/**
 * Frame A: the wash. The foam's leading lip is pinned to the double's feet (he always stands ON the foam line: he came
 * out of the water), it swings less than elsewhere on the beach, and `ambient` is its glow. Call every frame in update();
 * `at` = where the double stands (Vector3; blend it while he "moves in the dark" so the lip slides, never jumps).
 */
export function frameAFoam(ctx, at, ambient = 0.34) {
  const u = ctx.set.foam.uniforms, sw = 0.35;
  u.uSwing.value = sw; u.uAmbient.value = ambient;
  u.uWash.value = at.z - 0.05 - sw * (ctx.set.washEdge(at.x, ctx.t) - 0.25);       // (the shader's edge = 0.25 + uSwing × swell + uWash: the lip lands 0.2 m inland of his feet)
}
/**
 * Frame A's light on the kid, the same in every use (b01/b02, b08, b10b = the loop target). He is seen from behind, in
 * black, at night: his back stays black and he is drawn with what a back light can find:
 *   edge   a low kicker from up the beach on the inland side: the LEFT faces of his head (the ear, the taper of his hair),
 *          of his sleeve, hand and leg. o.warm (0..1): the campfire under the wreck is that light in beats 8 and 10.
 *   rim    a steep back light: the plates of his hair, the roll of the hood, the tops of his shoulders.
 *   band   the white headphone band behind his neck and the white rag on his right fist catch the sky (a little emissive:
 *          no lamp can reach them from the lens side without also lighting his back).
 * Nothing comes from the lens side (the set's moon fill is switched off for the frame). The two rocks that stood right
 * behind his head are hidden: his head is cut out against the sea. In a flash he is a black shape with a hot left edge.
 * Call every frame in update(), AFTER placing him, with the frame's STRIKE level f (not the storm floor). The lamps are
 * per-shot objects (ctx.add, kept in ctx.store); everything else touched here is rewritten by the set every frame.
 */
export function frameAKid(ctx, f = 0, o = {}) {
  const k = ctx.set.anchors.kidA, S = ctx.store, z = k.z + FRAME_A_DZ, R = ctx.props.real.me, warm = o.warm ?? 0;
  if (!S.faRim) {
    const spot = (ang) => { const l = ctx.add(new THREE.SpotLight('#dfe9ff', 0, 0, ang, 0.6, 2)); ctx.add(l.target); return l; };
    S.faRim = spot(0.3); S.faEdge = spot(0.42);
  }
  S.faRim.position.set(k.x - 1.2, k.y + 5.0, z - 0.3); S.faRim.target.position.set(k.x, k.y + 1.55, z);
  S.faRim.intensity = 10;
  S.faEdge.position.set(k.x - 2.1, k.y + 0.6, z + 2.7); S.faEdge.target.position.set(k.x, k.y + 1.3, z + 0.2);
  S.faEdge.color.set('#dfe9ff').lerp(_warm, warm);
  S.faEdge.intensity = (8 + 6 * f) * (1 + 0.5 * warm * (o.flicker ?? 1));
  if (ctx.set.moon) ctx.set.moon.fill.intensity = 0;
  const w = ctx.set.world; if (w && w.rocks) { w.rocks[0].visible = false; w.rocks[2].visible = false; }
  if (R.bandBack) R.bandBack.emissiveIntensity = 0.15 + 0.1 * f;
  if (R.ragMat) R.ragMat.emissiveIntensity = 0.14 + 0.1 * f;
}
const _warm = new THREE.Color('#ff8a3c');
/**
 * Frame A: the double's TELLS. In a flash he is a black cut-out against the lit fog, but the things that say "this is me"
 * must answer the light: the two headphone cups on his chest, the knight between them, his sneakers. The cups and the
 * knight are UNLIT twins of the real ones (a disc on each cup's outer face, a copy of the emblem a millimetre in front of
 * it), so their brightness is exactly `level` and nothing else on him is touched: a lamp from the lens side would also
 * light his face (the script wants it lost in the silhouette) and his grey legs. The sneakers get a tiny lamp at his toes
 * (range 1.1 m). level: ~0.1 = a dim glimmer in the storm's floor, ~0.4 = white in the flash. Call every frame in
 * update() after placing him; everything is a per-shot object.
 */
export function doubleTells(ctx, level = 0) {
  const S = ctx.store, copy = ctx.cast.copy;
  if (!S.dt) {
    const torso = copy.joints.torso, em = copy.root.getObjectByName('emblem');
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
    const kmat = new THREE.MeshBasicMaterial({ color: 0x000000, map: em.material.map, transparent: true, depthWrite: false, fog: false });
    const front = em.position.z - 0.004, cx = 0.19 * (0.9 + 0.1 * ((copy.spec && copy.spec.build) ?? 1));     // (as in smoothHeadphones)
    for (const sx of [-1, 1]) {
      const h = ctx.add(new THREE.Group(), torso); h.position.set(sx * (cx + 0.016), 0.34, front + 0.055); h.rotation.set(-1.15, 0, sx * 0.5);
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.052, 32), mat); d.rotation.x = Math.PI / 2; d.position.y = -0.0072; h.add(d);
    }
    const k = ctx.add(new THREE.Mesh(em.geometry, kmat), em.parent); k.position.copy(em.position); k.position.z += 0.0015; k.quaternion.copy(em.quaternion); k.scale.copy(em.scale); k.renderOrder = 4;
    S.dt = { mat, kmat, foot: ctx.add(new THREE.PointLight('#dfe9ff', 0, 1.1, 2)) };
  }
  const p = copy.root.position;
  S.dt.mat.color.setScalar(level); S.dt.kmat.color.setScalar(level * 0.85);
  S.dt.foot.position.set(p.x + 0.55, p.y + 0.16, p.z); S.dt.foot.intensity = 0.5 * level;
}
const _e = V3(), _n = V3(), _q = new THREE.Quaternion();
const KNIGHT_W = 0.165;     // width of the drawn knight on its 0.25 m decal
/**
 * Emblem macro (beat 6, re-used EXACTLY by beat 25): frontal, locked on the knight. The knight (0.165 m wide) fills `fill`
 * (0.45) of the frame width. Returns { pos, look, fov, focus }. Computed from the emblem's world matrix, so both shots get
 * the same framing whatever the pose / set; with the mirrored copy the nose simply points the other way.
 */
export function emblemFrame(ch, { distance = 1.7, fill = 0.45, dx = 0, dy = 0.0 } = {}) {
  const em = ch.root.getObjectByName('emblem');
  ch.root.updateWorldMatrix(true, true);
  em.getWorldPosition(_e);
  ch.joints.torso.getWorldQuaternion(_q);
  _n.set(0, 0, 1).applyQuaternion(_q); _n.y = 0; _n.normalize();        // level camera: no tilt even if he leans
  const w = KNIGHT_W / fill, fov = 2 * THREE.MathUtils.radToDeg(Math.atan((w / 2) / distance * (16 / 9)));
  const look = [_e.x + dx, _e.y + dy, _e.z];
  return { pos: [_e.x + dx + _n.x * distance, _e.y + dy, _e.z + _n.z * distance], look, fov, focus: distance };
}
/** split-level pool set-up (beats 17/18): camera at the far pool edge a hand above the water, kid kneeling on anchors.kneel */
export function poolSplit(set, { fov = 46, height = 0.2 } = {}) {
  const k = set.anchors.kneel, c = set.anchors.poolCam;
  return { pos: [c.x, set.waterY + height, c.z], look: [k.x, set.waterY + height * 0.4, k.z], fov };
}
/** locked top-down on the pool (beats 26/27): looking straight down, the kneel edge (+ phone) at the bottom of frame */
export function poolTop(set, { fov = 54, height = 3.3, dz = 1.0 } = {}) {
  const p = set.anchors.poolCenter;
  return { pos: [p.x, set.waterY + height, p.z + dz + 0.02], look: [p.x, set.waterY, p.z + dz], fov };
}

// ═════════════════════════════════════════════ overlays ═══════════════════════════════════════════════════════════
/** Found-footage clock stamp ('3:12 AM'): small, thin, white. o: { at: 'tl' | 'bl' | 'tr', alpha = 1, size = 38, y } */
export function stamp(ctx, text, o = {}) {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0) return;
  ctx.fx.draw((g, w, h) => {
    const k = w / W, size = (o.size ?? 38) * k, at = o.at || 'tl';
    g.font = `400 ${size}px "${FONT}", sans-serif`;
    try { g.letterSpacing = `${(3.5 * k).toFixed(2)}px`; } catch (e) { /* older canvas */ }
    g.textBaseline = 'middle'; g.textAlign = at === 'tr' ? 'right' : 'left';
    const x = at === 'tr' ? w - 72 * k : 72 * k, y = (o.y ?? (at === 'bl' ? 0.895 : 0.082)) * h;
    g.globalAlpha = 0.92 * clamp(alpha, 0, 1);
    g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 10 * k; g.shadowOffsetY = 1.5 * k;
    g.fillStyle = '#ffffff';
    g.fillText(String(text), x, y);
  });
}

// ═════════════════════════════════════════════ captions ═══════════════════════════════════════════════════════════
const PUNCT_BREAK = /(\.\.\.|…|[.,!?;:])["')]*$/;
function buildPhrases(tl) {
  const out = [];
  for (const b of tl.beats) {
    const ws = (b.words || []).filter((w) => String(w.text || '').trim());
    if (!ws.length) continue;
    if (b.kind === 'huss' || ws[0].kind === 'huss') { out.push({ kind: 'huss', items: [{ w: ws[0], text: 'HUSS!' }], start: ws[0].start, end: ws[ws.length - 1].end }); continue; }
    const toks = String(b.text || '').split(/\s+/).filter(Boolean);
    const exact = toks.length === ws.length;
    const kind = (ws[0].speaker || b.speaker) === 'copy' ? 'copy' : 'narr';
    let cur = [];
    let punct = false;
    const flush = () => { if (cur.length) out.push({ kind, items: cur, start: cur[0].w.start, end: cur[cur.length - 1].w.end, brk: punct }); cur = []; punct = false; };
    ws.forEach((w, i) => {
      const raw = exact ? toks[i] : String(w.text);
      const brk = exact && PUNCT_BREAK.test(raw);
      cur.push({ w, text: raw.replace(/[.,;:]+$/, (m) => (m.startsWith('...') ? '...' : '')) });
      const next = ws[i + 1];
      if (!next) return flush();
      const gap = next.start - w.end, left = ws.length - 1 - i;
      const chars = cur.reduce((n, c) => n + c.text.length + 1, 0);
      const nextEnds = left === 1 || (exact && PUNCT_BREAK.test(toks[i + 1]));      // don't strand a single word
      if (brk || gap > 0.26) { punct = true; return flush(); }
      if (cur.length >= 4 || (cur.length >= 3 && chars >= 15 && !nextEnds) || (cur.length >= 2 && chars >= 20)) return flush();
    });
    flush();
  }
  out.sort((a, b) => a.start - b.start);
  // THE HOOK: the film's first sentence is on screen, whole, from frame 0, as ONE two-line block that stays until the beat
  // is over (a muted scroller gets the whole premise at once; the words only brighten a touch as they are spoken)
  const hb = tl.beats.find((b) => (b.words || []).length && b.kind !== 'huss');
  if (hb && hb.words[0].start < 0.6 && (hb.words[0].speaker || hb.speaker) !== 'copy') {
    const ws = hb.words.filter((w) => String(w.text || '').trim()), toks = String(hb.text || '').split(/\s+/).filter(Boolean), exact = toks.length === ws.length;
    const items = ws.map((w, i) => ({ w, text: exact ? toks[i] : String(w.text) }));
    // two lines: break after the punctuation mark nearest the middle (else at the middle word)
    const total = items.reduce((n, it) => n + it.text.length + 1, 0);
    let cut = Math.ceil(items.length / 2), best = 1e9, acc = 0;
    items.forEach((it, i) => { acc += it.text.length + 1; if (i < items.length - 1 && PUNCT_BREAK.test(it.text)) { const d = Math.abs(acc - total / 2); if (d < best) { best = d; cut = i + 1; } } });
    const end = ws[ws.length - 1].end;
    while (out.length && out[0].start < end) out.shift();
    out.unshift({ kind: 'narr', block: [items.slice(0, cut), items.slice(cut)], items, start: 0, end });
  }
  out.forEach((p, i) => { const nx = out[i + 1]; p.until = Math.min(nx ? nx.start : Infinity, p.end + (p.kind === 'huss' ? 0.6 : 0.5)); });
  return out;
}
function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/** one REAL caption word: white, a soft dark shadow, and a 4 px 60 % black stroke under it (the shadow alone fails on a white flash, on foam, on skin) */
function strokedWord(g, text, x, y, k) {
  g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16 * k; g.shadowOffsetY = 2 * k;
  g.lineWidth = 8 * k; g.strokeStyle = 'rgba(0,0,0,0.6)';        // (centred on the outline: 4 px show outside the glyph)
  g.strokeText(text, x, y);
  g.shadowBlur = 5 * k; g.shadowOffsetY = 1 * k;
  g.fillStyle = '#ffffff';
  g.fillText(text, x, y);
}
/**
 * The film's caption renderer (export it from shots.js as drawCaptions).
 *   REAL  speaker 'narr': white Inter 600, soft dark shadow + a 4 px 60 % black stroke, 2–4-word phrase that builds word by
 *         word, centred, y 0.62. The film's first sentence (the hook) is one two-line bold block, whole from frame 0.
 *   COPY  speaker 'copy': black Inter 700 on a solid white box (the tell that the narrator changed).
 *   MOM   tl.subs style 'mom': small rounded phone-message bubble with the whole line, t0 → t1.
 *   HUSS  the one shout: a big white word with a short shake.
 * state.hidden (shot `captions: false`) hides everything. captionOptions: { y (0.62), momY (0.665) }.
 */
export function drawCaptions(g, tl, t, state = {}) {
  if (state.hidden) return;
  const opts = state.options || {};
  if (!tl.__cinePhrases) tl.__cinePhrases = buildPhrases(tl);
  const cw = g.canvas.width, chh = g.canvas.height, k = cw / W;
  // per-shot placement: shot.captionY / shot.captionX (0..1) move the centre of the spoken line (frame A: under the
  // double's feet, across the kid's back), shot.momY the phone bubble
  const shot = state.ctx && state.ctx.shot ? state.ctx.shot : null;
  const cx = cw * ((shot && shot.captionX) ?? 0.5), cy = chh * ((shot && shot.captionY) ?? opts.y ?? 0.62);
  g.save();
  g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.lineJoin = 'round';
  try { g.letterSpacing = '0px'; } catch (e) { /* */ }
  // ── spoken phrase
  let ph = null;
  for (const p of tl.__cinePhrases) { if (p.start <= t && t < p.until) ph = p; }
  if (ph) {
    const out = clamp((ph.until - t) / 0.1, 0, 1);
    if (ph.kind === 'huss') {
      const lt = t - ph.start;
      let size = 172 * k;
      g.font = `800 ${size}px "${FONT}", sans-serif`;
      try { g.letterSpacing = `${(10 * k).toFixed(1)}px`; } catch (e) { /* */ }
      const text = 'HUSS!';
      const tw = g.measureText(text).width;
      const amp = lt < 0.32 ? 16 * k * Math.pow(1 - lt / 0.32, 1.5) : 0;
      const sx = amp * Math.sin(lt * 96 + 1.3), sy = amp * Math.cos(lt * 127 + 0.4);
      const sc = lerp(1.14, 1, ease.outCubic(clamp(lt / 0.12, 0, 1)));
      g.translate(cx + sx, cy + sy); g.scale(sc, sc);
      g.globalAlpha = out;
      g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 34 * k; g.shadowOffsetY = 4 * k;
      g.fillStyle = '#ffffff';
      g.fillText(text, -tw / 2, size * 0.36); g.fillText(text, -tw / 2, size * 0.36);
    } else if (ph.block) {
      // the hook block: two centred lines, bold, every word there from the first frame
      let size = 70 * k;
      const setFont = () => { g.font = `700 ${size}px "${FONT}", sans-serif`; };
      setFont();
      const measure = () => ph.block.map((line) => { const sp = g.measureText(' ').width, ws = line.map((it) => g.measureText(it.text).width); return { sp, ws, total: ws.reduce((a, b) => a + b, 0) + sp * (line.length - 1) }; });
      let M = measure();
      const maxW = 870 * k, widest = Math.max(...M.map((m) => m.total)), bx = cx - 35 * k;      // (kept clear of the right edge: the app's icon column sits there)
      if (widest > maxW) { size *= maxW / widest; setFont(); M = measure(); }
      const lh = size * 1.3, y0 = cy - lh * (ph.block.length - 1) / 2 + size * 0.36;
      ph.block.forEach((line, li) => {
        let x = bx - M[li].total / 2;
        line.forEach((it, i) => {
          const e = ease.outCubic(clamp((t - it.w.start) / 0.09, 0, 1));
          g.globalAlpha = lerp(0.85, 1, e) * out;
          strokedWord(g, it.text, x, y0 + li * lh, k);
          x += M[li].ws[i] + M[li].sp;
        });
      });
    } else {
      const copy = ph.kind === 'copy';
      let size = (copy ? 56 : 62) * k;
      const weight = copy ? 700 : 600;
      const setFont = () => { g.font = `${weight} ${size}px "${FONT}", sans-serif`; };
      setFont();
      let space = g.measureText(' ').width * 1.05;
      let widths = ph.items.map((it) => g.measureText(it.text).width);
      let total = widths.reduce((a, b) => a + b, 0) + space * (ph.items.length - 1);
      const maxW = 900 * k;
      if (total > maxW) { size *= maxW / total; setFont(); space = g.measureText(' ').width * 1.05; widths = ph.items.map((it) => g.measureText(it.text).width); total = widths.reduce((a, b) => a + b, 0) + space * (ph.items.length - 1); }
      const base = cy + size * 0.36;
      if (copy) {
        const padX = 26 * k, padY = 17 * k, bh = size * 1.02 + padY * 2;
        const a = clamp((t - ph.start) / 0.06, 0, 1) * out;
        g.globalAlpha = a;
        g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 18 * k; g.shadowOffsetY = 3 * k;
        g.fillStyle = '#ffffff';
        rr(g, cx - total / 2 - padX, cy - bh / 2, total + padX * 2, bh, 5 * k); g.fill();
        g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
      }
      let x = cx - total / 2;
      ph.items.forEach((it, i) => {
        const lt = t - it.w.start;
        if (lt >= 0) {
          const e = ease.outCubic(clamp(lt / 0.09, 0, 1));
          g.globalAlpha = e * out;
          if (copy) { g.fillStyle = '#000000'; g.fillText(it.text, x, base); }
          else strokedWord(g, it.text, x, base + (1 - e) * 7 * k, k);
        }
        x += widths[i] + space;
      });
    }
  }
  g.restore();
  // ── Mom's phone bubble
  const subs = (tl.subs || []).filter((s) => s.style === 'mom' && t >= s.t0 && t < s.t1 + 0.35);
  for (const s of subs) {
    g.save();
    const inn = ease.outCubic(clamp((t - s.t0) / 0.16, 0, 1)), outA = clamp((s.t1 + 0.35 - t) / 0.2, 0, 1);
    const size = 42 * k;
    g.font = `500 ${size}px "${FONT}", sans-serif`;
    try { g.letterSpacing = '0px'; } catch (e) { /* */ }
    const maxW = 760 * k;
    const words = String(s.text).split(/\s+/), lines = [];
    let line = '';
    for (const w of words) { const tr = line ? line + ' ' + w : w; if (g.measureText(tr).width > maxW && line) { lines.push(line); line = w; } else line = tr; }
    if (line) lines.push(line);
    const tw = Math.max(...lines.map((l) => g.measureText(l).width));
    const padX = 34 * k, padY = 24 * k, lh = size * 1.28;
    const bw = tw + padX * 2, bh = lines.length * lh + padY * 2 - (lh - size) * 0.6;
    const bx = 96 * k, by = chh * ((shot && shot.momY) ?? opts.momY ?? 0.665) - bh / 2;
    g.translate(bx, by + bh); g.scale(lerp(0.9, 1, inn), lerp(0.9, 1, inn)); g.translate(-bx, -(by + bh));
    g.globalAlpha = inn * outA;
    // sender label
    g.font = `500 ${30 * k}px "${FONT}", sans-serif`;
    g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 10 * k;
    g.fillStyle = 'rgba(255,255,255,0.86)';
    g.fillText('Mom', bx + 16 * k, by - 16 * k);
    // bubble + tail
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 22 * k; g.shadowOffsetY = 4 * k;
    g.fillStyle = '#e9e9eb';
    rr(g, bx, by, bw, bh, Math.min(36 * k, bh / 2)); g.fill();
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.beginPath(); g.moveTo(bx + 4 * k, by + bh - 26 * k); g.quadraticCurveTo(bx - 2 * k, by + bh + 2 * k, bx - 16 * k, by + bh + 4 * k);
    g.quadraticCurveTo(bx + 10 * k, by + bh + 4 * k, bx + 30 * k, by + bh - 8 * k); g.closePath(); g.fill();
    g.font = `500 ${size}px "${FONT}", sans-serif`;
    g.fillStyle = '#111114';
    lines.forEach((l, i) => g.fillText(l, bx + padX, by + padY + size * 0.82 + i * lh));
    g.restore();
  }
}

// ═════════════════════════════════════════════ cast ═══════════════════════════════════════════════════════════════
/** mirror / un-mirror a whole character in X (the swap tell: knight nose + rag hand change sides). */
export function setMirror(ch, on = true) { const s = Math.abs(ch.body.scale.x); ch.body.scale.x = on ? -s : s; return ch; }
function buildKid(id, mirror) {
  const ch = makeCharacter({ ...MAIN.me, id });
  if (mirror) setMirror(ch, true);      // baked into the engine's creation snapshot → the double is mirrored in every shot
  return ch;
}
export const castSpecs = {
  me: () => buildKid('me', false),
  copy: () => buildKid('copy', true),
  captain: { id: 'captain', skin: '#c99a7a', hair: { style: 'short', color: '#3a3a3a' }, top: { style: 'cardigan', color: '#23262b', accent: '#3a3f46' },
    bottom: { style: 'pants', color: '#1c1e22' }, shoes: '#15171a', accessories: ['cap', 'beard'], capColor: '#1a1c20', scale: 1.12, build: 1.15 },
};
/**
 * The white sailcloth rag on a right hand (hand-local metres; the 0.14 m hand block is centred on the joint, +Y = wrist).
 * A torn strip wound round the fist: four overlapping turns that wander up and down as they go round, each with its own
 * wrinkles (displaced along the wrap, darker in the folds), one of them crossing the knuckles on the diagonal, a knot on
 * the outside and two loose tails. No flat panels, no clean frame round the hand.
 */
function makeRag() {
  const ts = textureSet('wet_fabric');
  const nm = ts.normalMap.clone(); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set(2.2, 1.2); nm.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ color: '#cfccc3', roughness: 0.88, normalMap: nm, normalScale: new THREE.Vector2(0.32, 0.32), vertexColors: true,
    emissive: new THREE.Color('#e6e3da'), emissiveIntensity: RAG_GLOW, side: THREE.DoubleSide });
  const g = new THREE.Group(); g.name = 'rag';
  const SE = (c) => Math.sign(c) * Math.pow(Math.abs(c), 0.42);                    // rounded-square cross-section
  const turn = ({ y0, amp, ph, w, off, seed, a0 = 0, a1 = Math.PI * 2 }) => {
    const NU = 56, NV = 6, pos = [], col = [], uv = [], idx = [];
    for (let i = 0; i <= NU; i++) {
      const u = i / NU, th = a0 + (a1 - a0) * u, cs = Math.cos(th), sn = Math.sin(th);
      const wv = w * (1 + 0.16 * Math.sin(th * 3 + seed) + 0.07 * Math.sin(th * 7 + seed * 2.3));
      const yc = y0 + amp * Math.sin(th + ph) + 0.004 * Math.sin(th * 4 + seed);
      for (let j = 0; j <= NV; j++) {
        const v = j / NV, fold = Math.sin(v * Math.PI * 2.6 + 2.2 * Math.sin(th * 2 + seed) + seed) * 0.6 + 0.4 * Math.sin(v * 9 + th * 5 + seed * 3);
        const edge = 0.0015 * Math.sin(th * 11 + seed + j);                         // frayed, uneven edges
        const r = 0.07 + off + 0.0034 * fold + 0.0015 * Math.sin(th * 9 + v * 4 + seed);
        pos.push(SE(cs) * r, yc + (v - 0.5) * wv + (j === 0 || j === NV ? edge : 0), SE(sn) * r);
        const c = 0.74 + 0.26 * (0.5 + 0.5 * fold) - (j === 0 || j === NV ? 0.06 : 0);
        col.push(c, c, c * 0.985); uv.push(u * 6, v);
      }
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); bg.setIndex(idx); bg.computeVertexNormals();
    g.add(new THREE.Mesh(bg, mat));
  };
  turn({ y0: 0.03, amp: 0.012, ph: 0.4, w: 0.062, off: 0.006, seed: 1.3 });
  turn({ y0: -0.02, amp: -0.014, ph: 1.9, w: 0.058, off: 0.009, seed: 4.1 });
  turn({ y0: 0.004, amp: 0.036, ph: 2.6, w: 0.036, off: 0.0125, seed: 7.7 });       // the diagonal turn across the knuckles
  turn({ y0: 0.066, amp: 0.006, ph: 5.0, w: 0.034, off: 0.0105, seed: 9.2 });       // the last turn, up on the wrist
  const knot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.024, 1), mat); knot.position.set(-0.09, 0.024, 0.028); knot.scale.set(0.8, 1.05, 1.2); knot.rotation.set(0.4, 0.2, 0.5);
  { const kg = knot.geometry, kp = kg.attributes.position, kc = new Float32Array(kp.count * 3);
    for (let i = 0; i < kp.count; i++) { const d = 1 + 0.16 * Math.sin(kp.getX(i) * 190 + kp.getY(i) * 140) * Math.cos(kp.getZ(i) * 170); kp.setXYZ(i, kp.getX(i) * d, kp.getY(i) * d, kp.getZ(i) * d); kc[i * 3] = kc[i * 3 + 1] = kc[i * 3 + 2] = 0.72 + 0.2 * d * 0.5; }
    kg.setAttribute('color', new THREE.BufferAttribute(kc, 3)); kg.computeVertexNormals(); }
  g.add(knot);
  const tail = (len, rx, rz, x, z, seed) => {
    const tg = new THREE.PlaneGeometry(0.046, len, 3, 10); tg.translate(0, -len / 2, 0);
    const p = tg.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const yy = -p.getY(i) / len, xx = p.getX(i) / 0.023;
      const curl = 0.034 * Math.sin(yy * 4.2 + seed) * yy + 0.006 * xx * xx + 0.004 * Math.sin(yy * 13 + xx * 2 + seed);     // hangs, twists, cups
      p.setZ(i, curl); p.setX(i, p.getX(i) * (1 - 0.5 * yy) + 0.014 * Math.sin(yy * 8 + seed)); p.setY(i, p.getY(i) + 0.004 * xx * Math.sin(yy * 6 + seed) - (yy > 0.97 ? 0.004 * Math.sin(xx * 5 + seed) : 0));
      const sh = 0.8 + 0.2 * Math.sin(yy * 13 + xx * 2 + seed); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = sh;
    }
    tg.setAttribute('color', new THREE.BufferAttribute(c, 3)); tg.computeVertexNormals();
    const m = new THREE.Mesh(tg, mat); m.position.set(x, 0.008, z); m.rotation.set(rx, 0.5, rz); g.add(m); return m;
  };
  tail(0.19, 0.25, 0.35, -0.095, 0.03, 1.0); tail(0.12, -0.3, 0.75, -0.1, 0.022, 3.4);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
/** init(ctx) helper: photoreal materials on the cast + the white sailcloth rag on handR of the kid and of the double. */
export function initCast(ctx) {
  const real = {};
  real.me = makeReal(ctx.cast.me, { wet: 0.9, drips: 12 });
  real.copy = makeReal(ctx.cast.copy, { wet: 0.9, drips: 0 });
  if (ctx.cast.captain) real.captain = makeReal(ctx.cast.captain, { wet: 0.4, drips: 0 });
  for (const id of ['me', 'copy']) { const rag = makeRag(); ctx.cast[id].joints.handR.add(rag); ctx.cast[id].rag = rag; real[id].ragMat = rag.children[0].material; }
  for (const id of Object.keys(real)) matteFace(ctx.cast[id], real[id]);
  for (const id of ['me', 'copy']) { lowFade(ctx.cast[id], real[id]); smoothHeadphones(ctx.cast[id], real[id]); sewnEmblem(ctx.cast[id]); }
  ctx.props.real = real;
  return real;
}
/**
 * Film-only haircut for the kid and the double. The stock 'fade' shell (src/characters.js fadeShell) is bare skin from
 * 52 % down on the back and the sides of the head: seen from behind (frame A, b03, b19) the hero was a white crate with
 * a black lid. Here it becomes a LOW taper: hair down to 62 % of the shell, thinning to skin only in the last few
 * centimetres at the nape and under the ears; wet hair (roughness 0.4, out of the kit's wet-gloss path so it matches the
 * crop on top). The brown highlight slab on the crown goes back to the hair colour. The shared character builder is not
 * touched: this patches the film's own copies (makeReal cloned the shell material; the vertex colours are per character).
 */
const hex2rgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixHex = (a, b, u) => { const A = hex2rgb(a), B = hex2rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); };
let _lowFadeTex = null;
function lowFade(ch, real) {
  const S = ch.spec || {}, hc = (S.hair && S.hair.color) || '#2b1d14', skin = S.skin || '#f1c7a1';
  const shell = ch.root.getObjectByName('fadeShell');
  if (shell && shell.material && shell.material.map) {
    if (!_lowFadeTex) {
      _lowFadeTex = canvasTexture(64, 256, (g) => {
        const gr = g.createLinearGradient(0, 0, 0, 256);
        gr.addColorStop(0, hc); gr.addColorStop(0.62, hc); gr.addColorStop(0.8, mixHex(hc, skin, 0.4)); gr.addColorStop(0.92, mixHex(hc, skin, 0.75)); gr.addColorStop(1, mixHex(hc, skin, 1));
        g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
        const [r, gg, bb] = hex2rgb(hc);                                    // stubble in the taper (deterministic)
        for (let i = 0; i < 700; i++) {
          const x = hash(i * 1.3) * 64, y = 150 + hash(i * 2.7 + 5) * 100, a = 0.4 * (1 - (y - 150) / 100);
          g.fillStyle = `rgba(${r},${gg},${bb},${a.toFixed(3)})`; g.fillRect(x, y, 1.5, 1.5);
        }
      });
    }
    const m = shell.material, i = real.decals.findIndex((d) => d.mat === m);
    if (i >= 0) { m.color.copy(real.decals[i].color); real.decals.splice(i, 1); }      // setWet no longer rewrites it
    m.map = _lowFadeTex; m.roughness = 0.4; m.needsUpdate = true;
  }
  // the highlight slab on the crown (addHair 'fade': mixHex(hc, '#7a4e33', 0.55)) read as a brown plank lying on his head
  const from = new THREE.Color(mixHex(hc, '#7a4e33', 0.55)), to = new THREE.Color(hc);
  ch.root.traverse((o) => {
    const c = o.isMesh && o.geometry && o.geometry.attributes.color; if (!c) return;
    let n = 0;
    for (let k = 0; k < c.count; k++) if (Math.abs(c.getX(k) - from.r) < 2e-4 && Math.abs(c.getY(k) - from.g) < 2e-4 && Math.abs(c.getZ(k) - from.b) < 2e-4) { c.setXYZ(k, to.r, to.g, to.b); n++; }
    if (n) c.needsUpdate = true;
  });
}
/**
 * The face decal is INK ON SKIN, not wet cloth: take it out of the kit's wet-gloss path. makeReal leaves it with a pore
 * bump and (soaked) roughness 0.18, so a key light at a grazing angle turned the black eyes and brows into a mottled grey
 * sheen. Here: no bump, roughness 0.92, almost no environment reflection, and setWet no longer touches it.
 */
function matteFace(ch, real) {
  const fm = ch.root.getObjectByName('face'); if (!fm || !fm.material) return;
  const m = fm.material, i = real.decals.findIndex((d) => d.mat === m);
  if (i >= 0) { m.color.copy(real.decals[i].color); real.decals.splice(i, 1); }
  m.roughness = 0.92; m.metalness = 0; m.envMapIntensity = 0.04;
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  { vec2 e = abs(vMapUv - 0.5) * 2.0; diffuseColor.rgb *= mix(1.0, 0.74, smoothstep(0.62, 1.0, max(e.x, e.y))) * vec3(1.0, 0.97, 0.95); }`);
  };
  m.customProgramCacheKey = () => 'cineFace';
  m.needsUpdate = true;
}

/** the stock headphone cups are 14-sided cylinders (polygons in the b06 / b25 macro): rebuild the set with round ones */
function smoothHeadphones(ch, real) {
  const grp = ch.root.getObjectByName('acc:headphones'), em = ch.root.getObjectByName('emblem'); if (!grp || !em) return;
  const front = em.position.z - 0.004, cx = 0.19 * (0.9 + 0.1 * ((ch.spec && ch.spec.build) ?? 1));
  const geos = [], col = new THREE.Color(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4();
  const prep = (geo, color, pos = [0, 0, 0], rot = [0, 0, 0]) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(m4.compose(V3(pos[0], pos[1], pos[2]), q.setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])), V3(1, 1, 1)));
    col.set(color);
    const n = g.attributes.position.count, c = new Float32Array(n * 3), id = new Float32Array(n).fill(6);
    for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('aMat', new THREE.BufferAttribute(id, 1));
    return g;
  };
  const add = (...a) => geos.push(prep(...a));
  const white = '#f4f4f6', pad = '#3a3b42', pts = [[cx, 0.4, 0.17], [cx + 0.03, 0.46, 0.05], [0.17, 0.48, -0.12], [0, 0.48, -0.2], [-0.17, 0.48, -0.12], [-cx - 0.03, 0.46, 0.05], [-cx, 0.4, 0.17]].map((p) => V3(p[0], p[1], p[2]));
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.024, 14, false), white);
  for (const sx of [-1, 1]) {
    const rot = [-1.15, 0, sx * 0.5];
    add(new THREE.CylinderGeometry(0.078, 0.078, 0.055, 56), white, [sx * (cx + 0.01), 0.36, front + 0.035], rot);
    add(new THREE.CylinderGeometry(0.064, 0.064, 0.03, 48), pad, [sx * (cx + 0.005), 0.385, front + 0.012], rot);
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 48), '#d8d8da', [sx * (cx + 0.016), 0.34, front + 0.055], rot);
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos), real.material); mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = 'headphonesSmooth';
  for (const o of grp.children.slice()) if (o.isMesh) grp.remove(o);
  grp.add(mesh);
  // the band BEHIND the neck. The stock path runs inside the hoodie's collar roll, so from behind he wore no headphones at
  // all (frame A, b03, b19). This arc lies on the outside of the roll, tucked under the back of the head: a white bar across
  // the nape. Its own mesh and its own copy of the body material, so a shot can make it catch the sky (real.bandBack:
  // emissiveIntensity; see K.frameAKid) or hide it for a frame (real.bandMesh.visible = false in update(): under the
  // blanket, on the black double). Both are put back by the set every frame.
  const R = (a, y) => V3(Math.sin(a) * 0.243, y, -0.02 - Math.cos(a) * 0.266), arc = [];
  for (const a of [-1.3, -0.85, -0.42, 0, 0.42, 0.85, 1.3]) arc.push(R(a, 0.46 - 0.03 * Math.max(0, Math.cos(a))));
  arc.unshift(pts[5].clone()); arc.push(pts[1].clone());        // both ends start inside the stock band, on top of the shoulders
  const bm = real.material.clone(); bm.onBeforeCompile = real.material.onBeforeCompile; bm.customProgramCacheKey = real.material.customProgramCacheKey;
  bm.emissive = new THREE.Color('#dfe9ff'); bm.emissiveIntensity = 0;
  const back = new THREE.Mesh(prep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), 64, 0.024, 14, false), white), bm);
  back.castShadow = true; back.receiveShadow = true; back.name = 'headphonesBack';
  grp.add(back); real.bandBack = bm; real.bandMesh = back;
}
/**
 * "She sewed this knight on my hoodie": the stock emblem is a 256 px flat white vector. Film version (1024 px): the same
 * knight, re-sharpened, in off-white satin stitch (fine thread rows with a little wander), and a ring of uneven hand
 * stitches round its outline. One texture, shared by the kid and the double (the double's is mirrored with his body).
 */
let _sewnTex = null;
function sewnEmblem(ch) {
  const em = ch.root.getObjectByName('emblem'); if (!em || !em.material || !em.material.map) return;
  if (!_sewnTex) {
    const src = em.material.map.image, S = 1024, r = rng(2606);
    _sewnTex = canvasTexture(S, S, (g) => {
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(src, 0, 0, S, S);
      const im = g.getImageData(0, 0, S, S), d = im.data, A = new Float32Array(S * S);
      for (let i = 0; i < S * S; i++) A[i] = clamp((d[i * 4 + 3] / 255 - 0.5) * 6 + 0.5, 0, 1);      // re-sharpen the upscaled edge
      // blurred coverage → distance-ish field for the stitch ring (two separable box blurs)
      const blur = (src0, rad) => { const t = new Float32Array(S * S), o = new Float32Array(S * S);
        for (let y = 0; y < S; y++) { let acc = 0; for (let x = -rad; x < S; x++) { if (x + rad < S) acc += src0[y * S + x + rad]; if (x - rad - 1 >= 0) acc -= src0[y * S + x - rad - 1]; if (x >= 0) t[y * S + x] = acc / (2 * rad + 1); } }
        for (let x = 0; x < S; x++) { let acc = 0; for (let y = -rad; y < S; y++) { if (y + rad < S) acc += t[(y + rad) * S + x]; if (y - rad - 1 >= 0) acc -= t[(y - rad - 1) * S + x]; if (y >= 0) o[y * S + x] = acc / (2 * rad + 1); } }
        return o; };
      const B = blur(blur(A, 13), 13);
      const row = new Float32Array(S); for (let y = 0; y < S; y++) row[y] = r();
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const i = y * S + x, a = A[i], o = i * 4;
        // satin stitch: thread rows ~5 px apart running slightly uphill, each row a touch lighter or darker
        const ty = y + 0.18 * x + 3 * Math.sin(x * 0.021 + y * 0.013), th = 0.5 + 0.5 * Math.sin(ty * 1.25), rk = row[Math.floor(ty / 5.03) & 1023];
        let v = 0.8 + 0.15 * th + 0.07 * (rk - 0.5), al = a;
        // the hand-stitched edge: dashes in a band just outside the outline, spaced along whichever axis the edge runs
        const b = B[i];
        if (a < 0.5 && b > 0.045 && b < 0.2) {
          const gx = B[Math.min(S * S - 1, i + 1)] - B[Math.max(0, i - 1)], gy = B[Math.min(S * S - 1, i + S)] - B[Math.max(0, i - S)];
          const along = Math.abs(gx) < Math.abs(gy) ? x : y, ph = (along + 9 * Math.sin((x + y) * 0.017)) / 30, dash = ph - Math.floor(ph);
          const inBand = clamp((b - 0.045) / 0.03, 0, 1) * clamp((0.2 - b) / 0.04, 0, 1);
          const on = clamp((0.62 - dash) / 0.06, 0, 1) * clamp(dash / 0.06, 0, 1);
          al = Math.max(al, 0.9 * inBand * on); v = 0.78 + 0.1 * Math.sin(dash * 9);
        }
        d[o] = d[o + 1] = 255 * v; d[o + 2] = 255 * v * 0.985; d[o + 3] = 255 * al;
      }
      g.putImageData(im, 0, 0);
    });
    _sewnTex.anisotropy = 8;
  }
  em.material.map = _sewnTex; em.material.roughness = 0.82; em.material.needsUpdate = true;
}

// ───────────────────────────────────────────── film faces
// Expressions the stock face kit only has as cartoons. Built once per character from its own 'neutral' face (so eye,
// brow and skin colours match), then swapped in AFTER ch.face(): K.filmFace(ch, 'creep').
//   'creep1'  the reflection's smile starting: closed mouth, corners just lifting, eyes dead (no sparkle)
//   'creep'   the too-wide closed smile of beats 18 / 19 / 25: no teeth, no blush, fixed pupils, brows flat
//   'shout'   the HUSS: eyes squeezed to plain lines, heavy brows, a dark open mouth. No anger mark, no blush.
const _filmFaces = new Map();
function buildFilmFace(ch, name) {
  const fm = ch.root.getObjectByName('face');
  ch.face('neutral', 1.5 - (ch.blinkPhase || 0));                       // an open-eyed neutral
  const src = fm.material.map.image;
  const LINE = '#151515', EX = [148, 364], EY = 232, BY = 156, MY = 374;
  return canvasTexture(512, 512, (g) => {
    g.drawImage(src, 0, 0);
    const px = (x, y) => { const d = g.getImageData(x, y, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
    const eyeC = px(EX[0] + 14, EY + 22), browC = px(EX[0], BY);
    g.clearRect(40, 284, 140, 66); g.clearRect(332, 284, 140, 66);       // blush
    g.clearRect(150, 336, 212, 110);                                      // mouth
    g.lineCap = 'round'; g.lineJoin = 'round';
    const ell = (x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); };
    if (name === 'creep' || name === 'creep1') {
      const wide = name === 'creep';
      for (const x of EX) {                                               // flat black eyes: one small fixed catch-light, dead centre
        g.clearRect(x - 50, EY - 52, 100, 104);
        g.fillStyle = eyeC; ell(x, EY, 31, wide ? 43 : 41); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.78)'; ell(x, EY - 4, 4.5, 4.5); g.fill();
      }
      g.strokeStyle = LINE; g.lineWidth = wide ? 13 : 13;
      g.beginPath();
      if (wide) { g.moveTo(138, MY - 30); g.bezierCurveTo(176, MY + 34, 336, MY + 34, 374, MY - 30); }
      else { g.moveTo(204, MY - 4); g.quadraticCurveTo(256, MY + 22, 308, MY - 4); }
      g.stroke();
      if (wide) {                                                         // the corners dig in
        g.lineWidth = 8;
        g.beginPath(); g.moveTo(128, MY - 42); g.quadraticCurveTo(140, MY - 30, 136, MY - 16); g.stroke();
        g.beginPath(); g.moveTo(384, MY - 42); g.quadraticCurveTo(372, MY - 30, 376, MY - 16); g.stroke();
      }
    } else if (name === 'shout') {
      g.clearRect(84, 96, 344, 190);                                      // eyes + brows (the nose arc at y ≈ 290–306 stays)
      EX.forEach((x, k) => {
        const inn = k === 0 ? 1 : -1;                                     // toward the nose
        g.strokeStyle = browC; g.lineWidth = 23;
        g.beginPath(); g.moveTo(x - inn * 42, BY - 4); g.lineTo(x + inn * 36, BY + 34); g.stroke();
        g.strokeStyle = LINE; g.lineWidth = 15;                           // the eye: one hard line, pinched toward the nose
        g.beginPath(); g.moveTo(x - inn * 34, EY - 2); g.quadraticCurveTo(x, EY + 12, x + inn * 32, EY + 16); g.stroke();
        g.lineWidth = 7;
        g.beginPath(); g.moveTo(x - inn * 30, EY + 18); g.quadraticCurveTo(x - inn * 4, EY + 30, x + inn * 20, EY + 30); g.stroke();
      });
      const path = () => { g.beginPath(); g.moveTo(194, MY - 30); g.quadraticCurveTo(256, MY - 44, 318, MY - 30); g.quadraticCurveTo(334, MY + 30, 302, MY + 60);
        g.quadraticCurveTo(256, MY + 72, 210, MY + 60); g.quadraticCurveTo(178, MY + 30, 194, MY - 30); g.closePath(); };
      path(); g.fillStyle = '#1c070b'; g.fill();
      g.save(); path(); g.clip(); g.fillStyle = '#3a0e16'; ell(256, MY + 62, 44, 20); g.fill(); g.restore();
      path(); g.lineWidth = 12; g.strokeStyle = LINE; g.stroke();
    }
  });
}
/** hoodie weave bump × for this frame (reset to 1 by the set every frame) */
export function weave(ctx, id, k) { const r = ctx.props.real && ctx.props.real[id]; if (r) r.uniforms.uDetail.value = k; }
/** swap a film face in for this frame (call AFTER ch.face(...): face() rewrites the map every call) */
export function filmFace(ch, name) {
  const key = (ch.id || ch.spec?.id || '?') + '|' + name;
  let t = _filmFaces.get(key);
  if (!t) {
    const fm = ch.root.getObjectByName('face'), keep = fm.material.map, expr = ch.expression;
    t = buildFilmFace(ch, name); _filmFaces.set(key, t);
    fm.material.map = keep; ch.expression = expr;
  }
  ch.root.getObjectByName('face').material.map = t;
  return ch;
}
/** build every film face at init (texture creation order must not depend on which frame is rendered first) */
export function initFilmFaces(ctx) { for (const id of ['me', 'copy']) for (const n of ['creep1', 'creep', 'shout']) if (ctx.cast[id]) filmFace(ctx.cast[id], n); for (const id of ['me', 'copy']) if (ctx.cast[id]) ctx.cast[id].face('neutral', 0); }

// ───────────────────────────────────────────── film poses
const HIP_Y = 0.92, THIGH = 0.265, SHIN = 0.585, ANKLE_H = 0.07, LEG_D = 0.21;
const _eu = new THREE.Euler();
const setJ = (J, n, x = 0, y = 0, z = 0, order = 'XYZ') => { if (J[n]) J[n].quaternion.setFromEuler(_eu.set(x, y, z, order)); };
/** set one joint's euler after a pose (fine-tuning: K.joint(ch, 'armL', -0.9, 0, 0.1)); x < 0 swings a limb forward */
export function joint(ch, name, x = 0, y = 0, z = 0, order = 'XYZ') { setJ(ch.joints, name, x, y, z, order); return ch; }
const _fp = V3(), _fq = new THREE.Quaternion(), _fs = V3(), _fo = V3(), _fq2 = new THREE.Quaternion();
/**
 * Make a prop FOLLOW a joint without being its child (call every frame after the pose): the prop lives in the scene, so
 * it stays visible — and its lights stay ON — when its holder is hidden, e.g. in the pool's reflection pass, where a
 * torch parented to the real kid's hand would otherwise go dark for the substituted reflection.
 * o: { pos [x,y,z] (joint-local offset), rot [x,y,z] (joint-local euler) }
 */
export function follow(ctx, prop, jointObj, o = {}) {
  const obj = prop.root || prop;
  if (obj.parent !== ctx.scene) ctx.add(obj);
  jointObj.updateWorldMatrix(true, false);
  jointObj.matrixWorld.decompose(_fp, _fq, _fs);
  _fo.fromArray(o.pos || [0, -0.05, 0.085]).applyQuaternion(_fq);
  obj.position.copy(_fp).add(_fo);
  obj.quaternion.copy(_fq).multiply(_fq2.setFromEuler(_eu.set(...(o.rot || [-0.25, 0, 0]))));
  return prop;
}
export const FILM_POSES = ['stand', 'kneel', 'huddle', 'prone', 'supine'];
/**
 * Film poses the stock rig lacks. Call INSTEAD of ch.pose each frame; `p` also takes the stock headYaw / headPitch /
 * lookAt. Limb convention: rotation.x < 0 swings a limb forward (+Z of the character).
 *   'stand'   frozen, arms at the sides (the double). p: { breathe = 0 (0 = statue), armR/armL: [x, y, z] upper-arm euler,
 *             foreR/foreL: x }
 *   'kneel'   on both knees at ground level, sitting back a little. p: { sit 0..1 (0.35), lean (torso, rad, +fwd),
 *             raiseR 0..1 (right hand lifts to shoulder height, palm out), raiseL, handsDown 0..1 (palms to the ground) }
 *   'huddle'  sitting on the ground hugging the knees. p: { curl 0..1 (1), shiver 0..1 }
 *   'prone'   face-down on the sand, head toward +Z of the root. p: { up 0..1 (push up on the elbows) }
 *   'supine'  on the back, face up, arms reaching straight up (palms against the pool surface from below).
 *             p: { reach 0..1 (1 = arms straight up), spread (0.12), tilt (rad: 0 = flat on the back, + raises the head end) }
 * Root origin stays at ground level under the hips ('prone'/'supine': under the hips too; the body lies along Z).
 */
export function filmPose(ch, name, t = 0, p = {}) {
  const J = ch.joints;
  const br = p.breathe ?? (name === 'stand' ? 0 : 1);
  ch.pose('idle', t * br, { headYaw: p.headYaw, headPitch: p.headPitch, lookAt: p.lookAt, intensity: 1 });
  const b = Math.sin(t * 1.9) * 0.012 * br;
  const sh = (p.shiver || 0) * 0.02 * Math.sin(t * 43) * (0.6 + 0.4 * Math.sin(t * 7.1));
  if (name === 'stand') {
    setJ(J, 'hips', 0, 0, 0); J.hips.position.set(0, HIP_Y, 0);
    for (const s of ['L', 'R']) {
      const sg = s === 'L' ? 1 : -1, a = p['arm' + s];
      setJ(J, 'arm' + s, a ? a[0] : 0.02, a ? a[1] : 0, a ? a[2] : sg * 0.1);
      setJ(J, 'foreArm' + s, p['fore' + s] ?? -0.12, 0, 0);
    }
    return ch;
  }
  if (name === 'kneel') {
    const sit = p.sit ?? 0.35, a = -lerp(0.12, 1.15, sit);                 // thigh angle from straight down (− = knee forward)
    const kneeY = LEG_D * 0.5, hy = kneeY + THIGH * Math.cos(a);
    J.hips.position.set(0, hy, -THIGH * Math.sin(-a) * 0.5);
    setJ(J, 'hips', 0, 0, 0);
    const lean = (p.lean ?? 0.12) + b;
    setJ(J, 'torso', lean, 0, 0);
    for (const s of ['L', 'R']) {
      const sg = s === 'L' ? 1 : -1;
      setJ(J, 'leg' + s, a, 0, sg * 0.05);
      setJ(J, 'shin' + s, Math.PI / 2 - a, 0, 0);                             // shin flat on the ground, pointing back
      setJ(J, 'foot' + s, 1.25, 0, 0);
      const raise = p['raise' + s] ?? 0, down = p.handsDown ?? 0;
      const ax = lerp(lerp(-0.25 - lean * 0.6, -0.95, down), -1.45 - lean, raise);
      setJ(J, 'arm' + s, ax, 0, sg * lerp(0.1, 0.16, raise));
      setJ(J, 'foreArm' + s, lerp(lerp(-0.55, -0.35, down), -0.75, raise), 0, 0);
      if (J['hand' + s]) setJ(J, 'hand' + s, lerp(0, -0.5, raise), 0, 0);
    }
    return ch;
  }
  if (name === 'huddle') {
    const curl = p.curl ?? 1;
    const hipTilt = -0.22 * curl, A = -2.62;                                // thigh world angle: up and forward
    const hy = 0.115;
    J.hips.position.set(0, hy, 0);
    setJ(J, 'hips', hipTilt, 0, 0);
    setJ(J, 'torso', 0.62 * curl + b + sh, 0, 0);
    const kneeY = hy + THIGH * -Math.cos(A), phi = Math.acos(clamp((kneeY - ANKLE_H) / SHIN, -1, 1));   // shin angle forward of straight down
    for (const s of ['L', 'R']) {
      const sg = s === 'L' ? 1 : -1;
      setJ(J, 'leg' + s, A - hipTilt, 0, sg * 0.04);
      setJ(J, 'shin' + s, -phi - A, 0, 0);
      setJ(J, 'foot' + s, phi, 0, 0);
      setJ(J, 'arm' + s, -1.08 - 0.25 * curl + sh, 0, -sg * 0.3);
      setJ(J, 'foreArm' + s, -1.0, 0, 0);
    }
    return ch;
  }
  if (name === 'prone') {
    const up = p.up ?? 0;
    J.hips.position.set(0, 0.125, 0);
    setJ(J, 'hips', Math.PI / 2, 0, 0);
    setJ(J, 'torso', -0.42 * up + b * 0.5, 0, 0);
    for (const s of ['L', 'R']) {
      const sg = s === 'L' ? 1 : -1;
      setJ(J, 'leg' + s, 0.02, 0, sg * (0.1 + 0.05 * hash(sg + 3)));
      setJ(J, 'shin' + s, 0.06, 0, 0);
      setJ(J, 'foot' + s, 0.9, 0, 0);
      // flat: arms flung forward past the head; pushed up: upper arms down to the elbows, forearms flat forward
      setJ(J, 'arm' + s, lerp(-2.75 + (s === 'L' ? 0.25 : 0), -1.2, up), 0, sg * lerp(0.5, 0.22, up));
      setJ(J, 'foreArm' + s, lerp(-0.25, -1.45, up), 0, 0);
    }
    return ch;
  }
  if (name === 'supine') {
    const reach = p.reach ?? 1, tilt = p.tilt ?? 0, spread = p.spread ?? 0.12;
    J.hips.position.set(0, 0.125, 0);
    setJ(J, 'hips', -Math.PI / 2 + tilt, 0, 0);
    setJ(J, 'torso', 0, 0, 0);
    for (const s of ['L', 'R']) {
      const sg = s === 'L' ? 1 : -1;
      setJ(J, 'leg' + s, -0.05, 0, sg * 0.08);
      setJ(J, 'shin' + s, 0.12, 0, 0);
      setJ(J, 'arm' + s, lerp(-0.35, -Math.PI / 2 - tilt, reach), 0, sg * spread);
      setJ(J, 'foreArm' + s, lerp(-1.3, -0.04, reach), 0, 0);
      if (J['hand' + s]) setJ(J, 'hand' + s, 0, 0, 0);
    }
    return ch;
  }
  return ch;
}

// ═════════════════════════════════════════════ props ══════════════════════════════════════════════════════════════
/**
 * The kid's phone: dark slab with a cracked glass screen. setMode('map' | 'torch' | 'off' | 'lock') — call it in EVERY
 * shot's setup that shows the phone (it also resets level and spill), then chain .setLevel(v) / .setSpill(v).
 *   map    the map app: flat empty blue, pulsing blue dot, faint dotted outline of the missing island (no branding)
 *   torch  screen dim; the back LED throws a spot (phone.spot, + soft beam cone) toward the phone's back (−Z local); a weak
 *          point light spills onto the holder. Lying on the ground LED-up (rotation.x = −π/2) it lights faces from below.
 * { root, screen, light (screen glow / spill PointLight), spot, beam, setMode, setLevel(v 0..1), update(t) }. Local frame:
 * the screen faces +Z, the long side is Y. Parent it with K.hold(ch, phone, 'R', ctx) or ctx.add(phone.root, …).
 */
export function makePhone() {
  const root = new THREE.Group(); root.name = 'phone';
  const Wp = 0.078, Hp = 0.158, Dp = 0.0095;
  const body = new THREE.Mesh(new THREE.BoxGeometry(Wp, Hp, Dp), new THREE.MeshPhysicalMaterial({ color: '#0b0c0e', roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 }));
  body.castShadow = true; root.add(body);
  const mapTex = canvasTexture(256, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#3f78c9'); grd.addColorStop(1, '#3a6fbd');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // faint depth contours of open ocean
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(w * 0.52, h * 0.5, 60 + i * 44, 90 + i * 60, 0.3, 0, Math.PI * 2); g.stroke(); }
    // dotted outline of the island that is not there
    g.setLineDash([5, 9]); g.strokeStyle = 'rgba(255,255,255,0.42)'; g.lineWidth = 2.5; g.beginPath();
    const pts = 44;
    for (let i = 0; i <= pts; i++) { const a = (i / pts) * Math.PI * 2; const r = 1 + 0.16 * Math.sin(a * 3 + 0.6) + 0.1 * Math.sin(a * 5 + 2.1); const x = w * 0.5 + Math.cos(a) * 44 * r, y = h * 0.47 + Math.sin(a) * 96 * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke(); g.setLineDash([]);
    // generic UI: search pill + bottom sheet (no logo, no text)
    g.fillStyle = 'rgba(255,255,255,0.63)'; rr(g, 18, 26, w - 36, 34, 17); g.fill();       // (dimmed: the white panels must not out-shine the dot and the rag)
    g.fillStyle = 'rgba(0,0,0,0.25)'; rr(g, 34, 39, 90, 8, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.64)'; rr(g, 0, h - 74, w, 90, 18); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)'; rr(g, 22, h - 54, 120, 9, 4); g.fill(); g.fillStyle = 'rgba(0,0,0,0.16)'; rr(g, 22, h - 34, 80, 7, 3); g.fill();
    // cracks
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2;
    const r = rng(77);
    for (let c = 0; c < 7; c++) { let x = w * 0.78, y = h * 0.16; const a0 = 1.2 + c * 0.55; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { const a = a0 + (r() - 0.5) * 0.7; x += Math.cos(a) * (18 + r() * 34); y += Math.sin(a) * (18 + r() * 34); g.lineTo(x, y); } g.stroke(); }
  });
  const screenMat = new THREE.MeshPhysicalMaterial({ color: '#05070a', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, emissive: new THREE.Color('#ffffff'), emissiveMap: mapTex, emissiveIntensity: 0.5 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(Wp * 0.92, Hp * 0.94), screenMat); screen.position.z = Dp / 2 + 0.0006; root.add(screen);
  // pulsing location dot (two discs: halo + core)
  const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.06, 0.3, 1.6), transparent: true, opacity: 0.35, depthWrite: false });      // (pushed toward blue: the one cold accent that survives the grade)
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.008, 24), dotMat); halo.position.set(0, Hp * 0.03, Dp / 2 + 0.0012); root.add(halo);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.0034, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.26, 1.3) })); core.position.set(0, Hp * 0.03, Dp / 2 + 0.0016); root.add(core);
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.0045, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) })); led.position.set(Wp * 0.3, Hp * 0.4, -Dp / 2 - 0.0006); led.rotation.y = Math.PI; root.add(led);
  const light = new THREE.PointLight('#8fb4ff', 0, 4.5, 2); light.position.set(0, 0, 0.06); root.add(light);
  // torch: a spot out of the back of the phone (−Z) + the point light above as a weak spill on the holder
  const spot = new THREE.SpotLight('#e6eeff', 0, 16, 0.55, 0.7, 1.6); spot.position.set(Wp * 0.3, Hp * 0.4, -Dp / 2 - 0.01);
  spot.target.position.set(Wp * 0.3, Hp * 0.4, -3); root.add(spot, spot.target);
  // torch beam: soft additive cone out of the back of the phone (−Z)
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uI: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false,
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vA; void main(){ vA = uv.y; vec4 wp = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: 'precision highp float; varying vec3 vN; varying vec3 vV; varying float vA; uniform float uI; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2); float a = f * smoothstep(0.0, 0.12, 1.0 - vA) * pow(vA, 1.6) * uI; gl_FragColor = vec4(vec3(0.75, 0.86, 1.0) * a, 1.0); }',
  });
  const bg = new THREE.ConeGeometry(0.75, 3.6, 28, 1, true); bg.translate(0, -1.8, 0); bg.rotateX(-Math.PI / 2);   // apex at the LED, opening toward −Z
  const beam = new THREE.Mesh(bg, beamMat); beam.position.copy(led.position); beam.visible = false; beam.renderOrder = 25; root.add(beam);
  const phone = {
    root, body, screen, light, spot, beam, led, mode: 'map', level: 1, spill: 0.5,
    setMode(m) {
      phone.mode = m; phone.level = 1; phone.spill = 0.5;       // a mode change resets level + spill (no state leaks between shots)
      const map = m === 'map';
      halo.visible = core.visible = map;
      screenMat.emissiveIntensity = (map ? 0.5 : m === 'lock' ? 0.2 : m === 'torch' ? 0.03 : 0) * phone.level;
      beam.visible = m === 'torch';
      light.color.set(m === 'torch' ? '#dfeaff' : '#8fb4ff');
      light.position.set(0, m === 'torch' ? 0.03 : 0, m === 'torch' ? -0.1 : 0.07);
      light.distance = m === 'torch' ? 6 : 4.5;
      phone.setLevel(phone.level);
      return phone;
    },
    /** brightness 0..1 of the screen glow / torch (e.g. the beat 18 dip to 0.6, the dying torch in beat 27) */
    setLevel(v) {
      phone.level = v;
      const m = phone.mode;
      light.intensity = (m === 'torch' ? phone.spill : m === 'map' ? 0.45 : m === 'lock' ? 0.2 : 0) * v;
      spot.intensity = m === 'torch' ? 60 * v : 0;
      beamMat.uniforms.uI.value = m === 'torch' ? 0.11 * v : 0;
      led.material.color.setRGB(m === 'torch' ? 6 * v : 0, m === 'torch' ? 6.6 * v : 0, m === 'torch' ? 7.6 * v : 0);
      screenMat.emissiveIntensity = (m === 'map' ? 0.5 : m === 'lock' ? 0.2 : m === 'torch' ? 0.03 : 0) * v;
      return phone;
    },
    /** torch mode: strength of the omni spill around the LED (0.5 in the hand; ~2.5 when the phone lies on the ground lighting a face from below) */
    setSpill(v) { phone.spill = v; return phone.setLevel(phone.level); },
    update(t) { const u = (t * 0.8) % 1; halo.scale.setScalar(1 + 1.6 * u); dotMat.opacity = 0.42 * (1 - u); },
  };
  phone.setMode('map');
  return phone;
}
/** put a prop in a character's hand: side 'R' | 'L' (rig sides; on the mirrored copy 'R' shows on screen as his left). */
export function hold(ch, prop, side = 'R', ctx = null, o = {}) {
  const j = ch.joints['hand' + side], obj = prop.root || prop;
  if (ctx) ctx.add(obj, j); else j.add(obj);
  obj.position.fromArray(o.pos || [0, -0.05, 0.085]);
  obj.rotation.fromArray(o.rot || [-0.25, 0, 0]);
  obj.scale.setScalar(o.scale ?? 1);
  return prop;
}

const _hp = V3(), _ey = V3(), _fw = V3();
/** world position of a character's eyes (centre of the face, on its surface): POV cameras, look-at targets, phone aiming */
export function eyePoint(ch, out = V3()) {
  ch.root.updateWorldMatrix(true, true);
  const h = ch.joints.head; h.getWorldQuaternion(_q);
  return h.getWorldPosition(out).add(_fw.set(0, 0.3, 0.29).applyQuaternion(_q).multiplyScalar(Math.abs(ch.body.scale.y)));
}
/**
 * Hold the phone UP in a hand with its screen turned to a point (default: the holder's own eyes). Call every frame after
 * the pose. The phone is parented to the scene (ctx.add) and placed at the hand. Returns { eye, pos } (world Vector3s):
 * a POV macro of the screen is ctx.cam.set({ pos: eye, look: pos, fov: 30 }) with dof.focus = eye.distanceTo(pos).
 */
export function phoneToward(ctx, ch, phone, side = 'R', target = null, o = {}) {
  eyePoint(ch, _ey);
  ch.joints['hand' + side].getWorldPosition(_hp);
  const obj = phone.root;
  if (obj.parent !== ctx.scene) ctx.add(obj);
  obj.position.copy(_hp); obj.position.y += o.lift ?? 0.085;
  obj.lookAt(target ? ctx.point(target) : _ey);
  if (o.roll) obj.rotateZ(o.roll);
  return { eye: _ey.clone(), pos: obj.position.clone() };
}

let _printTex = null;
/**
 * Sneaker-print decals (beats 7 and 14). points: [[x, z, yaw, side(±1)]…]; o: { heightAt, size 0.3, opacity 0.9 }.
 * A sole, not a stamp: rounded toe, a waist, a separate heel, soft tread bars. Rendered as a wet dark DEPRESSION: the
 * sand inside is darker (alpha), and a normal map pressed from the same shape gives the rim a thin highlight on the side
 * that faces the light (fire / flash). Left and right feet are mirrored. Returns a Mesh (ctx.add it, or keep it in the
 * set). printTrail(from [x,z], to [x,z], { stride 0.62, gauge 0.2 }) → points walking from → to.
 */
function printTextures() {
  if (_printTex) return _printTex;
  const Wd = 128, Hd = 256;
  // the sole outline (a right foot: the big-toe side is the left edge of the canvas; toe at the top)
  const sole = (g) => {
    g.beginPath();                                   // forefoot + waist
    g.moveTo(34, 150); g.bezierCurveTo(22, 110, 18, 60, 36, 30); g.bezierCurveTo(50, 8, 86, 8, 100, 34);
    g.bezierCurveTo(114, 62, 106, 112, 98, 150); g.bezierCurveTo(80, 160, 52, 160, 34, 150); g.closePath(); g.fill();
    g.beginPath();                                   // heel (a gap of bare sand between them: the arch)
    g.moveTo(40, 172); g.bezierCurveTo(56, 164, 80, 164, 94, 172); g.bezierCurveTo(100, 200, 96, 232, 82, 244);
    g.bezierCurveTo(70, 252, 58, 250, 50, 242); g.bezierCurveTo(38, 228, 36, 198, 40, 172); g.closePath(); g.fill();
  };
  const mk = (fn) => { const c = document.createElement('canvas'); c.width = Wd; c.height = Hd; const g = c.getContext('2d'); fn(g); return c; };
  // alpha: soft-edged sole; faint lighter tread bars (ridges of sand left standing between the lugs)
  const alphaC = mk((g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, Wd, Hd);
    g.filter = 'blur(2.2px)'; g.fillStyle = '#fff'; sole(g); g.filter = 'none';
    g.globalCompositeOperation = 'multiply'; g.strokeStyle = 'rgba(120,120,120,1)'; g.lineWidth = 3.2; g.lineCap = 'round'; g.filter = 'blur(1.2px)';
    for (let i = 0; i < 6; i++) { const y = 44 + i * 19; g.beginPath(); g.moveTo(30, y + 5); g.quadraticCurveTo(66, y - 6, 104, y + 5); g.stroke(); }
    for (let i = 0; i < 3; i++) { const y = 188 + i * 18; g.beginPath(); g.moveTo(44, y + 3); g.quadraticCurveTo(68, y - 4, 92, y + 3); g.stroke(); }
    g.filter = 'none'; g.globalCompositeOperation = 'source-over';
  });
  // height (white = sand level, black = pressed in) → normal map: a bevelled rim
  const hC = mk((g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, Wd, Hd); g.filter = 'blur(3.5px)'; g.fillStyle = '#000'; sole(g); g.filter = 'none'; });
  const hd = hC.getContext('2d').getImageData(0, 0, Wd, Hd).data;
  const nC = mk((g) => {
    const im = g.createImageData(Wd, Hd), d = im.data, hAt = (x, y) => hd[(clamp(y, 0, Hd - 1) * Wd + clamp(x, 0, Wd - 1)) * 4] / 255;
    for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) {
      const dx = (hAt(x + 1, y) - hAt(x - 1, y)) * 3.2, dy = (hAt(x, y + 1) - hAt(x, y - 1)) * 3.2, l = Math.hypot(dx, dy, 1), o = (y * Wd + x) * 4;
      d[o] = (-dx / l * 0.5 + 0.5) * 255; d[o + 1] = (dy / l * 0.5 + 0.5) * 255; d[o + 2] = (1 / l * 0.5 + 0.5) * 255; d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  });
  const alpha = new THREE.CanvasTexture(alphaC); alpha.anisotropy = 4;
  const normal = new THREE.CanvasTexture(nC); normal.anisotropy = 4;
  return (_printTex = { alpha, normal });
}
export function makeFootprints(points, o = {}) {
  const T = printTextures();
  const size = o.size ?? 0.3, hA = o.heightAt || (() => 0);
  const pos = [], uv = [], idx = [];
  points.forEach(([x, z, yaw = 0, side = 1], i) => {
    const c = Math.cos(yaw), s = Math.sin(yaw), hw = size * 0.25, hl = size * 0.5;
    const cs = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]];
    for (const [a, b] of cs) { const px = x + a * c + b * s, pz = z - a * s + b * c; pos.push(px, hA(px, pz) + 0.012, pz); }
    if (side < 0) uv.push(1, 0, 0, 0, 0, 1, 1, 1); else uv.push(0, 0, 1, 0, 1, 1, 0, 1);      // left foot = mirrored sole
    const k = i * 4; idx.push(k, k + 2, k + 1, k, k + 3, k + 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: '#060707', roughness: 0.5, clearcoat: 0.22, clearcoatRoughness: 0.42, alphaMap: T.alpha, transparent: true,
    normalMap: T.normal, normalScale: new THREE.Vector2(1.6, 1.6), clearcoatNormalMap: T.normal, clearcoatNormalScale: new THREE.Vector2(1.6, 1.6),
    opacity: o.opacity ?? 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, envMapIntensity: 0.5 }));
  m.renderOrder = 3; m.name = 'footprints'; m.receiveShadow = true;
  return m;
}
export function printTrail(from, to, { stride = 0.62, gauge = 0.2, start = 1 } = {}) {
  const dx = to[0] - from[0], dz = to[1] - from[1], L = Math.hypot(dx, dz), n = Math.max(1, Math.floor(L / stride));
  const yaw = Math.atan2(dx, dz), px = Math.cos(yaw), pz = -Math.sin(yaw);
  const out = [];
  for (let i = 0; i <= n; i++) { const u = (i * stride) / L, sd = (i + start) % 2 ? 1 : -1; out.push([from[0] + dx * u + px * sd * gauge / 2, from[1] + dz * u + pz * sd * gauge / 2, yaw, sd]); }
  return out;
}

// ═════════════════════════════════════════════ mirror pool ════════════════════════════════════════════════════════
const POOL_V = /* glsl */`
uniform mat4 uTexMat; varying vec4 vUvP; varying vec3 vWP;
void main() { vUvP = uTexMat * vec4(position, 1.0); vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const POOL_F = /* glsl */`
precision highp float;
uniform sampler2D tRefl; uniform vec3 uColor; uniform float uBody, uReflect, uMinF, uRipple, uTime, uFlash, uHasRefl; uniform vec4 uDrip[3];
varying vec4 vUvP; varying vec3 vWP;
void main() {
  vec3 V = normalize(cameraPosition - vWP);
  vec2 g = vec2(0.0); float hl = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 d = vWP.xz - uDrip[i].xy; float r = length(d) + 1e-4;
    float age = fract(uTime / uDrip[i].z + uDrip[i].w) * uDrip[i].z;
    float x = r - age * 0.5;
    float w = exp(-x * x * 55.0) * sin(x * 36.0) * exp(-age * 1.0) * smoothstep(0.0, 0.12, age);
    g += d / r * w; hl += abs(w);
  }
  g *= uRipple; hl *= uRipple;
  vec3 N = normalize(vec3(-g.x * 0.3, 1.0, -g.y * 0.3));
  float c = max(dot(N, V), 0.0);
  float F = clamp(max(mix(0.03, 1.0, pow(1.0 - c, 3.2)), uMinF) * uReflect, 0.0, 1.0);
  vec4 uvp = vUvP; uvp.xy += g * 0.05 * uvp.w;
  vec3 refl = uHasRefl > 0.5 ? texture2DProj(tRefl, uvp).rgb : vec3(0.0);
  vec3 col = refl * F + uColor * (1.0 - F) * uBody + vec3(0.55, 0.62, 0.7) * hl * 0.02 + vec3(0.8, 0.88, 1.0) * uFlash * 0.25 * F;
  float a = F + (1.0 - F) * uBody;
  gl_FragColor = vec4(col, a);
}`;
/**
 * A perfectly still, mirror-black pool: true planar reflection (the scene is rendered from the mirrored camera into a
 * half-float target in a PRE_RENDER hook, once the shot camera is final) with ACTOR SUBSTITUTION, plus a see-through mode.
 *   o: { rx 3, rz 2.3 (ellipse radii, m), y (water level, world), center [x, z], color '#020405', res 0.6 (× frame),
 *        drips [[x, z, period, phase]…] (≤ 3 ripple sources near the edge; the centre stays glass), murk 6 (dark layers) }
 * returns { root, mesh, uniforms, murk, … }
 *   pool.substitute(hide, show)   call EVERY frame of a mirror shot: `hide` objects are invisible in the reflection only,
 *                                 `show` objects are visible in the reflection ONLY (hidden from the lens). E.g. the real
 *                                 kid kneels at the edge; the copy stands in the same place, posed 0.5 s late / smiling:
 *                                 pool.substitute([me.root], [copy.root]) → "my reflection is half a second late".
 *   pool.setMode('mirror' | 'glass')   mirror: opaque black water, full Fresnel reflection (grazing = mirror).
 *                                 glass: reflection pass off, water see-through from above: actors placed BELOW the
 *                                 plane show through the tint and sink into black through the murk layers (beat 26/27).
 *   pool.uniforms.uRipple.value   0 = dead still, 1 = drip rings at o.drips; uReflect, uBody, uMinF for fine control.
 * DOF note: the reflection has the depth of the water surface, not of the mirrored subject — keep aperture ≤ 0.5 on
 * mirror shots, or focus on the water where the reflected face sits.
 * Light note: a light parented under a hidden object is OFF in that pass. A torch in the real kid's hand would not light
 * the substituted reflection: keep the phone in the scene with K.follow(ctx, phone, hand) (or lay it on the ground).
 */
export function makeMirrorPool(ctx, o = {}) {
  const rx = o.rx ?? 3, rz = o.rz ?? 2.3, y = o.y ?? 0, cx = o.center ? o.center[0] : 0, cz = o.center ? o.center[1] : 0;
  const renderer = ctx.renderer;
  const rw = Math.max(64, Math.round(ctx.size.w * (o.res ?? 0.6))), rh = Math.max(64, Math.round(ctx.size.h * (o.res ?? 0.6)));
  const rt = new THREE.WebGLRenderTarget(rw, rh, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
  rt.texture.name = 'poolReflection';
  const shape = new THREE.Shape();
  const N = 72, rr0 = rng(o.seed ?? 5), wk = o.wobble ?? 0, wob = Array.from({ length: 5 }, () => [rr0() * 6.28, (0.03 + rr0() * 0.05) * wk]);
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2; let k = 1; wob.forEach(([ph, am], j) => { k += am * Math.sin(a * (j + 2) + ph); });
    const px = Math.cos(a) * rx * k, py = Math.sin(a) * rz * k;
    if (i) shape.lineTo(px, py); else shape.moveTo(px, py);
  }
  const geo = new THREE.ShapeGeometry(shape, 24);
  const drips = (o.drips || [[-1.6, -1.5, 3.1, 0.1], [1.9, -1.2, 4.3, 0.55], [0.4, -1.9, 5.2, 0.8]]).slice(0, 3);
  while (drips.length < 3) drips.push([999, 999, 4, 0]);
  const uniforms = {
    tRefl: { value: rt.texture }, uTexMat: { value: new THREE.Matrix4() }, uColor: { value: new THREE.Color(o.color || '#020405') },
    uBody: { value: 1 }, uReflect: { value: 1 }, uMinF: { value: 0.0 }, uRipple: { value: 1 }, uTime: RU.uTime, uFlash: RU.uFlash, uHasRefl: { value: 1 },
    uDrip: { value: drips.map((d) => new THREE.Vector4(cx + d[0], cz + d[1], d[2], d[3])) },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: POOL_V, fragmentShader: POOL_F, uniforms, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat); mesh.rotation.x = -Math.PI / 2; mesh.position.set(cx, y, cz); mesh.name = 'mirrorPool'; mesh.renderOrder = 8;
  const root = new THREE.Group(); root.name = 'pool'; root.add(mesh);
  // murk: stacked dark layers under the surface → whatever sinks fades to black; also hides the basin floor
  const murk = new THREE.Group(); murk.name = 'murk';
  const nM = o.murk ?? 6;
  const murkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(o.color || '#020405'), transparent: true, opacity: 0.3, depthWrite: false, fog: false });
  for (let i = 0; i < nM; i++) { const m = new THREE.Mesh(geo, murkMat); m.rotation.x = -Math.PI / 2; m.position.set(cx, y - 0.2 - i * 0.19, cz); m.scale.setScalar(1.02); m.renderOrder = 4; murk.add(m); }
  root.add(murk);

  const cam2 = new THREE.PerspectiveCamera();
  const pl = new THREE.Plane(), nrm = V3(), rp = V3(), cp = V3(), rot = new THREE.Matrix4(), view = V3(), lk = V3(), tgt = V3(), clip = new THREE.Vector4(), q = new THREE.Vector4();
  let hideL = [], showL = [], hidden = [];
  const pool = {
    root, mesh, murk, uniforms, rt, mode: 'mirror', waterY: y, center: V3(cx, y, cz), rx, rz, enabled: true,
    substitute(hide = [], show = []) { hideL = hide.map((x) => x.root || x); showL = show.map((x) => x.root || x); for (const s of showL) s.visible = true; return pool; },
    setMode(m) {
      pool.mode = m;
      uniforms.uBody.value = m === 'glass' ? 0.5 : 1; uniforms.uHasRefl.value = m === 'glass' ? 0 : 1; uniforms.uReflect.value = m === 'glass' ? 0.6 : 1;
      murkMat.opacity = m === 'glass' ? 0.36 : 0.5;
      return pool;
    },
    /** start-of-frame reset (the set's update calls it): forget last frame's substitution, un-hide what the hook hid */
    begin() { for (const s of hidden) s.visible = true; hidden = []; hideL = []; showL = []; },
  };
  PRE_RENDER.add(({ scene, camera }) => {
    if (!inScene(mesh, scene)) return;
    const show = showL, hide = hideL;
    const done = () => { for (const s of show) { s.visible = false; hidden.push(s); } };
    if (!pool.enabled || pool.mode !== 'mirror') return done();
    mesh.updateMatrixWorld();
    rp.setFromMatrixPosition(mesh.matrixWorld); cp.setFromMatrixPosition(camera.matrixWorld);
    rot.extractRotation(mesh.matrixWorld); nrm.set(0, 0, 1).applyMatrix4(rot);
    view.subVectors(rp, cp);
    if (view.dot(nrm) > 0) return done();                       // camera under the water
    view.reflect(nrm).negate().add(rp);
    rot.extractRotation(camera.matrixWorld);
    lk.set(0, 0, -1).applyMatrix4(rot).add(cp);
    tgt.subVectors(rp, lk).reflect(nrm).negate().add(rp);
    cam2.position.copy(view); cam2.up.set(0, 1, 0).applyMatrix4(rot).reflect(nrm); cam2.lookAt(tgt);
    cam2.near = camera.near; cam2.far = camera.far; cam2.updateMatrixWorld();
    cam2.projectionMatrix.copy(camera.projectionMatrix); cam2.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    uniforms.uTexMat.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(cam2.projectionMatrix).multiply(cam2.matrixWorldInverse).multiply(mesh.matrixWorld);
    // oblique near plane = the water surface (nothing below it leaks into the reflection)
    pl.setFromNormalAndCoplanarPoint(nrm, rp).applyMatrix4(cam2.matrixWorldInverse);
    clip.set(pl.normal.x, pl.normal.y, pl.normal.z, pl.constant);
    const pm = cam2.projectionMatrix.elements;
    q.x = (Math.sign(clip.x) + pm[8]) / pm[0]; q.y = (Math.sign(clip.y) + pm[9]) / pm[5]; q.z = -1; q.w = (1 + pm[10]) / pm[14];
    clip.multiplyScalar(2 / clip.dot(q));
    pm[2] = clip.x; pm[6] = clip.y; pm[10] = clip.z + 1 - 0.003; pm[14] = clip.w;
    const saved = hide.map((h) => h.visible);
    hide.forEach((h) => { h.visible = false; });
    show.forEach((s) => { s.visible = true; });
    mesh.visible = false; murk.visible = false;
    const prevRT = renderer.getRenderTarget(), prevAuto = renderer.autoClear, saveMask = camera.layers.mask;
    cam2.layers.mask = saveMask;
    renderer.autoClear = true;
    renderer.setRenderTarget(rt); renderer.clear();
    renderer.render(scene, cam2);
    renderer.setRenderTarget(prevRT); renderer.autoClear = prevAuto;
    mesh.visible = true; murk.visible = true;
    hide.forEach((h, i) => { h.visible = saved[i]; });
    done();
  });
  return pool;
}

export { RU, clamp, lerp, smooth, ease, hash, noise1, rng };
