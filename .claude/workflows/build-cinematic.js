export const meta = {
  name: 'build-cinematic',
  description: 'Build the photoreal cinematic film src/<ep>/ from its locked script + timeline: sets/look-dev, acts in parallel, critic, fixer, verify/polish loop (Fable 5)',
  whenToUse: 'After episodes/<ep>/script.json + timeline.json exist for a cinematic (photoreal kit) episode. args: { ep: "cine01", title: "...", acts: [{ name, beats: "b01-b09" }, ...] }',
  phases: [
    { title: 'Sets', detail: 'shared kit, sets, cast, look-dev', model: 'fable' },
    { title: 'Acts', detail: 'one shot builder per act, in parallel', model: 'fable' },
    { title: 'Review', detail: 'independent critic on the whole film, fixer', model: 'fable' },
    { title: 'Polish', detail: 'verify → fix loop on critical/high problems', model: 'fable' },
  ],
}
const P = '/home/user/Escape/inthistown'
const EP = args && args.ep
const TITLE = (args && args.title) || EP
const ACTS = (args && args.acts) || []
const MAXR = (args && args.maxRounds) || 2
if (!EP || !ACTS.length) throw new Error('args.ep and args.acts are required')
const D = `${P}/src/${EP}`
const TL = `episodes/${EP}/timeline.json`
const BRIEF = `
You are part of a small film crew making "${TITLE}", ONE ultra-realistic cinematic vertical video (1080x1920, 30 fps, ~90 s) for TikTok, in ${P}. This is not the cartoony "In This Town" look: it is PHOTOREAL. The narrator is the creator's own blocky avatar (cast 'me' = MAIN.me from ${P}/src/cast.js: black hoodie with the white knight emblem, grey pants, white shoes, fade haircut, headphones), rendered with realistic wet materials in a photoreal world. The look: cold, near-monochrome, HIGH CONTRAST (crushed blacks, white fog/foam/lightning/rain highlights), bleach-bypass grade, heavy atmosphere, shallow depth of field on close-ups, slow deliberate camera moves, a little handheld shake. Scary, mysterious, emotional. Every frame should look like a still from an expensive film.
READ FIRST (all of it):
- ${P}/cinematic/TECH_KIT.md — the photoreal kit (src/real/*.js: post.js, env.js, weather.js, materials.js, textures.js, realchar.js) with APIs, costs and known limitations. Then the header comments of each src/real/*.js you use.
- ${P}/src/real/test_shots.js — the working pattern (realSet wrapper, shotPost, makeRenderFrame, lightning flash chain, rain uniforms, light rigs, per-shot post/DOF). ${P}/src/real/assets.js + ${P}/src/real/assets_test_shots.js — Blender hero assets (GLB rocks, cliff wall, sea stack, cave arch, wreck boat, planks, crate, rope, driftwood, palms, kapok/fig trees, ferns, undergrowth, vines; PBR texture sets; storm_day/storm_night HDR skies) and how to load them (await loadAssets in init or set build).
- ${P}/src/engine.js header (ctx API: place, cast, cam.set/shake/punch, fx.text, store, set, props, anchors 'bNN', 'bNN.wK', markers) and ${P}/src/characters.js header (poses, params, face expressions; the emblem mesh is named 'emblem' on the torso — mirror it with scale.x = -1).
- The locked script ${P}/episodes/${EP}/script.json (every beat's 'visual' is the shot brief; 'overlay' = small time stamps; 'clue_list' and 'twist' explain what must be readable on screen) and its timing ${P}/${TL} (word times, beat starts; shot starts are anchors like 'b05', 'b05.w3', 'b05+0.4').
CAPTIONS: this film draws its OWN captions through the engine hook \`export function drawCaptions(g2d, tl, t, state)\` in shots.js (implemented in kit.js by the set department; state.hidden is true when a shot sets captions:false). Styles: REAL for speaker 'narr' (white Inter 600, soft dark shadow, short phrase groups of 2–4 words that build word by word, centred at y≈0.62, never cartoony), COPY for speaker 'copy' (black Inter 700 on a solid white box — the visual tell that the narrator changed), MOM for the timeline's \`tl.subs\` entries with style 'mom' (a small rounded phone-message bubble with the whole line, from t0 to t1), and the single HUSS shout (kind 'huss') as one big white word with a short shake. Fonts: /node_modules/@fontsource/inter/files/inter-latin-{400,500,600,700,800}-normal.woff2 — load them with FontFace in init and await document.fonts. Time stamps ('3:12 AM', '9:40 PM', '6:51 AM') are small, thin, white, top-left or bottom-left like a found-footage clock.
RENDER: cd ${P} && node render.mjs --timeline ${TL} --shots /src/${EP}/shots.js --scale 0.5 --preview 2 --previewDir out/<yourdir> --workers 1 --timeout 2400 [--times 3.2,7.5] [--query "act=2"]  → out/<yourdir>/t_*.png and contact.jpg; look at them with Read. Use --scale 0.5 while blocking, --scale 0.75 to judge final detail. Frames cost 2–6 s each on this CPU and other agents render at the same time, so render only the times you need. Always use your own --previewDir.
HARD RULES: deterministic (no Math.random / Date.now; use rng(seed) from src/lib/util.js and the kit's seeded noise), lazySets = false, setFrame every frame (realSet does it), camera-following CPU work via PRE_RENDER. Never put the camera inside geometry; check every frame for black/blank frames and hidden subjects. 9:16 is narrow (horizontal FOV ≈ 0.56 × vertical): a head-and-shoulders close-up is ~2.6–3 m at fov 48; faces need a practical/point light near them to read. The word captions sit in the centre (y≈0.5–0.6 of the frame): put faces in the upper third on close-ups, and keep fx.text overlays small at y 0.06–0.2 (or at the bottom 0.85–0.92), never over eyes. Lightning flashes are short pops (the post 'flash' + sky.setFlash + rig.update chain), not held white haze. Keep per-frame cost ≤ ~6 s at scale 0.75 (drop DOF/fog cards/shadows on cheap shots if needed).`

const SETS_SCHEMA = { type: 'object', properties: { report: { type: 'string' }, setNames: { type: 'array', items: { type: 'string' } }, api: { type: 'string', description: 'everything a shot builder needs: set names, anchors/coordinates of key spots (wreck, tree line, cave pool, fire), cast ids, helpers exported by kit.js, lighting/flash pattern, cost per set' } }, required: ['report', 'setNames', 'api'] }

phase('Sets')
const sets = await agent(`${BRIEF}
YOUR JOB: the SET + LOOK-DEV department. Build the shared foundation every shot builder will use, then hand over a precise API.
1. Read every beat of the script and list every location/lighting state it needs (e.g. night storm beach with wreck under lightning, dusk storm beach, dark rainforest edge, sea cave with a perfectly still mirror pool, dawn boat deck in fog, the island dissolving into fog, phone screen insert, etc.). Shared FRAMINGS that several acts must reuse exactly (e.g. the locked 'frame A' of the opening, the emblem macro framing reused for the match cut, the pool split-level and top-down set-ups) go into kit.js as named constants. Anything technically hard that more than one act needs (e.g. a mirror-pool reflection rig with a delayed/mirrored clone under a tinted water plane, the lightning flash timing helper that fires on timeline markers, the mirrored 'copy' version of the avatar) is YOUR job: build it once in kit.js/sets.js, prove it works in look-dev, and document it.
2. Write ${D}/kit.js (realSet wrapper, shotPost/deepMerge, film-wide grade defaults so every set shares ONE look, flash helper that runs the lightning→sky→rig→post chain, small camera helpers, overlay helper for 'DAY 41'-style stamps in a clean thin white font), ${D}/sets.js (export const sets = {...} with one builder per location/lighting state, using the kit builders AND the Blender assets — hero assets in hero shots; a set may expose named anchors/positions in set.anchors and helper objects), and ${D}/shots.js — the film entry: exports cast (include a second instance of MAIN.me if the story has a double, with whatever emblem mirroring the clues need), lazySets=false, captionOptions, init(ctx) (makeReal on each cast member; loadAssets), renderFrame (makeRenderFrame + createPost), sets (re-export), and shots assembled from act modules with DYNAMIC imports so a broken act file cannot break the others: const QS = new URLSearchParams(location.search); const ACT = QS.get('act'); load ${ACTS.map((a, i) => `./act${i + 1}.js`).join(', ')} with await import(...).catch(e => { console.error(e); return { shots: [] } }), use only act ACT if given, concatenate in order and sort by nothing (keep script order). Create each act file as a stub exporting shots = [one simple establishing shot at its first beat] so the film runs end to end now.
   Acts (for your stubs and so you know the split): ${JSON.stringify(ACTS)}.
3. Look-dev: write ${D}/dev_sets.js (+ a small dev timeline JSON in ${D}/) that shows each set from a hero angle with the avatar in it, render at --scale 0.75, look at every frame, and iterate (at least 3 rounds) until each set looks photoreal, high-contrast and moody, with no fake-looking parts (watch: flat grey skies, bland sand, palms from above, missing contact shadows, plastic character, fire blobs). Fix anything in your own files; do NOT edit src/real/* or other episodes (copy and adapt code instead).
4. Run the film entry over the whole timeline once (--preview 6 --scale 0.5) to prove it loads and every act stub renders.
Return the report, set names, and an API description detailed enough that three other builders can write their shots without reading your code twice (set names, coordinates of key spots, cast ids and their positions/poses that work, how to trigger flashes from timeline markers, the shared framings, the pool/mirror rig, the caption renderer, which helpers exist, recommended DOF/fov per shot type, cost per set).`, { label: 'sets + look-dev', phase: 'Sets', schema: SETS_SCHEMA, model: 'fable', effort: 'high' })

phase('Acts')
const built = await parallel(ACTS.map((a, i) => () => agent(`${BRIEF}
The SET department finished. Their hand-over:
${sets ? sets.api : '(missing — read ' + D + '/kit.js, sets.js, shots.js yourself)'}
YOUR JOB: shot builder for ACT ${i + 1} ("${a.name}", beats ${a.beats}). Write ONLY ${D}/act${i + 1}.js (export const shots = [...]); you may add helpers inside that file. Do NOT edit kit.js, sets.js, shots.js or other act files (other builders work in parallel; if you need a set change, build what you need inside your act file or report it).
Preview your act alone with --query "act=${i + 1}" and --previewDir out/${EP}_act${i + 1} (the engine only has your shots then; render times inside your beats).
For each beat, design the shot(s) exactly from its 'visual' note (shot size, move, lens/DOF, light, weather, what is in frame) — split a beat into 2–3 shots when it helps the rhythm; cut on word anchors. Make the clues readable on a phone where the script needs them (macro inserts, holds long enough to notice, but never spelled out). Iterate at least 3 preview rounds; finish with a pass at --scale 0.75 over every shot of your act and fix what looks fake, dark, empty, or confusing. Report what you built, timings per shot and anything you could not do.`, { label: `act ${i + 1}: ${a.name}`, phase: 'Acts', model: 'fable', effort: 'high' })))

phase('Review')
const REVIEW = { type: 'object', properties: { problems: { type: 'array', items: { type: 'object', properties: { time: { type: 'number' }, beat: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }, problem: { type: 'string' }, fix: { type: 'string' }, file: { type: 'string' } }, required: ['time', 'beat', 'severity', 'problem', 'fix', 'file'] } }, verdict: { type: 'string' } }, required: ['problems', 'verdict'] }
const crit = (dir) => `${BRIEF}
You are the INDEPENDENT CRITIC (you did not build this). Render the WHOLE film: --preview 1.0 --scale 0.5 --previewDir ${dir}, plus --scale 0.75 single frames at every lightning flash, every clue moment in the script's clue_list, the hook (first 3 s) and the ending. Judge like a film director and a TikTok viewer on a phone: does every beat's image match its narration and 'visual' note; is the story (and the twist) readable without sound; are the clues fair and visible; does anything look fake, plastic, blank, black, inside geometry, or badly lit; is there continuity (same wreck, same hoodie, the emblem direction exactly as the clues require, weather/time of day consistent); are overlays clean and away from faces; is the opening frame a scroll-stopper? Severity: critical = blank/black/broken/inside geometry/subject missing or a clue shown wrong; high = a viewer would not understand the beat or the image looks clearly fake/ugly; medium = weak but works; low = nitpick. Give a concrete fix and the file (act1.js / act2.js / ... / sets.js / kit.js) for each. Do NOT edit files.`
const review = await agent(crit(`out/${EP}_critic`), { label: 'critic', phase: 'Review', schema: REVIEW, model: 'fable', effort: 'high' })
const FIXER = (probs, round) => `${BRIEF}
${round}: fix every problem below in the film files under ${D}/ (you may now edit any of kit.js, sets.js, shots.js, act*.js; nobody else is editing). For each, render the affected time(s) before and after, and re-check ±1 s so you do not break neighbouring shots. Finish with one full --preview 2 --scale 0.5 pass and look at all of it.
Problems:
${JSON.stringify(probs, null, 1)}
Report what you changed per problem and anything you could not fix.`
let fixes = []
if (review && review.problems && review.problems.length) {
  fixes.push(await agent(FIXER(review.problems.filter((p) => p.severity !== 'low'), 'CRITIC ROUND'), { label: 'fixer', phase: 'Review', model: 'fable', effort: 'high' }))
}

phase('Polish')
let round = 0, last = null
while (round < MAXR) {
  round++
  last = await agent(crit(`out/${EP}_verify_r${round}`) + `\nThis is VERIFY round ${round}: earlier problems were fixed; report what is still wrong (be strict about critical/high, do not inflate preferences).`, { label: `verify r${round}`, phase: 'Polish', schema: REVIEW, model: 'fable' })
  const todo = (last && last.problems || []).filter((p) => p.severity === 'critical' || p.severity === 'high')
  log(`verify round ${round}: ${todo.length} critical/high`)
  if (!todo.length) break
  fixes.push(await agent(FIXER(todo, `POLISH ROUND ${round}`), { label: `polish fix r${round}`, phase: 'Polish', model: 'fable', effort: 'high' }))
}
return { sets, built, review, fixes, last, remaining: (last && last.problems || []).filter((p) => p.severity === 'critical' || p.severity === 'high'), mediumLow: (last && last.problems || []).filter((p) => p.severity === 'medium' || p.severity === 'low') }
