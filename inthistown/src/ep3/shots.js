// In This Town — Episode 3: "Don't Blink".  The chess kid hasn't blinked since March.
// Film contract: SPEC.md §8.  Timeline: episodes/ep3/timeline.json (audio/build_episode.py ep3).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, lerp, ease, hash } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { makeSweatDrop, makeTable } from '../props.js';
import {
  init as initEp1, V, TABLE_TOP, headPos, frame, frameAt, roomNook, nookCams, burstAt, lastBefore, boomCam, partyTown,
} from '../shots.js';
import { makeDJDecks } from '../ep2/props2.js';
import { makeToaster, makeCrack, makeTrophy, makePhotoCamera, makeCushions, makeTrafficCone, makeSign, makeBriefcase,
  makeSack, makePlinth } from './props3.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const STONE = '#9a9a9a';
export const cast = {
  me: MAIN.me, cat: MAIN.cat, mayor: MAIN.mayor, grandad: MAIN.grandad, pigeon: MAIN.pigeon,
  gerald: { id: 'gerald', skin: '#e9b99a', hair: { style: 'bald', color: '#e8e8e8' }, top: { style: 'cardigan', color: '#3ee0c8', accent: '#ffffff' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#4a3b2f', accessories: ['beard', 'sunglasses', 'headphones'], scale: 0.92 },
  lawyer: { id: 'lawyer', skin: '#e0ac69', hair: { style: 'short', color: '#cfcfcf' }, top: { style: 'suit', color: '#5a5f6b', accent: '#ffffff' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#111111', accessories: ['glasses', 'bowtie'], scale: 1.0 },
  burglar: { id: 'burglar', skin: '#c68642', hair: { style: 'short', color: '#111111' }, top: { style: 'tee', color: '#1d1d22', accent: '#ffffff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#111111', accessories: ['cap'], scale: 0.97 },
  meStone: { ...MAIN.me, id: 'meStone', skin: STONE, hair: { style: 'fade', color: '#7e7e7e' }, top: { style: 'hoodie', color: '#8a8a8a', accent: '#b0b0b0', emblem: 'knight' },
    bottom: { style: 'pants', color: '#858585' }, shoes: '#a0a0a0', accessories: ['headphones'] },
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 3, banner: ['SUMMER PARTY', 'STARING', 'CONTEST'] }),
  room: () => buildRoom({ variant: 'hero', poster: 'knight', window: 'party' }),
};

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.toaster = makeToaster();
  P.wallCrack = makeCrack({ w: 1.2, h: 1.0, seed: 3 });
  P.statueCrack = makeCrack({ w: 0.42, h: 0.42, seed: 8 });
  P.trophy = makeTrophy(); P.trophyStone = makeTrophy({ stone: true });
  P.photoCam = makePhotoCamera();
  P.cushions = makeCushions();
  P.cone = makeTrafficCone(); P.retireSign = makeSign({ lines: ['HAPPY', 'RETIREMENT'] });
  P.briefcase = makeBriefcase(); P.sack = makeSack();
  P.plinth = makePlinth({ plaque: 'NEVER BLINKED' });
  P.decks3 = makeDJDecks();
  P.drops = Array.from({ length: 9 }, () => makeSweatDrop({ size: 0.09 }));
  P.chip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.95 }));
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const OPEN = (ch) => 1.5 - (ch.blinkPhase || 0) + 31;          // a time when the eyes are open (never blinks)
const SHUT = (ch) => 3.1 - (ch.blinkPhase || 0) + 0.04 + 31;   // a time inside the blink window (eyes closed)

function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0;
  if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.3, size: 70, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.78)', rot: -0.04, ...o, scale: Math.max(0.01, pop) });
}
const daysTag = (ctx, n, t0) => tag(ctx, `DAYS SINCE\nLAST BLINK: ${n}`, t0, Infinity, { x: 0.3, y: 0.1, size: 54, fill: '#ffffff', bg: 'rgba(20,130,60,0.9)', rot: 0 });

/** The kid at the room nook with the toaster on the table. */
function kidNook(ctx, { lighting = 'night', window = 'party', toaster = true } = {}) {
  const st = roomNook(ctx, 'me', { board: false, clock: false, lighting });
  ctx.set.set?.('window', window);
  st.cams = nookCams(st.F);
  if (toaster) { const T = ctx.props.toaster; ctx.add(T.root); T.root.position.copy(st.F(0.05, TABLE_TOP, 0.62)); T.root.rotation.set(0, st.F.yaw + Math.PI, 0); T.toast.position.y = T.toast.userData?.baseY ?? T.toast.position.y; }
  return st;
}

function sweat(ctx, ch, n) {
  for (let i = 0; i < ctx.props.drops.length; i++) {
    const d = ctx.props.drops[i];
    if (i >= n) { d.visible = false; continue; }
    d.visible = true; ctx.add(d, ch.joints.head);
    d.position.set(-0.24 + 0.12 * (i % 5), 0.52 - 0.08 * Math.floor(i / 5), 0.33);
  }
}

function contestStage(ctx) {
  ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('standsCrowd', true); ctx.set.set?.('crowdMotion', 0.6);
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
  fill(ctx.anchor('square.standA.rows'), ['grandad', 'burglar', ...EXTRA_IDS.slice(0, 10)], 0);
  fill(ctx.anchor('square.standB.rows'), EXTRA_IDS.slice(10, 18), 50);
  const ca = ctx.anchor('square.chairA'), tbl = ctx.anchor('square.table');
  const st = { crowd, FA: frame(rel(ca), yawOf(ca)), FT: frame(rel(tbl), yawOf(ca)) };
  ctx.place('me', ca);
  const P = ctx.props;
  // the cat on two cushions at the far end of the table, eye level with the kid
  ctx.add(P.cushions); P.cushions.position.copy(st.FT(0, 0, 0.42)); P.cushions.rotation.set(0, st.FT.yaw, 0);
  const top = P.cushions.userData?.top ?? 0.2;
  ctx.place('cat', st.FT(0, top, 0.42)); ctx.cast.cat.root.rotation.set(0, st.FT.yaw + Math.PI, 0);
  // DJ Hip Replacement at the stage edge
  ctx.add(P.decks3.root); P.decks3.root.position.copy(st.FT(2.4, -TABLE_TOP, 0.4)); P.decks3.root.rotation.set(0, st.FT.yaw - Math.PI / 2, 0);
  ctx.place('gerald', st.FT(2.95, -TABLE_TOP, 0.4)); ctx.cast.gerald.root.rotation.set(0, st.FT.yaw - Math.PI / 2, 0);
  st.cat = ctx.cast.cat; st.me = ctx.cast.me;
  return st;
}

function contestAnim(ctx, st, { crowd = 'mixed', djAsleep = false, grandadAsleep = false, still = false } = {}) {
  for (const c of st.crowd) {
    if (c.ch.id === 'grandad' && grandadAsleep) { c.ch.pose('sit', 0, { seated: true }); c.ch.face('sleepy', SHUT(c.ch)); continue; }
    const a = crowd === 'peer' ? 'peer' : crowd === 'cheer' ? 'cheer' : (c.k % 2 ? 'cheer' : 'clap');
    c.ch.pose(a, still ? 0 : ctx.t + c.phase); c.ch.face(crowd === 'peer' ? 'shocked' : 'grin', ctx.t + c.phase);
  }
  ctx.props.decks3.update(ctx.t);
  const g = ctx.cast.gerald;
  if (djAsleep) { g.pose('stunned', 0, { headPitch: 0.9 }); g.face('sleepy', SHUT(g)); }
  else { g.pose('dance2', ctx.t, { speed: 1.1 }); g.face('grin', ctx.t); }
}

const scoreboard = (ctx, cat, t0) => tag(ctx, `BLINKS  ME 0 | CAT ${cat}`, t0, Infinity, { y: 0.08, size: 64, bg: 'rgba(10,10,20,0.85)', fill: '#ffe14a', rot: 0 });

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody goes out partying."
  {
    name: 'party crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 2, hats: true });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh');
      const d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store = { crowd, from: { pos: hi, look: c.clone().add(V(0, 0.5, 0)), fov: 50 }, to: { pos: c.clone().addScaledVector(d, 9).add(V(0, 3.2, 0)), look: ctx.point('street.crowdA').add(V(0, 1.3, 0)), fov: 42 } };
    },
    update(ctx, lt, u) { animateCrowd(ctx.store.crowd, ctx.t); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic); },
  },
  // ── b02 "Except me."  — the window, then inside: a dead stare (and the cat on the bed, staring too)
  {
    name: 'window push', start: 'b02-0.1', set: 'town',
    setup(ctx) { partyTown(ctx); ctx.store = { W: frameAt(ctx, 'myHouse.window') }; },
    update(ctx, lt, u) { const W = ctx.store.W; ctx.cam.move({ pos: W(0, -0.6, 4.5), look: W(0, 0, 0), fov: 40 }, { pos: W(0, -0.1, 1.6), look: W(0, 0, 0), fov: 36 }, ease.inQuad(u)); },
  },
  {
    name: 'dead stare', start: 'b02.w1-0.05', set: 'room',
    setup(ctx) {
      ctx.store = kidNook(ctx);
      ctx.place('cat', ctx.anchor('room.bed')); ctx.cast.cat.root.rotation.y += 0.6;
    },
    update(ctx, lt) {
      const { cams } = ctx.store, me = ctx.cast.me;
      me.pose('sitIdle', ctx.t); me.face('neutral', OPEN(me));
      ctx.cast.cat.pose('stare', ctx.t); ctx.cast.cat.face('stare', 1.0);
      ctx.cam.move(cams.med, cams.face, clamp(lt / 1.2, 0, 1), ease.outQuad);
    },
  },
  // ── b03 HUSS ×6 — desk slams (toaster jumps) / the cat on the bed, unmoved / snap to the lens
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `stare huss #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = kidNook(ctx); ctx.place('cat', ctx.anchor('room.bed')); ctx.cast.cat.root.rotation.y += 0.6; },
    update(ctx) {
      const { cams, F } = ctx.store, me = ctx.cast.me, T = ctx.props.toaster;
      const hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      me.pose('sitSlam', ctx.t, { hits }); me.face('shocked', OPEN(me));
      const hit = lastBefore(hits, ctx.t);
      T.setTremble(ctx.t, hit != null && ctx.t - hit < 0.15 ? 0.03 : 0);
      ctx.cast.cat.pose('stare', ctx.t); ctx.cast.cat.face('stare', 1.0);
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
      if (i === 1 || i === 3) {
        const cp = ctx.cast.cat.root.position.clone().add(V(0, 0.32, 0));
        ctx.cam.set({ pos: cp.clone().addScaledVector(F.fwd, 1.2).add(V(0.2, 0.15, 0)), look: cp, fov: 36 });
      } else if (i === 5) ctx.cam.set({ pos: F(0.05, 1.5, 1.35), look: F(0, 1.48, 0.1), fov: 32 });
      else { ctx.cam.set(i === 0 ? cams.board : i === 2 ? cams.med : cams.faceL); if (hit != null) burstAt(ctx, F(0, TABLE_TOP + 0.01, 0.5), ctx.t, hit); }
      ctx.cam.shake(0.08, ctx.t, i);
    },
  })),
  // ── b04 "A traffic cone retired. Huge party."  41 YEARS OF SERVICE
  {
    name: 'cone retires', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const F = frameAt(ctx, 'street.crowdB');
      const P = ctx.props;
      const base = F(0, 0, 3.2);
      ctx.add(P.cone); P.cone.position.copy(base); P.cone.rotation.set(0, F.yaw, 0);
      ctx.add(P.cake.root); P.cake.root.position.copy(F(0.45, 0, 3.25));
      ctx.add(P.retireSign); P.retireSign.position.copy(F(-0.55, 0, 3.0)); P.retireSign.rotation.set(0, F.yaw + 0.15, 0);
      const hat = P.coneHat || (P.coneHat = ctx.cast.x05.root.getObjectByName('partyHat')?.clone());
      if (hat) { ctx.add(hat, P.cone); hat.position.set(0, 0.5, 0); hat.visible = true; }
      ctx.place('x01', F(-0.9, 0, 2.8)); ctx.cast.x01.root.rotation.set(0, F.yaw + 0.4, 0);
      ctx.place('x02', F(0.9, 0, 2.8)); ctx.cast.x02.root.rotation.set(0, F.yaw - 0.4, 0);
      ctx.place('x04', F(0.3, 0, 2.2)); ctx.cast.x04.root.rotation.set(0, F.yaw, 0);
      const crowd = crowdGrid(ctx, EXTRA_IDS.slice(6, 18), 'street.crowdB', { cols: 6, dx: 1.3, dz: 1.2, seed: 6, hats: true, offset: [0, 0, -0.5], rowDir: -1 });
      ctx.store = { F, base, crowd };
    },
    update(ctx, lt, u) {
      const { F, base, crowd } = ctx.store;
      ctx.props.cake.update(ctx.t);
      ctx.cast.x01.pose('idle', ctx.t); ctx.cast.x01.face('sad', ctx.t);
      ctx.cast.x02.pose('idle', ctx.t); ctx.cast.x02.face('sad', ctx.t);
      ctx.cast.x04.pose('clap', ctx.t); ctx.cast.x04.face('smile', ctx.t);
      animateCrowd(crowd, ctx.t);
      const th = ctx.markers.hugeParty;
      const close = { pos: F(0.25, 0.55, 4.6), look: F(0, 0.35, 3.2), fov: 38 };
      if (ctx.t < th) ctx.cam.set(close);
      else ctx.cam.move(close, { pos: F(0, 3.4, 10.5), look: F(0, 1.0, 0.5), fov: 48 }, clamp((ctx.t - th) / 0.7, 0, 1), ease.outCubic);
      tag(ctx, '41 YEARS OF SERVICE', ctx.markers.tag41, th, { y: 0.24 });
    },
  },
  // ── b05 "I haven't blinked since March."
  {
    name: 'since march', start: 'b05-0.1', set: 'room',
    setup(ctx) { ctx.store = kidNook(ctx); },
    update(ctx, lt, u) {
      const { cams } = ctx.store, me = ctx.cast.me;
      me.pose('sitIdle', 0, { intensity: 0 }); me.face('neutral', OPEN(me));
      ctx.cam.move(cams.med, cams.face, u, ease.inOutSine);
      daysTag(ctx, 112, ctx.markers.daysTag);
    },
  },
  // ── b06 "I stare at toasters until they pop. Out of fear."
  {
    name: 'toaster fear', start: 'b06-0.1', set: 'room',
    setup(ctx) {
      ctx.store = kidNook(ctx);
      const T = ctx.props.toaster; ctx.store.toastY = T.toast.position.y;
      const sw = ctx.props.drops[8]; ctx.add(sw, T.root); sw.position.set(0.15, 0.13, 0.0); sw.rotation.set(0, Math.PI / 2, 0);
    },
    update(ctx, lt) {
      const { F } = ctx.store, me = ctx.cast.me, T = ctx.props.toaster;
      me.pose('sitIdle', 0, { hands: 'table', headPitch: 0.15, intensity: 0 }); me.face('neutral', OPEN(me));
      const tp = ctx.markers.pop, tf = ctx.markers.fear;
      T.setTremble(ctx.t, ctx.t > tf ? 0.012 : 0.004);
      const k = clamp((ctx.t - tp) / 0.5, 0, 1);
      T.toast.position.y = ctx.store.toastY + (k > 0 ? 2.2 * k - 1.0 * k * k : 0);
      ctx.props.drops[8].visible = ctx.t > tf;
      ctx.cam.set({ pos: F(0.75, 1.25, 1.35), look: F(0.0, 1.05, 0.35), fov: 40 });
      daysTag(ctx, 112, -1);
    },
  },
  // ── b07 "While they're out partying, by the way, I'm staring at a wall."
  {
    name: 'wall stare', start: 'b07-0.1', set: 'room',
    setup(ctx) { ctx.store = wallScene(ctx); },
    update(ctx, lt, u) {
      const { W } = ctx.store, me = ctx.cast.me;
      me.pose('idle', 0, { intensity: 0 }); me.face('neutral', OPEN(me));
      ctx.cam.move({ pos: W(1.0, 1.7, 4.2), look: W(1.0, 1.2, 0), fov: 46 }, { pos: W(1.0, 1.6, 3.6), look: W(1.0, 1.2, 0), fov: 44 }, u);
      ctx.props.wallCrack.setGrowth(0);
      daysTag(ctx, 112, -1);
    },
  },
  // ── b08 "It cracked first."  /  b09 HUSS ×3 — the crack branches on every HUSS
  {
    name: 'wall cracks', start: 'b08-0.1', set: 'room',
    setup(ctx) { ctx.store = wallScene(ctx); },
    update(ctx, lt) {
      const { W } = ctx.store, me = ctx.cast.me;
      const hits = ctx.hussTimes('b09').map((h) => h + 0.03);
      const n = hits.filter((h) => h <= ctx.t).length;
      const g = clamp((ctx.t - ctx.markers.cracked) / 0.5, 0, 1) * 0.35 + n * 0.22;
      ctx.props.wallCrack.setGrowth(Math.min(1, g));
      if (ctx.t < ctx.time('b09') - 0.12) {
        me.pose('idle', 0, { intensity: 0 }); me.face('neutral', OPEN(me));
        ctx.cam.set({ pos: W(1.0, 1.62, 1.9), look: W(1.0, 1.62, 0), fov: 40 });
      } else {
        me.pose('slam', ctx.t, { hits }); me.face('shocked', OPEN(me));
        ctx.cam.set({ pos: W(2.6, 1.5, 0.6), look: W(1.0, 1.4, 0.15), fov: 42 });
        ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
      }
      daysTag(ctx, 112, -1);
    },
  },
  // ── b10 quote: "Eyes are windows. Never close a window." — a burglar (who waves)
  {
    name: 'burglar', start: 'b10-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const W = frameAt(ctx, 'myHouse.window');
      const front = frameAt(ctx, 'myHouse.front');
      ctx.place('burglar', front.origin.clone().addScaledVector(front.left, 1.6)); ctx.cast.burglar.root.rotation.set(0, front.yaw + Math.PI, 0);
      const sack = ctx.props.sack; ctx.add(sack, ctx.cast.burglar.joints.torso); sack.position.set(-0.3, 0.55, -0.2);
      ctx.store = { W, front };
    },
    update(ctx, lt) {
      const b = ctx.cast.burglar, { W, front } = ctx.store;
      const qe = ctx.markers.quote1end;
      const bp = b.root.position.clone();
      if (ctx.t < qe) {
        b.pose('peer', ctx.t, { lookAt: W.origin }); b.face('squint', ctx.t);
        ctx.cam.set({ pos: bp.clone().addScaledVector(front.fwd, 5.5).add(V(0, 1.6, 0)), look: bp.clone().add(V(0, 2.2, 0)).lerp(W.origin, 0.4), fov: 48 });
      } else {
        b.root.rotation.set(0, front.yaw, 0);
        b.pose('wave', ctx.t); b.face('smile', ctx.t);
        ctx.cam.set({ pos: bp.clone().addScaledVector(front.fwd, 2.6).add(V(0, 1.45, 0)), look: bp.clone().add(V(0, 1.35, 0)), fov: 40 });
      }
      quoteCard(ctx, 'Eyes are windows. Never close a window.', 'a burglar', ctx.markers.quote1, qe, { y: 0.32 });
    },
  },
  // ── b11 "Then came the Summer Party Staring Contest."
  {
    name: 'contest establishing', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      ctx.store = contestStage(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 26).add(V(0, 12, 0)), look: c.clone().add(V(0, 2, 0)), fov: 44 };
      ctx.store.to = { pos: cam, look: c.clone().add(V(0, 2.4, 0)), fov: 48 };
    },
    update(ctx, lt, u) {
      const st = ctx.store;
      contestAnim(ctx, st);
      st.me.pose('sitIdle', ctx.t); st.me.face('determined', OPEN(st.me)); st.cat.pose('stare', ctx.t); st.cat.face('stare', 1.0);
      ctx.cam.move(st.from, st.to, u, ease.inOutCubic);
      scoreboard(ctx, 0, ctx.time('b11') + 0.6);
    },
  },
  // ── b12 "Defending champion? My own cat. Nine lives. Zero blinks."
  {
    name: 'defending champion', start: 'b12-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); },
    update(ctx, lt) {
      const st = ctx.store, me = st.me, cat = st.cat;
      contestAnim(ctx, st);
      me.pose('sitIdle', 0, { hands: 'table', intensity: 0 }); me.face('determined', OPEN(me));
      cat.pose('stare', 0); cat.face('stare', 1.0);
      const tm = ctx.markers.myCat, tn = ctx.markers.nine;
      const hp = headPos(me, 0.3), cp = cat.root.position.clone().add(V(0, 0.3, 0));
      if (ctx.t < tm) ctx.cam.set({ pos: st.FT(0.55, 0.85, 0.25), look: hp, fov: 34 });
      else if (ctx.t < tn) { boomCam(ctx, tm, { pos: st.FT(-0.4, 0.6, -0.2), look: cp, fov: 40 }, { pos: st.FT(-0.15, 0.48, 0.0), look: cp, fov: 32 }); tag(ctx, 'UNDEFEATED', tm + 0.15, tn, { y: 0.22 }); }
      else ctx.cam.set({ pos: st.FT(2.6, 0.9, -0.1), look: st.FT(0, 0.55, -0.1), fov: 34 });
      scoreboard(ctx, 0, -1);
    },
  },
  // ── b13 quote: "Your eyes have the right to remain open." — my cat's lawyer
  {
    name: 'cat lawyer', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      const st = contestStage(ctx);
      ctx.place('lawyer', st.FT(0.25, -TABLE_TOP, 1.15)); ctx.cast.lawyer.root.rotation.set(0, st.FT.yaw + Math.PI, 0);
      const bc = ctx.props.briefcase; ctx.add(bc); bc.position.copy(st.FT(0.7, -TABLE_TOP, 1.1)); bc.rotation.set(0, st.FT.yaw + Math.PI, 0);
      ctx.store = st;
    },
    update(ctx, lt) {
      const st = ctx.store, L = ctx.cast.lawyer;
      contestAnim(ctx, st);
      st.me.pose('sitIdle', 0, { intensity: 0 }); st.me.face('determined', OPEN(st.me)); st.cat.pose('stare', 0); st.cat.face('stare', 1.0);
      L.pose('crossArms', ctx.t); L.face('smug', ctx.t);
      const lp = headPos(L, 0.2);
      ctx.cam.set({ pos: st.FT(-0.5, 1.75, -0.9), look: lp.clone().add(V(0, -0.35, 0)), fov: 40 });
      quoteCard(ctx, 'Your eyes have the right to remain open.', "my cat's lawyer", ctx.markers.quote2, ctx.markers.quote2end, { y: 0.3 });
      scoreboard(ctx, 0, -1);
    },
  },
  // ── b14 HUSS ×6 — western cut-backs, sweat builds
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `staredown huss #${i + 1}`, start: i === 0 ? 'b14.h0-0.12' : `b14.h${i}-0.03`, set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); },
    update(ctx) {
      const st = ctx.store, me = st.me, cat = st.cat;
      const hits = ctx.hussTimes('b14').map((h) => h + 0.03);
      const n = hits.filter((h) => h <= ctx.t).length;
      contestAnim(ctx, st, { crowd: i === 2 ? 'peer' : 'mixed' });
      me.pose('sitSlam', ctx.t, { hits }); me.face('shocked', OPEN(me));
      cat.pose('stare', 0); cat.face('stare', 1.0);
      sweat(ctx, me, Math.max(0, n - 2));
      const hp = headPos(me, 0.3), cp = cat.root.position.clone().add(V(0, 0.3, 0));
      const tight = [1.6, 1.0, 0, 1.25, 0.75, 0][i];
      if (i === 0 || i === 3) ctx.cam.set({ pos: hp.clone().addScaledVector(st.FT.fwd, tight).add(V(0.1, 0, 0)), look: hp, fov: 32 });
      if (i === 1 || i === 4) ctx.cam.set({ pos: cp.clone().addScaledVector(st.FT.fwd, -tight).add(V(0, 0.05, 0)), look: cp, fov: 32 });
      if (i === 2) { const F = frameAt(ctx, 'square.standA'); ctx.cam.set({ pos: F(0, 2.3, 5.2), look: F(0, 2.0, 0), fov: 40 }); }
      if (i === 5) ctx.cam.set({ pos: st.FT(2.1, 1.0, -0.15), look: st.FT(0, 0.6, -0.15), fov: 30 });
      ctx.cam.punch(hits, ctx.t, 0.12, 0.18); ctx.cam.shake(0.1, ctx.t, 40 + i);
      scoreboard(ctx, 0, -1);
    },
  })),
  // ── b15 "Four hours. DJ Hip Replacement fell asleep."
  {
    name: 'four hours', start: 'b15-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); ctx.set.set?.('crowdMotion', 0.2); },
    update(ctx, lt) {
      const st = ctx.store;
      contestAnim(ctx, st, { djAsleep: ctx.t > ctx.markers.asleep - 0.6, still: true });
      st.me.pose('sitIdle', 0, { intensity: 0 }); st.me.face('sweat', OPEN(st.me)); sweat(ctx, st.me, 6);
      st.cat.pose('stare', 0); st.cat.face('stare', 1.0);
      const d = ctx.t - ctx.markers.fourHours;
      if (ctx.t < ctx.time('b15.w2') - 0.1) {
        ctx.cam.set({ pos: st.FT(2.6, 0.9, -0.1), look: st.FT(0, 0.55, -0.1), fov: 34 });
        ctx.fx.overlay('#2a1a6a', 0.55);
        ctx.fx.text('4 HOURS\nLATER', { y: 0.4, size: 190, fill: '#ffe14a', stroke: '#3a1a00', scale: d < 0.2 ? ease.outBack(clamp(d / 0.2, 0, 1)) : 1, rot: -0.05 });
        ctx.caption.hide(true);
      } else {
        const g = ctx.cast.gerald, gp = headPos(g, 0.2);
        ctx.cam.set({ pos: gp.clone().add(V(0, 0.15, 0)).addScaledVector(st.FT.fwd, -1.6).addScaledVector(st.FT.left, 0.8), look: gp.clone().add(V(0, -0.25, 0)), fov: 40 });
        tag(ctx, 'DJ HIP REPLACEMENT (91)', ctx.time('b15.w2'), Infinity, { y: 0.22, size: 60 });
      }
    },
  },
  // ── b16 quote: "Blinking is a nap for cowards." — my grandad, mid-nap
  {
    name: 'grandad mid-nap', start: 'b16-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); ctx.set.set?.('crowdMotion', 0.2); },
    update(ctx, lt) {
      const st = ctx.store;
      contestAnim(ctx, st, { djAsleep: true, grandadAsleep: true, still: true });
      const g = ctx.cast.grandad, gp = headPos(g, 0.25);
      const F = frameAt(ctx, 'square.standA');
      ctx.cam.set({ pos: gp.clone().addScaledVector(F.fwd, 2.4).add(V(0.3, 0.1, 0)), look: gp, fov: 34 });
      quoteCard(ctx, 'Blinking is a nap for cowards.', 'my grandad, mid-nap', ctx.markers.quote3, ctx.markers.quote3end, { y: 0.3 });
    },
  },
  // ── b17 HUSS ×3 — the cat's eye twitches, sweat on both
  ...[0, 1, 2].map((i) => ({
    name: `twitch huss #${i + 1}`, start: i === 0 ? 'b17.h0-0.12' : `b17.h${i}-0.03`, set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); },
    update(ctx) {
      const st = ctx.store, me = st.me, cat = st.cat;
      const hits = ctx.hussTimes('b17').map((h) => h + 0.03);
      contestAnim(ctx, st, { djAsleep: true, still: true });
      me.pose('sitSlam', ctx.t, { hits }); me.face('shocked', OPEN(me)); sweat(ctx, me, 7 + Math.min(1, i));
      cat.pose('stare', 0); cat.face(i === 1 ? 'shocked' : 'stare', 1.0);
      if (i === 1) { const d = ctx.props.drops[8]; d.visible = true; ctx.add(d, cat.joints.head || cat.root); d.position.set(0.08, 0.16, 0.12); }
      const hp = headPos(me, 0.3), cp = cat.root.position.clone().add(V(0, 0.3, 0));
      if (i === 0) ctx.cam.set({ pos: hp.clone().addScaledVector(st.FT.fwd, 0.95), look: hp, fov: 30 });
      if (i === 1) ctx.cam.set({ pos: cp.clone().addScaledVector(st.FT.fwd, -0.7), look: cp, fov: 30 });
      if (i === 2) ctx.cam.set({ pos: st.FT(1.9, 0.95, -0.15), look: st.FT(0, 0.6, -0.15), fov: 28 });
      ctx.cam.punch(hits, ctx.t, 0.14, 0.18); ctx.cam.shake(0.14, ctx.t, 60 + i);
      scoreboard(ctx, 0, -1);
    },
  })),
  // ── b18 "Then the cat blinked."  (music out)  → CAT 1
  {
    name: 'cat blinks', start: 'b18-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); ctx.set.set?.('crowdMotion', 0); },
    update(ctx, lt) {
      const st = ctx.store, cat = st.cat, tb = ctx.markers.catBlink;
      contestAnim(ctx, st, { djAsleep: true, still: true });
      st.me.pose('sitIdle', 0, { intensity: 0 }); st.me.face('shocked', OPEN(st.me)); sweat(ctx, st.me, 8);
      cat.pose('stare', 0); cat.face(ctx.t > tb && ctx.t < tb + 0.45 ? 'sleepy' : 'stare', 1.0);
      const cp = cat.root.position.clone().add(V(0, 0.3, 0));
      ctx.cam.move({ pos: cp.clone().addScaledVector(st.FT.fwd, -1.1), look: cp, fov: 32 }, { pos: cp.clone().addScaledVector(st.FT.fwd, -0.75), look: cp, fov: 30 }, clamp(lt / 1.2, 0, 1));
      scoreboard(ctx, ctx.t > tb ? 1 : 0, -1);
    },
  },
  // ── b19 "Top ten respectful moments. Number seven: he let me win."  /  b20 "That's cat for good game."
  {
    name: 'he let me win', start: 'b19-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); },
    update(ctx, lt) {
      const st = ctx.store, cat = st.cat;
      contestAnim(ctx, st, { crowd: 'cheer' });
      st.me.pose('sitIdle', ctx.t); st.me.face('shocked', OPEN(st.me));
      const slow = ctx.t > ctx.time('b20') + 0.3 && ctx.t < ctx.time('b20') + 1.0;
      cat.pose('stare', 0); cat.face(slow ? 'sleepy' : 'smug', 1.0);
      const cp = cat.root.position.clone().add(V(0, 0.3, 0));
      ctx.cam.set({ pos: st.FT(1.6, 1.0, 0.0), look: st.FT(0, 0.65, 0.0), fov: 36 });
      top10Card(ctx, 7, ctx.markers.top7);
      scoreboard(ctx, 1, -1);
    },
  },
  // ── b21 mayor: "Say cheese!"  → flash
  {
    name: 'say cheese', start: 'b21-0.1', set: 'town',
    setup(ctx) {
      const st = contestStage(ctx);
      const me = st.me;
      ctx.place('me', st.FA(0.2, 0, 0.0)); me.root.rotation.set(0, st.FA.yaw + Math.PI, 0);   // standing, facing the crowd/camera
      const tr = ctx.props.trophy; ctx.add(tr, me.joints.handR); tr.position.set(0, -0.12, 0.05); tr.rotation.set(Math.PI, 0, 0);
      const cam = ctx.props.photoCam; ctx.add(cam); cam.position.copy(st.FA(0.2, 0, -3.2)); cam.rotation.set(0, st.FA.yaw, 0);
      ctx.place('mayor', st.FA(0.95, 0, -3.3)); ctx.cast.mayor.root.rotation.set(0, st.FA.yaw, 0);
      ctx.store = st;
    },
    update(ctx, lt) {
      const st = ctx.store, me = st.me, m = ctx.cast.mayor;
      contestAnim(ctx, st, { crowd: 'cheer' });
      me.pose('cheer', ctx.t * 0.3); me.face('smile', OPEN(me));
      m.pose('point', ctx.t); m.face('grin', ctx.t);
      ctx.cam.set({ pos: st.FA(-1.2, 1.7, -4.6), look: st.FA(0.4, 1.3, -1.6), fov: 44 });
      const d = ctx.t - ctx.markers.flash;
      if (d > 0) ctx.fx.overlay('#ffffff', clamp(1 - d / 0.35, 0, 1));
    },
  },
  // ── b22 "I blinked."  — freeze-frame polaroid, eyes shut
  {
    name: 'i blinked', start: 'b22-0.3', set: 'town',
    setup(ctx) {
      const st = contestStage(ctx);
      const me = st.me;
      ctx.place('me', st.FA(0.2, 0, 0.0)); me.root.rotation.set(0, st.FA.yaw + Math.PI, 0);
      const tr = ctx.props.trophy; ctx.add(tr, me.joints.handR); tr.position.set(0, -0.12, 0.05); tr.rotation.set(Math.PI, 0, 0);
      ctx.store = st;
    },
    update(ctx, lt) {
      const st = ctx.store, me = st.me;
      contestAnim(ctx, st, { crowd: 'cheer', still: true });
      me.pose('cheer', ctx.markers.flash * 0.3); me.face('smile', SHUT(me));
      st.cat.pose('stare', 0); st.cat.face('stare', 1.0);
      const hp = headPos(me, 0.1);
      const f = V(Math.sin(me.root.rotation.y), 0, Math.cos(me.root.rotation.y));
      ctx.cam.set({ pos: hp.clone().addScaledVector(f, 2.6).add(V(0, 0.1, 0)), look: hp.clone().add(V(0, -0.15, 0)), fov: 38, roll: -0.06 });
      ctx.fx.draw((g, W, H) => { g.strokeStyle = '#ffffff'; g.lineWidth = 70; g.strokeRect(35, 35, W - 70, H - 70); g.fillStyle = '#ffffff'; g.fillRect(0, H * 0.8, W, H * 0.2); });
      ctx.fx.text('NEVER BLINKED*', { y: 0.86, size: 80, fill: '#1d1d22', stroke: '#ffffff', line: 4, shadow: false, rot: -0.03 });
      daysTag(ctx, 0, ctx.markers.iBlinked);
    },
  },
  // ── b23 "They built me a statue. Eyes closed."  /  b24 HUSS ×3  /  b25 "It cracked first."
  {
    name: 'the statue', start: 'b23-0.1', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
      const F = frameAt(ctx, 'park.cam');
      const tree = ctx.anchor('park.tree') ? ctx.point('park.tree') : ctx.point('park.table');
      const base = ctx.point('park.table').clone().lerp(tree, 0.5);
      const P = ctx.props, Fb = frame(base, F.yaw + Math.PI);
      ctx.add(P.plinth); P.plinth.position.copy(base); P.plinth.rotation.set(0, Fb.yaw, 0);
      const h = P.plinth.userData?.top ?? 0.35;
      const s = ctx.cast.meStone;
      ctx.place('meStone', Fb(0, h, 0)); s.root.rotation.set(0, Fb.yaw, 0);
      const tr = P.trophyStone; ctx.add(tr, s.joints.handR); tr.position.set(0, -0.12, 0.05); tr.rotation.set(Math.PI, 0, 0);
      const cr = P.statueCrack; ctx.add(cr.root, s.joints.head);
      const face = s.root.getObjectByName('face');
      cr.root.position.set(-0.05, (face ? face.position.y : 0.3) + 0.1, (face ? face.position.z : 0.31) + 0.01);
      ctx.add(P.chip, s.joints.head);
      ctx.place('me', Fb(1.1, 0, 0.9)); ctx.cast.me.root.rotation.set(0, Fb.yaw + Math.PI * 0.8, 0);
      ctx.store = { Fb, h };
    },
    update(ctx, lt, u) {
      const { Fb, h } = ctx.store, s = ctx.cast.meStone, me = ctx.cast.me, P = ctx.props;
      s.pose('cheer', 0); s.face('smile', SHUT(s));
      const hs = ctx.hussTimes('b24').map((x) => x + 0.03);
      const n = hs.filter((x) => x <= ctx.t).length;
      P.statueCrack.setGrowth(Math.min(1, n * 0.28 + clamp((ctx.t - ctx.markers.cracked2) / 0.3, 0, 1) * 0.16));
      const tc = ctx.markers.cracked2, kc = clamp((ctx.t - tc) / 0.6, 0, 1);
      P.chip.visible = ctx.t > tc - 0.05 || true;
      P.chip.position.set(0.0, 0.25 - 2.6 * kc * kc, 0.36 + 0.1 * kc); P.chip.rotation.set(kc * 4, kc * 2, 0); P.chip.visible = kc < 0.98;
      if (ctx.t < ctx.time('b24') - 0.1) {
        me.pose('idle', 0, { intensity: 0, lookAt: headPos(s, 0.2) }); me.face('neutral', OPEN(me));
        ctx.cam.move({ pos: Fb(0.2, 1.6, 5.2), look: Fb(0, h + 1.2, 0), fov: 44 }, { pos: Fb(0.3, 1.7, 4.2), look: Fb(0, h + 1.3, 0), fov: 42 }, ctx.progress('b23', 'b24'));
      } else {
        me.pose('idle', 0, { intensity: 0, lookAt: headPos(s, 0.2) }); me.face('shocked', OPEN(me));
        const sp = headPos(s, 0.25);
        ctx.cam.set({ pos: sp.clone().addScaledVector(Fb.fwd, 1.6).add(V(0.15, -0.05, 0)), look: sp, fov: 34 });
        ctx.cam.punch(hs, ctx.t, 0.1, 0.2);
      }
    },
  },
];

// ── the bedroom wall the kid stares at (beside the window), with the crack decal on it
function wallScene(ctx) {
  const set = ctx.set; set.setLighting?.('night'); set.set?.('window', 'party');
  const w = ctx.anchor('room.window');
  const W = frame(rel(w), yawOf(w));          // +z = into the room
  const wallPt = W(1.05, 0, -0.0);
  ctx.place('me', W(1.0, -rel(w).y, 0.32)); ctx.cast.me.root.rotation.set(0, W.yaw + Math.PI, 0);
  const cr = ctx.props.wallCrack; ctx.add(cr.root);
  const eye = headPos(ctx.cast.me, 0.25);
  cr.root.position.set(wallPt.x, eye.y, wallPt.z).addScaledVector(W.fwd, 0.012); cr.root.rotation.set(0, W.yaw, 0);
  const Wf = (x, y, z) => W(x, y - rel(w).y, z);
  return { W: Wf };
}
