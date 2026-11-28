// In This Town — Episode 10: "Snooze".  Gerald (DJ Hip Replacement, 91) has snoozed Saturday since 1982.
// Film contract: SPEC.md §8.  Timeline: episodes/ep10/timeline.json (audio/build_episode.py ep10).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { WALK_SPEED } from '../characters.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, ease, hash, lerp, canvasTexture } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { makeBalloon } from '../props.js';
import { init as initEp1, V, frame, frameAt, lastBefore, partyTown } from '../shots.js';
import { makeCrack } from '../ep3/props3.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const GSKIN = '#e9b99a';
export const cast = {
  gerald: { id: 'gerald', skin: GSKIN, hair: { style: 'bald', color: GSKIN }, top: { style: 'cardigan', color: '#3ee0c8', accent: '#ffffff' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#4a3b2f', accessories: ['glasses', 'mustache'], scale: 0.92 },
  pigeon: MAIN.pigeon, grandad: MAIN.grandad,
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 10, banner: ['FRIDAY NIGHT', 'PARTY', '14.05.1982'] }),
  room: () => buildRoom({ variant: 'grandad', window: 'party' }),
};

const txt = (w, h, draw) => canvasTexture(w, h, draw);
function label(lines, { w = 512, h = 256, bg = '#fff4e0', fg = '#1d1d22', font = 'Nunito', size = 80, border = '#1d1d22' } = {}) {
  return txt(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.strokeStyle = border; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, i) => { const s = typeof l === 'string' ? size : l.size; const t = typeof l === 'string' ? l : l.t; g.font = `900 ${s}px "${font}", "DejaVu Sans", sans-serif`; g.fillText(t, w / 2, h * (i + 0.5) / lines.length + 4); });
  });
}
function plane(w, h, tex, basic = false) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic ? new THREE.MeshBasicMaterial({ map: tex, transparent: true }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: true })); }
function boxM(w, h, d, c, extra = {}) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...extra })); m.castShadow = true; return m; }

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.clock = makeAlarmClock();
  P.stand = boxM(0.45, 0.5, 0.4, '#7d5232'); P.stand.geometry.translate(0, 0.25, 0);
  P.sun = makeOrb('#ffcf3a', '#ff9a1a', 'sun'); P.moon = makeOrb('#eef0ff', '#9aa0c8', 'moon');
  P.calendar = makeCalendar();
  P.skyCrack = makeCrack({ w: 1.2, h: 1.0, seed: 11, res: 1024, width: 1.4, color: '#fff6c8' });
  P.roomCrack = makeCrack({ w: 1.2, h: 1.0, seed: 4, res: 1024, width: 1.2, color: '#fff6c8' });
  P.balloon10 = makeBalloon('#ff4fa3', { string: 0.6 }); P.cactus = makeCactus();
  P.satPage = makeSaturday(); P.bench = makeBench();
  P.apptCard = plane(0.3, 0.2, label(['SATURDAY 9AM', { t: 'HIP REPLACEMENT', size: 40 }], { size: 52 }));
  P.sticky = plane(0.3, 0.3, label(['DJ', { t: 'HIP', size: 90 }, { t: 'REPLACEMENT', size: 40 }], { w: 384, h: 384, bg: '#fff07a', border: null, size: 96 }));
  P.sticky2 = plane(0.3, 0.3, label([{ t: "DON'T", size: 70 }, { t: 'FORGET:', size: 64 }, { t: 'HIP', size: 90 }, { t: 'REPLACEMENT', size: 40 }], { w: 384, h: 384, bg: '#fff07a', border: null }));
  P.pigeonButton = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.025, 16), new THREE.MeshStandardMaterial({ color: '#e8232b', emissive: '#550000' }));
}
function makeAlarmClock() {
  const g = new THREE.Group();
  const body = boxM(0.34, 0.2, 0.14, '#c0392b'); body.position.y = 0.1; g.add(body);
  const faces = { fri: label(['FRI 23:59'], { w: 512, h: 256, bg: '#0d0f14', fg: '#ff3b30', border: null, size: 92 }), sat: label(['SAT 00:00'], { w: 512, h: 256, bg: '#0d0f14', fg: '#3cff6b', border: null, size: 92 }) };
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.12), new THREE.MeshBasicMaterial({ map: faces.fri })); face.position.set(0, 0.105, 0.071); g.add(face);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 20), new THREE.MeshStandardMaterial({ color: '#ffd23f' })); btn.position.y = 0.22; g.add(btn);
  const lbl = plane(0.1, 0.03, label(['SNOOZE'], { w: 256, h: 80, bg: '#ffd23f', border: null, size: 54 })); lbl.position.set(0, 0.215, 0.072); g.add(lbl);
  for (const s of [-1, 1]) { const bell = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#d9d9e0', metalness: 0.6, roughness: 0.3 })); bell.position.set(s * 0.12, 0.2, 0); g.add(bell); }
  g.userData = { face, faces, btn, set(day, press = 0, ring = 0, t = 0) { face.material.map = faces[day]; btn.position.y = 0.22 - 0.025 * press; g.rotation.z = ring ? 0.06 * Math.sin(t * 60) : 0; } };
  return g;
}
export function makeOrb(c1, c2, kind) {
  const mk = (mood) => txt(512, 512, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 250); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a1a10';
    if (mood === 'tired') { g.lineWidth = 16; g.strokeStyle = '#2a1a10'; for (const x of [190, 322]) { g.beginPath(); g.arc(x, 236, 34, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); } g.beginPath(); g.arc(256, 350, 40, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
    else if (mood === 'angry') { for (const x of [190, 322]) { g.beginPath(); g.arc(x, 250, 26, 0, Math.PI * 2); g.fill(); } g.lineWidth = 18; g.strokeStyle = '#2a1a10'; g.beginPath(); g.moveTo(150, 190); g.lineTo(230, 220); g.moveTo(362, 190); g.lineTo(282, 220); g.stroke(); g.beginPath(); g.moveTo(200, 360); g.lineTo(312, 360); g.stroke(); }
    else { for (const x of [190, 322]) { g.beginPath(); g.arc(x, 236, 26, 0, Math.PI * 2); g.fill(); } g.lineWidth = 16; g.strokeStyle = '#2a1a10'; g.beginPath(); g.arc(256, 300, 70, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); g.fillStyle = 'rgba(255,90,90,0.5)'; for (const x of [150, 362]) { g.beginPath(); g.arc(x, 310, 30, 0, Math.PI * 2); g.fill(); } }
  });
  const moods = { happy: mk('happy'), tired: mk('tired'), angry: mk('angry') };
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), new THREE.MeshBasicMaterial({ map: moods.happy }));
  m.rotation.y = -Math.PI / 2;
  const g = new THREE.Group(); g.add(m);
  if (kind === 'sun') for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 6), new THREE.MeshBasicMaterial({ color: '#ffd23f' })); const a = i / 12 * Math.PI * 2; r.position.set(Math.cos(a) * 0.68, Math.sin(a) * 0.68, 0); r.rotation.z = a - Math.PI / 2; g.add(r); }
  g.userData = { mood(k) { m.material.map = moods[k]; } };
  return g;
}
function makeCalendar() {
  const g = new THREE.Group();
  const back = plane(0.42, 0.52, label(['FRIDAY', { t: '14', size: 160 }, { t: 'MAY 1982', size: 54 }], { w: 420, h: 520, size: 70 })); back.position.z = 0.002; g.add(back);
  const pivot = new THREE.Group(); pivot.position.y = 0.26; g.add(pivot);
  const page = plane(0.42, 0.52, label(['SATURDAY', { t: '15', size: 160 }, { t: 'MAY 1982', size: 54 }], { w: 420, h: 520, size: 62, bg: '#ffe9ec' })); page.position.set(0, -0.26, 0.006); pivot.add(page);
  page.material.side = THREE.DoubleSide;
  g.userData = { flip(k) { pivot.rotation.x = -Math.PI * 0.95 * ease.inOutCubic(clamp(k, 0, 1)); } };
  return g;
}
function makeCactus() {
  const g = new THREE.Group(), gr = '#3c8f45';
  const pot = boxM(0.22, 0.18, 0.22, '#c0603a'); pot.position.y = 0.09; g.add(pot);
  const trunk = boxM(0.12, 0.5, 0.12, gr); trunk.position.y = 0.43; g.add(trunk);
  for (const [x, y] of [[-0.11, 0.42], [0.11, 0.52]]) { const a = boxM(0.08, 0.2, 0.08, gr); a.position.set(x, y, 0); g.add(a); }
  for (let i = 0; i < 14; i++) { const s = boxM(0.008, 0.008, 0.05, '#fbf6ec'); s.position.set((hash(i) - 0.5) * 0.13, 0.25 + hash(i * 3) * 0.45, 0.06); g.add(s); }
  return g;
}
function makeSaturday() {
  const g = new THREE.Group();
  const page = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.15, 0.08), [
    ...Array(4).fill(new THREE.MeshStandardMaterial({ color: '#fbf6ec' })),
    new THREE.MeshStandardMaterial({ map: label(['SATURDAY', { t: '15', size: 230 }], { w: 512, h: 660, size: 84, bg: '#ffe9ec' }) }),
    new THREE.MeshStandardMaterial({ color: '#fbf6ec' })]);
  page.position.y = 1.08; page.castShadow = true; g.add(page);
  for (const s of [-1, 1]) { const leg = boxM(0.05, 0.5, 0.05, '#1d1d22'); leg.position.set(s * 0.18, 0.28, 0.25); leg.rotation.x = -Math.PI / 2 + 0.1; g.add(leg); const shin = boxM(0.05, 0.5, 0.05, '#1d1d22'); shin.position.set(s * 0.18, 0.05, 0.5); g.add(shin); }
  const paper = plane(0.5, 0.36, label(['DAILY NEWS', { t: 'STILL FRIDAY', size: 60 }], { w: 512, h: 360, size: 56 })); paper.position.set(0, 0.95, 0.36); paper.rotation.x = -0.3; g.add(paper);
  return g;
}
function makeBench() {
  const g = new THREE.Group(), w = '#7d5232';
  const seat = boxM(1.6, 0.08, 0.5, w); seat.position.y = 0.5; g.add(seat);
  const back = boxM(1.6, 0.5, 0.06, w); back.position.set(0, 0.85, -0.22); g.add(back);
  for (const s of [-1, 1]) { const l = boxM(0.08, 0.5, 0.45, '#2a2a30'); l.position.set(s * 0.7, 0.25, 0); g.add(l); }
  return g;
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
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
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
const iris = (ctx, t0, cy = 0.45) => { const k = clamp((ctx.t - t0) / 0.45, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); }); };

/** Gerald's bedroom (room-local frame R: back wall at z = −2.1; window x −1.45…−0.15, y 0.95…2.25; bed against the left wall). */
function bedroom(ctx, { lighting = 'night' } = {}) {
  const set = ctx.set; set.setLighting?.(lighting); set.set?.('window', 'party');
  set.root.updateMatrixWorld(true);
  const R = (x, y, z) => set.root.localToWorld(V(x, y, z));
  const b = ctx.anchor('room.bed'), Fb = frame(rel(b), yawOf(b));
  ctx.place('gerald', Fb(-0.22, -0.02, -0.45)); ctx.cast.gerald.root.rotation.set(0, Fb.yaw, 0);
  const P = ctx.props, yaw = yawOf(set.root);
  ctx.add(P.stand); P.stand.position.copy(R(-1.2, 0, -1.8)); P.stand.rotation.set(0, yaw, 0);
  ctx.add(P.clock); P.clock.position.copy(R(-1.2, 0.5, -1.75)); P.clock.rotation.set(0, yaw + 0.5, 0); P.clock.scale.setScalar(1.25);
  ctx.add(P.calendar); P.calendar.position.copy(R(0.45, 1.75, -2.08)); P.calendar.rotation.set(0, yaw, 0); P.calendar.userData.flip(0);
  return { R, Fb, yaw };
}
function sitInBed(ch, t, face = 'sleepy', ft = t) { ch.pose('sit', t, { seated: true, seatHeight: 0.02, intensity: 0.2 }); ch.face(face, ft); }
/** Gerald slaps the snooze button at `hits` (world target = the button). */
function snooze(ctx, hits, face = 'determined') {
  const g = ctx.cast.gerald, P = ctx.props;
  P.clock.updateMatrixWorld(true);
  const btn = P.clock.userData.btn.getWorldPosition(V());
  g.pose('sitSlam', ctx.t, { hits, seated: true, seatHeight: 0.02, slamTarget: btn.clone().add(up(0.04)) });
  const h = lastBefore(hits, ctx.t);
  g.face(h != null && ctx.t - h < 0.2 ? 'huss' : face, ctx.t);
  return h != null ? ctx.t - h : 9;
}
const roomCam = (R, x, y, z, lx, ly, lz, fov = 42) => ({ pos: R(x, y, z), look: R(lx, ly, lz), fov });
function clockCam(ctx, d = 1.45, side = 0.25, fov = 36) {
  const c = ctx.props.clock; c.updateMatrixWorld(true);
  const p = c.localToWorld(V(0, 0.13, 0)), f = V(0, 0, 1).applyQuaternion(c.quaternion).setY(0).normalize(), l = V(f.z, 0, -f.x);
  return { pos: p.clone().addScaledVector(f, d).addScaledVector(l, side).add(up(0.22)), look: p, fov };
}
function bedCam(ctx, d = 2.4, fov = 40) {
  const g = ctx.cast.gerald, f = humanFace(g); ctx.props.clock.updateMatrixWorld(true);
  const c = ctx.props.clock.localToWorld(V(0, 0.1, 0)), mid = f.clone().lerp(c, 0.4);
  const fw = V(Math.sin(g.root.rotation.y), 0, Math.cos(g.root.rotation.y)), l = V(fw.z, 0, -fw.x);
  return { pos: mid.clone().addScaledVector(fw, d).addScaledVector(l, -0.25).add(up(0.25)), look: mid, fov };
}
const SUN_HIDE = -1.0;   // below the window sill (hidden by the wall)
/** The sun (or moon) behind the window: h = 0 hidden below the sill … 1 = centred in the window. */
function orbAt(ctx, orb, R, h, x = -0.8, s = 0.55) { ctx.add(orb); orb.position.copy(R(x, lerp(0.35, 1.62, h), -2.75)); orb.scale.setScalar(s); orb.rotation.set(0, yawOf(ctx.set.root), 0); }

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody parties."
  {
    name: 'party crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 10, hats: true });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh'), d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store = { crowd, from: { pos: hi, look: c.clone().add(up(0.5)), fov: 50 }, to: { pos: c.clone().addScaledVector(d, 9).add(up(3.2)), look: ctx.point('street.crowdA').add(up(1.3)), fov: 42 } };
    },
    update(ctx, lt, u) { animateCrowd(ctx.store.crowd, ctx.t); ctx.cam.move(ctx.store.from, ctx.store.to, u, ease.inOutCubic); },
  },
  // ── b02 "Except me. DJ Hip Replacement. In bed by seven."
  {
    name: 'in bed by seven', start: 'b02-0.1', set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx, lt) {
      const { R } = ctx.store, g = ctx.cast.gerald; sitInBed(g, ctx.t, ctx.t > ctx.markers.seven ? 'sleepy' : 'smile');
      ctx.props.clock.userData.set('fri');
      ctx.cam.move(bedCam(ctx, 3.0, 42), bedCam(ctx, 2.4, 40), clamp(lt / 3, 0, 1));
      tag(ctx, 'IN BED SINCE 7PM', ctx.markers.seven, Infinity, { y: 0.18 });
    },
  },
  // ── b03 HUSS ×6 — the alarm rings; one snooze slam per HUSS
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `snooze #${i + 1}`, start: i === 0 ? 'b03.h0-0.12' : `b03.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx) {
      const { R } = ctx.store, hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      const dh = snooze(ctx, hits);
      ctx.props.clock.userData.set('fri', dh < 0.15 ? 1 : 0, dh > 0.25 ? 1 : 0, ctx.t);
      const cams = [clockCam(ctx), bedCam(ctx), clockCam(ctx, 1.25, -0.25)];
      ctx.cam.set(cams[i % 3]); ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b04 "A balloon proposed to a cactus. Short wedding."
  {
    name: 'balloon wedding', start: 'b04-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const F = frameAt(ctx, 'street.crowdB'), P = ctx.props;
      ctx.add(P.cactus); P.cactus.position.copy(F(0.3, 0, 3.2)); P.cactus.rotation.set(0, F.yaw - 0.6, 0);
      ctx.add(P.balloon10); ctx.store = { F };
      EXTRA_IDS.slice(0, 4).forEach((id, k) => { ctx.place(id, F(-1.4 + k * 0.95, 0, 2.2 - (k % 2) * 0.3)); ctx.cast[id].root.rotation.set(0, F.yaw + Math.PI * 0.1, 0); ctx.cast[id].setAccessory?.('partyHat', true); });
    },
    update(ctx) {
      const { F } = ctx.store, P = ctx.props, tp = ctx.markers.pop;
      P.balloon10.visible = ctx.t < tp; P.balloon10.position.copy(F(-0.25, 0, 3.25)); P.balloon10.rotation.set(0, 0, -0.35 + 0.05 * Math.sin(ctx.t * 3));
      EXTRA_IDS.slice(0, 4).forEach((id, k) => { const c = ctx.cast[id]; c.pose(ctx.t > tp ? 'surprised' : 'clap', ctx.t + k * 0.3); c.face(ctx.t > tp ? 'shocked' : 'smile', ctx.t + k); });
      ctx.cam.set({ pos: F(0.1, 1.0, 5.4), look: F(0.05, 0.75, 3.2), fov: 38 });
      if (ctx.t > tp) stamp(ctx, 'POP!', tp, { fill: '#ffe14a', stroke: '#000', size: 200 });
    },
  },
  // ── b05 "While they're out partying, by the way, I'm pressing snooze."
  {
    name: 'pressing snooze', start: 'b05-0.1', set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx) {
      const { R } = ctx.store, t0 = ctx.time('b05');
      const hits = [0, 1, 2, 3].map((k) => t0 + 0.4 + k * 0.7);
      const dh = snooze(ctx, hits, 'sleepy');
      ctx.props.clock.userData.set('fri', dh < 0.15 ? 1 : 0, 0, ctx.t);
      ctx.cam.set(clockCam(ctx, 1.35, 0.2));
    },
  },
  // ── b06 "Then I snoozed the rooster. It's the pigeon."
  {
    name: 'snoozed the pigeon', start: 'b06-0.1', set: 'room',
    setup(ctx) {
      const st = ctx.store = bedroom(ctx);
      ctx.place('pigeon', st.R(-1.0, 0.71, -1.82)); ctx.cast.pigeon.root.rotation.set(0, st.yaw + 0.4, 0);
      const b = ctx.props.pigeonButton; ctx.add(b, ctx.cast.pigeon.joints.head); b.position.set(0, 0.145, 0.01);
    },
    update(ctx) {
      const { R } = ctx.store, p = ctx.cast.pigeon, tp = ctx.markers.pigeon, hit = tp - 0.05;
      ctx.props.clock.userData.set('fri');
      const g = ctx.cast.gerald; p.root.updateMatrixWorld(true);
      const btn = ctx.props.pigeonButton.getWorldPosition(V());
      g.pose('sitSlam', ctx.t, { hits: [hit], seated: true, seatHeight: 0.02, slamTarget: btn.clone().add(up(0.03)) }); g.face(ctx.t > hit ? 'smug' : 'sleepy', ctx.t);
      const squash = ctx.t > hit ? 1 - 0.35 * Math.exp(-(ctx.t - hit) * 2) : 1;
      p.root.scale.set(1, squash, 1);
      if (ctx.t < hit) { p.pose('huss', ctx.t); p.face('huss', ctx.t); } else { p.pose('idle', 0); p.face('sleepy', 1.5); }
      ctx.cam.set(ctx.t < ctx.markers.rooster ? roomCam(R, -0.4, 1.35, 0.5, -1.4, 0.95, -1.6, 40) : roomCam(R, -0.55, 1.05, -0.95, -1.05, 0.85, -1.8, 34));
      tag(ctx, "IT'S THE PIGEON", tp, Infinity, { y: 0.18 });
    },
  },
  // ── b07 "Then I snoozed the sunrise."  /  b08 HUSS ×3 — up, slap, down
  {
    name: 'snoozed the sunrise', start: 'b07-0.1', set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx) {
      const { R } = ctx.store, sun = ctx.props.sun, ts = ctx.markers.sunrise;
      ctx.props.clock.userData.set('fri');
      const rise = clamp((ctx.t - ctx.time('b07')) / 0.7, 0, 1), down = clamp((ctx.t - (ts + 0.25)) / 0.4, 0, 1);
      orbAt(ctx, sun, R, ease.outCubic(rise) * (1 - ease.inCubic(down)) * 0.75); sun.userData.mood('happy');
      snooze(ctx, [ts + 0.2], 'sleepy');
      ctx.cam.set(roomCam(R, 0.2, 1.4, 0.4, -0.95, 1.3, -2.1, 44));
    },
  },
  ...[0, 1, 2].map((i) => ({
    name: `sun bounce #${i + 1}`, start: i === 0 ? 'b08.h0-0.12' : `b08.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx) {
      const { R } = ctx.store, sun = ctx.props.sun, hits = ctx.hussTimes('b08').map((h) => h + 0.03);
      ctx.props.clock.userData.set('fri');
      const h = lastBefore(hits, ctx.t), dh = h != null ? ctx.t - h : 9;
      orbAt(ctx, sun, R, dh < 0.2 ? 0.75 * (1 - dh / 0.2) : 0.6 * clamp(dh - 0.2, 0, 1) / 0.2 * 0.5); sun.userData.mood(i === 2 ? 'angry' : 'happy');
      snooze(ctx, hits);
      ctx.cam.set(i === 1 ? clockCam(ctx) : roomCam(R, 0.2, 1.4, 0.4, -0.95, 1.3, -2.1, 44));
      ctx.cam.punch(hits, ctx.t, 0.1, 0.2);
    },
  })),
  // ── b09 quote: "Five more minutes never hurt anybody." — the dinosaurs
  {
    name: 'dinosaurs card', start: 'b09-0.1', set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx) {
      const { R } = ctx.store; sitInBed(ctx.cast.gerald, ctx.t, 'sleepy', 1.5); ctx.props.clock.userData.set('fri');
      ctx.cam.set(bedCam(ctx));
      quoteCard(ctx, 'Five more minutes never hurt anybody.', 'the dinosaurs', ctx.markers.quote1, ctx.markers.quote1end, { y: 0.32, byAt: ctx.markers.dinos });
    },
  },
  // ── b10 "Then I snoozed Saturday."
  {
    name: 'snoozed saturday', start: 'b10-0.1', set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx) {
      const { R } = ctx.store, C = ctx.props.calendar, ts = ctx.markers.sat;
      ctx.props.clock.userData.set('fri');
      const k = clamp((ctx.t - ctx.time('b10')) / 0.4, 0, 1) - clamp((ctx.t - ts - 0.15) / 0.3, 0, 1);
      C.userData.flip(1 - k);   // Saturday's page swings down… then snaps back up out of the way: still Friday
      snooze(ctx, [ts + 0.1], 'determined');
      ctx.cam.set(roomCam(R, 0.35, 1.55, -0.6, 0.45, 1.6, -2.1, 40));
      if (ctx.t > ts + 0.3) tag(ctx, 'STILL FRIDAY', ts + 0.3, Infinity, { y: 0.18 });
    },
  },
  // ── b11 "The moon asked for a day off. Denied."
  {
    name: 'moon denied', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh'), d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      const M = ctx.props.moon; ctx.add(M); M.position.copy(c.clone().addScaledVector(d, -40).add(up(22))); M.scale.setScalar(9); M.userData.mood('tired');
      ctx.store = { c, d, M };
    },
    update(ctx, lt) {
      const { c, d, M } = ctx.store;
      const cam = c.clone().addScaledVector(d, 8).add(up(2.5));
      M.lookAt(cam);
      ctx.cam.move({ pos: cam, look: M.position.clone().add(up(-4)), fov: 46 }, { pos: cam, look: M.position.clone(), fov: 30 }, clamp(lt / 1.4, 0, 1), ease.inOutSine);
      stamp(ctx, 'DENIED', ctx.markers.denied);
    },
  },
  // ── b12 "Top ten respectful moments. Number seven: the sun knocked first."  /  b13 "Then the sun stopped knocking."
  {
    name: 'sun knocks', start: 'b12-0.1', set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx) {
      const { R } = ctx.store, sun = ctx.props.sun; ctx.props.clock.userData.set('fri');
      const kn = [ctx.markers.knock, ctx.time('b12.w9')];
      const h = lastBefore(kn, ctx.t), dh = h != null ? ctx.t - h : 9;
      orbAt(ctx, sun, R, 0.72, -0.8, 0.55); sun.position.add(V(0, 0, 0)).addScaledVector(V(0, 0, 1).applyAxisAngle(V(0, 1, 0), yawOf(ctx.set.root)), dh < 0.15 ? 0.25 * Math.sin(Math.PI * dh / 0.15) : 0);
      sun.userData.mood('happy');
      sitInBed(ctx.cast.gerald, ctx.t, 'sleepy', 1.5);
      ctx.cam.set(roomCam(R, 0.2, 1.4, 0.4, -0.95, 1.3, -2.1, 44));
      top10Card(ctx, 7, ctx.time('b12') + 0.05, Infinity, { popAt: ctx.markers.top7 });
    },
  },
  {
    name: 'sun stopped knocking', start: 'b13-0.1', set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx, lt) {
      const { R } = ctx.store, sun = ctx.props.sun; ctx.props.clock.userData.set('fri');
      orbAt(ctx, sun, R, 0.72, -0.8, 0.55 + 0.1 * clamp(lt / 1.2, 0, 1)); sun.userData.mood('angry');
      sitInBed(ctx.cast.gerald, ctx.t, 'sweat');
      ctx.cam.move(roomCam(R, 0.2, 1.4, 0.4, -0.95, 1.3, -2.1, 44), roomCam(R, -0.2, 1.45, -0.6, -0.85, 1.5, -2.1, 40), clamp(lt / 1.2, 0, 1));
    },
  },
  // ── b14 HUSS ×6 — snooze! … and the sky cracks wider each time
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `sky cracks #${i + 1}`, start: i === 0 ? 'b14.h0-0.12' : `b14.h${i}-0.03`, set: i % 2 ? 'town' : 'room',
    setup(ctx) {
      if (i % 2 === 0) { const st = ctx.store = bedroom(ctx); const cr = ctx.props.roomCrack; ctx.add(cr.root); cr.root.position.copy(st.R(-0.8, 1.6, -2.6)); cr.root.rotation.set(0, st.yaw, 0); cr.root.scale.setScalar(1.1); return; }
      partyTown(ctx, { fireworks: false });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh'), d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      const cr = ctx.props.skyCrack; ctx.add(cr.root); cr.root.position.copy(c.clone().addScaledVector(d, -45).add(up(20))); cr.root.scale.setScalar(36);
      cr.root.lookAt(c.clone().addScaledVector(d, 9).add(up(2)));
      ctx.store = { c, d };
    },
    update(ctx) {
      const hits = ctx.hussTimes('b14').map((h) => h + 0.03), n = hits.filter((h) => h <= ctx.t).length;
      const g = Math.min(1, n / 6 + 0.05);
      if (i % 2 === 0) {
        const { R } = ctx.store; ctx.props.clock.userData.set('fri', 0, 1, ctx.t);
        snooze(ctx, hits); ctx.props.roomCrack.setGrowth(g);
        ctx.cam.set(i === 4 ? clockCam(ctx, 1.35, 0.2) : roomCam(R, 0.2, 1.4, 0.4, -0.95, 1.3, -2.1, 44));
      } else {
        const { c, d } = ctx.store; ctx.props.skyCrack.setGrowth(g);
        ctx.cam.set({ pos: c.clone().addScaledVector(d, 9).add(up(2.2)), look: c.clone().addScaledVector(d, -45).add(up(16)), fov: 56 });
      }
      ctx.cam.punch(hits, ctx.t, 0.12, 0.2); ctx.cam.shake(0.18, ctx.t, 30 + i);
    },
  })),
  // ── b15 "That's why in this town, everybody parties."  /  b16 "It's been Friday night since nineteen eighty two."
  {
    name: 'that is why', start: 'b15-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 10, hats: true });
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh'), d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      const cr = ctx.props.skyCrack; ctx.add(cr.root); cr.root.position.copy(c.clone().addScaledVector(d, -45).add(up(20))); cr.root.scale.setScalar(36); cr.root.lookAt(c.clone().addScaledVector(d, 9).add(up(2))); cr.setGrowth(1);
      ctx.store = { crowd, c, d };
    },
    update(ctx, lt, u) {
      const { crowd, c, d } = ctx.store; animateCrowd(crowd, ctx.t);
      const cam = c.clone().addScaledVector(d, 9).add(up(2.2));
      ctx.cam.move({ pos: cam, look: c.clone().addScaledVector(d, -45).add(up(16)), fov: 56 }, { pos: cam.clone().add(up(1.0)), look: ctx.point('street.crowdA').add(up(1.2)), fov: 44 }, u, ease.inOutCubic);
    },
  },
  {
    name: 'since 1982', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true); ctx.set.set?.('standsCrowd', true);
      ctx.store = { banner: ctx.point('square.banner'), bc: ctx.point('square.bannerCam') };
    },
    update(ctx, lt) {
      const { banner, bc } = ctx.store;
      ctx.cam.move({ pos: bc, look: banner.clone().add(up(-0.4)), fov: 54 }, { pos: bc.clone().lerp(banner, 0.15), look: banner.clone().add(up(-0.2)), fov: 52 }, clamp(lt / 2.2, 0, 1));
      tag(ctx, '16,263 NIGHTS IN A ROW', ctx.markers.since, Infinity, { y: 0.14, size: 58, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  // ── b17 "Grandad's conga line? Same night."
  {
    name: 'same night', start: 'b17-0.1', set: 'town',
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
        const s = ctx.t * WALK_SPEED * 0.9 - k * 0.85 - 30;
        const ch = ctx.cast[id]; ch.root.position.copy(F(0.9 * Math.sin(s * 0.7), 0, s));
        ch.root.rotation.set(0, F.yaw + Math.atan2(0.9 * 0.7 * Math.cos(s * 0.7), 1), 0);
        ch.pose('walk', ctx.t + k * 0.12, { speed: 0.9 }); ch.face(id === 'grandad' ? 'sleepy' : 'grin', ctx.t + k);
      });
      const head = ctx.t * WALK_SPEED * 0.9 - 30;
      ctx.cam.set({ pos: F(3.6, 2.0, head - 1.4), look: F(0, 0.9, head - 3.4), fov: 46 });
      tag(ctx, 'SINCE 1982', ctx.markers.same, Infinity, { y: 0.18, size: 70, bg: 'rgba(200,140,0,0.92)' });
    },
  },
  // ── b18 quote: "Good things come to those who wait." — Saturday, still waiting (on a bench)
  {
    name: 'saturday card', start: 'b18-0.1', set: 'town',
    setup(ctx) { partyTown(ctx); ctx.store = { banner: ctx.point('square.banner'), bc: ctx.point('square.bannerCam') }; },
    update(ctx) {
      const { banner, bc } = ctx.store; ctx.cam.set({ pos: bc, look: banner.clone().add(up(-0.4)), fov: 54 });
      quoteCard(ctx, 'Good things come to those who wait.', null, ctx.markers.quote2, ctx.markers.quote2end + 0.05, { y: 0.32 });
    },
  },
  {
    name: 'saturday waits', start: 'quote2end+0.05', set: 'town',
    setup(ctx) {
      ctx.set.setLighting?.('quiet_night'); ctx.set.set?.('partyProps', false);
      const tp = ctx.point('park.table'), pc = ctx.point('park.cam');
      const F = frame(tp.clone().setY(0).lerp(pc.clone().setY(0), 0.35), Math.atan2(pc.x - tp.x, pc.z - tp.z)), P = ctx.props;
      ctx.add(P.bench); P.bench.position.copy(F(0, 0, 0)); P.bench.rotation.set(0, F.yaw, 0);
      ctx.add(P.satPage); P.satPage.position.copy(F(0.1, 0.0, 0.02)); P.satPage.rotation.set(0, F.yaw, 0);
      ctx.store = { F };
    },
    update(ctx, lt) {
      const { F } = ctx.store;
      ctx.props.satPage.rotation.z = 0.04 * Math.sin(ctx.t * 1.3);
      ctx.cam.move({ pos: F(0.4, 1.4, 4.4), look: F(0, 1.0, 0), fov: 42 }, { pos: F(0.3, 1.3, 3.6), look: F(0, 1.05, 0), fov: 42 }, clamp(lt / 2, 0, 1));
      tag(ctx, 'STILL WAITING', ctx.time('b18.w8'), Infinity, { y: 0.18 });
    },
  },
  // ── b19 "Why? Saturday is my hip replacement."  /  b20 "It's not a DJ name. It's a reminder."
  {
    name: 'appointment', start: 'b19-0.1', set: 'room',
    setup(ctx) {
      const st = ctx.store = bedroom(ctx);
      const c = ctx.props.apptCard; ctx.add(c); c.position.copy(st.R(-1.02, 0.505, -1.62)); c.rotation.set(-Math.PI / 2 + 0.35, 0, 0); c.rotateOnWorldAxis(V(0, 1, 0), st.yaw + 0.2);
    },
    update(ctx, lt) {
      const { R } = ctx.store; ctx.props.clock.userData.set('fri'); sitInBed(ctx.cast.gerald, ctx.t, 'sad');
      ctx.cam.move(roomCam(R, -0.35, 1.25, -0.6, -1.05, 0.52, -1.65, 40), roomCam(R, -0.5, 1.1, -0.85, -1.05, 0.52, -1.65, 38), clamp(lt / 2, 0, 1));
    },
  },
  {
    name: 'its a reminder', start: 'b20-0.1', set: 'room',
    setup(ctx) {
      const st = ctx.store = bedroom(ctx);
      const g = ctx.cast.gerald;
      for (const k of ['sticky', 'sticky2']) { const s = ctx.props[k]; ctx.add(s, g.joints.head); s.position.set(0, 0.5, 0.292); s.rotation.set(0, 0, 0.05); s.scale.setScalar(0.72); }
    },
    update(ctx) {
      const g = ctx.cast.gerald, P = ctx.props, tr = ctx.markers.reminder; P.clock.userData.set('fri');
      sitInBed(g, ctx.t, 'neutral', 1.5);
      P.sticky.visible = ctx.t < tr; P.sticky2.visible = ctx.t >= tr;
      const f = humanFace(g), fw = V(Math.sin(g.root.rotation.y), 0, Math.cos(g.root.rotation.y));
      ctx.cam.set({ pos: f.clone().addScaledVector(fw, 1.6).add(up(0.15)), look: f.clone().add(up(0.1)), fov: 36 });
    },
  },
  // ── b21 "Five more minutes."  /  b22 HUSS ×3 — back to Friday
  {
    name: 'saturday rings', start: 'b21-0.1', set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx, lt) {
      const { R } = ctx.store; ctx.props.clock.userData.set('sat', 0, 1, ctx.t);
      const g = ctx.cast.gerald; sitInBed(g, ctx.t, 'sleepy', 1.5);
      g.joints.armR.rotation.x += -0.9 * clamp(lt / 0.9, 0, 1);
      ctx.cam.set(clockCam(ctx, 1.35, 0.2)); ctx.cam.shake(0.08, ctx.t, 5);
    },
  },
  ...[0, 1, 2].map((i) => ({
    name: `back to friday #${i + 1}`, start: i === 0 ? 'b22.h0-0.12' : `b22.h${i}-0.03`, set: 'room',
    setup(ctx) { ctx.store = bedroom(ctx); },
    update(ctx) {
      const { R } = ctx.store, hits = ctx.hussTimes('b22').map((h) => h + 0.03), n = hits.filter((h) => h <= ctx.t).length;
      const dh = snooze(ctx, hits, 'smug');
      ctx.props.clock.userData.set(n >= 1 ? 'fri' : 'sat', dh < 0.15 ? 1 : 0, 0, ctx.t);
      ctx.cam.set(i === 1 ? bedCam(ctx) : clockCam(ctx, 1.35, 0.2));
      ctx.cam.punch(hits, ctx.t, 0.12, 0.2);
      if (i === 2 && ctx.t > hits[2]) tag(ctx, 'FRI 23:59', hits[2] + 0.1, Infinity, { y: 0.18, fill: '#ff3b30', bg: 'rgba(13,15,20,0.92)', size: 80 });
      if (i === 2) iris(ctx, ctx.time('b22.end') + 0.7, 0.42);
    },
  })),
];
