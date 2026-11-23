// In This Town — Episode 19: "Battery 1%".  One second of a mystery song and you dance as long as it plays.  A hooded hacker
// with glowing green eyes hijacks the clock tower speakers; the only kid left standing has headphones on 5 %, gets the town
// to crowd-surf him to the plug and yanks it… then a purple party saucer arrives blasting the remix.  Battery: 0 %.
// Film contract: SPEC.md §8.  Timeline: episodes/ep19/timeline.json.
//
// Sets: 'town' (buildTown + the ep14 tower top on the clock tower, speakers, socket, plug, DJ booth on the stage),
//       'room' (the narrator's bedroom, night), 'bath' (custom shower stall).
// Town-local coordinates (T(ctx)): main street along x (centre z = 0), clock tower at (TX, TZ) = (−51, 1.5), deck y = 16.6,
// the stage at x = 53 (S frame = frameAt('square.stage'), +z toward the audience), picnic table at PIC in the plaza mouth.
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS, extraSpecs } from '../cast.js';
import { yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { top10Card } from '../cards.js';
import { frameAt, lastBefore } from '../shots.js';
import { TOWER, makeTowerTop, makePicnicTable } from '../ep14/props.js';
import { glowSprite, makeSparkles, makePuff } from '../ep18/props.js';
import { makeSoundRings } from '../ep16/props.js';
import { makeZzz } from '../ep9/props9.js';
import {
  makeEarphones, makeDJBooth, makeNotes, makeLoudspeaker, makeSocket, makePlug, makeCable, makeLadder, makeShopSign, makeAwning,
  makeCounter, makeRulesBoard, makeHood, makeShowerCap, makeDuck, makeBulb, makeSpaceship, makeFillerCrowd, makeSparkBurst,
  makeMoon, makeGrassPatch, buildBath,
} from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;
const TX = TOWER.x, TZ = TOWER.z, DY = TOWER.deck;
const CURB = 0.12;
const PIC = { x: 32.5, z: 3.2 };               // picnic table (long axis along z), benches at x ± 0.62
const BENCH_X = PIC.x - 0.62;                   // the west bench (narrator sits here facing west)

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const MORE = Object.fromEntries(Object.values(extraSpecs(16, 191)).map((s, i) => { const id = `y${String(i).padStart(2, '0')}`; return [id, { ...s, id, lod: 'low' }]; }));
const MORE_IDS = Object.keys(MORE);
const CROWD = [...EXTRA_IDS, ...MORE_IDS];      // 34 townspeople
const SPECIAL = {
  noodle: { id: 'noodle', skin: '#c68642', hair: { style: 'curly', color: '#1a120c' }, top: { style: 'tee', color: '#8a5cff', accent: '#ffd23f', emblem: 'star' },
    bottom: { style: 'pants', color: '#1d1d22' }, shoes: '#ffd23f', accessories: ['sunglasses', 'chain', 'cap'], capColor: '#ffd23f', scale: 1.0 },
  pell: { id: 'pell', skin: '#f4d0b5', hair: { style: 'bun', color: '#8a5a3a' }, top: { style: 'dress', color: '#ff9ec6', accent: '#ffffff', emblem: 'heart' },
    bottom: { style: 'skirt', color: '#ff9ec6' }, shoes: '#7a1f2b', accessories: ['glasses'], scale: 0.95 },
  brandt: { id: 'brandt', skin: '#e9b99a', hair: { style: 'short', color: '#5a3a22' }, top: { style: 'suit', color: '#2f4d8a', accent: '#ffd23f' },
    bottom: { style: 'pants', color: '#1d2a4a' }, shoes: '#1a1a1a', accessories: ['cap', 'mustache'], capColor: '#1d2a5a', build: 1.12, scale: 1.02 },
  cop2: { id: 'cop2', skin: '#8d5524', hair: { style: 'short', color: '#111111' }, top: { style: 'suit', color: '#2f4d8a', accent: '#ffd23f' },
    bottom: { style: 'pants', color: '#1d2a4a' }, shoes: '#1a1a1a', accessories: ['cap'], capColor: '#1d2a5a', scale: 0.98 },
  cop3: { id: 'cop3', skin: '#f1c7a1', hair: { style: 'bun', color: '#c0392b' }, top: { style: 'suit', color: '#2f4d8a', accent: '#ffd23f' },
    bottom: { style: 'pants', color: '#1d2a4a' }, shoes: '#1a1a1a', accessories: ['cap'], capColor: '#1d2a5a', scale: 0.95 },
  grandma: { id: 'grandma', skin: '#f0c8a8', hair: { style: 'bun', color: '#f4f4f4' }, top: { style: 'cardigan', color: '#ffa6d1', accent: '#ffffff' },
    bottom: { style: 'skirt', color: '#7a6a58' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.9 },
  mailman: { id: 'mailman', skin: '#a86b4a', hair: { style: 'short', color: '#1a120c' }, top: { style: 'tee', color: '#9fc8ff', accent: '#2f4d8a', emblem: 'stripe' },
    bottom: { style: 'shorts', color: '#2f4d8a' }, shoes: '#1d1d22', accessories: ['cap', 'sash'], capColor: '#2f4d8a', sashColor: '#8a5a2e', scale: 1.0 },
  kid: { id: 'kid', skin: '#ffdbac', hair: { style: 'spiky', color: '#e8c46a' }, top: { style: 'tee', color: '#4fb3ff', accent: '#ffffff', emblem: 'star' },
    bottom: { style: 'shorts', color: '#2f4d8a' }, shoes: '#ff4fa3', scale: 0.72 },
  hummer: { id: 'hummer', skin: '#e0ac69', hair: { style: 'long', color: '#3b2416' }, top: { style: 'cardigan', color: '#ffd23f', accent: '#ff7a2f' },
    bottom: { style: 'skirt', color: '#3a3d46' }, shoes: '#ff4fa3', accessories: [], scale: 0.97 },
  hacker: { id: 'hacker', skin: '#141418', hair: { style: 'bald', color: '#141418' }, top: { style: 'hoodie', color: '#101014', accent: '#101014' },
    bottom: { style: 'pants', color: '#101014' }, shoes: '#101014', accessories: [], scale: 1.0 },
};
export const cast = { me: MAIN.me, pigeon: MAIN.pigeon, ...SPECIAL, ...EXTRAS, ...MORE };
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 19, banner: ['TOWN', 'FAIR', 'DJ NOODLE LIVE!'] }),
  room: () => buildRoom({ variant: 'hero', window: 'dark', poster: 'knight' }),
  bath: () => buildBath(),
};

export function init(ctx) {
  const P = ctx.props;
  P.tower = makeTowerTop();
  P.spk = [makeLoudspeaker(), makeLoudspeaker()];
  P.socket = makeSocket(); P.plug = makePlug();
  P.pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.6), new THREE.MeshStandardMaterial({ color: '#6e7078', roughness: 0.8 })); P.pedestal.geometry.translate(0, 0.275, 0); P.pedestal.castShadow = true;
  P.cabA = makeCable(10, 0.07); P.cabB = makeCable(6, 0.06); P.cabC = makeCable(6, 0.06);
  P.ladder = makeLadder(17.6);
  P.phones = makeEarphones(); P.kidPhones = makeEarphones();
  P.booth = makeDJBooth();
  P.notes = makeNotes(60); P.notes2 = makeNotes(30);
  P.rings = makeSoundRings(5); P.rings2 = makeSoundRings(5); P.shipRings = makeSoundRings(6);
  P.bakerySign = makeShopSign(['BAKERY'], { w: 2.6, h: 0.75, bg: '#ff9ec6', fg: '#7a1f2b', border: '#7a1f2b', glow: 0.3 });
  P.awning = makeAwning(2.9, 1.2, '#ff4fa3', '#ffffff');
  P.counter = makeCounter();
  P.stallPosts = new THREE.Group(); for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.9, 0.1), new THREE.MeshStandardMaterial({ color: '#7d5232' })); p.position.set(s * 1.3, 1.45, 0); p.castShadow = true; P.stallPosts.add(p); }
  P.policeSign = makeShopSign(['POLICE'], { w: 2.6, h: 0.75, bg: '#2f4d8a', fg: '#ffffff', border: '#ffd23f', glow: 0.35 });
  P.rules = makeRulesBoard();
  P.hood = makeHood(); P.cap = makeShowerCap(); P.duck = makeDuck(); P.bulb = makeBulb();
  P.ship = makeSpaceship();
  P.filler = makeFillerCrowd(560);
  P.burst = makeSparkBurst(50); P.burstY = makeSparkBurst(60, ['#fff6a0', '#ffd23f', '#ff9a2a', '#ffffff'], { speed: 1.3 });
  P.moon = makeMoon();
  P.picnic = makePicnicTable(); P.grass = makeGrassPatch(5.2, 4.2);
  P.zzz = makeZzz(0.5);
  P.sparkles = makeSparkles({ n: 50, w: 8, h: 5, d: 6, color: '#ffe08a', size: 0.07 });
  P.sneeze = makePuff({ color: '#dff4ff', count: 16, radius: 0.5, seed: 4 });
  P.letters = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.01), new THREE.MeshStandardMaterial({ color: '#fbf6ec', roughness: 0.8 })); m.castShadow = true; return m; });
  P.fill = new THREE.PointLight('#c8d8ff', 5, 9, 1.4);
  P.pink = new THREE.PointLight('#ff4fa3', 0, 8, 1.4);
  P.green = new THREE.PointLight('#5dff6a', 0, 7, 1.5);
  P.shipLight = new THREE.PointLight('#c060ff', 0, 60, 1.2);
  P.towerGlow = glowSprite('#ffe6a0', 16, 0.5);
  P.spkGlow = [glowSprite('#5dff6a', 5, 0.6), glowSprite('#5dff6a', 5, 0.6)];
  P.flash = glowSprite('#ffffff', 6, 1);
  P.rim = new THREE.PointLight('#9fc8ff', 0, 10, 1.3);
  P.key = new THREE.PointLight('#ffd8a0', 0, 12, 1.3);
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function T(ctx) { ctx.set.root.updateMatrixWorld(true); const r = ctx.set.root; const f = (x, y, z) => r.localToWorld(V(x, y, z)); f.yaw = yawOf(r); return f; }
function put(ctx, id, p, yaw) { ctx.place(id, p); const r = ctx.cast[id].root; r.rotation.order = 'YXZ'; r.rotation.set(0, yaw, 0); return ctx.cast[id]; }
function addTo(ctx, obj, x, y, z, ry = 0) { ctx.add(obj, ctx.set.root); obj.position.set(x, y, z); obj.rotation.set(0, ry, 0); return obj; }
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.17, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop) * (o.scale || 1) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.25, size: 130, fill: '#e8232b', stroke: '#ffffff', line: 12, rot: -0.1, alpha: clamp(d / 0.06, 0, 1), ...o, scale: s * (o.scale || 1) });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function headPt(ch, x = 0, y = 0.3, z = 0) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(x, y, z)); }
function fwdOf(ch) { const y = ch.root.rotation.y; return V(Math.sin(y), 0, Math.cos(y)); }
function sideOf(ch) { const f = fwdOf(ch); return V(f.z, 0, -f.x); }
function rim(ctx, pos, k = 10, color = '#9fc8ff') { const r = ctx.props.rim; ctx.add(r); r.position.copy(pos); r.intensity = k; r.color.set(color); }
function key(ctx, pos, k = 12, color = '#ffd8a0') { const r = ctx.props.key; ctx.add(r); r.position.copy(pos); r.intensity = k; r.color.set(color); }
function handPos(ch, s = 'R') { ch.root.updateMatrixWorld(true); return ch.joints['hand' + s].getWorldPosition(V()); }
function footPos(ch, s = 'R') { ch.root.updateMatrixWorld(true); return ch.joints['foot' + s].getWorldPosition(V()); }
const iris = (ctx, t0, cy = 0.45, dur = 0.45) => { const k = clamp((ctx.t - t0) / dur, 0, 1); if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - k); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, PI * 2, true); g.fill('evenodd'); g.restore(); }); };
function fill(ctx, pos, k = 1, color = '#c8d8ff') { const f = ctx.props.fill; ctx.add(f); f.position.copy(pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); }
const camLerp = (a, b, u) => ({ pos: a.pos.clone().lerp(b.pos, u), look: a.look.clone().lerp(b.look, u), fov: lerp(a.fov, b.fov, u) });
function moveCam(ctx, a, b, u, k = 0, color) { const c = camLerp(a, b, clamp(u, 0, 1)); ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k, color); return c; }
function setCam(ctx, c, k = 0, color) { ctx.cam.set(c); if (k > 0) fill(ctx, c.pos, k, color); return c; }
function flash(ctx, t0, dur = 0.25, color = '#ffffff', a = 0.9) { const d = ctx.t - t0; if (d >= 0 && d < dur) ctx.fx.overlay(color, a * (1 - d / dur)); }
const _pc = new THREE.PerspectiveCamera();
function screenOf(cam, p) { _pc.fov = cam.fov; _pc.aspect = 1080 / 1920; _pc.near = 0.05; _pc.far = 2000; _pc.position.copy(cam.pos); _pc.lookAt(cam.look); _pc.updateProjectionMatrix(); _pc.updateMatrixWorld(true); const v = p.clone().project(_pc); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 }; }
function hitPulse(times, t, decay = 0.2) { let p = 0; for (const h of times) if (t >= h) p = Math.max(p, Math.exp(-(t - h) / decay)); return p; }
const beat = (t, bpm = 126) => Math.pow(Math.max(0, Math.cos((t * bpm / 60) * PI * 2)), 6);

// ─── town looks
const PURPLE = { zenith: new THREE.Color('#1c0b4a'), mid: new THREE.Color('#6a2fb8'), horizon: new THREE.Color('#ff8ac8'), fog: new THREE.Color('#7a3ab8') };
function skyBase(ctx) {
  const sky = ctx.set.root.getObjectByName('sky'); if (!sky || !sky.material?.uniforms?.uZenith) return;
  const u = sky.material.uniforms;
  ctx.store.sky = { u, z: u.uZenith.value.clone(), m: u.uMid.value.clone(), h: u.uHorizon.value.clone(), sun: u.uSunColor.value.clone(), bg: ctx.set.background?.clone?.(), fog: ctx.set.fog?.color?.clone() };
}
function townPurple(ctx, k) {
  const s = ctx.store.sky; if (!s) return;
  s.u.uZenith.value.copy(s.z).lerp(PURPLE.zenith, k); s.u.uMid.value.copy(s.m).lerp(PURPLE.mid, k); s.u.uHorizon.value.copy(s.h).lerp(PURPLE.horizon, k);
  s.u.uSunColor.value.copy(s.sun).multiplyScalar(1 - k);
  if (s.bg && ctx.set.background) ctx.set.background.copy(s.bg).lerp(PURPLE.fog, k);
  if (s.fog && ctx.set.fog) ctx.set.fog.color.copy(s.fog).lerp(PURPLE.fog, k);
}
/** town base: lighting + optional tower rig.  rig: 'none' | 'pre' (hacker about to plug in) | 'on' | 'off' (plug yanked) */
function town(ctx, { light = 'day', party = false, glow = 0.7, rig = 'on', ladder = false } = {}) {
  const s = ctx.set;
  s.setLighting(light); s.set('partyProps', party); s.set('fireworks', false); s.set('foam', 0);
  s.set('windowGlow', light === 'day' ? 0 : glow); s.set('standsCrowd', false);
  s.exposure = light === 'quiet_night' ? 1.15 : light === 'party_night' ? 1.05 : 1.0;
  skyBase(ctx);
  const L = T(ctx), P = ctx.props;
  addTo(ctx, P.tower, TX, 0, TZ);
  if (rig !== 'none') buildRig(ctx, rig);
  if (ladder) { addTo(ctx, P.ladder, TX + 0.9, 0, TZ + 4.1); P.ladder.rotation.set(-0.065, 0, 0); }
  ctx.store.L = L; ctx.store.rig = rig;
  return L;
}
// tower rig geometry (town-local)
const SPK = [[TX + 2.72, 13.3, TZ - 1.65], [TX + 2.72, 13.3, TZ + 1.65]];
const SOCK = { x: TX + 0.5, z: TZ - 1.75 };
const JUNC = V(TX + 2.9, DY + 0.86, TZ - 0.6);
function buildRig(ctx, mode) {
  const P = ctx.props;
  SPK.forEach((p, i) => { addTo(ctx, P.spk[i], p[0], p[1], p[2], PI / 2); });
  addTo(ctx, P.pedestal, SOCK.x, DY, SOCK.z);
  addTo(ctx, P.socket, SOCK.x, DY + 0.55, SOCK.z);
  addTo(ctx, P.plug, 0, 0, 0, PI);
  ctx.add(P.cabA, ctx.set.root); P.cabA.position.set(0, 0, 0);
  ctx.add(P.cabB, ctx.set.root); P.cabB.position.set(0, 0, 0);
  ctx.add(P.cabC, ctx.set.root); P.cabC.position.set(0, 0, 0);
  P.cabB.userData.set(JUNC, V(SPK[0][0] - 0.1, SPK[0][1] + 0.95, SPK[0][2]), 0.1);
  P.cabC.userData.set(JUNC, V(SPK[1][0] - 0.1, SPK[1][1] + 0.95, SPK[1][2]), 0.1);
  plugAt(ctx, mode === 'pre' ? null : 'socket');
}
/** socket hole in town-local coords */
function holeLocal(ctx) { const P = ctx.props; P.socket.updateMatrixWorld(true); return ctx.set.root.worldToLocal(P.socket.userData.hole.getWorldPosition(V())); }
/** put the plug: 'socket' | null (keep where the caller put it) | town-local Vector3; yaw optional */
function plugAt(ctx, where, yaw = PI, pitch = 0) {
  const P = ctx.props, plug = P.plug;
  if (where === 'socket') { const h = holeLocal(ctx); plug.position.set(h.x, h.y, h.z + 0.02); plug.rotation.set(0, PI, 0); }
  else if (where) { plug.position.copy(where); plug.rotation.order = 'YXZ'; plug.rotation.set(pitch, yaw, 0); }
  plug.updateMatrixWorld(true);
  const back = ctx.set.root.worldToLocal(plug.userData.back.getWorldPosition(V()));
  P.cabA.userData.set(back, JUNC, 0.25);
}
/** speakers: pump + glow + notes streaming over the town */
function rigTick(ctx, { on = 1, notes = 1, rings = 1, glow = 1 } = {}) {
  const P = ctx.props, t = ctx.t;
  P.spk.forEach((s) => s.userData.set(t, on, on));
  P.plug.userData.set(on > 0 ? 1 : 0.15);
  if (notes > 0) {
    const n = P.notes; n.userData.begin();
    for (let i = 0; i < 46; i++) {
      const s = i % 2, sp = SPK[s], u = (hash(i * 1.7) + t * (0.12 + 0.05 * hash(i * 3.1))) % 1;
      const d = u * 26, spread = 0.6 + u * 7;
      const p = ctx.set.root.localToWorld(V(sp[0] + 0.6 + d, sp[1] - 0.2 + u * 6 + Math.sin(t * 2 + i) * 0.6 + (hash(i * 5.3) - 0.5) * spread * 0.6, sp[2] + (hash(i * 7.9) - 0.5) * spread + Math.cos(t * 1.7 + i) * 0.5));
      n.userData.add(p, { s: (0.9 + 1.6 * u) * notes * Math.min(1, u * 8), rot: 0.4 * Math.sin(t * 3 + i) });
    }
    n.userData.end(); ctx.add(n);
  }
  if (rings > 0) {
    [P.rings, P.rings2].forEach((r, i) => { ctx.add(r, ctx.set.root); r.position.set(SPK[i][0] + 0.5, SPK[i][1] - 0.3, SPK[i][2]); r.rotation.set(0, PI / 2, 0); r.userData.set(t, 0.45 * rings, 14, 0.9); });
  }
  if (glow > 0) P.spkGlow.forEach((g, i) => { ctx.add(g, ctx.set.root); g.position.set(SPK[i][0] + 0.7, SPK[i][1] - 0.3, SPK[i][2]); g.material.opacity = 0.55 * glow * on * (0.7 + 0.3 * beat(t)); });
}
/** moon disc placed far behind `target` as seen from the camera */
function moonBehind(ctx, cam, target, { dist = 160, size = 16, dx = 0, dy = 0 } = {}) {
  const m = ctx.props.moon; ctx.add(m);
  const d = target.clone().sub(cam.pos).normalize();
  const side = V(d.z, 0, -d.x).normalize();
  m.position.copy(cam.pos).addScaledVector(d, dist).addScaledVector(side, dx * dist).add(up(dy * dist));
  m.scale.setScalar(size); m.lookAt(cam.pos);
}
/** narrator wears the on-ear headphones (hides the neck pair). */
function phonesOn(ctx, ch = ctx.cast.me, prop = ctx.props.phones) { ch.setAccessory?.('headphones', false); ctx.add(prop, ch.joints.head); prop.position.set(0, 0, 0); prop.rotation.set(0, 0, 0); prop.scale.setScalar(1); prop.userData.set({ led: '#3cff6b', k: 1 }); return prop; }
/** the 2D battery icon. pct 0..100 */
function battery(ctx, pct, { x = 0.5, y = 0.15, s = 1, t0 = -Infinity, blink = false, label = true } = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const pop = d < 0.2 ? ease.outBack(clamp(d / 0.2, 0, 1)) : 1;
  const on = !blink || Math.floor(ctx.t * 5) % 2 === 0;
  const col = pct <= 5 ? '#ff2a2a' : pct <= 20 ? '#ffb020' : '#3cff6b';
  ctx.fx.draw((g, W, H) => {
    const sc = s * Math.max(0.01, pop) * W / 1080;
    g.translate(x * W, y * H); g.scale(sc, sc);
    const bw = 300, bh = 140, r = 26;
    const rr = (x0, y0, w, h, rad) => { g.beginPath(); g.moveTo(x0 + rad, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + h, rad); g.arcTo(x0 + w, y0 + h, x0, y0 + h, rad); g.arcTo(x0, y0 + h, x0, y0, rad); g.arcTo(x0, y0, x0 + w, y0, rad); g.closePath(); };
    const ox = label ? -bw / 2 - 90 : -bw / 2;
    g.fillStyle = 'rgba(0,0,0,0.55)'; rr(ox - 14, -bh / 2 - 14, bw + 28, bh + 28, r + 10); g.fill();
    g.lineWidth = 22; g.strokeStyle = '#000'; rr(ox, -bh / 2, bw, bh, r); g.stroke();
    g.lineWidth = 12; g.strokeStyle = pct <= 5 ? (on ? '#ff2a2a' : '#ffffff') : '#ffffff'; rr(ox, -bh / 2, bw, bh, r); g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(ox + bw + 6, -30, 26, 60);
    const fw = Math.max(pct > 0 ? 18 : 0, (bw - 36) * pct / 100);
    if (on && fw > 0) { g.fillStyle = col; rr(ox + 18, -bh / 2 + 18, fw, bh - 36, 10); g.fill(); }
    if (label) {
      g.font = '130px "ITT Luckiest", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.lineWidth = 18; g.strokeStyle = '#000'; g.strokeText(`${pct}%`, ox + bw + 60, 8);
      g.fillStyle = pct <= 5 ? col : '#ffffff'; g.fillText(`${pct}%`, ox + bw + 60, 8);
    }
  });
}
function ruleCard(ctx, n, text, t0, size = 70) {
  const d = ctx.t - t0; if (d < 0) return;
  const pop = d < 0.22 ? ease.outBack(clamp(d / 0.22, 0, 1)) : 1;
  ctx.fx.text(`RULE ${n}`, { x: 0.5, y: 0.1, size: 84, fill: '#ffe14a', stroke: '#000000', bg: 'rgba(210,20,45,0.95)', rot: -0.04, scale: Math.max(0.01, pop) });
  ctx.fx.text(text, { x: 0.5, y: text.includes('\n') ? 0.215 : 0.19, size, font: 'narr', fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.88)', rot: -0.04, scale: Math.max(0.01, pop * 0.98) });
}
/** red "ban" circle + slash around a screen point */
function banSign(ctx, sp, t0, r = 0.16) {
  const d = ctx.t - t0; if (d < 0) return;
  const k = d < 0.14 ? lerp(1.8, 1, ease.outCubic(d / 0.14)) : 1;
  ctx.fx.draw((g, W, H) => {
    g.translate(sp.x * W, sp.y * H); g.scale(k, k);
    const R = r * W; g.lineWidth = R * 0.2; g.strokeStyle = '#000'; g.beginPath(); g.arc(0, 0, R, 0, PI * 2); g.stroke();
    g.beginPath(); g.moveTo(-R * 0.7, -R * 0.7); g.lineTo(R * 0.7, R * 0.7); g.stroke();
    g.lineWidth = R * 0.13; g.strokeStyle = '#ff2030'; g.beginPath(); g.arc(0, 0, R, 0, PI * 2); g.stroke();
    g.beginPath(); g.moveTo(-R * 0.7, -R * 0.7); g.lineTo(R * 0.7, R * 0.7); g.stroke();
  });
  if (d < 0.15) ctx.cam.shake(0.2, ctx.t, 7);
}
/** a stream of notes from p (world) toward dir, n of them */
function noteStream(ctx, notes, p, dir, t, { n = 12, len = 3, spread = 0.6, s = 0.6, rate = 0.35, seed = 0 } = {}) {
  for (let i = 0; i < n; i++) {
    const u = (hash(i * 2.3 + seed) + t * rate * (0.8 + 0.4 * hash(i * 4.1 + seed))) % 1;
    const q = p.clone().addScaledVector(dir, u * len).add(V(Math.sin(t * 2.4 + i) * spread * u, Math.cos(t * 1.9 + i * 1.3) * spread * 0.6 * u + u * 0.3, Math.sin(t * 1.7 + i * 2.1) * spread * u));
    notes.userData.add(q, { s: s * Math.sin(PI * Math.min(1, u * 1.15)), rot: 0.4 * Math.sin(t * 3 + i), ci: i + seed });
  }
}
/** "ME" pointer over the narrator (crowd shots) + a warm light on him */
function meArrow(ctx, cam) {
  const me = ctx.cast.me, h = headPt(me, 0, 0.3, 0), P = ctx.props;
  ctx.add(P.pink); P.pink.color.set('#ffd8a0'); P.pink.intensity = 12; P.pink.position.copy(h).add(up(1.6));
  const sp = screenOf(cam, h);
  const below = sp.y > 0.56 && sp.y < 0.75, bob = 0.01 * Math.abs(Math.sin(ctx.t * 6));
  const y = below ? sp.y + 0.05 + bob : sp.y - 0.06 - bob, dir = below ? -1 : 1;
  ctx.fx.draw((g, W, H) => { g.translate(sp.x * W, y * H); g.scale(1, dir); g.fillStyle = '#ffe14a'; g.strokeStyle = '#000'; g.lineWidth = 8; g.beginPath(); g.moveTo(-26, -30); g.lineTo(26, -30); g.lineTo(0, 6); g.closePath(); g.stroke(); g.fill(); });
  ctx.fx.text('ME', { x: sp.x, y: y - 0.04 * dir, size: 64, fill: '#ffe14a', stroke: '#000000', bg: null, rot: 0 });
}
function climbPose(ch, t, k = 1) {
  ch.pose('idle', t, { intensity: 0.2 });
  const J = ch.joints, a = Math.sin(t * 6);
  J.armL.rotation.x += (-2.55 + 0.35 * a) * k; J.armR.rotation.x += (-2.55 - 0.35 * a) * k;
  J.legL.rotation.x += -0.5 * Math.max(0, a) * k; J.legR.rotation.x += -0.5 * Math.max(0, -a) * k;
  if (J.shinL) { J.shinL.rotation.x += 0.7 * Math.max(0, a) * k; J.shinR.rotation.x += 0.7 * Math.max(0, -a) * k; }
}
function kneel(ch, t) {
  ch.pose('idle', t, { intensity: 0.2 });
  const J = ch.joints;
  J.legL.rotation.x = -1.45; if (J.shinL) J.shinL.rotation.x = 1.45;
  J.legR.rotation.x = -0.15; if (J.shinR) J.shinR.rotation.x = 1.55;
  J.torso.rotation.x = 0.25;
}
/** arms straight up holding something overhead */
function armsUp(ch, k = 1, wob = 0) {
  const J = ch.joints;
  J.armL.rotation.set(lerp(J.armL.rotation.x, -2.95, k), 0, lerp(J.armL.rotation.z, -0.18, k) + wob);
  J.armR.rotation.set(lerp(J.armR.rotation.x, -2.95, k), 0, lerp(J.armR.rotation.z, 0.18, k) - wob);
  if (J.foreArmL) { J.foreArmL.rotation.x = lerp(J.foreArmL.rotation.x, -0.15, k); J.foreArmR.rotation.x = lerp(J.foreArmR.rotation.x, -0.15, k); }
}
function armsForward(ch, k = 1, down = -1.25) {
  const J = ch.joints;
  J.armL.rotation.set(lerp(J.armL.rotation.x, down, k), 0, lerp(J.armL.rotation.z, 0.22, k));
  J.armR.rotation.set(lerp(J.armR.rotation.x, down, k), 0, lerp(J.armR.rotation.z, -0.22, k));
  if (J.foreArmL) { J.foreArmL.rotation.x = lerp(J.foreArmL.rotation.x, -0.25, k); J.foreArmR.rotation.x = lerp(J.foreArmR.rotation.x, -0.25, k); }
}
function handOverEyes(ch, s = 'L') {
  const J = ch.joints, sg = s === 'L' ? 1 : -1;
  J['arm' + s].rotation.set(-2.2, 0, 0.55 * sg); if (J['foreArm' + s]) J['foreArm' + s].rotation.x = -1.75;
}
function djPose(ch, t, bounce = 1) {
  ch.pose('idle', t, { intensity: 0.3 });
  const J = ch.joints, b = Math.abs(Math.sin(t * PI * 2.1));
  J.armL.rotation.set(-1.15 + 0.1 * Math.sin(t * 8), 0, 0.3); J.armR.rotation.set(-1.0, 0, -0.45 + 0.2 * Math.sin(t * 4));
  if (J.foreArmL) { J.foreArmL.rotation.x = -0.6; J.foreArmR.rotation.x = -0.7; }
  J.head.rotation.x += 0.18 * b * bounce; J.hips.position.y -= 0.04 * b * bounce;
}
// ── crowds (real characters)
function grid(ctx, ids, L, { x0, z0, cols, dx = 1.25, dz = 1.2, yaw = 0, jitter = 0.25, skip = null, seed = 1 }) {
  const list = []; let k = 0;
  for (let i = 0; k < ids.length && i < 400; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    if (skip && skip(r, c)) continue;
    const x = x0 + r * dx + (hash(i * 3.1 + seed) - 0.5) * jitter, z = z0 + (c - (cols - 1) / 2) * dz + (hash(i * 5.7 + seed) - 0.5) * jitter;
    const ch = put(ctx, ids[k], L(x, 0, z), L.yaw + yaw + (hash(i * 7.3 + seed) - 0.5) * 0.4);
    list.push({ ch, k, x, z, ph: hash(k * 1.9 + seed) * 3 }); k++;
  }
  return list;
}
function crowdTick(list, t, { action = 'dance', face = 'grin', sync = false, speed = 1, faceT = null, faces = null } = {}) {
  list.forEach((m) => {
    const tt = sync ? t : t + m.ph;
    const a = typeof action === 'function' ? action(m) : action;
    m.ch.pose(a, tt, { speed });
    const f = faces ? faces[m.k % faces.length] : face;
    m.ch.face(f, faceT ?? tt);
  });
}
/** filler crowd layouts (town-local) */
function streetFill(x0, x1, { zHalf = 6.9, cols = 12, near = x1, seed = 3, step0 = 1.05, grow = 0.02, avoid = null } = {}) {
  const out = []; let x = x1, r = 0;
  while (x > x0) {
    for (let c = 0; c < cols; c++) {
      const z = -zHalf + (c + 0.5) * (2 * zHalf / cols) + (hash(r * 13.1 + c * 3.7 + seed) - 0.5) * 0.5;
      const xx = x + (hash(r * 7.3 + c * 1.9 + seed) - 0.5) * 0.5;
      if (avoid && avoid(xx, z)) continue;
      out.push({ x: xx, z, yaw: -PI / 2 + (hash(r * 2.2 + c) - 0.5) * 1.2, k: r * cols + c, s: 0.9 + 0.2 * hash(r * 5.5 + c) });
    }
    x -= step0 + Math.max(0, near - x) * grow; r++;
  }
  return out;
}
function ringFill(cx, cz, r0, r1, n, { seed = 5, face = 'in' } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = hash(i * 1.37 + seed) * PI * 2, r = r0 + (r1 - r0) * Math.sqrt(hash(i * 2.71 + seed));
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    out.push({ x, z, yaw: Math.atan2(cx - x, cz - z) + (face === 'in' ? 0 : PI) + (hash(i * 4.4) - 0.5) * 0.8, k: i, s: 0.9 + 0.2 * hash(i * 3.3) });
  }
  return out;
}
function filler(ctx, list) { const f = ctx.props.filler; ctx.add(f, ctx.set.root); f.position.set(0, 0, 0); f.userData.layout(list); return f; }

// ─── the picnic spot in the plaza mouth (party night)
function picnic(ctx, { light = 'party_night', party = true, rig = 'on', dancers = true, ladder = false, clear = [] } = {}) {
  const free = (x, z) => !clear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r);
  const L = town(ctx, { light, party, rig, ladder });
  const P = ctx.props;
  addTo(ctx, P.grass, PIC.x + 0.3, 0.0, PIC.z, 0);
  addTo(ctx, P.picnic, PIC.x, 0.06, PIC.z, PI / 2);
  let list = [];
  if (dancers) {
    const spots = [[36.5, -1.2], [37.6, 1.0], [36.2, 4.6], [38.4, 3.2], [39.2, -0.4], [35.4, 7.4], [37.8, 6.6], [40.4, 1.9], [40.8, 5.4], [35.0, -3.4], [38.0, -3.2], [41.6, -1.8], [34.6, 9.8], [36.9, 9.4]];
    list = spots.map(([x, z], k) => ({ x, z, k })).filter((m) => free(m.x, m.z)).map(({ x, z, k }) => ({ ch: put(ctx, CROWD[k + 2], L(x, 0, z), L.yaw - PI / 2 + (hash(k * 3.3) - 0.5) * 1.6), k, ph: hash(k * 1.9) * 3 }));
    filler(ctx, [...ringFill(44, 2, 6, 13, 120, { seed: 9 }), ...streetFill(-8, 24.5, { cols: 10, near: 24.5, seed: 12 })].filter((p) => free(p.x, p.z)));
  }
  ctx.store.L = L; ctx.store.dancers = list;
  return L;
}
function picnicTick(ctx, { arms = 'dance', notes = true, cam = null } = {}) {
  const t = ctx.t, P = ctx.props;
  crowdTick(ctx.store.dancers, t, { action: (m) => (m.k % 3 ? 'dance' : 'dance2'), faces: ['grin', 'laugh', 'huss', 'sweat'] });
  P.filler.userData.set(t, { arms });
  rigTick(ctx, { notes: 0, rings: 0 });
  if (notes) {
    const n = P.notes2; ctx.add(n); n.userData.begin();
    const L = ctx.store.L;
    for (let i = 0; i < 26; i++) { const u = (hash(i * 3.3) + t * 0.08) % 1; n.userData.add(L(PIC.x + 2 + 10 * hash(i * 1.1) - 4, 2.6 + 4 * hash(i * 2.2) + Math.sin(t + i) * 0.5, PIC.z - 6 + 14 * u), { s: 0.7, rot: 0.3 * Math.sin(t * 2 + i), ci: i }); }
    n.userData.end();
  }
}
/** narrator on the west bench facing west (feet on the ground) */
function benchSit(ctx, ch, t, { tap = 0, face = 'neutral', faceT = 0.5, intensity = 0.3, tapSide = 'R' } = {}) {
  ch.pose('sit', t, { seatHeight: 0.5, hands: 'lap', intensity });
  ch.face(face, faceT);
  if (tap > 0) {
    const J = ch.joints, a = Math.max(0, Math.sin(t * PI * 2 * 2.1));
    const S = tapSide;
    if (J['foot' + S]) J['foot' + S].rotation.x = -0.9 * a * tap; if (J['shin' + S]) J['shin' + S].rotation.x += -0.22 * a * tap; if (J['leg' + S]) J['leg' + S].rotation.x += -0.08 * a * tap;
  }
}

// ─── the town square at the fair (flashback, day) / party night
function square(ctx, { light = 'day', party = true, crowd = 24 } = {}) {
  const L = town(ctx, { light, party, rig: 'none' });
  const S = frameAt(ctx, 'square.stage'), P = ctx.props;
  ctx.add(P.booth); P.booth.position.copy(S(0, 0, 0.8)); P.booth.rotation.set(0, S.yaw, 0);
  const n = put(ctx, 'noodle', S(0, 0, -0.15), S.yaw);
  const ids = CROWD.slice(0, crowd);
  const list = ids.map((id, k) => {
    const cols = 6, col = k % cols, row = Math.floor(k / cols);
    const x = (col - (cols - 1) / 2) * 1.35 + (row % 2 ? 0.6 : 0) + (hash(k * 3.1) - 0.5) * 0.35, z = 5.2 + row * 1.35 + (hash(k * 5.7) - 0.5) * 0.3;
    return { ch: put(ctx, id, S(x, -0.8, z), S.yaw + PI + (hash(k * 7.3) - 0.5) * 0.5), k, x, z, ph: hash(k * 1.9) * 3 };
  });
  const fl = [];
  for (let i = 0; i < 150; i++) { const col = i % 12, row = Math.floor(i / 12); const p = S((col - 5.5) * 1.3 + (hash(i * 2.3) - 0.5) * 0.5, -0.8, 11.0 + row * 1.25 + (hash(i * 4.1) - 0.5) * 0.4); const loc = ctx.set.root.worldToLocal(p); fl.push({ x: loc.x, z: loc.z, yaw: S.yaw + PI + (hash(i) - 0.5) * 0.6, k: i, s: 0.92 + 0.15 * hash(i * 6.1) }); }
  filler(ctx, fl);
  ctx.store = { ...ctx.store, L, S, crowd: list, noodle: n };
  return { L, S };
}
function boothTick(ctx, { spin = 1, press = 0, glow = 1 } = {}) { ctx.props.booth.userData.set(ctx.t, { spin, press, glow, beat: beat(ctx.t) }); }

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
const B04 = [['BIMBALO!', '#ff4fa3'], ['FEZZA-REE!', '#ffd23f'], ['OONGA VAY!', '#3ee0c8'], ['DOOBLANNI!', '#8a5cff']];
const B13 = ['grandma', 'mailman', 'hummer', 'brandt', 'noodle', 'pigeon'];
export const shots = [
  // ── b01 "In this town, there's a song so catchy..."  dawn, the whole street dancing in sync, narrator deadpan in the middle
  {
    name: 'dawn crane', start: 0, set: 'town',
    setup(ctx) { dawnStreet(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store;
      dawnTick(ctx);
      const c = moveCam(ctx, { pos: L(16, 10.5, 2.8), look: L(-8, 0.6, 0), fov: 46 }, { pos: L(4.2, 2.5, 1.0), look: L(-8, 1.5, 0), fov: 44 }, ease.inOutSine(clamp(lt / 2.9, 0, 1)));
      if (lt > 0.6) meArrow(ctx, c);
      tag(ctx, '6:00 AM', 0.2, Infinity, { y: 0.12, size: 58, bg: 'rgba(255,120,60,0.85)' });
    },
  },
  {
    name: 'deadpan centre', start: 'b01.w12-0.1', set: 'town',
    setup(ctx) { dawnStreet(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store;
      dawnTick(ctx);
      const me = ctx.cast.me, f = humanFace(me);
      moveCam(ctx, { pos: L(-2.6, 1.05, 0.35), look: f.clone().add(V(0, -0.35, 0)), fov: 42 }, { pos: L(-3.6, 1.15, 0.3), look: f.clone().add(V(0, -0.15, 0)), fov: 38 }, ease.inOutSine(clamp(lt / 2.6, 0, 1)));
      tag(ctx, 'NOT DANCING', ctx.time('b01.w16'), Infinity, { y: 0.15, size: 60 });
    },
  },
  // ── b02 "It started at the town fair, when DJ Noodle played a mystery track."  flashback, day, the square
  {
    name: 'fair wide', start: 'b02-0.1', set: 'town',
    setup(ctx) { square(ctx, { light: 'day' }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t;
      fairTick(ctx, { action: 'idle' });
      djPose(ctx.cast.noodle, t); ctx.cast.noodle.face('smug', 0.5);
      boothTick(ctx);
      moveCam(ctx, { pos: S(1.2, 4.4, 16.2), look: S(0, 1.0, -1), fov: 41 }, { pos: S(0.9, 4.1, 14.6), look: S(0, 1.0, -1), fov: 40 }, ease.inOutSine(clamp(lt / 1.4, 0, 1)));
      flashbackLook(ctx);
      tag(ctx, 'ONE YEAR AGO', ctx.time('b02') - 0.05, Infinity, { y: 0.12, size: 74, fill: '#fff4d8', bg: 'rgba(60,30,10,0.88)', rot: 0 });
    },
  },
  {
    name: 'dj noodle', start: 'b02.w7-0.1', set: 'town',
    setup(ctx) { square(ctx, { light: 'day' }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t;
      fairTick(ctx, { action: 'idle' });
      djPose(ctx.cast.noodle, t); ctx.cast.noodle.face('grin', 0.5);
      boothTick(ctx);
      moveCam(ctx, { pos: S(1.6, 1.55, 4.6), look: S(0, 1.2, 0.1), fov: 44 }, { pos: S(1.3, 1.5, 4.0), look: S(0, 1.2, 0.1), fov: 42 }, ease.inOutSine(clamp(lt / 1.7, 0, 1)));
      flashbackLook(ctx);
      tag(ctx, 'DJ NOODLE', ctx.time('b02.w7'), Infinity, { y: 0.1, size: 80, fill: '#ffd23f', stroke: '#2a1200', bg: 'rgba(40,10,70,1)' });
      tag(ctx, 'MYSTERY TRACK', ctx.time('b02.w11'), Infinity, { y: 0.18, size: 58, bg: 'rgba(12,12,18,1)' });
    },
  },
  // ── b03 "It only had four words."  close on the smug face, then the big red button, slowly
  {
    name: 'smug face', start: 'b03-0.1', set: 'town',
    setup(ctx) { square(ctx, { light: 'day', crowd: 8 }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, n = ctx.cast.noodle;
      n.pose('idle', t, { intensity: 0.3 }); n.face('smug', 0.5);
      boothTick(ctx, { spin: 0.3 });
      const f = humanFace(n), fw = fwdOf(n), sd = sideOf(n);
      moveCam(ctx, { pos: f.clone().addScaledVector(fw, 3.8).addScaledVector(sd, 1.0).add(up(-0.25)), look: f.clone().add(up(-0.42)), fov: 34 }, { pos: f.clone().addScaledVector(fw, 3.4).addScaledVector(sd, 0.9).add(up(-0.25)), look: f.clone().add(up(-0.42)), fov: 34 }, clamp(lt / 1.0, 0, 1));
      flashbackLook(ctx); ctx.fx.vignette(0.6);
    },
  },
  {
    name: 'red button', start: 'b03.w3-0.05', set: 'town',
    setup(ctx) { square(ctx, { light: 'day', crowd: 0 }); },
    update(ctx, lt) {
      const { S } = ctx.store, t = ctx.t, n = ctx.cast.noodle, P = ctx.props;
      const tp = ctx.markers.bim - 0.17;
      const press = ease.inOutCubic(clamp((t - (tp - 0.08)) / 0.08, 0, 1));
      P.booth.userData.set(t, { spin: 0.3, press, glow: 1, beat: 0 });
      P.booth.updateMatrixWorld(true);
      const btn = P.booth.userData.button.getWorldPosition(V());
      const th = 0.7, tt = th + Math.min(0, t - tp) * 0.32;
      n.pose('slam', tt, { hits: [th], slamTarget: btn.clone().add(up(0.03)) }); n.face('smug', 0.5);
      n.joints.head.rotation.x -= 0.55;                       // chin up: smug look at the crowd while he presses
      const SV = (x, y, z) => S(x, y, z).sub(S(0, 0, 0));
      setCam(ctx, { pos: btn.clone().add(SV(0.55, 0.3, 1.95)), look: btn.clone().add(SV(0, 0.02, -0.2)), fov: 44 });
      flashbackLook(ctx); ctx.fx.vignette(0.65);
      if (t > tp) flash(ctx, tp, 0.2, '#ff3050', 0.35);
    },
  },
  // ── b04 "Bimbalo! Fezza-ree! Oonga vay! Dooblanni!"  stamped words over pulsing purple fair lights
  ...B04.map(([word, col], i) => ({
    name: `word ${i + 1}`, start: i === 0 ? 'b04.w0-0.1' : `b04.w${i === 1 ? 1 : i === 2 ? 2 : 4}-0.1`, set: 'town', captions: false,
    setup(ctx) { square(ctx, { light: 'day', party: true }); },
    update(ctx, lt) {
      const { S, L } = ctx.store, t = ctx.t, P = ctx.props;
      const pulse = beat(t, 126);
      townPurple(ctx, 0.45 + 0.35 * pulse);
      fairTick(ctx, { action: 'surprised', face: 'shocked' });
      djPose(ctx.cast.noodle, t); ctx.cast.noodle.face(i === 2 ? 'laugh' : 'grin', t);
      boothTick(ctx);
      // notes erupting from the booth over the crowd
      P.booth.updateMatrixWorld(true);
      const cams = [
        { pos: S(-1.2, 0.85, 3.7), look: S(0, 1.95, 0), fov: 50 },
        { pos: S(0.6, 1.45, 3.1), look: S(-0.4, 1.4, 7.5), fov: 44 },
        { pos: S(-1.5, 1.5, 3.3), look: S(0, 1.65, -0.1), fov: 42 },
        { pos: L(36, 13, 13), look: L(49, 0.5, 0), fov: 52 },
      ];
      const c = cams[i]; ctx.cam.set(c);
      const fsp = screenOf(c, humanFace(ctx.cast.noodle));
      const src = S(0, 1.6, -0.5), n = P.notes; ctx.add(n); n.userData.begin();
      for (let k = 0; k < 40; k++) {
        const u = (hash(k * 1.7) + (t - ctx.time('b04')) * 0.45) % 1, a = hash(k * 3.3) * PI - PI / 2;
        const q = src.clone().add(V(0, u * 4 + Math.sin(t * 3 + k) * 0.3, 0)).add(S(Math.sin(a) * u * 9, 0, Math.cos(a) * u * 12).sub(S(0, 0, 0)));
        const sp = screenOf(c, q); if (Math.hypot(sp.x - fsp.x, (sp.y - fsp.y) * 0.5625) < 0.15) continue;
        n.userData.add(q, { s: 0.6 + 1.0 * u, rot: 0.4 * Math.sin(t * 3 + k), ci: k });
      }
      n.userData.end();
      ctx.fx.overlay('#8a2be2', 0.12 + 0.16 * pulse);
      const tw = ctx.time(`b04.w${[0, 1, 2, 4][i]}`);
      stamp(ctx, word, tw, { y: 0.24, size: 150, fill: col, stroke: '#1d1d22', rot: i % 2 ? 0.08 : -0.08 });
      ctx.cam.punch([tw], t, 0.1, 0.25);
      ctx.fx.text("DON'T SING THIS", { x: 0.5, y: 0.86, size: 50, font: 'narr', fill: '#ffffff', stroke: '#000000', bg: 'rgba(200,20,40,0.9)', rot: 0 });
    },
  })),
  // ── b05 HUSS ×3: the whole fair snaps into dance2, party night kicks in
  ...[0, 1, 2].map((i) => ({
    name: `fair huss #${i + 1}`, start: i === 0 ? 'b05.h0-0.12' : `b05.h${i}-0.03`, set: 'town',
    setup(ctx) { square(ctx, { light: 'party_night', party: true, crowd: 24 }); },
    update(ctx) {
      const { S, L } = ctx.store, t = ctx.t, hits = ctx.hussTimes('b05').map((h) => h + 0.03);
      crowdTick(ctx.store.crowd, t, { action: 'dance2', sync: true, faces: ['huss', 'grin', 'huss', 'shocked'] });
      ctx.props.filler.userData.set(t, { arms: 'dance', speed: 1.1 });
      djPose(ctx.cast.noodle, t); ctx.cast.noodle.face('laugh', t);
      boothTick(ctx);
      const cams = [{ pos: S(0.7, 2.5, -1.7), look: S(0, 0.6, 8), fov: 52 }, { pos: S(-1.25, 1.3, 1.8), look: S(0.0, -1.15, 9), fov: 52 }, { pos: L(40, 13, -12), look: L(46.5, 0, 2), fov: 54 }];
      setCam(ctx, cams[i], 0.8, '#ff9ad8');
      ctx.cam.punch(hits, t, 0.1, 0.2);
      flash(ctx, hits[i], 0.18, ['#ff4fa3', '#8a5cff', '#3ee0c8'][i], 0.5);
    },
  })),
  // ── b06 "Now we have rules. Always wear headphones. Never hum. And never look a dancer in the eyes."
  {
    name: 'rules board', start: 'b06-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'day', rig: 'none' }), P = ctx.props;
      addTo(ctx, P.rules, -9, CURB, 6.7, PI);
      const walkers = ['x03', 'x08', 'x11', 'y02'].map((id, k) => ({ id, k, z: [5.6, 6.3, -6.2, -5.8][k], dir: [1, -1, 1, -1][k], x0: [-14, -4, -15, -3][k] }));
      walkers.forEach((w) => put(ctx, w.id, L(w.x0, CURB, w.z), 0));
      ctx.store = { ...ctx.store, L, walkers };
    },
    update(ctx, lt) {
      const { L, walkers } = ctx.store, t = ctx.t;
      walkers.forEach((w) => { const ch = ctx.cast[w.id]; ch.root.position.copy(L(w.x0 + w.dir * lt * 1.0, CURB, w.z)); ch.root.rotation.y = L.yaw + w.dir * PI / 2; ch.pose('walk', t + w.k); ch.face('neutral', t + w.k); });
      moveCam(ctx, { pos: L(-7.6, 1.8, -0.8), look: L(-9, 2.4, 6.7), fov: 42 }, { pos: L(-8.4, 2.0, 2.0), look: L(-9, 2.45, 6.7), fov: 40 }, ease.inOutSine(clamp(lt / 1.2, 0, 1)));
    },
  },
  {
    name: 'rule 1 headphones', start: 'b06.w4-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'day', rig: 'none' });
      const k = put(ctx, 'kid', L(-6, CURB, -6.1), L.yaw - PI / 2);
      phonesOn(ctx, k, ctx.props.kidPhones); ctx.props.kidPhones.scale.setScalar(1.55);
      put(ctx, 'x05', L(-11.5, CURB, -6.4), L.yaw + PI / 2);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, k = ctx.cast.kid;
      const x = -6 - lt * 0.8;
      k.root.position.copy(L(x, CURB, -6.1)); k.pose('walk', t, { speed: 1.2 }); k.face('smug', 0.4);
      const o = ctx.cast.x05; o.root.position.copy(L(-11.5 + lt * 0.9, CURB, -6.6)); o.pose('walk', t + 1); o.face('neutral', t);
      ctx.props.kidPhones.userData.set({ led: '#3cff6b', k: 1 });
      const f = humanFace(k);
      setCam(ctx, { pos: L(x - 1.8, 0.95, -2.7), look: f.clone().add(V(0.2, -0.36, 0)), fov: 50 });
      ruleCard(ctx, 1, 'ALWAYS WEAR\nHEADPHONES', ctx.time('b06.w4') - 0.05, 64);
    },
  },
  {
    name: 'rule 2 no humming', start: 'b06.w7-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'day', rig: 'none' });
      put(ctx, 'hummer', L(-17.6, CURB, 6.4), L.yaw + PI - 0.3);
      ctx.add(ctx.props.notes2);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, h = ctx.cast.hummer, P = ctx.props;
      h.pose('idle', t, { intensity: 0.6, headYaw: 0.15 * Math.sin(t * 3) }); h.face('sleepy', 0.4);
      const f = humanFace(h);
      const c = setCam(ctx, { pos: f.clone().add(V(-0.7, -0.15, -2.4)), look: f.clone().add(V(0, -0.15, 0)), fov: 34 });
      P.notes2.userData.begin(); noteStream(ctx, P.notes2, f.clone().add(V(0.1, -0.1, -0.1)), V(0.6, 0.9, -0.3).normalize(), t, { n: 8, len: 1.4, spread: 0.25, s: 0.35, rate: 0.5 }); P.notes2.userData.end();
      const th = ctx.time('b06.w8');
      if (t > th) banSign(ctx, screenOf(c, f.clone().add(up(-0.05))), th, 0.2);
      ruleCard(ctx, 2, 'NEVER HUM', ctx.time('b06.w7') - 0.05);
    },
  },
  {
    name: 'rule 3 no eye contact', start: 'b06.w9-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'day', rig: 'none' });
      const me = put(ctx, 'me', L(-19.5, CURB, -6.0), L.yaw + PI / 2); phonesOn(ctx, me);
      put(ctx, 'x07', L(-17.4, CURB, -6.6), L.yaw - PI / 2 + 0.6);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, d = ctx.cast.x07;
      const x = -19.5 + lt * 0.75;
      me.root.position.copy(L(x, CURB, -6.0)); me.pose('walk', t, { speed: 0.9 }); handOverEyes(me, 'R'); me.face('squint', 0.4);
      d.pose('dance2', t); d.face('huss', t);
      setCam(ctx, { pos: L(-18.3 + lt * 0.15, 1.45, -0.6), look: L(-18.3 + lt * 0.15, 1.15, -6.2), fov: 50 });
      ruleCard(ctx, 3, 'NO EYE CONTACT', ctx.time('b06.w9') - 0.05);
    },
  },
  // ── b07 "Mrs. Pell hummed it in the bakery. Twelve customers danced out the door."
  {
    name: 'bakery pell', start: 'b07-0.1', set: 'town',
    setup(ctx) { bakery(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, p = ctx.cast.pell, P = ctx.props;
      p.pose('idle', t, { intensity: 0.6, headYaw: 0.2 * Math.sin(t * 2.6) }); p.face('sleepy', 0.4);
      ['x02', 'x09', 'y05'].forEach((id, k) => { const ch = ctx.cast[id]; const tt = t + k; const go = t > ctx.time('b07.w2') + 0.3 + k * 0.15; ch.pose(go ? 'dance' : 'idle', tt, { intensity: go ? 0.5 : 0.4 }); ch.face(go ? 'shocked' : 'neutral', tt); });
      const f = humanFace(p);
      P.notes2.userData.begin(); noteStream(ctx, P.notes2, f.clone().add(V(0.1, -0.1, 0.15)), V(0.5, 0.9, 0.4).normalize(), t, { n: 10, len: 2.4, spread: 0.4, s: 0.45, rate: 0.4 }); P.notes2.userData.end();
      moveCam(ctx, { pos: L(-14.0, 2.45, -3.7), look: L(-14.0, 1.15, -9.6), fov: 46 }, { pos: L(-14.0, 2.4, -4.0), look: L(-14.0, 1.15, -9.6), fov: 44 }, ease.inOutSine(clamp(lt / 2.2, 0, 1)));
      tag(ctx, 'MRS. PELL', ctx.time('b07.w1'), Infinity, { y: 0.08, size: 70, bg: 'rgba(160,30,80,0.9)' });
      if (t > ctx.time('b07.w2')) tag(ctx, '♪ hmm hmm ♪', ctx.time('b07.w2'), Infinity, { x: 0.7, y: 0.22, size: 84, font: 'narr', bg: 'rgba(255,255,255,0.92)', fill: '#1d1d22', stroke: null, rot: 0.06 });
    },
  },
  {
    name: 'conga out the door', start: 'b07.w7-0.1', set: 'town',
    setup(ctx) {
      bakery(ctx, { conga: true });
    },
    update(ctx, lt) {
      const { L, conga } = ctx.store, t = ctx.t, p = ctx.cast.pell;
      p.pose('dance', t); p.face('laugh', t);
      congaTick(ctx, conga, t - ctx.time('b07.w7') + 1.4, 1.45);
      setCam(ctx, { pos: L(-16.5, 1.2, -4.6), look: L(-14.6, 1.1, -8.2), fov: 52 });
      stamp(ctx, 'x12', ctx.time('b07.w7') + 0.05, { y: 0.16, size: 140, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.08 });
    },
  },
  // ── b08 "Officer Brandt sneezed it. The whole police station did the worm."
  {
    name: 'brandt sneeze', start: 'b08-0.1', set: 'town',
    setup(ctx) { police(ctx); },
    update(ctx, lt) {
      const t = ctx.t, b = ctx.cast.brandt, P = ctx.props, ts = ctx.time('b08.w2') + 0.12;
      const d = t - ts;
      b.pose('idle', t, { intensity: 0.3 });
      if (d < 0) { const k = clamp((d + 0.5) / 0.5, 0, 1); b.joints.head.rotation.x -= 0.45 * k; b.joints.torso.rotation.x -= 0.15 * k; b.face(k > 0.3 ? 'squint' : 'neutral', 0.5); }
      else { const k = Math.exp(-d * 4); b.joints.head.rotation.x += 0.4 * k; b.joints.torso.rotation.x += 0.25 * k; b.face(d < 0.5 ? 'huss' : 'shocked', 0.5); }
      const f = humanFace(b), fw = fwdOf(b), sd = sideOf(b);
      const f0 = b.root.position.clone().add(up(1.75));   // stable reference (head bobs with the sneeze)
      // 3/4 front, face upper-left of centre; the sneeze sprays across the frame to the right (away from the lens side)
      setCam(ctx, { pos: f0.clone().addScaledVector(fw, 3.1).addScaledVector(sd, 1.5).add(up(-0.35)), look: f0.clone().add(up(-0.55)).addScaledVector(sd, -0.5).addScaledVector(fw, 0.2), fov: 48 }, 0.6, '#fff0e0');
      if (d > 0) {
        const sdir = fw.clone().multiplyScalar(0.6).addScaledVector(sd, -0.8).normalize();
        const mouth = f.clone().add(up(-0.2)).addScaledVector(fw, 0.2).addScaledVector(sdir, 0.62);
        const pf = P.sneeze; ctx.add(pf.root); pf.root.position.copy(mouth.clone().addScaledVector(sdir, 0.4 * clamp(d / 0.5, 0, 1))); pf.update(clamp(d / 0.8, 0, 1));
        const n = P.notes2; ctx.add(n); n.userData.begin(); noteStream(ctx, n, mouth, sdir.clone().add(up(0.15)).normalize(), t, { n: 10, len: 2.2 * clamp(d / 0.4, 0, 1), spread: 0.5, s: 0.4, rate: 0.6 }); n.userData.end();
        stamp(ctx, 'ACHOO!', ts, { y: 0.13, size: 150, fill: '#9fe8ff', stroke: '#1d1d22', rot: -0.1 });
      }
    },
  },
  {
    name: 'the worm', start: 'b08.w4-0.1', set: 'town',
    setup(ctx) { police(ctx, { worm: true }); },
    update(ctx, lt) {
      const { L, worms } = ctx.store, t = ctx.t;
      worms.forEach((w, k) => {
        const ch = ctx.cast[w.id], ph = t * PI * 2 * 1.6;
        ch.pose('crowdSurf', t, { lift: 0, intensity: 0.4 });
        ch.root.rotation.order = 'YXZ';
        ch.root.rotation.set(0.18 * Math.sin(ph), L.yaw - PI / 2, PI);           // face down, head toward +x (the camera)
        ch.root.position.copy(L(w.x, 0.42 + 0.14 * Math.max(0, Math.sin(ph)), w.z));
        ch.face('grin', t);
        const J = ch.joints; J.legL.rotation.x += 0.4 * Math.sin(ph - 1); J.legR.rotation.x += 0.4 * Math.sin(ph - 1); J.armL.rotation.z = -0.3; J.armR.rotation.z = 0.3;
        J.head.rotation.x = -1.75 + 0.15 * Math.sin(ph);                          // chin up: grin to the lens
      });
      moveCam(ctx, { pos: L(15.6, 2.2, 1.6), look: L(9.6, 0.05, -2.7), fov: 44 }, { pos: L(15.3, 2.15, 1.45), look: L(9.6, 0.05, -2.7), fov: 41 }, clamp(lt / 1.6, 0, 1), 0.8, '#fff0e0');
      tag(ctx, 'THE WORM', ctx.time('b08.w9'), Infinity, { y: 0.13, size: 84, fill: '#ffd23f', bg: 'rgba(30,50,110,0.9)' });
    },
  },
  // ── b09 "Me? I never take my headphones off. Not even in the shower."
  {
    name: 'asleep in phones', start: 'b09-0.1', set: 'room',
    setup(ctx) {
      const set = ctx.set; set.setLighting?.('night'); set.set?.('window', 'dark');
      set.root.updateMatrixWorld(true);
      const R = (x, y, z) => set.root.localToWorld(V(x, y, z)), Ry = yawOf(set.root);
      const me = put(ctx, 'me', R(-1.95, 0.5, -0.92), Ry); phonesOn(ctx, me);
      const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.5, 1.5), new THREE.MeshStandardMaterial({ color: '#3f6fb5', roughness: 0.9 })); duvet.rotation.y = Ry; duvet.castShadow = true; ctx.add(duvet);
      const fold = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.1, 0.22), new THREE.MeshStandardMaterial({ color: '#e8eef8', roughness: 0.9 })); fold.rotation.y = Ry; ctx.add(fold);
      ctx.add(ctx.props.zzz);
      ctx.store = { R, Ry, duvet, fold };
    },
    update(ctx, lt) {
      const { R } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      me.pose('crowdSurf', t, { lift: 0.06, intensity: 0.05 }); me.face('sleepy', 0.4);
      me.joints.armL.rotation.set(0.1, 0, -0.1); me.joints.armR.rotation.set(0.1, 0, 0.1);
      P.phones.userData.set({ led: '#3cff6b', k: 0.7 + 0.3 * Math.sin(t * 3) });
      const f = humanFace(me), set = ctx.set.root;
      // duvet up to the neck: from the neck toward the feet
      const hl = set.worldToLocal(headPt(me, 0, 0, 0));
      const { duvet, fold } = ctx.store; duvet.position.copy(R(-1.95, 0.8, hl.z + 0.12 + 0.75)); fold.position.copy(R(-1.95, 1.06, hl.z + 0.2));
      const fl = set.worldToLocal(f.clone());
            // aim at the chest so the face rises into the upper third and the caption lands on the duvet fold
      const c = moveCam(ctx, { pos: R(fl.x + 0.38, fl.y + 2.05, fl.z + 1.15), look: R(fl.x + 0.14, fl.y - 0.05, fl.z + 0.42), fov: 50 }, { pos: R(fl.x + 0.34, fl.y + 1.9, fl.z + 1.06), look: R(fl.x + 0.14, fl.y - 0.05, fl.z + 0.42), fov: 49 }, ease.inOutSine(clamp(lt / 2.3, 0, 1)), 0.9, '#ffe8c8');
      // Z floats in the dark gap up-left of his head (clear of the 24/7 tag), turned to the lens
      P.zzz.position.copy(R(fl.x - 0.36, fl.y + 0.25 + 0.06 * Math.sin(t * 2), fl.z - 0.12)); P.zzz.lookAt(c.pos);
      tag(ctx, '24/7', ctx.time('b09.w5'), Infinity, { y: 0.14, size: 80, bg: 'rgba(30,40,80,0.9)' });
    },
  },
  {
    name: 'shower cap', start: 'b09.w7-0.1', set: 'bath',
    setup(ctx) {
      const sp = ctx.anchor('bath.spot'); sp.updateMatrixWorld(true);
      const p = sp.getWorldPosition(V());
      const me = put(ctx, 'me', p, 0); phonesOn(ctx, me);
      const P = ctx.props; ctx.add(P.cap, me.joints.head); P.cap.position.set(0, 0.1, 0); P.cap.scale.setScalar(1.08);
      ctx.add(P.duck); P.duck.scale.setScalar(1.2);
      ctx.store.p = p;
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, p = ctx.store.p;
      me.pose('idle', t, { intensity: 0.4 }); me.face('smug', 0.5);
      const J = me.joints; J.armR.rotation.set(-1.25, 0, -0.25); if (J.foreArmR) J.foreArmR.rotation.x = -1.2;
      ctx.props.phones.userData.set({ led: '#3cff6b', k: 1 });
      const f = humanFace(me), fw = fwdOf(me);
      const hp = handPos(me, 'R'); ctx.props.duck.position.copy(hp).add(up(0.14)).addScaledVector(fw, 0.18); ctx.props.duck.rotation.set(0, me.root.rotation.y - PI / 2 + 0.6, 0);
      moveCam(ctx, { pos: f.clone().add(V(-0.3, -0.3, 3.2)), look: f.clone().add(V(-0.1, -0.45, 0)), fov: 40 }, { pos: f.clone().add(V(-0.25, -0.3, 2.9)), look: f.clone().add(V(-0.1, -0.45, 0)), fov: 38 }, ease.inOutSine(clamp(lt / 1.0, 0, 1)));
      tag(ctx, 'WATERPROOF', ctx.time('b09.w10'), Infinity, { y: 0.8, size: 72, bg: 'rgba(20,110,180,0.9)' });
    },
  },
  // ── b10 "Until yesterday, when someone in a hood, with glowing green eyes, hacked the clock tower speakers."
  {
    name: 'tower at night', start: 'b10-0.1', set: 'town',
    setup(ctx) { const L = town(ctx, { light: 'quiet_night', rig: 'pre' }); hackerSetup(ctx); ctx.store.L = L; },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t;
      hackerTick(ctx, { plug: 0 }); rigTick(ctx, { on: 0, notes: 0, rings: 0, glow: 0 });
      const c = moveCam(ctx, { pos: L(-27.5, 2.0, 3.6), look: L(TX, 11.5, TZ), fov: 52 }, { pos: L(-30, 2.6, 3.3), look: L(TX, 12.5, TZ), fov: 50 }, ease.inOutSine(clamp(lt / 1.2, 0, 1)));
      moonBehind(ctx, c, L(TX, 17, TZ), { dx: 0.12, dy: 0.12, size: 18 });
      ctx.fx.vignette(0.55);
      tag(ctx, 'YESTERDAY', ctx.time('b10.w1'), Infinity, { y: 0.13, size: 72, bg: 'rgba(20,30,60,0.9)' });
    },
  },
  {
    name: 'hooded figure', start: 'b10.w3-0.1', set: 'town',
    setup(ctx) { const L = town(ctx, { light: 'quiet_night', rig: 'pre' }); hackerSetup(ctx); ctx.store.L = L; },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t;
      hackerTick(ctx, { plug: 0 }); rigTick(ctx, { on: 0, notes: 0, rings: 0, glow: 0 });
      const hd = headPt(ctx.cast.hacker, 0, 0.35, 0);
      // from outside the south parapet, just above the merlons: he crouches at the socket, facing us, the moon behind his hood
      const c = moveCam(ctx, { pos: L(TX - 1.45, DY + 1.15, TZ - 5.0), look: L(TX + 0.05, DY + 0.9, TZ - 0.75), fov: 40 }, { pos: L(TX - 1.4, DY + 1.15, TZ - 4.7), look: L(TX + 0.05, DY + 0.92, TZ - 0.75), fov: 38 }, ease.inOutSine(clamp(lt / 1.4, 0, 1)), 0.7, '#a8c0ff');
      moonBehind(ctx, c, hd, { dx: 0.0, dy: 0.0, size: 22 });
      rim(ctx, hd.clone().add(c.pos.clone().sub(hd).normalize().multiplyScalar(-1.2)).add(up(0.5)), 14, '#a8d0ff');
      ctx.fx.vignette(0.55);
    },
  },
  {
    name: 'green eyes', start: 'green-0.15', set: 'town',
    setup(ctx) { const L = town(ctx, { light: 'quiet_night', rig: 'pre' }); hackerSetup(ctx); ctx.store.L = L; },
    update(ctx, lt) {
      const t = ctx.t, h = ctx.cast.hacker;
      const k = clamp((t - ctx.markers.green + 0.1) / 0.25, 0, 1);
      hackerTick(ctx, { plug: 0, eyes: 0.25 + 0.75 * k });
      h.root.position.copy(ctx.store.L(TX - 0.7, DY, TZ + 0.9)); h.root.rotation.set(0, ctx.store.L.yaw + PI / 2, 0); h.pose('idle', 0.5, { intensity: 0.2, headPitch: 0.15 });
      const f = headPt(h, 0, 0.33, 0.3), fwd = headPt(h, 0, 0.33, 1.0).sub(f).normalize();
      const c = setCam(ctx, { pos: f.clone().addScaledVector(fwd, 4.3 - 0.3 * k).add(V(0, 0.02, 0)), look: f.clone().add(up(-0.08)), fov: 32 }); moonBehind(ctx, c, f, { size: 22, dx: 0.12, dy: 0.05 });
      rim(ctx, f.clone().addScaledVector(fwd, -1.0).add(up(0.6)), 10, '#a8d0ff');
      ctx.fx.vignette(0.6);
    },
  },
  {
    name: 'hacked', start: 'b10.w11-0.12', set: 'town',
    setup(ctx) { const L = town(ctx, { light: 'quiet_night', rig: 'pre' }); hackerSetup(ctx); ctx.add(ctx.props.burst); ctx.store.L = L; },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, P = ctx.props;
      const tp = ctx.time('b10.w11') + 0.1, ts = ctx.time('b10.w15') - 0.35;
      const plug = clamp((t - tp + 0.3) / 0.3, 0, 1);
      hackerTick(ctx, { plug });
      const on = t > tp ? 1 : 0;
      rigTick(ctx, { on, notes: t > ts ? clamp((t - ts) / 0.6, 0, 1) : 0, rings: t > ts ? 1 : 0, glow: on });
      const h = holeLocal(ctx);
      P.burst.position.copy(L(h.x + 0.35, h.y + 0.05, h.z - 0.35)); P.burst.scale.setScalar(0.55); P.burst.userData.set(t - tp);
      ctx.add(P.green, ctx.set.root); P.green.position.set(h.x + 0.5, h.y + 0.5, h.z + 0.9); P.green.intensity = on * (0.8 + 2 * Math.exp(-(t - tp) * 3));
      const tilt = ease.inOutCubic(clamp((t - ts) / 0.7, 0, 1));
      P.plug.userData.set(on ? 0.45 : 0.1);
      // from outside the SE corner, low 3/4: the hand jamming the glowing plug into the socket, the green eyes above it, the moon behind
      const push = ease.inOutSine(clamp(lt / 0.8, 0, 1));
      const c0 = L(SOCK.x + 4.8, DY + 2.7, SOCK.z - 1.2).lerp(L(SOCK.x + 4.4, DY + 2.6, SOCK.z - 1.0), push);
      const c = setCam(ctx, { pos: c0.lerp(L(TX + 9.5, DY - 1.0, TZ + 3.0), tilt).add(up(3.0 * Math.sin(PI * tilt))), look: L(SOCK.x - 0.25, DY + 0.55, SOCK.z + 0.55).lerp(L(TX + 2.7, 13.4, TZ), tilt), fov: lerp(44, 50, tilt) }, 0.5, '#b8c8ff');
      if (tilt < 0.5) {
        moonBehind(ctx, c, headPt(ctx.cast.hacker, 0, 0.35, 0), { size: 20, dx: -0.06, dy: 0.1 });
        key(ctx, L(SOCK.x + 1.0, DY + 1.6, SOCK.z - 0.9), 8 * (1 - tilt * 2), '#c8ffd0');
        rim(ctx, L(SOCK.x - 1.4, DY + 2.0, SOCK.z + 2.2), 16 * (1 - tilt * 2), '#a8d0ff');
      }
      if (t > tp) { stamp(ctx, 'HACKED', tp, { y: 0.1, size: 150, fill: '#e8232b', stroke: '#000000', rot: -0.1 }); flash(ctx, tp, 0.25, '#7dff6a', 0.35); }
      ctx.fx.vignette(0.5);
    },
  },
  // ── b11 "The whole town started dancing. Grandma. The mailman. Even the pigeon."
  {
    name: 'speakers blast', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'party_night', party: true });
      filler(ctx, [...streetFill(-36, -14, { cols: 10, near: -14, seed: 4 }), ...ringFill(TX, TZ, 4.5, 11, 80, { seed: 2, face: 'in' })]);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t;
      rigTick(ctx);
      ctx.props.filler.userData.set(t, { arms: lt > 0.4 ? 'up' : 'dance' });
      const c = moveCam(ctx, { pos: L(-22, 2.4, 3.2), look: L(TX + 2.7, 13.0, TZ), fov: 54 }, { pos: L(-26, 5.5, 3.0), look: L(TX + 1, 12.5, TZ), fov: 54 }, ease.inOutSine(clamp(lt / 1.6, 0, 1)));
      ctx.cam.shake(0.08, t, 5);
      tag(ctx, 'WHOLE TOWN', ctx.time('b11.w1'), Infinity, { y: 0.13, size: 70, bg: 'rgba(120,20,140,0.9)' });
    },
  },
  {
    name: 'grandma dances', start: 'b11.w5-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'party_night', party: true });
      put(ctx, 'grandma', L(-6.0, CURB, 6.3), L.yaw + PI + 0.2);
      put(ctx, 'x10', L(-8.6, CURB, 6.9), L.yaw + PI - 0.3); put(ctx, 'x13', L(-3.8, CURB, 7.1), L.yaw + PI + 0.4);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, g = ctx.cast.grandma, P = ctx.props;
      const go = t > ctx.time('b11.w5') + 0.15;
      g.pose(go ? 'dance' : 'surprised', t, { speed: 1.1 }); g.face(go ? 'laugh' : 'shocked', go ? t : 0.4);
      ['x10', 'x13'].forEach((id, k) => { ctx.cast[id].pose('dance2', t + k); ctx.cast[id].face('grin', t + k); });
      const n = P.notes2; ctx.add(n); n.userData.begin(); noteStream(ctx, n, L(-2, 3.5, 1), V(-1, 0.1, 0.4).normalize(), t, { n: 12, len: 8, spread: 1.0, s: 0.6, rate: 0.3 }); n.userData.end();
      const c = moveCam(ctx, { pos: L(-4.9, 0.85, 3.4), look: L(-6.0, 1.4, 6.3), fov: 44 }, { pos: L(-5.1, 0.9, 3.8), look: L(-6.0, 1.45, 6.3), fov: 40 }, clamp(lt / 0.9, 0, 1), 0.9, '#ffd8f0');
      tag(ctx, 'GRANDMA', ctx.time('b11.w5'), Infinity, { y: 0.14, size: 80, bg: 'rgba(200,60,140,0.9)' });
    },
  },
  {
    name: 'mailman dances', start: 'b11.w6-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'party_night', party: true });
      put(ctx, 'mailman', L(6.2, CURB, -6.2), L.yaw - 0.2);
      ctx.props.letters.forEach((m) => ctx.add(m));
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, m = ctx.cast.mailman, P = ctx.props;
      const tg = ctx.time('b11.w7') + 0.05, go = t > tg;
      m.pose(go ? 'dance2' : 'walk', t, { speed: 1.2 }); m.face(go ? 'grin' : 'neutral', go ? t : 0.3);
      P.letters.forEach((l, i) => { const d = Math.max(0, t - tg); const a = i * 0.8; l.position.copy(L(6.2 + Math.cos(a) * d * 1.3, 1.3 + d * 2.6 - 2.2 * d * d + 0.8 * hash(i), -6.0 + Math.sin(a) * d * 1.3)); l.rotation.set(d * 5 + i, d * 3, i); l.visible = go && l.position.y > 0.05; });
      const n = P.notes2; ctx.add(n); n.userData.begin(); noteStream(ctx, n, L(10, 4, -2), V(-1, -0.1, -0.3).normalize(), t, { n: 10, len: 7, spread: 0.9, s: 0.55, rate: 0.3, seed: 3 }); n.userData.end();
      setCam(ctx, { pos: L(7.5, 1.05, -2.9), look: L(6.2, 1.35, -6.2), fov: 46 }, 0.9, '#d8e8ff');
      tag(ctx, 'THE MAILMAN', tg - 0.1, Infinity, { y: 0.14, size: 76, bg: 'rgba(40,80,160,0.9)' });
    },
  },
  {
    name: 'even the pigeon', start: 'b11.w8-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'party_night', party: true });
      put(ctx, 'pigeon', L(0.5, CURB, 5.0), L.yaw + PI - 0.5);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, pg = ctx.cast.pigeon, P = ctx.props;
      pg.pose('strut', t, { speed: 1.3 }); pg.face('grin', t);
      pg.joints.head.position.z += 0.03 * Math.sin(t * PI * 2 * 2.1);
      const n = P.notes2; ctx.add(n); n.userData.begin(); noteStream(ctx, n, L(0.5, 0.6, 4.4), V(-0.3, 0.8, -0.4).normalize(), t, { n: 8, len: 1.8, spread: 0.3, s: 0.22, rate: 0.5 }); n.userData.end();
      setCam(ctx, { pos: L(1.2, 0.38, 3.75), look: L(0.5, 0.42, 5.0), fov: 36 }, 0.6, '#ffe0c8');
      tag(ctx, 'EVEN THE PIGEON', ctx.time('b11.w8'), Infinity, { y: 0.14, size: 72, bg: 'rgba(80,80,90,0.9)' });
    },
  },
  // ── b12 "They danced all night... while they're out partying, by the way."
  {
    name: 'conga round the tower', start: 'b12-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'party_night', party: true });
      const ids = CROWD.slice(0, 16);
      ids.forEach((id) => put(ctx, id, L(TX, 0, TZ), 0));
      filler(ctx, [...ringFill(TX, TZ, 9, 16, 110, { seed: 7, face: 'in' }), ...streetFill(-36, -20, { cols: 10, near: -20, seed: 8 })]);
      ctx.store = { ...ctx.store, L, ids };
    },
    update(ctx, lt) {
      const { L, ids } = ctx.store, t = ctx.t;
      rigTick(ctx);
      ctx.props.filler.userData.set(t, { arms: 'up' });
      ids.forEach((id, k) => {
        const a = -t * 0.26 - k * 0.2, r = 6.6, ch = ctx.cast[id];
        ch.root.position.copy(L(TX + Math.cos(a) * r, 0.25 + 0.06 * Math.abs(Math.sin(t * 6.6 + k)), TZ + Math.sin(a) * r));
        ch.root.rotation.y = L.yaw + Math.atan2(Math.sin(a), -Math.cos(a)) + PI;
        ch.pose('walk', t * 1.2 + k * 0.3, { speed: 0.8 }); armsForward(ch, 1, -1.5); ch.face(k % 2 ? 'laugh' : 'grin', t + k);
      });
      moveCam(ctx, { pos: L(TX + 27, 9.0, TZ + 3.2), look: L(TX + 1, 8.0, TZ), fov: 56 }, { pos: L(TX + 26, 9.5, TZ + 3.0), look: L(TX + 1, 8.5, TZ), fov: 56 }, clamp(lt / 1.4, 0, 1), 0.6);
      tag(ctx, 'ALL NIGHT', ctx.time('b12.w2'), Infinity, { y: 0.13, size: 76, bg: 'rgba(120,20,140,0.9)' });
    },
  },
  {
    name: 'by the way', start: 'b12.w4-0.1', set: 'town',
    setup(ctx) { picnic(ctx); const me = put(ctx, 'me', ctx.store.L(BENCH_X, 0, PIC.z), ctx.store.L.yaw - PI / 2); phonesOn(ctx, me); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me;
      picnicTick(ctx);
      benchSit(ctx, me, t, { face: 'neutral', faceT: 0.6 });
      const J = me.joints; J.armL.rotation.set(-0.6, 0, -0.4); J.armR.rotation.set(-0.6, 0, 0.4);
      const f = humanFace(me);
      moveCam(ctx, { pos: L(BENCH_X - 4.4, 1.25, PIC.z - 0.9), look: f.clone().add(V(0, -0.45, 0)), fov: 42 }, { pos: L(BENCH_X - 3.8, 1.25, PIC.z - 0.8), look: f.clone().add(V(0, -0.4, 0)), fov: 40 }, clamp(lt / 1.7, 0, 1), 1.0, '#e0e8ff');
      ctx.fx.text("WHILE THEY'RE OUT\nPARTYING, BY THE WAY", { x: 0.5, y: 0.14, size: 62, font: 'narr', fill: '#ffffff', stroke: '#000000', bg: 'rgba(0,0,0,0.75)', rot: 0, scale: Math.max(0.01, ease.outBack(clamp((t - ctx.time('b12.w4')) / 0.2, 0, 1))) });
    },
  },
  // ── b13 HUSS ×6: dancers' huss faces under pink/purple strobes
  ...B13.map((id, i) => ({
    name: `strobe huss #${i + 1}`, start: i === 0 ? 'b13.h0-0.12' : `b13.h${i}-0.03`, set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'party_night', party: true });
      const spots = [[-6, 4.5], [6, -4.6], [-14, -4.2], [10, 3.8], [14, -4.4], [-2, 5.4]];   // (keep clear of the parked cars at x 20/−22/−30/26)
      const [x, z] = spots[i];
      const yw = (z > 0 ? PI : 0) + 0.25;
      put(ctx, id, L(x, id === 'pigeon' ? CURB : 0, z), L.yaw + yw);
      ctx.add(ctx.props.pink);
      // keep the line of sight to the camera clear (wide cut #4 sits 5.6 m out)
      const fx = Math.sin(yw), fz = Math.cos(yw), reach = i === 3 ? 6.8 : 3.2;
      const blocked = (xx, zz) => { const u = clamp((xx - x) * fx + (zz - z) * fz, 0, reach); return Math.hypot(xx - (x + fx * u), zz - (z + fz * u)) < (i === 3 ? 1.8 : 1.2); };
      // and nobody standing on or right next to the lens (approx. camera spot of this cut: [ahead, side] of the dancer)
      const [ca, cs] = [[2.6, 0.6], [2.4, -0.7], [1.9, 1.9], [5.6, -1.2], [2.6, -0.6], [1.15, 0.3]][i];
      const cx = x + fx * ca + fz * cs, cz = z + fz * ca - fx * cs;
      const nearCam = (xx, zz) => Math.hypot(xx - cx, zz - cz) < 2.2;
      filler(ctx, streetFill(x - 14, x + 6, { cols: 10, near: x + 6, seed: 20 + i, avoid: (xx, zz) => Math.hypot(xx - x, zz - z) < 2.6 || (z > 0 ? zz > z : zz < z) || blocked(xx, zz) || nearCam(xx, zz) }));
      ctx.store = { ...ctx.store, L, x, z };
    },
    update(ctx) {
      const { L } = ctx.store, t = ctx.t, ch = ctx.cast[id], P = ctx.props, hits = ctx.hussTimes('b13').map((h) => h + 0.03);
      if (id === 'pigeon') { ch.pose('huss', t, { hits: [hits[i]] }); ch.face('huss', t); }
      else { ch.pose('dance2', t, { speed: 1.3 }); ch.face('huss', 0.5); }
      P.filler.userData.set(t, { arms: 'up', speed: 1.3 });
      const f = id === 'pigeon' ? ch.joints.head.getWorldPosition(V()) : humanFace(ch);
      const fwd = fwdOf(ch), sd = sideOf(ch), f0 = id === 'pigeon' ? f : ch.root.position.clone().add(up(f.y - ch.root.position.y));
      // a different angle per cut: low dutch · high · profile · wide crowd · low dutch (other side) · pigeon close-up
      const camsB = [
        { pos: f0.clone().addScaledVector(fwd, 2.6).addScaledVector(sd, 0.6).add(up(-0.85)), look: f0.clone().add(up(-0.35)), fov: 40, roll: 0.22 },
        { pos: f0.clone().addScaledVector(fwd, 2.4).addScaledVector(sd, -0.7).add(up(1.3)), look: f0.clone().add(up(-0.75)), fov: 40 },
        { pos: f0.clone().addScaledVector(sd, 1.9).addScaledVector(fwd, 1.9).add(up(-0.15)), look: f0.clone().add(up(-0.35)), fov: 38 },
        { pos: f0.clone().addScaledVector(fwd, 5.6).addScaledVector(sd, -1.2).add(up(0.9)), look: f0.clone().add(up(-0.55)), fov: 46 },
        { pos: f0.clone().addScaledVector(fwd, 2.6).addScaledVector(sd, -0.6).add(up(-0.8)), look: f0.clone().add(up(-0.22)), fov: 40, roll: -0.22 },
        { pos: f.clone().addScaledVector(fwd, 1.15).add(up(0.08)).addScaledVector(sd, 0.3), look: f.clone().add(up(0.02)), fov: 36 },
      ];
      setCam(ctx, camsB[i]);
      const strobe = Math.floor(t * 14) % 2 ? 1 : 0.25;
      const col = ['#ff3fa8', '#3ee0ff', '#ffd23f'][i % 3];
      P.pink.color.set(col); P.pink.intensity = 14 * strobe; P.pink.position.copy(f).addScaledVector(fwd, 1.2).add(up(0.8));
      ctx.fx.overlay(col, 0.16 * strobe);
      ctx.cam.punch(hits, t, 0.12, 0.2);
      flash(ctx, hits[i], 0.12, '#ffffff', 0.5);
    },
  })),
  // ── b14 "Then my headphones beeped. Battery: five percent."
  {
    name: 'beep 5%', start: 'b14-0.1', set: 'town',
    setup(ctx) { picnic(ctx); const me = put(ctx, 'me', ctx.store.L(BENCH_X, 0, PIC.z), ctx.store.L.yaw - PI / 2); phonesOn(ctx, me); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      const tb = ctx.time('b14.w3');
      picnicTick(ctx, { notes: false });
      benchSit(ctx, me, t, { face: t > tb + 0.15 ? 'sweat' : 'neutral', faceT: 0.6 });
      me.joints.head.rotation.y += t > tb ? 0.25 * ease.outCubic(clamp((t - tb) / 0.3, 0, 1)) : 0;
      const red = t > tb && Math.floor(t * 4) % 2 === 0;
      P.phones.userData.set({ led: t > tb ? '#ff2a2a' : '#3cff6b', k: t > tb ? (red ? 1 : 0.25) : 1 });
      const ear = headPt(me, -0.4, 0.27, 0), f = humanFace(me);
      const f0 = L(BENCH_X, 0, PIC.z).add(up(f.y - L(0, 0, 0).y));
      const look = f0.clone().lerp(ear.clone().setY(f0.y), 0.1).add(up(-0.35));
      const c = moveCam(ctx, { pos: L(BENCH_X - 2.75, 1.25, PIC.z - 1.15), look, fov: 34 }, { pos: L(BENCH_X - 2.5, 1.25, PIC.z - 1.05), look, fov: 33 }, ease.inOutSine(clamp(lt / 2.4, 0, 1)), 1.1, '#e0e8ff');
      if (t > tb) { const sp = screenOf(c, ear); tag(ctx, 'BEEP!', tb, Infinity, { x: clamp(sp.x, 0.2, 0.8), y: clamp(sp.y - 0.12, 0.08, 0.4), size: 70, fill: '#ff3030', stroke: '#ffffff', bg: null, rot: 0.15 }); }
      battery(ctx, 5, { y: 0.1, s: 0.9, t0: ctx.time('b14.w4') - 0.05, blink: true });
    },
  },
  // ── b15 "Four. Three. The song leaked in. My foot started tapping. Ah, almost... almost!"
  {
    name: 'four three', start: 'b15-0.1', set: 'town',
    setup(ctx) { picnic(ctx); const me = put(ctx, 'me', ctx.store.L(BENCH_X, 0, PIC.z), ctx.store.L.yaw - PI / 2); phonesOn(ctx, me); ctx.add(ctx.props.notes); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      picnicTick(ctx, { notes: false });
      benchSit(ctx, me, t, { face: 'sweat', faceT: 0.6 });
      const red = Math.floor(t * 4) % 2 === 0;
      P.phones.userData.set({ led: '#ff2a2a', k: red ? 1 : 0.25 });
      const f = humanFace(me);
      // notes leaking in, spiralling toward his head
      const leak = clamp((t - ctx.time('b15')) / 1.0, 0, 1);
      P.notes.userData.begin();
      const f0 = L(BENCH_X, 0, PIC.z).add(up(f.y - L(0, 0, 0).y));
      const cr = L(0, 0, -1).sub(L(0, 0, 0)), cf = L(-1, 0, 0).sub(L(0, 0, 0));      // camera right / toward camera (he faces −x)
      for (let i = 0; i < 24; i++) { const u = (hash(i * 2.1) + t * 0.4) % 1, a = i * 1.7 + t * 2.2, r = (1 - u) * 1.15 + 0.42; P.notes.userData.add(f.clone().addScaledVector(cr, Math.cos(a) * r * 0.75).add(up(Math.sin(a) * r * 0.9 + 0.1)).addScaledVector(cf, 0.25), { s: 0.68 * leak * Math.sin(PI * Math.min(1, u * 1.2)), rot: Math.sin(t * 3 + i) * 0.4, ci: i }); }
      P.notes.userData.end();
      moveCam(ctx, { pos: L(BENCH_X - 3.3, 0.6, PIC.z - 0.5), look: f0.clone().add(up(-0.55)), fov: 44 }, { pos: L(BENCH_X - 2.9, 0.6, PIC.z - 0.45), look: f0.clone().add(up(-0.5)), fov: 42 }, clamp(lt / 2.5, 0, 1), 1.1, '#e0e8ff');
      const pct = t < ctx.time('b15.w1') - 0.02 ? 4 : 3;
      battery(ctx, pct, { y: 0.12, s: 1.0, t0: ctx.time('b15') - 0.05, blink: true });
      if (Math.abs(t - ctx.time('b15.w1')) < 0.12) ctx.cam.shake(0.2, t, 4);
      ctx.cam.punch([ctx.time('b15.w0'), ctx.time('b15.w1')], t, 0.06, 0.2);
    },
  },
  {
    name: 'foot tapping', start: 'b15.w6-0.1', set: 'town',
    setup(ctx) { picnic(ctx, { clear: [[BENCH_X - 1.2, PIC.z + 2.7, 2.6]] }); const me = put(ctx, 'me', ctx.store.L(BENCH_X, 0, PIC.z), ctx.store.L.yaw - PI / 2); phonesOn(ctx, me); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me;
      picnicTick(ctx, { notes: false });
      const tap = clamp((t - ctx.time('b15.w7')) / 0.3, 0, 1);
      benchSit(ctx, me, t, { tap, face: 'sweat', faceT: 0.6, tapSide: 'L' });
      const ft0 = L(BENCH_X - 0.62, 0.1, PIC.z + 0.2);       // stable: where the left foot rests
      const LV = (x, y, z) => L(x, y, z).sub(L(0, 0, 0));
      setCam(ctx, { pos: ft0.clone().add(LV(-0.55, 0.12, 2.5)), look: ft0.clone().add(LV(0.05, 0.38, 0)), fov: 38 }, 1.0, '#e0e8ff');
      const ph = (t * 2.1) % 1, nb = Math.floor(t * 2.1);
      if (tap > 0.5 && ph > 0.12 && ph < 0.12 + 0.15 * 2.1) tag(ctx, 'TAP', t - (ph - 0.12) / 2.1, Infinity, { x: 0.36 + 0.28 * (nb % 2), y: 0.28, size: 100, fill: '#ffd23f', bg: null, rot: nb % 2 ? 0.12 : -0.12 });
      battery(ctx, 3, { y: 0.13, s: 0.8, blink: true });
    },
  },
  {
    name: 'almost', start: 'b15.w10-0.1', set: 'town',
    setup(ctx) { picnic(ctx); const me = put(ctx, 'me', ctx.store.L(BENCH_X, 0, PIC.z), ctx.store.L.yaw - PI / 2); phonesOn(ctx, me); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me;
      picnicTick(ctx, { notes: false });
      const ta = ctx.time('b15.w10'), tj = ctx.markers.almost, t2 = ctx.time('b15.w12');
      if (t < tj) {
        const u = clamp((t - ta) / (tj - ta), 0, 1);
        me.poseMix('sit', t, { seatHeight: 0.5, hands: 'lap' }, 'dance2', t, { speed: 1.2 }, ease.inOutSine(u));
        me.root.position.copy(L(BENCH_X - 0.33 * u, 0, PIC.z));
        me.face('grin', t);
      } else {
        me.root.position.copy(L(BENCH_X - 0.33, 0, PIC.z));
        me.pose('stunned', t); me.face('shocked', 0.5);
        const j = Math.exp(-(t - tj) * 6) + (t > t2 ? Math.exp(-(t - t2) * 6) : 0);
        me.joints.torso.rotation.x -= 0.25 * j; me.root.position.y += 0.12 * j;
      }
      const f = humanFace(me);
      setCam(ctx, { pos: L(BENCH_X - 3.6, 1.2, PIC.z + 0.5), look: f.clone().add(up(-0.55)), fov: 42 }, 1.0, '#e0e8ff');
      if (t > tj) { stamp(ctx, 'ALMOST...', tj, { y: 0.09, size: 120, fill: '#ffffff', stroke: '#e8232b' }); }
      if (t > t2) stamp(ctx, 'ALMOST!', t2, { y: 0.8, size: 130, fill: '#ffd23f', stroke: '#1d1d22', rot: 0.08 });
      ctx.cam.punch([tj, t2], t, 0.1, 0.25);
      battery(ctx, 3, { x: 0.5, y: 0.93, s: 0.55, blink: true });
    },
  },
  // ── b16 "I had to reach the clock tower. But the streets were jammed."
  {
    name: 'jammed streets', start: 'b16-0.1', set: 'town',
    setup(ctx) {
      const L = picnic(ctx, { dancers: false });
      const me = put(ctx, 'me', L(BENCH_X - 0.4, 0, PIC.z + 0.1), L.yaw - PI / 2 + 0.05); phonesOn(ctx, me);
      const near = CROWD.slice(0, 24).map((id, k) => { const c = k % 6, r = Math.floor(k / 6); const x = 27.6 - r * 1.5 + (hash(k) - 0.5) * 0.4, z = -3.9 + c * 1.5 + (hash(k * 2) - 0.5) * 0.4; return { ch: put(ctx, id, L(x, 0, z), L.yaw + PI / 2 + (hash(k * 3) - 0.5) * 1.2), k, ph: hash(k * 1.9) * 3 }; });
      filler(ctx, streetFill(-48, 21.5, { zHalf: 7.2, cols: 13, near: 21.5, step0: 0.95, grow: 0.018, seed: 31 }));
      ctx.add(ctx.props.towerGlow, ctx.set.root); ctx.props.towerGlow.position.set(TX, DY + 2, TZ);
      ctx.store = { ...ctx.store, L, near };
    },
    update(ctx, lt) {
      const { L, near } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      rigTick(ctx, { notes: 1, rings: 0.4 });
      crowdTick(near, t, { action: (m) => (m.k % 2 ? 'dance' : 'dance2'), faces: ['grin', 'huss', 'laugh'] });
      P.filler.userData.set(t, { arms: 'up', speed: 1.1 });
      me.pose('idle', t, { intensity: 0.4 }); me.face('sweat', 0.6);
      P.phones.userData.set({ led: '#ff2a2a', k: Math.floor(t * 4) % 2 ? 1 : 0.25 });
      P.towerGlow.material.opacity = 0.45 + 0.15 * beat(t);
      const c = moveCam(ctx, { pos: L(BENCH_X + 1.5, 3.8, PIC.z + 0.7), look: L(-30, 0.6, 0.4), fov: 40 }, { pos: L(BENCH_X + 1.4, 3.8, PIC.z + 0.65), look: L(-30, 2.6, 0.4), fov: 30 }, ease.inOutSine(clamp(lt / 2.6, 0, 1)));
      battery(ctx, 2, { y: 0.86, s: 0.8, t0: ctx.time('b16') - 0.05, blink: true });
      const tw = screenOf(c, L(TX, DY + 3.2, TZ));
      if (t > ctx.time('b16.w5') && tw.y > 0.06) { tag(ctx, 'CLOCK TOWER', ctx.time('b16.w5'), Infinity, { x: clamp(tw.x, 0.25, 0.75), y: clamp(tw.y - 0.05, 0.05, 0.3), size: 50, bg: 'rgba(20,20,30,0.85)', rot: 0 }); }
      if (t > ctx.time('b16.w11')) stamp(ctx, 'JAMMED', ctx.time('b16.w11'), { y: 0.72, size: 120, fill: '#e8232b', stroke: '#ffffff', rot: -0.06 });
    },
  },
  // ── b17 "Then it hit me. If they have to dance... they can dance me there."
  {
    name: 'lightbulb', start: 'b17-0.1', set: 'town',
    setup(ctx) { picnic(ctx); const me = put(ctx, 'me', ctx.store.L(BENCH_X - 0.5, 0, PIC.z), ctx.store.L.yaw - PI / 2); phonesOn(ctx, me); ctx.add(ctx.props.bulb); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, th = ctx.time('b17.w2');
      picnicTick(ctx, { notes: false });
      me.pose('think', t, { intensity: 0.5 }); me.face(t > th + 0.1 ? 'grin' : 'squint', 0.6);
      P.phones.userData.set({ led: '#ff2a2a', k: Math.floor(t * 4) % 2 ? 1 : 0.25 });
      const hd = headPt(me, 0, 0.6, 0);
      const k = t > th ? ease.outBack(clamp((t - th) / 0.25, 0, 1)) : 0;
      P.bulb.position.copy(hd).add(up(0.65 + 0.05 * Math.sin(t * 3))); P.bulb.userData.set(k); P.bulb.rotation.y = me.root.rotation.y;
      const f = humanFace(me);
      const f0 = L(BENCH_X - 0.5, 0, PIC.z).add(up(f.y - L(0, 0, 0).y));
      const cam = setCam(ctx, { pos: L(BENCH_X - 4.4, 1.15, PIC.z - 0.8), look: f0.clone().add(up(-0.25)), fov: 46 }, 1.0, '#e0e8ff');
      // the "idea" pop: a quick radial burst around the bulb only (no full-frame wash)
      const dp = t - th;
      if (dp >= 0 && dp < 0.16) {
        const sp = screenOf(cam, P.bulb.position), a = 0.75 * (1 - dp / 0.16), rr = 0.1 + 0.25 * (dp / 0.16);
        ctx.fx.draw((g, W, H) => { const gr = g.createRadialGradient(sp.x * W, sp.y * H, 0, sp.x * W, sp.y * H, rr * W); gr.addColorStop(0, `rgba(255,250,200,${a})`); gr.addColorStop(1, 'rgba(255,240,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
      }
      battery(ctx, 2, { x: 0.5, y: 0.93, s: 0.55, blink: true });
    },
  },
  {
    name: 'sly grin', start: 'b17.w9-0.1', set: 'town',
    setup(ctx) { picnic(ctx); const me = put(ctx, 'me', ctx.store.L(BENCH_X - 0.5, 0, PIC.z), ctx.store.L.yaw - PI / 2 + 0.3); phonesOn(ctx, me); ctx.add(ctx.props.bulb); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      picnicTick(ctx, { notes: true });
      me.pose('idle', t, { intensity: 0.3, headYaw: -0.25 }); me.face('smug', 0.6);
      P.phones.userData.set({ led: '#ff2a2a', k: Math.floor(t * 4) % 2 ? 1 : 0.25 });
      const f = humanFace(me);
      P.bulb.position.copy(headPt(me, 0, 1.25, 0)); P.bulb.userData.set(0.8);
      const f0 = L(BENCH_X - 0.5, 0, PIC.z).add(up(f.y - L(0, 0, 0).y)), LV = (x, y, z) => L(x, y, z).sub(L(0, 0, 0));
      moveCam(ctx, { pos: f0.clone().add(LV(-3.4, -1.1, 1.1)), look: f0.clone().add(up(-0.4)), fov: 44 }, { pos: f0.clone().add(LV(-2.8, -1.05, 0.9)), look: f0.clone().add(up(-0.38)), fov: 42 }, ease.inOutSine(clamp(lt / 1.2, 0, 1)), 1.0, '#e0e8ff');
    },
  },
  // ── b18 "I squeezed my eyes shut ... and dove into the crowd. Goon Squad!"
  {
    name: 'eyes shut', start: 'b18-0.1', set: 'town',
    setup(ctx) { tableStand(ctx, { clear: [[PIC.x + 3.4, PIC.z - 1.3, 2.0], [PIC.x + 1.6, PIC.z - 0.6, 1.2]] }); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me;
      tableTick(ctx);
      me.pose('idle', t, { intensity: 0.3 }); me.face(t > ctx.time('b18.w1') ? 'huss' : 'determined', 0.5);
      const f = humanFace(me), LV = (x, y, z) => L(x, y, z).sub(L(0, 0, 0));
      const f0 = L(PIC.x - 0.2, 0, PIC.z).add(up(f.y - L(0, 0, 0).y));
      // front 3/4 (he faces +x): both eyes squeezed shut, one headphone cup at the edge of the head, face above the captions
      moveCam(ctx, { pos: f0.clone().add(LV(3.6, -0.55, -1.45)), look: f0.clone().add(up(-0.5)), fov: 42 }, { pos: f0.clone().add(LV(3.1, -0.5, -1.25)), look: f0.clone().add(up(-0.48)), fov: 42 }, clamp(lt / 1.6, 0, 1), 1.0, '#e0e8ff');
      key(ctx, f0.clone().add(LV(1.6, 0.9, -0.6)), 10, '#ffe0c0');
      tag(ctx, 'NO EYE CONTACT', ctx.time('b18.w5'), Infinity, { y: 0.13, size: 62, bg: 'rgba(210,20,45,0.9)' });
    },
  },
  {
    name: 'arms out hero', start: 'b18.w7-0.1', set: 'town',
    setup(ctx) { tableStand(ctx, { clear: [[PIC.x + 4.4, PIC.z - 1.3, 3.4], [PIC.x + 2.0, PIC.z - 0.6, 2.2]] }); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me;
      tableTick(ctx);
      me.pose('idle', t, { intensity: 0.3 }); me.face('huss', 0.5);
      const k = ease.outCubic(clamp(lt / 0.5, 0, 1));
      me.joints.armL.rotation.set(0, 0, 1.45 * k); me.joints.armR.rotation.set(0, 0, -1.45 * k);
      if (me.joints.foreArmL) { me.joints.foreArmL.rotation.x = 0; me.joints.foreArmR.rotation.x = 0; }
      setCam(ctx, { pos: L(PIC.x + 4.4, 0.5, PIC.z - 1.3), look: L(PIC.x - 0.2, 2.0, PIC.z), fov: 54 }, 1.2, '#ffe8d0');
      key(ctx, L(PIC.x + 1.6, 3.6, PIC.z - 0.6), 18); rim(ctx, L(PIC.x - 1.6, 3.2, PIC.z + 0.4), 14, '#c8a0ff');
    },
  },
  {
    name: 'trust fall', start: 'b18.w15-0.1', set: 'town',
    setup(ctx) { tableStand(ctx, { catchers: true, drop: (dx, dz) => dz > 1.5, clear: [[PIC.x + 4.4, PIC.z - 1.6, 2.6], [PIC.x + 2.2, PIC.z - 0.9, 1.6]] }); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, td = ctx.time('b18.w15');
      tableTick(ctx, { catchAt: ctx.markers.goon });
      const u = ease.inCubic(clamp((t - td) / 0.75, 0, 1));
      me.pose('idle', t, { intensity: 0.2 }); me.face('huss', 0.5);
      me.joints.armL.rotation.set(0, 0, 1.45); me.joints.armR.rotation.set(0, 0, -1.45);
      me.root.rotation.set(0, L.yaw + PI / 2, 0); me.root.position.copy(L(PIC.x - 0.2, 0.82, PIC.z));
      const LV = (x, y, z) => L(x, y, z).sub(L(0, 0, 0)), f0 = humanFace(me);   // standing face: a stable reference for the camera
      me.root.rotation.set(-u * PI / 2 * 0.92, L.yaw + PI / 2, 0);
      me.root.position.copy(L(PIC.x - 0.2 - 0.9 * u, 0.82 + 0.5 * u, PIC.z));
      // from his front (+x, the table side): face and outstretched arms stay in view as he tips back into the raised hands
      setCam(ctx, { pos: f0.clone().add(LV(3.5, 1.6, -1.6)), look: f0.clone().add(LV(-1.3, -1.2, 0)), fov: 52 }, 1.4, '#e0e8ff');
      key(ctx, f0.clone().add(LV(1.8, 1.2, -0.8)), 10, '#ffe0c0');
      if (t > td) tag(ctx, 'WHOOSH', td + 0.05, Infinity, { x: 0.32, y: 0.1, size: 80, fill: '#ffffff', bg: null, rot: -0.2 });
    },
  },
  {
    name: 'goon squad', start: 'goon-0.1', set: 'town',
    setup(ctx) { tableStand(ctx, { catchers: true, drop: (dx, dz) => dz >= 1.9 || (dz > 0.5 && dx > -2.0), clear: [[PIC.x + 0.6, PIC.z + 1.6, 2.2]] }); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, tg = ctx.markers.goon;
      tableTick(ctx, { catchAt: tg });
      me.pose('crowdSurf', t, { lift: 0, intensity: 0.6 }); me.face('huss', 0.5);
      me.root.rotation.set(0, L.yaw + PI / 2, 0);
      me.root.position.copy(L(PIC.x - 2.8, 2.25 + 0.05 * Math.sin(t * 6), PIC.z));
      setCam(ctx, { pos: L(PIC.x + 0.6, 4.2, PIC.z + 1.6), look: L(PIC.x - 2.9, 1.75, PIC.z - 0.1), fov: 48 }, 1.6, '#e0e8ff');
      stamp(ctx, 'GOON SQUAD!', tg, { y: 0.16, size: 120, fill: '#ffd23f', stroke: '#1d1d22', rot: -0.07 });
      ctx.cam.punch([tg], t, 0.12, 0.25);
    },
  },
  // ── b19 "The whole town passed me over their heads, right to the clock tower."
  {
    name: 'surf track', start: 'b19-0.1', set: 'town',
    setup(ctx) { surfSetup(ctx, 0); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me;
      const x = 13 - (t - ctx.time('b19')) * 5.2;
      surfTick(ctx, x);
      // high above his feet end (he faces up, head toward +x), pitched down so his up-turned face reads upright (like 'goon squad')
      setCam(ctx, { pos: L(x - 2.6, 5.8, 1.4), look: L(x + 0.3, 2.6, 0.15), fov: 46 }, 1.2, '#e0e8ff');
      key(ctx, headPt(me, 0, 0.3, 0).add(L(1.2, 1.6, 2.2).sub(L(0, 0, 0))), 14);
      tag(ctx, 'NEXT STOP: CLOCK TOWER', ctx.time('b19.w3'), Infinity, { y: 0.14, size: 54, bg: 'rgba(20,20,30,0.85)' });
    },
  },
  {
    name: 'surf to the tower', start: 'b19.w8-0.1', set: 'town',
    setup(ctx) { surfSetup(ctx, 1); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t;
      const x = -30 - (t - ctx.time('b19.w8')) * 6.5;
      surfTick(ctx, x);
      const c = setCam(ctx, { pos: L(x + 4.0, 3.7, 1.9), look: L(x - 6, 5.0, 1.1), fov: 60 }, 1.4);
      meArrow(ctx, c);
      battery(ctx, 2, { y: 0.88, s: 0.75, blink: true });
    },
  },
  // ── b20 "I climbed the ladder. One percent left. I yanked the plug."
  {
    name: 'climb', start: 'b20-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'party_night', party: true, ladder: true });
      const me = put(ctx, 'me', L(TX + 0.9, 4, TZ + 4.0), L.yaw + PI); phonesOn(ctx, me);
      filler(ctx, ringFill(TX, TZ, 3.8, 14, 160, { seed: 3, face: 'in' }));
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      rigTick(ctx);
      P.filler.userData.set(t, { arms: 'up' });
      const y = 3.0 + (t - ctx.time('b20')) * 4.2;
      me.root.position.copy(L(TX + 0.9, y, TZ + 4.1 - y * 0.065 + 0.3));
      climbPose(me, t * 1.5); me.face('determined', 0.5);
      P.phones.userData.set({ led: '#ff2a2a', k: Math.floor(t * 5) % 2 ? 1 : 0.2 });
      moveCam(ctx, { pos: L(TX + 3.0, 1.3, TZ + 8.6), look: L(TX + 0.9, y + 0.8, TZ + 3.6), fov: 56 }, { pos: L(TX + 2.6, 1.4, TZ + 8.2), look: L(TX + 0.9, y + 1.4, TZ + 3.6), fov: 56 }, clamp(lt / 1.1, 0, 1), 0.6);
      battery(ctx, 2, { y: 0.13, s: 0.85, blink: true });
    },
  },
  {
    name: 'one percent', start: 'b20.w4-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'party_night', party: true, ladder: true });
      const me = put(ctx, 'me', L(SOCK.x, DY, SOCK.z + 1.55), L.yaw + PI); phonesOn(ctx, me);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      rigTick(ctx, { notes: 1, rings: 0 });
      me.pose('idle', t, { intensity: 0.7 }); me.face('sweat', 0.6);
      P.phones.userData.set({ led: '#ff2a2a', k: Math.floor(t * 5) % 2 ? 1 : 0.2 });
      const f = humanFace(me);
      moveCam(ctx, { pos: f.clone().add(V(-0.9, 0.05, -1.75)), look: f.clone().add(up(-0.08)), fov: 36 }, { pos: f.clone().add(V(-0.7, 0.05, -1.45)), look: f.clone().add(up(-0.06)), fov: 34 }, clamp(lt / 1.2, 0, 1), 1.0, '#ffd8c8');
      battery(ctx, 1, { y: 0.16, s: 1.25, t0: ctx.time('b20.w4') - 0.05, blink: true });
      ctx.cam.shake(0.06, t, 3);
    },
  },
  {
    name: 'yank', start: 'b20.w7-0.12', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'party_night', party: true, ladder: true });
      const me = put(ctx, 'me', L(SOCK.x, DY, SOCK.z + 1.25), L.yaw + PI); phonesOn(ctx, me);
      ctx.add(ctx.props.burstY);
      ctx.store.L = L;
    },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, ty = ctx.time('b20.w10') + 0.02;
      const off = t > ty;
      rigTick(ctx, { on: off ? 0 : 1, notes: off ? 0 : 1, rings: off ? 0 : 1, glow: off ? 0 : 1 });
      me.pose('idle', t, { intensity: 0.3 }); me.face(off ? 'shocked' : 'determined', 0.5);
      const y = ease.outCubic(clamp((t - ty) / 0.25, 0, 1));
      armsForward(me, 1, lerp(-1.35, -1.1, y));
      me.joints.armL.rotation.z = 0.07; me.joints.armR.rotation.z = -0.07; // hands on the plug, before and after the yank
      me.joints.torso.rotation.x -= 0.35 * y; me.root.position.copy(L(SOCK.x, DY, SOCK.z + 1.25 + 0.25 * y));
      const a = handPos(me, 'L'), b = handPos(me, 'R'), mid = a.lerp(b, 0.5);
      const h = holeLocal(ctx);
      if (!off) plugAt(ctx, 'socket'); else { const loc = ctx.set.root.worldToLocal(mid.clone()); plugAt(ctx, V(loc.x, loc.y + 0.05, loc.z - 0.3), PI, -0.3 * y); } // body between his hands, prongs out toward the socket
      // sparks jet up and away from both the lens and his face (screen-right / behind the socket)
      P.burstY.position.copy(L(h.x, h.y, h.z + 0.2)); P.burstY.rotation.set(0, 0, 0);
      P.burstY.userData.aim(L(-1.0, 1.0, -0.4).sub(L(0, 0, 0)), 0.75); P.burstY.userData.set(t - ty);
      P.phones.userData.set({ led: '#ff2a2a', k: Math.floor(t * 5) % 2 ? 1 : 0.2 });
      // his front 3/4 at hand height, off the socket's axis: the plug rips out above the socket line toward him
      setCam(ctx, { pos: L(SOCK.x + 1.5, DY + 2.5, SOCK.z - 1.3), look: L(SOCK.x + 0.15, DY + 1.42, SOCK.z + 0.9), fov: 50 }, 1.4, '#ffd8c8');
      key(ctx, L(SOCK.x + 0.9, DY + 2.2, SOCK.z - 0.4), 12, '#ffe0b0');
      if (off) { flash(ctx, ty, 0.2, '#fff3b0', 0.35); stamp(ctx, 'YANK!', ty, { y: 0.1, size: 160, fill: '#ffd23f', stroke: '#1d1d22' }); if (t - ty < 0.5) ctx.cam.shake(0.8 * (1 - (t - ty) / 0.5), t, 8); }
      battery(ctx, 1, { y: 0.075, s: 0.6, blink: true });
    },
  },
  // ── b21 HUSS ×3: silence, slow motion, plug held up in the moonlight
  ...[0, 1, 2].map((i) => ({
    name: `plug aloft #${i + 1}`, start: i === 0 ? 'b21.h0-0.12' : `b21.h${i}-0.03`, set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'quiet_night', rig: 'off', ladder: true });
      const me = put(ctx, 'me', L(SOCK.x + 0.2, DY, SOCK.z + 1.9), L.yaw + PI / 2 + 0.3); phonesOn(ctx, me);
      ctx.store.L = L;
    },
    update(ctx) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, hits = ctx.hussTimes('b21').map((h) => h + 0.03);
      rigTick(ctx, { on: 0, notes: 0, rings: 0, glow: 0 });
      const ts = ctx.time('b21') + (t - ctx.time('b21')) * 0.25;
      me.pose('cheer', ts, { intensity: 0.4 }); armsUp(me, 1, 0.05 * Math.sin(ts * 3)); me.face('huss', 0.5);
      // right fist high beside the head holding the plug, left arm thrown out in a V: both arms clear of the big head
      me.joints.armR.rotation.set(-2.95, 0, -0.55); me.joints.armL.rotation.set(-2.6, 0, 1.0);
      if (me.joints.foreArmR) { me.joints.foreArmR.rotation.x = -0.1; me.joints.foreArmL.rotation.x = -0.2; }
      P.phones.userData.set({ led: '#ff2a2a', k: 0.6 });
      const loc = ctx.set.root.worldToLocal(handPos(me, 'R'));
      plugAt(ctx, V(loc.x, loc.y + 0.42, loc.z), me.root.rotation.y, -PI / 2); P.plug.userData.set(0.7);
      // the cable drops down BEHIND his back (to the west), never across his face
      P.plug.updateMatrixWorld(true);
      P.cabA.userData.set(ctx.set.root.worldToLocal(P.plug.userData.back.getWorldPosition(V())), V(TX - 1.2, DY + 0.05, TZ + 0.9), 0.5);
      const f = humanFace(me), fw = fwdOf(me), sd = sideOf(me);
      const f0 = me.root.position.clone().add(up(f.y - me.root.position.y));
      // #1 low 3/4, #2 high front looking down, #3 wide silhouette against the moon
      const cams = [
        { pos: f0.clone().addScaledVector(fw, 3.2).addScaledVector(sd, 1.2).add(up(-0.5)), look: f0.clone().add(up(-0.6)).addScaledVector(sd, -0.35), fov: 52, roll: 0.08 },
        { pos: f0.clone().addScaledVector(fw, 2.7).addScaledVector(sd, -0.4).add(up(1.9)), look: f0.clone().add(up(-0.85)).addScaledVector(sd, -0.3), fov: 52, roll: -0.06 },
        { pos: f0.clone().addScaledVector(fw, 6.6).addScaledVector(sd, -2.4).add(up(-0.3)), look: f0.clone().add(up(-0.95)).addScaledVector(sd, -0.2), fov: 38, roll: 0 },
      ];
      const c = setCam(ctx, cams[i], 0.8, '#b8c8ff');
      if (i !== 1) moonBehind(ctx, c, f0.clone().add(up(i === 2 ? 0.7 : 1.0)), { size: i === 2 ? 34 : 20, dx: [0.07, 0, 0.0][i], dy: [0.05, 0, 0.02][i] });
      ctx.fx.overlay('#1a2a6a', 0.18); ctx.fx.vignette(0.65);
      ctx.cam.punch(hits, t, 0.12, 0.3);
    },
  })),
  // ── b22 "Everyone flopped like noodles. Then they cheered. Top ten respect."
  {
    name: 'flop', start: 'b22-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'quiet_night', rig: 'off', ladder: true, glow: 0.8 });
      const me = put(ctx, 'me', L(SOCK.x + 1.3, DY, SOCK.z + 2.4), L.yaw + PI / 2); phonesOn(ctx, me);
      const ids = CROWD.slice(0, 22);
      const list = ids.map((id, k) => { const c = k % 5, r = Math.floor(k / 5); const x = TX + 6 + r * 1.7 + (hash(k) - 0.5) * 0.5, z = TZ - 3.6 + c * 1.8 + (hash(k * 2) - 0.5) * 0.5; return { ch: put(ctx, id, L(x, 0, z), L.yaw - PI / 2 + (hash(k * 3) - 0.5)), k, x, z, ph: hash(k) * 3 }; });
      filler(ctx, [...ringFill(TX, TZ, 4, 15, 150, { seed: 3, face: 'in' }), ...streetFill(-36, -18, { cols: 10, near: -18, seed: 41 })].filter((p) => Math.hypot(p.x - (TX + 28), p.z - (TZ + 2.5)) > 3.5));
      ctx.store = { ...ctx.store, L, list };
    },
    update(ctx, lt) {
      const { L, list } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, tf = ctx.time('b22.w1');
      rigTick(ctx, { on: 0, notes: 0, rings: 0, glow: 0 });
      list.forEach((m) => {
        const fk = ease.outCubic(clamp((t - tf - 0.12 * hash(m.k * 4.4)) / 0.4, 0, 1));
        if (fk <= 0) { m.ch.pose('dance', t + m.ph); m.ch.face('huss', t); m.ch.root.rotation.x = 0; m.ch.root.position.y = L(0, 0, 0).y; }
        else { m.ch.pose('stunned', t + m.ph, { intensity: 0.3 }); m.ch.face('sleepy', 0.5); m.ch.root.rotation.x = -fk * PI / 2 * 0.96; m.ch.root.position.y = L(0, 0.16 * fk, 0).y; }
      });
      P.filler.userData.set(t, { arms: 'limp', flop: (i) => ease.outCubic(clamp((t - tf - 0.15 * hash(i * 2.3)) / 0.45, 0, 1)), bounce: t < tf ? 1 : 0 });
      me.pose('idle', t, { intensity: 0.3 }); armsUp(me, 1); me.face('shocked', 0.5);
      const a = handPos(me, 'L'), b = handPos(me, 'R'), mid = a.lerp(b, 0.5); const loc = ctx.set.root.worldToLocal(mid.clone()); plugAt(ctx, V(loc.x, loc.y + 0.7, loc.z), me.root.rotation.y, -PI / 2);
      const c = setCam(ctx, { pos: L(TX + 28, 4.5, TZ + 2.5), look: L(TX + 6, 6.2, TZ), fov: 64 }, 0);
      moonBehind(ctx, c, headPt(me, 0, 0.6, 0), { size: 13, dx: 0.0, dy: 0.0 });
      meArrow(ctx, c);
      if (t > tf) stamp(ctx, 'FLOP', tf + 0.15, { y: 0.76, size: 140, fill: '#ffffff', stroke: '#1d1d22', rot: 0.1 });
    },
  },
  {
    name: 'cheer for me', start: 'b22.w4-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'quiet_night', rig: 'off', ladder: true, glow: 0.8 });
      // hero at the SE corner of the deck, turned to the lens; the town cheers from the park lawn below (south of the tower)
      const me = put(ctx, 'me', L(TX + 1.55, DY, TZ - 1.15), L.yaw + 0.95); phonesOn(ctx, me);
      const ids = CROWD.slice(0, 26);
      const list = ids.map((id, k) => { const c = k % 6, r = Math.floor(k / 6); const x = TX - 0.9 + c * 0.98 + (r % 2 ? 0.45 : 0) + (hash(k) - 0.5) * 0.3, z = TZ - 8.6 - r * 1.25 + (hash(k * 2) - 0.5) * 0.3;
        return { ch: put(ctx, id, L(x, 0, z), L.yaw + (hash(k * 3) - 0.5) * 0.5), k, x, z, ph: hash(k) * 3 }; });
      filler(ctx, [...ringFill(TX, TZ, 4.2, 15, 190, { seed: 3, face: 'in' })].filter((p) => !(p.z < TZ - 7.8 && p.z > TZ - 14.6 && p.x > TX - 1.8 && p.x < TX + 4.6)));
      // tuck the (now dead) speaker rig out of this angle so the clock face doesn't clutter the cheering lawn
      const P = ctx.props; P.spk.forEach((sp) => { sp.position.y -= 200; }); P.cabB.userData.set(V(TX, -200, TZ), V(TX, -201, TZ), 0.1); P.cabC.userData.set(V(TX, -200, TZ), V(TX, -201, TZ), 0.1);
      ctx.store = { ...ctx.store, L, list };
    },
    update(ctx, lt) {
      const { L, list } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, tu = ctx.time('b22.w5');
      rigTick(ctx, { on: 0, notes: 0, rings: 0, glow: 0 });
      const top = L(TX + 1.5, DY + 2, TZ - 1.2);
      list.forEach((m) => {
        const k = ease.outBack(clamp((t - tu + 0.25 - 0.05 * hash(m.k)) / 0.35, 0, 1));
        if (k < 0.3) { m.ch.pose('stunned', 0.5); m.ch.root.rotation.x = -PI / 2 * 0.96 * (1 - k / 0.3); m.ch.face('sleepy', 0.5); }
        else { m.ch.pose(m.k % 3 ? 'cheer' : 'clap', t + m.ph, { lookAt: top }); m.ch.root.rotation.x = 0; m.ch.face(m.k % 2 ? 'laugh' : 'grin', t + m.ph); if (m.k % 3) armsUp(m.ch, 0.8, 0.25 * Math.sin(t * 6 + m.k)); }
      });
      P.filler.userData.set(t, { arms: 'cheer', flop: (i) => 1 - ease.outCubic(clamp((t - tu + 0.2 - 0.3 * hash(i * 2.3)) / 0.4, 0, 1)) });
      me.pose('cheer', t, { intensity: 0.6 }); armsUp(me, 1, 0.1 * Math.sin(t * 4)); me.face('laugh', t);
      // the plug held high in the right hand, out to the side (clear of the face); its cable trails off behind him on the deck
      me.joints.armL.rotation.set(-2.45, 0, -1.0 - 0.08 * Math.sin(t * 5)); if (me.joints.foreArmL) me.joints.foreArmL.rotation.x = -0.1;
      { const hw = handPos(me, 'L'), hc = headPt(me, 0, 0.3, 0), out = hw.clone().sub(hc).setY(0).normalize(); const loc = ctx.set.root.worldToLocal(hw.addScaledVector(out, 0.35)); plugAt(ctx, V(loc.x, loc.y + 1.2, loc.z), me.root.rotation.y, -PI / 2);   // (plug body hangs below its prong end: grip at the cord end)
        P.plug.updateMatrixWorld(true); const back = ctx.set.root.worldToLocal(P.plug.userData.back.getWorldPosition(V())); P.cabA.userData.set(back, V(TX - 1.8, DY + 0.05, TZ - 2.0), 0.9); }
      // drone spot outside the east parapet, above the deck: hero big in the upper half, the cheering lawn below him
      const push = ease.inOutSine(clamp(lt / 2.2, 0, 1));
      const c = setCam(ctx, { pos: L(TX + 4.6, DY + 4.4, TZ + 2.6).lerp(L(TX + 4.35, DY + 4.15, TZ + 2.25), push), look: L(TX + 1.4, DY + 0.1, TZ - 2.7), fov: 56 }, 1.4, '#e0e8ff');
      key(ctx, headPt(me, 0, 0.3, 0).add(L(1.6, 1.4, 1.4).sub(L(0, 0, 0))), 16);
      // a warm flood on the lawn so the cheering faces read
      const sl = P.shipLight; ctx.add(sl, ctx.set.root); sl.position.set(TX + 4.5, 8.0, TZ - 5.0); sl.color.set('#ffe8d0'); sl.intensity = 45;
      top10Card(ctx, 1, ctx.time('b22.w7') - 0.05, Infinity, { title: 'TOP 10\nRESPECTFUL MOMENTS', popAt: ctx.markers.top10 - 0.05 });
      tag(ctx, 'THE TOWN CARRIED ME', ctx.markers.top10 + 0.1, Infinity, { y: 0.66, size: 58, bg: 'rgba(20,20,30,0.88)' });
    },
  },
  // ── b23 "Then the sky turned purple. A giant spaceship came down, blasting the remix. And in every window, glowing green eyes."
  {
    name: 'sky turns purple', start: 'b23-0.1', set: 'town',
    setup(ctx) {
      const L = town(ctx, { light: 'quiet_night', rig: 'off', ladder: true, glow: 0.8 });
      const me = put(ctx, 'me', L(SOCK.x + 1.6, DY, SOCK.z + 2.6), L.yaw + PI / 2); phonesOn(ctx, me);
      const ids = CROWD.slice(0, 14);
      const list = ids.map((id, k) => { const x = TX + 13 + (k % 7) * 1.3 + (hash(k) - 0.5) * 0.4, z = TZ - 1 + Math.floor(k / 7) * 2.6 + (hash(k * 2) - 0.5); return { ch: put(ctx, id, L(x, 0, z), L.yaw - PI / 2 + (hash(k * 3) - 0.5) * 0.6), k, ph: hash(k) * 3 }; });
      filler(ctx, ringFill(TX, TZ, 4, 13, 120, { seed: 3 }));
      ctx.store = { ...ctx.store, L, list };
    },
    update(ctx, lt) {
      const { L, list } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, tp = ctx.time('b23.w4');
      rigTick(ctx, { on: 0, notes: 0, rings: 0, glow: 0 });
      const k = ease.inOutSine(clamp((t - tp + 0.2) / 0.6, 0, 1));
      townPurple(ctx, k);
      list.forEach((m) => { m.ch.pose(t > tp ? 'surprised' : 'cheer', t > tp ? 0.4 : t + m.ph, { lookAt: L(TX, 30, TZ) }); m.ch.face(t > tp ? 'shocked' : 'grin', t > tp ? 0.4 : t + m.ph); });
      P.filler.userData.set(t, { arms: t > tp ? 'limp' : 'cheer', bounce: t > tp ? 0 : 1 });
      me.pose('idle', t); armsUp(me, 0.5); me.face(t > tp ? 'shocked' : 'grin', 0.5);
      setCam(ctx, { pos: L(TX + 25, 1.8, TZ + 1.5), look: L(TX + 2, 11, TZ), fov: 58 }, 1.6, '#e8d0ff');
      flash(ctx, tp, 0.35, '#e0b0ff', 0.8);
      if (Math.abs(t - tp) < 0.4) ctx.cam.shake(0.4, t, 11);
      if (t > tp) tag(ctx, 'PURPLE?!', tp + 0.05, Infinity, { y: 0.15, size: 84, fill: '#e8c0ff', bg: 'rgba(60,10,100,0.88)' });
    },
  },
  {
    name: 'ship descends', start: 'b23.w5-0.1', set: 'town',
    setup(ctx) { shipSetup(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
      // the saucer sweeps in from the east and settles in front of him (then hovers over the tower in the next shots)
      const kS = ease.outCubic(clamp((t - ctx.time('b23.w5') + 0.1) / 2.0, 0, 1));
      const xS = TX + lerp(120, 42, kS), yS = lerp(88, 45, kS);
      shipTick(ctx, yS, { pump: 0.3, eyes: 0, x: xS });
      me.pose('surprised', 0.5, { headPitch: -0.5 }); me.face('shocked', 0.5);
      holdPlugLow(ctx, me);
      const hd = headPt(me, 0, 0.3, 0), fw = fwdOf(me), sd = sideOf(me);
      setCam(ctx, { pos: hd.clone().addScaledVector(fw, -1.6).addScaledVector(sd, 0.55).add(up(-0.45)), look: L(xS - 6, yS - 3, TZ), fov: 64 }, 0.9, '#e0c0ff');
      ctx.cam.shake(0.18, t, 6);
      tag(ctx, 'A GIANT SPACESHIP', ctx.time('b23.w6'), Infinity, { y: 0.84, size: 60, bg: 'rgba(60,10,100,0.88)', rot: 0 });
    },
  },
  {
    name: 'the remix', start: 'remix-0.1', set: 'town',
    setup(ctx) {
      shipSetup(ctx, { street: true });
    },
    update(ctx, lt) {
      const { L, list } = ctx.store, t = ctx.t, P = ctx.props, tr = ctx.markers.remix;
      shipTick(ctx, 40, { pump: t > tr ? 1 : 0.3, eyes: 0, rings: t > tr });
      list.forEach((m) => { const go = t > tr + 0.1 * hash(m.k); m.ch.pose(go ? (m.k % 2 ? 'dance' : 'dance2') : 'surprised', go ? t + m.ph : 0.4); m.ch.face(go ? 'huss' : 'shocked', go ? t + m.ph : 0.4); });
      P.filler.userData.set(t, { arms: t > tr ? 'up' : 'limp', bounce: t > tr ? 1.2 : 0 });
      setCam(ctx, { pos: L(TX + 36, 2.2, TZ + 2.3), look: L(TX + 2, 16, TZ), fov: 60 }, 0.6);
      if (t > tr) { stamp(ctx, 'THE REMIX', tr, { y: 0.17, size: 150, fill: '#ff4fa3', stroke: '#ffffff', rot: -0.08 }); ctx.cam.shake(0.25 + 0.3 * beat(t), t, 13); ctx.fx.overlay('#c040ff', 0.12 * beat(t)); }
      ctx.cam.punch([tr], t, 0.14, 0.3);
    },
  },
  {
    name: 'green eyes in every window', start: 'b23.w13-0.1', set: 'town',
    setup(ctx) { shipSetup(ctx); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, te = ctx.markers.eyes, tg = ctx.time('b23.w17');
      const eyes = clamp((t - tg + 0.1) / 0.5, 0, 1) * 0.6 + (t > te ? 0.4 : 0);
      shipTick(ctx, 40, { pump: 1, eyes });
      // grazing along the rim so a row of portholes recedes diagonally through the frame
      const a0 = 0.3, u = ease.inOutSine(clamp(lt / 1.9, 0, 1));
      const rp = (r, a, y) => L(TX + Math.cos(a) * r, y, TZ + Math.sin(a) * r);
      const c = moveCam(ctx, { pos: rp(46, a0, 42.5), look: rp(16.2, a0 + 0.42, 38.3), fov: 32 }, { pos: rp(43, a0, 42.3), look: rp(16.2, a0 + 0.42, 38.3), fov: 31 }, u, 0);
      ctx.cam.set({ ...c, roll: 0.5 });
      ctx.cam.punch([te], t, 0.15, 0.3);
      if (t > te) { flash(ctx, te, 0.2, '#7dff6a', 0.5); tag(ctx, 'THE HACKERS?!', te + 0.05, Infinity, { y: 0.15, size: 80, fill: '#7dff6a', stroke: '#000000', bg: 'rgba(10,10,20,0.88)' }); }
    },
  },
  // ── b24 "And my battery? Zero percent."
  {
    name: 'zero percent', start: 'b24-0.1', set: 'town',
    setup(ctx) { shipSetup(ctx, { near: true }); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, tz = ctx.markers.zero;
      shipTick(ctx, 33, { pump: 1, eyes: 1 });
      const dead = t > tz;
      me.pose('idle', t, { intensity: 0.5 }); me.face(dead ? 'shocked' : 'sweat', 0.5);
      holdPlugLow(ctx, me);
      P.phones.userData.set({ led: '#ff2a2a', k: dead ? 0 : (Math.floor(t * 6) % 2 ? 1 : 0.2) });
      const f = humanFace(me), fw = fwdOf(me), sd = sideOf(me);
      const f0 = me.root.position.clone().add(up(f.y - me.root.position.y));
      moveCam(ctx, { pos: f0.clone().addScaledVector(fw, 2.75).addScaledVector(sd, 0.55).add(up(-0.65)), look: f0.clone().add(up(-0.3)), fov: 42 }, { pos: f0.clone().addScaledVector(fw, 2.55).addScaledVector(sd, 0.5).add(up(-0.62)), look: f0.clone().add(up(-0.3)), fov: 41 }, clamp(lt / 1.4, 0, 1), 1.0, '#e0c0ff');
      battery(ctx, dead ? 0 : 1, { y: 0.12, s: 1.1, t0: ctx.time('b24') - 0.05, blink: true });
      ctx.cam.punch([tz], t, 0.12, 0.25);
    },
  },
  {
    // cut on "Zero": the 0% hit lands here and the dance starts at once, so it plays ~1.5 s before the iris closes
    name: 'reluctant dance', start: 'zero-0.04', set: 'town',
    setup(ctx) { shipSetup(ctx, { near: true }); },
    update(ctx, lt) {
      const { L } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props, tz = ctx.markers.zero, t0 = tz + 0.04;
      shipTick(ctx, 33, { pump: 1, eyes: 1 });
      const k = ease.inOutSine(clamp((t - t0) / 0.18, 0, 1));
      me.poseMix('stunned', t, {}, 'dance2', t, { speed: 1.2 }, k); me.face('sweat', t);
      plugAt(ctx, V(TX + 0.5, DY + 0.25, TZ + 1.7), L.yaw + 0.9, 0);    // dropped on the deck
      P.phones.userData.set({ led: '#ff2a2a', k: 0 });
      const ti = ctx.timeline.duration - 0.3;
      setCam(ctx, { pos: L(TX + 2.25, DY + 0.9, TZ + 1.5), look: L(TX - 0.4, DY + 1.5, TZ + 0.6), fov: 54 }, 1.0, '#e0c0ff');
      battery(ctx, 0, { y: 0.1, s: 0.8, blink: true, t0: tz - 0.05 });
      if (t < tz + 0.5) stamp(ctx, '0%', tz, { y: 0.8, size: 220, fill: '#ff2a2a', stroke: '#ffffff' });
      else tag(ctx, 'NOOO', tz + 0.5, ti, { y: 0.8, size: 90, fill: '#ffffff', bg: null, rot: -0.12 });
      ctx.cam.punch([tz], t, 0.12, 0.25);
      if (t >= ti) ctx.caption.hide(true);      // nothing on top of the black ending
      iris(ctx, ti, 0.4, 0.28);
    },
  },
];

// ═════════════════════════════════════════════════════════════════════════════ shot building blocks
// ── b01 dawn street
function dawnStreet(ctx) {
  const L = town(ctx, { light: 'dusk', party: true });
  const me = put(ctx, 'me', L(-8, 0, 0), L.yaw + PI / 2); phonesOn(ctx, me);
  const list = grid(ctx, CROWD, L, { x0: -10.6, z0: 0, cols: 7, dx: 1.3, dz: 1.15, yaw: PI / 2, jitter: 0.15, skip: (r, c) => c === 3 && r >= 2 });
  filler(ctx, streetFill(-40, -12.5, { cols: 11, near: -12.5, seed: 2 }));
  ctx.store = { ...ctx.store, L, list };
}
function dawnTick(ctx) {
  const t = ctx.t, me = ctx.cast.me;
  rigTick(ctx, { notes: 0.7, rings: 0.6 });
  crowdTick(ctx.store.list, t, { action: 'dance2', sync: true, faces: ['sleepy', 'sweat', 'sleepy', 'huss'], faceT: 0.5 });
  ctx.props.filler.userData.set(t, { arms: 'dance', speed: 1.0 });
  me.pose('crossArms', t, { intensity: 0.3 }); me.face('neutral', 0.6);
  ctx.fx.overlay('#ff9060', 0.06);
}
// ── fair
function fairTick(ctx, { action = 'idle', face = 'smile' } = {}) {
  const t = ctx.t;
  crowdTick(ctx.store.crowd, t, { action: (m) => (action === 'idle' ? (m.k % 4 === 0 ? 'cheer' : m.k % 3 === 0 ? 'clap' : 'idle') : action), faces: action === 'idle' ? ['smile', 'grin', 'laugh'] : [face], faceT: action === 'idle' ? null : 0.4 });
  ctx.props.filler.userData.set(t, { arms: action === 'idle' ? 'limp' : 'cheer', bounce: action === 'idle' ? 0.2 : 0.5 });
}
function flashbackLook(ctx) { ctx.fx.overlay('#ffb070', 0.12); ctx.fx.vignette(0.5); }
// ── bakery (house 1, north row, front at z −10.5)
function bakery(ctx, { conga = false } = {}) {
  const L = town(ctx, { light: 'day', rig: 'none' });
  const P = ctx.props, BX = -13.6, BZ = -8.9;
  addTo(ctx, P.counter, BX, 0, BZ, 0);
  addTo(ctx, P.stallPosts, BX, 0, BZ - 0.45, 0);
  addTo(ctx, P.awning, BX, 2.95, BZ - 0.5, 0);
  addTo(ctx, P.bakerySign, BX, 3.35, BZ - 0.5, 0);
  put(ctx, 'pell', L(conga ? BX + 0.2 : BX - 0.45, 0, BZ - 0.75), L.yaw);
  ctx.add(P.notes2);
  if (!conga) { [['x02', -1.4, 1.6], ['x09', 0.6, 2.0], ['y05', 1.25, 1.3]].forEach(([id, dx, dz], k) => put(ctx, id, L(BX + dx, 0.03, BZ + dz), L.yaw + PI + (k - 1) * 0.35)); }
  const list = [];
  if (conga) CROWD.slice(0, 12).forEach((id, k) => { put(ctx, id, L(-15, 0, -11), 0); list.push({ id, k }); });
  ctx.store = { ...ctx.store, L, conga: list };
  return L;
}
/** conga path: out of the door (−15, −9.6) south along the path, then east along the north pavement */
function congaPoint(L, s) {
  const pts = [[-15, -10.6], [-15, -6.6], [-14.2, -5.7], [-2, -5.7]];
  let acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], d = Math.hypot(x1 - x0, z1 - z0);
    if (s <= acc + d || i === pts.length - 2) { const u = clamp((s - acc) / d, 0, 1); return { p: L(lerp(x0, x1, u), u > 0.5 || i > 0 ? CURB : 0.03, lerp(z0, z1, u)), yaw: Math.atan2(x1 - x0, z1 - z0) }; }
    acc += d;
  }
}
function congaTick(ctx, list, s0, speed) {
  const L = ctx.store.L, t = ctx.t;
  list.forEach(({ id, k }) => {
    const ch = ctx.cast[id], s = s0 * speed - k * 0.85;
    const { p, yaw } = congaPoint(L, s);
    ch.root.position.copy(p); ch.root.position.y += 0.05 * Math.abs(Math.sin(t * 6.6 + k * 0.5));
    ch.root.rotation.y = L.yaw + yaw;
    ch.pose('walk', t * 1.2 + k * 0.4, { speed: 0.9 }); armsForward(ch, 1, -1.45);
    ch.joints.hips.rotation.z = 0.15 * Math.sin(t * 6.6 + k * 0.5);
    ch.face(k % 3 === 0 ? 'laugh' : k % 3 === 1 ? 'grin' : 'shocked', t + k);
  });
}
// ── police (house 3, north row x 9)
function police(ctx, { worm = false } = {}) {
  const L = town(ctx, { light: 'day', rig: 'none' });
  const P = ctx.props;
  addTo(ctx, P.policeSign, 9, 2.95, -10.35, 0);
  if (!worm) put(ctx, 'brandt', L(9.0, 0.03, -8.4), L.yaw);
  const worms = worm ? [{ id: 'brandt', x: 11.2, z: -3.4 }, { id: 'cop2', x: 9.2, z: -3.4 }, { id: 'cop3', x: 7.2, z: -3.4 }] : [];
  worms.forEach((w) => put(ctx, w.id, L(w.x, 0.4, w.z), 0));
  if (worm) ['x04', 'x12'].forEach((id, k) => { put(ctx, id, L(11.8 + k * 0.9, CURB, -6.4), L.yaw + 0.4); });
  ctx.store = { ...ctx.store, L, worms };
  return L;
}
// ── hacker on the deck
function hackerSetup(ctx) {
  const L = ctx.store.L || T(ctx), P = ctx.props;
  const h = put(ctx, 'hacker', L(SOCK.x - 0.45, DY, SOCK.z + 1.05), L.yaw + PI - 0.25);
  ctx.add(P.hood, h.joints.head); P.hood.position.set(0, 0, 0);
}
function hackerTick(ctx, { plug = 0, eyes = 1 } = {}) {
  const t = ctx.t, h = ctx.cast.hacker, P = ctx.props, L = T(ctx);
  kneel(h, t);
  h.root.position.copy(L(SOCK.x - 0.45, DY - 0.27, SOCK.z + 1.05));
  h.face('neutral', 0.5);
  P.hood.userData.eyes(eyes);
  armsForward(h, 1, -1.1);
  const hl = holeLocal(ctx);
  if (plug >= 1) plugAt(ctx, 'socket');
  else { const p = V(hl.x - 0.05, hl.y - 0.02, hl.z + 0.02 + 0.55 * (1 - plug)); plugAt(ctx, p, PI); }
}
// ── standing on the picnic table, back to the crowd
function tableStand(ctx, { catchers = false, drop = null, clear = [] } = {}) {
  const L = picnic(ctx, { dancers: !catchers, clear });
  const free = (x, z) => !clear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r);
  const me = put(ctx, 'me', L(PIC.x - 0.2, 0.82, PIC.z), L.yaw + PI / 2); phonesOn(ctx, me);
  let crew = [];
  if (catchers) {
    const spots = [[-1.9, -0.75], [-1.9, 0.75], [-2.9, -0.8], [-2.9, 0.8], [-3.9, -0.75], [-3.9, 0.75], [-1.4, -1.9], [-2.6, -2.1], [-3.8, -2.0], [-1.4, 1.9], [-2.6, 2.1], [-3.8, 2.0], [-5.0, 0.0], [-5.0, -1.6], [-5.0, 1.6]];
    crew = spots.map(([dx, dz], k) => ({ dx, dz, k })).filter((s) => !drop || !drop(s.dx, s.dz)).map(({ dx, dz, k }) => ({ ch: put(ctx, CROWD[k], L(PIC.x + dx, 0, PIC.z + dz), L.yaw + PI / 2 + (hash(k) - 0.5) * 0.5), k, ph: hash(k * 1.9) * 3 }));
    filler(ctx, [...streetFill(-10, 24.5, { cols: 11, near: 24.5, seed: 52 }), ...ringFill(44, 2, 6, 13, 100, { seed: 9 })].filter((p) => free(p.x, p.z)));
  }
  ctx.store = { ...ctx.store, L, crew };
  return L;
}
function tableTick(ctx, { catchAt = null } = {}) {
  const t = ctx.t, P = ctx.props;
  const crew = ctx.store.crew;
  if (crew.length) {
    crew.forEach((m) => {
      const caught = catchAt != null && t > catchAt - 0.05;
      m.ch.setAccessory?.('sunglasses', caught);
      if (caught) { m.ch.pose('idle', t + m.ph, { intensity: 0.2 }); armsUp(m.ch, 1); m.ch.face('determined', 0.5); }
      else { m.ch.pose(m.k % 2 ? 'dance' : 'dance2', t + m.ph); m.ch.face(m.k % 2 ? 'grin' : 'huss', t + m.ph); }
    });
    P.filler.userData.set(t, { arms: catchAt != null && t > catchAt ? 'up' : 'dance', shades: catchAt != null && t > catchAt });
    rigTick(ctx, { notes: 0, rings: 0 });
  } else picnicTick(ctx, { notes: false });
  P.phones.userData.set({ led: '#ff2a2a', k: Math.floor(t * 4) % 2 ? 1 : 0.25 });
}
// ── crowd-surfing down main street
function surfSetup(ctx, part) {
  const L = town(ctx, { light: 'party_night', party: true, ladder: true });
  const me = put(ctx, 'me', L(0, 2.3, 0), L.yaw - PI / 2); phonesOn(ctx, me);
  let near = [];
  if (part === 0) {
    near = CROWD.slice(0, 30).map((id, k) => { const c = k % 5, r = Math.floor(k / 5); const x = 12.5 - r * 2.05 + (hash(k) - 0.5) * 0.5, z = -2.4 + c * 1.2 + (hash(k * 2) - 0.5) * 0.4; return { ch: put(ctx, id, L(x, 0, z), L.yaw - PI / 2 + (hash(k * 3) - 0.5) * 0.8), k, x, z, ph: hash(k * 1.9) * 3 }; });
    filler(ctx, streetFill(-46, 22, { zHalf: 7.2, cols: 12, near: 14, step0: 1.0, grow: 0.012, seed: 61, avoid: (x, z) => (x > -1 && x < 13.5 && Math.abs(z) < 3.0) || (x > -3 && x < 20 && z > 4.0) }));
  } else {
    near = CROWD.slice(0, 18).map((id, k) => { const c = k % 3, r = Math.floor(k / 3); const x = -30.5 - r * 2.0 + (hash(k) - 0.5) * 0.5, z = 1.2 + (c - 1) * 1.15 + (hash(k * 2) - 0.5) * 0.4; return { ch: put(ctx, id, L(x, 0, z), L.yaw - PI / 2 + (hash(k * 3) - 0.5) * 0.8), k, x, z, ph: hash(k * 1.9) * 3 }; });
    filler(ctx, [...streetFill(-40, -14, { zHalf: 7.2, cols: 11, near: -14, step0: 1.0, grow: 0.01, seed: 62, avoid: (x, z) => x < -29 && Math.abs(z - 1.2) < 2.2 }), ...ringFill(TX, TZ, 3.8, 13, 150, { seed: 63 })]);
  }
  ctx.store = { ...ctx.store, L, near };
}
function surfTick(ctx, x) {
  const { L, near } = ctx.store, t = ctx.t, me = ctx.cast.me, P = ctx.props;
  rigTick(ctx);
  near.forEach((m) => {
    m.ch.pose('cheer', t * 1.3 + m.ph, { intensity: 0.5 }); armsUp(m.ch, 0.85, 0.15 * Math.sin(t * 5 + m.k));
    m.ch.face(m.k % 3 ? 'grin' : 'laugh', t + m.ph);
    m.ch.setAccessory?.('sunglasses', true);
  });
  P.filler.userData.set(t, { arms: 'up', shades: true });
  me.root.position.copy(L(x, 2.85 + 0.08 * Math.sin(t * 9) + 0.05 * Math.sin(t * 5.3), 0.6 * Math.sin(t * 1.3) * 0.3 + (x < -29 ? 1.2 : 0)));
  me.root.rotation.set(0.06 * Math.sin(t * 7), L.yaw - PI / 2, 0.08 * Math.sin(t * 5));
  me.pose('crowdSurf', t, { lift: 0, intensity: 0.7 }); me.face('huss', 0.5);
  P.phones.userData.set({ led: '#ff2a2a', k: Math.floor(t * 5) % 2 ? 1 : 0.25 });
}
// ── the purple saucer
function shipSetup(ctx, { street = false, near = false } = {}) {
  const L = town(ctx, { light: 'quiet_night', rig: 'off', ladder: true, glow: 0.85 });
  const me = near ? put(ctx, 'me', L(TX - 0.4, DY, TZ + 0.6), L.yaw + PI / 2 - 0.3) : put(ctx, 'me', L(SOCK.x + 1.5, DY, SOCK.z + 2.5), L.yaw + PI / 2 - (street ? 0.3 : 0)); phonesOn(ctx, me);
  const P = ctx.props;
  ctx.add(P.ship, ctx.set.root); ctx.add(P.shipLight, ctx.set.root); ctx.add(P.shipRings, ctx.set.root);
  let list = [];
  if (street) {
    list = CROWD.slice(0, 16).map((id, k) => { const x = TX + 26 + (k % 8) * 1.2 + (hash(k) - 0.5) * 0.4, z = TZ - 1.2 + Math.floor(k / 8) * 2.6 + (hash(k * 2) - 0.5); return { ch: put(ctx, id, L(x, 0, z), L.yaw - PI / 2 + (hash(k * 3) - 0.5) * 0.8), k, ph: hash(k) * 3 }; });
    filler(ctx, [...streetFill(-40, -18, { cols: 11, near: -18, seed: 71, avoid: (x, z) => x > TX + 24 && Math.abs(z - TZ) < 3 }), ...ringFill(TX, TZ, 4, 13, 140, { seed: 72 })]);
  }
  ctx.store = { ...ctx.store, L, list, near };
}
function shipTick(ctx, y, { pump = 1, eyes = 0, rings = true, x = TX } = {}) {
  const t = ctx.t, P = ctx.props;
  townPurple(ctx, 1);
  rigTick(ctx, { on: 0, notes: 0, rings: 0, glow: 0 });
  P.ship.position.set(x, y, TZ); P.ship.rotation.set(0.03 * Math.sin(t * 0.8), t * 0.15, 0.03 * Math.cos(t * 0.7));
  P.ship.userData.set(t, { pump, eyes, beams: 1, lights: 1 });
  P.shipLight.position.set(x + 6, y - 8, TZ + 4); P.shipLight.intensity = 30 + 20 * beat(t) * pump;
  P.shipRings.position.set(x, y - 4, TZ); P.shipRings.rotation.set(PI / 2, 0, 0); P.shipRings.userData.set(t, rings ? 0.7 * pump : 0, 40, 0.8);
  P.shipRings.children.forEach((r) => r.material.color.set('#ff7ae0'));
  ctx.fx.overlay('#8a2be2', 0.08 + 0.06 * beat(t) * pump);
}
function holdPlugLow(ctx, me, free = false) {
  const J = me.joints;
  if (!free) { J.armR.rotation.set(-0.5, 0, 0.2); if (J.foreArmR) J.foreArmR.rotation.x = -0.6; }
  const p = handPos(me, 'R'); const loc = ctx.set.root.worldToLocal(p.clone());
  plugAt(ctx, V(loc.x, loc.y - 0.1, loc.z), me.root.rotation.y, 0.6);
}
