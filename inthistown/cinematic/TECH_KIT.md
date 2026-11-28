# Photoreal kit report (src/real)

## Photoreal kit: what's done

The kit is in `/home/user/Escape/inthistown/src/real/`. It renders the blocky avatar in a rain-soaked, foggy, high-contrast near-monochrome world. All five test shots render, and I did 9 rounds of look-dev, checking each round's frames by eye.

- **Determinism:** `render.mjs --check-determinism` on 6 probe times gives all 6 identical across orders and processes.
- **Regression:** ep22 renders 13/13 preview frames byte-identical to the engine from before the hook.
- **Speed:** worst steady-state frame is about 3.5 s in-page at scale 0.75. Under `render.mjs` video mode on a loaded host it was 2.8–6.2 s per frame, so three shots go over the 4 s target there (table below).

I did not commit anything. Another worker is committing work-in-progress in `src/real/`: their own `assets.js`, `assets_test_shots.js` and `assets/` (Blender GLBs and HDRs). I didn't touch those. Their test shots may import my modules, so I kept my APIs stable.

### Engine hook (the only change outside src/real)
In `/home/user/Escape/inthistown/src/engine.js`, if the shots module exports `renderFrame(ctx)`, the engine calls it instead of `renderer.render(scene, camera)`. If it throws, the engine falls back to a plain render. The timing stats still include its cost. `ctx.size = {w, h}` (internal resolution) and `ctx.timing` were added; `ctx` already had scene, camera, renderer and t.

## Module APIs (full header comments in each file)

**`textures.js`** — seeded procedural PBR textures, no image files.
- `getPBR(name, opts)` returns `{map (sRGB), normalMap (Sobel), roughnessMap = data (R=ao, G=rough, B=height), height, repeat(rx, ry)}`, cached.
- Names: `bark`, `mud` (leaf litter and twigs), `rock`, `sand`, `planks`, `fabric` (knit), `denim` (twill), `moss`, `leaf`, `leaves`, `fern`, `palm`, `foam`. The foliage textures carry an alpha cut-out.
- Also: `getNoiseTex`, `getCloudTex`, `getOceanNormalTex`, `getRippleTex`, and the helpers `makePerlin(seed)` (periodic, separate x/y periods), `fbm`, `ridged`, `makeWorley`, `heightToNormal`, `makeDataTexture`, `PBR_NAMES`.

**`materials.js`** — material patches and shared uniforms.
- `RU = {uTime, uWind, uFlash, uRain}` are shared uniforms. `setFrame({t, wind, flash, rain})` must be called once per frame, early; any field you omit is reset to its default.
- `pbr(name, {repeat, color, roughness, normalScale, physical, …})`.
- `triplanar(mat, set, {scale, bump, sharpness, space: 'world' | 'object', albedo, slopeTint: {color, amount, up}})`.
- `wetSurface(mat, {wet, puddles, puddleScale, puddleLevel, ripples, rippleScale, puddleColor})` gives animated rain-drop rings in puddles.
- `windSway(mat, {amp, freq, heightScale, flutter})` works with instancing. `foliage(mat, {translucency, wet})`.
- `PRE_RENDER`, `runPreRender`, `inScene`: CPU hooks that run once the camera is final (`post.js` calls them).

**`post.js`** — post-processing.
- `createPost(ctx, {msaa: 0, shadowType, fxLayer: 10, profile})` returns `post` with `.set(cfg)` (per-frame, cleared after each render), `.defaults(cfg)`, `.render(ctx)`, `.stats.ms {scene, atmos, dof, fx, bloom, grade, total}` and `.dispose()`.
- `makeRenderFrame(postOrFactory, {shotKey: 'post'})` applies `ctx.shot.post` (an object or `(ctx, lt, u) => cfg`) each frame.
- Pipeline:
  1. Scene renders into a HalfFloat HDR target with a depth texture.
  2. Atmos pass: depth-reconstructed height fog with parallax noise wisps, glow toward the light, flash-lit fog, optional depth SSAO, and the depth-of-field blur size.
  3. Depth of field: one gather pass, 22 taps.
  4. FX layer 10 (rain), drawn after the depth of field and occluded by the scene, so near streaks stay crisp.
  5. Bloom: dual-filter with Karis prefilter, 5 levels.
  6. Grade straight to screen.
- Config keys: `exposure`, `flash`, `fog{color, density, height, falloff, start, max, sky, noise, noiseScale, wind, sunDir, sunColor, glow, glowPower}`, `ao{radius, intensity, bias}`, `dof{focus, aperture, maxBlur}`, `bloom{strength, threshold, knee, radius}`.
- Grade keys: `{temperature, tint, saturation, bleach, contrast, pivot, blackPoint, whitePoint, lift, gamma, gain, shadowTint, shadowAmt, highlightTint, highlightAmt}`. Also `ca`, `vignette`, `grain` (seeded from t), `letterbox`, `fade{color, amount}`, `fxaa` (on by default), `fx`.

**`env.js`** — environment builders. Each returns `{root, update(t), …}`.
- `makeSky`, `bakeEnvironment(renderer, scene, skyOpts, {groundColor, intensity})` (PMREM).
- `makeTerrain({texture, tile, height | amp, freq, puddles, …})` returns `heightAt`.
- `makeForest({count, area | radius, center, clear, heightAt, placements, lod: 'high' | 'low', castShadow, canopy, vines})`: buttressed trunks, canopy cards, lianas.
- `makeFerns({kind: 'fern' | 'leafy', …})`, `makePalms`, `makeLog`.
- `makeOcean({level, waves, scale, color, deepColor, foam, shore: {z, slope}, follow})`: Gerstner waves, crest and shore foam, and a CPU `heightAt(x, z, t)`.
- `makeBeach` (wet band at the waterline), `makeWreck`, `makeCrate`, `makePlanks`, `makeRock`, `makeCliff`.
- `makeCave` returns `mouth`, `dripTips`, `pool`.
- `makeCampfire` returns `light`, `flames`, `embers`, `smoke`.
- `makeLightRig('forest' | 'beachDusk' | 'night' | 'cave' | 'closeup', {shadows, shadowBox, shadowMap, target, keyDir, intensity, practical})`, then `rig.update(t, flash)`.
- `makeContactShadow`.

**`weather.js`** — weather effects.
- `makeRain({count, box, speed, wind, length, width, color, opacity, lightDir, backlight, near, far, clip, sharp})`. Rain sits on layer 10; pass `sharp: false` if you render without `post.js`.
- `makeSplashes` (laid out through `PRE_RENDER`), `makeDrips({points, floorY, period})`, `makeFogCards({horizontal, …})`, `makeLightShafts`.
- `makeLightning({strikes: [{t, pos, ground, seed, power}]})`. `update(t)` returns the flash level and sets `RU.uFlash`; also `flashDir()` and `strikeAt(t)`.

**`realchar.js`** — character materials.
- `makeReal(character, {wet, drips, detail, sheen, fabricScale, envMapIntensity, clearcoat})` returns `{setWet(v), update(t), material, uniforms}`. `makeRealCast(...)` does several characters.
- Each vertex is classified by colour plus the joint it hangs on into skin, hair, fabric (top/accent), twill (bottom), shoes or plastic. One physical material per character, with object-space triplanar weave bump, sheen, wet clearcoat and water beads.
- The face decal keeps its painted face (`face()` still works) and gets edge falloff and a pore bump. Optional drips fall from the hem, sleeves and chin.

**Test files:** `test_shots.js` and `test_timeline.json` (11 s, 6 shots including a coast overview). They show the `realSet` wrapper pattern and per-shot `post` functions. `window.__realPost` and `window.__realCtx` are test hooks.

## Best frames
All in `/home/user/Escape/inthistown/out/real_test/final/`:

| Frame | What it shows |
|---|---|
| `t_001.00.png` | Rainforest wide: giant buttressed trunk, fog depth, rain |
| `t_003.00.png` | Close-up in rain: crisp streaks, background depth of field |
| `t_005.00.png` | Stormy beach at dusk: swell, crate, silhouette |
| `t_006.00.png` | Night storm sky before the strike |
| `t_006.30.png` | Lightning: jagged branching bolt, white-lit rain, silhouette |
| `t_009.00.png` | Cave campfire: warm-lit sad face, embers, bright cave mouth with stalactites |
| `t_010.50.png` | Sea from above with streaked foam |

Contact sheet: `contact.jpg` in the same folder. The earlier rounds are in `out/real_test/v1` through `v8`. Short encoded clips are `out/real_test/seg_0.mp4` through `seg_8.mp4`.

## Per-frame cost (scale 0.75 = 810×1440, 1 worker, msaa 0 + FXAA)
"Frame" is the steady-state in-page time. The pass columns are profiled (forced GPU syncs).

| Shot | Frame | Scene | Atmos | DOF | Bloom | Grade | render.mjs video mode |
|---|---|---|---|---|---|---|---|
| Rainforest wide | 3.2 s | 2.1–2.5 s | 0.23–0.26 | 0.26–0.29 | 0.07 | 0.12–0.14 | 5.4 s |
| Close-up rain | 3.5 s | 2.7–2.9 s | 0.23–0.30 | 0.23–0.28 | 0.05 | 0.11 | 6.2 s |
| Beach dusk | 1.6 s | 1.0 s | 0.27 | — | 0.06 | 0.14 | 3.1 s |
| Night lightning | 1.4 s | 0.8 s | 0.24 | — | 0.06 | 0.13 | 2.8 s |
| Cave campfire | 2.7 s | 1.9–2.1 s | 0.20–0.22 | 0.26–0.29 | 0.07 | 0.12–0.14 | 5.5 s |

- The video-mode numbers were taken with a load average of about 6 on 4 CPUs, while ffmpeg was also encoding. Timings varied a lot between runs.
- MSAA 4 costs an extra 1–2 s per frame, which is why the default is 0 with FXAA.
- Fog cards, rain, shadows and the character each cost roughly 0.2–0.6 s of scene time. Far trees use `lod: 'low'`.
- The cheapest wins: turn off depth of field (about 0.27 s), fog (about 0.25 s), shadows, or the full-detail forest per shot.

## Known limitations
- **Determinism needs three things:**
  - `lazySets = false`. Sets share cached materials, so building them in a different order changes a few specular pixels.
  - `setFrame` called every frame. It resets the flash; otherwise a lightning flash leaked into later shots.
  - Camera-following CPU work done through `PRE_RENDER`, never in `update()`. `update()` runs before the camera is placed, which caused a one-frame lag. Both bugs were found and fixed this way.
- **Rain needs `post.js`:** it is drawn by the FX pass on layer 10. Use `sharp: false` without it. The first streak version was back-face culled; it is DoubleSide now.
- **Ocean:**
  - Foam is subtle and has little contrast against reflections.
  - The beach dusk sky is a fairly bland bright grey.
  - Sand blows out at the peak of a flash.
  - Palms seen from above look like fish bones.
  - Shadow depth ignores wind sway.
- **Character:**
  - The wet look and fabric weave only read in close-ups.
  - Faces are flat planes, so they need a point light near the subject (`practical`) to get any falloff.
  - The `sit` pose needs a seat object.
- **Depth of field:**
  - Transparent effects (fog cards, light shafts) use the depth of the background behind them.
  - The fire must stay in the focus range, or bloom turns it into a blob.
- **Performance:** the first frame after a cut is slower because lights change and shaders recompile.

## Recommendations for the shot builder
- Copy the `realSet` and `shotPost` patterns from `test_shots.js`. Export `renderFrame = makeRenderFrame(...)` and keep `lazySets = false`.
- In each shot's `update`, call `real.update(t)` and drive lightning with the `ctx.store.flash` pattern: lightning `update` → `sky.setFlash` → `rig.update` → `post.flash` and `environmentIntensity`.
- Composition: 9:16 is horizontally narrow (about 28° at fov 48). A head-and-shoulders shot needs about 2.6–3 m at fov 48–50.
- What works best visually:
  - Backlit silhouettes against bright white fog, a cave mouth or a flash.
  - Light sources in frame: fire, practical lights.
  - Dark foregrounds.
  - Close-ups with rain streaks.
- Set depth-of-field focus to the camera-to-subject distance. Keep plant `clear` radii around camera paths.
- Turn up rain opacity and backlight per close-up through `set.rain.uniforms`, and set the rig and rain state in each shot's `setup`.
- Use `--workers 2` for final renders.
- You could combine the other worker's Blender GLB rocks and wreck and HDR skies from `assets.js` with this post and weather stack for the hero shots.
