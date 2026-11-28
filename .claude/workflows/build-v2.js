export const meta = {
  name: 'build-v2',
  description: 'Build a style-bible-v2 "In This Town" episode with the v2 kits: foundation (sets, cast, lantern/story state, entry module), acts in parallel, two critics (viewer/story + look/background/tech), fixer, verify loop',
  whenToUse: 'After episodes/<ep>/script.json + timeline.json exist for a v2 episode (ep30 on) and the v2 kits are in src/kits + src/lib/look.js. args: { ep, title, acts: [{ name, beats: "b01-b06" }, ...], maxRounds? }',
  phases: [
    { title: 'Foundation', detail: 'shared kit, sets, cast, story state, entry module, look-dev of key framings' },
    { title: 'Acts', detail: 'one shot builder per act, in parallel' },
    { title: 'Review', detail: 'viewer/story critic + look/background/tech critic, fixer', model: 'fable' },
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
You are part of the crew building episode ${EP} "${TITLE}" of the TikTok series "In This Town… HUSS! HUSS!" (${P}; Three.js, rendered headless by render.mjs). This is the FIRST episode of the new v2 standard: it must match the quality of the 14 reference videos the creator sent (Roblox-style characters with expressive faces in warm, really lit, cluttered homes; a new angle every ~1.2–1.5 s; body acting; depth of field). The creator's own words about what makes those videos go viral: "that high quality touch ... that background and all that". So EVERY frame needs a rich, lived-in, beautifully lit background with depth (clutter, practical lights, soft background blur, haze/dust in light, things happening behind the subject) — never an empty wall, a flat colour, a black void or a bare floor behind a character.
READ FIRST:
- ${P}/episodes/STYLE_BIBLE_V2.md (sections 7 camera/edit, 8 look, 9 captions, 11 QA gates are the rules your shots are checked against).
- The script ${P}/episodes/${EP}/script.json: every beat's 'visual' is the shot brief (with shot ids S01…, cut points as markers); also 'sets', 'cast', 'newProps', 'lantern_counts', 'clue_list', 'twist', 'look', 'overlays', 'captions', 'huss_plan'. Timing: ${P}/${TL} (beats, word times, markers; shot starts are anchors like 'b05', 'b05.w3', marker names, with +/- offsets).
- The v2 kits (read their header comments — they are the API): ${P}/src/lib/look.js (renderFrame, focusOn/focusPull, lightOn subject light, lamps/torch/fridge/door strip/window shafts/dust), ${P}/src/kits/home.js (buildHome set, HOME dimensions, HOME_CAMS presets, anchors, lighting presets and options, street/porches/neighbours), ${P}/src/kits/props_home.js (lantern rows + states + tags, wardrobe, crib, paint tin, pickles, ultrasound card, family photo, torch, step ladder, crayon drawings …), ${P}/src/direct.js (the v2 camera helpers: lowHero, ots, pov, insert, topDown, closeUp, ecu, wide, dutch, pushIn, handheld, whipIn, dipWhite, bookend, hussBeat, blockingCheck, configureDirect), ${P}/src/cast.js (MAIN_V2.me, familySpec / FAMILY day+night, bubbleAnchor), ${P}/src/characters.js header (v2 poses drag, heave, pushUp, crouch, shove, kneel, leanIn, hugNeck, sprint, charge, backUp, crash/fly …, v2 faces scared, terrified, heartbroken, relieved, crying, glints), ${P}/src/engine.js header (ctx API, captionOptions preset 'v2', red words, chat bubbles).
- THE WORKING EXAMPLE: ${P}/src/kits/showcase.js — a 22-shot mini-episode that uses every kit exactly the way this episode should. Copy its patterns (its header lists the integration rules: configureDirect, props built in init, hand-held props from posed hand world positions, lantern rows on hooks, day/night outfit ids, faces at frame y 0.26–0.30, 3/4 front for two-character beats, SETUP A numbers, hatch reach, etc.). Its final render is ${P}/out/v2_showcase_final/contact.jpg — that is the quality floor, not the ceiling.
RENDER: cd ${P} && node render.mjs --timeline ${TL} --shots /src/${EP}/shots.js --scale 0.5 --preview 2 --previewDir out/<yours> --workers 1 --timeout 3000 [--times 3.2,7.5] [--query "act=2"] → t_*.png + contact.jpg (look with Read). Use --scale 0.5 while blocking, --scale 0.75 to judge detail and light. Frames cost ~2–3 s; other agents render at the same time, so render only what you need, always into your own --previewDir.
HARD RULES: deterministic (pure functions of time; no Math.random/Date; props built in init, animated in update; read the engine header's "Shot switching" section); lazySets = false; never put the camera inside geometry (check every frame for blank/black/inside-wall frames and hidden faces — use blockingCheck); faces in the upper third, never under the caption band (≈0.55–0.62 of frame height); the narrator is ALWAYS MAIN_V2.me (black hoodie, white knight, headphones on his head; the hoodie must read black, not tinted); the only overlays are captions, the HUSS! stamp (hussBeat) and the script's chat bubbles — no stickers, no other text overlays (information lives on props: tags, photo, scan card); no guns, no blood; per-frame cost ≤ ~5 s at --scale 0.75. Do NOT edit the shared kits (src/lib, src/kits, src/direct.js, src/cast.js, src/characters.js, src/engine.js, src/real) — they are pixel-locked for older episodes; copy and adapt code into your episode files instead, and report any kit bug.`

const FOUND = { type: 'object', properties: { report: { type: 'string' }, api: { type: 'string', description: 'everything an act builder needs: files, exports, set names + lighting states per act, cast ids (day/night), story-state helpers (lanterns per time, prop states), shared framings (SETUP A etc.), recommended helper usage, costs' } }, required: ['report', 'api'] }

phase('Foundation')
const found = await agent(`${BRIEF}
YOUR JOB: the FOUNDATION (one agent, before the act builders start). Build what every act shares, prove it, hand over a precise API.
1. ${D}/kit.js: imports and re-exports of the kits the acts use; the cast (narrator, family night + day ids, the extras the script's 'cast' lists: seven cousins + their mom, the baker); props built once in an init helper on ctx.props (one wardrobe, the lantern rows for OUR porch, NEXT DOOR (7) and the BAKER (3), the crib, tin, pickles, scan card, parcel with the yellow ribbon, knitted socks, the ringed tail …); and ONE story-state function per moving part, driven only by the timeline (markers / word times): lantern states of every porch over the whole episode exactly as the script's 'lantern_counts' and beat visuals say (which lantern, which tag, lit/flare/going out with smoke/relight/folded/unfolding sixth), door/hatch/fridge states, Pip's blanket, etc. — so every act shows the same world state at the same time without coordinating.
2. ${D}/sets.js: the sets (the home via buildHome — interior hall/kitchen/box room/attic + exterior porch and the dusk street with the neighbours' porches; any extra set the script needs), with every set dressed RICH: add set dressing in your own code wherever a beat's framing would show an empty surface (extra frames, plants, toys, coats, boots, mail on the mat, a kid's bike on the porch, street trees, parked cars, warm windows in houses across the street, bunting, flower pots …).
3. ${D}/shots.js: the episode entry — exports cast, lazySets = false, captionOptions (v2 preset), init(ctx) (props, configureDirect), renderFrame from look.js, sets, and shots assembled from act modules with DYNAMIC imports so a broken act cannot break the others: const QS = new URLSearchParams(location.search); const ACT = QS.get('act'); load ${ACTS.map((a, i) => `./act${i + 1}.js`).join(', ')} with await import(...).catch(e => { console.error(e); return { shots: [] } }); use only act ACT if given, else concatenate in order. Write each act file as a stub exporting shots = [one simple, good-looking establishing shot at its first beat] so the episode runs end to end now. Acts: ${JSON.stringify(ACTS)}.
4. Look-dev: ${D}/dev.js + a small dev timeline: the episode's KEY FRAMINGS from the script (SETUP A hook through the door glass with the five lanterns, the dusk street with next door's 7 and the baker's 3, the midpoint dusk→night on our porch, the fridge silhouette, the box-room strip, the crib landing, the morning bookend) with cast and props in place, at --scale 0.75. Iterate (at least 3 rounds) until each reads instantly on a phone and looks at least as good as ${P}/out/v2_showcase_final/contact.jpg, with rich backgrounds. Run the full entry once (--preview 6 --scale 0.5) to prove every act stub renders.
Return the report and an API description detailed enough that four act builders can write their shots without reading your code twice.`, { label: 'foundation', phase: 'Foundation', schema: FOUND, effort: 'high' })

phase('Acts')
const built = await parallel(ACTS.map((a, i) => () => agent(`${BRIEF}
The FOUNDATION is done. Its hand-over:
${found ? found.api : '(missing — read ' + D + '/kit.js, sets.js, shots.js yourself)'}
YOUR JOB: shot builder for ACT ${i + 1} ("${a.name}", beats ${a.beats}). Write ONLY ${D}/act${i + 1}.js (export const shots = [...]); helpers go inside that file. Do NOT edit kit.js, sets.js, shots.js or other act files (other builders work in parallel; if you need a change there, build it inside your act file or report it).
Preview your act alone with --query "act=${i + 1}" and --previewDir out/${EP}_act${i + 1}.
For every beat, build the shots its 'visual' lists (shot ids, framings, moves, lighting state, cut markers) with the v2 helpers; cut on the word/marker anchors; every shot has handheld drift, DOF on its subject, the subject light, and a RICH lit background with depth. HUSS beats use hussBeat exactly as the script's huss_plan says. Make each clue in the script's clue_list that falls in your beats readable on a phone (inserts, holds) but never spelled out. Bible rules to check yourself: average shot 1.2–1.5 s, nothing over 3 s except a planned hold, no camera setup used more than twice, narrator or loved one in ≥60% of shots, prop inserts, faces front or 3/4 on reaction beats, three shots in the first 3 s (act 1). Iterate at least 3 preview rounds; finish with a --scale 0.75 pass over every shot of your act and fix whatever looks dark, empty, fake, confusing, cropped or blocked. Report the shots you built (id, start anchor, duration, helper, set state) and anything you could not do.`, { label: `act ${i + 1}: ${a.name}`, phase: 'Acts', effort: 'high' })))

phase('Review')
const REVIEW = { type: 'object', properties: { problems: { type: 'array', items: { type: 'object', properties: { time: { type: 'number' }, beat: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }, problem: { type: 'string' }, fix: { type: 'string' }, file: { type: 'string' } }, required: ['time', 'beat', 'severity', 'problem', 'fix', 'file'] } }, verdict: { type: 'string' } }, required: ['problems', 'verdict'] }
const SEV = 'Severity: critical = blank/black/broken/inside-geometry frame, subject missing, wrong character (narrator not MAIN_V2.me), or a story fact shown WRONG (wrong lantern count/tag, clue contradicting the twist); high = a phone viewer would not understand the beat, the image looks clearly cheap/empty/ugly next to the references, a face that matters is hidden or under the caption; medium = weak but works; low = nitpick. Be strict and honest; do not inflate taste into high.'
const LENSES = [
  { key: 'viewer', prompt: `LENS: VIEWER AND STORY. Render the whole episode (--preview 1.0 --scale 0.5 --previewDir <yours>) and extra frames around the hook (0–3 s, every 0.25 s), the midpoint (26–33 s), the climax (45–50 s) and the twist (53–61 s). Watch it as a 15-year-old on a phone, first muted (captions + images only), then with the script in hand as if you hear it. Does every image say what the narration says at that moment? Is the lantern count readable whenever the story depends on it? Are the clues fair and visible? Does the twist land and re-explain the clues on a rewatch? Where would you swipe away? Is the first frame a scroll-stopper?` },
  { key: 'look', prompt: `LENS: LOOK, BACKGROUNDS AND TECH. Render at --scale 0.75 one frame per shot (shot starts + 0.4 s; get them from the act files) and compare them side by side with the references (${P}/out/refs2/ref01, ref02, ref04, ref05, ref08 stills and sheets) and with ${P}/out/v2_showcase_final/contact.jpg. Judge: rich backgrounds with depth (empty walls/voids/flat colour = high), lighting on faces, the hoodie reading black, DOF, colour/grade consistency, scale consistency, continuity (same house, same lantern states, outfits day/night), artifacts (shadow acne, z-fighting, light leaks, popping, camera inside walls, blocked faces), captions/bubbles/stamps over faces. Also run: node render.mjs --timeline ${TL} --shots /src/${EP}/shots.js --check-determinism --times <6 times across acts> --scale 0.5 --timeout 3000, and measure per-frame cost at --scale 0.75 on the heaviest shot.` },
]
const crit = (L, dir) => `${BRIEF}
You are an INDEPENDENT CRITIC (you did not build this). Use --previewDir ${dir} (and subfolders). ${L.prompt}
${SEV}
For each problem give the time, beat, a concrete fix and the file (act1.js … act${ACTS.length}.js / kit.js / sets.js / shots.js). Do NOT edit files.`
const reviews = await parallel(LENSES.map((L) => () => agent(crit(L, `out/${EP}_crit_${L.key}`), { label: `critic: ${L.key}`, phase: 'Review', schema: REVIEW, model: 'fable', effort: 'high' })))
const probs = reviews.flatMap((r, i) => ((r && r.problems) || []).map((p) => ({ ...p, lens: LENSES[i].key })))
log(`critics: ${probs.length} problems (${probs.filter((p) => p.severity === 'critical' || p.severity === 'high').length} critical/high)`)
const FIXER = (list, round) => `${BRIEF}
${round}: fix every problem below in the episode files under ${D}/ (you may now edit any of kit.js, sets.js, shots.js, act*.js; nobody else is editing; still never the shared kits). Work in order of severity. For each, render the affected time(s) before and after, and re-check ±1 s so neighbouring shots stay right. Finish with one full --preview 2 --scale 0.5 pass and look at all of it.
Problems:
${JSON.stringify(list, null, 1)}
Report what you changed per problem and anything you could not fix.`
const fixes = []
const todo0 = probs.filter((p) => p.severity !== 'low')
if (todo0.length) fixes.push(await agent(FIXER(todo0, 'CRITIC ROUND'), { label: 'fixer', phase: 'Review', effort: 'high' }))

phase('Polish')
let round = 0, last = null
const BOTH = { key: 'verify', prompt: `${LENSES[0].prompt}\n\nAND ${LENSES[1].prompt}\nThis is a VERIFY round: earlier problems were fixed; report what is still wrong (strict on critical/high; do not inflate preferences).` }
while (round < MAXR) {
  round++
  last = await agent(crit(BOTH, `out/${EP}_verify_r${round}`), { label: `verify r${round}`, phase: 'Polish', schema: REVIEW, model: 'fable', effort: 'high' })
  const todo = (last && last.problems || []).filter((p) => p.severity === 'critical' || p.severity === 'high')
  log(`verify round ${round}: ${todo.length} critical/high`)
  if (!todo.length) break
  fixes.push(await agent(FIXER(todo, `POLISH ROUND ${round}`), { label: `polish fix r${round}`, phase: 'Polish', effort: 'high' }))
}
return { found, built, reviews, fixes, last, remaining: (last && last.problems || []).filter((p) => p.severity === 'critical' || p.severity === 'high'), mediumLow: (last && last.problems || []).filter((p) => p.severity === 'medium' || p.severity === 'low') }
