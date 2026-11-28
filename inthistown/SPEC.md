# In This Town — "Chess" episode: build spec

A 9:16 TikTok (1080×1920, 30 fps, ~85 s) in the style of the viral **"In this town, everybody goes out
partying… except me. HUSS! HUSS!"** meme format: a first-person narrator, a blocky 3D toy-figure world,
one bold word-at-a-time caption, and a sharp "HUSS!" (effort grunt) every time the hero grinds.

Everything is **original**: our own characters, town and story. Do not copy any creator's mascot, logo,
watermark or text. Generic "blocky toy figure" style is fine; recreating a specific game's or creator's
character is not.

Rendering is Three.js in headless Chromium (SwiftShader software WebGL, 4 CPUs) captured frame by frame
with Playwright, encoded by ffmpeg. Audio (Kokoro TTS narration + synthesized HUSS/SFX/music) is
produced separately and described by `audio/timeline.json`.

---------------------------------------------------------------------------------------------------
## 1. Layout

```
inthistown/
  SPEC.md                ← this file
  story/script.json      ← the story, beat by beat (source of truth for narration)
  audio/timeline.json    ← produced by the audio pipeline (word/huss timings, music cues)
  audio/mix.wav          ← final soundtrack
  src/characters.js      ← makeCharacter(), makeCreature()            (module A)
  src/world.js           ← buildTown(), buildRoom()                     (module B)
  src/props.js           ← chess set, clock, cake, bed, etc.            (module C)
  src/engine.js          ← timeline + shot player + captions            (module D)
  src/shots.js           ← the film itself: cast, sets, shot list       (written last, by the director)
  src/lib/*.js           ← small shared helpers (see §4)
  index.html             ← the film page (module D)
  render.mjs             ← frame capture → ffmpeg (module D)
  dev/<name>.html        ← one visual test page per module
  tools/serve.mjs        ← static server (+ CHROME_ARGS)  — exists
  tools/snap.mjs         ← screenshot a dev page          — exists
  node_modules/three     ← three@0.170.0
  node_modules/@fontsource/nunito, @fontsource/luckiest-guy
```

Every page uses this import map (paths relative to the project root, pages are served from the root):

```html
<script type="importmap">
{ "imports": {
    "three": "/node_modules/three/build/three.module.js",
    "three/addons/": "/node_modules/three/examples/jsm/"
} }
</script>
```

Visual check: `node tools/snap.mjs dev/characters.html out/preview/characters.png --w=540 --h=960`
(the page must set `window.__ready = true` after its frame is rendered; page console errors are
printed). Then `Read` the PNG to look at it. Iterate until it looks good.

---------------------------------------------------------------------------------------------------
## 2. Hard rules (all modules)

* **ES modules, plain JS, no build step.** Only `three` and `three/addons/...` imports, plus our own
  files. No CDNs (the network blocks them).
* **Deterministic.** No `Math.random()`, no `Date.now()`/`performance.now()` inside anything that
  affects pixels. Use `rng(seed)` from `src/lib/util.js`. Every animated thing is a **pure function of
  time** passed in: `update(t)` / `pose(action, t)` must give the same image for the same `t` no matter
  what was called before (the renderer may jump to any time, render shots out of order, or render a
  time twice). So: set absolute values each call, never accumulate (`x += ...`).
* **Units & axes:** metres, Y up. Characters stand on y = 0, origin at feet centre, **facing +Z**.
  A standard character is **2.0 units tall** (head top) — see §5.
* **Performance (software GPU!).** Keep it cheap: share geometries/materials (cache them at module
  level), prefer `InstancedMesh` for repeated things (crowds of lights, bubbles, trees, windows),
  ≤ ~400 draw calls per set, at most 1 shadow-casting directional light per set with a ≤ 2048 shadow
  map, no post-processing, no transparency-heavy particle soups. Target < 150 ms per 720×1280 frame.
* **Look:** bright, saturated, toy-like. `MeshStandardMaterial` (roughness 0.6–0.9, metalness 0),
  `RoundedBoxGeometry` (from `three/addons/geometries/RoundedBoxGeometry.js`) for blocky parts with a
  small bevel, simple low-poly shapes elsewhere. Faces are painted on with `CanvasTexture`.
  Renderer (module D owns it): `ACESFilmicToneMapping`, exposure ~1.0, `SRGBColorSpace` output,
  `PCFSoftShadowMap`. Colour textures you create must set `texture.colorSpace = THREE.SRGBColorSpace`.
* Each module ships a **dev page** that shows off everything it exports (a "turntable"/contact-sheet
  of variants is ideal) and sets `window.__ready = true`.
* Keep exports and signatures **exactly** as written below (other modules code against them). You may
  add extra exports/options; document them in a header comment at the top of your file.

---------------------------------------------------------------------------------------------------
## 3. Palette (suggested)

Night party sky `#151a3a → #2b2f6b`, party lights `#ff4fa3 #ffd23f #3ee0c8 #8a5cff #ff7a2f #4fb3ff`,
grass `#4caf50`/`#3c8f45`, road `#3a3d46`, pavement `#b9b4ad`, warm windows `#ffd27a`,
house walls `#e9d8b5 #c9e4f2 #f2c4c4 #d6e8c4 #f3e3a5 #cbbfe6`, roofs `#b5543f #4a5d7e #6b4a3a #3f7a5a`.
Chess board `#f0d9b5 / #b58863` (classic), pieces ivory `#f5efe0` and ebony `#2a2626`.

---------------------------------------------------------------------------------------------------
## 4. Shared helpers — `src/lib/util.js` (ALREADY WRITTEN by the director — import from it; you may ADD helpers but never change existing signatures)

```js
export function rng(seed)            // → () => float in [0,1), mulberry32
export const clamp = (x, a, b) => ...
export const lerp = (a, b, u) => ...
export const smooth = (u) => u*u*(3-2*u)          // smoothstep 0..1 (clamped)
export const ease = { linear, inQuad, outQuad, inOutQuad, inCubic, outCubic, inOutCubic, outBack, outElastic, inOutSine }
export function pingpong(t, period)  // 0..1..0
export function hash(n)              // deterministic float [0,1) from integer/float
export function noise1(t, seed=0)    // smooth value noise in [-1,1], for handheld shake / wobble
export function canvasTexture(w, h, drawFn)  // makes canvas, calls drawFn(ctx,w,h), returns SRGB CanvasTexture
export function rbox(w, h, d, r=0.06, seg=2) // cached RoundedBoxGeometry(w,h,d,seg,r)
export function mat(color, opts={})          // cached MeshStandardMaterial by color+opts (roughness default .8)
```

Module-specific helpers go in your own file. Only add to util.js if it is genuinely shared.

---------------------------------------------------------------------------------------------------
## 5. Module A — `src/characters.js`

Blocky toy figures, **2.0 units tall**, original design: rounded-box head (~0.62 cube, slightly wider than
deep) with a painted face, rounded-box torso (~0.62 tall), arms (pivot at shoulder), legs (pivot at hip),
chunky hands and shoes. Joints are separate `Object3D` pivots so poses are just rotations.

```js
export const CHARACTER_HEIGHT = 2.0;
export function makeCharacter(spec) → Character
export function makeCreature(kind /* 'pigeon' | 'cat' */, spec = {}) → Character
```

`spec` (all optional, sensible defaults):
```js
{
  id: 'me',
  skin: '#f1c7a1',
  hair: { style: 'short'|'fade'|'curly'|'spiky'|'bun'|'long'|'afro'|'bald'|'grandpa', color: '#2b1d14' },
  top: { style: 'hoodie'|'tee'|'cardigan'|'suit'|'dress', color: '#1d1d22', accent: '#ffffff',
         emblem: null|'knight'|'star'|'stripe'|'heart'|'number' },   // emblem painted on chest
  bottom: { style: 'pants'|'shorts'|'skirt', color: '#55575e' },
  shoes: '#f2f2f2',
  accessories: [],   // any of: 'headphones' (around neck), 'glasses', 'sunglasses', 'mustache', 'beard',
                     // 'topHat', 'sash' (mayor sash, accent colour), 'partyHat', 'cap', 'bowtie', 'chain', 'blindfold'
  partyHatColor: '#ff4fa3',
  eyeColor: '#1b1b1b',
  scale: 1.0,        // overall size (kids 0.85, grandad 0.95, mayor 1.05)
  build: 1.0,        // width multiplier (mayor 1.2)
}
```

`Character` object:
```js
{
  id, root,                 // THREE.Group, feet at origin, facing +Z, castShadow on meshes
  joints: { hips, torso, head, armL, armR, foreArmL?, foreArmR?, legL, legR },   // Object3D pivots
  pose(action, t, params = {}),   // set ALL joints for `action` at local time t (seconds). Pure.
  face(expr, t = 0),              // swap painted face. Expressions below. `t` lets it blink (blink every ~3.1 s, 0.12 s long, deterministic).
  setAccessory(name, on),         // toggle accessory meshes (party hats get added/removed per shot)
  setPartyHatColor(hex),
  dispose?()
}
```
`pose` actions (all loop naturally over t; `params.speed` multiplies tempo, `params.intensity` 0..1):
`idle` (breathing bob), `dance` (arms up/down, hip sway, bounce), `dance2` (different: side-step + arm
pump), `walk` (in place — the shot moves root), `sit` (on a chair, seat height 0.55), `sitSlam`
(seated, right arm raises and slams down onto a table in front — params.hits: array of local times of
impacts; arm must be at the lowest point exactly at each impact time; between hits it lifts back up),
`slam` (standing version of sitSlam), `laugh` (lean back, shoulders shaking, clutching belly),
`point` (right arm points forward, body leans), `clap`, `cheer` (both arms up), `surprised` (jump back
slightly, arms out), `shrug`, `think` (hand on chin), `peer` (lean forward squinting at a table),
`crowdSurf` (body horizontal, face up, arms flailing; the shot carries it on hands), `walkSad`
(slump), `stunned` (frozen, arms limp, slight wobble), `wave`, `sitIdle` (seated breathing),
`sitStand` (params.u 0..1 from sitting to standing).
Plus `params.headYaw`, `params.headPitch` (radians) added on top of any action, and
`params.lookAt` (THREE.Vector3 world point; turns head toward it, clamped).

`face` expressions: `neutral`, `smile`, `grin`, `laugh` (^ ^ eyes, big open mouth), `determined`
(angled brows, firm mouth — the HUSS face), `huss` (eyes squeezed, mouth open shouting), `shocked`
(round eyes, O mouth), `sad`, `smug`, `squint` (can't see), `sweat` (worried + sweat drop),
`sleepy`, `wink`. Faces are bold and readable at phone size (thick strokes, simple shapes). For the
pigeon/cat, map the same names to sensible equivalents.

Creatures:
* `pigeon` (~0.45 tall, grey-blue with iridescent green/purple neck band, orange eye, little feet;
  can wear `partyHat`). Actions: `idle`, `peck`, `strut` (head bob walk in place), `flap`, `huss`
  (chest puffs up, beak opens wide — comedic), `knock` (sweeping wing swipe), `sit`.
* `cat` (~0.5 tall, orange tabby, blocky). Actions: `idle`, `hop` (crouch → jump arc driven by
  params.u 0..1, the shot moves root along an L path), `sit`, `loaf`, `stare`.

Dev page `dev/characters.html`: line-up of the cast below doing different actions/expressions, plus a
close-up of the hero's face in `determined` and `huss`. Example cast to show (the director will use
specs like these):
* **me** (the hero — the viewer's avatar): skin `#f1c7a1`, hair `fade` `#2b1d14`, black hoodie
  `#1d1d22` with a white **knight** emblem, grey pants, white shoes, white `headphones` around neck.
* **marcus**: tee `#ff7a2f`, hair `curly` `#1a120c`, skin `#8d5a3b`, shorts `#2f4d8a`, `chain`.
* **brenda**: dress `#8a5cff`, hair `bun` `#c0392b`, skin `#f4d0b5`, `sunglasses`.
* **grandad**: cardigan `#6b8e5a`, hair `grandpa` `#e8e8e8`, `glasses`, `mustache`, scale 0.95.
* **mayor**: suit `#7a1f2b`, `topHat`, `sash` (gold `#ffd23f`), `mustache`, build 1.2, scale 1.05.
* **heckler**: tee `#3ee0c8`, hair `spiky` `#f0c419`, `partyHat`.

---------------------------------------------------------------------------------------------------
## 6. Module B — `src/world.js`

Sets are self-contained (own lights, own sky/background, own fog). The engine shows one set at a time.

```js
export function buildTown(opts = {}) → Set
export function buildRoom(opts = {}) → Set
```

`Set` object:
```js
{
  root,                         // THREE.Group (add to scene)
  anchors: { name: THREE.Object3D },  // named empty Object3Ds placed in the set (use .getWorldPosition / copy transforms)
  setLighting(preset),          // see presets per set
  update(t),                    // animate ambient things as a pure function of t (lights twinkle, water, bubbles, fireworks)
  options: {...}                // current option state
  set(key, value)               // runtime toggles listed below
}
```
The set also manages `scene.background`/`scene.fog`-like looks itself: expose `background` (THREE.Color
or Texture) and `fog` (THREE.Fog|null) properties; the engine copies them onto the scene when the set is
shown.

### `buildTown({ seed })` — one compact party town (think 120 × 120 m), all locations in one map:
* Streets with pavements, lamp posts, a few parked blocky cars, trees (instanced low-poly), hills and a
  starry sky dome, a moon. Houses: ~14 varied two-storey houses with lit windows (instanced or
  merged), pitched roofs, doors. Windows must be able to light up individually (see `windowGlow`).
* **Locations (each with anchors)**:
  * `myHouse` — the hero's house on a quiet corner; an upstairs window the camera can push into.
    Anchors: `myHouse.front`, `myHouse.window` (outside the upstairs window, facing out), `myHouse.door`.
  * `street` — main street running through town with **string lights zig-zagging across**, party
    crowd area. Anchors: `street.center`, `street.crowdA`, `street.crowdB`, `street.camHigh` (a good
    crane position looking down the street), `street.farEnd`.
  * `pool` — a backyard pool party: pool (animated water), float ring, deck chairs, speaker, bunting.
    Anchors: `pool.center`, `pool.edge1..4`, `pool.cam`.
  * `foam` — a side street where a foam cannon fills the area with foam (instanced white spheres
    heaped 0–1.2 m high, gently wobbling). Anchors: `foam.center`, `foam.cannon`, `foam.cam`.
  * `square` — the town square: a stage with a **long table** (top at y = 1.05 above stage floor…
    keep the table top height at stage floor + 0.78) where a chess board will sit, two chairs facing
    each other across the table (anchors `square.chairA` faces +X... see below), bleachers on two sides
    for a crowd, a big banner over the stage reading **SUMMER PARTY CHESS MATCH** (canvas texture,
    bold, festive), bunting, balloons, a scoreboard-like "♞ vs ♚" sign. Anchors: `square.center`,
    `square.table` (centre of table top surface), `square.chairA` (hero's seat; character root placed
    here sits correctly with action `sit`, facing the table), `square.chairB` (opponent, facing
    hero), `square.standA`, `square.standB` (bleacher centres; each has rows — expose
    `square.standA.rows` as an array of row anchors with `.userData.width`), `square.cam1`,
    `square.cam2`.
  * `park` — small park corner with a stone chess table and two stools under a tree, pigeons
    welcome. Anchors: `park.table` (table top centre), `park.stool1`, `park.stool2`, `park.cam`.
* **Lighting presets**: `party_night` (deep blue night, warm windows, colourful string lights glowing,
  lamp posts on, everything festive), `quiet_night` (same night but string lights OFF, no party
  props glow, lamp posts dim, windows lit in cool white — the eerie "something was wrong" mood),
  `dusk` (orange-pink sunset sky — for the chess match), `day` (bright sunny — for the ending).
* `set(key, value)` toggles: `partyProps` (bool — bunting/balloons/string lights/speakers visible),
  `foam` (0..1 amount), `windowGlow` (function(houseIndex, windowIndex) → 0..1 or a number for all),
  `fireworks` (bool; deterministic bursts over the town in `update(t)`).
* Anchor list for houses: `house.<i>.window.<j>` for a handful of front windows that face the street
  (outside, facing out) — used for the "HUSS from every window" shot. Also `houses` array in anchors
  with `{ index, position, windows: [Object3D] }`.

### `buildRoom({ wall, floor, window, poster, variant })` — an interior bedroom/study
* ~4 × 4 m room, 3 walls + floor + ceiling-less (camera can see in from the 4th side, which is open).
  Desk (top at y = 0.78) against a wall with a desk lamp and a chair; bed; a window with curtains
  showing an outside view; a door; a shelf with trophies; a rug; a poster (canvas texture — for
  `poster: 'knight'` a bold chess-knight silhouette poster).
* `window`: `'party'` (outside view: night with blurred colourful party lights flickering — a painted
  canvas backdrop plane behind the window is fine), `'dark'`, `'day'`, `'sunrise'`.
* `variant`: `'hero'` (default: hero's room), `'marcus'`, `'brenda'`, `'grandad'` — change wall colour,
  bed cover, posters/props so the three neighbour interiors look different.
* Anchors: `room.desk` (desk top centre), `room.chair` (chair position: a character root placed here
  with `sit` faces the desk), `room.bed`, `room.window`, `room.door`, `room.cam` (wide), `room.camClose`.
* Lighting presets: `night` (warm lamp pool, dim room, coloured light spilling from window when
  window = party), `day`, `dawn`.

Dev page `dev/world.html`: contact sheet of camera views (2×3 grid of small renders or one view
selected via `?view=`): town overview at `party_night`, street crowd area, pool, foam street, square at
`dusk`, quiet_night street, park at `day`, hero room at `night`. Render each view into its own canvas or
compose them into one image.

---------------------------------------------------------------------------------------------------
## 7. Module C — `src/props.js`

```js
export function makeChessSet(opts = {}) → ChessSet          // opts.size = board width (default 0.62 m)
export function makeChessClock(opts = {}) → { root, press(side /* 'L'|'R' */, u), setTimes(lSec, rSec), update(t) }
export function makePartyHat(color) → Object3D               // cone with stripes + pom-pom, ~0.32 tall
export function makeCake(opts = {}) → { root, update(t) }    // small birthday cake with flickering candles (pigeon-sized party)
export function makeTable(opts = {}) → Object3D              // generic wooden table, top at y=0.78, opts.w/d
export function makeChair(opts = {}) → Object3D              // seat at y=0.55, back at -Z, faces +Z
export function makeBed(opts = {}) → Object3D                // single bed, origin at floor centre
export function makePlate(opts = {}) → { root, food }        // plate with eggs + toast + bacon (breakfast), food is a Group
export function makeSpeaker(opts = {}) → { root, update(t) } // party speaker with pulsing cone
export function makeBalloon(color) → Object3D
export function makeConfetti(opts = {}) → { root, update(t) }  // deterministic confetti burst, InstancedMesh; opts.origin, opts.t0, opts.count
export function makeSweatDrop() → Object3D                   // stylised blue drop for comedic beats
export function makeImpactBurst() → { root, update(u) }      // comic "slam" star/lines burst on a table, u 0..1
```

`ChessSet`:
```js
{
  root,                 // origin = centre of the board's TOP surface; board lies in XZ plane; white on −Z side (rank 1 at −Z), files a..h along +X
  squareSize,
  reset(),              // standard starting position, everything upright, no animation offsets
  setFEN(fen),          // piece placement only
  squareToLocal(sq) → THREE.Vector3     // 'e4' → local position on board top
  pieceAt(sq) → Object3D|null
  move(from, to, u, opts) // animate: piece lifts on an arc and lands; at u>=1 it is on `to` (captures: the piece on `to` is hidden at u>=0.85). Pure function of u given the position set by reset/setFEN.
  slam(sq, u)           // piece squashes down (scale y 0.75) and springs back; also vibrates neighbouring pieces slightly
  topple(sq, u)         // king tips over and rolls slightly (checkmate)
  knockAll(u, seed)     // all pieces knocked off/over in a deterministic scatter (pigeon chaos)
  highlight(sq, color|null)
}
```
Piece designs: classic Staunton-ish but chunky and toy-like, built from lathe/cylinder/sphere geometry
(knight: blocky horse head built from boxes). Readable silhouettes at phone size. Ivory and ebony
materials. Board has a wooden frame. Coordinates: animations must be **pure** functions of their `u`
argument relative to the last `reset()`/`setFEN()` (calling `move('e2','e4',0.5)` twice gives the same
result; the shot calls `reset()` then applies the moves it needs for the current time).

Chess clock: two-faced wooden clock with two big buttons on top (`press` drives one button down at u≈0.5
and back), two dial faces showing times (canvas texture, update cheaply only when value changes).

Dev page `dev/props.html`: all props on a neutral studio floor, chess set in a mid-game position with a
piece mid-move, a toppled king, the clock, cake, plate, speaker, balloons, confetti mid-burst.

---------------------------------------------------------------------------------------------------
## 8. Module D — `src/engine.js`, `index.html`, `render.mjs`

### Timeline (`audio/timeline.json`, produced by the audio pipeline)
```json
{
  "fps": 30, "duration": 86.4, "audio": "audio/mix.wav",
  "beats": [ { "id": "b01", "speaker": "narr", "kind": "line", "text": "In this town, everybody goes out partying.",
               "start": 0.25, "end": 2.71,
               "words": [ { "text": "In", "start": 0.25, "end": 0.38 }, ... ] },
             { "id": "b03", "speaker": "me", "kind": "huss", "text": "HUSS! HUSS! HUSS! HUSS!", "start": .., "end": ..,
               "words": [ { "text": "HUSS!", "start": 3.10, "end": 3.32 }, ... ] } ],
  "words": [ { "text": "In", "start": 0.25, "end": 0.38, "beat": "b01", "kind": "line", "speaker": "narr", "i": 0 } , ... ],
  "music": [ { "t": 0, "mode": "party" }, ... ],
  "markers": { "musicStop": 61.2 }
}
```
`kind`: `line` (narration), `quote` (a character speaking — speaker is `marcus`, `heckler`, `me`…),
`huss` (each word is one HUSS!), `sfx` (non-spoken caption like `*crowd laughs*` — usually hidden).

### Anchor strings (used by shots)
`'b05'` = start of beat b05 · `'b05.end'` = its end · `'b05.w2'` = start of word index 2 in beat b05 ·
`'b05.h1'` = start of HUSS index 1 in that beat (same as w1 for huss beats) · optional offset suffix
`'+0.15'` / `'-0.2'` (seconds) · or a plain number of seconds.
`engine.time(anchor) → seconds`.

### Film contract — what `src/shots.js` exports (the director writes this file; engine consumes it)
```js
export const cast = { me: {...characterSpec}, marcus: {...}, pigeon: { creature: 'pigeon', ... }, ... };
export const sets = { town: (ctx) => buildTown({seed:3}), room: (ctx) => buildRoom({...}), ... }; // lazy, built once on first use
export const shots = [
  { name: 'opening crane', start: 'b01',          // shot runs until the next shot's start (last runs to the end)
    set: 'town',
    setup(ctx) { /* reset everything this shot uses: lighting, actor placement, props */ },
    update(ctx, lt, u) { /* lt = seconds since shot start, u = 0..1 over the shot */ } },
  ...
];
```
Shots are listed in time order. `setup(ctx)` runs whenever the active shot changes (including when the
renderer jumps backwards); `update` runs every frame.

`ctx` (provided by the engine):
```js
{
  THREE, scene, camera (PerspectiveCamera, aspect 9/16), renderer,
  t, dt,                        // global time, frame step
  set,                          // the active set object (also scene.background/fog applied from it)
  getSet(name),                 // lazy build/cache (for props from another set, rarely needed)
  cast: { id: Character },      // all characters, created once from `cast` specs (creatures via makeCreature)
  use(...ids),                  // attach only these characters to the active set (others detached); returns array
  place(char, anchorOrVec3, { yaw = 0, offset = [0,0,0] }) // put a character's root at an anchor (copies world position + rotation, then yaw/offset)
  anchor(name) → Object3D       // active set's anchor
  props: store,                 // a per-film object shots may stash props in (e.g. ctx.props.chess ??= makeChessSet())
  add(obj), remove(obj)         // add/remove extra objects to the active shot (auto-removed when the shot ends)
  time(anchor) → seconds, words, beats, hussTimes(beatId?) → [seconds]
  cam: {
    set({ pos, look, fov, roll }),                         // absolute
    move(from, to, u, easeFn),                             // from/to = {pos, look, fov?, roll?}
    shake(amount, t, seed),                                 // handheld wobble added after move/set (noise based)
    punch(times, t, amount = 0.08, decay = 0.25)            // FOV/dolly kick at each time in `times` (HUSS impacts)
    orbit(center, radius, height, angle, fov)               // convenience
  },
  ease, rng, lerp, clamp, smooth, noise1,                   // from util.js
  caption: { hide(on), style(name) }                        // rarely needed: suppress captions for a shot
}
```

### Captions (drawn by the engine — the signature look)
* One word at a time (the current word = last word whose `start <= t`; shown until the next word starts,
  or until `end + 0.35 s` if there's a gap → then nothing). Centred horizontally at **~57 % of frame
  height**.
* Font: **Nunito 900** (load `/node_modules/@fontsource/nunito/files/nunito-latin-900-normal.woff2` via
  `@font-face`; wait for `document.fonts.ready` before rendering). Narration: white `#ffffff`, thick
  black outline (~12 px at 1080 w), soft drop shadow, ~96 px tall at 1080 w (shrink to fit long words).
* Pop-in: scale 1.18 → 1.0 over 0.10 s with a slight upward 8 px settle.
* `huss` words: **"HUSS!"** in **Luckiest Guy** (fontsource), ~170 px, fill `#ffe14a` with black
  outline, a tiny random tilt (−6°…+6°, deterministic per word) and a 0.12 s shake.
* `quote` words (other characters talking): white text with coloured outline per speaker
  (marcus `#ff7a2f`, heckler `#3ee0c8`, mayor `#d4af37`, otherwise `#ff4fa3`) — or simply a small speaker
  name tag above; keep it readable.
* `sfx` words: hidden by default.
* Captions are composited at full 1080×1920 (crisp) even when the 3D is rendered at a lower internal
  resolution.

### `index.html` + `engine.js`
* Query params: `?timeline=audio/timeline.json` (default), `?scale=0.6667` (3D internal resolution
  factor; default 0.6667 → 720×1280 drawing buffer, composited/upscaled to 1080×1920),
  `?t=12.3` (render that time immediately and set `__ready`), `?shotsModule=/src/shots.js`.
* Exposes `window.__engine = { duration, fps, ready: Promise, renderAt(t) → Promise<void>, frameDataURL(type='image/jpeg', q=0.92) → string, shotAt(t) → {index, name} }`
  and sets `window.__ready = true` after the first requested frame is drawn.
* Engine never uses wall-clock time for animation. `renderAt(t)`: pick shot, run setup if the shot
  changed, set `ctx.t`, call `set.update(t)`, `shot.update(ctx, lt, u)`, render 3D, draw captions.
* If `src/shots.js` is missing or throws, show a clear on-page error (and log it).
* Ship a **demo** `src/shots.demo.js` + `audio/timeline.demo.json` (stub cubes/simple scene, 3 shots,
  fake words incl. HUSS!) so the engine can be tested standalone. Do not depend on modules A–C for
  the demo (they're being written in parallel); the real `shots.js` will import them.

### `render.mjs`
```
node render.mjs [--out out/inthistown.mp4] [--from 0] [--to <duration>] [--fps 30] [--scale 0.6667]
                [--workers 2] [--preview 2.0]   # --preview N: instead of a video, save one PNG every N s
                                                 # to out/preview/t_<sec>.png (+ a contact sheet) for QA
                [--timeline audio/timeline.json] [--shots /src/shots.js] [--crf 18]
```
* Starts `tools/serve.mjs`, launches Chromium with `CHROME_ARGS`, viewport 1080×1920 @ DPR 1.
* Frame capture: fastest reliable method (measure!) — e.g. `frameDataURL('image/jpeg', .92)` from a
  compositing 2D canvas, or `page.screenshot({type:'jpeg'})`. Pipe frames into ffmpeg
  (`-f image2pipe -framerate 30 -i -`), mux `audio/mix.wav` (if present), H.264 `yuv420p` `-crf 18`
  `-preset medium` `-movflags +faststart`, AAC 192k, exactly `duration` long.
* `--workers N`: split the frame range into N contiguous chunks rendered by N browser pages/processes in
  parallel to separate segment files, then concat (stream copy) and mux audio once.
* Prints progress (frames done / total, avg ms per frame, ETA) every ~5 s.
