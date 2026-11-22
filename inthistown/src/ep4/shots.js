// In This Town — Episode 4: "Pigeon for Mayor".  The mayor's pigeon narrates.
// Film contract: SPEC.md §8.  Timeline: episodes/ep4/timeline.json (audio/build_episode.py ep4).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { PIGEON_STRUT_SPEED } from '../characters.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { makeBalloon, makePartyHat } from '../props.js';
import { init as initEp1, V, TABLE_TOP, headPos, frame, frameAt, roomNook, nookCams, lastBefore, partyTown, makeCar } from '../shots.js';
import { makeMicStand, makeTopHatProp, TOPHAT_MATCH_SCALE } from '../ep2/props2.js';
import { makeSign } from '../ep3/props3.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const PCOL = ['#a3b0c6', '#8f9db5', '#b6a99a', '#9aa7a0', '#c4c8d2', '#7f8aa0'];
const HATC = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff'];
const partyPigeons = {};
for (let i = 1; i <= 6; i++) partyPigeons[`p${i}`] = { creature: 'pigeon', id: `p${i}`, color: PCOL[i - 1], scale: 0.9 + 0.08 * hash(i) };
export const cast = {
  pigeon: { ...MAIN.pigeon, scale: 1.1 },
  uncle: { creature: 'pigeon', id: 'uncle', color: '#6b7486', scale: 1.35 },
  mayor: MAIN.mayor, cat: MAIN.cat, grandad: MAIN.grandad, marcus: MAIN.marcus, brenda: MAIN.brenda,
  ...partyPigeons,
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 4, banner: ['SUMMER PARTY', 'ELECTION', 'VOTE!'] }),
  townNP: () => buildTown({ seed: 4, banner: ['NO MORE', 'PARTIES', 'BY ORDER OF PIGEON'] }),
  room: () => buildRoom({ variant: 'hero', poster: 'knight', window: 'party' }),
  roomG: () => buildRoom({ variant: 'grandad', window: 'dark' }),
  roomM: () => buildRoom({ variant: 'marcus', window: 'dark' }),
  roomB: () => buildRoom({ variant: 'brenda', window: 'dark' }),
};

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  const HS = TOPHAT_MATCH_SCALE * 1.05;
  P.bigHat = makeTopHatProp({ scale: HS }); P.bigHatScale = HS;
  P.tinyHat = makePartyHat('#ffd23f'); P.tinyHat.scale.setScalar(0.45);
  P.voteSign = makeSign({ lines: ['VOTE', 'PIGEON'], w: 0.6, h: 0.4, color: '#ffffff', ink: ['#c0392b', '#1d3a8a'] });
  P.bdaySign = makeSign({ lines: ['HAPPY BDAY', 'PIGEON'], w: 0.7, h: 0.38, color: '#ffd23f' });
  P.backSign = makeSign({ lines: ['BACK AFTER', 'THE PARTY'], w: 0.6, h: 0.36, color: '#fff4e0' });
  P.bigMic = makeMicStand({ height: 1.5 });
  P.lowMic = makeMicStand({ height: 0.42, tilt: 0.3 });
  P.tinyMic = makeMicStand({ height: 0.16, tilt: 0.2 }); P.tinyMic.scale.setScalar(0.8);
  P.balloon = makeBalloon('#ff4fa3', { string: 0.9 });
  P.uncleCar = makeCar('#4fb3ff');
  P.books = makeBooks();
  P.dumbbell = makeDumbbell();
  P.crumb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.022, 0.03), new THREE.MeshStandardMaterial({ color: '#d9a35a', roughness: 0.8 }));
  P.crumbs = makeCrumbs();
}
function makeBooks() {
  const g = new THREE.Group();
  [['#c0392b', 0.36, 0.0], ['#1d3a8a', 0.33, 0.12], ['#2e8b57', 0.3, -0.08]].forEach(([c, w, r], i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, w * 0.72), new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    b.position.y = 0.04 + i * 0.082; b.rotation.y = r; b.castShadow = true; g.add(b);
    const pg = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.066, w * 0.72 + 0.004), new THREE.MeshStandardMaterial({ color: '#f4efe2', roughness: 0.9 }));
    pg.position.set(0.012, b.position.y, 0); pg.rotation.y = r; g.add(pg);
  });
  g.userData.top = 0.246;
  return g;
}
function makeDumbbell() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#2a2a30', roughness: 0.5, metalness: 0.3 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10), m); bar.rotation.z = Math.PI / 2; g.add(bar);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.17, 0.17), m); w.position.x = s * 0.15; w.castShadow = true; g.add(w); }
  return g;
}
function makeCrumbs() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#d9a35a', roughness: 0.8 });
  for (let i = 0; i < 26; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.03), m);
    const a = hash(i * 1.7) * Math.PI * 2, r = 0.15 + 0.6 * hash(i * 2.3);
    c.position.set(Math.cos(a) * r, 0.01, Math.sin(a) * r); c.rotation.y = a; g.add(c);
  }
  return g;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0;
  if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.24, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.8)', rot: -0.03, ...o, scale: Math.max(0.01, pop) });
}
function pigeonFace(p) { p.root.updateMatrixWorld(true); return p.joints.head.localToWorld(V(0, 0.06, 0.07)); }
/** World position of a main-street lamp head plate (town-local x/z; the plate top is at curb + 4.3 + 0.05). */
function lampTop(ctx, x, z) { ctx.set.root.updateMatrixWorld(true); return ctx.set.root.localToWorld(V(x, 0.1 + 4.3 + 0.05, z)); }
const LAMP_A = [-9, -5.15], LAMP_B = [3, -5.15];
const towardStreet = V(0, 0, 1);   // north-side lamps face +Z (the street centre is z = 0)

/** The narrator under the big top hat: brim at `lift` above his feet, optional tilt (radians, forward). */
function hatOn(ctx, p, { lift = 0.08, tilt = 0, tiny = false, bob = 0 } = {}) {
  const P = ctx.props, h = P.bigHat;
  ctx.add(h); p.root.updateMatrixWorld(true);
  h.position.copy(p.root.position).add(up(lift + bob));
  h.rotation.set(tilt, p.root.rotation.y, 0);
  if (tiny) { ctx.add(P.tinyHat, h); P.tinyHat.position.set(0, 0.33, 0); P.tinyHat.rotation.set(0, 0, 0.2); P.tinyHat.scale.setScalar(0.45 / P.bigHatScale); }
}

function townParty(ctx, crowdOpts) {
  partyTown(ctx);
  return crowdOpts ? crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', crowdOpts) : null;
}
function quietTown(ctx, glow = 0.9) {
  ctx.set.setLighting?.('quiet_night');
  ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('windowGlow', glow);
}

/** The narrator on lamp B's head plate, facing the street. */
function onLamp(ctx, id, lamp, off = [0, 0, 0.16], yawOff = 0) {
  const top = lampTop(ctx, ...lamp);
  ctx.place(id, top.clone().add(V(off[0], off[1], off[2])));
  ctx.cast[id].root.rotation.set(0, Math.atan2(towardStreet.x, towardStreet.z) + yawOff, 0);
  return top;
}

// ── The election stage: crowd in both bleachers, mic at the stage front.  S: stage frame, +z = towards the audience.
function electionStage(ctx, { night = false, mayorAtMic = false, pigeonAtMic = false, mayorAside = false, hat = false } = {}) {
  ctx.set.setLighting?.(night ? 'quiet_night' : 'dusk');
  ctx.set.set?.('partyProps', !night); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('standsCrowd', true); ctx.set.set?.('crowdMotion', night ? 0 : 0.7);
  const crowd = [];
  const fill = (rows, ids, k0) => {
    if (!Array.isArray(rows)) return;
    let k = 0;
    rows.forEach((row) => {
      const w = row.userData?.width || 7.2, per = 7;
      for (let j = 0; j < per && k < ids.length; j++, k++) {
        const id = ids[k];
        ctx.place(id, row, { offset: [(j - (per - 1) / 2) * (w / per) + (hash(k + k0) - 0.5) * 0.2, 0, 0] });
        if (!night) ctx.cast[id].setAccessory?.('partyHat', true);
        crowd.push({ ch: ctx.cast[id], phase: hash(k * 3.1 + k0) * 3, k: k + k0 });
      }
    });
  };
  fill(ctx.anchor('square.standA.rows'), ['grandad', 'marcus', 'brenda', ...EXTRA_IDS.slice(0, 11)], 0);
  fill(ctx.anchor('square.standB.rows'), EXTRA_IDS.slice(11, 18), 50);
  const S = frameAt(ctx, 'square.stage');
  const st = { crowd, S };
  const P = ctx.props, m = ctx.cast.mayor, p = ctx.cast.pigeon;
  if (mayorAtMic) {
    ctx.add(P.bigMic); P.bigMic.position.copy(S(0, 0, 2.75)); P.bigMic.rotation.set(0, S.yaw + Math.PI, 0);
    ctx.place('mayor', S(0, 0, 2.4)); m.root.rotation.set(0, S.yaw, 0);
  }
  if (pigeonAtMic) {
    ctx.add(P.books); P.books.position.copy(S(0, 0, 2.45)); P.books.rotation.set(0, S.yaw, 0);
    ctx.add(P.lowMic); P.lowMic.position.copy(S(0, 0, 2.72)); P.lowMic.rotation.set(0, S.yaw + Math.PI, 0);
    ctx.place('pigeon', S(0, P.books.userData.top, 2.45)); p.root.rotation.set(0, S.yaw, 0);
    if (hat) hatOn(ctx, p);
  }
  if (mayorAside) { ctx.place('mayor', S(0.95, 0, 2.25)); m.root.rotation.set(0, S.yaw - 0.55, 0); }
  return st;
}
function crowdAnim(ctx, st, { mode = 'mixed', still = false } = {}) {
  const tc = still ? 2.0 : ctx.t;
  for (const c of st.crowd) {
    const a = mode === 'stunned' ? 'stunned' : mode === 'cheer' ? 'cheer' : mode === 'idle' ? 'idle' : (c.k % 2 ? 'cheer' : 'clap');
    c.ch.pose(a, tc + c.phase, still ? { intensity: 0.15 } : {});
    c.ch.face(mode === 'stunned' ? 'shocked' : mode === 'idle' ? 'neutral' : 'grin', ctx.t + c.phase);
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody parties. Even the pigeons."
  {
    name: 'party crane', start: 0, set: 'town',
    setup(ctx) {
      const crowd = townParty(ctx, { cols: 6, dx: 1.25, dz: 1.3, seed: 4, hats: true });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh');
      const d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store = { crowd, from: { pos: hi, look: c.clone().add(up(0.5)), fov: 50 }, to: { pos: c.clone().addScaledVector(d, 9).add(up(3.2)), look: ctx.point('street.crowdA').add(up(1.3)), fov: 42 } };
    },
    update(ctx, lt, u) { animateCrowd(ctx.store.crowd, ctx.t); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic); },
  },
  {
    name: 'party pigeons', start: 'pigeons-0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const top = lampTop(ctx, ...LAMP_A);
      [['p1', -0.17, 0.12, 0.35], ['p2', 0.0, 0.17, 0], ['p3', 0.17, 0.12, -0.35]].forEach(([id, x, z, yo], i) => {
        ctx.place(id, top.clone().add(V(x, 0, z))); ctx.cast[id].root.rotation.set(0, yo, 0);
        ctx.cast[id].setAccessory('partyHat', true); ctx.cast[id].setPartyHatColor?.(HATC[i]);
      });
      ctx.store = { top };
    },
    update(ctx) {
      const { top } = ctx.store;
      ['p1', 'p2', 'p3'].forEach((id, i) => { const p = ctx.cast[id]; p.pose('strut', ctx.t * 1.3 + i * 0.3, { speed: 1.2 }); p.face('grin', ctx.t); });
      ctx.cam.set({ pos: top.clone().add(V(0.4, -0.1, 2.3)), look: top.clone().add(V(0, 0.25, 0.1)), fov: 34 });
    },
  },
  // ── b02 "Except me."
  {
    name: 'except me', start: 'b02-0.1', set: 'town',
    setup(ctx) { partyTown(ctx); ctx.store = { top: onLamp(ctx, 'pigeon', LAMP_B) }; },
    update(ctx, lt) {
      const p = ctx.cast.pigeon, { top } = ctx.store;
      p.pose('idle', ctx.t, { intensity: 0.2, headYaw: lerp(0.9, 0, clamp(lt / 0.5, 0, 1)) }); p.face('determined', ctx.t);
      const pf = pigeonFace(p);
      ctx.cam.move({ pos: pf.clone().add(V(0.35, -0.05, 1.8)), look: pf.clone().add(up(-0.12)), fov: 34 }, { pos: pf.clone().add(V(0.2, 0.0, 1.35)), look: pf.clone().add(up(-0.1)), fov: 32 }, clamp(lt / 0.8, 0, 1));
    },
  },
  // ── b03 HUSS ×6 on the lamp; partygoers below look up
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `lamp huss #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const top = onLamp(ctx, 'pigeon', LAMP_B);
      const base = top.clone().setY(0.1);
      ['x01', 'x02', 'x03'].forEach((id, k) => { ctx.place(id, base.clone().add(V(-0.9 + 0.9 * k, 0, 1.4 + 0.3 * (k % 2)))); ctx.cast[id].setAccessory?.('partyHat', true); });
      ctx.store = { top, base };
    },
    update(ctx) {
      const p = ctx.cast.pigeon, { top, base } = ctx.store;
      const hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      p.pose('huss', ctx.t, { hits }); p.face('huss', ctx.t);
      ['x01', 'x02', 'x03'].forEach((id, k) => { const c = ctx.cast[id]; c.pose('peer', ctx.t + k, { lookAt: top }); c.face('shocked', ctx.t + k); });
      const pf = pigeonFace(p);
      if (i % 2 === 0) { const d = [1.15, 0.95, 0.75][i / 2]; ctx.cam.set({ pos: pf.clone().addScaledVector(towardStreet, d).add(V(0.15 - 0.1 * i, -0.04, 0)), look: pf.clone().add(up(-0.06)), fov: 34 }); }
      else ctx.cam.set({ pos: base.clone().add(V(i === 3 ? -1.6 : 1.6, 1.5, 4.2)), look: top.clone().add(up(-0.4)), fov: 44 });
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2); ctx.cam.shake(0.08, ctx.t, i);
    },
  })),
  // ── b04 "They did a conga at my birthday."  → "Without me."
  {
    name: 'pigeon conga', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const E = frameAt(ctx, 'pool.edge1');
      const c = E(0, 0, 1.2);
      const P = ctx.props;
      ctx.add(P.cake.root); P.cake.root.position.copy(c); P.cake.root.rotation.set(0, E.yaw, 0);
      ctx.add(P.bdaySign); P.bdaySign.position.copy(E(0, 0, 0.35)); P.bdaySign.rotation.set(0, E.yaw, 0); P.bdaySign.scale.setScalar(0.8);
      for (let i = 1; i <= 6; i++) { const p = ctx.cast[`p${i}`]; ctx.place(p, c); p.setAccessory('partyHat', true); p.setPartyHatColor?.(HATC[i - 1]); }
      [['x05', -1.45, 1.5, -1.2], ['x06', 1.45, 1.4, 1.2], ['x07', 0.95, 0.1, 2.6]].forEach(([id, x, z, yo]) => { ctx.place(id, E(x, 0, z)); ctx.cast[id].root.rotation.set(0, E.yaw + yo, 0); ctx.cast[id].setAccessory?.('partyHat', true); });
      ctx.store = { E, c };
    },
    update(ctx) {
      const { E, c } = ctx.store;
      ctx.props.cake.update?.(ctx.t);
      for (let i = 1; i <= 6; i++) {
        const p = ctx.cast[`p${i}`];
        const a = -ctx.t * 0.9 + i * (Math.PI * 2 / 6);
        p.root.position.copy(c).add(V(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62));
        p.root.rotation.set(0, Math.atan2(Math.sin(a), -Math.cos(a)), 0);
        p.pose('strut', ctx.t * 1.4 + i * 0.25, { speed: 1.3 }); p.face('grin', ctx.t + i);
      }
      ['x05', 'x06', 'x07'].forEach((id, k) => { ctx.cast[id].pose('clap', ctx.t + k * 0.4); ctx.cast[id].face('grin', ctx.t + k); });
      ctx.cam.set({ pos: E(0.3, 1.15, 3.9), look: E(0, 0.25, 1.15), fov: 40 });
    },
  },
  {
    name: 'without me (park)', start: 'without-0.05', set: 'town',
    setup(ctx) { ctx.store = parkPerch(ctx); },
    update(ctx, lt) {
      const p = ctx.cast.pigeon, { F } = ctx.store;
      p.pose('idle', ctx.t, { intensity: 0.15 }); p.face('determined', ctx.t);
      ctx.cam.set({ pos: F(0.25, 0.3, 1.5), look: F(0, 0.22, 0), fov: 36 });
    },
  },
  // ── b05 "So I'm running for mayor."  VOTE PIGEON
  {
    name: 'running for mayor', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = parkPerch(ctx);
      const s = ctx.props.voteSign; ctx.add(s); s.position.copy(st.F(0.32, 0, -0.05)); s.rotation.set(0, st.F.yaw - 0.25, 0);
    },
    update(ctx, lt, u) {
      const p = ctx.cast.pigeon, { F } = ctx.store, ts = ctx.markers.sign;
      p.pose('idle', ctx.t, { intensity: 0.2, headYaw: ctx.t > ts ? -0.35 : 0 }); p.face(ctx.t > ts ? 'smug' : 'determined', ctx.t);
      const k = clamp((ctx.t - ts) / 0.25, 0, 1);
      ctx.props.voteSign.scale.setScalar(Math.max(0.001, 0.42 * ease.outBack(k)));
      ctx.cam.move({ pos: F(0.3, 0.35, 1.9), look: F(0.12, 0.25, 0), fov: 38 }, { pos: F(0.25, 0.3, 1.4), look: F(0.14, 0.25, 0), fov: 36 }, u, ease.inOutSine);
    },
  },
  // ── b06 quote: "If you can't beat them, sit on their car." … My uncle.
  {
    name: 'uncle card', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = parkPerch(ctx);
      const s = ctx.props.voteSign; ctx.add(s); s.position.copy(st.F(0.32, 0, -0.05)); s.rotation.set(0, st.F.yaw - 0.25, 0); s.scale.setScalar(0.42);
    },
    update(ctx) {
      const p = ctx.cast.pigeon, { F } = ctx.store;
      p.pose('idle', ctx.t, { headPitch: 0.25 * Math.sin(ctx.t * 5) }); p.face('smug', ctx.t);
      ctx.cam.set({ pos: F(0.25, 0.3, 1.4), look: F(0.14, 0.25, 0), fov: 36 });
      quoteCard(ctx, "If you can't beat them, sit on their car.", null, ctx.markers.quote1, ctx.markers.quote1end + 0.05, { y: 0.34 });
    },
  },
  {
    name: 'uncle reveal', start: 'quote1end+0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'street.center');
      const car = ctx.props.uncleCar; ctx.add(car); car.position.copy(F(-3.2, 0, 6)); car.rotation.set(0, F.yaw + Math.PI / 2, 0);
      ctx.place('uncle', F(-3.25, 1.145, 6)); ctx.cast.uncle.root.rotation.set(0, F.yaw - Math.PI / 2 + 0.4, 0);
      ctx.store = { F };
    },
    update(ctx, lt) {
      const u = ctx.cast.uncle, { F } = ctx.store;
      u.pose('sit', ctx.t); u.face('smug', ctx.t);
      const pf = pigeonFace(u);
      const dir = V(Math.sin(u.root.rotation.y), 0, Math.cos(u.root.rotation.y));
      ctx.cam.move({ pos: pf.clone().addScaledVector(dir, 2.4).add(up(0.3)), look: pf.clone().add(up(-0.25)), fov: 38 }, { pos: pf.clone().addScaledVector(dir, 2.0).add(up(0.25)), look: pf.clone().add(up(-0.22)), fov: 36 }, clamp(lt / 1.2, 0, 1));
      tag(ctx, 'MY UNCLE', ctx.time('b06.w9'), Infinity, { y: 0.2 });
    },
  },
  // ── b07 "While they're out partying, by the way, I'm knocking on their doors."
  {
    name: 'knocking', start: 'b07-0.1', set: 'town',
    setup(ctx) { ctx.store = doorScene(ctx, 'myHouse.door'); },
    update(ctx, lt) {
      const p = ctx.cast.pigeon, { D } = ctx.store;
      p.pose('knock', ctx.t); p.face('determined', ctx.t);
      ctx.cam.move({ pos: D(1.3, 0.45, 1.9), look: D(0, 0.75, 0.1), fov: 46 }, { pos: D(1.0, 0.35, 1.5), look: D(0, 0.6, 0.1), fov: 44 }, clamp(lt / 2.8, 0, 1));
    },
  },
  // ── b08 HUSS ×6 — one door per HUSS, counter 1 … 400
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `door huss #${i + 1}`, start: i === 0 ? 'b08.h0-0.12' : `b08.h${i}-0.03`, set: 'town',
    setup(ctx) {
      const houses = (ctx.anchor('houses') || []).filter((h) => h.door);
      const h = houses[(i * 3 + 1) % Math.max(1, houses.length)];
      ctx.store = doorScene(ctx, h ? `house.${h.index}.door` : 'myHouse.door');
      if (i === 5) { const s = ctx.props.backSign, D = ctx.store.D; ctx.add(s); s.position.copy(D(-0.6, 0, 0.45)); s.rotation.set(0, D.yaw + 0.2, 0); s.scale.setScalar(0.85); }
    },
    update(ctx) {
      const p = ctx.cast.pigeon, { D } = ctx.store;
      const hits = ctx.hussTimes('b08').map((h) => h + 0.03);
      const hit = lastBefore(hits, ctx.t);
      p.pose('knock', 0.405 + (hit != null ? ctx.t - hit : 0)); p.face(i === 5 ? 'sad' : 'huss', ctx.t);
      const side = i % 2 ? -1 : 1;
      ctx.cam.set(i === 5 ? { pos: D(0.2, 0.7, 2.3), look: D(-0.25, 0.55, 0.1), fov: 44 } : { pos: D(side * 1.1, 0.4, 1.5), look: D(0, 0.55, 0.1), fov: 44 });
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2); ctx.cam.shake(0.08, ctx.t, 20 + i);
      tag(ctx, `DOORS KNOCKED: ${[1, 2, 3, 117, 399, 400][i]}`, -1, Infinity, { y: 0.12, size: 62, bg: 'rgba(200,0,40,0.9)', rot: 0 });
    },
  })),
  // ── b09 quote: "He who honks first, honks loudest." — a goose, under oath.
  {
    name: 'goose card', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      const houses = (ctx.anchor('houses') || []).filter((h) => h.door);
      const h = houses[16 % Math.max(1, houses.length)];
      ctx.store = doorScene(ctx, h ? `house.${h.index}.door` : 'myHouse.door');
      const s = ctx.props.backSign, D = ctx.store.D; ctx.add(s); s.position.copy(D(-0.6, 0, 0.45)); s.rotation.set(0, D.yaw + 0.2, 0); s.scale.setScalar(0.85);
    },
    update(ctx) {
      const p = ctx.cast.pigeon, { D } = ctx.store;
      p.pose('idle', ctx.t, { intensity: 0.1 }); p.face('sad', ctx.t);
      ctx.cam.set({ pos: D(0.2, 0.7, 2.3), look: D(-0.25, 0.55, 0.1), fov: 44 });
      quoteCard(ctx, 'He who honks first, honks loudest.', 'a goose, under oath', ctx.markers.quote2, ctx.markers.quote2end, { y: 0.34, byAt: ctx.markers.goose });
    },
  },
  // ── b10 "I rehearsed my speech ten thousand times."  /  b11 HUSS ×3 into the tiny mic
  {
    name: 'rehearsal', start: 'b10-0.1', set: 'room',
    setup(ctx) { ctx.store = deskScene(ctx); },
    update(ctx, lt, u) {
      const p = ctx.cast.pigeon, cat = ctx.cast.cat, { Dk } = ctx.store;
      p.pose('idle', ctx.t, { intensity: 0.3 }); p.face('determined', ctx.t);
      cat.pose('loaf', ctx.t); cat.face('sleepy', ctx.t);
      ctx.cam.move({ pos: Dk(0.3, 0.6, -1.15), look: Dk(0.02, 0.22, -0.02), fov: 38 }, { pos: Dk(0.22, 0.5, -0.9), look: Dk(0.02, 0.24, -0.02), fov: 36 }, u);
      tag(ctx, 'SPEECH REHEARSALS: 9,997', -1, Infinity, { y: 0.12, size: 56, bg: 'rgba(20,130,60,0.92)', rot: 0 });
    },
  },
  ...[0, 1, 2].map((i) => ({
    name: `rehearsal huss #${i + 1}`, start: i === 0 ? 'b11.h0-0.12' : `b11.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = deskScene(ctx); },
    update(ctx) {
      const p = ctx.cast.pigeon, cat = ctx.cast.cat, { Dk } = ctx.store;
      const hits = ctx.hussTimes('b11').map((h) => h + 0.03);
      const n = hits.filter((h) => h <= ctx.t).length;
      p.pose('huss', ctx.t, { hits }); p.face('huss', ctx.t);
      if (i < 2) {
        cat.pose('loaf', ctx.t); cat.face('sleepy', ctx.t);
        const pf = pigeonFace(p);
        ctx.cam.set({ pos: pf.clone().addScaledVector(ctx.store.out, i ? 0.7 : 0.9).addScaledVector(ctx.store.side, i ? -0.3 : 0.32).add(up(0.25)), look: pf.clone().add(up(-0.08)), fov: 34 });
      } else {
        cat.pose('stare', ctx.t); cat.face('stare', ctx.t);
        const cp = ctx.cast.cat.joints.head.localToWorld(V(0, 0.035, 0.123));
        const f = V(Math.sin(cat.root.rotation.y), 0, Math.cos(cat.root.rotation.y));
        ctx.cam.set({ pos: cp.clone().addScaledVector(f, 1.1).add(up(0.12)), look: cp, fov: 32 });
      }
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2); ctx.cam.shake(0.08, ctx.t, 30 + i);
      tag(ctx, `SPEECH REHEARSALS: ${['9,998', '9,999', '10,000'][Math.max(0, n - 1)]}`, -1, Infinity, { y: 0.12, size: 56, bg: 'rgba(20,130,60,0.92)', rot: 0 });
    },
  })),
  // ── b12 "Then came the Summer Party Election."
  {
    name: 'election establishing', start: 'b12-0.1', set: 'town',
    setup(ctx) {
      ctx.store = electionStage(ctx, { mayorAtMic: true });
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 24).add(up(11)), look: c.clone().add(up(2)), fov: 44 };
      ctx.store.to = { pos: cam, look: ctx.point('square.stage').add(up(1.4)), fov: 48 };
    },
    update(ctx, lt, u) {
      crowdAnim(ctx, ctx.store); ctx.cast.mayor.pose('wave', ctx.t); ctx.cast.mayor.face('grin', ctx.t);
      ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic);
    },
  },
  // ── b13 mayor: "Party!"
  {
    name: 'mayor party', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = electionStage(ctx, { mayorAtMic: true });
      const cf = ctx.props.confetti; ctx.add(cf.root); cf.root.position.copy(st.S(0, 2.6, 2.2));
    },
    update(ctx) {
      const st = ctx.store, m = ctx.cast.mayor;
      crowdAnim(ctx, st, { mode: 'cheer' }); m.pose('cheer', ctx.t); m.face('grin', ctx.t);
      ctx.props.confetti.update(ctx.t - ctx.time('b13'));
      ctx.cam.set({ pos: st.S(0.5, 1.75, 5.4), look: st.S(0, 1.65, 2.4), fov: 42 });
    },
  },
  // ── b14 "My speech."  /  b15 "Coo."  /  b16 "Silence. A balloon fainted."
  {
    name: 'my speech', start: 'b14-0.1', set: 'town',
    setup(ctx) { ctx.store = electionStage(ctx, { pigeonAtMic: true, mayorAside: true }); },
    update(ctx, lt) {
      const st = ctx.store, p = ctx.cast.pigeon, m = ctx.cast.mayor;
      crowdAnim(ctx, st, { mode: 'idle', still: true }); m.pose('idle', ctx.t, { lookAt: p.root.position }); m.face('smile', ctx.t);
      p.pose('idle', ctx.t, { intensity: 0.2 }); p.face('determined', ctx.t);
      ctx.cam.move({ pos: st.S(0.2, 0.95, 4.6), look: st.S(0.1, 0.6, 2.5), fov: 38 }, { pos: st.S(0.12, 0.8, 4.0), look: st.S(0.05, 0.5, 2.5), fov: 36 }, clamp(lt / 1.2, 0, 1));
    },
  },
  {
    name: 'coo', start: 'b15-0.2', set: 'town',
    setup(ctx) { ctx.store = electionStage(ctx, { pigeonAtMic: true, mayorAside: true }); },
    update(ctx) {
      const st = ctx.store, p = ctx.cast.pigeon;
      crowdAnim(ctx, st, { mode: 'idle', still: true });
      const w = ctx.beat('b15').words[0];
      const coo = ctx.t > w.start - 0.03 && ctx.t < w.end + 0.05;
      p.pose('idle', 0, { intensity: 0, headPitch: 0.15 }); p.face(coo ? 'shocked' : 'neutral', ctx.t);
      const pf = pigeonFace(p);
      ctx.cam.set({ pos: pf.clone().addScaledVector(st.S.fwd, 0.6).addScaledVector(st.S.left, 0.42).add(up(0.04)), look: pf.clone().add(up(-0.04)), fov: 32 });
    },
  },
  {
    name: 'silence', start: 'b16-0.1', set: 'town',
    setup(ctx) { ctx.store = electionStage(ctx, { pigeonAtMic: true, mayorAside: true }); ctx.set.set?.('crowdMotion', 0); },
    update(ctx) {
      const st = ctx.store;
      crowdAnim(ctx, st, { mode: 'stunned', still: true });
      const F = frameAt(ctx, 'square.standA');
      ctx.cam.set({ pos: F(0.3, 2.6, 6.5), look: F(0, 2.0, 0), fov: 44 });
    },
  },
  {
    name: 'balloon faints', start: 'faint-0.35', set: 'town',
    setup(ctx) {
      const st = ctx.store = electionStage(ctx, { pigeonAtMic: true, mayorAside: true });
      const b = ctx.props.balloon; ctx.add(b); b.position.copy(st.S(-0.9, 0, 2.3));
    },
    update(ctx) {
      const st = ctx.store, b = ctx.props.balloon;
      const k = clamp((ctx.t - ctx.markers.faint) / 1.1, 0, 1);
      const sink = ease.inQuad(k);
      b.position.copy(st.S(-0.9 - 0.2 * sink, -0.85 * sink + 0.05 * Math.sin(k * 14) * (1 - k), 2.3 + 0.1 * sink));
      b.rotation.set(0.3 * Math.sin(k * 9) * (1 - k), 0, (Math.PI / 2 - 0.2) * ease.inCubic(k));
      ctx.cam.set({ pos: st.S(-0.55, 0.9, 4.0), look: st.S(-0.9, 0.55, 2.3), fov: 40 });
    },
  },
  // ── b17 "Top ten respectful moments. Number seven: the mayor gave me his hat."
  {
    name: 'mayor gives hat', start: 'b17-0.1', set: 'town',
    setup(ctx) { ctx.store = electionStage(ctx, { pigeonAtMic: true, mayorAside: true }); },
    update(ctx) {
      const st = ctx.store, p = ctx.cast.pigeon, m = ctx.cast.mayor, P = ctx.props;
      crowdAnim(ctx, st, { mode: 'stunned', still: true });
      p.pose('idle', ctx.t, { intensity: 0.2 }); p.face('neutral', ctx.t);
      const th = ctx.markers.hat, k = clamp((ctx.t - th) / 0.9, 0, 1);
      m.pose(k > 0 && k < 1 ? 'point' : 'idle', ctx.t, { lookAt: p.root.position }); m.face(k > 0 ? 'sad' : 'shocked', ctx.t);
      m.setAccessory('topHat', ctx.t < th);
      if (ctx.t >= th) {
        const a = headPos(m, 0.75), b = p.root.position.clone().add(up(0.08));
        const mid = a.clone().lerp(b, 0.5).add(up(0.35));
        const e = ease.inOutCubic(k);
        const q = a.clone().lerp(mid, Math.min(1, e * 2)).lerp(mid.clone().lerp(b, 1), Math.max(0, e * 2 - 1));
        ctx.add(P.bigHat); P.bigHat.position.copy(q); P.bigHat.rotation.set(0.25 * Math.sin(Math.PI * e), p.root.rotation.y, 0);
      }
      ctx.cam.set({ pos: st.S(0.65, 1.8, 6.4), look: st.S(0.5, 1.3, 2.35), fov: 44 });
      top10Card(ctx, 7, ctx.time('b17') + 0.05, Infinity, { popAt: ctx.markers.top7 });
    },
  },
  // ── b18 "Numbers one to six? Also me."
  {
    name: 'also me', start: 'b18-0.1', set: 'town',
    setup(ctx) { ctx.store = electionStage(ctx, { pigeonAtMic: true, mayorAside: true, hat: true }); ctx.cast.mayor.setAccessory('topHat', false); },
    update(ctx) {
      const st = ctx.store, p = ctx.cast.pigeon, m = ctx.cast.mayor;
      crowdAnim(ctx, st, { mode: 'stunned', still: true }); m.pose('idle', 0); m.face('sad', ctx.t); m.setAccessory('topHat', false);
      p.pose('strut', ctx.t * 1.6, { speed: 1.4 }); p.face('smug', ctx.t);
      hatOn(ctx, p, { bob: 0.012 * Math.abs(Math.sin(ctx.t * 9)) });
      ctx.cam.set({ pos: st.S(0.15, 0.55, 3.75), look: st.S(0.02, 0.42, 2.45), fov: 36 });
      const tf = ctx.markers.flip, ta = ctx.markers.alsoMe;
      const n = ctx.t < tf ? 7 : Math.max(1, 6 - Math.floor((ctx.t - tf) / 0.15));
      top10Card(ctx, n, ctx.time('b18') - 5, Infinity, { popAt: n === 7 ? -1 : tf + (6 - n) * 0.15 });
      if (ctx.t > ta) tag(ctx, '(ALL OF THEM)', ta, Infinity, { y: 0.4, size: 54, bg: null, rot: 0.05 });
    },
  },
  // ── b19 "I won. The cat voted for himself."
  {
    name: 'i won', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = electionStage(ctx, { pigeonAtMic: true, mayorAside: true, hat: true });
      ctx.cast.mayor.setAccessory('topHat', false);
      const cf = ctx.props.confetti; ctx.add(cf.root); cf.root.position.copy(st.S(0, 2.8, 2.4));
    },
    update(ctx) {
      const st = ctx.store, p = ctx.cast.pigeon, m = ctx.cast.mayor;
      crowdAnim(ctx, st, { mode: 'cheer' }); m.pose('clap', ctx.t); m.face('sad', ctx.t); m.setAccessory('topHat', false);
      p.pose('strut', ctx.t * 1.6, { speed: 1.4 }); p.face('smug', ctx.t);
      hatOn(ctx, p, { bob: 0.012 * Math.abs(Math.sin(ctx.t * 9)) });
      ctx.props.confetti.update(ctx.t - ctx.time('b19'));
      ctx.cam.set({ pos: st.S(0.6, 1.3, 5.2), look: st.S(0.3, 0.8, 2.4), fov: 42 });
      tag(ctx, 'PIGEON 1,203 | MAYOR 0 | CAT 1', ctx.time('b19') + 0.1, Infinity, { y: 0.12, size: 54, bg: 'rgba(10,10,20,0.88)', fill: '#ffe14a', rot: 0 });
    },
  },
  {
    name: 'cat voted', start: 'catVote-0.05', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('dusk'); ctx.set.set?.('partyProps', true); ctx.set.set?.('standsCrowd', false);
      const rows = ctx.anchor('square.standB.rows');
      const row = rows[1];
      ctx.place('cat', row); ctx.cast.cat.root.rotation.y += 0;
      ctx.store = { F: frame(rel(row), yawOf(row)) };
    },
    update(ctx) {
      const cat = ctx.cast.cat, { F } = ctx.store;
      cat.pose('sit', ctx.t); cat.face('stare', ctx.t);
      const cp = cat.joints.head.localToWorld(V(0, 0.035, 0.123));
      ctx.cam.set({ pos: cp.clone().addScaledVector(F.fwd, 2.2).add(up(0.15)), look: cp.clone().add(up(-0.08)), fov: 34 });
      tag(ctx, 'CAT 1', ctx.markers.catVote + 0.15, Infinity, { y: 0.2, size: 60, bg: 'rgba(10,10,20,0.88)', fill: '#ffe14a', rot: 0 });
    },
  },
  // ── b20 "First law: no more parties."
  {
    name: 'first law', start: 'b20-0.1', set: 'townNP',
    setup(ctx) {
      const st = ctx.store = electionStage(ctx, { pigeonAtMic: true, mayorAside: true, hat: true, night: true });
      ctx.cast.mayor.setAccessory('topHat', false);
    },
    update(ctx) {
      const st = ctx.store, p = ctx.cast.pigeon, m = ctx.cast.mayor;
      crowdAnim(ctx, st, { mode: 'stunned', still: true }); m.pose('stunned', 0); m.face('shocked', ctx.t); m.setAccessory('topHat', false);
      p.pose('idle', ctx.t, { intensity: 0.1 }); p.face('smug', ctx.t);
      hatOn(ctx, p, { lift: ctx.t > ctx.markers.law ? 0.13 : 0.08 });
      if (ctx.t < ctx.markers.law - 0.05) { const pf = pigeonFace(p); ctx.cam.set({ pos: pf.clone().addScaledVector(st.S.fwd, 1.2).addScaledVector(st.S.left, 0.35).add(up(0.05)), look: pf.clone().add(up(0.05)), fov: 34 }); }
      else ctx.cam.set({ pos: ctx.point('square.bannerCam'), look: ctx.point('square.banner').add(up(-0.6)), fov: 52 });
    },
  },
  // ── b21 HUSS ×3 (town) — everybody grinds at home now
  ...[['roomG', 'grandad'], ['roomM', 'marcus'], ['roomB', 'brenda']].map(([set, who], i) => ({
    name: `grind huss #${i + 1}`, start: i === 0 ? 'b21.h0-0.12' : `b21.h${i}-0.03`, set,
    setup(ctx) {
      const st = roomNook(ctx, who, { board: false, clock: false, lighting: 'night' });
      ctx.set.set?.('window', 'dark');
      st.cams = nookCams(st.F);
      if (who !== 'marcus') { ctx.place(who, st.F(0, 0, 0.35)); ctx.cast[who].root.rotation.set(0, st.F.yaw, 0); ctx.remove?.(ctx.props.chair); }
      ctx.store = st;
    },
    update(ctx) {
      const { F, cams } = ctx.store, ch = ctx.cast[who], P = ctx.props;
      const hits = ctx.hussTimes('b21').map((h) => h + 0.03);
      const hit = lastBefore(hits, ctx.t), near = hit != null ? ctx.t - hit : 9;
      if (who === 'marcus') { ch.pose('sitSlam', ctx.t, { hits }); ch.face('huss', ctx.t); }
      else if (who === 'brenda') { ch.pose('slam', ctx.t, { hits }); ch.face('huss', ctx.t); }
      else {
        ch.pose('cheer', 0.2 + clamp(near / 0.25, 0, 1) * 0.3, { intensity: 1 }); ch.face('huss', ctx.t);
        ctx.add(P.dumbbell); ch.root.updateMatrixWorld(true);
        P.dumbbell.position.copy(ch.joints.handR.getWorldPosition(V())); P.dumbbell.rotation.set(0, F.yaw, 0);
      }
      ctx.cam.set(i === 1 ? cams.med : { pos: F(0.5, 1.6, 2.6), look: F(0, 1.3, 0.3), fov: 42 });
      ctx.cam.punch(hits, ctx.t, 0.12, 0.2); ctx.cam.shake(0.1, ctx.t, 50 + i);
    },
  })),
  // ── b22 "No parties means no crumbs."
  {
    name: 'no crumbs', start: 'b22-0.1', set: 'townNP',
    setup(ctx) {
      quietTown(ctx, 0.9);
      const F = frameAt(ctx, 'street.center');
      ctx.place('pigeon', F(0, 0.0, 0)); ctx.cast.pigeon.root.rotation.set(0, F.yaw, 0);
      ctx.store = { F, t0: ctx.time('b22') - 0.1 };
    },
    update(ctx) {
      const p = ctx.cast.pigeon, { F, t0 } = ctx.store, tc = ctx.markers.crumbs;
      const walkT = Math.min(ctx.t, tc - 0.15) - t0;
      p.root.position.copy(F(0, 0, -1.2 + walkT * PIGEON_STRUT_SPEED * 1.1));
      const pecking = ctx.t > tc - 0.15;
      if (pecking) { p.pose('peck', ctx.t - tc); p.face('sweat', ctx.t); } else { p.pose('strut', ctx.t, { speed: 1.1 }); p.face('neutral', ctx.t); }
      hatOn(ctx, p, { lift: pecking ? 0.14 : 0.08, tilt: pecking ? 0.45 : 0 });
      const pp = p.root.position;
      ctx.cam.set({ pos: pp.clone().addScaledVector(F.fwd, 1.7).addScaledVector(F.left, 0.5).add(up(0.45)), look: pp.clone().add(up(0.25)), fov: 38 });
    },
  },
  // ── b23 quote: "The moon is just a big crumb." — me, hungry
  {
    name: 'moon card', start: 'b23-0.1', set: 'townNP',
    setup(ctx) {
      quietTown(ctx, 0.9);
      const F = frameAt(ctx, 'street.center');
      ctx.place('pigeon', F(0, 0, 1.0)); ctx.cast.pigeon.root.rotation.set(0, F.yaw, 0);
      ctx.store = { F };
    },
    update(ctx) {
      const p = ctx.cast.pigeon, { F } = ctx.store;
      p.pose('idle', ctx.t, { intensity: 0.1, headPitch: -0.7 }); p.face('sad', ctx.t);
      hatOn(ctx, p, { lift: 0.2, tilt: -0.5 });
      const pf = pigeonFace(p);
      ctx.cam.set({ pos: pf.clone().addScaledVector(F.fwd, 1.1).addScaledVector(F.left, -0.35).add(up(-0.12)), look: pf.clone().add(up(0.35)), fov: 46 });
      quoteCard(ctx, 'The moon is just a big crumb.', 'me, hungry', ctx.markers.quote3, ctx.markers.quote3end, { y: 0.34, byAt: ctx.markers.hungry });
    },
  },
  // ── b24 "Now everybody grinds. Except me."  /  b25 "Don't tell the mayor."
  {
    name: 'everybody grinds', start: 'b24-0.1', set: 'townNP',
    setup(ctx) { quietTown(ctx, 1); ctx.store = { from: ctx.point('street.camHigh'), c: ctx.point('street.center') }; },
    update(ctx, lt) {
      const { from, c } = ctx.store;
      const k = clamp(lt / 1.6, 0, 1);
      ctx.cam.move({ pos: c.clone().add(V(6, 3, 10)), look: c.clone().add(up(2)), fov: 46 }, { pos: from, look: c.clone().add(up(0.5)), fov: 50 }, k, ease.inOutCubic);
    },
  },
  {
    name: 'except me (secret party)', start: 'exceptMe-0.05', set: 'townNP',
    setup(ctx) { ctx.store = secretParty(ctx); },
    update(ctx, lt) {
      const p = ctx.cast.pigeon, { L } = ctx.store;
      p.pose('strut', ctx.t * 1.8, { speed: 1.6 }); p.face('grin', ctx.t);
      hatOn(ctx, p, { tiny: true, bob: 0.05 * Math.abs(Math.sin(ctx.t * 7.5)) });
      ctx.props.speaker.update?.(ctx.t); ctx.props.cake.update?.(ctx.t);
      ctx.cam.move({ pos: L(0.6, 1.4, 3.2), look: L(0, 0.3, 0.6), fov: 40 }, { pos: L(0.45, 0.8, 2.1), look: L(0, 0.3, 0.6), fov: 38 }, clamp(lt / 1.2, 0, 1), ease.outCubic);
    },
  },
  {
    name: "don't tell the mayor", start: 'b25-0.1', set: 'townNP',
    setup(ctx) {
      ctx.store = secretParty(ctx);
      const c = ctx.props.crumb; ctx.add(c, ctx.cast.pigeon.joints.head); c.position.set(0.0, 0.03, 0.12);
    },
    update(ctx, lt) {
      const p = ctx.cast.pigeon, { L } = ctx.store;
      const tl = ctx.time('b25') + 0.1, k = clamp((ctx.t - tl) / 0.25, 0, 1);
      p.pose('idle', ctx.t, { intensity: 0.2, headYaw: 0.25 * k }); p.face(k > 0.5 ? 'wink' : 'grin', ctx.t);
      ctx.props.crumb.visible = k > 0.3;
      hatOn(ctx, p, { tiny: true, lift: 0.08 + 0.5 * ease.outBack(k), tilt: -0.2 * k });
      ctx.props.speaker.update?.(ctx.t); ctx.props.cake.update?.(ctx.t);
      const pf = pigeonFace(p);
      ctx.cam.set({ pos: pf.clone().addScaledVector(L.fwd, 1.5).addScaledVector(L.left, 0.25).add(up(0.12)), look: pf.clone().add(up(0.14)), fov: 38 });
      const tEnd = ctx.time('b25.end') + 0.35, ki = clamp((ctx.t - tEnd) / 0.45, 0, 1);
      if (ki > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - ki); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * 0.45, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); });
    },
  },
];

// ── scenes ──────────────────────────────────────────────────────────────────────────────────────
/** The narrator alone on the park's stone table, facing the park camera. */
function parkPerch(ctx) {
  ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  const tp = ctx.point('park.table'), pc = ctx.point('park.cam');
  const F = frame(tp, Math.atan2(pc.x - tp.x, pc.z - tp.z));
  ctx.place('pigeon', F(0, 0, 0)); ctx.cast.pigeon.root.rotation.set(0, F.yaw, 0);
  return { F };
}
/** A front door; the pigeon on the step facing it.  D: door frame, +z = out of the door. */
function doorScene(ctx, anchor) {
  ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('windowGlow', 0.05);
  const D = frameAt(ctx, anchor);
  const g = D.origin.clone(); g.y = Math.max(0, g.y);
  ctx.place('pigeon', D(0, 0, 0.3)); ctx.cast.pigeon.root.rotation.set(0, D.yaw + Math.PI, 0);
  return { D };
}
/** The narrator on the bedroom desk at a tiny mic, the cat on the bed. */
function deskScene(ctx) {
  ctx.set.setLighting?.('night'); ctx.set.set?.('window', 'party');
  const d = ctx.anchor('room.desk');
  const Dk = frame(rel(d), yawOf(d));          // +z = towards the wall
  const P = ctx.props, p = ctx.cast.pigeon;
  ctx.place('pigeon', Dk(0, 0, 0.08)); p.root.rotation.set(0, Dk.yaw + Math.PI, 0);
  ctx.add(P.tinyMic); P.tinyMic.position.copy(Dk(0, 0, -0.14)); P.tinyMic.rotation.set(0, Dk.yaw, 0);
  ctx.place('cat', ctx.anchor('room.bed'));
  const cat = ctx.cast.cat, c = cat.root.position, pp = p.root.position;
  cat.root.rotation.set(0, Math.atan2(pp.x - c.x, pp.z - c.z), 0);
  return { Dk, out: Dk.fwd.clone().negate(), side: Dk.left.clone() };
}
/** The secret one-pigeon party under a lamp on the empty street. */
function secretParty(ctx) {
  quietTown(ctx, 1);
  const lt = lampTop(ctx, -3, 5.15);
  const base = lt.clone().setY(0.12);
  const L = frame(base.clone().add(V(0, 0, -1.2)), Math.PI);   // the pavement under the south lamp, facing north (into the street)
  const P = ctx.props;
  ctx.place('pigeon', L(0, 0, 0.6)); ctx.cast.pigeon.root.rotation.set(0, L.yaw, 0);
  ctx.add(P.speaker.root); P.speaker.root.position.copy(L(0.55, 0, 0.35)); P.speaker.root.rotation.set(0, L.yaw - 0.4, 0); P.speaker.root.scale.setScalar(0.6);
  ctx.add(P.cake.root); P.cake.root.position.copy(L(-0.45, 0, 0.5)); P.cake.root.rotation.set(0, L.yaw, 0);
  ctx.add(P.crumbs); P.crumbs.position.copy(L(0, 0, 0.6));
  return { L };
}
