/*
 * src/cine01/dev_sets.js — look-dev for the sets / kit of "The Other Me": every set from a hero angle with the avatar.
 *   node render.mjs --timeline src/cine01/dev_timeline.json --shots /src/cine01/dev_sets.js --scale 0.75 --preview 2 \
 *        --previewDir out/cine01_dev --workers 1 --timeout 2400 [--times 0.03,1.5,…]
 * 2 s per shot: 0 frame A (flash at 0) · 2 frame A, double at 5 m (flash 2.5) · 4 camp fire · 6 wide to the cave
 * (flash 7) · 8 high wide (flash 9) · 10 dusk top-down · 12 emblem macro (me) · 14 phone close-up · 16 cave torch ·
 * 18 pool split-level (late reflection) · 20 pool top-down (glass) · 22 cave flash · 24 boat deck · 26 island ·
 * 28 emblem macro (copy) · 30 boat profile · 32 pose sheet · 34 phone map macro
 */
import * as K from './kit.js';
import { sets as filmSets, groundBlob } from './sets.js';

await K.loadFilm();
export const cast = K.castSpecs;
export const lazySets = false;
export const captionOptions = { y: 0.62, momY: 0.665 };
export const sets = filmSets;
export const renderFrame = K.makeFilmRenderFrame();
export const drawCaptions = K.drawCaptions;
export async function init(ctx) { K.initCast(ctx); ctx.props.phone = K.makePhone(); }

const PI = Math.PI;
const real = (ctx) => ctx.props.real;
const A = (ctx, n) => ctx.set.anchors[n];

export const shots = [
  { name: 'frame A flash', start: 0, set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0 },
    setup(ctx) { ctx.place('me', 'kidA', { yaw: -PI / 2 - 0.3 }); ctx.place('copy', 'double18', { yaw: PI / 2 }); ctx.cam.set(K.frameA(ctx.set)); },
    update(ctx) { K.filmPose(ctx.cast.me, 'stand', ctx.t, { breathe: 1, headYaw: 0.35 }); K.filmPose(ctx.cast.copy, 'stand', 0); real(ctx).me.update(ctx.t); K.flash(ctx, ['f0'], { bolt: 0 }); K.stamp(ctx, '3:12 AM'); },
    post: K.shotPost({}) },
  { name: 'frame A 5 m', start: 2, set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0.8 },
    setup(ctx) { ctx.place('me', 'kidA', { yaw: -PI / 2 }); ctx.place('copy', 'double5', { yaw: PI / 2 }); ctx.cam.set(K.frameA(ctx.set)); },
    update(ctx) { K.filmPose(ctx.cast.me, 'stand', ctx.t, { breathe: 1, headYaw: 0.5 }); K.filmPose(ctx.cast.copy, 'stand', 0); real(ctx).me.update(ctx.t); K.flash(ctx, ['f1'], { bolt: 1 }); },
    post: K.shotPost({}) },
  { name: 'camp fire', start: 4, set: 'beachNight', cast: ['me'], options: { fire: 1 },
    setup(ctx) {
      ctx.place('me', 'camp', { yaw: ctx.set.campYaw });
      const c = A(ctx, 'campCam'), k = A(ctx, 'camp');
      ctx.cam.set({ pos: [c.x, c.y, c.z], look: [k.x, k.y + 0.75, k.z], fov: 50 });
      ctx.add(K.makeFootprints(K.printTrail([-3.6, 0.3], [k.x + 1.5, k.z + 0.2]), { heightAt: ctx.set.heightAt }));
    },
    update(ctx) { K.filmPose(ctx.cast.me, 'huddle', ctx.t, { headPitch: 0.1, shiver: 0.5 }); ctx.cast.me.face('sad', ctx.t); real(ctx).me.update(ctx.t); ctx.cam.shake(0.03, ctx.t, 2); },
    post: K.shotPost((ctx) => ({ dof: { focus: K.dist(ctx, A(ctx, 'camp')) - 0.9, aperture: 0.14, maxBlur: 8 }, bloom: { threshold: 1.5, strength: 0.12 }, grade: { highlightAmt: 0.5, saturation: 0.42 } })) },
  { name: 'wide to the cave', start: 6, set: 'beachNight', cast: ['me'], options: { fire: 0.8 },
    setup(ctx) { ctx.place('me', 'camp', { yaw: ctx.set.campYaw }); const c = A(ctx, 'wideCam'); ctx.cam.set({ pos: c, look: [-58, 5.5, 1.2], fov: 48 }); },
    update(ctx) { K.filmPose(ctx.cast.me, 'huddle', ctx.t); K.flash(ctx, [{ at: 'f3', power: 0.8 }], { bolt: 3 }); },
    post: K.shotPost({}) },
  { name: 'high wide', start: 8, set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0 },
    setup(ctx) { ctx.place('me', 'mid1', { yaw: -PI / 2 + 0.5 }); ctx.place('copy', 'cut1', { yaw: -PI * 0.9 }); ctx.cam.set({ pos: A(ctx, 'highCam'), look: [-52, 1.5, 4.0], fov: 48 }); },
    update(ctx) { K.filmPose(ctx.cast.me, 'stand', 0); K.filmPose(ctx.cast.copy, 'stand', 0); K.flash(ctx, ['f4'], { bolt: 0 }); },
    post: K.shotPost({}) },
  { name: 'dusk top-down', start: 10, set: 'beachDusk', cast: ['me', 'copy'], options: { wash: 0.6 },
    setup(ctx) {
      ctx.place('me', 'wash', { yaw: PI + 0.25 }); ctx.place('copy', 'washFeet', { yaw: 0 });
      const w = A(ctx, 'wash'); ctx.cam.set({ pos: [w.x + 0.5, w.y + 5.2, w.z - 0.25], look: [w.x + 0.5, w.y, w.z - 0.3], fov: 54 });
    },
    update(ctx, lt) { K.filmPose(ctx.cast.me, 'prone', ctx.t, { up: K.smooth((lt - 0.4) / 1.2), headPitch: -0.3 }); K.filmPose(ctx.cast.copy, 'stand', 0); real(ctx).me.update(ctx.t); K.stamp(ctx, '9:40 PM'); },
    post: K.shotPost({}) },
  { name: 'emblem macro (me)', start: 12, set: 'beachNight', cast: ['me'], options: { fire: 0, rain: 1.6 },
    setup(ctx) { ctx.place('me', 'phoneSpot', { yaw: PI / 2 }); },
    update(ctx) {
      K.filmPose(ctx.cast.me, 'stand', ctx.t, { breathe: 1 }); real(ctx).me.update(ctx.t);
      const f = K.emblemFrame(ctx.cast.me); ctx.cam.set(f); ctx.store.focus = f.focus;
      const l = ctx.store.l || (ctx.store.l = ctx.add(new ctx.THREE.PointLight('#dfe8f2', 7, 6, 2))); l.position.set(f.look[0] + 0.5, f.look[1] + 0.75, f.look[2] + 1.1);
      K.applyFlash(ctx, 0.12 * K.flicker(ctx.t, 3, 1.1));
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 1.7, aperture: 1.2, maxBlur: 16 } })) },
  { name: 'phone close-up', start: 14, set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0, rain: 1.5 },
    setup(ctx) {
      ctx.place('me', 'phoneSpot', { yaw: PI / 2 }); ctx.place('copy', [-13.5, ctx.set.heightAt(-13.5, 0.6), 0.6], { yaw: PI / 2 });
      const ph = ctx.props.phone; K.hold(ctx.cast.me, ph, 'R', ctx, { pos: [0, -0.02, 0.1], rot: [-1.0, 0, 0] }); ph.setMode('map').setLevel(1);
      const p = A(ctx, 'phoneSpot'); ctx.cam.set({ pos: [p.x + 2.75, p.y + 1.72, p.z + 0.35], look: [p.x, p.y + 1.42, p.z + 0.05], fov: 34 });
    },
    update(ctx) {
      const me = ctx.cast.me;
      K.filmPose(me, 'stand', ctx.t, { breathe: 1, headPitch: 0.42, armR: [-0.95, 0, -0.25], foreR: -1.15 });
      me.face('sad', ctx.t); K.filmPose(ctx.cast.copy, 'stand', 0); real(ctx).me.update(ctx.t); ctx.props.phone.update(ctx.t);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: 2.75, aperture: 1.4, maxBlur: 18 } })) },
  { name: 'cave torch', start: 16, set: 'cave', cast: ['me'],
    setup(ctx) {
      ctx.place('me', 'stand', { yaw: PI });
      const ph = ctx.props.phone; K.hold(ctx.cast.me, ph, 'L', ctx, { pos: [0, -0.03, 0.09], rot: [-1.3, PI, 0] }); ph.setMode('torch').setSpill(0.5).setLevel(1);
      const c = A(ctx, 'backCam'); ctx.cam.set({ pos: [c.x, 1.0, c.z + 1.6], look: [0.3, 0.9, 2], fov: 50 });
    },
    update(ctx) { K.filmPose(ctx.cast.me, 'stand', ctx.t, { breathe: 1, headPitch: 0.3, armL: [-0.9, 0, 0.15], foreL: -0.7 }); real(ctx).me.update(ctx.t); ctx.set.pool.substitute([], []); },
    post: K.shotPost({}) },
  { name: 'pool split-level', start: 18, set: 'cave', cast: ['me', 'copy'],
    setup(ctx) {
      ctx.place('me', 'kneel', { yaw: PI }); ctx.place('copy', 'kneel', { yaw: PI }); K.setMirror(ctx.cast.copy, false);
      ctx.props.phone.setMode('torch').setSpill(1.6).setLevel(0.8);
      ctx.cam.set(K.poolSplit(ctx.set));
    },
    update(ctx, lt) {
      const me = ctx.cast.me, copy = ctx.cast.copy, rise = (x) => K.smooth((x - 0.2) / 0.9);
      K.filmPose(me, 'kneel', ctx.t, { sit: 0.8, lean: 0.18, raiseR: rise(lt), headPitch: 0.16 }); me.face('shocked', ctx.t);
      K.filmPose(copy, 'kneel', ctx.t - 0.5, { sit: 0.8, lean: 0.18, raiseR: rise(lt - 0.5), headPitch: 0.16 });
      // the torch in his LEFT hand, low in front of him, LED up: lights both faces from below (K.follow keeps it lit in the reflection)
      for (const c of [me, copy]) { K.joint(c, 'armL', -0.75, 0, 0.12); K.joint(c, 'foreArmL', -0.5, 0, 0); }
      K.follow(ctx, ctx.props.phone, me.joints.handL, { pos: [0, -0.02, 0.1], rot: [-1.9, 0, 0] }); copy.face(lt > 1.4 ? 'grin' : 'shocked', ctx.t);
      ctx.set.pool.substitute([me], [copy]); real(ctx).me.update(ctx.t);
    },
    post: K.shotPost({}) },
  { name: 'pool top-down glass', start: 20, set: 'cave', cast: ['me'], options: { pool: 'glass', ripple: 0 },
    setup(ctx) {
      const c = A(ctx, 'poolCenter'); ctx.place('me', [c.x, ctx.set.waterY - 0.58, c.z + 1.25], { yaw: 0 });
      const ph = ctx.props.phone; ctx.add(ph.root); const r = A(ctx, 'phoneRest'); ph.root.position.set(r.x, r.y + 0.01, r.z); ph.root.rotation.set(-PI / 2, 0, 0.4); ph.setMode('torch').setSpill(0.5).setLevel(0.5);
      ctx.cam.set(K.poolTop(ctx.set));
      const l = ctx.add(new ctx.THREE.PointLight('#9fc0e0', 5, 5, 2)); l.position.set(c.x + 1.3, ctx.set.waterY + 0.6, c.z + 0.9);
    },
    update(ctx) { const me = ctx.cast.me; K.filmPose(me, 'supine', ctx.t, { reach: 1, spread: 0.2, breathe: 0.3 }); me.face('shocked', ctx.t); },
    post: K.shotPost({}) },
  { name: 'cave flash', start: 22, set: 'cave', cast: ['me'],
    setup(ctx) { ctx.place('me', 'kneel', { yaw: PI }); const c = A(ctx, 'backCam'); ctx.cam.set({ pos: [c.x, 1.3, c.z + 1.5], look: [0.2, 1.2, 6], fov: 50 }); },
    update(ctx) { K.filmPose(ctx.cast.me, 'kneel', ctx.t, {}); ctx.set.pool.substitute([], []); K.flash(ctx, [{ at: 'f11', hold: 0.5 }], { bolt: 0 }); },
    post: K.shotPost({}) },
  { name: 'boat deck', start: 24, set: 'boat', cast: ['copy', 'captain'],
    setup(ctx) { ctx.place('copy', 'seat', { yaw: PI - 0.6 }); ctx.place('captain', 'wheel', { yaw: PI }); },
    update(ctx) {
      ctx.cast.copy.pose('sit', 0, { seatHeight: ctx.set.seatH, hands: 'lap' }); ctx.cast.captain.pose('idle', ctx.t);
      const c = A(ctx, 'sternCam'); ctx.cam.set({ pos: [c.x, c.y, c.z], look: [0.3, ctx.set.deckY + 1.0, -2], fov: 46, roll: 0.035 * Math.sin(ctx.t * 0.7) });
      K.stamp(ctx, '6:51 AM');
    },
    post: K.shotPost({ dof: { focus: 3.6, aperture: 0.5, maxBlur: 10 } }) },
  { name: 'island', start: 26, set: 'boat', cast: [],
    setup(ctx) { const c = A(ctx, 'railCam'); ctx.cam.set({ pos: c, look: [0, 26, 190], fov: 36 }); },
    update(ctx, lt) {},
    post: K.shotPost((ctx, lt) => ({ fog: { density: K.lerp(0.004, 0.03, K.smooth(lt / 2)) } })) },
  { name: 'emblem macro (copy)', start: 28, set: 'boat', cast: ['copy'],
    setup(ctx) { ctx.place('copy', 'rail', { yaw: PI }); },
    update(ctx) {
      K.filmPose(ctx.cast.copy, 'stand', ctx.t, { breathe: 1 });
      const f = K.emblemFrame(ctx.cast.copy); ctx.cam.set(f); ctx.store.focus = f.focus;
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 1.7, aperture: 1.2, maxBlur: 16 } })) },
  { name: 'boat profile', start: 30, set: 'boat', cast: ['copy'],
    setup(ctx) { ctx.place('copy', 'rail', { yaw: PI / 2 }); const r = A(ctx, 'rail'); ctx.cam.set({ pos: [r.x - 0.3, r.y + 1.72, r.z - 2.9], look: [r.x + 0.05, r.y + 1.62, r.z], fov: 30 }); },
    update(ctx) { K.filmPose(ctx.cast.copy, 'stand', ctx.t, { breathe: 1 }); ctx.cast.copy.face('smug', ctx.t); },
    post: K.shotPost({ dof: { focus: 2.9, aperture: 1.3, maxBlur: 16 } }) },
  { name: 'pose sheet', start: 32, set: 'beachDusk', cast: ['me'], options: { rain: 0.3 },
    setup(ctx) {
      const H = ctx.set.heightAt;
      ctx.place('me', [20, H(20, 6), 6], { yaw: 0.9 });
      ctx.cam.set({ pos: [23.2, H(21, 9) + 1.3, 9.4], look: [20, H(20, 6) + 0.6, 6], fov: 40 });
      const l = ctx.add(new ctx.THREE.PointLight('#ffffff', 90, 20, 2)); l.position.set(23.5, H(20, 6) + 3.5, 8.5);
    },
    update(ctx, lt) { const n = ['kneel', 'huddle', 'prone', 'supine'][Math.min(3, Math.floor(lt / 0.5))]; K.filmPose(ctx.cast.me, n, ctx.t, { raiseR: 1, up: 1, sit: 0.5 }); },
    post: K.shotPost({ fog: null }) },
  { name: 'phone map macro', start: 34, set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0, rain: 1.4 },
    setup(ctx) {
      ctx.place('me', 'phoneSpot', { yaw: -PI / 2 }); ctx.place('copy', [-14, ctx.set.heightAt(-14, 0.6), 0.6], { yaw: PI / 2 });
      ctx.props.phone.setMode('map').setLevel(1);
    },
    update(ctx, lt) {
      const me = ctx.cast.me;
      K.filmPose(me, 'stand', ctx.t, { breathe: 1, headPitch: 0.35, armR: [-1.15, 0, 0.12], foreR: -1.25 });
      real(ctx).me.update(ctx.t); ctx.props.phone.update(ctx.t); K.filmPose(ctx.cast.copy, 'stand', 0);
      const { eye, pos } = K.phoneToward(ctx, me, ctx.props.phone, 'R');
      ctx.cam.set({ pos: [eye.x + 0.02, eye.y + 0.03, eye.z + 0.02], look: [pos.x, pos.y + 0.02, pos.z], fov: 32 });
      ctx.store.focus = lt < 1 ? eye.distanceTo(pos) : 15;
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus, aperture: 2.2, maxBlur: 22 }, bloom: { threshold: 1.6 } })) },
  { name: 'overview', start: 36, set: 'beachDusk', cast: ['me'],
    setup(ctx) { ctx.place('me', 'kidA', { yaw: -PI / 2 }); ctx.cam.set({ pos: [30, 34, -52], look: [-30, 0, 6], fov: 55 }); },
    update(ctx) { K.filmPose(ctx.cast.me, 'stand', 0); }, post: K.shotPost({ fog: { density: 0.003 }, exposure: 1.6 }) },
  { name: 'sky check', start: 38, set: 'beachNight', cast: [], options: { fire: 0 },
    setup(ctx) { const f = K.frameA(ctx.set); ctx.cam.set({ pos: f.pos, look: [f.pos[0] - 20, f.pos[1] + 5, f.pos[2] - 3], fov: 60 }); },
    update(ctx) {}, post: K.shotPost({}) },
  { name: 'camp side', start: 40, set: 'beachDusk', cast: ['me'], options: { fire: 0 },
    setup(ctx) { ctx.place('me', 'camp', { yaw: 0.1 }); ctx.cam.set({ pos: [1.5, 2.2, 11], look: [-5.5, 1, 4.6], fov: 50 }); },
    update(ctx) { K.filmPose(ctx.cast.me, 'huddle', 0); }, post: K.shotPost({ fog: { density: 0.004 }, exposure: 1.5 }) },
  { name: 'cliff check', start: 42, set: 'beachDusk', cast: ['me'],
    setup(ctx) { ctx.place('me', 'cave', { yaw: PI / 2 }); ctx.cam.set({ pos: [-30, 2.2, 6], look: [-62, 7, 3.5], fov: 55 }); },
    update(ctx) { K.filmPose(ctx.cast.me, 'stand', 0); }, post: K.shotPost({ fog: { density: 0.004 }, exposure: 1.5 }) },
  { name: 'arch debug', start: 44, set: 'beachDusk', cast: ['me'], options: { rain: 0, jungle: false },
    setup(ctx) { ctx.place('me', 'cave', { yaw: PI / 2 }); const l = ctx.add(new ctx.THREE.PointLight('#ffffff', 900, 120, 1.5)); l.position.set(-40, 14, 2); },
    update(ctx, lt) {
      K.filmPose(ctx.cast.me, 'stand', 0);
      const v = Math.floor(lt / 0.5);
      const cams = [{ pos: [-34, 6, 3], look: [-66, 6, 0] }, { pos: [-40, 5, -30], look: [-66, 6, 0] }, { pos: [-40, 5, 34], look: [-66, 6, 0] }, { pos: [-50, 45, 0.1], look: [-66, 0, 0] }];
      ctx.cam.set({ ...cams[Math.min(3, v)], fov: 60 });
    }, post: K.shotPost({ fog: null, exposure: 3 }) },
];
