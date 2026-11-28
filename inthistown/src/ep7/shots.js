// In This Town — Episode 7: "Limbo".  Marcus narrates; he trains to go under everything.
// Film contract: SPEC.md §8.  Timeline: episodes/ep7/timeline.json (audio/build_episode.py ep7).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { WALK_SPEED, PIGEON_STRUT_SPEED } from '../characters.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { init as initEp1, V, TABLE_TOP, headPos, frame, frameAt, lastBefore, partyTown } from '../shots.js';
import { makeMicStand } from '../ep2/props2.js';
import { makeTrophy } from '../ep3/props3.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
export const cast = {
  marcus: MAIN.marcus, brenda: MAIN.brenda, mayor: MAIN.mayor, cat: MAIN.cat, pigeon: MAIN.pigeon, grandad: MAIN.grandad,
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 7, banner: ['SUMMER PARTY', 'LIMBO', 'CHAMPIONSHIP'] }),
  room: () => buildRoom({ variant: 'marcus', window: 'party' }),
};

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.limbo = makeLimbo();
  P.broom = makeBroom();
  P.mic7 = makeMicStand({ height: 1.5 });
  P.trophy7 = makeTrophy();
}
// limbo bar: two striped stands and a two-piece crossbar.  set(h, sag = 0, knocked = 0)
function makeLimbo() {
  const g = new THREE.Group(), W = 1.7;
  const mS = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 });
  for (const s of [-1, 1]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), mS('#2a2a30')); base.position.set(s * W / 2, 0.025, 0); g.add(base);
    for (let i = 0; i < 8; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 10), mS(i % 2 ? '#ffffff' : '#e8232b')); seg.position.set(s * W / 2, 0.15 + i * 0.2, 0); g.add(seg); }
  }
  const halves = [-1, 1].map((s) => {
    const piv = new THREE.Group(); piv.position.set(s * W / 2, 1, 0); g.add(piv);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, W / 2, 10), mS('#ffd23f')); bar.rotation.z = Math.PI / 2; bar.position.x = -s * W / 4; piv.add(bar);
    return { piv, s };
  });
  g.userData.set = (h, sag = 0, knocked = 0) => {
    halves.forEach(({ piv, s }) => {
      piv.position.y = h;
      piv.rotation.z = s * (sag * 0.35) + (s > 0 ? -knocked * 1.2 : 0);
    });
  };
  g.userData.set(1.0);
  return g;
}
function makeBroom() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 8), new THREE.MeshStandardMaterial({ color: '#c9a36a', roughness: 0.7 }));
  stick.rotation.z = Math.PI / 2; g.add(stick);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.28), new THREE.MeshStandardMaterial({ color: '#ffd23f', roughness: 0.9 })); head.position.x = 0.78; g.add(head);
  return g;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
const period = (ch) => (ch.kind === 'cat' ? 3.4 : ch.kind === 'pigeon' ? 2.7 : 3.1);
const OPEN = (ch) => 10 * period(ch) + period(ch) / 2 - (ch.blinkPhase || 0);
const SHUT = (ch) => 10 * period(ch) + 0.05 - (ch.blinkPhase || 0);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0;
  if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.24, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.8)', rot: -0.03, ...o, scale: Math.max(0.01, pop) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.3, size: 230, fill: '#e8232b', stroke: '#ffffff', line: 14, rot: -0.18, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
/** Lying flat on the back (crowdSurf pose: body along local Z, head toward −Z, face up).  `flat` < 1 squashes him. */
function lieDown(ch, t, { flat = 1, face = 'determined', ft = 0, lift = 0.02 } = {}) {
  ch.pose('crowdSurf', t, { lift, intensity: 0.15 }); ch.face(face, ft);
  if (ch.joints.armL) { ch.joints.armL.rotation.set(0.05, 0, 0.12); ch.joints.armR.rotation.set(0.05, 0, -0.12); ch.joints.foreArmL?.rotation.set(0, 0, 0); ch.joints.foreArmR?.rotation.set(0, 0, 0); }
  ch.root.scale.set(1, flat, 1);
}
/** Side-on camera for a lying body: `perp` = horizontal unit vector from the body towards the camera. */
function sideCam(ch, perp, d = 2.6, h = 0.45, fov = 40, along = 0) {
  const c = ch.root.position.clone().add(up(0.22)).addScaledVector(facing(ch.root), along);
  return { pos: c.clone().addScaledVector(perp, d).add(up(h)), look: c, fov };
}
const facing = (obj) => V(Math.sin(obj.rotation.y), 0, Math.cos(obj.rotation.y));
const topCam = (ch, h = 1.3, fov = 40) => { const f = faceOf(ch); return { pos: f.clone().add(up(h)).addScaledVector(facing(ch.root), -0.05), look: f, fov }; };
function faceOf(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
/** Pushes: position along a path advances one step per HUSS (eased), from a to b. */
function pushes(ctx, hits, n) {
  const k = hits.filter((h) => h <= ctx.t).length, h = lastBefore(hits, ctx.t);
  const e = h != null ? ease.outCubic(clamp((ctx.t - h) / 0.25, 0, 1)) : 0;
  return clamp((Math.max(0, k - 1) + e) / n, 0, 1);
}

/** Marcus's room with the table in the middle (F: +z = towards the camera side). */
function roomBase(ctx, { table = true } = {}) {
  const set = ctx.set; set.setLighting?.('day'); set.set?.('window', 'party');
  set.root.updateMatrixWorld(true);
  const center = set.root.getWorldPosition(V()), camP = ctx.point('room.cam');
  const d = V(camP.x - center.x, 0, camP.z - center.z).normalize();
  const yaw = Math.atan2(d.x, d.z);
  const F = frame(V().copy(center).addScaledVector(d, -0.2), yaw);
  if (table) { const P = ctx.props; ctx.add(P.table); P.table.position.copy(F(0, 0, 0.3)); P.table.rotation.set(0, yaw + Math.PI / 2, 0); }
  return { F, yaw, floorY: center.y };
}

// ── The limbo stage.  S: stage frame (+z = audience).  The bar runs along S x at S z = 2.2.
function limboStage(ctx, { queue = true } = {}) {
  ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('standsCrowd', true); ctx.set.set?.('crowdMotion', 0.7);
  const S = frameAt(ctx, 'square.stage');
  const P = ctx.props;
  ctx.add(P.limbo); P.limbo.position.copy(S(0, 0, 2.2)); P.limbo.rotation.set(0, S.yaw, 0); P.limbo.userData.set(1.0);
  const st = { S, stands: [], queue: [] };
  const fill = (rows, ids, k0) => {
    if (!Array.isArray(rows)) return; let k = 0;
    rows.forEach((row) => { const w = row.userData?.width || 7.2, per = 7; for (let j = 0; j < per && k < ids.length; j++, k++) {
      const id = ids[k]; ctx.place(id, row, { offset: [(j - (per - 1) / 2) * (w / per) + (hash(k + k0) - 0.5) * 0.2, 0, 0] });
      ctx.cast[id].setAccessory?.('partyHat', true); st.stands.push({ ch: ctx.cast[id], phase: hash(k * 3.1 + k0) * 3, k: k + k0 }); } });
  };
  fill(ctx.anchor('square.standA.rows'), ['grandad', ...EXTRA_IDS.slice(0, 11)], 0);
  if (queue) EXTRA_IDS.slice(12, 17).forEach((id, k) => { ctx.place(id, S(-1.5 - 0.75 * k, 0, 1.4 + 0.2 * (k % 2))); ctx.cast[id].root.rotation.set(0, S.yaw + Math.PI / 2, 0); ctx.cast[id].setAccessory?.('partyHat', true); st.queue.push({ ch: ctx.cast[id], k }); });
  return st;
}
function limboAnim(ctx, st, { mode = 'mixed' } = {}) {
  for (const c of st.stands) {
    const a = mode === 'peer' ? 'peer' : mode === 'clap' ? 'clap' : (c.k % 2 ? 'cheer' : 'clap');
    c.ch.pose(a, ctx.t + c.phase); c.ch.face(mode === 'peer' ? 'shocked' : 'grin', ctx.t + c.phase);
  }
  for (const q of st.queue) { q.ch.pose('dance', ctx.t + q.k * 0.4); q.ch.face('grin', ctx.t + q.k); }
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody parties."
  {
    name: 'party crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 7, hats: true });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh');
      const d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store = { crowd, from: { pos: hi, look: c.clone().add(up(0.5)), fov: 50 }, to: { pos: c.clone().addScaledVector(d, 9).add(up(3.2)), look: ctx.point('street.crowdA').add(up(1.3)), fov: 42 } };
    },
    update(ctx, lt, u) { animateCrowd(ctx.store.crowd, ctx.t); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic); },
  },
  // ── b02 "Except me."
  {
    name: 'window push', start: 'b02-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const hs = (ctx.anchor('houses') || []).filter((h) => h.windows && h.windows.length);
      const w = hs.length ? hs[Math.min(5, hs.length - 1)].windows[0] : ctx.anchor('myHouse.window');
      ctx.store = { W: frame(rel(w), yawOf(w)) };
    },
    update(ctx, lt, u) { const W = ctx.store.W; ctx.cam.move({ pos: W(0, -0.8, 5), look: W(0, 0, 0), fov: 40 }, { pos: W(0, -0.2, 1.8), look: W(0, 0, 0), fov: 36 }, ease.inQuad(u)); },
  },
  {
    name: 'under the table', start: 'b02.w1-0.05', set: 'room',
    setup(ctx) {
      const st = ctx.store = roomBase(ctx);
      ctx.place('marcus', st.F(-1.0, 0, 0.3)); ctx.cast.marcus.root.rotation.set(0, st.yaw - Math.PI / 2, 0);
    },
    update(ctx) {
      const m = ctx.cast.marcus, { F } = ctx.store;
      lieDown(m, ctx.t, { face: 'neutral', ft: OPEN(m) });
      ctx.cam.set(sideCam(m, F.fwd, 2.4, 0.45));
    },
  },
  // ── b03 HUSS ×6 — one push per HUSS under the table
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `table limbo #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) { const st = ctx.store = roomBase(ctx); ctx.place('marcus', st.F(-1.0, 0, 0.3)); ctx.cast.marcus.root.rotation.set(0, st.yaw - Math.PI / 2, 0); },
    update(ctx) {
      const m = ctx.cast.marcus, { F } = ctx.store, hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      const u = pushes(ctx, hits, 6);
      m.root.position.copy(F(-1.0 + 2.0 * u, 0, 0.3));
      const h = lastBefore(hits, ctx.t);
      lieDown(m, ctx.t, { face: h != null && ctx.t - h < 0.2 ? 'huss' : 'determined', ft: OPEN(m) });
      ctx.cam.set([sideCam(m, F.fwd, 2.4, 0.4), topCam(m, 1.3), { pos: F(1.5, 0.55, 2.2), look: F(0, 0.3, 0.3), fov: 42 },
        { pos: F(-1.5, 0.55, 2.2), look: F(0, 0.3, 0.3), fov: 42 }, topCam(m, 1.0, 38), { pos: F(0.2, 1.5, 2.8), look: F(0.2, 0.3, 0.3), fov: 44 }][i]);
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b04 "Grandad joined a conga line in nineteen eighty two. He's still in it."
  {
    name: 'eternal conga', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'street.center');
      const line = [...EXTRA_IDS.slice(0, 7), 'grandad'];
      line.forEach((id) => { ctx.place(id, F(0, 0, 0)); if (id !== 'grandad') ctx.cast[id].setAccessory?.('partyHat', true); });
      ctx.store = { F, line };
    },
    update(ctx) {
      const { F, line } = ctx.store;
      line.forEach((id, k) => {
        const s = ctx.t * WALK_SPEED * 0.9 - k * 0.85;
        const x = s, z = 0.9 * Math.sin(s * 0.7);
        const ch = ctx.cast[id]; ch.root.position.copy(F(z, 0, x));
        const dz = 0.9 * 0.7 * Math.cos(s * 0.7);
        ch.root.rotation.set(0, F.yaw + Math.atan2(dz, 1), 0);
        ch.pose('walk', ctx.t + k * 0.12, { speed: 0.9 }); ch.face(id === 'grandad' ? 'sleepy' : 'grin', ctx.t + k);
      });
      const g = ctx.cast.grandad, gp = headPos(g, 0.25);
      if (ctx.t < ctx.markers.still - 0.1) ctx.cam.set({ pos: F(3.5, 2.2, ctx.t * WALK_SPEED * 0.9 - 1.0), look: F(0, 1.0, ctx.t * WALK_SPEED * 0.9 - 3.0), fov: 46 });
      else ctx.cam.set({ pos: gp.clone().addScaledVector(F.left, 2.2).addScaledVector(F.fwd, 0.6), look: gp.clone().add(up(-0.3)), fov: 40 });
      tag(ctx, 'SINCE 1982', ctx.markers.still, Infinity, { y: 0.2, size: 70, bg: 'rgba(200,140,0,0.92)' });
    },
  },
  // ── b05 "While they're out partying, by the way, I'm practising limbo."
  {
    name: 'broom limbo', start: 'b05-0.1', set: 'room',
    setup(ctx) {
      const st = ctx.store = roomBase(ctx, { table: false });
      const P = ctx.props;
      ctx.add(P.chair); P.chair.position.copy(st.F(-0.8, 0, 0.3)); P.chair.rotation.set(0, st.yaw + Math.PI / 2, 0);
      ctx.add(P.chair2); P.chair2.position.copy(st.F(0.8, 0, 0.3)); P.chair2.rotation.set(0, st.yaw - Math.PI / 2, 0);
      ctx.add(P.broom); P.broom.position.copy(st.F(0, 0.58, 0.3)); P.broom.rotation.set(0, st.yaw + Math.PI / 2, 0);
      ctx.place('marcus', st.F(0, 0, -0.9)); ctx.cast.marcus.root.rotation.set(0, st.yaw, 0);
    },
    update(ctx, lt, u) {
      const m = ctx.cast.marcus, { F } = ctx.store;
      m.root.position.copy(F(0, 0, -0.9 + 2.0 * u));
      lieDown(m, ctx.t, { face: 'determined', ft: OPEN(m) });
      ctx.cam.set({ pos: F(1.5, 0.75, 2.4), look: F(0, 0.3, 0.3), fov: 42 });
    },
  },
  // ── b06 "I sleep under my bed. I go under doors."
  {
    name: 'under the bed', start: 'b06-0.1', set: 'room',
    setup(ctx) {
      const st = ctx.store = roomBase(ctx, { table: false });
      const b = ctx.anchor('room.bed'), Fb = frame(rel(b), yawOf(b));
      ctx.place('marcus', Fb(0, -rel(b).y + st.floorY, 1.45)); ctx.cast.marcus.root.rotation.set(0, Fb.yaw, 0);
      st.Fb = Fb;
    },
    update(ctx) {
      const m = ctx.cast.marcus, { Fb, F } = ctx.store;
      lieDown(m, ctx.t, { face: 'sleepy', ft: SHUT(m), flat: 0.6 });
      ctx.cam.set({ pos: Fb(0.35, 0.3, 3.3), look: Fb(0, -0.45, 1.9), fov: 42 });
    },
  },
  {
    name: 'under the door', start: 'doors-0.5', set: 'room',
    setup(ctx) {
      const st = ctx.store = roomBase(ctx, { table: false });
      const d = ctx.anchor('room.door'), Fd = frame(rel(d), yawOf(d));
      st.Fd = Fd; st.dy = -rel(d).y + st.floorY;
      ctx.place('marcus', Fd(0, st.dy, 1.6)); ctx.cast.marcus.root.rotation.set(0, Fd.yaw, 0);
    },
    update(ctx) {
      const m = ctx.cast.marcus, { Fd, dy } = ctx.store, td = ctx.markers.doors;
      const k = clamp((ctx.t - (td - 0.3)) / 1.0, 0, 1);
      m.root.position.copy(Fd(0, dy, 1.6 - 1.75 * k));
      const flat = lerp(1, 0.08, clamp((1.6 - 1.75 * k - 0.5) < 0 ? (0.5 - (1.6 - 1.75 * k)) / 0.4 : 0, 0, 1));
      lieDown(m, ctx.t, { face: 'determined', ft: OPEN(m), flat });
      ctx.cam.set({ pos: Fd(1.3, dy + 0.6, 2.3), look: Fd(0, dy + 0.4, 0.3), fov: 44 });
      if (flat < 0.3) tag(ctx, 'FLAT', td + 0.4, Infinity, { y: 0.2, size: 80, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b07 quote: "How low can you go? Lower." — a worm
  {
    name: 'worm card', start: 'b07-0.1', set: 'room',
    setup(ctx) { const st = ctx.store = roomBase(ctx); ctx.place('marcus', st.F(-0.2, 0, 1.0)); ctx.cast.marcus.root.rotation.set(0, st.yaw - Math.PI / 2, 0); },
    update(ctx, lt, u) {
      const m = ctx.cast.marcus, { F } = ctx.store;
      lieDown(m, ctx.t, { face: 'smug', ft: OPEN(m) });
      const fp = faceOf(m);
      ctx.cam.move(topCam(m, 1.5, 42), topCam(m, 1.1, 40), u);
      quoteCard(ctx, 'How low can you go? Lower.', 'a worm', ctx.markers.quote1, ctx.markers.quote1end, { y: 0.32, byAt: ctx.markers.worm });
    },
  },
  // ── b08 HUSS ×3 — under a chair, under the cat, under the pigeon
  ...[0, 1, 2].map((i) => ({
    name: `under things #${i + 1}`, start: i === 0 ? 'b08.h0-0.12' : `b08.h${i}-0.03`, set: 'room',
    setup(ctx) {
      const st = ctx.store = roomBase(ctx, { table: false });
      const P = ctx.props;
      if (i === 0) { ctx.add(P.chair); P.chair.position.copy(st.F(0, 0, 0.3)); P.chair.rotation.set(0, st.yaw + Math.PI / 2, 0); }
      if (i === 1) { ctx.place('cat', st.F(0, 0, 0.3)); ctx.cast.cat.root.rotation.set(0, st.yaw + Math.PI / 2, 0); ctx.cast.cat.root.scale.setScalar(1.7); }
      if (i === 2) { ctx.place('pigeon', st.F(0, 0, 0.3)); ctx.cast.pigeon.root.rotation.set(0, st.yaw + Math.PI / 2, 0); ctx.cast.pigeon.root.scale.setScalar(1.6); }
      ctx.place('marcus', st.F(-1.1, 0, 0.3)); ctx.cast.marcus.root.rotation.set(0, st.yaw - Math.PI / 2, 0);
    },
    update(ctx) {
      const m = ctx.cast.marcus, { F } = ctx.store, hits = ctx.hussTimes('b08').map((h) => h + 0.03), h = hits[i];
      const k = clamp((ctx.t - h + 0.1) / 0.32, 0, 1);
      m.root.position.copy(F(-1.1 + 2.2 * ease.inOutCubic(k), 0, 0.3));
      lieDown(m, ctx.t, { face: k > 0 && k < 1 ? 'huss' : 'determined', ft: OPEN(m), flat: i === 0 ? 1 : lerp(1, 0.35, Math.sin(Math.PI * k)) });
      if (i === 1) { ctx.cast.cat.pose('stare', ctx.t); ctx.cast.cat.face('stare', OPEN(ctx.cast.cat)); }
      if (i === 2) { ctx.cast.pigeon.pose('idle', ctx.t); ctx.cast.pigeon.face('shocked', ctx.t); }
      ctx.cam.set({ pos: F(0.3, 0.5, 2.0), look: F(0, 0.3, 0.3), fov: 44 });
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b09 "Then came the Summer Party Limbo Championship."  /  b10 mayor: "How low can you go?"
  {
    name: 'championship', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      ctx.store = limboStage(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 22).add(up(10)), look: c.clone().add(up(2)), fov: 44 };
      ctx.store.to = { pos: ctx.store.S(0, 2.2, 8.0), look: ctx.store.S(0, 1.1, 2.0), fov: 44 };
    },
    update(ctx, lt, u) { const st = ctx.store; limboAnim(ctx, st); ctx.cam.move(st.from, st.to, u, ease.inOutCubic); },
  },
  {
    name: 'how low', start: 'b10-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = limboStage(ctx);
      const P = ctx.props; ctx.add(P.mic7); P.mic7.position.copy(st.S(1.4, 0, 2.6)); P.mic7.rotation.set(0, st.S.yaw + Math.PI, 0);
      ctx.place('mayor', st.S(1.4, 0, 2.3)); ctx.cast.mayor.root.rotation.set(0, st.S.yaw, 0);
    },
    update(ctx) {
      const st = ctx.store, m = ctx.cast.mayor; limboAnim(ctx, st);
      m.pose('point', ctx.t); m.face('grin', ctx.t);
      const hp = headPos(m, 0.2);
      ctx.cam.set({ pos: hp.clone().addScaledVector(st.S.fwd, 2.4).add(V(0, -0.1, 0)), look: hp.clone().add(up(-0.35)), fov: 40 });
    },
  },
  // ── b11 "Brenda fell asleep under the bar. Disqualified for comfort."
  {
    name: 'brenda asleep', start: 'b11-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = limboStage(ctx); ctx.place('brenda', st.S(0, 0, 2.2)); ctx.cast.brenda.root.rotation.set(0, st.S.yaw + Math.PI / 2, 0); ctx.props.limbo.userData.set(0.85); },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.brenda; limboAnim(ctx, st);
      lieDown(b, 0, { face: 'sleepy', ft: SHUT(b) });
      b.setAccessory('sunglasses', false);
      const fp = faceOf(b);
      ctx.cam.set({ pos: st.S(0.4, 1.3, 4.6), look: st.S(0, 0.45, 2.2), fov: 42 });
      tag(ctx, 'Z z z', ctx.time('b11') + 0.6, Infinity, { x: 0.62, y: 0.4, size: 96, bg: null, rot: -0.2 });
      stamp(ctx, 'OUT', ctx.markers.comfort);
    },
  },
  // ── b12 "The mayor's hat hit the bar. Out."
  {
    name: 'mayor hat', start: 'b12-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = limboStage(ctx); ctx.place('mayor', st.S(0, 0, 1.3)); ctx.cast.mayor.root.rotation.set(0, st.S.yaw, 0); ctx.props.limbo.userData.set(1.45); },
    update(ctx) {
      const st = ctx.store, m = ctx.cast.mayor, th = ctx.markers.hat; limboAnim(ctx, st, { mode: 'peer' });
      const k = clamp((ctx.t - (th - 0.9)) / 0.9, 0, 1);
      m.root.position.copy(st.S(0, 0, 2.2 - 0.9 + 0.8 * k)); m.root.rotation.set(0, st.S.yaw, 0);
      m.pose('idle', 0, { intensity: 0 }); m.joints.torso.rotation.x += -0.75; m.joints.head.rotation.x += -0.3;
      m.joints.armL.rotation.z += 1.3; m.joints.armR.rotation.z += -1.3;
      m.face(ctx.t > th ? 'shocked' : 'determined', ctx.t);
      const kn = clamp((ctx.t - th) / 0.35, 0, 1);
      ctx.props.limbo.userData.set(1.45, 0, ease.inQuad(kn));
      ctx.cam.set({ pos: st.S(1.5, 1.35, 4.1), look: st.S(0, 1.2, 2.0), fov: 42 });
      stamp(ctx, 'OUT', ctx.markers.out2);
    },
  },
  // ── b13 "Then it was me. And the bar. At one centimetre."
  {
    name: 'one centimetre', start: 'b13-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = limboStage(ctx, { queue: false }); ctx.place('marcus', st.S(-1.6, 0, 2.2)); ctx.cast.marcus.root.rotation.set(0, st.S.yaw + Math.PI / 2, 0); },
    update(ctx, lt, u) {
      const st = ctx.store, m = ctx.cast.marcus; limboAnim(ctx, st, { mode: 'peer' });
      const tc = ctx.markers.cm, k = clamp((ctx.t - (tc - 0.6)) / 0.6, 0, 1);
      ctx.props.limbo.userData.set(lerp(0.85, 0.06, ease.inOutCubic(k)));
      lieDown(m, ctx.t, { face: 'determined', ft: OPEN(m) });
      ctx.cam.move({ pos: st.S(-1.5, 0.95, 5.6), look: st.S(-1.55, 0.25, 2.2), fov: 42 }, { pos: st.S(-1.5, 0.7, 4.9), look: st.S(-1.55, 0.2, 2.2), fov: 40 }, u);
      tag(ctx, '1 CM', tc, Infinity, { y: 0.2, size: 110, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b14 HUSS ×6 — under the 1 cm bar, squashed flat
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `the 1cm limbo #${i + 1}`, start: i === 0 ? 'b14.h0-0.12' : `b14.h${i}-0.03`, set: 'town',
    setup(ctx) { const st = ctx.store = limboStage(ctx, { queue: false }); ctx.place('marcus', st.S(-1.6, 0, 2.2)); ctx.cast.marcus.root.rotation.set(0, st.S.yaw + Math.PI / 2, 0); ctx.props.limbo.userData.set(0.06); },
    update(ctx) {
      const st = ctx.store, m = ctx.cast.marcus, hits = ctx.hussTimes('b14').map((h) => h + 0.03);
      limboAnim(ctx, st, { mode: 'peer' }); ctx.props.limbo.userData.set(0.06);
      const u = pushes(ctx, hits, 6), x = -1.6 + 3.0 * u;
      m.root.position.copy(st.S(x, 0, 2.2));
      const under = Math.abs(x) < 1.1;
      const h = lastBefore(hits, ctx.t);
      lieDown(m, ctx.t, { face: h != null && ctx.t - h < 0.2 ? 'huss' : 'determined', ft: OPEN(m), flat: under ? 0.06 : 1 });
      const cams = [{ pos: st.S(x, 0.55, 4.7), look: st.S(x, 0.15, 2.2) }, { pos: st.S(x + 1.2, 0.7, 4.4), look: st.S(x, 0.12, 2.2) }, null, { pos: st.S(0, 2.4, 3.2), look: st.S(0, 0.0, 2.2) }, { pos: st.S(x - 1.2, 0.7, 4.4), look: st.S(x, 0.12, 2.2) }, { pos: st.S(0, 1.5, 6.4), look: st.S(0, 0.3, 2.2) }][i];
      if (cams) ctx.cam.set({ ...cams, fov: 42 }); else { const F = frameAt(ctx, 'square.standA'); ctx.cam.set({ pos: F(0, 2.4, 5.0), look: F(0, 2.0, 0), fov: 42 }); }
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2); ctx.cam.shake(0.1, ctx.t, 30 + i);
    },
  })),
  // ── b15 "Top ten respectful moments. Number seven: the bar bowed to me."
  {
    name: 'the bar bowed', start: 'b15-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = limboStage(ctx, { queue: false }); ctx.place('marcus', st.S(1.4, 0, 2.2)); ctx.cast.marcus.root.rotation.set(0, st.S.yaw + Math.PI / 2, 0); },
    update(ctx) {
      const st = ctx.store, m = ctx.cast.marcus; limboAnim(ctx, st, { mode: 'clap' });
      lieDown(m, ctx.t, { face: 'smug', ft: OPEN(m) });
      const k = clamp((ctx.t - ctx.markers.bow) / 0.5, 0, 1);
      ctx.props.limbo.userData.set(0.5, ease.outBack(k));
      ctx.cam.set({ pos: st.S(0.6, 1.0, 5.6), look: st.S(0.55, 0.45, 2.2), fov: 42 });
      top10Card(ctx, 7, ctx.time('b15') + 0.05, Infinity, { popAt: ctx.markers.top7 });
    },
  },
  // ── b16 quote: "Never look down. Unless you're already there." — a submarine
  {
    name: 'submarine card', start: 'b16-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = limboStage(ctx, { queue: false }); ctx.place('marcus', st.S(1.4, 0, 2.2)); ctx.cast.marcus.root.rotation.set(0, st.S.yaw + Math.PI / 2, 0); },
    update(ctx, lt, u) {
      const st = ctx.store, m = ctx.cast.marcus; limboAnim(ctx, st, { mode: 'clap' });
      lieDown(m, ctx.t, { face: 'smug', ft: OPEN(m) }); ctx.props.limbo.userData.set(0.5, 1);
      const fp = faceOf(m);
      ctx.cam.move(topCam(m, 1.6, 42), topCam(m, 1.2, 40), u);
      quoteCard(ctx, "Never look down. Unless you're already there.", 'a submarine', ctx.markers.quote2, ctx.markers.quote2end, { y: 0.32, byAt: ctx.markers.sub });
    },
  },
  // ── b17 "I won. But I can't stand up anymore."
  {
    name: "can't stand up", start: 'b17-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = limboStage(ctx, { queue: false }); ctx.place('marcus', st.S(1.4, 0, 2.6)); ctx.cast.marcus.root.rotation.set(0, st.S.yaw + Math.PI / 2, 0); },
    update(ctx) {
      const st = ctx.store, m = ctx.cast.marcus, tc = ctx.markers.cant; limboAnim(ctx, st, { mode: 'clap' });
      lieDown(m, ctx.t, { face: ctx.t > tc ? 'sweat' : 'smile', ft: OPEN(m) });
      const tries = ctx.t > tc ? Math.max(0, Math.sin((ctx.t - tc) * 7)) : 0;
      m.joints.torso.rotation.x += -0.35 * tries; m.joints.head.rotation.x += -0.3 * tries;
      const tr = ctx.props.trophy7; ctx.add(tr); tr.scale.setScalar(1.3); m.root.updateMatrixWorld(true);
      tr.position.copy(m.joints.torso.localToWorld(V(0, 0.3, 0.2))); tr.rotation.set(0, 0, 0);
      const fp = faceOf(m);
      const ch0 = m.joints.torso.localToWorld(V(0, 0.3, 0.1)); ctx.cam.set({ pos: ch0.clone().add(up(1.9)).addScaledVector(st.S.fwd, 0.5), look: ch0.clone().addScaledVector(facing(m.root), -0.25), fov: 42 });
    },
  },
  // ── b18 "Now in this town, everybody parties. Except me."  /  b19 "I live down here now."
  {
    name: 'down here', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 7, hats: true });
      const F = frameAt(ctx, 'street.crowdA');
      ctx.place('marcus', F(0, 0, 6.6)); ctx.cast.marcus.root.rotation.set(0, F.yaw + Math.PI / 2, 0);
      ctx.store = { crowd, F };
    },
    update(ctx, lt) {
      const { crowd, F } = ctx.store, m = ctx.cast.marcus;
      animateCrowd(crowd, ctx.t);
      m.root.position.copy(F(-1.6 + 0.6 * lt, 0, 6.6));
      lieDown(m, ctx.t, { face: 'smile', ft: OPEN(m) });
      if (ctx.t < ctx.markers.exceptMe - 0.1) ctx.cam.set({ pos: F(0, 2.6, 10.5), look: F(0, 0.6, 5.0), fov: 44 });
      else ctx.cam.set(sideCam(m, F.fwd, 2.4, 0.35));
    },
  },
  {
    name: 'i live down here', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 7, hats: true });
      const F = frameAt(ctx, 'street.crowdA');
      ctx.place('marcus', F(-0.2, 0, 6.6)); ctx.cast.marcus.root.rotation.set(0, F.yaw + Math.PI / 2, 0);
      ctx.place('cat', F(-1.2, 0, 6.6)); ctx.cast.cat.root.rotation.set(0, F.yaw - Math.PI / 2, 0);
      ctx.store = { crowd, F };
    },
    update(ctx, lt) {
      const { crowd, F } = ctx.store, m = ctx.cast.marcus, cat = ctx.cast.cat;
      animateCrowd(crowd, ctx.t);
      lieDown(m, ctx.t, { face: 'smile', ft: OPEN(m) });
      m.joints.armL.rotation.x += -2.4 + 0.4 * Math.sin(ctx.t * 9);
      const ck = clamp(lt / 1.2, 0, 1);
      cat.root.position.copy(F(-1.2 + 2.2 * ck, 0, 6.6)); cat.pose('hop', 0, { u: clamp((ck - 0.35) / 0.3, 0, 1), height: 0.5 }); cat.face('stare', OPEN(cat));
      ctx.cam.set({ pos: F(0.3, 0.45, 9.0), look: F(-0.1, 0.3, 6.6), fov: 42 });
    },
  },
  // ── b20 HUSS ×3 — he slides out of frame; end
  {
    name: 'slide off', start: 'b20.h0-0.12', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 7, hats: true });
      const F = frameAt(ctx, 'street.crowdA');
      ctx.place('marcus', F(-0.2, 0, 6.6)); ctx.cast.marcus.root.rotation.set(0, F.yaw + Math.PI / 2, 0);
      ctx.store = { crowd, F };
    },
    update(ctx) {
      const { crowd, F } = ctx.store, m = ctx.cast.marcus, hits = ctx.hussTimes('b20').map((h) => h + 0.03);
      animateCrowd(crowd, ctx.t);
      const u = pushes(ctx, hits, 3);
      m.root.position.copy(F(-0.2 + 2.6 * u, 0, 6.6));
      const h = lastBefore(hits, ctx.t);
      lieDown(m, ctx.t, { face: h != null && ctx.t - h < 0.2 ? 'huss' : 'smile', ft: OPEN(m) });
      ctx.cam.set({ pos: F(0.3, 0.45, 9.0), look: F(-0.1, 0.3, 6.6), fov: 42 });
      ctx.cam.punch(hits, ctx.t, 0.08, 0.2);
      const tEnd = ctx.time('b20.end') + 0.5, ki = clamp((ctx.t - tEnd) / 0.45, 0, 1);
      if (ki > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - ki); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * 0.5, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); });
    },
  },
];
