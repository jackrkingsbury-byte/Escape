export const meta = {
  name: 'study-refs',
  description: 'Study reference TikToks of the "In this town… HUSS HUSS" genre: per-video breakdowns, gap analysis vs our episodes (with real view data), style bible v2 + upgrade list, story pitches, judges, final script',
  whenToUse: 'When the user uploads reference videos to raise the quality bar. Run tools/ref_breakdown.py first. args: { refs: "<dir with refNN/>", groups: [["ref01","ref02",...], ...], ours: "<dir with our episode sheets>", stats: "<text of our TikTok stats>" }',
  phases: [
    { title: 'Analyze', detail: 'analysts break down the references; one compares ours' },
    { title: 'Synthesize', detail: 'style bible v2, upgrade list, pitches' },
    { title: 'Judge', detail: '3 judges score the pitches' },
    { title: 'Script', detail: 'writer turns the winner into the episode script' },
  ],
}
const P = '/home/user/Escape/inthistown'
const R = args.refs, OURS = args.ours, STATS = args.stats || ''
const GROUPS = args.groups
const CTX = `The creator runs the TikTok @alexlivealert: an animated series "In This Town… HUSS! HUSS!" made in our own 3D engine (Three.js, toy-block Roblox-style characters, in ${P}). Every episode: the narrator (the creator's own avatar: black hoodie with a white knight emblem, headphones) tells a short absurd/mysterious story in first person, "In this town, everyone ... except me", and grinds through effort beats marked by the real "HUSS!" grunt sample. Word-by-word captions. ~80-90 s. The creator says our episodes are not as good as the reference videos below and wants the next one to reach that quality, while staying in the HUSS HUSS / "In this town" format with a really good story. The creator's words: "here some motivation but keep to the Huss Huss and in this town like this quality type ting u know what I mean make a good as story".
First look: the references are Roblox-avatar characters (expressive face decals, propeller cap, etc.) animated in realistic, nicely lit 3D homes/schools/streets, told in second person ("You wake up and...") with one big word-by-word caption at a time (key words in red), a new camera angle every ~1-2 s, and a twist or emotional/real-science payoff at the end. Verify and go deeper than this.
Our real TikTok numbers: ${STATS}`
const BREAK = { type: 'object', properties: { videos: { type: 'array', items: { type: 'object', properties: {
  tag: { type: 'string' }, duration_s: { type: 'number' }, title_guess: { type: 'string' },
  hook: { type: 'string', description: 'first 3 seconds: exact opening line + what is on screen + why it stops the scroll' },
  premise: { type: 'string' }, beats: { type: 'array', items: { type: 'string' }, description: 'story beats with timestamps' },
  huss: { type: 'string', description: 'how many HUSS moments, where, what visual happens on them, how the edit/music behaves' },
  ending: { type: 'string' }, characters: { type: 'string' }, sets_and_props: { type: 'string' },
  camera_and_editing: { type: 'string', description: 'shot types, cut rate (use info.json), zooms, shakes, transitions, text overlays/memes' },
  look: { type: 'string', description: 'render quality, lighting, colour, effects, how characters are animated (faces, poses, lip sync?)' },
  captions: { type: 'string' }, audio: { type: 'string', description: 'voice (TTS? which kind), music, sfx, meme sounds' },
  why_it_works: { type: 'string' } }, required: ['tag', 'hook', 'premise', 'beats', 'huss', 'ending', 'camera_and_editing', 'look', 'captions', 'audio', 'why_it_works'] } } }, required: ['videos'] }
const HOWTO = (tags) => `For each of these reference videos: ${tags.join(', ')} — the folder ${R}/<tag>/ holds sheet_NN.jpg (contact sheets, 1 frame per second, 24 per sheet, timestamp burned in at the bottom-left), still_00.5.jpg and still_03.0.jpg (full resolution hook frames), transcript.txt (Whisper transcript in 6 s windows, imperfect: words at window edges repeat or get cut; a window may say "no speech" when the music is loud — the burned-in captions on the sheets are the ground truth) and info.json (duration, number of cuts, average shot length, cut times, and 'file' = the video file name inside ${args.uploads}/ — extract any extra full-res frame you need with: ffmpeg -ss <t> -i ${args.uploads}/<file> -frames:v 1 <your own dir under /home/user/Escape/inthistown/out/>/x.png). LOOK AT EVERY SHEET of every video with the Read tool — do not guess from the transcript. Be concrete and specific (what exactly is on screen, exact lines, exact timings); this goes to the people who will remake the format.`
phase('Analyze')
const analyses = await parallel([
  ...GROUPS.map((g, i) => () => agent(`${CTX}\n\n${HOWTO(g)}\nReturn one breakdown per video.`, { label: `analyse ${g.join(',')}`, phase: 'Analyze', schema: BREAK })),
  () => agent(`${CTX}\n\nYou are the GAP ANALYST. Our own recent episodes are in ${OURS}/<ep>/ (same layout: sheet_NN.jpg at 1 fps, still_*.jpg, transcript.txt, info.json) and our scripts are in ${P}/episodes/<ep>/script.json. The references are in ${R}/refNN/ (same layout). Look at ALL of our sheets and at least 6 reference videos' sheets in full. Then answer brutally and concretely: what do the references do that we do not — story (premise strength, escalation, emotional stakes, twist, relatability, jokes), hook, pacing/cut rate, camera, sets and world richness, characters (designs, faces, animation, crowds), lighting/colour/render quality, captions, sound (voice, music, meme sfx), HUSS usage, length, endings/loops — and what do we do better. Rank the 12 most important gaps by likely impact on watch time and shares, and for each say how to close it in OUR engine (Three.js toy-block world in ${P}/src: characters.js, world.js, engine.js; the photoreal post-processing kit in ${P}/src/real/ — post.js colour grade/bloom/DOF/fog, env.js, weather.js — can be reused in colour) and how much work it is.`, { label: 'gap analysis vs ours', phase: 'Analyze', effort: 'high' }),
])
const breakdowns = analyses.slice(0, GROUPS.length).filter(Boolean).flatMap((a) => a.videos || [])
const gaps = analyses[GROUPS.length]
log(`${breakdowns.length} reference breakdowns`)

phase('Synthesize')
const SYN = { type: 'object', properties: {
  style_bible: { type: 'string', description: 'markdown: the formula of the genre as the references do it — hook, structure with timings, HUSS rules, escalation, endings, camera/edit grammar, look, captions, audio — concrete enough to brief a builder' },
  upgrades: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' }, how: { type: 'string' }, effort: { type: 'string', enum: ['small', 'medium', 'large'] }, impact: { type: 'string', enum: ['low', 'medium', 'high'] } }, required: ['title', 'why', 'how', 'effort', 'impact'] } },
  pitches: { type: 'array', minItems: 6, maxItems: 8, items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, hook_line: { type: 'string' }, premise: { type: 'string' }, outline: { type: 'string', description: 'beat outline with escalation, the HUSS grind moments and the twist/ending' }, why_it_will_spread: { type: 'string' } }, required: ['id', 'title', 'hook_line', 'premise', 'outline', 'why_it_will_spread'] } } },
  required: ['style_bible', 'upgrades', 'pitches'] }
const syn = await agent(`${CTX}\n\nReference breakdowns (from analysts who watched every frame):\n${JSON.stringify(breakdowns, null, 1)}\n\nGap analysis of our episodes vs the references:\n${gaps}\n\nWrite (1) the STYLE BIBLE v2 for our series, (2) the upgrade list for our engine and pipeline ranked by impact/effort, and (3) 6-8 ORIGINAL story pitches for our next episode in the HUSS HUSS / "In this town" format that use what makes the references work (do not copy any reference story, characters or jokes — learn the mechanics). Our narrator is always the creator's avatar. Our past episode premises are in ${P}/episodes/BACKLOG.md — do not repeat them.`, { label: 'synthesis', phase: 'Synthesize', schema: SYN, model: 'fable', effort: 'high' })

phase('Judge')
const SC = { type: 'object', properties: { ranking: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, score: { type: 'number' }, verdict: { type: 'string' } }, required: ['id', 'score', 'verdict'] } }, winner: { type: 'string' }, must_fix: { type: 'array', items: { type: 'string' } } }, required: ['ranking', 'winner', 'must_fix'] }
const LENSES = [
  'LENS: TikTok growth. Which pitch stops the scroll in the first second, holds to the end (watch time is our weakest number: viewers leave around 30 s), and gets shared/commented?',
  'LENS: story and comedy. Which has the strongest premise, escalation, payoff and HUSS moments, and the most satisfying twist or ending? Plot holes?',
  'LENS: production. Which can our toy-block Three.js engine render at the reference quality level with the upgrades listed, with iconic, readable images at phone size?',
]
const judged = await parallel(LENSES.map((l, i) => () => agent(`${CTX}\n\nStyle bible v2:\n${syn && syn.style_bible}\n\nPitches:\n${JSON.stringify(syn && syn.pitches, null, 1)}\n\n${l}\nScore every pitch 0-100, name the winner, list what must be fixed in it.`, { label: `judge ${i + 1}`, phase: 'Judge', schema: SC })))
const tally = {}
judged.filter(Boolean).forEach((j) => j.ranking.forEach((r) => { tally[r.id] = tally[r.id] || { s: 0, n: 0, v: [] }; tally[r.id].s += r.score; tally[r.id].n++; tally[r.id].v.push(r.verdict) }))
const order = Object.entries(tally).map(([id, t]) => ({ id, score: t.s / t.n, verdicts: t.v })).sort((a, b) => b.score - a.score)
log('ranking: ' + order.map((o) => `${o.id} ${o.score.toFixed(1)}`).join(', '))

phase('Script')
const SCRIPT = { type: 'object', properties: { title: { type: 'string' }, caption: { type: 'string' }, beats: { type: 'array', minItems: 18, maxItems: 40, items: { type: 'object', properties: { kind: { type: 'string', enum: ['line', 'huss', 'quote'] }, speaker: { type: 'string' }, text: { type: 'string' }, n: { type: 'number' }, visual: { type: 'string' }, music: { type: 'string' }, sfx: { type: 'array', items: { type: 'string' } } }, required: ['kind', 'text', 'visual'] } } }, required: ['title', 'caption', 'beats'] }
const win = (syn && syn.pitches || []).find((p) => p.id === (order[0] && order[0].id))
const script = await agent(`${CTX}\n\nStyle bible v2:\n${syn && syn.style_bible}\n\nThe judges picked this pitch:\n${JSON.stringify(win, null, 1)}\nTheir notes: ${JSON.stringify(order.slice(0, 3), null, 1)}\nMust fix: ${JSON.stringify(judged.filter(Boolean).flatMap((j) => j.must_fix), null, 1)}\n\nWrite the full episode script in our format. Read ${P}/episodes/ep23/script.json and ${P}/episodes/ep24/script.json (our two best performers) and ${P}/audio/build_episode.py's docstring for the fields (kind line/huss/quote; huss n = 3 per triplet; music modes; sfx names that exist). Narration is TTS (Kokoro) so avoid hard names and ALL-CAPS words; line 1 is the hook; every beat has a precise 'visual'. Fix every must-fix note.`, { label: 'script writer', phase: 'Script', schema: SCRIPT, model: 'fable', effort: 'high' })
return { breakdowns, gaps, synthesis: syn, order, judges: judged, script }
