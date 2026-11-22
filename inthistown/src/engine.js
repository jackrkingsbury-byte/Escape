/*
 * src/engine.js — MODULE D (SPEC.md §8): timeline + shot player + caption renderer.
 *
 * ─── Exports ──────────────────────────────────────────────────────────────────────────────────────
 *   createEngine(opts) → Engine          the player (no DOM UI). opts:
 *        canvas        2D compositing canvas (1080×1920). Created if omitted.
 *        timelineUrl   '/audio/timeline.json'      (or `timeline`: an already-parsed object)
 *        shotsModule   '/src/shots.js'             (or `shots`: an already-imported module object)
 *        scale         0.6667  → 3D drawing buffer = round(1080·scale)×round(1920·scale)
 *        antialias     true    (MSAA on the 3D buffer)
 *        debug         false   (draws t / frame / shot name in the corner)
 *        onError(msg)  called for every error (shot setup/update throws, missing anchors, …)
 *   Engine = { ready: Promise, api, ctx, renderAt(t), frameDataURL(type, q, width?), shotAt(t),
 *              duration, fps, timeline, shots, errors, stats() }
 *   engine.api is what index.html exposes as window.__engine (SPEC: duration, fps, ready, renderAt,
 *   frameDataURL, shotAt) plus extras: errors, stats(), timing, audio, time(anchor).
 *   boot({ canvas, errorEl })            what index.html calls (query params, __engine, __ready, ?ui=1 player)
 *   loadTimeline(url) / normalizeTimeline(json) / timeOf(timeline, anchor) / hussTimesOf(timeline, beatId)
 *   drawCaptions(g2d, timeline, t, state) / loadCaptionFonts()   (caption renderer, reusable)
 *   QUOTE_COLORS, CAPTION_Y
 *
 * ─── Film contract additions (all optional; see SPEC §8 for the required part) ─────────────────────
 *   shots module may also export:
 *     init(ctx)              called once after cast + sets are built (create props here, deterministically)
 *     makeCharacter / makeCreature   factories used for `cast` specs (else /src/characters.js is imported)
 *     captionOptions         { uppercase:false, y:0.57, keepPunctuation:false, speakerColors:{}, speakerNames:{} }
 *     lazySets               true → build sets on first use instead of all at init (default: all at init,
 *                            in declaration order, so build order never depends on where rendering starts)
 *   cast values may be: a character spec (→ makeCharacter / makeCreature when spec.creature is set),
 *     a function (ctx) => Character, or a ready Character object ({ root, ... }).
 *   sets values: (ctx) => Set  (may also return a bare Object3D; it is wrapped as { root }).
 *     Set extras honoured per frame: set.background, set.fog, set.exposure (tone-mapping exposure).
 *   shot fields besides name/start/set/setup/update:
 *     cast: ['me', …]        → ctx.use(...) before setup
 *     lighting: 'dusk'       → set.setLighting('dusk') before setup
 *     options: { k: v }      → set.set(k, v) for each, before setup
 *     captions: false        → no captions during this shot
 *
 * ─── Shot switching (random-access safe) ──────────────────────────────────────────────────────────
 *   When the active shot changes — or time jumps backwards — the engine:
 *     1. removes every object added with ctx.add (wherever it was parented),
 *     2. detaches every cast member and restores it to its creation snapshot (local transforms + visibility of
 *        every node, accessories toggled via setAccessory and party-hat colour restored), then pose('idle',0),
 *        face('neutral',0),
 *     3. removes stray top-level scene children (anything added straight to the scene; a warning is logged),
 *     4. shows the shot's set (detaching the previous set), restores every set option that a previous shot changed
 *        (from the snapshot of set.options taken at build time), applies shot.lighting / shot.options,
 *     5. resets the camera and camera/caption/fx state, copies set.background / set.fog onto the scene,
 *     6. calls ctx.use(shot.cast) and shot.setup(ctx).
 *   Each frame: camera state, caption state and fx are reset to what setup left, then set.update(t),
 *   shot.update(ctx, lt, u), camera effects, 3D render, composite, captions.
 *   => anything a shot does must be either done in setup or recomputed in update from time alone.
 *   Things the engine cannot reset for you: set lighting presets (declare `lighting` or call setLighting in setup),
 *   prop internal state (re-apply in update), objects you add directly into set.root or character joints without
 *   ctx.add (use ctx.add(obj, parent) instead).
 *
 * ─── ctx API (SPEC §8 + extras) ───────────────────────────────────────────────────────────────────
 *   THREE, scene, camera, renderer, t, dt, lt, u, shot, shotIndex, set, getSet(name), cast,
 *   props   — per-FILM object (persists across shots; create props in init(ctx)),
 *   store   — per-SHOT scratch object: reset to {} at every shot change (assign it in setup, read it in update),
 *   use(...ids), place(char|id, anchor|Object3D|Vector3|[x,y,z], { yaw, offset, scale })  (auto-attaches the char),
 *   anchor(name)  ('setName:anchor' reads another set),  point(p) → world Vector3 for any position form,
 *   add(obj, parent = scene), remove(obj),
 *   time(anchor), since(anchor) = t − time(anchor), progress(a, b) = 0..1 between two anchors,
 *   words, beats, beat(id), wordAt(t), hussTimes(beatId?), markers, timeline,
 *   cam.set({pos, look, fov, roll}), cam.move(from, to, u, ease = linear), cam.shake(amount, t, seed, freq),
 *   cam.punch(times|beatId, t, amount = 0.08, decay = 0.25), cam.orbit(center, radius, height, angle, fov),
 *     positions accept [x,y,z] | Vector3 | Object3D | 'anchor.name' | { anchor, offset:[x,y,z] }.
 *     cam.move: ease may be a function or an ease name ('inOutCubic'); omitted → linear (pass a pre-eased u).
 *     cam.set/move/orbit called in setup persist for the whole shot; called in update they apply to that frame.
 *     shake amount: 0.1 subtle handheld · 0.3 nervous · 1 earthquake. punch: FOV kick (+ tiny roll) per impact.
 *   fx.overlay(color, alpha), fx.vignette(strength)   2D overlays composited under the captions
 *   caption.hide(on = true), caption.style('default'|'high'|'low'), caption.sfx(on)  (show sfx words)
 *   ease, rng, lerp, clamp, smooth, noise1, hash
 *
 * Determinism: nothing here reads wall-clock time for pixels (performance.now is used only for the timing stats
 * and for the optional ?ui=1 preview player, which merely chooses which t to render).
 */
import * as THREE from 'three';
import { rng, clamp, lerp, smooth, ease, noise1, hash } from './lib/util.js';

export const W = 1080, H = 1920;
export const CAPTION_Y = 0.57;
export const QUOTE_COLORS = { marcus: '#ff7a2f', heckler: '#3ee0c8', mayor: '#d4af37', default: '#ff4fa3' };
const FONT_NARR = 'ITT Nunito';
const FONT_HUSS = 'ITT Luckiest';
const FONT_FILES = [
  [FONT_NARR, '/node_modules/@fontsource/nunito/files/nunito-latin-900-normal.woff2', { weight: '900' }],
  [FONT_NARR, '/node_modules/@fontsource/nunito/files/nunito-latin-ext-900-normal.woff2',
    { weight: '900', unicodeRange: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' }],
  [FONT_HUSS, '/node_modules/@fontsource/luckiest-guy/files/luckiest-guy-latin-400-normal.woff2', { weight: '400' }],
];
const DEFAULT_BG = new THREE.Color('#151a3a');
const CAM_DEFAULT = { pos: [0, 1.6, 6], look: [0, 1.2, 0], fov: 40, roll: 0 };

// ═══════════════════════════════════════ fonts ═══════════════════════════════════════════════════
let _fontsPromise = null;
export function loadCaptionFonts() {
  if (_fontsPromise) return _fontsPromise;
  _fontsPromise = (async () => {
    for (const [fam, url, desc] of FONT_FILES) {
      const f = new FontFace(fam, `url(${url})`, desc);
      try { await f.load(); document.fonts.add(f); } catch (e) {
        if (!/latin-ext/.test(url)) throw new Error(`caption font failed to load: ${url} (${e.message || e})`);
      }
    }
    // also loads any matching CSS @font-face (index.html declares the same families) so check() is truthful
    await Promise.all([document.fonts.load(`900 96px "${FONT_NARR}"`, 'Ag'), document.fonts.load(`170px "${FONT_HUSS}"`, 'HUSS!')]);
    await document.fonts.ready;
    const ok = document.fonts.check(`900 96px "${FONT_NARR}"`, 'Ag') && document.fonts.check(`170px "${FONT_HUSS}"`, 'HUSS!');
    if (!ok) throw new Error('caption fonts not available after loading');
    return true;
  })();
  return _fontsPromise;
}

// ═══════════════════════════════════════ timeline ════════════════════════════════════════════════
export async function loadTimeline(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`timeline not found: ${url} (HTTP ${res.status})`);
  let json;
  try { json = await res.json(); } catch (e) { throw new Error(`timeline ${url} is not valid JSON: ${e.message}`); }
  return normalizeTimeline(json);
}

const isHussWord = (w) => w.kind === 'huss' || /^huss/i.test(String(w.text || '').replace(/^[^a-z]+/i, ''));

export function normalizeTimeline(src) {
  const tl = { ...src };
  tl.fps = +src.fps || 30;
  const beats = (src.beats || []).map((b) => ({ ...b, words: (b.words || []).map((w) => ({ ...w })) }));
  const byId = new Map(beats.map((b) => [b.id, b]));
  let words;
  if (Array.isArray(src.words) && src.words.length) {
    words = src.words.map((w) => ({ ...w }));
    // the global list is the source of truth: rebuild beat.words from it when it carries beat ids
    const per = new Map();
    for (const w of words) if (w.beat != null) { if (!per.has(w.beat)) per.set(w.beat, []); per.get(w.beat).push(w); }
    for (const [id, list] of per) { const b = byId.get(id); if (b) b.words = list.slice().sort((a, c) => a.start - c.start); }
  } else {
    words = [];
    for (const b of beats) b.words.forEach((w, i) => { w.beat = b.id; w.i = i; words.push(w); });
  }
  for (const w of words) {
    const b = byId.get(w.beat);
    if (b) { if (w.kind == null) w.kind = b.kind; if (w.speaker == null) w.speaker = b.speaker; }
    if (w.kind == null) w.kind = 'line';
    w.start = +w.start; w.end = w.end != null ? +w.end : w.start + 0.3;
  }
  words.sort((a, b) => a.start - b.start || (a.gi ?? 0) - (b.gi ?? 0));
  words.forEach((w, gi) => { w.gi = gi; });
  for (const b of beats) {
    b.words.forEach((w, i) => { if (w.i == null) w.i = i; });
    if (b.start == null && b.words.length) b.start = b.words[0].start;
    if (b.end == null && b.words.length) b.end = b.words[b.words.length - 1].end;
    b.start = +b.start; b.end = +b.end;
  }
  const lastEnd = words.length ? words[words.length - 1].end : 0;
  tl.duration = src.duration != null ? +src.duration : Math.max(1, lastEnd + 1);
  tl.beats = beats; tl.byId = byId; tl.words = words;
  tl.markers = src.markers || {}; tl.music = src.music || [];
  return tl;
}

/** Resolve an anchor ('b05', 'b05.end', 'b05.w2', 'b05.w2.end', 'b05.h1', 'b05.wlast', marker name,
 *  any of those + '+0.15' / '-0.2', or a number) to seconds. Throws on unknown anchors. */
export function timeOf(tl, anchor, _depth = 0) {
  if (typeof anchor === 'number') return anchor;
  if (anchor == null) throw new Error('time anchor is null/undefined');
  const s = String(anchor).trim();
  if (/^[+-]?\d*\.?\d+(e[+-]?\d+)?$/i.test(s)) return +s;
  let base = s, off = 0;
  const m = s.match(/^(.+?)\s*([+-]\s*\d*\.?\d+)$/);
  if (m) {
    base = m[1].trim(); off = +m[2].replace(/\s+/g, '');
    if (/^[+-]?\d*\.?\d+$/.test(base)) return +base + off;
  }
  const parts = base.split('.');
  const b = tl.byId.get(parts[0]);
  if (b) {
    const rest = parts.slice(1);
    if (!rest.length || rest[0] === 'start') return b.start + off;
    if (rest[0] === 'end') return b.end + off;
    if (rest[0] === 'mid') return (b.start + b.end) / 2 + off;
    const wm = rest[0].match(/^([wh])(\d+|last)$/);
    if (wm) {
      const list = wm[1] === 'h' ? (b.words.filter(isHussWord).length ? b.words.filter(isHussWord) : b.words) : b.words;
      const idx = wm[2] === 'last' ? list.length - 1 : +wm[2];
      const w = list[idx];
      if (!w) throw new Error(`time anchor "${anchor}": beat ${b.id} has only ${list.length} ${wm[1] === 'h' ? 'HUSS words' : 'words'}`);
      return (rest[1] === 'end' ? w.end : w.start) + off;
    }
    throw new Error(`time anchor "${anchor}": unknown part ".${rest.join('.')}"`);
  }
  if (tl.markers && tl.markers[base] != null && _depth < 8) return timeOf(tl, tl.markers[base], _depth + 1) + off;
  throw new Error(`unknown time anchor "${anchor}" (no beat or marker "${parts[0]}")`);
}

export function hussTimesOf(tl, beatId) {
  if (beatId != null && !tl.byId.has(beatId)) throw new Error(`hussTimes: unknown beat "${beatId}"`);
  const src = beatId != null ? tl.byId.get(beatId).words : tl.words;
  return src.filter(isHussWord).map((w) => w.start);
}

// ═══════════════════════════════════════ captions ════════════════════════════════════════════════
const _metric = new Map();
function capHeight(g, font) {
  let v = _metric.get(font);
  if (v == null) { g.save(); g.font = font; v = g.measureText('H').actualBoundingBoxAscent || 0.7 * parseFloat(font.match(/(\d+(\.\d+)?)px/)[1]); g.restore(); _metric.set(font, v); }
  return v;
}

function cleanWord(text, w, opts) {
  let s = String(text ?? '').trim();
  if (w.kind === 'huss') { s = s.toUpperCase(); if (!/!$/.test(s)) s += '!'; return s; }
  if (w.kind === 'sfx') return s;
  s = s.replace(/^["“”‘'(\[]+/, '').replace(/["“”)\]]+$/, '');
  if (!opts.keepPunctuation) s = s.replace(/(\.\.\.|…|[.,;:—–-])+$/, '');
  if (opts.uppercase) s = s.toUpperCase();
  return s || String(text);
}

/** Build the list of displayable caption words with their visibility window [start, until). */
function buildCaptionTrack(tl, includeSfx) {
  const list = tl.words.filter((w) => (includeSfx || w.kind !== 'sfx') && !w.hidden && String(w.text || '').trim());
  return list.map((w, k) => {
    const next = list[k + 1];
    const until = Math.min(next ? next.start : Infinity, w.end + 0.35);
    return { w, start: w.start, until: Math.max(until, w.start + 1e-3) };
  });
}

function findEntry(track, t) {
  let lo = 0, hi = track.length - 1, ans = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (track[mid].start <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  if (ans < 0) return null;
  const e = track[ans];
  return t < e.until ? e : null;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/**
 * Draw the caption for time t onto a 1080-wide 2D context (scales with g.canvas.width).
 * state: { hidden, style: 'default'|'high'|'low', sfx: bool, options: captionOptions, track/trackSfx (cached) }
 */
export function drawCaptions(g, tl, t, state = {}) {
  if (state.hidden) return null;
  const opts = state.options || {};
  if (!tl.__capTrack) { tl.__capTrack = buildCaptionTrack(tl, false); tl.__capTrackSfx = buildCaptionTrack(tl, true); }
  const e = findEntry(state.sfx ? tl.__capTrackSfx : tl.__capTrack, t);
  if (!e) return null;
  const w = e.w;
  const cw = g.canvas.width, ch = g.canvas.height, k = cw / W;
  const yFrac = state.style === 'high' ? 0.34 : state.style === 'low' ? 0.70 : (opts.y ?? CAPTION_Y);
  const cx = cw / 2, cy = ch * yFrac;
  const lt = t - e.start;
  const text = cleanWord(w.text, w, opts);
  const seed = w.gi ?? 0;
  const maxW = (W - 2 * 72) * k;
  g.save();
  g.lineJoin = 'round'; g.lineCap = 'round'; g.miterLimit = 2;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';

  if (w.kind === 'huss') {
    // ── HUSS! — comic sound effect: Luckiest Guy, yellow gradient, chunky black outline + extrude, tilt, shake
    let size = 170 * k;
    let font = `${size}px "${FONT_HUSS}"`;
    g.font = font;
    const tw = g.measureText(text).width;
    if (tw > maxW) { size *= maxW / tw; font = `${size}px "${FONT_HUSS}"`; g.font = font; }
    const capH = capHeight(g, font);
    const pu = clamp(lt / 0.12, 0, 1);
    const sc = lerp(1.55, 1.0, ease.outBack(pu));
    const sign = (seed % 2) ? 1 : -1;
    const tilt = sign * (2 + 4 * hash(seed * 7.13 + 1.7)) * Math.PI / 180;
    const amp = lt < 0.12 ? 11 * k * (1 - lt / 0.12) : 0;
    const ph = hash(seed * 3.1) * 6.283;
    const sx = amp * Math.sin(lt * 110 + ph), sy = amp * Math.cos(lt * 137 + ph * 1.7);
    g.translate(cx + sx, cy + sy);
    g.rotate(tilt);
    g.scale(sc, sc);
    const by = capH / 2;            // baseline so the caps are vertically centred on cy
    const ow = 30 * k, ext = 13 * k;
    // soft drop shadow
    g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 26 * k; g.shadowOffsetY = 14 * k;
    g.strokeStyle = '#111'; g.lineWidth = ow; g.fillStyle = '#111';
    g.strokeText(text, 0, by + ext); g.fillText(text, 0, by + ext);
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.strokeText(text, 0, by);
    const grd = g.createLinearGradient(0, by - capH, 0, by);
    grd.addColorStop(0, '#fff7a8'); grd.addColorStop(0.45, '#ffe14a'); grd.addColorStop(1, '#ffb21a');
    g.fillStyle = grd;
    g.fillText(text, 0, by);
    // glossy highlight stripe on the upper part of the letters
    g.save();
    g.beginPath(); g.rect(-cw, by - capH * 1.05, cw * 2, capH * 0.32); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillText(text, 0, by);
    g.restore();
  } else if (w.kind === 'sfx') {
    const size = 64 * k, font = `italic 900 ${size}px "${FONT_NARR}"`;
    g.font = font;
    const capH = capHeight(g, font);
    g.translate(cx, cy); g.strokeStyle = '#000'; g.lineWidth = 16 * k; g.fillStyle = '#e8e8e8';
    g.strokeText(text, 0, capH / 2); g.fillText(text, 0, capH / 2);
  } else {
    // ── narration / quote — Nunito 900, white, thick outline, soft shadow, pop-in
    const isQuote = w.kind === 'quote';
    let size = (isQuote ? 92 : 96) * k;
    let font = `900 ${size}px "${FONT_NARR}"`;
    g.font = font;
    const outline = isQuote ? 26 * k : 24 * k;
    const tw = g.measureText(text).width + outline;
    if (tw > maxW) { size *= maxW / tw; font = `900 ${size}px "${FONT_NARR}"`; g.font = font; }
    const capH = capHeight(g, font);
    const pu = clamp(lt / 0.10, 0, 1), pe = ease.outCubic(pu);
    const sc = lerp(1.18, 1.0, pe);
    const dy = 8 * k * (1 - pe);
    const speaker = w.speaker || 'narr';
    const qcol = (opts.speakerColors && opts.speakerColors[speaker]) || QUOTE_COLORS[speaker] || QUOTE_COLORS.default;
    // speaker tag for quotes (pops with the first word of the beat)
    if (isQuote) {
      const beat = tl.byId.get(w.beat);
      const t0 = beat && beat.words.length ? beat.words[0].start : e.start;
      const name = ((opts.speakerNames && opts.speakerNames[speaker]) || beat?.speakerName || speaker).toUpperCase();
      const tu = ease.outBack(clamp((t - t0) / 0.14, 0, 1));
      const tf = `900 ${40 * k}px "${FONT_NARR}"`;
      g.save();
      g.font = tf;
      const nw = g.measureText(name).width;
      const pw = nw + 44 * k, ph = 62 * k;
      g.translate(cx, cy - capH / 2 - 26 * k - ph / 2 - 12 * k);
      g.scale(tu, tu);
      g.rotate(-0.035);
      g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 12 * k; g.shadowOffsetY = 5 * k;
      roundRect(g, -pw / 2, -ph / 2, pw, ph, ph / 2);
      g.fillStyle = qcol; g.fill();
      g.shadowColor = 'transparent';
      g.lineWidth = 6 * k; g.strokeStyle = '#111'; g.stroke();
      const tch = capHeight(g, tf);
      g.lineWidth = 9 * k; g.strokeStyle = '#111'; g.strokeText(name, 0, tch / 2);
      g.fillStyle = '#fff'; g.fillText(name, 0, tch / 2);
      g.restore();
      g.font = font;
    }
    g.translate(cx, cy + dy);
    g.scale(sc, sc);
    const by = capH / 2;
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 22 * k; g.shadowOffsetY = 8 * k;
    g.strokeStyle = '#000'; g.lineWidth = outline + (isQuote ? 10 * k : 0);
    g.strokeText(text, 0, by);
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
    if (isQuote) { g.strokeStyle = qcol; g.lineWidth = outline - 6 * k; g.strokeText(text, 0, by); }
    g.fillStyle = w.color || (w.emph ? '#ffe14a' : '#ffffff');
    g.fillText(text, 0, by);
  }
  g.restore();
  return { text, kind: w.kind, gi: w.gi };
}

// ═══════════════════════════════════════ engine ══════════════════════════════════════════════════
function asVec3(v) {
  if (v instanceof THREE.Vector3) return v.clone();
  if (Array.isArray(v)) return new THREE.Vector3(+v[0] || 0, +v[1] || 0, +v[2] || 0);
  if (v && typeof v.x === 'number') return new THREE.Vector3(v.x, v.y, v.z);
  return null;
}

export function createEngine(opts = {}) {
  const canvas = opts.canvas || Object.assign(document.createElement('canvas'), { width: W, height: H });
  canvas.width = W; canvas.height = H;
  const scale = clamp(+(opts.scale ?? 0.6667) || 0.6667, 0.1, 2);
  const IW = Math.round(W * scale), IH = Math.round(H * scale);
  // 2D composite of the upscaled 3D buffer. imageSmoothingQuality 'high' is NOT bit-deterministic in Chromium (the same
  // drawImage differs by ±1 LSB depending on its internal rescale cache — measured), 'medium'/'low' are bit-exact
  // (both bilinear for an upscale). composite 'cpu' = software-backed 2D canvas, 'gpu' = accelerated; both exact.
  const compositeMode = opts.composite || 'cpu';
  const smoothQ = opts.smoothing || 'medium';
  const g2 = canvas.getContext('2d', { alpha: false, willReadFrequently: compositeMode === 'cpu' });
  const glCanvas = document.createElement('canvas');
  glCanvas.width = IW; glCanvas.height = IH;
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: opts.antialias !== false, alpha: false,
    preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(IW, IH, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = DEFAULT_BG.clone();
  const camera = new THREE.PerspectiveCamera(CAM_DEFAULT.fov, 9 / 16, 0.1, 1000);
  scene.add(camera);

  const errors = [];
  const errSeen = new Map();
  function reportError(where, e) {
    const msg = `[${where}] ${e && e.message ? e.message : e}`;
    const n = (errSeen.get(msg) || 0) + 1; errSeen.set(msg, n);
    if (n <= 3) {
      errors.push(msg);
      console.error(msg + (e && e.stack && n === 1 ? '\n' + e.stack.split('\n').slice(1, 4).join('\n') : ''));
      opts.onError && opts.onError(msg);
    }
  }
  const warned = new Set();
  const warnOnce = (msg) => { if (!warned.has(msg)) { warned.add(msg); console.warn(msg); } };

  // ── state
  let tl = null, mod = null, shots = [], captionOptions = {};
  const setFactories = {}, sets = {}, setInitialOptions = new Map();
  const cast = {}, castMeta = new Map();
  const props = {};
  const added = new Set();
  const attached = new Set();
  let activeIndex = -1, activeSet = null, lastT = -Infinity, frameNo = 0;
  let lastBg = undefined, lastFog = undefined;
  let shotCam = null, cam = null, camUsedShot = false, camUsed = false;
  const fx = { pos: new THREE.Vector3(), rot: new THREE.Vector3(), zoom: 0, roll: 0, overlays: [], vignette: 0, texts: [], draws: [] };
  let capShot = null, cap = null;
  const timing = { setup: 0, update: 0, render: 0, composite: 0, total: 0 };

  const newCamState = () => ({ pos: asVec3(CAM_DEFAULT.pos), look: asVec3(CAM_DEFAULT.look), fov: CAM_DEFAULT.fov, roll: CAM_DEFAULT.roll });
  const cloneCam = (c) => ({ pos: c.pos.clone(), look: c.look.clone(), fov: c.fov, roll: c.roll });

  // ── anchors / points
  function anchor(name) {
    if (typeof name !== 'string') return name;
    let setObj = activeSet, key = name;
    const ci = name.indexOf(':');
    if (ci > 0) { setObj = getSet(name.slice(0, ci)); key = name.slice(ci + 1); }
    if (!setObj) throw new Error(`anchor("${name}"): no active set`);
    const a = setObj.anchors ? setObj.anchors[key] : undefined;
    if (a === undefined) {
      const keys = Object.keys(setObj.anchors || {});
      throw new Error(`unknown anchor "${key}" in set "${setObj.__name}". Known: ${keys.slice(0, 40).join(', ')}${keys.length > 40 ? ', …' : ''}`);
    }
    return a;
  }
  function point(p) {
    if (p == null) throw new Error('position is null/undefined');
    if (typeof p === 'string') p = anchor(p);
    if (p && p.isObject3D) { p.updateWorldMatrix(true, false); return new THREE.Vector3().setFromMatrixPosition(p.matrixWorld); }
    if (p && !Array.isArray(p) && p.anchor != null) {
      const a = anchor(p.anchor);
      const base = point(a);
      if (p.offset) {
        const off = asVec3(p.offset);
        if (a && a.isObject3D && p.local !== false) { const q = new THREE.Quaternion(); a.getWorldQuaternion(q); off.applyQuaternion(q); }
        base.add(off);
      }
      return base;
    }
    const v = asVec3(p);
    if (!v) throw new Error(`cannot interpret position ${JSON.stringify(p)}`);
    return v;
  }

  // ── sets
  function wrapSet(obj, name) {
    let s = obj;
    if (s && s.isObject3D) s = { root: s, anchors: {} };
    if (!s || !s.root || !s.root.isObject3D) throw new Error(`set "${name}" factory did not return a Set ({ root: Object3D, … })`);
    s.anchors = s.anchors || {};
    s.__name = name;
    setInitialOptions.set(s, s.options && typeof s.options === 'object' ? { ...s.options } : null);
    return s;
  }
  function getSet(name) {
    if (sets[name]) return sets[name];
    const f = setFactories[name];
    if (!f) throw new Error(`unknown set "${name}". Known: ${Object.keys(setFactories).join(', ')}`);
    const built = typeof f === 'function' ? f(ctx) : f;
    if (built && typeof built.then === 'function') throw new Error(`set "${name}" factory returned a Promise; set factories must be synchronous`);
    sets[name] = wrapSet(built, name);
    return sets[name];
  }

  // ── cast
  function snapshotCharacter(ch, spec) {
    const nodes = [];
    ch.root.traverse((o) => nodes.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone(), o.visible]));
    const meta = { nodes, spec: spec || {}, acc: new Map(), hatChanged: false };
    const initialAcc = new Set((spec && spec.accessories) || []);
    if (typeof ch.setAccessory === 'function') {
      const orig = ch.setAccessory.bind(ch);
      meta.origAcc = orig;
      ch.setAccessory = (name, on) => { meta.acc.set(name, !!on); return orig(name, on); };
      meta.initialAcc = initialAcc;
    }
    if (typeof ch.setPartyHatColor === 'function') {
      const orig = ch.setPartyHatColor.bind(ch);
      meta.origHat = orig;
      ch.setPartyHatColor = (c) => { meta.hatChanged = true; return orig(c); };
    }
    castMeta.set(ch, meta);
  }
  function resetCharacter(ch) {
    const meta = castMeta.get(ch);
    ch.root.removeFromParent();
    if (!meta) return;
    for (const [o, p, q, s, v] of meta.nodes) { o.position.copy(p); o.quaternion.copy(q); o.scale.copy(s); o.visible = v; }
    if (meta.origAcc) {
      for (const [n, on] of meta.acc) { const init = meta.initialAcc.has(n); if (on !== init) { try { meta.origAcc(n, init); } catch (e) { reportError(`reset ${ch.id}.setAccessory`, e); } } }
      meta.acc.clear();
    }
    if (meta.origHat && meta.hatChanged) {
      try { meta.origHat(meta.spec.partyHatColor || '#ff4fa3'); } catch (e) { reportError(`reset ${ch.id}.setPartyHatColor`, e); }
      meta.hatChanged = false;
    }
    try { ch.pose && ch.pose('idle', 0); } catch (e) { reportError(`reset ${ch.id}.pose`, e); }
    try { ch.face && ch.face('neutral', 0); } catch (e) { reportError(`reset ${ch.id}.face`, e); }
  }
  async function buildCast(castSpecs) {
    let factories = null;
    const needFactories = Object.values(castSpecs).some((v) => v && typeof v === 'object' && !v.root);
    if (needFactories) {
      if (typeof mod.makeCharacter === 'function') factories = { makeCharacter: mod.makeCharacter, makeCreature: mod.makeCreature };
      else factories = await import('./characters.js');
    }
    for (const [id, v] of Object.entries(castSpecs)) {
      let ch, spec = null;
      if (v && v.root && v.root.isObject3D) ch = v;
      else if (typeof v === 'function') ch = v(ctx);
      else {
        spec = { id, ...v };
        if (spec.creature) {
          if (!factories.makeCreature) throw new Error(`cast "${id}": no makeCreature factory`);
          ch = factories.makeCreature(spec.creature, spec);
        } else ch = factories.makeCharacter(spec);
      }
      if (!ch || !ch.root) throw new Error(`cast "${id}" did not produce a Character ({ root, … })`);
      if (ch.id == null) ch.id = id;
      ch.root.name = ch.root.name || `cast:${id}`;
      cast[id] = ch;
      snapshotCharacter(ch, spec || (v && typeof v === 'object' && !v.root ? v : null));
    }
  }
  function resolveChar(c) {
    if (typeof c === 'string') { const ch = cast[c]; if (!ch) throw new Error(`unknown cast member "${c}". Known: ${Object.keys(cast).join(', ')}`); return ch; }
    return c;
  }
  function attachChar(ch) {
    if (ch.root.parent !== scene) scene.add(ch.root);
    attached.add(ch);
  }
  function use(...ids) {
    const list = ids.flat(Infinity).filter((x) => x != null).map(resolveChar);
    const keep = new Set(list);
    for (const ch of [...attached]) if (!keep.has(ch)) { ch.root.removeFromParent(); attached.delete(ch); }
    for (const ch of list) attachChar(ch);
    return list;
  }
  const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  function place(c, where, o = {}) {
    const ch = resolveChar(c);
    const obj = ch && ch.root ? ch.root : ch;
    if (!obj || !obj.isObject3D) throw new Error('place(): first argument must be a Character, cast id or Object3D');
    let target = typeof where === 'string' ? anchor(where) : where;
    const pos = new THREE.Vector3(); _q.identity();
    if (target && target.isObject3D) {
      target.updateWorldMatrix(true, false);
      target.matrixWorld.decompose(pos, _q, _v);
    } else {
      const v = point(target); if (!v) throw new Error('place(): bad target'); pos.copy(v);
    }
    if (o.offset) pos.add(asVec3(o.offset).applyQuaternion(_q));
    if (o.yaw) _q.multiply(_q2.setFromAxisAngle(_up, o.yaw));
    if (ch && ch.root && !obj.parent) attachChar(ch);   // auto-attach; a root parented elsewhere (ctx.add(root, carrier)) stays there
    // root is a direct child of the scene (identity), so world == local
    if (obj.parent && obj.parent !== scene) {
      obj.parent.updateWorldMatrix(true, false);
      const inv = obj.parent.matrixWorld.clone().invert();
      const m = new THREE.Matrix4().compose(pos, _q, obj.scale).premultiply(inv);
      const s = new THREE.Vector3(); m.decompose(obj.position, obj.quaternion, s);
    } else { obj.position.copy(pos); obj.quaternion.copy(_q); }
    if (o.scale != null) obj.scale.setScalar(o.scale);
    return ch;
  }

  // ── add / remove
  function add(obj, parent) {
    if (!obj) return obj;
    const o = obj.root && obj.root.isObject3D ? obj.root : obj;
    (parent ? (parent.root && parent.root.isObject3D ? parent.root : parent) : scene).add(o);
    added.add(o);
    return obj;
  }
  function remove(obj) {
    if (!obj) return obj;
    const o = obj.root && obj.root.isObject3D ? obj.root : obj;
    o.removeFromParent(); added.delete(o);
    return obj;
  }

  // ── time helpers
  const time = (a) => timeOf(tl, a);
  const hussTimes = (beatId) => hussTimesOf(tl, beatId);
  function resolveTimes(times) {
    if (times == null) return [];
    if (typeof times === 'string' && tl.byId.has(times)) return hussTimesOf(tl, times).length ? hussTimesOf(tl, times) : [time(times)];
    const arr = Array.isArray(times) ? times : [times];
    return arr.map((x) => (typeof x === 'number' ? x : time(x)));
  }
  function wordAt(t) {
    const ws = tl.words; let lo = 0, hi = ws.length - 1, ans = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (ws[mid].start <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
    return ans >= 0 ? ws[ans] : null;
  }

  // ── camera API
  function applyCamSpec(dst, o) {
    if (!o) return;
    if (o.pos != null) dst.pos.copy(point(o.pos));
    if (o.look != null) dst.look.copy(point(o.look));
    if (o.fov != null) dst.fov = +o.fov;
    if (o.roll != null) dst.roll = +o.roll;
  }
  const camApi = {
    set(o) { applyCamSpec(cam, o); camUsed = true; return camApi; },
    move(from, to, u, e) {
      const fn = typeof e === 'string' ? (ease[e] || ease.linear) : (typeof e === 'function' ? e : ease.linear);
      const k = fn(clamp(u, 0, 1));
      const a = cloneCam(cam);
      applyCamSpec(a, from);
      const b = cloneCam(a);          // fields missing in `to` stay at their `from` value
      applyCamSpec(b, to);
      cam.pos.lerpVectors(a.pos, b.pos, k); cam.look.lerpVectors(a.look, b.look, k);
      cam.fov = lerp(a.fov, b.fov, k); cam.roll = lerp(a.roll, b.roll, k);
      camUsed = true; return camApi;
    },
    shake(amount = 0.1, t = ctx.t, seed = 0, freq = 1) {
      const a = amount, f = freq;
      fx.pos.x += a * 0.12 * (noise1(t * 1.7 * f, seed + 1) + 0.35 * noise1(t * 5.3 * f, seed + 11));
      fx.pos.y += a * 0.10 * (noise1(t * 1.9 * f, seed + 2) + 0.35 * noise1(t * 6.1 * f, seed + 12));
      fx.pos.z += a * 0.06 * noise1(t * 1.3 * f, seed + 3);
      fx.rot.x += a * 0.022 * (noise1(t * 1.5 * f, seed + 4) + 0.3 * noise1(t * 7.0 * f, seed + 14));
      fx.rot.y += a * 0.022 * (noise1(t * 1.2 * f, seed + 5) + 0.3 * noise1(t * 6.3 * f, seed + 15));
      fx.rot.z += a * 0.018 * noise1(t * 0.9 * f, seed + 6);
      return camApi;
    },
    punch(times, t = ctx.t, amount = 0.08, decay = 0.25) {
      const ts = resolveTimes(times);
      for (let i = 0; i < ts.length; i++) {
        const d = t - ts[i];
        if (d < 0 || d > decay * 3) continue;
        const env = Math.exp(-4 * d / decay);
        fx.zoom += amount * env;
        fx.roll += amount * 0.22 * env * (i % 2 ? 1 : -1);
      }
      return camApi;
    },
    orbit(center, radius, height, angle, fov) {
      const c = point(center);
      cam.pos.set(c.x + Math.sin(angle) * radius, c.y + height, c.z + Math.cos(angle) * radius);
      cam.look.copy(c);
      if (fov != null) cam.fov = fov;
      camUsed = true; return camApi;
    },
    get state() { return cloneCam(cam); },
  };

  const fxApi = {
    overlay(color = '#000', alpha = 1) { if (alpha > 0) fx.overlays.push([color, clamp(alpha, 0, 1)]); return fxApi; },
    vignette(strength = 0.5) { fx.vignette = Math.max(fx.vignette, clamp(strength, 0, 1)); return fxApi; },
    // meme text overlay drawn over the 3D, under the captions. x/y are 0..1 of the frame.
    // opts: { x=.5, y=.25, size=120, fill='#fff', stroke='#000', line=14, rot=0 (rad), scale=1, alpha=1,
    //         font='huss'|'narr', bg=null (rgba box behind), shadow=true }
    text(str, o = {}) { fx.texts.push([String(str), o]); return fxApi; },
    // custom 2D drawing over the 3D (under captions): fn(g2d, W, H)
    draw(fn) { fx.draws.push(fn); return fxApi; },
  };
  const captionApi = {
    hide(on = true) { cap.hidden = !!on; },
    style(name = 'default') { cap.style = name; },
    sfx(on = true) { cap.sfx = !!on; },
  };

  const ctx = {
    THREE, scene, camera, renderer, canvas, glCanvas,
    t: 0, dt: 1 / 30, lt: 0, u: 0, shot: null, shotIndex: -1, frame: 0,
    set: null, getSet, cast, props, store: {}, use, place, anchor, point, add, remove,
    time, since: (a) => ctx.t - time(a),
    progress: (a, b) => { const ta = time(a), tb = time(b); return tb > ta ? clamp((ctx.t - ta) / (tb - ta), 0, 1) : (ctx.t >= tb ? 1 : 0); },
    words: [], beats: [], beat: (id) => tl.byId.get(id), wordAt, hussTimes, markers: {}, timeline: null,
    cam: camApi, fx: fxApi, caption: captionApi,
    ease, rng, lerp, clamp, smooth, noise1, hash,
  };

  // ── init
  const ready = (async () => {
    const fontsP = loadCaptionFonts();
    tl = opts.timeline ? (opts.timeline.byId ? opts.timeline : normalizeTimeline(opts.timeline)) : await loadTimeline(opts.timelineUrl || '/audio/timeline.json');
    ctx.dt = 1 / tl.fps; ctx.words = tl.words; ctx.beats = tl.beats; ctx.markers = tl.markers; ctx.timeline = tl;
    if (opts.shots) mod = opts.shots;
    else {
      const url = opts.shotsModule || '/src/shots.js';
      try { mod = await import(url); } catch (e) {
        let missing = [];
        try {
          missing = performance.getEntriesByType('resource').filter((r) => r.responseStatus >= 400)
            .map((r) => new URL(r.name).pathname).filter((p, i, a) => a.indexOf(p) === i);
        } catch {}
        throw new Error(`could not load shots module ${url}: ${e.message || e}` +
          (missing.length ? `\nmissing files (HTTP 404): ${missing.join(', ')}` : '') +
          `\n(does the file exist? did it, or a module it imports, throw or fail to parse? see the console for the exact error)`);
      }
    }
    captionOptions = { ...(mod.captionOptions || {}) };
    Object.assign(setFactories, mod.sets || {});
    const castSpecs = mod.cast || {};
    if (!Array.isArray(mod.shots) || !mod.shots.length) throw new Error('shots module must export a non-empty `shots` array');
    shots = mod.shots.map((s, i) => {
      let start;
      try { start = i === 0 && s.start == null ? 0 : timeOf(tl, s.start ?? 0); } catch (e) { throw new Error(`shot #${i} "${s.name}": ${e.message}`); }
      return { def: s, index: i, name: s.name || `shot ${i}`, start };
    });
    for (let i = 1; i < shots.length; i++) if (shots[i].start < shots[i - 1].start) warnOnce(`shots out of order: "${shots[i].name}" (${shots[i].start.toFixed(2)}s) starts before "${shots[i - 1].name}" (${shots[i - 1].start.toFixed(2)}s)`);
    for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? Math.max(shots[i + 1].start, shots[i].start) : Math.max(tl.duration, shots[i].start);
    for (const s of shots) if (s.def.set && !setFactories[s.def.set]) throw new Error(`shot "${s.name}" uses unknown set "${s.def.set}". Known: ${Object.keys(setFactories).join(', ')}`);
    await buildCast(castSpecs);
    if (!mod.lazySets) for (const name of Object.keys(setFactories)) getSet(name);
    if (typeof mod.init === 'function') await mod.init(ctx);
    await fontsP;
    return true;
  })();

  // ── shot switching
  function shotIndexAt(t) {
    let idx = 0;
    for (let i = 0; i < shots.length; i++) if (shots[i].start <= t) idx = i;
    return idx;
  }
  function enterShot(idx) {
    const s = shots[idx];
    // 1. objects added by the previous shot
    for (const o of added) o.removeFromParent();
    added.clear();
    // 2. cast
    for (const ch of Object.values(cast)) resetCharacter(ch);
    attached.clear();
    // 3. strays + set swap
    const newSet = s.def.set ? getSet(s.def.set) : activeSet;
    for (const child of [...scene.children]) {
      if (child === camera || (newSet && child === newSet.root)) continue;
      if (!Object.values(sets).some((st) => st.root === child)) warnOnce(`removed "${child.name || child.type}" that was added straight to the scene by a shot; use ctx.add(obj) so it is cleaned up deterministically`);
      scene.remove(child);
    }
    if (newSet && newSet.root.parent !== scene) scene.add(newSet.root);
    activeSet = newSet; ctx.set = activeSet;
    // 4. set options back to their build-time values, then the shot's declared lighting/options
    if (activeSet) {
      const init = setInitialOptions.get(activeSet);
      if (init && typeof activeSet.set === 'function' && activeSet.options) {
        for (const [k, v] of Object.entries(init)) if (activeSet.options[k] !== v) { try { activeSet.set(k, v); } catch (e) { reportError(`set ${activeSet.__name}.set(${k})`, e); } }
      }
      if (s.def.lighting && typeof activeSet.setLighting === 'function') { try { activeSet.setLighting(s.def.lighting); } catch (e) { reportError(`shot "${s.name}" lighting`, e); } }
      if (s.def.options && typeof activeSet.set === 'function') for (const [k, v] of Object.entries(s.def.options)) { try { activeSet.set(k, v); } catch (e) { reportError(`shot "${s.name}" option ${k}`, e); } }
    }
    // 5. camera + per-shot state
    camera.position.set(...CAM_DEFAULT.pos); camera.up.set(0, 1, 0); camera.quaternion.identity();
    camera.lookAt(...CAM_DEFAULT.look); camera.fov = CAM_DEFAULT.fov; camera.near = 0.1; camera.far = 1000; camera.zoom = 1;
    camera.aspect = 9 / 16; camera.clearViewOffset(); camera.updateProjectionMatrix();
    cam = newCamState(); camUsed = false;
    cap = { hidden: s.def.captions === false, style: 'default', sfx: false };
    copyBackground(true);
    renderer.toneMappingExposure = activeSet && activeSet.exposure != null ? activeSet.exposure : 1.0;
    ctx.shot = s.def; ctx.shotIndex = idx; ctx.store = {};
    ctx.lt = Math.max(0, ctx.t - s.start); ctx.u = s.end > s.start ? clamp(ctx.lt / (s.end - s.start), 0, 1) : 0;
    // 6. declared cast + setup
    if (s.def.cast) { try { use(s.def.cast); } catch (e) { reportError(`shot "${s.name}" cast`, e); } }
    if (typeof s.def.setup === 'function') { try { s.def.setup(ctx); } catch (e) { reportError(`shot "${s.name}" setup`, e); } }
    shotCam = cloneCam(cam); camUsedShot = camUsed;
    capShot = { ...cap };
    activeIndex = idx;
  }
  function copyBackground(force) {
    const bg = activeSet && activeSet.background != null ? activeSet.background : DEFAULT_BG;
    const fog = activeSet && activeSet.fog !== undefined ? activeSet.fog : null;
    if (force || bg !== lastBg) { scene.background = bg; lastBg = bg; }
    if (force || fog !== lastFog) { scene.fog = fog; lastFog = fog; }
  }

  // ── frame
  const _savePos = new THREE.Vector3(), _saveQuat = new THREE.Quaternion();
  let vignetteCanvas = null;
  function renderFrame(t) {
    const T0 = performance.now();
    t = +t;
    if (!Number.isFinite(t)) throw new Error(`renderAt: bad time ${t}`);
    ctx.t = t; ctx.frame = Math.round(t * tl.fps); frameNo = ctx.frame;
    const idx = shotIndexAt(t);
    const s = shots[idx];
    ctx.lt = Math.max(0, t - s.start);
    ctx.u = s.end > s.start ? clamp(ctx.lt / (s.end - s.start), 0, 1) : 0;
    let T1 = performance.now();
    if (idx !== activeIndex || t < lastT || opts.resetEveryFrame) enterShot(idx);
    lastT = t;
    timing.setup = performance.now() - T1;
    // per-frame state from what setup left
    cam = cloneCam(shotCam); camUsed = camUsedShot;
    fx.pos.set(0, 0, 0); fx.rot.set(0, 0, 0); fx.zoom = 0; fx.roll = 0; fx.overlays.length = 0; fx.vignette = 0; fx.texts.length = 0; fx.draws.length = 0;
    cap = { ...capShot };
    if (activeSet) renderer.toneMappingExposure = activeSet.exposure != null ? activeSet.exposure : 1.0;
    T1 = performance.now();
    if (activeSet && typeof activeSet.update === 'function') { try { activeSet.update(t); } catch (e) { reportError(`set ${activeSet.__name}.update`, e); } }
    if (typeof s.def.update === 'function') { try { s.def.update(ctx, ctx.lt, ctx.u); } catch (e) { reportError(`shot "${s.name}" update @${t.toFixed(3)}s`, e); } }
    copyBackground(false);
    timing.update = performance.now() - T1;
    // camera
    if (camUsed) {
      camera.position.copy(cam.pos); camera.up.set(0, 1, 0); camera.lookAt(cam.look);
      if (cam.roll) camera.rotateZ(cam.roll);
      camera.fov = cam.fov;
    }
    _savePos.copy(camera.position); _saveQuat.copy(camera.quaternion); const saveFov = camera.fov;
    if (fx.pos.lengthSq()) { camera.translateX(fx.pos.x); camera.translateY(fx.pos.y); camera.translateZ(fx.pos.z); }
    if (fx.rot.x) camera.rotateX(fx.rot.x);
    if (fx.rot.y) camera.rotateY(fx.rot.y);
    if (fx.rot.z || fx.roll) camera.rotateZ(fx.rot.z + fx.roll);
    camera.fov = clamp(saveFov * (1 - clamp(fx.zoom, -0.9, 0.9)), 1, 170);
    camera.updateProjectionMatrix();
    T1 = performance.now();
    renderer.render(scene, camera);
    timing.render = performance.now() - T1;
    T1 = performance.now();
    // composite
    g2.imageSmoothingEnabled = true; g2.imageSmoothingQuality = smoothQ;
    g2.drawImage(glCanvas, 0, 0, W, H);
    camera.position.copy(_savePos); camera.quaternion.copy(_saveQuat); camera.fov = saveFov; camera.updateProjectionMatrix();
    for (const [c, a] of fx.overlays) { g2.globalAlpha = a; g2.fillStyle = c; g2.fillRect(0, 0, W, H); }
    g2.globalAlpha = 1;
    if (fx.vignette > 0) {
      if (!vignetteCanvas) {
        vignetteCanvas = document.createElement('canvas'); vignetteCanvas.width = W / 4; vignetteCanvas.height = H / 4;
        const vg = vignetteCanvas.getContext('2d');
        const grd = vg.createRadialGradient(W / 8, H / 8, H * 0.12, W / 8, H / 8, H * 0.30);
        grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,1)');
        vg.fillStyle = grd; vg.fillRect(0, 0, W / 4, H / 4);
      }
      g2.globalAlpha = fx.vignette; g2.drawImage(vignetteCanvas, 0, 0, W, H); g2.globalAlpha = 1;
    }
    for (const fn of fx.draws) { g2.save(); try { fn(g2, W, H); } catch (e) { reportError('fx.draw', e); } g2.restore(); }
    for (const [str, o] of fx.texts) {
      const size = o.size || 120, sc = o.scale == null ? 1 : o.scale;
      if (sc <= 0 || (o.alpha != null && o.alpha <= 0)) continue;
      g2.save();
      g2.globalAlpha = o.alpha == null ? 1 : clamp(o.alpha, 0, 1);
      g2.translate((o.x == null ? 0.5 : o.x) * W, (o.y == null ? 0.25 : o.y) * H);
      g2.rotate(o.rot || 0); g2.scale(sc, sc);
      g2.font = `${o.font === 'narr' ? '900 ' : ''}${size}px "${o.font === 'narr' ? FONT_NARR : FONT_HUSS}", sans-serif`;
      g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
      const lines = str.split('\n');
      lines.forEach((ln, i) => {
        const y = (i - (lines.length - 1) / 2) * size * 1.05;
        if (o.bg) { const w = g2.measureText(ln).width + size * 0.5; g2.fillStyle = o.bg; roundRect(g2, -w / 2, y - size * 0.62, w, size * 1.24, size * 0.2); g2.fill(); }
        if (o.shadow !== false) { g2.shadowColor = 'rgba(0,0,0,0.45)'; g2.shadowBlur = size * 0.12; g2.shadowOffsetY = size * 0.06; }
        g2.lineWidth = o.line == null ? Math.max(6, size * 0.13) : o.line; g2.strokeStyle = o.stroke || '#000'; g2.strokeText(ln, 0, y);
        g2.shadowColor = 'transparent'; g2.fillStyle = o.fill || '#ffffff'; g2.fillText(ln, 0, y);
      });
      g2.restore();
    }
    try { drawCaptions(g2, tl, t, { ...cap, options: captionOptions }); } catch (e) { reportError('captions', e); }
    if (opts.debug) {
      g2.save(); g2.font = `700 30px monospace`; g2.fillStyle = 'rgba(0,0,0,0.55)'; g2.fillRect(0, 0, W, 46);
      g2.fillStyle = '#fff'; g2.textBaseline = 'middle';
      g2.fillText(`t=${t.toFixed(2)}  f=${frameNo}  #${idx} ${s.name}  lt=${ctx.lt.toFixed(2)}`, 14, 23); g2.restore();
    }
    timing.composite = performance.now() - T1;
    timing.total = performance.now() - T0;
  }

  let chain = Promise.resolve();
  function renderAt(t) {
    const p = chain.then(() => ready).then(() => renderFrame(t));
    chain = p.catch(() => {});
    return p;
  }
  let smallCanvas = null;
  function frameDataURL(type = 'image/jpeg', q = 0.92, width) {
    if (!width || width >= W) return canvas.toDataURL(type, q);
    if (!smallCanvas) smallCanvas = document.createElement('canvas');
    const h = Math.round(width * H / W);
    if (smallCanvas.width !== width || smallCanvas.height !== h) { smallCanvas.width = width; smallCanvas.height = h; }
    const sg = smallCanvas.getContext('2d'); sg.imageSmoothingQuality = 'high'; sg.drawImage(canvas, 0, 0, width, h);
    return smallCanvas.toDataURL(type, q);
  }
  function shotAt(t) {
    if (!shots.length) return null;
    const i = shotIndexAt(+t); const s = shots[i];
    return { index: i, name: s.name, start: s.start, end: s.end, set: s.def.set || null };
  }
  function stats() {
    const r = renderer.info;
    return { calls: r.render.calls, triangles: r.render.triangles, geometries: r.memory.geometries, textures: r.memory.textures,
      programs: r.programs ? r.programs.length : 0, internal: [IW, IH], timing: { ...timing } };
  }

  const engine = {
    ready, ctx, renderer, scene, camera, canvas, renderAt, frameDataURL, shotAt, stats, errors, timing,
    get duration() { return tl ? tl.duration : NaN; }, get fps() { return tl ? tl.fps : 30; },
    get timeline() { return tl; }, get shots() { return shots.map((s) => ({ index: s.index, name: s.name, start: s.start, end: s.end, set: s.def.set || null })); },
  };
  engine.api = {
    ready, renderAt, frameDataURL, shotAt, stats, errors, timing,
    get duration() { return engine.duration; }, get fps() { return engine.fps; },
    get audio() { return tl ? tl.audio || null : null; },
    get shots() { return engine.shots; },
    time: (a) => timeOf(tl, a),
  };
  return engine;
}

// ═══════════════════════════════════════ boot (index.html) ═══════════════════════════════════════
export async function boot({ canvas, errorEl } = {}) {
  const q = new URLSearchParams(location.search);
  const rel = (p) => (/^(\/|https?:)/.test(p) ? p : '/' + p);
  const renderMode = q.has('render');
  const showError = (msg) => {
    console.error(msg);
    window.__error = (window.__error ? window.__error + '\n' : '') + msg;
    if (errorEl && !renderMode) { errorEl.style.display = 'block'; errorEl.textContent = window.__error; }
  };
  window.addEventListener('error', (ev) => { if (ev && ev.message) showError(`${ev.message} (${(ev.filename || '').replace(location.origin, '')}:${ev.lineno || 0})`); });
  window.addEventListener('unhandledrejection', (ev) => showError(`unhandled: ${ev.reason && ev.reason.message ? ev.reason.message : ev.reason}`));
  let engine;
  try { engine = createEngine({
    canvas,
    timelineUrl: rel(q.get('timeline') || 'audio/timeline.json'),
    shotsModule: rel(q.get('shotsModule') || q.get('shots') || '/src/shots.js'),
    scale: q.has('scale') ? +q.get('scale') : 0.6667,
    antialias: q.get('aa') !== '0',
    debug: q.has('debug'),
    resetEveryFrame: q.get('reset') === 'frame',
    composite: q.get('composite') || undefined,
    smoothing: q.get('smooth') || undefined,
    onError: renderMode ? null : (msg) => { if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = msg; } },
  }); } catch (e) { showError(`ENGINE ERROR (WebGL?): ${e.message || e}`); window.__ready = true; return null; }
  window.__engine = engine.api;
  window.__engineInternal = engine;
  try { await engine.ready; } catch (e) {
    showError(`ENGINE ERROR: ${e.message || e}`);
    window.__ready = true;
    return engine;
  }
  const t0 = q.has('t') ? +q.get('t') : 0;
  try { await engine.renderAt(t0); } catch (e) { showError(`render error @${t0}: ${e.message}`); }
  window.__ready = true;
  if (q.has('ui')) mountPlayer(engine, t0, rel);
  return engine;
}

// Minimal preview player (only with ?ui=1): wall-clock only chooses WHICH t to render.
function mountPlayer(engine, t0, rel) {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;display:flex;gap:8px;align-items:center;padding:8px 12px;background:rgba(0,0,0,.7);color:#fff;font:14px system-ui;z-index:10';
  bar.innerHTML = '<button id="pp" style="font:inherit;padding:4px 10px">▶</button><input id="sc" type="range" min="0" step="0.001" style="flex:1"><span id="tm" style="min-width:210px;font-variant-numeric:tabular-nums"></span>';
  document.body.appendChild(bar);
  const pp = bar.querySelector('#pp'), sc = bar.querySelector('#sc'), tm = bar.querySelector('#tm');
  sc.max = engine.duration; sc.value = t0;
  const audio = engine.timeline.audio ? new Audio(rel(engine.timeline.audio)) : null;
  let playing = false, t = t0, wall0 = 0, tStart = 0, busy = false;
  const label = () => { const s = engine.shotAt(t); tm.textContent = `${t.toFixed(2)}s / ${engine.duration.toFixed(1)}  ${s ? s.name : ''}`; };
  const draw = async () => { if (busy) return; busy = true; try { await engine.renderAt(t); } finally { busy = false; } label(); };
  label();
  sc.oninput = () => { t = +sc.value; if (playing) { tStart = t; wall0 = performance.now(); if (audio) audio.currentTime = t; } draw(); };
  pp.onclick = () => {
    playing = !playing; pp.textContent = playing ? '❚❚' : '▶';
    if (playing) { tStart = t; wall0 = performance.now(); if (audio) { audio.currentTime = t; audio.play().catch(() => {}); } loop(); }
    else if (audio) audio.pause();
  };
  async function loop() {
    if (!playing) return;
    t = tStart + (performance.now() - wall0) / 1000;
    if (t >= engine.duration) { t = engine.duration - 1e-3; playing = false; pp.textContent = '▶'; if (audio) audio.pause(); }
    sc.value = t; await draw();
    requestAnimationFrame(loop);
  }
}
