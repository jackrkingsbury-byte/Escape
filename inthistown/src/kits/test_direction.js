/*
 * src/kits/test_direction.js — look-dev for the v2 direction layer: every camera helper of src/direct.js on a character
 * in the home kit, a double and a single hussBeat, v2 captions with red words, and a chat bubble.
 * Timeline: src/kits/test_direction_timeline.json (hand-made: 6 beats, 'bub1' / 'jump' markers, red lists, a bubble).
 *
 *   cd /home/user/Escape/inthistown && node render.mjs --timeline src/kits/test_direction_timeline.json \
 *      --shots /src/kits/test_direction.js --scale 0.75 --preview 1 --workers 1 --timeout 3000 \
 *      --times 0.05,0.6,1.6,2.6,3.3,3.55,4.9,6.3,7.2,8.0,8.9,9.9,10.5,11.5,11.62,12.4,13.4 --previewDir out/dir_test
 *
 * Shots (helper · what to check):
 *   0  whipIn + lowHero   frame-0 whip (yaw + shake + smear) settling on a low hero; camera fn reused by shot 12
 *   1  closeUp            face in the upper third, DOF on the face, red caption word LANTERN
 *   2  insert             macro on the hall-table photo, fov 24, shallow DOF
 *   3  hussBeat double    H1 ritual on b02: punch ×2, 0.3 s slow-mo (heave driven by the warped time), strain face,
 *                         caption HUSS! stamp
 *   4  pov                my hands in frame (reach 'out'), looking at Pip
 *   5  ots                over my right shoulder past the headphones onto Pip; Pip's chat bubble from 'bub1'
 *   6  ecu                extreme close-up of Pip, bubble clamped above the caption band
 *   7  topDown            god shot onto me cowering (camera under the 3.4 m ceiling)
 *   8  closeUp + dutch    8° Dutch roll, subject still framed
 *   9  wide + pushIn      re-applied push-in (0.25 of the distance over the shot)
 *   10 hussBeat single    H2 on b05 with captions hidden: stamp drawn by hussBeat (stamp:'fx')
 *   11 closeUp + dipWhite dip through white centred on marker 'jump' (both shots call dipWhite)
 *   12 bookend            shot 0's camera replayed in the morning (no whip), dip continues
 */
import * as THREE from 'three';
import { MAIN, FAMILY_NIGHT } from '../cast.js';
import { buildHome } from './home.js';
import { renderFrame as lookRender, focusOn } from '../lib/look.js';
import {
  configureDirect, boxBounds, closeUp, ecu, wide, ots, pov, insert, lowHero, topDown, dutch, pushIn, whipIn, dipWhite, bookend, hussBeat,
} from '../direct.js';

// DOF through look.js + keep every helper camera inside the hall (x −1.3…1.3, z 0…10, ceiling 3.4)
const HALL_BOX = boxBounds([-1.15, 0.12, 0.15], [1.15, 3.25, 9.85]);
configureDirect({ focusOn, bounds: (ctx) => (ctx.set && ctx.set.__name === 'home' ? HALL_BOX : null) });
export const renderFrame = lookRender;
export const lazySets = false;
export const captionOptions = { preset: 'v2', bubble: { size: 50 } };
export const cast = { me: MAIN.me, pip: FAMILY_NIGHT.pip };
export const sets = { home: (ctx) => buildHome(ctx, { lighting: 'night_lamp' }) };

const ME_AT = [0.3, 0, 5.2], PIP_AT = [-0.6, 0, 7.3];
function stage(ctx, { pip = true } = {}) {
  ctx.place('me', ME_AT, { yaw: 0 });                    // facing +Z (toward the front door)
  if (pip) ctx.place('pip', PIP_AT, { yaw: Math.PI + 0.25 });
}
const safePose = (ch, act, t, p, fb = 'idle') => { try { ch.pose(act, t, p); } catch { ch.pose(fb, t); } };

// shot 0's camera as a pure function (ctx, lt, u) so the bookend can replay it
function camS0(ctx, lt, u) {
  lowHero(ctx, 'me', { angle: 0.25, height: 0.5, u });
  whipIn(ctx, { dur: 0.32, angle: 0.8 });
}

export const shots = [
  { name: 'S0 whipIn + lowHero', start: 0, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    camera: camS0,
    update(ctx, lt, u) {
      ctx.cast.me.pose('idle', lt); ctx.cast.me.face('determined', ctx.t);
      ctx.cast.pip.pose('idle', lt);
      camS0(ctx, lt, u);
    } },
  { name: 'S1 closeUp', start: 1.1, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt, { headYaw: 0.15 }); ctx.cast.me.face('determined', ctx.t);
      closeUp(ctx, 'me');
    } },
  { name: 'S2 insert photo', start: 2.2, set: 'home', lighting: 'night_lamp', cast: ['me'],
    setup(ctx) { stage(ctx, { pip: false }); },
    update(ctx) { insert(ctx, 'hall.table.photo', { offset: [0, 0.16, 0], size: 0.34, elev: 10 }); } },
  { name: 'S3 hussBeat double', start: 'b02-0.05', set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    update(ctx, lt, u) {
      const h = hussBeat(ctx, ctx.t, { double: true, beat: 'b02' });
      const ht = h.t - ctx.time('b02-0.05');               // warped local time drives the heave
      safePose(ctx.cast.me, 'heave', ht, { u: Math.min(1, ht / 0.9) }, 'cheer');
      if (!h.on) ctx.cast.me.face('determined', ctx.t);
      ctx.cast.pip.pose('idle', lt);
      lowHero(ctx, 'me', { angle: -0.35, height: 0.6, dist: 2.0, fov: 44, u });
    } },
  { name: 'S4 pov hands', start: 4.3, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt, { reachL: 'out', reachR: 'out' });
      ctx.cast.pip.pose('idle', lt, { headPitch: -0.25 }); ctx.cast.pip.face('scared', ctx.t);
      pov(ctx, 'me', { at: 'pip', frame: [0.5, 0.36] });
    } },
  { name: 'S5 ots onto Pip + bubble', start: 5.5, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.pip.pose('idle', lt, { headPitch: -0.3 }); ctx.cast.pip.face('scared', ctx.t);
      ots(ctx, 'me', 'pip');
    } },
  { name: 'S6 ecu Pip', start: 6.9, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    update(ctx, lt) {
      ctx.cast.pip.pose('idle', lt, { headPitch: -0.2 }); ctx.cast.pip.face('scared', ctx.t);
      ecu(ctx, 'pip');
    } },
  { name: 'S7 topDown', start: 7.6, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    update(ctx, lt) {
      safePose(ctx.cast.me, 'cower', lt, {}); ctx.cast.me.face('shocked', ctx.t);
      ctx.cast.pip.pose('idle', lt);
      topDown(ctx, 'me', { height: 3.0, maxY: 3.25, spin: 0.15 });
    } },
  { name: 'S8 closeUp + dutch', start: 8.5, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt, { headYaw: -0.2 }); ctx.cast.me.face('angry', ctx.t);
      closeUp(ctx, 'me', { angle: -0.45 });
      dutch(ctx, 10);
    } },
  { name: 'S9 wide + pushIn', start: 9.4, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.pip.pose('idle', lt);
      wide(ctx, 'me', { angle: 0.15 });
      pushIn(ctx, 0.25);
    } },
  { name: 'S10 hussBeat single (fx stamp)', start: 'b05-0.05', set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'], captions: false,
    setup(ctx) { stage(ctx); },
    update(ctx, lt, u) {
      const h = hussBeat(ctx, ctx.t, { beat: 'b05', stamp: 'fx' });
      safePose(ctx.cast.me, 'shove', h.t - ctx.time('b05-0.05'), { hands: 'shoulder' });
      closeUp(ctx, 'me', { size: 0.2, angle: 0.6, u });
    } },
  { name: 'S11 closeUp pre-jump', start: 11.3, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'],
    setup(ctx) { stage(ctx); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.me.face('sad', ctx.t);
      closeUp(ctx, 'me', { angle: 0.4 });
      dipWhite(ctx, 'jump');
    } },
  { name: 'S12 bookend morning', start: 'jump', set: 'home', lighting: 'morning', cast: ['me', 'pip'], options: { frontDoorOpen: 1 },
    setup(ctx) { stage(ctx); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.me.face('relieved', ctx.t);
      ctx.cast.pip.pose('idle', lt); ctx.cast.pip.face('smile', ctx.t);
      bookend(ctx, 0);
      dipWhite(ctx, 'jump');
    } },
];
