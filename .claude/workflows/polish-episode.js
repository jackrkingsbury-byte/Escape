export const meta = {
  name: 'polish-episode',
  description: 'Second-pass polish for an In This Town episode: fix listed weak frames, independent verifier re-renders and checks, loop until clean (max 3 rounds)',
  whenToUse: 'After build-episode when a fresh full preview still shows weak frames. args: { ep: "ep19", title: "...", issues: [{ time, beat, problem }] }',
  phases: [
    { title: 'Fix', detail: 'fixer applies the listed issues and re-previews' },
    { title: 'Verify', detail: 'independent verifier renders fresh frames and reports remaining problems' },
  ],
}
const P = '/home/user/Escape/inthistown'
const EP = args && args.ep
const TITLE = (args && args.title) || EP
const ISSUES = (args && args.issues) || []
if (!EP) throw new Error('args.ep is required')
const BRIEF = `You are polishing episode ${EP} ("${TITLE}") of our 3D TikTok series "In This Town" in ${P}.
FIRST read /home/user/Escape/.claude/workflows/build-episode.js: its BRIEF string holds the project overview, files to read and the HARD-WON LESSONS 1-14 (portrait FOV, never put the camera inside/behind things, face framing above the caption band, fill lights at night, narrator is always MAIN.me, quality bar). Follow all of it.
The episode's shots are in ${P}/src/${EP}/shots.js (+ ${P}/src/${EP}/props.js). Script/timing: ${P}/episodes/${EP}/script.json and timeline.json.
Only edit ${P}/src/${EP}/shots.js and ${P}/src/${EP}/props.js.
Preview single frames: cd ${P} && node render.mjs --timeline episodes/${EP}/timeline.json --shots /src/${EP}/shots.js --preview 1.5 --previewDir out/polish_${EP} --workers 1 --timeout 1500 --times 12.3,40.1  → out/polish_${EP}/t_*.png (look at them with Read). Full sheet: drop --times → out/polish_${EP}/contact.jpg. A render of the final video may be running in parallel: that is fine, always use your own --previewDir.
A frame is GOOD when, at phone size, the beat's subject is big, lit, unobstructed and doing the action the narration describes; faces sit above the centre caption band (y≈0.5–0.6 of the frame) and overlays never cover eyes/mouths.`
const VERIFY = { type: 'object', properties: {
  problems: { type: 'array', items: { type: 'object', properties: {
    time: { type: 'number' }, beat: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
    problem: { type: 'string' }, fix: { type: 'string' } }, required: ['time', 'beat', 'severity', 'problem', 'fix'] } },
  verdict: { type: 'string' } }, required: ['problems', 'verdict'] }

let todo = ISSUES, round = 0, last = null, fixes = []
while (todo.length && round < 3) {
  round++
  phase('Fix')
  const f = await agent(`${BRIEF}
ROUND ${round}. Fix every problem below. For each one, render the affected time(s) as single frames before and after your change and look at them. Do not break neighbouring shots (re-render ±1 s around each change). When done, render one full --preview 1.5 contact sheet and look at all of it.
Problems:
${JSON.stringify(todo, null, 1)}
Report what you changed per problem and anything you could not fix.`, { label: `fix ${EP} r${round}`, phase: 'Fix', effort: 'high' })
  fixes.push(f)
  phase('Verify')
  last = await agent(`${BRIEF}
You are the INDEPENDENT VERIFIER (you did not write the shots). Render a fresh full preview with --preview 1.0 --previewDir out/verify_${EP}_r${round}, and single frames at each of these times: ${todo.map(x => x.time).join(', ')} plus every HUSS hit and card pop. Judge every frame against the GOOD definition. Report only real problems with a severity (critical = blank/inside-geometry/subject missing; high = beat unreadable at phone size or text over a face; medium = weak but readable; low = nitpick) and a concrete fix (camera pos/look/fov or blocking change). Do NOT edit files.`, { label: `verify ${EP} r${round}`, phase: 'Verify', schema: VERIFY })
  todo = (last && last.problems || []).filter(p => p.severity === 'critical' || p.severity === 'high')
  log(`round ${round}: ${todo.length} critical/high problems left`)
}
return { rounds: round, remaining: todo, verdict: last && last.verdict, mediumLow: (last && last.problems || []).filter(p => p.severity === 'medium' || p.severity === 'low'), fixes }
