/*
 * act1.js — Night beach: the hook, the wreck, Mom's voicemail, the knight, the fire (b01–b07, 0–28.0 s).
 * STUB from the set department: one establishing shot so the film runs end to end. Replace with the real shots.
 */
import * as K from './kit.js';

export const shots = [
  {
    name: 'a1 stub: frame A (b01–b02)', start: 0, set: 'beachNight', cast: ['me', 'copy'], options: { fire: 0 },
    setup(ctx) {
      ctx.place('me', 'kidA', { yaw: -Math.PI / 2 });
      ctx.cam.set(K.frameA(ctx.set));
    },
    update(ctx, lt) {
      const real = ctx.props.real;
      K.filmPose(ctx.cast.me, 'stand', ctx.t, { breathe: 1, headYaw: 0.1 });
      // the double: frozen on the foam line, facing the lens; a step closer in the second flash
      ctx.place('copy', ctx.t < ctx.time('flash2') - 0.3 ? 'double18' : 'double12', { yaw: Math.PI / 2 });
      K.filmPose(ctx.cast.copy, 'stand', 0);
      real.me.update(ctx.t);
      K.flash(ctx, ['flash1', 'flash2'], { bolt: 0 });
      K.stamp(ctx, '3:12 AM', { at: 'tl', alpha: K.clamp(1 - (lt - 2.6) / 0.4, 0, 1) });
      ctx.cam.shake(0.03, ctx.t, 3);
    },
    post: K.shotPost({}),
  },
];
