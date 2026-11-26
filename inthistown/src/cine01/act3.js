/*
 * act3.js — "The mirror pool and the swap" (b16–b19, 56.83–71.15 s): the still pool, the late reflection, the smile,
 * the white-out.
 *
 *   56.83  b16   crane down inside the sea cave: the kid and his torch against the grey mouth; by "Still as a mirror"
 *                the lens is at water level and he stands on his own perfect double. Drip rings at the far edge only.
 *   60.67  b17   locked symmetrical split-level: he raises his right hand (white rag), the reflection half a second
 *                late; he snatches it back on "half a second late" and the one in the water still has its hand up.
 *   64.47  b18a  his own eye-line, straight down into the water: the face looking back up smiles (upright, so the
 *                smile reads, and it is the smile of beat 25). A last ring slides through first: this is water.
 *   66.19  b18b  the locked split-level again, tighter: his frozen face on top, the grin underneath; the torch dips to
 *                60 % and comes back; the reflection's head tips, alone.
 *   68.03  b19   from behind him toward the mouth: he is on his feet facing the storm, the phone dropped at the edge;
 *                in the water the reflection still KNEELS, lit, smiling. Strike in the sea outside (69.20): 8 frames
 *                up, 6 held at 90 % white, 10 down to black. In the decay the figure is the double (statue, rag on the
 *                other hand), the kneeling reflection is gone, and one ring spreads from the middle of the pool.
 *
 * Rules kept: every per-frame state is recomputed in update() from time alone; per-shot objects through ctx.add; no
 * Math.random. The pool's shader look (mirror strength, scripted drip rings) is changed only for the duration of the
 * pool's own draw call (see init), so nothing can leak into another shot.
 */
import * as THREE from 'three';
import * as K from './kit.js';

const PI = Math.PI;
const { clamp, lerp, smooth } = K;
const A = (ctx, n) => ctx.set.anchors[n];
const sstep = (a, b, x) => smooth(clamp((x - a) / (b - a), 0, 1));
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ───────────────────────────────────────────── pool look (per draw call) ─────────────────────────────────────────────
// poolFx(ctx, { minF, reflect, drips: [[x, z, t0]…] }) in update(): for THIS frame the pool is drawn with a stronger
// mirror (minF = minimum Fresnel, so a steep look into the water still mirrors) and/or with up to 3 scripted ring
// sources (world x, z, birth time) instead of the set's periodic drips. The uniforms are swapped in the mesh's
// onBeforeRender and put back in onAfterRender, and only when the request carries this frame's time.
const FX = { t: NaN, o: null };
let _hooked = null;
export function init(ctx) {
  const set = ctx.getSet ? ctx.getSet('cave') : null;
  if (!set || !set.pool || _hooked === set.pool) return;
  _hooked = set.pool;
  const mesh = set.pool.mesh, U = set.pool.uniforms;
  const b0 = mesh.onBeforeRender, a0 = mesh.onAfterRender;
  const keep = { on: false, minF: 0, reflect: 1, drips: U.uDrip.value.map((v) => v.clone()) };
  mesh.onBeforeRender = function (...a) {
    const o = FX.o;
    if (o && FX.t === ctx.t && !keep.on) {
      keep.on = true; keep.minF = U.uMinF.value; keep.reflect = U.uReflect.value;
      U.uDrip.value.forEach((v, i) => keep.drips[i].copy(v));
      if (o.minF != null) U.uMinF.value = o.minF;
      if (o.reflect != null) U.uReflect.value = o.reflect;
      if (o.drips) {
        const P = 1000;
        U.uDrip.value.forEach((v, i) => {
          const d = o.drips[i];
          if (!d) { v.set(999, 999, 4, 0); return; }
          const w = 1 - ((d[2] / P) % 1);
          v.set(d[0], d[1], P, w === 1 ? 0 : w);
        });
      }
    }
    return b0.apply(this, a);
  };
  mesh.onAfterRender = function (...a) {
    if (keep.on) {
      keep.on = false; U.uMinF.value = keep.minF; U.uReflect.value = keep.reflect;
      U.uDrip.value.forEach((v, i) => v.copy(keep.drips[i]));
    }
    return a0.apply(this, a);
  };
}
function poolFx(ctx, o) { FX.t = ctx.t; FX.o = o; }

// ───────────────────────────────────────────── small helpers ─────────────────────────────────────────────────────────
/** a per-shot light kept in ctx.store (created once per shot entry, removed by the engine at the cut) */
function lamp(ctx, key, color, dist = 6, decay = 2, parent) {
  return ctx.store[key] || (ctx.store[key] = ctx.add(new THREE.PointLight(color, 0, dist, decay), parent));
}
/**
 * the crests of a drip ring catching the light on black water: `n` thin concentric rings spreading from (x, z), born at
 * t0. Purely a glint (additive), so the mirror underneath stays unbroken. o: { speed m/s, life s, gain, n, gap s, color }
 */
function ringGlint(ctx, key, x, z, t0, o = {}) {
  const n = o.n ?? 3, speed = o.speed ?? 0.5, life = o.life ?? 3, gap = o.gap ?? 0.24;
  let g = ctx.store[key];
  if (!g) {
    g = ctx.store[key] = ctx.add(new THREE.Group());
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.975, 1, 96, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide }));
      m.rotation.x = -PI / 2; m.renderOrder = 9; g.add(m);
    }
  }
  g.position.set(x, ctx.set.waterY + 0.004, z);
  const c = o.color || [0.5, 0.57, 0.66];
  g.children.forEach((m, i) => {
    const age = ctx.t - t0 - i * gap, r = 0.03 + speed * age;
    m.visible = age > 0 && age < life;
    if (!m.visible) return;
    m.scale.setScalar(r);
    const a = (o.gain ?? 1) * (1 - i * 0.22) * clamp(age / 0.08, 0, 1) * Math.pow(1 - age / life, 1.6) / (1 + r * 1.2);
    m.material.color.setRGB(c[0] * a, c[1] * a, c[2] * a);
  });
  return g;
}
/**
 * The torch beam in the mist. The kit's cone mesh opens toward the SCREEN side of the phone (+Z), away from the LED and
 * its spot light, so these shots switch it off (uI = 0; setMode/setLevel restore it) and hang a per-shot copy, turned
 * round, on the phone instead.
 */
function torchBeam(ctx, I) {
  const ph = ctx.props.phone;
  ph.beam.material.uniforms.uI.value = 0;
  let b = ctx.store.beam;
  if (!b) {
    b = ctx.store.beam = ctx.add(new THREE.Mesh(ph.beam.geometry, ph.beam.material.clone()), ph.root);
    b.position.copy(ph.beam.position); b.rotation.y = PI; b.renderOrder = 25;
  }
  b.material.uniforms.uI.value = I;
  return b;
}
const _a = V(), _b = V(), _c = V(), _zero = new THREE.Matrix4().makeScale(0, 0, 0);
/** the phone in a hand, its LED (local −Z) aimed at a world point; lives in the scene so it stays lit in the reflection pass */
function aimTorch(ctx, ch, side, target, lift = 0.03) {
  const obj = ctx.props.phone.root;
  if (obj.parent !== ctx.scene) ctx.add(obj);
  ch.root.updateWorldMatrix(true, true);
  ch.joints['hand' + side].getWorldPosition(_a);
  obj.position.copy(_a); obj.position.y += lift;
  obj.scale.setScalar(1); obj.up.set(0, 1, 0);
  obj.lookAt(_b.copy(obj.position).multiplyScalar(2).sub(target));
}
/**
 * the torch low in the LEFT hand, LED up and a little outward: its spill lights the kneeling kid (and whoever plays his
 * reflection) from below, the beam stands beside him as a shaft in the mist and finds the ceiling
 */
function torchLow(ctx, holder, others = [], dir = [-0.95, 1, -0.15]) {
  for (const c of [holder, ...others]) { K.joint(c, 'armL', -0.75, 0, 0.12); K.joint(c, 'foreArmL', -0.5, 0, 0); }
  holder.root.updateWorldMatrix(true, true);
  holder.joints.handL.getWorldPosition(_c);
  aimTorch(ctx, holder, 'L', _c.set(_c.x + dir[0] * 3, _c.y + dir[1] * 3, _c.z + dir[2] * 3), 0.05);
  torchBeam(ctx, 0.08);
}
/** the reflection's face: the same expression track, `lag` seconds late — blinks included */
function faceLate(copy, me, expr, t, lag = 0.5) { copy.face(expr, t - lag + (me.blinkPhase || 0) - (copy.blinkPhase || 0)); }
const _h = V();
/** a small kicker on a hand so the white rag reads (works in the reflection pass too: it lives in the scene) */
function ragKick(ctx, ch, I, key = 'rag') {
  ch.root.updateWorldMatrix(true, true);
  ch.joints.handR.getWorldPosition(_h);
  const l = lamp(ctx, key, '#e4ecff', 1.5, 2); l.position.set(_h.x - 0.1, _h.y - 0.28, _h.z - 0.5); l.intensity = I;
}
/** far storm outside the mouth: a soft, slow cloud flicker (never a flash) */
function farStorm(ctx, amt = 0.1, seed = 5) {
  return K.applyFlash(ctx, amt * K.flicker(ctx.t, seed, 1.3), { bolt: null, light: 0.5 });
}

// kneel at the edge, shared by b17 / b18 (the reflection is posed with the same functions, half a second late)
const KNEEL = { sit: 0.8, lean: 0.18, headPitch: 0.16 };
const AFRAID = 'shocked';
/** b17: right hand up on "I raise my hand", snatched back on "half a second late" */
// The hand itself is the tell, so its lag is stretched (`late` = true for the one in the water): he snaps his hand up in a
// third of a second and HOLDS it for 0.6 s before the reflection even starts; he snatches it back and the reflection's stays up.
const HAND_LAG = 0.95, DROP_LAG = 0.85;
function hand17(ctx, t, late = false) {
  const T = (n) => ctx.time(n), r = T('raise17') + (late ? HAND_LAG : 0), d = T('lag17') + (late ? DROP_LAG : 0);
  return sstep(r + 0.08, r + 0.42, t) * (1 - sstep(d + 0.05, d + 0.32, t));
}
/** b17: he realises on "My reflection…" */
function face17(ctx, t) { return t < ctx.time('b17.w4') + 0.5 ? 'sad' : AFRAID; }
/** b17 → b18a: he leans out over the water to look */
function lean17(ctx, t) { return sstep(ctx.time('b18') - 1.0, ctx.time('b18') - 0.5, t); }
function pose17(ctx, ch, t, hand = hand17(ctx, t)) {
  const l = lean17(ctx, t);
  K.filmPose(ch, 'kneel', t, { sit: lerp(KNEEL.sit, 0.6, l), lean: lerp(KNEEL.lean, 0.42, l), headPitch: lerp(KNEEL.headPitch, 0.4, l), raiseR: hand });
}
const B18A = 'b18-0.5';        // cut to his eye-line half a second before "Then he smiles"
const B18B = 'b18.w3-0.1';     // "I'm not smiling."

export const shots = [
  // ── b16 ─ "Inside, a pool the rain can't reach. Still as a mirror." ────────────────────────────────────────────────
  {
    // (the picture starts 0.3 s into the beat: the third flash of beat 15 holds 20 frames outside; "Inside" lands on the cut)
    name: 'b16 the pool (crane down)', start: 'b16+0.3', set: 'cave', cast: ['me'],
    setup(ctx) {
      ctx.place('me', 'stand', { yaw: PI });
      ctx.props.phone.setMode('torch').setSpill(0.6).setLevel(0.85);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, H = ctx.set.heightAt;
      const dur = ctx.time('b17') - ctx.time('b16+0.3'), u = smooth(lt / dur);
      const sw = sstep(0.1, 2.7, lt);                           // the beam sweeps across the water and settles on it
      K.filmPose(me, 'stand', t, { breathe: 1, headPitch: 0.26, headYaw: lerp(0.5, 0.02, sw), armL: [-0.95, 0, 0.12], foreL: -0.65 });
      me.face('sad', t);
      aimTorch(ctx, me, 'L', V(lerp(-3.4, 0.2, sw), ctx.set.waterY, lerp(-0.2, -2.2, sw)));
      torchBeam(ctx, 0.2);
      ctx.set.pool.substitute([], []);
      ctx.props.real.me.update(t);
      farStorm(ctx, 0.12, 5);
      // drip rings at the far rock edge only, on the two drips of the sound mix; the centre stays glass
      const d1 = ctx.time('b16.w3') + 0.3, d2 = ctx.time('b17') - 0.27;
      poolFx(ctx, { reflect: 2.0, minF: lerp(0.32, 0.05, u), drips: [[-0.25, -3.75, d1], [0.55, -4.5, d2], [1.9, -4.2, ctx.time('b16') - 1.0]] });
      ringGlint(ctx, 'ring1', -0.25, -3.75, d1, { gain: 0.6, speed: 0.4, life: 2.4 }); ringGlint(ctx, 'ring2', 0.55, -4.5, d2, { gain: 0.6, speed: 0.4, life: 2.4 });
      const y1 = Math.max(H(-0.25, -6.1), ctx.set.waterY) + 0.34;
      ctx.cam.set({ pos: [lerp(-0.75, -0.25, u), lerp(1.85, y1, u), lerp(-7.5, -6.1, u)], look: [0.3, lerp(0.45, 0.72, u), 2.2], fov: 46 });
      ctx.cam.shake(0.015, t, 31);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: K.dist(ctx, A(ctx, 'stand')) - 1.2, aperture: 0.2, maxBlur: 8 } })),
  },

  // ── b17 ─ "I raise my hand. My reflection is half a second late." ──────────────────────────────────────────────────
  {
    name: 'b17 split-level: the late reflection', start: 'b17', set: 'cave', cast: ['me', 'copy'], captionY: 0.513,   // words on the black waterline band, not on the reflected hand
    setup(ctx) {
      ctx.place('me', 'kneel', { yaw: PI }); ctx.place('copy', 'kneel', { yaw: PI });
      K.setMirror(ctx.cast.copy, false);                 // an honest reflection, not the swapped double (yet)
      ctx.props.phone.setMode('torch').setSpill(1.6).setLevel(0.8);
      ctx.cam.set(K.poolSplit(ctx.set, { fov: 44 }));
    },
    update(ctx) {
      const t = ctx.t, me = ctx.cast.me, copy = ctx.cast.copy, L = 0.5;
      const hA = hand17(ctx, t), hB = hand17(ctx, t, true);
      pose17(ctx, me, t, hA); me.face(face17(ctx, t), t);
      pose17(ctx, copy, t - L, hB); faceLate(copy, me, face17(ctx, t - L), t, L);
      torchLow(ctx, me, [copy]);
      ragKick(ctx, me, 1.7 * hA, 'ragA'); ragKick(ctx, copy, 1.5 * hB, 'ragB');   // each kick follows its own hand: only the raised one is lit
      ctx.set.pool.substitute([me], [copy]);            // the lens sees him; the water shows the other one
      ctx.props.real.me.update(t);
      farStorm(ctx, 0.08, 7);
      poolFx(ctx, { reflect: 1.7, drips: [[1.4, -4.4, ctx.time('b17') - 0.27], [-1.5, -4.2, ctx.time('b17') + 1.6], [0.9, -4.5, ctx.time('b17') + 3.84]] });
    },
    post: K.shotPost({}),
  },

  // ── b18a ─ "Then he smiles." ───────────────────────────────────────────────────────────────────────────────────────
  {
    name: 'b18a his eye-line: the reflection smiles', start: B18A, set: 'cave', cast: ['me', 'copy'], options: { ripple: 5 }, captionY: 0.8,
    setup(ctx) {
      ctx.place('me', 'kneel', { yaw: PI }); ctx.place('copy', 'kneel', { yaw: PI });
      K.setMirror(ctx.cast.copy, false);
      ctx.props.phone.setMode('torch').setSpill(1.0).setLevel(0.8);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, copy = ctx.cast.copy;
      // leaning out over the water on his rag hand (it shows, white, at the edge of the reflection)
      const P = { sit: 0.5, lean: 0.55, headPitch: 0.5, handsDown: 0.85 };
      K.filmPose(me, 'kneel', t, P); K.filmPose(copy, 'kneel', t - 0.5, P);
      const s = t - ctx.time('smile18');
      me.face(AFRAID, 0.4); copy.face(s < 0.1 ? AFRAID : 'neutral', 0.4);
      if (s >= 0.2) K.filmFace(copy, s < 0.42 ? 'creep1' : 'creep');      // closed, too wide: the smile of beat 25
      torchLow(ctx, me, [copy]);
      ragKick(ctx, copy, 0.9, 'ragB');
      ctx.set.pool.substitute([me], [copy]);
      ctx.props.real.me.update(t);
      { const d = ctx.props.real.me.drips; if (d) { for (let i = 0; i < d.count; i++) d.setMatrixAt(i, _zero); d.instanceMatrix.needsUpdate = true; } }   // (a drip off his chin is a white egg in this POV)
      // THIS IS WATER: a dark tinted film (the mirror at 60 %), a ring that slides through the face on the cut and a
      // second, fainter one under the smile; the wet rock lip he kneels on along the bottom of the frame
      const e = K.eyePoint(me), t0 = ctx.time(B18A);
      const r1 = [e.x + 0.42, e.z - 0.62, t0 - 0.95], r2 = [e.x - 0.55, e.z - 0.75, t0 + 0.2];
      poolFx(ctx, { minF: 0.95, reflect: 0.5, drips: [r1, r2] });
      ringGlint(ctx, 'ringA', r1[0], r1[1], r1[2], { gain: 1.4, speed: 0.5, life: 2.3, n: 3, gap: 0.2 });
      ringGlint(ctx, 'ringB', r2[0], r2[1], r2[2], { gain: 0.9, speed: 0.5, life: 2.4, n: 2, gap: 0.22 });
      const k = A(ctx, 'kneel');
      const lip = lamp(ctx, 'lip', '#b9cde6', 1.6, 2); lip.position.set(k.x + 0.25, k.y + 0.32, k.z - 0.42); lip.intensity = 0.55;
      // from his own eyes, straight down: the face in the water (camera rolled so that "up" is away from him)
      const b = 0.27;
      const push = smooth(lt / 1.75);
      ctx.cam.set({ pos: [e.x, e.y - 0.02, e.z - 0.06], look: [e.x, e.y - 1.02, e.z - 0.06 + Math.tan(b)], fov: lerp(60, 55, push), roll: PI });
      ctx.cam.shake(0.012, t, 41);
    },
    post: K.shotPost({}),
  },

  // ── b18b ─ "I'm not smiling." ──────────────────────────────────────────────────────────────────────────────────────
  {
    name: 'b18b split-level, tighter: two faces, one grin', start: B18B, set: 'cave', cast: ['me', 'copy'], captionY: 0.513,
    setup(ctx) {
      ctx.place('me', 'kneel', { yaw: PI }); ctx.place('copy', 'kneel', { yaw: PI });
      K.setMirror(ctx.cast.copy, false);
      ctx.props.phone.setMode('torch').setSpill(1.6).setLevel(0.8);
      ctx.cam.set(K.poolSplit(ctx.set, { fov: 37 }));
    },
    update(ctx) {
      const t = ctx.t, me = ctx.cast.me, copy = ctx.cast.copy;
      K.filmPose(me, 'kneel', 0, { ...KNEEL, lean: 0.08 }); me.face(AFRAID, 0.4);          // frozen
      K.filmPose(copy, 'kneel', t - 0.5, { ...KNEEL, lean: 0.08 }); copy.face('neutral', 0.4); K.filmFace(copy, 'creep');
      // …and its head tips, alone: far over, until the smile in the water is nearly the right way up
      const tilt = 0.55 + 0.45 * sstep(ctx.time(B18B) + 0.25, ctx.time('b19') - 0.2, t);
      K.joint(copy, 'head', KNEEL.headPitch - 0.1 * tilt, 0, 1.05 * tilt);
      torchLow(ctx, me, [copy]);
      // the torch dips once to 60 % and comes back (a dip, not a flash)
      const d = (t - (ctx.time('b18.w5') + 0.1)) / 0.3;
      const dip = 1 - 0.4 * Math.exp(-d * d);
      ctx.props.phone.setLevel(0.8 * dip); torchBeam(ctx, 0.08 * dip);
      ctx.set.pool.substitute([me], [copy]);
      ctx.props.real.me.update(t);
      poolFx(ctx, { reflect: 2.4 });
    },
    post: K.shotPost({}),
  },

  // ── b19 ─ "Then the lightning hits the water." ─────────────────────────────────────────────────────────────────────
  {
    name: 'b19 the strike: white-out', start: 'b19', set: 'cave', cast: ['me', 'copy'],
    setup(ctx) { ctx.props.phone.setMode('torch').setSpill(1.2).setLevel(0.8); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, copy = ctx.cast.copy, ph = ctx.props.phone, H = ctx.set.heightAt;
      const ts = ctx.time('strike19'), dt = t - ts, F = 1 / 30;
      // white-out: 8 frames up, 6 frames held, 10 frames down
      const up = clamp(dt / (8 * F), 0, 1), dn = clamp((dt - 14 * F) / (10 * F), 0, 1);
      const W = dt < 0 ? 0 : Math.pow(up, 1.5) * Math.pow(1 - dn, 2);
      const after = dt > 11 * F;                          // behind the white, they have traded places
      const dark = sstep(14 * F, 24 * F, dt);
      ctx.store.W = W; ctx.store.dark = dark;
      ctx.store.lift = dt < 0 ? 0 : 1 - sstep(4 * F, 10 * F, dt);      // the strike burns through the veil in the mouth
      const sx = -0.2, sz = 1.6, sy = H(sx, sz);
      // the phone where he dropped it, on the rock at the water's edge: its beam finds his back
      const r = A(ctx, 'phoneRest');
      if (ph.root.parent !== ctx.scene) ctx.add(ph.root);
      ph.root.position.set(r.x, r.y + 0.02, r.z); ph.root.scale.setScalar(1); ph.root.up.set(0, 1, 0);
      ph.root.lookAt(_b.copy(ph.root.position).multiplyScalar(2).sub(_c.set(sx, sy + 1.25, sz)));
      const lvl = after ? 0.14 + 0.06 * Math.sin(t * 23) * Math.sin(t * 7.7) : 0.8;
      ph.setLevel(lvl); ph.spot.intensity = 7 * lvl; torchBeam(ctx, 0.1 * lvl);
      // the one in the water still holds a light under its chin (a lamp that only exists where the reflection does)
      const chin = lamp(ctx, 'chin', '#dfeaff', 2.4, 2, copy.root); chin.position.set(-0.28, 0.42, 0.62);
      K.setMirror(copy, after);
      if (!after) {
        // on his feet, his back to the pool, facing the storm; in the water it still kneels at the edge, smiling
        const g = sstep(0, 6 * F, dt);                    // an arm thrown up against the light
        ctx.place('me', [sx, sy, sz], { yaw: 0.1 });
        K.filmPose(me, 'stand', t, { breathe: 1, headPitch: -0.1, armL: [lerp(0.12, -2.05, g), 0, lerp(0.32, 0.5, g)], foreL: lerp(-0.25, -1.2, g), armR: [0.12, 0, -0.32], foreR: -0.25 });
        ctx.place('copy', 'kneel', { yaw: PI });
        K.filmPose(copy, 'kneel', t, { ...KNEEL }); copy.face('neutral', 0.4); K.filmFace(copy, 'creep');
        chin.intensity = 1.5;
        ctx.set.pool.substitute([me], [copy]);
      } else {
        me.root.visible = false;
        ctx.place('copy', [sx, sy, sz], { yaw: 0.1 });
        K.filmPose(copy, 'stand', 0);                     // a statue
        chin.intensity = 0;
        ctx.set.pool.substitute([], []);
      }
      ctx.props.real.me.update(t);
      // light: a far flicker first, then the strike in the sea just outside the mouth
      const pre = 0.16 * K.flicker(t, 2, 0.9);
      const f = dt < 0 ? pre : (0.45 + 2.0 * Math.pow(up, 1.2)) * Math.pow(1 - dn, 2.2);
      K.applyFlash(ctx, f, { bolt: dt >= 0 && dt < 13 * F ? 0 : null, post: 0.5, cap: 1.2 });
      ctx.set.spill.intensity = 9 * (1 - 0.92 * dark);
      // after the white, one ring spreads from the middle of the pool: something went through the water
      poolFx(ctx, { reflect: 1.7, drips: [[0.5, -2.5, ts + 12 * F]] });
      ringGlint(ctx, 'swapRing', 0.5, -2.5, ts + 13 * F, { speed: 1.0, life: 2.6, gain: 1.5, n: 3, gap: 0.3, color: [0.35, 0.5, 0.8] });
      const u = smooth(lt / 3.1), cy = ctx.set.waterY + 0.55;
      ctx.cam.set({ pos: [0.75, cy, lerp(-5.65, -5.4, u)], look: [0.12, cy + 0.12, 4.4], fov: 46 });
      ctx.cam.shake(0.012 + 0.2 * (dt > 0 ? Math.exp(-dt / 0.25) : 0), t, 37);
    },
    post: K.shotPost((ctx) => {
      const W = ctx.store.W || 0, dark = ctx.store.dark || 0, lift = ctx.store.lift || 0;
      return { exposure: lerp(1, 0.22, dark), fade: { color: '#ffffff', amount: 0.9 * Math.min(1, W * 1.15) }, fog: { density: lerp(0.07, 0.03, lift), sky: lerp(1, 0.42, lift) } };
    }),
  },
];
