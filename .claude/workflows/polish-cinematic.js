export const meta = {
  name: 'polish-cinematic',
  description: 'Final polish of a rendered cinematic film: 3 independent reviewers watch the real video frames (story/clues, photoreal look, technical), each finding is adversarially verified, one fixer applies the confirmed fixes (Fable 5, max effort)',
  whenToUse: 'After a full render of a cinematic (photoreal kit) episode. Before launching, extract frames: <frames>/f_<sec>.png at 1 fps full-res + <frames>/sheet_*.jpg contact sheets at 2 fps. args: { ep, title, video, frames, notes? }',
  phases: [
    { title: 'Review', detail: '3 lenses watch the rendered video', model: 'fable' },
    { title: 'Verify', detail: 'each finding adversarially checked against the frames', model: 'fable' },
    { title: 'Fix', detail: 'one fixer applies the confirmed fixes and proves them', model: 'fable' },
  ],
}
const P = '/home/user/Escape/inthistown'
const EP = args && args.ep
const TITLE = (args && args.title) || EP
const VIDEO = args && args.video
const FR = args && args.frames
const NOTES = (args && args.notes) || ''
if (!EP || !VIDEO || !FR) throw new Error('args.ep, args.video and args.frames are required')
const D = `${P}/src/${EP}`
const CTX = `We made "${TITLE}", ONE ultra-realistic cinematic vertical TikTok film (1080x1920, 30 fps, ~101 s) in ${P}. The narrator is the creator's blocky avatar (black hoodie, white knight emblem, headphones) rendered with wet photoreal materials in a photoreal world; the look is cold, near-monochrome, high-contrast, scary and mysterious. The creator's other TikToks are getting ~1k views in hours, so this one has to be the best thing on their page: it must stop the scroll in the first second, be understood on a phone with or without sound, and reward a rewatch.
THE RENDERED VIDEO: ${VIDEO}. Its frames are already extracted: ${FR}/f_<sec>.png = full-resolution frame at every whole second (f_000.png … f_101.png, plus extra frames named f_<sec>.<ms>.png at flashes and clue moments), and ${FR}/sheet_*.jpg = labelled contact sheets at 2 frames per second. Look at them with the Read tool. You may extract any other frame yourself: ffmpeg -ss <t> -i ${VIDEO} -frames:v 1 <your own dir>/x.png (use your own output dir under ${P}/out/).
THE STORY: ${P}/episodes/${EP}/script.json (beats, every beat's 'visual' brief, 'clue_list', 'twist', caption styles) and the timing ${P}/episodes/${EP}/timeline.json (beat/word times, markers like flash1 … loopflash, 'subs' for Mom's phone lines). Shots are in ${D}/act1.js … act4.js (+ kit.js, sets.js, shots.js).
${NOTES}`
const FIND = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: {
  time: { type: 'number' }, beat: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
  problem: { type: 'string' }, evidence: { type: 'string', description: 'which frame files show it' }, fix: { type: 'string', description: 'concrete change: file, shot name, camera/light/pose/post values' } },
  required: ['time', 'beat', 'severity', 'problem', 'evidence', 'fix'] } }, verdict: { type: 'string' } }, required: ['findings', 'verdict'] }
const SEV = 'Severity: critical = broken/black/blank/inside-geometry frame, subject missing, or a clue shown WRONG (knight direction, rag hand, who is who); high = a phone viewer would not understand the beat, or it looks clearly fake/ugly, or text covers a face that matters; medium = weak but works; low = nitpick. Be strict and honest: do not inflate taste into high, and do not wave through anything a viewer would notice.'
const LENSES = [
  { key: 'story', prompt: `LENS: STORY, CLUES AND TIKTOK. Watch it as a viewer scrolling on a phone, first muted (captions only) and then with the script in hand as if you can hear it. Does frame 0 stop the scroll? Does each beat's image say what the narration says? Can you follow who is the real kid and who is the copy at every moment? Are all clues in the script's clue_list actually visible at phone size, fair, and not spelled out? Is the swap moment (b19) clear on a rewatch? Does the ending loop cleanly into the first frame (compare the last frames with f_000)? Are captions (REAL white, COPY black-on-white box, MOM phone bubble, HUSS) readable, well-timed and off the faces? Is the pacing right: any dead or confusing stretches?` },
  { key: 'look', prompt: `LENS: CINEMATOGRAPHY AND PHOTOREALISM. You are a film director and a VFX supervisor. Frame by frame: what looks fake, plastic, CG, flat, muddy, too dark to read, blown out, or cheap? Composition in 9:16, lens choice, depth of field, lighting on faces (blocky faces need a practical/fill), contrast and grade consistency across the film (one look), continuity (same wreck, same beach geography, weather, wetness, emblem and rag sides), rain/fog/lightning quality, the mirror pool, the boat deck, the island dissolve. Name the 10 most important improvements in order of impact on how premium the film feels.` },
  { key: 'tech', prompt: `LENS: TECHNICAL QC. Find every artifact a viewer could notice: flicker, popping objects, shadow acne, z-fighting, aliasing crawl, DOF halos, banding, frames where the camera clips geometry, wrong-shot frames at cuts (one-frame flashes of the previous/next shot), camera jumps, characters sliding/floating/intersecting, rain or fog cutting off, white-outs held too long or more than ~3 flashes per second (photosensitivity), captions overlapping stamps, and the loop seam. Check cuts by extracting the frames just before and after each shot change (shot starts are in the act files; times from timeline.json). Also run: ffprobe on the video (duration, fps, resolution, audio stream present and its duration vs video).` },
]
phase('Review')
const reviews = await parallel(LENSES.map((L) => () => agent(`${CTX}\n\n${L.prompt}\n${SEV}\nDo NOT edit any project files. Report findings with exact times, evidence frames and concrete fixes.`, { label: `review: ${L.key}`, phase: 'Review', schema: FIND, model: 'fable', effort: 'max' })))
const all = []
reviews.forEach((r, i) => (r && r.findings || []).forEach((f) => all.push({ ...f, lens: LENSES[i].key })))
// dedup: same beat + times within 1.5 s → keep the highest severity, merge text
const rank = { critical: 0, high: 1, medium: 2, low: 3 }
const merged = []
for (const f of all.sort((a, b) => a.time - b.time)) {
  const m = merged.find((x) => x.beat === f.beat && Math.abs(x.time - f.time) < 1.5 && !x.lenses.includes(f.lens))
  if (m) { m.lenses.push(f.lens); m.problem += `\n[${f.lens}] ${f.problem}`; m.fix += `\n[${f.lens}] ${f.fix}`; if (rank[f.severity] < rank[m.severity]) m.severity = f.severity }
  else merged.push({ ...f, lenses: [f.lens] })
}
const toVerify = merged.filter((f) => f.severity !== 'low')
log(`${all.length} raw findings → ${merged.length} merged → ${toVerify.length} to verify (${merged.length - toVerify.length} low kept as optional)`)

phase('Verify')
const VER = { type: 'object', properties: { real: { type: 'boolean' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }, reason: { type: 'string' }, betterFix: { type: 'string' } }, required: ['real', 'severity', 'reason'] }
const verified = await parallel(toVerify.map((f, i) => () => agent(`${CTX}\n\nA reviewer reported this problem in the rendered film. Your job is to try to REFUTE it by looking at the actual frames (extract more around ${f.time.toFixed(2)} s if needed) and the script. If it is real, give its honest severity (${SEV}) and the best concrete fix (file + values). If it is not real, or it is intended by the script, say so.\nFinding: ${JSON.stringify(f, null, 1)}`, { label: `verify ${f.beat} @${f.time.toFixed(1)}`, phase: 'Verify', schema: VER, model: 'fable', effort: 'high' }).then((v) => (v && v.real ? { ...f, severity: v.severity, verifyReason: v.reason, fix: v.betterFix ? `${f.fix}\n[verifier] ${v.betterFix}` : f.fix } : null))))
const confirmed = verified.filter(Boolean).sort((a, b) => rank[a.severity] - rank[b.severity] || a.time - b.time)
const lows = merged.filter((f) => f.severity === 'low')
log(`confirmed: ${confirmed.length} (${confirmed.filter((f) => f.severity === 'critical').length} critical, ${confirmed.filter((f) => f.severity === 'high').length} high, ${confirmed.filter((f) => f.severity === 'medium').length} medium); refuted: ${toVerify.length - confirmed.length}`)

phase('Fix')
const FIXED = { type: 'object', properties: { report: { type: 'string' }, ranges: { type: 'array', items: { type: 'object', properties: { from: { type: 'number' }, to: { type: 'number' }, why: { type: 'string' } }, required: ['from', 'to'] }, description: 'time ranges (s) whose pixels changed and must be re-rendered' }, notFixed: { type: 'array', items: { type: 'string' } } }, required: ['report', 'ranges', 'notFixed'] }
let fix = null
if (confirmed.length) {
  fix = await agent(`${CTX}\n\nYou are the FIXER. Apply every confirmed fix below (critical and high first, then medium; lows only if they are trivial and safe) in ${D}/ (kit.js, sets.js, shots.js, act1-4.js; do NOT edit src/real/*, src/engine.js or other episodes). For each fix render the affected time(s) BEFORE and AFTER as single frames at --scale 0.75 and look at them:\n  cd ${P} && node render.mjs --timeline episodes/${EP}/timeline.json --shots /src/${EP}/shots.js --scale 0.75 --preview 1 --times <t1,t2,...> --previewDir out/${EP}_finalfix --workers 1 --timeout 2400\nRe-check ±1 s around each change so neighbouring shots are not broken, keep it deterministic (no state left in setup; see the rules at the top of kit.js), and keep per-frame cost under ~6 s. At the end run: node render.mjs --timeline episodes/${EP}/timeline.json --shots /src/${EP}/shots.js --check-determinism --times <6 of the times you changed> --scale 0.5 --timeout 2400.\nReturn the exact time ranges whose pixels changed (whole shots, from shot start to next shot start) so only those get re-rendered, and anything you could not fix.\nConfirmed fixes:\n${JSON.stringify(confirmed, null, 1)}\nOptional lows:\n${JSON.stringify(lows, null, 1)}`, { label: 'fixer', phase: 'Fix', schema: FIXED, model: 'fable', effort: 'max' })
}
return { reviews, confirmed, refuted: toVerify.length - confirmed.length, lows, fix }
