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
 *   51.50  b15   high side wide, three flashes: he is cut off from the trees and herded to the cave
 *
 * Rules kept: every per-frame state is recomputed in update() from time alone (no leaks between shots); set options
 * only through `options`; per-shot objects through ctx.add; no Math.random.
 */
import * as THREE from 'three';
import * as K from './kit.js';

const PI = Math.PI;
const { clamp, lerp, smooth } = K;
const A = (ctx, n) => ctx.set.anchors[n];
const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const sstep = (a, b, x) => smooth(clamp((x - a) / (b - a), 0, 1));
const fireFl = (t) => 0.78 + 0.12 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1) + 0.1 * Math.sin(t * 17.3 + 2) * Math.sin(t * 2.1);

/**
 * Campfire level for THIS frame (call in update; the shot declares `options: { fire: 1 }`). Everything touched here is
 * re-set by the set's own update every frame, so nothing leaks into other shots.
 *   L 0..1 flame/light level · o.ash (ember-bed glow ×) · o.smoke (opacity) · o.h (flame height ×)
 */
function fireLevel(ctx, L, o = {}) {
  const w = ctx.set.world; if (!w) return;
  L = clamp(L, 0, 1);
  w.fire.light.intensity *= L; if (w.fireFill) w.fireFill.intensity *= L;
  w.fire.flames.visible = L > 0.02; w.fire.flames.material.uniforms.uIntensity.value = 0.6 * L;
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
function fireKick(ctx, key, pos, I) {
  const l = lamp(ctx, key, '#ff8a3c', 7, 2); l.position.set(pos[0], pos[1], pos[2]); l.intensity = I * fireFl(ctx.t); return l;
}

// ───────────────────────────────────────────── the kid in frame A
const KID_YAW = -PI / 2 - 0.3;
function kidFrameA(ctx, p = {}) {
  K.filmPose(ctx.cast.me, 'stand', ctx.t, { breathe: p.breathe ?? 1.6, headYaw: p.headYaw ?? 0.45, headPitch: p.headPitch ?? 0, armR: p.armR, armL: p.armL, foreR: p.foreR, foreL: p.foreL });
  ctx.props.real.me.update(ctx.t);
}
function statue(ctx, anchor, yaw, p = {}) {
  ctx.place('copy', anchor, { yaw });
  K.filmPose(ctx.cast.copy, 'stand', 0, p);
}

// ───────────────────────────────────────────── spray (the shout shakes the rain off him)
function makeSpray(n = 150, seed = 41) {
  const r = K.rng(seed);
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.6, 0.66), transparent: true, opacity: 0.75, depthWrite: false });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false; mesh.name = 'spray';
  const d = [];
  for (let i = 0; i < n; i++) {
    const a = r() * PI * 2, up = 0.2 + r() * 1.0, sp = 1.6 + r() * 3.4;
    d.push({ o: [(r() - 0.5) * 0.5, 0.05 + r() * 0.5, (r() - 0.5) * 0.45], v: [Math.cos(a) * sp * 0.8, up * sp * 0.75, Math.sin(a) * sp * 0.8 + 1.2], delay: r() * 0.07, s: 0.006 + r() * 0.009 });
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  /** origin: world point (top of the head), q0: head yaw quaternion, tau: seconds since the shout */
  mesh.userData.update = (origin, q0, tau) => {
    for (let i = 0; i < n; i++) {
      const k = d[i], t = tau - k.delay;
      if (t <= 0 || t > 0.9) { m4.makeScale(0, 0, 0); mesh.setMatrixAt(i, m4); continue; }
      v.set(k.v[0], k.v[1] - 9.8 * t, k.v[2]);
      p.set(k.o[0] + k.v[0] * t, k.o[1] + k.v[1] * t - 4.9 * t * t, k.o[2] + k.v[2] * t).applyQuaternion(q0).add(origin);
      v.applyQuaternion(q0);
      const len = clamp(v.length() * 0.022, 0.012, 0.11), fade = clamp(1 - t / 0.9, 0, 1);
      q.setFromUnitVectors(up, v.normalize());
      s.set(k.s * fade, len, k.s * fade);
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
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.56, 0.62), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false; mesh.name = 'gust';
  const d = [];
  for (let i = 0; i < n; i++) d.push({ x: r(), y: r(), z: r(), sp: 0.8 + r() * 0.5, s: 0.003 + r() * 0.004, ph: r() });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
  /** centre: world point, wind: unit XZ direction [x, z], g: gust strength 0..1, t: time */
  mesh.userData.update = (centre, wind, g, t) => {
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
      const edge = Math.min(1, (BX / 2 - Math.abs(along)) / 0.8);
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
    name: 'a2 b08 frame A: 9 m, 7 m, 5 m', start: 'flash8a', set: 'beachNight', cast: ['me', 'copy'], options: { fire: 1 },
    setup(ctx) {
      ctx.place('me', 'kidA', { yaw: KID_YAW });
      ctx.cam.set(K.frameA(ctx.set));
    },
    update(ctx) {
      const t = ctx.t, T = (n) => ctx.time(n);
      fireLevel(ctx, 0.8);
      // he looks straight at the double; the head follows him in
      const where = t < T('flash8b') - 0.32 ? 'double9' : t < T('step8') ? 'double7' : 'double5';
      kidFrameA(ctx, { headYaw: where === 'double5' ? 0.36 : 0.44, breathe: 1.8 });
      statue(ctx, where, PI / 2);
      const f = K.flash(ctx, [{ at: 'flash8a', bolt: 1 }, { at: 'flash8b', power: 0.9, bolt: null }, { at: 'flash8c', bolt: 0 }]);
      ctx.cast.copy.root.visible = f > 0.004;            // he only exists in the light
      // the fire warms the kid's inland edge
      const k = A(ctx, 'kidA');
      fireKick(ctx, 'warm', [k.x - 1.4, k.y + 0.9, k.z + 2.6], 2.4);
      ctx.cam.shake(0.03, t, 5);
    },
    post: K.shotPost({ grade: { highlightAmt: 0.25 } }),
  },

  // ── b09 · "When I'm scared, I yell my word. To see if anything answers." ───────────────────────────────────────────
  {
    name: 'a2 b09 ECU: fire-lit face, fills his lungs', start: 'b09.w2-0.03', set: 'beachNight', cast: ['me'], options: { fire: 1, rain: 1.5, rainBack: 1.3 },
    setup(ctx) { ctx.place('me', 'kidA', { yaw: KID_YAW }); },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t, k = A(ctx, 'kidA');
      fireLevel(ctx, 0.75);
      const turn = sstep(ctx.time('b09.w7') - 0.25, ctx.time('b09.w7') + 0.5, t);          // "To see if anything answers": to the dark beach
      const fill = sstep(ctx.time('b09.w10'), ctx.time('b10') - 0.1, t);                      // lungs
      K.filmPose(me, 'stand', t, { breathe: 2.2, headYaw: lerp(0.62, 0.02, turn), headPitch: lerp(0.16, -0.05 - 0.12 * fill, turn) });
      K.joint(me, 'torso', -0.1 * fill, 0, 0);
      me.face(turn > 0.6 ? 'determined' : 'shocked', t);
      ctx.props.real.me.update(t);
      // camera: locked to the body, in front of the face, a little to the sea side; a slow creep in
      const fw = [Math.sin(KID_YAW), Math.cos(KID_YAW)], sd = [-fw[1], fw[0]];              // sd = toward the sea
      const eyeY = k.y + 1.66, u = smooth(lt / 3.2), d = lerp(2.45, 2.2, u);
      const pos = [k.x + fw[0] * d + sd[0] * 0.5, eyeY - 0.08, k.z + fw[1] * d + sd[1] * 0.5];
      ctx.cam.set({ pos, look: [k.x + fw[0] * 0.25, eyeY - 0.2, k.z + fw[1] * 0.25], fov: 21 });
      ctx.store.focus = d - 0.25;
      // the low fire on his inland cheek (practical) + a thin cold edge from the sea side
      fireKick(ctx, 'fire', [k.x + fw[0] * 1.1 - sd[0] * 1.5, k.y + 1.05, k.z + fw[1] * 1.1 - sd[1] * 1.5], 4.2);
      const c = lamp(ctx, 'cold', '#9db8d8', 5, 2); c.position.set(k.x - fw[0] * 0.7 + sd[0] * 1.3, eyeY + 0.5, k.z - fw[1] * 0.7 + sd[1] * 1.3); c.intensity = 1.2;
      K.applyFlash(ctx, 0.05 * K.flicker(t, 4, 1.7));
      ctx.cam.shake(0.035, t, 9);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 2.2, aperture: 1.5, maxBlur: 18 }, grade: { highlightAmt: 0.5, saturation: 0.42 } })),
  },

  // ── b10 · "HUSS!" ──────────────────────────────────────────────────────────────────────────────────────────────────
  {
    name: 'a2 b10a low front close-up: the shout', start: 'b10-0.09', set: 'beachNight', cast: ['me'], options: { fire: 1, rain: 1.7, rainBack: 1.6 },
    setup(ctx) {
      ctx.place('me', 'kidA', { yaw: KID_YAW });
      ctx.store.spray = ctx.add(makeSpray());
    },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t, k = A(ctx, 'kidA'), tau = t - ctx.time('b10');
      fireLevel(ctx, 0.75);
      const hit = clamp(tau / 0.06, 0, 1), rel = Math.exp(-Math.max(0, tau) / 0.35);
      const jolt = hit * rel;
      K.filmPose(me, 'stand', t, { breathe: 0, headYaw: 0.02, headPitch: lerp(-0.18, 0.1, hit) - 0.05 * Math.sin(tau * 60) * rel * hit,
        armR: [0.35 * hit, 0, -0.32 - 0.25 * jolt], armL: [0.35 * hit, 0, 0.32 + 0.25 * jolt], foreR: -0.5 * hit, foreL: -0.5 * hit });
      K.joint(me, 'torso', lerp(-0.12, 0.2, hit), 0, 0);
      me.face(tau > -0.02 ? 'huss' : 'determined', t);
      ctx.props.real.me.update(t);
      const fw = [Math.sin(KID_YAW), Math.cos(KID_YAW)], sd = [-fw[1], fw[0]];
      const pos = [k.x + fw[0] * 1.55 + sd[0] * 0.25, k.y + 0.98, k.z + fw[1] * 1.55 + sd[1] * 0.25];
      ctx.cam.set({ pos, look: [k.x + fw[0] * 0.1, k.y + 1.52, k.z + fw[1] * 0.1], fov: 50 });
      ctx.cam.punch([ctx.time('b10')], t, 0.1, 0.22);
      ctx.cam.shake(0.05 + 0.5 * jolt, t, 11, 2.2);
      // spray off his hair and shoulders
      me.root.updateWorldMatrix(true, true);
      const hp = me.joints.head.getWorldPosition(new THREE.Vector3()); hp.y += 0.2;
      ctx.store.spray.userData.update(hp, me.root.quaternion, tau);
      fireKick(ctx, 'fire', [k.x + fw[0] * 1.2 - sd[0] * 1.6, k.y + 0.7, k.z + fw[1] * 1.2 - sd[1] * 1.6], 5.5);
      const c = lamp(ctx, 'cold', '#a9c2e2', 6, 2); c.position.set(k.x - fw[0] * 1.0 + sd[0] * 1.2, k.y + 2.6, k.z - fw[1] * 1.0 + sd[1] * 1.2); c.intensity = 3.2;
    },
    post: K.shotPost({ dof: { focus: 1.5, aperture: 0.6, maxBlur: 10 }, grade: { highlightAmt: 0.5, saturation: 0.42 } }),
  },
  {
    name: 'a2 b10b frame A: nobody. Hold', start: 'b10+0.51', set: 'beachNight', cast: ['me'], options: { fire: 1 }, captions: false,
    setup(ctx) {
      ctx.place('me', 'kidA', { yaw: KID_YAW });
      ctx.cam.set(K.frameA(ctx.set));
    },
    update(ctx, lt) {
      fireLevel(ctx, 0.72);
      // he listens: breathing hard, the head searches the foam line
      kidFrameA(ctx, { headYaw: 0.4 - 0.14 * sstep(0.5, 1.3, lt), breathe: 2.6 });
      const k = A(ctx, 'kidA');
      fireKick(ctx, 'warm', [k.x - 1.4, k.y + 0.9, k.z + 2.6], 2.4);
      ctx.cam.shake(0.03, ctx.t, 5);
    },
    post: K.shotPost({ grade: { highlightAmt: 0.25 } }),
  },

  // ── b11 · COPY: "The cave is safe. Go in." ─────────────────────────────────────────────────────────────────────────
  {
    name: 'a2 b11a flash: the double at 4 m, pointing', start: 'flash11', set: 'beachNight', cast: ['copy'], options: { fire: 1 },
    setup(ctx) {},
    update(ctx, lt) { b11(ctx, lt, 0); },
    post: K.shotPost((ctx) => ({ fog: { density: 0.007 } })),
  },
  {
    name: 'a2 b11b punch-in: the rag on the wrong hand', start: 'b11.w4-0.1', set: 'beachNight', cast: ['copy'], options: { fire: 1 },
    setup(ctx) {},
    update(ctx, lt) { b11(ctx, lt, 1); },
    post: K.shotPost((ctx) => ({ fog: { density: 0.007 } })),
  },

  // ── b12 · "My voice. But I'd never say that. Mom's rule. No sea caves in a storm." ─────────────────────────────────
  {
    name: 'a2 b12a wide from the waterline: the cave', start: 'b12', set: 'beachNight', cast: ['me'], options: { fire: 1 },
    setup(ctx) { ctx.place('me', 'camp', { yaw: ctx.set.campYaw }); },
    update(ctx, lt) {
      const t = ctx.t;
      fireLevel(ctx, 0.6);
      K.filmPose(ctx.cast.me, 'huddle', t, { curl: 1, shiver: 0.5, headYaw: -0.9 });
      const c = A(ctx, 'wideCam'), u = lt / 2.5;
      ctx.cam.set({ pos: [c.x - 2.2 * u, c.y, c.z], look: [-58, 5.5, 1.2], fov: 48 });
      // soft sheet lightning far behind the headland: the cliff stands out against the glow
      K.applyFlash(ctx, 0.16 + 0.3 * K.flicker(t, 6, 1.5), { dir: [-1, 0.25, 0.1], light: 0.5, post: 0.3 });
      ctx.cam.shake(0.025, t, 13);
    },
    post: K.shotPost({ fog: { density: 0.0055 } }),
  },
  {
    name: 'a2 b12b the kid under the hull: Mom\'s rule', start: 'b12.w7-0.06', set: 'beachNight', cast: ['me'], options: { fire: 1, rain: 1.3 },
    setup(ctx) { ctx.place('me', 'camp', { yaw: ctx.set.campYaw }); },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t, k = A(ctx, 'camp'), f = A(ctx, 'fire');
      fireLevel(ctx, 0.55 - 0.1 * sstep(1.5, 2.9, lt));
      // he was looking toward the cave; on the rule he looks back down into the fire and shakes his head
      const back = sstep(0.5, 1.3, lt), no = Math.sin((lt - 1.4) * 7.5) * 0.12 * sstep(1.4, 1.6, lt) * (1 - sstep(2.3, 2.8, lt));
      K.filmPose(me, 'huddle', t, { curl: 1, shiver: 0.7, headYaw: lerp(-0.75, 0.0, back) + no, headPitch: lerp(-0.05, 0.2, back) });
      me.face('sad', t);
      ctx.props.real.me.update(t);
      const yaw = ctx.set.campYaw, fw = [Math.sin(yaw), Math.cos(yaw)], sd = [fw[1], -fw[0]];
      const u = smooth(lt / 3), d = lerp(2.75, 2.5, u);
      ctx.cam.set({ pos: [k.x + fw[0] * d + sd[0] * 0.75, k.y + 0.92, k.z + fw[1] * d + sd[1] * 0.75], look: [k.x + fw[0] * 0.25, k.y + 0.78, k.z + fw[1] * 0.25], fov: 30 });
      ctx.store.focus = d - 0.2;
      void f;
      ctx.cam.shake(0.03, t, 15);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 2.6, aperture: 1.3, maxBlur: 16 }, bloom: { threshold: 1.5, strength: 0.12 }, grade: { highlightAmt: 0.5, saturation: 0.42 } })),
  },

  // ── b13 · "Then the rain kills my fire." ───────────────────────────────────────────────────────────────────────────
  {
    name: 'a2 b13 close on the fire: it dies', start: 'b13-0.05', set: 'beachNight', cast: ['me'], options: { fire: 1, rain: 1.4 },
    setup(ctx) {
      ctx.place('me', 'camp', { yaw: ctx.set.campYaw });
      ctx.store.gust = ctx.add(makeGust());
      ctx.store.gust.layers.set(10);
    },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t, f = A(ctx, 'fire'), k = A(ctx, 'camp');
      const die = ctx.time('firedie');
      // gust: arrives on "rain", peaks on "kills", is gone half a second later
      const g = sstep(die - 0.45, die - 0.05, t) * (1 - sstep(die + 0.25, die + 0.8, t));
      const L = 0.5 * (1 - 0.75 * sstep(die - 0.3, die + 0.05, t)) * (1 - sstep(die + 0.05, die + 0.55, t)) * (0.8 + 0.2 * Math.sin(t * 31) * Math.sin(t * 13));
      fireLevel(ctx, L, { smoke: lerp(0.3, 0.75, sstep(die - 0.1, die + 0.6, t)), ash: 1 + 1.6 * sstep(die, die + 0.3, t) * (1 - 0.7 * sstep(die + 0.5, die + 1.3, t)), w: 1 + 0.5 * g });
      ctx.set.rain.uniforms.uOpacity.value *= 1 + 1.6 * g;
      ctx.store.gust.userData.update(f, [-0.95, 0.31], g, t);
      K.filmPose(me, 'huddle', t, { curl: 1, shiver: 0.7, headPitch: 0.2 });
      me.face('sad', t);
      ctx.props.real.me.update(t);
      const yaw = ctx.set.campYaw, fw = [Math.sin(yaw), Math.cos(yaw)], sd = [fw[1], -fw[0]];
      const u = smooth(lt / 2);
      ctx.cam.set({ pos: [f.x + fw[0] * 1.55 + sd[0] * 0.5, f.y + lerp(0.5, 0.42, u), f.z + fw[1] * 1.55 + sd[1] * 0.5], look: [f.x, f.y + 0.2, f.z], fov: 38 });
      void k;
      ctx.cam.shake(0.03 + 0.08 * g, t, 17);
    },
    post: K.shotPost({ dof: { focus: 1.6, aperture: 0.35, maxBlur: 10 }, bloom: { threshold: 1.5, strength: 0.12 }, grade: { highlightAmt: 0.5, saturation: 0.42 } }),
  },

  // ── b14 · "Lightning again... and he's standing in the ashes." ─────────────────────────────────────────────────────
  {
    name: 'a2 b14a ember dark: his face', start: 'b14-0.3', set: 'beachNight', cast: ['me'], options: { fire: 0, rain: 1.3 },
    setup(ctx) { ctx.place('me', 'camp', { yaw: ctx.set.campYaw }); },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t, k = A(ctx, 'camp'), f = A(ctx, 'fire');
      fireLevel(ctx, 0, { ash: 3.2 - 1.2 * smooth(lt / 1.8), smoke: 0.6 });
      const fl = K.flicker(t, 9, 1.3);
      const up = sstep(0.55, 0.95, lt);
      K.filmPose(me, 'huddle', t, { curl: 1, shiver: 0.8, headPitch: lerp(0.22, -0.2, up), headYaw: lerp(0, -0.35, up) });
      me.face('shocked', t);
      ctx.props.real.me.update(t);
      const yaw = ctx.set.campYaw, fw = [Math.sin(yaw), Math.cos(yaw)], sd = [fw[1], -fw[0]];
      ctx.cam.set({ pos: [f.x + fw[0] * 0.75 - sd[0] * 0.35, f.y + 0.3, f.z + fw[1] * 0.75 - sd[1] * 0.35], look: [k.x, k.y + 0.8, k.z], fov: 34 });
      ctx.store.focus = 2.6;
      // the last embers under his chin
      const e = lamp(ctx, 'ember', '#ff4a12', 5, 2); e.position.set(f.x - fw[0] * 0.3, f.y + 0.2, f.z - fw[1] * 0.3); e.intensity = (1.5 - 0.6 * smooth(lt / 1.8)) * (0.85 + 0.15 * Math.sin(t * 5.1));
      K.applyFlash(ctx, 0.2 * fl, { post: 0.2 });
      ctx.cam.shake(0.03, t, 19);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 2.6, aperture: 1.0, maxBlur: 14 }, grade: { highlightAmt: 0.4, saturation: 0.4 } })),
  },
  {
    name: 'a2 b14b flash: sneakers in the ashes', start: 'flash14', set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0 },
    setup(ctx) {
      ctx.place('me', 'camp', { yaw: ctx.set.campYaw });
      const f = A(ctx, 'fire'), k = A(ctx, 'camp');
      ctx.place('copy', [f.x + 0.02, f.y, f.z - 0.05], { yaw: yawTo(f, k) });
      // fresh prints: up out of the surf and straight into the pit
      ctx.add(K.makeFootprints(K.printTrail([-4.1, 0.1], [f.x + 0.15, f.z - 0.85], { stride: 0.6, gauge: 0.2 }), { heightAt: ctx.set.heightAt, size: 0.31, opacity: 0.95 }));
    },
    update(ctx, lt) {
      const me = ctx.cast.me, t = ctx.t, f = A(ctx, 'fire');
      fireLevel(ctx, 0, { ash: 2.0, smoke: 0.7 });
      K.filmPose(ctx.cast.copy, 'stand', 0);
      K.filmPose(me, 'huddle', t, { curl: 0.6, shiver: 1, headPitch: -0.3 });
      me.face('shocked', t);
      const fl = K.flash(ctx, [{ at: 'flash14', bolt: null }], { dir: [-0.35, 0.4, -0.85] });
      // camera at sand level on the inland side: pit in the foreground, prints running back to the surf
      ctx.cam.set({ pos: [f.x + 0.75, f.y + 0.2, f.z + 1.75], look: [f.x - 0.1, f.y + 0.3, f.z - 0.4], fov: 46 });
      const e = lamp(ctx, 'ember', '#ff4a12', 3, 2); e.position.set(f.x + 0.3, f.y + 0.12, f.z + 0.35); e.intensity = 0.7 * (0.85 + 0.15 * Math.sin(t * 5.1));
      void fl; void lt;
      ctx.cam.shake(0.03, t, 21);
    },
    post: K.shotPost({ dof: { focus: 1.9, aperture: 0.4, maxBlur: 10 } }),
  },

  // ── b15 · "Every flash, he cuts me off. The only place left... is the cave." ───────────────────────────────────────
  {
    name: 'a2 b15 high side wide: herded to the cave', start: 'flash15a', set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0 },
    setup(ctx) {},
    update(ctx, lt) {
      const t = ctx.t, T = (n) => ctx.time(n), me = ctx.cast.me, copy = ctx.cast.copy;
      const st = t < T('flash15b') - 0.6 ? 0 : t < T('flash15c') - 0.6 ? 1 : 2;
      fireLevel(ctx, 0, { ash: 1.5, smoke: 0.5 });
      const kid = A(ctx, ['mid1', 'mid2', 'cave'][st]), dbl = A(ctx, ['cut1', 'cut2', 'cut3'][st]);
      // frozen stills
      if (st === 0) {            // backing away from him
        ctx.place('me', kid, { yaw: yawTo(kid, dbl) + 0.25 });
        K.filmPose(me, 'stand', 0, { armR: [-0.7, 0, -0.5], armL: [-0.9, 0, 0.45], foreR: -0.9, foreL: -0.7 });
        K.joint(me, 'torso', -0.2, 0, 0); K.joint(me, 'legL', 0.35, 0, 0.05); K.joint(me, 'legR', -0.2, 0, -0.05);
      } else if (st === 1) {     // running for the only way left, looking back
        ctx.place('me', kid, { yaw: -PI / 2 - 0.08 });
        me.pose('walk', 0.21, { speed: 1.5, headYaw: 1.2 });
        K.joint(me, 'torso', 0.3, 0, 0);
      } else {                   // a small silhouette in the mouth
        ctx.place('me', kid, { yaw: PI / 2 - 0.5 });
        K.filmPose(me, 'stand', 0, { headYaw: 0.4 });
      }
      ctx.place('copy', dbl, { yaw: yawTo(dbl, kid) });
      K.filmPose(copy, 'stand', 0);
      const f = K.flash(ctx, [{ at: 'flash15a', bolt: 0 }, { at: 'flash15b', power: 0.92, bolt: 3 }, { at: 'flash15c', bolt: 1 }]);
      me.root.visible = copy.root.visible = f > 0.004;
      const c = A(ctx, 'highCam');
      const look = [[-52, 1.5, 4.0], [-52, 1.5, 4.0], [-52, 1.5, 4.0]][st], fov = [48, 48, 48][st];
      ctx.cam.set({ pos: c, look, fov });
      ctx.cam.shake(0.025, t, 23);
    },
    post: K.shotPost({ fog: { density: 0.006 } }),
  },
];

// the double from the kid's eye-line: 4 m away, off the foam line, one arm raised toward the cliff. v 0 = wide, 1 = punch-in
function b11(ctx, lt, v) {
  const t = ctx.t, copy = ctx.cast.copy, k = A(ctx, 'kidA'), d = A(ctx, 'double4');
  fireLevel(ctx, 0.65);
  const eye = [k.x - 0.35, k.y + 1.66, k.z + 0.05];
  ctx.place('copy', d, { yaw: Math.atan2(eye[0] - d.x, eye[2] - d.z) });
  K.filmPose(copy, 'stand', 0, { armR: [0.35, 0, -1.9], foreR: 0 });
  // one flash; afterwards a low cloud glow keeps his outline while the voice speaks
  const t0 = ctx.time('flash11');
  const glow = 0.1 * sstep(t0 + 0.4, t0 + 0.8, t) + 0.05 * K.flicker(t, 2, 0.9);
  const f1 = K.flashEnv(t - t0, { seed: 5 });
  const f2 = v ? K.flashEnv(t - (ctx.time('b11.w4') + 0.04), { seed: 8, power: 0.34, hold: 0.22, decay: 0.3 }) : 0;
  const f = Math.max(f1, f2, glow);
  K.applyFlash(ctx, f, { bolt: f1 > 0.12 ? 0 : null, dir: [-0.62, 0.36, -0.7] });
  if (!v) ctx.cam.set({ pos: eye, look: [d.x, d.y + 1.3, d.z], fov: 46 });
  else {
    const u = smooth(lt / 1.4);
    ctx.cam.set({ pos: eye, look: [d.x + 0.05, d.y + 1.72, d.z - 0.3], fov: lerp(21, 19.5, u) });
  }
  ctx.cam.shake(v ? 0.045 : 0.04, t, 27);
}
