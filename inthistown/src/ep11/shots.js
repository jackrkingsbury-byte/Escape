// In This Town — Episode 11: "Hide and Seek".  The kid has been "it" since that Friday in 1982.  Nobody hid —
// they threw a party.  At one million he finds everyone in four seconds… and now the whole town counts.
// Film contract: SPEC.md §8.  Timeline: episodes/ep11/timeline.json (audio/build_episode.py ep11).
import * as THREE from 'three';
import { buildTown } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { crowdGrid, animateCrowd, yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { init as initEp1, V, frameAt, lastBefore } from '../shots.js';
import { makeOrb } from '../ep10/shots.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
export const cast = {
  me: MAIN.me, grandad: MAIN.grandad, brenda: MAIN.brenda, marcus: MAIN.marcus, mayor: MAIN.mayor, pigeon: MAIN.pigeon,
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 11, banner: ['FRIDAY NIGHT', 'PARTY', '14.05.1982'] }),
};

function boxM(w, h, d, c, extra = {}) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...extra })); m.castShadow = true; return m; }

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.catBox = makeCatBox();
  P.moon11 = makeOrb('#eef0ff', '#9aa0c8', 'moon');
  P.lectern = boxM(0.62, 0.95, 0.5, '#7a1f2b'); P.lectern.geometry.translate(0, 0.475, 0);
  P.pigeonHat = makeTinyTopHat();
  P.fill = new THREE.PointLight('#c8d8ff', 5, 9, 1.4);
}
/** A cardboard box with a cat in it: ears over the rim, eyes peeking, tail out of a hole, a party hat on top. */
function makeCatBox() {
  const g = new THREE.Group(), card = '#c8955a', cat = '#f08a2c';
  const W = 0.62, H = 0.5;
  const mat = new THREE.MeshStandardMaterial({ color: card, roughness: 0.9 });
  for (const [x, z, w, d] of [[0, W / 2, W, 0.03], [0, -W / 2, W, 0.03], [W / 2, 0, 0.03, W], [-W / 2, 0, 0.03, W]]) { const s = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), mat); s.position.set(x, H / 2, z); s.castShadow = true; g.add(s); }
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(W, 0.03, W), mat); bottom.position.y = 0.015; g.add(bottom);
  const tape = boxM(0.1, H + 0.005, W + 0.04, '#e0c48a'); tape.position.y = H / 2; tape.scale.x = 0.5; g.add(tape);
  const flaps = [];
  for (const [x, z, ry] of [[0, W / 2, 0], [0, -W / 2, Math.PI], [W / 2, 0, Math.PI / 2], [-W / 2, 0, -Math.PI / 2]]) {
    const hinge = new THREE.Group(); hinge.position.set(x, H, z); hinge.rotation.y = ry; g.add(hinge);
    const f = new THREE.Mesh(new THREE.BoxGeometry(W, 0.24, 0.025), mat); f.position.y = 0.12; f.castShadow = true; hinge.add(f);
    hinge.userData.base = flaps.length === 0 ? 2.3 : 1.15; hinge.rotation.x = hinge.userData.base; flaps.push(hinge);
  }
  // the cat: a head peeking over the front rim
  const head = new THREE.Group(); head.position.set(0, H - 0.02, 0.1); g.add(head);
  const skull = boxM(0.34, 0.22, 0.26, cat); skull.position.y = 0.06; head.add(skull);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.13, 4), new THREE.MeshStandardMaterial({ color: cat })); ear.position.set(s * 0.11, 0.22, 0); ear.rotation.y = Math.PI / 4; head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 4), new THREE.MeshStandardMaterial({ color: '#ff9fb0' })); inner.position.set(s * 0.11, 0.205, 0.03); inner.rotation.y = Math.PI / 4; head.add(inner);
    const eye = boxM(0.05, 0.06, 0.01, '#1d1d22'); eye.position.set(s * 0.075, 0.085, 0.131); head.add(eye);
    const glint = boxM(0.015, 0.015, 0.005, '#ffffff'); glint.position.set(s * 0.075 + 0.01, 0.1, 0.137); head.add(glint);
  }
  // tail out of a hole in the side
  const tail = new THREE.Group(); tail.position.set(W / 2, 0.16, -0.12); g.add(tail);
  const segs = [];
  let parent = tail;
  for (let i = 0; i < 5; i++) { const s = new THREE.Group(); s.position.set(i ? 0.08 : 0, 0, 0); parent.add(s); const m = boxM(0.09, 0.06, 0.06, cat); m.position.x = 0.045; s.add(m); segs.push(s); parent = s; }
  const tip = boxM(0.06, 0.06, 0.06, '#fff3e3'); tip.position.x = 0.11; segs[4].add(tip);
  const hat = new THREE.Group(); hat.position.set(0, 0.17, 0); hat.rotation.z = 0.18; head.add(hat);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 16), new THREE.MeshStandardMaterial({ color: '#ff4fa3', roughness: 0.5 })); cone.position.y = 0.11; hat.add(cone);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffd23f' })); pom.position.y = 0.23; hat.add(pom);
  g.userData = {
    head, hat, flaps,
    /** dance: bounce + sway; wag: tail swish; peek 0…1 how far the head is up; nod 0…1 */
    set(t, { dance = 0, wag = 1, peek = 1, nod = 0 } = {}) {
      const b = dance * Math.abs(Math.sin(t * Math.PI * 2.1));
      g.children.forEach(() => {});
      g.position.y = (g.userData.baseY ?? g.position.y);
      head.position.y = H - 0.12 + 0.18 * peek + 0.04 * b;
      head.rotation.x = -0.35 * nod * Math.max(0, Math.sin(t * 9));
      head.rotation.z = 0.12 * dance * Math.sin(t * Math.PI * 2.1);
      flaps.forEach((f, i) => { f.rotation.x = f.userData.base + 0.25 * dance * Math.sin(t * 8 + i); });
      segs.forEach((s, i) => { s.rotation.y = wag * 0.32 * Math.sin(t * 5 - i * 0.7); s.rotation.z = 0.25 + 0.05 * i; });
      return b;
    },
  };
  return g;
}
function makeTinyTopHat() {
  const g = new THREE.Group(), blk = new THREE.MeshStandardMaterial({ color: '#16161c', roughness: 0.45 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 20), blk); g.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.05, 0.1, 20), blk); crown.position.y = 0.055; g.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0505, 0.0505, 0.02, 20), new THREE.MeshStandardMaterial({ color: '#ffd23f' })); band.position.y = 0.018; g.add(band);
  return g;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
const CURB = 0.12;
const LAMP_KID = [3, -5.15], LAMP_GRANDAD = [15, -5.15];
const LAMPS_N = [-33, -21, -9, 3, 15, 27], LAMPS_S = [-27, -15, -3, 9, 21];
const HIDERS = ['box', 'grandad', 'pigeon', 'brenda', 'marcus', 'mayor'];

function T(ctx) { ctx.set.root.updateMatrixWorld(true); const r = ctx.set.root; const f = (x, y, z) => r.localToWorld(V(x, y, z)); f.yaw = yawOf(r); return f; }
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.22, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.8)', rot: -0.03, ...o, scale: Math.max(0.01, pop) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.3, size: 170, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.15, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
/** The hide-and-seek counter, scoreboard style, near the top of the frame. */
function counter(ctx, n, o = {}) {
  const s = Math.round(n).toLocaleString('en-US');
  ctx.fx.text(s, { x: 0.5, y: 0.16, size: 120, fill: '#3cff6b', stroke: '#000000', line: 10, bg: 'rgba(8,10,14,0.88)', ...o });
}
const iris = (ctx, t0, cy = 0.45) => { const k = clamp((ctx.t - t0) / 0.45, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); }); };
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }

/** Counting: forehead on the forearms, arms up against the post. */
function countPose(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.4 });
  const J = ch.joints;
  J.torso.rotation.x += 0.16 * k; J.head.rotation.x += 0.32 * k;
  for (const s of ['L', 'R']) {
    J['arm' + s].rotation.x += -2.05 * k; J['arm' + s].rotation.z += (s === 'L' ? -0.38 : 0.38) * k;
    J['foreArm' + s].rotation.x += -1.55 * k;
  }
  ch.face('squint', 0);
}
function quietTown(ctx, glow = 0.9) {
  ctx.set.setLighting?.('quiet_night');
  ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('windowGlow', glow);
}
function partyTown(ctx, { fireworks = true } = {}) {
  ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', fireworks);
  ctx.set.set?.('foam', 0); ctx.set.set?.('windowGlow', 1);
}
/** The kid at lamp post B, face to the post (local −Z).  Returns T. */
function kidAtLamp(ctx) {
  const L = T(ctx), [x, z] = LAMP_KID;
  ctx.place('me', L(x, CURB, z + 0.36)); ctx.cast.me.root.rotation.set(0, L.yaw + Math.PI, 0);
  return L;
}
/** Side/back camera on the counting kid.  d: distance; side: +1 from the east. */
const kidCam = (L, d = 3.0, h = 1.45, side = 1, fov = 40, ang = 0.35) => { const [x, z] = LAMP_KID; return { pos: L(x + side * d * Math.cos(ang), h, z + 0.3 + d * Math.sin(ang)), look: L(x, h > 2 ? 1.2 : 1.25, z + 0.25), fov }; };
/** A soft fill light that rides with the camera (night shots). */
function fill(ctx, cam, k = 1) { const f = ctx.props.fill; ctx.add(f); f.position.copy(cam.pos).add(up(0.4)); f.intensity = 5 * k; }
const setCam = (ctx, cam, k = 1) => { ctx.cam.set(cam); fill(ctx, cam, k); };
/** Place someone counting at a post / wall. */
function counters(ctx, L) {
  const N = (x) => [x, -5.15 + 0.36, Math.PI], S = (x) => [x, 5.15 - 0.36, 0], W = (x, side) => [x, side * 7.6, side < 0 ? Math.PI : 0];
  const plan = [['mayor', N(3)], ['grandad', N(-9)], ['brenda', N(-21)], ['marcus', N(-33)], ['pigeon', W(-4, -1)],
    [EXTRA_IDS[0], N(15)], [EXTRA_IDS[1], N(27)], [EXTRA_IDS[2], S(9)], [EXTRA_IDS[3], S(-3)], [EXTRA_IDS[4], S(-15)], [EXTRA_IDS[5], S(-27)], [EXTRA_IDS[6], S(21)],
    [EXTRA_IDS[7], W(-14, -1)], [EXTRA_IDS[8], W(9, -1)], [EXTRA_IDS[9], W(-2, 1)], [EXTRA_IDS[10], W(-17, 1)], [EXTRA_IDS[11], W(13, 1)]];
  return plan.map(([id, sp]) => { ctx.place(id, L(sp[0], CURB, sp[1])); ctx.cast[id].root.rotation.set(0, L.yaw + sp[2], 0); return id; });
}
function animCounters(ctx, ids) { ids.forEach((id, k) => { const c = ctx.cast[id]; if (c.kind === 'human') countPose(c, ctx.t + k); else { c.pose('sit', ctx.t); c.face('sleepy', 2); } }); }

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody parties."
  {
    name: 'party crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 11, hats: true });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh'), d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store = { crowd, from: { pos: hi, look: c.clone().add(up(0.5)), fov: 50 }, to: { pos: c.clone().addScaledVector(d, 9).add(up(3.2)), look: ctx.point('street.crowdA').add(up(1.3)), fov: 42 } };
    },
    update(ctx, lt, u) { animateCrowd(ctx.store.crowd, ctx.t); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic); },
  },
  // ── b02 "Except me. I'm counting."
  {
    name: 'counting', start: 'b02-0.1', set: 'town',
    setup(ctx) { quietTown(ctx); ctx.store = { L: kidAtLamp(ctx) }; },
    update(ctx, lt) {
      const { L } = ctx.store; countPose(ctx.cast.me, ctx.t);
      const a = kidCam(L, 7.5, 2.4, 1, 40, 0.6), b = kidCam(L, 5.2, 1.4, 1, 40, 0.3); ctx.cam.move(a, b, clamp(lt / 2.2, 0, 1), ease.inOutSine); fill(ctx, b);
      if (ctx.t > ctx.markers.counting - 0.1) counter(ctx, 999941);
    },
  },
  // ── b03 HUSS ×6 — one number per HUSS
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `count #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'town',
    setup(ctx) { quietTown(ctx); ctx.store = { L: kidAtLamp(ctx) }; },
    update(ctx) {
      const { L } = ctx.store, hits = ctx.hussTimes('b03').map((h) => h + 0.03), n = hits.filter((h) => h <= ctx.t).length;
      const me = ctx.cast.me; countPose(me, ctx.t);
      const h = lastBefore(hits, ctx.t); if (h != null && ctx.t - h < 0.15) me.joints.head.rotation.x += 0.12 * Math.sin(Math.PI * (ctx.t - h) / 0.15);
      const cams = [kidCam(L, 3.4, 1.55, 1, 38, 0.2), kidCam(L, 3.0, 1.75, -1, 36, 0.25), kidCam(L, 6.0, 2.8, 1, 44, 0.7)];
      setCam(ctx, cams[i % 3]); ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
      counter(ctx, 999941 + n, { scale: h != null && ctx.t - h < 0.12 ? 1.12 : 1 });
    },
  })),
  // ── b04 "We started hide and seek on a Friday. It's still Friday."
  {
    name: 'still friday', start: 'b04-0.1', set: 'town',
    setup(ctx) { partyTown(ctx); ctx.set.set?.('standsCrowd', true); ctx.store = { banner: ctx.point('square.banner'), bc: ctx.point('square.bannerCam') }; },
    update(ctx, lt) {
      const { banner, bc } = ctx.store;
      ctx.cam.move({ pos: bc, look: banner.clone().add(up(-0.4)), fov: 54 }, { pos: bc.clone().lerp(banner, 0.15), look: banner.clone().add(up(-0.2)), fov: 52 }, clamp(lt / 2.6, 0, 1));
      tag(ctx, 'STILL FRIDAY', ctx.markers.still, Infinity, { y: 0.14, size: 70, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b05 "Nobody hid. They threw a party instead."  /  b06 "The cat hid in a box. The box went clubbing."
  {
    name: 'nobody hid', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const F = frameAt(ctx, 'street.crowdB');
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdB', { cols: 6, dx: 1.2, dz: 1.25, seed: 5, hats: true });
      ctx.store = { F, crowd };
    },
    update(ctx, lt) {
      const { F, crowd } = ctx.store; animateCrowd(crowd, ctx.t);
      ctx.cam.move({ pos: F(1.2, 2.6, 9.5), look: F(0, 1.1, 1.2), fov: 46 }, { pos: F(0.6, 2.0, 8.0), look: F(0, 1.1, 1.2), fov: 44 }, clamp(lt / 2.5, 0, 1));
      tag(ctx, 'NOBODY HID', ctx.time('b05') + 0.1, ctx.markers.instead - 0.05, { y: 0.18 });
      tag(ctx, 'PARTY INSTEAD', ctx.markers.instead, Infinity, { y: 0.18, bg: 'rgba(255,79,163,0.9)' });
    },
  },
  {
    name: 'box went clubbing', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const F = frameAt(ctx, 'street.crowdB');
      const crowd = crowdGrid(ctx, EXTRA_IDS.slice(0, 12), 'street.crowdB', { cols: 6, dx: 1.25, dz: 1.2, seed: 6, hats: true, offset: [0, 0, -0.6] });
      const B = ctx.props.catBox; ctx.add(B); B.position.copy(F(0.15, 0, 3.0)); B.rotation.set(0, F.yaw, 0); B.userData.baseY = B.position.y;
      ctx.store = { F, crowd };
    },
    update(ctx) {
      const { F, crowd } = ctx.store, B = ctx.props.catBox, tc = ctx.markers.clubbing;
      animateCrowd(crowd, ctx.t);
      const club = ctx.t > tc - 0.15;
      const b = B.userData.set(ctx.t, { dance: club ? 1 : 0, peek: club ? 1 : 0.8 });
      B.position.y = B.userData.baseY + (club ? 0.12 * b : 0); B.rotation.y = F.yaw + (club ? 0.4 * Math.sin(ctx.t * 4.2) : 0);
      ctx.cam.set(club ? { pos: F(0.3, 1.5, 6.6), look: F(0.1, 0.8, 3.0), fov: 42 } : { pos: F(0.3, 1.1, 5.4), look: F(0.15, 0.55, 3.0), fov: 36 });
      if (club) tag(ctx, 'CLUBBING', tc, Infinity, { y: 0.18, bg: 'rgba(138,92,255,0.92)' });
    },
  },
  // ── b07 "Grandad hid behind a lamppost. He's wider than the lamppost."  /  b08 HUSS ×3 — shuffle, shuffle, shuffle
  {
    name: 'grandad behind lamppost', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const L = T(ctx), [x, z] = LAMP_GRANDAD;
      ctx.place('grandad', L(x, CURB, z - 0.32)); ctx.cast.grandad.root.rotation.set(0, L.yaw, 0);
      ctx.store = { L };
    },
    update(ctx, lt) {
      const { L } = ctx.store, [x, z] = LAMP_GRANDAD, g = ctx.cast.grandad;
      g.pose('idle', ctx.t, { intensity: 0.2 }); g.face('determined', ctx.t);
      g.joints.armL.rotation.z += -0.12; g.joints.armR.rotation.z += 0.12;
      ctx.cam.move({ pos: L(x, 1.15, z + 6.0), look: L(x, 1.1, z), fov: 34 }, { pos: L(x, 1.15, z + 4.6), look: L(x, 1.15, z), fov: 34 }, clamp(lt / 3, 0, 1));
      tag(ctx, "HE'S RIGHT THERE", ctx.markers.wider, Infinity, { y: 0.18 });
    },
  },
  ...[0, 1, 2].map((i) => ({
    name: `grandad shuffle #${i + 1}`, start: i === 0 ? 'b08.h0-0.12' : `b08.h${i}-0.03`, set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const L = T(ctx), [x, z] = LAMP_GRANDAD;
      ctx.place('grandad', L(x, CURB, z - 0.32)); ctx.cast.grandad.root.rotation.set(0, L.yaw, 0);
      ctx.store = { L };
    },
    update(ctx) {
      const { L } = ctx.store, [x, z] = LAMP_GRANDAD, g = ctx.cast.grandad, hits = ctx.hussTimes('b08').map((h) => h + 0.03);
      const n = hits.filter((h) => h <= ctx.t).length, h = lastBefore(hits, ctx.t), dh = h != null ? ctx.t - h : 9;
      const target = [0, -0.22, 0.22, -0.22][n], prev = [0, 0, -0.22, 0.22][n];
      const off = lerp(prev, target, ease.outCubic(clamp(dh / 0.12, 0, 1)));
      g.root.position.copy(L(x + off, CURB, z - 0.32));
      g.pose('idle', ctx.t, { intensity: 0.2 }); g.face(dh < 0.2 ? 'huss' : 'determined', ctx.t);
      ctx.cam.set({ pos: L(x, 1.15, z + 4.6), look: L(x, 1.15, z), fov: 34 }); ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b09 quote: "The best hiding place is in plain sight." — the pigeon (Mayor)
  {
    name: 'plain sight card', start: 'b09-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx); ctx.set.set?.('standsCrowd', true);
      const S = frameAt(ctx, 'square.stage'), P = ctx.props;
      ctx.add(P.lectern); P.lectern.position.copy(S(0, 0, 2.3)); P.lectern.rotation.set(0, S.yaw, 0);
      ctx.place('pigeon', S(0, 0.95, 2.3)); ctx.cast.pigeon.root.rotation.set(0, S.yaw, 0);
      const hat = P.pigeonHat; ctx.add(hat, ctx.cast.pigeon.joints.head); hat.position.set(0, 0.135, -0.005); hat.rotation.set(-0.1, 0, 0.12);
      ctx.store = { S };
    },
    update(ctx, lt) {
      const { S } = ctx.store, p = ctx.cast.pigeon, tm = ctx.markers.mayor;
      p.pose('idle', ctx.t); p.face(ctx.t > tm ? 'smug' : 'neutral', ctx.t);
      ctx.cam.move({ pos: S(0.5, 1.6, 6.4), look: S(0, 1.15, 2.3), fov: 38 }, { pos: S(0.35, 1.35, 4.4), look: S(0, 1.12, 2.3), fov: 36 }, clamp((ctx.t - tm + 0.6) / 1.2, 0, 1), ease.inOutCubic);
      quoteCard(ctx, 'The best hiding place is in plain sight.', 'the pigeon (Mayor)', ctx.markers.quote1, tm - 0.05, { y: 0.32, byAt: ctx.markers.pigeon - 0.25 });
      tag(ctx, 'MAYOR. HIDING.', tm + 0.05, Infinity, { y: 0.18, bg: 'rgba(122,31,43,0.92)' });
    },
  },
  // ── b10 "Brenda froze in freeze dance. Best hider in town."
  {
    name: 'brenda still frozen', start: 'b10-0.1', set: 'town',
    setup(ctx) {
      quietTown(ctx, 0.6);
      const S = frameAt(ctx, 'square.stage');
      ctx.place('brenda', S(0, 0, 2.4)); ctx.cast.brenda.root.rotation.set(0, S.yaw + 0.25, 0);
      ctx.store = { S };
    },
    update(ctx, lt) {
      const { S } = ctx.store, b = ctx.cast.brenda;
      b.pose('dance', 1.37, { intensity: 1 }); b.face('grin', 0.5);   // one frozen frame of the dance, eyes open
      const f = humanFace(b);
      ctx.cam.move({ pos: S(0.9, 1.6, 6.0), look: S(0, 1.2, 2.4), fov: 40 }, { pos: S(0.5, 1.75, 4.6), look: f, fov: 36 }, clamp(lt / 2.6, 0, 1), ease.inOutSine);
      tag(ctx, 'NOBODY CHECKED', ctx.markers.best, Infinity, { y: 0.18 });
    },
  },
  // ── b11 "Top ten respectful moments. Number four: the moon closed its eyes too."
  {
    name: 'moon closes eyes', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      quietTown(ctx);
      const L = kidAtLamp(ctx), [x, z] = LAMP_KID;
      const M = ctx.props.moon11; ctx.add(M); M.position.copy(L(-58, 24, -2)); M.scale.setScalar(11);
      ctx.store = { L, M };
    },
    update(ctx, lt) {
      const { L, M } = ctx.store, [x, z] = LAMP_KID; countPose(ctx.cast.me, ctx.t);
      const cam = L(x + 6, 1.4, z + 3.2);
      M.lookAt(cam); M.userData.mood(ctx.t > ctx.markers.eyes + 0.1 ? 'tired' : 'happy');
      const k = ease.inOutCubic(clamp((ctx.t - ctx.time('b11') - 0.3) / 1.4, 0, 1));
      const look = L(x - 0.2, 1.3, z + 0.3).lerp(M.position.clone().add(up(-9)), k);
      ctx.cam.set({ pos: cam, look, fov: lerp(42, 40, k) }); fill(ctx, { pos: cam }, 0.6);
      top10Card(ctx, 4, ctx.time('b11') + 0.05, Infinity, { popAt: ctx.markers.top4 });
    },
  },
  // ── b12 "Nine hundred ninety nine thousand, nine hundred and ninety nine."  (silence; slow push)
  {
    name: 'nine nine nine', start: 'b12-0.1', set: 'town',
    setup(ctx) { quietTown(ctx, 0.5); ctx.store = { L: kidAtLamp(ctx) }; },
    update(ctx, lt) {
      const { L } = ctx.store; countPose(ctx.cast.me, ctx.t);
      const a = kidCam(L, 5.6, 1.5, 1, 40, 0.25), b = kidCam(L, 2.6, 1.6, 1, 36, 0.12); ctx.cam.move(a, b, clamp(lt / 4.2, 0, 1), ease.inOutSine); fill(ctx, b, 0.8);
      const t0 = ctx.time('b12'), t1 = ctx.markers.nines;
      const k = clamp((ctx.t - t0) / Math.max(0.1, t1 - t0), 0, 1);
      counter(ctx, ctx.t < t1 ? 999990 + Math.floor(9 * k) : 999999, { fill: '#ffe14a' });
    },
  },
  // ── b13 "One million. Ready or not."  — he turns around
  {
    name: 'ready or not', start: 'b13-0.1', set: 'town',
    setup(ctx) { quietTown(ctx, 0.5); ctx.store = { L: kidAtLamp(ctx) }; },
    update(ctx) {
      const { L } = ctx.store, me = ctx.cast.me, [x, z] = LAMP_KID, tr = ctx.markers.ready, tm = ctx.markers.million;
      const turn = ease.inOutCubic(clamp((ctx.t - tr) / 0.35, 0, 1));
      me.root.rotation.set(0, L.yaw + Math.PI * (1 - turn), 0);
      if (turn < 0.05) countPose(me, ctx.t); else { me.pose('idle', ctx.t, { intensity: 0.3 }); me.face('determined', ctx.t); }
      if (ctx.t < tr) setCam(ctx, kidCam(L, 2.6, 1.6, 1, 36, 0.12), 0.8);
      else setCam(ctx, { pos: L(x + 0.15, 1.62, z + 2.6), look: L(x, 1.55, z + 0.36), fov: 38 }, 1.4);
      counter(ctx, ctx.t > tm ? 1000000 : 999999, { fill: ctx.t > tm ? '#ff4fa3' : '#ffe14a', scale: ctx.t > tm && ctx.t < tm + 0.15 ? 1.2 : 1 });
      if (ctx.t > tr + 0.2) tag(ctx, 'READY OR NOT', tr + 0.2, Infinity, { y: 0.3, size: 84, bg: 'rgba(200,0,40,0.92)' });
    },
  },
  // ── b14 HUSS ×6 — FOUND: box, Grandad, pigeon, Brenda, Marcus, the mayor
  ...HIDERS.map((who, i) => ({
    name: `found ${who}`, start: i === 0 ? 'b14.h0-0.12' : `b14.h${i}-0.03`, set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'street.crowdB');
      const crowd = crowdGrid(ctx, EXTRA_IDS.slice(i, i + 8), 'street.crowdB', { cols: 4, dx: 1.5, dz: 1.3, seed: 20 + i, hats: true, offset: [0, 0, -1.6] });
      const P = ctx.props, hp = F(0.35, 0, 2.2);
      if (who === 'box') { ctx.add(P.catBox); P.catBox.position.copy(hp); P.catBox.rotation.set(0, F.yaw - 0.3, 0); P.catBox.userData.baseY = hp.y; }
      else if (who === 'pigeon') { ctx.add(P.lectern); P.lectern.position.copy(hp); P.lectern.rotation.set(0, F.yaw, 0); ctx.place('pigeon', hp.clone().add(up(0.95))); ctx.cast.pigeon.root.rotation.set(0, F.yaw - 0.4, 0); ctx.add(P.pigeonHat, ctx.cast.pigeon.joints.head); P.pigeonHat.position.set(0, 0.135, -0.005); P.pigeonHat.rotation.set(-0.1, 0, 0.12); }
      else { ctx.place(who, hp); ctx.cast[who].root.rotation.set(0, F.yaw - 0.5, 0); }
      ctx.place('me', F(-0.75, 0, 2.55)); ctx.cast.me.root.rotation.set(0, F.yaw + Math.PI / 2 - 0.25, 0);
      ctx.store = { F, crowd, hp };
    },
    update(ctx) {
      const { F, crowd, hp } = ctx.store, hits = ctx.hussTimes('b14').map((h) => h + 0.03), hit = hits[i];
      animateCrowd(crowd, ctx.t);
      const me = ctx.cast.me; me.pose('point', ctx.t, {}); me.face(ctx.t > hit ? 'grin' : 'determined', ctx.t);
      const dh = ctx.t - hit;
      if (who === 'box') { ctx.props.catBox.userData.set(ctx.t, { dance: dh < 0 ? 1 : 0, peek: 1, wag: dh > 0 ? 3 : 1 }); }
      else { const c = ctx.cast[who]; if (who === 'pigeon') { c.pose(dh > 0 ? 'flap' : 'idle', ctx.t); c.face(dh > 0 ? 'shocked' : 'smug', ctx.t); } else { c.pose(dh > 0 ? 'surprised' : 'dance', ctx.t); c.face(dh > 0 ? 'shocked' : 'grin', ctx.t); } }
      const low = who === 'box' ? 0.75 : who === 'pigeon' ? 1.15 : 1.25;
      ctx.cam.set({ pos: F(0.15 + (i % 2 ? 0.5 : -0.3), low + 0.2, 5.3), look: F(-0.05, low, 2.3), fov: 40 });
      ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
      if (dh > 0) stamp(ctx, 'FOUND!', hit, { size: 150, rot: i % 2 ? 0.12 : -0.12 });
      ctx.fx.text(`FOUND ${i + (dh > 0 ? 1 : 0)}/6`, { x: 0.5, y: 0.12, size: 64, fill: '#ffffff', stroke: '#000000', line: 8, bg: 'rgba(200,0,40,0.9)' });
    },
  })),
  // ── b15 "Found everyone. Four seconds."  /  b16 "Sixteen thousand nights of counting. Four seconds of finding."  /  b17 quote "Rules are rules." — a box
  {
    name: 'line-up', start: 'b15-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'street.crowdB'), P = ctx.props;
      const SPOT = { box: [-1.0, 2.1], pigeon: [-0.15, 2.0], grandad: [-1.15, 1.0], brenda: [-0.38, 1.0], marcus: [0.4, 1.0], mayor: [1.18, 1.0] };
      HIDERS.forEach((who, k) => {
        const p = F(SPOT[who][0], 0, SPOT[who][1]);
        if (who === 'box') { ctx.add(P.catBox); P.catBox.position.copy(p); P.catBox.rotation.set(0, F.yaw, 0); P.catBox.userData.baseY = p.y; }
        else if (who === 'pigeon') { ctx.add(P.lectern); P.lectern.position.copy(p); P.lectern.rotation.set(0, F.yaw, 0); ctx.place('pigeon', p.clone().add(up(0.95))); ctx.cast.pigeon.root.rotation.set(0, F.yaw, 0); ctx.add(P.pigeonHat, ctx.cast.pigeon.joints.head); P.pigeonHat.position.set(0, 0.135, -0.005); P.pigeonHat.rotation.set(-0.1, 0, 0.12); }
        else { ctx.place(who, p); ctx.cast[who].root.rotation.set(0, F.yaw, 0); }
      });
      ctx.place('me', F(1.05, 0, 3.0)); ctx.cast.me.root.rotation.set(0, F.yaw - 0.55, 0);
      ctx.store = { F };
    },
    update(ctx, lt) {
      const { F } = ctx.store, P = ctx.props;
      HIDERS.forEach((who, k) => { if (who === 'box') P.catBox.userData.set(ctx.t, { peek: 0.8, wag: 0.4, nod: ctx.t > (ctx.markers.abox ?? 1e9) ? 1 : 0 }); else if (who === 'pigeon') { ctx.cast.pigeon.pose('idle', ctx.t); ctx.cast.pigeon.face('sad', ctx.t); } else { const c = ctx.cast[who]; c.pose('idle', ctx.t + k, { intensity: 0.3 }); c.face('sad', ctx.t + k); } });
      const me = ctx.cast.me; me.pose('crossArms', ctx.t); me.face('smug', ctx.t);
      ctx.cam.move({ pos: F(0.1, 2.4, 10.2), look: F(0.05, 0.9, 1.8), fov: 44 }, { pos: F(0.1, 2.2, 9.2), look: F(0.05, 0.9, 1.8), fov: 44 }, clamp(lt / 6, 0, 1));
      const t15 = ctx.markers.four, t16 = ctx.time('b16'), tf = ctx.markers.finding;
      if (ctx.t < t16 - 0.1) tag(ctx, '0:04', t15, Infinity, { y: 0.16, size: 120, fill: '#3cff6b', bg: 'rgba(8,10,14,0.9)' });
      else if (ctx.t < ctx.time('b17') - 0.1) { tag(ctx, '16,263 NIGHTS COUNTING', t16, tf - 0.05, { y: 0.16, size: 58 }); tag(ctx, '4 SECONDS FINDING', tf, Infinity, { y: 0.16, size: 64, bg: 'rgba(200,0,40,0.92)' }); }
      quoteCard(ctx, 'Rules are rules.', 'a box', ctx.markers.quote2, ctx.time('b17.end') + 0.15, { y: 0.32, byAt: ctx.markers.abox - 0.05 });
    },
  },
  // ── b18 "So now in this town, everybody counts."
  {
    name: 'everybody counts', start: 'b18-0.1', set: 'town',
    setup(ctx) { ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('windowGlow', 1); const L = T(ctx); ctx.store = { L, ids: counters(ctx, L) }; },
    update(ctx, lt, u) {
      const { L, ids } = ctx.store; animCounters(ctx, ids);
      ctx.cam.move({ pos: L(-3.0, 2.0, -3.6), look: L(-22, 0.9, -5.0), fov: 40 }, { pos: L(-4.2, 1.9, -3.7), look: L(-22, 0.9, -5.0), fov: 40 }, u, ease.inOutSine);
      tag(ctx, 'EVERYBODY COUNTS', ctx.markers.counts, Infinity, { y: 0.18 });
    },
  },
  // ── b19 "Except me. I'm partying."  /  b20 HUSS ×6 — dancing alone; fireworks; the town keeps counting behind him
  {
    name: 'partying alone', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx); const L = T(ctx); const ids = counters(ctx, L);
      ctx.place('me', L(1.2, 0, -1.0)); ctx.cast.me.root.rotation.set(0, L.yaw, 0); ctx.cast.me.setAccessory('partyHat', true);
      ctx.store = { L, ids };
    },
    update(ctx, lt) {
      const { L, ids } = ctx.store; animCounters(ctx, ids);
      const me = ctx.cast.me, tp = ctx.markers.partying;
      if (ctx.t < tp) { me.pose('idle', ctx.t); me.face('smile', ctx.t); } else { me.pose('dance', ctx.t); me.face('grin', ctx.t); }
      ctx.cam.move({ pos: L(1.0, 1.5, 3.6), look: L(2.2, 1.3, -1.8), fov: 48 }, { pos: L(0.9, 1.7, 4.6), look: L(2.3, 1.4, -2.2), fov: 50 }, clamp(lt / 2, 0, 1));
    },
  },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `dance alone #${i + 1}`, start: i === 0 ? 'b20.h0-0.12' : `b20.h${i}-0.03`, set: 'town',
    setup(ctx) {
      partyTown(ctx); const L = T(ctx); const ids = counters(ctx, L);
      ctx.place('me', L(1.2, 0, -1.0)); ctx.cast.me.root.rotation.set(0, L.yaw, 0); ctx.cast.me.setAccessory('partyHat', true);
      ctx.store = { L, ids };
    },
    update(ctx) {
      const { L, ids } = ctx.store, hits = ctx.hussTimes('b20').map((h) => h + 0.03); animCounters(ctx, ids);
      const me = ctx.cast.me, h = lastBefore(hits, ctx.t);
      me.pose(i % 2 ? 'dance2' : 'dance', ctx.t); me.face(h != null && ctx.t - h < 0.2 ? 'huss' : 'grin', ctx.t);
      const cams = [{ pos: L(0.9, 1.7, 4.6), look: L(2.3, 1.4, -2.2), fov: 50 }, { pos: L(7.5, 4.2, 5), look: L(1, 1.0, -2.5), fov: 48 }, { pos: L(1.3, 1.6, 1.6), look: humanFace(me), fov: 40 }];
      ctx.cam.set(cams[i % 3]); ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
      if (i === 5) iris(ctx, ctx.time('b20.end') + 0.35, 0.42);
    },
  })),
];
