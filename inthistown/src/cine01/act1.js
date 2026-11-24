/*
 * act1.js — "The Other Me", ACT 1: night beach. The hook, the wreck, Mom's voicemail, the knight, the fire.
 * Beats b01–b07, 0 → flash8a (27.79 s). Eight shots:
 *
 *   1  b01–b02  0.00 → 6.44   FRAME A, locked: flash on frame 0 (double at 18 m), soft sheet flicker on "another me",
 *                              flash on "closer" (double at 12 m). The double only exists while the sky is lit.
 *   2  b03      6.44 → 8.72   dusk, steep high angle sinking 1 m: the kid face-down in the wash among the wreckage,
 *                              pushes up on his elbows (rag on the RIGHT hand); top edge: two sneakers in the foam.
 *   3  b04 a    8.72 → 11.72  phone macro (POV): the map, the dot in empty blue, the dotted island. Held sharp.
 *   4  b04 b   11.72 → 15.05  he lifts the phone for signal: over the screen, rack focus on "scientists" to the foam
 *                              line where the double stands; one soft cloud flicker on "ocean".
 *   5  b05     15.05 → 19.90  reverse medium close-up, lit from below by the phone; the double soft over his shoulder,
 *                              listening while Mom's voicemail plays.
 *   6  b06     19.90 → 24.08  REFERENCE macro of the knight (K.emblemFrame): the rag hand wipes the rain off it once.
 *   7  b07 a   24.08 → 26.48  the fire catches under the wreck: low behind the flames, the kid hugging his knees.
 *   8  b07 b   26.48 → 27.79  "And I wait." His sneakers, one step of bare sand, then square prints leading back to the surf.
 *
 * Determinism: all per-shot objects go through ctx.add; uniform / light pokes are done in update() every frame and only
 * on values the set rewrites each frame (foam uAmbient / uWash, rain uOpacity, fire levels) or on objects this file owns.
 */
import * as THREE from 'three';
import * as K from './kit.js';
import { makeRain } from '../real/weather.js';
import { groundBlob } from './sets.js';

const PI = Math.PI, DEG = PI / 180;
const A = (ctx, n) => ctx.set.anchors[n];
const real = (ctx) => ctx.props.real;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const { clamp, lerp, smooth } = K;
const ramp = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
const sramp = (x, a, b) => smooth(ramp(x, a, b));

// ═════════════════════════════════════════════ act props (built once) ═════════════════════════════════════════════
export async function init(ctx) {
  // rain for the macro shots: the beach rain is ~0.5 streak / m³, so nothing ever crosses a 0.3 m wide macro frame
  ctx.props.a1rain = makeRain({ count: 1100, box: [2.6, 3.2, 3.6], speed: 8.5, wind: [-1.4, 0.5], length: 0.075, width: 0.0024, opacity: 0.0,
    lightDir: [-0.75, 0.3, -0.5], backlight: 2.2, near: 0.22, far: 3.4, seed: 57 });
  // a second sheet of shore foam for the wake-up shot (its own wash line, so the sneakers always stand in foam)
  const foam = ctx.getSet('beachDusk').foam, m = foam.mesh.material, u = foam.uniforms;
  const uniforms = { ...u, uWash: { value: 0 }, uAmbient: { value: 0.3 } };
  const mesh = new THREE.Mesh(foam.mesh.geometry, new THREE.ShaderMaterial({ vertexShader: m.vertexShader, fragmentShader: m.fragmentShader, uniforms,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  mesh.renderOrder = 6; mesh.frustumCulled = false; mesh.name = 'a1foam2';
  ctx.props.a1foam = { mesh, uniforms };
}

// ═════════════════════════════════════════════ helpers ════════════════════════════════════════════════════════════
/** soft far-off sheet lightning at t0 (a cloud flicker, never a full flash) */
const sheet = (ctx, t0, power = 0.2, seed = 5) => K.flashEnv(ctx.t - ctx.time(t0), { power, hold: 0.24, decay: 0.34, seed, floor: 0.3 });
/** macro rain on (call in update; the mesh is ctx.add-ed in setup) */
function macroRain(ctx, opacity = 0.5) { ctx.props.a1rain.uniforms.uOpacity.value = opacity; }
const _h = V(), _g = V();
function handWorld(ch, side, out = V()) { const h = ch.joints['hand' + side]; h.updateWorldMatrix(true, false); return h.getWorldPosition(out); }
/**
 * Two-bone reach: put the centre of a hand on a world point (pattern search on shoulder x/y/z + elbow x, pulled toward
 * a rest guess so the redundant swivel stays smooth from frame to frame). Deterministic: fixed iteration count.
 */
function reach(ch, side, target, guess = [-1.0, 0.0, 0.2, -1.6], iters = 26) {
  const p = guess.slice();
  const lo = [-3.0, -1.6, -1.6, -2.6], hi = [0.6, 1.6, 1.6, 0];
  const err = () => {
    K.joint(ch, 'arm' + side, p[0], p[1], p[2]); K.joint(ch, 'foreArm' + side, p[3], 0, 0);
    let e = handWorld(ch, side, _h).distanceToSquared(target);
    for (let i = 0; i < 4; i++) e += 0.0012 * (p[i] - guess[i]) * (p[i] - guess[i]);
    return e;
  };
  let e = err(), step = 0.35;
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < 4; i++) {
      for (const s of [1, -1]) {
        const old = p[i]; p[i] = clamp(old + s * step, lo[i], hi[i]);
        const e2 = err();
        if (e2 < e) { e = e2; break; }
        p[i] = old;
      }
    }
    step *= 0.72;
  }
  err();
  return p;
}
/** scale the campfire relative to the shot's `fire` option (the set rewrites every one of these each frame) */
function fireScale(ctx, k, flame = 1) {
  const w = ctx.set.world, f = w.fire;
  f.light.intensity *= k; if (w.fireFill) w.fireFill.intensity *= k;
  f.flames.material.uniforms.uIntensity.value *= flame * clamp(0.6 + 0.4 * k, 0, 1.25);   // a small flame is still a bright flame
  f.flames.scale.set(1, 0.35 + 0.65 * clamp(k, 0, 1.2), 1);
  w.foam.uniforms.uFireCol.value.multiplyScalar(k);
  if (w.fireAsh) w.fireAsh.material.emissiveIntensity *= clamp(k, 0, 1);
  if (f.embers) f.embers.visible = k > 0.45;
  // the fire's reach on the sand (the kit's point light sits in the flames and grazes the ground): a soft warm pool
  const b = ctx.store.bounce;
  if (b) b.intensity = (ctx.store.bounceK ?? 8) * k * (0.9 + 0.1 * Math.sin(ctx.t * 11.3) * Math.sin(ctx.t * 4.7));
}
function fireBounce(ctx) {
  const f = A(ctx, 'fire');
  const b = ctx.store.bounce = ctx.add(new THREE.PointLight('#ff9a58', 0, 7.5, 2)); b.position.set(f.x + 0.35, f.y + 1.7, f.z - 0.5);
}
/**
 * The trail of square sneaker prints: up out of the surf, aimed at the kid, stopping one step short of his toes.
 * Call in setup AFTER placing the kid at the camp. Returns { mesh, toes [x, z], u [x, z] (unit, toes → surf), gap }.
 */
function campPrints(ctx, gap = 0.72, stride = 0.62) {
  const me = ctx.cast.me, H = ctx.set.heightAt;
  K.filmPose(me, 'huddle', 0, {});
  me.root.updateWorldMatrix(true, true);
  const fl = me.joints.footL.getWorldPosition(V()), fr = me.joints.footR.getWorldPosition(V());
  const cy = ctx.set.campYaw, toes = [(fl.x + fr.x) / 2 + Math.sin(cy) * 0.14, (fl.z + fr.z) / 2 + Math.cos(cy) * 0.14];
  const S = [-3.0, 0.3], L = Math.hypot(S[0] - toes[0], S[1] - toes[1]), u = [(S[0] - toes[0]) / L, (S[1] - toes[1]) / L];
  const yaw = Math.atan2(-u[0], -u[1]), px = Math.cos(yaw), pz = -Math.sin(yaw), pts = [];
  for (let i = 0; gap + i * stride < L; i++) {
    const d = gap + i * stride, sd = i % 2 ? 1 : -1;
    pts.push([toes[0] + u[0] * d + px * sd * 0.1, toes[1] + u[1] * d + pz * sd * 0.1, yaw, sd]);
  }
  const mesh = ctx.add(K.makeFootprints(pts, { heightAt: H, size: 0.34, opacity: 0.96 }));
  mesh.material.roughness = 0.3; mesh.material.clearcoatRoughness = 0.25;
  return (ctx.store.trail = { mesh, toes, u, gap });
}

// ═════════════════════════════════════════════ shots ══════════════════════════════════════════════════════════════
export const shots = [
  // ─────────────────────────────────────────── 1 · b01–b02 · FRAME A ───────────────────────────────────────────────
  {
    name: 'a1.1 frame A: another me / closer (b01-b02)', start: 0, set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0 },
    setup(ctx) {
      const k = A(ctx, 'kidA');
      ctx.place('me', [k.x, k.y, k.z + KID_DZ], { yaw: -PI / 2 - 0.3 });    // a hand's width inland: the rag hand stays in frame
      ctx.cam.set(K.frameA(ctx.set));
      // his own rim: the sky over the sea catching the top of the hood, the headphones, the right shoulder and the rag
      const rim = ctx.store.rim = ctx.add(new THREE.PointLight('#dfe9ff', 0, 6, 2)); rim.position.set(k.x - 0.3, k.y + 3.0, k.z - 2.1);
      const edge = ctx.store.edge = ctx.add(new THREE.PointLight('#dfe9ff', 0, 5, 2)); edge.position.set(k.x - 1.6, k.y + 2.2, k.z + 1.7);
      const rag = ctx.store.ragL = ctx.add(new THREE.PointLight('#dfe9ff', 0, 1.7, 2)); rag.position.set(k.x + 0.55, k.y + 0.5, k.z - 1.05);   // low, lens side: the white cloth on his right hand
      groundBlob(ctx, [k.x, k.y, k.z + KID_DZ], 0.7, 0.5);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, copy = ctx.cast.copy;
      K.filmPose(me, 'stand', t, { breathe: 1, headYaw: 0.38, armR: [0.06, 0, 0.04], foreR: -0.2 });
      real(ctx).me.update(t);
      const f = K.flash(ctx, [{ at: 'flash1', bolt: 0 }, { at: 'b01.w6-0.05', power: 0.32, hold: 0.22, decay: 0.3, bolt: null, seed: 9 }, { at: 'flash2', bolt: 1 }], {});
      // the double: 18 m, then 12 m. He only exists while the sky is lit; he moves in the dark.
      if (t < ctx.time('b02')) ctx.place('copy', 'double18', { yaw: PI / 2 });
      else ctx.place('copy', [-12, ctx.set.heightAt(-12, 1.25), 1.25], { yaw: PI / 2 });   // on the lip of the wash, clear of the kid's head
      K.filmPose(copy, 'stand', 0);
      copy.root.visible = f > 0.035;
      ctx.store.rim.intensity = 0.45 + 19 * f;
      ctx.store.edge.intensity = 0.15 + 6 * f;
      ctx.store.ragL.intensity = 0.2 + 1.3 * f;
      K.stamp(ctx, '3:12 AM', { at: 'tl', alpha: 1 - ramp(lt, 2.9, 3.4) });
      ctx.cam.shake(0.03, t, 3);
    },
    post: K.shotPost({}),
  },

  // ─────────────────────────────────────────── 2 · b03 · washed up, 9:40 PM ────────────────────────────────────────
  {
    name: 'a1.2 washed up, sneakers in the foam (b03)', start: 'b03-0.6', set: 'beachDusk', cast: ['me', 'copy'], options: { fire: -1, rain: 1.2 },
    setup(ctx) {
      const H = ctx.set.heightAt;
      const kx = 7.6, kz = 2.85, dx = 8.05, dz = 0.2;
      ctx.place('me', [kx, H(kx, kz), kz], { yaw: 0.14 });            // prone: head inland (toward the lens), feet to the sea
      ctx.place('copy', [dx, H(dx, dz), dz], { yaw: -0.1 });          // behind him, in the foam, facing him
      ctx.store.knee = V(dx - 0.2, H(dx, dz) + 0.62, dz);             // the top edge of frame cuts the legs here
      ctx.add(ctx.props.a1foam.mesh);
      const l = ctx.add(new THREE.PointLight('#cfe0f5', 3.0, 10, 2)); l.position.set(kx + 1.6, H(kx, kz) + 3.6, kz - 1.2);   // dusk sky off the sea
      const l2 = ctx.add(new THREE.PointLight('#cfe0f5', 4.2, 4, 2)); l2.position.set(dx - 0.4, H(dx, dz) + 1.1, dz + 1.3);   // the grey of his trousers
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      const up = sramp(lt, 0.7, 1.75);
      K.filmPose(me, 'prone', t, { up, headPitch: lerp(0.1, -0.45, sramp(lt, 0.85, 2.0)), headYaw: lerp(-0.7, -0.1, sramp(lt, 0.6, 1.6)) });   // cheek in the sand, toward the rag hand
      // the rag arm thrown wide, so the white cloth is never under his head
      K.joint(me, 'armR', lerp(-2.55, -1.55, up), 0, lerp(-1.0, -0.8, up)); K.joint(me, 'foreArmR', lerp(-0.45, -0.95, up), 0, 0);
      K.filmPose(ctx.cast.copy, 'stand', 0);
      real(ctx).me.update(t);
      // the wash: a sheet runs up around him and drains away; a second sheet keeps the sneakers in foam
      const edge = lerp(lerp(2.6, 3.8, sramp(lt, 0, 0.7)), 1.5, sramp(lt, 0.8, 2.3));
      ctx.set.foam.uniforms.uWash.value = edge - ctx.set.washEdge(8, t);
      const f2 = ctx.props.a1foam.uniforms;
      f2.uWash.value = 1.25 + 0.25 * Math.sin(lt * 1.3) - ctx.set.washEdge(8, t); ctx.set.foam.uniforms.uAmbient.value = 0.15; f2.uAmbient.value = 0.15;
      ctx.set.moon.key.intensity = 1.35;                                   // blue-black dusk: the back of his head must not be the whitest thing in frame
      // steep high angle, sinking 1 m along the ray that crops the double at the knee (so the crop never changes)
      const th = 69 * DEG, a = th - 27 * DEG, kp = ctx.store.knee;
      const s = lerp(6.7, 5.3, lt / 2.3);
      const pos = [kp.x - 0.1, kp.y + Math.sin(a) * s, kp.z + Math.cos(a) * s];
      ctx.cam.set({ pos, look: [pos[0], pos[1] - Math.sin(th) * 4, pos[2] - Math.cos(th) * 4], fov: 54 });
      ctx.cam.shake(0.02, t, 7);
      K.stamp(ctx, '9:40 PM', { at: 'bl' });
    },
    post: K.shotPost({ exposure: 1.95 }),
  },

  // ─────────────────────────────────────────── 3 · b04a · the map ──────────────────────────────────────────────────
  {
    name: 'a1.3 phone macro: the island that is not there (b04a)', start: 'b04-0.15', set: 'beachNight', cast: ['me', 'copy'], options: { fire: -1, rain: 1.4 },
    setup(ctx) {
      ctx.place('me', 'phoneSpot', { yaw: -PI / 2 });
      ctx.cast.copy.root.visible = false;
      ctx.props.phone.setMode('map').setLevel(1);
      ctx.add(ctx.props.a1rain.root);
      ctx.store.kick = ctx.add(new THREE.PointLight('#cfdcf0', 0.22, 2.5, 2));
      ctx.add(makeGlassBeads(), ctx.props.phone.root);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, ph = ctx.props.phone;
      K.filmPose(me, 'stand', t, { breathe: 1, headPitch: 0.36, armR: [-1.15, 0, 0.12], foreR: -1.25 });
      real(ctx).me.update(t); noDrips(ctx); ph.update(t); macroRain(ctx, 0.28);
      const { eye } = K.phoneToward(ctx, me, ph, 'R', null, { lift: 0.065 });
      // in front of the fist, not on top of it: the rag-wrapped hand shows behind the phone on both sides
      const pos = ph.root.position; pos.addScaledVector(V().subVectors(eye, pos).normalize(), 0.105); ph.root.lookAt(eye);
      ph.root.rotateY(PHONE_TILT[0]); ph.root.rotateX(PHONE_TILT[1]);        // a held phone is never square to the eye (and the sky's hot spot slides to a corner of the glass)
      ph.light.intensity = 0;                                              // its glow sits on the lens axis: a hot spot on the glass
      ctx.set.moon.rim.intensity = 0; ctx.set.moon.fill.intensity = 0;     // (so does the set's back light: it mirrors straight into the lens)
      const u = lt / 3.0, back = lerp(0.07, 0.0, smooth(u));               // a slow creep in
      const d = V().subVectors(eye, pos).normalize();
      ctx.cam.set({ pos: [eye.x + d.x * back + 0.012, eye.y + d.y * back + 0.04, eye.z + d.z * back + 0.008], look: [pos.x, pos.y - 0.012, pos.z], fov: 37 });
      ctx.store.focus = eye.distanceTo(pos) + back;
      ctx.store.kick.position.set(pos.x + 0.16, pos.y + 0.1, pos.z + 0.55);  // far off to the side: lights the rag, never the glass
      K.applyFlash(ctx, 0.05 * K.flicker(t, 3, 1.7));
      ctx.cam.shake(0.012, t, 11);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 0.4, aperture: 1.0, maxBlur: 16 }, bloom: { threshold: 2.4, strength: 0.12 } })),
  },

  // ─────────────────────────────────────────── 4 · b04b · rack to the foam line ────────────────────────────────────
  {
    name: 'a1.4 rack focus: someone on the foam line (b04b)', start: 'rack4-0.28', set: 'beachNight', cast: ['me', 'copy'], options: { fire: -1, rain: 1.4 },
    setup(ctx) {
      ctx.place('me', 'phoneSpot', { yaw: -PI / 2 });
      const H = ctx.set.heightAt;
      ctx.place('copy', [-10.8, H(-10.8, 0.8), 0.8], { yaw: PI / 2 });
      ctx.props.phone.setMode('map').setLevel(1);
      ctx.add(makeGlassBeads(), ctx.props.phone.root);
      const rim = ctx.add(new THREE.PointLight('#dfe9ff', 5, 5.5, 2)); rim.position.set(-10.8 - 1.3, H(-10.8, 0.8) + 1.5, 0.8 - 1.9);   // the surf's glow on his sea side: legs and sneakers off the black sand
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me, ph = ctx.props.phone;
      // the phone held up in front of his face: looking for a signal
      K.filmPose(me, 'stand', t, { breathe: 1, headPitch: 0.04 });
      K.filmPose(ctx.cast.copy, 'stand', 0);
      const eye = K.eyePoint(me, V());
      const cp = ctx.cast.copy.root.position;
      const cam = V(eye.x + 0.1, eye.y + 0.05, eye.z - 0.42);               // beside his head, over the right shoulder (his arms are short)
      // lens: the double 5.5° left of centre with his feet above the caption line; the phone low on the right
      const look = V(cam.x - 15, cam.y - 15 * Math.tan(4.7 * DEG), cam.z - 15 * Math.tan(10.9 * DEG));
      const ax = look.clone().sub(cam).normalize(), rt = V().crossVectors(ax, V(0, 1, 0)).normalize(), upv = V().crossVectors(rt, ax);
      const want = cam.clone().addScaledVector(ax, 0.3).addScaledVector(rt, 0.032).addScaledVector(upv, -0.0865);   // phone centre
      reach(me, 'R', V(want.x, want.y - 0.14, want.z), [-1.9, 0.0, -0.2, -0.5]);
      real(ctx).me.update(t); noDrips(ctx); ph.update(t);
      const { pos } = K.phoneToward(ctx, me, ph, 'R', cam, { lift: 0.14 });
      ph.root.rotateY(PHONE_TILT[0]); ph.root.rotateX(PHONE_TILT[1]);
      ph.light.intensity = 0;
      ctx.cam.set({ pos: cam, look, fov: 45 });
      const r = sramp(t, ctx.time('rack4') + 0.05, ctx.time('rack4') + 0.85);
      const near = pos.distanceTo(cam), far = Math.hypot(cp.x - cam.x, cp.z - cam.z);
      ctx.store.focus = 1 / lerp(1 / near, 1 / far, r);                     // rack in dioptres, like a real lens
      ctx.set.foam.uniforms.uAmbient.value = 0.26;
      K.applyFlash(ctx, sheet(ctx, 'b04.w16', 0.22, 4));
      ctx.cam.shake(0.014, t, 12);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 0.4, aperture: 2.0, maxBlur: 22 }, bloom: { threshold: 1.7, strength: 0.14 } })),
  },

  // ─────────────────────────────────────────── 5 · b05 · one voicemail ─────────────────────────────────────────────
  {
    name: 'a1.5 one voicemail: Mom (b05)', start: 'b05-0.15', set: 'beachNight', cast: ['me', 'copy'], options: { fire: -1, rain: 1.5 },
    setup(ctx) {
      const H = ctx.set.heightAt;
      ctx.place('me', 'phoneSpot', { yaw: PI / 2 });
      ctx.place('copy', [-14.5, H(-14.5, 0.7), 0.7], { yaw: PI / 2 });
      const ph = ctx.props.phone;
      K.hold(ctx.cast.me, ph, 'R', ctx, { pos: [0, -0.02, 0.1], rot: [-1.0, 0, 0] }); ph.setMode('map').setLevel(1);
      // the screen as a practical: cold light from below
      const l = ctx.store.glow = ctx.add(new THREE.PointLight('#b4c8ff', 0.6, 3.2, 2), ph.root); l.position.set(0, 0.03, 0.12);
      const p = A(ctx, 'phoneSpot');
      const rim = ctx.store.rim = ctx.add(new THREE.PointLight('#dfe9ff', 1.3, 5, 2)); rim.position.set(p.x - 1.3, p.y + 2.5, p.z - 1.4);
      ctx.add(ctx.props.a1rain.root);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      const mom = ctx.time('mom1');
      K.filmPose(me, 'stand', t, { breathe: 1, headPitch: lerp(0.4, 0.3, sramp(t, mom + 0.9, mom + 2.2)) });
      me.face('sad', t);
      K.joint(me, 'armR', -0.78, 0, -0.2); K.joint(me, 'foreArmR', -1.1, 0, 0);   // the phone in the rag hand, low in front of his chest
      K.filmPose(ctx.cast.copy, 'stand', 0);
      real(ctx).me.update(t); ctx.props.phone.update(t); macroRain(ctx, 0.3);
      const p = A(ctx, 'phoneSpot'), u = smooth(lt / 4.85);
      const d = lerp(3.55, 3.15, u);
      ctx.cam.set({ pos: [p.x + d, p.y + 1.62, p.z - 0.3], look: [p.x, p.y + 1.3, p.z - 0.1], fov: 40 });
      ctx.store.focus = d - 0.25;
      ctx.set.foam.uniforms.uAmbient.value = 0.24;
      K.applyFlash(ctx, sheet(ctx, mom + 1.15, 0.2, 6));
      ctx.cam.shake(0.016, t, 13);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 3, aperture: 1.3, maxBlur: 16 } })),
  },

  // ─────────────────────────────────────────── 6 · b06 · the knight (reference frame for b25) ──────────────────────
  {
    name: 'a1.6 the knight, nose screen-left (b06)', start: 'b06-0.08', set: 'beachNight', cast: ['me'], options: { fire: -1, rain: 1.6 },
    setup(ctx) {
      ctx.place('me', 'phoneSpot', { yaw: PI / 2 });
      ctx.add(ctx.props.a1rain.root);
      ctx.store.kick = ctx.add(new THREE.PointLight('#dfe8f2', 2.1, 6, 2));
      ctx.store.low = ctx.add(new THREE.PointLight('#a9c4ff', 0.5, 3, 2));
      const em = ctx.cast.me.root.getObjectByName('emblem');
      ctx.store.beads = ctx.add(makeBeads(), em);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      K.filmPose(me, 'stand', t, { breathe: 0.6 });
      const f = K.emblemFrame(me, { dy: EMBLEM_DY });
      // the wipe: his RIGHT hand (the rag) comes in from screen-left, crosses the knight once, and leaves
      const em = me.root.getObjectByName('emblem');
      em.updateWorldMatrix(true, false);
      const e = em.getWorldPosition(V()), q = em.getWorldQuaternion(new THREE.Quaternion());
      const ax = V(1, 0, 0).applyQuaternion(q), ay = V(0, 1, 0).applyQuaternion(q), az = V(0, 0, 1).applyQuaternion(q);   // ax = screen-right
      const w = wipeAt(lt);
      if (w.k > 0) {
        const tgt = e.clone().addScaledVector(ax, w.a).addScaledVector(ay, w.b).addScaledVector(az, 0.075);
        const p = reach(me, 'R', tgt, [-0.9, 1.45, 0.0, -1.6]);
        const r0 = [0.02, 0, -0.1, -0.12];                                  // the hanging arm of the 'stand' pose
        K.joint(me, 'armR', lerp(r0[0], p[0], w.k), lerp(r0[1], p[1], w.k), lerp(r0[2], p[2], w.k)); K.joint(me, 'foreArmR', lerp(r0[3], p[3], w.k), 0, 0);
      }
      updateBeads(ctx.store.beads, lt, w);
      real(ctx).me.update(t); noDrips(ctx); macroRain(ctx, 0.5);
      ctx.cam.set(f); ctx.store.focus = f.focus;
      ctx.store.kick.position.set(f.look[0] + 0.5, f.look[1] + 0.75, f.look[2] + 1.1);
      ctx.store.low.position.set(f.look[0] + 0.45, f.look[1] - 0.45, f.look[2] - 0.5);
      K.applyFlash(ctx, 0.12 * K.flicker(t, 3, 1.1));
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 1.7, aperture: 1.2, maxBlur: 16 } })),
  },

  // ─────────────────────────────────────────── 7 · b07a · the fire catches ─────────────────────────────────────────
  {
    name: 'a1.7 a fire under the wreck (b07a)', start: 'b07-0.72', set: 'beachNight', cast: ['me'], options: { fire: 1 },
    setup(ctx) {
      ctx.place('me', 'camp', { yaw: ctx.set.campYaw });
      campPrints(ctx); fireBounce(ctx);
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      K.filmPose(me, 'huddle', t, { headPitch: 0.1, shiver: 0.5 }); me.face('sad', t);
      real(ctx).me.update(t);
      fireScale(ctx, fireCatch(t - ctx.time('b07') + 0.7), 0.7);
      // low, just off the fire's axis: flames lower left, the kid under the hull, the prints and the sea to the right
      const k = A(ctx, 'camp'), cy = ctx.set.campYaw, fx = Math.sin(cy), fz = Math.cos(cy), lx = fz, lz = -fx, u = smooth(lt / 2.4);
      const fw = 4.4 - 0.25 * u, sd = 0.5;
      ctx.cam.set({ pos: [k.x + fx * fw + lx * sd, k.y + 1.15, k.z + fz * fw + lz * sd], look: [k.x + lx * 0.22, k.y + 0.52, k.z + lz * 0.22], fov: 50 });
      ctx.set.foam.uniforms.uAmbient.value = 0.22;
      ctx.cam.shake(0.03, t, 2);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: K.dist(ctx, A(ctx, 'camp')) - 0.9, aperture: 0.14, maxBlur: 8 }, bloom: { threshold: 1.5, strength: 0.12 }, grade: { highlightAmt: 0.5, saturation: 0.42 } })),
  },

  // ─────────────────────────────────────────── 8 · b07b · "And I wait." ────────────────────────────────────────────
  {
    name: 'a1.8 prints out of the surf (b07b)', start: 'b07.w7-0.1', set: 'beachNight', cast: ['me'], options: { fire: 1 },
    setup(ctx) {
      ctx.place('me', 'camp', { yaw: ctx.set.campYaw });
      const tr = campPrints(ctx); fireBounce(ctx); ctx.store.bounceK = 14;
      const H = ctx.set.heightAt, bx = tr.toes[0] + tr.u[0] * 1.3, bz = tr.toes[1] + tr.u[1] * 1.3;
      ctx.store.bounce.position.set(bx - 0.5, H(bx, bz) + 2.2, bz + 0.6);            // the firelight, carried out over the trail
      const cx = tr.toes[0] + tr.u[0] * 3.4, cz = tr.toes[1] + tr.u[1] * 3.4;
      const sky = ctx.add(new THREE.PointLight('#a9bcd6', 10, 9, 2)); sky.position.set(cx + 0.6, H(cx, cz) + 3.2, cz - 0.8);   // the surf's grey glow on the nearest prints
    },
    update(ctx, lt) {
      const t = ctx.t, me = ctx.cast.me;
      K.filmPose(me, 'huddle', t, { headPitch: 0.1, shiver: 0.5 }); me.face('sad', t);
      real(ctx).me.update(t);
      fireScale(ctx, 1, 0.7);
      // the wake-up shot's angle again, from the surf side: his sneakers at the top edge, and a line of prints that walks up the
      // frame and stops one step short of them
      const tr = ctx.store.trail, th = 53 * DEG, hh = lerp(1.84, 1.75, lt / 1.31), back = 3.23;   // (prints land at y 0.18 / 0.32 / 0.52 / 0.79: clear of the caption)
      const c = [tr.toes[0] + tr.u[0] * back, tr.toes[1] + tr.u[1] * back], h = ctx.set.heightAt(c[0], c[1]), g = hh / Math.tan(th);
      ctx.cam.set({ pos: [c[0], h + hh, c[1]], look: [c[0] - tr.u[0] * g, h, c[1] - tr.u[1] * g], fov: 54 });
      ctx.set.foam.uniforms.uAmbient.value = 0.26;
      ctx.cam.shake(0.02, t, 4);
    },
    post: K.shotPost((ctx) => ({ bloom: { threshold: 1.5, strength: 0.12 }, grade: { highlightAmt: 0.5, saturation: 0.42 } })),
  },

];

// the knight sits a touch above centre so the caption line (y 0.62) clears its base; b25 must use the same dy
export const EMBLEM_DY = -0.055;
/** wipe choreography in emblem space: { k 0..1 (blend from the hanging arm), a (m, + = screen-right), b (m, up) } */
function wipeAt(lt) {
  const inn = sramp(lt, 0.3, 0.85), out = sramp(lt, 1.55, 2.15);
  const k = inn * (1 - out);
  const s = sramp(lt, 0.8, 1.5);                                  // the stroke across the knight
  return { k, a: lerp(-0.14, 0.09, s), b: lerp(0.025, -0.03, s), s };
}
/** fire level after the spark (seconds since ignition): catches, flares, settles */
function fireCatch(x) {
  if (x <= 0) return 0.04;
  return 0.04 + 0.96 * smooth(x / 1.1) + 0.25 * Math.exp(-Math.pow((x - 0.55) / 0.22, 2));
}
/** hide the kid's falling drips for this frame (macro shots: a drip is an egg at this scale). real.update rewrites them. */
const _zero = new THREE.Matrix4().makeScale(0, 0, 0);
function noDrips(ctx) {
  const d = real(ctx).me.drips; if (!d) return;
  for (let i = 0; i < d.count; i++) d.setMatrixAt(i, _zero);
  d.instanceMatrix.needsUpdate = true;
}
// rain beads on the knight (emblem-local metres): wiped away by the rag, a few come back
const BEADS = (() => { const r = K.rng(4407), out = []; for (let i = 0; i < 96; i++) out.push({ x: (r() - 0.5) * 0.2, y: (r() - 0.5) * 0.24, s: 0.0016 + 0.003 * r() * r(), back: r() < 0.16 ? 2.4 + r() * 1.6 : 0 }); return out; })();
function makeBeads() {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshPhysicalMaterial({ color: '#aab4bd', roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 2.2, transparent: true, opacity: 0.42, depthWrite: false }), BEADS.length);
  m.frustumCulled = false; m.renderOrder = 4; m.name = 'a1beads';
  return m;
}
const _bm = new THREE.Matrix4();
function updateBeads(mesh, lt, w) {
  BEADS.forEach((b, i) => {
    // the rag's leading edge has passed this bead (the stroke only moves screen-right, then the hand lifts away)
    const wiped = Math.abs(b.y - lerp(0.025, -0.03, 0.5)) < 0.088 && b.x < w.a + 0.085 && lt > 0.8;
    let k = wiped ? 0 : 1;
    if (wiped && b.back) k = 0.8 * sramp(lt, b.back, b.back + 0.25);
    _bm.makeScale(b.s * k, b.s * k * 1.2, b.s * k * 0.4); _bm.setPosition(b.x, b.y, 0.0015);
    mesh.setMatrixAt(i, _bm);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

// frame A: the kid stands this far inland of anchors.kidA (keeps the rag hand inside the right edge)
const KID_DZ = 0.12;

// the phone is held a little off square (rotateY, rotateX): a clean screen, the sky's glare parked on a corner
const PHONE_TILT = [0.21, -0.15];
/** rain beads on the phone glass (phone-local metres; the screen is 72 x 149 mm, facing +Z) */
function makeGlassBeads() {
  const r = K.rng(9131), n = 26;
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02,
    emissive: new THREE.Color('#86a8dc'), emissiveIntensity: 0.3, envMapIntensity: 2.4, transparent: true, opacity: 0.32, depthWrite: false }), n);
  const mm = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const sz = 0.0006 + 0.0013 * r() * r();
    mm.makeScale(sz, sz * (1 + 0.5 * r()), sz * 0.45); mm.setPosition((r() - 0.5) * 0.068, (r() - 0.5) * 0.142, 0.0055);
    m.setMatrixAt(i, mm);
  }
  m.frustumCulled = false; m.renderOrder = 4; m.name = 'a1glassBeads';
  return m;
}
