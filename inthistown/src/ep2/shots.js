// In This Town — Episode 2: "Bingo".  Grandad's story (narrated in the young voice; tags sell the joke).
// Film contract: SPEC.md §8.  Timeline: episodes/ep2/timeline.json (built by audio/build_episode.py ep2).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, extraSpecs } from '../cast.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, lerp, ease, hash, rng } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import {
  init as initEp1, V, TABLE_TOP, headPos, frame, frameAt, roomNook, nookCams, burstAt, lastBefore, boomCam, memeText,
  gagTPose, quietTown,
} from '../shots.js';
import { makeDabber, makeBingoCard, makeCardGrid, makeCardStack, makeInkDot, makeBingoCage, makeMicStand, makeDJDecks,
  makeSpoon, makeFork, makeTopHatProp, makeToupee, makeHearingAid, CARD_THICKNESS, TOPHAT_MATCH_SCALE } from './props2.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
function seniorSpecs(n, seed = 7) {
  const base = extraSpecs(n, seed);
  const r = rng(seed + 5);
  const out = {};
  Object.values(base).forEach((s, i) => {
    const id = `s${String(i).padStart(2, '0')}`;
    const acc = [];
    if (r() < 0.45) acc.push('glasses');
    if (r() < 0.25) acc.push(r() < 0.5 ? 'mustache' : 'beard');
    out[id] = { ...s, id, hair: { style: r() < 0.3 ? 'bald' : 'grandpa', color: r() < 0.5 ? '#e8e8e8' : '#cfcfcf' },
      top: { ...s.top, style: r() < 0.35 ? 'dress' : 'cardigan' }, bottom: { ...s.bottom, style: s.top.style === 'dress' ? 'skirt' : 'pants' },
      accessories: acc, scale: 0.9 + r() * 0.08 };
    if (out[id].top.style === 'dress') out[id].bottom.style = 'skirt';
  });
  // Gerald (91), DJ name: Hip Replacement
  out.s05 = { ...out.s05, hair: { style: 'bald', color: '#e8e8e8' }, top: { style: 'cardigan', color: '#3ee0c8', accent: '#ffffff' }, bottom: { style: 'pants', color: '#2f4d8a' },
    accessories: ['beard', 'sunglasses', 'headphones'], scale: 0.92 };
  // the granny who crowd-surfs
  out.s09 = { ...out.s09, hair: { style: 'bun', color: '#e8e8e8' }, top: { style: 'dress', color: '#ff4fa3', accent: '#ffd23f' }, bottom: { style: 'skirt', color: '#ff4fa3' },
    accessories: ['glasses'], scale: 0.9 };
  return out;
}
const SENIORS = seniorSpecs(18);
const SIDS = Object.keys(SENIORS);
export const cast = {
  grandad: MAIN.grandad, mayor: MAIN.mayor, heckler: MAIN.heckler, pigeon: MAIN.pigeon, cat: MAIN.cat,
  mayorBald: { ...MAIN.mayor, id: 'mayorBald', hair: { style: 'bald', color: MAIN.mayor.skin }, accessories: ['sash', 'mustache', 'bowtie'] },
  ...SENIORS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 3, banner: ['SUMMER PARTY', 'BINGO', 'FINAL'] }),
  room: () => buildRoom({ variant: 'grandad', window: 'party' }),
};

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.dabber = makeDabber({ length: 0.25 });
  P.card = makeBingoCard({ seed: 3 });
  P.grid = makeCardGrid({ rows: 8, cols: 10, size: 0.1 });
  P.stack = makeCardStack({ height: 0.35 });
  P.cage = makeBingoCage({ pedestal: 0.62 });
  P.mic = makeMicStand();
  P.decks = makeDJDecks();
  P.spoon = makeSpoon(); P.fork = makeFork();
  P.hat = makeTopHatProp({ scale: TOPHAT_MATCH_SCALE * 1.05 }); P.toupee = makeToupee();
  P.aid = makeHearingAid();
  P.dots = Array.from({ length: 40 }, (_, i) => makeInkDot({ r: 0.028 + hash(i) * 0.02 }));
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
/** Small on-screen label ("ME (74)") that pops in at t0, optional t1. */
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0;
  if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.3, size: 74, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.78)', rot: -0.04, ...o, scale: Math.max(0.01, pop) });
}

/** Grandad holding the dabber in his right hand (tip down), ready to slam. */
function holdDabber(ctx, who = 'grandad') {
  const d = ctx.props.dabber, ch = ctx.cast[who];
  ctx.add(d, ch.joints.handR);
  d.position.set(0, -0.2, 0.0); d.rotation.set(0, 0, 0);   // tip pokes 0.13 below the fist, along the forearm
  return d;
}

/** Grandad's room "bingo nook": table + chair in the middle of the room, a bingo card on the table. */
function bingoNook(ctx, { lighting = 'night', window = 'party', card = true, stack = 0 } = {}) {
  const st = roomNook(ctx, 'grandad', { board: false, clock: false, lighting });
  ctx.set.set?.('window', window);
  st.cams = nookCams(st.F);
  const { F } = st;
  if (card) { const c = ctx.props.card; ctx.add(c.root); c.root.position.copy(F(0, TABLE_TOP + CARD_THICKNESS, 0.55)); c.root.rotation.set(0, st.F.yaw, 0); c.setDots(0); }
  if (stack) { const s = ctx.props.stack; ctx.add(s.root); s.root.position.copy(F(-0.33, TABLE_TOP, 0.65)); s.root.rotation.set(0, F.yaw + 0.1, 0); s.setHeight(stack); }
  holdDabber(ctx);
  return st;
}

/** Stick ink dots onto an object's actual surface: rays from its front/top/sides hit its meshes (deterministic). */
function dotify(ctx, obj, count, seed = 1, { faces = ['front', 'front', 'top', 'left', 'right'], scale = 1 } = {}) {
  obj.updateMatrixWorld(true);
  const meshes = [];
  obj.traverse((o) => { if (o.isMesh && o.visible && !ctx.props.dots.includes(o)) meshes.push(o); });
  const inv = obj.matrixWorld.clone().invert();
  const box = new THREE.Box3();
  for (const m of meshes) { m.geometry.computeBoundingBox?.(); const bb = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld).applyMatrix4(inv); box.union(bb); }
  const r = rng(seed), ray = new THREE.Raycaster();
  let placed = 0;
  for (let i = 0; i < count * 4 && placed < count; i++) {
    const face = faces[i % faces.length];
    const u = 0.1 + r() * 0.8, v = 0.1 + r() * 0.8;
    const o = new THREE.Vector3(), d = new THREE.Vector3();
    if (face === 'front') { o.set(lerp(box.min.x, box.max.x, u), lerp(box.min.y, box.max.y, v), box.max.z + 1); d.set(0, 0, -1); }
    if (face === 'top') { o.set(lerp(box.min.x, box.max.x, u), box.max.y + 1, lerp(box.min.z, box.max.z, v)); d.set(0, -1, 0); }
    if (face === 'left') { o.set(box.max.x + 1, lerp(box.min.y, box.max.y, v), lerp(box.min.z, box.max.z, u)); d.set(-1, 0, 0); }
    if (face === 'right') { o.set(box.min.x - 1, lerp(box.min.y, box.max.y, v), lerp(box.min.z, box.max.z, u)); d.set(1, 0, 0); }
    ray.set(o.applyMatrix4(obj.matrixWorld), d.transformDirection(obj.matrixWorld));
    const hit = ray.intersectObjects(meshes, false)[0];
    if (!hit || !hit.face) continue;
    const dot = ctx.props.dots[(seed * 7 + placed) % ctx.props.dots.length];
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).transformDirection(inv);
    ctx.add(dot, obj);
    dot.position.copy(hit.point.clone().applyMatrix4(inv)).addScaledVector(n, 0.003);
    dot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    if (!dot.userData.baseScale) dot.userData.baseScale = dot.scale.clone();
    dot.scale.copy(dot.userData.baseScale).multiplyScalar(scale);
    placed++;
  }
}

function seniorParty(ctx, ids, anchor, o = {}) {
  ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', o.fireworks ?? true); ctx.set.set?.('foam', o.foam ?? 0);
  const crowd = crowdGrid(ctx, ids, anchor, { cols: o.cols || 6, dx: 1.25, dz: 1.3, seed: o.seed || 2, hats: true, offset: o.offset || [0, 0, 0], rowDir: o.rowDir || 1 });
  return crowd;
}

function squareSeniors(ctx) {
  ctx.set.setLighting?.('dusk'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('standsCrowd', true); ctx.set.set?.('crowdMotion', 1);
  const crowd = [];
  const fill = (rows, ids, k0) => {
    if (!Array.isArray(rows)) return;
    let k = 0;
    rows.forEach((row) => {
      const w = row.userData?.width || 7.2, per = 7;
      for (let j = 0; j < per && k < ids.length; j++, k++) {
        const id = ids[k];
        ctx.place(id, row, { offset: [(j - (per - 1) / 2) * (w / per) + (hash(k + k0) - 0.5) * 0.2, 0, 0] });
        ctx.cast[id].setAccessory?.('partyHat', true);
        crowd.push({ ch: ctx.cast[id], phase: hash(k * 3.1 + k0) * 3, k: k + k0 });
      }
    });
  };
  fill(ctx.anchor('square.standA.rows'), ['heckler', ...SIDS.slice(0, 11)], 0);
  fill(ctx.anchor('square.standB.rows'), SIDS.slice(11, 18), 50);
  const ca = ctx.anchor('square.chairA'), cb = ctx.anchor('square.chairB'), tbl = ctx.anchor('square.table');
  const st = { crowd, FA: frame(rel(ca), yawOf(ca)), FB: frame(rel(cb), yawOf(cb)), FT: frame(rel(tbl), yawOf(ca)) };
  st.stage = ctx.anchor('square.stage') ? frame(rel(ctx.anchor('square.stage')), yawOf(ca)) : st.FT;
  return st;
}

function crowdAnim(ctx, crowd, mode = 'cheer', t = ctx.t) {
  for (const c of crowd) {
    const a = mode === 'mixed' ? (c.k % 2 ? 'cheer' : 'clap') : mode;
    c.ch.pose(a, t + c.phase, mode === 'stunned' ? { intensity: 0 } : {});
    c.ch.face(mode === 'laugh' ? 'laugh' : mode === 'stunned' ? 'shocked' : (c.k % 3 ? 'grin' : 'laugh'), t + c.phase);
  }
}

/** Bingo final staging: grandad at chair A behind the 80-card grid, mayor at the mic by the cage. */
function finalStage(ctx, { mayorAt = 'mic', bald = false } = {}) {
  const st = squareSeniors(ctx);
  const P = ctx.props;
  ctx.place('grandad', ctx.anchor('square.chairA'));
  holdDabber(ctx);
  ctx.add(P.grid.root); P.grid.root.position.copy(st.FT(0, CARD_THICKNESS, 0)); P.grid.root.rotation.set(0, st.FT.yaw, 0); P.grid.setProgress(0);
  // cage + mic on the stage beside the table (opponent side)
  ctx.add(P.cage.root); P.cage.root.position.copy(st.FT(1.3, -TABLE_TOP, 0.9)); P.cage.root.rotation.set(0, st.FT.yaw + Math.PI, 0);
  ctx.add(P.mic); P.mic.position.copy(st.FT(0.75, -TABLE_TOP, 1.15)); P.mic.rotation.set(0, st.FT.yaw + Math.PI, 0);
  const m = bald ? 'mayorBald' : 'mayor';
  if (mayorAt === 'mic') { ctx.place(m, st.FT(0.75, -TABLE_TOP, 1.5)); ctx.cast[m].root.rotation.set(0, st.FT.yaw + Math.PI, 0); }
  if (mayorAt === 'table') { ctx.place(m, st.FT(0.95, -TABLE_TOP, 0.1)); ctx.cast[m].root.rotation.set(0, st.FT.yaw - Math.PI / 2, 0); }
  // pigeon (in its party hat) on the end of the table
  ctx.place('pigeon', st.FT(-0.62, 0, 0.35)); ctx.cast.pigeon.root.rotation.set(0, st.FT.yaw + Math.PI * 0.75, 0); ctx.cast.pigeon.setAccessory?.('partyHat', true);
  st.mayor = ctx.cast[m];
  return st;
}

function finalAnim(ctx, st, { crowd = 'mixed', grid = null } = {}) {
  crowdAnim(ctx, st.crowd, crowd);
  ctx.props.cage.update(ctx.t);
  if (grid != null) ctx.props.grid.setProgress(grid);
  ctx.cast.pigeon.pose('idle', ctx.t); ctx.cast.pigeon.face('smug', ctx.t);
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody my age goes out partying."  AVERAGE AGE: 81
  {
    name: 'senior party crane', start: 0, set: 'town',
    setup(ctx) {
      const crowd = seniorParty(ctx, SIDS.filter((id) => id !== 's09'), 'street.crowdA');
      const F = frameAt(ctx, 'street.crowdA');
      ctx.place('s09', F(0, 2.2, 3)); ctx.cast.s09.setAccessory?.('partyHat', true);
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh');
      const d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store = { crowd, F, from: { pos: hi, look: c.clone().add(V(0, 0.5, 0)), fov: 50 }, to: { pos: c.clone().addScaledVector(d, 9).add(V(0, 3.2, 0)), look: ctx.point('street.crowdA').add(V(0, 1.4, 0)), fov: 42 } };
    },
    update(ctx, lt, u) {
      animateCrowd(ctx.store.crowd, ctx.t);
      const g = ctx.cast.s09, F = ctx.store.F;   // granny crowd-surfing across the back
      g.root.position.copy(F(lerp(-4, 4, u), 2.25 + Math.sin(ctx.t * 9) * 0.06, 2.6)); g.root.rotation.set(0, F.yaw - Math.PI / 2, 0);
      g.pose('crowdSurf', ctx.t); g.face('laugh', ctx.t);
      ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic);
      tag(ctx, 'AVERAGE AGE: 81', ctx.markers.tagAge, Infinity, { y: 0.24 });
    },
  },
  // ── b02 "Except me."  — outside the lit window, then inside: ME (74)
  {
    name: 'window push', start: 'b02-0.1', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true);
      ctx.store = { W: frameAt(ctx, 'myHouse.window') };
    },
    update(ctx, lt, u) {
      const W = ctx.store.W;
      ctx.cam.move({ pos: W(0, -0.6, 4.5), look: W(0, 0, 0), fov: 40 }, { pos: W(0, -0.1, 1.6), look: W(0, 0, 0), fov: 36 }, ease.inQuad(u));
    },
  },
  {
    name: 'ME (74)', start: 'b02.w1-0.05', set: 'room',
    setup(ctx) { ctx.store = bingoNook(ctx); },
    update(ctx, lt, u) {
      const { cams, F } = ctx.store; const g = ctx.cast.grandad;
      g.pose('sitIdle', ctx.t, { headYaw: 0.25 * ease.outQuad(clamp(lt / 0.3, 0, 1)) }); g.face('neutral', ctx.t);
      ctx.cam.set(cams.med);
      tag(ctx, 'ME (74)', ctx.markers.tagMe, Infinity, { x: 0.68, y: 0.3 });
    },
  },
  // ── b03 HUSS ×6 — the dabber, one cut per hit, ink dots appear on the card
  ...['board', 'face', 'boardLow', 'med', 'faceL', 'board'].map((camName, i) => ({
    name: `dabber huss #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = bingoNook(ctx); },
    update(ctx) {
      const { cams, F } = ctx.store; const g = ctx.cast.grandad;
      const hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      g.pose('sitSlam', ctx.t, { hits, tableY: TABLE_TOP + 0.13, slamZ: 0.55, slamX: -0.0 });
      const hit = lastBefore(hits, ctx.t);
      g.face(hit != null && ctx.t - hit < 0.18 ? 'huss' : 'determined', ctx.t);
      ctx.props.card.setDots(Math.min(25, hits.filter((h) => h <= ctx.t).length * 4));
      if (hit != null) burstAt(ctx, F(0, TABLE_TOP + 0.01, 0.55), ctx.t, hit);
      ctx.cam.set(cams[camName]); ctx.cam.shake(0.08, ctx.t, i); ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
      if (i < 2) tag(ctx, 'BINGO DABBER', ctx.time('b03.h0'), Infinity, { y: 0.24 });
    },
  })),
  // ── b04 "Gerald's ninety-one. DJ name: Hip Replacement."
  {
    name: 'DJ Hip Replacement', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      const crowd = seniorParty(ctx, SIDS.filter((id) => !['s05', 's09'].includes(id)).slice(0, 10), 'foam.center', { cols: 4, foam: 0.6, fireworks: false, offset: [0, 0, -0.8], rowDir: -1 });
      const c = ctx.point('foam.center'), cam = ctx.point('foam.cam');
      const fwd = V().subVectors(c, cam).setY(0).normalize(), left = V(fwd.z, 0, -fwd.x);
      const deck = c.clone().addScaledVector(fwd, -1.6);
      const P = ctx.props; ctx.add(P.decks.root); P.decks.root.position.copy(deck); P.decks.root.rotation.set(0, Math.atan2(-fwd.x, -fwd.z), 0);
      ctx.place('s05', deck.clone().addScaledVector(fwd, 0.55)); ctx.cast.s05.root.rotation.set(0, Math.atan2(-fwd.x, -fwd.z), 0);
      ctx.store = { crowd, c, cam, fwd, deck };
    },
    update(ctx, lt, u) {
      const { crowd, c, cam, deck } = ctx.store;
      animateCrowd(crowd, ctx.t, { action: 'cheer', faces: ['laugh', 'grin'] });
      ctx.props.decks.update(ctx.t);
      const gd = ctx.cast.s05; gd.pose('dance2', ctx.t, { speed: 1.2, intensity: 1 }); gd.face('grin', ctx.t);
      const look = deck.clone().addScaledVector(ctx.store.fwd, 0.5).add(V(0, 1.35, 0));
      ctx.cam.move({ pos: deck.clone().addScaledVector(ctx.store.fwd, -3.4).add(V(0, 1.75, 0)), look, fov: 44 }, { pos: deck.clone().addScaledVector(ctx.store.fwd, -2.7).add(V(0, 1.65, 0)), look, fov: 42 }, u, ease.inOutQuad);
      tag(ctx, 'DJ HIP REPLACEMENT (91)', ctx.markers.tagDJ, Infinity, { y: 0.22, size: 66 });
    },
  },
  // ── b05 "While they're out partying, by the way, I train for bingo."
  {
    name: 'by the way', start: 'b05-0.1', set: 'room',
    setup(ctx) { ctx.store = bingoNook(ctx, { stack: 0.4 }); },
    update(ctx, lt, u) {
      const { cams, F } = ctx.store; const g = ctx.cast.grandad;
      g.pose('sitIdle', ctx.t, { hands: 'table' }); g.face('determined', ctx.t);
      ctx.cam.move(cams.wide, cams.med, u, ease.inOutQuad);
    },
  },
  // ── b06 quote: "A spoon is just a bowl that believes in itself." — a fork, jealous
  {
    name: 'spoon and fork', start: 'b06-0.1', set: 'room', captions: true,
    setup(ctx) {
      const st = bingoNook(ctx, { card: false });
      const P = ctx.props, F = st.F;
      ctx.add(P.spoon); P.spoon.position.copy(F(-0.06, TABLE_TOP, 0.55)); P.spoon.rotation.set(0, F.yaw, 0);
      ctx.add(P.fork); P.fork.position.copy(F(0.08, TABLE_TOP, 0.55)); P.fork.rotation.set(0, F.yaw, 0);
      ctx.cast.grandad.root.visible = false;
      ctx.store = st;
    },
    update(ctx, lt, u) {
      const F = ctx.store.F, P = ctx.props;
      P.fork.rotation.set(0, F.yaw, -0.35 * ease.inOutQuad(clamp(lt / 2.5, 0, 1)));
      ctx.cam.set({ pos: F(0.0, TABLE_TOP + 0.16, 1.1), look: F(0.01, TABLE_TOP + 0.1, 0.55), fov: 30 });
      quoteCard(ctx, 'A spoon is just a bowl that believes in itself.', 'a fork, jealous', ctx.markers.quote1, ctx.markers.quote1end);
    },
  },
  // ── b07 "I count to ninety. In random order."  5:00 AM
  {
    name: 'counting', start: 'b07-0.1', set: 'room',
    setup(ctx) { ctx.store = bingoNook(ctx, { lighting: 'dawn', window: 'sunrise' }); },
    update(ctx, lt, u) {
      const { cams } = ctx.store; const g = ctx.cast.grandad;
      g.pose('think', ctx.t, { seated: true }); g.face('sleepy', ctx.t);
      ctx.cam.move(cams.med, cams.face, u, ease.inOutSine);
      const nums = [47, 3, 88, 12, 61, 29, 90, 7];
      nums.forEach((n, k) => {
        const t0 = ctx.time('b07') + 0.25 + k * 0.26;
        const d = ctx.t - t0;
        if (d > 0 && d < 0.9) ctx.fx.text(String(n), { x: 0.2 + 0.6 * hash(k + 3), y: 0.15 + 0.3 * hash(k + 9), size: 110, fill: '#ffe14a', alpha: clamp(Math.min(d / 0.1, (0.9 - d) / 0.2), 0, 1), rot: (hash(k) - 0.5) * 0.5, scale: 0.8 + d * 0.3 });
      });
      tag(ctx, '5:00 AM', ctx.markers.tag5am, Infinity, { y: 0.08, size: 64 });
    },
  },
  // ── b08 HUSS ×3 montage: slam · stack taller than him · pigeon salutes at the window
  ...[0, 1, 2].map((i) => ({
    name: `montage huss #${i + 1}`, start: i === 0 ? 'b08.h0-0.12' : `b08.h${i}-0.03`, set: 'room',
    setup(ctx) {
      ctx.store = bingoNook(ctx, { stack: i === 1 ? 1.75 : 0.4, lighting: i === 1 ? 'day' : 'night', window: i === 1 ? 'day' : 'party' });
      if (i === 2) {
        const w = ctx.anchor('room.window');
        ctx.place('pigeon', w, { offset: [0, -0.62, 0.16] }); ctx.cast.pigeon.setAccessory?.('partyHat', true);
      }
    },
    update(ctx) {
      const { cams, F } = ctx.store; const g = ctx.cast.grandad;
      const hits = ctx.hussTimes('b08').map((h) => h + 0.03);
      g.pose('sitSlam', ctx.t, { hits, tableY: TABLE_TOP + 0.13, slamZ: 0.55 });
      const hit = lastBefore(hits, ctx.t);
      g.face(i === 1 ? 'sweat' : (hit != null && ctx.t - hit < 0.18 ? 'huss' : 'determined'), ctx.t);
      ctx.props.card.setDots(Math.min(25, 8 + hits.filter((h) => h <= ctx.t).length * 5));
      if (hit != null) burstAt(ctx, F(0, TABLE_TOP + 0.01, 0.55), ctx.t, hit);
      if (i === 0) ctx.cam.set(cams.face);
      if (i === 1) ctx.cam.set({ pos: F(0.9, 1.5, 3.0), look: F(-0.15, 1.0, 0.4), fov: 42 });
      if (i === 2) {
        const pg = ctx.cast.pigeon; pg.pose('flap', 0.18); pg.face('determined', ctx.t);
        const pp = pg.root.position.clone().add(V(0, 0.22, 0));
        ctx.cam.set({ pos: pp.clone().addScaledVector(ctx.store.F.fwd, 1.1).add(V(0.15, 0.05, 0)), look: pp, fov: 34 });
      }
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2); ctx.cam.shake(0.08, ctx.t, 30 + i);
    },
  })),
  // ── b09/b10 "The cat napped on my card. He's a Dalmatian now."  — cat: "Hiss."
  {
    name: 'dalmatian cat', start: 'b09-0.1', set: 'room',
    setup(ctx) {
      const st = bingoNook(ctx);
      ctx.cast.grandad.root.visible = false;
      const F = st.F;
      ctx.place('cat', F(0, TABLE_TOP + 0.005, 0.55)); ctx.cast.cat.root.rotation.set(0, F.yaw, 0);
      ctx.cast.cat.pose('stare', 0); ctx.cast.cat.face('stare', 0);
      dotify(ctx, ctx.cast.cat.root, 36, 4, { scale: 0.42 });
      ctx.props.card.setAllDotted(true);
      ctx.store = st;
    },
    update(ctx, lt, u) {
      const F = ctx.store.F, cat = ctx.cast.cat;
      const hiss = ctx.markers.hissCat;
      cat.pose(ctx.t < hiss ? 'stare' : 'stare', ctx.t); cat.face(ctx.t > hiss && ctx.t < hiss + 0.9 ? 'shocked' : 'stare', ctx.t);
      ctx.cam.set({ pos: F(0, TABLE_TOP + 0.45, 2.25), look: F(0, TABLE_TOP + 0.27, 0.55), fov: 32 });
      tag(ctx, 'DALMATIAN (now)', ctx.markers.dalmatian, Infinity, { y: 0.24 });
    },
  },
  // ── b11 quote: "Never trust a pigeon in a hat." — a pigeon in a hat
  {
    name: 'pigeon in a hat', start: 'b11-0.1', set: 'room',
    setup(ctx) {
      const st = bingoNook(ctx); ctx.cast.grandad.root.visible = false;
      const w = ctx.anchor('room.window');
      ctx.place('pigeon', w, { offset: [0, -0.62, 0.16] }); ctx.cast.pigeon.setAccessory?.('partyHat', true);
      ctx.store = st;
    },
    update(ctx, lt) {
      const pg = ctx.cast.pigeon; pg.pose('idle', ctx.t, { headYaw: Math.sin(lt * 1.2) * 0.3 }); pg.face('smug', ctx.t);
      const pp = pg.root.position.clone().add(V(0, 0.22, 0));
      ctx.cam.move({ pos: pp.clone().addScaledVector(ctx.store.F.fwd, 1.5).add(V(0, 0.1, 0)), look: pp, fov: 36 }, { pos: pp.clone().addScaledVector(ctx.store.F.fwd, 1.1).add(V(0, 0.08, 0)), look: pp, fov: 34 }, clamp(lt / 3, 0, 1));
      quoteCard(ctx, 'Never trust a pigeon in a hat.', 'a pigeon in a hat', ctx.markers.quote2, ctx.markers.quote2end, { y: 0.3 });
    },
  },
  // ── b12 "Then came the Bingo Final."  WEDNESDAY
  {
    name: 'bingo final establishing', start: 'b12-0.1', set: 'town',
    setup(ctx) {
      ctx.store = finalStage(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 26).add(V(0, 12, 0)), look: c.clone().add(V(0, 2, 0)), fov: 44 };
      ctx.store.to = { pos: cam, look: c.clone().add(V(0, 2.4, 0)), fov: 48 };
    },
    update(ctx, lt, u) {
      finalAnim(ctx, ctx.store);
      ctx.cast.grandad.pose('sitIdle', ctx.t); ctx.cast.grandad.face('determined', ctx.t);
      ctx.store.mayor.pose('idle', ctx.t); ctx.store.mayor.face('smug', ctx.t);
      ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic);
      tag(ctx, 'WEDNESDAY', ctx.markers.wednesday, Infinity, { y: 0.1, size: 70 });
    },
  },
  // ── b13 "Eighty cards. Even the pigeon laughed."
  {
    name: '80 cards', start: 'b13-0.1', set: 'town',
    setup(ctx) { ctx.store = finalStage(ctx); },
    update(ctx, lt, u) {
      const st = ctx.store;
      finalAnim(ctx, st, { crowd: 'laugh' });
      const g = ctx.cast.grandad; g.pose('sitIdle', ctx.t, { hands: 'table' }); g.face('determined', ctx.t);
      st.mayor.pose('pointLaugh', ctx.t); st.mayor.face('laugh', ctx.t);
      const tp = ctx.markers.pigeonLaugh;
      if (ctx.t < tp) {
        ctx.cam.move({ pos: st.FT(2.1, 1.9, -0.4), look: st.FT(0, 0.1, 0), fov: 44 }, { pos: st.FT(1.8, 1.7, -0.3), look: st.FT(0, 0.1, 0), fov: 42 }, ctx.progress('b13', tp));
        tag(ctx, '80 CARDS', ctx.markers.cards80, tp, { y: 0.22 });
      } else {
        const pg = ctx.cast.pigeon; pg.pose('flap', ctx.t * 2); pg.face('laugh', ctx.t);
        const pp = pg.root.position.clone().add(V(0, 0.22, 0));
        ctx.cam.set({ pos: pp.clone().addScaledVector(st.FT.fwd, -1.3).addScaledVector(st.FT.left, -0.7).add(V(0, 0.2, 0)), look: pp, fov: 38 });
        ctx.cam.shake(0.1, ctx.t, 41);
      }
    },
  },
  // ── b14 mayor: "First number..."
  {
    name: 'first number', start: 'b14-0.1', set: 'town',
    setup(ctx) { ctx.store = finalStage(ctx); },
    update(ctx, lt, u) {
      const st = ctx.store, m = st.mayor;
      finalAnim(ctx, st);
      m.pose('point', ctx.t); m.face('smug', ctx.t);
      ctx.cast.grandad.pose('sitIdle', ctx.t); ctx.cast.grandad.face('determined', ctx.t);
      const hp = headPos(m, 0.3);
      ctx.cam.move({ pos: st.FT(-0.8, 1.9, -0.6), look: hp, fov: 38 }, { pos: st.FT(-0.6, 1.95, -0.2), look: hp, fov: 34 }, u);
    },
  },
  // ── b15 HUSS ×6: cards · table + pigeon · the mayor's face (we stay behind his head)
  ...[0, 2, 4].map((hi, i) => ({
    name: `final huss #${i + 1}`, start: i === 0 ? 'b15.h0-0.12' : `b15.h${hi}-0.03`, set: 'town',
    setup(ctx) {
      ctx.store = finalStage(ctx, { mayorAt: i === 2 ? 'table' : 'mic' });
    },
    update(ctx) {
      const st = ctx.store, g = ctx.cast.grandad, P = ctx.props;
      const hits = ctx.hussTimes('b15').map((h) => h + 0.03);
      const n = hits.filter((h) => h <= ctx.t).length;
      finalAnim(ctx, st, { crowd: 'stunned', grid: Math.min(1, n / 2) });
      g.pose('sitSlam', ctx.t, { hits, tableY: TABLE_TOP + 0.13, slamZ: i === 2 ? 0.75 : 0.55 });
      const hit = lastBefore(hits, ctx.t);
      g.face(hit != null && ctx.t - hit < 0.16 ? 'huss' : 'determined', ctx.t);
      if (hit != null) burstAt(ctx, st.FT(0, 0.01, i === 2 ? 0.15 : 0), ctx.t, hit);
      ctx.cam.punch(hits, ctx.t, 0.12, 0.18); ctx.cam.shake(0.12, ctx.t, 50 + i);
      if (i === 0) ctx.cam.set({ pos: st.FT(1.05, 0.62, -0.15), look: st.FT(-0.1, 0.02, 0.05), fov: 44 });
      if (i === 1) {
        if (n >= 4) { const d = P.dots[39]; ctx.add(d, ctx.cast.pigeon.root); d.position.set(0, 0.24, 0.12); d.rotation.set(Math.PI / 2, 0, 0); }
        const pg = ctx.cast.pigeon; pg.face(n >= 4 ? 'shocked' : 'smug', ctx.t);
        ctx.cam.set({ pos: st.FT(-1.25, 0.7, -0.05), look: st.FT(-0.45, 0.12, 0.25), fov: 40 });
      }
      if (i === 2) {
        const m = st.mayor; m.pose('peer', ctx.t); m.face('shocked', ctx.t);
        ctx.cam.set({ pos: st.FT(-1.7, 1.45, -1.3), look: st.FT(0.45, 0.45, 0.0), fov: 40 });
      }
    },
  })),
  // ── b16 "Eighty bingos. Zero numbers."  (music cuts; counter)
  {
    name: 'zero numbers', start: 'b16-0.1', set: 'town',
    setup(ctx) { ctx.store = finalStage(ctx); ctx.set.set?.('crowdMotion', 0); },
    update(ctx, lt, u) {
      const st = ctx.store;
      finalAnim(ctx, st, { crowd: 'stunned', grid: 1 });
      const g = ctx.cast.grandad; g.pose('sitIdle', ctx.t, { headYaw: 0.15 }); g.face('smug', ctx.t);
      st.mayor.pose('stunned', ctx.t); st.mayor.face('shocked', ctx.t);
      ctx.cam.move({ pos: st.FT(2.4, 2.7, -1.9), look: st.FT(0, 0.3, 0.2), fov: 44 }, { pos: st.FT(2.1, 2.5, -1.6), look: st.FT(0, 0.3, 0.2), fov: 42 }, u);
      ctx.fx.text('BINGOS: 80\nNUMBERS CALLED: 0', { y: 0.2, size: 84, fill: '#ffe14a', bg: 'rgba(20,20,30,0.75)', scale: Math.max(0.01, ease.outBack(clamp((ctx.t - ctx.markers.counter) / 0.2, 0, 1))) });
    },
  },
  // ── b17 quote: "Silence is applause on airplane mode." — my hearing aid → the crowd erupts
  {
    name: 'airplane mode', start: 'b17-0.1', set: 'town',
    setup(ctx) {
      ctx.store = finalStage(ctx);
      const g = ctx.cast.grandad, aid = ctx.props.aid;
      ctx.add(aid, g.joints.head); aid.position.set(0.378, 0.255, -0.02);
      const cf = ctx.props.confetti; ctx.add(cf.root); cf.root.position.copy(ctx.store.FT(0, 1.4, 0));
    },
    update(ctx, lt, u) {
      const st = ctx.store, tc = ctx.markers.cheer;
      finalAnim(ctx, st, { crowd: ctx.t < tc ? 'stunned' : 'cheer', grid: 1 });
      ctx.set.set?.('crowdMotion', ctx.t < tc ? 0 : 1);
      const g = ctx.cast.grandad; g.pose('think', ctx.t, { seated: true }); g.face(ctx.t < tc ? 'smug' : 'grin', ctx.t);
      st.mayor.pose('stunned', ctx.t); st.mayor.face('shocked', ctx.t);
      ctx.props.confetti.update(ctx.t - tc);
      const hp = headPos(g, 0.3);
      if (ctx.t < tc) ctx.cam.move({ pos: st.FA(0.7, 1.7, 1.6), look: hp, fov: 36 }, { pos: st.FA(0.6, 1.7, 1.35), look: hp, fov: 34 }, ctx.progress('b17', tc));
      else ctx.cam.set({ pos: st.FT(4.2, 2.6, -2.2), look: st.FT(0, 0.6, 0.4), fov: 50 });
      quoteCard(ctx, 'Silence is applause on airplane mode.', 'my hearing aid', ctx.markers.quote3, ctx.markers.quote3end, { y: 0.3 });
    },
  },
  // ── b18 "Top ten respectful moments. Number seven: the mayor removed his hat."
  {
    name: 'top 10 #7', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      ctx.store = finalStage(ctx);
      const m = ctx.store.mayor, hat = ctx.props.hat;
      ctx.add(hat, m.joints.handR); hat.position.set(0, -0.06, 0.08); hat.rotation.set(Math.PI / 2, 0, 0);
      ctx.store.hatOff = (off) => { m.setAccessory?.('topHat', !off); hat.visible = off; };
    },
    update(ctx, lt, u) {
      const st = ctx.store, m = st.mayor, t7 = ctx.markers.top7;
      finalAnim(ctx, st, { crowd: 'cheer', grid: 1 });
      ctx.cast.grandad.pose('sitIdle', ctx.t); ctx.cast.grandad.face('smug', ctx.t);
      const off = ctx.t > ctx.time('b18.w7');
      st.hatOff(off);
      m.pose(off ? 'wave' : 'idle', ctx.t); m.face(off ? 'sad' : 'neutral', ctx.t);
      const hp = headPos(m, 0.3);
      ctx.cam.move({ pos: st.FT(-1.4, 1.9, -0.9), look: hp.clone().add(V(0, -0.3, 0)), fov: 42 }, { pos: st.FT(-1.0, 1.9, -0.4), look: hp.clone().add(V(0, -0.2, 0)), fov: 38 }, u);
      top10Card(ctx, 7, t7);
    },
  },
  // ── b19 "Number one: his hair."
  {
    name: 'top 10 #1', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      ctx.store = finalStage(ctx, { bald: true });
      const m = ctx.store.mayor;
      ctx.add(ctx.props.toupee, m.joints.handR); ctx.props.toupee.position.set(0, -0.08, 0.06); ctx.props.toupee.rotation.set(Math.PI / 2, 0, 0);
      ctx.add(ctx.props.hat, m.joints.handL); ctx.props.hat.position.set(0, -0.06, 0.08); ctx.props.hat.rotation.set(Math.PI / 2, 0, 0);
    },
    update(ctx, lt, u) {
      const st = ctx.store, m = st.mayor;
      finalAnim(ctx, st, { crowd: 'stunned', grid: 1 });
      ctx.cast.grandad.pose('sitIdle', ctx.t); ctx.cast.grandad.face('shocked', ctx.t);
      m.pose('wave', ctx.t); m.face('sad', ctx.t);
      const hp = headPos(m, 0.3);
      ctx.cam.set({ pos: st.FT(-1.0, 1.9, -0.4), look: hp.clone().add(V(0, -0.1, 0)), fov: 36 });
      top10Card(ctx, 1, ctx.time('b19') - 0.5);
    },
  },
  // ── b20 "Banned for life."
  {
    name: 'banned', start: 'b20-0.1', set: 'town',
    setup(ctx) { ctx.store = finalStage(ctx, { bald: true }); },
    update(ctx, lt, u) {
      const st = ctx.store, pg = ctx.cast.pigeon;
      finalAnim(ctx, st, { crowd: 'stunned', grid: 1 });
      pg.pose('knock', ctx.t); pg.face('determined', ctx.t);
      const g = ctx.cast.grandad; g.pose('shrug', ctx.t, { seated: true }); g.face('sad', ctx.t);
      const pp = pg.root.position.clone().add(V(0, 0.22, 0));
      ctx.cam.set({ pos: pp.clone().addScaledVector(st.FT.fwd, -1.2).addScaledVector(st.FT.left, -0.5).add(V(0, 0.25, 0)), look: pp.clone().addScaledVector(st.FT.left, 0.25), fov: 40 });
      const d = ctx.t - ctx.markers.banned;
      if (d > 0) ctx.fx.text('BANNED\nFOR LIFE', { y: 0.24, size: 170, fill: '#ff2a2a', stroke: '#ffffff', line: 10, rot: -0.18, scale: d < 0.12 ? 1.8 - 0.8 * (d / 0.12) : 1, shadow: false });
    },
  },
  // ── b21/b22 "The mayor? Dalmatian now."  — mayor: "Hiss."  (same locked framing as the cat)
  {
    name: 'dalmatian mayor', start: 'b21-0.1', set: 'town',
    setup(ctx) {
      const st = finalStage(ctx, { mayorAt: 'table', bald: true });
      const m = st.mayor;
      m.pose('idle', 0); m.face('neutral', 0);
      const face = m.root.getObjectByName('face');
      const r = rng(9);
      for (let i = 0; i < 16; i++) {
        const d = ctx.props.dots[i];
        ctx.add(d, m.joints.head);
        if (i < 11) { d.position.set((r() - 0.5) * 0.5, (face ? face.position.y : 0.3) + (r() - 0.45) * 0.45, (face ? face.position.z : 0.31) + 0.006); d.rotation.set(Math.PI / 2, 0, 0); }
        else { d.position.set((r() - 0.5) * 0.45, (face ? face.position.y : 0.3) + 0.33, (r() - 0.5) * 0.4); d.rotation.set(0, 0, 0); }
      }
      ctx.store = st;
    },
    update(ctx, lt, u) {
      const st = ctx.store, m = st.mayor;
      finalAnim(ctx, st, { crowd: 'stunned', grid: 1 });
      m.pose('idle', ctx.t, { intensity: 0 }); m.face(ctx.t > ctx.markers.hissMayor && ctx.t < ctx.markers.hissMayor + 0.9 ? 'shocked' : 'neutral', ctx.t);
      const hp = headPos(m, 0.3);
      const fwd = V(Math.sin(m.root.rotation.y), 0, Math.cos(m.root.rotation.y));
      ctx.cam.set({ pos: hp.clone().addScaledVector(fwd, 1.9).add(V(0, 0.02, 0)), look: hp, fov: 30 });
      tag(ctx, 'DALMATIAN (now)', ctx.markers.dalmatianMayor, Infinity, { y: 0.16 });
    },
  },
  // ── b23 "Now I crowd-surf on Wednesdays."  /  b24 HUSS ×3 from the crowd
  {
    name: 'wednesday crowd surf', start: 'b23-0.1', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', true);
      const F = frameAt(ctx, 'street.crowdB');
      const crowd = [];
      SIDS.slice(0, 14).forEach((id, i) => {
        const row = i % 2, col = Math.floor(i / 2);
        ctx.place(id, F(-4.2 + col * 1.2, 0, row ? 0.55 : -0.55));
        ctx.cast[id].root.rotation.set(0, F.yaw + (hash(i) - 0.5) * 0.5, 0);
        ctx.cast[id].setAccessory?.('partyHat', true);
        crowd.push({ ch: ctx.cast[id], phase: hash(i) * 0.4, k: i });
      });
      ctx.place('grandad', F(0, 2.25, 0));
      ctx.store = { F, crowd };
    },
    update(ctx, lt, u) {
      const { F, crowd } = ctx.store;
      const hs = ctx.hussTimes('b24');
      animateCrowd(crowd, ctx.t, { action: 'cheer', faces: ['laugh', 'grin', 'shocked'] });
      const g = ctx.cast.grandad;
      const x = lerp(-4.2, 3.2, clamp(u * 1.15, 0, 1));
      g.root.position.copy(F(x, 2.25 + Math.sin(ctx.t * 9) * 0.06, 0)); g.root.rotation.set(0, F.yaw - Math.PI / 2, 0);
      g.pose('crowdSurf', ctx.t); g.face('laugh', ctx.t);
      ctx.cam.set({ pos: F(x * 0.85 - 1.0, 2.7, 7.6), look: F(x, 2.15, 0), fov: 46 });
      ctx.cam.punch(hs, ctx.t, 0.1, 0.22); ctx.cam.shake(0.12, ctx.t, 3);
      tag(ctx, 'WEDNESDAY', ctx.time('b23'), Infinity, { y: 0.12, size: 70 });
    },
  },
  // ── b25 "Bingo."  — a black ink dot grows from the centre to full screen
  {
    name: 'bingo', start: 'b25-0.1', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true);
      const F = frameAt(ctx, 'street.crowdB');
      const crowd = [];
      SIDS.slice(0, 14).forEach((id, i) => {
        const row = i % 2, col = Math.floor(i / 2);
        ctx.place(id, F(-4.2 + col * 1.2, 0, row ? 0.55 : -0.55));
        ctx.cast[id].root.rotation.set(0, F.yaw, 0); ctx.cast[id].setAccessory?.('partyHat', true);
        crowd.push({ ch: ctx.cast[id], phase: hash(i) * 0.4, k: i });
      });
      ctx.place('grandad', F(3.2, 2.25, 0));
      ctx.store = { F, crowd };
    },
    update(ctx, lt) {
      const { F, crowd } = ctx.store;
      animateCrowd(crowd, ctx.t, { action: 'cheer' });
      const g = ctx.cast.grandad; g.root.position.copy(F(3.2, 2.25, 0)); g.root.rotation.set(0, F.yaw - Math.PI / 2, 0);
      g.pose('crowdSurf', ctx.t); g.face('wink', ctx.t);
      const hp = headPos(g, 0);
      ctx.cam.set({ pos: hp.clone().add(V(0, 1.7, 0)).addScaledVector(F.fwd, 3.6), look: hp.clone().add(V(0, -0.3, 0)), fov: 40 });
      const d = ctx.t - ctx.markers.bingo - 0.35;
      if (d > 0) {
        const rr = Math.min(1, ease.inCubic(d / 0.6)) * 1300;
        ctx.fx.draw((g2, W, H) => { g2.fillStyle = '#0b0b0f'; g2.beginPath(); g2.arc(W / 2, H * 0.45, rr, 0, Math.PI * 2); g2.fill(); });
        ctx.caption.hide(rr > 400);
      }
    },
  },
];
