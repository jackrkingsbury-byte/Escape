/*
 * act2.js — "The double closes in" (b08–b15, 27.79–56.83 s): the flash rule, the HUSS, "The cave is safe. Go in.",
 * the fire dies, the sneakers in the ashes, herded to the cave.
 *
 *   27.79  b08   frame A, three flashes: the double at 9 m, 7 m, 5 m                      (locked, identical to beat 1)
 *   32.50  b09   extreme close-up: fire-lit face, he turns to the dark beach and fills his lungs
 *   35.67  b10a  low-angle front close-up: the shout
 *   36.27  b10b  frame A, no flash, nobody on the foam line. Hold.                         (captions off)
 *   37.76  b11a  one flash, from his eye-line: the double 4 m away, pointing at the cliff (COPY caption)
 *   39.06  b11b  on-axis punch-in: the raised hand, the white rag on the WRONG side
 *   40.39  b12a  wide from the waterline: cliff, cave mouth, the kid tiny by the hull and the fire
 *   42.85  b12b  the kid under the hull, fire on his face ("Mom's rule…")
 *   45.80  b13   close on the fire: a sheet of rain, it gutters and dies
 *   47.62  b14a  ember dark: his face over the dead logs
 *   49.51  b14b  flash: two white sneakers planted in the ashes, prints leading in from the surf
 *   51.50  b15   ONE locked long lens down the beach, three flash stills: he is cut off from the trees and herded to the cave
 *                (the kid carries the lit phone torch; the double is the black one; both stay, dim, between the strikes)
 *
 * Rules kept: every per-frame state is recomputed in update() from time alone (no leaks between shots); set options
 * only through `options`; per-shot objects through ctx.add; no Math.random.
 */
import * as THREE from 'three';
import * as K from './kit.js';
import { instance } from '../real/assets.js';

const PI = Math.PI;
const { clamp, lerp, smooth } = K;
const A = (ctx, n) => ctx.set.anchors[n];
const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const sstep = (a, b, x) => smooth(clamp((x - a) / (b - a), 0, 1));
const fireFl = (t) => 0.78 + 0.12 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1) + 0.1 * Math.sin(t * 17.3 + 2) * Math.sin(t * 2.1);

/**
 * Campfire level for THIS frame (call in update; the shot declares `options: { fire: 1 }`). Everything touched here is
 * re-set by the set's own update every frame, so nothing leaks into other shots.
 *   L 0..1 flame/light level · o.ash (ember-bed glow ×) · o.smoke (opacity) · o.h / o.w (flame height / width ×) · o.flame (flame brightness, 0.6)
 */
function fireLevel(ctx, L, o = {}) {
  const w = ctx.set.world; if (!w) return;
  L = clamp(L, 0, 1);
  w.fire.light.intensity *= L; if (w.fireFill) w.fireFill.intensity *= L;
  w.fire.flames.visible = L > 0.02; w.fire.flames.material.uniforms.uIntensity.value = (o.flame ?? 0.6) * L;
  w.fire.flames.scale.set(o.w ?? 1, (0.35 + 0.65 * L) * (o.h ?? 1), o.w ?? 1);
  if (w.fireAsh) w.fireAsh.material.emissiveIntensity = 0.6 * (0.12 + 0.88 * L) * (o.ash ?? 1);
  if (w.fire.embers) w.fire.embers.visible = L > 0.02;
  if (w.fire.smoke) w.fire.smoke.material.uniforms.uOpacity.value = o.smoke ?? lerp(0.2, 0.32, L);
  w.foam.uniforms.uFireCol.value.setRGB(1.0, 0.42, 0.12).multiplyScalar(0.5 * L);
}
/** a per-shot light kept in ctx.store (created once per shot entry, removed by the engine at the cut) */
function lamp(ctx, key, color, dist = 6, decay = 2) {
  return ctx.store[key] || (ctx.store[key] = ctx.add(new THREE.PointLight(color, 0, dist, decay)));
}
/** the fire's glow on a subject as a practical: warm point light from the fire's side */
function fireKick(ctx, key, pos, I, dist = 7) {
  const l = lamp(ctx, key, '#ff8a3c', dist, 2); l.position.set(pos[0], pos[1], pos[2]); l.intensity = I * fireFl(ctx.t); return l;
}

const _zero = new THREE.Matrix4().makeScale(0, 0, 0);
/** hide the kid's falling drips for this frame (close-ups; real.update rewrites them every frame) */
function noDrips(ctx) { const d = ctx.props.real.me.drips; if (!d) return; for (let i = 0; i < d.count; i++) d.setMatrixAt(i, _zero); d.instanceMatrix.needsUpdate = true; }
const _hp = new THREE.Vector3();
/** centre of the (0.75 m) head, world; call after the pose */
function headCentre(ch) { ch.root.updateWorldMatrix(true, true); ch.joints.head.getWorldPosition(_hp); return [_hp.x, _hp.y + 0.3, _hp.z]; }
/**
 * Camera on a face, locked to the BODY (the head may turn inside the frame). yaw = body yaw; az = camera azimuth off the
 * body's forward (+ = toward his left); drop = look this far below the head centre (puts the face in the upper third).
 * Returns the focus distance.
 */
function faceCam(ctx, ch, yaw, { az = 0, dist = 3, fov = 30, dy = 0, drop = 0.18, roll = 0 } = {}) {
  const h = headCentre(ch), a = yaw + az;
  ctx.cam.set({ pos: [h[0] + Math.sin(a) * dist, h[1] + dy, h[2] + Math.cos(a) * dist], look: [h[0], h[1] - drop, h[2]], fov, roll });
  return dist - 0.3;
}
/** a flash light of our own with a wide shadow box (the set's covers ±17 m round the wreck only). dir = toward the strike */
function ownFlash(ctx, f, dir, centre, half = 46, power = 2.0) {
  let l = ctx.store.ownFlash;
  if (!l) {
    l = ctx.store.ownFlash = new THREE.DirectionalLight('#dfe9ff', 0);
    l.castShadow = true; l.shadow.mapSize.set(2048, 2048); l.shadow.bias = -0.0006; l.shadow.normalBias = 0.06; l.shadow.radius = 2;
    ctx.add(l); ctx.add(l.target);
  }
  // (every frame, not only at creation: the box may change inside a shot, and a frame must not depend on the frames before it)
  Object.assign(l.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 260 });
  l.shadow.camera.updateProjectionMatrix();
  const n = Math.hypot(dir[0], dir[1], dir[2]);
  l.target.position.set(centre[0], centre[1], centre[2]);
  l.position.set(centre[0] + dir[0] / n * 120, centre[1] + dir[1] / n * 120, centre[2] + dir[2] / n * 120);
  l.intensity = f * power;
  return l;
}
/** sheet-lightning glow on the face of the cave dome (far out at sea, never a flash): the mouth stays a black hole */
function caveGlow(ctx, I) {
  const l = ctx.store.caveGlow || (ctx.store.caveGlow = ctx.add(new THREE.PointLight('#cfe0ff', 0, 160, 1.5)));
  l.position.set(-44, 26, -12); l.intensity = I; return l;      // high and far: a sheen, never a pool of light
}
/** thin the set's fog banks for this frame (re-set by the set every frame) */
function fogCards(ctx, k) { const w = ctx.set.world; w.fogSea.uniforms.uOpacity.value *= k; w.fogLand.uniforms.uOpacity.value *= k; }

// ───────────────────────────────────────────── the kid at the water's edge (b09, b10a: the close-ups; frame A itself is K.frameA…)
const KID_YAW = -PI / 2 - 0.3;
function statue(ctx, anchor, yaw, p = {}) {
  ctx.place('copy', anchor, { yaw });
  K.filmPose(ctx.cast.copy, 'stand', 0, p);
}

// ───────────────────────────────────────────── spray (the shout shakes the rain off him)
function makeSpray(n = 170, seed = 41) {
  const r = K.rng(seed);
  // thin motion-blurred droplets (the same language as the rain streaks), not dashes: long, hair-thin, faint, additive
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.68, 0.74), transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false; mesh.name = 'spray';
  const d = [];
  for (let i = 0; i < n; i++) {
    const a = r() * PI * 2, up = 0.2 + r() * 1.0, sp = 1.8 + r() * 3.6;
    d.push({ o: [(r() - 0.5) * 0.5, 0.05 + r() * 0.5, (r() - 0.5) * 0.45], v: [Math.cos(a) * sp * 0.8, up * sp * 0.75, Math.sin(a) * sp * 0.8 + 1.2], delay: r() * 0.07, s: 0.0011 + r() * 0.0013 });
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  /** origin: world point (top of the head), q0: head yaw quaternion, tau: seconds since the shout */
  mesh.userData.update = (origin, q0, tau) => {
    for (let i = 0; i < n; i++) {
      const k = d[i], t = tau - k.delay;
      if (t <= 0 || t > 0.8) { m4.makeScale(0, 0, 0); mesh.setMatrixAt(i, m4); continue; }
      v.set(k.v[0], k.v[1] - 9.8 * t, k.v[2]);
      p.set(k.o[0] + k.v[0] * t, k.o[1] + k.v[1] * t - 4.9 * t * t, k.o[2] + k.v[2] * t).applyQuaternion(q0).add(origin);
      v.applyQuaternion(q0);
      const len = clamp(v.length() * 0.03, 0.02, 0.13), fade = clamp(1 - t / 0.8, 0, 1) * clamp(t / 0.04, 0, 1);
      q.setFromUnitVectors(up, v.normalize());
      s.set(k.s * (0.4 + 0.6 * fade), len, k.s * (0.4 + 0.6 * fade));
      m4.compose(p, q, s); mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return mesh;
}

// ───────────────────────────────────────────── gust (a sheet of rain driven through the fire)
function makeGust(n = 520, seed = 77) {
  const r = K.rng(seed);
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.42, 0.47, 0.52), transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false; mesh.name = 'gust';
  const d = [];
  for (let i = 0; i < n; i++) d.push({ x: r(), y: r(), z: r(), sp: 0.8 + r() * 0.5, s: 0.0016 + r() * 0.0022, ph: r() });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
  /** centre: world point, wind: unit XZ direction [x, z], g: gust strength 0..1, t: time */
  mesh.userData.update = (centre, wind, g, t, cam) => {
    const BX = 5.5, BY = 2.6, BZ = 3.2, speed = 13;
    dir.set(wind[0] * 0.86, -0.5, wind[1] * 0.86).normalize();
    q.setFromUnitVectors(up, dir);
    const px = -wind[1], pz = wind[0];                                   // across the wind
    for (let i = 0; i < n; i++) {
      const k = d[i];
      if (g <= 0.01 || k.ph > g * 1.15) { m4.makeScale(0, 0, 0); mesh.setMatrixAt(i, m4); continue; }
      const along = ((k.x * BX + t * speed * k.sp) % BX) - BX / 2, across = (k.z - 0.5) * BZ;
      const fall = (along + BX / 2) / BX;                                // falls as it travels
      p.set(centre.x + wind[0] * along + px * across, centre.y + 0.15 + (k.y * BY) * (1 - 0.55 * fall), centre.z + wind[1] * along + pz * across);
      if (p.y < centre.y + 0.02) p.y = centre.y + 0.02;
      const edge = Math.min(1, (BX / 2 - Math.abs(along)) / 0.8) * (cam ? clamp((p.distanceTo(cam) - 0.9) / 0.6, 0, 1) : 1);
      s.set(k.s, 0.32 * k.sp * edge * g, k.s);
      m4.compose(p, q, s); mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return mesh;
}

// ═════════════════════════════════════════════ shots ══════════════════════════════════════════════════════════════
export const shots = [
  // ── b08 · "He never moves when it's bright. Only in the dark." ─────────────────────────────────────────────────────
  {
    name: 'a2 b08 frame A: 9 m, 7 m, 5 m', start: 'flash8a', set: 'beachNight', cast: ['me', 'copy'], options: { fire: 1 }, captionY: 0.765, captionX: 0.68,   // the words beside the double, across the kid's back
    setup(ctx) { K.frameASetup(ctx); },
    update(ctx) {
      const t = ctx.t, T = (n) => ctx.time(n);
      fireLevel(ctx, 0.8);
      // three strikes, three steps: he only exists in the light, and each time he is nearer (the identical frozen pose)
      const d9 = A(ctx, 'double9'), d7 = A(ctx, 'double7'), d5 = A(ctx, 'double5');
      const t7 = T('flash8b') - 0.32, t5 = T('step8');
      const d = t < t7 ? d9 : t < t5 ? d7 : d5;
      K.frameAPose(ctx, { look: d, breathe: 1.8 });                         // he looks straight at him; the head follows him in
      statue(ctx, d, PI / 2);
      const f = K.frameAFlash(ctx, [{ at: 'flash8a', bolt: 4 }, { at: 'flash8b', bolt: null, power: 0.9 }, { at: 'flash8c', bolt: 5 }]);
      K.frameAFloor(ctx, f, 0.1 + 0.02 * Math.sin(t * 1.9 + 1));            // the dark between: foam, fog and the fire's edge on the kid, nobody on the foam line
      ctx.cast.copy.root.visible = f > 0.004;
      K.doubleTells(ctx, 0.35 * f);
      K.frameAKid(ctx, f, { warm: 1, flicker: fireFl(t) });                 // the same light as in beat 1; the fire under the wreck is now his edge
      // the lip of the wash slides up the beach with him in the dark
      const u7 = sstep(T('flash8a') + 0.8, t7, t), u5 = sstep(T('flash8b') + 0.8, T('flash8c') - 0.1, t);
      K.frameAFoam(ctx, d9.clone().lerp(d7, u7).lerp(d5, u5), 0.34 + 0.6 * f);
      ctx.cam.shake(0.03, t, 5);
    },
    post: K.frameAPost({ grade: { highlightAmt: 0.3 } }),
  },

  // ── b09 · "When I'm scared, I yell my word. To see if anything answers." ───────────────────────────────────────────
  {
    name: 'a2 b09 ECU: fire-lit face, fills his lungs', start: 'b09.w2-0.03', set: 'beachNight', cast: ['me'], options: { fire: 1, rain: 1.5, rainBack: 1.3, rainNear: 3.6 },
    setup(ctx) { ctx.place('me', 'kidA', { yaw: KID_YAW }); },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t;
      fireLevel(ctx, 0.75);
      const turn = sstep(ctx.time('b09.w7') - 0.3, ctx.time('b09.w7') + 0.45, t);            // "To see if anything answers": to the dark beach
      const fill = sstep(ctx.time('b09.w10'), ctx.time('b10') - 0.12, t);                     // lungs
      K.filmPose(me, 'stand', t, { breathe: 2.2, headYaw: lerp(0.5, -0.12, turn), headPitch: lerp(0.14, -0.04 - 0.13 * fill, turn) });
      K.joint(me, 'torso', -0.1 * fill, 0, 0);
      me.face(fill > 0.75 ? 'determined' : 'shocked', t);
      ctx.props.real.me.update(t);
      // locked to the body, a little to the sea side of his face; a slow creep in
      const u = smooth(lt / 3.2);
      ctx.store.focus = faceCam(ctx, me, KID_YAW, { az: lerp(0.14, -0.2, turn), dist: lerp(3.25, 2.95, u), fov: 26, dy: -0.06, drop: 0.2 });   // the lens comes round with his head: both eyes stay in frame
      // the low fire on his inland cheek (practical) + a thin cold edge from the sea side
      const h = headCentre(me), fw = [Math.sin(KID_YAW), Math.cos(KID_YAW)], lf = [fw[1], -fw[0]];       // lf = his left (inland)
      fireKick(ctx, 'fire', [h[0] + fw[0] * 0.9 + lf[0] * 1.7, h[1] - 1.3, h[2] + fw[1] * 0.9 + lf[1] * 1.7], 11);
      const c = lamp(ctx, 'cold', '#9db8d8', 5, 2); c.position.set(h[0] + fw[0] * 0.5 - lf[0] * 1.7, h[1] + 0.9, h[2] + fw[1] * 0.5 - lf[1] * 1.7); c.intensity = 1.5;
      K.applyFlash(ctx, 0.05 * K.flicker(t, 4, 1.7));
      ctx.cam.shake(0.035, t, 9);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 2.8, aperture: 1.5, maxBlur: 18 }, grade: { highlightAmt: 0.5, saturation: 0.42 } })),
  },

  // ── b10 · "HUSS!" ──────────────────────────────────────────────────────────────────────────────────────────────────
  {
    name: 'a2 b10a low front close-up: the shout', start: 'b10-0.09', set: 'beachNight', cast: ['me'], options: { fire: 1, rain: 1.7, rainBack: 1.6 },
    setup(ctx) {
      ctx.place('me', 'kidA', { yaw: KID_YAW });
      ctx.store.spray = ctx.add(makeSpray()); ctx.store.spray.layers.set(10);      // on the rain layer: crisp, after depth of field
    },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t, k = A(ctx, 'kidA'), tau = t - ctx.time('b10');
      fireLevel(ctx, 0.75);
      const hit = clamp(tau / 0.06, 0, 1), rel = Math.exp(-Math.max(0, tau) / 0.35);
      const jolt = hit * rel;
      K.filmPose(me, 'stand', t, { breathe: 0, headYaw: -0.1, headPitch: lerp(-0.18, 0.08, hit) - 0.05 * Math.sin(tau * 60) * rel * hit,
        armR: [0.35 * hit, 0, -0.32 - 0.25 * jolt], armL: [0.35 * hit, 0, 0.32 + 0.25 * jolt], foreR: -0.5 * hit, foreL: -0.5 * hit });
      K.joint(me, 'torso', lerp(-0.12, 0.2, hit), 0, 0);
      me.face('determined', t); if (tau > -0.02) K.filmFace(me, 'shout');      // eyes squeezed to lines, a dark open mouth: no cartoon anger mark
      ctx.props.real.me.update(t);
      const fw = [Math.sin(KID_YAW), Math.cos(KID_YAW)], sd = [-fw[1], fw[0]];              // sd = toward the sea
      const pos = [k.x + fw[0] * 1.8 + sd[0] * 0.3, k.y + 0.86, k.z + fw[1] * 1.8 + sd[1] * 0.3];
      ctx.cam.set({ pos, look: [k.x + fw[0] * 0.1, k.y + 1.5, k.z + fw[1] * 0.1], fov: 50 });
      ctx.cam.punch([ctx.time('b10')], t, 0.1, 0.22);
      ctx.cam.shake(0.05 + 0.5 * jolt, t, 11, 2.2);
      // spray off his hair and shoulders
      const h = headCentre(me);
      ctx.store.spray.userData.update(_hp.set(h[0], h[1] + 0.25, h[2]), me.root.quaternion, tau);
      fireKick(ctx, 'fire', [k.x + fw[0] * 1.1 - sd[0] * 1.9, k.y + 0.35, k.z + fw[1] * 1.1 - sd[1] * 1.9], 10);
      const c = lamp(ctx, 'cold', '#a9c2e2', 6, 2); c.position.set(k.x - fw[0] * 1.2 + sd[0] * 1.5, k.y + 2.9, k.z - fw[1] * 1.2 + sd[1] * 1.5); c.intensity = 5;
    },
    post: K.shotPost({ dof: { focus: 1.8, aperture: 0.6, maxBlur: 10 }, grade: { highlightAmt: 0.5, saturation: 0.42 } }),
  },
  {
    name: 'a2 b10b frame A: nobody. Hold', start: 'b10+0.51', set: 'beachNight', cast: ['me'], options: { fire: 1 }, captions: false,
    setup(ctx) { K.frameASetup(ctx); },
    update(ctx, lt) {
      const t = ctx.t, d5 = A(ctx, 'double5');
      fireLevel(ctx, 0.72);
      // he listens: breathing hard, the head searches the foam line where the other one stood. Nobody. Only the grey glow of
      // the foam and the fog (the storm's floor: never black) and the rain
      K.frameAPose(ctx, { look: d5, headYaw: -0.2 * sstep(0.5, 1.3, lt), breathe: 2.6 });
      K.frameAFloor(ctx, 0, 0.12 + 0.02 * Math.sin(t * 1.9 + 1) + 0.05 * K.flicker(t, 7, 1.1));
      K.frameAKid(ctx, 0, { warm: 1, flicker: fireFl(t) });
      K.frameAFoam(ctx, d5, 0.34);
      ctx.cam.shake(0.03, t, 5);
    },
    post: K.frameAPost({ grade: { highlightAmt: 0.3 } }),
  },

  // ── b11 · COPY: "The cave is safe. Go in." ─────────────────────────────────────────────────────────────────────────
  {
    name: 'a2 b11a flash: the double at 4 m, pointing', start: 'flash11', set: 'beachNight', cast: ['copy'], options: { fire: 1 },
    setup(ctx) {},
    update(ctx, lt) { b11(ctx, lt, 0); },
    post: K.shotPost({ fog: { density: 0.006 } }),
  },
  {
    name: 'a2 b11b punch-in: the rag on the wrong hand', start: 'b11.w4-0.1', set: 'beachNight', cast: ['copy'], options: { fire: 1 },
    setup(ctx) {},
    update(ctx, lt) { b11(ctx, lt, 1); },
    post: K.shotPost({ fog: { density: 0.006 } }),
  },

  // ── b12 · "My voice. But I'd never say that. Mom's rule. No sea caves in a storm." ─────────────────────────────────
  {
    name: 'a2 b12a long lens: the cave over the kid and his fire', start: 'b12', set: 'beachNight', cast: ['me'], options: { fire: 1, rain: 0.3 },
    setup(ctx) { ctx.place('me', 'camp', { yaw: ctx.set.campYaw }); },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      fireLevel(ctx, 0.62, { flame: 0.3 });
      K.filmPose(me, 'huddle', t, { curl: 1, shiver: 0.5, headYaw: 0.35, headPitch: 0.1 });
      me.face('sad', t);
      ctx.props.real.me.update(t);          // (always: the drips are per-frame state)
      const u = lt / 2.5, H = ctx.set.heightAt;
      const pos = [22.2, H(22.2, 8.3) + 3.6, 8.3];
      ctx.cam.set({ pos, look: [-57.6, pos[1] - 4.0, 1.6], fov: lerp(13.6, 12.8, u) });
      // sheet lightning far out at sea: a dim, slow swell of light on the headland, the cave mouth stays a black hole
      const f = 0.2 + 0.1 * Math.sin(t * 1.3 + 1) + 0.22 * K.flicker(t, 6, 1.5);
      K.applyFlash(ctx, f, { dir: [0.45, 0.5, -0.75], light: 0.6, sky: 1.2, post: 0.25, bolt: null });
      caveGlow(ctx, 2600 * f);
      fogCards(ctx, 0.45);
      ctx.cam.shake(0.008, t, 13);
    },
    post: K.shotPost({ fog: { density: 0.0034, start: 30 }, bloom: { threshold: 1.5, strength: 0.1 }, grade: { highlightAmt: 0.4, saturation: 0.4 } }),
  },
  {
    name: 'a2 b12b the kid under the hull: Mom\'s rule', start: 'b12.w7-0.06', set: 'beachNight', cast: ['me'], options: { fire: 1, rain: 1.3, rainNear: 7 },
    setup(ctx) { ctx.place('me', 'camp', { yaw: ctx.set.campYaw }); },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t, k = A(ctx, 'camp'), cy = ctx.set.campYaw;
      fireLevel(ctx, 0.7 - 0.1 * sstep(1.5, 2.9, lt));
      // Mom's rule: eyes down into the fire, a small shake of the head
      const no = Math.sin((lt - 1.15) * 7.5) * 0.12 * sstep(1.15, 1.35, lt) * (1 - sstep(2.1, 2.6, lt)), down = sstep(0.2, 1.0, lt);
      K.filmPose(me, 'huddle', t, { curl: 1, shiver: 0.7, headYaw: 0.1 + no, headPitch: lerp(0.0, 0.14, down) });
      me.face('sad', t);
      ctx.props.real.me.update(t); noDrips(ctx);            // (a falling drip is a glowing egg at this distance)
      // a close-up the phone can read: his face (lit by the fire) whole inside the frame, his knees and the rag fist under it,
      // the hull over him, the storm sea behind.
      const u = smooth(lt / 3), h = headCentre(me), fw = [Math.sin(cy), Math.cos(cy)], lf = [fw[1], -fw[0]];      // lf = his left (the sea side)
      const ey = K.eyePoint(me), c = [ey.x, ey.y, ey.z], a = cy - 0.55, dist = lerp(3.5, 3.2, u);      // (aimed at the FACE: curled forward, it sits well ahead of the head joint)
      ctx.cam.set({ pos: [c[0] + Math.sin(a) * dist, c[1] + 0.05, c[2] + Math.cos(a) * dist], look: [c[0], c[1] - 0.3, c[2]], fov: 28 });
      ctx.store.focus = dist - 0.3;
      // the fire as a practical: a warm bounce off the sand in front of him at knee height (face, knees, hands get a mid-tone;
      // small numbers: the set's own fire light is weak, a lamp this near is not), a cold edge from the sea side, and a small
      // kicker on the white rag
      fireKick(ctx, 'bounce', [k.x + fw[0] * 2.0, k.y + 0.45, k.z + fw[1] * 2.0], 0.2, 7);
      const cold = lamp(ctx, 'cold', '#9db8d8', 5, 2); cold.position.set(h[0] + fw[0] * 0.5 + lf[0] * 1.7, h[1] + 0.9, h[2] + fw[1] * 0.5 + lf[1] * 1.7); cold.intensity = 1.5;
      const hand = me.joints.handR.getWorldPosition(_hp);
      const rk = lamp(ctx, 'ragK', '#ffe1c4', 1.4, 2); rk.position.set(hand.x + fw[0] * 0.5, hand.y + 0.3, hand.z + fw[1] * 0.5); rk.intensity = 0.5;
      ctx.set.foam.uniforms.uAmbient.value = 0.35;
      K.applyFlash(ctx, 0.1 + 0.05 * K.flicker(t, 4, 1.7), { bolt: null, light: 0.45, sky: 3 });      // the storm's floor behind him: sea, foam, fog (never black)
      ctx.cam.shake(0.03, t, 15);
    },
    post: K.shotPost((ctx) => ({ exposure: 1.15, dof: { focus: ctx.store.focus || 3, aperture: 1.3, maxBlur: 16 }, bloom: { threshold: 1.5, strength: 0.12 }, grade: { highlightAmt: 0.5, saturation: 0.42 } })),
  },

  // ── b13 · "Then the rain kills my fire." ───────────────────────────────────────────────────────────────────────────
  {
    name: 'a2 b13 close on the fire: it dies', start: 'b13-0.05', set: 'beachNight', cast: [], options: { fire: 1, rain: 1.4 },
    setup(ctx) {
      ctx.store.gust = ctx.add(makeGust());
      ctx.store.gust.layers.set(10);
    },
    update(ctx, lt) {
      const t = ctx.t, f = A(ctx, 'fire');
      const die = ctx.time('firedie');
      // gust: arrives on "rain", peaks on "kills", is gone half a second later
      const g = sstep(die - 0.45, die - 0.05, t) * (1 - sstep(die + 0.25, die + 0.8, t));
      const L = 0.62 * (1 - 0.7 * sstep(die - 0.3, die + 0.05, t)) * (1 - sstep(die + 0.05, die + 0.6, t)) * (0.82 + 0.18 * Math.sin(t * 31) * Math.sin(t * 13));
      fireLevel(ctx, L, { smoke: lerp(0.3, 0.8, sstep(die - 0.1, die + 0.6, t)), ash: 1 + 4.5 * sstep(die, die + 0.5, t) * (1 - 0.35 * sstep(die + 0.6, die + 1.5, t)), w: 1 + 0.6 * g, flame: 0.34 });
      ctx.set.rain.uniforms.uOpacity.value *= 1 + 1.6 * g;
      // from the open (seaward) side of the pit, low: flames against the black beach
      const a = 5.3, d = 2.7, u = smooth(lt / 2);
      const pos = [f.x + Math.cos(a) * d, f.y + lerp(0.42, 0.36, u), f.z + Math.sin(a) * d];
      ctx.cam.set({ pos, look: [f.x, f.y + 0.34, f.z], fov: 36 });
      ctx.store.gust.userData.update(f, [-0.95, 0.31], g, t, _hp.set(pos[0], pos[1], pos[2]));
      // what is left: a red breath in the logs and on the wet sand
      const e = lamp(ctx, 'ember', '#ff4a12', 3.5, 2); e.position.set(f.x + 0.05, f.y + 0.16, f.z - 0.12);
      e.intensity = 2.2 * sstep(die, die + 0.5, t) * (1 - 0.3 * sstep(die + 0.6, die + 1.5, t)) * (0.85 + 0.15 * Math.sin(t * 5.1));
      // once the flames are gone the storm takes the frame back: the grey of the sea and the foam behind the pit (never black)
      ctx.set.foam.uniforms.uAmbient.value = 0.15 + 0.2 * sstep(die, die + 0.6, t);
      K.applyFlash(ctx, 0.16 * sstep(die - 0.1, die + 0.6, t) + 0.05 * K.flicker(t, 6, 1.4), { bolt: null, light: 0.45, sky: 3 });
      ctx.cam.shake(0.03 + 0.08 * g, t, 17);
    },
    post: K.shotPost({ exposure: 1.35, dof: { focus: 2.7, aperture: 0.5, maxBlur: 12 }, bloom: { threshold: 1.4, strength: 0.14 }, grade: { highlightAmt: 0.6, saturation: 0.55 } }),
  },

  // ── b14 · "Lightning again... and he's standing in the ashes." ─────────────────────────────────────────────────────
  {
    name: 'a2 b14a ember dark: his face', start: 'b14-0.3', set: 'beachNight', cast: ['me'], options: { fire: 1, rain: 1.3, rainNear: 7 },
    setup(ctx) { ctx.place('me', 'camp', { yaw: ctx.set.campYaw }); },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t, f = A(ctx, 'fire');
      // the embers hold his face until the last half second before the strike, then they sink: the dark before the flash
      const dk = sstep(ctx.time('flash14') - 0.62, ctx.time('flash14') - 0.3, t);
      fireLevel(ctx, 0, { ash: 3.0 - 1.2 * dk, smoke: 0.6 });
      const fl = K.flicker(t, 9, 1.3);
      const up = sstep(0.75, 1.15, lt);                   // "Lightning again…": the eyes go up to the sky
      K.filmPose(me, 'huddle', t, { curl: 1, shiver: 0.8, headPitch: lerp(0.18, -0.22, up), headYaw: lerp(0.05, -0.3, up) });
      me.face('shocked', t);
      ctx.props.real.me.update(t); noDrips(ctx);
      ctx.store.focus = faceCam(ctx, me, ctx.set.campYaw, { az: 0.22, dist: 3.0 - 0.15 * smooth(lt / 1.9), fov: 27, dy: -0.12, drop: 0.38 });
      // the last embers under his chin
      const fw = [Math.sin(ctx.set.campYaw), Math.cos(ctx.set.campYaw)];
      const e = lamp(ctx, 'ember', '#ff4a12', 6, 2); e.position.set(f.x - fw[0] * 0.45, f.y + 0.18, f.z - fw[1] * 0.45);
      e.intensity = lerp(2.4, 1.2, dk) * (0.85 + 0.15 * Math.sin(t * 5.1));
      // and the storm he is looking up at: a cold breath on his forehead and on the hull behind him
      const h = headCentre(me);
      const c = lamp(ctx, 'cold', '#9db8d8', 6, 2); c.position.set(h[0] + fw[0] * 1.6, h[1] + 1.5, h[2] + fw[1] * 1.6 - 1.2); c.intensity = lerp(0.5, 0.3, dk) * (1 + 1.5 * fl);
      K.applyFlash(ctx, 0.1 * (1 - 0.6 * dk) + 0.22 * fl, { post: 0.2, dir: [-0.3, 0.6, -0.7] });
      ctx.cam.shake(0.03, t, 19);
    },
    post: K.shotPost((ctx) => ({ exposure: 1.1, dof: { focus: ctx.store.focus || 2.7, aperture: 1.3, maxBlur: 16 }, grade: { highlightAmt: 0.4, saturation: 0.42 } })),
  },
  {
    name: 'a2 b14b flash: sneakers in the ashes', start: 'flash14', set: 'beachNight', cast: ['copy'], options: { fire: 1, splash: 0.4 },
    setup(ctx) {
      const f = A(ctx, 'fire'), k = A(ctx, 'camp');
      // he stands on the open, seaward half of the pit (the teepee of charred logs leans on the inland half), facing the kid
      ctx.place('copy', [f.x - 0.04, f.y, f.z - 0.27], { yaw: yawTo(f, k) + 0.75 });
      // fresh prints: up out of the surf and straight into the ashes
      const pts = K.printTrail([-3.9, 0.2], [f.x + 0.1, f.z - 0.86], { stride: 0.6, gauge: 0.22 });
      ctx.add(K.makeFootprints(pts, { heightAt: ctx.set.heightAt, size: 0.33, opacity: 0.96 }));
    },
    update(ctx, lt) {
      const t = ctx.t, f = A(ctx, 'fire'), w = ctx.set.world;
      fireLevel(ctx, 0, { ash: 1.3, smoke: 0.9 });
      // (hanging hands are white cubes at the top edge of this low frame: his forearms are folded up out of it; only the legs matter here)
      K.filmPose(ctx.cast.copy, 'stand', 0, { foreR: -2.5, foreL: -2.5 });
      // the hardest flash of the film; afterwards the storm's glow keeps the sneakers and the pit readable through "in the ashes"
      const fl = K.flash(ctx, [{ at: 'flash14', bolt: null }], { dir: [0.5, 0.42, -0.76], light: 1.6, post: 1.3, cap: 1 });
      const floor = 0.42 + 0.03 * Math.sin(t * 2.3) + 0.06 * K.flicker(t, 5, 0.9);
      if (fl < floor) K.applyFlash(ctx, floor, { dir: [0.5, 0.42, -0.76], light: 1.6, post: 1.0, bolt: null });
      const lv = Math.max(fl, floor);
      // the smoke of the dead fire catches the light: a pale wisp climbing past his knees
      if (w.fire.smoke) w.fire.smoke.material.uniforms.uColor.value.setRGB(0.165 + 0.5 * lv, 0.165 + 0.53 * lv, 0.172 + 0.56 * lv);
      // low and wide on the surf side, standing on his trail: the last prints, the sneakers in the pit, the legs rising out of frame
      ctx.cam.set({ pos: [f.x + 0.74, f.y + 0.62, f.z - 1.74], look: [f.x - 0.04, f.y + 0.13, f.z - 0.27], fov: 62 });   // (low enough that his hanging hands stay out of the top of the frame)
      // the last heat under his soles
      const e = lamp(ctx, 'ember', '#ff4a12', 2.2, 2); e.position.set(f.x + 0.02, f.y + 0.1, f.z - 0.2); e.intensity = 0.6 * (0.85 + 0.15 * Math.sin(t * 5.1));
      // cold fill from the lens side so the sneakers read white, and a low raking lamp along the trail for the prints
      const c = lamp(ctx, 'fill', '#dfe9ff', 5, 2); c.position.set(f.x + 1.1, f.y + 0.5, f.z - 1.3); c.intensity = 2.0 * lv;
      const tr = lamp(ctx, 'trail', '#cfdcf0', 4.5, 2); tr.position.set(f.x + 1.5, f.y + 0.55, f.z - 2.1); tr.intensity = 3.2 * lv;
      void lt;
      ctx.cam.shake(0.03, t, 21);
    },
    post: K.shotPost({ dof: { focus: 1.6, aperture: 0.25, maxBlur: 8 } }),
  },

  // ── b15 · "Every flash, he cuts me off. The only place left... is the cave." ───────────────────────────────────────
  {
    // ONE locked long lens for the whole beat, high over the dunes behind the wreck, looking down the beach: the black cave
    // mouth at the top of the frame, the tree line on the left edge, the wash on the right. Three frozen stills in it, bottom
    // → middle → top: the kid (the one with the lit phone torch, the white rag, the pale rim) and the double (the pure black
    // one, always on the TREE side of him, never between him and the cave). Between the strikes both stay, dim, where the
    // last flash left them: they jump on the first frame of the next one.
    name: 'a2 b15 high side wide: herded to the cave', start: 'flash15a', set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0, rainNear: 9 }, captionY: 0.63,
    setup(ctx) {
      ctx.cam.set(b15Cam(ctx));
      ctx.props.phone.setMode('torch').setLevel(0.8);
      // the edge of the tree line, cut out against the lit beach: three palm crowns leaning into the left of the frame
      B15_PALMS.forEach(([x, z, ry, sc], i) => ctx.add(instance(i % 2 ? 'palm_b' : 'palm_a', { position: [x, ctx.set.heightAt(x, z) - 0.25, z], rotationY: ry, scale: sc })));
    },
    update(ctx, lt) {
      const t = ctx.t, T = (n) => ctx.time(n), me = ctx.cast.me, copy = ctx.cast.copy, H = ctx.set.heightAt;
      const t3 = T('flash15c') - B15_LEAD;                  // the third strike is seen a few frames before its thunder: 20 frames of it before the cut
      const st = t < T('flash15b') ? 0 : t < t3 ? 1 : 2;
      fireLevel(ctx, 0, { ash: 1.5, smoke: 0.5 });
      const cave = A(ctx, 'cave');
      const kid = st < 2 ? A(ctx, ['mid1', 'mid2'][st]) : new THREE.Vector3(cave.x - 4.5, H(cave.x - 4.5, cave.z + 0.1), cave.z + 0.1);     // still 3: 4.5 m INSIDE the mouth
      const dbl = st < 2 ? A(ctx, ['cut1', 'cut2'][st]) : new THREE.Vector3(-51.4, H(-51.4, 4.7), 4.7);
      let aim;                                             // where the torch points (a pool of light on the sand: never on the double)
      if (st === 0) {            // backing away from him, the rag hand thrown up
        ctx.place('me', kid, { yaw: yawTo(kid, dbl) + 0.2 });
        K.filmPose(me, 'stand', 0, { armR: [-0.9, 0, -0.9], armL: [-0.7, 0, 0.5], foreR: -0.9, foreL: -0.7 });
        K.joint(me, 'torso', -0.2, 0, 0); K.joint(me, 'legL', 0.35, 0, 0.05); K.joint(me, 'legR', -0.25, 0, -0.05);
        aim = [lerp(kid.x, dbl.x, 0.3), kid.y, lerp(kid.z, dbl.z, 0.3)];
      } else if (st === 1) {     // running for the only way left, looking back
        ctx.place('me', kid, { yaw: -PI / 2 - 0.08 });
        me.pose('walk', 0.21, { speed: 1.5, headYaw: 1.2 });
        K.joint(me, 'torso', 0.3, 0, 0);
        aim = [kid.x - 2.2, kid.y, kid.z - 0.2];
      } else {                   // inside the black mouth, his back to us, looking over his shoulder at the one who stayed outside
        ctx.place('me', kid, { yaw: -PI / 2 + 0.25 });
        me.pose('walk', 0.21, { speed: 1.2, headYaw: -1.25 });
        K.joint(me, 'torso', 0.2, 0, 0);
        aim = [kid.x - 1.6, kid.y, kid.z + 0.3];
      }
      ctx.place('copy', dbl, { yaw: yawTo(dbl, kid) });
      K.filmPose(copy, 'stand', 0);
      ctx.props.real.me.update(t); noDrips(ctx);
      // WHO IS WHO: the kid holds the lit phone in his LEFT hand (it is still in that hand in the cave, the next shot)
      const ph = ctx.props.phone, hl = me.joints.handL.getWorldPosition(_hp);
      if (ph.root.parent !== ctx.scene) ctx.add(ph.root);
      ph.root.position.set(hl.x, hl.y + 0.03, hl.z); ph.root.scale.setScalar(1); ph.root.up.set(0, 1, 0);
      ph.root.lookAt(2 * hl.x - aim[0], 2 * (hl.y + 0.03) - aim[1], 2 * hl.z - aim[2]);        // the LED is on the back: −Z at the sand
      ph.beam.material.uniforms.uI.value = 0;              // (no beam cone at this distance: the pool on the sand and the point of light say it)
      // the strikes: 1 and 2 over the sea up-frame (cut-outs against the lit fog, shadows toward the lens); 3 from the SEA side
      // of the headland (the arch shadows him: a small figure with a torch in the black mouth, the double a black cut-out on
      // the lit sand outside)
      const dir = st < 2 ? [-0.55, 0.38, -0.75] : [-0.12, 0.5, -0.85];
      const f = K.flash(ctx, [{ at: 'flash15a', bolt: 0 }, { at: 'flash15b', power: 0.92, bolt: 1 }, { at: t3, power: 1.4, hold: 0.62, bolt: null }], { light: 0, dir, post: st < 2 ? 0.3 : 0.4, sky: st < 2 ? undefined : 3 });
      // the floor: sheet lightning far out at sea keeps the beach, the headland and the two of them readable between the strikes
      const fl = B15_FLOOR + 0.03 * Math.sin(t * 2.1) + 0.06 * K.flicker(t, 3, 0.8);
      const eye = sstep(T('b15.w10') - 0.3, T('b15.w10') + 0.5, t) * (st < 2 ? 1 : 0);      // "…is the cave": the storm's glow finds the headland
      if (f < fl) K.applyFlash(ctx, fl, { light: 0, bolt: null, dir, post: 1.0, sky: 3 });
      ownFlash(ctx, Math.max(f, fl * 0.45), dir, st < 2 ? [-30, 0, 4] : [-50, 0, 4], 46, st < 2 ? 2.0 : 3.2);
      ctx.props.real.copy.material.envMapIntensity = 0;    // the double takes nothing from the sky: a black cut-out (the set puts it back every frame)
      ctx.props.real.copy.bandMesh.visible = false;        // and wears nothing white at his nape (same: per frame)
      caveGlow(ctx, 900 * Math.max(f, fl * (0.6 + 0.8 * eye)));
      fogCards(ctx, st < 2 ? 0.45 : 0.12);                  // thinner haze: the black mouth must read at the top of the frame (and in the last still the two of them, 80 m off, must stay cut-outs)
      const lv = Math.max(f, fl);
      // the kid's pale rim and the white rag (two short-range lamps that never reach the double)
      const kp = me.root.position, hand = me.joints.handR.getWorldPosition(_hp);
      const rim = lamp(ctx, 'kidRim', '#dfe9ff', 2.2, 2), rag = lamp(ctx, 'kidRag', '#eef3ff', 1.6, 2);
      rim.position.set(kp.x + 1.4, kp.y + 2.3, kp.z - 0.7); rim.intensity = (st < 2 ? 0.8 : 0.3) * lv;      // (in the mouth his own torch draws him)
      rag.position.set(hand.x + 0.7, hand.y + 0.25, hand.z - 0.1); rag.intensity = (st < 2 ? 2.2 : 0.7) * lv;
      ctx.cam.shake(0.012, t, 23);
    },
    post: K.shotPost({ fog: { density: 0.0012, start: 40 } }),
  },
];

// b15: the locked lens. 12.5 m up over the dunes behind the wreck, looking down the beach a little toward the sea, pitched so
// the first still stands at the bottom of the frame and the cave mouth at the top (figures 16 % → 13 % → 10 % of the height)
function b15Cam(ctx) {
  const pos = [30, 12.5, 7], pitch = 9.17 * PI / 180, yaw = 1.73 * PI / 180, d = 60;
  return { pos, look: [pos[0] - d * Math.cos(pitch) * Math.cos(yaw), pos[1] - d * Math.sin(pitch), pos[2] - d * Math.cos(pitch) * Math.sin(yaw)], fov: 13.6 };
}
const B15_FLOOR = 0.28, B15_LEAD = 0.13;
const B15_PALMS = [[2, 9.35, 0.6, 1.0], [-10, 9.8, 2.4, 1.0], [-22, 10.0, 4.1, 1.05]];      // [x, z, rotY, scale]: the tree line, carried down onto the upper beach along the left edge of the frame

// the double from the kid's eye-line: 4 m away, off the foam line, one arm raised toward the cliff. v 0 = wide, 1 = punch-in
function b11(ctx, lt, v) {
  const t = ctx.t, copy = ctx.cast.copy, k = A(ctx, 'kidA'), H = ctx.set.heightAt;
  fireLevel(ctx, 0.65);
  const eye = [k.x - 0.35, k.y + 1.66, k.z + 0.05];
  const d = { x: -3.85, z: 1.6 }; d.y = H(d.x, d.z);
  ctx.place('copy', [d.x, d.y, d.z], { yaw: Math.atan2(eye[0] - d.x, eye[2] - d.z) + 0.12 });
  K.filmPose(copy, 'stand', 0, { armR: [-0.3, 0, -2.7], foreR: 0 });      // the arm straight up-frame, over his shoulder: the cliff is behind him
  // one flash; afterwards a low cloud glow keeps his outline while the voice speaks
  const t0 = ctx.time('flash11');
  const glow = ((v ? 0.62 : 0.36) + 0.05 * Math.sin(t * 2.3)) * sstep(t0 + 0.35, t0 + 0.75, t) + 0.07 * K.flicker(t, 2, 0.9);
  const f1 = K.flashEnv(t - t0, { seed: 5 });
  const f2 = v ? K.flashEnv(t - (ctx.time('b11.w4') + 0.06), { seed: 8, power: 0.75, hold: 0.25, decay: 0.3 }) : 0;
  const fd = Math.max(f1, f2), f = Math.max(fd, glow);
  K.applyFlash(ctx, f, { bolt: f1 > 0.12 ? 0 : null, dir: [-0.62, 0.36, -0.7], light: f > 0 ? Math.max(fd, 0.3 * glow) / f : 0, rig: 0 });      // (the glow also lies on the wet sand and the foam behind him: he stays a cut-out to the cut)
  ctx.scene.environmentIntensity = 0.06;                  // nothing from the lens side: face and chest stay black
  // the rim that finds the rag on the raised hand
  copy.root.updateWorldMatrix(true, true);
  const hand = copy.joints.handR.getWorldPosition(_hp);
  const r = lamp(ctx, 'rim', '#dfe9ff', 4, 2); r.position.set(hand.x - 0.9, hand.y + 0.5, hand.z - 0.9); r.intensity = 14 * (fd + 0.5 * glow);
  // and a breath of fill from the lens side, on the hand only, so the cloth reads white
  const rf = lamp(ctx, 'ragFill', '#dfe9ff', 0.7, 2); rf.position.set(hand.x + 0.22, hand.y + 0.12, hand.z - 0.42); rf.intensity = 1.2 * (fd + 0.6 * glow);
  if (!v) ctx.cam.set({ pos: eye, look: [d.x - 0.2, d.y + 1.22, d.z - 0.36], fov: 46 });
  else {
    // head and raised hand together: whose hand it is, and which hand
    const u = smooth(lt / 1.4), hd = headCentre(copy);
    const hr = lamp(ctx, 'headRim', '#dfe9ff', 3, 2); hr.position.set(hd[0] - 0.9, hd[1] + 0.7, hd[2] + 0.9); hr.intensity = 9 * (fd + 0.6 * glow);
    ctx.cam.set({ pos: eye, look: [lerp(hd[0], hand.x, 0.62), lerp(hd[1], hand.y, 0.5) - 0.06, lerp(hd[2], hand.z, 0.62)], fov: lerp(36, 34, u) });
  }
  ctx.cam.shake(v ? 0.03 : 0.04, t, 27);
}
