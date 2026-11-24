/*
 * act4.js — Dawn: the wrong boy goes home: boat deck, island dissolves, the slip, Mom's call, the mirrored knight,
 * the real kid under the pool, loop flash (b20–b27, 71.1–101.4 s). STUB from the set department: one establishing shot.
 */
import * as K from './kit.js';

export const shots = [
  {
    name: 'a4 stub: boat deck (b20)', start: 'swap', set: 'boat', cast: ['copy', 'captain'],
    setup(ctx) {
      ctx.place('copy', 'seat', { yaw: Math.PI - 0.6 });
      ctx.place('captain', 'wheel', { yaw: Math.PI });
    },
    update(ctx, lt) {
      ctx.cast.copy.pose('sit', 0, { seatHeight: ctx.set.seatH, hands: 'lap' });
      ctx.cast.captain.pose('idle', ctx.t);
      const c = ctx.set.anchors.sternCam;
      ctx.cam.set({ pos: [c.x, c.y + 0.04 * Math.sin(ctx.t * 0.9), c.z], look: [0.3, ctx.set.deckY + 1.0, -2], fov: 46, roll: 0.035 * Math.sin(ctx.t * 0.7) });
      K.stamp(ctx, '6:51 AM', { at: 'tl', alpha: K.clamp(lt / 0.4, 0, 1) * K.clamp(1 - (lt - 2.6) / 0.4, 0, 1) });
    },
    post: K.shotPost({ dof: { focus: 3.6, aperture: 0.5, maxBlur: 10 } }),
  },
];
