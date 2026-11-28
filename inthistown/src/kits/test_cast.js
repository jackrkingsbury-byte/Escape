/*
 * src/kits/test_cast.js — look-dev / regression module for the v2 FAMILY CAST (src/cast.js) and the v2 BODY ACTING
 * poses, cycles and faces (src/characters.js). Timeline: src/kits/test_cast_timeline.json (1 s per shot).
 *
 *   cd /home/user/Escape/inthistown && node render.mjs --timeline src/kits/test_cast_timeline.json \
 *      --shots /src/kits/test_cast.js --scale 0.75 --preview 1 --previewDir out/<yours> --workers 1 --timeout 3000 \
 *      [--times 0.5,1.5]  [--query "debug=1"  (prints the shot name in the corner)]
 *   With --preview 1 every shot is sampled at its start; pass --times k+0.5 to see shot k mid-way.
 *
 * Every frame goes through src/lib/look.js (the series' warm post preset, per-shot DOF with `focus`).
 * Each pose shot shows the same pose twice: left figure FRONT, right figure 3/4 (yaw −0.75).
 * Shot index = start second (see SHOTS below for the list; the names are what --query debug=1 prints).
 */
import * as THREE from 'three';
import { MAIN, FAMILY, FAMILY_NIGHT, familySpec } from '../cast.js';
import { renderFrame as lookRender, focusOn, makeLamp, tuneShadow, MOODS, COLORS } from '../lib/look.js';
import { getPBR } from '../real/textures.js';
import { DRAG_SPEED, SPRINT_SPEED, BACKUP_SPEED, CHARGE_SPEED } from '../characters.js';

export const renderFrame = lookRender;
export const lazySets = false;
export const captionOptions = {};

const me2 = { ...JSON.parse(JSON.stringify(MAIN.me)), id: 'me2' };
const me3 = { ...JSON.parse(JSON.stringify(MAIN.me)), id: 'me3' };
export const cast = {
  me: MAIN.me, me2, me3,
  mom: FAMILY.mom, dad: FAMILY.dad, pip: FAMILY.pip,
  momN: familySpec('mom', 'night', { id: 'momN' }), dadN: familySpec('dad', 'night', { id: 'dadN' }),
  pipN: familySpec('pip', 'night', { id: 'pipN' }), pipN2: familySpec('pip', 'night', { id: 'pipN2' }),
};

// ─────────────────────────────────────────────────────────────────────────── sets
function room(ctx, mode) {
  const root = new THREE.Group();
  const pl = getPBR('planks').repeat(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshStandardMaterial({ map: pl.map, normalMap: pl.normalMap, roughnessMap: pl.roughnessMap, color: '#c79a6a' }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: mode === 'back' ? '#20232b' : '#d9c3a0', roughness: 0.95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.4), wallMat); back.position.set(0, 1.7, -2.6); back.receiveShadow = true; root.add(back);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), new THREE.MeshStandardMaterial({ color: '#b7c4ad', roughness: 0.95 }));
  side.position.set(-3.4, 1.7, 1); side.rotation.y = Math.PI / 2; side.receiveShadow = true; root.add(side);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(16, 0.14, 0.04), new THREE.MeshStandardMaterial({ color: '#f1e8d6' })); skirt.position.set(0, 0.07, -2.58); root.add(skirt);
  // a little clutter: two frames on the back wall, a rug
  for (const [x, y, w, h, c] of [[-1.5, 1.9, 0.5, 0.65, '#7a4b2e'], [1.4, 2.05, 0.7, 0.5, '#3d3a36']]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), new THREE.MeshStandardMaterial({ color: c })); f.position.set(x, y, -2.56); root.add(f);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), new THREE.MeshStandardMaterial({ color: '#e9d9b0' })); p.position.set(x, y, -2.535); root.add(p);
  }
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0), new THREE.MeshStandardMaterial({ color: '#8c3b3b', roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.005, 0.2); rug.receiveShadow = true; root.add(rug);
  const set = { root, background: new THREE.Color(mode === 'day' ? '#2a2218' : '#06070a'), exposure: 1 };
  if (mode === 'day') {
    root.add(new THREE.HemisphereLight('#fff1d8', '#5a4632', 0.9));
    const sun = new THREE.DirectionalLight('#ffe0b0', 2.4); sun.position.set(-3, 5, 4); sun.target.position.set(0, 1, 0);
    tuneShadow(sun, { mapSize: 1024, radius: 4, box: 4, near: 0.5, far: 20 }); root.add(sun, sun.target);
    const lamp = makeLamp({ shadow: false, intensity: 0.6 }); lamp.root.position.set(2.3, 0, -1.6); root.add(lamp.root);
  } else if (mode === 'night') {
    root.add(new THREE.HemisphereLight('#53638a', '#17120d', 0.3));
    const lamp = makeLamp({ shadow: true, intensity: 0.45 }); lamp.root.position.set(-2.4, 0.75, 1.6); lamp.aim(new THREE.Vector3(0.3, 0.8, 0)); root.add(lamp.root);
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.5), new THREE.MeshStandardMaterial({ color: '#5b3b26' })); table.position.set(-2.4, 0.375, 1.6); table.castShadow = true; root.add(table);
    const moon = new THREE.DirectionalLight(COLORS.moon, 1.3); moon.position.set(3, 4, -5); root.add(moon);
    set.post = MOODS.night;
  } else {   // 'back': silhouette test — a bright warm doorway behind them, nothing in front
    root.add(new THREE.HemisphereLight('#2a3550', '#0b0806', 0.12));
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.9), new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#ffd9a8'), emissiveIntensity: 0.8 }));
    panel.position.set(0, 1.45, -2.55); root.add(panel);
    const key = new THREE.SpotLight('#ffd2a0', 40, 12, 0.9, 0.6, 2); key.position.set(0, 1.6, -2.3); key.target.position.set(0, 1, 2); root.add(key, key.target);
    set.post = MOODS.dark;
  }
  return set;
}
export const sets = { day: (ctx) => room(ctx, 'day'), night: (ctx) => room(ctx, 'night'), back: (ctx) => room(ctx, 'back') };

// ─────────────────────────────────────────────────────────────────────────── props
const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
function box(ctx, w, h, d, c, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true;
  ctx.add(m); return m;
}
// props that sit relative to a figure placed at (x, 0, z) with yaw: local [lx, ly, lz] → world
function rel(x, z, yaw, lx, lz) { const c = Math.cos(yaw), s = Math.sin(yaw); return [x + lx * c + lz * s, z - lx * s + lz * c]; }
function propsFor(ctx, kind, x, z, yaw) {
  if (kind === 'slab') { const [px, pz] = rel(x, z, yaw, 0, 1.2); box(ctx, 0.8, 0.5, 1.2, '#2f6db5', px, 0.25, pz, yaw); }
  if (kind === 'slabBehind') { const [px, pz] = rel(x, z, yaw, 0, -1.4); box(ctx, 0.8, 0.5, 1.2, '#2f6db5', px, 0.25, pz, yaw); }
  if (kind === 'stool') { const [px, pz] = rel(x, z, yaw, 0, 0.4); box(ctx, 0.55, 0.45, 0.45, '#c9873f', px, 0.225, pz, yaw); }
  if (kind === 'door') { const [px, pz] = rel(x, z, yaw, 0, 0.62); box(ctx, 1.3, 2.75, 0.08, '#7b4a2a', px, 1.375, pz, yaw); }
  if (kind === 'doorShoulder') { const [px, pz] = rel(x, z, yaw, 0, 0.5); box(ctx, 1.3, 2.75, 0.08, '#7b4a2a', px, 1.375, pz, yaw); }
  if (kind === 'wall') { const [px, pz] = rel(x, z, yaw, 0, -0.26); box(ctx, 1.4, 2.4, 0.08, '#8a6a52', px, 1.2, pz, yaw); }
  if (kind === 'hatch') { box(ctx, 1.4, 0.06, 1.0, '#e9e1d2', x, 1.94, z); }
}

// ─────────────────────────────────────────────────────────────────────────── shot builders
const SHOTS = [];
let T = 0;
function add(shot) { shot.start = T; T += 1; SHOTS.push(shot); }

// pose shot: ONE figure, three camera views in one second — front (lt < 1/3), 3/4 (lt < 2/3), profile (rest).
// Render at k + 0.15 / k + 0.5 / k + 0.85 to see the three views of shot k.
//   o.look [x,y,z] look-at point (default [0, 0.95, 0]), o.R orbit radius (4.6), o.h camera height (1.3), o.fov (36),
//   o.top true → views from above (lying poses), o.ids, o.xs, o.yaws for multi-figure shots, o.props, o.face, o.move.
const VIEW_ANGLES = [0, 0.78, 1.5708];
function pose(name, action, params = {}, o = {}) {
  const ids = o.ids || ['me'];
  add({
    name, set: o.set || 'day', cast: ids,
    focus: o.focus === false ? undefined : { target: ids[0], aperture: 0.2 },
    setup(ctx) {
      const yaws = o.yaws || ids.map(() => o.yaw0 || 0);
      const xs = o.xs || ids.map(() => 0);
      const zs = o.zs || ids.map(() => 0);
      ids.forEach((id, i) => { ctx.place(id, [xs[i], o.y || 0, zs[i]], { yaw: yaws[i] }); if (o.props) propsFor(ctx, o.props, xs[i], zs[i], yaws[i]); });
      ctx.store.yaws = yaws; ctx.store.xs = xs; ctx.store.zs = zs;
      if (o.accessory) ids.forEach((id) => ctx.cast[id].setAccessory(o.accessory, true));
    },
    update(ctx, lt) {
      let p = typeof params === 'function' ? params(ctx, lt) : params;
      if (o.headYaw !== undefined) p = { ...p, headYaw: o.headYaw };
      ids.forEach((id, i) => {
        const ch = ctx.cast[id];
        if (o.move) {               // root motion for cycles: o.move = speed (m/s along the figure's +Z, may be negative)
          const yaw = ctx.store.yaws[i], d = o.move * ((lt * 3) % 1 - 0.5) * ch.spec.scale;
          ch.root.position.set(ctx.store.xs[i] + Math.sin(yaw) * d, o.y || 0, ctx.store.zs[i] + Math.cos(yaw) * d);
        }
        ch.pose(action, lt + 0.37 * i, p);
        ch.face(o.face || 'determined', ctx.t);
      });
      const view = Math.min(2, Math.floor(lt * 3)), a = VIEW_ANGLES[view] + (o.yaw0 || 0) + (o.camOff || 0);
      const L = o.look || [0, 0.95, 0], R = o.R || 5.0, h = o.h ?? 1.3;
      const cam = o.top ? { pos: [L[0] + Math.sin(a) * R * 0.75, 3.9, L[2] + Math.cos(a) * R * 0.75], look: L, fov: o.fov || 40 }
        : { pos: [L[0] + Math.sin(a) * R, h, L[2] + Math.cos(a) * R], look: L, fov: o.fov || 36 };
      ctx.cam.set(cam);
      ctx.cam.shake(0.02, ctx.t, 3);
    },
  });
}

// 0–2: lineups
function lineup(name, setName, ids, faces, extra) {
  add({
    name, set: setName, cast: ids,
    setup(ctx) {
      const xs = [-1.38, -0.46, 0.5, 1.32];
      ids.forEach((id, i) => ctx.place(id, [xs[i], 0, i === 3 ? 0.35 : 0], { yaw: 0 }));
    },
    update(ctx, lt) {
      ids.forEach((id, i) => {
        const ch = ctx.cast[id];
        if (extra && extra[i]) ch.pose(extra[i][0], lt + i, extra[i][1]); else ch.pose('idle', lt + i);
        ch.face(faces[i], ctx.t);
      });
      ctx.cam.set({ pos: [0, 1.3, 10.5], look: [0, 1.0, 0], fov: 36 });
      ctx.cam.shake(0.03, ctx.t, 1);
    },
  });
}
lineup('lineup day', 'day', ['me', 'mom', 'dad', 'pip'], ['smile', 'smile', 'grin', 'grin']);
lineup('lineup night', 'night', ['me', 'momN', 'dadN', 'pipN'], ['neutral', 'sleepy', 'sleepy', 'sad'], [null, ['idle', {}], ['idle', {}], ['idle', { reachL: 'out', blanket: 'drag', blanketHand: 'L' }]]);
lineup('silhouettes backlit', 'back', ['me', 'momN', 'dadN', 'pipN'], ['neutral', 'neutral', 'neutral', 'neutral'], [null, ['idle', {}], ['idle', {}], ['idle', { reachL: 'out', blanket: 'drag', blanketHand: 'L' }]]);

// 3–6: faces (extreme close-ups)
function faces(name, setName, pairs, camY = 1.58) {
  add({
    name, set: setName, cast: pairs.map((p) => p[0]),
    focus: { target: pairs[0][0], aperture: 0.5 },
    setup(ctx) {
      pairs.forEach(([id], i) => ctx.place(id, [(i - (pairs.length - 1) / 2) * 0.74, pairs[i][2] || 0, 0], { yaw: 0 }));
    },
    update(ctx, lt) {
      pairs.forEach(([id, f], i) => { ctx.cast[id].pose('idle', lt + i); ctx.cast[id].face(f, ctx.t); });
      ctx.cam.set({ pos: [0, camY, 3.5], look: [0, camY - 0.05, 0], fov: 36 });
    },
  });
}
faces('faces: crying / terrified', 'day', [['pip', 'crying', 0.55], ['me', 'terrified']]);
faces('faces: relieved / heartbroken', 'day', [['mom', 'relieved', -0.12], ['me', 'heartbroken']]);
faces('faces: angry / scared', 'night', [['dad', 'angry', -0.12], ['pipN', 'scared', 0.62]]);
faces('faces: crying / heartbroken', 'night', [['me', 'crying'], ['momN', 'heartbroken', -0.12]]);

// 7–: poses and cycles
const camLow = { pos: [0, 0.9, 8.0], look: [0, 0.75, 0], fov: 36 };
const camHigh = { pos: [0, 4.6, 6.4], look: [0, 0.3, 0], fov: 40 };
const camUp = { pos: [0, 1.2, 8.4], look: [0, 1.15, 0], fov: 36 };
pose('haul (bent double, load in front)', 'haul', {}, { props: 'slab', face: 'huss', look: [0, 0.8, 0] });
pose('drag cycle (walks backward)', 'drag', {}, { props: 'slab', face: 'determined', look: [0, 0.8, 0] });
pose('haul behind (strap over shoulder)', 'drag', { behind: true }, { props: 'slabBehind', face: 'huss', look: [0, 0.8, 0] });
pose('heave u=0.1', 'heave', { u: 0.1 }, { face: 'huss' });
pose('heave u=0.55', 'heave', { u: 0.55 }, { face: 'huss' });
pose('heave u=1', 'heave', { u: 1 }, { face: 'huss', look: [0, 1.15, 0] });
pose('pushUp u=0.2 (hatch)', 'pushUp', { u: 0.2 }, { props: 'hatch', face: 'huss', look: [0, 1.15, 0] });
pose('pushUp u=1', 'pushUp', { u: 1 }, { face: 'huss', look: [0, 1.15, 0] });
pose('stepUp u=0.45', 'stepUp', { u: 0.45 }, { props: 'stool', look: [0, 1.1, 0] });
pose('stepUp u=1', 'stepUp', { u: 1 }, { props: 'stool', look: [0, 1.25, 0] });
pose('crouch (hands on knees)', 'crouch', {}, { face: 'sad', look: [0, 0.65, 0], h: 0.9 });
pose('cower', 'cower', {}, { face: 'terrified', look: [0, 0.65, 0], h: 0.9 });
pose('kneel (working)', 'kneel', { hands: 'work' }, { face: 'determined', look: [0, 0.6, 0], h: 0.9 });
pose('kneel one knee', 'kneel', { oneKnee: true, hands: 'lap' }, { face: 'smile', look: [0, 0.6, 0], h: 0.9 });
pose('sitWall (knees up)', 'sitWall', { hands: 'knees' }, { props: 'wall', face: 'sad', look: [0, 0.55, 0], h: 0.9 });
pose('sitWall u=0.5 (sliding down)', 'sitWall', { u: 0.5, hands: 'floor' }, { props: 'wall', face: 'shocked', look: [0, 0.8, 0] });
pose('lie on back (crib crash)', 'lie', { arms: 'out', knees: 0.5 }, { face: 'shocked', top: true, look: [0, 0.2, 0], yaw0: Math.PI });
pose('lieFront (face on the floor)', 'lieFront', { arms: 'cheek' }, { face: 'sad', look: [0, 0.25, 0], h: 0.7, headYaw: 0.9 });
pose('fly (shoulder first)', 'fly', {}, { face: 'huss', look: [0, 1.0, 0] });
pose('fly superman', 'fly', { variant: 'superman' }, { face: 'shocked', look: [0, 1.0, 0] });
pose('fall (backward)', 'fall', {}, { face: 'shocked', look: [0, 1.0, 0] });
pose('backUp cycle (scared)', 'backUp', {}, { face: 'terrified', move: -BACKUP_SPEED });
pose('sprint cycle', 'sprint', {}, { face: 'determined' });
pose('charge (shoulder-first run)', 'charge', {}, { face: 'huss' });
pose('shove (shoulder into door)', 'shove', {}, { props: 'doorShoulder', face: 'huss', camOff: 0.9, look: [0, 1.0, 0] });
pose('shove both hands', 'shove', { hands: 'both' }, { props: 'door', face: 'huss', camOff: 0.9, look: [0, 1.0, 0] });
pose('hold presets: torch at chin / pan raised', 'idle', (ctx, lt) => ({ reachR: 'chin', reachL: 'raised' }), { face: 'determined', look: [0, 1.1, 0] });
pose('hold presets: behind back / belly', 'idle', { reachR: 'behindBack', reachL: 'behindBack' }, { ids: ['dadN', 'momN'], xs: [-0.6, 0.7], face: 'sweat', yaws: [0, -2.2], set: 'night', R: 5.4 });

// family two-character beats
add({
  name: 'leanIn: Pip ear on Mom\'s stomach (lean 0→1)', set: 'night', cast: ['momN', 'pipN'],
  focus: { target: 'pipN', aperture: 0.4 },
  setup(ctx) { ctx.place('momN', [-0.35, 0, 0], { yaw: Math.PI / 2 }); ctx.place('pipN', [0.3, 0, 0], { yaw: -Math.PI / 2 }); },
  update(ctx, lt) {
    const pip = ctx.cast.pipN, mom = ctx.cast.momN;
    pip.pose('leanIn', lt, { lean: Math.min(1, 0.3 + lt), side: 'R', hands: 'hug', dist: 0.36, blanket: 'drag', blanketHand: 'L' });
    pip.face('relieved', ctx.t);
    pip.root.updateMatrixWorld(true);
    const top = pip.joints.head.localToWorld(new THREE.Vector3(0, 0.6, -0.05));
    mom.pose('idle', lt, { reachR: 'belly', reachL: top, headPitch: 0.35 }); mom.face('smile', ctx.t);
    ctx.cam.set({ pos: [0.3, 1.3, 4.6], look: [0, 0.95, 0], fov: 38 });
  },
});
add({
  name: 'hugNeck: Pip kneels, arms round my neck (I lie)', set: 'day', cast: ['me', 'pip'],
  focus: { target: 'pip', aperture: 0.3 },
  setup(ctx) { ctx.place('me', [0.4, 0, 0], { yaw: Math.PI / 2 }); ctx.place('pip', [-0.45, 0, -0.75], { yaw: 0 }); },
  update(ctx, lt) {
    ctx.cast.me.pose('lie', lt, { arms: 'side', knees: 0.3, headLift: 0.3 }); ctx.cast.me.face('smile', ctx.t);
    ctx.cast.me.root.updateMatrixWorld(true);
    const neck = ctx.cast.me.joints.head.localToWorld(new THREE.Vector3(0, 0.12, 0));
    ctx.cast.pip.pose('hugNeck', lt, { target: neck, kneel: true });
    ctx.cast.pip.face('grin', ctx.t);
    ctx.cam.set({ pos: [-0.2, 3.6, 2.4], look: [-0.2, 0.25, -0.1], fov: 44 });
  },
});
add({
  name: 'Mom belly laugh (laugh + reach belly)', set: 'day', cast: ['mom', 'pip'],
  setup(ctx) { ctx.place('mom', [-0.4, 0, 0], { yaw: 0.2 }); ctx.place('pip', [0.7, 0, 0.4], { yaw: -0.4 }); },
  update(ctx, lt) {
    ctx.cast.mom.pose('laugh', lt, { reachL: 'belly', reachR: 'belly' }); ctx.cast.mom.face('laugh', ctx.t);
    ctx.cast.pip.pose('idle', lt, { reachR: 'point' }); ctx.cast.pip.face('shocked', ctx.t);
    ctx.cam.set({ pos: [0, 1.3, 5.2], look: [0, 1.0, 0], fov: 40 });
  },
});
add({
  name: 'Pip clutching blanket / drag walk', set: 'night', cast: ['pipN', 'pipN2'],
  focus: { target: 'pipN', aperture: 0.3 },
  setup(ctx) { ctx.place('pipN', [-0.45, 0, 0], { yaw: 0 }); ctx.place('pipN2', [0.5, 0, 0], { yaw: -0.9 }); },
  update(ctx, lt) {
    ctx.cast.pipN.pose('idle', lt, { reachL: 'chest', reachR: 'chest', blanket: 'clutch' }); ctx.cast.pipN.face('sleepy', ctx.t);
    ctx.cast.pipN2.pose('walk', lt, { blanket: 'drag', blanketHand: 'L', reachL: 'out' }); ctx.cast.pipN2.face('sad', ctx.t);
    ctx.cam.set({ pos: [0, 1.0, 4.2], look: [0, 0.65, 0], fov: 40 });
  },
});

export const shots = SHOTS;
export const SHOT_COUNT = SHOTS.length;
