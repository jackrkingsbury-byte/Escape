// In This Town — Episode 5: "Freeze Dance".  Brenda narrates; she has been asleep the whole time.
// Film contract: SPEC.md §8.  Timeline: episodes/ep5/timeline.json (audio/build_episode.py ep5).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, ease, hash, lerp, canvasTexture } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { makeSweatDrop } from '../props.js';
import { init as initEp1, V, headPos, frame, frameAt, lastBefore, partyTown } from '../shots.js';
import { makeDJDecks } from '../ep2/props2.js';
import { makeTrophy } from '../ep3/props3.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
export const cast = {
  brenda: MAIN.brenda, marcus: MAIN.marcus, mayor: MAIN.mayor, cat: MAIN.cat, pigeon: MAIN.pigeon,
  grandad: { ...MAIN.grandad, accessories: ['sunglasses', 'mustache', 'headphones'] },
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 5, banner: ['SUMMER PARTY', 'FREEZE DANCE', 'CHAMPIONSHIP'] }),
  room: () => buildRoom({ variant: 'brenda', window: 'party' }),
};

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.decks5 = makeDJDecks();
  P.lamp = makeLamppost();
  P.bibB = makeBib('47'); P.bibL = makeBib('LAMP', '#ffe14a');
  P.duster = makeDuster();
  P.shades = makeShades();
  P.moth = makeMoth(); P.moth.scale.setScalar(2.6);
  P.trophy5 = makeTrophy();
  P.drop5 = makeSweatDrop({ size: 0.08 });
}
// a human-height lamppost (the final opponent).  bulb.material.emissiveIntensity flickers.
function makeLamppost() {
  const g = new THREE.Group(), metal = new THREE.MeshStandardMaterial({ color: '#2b2f3a', roughness: 0.5, metalness: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 12), metal); base.position.y = 0.09; g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.3, 10), metal); pole.position.y = 1.3; pole.castShadow = true; g.add(pole);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.34), metal); cap.position.y = 2.47; g.add(cap);
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff4c8', emissive: '#ffd77a', emissiveIntensity: 2.2, roughness: 0.3 });
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.24), bulbMat); bulb.position.y = 2.65; g.add(bulb);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.2, 4), metal); roof.position.y = 2.9; roof.rotation.y = Math.PI / 4; g.add(roof);
  const light = new THREE.PointLight('#ffd77a', 2.5, 4.5, 2); light.position.y = 2.6; g.add(light);
  g.userData = { bulb, bulbMat, light, bulbY: 2.65, setOn(on) { bulbMat.emissiveIntensity = on ? 2.2 : 0.05; light.intensity = on ? 2.5 : 0; } };
  return g;
}
function makeBib(text, color = '#ffffff') {
  const tex = canvasTexture(256, 200, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1d1d22'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#1d1d22'; g.font = `900 ${text.length > 2 ? 78 : 120}px "Nunito", "DejaVu Sans", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 6);
    g.fillStyle = '#c0392b'; for (const x of [26, w - 26]) { g.beginPath(); g.arc(x, 26, 9, 0, Math.PI * 2); g.fill(); }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.234), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
  return m;
}
function makeDuster() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), new THREE.MeshStandardMaterial({ color: '#7d5232', roughness: 0.7 }));
  stick.position.y = 0.21; g.add(stick);
  const fm = new THREE.MeshStandardMaterial({ color: '#ff8fc8', roughness: 1 });
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.07), fm); const a = i * 0.7; f.position.set(Math.cos(a) * 0.045, 0.48 + 0.04 * (i % 3), Math.sin(a) * 0.045); f.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); g.add(f); }
  return g;
}
function makeShades() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#111114', roughness: 0.25, metalness: 0.4 });
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.03), m); l.position.x = s * 0.13; g.add(l); }
  const br = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.025), m); br.position.y = 0.03; g.add(br);
  return g;
}
function makeMoth() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#efe6d2', roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.06), new THREE.MeshStandardMaterial({ color: '#8a7a60' })); g.add(body);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.004, 0.05), m); w.position.x = s * 0.04; w.name = s < 0 ? 'wL' : 'wR'; g.add(w); }
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
/** The big red OUT stamp. */
function outStamp(ctx, t0, o = {}) {
  const d = ctx.t - t0;
  if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text('OUT', { x: 0.5, y: 0.3, size: 260, fill: '#e8232b', stroke: '#ffffff', line: 14, rot: -0.18, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
const facing = (obj) => V(Math.sin(obj.rotation.y), 0, Math.cos(obj.rotation.y));
/** A camera `d` metres in front of a face, `side` metres to its left (+) / right (−). */
const catCam = (ch, d, side = 0, fov = 38) => { const f = humanFace(ch).add(up(0.38)), fw = facing(ch.root), l = V(fw.z, 0, -fw.x); return { pos: f.clone().addScaledVector(fw, d).addScaledVector(l, side).add(up(0.05)), look: f, fov }; };
const faceCam = (ch, d, side = 0, lift = 0, fov = 34) => { const f = humanFace(ch), fw = facing(ch.root), l = V(fw.z, 0, -fw.x); return { pos: f.clone().addScaledVector(fw, d).addScaledVector(l, side).add(up(lift)), look: f, fov }; };

/** Brenda frozen solid (bolt upright, arms at her sides).  The face is the only thing that moves. */
function frozen(ch, face = 'determined', t = 0) { ch.pose('idle', 0, { intensity: 0 }); ch.face(face, t); }
function hussFace(ctx, ch, hits, idle = 'determined') {
  const h = lastBefore(hits, ctx.t);
  frozen(ch, h != null && ctx.t - h < 0.2 ? 'huss' : idle, OPEN(ch));
}
function bib(ctx, ch, mesh) { ctx.add(mesh, ch.joints.torso); mesh.position.set(0, 0.22, 0.19); mesh.rotation.set(0, 0, 0); }

/** Brenda in the middle of her room, facing the open side. */
function roomScene(ctx) {
  const set = ctx.set; set.setLighting?.('night'); set.set?.('window', 'party');
  set.root.updateMatrixWorld(true);
  const center = set.root.getWorldPosition(V()), cam = ctx.point('room.cam');
  const d = V(cam.x - center.x, 0, cam.z - center.z).normalize();
  const yaw = Math.atan2(d.x, d.z);
  const F = frame(V().copy(center).addScaledVector(d, -0.2), yaw);
  ctx.place('brenda', F(0, 0, 0)); ctx.cast.brenda.root.rotation.set(0, yaw, 0);
  return { F };
}
function catOnHead(ctx) {
  const cat = ctx.cast.cat, b = ctx.cast.brenda;
  ctx.add(cat.root, b.joints.head); cat.root.position.set(0, 0.72, -0.04); cat.root.rotation.set(0, 0.25, 0); cat.root.scale.setScalar(0.9);
}

// ── The freeze-dance stage.  S: stage frame (+z = towards the audience, +x = along the stage).
const DANCERS = [['marcus', -1.5, 2.3], ['mayor', 1.6, 2.2], ['x00', -2.7, 2.6], ['x01', 2.8, 2.6], ['x02', -3.8, 1.9], ['x03', 3.9, 1.9],
  ['x04', -2.3, 1.1], ['x05', 2.4, 1.1], ['x06', -3.4, 0.3], ['x07', 3.5, 0.3], ['x08', -4.6, 2.8], ['x09', 4.6, 2.8]];
function freezeStage(ctx, { dancers = true, lamp = false, night = false, crowd = true } = {}) {
  ctx.set.setLighting?.(night ? 'quiet_night' : 'party_night');
  ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('standsCrowd', true); ctx.set.set?.('crowdMotion', night ? 0 : 0.7);
  const S = frameAt(ctx, 'square.stage');
  const st = { S, dancers: [], stands: [] };
  ctx.place('brenda', S(0, 0, 2.55)); ctx.cast.brenda.root.rotation.set(0, S.yaw, 0);
  bib(ctx, ctx.cast.brenda, ctx.props.bibB);
  if (dancers) DANCERS.forEach(([id, x, z], k) => {
    ctx.place(id, S(x, 0, z)); ctx.cast[id].root.rotation.set(0, S.yaw + (hash(k) - 0.5) * 0.5, 0);
    if (id.startsWith('x')) ctx.cast[id].setAccessory?.('partyHat', true);
    st.dancers.push({ ch: ctx.cast[id], phase: hash(k * 1.3) * 2, k });
  });
  if (crowd) {
    const fill = (rows, ids, k0) => {
      if (!Array.isArray(rows)) return; let k = 0;
      rows.forEach((row) => { const w = row.userData?.width || 7.2, per = 7; for (let j = 0; j < per && k < ids.length; j++, k++) {
        const id = ids[k]; ctx.place(id, row, { offset: [(j - (per - 1) / 2) * (w / per) + (hash(k + k0) - 0.5) * 0.2, 0, 0] });
        ctx.cast[id].setAccessory?.('partyHat', true); st.stands.push({ ch: ctx.cast[id], phase: hash(k * 3.1 + k0) * 3, k: k + k0 }); } });
    };
    fill(ctx.anchor('square.standA.rows'), dancers ? EXTRA_IDS.slice(10, 18) : ['grandad', 'marcus', 'mayor', ...EXTRA_IDS.slice(0, 11)], 0);
  }
  // DJ Grandad on stage
  if (dancers) {
    const P = ctx.props; ctx.add(P.decks5.root); P.decks5.root.position.copy(S(-1.2, 0, -1.5)); P.decks5.root.rotation.set(0, S.yaw, 0);
    ctx.place('grandad', S(-1.2, 0, -2.05)); ctx.cast.grandad.root.rotation.set(0, S.yaw, 0);
  }
  if (lamp) {
    const L = ctx.props.lamp; ctx.add(L); L.position.copy(S(0.9, 0, 2.55)); L.rotation.set(0, S.yaw, 0); L.userData.setOn(true);
    const b = ctx.props.bibL; ctx.add(b, L); b.position.set(0, 1.35, 0.065); b.scale.setScalar(0.6);
  }
  return st;
}
function stageAnim(ctx, st, { freezeAt = null, standsMode = 'cheer', sleepy = false } = {}) {
  const tf = freezeAt != null && ctx.t > freezeAt ? freezeAt : ctx.t;
  for (const d of st.dancers) { d.ch.pose(d.k % 3 ? 'dance' : 'dance2', tf + d.phase); d.ch.face(freezeAt != null && ctx.t > freezeAt ? 'determined' : 'grin', OPEN(d.ch)); }
  for (const c of st.stands) {
    if (sleepy && c.k % 2 === 0) { c.ch.pose('idle', 0, { intensity: 0, headPitch: 0.55 }); c.ch.face('sleepy', SHUT(c.ch)); continue; }
    const a = standsMode === 'peer' ? 'peer' : standsMode === 'idle' ? 'idle' : (c.k % 2 ? 'cheer' : 'clap');
    c.ch.pose(a, ctx.t + c.phase); c.ch.face(standsMode === 'peer' ? 'shocked' : 'grin', ctx.t + c.phase);
  }
  if (st.dancers.length) { ctx.props.decks5.update(ctx.t); const g = ctx.cast.grandad; g.pose('dance2', tf, { speed: 1.1 }); g.face('grin', ctx.t); }
}
function holdTrophy(ctx, ch) {
  const tr = ctx.props.trophy5, s = 1.3; ctx.add(tr); tr.scale.setScalar(s);
  ch.root.updateMatrixWorld(true);
  const hp = ch.joints.handR.getWorldPosition(V());
  const g = tr.userData.grip ? tr.userData.grip.position : V(0, 0.122, 0);
  tr.position.copy(hp).addScaledVector(g, -s); tr.rotation.set(0, ch.root.rotation.y, 0);
}

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody dances."
  {
    name: 'party crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 5, hats: true });
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
      const w = hs.length ? hs[Math.min(3, hs.length - 1)].windows[0] : ctx.anchor('myHouse.window');
      ctx.store = { W: frame(rel(w), yawOf(w)) };
    },
    update(ctx, lt, u) { const W = ctx.store.W; ctx.cam.move({ pos: W(0, -0.8, 5), look: W(0, 0, 0), fov: 40 }, { pos: W(0, -0.2, 1.8), look: W(0, 0, 0), fov: 36 }, ease.inQuad(u)); },
  },
  {
    name: 'frozen', start: 'b02.w1-0.05', set: 'room',
    setup(ctx) { ctx.store = roomScene(ctx); },
    update(ctx, lt) {
      const b = ctx.cast.brenda; frozen(b, 'neutral', OPEN(b));
      ctx.cam.move(faceCam(b, 3.0, 0.4, -0.5, 40), faceCam(b, 2.4, 0.3, -0.45, 38), clamp(lt / 0.9, 0, 1));
    },
  },
  // ── b03 HUSS ×6 — not one millimetre of movement; only the face snaps
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `frozen huss #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = roomScene(ctx); },
    update(ctx) {
      const b = ctx.cast.brenda, hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      hussFace(ctx, b, hits);
      const set = [[2.6, 0.5, -0.5, 40], [1.9, -0.6, -0.3, 38], [1.5, 0.3, -0.15, 36], [2.2, -0.9, -0.4, 40], [1.15, 0.15, -0.05, 34], [0.85, 0, 0, 32]][i];
      ctx.cam.set(faceCam(b, ...set)); ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b04 "Grandad's DJ name? Grandad."
  {
    name: 'dj grandad', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'street.crowdB');
      const P = ctx.props; ctx.add(P.decks5.root); P.decks5.root.position.copy(F(0, 0, 2.6)); P.decks5.root.rotation.set(0, F.yaw, 0); P.decks5.setOn(true);
      ctx.place('grandad', F(0, 0, 2.05)); ctx.cast.grandad.root.rotation.set(0, F.yaw, 0);
      const crowd = [];
      EXTRA_IDS.slice(0, 10).forEach((id, k) => { const sx = k % 2 ? 1 : -1; ctx.place(id, F(sx * (1.3 + (Math.floor(k / 2) % 3) * 0.9) + (hash(k) - 0.5) * 0.3, 0, 3.8 + Math.floor(k / 6) * 1.2)); ctx.cast[id].root.rotation.set(0, F.yaw + Math.PI + (hash(k * 2) - 0.5) * 0.6, 0); ctx.cast[id].setAccessory?.('partyHat', true); crowd.push({ ch: ctx.cast[id], phase: hash(k) * 2, k }); });
      ctx.store = { F, crowd };
    },
    update(ctx, lt) {
      const { F, crowd } = ctx.store, g = ctx.cast.grandad;
      animateCrowd(crowd, ctx.t); ctx.props.decks5.update(ctx.t);
      g.pose('dance2', ctx.t, { speed: 1.15 }); g.face('grin', ctx.t);
      const hp = headPos(g, 0.3);
      ctx.cam.move({ pos: hp.clone().addScaledVector(F.fwd, 3.0).add(V(0.4, 0.35, 0)), look: hp.clone().add(up(-0.45)), fov: 42 }, { pos: hp.clone().addScaledVector(F.fwd, 2.3).add(V(0.25, 0.2, 0)), look: hp.clone().add(up(-0.35)), fov: 40 }, clamp(lt / 2.0, 0, 1));
      tag(ctx, 'DJ GRANDAD', ctx.markers.djName, Infinity, { y: 0.2, size: 80, bg: 'rgba(138,92,255,0.92)' });
    },
  },
  // ── b05 "While they're out partying, by the way, I'm home. Not moving."
  {
    name: 'not moving', start: 'b05-0.1', set: 'room',
    setup(ctx) { ctx.store = roomScene(ctx); },
    update(ctx) {
      const b = ctx.cast.brenda; frozen(b, 'neutral', OPEN(b));
      ctx.cam.set({ pos: ctx.point('room.cam'), look: ctx.store.F(0, 1.1, 0), fov: 46 });
    },
  },
  // ── b06 "Day one: four seconds."
  {
    name: 'day one', start: 'b06-0.1', set: 'room',
    setup(ctx) { ctx.store = roomScene(ctx); },
    update(ctx) {
      const b = ctx.cast.brenda, tw = ctx.markers.wobble;
      if (ctx.t < tw) frozen(b, 'determined', OPEN(b));
      else { b.pose('surprised', ctx.t - tw); b.face('sweat', ctx.t); }
      ctx.cam.set(faceCam(b, 2.4, 0.35, -0.45, 40));
      if (ctx.t > tw) ctx.cam.shake(0.2, ctx.t, 6);
      tag(ctx, 'DAY 1', ctx.markers.day1, Infinity, { y: 0.12, size: 80, bg: 'rgba(200,0,40,0.9)', rot: 0 });
      const n = Math.min(4, 1 + Math.floor((ctx.t - ctx.markers.day1) / 0.18));
      if (ctx.t > ctx.markers.day1) ctx.fx.text(`0:0${n}`, { x: 0.5, y: 0.2, size: 90, fill: '#ffe14a', stroke: '#000', rot: 0 });
    },
  },
  // ── b07 "Day forty: the cat thinks I'm a bookshelf."
  {
    name: 'day forty', start: 'b07-0.1', set: 'room',
    setup(ctx) { ctx.store = roomScene(ctx); catOnHead(ctx); },
    update(ctx, lt) {
      const b = ctx.cast.brenda, cat = ctx.cast.cat;
      frozen(b, 'determined', OPEN(b)); cat.pose('loaf', ctx.t); cat.face('stare', OPEN(cat));
      ctx.cam.move(catCam(b, 3.0, 0.3, 40), catCam(b, 2.5, 0.25, 38), clamp(lt / 1.6, 0, 1));
      tag(ctx, 'DAY 40', ctx.markers.day40, Infinity, { y: 0.12, size: 80, bg: 'rgba(20,130,60,0.92)', rot: 0 });
    },
  },
  // ── b08 quote: "Be a fridge. Cold. Still. Full of snacks." — my dentist
  {
    name: 'fridge card', start: 'b08-0.1', set: 'room',
    setup(ctx) { ctx.store = roomScene(ctx); catOnHead(ctx); },
    update(ctx, lt, u) {
      const b = ctx.cast.brenda, cat = ctx.cast.cat;
      frozen(b, 'determined', OPEN(b)); cat.pose('loaf', ctx.t); cat.face('stare', OPEN(cat));
      ctx.cam.move(catCam(b, 2.6, 0.2, 38), catCam(b, 2.1, 0.15, 36), u);
      quoteCard(ctx, 'Be a fridge. Cold. Still. Full of snacks.', 'my dentist', ctx.markers.quote1, ctx.markers.quote1end, { y: 0.32, byAt: ctx.markers.dentist });
    },
  },
  // ── b09 HUSS ×3 — face only; a sweat drop slides; the cat never blinks
  ...[0, 1, 2].map((i) => ({
    name: `cat shelf huss #${i + 1}`, start: i === 0 ? 'b09.h0-0.12' : `b09.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = roomScene(ctx); catOnHead(ctx); const d = ctx.props.drop5; ctx.add(d, ctx.cast.brenda.joints.head); },
    update(ctx) {
      const b = ctx.cast.brenda, cat = ctx.cast.cat, hits = ctx.hussTimes('b09').map((h) => h + 0.03);
      hussFace(ctx, b, hits); cat.pose('loaf', 0); cat.face('stare', OPEN(cat));
      const k = clamp((ctx.t - ctx.time('b09')) / 0.8, 0, 1);
      ctx.props.drop5.position.set(0.24, 0.5 - 0.3 * k, 0.29);
      ctx.cam.set(catCam(b, [2.2, 1.8, 1.5][i], [0.25, -0.2, 0.1][i], 36)); ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b10 "Top ten respectful moments. Number seven: Grandad dusted me."
  {
    name: 'grandad dusts', start: 'b10-0.1', set: 'room',
    setup(ctx) {
      const st = ctx.store = roomScene(ctx); catOnHead(ctx);
      ctx.place('grandad', st.F(0.62, 0, 0.32)); ctx.cast.grandad.root.rotation.set(0, st.F.yaw - 1.35, 0);
      ctx.cast.grandad.setAccessory?.('headphones', false); ctx.cast.grandad.setAccessory?.('sunglasses', false); ctx.cast.grandad.setAccessory?.('glasses', true);
    },
    update(ctx) {
      const b = ctx.cast.brenda, cat = ctx.cast.cat, g = ctx.cast.grandad, P = ctx.props;
      frozen(b, 'determined', OPEN(b)); cat.pose('loaf', 0); cat.face('stare', OPEN(cat));
      const td = ctx.markers.dust, dusting = ctx.t > td - 0.3 && ctx.t < td + 1.0;
      if (dusting) g.pose('wave', ctx.t * 1.6); else g.pose('idle', ctx.t, { headPitch: ctx.t > td + 1.0 ? 0.35 : 0 });
      g.face(ctx.t > td + 1.0 ? 'smile' : 'neutral', ctx.t);
      ctx.add(P.duster); g.root.updateMatrixWorld(true);
      P.duster.position.copy(g.joints.handR.getWorldPosition(V())); P.duster.rotation.set(0.3, g.root.rotation.y, -0.5 + (dusting ? 0.4 * Math.sin(ctx.t * 14) : 0));
      ctx.cam.set({ pos: ctx.store.F(0.35, 1.85, 3.9), look: ctx.store.F(0.32, 1.55, 0.1), fov: 44 });
      top10Card(ctx, 7, ctx.time('b10') + 0.05, Infinity, { popAt: ctx.markers.top7 });
    },
  },
  // ── b11 "Then came the Freeze Dance Championship."
  {
    name: 'championship', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      ctx.store = freezeStage(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 22).add(up(10)), look: c.clone().add(up(2)), fov: 44 };
      ctx.store.to = { pos: ctx.store.S(0.5, 2.4, 9.5), look: ctx.store.S(0, 1.4, 1.5), fov: 46 };
    },
    update(ctx, lt, u) { const st = ctx.store; stageAnim(ctx, st); frozen(ctx.cast.brenda, 'neutral', OPEN(ctx.cast.brenda)); ctx.cam.move(st.from, st.to, u, ease.inOutCubic); },
  },
  // ── b12 "Marcus sneezed. He's out!"   (music stops: everyone freezes)
  {
    name: 'marcus sneezed', start: 'b12-0.1', set: 'town',
    setup(ctx) { ctx.store = freezeStage(ctx); ctx.set.set?.('crowdMotion', 0); },
    update(ctx) {
      const st = ctx.store, m = ctx.cast.marcus, tf = ctx.time('b12') - 0.05, ts = ctx.markers.sneeze;
      stageAnim(ctx, st, { freezeAt: tf, standsMode: 'peer' }); frozen(ctx.cast.brenda, 'neutral', OPEN(ctx.cast.brenda));
      if (ctx.t > ts) { m.pose('surprised', Math.min(ctx.t - ts, 0.3)); m.face(ctx.t > ctx.markers.out1 ? 'sad' : 'shocked', ctx.t); }
      ctx.cam.set(ctx.t < ts - 0.2 ? { pos: st.S(-0.6, 1.9, 6.0), look: st.S(-0.6, 1.3, 2.0), fov: 42 } : faceCam(m, 2.4, 0.3, -0.25, 38));
      if (ctx.t > ts && ctx.t < ts + 0.2) ctx.cam.shake(0.3, ctx.t, 12);
      outStamp(ctx, ctx.markers.out1);
    },
  },
  // ── b13 "The mayor's mustache twitched. He's out!"
  {
    name: 'mustache twitched', start: 'b13-0.1', set: 'town',
    setup(ctx) { ctx.store = freezeStage(ctx); ctx.set.set?.('crowdMotion', 0); },
    update(ctx) {
      const st = ctx.store, m = ctx.cast.mayor, tf = ctx.time('b12') - 0.05, tw = ctx.markers.twitch;
      stageAnim(ctx, st, { freezeAt: tf, standsMode: 'peer' });
      const tw2 = ctx.t - tw, jig = tw2 > 0 && tw2 < 0.25 ? Math.sin(tw2 * 90) * 0.012 : 0;
      m.joints.head.position.x += jig;
      m.face(ctx.t > ctx.markers.out2 ? 'shocked' : 'determined', OPEN(m));
      ctx.cam.set(faceCam(m, 1.25, 0.15, -0.12, 32));
      outStamp(ctx, ctx.markers.out2);
    },
  },
  // ── b14 quote: "Never trust a man who blinks." — a fish
  {
    name: 'fish card', start: 'b14-0.1', set: 'town',
    setup(ctx) { ctx.store = freezeStage(ctx); ctx.set.set?.('crowdMotion', 0); },
    update(ctx, lt, u) {
      const st = ctx.store; stageAnim(ctx, st, { freezeAt: ctx.time('b12') - 0.05, standsMode: 'peer' }); frozen(ctx.cast.brenda, 'neutral', OPEN(ctx.cast.brenda));
      ctx.cam.move({ pos: st.S(-4.0, 1.6, 4.6), look: st.S(-2.0, 1.2, 2.0), fov: 42 }, { pos: st.S(2.0, 1.6, 4.6), look: st.S(3.5, 1.2, 2.0), fov: 42 }, u);
      quoteCard(ctx, 'Never trust a man who blinks.', 'a fish', ctx.markers.quote2, ctx.markers.quote2end, { y: 0.32, byAt: ctx.markers.fish });
    },
  },
  // ── b15 "Hours later. Just me and a lamppost."  /  b15m quote: "Be the lamp, not the moth." — a moth
  {
    name: 'me and a lamppost', start: 'b15-0.1', set: 'town',
    setup(ctx) { ctx.store = freezeStage(ctx, { dancers: false, lamp: true }); ctx.set.set?.('crowdMotion', 0); },
    update(ctx, lt) {
      const st = ctx.store, b = ctx.cast.brenda; stageAnim(ctx, st, { standsMode: 'idle', sleepy: true }); frozen(b, 'neutral', OPEN(b));
      const tl = ctx.markers.lamp;
      if (ctx.t < ctx.time('b15.w2') - 0.05) {
        ctx.cam.set({ pos: st.S(0.5, 2.2, 8.0), look: st.S(0.5, 1.2, 2.5), fov: 40 });
        ctx.fx.overlay('#1a1040', 0.55); ctx.fx.text('3 AM', { y: 0.38, size: 220, fill: '#ffe14a', stroke: '#3a1a00', rot: -0.05 }); ctx.caption.hide(true);
      } else ctx.cam.move({ pos: st.S(0.45, 2.1, 8.4), look: st.S(0.45, 1.4, 2.55), fov: 40 }, { pos: st.S(0.45, 1.95, 7.4), look: st.S(0.45, 1.4, 2.55), fov: 40 }, clamp((ctx.t - tl + 0.6) / 1.4, 0, 1));
    },
  },
  {
    name: 'moth card', start: 'b15m-0.1', set: 'town',
    setup(ctx) { ctx.store = freezeStage(ctx, { dancers: false, lamp: true }); ctx.set.set?.('crowdMotion', 0); ctx.add(ctx.props.moth); },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.brenda, L = ctx.props.lamp, M = ctx.props.moth;
      stageAnim(ctx, st, { standsMode: 'idle', sleepy: true }); frozen(b, 'neutral', OPEN(b));
      const bp = L.position.clone().add(up(L.userData.bulbY));
      const a = ctx.t * 7;
      M.position.copy(bp).add(V(Math.cos(a) * 0.32, 0.05 * Math.sin(a * 2.3), Math.sin(a) * 0.32)); M.rotation.set(0, -a, 0);
      M.getObjectByName('wL').rotation.z = 0.7 * Math.sin(ctx.t * 60); M.getObjectByName('wR').rotation.z = -0.7 * Math.sin(ctx.t * 60);
      ctx.cam.set({ pos: bp.clone().addScaledVector(st.S.fwd, 1.6).add(up(-0.2)), look: bp, fov: 40 });
      quoteCard(ctx, 'Be the lamp, not the moth.', 'a moth', ctx.markers.quote4, ctx.markers.quote4end, { y: 0.5, byAt: ctx.markers.moth });
    },
  },
  // ── b16 HUSS ×6 — the face-off: Brenda vs the lamppost
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `lamppost faceoff #${i + 1}`, start: i === 0 ? 'b16.h0-0.12' : `b16.h${i}-0.03`, set: 'town',
    setup(ctx) { ctx.store = freezeStage(ctx, { dancers: false, lamp: true }); ctx.set.set?.('crowdMotion', 0); if (i >= 3) { const d = ctx.props.drop5; ctx.add(d, ctx.cast.brenda.joints.head); } },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.brenda, L = ctx.props.lamp, hits = ctx.hussTimes('b16').map((h) => h + 0.03);
      stageAnim(ctx, st, { standsMode: i >= 2 ? 'peer' : 'idle', sleepy: i < 2 }); hussFace(ctx, b, hits);
      if (i >= 3) ctx.props.drop5.position.set(0.24, 0.5 - 0.06 * (i - 3), 0.29);
      const bp = L.position.clone().add(up(L.userData.bulbY - 0.15));
      const two = { pos: st.S(0.45, 1.95, 7.4), look: st.S(0.45, 1.4, 2.55), fov: 40 };
      if (i === 0 || i === 3) ctx.cam.set(faceCam(b, [2.0, 1.1][i ? 1 : 0], -0.7, 0, 34));
      else if (i === 1 || i === 4) ctx.cam.set({ pos: bp.clone().addScaledVector(st.S.fwd, [2.2, 1.3][i === 1 ? 0 : 1]).addScaledVector(st.S.left, -0.6).add(up(-0.3)), look: bp, fov: 34 });
      else if (i === 2) { const F = frameAt(ctx, 'square.standA'); ctx.cam.set({ pos: F(0, 2.4, 5.0), look: F(0, 2.0, 0), fov: 42 }); }
      else ctx.cam.set(two);
      ctx.cam.punch(hits, ctx.t, 0.12, 0.18); ctx.cam.shake(0.1, ctx.t, 40 + i);
    },
  })),
  // ── b17 "The lamppost flickered. It's out!"
  {
    name: 'lamppost flickered', start: 'b17-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = freezeStage(ctx, { dancers: false, lamp: true });
      const cf = ctx.props.confetti; ctx.add(cf.root); cf.root.position.copy(st.S(0.5, 3.0, 2.6));
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.brenda, L = ctx.props.lamp, tf = ctx.markers.flicker, to = ctx.markers.out3;
      const d = ctx.t - tf;
      L.userData.setOn(!(d > 0 && d < 0.6 && Math.floor(d * 14) % 2 === 0));
      stageAnim(ctx, st, { standsMode: ctx.t > to ? 'cheer' : 'peer' }); frozen(b, 'neutral', OPEN(b));
      if (ctx.t > to) holdTrophy(ctx, b);
      ctx.props.confetti.update(ctx.t - to);
      ctx.cam.set(ctx.t < to ? { pos: st.S(0.75, 2.2, 4.2), look: st.S(0.9, 2.4, 2.55), fov: 40 } : { pos: st.S(0.45, 1.95, 7.4), look: st.S(0.45, 1.4, 2.55), fov: 40 });
      outStamp(ctx, to, { x: 0.62, y: 0.26 });
    },
  },
  // ── b18 Marcus: "Brenda, how did you win?"
  {
    name: 'marcus how', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = freezeStage(ctx, { dancers: false, lamp: true });
      ctx.place('marcus', st.S(-1.0, 0, 2.3)); ctx.cast.marcus.root.rotation.set(0, st.S.yaw - 1.3, 0);
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.brenda, m = ctx.cast.marcus;
      stageAnim(ctx, st, { standsMode: 'cheer' }); frozen(b, 'neutral', OPEN(b)); holdTrophy(ctx, b);
      m.pose('shrug', ctx.t); m.face('shocked', ctx.t);
      ctx.cam.set({ pos: st.S(-0.5, 1.9, 6.9), look: st.S(-0.5, 1.4, 2.45), fov: 40 });
    },
  },
  // ── b19 Brenda: "While you were out partying, by the way."
  {
    name: 'by the way', start: 'b19-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = freezeStage(ctx, { dancers: false, lamp: true });
      ctx.place('marcus', st.S(-1.0, 0, 2.3)); ctx.cast.marcus.root.rotation.set(0, st.S.yaw - 1.3, 0);
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.brenda, m = ctx.cast.marcus;
      stageAnim(ctx, st, { standsMode: 'peer' }); holdTrophy(ctx, b);
      const w = ctx.wordAt(ctx.t), talking = w && w.beat === 'b19' && (ctx.t - w.start) % 0.22 < 0.12;
      frozen(b, talking ? 'grin' : 'neutral', OPEN(b));
      m.pose('idle', ctx.t); m.face('shocked', ctx.t);
      ctx.cam.set(faceCam(b, 1.5, -0.35, -0.05, 34));
    },
  },
  // ── b20 "Number one: I said that in my sleep."
  {
    name: 'asleep', start: 'b20-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = freezeStage(ctx, { dancers: false, lamp: true });
      ctx.place('marcus', st.S(-0.75, 0, 2.55)); ctx.cast.marcus.root.rotation.set(0, st.S.yaw - Math.PI / 2, 0);
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.brenda, m = ctx.cast.marcus, P = ctx.props, tl = ctx.markers.lift;
      stageAnim(ctx, st, { standsMode: 'peer' }); holdTrophy(ctx, b);
      const lifted = ctx.t > tl;
      b.setAccessory('sunglasses', !lifted);
      frozen(b, lifted ? 'sleepy' : 'neutral', lifted ? SHUT(b) : OPEN(b));
      m.pose(lifted ? 'cheer' : 'point', lifted ? 0.4 : ctx.t, { intensity: 0.6 }); m.face('shocked', ctx.t);
      if (lifted) { ctx.add(P.shades); m.root.updateMatrixWorld(true); P.shades.position.copy(m.joints.handL.getWorldPosition(V())).add(up(0.08)); P.shades.rotation.set(0, b.root.rotation.y, 0.2); }
      ctx.cam.set(faceCam(b, 2.9, -0.6, 0.0, 40));
      top10Card(ctx, 1, ctx.time('b20') + 0.02, Infinity, { popAt: ctx.markers.top1 });
      if (ctx.t > ctx.markers.sleep) tag(ctx, 'Z z z', ctx.markers.sleep, Infinity, { x: 0.68, y: 0.42, size: 96, bg: null, rot: -0.2 });
    },
  },
  // ── b21 quote: "Stand still long enough and you become a hotel." … — a pigeon
  {
    name: 'hotel card', start: 'b21-0.1', set: 'town',
    setup(ctx) { ctx.store = freezeStage(ctx, { dancers: false, lamp: true }); ctx.cast.brenda.setAccessory('sunglasses', false); },
    update(ctx, lt, u) {
      const st = ctx.store, b = ctx.cast.brenda; stageAnim(ctx, st, { standsMode: 'idle' }); holdTrophy(ctx, b);
      b.setAccessory('sunglasses', false); frozen(b, 'sleepy', SHUT(b));
      ctx.cam.move(faceCam(b, 2.6, -0.3, 0.2, 38), faceCam(b, 2.0, -0.25, 0.25, 38), u);
      quoteCard(ctx, 'Stand still long enough and you become a hotel.', null, ctx.markers.quote3, ctx.markers.quote3end + 0.05, { y: 0.32 });
    },
  },
  {
    name: 'pigeon checks in', start: 'quote3end+0.05', set: 'town',
    setup(ctx) {
      ctx.store = freezeStage(ctx, { dancers: false, lamp: true }); ctx.cast.brenda.setAccessory('sunglasses', false);
      const p = ctx.cast.pigeon, b = ctx.cast.brenda; ctx.add(p.root, b.joints.head); p.root.rotation.set(0, 0, 0); p.root.scale.setScalar(0.85);
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.brenda, p = ctx.cast.pigeon; stageAnim(ctx, st, { standsMode: 'idle' }); holdTrophy(ctx, b);
      b.setAccessory('sunglasses', false); frozen(b, 'sleepy', SHUT(b));
      const t0 = ctx.markers.quote3end + 0.05, k = clamp((ctx.t - t0) / 0.7, 0, 1);
      p.root.position.set(0.05 * (1 - k), 0.7 + 1.1 * (1 - ease.outCubic(k)), -0.02);
      if (k < 1) p.pose('flap', ctx.t); else p.pose('sit', ctx.t); p.face('smug', ctx.t);
      ctx.cam.set(faceCam(b, 2.1, -0.3, 0.35, 38));
      tag(ctx, 'A PIGEON', ctx.time('b21.w8'), Infinity, { y: 0.2 });
    },
  },
  // ── b22 HUSS ×3 — she snores HUSS; the pigeon puffs with every one
  ...[0, 1, 2].map((i) => ({
    name: `snore huss #${i + 1}`, start: i === 0 ? 'b22.h0-0.12' : `b22.h${i}-0.03`, set: 'town',
    setup(ctx) {
      ctx.store = freezeStage(ctx, { dancers: false, lamp: true }); ctx.cast.brenda.setAccessory('sunglasses', false);
      const p = ctx.cast.pigeon, b = ctx.cast.brenda; ctx.add(p.root, b.joints.head); p.root.position.set(0, 0.7, -0.02); p.root.rotation.set(0, 0, 0); p.root.scale.setScalar(0.85);
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.brenda, p = ctx.cast.pigeon, hits = ctx.hussTimes('b22').map((h) => h + 0.03);
      stageAnim(ctx, st, { standsMode: 'idle', sleepy: true }); holdTrophy(ctx, b);
      b.setAccessory('sunglasses', false);
      const h = lastBefore(hits, ctx.t), near = h != null && ctx.t - h < 0.2;
      frozen(b, near ? 'huss' : 'sleepy', SHUT(b));
      p.pose('huss', ctx.t, { hits }); p.face('huss', ctx.t);
      ctx.cam.set(faceCam(b, [2.2, 1.7, 2.8][i], [-0.3, 0.3, -0.1][i], [0.3, 0.3, 0.15][i], 38));
      ctx.cam.punch(hits, ctx.t, 0.08, 0.2);
      hits.forEach((x, k) => { if (ctx.t > x) tag(ctx, 'HUSS', x, x + 0.5, { x: 0.3 + 0.2 * k, y: 0.3 - 0.04 * k, size: 64, fill: '#1d1d22', stroke: '#ffffff', bg: 'rgba(255,255,255,0.92)', rot: -0.1 + 0.1 * k }); });
      const tEnd = ctx.time('b22.end') + 0.85, ki = clamp((ctx.t - tEnd) / 0.45, 0, 1);
      if (ki > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - ki); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * 0.4, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); });
    },
  })),
];
