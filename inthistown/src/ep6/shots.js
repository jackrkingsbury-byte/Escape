// In This Town — Episode 6: "Gravity".  The cat narrates; it pushes things off tables.
// Film contract: SPEC.md §8.  Timeline: episodes/ep6/timeline.json (audio/build_episode.py ep6).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, ease, hash, lerp, canvasTexture } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { init as initEp1, V, headPos, frame, frameAt, lastBefore, partyTown } from '../shots.js';
import { makeDJDecks } from '../ep2/props2.js';
import { makeTrophy } from '../ep3/props3.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
export const cast = {
  cat: { ...MAIN.cat, scale: 1.2 }, pigeon: MAIN.pigeon, mayor: MAIN.mayor,
  grandad: { ...MAIN.grandad, accessories: ['sunglasses', 'mustache', 'headphones'] },
  grandad2: { ...MAIN.grandad, id: 'grandad2' },
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 6, banner: ['SUMMER PARTY', 'FANCY', 'DINNER'] }),
  room: () => buildRoom({ variant: 'hero', poster: 'knight', window: 'party' }),
};

const GRAV = -9.8;
export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.tower = makeTower();
  P.desk6 = [makeMug(), box(0.16, 0.012, 0.012, '#ffd23f'), box(0.15, 0.04, 0.2, '#c0392b'), apple(), box(0.05, 0.02, 0.17, '#1d1d22'), makeTrophy()];
  P.desk6[5].scale.setScalar(0.35);
  P.ppl = [box(0.14, 0.014, 0.014, '#1d3a8a'), box(0.075, 0.012, 0.15, '#111114'), makeLasagna()];
  P.nudgeGlass = makeGlass(); P.nudgeGlass.scale.setScalar(1.3);
  P.tattoo = makeTattoo(); P.tattoo2 = makeTattoo();
  P.medal = makeMedal();
  P.decks6 = makeDJDecks();
  P.plates = Array.from({ length: 8 }, () => cyl(0.13, 0.015, '#ffffff'));
  P.shards = makeShards();
}
function box(w, h, d, c) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })); m.castShadow = true; const g = new THREE.Group(); m.position.y = h / 2; g.add(m); g.userData.h = h; return g; }
function cyl(r, h, c) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })); m.position.y = h / 2; const g = new THREE.Group(); g.add(m); return g; }
function makeMug() { const g = cyl(0.045, 0.1, '#3ee0c8'); const h = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 16), new THREE.MeshStandardMaterial({ color: '#3ee0c8' })); h.position.set(0.05, 0.05, 0); g.add(h); return g; }
function apple() { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.07, 0.075), new THREE.MeshStandardMaterial({ color: '#e8232b', roughness: 0.4 })); m.position.y = 0.035; g.add(m); const s = box(0.008, 0.025, 0.008, '#5a3b24'); s.position.y = 0.07; g.add(s); return g; }
function makeLasagna() {
  const g = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.22), new THREE.MeshStandardMaterial({ color: '#d9d9e0', roughness: 0.3, metalness: 0.5 })); tray.position.y = 0.025; g.add(tray);
  ['#f2c26b', '#c0392b', '#f7e6b5', '#c0392b', '#e8a33d'].forEach((c, i) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.012, 0.2), new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })); l.position.y = 0.035 + i * 0.012; g.add(l); });
  return g;
}
function glassGeo() {
  const bowl = new THREE.CylinderGeometry(0.048, 0.016, 0.035, 14, 1, true).translate(0, 0.082, 0);
  const fill = new THREE.CylinderGeometry(0.044, 0.018, 0.022, 14).translate(0, 0.076, 0);
  const stem = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 6).translate(0, 0.035, 0);
  const foot = new THREE.CylinderGeometry(0.028, 0.03, 0.006, 14).translate(0, 0.003, 0);
  return { glass: mergeGeometries([bowl, stem, foot]), fill };
}
const GMAT = new THREE.MeshStandardMaterial({ color: '#e9f6ff', transparent: true, opacity: 0.6, roughness: 0.08, emissive: '#6a8ca8', emissiveIntensity: 0.25, side: THREE.DoubleSide });
const FMAT = new THREE.MeshStandardMaterial({ color: '#f7d774', emissive: '#7a5a10', emissiveIntensity: 0.35, roughness: 0.3 });
function makeGlass() { const { glass, fill } = glassGeo(); const g = new THREE.Group(); g.add(new THREE.Mesh(glass, GMAT)); g.add(new THREE.Mesh(fill, FMAT)); return g; }
// 6-tier square pyramid of coupes (36+25+16+9+4+1 = 91).  set(t, hits): tier k (top = 0) breaks at hits[k].
function makeTower() {
  const { glass, fill } = glassGeo();
  const list = [];
  const TIERS = 6, SP = 0.102, TH = 0.094;
  for (let k = 0; k < TIERS; k++) {             // k = 0 is the top
    const n = k + 1, y = (TIERS - 1 - k) * TH;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = (i - (n - 1) / 2) * SP, z = (j - (n - 1) / 2) * SP, s = list.length;
      const r = Math.hypot(x, z) || 0.02, a = Math.atan2(z, x) + (hash(s * 1.3) - 0.5) * 0.9;
      list.push({ k, p: V(x, y, z), v: V(Math.cos(a) * (0.9 + 1.4 * hash(s)), 0.6 + 1.6 * hash(s * 2.1), Math.sin(a) * (0.9 + 1.4 * hash(s * 3.7))), spin: V(hash(s * 5) * 14 - 7, hash(s * 7) * 10 - 5, hash(s * 9) * 14 - 7) });
    }
  }
  const root = new THREE.Group();
  const ig = new THREE.InstancedMesh(glass, GMAT, list.length), ifl = new THREE.InstancedMesh(fill, FMAT, list.length);
  ig.castShadow = true; root.add(ig); root.add(ifl);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = V(1, 1, 1), p = V();
  function set(t, hits = [], { floor = -0.78, half = [0.85, 0.42] } = {}) {
    list.forEach((g, s) => {
      const h = hits[g.k];
      let dt = h != null && t > h ? t - h : 0;
      p.copy(g.p);
      if (dt > 0) {
        p.addScaledVector(g.v, dt); p.y += 0.5 * GRAV * dt * dt;
        const onTable = Math.abs(p.x) < half[0] && Math.abs(p.z) < half[1];
        const fl = onTable ? 0 : floor;
        if (p.y < fl) { p.y = fl; dt = Math.min(dt, 0.35); }
        e.set(g.spin.x * dt, g.spin.y * dt, g.spin.z * dt);
      } else e.set(0, 0, 0);
      q.setFromEuler(e); m4.compose(p, q, one);
      ig.setMatrixAt(s, m4); ifl.setMatrixAt(s, m4);
    });
    ig.instanceMatrix.needsUpdate = true; ifl.instanceMatrix.needsUpdate = true;
  }
  set(0);
  root.userData = { set, topY: (TIERS - 1) * TH + 0.1 };
  return root;
}
function makeTattoo() {
  const tex = canvasTexture(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#e8232b'; g.beginPath(); g.moveTo(128, 220); g.bezierCurveTo(10, 140, 30, 30, 128, 80); g.bezierCurveTo(226, 30, 246, 140, 128, 220); g.fill();
    g.lineWidth = 10; g.strokeStyle = '#1d1d22'; g.stroke();
    g.fillStyle = '#1d3a8a'; g.fillRect(20, 108, 216, 64); g.strokeRect(20, 108, 216, 64);
    g.fillStyle = '#ffffff'; g.font = '900 60px "Nunito", "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COO', 128, 142);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -3 }));
}
function makeMedal() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 24), new THREE.MeshStandardMaterial({ color: '#ffd23f', metalness: 0.6, roughness: 0.25, emissive: '#6a4a00', emissiveIntensity: 0.4 }));
  disc.rotation.x = Math.PI / 2; g.add(disc);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.006), new THREE.MeshStandardMaterial({ color: s < 0 ? '#c0392b' : '#1d3a8a' })); r.position.set(s * 0.025, 0.09, -0.004); r.rotation.z = s * 0.25; g.add(r); }
  return g;
}
function makeShards() {
  const g = new THREE.Group();
  for (let i = 0; i < 60; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03 + 0.03 * hash(i), 0.004, 0.02 + 0.03 * hash(i * 2)), GMAT); const a = hash(i * 3.3) * Math.PI * 2, r = 0.3 + 2.4 * hash(i * 1.7); s.position.set(Math.cos(a) * r, 0.003, Math.sin(a) * r); s.rotation.y = a; g.add(s); }
  return g;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
const period = (ch) => (ch.kind === 'cat' ? 3.4 : ch.kind === 'pigeon' ? 2.7 : 3.1);
const OPEN = (ch) => 10 * period(ch) + period(ch) / 2 - (ch.blinkPhase || 0);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0;
  if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.24, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.8)', rot: -0.03, ...o, scale: Math.max(0.01, pop) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.3, size: 170, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.15, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
}
function catFace(cat) { cat.root.updateMatrixWorld(true); return cat.joints.head.localToWorld(V(0, 0.035, 0.123)); }
function pigeonFace(p) { p.root.updateMatrixWorld(true); return p.joints.head.localToWorld(V(0, 0.06, 0.07)); }
const facing = (obj) => V(Math.sin(obj.rotation.y), 0, Math.cos(obj.rotation.y));
/** The paw swipe: armR (front right leg) lifts and sweeps.  k 0..1 over a swipe. */
function swipe(cat, k) {
  if (k <= 0 || k >= 1) return;
  const a = Math.sin(Math.PI * k);
  cat.joints.armR.rotation.x += -1.3 * a; cat.joints.armR.rotation.z += -0.6 * a * (k < 0.5 ? 1 : -0.5);
  cat.joints.head.rotation.y += 0.3 * a;
}
/** Ballistic object knocked off at time h with velocity v from p0; stops on floorY. */
function fly(obj, p0, v, t, h, floorY, spin = 6) {
  const dt = h != null && t > h ? t - h : 0;
  obj.position.copy(p0);
  if (dt > 0) {
    obj.position.addScaledVector(v, dt); obj.position.y += 0.5 * GRAV * dt * dt;
    let d2 = dt;
    if (obj.position.y < floorY) { obj.position.y = floorY; d2 = Math.min(dt, 0.45); }
    obj.rotation.set(spin * d2, 0.5 * spin * d2, -0.8 * spin * d2);
  } else obj.rotation.set(0, 0, 0);
}

/** The cat on the table in the middle of the room, facing the open side; objects along the front edge.
 *  Dk: +z towards the camera side, origin on the table top. */
function deskScene(ctx, objs = []) {
  const set = ctx.set; set.setLighting?.('night'); set.set?.('window', 'party');
  set.root.updateMatrixWorld(true);
  const center = set.root.getWorldPosition(V()), camP = ctx.point('room.cam');
  const d = V(camP.x - center.x, 0, camP.z - center.z).normalize();
  const yaw = Math.atan2(d.x, d.z);
  const F = frame(V().copy(center).addScaledVector(d, -0.35), yaw);
  const P = ctx.props;
  ctx.add(P.table); P.table.position.copy(F(0, 0, 0.62)); P.table.rotation.set(0, yaw, 0);
  const Dk = frame(F(0, TT, 0.62), yaw);
  const cat = ctx.cast.cat;
  ctx.place('cat', Dk(0.22, 0, -0.12)); cat.root.rotation.set(0, yaw, 0);
  const out = Dk.fwd.clone();
  const items = objs.map((o, i) => {
    ctx.add(o); const p0 = Dk(0.02 - 0.13 * i, 0, 0.26 + 0.04 * (i % 2)); o.position.copy(p0); o.rotation.set(0, 0, 0);
    return { o, p0, v: out.clone().multiplyScalar(1.3 + 0.3 * hash(i)).addScaledVector(Dk.left, (hash(i * 2) - 0.5) * 0.8).add(up(0.8)) };
  });
  return { Dk, out, items, floorY: center.y };
}
const TT = 0.78;
const deskCams = (Dk) => ({
  wide: { pos: Dk(-0.2, 0.55, 2.3), look: Dk(-0.1, 0.15, 0.05), fov: 40 },
  cat: { pos: Dk(0.4, 0.35, 1.45), look: Dk(0.18, 0.3, -0.1), fov: 36 },
  low: { pos: Dk(-0.75, -0.35, 1.9), look: Dk(-0.25, -0.2, 0.4), fov: 44 },
});

// ── The fancy dinner on the stage: the tower in the middle of the long table.  S: stage frame (+z = audience).
function dinnerStage(ctx, { night = false, crowd = true, floorPicnic = false } = {}) {
  ctx.set.setLighting?.(night ? 'party_night' : 'dusk');
  ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('standsCrowd', true); ctx.set.set?.('crowdMotion', 0.5);
  const S = frameAt(ctx, 'square.stage'), tbl = ctx.anchor('square.table');
  const tp = rel(tbl), T = frame(tp, yawOf(tbl));         // table top centre; long axis = T x? (world X)
  const st = { S, T, tp, stands: [], guests: [] };
  const P = ctx.props;
  if (!floorPicnic) { ctx.add(P.tower); P.tower.position.copy(tp); P.tower.rotation.set(0, 0, 0); P.tower.userData.set(0); }
  if (crowd) {
    const fill = (rows, ids, k0) => {
      if (!Array.isArray(rows)) return; let k = 0;
      rows.forEach((row) => { const w = row.userData?.width || 7.2, per = 7; for (let j = 0; j < per && k < ids.length; j++, k++) {
        const id = ids[k]; ctx.place(id, row, { offset: [(j - (per - 1) / 2) * (w / per) + (hash(k + k0) - 0.5) * 0.2, 0, 0] });
        ctx.cast[id].setAccessory?.('bowtie', true); st.stands.push({ ch: ctx.cast[id], phase: hash(k * 3.1 + k0) * 3, k: k + k0 }); } });
    };
    fill(ctx.anchor('square.standA.rows'), EXTRA_IDS.slice(0, 11), 0);
  }
  // guests standing round the table (dressed up), the mayor, DJ Grandad
  const G = [['x11', -1.6, 1.4], ['x12', 1.7, 1.3], ['x13', -2.4, 0.4], ['x14', 2.5, 0.5], ['x15', -1.5, -1.2], ['x16', 1.6, -1.3]];
  G.forEach(([id, x, z], k) => { ctx.place(id, S(x, 0, z + 0.8)); const c = ctx.cast[id]; c.setAccessory?.('bowtie', true); st.guests.push({ ch: c, phase: hash(k) * 2, k, x, z }); });
  ctx.place('mayor', S(1.45, 0, 1.75)); { const m = ctx.cast.mayor.root.position; ctx.cast.mayor.root.rotation.set(0, Math.atan2(tp.x - m.x, tp.z - m.z), 0); }
  ctx.add(P.decks6.root); P.decks6.root.position.copy(S(-3.6, 0, -1.4)); P.decks6.root.rotation.set(0, S.yaw + 0.5, 0);
  ctx.place('grandad', S(-3.85, 0, -1.85)); ctx.cast.grandad.root.rotation.set(0, S.yaw + 0.5, 0);
  if (floorPicnic) {
    st.guests.forEach((g, k) => { g.ch.root.position.copy(S(g.x * 0.9, 0, g.z + 0.8)); const pl = P.plates[k]; ctx.add(pl); pl.position.copy(S(g.x * 0.9 * 0.82, 0, (g.z + 0.8) * 0.82)); });
    ctx.add(P.shards); P.shards.position.copy(S(0, 0, 0.8));
  }
  st.floorY = S.origin.y;
  return st;
}
function dinnerAnim(ctx, st, { mode = 'mixed', frozenAt = null, djFrozen = false } = {}) {
  const tc = frozenAt != null && ctx.t > frozenAt ? frozenAt : ctx.t;
  for (const c of st.stands) {
    const a = mode === 'stunned' ? 'stunned' : mode === 'clap' ? 'clap' : mode === 'peer' ? 'peer' : (c.k % 2 ? 'cheer' : 'clap');
    c.ch.pose(a, tc + c.phase, frozenAt != null && ctx.t > frozenAt ? { intensity: 0.1 } : {}); c.ch.face(mode === 'stunned' || mode === 'peer' ? 'shocked' : 'grin', ctx.t + c.phase);
  }
  for (const g of st.guests) {
    const look = st.tp.clone().add(up(0.3));
    g.ch.root.rotation.set(0, Math.atan2(look.x - g.ch.root.position.x, look.z - g.ch.root.position.z), 0);
    if (mode === 'picnic') { g.ch.pose('sit', ctx.t + g.phase, { seated: true, seatHeight: 0.14 }); g.ch.face('grin', ctx.t + g.phase); continue; }
    g.ch.pose(mode === 'stunned' ? 'stunned' : mode === 'clap' ? 'clap' : mode === 'peer' ? 'peer' : 'idle', tc + g.phase, { lookAt: look }); g.ch.face(mode === 'stunned' || mode === 'peer' ? 'shocked' : 'smile', ctx.t + g.phase);
  }
  if (mode === 'picnic') { const m = ctx.cast.mayor; m.pose('sit', ctx.t, { seated: true, seatHeight: 0.14 }); m.face('grin', ctx.t); }
  ctx.props.decks6.update(ctx.t);
  const gd = ctx.cast.grandad; gd.pose('dance2', djFrozen && frozenAt != null && ctx.t > frozenAt ? frozenAt : ctx.t, { speed: 1.1 }); gd.face(djFrozen && ctx.t > (frozenAt ?? 1e9) ? 'shocked' : 'grin', ctx.t);
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody parties."
  {
    name: 'party crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 6, hats: true });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh');
      const d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store = { crowd, from: { pos: hi, look: c.clone().add(up(0.5)), fov: 50 }, to: { pos: c.clone().addScaledVector(d, 9).add(up(3.2)), look: ctx.point('street.crowdA').add(up(1.3)), fov: 42 } };
    },
    update(ctx, lt, u) { animateCrowd(ctx.store.crowd, ctx.t); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic); },
  },
  // ── b02 "Except me. I'm the cat."
  {
    name: 'window push', start: 'b02-0.1', set: 'town',
    setup(ctx) { partyTown(ctx); ctx.store = { W: frameAt(ctx, 'myHouse.window') }; },
    update(ctx, lt, u) { const W = ctx.store.W; ctx.cam.move({ pos: W(0, -0.6, 4.5), look: W(0, 0, 0), fov: 40 }, { pos: W(0, -0.1, 1.6), look: W(0, 0, 0), fov: 36 }, ease.inQuad(u)); },
  },
  {
    name: "i'm the cat", start: 'imCat-0.1', set: 'room',
    setup(ctx) { ctx.store = deskScene(ctx, [ctx.props.desk6[0]]); },
    update(ctx, lt) {
      const cat = ctx.cast.cat, { Dk } = ctx.store; cat.pose('sit', ctx.t); cat.face('stare', OPEN(cat));
      const cf = catFace(cat);
      ctx.cam.move({ pos: cf.clone().addScaledVector(facing(cat.root), 1.4).add(up(0.1)), look: cf.clone().add(up(-0.1)), fov: 38 }, { pos: cf.clone().addScaledVector(facing(cat.root), 1.0).add(up(0.05)), look: cf.clone().add(up(-0.06)), fov: 36 }, clamp(lt / 0.8, 0, 1));
    },
  },
  // ── b03 HUSS ×6 — one swipe, one object per HUSS
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `swipe huss #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = deskScene(ctx, ctx.props.desk6); },
    update(ctx) {
      const cat = ctx.cast.cat, st = ctx.store, hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      cat.pose('sit', ctx.t); cat.face(i % 2 ? 'smug' : 'stare', OPEN(cat));
      const h = lastBefore(hits, ctx.t + 0.12); if (h != null) swipe(cat, (ctx.t - (h - 0.12)) / 0.3);
      st.items.forEach((it, k) => fly(it.o, it.p0, it.v, ctx.t, hits[k], st.floorY));
      const C = deskCams(st.Dk);
      ctx.cam.set([C.cat, C.wide, C.low, C.cat, C.wide, C.low][i]);
      ctx.cam.punch(hits, ctx.t, 0.08, 0.2);
    },
  })),
  // ── b04 "The pigeon got a tattoo. It just says Coo."
  {
    name: 'pigeon tattoo', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const tp = ctx.point('park.table'), pc = ctx.point('park.cam');
      const F = frame(tp, Math.atan2(pc.x - tp.x, pc.z - tp.z));
      ctx.place('pigeon', F(0, 0, 0)); ctx.cast.pigeon.root.rotation.set(0, F.yaw, 0);
      const t = ctx.props.tattoo; ctx.add(t, ctx.cast.pigeon.joints.belly); t.position.set(0, 0.0, 0.142); t.rotation.set(0, 0, 0); t.scale.setScalar(0.9);
      ctx.store = { F };
    },
    update(ctx) {
      const p = ctx.cast.pigeon, { F } = ctx.store, tt = ctx.markers.tattoo;
      p.pose('idle', ctx.t, { intensity: 0.2 }); p.face('smug', ctx.t);
      if (ctx.t > ctx.time('b04') + 0.4) { p.pose('huss', 1.0); p.face('smug', ctx.t); }
      ctx.cam.set(ctx.t < tt - 0.2 ? { pos: F(0.2, 0.32, 1.3), look: F(0, 0.24, 0), fov: 38 } : { pos: F(0.05, 0.2, 0.7), look: F(0, 0.18, 0), fov: 34 });
    },
  },
  // ── b05 "While they're out partying, by the way, I push things off tables."
  {
    name: 'the nudge', start: 'b05-0.1', set: 'room',
    setup(ctx) { const st = ctx.store = deskScene(ctx, [ctx.props.nudgeGlass]); },
    update(ctx, lt) {
      const cat = ctx.cast.cat, st = ctx.store, g = ctx.props.nudgeGlass, it = st.items[0];
      cat.pose('sit', ctx.t); cat.face('stare', OPEN(cat));
      const t0 = ctx.time('b05'), t1 = ctx.time('b05.end') - 0.15;
      const k = clamp((ctx.t - t0) / (t1 - t0), 0, 1);
      const p0 = it.p0.clone().addScaledVector(st.out, -0.06 + 0.2 * k);
      cat.joints.armR.rotation.x += -0.9; cat.joints.head.rotation.y += 0.15 * Math.sin(ctx.t * 0.7);
      fly(g, p0, st.out.clone().multiplyScalar(0.5).add(up(0.1)), ctx.t, t1, st.floorY, 3);
      const C = deskCams(st.Dk);
      ctx.cam.set(ctx.t < t1 - 0.2 ? C.cat : C.low);
    },
  },
  // ── b06 "A pen. A phone. A whole lasagna."
  {
    name: 'pen phone lasagna', start: 'b06-0.1', set: 'room',
    setup(ctx) { ctx.store = deskScene(ctx, ctx.props.ppl); },
    update(ctx) {
      const cat = ctx.cast.cat, st = ctx.store, M = ctx.markers;
      const hits = [M.pen, M.phone, M.lasagna];
      cat.pose('sit', ctx.t); cat.face(ctx.t > M.lasagna ? 'smug' : 'stare', OPEN(cat));
      const h = lastBefore(hits, ctx.t + 0.12); if (h != null) swipe(cat, (ctx.t - (h - 0.12)) / 0.3);
      st.items.forEach((it, k) => fly(it.o, it.p0, it.v, ctx.t, hits[k], st.floorY, k === 2 ? 4 : 7));
      const C = deskCams(st.Dk);
      ctx.cam.set(ctx.t < M.lasagna - 0.1 ? C.wide : C.low);
      if (ctx.t > M.lasagna + 0.35) tag(ctx, 'UPSIDE DOWN', M.lasagna + 0.35, Infinity, { y: 0.2, size: 54, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b07 quote: "Gravity is just the floor asking nicely." — a physicist, crying
  {
    name: 'gravity card', start: 'b07-0.1', set: 'room',
    setup(ctx) { ctx.store = deskScene(ctx, []); },
    update(ctx) {
      const cat = ctx.cast.cat; cat.pose('loaf', ctx.t); cat.face('smug', OPEN(cat));
      ctx.cam.set(deskCams(ctx.store.Dk).cat);
      quoteCard(ctx, 'Gravity is just the floor asking nicely.', 'a physicist, crying', ctx.markers.quote1, ctx.markers.quote1end, { y: 0.32, byAt: ctx.markers.phys });
    },
  },
  // ── b08 "Then came the Summer Party Fancy Dinner."
  {
    name: 'fancy dinner', start: 'b08-0.1', set: 'town',
    setup(ctx) {
      ctx.store = dinnerStage(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 22).add(up(10)), look: c.clone().add(up(2)), fov: 44 };
      ctx.store.to = { pos: ctx.store.S(0.4, 2.6, 8.5), look: ctx.store.S(0, 1.2, 0.8), fov: 44 };
    },
    update(ctx, lt, u) { const st = ctx.store; dinnerAnim(ctx, st); ctx.cast.mayor.pose('wave', ctx.t); ctx.cast.mayor.face('grin', ctx.t); ctx.cam.move(st.from, st.to, u, ease.inOutCubic); },
  },
  // ── b09 "Five hundred glasses. One table edge."  /  b10 HUSS ×3 — the cat closes in
  {
    name: 'the tower', start: 'b09-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.75); },
    update(ctx, lt) {
      const st = ctx.store, cat = ctx.cast.cat, te = ctx.markers.edge;
      dinnerAnim(ctx, st); ctx.cast.mayor.pose('idle', ctx.t); ctx.cast.mayor.face('smile', ctx.t);
      cat.visible = true; cat.root.visible = ctx.t > te - 0.4;
      const k = clamp((ctx.t - (te - 0.4)) / 0.45, 0, 1);
      cat.pose('hop', 0, { u: k }); cat.face('stare', OPEN(cat));
      const tp = st.tp;
      if (ctx.t < te - 0.45) ctx.cam.move({ pos: tp.clone().addScaledVector(st.S.fwd, 1.6).add(up(-0.3)), look: tp.clone().add(up(0.15)), fov: 40 }, { pos: tp.clone().addScaledVector(st.S.fwd, 1.6).add(up(0.25)), look: tp.clone().add(up(0.5)), fov: 40 }, clamp(lt / 1.6, 0, 1));
      else ctx.cam.set({ pos: tp.clone().addScaledVector(st.S.fwd, 2.0).addScaledVector(st.S.left, -0.4).add(up(0.45)), look: tp.clone().add(V(-0.35, 0.25, 0)), fov: 42 });
    },
  },
  ...[0, 1, 2].map((i) => ({
    name: `closing in #${i + 1}`, start: i === 0 ? 'b10.h0-0.12' : `b10.h${i}-0.03`, set: 'town',
    setup(ctx) { const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.75); },
    update(ctx) {
      const st = ctx.store, cat = ctx.cast.cat, hits = ctx.hussTimes('b10').map((h) => h + 0.03);
      dinnerAnim(ctx, st, { mode: 'peer' }); ctx.cast.mayor.pose('peer', ctx.t); ctx.cast.mayor.face('shocked', ctx.t);
      const n = hits.filter((h) => h <= ctx.t).length, h = lastBefore(hits, ctx.t);
      const u = h != null ? clamp((ctx.t - h) / 0.3, 0, 1) : 1;
      placeCatOnTable(ctx, st, 0.75 - 0.13 * Math.max(0, n - 1 + u));
      cat.pose(h != null && u < 1 ? 'hop' : 'idle', 0, { u, height: 0.12 }); cat.face('stare', OPEN(cat));
      const cf = catFace(cat);
      ctx.cam.set([{ pos: cf.clone().addScaledVector(st.S.fwd, 1.0).add(up(0.05)), look: cf.clone().add(V(0.15, -0.05, 0)), fov: 38 },
        { pos: (() => { const F = frameAt(ctx, 'square.standA'); return F(0, 2.4, 5.0); })(), look: frameAt(ctx, 'square.standA')(0, 2.0, 0), fov: 42 },
        { pos: st.tp.clone().addScaledVector(st.S.fwd, 1.5).add(up(0.25)), look: st.tp.clone().add(V(-0.25, 0.3, 0)), fov: 40 }][i]);
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b11 "Everybody froze. Even the DJ."
  {
    name: 'everybody froze', start: 'b11-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.32); ctx.set.set?.('crowdMotion', 0); },
    update(ctx) {
      const st = ctx.store, cat = ctx.cast.cat, tf = ctx.markers.froze - 0.1;
      dinnerAnim(ctx, st, { mode: 'stunned', frozenAt: tf, djFrozen: true }); ctx.cast.mayor.pose('stunned', 0); ctx.cast.mayor.face('shocked', ctx.t);
      cat.pose('idle', 0); cat.face('stare', OPEN(cat));
      if (ctx.t < ctx.markers.dj - 0.1) { const F = frameAt(ctx, 'square.standA'); ctx.cam.set({ pos: F(0.4, 2.6, 6.2), look: F(0, 2.0, 0), fov: 44 }); }
      else { const gp = headPos(ctx.cast.grandad, 0.25); ctx.cam.set({ pos: gp.clone().addScaledVector(facing(ctx.cast.grandad.root), 2.0).add(up(0.05)), look: gp.clone().add(up(-0.35)), fov: 40 }); }
    },
  },
  // ── b12 quote: "Every glass is a floor glass eventually." — my mum
  {
    name: 'floor glass card', start: 'b12-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.32); ctx.set.set?.('crowdMotion', 0); },
    update(ctx, lt, u) {
      const st = ctx.store, cat = ctx.cast.cat;
      dinnerAnim(ctx, st, { mode: 'stunned', frozenAt: ctx.markers.froze - 0.1, djFrozen: true }); cat.pose('idle', 0); cat.face('stare', OPEN(cat));
      ctx.cam.move({ pos: st.tp.clone().addScaledVector(st.S.fwd, 1.9).add(up(0.3)), look: st.tp.clone().add(V(-0.15, 0.3, 0)), fov: 40 }, { pos: st.tp.clone().addScaledVector(st.S.fwd, 1.4).add(up(0.25)), look: st.tp.clone().add(V(-0.15, 0.3, 0)), fov: 40 }, u);
      quoteCard(ctx, 'Every glass is a floor glass eventually.', 'my mum', ctx.markers.quote2, ctx.markers.quote2end, { y: 0.3, byAt: ctx.markers.mum });
    },
  },
  // ── b13 "So I sat next to it. And did nothing."
  {
    name: 'did nothing', start: 'b13-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.32); ctx.set.set?.('crowdMotion', 0); },
    update(ctx, lt) {
      const st = ctx.store, cat = ctx.cast.cat;
      dinnerAnim(ctx, st, { mode: 'stunned', frozenAt: ctx.markers.froze - 0.1, djFrozen: true });
      cat.pose(ctx.t > ctx.markers.sat ? 'sit' : 'idle', ctx.t); cat.face('stare', OPEN(cat));
      const cf = catFace(cat);
      ctx.cam.move({ pos: cf.clone().addScaledVector(st.S.fwd, 1.5).add(V(0.25, 0.1, 0)), look: cf.clone().add(V(0.2, -0.05, 0)), fov: 38 }, { pos: cf.clone().addScaledVector(st.S.fwd, 1.2).add(V(0.2, 0.08, 0)), look: cf.clone().add(V(0.18, -0.05, 0)), fov: 38 }, clamp(lt / 2.0, 0, 1));
    },
  },
  // ── b14 "Top ten respectful moments. Number seven: I let it live."
  {
    name: 'i let it live', start: 'b14-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.32); },
    update(ctx) {
      const st = ctx.store, cat = ctx.cast.cat, m = ctx.cast.mayor;
      dinnerAnim(ctx, st, { mode: 'clap' }); cat.pose('sit', ctx.t); cat.face('smug', OPEN(cat));
      m.pose('idle', 0, { headPitch: 0.6 * clamp((ctx.t - ctx.markers.top7) / 0.4, 0, 1) }); m.joints.torso.rotation.x += 0.45 * clamp((ctx.t - ctx.markers.top7) / 0.4, 0, 1); m.face('smile', ctx.t);
      ctx.cam.set({ pos: st.S(0.75, 1.75, 5.0), look: st.S(0.55, 1.15, 1.2), fov: 44 });
      top10Card(ctx, 7, ctx.time('b14') + 0.05, Infinity, { popAt: ctx.markers.top7 });
    },
  },
  // ── b15 "Then the pigeon landed on it."  /  b16 HUSS ×6 — the tower falls, tier by tier
  {
    name: 'pigeon lands', start: 'b15-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.32); ctx.set.set?.('crowdMotion', 0); },
    update(ctx) {
      const st = ctx.store, cat = ctx.cast.cat, p = ctx.cast.pigeon;
      dinnerAnim(ctx, st, { mode: 'peer' }); cat.pose('sit', ctx.t); cat.face('shocked', OPEN(cat));
      const tl = ctx.markers.land, k = clamp((ctx.t - (tl - 0.6)) / 0.8, 0, 1);
      const top = st.tp.clone().add(up(ctx.props.tower.userData.topY));
      ctx.place('pigeon', top.clone().add(V(0.6 * (1 - k), 1.4 * (1 - ease.outCubic(k)), 0)));
      p.root.rotation.set(0, st.S.yaw, 0); p.pose(k < 1 ? 'flap' : 'idle', ctx.t); p.face('smug', ctx.t);
      ctx.cam.set({ pos: top.clone().addScaledVector(st.S.fwd, 1.5).add(up(-0.15)), look: top.clone().add(up(0.15)), fov: 40 });
    },
  },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `tower falls #${i + 1}`, start: i === 0 ? 'b16.h0-0.12' : `b16.h${i}-0.03`, set: 'town',
    setup(ctx) { const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.32); },
    update(ctx) {
      const st = ctx.store, cat = ctx.cast.cat, p = ctx.cast.pigeon, hits = ctx.hussTimes('b16').map((h) => h + 0.03);
      dinnerAnim(ctx, st, { mode: 'stunned' }); cat.pose('sit', ctx.t); cat.face('shocked', OPEN(cat));
      ctx.props.tower.userData.set(ctx.t, hits, { floor: -0.78 });
      const top = st.tp.clone().add(up(ctx.props.tower.userData.topY));
      ctx.place('pigeon', top.clone().add(up(0.12 + 0.05 * Math.sin(ctx.t * 9)))); p.root.rotation.set(0, st.S.yaw, 0);
      p.pose('huss', ctx.t, { hits }); p.face('huss', ctx.t);
      const cams = [{ d: 1.4, y: 0.2, x: 0.3 }, { d: 2.2, y: 0.5, x: -0.6 }, { d: 1.6, y: -0.05, x: 0.5 }, { d: 2.8, y: 0.8, x: 0.0 }, { d: 1.9, y: 0.1, x: -0.8 }, { d: 3.6, y: 1.1, x: 0.6 }][i];
      ctx.cam.set({ pos: st.tp.clone().addScaledVector(st.S.fwd, cams.d).addScaledVector(st.S.left, cams.x).add(up(cams.y + 0.3)), look: st.tp.clone().add(up(0.25)), fov: 42 });
      ctx.cam.punch(hits, ctx.t, 0.12, 0.2); ctx.cam.shake(0.14, ctx.t, 60 + i);
    },
  })),
  // ── b17 "They banned the pigeon. I got a medal."
  {
    name: 'banned and medal', start: 'b17-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.32);
      const md = ctx.props.medal; ctx.add(md, ctx.cast.cat.joints.torso); md.position.set(0, -0.02, 0.12); md.rotation.set(0.3, 0, 0);
    },
    update(ctx) {
      const st = ctx.store, cat = ctx.cast.cat, p = ctx.cast.pigeon, tm = ctx.markers.medal;
      dinnerAnim(ctx, st, { mode: ctx.t > tm ? 'clap' : 'mixed' });
      ctx.props.tower.userData.set(99, [0, 0, 0, 0, 0, 0]);
      ctx.props.medal.visible = ctx.t > tm;
      cat.pose('sit', ctx.t); cat.face(ctx.t > tm ? 'smug' : 'stare', OPEN(cat));
      const top = st.tp.clone().add(up(0.9));
      if (ctx.t < tm - 0.1) {
        ctx.place('pigeon', top.clone().add(V(0.3, 0.1 * Math.sin(ctx.t * 5), 0))); p.root.rotation.set(0, st.S.yaw, 0); p.pose('flap', ctx.t); p.face('sad', ctx.t);
        ctx.cam.set({ pos: top.clone().addScaledVector(st.S.fwd, 1.6), look: top.clone().add(V(0.3, 0, 0)), fov: 40 });
        stamp(ctx, 'BANNED', ctx.time('b17.w2'));
      } else {
        const cf = catFace(cat);
        ctx.cam.set({ pos: cf.clone().addScaledVector(st.S.fwd, 1.1).add(V(0.15, 0.0, 0)), look: cf.clone().add(up(-0.15)), fov: 38 });
      }
    },
  },
  // ── b18 quote: "Never trust a bird with a tattoo." … — my grandad (who has one)
  {
    name: 'tattoo card', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = dinnerStage(ctx); placeCatOnTable(ctx, st, 0.32);
      const md = ctx.props.medal; ctx.add(md, ctx.cast.cat.joints.torso); md.position.set(0, -0.02, 0.12); md.rotation.set(0.3, 0, 0);
    },
    update(ctx) {
      const st = ctx.store, cat = ctx.cast.cat;
      dinnerAnim(ctx, st, { mode: 'clap' }); ctx.props.tower.userData.set(99, [0, 0, 0, 0, 0, 0]);
      cat.pose('sit', ctx.t); cat.face('smug', OPEN(cat));
      const cf = catFace(cat);
      ctx.cam.set({ pos: cf.clone().addScaledVector(st.S.fwd, 1.1).add(V(0.15, 0.0, 0)), look: cf.clone().add(up(-0.15)), fov: 38 });
      quoteCard(ctx, 'Never trust a bird with a tattoo.', null, ctx.markers.quote3, ctx.markers.quote3end + 0.05, { y: 0.3 });
    },
  },
  {
    name: 'grandad tattoo', start: 'quote3end+0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'street.crowdB');
      const g = ctx.cast.grandad2; ctx.place('grandad2', F(0, 0, 3)); g.root.rotation.set(0, F.yaw, 0);
      const t = ctx.props.tattoo2; ctx.add(t, g.joints.head); t.position.set(0, 0.47, 0.285); t.rotation.set(0, 0, 0); t.scale.setScalar(1.25);
      ctx.store = { F };
    },
    update(ctx, lt) {
      const g = ctx.cast.grandad2;
      g.pose('crossArms', ctx.t); g.face('smug', ctx.t);
      g.joints.head.rotation.x += 0.12 * Math.sin(ctx.t * 6);
      const hp = headPos(g, 0.3), f = facing(g.root);
      ctx.cam.set({ pos: hp.clone().addScaledVector(f, 2.2).add(up(0.0)), look: hp.clone().add(up(-0.15)), fov: 38 });
      tag(ctx, 'MY GRANDAD', ctx.time('b18.w7'), Infinity, { y: 0.2 });
    },
  },
  // ── b19 "Now in this town, everybody eats off the floor. Except me."  /  b20 "I'm still on the table."
  {
    name: 'floor picnic', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = dinnerStage(ctx, { floorPicnic: true }); placeCatOnTable(ctx, st, 0.0);
      const md = ctx.props.medal; ctx.add(md, ctx.cast.cat.joints.torso); md.position.set(0, -0.02, 0.12); md.rotation.set(0.3, 0, 0);
    },
    update(ctx, lt, u) {
      const st = ctx.store, cat = ctx.cast.cat;
      dinnerAnim(ctx, st, { mode: 'picnic' });
      cat.pose('loaf', ctx.t); cat.face('smug', OPEN(cat));
      if (ctx.t < ctx.markers.exceptMe - 0.1) ctx.cam.move({ pos: st.S(0.5, 3.6, 7.0), look: st.S(0, 0.4, 0.8), fov: 44 }, { pos: st.S(0.4, 3.0, 6.0), look: st.S(0, 0.5, 0.8), fov: 44 }, u);
      else { const cf = catFace(cat); ctx.cam.set({ pos: cf.clone().addScaledVector(st.S.fwd, 1.3).add(up(0.15)), look: cf.clone().add(up(-0.12)), fov: 38 }); }
    },
  },
  {
    name: 'still on the table', start: 'b20-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = dinnerStage(ctx, { floorPicnic: true }); placeCatOnTable(ctx, st, 0.0);
      const md = ctx.props.medal; ctx.add(md, ctx.cast.cat.joints.torso); md.position.set(0, -0.02, 0.12); md.rotation.set(0.3, 0, 0);
    },
    update(ctx) {
      const st = ctx.store, cat = ctx.cast.cat;
      dinnerAnim(ctx, st, { mode: 'picnic' });
      cat.pose('sit', ctx.t); cat.face('stare', OPEN(cat));
      const k = clamp((ctx.t - ctx.markers.table) / 0.5, 0, 1);
      cat.joints.armR.rotation.x += -1.1 * k;
      const cf = catFace(cat), f = facing(cat.root);
      ctx.cam.set({ pos: cf.clone().addScaledVector(f, 0.8).add(up(-0.02)), look: cf.clone().add(up(-0.06)), fov: 36 });
    },
  },
  // ── b21 HUSS ×3 — the cat pushes the camera off the table
  {
    name: 'camera off the table', start: 'b21.h0-0.12', set: 'town',
    setup(ctx) {
      const st = ctx.store = dinnerStage(ctx, { floorPicnic: true }); placeCatOnTable(ctx, st, 0.0);
      const md = ctx.props.medal; ctx.add(md, ctx.cast.cat.joints.torso); md.position.set(0, -0.02, 0.12); md.rotation.set(0.3, 0, 0);
    },
    update(ctx) {
      const st = ctx.store, cat = ctx.cast.cat, hits = ctx.hussTimes('b21').map((h) => h + 0.03);
      dinnerAnim(ctx, st, { mode: 'picnic' });
      cat.pose('sit', ctx.t); cat.face('smug', OPEN(cat));
      const h = lastBefore(hits, ctx.t + 0.1); if (h != null) swipe(cat, (ctx.t - (h - 0.1)) / 0.25);
      const cf = catFace(cat), f = facing(cat.root);
      const base = { pos: cf.clone().addScaledVector(f, 0.8).add(up(-0.02)), look: cf.clone().add(up(-0.06)), fov: 36 };
      const t3 = hits[2], d = ctx.t - t3;
      if (d < 0) { ctx.cam.set(base); ctx.cam.punch(hits, ctx.t, 0.12, 0.2); ctx.cam.shake(0.2, ctx.t, 70); }
      else {
        const fall = Math.min(0.78, 0.5 * 9.8 * d * d);
        const pos = base.pos.clone().addScaledVector(f, 0.35 * Math.min(1, d * 3)).add(up(-fall));
        const look = pos.clone().addScaledVector(f.clone().negate(), 1).add(up(-0.5 - 3 * d));
        ctx.cam.set({ pos, look, fov: 36, roll: Math.min(1.8, d * 5) });
        if (d > 0.4) ctx.fx.overlay('#000000', clamp((d - 0.4) / 0.15, 0, 1));
      }
    },
  },
];

/** The cat on the long table beside the tower, x metres along it (0.75 = the backdrop end, ~0.3 = next to the tower), facing the audience. */
function placeCatOnTable(ctx, st, x) {
  ctx.place('cat', st.tp.clone().add(V(x, 0, 0.3)));
  ctx.cast.cat.root.rotation.set(0, st.S.yaw, 0);
}
