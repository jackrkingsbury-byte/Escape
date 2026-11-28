/*
 * src/kits/test_props.js — look-dev / regression stills for the prop kit (src/kits/props_home.js) through the series
 * look (src/lib/look.js). One shot per second (render the middle of each second):
 *   node render.mjs --timeline src/kits/test_props_timeline.json --shots /src/kits/test_props.js --scale 0.75 \
 *        --preview 1 --times 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5,14.5,15.5,16.5,17.5 \
 *        --previewDir out/props_test --workers 1 --timeout 3000
 * Shots (set · lighting · what it checks):
 *   0  studio  warm   PROP TABLE turntable A: every big prop around me (2.0 m) and Pip (0.7) for scale
 *   1  studio  warm   turntable B (other side, low)
 *   2  studio  night  lantern STATES macro (fov 24): lit · flare · going out (smoke, folding) · folded · relighting
 *                     (unfold + flare) · crayon BABY tag swinging after a tap
 *   3  studio  night  the same row from the other side (tags read from both faces); 'out' on MOM + blank (b10)
 *   4  studio  warm   top-down: half-built crib whose sides fall flat (fallAt 4.2) around me lying in it, flat-pack
 *                     box face up, paint tray, screwdriver
 *   5  studio  warm   ULTRASOUND macro insert in Mom's hand (fov 22, DOF on the card)
 *   6  studio  night  hall table with lamp key + FAMILY PHOTO insert, focus on the photo
 *   7  studio  dark   TORCH: shadowed spot + beam cone + dust fall, sweeping the coats (one parted)
 *   8  studio  night  wardrobe lying on its back (setup-A height check) + me hauling, stool, broom
 *   9  studio  night  floor-level doormat: four pairs side by side, coat hooks above
 *   10 studio  fridge pickle jar + ice-cream tub + dipped pickle with a drip (macro)
 *   11 studio  warm   paint tin with drips, roller, tray, screwdriver, instruction sheet, crib box standing
 *   12 studio  dark   attic top-down: box + cobwebs + loaf + 4 eye glints + 2 ringed tails in a torch beam
 *   13 studio  warm   wall of text props: calendar, crayon drawings column, NO BROTHERS sign, sticky note
 *   14 studio  warm   BAKERY sign, phone screen, letter, labelled box, parcel with socks
 *   15 home    night_lamp  SETUP A with the real lantern row on the porch hooks (tags), wardrobe lying on its back
 *   16 home    night_lamp  beam macro from the porch (fov 24): flare on the blank tag (S03)
 *   17 home    night_lamp  hall-table insert with the kit's family photo (home option photo:false)
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MAIN, FAMILY_NIGHT } from '../cast.js';
import { buildHome, HOME_CAMS } from './home.js';
import { renderFrame as lookRender, focusOn, MOODS, tuneShadow } from '../lib/look.js';
import { getHomePBR } from '../real/textures_home.js';
import * as K from './props_home.js';

export const renderFrame = lookRender;
export const lazySets = false;
export const captionOptions = {};

const PIP = { ...FAMILY_NIGHT.pip, accessories: [] };
export const cast = { me: MAIN.me, pip: PIP, mom: FAMILY_NIGHT.mom };

// ─────────────────────────────────────────────── studio set ───────────────────────────────────────────────────────
function buildStudio(ctx) {
  const root = new THREE.Group(); root.name = 'studio';
  const fl = getHomePBR('floorboards').repeat(14 / 1.2, 14 / 2.4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: fl.map, normalMap: fl.normalMap, roughnessMap: fl.roughnessMap }));
  floor.receiveShadow = true; root.add(floor);
  const pl = getHomePBR('plaster').repeat(7, 2.25);
  const wallMat = new THREE.MeshStandardMaterial({ color: '#dcc6a4', map: pl.map, normalMap: pl.normalMap, roughnessMap: pl.roughnessMap });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.5), wallMat); back.position.set(0, 2.25, -3.2); back.receiveShadow = true; root.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.5), wallMat); left.position.set(-4.2, 2.25, 0); left.rotation.y = Math.PI / 2; left.receiveShadow = true; root.add(left);
  const skirting = new THREE.Mesh(new THREE.BoxGeometry(14, 0.14, 0.03), new THREE.MeshStandardMaterial({ color: '#f1ece0', roughness: 0.5 })); skirting.position.set(0, 0.07, -3.18); root.add(skirting);
  const hemi = new THREE.HemisphereLight('#ffe6c8', '#3a2a20', 0.5); root.add(hemi);
  const key = new THREE.SpotLight('#ffd2a0', 0, 22, 0.75, 0.6, 2); key.position.set(3.2, 5.2, 5.2);
  const keyT = new THREE.Object3D(); keyT.position.set(0, 0.6, 0); root.add(keyT); key.target = keyT;
  tuneShadow(key, { mapSize: 1024, radius: 4, near: 1, far: 20 }); root.add(key);
  const fill = new THREE.PointLight('#9fb4dd', 0, 14, 2); fill.position.set(-3, 2.6, 4); root.add(fill);
  const pm = new THREE.PMREMGenerator(ctx.renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  const bg = new THREE.Color('#2a2420');
  const S = {
    root, anchors: {}, options: {}, background: bg, exposure: 1, mood: 'warm', envK: 0.35,
    set() {},
    setLighting(name) {
      const P = {
        warm: { key: 70, keyCol: '#ffd2a0', hemi: 0.45, fill: 6, env: 0.35, bg: '#2a2420', mood: 'warm' },
        night: { key: 0, keyCol: '#ffd2a0', hemi: 0.07, fill: 2.5, env: 0.05, bg: '#0b0f1a', mood: 'night' },
        dark: { key: 0, keyCol: '#ffd2a0', hemi: 0.02, fill: 0.6, env: 0.015, bg: '#05070c', mood: 'dark' },
        fridge: { key: 55, keyCol: '#e4f0ff', hemi: 0.05, fill: 0.8, env: 0.06, bg: '#05070c', mood: 'dark' },
      }[name] || {};
      key.intensity = P.key; key.color.set(P.keyCol); key.visible = true;
      hemi.intensity = P.hemi; fill.intensity = P.fill; S.envK = P.env; bg.set(P.bg); S.mood = P.mood;
      if (name === 'fridge') { key.position.set(0.2, 1.6, 1.6); keyT.position.set(0, 0.8, 0); } else { key.position.set(3.2, 5.2, 5.2); keyT.position.set(0, 0.6, 0); }
    },
    update() { ctx.scene.environment = env; ctx.scene.environmentIntensity = S.envK; },
    post: () => MOODS[S.mood] || {},
  };
  S.setLighting('warm');
  return S;
}

export const sets = {
  studio: (ctx) => buildStudio(ctx),
  home: (ctx) => buildHome(ctx, { lighting: 'night_lamp' }),
};

// ─────────────────────────────────────────────── props (built once) ───────────────────────────────────────────────
export function init(ctx) {
  const P = ctx.props;
  P.wardrobe = K.makeWardrobe();
  P.wardrobe2 = K.makeWardrobe();
  P.table = K.makeHallTable();
  P.stool = K.makeStool();
  P.broom = K.makeBroom();
  P.mat = K.makeDoormat();
  P.coats = K.makeCoatHooks();
  P.crib = K.makeCrib();
  P.cribBox = K.makeCribBox();
  P.cribBox2 = K.makeCribBox();
  P.tin = K.makePaintTin();
  P.roller = K.makePaintRoller();
  P.tray = K.makePaintTray();
  P.screwdriver = K.makeScrewdriver();
  P.sheet = K.makeInstructionSheet();
  P.box = K.makeCardboardBox({ label: '' });
  P.labelBox = K.makeLabelledBox('BABY CLOTHES', { w: 0.6, h: 0.45, d: 0.45, seed: 2 });
  P.parcel = K.makeParcel();
  P.jar = K.makePickleJar();
  P.tub = K.makeIceCreamTub();
  P.pickle = K.makePickle({ dip: 0.45 });
  P.us = K.makeUltrasound();
  P.sign = K.makeBakerySign();
  P.letter = K.makeLetter({ title: 'Dear Pip,', text: 'The lanterns count everyone who lives in this house. Even the ones you cannot see yet. Love, Mom x' });
  P.sticky = K.makeStickyNote({ text: 'BUY PICKLES!! + ice cream' });
  P.calendar = K.makeCalendar();
  P.phone = K.makePhone({ title: 'Mom', lines: [{ from: 'mom', text: 'out for pickles, back soon ❤' }, { from: 'me', text: 'AT MIDNIGHT??' }, { from: 'mom', text: 'cravings' }] });
  P.drawings = K.makeCrayonDrawings();
  P.doorSign = K.makeDoorSign();
  P.torch = K.makeTorchProp();
  P.torch2 = K.makeTorchProp({ beam: 0.3 });
  P.dustFall = K.makeDustBurst({ mode: 'fall', count: 220, size: [0.9, 0.05, 0.9], life: 2.4, intensity: 1.2, seed: 7 });
  P.cobweb = K.makeCobweb(); P.cobweb2 = K.makeCobweb({ size: 0.5 });
  P.loaf = K.makeLoaf();
  P.eyes = K.makeEyeGlints();
  P.tail = K.makeRaccoonTail(); P.tail2 = K.makeRaccoonTail({ length: 0.55 });
  P.pan = K.makeFryingPan();
  P.lantern = K.makeLantern({ tag: 'ME' });
  P.row6 = K.makeLanternRow({ count: 6, pitch: 0.34, tags: ['MOM', 'DAD', 'ME', 'PIP', '', 'BABY'], tagStyles: [, , , , , 'crayon'], beam: true, light: true, lightIntensity: 0.8 });
  P.rowHome = K.makeLanternRow({ count: 6, tags: ['MOM', 'DAD', 'ME', 'PIP', '', ''] });
  P.photo = K.makeFamilyPhoto();
}

const add = (ctx, obj, pos, rotY = 0, parent) => { ctx.add(obj, parent); obj.position.set(...pos); obj.rotation.set(0, rotY, 0); obj.scale.setScalar(1); return obj; };
const cam = (ctx, pos, look, fov) => ctx.cam.set({ pos, look, fov });

const tableLayout = (ctx) => {
  const P = ctx.props;
  add(ctx, P.wardrobe, [-2.6, 0, -2.9], 0);
  add(ctx, P.table, [-0.6, 0, -2.85], 0);
  add(ctx, P.coats, [1.4, 2.1, -3.18], 0);
  add(ctx, P.mat, [1.4, 0, -2.4], 0);
  add(ctx, P.crib, [2.6, 0, 0.2], -0.5);
  add(ctx, P.cribBox, [3.4, 0, -1.6], -0.9);
  add(ctx, P.stool, [-1.6, 0, 0.6], 0.5);
  add(ctx, P.broom, [-1.95, 0, -2.9], 0); P.broom.rotation.set(-0.12, 0, 0.05);
  add(ctx, P.tin, [1.3, 0, 1.4], 0.4);
  add(ctx, P.tray, [1.8, 0, 1.5], -0.3);
  add(ctx, P.roller, [1.75, 0.08, 1.45], 0.6);
  add(ctx, P.box, [-2.8, 0, 0.9], 0.3);
  add(ctx, P.parcel, [-0.3, 0, 1.7], 0.2);
  add(ctx, P.jar, [0.4, 0, 1.9], 0);
  add(ctx, P.tub, [0.75, 0, 1.95], 0);
  add(ctx, P.lantern, [-1.0, 2.0, 1.2], 0);
  P.lantern.userData.set(ctx.t, 'lit');
  P.table.userData.set(ctx.t, { lamp: 1 });
  P.crib.userData.set(ctx.t, {});
};

export const shots = [
  { name: 'prop table A', start: 0, set: 'studio', lighting: 'warm', cast: ['me', 'pip'],
    setup(ctx) { tableLayout(ctx); ctx.place('me', [0.1, 0, -0.6], { yaw: 0.2 }); ctx.place('pip', [0.9, 0, -0.2], { yaw: -0.3 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.pip.pose('idle', lt); ctx.cast.me.face('smile', ctx.t); ctx.cast.pip.face('smile', ctx.t);
      ctx.props.lantern.userData.set(ctx.t, 'lit');
      ctx.cam.orbit([0, 0.9, -0.5], 6.4, 2.4, 0.15 + lt * 0.2, 46);
    },
    focus: { target: 'me', aperture: 0.2 } },
  { name: 'prop table B', start: 1, set: 'studio', lighting: 'warm', cast: ['me', 'pip'],
    setup(ctx) { tableLayout(ctx); ctx.place('me', [0.1, 0, -0.6], { yaw: 0.2 }); ctx.place('pip', [0.9, 0, -0.2], { yaw: -0.3 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.pip.pose('idle', lt);
      ctx.props.lantern.userData.set(ctx.t, 'lit');
      ctx.cam.orbit([0.3, 0.7, -0.6], 5.4, 1.1, -0.75 + lt * 0.2, 50);
    },
    focus: { target: 'pip', aperture: 0.2 } },
  { name: 'lantern states', start: 2, set: 'studio', lighting: 'night', cast: [],
    setup(ctx) { add(ctx, ctx.props.row6, [0, 2.4, 0], 0); },
    update(ctx, lt) {
      ctx.props.row6.userData.set(ctx.t, [
        'lit',
        { initial: 'lit', events: [{ at: 2.38, do: 'flare' }] },
        { initial: 'lit', events: [{ at: 2.2, do: 'out' }] },
        'folded',
        { initial: 'folded', events: [{ at: 2.25, do: 'light' }] },
        { initial: 'lit', events: [{ at: 2.0, do: 'tap' }] },
      ]);
      cam(ctx, [0.15, 1.95, 3.3], [0, 2.05, 0], 24); ctx.cam.shake(0.03, ctx.t, 2);
    },
    focus: { target: [0, 2.05, 0], aperture: 0.5 } },
  { name: 'lantern row inside', start: 3, set: 'studio', lighting: 'night', cast: [],
    setup(ctx) { add(ctx, ctx.props.row6, [0, 2.4, 0], 0); },
    update(ctx, lt) {
      ctx.props.row6.userData.set(ctx.t, (i) => (i === 0 || i === 4 ? { initial: 'lit', events: [{ at: 3.05, do: 'out' }] } : i === 5 ? 'folded' : 'lit'));
      cam(ctx, [-0.3, 1.5, -3.4], [0, 2.1, 0], 30); ctx.cam.shake(0.03, ctx.t, 3);
    },
    focus: { target: [0, 2.1, 0], aperture: 0.4 } },
  { name: 'crib top-down', start: 4, set: 'studio', lighting: 'warm', cast: ['me'],
    setup(ctx) {
      const P = ctx.props;
      add(ctx, P.crib, [0, 0, 0], 0); add(ctx, P.cribBox2, [-0.2, 0, -1.25], 0.05); add(ctx, P.tray, [1.3, 0, -0.7], 0.3); add(ctx, P.screwdriver, [-1.1, 0.02, 0.7], 1.0);
      P.cribBox2.userData.set(ctx.t, { lying: true });
      ctx.place('me', [0.15, 0.36, 0.15], { yaw: -Math.PI / 2 });
    },
    update(ctx, lt) {
      ctx.cast.me.pose('lie', lt, { arms: 'out', knees: 0.4 }); ctx.cast.me.face('shocked', ctx.t);
      ctx.props.crib.userData.set(ctx.t, { sides: 0, fallAt: 4.2 });
      ctx.props.tray.userData.set(ctx.t, { rockAt: 4.25 });
      cam(ctx, [0.05, 5.4, 0.25], [0, 0, -0.35], 50);
    },
    focus: { target: 'me', aperture: 0.25 } },
  { name: 'ultrasound insert', start: 5, set: 'studio', lighting: 'warm', cast: ['mom'],
    setup(ctx) { ctx.place('mom', [0, 0, 0], { yaw: 0 }); ctx.add(ctx.props.us, ctx.cast.mom.joints.handR); ctx.props.us.position.set(0, 0.02, 0.1); ctx.props.us.rotation.set(-0.2, 0, 0); },
    update(ctx, lt) {
      ctx.cast.mom.pose('idle', lt, { reachR: 'out' }); ctx.cast.mom.face('smile', ctx.t);
      ctx.props.us.userData.set(ctx.t, {});
      ctx.scene.updateMatrixWorld(true);
      const p = ctx.props.us.getWorldPosition(new THREE.Vector3());
      cam(ctx, [p.x + 0.12, p.y + 0.06, p.z + 0.62], [p.x, p.y, p.z], 22);
      focusOn(ctx, ctx.props.us, { aperture: 1.2 });
    } },
  { name: 'family photo insert', start: 6, set: 'studio', lighting: 'night', cast: [],
    setup(ctx) { add(ctx, ctx.props.table, [0, 0, -2.85], 0); },
    update(ctx, lt) {
      ctx.props.table.userData.set(ctx.t, { lamp: 1, bumpAt: 6.3 });
      cam(ctx, [0.45, 1.25, -1.95], [0.3, 1.13, -2.9], 30);
      focusOn(ctx, ctx.props.table.userData.photo, { aperture: 0.9, offset: [0, 0.15, 0] });
    } },
  { name: 'torch sweep', start: 7, set: 'studio', lighting: 'dark', cast: ['me'],
    setup(ctx) {
      add(ctx, ctx.props.coats, [0.4, 2.1, -3.18], 0); add(ctx, ctx.props.mat, [0.4, 0, -2.5], 0); add(ctx, ctx.props.torch, [0, 0, 0], 0);
      add(ctx, ctx.props.dustFall, [0.4, 2.6, -2.6], 0);
      ctx.place('me', [-0.9, 0, 0.6], { yaw: Math.PI * 0.85 });
    },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt, { reachR: 'chest', headYaw: 0.3 }); ctx.cast.me.face('determined', ctx.t);
      ctx.scene.updateMatrixWorld(true);
      const h = ctx.cast.me.joints.handR.getWorldPosition(new THREE.Vector3());
      ctx.props.torch.userData.aim(h, new THREE.Vector3(0.1 + lt * 0.8, 1.4, -3.1));
      ctx.props.torch.userData.set(ctx.t, { onAt: 7.02 });
      ctx.props.coats.userData.set(ctx.t, { part: { i: 2, amount: 0.8 }, swayAt: 7.1 });
      ctx.props.dustFall.userData.set(ctx.t, { at: 6.6 });
      cam(ctx, [-2.4, 1.1, 1.6], [0.0, 1.3, -2.4], 40); ctx.cam.shake(0.06, ctx.t, 7);
    },
    focus: { target: 'me', aperture: 0.25 } },
  { name: 'wardrobe on its back', start: 8, set: 'studio', lighting: 'night', cast: ['me'],
    setup(ctx) {
      add(ctx, ctx.props.wardrobe, [0.2, 0, -0.2], 0); add(ctx, ctx.props.wardrobe2, [-2.4, 0, -2.6], 0);
      add(ctx, ctx.props.stool, [1.7, 0, -1.4], -0.4); add(ctx, ctx.props.broom, [2.2, 0, -2.9], 0); ctx.props.broom.rotation.set(-0.1, 0, -0.1);
      add(ctx, ctx.props.table, [-0.3, 0, -2.85], 0);
      ctx.place('me', [0.25, 0, 0.75], { yaw: Math.PI });
    },
    update(ctx, lt) {
      ctx.cast.me.pose('haul', lt); ctx.cast.me.face('determined', ctx.t);
      ctx.props.wardrobe.userData.set(ctx.t, { tilt: 1, thudAt: 8.1 });
      ctx.props.wardrobe2.userData.set(ctx.t, { tilt: 0, doors: 0.25 });
      ctx.props.stool.userData.set(ctx.t, { tipAt: 8.25 });
      ctx.props.table.userData.set(ctx.t, { lamp: 1 });
      cam(ctx, [0.3, 0.6, 3.6], [0.1, 1.2, -2], 34); ctx.cam.shake(0.05, ctx.t, 8);
    },
    focus: { target: 'me', aperture: 0.3 } },
  { name: 'doormat floor', start: 9, set: 'studio', lighting: 'night', cast: [],
    setup(ctx) { add(ctx, ctx.props.mat, [0, 0, -2.5], 0); add(ctx, ctx.props.coats, [0.2, 2.1, -3.18], 0); add(ctx, ctx.props.table, [-1.6, 0, -2.85], 0); },
    update(ctx, lt) {
      ctx.props.mat.userData.set(ctx.t, {}); ctx.props.coats.userData.set(ctx.t, {}); ctx.props.table.userData.set(ctx.t, { lamp: 1 });
      cam(ctx, [0.1, 0.18, -1.0], [0, 0.65, -3.2], 60);
    },
    focus: { target: [0, 0.15, -2.5], aperture: 0.3 } },
  { name: 'fridge insert', start: 10, set: 'studio', lighting: 'fridge', cast: [],
    setup(ctx) {
      add(ctx, ctx.props.jar, [-0.22, 0.6, 0], 0.4); add(ctx, ctx.props.tub, [0.16, 0.6, 0.05], 0);
      const pk = add(ctx, ctx.props.pickle, [0.17, 0.92, 0.07], 0); pk.rotation.set(-1.15, 0.3, 0);
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.03, 0.8), new THREE.MeshStandardMaterial({ color: '#e8eef4', roughness: 0.2, transparent: true, opacity: 0.85 }));
      shelf.position.set(0, 0.585, 0); shelf.receiveShadow = true; ctx.add(shelf);
    },
    update(ctx, lt) {
      ctx.props.pickle.userData.set(ctx.t, { dip: 0.45, drip: 0.6 + 0.4 * Math.sin(ctx.t * 3) });
      ctx.props.pickle.position.y = 0.92 + 0.03 * Math.sin(lt * 2);
      cam(ctx, [0.05, 0.98, 0.95], [-0.02, 0.8, 0], 26);
      focusOn(ctx, ctx.props.pickle, { aperture: 1.1 });
    } },
  { name: 'paint + tools', start: 11, set: 'studio', lighting: 'warm', cast: [],
    setup(ctx) {
      const P = ctx.props;
      add(ctx, P.tin, [-0.35, 0, 0], 0.4); add(ctx, P.tray, [0.25, 0, 0.05], -0.3); add(ctx, P.roller, [0.15, 0.08, 0.05], 0.9);
      add(ctx, P.screwdriver, [-0.1, 0.02, 0.45], 0.8); add(ctx, P.cribBox, [0.1, 0, -0.9], 0.1);
      const sh = add(ctx, P.sheet, [-0.75, 0.002, 0.35], 0); sh.rotation.set(-Math.PI / 2, 0, 0.3);
    },
    update(ctx, lt) {
      ctx.props.tin.userData.set(ctx.t, {}); ctx.props.tray.userData.set(ctx.t, {}); ctx.props.cribBox.userData.set(ctx.t, {});
      cam(ctx, [0.4, 1.25, 1.75], [-0.1, 0.25, -0.1], 36);
    },
    focus: { target: [-0.3, 0.2, 0.0], aperture: 0.45 } },
  { name: 'attic top-down', start: 12, set: 'studio', lighting: 'dark', cast: [],
    setup(ctx) {
      const P = ctx.props;
      add(ctx, P.box, [0.6, 0, -0.5], 0.4); add(ctx, P.loaf, [-0.15, 0, 0.1], 0.6);
      add(ctx, P.eyes, [-0.1, 0.25, -0.45], 0); add(ctx, P.tail, [0.25, 0.06, 0.2], 0.9); add(ctx, P.tail2, [-0.55, 0.06, -0.1], 2.5);
      add(ctx, P.cobweb, [-1.2, 0.9, -0.9], 0.4); add(ctx, P.cobweb2, [0.9, 0.7, -1.2], -0.3);
      add(ctx, P.torch2, [0, 0, 0], 0);
      add(ctx, P.dustFall, [0, 1.6, 0], 0);
    },
    update(ctx, lt) {
      const P = ctx.props;
      P.torch2.userData.aim(new THREE.Vector3(0.6, 3.0, 1.2), new THREE.Vector3(-0.05, 0, -0.1));
      P.torch2.userData.set(ctx.t, {});
      P.eyes.userData.set(ctx.t, { on: 1 }); P.tail.userData.set(ctx.t, { curl: 1.2 }); P.tail2.userData.set(ctx.t, { curl: -0.9 });
      P.cobweb.userData.set(ctx.t, {}); P.cobweb2.userData.set(ctx.t, {});
      P.dustFall.userData.set(ctx.t, { at: 11.8 });
      cam(ctx, [0.0, 3.6, 0.35], [0, 0, -0.15], 46);
    },
    focus: { target: [0, 0.1, -0.1], aperture: 0.25 } },
  { name: 'text wall', start: 13, set: 'studio', lighting: 'warm', cast: [],
    setup(ctx) {
      const P = ctx.props;
      add(ctx, P.calendar, [-0.55, 1.6, -3.17], 0); add(ctx, P.drawings, [0.25, 2.05, -3.17], 0); add(ctx, P.doorSign, [0.95, 1.55, -3.17], 0);
      add(ctx, P.sticky, [-0.05, 1.3, -3.17], 0); P.sticky.rotation.z = 0.08;
    },
    update(ctx, lt) { cam(ctx, [0.15, 1.35, -1.1], [0.15, 1.35, -3.2], 50); },
    focus: { target: [0.15, 1.4, -3.17], aperture: 0.25 } },
  { name: 'sign + phone + letter', start: 14, set: 'studio', lighting: 'warm', cast: [],
    setup(ctx) {
      const P = ctx.props;
      add(ctx, P.sign, [0, 2.3, -2.4], 0); add(ctx, P.labelBox, [-0.8, 0, -1.4], 0.3); add(ctx, P.parcel, [0.75, 0, -1.2], -0.3);
      const ph = add(ctx, P.phone, [0.1, 0.008, -0.85], 0); ph.rotation.set(-Math.PI / 2, 0, -0.2);
      const le = add(ctx, P.letter, [-0.3, 0.003, -0.75], 0); le.rotation.set(-Math.PI / 2, 0, 0.25);
    },
    update(ctx, lt) {
      ctx.props.parcel.userData.set(ctx.t, { socks: 1 }); ctx.props.letter.userData.set(ctx.t, { fold: 0.15 }); ctx.props.sign.userData.set(ctx.t, {}); ctx.props.phone.userData.set(ctx.t, {}); ctx.props.labelBox.userData.set(ctx.t, {});
      cam(ctx, [0.1, 1.7, 0.6], [0, 0.9, -1.6], 44);
    },
    focus: { target: [0, 0.3, -1.1], aperture: 0.2 } },
  { name: 'home setup A lanterns', start: 15, set: 'home', lighting: 'night_lamp', cast: ['me'], options: { lanterns: 0 },
    setup(ctx) {
      ctx.add(ctx.props.rowHome); K.hangOnHooks(ctx, ctx.props.rowHome);
      add(ctx, ctx.props.wardrobe, [0.15, 0, 8.4], 0); ctx.props.wardrobe.rotation.y = 0.12;
      ctx.place('me', [0.25, 0, 8.55], { yaw: Math.PI - 0.15 });
    },
    update(ctx, lt) {
      ctx.props.rowHome.userData.set(ctx.t, 5);
      ctx.props.wardrobe.userData.set(ctx.t, { tilt: 1 });
      ctx.cast.me.pose('haul', lt); ctx.cast.me.face('determined', ctx.t);
      const c = HOME_CAMS.setupA; ctx.cam.set({ pos: c.pos, look: c.look, fov: c.fov }); ctx.cam.shake(0.06, ctx.t, 15);
    },
    focus: { target: 'me', aperture: 0.3 } },
  { name: 'home beam macro', start: 16, set: 'home', lighting: 'night_lamp', cast: [], options: { lanterns: 0, outdoors: true },
    setup(ctx) { ctx.add(ctx.props.rowHome); K.hangOnHooks(ctx, ctx.props.rowHome); },
    update(ctx, lt) {
      ctx.props.rowHome.userData.set(ctx.t, (i) => (i === 4 ? { initial: 'lit', events: [{ at: 16.3, do: 'flare' }] } : i < 5 ? 'lit' : 'folded'));
      const u = lt;
      ctx.cam.set({ pos: [1.0 - 0.9 * u, 2.2, 13.0], look: [0.3 - 0.9 * u, 2.25, 12.15], fov: 24 }); ctx.cam.shake(0.03, ctx.t, 16);
      focusOn(ctx, ctx.props.rowHome.userData.lanterns[4], { aperture: 0.8, offset: [0, -0.32, 0] });
    } },
  { name: 'home hall table photo', start: 17, set: 'home', lighting: 'night_lamp', cast: [], options: { photo: false },
    setup(ctx) { ctx.add(ctx.props.photo); ctx.place(ctx.props.photo, 'hall.table.photo'); ctx.props.photo.rotation.y += Math.PI / 2 * 0; },
    update(ctx, lt) {
      ctx.props.photo.userData.set(ctx.t, {});
      const c = HOME_CAMS.hallTable; ctx.cam.set({ pos: c.pos, look: c.look, fov: c.fov }); ctx.cam.shake(0.03, ctx.t, 17);
      focusOn(ctx, ctx.props.photo, { aperture: 0.9, offset: [0, 0.16, 0] });
    } },
];
