/*
 * src/kits/showcase.js — the v2 INTEGRATION SHOWCASE: a 30 s, 22-shot mini-episode that uses every v2 kit together
 * exactly the way a v2 episode (ep30 and on) will. Read it as the reference shots module for episode builders.
 * Timeline: src/kits/showcase_timeline.json (hand-made: 11 beats, red words, one chat bubble, markers bub1 / bub1end /
 * jump; regenerate with any script that writes the same shape — words are evenly spaced inside each beat).
 *
 *   cd /home/user/Escape/inthistown && node render.mjs --timeline src/kits/showcase_timeline.json \
 *      --shots /src/kits/showcase.js --scale 0.75 --preview 1 --workers 1 --timeout 3000 --previewDir out/v2_showcase_final \
 *      --times 0.7,1.9,2.95,4.1,5.3,6.4,7.3,8.4,9.6,10.4,11.4,12.9,14.5,15.95,16.9,18.1,19.3,20.7,22.4,24.2,26.4,28.6
 *
 * ─── What it uses (kit → where) ─────────────────────────────────────────────────────────────────────────────────────
 *   src/lib/look.js        export renderFrame (warm series preset, set.post MOOD per lighting state) + DOF on every shot
 *                          (the direct.js helpers call focusOn; shot 17 uses focusPull) + the SUBJECT LIGHT (lightOn:
 *                          camera-relative key + rim on every helper's subject; shots 1, 8, 9, 11, 20 call it directly)
 *   src/kits/home.js       one 'home' set, 6 lighting states: night_lamp, night_torch, dark_practical (fridge, strip),
 *                          boxroom_lamp, morning (+ outdoors beam macro). Options driven per shot (hatchOpen, fridgeOpen,
 *                          boxDoorOpen, stripFeet, frontDoorOpen, photo:false, shoes:false)
 *   src/cast.js            me = MAIN_V2.me (toy finish, headphones ON the head); NIGHT outfits keep the plain ids
 *                          (mom, dad, pip — the timeline bubble says who: 'pip'), day outfits re-id'd momDay / dadDay /
 *                          pipDay; export bubbleAnchor(ctx, who) maps 'pip' to whichever Pip is in the shot
 *   src/characters.js      v2 poses: drag, heave, pushUp, crouch, shove, kneel(work), leanIn, hugNeck, + reach
 *                          overrides (torch hands, tin behind the back, scan card at the chest, belly laugh) and the
 *                          v2 faces (scared, terrified, heartbroken, relieved, crying)
 *   src/kits/props_home.js lantern rows on porch.hook.0..5 (night: MOM DAD ME PIP + blank, 6th folded; morning: 6th
 *                          'BABY' in crayon lights with a flare), wardrobe (drag on its back, heave), dust fall,
 *                          pickle jar + ice-cream tub + dipped pickle, paint tin, crib + flat-pack box + tray + roller,
 *                          ultrasound card, family photo on hall.table.photo, crayon drawings on hall.pipDoor.drawings
 *   src/direct.js          lowHero + whipIn (0), preset + pushIn(spec) + handheld (1, 8, 9, 12), hussBeat double (2) and
 *                          single (13), insert (3, 10, 17), wide + pushIn (4, 21), ots (5), ecu (6, 18), pov (7),
 *                          closeUp + dutch (11), topDown (14), closeUp (15, 16, 19), dipWhite (19 → 20), bookend (20 = 1)
 *   src/engine.js          captionOptions { preset: 'v2' }, per-beat red words, Pip's chat bubble (b03, cast id pip)
 *
 * ─── Integration rules this module demonstrates (copy them) ─────────────────────────────────────────────────────────
 *   • configureDirect({ focusOn, bounds }) once; bounds come from the shot def (`room`: 'hall' | 'box' | 'kitchen' |
 *     null = unclipped) so helper cameras never end up inside a wall.
 *   • Props are built once in init(ctx) on ctx.props; each shot ctx.add()s what it shows and drives userData.set(t, …)
 *     in update. Hand-held props (paint tin, scan card, torch) are positioned from the posed hand's WORLD position every
 *     frame (pose first → updateMatrixWorld → read joints.handR), never parented with guessed joint offsets.
 *   • A lantern row through the door glass: home option lanterns:0 (default), ctx.add(row), hangOnHooks(ctx, row); the
 *     home's porchGlow is the shared light (row light:false).
 *   • Day + night outfits in one film need distinct ids: the NIGHT ones keep 'mom' / 'dad' / 'pip' (most ep30 shots are
 *     night and the timeline bubbles say who: 'pip'); familySpec('pip', 'day', { id: 'pipDay' }) for the day ones.
 *   • configureDirect({ focusOn, lightOn, bounds }): every helper also keys + rims its subject (key 'auto' follows the
 *     home state). key:false + rim = silhouette with an edge (S9 uses key 0.4 / rim 1.3).
 *   • Faces sit at frame y 0.26–0.30 (0.4–0.45 in SETUP A); closeUp keeps hair, shoulders and arms (size 0.22, fov 44);
 *     the ecu shows the whole head; HUSS beats use hussBeat(…, { camera }) = a medium-close (both arms + the load).
 *   • Two-character emotional beats (S16 leanIn, S19 hugNeck): turn both bodies ~0.5 rad toward the lens (a V) and shoot
 *     3/4 FRONT; the child's face turns to the camera with pose params faceCam + cam (get cam.pos from the helper with
 *     apply:false first — AFTER posing the subject this frame, or the camera depends on the previous frame's pose and
 *     sequential renders differ from random access). blockingCheck(ctx) after the camera warns when a principal's head is > 30 % covered.
 *   • SETUP A at our scale (S1 / S20): camera (0.05, 0.6, 4.0), tilt 3°, fov 34; me ≈ 4.9 m away with drag low 0.5 →
 *     five lanterns ≈ 85 px at 21–24 % from the top, my face at y ≈ 0.45, the wardrobe a band along the bottom; subject
 *     light with keyDist 0.9 so the key does not wash the slab.
 *   • Attic: palms on the 3.4 m hatch = me on K.makeStepLadder({ h: 1.35 }) (S8); see the HATCH REACH table in home.js.
 *   • Lantern tags: night ['MOM','DAD','ME','PIP','', null] (the folded sixth has no tag); morning ['MOM','DAD','ME',
 *     'PIP','BABY' (crayon), ''] — the new sixth lantern carries the blank tag and lights with a flare.
 *   • One wardrobe for the whole film: K.makeWardrobe({ h: 2.3, d: 0.42 }) (drag S1, heave S2).
 *   • Glints: ch.face(expr, t, { glints: 5 }) (S6 Pip), { glints: 3 } (S18 me).
 *   • Everything in update is a pure function of ctx.t / lt (no state carried between frames).
 *
 *   • Helper cameras are clipped to the room box by sliding TOWARD the subject: in the 2.6 m hall shoot along the hall
 *     (z), not across it, or a 'closeUp' turns into an extreme close-up against the wall (shots 11, 16, 19 learned it).
 *   • Keep practicals ≥ 1.5 m from faces or dim them per shot (options lamp: 0.6, boxRoomLight: 0.35, torch: 0.8);
 *     morning shots looking out of the open door want shafts: 0.35–0.5 or the doorway washes out.
 *   • SETUP A haul/drag: pose('drag', t, { low: 0.75 }) keeps my head under the lantern row (occlusion envelope).
 *   • POV looking UP with hands in frame: pov(ctx, 'me', { at, eye: [0, 0.3, -0.25], atMinY: 0.07 }).
 *
 * ─── Integration fixes made in the kits while building this (all v2-only code; old episodes byte-identical) ─────────
 *   src/lib/look.js     makeLamp / makeTorch / makeFridgeLight spots decay 1 (was 2: faces and fridge shelves blew out
 *                       within ~1 m); fridge key moved to just outside the open front + soft interior fill (inserts of the
 *                       shelves were pure white). Intensities matched to the old look at 2.5–3 m.
 *   src/kits/home.js    box-room work lamp spot decay 1 (Dad's face blew out at the crib).
 *   src/kits/props_home.js  makeTorchProp spot decay 1 (same as look.makeTorch).
 *   src/characters.js   haul / drag: opt-in `low` param (deeper bend) — the default pose put my head over the lanterns.
 *   src/direct.js       pov(): hands behind the eye plane were treated as "in frame" (mirrored projection) so the camera
 *                       never tilted to them; header note on the eye for looking-up POVs.
 *
 * Look fix pass (subject light, room fill, framing, toy finish, grade, DOF, morning, fridge, AO/normal noise, crayon
 *   tags, hatch reach, glints, head headphones, ids, tags, wardrobe, SETUP A): before out/v2_showcase, after
 *   out/v2_showcase_final. Frame mean luma 0.22 → 0.46 (references 0.43–0.52), pixels < 0.06 31 % → 4.5 % (refs 4 %).
 *
 * Measured before the fix pass (SwiftShader 4 CPU, scale 0.75 = 810×1440, --workers 1, full look.js post incl. AO + DOF + bloom, render.mjs
 *   --bench 8, render only): night family wide (4 characters, 301 draw calls) 2.64 s/frame, torch hatch 2.19, fridge
 *   (dark_practical) 2.79, box room topDown 2.47, morning family (4 characters) 2.50, whip/low hero 2.19 — all under the
 *   5 s budget. 22-frame preview incl. page load + set build ≈ 70–80 s. --check-determinism on 10 probes (whip, drag,
 *   double HUSS, flare, pushUp + dust, Dad, single HUSS + door, focus pull, dip/bookend + lantern light, family):
 *   identical across orders and processes.
 */
import * as THREE from 'three';
import { MAIN_V2, FAMILY_NIGHT, familySpec } from '../cast.js';
import { buildHome, HOME_CAMS } from './home.js';
import { renderFrame as lookRender, focusOn, focusPull, lightOn } from '../lib/look.js';
import * as K from './props_home.js';
import {
  configureDirect, boxBounds, closeUp, ecu, wide, ots, pov, insert, lowHero, topDown, dutch, pushIn, handheld, whipIn,
  dipWhite, bookend, hussBeat, hussFrame, shoot, blockingCheck,
} from '../direct.js';
import { clamp, smooth } from '../lib/util.js';

// ─────────────────────────────────────────────── direction setup ──────────────────────────────────────────────────
const ROOMS = {
  hall: boxBounds([-1.15, 0.12, 0.15], [1.15, 3.25, 9.85]),
  box: boxBounds([-1.75, 0.12, -3.65], [1.75, 3.25, -0.3]),
  kitchen: boxBounds([-1.15, 0.12, 0.15], [5.3, 3.25, 9.85]),
};
configureDirect({ focusOn, lightOn, bounds: (ctx) => { const r = ctx.shot && ctx.shot.room; return r === undefined ? ROOMS.hall : (r ? ROOMS[r] : null); } });

export const renderFrame = lookRender;
export const lazySets = false;
export const captionOptions = { preset: 'v2', bubble: { size: 50 } };
// ep30 id rule: most shots are at night → the NIGHT outfits get the plain ids (timeline bubbles say who: 'pip'), the
// day outfits are re-id'd (pipDay / momDay / dadDay)
export const cast = {
  me: MAIN_V2.me,
  mom: FAMILY_NIGHT.mom, dad: FAMILY_NIGHT.dad, pip: FAMILY_NIGHT.pip,
  momDay: familySpec('mom', 'day', { id: 'momDay' }), dadDay: familySpec('dad', 'day', { id: 'dadDay' }),
  pipDay: familySpec('pip', 'day', { id: 'pipDay' }),
};
/** chat-bubble tails: 'pip' / 'mom' / 'dad' point at whichever outfit of that person is in the current shot */
export function bubbleAnchor(ctx, who) {
  for (const id of [who, who + 'Day']) { const ch = ctx.cast[id]; if (ch && ch.root && ch.root.parent) return ch; }
  return undefined;
}
export const sets = { home: (ctx) => buildHome(ctx, { lighting: 'night_lamp' }) };

export function init(ctx) {
  const P = ctx.props;
  // night: four named + the BLANK fifth; the folded sixth has no tag at all (a folded lantern reads as nothing)
  P.rowNight = K.makeLanternRow({ count: 6, tags: ['MOM', 'DAD', 'ME', 'PIP', '', null] });
  // morning: the fifth tag now says BABY (crayon) and the NEW sixth lantern carries the blank tag (S51 / S52 / S56)
  P.rowMorning = K.makeLanternRow({ count: 6, tags: ['MOM', 'DAD', 'ME', 'PIP', 'BABY', ''], tagStyles: [, , , , 'crayon'] });
  // ONE wardrobe for the whole film (dragged on its back in SETUP A, heaved upright across Pip's door): 2.3 m covers
  // the 1.16 m door; depth 0.42 → lying it is a ≈0.52 m slab, under the 0.6 m SETUP A camera (its top reads as a band)
  P.wardrobe = K.makeWardrobe({ h: 2.3, d: 0.42 });
  P.ladder = K.makeStepLadder({ h: 1.35 });
  P.photo = K.makeFamilyPhoto();
  P.drawings = K.makeCrayonDrawings();
  P.dustFall = K.makeDustBurst({ mode: 'fall', count: 200, size: [0.9, 0.05, 0.9], life: 2.2, intensity: 0.5, seed: 31 });
  P.jar = K.makePickleJar();
  P.tub = K.makeIceCreamTub();
  P.pickle = K.makePickle({ dip: 0.6 });
  P.tin = K.makePaintTin();
  P.tin2 = K.makePaintTin();
  P.tray = K.makePaintTray();
  P.roller = K.makePaintRoller();
  P.crib = K.makeCrib({ stage: 'half' });
  P.cribBox = K.makeCribBox({ lying: true });
  P.scan = K.makeUltrasound({ glow: 0.5 });
}

// ─────────────────────────────────────────────── small helpers ────────────────────────────────────────────────────
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const put = (ctx, obj, pos, rotY = 0, parent) => { ctx.add(obj, parent); obj.position.set(...pos); obj.rotation.set(0, rotY, 0); return obj; };
const hang = (ctx, row) => { ctx.add(row); K.hangOnHooks(ctx, row); };
const nightRow = (ctx) => ctx.props.rowNight.userData.set(ctx.t, (i) => (i < 5 ? 'lit' : 'folded'));
/** world position of a joint (after pose) + a local offset */
function jointWorld(ch, joint, off = [0, 0, 0]) { ch.root.updateMatrixWorld(true); return ch.joints[joint].localToWorld(V(...off)); }
/** the family photo + crayon drawings dress the hall in every hall shot */
function dressHall(ctx) {
  ctx.add(ctx.props.photo); ctx.place(ctx.props.photo, 'hall.table.photo');
  ctx.add(ctx.props.drawings); ctx.place(ctx.props.drawings, 'hall.pipDoor.drawings');
}
const HALL_OPTS = { photo: false };

// shot 1's camera as a pure function (ctx, lt, u) so shot 20 can bookend it
function camS1(ctx, lt, u) {
  const c = HOME_CAMS.setupA;
  // SETUP A for our scale: camera pulled back to z 4.0 (kid height 0.6, tilt 3°) so a 0.64 m head 4.9 m away is 37 %
  // of the width and the five lanterns (≈ 85 px each at 1080) still sit at ≈ 21 % from the top
  pushIn(ctx, { pos: [0.05, 0.6, 4.0], look: [0, 0.6 + Math.tan(3.0 * Math.PI / 180) * 10, 14.0], fov: c.fov }, 0.04, { u });
  handheld(ctx, 0.06, { seed: 11 });
}
function camS0(ctx, lt, u) {
  lowHero(ctx, 'me', { angle: 0.2, height: 0.5, dist: 2.2, u });
  whipIn(ctx, { dur: 0.32, angle: 0.8 });
}

// ═══════════════════════════════════════════════ shots ════════════════════════════════════════════════════════════
export const shots = [
  // 0 ─ hook: whip onto a low hero of me, the lit lantern row glowing through the door glass behind
  { name: 'S0 whip lowHero', start: 0, set: 'home', lighting: 'night_lamp', cast: ['me'], options: HALL_OPTS,
    camera: camS0,
    setup(ctx) { dressHall(ctx); hang(ctx, ctx.props.rowNight); ctx.place('me', [0.1, 0, 7.4], { yaw: Math.PI }); },
    update(ctx, lt, u) {
      nightRow(ctx);
      ctx.cast.me.pose('idle', lt, { headPitch: -0.1 }); ctx.cast.me.face('determined', ctx.t);
      camS0(ctx, lt, u);
    } },

  // 1 ─ SETUP A: five lanterns through the glass, me bent double dragging the wardrobe on its back
  { name: 'S1 setupA drag', start: 1.25, set: 'home', lighting: 'night_lamp', cast: ['me'], options: { ...HALL_OPTS, shoes: false },
    camera: camS1,
    setup(ctx) {
      dressHall(ctx); hang(ctx, ctx.props.rowNight);
      put(ctx, ctx.props.wardrobe, [0.05, 0, 8.45], 0);             // lying on its back between camera and me
    },
    update(ctx, lt, u) {
      nightRow(ctx);
      // drag cycle walks backward: I face the camera (−Z), so my root moves +Z at DRAG_SPEED · speed (m/s)
      // SETUP A composition rule: me ≈ 4.9 m from the camera with low 0.5 → face at frame y ≈ 0.4 (clear of the
      // caption band), head top (hair + headphones) under the name tags; the 0.5 m slab is a band along the bottom
      const dz = 0.38 * 0.6 * lt;
      ctx.place('me', [0.02, 0, 8.9 + dz], { yaw: Math.PI });
      ctx.props.wardrobe.position.z = 8.45 + dz;
      ctx.props.wardrobe.userData.set(ctx.t, { tilt: 1 });
      ctx.cast.me.pose('drag', lt, { speed: 0.6, low: 0.5, gripY: 0.4 }); ctx.cast.me.face('determined', ctx.t);
      camS1(ctx, lt, u);
      focusOn(ctx, 'me', { aperture: 0.25 });                        // focus the character, let the lanterns bloom
      lightOn(ctx, 'me', { key: 0.75, rim: 1, keyDist: 0.9 });       // weak face fill, kept close (off the slab)
    } },

  // 2 ─ H1 (double HUSS): heave the tall wardrobe up from its back; slow-mo drives the body through the warped time
  { name: 'S2 huss heave', start: 2.6, set: 'home', lighting: 'night_lamp', cast: ['me'], options: HALL_OPTS,
    setup(ctx) { dressHall(ctx); put(ctx, ctx.props.wardrobe, [0.15, 0, 6.3], 0); ctx.place('me', [-0.66, 0, 4.15], { yaw: Math.PI / 2 }); },
    update(ctx, lt, u) {
      const ht0 = ctx.t - ctx.time('b02') + 0.18;
      ctx.cast.me.pose('heave', ht0, { u: 0.1 + 0.6 * clamp(ht0 / 1.1, 0, 1) });     // pose first: hussFrame aims at it
      // HUSS framing rule: medium-close (hussFrame: chest, head ≈ 20 % of the frame) — arms + the load read
      const h = hussBeat(ctx, ctx.t, { double: true, beat: 'b02', camera: { angle: 0.75, u } });
      const ht = h.t - ctx.time('b02') + 0.18;
      const k = clamp(ht / 1.1, 0, 1);
      ctx.props.wardrobe.userData.set(ctx.t, { tilt: 1 - 0.32 * smooth(0, 1, k) });
      ctx.cast.me.pose('heave', ht, { u: 0.1 + 0.6 * k });
      if (!h.on) ctx.cast.me.face('determined', ctx.t);
    } },

  // 3 ─ macro insert on the name tags from the porch: "5 lanterns" (the blank one flares)
  { name: 'S3 insert tags', start: 3.55, set: 'home', lighting: 'night_lamp', cast: [], options: { ...HALL_OPTS, outdoors: true }, room: null,
    setup(ctx) { hang(ctx, ctx.props.rowNight); },
    update(ctx, lt, u) {
      ctx.props.rowNight.userData.set(ctx.t, (i) => (i === 4 ? { initial: 'lit', events: [{ at: 4.05, do: 'flare' }] } : i < 5 ? 'lit' : 'folded'));
      insert(ctx, ctx.props.rowNight.userData.lanterns[2], { angle: Math.PI, offset: [0.15, -0.3, 0], size: 0.95, fill: 0.5, elev: 3, fov: 24, dof: 0.8, frame: [0.5, 0.3] });
    } },

  // 4 ─ "4 of us": the night family in the hall (wide + push-in)
  { name: 'S4 wide family night', start: 4.7, set: 'home', lighting: 'night_lamp', cast: ['me', 'mom', 'dad', 'pip'], options: HALL_OPTS,
    setup(ctx) {
      dressHall(ctx); hang(ctx, ctx.props.rowNight);
      // blocking: a staggered arc, every head clear (blockingCheck below warns if a head is > 30 % covered)
      ctx.place('dad', [0.1, 0, 8.7], { yaw: Math.PI - 0.05 });
      ctx.place('mom', [-0.75, 0, 8.0], { yaw: Math.PI + 0.25 });
      ctx.place('pip', [-0.2, 0, 7.35], { yaw: Math.PI + 0.1 });
      ctx.place('me', [0.75, 0, 7.4], { yaw: Math.PI - 0.25 });
    },
    update(ctx, lt) {
      nightRow(ctx);
      ctx.cast.dad.pose('crossArms', lt); ctx.cast.dad.face('neutral', ctx.t); ctx.cast.mom.pose('idle', lt, { reachL: 'belly' }); ctx.cast.mom.face('smile', ctx.t);
      ctx.cast.pip.pose('idle', lt, { blanket: 'drag' }); ctx.cast.pip.face('sad', ctx.t);
      ctx.cast.me.pose('idle', lt); ctx.cast.me.face('neutral', ctx.t);
      wide(ctx, 'pip', { angle: -0.1, elev: 5, part: 'head', size: 0.05, frame: [0.5, 0.42], lightTarget: 'me' });
      pushIn(ctx, 0.12);
      blockingCheck(ctx);
    } },

  // 5 ─ over my shoulder (headphones) onto Pip at her door; her chat bubble
  { name: 'S5 ots Pip bubble', start: 5.85, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'], options: { ...HALL_OPTS, pipDoorOpen: 0.35 },
    setup(ctx) {
      dressHall(ctx);
      ctx.place('pip', [-0.72, 0, 8.05], { yaw: Math.PI / 2 + 0.15 });
      ctx.place('me', [0.5, 0, 7.35], { yaw: -Math.PI / 2 - 0.35 });
    },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt); ctx.cast.pip.pose('idle', lt, { headPitch: -0.3, blanket: 'drag' });
      ctx.cast.pip.face('scared', ctx.t);
      ots(ctx, 'me', 'pip');
    } },

  // 6 ─ extreme close-up on Pip
  { name: 'S6 ecu Pip', start: 6.95, set: 'home', lighting: 'night_lamp', cast: ['pip'], options: { ...HALL_OPTS, pipDoorOpen: 0.35 },
    setup(ctx) { dressHall(ctx); ctx.place('pip', [-0.72, 0, 8.05], { yaw: Math.PI / 2 + 0.15 }); },
    update(ctx, lt) {
      ctx.cast.pip.pose('idle', lt, { headPitch: -0.28, reachL: 'chest', reachR: 'chest', blanket: 'clutch' });
      ctx.cast.pip.face('scared', ctx.t, { glints: 5 });           // five tiny lantern glints in each pupil (S02)
      ecu(ctx, 'pip');
    } },

  // 7 ─ POV: my hands + torch (night_torch: the torch is the key), beam into the open hatch
  { name: 'S7 pov torch', start: 7.8, set: 'home', lighting: 'night_torch', cast: ['me'], options: { ...HALL_OPTS, hatchOpen: 0.55 },
    setup(ctx) { dressHall(ctx); ctx.place('me', [0.15, 0, 2.7], { yaw: 0 }); },
    update(ctx, lt) {
      const me = ctx.cast.me;
      me.pose('idle', lt);
      // POV with my hands in frame: hands 'out', pov() tilts down until they sit at frame y 0.86 while keeping the
      // hatch at least 0.2 from the top (block heads: hands can never reach the upper half of a view that looks UP).
      me.pose('idle', lt, { reachL: 'out', reachR: 'out' });
      const hr = jointWorld(me, 'handR');
      ctx.set.torch.aim(hr, V(0.1 + 0.25 * Math.sin(lt * 1.3), 3.7, 6.7));
      pov(ctx, 'me', { at: V(0, 3.3, 6.6), fov: 76, eye: [0, 0.3, -0.25], atMinY: 0.07, focus: V(0, 3.3, 6.6) });
    } },

  // 8 ─ under the hatch: push the hatch up, torch dropped on the floor lighting the dust fall
  { name: 'S8 pushUp hatch', start: 9.05, set: 'home', lighting: 'night_torch', cast: ['me'], options: { ...HALL_OPTS, torch: 0.8 },
    setup(ctx) {
      dressHall(ctx);
      // HATCH REACH (home.js header): palms flat on the 3.4 m hatch need a 1.35 m step: I stand on the step ladder top
      const lad = ctx.props.ladder; ctx.add(lad); ctx.place(lad, 'hall.underHatch', { yaw: Math.PI });
      ctx.place('me', 'hall.underHatch', { yaw: Math.PI, offset: [0, lad.userData.topY, 0] });
      put(ctx, ctx.props.dustFall, [0, 3.2, 6.6]);
    },
    update(ctx, lt) {
      const u = clamp(lt / 0.8, 0, 1);
      ctx.cast.me.pose('pushUp', lt, { u: 0.3 + 0.7 * u }); ctx.cast.me.face(u < 0.95 ? 'determined' : 'shocked', ctx.t);
      ctx.set.set('hatchOpen', 0.75 * smooth(0.85, 1, u));            // the panel lifts once the palms arrive (u ≈ 0.9)
      ctx.props.dustFall.userData.set(ctx.t, { at: 9.6 });
      ctx.props.ladder.userData.set(ctx.t, { wobble: 0.3 });
      ctx.set.torch.aim(V(-0.85, 0.1, 5.0), V(0.0, 3.0, 6.6));       // dropped on the floor, shining up at me + the hatch
      pushIn(ctx, { pos: [0.95, 0.75, 4.05], look: [0, 2.55, 6.6], fov: 58 }, 0.06);
      handheld(ctx, 0.07);
      focusOn(ctx, 'me', { aperture: 0.25 });
      lightOn(ctx, 'me', { key: 0.7 });
    } },

  // 9 ─ Mom at the open fridge: cold practical through the arch, her robe + bun silhouette
  { name: 'S9 fridge Mom', start: 9.95, set: 'home', lighting: 'dark_practical', cast: ['mom'], options: { ...HALL_OPTS, practical: 'fridge', fridgeOpen: 1 }, room: 'kitchen',
    setup(ctx) { ctx.place('mom', 'kitchen.fridge', { yaw: Math.PI - 0.5, offset: [-0.55, 0, 0.2] }); },
    update(ctx, lt, u) {
      ctx.cast.mom.pose('peer', lt, { reachR: 'mouth', headYaw: 0.5 }); ctx.cast.mom.face('smile', ctx.t);
      pushIn(ctx, HOME_CAMS.archToFridge, 0.12, { u });
      handheld(ctx, 0.06);
      focusOn(ctx, 'mom', { aperture: 0.3, part: 'head' });
      lightOn(ctx, 'mom', { key: 0.4, rim: 1.3, side: 'R' });         // silhouette with an edge + a hint of face
    } },

  // 10 ─ macro insert: pickle jar + ice cream + the dipped pickle on the fridge shelf
  { name: 'S10 insert pickles', start: 10.75, set: 'home', lighting: 'dark_practical', cast: [], options: { ...HALL_OPTS, practical: 'fridge', fridgeOpen: 1 }, room: null,
    setup(ctx) {
      ctx.add(ctx.props.jar); ctx.place(ctx.props.jar, 'kitchen.fridge.shelf.1', { offset: [0.12, 0, 0.05] });
      ctx.add(ctx.props.tub); ctx.place(ctx.props.tub, 'kitchen.fridge.shelf.1', { offset: [-0.22, 0, 0.02] });
      ctx.add(ctx.props.pickle); ctx.place(ctx.props.pickle, 'kitchen.fridge.shelf.1', { offset: [-0.05, 0.03, 0.16], yaw: 0.9 });
    },
    update(ctx, lt) {
      ctx.props.pickle.userData.set(ctx.t, { dip: 0.6, drip: 0.5 + 0.5 * Math.sin(lt * 3) });
      insert(ctx, ctx.props.jar, { offset: [0, 0.15, 0], angle: Math.PI / 2, size: 0.55, fill: 0.55, elev: 10, dof: 0.8, key: 0.8 });
    } },

  // 11 ─ Dad hides the paint tin behind his back (closeUp + Dutch roll)
  // 11 ─ Dad hides the paint tin behind his back: OVER-THE-SHOULDER from behind Dad (low), the tin is the foreground
  //      subject, me in the background asking (Dutch roll)
  { name: 'S11 Dad tin dutch', start: 12.0, set: 'home', lighting: 'night_lamp', cast: ['dad', 'me'], options: HALL_OPTS,
    setup(ctx) {
      dressHall(ctx); ctx.add(ctx.props.tin);
      ctx.place('dad', [0.25, 0, 6.9], { yaw: Math.PI + 0.35 });
      ctx.place('me', [-0.35, 0, 4.6], { yaw: 0.15 });
    },
    update(ctx, lt, u) {
      const d = ctx.cast.dad;
      d.pose('idle', lt, { reachL: 'behindBack', reachR: 'behindBack', headYaw: 0.45 + 0.1 * Math.sin(lt * 2.2) });
      d.face('sweat', ctx.t);
      ctx.cast.me.pose('idle', lt, { lookAt: jointWorld(d, 'head', [0, 0.3, 0]) }); ctx.cast.me.face('squint', ctx.t);
      // camera behind Dad's back (3/4), chest height: his guilty face glances back over his shoulder (faceCam), the
      // tin hidden at his back is the foreground subject, me asking in the background past his side
      const camPos = V(0.5, 1.25, 9.0);
      d.pose('idle', lt, { reachL: 'behindBack', reachR: 'behindBack', faceCam: 0.95, cam: camPos });
      const hp = jointWorld(d, 'handR').lerp(jointWorld(d, 'handL'), 0.5);
      const tin = ctx.props.tin;
      tin.position.copy(hp).add(V(0, -0.24, 0.05)); tin.rotation.set(0, 0.6, 0);   // Dad faces −z: the tin hangs at his back
      tin.userData.set(ctx.t, { handle: 1 });
      // over Dad's shoulder (low, chest height): his shoulder + glancing face fill one side, the tin at his back sits
      // in the lower foreground, me asking in the background
      shoot(ctx, { pos: camPos, target: jointWorld(d, 'head', [0, 0.1, 0]), fov: 46, frame: [0.5, 0.26], dof: false, lightTarget: tin, key: 0.9, u, dutch: 7 });
      focusOn(ctx, tin, { aperture: 0.2 });
      lightOn(ctx, 'dad', { key: 0.8 });
    } },

  // 12 ─ SETUP C one-point corridor: the hot strip under the box-room door, two foot shadows; me crouched in front
  { name: 'S12 setupC strip', start: 13.85, set: 'home', lighting: 'dark_practical', cast: ['me'], options: { ...HALL_OPTS, practical: 'strip' },
    setup(ctx) { dressHall(ctx); ctx.place('me', [0.55, 0, 6.9], { yaw: Math.PI + 0.15 }); },
    update(ctx, lt, u) {
      ctx.set.set('stripFeet', [{ x: -0.32 + 0.22 * Math.sin(lt * 2.1), w: 0.16 }, { x: 0.12 + 0.2 * Math.sin(lt * 2.1 + 1.6), w: 0.16 }]);
      ctx.cast.me.pose('crouch', lt, { depth: 0.6, hands: 'knees', tremble: true, headPitch: 0.1 });
      pushIn(ctx, { pos: [-0.15, 1.2, 9.3], look: [0.05, 0.9, 0], fov: 38, roll: 0.06 }, 0.15, { u });
      handheld(ctx, 0.07);
      focusOn(ctx, 'hall.boxDoor.strip', { aperture: 0.4 });
    } },

  // 13 ─ H2 (single HUSS): shoulder into the box-room door, it gives
  { name: 'S13 huss shove', start: 15.25, set: 'home', lighting: 'night_lamp', cast: ['me'], options: { ...HALL_OPTS, strip: 1, boxRoomLight: 1, lamp: 0.7 },
    setup(ctx) { ctx.place('me', 'hall.boxDoor', { offset: [0.15, 0, 0.1], yaw: 0 }); },
    update(ctx, lt, u) {
      const camO = { angle: 2.5, elev: 10, frame: [0.5, 0.45], u };
      ctx.cast.me.pose('shove', ctx.t - ctx.time('b07'), { hands: 'shoulder', headYaw: -0.7 });
      const c0 = hussFrame(ctx, 'me', { ...camO, apply: false });
      // medium-close from behind 3/4: the shoulder into the door reads; the strain face glances back (faceCam)
      const h = hussBeat(ctx, ctx.t, { beat: 'b07', camera: camO });
      ctx.cast.me.pose('shove', h.t - ctx.time('b07'), { hands: 'shoulder', faceCam: 0.7, cam: c0.pos });
      if (!h.on) ctx.cast.me.face('determined', ctx.t);
      const open = smooth(0, 1, clamp((ctx.t - 15.88) / 0.25, 0, 1));
      ctx.set.set('boxDoorOpen', 0.3 * open);
    } },

  // 14 ─ god shot: Dad kneeling at the half-built crib, flat-pack box face up, paint tin + tray, half-yellow wall
  { name: 'S14 topDown crib', start: 16.35, set: 'home', lighting: 'boxroom_lamp', cast: ['dad'], options: { ...HALL_OPTS, boxDoorOpen: 1 }, room: 'box',
    setup(ctx) {
      const P = ctx.props;
      ctx.add(P.crib); ctx.place(P.crib, 'box.crib');
      ctx.add(P.cribBox); ctx.place(P.cribBox, 'box.crib', { offset: [-0.55, 0, 1.25], yaw: 0.35 });
      ctx.add(P.tin2); ctx.place(P.tin2, 'box.paint', { offset: [-0.1, 0, 0.2] });
      ctx.add(P.tray); ctx.place(P.tray, 'box.paint', { offset: [0.3, 0, 0.45], yaw: -0.3 });
      ctx.add(P.roller); ctx.place(P.roller, 'box.paint', { offset: [0.32, 0.05, 0.4], yaw: 0.9 });
      ctx.place('dad', 'box.crib', { offset: [0.2, 0, 0.82], yaw: Math.PI });
    },
    update(ctx, lt) {
      ctx.props.crib.userData.set(ctx.t, { wobble: 0.02 * Math.sin(lt * 9) });
      ctx.cast.dad.pose('kneel', lt, { hands: 'work', headPitch: -0.55 }); ctx.cast.dad.face('determined', ctx.t);
      const c = ctx.anchor('box.crib').getWorldPosition(V(0, 0, 0));
      // topDown leans 0.4 rad toward Dad's face (default for characters) so his face reads, not a hair rectangle
      topDown(ctx, 'dad', { maxY: 3.25, fov: 64, lean: 0.6, point: c.add(V(-0.1, 0.1, 0.35)) });
    } },

  // 15 ─ Dad caught: close-up, he looks up
  { name: 'S15 Dad caught', start: 17.5, set: 'home', lighting: 'boxroom_lamp', cast: ['dad'], options: { ...HALL_OPTS, boxDoorOpen: 1, boxRoomLight: 0.35 }, room: 'box',
    setup(ctx) {
      ctx.add(ctx.props.crib); ctx.place(ctx.props.crib, 'box.crib');
      ctx.place('dad', 'box.crib', { offset: [0.35, 0, 0.82], yaw: 2.5 });
    },
    update(ctx, lt) {
      ctx.cast.dad.pose('kneel', lt, { hands: 'work', headPitch: -0.3 });
      ctx.cast.dad.face(lt < 0.45 ? 'shocked' : 'smile', ctx.t);
      closeUp(ctx, 'dad', { angle: -0.3, elev: 10 });
    } },

  // 16 ─ Pip's ear on Mom's stomach (leanIn)
  // 16 ─ Pip's ear on Mom's stomach (leanIn), shot 3/4 FRONT so both faces read: Pip's face turned to the camera
  //      (faceCam), Mom looks down at her (lookAt)
  { name: 'S16 leanIn', start: 18.6, set: 'home', lighting: 'night_lamp', cast: ['mom', 'pip'], options: { ...HALL_OPTS, lamp: 0.6 },
    setup(ctx) {
      dressHall(ctx);
      // both turned 0.5 rad toward the camera (a V opening to the lens): 3/4 front on BOTH faces, ear still on the bump
      ctx.place('mom', [-0.25, 0, 6.9], { yaw: Math.PI / 2 + 0.5 });
      ctx.place('pip', [0.22, 0, 6.9], { yaw: -Math.PI / 2 - 0.5 });
      ctx.cast.pip.setAccessory('blanket', false);
    },
    update(ctx, lt, u) {
      const camO = { yaw: Math.PI + 0.08, size: 0.13, elev: 12, frame: [0.6, 0.42], u };
      ctx.cast.pip.pose('leanIn', lt, { lean: smooth(0, 0.6, lt), side: 'L', hands: 'hug' });
      const cam0 = closeUp(ctx, 'pip', { ...camO, apply: false });                 // where the camera will be
      ctx.cast.pip.pose('leanIn', lt, { lean: smooth(0, 0.6, lt), side: 'L', hands: 'hug', faceCam: 0.85, cam: cam0.pos });
      ctx.cast.pip.face(lt < 0.7 ? 'neutral' : 'shocked', ctx.t);
      ctx.cast.mom.pose('idle', lt, { reachL: 'belly', headPitch: 0.2, faceCam: 0.55, cam: cam0.pos }); ctx.cast.mom.face('smile', ctx.t);
      closeUp(ctx, 'pip', camO);
      blockingCheck(ctx);
    } },

  // 17 ─ the scan card held up at Mom's chest; focus pulls from Pip's face (beside her) to the card
  { name: 'S17 insert scan', start: 20.0, set: 'home', lighting: 'night_lamp', cast: ['mom', 'pip'], options: { ...HALL_OPTS, lamp: 0.6 },
    setup(ctx) {
      dressHall(ctx); ctx.add(ctx.props.scan);
      ctx.place('mom', [-0.2, 0, 7.4], { yaw: Math.PI });
      ctx.place('pip', [0.42, 0, 7.15], { yaw: Math.PI + 0.9 });
      ctx.cast.pip.setAccessory('blanket', false);
    },
    update(ctx, lt) {
      const m = ctx.cast.mom;
      m.pose('idle', lt, { reachR: 'chest', reachL: 'chest', headPitch: 0.35 }); m.face('smile', ctx.t);
      ctx.cast.pip.pose('idle', lt, { headPitch: -0.45 }); ctx.cast.pip.face('shocked', ctx.t);
      const card = ctx.props.scan;
      card.position.copy(jointWorld(m, 'handR')).lerp(jointWorld(m, 'handL'), 0.5).add(V(0, 0.1, -0.12));
      card.userData.set(ctx.t, { glow: 1.0 });
      insert(ctx, card, { angle: 0.25, size: 0.34, fill: 0.5, elev: 6, key: 0.6 });
      card.lookAt(ctx.cam.state.pos);
      focusPull(ctx, ctx.cast.pip, card, clamp((lt - 0.35) / 0.6, 0, 1), { aperture: 0.7 });   // the one strong focus pull
    } },

  // 18 ─ ECU: me, heartbroken → relieved
  { name: 'S18 ecu me', start: 21.6, set: 'home', lighting: 'night_lamp', cast: ['me'], options: HALL_OPTS,
    setup(ctx) { dressHall(ctx); ctx.place('me', [0.2, 0, 7.9], { yaw: Math.PI - 0.3 }); },
    update(ctx, lt) {
      ctx.cast.me.pose('idle', lt, { headPitch: -0.08 });
      ctx.cast.me.face(lt < 0.9 ? 'heartbroken' : 'relieved', ctx.t, { glints: 3 });   // three glints (S24: three replace five)
      ecu(ctx, 'me');
    } },

  // 19 ─ Pip's arms round my neck (I kneel); dip through white into the morning
  // 19 ─ Pip's arms round my neck (I kneel), 3/4 FRONT on both faces (faceCam on Pip, my face toward the camera);
  //      dip through white into the morning
  { name: 'S19 hugNeck', start: 23.2, set: 'home', lighting: 'night_lamp', cast: ['me', 'pip'], options: HALL_OPTS,
    setup(ctx) {
      dressHall(ctx);
      ctx.place('me', [0.45, 0, 7.2], { yaw: -Math.PI / 2 - 0.5 });
      ctx.place('pip', [-0.03, 0, 7.2], { yaw: Math.PI / 2 + 0.5 });
      ctx.cast.pip.setAccessory('blanket', false);
    },
    update(ctx, lt, u) {
      const camYaw = Math.PI + 0.2;
      ctx.cast.me.pose('kneel', lt, { hands: 'lap' });            // pose FIRST: the helper reads this frame's head
      const cam0 = closeUp(ctx, 'me', { yaw: camYaw, size: 0.15, elev: 10, frame: [0.4, 0.36], u, apply: false });
      ctx.cast.me.pose('kneel', lt, { hands: 'lap', faceCam: 0.6, cam: cam0.pos }); ctx.cast.me.face('relieved', ctx.t);
      const neck = jointWorld(ctx.cast.me, 'head', [0, -0.05, 0]);
      ctx.cast.pip.pose('hugNeck', lt, { target: neck, side: 'R', faceCam: 0.8, cam: cam0.pos }); ctx.cast.pip.face('relieved', ctx.t);
      closeUp(ctx, 'me', { yaw: camYaw, size: 0.15, elev: 10, frame: [0.4, 0.36], u });
      blockingCheck(ctx);
      dipWhite(ctx, 'jump');
    } },

  // 20 ─ BOOKEND of shot 1 in the morning: door open, the sixth lantern 'BABY' lights with a flare
  { name: 'S20 bookend morning', start: 'jump', set: 'home', lighting: 'morning', cast: ['pipDay'], options: { ...HALL_OPTS, frontDoorOpen: 1, shafts: 0.35 },
    setup(ctx) { dressHall(ctx); hang(ctx, ctx.props.rowMorning); ctx.place('pipDay', [0.42, 0, 9.2], { yaw: Math.PI + 0.5 }); },
    update(ctx, lt) {
      // the NEW sixth lantern (blank tag) lights with a flare; the fifth now says BABY
      ctx.props.rowMorning.userData.set(ctx.t, (i) => (i === 5 ? { initial: 'folded', events: [{ at: 25.95, do: 'light' }] } : 'lit'));
      ctx.cast.pipDay.pose('idle', lt, { reachR: 'point', headPitch: -0.2 }); ctx.cast.pipDay.face('grin', ctx.t);
      bookend(ctx, 'S1 setupA drag');
      focusOn(ctx, 'pipDay', { aperture: 0.25 });
      lightOn(ctx, 'pipDay', { key: 0.7 });
      dipWhite(ctx, 'jump');
    } },

  // 21 ─ the day family in the morning hall (Mom's belly laugh), wide + push-in
  { name: 'S21 wide family day', start: 27.4, set: 'home', lighting: 'morning', cast: ['me', 'momDay', 'dadDay', 'pipDay'], options: { ...HALL_OPTS, frontDoorOpen: 1, shafts: 0.5 },
    setup(ctx) {
      dressHall(ctx); hang(ctx, ctx.props.rowMorning);
      // blocking: a staggered arc, every head clear of the others (blockingCheck)
      ctx.place('momDay', [-0.7, 0, 7.3], { yaw: Math.PI + 0.3 });
      ctx.place('dadDay', [0.2, 0, 7.85], { yaw: Math.PI - 0.1 });
      ctx.place('pipDay', [-0.1, 0, 6.6], { yaw: Math.PI });
      ctx.place('me', [0.8, 0, 6.85], { yaw: Math.PI - 0.4 });
    },
    update(ctx, lt) {
      ctx.props.rowMorning.userData.set(ctx.t, 'lit');
      ctx.cast.momDay.pose('laugh', lt, { reachL: 'belly', reachR: 'belly' }); ctx.cast.momDay.face('laugh', ctx.t);
      ctx.cast.pipDay.pose('cheer', lt); ctx.cast.pipDay.face('grin', ctx.t);
      const pipHead = jointWorld(ctx.cast.pipDay, 'head', [0, 0.36, 0]);
      ctx.cast.dadDay.pose('idle', lt, { reachL: pipHead }); ctx.cast.dadDay.face('smile', ctx.t);
      ctx.cast.me.pose('idle', lt); ctx.cast.me.face('smile', ctx.t);
      wide(ctx, 'pipDay', { angle: 0.25, elev: 10, part: 'head' });
      pushIn(ctx, 0.2);
      blockingCheck(ctx);
    } },
];
