/*
 * src/kits/home.js — the reusable family home (style bible v2 upgrade 11 + ep30 'sets'), built for the toy-block cast
 * (CHARACTER_HEIGHT 2.0 m, heads ≈0.64 m: doors 2.75 m, ceilings 3.4 m, counters 1.2 m, tables 1.0 m; Pip at 0.7).
 * Warm, really lit, cluttered; every surface uses procedural PBR sets (src/real/textures_home.js); lighting states are
 * set presets; post look comes from src/lib/look.js (set.post returns the matching MOOD).
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   import { buildHome, HOME, HOME_CAMS } from '../kits/home.js';
 *   import { renderFrame as lookRender } from '../lib/look.js';
 *   export const renderFrame = lookRender;
 *   export const sets = { home: (ctx) => buildHome(ctx, { lighting: 'night_lamp' }) };
 *   shot: { set: 'home', lighting: 'dusk_to_night', options: { nightMix: 0 }, setup(ctx) { … },
 *           update(ctx, lt) { ctx.set.set('nightMix', ctx.progress('flip', 'flip+0.6'));            // pure function of t
 *                             ctx.cam.set({ pos: 'cam.setupA', look: 'cam.setupA.look', fov: 34 }); } }
 *
 * ─── buildHome(ctx, opts) → Set ─────────────────────────────────────────────────────────────────────────────────────
 *   Set = { root, anchors, options, set(key, v), setLighting(preset), update(t), background, fog, exposure, post(ctx),
 *           torch, lamp, fridgeLight, strip, sun, hemi, porchGlow, boxLamp, sky, parts, info }
 *   opts = initial options (below) + build-time only: { seed = 7, neighbours = true (the two neighbour houses +
 *           porches), opposite = true (row of houses across the street), wallColor = '#e8cf9c' (hall walls: warm
 *           buttercream; teal stays as the accent on the front door + coats), hatchSoffit = null | y (e.g. 2.75: a
 *           lowered bulkhead x −1.3…1.0, z 5.8…7.4 with the attic hatch in its underside at that height — see the
 *           HATCH REACH table) }
 *   set.parts = { frontDoor, pipDoor, boxDoor, hatch, fridgeDoor, shoes, coats, photo, standIns, interior, exterior }
 *   (Groups; driven by the options every frame — don't move them yourself, set the option)
 *   Options (set(key, value); all plain values, snapshotted by the engine and restored at every shot change):
 *     lighting       'night_lamp' (default) | 'night_torch' | 'dusk' | 'dusk_to_night' | 'dark_practical' | 'morning'
 *                    | 'boxroom_lamp'   (≡ setLighting(name)); see LIGHTING below
 *     nightMix       0..1   only for 'dusk_to_night': 0 = golden dusk, 1 = blue night (drive it from t in update)
 *     practical      'fridge' | 'strip' | 'both'   which practical 'dark_practical' uses (default 'fridge')
 *     lamp           null | 0..1   override the hall table lamp (null = preset; also scales its room-bounce light)
 *     porchGlow      null | 0..1   override the porch lantern-row PointLight (null = preset; the lantern props are NOT
 *                                  part of this kit — the shared light that lanterns imply is)
 *     torch          null | 0..1   override the torch (set.torch; aim it every frame with set.torch.aim(from, to))
 *     fridgeOpen     0..1   fridge door angle (0 shut, 1 ≈ 105° open); fridge light comes on with it (fridgeLight)
 *     fridgeLight    true   whether the fridge's interior light works
 *     boxDoorOpen    0..1   box-room door (hinged on its east jamb, swings INTO the box room)
 *     boxRoomLight   null | 0..1   the box room's floor work lamp (null = preset; lights the strip under its door)
 *     strip          null | 0..1   the strip of light under the box-room door (null = boxRoomLight × door shut)
 *     stripFeet      null | [{x, w}]  0–2 foot shadows walking into the strip (x along the door, m from its centre)
 *     hatchOpen      0..1   attic hatch panel (hinged on its north edge, lifts up into the attic, 1 ≈ 80°)
 *     frontDoorOpen  0..1   front door (hinged on the WEST jamb, swings into the hall; 1 ≈ 100°)
 *     pipDoorOpen    0..1   Pip's door (hinged on its north jamb, swings into her room). Default 0.1 (≈9°) = a dark
 *                           crack at the latch edge (the S02/S16 gap); 0.5 ≈ 46°, 1 ≈ 92°
 *     kitchenLight   0..1   warm unshadowed ceiling glow in the kitchen (the "warm sliver from the kitchen")
 *     pendants       0..1   the two hall ceiling pendants' emissive glow (no light added)
 *     shafts         null | 0..1   light-shaft slabs through the front glazing (null = preset)
 *     dust           null | 0..1   dust motes in the hall (null = preset)
 *     streetLights   null | 0..1   street lamps (emissive heads + one PointLight under the far lamp) (null = preset)
 *     windowGlow     null | 0..1   warm curtained windows of the neighbours / dormers / houses opposite (null = preset)
 *     atticLight     0..1   cool unshadowed glow high in the attic (moonlight through a gable vent) so top-down attic
 *                           shots read beyond the torch beam
 *     moonShadow     false  let the moon cast shadows in night presets (+1 shadow pass, ≈ +0.3 s/frame)
 *     lanterns       0      stand-in lantern row on our porch for framing checks: 0..6 paper globes on the hooks
 *     lanternsLit    5      how many stand-ins (from hook 0) glow
 *     photo          true   placeholder framed family photo on the hall table (hide it when the props kit adds its own)
 *     shoes / coats  true   the doormat shoes (4 pairs) / the 4 coats on hooks
 *     neighbourDoorOpen 0..1  next-door (neighbour 0) front door; their lit vestibule is behind it
 *     neighbourPorchGlow 0..1 warm PointLight on each neighbour's porch (lanterns lit there)
 *     sunDir         null | [x,y,z]  override the sun/moon direction (toward the light), e.g. a raking dusk sun for
 *                           exterior shots ([-0.8, 0.28, 0.55]); the shafts keep their preset direction
 *     outdoors       false  the camera is OUTSIDE (street / porch shots): ×1.5 sky fill, ×2 reflections (interiors keep
 *                           a low ambient so the sun and practicals model the rooms)
 *     exterior       true   everything outside our walls (porch, street, neighbours, sky). false saves ≈10 % on
 *                           interior shots that never look at a window/door glass
 *   LIGHTING (one shadowed key per state, everything else unshadowed; the look MOOD follows the state):
 *     night_lamp     hall table lamp = key (shadowed spot + warm glow), porch lantern glow through the glass, cool moon
 *                    fill from the south, deep blue sky, street lamps on.            exposure 1.0, MOODS.night
 *     night_torch    lamp OFF; the torch (set.torch, shadowed spot) is the key; lantern glow + faint moon; darkest
 *                    ambient. Aim the torch every frame.                              exposure 1.0, MOODS.dark
 *     dusk           low golden sun from the south-west through the front glazing = key (shadowed), long warm floor
 *                    patches, light shafts + dust, warm sky; lamp off.               exposure 1.0, MOODS.dusk
 *     dusk_to_night  dusk → night_lamp-without-lamp as nightMix goes 0 → 1 (sun turns into moonlight, sky darkens,
 *                    shafts fade, street lamps come on at 0.6).
 *     dark_practical lamp off, near-black ambient, faint moon; the single practical (fridge spot shadowed, and/or the
 *                    hot strip under the box-room door) does the lighting; a faint warm kitchen glow (≥ 0.15) keeps
 *                    the tiles / calendar readable.                                exposure 1.2, MOODS.dark
 *     morning        bright sun from the south-east (shadowed) pouring in through the front door/glass, shafts + dust,
 *                    saturated blue sky (horizon #9fd0f2, zenith #3f8fe0), low raking warm sun '#ffe2b8' 3.2 → a warm
 *                    patch down the hall floor; shafts default 0.5; clear day haze.  exposure 1.0, MOODS.morning
 *   FILL (look fix pass — rooms had almost no fill): hemisphere / environment per state: night 0.45 / 0.15 (sky
 *     '#5f76a8'), dusk 0.6 / 0.25, morning 0.6 / 0.3; dark-state multipliers night_torch 0.6, dark_practical 0.45,
 *     boxroom_lamp 0.8. The hall lamp also drives an unshadowed warm bounce light (hall centre, ≈25 % of the
 *     lamp, under the ceiling at y 3.25, decay 1) and its glow reaches 7 m. Haze: night 0.012 / max 0.6; day states 0.0015 / max 0.2.
 *   set.subjectKey  key strength for look.lightOn's 'auto' (direct.js helpers): 1.0 night_lamp, 0.55 night_torch and
 *     dark_practical (faces stay ≥ 0.35), 0.8 elsewhere. Faces need that subject light; ambient alone only lifts
 *     them to ≈ 0.3–0.45.
 *     boxroom_lamp   inside the box room: the floor work lamp is the key (shadowed), hall dark behind, lanterns glow at
 *                    the far end of the hall.                                        exposure 1.0, MOODS.warm
 *   set.torch  = look.makeTorch() (parented to the set root; aim(fromVec3, toVec3) every frame; or ctx.add your own)
 *   set.lamp / fridgeLight / strip / boxLamp / porchGlow = the look.js practicals (setOn is driven by the options)
 *   set.post(ctx) → the per-state look MOOD + distance haze (used automatically by look.renderFrame)
 *
 * ─── Plan (metres, +X east, +Z south = toward the street; floor y = 0; characters face +Z by default) ────────────────
 *   HALL     x −1.3…1.3 (2.6 wide), z 0 (north, box-room door) … 10 (south, front door), ceiling 3.4.
 *            South wall: glazed front door 1.4 × 2.75 (glass 0.45–2.62 m), glass sidelights to x ±1.24, transom glass
 *            2.85–3.25. West wall: hall table + lamp (z 5.0–6.2), Pip's door (z 7.42–8.58), drawings spot beside it.
 *            East wall: radiator (z 2–3), kitchen ARCH (z 4.5–6.5, springing 2.2, apex 3.2), framed photos, 4 coat hooks
 *            (z 8.85–9.75 at 2.1 m). Runner rug z 0.8–8.6, coir doormat z 9.05–9.85 with 4 pairs of shoes.
 *            Ceiling: attic HATCH x −0.5…0.5, z 6.1…7.1; two pendants; smoke alarm.
 *   KITCHEN  x 1.46…5.46, z 3.2…10. Mint fridge on the east wall facing WEST straight through the arch (front at
 *            x ≈ 4.6, z 5.05…6.0); L counter (1.2 m) along the south window wall and the east wall; checker tile floor.
 *   PIP      x −5.0…−1.46, z 6.4…10: dim lilac room seen only through her door (bed, night light, glow stars).
 *   BOX ROOM x −1.9…1.9, z −3.8…−0.16 behind the north door: no window, bare boards, north wall half yellow, boxes,
 *            dust sheet, floor work lamp (the key in 'boxroom_lamp' and the source of the strip under the door).
 *   ATTIC    above the 0.15 m ceiling (attic floor y 3.55): joists, insulation, rafters of the 32° roof, cobwebs,
 *            a cardboard box. Shoot it top-down from 'cam.atticDown'.
 *   PORCH    deck z 10.16…12.5 (top y −0.06), posts at x ±2.45; the LOW lantern BEAM (underside y 2.62) at z 12.15
 *            carries 6 hooks; steps down to the front yard (ground y −0.66); path to the street.
 *   STREET   lawn + picket fence to z 16.5, pavement z 16.5…18.5, road z 18.5…25.5, far pavement, street lamps
 *            (one straight across from our door at z 26.9 — "Mom walks away under the street lamp"), houses opposite
 *            (z ≈ 33). Neighbour houses with the same porch + beam kit at x +12.5 (next door, 7 hooks, lit window +
 *            vestibule behind an opening door) and x −12.5 (the baker: BAKERY sign, 3 hooks, lit window).
 *
 * ─── SETUP A (ep30 motif) re-derived for our scale — verified on a rendered still (src/kits/test_home.js shot 0) ─────
 *   camera (0, 0.7, 6.0) = kid height, 4 m inside the door, on the centre line, tilted up 5°, fov 34 (vertical).
 *   Lantern hooks at y 2.62, z 12.15, x = HOME.HOOKS[i] = +0.6, +0.3, 0, −0.3, −0.6, −0.9 (i = 0…5: left → right AS
 *   SEEN FROM INSIDE THE HALL; hook 5 is the sixth, folded until the morning). With 0.26 m lanterns centred 0.27 m
 *   below the hooks (y 2.35) the five lit ones sit 19–24 % from the top of the 9:16 frame (measured on the render:
 *   centres at 21 %, tags at ≈ 27 %; the captions band 50–62 % is clear), each ≈ 110–125 px wide at 1080 on a
 *   ≈ 148 px pitch, all inside the door glass (projected x ±0.49 < glass ±0.61), nothing in front of them. The sixth
 *   (x −0.9) projects onto the west jamb with the door shut: in the morning shots the door is open and the camera
 *   should sit ≤ 3 m from the door or shift x by +0.2. Occlusion envelope: anything between camera and door must
 *   stay under 0.7 + 0.21·d metres at distance d (1.13 m at 2 m, 1.35 m at 3 m) or it covers the name tags.
 *
 * ─── HATCH REACH (what stool / step-ladder top height each attic beat needs; feet on the stool top) ────────────────
 *   Body numbers (characters.js): palms flat overhead (pushUp u = 1) ≈ 2.05·s above the feet; shoulder tops ≈ 1.40·s
 *   standing (≈ 1.2·s at pushUp u 0); eyes ≈ 1.71·s; head top 2.0·s.  me s = 1.0, Pip s = 0.7.
 *                                         hatch at CEIL 3.40            hatchSoffit 2.75
 *     palms flat on the panel (S55, S57)   me 1.35 · Pip 1.97           me 0.70 · Pip 1.32
 *     shoulders wedged under it (S18)      me 2.00 (u 0) / 1.95         me 1.35 (u 0) / 1.30 · Pip 1.74
 *     legs straighten, hatch pops (S19)    = palms row (pushUp u 0 → 1 from the shoulders-wedged stool)
 *     head + torch up through it (S20)     eyes above the attic floor (3.55 + 0.1): me ≥ 1.95, Pip ≥ 2.45 (any soffit)
 *   Use props_home.makeStepLadder({ h }) (top step = h; userData.topY) with pose('stepUp', t, { height: h }) and
 *   then re-place the root at userData.topY. S57 (Pip and me, palms on the hatch, waist-up) with the 3.4 m ceiling is
 *   a camera cheat: Pip stands on a hidden riser (frame her waist-up so the riser is out of shot).
 *
 * ─── Anchors (THREE.Object3D; +Z of an anchor = the way it faces; HOME_ANCHORS lists them with notes) ─────────────────
 *   see HOME_ANCHORS below. Camera presets: HOME_CAMS[name] = { pos, look, fov } and anchors 'cam.<name>' +
 *   'cam.<name>.look' (so ctx.cam.set({ pos: 'cam.setupA', look: 'cam.setupA.look', fov: HOME_CAMS.setupA.fov })).
 *
 * Determinism: everything is built in buildHome from seeded rng; update(t) and set() only assign absolute values.
 * Cost (SwiftShader 4 CPU, 810×1440, 1 worker, with the look.js post chain): ≈2.8–4.0 s/frame in every state
 * (see test_home.js). ~60 draw calls (static geometry merged per material, vertex-coloured), 1 shadowed key per state.
 * Build ≈4–6 s (procedural textures + merges), once per page.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { rng, clamp, lerp, smooth, hash, noise1 } from '../lib/util.js';
import { getHomePBR, HOME_TILE } from '../real/textures_home.js';
import { setFrame } from '../real/materials.js';
import { makeSky } from '../real/env.js';
import { MOODS, COLORS, tuneShadow, makeLamp, makeTorch, makePointGlow, makeFridgeLight, makeDoorStrip, makeWindowShaft, makeDust } from '../lib/look.js';
import { makeTextCard, makeIceCreamTub } from './props_home.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export const HOME = {
  CEIL: 3.4, T: 0.16, DOOR_H: 2.75, COUNTER: 1.2, TABLE: 1.0, GROUND_Y: -0.66, PORCH_Y: -0.06,
  HALL: { x0: -1.3, x1: 1.3, z0: 0, z1: 10 },
  KITCHEN: { x0: 1.46, x1: 5.46, z0: 3.2, z1: 10 },
  PIP: { x0: -5.0, x1: -1.46, z0: 6.4, z1: 10 },
  BOX: { x0: -1.9, x1: 1.9, z0: -3.8, z1: -0.16 },
  FOOT: { x0: -5.16, x1: 5.62, z0: -3.96, z1: 10.16 },
  FRONT_DOOR: { x0: -0.7, x1: 0.7, glassY0: 0.45, glassY1: 2.62 },
  PIP_DOOR: { z0: 7.42, z1: 8.58 },
  BOX_DOOR: { x0: -0.58, x1: 0.58 },
  ARCH: { z0: 4.5, z1: 6.5, spring: 2.2 },
  HATCH: { x0: -0.5, x1: 0.5, z0: 6.1, z1: 7.1 },
  BEAM: { z: 12.15, y: 2.62 },
  HOOKS: [0.6, 0.3, 0, -0.3, -0.6, -0.9],
  LANTERN: { drop: 0.27, size: 0.26 },
  FRIDGE: { x: 5.0, z: 5.52, w: 0.95, h: 2.3, d: 0.8 },
  NEIGHBOURS: [{ x: 12.5, hooks: 7 }, { x: -12.5, hooks: 3, sign: 'BAKERY' }],
};
export const HOME_CAMS = {
  setupA: { pos: [0, 0.7, 6.0], look: [0, 0.7 + Math.tan(5 * Math.PI / 180) * 10, 16], fov: 34 },
  setupB: { pos: [0.85, 2.15, 7.7], look: [-0.35, 1.95, 13], fov: 40 },
  setupC: { pos: [0, 1.45, 9.2], look: [0, 1.3, 0], fov: 38 },
  backHall: { pos: [0.25, 1.75, 0.9], look: [0, 1.45, 10], fov: 40 },
  boxOut: { pos: [0.25, 1.05, -3.3], look: [0, 1.25, 10], fov: 40 },
  boxIn: { pos: [0.3, 1.9, 1.6], look: [-0.2, 1.2, -3.6], fov: 46 },
  archToFridge: { pos: [0.3, 1.75, 5.6], look: [5.2, 1.35, 5.5], fov: 40 },
  pipGap: { pos: [0.1, 1.62, 9.3], look: [-1.38, 1.6, 8.5], fov: 30 },
  hallTable: { pos: [0.6, 1.55, 6.9], look: [-1.1, 1.05, 5.6], fov: 34 },
  underHatch: { pos: [0.6, 0.45, 4.6], look: [0, 3.4, 6.6], fov: 50 },
  atticDown: { pos: [0.0, 5.4, 6.95], look: [0, 0, 6.35], fov: 50 },
  kitchen: { pos: [2.0, 1.9, 9.3], look: [4.8, 1.3, 5.0], fov: 46 },
  porchIn: { pos: [0.35, 1.55, 14.2], look: [0, 1.3, 4.0], fov: 42 },
  beamMacro: { pos: [1.15, 2.25, 13.1], look: [0, 2.3, 12.15], fov: 24 },
  street: { pos: [2.5, 1.3, 23.5], look: [0, 2.6, 10], fov: 44 },
  streetNeighbours: { pos: [6.5, 1.1, 21], look: [12.5, 2.4, 11], fov: 42 },
  throughGlass: { pos: [0.1, 1.9, 9.0], look: [1.0, 1.4, 27], fov: 22 },
};

// ═════════════════════════════════════════════ materials ══════════════════════════════════════════════════════════
const MAT_SPECS = {
  plaster: { tex: 'plaster', ns: 0.25, ao: 0.6 },
  paint: { tex: 'paintwood', ns: 0.15, ao: 0.5 },
  oak: { tex: 'oak', ns: 0.6 },
  floor: { tex: 'floorboards', ns: 0.5, ao: 0.8 },
  tile: { tex: 'tile', texOpts: { checker: ['#efe6d4', '#9b6b56'] }, ns: 1, ao: 0.7, tile: 1.2 },
  wtile: { tex: 'tile', ns: 1, ao: 0.7, tile: 0.6 },
  slab: { tex: 'tile', ns: 0.7, ao: 0.6, tile: 3.0 },
  fabric: { tex: 'carpet', ns: 0.35, ao: 0.7 },
  siding: { tex: 'siding', ns: 1, ao: 0.8 },
  shingle: { tex: 'shingle', ns: 1, ao: 0.6 },
  brick: { tex: 'brick', ns: 1, ao: 0.6 },
  coir: { tex: 'coir', ns: 1 },
  plain: { rough: 0.72 },
  gloss: { rough: 0.24 },
  metal: { rough: 0.32, metal: 0.85 },
};
function makeMats() {
  const M = {};
  for (const [k, s] of Object.entries(MAT_SPECS)) {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: s.rough ?? 1, metalness: s.metal ?? 0 });
    if (s.tex) {
      const p = getHomePBR(s.tex, s.texOpts || {});
      m.map = p.map; m.normalMap = p.normalMap; m.roughnessMap = p.roughnessMap;
      m.normalScale.set(s.ns ?? 1, s.ns ?? 1);
      if (s.ao) { m.aoMap = p.roughnessMap; m.aoMapIntensity = s.ao; }
    }
    m.name = 'home:' + k;
    M[k] = m;
  }
  return M;
}
const tileOf = (k) => { const s = MAT_SPECS[k]; if (s && s.tile) return Array.isArray(s.tile) ? s.tile : [s.tile, s.tile]; const t = s && s.tex ? HOME_TILE[s.tex] : [1, 1]; return t || [1, 1]; };

// ═════════════════════════════════════════════ geometry batching ═════════════════════════════════════════════════
const _col = new THREE.Color();
function prep(g) {
  let out = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(out.attributes)) if (!['position', 'normal', 'uv'].includes(k)) out.deleteAttribute(k);
  if (!out.attributes.uv) out.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(out.attributes.position.count * 2), 2));
  if (!out.attributes.normal) out.computeVertexNormals();
  out.clearGroups();
  return out;
}
/** Box with UVs in METRES per face (so a material's tile size gives the texel density). */
function boxG(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
  return g;
}
function batcher() {
  const lists = new Map();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const api = {
    /** add geometry (uv in metres) with transform + vertex colour. opts: pos, rot [x,y,z] | Euler, scale, color, tile, uvOff */
    add(key, geom, { pos = [0, 0, 0], rot = null, scale = null, color = '#ffffff', tile = null, uvOff = null, matrix = null } = {}) {
      const g = prep(geom);
      const tl = tile ? (Array.isArray(tile) ? tile : [tile, tile]) : tileOf(key);
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + (uvOff ? uvOff[0] : 0)) / tl[0], (uv.getY(i) + (uvOff ? uvOff[1] : 0)) / tl[1]);
      if (matrix) g.applyMatrix4(matrix);
      else {
        e.set(...(rot ? (rot.isEuler ? [rot.x, rot.y, rot.z] : rot) : [0, 0, 0]));
        q.setFromEuler(e); s.set(...(scale == null ? [1, 1, 1] : typeof scale === 'number' ? [scale, scale, scale] : scale)); p.set(...pos);
        g.applyMatrix4(m4.compose(p, q, s));
      }
      { const pa = g.attributes.position.array, na = g.attributes.normal.array;
        for (let i = 0; i < pa.length; i++) if (!Number.isFinite(pa[i]) || !Number.isFinite(na[i])) { console.error(`home batch NaN in "${key}" (${geom.type}) at`, pos, rot); break; } }
      _col.set(color);
      const n = g.attributes.position.count, c = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { c[i * 3] = _col.r; c[i * 3 + 1] = _col.g; c[i * 3 + 2] = _col.b; }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3));
      if (!lists.has(key)) lists.set(key, []);
      lists.get(key).push(g);
      return api;
    },
    /** axis-aligned box from min corner a to max corner b; uv offset follows world coords (walls line up) */
    box(key, a, b, opts = {}) {
      const w = b[0] - a[0], h = b[1] - a[1], d = b[2] - a[2];
      if (w <= 0 || h <= 0 || d <= 0) return api;
      return api.add(key, boxG(w, h, d), { ...opts, pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] });
    },
    build(parent, mats, { cast = true, receive = true, name = 'batch' } = {}) {
      const out = {};
      for (const [key, list] of lists) {
        const g = mergeGeometries(list, false);
        for (const x of list) x.dispose();
        if (!g) throw new Error(`home: merge failed for ${key}`);
        g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, mats[key]);
        mesh.name = `${name}:${key}`; mesh.castShadow = cast; mesh.receiveShadow = receive;
        parent.add(mesh); out[key] = mesh;
      }
      lists.clear();
      return out;
    },
    get count() { let n = 0; for (const l of lists.values()) n += l.length; return n; },
  };
  return api;
}
// wall in the XY plane (normal ±Z), thickness z0..z1, rectangular / arched holes in (x, y)
function holePath(h) {
  const P = new THREE.Path();
  if (h.arch) {
    const r = (h.x1 - h.x0) / 2, cx = (h.x0 + h.x1) / 2;
    P.moveTo(h.x0, h.y0); P.lineTo(h.x1, h.y0); P.lineTo(h.x1, h.spring);
    P.absarc(cx, h.spring, r, 0, Math.PI, false); P.lineTo(h.x0, h.y0);
  } else { P.moveTo(h.x0, h.y0); P.lineTo(h.x1, h.y0); P.lineTo(h.x1, h.y1); P.lineTo(h.x0, h.y1); P.lineTo(h.x0, h.y0); }
  return P;
}
function wallShapeGeo(x0, x1, y0, y1, depth, holes) {
  const S = new THREE.Shape(); S.moveTo(x0, y0); S.lineTo(x1, y0); S.lineTo(x1, y1); S.lineTo(x0, y1); S.lineTo(x0, y0);
  for (const h of holes || []) S.holes.push(holePath(h));
  return new THREE.ExtrudeGeometry(S, { depth, bevelEnabled: false, curveSegments: 16 });
}
function wallXY(B, key, { x0, x1, y0, y1, z0, z1 }, holes, opts = {}) {
  const g = wallShapeGeo(x0, x1, y0, y1, z1 - z0, holes);
  B.add(key, g, { ...opts, pos: [0, 0, z0] });
}
// wall in the ZY plane (normal ±X), thickness x0..x1, holes given in (z, y)
function wallZY(B, key, { z0, z1, y0, y1, x0, x1 }, holes, opts = {}) {
  const hs = (holes || []).map((h) => ({ ...h, x0: -h.z1, x1: -h.z0 }));
  const g = wallShapeGeo(-z1, -z0, y0, y1, x1 - x0, hs);
  g.rotateY(Math.PI / 2);
  B.add(key, g, { ...opts, pos: [x0, 0, 0] });
}

// ═════════════════════════════════════════════ canvas art ═════════════════════════════════════════════════════════
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// 4 × 4 atlas of 256² pictures (frames' contents, drawings, notes, signs). cell(i) → [u0, v0, u1, v1]
function pictureAtlas(seed) {
  const N = 4, S = 256, c = mkCanvas(N * S, N * S), g = c.getContext('2d'), r = rng(seed);
  const cell = (i, fn) => { const x = (i % N) * S, y = Math.floor(i / N) * S; g.save(); g.translate(x, y); g.beginPath(); g.rect(0, 0, S, S); g.clip(); fn(g, S); g.restore(); };
  const head = (g, x, y, s, skin, hair, extra) => {   // a toy-block portrait head
    g.fillStyle = skin; g.fillRect(x - s / 2, y - s / 2, s, s * 0.92);
    g.fillStyle = '#1b1b1b'; g.fillRect(x - s * 0.22, y - s * 0.08, s * 0.1, s * 0.13); g.fillRect(x + s * 0.12, y - s * 0.08, s * 0.1, s * 0.13);
    g.strokeStyle = '#1b1b1b'; g.lineWidth = s * 0.05; g.beginPath(); g.arc(x, y + s * 0.12, s * 0.16, 0.2, Math.PI - 0.2); g.stroke();
    if (extra) extra(g, x, y, s, hair);
  };
  // 0 family photo (Mom bun, Dad beard+glasses, me headphones, Pip puffs) on a warm studio backdrop
  cell(0, (g, S) => {
    const grd = g.createLinearGradient(0, 0, 0, S); grd.addColorStop(0, '#d9a86c'); grd.addColorStop(1, '#7c5332'); g.fillStyle = grd; g.fillRect(0, 0, S, S);
    const body = (x, w, col, top) => { g.fillStyle = col; g.fillRect(x - w / 2, top, w, S - top); };
    body(52, 70, '#2f8f8a', 150); body(118, 78, '#d8a531', 140); body(178, 64, '#1d1d22', 156); body(226, 46, '#f2d43b', 186);
    head(g, 52, 118, 54, '#f1c7a1', '#6b3b23', (g, x, y, s, hc) => { g.fillStyle = '#6b3b23'; g.fillRect(x - s / 2, y - s / 2 - 4, s, 12); g.beginPath(); g.arc(x, y - s / 2 - 16, 15, 0, TAU); g.fill(); });
    head(g, 118, 104, 58, '#e0ac69', '#3b2416', (g, x, y, s) => { g.fillStyle = '#3b2416'; g.fillRect(x - s / 2, y - s / 2 - 4, s, 10); g.fillRect(x - s / 2 + 4, y + s * 0.2, s - 8, s * 0.24); g.strokeStyle = '#111'; g.lineWidth = 3; g.strokeRect(x - s * 0.3, y - s * 0.13, s * 0.22, s * 0.18); g.strokeRect(x + s * 0.08, y - s * 0.13, s * 0.22, s * 0.18); });
    head(g, 178, 126, 50, '#f1c7a1', '#2b1d14', (g, x, y, s) => { g.fillStyle = '#2b1d14'; g.fillRect(x - s / 2, y - s / 2 - 3, s, 9); g.strokeStyle = '#f2f2f2'; g.lineWidth = 6; g.beginPath(); g.arc(x, y - 4, s * 0.6, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.fillStyle = '#f2f2f2'; g.fillRect(x - s * 0.66, y - 8, 10, 18); g.fillRect(x + s * 0.56, y - 8, 10, 18); });
    head(g, 226, 166, 38, '#c68642', '#1a120c', (g, x, y, s) => { g.fillStyle = '#1a120c'; g.beginPath(); g.arc(x - 16, y - 20, 10, 0, TAU); g.arc(x + 16, y - 20, 10, 0, TAU); g.fill(); g.fillRect(x - s / 2, y - s / 2 - 2, s, 7); });
  });
  // 1 landscape: hills + sun
  cell(1, (g, S) => {
    const grd = g.createLinearGradient(0, 0, 0, S); grd.addColorStop(0, '#f6c987'); grd.addColorStop(0.55, '#f1a46b'); grd.addColorStop(1, '#5b7d57'); g.fillStyle = grd; g.fillRect(0, 0, S, S);
    g.fillStyle = '#fff1c4'; g.beginPath(); g.arc(S * 0.68, S * 0.38, 26, 0, TAU); g.fill();
    g.fillStyle = '#6d8f5a'; g.beginPath(); g.moveTo(0, S * 0.7); g.quadraticCurveTo(S * 0.3, S * 0.45, S * 0.62, S * 0.66); g.quadraticCurveTo(S * 0.85, S * 0.6, S, S * 0.68); g.lineTo(S, S); g.lineTo(0, S); g.fill();
    g.fillStyle = '#486a43'; g.beginPath(); g.moveTo(0, S * 0.84); g.quadraticCurveTo(S * 0.5, S * 0.68, S, S * 0.86); g.lineTo(S, S); g.lineTo(0, S); g.fill();
  });
  // 2 abstract (mid-century shapes)
  cell(2, (g, S) => {
    g.fillStyle = '#efe3c8'; g.fillRect(0, 0, S, S);
    const cols = ['#d6603d', '#2f6f8f', '#e8b04b', '#3c7a5a', '#1f2a44'];
    for (let k = 0; k < 7; k++) { g.fillStyle = cols[k % cols.length]; const x = r() * S, y = r() * S, s = 30 + r() * 70; if (k % 2) { g.beginPath(); g.arc(x, y, s / 2, 0, TAU); g.fill(); } else g.fillRect(x - s / 2, y - s / 2, s, s * (0.4 + r())); }
  });
  // 3 sailing boat
  cell(3, (g, S) => {
    const grd = g.createLinearGradient(0, 0, 0, S); grd.addColorStop(0, '#9fc6e0'); grd.addColorStop(0.62, '#dceaf0'); grd.addColorStop(0.63, '#3d7aa3'); grd.addColorStop(1, '#244f73'); g.fillStyle = grd; g.fillRect(0, 0, S, S);
    g.fillStyle = '#8a4b2c'; g.beginPath(); g.moveTo(70, 170); g.lineTo(190, 170); g.lineTo(170, 192); g.lineTo(90, 192); g.fill();
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.moveTo(130, 60); g.lineTo(130, 165); g.lineTo(78, 165); g.fill(); g.fillStyle = '#e45d3b'; g.beginPath(); g.moveTo(136, 70); g.lineTo(136, 165); g.lineTo(186, 165); g.fill();
  });
  // 4 flowers in a vase
  cell(4, (g, S) => {
    g.fillStyle = '#2f3a4a'; g.fillRect(0, 0, S, S);
    g.fillStyle = '#c9b07a'; g.fillRect(96, 150, 64, 90);
    for (let k = 0; k < 9; k++) { const a = -1.2 + k * 0.3, x = 128 + Math.sin(a) * 80, y = 150 - Math.cos(a) * 90 + r() * 20;
      g.strokeStyle = '#4c7a3e'; g.lineWidth = 4; g.beginPath(); g.moveTo(128, 155); g.lineTo(x, y); g.stroke();
      g.fillStyle = ['#f28c8c', '#f6d55c', '#f3f0e8', '#e86f51'][k % 4]; g.beginPath(); g.arc(x, y, 14 + r() * 8, 0, TAU); g.fill(); }
  });
  // 5 baby/kid photo: Pip as a toddler on a blanket
  cell(5, (g, S) => {
    g.fillStyle = '#bfe0e8'; g.fillRect(0, 0, S, S); g.fillStyle = '#f2d43b'; g.fillRect(40, 150, 176, 80);
    head(g, 128, 120, 80, '#c68642', '#1a120c', (g, x, y, s) => { g.fillStyle = '#1a120c'; g.beginPath(); g.arc(x - 30, y - 42, 14, 0, TAU); g.arc(x + 30, y - 42, 14, 0, TAU); g.fill(); });
  });
  // 6 kid's crayon house drawing (fridge)
  cell(6, (g, S) => {
    g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, S, S);
    g.lineWidth = 7; g.lineCap = 'round';
    g.strokeStyle = '#e8483b'; g.beginPath(); g.moveTo(50, 120); g.lineTo(128, 50); g.lineTo(206, 120); g.stroke();
    g.strokeStyle = '#3a6fd8'; g.strokeRect(62, 120, 132, 100);
    g.strokeStyle = '#f2b500'; g.beginPath(); g.arc(215, 45, 22, 0, TAU); g.stroke();
    g.strokeStyle = '#2c9a48'; g.beginPath(); g.moveTo(10, 238); g.lineTo(246, 236); g.stroke();
    g.fillStyle = '#7a4a24'; g.fillRect(112, 170, 30, 50);
  });
  // 7 calendar / shopping note
  cell(7, (g, S) => {
    g.fillStyle = '#fff7b8'; g.fillRect(0, 0, S, S);
    g.fillStyle = '#c0392b'; g.fillRect(0, 0, S, 40);
    g.strokeStyle = '#8a7f5a'; g.lineWidth = 2;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(16, 70 + k * 30); g.lineTo(16 + 60 + r() * 150, 70 + k * 30); g.stroke(); }
  });
  // 8 botanical print
  cell(8, (g, S) => {
    g.fillStyle = '#f1ead9'; g.fillRect(0, 0, S, S); g.strokeStyle = '#3f6b45'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(128, 236); g.quadraticCurveTo(120, 130, 132, 30); g.stroke(); g.fillStyle = '#5d8a57';
    for (let k = 0; k < 8; k++) { const y = 60 + k * 22, sd = k % 2 ? 1 : -1; g.save(); g.translate(128, y); g.rotate(sd * 0.9); g.beginPath(); g.ellipse(sd * 30, 0, 34, 12, 0, 0, TAU); g.fill(); g.restore(); }
  });
  // 9 night-light moon (Pip's room) — drawn bright, used emissive
  cell(9, (g, S) => { g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.fillStyle = '#ffe7a8'; g.beginPath(); g.arc(128, 128, 90, 0, TAU); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(170, 100, 84, 0, TAU); g.fill(); });
  // 10 BAKERY sign (hand painted)
  cell(10, (g, S) => {
    g.fillStyle = '#6b3f22'; g.fillRect(0, 0, S, S); g.fillStyle = '#f3e3b5'; g.fillRect(10, 70, S - 20, 116);
    g.fillStyle = '#9c3b22'; g.font = '900 58px "ITT World Display", "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BAKERY', 128, 130);
    g.fillStyle = '#c98a3e'; g.beginPath(); g.ellipse(128, 40, 46, 22, 0, 0, TAU); g.fill();
  });
  // 11 house number plaque "12"
  cell(11, (g, S) => { g.fillStyle = '#20354a'; g.fillRect(0, 0, S, S); g.strokeStyle = '#d9b45a'; g.lineWidth = 10; g.strokeRect(14, 14, S - 28, S - 28); g.fillStyle = '#f2e6c4'; g.font = '900 150px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('12', 128, 138); });
  // 12 clock face
  cell(12, (g, S) => { g.fillStyle = '#f7f1e3'; g.fillRect(0, 0, S, S); g.fillStyle = '#222'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.fillRect(128 + Math.sin(a) * 100 - 5, 128 - Math.cos(a) * 100 - 5, 10, 10); } g.lineWidth = 9; g.strokeStyle = '#222'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 50, 128 + 20); g.moveTo(128, 128); g.lineTo(128 - 10, 128 - 85); g.stroke(); });
  // 13 star sticker sheet (glow stars) — emissive use
  cell(13, (g, S) => { g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.fillStyle = '#d8ffcf'; for (let k = 0; k < 14; k++) { const x = 20 + r() * 216, y = 20 + r() * 216, s = 6 + r() * 9; g.beginPath(); for (let j = 0; j < 10; j++) { const a = j / 10 * TAU, rr = j % 2 ? s * 0.45 : s; g.lineTo(x + Math.sin(a) * rr, y - Math.cos(a) * rr); } g.fill(); } });
  // 14 kid portrait of me (headphones) — a school photo
  cell(14, (g, S) => { g.fillStyle = '#7da7c9'; g.fillRect(0, 0, S, S); g.fillStyle = '#1d1d22'; g.fillRect(58, 180, 140, 80); head(g, 128, 120, 96, '#f1c7a1', '#2b1d14', (g, x, y, s) => { g.fillStyle = '#2b1d14'; g.fillRect(x - s / 2, y - s / 2 - 4, s, 14); g.strokeStyle = '#f2f2f2'; g.lineWidth = 9; g.beginPath(); g.arc(x, y - 6, s * 0.62, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); }); });
  // 15 runner stripes swatch (unused cell)
  cell(15, (g, S) => { g.fillStyle = '#7b2d2a'; g.fillRect(0, 0, S, S); });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const cellUV = (i) => { const x = i % N, y = Math.floor(i / N); return [x / N, 1 - (y + 1) / N, (x + 1) / N, 1 - y / N]; };
  return { tex, cellUV };
}
function runnerTex() {
  const c = mkCanvas(256, 1024), g = c.getContext('2d');
  g.fillStyle = '#7d2f2b'; g.fillRect(0, 0, 256, 1024);
  g.fillStyle = '#2b3d55'; g.fillRect(0, 0, 34, 1024); g.fillRect(222, 0, 34, 1024);
  g.fillStyle = '#e8c672'; g.fillRect(34, 0, 10, 1024); g.fillRect(212, 0, 10, 1024);
  for (let y = 0; y < 1024; y += 128) { g.fillStyle = '#e8c672'; g.beginPath(); g.moveTo(128, y + 20); g.lineTo(178, y + 64); g.lineTo(128, y + 108); g.lineTo(78, y + 64); g.fill(); g.fillStyle = '#2b3d55'; g.beginPath(); g.moveTo(128, y + 44); g.lineTo(152, y + 64); g.lineTo(128, y + 84); g.lineTo(104, y + 64); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
function webTex() {
  const c = mkCanvas(256, 256), g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.5;
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 0.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 256, Math.sin(a) * 256); g.stroke(); }
  for (let rr = 24; rr < 256; rr += 26) { g.beginPath(); for (let k = 0; k <= 9; k++) { const a = k / 9 * Math.PI * 0.5, q = rr * (0.92 + 0.08 * Math.sin(k * 2.1)); k ? g.lineTo(Math.cos(a) * q, Math.sin(a) * q) : g.moveTo(Math.cos(a) * q, Math.sin(a) * q); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function paintEdgeTex() {   // the half-painted wall: yellow on the left, ragged roller edge, a few drips
  const c = mkCanvas(512, 256), g = c.getContext('2d'), r = rng(17);
  g.clearRect(0, 0, 512, 256); g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(0, 0); let x = 270;
  for (let y = 0; y <= 256; y += 8) { x = 262 + Math.sin(y * 0.05) * 10 + r() * 14; g.lineTo(x, y); }
  g.lineTo(0, 256); g.closePath(); g.fill();
  for (let k = 0; k < 7; k++) { const y = 20 + r() * 200, l = 10 + r() * 36; g.fillRect(268 + r() * 10, y, 22 + r() * 30, 5 + r() * 6); g.fillRect(250 + r() * 30, y, 4, l); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ═════════════════════════════════════════════ small prop geometry (local, uv in metres) ═════════════════════════
const cyl = (rt, rb, h, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);
const sph = (r, ws = 14, hs = 10) => new THREE.SphereGeometry(r, ws, hs);
function taperedBox(w, h, d, topScale = 0.7, seg = 6) {   // coats, bags: narrower at the top
  const g = boxG(w, h, d);
  const g2 = new THREE.BoxGeometry(w, h, d, 2, seg, 1);
  const p = g2.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = clamp((p.getY(i) / h) + 0.5, 0, 1); const k = lerp(1, topScale, Math.pow(v, 1.5)); p.setX(i, p.getX(i) * lerp(1, 0.85, v)); p.setZ(i, p.getZ(i) * k); }
  g2.computeVertexNormals();
  const uv = g2.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  g.dispose();
  return g2;
}

// ═════════════════════════════════════════════ build ══════════════════════════════════════════════════════════════
const DEFAULT_OPTIONS = {
  lighting: 'night_lamp', nightMix: 0, practical: 'fridge', lamp: null, porchGlow: null, torch: null,
  fridgeOpen: 0, fridgeLight: true, boxDoorOpen: 0, boxRoomLight: null, strip: null, stripFeet: null, hatchOpen: 0,
  frontDoorOpen: 0, pipDoorOpen: 0.1, kitchenLight: 0, pendants: 0, shafts: null, dust: null, streetLights: null,
  windowGlow: null, moonShadow: false, lanterns: 0, lanternsLit: 5, photo: true, shoes: true, coats: true,
  neighbourDoorOpen: 0, neighbourPorchGlow: 0, exterior: true, outdoors: false, sunDir: null, atticLight: 0,
};
export const HOME_PRESETS = ['night_lamp', 'night_torch', 'dusk', 'dusk_to_night', 'dark_practical', 'morning', 'boxroom_lamp'];

export function buildHome(ctx, opts = {}) {
  const H = HOME, CE = H.CEIL, T = H.T, GY = H.GROUND_Y;
  const r = rng(opts.seed ?? 7);
  const M = makeMats();
  const root = new THREE.Group(); root.name = 'home';
  const interior = new THREE.Group(); interior.name = 'home:interior'; root.add(interior);
  const exterior = new THREE.Group(); exterior.name = 'home:exterior'; root.add(exterior);
  const B = batcher();          // static interior + shell
  const X = batcher();          // static exterior (street, neighbours)
  const anchors = {};
  const anchor = (name, pos, yaw = 0, parent = root, extra = null) => {
    const o = new THREE.Object3D(); o.name = name; o.position.set(...pos); o.rotation.y = yaw; parent.add(o);
    if (extra) Object.assign(o.userData, extra);
    anchors[name] = o; return o;
  };
  const atlas = pictureAtlas(31);
  const picMat = new THREE.MeshStandardMaterial({ map: atlas.tex, roughness: 0.55 });
  const glowAtlasMat = new THREE.MeshBasicMaterial({ map: atlas.tex, color: '#000000', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const picGeos = [], glowAtlasGeos = [];
  const picture = (cell, w, h, pos, rotY, list = picGeos) => {
    const g = new THREE.PlaneGeometry(w, h); const [u0, v0, u1, v1] = atlas.cellUV(cell);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, lerp(u0, u1, uv.getX(i)), lerp(v0, v1, uv.getY(i)));
    g.rotateY(rotY); g.translate(...pos); list.push(g);
  };
  // frames (oak or paint) + picture planes, on a wall facing direction yaw (0 = +Z)
  const framed = (cell, w, h, center, yaw, { frame = '#3a2a1e', key = 'oak', depth = 0.04, mount = true } = {}) => {
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(...center);
    const bw = 0.05;
    const parts = [[0, h / 2 + bw / 2, w + bw * 2, bw], [0, -h / 2 - bw / 2, w + bw * 2, bw], [-w / 2 - bw / 2, 0, bw, h], [w / 2 + bw / 2, 0, bw, h]];
    for (const [x, y, pw, ph] of parts) B.add(key, boxG(pw, ph, depth), { matrix: new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(x, y, depth / 2)), color: frame });
    if (mount) B.add('paint', boxG(w, h, 0.01), { matrix: new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(0, 0, 0.006)), color: '#f4efe4' });
    const p = new THREE.Vector3(0, 0, 0.014).applyMatrix4(m);
    picture(cell, w * (mount ? 0.84 : 1), h * (mount ? 0.84 : 1), [p.x, p.y, p.z], yaw);
  };

  // ── palette ────────────────────────────────────────────────────────────────────────────────────────────────────
  const C = {
    hallWall: opts.wallColor ?? '#e8cf9c', hallPanel: '#efe5cf', ceiling: '#f3ede2', trim: '#f5eee2', floor: '#ffffff', doorInt: '#e8e0d0',
    pipDoor: '#d9b5c8', frontDoor: '#2d5a86', kitchenWall: '#f0d9a0', cabinet: '#93ad8c', boxWall: '#d9d3c8', yellow: '#f2c94c',
    pipWall: '#a993cf', siding: '#efe6d2', shutter: '#3f6a8f', plinth: '#ffffff', porch: '#9aa0a3', post: '#f5f0e6',
  };

  // ════════════════════════════════════════ SHELL: floors, walls, ceiling ════════════════════════════════════════
  const F = H.FOOT;
  // floor slabs (top y = 0): boards everywhere except the kitchen (tiles)
  B.box('floor', [F.x0, -0.2, F.z0], [H.KITCHEN.x0 - 0.0, 0, F.z1], { uvOff: [0, 0] });
  B.box('floor', [H.KITCHEN.x1, -0.2, F.z0], [F.x1, 0, F.z1]);
  B.box('floor', [H.KITCHEN.x0, -0.2, F.z0], [H.KITCHEN.x1, 0, H.KITCHEN.z0]);
  B.box('tile', [H.KITCHEN.x0, -0.2, H.KITCHEN.z0], [H.KITCHEN.x1, 0, H.KITCHEN.z1]);
  // ceiling slab y 3.4..3.55 with the hatch hole
  const HT = H.HATCH;
  B.box('plaster', [F.x0, CE, F.z0], [F.x1, CE + 0.15, HT.z0], { color: C.ceiling });
  B.box('plaster', [F.x0, CE, HT.z1], [F.x1, CE + 0.15, F.z1], { color: C.ceiling });
  B.box('plaster', [F.x0, CE, HT.z0], [HT.x0, CE + 0.15, HT.z1], { color: C.ceiling });
  B.box('plaster', [HT.x1, CE, HT.z0], [F.x1, CE + 0.15, HT.z1], { color: C.ceiling });
  // outer walls
  const FD = H.FRONT_DOOR, DH = H.DOOR_H;
  const kitWin = { x0: 2.6, x1: 4.4, y0: 1.35, y1: 2.75 }, pipWin = { x0: -4.1, x1: -2.5, y0: 1.2, y1: 2.6 };
  wallXY(B, 'plaster', { x0: F.x0, x1: F.x1, y0: 0, y1: CE, z0: 10.0, z1: F.z1 }, [
    { x0: -1.24, x1: 1.24, y0: 0, y1: 3.25 }, kitWin, pipWin,
  ], { color: C.kitchenWall });
  B.box('plaster', [F.x0, 0, F.z0], [F.x1, CE, F.z0 + T], { color: C.boxWall });              // north
  B.box('plaster', [F.x0, 0, F.z0], [F.x0 + T, CE, F.z1], { color: C.pipWall });              // west
  B.box('plaster', [F.x1 - T, 0, F.z0], [F.x1, CE, F.z1], { color: C.kitchenWall });          // east
  // hall west wall (x −1.46..−1.30) with Pip's door; east wall (1.30..1.46) with the arch
  const PD = H.PIP_DOOR, AR = H.ARCH;
  wallZY(B, 'plaster', { z0: 0, z1: 10, y0: 0, y1: CE, x0: -1.46, x1: -1.30 }, [{ z0: PD.z0, z1: PD.z1, y0: 0, y1: DH }], { color: C.hallWall });
  wallZY(B, 'plaster', { z0: 0, z1: 10, y0: 0, y1: CE, x0: 1.30, x1: 1.46 }, [{ z0: AR.z0, z1: AR.z1, y0: 0, spring: AR.spring, arch: true }], { color: C.hallWall });
  // hall north wall (z −0.16..0) with the box-room door
  const BD = H.BOX_DOOR;
  wallXY(B, 'plaster', { x0: -1.46, x1: 1.46, y0: 0, y1: CE, z0: -0.16, z1: 0 }, [{ x0: BD.x0, x1: BD.x1, y0: 0, y1: DH }], { color: C.hallWall });
  // box room side walls + the rest of the north rooms (closed shells)
  B.box('plaster', [-2.06, 0, -3.8], [-1.9, CE, -0.16], { color: C.boxWall });
  B.box('plaster', [1.9, 0, -3.8], [2.06, CE, -0.16], { color: C.boxWall });
  // Pip's room north wall, kitchen north wall
  B.box('plaster', [F.x0, 0, H.PIP.z0 - T], [-1.46, CE, H.PIP.z0], { color: C.pipWall });
  B.box('plaster', [1.46, 0, H.KITCHEN.z0 - T], [F.x1, CE, H.KITCHEN.z0], { color: C.kitchenWall });
  // lower hall wainscot (panelled, cream) + dado rail + skirting + cornice
  const wains = (axis, fixed, a0, a1, side) => {      // axis 'z' (east/west walls) or 'x' (north wall); side = normal sign
    const segs = [];
    if (axis === 'z') {
      const holes = side < 0 ? [[AR.z0, AR.z1]] : [[PD.z0, PD.z1]];
      let s = a0; for (const [h0, h1] of holes) { segs.push([s, h0 - 0.1]); s = h1 + 0.1; } segs.push([s, a1]);
    } else segs.push([a0, BD.x0 - 0.1], [BD.x1 + 0.1, a1]);
    for (const [s0, s1] of segs) {
      if (s1 - s0 < 0.05) continue;
      const fx = fixed + side * 0.012;
      if (axis === 'z') {
        B.box('paint', [Math.min(fixed, fx), 0, s0], [Math.max(fixed, fx), 1.25, s1], { color: C.hallPanel });
        B.box('paint', [Math.min(fixed, fixed + side * 0.05), 1.22, s0], [Math.max(fixed, fixed + side * 0.05), 1.29, s1], { color: C.trim });
        B.box('paint', [Math.min(fixed, fixed + side * 0.035), 0, s0], [Math.max(fixed, fixed + side * 0.035), 0.2, s1], { color: C.trim });
        // raised panel mouldings
        const n = Math.max(1, Math.round((s1 - s0) / 0.9));
        for (let k = 0; k < n; k++) {
          const z0 = s0 + (s1 - s0) * k / n + 0.09, z1 = s0 + (s1 - s0) * (k + 1) / n - 0.09;
          for (const [y0, y1, zz0, zz1] of [[0.32, 0.35, z0, z1], [1.06, 1.09, z0, z1], [0.32, 1.09, z0, z0 + 0.03], [0.32, 1.09, z1 - 0.03, z1]])
            B.box('paint', [Math.min(fx, fx + side * 0.018), y0, zz0], [Math.max(fx, fx + side * 0.018), y1, zz1], { color: C.trim });
        }
      } else {
        B.box('paint', [s0, 0, fixed], [s1, 1.25, fixed + 0.012], { color: C.hallPanel });
        B.box('paint', [s0, 1.22, fixed], [s1, 1.29, fixed + 0.05], { color: C.trim });
        B.box('paint', [s0, 0, fixed], [s1, 0.2, fixed + 0.035], { color: C.trim });
      }
    }
  };
  wains('z', -1.30, 0, 10, 1);    // west wall, normal +x
  wains('z', 1.30, 0, 10, -1);    // east wall, normal −x
  wains('x', 0, -1.30, 1.30, 1);
  // cornice
  B.box('paint', [-1.30, CE - 0.1, 0], [-1.24, CE, 10], { color: C.trim });
  B.box('paint', [1.24, CE - 0.1, 0], [1.30, CE, 10], { color: C.trim });
  B.box('paint', [-1.3, CE - 0.1, 0], [1.3, CE, 0.06], { color: C.trim });
  // architraves (door casings) — hall side
  const casingZ = (x, z0, z1, side) => {           // door in an east/west wall
    const xa = Math.min(x, x + side * 0.03), xb = Math.max(x, x + side * 0.03);
    B.box('paint', [xa, 0, z0 - 0.12], [xb, DH + 0.12, z0], { color: C.trim });
    B.box('paint', [xa, 0, z1], [xb, DH + 0.12, z1 + 0.12], { color: C.trim });
    B.box('paint', [xa, DH, z0 - 0.12], [xb, DH + 0.14, z1 + 0.12], { color: C.trim });
  };
  casingZ(-1.30, PD.z0, PD.z1, 1);
  B.box('paint', [-1.46, 0, PD.z0 - 0.02], [-1.30, DH, PD.z0], { color: C.trim });   // jamb linings
  B.box('paint', [-1.46, 0, PD.z1], [-1.30, DH, PD.z1 + 0.02], { color: C.trim });
  B.box('paint', [-1.46, DH - 0.02, PD.z0], [-1.30, DH, PD.z1], { color: C.trim });
  // box door casing (north wall, hall side z = 0) and inside the box room
  for (const [zz, s] of [[0, 1], [-0.16, -1]]) {
    const za = Math.min(zz, zz + s * 0.03), zb = Math.max(zz, zz + s * 0.03);
    B.box('paint', [BD.x0 - 0.12, 0, za], [BD.x0, DH + 0.12, zb], { color: C.trim });
    B.box('paint', [BD.x1, 0, za], [BD.x1 + 0.12, DH + 0.12, zb], { color: C.trim });
    B.box('paint', [BD.x0 - 0.12, DH, za], [BD.x1 + 0.12, DH + 0.14, zb], { color: C.trim });
  }
  // arch: thin trim along the arch edge (hall side) — approximated with jamb boards + an arc of small boxes
  for (const zz of [AR.z0, AR.z1]) B.box('paint', [1.26, 0, zz - (zz === AR.z0 ? 0.1 : 0)], [1.31, AR.spring, zz + (zz === AR.z1 ? 0.1 : 0)], { color: C.trim });
  for (let k = 0; k <= 14; k++) {
    const a = Math.PI * k / 14, rr = (AR.z1 - AR.z0) / 2 + 0.05, cz = (AR.z0 + AR.z1) / 2;
    B.add('paint', boxG(0.05, 0.1, 0.24), { pos: [1.285, AR.spring + Math.sin(a) * rr, cz + Math.cos(a) * rr], rot: [-(Math.PI / 2 - a), 0, 0], color: C.trim });
  }
  // kitchen side of the arch wall: kitchen colour skin (thin box) so the kitchen reads butter-yellow
  wallZY(B, 'plaster', { z0: H.KITCHEN.z0, z1: 10, y0: 0, y1: CE, x0: 1.46, x1: 1.47 }, [{ z0: AR.z0, z1: AR.z1, y0: 0, spring: AR.spring, arch: true }], { color: C.kitchenWall });
  // Pip side of her door wall
  wallZY(B, 'plaster', { z0: H.PIP.z0, z1: 10, y0: 0, y1: CE, x0: -1.47, x1: -1.46 }, [{ z0: PD.z0, z1: PD.z1, y0: 0, y1: DH }], { color: C.pipWall });
  // box room: north wall half painted yellow (decal plane with ragged edge), bare skirting
  anchor('box.wall', [0, 1.6, -3.8 + 0.02], 0);
  const paintMat = new THREE.MeshStandardMaterial({ map: paintEdgeTex(), color: C.yellow, roughness: 0.6, transparent: false, alphaTest: 0.5 });
  const paintPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.8, CE - 0.02), paintMat);
  paintPlane.position.set(0, CE / 2, -3.8 + 0.006); paintPlane.receiveShadow = true; interior.add(paintPlane);

  // ════════════════════════════════════════ FRONT: glazed door, sidelights, transom ═════════════════════════════
  const glassMat = new THREE.MeshStandardMaterial({ color: '#dfe8ec', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false, envMapIntensity: 1.5 });
  const glassGeos = [];
  const glass = (a, b) => { const g = boxG(b[0] - a[0], b[1] - a[1], b[2] - a[2]); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); glassGeos.push(prep(g)); };
  // frame: jambs at ±0.7..0.8 (between door and sidelights), outer jambs ±1.16..1.24, head, transom bar, sills
  const FZ0 = 10.0, FZ1 = 10.16;
  for (const s of [-1, 1]) {
    B.box('paint', [Math.min(s * 0.7, s * 0.8), 0, FZ0 - 0.02], [Math.max(s * 0.7, s * 0.8), 2.85, FZ1 + 0.02], { color: C.trim });
    B.box('paint', [Math.min(s * 1.16, s * 1.24), 0, FZ0 - 0.02], [Math.max(s * 1.16, s * 1.24), 3.25, FZ1 + 0.02], { color: C.trim });
    B.box('paint', [Math.min(s * 0.8, s * 1.16), 0, FZ0 - 0.01], [Math.max(s * 0.8, s * 1.16), 0.45, FZ1 + 0.01], { color: C.frontDoor });   // sidelight kick panel
    B.box('paint', [Math.min(s * 0.8, s * 1.16), 0.45, FZ0 + 0.06], [Math.max(s * 0.8, s * 1.16), 0.48, FZ1 - 0.04], { color: C.trim });
    glass([Math.min(s * 0.8, s * 1.16), 0.48, FZ0 + 0.07], [Math.max(s * 0.8, s * 1.16), 2.85, FZ0 + 0.09]);
  }
  B.box('paint', [-1.24, 2.75, FZ0 - 0.02], [1.24, 2.85, FZ1 + 0.02], { color: C.trim });      // head / transom bar
  B.box('paint', [-1.24, 3.25, FZ0 - 0.02], [1.24, 3.32, FZ1 + 0.02], { color: C.trim });
  glass([-1.16, 2.85, FZ0 + 0.07], [1.16, 3.25, FZ0 + 0.09]);
  for (const x of [-0.4, 0.4]) B.box('paint', [x - 0.025, 2.85, FZ0 + 0.04], [x + 0.025, 3.25, FZ0 + 0.12], { color: C.trim });  // transom glazing bars
  B.box('paint', [-1.3, -0.01, 9.9], [1.3, 0.025, 10.16], { color: '#8a6a4a' });   // threshold
  // door leaf (dynamic): hinge at x = −0.7, leaf extends +x, glass panel
  const frontDoor = new THREE.Group(); frontDoor.name = 'frontDoor'; frontDoor.position.set(-0.7, 0, 10.04); interior.add(frontDoor);
  {
    const D = batcher(), W = 1.4, t = 0.07;
    D.box('paint', [0.0, 0, -t / 2], [0.09, 2.74, t / 2], { color: C.frontDoor });
    D.box('paint', [W - 0.09, 0, -t / 2], [W, 2.74, t / 2], { color: C.frontDoor });
    D.box('paint', [0.09, 0, -t / 2], [W - 0.09, 0.45, t / 2], { color: C.frontDoor });
    D.box('paint', [0.09, 2.62, -t / 2], [W - 0.09, 2.74, t / 2], { color: C.frontDoor });
    D.box('paint', [0.15, 0.1, -t / 2 - 0.01], [W - 0.15, 0.36, t / 2 + 0.01], { color: '#3a6a96' });   // kick panel moulding
    D.box('paint', [0.09, 0.45, -0.012], [W - 0.09, 0.48, 0.012], { color: C.frontDoor });            // glazing beads
    D.add('metal', cyl(0.02, 0.02, 0.32, 8), { pos: [W - 0.16, 1.3, -t / 2 - 0.05], color: '#d4b26a' });   // inside pull handle
    D.add('metal', boxG(0.04, 0.04, 0.05), { pos: [W - 0.16, 1.42, -t / 2 - 0.025], color: '#d4b26a' });
    D.add('metal', boxG(0.04, 0.04, 0.05), { pos: [W - 0.16, 1.18, -t / 2 - 0.025], color: '#d4b26a' });
    D.add('metal', cyl(0.02, 0.02, 0.32, 8), { pos: [W - 0.16, 1.3, t / 2 + 0.05], color: '#d4b26a' });
    D.add('metal', boxG(0.22, 0.06, 0.02), { pos: [W / 2, 0.3, t / 2 + 0.012], color: '#d4b26a' });          // letterbox
    D.build(frontDoor, M, { name: 'frontDoor' });
    const g = prep(boxG(W - 0.18, 2.14, 0.016)); g.translate(W / 2, 0.45 + 2.14 / 2 + 0.03, 0);
    const pane = new THREE.Mesh(g, glassMat); pane.renderOrder = 4; pane.castShadow = false; frontDoor.add(pane);
  }
  anchor('hall.frontDoor', [0, 0, 9.5], Math.PI);
  anchor('hall.frontDoor.out', [0, H.PORCH_Y, 10.9], 0);
  // ════════════════════════════════════════ doors: Pip's, box room ═════════════════════════════════════════════
  const doorLeaf = (name, W, color, parent, pos, { panels = true, handleSide = 1 } = {}) => {
    const g = new THREE.Group(); g.name = name; g.position.set(...pos); parent.add(g);
    const D = batcher(), t = 0.06;
    D.box('paint', [0, 0, -t / 2], [W, DH - 0.01, t / 2], { color });
    if (panels) for (const [y0, y1] of [[0.2, 1.15], [1.35, 2.55]]) for (const sz of [-1, 1]) {
      const z = sz * (t / 2 + 0.006);
      D.box('paint', [0.14, y0, Math.min(z, z + sz * 0.012)], [W - 0.14, y0 + 0.035, Math.max(z, z + sz * 0.012)], { color });
      D.box('paint', [0.14, y1 - 0.035, Math.min(z, z + sz * 0.012)], [W - 0.14, y1, Math.max(z, z + sz * 0.012)], { color });
      D.box('paint', [0.14, y0, Math.min(z, z + sz * 0.012)], [0.175, y1, Math.max(z, z + sz * 0.012)], { color });
      D.box('paint', [W - 0.175, y0, Math.min(z, z + sz * 0.012)], [W - 0.14, y1, Math.max(z, z + sz * 0.012)], { color });
    }
    const hx = handleSide > 0 ? W - 0.1 : 0.1;
    for (const sz of [-1, 1]) {
      D.add('metal', boxG(0.05, 0.16, 0.012), { pos: [hx, 1.3, sz * (t / 2 + 0.006)], color: '#c9a45c' });
      D.add('metal', boxG(0.14, 0.03, 0.03), { pos: [hx - handleSide * 0.05, 1.33, sz * (t / 2 + 0.03)], color: '#c9a45c' });
    }
    D.build(g, M, { name });
    return g;
  };
  // Pip's door: hinge at its north jamb (z = 7.42) in the wall plane x = −1.38; leaf spans +z; opens into her room (−x)
  const pipDoor = doorLeaf('pipDoor', PD.z1 - PD.z0, C.pipDoor, interior, [-1.38, 0, PD.z0]);
  pipDoor.rotation.y = -Math.PI / 2;      // local +x → world +z
  // box-room door: hinge at x = +0.58 (east jamb), leaf spans −x; opens into the box room (−z)
  const boxDoor = doorLeaf('boxDoor', BD.x1 - BD.x0, C.doorInt, interior, [BD.x1, 0, -0.08], { handleSide: 1 });
  boxDoor.rotation.y = Math.PI;           // local +x → world −x
  anchor('hall.boxDoor', [0, 0, 0.7], Math.PI);
  anchor('hall.boxDoor.strip', [0, 0, 0.02], 0);
  anchor('box.door', [0, 0, -0.9], 0);
  anchor('box.behindDoor', [1.15, 0, -0.55], -Math.PI / 2);
  anchor('hall.pipDoor', [-0.55, 0, 8.0], -Math.PI / 2);
  anchor('hall.pipDoor.gap', [-1.36, 1.62, PD.z1 - 0.03], Math.PI / 2);
  anchor('hall.pipDoor.drawings', [-1.28, 1.05, PD.z0 - 0.32], Math.PI / 2, root, { size: [0.3, 1.3], note: 'column of 7 crayon drawings, kid height, on the wall plane facing +x' });
  anchor('pip.room', [-3.2, 0, 8.2], Math.PI / 2);

  // ════════════════════════════════════════ attic hatch ════════════════════════════════════════════════════════
  // opts.hatchSoffit (build-time, e.g. 2.75): a lowered ceiling box (bulkhead) around the hatch, x −1.3…1.0,
  // z 5.8…7.4, its underside at that height, with the hatch in it — so a 2 m figure on a stool can reach it.
  const HSF = opts.hatchSoffit != null ? opts.hatchSoffit : null, HY = HSF ?? CE;
  if (HSF != null) {
    const sx0 = -1.3, sx1 = 1.0, sz0 = 5.8, sz1 = 7.4;
    for (const [a, b] of [[[sx0, HSF, sz0], [sx1, CE, HT.z0]], [[sx0, HSF, HT.z1], [sx1, CE, sz1]], [[sx0, HSF, HT.z0], [HT.x0, CE, HT.z1]], [[HT.x1, HSF, HT.z0], [sx1, CE, HT.z1]]])
      B.box('plaster', a, b, { color: C.ceiling });
    for (const [a, b] of [[[sx0, HSF - 0.04, sz0 - 0.03], [sx1 + 0.03, HSF + 0.06, sz0]], [[sx0, HSF - 0.04, sz1], [sx1 + 0.03, HSF + 0.06, sz1 + 0.03]], [[sx1, HSF - 0.04, sz0], [sx1 + 0.03, HSF + 0.06, sz1]]])
      B.box('paint', a, b, { color: C.trim });                                       // bulkhead edge trim
  }
  for (const [a, b] of [[[HT.x0 - 0.08, HY - 0.03, HT.z0 - 0.08], [HT.x1 + 0.08, HY, HT.z0]], [[HT.x0 - 0.08, HY - 0.03, HT.z1], [HT.x1 + 0.08, HY, HT.z1 + 0.08]],
    [[HT.x0 - 0.08, HY - 0.03, HT.z0], [HT.x0, HY, HT.z1]], [[HT.x1, HY - 0.03, HT.z0], [HT.x1 + 0.08, HY, HT.z1]]]) B.box('paint', a, b, { color: C.trim });
  for (const [a, b] of [[[HT.x0, HY, HT.z0], [HT.x1, CE + 0.25, HT.z0 + 0.03]], [[HT.x0, HY, HT.z1 - 0.03], [HT.x1, CE + 0.25, HT.z1]], [[HT.x0, HY, HT.z0], [HT.x0 + 0.03, CE + 0.25, HT.z1]], [[HT.x1 - 0.03, HY, HT.z0], [HT.x1, CE + 0.25, HT.z1]]])
    B.box('oak', a, b, { color: '#c9a77c' });                                          // hatch lining (shaft up to the attic floor)
  const hatch = new THREE.Group(); hatch.name = 'hatch'; hatch.position.set(0, HY - 0.005, HT.z0 + 0.01); interior.add(hatch);
  {
    const D = batcher();
    D.box('paint', [HT.x0 + 0.015, 0, 0], [HT.x1 - 0.015, 0.05, HT.z1 - HT.z0 - 0.02], { color: C.ceiling });
    D.add('metal', cyl(0.035, 0.035, 0.02, 12), { pos: [0, -0.01, HT.z1 - HT.z0 - 0.12], color: '#b8b8b8' });
    D.build(hatch, M, { name: 'hatch' });
  }
  anchor('hall.hatch', [0, HY, (HT.z0 + HT.z1) / 2], 0, root, { note: 'centre of the hatch panel underside (CEIL, or hatchSoffit)' });
  anchor('hall.underHatch', [0, 0, (HT.z0 + HT.z1) / 2], 0);
  anchor('attic.hatch', [0, CE + 0.15, (HT.z0 + HT.z1) / 2], 0);

  // ════════════════════════════════════════ hall dressing ══════════════════════════════════════════════════════
  // runner + doormat
  const runnerMat = new THREE.MeshStandardMaterial({ map: runnerTex(), roughness: 1 });
  { const p = getHomePBR('carpet'); runnerMat.normalMap = p.normalMap; runnerMat.normalScale.set(0.8, 0.8); }
  {
    const g = boxG(1.1, 0.014, 7.8); const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.1, uv.getY(i) / 2.2);
    const m = new THREE.Mesh(g, runnerMat); m.position.set(0, 0.007, 4.7); m.receiveShadow = true; interior.add(m);
  }
  B.box('coir', [-0.62, 0, 9.05], [0.62, 0.025, 9.85]);
  B.box('fabric', [-0.62, 0, 9.05], [0.62, 0.02, 9.09], { color: '#3b2a1c' });
  B.box('fabric', [-0.62, 0, 9.81], [0.62, 0.02, 9.85], { color: '#3b2a1c' });
  anchor('hall.mat', [0, 0.025, 9.45], Math.PI);
  // shoes: Dad's boots, Mom's teal flats, my black wellies (white knight sticker), Pip's tiny yellow wellies
  const shoeGroup = new THREE.Group(); shoeGroup.name = 'shoes'; interior.add(shoeGroup);
  {
    const D = batcher();
    const pair = (cx, kind, i) => {
      for (const s of [-1, 1]) {
        const x = cx + s * (kind === 'pip' ? 0.055 : 0.085), z = 9.45 + (s > 0 ? 0.02 : -0.02), yaw = Math.PI + s * 0.08;
        const R = [0, yaw, 0];
        if (kind === 'boots') { D.add('plain', boxG(0.15, 0.06, 0.34), { pos: [x, 0.055, z], rot: R, color: '#3a2a1e' }); D.add('fabric', boxG(0.14, 0.26, 0.17), { pos: [x, 0.2, z + 0.07 * Math.cos(yaw)], rot: R, color: '#6b4a2e' }); }
        if (kind === 'flats') { D.add('gloss', boxG(0.12, 0.05, 0.28), { pos: [x, 0.05, z], rot: R, color: '#2f8f8a' }); D.add('plain', boxG(0.1, 0.012, 0.16), { pos: [x, 0.08, z + 0.04], rot: R, color: '#1f5e5a' }); }
        if (kind === 'wellies') { D.add('gloss', boxG(0.15, 0.07, 0.31), { pos: [x, 0.06, z], rot: R, color: '#18181c' }); D.add('gloss', boxG(0.14, 0.36, 0.16), { pos: [x, 0.25, z + 0.06 * Math.cos(yaw)], rot: R, color: '#1d1d22' }); D.add('plain', boxG(0.07, 0.07, 0.004), { pos: [x, 0.3, z - 0.08 * Math.cos(yaw) + 0.0], rot: R, color: '#f2f2f2' }); }
        if (kind === 'pip') { D.add('gloss', boxG(0.09, 0.045, 0.19), { pos: [x, 0.04, z], rot: R, color: '#f2c21b' }); D.add('gloss', boxG(0.085, 0.2, 0.1), { pos: [x, 0.14, z + 0.04 * Math.cos(yaw)], rot: R, color: '#f6d33a' }); }
      }
      anchor(`hall.shoes.${i}`, [cx, 0.025, 9.45], Math.PI);
    };
    pair(-0.42, 'boots', 0); pair(-0.13, 'flats', 1); pair(0.15, 'wellies', 2); pair(0.42, 'pip', 3);
    D.build(shoeGroup, M, { name: 'shoes' });
  }
  // coat hooks on the east wall (x = 1.30) at z 8.85…9.75, rail at y 2.1
  const coatGroup = new THREE.Group(); coatGroup.name = 'coats'; interior.add(coatGroup);
  B.box('oak', [1.27, 2.02, 8.62], [1.30, 2.16, 9.98], { color: '#8a5e3a' });
  {
    const D = batcher();
    const coats = [['#6e4a2c', 1.08, 0.46], ['#2f8f8a', 1.0, 0.42], ['#1d1d22', 0.92, 0.42], ['#f2c21b', 0.62, 0.32]];   // Dad, Mom, me, Pip
    coats.forEach(([col, len, w], i) => {
      const z = 8.85 + i * 0.3;
      B.add('metal', boxG(0.05, 0.03, 0.03), { pos: [1.245, 2.1, z], color: '#c9a45c' });
      anchor(`hall.coat.${i}`, [1.2, 2.08, z], -Math.PI / 2);
      const tilt = (hash(i * 3.1) - 0.5) * 0.08;
      D.add('fabric', taperedBox(0.17, len, w, 0.55), { pos: [1.17, 2.1 - len / 2, z], rot: [tilt, 0, 0.04], color: col });
      D.add('fabric', boxG(0.12, 0.16, w * 0.5), { pos: [1.2, 2.12, z], rot: [0, 0, 0.3], color: col });       // hood / collar bunched on the hook
      if (i === 2) D.add('plain', boxG(0.004, 0.12, 0.1), { pos: [1.08, 1.8, z], color: '#f2f2f2' });       // knight patch hint
    });
    // Pip's tiny backpack under her coat, Dad's scarf
    D.add('fabric', boxG(0.14, 0.3, 0.26), { pos: [1.15, 1.05, 9.75], rot: [0, 0, 0.05], color: '#e86f9a' });
    D.add('fabric', boxG(0.05, 0.7, 0.1), { pos: [1.12, 1.5, 8.98], rot: [0.1, 0, 0], color: '#b33b3b' });
    D.build(coatGroup, M, { name: 'coats' });
  }
  // umbrella stand + plant by the door (west side)
  B.add('gloss', cyl(0.12, 0.1, 0.5, 18), { pos: [-1.0, 0.25, 9.55], color: '#3f6a8f' });
  B.add('plain', cyl(0.018, 0.018, 0.9, 6), { pos: [-0.98, 0.7, 9.53], rot: [0.08, 0, -0.1], color: '#222' });
  B.add('plain', new THREE.ConeGeometry(0.08, 0.5, 8), { pos: [-0.95, 0.85, 9.52], rot: [0.08, 0, -0.1], color: '#c0392b' });
  const plant = (B_, x, y, z, s = 1, potCol = '#c97a52', seed = 1) => {
    B_.add('plain', cyl(0.16 * s, 0.12 * s, 0.32 * s, 14), { pos: [x, y + 0.16 * s, z], color: potCol });
    B_.add('plain', cyl(0.15 * s, 0.15 * s, 0.02, 14), { pos: [x, y + 0.31 * s, z], color: '#3a2a1e' });
    const rr = rng(seed);
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * TAU + rr() * 0.4, tilt = 0.5 + rr() * 0.6, L = (0.35 + rr() * 0.3) * s;
      const g = sph(1, 10, 6); g.scale(0.09 * s, L / 2, 0.025 * s); g.translate(0, L / 2, 0);
      B_.add('plain', g, { pos: [x, y + 0.3 * s, z], rot: new THREE.Euler(Math.cos(a) * tilt, 0, -Math.sin(a) * tilt, 'XZY'), color: rr() < 0.5 ? '#3f7d45' : '#5a9a4e' });
    }
  };
  plant(B, -1.02, 0, 9.82, 1.25, '#d9d2c4', 3);
  // hall table (west wall, z 5.0–6.2) with drawer, lamp, photo, bowl, books
  const TBL = { x0: -1.30, x1: -0.85, z0: 5.0, z1: 6.2, y: H.TABLE };
  B.box('oak', [TBL.x0, TBL.y - 0.05, TBL.z0], [TBL.x1, TBL.y, TBL.z1], { color: '#a0714a' });
  for (const [x, z] of [[TBL.x0 + 0.05, TBL.z0 + 0.05], [TBL.x1 - 0.05, TBL.z0 + 0.05], [TBL.x0 + 0.05, TBL.z1 - 0.05], [TBL.x1 - 0.05, TBL.z1 - 0.05]])
    B.box('oak', [x - 0.03, 0, z - 0.03], [x + 0.03, TBL.y - 0.05, z + 0.03], { color: '#8a5e3a' });
  B.box('oak', [TBL.x0, TBL.y - 0.2, TBL.z0 + 0.04], [TBL.x1 - 0.01, TBL.y - 0.05, TBL.z1 - 0.04], { color: '#9a6a44' });
  B.add('metal', boxG(0.02, 0.03, 0.12), { pos: [TBL.x1 + 0.005, TBL.y - 0.125, (TBL.z0 + TBL.z1) / 2], color: '#c9a45c' });
  B.box('oak', [TBL.x0 + 0.03, 0.18, TBL.z0 + 0.05], [TBL.x1 - 0.03, 0.21, TBL.z1 - 0.05], { color: '#8a5e3a' });   // lower shelf
  for (let k = 0; k < 3; k++) B.box('plain', [TBL.x0 + 0.06, 0.21 + k * 0.06, 5.2 + k * 0.01], [TBL.x0 + 0.36, 0.27 + k * 0.06, 5.55 - k * 0.02], { color: ['#c0392b', '#2f6f8f', '#e8b04b'][k] });
  anchor('hall.table', [(TBL.x0 + TBL.x1) / 2, TBL.y, (TBL.z0 + TBL.z1) / 2], Math.PI / 2);
  anchor('hall.table.lamp', [-1.07, TBL.y, 5.32], Math.PI / 2);
  anchor('hall.table.photo', [-1.12, TBL.y, 5.92], Math.PI / 2 - 0.25);
  B.add('gloss', sph(0.12, 16, 8).scale(1, 0.4, 1), { pos: [-1.05, TBL.y + 0.04, 5.7], color: '#d7c7a8' });           // key bowl
  B.add('metal', boxG(0.08, 0.02, 0.03), { pos: [-1.05, TBL.y + 0.07, 5.7], rot: [0, 0.6, 0], color: '#c9c9c9' });
  // placeholder framed photo on the table (option 'photo')
  const photoGroup = new THREE.Group(); photoGroup.name = 'tablePhoto'; interior.add(photoGroup);
  {
    const D = batcher(), w = 0.3, h = 0.24, fb = 0.03;
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.18, Math.PI / 2 - 0.25, 0, 'YXZ')).setPosition(-1.12, TBL.y + h / 2 + fb + 0.01, 5.92);
    for (const [x, y, pw, ph] of [[0, h / 2 + fb / 2, w + fb * 2, fb], [0, -h / 2 - fb / 2, w + fb * 2, fb], [-w / 2 - fb / 2, 0, fb, h], [w / 2 + fb / 2, 0, fb, h]])
      D.add('gloss', boxG(pw, ph, 0.03), { matrix: new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(x, y, 0)), color: '#c9a45c' });
    D.add('oak', boxG(0.04, h * 0.9, 0.02), { matrix: new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(0, -0.02, -0.06).multiply(new THREE.Matrix4().makeRotationX(0.4))), color: '#6b4a2e' });
    D.build(photoGroup, M, { name: 'photo' });
    const g = new THREE.PlaneGeometry(w, h); const [u0, v0, u1, v1] = atlas.cellUV(0);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, lerp(u0, u1, uv.getX(i)), lerp(v0 + 0.08, v1 - 0.02, uv.getY(i)));
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(0, 0, 0.016)));
    photoGroup.add(new THREE.Mesh(g, picMat));
  }
  // wall art: big landscape above the table, gallery on the east wall, family photos
  framed(1, 1.0, 0.72, [-1.29, 2.05, 5.6], Math.PI / 2, { frame: '#3a2a1e' });
  framed(14, 0.36, 0.44, [-1.29, 1.95, 3.6], Math.PI / 2, { frame: '#c9a45c', key: 'gloss' });
  framed(5, 0.36, 0.44, [-1.29, 2.05, 3.05], Math.PI / 2, { frame: '#f2f2f2', key: 'paint' });
  framed(8, 0.4, 0.55, [-1.29, 1.9, 2.4], Math.PI / 2, { frame: '#3a2a1e' });
  framed(3, 0.62, 0.48, [1.29, 1.95, 7.55], -Math.PI / 2, { frame: '#f2f2f2', key: 'paint' });
  framed(0, 0.5, 0.4, [1.29, 1.92, 3.6], -Math.PI / 2, { frame: '#3a2a1e' });
  framed(2, 0.5, 0.5, [1.29, 2.0, 1.4], -Math.PI / 2, { frame: '#1d1d22', key: 'gloss' });
  framed(4, 0.45, 0.58, [-1.29, 2.0, 1.2], Math.PI / 2, { frame: '#c9a45c', key: 'gloss' });
  framed(12, 0.36, 0.36, [0.9, 2.45, 0.02], 0, { frame: '#1d1d22', key: 'gloss', mount: false });    // clock by the box door
  // radiator (east wall z 2.0–3.0)
  for (let k = 0; k < 14; k++) B.box('gloss', [1.16, 0.25, 2.0 + k * 0.072], [1.28, 1.0, 2.0 + k * 0.072 + 0.05], { color: '#ece6da' });
  B.box('gloss', [1.18, 0.95, 1.98], [1.27, 1.0, 3.0], { color: '#ece6da' });
  B.box('oak', [1.08, 1.05, 1.9], [1.30, 1.09, 3.1], { color: '#a0714a' });                          // shelf over the radiator
  plant(B, 1.18, 1.09, 2.3, 0.5, '#2f6f8f', 9);
  B.add('plain', boxG(0.05, 0.2, 0.15), { pos: [1.2, 1.19, 2.8], color: '#e8b04b' });
  anchor('hall.radiator', [1.0, 0, 2.5], -Math.PI / 2);
  // light switches, smoke alarm, pendants
  for (const [x, z, yaw] of [[1.29, 9.0, -Math.PI / 2], [-1.29, 7.2, Math.PI / 2], [0.8, 0.01, 0]]) B.add('gloss', boxG(0.09, 0.13, 0.015), { pos: [x, 1.45, z], rot: [0, yaw, 0], color: '#f4f1ea' });
  B.add('gloss', cyl(0.08, 0.08, 0.04, 16), { pos: [0, CE - 0.02, 4.2], color: '#f4f1ea' });
  const pendantMat = new THREE.MeshStandardMaterial({ color: '#f3e2c4', roughness: 0.8, emissive: new THREE.Color(COLORS.bulb), emissiveIntensity: 0, side: THREE.DoubleSide });
  for (const z of [2.6, 8.6]) {
    B.add('metal', cyl(0.006, 0.006, 0.5, 4), { pos: [0, CE - 0.25, z], color: '#333' });
    const p = new THREE.Mesh(sph(0.19, 18, 10, 0, TAU, 0, Math.PI * 0.6), pendantMat); p.position.set(0, CE - 0.62, z); p.rotation.x = Math.PI; p.scale.y = 0.85; interior.add(p);
  }
  anchor('hall.center', [0, 0, 5.0], Math.PI);
  anchor('hall.kitchenArch', [1.38, 0, (AR.z0 + AR.z1) / 2], -Math.PI / 2);

  // ════════════════════════════════════════ kitchen ════════════════════════════════════════════════════════════
  const K = H.KITCHEN, CT = H.COUNTER;
  // backsplash tiles + counters: south run under the window (z 9.4..10), east run (x 4.86..5.46, z 6.3..10)
  B.box('wtile', [1.6, CT, 9.98], [5.44, 2.0, 10.0], { color: '#f6f2ea' });
  B.box('wtile', [5.44, CT, 6.3], [5.46, 2.0, 10.0], { color: '#f6f2ea' });
  const cab = (a, b) => {                                  // base cabinet run with doors + plinth + top
    B.box('paint', [a[0], 0.12, a[2]], [b[0], CT - 0.05, b[2]], { color: C.cabinet });
    B.box('plain', [a[0] + 0.03, 0, a[2] + 0.03], [b[0] - 0.03, 0.12, b[2] - 0.03], { color: '#2a2a2a' });
    B.box('oak', [a[0] - 0.03, CT - 0.05, a[2] - 0.03], [b[0] + 0.03, CT, b[2] + 0.03], { color: '#b88a5a' });
  };
  cab([1.6, 0, 9.4], [5.44, 0, 10.0]);
  cab([4.84, 0, 6.3], [5.44, 0, 9.4]);
  // door fronts (vertical gaps) + handles
  for (let x = 1.6; x < 5.4; x += 0.6) { B.box('plain', [x - 0.005, 0.14, 9.39], [x + 0.005, CT - 0.07, 9.41], { color: '#4e5f4a' }); B.add('metal', boxG(0.14, 0.02, 0.025), { pos: [x + 0.3, CT - 0.15, 9.38], color: '#c9a45c' }); }
  for (let z = 6.3; z < 9.4; z += 0.6) { B.box('plain', [4.83, 0.14, z - 0.005], [4.85, CT - 0.07, z + 0.005], { color: '#4e5f4a' }); B.add('metal', boxG(0.025, 0.02, 0.14), { pos: [4.82, CT - 0.15, z + 0.3], color: '#c9a45c' }); }
  // upper cabinets on the east wall
  B.box('paint', [5.08, 2.05, 6.3], [5.44, 2.95, 9.0], { color: C.cabinet });
  for (let z = 6.3; z < 9.0; z += 0.54) { B.box('plain', [5.07, 2.07, z - 0.005], [5.09, 2.93, z + 0.005], { color: '#4e5f4a' }); B.add('metal', boxG(0.02, 0.12, 0.02), { pos: [5.06, 2.15, z + 0.45], color: '#c9a45c' }); }
  // sink under the window + tap
  B.box('metal', [2.95, CT - 0.02, 9.47], [3.95, CT + 0.005, 9.92], { color: '#bfc4c8' });
  B.add('metal', cyl(0.025, 0.025, 0.35, 8), { pos: [3.45, CT + 0.17, 9.85], color: '#d0d4d8' });
  B.add('metal', cyl(0.02, 0.02, 0.25, 8), { pos: [3.45, CT + 0.34, 9.75], rot: [Math.PI / 2, 0, 0], color: '#d0d4d8' });
  // window: frame + sill + glass + curtains café-style
  for (const [a, b] of [[[kitWin.x0 - 0.06, kitWin.y0 - 0.06, 9.94], [kitWin.x1 + 0.06, kitWin.y0, 10.18]], [[kitWin.x0 - 0.06, kitWin.y1, 9.98], [kitWin.x1 + 0.06, kitWin.y1 + 0.06, 10.18]],
    [[kitWin.x0 - 0.06, kitWin.y0, 9.98], [kitWin.x0, kitWin.y1, 10.18]], [[kitWin.x1, kitWin.y0, 9.98], [kitWin.x1 + 0.06, kitWin.y1, 10.18]], [[(kitWin.x0 + kitWin.x1) / 2 - 0.025, kitWin.y0, 10.05], [(kitWin.x0 + kitWin.x1) / 2 + 0.025, kitWin.y1, 10.11]]])
    B.box('paint', a, b, { color: C.trim });
  glass([kitWin.x0, kitWin.y0, 10.07], [kitWin.x1, kitWin.y1, 10.09]);
  B.box('fabric', [kitWin.x0 - 0.1, kitWin.y1 - 0.25, 9.93], [kitWin.x1 + 0.1, kitWin.y1 + 0.05, 9.96], { color: '#d8604a' });   // valance
  plant(B, 2.8, CT, 9.75, 0.45, '#e8e0d0', 5); plant(B, 4.2, CT, 9.8, 0.38, '#c97a52', 6);
  // counter clutter: kettle, toaster, bread bin, fruit bowl, jars, utensil pot, chopping board
  B.add('gloss', cyl(0.11, 0.13, 0.26, 18), { pos: [5.1, CT + 0.13, 8.9], color: '#d8604a' });
  B.add('gloss', boxG(0.04, 0.12, 0.05), { pos: [5.0, CT + 0.17, 8.9], rot: [0, 0, 0.5], color: '#d8604a' });
  B.add('gloss', boxG(0.2, 0.2, 0.3), { pos: [5.15, CT + 0.1, 8.2], color: '#e8e2d6' });
  B.add('gloss', boxG(0.3, 0.26, 0.4), { pos: [5.15, CT + 0.13, 7.4], color: '#2f6f8f' });
  B.add('gloss', sph(0.18, 18, 8).scale(1, 0.45, 1), { pos: [4.0, CT + 0.07, 9.7], color: '#f3f0e8' });
  for (let k = 0; k < 5; k++) B.add('plain', sph(0.065, 12, 8), { pos: [3.93 + (k % 3) * 0.07, CT + 0.13 + Math.floor(k / 3) * 0.06, 9.66 + (k % 2) * 0.06], color: ['#e8483b', '#f2c21b', '#7cb342', '#e8483b', '#f28c28'][k] });
  for (let k = 0; k < 3; k++) { B.add('gloss', cyl(0.07, 0.07, 0.2 - k * 0.03, 14), { pos: [1.85 + k * 0.17, CT + 0.1 - k * 0.015, 9.78], color: '#f4f0e6' }); B.add('oak', cyl(0.072, 0.072, 0.03, 14), { pos: [1.85 + k * 0.17, CT + 0.2 - k * 0.03 + 0.015, 9.78], color: '#8a5e3a' }); }
  B.add('gloss', cyl(0.07, 0.065, 0.2, 12), { pos: [4.6, CT + 0.1, 9.75], color: '#2f6f8f' });
  for (let k = 0; k < 4; k++) B.add('oak', cyl(0.012, 0.012, 0.36, 6), { pos: [4.6 + (k - 1.5) * 0.02, CT + 0.25, 9.75], rot: [0, 0, (k - 1.5) * 0.12], color: '#8a5e3a' });
  B.box('oak', [2.2, CT, 9.5], [2.6, CT + 0.03, 9.75], { color: '#c99a62' });
  anchor('kitchen.counter', [3.0, CT, 9.6], Math.PI);
  anchor('kitchen.counter.east', [5.1, CT, 7.8], -Math.PI / 2);
  anchor('kitchen.window', [3.5, 2.0, 9.95], Math.PI);
  // wall clock, calendar beside the fridge, shelf with jars + plates, bin
  framed(12, 0.42, 0.42, [3.0, 2.85, 3.21], 0, { frame: '#d8604a', key: 'gloss', mount: false });
  picture(7, 0.42, 0.55, [4.55, 1.85, 3.215], 0);
  anchor('kitchen.calendar', [4.55, 1.85, 3.22], 0, root, { note: 'wall calendar spot beside the fridge (0.42 × 0.55), facing +z' });
  B.box('oak', [3.6, 2.35, 3.2], [5.3, 2.39, 3.5], { color: '#a0714a' });
  for (let k = 0; k < 5; k++) B.add(k % 2 ? 'gloss' : 'plain', cyl(0.07, 0.07, 0.18 + (k % 3) * 0.05, 12), { pos: [3.8 + k * 0.3, 2.39 + 0.09 + (k % 3) * 0.025, 3.35], color: ['#e8b04b', '#f3f0e8', '#c0392b', '#2f6f8f', '#7cb342'][k] });
  for (let k = 0; k < 3; k++) B.add('gloss', cyl(0.17, 0.17, 0.02, 20), { pos: [4.0 + k * 0.03, 2.45 + k * 0.02, 3.24 + k * 0.012], rot: [Math.PI / 2 - 0.15, 0, 0], color: ['#f4f0e6', '#2f6f8f', '#f4f0e6'][k] });
  B.add('metal', cyl(0.16, 0.14, 0.55, 16), { pos: [5.15, 0.275, 3.5], color: '#b8bcc0' });
  // kitchen table + 2 chairs (near the window side, off the arch→fridge sightline)
  const KT = [2.9, 7.9];
  B.add('oak', cyl(0.62, 0.62, 0.05, 28), { pos: [KT[0], H.TABLE - 0.025, KT[1]], color: '#b88a5a' });
  B.add('oak', cyl(0.06, 0.09, H.TABLE - 0.05, 10), { pos: [KT[0], (H.TABLE - 0.05) / 2, KT[1]], color: '#8a5e3a' });
  B.add('oak', cyl(0.3, 0.34, 0.04, 16), { pos: [KT[0], 0.02, KT[1]], color: '#8a5e3a' });
  for (const [dx, dz, yaw] of [[0.0, -0.95, 0], [0.95, 0.15, -Math.PI / 2]]) {
    const cx = KT[0] + dx, cz = KT[1] + dz, m = new THREE.Matrix4().makeRotationY(yaw).setPosition(cx, 0, cz);
    const P = (x, y, z, w, h, d) => B.add('paint', boxG(w, h, d), { matrix: new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(x, y, z)), color: '#d8604a' });
    P(0, 0.62, 0, 0.5, 0.05, 0.5); for (const [lx, lz] of [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]]) P(lx, 0.3, lz, 0.04, 0.6, 0.04);
    P(0, 1.05, -0.23, 0.5, 0.35, 0.04); P(-0.21, 0.85, -0.23, 0.04, 0.45, 0.04); P(0.21, 0.85, -0.23, 0.04, 0.45, 0.04);
  }
  B.add('gloss', cyl(0.08, 0.06, 0.12, 14), { pos: [KT[0] + 0.15, H.TABLE + 0.06, KT[1] - 0.1], color: '#f4f0e6' });
  anchor('kitchen.table', [KT[0], H.TABLE, KT[1]], 0);
  anchor('kitchen.center', [3.2, 0, 5.5], -Math.PI / 2);
  // the fridge: mint, against the east wall facing WEST (−x), hinge on its north side
  const FR = H.FRIDGE;
  const fx0 = K.x1 - FR.d, fz0 = FR.z - FR.w / 2, fz1 = FR.z + FR.w / 2;
  B.box('gloss', [fx0 + 0.05, 0, fz0], [K.x1, FR.h, fz0 + 0.05], { color: '#bfe3d4' });
  B.box('gloss', [fx0 + 0.05, 0, fz1 - 0.05], [K.x1, FR.h, fz1], { color: '#bfe3d4' });
  B.box('gloss', [fx0 + 0.05, FR.h - 0.06, fz0], [K.x1, FR.h, fz1], { color: '#bfe3d4' });
  B.box('gloss', [fx0 + 0.05, 0, fz0], [K.x1, 0.12, fz1], { color: '#a9cfc0' });
  B.box('gloss', [K.x1 - 0.06, 0.12, fz0], [K.x1, FR.h - 0.06, fz1], { color: '#eef6f2' });       // inner back
  B.box('gloss', [fx0 + 0.05, 0.12, fz0 + 0.05], [K.x1 - 0.06, 0.16, fz1 - 0.05], { color: '#eef6f2' });
  B.box('gloss', [fx0 + 0.05, 1.62, fz0 + 0.05], [K.x1 - 0.06, 1.68, fz1 - 0.05], { color: '#dfeee8' });   // freezer divider
  for (const y of [0.55, 0.95, 1.3]) B.box('gloss', [fx0 + 0.1, y, fz0 + 0.05], [K.x1 - 0.06, y + 0.015, fz1 - 0.05], { color: '#e8f4f6' });
  // fridge contents: a dozen+ recognisable items (shapes + colours + canvas labels), leaving the FRONT-CENTRE of
  // shelf 1 free for prop inserts (kitchen.fridge.shelf.1: the pickle jar / ice-cream tub / pickle of the S10 insert)
  {
    const SY = [0.565, 0.965, 1.315], FZ = FR.z, BX = K.x1 - 0.1;          // shelf tops, fridge centre z, back x
    const xs = (d) => fx0 + 0.12 + d;                                       // d = depth from the front of the shelves
    B.box('gloss', [fx0 + 0.12, 0.16, fz0 + 0.07], [K.x1 - 0.08, 0.45, fz1 - 0.07], { color: '#d9efe6' });   // veg drawer
    // veg drawer: apples, oranges, a lettuce, carrots (seen through the drawer front from above)
    for (const [d, z, c] of [[0.12, -0.25, '#d93a2b'], [0.22, -0.16, '#e2452f'], [0.14, -0.06, '#8fc23a'], [0.3, 0.05, '#f39a1e'], [0.2, 0.14, '#f5a623']])
      B.add('gloss', sph(0.06, 12, 8), { pos: [xs(d), 0.5, FZ + z], color: c });
    B.add('plain', new THREE.IcosahedronGeometry(0.1, 1), { pos: [xs(0.4), 0.5, FZ + 0.27], color: '#6aa84f' });
    for (let k = 0; k < 3; k++) B.add('plain', new THREE.ConeGeometry(0.025, 0.2, 8), { pos: [xs(0.42 + k * 0.05), 0.48, FZ - 0.3 + k * 0.03], rot: [0, 0, Math.PI / 2 + 0.1 * k], color: '#ef7d1a' });
    // shelf 0: milk carton (gable top), egg box, cheese wedge, butter
    B.box('plain', [xs(0.08), SY[0], FZ - 0.36], [xs(0.18), SY[0] + 0.24, FZ - 0.26], { color: '#f7f7f4' });
    B.box('plain', [xs(0.08) - 0.002, SY[0] + 0.16, FZ - 0.362], [xs(0.18) + 0.002, SY[0] + 0.2, FZ - 0.258], { color: '#2f6fd6' });
    B.add('plain', new THREE.CylinderGeometry(0.0001, 0.07, 0.06, 4, 1).rotateY(Math.PI / 4), { pos: [xs(0.13), SY[0] + 0.27, FZ - 0.31], scale: [1, 1, 0.72], color: '#f7f7f4' });
    B.box('plain', [xs(0.05), SY[0], FZ - 0.16], [xs(0.19), SY[0] + 0.075, FZ + 0.16], { color: '#cdb38a' });       // egg box
    for (let k = 0; k < 6; k++) B.add('plain', sph(0.028, 8, 6), { pos: [xs(0.08 + (k % 2) * 0.08), SY[0] + 0.075, FZ - 0.12 + Math.floor(k / 2) * 0.12], scale: [1, 0.6, 1], color: '#d8c39a' });
    B.add('gloss', new THREE.CylinderGeometry(0.1, 0.1, 0.07, 3, 1), { pos: [xs(0.32), SY[0] + 0.035, FZ + 0.25], rot: [0, 0.4, 0], color: '#f4c430' });
    B.box('gloss', [xs(0.3), SY[0], FZ - 0.05], [xs(0.42), SY[0] + 0.05, FZ + 0.07], { color: '#fbe58a' });           // butter
    // shelf 1 (back corners only): jam jar, three yoghurts
    B.add('gloss', cyl(0.055, 0.055, 0.12, 14), { pos: [BX - 0.05, SY[1] + 0.06, FZ + 0.3], color: '#b3172f' });
    B.add('metal', cyl(0.058, 0.058, 0.025, 14), { pos: [BX - 0.05, SY[1] + 0.13, FZ + 0.3], color: '#d9b45a' });
    for (let k = 0; k < 3; k++) {
      B.add('plain', cyl(0.04, 0.034, 0.08, 12), { pos: [BX - 0.04, SY[1] + 0.04, FZ - 0.36 + k * 0.09], color: '#f7f3ec' });
      B.add('gloss', cyl(0.042, 0.042, 0.01, 12), { pos: [BX - 0.04, SY[1] + 0.085, FZ - 0.36 + k * 0.09], color: ['#ff7aa8', '#ffcf3f', '#7fc2ff'][k] });
    }
    // shelf 2: orange juice + green lemonade bottles, ketchup, a leftovers box
    for (const [z, c, cap] of [[-0.3, '#ff9f1c', '#ffffff'], [-0.18, '#4caf50', '#e8e0c8']]) {
      B.add('gloss', cyl(0.045, 0.05, 0.24, 14), { pos: [xs(0.2), SY[2] + 0.12, FZ + z], color: c });
      B.add('gloss', cyl(0.02, 0.04, 0.06, 12), { pos: [xs(0.2), SY[2] + 0.27, FZ + z], color: c });
      B.add('plain', cyl(0.022, 0.022, 0.03, 10), { pos: [xs(0.2), SY[2] + 0.315, FZ + z], color: cap });
    }
    B.add('gloss', cyl(0.04, 0.045, 0.2, 12), { pos: [xs(0.32), SY[2] + 0.1, FZ + 0.0], color: '#d1242a' });
    B.add('plain', cyl(0.018, 0.03, 0.05, 10), { pos: [xs(0.32), SY[2] + 0.225, FZ + 0.0], color: '#f1f1ec' });
    B.box('gloss', [xs(0.06), SY[2], FZ + 0.1], [xs(0.26), SY[2] + 0.09, FZ + 0.34], { color: '#e9f1f4' });
    B.box('gloss', [xs(0.055), SY[2] + 0.09, FZ + 0.095], [xs(0.265), SY[2] + 0.11, FZ + 0.345], { color: '#3a82d6' });
    // freezer: a bag of peas
    B.add('plain', boxG(0.28, 0.06, 0.2), { pos: [xs(0.3), 1.71, FZ + 0.2], rot: [0, 0.3, 0.05], color: '#3f9a4a' });
    // canvas labels (one draw call each; text faces −x = out of the fridge)
    const label = (text, w, h, bg, ink, pos) => {
      const c = makeTextCard({ w, h, px: 256, thick: 0, rough: 0.6, draw(g, W, Hh) {
        g.fillStyle = bg; g.fillRect(0, 0, W, Hh); g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `900 ${Math.round(Hh * 0.62)}px DejaVu Sans, sans-serif`; g.fillText(text, W / 2, Hh * 0.54);
      } });
      c.position.set(...pos); c.rotation.y = -Math.PI / 2; interior.add(c);
    };
    label('MILK', 0.095, 0.07, '#f7f7f4', '#2f6fd6', [xs(0.08) - 0.003, SY[0] + 0.1, FZ - 0.31]);
    label('EGGS', 0.16, 0.05, '#cdb38a', '#5a3d1f', [xs(0.05) - 0.003, SY[0] + 0.04, FZ]);
    label('JUICE', 0.08, 0.06, '#ffffff', '#e26a00', [xs(0.2) - 0.051, SY[2] + 0.12, FZ - 0.3]);
    label('JAM', 0.07, 0.045, '#fff3d6', '#9a1026', [BX - 0.107, SY[1] + 0.06, FZ + 0.3]);
    const tub = makeIceCreamTub({ flavour: 'MINT' }); tub.position.set(xs(0.16), 1.68, FZ - 0.18); tub.rotation.y = -Math.PI / 2; interior.add(tub);
  }
  anchor('kitchen.fridge', [fx0 - 0.55, 0, FR.z], -Math.PI / 2, root, { note: 'floor in front of the fridge, facing out of it (−x, toward the arch)' });
  anchor('kitchen.fridge.inside', [fx0 + 0.35, 1.0, FR.z], -Math.PI / 2);
  for (const [i, y] of [[0, 0.57], [1, 0.97], [2, 1.32]]) anchor(`kitchen.fridge.shelf.${i}`, [fx0 + 0.32, y, FR.z], -Math.PI / 2);
  // fridge door (dynamic): hinge at its north edge (z = fz0) at the front plane x = fx0; leaf spans +z; opens toward −x
  const fridgeDoor = new THREE.Group(); fridgeDoor.name = 'fridgeDoor'; fridgeDoor.position.set(fx0 + 0.02, 0, fz0); interior.add(fridgeDoor);
  {
    const D = batcher(), W = FR.w;
    D.box('gloss', [-0.08, 0.1, 0], [-0.01, FR.h - 0.01, W], { color: '#bfe3d4' });
    D.box('plain', [-0.01, 0.12, 0.02], [0.0, FR.h - 0.03, W - 0.02], { color: '#d6e6e2' });         // inner liner (matte)
    D.box('gloss', [-0.085, 1.62, 0.02], [-0.08, 1.66, W - 0.02], { color: '#a9cfc0' });            // freezer split line
    D.add('metal', boxG(0.04, 0.5, 0.04), { pos: [-0.12, 1.25, W - 0.08], color: '#e6e6e6' });
    D.add('metal', boxG(0.04, 0.3, 0.04), { pos: [-0.12, 1.85, W - 0.08], color: '#e6e6e6' });
    // door shelves inside (+x side of the leaf)
    for (const y of [0.4, 0.8, 1.2]) D.box('plain', [0.0, y, 0.06], [0.1, y + 0.08, W - 0.06], { color: '#dfeeee' });
    D.add('plain', cyl(0.035, 0.035, 0.22, 10), { pos: [0.05, 0.92, 0.3], color: '#f2c21b' });
    D.add('plain', cyl(0.035, 0.035, 0.18, 10), { pos: [0.05, 0.9, 0.5], color: '#c0392b' });
    // magnets (front, −x face)
    const mr = rng(41);
    for (let k = 0; k < 9; k++) {
      const y = 1.0 + mr() * 1.0, z = 0.12 + mr() * (W - 0.3);
      const col = ['#e8483b', '#f2c21b', '#3a6fd8', '#2c9a48', '#f28cb0'][k % 5];
      if (k % 3 === 0) D.add('gloss', cyl(0.035, 0.035, 0.02, 12), { pos: [-0.09, y, z], rot: [0, 0, Math.PI / 2], color: col });
      else D.add('gloss', boxG(0.02, 0.05 + mr() * 0.03, 0.06), { pos: [-0.09, y, z], rot: [mr() * 0.4 - 0.2, 0, 0], color: col });
    }
    D.build(fridgeDoor, M, { name: 'fridgeDoor' });
    // papers on the door: kid drawing + note (picture planes facing −x)
    for (const [cell, y, z, w, h, rz] of [[6, 1.35, 0.35, 0.36, 0.36, 0.06], [7, 0.85, 0.62, 0.26, 0.3, -0.05]]) {
      const g = new THREE.PlaneGeometry(w, h); const [u0, v0, u1, v1] = atlas.cellUV(cell);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, lerp(u0, u1, uv.getX(i)), lerp(v0, v1, uv.getY(i)));
      g.rotateZ(rz); g.rotateY(-Math.PI / 2); g.translate(-0.084, y, z);
      fridgeDoor.add(new THREE.Mesh(g, picMat));
    }
  }
  anchor('kitchen.fridge.door', [fx0 - 0.07, 1.4, FR.z], -Math.PI / 2, root, { note: 'centre of the closed fridge door front (magnets / calendar / notes)' });
  const fridgeL = makeFridgeLight({ intensity: 1 });
  fridgeL.root.position.set(fx0 + 0.42, 1.0, FR.z); fridgeL.root.rotation.y = -Math.PI / 2;    // +Z of the practical → −x
  fridgeL.panel.scale.set(1.2, 1.1, 1);
  interior.add(fridgeL.root);
  // kitchen ceiling glow (option) + pendant
  const kitchenGlow = makePointGlow({ color: '#ffc58a', intensity: 1, distance: 7 });
  kitchenGlow.root.position.set(3.3, 3.0, 6.6); interior.add(kitchenGlow.root);
  // the hall lamp's room bounce: one unshadowed warm PointLight under the hall ceiling at ≈25 % of the lamp, driven
  // by the `lamp` option (fakes the light the lamp throws off the warm walls and ceiling)
  const lampBounce = new THREE.PointLight('#ffd3a0', 0, 9, 1); lampBounce.name = 'lampBounce';
  lampBounce.position.set(0, 3.25, 5.5); interior.add(lampBounce);      // just under the ceiling: soft fill from above
  B.add('metal', cyl(0.006, 0.006, 0.5, 4), { pos: [3.3, CE - 0.25, 7.9], color: '#333' });
  { const p = new THREE.Mesh(sph(0.22, 18, 10, 0, TAU, 0, Math.PI * 0.55), pendantMat); p.position.set(3.3, CE - 0.62, 7.9); p.rotation.x = Math.PI; interior.add(p); }

  // ════════════════════════════════════════ Pip's room (dark sliver) ═══════════════════════════════════════════
  {
    const P = H.PIP;
    B.box('fabric', [P.x0, 0, P.z0], [P.x1, 0.012, P.z1], { color: '#8a79b8' });                   // carpet
    // bed along the west wall, star duvet
    B.box('paint', [P.x0 + 0.05, 0, 7.0], [P.x0 + 1.25, 0.55, 9.4], { color: '#f2f2f2' });
    B.box('fabric', [P.x0 + 0.08, 0.55, 7.05], [P.x0 + 1.22, 0.78, 9.35], { color: '#f2d43b' });
    B.box('fabric', [P.x0 + 0.15, 0.78, 7.1], [P.x0 + 1.1, 0.9, 7.5], { color: '#ffffff' });
    B.box('paint', [P.x0 + 0.05, 0, 6.9], [P.x0 + 1.25, 1.1, 7.0], { color: '#f2f2f2' });
    // toy box, teddy, little shelf
    B.box('paint', [-2.3, 0, 9.3], [-1.6, 0.5, 9.9], { color: '#e86f9a' });
    B.add('fabric', sph(0.16, 12, 8), { pos: [-1.95, 0.66, 9.6], color: '#b07a4a' });
    B.add('fabric', sph(0.11, 12, 8), { pos: [-1.95, 0.88, 9.6], color: '#b07a4a' });
    B.box('paint', [-4.98, 1.6, 8.0], [-4.7, 1.64, 9.2], { color: '#f2f2f2' });
    for (let k = 0; k < 4; k++) B.add('plain', boxG(0.18, 0.22, 0.05), { pos: [-4.86, 1.75, 8.15 + k * 0.28], color: ['#3a6fd8', '#e8483b', '#2c9a48', '#f2c21b'][k] });
    // night light (moon) + glow stars on the wall facing the door (emissive atlas cells)
    picture(9, 0.4, 0.4, [-3.4, 0.9, 6.41], 0, glowAtlasGeos);
    picture(13, 1.6, 1.0, [-3.1, 2.4, 6.41], 0, glowAtlasGeos);
    picture(13, 1.4, 1.0, [-4.99, 2.3, 8.2], Math.PI / 2, glowAtlasGeos);
    // curtains on her window (seen from outside)
    B.box('fabric', [pipWin.x0 - 0.1, pipWin.y0 - 0.1, 9.9], [pipWin.x1 + 0.1, pipWin.y1 + 0.1, 9.95], { color: '#e9a6c4' });
    glass([pipWin.x0, pipWin.y0, 10.07], [pipWin.x1, pipWin.y1, 10.09]);
    for (const [a, b] of [[[pipWin.x0 - 0.06, pipWin.y0 - 0.06, 9.98], [pipWin.x1 + 0.06, pipWin.y0, 10.2]], [[pipWin.x0 - 0.06, pipWin.y1, 9.98], [pipWin.x1 + 0.06, pipWin.y1 + 0.06, 10.2]], [[pipWin.x0 - 0.06, pipWin.y0, 9.98], [pipWin.x0, pipWin.y1, 10.2]], [[pipWin.x1, pipWin.y0, 9.98], [pipWin.x1 + 0.06, pipWin.y1, 10.2]]])
      B.box('paint', a, b, { color: C.trim });
    anchor('pip.bed', [P.x0 + 0.65, 0.78, 8.2], 0);
  }

  // ════════════════════════════════════════ box room ═══════════════════════════════════════════════════════════
  {
    const X0 = H.BOX.x0, X1 = H.BOX.x1, Z0 = H.BOX.z0, Z1 = H.BOX.z1;
    for (const [a, b] of [[[X0, 0, Z0], [X1, 0.15, Z0 + 0.03]], [[X0, 0, Z0], [X0 + 0.03, 0.15, Z1]], [[X1 - 0.03, 0, Z0], [X1, 0.15, Z1]]]) B.box('paint', a, b, { color: '#e8e2d6' });
    // dust sheet crumpled along the north wall
    const sheet = new THREE.PlaneGeometry(3.4, 1.4, 24, 10); sheet.rotateX(-Math.PI / 2);
    { const p = sheet.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, 0.02 + Math.max(0, Math.sin(x * 4.1 + z * 2.3) * 0.04 + Math.sin(x * 9.7 - z * 6.1) * 0.02)); } sheet.computeVertexNormals(); const uv = sheet.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3.4, uv.getY(i) * 1.4); }
    B.add('fabric', sheet, { pos: [0, 0, Z0 + 0.9], color: '#ece6da' });
    // cardboard boxes stacked in the west corner (+ tape)
    const cb = (x, y, z, w, h, d, yaw) => { B.add('plain', boxG(w, h, d), { pos: [x, y + h / 2, z], rot: [0, yaw, 0], color: '#c49a64' }); B.add('plain', boxG(w * 0.2, 0.004, d + 0.004), { pos: [x, y + h + 0.002, z], rot: [0, yaw, 0], color: '#d9c49a' }); };
    cb(-1.45, 0, -3.25, 0.7, 0.55, 0.6, 0.1); cb(-1.42, 0.55, -3.22, 0.55, 0.45, 0.5, -0.12); cb(-1.4, 0, -2.45, 0.6, 0.4, 0.55, 0.3);
    anchor('box.center', [0, 0, -2.0], 0);
    anchor('box.crib', [-0.4, 0, -2.4], 0, root, { note: 'floor spot for the (props) half-built crib, clear 1.6 × 1.2 m' });
    anchor('box.paint', [0.9, 0, -3.2], 0, root, { note: 'paint tin + tray + roller spot, in front of the half-yellow wall' });
    anchor('box.lamp', [1.35, 0, -3.25], -2.4);
  }
  // work lamp (floor): stand + metal shade, spot aimed at the half-painted wall/ceiling, shadowed key in boxroom_lamp
  const boxLampGroup = new THREE.Group(); boxLampGroup.name = 'workLamp'; boxLampGroup.position.set(1.35, 0, -3.1); interior.add(boxLampGroup);
  const boxLampSpot = new THREE.SpotLight(COLORS.lamp, 0, 9, 1.2, 0.7, 1);   // decay 1 like look.makeLamp (no near-field blow-out on faces)
  const boxLampGlow = new THREE.PointLight(COLORS.lamp, 0, 4.5, 2);
  const workBulbMat = new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color(COLORS.bulb), emissiveIntensity: 0 });
  {
    const D = batcher();
    D.add('metal', cyl(0.02, 0.02, 0.9, 6), { pos: [0, 0.45, 0], color: '#333' });
    for (let k = 0; k < 3; k++) D.add('metal', cyl(0.015, 0.015, 0.45, 6), { pos: [Math.sin(k * 2.1) * 0.15, 0.1, Math.cos(k * 2.1) * 0.15], rot: [Math.cos(k * 2.1) * 0.9, 0, -Math.sin(k * 2.1) * 0.9], color: '#333' });
    D.add('metal', new THREE.ConeGeometry(0.16, 0.22, 16, 1, true), { pos: [0, 0.98, -0.02], rot: [-1.0, 0, 0], color: '#d8604a' });
    D.build(boxLampGroup, M, { name: 'workLamp' });
    const bulb = new THREE.Mesh(sph(0.05, 10, 8), workBulbMat); bulb.position.set(0, 0.95, 0.03); boxLampGroup.add(bulb);
    boxLampSpot.position.set(0, 0.97, 0.02);
    const tgt = new THREE.Object3D(); tgt.position.set(0, 1.2, 3.0); boxLampGroup.add(tgt); boxLampSpot.target = tgt;
    tuneShadow(boxLampSpot, { mapSize: 1536, radius: 5, near: 0.1, far: 9 });
    boxLampGlow.position.set(0, 1.15, 0.1);
    boxLampGroup.add(boxLampSpot, boxLampGlow);
    boxLampGroup.rotation.y = -0.75;   // shade faces across the room toward the door (and the hall beyond)
  }
  const strip = makeDoorStrip({ width: BD.x1 - BD.x0 - 0.02, intensity: 1 });
  strip.root.position.set(0, 0, 0.0); interior.add(strip.root);

  // ════════════════════════════════════════ attic void ═════════════════════════════════════════════════════════
  const ROOF = { eaveZ: 10.66, ridgeZ: 3.1, eaveY: 3.55, slope: Math.tan(32 * Math.PI / 180) };
  const roofY = (z) => ROOF.eaveY + (z > ROOF.ridgeZ ? (ROOF.eaveZ - z) : (z - (2 * ROOF.ridgeZ - ROOF.eaveZ))) * ROOF.slope;
  {
    const A = CE + 0.15;
    for (let x = -4.8; x <= 5.3; x += 0.6) {                                                                   // joists (trimmed at the hatch)
      if (x + 0.04 > HT.x0 && x - 0.04 < HT.x1) {
        B.box('oak', [x - 0.04, A, -3.8], [x + 0.04, A + 0.18, HT.z0 - 0.08], { color: '#b48a5e', tile: 2 });
        B.box('oak', [x - 0.04, A, HT.z1 + 0.08], [x + 0.04, A + 0.18, 10.0], { color: '#b48a5e', tile: 2 });
      } else B.box('oak', [x - 0.04, A, -3.8], [x + 0.04, A + 0.18, 10.0], { color: '#b48a5e', tile: 2 });
    }
    for (const zz of [HT.z0 - 0.08, HT.z1]) B.box('oak', [HT.x0 - 0.6, A, zz], [HT.x1 + 0.6, A + 0.18, zz + 0.08], { color: '#b48a5e', tile: 2 });   // trimmers
    // insulation between joists (fluffy, pink-yellow), leaving the hatch surround clear
    for (let x = -4.8; x < 5.3; x += 0.6) {
      if (x + 0.6 > HT.x0 - 0.2 && x < HT.x1 + 0.2) {
        B.box('fabric', [x + 0.04, A, -3.8], [x + 0.56, A + 0.14, HT.z0 - 0.4], { color: '#e9b98f' });
        B.box('fabric', [x + 0.04, A, HT.z1 + 0.4], [x + 0.56, A + 0.14, 10.0], { color: '#e9b98f' });
      } else B.box('fabric', [x + 0.04, A, -3.8], [x + 0.56, A + 0.14, 10.0], { color: '#e9b98f' });
    }
    // boards around the hatch (walkway)
    for (const [a, b] of [[[-1.4, A + 0.18, HT.z0 - 0.4], [1.4, A + 0.21, HT.z0]], [[-1.4, A + 0.18, HT.z1], [1.4, A + 0.21, HT.z1 + 0.4]],
      [[-1.4, A + 0.18, HT.z0], [HT.x0, A + 0.21, HT.z1]], [[HT.x1, A + 0.18, HT.z0], [1.4, A + 0.21, HT.z1]]]) B.box('oak', a, b, { color: '#c9a77c', tile: 1.5 });
    // rafters both slopes, purlin + ridge board
    for (let x = -5.0; x <= 5.5; x += 0.6) {
      for (const s of [1, -1]) {
        const z0 = ROOF.ridgeZ, z1 = s > 0 ? ROOF.eaveZ : 2 * ROOF.ridgeZ - ROOF.eaveZ;
        const len = Math.hypot(z1 - z0, roofY(z0) - roofY(z1 - s * 0.01));
        const ang = Math.atan2(roofY(z0) - roofY(z1 - s * 0.001), Math.abs(z1 - z0));
        B.add('oak', boxG(0.07, 0.2, len), { pos: [x, (roofY(z0) + ROOF.eaveY) / 2 - 0.12, (z0 + z1) / 2], rot: [s * ang, 0, 0], color: '#a77d52', tile: 2 });
      }
    }
    B.box('oak', [-5.2, roofY(ROOF.ridgeZ) - 0.3, ROOF.ridgeZ - 0.04], [5.7, roofY(ROOF.ridgeZ), ROOF.ridgeZ + 0.04], { color: '#9a7048' });
    for (const zz of [7.6, -1.4]) B.box('oak', [-5.2, roofY(zz) - 0.32, zz - 0.06], [5.7, roofY(zz) - 0.18, zz + 0.06], { color: '#9a7048' });
    // the one cardboard box, an old suitcase, a lamp shade, a rolled rug
    B.add('plain', boxG(0.6, 0.45, 0.5), { pos: [0.95, A + 0.21 + 0.225, 5.4], rot: [0, 0.35, 0], color: '#b88a58' });
    B.add('plain', boxG(0.15, 0.004, 0.52), { pos: [0.95, A + 0.21 + 0.452, 5.4], rot: [0, 0.35, 0], color: '#d9c49a' });
    B.add('fabric', boxG(0.7, 0.22, 0.45), { pos: [-1.1, A + 0.21 + 0.11, 7.9], rot: [0, -0.2, 0], color: '#6b3b2a' });
    B.add('fabric', cyl(0.12, 0.12, 1.3, 12), { pos: [-0.9, A + 0.33, 4.9], rot: [0, 0, Math.PI / 2 - 0.1], color: '#2f6f8f' });
    anchor('attic.center', [0, A + 0.21, 6.6], 0);
    anchor('attic.box', [0.95, A + 0.21, 5.4], 0.35);
    anchor('attic.loaf', [-0.55, A + 0.21, 7.45], 0, root, { note: 'baker\'s-attic dressing spot (loaf, eye glints, tails) beside the hatch' });
  }
  // cobwebs (alpha planes) in rafters near the hatch
  const webMat = new THREE.MeshBasicMaterial({ map: webTex(), transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, color: '#cfcfcf' });
  for (const [x, z, ry, s] of [[0.9, 7.6, 0.3, 0.9], [-1.5, 5.6, -0.5, 1.1], [-0.2, 4.6, 2.5, 0.8]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(s, s), webMat); w.position.set(x, roofY(z) - 0.5, z); w.rotation.set(-0.5, ry, 0); w.renderOrder = 6; interior.add(w);
  }

  // ════════════════════════════════════════ EXTERIOR: our facade, roof, porch ══════════════════════════════════
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: '#000000' });
  const glowGeos = [];
  const glowQuad = (a, b, color, zFace) => {       // emissive curtained window (lit room) in the XY plane
    const g = new THREE.PlaneGeometry(b[0] - a[0], b[1] - a[1]); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, zFace);
    const p = prep(g); _col.set(color); const n = p.attributes.position.count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const yy = p.attributes.position.getY(i); const k = 0.75 + 0.25 * ((yy - a[1]) / (b[1] - a[1])); c[i * 3] = _col.r * k; c[i * 3 + 1] = _col.g * k; c[i * 3 + 2] = _col.b * k; }
    p.setAttribute('color', new THREE.BufferAttribute(c, 3)); glowGeos.push(p);
  };
  const facadeWindow = (Bx, x0, x1, y0, y1, zf, { shutter = C.shutter, box = true } = {}) => {
    for (const [a, b] of [[[x0 - 0.08, y0 - 0.1, zf - 0.02], [x1 + 0.08, y0, zf + 0.12]], [[x0 - 0.08, y1, zf - 0.02], [x1 + 0.08, y1 + 0.1, zf + 0.08]], [[x0 - 0.08, y0, zf - 0.02], [x0, y1, zf + 0.08]], [[x1, y0, zf - 0.02], [x1 + 0.08, y1, zf + 0.08]]])
      Bx.box('paint', a, b, { color: C.trim });
    if (shutter) for (const [s0, s1] of [[x0 - 0.5, x0 - 0.1], [x1 + 0.1, x1 + 0.5]]) {
      Bx.box('paint', [s0, y0, zf], [s1, y1, zf + 0.05], { color: shutter });
      for (let y = y0 + 0.12; y < y1 - 0.08; y += 0.14) Bx.box('paint', [s0 + 0.04, y, zf + 0.05], [s1 - 0.04, y + 0.05, zf + 0.07], { color: shutter });
    }
    if (box) { Bx.box('paint', [x0 - 0.05, y0 - 0.38, zf], [x1 + 0.05, y0 - 0.12, zf + 0.3], { color: '#8a5e3a' }); const rr = rng(x0 * 13 + 5); for (let k = 0; k < 7; k++) Bx.add('plain', sph(0.09, 8, 6), { pos: [x0 + (x1 - x0) * (k + 0.5) / 7, y0 - 0.08 + rr() * 0.06, zf + 0.15], color: ['#e8483b', '#f2c21b', '#f28cb0', '#ffffff'][k % 4] }); for (let k = 0; k < 6; k++) Bx.add('plain', sph(0.08, 8, 6), { pos: [x0 + (x1 - x0) * (k + 0.2) / 6, y0 - 0.12, zf + 0.22], color: '#4c7a3e' }); }
  };
  {
    const ZF = F.z1;       // facade plane z = 10.16
    // siding over the whole front wall (holes for door, windows), brick plinth
    wallXY(B, 'siding', { x0: F.x0 - 0.04, x1: F.x1 + 0.04, y0: 0, y1: ROOF.eaveY, z0: ZF, z1: ZF + 0.03 }, [{ x0: -1.24, x1: 1.24, y0: 0, y1: 3.32 }, kitWin, pipWin], { color: C.siding });
    for (const [x0, x1, z0, z1] of [[F.x0 - 0.04, F.x0, F.z0, F.z1 + 0.03], [F.x1, F.x1 + 0.04, F.z0, F.z1 + 0.03], [F.x0, F.x1, F.z0 - 0.04, F.z0]]) B.box('siding', [x0, 0, z0], [x1, ROOF.eaveY, z1], { color: C.siding });
    B.box('brick', [F.x0 - 0.08, GY, F.z0 - 0.08], [F.x1 + 0.08, -0.03, F.z1 + 0.08]);
    B.box('paint', [F.x0 - 0.06, -0.04, ZF + 0.02], [F.x1 + 0.06, 0.12, ZF + 0.08], { color: C.trim });
    for (const x of [F.x0 - 0.02, F.x1 - 0.06]) B.box('paint', [x, 0, ZF - 0.02], [x + 0.12, ROOF.eaveY, ZF + 0.1], { color: C.trim });   // corner boards
    facadeWindow(B, kitWin.x0, kitWin.x1, kitWin.y0, kitWin.y1, ZF + 0.03);
    facadeWindow(B, pipWin.x0, pipWin.x1, pipWin.y0, pipWin.y1, ZF + 0.03);
    // house number + exterior door casing
    for (const s of [-1, 1]) B.box('paint', [Math.min(s * 1.24, s * 1.4), 0, ZF], [Math.max(s * 1.24, s * 1.4), 3.4, ZF + 0.08], { color: C.trim });
    B.box('paint', [-1.4, 3.32, ZF], [1.4, 3.5, ZF + 0.1], { color: C.trim });
    picture(11, 0.22, 0.22, [1.62, 2.0, ZF + 0.035], 0);
    // roof: two shingle slabs + fascia, gable ends (siding triangles), dormers, chimney
    const ridgeY = roofY(ROOF.ridgeZ);
    for (const s of [1, -1]) {
      const z0 = ROOF.ridgeZ, z1 = s > 0 ? ROOF.eaveZ : 2 * ROOF.ridgeZ - ROOF.eaveZ;
      const len = Math.hypot(z1 - z0, ridgeY - ROOF.eaveY) + 0.05, ang = Math.atan2(ridgeY - ROOF.eaveY, Math.abs(z1 - z0));
      B.add('shingle', boxG(F.x1 - F.x0 + 0.7, 0.12, len), { pos: [(F.x0 + F.x1) / 2, (ridgeY + ROOF.eaveY) / 2 + 0.06, (z0 + z1) / 2], rot: [s * ang, 0, 0], color: '#ffffff', tile: 1.5 });
      B.add('paint', boxG(F.x1 - F.x0 + 0.72, 0.2, 0.05), { pos: [(F.x0 + F.x1) / 2, ROOF.eaveY - 0.02, z1 + s * 0.02], color: C.trim });
    }
    for (const x of [F.x0, F.x1]) {
      const S = new THREE.Shape(); S.moveTo(-(F.z1 + 0.4), ROOF.eaveY); S.lineTo(-(F.z0 - 0.4), ROOF.eaveY); S.lineTo(-ROOF.ridgeZ, ridgeY); S.lineTo(-(F.z1 + 0.4), ROOF.eaveY);
      const g = new THREE.ExtrudeGeometry(S, { depth: 0.16, bevelEnabled: false }); g.rotateY(Math.PI / 2);
      B.add('siding', g, { pos: [x === F.x0 ? F.x0 : F.x1 - 0.16, 0, 0], color: C.siding });
      // inner face of the gable (attic side) in rough plaster
    }
    // dormers on the front slope (lit upstairs rooms) at x −3.0 and +3.3
    for (const dx of [-3.0, 3.3]) {
      const zf = 8.6, yb = roofY(zf), w = 1.6, h = 1.55;
      B.box('siding', [dx - w / 2, yb - 0.3, zf - 2.2], [dx + w / 2, yb + h, zf], { color: C.siding });
      const S = new THREE.Shape(); S.moveTo(dx - w / 2 - 0.15, 0); S.lineTo(dx + w / 2 + 0.15, 0); S.lineTo(dx, 0.62); S.lineTo(dx - w / 2 - 0.15, 0);
      const g = new THREE.ExtrudeGeometry(S, { depth: 2.4, bevelEnabled: false });
      B.add('shingle', g, { pos: [0, yb + h, zf - 2.3], color: '#ffffff', tile: 1.5 });
      glowQuad([dx - 0.45, yb + 0.2], [dx + 0.45, yb + 1.2], '#ffb766', zf + 0.005);
      facadeWindow(B, dx - 0.45, dx + 0.45, yb + 0.2, yb + 1.2, zf, { shutter: null, box: false });
    }
    B.box('brick', [3.6, roofY(1.0) - 1.5, 0.6], [4.4, ridgeY + 1.2, 1.4]);
    B.box('paint', [3.55, ridgeY + 1.2, 0.55], [4.45, ridgeY + 1.32, 1.45], { color: '#5a4a40' });
  }
  // ── porch (deck, steps, posts, LOW lantern beam with 6 hooks, lean-to roof, rails, pots) ──
  const BM = H.BEAM;
  {
    const PY = H.PORCH_Y;
    B.box('brick', [-2.65, GY, F.z1], [2.65, PY - 0.06, 12.5]);
    B.box('floor', [-2.65, PY - 0.06, F.z1], [2.65, PY, 12.55], { color: '#a7a19a', tile: [1.2, 2.4] });
    for (let k = 0; k < 3; k++) { const top = PY - 0.2 * (k + 1); B.box('floor', [-1.0, GY, 12.55 + k * 0.32], [1.0, top, 12.55 + (k + 1) * 0.32], { color: '#a7a19a', tile: [1.2, 2.4] }); }
    for (const s of [-1, 1]) {
      B.box('paint', [s * 2.45 - 0.09, PY, BM.z - 0.09], [s * 2.45 + 0.09, BM.y + 0.24, BM.z + 0.09], { color: C.post });
      B.box('paint', [s * 2.45 - 0.13, PY, BM.z - 0.13], [s * 2.45 + 0.13, PY + 0.25, BM.z + 0.13], { color: C.post });
      // side rails + balusters
      const xr = s * 2.55;
      B.box('paint', [xr - 0.04, PY + 0.92, F.z1 + 0.05], [xr + 0.04, PY + 0.98, BM.z - 0.09], { color: C.post });
      B.box('paint', [xr - 0.04, PY + 0.08, F.z1 + 0.05], [xr + 0.04, PY + 0.12, BM.z - 0.09], { color: C.post });
      for (let z = F.z1 + 0.2; z < BM.z - 0.1; z += 0.16) B.box('paint', [xr - 0.02, PY + 0.12, z - 0.02], [xr + 0.02, PY + 0.92, z + 0.02], { color: C.post });
      // front rails between post and steps
      const xa = s > 0 ? 1.0 : -2.37, xb = s > 0 ? 2.37 : -1.0;
      B.box('paint', [xa, PY + 0.92, 12.36], [xb, PY + 0.98, 12.44], { color: C.post });
      for (let x = xa + 0.1; x < xb - 0.05; x += 0.16) B.box('paint', [x - 0.02, PY + 0.12, 12.38], [x + 0.02, PY + 0.92, 12.42], { color: C.post });
      plant(B, s * 1.35, PY, 12.2, 0.9, '#c97a52', s > 0 ? 11 : 12);
    }
    // the LOW beam: underside at y 2.62
    B.box('paint', [-2.65, BM.y, BM.z - 0.09], [2.65, BM.y + 0.22, BM.z + 0.09], { color: C.post });
    // lean-to porch roof from the wall (y 3.5) down to the beam top
    const rz0 = F.z1, rz1 = BM.z + 0.3, ry0 = 3.62, ry1 = BM.y + 0.24;
    const len = Math.hypot(rz1 - rz0, ry0 - ry1), ang = Math.atan2(ry0 - ry1, rz1 - rz0);
    B.add('shingle', boxG(5.6, 0.1, len), { pos: [0, (ry0 + ry1) / 2 + 0.06, (rz0 + rz1) / 2], rot: [ang, 0, 0], color: '#ffffff', tile: 1.5 });
    B.add('paint', boxG(5.4, 0.02, len - 0.1), { pos: [0, (ry0 + ry1) / 2 - 0.0, (rz0 + rz1) / 2], rot: [ang, 0, 0], color: '#e9e2d4' });   // soffit
    // hooks (6): small brass cup hooks under the beam
    H.HOOKS.forEach((x, i) => {
      B.add('metal', cyl(0.012, 0.012, 0.06, 6), { pos: [x, BM.y - 0.03, BM.z], color: '#c9a45c' });
      B.add('metal', new THREE.TorusGeometry(0.022, 0.006, 6, 12, Math.PI * 1.4), { pos: [x, BM.y - 0.07, BM.z], rot: [0, Math.PI / 2, 0], color: '#c9a45c' });
      anchor(`porch.hook.${i}`, [x, BM.y - 0.09, BM.z], 0);
      anchor(`porch.lantern.${i}`, [x, BM.y - H.LANTERN.drop, BM.z], 0, root, { note: 'suggested lantern centre (0.26 m lantern on a 0.14 m cord)' });
    });
    anchor('porch.beam', [0, BM.y, BM.z], 0);
    anchor('porch.center', [0, PY, 11.3], 0);
    anchor('porch.step', [0, PY - 0.2, 12.7], 0);
    anchor('porch.path', [0, GY, 14.2], 0);
    // doormat outside + mailbox on the wall
    B.box('coir', [-0.55, PY, 10.3], [0.55, PY + 0.02, 10.9]);
    B.box('paint', [1.55, 1.35, F.z1 + 0.03], [1.95, 1.62, F.z1 + 0.15], { color: '#2d5a86' });
  }
  // porch glow (one shared, unshadowed warm PointLight for the lantern row)
  const porchGlow = makePointGlow({ color: COLORS.lantern, intensity: 1, distance: 9 });
  porchGlow.root.position.set(0.0, 1.8, BM.z - 0.6); root.add(porchGlow.root);
  // stand-in lanterns (framing checks only; the real lantern prop lives in the props kit)
  const standInGroup = new THREE.Group(); standInGroup.name = 'standInLanterns'; root.add(standInGroup);
  const standIns = H.HOOKS.map((x, i) => {
    const m = new THREE.MeshStandardMaterial({ color: '#f3dcb0', roughness: 0.9, emissive: new THREE.Color(COLORS.lantern), emissiveIntensity: 0 });
    const g = new THREE.Group(); g.position.set(x, BM.y - H.LANTERN.drop, BM.z);
    const ball = new THREE.Mesh(sph(H.LANTERN.size / 2, 18, 12), m); ball.scale.y = 0.92; g.add(ball);
    const cord = new THREE.Mesh(cyl(0.004, 0.004, 0.14, 4), new THREE.MeshStandardMaterial({ color: '#222' })); cord.position.y = H.LANTERN.size / 2 + 0.07; g.add(cord);
    const tag = new THREE.Mesh(boxG(0.13, 0.08, 0.01), new THREE.MeshStandardMaterial({ color: '#c9a06a', roughness: 0.9 })); tag.position.y = -H.LANTERN.size / 2 - 0.13; g.add(tag);
    standInGroup.add(g); return { g, m };
  });

  // ── front yard, street, lamps, houses opposite, neighbours ──
  const streetLampHeads = [];
  {
    X.box('fabric', [-60, GY - 0.3, -20], [60, GY, 16.5], { color: '#5f9a3c', tile: 0.6 });               // lawns (saturated: the morning ending)
    X.box('slab', [-1.0, GY, 13.5], [1.0, GY + 0.02, 16.5], { color: '#bdb5a8' });                          // path
    X.box('slab', [-60, GY, 16.5], [60, GY + 0.05, 18.5], { color: '#b9b2a8' });                             // pavement
    X.box('plain', [-60, GY - 0.12, 18.5], [60, GY - 0.02, 25.5], { color: '#3a3c42' });                     // road
    X.box('slab', [-60, GY, 25.5], [60, GY + 0.05, 27.5], { color: '#b9b2a8' });
    X.box('fabric', [-60, GY - 0.3, 27.5], [60, GY, 60], { color: '#5f9a3c', tile: 0.6 });
    for (let x = -57; x < 60; x += 6) X.box('plain', [x, GY - 0.015, 21.95], [x + 2.5, GY - 0.012, 22.05], { color: '#e8e0c8' });   // centre dashes
    X.box('plain', [-60, GY - 0.02, 18.4], [60, GY + 0.08, 18.55], { color: '#8d8a84' });                     // curbs
    X.box('plain', [-60, GY - 0.02, 25.45], [60, GY + 0.08, 25.6], { color: '#8d8a84' });
    // picket fences (our yard and neighbours'), gap for the path
    for (let x = -18; x < 18; x += 0.2) { if (Math.abs(x) < 1.1) continue; X.box('paint', [x - 0.04, GY, 16.2], [x + 0.04, GY + 0.85, 16.24], { color: '#f5f0e6' }); }
    X.box('paint', [-18, GY + 0.55, 16.24], [18, GY + 0.62, 16.28], { color: '#f5f0e6' });
    // hedges + trees
    for (const x of [-6.5, 6.8, -19, 19, 30, -31]) { X.add('plain', sph(1, 10, 8), { pos: [x, GY + 0.5, 15.0], scale: [1.6, 0.8, 0.8], color: '#3f6b3a' }); }
    const tree = (x, z, s = 1) => { X.add('oak', cyl(0.14 * s, 0.2 * s, 3.2 * s, 8), { pos: [x, GY + 1.6 * s, z], color: '#5a4030' }); for (let k = 0; k < 4; k++) X.add('plain', sph(1.1 * s, 10, 8), { pos: [x + Math.sin(k * 1.7) * 0.7 * s, GY + 3.6 * s + (k % 2) * 0.5 * s, z + Math.cos(k * 1.7) * 0.6 * s], color: k % 2 ? '#4c7a3e' : '#3f6b3a' }); };
    tree(-8.5, 14.5, 1.1); tree(8.2, 27.8, 1.0); tree(-20, 28.2, 1.2); tree(22, 14.8, 1.0);
    // street lamps (pavement), one straight across from our door
    for (const [x, z] of [[1.2, 26.9], [-14.5, 17.1], [16.5, 17.1], [-22, 26.9], [24, 26.9]]) {
      X.add('metal', cyl(0.06, 0.09, 4.4, 8), { pos: [x, GY + 2.2, z], color: '#2a2d33' });
      X.add('metal', boxG(0.06, 0.06, 0.6), { pos: [x, GY + 4.35, z + (z > 22 ? -0.3 : 0.3)], color: '#2a2d33' });
      const head = new THREE.Mesh(cyl(0.16, 0.24, 0.3, 10), null); head.position.set(x, GY + 4.25, z + (z > 22 ? -0.55 : 0.55));
      streetLampHeads.push(head);
    }
    anchor('street.center', [0, GY + 0.05, 22], 0);
    anchor('street.lamp', [1.2, GY + 0.05, 26.6], 0, root, { note: 'under the lamp straight across from our door (walk-away target)' });
    anchor('street.pavement', [0, GY + 0.05, 17.5], 0);
    // houses opposite (z ≈ 33, facing −z): simple facades with warm windows + roofs
    const r2 = rng(77);
    for (let k = -3; k <= 3 && opts.opposite !== false; k++) {
      const cx = k * 11 + (r2() - 0.5) * 2, w = 8 + r2() * 2, d = 7, z0 = 32;
      const col = ['#e9d8b5', '#c9e4f2', '#f2c4c4', '#d6e8c4', '#f3e3a5', '#cbbfe6'][(k + 3) % 6];
      X.box('siding', [cx - w / 2, GY, z0], [cx + w / 2, 3.4, z0 + d], { color: col });
      const S = new THREE.Shape(); S.moveTo(-(z0 + d + 0.4), 0); S.lineTo(-(z0 - 0.4), 0); S.lineTo(-(z0 + d / 2), 2.6); S.lineTo(-(z0 + d + 0.4), 0);
      const g = new THREE.ExtrudeGeometry(S, { depth: w + 0.6, bevelEnabled: false }); g.rotateY(Math.PI / 2);
      X.add('shingle', g, { pos: [cx - w / 2 - 0.3, 3.4, 0], color: ['#b5543f', '#4a5d7e', '#6b4a3a', '#3f7a5a'][(k + 7) % 4], tile: 1.5 });
      for (const wx of [-w * 0.3, w * 0.3]) for (const wy of [0.9, 2.4]) glowQuad([cx + wx - 0.45, wy], [cx + wx + 0.45, wy + 0.85], r2() < 0.7 ? '#ffc477' : '#7f8fa8', z0 - 0.01);
      X.box('paint', [cx - 0.5, GY, z0 - 0.02], [cx + 0.5, 2.3, z0], { color: '#5a3a2a' });
    }
  }
  // neighbour houses with the same porch + beam kit
  const neighbourParts = [];
  if (opts.neighbours !== false) H.NEIGHBOURS.forEach((nb, ni) => {
    const cx = nb.x, w = 9.0, z0 = 2.0, z1 = 10.16, sid = ni === 0 ? '#bcd3e3' : '#e8b7a0', shut = ni === 0 ? '#f5f0e6' : '#7a3b2a';
    X.box('brick', [cx - w / 2 - 0.08, GY, z0], [cx + w / 2 + 0.08, 0, z1 + 0.08]);
    const win = { x0: cx + 1.6, x1: cx + 3.4, y0: 1.1, y1: 2.6 };
    wallXY(X, 'siding', { x0: cx - w / 2, x1: cx + w / 2, y0: 0, y1: 3.55, z0: z1 - 0.16, z1 }, [{ x0: cx - 0.7, x1: cx + 0.7, y0: 0, y1: 2.75 }, win], { color: sid });
    X.box('siding', [cx - w / 2, 0, z0], [cx - w / 2 + 0.16, 3.55, z1 - 0.16], { color: sid });
    X.box('siding', [cx + w / 2 - 0.16, 0, z0], [cx + w / 2, 3.55, z1 - 0.16], { color: sid });
    X.box('siding', [cx - w / 2, 0, z0], [cx + w / 2, 3.55, z0 + 0.16], { color: sid });
    X.box('plaster', [cx - w / 2, 3.4, z0], [cx + w / 2, 3.55, z1], { color: '#e8e2d6' });
    const S = new THREE.Shape(); S.moveTo(-(z1 + 0.5), 0); S.lineTo(-(z0 - 0.5), 0); S.lineTo(-(z0 + z1) / 2, 3.4); S.lineTo(-(z1 + 0.5), 0);
    const g = new THREE.ExtrudeGeometry(S, { depth: w + 0.6, bevelEnabled: false }); g.rotateY(Math.PI / 2);
    X.add('shingle', g, { pos: [cx - w / 2 - 0.3, 3.55, 0], color: ni === 0 ? '#c7d4dc' : '#ffffff', tile: 1.5 });
    facadeWindow(X, win.x0, win.x1, win.y0, win.y1, z1, { shutter: shut });
    glowQuad([cx - 3.4, 1.1], [cx - 1.8, 2.6], '#ffbf73', z1 + 0.01);
    facadeWindow(X, cx - 3.4, cx - 1.8, 1.1, 2.6, z1, { shutter: shut });
    // the lit room behind window + door: floor, back wall (emissive warm), side walls, ceiling
    X.box('floor', [cx - 0.9, -0.2, z1 - 2.6], [cx + 3.6, 0, z1 - 0.16], { color: '#ffffff' });
    X.box('plaster', [cx - 0.9, 0, z1 - 2.76], [cx + 3.6, 3.4, z1 - 2.6], { color: '#f0cf96' });
    X.box('plaster', [cx - 1.06, 0, z1 - 2.6], [cx - 0.9, 3.4, z1 - 0.16], { color: '#f0cf96' });
    X.box('plaster', [cx + 3.6, 0, z1 - 2.6], [cx + 3.76, 3.4, z1 - 0.16], { color: '#f0cf96' });
    glowQuad([cx - 0.85, 0.4], [cx + 3.55, 3.2], '#ffcf8f', z1 - 2.59);
    glass([win.x0, win.y0, z1 - 0.06], [win.x1, win.y1, z1 - 0.04]);
    // door leaf (dynamic for neighbour 0), porch, beam, hooks
    const door = new THREE.Group(); door.name = `neighbourDoor${ni}`; door.position.set(cx - 0.7, 0, z1 - 0.08); exterior.add(door);
    { const D = batcher(); D.box('paint', [0, 0, -0.035], [1.4, 2.74, 0.035], { color: ni === 0 ? '#d63a2a' : '#2a78c8' }); D.add('metal', sph(0.04, 8, 6), { pos: [1.25, 1.3, 0.06], color: '#c9a45c' }); D.build(door, M, { name: 'nbDoor' }); }
    const PY = H.PORCH_Y;
    X.box('brick', [cx - 2.65, GY, z1], [cx + 2.65, PY - 0.06, 12.5]);
    X.box('floor', [cx - 2.65, PY - 0.06, z1], [cx + 2.65, PY, 12.55], { color: '#a7a19a', tile: [1.2, 2.4] });
    for (let k = 0; k < 3; k++) X.box('floor', [cx - 1.0, GY, 12.55 + k * 0.32], [cx + 1.0, PY - 0.2 * (k + 1), 12.55 + (k + 1) * 0.32], { color: '#a7a19a', tile: [1.2, 2.4] });
    for (const s of [-1, 1]) X.box('paint', [cx + s * 2.45 - 0.09, PY, BM.z - 0.09], [cx + s * 2.45 + 0.09, BM.y + 0.24, BM.z + 0.09], { color: '#f5f0e6' });
    X.box('paint', [cx - 2.65, BM.y, BM.z - 0.09], [cx + 2.65, BM.y + 0.22, BM.z + 0.09], { color: '#f5f0e6' });
    const rz0 = z1, rz1 = BM.z + 0.3, ry0 = 3.62, ry1 = BM.y + 0.24, len = Math.hypot(rz1 - rz0, ry0 - ry1), ang = Math.atan2(ry0 - ry1, rz1 - rz0);
    X.add('shingle', boxG(5.6, 0.1, len), { pos: [cx, (ry0 + ry1) / 2 + 0.06, (rz0 + rz1) / 2], rot: [ang, 0, 0], color: '#ffffff', tile: 1.5 });
    X.box('slab', [cx - 1.0, GY, 13.5], [cx + 1.0, GY + 0.02, 16.5], { color: '#bdb5a8' });
    const n = nb.hooks;
    for (let i = 0; i < n; i++) {
      const x = cx + (n - 1) * 0.15 - i * 0.3;
      X.add('metal', cyl(0.012, 0.012, 0.06, 6), { pos: [x, BM.y - 0.03, BM.z], color: '#c9a45c' });
      anchor(`neighbour.${ni}.hook.${i}`, [x, BM.y - 0.09, BM.z], 0);
      anchor(`neighbour.${ni}.lantern.${i}`, [x, BM.y - H.LANTERN.drop, BM.z], 0);
    }
    if (nb.sign) {
      X.box('oak', [cx + 1.1, BM.y + 0.24, BM.z - 0.03], [cx + 1.14, BM.y + 0.6, BM.z + 0.03], { color: '#6b3f22' });
      picture(10, 1.0, 0.62, [cx + 1.6, BM.y + 0.62, BM.z + 0.1], 0);
      X.box('oak', [cx + 1.06, BM.y + 0.28, BM.z + 0.04], [cx + 2.14, BM.y + 0.96, BM.z + 0.08], { color: '#6b3f22' });
    }
    anchor(`neighbour.${ni}.door`, [cx, PY, 10.9], 0);
    anchor(`neighbour.${ni}.inside`, [cx + 0.4, 0, z1 - 1.3], 0, root, { note: 'floor inside the lit room behind the door/window, facing the street' });
    anchor(`neighbour.${ni}.window`, [(win.x0 + win.x1) / 2, 0, z1 - 0.7], 0, root, { note: 'floor spot behind the lit window: heads at ~1.8 m fill the window' });
    anchor(`neighbour.${ni}.path`, [cx, GY, 15.0], Math.PI);
    const glow = makePointGlow({ color: COLORS.lantern, intensity: 1, distance: 9 }); glow.root.position.set(cx, BM.y - 0.35, BM.z - 0.15); exterior.add(glow.root);
    neighbourParts.push({ door, glow });
  });
  // sky
  const sky = makeSky({ radius: 400, cover: 0.3, speed: 0.2 });
  exterior.add(sky.root);
  const skyU = sky.uniforms;
  // street-lamp heads (emissive) + one real light under the lamp across from our door
  const lampHeadMat = new THREE.MeshStandardMaterial({ color: '#2a2d33', emissive: new THREE.Color('#ffd08a'), emissiveIntensity: 0, roughness: 0.6 });
  for (const h of streetLampHeads) { h.material = lampHeadMat; exterior.add(h); }
  const streetLight = new THREE.PointLight('#ffcf8a', 0, 14, 2); streetLight.position.set(1.2, GY + 4.0, 26.3); exterior.add(streetLight);

  // ════════════════════════════════════════ finish batching ════════════════════════════════════════════════════
  B.build(interior, M, { name: 'home' });
  X.build(exterior, M, { name: 'street' });
  {
    const g = mergeGeometries(picGeos.map(prep), false); const m = new THREE.Mesh(g, picMat); m.name = 'pictures'; m.receiveShadow = true; interior.add(m);
    const gg = mergeGeometries(glowAtlasGeos.map(prep), false); const glowAtlas = new THREE.Mesh(gg, glowAtlasMat); glowAtlas.name = 'glowStickers'; interior.add(glowAtlas);
    const gl = mergeGeometries(glassGeos, false); const gm = new THREE.Mesh(gl, glassMat); gm.name = 'glass'; gm.renderOrder = 4; gm.castShadow = false; interior.add(gm);
    const wg = mergeGeometries(glowGeos, false); const wm = new THREE.Mesh(wg, glowMat); wm.name = 'windowGlow'; exterior.add(wm);
  }
  // practicals and lights
  const lamp = makeLamp({ height: 0.62, shadow: true, intensity: 1 });
  lamp.root.position.set(-1.07, H.TABLE, 5.32); lamp.root.rotation.y = Math.PI / 2; interior.add(lamp.root);
  lamp.target.position.set(0, -1.0, 1.4);    // pool on the floor in front of the table, toward the hall centre
  const torch = makeTorch({ intensity: 1 });
  torch.root.position.set(0, 1.4, 4); root.add(torch.root);
  const hemi = new THREE.HemisphereLight('#9fb4d8', '#4a3a2c', 0.3); root.add(hemi);
  const sun = new THREE.DirectionalLight('#ffffff', 0); root.add(sun);
  const sunTarget = new THREE.Object3D(); sunTarget.position.set(0, 0, 6.5); root.add(sunTarget); sun.target = sunTarget;
  tuneShadow(sun, { mapSize: 1536, radius: 3, bias: -0.0005, normalBias: 0.03, near: 5, far: 80 });
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 10, bottom: -10 }); sun.shadow.camera.updateProjectionMatrix();
  // light shafts through the front glazing + transom, dust
  // one set of slabs per sun direction (the slab geometry is sheared along the light's travel direction)
  const travel = (st) => { const d = new THREE.Vector3(...st).normalize().negate(); return [d.x, d.y, d.z]; };
  const mkShafts = (sunDir, color, seed) => {
    const a = makeWindowShaft({ width: 2.3, height: 2.3, dir: travel(sunDir), length: 8, intensity: 0.14, dust: 0.8, color, seed });
    a.root.position.set(0, 1.6, 10.0); interior.add(a.root);
    const b = makeWindowShaft({ width: 1.8, height: 1.4, dir: travel(sunDir), length: 5, intensity: 0.12, dust: 0.6, color, seed: seed + 2 });
    b.root.position.set(3.5, 2.05, 10.0); interior.add(b.root);
    const c = makeWindowShaft({ width: 2.3, height: 0.4, dir: travel(sunDir), length: 8, intensity: 0.1, dust: 0.5, color, seed: seed + 4 });
    c.root.position.set(0, 3.05, 10.0); interior.add(c.root);
    return { setOn(v) { a.setOn(v); b.setOn(v * 0.8); c.setOn(v * 0.8); } };
  };
  const SUN_DUSK = [-0.12, 0.3, 1], SUN_MORNING = [0.25, 0.42, 1];   // morning: low raking sun → warm patch down the hall floor
  const shaftsDusk = mkShafts(SUN_DUSK, '#ffc98f', 3), shaftsMorning = mkShafts(SUN_MORNING, '#fff1dc', 13);
  const dust = makeDust({ box: [2.5, 3.2, 7], count: 320, size: 0.01, intensity: 0.9 });
  dust.root.position.set(0, 1.7, 6.2); interior.add(dust.root);
  const atticGlow = makePointGlow({ color: '#9fb2d6', intensity: 1, distance: 9 });
  atticGlow.root.position.set(-3.5, 5.2, 4.0); interior.add(atticGlow.root);
  const atticDust = makeDust({ box: [2.4, 2.0, 2.4], count: 140, size: 0.01, intensity: 0.7, seed: 9 });
  atticDust.root.position.set(0, CE + 1.2, 6.6); interior.add(atticDust.root);
  // environment (specular + soft fill): a neutral PMREM room, intensity per state
  const pm = new THREE.PMREMGenerator(ctx.renderer);
  const envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();

  // ════════════════════════════════════════ options / lighting ═════════════════════════════════════════════════
  const options = { ...DEFAULT_OPTIONS };
  for (const k of Object.keys(DEFAULT_OPTIONS)) if (opts[k] !== undefined) options[k] = opts[k];
  const background = new THREE.Color('#0b1020');
  const set = {
    root, anchors, options, background, fog: null, exposure: 1,
    lamp, torch, fridgeLight: fridgeL, strip, sun, hemi, porchGlow, sky, kitchenGlow,
    boxLamp: { root: boxLampGroup, spot: boxLampSpot, glow: boxLampGlow },
    parts: { frontDoor, pipDoor, boxDoor, hatch, fridgeDoor, shoes: shoeGroup, coats: coatGroup, photo: photoGroup, standIns: standInGroup, interior, exterior },
    info: { name: 'home', presets: HOME_PRESETS },
    mood: MOODS.night, haze: null, subjectKey: 1,
  };
  const C3 = (h) => new THREE.Color(h);
  const STATES = {
    night: { sun: ['#a9bde0', 0.35, [-0.45, 0.55, 1]], hemi: ['#5f76a8', '#3a2c20', 0.45], env: 0.15, sky: { zenith: '#0a1430', horizon: '#2a3d66', cloudColor: '#1e2a44', cloudDark: '#070b16', sunColor: '#a9bde0', sunIntensity: 0.25, brightness: 1 }, fog: '#1b2945' },
    dusk: { sun: ['#ffb36e', 4.2, SUN_DUSK], hemi: ['#f0b98a', '#5a4030', 0.6], env: 0.25, sky: { zenith: '#36598f', horizon: '#ffb070', cloudColor: '#ffd2a0', cloudDark: '#c0806a', sunColor: '#ffb36e', sunIntensity: 2.2, brightness: 1.15 }, fog: '#e0a879' },
    morning: { sun: ['#ffe2b8', 3.2, SUN_MORNING], hemi: ['#cfe2f5', '#8a7a62', 0.6], env: 0.3, sky: { zenith: '#3f8fe0', horizon: '#9fd0f2', cloudColor: '#ffffff', cloudDark: '#a9b6c4', sunColor: '#fff4e0', sunIntensity: 1.6, brightness: 1.0 }, fog: '#b9d6ee' },
  };
  const mixState = (a, b, u) => ({
    sun: [C3(a.sun[0]).lerp(C3(b.sun[0]), u), lerp(a.sun[1], b.sun[1], u), a.sun[2].map((v, i) => lerp(v, b.sun[2][i], u))],
    hemi: [C3(a.hemi[0]).lerp(C3(b.hemi[0]), u), C3(a.hemi[1]).lerp(C3(b.hemi[1]), u), lerp(a.hemi[2], b.hemi[2], u)],
    env: lerp(a.env, b.env, u),
    sky: Object.fromEntries(Object.keys(a.sky).map((k) => [k, typeof a.sky[k] === 'number' ? lerp(a.sky[k], b.sky[k], u) : C3(a.sky[k]).lerp(C3(b.sky[k]), u)])),
    fog: C3(a.fog).lerp(C3(b.fog), u),
  });
  const moods = (a, b, u) => {        // blend two MOODS (numbers lerp, colours lerp)
    const out = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const va = a[k], vb = b[k];
      if (va && typeof va === 'object' && !Array.isArray(va)) out[k] = moods(va || {}, vb || {}, u);
      else if (typeof va === 'number' && typeof vb === 'number') out[k] = lerp(va, vb, u);
      else if (typeof va === 'string' && typeof vb === 'string' && va[0] === '#') out[k] = '#' + C3(va).lerp(C3(vb), u).getHexString();
      else out[k] = u < 0.5 ? (va ?? vb) : (vb ?? va);
    }
    return out;
  };
  let envIntensity = 0.12;
  function apply() {
    const o = options, L = o.lighting;
    // base state
    let st, nightU = 0;
    if (L === 'dusk') st = mixState(STATES.dusk, STATES.dusk, 0);
    else if (L === 'morning') st = mixState(STATES.morning, STATES.morning, 0);
    else if (L === 'dusk_to_night') { nightU = smooth(clamp(o.nightMix, 0, 1)); st = mixState(STATES.dusk, STATES.night, nightU); }
    else st = mixState(STATES.night, STATES.night, 0);
    const isNight = !(L === 'dusk' || L === 'morning' || L === 'dusk_to_night');
    const nightness = L === 'dusk_to_night' ? nightU : isNight ? 1 : 0;
    // darker ambient in torch / practical / boxroom states
    let hemiK = o.outdoors ? 1.5 : 1, sunK = 1, envK = o.outdoors ? 2.0 : 1;
    if (L === 'night_torch') { hemiK = 0.6; sunK = 0.55; envK = 0.6; }
    if (L === 'dark_practical') { hemiK = 0.45; sunK = 0.35; envK = 0.45; }
    if (L === 'boxroom_lamp') { hemiK = 0.8; sunK = 0.5; envK = 0.8; }
    sun.color.copy(st.sun[0]); sun.intensity = st.sun[1] * sunK;
    const d = new THREE.Vector3(...(o.sunDir || st.sun[2])).normalize();
    sun.position.copy(sunTarget.position).addScaledVector(d, 40);
    hemi.color.copy(st.hemi[0]); hemi.groundColor.copy(st.hemi[1]); hemi.intensity = st.hemi[2] * hemiK;
    envIntensity = st.env * envK;
    for (const [k, v] of Object.entries(st.sky)) { if (typeof v === 'number') skyU[k].value = v; else skyU[k].value.copy(v); }
    skyU.sunDir.value.copy(d); skyU.cover.value = isNight ? 0.25 : 0.16;
    background.copy(st.sky.zenith);
    // practicals (preset defaults, then overrides)
    const lampV = o.lamp != null ? o.lamp : (L === 'night_lamp' ? 1 : 0);
    const torchV = o.torch != null ? o.torch : (L === 'night_torch' ? 1 : 0);
    const porchV = o.porchGlow != null ? o.porchGlow : clamp(nightness * 1.2, 0, 1) * (L === 'morning' ? 0 : 1);
    const boxV = o.boxRoomLight != null ? o.boxRoomLight : ((L === 'dark_practical' && (o.practical === 'strip' || o.practical === 'both')) || L === 'boxroom_lamp' ? 1 : 0);
    const fridgeV = o.fridgeLight ? clamp(o.fridgeOpen * 3, 0, 1) : 0;
    const stripV = o.strip != null ? o.strip : boxV * clamp(1 - o.boxDoorOpen * 8, 0, 1);
    lamp.setOn(lampV); lampBounce.intensity = 1.3 * lampV; lampBounce.visible = lampV > 0; torch.setOn(torchV); torch.root.visible = torchV > 0; porchGlow.setOn(porchV * 0.6); fridgeL.setOn(fridgeV);
    strip.setOn(stripV); strip.setFeet(o.stripFeet || []);
    boxLampSpot.intensity = 12 * boxV; boxLampGlow.intensity = 3.5 * boxV; boxLampSpot.visible = boxLampGlow.visible = boxV > 0; workBulbMat.emissiveIntensity = 8 * boxV;
    // dark_practical keeps a faint warm kitchen glow so the tiles / calendar read behind the fridge practical
    kitchenGlow.setOn(L === 'dark_practical' ? Math.max(o.kitchenLight, 0.15) : o.kitchenLight); atticGlow.setOn(o.atticLight * 0.6);
    pendantMat.emissiveIntensity = 1.5 * o.pendants;
    // exactly one shadowed key per state (others unshadowed; hidden lights cost nothing)
    sun.castShadow = !isNight || L === 'dusk_to_night' ? true : !!o.moonShadow;
    lamp.spot.castShadow = lampV > 0 && (L === 'night_lamp' || o.lamp != null);
    torch.spot.castShadow = torchV > 0;
    fridgeL.spot.castShadow = fridgeV > 0 && L === 'dark_practical';
    boxLampSpot.castShadow = boxV > 0 && (L === 'boxroom_lamp' || (L === 'dark_practical' && o.practical !== 'fridge'));
    if (L === 'dark_practical' && o.practical === 'both') boxLampSpot.castShadow = false;
    // shafts / dust / street / windows
    const shaftV = o.shafts != null ? o.shafts : (L === 'dusk' ? 1 : L === 'morning' ? 0.5 : L === 'dusk_to_night' ? 1 - nightU : 0);
    shaftsDusk.setOn(L === 'morning' ? 0 : shaftV); shaftsMorning.setOn(L === 'morning' ? shaftV : 0);
    const dustV = o.dust != null ? o.dust : (L === 'morning' ? 1 : L === 'dusk' ? 0.8 : L === 'dusk_to_night' ? 0.8 * (1 - nightU) : L === 'night_torch' ? 0.6 : 0.25);
    dust.setOn(dustV); atticDust.setOn(L === 'night_torch' ? 1 : 0.4);
    const streetV = o.streetLights != null ? o.streetLights : clamp((nightness - 0.5) * 2.5, 0, 1);
    lampHeadMat.emissiveIntensity = 4 * streetV; streetLight.intensity = 30 * streetV; streetLight.visible = streetV > 0;
    const winV = o.windowGlow != null ? o.windowGlow : (L === 'morning' ? 0.15 : 0.35 + 0.65 * nightness);
    glowMat.color.setScalar(1.6 * winV);
    glowAtlasMat.color.setScalar(L === 'morning' || L === 'dusk' ? 0.1 : 0.9);
    // doors & parts
    frontDoor.rotation.y = clamp(o.frontDoorOpen, 0, 1) * 1.75;        // swings into the hall (toward −z)
    pipDoor.rotation.y = -Math.PI / 2 - clamp(o.pipDoorOpen, 0, 1) * 1.6;   // hinge north jamb, swings into her room (−x)
    boxDoor.rotation.y = Math.PI - clamp(o.boxDoorOpen, 0, 1) * 1.75;      // swings into the box room (−z)
    hatch.rotation.x = -clamp(o.hatchOpen, 0, 1) * 1.4;
    fridgeDoor.rotation.y = -clamp(o.fridgeOpen, 0, 1) * 1.85;              // opens toward −x (into the kitchen)
    if (neighbourParts[0]) neighbourParts[0].door.rotation.y = clamp(o.neighbourDoorOpen, 0, 1) * 1.6;
    for (const p of neighbourParts) p.glow.setOn(o.neighbourPorchGlow);
    shoeGroup.visible = !!o.shoes; coatGroup.visible = !!o.coats; photoGroup.visible = !!o.photo;
    exterior.visible = !!o.exterior; porchGlow.root.visible = true;
    const nL = clamp(Math.round(o.lanterns), 0, 6);
    standIns.forEach((s, i) => { s.g.visible = i < nL; s.m.emissiveIntensity = i < o.lanternsLit ? 1.4 : 0; s.g.scale.setScalar(i < o.lanternsLit ? 1 : 0.35); });
    // exposure + mood
    set.exposure = L === 'dark_practical' ? 1.2 : 1.0;
    // subject-light key strength for look.lightOn / direct.js helpers (key 'auto'): face ≥ 0.35 even in dark states
    set.subjectKey = L === 'night_torch' || L === 'dark_practical' ? 0.55 : L === 'night_lamp' ? 1.0 : 0.8;
    set.mood = L === 'dusk' ? MOODS.dusk : L === 'morning' ? MOODS.morning : L === 'dusk_to_night' ? moods(MOODS.dusk, MOODS.night, nightU)
      : L === 'night_torch' || L === 'dark_practical' ? MOODS.dark : L === 'boxroom_lamp' ? MOODS.warm : MOODS.night;
    set.haze = isNight
      ? { color: st.fog, density: 0.012, start: 11, falloff: 0.08, height: 0, noise: 0.3, max: 0.6, sky: 0.25 }
      : { color: st.fog, density: 0.0015, start: 11, falloff: 0.08, height: 0, noise: 0.3, max: 0.2, sky: 0.25 };   // day: clear air, saturated exterior
  }
  set.set = (k, v) => { if (!(k in DEFAULT_OPTIONS)) throw new Error(`home.set: unknown option "${k}"`); options[k] = v; apply(); };
  set.setLighting = (p) => { if (!HOME_PRESETS.includes(p)) throw new Error(`home.setLighting: unknown preset "${p}" (have ${HOME_PRESETS.join(', ')})`); options.lighting = p; apply(); };
  set.post = () => ({ ...set.mood, fog: set.haze });
  set.update = (t) => {
    apply();      // re-apply the options every frame (cheap) so the modulation below never accumulates
    setFrame({ t });
    ctx.scene.environment = envTex;
    ctx.scene.environmentIntensity = envIntensity;
    sky.update(t);
    dust.update(t); atticDust.update(t);
    const f = 1 + 0.05 * noise1(t * 3.1, 3) + 0.03 * noise1(t * 7.7, 5);     // lantern glow breathes (pure fn of t)
    porchGlow.light.intensity *= f;
    for (const s of standIns) s.m.emissiveIntensity *= f;
  };
  // camera anchors
  for (const [name, c] of Object.entries(HOME_CAMS)) {
    const a = anchor(`cam.${name}`, c.pos, 0, root, { fov: c.fov, look: c.look });
    a.lookAt(new THREE.Vector3(...c.look));
    anchor(`cam.${name}.look`, c.look, 0);
  }
  apply();
  // everything static never moves: skip matrix updates on the merged meshes
  return set;
}

export const HOME_ANCHORS = {
  'hall.center': 'hall floor, middle (z 5), facing north (toward the box room)',
  'hall.frontDoor': 'inside the front door on the floor, facing into the hall (north)',
  'hall.frontDoor.out': 'porch side of the front door, facing the street',
  'hall.mat': 'doormat centre (inside); hall.shoes.0..3 = Dad boots, Mom flats, my wellies, Pip wellies',
  'hall.coat.0..3': 'coat hooks (Dad, Mom, me, Pip) on the east wall at 2.1 m',
  'hall.table': 'hall table top centre (y 1.0), facing into the hall (+x); hall.table.lamp / hall.table.photo',
  'hall.pipDoor': 'hall floor in front of Pip\'s door (west wall z 8), facing her door (−x)',
  'hall.pipDoor.gap': 'the dark gap at the latch edge of Pip\'s door at eye height (1.62 m), for the eye-in-the-gap ECU',
  'hall.pipDoor.drawings': 'wall spot beside her door frame (kid height) for the column of 7 crayon drawings, facing +x',
  'hall.kitchenArch': 'floor in the kitchen arch (east wall), facing into the hall (−x)',
  'hall.hatch / hall.underHatch / attic.hatch': 'attic hatch centre at the ceiling (or the hatchSoffit underside) / on the hall floor below it / at the attic floor',
  'hall.boxDoor / hall.boxDoor.strip': 'hall floor in front of the box-room door (facing it) / the strip of light under it',
  'hall.radiator': 'in front of the radiator (east wall z 2.5)',
  'kitchen.center / kitchen.fridge / kitchen.fridge.inside / kitchen.fridge.shelf.0..2 / kitchen.fridge.door': 'fridge faces west through the arch',
  'kitchen.counter / kitchen.counter.east / kitchen.window / kitchen.table': 'counter top spots (y 1.2), window, table top (y 1.0)',
  'kitchen.calendar': 'wall calendar spot beside the fridge (north wall), facing +z',
  'pip.room / pip.bed': 'inside Pip\'s room / on her bed',
  'box.center / box.door / box.behindDoor / box.crib / box.paint / box.lamp / box.wall': 'box room spots (Dad flattened behind the door = box.behindDoor)',
  'attic.center / attic.box / attic.loaf': 'attic floor beside the hatch / the one cardboard box / dressing spot for the baker\'s attic',
  'porch.hook.0..5 / porch.lantern.0..5 / porch.beam / porch.center / porch.step / porch.path': 'our porch; hooks left→right as seen from INSIDE',
  'neighbour.0.* (next door, 7 hooks, opening door) / neighbour.1.* (BAKERY, 3 hooks)': 'door, inside, window, path, hook.i, lantern.i',
  'street.center / street.lamp / street.pavement': 'street; street.lamp = under the lamp straight across from our door',
  'cam.<name> / cam.<name>.look': 'camera presets from HOME_CAMS (setupA, setupB, setupC, backHall, boxOut, boxIn, archToFridge, pipGap, hallTable, underHatch, atticDown, kitchen, porchIn, beamMacro, street, streetNeighbours, throughGlass)',
};
