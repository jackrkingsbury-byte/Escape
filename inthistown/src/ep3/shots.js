// In This Town — Episode 3: "Don't Blink".  The chess kid hasn't blinked since March.
// Film contract: SPEC.md §8.  Timeline: episodes/ep3/timeline.json (audio/build_episode.py ep3).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, ease, hash } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { makeSweatDrop, makePartyHat } from '../props.js';
import { init as initEp1, V, TABLE_TOP, headPos, frame, frameAt, roomNook, nookCams, burstAt, lastBefore, boomCam, partyTown } from '../shots.js';
import { makeDJDecks } from '../ep2/props2.js';
import { makeToaster, makeCrack, makeTrophy, makePhotoCamera, makeCushions, makeTrafficCone, makeSign, makeBriefcase,
  makeSack, makePlinth, setProps3EnvIntensity, STONE_GREY } from './props3.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const GERALD_SKIN = '#e9b99a';
export const cast = {
  me: MAIN.me, cat: MAIN.cat, mayor: MAIN.mayor, grandad: MAIN.grandad,
  gerald: { id: 'gerald', skin: GERALD_SKIN, hair: { style: 'bald', color: GERALD_SKIN }, top: { style: 'cardigan', color: '#3ee0c8', accent: '#ffffff' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#4a3b2f', accessories: ['beard', 'sunglasses', 'headphones'], scale: 0.92 },
  lawyer: { id: 'lawyer', skin: '#e0ac69', hair: { style: 'short', color: '#cfcfcf' }, top: { style: 'suit', color: '#5a5f6b', accent: '#ffffff' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#111111', accessories: ['glasses', 'bowtie'], scale: 1.0 },
  burglar: { id: 'burglar', skin: '#c68642', hair: { style: 'short', color: '#111111' }, top: { style: 'tee', color: '#1d1d22', accent: '#ffffff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#111111', accessories: ['cap'], capColor: '#1d1d22', scale: 0.97 },
  meStone: { ...MAIN.me, id: 'meStone', skin: STONE_GREY, hair: { style: 'fade', color: '#7e7e7e' },
    top: { style: 'hoodie', color: '#8a8a8a', accent: '#b0b0b0', emblem: 'knight' }, bottom: { style: 'pants', color: '#858585' },
    shoes: '#a0a0a0', accessories: ['headphones'] },
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 3, banner: ['SUMMER PARTY', 'STARING', 'CONTEST'] }),
  room: () => buildRoom({ variant: 'hero', poster: 'none', window: 'party' }),
};

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.toaster = makeToaster();
  P.toasterSweat = makeSweatDrop({ size: 0.05 });
  P.wallCrack = makeCrack({ w: 1.2, h: 1.0, seed: 3 });
  P.statueCrack = makeCrack({ w: 0.34, h: 0.3, seed: 8, branches: 2 });
  P.trophy = makeTrophy(); P.trophyStone = makeTrophy({ stone: true });
  P.photoCam = makePhotoCamera();
  P.cushions = makeCushions();
  P.cone = makeTrafficCone(); P.coneHat = makePartyHat('#ff4fa3');
  P.retireSign = makeSign({ lines: ['HAPPY', 'RETIREMENT'], w: 0.7, h: 0.42 });
  P.briefcase = makeBriefcase(); P.sack = makeSack();
  P.plinth = makePlinth({ w: 1.0, d: 1.0, h: 0.45, plaque: 'NEVER BLINKED' });
  P.decks3 = makeDJDecks();
  P.drops = Array.from({ length: 9 }, () => makeSweatDrop({ size: 0.075 }));
  P.catDrop = makeSweatDrop({ size: 0.05 });
  P.chip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.05), new THREE.MeshStandardMaterial({ color: STONE_GREY, roughness: 0.95 }));
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
// Eyes held open (never blinks) / shut, via the face() blink clock: blink when (t + phase) mod period < 0.12.
const period = (ch) => (ch.kind === 'cat' ? 3.4 : ch.kind === 'pigeon' ? 2.7 : 3.1);
const OPEN = (ch) => 10 * period(ch) + period(ch) / 2 - (ch.blinkPhase || 0);
const SHUT = (ch) => 10 * period(ch) + 0.05 - (ch.blinkPhase || 0);

function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0;
  if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.3, size: 70, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.78)', rot: -0.04, ...o, scale: Math.max(0.01, pop) });
}
const daysTag = (ctx, n, t0) => tag(ctx, `DAYS SINCE LAST BLINK: ${n}`, t0, Infinity, { y: 0.12, size: 50, bg: n ? 'rgba(20,130,60,0.92)' : 'rgba(200,0,40,0.92)', rot: -0.02 });
const scoreboard = (ctx, cat, t0 = -1) => tag(ctx, `BLINKS:  ME 0  |  CAT ${cat}`, t0, Infinity, { y: 0.1, size: 58, bg: 'rgba(10,10,20,0.85)', fill: '#ffe14a', rot: 0 });

/** The kid at the room nook, the toaster on the table (front toward the open side). */
function kidNook(ctx, { toaster = true } = {}) {
  setProps3EnvIntensity(0.45);
  const st = roomNook(ctx, 'me', { board: false, clock: false, lighting: 'night' });
  ctx.set.set?.('window', 'party');
  st.cams = nookCams(st.F);
  const T = ctx.props.toaster;
  if (toaster) {
    ctx.add(T.root); T.root.position.copy(st.F(0.12, TABLE_TOP, 0.55)); T.root.rotation.set(0, st.F.yaw - 0.35, 0); T.root.scale.setScalar(1.5);
    T.toast.position.y = T.toastRestY; T.setLever(0); T.setTremble(0, 0);
  }
  return st;
}
/** The cat on the bed, turned to stare at the kid. */
function catOnBed(ctx) {
  const cat = ctx.cast.cat;
  ctx.place('cat', ctx.anchor('room.bed'));
  const me = ctx.cast.me.root.position, c = cat.root.position;
  cat.root.rotation.set(0, Math.atan2(me.x - c.x, me.z - c.z), 0);
  return cat;
}
function catFace(cat) { cat.root.updateMatrixWorld(true); return cat.joints.head.localToWorld(V(0, 0.035, 0.123)); }
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
const facing = (obj) => V(Math.sin(obj.rotation.y), 0, Math.cos(obj.rotation.y));

function sweat(ctx, ch, n) {
  ctx.props.drops.forEach((d, i) => {
    d.visible = i < n;
    if (i >= n) return;
    ctx.add(d, ch.joints.head);
    const row = Math.floor(i / 5), col = i % 5;
    d.position.set(-0.26 + 0.13 * col + row * 0.065, 0.56 - 0.1 * row - (col % 2) * 0.03, 0.3);
  });
}

/** The trophy in the kid's right hand, kept upright (placed in world space every frame). */
function holdTrophy(ctx, ch, tr, scale = 1.4) {
  ctx.add(tr); tr.scale.setScalar(scale);
  ch.root.updateMatrixWorld(true);
  const hp = ch.joints.handR.getWorldPosition(V());
  const g = tr.userData.grip ? tr.userData.grip.position : V(0, 0.122, 0);
  tr.position.copy(hp).addScaledVector(g, -scale);
  tr.rotation.set(0, ch.root.rotation.y, 0);
}

// ── The contest stage: the kid at chairA, the cat on two cushions at the far end of the table, DJ Hip
//    Replacement (91) at the decks, both bleachers full.  Table frame FT: +z = towards the cat, +x = audience side.
function contestStage(ctx, { night = false } = {}) {
  setProps3EnvIntensity(night ? 0.55 : 0.9);
  ctx.set.setLighting?.(night ? 'party_night' : 'dusk');
  ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
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
        if (id !== 'grandad') ctx.cast[id].setAccessory?.('partyHat', true);
        crowd.push({ ch: ctx.cast[id], phase: hash(k * 3.1 + k0) * 3, k: k + k0 });
      }
    });
  };
  fill(ctx.anchor('square.standA.rows'), [...EXTRA_IDS.slice(0, 3), 'grandad', ...EXTRA_IDS.slice(3, 10)], 0);
  fill(ctx.anchor('square.standB.rows'), EXTRA_IDS.slice(10, 18), 50);
  const ca = ctx.anchor('square.chairA'), tbl = ctx.anchor('square.table');
  const tp = rel(tbl);
  const st = { crowd, FA: frame(rel(ca), yawOf(ca)), FT: frame(tp, yawOf(ca)), tableY: tp.y };
  st.audYaw = st.FT.yaw + Math.PI / 2;            // facing the audience (−X)
  ctx.place('me', ca);
  const P = ctx.props;
  ctx.add(P.cushions); P.cushions.position.copy(st.FT(0, 0, 0.42)); P.cushions.rotation.set(0, st.FT.yaw, 0);
  st.cushionTop = P.cushions.userData?.top ?? 0.196;
  ctx.place('cat', st.FT(0, st.cushionTop, 0.42)); ctx.cast.cat.root.rotation.set(0, st.FT.yaw + Math.PI, 0);
  // DJ Hip Replacement at the stage corner, facing the audience
  ctx.add(P.decks3.root); P.decks3.root.position.copy(st.FT(1.35, -TABLE_TOP, -2.7)); P.decks3.root.rotation.set(0, st.audYaw, 0); P.decks3.setOn(true);
  ctx.place('gerald', st.FT(0.8, -TABLE_TOP, -2.7)); ctx.cast.gerald.root.rotation.set(0, st.audYaw, 0);
  st.cat = ctx.cast.cat; st.me = ctx.cast.me;
  return st;
}

function contestAnim(ctx, st, { crowd = 'mixed', djAsleep = false, grandadAsleep = false, still = false, hits = null } = {}) {
  const tc = still ? 3.0 : ctx.t;
  for (const c of st.crowd) {
    if (c.ch.id === 'grandad' && grandadAsleep) { c.ch.pose('idle', 0, { intensity: 0, headPitch: 0.6 }); c.ch.face('sleepy', SHUT(c.ch)); continue; }
    const a = crowd === 'peer' ? 'peer' : crowd === 'cheer' ? 'cheer' : (c.k % 2 ? 'cheer' : 'clap');
    c.ch.pose(a, tc + c.phase, still ? { intensity: 0.15 } : {}); c.ch.face(crowd === 'peer' ? 'shocked' : 'grin', ctx.t + c.phase);
  }
  ctx.props.decks3.update(ctx.t);
  const g = ctx.cast.gerald;
  if (djAsleep) { g.pose('idle', 0, { intensity: 0, headPitch: 0.75 }); g.face('sleepy', SHUT(g)); }
  else { g.pose('dance2', ctx.t, { speed: 1.1 }); g.face('grin', ctx.t); }
  // the cushions bounce when the kid slams the table (the cat rides them, unblinking)
  const P = ctx.props;
  const hit = hits ? lastBefore(hits, ctx.t) : null;
  const top = hit != null && P.cushions.userData.bounce ? P.cushions.userData.bounce(ctx.t - hit, 1) : st.cushionTop;
  st.cat.root.position.copy(st.FT(0, top, 0.42));
}
const kidFace = (st) => humanFace(st.me);
// Contest cameras (the two faces are only ~0.55 m apart across the 0.9 m table → angled over-the-shoulder setups)
const up = (y) => V(0, y, 0);
// angled setup: distance d from the face, `ang` radians off the face's axis towards the audience side (+x).
const angled = (face, axis, left, d, ang, fov, lift = 0.04) => ({ pos: face.clone().addScaledVector(axis, d * Math.cos(ang)).addScaledVector(left, d * Math.sin(ang)).add(up(lift)), look: face, fov });
const C = {
  kidCU: (st) => angled(kidFace(st), st.FT.fwd, st.FT.left, 2.9, 0.56, 30, 0.1),
  kidECU: (st) => angled(kidFace(st).add(up(0.06)), st.FT.fwd, st.FT.left, 1.3, 0.9, 28, 0.02),
  catCU: (st) => angled(catFace(st.cat), st.FT.fwd.clone().negate(), st.FT.left, 1.6, 0.9, 26, 0.1),
  catECU: (st) => { const cf = catFace(st.cat); return { pos: cf.clone().addScaledVector(st.FT.fwd, -0.48).addScaledVector(st.FT.left, 0.08).add(up(0.02)), look: cf, fov: 34 }; },
  ots: (st) => ({ pos: st.FT(3.2, 2.0, -2.2), look: st.FT(0, 0.35, -0.1), fov: 40 }),
  wide: (st) => ({ pos: st.FT(4.4, 0.95, -0.15), look: st.FT(0, 0.3, -0.15), fov: 44 }),
};

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
  // ── b02 "Except me."  — the window, then inside: the dead stare (the cat on the bed stares back)
  {
    name: 'window push', start: 'b02-0.1', set: 'town',
    setup(ctx) { partyTown(ctx); ctx.store = { W: frameAt(ctx, 'myHouse.window') }; },
    update(ctx, lt, u) { const W = ctx.store.W; ctx.cam.move({ pos: W(0, -0.6, 4.5), look: W(0, 0, 0), fov: 40 }, { pos: W(0, -0.1, 1.6), look: W(0, 0, 0), fov: 36 }, ease.inQuad(u)); },
  },
  {
    name: 'dead stare', start: 'b02.w1-0.05', set: 'room',
    setup(ctx) { ctx.store = kidNook(ctx); catOnBed(ctx); },
    update(ctx, lt) {
      const { cams } = ctx.store, me = ctx.cast.me, cat = ctx.cast.cat;
      me.pose('sitIdle', ctx.t, { intensity: 0.2 }); me.face('neutral', OPEN(me));
      cat.pose('stare', ctx.t); cat.face('stare', OPEN(cat));
      ctx.cam.move(cams.med, cams.face, clamp(lt / 1.0, 0, 1), ease.outQuad);
    },
  },
  // ── b03 HUSS ×6 — desk slams (the toaster jumps) / the cat on the bed, unmoved / snap to the eyes
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `stare huss #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = kidNook(ctx); catOnBed(ctx); },
    update(ctx) {
      const { cams, F } = ctx.store, me = ctx.cast.me, cat = ctx.cast.cat, T = ctx.props.toaster;
      const hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      me.pose('sitSlam', ctx.t, { hits, slamX: -0.22 }); me.face(i % 2 ? 'huss' : 'shocked', OPEN(me));
      const hit = lastBefore(hits, ctx.t);
      const near = hit != null ? ctx.t - hit : 9;
      T.setTremble(ctx.t, near < 0.18 ? 0.03 * (1 - near / 0.18) : 0);
      T.toast.position.y = T.toastRestY + (near < 0.3 ? 0.06 * Math.sin(Math.PI * near / 0.3) : 0);
      cat.pose('stare', ctx.t); cat.face('stare', OPEN(cat));
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
      if (i === 1 || i === 3) {
        const cp = catFace(cat), f = facing(cat.root);
        ctx.cam.set({ pos: cp.clone().addScaledVector(f, i === 1 ? 1.0 : 0.6).add(V(0.1, 0.08, 0)), look: cp, fov: 36 });
      } else if (i === 5) {
        const hp = headPos(me, 0.3);
        ctx.cam.set({ pos: hp.clone().addScaledVector(F.fwd, 0.62), look: hp, fov: 30 });
      } else {
        ctx.cam.set(i === 0 ? cams.board : i === 2 ? cams.med : cams.faceL);
        if (hit != null) burstAt(ctx, F(-0.22, TABLE_TOP + 0.01, 0.5), ctx.t, hit);
      }
      ctx.cam.shake(0.08, ctx.t, i);
    },
  })),
  // ── b04 "A traffic cone retired. Huge party."  41 YEARS OF SERVICE
  {
    name: 'cone retires', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      setProps3EnvIntensity(0.6);
      const F = frameAt(ctx, 'street.crowdB');
      const P = ctx.props;
      ctx.add(P.cone); P.cone.position.copy(F(0, 0, 3.2)); P.cone.rotation.set(0, F.yaw, 0); P.cone.scale.setScalar(1.25);
      ctx.add(P.coneHat, P.cone); P.coneHat.position.set(0, P.cone.userData.hatY ?? 0.44, 0); P.coneHat.scale.setScalar(P.cone.userData.hatScale ?? 0.45); P.coneHat.rotation.set(0, 0, 0.15);
      ctx.add(P.cake.root); P.cake.root.position.copy(F(0.5, 0, 3.3)); P.cake.root.rotation.set(0, F.yaw, 0);
      ctx.add(P.retireSign); P.retireSign.position.copy(F(-0.55, 0, 3.0)); P.retireSign.rotation.set(0, F.yaw + 0.2, 0);
      ctx.place('x01', F(-1.0, 0, 2.6)); ctx.cast.x01.root.rotation.set(0, F.yaw + 0.5, 0);
      ctx.place('x02', F(1.05, 0, 2.6)); ctx.cast.x02.root.rotation.set(0, F.yaw - 0.5, 0);
      ctx.place('x04', F(0.25, 0, 1.9)); ctx.cast.x04.root.rotation.set(0, F.yaw, 0);
      ['x01', 'x02', 'x04'].forEach((id) => ctx.cast[id].setAccessory?.('partyHat', true));
      const crowd = crowdGrid(ctx, EXTRA_IDS.slice(6, 18), 'street.crowdB', { cols: 6, dx: 1.3, dz: 1.2, seed: 6, hats: true, offset: [0, 0, -0.6], rowDir: -1 });
      ctx.store = { F, crowd };
    },
    update(ctx) {
      const { F, crowd } = ctx.store;
      ctx.props.cake.update?.(ctx.t);
      ctx.cast.x01.pose('idle', ctx.t); ctx.cast.x01.face('sad', ctx.t);
      ctx.cast.x02.pose('idle', ctx.t, { headPitch: 0.3 }); ctx.cast.x02.face('sad', ctx.t + 1);
      ctx.cast.x04.pose('clap', ctx.t); ctx.cast.x04.face('smile', ctx.t);
      animateCrowd(crowd, ctx.t);
      const th = ctx.markers.hugeParty;
      const close = { pos: F(0.25, 0.95, 5.5), look: F(0, 0.55, 3.15), fov: 40 };
      if (ctx.t < th) ctx.cam.set(close);
      else ctx.cam.move(close, { pos: F(0, 3.4, 10.5), look: F(0, 1.0, 0.5), fov: 48 }, clamp((ctx.t - th) / 0.7, 0, 1), ease.outCubic);
      tag(ctx, '41 YEARS OF SERVICE', ctx.markers.tag41, th + 0.2, { y: 0.24 });
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
      const st = ctx.store = kidNook(ctx);
      const T = ctx.props.toaster, sw = ctx.props.toasterSweat;
      ctx.add(sw, T.sweatSpot); sw.position.set(0, 0, 0.02);
      st.T = T;
    },
    update(ctx) {
      const { F, T } = ctx.store, me = ctx.cast.me;
      me.pose('sitIdle', 0, { hands: 'table', headPitch: 0.2, intensity: 0 }); me.face('determined', OPEN(me));
      const tp = ctx.markers.pop, tf = ctx.markers.fear;
      const k = ctx.t - tp;
      T.setTremble(ctx.t, k > 0 ? 0.004 : 0.008 + 0.012 * clamp((ctx.t - ctx.time('b06')) / 1.4, 0, 1));
      T.setLever(k > 0 ? 1 : 0);
      T.toast.position.y = T.toastRestY + (k > 0 ? Math.min(1.4, 4.2 * k - 2.5 * k * k) : 0);
      ctx.props.toasterSweat.visible = ctx.t > tf - 0.1;
      const tc = T.root.position.clone().add(V(0, 0.15, 0));
      const hp = headPos(me, 0.3);
      if (ctx.t < tp) ctx.cam.set({ pos: tc.clone().addScaledVector(F.fwd, 0.95).addScaledVector(F.left, 0.22).add(V(0, 0.12, 0)), look: tc.clone().lerp(hp, 0.5), fov: 40 });
      else ctx.cam.set({ pos: F(0.55, 1.3, 1.55), look: F(0.05, 1.08, 0.4), fov: 42 });
      if (k > 0 && k < 0.25) ctx.cam.shake(0.25, ctx.t, 6);
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
      ctx.props.wallCrack.setGrowth(0);
      ctx.cam.move({ pos: W(0, 1.75, 4.0), look: W(0, 1.3, 0), fov: 46 }, { pos: W(0.15, 1.7, 3.1), look: W(0, 1.35, 0), fov: 44 }, u);
      daysTag(ctx, 112, -1);
    },
  },
  // ── b08 "It cracked first."  /  b09 HUSS ×3 — a new branch per HUSS
  {
    name: 'wall cracks', start: 'b08-0.1', set: 'room',
    setup(ctx) { ctx.store = wallScene(ctx); },
    update(ctx) {
      const { W, eyeY } = ctx.store, me = ctx.cast.me;
      const hits = ctx.hussTimes('b09').map((h) => h + 0.03);
      const n = hits.filter((h) => h <= ctx.t).length;
      const g = ctx.t < ctx.markers.cracked ? 0 : [0.375, 0.625, 0.875, 1][n];
      ctx.props.wallCrack.setGrowth(g);
      if (ctx.t < ctx.time('b09') - 0.12) {
        me.pose('idle', 0, { intensity: 0 }); me.face('neutral', OPEN(me));
        const k = clamp((ctx.t - ctx.markers.cracked) / 0.25, 0, 1);
        ctx.cam.set({ pos: W(1.3 - 0.15 * k, eyeY + 0.08, 1.5 - 0.3 * k), look: W(0.38, eyeY - 0.02, 0.05), fov: 40 });
        if (k > 0 && k < 1) ctx.cam.shake(0.3, ctx.t, 8);
      } else {
        me.pose('slam', ctx.t, { hits, slamTarget: W(-0.1, eyeY - 0.3, 0.05) }); me.face(n % 2 ? 'huss' : 'shocked', OPEN(me));
        const cams = [{ pos: W(1.25, eyeY + 0.1, 1.9), look: W(0.45, eyeY - 0.1, 0) }, { pos: W(0.95, eyeY + 0.65, 2.1), look: W(0.4, eyeY - 0.15, 0) }, { pos: W(1.55, eyeY - 0.1, 1.55), look: W(0.5, eyeY, 0) }];
        const c = cams[Math.max(0, n - 1)];
        ctx.cam.set({ ...c, fov: 42 });
        ctx.cam.punch(hits, ctx.t, 0.12, 0.2); ctx.cam.shake(0.12, ctx.t, 9);
      }
      daysTag(ctx, 112, -1);
    },
  },
  // ── b10 quote: "Eyes are windows. Never close a window." … — a burglar (who waves)
  {
    name: 'burglar card', start: 'b10-0.1', set: 'town',
    setup(ctx) { partyTown(ctx, { fireworks: false }); ctx.store = burglarScene(ctx); },
    update(ctx) {
      const { W, b, front } = ctx.store;
      b.pose('peer', ctx.t, { lookAt: W.origin }); b.face('squint', ctx.t);
      const bp = b.root.position;
      ctx.cam.set({ pos: bp.clone().addScaledVector(front.fwd, 5.0).addScaledVector(front.left, -1.2).add(V(0, 1.4, 0)), look: bp.clone().add(V(0, 2.4, 0)), fov: 50 });
      quoteCard(ctx, 'Eyes are windows. Never close a window.', null, ctx.markers.quote1, ctx.markers.quote1end + 0.08, { y: 0.34 });
    },
  },
  {
    name: 'burglar reveal', start: 'quote1end+0.08', set: 'town',
    setup(ctx) { partyTown(ctx, { fireworks: false }); ctx.store = burglarScene(ctx, true); },
    update(ctx, lt) {
      const { b, front } = ctx.store;
      b.pose('wave', ctx.t); b.face('smile', ctx.t);
      const hp = headPos(b, 0.25);
      ctx.cam.move({ pos: hp.clone().addScaledVector(front.fwd, 3.6).add(V(0, -0.3, 0)), look: hp.clone().add(V(0, -0.55, 0)), fov: 42 },
        { pos: hp.clone().addScaledVector(front.fwd, 3.1).add(V(0, -0.25, 0)), look: hp.clone().add(V(0, -0.5, 0)), fov: 40 }, clamp(lt / 1.5, 0, 1));
      tag(ctx, 'A BURGLAR', ctx.time('b10.w7'), Infinity, { y: 0.17, bg: 'rgba(0,0,0,0.85)' });
    },
  },
  // ── b11 "Then came the Summer Party Staring Contest."
  {
    name: 'contest establishing', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      ctx.store = contestStage(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 24).add(V(0, 11, 0)), look: c.clone().add(V(0, 2, 0)), fov: 44 };
      ctx.store.to = { pos: cam, look: ctx.point('square.stage').add(V(0, 1.2, 0)), fov: 48 };
    },
    update(ctx, lt, u) {
      const st = ctx.store;
      contestAnim(ctx, st);
      st.me.pose('sitIdle', ctx.t, {}); st.me.face('determined', OPEN(st.me)); st.cat.pose('stare', ctx.t); st.cat.face('stare', OPEN(st.cat));
      ctx.cam.move(st.from, st.to, u, ease.inOutCubic);
    },
  },
  // ── b12 "Defending champion? My own cat. Nine lives. Zero blinks."
  {
    name: 'defending champion', start: 'b12-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); },
    update(ctx) {
      const st = ctx.store, me = st.me, cat = st.cat;
      contestAnim(ctx, st);
      me.pose('sitIdle', 0, { hands: 'table', intensity: 0 }); me.face('determined', OPEN(me));
      cat.pose('stare', 0); cat.face('stare', OPEN(cat));
      const tm = ctx.markers.myCat, tn = ctx.markers.nine;
      if (ctx.t < tm) ctx.cam.set(C.kidCU(st));
      else if (ctx.t < tn) {
        boomCam(ctx, tm, C.catCU(st), C.catECU(st));
        tag(ctx, 'UNDEFEATED', tm + 0.15, tn, { y: 0.24, bg: 'rgba(200,140,0,0.9)' });
      } else ctx.cam.set(C.ots(st));
      scoreboard(ctx, 0);
    },
  },
  // ── b13 quote: "Your eyes have the right to remain open." … — my cat's lawyer
  {
    name: 'lawyer card', start: 'b13-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); lawyerIn(ctx, ctx.store); },
    update(ctx) {
      const st = ctx.store;
      contestAnim(ctx, st);
      st.me.pose('sitIdle', 0, { tableY: st.tableY, intensity: 0 }); st.me.face('determined', OPEN(st.me)); st.cat.pose('stare', 0); st.cat.face('stare', OPEN(st.cat));
      ctx.cast.lawyer.pose('crossArms', ctx.t); ctx.cast.lawyer.face('smug', ctx.t);
      ctx.cam.set(C.ots(st));
      quoteCard(ctx, 'Your eyes have the right to remain open.', null, ctx.markers.quote2, ctx.markers.quote2end + 0.05, { y: 0.32 });
    },
  },
  {
    name: 'lawyer reveal', start: 'quote2end+0.05', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); lawyerIn(ctx, ctx.store); },
    update(ctx, lt) {
      const st = ctx.store, L = ctx.cast.lawyer;
      contestAnim(ctx, st);
      st.me.pose('sitIdle', 0, { tableY: st.tableY, intensity: 0 }); st.me.face('determined', OPEN(st.me)); st.cat.pose('stare', 0); st.cat.face('smug', OPEN(st.cat));
      L.pose('crossArms', ctx.t); L.face('smug', ctx.t);
      const lp = headPos(L, 0.1), cp = catFace(st.cat);
      const look = lp.clone().lerp(cp, 0.45);
      ctx.cam.move({ pos: look.clone().addScaledVector(st.FT.left, 2.4).add(V(0, 0.05, 0)), look, fov: 40 },
        { pos: look.clone().addScaledVector(st.FT.left, 2.05).add(V(0, 0.05, 0)), look, fov: 38 }, clamp(lt / 1.0, 0, 1));
      tag(ctx, "MY CAT'S LAWYER", ctx.time('b13.w8'), Infinity, { y: 0.24 });
      scoreboard(ctx, 0);
    },
  },
  // ── b14 HUSS ×6 — western cut-backs between the eyes, sweat builds
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `staredown huss #${i + 1}`, start: i === 0 ? 'b14.h0-0.12' : `b14.h${i}-0.03`, set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx); },
    update(ctx) {
      const st = ctx.store, me = st.me, cat = st.cat;
      const hits = ctx.hussTimes('b14').map((h) => h + 0.03);
      const n = hits.filter((h) => h <= ctx.t).length;
      contestAnim(ctx, st, { crowd: i === 2 ? 'peer' : 'mixed', hits });
      me.pose('sitSlam', ctx.t, { hits }); me.face(n % 2 ? 'huss' : 'determined', OPEN(me));
      cat.pose('stare', 0); cat.face('stare', OPEN(cat));
      sweat(ctx, me, Math.max(0, n - 1));
      if (i === 0) ctx.cam.set(C.kidCU(st));
      if (i === 1) ctx.cam.set(C.catCU(st));
      if (i === 2) { const F = frameAt(ctx, 'square.standA'); ctx.cam.set({ pos: F(0, 2.4, 5.0), look: F(0, 2.0, 0), fov: 42 }); }
      if (i === 3) ctx.cam.set(C.kidECU(st));
      if (i === 4) ctx.cam.set(C.catECU(st));
      if (i === 5) ctx.cam.set(C.ots(st));
      ctx.cam.punch(hits, ctx.t, 0.12, 0.18); ctx.cam.shake(0.1, ctx.t, 40 + i);
      scoreboard(ctx, 0);
    },
  })),
  // ── b15 "Four hours. DJ Hip Replacement fell asleep."
  {
    name: 'four hours', start: 'b15-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx, { night: true }); ctx.set.set?.('crowdMotion', 0.15); },
    update(ctx) {
      const st = ctx.store;
      contestAnim(ctx, st, { djAsleep: ctx.t > ctx.markers.asleep - 0.5, still: true });
      st.me.pose('sitIdle', 0, { tableY: st.tableY, intensity: 0 }); st.me.face('sweat', OPEN(st.me)); sweat(ctx, st.me, 6);
      st.cat.pose('stare', 0); st.cat.face('stare', OPEN(st.cat));
      const d = ctx.t - ctx.markers.fourHours;
      if (ctx.t < ctx.time('b15.w2') - 0.08) {
        ctx.cam.set(C.wide(st));
        ctx.fx.overlay('#2a1a6a', 0.55);
        ctx.fx.text('4 HOURS\nLATER', { y: 0.38, size: 190, fill: '#ffe14a', stroke: '#3a1a00', scale: d < 0.2 ? Math.max(0.01, ease.outBack(clamp(d / 0.2, 0, 1))) : 1, rot: -0.05 });
        ctx.caption.hide(true);
      } else {
        const g = ctx.cast.gerald, gp = headPos(g, 0.25);
        ctx.cam.set({ pos: gp.clone().addScaledVector(st.FT.left, 1.7).addScaledVector(st.FT.fwd, 0.5).add(V(0, 0.1, 0)), look: gp.clone().add(V(0, -0.3, 0)), fov: 42 });
        tag(ctx, 'DJ HIP REPLACEMENT (91)', ctx.time('b15.w2'), Infinity, { y: 0.24, size: 58 });
        if (ctx.t > ctx.markers.asleep) tag(ctx, 'Z z z', ctx.markers.asleep, Infinity, { x: 0.68, y: 0.36, size: 90, bg: null, fill: '#ffffff', rot: -0.2 });
      }
    },
  },
  // ── b16 quote: "Blinking is a nap for cowards." … — my grandad, mid-nap
  {
    name: 'grandad card', start: 'b16-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx, { night: true }); ctx.set.set?.('crowdMotion', 0.15); },
    update(ctx) {
      const st = ctx.store;
      contestAnim(ctx, st, { djAsleep: true, still: true });
      st.me.pose('sitIdle', 0, { tableY: st.tableY, intensity: 0 }); st.me.face('sweat', OPEN(st.me)); sweat(ctx, st.me, 6);
      st.cat.pose('stare', 0); st.cat.face('stare', OPEN(st.cat));
      ctx.cam.set(C.kidCU(st));
      quoteCard(ctx, 'Blinking is a nap for cowards.', null, ctx.markers.quote3, ctx.markers.quote3end + 0.05, { y: 0.32 });
    },
  },
  {
    name: 'grandad reveal', start: 'quote3end+0.05', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx, { night: true }); ctx.set.set?.('crowdMotion', 0.15); },
    update(ctx, lt) {
      const st = ctx.store;
      contestAnim(ctx, st, { djAsleep: true, grandadAsleep: true, still: true });
      const g = ctx.cast.grandad, gp = headPos(g, 0.25);
      const F = frameAt(ctx, 'square.standA');
      ctx.cam.move({ pos: gp.clone().addScaledVector(F.fwd, 2.6).add(V(0.2, 0.15, 0)), look: gp, fov: 36 }, { pos: gp.clone().addScaledVector(F.fwd, 2.1).add(V(0.2, 0.1, 0)), look: gp, fov: 34 }, clamp(lt / 1.4, 0, 1));
      tag(ctx, 'MY GRANDAD (MID-NAP)', ctx.time('b16.w6'), Infinity, { y: 0.24 });
      tag(ctx, 'Z z z', ctx.time('b16.w6') + 0.3, Infinity, { x: 0.66, y: 0.34, size: 90, bg: null, fill: '#ffffff', rot: -0.2 });
    },
  },
  // ── b17 HUSS ×3 — the cat's eye twitches, sweat on both
  ...[0, 1, 2].map((i) => ({
    name: `twitch huss #${i + 1}`, start: i === 0 ? 'b17.h0-0.12' : `b17.h${i}-0.03`, set: 'town',
    setup(ctx) {
      ctx.store = contestStage(ctx, { night: true });
      const cat = ctx.cast.cat, d = ctx.props.catDrop;
      ctx.add(d, cat.joints.head); d.position.set(0.12, 0.2, 0.12);
    },
    update(ctx) {
      const st = ctx.store, me = st.me, cat = st.cat;
      const hits = ctx.hussTimes('b17').map((h) => h + 0.03);
      contestAnim(ctx, st, { djAsleep: true, still: true, hits });
      me.pose('sitSlam', ctx.t, { hits }); me.face(i === 1 ? 'huss' : 'sweat', OPEN(me)); sweat(ctx, me, 7 + i);
      cat.pose('stare', 0); cat.face(i >= 1 ? 'squint' : 'stare', OPEN(cat));
      ctx.props.catDrop.visible = i >= 1;
      if (i === 0) ctx.cam.set(C.kidECU(st));
      if (i === 1) ctx.cam.set(C.catECU(st));
      if (i === 2) ctx.cam.set(C.wide(st));
      ctx.cam.punch(hits, ctx.t, 0.14, 0.18); ctx.cam.shake(0.16, ctx.t, 60 + i);
      scoreboard(ctx, 0);
    },
  })),
  // ── b18 "Then the cat blinked."  (music out) → CAT 1
  {
    name: 'cat blinks', start: 'b18-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx, { night: true }); ctx.set.set?.('crowdMotion', 0); },
    update(ctx, lt) {
      const st = ctx.store, cat = st.cat, tb = ctx.markers.catBlink;
      contestAnim(ctx, st, { djAsleep: true, still: true, crowd: 'peer' });
      st.me.pose('sitIdle', 0, { tableY: st.tableY, intensity: 0 }); st.me.face('shocked', OPEN(st.me)); sweat(ctx, st.me, 8);
      const shut = ctx.t > tb && ctx.t < tb + 0.32;
      cat.pose('stare', 0); cat.face('stare', shut ? SHUT(cat) : OPEN(cat));
      ctx.cam.move(C.catCU(st), C.catECU(st), clamp(lt / 1.4, 0, 1), ease.inOutQuad);
      scoreboard(ctx, ctx.t > tb ? 1 : 0);
      if (ctx.t > tb) tag(ctx, 'BLINK DETECTED', tb + 0.05, Infinity, { y: 0.26, size: 64, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b19 "Top ten respectful moments. Number seven: he let me win."  /  b20 "That's cat for good game."
  {
    name: 'he let me win', start: 'b19-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx, { night: true }); },
    update(ctx) {
      const st = ctx.store, cat = st.cat;
      const tw = ctx.time('b19.w6');
      contestAnim(ctx, st, { crowd: ctx.t > tw ? 'cheer' : 'peer', djAsleep: true });
      st.me.pose('sitIdle', ctx.t, {}); st.me.face('shocked', OPEN(st.me));
      cat.pose('stare', 0); cat.face('smug', OPEN(cat));
      ctx.cam.set(C.catCU(st));
      top10Card(ctx, 7, ctx.time('b19') + 0.05, Infinity, { popAt: ctx.markers.top7 });
    },
  },
  {
    name: 'cat for good game', start: 'b20-0.1', set: 'town',
    setup(ctx) { ctx.store = contestStage(ctx, { night: true }); },
    update(ctx) {
      const st = ctx.store, cat = st.cat;
      contestAnim(ctx, st, { crowd: 'cheer', djAsleep: true });
      st.me.pose('sitIdle', ctx.t, {}); st.me.face('smile', OPEN(st.me));
      const t0 = ctx.time('b20') + 0.35;
      const slow = ctx.t > t0 && ctx.t < t0 + 0.7;
      cat.pose('stare', 0); cat.face(slow ? 'sleepy' : 'smile', ctx.t > t0 + 0.2 && ctx.t < t0 + 0.5 ? SHUT(cat) : OPEN(cat));
      const cp = catFace(cat);
      ctx.cam.set({ pos: cp.clone().addScaledVector(st.FT.fwd, -0.42).addScaledVector(st.FT.left, 0.18).add(V(0, 0.03, 0)), look: cp, fov: 32 });
      tag(ctx, '(cat for GG)', ctx.time('b20.w2'), Infinity, { y: 0.24, size: 56 });
    },
  },
  // ── b21 mayor: "Say cheese!" → flash
  {
    name: 'say cheese', start: 'b21-0.1', set: 'town',
    setup(ctx) { ctx.store = photoScene(ctx); },
    update(ctx) {
      const st = ctx.store, me = st.me, m = ctx.cast.mayor;
      contestAnim(ctx, st, { crowd: 'cheer', djAsleep: true });
      me.pose('cheer', 0.45, { intensity: 0.6 }); me.face('smile', OPEN(me));
      holdTrophy(ctx, me, ctx.props.trophy);
      m.pose('point', ctx.t); m.face('grin', ctx.t);
      const d = ctx.t - ctx.markers.flash;
      ctx.props.photoCam.userData.setFlash?.(d > 0 ? clamp(1 - d / 0.4, 0, 1) : 0);
      ctx.cam.set({ pos: st.FA(-1.15, 1.75, -4.4), look: st.FA(0.2, 1.25, -0.9), fov: 46 });
      if (d > 0) ctx.fx.overlay('#ffffff', clamp(1 - d / 0.35, 0, 1));
    },
  },
  // ── b22 "I blinked."  — freeze-frame polaroid, eyes shut
  {
    name: 'i blinked', start: 'flash+0.12', set: 'town',
    setup(ctx) { ctx.store = photoScene(ctx); },
    update(ctx) {
      const st = ctx.store, me = st.me;
      contestAnim(ctx, st, { crowd: 'cheer', djAsleep: true, still: true });
      me.pose('cheer', 0.45, { intensity: 0.6 }); me.face('smile', SHUT(me));
      holdTrophy(ctx, me, ctx.props.trophy);
      st.cat.pose('stare', 0); st.cat.face('smug', OPEN(st.cat));
      const hp = headPos(me, 0.1), f = facing(me.root);
      ctx.cam.set({ pos: hp.clone().addScaledVector(f, 2.5).add(V(0, 0.05, 0)), look: hp.clone().add(V(0, -0.2, 0)), fov: 40, roll: -0.05 });
      const d = ctx.t - ctx.markers.flash;
      ctx.fx.overlay('#fff4d8', 0.12);
      ctx.fx.draw((g, W, H) => { g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, W, 48); g.fillRect(0, 0, 48, H); g.fillRect(W - 48, 0, 48, H); g.fillRect(0, H * 0.79, W, H * 0.21); });
      ctx.fx.text('NEVER BLINKED*', { y: 0.845, size: 84, fill: '#1d1d22', stroke: '#fbfaf5', line: 2, rot: -0.03 });
      ctx.fx.text('*blinked', { y: 0.905, size: 44, fill: '#c0392b', stroke: '#fbfaf5', line: 2, rot: -0.03 });
      if (d < 0.3) ctx.fx.overlay('#ffffff', clamp(1 - d / 0.3, 0, 1) * 0.8);
      daysTag(ctx, 0, ctx.markers.iBlinked);
    },
  },
  // ── b23 "They built me a statue. Eyes closed."  /  b24 HUSS ×3  /  b25 "It cracked first."
  {
    name: 'the statue', start: 'b23-0.1', set: 'town',
    setup(ctx) { ctx.store = statueScene(ctx); },
    update(ctx) {
      const { Fb, h } = ctx.store, s = ctx.cast.meStone, me = ctx.cast.me, P = ctx.props;
      s.pose('cheer', 0.45, { intensity: 0.6 }); s.face('smile', SHUT(s));
      holdTrophy(ctx, s, P.trophyStone);
      me.pose('idle', ctx.t, { intensity: 0.3, lookAt: headPos(s, 0.3) }); me.face('neutral', OPEN(me));
      P.statueCrack.setGrowth(0); P.chip.visible = false;
      ctx.cam.move({ pos: Fb(0.4, 1.4, 6.0), look: Fb(0, h + 1.1, 0), fov: 44 }, { pos: Fb(0.5, 1.6, 4.6), look: Fb(0, h + 1.2, 0), fov: 42 }, ctx.progress('b23', 'b24'));
      tag(ctx, 'EYES CLOSED', ctx.time('b23.w5'), Infinity, { y: 0.24 });
    },
  },
  ...[0, 1, 2].map((i) => ({
    name: `statue huss #${i + 1}`, start: i === 0 ? 'b24.h0-0.12' : `b24.h${i}-0.03`, set: 'town',
    setup(ctx) { ctx.store = statueScene(ctx); },
    update(ctx) {
      const s = ctx.cast.meStone, me = ctx.cast.me, P = ctx.props;
      const hs = ctx.hussTimes('b24').map((x) => x + 0.03);
      const n = hs.filter((x) => x <= ctx.t).length;
      s.pose('cheer', 0.45, { intensity: 0.6 }); s.face('smile', SHUT(s));
      holdTrophy(ctx, s, P.trophyStone);
      me.pose('idle', 0, { intensity: 0, lookAt: headPos(s, 0.3) }); me.face('shocked', OPEN(me));
      P.statueCrack.setGrowth([0, 0.375, 0.625, 0.875][n]); P.chip.visible = false;
      const sp = headPos(s, 0.3), f = facing(s.root);
      const dist = [1.9, 1.35, 0.95][i];
      ctx.cam.set({ pos: sp.clone().addScaledVector(f, dist).add(V(0, -0.05, 0)), look: sp, fov: 34 });
      ctx.cam.punch(hs, ctx.t, 0.12, 0.2); ctx.cam.shake(0.12, ctx.t, 80 + i);
    },
  })),
  {
    name: 'it cracked first', start: 'b25-0.1', set: 'town',
    setup(ctx) { ctx.store = statueScene(ctx); },
    update(ctx) {
      const { Fb, h } = ctx.store, s = ctx.cast.meStone, me = ctx.cast.me, P = ctx.props;
      s.pose('cheer', 0.45, { intensity: 0.6 }); s.face('smile', SHUT(s));
      holdTrophy(ctx, s, P.trophyStone);
      me.pose('idle', 0, { intensity: 0, lookAt: headPos(s, 0.3) }); me.face('shocked', OPEN(me));
      const tc = ctx.markers.cracked2, kc = clamp((ctx.t - tc) / 0.7, 0, 1);
      P.statueCrack.setGrowth(ctx.t > tc ? 1 : 0.875);
      P.chip.visible = ctx.t > tc - 0.02 && kc < 1;
      P.chip.position.set(0.1, 0.42 - 3.0 * kc * kc, 0.3 + 0.25 * kc); P.chip.rotation.set(kc * 5, kc * 3, 0);
      const sp = headPos(s, 0.3), f = facing(s.root);
      if (ctx.t < tc + 0.5) ctx.cam.set({ pos: sp.clone().addScaledVector(f, 0.95).add(V(0, -0.05, 0)), look: sp, fov: 34 });
      else ctx.cam.move({ pos: sp.clone().addScaledVector(f, 0.95), look: sp, fov: 34 }, { pos: Fb(1.6, 1.5, 4.2), look: Fb(0.4, h + 1.0, 0), fov: 44 }, clamp((ctx.t - tc - 0.5) / 0.6, 0, 1), ease.inOutCubic);
      // end: iris out to black
      const tEnd = ctx.time('b25.end') + 0.15;
      const k = clamp((ctx.t - tEnd) / 0.45, 0, 1);
      if (k > 0) ctx.fx.draw((g, W, H) => {
        const r = Math.hypot(W, H) * 0.6 * (1 - k);
        g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * 0.42, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore();
      });
    },
  },
];

// ── scenes ──────────────────────────────────────────────────────────────────────────────────────
/** The bedroom back wall beside the window; the kid stands facing it. W: origin on the wall at floor
 *  level, +z out of the wall into the room, +x along the wall. */
function wallScene(ctx) {
  setProps3EnvIntensity(0.45);
  ctx.set.setLighting?.('night'); ctx.set.set?.('window', 'party');
  // the blank white board on the back wall (room-local x 0.55, back wall at z −2.1, board face at −2.089)
  const R = ctx.set.root; R.updateMatrixWorld(true);
  const yaw = yawOf(R);
  const W = frame(R.localToWorld(V(0.32, 0, -2.089)), yaw);
  ctx.place('me', W(0, 0, 0.45)); ctx.cast.me.root.rotation.set(0, yaw + Math.PI, 0);
  const me = ctx.cast.me; me.pose('idle', 0, { intensity: 0 });
  const eyeY = headPos(me, 0.3).y;
  const cr = ctx.props.wallCrack; ctx.add(cr.root);
  cr.root.position.copy(W(0.3, eyeY + 0.04, 0.006)); cr.root.rotation.set(0, yaw, 0);
  return { W, eyeY };
}

function burglarScene(ctx, facingCam = false) {
  const W = frameAt(ctx, 'myHouse.window'), front = frameAt(ctx, 'myHouse.front');
  const b = ctx.cast.burglar;
  ctx.place('burglar', front.origin.clone().addScaledVector(front.left, 1.4).addScaledVector(front.fwd, 0.6));
  b.root.rotation.set(0, front.yaw + (facingCam ? 0 : Math.PI), 0);
  const sack = ctx.props.sack;
  ctx.add(sack, b.joints.torso); sack.rotation.set(2.4, 0, 0.2); sack.position.set(-0.18, 0.55, -0.22);
  return { W, front, b };
}

function lawyerIn(ctx, st) {
  ctx.place('lawyer', st.FT(-0.85, -TABLE_TOP, 0.5)); ctx.cast.lawyer.root.rotation.set(0, st.audYaw, 0);
  const bc = ctx.props.briefcase; ctx.add(bc); bc.position.copy(st.FT(-0.75, -TABLE_TOP, 0.92)); bc.rotation.set(0, st.audYaw + 0.3, 0);
}

function photoScene(ctx) {
  const st = contestStage(ctx, { night: true });
  setProps3EnvIntensity(0.7);
  const me = st.me;
  ctx.place('me', st.FA(0.35, 0, -0.75)); me.root.rotation.set(0, st.FA.yaw + Math.PI, 0);   // standing, facing the camera
  const cam = ctx.props.photoCam; ctx.add(cam); cam.position.copy(st.FA(0.35, 0, -3.3)); cam.rotation.set(0, st.FA.yaw, 0);
  ctx.place('mayor', st.FA(1.1, 0, -3.5)); ctx.cast.mayor.root.rotation.set(0, st.FA.yaw - 0.35, 0);
  return st;
}

function statueScene(ctx) {
  setProps3EnvIntensity(1);
  ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  const base = ctx.point('park.table').clone().lerp(ctx.point('park.tree'), 0.45).setY(ctx.point('park.tree').y);
  const pc = ctx.point('park.cam');
  const tt = ctx.point('park.tree').sub(ctx.point('park.table')).setY(0).normalize();
  let side = V(tt.z, 0, -tt.x); if (side.dot(V(pc.x - base.x, 0, pc.z - base.z)) < 0) side.negate();
  const Fb = frame(base, Math.atan2(side.x, side.z));   // +z: perpendicular to the table→tree line, on the park camera's side
  const P = ctx.props;
  ctx.add(P.plinth); P.plinth.position.copy(base); P.plinth.rotation.set(0, Fb.yaw, 0);
  const h = P.plinth.userData?.top ?? 0.45;
  const s = ctx.cast.meStone;
  ctx.place('meStone', Fb(0, h, 0)); s.root.rotation.set(0, Fb.yaw, 0);
  const cr = P.statueCrack; ctx.add(cr.root, s.joints.head);
  cr.root.position.set(0.09, 0.44, 0.286); cr.root.rotation.set(0, 0, 0);
  ctx.add(P.chip, s.joints.head);
  ctx.place('me', Fb(1.15, 0, 0.85)); ctx.cast.me.root.rotation.set(0, Fb.yaw - Math.PI * 0.72, 0);
  return { Fb, h };
}
