/*
 * act3.js — The mirror pool and the swap: the still pool, the late reflection, the smile, the white-out
 * (b16–b19, 56.5–71.1 s). STUB from the set department: one establishing shot. Replace with the real shots.
 */
import * as K from './kit.js';

export const shots = [
  {
    name: 'a3 stub: the pool (b16)', start: 'b16', set: 'cave', cast: ['me', 'copy'],
    setup(ctx) {
      ctx.place('me', 'kneel', { yaw: Math.PI });
      ctx.place('copy', 'kneel', { yaw: Math.PI });
      K.setMirror(ctx.cast.copy, false);                // a reflection is not the swapped double (yet)
      ctx.props.phone.setMode('torch').setSpill(1.6).setLevel(0.8);
    },
    update(ctx, lt) {
      const me = ctx.cast.me, copy = ctx.cast.copy;
      K.filmPose(me, 'kneel', ctx.t, { sit: 0.8, lean: 0.18, headPitch: 0.16 });
      K.filmPose(copy, 'kneel', ctx.t - 0.5, { sit: 0.8, lean: 0.18, headPitch: 0.16 });
      // torch low in his LEFT hand, LED up: lights both faces. K.follow (not K.hold) keeps it lit in the reflection pass.
      for (const c of [me, copy]) { K.joint(c, 'armL', -0.75, 0, 0.12); K.joint(c, 'foreArmL', -0.5, 0, 0); }
      K.follow(ctx, ctx.props.phone, me.joints.handL, { pos: [0, -0.02, 0.1], rot: [-1.9, 0, 0] });
      ctx.set.pool.substitute([me], [copy]);          // the lens sees me, the water shows the copy (0.5 s late)
      ctx.props.real.me.update(ctx.t);
      const s = K.poolSplit(ctx.set, { height: 0.2 + 1.0 * (1 - K.smooth(lt / 3)) });
      ctx.cam.set(s);
    },
    post: K.shotPost({}),
  },
];
