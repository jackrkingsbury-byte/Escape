// In This Town — Episode 17: "Floor Three".  The clock tower has two floors, but its elevator has three buttons.
// Everyone who presses three comes back weird.  The elevator presses three by itself: a floating hallway of doors,
// one is home, every other door is almost home.  Three tries.  Grandma always HUSSes back… one second too late.
// Film contract: SPEC.md §8.  Timeline: episodes/ep17/timeline.json.
//
// Sets: 'town' (buildTown, day), 'lift' (the brass elevator car in the tower lobby / Grandma's floor-two landing),
//       'f3' (Floor Three: starry void, fog, floating tiles, hundreds of doors).
// The doors on Floor Three are real portals: the town is rendered off-screen (render target) from a camera that is
// the viewer's camera carried through the door (door frame → a "virtual door" placed in the town), and the doorway
// plane samples that render in screen space.
import * as THREE from 'three';
import { buildTown } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { WALK_SPEED } from '../characters.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard } from '../cards.js';
import { CAR, buildElevatorSet, buildFloorThree, makeClockTower, makePetCloud, makeLeash, makeGroceryBag, makeGroceryItems,
  makeBall, makeWhistle, makeBanner3, makeFeedTree, makeBellhop, makeTally, makePuff, makeBubble, makeBlob, glowSprite,
  makeMotes, makeElevatorCar } from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const up = (y) => V(0, y, 0);
const PI = Math.PI;

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const KID_IDS = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'];
const CLONE_IDS = Array.from({ length: 28 }, (_, i) => `c${String(i).padStart(2, '0')}`);
const TOWN_IDS = EXTRA_IDS.slice(0, 12);
export const cast = {
  me: MAIN.me, pigeon: MAIN.pigeon,
  bigPigeon: { creature: 'pigeon', id: 'bigPigeon', scale: 14 },
  kowalski: { id: 'kowalski', skin: '#e9b99a', hair: { style: 'bald', color: '#e9b99a' }, top: { style: 'cardigan', color: '#5f8f4e', accent: '#f3e3a5' },
    bottom: { style: 'pants', color: '#6a5a48' }, shoes: '#4a3b2f', accessories: ['glasses'], scale: 0.95 },
  rude: { id: 'rude', skin: '#e0ac69', hair: { style: 'spiky', color: '#1a120c' }, top: { style: 'tee', color: '#ff7a2f', accent: '#ffffff', emblem: 'star' },
    bottom: { style: 'shorts', color: '#2f4d8a' }, shoes: '#f2f2f2', accessories: ['sunglasses'], scale: 1.0 },
  dana: { id: 'dana', skin: '#c68642', hair: { style: 'long', color: '#3b2416' }, top: { style: 'hoodie', color: '#e8232b', accent: '#ffffff', emblem: 'stripe' },
    bottom: { style: 'pants', color: '#1c2a5a' }, shoes: '#f2f2f2', accessories: ['cap'], capColor: '#1d1d22', scale: 3.6 },
  grandma: { id: 'grandma', skin: '#f4d0b5', hair: { style: 'bun', color: '#c9c9d0' }, top: { style: 'cardigan', color: '#c0607a', accent: '#ffe0e8' },
    bottom: { style: 'skirt', color: '#6a4a7a' }, shoes: '#7a1f2b', accessories: ['glasses'], scale: 0.92 },
  ...Object.fromEntries(KID_IDS.map((id, i) => [id, { id, skin: ['#f1c7a1', '#8d5524', '#e0ac69', '#c68642', '#ffdbac', '#a86b4a'][i],
    hair: { style: ['curly', 'short', 'bun', 'spiky', 'afro', 'long'][i], color: ['#1a120c', '#3b2416', '#c0392b', '#e8c46a', '#111111', '#7a4a24'][i] },
    top: { style: 'tee', color: '#ffd23f', accent: '#1d4fa8', emblem: 'number' }, number: i + 2, bottom: { style: 'shorts', color: '#f2f2f2' },
    shoes: '#1d1d22', scale: 0.62 + 0.04 * (i % 3) }])),
  ...EXTRAS,
  ...Object.fromEntries(CLONE_IDS.map((id) => [id, { ...MAIN.me, id, lod: 'low' }])),
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 17 }),
  lift: () => buildElevatorSet(),
  f3: () => buildFloorThree(),
};

export async function init(ctx) {
  try { await document.fonts.load('900 64px "ITT Nunito"'); await document.fonts.load('64px "ITT Luckiest"'); } catch (e) { /* fallback fonts */ }
  const P = ctx.props;
  P.tower2 = makeClockTower({ rows: 2 }); P.tower3 = makeClockTower({ rows: 3 });
  P.cloud = makePetCloud(); P.leash = makeLeash(12);
  P.bagA = makeGroceryBag('bread'); P.bagB = makeGroceryBag('leek');
  P.items = makeGroceryItems();
  P.ball = makeBall(); P.ballGlow = glowSprite('#ffffff', 0.7, 0.6); P.whistle = makeWhistle(); P.banner3 = makeBanner3(); P.feedTree = makeFeedTree();
  P.bell = makeBellhop(); P.tally = makeTally();
  P.puff = makePuff(); P.bubble = makeBubble(); P.blob = makeBlob(0.45); P.blob2 = makeBlob(0.4);
  P.fill = new THREE.PointLight('#c8d8ff', 5, 9, 1.4);
  P.spill = new THREE.PointLight('#fff1c8', 0, 9, 1.4);
  P.gold = new THREE.PointLight('#ffc94a', 0, 7, 1.4);
  P.rocket = makeElevatorCar(); P.rocketGlow = glowSprite('#d9a8ff', 9, 0.9); P.rocketTrail = glowSprite('#b46cff', 6, 0.7);
  P.sparkle = makeMotes({ n: 40, w: 10, h: 6, d: 8, color: '#fff2b0', size: 0.05, seed: 9 });
  P.rain = makeMotes({ n: 30, w: 6, h: 4, d: 4, color: '#d9a8ff', size: 0.06, seed: 4 });
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
function frame(origin, yaw) {
  const fwd = V(Math.sin(yaw), 0, Math.cos(yaw)), left = V(Math.cos(yaw), 0, -Math.sin(yaw));
  const f = (x, y, z) => V().copy(origin).addScaledVector(left, x).addScaledVector(fwd, z).add(V(0, y, 0));
  f.yaw = yaw; f.origin = origin.clone(); return f;
}
function yawOf(obj) { obj.updateWorldMatrix(true, false); const q = new THREE.Quaternion(); obj.getWorldQuaternion(q); return new THREE.Euler().setFromQuaternion(q, 'YXZ').y; }
function lastBefore(times, t) { let r = null; for (const x of times) if (x <= t) r = x; return r; }
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const townRoot = (ctx) => ctx.getSet('town').root;
/** town-local → world */
function TW(ctx) { const r = townRoot(ctx); r.updateMatrixWorld(true); const f = (x, y, z) => r.localToWorld(V(x, y, z)); return f; }
function putL(ctx, obj, x, y, z, yaw = 0, parent = null) { ctx.add(obj, parent || townRoot(ctx)); obj.position.set(x, y, z); obj.rotation.set(0, yaw, 0); return obj; }
/** attach a cast member to `parent` (default: town root) at LOCAL coordinates */
function placeL(ctx, id, x, y, z, yaw = 0, parent = null) { const ch = ctx.cast[id]; (parent || townRoot(ctx)).add(ch.root); ch.root.position.set(x, y, z); ch.root.rotation.set(0, yaw, 0); return ch; }
function placeS(ctx, id, x, y, z, yaw = 0) { return placeL(ctx, id, x, y, z, yaw, ctx.set.root); }
const TOWER = { x: -51, z: 1.5, yaw: PI };
/** the clock tower prop (front faces north / town −Z).  Returns tower-local → world. */
function tower(ctx, rows = 2) {
  const tw = ctx.props['tower' + rows];
  putL(ctx, tw, TOWER.x, 0, TOWER.z, TOWER.yaw);
  tw.userData.set(ctx.t);
  const f = (x, y, z) => { tw.updateMatrixWorld(true); return tw.localToWorld(V(x, y, z)); };
  f.obj = tw; f.local = (x, y, z) => { const p = V(x, y, z).applyAxisAngle(V(0, 1, 0), TOWER.yaw); return [TOWER.x + p.x, y, TOWER.z + p.z]; };
  return f;
}
function day(ctx) { const s = ctx.set; s.setLighting?.('day'); s.set?.('partyProps', false); s.set?.('fireworks', false); s.set?.('foam', 0); s.set?.('windowGlow', 0); }
function fill(ctx, cam, k = 1, color = '#c8d8ff') { const f = ctx.props.fill; ctx.add(f); f.position.copy(cam.pos).add(up(0.4)); f.intensity = 5 * k; f.color.set(color); }
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0; if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.2, size: 74, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.82)', rot: -0.03, ...o, scale: Math.max(0.01, pop * (o.scale ?? 1)) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.26, size: 190, fill: '#e8232b', stroke: '#ffffff', line: 14, rot: -0.15, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
  if (d < 0.18) ctx.cam.shake(0.25 * (1 - d / 0.18), ctx.t, 99);
}
const _pc = new THREE.PerspectiveCamera(40, 9 / 16, 0.1, 1000);
function screenOf(cam, p) {
  _pc.position.copy(cam.pos); _pc.fov = cam.fov ?? 40; _pc.up.set(0, 1, 0); _pc.lookAt(cam.look); _pc.updateMatrixWorld(); _pc.updateProjectionMatrix();
  const v = p.clone().project(_pc); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 };
}
function label(ctx, cam, p, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = screenOf(cam, p);
  const pop = d < 0.18 ? ease.outBack(clamp(d / 0.18, 0, 1)) : 1;
  ctx.fx.text(text, { x: clamp(s.x, 0.12, 0.88), y: clamp(s.y, 0.06, 0.94), size: 64, fill: '#ffe14a', stroke: '#000000', line: 10, rot: -0.04, ...o, scale: Math.max(0.01, pop) });
}
function white(ctx, t0, t1, peak = 1) { const k = clamp((ctx.t - t0) / Math.max(0.01, t1 - t0), 0, 1); if (k > 0) ctx.fx.overlay('#ffffff', peak * k); }
function fadeIn(ctx, t0, dur = 0.3, color = '#ffffff') { const k = 1 - clamp((ctx.t - t0) / dur, 0, 1); if (k > 0) ctx.fx.overlay(color, k); }
/** big floor counter overlay */
function counter(ctx, s, o = {}) { ctx.fx.text(s, { x: 0.5, y: 0.14, size: 150, fill: '#d98cff', stroke: '#000000', line: 12, bg: 'rgba(14,6,4,0.9)', ...o }); }
/** static / glitch bars */
function glitch(ctx, k, seed = 1) {
  if (k <= 0) return;
  ctx.fx.draw((g, W, H) => {
    const fr = Math.floor(ctx.t * 30);
    for (let i = 0; i < 26; i++) {
      const h = hash(fr * 13.1 + i * 7.7 + seed);
      const y = h * H, hh = 4 + 40 * hash(fr * 3.3 + i), x = (hash(fr + i * 2.2) - 0.5) * 60 * k;
      g.globalAlpha = 0.25 + 0.5 * k * hash(i * 9.1 + fr);
      g.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ff2a6a' : '#2affd5';
      g.fillRect(x, y, W, hh * k);
    }
    g.globalAlpha = 0.18 * k; g.fillStyle = '#000';
    for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
  });
}
/** the keyhole mask: everything outside a keyhole is dark; gold glowing rim */
function keyhole(ctx, { k = 1, gold = 0, cy = 0.42 } = {}) {
  ctx.fx.draw((g, W, H) => {
    const cx = W / 2, cyy = H * cy, r = W * 0.27 * k, a = 0.46 * r, yt = cyy + Math.sqrt(r * r - a * a), b = 0.78 * r, yb = cyy + r * 2.5;
    const thR = Math.atan2(yt - cyy, a), thL = Math.PI - thR;
    const contour = () => { g.moveTo(cx - b, yb); g.lineTo(cx + b, yb); g.lineTo(cx + a, yt); g.arc(cx, cyy, r, thR, thL, true); g.closePath(); };
    g.beginPath(); g.rect(0, 0, W, H); contour();
    g.fillStyle = '#0a0612'; g.fill('evenodd');
    g.beginPath(); contour();
    g.lineWidth = 18 + 30 * gold; g.strokeStyle = gold > 0 ? `rgba(255,${200 + 40 * gold},90,1)` : '#3a2a1a';
    g.shadowColor = '#ffcf4a'; g.shadowBlur = 60 * gold; g.stroke();
  });
}

// ────────────────────────────────────────────────────── portals (the town rendered through a door)
const PORTAL = { rt: null, scene: null, cam: null, tmp: new THREE.PerspectiveCamera(40, 9 / 16, 0.1, 1000), res: new THREE.Vector2(), m: new THREE.Matrix4(), fi: new THREE.Matrix4() };
function portalInit() {
  if (!PORTAL.rt) {
    PORTAL.rt = new THREE.WebGLRenderTarget(540, 960, { type: THREE.HalfFloatType });
    PORTAL.rt2 = new THREE.WebGLRenderTarget(384, 384, { type: THREE.HalfFloatType });
    PORTAL.scene = new THREE.Scene();
    PORTAL.cam = new THREE.PerspectiveCamera(40, 9 / 16, 0.1, 1000); PORTAL.cam.matrixAutoUpdate = false;
    PORTAL.cam2 = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  }
  return PORTAL;
}
/** the town, parked in the off-screen scene (only while another set is active) */
function offTown(ctx, { lighting = 'day' } = {}) {
  const P = portalInit(), town = ctx.getSet('town');
  if (town.root.parent !== P.scene) P.scene.add(town.root);
  for (const [k, v] of [['lighting', lighting], ['partyProps', false], ['fireworks', false], ['foam', 0], ['windowGlow', 0]]) if (town.options[k] !== v) { if (k === 'lighting') town.setLighting(v); else town.set(k, v); }
  P.scene.background = town.background; P.scene.fog = town.fog;
  return town;
}
/** Render the town as seen through `door` (its portal plane) by the camera `cam`, with the door mapped to the
 *  town point `q` (town-local, centre of the doorway) looking along town-yaw `yaw`. Returns the texture. */
function renderPortal(ctx, door, cam, q, yaw) {
  const P = portalInit(), town = offTown(ctx); town.update(ctx.t);
  const T = P.tmp; T.position.copy(cam.pos); T.fov = cam.fov ?? 40; T.aspect = 9 / 16; T.up.set(0, 1, 0); T.lookAt(cam.look); T.updateMatrixWorld(); T.updateProjectionMatrix();
  const pl = door.userData.portal; pl.updateMatrixWorld(true);
  const to = new THREE.Matrix4().compose(townRoot(ctx).localToWorld(V(q[0], q[1], q[2])), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw + PI), V(1, 1, 1));
  P.fi.copy(pl.matrixWorld).invert();
  P.m.copy(to).multiply(P.fi).multiply(T.matrixWorld);
  P.cam.matrix.copy(P.m); P.cam.matrixWorld.copy(P.m); P.cam.matrixWorldInverse.copy(P.m).invert();
  P.cam.projectionMatrix.copy(T.projectionMatrix); P.cam.projectionMatrixInverse.copy(T.projectionMatrixInverse);
  P.cam.position.setFromMatrixPosition(P.m);
  const r = ctx.renderer, prev = r.getRenderTarget();
  r.setRenderTarget(P.rt); r.render(P.scene, P.cam); r.setRenderTarget(prev);
  r.getDrawingBufferSize(P.res);
  const u = pl.material.uniforms; u.map.value = P.rt.texture; u.res.value.copy(P.res);
  return P.rt.texture;
}
/** Plain off-screen render of the town (for the memory bubble). */
function renderTownView(ctx, pos, look, fov = 40) {
  const P = portalInit(), town = offTown(ctx); town.update(ctx.t);
  const c = P.cam2; c.position.copy(pos); c.fov = fov; c.aspect = 1; c.up.set(0, 1, 0); c.lookAt(look); c.updateMatrixWorld(); c.updateProjectionMatrix();
  const r = ctx.renderer, prev = r.getRenderTarget();
  r.setRenderTarget(P.rt2); r.render(P.scene, c); r.setRenderTarget(prev);
  return P.rt2.texture;
}

// ───────────────────────────────────────────────────────────────────────────── town scene pieces
/** Grandma in her floor-two window (legs hidden, hips behind the flower box). */
function grandmaWindow(ctx, TL, parentIsTown = true) {
  const g = ctx.cast.grandma, [x, , z] = TL.local(0, 0, 1.92);
  placeL(ctx, 'grandma', x, 5.62, z, TOWER.yaw);
  g.joints.legL.visible = false; g.joints.legR.visible = false;
  return g;
}
function grandmaWindowPose(g, t, huss = 0, wave = 0, ft = t) {
  if (huss > 0) g.pose('cheer', t, { intensity: 0.7 });
  else if (wave > 0) g.pose('wave', t);
  else g.pose('idle', t, { intensity: 0.3 });
  g.joints.torso.rotation.x += 0.18;
  g.face(huss > 0 ? 'huss' : 'smile', ft);
}
/** Grandma on the tower porch (town-local) */
function grandmaPorch(ctx, TL) { const [x, , z] = TL.local(0, 0, 2.55); return placeL(ctx, 'grandma', x, 0.66, z, TOWER.yaw); }
/** some townsfolk strolling around the park (life) */
function parkLife(ctx) {
  const ids = [EXTRA_IDS[12], EXTRA_IDS[13], EXTRA_IDS[14]];
  ids.forEach((id) => townRoot(ctx).add(ctx.cast[id].root));
  return ids;
}
// walkers stay far from the camera → tower corridor: one strolls off to the left past the tower porch, one off to the
// right, one waves from the far-left lawn.  [x0, z, dir, phase]
const PARK_PATHS = [[-53.6, -2.6, -1, 0.0], [-47.4, -3.4, 1, 0.0], [-56.2, -1.2, 0, 5]];
function parkLifeAnim(ctx, ids) {
  const t = ctx.t;
  const paths = PARK_PATHS;
  ids.forEach((id, i) => {
    const ch = ctx.cast[id], [x0, z0, dir, ph] = paths[i];
    if (dir === 0) { ch.root.position.set(x0, 0, z0); ch.root.rotation.set(0, -0.3, 0); ch.pose('wave', t + ph); ch.face('smile', t + ph); return; }
    const u = (t * WALK_SPEED * 0.8) % 30;
    ch.root.position.set(x0 + dir * u, 0, z0); ch.root.rotation.set(0, dir > 0 ? PI / 2 : -PI / 2, 0);
    ch.pose('walk', t + ph, { speed: 0.8 }); ch.face('smile', t + ph);
  });
}
/** me carrying the two grocery bags */
function carryBags(ctx, me) {
  const P = ctx.props;
  ctx.add(P.bagA, me.joints.handR); P.bagA.position.set(0, -0.02, 0); P.bagA.rotation.set(0, 0, 0);
  ctx.add(P.bagB, me.joints.handL); P.bagB.position.set(0, -0.02, 0); P.bagB.rotation.set(0, 0, 0);
}
function bagArms(me) { const J = me.joints; J.armR.rotation.z += 0.12; J.armL.rotation.z -= 0.12; J.armR.rotation.x = 0.05; J.armL.rotation.x = 0.05; J.foreArmR.rotation.x = -0.15; J.foreArmL.rotation.x = -0.15; }
function blobUnder(ctx, ch, blob = ctx.props.blob, s = 1) { ctx.add(blob, ch.root.parent); blob.position.set(ch.root.position.x, ch.root.position.y + 0.012, ch.root.position.z); blob.scale.setScalar(s); }

// ───────────────────────────────────────────────────────────────────────────── lift scene pieces
function lift(ctx, decor = 'ground', hide = []) {
  const s = ctx.set; s.set('decor', decor);
  const car = s.car; car.userData.hide(hide);
  car.userData.set({});
  return car;
}
function carState(ctx, o) { ctx.set.car.userData.set({ t: ctx.t, ...o }); }
function panelPoint(car, n) { car.userData.btn[n].updateMatrixWorld(true); return car.userData.btn[n].getWorldPosition(V()); }
function pigeonOnPanel(ctx, car) {
  const p = ctx.cast.pigeon; car.userData.ledge.updateMatrixWorld(true);
  const w = car.userData.ledge.getWorldPosition(V());
  placeS(ctx, 'pigeon', w.x, w.y, w.z, PI);
  return p;
}

// ───────────────────────────────────────────────────────────────────────────── floor three pieces
const DOOR_VIEW = {
  d1: { q: [-6, 1.31, 1.2], yaw: PI / 2 },             // looking east down Main Street (the giant pigeon is behind)
  d2: { q: [-2.2, 1.31, 0.3], yaw: -PI / 2 },          // looking west at the crowd of me
  porch: null,                                          // filled from the tower frame
};
function f3(ctx, { vanish = null, gone = false } = {}) {
  const s = ctx.set;
  s.doors.forEach((d, i) => { const def = d.userData.def; d.position.set(def.x, def.y, def.z); d.rotation.set(0, def.yaw, 0); d.scale.setScalar(1); d.visible = !(gone && i < 2); d.userData.set({ t: ctx.t }); });
  s.car.userData.hide([]);
  s.state = { vanish, gone };
  s.field.userData.set(ctx.t, gone ? -1e6 : vanish);
  return s;
}
function f3Update(ctx) { const s = ctx.set; s.field.userData.set(ctx.t, s.state?.gone ? -1e6 : s.state?.vanish ?? null); }
function doorAt(ctx, i) { return ctx.set.doors[i]; }
/** door-local → world */
function DL(door) { door.updateMatrixWorld(true); return (x, y, z) => door.localToWorld(V(x, y, z)); }
function bellAt(ctx, x, y, z, yaw = PI) { const B = ctx.props.bell; ctx.add(B, ctx.set.root); B.position.set(x, y, z); B.rotation.set(0, yaw, 0); return B; }
function tallyAt(ctx, p) { const T = ctx.props.tally; ctx.add(T, ctx.set.root); T.position.copy(p); return T; }
const TALLY_T = () => null;
function tallyState(ctx) {
  const a = ctx.time('b14.w0'), pop1 = ctx.time('b15.w13') + 0.32, pop2 = ctx.time('b16.end') + 0.22;
  return { appear: [a, a + 0.15, a + 0.3], pop: [pop1, pop2, 1e9] };
}
function portalPorch(ctx) {
  const TL = tower(ctx, 2);
  const [x, , z] = TL.local(0, 0, 5.3);
  return { q: [x, 1.31 + 0.0, z], yaw: TOWER.yaw + PI, TL };
}
function walkPath(ctx, ch, z0, z1, t0, dur) { const u = clamp((ctx.t - t0) / dur, 0, 1); ch.root.position.z = lerp(z0, z1, u); return u; }

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
const huss = (beat, n, mk) => Array.from({ length: n }, (_, i) => ({ name: `${beat} huss ${i + 1}`, start: i === 0 ? `${beat}.h0-0.12` : `${beat}.h${i}-0.03`, ...mk(i) }));

export const shots = [
  // ── b01 "In this town, the clock tower elevator has three buttons. The tower only has two floors."
  {
    name: 'tower hero', start: 0, set: 'town',
    setup(ctx) { day(ctx); const TL = tower(ctx, 2); ctx.store = { TL, life: parkLife(ctx) }; const P = ctx.props; putL(ctx, P.sparkle, -51, 3, -4); },
    update(ctx, lt) {
      const { TL, life } = ctx.store; parkLifeAnim(ctx, life); ctx.props.sparkle.userData.set(ctx.t, 0.8);
      const a = { pos: TL(-2.2, 0.5, 13.5), look: TL(0, 7.0, 0), fov: 54 }, b = { pos: TL(-1.4, 0.8, 11.5), look: TL(0, 9.5, 0), fov: 52 };
      ctx.cam.move(a, b, clamp(lt / 1.9, 0, 1), ease.inOutSine);
      tag(ctx, 'THE CLOCK TOWER', 0.35, Infinity, { y: 0.12, size: 70, bg: 'rgba(63,122,90,0.9)' });
    },
  },
  {
    name: 'panel 1 2 3', start: 'b01.w6-0.05', set: 'lift',
    setup(ctx) { lift(ctx, 'ground', ['back']); },
    update(ctx, lt) {
      const t = ctx.t, car = ctx.set.car, t3 = ctx.time('b01.w8');
      carState(ctx, { glow3: t > t3 ? 0.9 + 0.3 * Math.sin(t * 6) : 0.35, floor: '1' });
      const p2 = panelPoint(car, 2);
      ctx.cam.move({ pos: p2.clone().add(V(0.35, 0.0, -2.0)), look: p2.clone().add(up(-0.25)), fov: 36 }, { pos: p2.clone().add(V(0.28, 0.0, -1.8)), look: p2.clone().add(up(-0.24)), fov: 36 }, clamp(lt / 1.5, 0, 1), ease.outCubic);
      const d = ctx.time('b01.w7');
      ctx.fx.text('1 · 2 · 3?', { x: 0.5, y: 0.075, size: 104, fill: '#ffe14a', stroke: '#000', line: 12, rot: -0.03, scale: t < d ? 0.01 : ease.outBack(clamp((t - d) / 0.2, 0, 1)) });
    },
  },
  {
    name: 'count the floors', start: 'b01.w10-0.05', set: 'town',
    setup(ctx) { day(ctx); const TL = tower(ctx, 2); ctx.store = { TL, life: parkLife(ctx) }; },
    update(ctx, lt) {
      const { TL, life } = ctx.store; parkLifeAnim(ctx, life);
      const u = clamp(lt / 1.6, 0, 1);
      const cam = { pos: TL(2.4, 1.6, 10.0), look: TL(0, lerp(3.8, 7.6, ease.inOutSine(u)), 0), fov: 48 };
      ctx.cam.set(cam);
      label(ctx, cam, TL(-2.3, 4.0, 1.9), 'FLOOR 1', ctx.time('b01.w11'), { size: 80 });
      label(ctx, cam, TL(-2.3, 7.2, 1.9), 'FLOOR 2', ctx.time('b01.w14'), { size: 80 });
      if (ctx.t > ctx.time('b01.w15')) label(ctx, cam, TL(2.6, 10.6, 1.9), 'THAT\'S IT.', ctx.time('b01.w15') + 0.1, { fill: '#ffffff', size: 78, rot: 0.05 });
    },
  },
  // ── b02 "Nobody presses three."
  {
    name: 'glowing 3 + pigeon', start: 'b02-0.15', set: 'lift',
    setup(ctx) { const car = lift(ctx, 'ground', ['back']); ctx.store = { car, p: pigeonOnPanel(ctx, car) }; },
    update(ctx, lt) {
      const { car, p } = ctx.store, t = ctx.t;
      carState(ctx, { glow3: 0.8 + 0.25 * Math.sin(t * 4), floor: '1', light: 0.85 });
      p.pose('idle', t, { headPitch: 0.5 }); p.face('squint', t);
      const b3 = panelPoint(car, 3);
      ctx.cam.move({ pos: b3.clone().add(V(0.5, 0.35, -1.9)), look: b3.clone().add(up(0.45)), fov: 44 }, { pos: b3.clone().add(V(0.35, 0.3, -1.5)), look: b3.clone().add(up(0.42)), fov: 42 }, clamp(lt / 1.4, 0, 1), ease.inOutSine);
    },
  },
  // ── b03 HUSS ×3: the 3 pulses brighter on each HUSS, lights flicker
  ...huss('b03', 3, (i) => ({
    set: 'lift',
    setup(ctx) { const car = lift(ctx, 'ground', i === 2 ? ['back'] : ['back']); ctx.store = { car, p: pigeonOnPanel(ctx, car) }; },
    update(ctx) {
      const { car, p } = ctx.store, t = ctx.t, hits = ctx.hussTimes('b03').map((h) => h + 0.03);
      const h = lastBefore(hits, t), dh = h != null ? t - h : 9, n = hits.filter((x) => x <= t).length;
      const pulse = dh < 0.15 ? 1 - dh / 0.15 : 0;
      carState(ctx, { glow3: 0.9 + 0.4 * n + 1.6 * pulse, floor: '1', light: dh < 0.08 ? 0.15 : 0.7 + 0.3 * Math.sin(t * 40) * (dh < 0.25 ? 1 : 0), tint: dh < 0.2 ? '#c58cff' : null });
      p.pose(dh < 0.2 ? 'flap' : 'idle', t, { headPitch: 0.45 }); p.face(dh < 0.2 ? 'shocked' : 'squint', t);
      const b3 = panelPoint(car, 3);
      const cams = [
        { pos: b3.clone().add(V(0.15, 0.05, -0.95)), look: b3.clone().add(up(-0.13)), fov: 36 },
        { pos: b3.clone().add(V(-0.35, -0.25, -0.9)), look: b3.clone().add(up(0.45)), fov: 42 },
        { pos: b3.clone().add(V(0.4, 0.3, -1.3)), look: b3.clone().add(up(0.3)), fov: 46 },
      ];
      ctx.cam.set(cams[i]); ctx.cam.punch(hits, t, 0.12, 0.2);
      if (pulse > 0) ctx.fx.overlay('#b46cff', 0.1 * pulse);
    },
  })),
  // ── b04 "Mr. Kowalski pressed it once. He came back with a pet cloud."
  {
    name: 'kowalski steps out', start: 'b04-0.1', set: 'lift',
    setup(ctx) {
      const car = lift(ctx, 'ground', []); const P = ctx.props;
      placeS(ctx, 'kowalski', 0.15, 0, -0.2, 0);
      ctx.add(P.cloud, ctx.set.root); ctx.add(P.leash, ctx.set.root);
      ctx.store = { car };
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, k = ctx.cast.kowalski, t0 = ctx.time('b04') + 0.1;
      const doors = ease.inOutCubic(clamp((t - t0) / 0.7, 0, 1));
      carState(ctx, { doors, glow3: 0.8, floor: '3' });
      const tw = ctx.time('b04') + 0.8, wu = clamp((t - tw) / 2.2, 0, 1);
      k.root.position.set(0.15, 0, lerp(-0.2, 2.3, wu));
      if (wu > 0 && wu < 1) k.pose('walk', t, { speed: 1 }); else k.pose('idle', t);
      k.face(t > ctx.time('b04.w10') ? 'smug' : 'smile', t);
      k.joints.armR.rotation.x = -0.5; k.joints.foreArmR.rotation.x = -0.6;
      const hand = k.joints.handR.getWorldPosition(V());
      const cp = V(0.95 + 0.3 * wu, 1.6 + 0.12 * Math.sin(t * 2.2), k.root.position.z - 0.1);
      P.cloud.position.copy(cp); P.cloud.rotation.y = 0.3; P.cloud.userData.set(t, { mood: 'smug' });
      P.leash.userData.set(hand, P.cloud.userData.ring.getWorldPosition(V()), 0.2);
      ctx.cam.move({ pos: V(-0.9, 1.45, 5.0), look: V(0.25, 1.3, 0.6), fov: 44 }, { pos: V(-1.0, 1.4, 5.4), look: V(0.45, 1.35, 2.0), fov: 44 }, clamp(lt / 3, 0, 1), ease.inOutSine);
      fill(ctx, { pos: V(-1, 1.6, 4.5) }, 0.5, '#ffe6c8');
    },
  },
  {
    name: 'pet cloud', start: 'b04.w9-0.05', set: 'lift',
    setup(ctx) { lift(ctx, 'ground', []); const P = ctx.props; placeS(ctx, 'kowalski', -0.25, 0, 1.8, 0.2); ctx.add(P.cloud, ctx.set.root); ctx.add(P.leash, ctx.set.root); },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, k = ctx.cast.kowalski;
      carState(ctx, { doors: 1, glow3: 0.8, floor: '3' });
      k.pose('idle', t); k.face('smile', t); k.joints.armR.rotation.x = -0.9; k.joints.foreArmR.rotation.x = -0.5;
      const hand = k.joints.handR.getWorldPosition(V());
      const cp = V(0.55, 1.95, 2.75);
      P.cloud.position.copy(cp); P.cloud.rotation.y = -0.35; P.cloud.userData.set(t, { mood: t > ctx.time('b04.w11') - 0.1 ? 'smug' : 'happy' });
      P.leash.userData.set(hand, P.cloud.userData.ring.getWorldPosition(V()), 0.15);
      ctx.cam.move({ pos: V(0.9, 1.5, 5.4), look: cp.clone().add(V(-0.35, -0.35, 0)), fov: 42 }, { pos: V(0.9, 1.6, 4.6), look: cp.clone().add(V(-0.1, -0.15, 0)), fov: 38 }, clamp(lt / 1.2, 0, 1), ease.outCubic);
      fill(ctx, { pos: V(0.2, 1.8, 3.8) }, 0.6, '#ffe6c8');
    },
  },
  // ── b05 "He walks it every morning. It rains on anyone who's rude."
  {
    name: 'morning walk', start: 'b05-0.1', set: 'town',
    setup(ctx) {
      day(ctx); const P = ctx.props;
      placeL(ctx, 'kowalski', -16, 0.12, -6.4, PI / 2);
      ctx.add(P.cloud, townRoot(ctx)); ctx.add(P.leash, townRoot(ctx));
      const folks = [[TOWN_IDS[0], -9.5, -7.6, 0.4, 'wave'], [TOWN_IDS[1], -8.7, -7.9, -0.9, 'idle'], [TOWN_IDS[2], -20, 6.6, PI - 0.3, 'idle'], [TOWN_IDS[3], -12, 6.8, PI, 'walk']];
      folks.forEach(([id, x, z, yaw]) => placeL(ctx, id, x, 0.12, z, yaw));
      ctx.store = { folks };
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, k = ctx.cast.kowalski, W = TW(ctx);
      const x = -15.2 + lt * WALK_SPEED * 0.75;
      k.root.position.set(x, 0.12, -6.4); k.pose('walk', t, { speed: 0.75 }); k.face('smile', t);
      k.joints.armR.rotation.x = -0.7; k.joints.foreArmR.rotation.x = -0.3;
      ctx.store.folks.forEach(([id, fx, fz, yaw, act], i) => { const c = ctx.cast[id]; if (act === 'walk') { c.root.position.x = fx - lt * 0.7; c.root.rotation.y = -PI / 2; } c.pose(act, t + i, { speed: 0.7 }); c.face('smile', t + i); });
      const hand = k.joints.handR.getWorldPosition(V());
      const cl = townRoot(ctx).worldToLocal(hand.clone()).add(V(-0.8, 1.2, 0.15));
      P.cloud.position.copy(cl); P.cloud.rotation.y = PI / 2; P.cloud.userData.set(t, { mood: 'happy' });
      P.leash.userData.set(hand, P.cloud.userData.ring.getWorldPosition(V()), 0.15);
      const kx = x;
      ctx.cam.move({ pos: W(kx + 3.2, 1.5, -1.2), look: W(kx - 0.2, 1.5, -6.4), fov: 46 }, { pos: W(kx + 3.6, 1.4, -1.6), look: W(kx + 0.2, 1.5, -6.4), fov: 44 }, clamp(lt / 1.4, 0, 1));
    },
  },
  {
    name: 'rain on the rude', start: 'b05.w5-0.15', set: 'town',
    setup(ctx) {
      day(ctx); const P = ctx.props;
      placeL(ctx, 'kowalski', -8.4, 0.12, -6.4, PI / 2); placeL(ctx, 'rude', -6.2, 0.12, -6.7, -PI / 2 + 0.4);
      placeL(ctx, TOWN_IDS[4], -7.2, 0.12, -8.1, 0.3);
      ctx.add(P.cloud, townRoot(ctx)); ctx.add(P.leash, townRoot(ctx));
    },
    update(ctx, lt) {
      const t = ctx.t, P = ctx.props, k = ctx.cast.kowalski, r = ctx.cast.rude, W = TW(ctx);
      const tRain = ctx.time('b05.w6') + 0.1, tShock = ctx.time('b05.w10') - 0.1;
      k.root.position.set(-8.4 + lt * 0.3, 0.12, -6.4); k.pose(t < tRain ? 'walk' : 'idle', t, { speed: 0.6 }); k.face(t > tRain ? 'smug' : 'neutral', t);
      k.joints.armR.rotation.x = -0.8; k.joints.foreArmR.rotation.x = -0.3;
      const bystander = ctx.cast[TOWN_IDS[4]]; bystander.pose(t > tShock ? 'laugh' : 'idle', t); bystander.face(t > tShock ? 'laugh' : 'neutral', t);
      if (t < tShock) { r.pose('pointLaugh', t); r.face('laugh', t); } else { r.pose('surprised', t - tShock); r.face('shocked', 0.3); }
      const hand = k.joints.handR.getWorldPosition(V());
      const kLoc = townRoot(ctx).worldToLocal(hand.clone());
      const over = V(-6.2, 0.12 + 2.75, -6.65);
      const u = ease.inOutCubic(clamp((t - (tRain - 0.35)) / 0.45, 0, 1));
      const cl = kLoc.clone().add(V(-0.6, 1.2, 0.2)).lerp(over, u);
      P.cloud.position.copy(cl); P.cloud.rotation.y = -PI / 2 + 0.3; P.cloud.userData.set(t, { mood: u > 0.5 ? 'angry' : 'happy', rain: t > tRain ? 1 : 0, fall: 1.1 });
      P.leash.userData.set(hand, P.cloud.userData.ring.getWorldPosition(V()), u > 0.5 ? 0.05 : 0.2);
      ctx.cam.move({ pos: W(-7.2, 1.3, -0.9), look: W(-7.1, 1.75, -6.6), fov: 50 }, { pos: W(-7.0, 1.25, -1.3), look: W(-7.0, 1.85, -6.6), fov: 50 }, clamp(lt / 1.8, 0, 1), ease.inOutSine);
      if (t > tShock) tag(ctx, 'RUDE.', tShock + 0.05, Infinity, { y: 0.16, bg: 'rgba(40,110,220,0.9)' });
    },
  },
  // ── b06 "Coach Dana pressed it. She came back twelve feet tall. Her team hasn't lost since."
  ...['kids', 'crane', 'wide'].map((kind) => ({
    name: `coach dana ${kind}`, start: kind === 'kids' ? 'b06-0.1' : kind === 'crane' ? 'b06.w4-0.05' : 'b06.w10-0.05', set: 'town',
    setup(ctx) {
      day(ctx); const P = ctx.props;
      const a = ctx.anchor('park.table'); const ap = a.getWorldPosition(V()); const Fp = frame(townRoot(ctx).worldToLocal(V(ap.x, 0, ap.z)), yawOf(a));
      const dana = placeL(ctx, 'dana', ...Fp(1.9, 0, -0.6).toArray(), Fp.yaw - 0.15);
      ctx.add(P.ball, dana.joints.handR); P.ball.position.set(0.02, 0.1, 0.07); P.ball.scale.setScalar(1.5 / 3.6);
      ctx.add(P.ballGlow, P.ball); P.ballGlow.position.set(0, 0, 0);
      ctx.add(P.whistle, dana.joints.torso); P.whistle.position.set(0, 0, 0); P.whistle.scale.setScalar(1);
      const dl = Fp(1.9, 0, -0.6);
      const kids = KID_IDS.map((id, i) => { const ang = -1.5 + i * 0.62 + (i > 2 ? 1.2 : 0), r = 1.7 + 0.35 * (i % 2); const kp = Fp(1.9 + Math.sin(ang) * r, 0, -0.6 + Math.cos(ang) * r); return placeL(ctx, id, kp.x, 0, kp.z, yawTo(kp, dl)); });
      ctx.store = { Fp, kids };
    },
    update(ctx, lt) {
      const { Fp, kids } = ctx.store, t = ctx.t, d = ctx.cast.dana, W = (x, y, z) => townRoot(ctx).localToWorld(Fp(x, y, z));
      d.pose('idle', t, { intensity: 0.5, headPitch: 0.35 }); d.face('grin', t);
      d.joints.armR.rotation.x = -1.5; d.joints.armR.rotation.z = 0.5; d.joints.foreArmR.rotation.x = -0.2;
      ctx.props.ballGlow.material.opacity = 0.55 + 0.15 * Math.sin(t * 5);
      kids.forEach((k, i) => { k.pose(i % 2 ? 'cheer' : 'clap', t + i * 0.3, { lookAt: humanFace(d) }); k.face(i % 3 ? 'grin' : 'laugh', t + i); });
      if (kind === 'kids') {
        ctx.cam.move({ pos: W(1.0, 0.45, 4.6), look: W(1.9, 1.5, -0.6), fov: 50 }, { pos: W(1.3, 0.4, 3.9), look: W(1.9, 2.0, -0.6), fov: 50 }, clamp(lt / 1.4, 0, 1), ease.inOutSine);
      } else if (kind === 'crane') {
        const u = ease.inOutCubic(clamp(lt / 1.4, 0, 1));
        ctx.cam.move({ pos: W(1.6, 0.5, 4.6), look: W(1.9, 1.2, -0.6), fov: 52 }, { pos: W(1.0, 1.2, 6.8), look: W(1.9, 5.6, -0.6), fov: 56 }, u);
        if (ctx.t > ctx.time('b06.w7')) tag(ctx, '12 FEET', ctx.time('b06.w7'), Infinity, { y: 0.14, size: 90, bg: 'rgba(232,35,43,0.92)' });
      } else {
        ctx.cam.move({ pos: W(-1.2, 0.6, 9.5), look: W(1.2, 3.6, -0.6), fov: 54 }, { pos: W(-1.0, 0.55, 8.8), look: W(1.3, 3.9, -0.6), fov: 54 }, clamp(lt / 1.4, 0, 1));
        tag(ctx, 'UNDEFEATED', ctx.time('b06.w12') - 0.1, Infinity, { y: 0.15, size: 96, fill: '#ffe14a', bg: 'rgba(232,35,43,0.92)', rot: -0.05 });
      }
    },
  })),
  // ── b07 "So the rule is simple. Never press three."
  {
    name: 'serious nods', start: 'b07-0.1', set: 'town',
    setup(ctx) {
      day(ctx); const P = ctx.props;
      const b = ctx.anchor('square.banner'), bp = townRoot(ctx).worldToLocal(b.getWorldPosition(V())), F = frame(V(bp.x, 0, bp.z), yawOf(b));
      putL(ctx, P.banner3, ...F(0, bp.y, 0.06).toArray(), F.yaw);
      const ids = TOWN_IDS.slice(5, 10).concat(['kowalski']);
      const ppl = ids.map((id, i) => placeL(ctx, id, ...F((i - 2.5) * 1.15, 0, 9.0 + (i % 2) * 0.5).toArray(), F.yaw + (i - 2.5) * 0.06));
      ctx.store = { F, ppl, by: bp.y };
    },
    update(ctx, lt) {
      const { F, ppl } = ctx.store, t = ctx.t, W = (x, y, z) => townRoot(ctx).localToWorld(F(x, y, z));
      ppl.forEach((c, i) => { c.pose('crossArms', t + i * 0.2, { headPitch: 0.25 * Math.max(0, Math.sin((t + i * 0.37) * 5)) }); c.face('determined', 1.0); });
      ctx.cam.move({ pos: W(0.4, 1.55, 13.8), look: W(0, 1.75, 8.5), fov: 44 }, { pos: W(0.2, 1.6, 13.0), look: W(0, 1.85, 8.5), fov: 42 }, clamp(lt / 1.4, 0, 1));
    },
  },
  {
    name: 'never press 3 banner', start: 'b07.w5-0.05', set: 'town',
    setup(ctx) {
      day(ctx); const P = ctx.props;
      const b = ctx.anchor('square.banner'), bp = townRoot(ctx).worldToLocal(b.getWorldPosition(V())), F = frame(V(bp.x, 0, bp.z), yawOf(b));
      putL(ctx, P.banner3, ...F(0, bp.y, 0.06).toArray(), F.yaw);
      ctx.store = { F, by: bp.y };
    },
    update(ctx, lt) {
      const { F, by } = ctx.store, W = (x, y, z) => townRoot(ctx).localToWorld(F(x, y, z));
      ctx.cam.move({ pos: W(0.5, by - 1.3, 12.5), look: W(0, by - 0.1, 0), fov: 34 }, { pos: W(0.2, by - 0.8, 9.6), look: W(0, by, 0), fov: 34 }, clamp(lt / 1.2, 0, 1), ease.outCubic);
      tag(ctx, 'NEVER PRESS 3', ctx.time('b07.w5') + 0.05, Infinity, { y: 0.13, size: 100, fill: '#ffffff', bg: 'rgba(200,0,40,0.92)', rot: -0.04 });
    },
  },
  // ── b08 "Yesterday, I took Grandma her groceries. She lives on floor two. I yelled HUSS up at her window,
  //        and she yelled HUSS right back. Then the elevator pressed three by itself."
  {
    name: 'groceries walk', start: 'b08-0.1', set: 'town',
    setup(ctx) { day(ctx); const TL = tower(ctx, 2); const me = placeL(ctx, 'me', -48.0, 0, -7.6, -PI / 2); carryBags(ctx, me); ctx.store = { TL, life: [] }; },
    update(ctx, lt) {
      const { TL, life } = ctx.store, t = ctx.t, me = ctx.cast.me, W = TW(ctx); parkLifeAnim(ctx, life);
      const x = -47.8 - lt * WALK_SPEED * 0.9;
      me.root.position.set(x, 0, -7.6); me.pose('walk', t, { speed: 0.9 }); bagArms(me); me.face('smile', t);
      ctx.cam.set({ pos: W(x + 1.6, 1.3, -11.8), look: W(x - 0.9, 2.9, -3.0), fov: 52 });
      tag(ctx, 'YESTERDAY', ctx.time('b08') + 0.05, ctx.time('b08.w3'), { y: 0.14 });
      if (ctx.t > ctx.time('b08.w3')) tag(ctx, 'GRANDMA\'S GROCERIES', ctx.time('b08.w3'), Infinity, { y: 0.14, size: 64, bg: 'rgba(192,96,122,0.92)' });
    },
  },
  {
    name: 'floor two window', start: 'b08.w6-0.05', set: 'town',
    setup(ctx) { day(ctx); const TL = tower(ctx, 2); grandmaWindow(ctx, TL); ctx.store = { TL }; },
    update(ctx, lt) {
      const { TL } = ctx.store, g = ctx.cast.grandma, t = ctx.t;
      grandmaWindowPose(g, t, 0, t > ctx.time('b08.w9') ? 1 : 0);
      const u = ease.inOutCubic(clamp(lt / 1.2, 0, 1));
      const cam = { pos: TL(1.6, 1.4, 9.5), look: TL(0, lerp(2.5, 7.0, u), 0), fov: 44 };
      ctx.cam.set(cam);
      label(ctx, cam, TL(-1.3, 8.4, 1.9), 'FLOOR 2', ctx.time('b08.w9'));
    },
  },
  {
    name: 'huss up at the window', start: 'b08.w11-0.05', set: 'town',
    setup(ctx) { day(ctx); const TL = tower(ctx, 2); const [x, , z] = TL.local(0.25, 0, 5.4); const me = placeL(ctx, 'me', x, 0, z, TOWER.yaw + PI); carryBags(ctx, me); grandmaWindow(ctx, TL); ctx.store = { TL }; },
    update(ctx, lt) {
      const { TL } = ctx.store, t = ctx.t, me = ctx.cast.me, th = ctx.time('b08.w13');
      const sh = t > th - 0.05 && t < th + 0.5;
      me.pose('idle', t, { headPitch: -0.55 }); bagArms(me); me.face(sh ? 'huss' : 'determined', t);
      if (sh) { me.joints.torso.rotation.x -= 0.12; }
      grandmaWindowPose(ctx.cast.grandma, t, 0, 0);
      ctx.cam.move({ pos: TL(0.95, 0.95, 8.3), look: TL(0.0, 5.6, 0), fov: 56 }, { pos: TL(0.9, 0.9, 8.0), look: TL(0.0, 5.9, 0), fov: 56 }, clamp(lt / 1.4, 0, 1));
      if (sh) ctx.cam.shake(0.12, t, 3);
      if (t > th) ctx.fx.text('HUSS!', { x: 0.62, y: 0.3, size: 120, fill: '#ffe14a', stroke: '#000', line: 12, rot: -0.12, scale: ease.outBack(clamp((t - th) / 0.15, 0, 1)), alpha: clamp(1 - (t - th - 0.6) / 0.2, 0, 1) });
    },
  },
  {
    name: 'grandma huss back', start: 'b08.w18-0.05', set: 'town',
    setup(ctx) { day(ctx); const TL = tower(ctx, 2); grandmaWindow(ctx, TL); ctx.store = { TL }; },
    update(ctx, lt) {
      const { TL } = ctx.store, t = ctx.t, g = ctx.cast.grandma, th = ctx.time('b08.w21');
      const sh = t > th - 0.05 && t < th + 0.6;
      grandmaWindowPose(g, t, sh ? 1 : 0, 0);
      const f = humanFace(g);
      ctx.cam.move({ pos: TL(0.6, 6.8, 6.0), look: f.clone().add(up(-0.3)), fov: 42 }, { pos: TL(0.5, 6.9, 5.2), look: f.clone().add(up(-0.25)), fov: 40 }, clamp(lt / 1.3, 0, 1));
      if (sh) ctx.cam.shake(0.15, t, 5);
      if (t > th) ctx.fx.text('HUSS!', { x: 0.4, y: 0.24, size: 130, fill: '#ffe14a', stroke: '#000', line: 12, rot: 0.1, scale: ease.outBack(clamp((t - th) / 0.15, 0, 1)), alpha: clamp(1 - (t - th - 0.7) / 0.2, 0, 1) });
    },
  },
  {
    name: 'in the elevator', start: 'b08.w24-0.05', set: 'lift',
    setup(ctx) { lift(ctx, 'ground', ['back']); const me = placeS(ctx, 'me', 0.2, 0, -0.05, 0); carryBags(ctx, me); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, tStatic = ctx.time('b08.w24');
      const fl = t - tStatic < 0.6 && t > tStatic ? (Math.sin(t * 70) > 0.2 ? 0.2 : 1) : 1;
      carState(ctx, { floor: '1', glow3: 0.4, light: fl });
      me.pose('idle', t); bagArms(me); me.face('neutral', 1.0);
      ctx.cam.move({ pos: V(0.85, 1.7, -2.4), look: V(-0.3, 1.35, 0.7), fov: 46 }, { pos: V(0.75, 1.65, -2.1), look: V(-0.4, 1.35, 0.7), fov: 44 }, clamp(lt / 1.0, 0, 1));
      if (fl < 1) glitch(ctx, 0.35, 2);
    },
  },
  {
    name: '3 clicks in', start: 'three8-0.12', set: 'lift',
    setup(ctx) { lift(ctx, 'ground', ['back']); },
    update(ctx, lt) {
      const t = ctx.t, car = ctx.set.car, t3 = ctx.markers.three8 + 0.05;
      const press = t < t3 ? 0 : t < t3 + 0.12 ? (t - t3) / 0.12 : 1;
      carState(ctx, { floor: '1', glow3: t > t3 ? 1.6 + 0.4 * Math.sin(t * 12) : 0.4, press3: press, light: 0.8 });
      const b3 = panelPoint(car, 3);
      ctx.cam.set({ pos: b3.clone().add(V(0.18, 0.06, -0.55)), look: b3, fov: 32 });
      if (t > t3 && t < t3 + 0.1) ctx.cam.shake(0.2, t, 8);
      tag(ctx, 'CLICK.', t3, Infinity, { y: 0.2, size: 80, bg: 'rgba(90,31,168,0.92)' });
    },
  },
  {
    name: 'slow turn', start: 'b08.w29-0.02', set: 'lift',
    setup(ctx) { lift(ctx, 'ground', ['back']); const me = placeS(ctx, 'me', 0.2, 0, -0.45, 0); carryBags(ctx, me); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, car = ctx.set.car;
      carState(ctx, { floor: '1', glow3: 1.6 + 0.4 * Math.sin(t * 12), press3: 1, light: 0.75, tint: '#d9b8ff' });
      const u = ease.inOutSine(clamp(lt / 0.7, 0, 1));
      me.pose('idle', t, { headYaw: -1.0 * u }); bagArms(me); me.face(u > 0.5 ? 'shocked' : 'neutral', 0.4);
      const f = humanFace(me);
      ctx.cam.set({ pos: V(-0.25, 1.62, 0.78), look: f.clone().add(up(-0.05)), fov: 40 });
      fill(ctx, { pos: V(-0.4, 1.6, 0.6) }, 0.5, '#d9b8ff');
    },
  },
  // ── b09 HUSS ×6: the elevator rockets upward
  ...huss('b09', 6, (i) => ({
    set: i === 3 ? 'town' : 'lift',
    setup(ctx) {
      if (i === 3) { day(ctx); const TL = tower(ctx, 2); const P = ctx.props; putL(ctx, P.rocket, 0, 0, 0); putL(ctx, P.rocketGlow, 0, 0, 0); putL(ctx, P.rocketTrail, 0, 0, 0); ctx.store = { TL }; return; }
      lift(ctx, 'ground', ['back']); const me = placeS(ctx, 'me', 0.2, 0, -0.05, 0);
      if (i !== 4) carryBags(ctx, me);
      ctx.add(ctx.props.items, ctx.set.root); ctx.props.items.position.set(0.2, 0, -0.05);
    },
    update(ctx) {
      const t = ctx.t, hits = ctx.hussTimes('b09').map((h) => h + 0.03), h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      const k = clamp((t - ctx.time('b09')) / 1.2, 0, 1);
      if (i === 3) {
        const { TL } = ctx.store, P = ctx.props, top = TL.obj.userData.top;
        const y = top - 1 + (t - (hits[3] - 0.05)) * 28;
        const [x, , z] = TL.local(0, 0, 0);
        P.rocket.position.set(x, y, z); P.rocket.rotation.set(0, TOWER.yaw, 0); P.rocket.userData.set({ glow3: 2, light: 2, floor: '3' });
        P.rocketGlow.position.set(x, y + 1.3, z); P.rocketTrail.position.set(x, y - 2.5, z); P.rocketTrail.scale.set(3, 9, 1);
        const cam = { pos: TL(-3, 1.0, 14), look: TL(0, 14, 0), fov: 60 };
        ctx.cam.set(cam); ctx.cam.shake(0.5, t, 11); ctx.cam.punch(hits, t, 0.12, 0.2);
        counter(ctx, '3');
        return;
      }
      const me = ctx.cast.me, items = ctx.props.items;
      items.userData.set(t, k);
      me.pose('surprised', 0.25 + 0.05 * Math.sin(t * 20)); if (i !== 4) bagArms(me);
      me.face(dh < 0.2 ? 'huss' : 'shocked', 0.3);
      const strobe = dh < 0.1 ? (i % 2 ? '#ff4a5a' : '#b46cff') : '#d9b8ff';
      carState(ctx, { floor: '3', glow3: 2.2, press3: 1, light: dh < 0.06 ? 2.2 : 0.55, tint: strobe });
      const f = humanFace(me), disp = ctx.set.car.userData.display.getWorldPosition(V());
      const cams = [
        { pos: V(0.75, 1.5, -2.6), look: V(0.0, 1.35, 0.4), fov: 50 },
        { pos: V(0.85, 1.0, 0.7), look: V(0.1, 2.0, -0.3), fov: 58 },
        { pos: V(0.05, 1.55, 0.75), look: f, fov: 42 },
        null,
        { pos: V(-0.45, 1.25, 0.4), look: V(0.3, 1.75, -0.2), fov: 55 },
        { pos: V(0.9, 2.2, -2.4), look: V(0.0, 1.1, 0.3), fov: 54 },
      ];
      ctx.cam.set(cams[i]); ctx.cam.shake(0.35 + 0.2 * k, t, 7 + i); ctx.cam.punch(hits, t, 0.12, 0.2);
      if (dh < 0.08) ctx.fx.overlay('#ffffff', 0.35 * (1 - dh / 0.08));
      counter(ctx, (Math.floor(t * 12) % 3 === 0) ? '3' : '3', { scale: dh < 0.1 ? 1.15 : 1, alpha: (Math.floor(t * 24) % 4) ? 1 : 0.6 });
      if (i === 5) white(ctx, ctx.time('b09.end') + 0.05, ctx.time('b10') - 0.05, 0.9);
    },
  })),
  // ── b10 "The doors opened onto nothing."
  {
    name: 'doors open onto nothing', start: 'b10-0.1', set: 'f3',
    setup(ctx) { f3(ctx); const car = ctx.set.car; car.userData.hide(['back']); placeS(ctx, 'me', -0.5, 0, -0.3, 0.12); carryBags(ctx, ctx.cast.me); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, car = ctx.set.car, t0 = ctx.time('b10') + 0.05;
      f3Update(ctx);
      const doors = ease.inOutCubic(clamp((t - t0) / 0.9, 0, 1));
      car.userData.set({ t, doors, glow3: 1.2, press3: 1, floor: '3', light: 0.7, tint: '#d9b8ff' });
      me.pose('idle', t, { intensity: 0.3 }); bagArms(me); me.face('shocked', 0.3);
      ctx.cam.move({ pos: V(0.55, 1.45, -3.0), look: V(0.1, 1.3, 4), fov: 50 }, { pos: V(0.45, 1.45, -2.3), look: V(0.1, 1.4, 6), fov: 48 }, clamp(lt / 1.5, 0, 1), ease.inOutSine);
      fadeIn(ctx, ctx.time('b10') - 0.1, 0.35);
    },
  },
  // ── b11 "Just doors. Hundreds of them, floating in the fog."
  {
    name: 'hundreds of doors', start: 'b11-0.1', set: 'f3',
    setup(ctx) { f3(ctx); ctx.set.car.userData.hide(['back']); placeS(ctx, 'me', 0.0, 0, 2.1, 0); carryBags(ctx, ctx.cast.me); },
    update(ctx, lt, u) {
      const t = ctx.t, me = ctx.cast.me; f3Update(ctx);
      ctx.set.car.userData.set({ t, doors: 1, glow3: 1.0, press3: 1, floor: '3' });
      me.pose('idle', t, { headPitch: -0.2, headYaw: 0.4 * Math.sin(t * 0.8) }); bagArms(me); me.face('shocked', 0.3);
      ctx.cam.move({ pos: V(-1.2, 1.2, -4.5), look: V(0.3, 1.8, 14), fov: 50 }, { pos: V(-3.5, 7.5, -7.5), look: V(0.5, 0.5, 18), fov: 54 }, u, ease.inOutCubic);
      blobUnder(ctx, me);
      tag(ctx, 'FLOOR 3', ctx.time('b11') + 0.1, Infinity, { y: 0.13, size: 92, fill: '#f3dcff', bg: 'rgba(60,30,120,0.85)' });
    },
  },
  // ── b12 "And a glowing jellyfish in a bellhop hat."
  {
    name: 'the bellhop', start: 'b12-0.1', set: 'f3',
    setup(ctx) { f3(ctx); placeS(ctx, 'me', 0.0, 0, 3.2, 0.15); carryBags(ctx, ctx.cast.me); bellAt(ctx, 0.3, 1.9, 5.0, PI); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, B = ctx.props.bell; f3Update(ctx);
      const arrive = ease.outCubic(clamp(lt / 1.0, 0, 1));
      B.position.set(lerp(1.6, 0.35, arrive), lerp(3.2, 1.95, arrive), lerp(8, 4.75, arrive));
      const tb = ctx.time('b12.w6');
      const bow = t > tb ? Math.sin(PI * clamp((t - tb) / 0.9, 0, 1)) : 0;
      B.userData.set(t, { mood: bow > 0.1 ? 'happy' : (t > ctx.time('b12.w3') ? 'wink' : 'smile'), bow });
      me.pose('idle', t, { lookAt: B.position.clone() }); bagArms(me); me.face(t > ctx.time('b12.w3') ? 'shocked' : 'neutral', 0.3);
      const mid = V(0.1, 1.6, 3.7);
      ctx.cam.move({ pos: V(3.6, 1.6, 1.0), look: mid, fov: 48 }, { pos: V(3.2, 1.65, 1.4), look: mid.clone().add(V(0.1, 0.05, 0.2)), fov: 46 }, clamp(lt / 1.8, 0, 1), ease.inOutSine);
      fill(ctx, { pos: V(2.5, 2, 2.5) }, 0.6, '#d8c8ff');
      blobUnder(ctx, me);
    },
  },
  // ── b13 The Bellhop: "Welcome to floor three. One door is home. The rest are almost home."  (quote card)
  {
    name: 'one door is home', start: 'quoteBell', set: 'f3',
    setup(ctx) { f3(ctx); placeS(ctx, 'me', 0.0, 0, 3.2, 0.15); carryBags(ctx, ctx.cast.me); bellAt(ctx, 0.35, 1.95, 4.75, PI); },
    update(ctx, lt, u) {
      const t = ctx.t, me = ctx.cast.me, B = ctx.props.bell; f3Update(ctx);
      const sweep = t > ctx.time('b13.w8') ? ease.inOutSine(clamp((t - ctx.time('b13.w8')) / 0.6, 0, 1)) : 0;
      const talking = ctx.wordAt ? ctx.wordAt(t) : null;
      B.userData.set(t, { mood: Math.floor(t * 7) % 2 ? 'talk' : 'smile', sweep: Math.max(sweep, 0.3 * Math.sin(PI * clamp(lt / 1.5, 0, 1))) });
      B.rotation.y = PI - 0.5 * sweep;
      me.pose('idle', t, { lookAt: B.position.clone() }); bagArms(me); me.face('neutral', 0.3);
      ctx.cam.move({ pos: V(-1.6, 2.3, 1.0), look: V(0.6, 1.6, 7.0), fov: 48 }, { pos: V(-1.2, 2.6, 0.2), look: V(1.2, 1.6, 12.0), fov: 50 }, u, ease.inOutSine);
      blobUnder(ctx, me);
      quoteCard(ctx, 'One door is home. The rest are almost home.', 'The Bellhop', ctx.time('b13.w4') - 0.1, ctx.time('b13.end') + 0.15, { y: 0.3, byAt: ctx.time('b13.w6') });
      if (t < ctx.time('b13.w4') - 0.1) tag(ctx, 'WELCOME TO FLOOR 3', ctx.time('b13') + 0.05, Infinity, { y: 0.15, size: 66, fill: '#d8ffff', bg: 'rgba(20,90,110,0.85)' });
    },
  },
  // ── b14 "Three tries. Pick wrong, and you stay. Forever."
  {
    name: 'three tries', start: 'b14-0.1', set: 'f3',
    setup(ctx) { f3(ctx); placeS(ctx, 'me', 0.0, 0, 3.2, 0.15); carryBags(ctx, ctx.cast.me); const B = bellAt(ctx, 0.35, 1.95, 4.75, PI); tallyAt(ctx, V(0.35, 3.25, 4.75)); },
    update(ctx, lt) {
      const t = ctx.t, B = ctx.props.bell, me = ctx.cast.me; f3Update(ctx);
      B.userData.set(t, { mood: 'smile', point: 0.6 }); ctx.props.tally.userData.set(t, tallyState(ctx)); ctx.props.tally.rotation.y = PI + 0.15;
      me.pose('idle', t, { lookAt: V(0.35, 3.2, 4.75) }); bagArms(me); me.face('neutral', 0.3);
      ctx.cam.move({ pos: V(-0.9, 2.2, 1.3), look: V(0.3, 2.7, 4.75), fov: 48 }, { pos: V(-0.7, 2.3, 1.7), look: V(0.3, 2.8, 4.75), fov: 46 }, clamp(lt / 1.0, 0, 1));
      fill(ctx, { pos: V(-0.8, 2.3, 1.5) }, 0.6, '#d8c8ff');
      tag(ctx, '3 TRIES', ctx.time('b14.w1') - 0.05, Infinity, { y: 0.13, size: 110, fill: '#ffe14a', bg: 'rgba(20,10,40,0.85)' });
    },
  },
  {
    name: 'gulp', start: 'b14.w2-0.05', set: 'f3',
    setup(ctx) { f3(ctx); placeS(ctx, 'me', 0.0, 0, 3.2, 0.15); carryBags(ctx, ctx.cast.me); bellAt(ctx, 0.35, 1.95, 4.75, PI); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me; f3Update(ctx);
      ctx.props.bell.userData.set(t, { mood: 'smile' });
      me.pose('idle', t, { lookAt: V(0.35, 2.2, 4.75) }); bagArms(me); me.face('sweat', 0.3);
      me.joints.head.position.y += 0.015 * Math.sin(t * 9);
      const f = humanFace(me);
      ctx.cam.move({ pos: f.clone().add(V(-0.5, 0.05, 2.0)), look: f, fov: 34 }, { pos: f.clone().add(V(-0.4, 0.03, 1.6)), look: f, fov: 32 }, clamp(lt / 1.4, 0, 1));
      fill(ctx, { pos: f.clone().add(V(-0.6, 0.3, 1.8)) }, 0.7, '#e8dcff');
    },
  },
  {
    name: 'forever', start: 'b14.w7-0.05', set: 'f3',
    setup(ctx) { f3(ctx); placeS(ctx, 'me', 0.0, 0, 3.2, 0.15); carryBags(ctx, ctx.cast.me); bellAt(ctx, 0.35, 1.95, 4.75, PI); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me; f3Update(ctx);
      ctx.props.bell.userData.set(t, { mood: 'smile' });
      me.pose('idle', t); bagArms(me); me.face('sweat', 0.3);
      const u = ease.outCubic(clamp(lt / 0.8, 0, 1));
      ctx.cam.move({ pos: V(1.2, 2.4, 1.0), look: V(0, 1.4, 3.6), fov: 46 }, { pos: V(9, 18, -12), look: V(0, 0, 10), fov: 56 }, u);
      blobUnder(ctx, me);
      tag(ctx, 'FOREVER', ctx.time('b14.w7') + 0.05, Infinity, { y: 0.15, size: 110, fill: '#ffffff', bg: 'rgba(120,0,40,0.85)' });
    },
  },
  // ── b15 "Door one. My street. Perfect. Except the pigeon was the size of a house."
  {
    name: 'door one opens', start: 'b15-0.1', set: 'f3',
    setup(ctx) {
      f3(ctx); const d = doorAt(ctx, 0), F = DL(d);
      const p = F(0.95, 0, 0.6); placeS(ctx, 'me', p.x, 0, p.z, d.rotation.y + PI - 0.4);
      bellAt(ctx, 0.4, 2.1, 8.6, -PI / 2 - 0.6); tallyAt(ctx, V(0.4, 3.4, 8.6));
      ctx.add(ctx.props.spill, ctx.set.root);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, d = doorAt(ctx, 0), F = DL(d); f3Update(ctx);
      const t0 = ctx.time('b15') + 0.25, open = ease.inOutCubic(clamp((t - t0) / 0.6, 0, 1));
      d.userData.set({ t, open, portal: 1, flash: 0.6 * Math.max(0, 1 - Math.abs((t - t0 - 0.25) / 0.25)) });
      me.pose(t < t0 + 0.2 ? 'point' : 'idle', t); me.face(open > 0.5 ? 'smile' : 'neutral', 0.3);
      ctx.props.bell.userData.set(t, { mood: 'smile' }); ctx.props.tally.userData.set(t, tallyState(ctx)); ctx.props.tally.rotation.y = -PI / 2 - 0.6;
      const cam = { pos: F(-0.9, 1.65, 3.3), look: F(0.1, 1.3, 0), fov: 50 };
      ctx.cam.set(cam);
      renderPortal(ctx, d, cam, DOOR_VIEW.d1.q, DOOR_VIEW.d1.yaw);
      const sp = ctx.props.spill; sp.position.copy(F(0, 1.4, 0.8)); sp.intensity = 6 * open;
      blobUnder(ctx, me);
    },
  },
  {
    name: 'my street perfect', start: 'b15.w2-0.05', set: 'f3',
    setup(ctx) {
      f3(ctx); const d = doorAt(ctx, 0), F = DL(d);
      const p = F(0.95, 0, 0.6); placeS(ctx, 'me', p.x, 0, p.z, d.rotation.y + PI - 0.4);
      // town life seen through the door
      const town = offTown(ctx);
      [[TOWN_IDS[0], -1.5, -6.6, PI / 2], [TOWN_IDS[1], 3.0, 6.2, -PI / 2], [TOWN_IDS[2], 8.0, -6.4, PI / 2], [TOWN_IDS[3], 12.0, 6.6, -PI / 2]].forEach(([id, x, z, yaw]) => placeL(ctx, id, x, 0.12, z, yaw));
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, d = doorAt(ctx, 0), F = DL(d); f3Update(ctx);
      d.userData.set({ t, open: 1, portal: 1 });
      me.pose('idle', t); me.face('smile', t);
      [TOWN_IDS[0], TOWN_IDS[1], TOWN_IDS[2], TOWN_IDS[3]].forEach((id, i) => { const c = ctx.cast[id]; const base = [-1.5, 3.0, 8.0, 12.0][i]; const dir = i % 2 ? -1 : 1; c.root.position.x = base + dir * (t - 50) * 0.8; c.pose('walk', t + i, { speed: 0.9 }); c.face('smile', t + i); });
      const u = ease.inOutSine(clamp(lt / 1.6, 0, 1));
      const cam = { pos: F(lerp(0.15, 0.05, u), lerp(1.5, 1.4, u), lerp(2.0, 1.15, u)), look: F(0.0, 1.3, -2), fov: 52 };
      ctx.cam.set(cam);
      renderPortal(ctx, d, cam, DOOR_VIEW.d1.q, DOOR_VIEW.d1.yaw);
      tag(ctx, 'PERFECT', ctx.time('b15.w4') + 0.05, Infinity, { y: 0.15, size: 96, fill: '#7dffa0', bg: 'rgba(10,40,20,0.85)' });
    },
  },
  {
    name: 'giant pigeon', start: 'b15.w5-0.08', set: 'town',
    setup(ctx) {
      day(ctx); const P = ctx.props;
      const pg = placeL(ctx, 'bigPigeon', -16, 0, 0.4, PI / 2);
      putL(ctx, P.feedTree, -9.6, 2.35, 0.3, PI);
      const carriers = [[TOWN_IDS[4], -8.4, -0.5], [TOWN_IDS[5], -8.6, 1.1], [TOWN_IDS[6], -10.4, -0.6], [TOWN_IDS[7], -10.6, 1.2]];
      carriers.forEach(([id, x, z]) => placeL(ctx, id, x, 0, z, -PI / 2));
      const watchers = [[TOWN_IDS[8], -12.5, 6.6, -2.5], [TOWN_IDS[9], -11.4, 6.9, -2.4], [TOWN_IDS[10], -8.5, -6.4, -1.0]];
      watchers.forEach(([id, x, z, yaw]) => placeL(ctx, id, x, 0.12, z, yaw));
      ctx.store = { carriers, watchers };
    },
    update(ctx, lt) {
      const t = ctx.t, pg = ctx.cast.bigPigeon, W = TW(ctx), P = ctx.props;
      const coo = [ctx.time('b15.w7') + 0.05, ctx.time('b15.w11')];
      const hc = lastBefore(coo, t), dc = hc != null ? t - hc : 9;
      if (dc < 0.5) { pg.pose('huss', t, { hits: coo }); pg.face('huss', t); } else { pg.pose('peck', t * 0.7); pg.face('neutral', t); }
      const sx = 0.15 * Math.sin(t * 3);
      P.feedTree.position.set(-9.6 + sx, 2.35 + 0.05 * Math.sin(t * 6), 0.3);
      ctx.store.carriers.forEach(([id, x, z], i) => { const c = ctx.cast[id]; c.root.position.set(x + sx, 0, z); c.pose('cheer', t + i * 0.1, { intensity: 0.25 }); c.face('determined', t + i); });
      ctx.store.watchers.forEach(([id], i) => { const c = ctx.cast[id]; c.pose(i === 2 ? 'point' : 'surprised', t + i); c.face('shocked', 0.3); });
      const u = ease.outCubic(clamp(lt / 1.2, 0, 1));
      ctx.cam.move({ pos: W(-4.2, 0.45, 3.6), look: W(-9.5, 2.2, 0.4), fov: 50 }, { pos: W(-3.6, 0.4, 4.0), look: W(-12.5, 3.8, 0.2), fov: 60 }, u);
      ctx.cam.shake(dc < 0.4 ? 0.6 * (1 - dc / 0.4) : 0.06, t, 13);
      tag(ctx, 'SIZE OF A HOUSE', ctx.time('b15.w10'), Infinity, { y: 0.13, size: 76, bg: 'rgba(200,0,40,0.9)' });
    },
  },
  {
    name: 'slam one', start: 'b15.w13+0.12', set: 'f3',
    setup(ctx) {
      f3(ctx); const d = doorAt(ctx, 0), F = DL(d);
      const p = F(0.38, 0, 0.95); placeS(ctx, 'me', p.x, 0, p.z, d.rotation.y + PI);
      bellAt(ctx, 0.4, 2.1, 8.6, -PI / 2 - 0.6); tallyAt(ctx, V(0.4, 3.4, 8.6));
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, d = doorAt(ctx, 0), F = DL(d); f3Update(ctx);
      const ts = ctx.time('b15.w13') + 0.2, open = 1 - ease.inCubic(clamp((t - ts) / 0.12, 0, 1));
      d.userData.set({ t, open, portal: 1 });
      me.pose(t > ts ? 'surprised' : 'idle', Math.max(0, t - ts)); me.face('shocked', 0.3);
      ctx.props.bell.userData.set(t, { mood: 'smile' }); ctx.props.tally.userData.set(t, tallyState(ctx)); ctx.props.tally.rotation.y = -PI / 2 - 0.4;
      const cam = { pos: V(2.2, 2.2, 4.4), look: V(-1.0, 2.0, 7.6), fov: 52 };
      ctx.cam.set(cam); if (open > 0.02) renderPortal(ctx, d, cam, DOOR_VIEW.d1.q, DOOR_VIEW.d1.yaw);
      if (t > ts && t < ts + 0.25) ctx.cam.shake(0.5, t, 17);
      stamp(ctx, 'NOPE', ts + 0.02, { size: 200 });
      blobUnder(ctx, me);
    },
  },
  // ── b16 "Door two. Perfect again. Except everybody in town was me."
  {
    name: 'door two opens', start: 'b16-0.1', set: 'f3',
    setup(ctx) {
      f3(ctx); const d = doorAt(ctx, 1), F = DL(d);
      const p = F(0.95, 0, 0.6); placeS(ctx, 'me', p.x, 0, p.z, d.rotation.y + PI - 0.4);
      const town = offTown(ctx);
      CLONE_IDS.forEach((id, i) => { const c = i % 7, r = Math.floor(i / 7); placeL(ctx, id, -9.5 - r * 1.3, 0, (c - 3) * 1.15 + (r % 2) * 0.4, PI / 2); });
      ctx.add(ctx.props.spill, ctx.set.root);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, d = doorAt(ctx, 1), F = DL(d); f3Update(ctx);
      const t0 = ctx.time('b16') + 0.15, open = ease.inOutCubic(clamp((t - t0) / 0.55, 0, 1));
      d.userData.set({ t, open, portal: 1, flash: 0.5 * Math.max(0, 1 - Math.abs((t - t0 - 0.25) / 0.25)) });
      me.pose(t < t0 + 0.2 ? 'point' : 'idle', t); me.face(open > 0.6 ? 'smile' : 'neutral', 0.3);
      CLONE_IDS.forEach((id) => { const c = ctx.cast[id]; c.pose('dance', t); c.face('grin', 1.0); });
      const cam = { pos: F(-0.7, 1.6, 2.7), look: F(0.0, 1.35, 0), fov: 50 };
      ctx.cam.set(cam);
      renderPortal(ctx, d, cam, DOOR_VIEW.d2.q, DOOR_VIEW.d2.yaw);
      const sp = ctx.props.spill; sp.position.copy(F(0, 1.4, 0.8)); sp.intensity = 6 * open;
      blobUnder(ctx, me);
    },
  },
  {
    name: 'everybody is me', start: 'b16.w2-0.05', set: 'town',
    setup(ctx) {
      day(ctx);
      CLONE_IDS.forEach((id, i) => { const c = i % 7, r = Math.floor(i / 7); placeL(ctx, id, -9.5 - r * 1.3, 0, (c - 3) * 1.15 + (r % 2) * 0.4, PI / 2); });
    },
    update(ctx, lt) {
      const t = ctx.t, W = TW(ctx), ts = ctx.time('b16.w9') - 0.05;
      const cam0 = { pos: W(-2.6, 2.0, 0.6), look: W(-11, 1.2, 0), fov: 50 }, cam1 = { pos: W(-4.0, 1.75, 0.4), look: W(-10.2, 1.55, 0), fov: 40 };
      const stare = t > ts;
      const camNow = stare ? cam1 : cam0;
      if (!stare) ctx.cam.move(cam0, { pos: W(-3.6, 1.9, 0.5), look: W(-11, 1.3, 0), fov: 48 }, clamp(lt / 2.4, 0, 1)); else ctx.cam.set(cam1);
      CLONE_IDS.forEach((id) => { const c = ctx.cast[id]; if (stare) { c.pose('idle', 0.3, { lookAt: camNow.pos }); c.face('neutral', 0.5); } else { c.pose('dance', t); c.face('grin', 1.0); } });
      if (stare) { ctx.cam.shake(t - ts < 0.15 ? 0.3 : 0, t, 19); tag(ctx, 'EVERYBODY.', ts + 0.05, Infinity, { y: 0.14, size: 90, bg: 'rgba(29,29,34,0.92)' }); }
      else tag(ctx, 'PERFECT AGAIN', ctx.time('b16.w2') + 0.05, Infinity, { y: 0.14, size: 84, fill: '#7dffa0', bg: 'rgba(10,40,20,0.85)' });
    },
  },
  // ── slam two → b17 "One try left."
  {
    name: 'slam two', start: 'b16.end+0.05', set: 'f3',
    setup(ctx) {
      f3(ctx); const d = doorAt(ctx, 1), F = DL(d);
      const p = F(0.38, 0, 0.95); placeS(ctx, 'me', p.x, 0, p.z, d.rotation.y + PI);
      bellAt(ctx, -0.3, 2.15, 12.8, PI / 2 + 0.7); tallyAt(ctx, V(-0.3, 3.45, 12.8));
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, d = doorAt(ctx, 1); f3Update(ctx);
      const ts = ctx.time('b16.end') + 0.1, open = 1 - ease.inCubic(clamp((t - ts) / 0.12, 0, 1));
      d.userData.set({ t, open, portal: 1 });
      me.pose(t > ts ? 'surprised' : 'idle', Math.max(0, t - ts)); me.face(t > ctx.time('b17.w1') ? 'sweat' : 'shocked', 0.3);
      ctx.props.bell.userData.set(t, { mood: t > ctx.time('b17') ? 'sweat' : 'smile' }); ctx.props.tally.userData.set(t, tallyState(ctx)); ctx.props.tally.rotation.y = PI / 2 + 0.5;
      const u = ease.inOutSine(clamp((t - ctx.time('b17')) / 1.0, 0, 1));
      const cam = { pos: V(lerp(-1.8, -1.0, u), lerp(2.1, 2.9, u), lerp(9.4, 10.6, u)), look: V(lerp(1.2, -0.3, u), lerp(1.9, 3.3, u), lerp(11.6, 12.8, u)), fov: lerp(52, 44, u) };
      ctx.cam.set(cam); if (open > 0.02) renderPortal(ctx, d, cam, DOOR_VIEW.d2.q, DOOR_VIEW.d2.yaw);
      if (t > ts && t < ts + 0.25) ctx.cam.shake(0.5, t, 23);
      if (t < ctx.time('b17') - 0.05) stamp(ctx, 'NOPE', ts + 0.02, { size: 200, rot: 0.12 });
      else tag(ctx, '1 TRY LEFT', ctx.time('b17.w1'), Infinity, { y: 0.14, size: 96, fill: '#ffe14a', bg: 'rgba(120,0,40,0.88)' });
      blobUnder(ctx, me);
    },
  },
  // ── b17 "And the doors were starting to slam shut."
  {
    name: 'domino doors', start: 'b17.w3-0.05', set: 'f3',
    setup(ctx) { f3(ctx, { vanish: ctx.time('b17.w3') }); placeS(ctx, 'me', 0.0, 0, 9.3, 0.3); bellAt(ctx, 0.9, 2.1, 10.6, PI + 0.4); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, T0 = ctx.time('b17.w3'); f3Update(ctx);
      [0, 1].forEach((i) => {
        const d = doorAt(ctx, i), def = d.userData.def, dv = t - (T0 + 0.05 + 0.12 * i);
        const u = clamp((dv - 0.14) / 0.5, 0, 1);
        d.userData.set({ t, open: dv > 0 ? 0 : 0.35 });
        d.position.y = def.y - 2.5 * u * u; d.scale.setScalar(Math.max(1e-3, 1 - ease.inCubic(u)));
      });
      me.pose('surprised', 0.3 + 0.02 * Math.sin(t * 5), { headYaw: 0.6 * Math.sin(t * 1.5) }); me.face('shocked', 0.3);
      ctx.props.bell.userData.set(t, { mood: 'sweat', red: 0.7 + 0.3 * Math.sin(t * 14) });
      ctx.cam.move({ pos: V(-2.6, 3.6, 4.0), look: V(1.0, 1.0, 30), fov: 54 }, { pos: V(-2.2, 4.4, 3.0), look: V(1.0, 0.8, 34), fov: 56 }, clamp(lt / 1.4, 0, 1));
      ctx.cam.shake(0.12, t, 29);
      blobUnder(ctx, me);
    },
  },
  {
    name: 'bellhop red', start: 'b17.w9-0.05', set: 'f3',
    setup(ctx) { f3(ctx, { vanish: ctx.time('b17.w3') }); bellAt(ctx, 0.9, 2.1, 10.6, PI + 0.4); },
    update(ctx, lt) {
      const t = ctx.t, B = ctx.props.bell; f3Update(ctx);
      [0, 1].forEach((i) => { const d = doorAt(ctx, i); d.visible = false; });
      B.userData.set(t, { mood: 'sweat', red: 0.8 + 0.2 * Math.sin(t * 16) });
      const c = B.position.clone().add(up(0.1));
      ctx.cam.move({ pos: c.clone().add(V(-0.7, 0.15, -2.0)), look: c, fov: 38 }, { pos: c.clone().add(V(-0.5, 0.1, -1.5)), look: c, fov: 36 }, clamp(lt / 0.8, 0, 1));
      ctx.cam.shake(0.18, t, 31);
      ctx.fx.overlay('#ff0030', 0.12 + 0.1 * Math.sin(t * 16));
    },
  },
  // ── b18 "Every door left looked exactly like home. Same street. Same Grandma."
  {
    name: 'three doors left', start: 'b18-0.1', set: 'f3',
    setup(ctx) {
      f3(ctx, { gone: true }); placeS(ctx, 'me', -1.3, 0, 14.6, 0.3);
      const pv = portalPorch(ctx); grandmaPorch(ctx, pv.TL); ctx.store = { pv };
      ctx.add(ctx.props.spill, ctx.set.root);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, { pv } = ctx.store; f3Update(ctx);
      const g = ctx.cast.grandma; g.pose('wave', t); g.face('smile', t);
      me.pose('idle', t, { headYaw: 0.35 * Math.sin(t * 1.2) }); me.face('neutral', 0.3);
      const u = ease.inOutSine(clamp(lt / 2.2, 0, 1));
      const cam = { pos: V(lerp(0.7, 0.5, u), 2.6, lerp(8.6, 9.2, u)), look: V(0.0, 1.3, 18.6), fov: 60 };
      ctx.cam.set(cam);
      [2, 3, 4].forEach((i) => { const d = doorAt(ctx, i); d.userData.set({ t, open: 0.62, portal: 1, key: 0.8 }); renderPortal(ctx, d, cam, pv.q, pv.yaw); });
      const sp = ctx.props.spill; sp.position.set(0, 1.4, 17.3); sp.intensity = 5;
      blobUnder(ctx, me);
    },
  },
  {
    name: 'same grandma', start: 'b18.w7-0.05', set: 'f3',
    setup(ctx) { f3(ctx, { gone: true }); const pv = portalPorch(ctx); grandmaPorch(ctx, pv.TL); ctx.store = { pv }; },
    update(ctx, lt) {
      const t = ctx.t, { pv } = ctx.store; f3Update(ctx);
      const g = ctx.cast.grandma; g.pose('wave', t); g.face('smile', t);
      const u = ease.inOutSine(clamp(lt / 1.7, 0, 1));
      const xx = lerp(-2.5, 2.5, u); const cam = { pos: V(xx, 1.5, 14.6), look: V(xx * 1.02, 1.35, 18.6), fov: 48 };
      ctx.cam.set(cam);
      [2, 3, 4].forEach((i) => { const d = doorAt(ctx, i); d.userData.set({ t, open: 0.62, portal: 1, key: 0.8 }); renderPortal(ctx, d, cam, pv.q, pv.yaw); });
      tag(ctx, 'SAME GRANDMA ×3', ctx.time('b18.w9') + 0.05, Infinity, { y: 0.14, size: 74, bg: 'rgba(192,96,122,0.92)' });
    },
  },
  // ── b19 "But I knew one thing for sure. My Grandma always yells HUSS back."
  {
    name: 'thinking', start: 'b19-0.1', set: 'f3',
    setup(ctx) { f3(ctx, { gone: true }); placeS(ctx, 'me', 0.0, 0, 15.6, PI + 0.25); [2, 3, 4].forEach((i) => doorAt(ctx, i).userData.set({ open: 0 })); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me; f3Update(ctx);
      [2, 3, 4].forEach((i) => doorAt(ctx, i).userData.set({ t, open: 0, key: 0.8 }));
      me.pose('think', t); me.face(t > ctx.time('b19.w4') ? 'determined' : 'neutral', 0.3);
      const f = humanFace(me);
      ctx.cam.move({ pos: f.clone().add(V(0.8, 0.0, -2.4)), look: f.clone().add(up(-0.2)), fov: 40 }, { pos: f.clone().add(V(0.6, 0.0, -1.9)), look: f.clone().add(up(-0.15)), fov: 38 }, clamp(lt / 1.6, 0, 1));
      fill(ctx, { pos: f.clone().add(V(0.6, 0.4, -2.0)) }, 0.8, '#e8dcff');
    },
  },
  {
    name: 'memory bubble', start: 'b19.w7-0.05', set: 'f3',
    setup(ctx) {
      f3(ctx, { gone: true }); placeS(ctx, 'me', 0.0, 0, 15.6, PI + 0.25);
      const P = ctx.props, B = P.bubble; ctx.add(B, ctx.set.root);
      const TL = tower(ctx, 2); grandmaWindow(ctx, TL); ctx.store = { TL };
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, P = ctx.props, { TL } = ctx.store; f3Update(ctx);
      [2, 3, 4].forEach((i) => doorAt(ctx, i).userData.set({ t, open: 0, key: 0.8 }));
      me.pose('idle', t, { headPitch: -0.15 }); me.face(t > ctx.time('b19.w11') ? 'grin' : 'determined', 0.3);
      const th = ctx.time('b19.w11'), g = ctx.cast.grandma;
      grandmaWindowPose(g, t, t > th - 0.1 && t < th + 0.6 ? 1 : 0, 0);
      const f = humanFace(g);
      const tex = renderTownView(ctx, TL(0.4, 7.1, 2.8), f.clone().add(up(-0.15)), 40);
      const B = P.bubble; B.userData.disc.material.map = tex; B.userData.disc.material.needsUpdate = true;
      const head = humanFace(me);
      const pop = ease.outBack(clamp(lt / 0.35, 0, 1));
      B.position.copy(head).add(V(-0.75, 1.15, -0.1)); B.scale.setScalar(Math.max(0.01, pop) * 1.0);
      const cam = { pos: head.clone().add(V(-0.6, -0.55, -3.2)), look: head.clone().add(V(-0.35, 0.55, 0)), fov: 46 };
      B.lookAt(cam.pos);
      ctx.cam.set(cam);
      fill(ctx, cam, 0.8, '#fff1d0');
      if (t > th) ctx.fx.text('HUSS!', { x: 0.36, y: 0.26, size: 96, fill: '#ffe14a', stroke: '#000', line: 10, rot: -0.1, scale: ease.outBack(clamp((t - th) / 0.15, 0, 1)) });
    },
  },
  // ── b20 "So I didn't open a door. I shouted through every keyhole."
  {
    name: 'no door', start: 'b20-0.1', set: 'f3',
    setup(ctx) { f3(ctx, { gone: true }); placeS(ctx, 'me', 0.0, 0, 15.2, 0); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me; f3Update(ctx);
      [2, 3, 4].forEach((i) => doorAt(ctx, i).userData.set({ t, open: 0, key: 1.0 + 0.4 * Math.sin(t * 4 + i) }));
      me.pose('idle', t, { headYaw: 0.5 * Math.sin(t * 6) * (t < ctx.time('b20.w5') ? 1 : 0) }); me.face('smug', 0.3);
      ctx.cam.move({ pos: V(1.6, 1.9, 11.2), look: V(-0.2, 1.4, 17.5), fov: 48 }, { pos: V(1.2, 1.8, 12.0), look: V(-0.4, 1.4, 17.5), fov: 46 }, clamp(lt / 1.5, 0, 1));
      blobUnder(ctx, me);
      tag(ctx, 'NOT OPENING ONE', ctx.time('b20.w2'), Infinity, { y: 0.14, size: 70 });
    },
  },
  {
    name: 'kneel at keyhole', start: 'b20.w6-0.05', set: 'f3',
    setup(ctx) { f3(ctx, { gone: true }); const d = doorAt(ctx, 2), F = DL(d); const p = F(0.44, 0, 0.62); placeS(ctx, 'me', p.x, 0, p.z, d.rotation.y + PI); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, d = doorAt(ctx, 2), F = DL(d); f3Update(ctx);
      [2, 3, 4].forEach((i) => doorAt(ctx, i).userData.set({ t, open: 0, key: 1.2 }));
      me.pose('peer', t, { tableY: 1.32, tableZ: 0.5 }); me.face('determined', 0.3);
      ctx.cam.move({ pos: F(3.6, 1.8, 3.6), look: F(0.3, 1.2, 0.3), fov: 46 }, { pos: F(3.3, 1.75, 3.3), look: F(0.3, 1.22, 0.3), fov: 44 }, clamp(lt / 1.2, 0, 1));
      fill(ctx, { pos: F(1.6, 1.8, 1.8) }, 0.8, '#ffe6b8');
    },
  },
  // ── b21 HUSS ×3: one into each keyhole
  ...huss('b21', 3, (i) => ({
    set: 'f3',
    setup(ctx) { f3(ctx, { gone: true }); const d = doorAt(ctx, 2 + i), F = DL(d); const p = F(0.44, 0, 0.62); placeS(ctx, 'me', p.x, 0, p.z, d.rotation.y + PI); const P = ctx.props; ctx.add(P.puff, d.userData.leaf); P.puff.position.copy(d.userData.keyhole.position).add(V(0, 0, 0.02)); },
    update(ctx) {
      const t = ctx.t, me = ctx.cast.me, d = doorAt(ctx, 2 + i), F = DL(d), hits = ctx.hussTimes('b21').map((h) => h + 0.03), h = hits[i]; f3Update(ctx);
      const dh = t - h;
      [2, 3, 4].forEach((k) => doorAt(ctx, k).userData.set({ t, open: 0, key: k === 2 + i ? 1.2 + (dh > 0 ? 1.5 * Math.max(0, 1 - dh / 0.3) : 0) : 1.0 }));
      me.pose('peer', t, { tableY: 1.32, tableZ: 0.5 }); me.face(dh > -0.05 && dh < 0.3 ? 'huss' : 'determined', 0.3);
      ctx.props.puff.userData.set(clamp(dh / 0.6, 0, 1));
      const side = i % 2 ? -1 : 1;
      const whip = clamp((t - (h - 0.08)) / 0.08, 0, 1);
      const cam = { pos: F(side * 3.0 + 0.4, 1.8, 3.0), look: F(0.35, 1.2, 0.3), fov: 46 };
      ctx.cam.set(cam); ctx.cam.punch(hits, t, 0.12, 0.2);
      if (whip < 1) ctx.cam.shake(0.4 * (1 - whip), t, 37 + i);
      fill(ctx, { pos: F(side * 1.6, 1.8, 1.6) }, 0.8, '#ffe6b8');
    },
  })),
  // ── b22 "Nothing. Nothing. And then, from the very last door..."
  ...[0, 1, 2].map((i) => ({
    name: `listen ${i + 1}`, start: i === 0 ? 'b22-0.1' : i === 1 ? 'b22.w1-0.05' : 'b22.w2-0.05', set: 'f3',
    setup(ctx) { f3(ctx, { gone: true }); const d = doorAt(ctx, 2 + i), F = DL(d); const P = ctx.props; ctx.add(P.puff, d.userData.leaf); P.puff.position.copy(d.userData.keyhole.position).add(V(0, 0, 0.02)); if (i < 2) { const p = F(0.44, 0, 0.62); placeS(ctx, 'me', p.x, 0, p.z, d.rotation.y + PI); } },
    update(ctx, lt) {
      const t = ctx.t, d = doorAt(ctx, 2 + i), F = DL(d); f3Update(ctx);
      [2, 3, 4].forEach((k) => doorAt(ctx, k).userData.set({ t, open: 0, key: k === 2 + i ? 1.3 : 0.6 }));
      if (i < 2) {
        const me = ctx.cast.me; me.pose('peer', t, { tableY: 1.32, tableZ: 0.5, headYaw: 0.6 }); me.face('squint', 0.3);
        ctx.props.puff.userData.set(clamp(lt / 1.2, 0, 1) * 0.8);
        const kh = d.userData.keyhole.getWorldPosition(V());
        ctx.cam.move({ pos: F(-2.6, 1.75, 2.8), look: kh, fov: 46 }, { pos: F(-2.3, 1.7, 2.5), look: kh, fov: 44 }, clamp(lt / 0.8, 0, 1));
        tag(ctx, '...', ctx.time(i === 0 ? 'b22.w0' : 'b22.w1') + 0.1, Infinity, { y: 0.17, size: 110, bg: null, fill: '#d8c8ff' });
      } else {
        ctx.props.puff.userData.set(0);
        const kh = d.userData.keyhole.getWorldPosition(V());
        const u = ease.inOutSine(clamp(lt / 2.0, 0, 1));
        ctx.cam.move({ pos: F(0.4, 1.5, 3.6), look: kh, fov: 46 }, { pos: F(0.44, 1.36, 1.25), look: kh, fov: 30 }, u);
      }
      fill(ctx, { pos: F(0.3, 1.8, 2) }, 0.6, '#ffe6b8');
      ctx.fx.vignette(0.45);
    },
  })),
  // ── b23 HUSS ×3: Grandma HUSSes back through the last keyhole; it blazes gold
  ...huss('b23', 3, (i) => ({
    set: i === 1 ? 'f3' : 'town',
    setup(ctx) {
      if (i === 1) { f3(ctx, { gone: true }); const d = doorAt(ctx, 4), F = DL(d); const p = F(0.44, 0, 0.62); placeS(ctx, 'me', p.x, 0, p.z, d.rotation.y + PI); ctx.add(ctx.props.gold, ctx.set.root); return; }
      day(ctx); const TL = tower(ctx, 2); grandmaPorch(ctx, TL); ctx.store = { TL };
    },
    update(ctx) {
      const t = ctx.t, hits = ctx.hussTimes('b23').map((h) => h + 0.03), h = lastBefore(hits, t), dh = h != null ? t - h : 9;
      if (i === 1) {
        f3Update(ctx);
        const d = doorAt(ctx, 4), F = DL(d), me = ctx.cast.me;
        [2, 3, 4].forEach((k) => doorAt(ctx, k).userData.set({ t, open: 0, key: k === 4 ? 2 : 0.5, blaze: k === 4 ? 1 : 0 }));
        me.pose('surprised', 0.25); me.face('grin', 0.3);
        const g = ctx.props.gold; g.position.copy(d.userData.keyhole.getWorldPosition(V())).add(F(0, 0, 0.5).sub(F(0, 0, 0))); g.intensity = 10;
        const cam = { pos: F(1.6, 1.55, 2.0), look: F(0.3, 1.4, 0.4), fov: 44 };
        ctx.cam.set(cam); ctx.cam.punch(hits, t, 0.12, 0.2);
        ctx.fx.overlay('#ffcf4a', 0.18 * Math.max(0, 1 - dh / 0.25));
        return;
      }
      const { TL } = ctx.store, g = ctx.cast.grandma;
      g.pose('cheer', t); g.face('huss', 0.3);
      const f = humanFace(g);
      const cam = i === 0 ? { pos: TL(0.1, 1.8, 6.6), look: f.clone().add(up(-0.35)), fov: 40 } : { pos: TL(0.05, 1.95, 4.6), look: f.clone().add(up(-0.15)), fov: 38 };
      ctx.cam.set(cam); ctx.cam.punch(hits, t, 0.12, 0.2);
      keyhole(ctx, { k: i === 0 ? 1 : 1.25, gold: 0.6 + 0.4 * Math.max(0, 1 - dh / 0.25), cy: 0.36 });
      ctx.fx.text('HUSS!', { x: 0.5, y: 0.72, size: 120, fill: '#ffe14a', stroke: '#000', line: 12, rot: i ? 0.1 : -0.1, alpha: 0.85, scale: 0.7 });
    },
  })),
  // ── b24 "I dove through."
  {
    name: 'dive', start: 'b24-0.1', set: 'f3',
    setup(ctx) { f3(ctx, { gone: true }); placeS(ctx, 'me', 0.0, 0, 15.5, 0); ctx.add(ctx.props.gold, ctx.set.root); ctx.add(ctx.props.spill, ctx.set.root); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, d = doorAt(ctx, 4), F = DL(d); f3Update(ctx);
      const open = ease.outCubic(clamp(lt / 0.3, 0, 1));
      [2, 3, 4].forEach((k) => doorAt(ctx, k).userData.set({ t, open: k === 4 ? open : 0, key: k === 4 ? 2 : 0.4, blaze: k === 4 ? 1 : 0, portal: k === 4 ? 1 : 0, flash: k === 4 ? 1 : 0 }));
      const u = clamp(lt / 0.95, 0, 1);
      const start = V(0.5, 0, 15.6), goal = F(0, 0, -0.4);
      const p = start.clone().lerp(goal, ease.inQuad(u));
      me.root.position.set(p.x, 0.6 + 0.6 * Math.sin(PI * clamp(u * 1.4, 0, 1)), p.z);
      me.root.rotation.set(0, yawTo(start, goal), 0);
      me.root.rotateX(PI / 2 * clamp(u * 2, 0, 1));
      me.pose('cheer', t, { intensity: 0.3 }); me.face('determined', 0.3);
      const g = ctx.props.gold; g.position.copy(F(0, 1.3, 0.8)); g.intensity = 12;
      const sp = ctx.props.spill; sp.position.copy(F(0, 1.4, 1.2)); sp.intensity = 10;
      ctx.cam.set({ pos: V(5.6, 1.7, 13.2), look: V(1.3, 1.1, 17.0), fov: 58 });
      white(ctx, ctx.time('b24.w2'), ctx.time('b25') - 0.08, 1);
    },
  },
  // ── b25 "Floor two. Grandma took her groceries like nothing happened. Perfect."
  {
    name: 'floor two', start: 'b25-0.1', set: 'lift',
    setup(ctx) { lift(ctx, 'two', []); ctx.set.dial(2); const me = placeS(ctx, 'me', 0.1, 0, -0.2, 0); carryBags(ctx, me); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      const doors = ease.inOutCubic(clamp((lt - 0.15) / 0.6, 0, 1));
      carState(ctx, { doors, floor: '2', glow3: 0.4 });
      me.pose('idle', t); bagArms(me); me.face('sweat', 0.3);
      ctx.cam.move({ pos: V(0.35, 1.55, 4.6), look: V(0.0, 1.3, 0.5), fov: 42 }, { pos: V(0.3, 1.5, 4.0), look: V(0.0, 1.35, 0.5), fov: 42 }, clamp(lt / 1.0, 0, 1));
      fadeIn(ctx, ctx.time('b25') - 0.1, 0.4);
      tag(ctx, 'FLOOR 2', ctx.time('b25.w1'), Infinity, { y: 0.14, size: 96, fill: '#ffffff', bg: 'rgba(63,122,90,0.92)' });
    },
  },
  {
    name: 'grandma takes groceries', start: 'b25.w2-0.05', set: 'lift',
    setup(ctx) {
      lift(ctx, 'two', []); ctx.set.dial(2);
      placeS(ctx, 'me', 0.2, 0, 1.75, -0.35); placeS(ctx, 'grandma', -0.75, 0, 2.6, PI - 0.6 + 0.0);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, g = ctx.cast.grandma, P = ctx.props;
      carState(ctx, { doors: 1, floor: '2', glow3: 0.4 });
      const tTake = ctx.time('b25.w3') + 0.1, tPat = ctx.time('b25.w6'), tGo = ctx.time('b25.w8');
      const took = t > tTake;
      if (!took) { if (P.bagA.parent !== me.joints.handR) carryBags(ctx, me); me.pose('idle', t); bagArms(me); }
      else { ctx.add(P.bagA, g.joints.handR); ctx.add(P.bagB, g.joints.handL); P.bagA.position.set(0, -0.02, 0); P.bagB.position.set(0, -0.02, 0); me.pose('idle', t, { headPitch: t > tPat && t < tGo ? 0.25 : 0 }); }
      me.face(t > tPat ? 'grin' : 'smile', t);
      // grandma: reach → take → pat the head → wander off to 2B
      const go = clamp((t - tGo) / 1.4, 0, 1);
      if (go > 0) {
        g.root.position.set(lerp(-0.75, -2.6, go), 0, lerp(2.6, 1.9, go)); g.root.rotation.set(0, -PI / 2 - 0.3, 0);
        g.pose('walk', t, { speed: 0.7 }); bagArms(g);
      } else {
        g.root.position.set(-0.75, 0, 2.6); g.root.rotation.set(0, yawTo(V(-0.75, 0, 2.6), me.root.position), 0);
        g.pose('idle', t, { lookAt: humanFace(me) });
        if (!took) { g.joints.armR.rotation.x = -0.8; g.joints.armL.rotation.x = -0.8; }
        else { bagArms(g); }
        if (t > tPat) { g.joints.armR.rotation.x = -2.2; g.joints.foreArmR.rotation.x = -0.6 - 0.3 * Math.max(0, Math.sin((t - tPat) * 14)); g.joints.armR.rotation.z = 0.3; }
      }
      g.face('smile', t);
      ctx.cam.move({ pos: V(2.6, 1.55, 5.0), look: V(-0.4, 1.25, 2.1), fov: 42 }, { pos: V(2.3, 1.5, 4.6), look: V(-0.6, 1.25, 2.0), fov: 42 }, clamp(lt / 2.5, 0, 1));
    },
  },
  {
    name: 'perfect relief', start: 'b25.w9-0.05', set: 'lift',
    setup(ctx) { lift(ctx, 'two', []); ctx.set.dial(2); placeS(ctx, 'me', 0.2, 0, 1.75, -0.35); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      carState(ctx, { doors: 1, floor: '2', glow3: 0.4 });
      me.pose('shrug', t); me.face('grin', 0.3);
      const f = humanFace(me);
      ctx.cam.move({ pos: f.clone().add(V(0.3, -0.1, 2.3)), look: f.clone().add(up(-0.2)), fov: 38 }, { pos: f.clone().add(V(0.25, -0.05, 1.9)), look: f.clone().add(up(-0.15)), fov: 38 }, clamp(lt / 0.8, 0, 1));
      tag(ctx, 'PERFECT', ctx.time('b25.w9') + 0.02, Infinity, { y: 0.15, size: 100, fill: '#7dffa0', bg: 'rgba(10,40,20,0.85)' });
    },
  },
  // ── b26 "I yelled HUSS one more time. She yelled it back. One second too late."
  {
    name: 'one more huss', start: 'b26-0.1', set: 'lift',
    setup(ctx) { lift(ctx, 'two', []); ctx.set.dial(2); placeS(ctx, 'me', 0.3, 0, 2.2, -PI / 2 + 0.2); placeS(ctx, 'grandma', -2.4, 0, 1.95, -PI / 2 - 0.2); const g = ctx.cast.grandma, P = ctx.props; ctx.add(P.bagA, g.joints.handR); ctx.add(P.bagB, g.joints.handL); P.bagA.position.set(0, -0.02, 0); P.bagB.position.set(0, -0.02, 0); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, g = ctx.cast.grandma, th = ctx.time('b26.w2');
      carState(ctx, { doors: 1, floor: '2', glow3: 0.4 });
      const sh = t > th - 0.05 && t < th + 0.5;
      me.pose('idle', t); me.face(sh ? 'huss' : 'smile', t); if (sh) me.joints.torso.rotation.x -= 0.1;
      g.root.position.set(-2.4 - 0.25 * clamp(lt / 1.2, 0, 1), 0, 1.95); g.pose(lt < 1.2 ? 'walk' : 'idle', t, { speed: 0.6 }); bagArms(g); g.face('smile', t);
      ctx.cam.move({ pos: V(2.6, 1.7, 4.6), look: V(-1.1, 1.3, 2.0), fov: 48 }, { pos: V(2.4, 1.65, 4.3), look: V(-1.3, 1.3, 2.0), fov: 46 }, clamp(lt / 1.6, 0, 1));
      if (t > th) ctx.fx.text('HUSS!', { x: 0.62, y: 0.27, size: 120, fill: '#ffe14a', stroke: '#000', line: 12, rot: -0.1, scale: ease.outBack(clamp((t - th) / 0.15, 0, 1)), alpha: clamp(1 - (t - th - 0.6) / 0.2, 0, 1) });
    },
  },
  {
    name: 'too late', start: 'b26.w6-0.05', set: 'lift',
    setup(ctx) { lift(ctx, 'two', []); ctx.set.dial(2); placeS(ctx, 'grandma', -2.65, 0, 1.95, -PI / 2 - 0.2); const g = ctx.cast.grandma, P = ctx.props; ctx.add(P.bagA, g.joints.handR); ctx.add(P.bagB, g.joints.handL); P.bagA.position.set(0, -0.02, 0); P.bagB.position.set(0, -0.02, 0); ctx.store = {}; },
    update(ctx, lt) {
      const t = ctx.t, g = ctx.cast.grandma;
      carState(ctx, { doors: 1, floor: '2', glow3: 0.4 });
      const tTurn = ctx.time('b26.w6') + 0.1, tH = ctx.time('b26.w9') - 0.05;
      const turn = ease.inOutSine(clamp((t - tTurn) / 0.9, 0, 1));
      g.root.rotation.set(0, -PI / 2 - 0.2 + (PI + 0.5) * turn, 0);
      g.pose('idle', t, { intensity: 0.1 }); bagArms(g);
      const sh = t > tH && t < tH + 0.35;
      g.face(sh ? 'huss' : 'smile', 0.4);
      if (t > tH + 0.35) creepySmile(g);
      const f = humanFace(g);
      ctx.cam.move({ pos: V(-0.2, 1.55, 5.2), look: f.clone().add(up(-0.25)), fov: 36 }, { pos: V(-0.6, 1.5, 4.5), look: f.clone().add(up(-0.15)), fov: 34 }, clamp(lt / 1.1, 0, 1), ease.inOutSine);
      if (t > tH && t < tH + 0.5) ctx.fx.text('...huss.', { x: 0.5, y: 0.25, size: 90, fill: '#ffe14a', stroke: '#000', line: 10, rot: 0.05, alpha: 0.9 });
      ctx.fx.vignette(0.35);
    },
  },
  {
    name: 'freeze', start: 'b26.w10-0.05', set: 'lift',
    setup(ctx) { lift(ctx, 'two', []); ctx.set.dial(2); placeS(ctx, 'me', 0.3, 0, 2.2, -PI / 2 + 0.2); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      carState(ctx, { doors: 1, floor: '2', glow3: 0.4 });
      me.pose('stunned', t); me.face('sweat', 0.3);
      const f = humanFace(me);
      ctx.cam.move({ pos: f.clone().add(V(-1.8, -0.05, 0.9)), look: f, fov: 36 }, { pos: f.clone().add(V(-1.15, 0, 0.55)), look: f, fov: 32 }, clamp(lt / 1.2, 0, 1), ease.inOutSine);
      const tl = ctx.markers.late;
      if (t > tl - 0.05 && t < tl + 0.5) glitch(ctx, 0.8 * (1 - (t - tl) / 0.5), 5);
      tag(ctx, '1 SECOND LATE', ctx.time('b26.w11'), Infinity, { y: 0.15, size: 80, bg: 'rgba(120,0,40,0.9)' });
    },
  },
  // ── b27 "Except one thing. The clock tower has three floors now."
  {
    name: 'three floors now', start: 'b27-0.1', set: 'town',
    setup(ctx) { day(ctx); const TL = tower(ctx, 3); ctx.store = { TL, life: parkLife(ctx) }; },
    update(ctx, lt) {
      const { TL, life } = ctx.store, t = ctx.t; parkLifeAnim(ctx, life);
      const u = ease.inOutSine(clamp((t - ctx.time('b27')) / 2.4, 0, 1));
      const cam = { pos: TL(-2.0, 0.9, 12.0), look: TL(0, lerp(2.5, 11.0, u), 0), fov: 50 };
      ctx.cam.set(cam);
      if (t < ctx.time('b27') + 0.25) ctx.cam.shake(0.3, t, 41);
      label(ctx, cam, TL(-1.75, 4.0, 1.9), '1', ctx.time('b27.w4'), { size: 80 });
      label(ctx, cam, TL(-1.75, 7.2, 1.9), '2', ctx.time('b27.w5'), { size: 80 });
      label(ctx, cam, TL(-1.75, 10.4, 1.9), '3?!', ctx.time('b27.w7'), { size: 96, fill: '#d98cff' });
      fadeIn(ctx, ctx.time('b27') - 0.1, 0.2, '#000000');
    },
  },
  // ── b28 "And the elevator has a button for four."
  {
    name: 'button four', start: 'b28-0.1', set: 'lift',
    setup(ctx) { const car = lift(ctx, 'ground', ['back']); ctx.store = { car, p: pigeonOnPanel(ctx, car) }; },
    update(ctx, lt) {
      const { car, p } = ctx.store, t = ctx.t;
      const t4 = ctx.time('b28.w7');
      carState(ctx, { glow3: 0.9, glow4: t > ctx.time('b28.w5') ? 0.8 + 0.5 * Math.sin(t * 4) : 0.6, show4: true, floor: '2', light: 0.8 });
      const turn = ease.inOutSine(clamp((t - ctx.time('b28.w5')) / 0.8, 0, 1));
      p.pose('idle', t, { headPitch: 0.35 * (1 - turn), headYaw: 1.3 * (1 - turn) }); p.face(turn > 0.6 ? 'smug' : 'squint', 0.5);
      const b4 = panelPoint(car, 4);
      ctx.cam.move({ pos: b4.clone().add(V(0.35, 0.05, -1.5)), look: b4.clone().add(up(0.05)), fov: 44 }, { pos: b4.clone().add(V(0.25, 0.1, -1.15)), look: b4.clone().add(up(0.2)), fov: 42 }, clamp(lt / 1.6, 0, 1), ease.inOutSine);
      const end = ctx.time('b28.end') + 0.45;
      if (t > t4 && t < end) ctx.fx.text('4', { x: 0.5, y: 0.15, size: 200, fill: '#d98cff', stroke: '#000', line: 14, scale: ease.outBack(clamp((t - t4) / 0.2, 0, 1)) });
      if (t > end) ctx.fx.overlay('#000000', 1);
    },
  },
];

/** too-wide smile: paint over the face with a custom texture */
let _creepy = null;
function creepySmile(g) {
  if (!_creepy) {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    x.clearRect(0, 0, 512, 512); x.lineCap = 'round';
    x.fillStyle = '#1b1b1b'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(256 + s * 92, 200, 34, 40, 0, 0, PI * 2); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(256 + s * 92 - 6, 204, 9, 0, PI * 2); x.fill(); x.fillStyle = '#1b1b1b'; }
    x.fillStyle = '#ffffff'; x.strokeStyle = '#1b1b1b'; x.lineWidth = 16;
    x.beginPath(); x.moveTo(40, 300); x.quadraticCurveTo(256, 470, 472, 300); x.quadraticCurveTo(256, 380, 40, 300); x.closePath(); x.fill(); x.stroke();
    for (let i = 1; i < 12; i++) { const px = 40 + i * 432 / 12; x.lineWidth = 6; x.beginPath(); x.moveTo(px, 300 + 60 * Math.sin(PI * i / 12) * 0.9); x.lineTo(px, 300 + 120 * Math.sin(PI * i / 12) * 0.95); x.stroke(); }
    _creepy = new THREE.CanvasTexture(c); _creepy.colorSpace = THREE.SRGBColorSpace;
  }
  const f = g.joints.head.getObjectByName('face'); if (f) f.material.map = _creepy;
}
