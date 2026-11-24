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
 *                                    { at, power = 1, hold = 0.4 (12 f), decay = 0.27 (8 f), attack = 0, seed, bolt } ].
 *                                    Runs the whole chain: rain/foam/fog-card glint (RU.uFlash), HDR sky, PMREM level,
 *                                    the set's shadow-casting flash light, the bolt mesh, and ctx.store.flash for shotPost.
 *                                    opts: { dir:[x,y,z] toward the strike, light (×), sky (×), env (+), post (× → shotPost),
 *                                    cap (max post flash, default 1), bolt: index into set.bolts | null }
 *   flashEnv(dt, o)                  the envelope alone (peak on frame 0, flickering 12-frame hold, 8-frame decay).
 *   flicker(t, seed, rate)           soft far-lightning flicker 0..1 (cloud flicker, never a full flash).
 * ─── Camera / overlays / captions ───────────────────────────────────────────────────────────────────────────────────
 *   frameA(set)                      the locked frame A of beats 1, 2, 8, 10 (cam spec { pos, look, fov }).
 *   emblemFrame(ch, o)               the beat 6 / beat 25 macro: computed from the character's emblem → identical framing.
 *   poolSplit(set) / poolTop(set)    split-level and top-down pool set-ups (cave set).
 *   dist(ctx, p)                     camera→point distance (for dof.focus), after cam.set.
 *   stamp(ctx, text, o)              '3:12 AM' found-footage clock: thin white Inter, top-left ('tl') or bottom-left ('bl').
 *   drawCaptions(g, tl, t, state)    the film's caption renderer (REAL / COPY / MOM / HUSS).
 * ─── Cast / props ───────────────────────────────────────────────────────────────────────────────────────────────────
 *   castSpecs                        { me, copy (whole body mirrored: scale.x = −1), captain }
 *   initCast(ctx)                    makeReal on all three + the white rag on handR of me and copy → ctx.props.real.{id}
 *   setMirror(ch, on)                mirror / un-mirror a character in X (emblem nose + rag hand swap sides).
 *   filmPose(ch, name, t, p)         'stand' | 'kneel' | 'huddle' | 'prone' | 'supine' film poses (see FILM_POSES);
 *   joint(ch, name, x, y, z)         tweak one joint after a pose; follow(ctx, prop, joint, o) = held but not parented.
 *   makePhone()                      cracked phone: map screen / torch, light, beam. hold(ch, phone, 'L'|'R', ctx);
 *   phoneToward(ctx, ch, phone, side, target)   phone raised in the hand, screen to the eyes (POV macro); eyePoint(ch).
 *   makeFootprints(points, o)        square sneaker-print decals; printTrail(from, to, o) → points.
 *   makeMirrorPool(ctx, o)           planar-reflection still pool with actor substitution + see-through mode.
 */
import * as THREE from 'three';
import { MAIN } from '../cast.js';
import { makeCharacter } from '../characters.js';
import { rng, clamp, lerp, smooth, ease, hash, noise1, canvasTexture } from '../lib/util.js';
import { createPost, makeRenderFrame } from '../real/post.js';
import { RU, setFrame, PRE_RENDER, inScene } from '../real/materials.js';
import { makeSky, bakeEnvironment } from '../real/env.js';
import { loadAssets, getAsset, loadHDR, textureSet } from '../real/assets.js';
import { makeReal } from '../real/realchar.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
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
    for (const p of parts) p.update(t, ctx.camera);
    if (set.onUpdate) set.onUpdate(t);
  };
  return set;
}

// ═════════════════════════════════════════════ lightning ══════════════════════════════════════════════════════════
/**
 * Flash envelope at dt seconds after the strike: peak on frame 0, a flickering hold (return strokes: never a flat white
 * plateau), then a decay. Defaults = the script's "12 frames + 8 frames". Pure function.
 */
export function flashEnv(dt, o = {}) {
  const hold = o.hold ?? 0.4, decay = o.decay ?? 0.27, power = o.power ?? 1, attack = o.attack ?? 0, seed = o.seed ?? 1;
  if (dt < -attack || dt > hold + decay) return 0;
  if (dt < 0) return power * Math.pow(1 + dt / attack, 2);
  const r = rng(seed * 17 + 3);
  const n = 3 + Math.floor(r() * 2);
  let f = 0, tk = 0;
  for (let k = 0; k < n; k++) {
    const amp = k === 0 ? 1 : 0.6 + 0.4 * r(), tau = 0.045 + 0.05 * r(), d = dt - tk;
    if (d >= 0) f = Math.max(f, amp * Math.exp(-d / tau));
    tk += (hold / n) * (0.75 + 0.5 * r());
  }
  const env = dt <= hold ? 1 : Math.pow(1 - (dt - hold) / decay, 1.7);
  return power * Math.max(f, o.floor ?? 0.4) * env;
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
 * FRAME A (beats 1, 2, 8, 10): locked over-the-shoulder wide down the foam line. The kid stands on anchors.kidA facing
 * −X (yaw −π/2); head and shoulders fill the lower-right third; the foam band runs up the middle; the double stands on
 * anchors `double18/12/9/7/5`; the wreck ribs cut the left edge. DOF off. Use ctx.cam.set(K.frameA(ctx.set)).
 */
export function frameA(set) {
  const k = set.anchors.kidA;
  // 4 m behind him and 0.75 m inland, just above head height, pitched 1.5° down: head + shoulders fill the lower right,
  // the foam line runs up the middle and the double stands on it just above the caption line
  return { pos: [k.x + 4.0, k.y + 2.3, k.z + 0.75], look: [k.x - 18, k.y + 1.72, k.z - 0.2], fov: 48 };
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
    const flush = () => { if (cur.length) out.push({ kind, items: cur, start: cur[0].w.start, end: cur[cur.length - 1].w.end }); cur = []; };
    ws.forEach((w, i) => {
      const raw = exact ? toks[i] : String(w.text);
      const brk = exact && PUNCT_BREAK.test(raw);
      cur.push({ w, text: raw.replace(/[.,;:]+$/, (m) => (m.startsWith('...') ? '...' : '')) });
      const next = ws[i + 1];
      if (!next) return flush();
      const gap = next.start - w.end, left = ws.length - 1 - i;
      const chars = cur.reduce((n, c) => n + c.text.length + 1, 0);
      const nextEnds = left === 1 || (exact && PUNCT_BREAK.test(toks[i + 1]));      // don't strand a single word
      if (brk || gap > 0.26) return flush();
      if (cur.length >= 4 || (cur.length >= 3 && chars >= 15 && !nextEnds) || (cur.length >= 2 && chars >= 20)) return flush();
    });
    flush();
  }
  out.sort((a, b) => a.start - b.start);
  out.forEach((p, i) => { const nx = out[i + 1]; p.until = Math.min(nx ? nx.start : Infinity, p.end + (p.kind === 'huss' ? 0.6 : 0.5)); });
  return out;
}
function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/**
 * The film's caption renderer (export it from shots.js as drawCaptions).
 *   REAL  speaker 'narr': white Inter 600, soft dark shadow, 2–4-word phrase that builds word by word, centred, y 0.62.
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
  const cx = cw / 2, cy = chh * (opts.y ?? 0.62);
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
          else {
            const dy = (1 - e) * 7 * k;
            g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16 * k; g.shadowOffsetY = 2 * k;
            g.fillStyle = '#ffffff';
            g.fillText(it.text, x, base + dy);
            g.shadowBlur = 5 * k; g.shadowOffsetY = 1 * k;
            g.fillText(it.text, x, base + dy);
          }
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
    const bx = 96 * k, by = chh * (opts.momY ?? 0.665) - bh / 2;
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
function makeRag() {
  const ts = textureSet('wet_fabric');
  const nm = ts.normalMap.clone(); nm.repeat.set(0.5, 0.5); nm.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ color: '#e6e3da', roughness: 0.8, normalMap: nm, normalScale: new THREE.Vector2(0.5, 0.5),
    emissive: new THREE.Color('#e6e3da'), emissiveIntensity: 0.035, side: THREE.DoubleSide });
  const g = new THREE.Group(); g.name = 'rag';
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.168, 0.085, 0.172, 2, 1, 2), mat); band.position.set(0, 0.018, 0); band.rotation.z = 0.12; g.add(band);
  const band2 = new THREE.Mesh(new THREE.BoxGeometry(0.172, 0.05, 0.165, 2, 1, 2), mat); band2.position.set(0, -0.02, 0.002); band2.rotation.z = -0.2; g.add(band2);
  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.04), mat); knot.position.set(-0.088, 0.02, 0.03); knot.rotation.set(0.4, 0.2, 0.5); g.add(knot);
  const tail = (len, rx, rz, x, z) => {
    const tg = new THREE.PlaneGeometry(0.05, len, 1, 5); tg.translate(0, -len / 2, 0);
    const p = tg.attributes.position;
    for (let i = 0; i < p.count; i++) { const yy = -p.getY(i) / len; p.setZ(i, 0.03 * Math.sin(yy * 4.2) * yy); p.setX(i, p.getX(i) * (1 - 0.45 * yy) + 0.012 * Math.sin(yy * 9)); }
    tg.computeVertexNormals();
    const m = new THREE.Mesh(tg, mat); m.position.set(x, 0.0, z); m.rotation.set(rx, 0.5, rz); g.add(m); return m;
  };
  tail(0.2, 0.25, 0.35, -0.095, 0.03); tail(0.13, -0.3, 0.75, -0.1, 0.025);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
/** init(ctx) helper: photoreal materials on the cast + the white sailcloth rag on handR of the kid and of the double. */
export function initCast(ctx) {
  const real = {};
  real.me = makeReal(ctx.cast.me, { wet: 0.9, drips: 12 });
  real.copy = makeReal(ctx.cast.copy, { wet: 0.9, drips: 0 });
  if (ctx.cast.captain) real.captain = makeReal(ctx.cast.captain, { wet: 0.4, drips: 0 });
  for (const id of ['me', 'copy']) { const rag = makeRag(); ctx.cast[id].joints.handR.add(rag); ctx.cast[id].rag = rag; }
  ctx.props.real = real;
  return real;
}

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
    g.fillStyle = 'rgba(255,255,255,0.9)'; rr(g, 18, 26, w - 36, 34, 17); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.25)'; rr(g, 34, 39, 90, 8, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.92)'; rr(g, 0, h - 74, w, 90, 18); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)'; rr(g, 22, h - 54, 120, 9, 4); g.fill(); g.fillStyle = 'rgba(0,0,0,0.16)'; rr(g, 22, h - 34, 80, 7, 3); g.fill();
    // cracks
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2;
    const r = rng(77);
    for (let c = 0; c < 7; c++) { let x = w * 0.78, y = h * 0.16; const a0 = 1.2 + c * 0.55; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { const a = a0 + (r() - 0.5) * 0.7; x += Math.cos(a) * (18 + r() * 34); y += Math.sin(a) * (18 + r() * 34); g.lineTo(x, y); } g.stroke(); }
  });
  const screenMat = new THREE.MeshPhysicalMaterial({ color: '#05070a', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, emissive: new THREE.Color('#ffffff'), emissiveMap: mapTex, emissiveIntensity: 0.5 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(Wp * 0.92, Hp * 0.94), screenMat); screen.position.z = Dp / 2 + 0.0006; root.add(screen);
  // pulsing location dot (two discs: halo + core)
  const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.12, 0.35, 1.5), transparent: true, opacity: 0.35, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.008, 24), dotMat); halo.position.set(0, Hp * 0.03, Dp / 2 + 0.0012); root.add(halo);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.0034, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.3, 1.1) })); core.position.set(0, Hp * 0.03, Dp / 2 + 0.0016); root.add(core);
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
 * Square sneaker-print decals (beats 7 and 14). points: [[x, z, yaw, side(±1)]…]; o: { heightAt, size 0.3, opacity 0.9 }.
 * Dark, water-filled, glossy: they read as wet stamps in firelight and in a flash. Returns a Mesh (ctx.add it, or keep it
 * in the set). printTrail(from [x,z], to [x,z], { stride 0.62, gauge 0.2 }) → points walking from → to.
 */
export function makeFootprints(points, o = {}) {
  if (!_printTex) {
    _printTex = canvasTexture(128, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#fff'; rr(g, 22, 12, w - 44, h - 24, 16); g.fill();
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 7; i++) g.fillRect(22, 40 + i * 28, w - 44, 7);
      g.fillRect(22, 150, w - 44, 16);
      g.globalCompositeOperation = 'source-over';
    });
  }
  const size = o.size ?? 0.3, hA = o.heightAt || (() => 0);
  const pos = [], uv = [], idx = [];
  points.forEach(([x, z, yaw = 0], i) => {
    const c = Math.cos(yaw), s = Math.sin(yaw), hw = size * 0.26, hl = size * 0.5;
    const cs = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]];
    for (const [a, b] of cs) { const px = x + a * c + b * s, pz = z - a * s + b * c; pos.push(px, hA(px, pz) + 0.012, pz); }
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    const k = i * 4; idx.push(k, k + 2, k + 1, k, k + 3, k + 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: '#020303', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, alphaMap: _printTex, transparent: true,
    opacity: o.opacity ?? 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, envMapIntensity: 1.6 }));
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
