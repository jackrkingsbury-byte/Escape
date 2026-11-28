// In This Town — Episode 8: "Pet Rock".  Gerald (DJ Hip Replacement, 91) raises a rock called Keith.
// Film contract: SPEC.md §8.  Timeline: episodes/ep8/timeline.json (audio/build_episode.py ep8).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { WALK_SPEED } from '../characters.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, ease, hash, lerp, canvasTexture } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { makePartyHat, makeBalloon, makeSweatDrop } from '../props.js';
import { init as initEp1, V, TABLE_TOP, headPos, frame, frameAt, lastBefore, partyTown } from '../shots.js';
import { makeDJDecks } from '../ep2/props2.js';
import { makeToaster, makeCrack, makeTrophy, makeTrafficCone, makeSign, makePlinth } from '../ep3/props3.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const GSKIN = '#e9b99a';
const GERALD = { id: 'gerald', skin: GSKIN, hair: { style: 'bald', color: GSKIN }, top: { style: 'cardigan', color: '#3ee0c8', accent: '#ffffff' },
  bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#4a3b2f', accessories: ['glasses', 'mustache', 'headphones'], scale: 0.92 };
const babies = {};
for (let i = 0; i < 9; i++) babies[`bg${i}`] = { ...GERALD, id: `bg${i}`, scale: 0.26, accessories: ['glasses', 'mustache', 'partyHat'], partyHatColor: ['#ff4fa3', '#ffd23f', '#3ee0c8'][i % 3], lod: 'low' };
export const cast = {
  gerald: GERALD,
  babygerald: { ...GERALD, id: 'babygerald', scale: 0.33, accessories: ['glasses', 'mustache', 'headphones', 'partyHat'], partyHatColor: '#ff4fa3' },
  grandad: MAIN.grandad, heckler: MAIN.heckler, marcus: MAIN.marcus, cat: MAIN.cat, pigeon: MAIN.pigeon, mayor: MAIN.mayor,
  ...babies,
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 8, banner: ['SUMMER PARTY', 'PET SHOW', 'NO PIGEONS'] }),
  room: () => buildRoom({ variant: 'grandad', window: 'party' }),
};

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.keith = makeRock(0.16, '#8d8d8d');
  P.mum = makeMum();
  P.shelf = makeShelf();
  P.decks8 = makeDJDecks();
  P.bedSign = makeSign({ lines: ['DJ HIP REPLACEMENT', 'IN BED SINCE 7PM'], w: 1.1, h: 0.42, color: '#fff4e0' });
  P.leash = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 6), new THREE.MeshStandardMaterial({ color: '#c0392b' }));
  P.stick = boxM(0.42, 0.03, 0.03, '#7d5232');
  P.biscuit = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 16), new THREE.MeshStandardMaterial({ color: '#d9a35a' }));
  P.toaster8 = makeToaster(); P.cone8 = makeTrafficCone(); P.plinth8 = makePlinth({ w: 0.7, d: 0.7, h: 0.5, plaque: 'BEST CAT' });
  P.trophy8 = makeTrophy(); P.towerHat = makePartyHat('#ff4fa3');
  P.balloon8 = makeBalloon('#3ee0c8', { string: 0.5 });
  P.stain = makeStain();
  P.steam = makeSteam(); P.drop8 = makeSweatDrop({ size: 0.08 });
  P.leash2 = P.leash.clone(); P.leash3 = P.leash.clone();
  P.spot = new THREE.Mesh(new THREE.ConeGeometry(1.0, 4, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
}
function boxM(w, h, d, c) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })); m.castShadow = true; return m; }
// a low-poly rock in two halves (top lifts off when it hatches) + accessory slots
function makeRock(r, color) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true });
  const jitter = (geo, s) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.12 * (hash(i * 1.7 + s) - 0.5); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.82, p.getZ(i) * k); } geo.computeVertexNormals(); return geo; };
  const bottom = new THREE.Mesh(jitter(new THREE.SphereGeometry(r, 7, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 1), mat); bottom.castShadow = true;
  const top = new THREE.Mesh(jitter(new THREE.SphereGeometry(r, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), 1), mat); top.castShadow = true;
  const topG = new THREE.Group(); topG.add(top); g.add(topG);
  const botG = new THREE.Group(); botG.add(bottom); g.add(botG);
  g.position.y = r * 0.82;
  const root = new THREE.Group(); root.add(g);
  const acc = {};
  const hat = makePartyHat('#ffd23f'); hat.scale.setScalar(0.5); hat.position.set(0, r * 0.75, 0); hat.rotation.z = 0.2; topG.add(hat); acc.hat = hat;
  const gl = new THREE.Group(); for (const s of [-1, 1]) { const l = boxM(0.07, 0.045, 0.01, '#1d1d22'); l.position.x = s * 0.045; gl.add(l); } gl.position.set(0, r * 0.25, r * 0.92); topG.add(gl); acc.glasses = gl;
  const mu = boxM(0.1, 0.025, 0.02, '#5a3b24'); mu.position.set(0, r * 0.02, r * 0.97); topG.add(mu); acc.mustache = mu;
  const bt = new THREE.Group(); for (const s of [-1, 1]) { const w = boxM(0.04, 0.035, 0.015, '#c0392b'); w.position.x = s * 0.022; w.rotation.z = s * 0.3; bt.add(w); } bt.position.set(0, -r * 0.35, r * 0.95); botG.add(bt); acc.bowtie = bt;
  const hp = new THREE.Group(); const band = new THREE.Mesh(new THREE.TorusGeometry(r * 0.95, 0.012, 6, 18, Math.PI), new THREE.MeshStandardMaterial({ color: '#1d1d22' })); hp.add(band);
  for (const s of [-1, 1]) { const c = boxM(0.04, 0.07, 0.06, '#ff4fa3'); c.position.x = s * r * 0.95; hp.add(c); } hp.position.y = r * 0.15; topG.add(hp); acc.headphones = hp;
  const cd = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 0.9, r * 0.7, 9, 1, true), new THREE.MeshStandardMaterial({ color: '#3ee0c8', roughness: 1, side: THREE.DoubleSide })); cd.position.y = -r * 0.35; botG.add(cd); acc.cardigan = cd;
  const tagTex = canvasTexture(128, 64, (c, w, h) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d1d22'; c.font = '900 34px "Nunito", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('KEITH', w / 2, h / 2 + 2); });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshStandardMaterial({ map: tagTex, side: THREE.DoubleSide })); tag.position.set(0.05, -r * 0.6, r * 0.9); tag.rotation.set(-0.2, 0, 0.15); botG.add(tag); acc.tag = tag;
  const crack = makeCrack({ w: 0.26, h: 0.22, seed: 5, branches: 2 }); crack.root.position.set(0.0, 0.02, r * 0.99); g.add(crack.root); acc.crack = crack;
  root.userData = { r, g, topG, botG, acc, show(list) { for (const k of ['hat', 'glasses', 'mustache', 'bowtie', 'headphones', 'cardigan', 'tag']) acc[k].visible = list.includes(k); } };
  root.userData.show([]); crack.setGrowth(0);
  return root;
}
function makeMum() {
  const g = new THREE.Group();
  const chair = new THREE.Group(), wood = '#7d5232';
  const seat = boxM(1.3, 0.1, 1.1, wood); seat.position.y = 0.45; chair.add(seat);
  const back = boxM(1.3, 1.2, 0.1, wood); back.position.set(0, 1.0, -0.55); chair.add(back);
  for (const s of [-1, 1]) { const rk = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 6, 20, Math.PI / 2.2), new THREE.MeshStandardMaterial({ color: wood })); rk.rotation.set(0, Math.PI / 2, Math.PI + 0.78); rk.position.set(s * 0.6, 0.95, 0.05); chair.add(rk); }
  g.add(chair);
  const boulder = makeRock(0.62, '#7b7b7b'); boulder.position.set(0, 0.5, 0.05); g.add(boulder);
  const pearls = new THREE.Group(); for (let i = 0; i < 16; i++) { const a = Math.PI * (0.15 + 0.7 * i / 15); const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: '#fbf6ec', roughness: 0.2 })); p.position.set(Math.cos(a) * 0.5 - 0, -Math.sin(a) * 0.12, 0.52 + Math.sin(a) * 0.05); pearls.add(p); }
  pearls.position.set(0, 0.95, 0); g.add(pearls);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshStandardMaterial({ color: '#a8a8a8', roughness: 0.9 })); bun.position.set(0, 1.55, -0.05); g.add(bun);
  const gl = new THREE.Group(); for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 16), new THREE.MeshStandardMaterial({ color: '#1d1d22' })); l.position.x = s * 0.14; gl.add(l); } gl.position.set(0, 1.22, 0.56); g.add(gl);
  for (const s of [-1, 1]) { const nd = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), new THREE.MeshStandardMaterial({ color: '#c0c0c8', metalness: 0.5 })); nd.rotation.z = s * 0.6; nd.position.set(s * 0.08, 0.8, 0.68); g.add(nd); }
  const yarn = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: '#ff4fa3', roughness: 1 })); yarn.position.set(0.5, 0.6, 0.6); g.add(yarn);
  return g;
}
function makeShelf() {
  const g = new THREE.Group();
  const board = boxM(1.9, 0.05, 0.26, '#7d5232'); g.add(board);
  for (const s of [-1, 1]) { const br = boxM(0.04, 0.18, 0.2, '#5a3b24'); br.position.set(s * 0.8, -0.11, 0); g.add(br); }
  const rocks = [];
  for (let i = 0; i < 9; i++) { const rk = makeRock(0.065, ['#8d8d8d', '#9a9488', '#7f8590'][i % 3]); rk.position.set(-0.8 + i * 0.2, 0.025, 0.02); rk.rotation.y = hash(i) * 3; g.add(rk); rocks.push(rk); }
  g.userData.rocks = rocks;
  return g;
}
function makeStain() {
  const tex = canvasTexture(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(40,24,16,0.88)'; c.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = 100 + 14 * Math.sin(a * 5) + 8 * Math.cos(a * 3); c.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } c.fill();
    c.fillStyle = '#ffffff'; for (const x of [96, 160]) { c.beginPath(); c.arc(x, 110, 16, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#111'; for (const x of [100, 164]) { c.beginPath(); c.arc(x, 112, 8, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#ffffff'; c.lineWidth = 9; c.beginPath(); c.arc(128, 150, 34, 0.15 * Math.PI, 0.7 * Math.PI); c.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; return m;
}
function makeSteam() {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05 + 0.02 * (i % 3), 8, 6), mat); g.add(s); }
  g.userData.update = (t) => g.children.forEach((s, i) => { const k = ((t * 0.6 + i / 6) % 1); s.position.set(0.04 * Math.sin(t * 3 + i), 0.05 + k * 0.5, 0.03 * Math.cos(t * 2 + i)); s.scale.setScalar(0.6 + k * 1.2); s.material.opacity = 0.5 * (1 - k); });
  return g;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
const facing = (obj) => V(Math.sin(obj.rotation.y), 0, Math.cos(obj.rotation.y));
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0;
  if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.22, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.8)', rot: -0.03, ...o, scale: Math.max(0.01, pop) });
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
const faceCam = (ch, d, side = 0, lift = 0, fov = 34, lookDown = 0) => { const f = humanFace(ch), fw = facing(ch.root), l = V(fw.z, 0, -fw.x); return { pos: f.clone().addScaledVector(fw, d).addScaledVector(l, side).add(up(lift)), look: f.clone().add(up(-lookDown)), fov }; };
const rockCam = (rk, d, side = 0, lift = 0.1, fov = 34, fw = V(0, 0, 1)) => { const c = rk.position.clone().add(up(0.13)); const l = V(fw.z, 0, -fw.x); return { pos: c.clone().addScaledVector(fw, d).addScaledVector(l, side).add(up(lift)), look: c, fov }; };
const babyCam = (B, fw, d = 1.5, side = 0, lift = 0.05, fov = 34) => { const f = humanFace(B), l = V(fw.z, 0, -fw.x); return { pos: f.clone().addScaledVector(fw, d).addScaledVector(l, side).add(up(lift)), look: f.clone().add(up(-0.12)), fov }; };
function leash(mesh, a, b) { const d = V().subVectors(b, a), L = d.length(); mesh.position.copy(a).addScaledVector(d, 0.5); mesh.scale.set(1, L, 1); mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); }
const iris = (ctx, t0, cy = 0.45) => { const k = clamp((ctx.t - t0) / 0.45, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); }); };

/** Gerald's bedroom: Gerald sitting up in bed, Keith on the pillow next to him, the rock shelf on the back wall. */
function bedroom(ctx, { lighting = 'night', keith = true } = {}) {
  const set = ctx.set; set.setLighting?.(lighting); set.set?.('window', 'party');
  set.root.updateMatrixWorld(true);
  const b = ctx.anchor('room.bed'), Fb = frame(rel(b), yawOf(b));      // mattress top centre, +z along the bed (foot end)
  const R = set.root;
  ctx.place('gerald', Fb(-0.22, -0.02, -0.45)); ctx.cast.gerald.root.rotation.set(0, Fb.yaw, 0);
  const P = ctx.props;
  ctx.add(P.shelf); P.shelf.position.copy(R.localToWorld(V(-0.4, 1.75, -1.95))); P.shelf.rotation.set(0, yawOf(R), 0);
  if (keith) { ctx.add(P.keith); P.keith.position.copy(Fb(0.25, 0.0, -0.55)); P.keith.rotation.set(0, Fb.yaw, 0); P.keith.scale.setScalar(1); }
  const camP = ctx.point('room.cam');
  const toCam = V(camP.x - Fb.origin.x, 0, camP.z - Fb.origin.z).normalize();
  return { Fb, R, toCam };
}
function sitInBed(ch, t, face = 'smile') { ch.pose('sit', t, { seated: true, seatHeight: 0.02, intensity: 0.2 }); ch.face(face, t); }

/** The pet show on the square stage.  S: stage frame (+z = audience). */
function petShow(ctx, { judges = true, crowd = true } = {}) {
  ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('standsCrowd', true); ctx.set.set?.('crowdMotion', 0.6);
  const S = frameAt(ctx, 'square.stage'), P = ctx.props;
  const st = { S, stands: [] };
  if (crowd) {
    const rows = ctx.anchor('square.standA.rows'); let k = 0;
    const ids = ['pigeon', ...EXTRA_IDS.slice(0, 12)];
    (rows || []).forEach((row) => { const w = row.userData?.width || 7.2, per = 7; for (let j = 0; j < per && k < ids.length; j++, k++) {
      const id = ids[k]; ctx.place(id, row, { offset: [(j - (per - 1) / 2) * (w / per), 0, 0] });
      if (id !== 'pigeon') ctx.cast[id].setAccessory?.('partyHat', true); st.stands.push({ ch: ctx.cast[id], phase: hash(k * 3.1) * 3, k }); } });
  }
  if (judges) {
    const ca = ctx.anchor('square.chairA'), cb = ctx.anchor('square.chairB');
    ctx.place('grandad', ca); ctx.place('heckler', cb);
    const tbl = rel(ctx.anchor('square.table'));
    ctx.place('marcus', tbl.clone()); ctx.cast.marcus.root.rotation.set(0, S.yaw + Math.PI / 2, 0);
  }
  // contestants along the stage front: cat on a plinth, toaster on a lead, cone on a lead, Gerald + Keith
  ctx.add(P.plinth8); P.plinth8.position.copy(S(-2.6, 0, 2.3)); P.plinth8.rotation.set(0, S.yaw, 0);
  ctx.place('cat', S(-2.6, 0.5, 2.3)); ctx.cast.cat.root.rotation.set(0, S.yaw, 0);
  ctx.place('x13', S(-1.5, 0, 2.0)); ctx.cast.x13.root.rotation.set(0, S.yaw, 0); ctx.cast.x13.setAccessory?.('cap', true);
  ctx.add(P.toaster8.root); P.toaster8.root.position.copy(S(-1.05, 0, 2.45)); P.toaster8.root.rotation.set(0, S.yaw, 0); P.toaster8.root.scale.setScalar(1.6);
  ctx.place('x14', S(1.4, 0, 2.0)); ctx.cast.x14.root.rotation.set(0, S.yaw, 0);
  ctx.add(P.cone8); P.cone8.position.copy(S(1.85, 0, 2.45)); P.cone8.rotation.set(0, S.yaw, 0); P.cone8.scale.setScalar(1);
  ctx.place('gerald', S(0.25, 0, 1.9)); ctx.cast.gerald.root.rotation.set(0, S.yaw, 0);
  ctx.add(P.keith); P.keith.position.copy(S(-0.2, 0, 2.5)); P.keith.rotation.set(0, S.yaw, 0); P.keith.scale.setScalar(1.25);
  P.keith.userData.show(['hat', 'glasses', 'mustache', 'bowtie', 'headphones', 'cardigan', 'tag']); P.keith.userData.acc.crack.setGrowth(0);
  P.keith.userData.topG.position.set(0, 0, 0); P.keith.userData.topG.rotation.set(0, 0, 0);
  for (const [l, hand, obj] of [[P.leash2, 'x13', P.toaster8.root], [P.leash3, 'x14', P.cone8]]) { ctx.add(l); st[`l_${hand}`] = { l, hand, obj }; }
  return st;
}
function showAnim(ctx, st, { mode = 'mixed' } = {}) {
  for (const c of st.stands) {
    if (c.ch.id === 'pigeon') { c.ch.pose('huss', 1.0); c.ch.face('smug', ctx.t); continue; }
    const a = mode === 'peer' ? 'peer' : mode === 'cheer' ? 'cheer' : mode === 'clap' ? 'clap' : (c.k % 2 ? 'cheer' : 'clap');
    c.ch.pose(a, ctx.t + c.phase); c.ch.face(mode === 'peer' ? 'shocked' : 'grin', ctx.t + c.phase);
  }
  const g = ctx.cast.grandad, h = ctx.cast.heckler, m = ctx.cast.marcus;
  if (g.root.parent) { g.pose('sit', ctx.t, { seated: true }); g.face('squint', ctx.t); h.pose('sit', ctx.t, { seated: true }); h.face('squint', ctx.t);
    m.pose('crowdSurf', ctx.t, { lift: 0.02, intensity: 0.1 }); m.joints.armL.rotation.set(0.05, 0, 0.12); m.joints.armR.rotation.set(0.05, 0, -0.12); m.face('neutral', ctx.t); }
  ctx.cast.cat.pose('loaf', ctx.t); ctx.cast.cat.face('smug', ctx.t);
  for (const id of ['x13', 'x14']) { const c = ctx.cast[id]; c.pose('idle', ctx.t, { intensity: 0.3 }); c.face('smile', ctx.t); }
  ctx.cast.gerald.pose('idle', ctx.t, { intensity: 0.3 }); ctx.cast.gerald.face('smile', ctx.t);
  for (const k of ['l_x13', 'l_x14']) { const L = st[k]; if (!L) continue; const ch = ctx.cast[L.hand]; ch.root.updateMatrixWorld(true); leash(L.l, ch.joints.handR.getWorldPosition(V()), L.obj.position.clone().add(up(0.15))); }
}
const showCams = (st) => ({
  wide: { pos: st.S(0, 2.2, 8.8), look: st.S(0, 1.0, 1.6), fov: 46 },
  keith: { pos: st.S(-0.15, 0.55, 4.0), look: st.S(-0.2, 0.25, 2.5), fov: 34 },
  judges: { pos: st.S(2.6, 1.8, 3.6), look: st.S(0, 1.0, 0.8), fov: 42 },
});

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody parties."  (the DJ decks are empty: "IN BED SINCE 7PM")
  {
    name: 'party crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 8, hats: true });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh');
      const d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store = { crowd, from: { pos: hi, look: c.clone().add(up(0.5)), fov: 50 }, to: { pos: c.clone().addScaledVector(d, 9).add(up(3.2)), look: ctx.point('street.crowdA').add(up(1.3)), fov: 42 } };
    },
    update(ctx, lt, u) { animateCrowd(ctx.store.crowd, ctx.t); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic); },
  },
  {
    name: 'empty decks', start: 1.35, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const F = frameAt(ctx, 'street.crowdB'), P = ctx.props;
      ctx.add(P.decks8.root); P.decks8.root.position.copy(F(0, 0, 2.4)); P.decks8.root.rotation.set(0, F.yaw, 0); P.decks8.setOn(true);
      ctx.add(P.bedSign); P.bedSign.position.copy(F(0.55, 0, 2.05)); P.bedSign.rotation.set(0, F.yaw, 0);
      const crowd = []; EXTRA_IDS.slice(0, 6).forEach((id, k) => { ctx.place(id, F((k % 2 ? 1 : -1) * (1.6 + 0.8 * Math.floor(k / 2)), 0, 3.8)); ctx.cast[id].root.rotation.set(0, F.yaw + Math.PI, 0); ctx.cast[id].setAccessory?.('partyHat', true); crowd.push({ ch: ctx.cast[id], phase: k * 0.4, k }); });
      ctx.store = { F, crowd };
    },
    update(ctx, lt) {
      const { F, crowd } = ctx.store; animateCrowd(crowd, ctx.t); ctx.props.decks8.update(ctx.t);
      ctx.cam.move({ pos: F(0.45, 1.7, 6.0), look: F(0.4, 1.0, 2.2), fov: 42 }, { pos: F(0.45, 1.6, 5.2), look: F(0.4, 1.0, 2.2), fov: 42 }, clamp(lt / 1.0, 0, 1));
    },
  },
  // ── b02 "Except me. I'm ninety one."
  {
    name: 'window push', start: 'b02-0.1', set: 'town',
    setup(ctx) { partyTown(ctx); const hs = (ctx.anchor('houses') || []).filter((h) => h.windows && h.windows.length); const w = hs.length ? hs[Math.min(7, hs.length - 1)].windows[0] : ctx.anchor('myHouse.window'); ctx.store = { W: frame(rel(w), yawOf(w)) }; },
    update(ctx, lt, u) { const W = ctx.store.W; ctx.cam.move({ pos: W(0, -0.8, 5), look: W(0, 0, 0), fov: 40 }, { pos: W(0, -0.2, 1.8), look: W(0, 0, 0), fov: 36 }, ease.inQuad(u)); },
  },
  {
    name: 'gerald in bed', start: 'b02.w1-0.05', set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); ctx.props.keith.userData.show([]); },
    update(ctx, lt) {
      const g = ctx.cast.gerald, { Fb, toCam } = ctx.store; sitInBed(g, ctx.t);
      const c = Fb(0, 0.6, -0.5);
      ctx.cam.move({ pos: c.clone().addScaledVector(toCam, 3.4).add(up(0.5)), look: c.clone().add(up(0.1)), fov: 42 }, { pos: c.clone().addScaledVector(toCam, 2.8).add(up(0.4)), look: c.clone().add(up(0.1)), fov: 40 }, clamp(lt / 1.5, 0, 1));
      tag(ctx, 'AGE: 91', ctx.markers.age, Infinity, { y: 0.18, size: 72 });
    },
  },
  // ── b03 HUSS ×6 — one accessory on Keith per HUSS
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `dress keith #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx) {
      const g = ctx.cast.gerald, K = ctx.props.keith, { Fb, toCam } = ctx.store, hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      const n = hits.filter((h) => h <= ctx.t).length;
      K.userData.show(['hat', 'glasses', 'mustache', 'bowtie', 'headphones', 'cardigan'].slice(0, n));
      g.pose('sitSlam', ctx.t, { hits, seated: true, seatHeight: 0.02, tableY: 0.05, slamTarget: K.position.clone().add(up(0.32)) }); g.face('huss', ctx.t);
      const h = lastBefore(hits, ctx.t); K.position.y = Fb(0, 0, 0).y + (h != null && ctx.t - h < 0.15 ? 0.03 * Math.sin(Math.PI * (ctx.t - h) / 0.15) : 0);
      if (i % 2 === 0) ctx.cam.set(rockCam(K, [1.25, 1.05, 0.9][i / 2], 0.15, 0.1, 32, toCam));
      else { const c = Fb(0, 0.6, -0.5); ctx.cam.set({ pos: c.clone().addScaledVector(toCam, 2.6).add(up(0.4)).addScaledVector(V(toCam.z, 0, -toCam.x), (i === 3 ? -0.6 : 0.6)), look: c, fov: 40 }); }
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b04 "The clock tower had a birthday. It won't say how old."
  {
    name: 'clock tower birthday', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false);
      const T = frameAt(ctx, 'clockTower'), P = ctx.props;
      ctx.add(P.towerHat); P.towerHat.position.copy(T(0, 14.0, 0)); P.towerHat.scale.setScalar(12); P.towerHat.rotation.set(0, 0, 0.12);
      const crowd = []; EXTRA_IDS.slice(0, 8).forEach((id, k) => { ctx.place(id, T(-2.4 + (k % 4) * 1.6, 0, 3.4 + Math.floor(k / 4) * 1.2)); ctx.cast[id].root.rotation.set(0, T.yaw + Math.PI, 0); ctx.cast[id].setAccessory?.('partyHat', true); crowd.push({ ch: ctx.cast[id], phase: k * 0.3, k }); });
      ctx.store = { T, crowd };
    },
    update(ctx, lt) {
      const { T, crowd } = ctx.store; crowd.forEach((c) => { c.ch.pose('cheer', ctx.t + c.phase); c.ch.face('grin', ctx.t); });
      const to = ctx.markers.old;
      if (ctx.t < to) ctx.cam.set({ pos: T(1.0, 1.6, 15), look: T(0, 8.5, 0), fov: 52 });
      else ctx.cam.move({ pos: T(1.0, 1.6, 15), look: T(0, 8.5, 0), fov: 52 }, { pos: T(0.4, 9, 7), look: T(0, 12, 0), fov: 46 }, clamp((ctx.t - to) / 0.5, 0, 1), ease.outCubic);
      tag(ctx, 'AGE: ???', to + 0.2, Infinity, { y: 0.2, size: 80 });
    },
  },
  // ── b05 "While they're out partying, by the way, I'm raising a rock. We play fetch. I fetch."
  {
    name: 'walking keith', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false }); ctx.set.setLighting?.('dusk');
      const F = frameAt(ctx, 'street.center'), P = ctx.props;
      ctx.place('gerald', F(0, 0, 0)); ctx.add(P.keith); P.keith.userData.show(['hat', 'glasses', 'mustache', 'bowtie', 'headphones', 'cardigan']); P.keith.scale.setScalar(1); ctx.add(P.leash);
      const crowd = []; EXTRA_IDS.slice(0, 8).forEach((id, k) => { ctx.place(id, F(-(2.0 + 0.6 * (k % 3)), 0, -2 + k * 1.1)); ctx.cast[id].setAccessory?.('partyHat', true); crowd.push({ ch: ctx.cast[id], phase: k * 0.3, k }); });
      ctx.store = { F, crowd };
    },
    update(ctx) {
      const { F, crowd } = ctx.store, g = ctx.cast.gerald, K = ctx.props.keith;
      animateCrowd(crowd, ctx.t);
      const s = (ctx.t - ctx.time('b05')) * WALK_SPEED * 0.45;
      g.root.position.copy(F(0, 0, s)); g.root.rotation.set(0, F.yaw, 0); g.pose('walk', ctx.t, { speed: 0.45 }); g.face('smile', ctx.t);
      K.position.copy(F(0.15, 0, s - 1.1)); K.rotation.set(0, F.yaw + Math.sin(ctx.t * 9) * 0.08, 0);
      g.root.updateMatrixWorld(true); leash(ctx.props.leash, g.joints.handL.getWorldPosition(V()), K.position.clone().add(up(0.2)));
      ctx.cam.set({ pos: F(2.4, 1.2, s + 1.6), look: F(0, 0.6, s - 0.5), fov: 44 });
    },
  },
  {
    name: 'fetch', start: 'fetch-0.1', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', false);
      const tp = ctx.point('park.table'), pc = ctx.point('park.cam');
      const F = frame(tp.clone().setY(0), Math.atan2(pc.x - tp.x, pc.z - tp.z)), P = ctx.props;
      ctx.place('gerald', F(0.4, 0, 1.6)); ctx.cast.gerald.root.rotation.set(0, F.yaw + Math.PI * 0.85, 0);
      ctx.add(P.keith); P.keith.userData.show(['hat', 'glasses', 'mustache', 'bowtie', 'headphones', 'cardigan']); P.keith.position.copy(F(-0.4, 0, 1.9)); P.keith.rotation.set(0, F.yaw, 0); P.keith.scale.setScalar(1);
      ctx.add(P.stick); ctx.store = { F };
    },
    update(ctx) {
      const { F } = ctx.store, g = ctx.cast.gerald, P = ctx.props, ti = ctx.markers.ifetch;
      if (ctx.t < ti) {
        g.pose('slam', ctx.t, { hits: [ctx.markers.fetch + 0.25] }); g.face('grin', ctx.t);
        const k = clamp((ctx.t - (ctx.markers.fetch + 0.25)) / 0.6, 0, 1);
        g.root.updateMatrixWorld(true); const hp = g.joints.handR.getWorldPosition(V());
        P.stick.position.copy(k > 0 ? hp.clone().lerp(F(0.4, 3.0, -6), k) : hp); P.stick.rotation.set(k * 9, 0, k * 5);
        ctx.cam.set({ pos: F(0, 1.4, 4.6), look: F(0, 0.7, 1.5), fov: 44 });
      } else {
        const k = clamp((ctx.t - ti) / 0.9, 0, 1);
        g.root.position.copy(F(0.4, 0, -2.5 + 4.1 * k)); g.root.rotation.set(0, F.yaw, 0); g.pose('walk', ctx.t, { speed: 0.6 }); g.face('sweat', ctx.t);
        g.root.updateMatrixWorld(true); P.stick.position.copy(g.joints.handR.getWorldPosition(V())); P.stick.rotation.set(0, F.yaw, 0);
        ctx.cam.set({ pos: F(0.2, 1.3, 4.4), look: F(0, 0.8, 0.6), fov: 44 });
      }
    },
  },
  // ── b06 "This is Keith. I taught him to sit. He was already sitting."
  {
    name: 'good boy', start: 'b06-0.1', set: 'room',
    setup(ctx) {
      const st = ctx.store = bedroom(ctx, { lighting: 'day', keith: false });
      const P = ctx.props, R = st.R;
      ctx.add(P.keith); P.keith.position.copy(R.localToWorld(V(0.2, 0, 0.4))); P.keith.rotation.set(0, yawOf(R), 0); P.keith.scale.setScalar(1.2);
      P.keith.userData.show(['hat', 'glasses', 'mustache', 'bowtie', 'headphones', 'cardigan', 'tag']);
      ctx.place('gerald', R.localToWorld(V(-0.55, 0, 0.1))); ctx.cast.gerald.root.rotation.set(0, yawOf(R) + 1.1, 0);
      ctx.add(P.biscuit);
    },
    update(ctx) {
      const g = ctx.cast.gerald, K = ctx.props.keith, M = ctx.markers, { R } = ctx.store;
      const sitPhase = ctx.t > M.sit - 0.1 && ctx.t < M.already;
      if (sitPhase) g.pose('point', ctx.t); else if (ctx.t > M.already) g.pose('clap', ctx.t); else g.pose('idle', ctx.t);
      g.face(ctx.t > M.already ? 'grin' : 'smile', ctx.t);
      ctx.props.biscuit.visible = ctx.t > M.already + 0.2; ctx.props.biscuit.position.copy(K.position).add(up(0.37));
      ctx.cam.set({ pos: R.localToWorld(V(-0.05, 1.45, 3.3)), look: R.localToWorld(V(-0.15, 0.75, 0.25)), fov: 42 });
      tag(ctx, 'SIT', M.sit, M.already, { y: 0.2, size: 90 });
      tag(ctx, 'GOOD BOY', M.already + 0.1, Infinity, { y: 0.2, size: 90, bg: 'rgba(20,130,60,0.92)' });
    },
  },
  // ── b07 "Then came the Summer Party Pet Show."
  {
    name: 'pet show', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      ctx.store = petShow(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1'), d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      ctx.store.from = { pos: c.clone().addScaledVector(d, 22).add(up(10)), look: c.clone().add(up(2)), fov: 44 };
      ctx.store.to = showCams(ctx.store).wide;
    },
    update(ctx, lt, u) { const st = ctx.store; showAnim(ctx, st); ctx.cam.move(st.from, st.to, u, ease.inOutCubic); },
  },
  // ── b08 "A toaster made toast. Total show off."
  {
    name: 'show off', start: 'b08-0.1', set: 'town',
    setup(ctx) { ctx.store = petShow(ctx); },
    update(ctx) {
      const st = ctx.store, T = ctx.props.toaster8, M = ctx.markers; showAnim(ctx, st);
      const k = ctx.t - M.toast;
      T.setLever(k > 0 ? 1 : 0); T.toast.position.y = T.toastRestY + (k > 0 ? Math.min(0.35, 2.4 * k - 3 * k * k) : 0);
      if (ctx.t < M.showoff - 0.05) ctx.cam.set({ pos: st.S(-1.05, 0.8, 4.0), look: st.S(-1.05, 0.45, 2.45), fov: 36 });
      else ctx.cam.set(showCams(st).judges);
      if (ctx.t > M.showoff) ctx.fx.text('2     2     2', { x: 0.5, y: 0.34, size: 120, fill: '#ffffff', stroke: '#000', bg: 'rgba(200,0,40,0.85)', rot: 0 });
      tag(ctx, 'SHOW-OFF', M.showoff + 0.1, Infinity, { y: 0.18, size: 80 });
    },
  },
  // ── b09 "Keith's trick was staying."
  {
    name: 'trick: staying', start: 'b09-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = petShow(ctx); const P = ctx.props; ctx.add(P.spot); P.spot.position.copy(P.keith.position).add(up(2)); },
    update(ctx, lt) {
      const st = ctx.store; showAnim(ctx, st, { mode: 'peer' });
      ctx.fx.vignette(0.6);
      ctx.cam.move(showCams(st).keith, { pos: st.S(-0.15, 0.45, 3.4), look: st.S(-0.2, 0.25, 2.5), fov: 34 }, clamp(lt / 1.2, 0, 1));
      tag(ctx, 'TRICK: STAYING', ctx.time('b09') + 0.4, Infinity, { y: 0.18 });
    },
  },
  // ── b10 HUSS ×3 — confetti cannon, a balloon pops, the Heckler yells; Keith doesn't move
  ...[0, 1, 2].map((i) => ({
    name: `distractions #${i + 1}`, start: i === 0 ? 'b10.h0-0.12' : `b10.h${i}-0.03`, set: 'town',
    setup(ctx) {
      const st = ctx.store = petShow(ctx, { judges: i !== 2 });
      const P = ctx.props;
      if (i === 0) { const cf = P.confetti; ctx.add(cf.root); cf.root.position.copy(P.keith.position).add(V(0.6, 0.4, 0)); }
      if (i === 1) { ctx.add(P.balloon8); P.balloon8.position.copy(st.S(0.25, 0, 2.5)); }
      if (i === 2) { ctx.place('heckler', st.S(-0.2, 0, 3.1)); ctx.cast.heckler.root.rotation.set(0, st.S.yaw + Math.PI, 0); }
    },
    update(ctx) {
      const st = ctx.store, P = ctx.props, hits = ctx.hussTimes('b10').map((h) => h + 0.03); showAnim(ctx, st, { mode: 'peer' });
      const h = hits[i];
      if (i === 0) P.confetti.update(ctx.t - h);
      if (i === 1) P.balloon8.visible = ctx.t < h;
      if (i === 2) { const he = ctx.cast.heckler; he.pose('pointLaugh', ctx.t); he.face('laugh', ctx.t); }
      ctx.cam.set(i === 2 ? { pos: st.S(1.2, 1.0, 3.6), look: st.S(-0.2, 0.6, 2.8), fov: 42 } : showCams(st).keith);
      ctx.cam.punch(hits, ctx.t, 0.12, 0.2); ctx.cam.shake(0.12, ctx.t, 20 + i);
      if (i === 1 && ctx.t > h && ctx.t < h + 0.25) tag(ctx, 'POP!', h, h + 0.3, { y: 0.3, size: 110, bg: null, fill: '#ffe14a' });
    },
  })),
  // ── b11 quote: "True friends never leave." — a stain
  {
    name: 'stain card', start: 'b11-0.1', set: 'town',
    setup(ctx) { ctx.store = petShow(ctx); },
    update(ctx) {
      const st = ctx.store; showAnim(ctx, st, { mode: 'peer' }); ctx.cam.set(showCams(st).keith);
      quoteCard(ctx, 'True friends never leave.', null, ctx.markers.quote1, ctx.markers.quote1end + 0.05, { y: 0.32 });
    },
  },
  {
    name: 'the stain', start: 'quote1end+0.05', set: 'town',
    setup(ctx) { const st = ctx.store = petShow(ctx); const s = ctx.props.stain; ctx.add(s); s.position.copy(st.S(-0.75, 0.006, 2.7)); s.rotation.set(-Math.PI / 2, 0, st.S.yaw); },
    update(ctx, lt) {
      const st = ctx.store; showAnim(ctx, st);
      ctx.cam.move({ pos: st.S(-0.5, 0.75, 4.3), look: st.S(-0.5, 0.15, 2.6), fov: 38 }, { pos: st.S(-0.5, 0.65, 3.9), look: st.S(-0.5, 0.12, 2.6), fov: 38 }, clamp(lt / 1.2, 0, 1));
      tag(ctx, 'A STAIN', ctx.time('b11.w4'), Infinity, { y: 0.2 });
    },
  },
  // ── b12 "Top ten respectful moments. Number seven: Keith let the cone go first."
  {
    name: 'after you', start: 'b12-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = petShow(ctx); const P = ctx.props; P.cone8.position.copy(st.S(0.35, 0, 3.0)); P.keith.position.copy(st.S(-0.2, 0, 3.0)); },
    update(ctx) {
      const st = ctx.store, P = ctx.props, tc = ctx.markers.cone; showAnim(ctx, st, { mode: ctx.t > tc + 0.6 ? 'clap' : 'mixed' });
      const k = clamp((ctx.t - tc) / 0.7, 0, 1);
      P.cone8.position.copy(st.S(0.35, -0.8 * Math.max(0, k - 0.45) / 0.55 * (k > 0.45 ? 1 : 0), 3.0 + 0.6 * k)); P.cone8.rotation.set(0, st.S.yaw, k > 0.45 ? (k - 0.45) * 2 : 0);
      ctx.cam.set({ pos: st.S(0.9, 0.7, 5.2), look: st.S(0.05, 0.3, 3.0), fov: 38 });
      top10Card(ctx, 7, ctx.time('b12') + 0.05, Infinity, { popAt: ctx.markers.top7 });
      tag(ctx, 'AFTER YOU', tc + 0.25, Infinity, { y: 0.4, size: 70 });
    },
  },
  // ── b13 "Keith won. Then he got warm."
  {
    name: 'keith won', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = petShow(ctx);
      const P = ctx.props, cf = P.confetti; ctx.add(cf.root); cf.root.position.copy(st.S(0, 3.0, 2.4));
      ctx.add(P.trophy8); P.trophy8.position.copy(st.S(0.6, 0, 2.5)); P.trophy8.scale.setScalar(1.8);
      ctx.add(P.steam); ctx.add(P.drop8, ctx.cast.gerald.joints.head); P.drop8.position.set(0.25, 0.5, 0.3);
    },
    update(ctx) {
      const st = ctx.store, P = ctx.props, g = ctx.cast.gerald, M = ctx.markers; showAnim(ctx, st, { mode: 'cheer' });
      P.confetti.update(ctx.t - M.won);
      const holding = ctx.t > M.won + 0.3;
      if (holding) { g.pose('crossArms', ctx.t); g.root.updateMatrixWorld(true); P.keith.position.copy(g.joints.torso.localToWorld(V(0, 0.15, 0.3))); P.keith.scale.setScalar(1.1); }
      g.face(ctx.t > M.warm ? 'shocked' : 'smile', ctx.t);
      P.steam.visible = ctx.t > M.warm; P.steam.position.copy(P.keith.position).add(up(0.25)); P.steam.userData.update(ctx.t);
      P.drop8.visible = ctx.t > M.warm + 0.2;
      ctx.cam.set(ctx.t < M.warm - 0.1 ? showCams(st).wide : faceCam(g, 2.2, 0.3, -0.25, 38, 0.3));
    },
  },
  // ── b14 "Then he cracked."  (silence)
  {
    name: 'he cracked', start: 'b14-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = petShow(ctx); ctx.set.set?.('crowdMotion', 0); const K = ctx.props.keith; K.position.copy(st.S(-0.2, 0, 2.6)); },
    update(ctx) {
      const st = ctx.store, K = ctx.props.keith; showAnim(ctx, st, { mode: 'peer' });
      K.userData.acc.crack.setGrowth(ctx.t < ctx.markers.crack ? 0 : clamp((ctx.t - ctx.markers.crack) / 0.25, 0, 1) * 0.6);
      ctx.cam.set(rockCam(K, 1.1, 0.1, 0.05, 32, st.S.fwd));
    },
  },
  // ── b15 HUSS ×6 — it hatches: crack, wobble, the top flies off, a tiny Gerald pops out
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `hatch #${i + 1}`, start: i === 0 ? 'b15.h0-0.12' : `b15.h${i}-0.03`, set: 'town',
    setup(ctx) { const st = ctx.store = petShow(ctx); const K = ctx.props.keith; K.position.copy(st.S(-0.2, 0, 2.6)); ctx.place('babygerald', K.position.clone()); ctx.cast.babygerald.root.rotation.set(0, st.S.yaw, 0); },
    update(ctx) {
      const st = ctx.store, K = ctx.props.keith, B = ctx.cast.babygerald, hits = ctx.hussTimes('b15').map((h) => h + 0.03);
      showAnim(ctx, st, { mode: 'peer' });
      const n = hits.filter((h) => h <= ctx.t).length, h = lastBefore(hits, ctx.t), dh = h != null ? ctx.t - h : 9;
      K.userData.acc.crack.setGrowth(Math.min(1, 0.6 + 0.2 * n));
      K.userData.g.rotation.z = n === 2 && dh < 0.35 ? 0.15 * Math.sin(dh * 40) : 0;
      const flown = n >= 3 ? clamp((ctx.t - hits[2]) / 0.6, 0, 1) : 0;
      K.userData.topG.position.set(0.4 * flown, 0.9 * Math.sin(Math.PI * Math.min(flown, 0.5) * 2) * (flown < 0.5 ? 1 : 0) + (flown >= 0.5 ? 0.45 - 0.9 * (flown - 0.5) : 0), 0);
      K.userData.topG.rotation.set(0, 0, flown * 4);
      K.userData.topG.visible = flown < 1;
      const out = n >= 4 ? clamp((ctx.t - hits[3]) / 0.25, 0, 1) : 0;
      B.root.visible = out > 0;
      B.root.position.copy(K.position).add(up(-0.4 + 0.42 * ease.outBack(out)));
      if (n >= 6) { B.pose('slam', ctx.t, { hits: [hits[5]] }); B.face('huss', ctx.t); } else { B.pose(n >= 5 ? 'cheer' : 'idle', ctx.t); B.face(n >= 5 ? 'huss' : 'shocked', ctx.t); }
      ctx.cam.set(i < 3 ? rockCam(K, [1.2, 1.05, 1.6][i], [0.1, -0.15, 0.2][i], [0.05, 0.05, 0.3][i], 34, st.S.fwd) : babyCam(B, st.S.fwd, [1.7, 1.45, 1.25][i - 3], [0.15, -0.2, 0][i - 3], 0.05, 34));
      ctx.cam.punch(hits, ctx.t, 0.12, 0.2); ctx.cam.shake(0.1, ctx.t, 40 + i);
    },
  })),
  // ── b16 "It was a baby. It was already ninety one."  /  b17 baby: "Turn that down."
  {
    name: 'already 91', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = petShow(ctx); const K = ctx.props.keith; K.position.copy(st.S(-0.2, 0, 2.6)); K.userData.topG.visible = false;
      ctx.place('babygerald', K.position.clone().add(up(0.02))); ctx.cast.babygerald.root.rotation.set(0, st.S.yaw, 0);
    },
    update(ctx, lt) {
      const st = ctx.store, B = ctx.cast.babygerald, K = ctx.props.keith; showAnim(ctx, st, { mode: 'peer' });
      K.userData.topG.visible = false; K.userData.acc.crack.setGrowth(1);
      B.pose('idle', ctx.t, { intensity: 0.4 }); B.face('squint', ctx.t);
      ctx.cam.move(babyCam(B, st.S.fwd, 1.8, 0.1), babyCam(B, st.S.fwd, 1.45, 0.05), clamp(lt / 1.6, 0, 1));
      tag(ctx, 'AGE: 91', ctx.markers.age91, Infinity, { y: 0.2, size: 80 });
    },
  },
  {
    name: 'turn that down', start: 'b17-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = petShow(ctx); const K = ctx.props.keith; K.position.copy(st.S(-0.2, 0, 2.6)); K.userData.topG.visible = false;
      ctx.place('babygerald', K.position.clone().add(up(0.02))); ctx.cast.babygerald.root.rotation.set(0, st.S.yaw + 0.5, 0);
    },
    update(ctx) {
      const st = ctx.store, B = ctx.cast.babygerald, K = ctx.props.keith; showAnim(ctx, st, { mode: 'peer' });
      K.userData.topG.visible = false; K.userData.acc.crack.setGrowth(1);
      B.pose('point', ctx.t); B.face('squint', ctx.t);
      ctx.cam.set(babyCam(B, st.S.fwd, 1.5, -0.25));
      if (ctx.t > ctx.markers.scratch - 0.05) ctx.fx.text('*RECORD SCRATCH*', { y: 0.2, size: 60, fill: '#ffffff', stroke: '#000', bg: 'rgba(0,0,0,0.75)', rot: -0.04 });
    },
  },
  // ── b18 quote: "Every rock is an egg with patience." … — my mother, a boulder
  {
    name: 'egg card', start: 'b18-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = petShow(ctx); const K = ctx.props.keith; K.position.copy(st.S(-0.2, 0, 2.6)); K.userData.topG.visible = false; ctx.place('babygerald', K.position.clone().add(up(0.02))); ctx.cast.babygerald.root.rotation.set(0, st.S.yaw, 0); ctx.set.set?.('crowdMotion', 0); },
    update(ctx) {
      const st = ctx.store, B = ctx.cast.babygerald, K = ctx.props.keith; showAnim(ctx, st, { mode: 'peer' }); K.userData.topG.visible = false; K.userData.acc.crack.setGrowth(1);
      B.pose('crossArms', ctx.t); B.face('smug', ctx.t);
      ctx.cam.set(babyCam(B, st.S.fwd, 1.6, 0.1));
      quoteCard(ctx, 'Every rock is an egg with patience.', null, ctx.markers.quote2, ctx.markers.quote2end + 0.05, { y: 0.32 });
    },
  },
  {
    name: 'mother boulder', start: 'quote2end+0.05', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', false);
      const tr = ctx.point('park.tree'), pc = ctx.point('park.cam');
      const F = frame(tr.clone().setY(0).lerp(pc.clone().setY(0), 0.25), Math.atan2(pc.x - tr.x, pc.z - tr.z));
      const m = ctx.props.mum; ctx.add(m); m.position.copy(F(0, 0, 0)); m.rotation.set(0, F.yaw, 0);
      ctx.store = { F };
    },
    update(ctx, lt) {
      const { F } = ctx.store, m = ctx.props.mum;
      m.rotation.set(0.06 * Math.sin(ctx.t * 2.2), F.yaw, 0);
      ctx.cam.move({ pos: F(0.3, 1.4, 4.6), look: F(0, 0.9, 0), fov: 42 }, { pos: F(0.25, 1.3, 3.8), look: F(0, 0.95, 0), fov: 42 }, clamp(lt / 1.6, 0, 1));
      tag(ctx, 'MY MOTHER', ctx.time('b18.w7'), ctx.markers.boulder, { y: 0.2 });
      tag(ctx, 'A BOULDER', ctx.markers.boulder, Infinity, { y: 0.2 });
    },
  },
  // ── b19 "Now in this town, everybody parties. Except us."  /  b20 "Also, I collect rocks."
  {
    name: 'except us', start: 'b19-0.1', set: 'room',
    setup(ctx) {
      const st = ctx.store = bedroom(ctx, { keith: false });
      ctx.place('babygerald', st.Fb(0.28, 0.0, -0.5)); ctx.cast.babygerald.root.rotation.set(0, st.Fb.yaw, 0);
    },
    update(ctx, lt) {
      const g = ctx.cast.gerald, B = ctx.cast.babygerald, { Fb, toCam } = ctx.store;
      sitInBed(g, ctx.t); sitInBed(B, ctx.t + 1, 'smug');
      const c = Fb(0, 0.55, -0.5);
      if (ctx.t < ctx.markers.exceptUs - 0.1) ctx.cam.set({ pos: c.clone().addScaledVector(toCam, 3.4).add(up(0.5)), look: c.clone().add(up(0.1)), fov: 42 });
      else ctx.cam.set({ pos: c.clone().addScaledVector(toCam, 2.4).add(up(0.3)), look: c.clone().add(up(0.05)), fov: 40 });
    },
  },
  {
    name: 'i collect rocks', start: 'b20-0.1', set: 'room',
    setup(ctx) {
      const st = ctx.store = bedroom(ctx, { keith: false });
      ctx.place('babygerald', st.Fb(0.28, 0.0, -0.5)); ctx.cast.babygerald.root.rotation.set(0, st.Fb.yaw, 0);
    },
    update(ctx, lt) {
      const g = ctx.cast.gerald, B = ctx.cast.babygerald, { Fb, toCam } = ctx.store, P = ctx.props;
      sitInBed(g, ctx.t); sitInBed(B, ctx.t + 1, 'shocked');
      const sh = P.shelf.position.clone();
      const c = Fb(0, 0.55, -0.5);
      ctx.cam.move({ pos: c.clone().addScaledVector(toCam, 2.4).add(up(0.3)), look: c.clone().add(up(0.05)), fov: 40 }, { pos: sh.clone().add(V(0, -0.1, 0)).addScaledVector(V(Math.sin(yawOf(P.shelf)), 0, Math.cos(yawOf(P.shelf))), 2.6), look: sh, fov: 40 }, clamp((ctx.t - ctx.markers.rocks + 0.3) / 0.6, 0, 1), ease.inOutCubic);
    },
  },
  // ── b21 HUSS ×3 — the shelf hatches: three tiny Geralds per HUSS
  {
    name: 'the shelf hatches', start: 'b21.h0-0.12', set: 'room',
    setup(ctx) {
      const st = ctx.store = bedroom(ctx, { keith: false });
      const sh = ctx.props.shelf; sh.updateMatrixWorld(true);
      sh.userData.rocks.forEach((rk, i) => { const id = `bg${i}`; const p = rk.getWorldPosition(V()); ctx.place(id, p); ctx.cast[id].root.rotation.set(0, yawOf(sh) + (hash(i) - 0.5) * 0.6, 0); });
    },
    update(ctx) {
      const sh = ctx.props.shelf, hits = ctx.hussTimes('b21').map((h) => h + 0.03), n = hits.filter((h) => h <= ctx.t).length;
      sh.userData.rocks.forEach((rk, i) => {
        const wave = Math.floor(i / 3), on = wave < n, ch = ctx.cast[`bg${i}`];
        rk.visible = !on; ch.root.visible = on;
        if (on) { const dt = ctx.t - hits[wave]; ch.pose(dt < 0.4 ? 'cheer' : 'slam', ctx.t + i * 0.13, dt < 0.4 ? {} : { hits: hits.slice(wave) }); ch.face('huss', ctx.t + i); }
      });
      const sp = sh.position.clone(), f = V(Math.sin(yawOf(sh)), 0, Math.cos(yawOf(sh)));
      ctx.cam.set({ pos: sp.clone().addScaledVector(f, 2.2).add(up(-0.05)), look: sp.clone().add(up(0.1)), fov: 40 });
      ctx.cam.punch(hits, ctx.t, 0.12, 0.2); ctx.cam.shake(0.1, ctx.t, 70);
      iris(ctx, ctx.time('b21.end') + 0.6, 0.4);
    },
  },
];
