/*
 * src/kits/test_home.js — look-dev / regression stills for the home kit (src/kits/home.js) + the series look
 * (src/lib/look.js). One shot per second; render the middle of each second:
 *   node render.mjs --timeline src/kits/test_home_timeline.json --shots /src/kits/test_home.js --scale 0.75 \
 *        --preview 1 --times 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5 \
 *        --previewDir out/home_test --workers 1 --timeout 3000
 * Shots (lighting state · room · what it checks):
 *   0  night_lamp     hall     SETUP A (kid height, 4 m inside the door, fov 34) + 5 stand-in lanterns lit: lantern row
 *                              clear of the captions band, ≥ 80 px each, unobstructed; me 2.6 m from camera
 *   1  night_lamp     hall     count shot from the back of the hall (z 0.9) toward the glazed door, Pip at her door
 *   2  night_lamp     hall     Pip's door gap ECU (dark sliver) + crayon-drawings spot, DOF on the gap
 *   3  night_torch    hall     under the hatch: torch beam on the open hatch (shadowed spot), dust
 *   4  dusk           hall     golden sun through the front glazing, shafts + dust, low OTS toward the door
 *   5  dusk_to_night  hall     SETUP B through the glass at nightMix 0.55 (porch, beam hooks, street)
 *   6  dark_practical kitchen  fridge open: cold practical through the arch, me silhouetted
 *   7  dark_practical hall     SETUP C one-point corridor: hot strip under the box-room door with 2 foot shadows
 *   8  boxroom_lamp   box room from inside the box room looking out down the hall to the door glass
 *   9  morning        porch    from the porch in through the open front door, shafts, 6 stand-in lanterns
 *   10 night_torch    attic    top-down through the hatch from the attic
 *   11 dusk           street   our porch + next door + baker at warm dusk (exterior)
 *   12 morning        kitchen  wide kitchen: checker tiles, counters, fridge, window light
 *   13 night_lamp     hall     hall-table insert (lamp + family photo) with a focus pull to the frames
 * Measured cost (SwiftShader 4 CPU, scale 0.75 = 810×1440, 1 worker, look.js post chain incl. AO + DOF + bloom, PNG
 *   preview capture, first-frame shader compile included): night_lamp hall 2.8–4.0 s/frame, dusk hall 3.2–4.0,
 *   dark_practical fridge 3.2, morning porch 3.7, street dusk 3.7. Determinism: --check-determinism passes.
 */
import * as THREE from 'three';
import { MAIN } from '../cast.js';
import { buildHome, HOME, HOME_CAMS } from './home.js';
import { renderFrame as lookRender, focusOn, focusPull } from '../lib/look.js';

export const renderFrame = lookRender;
export const lazySets = false;
export const captionOptions = {};

const PIP = { id: 'pip', skin: '#c68642', hair: { style: 'curly', color: '#1a120c' }, top: { style: 'tee', color: '#f2d43b', accent: '#ffffff', emblem: 'star' },
  bottom: { style: 'pants', color: '#f2d43b' }, shoes: '#f2c21b', accessories: [], scale: 0.7 };
const DAD = { id: 'dad', skin: '#e0ac69', hair: { style: 'short', color: '#3b2416' }, top: { style: 'tee', color: '#3f5f8f', accent: '#ffffff', emblem: 'stripe' },
  bottom: { style: 'pants', color: '#3f5f8f' }, shoes: '#3a2a1e', accessories: ['beard', 'glasses'], build: 1.15 };
export const cast = { me: MAIN.me, pip: PIP, dad: DAD };

export const sets = {
  home: (ctx) => buildHome(ctx, { lighting: 'night_lamp' }),
};

const cam = (ctx, name, over = {}) => {
  const c = HOME_CAMS[name];
  ctx.cam.set({ pos: over.pos || c.pos, look: over.look || c.look, fov: over.fov || c.fov, roll: over.roll || 0 });
};

export const shots = [
  { name: 'setupA night_lamp', start: 0, set: 'home', lighting: 'night_lamp', cast: ['me'], options: { lanterns: 6, lanternsLit: 5 },
    setup(ctx) { ctx.place('me', [0.75, 0, 8.9], { yaw: Math.PI - 0.3 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('walk', lt, { speed: 0.6 }); ctx.cast.me.face('determined', ctx.t);
      cam(ctx, 'setupA'); ctx.cam.shake(0.06, ctx.t, 1);
    },
    focus: { target: 'me', aperture: 0.35 } },
  { name: 'back hall count', start: 1, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'], options: { lanterns: 5, lanternsLit: 5, pipDoorOpen: 0.35 },
    setup(ctx) { ctx.place('me', [0.15, 0, 9.0], { yaw: Math.PI }); ctx.place('pip', [-1.0, 0, 8.3], { yaw: Math.PI / 2 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.pip.pose('idle', lt, { headYaw: -0.3 }); ctx.cast.pip.face('sad', ctx.t);
      cam(ctx, 'backHall'); ctx.cam.shake(0.05, ctx.t, 2);
    },
    focus: { target: 'me', aperture: 0.3 } },
  { name: 'pip gap ECU', start: 2, set: 'home', lighting: 'night_lamp', cast: [], options: { pipDoorOpen: 0.1 },
    setup() {},
    update(ctx, lt) { cam(ctx, 'pipGap'); ctx.cam.shake(0.04, ctx.t, 3); focusOn(ctx, 'hall.pipDoor.gap', { aperture: 0.9 }); } },
  { name: 'torch under hatch', start: 3, set: 'home', lighting: 'night_torch', cast: ['me'], options: { hatchOpen: 0.7 },
    setup(ctx) { ctx.place('me', [0.25, 0, 6.2], { yaw: Math.PI * 0.85 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt, { headPitch: -0.6 }); ctx.cast.me.face('determined', ctx.t);
      ctx.set.torch.aim(new THREE.Vector3(0.45, 1.55, 6.15), new THREE.Vector3(0.0, 3.6, 6.7));
      cam(ctx, 'underHatch'); ctx.cam.shake(0.06, ctx.t, 4);
    },
    focus: { target: 'me', aperture: 0.4 } },
  { name: 'dusk hall', start: 4, set: 'home', lighting: 'dusk', cast: ['me'],
    setup(ctx) { ctx.place('me', [0.3, 0, 6.5], { yaw: 0.1 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.me.face('neutral', ctx.t);
      cam(ctx, 'backHall', { pos: [-0.5, 1.3, 2.2], look: [0.3, 1.5, 10] }); ctx.cam.shake(0.05, ctx.t, 5);
    },
    focus: { target: 'me', aperture: 0.35 } },
  { name: 'setupB dusk_to_night', start: 5, set: 'home', lighting: 'dusk_to_night', cast: ['me'], options: { nightMix: 0.55, lanterns: 5, lanternsLit: 3 },
    setup(ctx) { ctx.place('me', [0.12, 0, 9.35], { yaw: 0 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); cam(ctx, 'setupB'); ctx.cam.shake(0.05, ctx.t, 6);
    },
    focus: { target: 'porch.lantern.2', aperture: 0.5 } },
  { name: 'fridge practical', start: 6, set: 'home', lighting: 'dark_practical', cast: ['dad'], options: { practical: 'fridge', fridgeOpen: 1 },
    setup(ctx) { ctx.place('dad', [3.95, 0, 6.15], { yaw: Math.PI / 2 + 0.5 }); },
    update(ctx, lt) {
      ctx.cast.dad.pose('peer', lt); cam(ctx, 'archToFridge'); ctx.cam.shake(0.06, ctx.t, 7);
    },
    focus: { target: 'dad', aperture: 0.4 } },
  { name: 'setupC strip', start: 7, set: 'home', lighting: 'dark_practical', cast: [], options: { practical: 'strip', stripFeet: [{ x: -0.2, w: 0.16 }, { x: 0.18, w: 0.16 }] },
    setup() {},
    update(ctx, lt) { cam(ctx, 'setupC', { roll: 0.1 }); ctx.cam.shake(0.08, ctx.t, 8); },
    focus: { target: 'hall.boxDoor.strip', aperture: 0.4 } },
  { name: 'box room out', start: 8, set: 'home', lighting: 'boxroom_lamp', cast: ['dad', 'pip'], options: { boxDoorOpen: 1, lanterns: 5, lanternsLit: 5 },
    setup(ctx) { ctx.place('dad', [-0.45, 0, 2.6], { yaw: Math.PI }); ctx.place('pip', [0.35, 0, 1.4], { yaw: Math.PI }); },
    update(ctx, lt) {
      ctx.cast.dad.pose('idle', lt); ctx.cast.pip.pose('idle', lt); ctx.cast.pip.face('smile', ctx.t);
      cam(ctx, 'boxOut'); ctx.cam.shake(0.04, ctx.t, 9);
    },
    focus: { target: 'pip', aperture: 0.45 } },
  { name: 'porch morning', start: 9, set: 'home', lighting: 'morning', cast: ['me', 'pip'], options: { frontDoorOpen: 1, lanterns: 6, lanternsLit: 0 },
    setup(ctx) { ctx.place('me', [0.25, 0, 6.6], { yaw: 0 }); ctx.place('pip', [-0.45, 0, 6.9], { yaw: 0.2 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.pip.pose('idle', lt); ctx.cast.me.face('smile', ctx.t);
      cam(ctx, 'porchIn'); ctx.cam.shake(0.05, ctx.t, 10);
    },
    focus: { target: 'me', aperture: 0.3 } },
  { name: 'attic top-down', start: 10, set: 'home', lighting: 'night_torch', cast: ['me'], options: { hatchOpen: 1, atticLight: 1 },
    setup(ctx) { ctx.place('me', [0.0, 1.55, 6.6], { yaw: Math.PI }); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt, { headPitch: -0.9 }); ctx.cast.me.face('shocked', ctx.t);
      ctx.set.torch.aim(new THREE.Vector3(0.35, 3.8, 6.45), new THREE.Vector3(1.6, 4.6, 8.2));
      cam(ctx, 'atticDown', { pos: [-0.9, 4.85, 7.6], look: [0.3, 3.5, 6.0] }); ctx.cam.shake(0.04, ctx.t, 11);
    },
    focus: { target: 'me', aperture: 0.35 } },
  { name: 'street dusk', start: 11, set: 'home', lighting: 'dusk', cast: ['me'], options: { neighbourPorchGlow: 0.6, lanterns: 5, lanternsLit: 5, outdoors: true, sunDir: [-0.8, 0.28, 0.55] },
    setup(ctx) { ctx.place('me', [9.6, -0.61, 16.0], { yaw: Math.PI * 0.5 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('walk', lt, { speed: 0.6 }); ctx.cast.me.face('neutral', ctx.t); cam(ctx, 'streetNeighbours'); ctx.cam.shake(0.05, ctx.t, 12);
    },
    focus: { target: 'me', aperture: 0.25 } },
  { name: 'kitchen morning', start: 12, set: 'home', lighting: 'morning', cast: ['dad'], options: { fridgeOpen: 0 },
    setup(ctx) { ctx.place('dad', [4.2, 0, 7.6], { yaw: Math.PI / 2 }); },
    update(ctx, lt) { ctx.cast.dad.pose('idle', lt); ctx.cast.dad.face('smile', ctx.t); cam(ctx, 'kitchen'); ctx.cam.shake(0.05, ctx.t, 13); },
    focus: { target: 'dad', aperture: 0.3 } },
  { name: 'hall table pull', start: 13, set: 'home', lighting: 'night_lamp', cast: [],
    setup() {},
    update(ctx, lt) { cam(ctx, 'hallTable'); ctx.cam.shake(0.04, ctx.t, 14); focusPull(ctx, 'hall.table.photo', [-1.29, 2.05, 5.6], lt, { aperture: 1.0 }); } },
];
