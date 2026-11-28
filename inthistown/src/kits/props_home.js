/*
 * src/kits/props_home.js — the v2 PROP KIT (ep30 'newProps' + every object the beats' visuals need that the house kit
 * src/kits/home.js does not build). Style bible v2 upgrade 5: "stickers out, in-world props in" — information lives
 * on props (canvas-painted tags, photos, labels, screens), never on 2D overlays.
 * Toy-block shapes (rounded boxes, chunky proportions) with real PBR surfaces (src/real/textures_home.js + textures.js
 * sets, vertex-tinted) so they sit in the warm, really-lit house. Sizes are METRES AT CHARACTER SCALE
 * (CHARACTER_HEIGHT 2.0, heads 0.64 wide, hands 0.14 cubes; Pip = scale 0.7): table 1.0 m, wardrobe 2.55 m, stool
 * 0.62 m, a photo frame 0.43 m wide, a hand-held card 0.2 m — things read like real objects next to the big heads.
 *
 * ─── The prop contract ──────────────────────────────────────────────────────────────────────────────────────────────
 *   Every make*(opts) returns a THREE.Object3D (`root`) with
 *     root.userData.set(t, state)   apply an animated state as a PURE FUNCTION of (t, state) — call it every frame from
 *                                   shot.update (or once in setup for static states). Unknown/omitted fields reset to
 *                                   the prop's rest state, so a frame never depends on an earlier frame.
 *     root.userData.*               handles documented per prop (lights, sub-parts, aim(), anchors …)
 *   Origins: on the floor / table under the prop's footprint centre unless noted; the prop FACES +Z (front / label /
 *   printed face toward +Z). Hand-held tools: origin = grip centre, working end along +Z (parent into a character's
 *   joints.handR via ctx.add(prop, ctx.cast.me.joints.handR) and rotate to taste).
 *   "events": many states accept times (`...At`) so one-shot actions (flare, thud, tip, fall) are computed from
 *   t − at — no stored state, any frame order renders the same pixels.
 *   Build props ONCE in the shots module's init(ctx) (store on ctx.props), then ctx.add(prop, parent) + position them
 *   in shot.setup (the engine detaches ctx.add-ed objects at every shot change) and drive userData.set in update.
 *   Building is deterministic (seeded rng, no Math.random/Date). Canvas text uses the system fonts DejaVu Sans/Serif.
 *
 * ─── LANTERNS (the hero prop) ───────────────────────────────────────────────────────────────────────────────────────
 *   makeLantern({ size = 0.26, cord = 0.15, tag = null, tagStyle = 'paint' | 'crayon', tagColor, paper = '#f2dcb3',
 *                 color = COLORS.lantern, glow = 1, hook = true, light = null | { intensity = 1, distance = 3 },
 *                 seed = 1 })
 *     Round pleated paper lantern hanging from a hook. Origin = the hook point (beam underside); with the defaults the
 *     globe centre sits 0.27 m below it = HOME.LANTERN.drop (home.js porch hooks at y 2.62 → centre y 2.35).
 *     tag: null = no tag | '' = a BLANK wooden tag | 'MOM' … 'BABY' — canvas-painted wooden name tag on a V-string under
 *     the globe, text on BOTH faces (reads from inside the hall and from the porch). tagStyle 'crayon' = Pip's waxy
 *     crayon letters (default colour '#e0457b'). light: optional small unshadowed PointLight inside (normally keep it
 *     off and use ONE shared light per row/porch — home.js porchGlow, or makeLanternRow({ light: true })).
 *     userData.set(t, state) — state is a preset string, a plain object, or an event script:
 *       'lit' | 'dark' (unlit, unfolded) | 'folded' (collapsed to a thin dark disc against the cap: "reads as nothing")
 *       { lit 0..1, fold 0..1, flare 0..1 (extra flash + halo), pulse 0..1, smoke age-in-seconds | null,
 *         swing rad (lantern sway about the hook), tagSwing rad (tag swing about its string) }
 *       { initial: 'lit' | 'dark' | 'folded', events: [{ at, do }, …] }  where do =
 *         'light'      unfold (0.35 s, slight overshoot) then catch with a flame FLARE (+0.2 s) and glow (S11/S52/b12)
 *         'out'        flame dies (0.2 s), a soft smoke wisp curls up (2.4 s), the paper folds shut (0.45 s) (b10)
 *         'extinguish' goes dark + smoke, stays unfolded      'fold' / 'unfold' paper only (no light change)
 *         'flare'      one flare on a lit lantern (S03 "on heart")   'pulse' a 0.35 s brighten (S06 count 1-2-3-4-5)
 *         'tap'        swing impulse on lantern + tag (S14 broom tap → S15 tag still swinging); { at, do, amount }
 *       Event and object forms mix: { initial:'lit', events:[…], swing: 0.05 } (explicit fields add/override).
 *       Returns the resolved { lit, fold, flare, … } (the row uses it to drive its shared light).
 *     Lit look: emissive paper ×2.6 (blooms through the look preset's 0.9 threshold) with a slow 2-band flicker from
 *     noise1(t), soft additive halo sprite; flare = ×3 flash + a 3× halo burst decaying over 0.6 s.
 *     A folded lantern reads as NOTHING: its tag shrinks to zero over the last 10 % of the fold (fold 0.9 → 1).
 *     tag: null = no tag at all; '' = a blank board; 'MOM' … painted; tagStyle 'crayon' = Pip's crayon letters (fixed:
 *     the crayon fill is now painted on its own canvas and masked once by the glyphs — it used to render blank).
 *     userData: { globe, tag, tagPivot, halo, light, tagTexture(text, style) }
 *   makeLanternRow({ count = 5, pitch = 0.3, xs = null, tags = [], tagStyles = [], light = false, lightIntensity = 1,
 *                    lightDistance = 8, lightOffset = [0, -0.45, -0.6], beam = false, unlit = 'dark',
 *                    …any makeLantern opts })
 *     N lanterns along local X. Lantern i hangs at x = xs[i] ?? ((count−1)/2 − i)·pitch, i.e. i = 0 is the LEFTMOST as
 *     seen from INSIDE the hall looking out (+Z) — the home.js hook order (HOME.HOOKS = +0.6 … −0.9). Tag i = tags[i].
 *     beam: true adds a wooden beam with screw hooks above them (for porches that are not home.js's).
 *     light: one shared unshadowed warm PointLight, intensity ∝ (Σ lit + flares) / count (always present → no shader
 *     recompiles when lanterns go out).
 *     userData.set(t, state): state = number n (first n lit, the rest `unlit`: 'dark' | 'folded') | array of per-lantern
 *       states (any makeLantern form; null = 'dark') | function (i, t) → state | one state for all.
 *     userData: { lanterns: [Object3D], light }
 *   hangOnHooks(ctx, row, prefix = 'porch.hook', first = 0)   puts lantern i of an already ctx.add-ed row on the home
 *     set's anchors `${prefix}.${first + i}` ('porch.hook.0…5', 'neighbour.0.hook.0…6', 'neighbour.1.hook.0…2'); the
 *     shared light goes to their mean + lightOffset. Call in setup after ctx.add(row).
 *   Ep30 home recipe: hide home.js's stand-ins (option lanterns: 0 — the default), ctx.add(row); hangOnHooks(ctx, row);
 *     the home's own porchGlow already is the shared light (keep row light:false there).
 *
 * ─── HALLWAY ────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   makeWardrobe({ w = 1.2, h = 2.55, d = 0.62, color = '#3f72b5', knob = '#d9b45a' })   tall blue wardrobe.
 *     Origin = floor under the middle of its BOTTOM-BACK edge; upright it occupies z 0…d (doors face +Z).
 *     set(t, { tilt 0..1 (0 upright, 1 lying ON ITS BACK: pivots about the bottom-back edge, the top ends at z = −h, the
 *              doors face up and it is only d = 0.62 m tall — under the setup-A occlusion envelope), doors 0..1,
 *              thudAt (time: a heavy landing → 0.5 s rock + dust puff at the base), wobble rad })
 *     ONE wardrobe per film (continuity): ep30 uses makeWardrobe({ h: 2.3, d: 0.42 }) for the S01 drag AND the S04/S05
 *     heave — 2.3 m covers Pip's 1.16 m-wide door upright; lying it is a ≈0.52 m slab (d + crown/doors ≈ 0.1).
 *     SETUP A placement that keeps both me and the slab inside the 0.7 + 0.21·d envelope (verified in showcase S1):
 *     camera (0.05, 0.6, 4.0) tilt 3°, fov 34; me ≈ 4.9 m from the camera (z 8.9, drag low 0.5) hauling the slab in
 *     front of me (origin z 8.45, spanning ≈ 2.2–4.5 m from the camera). Lanterns ≈ 85 px at 1080, face at y ≈ 0.45.
 *     (At the scripted 2 m my 0.64 m head is 70 % of the frame width and the slab cannot fit — use this instead.)
 *     userData: { body, dust }
 *   makeHallTable({ w = 1.2, d = 0.45, h = 1.0, lamp = true, lampShadow = true, lampHeight = 0.72, photo = true,
 *                   clutter = true })   console table + look.js makeLamp (shadowed key spot + glow) + makeFamilyPhoto +
 *     key bowl, keys, letters, books. Front = +Z. set(t, { lamp 0..1 (default 1), bumpAt (time | [times]: lamp wobbles,
 *     photo rattles, keys jump), wobble }). userData: { lamp (look.js lamp: spot, glow, setOn, aim), photo, top: h }
 *     (In home.js the hall already has a table + lamp at 'hall.table': there use makeFamilyPhoto on 'hall.table.photo'
 *     with the home option photo: false.)
 *   makeFamilyPhoto({ w = 0.36, h = 0.28, frame = '#c9a45c', stand = true })  canvas-painted portrait of the four of
 *     us (Dad: beard + glasses + mustard jumper, Mom: tall bun + teal cardigan, me: black hoodie + white knight +
 *     headphones, Pip: two puffs + yellow star tee) in a glazed frame on an easel back. Origin = bottom centre of the
 *     frame on the table, picture faces +Z (leans back 10°). set(t, { rattle rad, rattleAt time | [times] }).
 *   makeDoormat({ w = 1.3, d = 0.8, shoes = true })   coir mat with a woven border + four pairs side by side
 *     (Dad's big brown boots, Mom's teal flats, my black wellies with a white knight sticker, Pip's tiny yellow
 *     wellies; x −0.42, −0.13, 0.15, 0.42 — toes toward +Z). set(t, { scatter 0..1 | scatterAt (time: kicked, 0.6 s),
 *     kickX = −1 }) → the shoes slide/tumble deterministically (S39). userData: { shoes: [pair groups] }
 *   makeShoePair(kind = 'boots' | 'flats' | 'wellies' | 'pipWellies' | 'sneakers')   one pair, toes +Z, origin floor.
 *   makeCoatHooks({ count = 4, pitch = 0.3, coats = true })   oak rail with brass hooks at y 0 (origin = rail centre on
 *     the wall), coats hang toward +Z: Dad brown, Mom teal, my black (knight patch), Pip's yellow raincoat.
 *     set(t, { swayAt (time), part: { i, amount 0..1 } (coat i pushed aside by the torch sweep) }). userData: { coats }
 *
 * ─── HANDHELD / TOOLS ───────────────────────────────────────────────────────────────────────────────────────────────
 *   makeTorchProp({ shadow = true, angle = 0.36, reach = 14, intensity = 1, beam = 0.12, beamLength = 3.2, color })
 *     Rubber-grip torch with a REAL shadowed SpotLight + a soft visible beam cone (additive, fades along its length and
 *     near the lens; beam 0 = off). Origin = grip centre, light along +Z. set(t, { on 0..1 (default 1), onAt (click on:
 *     a 2-frame stutter), offAt, flicker 0..1, beam }) ; userData: { spot, lens, beamMesh, aim(fromVec3, toVec3) (world,
 *     every frame, like look.makeTorch), setOn(v) }
 *   makeStool({ h = 0.62, top = '#c08a55', legs = '#f1ece0' })   two-step wooden step stool (top at h, lower step at
 *     0.5 h forward on +Z). set(t, { tip 0..1 | tipAt (time: tips over onto its +X side in 0.45 s with a bounce) }).
 *   makeStepLadder({ h = 1.35, w = 0.62, steps = 4, color, rail })   A-frame step ladder for the attic hatch beats
 *     (home.js HATCH REACH table: palms on the 3.4 m hatch = top 1.35 for me; head through the hatch ≈ 1.95).
 *     Origin = floor under the centre of the top platform; climbing side +Z. userData { topY, stepY: [tread heights],
 *     set(t, { wobble }) }. Stand a character on it with ctx.place(id, anchor, { offset: [0, topY, 0] }).
 *   makeBroom({ length = 1.8 })   origin = bristle tips on the floor, handle up +Y. userData.gripY (upper grip height).
 *   makeFryingPan({ r = 0.2 })    origin = grip centre, pan along +Z, cooking face +Y (Pip's helmet: rotate x = π).
 *   makeScrewdriver()             0.3 m, yellow/black grip, origin = grip centre, tip along +Z.
 *
 * ─── ATTIC / RACCOONS ───────────────────────────────────────────────────────────────────────────────────────────────
 *   makeCardboardBox({ w = 0.7, h = 0.5, d = 0.5, label = '', labelStyle = 'marker', flaps = 0, tape = true,
 *                      dusty = 0.3, seed })   procedural corrugated board, taped lid; label = marker text on a taped
 *     paper label on the +Z face. set(t, { flaps 0..1 (lid flaps open outward) }).  makeLabelledBox(label, opts) = same.
 *   makeCobweb({ size = 0.7, sag = 0.12 })   corner web (alpha card, catches torch light, faces +Z). Origin = the
 *     web's anchor corner; the card extends +X and −Y from it (put the origin in the rafter angle and rotate).
 *     set(t, { sway = 1 }) (gentle drift from noise1(t) × sway).
 *   makeLoaf({ length = 0.46 })   crusty bloomer with 3 slashes, a bite out of one end.
 *   makeEyeGlints({ pairs = 2, spacing = 0.42, eye = 0.055, color = '#e8ff9c' })   eye-shine sprites (additive, bloom)
 *     for raccoons frozen in a torch beam (pairs spread along X). set(t, { on 0..1, blink = true (seeded blinks) }).
 *   makeRaccoonTail({ length = 0.62, rings = 5, segs = 10 })   furry ringed grey tail (bending segments), base at the
 *     origin, extends along +X. set(t, { curl rad (0.6), wave (0.15), flickAt (time: one fast swipe across, base yaw
 *     +1.25 → −1.25 rad over 0.13 s = 4 frames), flickOnly (visible only during the flick), hide })
 *
 * ─── BOX ROOM (the nursery reveal) ─────────────────────────────────────────────────────────────────────────────────
 *   makeCrib({ l = 1.5, wd = 0.92, h = 1.0, base = 0.32, wood = '#e8cfa4', mattress = false, stage = 'half' })
 *     Slatted crib for the toy-scale family, long axis X. Four side panels, each hinged at its bottom edge:
 *     sides = [front +Z, back −Z, left −X end, right +X end], 0 = upright, 1 = FLAT on the floor (outward, "petals").
 *     stage 'half' = default sides [1, 0, 0, 0.3] (front side lying beside it, the +X end leaning out) + loose screws;
 *     'built' = all up. set(t, { sides: number | [4], fallAt (time: every side falls flat with a stagger + bounce,
 *     0.55 s, S42), wobble }). userData: { panels }
 *   makeCribBox({ w = 1.45, h = 0.95, d = 0.16, lying = false })   flat-pack box, big navy line drawing of a crib,
 *     "SNUGGLE · BABY CRIB · flat-pack". lying = true: face up (top-down S42), origin on the floor.
 *   makeInstructionSheet({ w = 0.42, h = 0.56 })   paper with 3 numbered crib assembly steps (face +Z).
 *   makePaintTin({ r = 0.13, h = 0.27, lid = false, color = '#ffcc2e' })   tin with a SUNSHINE YELLOW label and yellow
 *     drips down its side, wire handle. set(t, { handle rad }).
 *   makePaintRoller({ length = 0.5 })  yellow-soaked roller, origin grip centre, roller along +Z.
 *   makePaintTray({ w = 0.42, d = 0.56 })   tray with a yellow pool. set(t, { rock rad | rockAt (time) }).
 *
 * ─── KITCHEN (the pickle) ───────────────────────────────────────────────────────────────────────────────────────────
 *   makePickleJar({ r = 0.13, h = 0.34, pickles = 8, lid = true })   clear glass (opacity 0.1), light yellow-green brine
 *     (0.25), long light-green bumpy gherkins at angles, PICKLES label slightly emissive (0.15) with dark ink.
 *   makeIceCreamTub({ r = 0.13, h = 0.17, lid = false, flavour = 'VANILLA' })   open tub, scooped cream surface.
 *   makePickle({ length = 0.14, dip = 0 })   one bumpy pickle along +Z (origin = its middle); dip 0..1 = how much of the
 *     +Z end is coated in ice cream. set(t, { dip, drip 0..1 (a brine drop hanging off the end) }).
 *
 * ─── THE REVEAL / PARCEL ────────────────────────────────────────────────────────────────────────────────────────────
 *   makeUltrasound({ w = 0.2, h = 0.15, glow = 0.35 })   glossy black scan card: grainy bright fan, dark sac, one white
 *     bean, tiny white header text. Origin = card centre, image faces +Z. glow = emissive lift so the fan reads in a
 *     dim robe-pocket insert (set(t, { glow })).
 *   makeParcel({ w = 0.34, h = 0.22, d = 0.28, ribbon = '#ffd23f', socks = 0 })   brown-paper parcel, yellow ribbon +
 *     bow; set(t, { socks 0..1 }) = how far the tiny knitted socks poke out from under the lid.
 *   makeSocks({ color = '#f6e7f0', stripe = '#ffd23f' })   a pair of tiny knitted socks (origin floor centre).
 *
 * ─── IN-WORLD TEXT / SIGNS (canvas textures sized so the text fits) ─────────────────────────────────────────────────
 *   makeBakerySign({ w = 1.3, h = 0.46, text = 'BAKERY' })   hand-painted board + loaf + wheat, 2 hanging chains
 *     (origin = top centre where the chains meet the bracket). set(t, { swing }).
 *   makeLetter({ w = 0.3, h = 0.4, title = '', lines = [] | text, hand = true, fold = 0 })   handwritten letter.
 *   makeStickyNote({ text = 'BUY PICKLES!!', color = '#ffe66b', size = 0.17 })   (curled corner).
 *   makeCalendar({ w = 0.42, h = 0.58, month = 'NOVEMBER', marks = { 12: 'circle', 20: 'x', 28: 'DUE?' } , start = 5 })
 *     spiral calendar for home.js 'kitchen.calendar'.
 *   makePhone({ w = 0.13 (h = 2.05 w), lines = [{ from: 'mom'|'me', text }], title = 'Mom', on = 1, glow = 1.2,
 *               lock = false, time = '23:58' })   phone (no brand) with an emissive chat screen (rounded bubbles, wrapped
 *     text) or a lock screen; screen faces +Z. set(t, { on, glow }).
 *   makeCrayonDrawings({ count = 7, ringed = 4, w = 0.28, h = 0.2, gap = 0.04 })   column of crayon drawings taped
 *     to the wall, each five yellow lanterns on a beam, lantern `ringed` circled in red; origin = top of the column,
 *     papers hang down −Y, face +Z (home.js anchor 'hall.pipDoor.drawings').
 *   makeDoorSign({ text = 'NO BROTHERS', headphones = true, w = 0.4, h = 0.28 })   crayon sign, headphones crossed out.
 *   makeTextCard({ w, h, draw(g, W, H), rough = 0.85, px = 1024 (long side), thick = 0.002, emissive = 0 })   any custom
 *     canvas-painted card (low level; draw is called once with the 2D context and the canvas size). userData: { face,
 *     texture, canvas }.
 *
 * ─── Misc exports ───────────────────────────────────────────────────────────────────────────────────────────────────
 *   lanternStateAt(t, state, seed) → { lit, fold, flare, pulse, smoke, swing, tagSwing }  (pure; what set() applies)
 *   familyPortraitTexture() → the cached CanvasTexture of the family portrait (reuse it on other frames / walls)
 *   PROP_COLORS (palette: wardrobe, mom, dad, me, pip, paint, wood, pale, brass, …), PROP_KIT { name: factory }
 *
 * ─── PARTICLES ──────────────────────────────────────────────────────────────────────────────────────────────────────
 *   makeDustBurst({ mode = 'puff' | 'fall', count = 160, size = [0.8, 0.05, 0.8] (emitter box), color = '#d9cbb2',
 *                   intensity = 1, life = 1.6, spread = 0.6, seed })   dust puff on a thud / dust falling from a hatch
 *     edge through a torch beam. set(t, { at (time the burst starts), on = 1 }) — invisible outside [at, at + life].
 *
 * Determinism: every set() writes absolute values from (t, state) only; noise from util noise1/hash; canvases are
 * painted once from seeded rng. Cost: most props are 1–4 draw calls (static parts merged per material); the lantern is
 * 6 meshes + 1 halo sprite (+6 smoke sprites, hidden when idle); torch = 1 shadowed spot (+≈0.2 s/frame like any
 * shadowed light) + 1 additive cone; the hall table's lamp = 1 shadowed spot + 1 point (pass lamp:false inside home.js).
 * Build time for the whole kit ≈ 0.5–1 s (canvas painting + PBR sets shared with home.js).
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, clamp, lerp, smooth, hash, noise1 } from '../lib/util.js';
import { getHomePBR, HOME_TILE } from '../real/textures_home.js';
import { getPBR, getNoiseTex } from '../real/textures.js';
import { COLORS, makeLamp, tuneShadow } from '../lib/look.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const SANS = '"DejaVu Sans", "Liberation Sans", sans-serif';
const SERIF = '"DejaVu Serif", "Liberation Serif", serif';
export const PROP_COLORS = {
  wardrobe: '#3f72b5', mom: '#1f8f8a', dad: '#d9a62e', me: '#1d1d22', pip: '#ffd23f', paint: '#ffcc2e',
  wood: '#c08a55', pale: '#e8cfa4', brass: '#d9b45a', cream: '#f3ead6', navy: '#22355e', crayonPink: '#e0457b',
};

// ═════════════════════════════════════════════ materials ══════════════════════════════════════════════════════════
// kind → PBR spec. Vertex colours tint (texture albedos of 'paint'/'plaster'/'carpet' are near-white). UVs are in METRES
// (box projection, see prepGeom), so `tile` = metres per texture repeat.
const KINDS = {
  oak: { home: 'oak', ns: 0.6 }, paint: { home: 'paintwood', ns: 0.4, ao: 0.4 }, plaster: { home: 'plaster', ns: 0.4 },
  matte: { home: 'paintwood', ns: 0.45, ao: 0.4, noRough: true, rough: 0.8, env: 0.55 },
  carpet: { home: 'carpet', ns: 0.8, ao: 0.6 }, coir: { home: 'coir', ns: 1 }, floor: { home: 'floorboards', ns: 0.8 },
  knit: { real: 'fabric', tile: 0.22, ns: 0.9, rough: 1 }, denim: { real: 'denim', tile: 0.3, ns: 0.7 },
  fur: { real: 'fabric', tile: 0.08, ns: 1.6, rough: 1 },
  card: { card: true, tile: 0.6, ns: 0.6 },
  plain: { rough: 0.72 }, satin: { rough: 0.45 }, gloss: { rough: 0.18 }, rubber: { rough: 0.6 },
  metal: { rough: 0.3, metal: 0.9 }, brushed: { rough: 0.5, metal: 0.75 }, paper: { rough: 0.92 },
  bread: { real: 'sand', tile: 0.35, ns: 1.2, rough: 0.85 },
};
const _mats = new Map();
function kindMat(kind) {
  let m = _mats.get(kind);
  if (m) return m;
  const s = KINDS[kind];
  if (!s) throw new Error(`props_home: unknown material kind "${kind}"`);
  m = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: s.rough ?? 1, metalness: s.metal ?? 0 });
  let set = null;
  if (s.home) { const [tu, tv] = HOME_TILE[s.home]; set = getHomePBR(s.home).repeat(1 / tu, 1 / tv); }
  else if (s.real) set = getPBR(s.real).repeat(1 / s.tile, 1 / s.tile);
  else if (s.card) set = cardboardSet().repeat(1 / s.tile, 1 / s.tile);
  if (set) {
    m.map = set.map; m.normalMap = set.normalMap; if (!s.noRough) m.roughnessMap = set.roughnessMap;
    m.normalScale.set(s.ns ?? 1, s.ns ?? 1);
    if (s.ao) { m.aoMap = set.roughnessMap; m.aoMapIntensity = s.ao; }
  }
  if (s.env != null) m.envMapIntensity = s.env;
  m.name = 'props:' + kind;
  _mats.set(kind, m);
  return m;
}

// ═════════════════════════════════════════════ geometry ═══════════════════════════════════════════════════════════
const rb = (w, h, d, r = 0.02, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.max(0.001, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)));
const cy = (rt, rbt, h, seg = 16, open = false) => new THREE.CylinderGeometry(rt, rbt, h, seg, 1, open);
const sp = (r, ws = 16, hs = 10) => new THREE.SphereGeometry(r, ws, hs);
const _col = new THREE.Color();
/** non-indexed, position/normal/uv only; uv = box projection in metres (local, pre-transform) unless uv === 'keep'. */
function prepGeom(g, uvMode = 'box') {
  let o = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(o.attributes)) if (!['position', 'normal', 'uv'].includes(k)) o.deleteAttribute(k);
  if (!o.attributes.normal) o.computeVertexNormals();
  const n = o.attributes.position.count;
  if (uvMode === 'box' || !o.attributes.uv) {
    const P = o.attributes.position, N = o.attributes.normal, uv = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i));
      if (ax >= ay && ax >= az) { uv[i * 2] = P.getZ(i); uv[i * 2 + 1] = P.getY(i); }
      else if (ay >= az) { uv[i * 2] = P.getX(i); uv[i * 2 + 1] = P.getZ(i); }
      else { uv[i * 2] = P.getX(i); uv[i * 2 + 1] = P.getY(i); }
    }
    o.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }
  o.clearGroups();
  return o;
}
function compose(pos, rot, scale) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  if (rot) q.setFromEuler(rot.isEuler ? rot : new THREE.Euler(rot[0] || 0, rot[1] || 0, rot[2] || 0, rot[3] || 'XYZ'));
  const s = scale == null ? V3(1, 1, 1) : typeof scale === 'number' ? V3(scale, scale, scale) : V3(...scale);
  return m.compose(pos ? V3(...pos) : V3(), q, s);
}
/** Static-part batcher: add(kind, geom, { pos, rot, scale, matrix, color }) … build(parent) → one mesh per kind. */
class Batch {
  constructor() { this.parts = new Map(); }
  add(kind, geom, { pos, rot, scale, matrix, color = '#ffffff', uv = 'box' } = {}) {
    const g = prepGeom(geom, uv);
    g.applyMatrix4(matrix || compose(pos, rot, scale));
    _col.set(color);
    const n = g.attributes.position.count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { c[i * 3] = _col.r; c[i * 3 + 1] = _col.g; c[i * 3 + 2] = _col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    if (!this.parts.has(kind)) this.parts.set(kind, []);
    this.parts.get(kind).push(g);
    return this;
  }
  build(parent, { cast = true, receive = true, name = '' } = {}) {
    const out = [];
    for (const [kind, list] of this.parts) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), kindMat(kind));
      mesh.castShadow = cast; mesh.receiveShadow = receive; mesh.name = `${name}:${kind}`;
      parent.add(mesh); out.push(mesh);
    }
    this.parts.clear();
    return out;
  }
}
function group(name, parent) { const g = new THREE.Group(); g.name = name; if (parent) parent.add(g); return g; }
function rootProp(name, setFn) { const r = group(name); r.userData.set = setFn || (() => {}); return r; }
/** a canvas-textured mesh (own material); geometry UVs are kept (0..1 over the face). */
function texMesh(geom, tex, { rough = 0.85, metal = 0, emissive = 0, transparent = false, alphaTest = 0, side = THREE.FrontSide, color = '#ffffff', cast = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ map: tex, color, roughness: rough, metalness: metal, transparent, alphaTest, side });
  if (emissive) { m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = tex; m.emissiveIntensity = emissive; }
  const mesh = new THREE.Mesh(geom, m); mesh.castShadow = cast; mesh.receiveShadow = true;
  return mesh;
}
const easeOutBack = (u) => { u = clamp(u, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const bounceOut = (u) => {
  u = clamp(u, 0, 1); const n1 = 7.5625, d1 = 2.75;
  if (u < 1 / d1) return n1 * u * u;
  if (u < 2 / d1) { u -= 1.5 / d1; return n1 * u * u + 0.75; }
  if (u < 2.5 / d1) { u -= 2.25 / d1; return n1 * u * u + 0.9375; }
  u -= 2.625 / d1; return n1 * u * u + 0.984375;
};
/** damped oscillation impulse after time `at` (0 before). */
const ring = (t, at, amp, freq, decay, phase = 0) => { if (at == null) return 0; const d = t - at; return d < 0 ? 0 : amp * Math.exp(-decay * d) * Math.sin(TAU * freq * d + phase); };
const times = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const sumRing = (t, ats, amp, freq, decay, phase) => times(ats).reduce((s, a) => s + ring(t, a, amp, freq, decay, phase), 0);

// ═════════════════════════════════════════════ canvas helpers ═════════════════════════════════════════════════════
function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function ctex(c, { srgb = true, wrap = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
/** set g.font to the largest size ≤ size that fits maxW; returns the size. */
function fitFont(g, text, maxW, size, weight = '900', family = SANS) {
  let s = size;
  for (; s > 6; s -= 2) { g.font = `${weight} ${s}px ${family}`; if (g.measureText(text).width <= maxW) break; }
  return s;
}
/** hand-painted text: per-letter jitter + a few offset translucent brush passes. */
function paintText(g, text, cx, cy, { size = 60, maxW = 400, color = '#2a1a10', family = SANS, weight = '900', r = rng(3), jitter = 0.05 } = {}) {
  const s = fitFont(g, text, maxW, size, weight, family);
  g.textBaseline = 'middle'; g.textAlign = 'left';
  const w = g.measureText(text).width;
  let x = cx - w / 2;
  const glyphs = [...text];
  const offs = glyphs.map(() => [(r() - 0.5) * s * jitter, (r() - 0.5) * s * jitter * 1.4, (r() - 0.5) * jitter * 2]);
  for (let pass = 0; pass < 3; pass++) {
    g.globalAlpha = pass === 0 ? 1 : 0.35;
    x = cx - w / 2;
    glyphs.forEach((ch, i) => {
      const cw = g.measureText(ch).width;
      g.save(); g.translate(x + cw / 2 + offs[i][0] + (pass ? (r() - 0.5) * s * 0.04 : 0), cy + offs[i][1] + (pass ? (r() - 0.5) * s * 0.04 : 0)); g.rotate(offs[i][2]);
      g.fillStyle = color; g.fillText(ch, -cw / 2, 0); g.restore();
      x += cw;
    });
  }
  g.globalAlpha = 1;
  return s;
}
/** crayon text: the glyphs filled with waxy diagonal strokes (gaps show the paper), wobbly baseline. */
function crayonText(g, text, cx, cy, { size = 60, maxW = 400, color = '#e0457b', r = rng(5), family = SANS, weight = '900' } = {}) {
  const W = g.canvas.width, H = g.canvas.height;
  const [mc, m] = cvs(W, H);
  const s = fitFont(m, text, maxW, size, weight, family);
  m.textBaseline = 'middle'; m.textAlign = 'left';
  const w = m.measureText(text).width;
  let x = cx - w / 2;
  for (const ch of text) {
    const cw = m.measureText(ch).width;
    m.save(); m.translate(x + cw / 2, cy + (r() - 0.5) * s * 0.18); m.rotate((r() - 0.5) * 0.22); m.fillStyle = '#000'; m.fillText(ch, -cw / 2, 0); m.restore();
    x += cw * (0.96 + r() * 0.1);
  }
  // crayon fill: a waxy base + diagonal strokes painted on their OWN canvas (normal source-over), then masked ONCE by
  // the glyphs (destination-in). (Bug fix: 'source-in' per stroke erased everything outside each stroke → blank tags.)
  const [sc, sg] = cvs(W, H);
  sg.globalAlpha = 0.62; sg.fillStyle = color; sg.fillRect(0, 0, W, H);
  sg.strokeStyle = color; sg.lineCap = 'round';
  const n = Math.max(900, Math.round(W * H / 70));
  for (let k = 0; k < n; k++) {
    const px = r() * W, py = r() * H, l = 4 + r() * 10;
    sg.globalAlpha = 0.55 + r() * 0.45; sg.lineWidth = 1.5 + r() * 2.5;
    sg.beginPath(); sg.moveTo(px, py); sg.lineTo(px + l, py - l * 0.8); sg.stroke();
  }
  sg.globalAlpha = 1; sg.globalCompositeOperation = 'destination-in'; sg.drawImage(mc, 0, 0);
  g.drawImage(sc, 0, 0);
  return s;
}
/** crayon stroke (circle / line) helper: several jittered passes. */
function crayonStroke(g, fn, { color = '#e8483b', width = 6, passes = 3, r = rng(9), alpha = 0.75 } = {}) {
  g.save(); g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let p = 0; p < passes; p++) { g.globalAlpha = alpha * (0.6 + r() * 0.4); g.lineWidth = width * (0.7 + r() * 0.5); g.beginPath(); fn(g, (r() - 0.5) * width * 0.6, (r() - 0.5) * width * 0.6, r); g.stroke(); }
  g.restore();
}
function woodBg(g, W, H, base = '#c99b62', r = rng(11), grain = 0.18) {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 40; k++) {
    const y = r() * H, a = grain * (0.3 + r());
    g.strokeStyle = `rgba(90,55,25,${a.toFixed(3)})`; g.lineWidth = 0.6 + r() * 2.2;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= W; x += W / 8) g.lineTo(x, y + Math.sin(x * 0.02 + k) * (2 + r() * 3));
    g.stroke();
  }
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,30,10,0.35)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function paperBg(g, W, H, base = '#fbf7ec', r = rng(13), fibre = 0.05) {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 220; k++) { g.fillStyle = `rgba(120,100,70,${(fibre * r()).toFixed(3)})`; g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3); }
}
function roundRect(g, x, y, w, h, rr) { g.beginPath(); g.moveTo(x + rr, y); g.arcTo(x + w, y, x + w, y + h, rr); g.arcTo(x + w, y + h, x, y + h, rr); g.arcTo(x, y + h, x, y, rr); g.arcTo(x, y, x + w, y, rr); g.closePath(); }

// procedural corrugated cardboard PBR-like set (map + normal + roughness), tileable
let _card = null;
function cardboardSet() {
  if (_card) return _card;
  const S = 256, [c, g] = cvs(S, S), r = rng(21);
  g.fillStyle = '#b8875a'; g.fillRect(0, 0, S, S);
  for (let k = 0; k < 600; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,60,30' : '230,200,160'},${(0.05 + r() * 0.07).toFixed(3)})`; g.fillRect(r() * S, r() * S, 1 + r() * 6, 1 + r() * 2); }
  for (let x = 0; x < S; x += 8) { g.fillStyle = 'rgba(80,50,20,0.06)'; g.fillRect(x, 0, 3, S); }
  const map = ctex(c, { wrap: true });
  const [nc, ng] = cvs(S, S);
  const img = ng.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const nx = Math.cos((x / 8) * TAU) * 0.18, i = (y * S + x) * 4;
    img.data[i] = Math.round((nx * 0.5 + 0.5) * 255); img.data[i + 1] = 128; img.data[i + 2] = 245; img.data[i + 3] = 255;
  }
  ng.putImageData(img, 0, 0);
  const normalMap = ctex(nc, { srgb: false, wrap: true });
  const [rc, rg] = cvs(8, 8); rg.fillStyle = 'rgb(255,235,128)'; rg.fillRect(0, 0, 8, 8);
  const roughnessMap = ctex(rc, { srgb: false, wrap: true });
  const set = { map, normalMap, roughnessMap };
  set.repeat = (rx, ry) => { const o = { ...set }; for (const k of ['map', 'normalMap', 'roughnessMap']) { o[k] = set[k].clone(); o[k].repeat.set(rx, ry); o[k].needsUpdate = true; } return o; };
  _card = set;
  return set;
}
// soft radial glow (halo / flare) and smoke puff sprite textures
let _glowTex = null, _smokeTex = null;
function glowTex() {
  if (_glowTex) return _glowTex;
  const [c, g] = cvs(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.18, 'rgba(255,255,255,0.55)'); grd.addColorStop(0.45, 'rgba(255,255,255,0.14)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  _glowTex = ctex(c);
  return _glowTex;
}
function smokeTex() {
  if (_smokeTex) return _smokeTex;
  const [c, g] = cvs(128, 128), r = rng(31);
  for (let k = 0; k < 26; k++) {
    const x = 64 + (r() - 0.5) * 50, y = 64 + (r() - 0.5) * 50, rr = 14 + r() * 26;
    const grd = g.createRadialGradient(x, y, 0, x, y, rr);
    grd.addColorStop(0, 'rgba(255,255,255,0.22)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
  }
  _smokeTex = ctex(c);
  return _smokeTex;
}
function additiveSprite(tex, color) {
  const m = new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const s = new THREE.Sprite(m); s.renderOrder = 7; return s;
}

// ═════════════════════════════════════════════ LANTERN ════════════════════════════════════════════════════════════
const PLEATS = 11, Y_TOP = 0.93, Y_BOT = -0.9, SQUASH = 0.92;
let _lanternTex = null;
function lanternTextures() {
  if (_lanternTex) return _lanternTex;
  const W = 256, H = 256;
  // albedo: paper fibre + darker rib lines (v along the lathe profile, bottom → top)
  const [c, g] = cvs(W, H), r = rng(41);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(150,110,60,${(0.04 + r() * 0.06).toFixed(3)})`; g.fillRect(r() * W, r() * H, 1 + r() * 8, 1); }
  for (let k = 0; k <= PLEATS; k++) { const y = H - (k / PLEATS) * H; g.fillStyle = 'rgba(110,70,35,0.55)'; g.fillRect(0, y - 1.5, W, 3); }
  for (let k = 0; k < 6; k++) { const x = (k / 6) * W + 10; g.fillStyle = 'rgba(140,90,40,0.12)'; g.fillRect(x, 0, 2, H); }   // faint seams
  const map = ctex(c);
  // emission: glow strongest a little below the equator (the flame sits low), ribs block light
  const [e, h] = cvs(W, H);
  const grd = h.createLinearGradient(0, H, 0, 0);
  grd.addColorStop(0, 'rgb(150,150,150)'); grd.addColorStop(0.38, 'rgb(255,255,255)'); grd.addColorStop(0.62, 'rgb(225,225,225)'); grd.addColorStop(1, 'rgb(95,95,95)');
  h.fillStyle = grd; h.fillRect(0, 0, W, H);
  for (let k = 0; k <= PLEATS; k++) { const y = H - (k / PLEATS) * H; h.fillStyle = 'rgba(30,20,10,0.75)'; h.fillRect(0, y - 2, W, 4); }
  for (let k = 0; k < 300; k++) { h.fillStyle = `rgba(0,0,0,${(r() * 0.12).toFixed(3)})`; h.fillRect(r() * W, r() * H, 2 + r() * 10, 1 + r() * 2); }
  const emap = ctex(e);
  _lanternTex = { map, emap };
  return _lanternTex;
}
function lanternGeometry() {
  const pts = [];
  const N = 66;
  for (let i = 0; i <= N; i++) {
    const y = lerp(Y_BOT, Y_TOP, i / N);
    const k = (i / N) * PLEATS;
    const base = Math.sqrt(Math.max(0, 1 - y * y));
    const bulge = 1 + 0.045 * Math.pow(Math.sin(Math.PI * k), 2) * smooth(base * 3);
    pts.push(new THREE.Vector2(base * bulge, y * SQUASH));
  }
  return new THREE.LatheGeometry(pts, 32);
}
const _tagCache = new Map();
/** wooden name-tag face texture (cached per text+style+colour). */
function tagTexture(text = '', style = 'paint', color) {
  const key = `${text}|${style}|${color}`;
  if (_tagCache.has(key)) return _tagCache.get(key);
  const W = 256, H = 152, [c, g] = cvs(W, H), r = rng(51 + text.length * 7 + (style === 'crayon' ? 3 : 0));
  woodBg(g, W, H, '#d2a46b', r, 0.16);
  g.strokeStyle = 'rgba(70,40,15,0.55)'; g.lineWidth = 6; roundRect(g, 3, 3, W - 6, H - 6, 18); g.stroke();
  g.fillStyle = '#2a1708'; g.beginPath(); g.arc(W / 2, 18, 7, 0, TAU); g.fill();                         // string hole
  if (text) {
    if (style === 'crayon') crayonText(g, text, W / 2, H / 2 + 10, { size: 86, maxW: W - 34, color: color || PROP_COLORS.crayonPink, r });
    else paintText(g, text, W / 2, H / 2 + 10, { size: 92, maxW: W - 40, color: color || '#2b1709', r });
  }
  const t = ctex(c);
  _tagCache.set(key, t);
  return t;
}

function parseLanternState(state) {
  if (state == null) return { lit: 0, fold: 0 };
  if (typeof state === 'string') return state === 'lit' ? { lit: 1, fold: 0 } : state === 'folded' ? { lit: 0, fold: 1 } : { lit: 0, fold: 0 };
  return null;
}
/** resolve a lantern state (string | object | event script) at time t → numbers. Pure. */
export function lanternStateAt(t, state, seed = 1) {
  const pre = parseLanternState(state);
  const o = { lit: 0, fold: 0, flare: 0, pulse: 0, smoke: null, swing: 0, tagSwing: 0 };
  if (pre) return Object.assign(o, pre);
  const s = state;
  if (s.initial !== undefined || s.events) {
    const init = parseLanternState(s.initial || 'lit');
    // channels: { from, to, at, dur, ease }
    const ch = { lit: { v: init.lit }, fold: { v: init.fold } };
    const valAt = (c, x) => (c.at == null ? c.v : lerp(c.from, c.to, c.ease(clamp((x - c.at) / c.dur, 0, 1))));
    const start = (name, to, at, dur, ez = smooth) => { const c = ch[name]; const from = valAt(c, at); ch[name] = { v: to, from, to, at, dur, ease: ez }; };
    const evs = [...(s.events || [])].filter((e) => e && e.at != null && e.at <= t).sort((a, b) => a.at - b.at);
    for (const e of evs) {
      const d = t - e.at;
      switch (e.do) {
        case 'light': start('fold', 0, e.at, 0.35, easeOutBack); start('lit', 1, e.at + 0.18, 0.12); o.flare += flareCurve(d - 0.2) * (e.amount ?? 1); break;
        case 'out': start('lit', 0, e.at, 0.2); start('fold', 1, e.at + 0.12, 0.45); o.smoke = d; break;
        case 'extinguish': start('lit', 0, e.at, 0.2); o.smoke = d; break;
        case 'fold': start('fold', 1, e.at, 0.45); break;
        case 'unfold': start('fold', 0, e.at, 0.35, easeOutBack); break;
        case 'on': start('lit', 1, e.at, 0.12); break;
        case 'off': start('lit', 0, e.at, 0.2); break;
        case 'flare': o.flare += flareCurve(d) * (e.amount ?? 1); break;
        case 'pulse': o.pulse += Math.max(0, Math.sin(Math.PI * clamp(d / 0.35, 0, 1))) * (e.amount ?? 1); break;
        case 'tap': o.swing += ring(t, e.at, 0.16 * (e.amount ?? 1), 0.9, 1.6); o.tagSwing += ring(t, e.at, 0.5 * (e.amount ?? 1), 1.5, 1.1, 0.4); break;
        default: break;
      }
    }
    o.lit = valAt(ch.lit, t); o.fold = valAt(ch.fold, t);
  }
  for (const k of ['lit', 'fold']) if (typeof s[k] === 'number') o[k] = s[k];
  for (const k of ['flare', 'pulse', 'swing', 'tagSwing']) if (typeof s[k] === 'number') o[k] += s[k];
  if (typeof s.smoke === 'number') o.smoke = s.smoke;
  o.lit = clamp(o.lit, 0, 1); o.fold = clamp(o.fold, 0, 1.2);
  return o;
}
function flareCurve(d) { if (d < 0) return 0; if (d < 0.06) return d / 0.06; return Math.exp(-(d - 0.06) * 5.5); }

export function makeLantern(opts = {}) {
  const o = { size: 0.26, cord: 0.15, tag: null, tagStyle: 'paint', tagColor: null, paper: '#f2dcb3', color: COLORS.lantern, glow: 1, hook: true, light: null, seed: 1, ...opts };
  const R = o.size / 2;
  const root = rootProp('lantern');
  const swingPivot = group('swing', root);
  const T = lanternTextures();
  const B = new Batch();
  B.add('plain', cy(0.0035, 0.0035, o.cord, 5), { pos: [0, -o.cord / 2, 0], color: '#2a2018' });
  if (o.hook) B.add('metal', new THREE.TorusGeometry(0.018, 0.004, 6, 12, Math.PI * 1.5), { pos: [0, -0.012, 0], rot: [0, Math.PI / 2, 0], color: '#3a3530' });
  B.build(swingPivot, { cast: false, name: 'lanternCord' });
  // globe: pivot at its top ring so folding collapses it UP against the cap
  const topY = R * SQUASH * Y_TOP, hg = R * SQUASH * (Y_TOP - Y_BOT);
  const foldPivot = group('fold', swingPivot); foldPivot.position.y = -o.cord;
  const paperCol = new THREE.Color(o.paper).offsetHSL((hash(o.seed * 3.3) - 0.5) * 0.02, 0, (hash(o.seed * 5.1) - 0.5) * 0.04);
  const paperMat = new THREE.MeshStandardMaterial({ color: paperCol, map: T.map, roughness: 0.88, side: THREE.DoubleSide, emissive: new THREE.Color(o.color).offsetHSL(-0.01, 0.25, -0.1), emissiveMap: T.emap, emissiveIntensity: 0 });
  const globe = new THREE.Mesh(lanternGeometry(), paperMat);
  globe.scale.setScalar(R); globe.position.y = -topY; globe.castShadow = false; globe.receiveShadow = true;
  foldPivot.add(globe);
  const capMat = kindMat('satin');
  const cap = new THREE.Mesh(prepGeom(cy(R * 0.3, R * 0.33, 0.022, 14)), capMat); cap.position.y = -o.cord - 0.004;
  cap.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cap.geometry.attributes.position.count * 3).fill(0.05), 3));
  swingPivot.add(cap);
  const bottom = new THREE.Mesh(prepGeom(new THREE.TorusGeometry(R * 0.36, 0.006, 6, 18).rotateX(Math.PI / 2)), capMat);
  bottom.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(bottom.geometry.attributes.position.count * 3).fill(0.05), 3));
  swingPivot.add(bottom);
  // halo / flare sprite + smoke wisps
  const halo = additiveSprite(glowTex(), o.color); halo.position.y = -o.cord - hg * 0.55; swingPivot.add(halo);
  const smokeMat = new THREE.SpriteMaterial({ map: smokeTex(), color: new THREE.Color('#c9c0b4'), transparent: true, depthWrite: false, opacity: 0 });
  const smoke = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(smokeMat.clone()); s.renderOrder = 6; s.visible = false; root.add(s); smoke.push(s); }
  // tag
  let tagPivot = null, tagMats = [];
  if (o.tag !== null && o.tag !== undefined) {
    tagPivot = group('tagPivot', swingPivot);
    const tw = 0.17, th = 0.1, td = 0.012, sl = 0.055;
    const TB = new Batch();
    for (const s of [-1, 1]) {
      const a = V3(s * tw * 0.32, -sl, 0), len = a.length();
      TB.add('plain', cy(0.0025, 0.0025, len, 4), { matrix: new THREE.Matrix4().compose(a.clone().multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), a.clone().normalize()), V3(1, 1, 1)), color: '#e9dcc2' });
    }
    TB.add('oak', rb(tw, th, td, 0.012), { pos: [0, -sl - th / 2 + 0.01, 0], color: '#d6a86c' });
    TB.build(tagPivot, { cast: false, name: 'tag' });
    const tex = tagTexture(o.tag, o.tagStyle, o.tagColor);
    for (const s of [1, -1]) {
      const m = texMesh(new THREE.PlaneGeometry(tw * 0.97, th * 0.95), tex, { rough: 0.8, emissive: 0.0001 });
      m.material.emissive.set(COLORS.lantern); m.position.set(0, -sl - th / 2 + 0.01, s * (td / 2 + 0.0008)); if (s < 0) m.rotation.y = Math.PI;
      tagPivot.add(m); tagMats.push(m.material);
    }
  }
  let light = null;
  if (o.light) { light = new THREE.PointLight(o.color, 0, o.light.distance ?? 3, 2); light.position.y = -o.cord - hg * 0.55; swingPivot.add(light); }
  const baseCol = paperCol.clone(), dark = paperCol.clone().multiplyScalar(0.55);
  const smokeSeed = o.seed * 1.37;
  root.userData = {
    ...root.userData, globe, tagPivot, halo, light, tagTexture,
    set(t, state) {
      const s = lanternStateAt(t, state, o.seed);
      const fold = s.fold, lit = s.lit;
      // geometry: fold collapses to a thin disc against the cap (radius 0.86)
      const sy = lerp(1, 0.06, clamp(fold, 0, 1)) + (fold > 1 ? 0 : 0), sxz = lerp(1, 0.86, clamp(fold, 0, 1));
      foldPivot.scale.set(sxz, Math.max(0.04, sy), sxz);
      const bottomY = -o.cord - hg * Math.max(0.04, sy);
      bottom.position.y = bottomY; bottom.scale.setScalar(lerp(1, 2.0, clamp(fold, 0, 1)));
      halo.position.y = -o.cord - hg * Math.max(0.04, sy) * 0.55;
      if (light) light.position.y = halo.position.y;
      if (tagPivot) {
        tagPivot.position.y = bottomY - 0.004; tagPivot.rotation.x = s.tagSwing + 0.03 * noise1(t * 0.9, o.seed + 7);
        // a folded lantern reads as NOTHING: the tag shrinks away over the last 10 % of the fold (0.9 → 1)
        const tk = 1 - smooth(clamp((fold - 0.9) / 0.1, 0, 1));
        tagPivot.scale.setScalar(Math.max(1e-4, tk)); tagPivot.visible = tk > 1e-3;
      }
      swingPivot.rotation.z = s.swing + 0.012 * noise1(t * 0.6, o.seed + 3);
      swingPivot.rotation.x = 0.4 * s.swing * Math.sin(1.3) + 0.008 * noise1(t * 0.5, o.seed + 9);
      // light
      const flick = 1 + 0.07 * noise1(t * 6.3, o.seed) + 0.04 * noise1(t * 17.1, o.seed + 3);
      const em = o.glow * (1.55 * lit * flick * (1 - 0.6 * clamp(fold, 0, 1)) + 3.2 * s.flare + 1.3 * s.pulse * lit);
      paperMat.emissiveIntensity = em;
      paperMat.color.copy(baseCol).lerp(dark, (1 - lit) * 0.5 + clamp(fold, 0, 1) * 0.3);
      const hk = 0.17 * lit * flick + 2.0 * s.flare + 0.5 * s.pulse * lit;
      halo.visible = hk > 0.003; halo.material.color.set(o.color).multiplyScalar(hk * o.glow);
      halo.scale.setScalar(o.size * (2.1 + 1.8 * s.flare));
      for (const m of tagMats) m.emissiveIntensity = 0.16 * lit * flick + 0.25 * s.flare;
      if (light) light.intensity = 2.5 * (o.light.intensity ?? 1) * (lit * flick + 1.5 * s.flare);
      // smoke wisp (2.4 s): 6 puffs rising from the cap, curling, growing, fading
      const age = s.smoke;
      smoke.forEach((sp_, i) => {
        const a = age == null ? -1 : age - i * 0.1;
        if (a < 0 || a > 2.4) { sp_.visible = false; return; }
        sp_.visible = true;
        const u = a / 2.4;
        const curl = Math.sin(a * 2.4 + i * 1.1 + smokeSeed) * 0.05 * (0.3 + a);
        sp_.position.set(curl + (hash(smokeSeed + i) - 0.5) * 0.04, -o.cord - hg * 0.3 + a * 0.32 + 0.02 * i, Math.cos(a * 1.9 + i) * 0.03 * a);
        sp_.scale.setScalar(o.size * (0.35 + 1.4 * u) * (0.8 + 0.4 * hash(smokeSeed * 3 + i)));
        sp_.material.opacity = 0.75 * smooth(a / 0.15) * Math.pow(1 - u, 1.3);
        sp_.material.rotation = a * 0.6 + i;
      });
      return s;
    },
  };
  root.userData.set(0, 'lit');
  return root;
}

export function makeLanternRow(opts = {}) {
  const o = { count: 5, pitch: 0.3, xs: null, tags: [], tagStyles: [], tagColors: [], light: false, lightIntensity: 1, lightDistance: 8,
    lightOffset: [0, -0.45, -0.6], beam: false, unlit: 'dark', ...opts };
  const root = rootProp('lanternRow');
  const lanterns = [];
  for (let i = 0; i < o.count; i++) {
    const L = makeLantern({ ...opts, tag: o.tags[i] === undefined ? null : o.tags[i], tagStyle: o.tagStyles[i] || o.tagStyle || 'paint', tagColor: o.tagColors[i] || o.tagColor || null, seed: (o.seed || 1) * 10 + i, light: null });
    L.position.x = o.xs ? o.xs[i] : ((o.count - 1) / 2 - i) * o.pitch;
    root.add(L); lanterns.push(L);
  }
  if (o.beam) {
    const B = new Batch(), len = (o.count + 1) * o.pitch + 0.4;
    B.add('oak', rb(len, 0.18, 0.16, 0.02), { pos: [0, 0.09 + 0.01, 0], color: '#6e4a2c' });
    for (const L of lanterns) B.add('metal', cy(0.006, 0.006, 0.03, 6), { pos: [L.position.x, 0.005, 0], color: '#3a3530' });
    B.build(root, { name: 'beam' });
  }
  let light = null;
  if (o.light) { light = new THREE.PointLight(COLORS.lantern, 0, o.lightDistance, 2); light.userData.offset = [o.lightOffset[0], o.lightOffset[1] - 0.27, o.lightOffset[2]]; light.position.set(...light.userData.offset); root.add(light); }
  root.userData.lanterns = lanterns; root.userData.light = light;
  root.userData.set = (t, state) => {
    let sum = 0;
    lanterns.forEach((L, i) => {
      let s;
      if (typeof state === 'number') s = i < state ? 'lit' : o.unlit;
      else if (Array.isArray(state)) s = state[i] == null ? o.unlit : state[i];
      else if (typeof state === 'function') s = state(i, t);
      else s = state == null ? 'lit' : state;
      const r = L.userData.set(t, s);
      sum += r.lit * (1 - 0.6 * clamp(r.fold, 0, 1)) + 1.5 * r.flare;
    });
    if (light) light.intensity = 8 * o.lightIntensity * sum / Math.max(1, o.count) * (1 + 0.05 * noise1(t * 5.1, 17));
  };
  root.userData.set(0, o.count);
  return root;
}

export function hangOnHooks(ctx, row, prefix = 'porch.hook', first = 0) {
  const p = new THREE.Vector3(), mean = new THREE.Vector3();
  row.updateMatrixWorld(true);
  const L = row.userData.lanterns;
  L.forEach((lan, i) => {
    const a = ctx.anchor(`${prefix}.${first + i}`);
    a.updateMatrixWorld(true); a.getWorldPosition(p);
    lan.position.copy(row.worldToLocal(p.clone()));
    mean.add(lan.position);
  });
  if (row.userData.light && L.length) {
    const off = row.userData.light.userData.offset || [0, -0.42, -0.35];
    row.userData.light.position.copy(mean.multiplyScalar(1 / L.length)).add(V3(...off));
  }
  return row;
}

// ═════════════════════════════════════════════ PARTICLES ══════════════════════════════════════════════════════════
export function makeDustBurst(opts = {}) {
  const o = { mode: 'puff', count: 160, size: [0.8, 0.05, 0.8], color: '#d9cbb2', intensity: 1, life: 1.6, spread: 0.6, seed: 3, pointSize: 0.018, ...opts };
  const r = rng(o.seed * 7.7 + 1);
  const seeds = new Float32Array(o.count * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = r();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(o.count * 3), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uAge: { value: -1 }, uLife: { value: o.life }, uBox: { value: V3(...o.size) }, uSpread: { value: o.spread }, uColor: { value: new THREE.Color(o.color) },
      uK: { value: o.intensity }, uSize: { value: o.pointSize }, uFall: { value: o.mode === 'fall' ? 1 : 0 } },
    vertexShader: `attribute vec4 aSeed; uniform float uAge, uLife, uSpread, uSize, uFall; uniform vec3 uBox; varying float vA;
      void main(){
        float delay = uFall > 0.5 ? aSeed.w * uLife * 0.6 : aSeed.w * 0.08;
        float a = uAge - delay;
        vec3 p0 = (aSeed.xyz - 0.5) * uBox;
        vec3 p;
        if (uFall > 0.5) {                       // sift down from the emitter: gravity-ish with drag + sideways drift
          float fallT = max(a, 0.0);
          p = p0 + vec3(sin(fallT * 2.0 + aSeed.x * 20.0) * 0.06 * fallT, -0.5 * 1.6 * fallT * fallT / (1.0 + fallT) - 0.15 * fallT, cos(fallT * 1.7 + aSeed.z * 20.0) * 0.06 * fallT);
        } else {                                 // puff: radial burst along the floor + lift, strong drag
          vec2 dir = normalize(vec2(aSeed.x - 0.5, aSeed.z - 0.5) + 1e-3);
          float d = uSpread * (1.0 - exp(-max(a, 0.0) * 3.5)) * (0.4 + aSeed.y);
          p = p0 + vec3(dir.x * d, (0.08 + 0.35 * aSeed.y) * (1.0 - exp(-max(a, 0.0) * 2.5)), dir.y * d);
        }
        float life = clamp(a / (uLife * (uFall > 0.5 ? 0.6 : 1.0)), 0.0, 1.0);
        vA = (a < 0.0 || a > uLife) ? 0.0 : smoothstep(0.0, 0.08, life) * (1.0 - life) * (0.45 + 0.55 * fract(aSeed.w * 13.7));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vA *= smoothstep(0.3, 1.0, -mv.z);
        gl_PointSize = clamp(uSize * 1400.0 / max(0.2, -mv.z), 1.0, 9.0);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uK; varying float vA;
      void main(){ vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.05, length(c)); if (vA * a < 0.003) discard; gl_FragColor = vec4(uColor * uK * vA * a, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 6; pts.visible = false;
  const root = rootProp('dust_' + o.mode);
  root.add(pts);
  root.userData.points = pts;
  root.userData.set = (t, s = {}) => {
    const at = s.at, age = at == null ? -1 : t - at;
    pts.visible = at != null && age >= 0 && age <= o.life * 1.7 && (s.on ?? 1) > 0;
    mat.uniforms.uAge.value = age; mat.uniforms.uK.value = o.intensity * (s.on ?? 1);
  };
  return root;
}

// ═════════════════════════════════════════════ WARDROBE ═══════════════════════════════════════════════════════════
export function makeWardrobe(opts = {}) {
  const o = { w: 1.2, h: 2.55, d: 0.62, color: PROP_COLORS.wardrobe, knob: PROP_COLORS.brass, ...opts };
  const { w, h, d } = o;
  const root = rootProp('wardrobe');
  const body = group('body', root);
  const col = new THREE.Color(o.color), dk = '#' + col.clone().multiplyScalar(0.72).getHexString(), lt = '#' + col.clone().lerp(new THREE.Color('#ffffff'), 0.12).getHexString();
  const B = new Batch();
  B.add('matte', rb(0.05, h - 0.14, d, 0.012), { pos: [-w / 2 + 0.025, 0.12 + (h - 0.14) / 2 - 0.02, d / 2], color: o.color });
  B.add('matte', rb(0.05, h - 0.14, d, 0.012), { pos: [w / 2 - 0.025, 0.12 + (h - 0.14) / 2 - 0.02, d / 2], color: o.color });
  B.add('matte', rb(w + 0.1, 0.07, d + 0.07, 0.015), { pos: [0, h - 0.035, d / 2 + 0.02], color: lt });           // crown
  B.add('matte', rb(w + 0.04, 0.05, d + 0.03, 0.012), { pos: [0, h - 0.095, d / 2 + 0.01], color: o.color });
  B.add('matte', rb(w, 0.12, d - 0.02, 0.012), { pos: [0, 0.06, d / 2], color: dk });                          // plinth
  B.add('matte', rb(w - 0.04, h - 0.2, 0.03, 0.01), { pos: [0, h / 2, 0.015], color: dk });                     // back
  B.add('plain', rb(w - 0.1, h - 0.3, 0.02, 0.005), { pos: [0, h / 2, d - 0.08], color: '#1a1c22' });           // dark interior face
  for (const sx of [-1, 1]) for (const sz of [0.06, d - 0.06]) B.add('oak', cy(0.03, 0.025, 0.05, 10), { pos: [sx * (w / 2 - 0.07), -0.0, sz], color: '#4a3020' });
  B.build(body, { name: 'wardrobe' });
  // doors (hinged on the outer edges)
  const doors = [];
  const dh = h - 0.28, dw = w / 2 - 0.035;
  for (const s of [-1, 1]) {
    const hinge = group('door', body); hinge.position.set(s * (w / 2 - 0.03), 0.14, d + 0.002);
    const D = new Batch();
    D.add('matte', rb(dw, dh, 0.035, 0.008), { pos: [-s * dw / 2, dh / 2, 0.0175], color: o.color });
    const ph = (dh - 0.32) / 3;
    for (let k = 0; k < 3; k++) {
      const py = 0.1 + ph / 2 + k * (ph + 0.06);
      D.add('matte', rb(dw - 0.14, ph, 0.02, 0.006), { pos: [-s * dw / 2, py, 0.04], color: lt });
      D.add('matte', rb(dw - 0.2, ph - 0.06, 0.012, 0.004), { pos: [-s * dw / 2, py, 0.052], color: o.color });
    }
    D.add('metal', sp(0.03, 12, 8), { pos: [-s * (dw - 0.07), dh * 0.52, 0.065], color: o.knob });
    D.add('metal', cy(0.012, 0.012, 0.03, 8), { pos: [-s * (dw - 0.07), dh * 0.52, 0.045], rot: [Math.PI / 2, 0, 0], color: o.knob });
    if (s > 0) D.add('metal', rb(0.014, 0.03, 0.004, 0.002), { pos: [-s * (dw - 0.07), dh * 0.52 - 0.07, 0.038], color: '#2a2418' });
    D.build(hinge, { name: 'wardrobeDoor' });
    doors.push({ hinge, s });
  }
  const dust = makeDustBurst({ mode: 'puff', count: 140, size: [w * 1.1, 0.04, 0.3], spread: 0.55, life: 1.4, seed: 5, color: '#cdbfa8', intensity: 0.8 });
  dust.position.set(0, 0.03, d * 0.3); root.add(dust);
  root.userData = {
    ...root.userData, body, dust, doors,
    set(t, s = {}) {
      const tilt = clamp(s.tilt ?? 0, 0, 1);
      const thud = sumRing(t, s.thudAt, 0.035, 3.2, 6.5);
      body.rotation.x = -Math.PI / 2 * tilt + thud * (tilt > 0.5 ? -1 : 1) + (s.wobble ?? 0);
      body.position.y = tilt > 0.5 ? Math.abs(thud) * 0.3 : 0;
      for (const dd of doors) dd.hinge.rotation.y = dd.s * (s.doors ?? 0) * 1.6;
      const lastThud = times(s.thudAt).filter((a) => a <= t).pop();
      dust.position.set(0, 0.03, tilt > 0.5 ? -h * 0.5 : d * 0.6);
      dust.userData.set(t, { at: lastThud });
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════ FAMILY PHOTO ═══════════════════════════════════════════════════════
/** paint one toy-block person (portrait). x = centre, headY = head centre, s = head width. */
function drawToyPerson(g, p) {
  const { x, headY: hy, s } = p;
  const bodyTop = hy + s * 0.52, bw = s * (p.bodyW || 1.15);
  // body + arms
  g.fillStyle = p.top; roundRect(g, x - bw / 2, bodyTop, bw, s * 2, s * 0.14); g.fill();
  g.fillStyle = p.topDark || 'rgba(0,0,0,0.18)'; roundRect(g, x - bw / 2 - s * 0.26, bodyTop + s * 0.06, s * 0.3, s * 1.2, s * 0.1); g.fill(); roundRect(g, x + bw / 2 - s * 0.04, bodyTop + s * 0.06, s * 0.3, s * 1.2, s * 0.1); g.fill();
  if (p.cardigan) { g.fillStyle = p.cardigan; g.fillRect(x - s * 0.12, bodyTop, s * 0.24, s * 2); }
  if (p.emblem === 'knight') { g.fillStyle = '#ffffff'; g.font = `900 ${Math.round(s * 0.5)}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♞', x, bodyTop + s * 0.42); }
  if (p.emblem === 'star') { g.fillStyle = '#ff8c1a'; g.beginPath(); for (let j = 0; j < 10; j++) { const a = j / 10 * TAU - Math.PI / 2, rr = j % 2 ? s * 0.1 : s * 0.24; g.lineTo(x + Math.cos(a) * rr, bodyTop + s * 0.4 + Math.sin(a) * rr); } g.fill(); }
  if (p.jumperRib) { g.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 0; k < 5; k++) g.fillRect(x - bw / 2, bodyTop + s * (0.25 + k * 0.22), bw, s * 0.05); }
  // neck shadow
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x - s * 0.22, bodyTop - s * 0.02, s * 0.44, s * 0.06);
  // hair behind
  if (p.hair === 'bun') { g.fillStyle = p.hairCol; g.beginPath(); g.ellipse(x, hy - s * 0.72, s * 0.3, s * 0.34, 0, 0, TAU); g.fill(); g.fillStyle = p.tie || '#f2c14e'; g.fillRect(x - s * 0.18, hy - s * 0.46, s * 0.36, s * 0.07); }
  if (p.hair === 'puffs') { g.fillStyle = p.hairCol; for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx * s * 0.42, hy - s * 0.42, s * 0.24, 0, TAU); g.fill(); } g.fillStyle = p.tie || '#ff5fa2'; for (const sx of [-1, 1]) g.fillRect(x + sx * s * 0.3 - s * 0.05, hy - s * 0.3, s * 0.1, s * 0.07); }
  // head
  g.fillStyle = p.skin; roundRect(g, x - s / 2, hy - s * 0.45, s, s * 0.92, s * 0.16); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.08)'; roundRect(g, x - s / 2, hy + s * 0.25, s, s * 0.22, s * 0.12); g.fill();
  // hair cap
  g.fillStyle = p.hairCol;
  if (p.hair === 'short' || p.hair === 'bun') { roundRect(g, x - s * 0.52, hy - s * 0.5, s * 1.04, s * 0.24, s * 0.12); g.fill(); g.fillRect(x - s * 0.52, hy - s * 0.4, s * 0.1, s * 0.3); g.fillRect(x + s * 0.42, hy - s * 0.4, s * 0.1, s * 0.3); }
  if (p.hair === 'fade') { roundRect(g, x - s * 0.5, hy - s * 0.5, s, s * 0.2, s * 0.1); g.fill(); }
  if (p.hair === 'puffs') { roundRect(g, x - s * 0.5, hy - s * 0.5, s, s * 0.16, s * 0.08); g.fill(); }
  // face
  const ey = hy - s * 0.02;
  g.fillStyle = '#1b1612';
  for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(x + sx * s * 0.17, ey, s * 0.055, s * 0.08, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#ffffff'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx * s * 0.17 + s * 0.02, ey - s * 0.03, s * 0.018, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(240,120,110,0.35)'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx * s * 0.28, ey + s * 0.14, s * 0.07, 0, TAU); g.fill(); }
  if (p.beard) { g.fillStyle = p.hairCol; roundRect(g, x - s * 0.46, hy + s * 0.12, s * 0.92, s * 0.34, s * 0.14); g.fill(); }
  g.strokeStyle = '#1b1612'; g.lineWidth = s * 0.045; g.lineCap = 'round';
  g.fillStyle = '#7a2e2a'; g.beginPath(); g.moveTo(x - s * 0.15, hy + s * 0.17); g.quadraticCurveTo(x, hy + s * 0.34, x + s * 0.15, hy + s * 0.17); g.closePath(); g.fill(); g.stroke();
  g.lineWidth = s * 0.035; g.beginPath(); g.moveTo(x - s * 0.26, ey - s * 0.14); g.lineTo(x - s * 0.1, ey - s * 0.16); g.moveTo(x + s * 0.1, ey - s * 0.16); g.lineTo(x + s * 0.26, ey - s * 0.14); g.stroke();
  if (p.glasses) { g.strokeStyle = '#151515'; g.lineWidth = s * 0.04; for (const sx of [-1, 1]) { roundRect(g, x + sx * s * 0.17 - s * 0.13, ey - s * 0.1, s * 0.26, s * 0.2, s * 0.05); g.stroke(); } g.beginPath(); g.moveTo(x - s * 0.04, ey - s * 0.02); g.lineTo(x + s * 0.04, ey - s * 0.02); g.stroke(); }
  if (p.headphones) {
    g.strokeStyle = '#2a2a30'; g.lineWidth = s * 0.09; g.beginPath(); g.arc(x, hy - s * 0.12, s * 0.58, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    for (const sx of [-1, 1]) { g.fillStyle = '#2a2a30'; roundRect(g, x + sx * s * 0.54 - s * 0.11, hy - s * 0.2, s * 0.22, s * 0.36, s * 0.08); g.fill(); g.fillStyle = '#f2f2f2'; roundRect(g, x + sx * s * 0.54 - s * 0.06, hy - s * 0.12, s * 0.12, s * 0.2, s * 0.05); g.fill(); }
  }
}
let _familyTex = null;
export function familyPortraitTexture() {
  if (_familyTex) return _familyTex;
  const W = 640, H = 500, [c, g] = cvs(W, H), r = rng(61);
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#f0c48a'); grd.addColorStop(0.6, '#c98d55'); grd.addColorStop(1, '#7d5232');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 16; k++) { const x = r() * W, y = r() * H * 0.6, rr = 18 + r() * 50; const gg = g.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, 'rgba(255,240,205,0.35)'); gg.addColorStop(1, 'rgba(255,240,205,0)'); g.fillStyle = gg; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
  const skin = '#f1c7a1';
  drawToyPerson(g, { x: 205, headY: 150, s: 120, skin, hair: 'short', hairCol: '#3a2618', top: '#d9a62e', topDark: '#b8871f', beard: true, glasses: true, bodyW: 1.45, jumperRib: true });
  drawToyPerson(g, { x: 440, headY: 165, s: 112, skin, hair: 'bun', hairCol: '#5a3424', tie: '#f2c14e', top: '#1f8f8a', topDark: '#17716d', cardigan: '#f3ecd8', bodyW: 1.05 });
  drawToyPerson(g, { x: 300, headY: 268, s: 104, skin, hair: 'fade', hairCol: '#2b1d14', top: '#1d1d22', topDark: '#111114', emblem: 'knight', headphones: true, bodyW: 1.2 });
  drawToyPerson(g, { x: 495, headY: 330, s: 84, skin, hair: 'puffs', hairCol: '#2b1a12', tie: '#ff5fa2', top: '#ffd23f', topDark: '#e0b520', emblem: 'star', bodyW: 1.1 });
  // print border + slight vignette
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,20,5,0.4)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#f6efe0'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14);
  _familyTex = ctex(c);
  return _familyTex;
}
export function makeFamilyPhoto(opts = {}) {
  const o = { w: 0.36, h: 0.28, frame: PROP_COLORS.brass, stand: true, lean: 0.17, ...opts };
  const { w, h } = o, fb = 0.035, fd = 0.03;
  const root = rootProp('familyPhoto');
  const pivot = group('pivot', root);             // bottom edge of the frame; leans back by o.lean
  const tilt = group('tilt', pivot); tilt.rotation.x = -o.lean;
  const B = new Batch();
  const cyF = h / 2 + fb;
  for (const [x, y, pw, ph] of [[0, h / 2 + fb / 2, w + fb * 2, fb], [0, -h / 2 - fb / 2, w + fb * 2, fb], [-w / 2 - fb / 2, 0, fb, h], [w / 2 + fb / 2, 0, fb, h]])
    B.add('metal', rb(pw, ph, fd, 0.008), { pos: [x, y + cyF, 0], color: o.frame });
  B.add('oak', rb(w + fb, h + fb, 0.01, 0.003), { pos: [0, cyF, -fd / 2 + 0.004], color: '#5a3a22' });
  B.build(tilt, { name: 'photoFrame' });
  const pic = texMesh(new THREE.PlaneGeometry(w, h), familyPortraitTexture(), { rough: 0.6 });
  pic.position.set(0, cyF, 0.004); tilt.add(pic);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.08, depthWrite: false }));
  glass.position.set(0, cyF, 0.011); glass.renderOrder = 2; tilt.add(glass);
  if (o.stand) {
    const S = new Batch();
    const len = (h + fb * 2) * 0.85;
    S.add('oak', rb(0.04, len, 0.012, 0.004), { pos: [0, len / 2 * Math.cos(0.45) - 0.0, -Math.sin(0.45) * len / 2 - 0.02], rot: [0.45, 0, 0], color: '#5a3a22' });
    S.build(pivot, { name: 'photoStand' });
  }
  root.userData = {
    ...root.userData, picture: pic,
    set(t, s = {}) {
      const r = (s.rattle ?? 0) + sumRing(t, s.rattleAt, 0.05, 7, 5) ;
      pivot.rotation.z = r; pivot.rotation.x = -Math.abs(r) * 0.4; pivot.position.y = Math.abs(sumRing(t, s.rattleAt, 0.006, 9, 6));
    },
  };
  return root;
}

// ═════════════════════════════════════════════ HALL TABLE ═════════════════════════════════════════════════════════
export function makeHallTable(opts = {}) {
  const o = { w: 1.2, d: 0.45, h: 1.0, lamp: true, lampShadow: true, lampHeight: 0.72, photo: true, clutter: true, wood: '#a0714a', ...opts };
  const { w, d, h } = o;
  const root = rootProp('hallTable');
  const B = new Batch();
  B.add('oak', rb(w, 0.05, d, 0.012), { pos: [0, h - 0.025, 0], color: o.wood });
  B.add('oak', rb(w - 0.08, 0.16, d - 0.06, 0.008), { pos: [0, h - 0.13, 0], color: '#8f6240' });
  B.add('oak', rb(w * 0.45, 0.12, 0.012, 0.004), { pos: [0, h - 0.13, d / 2 - 0.025], color: '#a57a52' });   // drawer front
  B.add('metal', sp(0.022, 10, 8), { pos: [0, h - 0.13, d / 2 - 0.005], color: PROP_COLORS.brass });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add('oak', cy(0.028, 0.02, h - 0.05, 10), { pos: [sx * (w / 2 - 0.05), (h - 0.05) / 2, sz * (d / 2 - 0.05)], color: '#7d5233' });
  B.add('oak', rb(w - 0.1, 0.03, d - 0.08, 0.006), { pos: [0, 0.2, 0], color: '#8f6240' });
  if (o.clutter) {
    const bookCols = ['#c0392b', '#2f6f8f', '#e8b04b', '#3c7a5a', '#6b4a7a'];
    for (let k = 0; k < 5; k++) B.add('satin', rb(0.07 + (k % 2) * 0.02, 0.2 + hash(k) * 0.08, 0.26, 0.008), { pos: [0.15 + k * 0.085, 0.215 + (0.2 + hash(k) * 0.08) / 2, -0.02], rot: [0, 0, k === 4 ? -0.3 : 0], color: bookCols[k] });
    B.add('satin', rb(0.32, 0.06, 0.24, 0.01), { pos: [-0.3, 0.245, 0], color: '#d8c8a8' });                   // basket
    B.add('gloss', sp(0.11, 18, 8).scale(1, 0.35, 1), { pos: [0.08, h + 0.03, 0.05], color: '#d7c7a8' });          // key bowl
    B.add('metal', rb(0.07, 0.012, 0.025, 0.004), { pos: [0.08, h + 0.055, 0.05], rot: [0, 0.6, 0.1], color: '#c9c9c9' });
    B.add('metal', new THREE.TorusGeometry(0.022, 0.005, 6, 12), { pos: [0.11, h + 0.05, 0.04], rot: [Math.PI / 2, 0, 0], color: '#d9b45a' });
    for (let k = 0; k < 3; k++) B.add('paper', rb(0.2, 0.004, 0.13, 0.001), { pos: [0.42 - k * 0.01, h + 0.004 + k * 0.004, 0.08 + k * 0.01], rot: [0, 0.15 * k - 0.1, 0], color: ['#f4efe3', '#e9e2cf', '#f7f1d8'][k] });
  }
  B.build(root, { name: 'hallTable' });
  let lamp = null, photo = null;
  if (o.lamp) { lamp = makeLamp({ height: o.lampHeight, shadow: o.lampShadow }); lamp.root.position.set(-w / 2 + 0.24, h, -0.04); root.add(lamp.root); }
  if (o.photo) { photo = makeFamilyPhoto(); photo.position.set(w / 2 - 0.3, h, -0.04); photo.rotation.y = -0.22; root.add(photo); }
  root.userData = {
    ...root.userData, lamp, photo, top: h,
    set(t, s = {}) {
      if (lamp) {
        lamp.setOn(s.lamp ?? 1);
        const wob = sumRing(t, s.bumpAt, 0.09, 2.6, 3.2) + (s.wobble ?? 0);
        lamp.root.rotation.z = wob; lamp.root.rotation.x = wob * 0.4;
      }
      if (photo) photo.userData.set(t, { rattleAt: s.bumpAt });
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════ SHOES / DOORMAT / COATS ═════════════════════════════════════════════
let _stickerTex = null;
function knightSticker() {
  if (_stickerTex) return _stickerTex;
  const [c, g] = cvs(128, 128);
  g.fillStyle = '#f6f6f2'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill();
  g.fillStyle = '#16161a'; g.font = `900 92px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♞', 64, 70);
  _stickerTex = ctex(c);
  return _stickerTex;
}
export function makeShoePair(kind = 'boots') {
  const root = rootProp('shoes_' + kind);
  const shoes = [];
  const K = {
    boots: { l: 0.36, w: 0.16, sole: '#2a1d14', up: '#6b4428', shaft: 0.24, kind: 'oak', sep: 0.095 },
    flats: { l: 0.29, w: 0.125, sole: '#3a2a22', up: PROP_COLORS.mom, shaft: 0, kind: 'gloss', sep: 0.08 },
    wellies: { l: 0.32, w: 0.15, sole: '#101012', up: '#1a1a1e', shaft: 0.36, kind: 'gloss', sep: 0.09, sticker: true },
    pipWellies: { l: 0.2, w: 0.1, sole: '#c99a10', up: '#ffcf2a', shaft: 0.21, kind: 'gloss', sep: 0.06 },
    sneakers: { l: 0.33, w: 0.15, sole: '#ffffff', up: '#f2f2f2', shaft: 0, kind: 'satin', sep: 0.09 },
  }[kind];
  if (!K) throw new Error(`makeShoePair: unknown kind ${kind}`);
  for (const s of [-1, 1]) {
    const shoe = group('shoe', root); shoe.position.set(s * K.sep, 0, s * 0.015); shoe.rotation.y = s * 0.07;
    const B = new Batch();
    B.add('rubber', rb(K.w, 0.035, K.l, 0.015), { pos: [0, 0.0175, 0], color: K.sole });
    B.add(K.kind === 'oak' ? 'satin' : K.kind, rb(K.w * 0.94, 0.07, K.l * 0.8, 0.03), { pos: [0, 0.07, K.l * 0.06], color: K.up });
    B.add(K.kind === 'oak' ? 'satin' : K.kind, sp(K.w * 0.47, 14, 8).scale(1, 0.75, 1.1), { pos: [0, 0.05, K.l * 0.3], color: K.up });
    if (K.shaft) B.add(K.kind === 'oak' ? 'satin' : K.kind, rb(K.w * 0.9, K.shaft, K.w * 1.05, 0.025), { pos: [0, 0.035 + K.shaft / 2, -K.l * 0.22], color: K.up });
    if (kind === 'boots') { for (let k = 0; k < 4; k++) B.add('plain', rb(K.w * 0.5, 0.008, 0.012, 0.003), { pos: [0, 0.11 + k * 0.045, -K.l * 0.22 + K.w * 0.53], color: '#d9c7a0' }); B.add('rubber', rb(K.w * 0.96, 0.03, K.w * 1.08, 0.01), { pos: [0, 0.035 + K.shaft, -K.l * 0.22], color: '#4a3020' }); }
    if (kind === 'flats') B.add('satin', rb(K.w * 0.5, 0.01, 0.03, 0.004), { pos: [0, 0.105, K.l * 0.18], color: '#f3ecd8' });
    if (kind === 'sneakers') { B.add('plain', rb(K.w * 0.7, 0.012, 0.02, 0.004), { pos: [0, 0.108, K.l * 0.05], color: '#cccccc' }); B.add('rubber', rb(K.w * 1.01, 0.02, K.l * 1.01, 0.008), { pos: [0, 0.03, 0], color: '#dcdcdc' }); }
    if (kind === 'wellies' || kind === 'pipWellies') B.add(K.kind, rb(K.w * 0.95, 0.035, K.w * 1.1, 0.012), { pos: [0, 0.035 + K.shaft - 0.01, -K.l * 0.22], color: kind === 'wellies' ? '#2a2a30' : '#f2b500' });
    B.build(shoe, { name: 'shoe' });
    if (K.sticker) {
      const st = texMesh(new THREE.CircleGeometry(0.045, 20), knightSticker(), { rough: 0.5 });
      st.position.set(s * (K.w * 0.45 + 0.002), 0.035 + K.shaft * 0.6, -K.l * 0.22); st.rotation.y = s * Math.PI / 2; shoe.add(st);
    }
    shoes.push(shoe);
  }
  root.userData.shoes = shoes; root.userData.len = K.l;
  return root;
}
export function makeDoormat(opts = {}) {
  const o = { w: 1.3, d: 0.8, shoes: true, border: '#4a3020', ...opts };
  const root = rootProp('doormat');
  const B = new Batch();
  B.add('coir', rb(o.w, 0.022, o.d, 0.008), { pos: [0, 0.011, 0], color: '#c79a5e' });
  for (const [x, z, w, d] of [[0, o.d / 2 - 0.04, o.w - 0.04, 0.05], [0, -o.d / 2 + 0.04, o.w - 0.04, 0.05], [o.w / 2 - 0.04, 0, 0.05, o.d - 0.04], [-o.w / 2 + 0.04, 0, 0.05, o.d - 0.04]])
    B.add('coir', rb(w, 0.006, d, 0.002), { pos: [x, 0.023, z], color: o.border });
  B.build(root, { name: 'doormat', cast: false });
  const pairs = [];
  if (o.shoes) {
    [['boots', -0.42], ['flats', -0.13], ['wellies', 0.15], ['pipWellies', 0.42]].forEach(([k, x], i) => {
      const p = makeShoePair(k); p.position.set(x * (o.w / 1.3), 0.022, 0); root.add(p); pairs.push(p);
    });
  }
  const rest = pairs.map((p) => p.userData.shoes.map((s) => ({ p: s.position.clone(), ry: s.rotation.y })));
  root.userData = {
    ...root.userData, shoes: pairs,
    set(t, s = {}) {
      let u = s.scatter ?? 0;
      if (s.scatterAt != null) u = Math.max(u, clamp((t - s.scatterAt) / 0.6, 0, 1));
      const kick = s.kickX ?? -1;
      pairs.forEach((p, i) => p.userData.shoes.forEach((sh, j) => {
        const r0 = rest[i][j], h1 = hash(i * 7.3 + j * 3.1 + 1), h2 = hash(i * 5.7 + j * 9.1 + 2);
        const e = 1 - Math.pow(1 - u, 2.2);
        const dist = (0.35 + h1 * 0.7) * e * (1 - i * 0.08);
        sh.position.set(r0.p.x + kick * dist * (0.6 + h2 * 0.6) * -1 * (i < 2 ? -1 : 1) * 0.6 + (h2 - 0.5) * 0.4 * e, Math.sin(Math.PI * clamp(u * 1.6 - h1 * 0.3, 0, 1)) * 0.12 * (1 - u * 0.5), r0.p.z + (h1 - 0.4) * 0.6 * e);
        sh.rotation.set(0, r0.ry + (h2 - 0.5) * 5 * e, (h1 > 0.45 ? 1.45 : 0.2) * smooth(u * 1.3 - 0.2) * (h2 > 0.5 ? 1 : -1));
        if (Math.abs(sh.rotation.z) > 1) sh.position.y += 0.06 * smooth(u * 1.3 - 0.2);
      }));
    },
  };
  return root;
}
export function makeCoatHooks(opts = {}) {
  const o = { count: 4, pitch: 0.3, coats: true, ...opts };
  const root = rootProp('coatHooks');
  const len = o.count * o.pitch + 0.2;
  const B = new Batch();
  B.add('oak', rb(len, 0.14, 0.035, 0.008), { pos: [0, 0.02, 0.0175], color: '#8a5e3a' });
  const xs = [];
  for (let i = 0; i < o.count; i++) {
    const x = ((o.count - 1) / 2 - i) * o.pitch; xs.push(x);
    B.add('metal', cy(0.012, 0.012, 0.09, 8), { pos: [x, 0.0, 0.07], rot: [Math.PI / 2 - 0.35, 0, 0], color: PROP_COLORS.brass });
    B.add('metal', sp(0.018, 10, 8), { pos: [x, 0.016, 0.11], color: PROP_COLORS.brass });
  }
  B.build(root, { name: 'coatRail' });
  const coats = [];
  if (o.coats) {
    const defs = [['#6e4a2c', 1.1, 0.5, 'dad'], [PROP_COLORS.mom, 1.0, 0.44, 'mom'], ['#1d1d22', 0.9, 0.44, 'me'], ['#ffcf2a', 0.64, 0.33, 'pip']];
    defs.slice(0, o.count).forEach(([col, L, W, who], i) => {
      const piv = group('coat_' + who, root); piv.position.set(xs[i], 0.0, 0.1);
      const C = new Batch();
      const body = new THREE.BoxGeometry(W, L, 0.17, 3, 8, 2);
      const P = body.attributes.position;
      for (let k = 0; k < P.count; k++) { const v = clamp(P.getY(k) / L + 0.5, 0, 1); const sc = v > 0.82 ? lerp(1, 0.55, (v - 0.82) / 0.18) : lerp(1.08, 1, v / 0.82); P.setX(k, P.getX(k) * sc); P.setZ(k, P.getZ(k) * lerp(1.1, 0.7, Math.pow(v, 2))); }
      body.computeVertexNormals();
      C.add('knit', body, { pos: [0, -L / 2 + 0.04, 0.02], color: col });
      for (const s of [-1, 1]) C.add('knit', rb(0.12, L * 0.7, 0.14, 0.04), { pos: [s * (W / 2 + 0.02), -L * 0.36, 0.03], rot: [0, 0, s * 0.06], color: col });
      C.add('knit', rb(W * 0.6, 0.15, 0.2, 0.06), { pos: [0, 0.0, -0.01], color: col });                      // hood bunched on the hook
      if (who === 'pip') C.add('gloss', rb(W * 1.02, 0.04, 0.18, 0.01), { pos: [0, -L + 0.06, 0.02], color: '#f2b500' });
      if (who === 'dad') for (let k = 0; k < 4; k++) C.add('plain', cy(0.018, 0.018, 0.012, 8), { pos: [0.03, -0.25 - k * 0.18, 0.12], rot: [Math.PI / 2, 0, 0], color: '#3a2618' });
      C.build(piv, { name: 'coat' });
      if (who === 'me') { const st = texMesh(new THREE.CircleGeometry(0.07, 20), knightSticker(), { rough: 0.8 }); st.position.set(0, -0.3, 0.115); piv.add(st); }
      coats.push(piv);
    });
  }
  root.userData = {
    ...root.userData, coats,
    set(t, s = {}) {
      coats.forEach((c, i) => {
        const sw = sumRing(t, s.swayAt, 0.07 * (1 - i * 0.1), 1.1 + i * 0.12, 1.6, i);
        const part = s.part && s.part.i === i ? smooth(s.part.amount ?? 1) : 0;
        c.rotation.set(-0.05 - part * 0.35 + sw * 0.4, 0, sw + part * 0.5 * (s.part?.dir ?? 1) + 0.01 * noise1(t * 0.4, i));
      });
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════ TORCH ══════════════════════════════════════════════════════════════
const BEAM_V = `varying vec3 vP; varying vec3 vN; varying vec3 vV; varying float vCam;
void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vCam = -mv.z; gl_Position = projectionMatrix * mv; }`;
const BEAM_F = `uniform vec3 uColor; uniform float uK, uLen, uTime; uniform sampler2D tNoise; varying vec3 vP; varying vec3 vN; varying vec3 vV; varying float vCam;
void main(){
  float z = clamp(vP.z / uLen, 0.0, 1.0);
  float core = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);           // chord length through the cone
  float fall = pow(1.0 - z, 1.8) * smoothstep(0.0, 0.12, z);
  float n = texture2D(tNoise, vec2(vP.x * 0.8 + vP.z * 0.13, vP.y * 0.8 - uTime * 0.02)).r;
  float nearFade = smoothstep(0.35, 1.6, vCam);
  gl_FragColor = vec4(uColor * uK * core * fall * (0.7 + 0.6 * n) * nearFade, 1.0);
}`;
export function makeTorchProp(opts = {}) {
  const o = { shadow: true, angle: 0.36, reach: 14, intensity: 1, beam: 0.12, beamLength: 3.2, color: COLORS.torch, ...opts };
  const root = rootProp('torch');
  const B = new Batch();
  B.add('rubber', cy(0.04, 0.037, 0.22, 16).rotateX(Math.PI / 2), { pos: [0, 0, -0.05], color: '#22252c' });
  for (let k = 0; k < 6; k++) B.add('rubber', cy(0.042, 0.042, 0.012, 16).rotateX(Math.PI / 2), { pos: [0, 0, -0.13 + k * 0.03], color: '#15171c' });
  B.add('brushed', cy(0.068, 0.042, 0.09, 18).rotateX(Math.PI / 2), { pos: [0, 0, 0.105], color: '#b9bcc2' });
  B.add('brushed', new THREE.TorusGeometry(0.066, 0.008, 6, 20), { pos: [0, 0, 0.15], color: '#d9dce2' });
  B.add('rubber', rb(0.025, 0.018, 0.04, 0.006), { pos: [0, 0.042, 0.0], color: '#d84a2c' });            // switch
  B.add('metal', new THREE.TorusGeometry(0.014, 0.003, 5, 10), { pos: [0, 0, -0.165], color: '#8a8a8a' });
  B.build(root, { name: 'torch', cast: false });
  const lensMat = new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color(o.color), emissiveIntensity: 0, roughness: 0.2 });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.062, 20), lensMat); lens.position.z = 0.151; root.add(lens);
  const spot = new THREE.SpotLight(o.color, 0, o.reach, o.angle, 0.6, 1);   // decay 1 like look.makeTorch (no near blow-out)
  spot.position.set(0, 0, 0.16);
  const tgt = new THREE.Object3D(); tgt.position.set(0, 0, 3); root.add(tgt); spot.target = tgt;
  if (o.shadow) tuneShadow(spot, { mapSize: 1024, radius: 3, near: 0.3, far: o.reach });
  root.add(spot);
  let beamMesh = null, beamU = null;
  if (o.beam > 0) {
    const L = o.beamLength, wide = Math.tan(o.angle) * L * 0.9;
    const g = cy(wide, 0.06, L, 28, true).rotateX(Math.PI / 2).translate(0, 0, L / 2 + 0.15);
    beamU = { uColor: { value: new THREE.Color(o.color) }, uK: { value: 0 }, uLen: { value: L + 0.15 }, uTime: { value: 0 }, tNoise: { value: getNoiseTex(4, 256) } };
    beamMesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: beamU, vertexShader: BEAM_V, fragmentShader: BEAM_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beamMesh.renderOrder = 5; beamMesh.castShadow = false; beamMesh.receiveShadow = false; beamMesh.frustumCulled = false;
    root.add(beamMesh);
  }
  const _m = new THREE.Matrix4();
  const setOn = (v, beamK = o.beam) => {
    v = clamp(v, 0, 1.5);
    spot.intensity = 8 * o.intensity * v; lensMat.emissiveIntensity = 2.2 * v;
    if (beamU) { beamU.uK.value = beamK * v; beamMesh.visible = v > 0.001 && beamK > 0; }
  };
  root.userData = {
    ...root.userData, spot, lens, beamMesh, target: tgt, setOn,
    aim(from, to) {
      const f = from.isVector3 ? from : V3(...from), tt = to.isVector3 ? to : V3(...to);
      root.position.copy(f);
      _m.lookAt(tt, f, V3(0, 1, 0));
      root.quaternion.setFromRotationMatrix(_m);
      if (root.parent) { root.parent.updateMatrixWorld(true); const pq = root.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); root.quaternion.premultiply(pq); root.position.copy(root.parent.worldToLocal(f.clone())); }
    },
    set(t, s = {}) {
      let on = s.on ?? 1;
      if (s.onAt != null) { const d = t - s.onAt; on = d < 0 ? 0 : d < 0.034 ? 1 : d < 0.067 ? 0.25 : on; }
      if (s.offAt != null && t >= s.offAt) on = 0;
      if (s.flicker) on *= 1 - s.flicker * clamp(0.5 + 0.8 * noise1(t * 14, 5), 0, 1);
      if (s.dead) on = 0;
      if (beamU) beamU.uTime.value = t;
      setOn(on, s.beam ?? o.beam);
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════ STOOL / BROOM / PAN / SCREWDRIVER ══════════════════════════════════
export function makeStool(opts = {}) {
  const o = { h: 0.62, w: 0.48, top: PROP_COLORS.wood, legs: '#f1ece0', ...opts };
  const { h, w } = o;
  const root = rootProp('stool');
  const pivot = group('tipPivot', root); pivot.position.x = w / 2;
  const body = group('body', pivot); body.position.x = -w / 2;
  const B = new Batch();
  B.add('oak', rb(w, 0.05, 0.38, 0.012), { pos: [0, h - 0.025, -0.02], color: o.top });
  B.add('oak', rb(w - 0.06, 0.045, 0.24, 0.01), { pos: [0, h * 0.48, 0.25], color: o.top });
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.035);
    const leg = (z0, z1, y1) => { const a = V3(x, 0, z0), b = V3(x, y1, z1), m = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a); B.add('paint', rb(0.045, dir.length(), 0.05, 0.01), { matrix: new THREE.Matrix4().compose(m, new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.normalize()), V3(1, 1, 1)), color: o.legs }); };
    leg(-0.26, -0.17, h - 0.05); leg(0.4, 0.12, h - 0.05);
    B.add('paint', rb(0.04, 0.04, 0.6, 0.008), { pos: [x, h * 0.2, 0.06], color: o.legs });
    B.add('rubber', rb(0.05, 0.02, 0.06, 0.006), { pos: [x, 0.01, -0.26], color: '#333' }); B.add('rubber', rb(0.05, 0.02, 0.06, 0.006), { pos: [x, 0.01, 0.4], color: '#333' });
  }
  B.add('plain', rb(0.3, 0.004, 0.2, 0.002), { pos: [0, h + 0.002, -0.02], color: '#d9b98e' });            // worn patch
  B.build(body, { name: 'stool' });
  root.userData = {
    ...root.userData, body, topY: h, stepY: h * 0.48,
    set(t, s = {}) {
      let tip = s.tip ?? 0;
      if (s.tipAt != null) tip = Math.max(tip, bounceOut((t - s.tipAt) / 0.45));
      pivot.rotation.z = -Math.PI / 2 * tip;
    },
  };
  return root;
}
/**
 * makeStepLadder({ h = 1.35 (top step height, m), w = 0.62, steps = 4, color, rail }) → root
 * A-frame step ladder for the attic beats (see the HATCH REACH table in src/kits/home.js): the character climbs with
 * pose('stepUp', t, { height: userData.stepY[0], dist }) step by step, then stands at userData.topY (re-place the root
 * there). Origin = floor under the centre of the top platform; climbing side faces +Z (front legs at z +0.3·h).
 * userData: { topY, stepY: [heights of the treads, lowest first], set(t, { wobble }) }.
 */
export function makeStepLadder(opts = {}) {
  const o = { h: 1.35, w: 0.62, steps: 4, color: '#d9dde2', rail: '#e0533d', ...opts };
  const { h, w } = o;
  const root = rootProp('stepLadder');
  const body = group('body', root);
  const B = new Batch();
  const fz = 0.3 * h, bz = -0.28 * h;                                  // feet of the front (climbing) and back legs
  const leg = (x, z0) => { const a = V3(x, 0, z0), b = V3(x, h, 0), m = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a);
    B.add('metal', rb(0.05, dir.length(), 0.035, 0.01), { matrix: new THREE.Matrix4().compose(m, new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.normalize()), V3(1, 1, 1)), color: o.color }); };
  for (const sx of [-1, 1]) { leg(sx * (w / 2 - 0.03), fz); leg(sx * (w / 2 - 0.05), bz); B.add('rubber', rb(0.07, 0.03, 0.06, 0.008), { pos: [sx * (w / 2 - 0.03), 0.015, fz], color: '#333' }); B.add('rubber', rb(0.07, 0.03, 0.06, 0.008), { pos: [sx * (w / 2 - 0.05), 0.015, bz], color: '#333' }); }
  const stepY = [];
  for (let k = 1; k <= o.steps; k++) {
    const y = h * k / (o.steps + 1) + (k === o.steps ? 0 : 0), z = fz * (1 - y / h);
    stepY.push(y);
    B.add('oak', rb(w - 0.04, 0.035, 0.16, 0.008), { pos: [0, y - 0.018, z], color: '#c99b62' });
  }
  B.add('oak', rb(w + 0.02, 0.05, 0.36, 0.012), { pos: [0, h - 0.025, -0.02], color: '#c99b62' });            // top platform
  for (const sx of [-1, 1]) B.add('paint', rb(0.03, 0.03, 0.42, 0.01), { pos: [sx * (w / 2 + 0.01), h + 0.35, -0.04], color: o.rail });
  B.add('paint', rb(w + 0.05, 0.035, 0.035, 0.01), { pos: [0, h + 0.55, -0.12], color: o.rail });               // safety rail
  for (const sx of [-1, 1]) B.add('paint', rb(0.03, 0.6, 0.03, 0.01), { pos: [sx * (w / 2 + 0.01), h + 0.27, -0.12], color: o.rail });
  B.build(body, { name: 'stepLadder' });
  root.userData = {
    ...root.userData, body, topY: h, stepY,
    set(t, st = {}) { body.rotation.z = (st.wobble ?? 0) * 0.04 * Math.sin(t * 13); },
  };
  return root;
}
export function makeBroom(opts = {}) {
  const o = { length: 1.8, ...opts };
  const L = o.length;
  const root = rootProp('broom');
  const B = new Batch();
  B.add('gloss', cy(0.019, 0.019, L - 0.3, 10), { pos: [0, 0.3 + (L - 0.3) / 2, 0], color: '#3f7d45' });
  B.add('rubber', cy(0.024, 0.024, 0.08, 10), { pos: [0, L - 0.04, 0], color: '#e8e8e8' });
  B.add('metal', cy(0.03, 0.035, 0.08, 12), { pos: [0, 0.3, 0], color: '#c9c9c9' });
  const head = new THREE.BoxGeometry(0.34, 0.3, 0.09, 6, 6, 2);
  const P = head.attributes.position;
  for (let k = 0; k < P.count; k++) { const v = P.getY(k) / 0.3 + 0.5; P.setX(k, P.getX(k) * lerp(1.25, 0.45, v)); P.setZ(k, P.getZ(k) * lerp(1.3, 0.8, v)); }
  head.computeVertexNormals();
  B.add('fur', head, { pos: [0, 0.15, 0], color: '#d9b45a' });
  B.add('plain', rb(0.22, 0.03, 0.1, 0.01), { pos: [0, 0.24, 0], color: '#c0392b' });
  B.build(root, { name: 'broom' });
  root.userData.gripY = L - 0.25;
  return root;
}
export function makeFryingPan(opts = {}) {
  const o = { r: 0.2, ...opts };
  const root = rootProp('fryingPan');
  const B = new Batch();
  const pz = 0.14 + o.r;
  B.add('metal', cy(o.r, o.r * 0.86, 0.06, 28), { pos: [0, 0.03 - 0.04, pz], color: '#2b2d31' });
  B.add('gloss', cy(o.r * 0.9, o.r * 0.9, 0.004, 28), { pos: [0, 0.0, pz], color: '#121316' });
  B.add('rubber', rb(0.05, 0.035, 0.28, 0.015), { pos: [0, 0.01, -0.0], color: '#1a1a1c' });
  B.add('metal', rb(0.04, 0.02, 0.06, 0.006), { pos: [0, 0.0, 0.14], color: '#8f9399' });
  B.add('metal', new THREE.TorusGeometry(0.014, 0.004, 5, 10), { pos: [0, 0.01, -0.13], rot: [Math.PI / 2, 0, 0], color: '#8f9399' });
  B.build(root, { name: 'pan' });
  return root;
}
export function makeScrewdriver() {
  const root = rootProp('screwdriver');
  const B = new Batch();
  B.add('gloss', cy(0.026, 0.03, 0.13, 12).rotateX(Math.PI / 2), { pos: [0, 0, -0.01], color: '#f2c21b' });
  for (let k = 0; k < 4; k++) B.add('rubber', rb(0.012, 0.062, 0.1, 0.004), { pos: [0, 0, -0.01], rot: [0, 0, k * Math.PI / 4], color: '#15161a' });
  B.add('metal', cy(0.0075, 0.0075, 0.17, 8).rotateX(Math.PI / 2), { pos: [0, 0, 0.14], color: '#c9ccd2' });
  B.add('metal', rb(0.016, 0.004, 0.02, 0.001), { pos: [0, 0, 0.23], color: '#c9ccd2' });
  B.build(root, { name: 'screwdriver', cast: false });
  return root;
}

// ═════════════════════════════════════════════ ATTIC ══════════════════════════════════════════════════════════════
function markerLabelTex(text, { w = 512, h = 256, color = '#1a1a1a', paper = '#f3efe2', r = rng(71), tape = true } = {}) {
  const [c, g] = cvs(w, h);
  g.clearRect(0, 0, w, h);
  if (paper) { g.save(); g.translate(w / 2, h / 2); g.rotate((r() - 0.5) * 0.05); g.fillStyle = paper; g.fillRect(-w * 0.46, -h * 0.4, w * 0.92, h * 0.8); g.restore(); }
  if (tape) { g.fillStyle = 'rgba(235,225,190,0.85)'; g.save(); g.translate(w * 0.12, h * 0.14); g.rotate(-0.5); g.fillRect(-40, -12, 80, 24); g.restore(); g.save(); g.translate(w * 0.88, h * 0.86); g.rotate(-0.5); g.fillRect(-40, -12, 80, 24); g.restore(); }
  paintText(g, text, w / 2, h / 2, { size: h * 0.5, maxW: w * 0.8, color, r, weight: '700', jitter: 0.04 });
  return ctex(c);
}
export function makeCardboardBox(opts = {}) {
  const o = { w: 0.7, h: 0.5, d: 0.5, label: '', labelStyle: 'marker', flaps: 0, tape: true, dusty: 0.3, seed: 1, ...opts };
  const { w, h, d } = o;
  const root = rootProp('box');
  const col = new THREE.Color('#ffffff').lerp(new THREE.Color('#d8d4cc'), o.dusty);
  const B = new Batch();
  B.add('card', rb(w, h - 0.01, d, 0.008), { pos: [0, (h - 0.01) / 2, 0], color: '#' + col.getHexString() });
  if (o.tape) B.add('satin', rb(0.07, 0.15, 0.004, 0.001), { pos: [0, h - 0.07, d / 2 + 0.001], color: '#c9a46a' });
  B.build(root, { name: 'box' });
  const flaps = [];
  for (const [ax, sgn, len, span] of [['z', 1, d / 2, w], ['z', -1, d / 2, w], ['x', 1, w / 2, d], ['x', -1, w / 2, d]]) {
    const hinge = group('flap', root);
    hinge.position.set(ax === 'x' ? sgn * w / 2 : 0, h - 0.005, ax === 'z' ? sgn * d / 2 : 0);
    const F = new Batch();
    const geo = ax === 'z' ? rb(span - 0.01, 0.006, len, 0.002) : rb(len, 0.006, span - 0.01, 0.002);
    F.add('card', geo, { pos: ax === 'z' ? [0, 0, -sgn * len / 2] : [-sgn * len / 2, 0, 0], color: '#' + col.clone().multiplyScalar(ax === 'z' ? 1 : 0.95).getHexString() });
    if (o.tape && ax === 'z') F.add('satin', rb(0.07, 0.002, len, 0.001), { pos: [0, 0.004, -sgn * len / 2], color: '#c9a46a' });
    F.build(hinge, { name: 'flap' });
    flaps.push({ hinge, ax, sgn });
  }
  if (o.label) {
    const tex = markerLabelTex(o.label, { r: rng(o.seed * 3 + 7) });
    const lw = Math.min(w * 0.8, 0.5), lh = lw / 2;
    const m = texMesh(new THREE.PlaneGeometry(lw, lh), tex, { rough: 0.85, transparent: true, alphaTest: 0.05 });
    m.position.set(0, h * 0.5, d / 2 + 0.002); root.add(m);
  }
  root.userData = {
    ...root.userData, flaps,
    set(t, s = {}) {
      const f = clamp(s.flaps ?? o.flaps, 0, 1);
      for (const fl of flaps) {
        const a = (fl.ax === 'z' ? 1.95 : 1.75) * smooth(f) + (fl.ax === 'x' ? 0.03 : 0);
        if (fl.ax === 'z') fl.hinge.rotation.x = -fl.sgn * a; else fl.hinge.rotation.z = fl.sgn * a;
        fl.hinge.position.y = h - 0.005 + (fl.ax === 'x' && f < 0.05 ? 0.007 : 0);
      }
    },
  };
  root.userData.set(0, {});
  return root;
}
export const makeLabelledBox = (label, opts = {}) => makeCardboardBox({ ...opts, label });

let _webTex = null;
function webTexture() {
  if (_webTex) return _webTex;
  const S = 512, [c, g] = cvs(S, S), r = rng(81);
  g.clearRect(0, 0, S, S);
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineCap = 'round';
  const N = 11, ang = [];
  for (let k = 0; k < N; k++) ang.push((k / (N - 1)) * Math.PI / 2 + (r() - 0.5) * 0.06);
  g.lineWidth = 2.2;
  for (const a of ang) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * S * 1.05, Math.sin(a) * S * 1.05); g.stroke(); }
  g.lineWidth = 1.4;
  for (let rr = 26; rr < S * 0.98; rr += 20 + r() * 12) {
    g.beginPath();
    ang.forEach((a, k) => { const q = rr * (0.95 + r() * 0.08); const x = Math.cos(a) * q, y = Math.sin(a) * q; if (k === 0) g.moveTo(x, y); else { const pa = ang[k - 1], m = (a + pa) / 2, sag = q * 0.92; g.quadraticCurveTo(Math.cos(m) * sag, Math.sin(m) * sag, x, y); } });
    g.globalAlpha = 0.5 + r() * 0.45; g.stroke();
  }
  g.globalAlpha = 0.5; g.lineWidth = 1;
  for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(r() * S * 0.6, r() * S * 0.6); g.quadraticCurveTo(S * (0.4 + r() * 0.5), S * (0.4 + r() * 0.5), S * (0.6 + r() * 0.4), S); g.stroke(); }
  _webTex = ctex(c);
  return _webTex;
}
export function makeCobweb(opts = {}) {
  const o = { size: 0.7, sag: 0.12, ...opts };
  const root = rootProp('cobweb');
  const geo = new THREE.PlaneGeometry(o.size, o.size, 6, 6);
  const P = geo.attributes.position, uv = geo.attributes.uv;
  for (let k = 0; k < P.count; k++) {
    const u = uv.getX(k), v = uv.getY(k);            // canvas top-left (the web's hub) = the card's top-left vertex
    P.setZ(k, -o.sag * Math.sin(Math.PI * Math.min(1, u)) * Math.sin(Math.PI * Math.min(1, v)) * 0.6);
  }
  geo.translate(o.size / 2, -o.size / 2, 0); geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: webTexture(), color: '#eeeeee', transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.5, emissive: new THREE.Color('#ffffff'), emissiveMap: webTexture(), emissiveIntensity: 0.04 });
  const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = 3; root.add(mesh);
  root.userData.set = (t, s = {}) => { const sw = s.sway ?? 1; mesh.rotation.x = 0.06 * sw * noise1(t * 0.5, 3); mesh.rotation.y = 0.05 * sw * noise1(t * 0.43, 5); };
  return root;
}
export function makeLoaf(opts = {}) {
  const o = { length: 0.46, bite: true, ...opts };
  const L = o.length;
  const root = rootProp('loaf');
  const g = new THREE.SphereGeometry(1, 40, 24);
  const P = g.attributes.position, n = P.count, col = new Float32Array(n * 3);
  const top = new THREE.Color('#9a5622'), side = new THREE.Color('#d39a55'), cut = new THREE.Color('#f0d3a0'), crumb = new THREE.Color('#f3e1bd');
  for (let k = 0; k < n; k++) {
    let x = P.getX(k), y = P.getY(k), z = P.getZ(k);
    if (y < -0.35) y = -0.35 + (y + 0.35) * 0.15;                 // flat bottom
    let c = side.clone().lerp(top, smooth((y + 0.1) / 0.9));
    // three diagonal slashes across the top
    if (y > 0.2) for (let s = -1; s <= 1; s++) { const dd = Math.abs((x - s * 0.5) * 0.9 + z * 0.55); if (dd < 0.09) { y -= (0.09 - dd) * 0.9 * y; c = c.lerp(cut, 1 - dd / 0.09); } }
    let X = x * L / 2, Y = (y + 0.35) * 0.13 * 1.0, Z = z * L * 0.27;
    if (o.bite && x > 0.55) { const bd = Math.hypot(X - L / 2, Y - 0.08, Z - 0.0); if (bd < 0.09) { const k2 = (0.09 - bd) / 0.09; X -= k2 * 0.05; c = c.lerp(crumb, Math.min(1, k2 * 2.5)); } }
    P.setXYZ(k, X, Y, Z);
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
  }
  g.computeVertexNormals();
  const geo = prepGeom(g);                          // non-indexed: vertex k of triangle list = g.index[k]
  const idx = g.index.array, ci = new Float32Array(idx.length * 3);
  for (let k = 0; k < idx.length; k++) { const s = idx[k]; ci[k * 3] = col[s * 3]; ci[k * 3 + 1] = col[s * 3 + 1]; ci[k * 3 + 2] = col[s * 3 + 2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(ci, 3));
  const mesh = new THREE.Mesh(geo, kindMat('bread')); mesh.castShadow = true; mesh.receiveShadow = true;
  root.add(mesh);
  return root;
}
export function makeEyeGlints(opts = {}) {
  const o = { pairs: 2, spacing: 0.42, eye: 0.055, sep: 0.1, color: '#e8ff9c', seed: 3, ...opts };
  const root = rootProp('eyeGlints');
  const pairs = [];
  for (let i = 0; i < o.pairs; i++) {
    const p = group('pair', root);
    p.position.set((i - (o.pairs - 1) / 2) * o.spacing, (hash(o.seed + i * 3.1) - 0.5) * 0.12, (hash(o.seed + i * 5.3) - 0.5) * 0.1);
    const eyes = [];
    for (const s of [-1, 1]) {
      const halo = additiveSprite(glowTex(), o.color); halo.position.x = s * o.sep / 2; p.add(halo);
      const core = additiveSprite(glowTex(), '#ffffff'); core.position.x = s * o.sep / 2; core.position.z = 0.001; p.add(core);
      eyes.push({ halo, core });
    }
    pairs.push({ p, eyes, seed: hash(o.seed * 7 + i) });
  }
  root.userData = {
    ...root.userData, pairs,
    set(t, s = {}) {
      const on = s.on ?? 1, blink = s.blink ?? true;
      for (const pr of pairs) {
        const ph = ((t + pr.seed * 7.1) / (2.1 + pr.seed)) % 1;
        const open = blink ? (ph < 0.05 ? Math.abs(ph / 0.025 - 1) : 1) : 1;
        const flick = 1 + 0.08 * noise1(t * 4, pr.seed * 10);
        if (s.look) pr.p.position.x += 0;
        for (const e of pr.eyes) {
          e.halo.visible = e.core.visible = on > 0.001;
          e.halo.scale.set(o.eye * 3.2, o.eye * 3.2 * Math.max(0.12, open), 1);
          e.core.scale.set(o.eye * 1.1, o.eye * 1.1 * Math.max(0.1, open), 1);
          e.halo.material.color.set(o.color).multiplyScalar(1.6 * on * flick);
          e.core.material.color.set('#ffffff').multiplyScalar(2.6 * on * flick);
        }
      }
    },
  };
  root.userData.set(0, {});
  return root;
}
export function makeRaccoonTail(opts = {}) {
  const o = { length: 0.62, rings: 5, segs: 10, ...opts };
  const root = rootProp('raccoonTail');
  const base = group('base', root);
  const N = o.segs, sl = o.length / N;
  const chain = [];
  let parent = base;
  for (let k = 0; k < N; k++) {
    const j = group('seg' + k, parent); j.position.x = k === 0 ? 0 : sl;
    const u = k / (N - 1);
    const rad = (0.055 + 0.04 * Math.sin(Math.PI * Math.min(1, u * 1.25))) * (k === N - 1 ? 0.7 : 1);
    const band = Math.floor(u * o.rings * 2 + 0.5) % 2 === 1 || k === N - 1;
    const B = new Batch();
    B.add('fur', sp(1, 14, 10), { pos: [sl * 0.5, 0, 0], scale: [sl * 0.85, rad, rad], color: band ? '#2a2a2d' : '#9c968b' });
    B.add('fur', sp(1, 10, 8), { pos: [sl * 0.5, rad * 0.25, 0], scale: [sl * 0.6, rad * 0.95, rad * 1.02], rot: [0.3 * k, 0, 0], color: band ? '#1f1f22' : '#b3ada0' });
    B.build(j, { name: 'tailSeg' });
    chain.push(j); parent = j;
  }
  root.userData = {
    ...root.userData, chain,
    set(t, s = {}) {
      const curl = s.curl ?? 0.6, wave = s.wave ?? 0.15;
      chain.forEach((j, k) => { j.rotation.z = curl / N + wave * Math.sin(t * 3 + k * 0.7) / N * 2; j.rotation.y = 0.05 * Math.sin(t * 2.1 + k * 0.5); });
      base.rotation.set(0, 0, 0);
      root.visible = !s.hide;
      if (s.flickAt != null) {
        const u = (t - s.flickAt) / 0.13;
        base.rotation.y = lerp(1.25, -1.25, ease01(u));
        base.rotation.z = 0.25 * Math.sin(Math.PI * clamp(u, 0, 1));
        if (s.flickOnly) root.visible = u >= -0.05 && u <= 1.05;
      }
    },
  };
  root.userData.set(0, {});
  return root;
}
const ease01 = (u) => smooth(clamp(u, 0, 1));

// ═════════════════════════════════════════════ BOX ROOM: CRIB / FLAT-PACK / PAINT ═════════════════════════════════
export function makeCrib(opts = {}) {
  const o = { l: 1.5, wd: 0.92, h: 1.0, base: 0.32, wood: '#f3dfba', mattress: false, stage: 'half', ...opts };
  const { l, wd, h, base } = o;
  const root = rootProp('crib');
  const wood = o.wood, dk = '#' + new THREE.Color(wood).multiplyScalar(0.82).getHexString();
  const B = new Batch();
  B.add('paint', rb(l - 0.08, 0.06, wd - 0.08, 0.01), { pos: [0, base - 0.03, 0], color: dk });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add('paint', rb(0.06, base - 0.06, 0.06, 0.01), { pos: [sx * (l / 2 - 0.1), (base - 0.06) / 2, sz * (wd / 2 - 0.1)], color: dk });
  for (let k = 0; k < 5; k++) B.add('paint', rb(0.07, 0.025, wd - 0.12, 0.006), { pos: [-l / 2 + 0.2 + k * (l - 0.4) / 4, base - 0.0, 0], color: wood });
  if (o.mattress) B.add('knit', rb(l - 0.14, 0.1, wd - 0.14, 0.04), { pos: [0, base + 0.05, 0], color: '#dce9f2' });
  if (o.stage === 'half') {
    const r = rng(97);
    for (let k = 0; k < 7; k++) B.add('metal', cy(0.007, 0.007, 0.035, 6), { pos: [(r() - 0.5) * l * 0.6, base + 0.012, (r() - 0.5) * wd * 0.5], rot: [Math.PI / 2, r() * 3, 0], color: '#b0b4ba' });
    B.add('metal', rb(0.012, 0.012, 0.11, 0.003), { pos: [0.2, base + 0.012, 0.12], rot: [0, 0.7, 0], color: '#3a3d44' });
  }
  B.build(root, { name: 'cribBase' });
  const panels = [];
  const sideH = h - base;
  const theta = Math.PI / 2 + Math.asin(Math.min(0.95, base / sideH));
  // long sides (front +Z / back −Z), hinged at the platform edge
  for (const sz of [1, -1]) {
    const hinge = group('cribSide', root); hinge.position.set(0, base, sz * (wd / 2 - 0.02));
    const P = new Batch();
    P.add('paint', rb(l - 0.14, 0.07, 0.05, 0.012), { pos: [0, sideH - 0.035, 0], color: wood });
    P.add('paint', rb(l - 0.14, 0.06, 0.045, 0.01), { pos: [0, 0.05, 0], color: wood });
    const n = Math.round((l - 0.2) / 0.1);
    for (let k = 0; k <= n; k++) P.add('paint', rb(0.035, sideH - 0.1, 0.035, 0.008), { pos: [-(l - 0.2) / 2 + k * (l - 0.2) / n, sideH / 2, 0], color: wood });
    P.build(hinge, { name: 'cribSide' });
    panels.push({ hinge, axis: 'x', sgn: sz, max: theta });
  }
  // end boards (−X / +X) with the posts, hinged at the floor
  for (const sx of [-1, 1]) {
    const hinge = group('cribEnd', root); hinge.position.set(sx * l / 2, 0, 0);
    const P = new Batch();
    for (const sz of [-1, 1]) {
      P.add('paint', rb(0.075, h + 0.05, 0.075, 0.014), { pos: [-sx * 0.04, (h + 0.05) / 2, sz * (wd / 2 - 0.04)], color: wood });
      P.add('paint', sp(0.05, 12, 8), { pos: [-sx * 0.04, h + 0.09, sz * (wd / 2 - 0.04)], color: wood });
    }
    P.add('paint', rb(0.05, 0.2, wd - 0.1, 0.02), { pos: [-sx * 0.04, h - 0.1, 0], color: wood });
    P.add('paint', rb(0.045, 0.06, wd - 0.1, 0.01), { pos: [-sx * 0.04, base + 0.05, 0], color: wood });
    const n = 6;
    for (let k = 0; k <= n; k++) P.add('paint', rb(0.035, h - base - 0.25, 0.035, 0.008), { pos: [-sx * 0.04, base + 0.05 + (h - base - 0.25) / 2, -(wd - 0.22) / 2 + k * (wd - 0.22) / n], color: wood });
    P.add('paint', sp(0.055, 12, 8).scale(1, 1, 0.3), { pos: [-sx * 0.04 + sx * 0.03, h - 0.1, 0], rot: [0, Math.PI / 2, 0], color: '#ffd23f' });   // star cut-out
    P.build(hinge, { name: 'cribEnd' });
    panels.push({ hinge, axis: 'z', sgn: sx, max: Math.PI / 2 });
  }
  const preset = o.stage === 'half' ? [1, 0, 0, 0.3] : [0, 0, 0, 0];
  root.userData = {
    ...root.userData, panels,
    set(t, s = {}) {
      const v = s.sides == null ? preset : typeof s.sides === 'number' ? [s.sides, s.sides, s.sides, s.sides] : s.sides;
      panels.forEach((p, i) => {
        let u = v[i] ?? 0;
        if (s.fallAt != null) u = Math.max(u, bounceOut((t - s.fallAt - [0, 0.05, 0.1, 0.03][i]) / 0.55));
        const wob = sumRing(t, s.fallAt, 0.04, 4, 6, i) * (u > 0.98 ? 1 : 0) + (s.wobble ?? 0);
        const a = u * p.max + wob;
        if (p.axis === 'x') p.hinge.rotation.x = p.sgn * a; else p.hinge.rotation.z = -p.sgn * a;
      });
    },
  };
  root.userData.set(0, {});
  return root;
}
function drawCribLines(g, x, y, s, col = '#22355e', lw = 6) {
  // a 3/4-view line drawing of the crib: box frame, slats, posts with balls
  g.save(); g.translate(x, y); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
  const L = s, Wd = s * 0.45, H = s * 0.55, dx = Wd * 0.6, dy = -Wd * 0.35;
  const P = (px, py) => [px, py];
  const fr = [P(0, 0), P(L, 0), P(L, -H), P(0, -H)], bk = fr.map(([a, b]) => [a + dx, b + dy]);
  const poly = (pts) => { g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.stroke(); };
  poly(bk); poly(fr);
  for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(...fr[k]); g.lineTo(...bk[k]); g.stroke(); }
  g.lineWidth = lw * 0.55;
  for (let k = 1; k < 12; k++) { const px = (k / 12) * L; g.beginPath(); g.moveTo(px, -H * 0.12); g.lineTo(px, -H); g.stroke(); }
  for (let k = 1; k < 5; k++) { const u = k / 5; g.beginPath(); g.moveTo(L + dx * u, -H * 0.12 + dy * u); g.lineTo(L + dx * u, -H + dy * u); g.stroke(); }
  g.lineWidth = lw; g.beginPath(); g.moveTo(0, -H * 0.12); g.lineTo(L, -H * 0.12); g.stroke();
  for (const [a, b] of [...fr.slice(2), ...bk.slice(2)]) { g.beginPath(); g.arc(a, b - lw * 1.6, lw * 1.6, 0, TAU); g.fill(); }
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, H * 0.18); g.moveTo(L, 0); g.lineTo(L, H * 0.18); g.stroke();
  g.restore();
}
let _cribBoxTex = null;
function cribBoxTexture() {
  if (_cribBoxTex) return _cribBoxTex;
  const W = 1024, H = 672, [c, g] = cvs(W, H), r = rng(101);
  g.fillStyle = '#c4935f'; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(90,60,30,${(0.04 + r() * 0.06).toFixed(3)})`; g.fillRect(r() * W, r() * H, 2 + r() * 10, 1 + r() * 2); }
  g.fillStyle = '#f7f3ea'; roundRect(g, 40, 40, W - 80, H - 80, 22); g.fill();
  g.fillStyle = '#22355e'; g.fillRect(40, 40, W - 80, 92);
  g.fillStyle = '#ffd23f'; g.font = `900 64px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SNUGGLE', 70, 88);
  g.fillStyle = '#ffffff'; g.font = `700 34px ${SANS}`; g.textAlign = 'right'; g.fillText('baby crib · flat-pack', W - 70, 90);
  drawCribLines(g, 190, 520, 520, '#22355e', 9);
  g.fillStyle = '#22355e'; g.textAlign = 'left'; g.font = `900 48px ${SANS}`; g.fillText('BABY CRIB', 70, 600);
  g.font = `700 28px ${SANS}`; g.fillText('some assembly required', 400, 604);
  g.strokeStyle = '#22355e'; g.lineWidth = 5; g.strokeRect(W - 230, 470, 160, 160);
  g.font = `900 30px ${SANS}`; g.textAlign = 'center'; g.fillText('1 / 1', W - 150, 520);
  g.save(); g.translate(W - 150, 585); g.rotate(-0.8); g.fillRect(-55, -7, 110, 14); g.fillRect(28, -14, 30, 28); g.restore();   // screwdriver icon
  g.fillStyle = 'rgba(200,40,40,0.9)'; g.beginPath(); g.arc(W - 150, 250, 70, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.font = `900 34px ${SANS}`; g.fillText('NEW!', W - 150, 252);
  _cribBoxTex = ctex(c);
  return _cribBoxTex;
}
export function makeCribBox(opts = {}) {
  const o = { w: 1.45, h: 0.95, d: 0.16, lying: false, ...opts };
  const { w, h, d } = o;
  const root = rootProp('cribBox');
  const inner = group('inner', root);
  const B = new Batch();
  B.add('card', rb(w, h, d, 0.008), { color: '#ffffff' });
  B.add('satin', rb(w + 0.002, 0.08, 0.004, 0.001), { pos: [0, 0, d / 2 - 0.001], rot: [0, 0, 0], color: '#c9a46a' });
  B.build(inner, { name: 'cribBox' });
  for (const s of [1, -1]) { const m = texMesh(new THREE.PlaneGeometry(w - 0.01, h - 0.01), cribBoxTexture(), { rough: 0.75 }); m.position.z = s * (d / 2 + 0.002); if (s < 0) m.rotation.y = Math.PI; inner.add(m); }
  root.userData.set = (t, s = {}) => {
    const lying = s.lying ?? o.lying;
    if (lying) { inner.rotation.set(-Math.PI / 2, 0, 0); inner.position.set(0, d / 2, 0); } else { inner.rotation.set(0, 0, 0); inner.position.set(0, h / 2, 0); }
  };
  root.userData.set(0, {});
  return root;
}
export function makeTextCard(opts = {}) {
  const o = { w: 0.3, h: 0.4, px: 1024, rough: 0.85, thick: 0.002, color: '#f6f2e8', emissive: 0, draw: null, ...opts };
  const W = o.w >= o.h ? o.px : Math.round(o.px * o.w / o.h), H = o.w >= o.h ? Math.round(o.px * o.h / o.w) : o.px;
  const [c, g] = cvs(W, H);
  if (o.draw) o.draw(g, W, H);
  const tex = ctex(c);
  const root = rootProp('textCard');
  const face = texMesh(new THREE.PlaneGeometry(o.w, o.h, 8, 8), tex, { rough: o.rough, emissive: o.emissive });
  face.position.z = o.thick / 2 + 0.0005; root.add(face);
  if (o.thick > 0) { const B = new Batch(); B.add('paper', new THREE.BoxGeometry(o.w, o.h, o.thick), { color: o.color }); B.build(root, { name: 'cardBack', cast: false }); }
  root.userData.face = face; root.userData.texture = tex; root.userData.canvas = c;
  return root;
}
export function makeInstructionSheet(opts = {}) {
  const o = { w: 0.42, h: 0.56, ...opts };
  return makeTextCard({ ...o, draw(g, W, H) {
    paperBg(g, W, H, '#fbf9f2', rng(111));
    g.fillStyle = '#22355e'; g.fillRect(0, 0, W, H * 0.09);
    g.fillStyle = '#fff'; g.font = `900 ${Math.round(H * 0.045)}px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SNUGGLE CRIB — ASSEMBLY', W * 0.05, H * 0.045);
    for (let k = 0; k < 3; k++) {
      const y0 = H * (0.13 + k * 0.29);
      g.strokeStyle = '#22355e'; g.lineWidth = 3; g.strokeRect(W * 0.05, y0, W * 0.9, H * 0.26);
      g.fillStyle = '#22355e'; g.beginPath(); g.arc(W * 0.12, y0 + H * 0.05, H * 0.035, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.font = `900 ${Math.round(H * 0.04)}px ${SANS}`; g.textAlign = 'center'; g.fillText(String(k + 1), W * 0.12, y0 + H * 0.052);
      drawCribLines(g, W * 0.3, y0 + H * 0.22, W * (0.3 + k * 0.08), '#22355e', 3);
      g.fillStyle = '#22355e'; g.font = `700 ${Math.round(H * 0.022)}px ${SANS}`; g.textAlign = 'left';
      g.fillText(['x4 bolts', 'x8 screws', 'tighten!'][k], W * 0.72, y0 + H * 0.06);
      for (let j = 0; j < 4; j++) { g.fillRect(W * (0.72 + j * 0.05), y0 + H * 0.1, W * 0.012, H * 0.05); g.fillRect(W * (0.715 + j * 0.05), y0 + H * 0.1, W * 0.022, H * 0.01); }
    }
  } });
}
function inward(g) { g.scale(-1, 1, 1); const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); return g; }
let _tinTex = null;
function paintTinTexture(color) {
  if (_tinTex) return _tinTex;
  const W = 1024, H = 320, [c, g] = cvs(W, H), r = rng(121);
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#d8dbe0'); grd.addColorStop(0.5, '#aeb3ba'); grd.addColorStop(1, '#c8ccd2'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(r() * W, 0, 6 + r() * 20, H); }
  g.fillStyle = '#f4efe2'; g.fillRect(0, H * 0.24, W, H * 0.6);
  g.fillStyle = color; g.beginPath(); g.ellipse(W * 0.2, H * 0.54, 110, 70, -0.2, 0, TAU); g.fill();
  g.fillStyle = '#22355e'; g.font = `900 64px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SUNSHINE', W * 0.34, H * 0.44);
  g.fillText('YELLOW', W * 0.34, H * 0.66); g.font = `700 30px ${SANS}`; g.fillText('2.5 L · matt emulsion', W * 0.66, H * 0.76);
  g.fillStyle = color;
  for (let k = 0; k < 14; k++) {                       // drips from the rim, over everything
    const x = r() * W, len = H * (0.15 + r() * 0.75), wd = 8 + r() * 22;
    g.fillRect(x - wd / 2, 0, wd, len); g.beginPath(); g.arc(x, len, wd * 0.62, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x, 6, wd * 1.6, 12, 0, 0, TAU); g.fill();
  }
  g.fillRect(0, 0, W, 10);
  _tinTex = ctex(c, { wrap: true });
  return _tinTex;
}
export function makePaintTin(opts = {}) {
  const o = { r: 0.13, h: 0.27, lid: false, color: PROP_COLORS.paint, ...opts };
  const { r, h } = o;
  const root = rootProp('paintTin');
  const side = texMesh(cy(r, r, h, 36, true), paintTinTexture(o.color), { rough: 0.35, metal: 0.55, cast: true });
  side.position.y = h / 2; root.add(side);
  const B = new Batch();
  B.add('metal', inward(cy(r * 0.97, r * 0.97, h - 0.01, 30, true)), { pos: [0, h / 2 + 0.004, 0], color: '#9aa0a8' });
  B.add('metal', new THREE.TorusGeometry(r, 0.008, 6, 36), { pos: [0, h, 0], rot: [Math.PI / 2, 0, 0], color: '#c8ccd2' });
  B.add('metal', cy(r, r, 0.01, 36), { pos: [0, 0.005, 0], color: '#9aa0a8' });
  B.add('gloss', cy(r * 0.96, r * 0.96, 0.01, 36), { pos: [0, h - 0.035, 0], color: o.color });
  B.add('gloss', new THREE.TorusGeometry(r * 0.75, 0.012, 6, 24, Math.PI * 0.7), { pos: [0, h - 0.028, 0], rot: [Math.PI / 2, 0, 0.4], color: '#ffe27a' });
  for (const s of [-1, 1]) B.add('metal', rb(0.025, 0.03, 0.012, 0.004), { pos: [s * (r + 0.004), h - 0.04, 0], color: '#8a8f96' });
  if (o.lid) B.add('metal', cy(r * 1.02, r * 1.02, 0.015, 36), { pos: [r * 1.45, r * 1.02, 0], rot: [0, 0, Math.PI / 2 - 0.25], color: '#c0c4ca' });
  B.build(root, { name: 'paintTin' });
  const handle = group('handle', root); handle.position.y = h - 0.04;
  const HB = new Batch(); HB.add('metal', new THREE.TorusGeometry(r + 0.006, 0.0045, 5, 24, Math.PI), { color: '#7c8188' }); HB.build(handle, { name: 'handle' });
  root.userData.set = (t, s = {}) => { handle.rotation.x = s.handle ?? -1.25; };
  root.userData.set(0, {});
  return root;
}
export function makePaintRoller(opts = {}) {
  const o = { length: 0.5, color: PROP_COLORS.paint, ...opts };
  const root = rootProp('paintRoller');
  const B = new Batch();
  B.add('gloss', cy(0.026, 0.03, 0.16, 12).rotateX(Math.PI / 2), { pos: [0, 0, 0], color: '#e8602c' });
  B.add('metal', cy(0.006, 0.006, 0.2, 6).rotateX(Math.PI / 2), { pos: [0, 0, 0.18], color: '#c9ccd2' });
  B.add('metal', cy(0.006, 0.006, 0.15, 6), { pos: [0, 0.075, 0.28], color: '#c9ccd2' });
  B.add('metal', cy(0.006, 0.006, 0.16, 6).rotateZ(Math.PI / 2), { pos: [0.08, 0.15, 0.28], color: '#c9ccd2' });
  B.add('fur', cy(0.055, 0.055, 0.26, 18).rotateZ(Math.PI / 2), { pos: [0.08 + 0.06, 0.15, 0.28], color: o.color });
  B.build(root, { name: 'roller' });
  return root;
}
export function makePaintTray(opts = {}) {
  const o = { w: 0.42, d: 0.56, color: PROP_COLORS.paint, ...opts };
  const { w, d } = o;
  const root = rootProp('paintTray');
  const body = group('body', root);
  const B = new Batch();
  B.add('satin', rb(w, 0.02, d, 0.006), { pos: [0, 0.01, 0], color: '#3b6fa8' });
  for (const [x, z, ww, dd] of [[0, d / 2 - 0.01, w, 0.02], [0, -d / 2 + 0.01, w, 0.02], [w / 2 - 0.01, 0, 0.02, d], [-w / 2 + 0.01, 0, 0.02, d]]) B.add('satin', rb(ww, 0.09, dd, 0.006), { pos: [x, 0.045, z], color: '#3b6fa8' });
  B.add('satin', rb(w - 0.04, 0.012, d * 0.55, 0.003), { pos: [0, 0.055, -d * 0.18], rot: [-0.14, 0, 0], color: '#4a7db5' });
  for (let k = 0; k < 6; k++) B.add('satin', rb(w - 0.06, 0.006, 0.01, 0.002), { pos: [0, 0.064 - k * 0.006, -d * 0.4 + k * 0.05], rot: [-0.14, 0, 0], color: '#2f5c8c' });
  B.add('gloss', rb(w - 0.05, 0.03, d * 0.36, 0.01), { pos: [0, 0.035, d * 0.3], color: o.color });
  B.add('gloss', rb(w * 0.4, 0.004, d * 0.3, 0.002), { pos: [-0.04, 0.066, -d * 0.12], rot: [-0.14, 0, 0], color: o.color });
  B.build(body, { name: 'tray' });
  root.userData.set = (t, s = {}) => { body.rotation.x = (s.rock ?? 0) + sumRing(t, s.rockAt, 0.08, 3, 3.5); };
  return root;
}

// ═════════════════════════════════════════════ KITCHEN: PICKLE / ICE CREAM ════════════════════════════════════════
function pickleGeom(len, r = 0.028, seed = 1) {
  const g = new THREE.CapsuleGeometry(r, len - 2 * r, 6, 14).rotateX(Math.PI / 2);
  const P = g.attributes.position, h = rng(seed);
  const bumps = Array.from({ length: 14 }, () => [h() * TAU, (h() - 0.5) * len, 0.003 + h() * 0.004]);
  for (let k = 0; k < P.count; k++) {
    const x = P.getX(k), y = P.getY(k), z = P.getZ(k), a = Math.atan2(y, x);
    let d = 0; for (const [ba, bz, bh] of bumps) { const dd = Math.hypot(Math.atan2(Math.sin(a - ba), Math.cos(a - ba)) * r, z - bz); d += bh * Math.exp(-(dd * dd) / 0.00009); }
    const bend = 0.012 * Math.cos(z / len * Math.PI);
    const s = 1 + d / r;
    P.setXYZ(k, x * s, y * s + bend, z);
  }
  g.computeVertexNormals();
  return g;
}
export function makePickle(opts = {}) {
  const o = { length: 0.14, dip: 0, seed: 3, ...opts };
  const root = rootProp('pickle');
  const B = new Batch();
  B.add('gloss', pickleGeom(o.length, 0.028, o.seed), { color: '#5d8a2b' });
  B.build(root, { name: 'pickle' });
  const coat = group('coat', root);
  const CB = new Batch(); CB.add('satin', new THREE.CapsuleGeometry(0.032, Math.max(0.001, o.length - 0.064), 6, 14).rotateX(Math.PI / 2), { color: '#f6ecd2' }); CB.build(coat, { name: 'iceCreamCoat', cast: false });
  const drop = new THREE.Mesh(prepGeom(sp(0.009, 10, 8)), new THREE.MeshStandardMaterial({ color: '#cfe3a0', roughness: 0.05, transparent: true, opacity: 0.75 }));
  root.add(drop);
  root.userData.set = (t, s = {}) => {
    const dip = clamp(s.dip ?? o.dip, 0, 1);
    coat.visible = dip > 0.01;
    coat.scale.set(1, 1, Math.max(0.01, dip)); coat.position.z = o.length / 2 * (1 - dip);
    const dr = s.drip ?? 0;
    drop.visible = dr > 0.01; drop.position.set(0, -0.03 - 0.02 * dr, o.length / 2 - 0.01); drop.scale.set(1, 1 + dr * 1.5, 1);
  };
  root.userData.set(0, {});
  return root;
}
function labelBand(r, h, tex, y, arc = Math.PI * 1.1, emissive = 0) {
  const g = new THREE.CylinderGeometry(r, r, h, 32, 1, true, -arc / 2, arc);      // centred on +Z
  const m = texMesh(g, tex, { rough: 0.7, emissive }); m.position.y = y; return m;
}
export function makePickleJar(opts = {}) {
  const o = { r: 0.13, h: 0.34, pickles: 8, lid: true, ...opts };
  const { r, h } = o;
  const root = rootProp('pickleJar');
  const P = new Batch(), hr = rng(131);
  for (let k = 0; k < o.pickles; k++) {
    const a = (k / o.pickles) * TAU + hr() * 0.3, rr = r * (0.45 + hr() * 0.2);
    // long, light, bumpy gherkins leaning at angles (they read as pickles, not olives, through the clearer glass)
    P.add('gloss', pickleGeom(h * 0.8, 0.034, 10 + k), { pos: [Math.cos(a) * rr, h * 0.44, Math.sin(a) * rr], rot: [Math.PI / 2 + (hr() - 0.5) * 0.5, 0, (hr() - 0.5) * 0.5], color: hr() < 0.5 ? '#7fae3a' : '#6f9e30' });
  }
  for (let k = 0; k < 6; k++) P.add('plain', sp(0.012, 6, 4), { pos: [(hr() - 0.5) * r, h * (0.2 + hr() * 0.5), (hr() - 0.5) * r], color: '#3f5f1f' });
  P.add('metal', cy(r * 1.0, r * 1.0, 0.012, 32), { pos: [0, 0.006, 0], color: '#d8e6d0' });
  if (o.lid) {
    P.add('metal', cy(r * 0.92, r * 0.92, 0.055, 32), { pos: [0, h + 0.027, 0], color: '#2f6b3a' });
    P.add('metal', cy(r * 0.88, r * 0.88, 0.004, 32), { pos: [0, h + 0.056, 0], color: '#d9b45a' });
  }
  P.build(root, { name: 'jarContents' });
  const brine = new THREE.Mesh(cy(r * 0.93, r * 0.93, h * 0.82, 32), new THREE.MeshStandardMaterial({ color: '#d8e66a', roughness: 0.1, transparent: true, opacity: 0.25, depthWrite: false }));
  brine.position.y = h * 0.42; brine.renderOrder = 2; root.add(brine);
  const glass = new THREE.Mesh(cy(r, r, h, 40, true), new THREE.MeshStandardMaterial({ color: '#eef6ee', roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }));
  glass.position.y = h / 2 + 0.002; glass.renderOrder = 3; root.add(glass);
  const shoulder = new THREE.Mesh(new THREE.TorusGeometry(r * 0.94, 0.01, 6, 32), glass.material); shoulder.rotation.x = Math.PI / 2; shoulder.position.y = h; shoulder.renderOrder = 3; root.add(shoulder);
  const [c, g] = cvs(1024, 256);
  g.fillStyle = '#f5ecd0'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#1f4a28'; g.fillRect(0, 0, 1024, 26); g.fillRect(0, 230, 1024, 26);
  g.fillStyle = '#163d20'; g.font = `900 120px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PICKLES', 512, 120);
  g.font = `700 30px ${SANS}`; g.fillText('extra crunchy · dill', 512, 200);
  for (const x of [120, 904]) { g.strokeStyle = '#557f26'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 200); g.lineTo(x, 60); g.stroke(); for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x, 70 + k * 22); g.lineTo(x + (k % 2 ? 30 : -30), 50 + k * 22); g.stroke(); } }
  root.add(labelBand(r * 1.004, h * 0.42, ctex(c), h * 0.45, Math.PI * 1.1, 0.15));   // slightly emissive: reads in the fridge light
  return root;
}
export function makeIceCreamTub(opts = {}) {
  const o = { r: 0.13, h: 0.17, lid: false, flavour: 'VANILLA', ...opts };
  const { r, h } = o, rb_ = r * 0.86;
  const root = rootProp('iceCreamTub');
  const [c, g] = cvs(1024, 256), hr = rng(141);
  g.fillStyle = '#fbf3e4'; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = '#e86f9a'; g.fillRect(0, 0, 1024, 40); g.fillRect(0, 216, 1024, 40);
  g.fillStyle = '#7a3b2a'; g.font = `900 92px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.flavour, 560, 128);
  g.fillStyle = '#f6ecd2'; g.beginPath(); g.arc(160, 120, 56, 0, TAU); g.fill(); g.strokeStyle = '#d7c29a'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#c98a4e'; g.beginPath(); g.moveTo(110, 150); g.lineTo(210, 150); g.lineTo(160, 236); g.closePath(); g.fill();
  const side = texMesh(cy(r, rb_, h, 36, true), ctex(c, { wrap: true }), { rough: 0.65, cast: true }); side.position.y = h / 2; root.add(side);
  const B = new Batch();
  B.add('plain', inward(cy(r * 0.97, rb_ * 0.97, h, 30, true)), { pos: [0, h / 2 + 0.002, 0], color: '#efe6d2' });
  B.add('plain', cy(rb_, rb_, 0.008, 30), { pos: [0, 0.004, 0], color: '#efe6d2' });
  B.add('plain', new THREE.TorusGeometry(r, 0.006, 5, 36), { pos: [0, h, 0], rot: [Math.PI / 2, 0, 0], color: '#e86f9a' });
  // scooped cream surface
  const sg = new THREE.CircleGeometry(r * 0.96, 40, 0, TAU).rotateX(-Math.PI / 2);
  const SP = sg.attributes.position;
  const scoops = [[0.3, 0.2, 0.06], [-0.35, -0.1, 0.07], [0.05, -0.45, 0.05]];
  for (let k = 0; k < SP.count; k++) {
    const x = SP.getX(k) / r, z = SP.getZ(k) / r;
    let y = 0.01 * Math.sin(x * 9 + z * 7) + 0.006 * hr();
    for (const [sx, sz, dep] of scoops) { const d = Math.hypot(x - sx, z - sz); if (d < 0.38) y -= dep * Math.cos(d / 0.38 * Math.PI / 2); }
    SP.setY(k, y);
  }
  sg.computeVertexNormals();
  B.add('satin', sg, { pos: [0, h - 0.035, 0], color: '#f6ecd2' });
  if (o.lid) B.add('plain', cy(r * 1.04, r * 1.04, 0.02, 36), { pos: [r * 1.6, 0.01, 0], color: '#e86f9a' });
  B.build(root, { name: 'iceCream' });
  return root;
}

// ═════════════════════════════════════════════ ULTRASOUND / PARCEL / SOCKS ════════════════════════════════════════
let _usTex = null;
function ultrasoundTexture() {
  if (_usTex) return _usTex;
  const W = 768, H = 576, [c, g] = cvs(W, H), r = rng(151);
  g.fillStyle = '#050506'; g.fillRect(0, 0, W, H);
  const ox = W * 0.5, oy = H * 0.12, R0 = H * 0.08, R1 = H * 0.84, a0 = Math.PI / 2 - 0.72, a1 = Math.PI / 2 + 0.72;
  g.save(); g.beginPath(); g.arc(ox, oy, R1, a0, a1); g.arc(ox, oy, R0, a1, a0, true); g.closePath(); g.clip();
  const grd = g.createRadialGradient(ox, oy, R0, ox, oy, R1); grd.addColorStop(0, '#9a9a9a'); grd.addColorStop(0.5, '#6d6d6d'); grd.addColorStop(1, '#2a2a2a');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 9000; k++) { const v = Math.floor(40 + r() * 215); g.fillStyle = `rgba(${v},${v},${v},${(0.25 + r() * 0.5).toFixed(2)})`; const a = lerp(a0, a1, r()), d = lerp(R0, R1, Math.sqrt(r())); g.fillRect(ox + Math.cos(a) * d, oy + Math.sin(a) * d, 2 + r() * 4, 1 + r() * 2); }
  // dark gestational sac with a bright rim, the white bean inside
  const sx = ox + 10, sy = H * 0.55;
  g.fillStyle = 'rgba(230,230,230,0.65)'; g.beginPath(); g.ellipse(sx, sy, 150, 104, -0.15, 0, TAU); g.fill();
  g.fillStyle = '#060606'; g.beginPath(); g.ellipse(sx, sy, 136, 92, -0.15, 0, TAU); g.fill();
  g.fillStyle = '#f4f4f4'; g.beginPath(); g.ellipse(sx - 6, sy + 22, 52, 28, -0.45, 0, TAU); g.fill();
  g.beginPath(); g.arc(sx + 34, sy + 2, 24, 0, TAU); g.fill();
  g.fillStyle = '#d8d8d8'; g.beginPath(); g.ellipse(sx - 6, sy + 30, 40, 14, -0.45, 0, TAU); g.fill();
  g.restore();
  g.fillStyle = '#e8e8e8'; g.font = `700 22px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'top';
  g.fillText('TOWN CLINIC   12W 3D', 18, 14); g.fillText('GA 12w3d', 18, 42); g.textAlign = 'right'; g.fillText('3.5 MHz', W - 18, 14); g.fillText('HR 158 bpm', W - 18, 42);
  g.strokeStyle = '#e8e8e8'; g.lineWidth = 2; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(W - 30, H * 0.2 + k * 44); g.lineTo(W - 20, H * 0.2 + k * 44); g.stroke(); }
  g.fillStyle = '#ffffff'; g.font = `700 26px ${SANS}`; g.textAlign = 'left'; g.fillText('+', sx + 90, sy - 70);
  _usTex = ctex(c);
  return _usTex;
}
export function makeUltrasound(opts = {}) {
  const o = { w: 0.2, h: 0.15, glow: 0.35, ...opts };
  const root = rootProp('ultrasound');
  const B = new Batch(); B.add('gloss', rb(o.w + 0.008, o.h + 0.008, 0.003, 0.0012), { color: '#0c0c0e' }); B.build(root, { name: 'scanCard', cast: false });
  const face = texMesh(new THREE.PlaneGeometry(o.w, o.h), ultrasoundTexture(), { rough: 0.14, emissive: o.glow });
  face.position.z = 0.0018; root.add(face);
  const back = texMesh(new THREE.PlaneGeometry(o.w, o.h), (() => { const [c, g] = cvs(64, 64); g.fillStyle = '#ecebe6'; g.fillRect(0, 0, 64, 64); return ctex(c); })(), { rough: 0.8 });
  back.position.z = -0.0018; back.rotation.y = Math.PI; root.add(back);
  root.userData.face = face;
  root.userData.set = (t, s = {}) => { face.material.emissiveIntensity = s.glow ?? o.glow; };
  return root;
}
export function makeSocks(opts = {}) {
  const o = { color: '#f6e7f0', stripe: PROP_COLORS.pip, ...opts };
  const root = rootProp('socks');
  const B = new Batch();
  for (const s of [-1, 1]) {
    const x = s * 0.035;
    B.add('knit', rb(0.05, 0.09, 0.05, 0.02), { pos: [x, 0.045, -0.01], rot: [0, 0, s * 0.08], color: o.color });
    B.add('knit', rb(0.05, 0.045, 0.085, 0.02), { pos: [x, 0.0225, 0.03], rot: [0, 0, s * 0.08], color: o.color });
    B.add('knit', rb(0.054, 0.02, 0.054, 0.008), { pos: [x, 0.088, -0.01], rot: [0, 0, s * 0.08], color: o.stripe });
    B.add('knit', rb(0.052, 0.012, 0.052, 0.005), { pos: [x, 0.065, -0.01], rot: [0, 0, s * 0.08], color: o.stripe });
  }
  B.build(root, { name: 'socks', cast: false });
  return root;
}
export function makeParcel(opts = {}) {
  const o = { w: 0.34, h: 0.22, d: 0.28, ribbon: PROP_COLORS.pip, socks: 0, ...opts };
  const { w, h, d } = o;
  const root = rootProp('parcel');
  const B = new Batch();
  B.add('paper', rb(w, h * 0.8, d, 0.01), { pos: [0, h * 0.4, 0], color: '#b98b5b' });
  B.add('satin', rb(0.035, h * 0.8 + 0.004, d + 0.004, 0.003), { pos: [0, h * 0.4, 0], color: o.ribbon });
  B.add('satin', rb(w + 0.004, h * 0.8 + 0.004, 0.035, 0.003), { pos: [0, h * 0.4, 0], color: o.ribbon });
  B.build(root, { name: 'parcel' });
  const lid = group('lid', root); lid.position.set(0, h * 0.8, -d / 2);
  const L = new Batch();
  L.add('paper', rb(w + 0.02, h * 0.25, d + 0.02, 0.01), { pos: [0, h * 0.06, d / 2], color: '#c29462' });
  L.add('satin', rb(0.036, h * 0.25 + 0.004, d + 0.024, 0.003), { pos: [0, h * 0.06, d / 2], color: o.ribbon });
  L.add('satin', rb(w + 0.024, h * 0.25 + 0.004, 0.036, 0.003), { pos: [0, h * 0.06, d / 2], color: o.ribbon });
  for (const s of [-1, 1]) L.add('satin', new THREE.TorusGeometry(0.045, 0.012, 6, 14).scale(1.3, 0.8, 1), { pos: [s * 0.05, h * 0.21, d / 2], rot: [0, 0, s * 0.35], color: o.ribbon });
  L.add('satin', sp(0.022, 10, 8), { pos: [0, h * 0.2, d / 2], color: o.ribbon });
  for (const s of [-1, 1]) L.add('satin', rb(0.025, 0.004, 0.09, 0.002), { pos: [s * 0.03, h * 0.19, d / 2 + 0.06], rot: [0.2, s * 0.5, 0], color: o.ribbon });
  L.build(lid, { name: 'parcelLid' });
  const socks = makeSocks(); socks.position.set(0.04, h * 0.5, 0.04); socks.rotation.set(-0.3, 0.4, 0.15); root.add(socks);
  root.userData = {
    ...root.userData, lid, socks,
    set(t, s = {}) {
      const u = clamp(s.socks ?? o.socks, 0, 1);
      lid.rotation.x = -0.32 * u;
      socks.visible = u > 0.01; socks.position.y = h * (0.45 + 0.4 * u);
    },
  };
  root.userData.set(0, {});
  return root;
}

// ═════════════════════════════════════════════ SIGNS + TEXT PROPS ═════════════════════════════════════════════════
export function makeBakerySign(opts = {}) {
  const o = { w: 1.3, h: 0.46, text: 'BAKERY', drop: 0.32, ...opts };
  const { w, h } = o;
  const root = rootProp('bakerySign');
  const swing = group('swing', root);
  const W = 1024, H = Math.round(1024 * h / w), [c, g] = cvs(W, H), r = rng(161);
  woodBg(g, W, H, '#6b3f22', r, 0.25);
  g.fillStyle = '#f3e3b5'; roundRect(g, W * 0.04, H * 0.12, W * 0.92, H * 0.76, 28); g.fill();
  g.strokeStyle = '#9c3b22'; g.lineWidth = 7; roundRect(g, W * 0.06, H * 0.17, W * 0.88, H * 0.66, 22); g.stroke();
  paintText(g, o.text, W * 0.55, H * 0.52, { size: H * 0.5, maxW: W * 0.58, color: '#9c3b22', family: SERIF, weight: '900', r, jitter: 0.03 });
  // loaf + wheat
  g.fillStyle = '#c98a3e'; g.beginPath(); g.ellipse(W * 0.15, H * 0.55, W * 0.07, H * 0.16, 0, 0, TAU); g.fill();
  g.strokeStyle = '#f3e3b5'; g.lineWidth = 6; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(W * 0.15 + k * 30 - 14, H * 0.44); g.lineTo(W * 0.15 + k * 30 + 14, H * 0.66); g.stroke(); }
  g.strokeStyle = '#b8862e'; g.lineWidth = 5; g.beginPath(); g.moveTo(W * 0.9, H * 0.75); g.lineTo(W * 0.9, H * 0.3); g.stroke();
  g.fillStyle = '#d7a541'; for (let k = 0; k < 5; k++) for (const s of [-1, 1]) { g.beginPath(); g.ellipse(W * 0.9 + s * 14, H * (0.34 + k * 0.08), 10, 20, s * 0.5, 0, TAU); g.fill(); }
  const tex = ctex(c);
  const B = new Batch();
  B.add('oak', rb(w, h, 0.05, 0.015), { pos: [0, -o.drop - h / 2, 0], color: '#5a341c' });
  // chains (links) from the board's top corners to the origin
  for (const s of [-1, 1]) {
    const a = V3(s * w * 0.4, -o.drop, 0), dir = a.clone().normalize(), len = a.length(), n = Math.round(len / 0.035);
    for (let k = 0; k < n; k++) { const p = dir.clone().multiplyScalar((k + 0.5) * len / n); B.add('metal', new THREE.TorusGeometry(0.013, 0.0035, 5, 10).scale(1, 1.5, 1), { matrix: new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir).multiply(new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), k % 2 ? Math.PI / 2 : 0)), V3(1, 1, 1)), color: '#3a3530' }); }
  }
  B.add('metal', cy(0.02, 0.02, 0.04, 8), { color: '#3a3530' });
  B.build(swing, { name: 'bakerySign' });
  for (const s of [1, -1]) { const m = texMesh(new THREE.PlaneGeometry(w - 0.02, h - 0.02), tex, { rough: 0.7 }); m.position.set(0, -o.drop - h / 2, s * 0.0262); if (s < 0) m.rotation.y = Math.PI; swing.add(m); }
  root.userData.set = (t, s = {}) => { swing.rotation.z = (s.swing ?? 0) + 0.015 * noise1(t * 0.6, 4); };
  return root;
}
function wrapLines(g, text, maxW) {
  const words = String(text).split(/\s+/), lines = []; let cur = '';
  for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
export function makeLetter(opts = {}) {
  const o = { w: 0.3, h: 0.4, title: '', lines: [], text: '', hand: true, fold: 0, ink: '#23324f', ...opts };
  const root = makeTextCard({ w: o.w, h: o.h, draw(g, W, H) {
    paperBg(g, W, H, '#fbf8ee', rng(171));
    g.strokeStyle = 'rgba(120,150,200,0.35)'; g.lineWidth = 2; for (let y = H * 0.18; y < H * 0.95; y += H * 0.055) { g.beginPath(); g.moveTo(W * 0.06, y); g.lineTo(W * 0.94, y); g.stroke(); }
    g.strokeStyle = 'rgba(220,80,80,0.4)'; g.beginPath(); g.moveTo(W * 0.12, 0); g.lineTo(W * 0.12, H); g.stroke();
    const fam = o.hand ? `italic 700 ${Math.round(H * 0.042)}px ${SERIF}` : `400 ${Math.round(H * 0.036)}px ${SANS}`;
    g.fillStyle = o.ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    let y = H * 0.12;
    if (o.title) { g.font = `italic 900 ${Math.round(H * 0.06)}px ${SERIF}`; fitFont(g, o.title, W * 0.8, Math.round(H * 0.06), 'italic 900', SERIF); g.fillText(o.title, W * 0.15, y); }
    g.font = fam;
    const lines = o.lines.length ? o.lines : wrapLines(g, o.text, W * 0.78);
    y = H * 0.18 - H * 0.008;
    lines.forEach((ln) => { y += H * 0.055; g.font = fam; fitFont(g, ln, W * 0.8, Math.round(H * 0.042), o.hand ? 'italic 700' : '400', o.hand ? SERIF : SANS); g.fillText(ln, W * 0.15, y); });
  } });
  const P = root.userData.face.geometry.attributes.position;
  const base = Float32Array.from(P.array);
  root.userData.set = (t, s = {}) => {
    const f = clamp(s.fold ?? o.fold, 0, 1);
    for (let k = 0; k < P.count; k++) { const y = base[k * 3 + 1]; P.setZ(k, base[k * 3 + 2] + Math.abs(y) * Math.sin(f * 1.2) * 0.5); }
    P.needsUpdate = true;
  };
  root.userData.set(0, {});
  return root;
}
export function makeStickyNote(opts = {}) {
  const o = { text: 'BUY PICKLES!!', color: '#ffe66b', size: 0.17, ink: '#1f2a44', curl: 0.4, ...opts };
  const root = makeTextCard({ w: o.size, h: o.size, px: 512, thick: 0, draw(g, W, H) {
    paperBg(g, W, H, o.color, rng(181), 0.04);
    g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, 0, W, H * 0.12);
    g.font = `700 80px ${SANS}`; let size = 80, lines;
    for (; size > 20; size -= 4) { g.font = `700 ${size}px ${SANS}`; lines = wrapLines(g, o.text, W * 0.84); if (lines.length * size * 1.15 < H * 0.78) break; }
    const y0 = H * 0.56 - (lines.length - 1) * size * 0.575;
    lines.forEach((ln, i) => paintText(g, ln, W / 2, y0 + i * size * 1.15, { size, maxW: W * 0.86, color: o.ink, weight: '700', r: rng(191 + i), jitter: 0.05 }));
  } });
  const P = root.userData.face.geometry.attributes.position, hs = o.size / 2;
  for (let k = 0; k < P.count; k++) { const x = P.getX(k), y = P.getY(k); const d = Math.max(0, (x - y) / (2 * hs) - 0.3); P.setZ(k, P.getZ(k) + d * d * o.curl * o.size); }
  P.needsUpdate = true; root.userData.face.geometry.computeVertexNormals();
  root.userData.face.material.side = THREE.DoubleSide;
  return root;
}
export function makeCalendar(opts = {}) {
  const o = { w: 0.42, h: 0.58, month: 'NOVEMBER', start: 5, days: 30, marks: { 12: 'circle', 20: 'x', 28: 'DUE?' }, ...opts };
  const root = makeTextCard({ w: o.w, h: o.h, thick: 0.004, draw(g, W, H) {
    paperBg(g, W, H, '#fbfaf5', rng(201));
    // picture: lanterns on a dusk street
    const ph = H * 0.42;
    const grd = g.createLinearGradient(0, 0, 0, ph); grd.addColorStop(0, '#f2a861'); grd.addColorStop(1, '#6d4a7a'); g.fillStyle = grd; g.fillRect(W * 0.04, H * 0.05, W * 0.92, ph);
    g.fillStyle = '#3a2a3e'; g.fillRect(W * 0.04, H * 0.05 + ph * 0.62, W * 0.92, ph * 0.38);
    for (let k = 0; k < 5; k++) { const x = W * (0.2 + k * 0.15), y = H * 0.05 + ph * 0.35; const gg = g.createRadialGradient(x, y, 0, x, y, W * 0.06); gg.addColorStop(0, 'rgba(255,230,160,1)'); gg.addColorStop(0.4, 'rgba(255,190,110,0.8)'); gg.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gg; g.beginPath(); g.arc(x, y, W * 0.06, 0, TAU); g.fill(); }
    g.fillStyle = '#c0392b'; g.font = `900 ${Math.round(H * 0.05)}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.month, W / 2, H * 0.53);
    const gx = W * 0.05, gy = H * 0.57, cw = W * 0.9 / 7, ch = H * 0.39 / 6;
    g.font = `700 ${Math.round(ch * 0.32)}px ${SANS}`; g.fillStyle = '#555';
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, i) => g.fillText(d, gx + cw * (i + 0.5), gy + ch * 0.3));
    g.strokeStyle = '#bbb'; g.lineWidth = 1.5;
    for (let d = 1; d <= o.days; d++) {
      const idx = d - 1 + o.start, cx = gx + cw * (idx % 7), cyy = gy + ch * (0.6 + Math.floor(idx / 7));
      g.strokeRect(cx, cyy, cw, ch);
      g.fillStyle = '#333'; g.font = `700 ${Math.round(ch * 0.34)}px ${SANS}`; g.textAlign = 'left'; g.fillText(String(d), cx + cw * 0.1, cyy + ch * 0.28);
      const m = o.marks[d];
      if (m === 'circle') crayonStroke(g, (gg, ox, oy) => gg.ellipse(cx + cw / 2 + ox, cyy + ch / 2 + oy, cw * 0.46, ch * 0.44, 0.1, 0, TAU), { color: '#e8483b', width: 4, r: rng(d) });
      else if (m === 'x') crayonStroke(g, (gg, ox, oy) => { gg.moveTo(cx + 6 + ox, cyy + 6 + oy); gg.lineTo(cx + cw - 6, cyy + ch - 6); gg.moveTo(cx + cw - 6 + ox, cyy + 6); gg.lineTo(cx + 6, cyy + ch - 6 + oy); }, { color: '#e8483b', width: 4, r: rng(d) });
      else if (typeof m === 'string') { g.fillStyle = '#c0392b'; g.textAlign = 'center'; fitFont(g, m, cw * 0.9, Math.round(ch * 0.36), 'italic 700', SERIF); g.fillText(m, cx + cw / 2, cyy + ch * 0.7); }
    }
  } });
  const B = new Batch();
  for (let k = 0; k < 12; k++) B.add('metal', new THREE.TorusGeometry(0.009, 0.002, 4, 10), { pos: [-o.w / 2 + 0.03 + k * (o.w - 0.06) / 11, o.h / 2 - 0.006, 0.004], rot: [0, Math.PI / 2, 0], color: '#9a9ea6' });
  B.add('metal', cy(0.006, 0.006, 0.03, 6), { pos: [0, o.h / 2 + 0.02, -0.01], rot: [Math.PI / 2, 0, 0], color: '#555' });
  B.build(root, { name: 'calendarRings', cast: false });
  return root;
}
export function makePhone(opts = {}) {
  const o = { w: 0.13, title: 'Mom', lines: [{ from: 'mom', text: 'home in 5 ❤' }, { from: 'me', text: 'ok' }], on: 1, glow: 1.2, lock: false, time: '23:58', ...opts };
  const w = o.w, h = w * 2.05;
  const root = rootProp('phone');
  const B = new Batch();
  B.add('gloss', rb(w, h, 0.016, 0.014), { color: '#1b1c20' });
  B.add('metal', rb(w * 0.3, 0.004, 0.005, 0.002), { pos: [w * 0.51, h * 0.2, 0], rot: [0, 0, Math.PI / 2], color: '#55585e' });
  B.build(root, { name: 'phone', cast: false });
  const SW = 512, SH = Math.round(512 * (h - 0.012) / (w - 0.012)), [c, g] = cvs(SW, SH);
  g.fillStyle = '#0f1218'; g.fillRect(0, 0, SW, SH);
  g.fillStyle = '#e8eaf0'; g.font = `700 26px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(o.time, 28, 30); g.textAlign = 'right'; g.fillText('▮▮▮ 82%', SW - 24, 30);
  if (o.lock) {
    g.textAlign = 'center'; g.font = `200 150px ${SANS}`; g.fillText(o.time, SW / 2, SH * 0.25);
    g.font = `700 30px ${SANS}`; g.fillText('Tuesday', SW / 2, SH * 0.35);
  } else {
    g.fillStyle = '#1c2230'; g.fillRect(0, 60, SW, 90); g.fillStyle = '#e8eaf0'; g.textAlign = 'center'; g.font = `900 40px ${SANS}`; g.fillText(o.title, SW / 2, 105);
    let y = 190;
    for (const ln of o.lines) {
      const mine = ln.from === 'me';
      g.font = `700 36px ${SANS}`;
      const lines = wrapLines(g, ln.text, SW * 0.62), bw = Math.min(SW * 0.72, Math.max(...lines.map((l) => g.measureText(l).width)) + 44), bh = lines.length * 46 + 30;
      const x = mine ? SW - 24 - bw : 24;
      g.fillStyle = mine ? '#3f7cf0' : '#2c3242'; roundRect(g, x, y, bw, bh, 26); g.fill();
      g.fillStyle = '#ffffff'; g.textAlign = 'left'; lines.forEach((l, i) => g.fillText(l, x + 22, y + 38 + i * 46));
      y += bh + 22;
    }
  }
  const screen = texMesh(new THREE.PlaneGeometry(w - 0.012, h - 0.012), ctex(c), { rough: 0.2, emissive: o.glow });
  screen.material.color.set('#000000'); screen.position.z = 0.0082; root.add(screen);
  root.userData.screen = screen;
  root.userData.set = (t, s = {}) => { screen.material.emissiveIntensity = (s.glow ?? o.glow) * (s.on ?? o.on); };
  root.userData.set(0, {});
  return root;
}
function tapePieces(B, w, h) {
  for (const s of [-1, 1]) B.add('plain', rb(0.06, 0.022, 0.002, 0.001), { pos: [s * w * 0.38, h / 2 - 0.004, 0.003], rot: [0, 0, s * -0.5], color: '#efe6c8' });
}
export function makeCrayonDrawings(opts = {}) {
  const o = { count: 7, ringed: 4, w: 0.28, h: 0.2, gap: 0.04, ...opts };
  const root = rootProp('crayonDrawings');
  for (let i = 0; i < o.count; i++) {
    const card = makeTextCard({ w: o.w, h: o.h, px: 384, thick: 0.001, draw(g, W, H) {
      const r = rng(211 + i * 13);
      paperBg(g, W, H, '#fdfcf7', r, 0.03);
      crayonStroke(g, (gg, ox, oy) => { gg.moveTo(W * 0.06 + ox, H * 0.22 + oy); gg.lineTo(W * 0.94, H * 0.2 + oy); }, { color: '#7a4a24', width: 7, r });
      for (let k = 0; k < 5; k++) {
        const x = W * (0.16 + k * 0.17), y = H * 0.55 + (r() - 0.5) * H * 0.06;
        crayonStroke(g, (gg, ox) => { gg.moveTo(x + ox, H * 0.22); gg.lineTo(x, y - W * 0.06); }, { color: '#555', width: 3, passes: 1, r });
        g.save(); g.beginPath(); g.arc(x, y, W * 0.065, 0, TAU); g.clip();
        crayonStroke(g, (gg) => { for (let q = -6; q <= 6; q++) { gg.moveTo(x - W * 0.08, y + q * W * 0.012); gg.lineTo(x + W * 0.08, y + q * W * 0.012 - W * 0.03); } }, { color: '#ffcf1f', width: 5, passes: 2, r, alpha: 0.9 });
        g.restore();
        crayonStroke(g, (gg, ox, oy) => gg.arc(x + ox, y + oy, W * 0.066, 0, TAU), { color: '#e3a400', width: 3, passes: 2, r });
        if (k === o.ringed) crayonStroke(g, (gg, ox, oy) => gg.ellipse(x + ox, y + oy, W * 0.11, H * 0.24, 0.2, 0, TAU), { color: '#e8302b', width: 6, passes: 3, r });
      }
      g.fillStyle = '#3f6fb8'; g.font = `900 ${Math.round(H * 0.14)}px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(String(i + 1), W * 0.05, H * 0.76);
    } });
    const B = new Batch(); tapePieces(B, o.w, o.h); B.build(card, { name: 'tape', cast: false });
    card.position.set((hash(i * 3.7) - 0.5) * 0.03, -o.h / 2 - i * (o.h + o.gap), 0.002 * (i % 2));
    card.rotation.z = (hash(i * 5.1) - 0.5) * 0.12;
    root.add(card);
  }
  return root;
}
export function makeDoorSign(opts = {}) {
  const o = { text: 'NO BROTHERS', headphones: true, w: 0.4, h: 0.28, ...opts };
  const root = makeTextCard({ w: o.w, h: o.h, px: 768, thick: 0.001, draw(g, W, H) {
    const r = rng(231);
    paperBg(g, W, H, '#fffdf6', r, 0.03);
    crayonText(g, o.text, W / 2, H * 0.24, { size: H * 0.22, maxW: W * 0.9, color: '#7b3fc4', r });
    if (o.headphones) {
      const cx = W / 2, cyy = H * 0.66, R = H * 0.2;
      crayonStroke(g, (gg, ox, oy) => gg.arc(cx + ox, cyy + oy, R, Math.PI * 1.05, Math.PI * 1.95), { color: '#222', width: 9, r });
      for (const s of [-1, 1]) crayonStroke(g, (gg, ox, oy) => gg.ellipse(cx + s * R + ox, cyy + R * 0.25 + oy, R * 0.28, R * 0.42, 0, 0, TAU), { color: '#222', width: 8, r });
      crayonStroke(g, (gg, ox, oy) => { gg.moveTo(cx - R * 1.6 + ox, cyy - R * 1.1); gg.lineTo(cx + R * 1.6, cyy + R * 1.2 + oy); gg.moveTo(cx + R * 1.6 + ox, cyy - R * 1.1); gg.lineTo(cx - R * 1.6, cyy + R * 1.2 + oy); }, { color: '#e8302b', width: 12, r });
    }
  } });
  const B = new Batch(); tapePieces(B, o.w, o.h); B.build(root, { name: 'tape', cast: false });
  return root;
}

/** catalogue: name → factory (for turntables / look-dev). */
export const PROP_KIT = {
  lantern: makeLantern, lanternRow: makeLanternRow, wardrobe: makeWardrobe, hallTable: makeHallTable, familyPhoto: makeFamilyPhoto,
  doormat: makeDoormat, coatHooks: makeCoatHooks, torch: makeTorchProp, stool: makeStool, stepLadder: makeStepLadder, broom: makeBroom, fryingPan: makeFryingPan,
  screwdriver: makeScrewdriver, cardboardBox: makeCardboardBox, cobweb: makeCobweb, loaf: makeLoaf, eyeGlints: makeEyeGlints,
  raccoonTail: makeRaccoonTail, crib: makeCrib, cribBox: makeCribBox, instructionSheet: makeInstructionSheet, paintTin: makePaintTin,
  paintRoller: makePaintRoller, paintTray: makePaintTray, pickleJar: makePickleJar, iceCreamTub: makeIceCreamTub, pickle: makePickle,
  ultrasound: makeUltrasound, parcel: makeParcel, socks: makeSocks, bakerySign: makeBakerySign, letter: makeLetter,
  stickyNote: makeStickyNote, calendar: makeCalendar, phone: makePhone, crayonDrawings: makeCrayonDrawings, doorSign: makeDoorSign,
  dustBurst: makeDustBurst,
};
