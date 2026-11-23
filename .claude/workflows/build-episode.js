export const meta = {
  name: 'build-episode',
  description: 'Build src/<ep>/shots.js for an In This Town episode from its script + timeline, preview-iterate, independent critic, fixer',
  whenToUse: 'After episodes/<ep>/script.json and timeline.json exist (audio/build_episode.py <ep> has run). args: { ep: "ep12", title: "..." }',
  phases: [
    { title: 'Build', detail: 'write shots + props, preview, fix framing' },
    { title: 'Review', detail: 'independent critic on fresh previews; builder fixes' },
  ],
}
const P = '/home/user/Escape/inthistown'
const EP = args && args.ep
const TITLE = (args && args.title) || EP
if (!EP) throw new Error('args.ep is required, e.g. { ep: "ep12" }')
const PV = `out/preview_${EP}`
const BRIEF = `
You are building the shot list for episode ${EP} ("${TITLE}") of our 3D TikTok series "In This Town" in ${P}.
The look we want: bright, chunky toy-block 3D like popular "In this town" Roblox-style story TikToks — lots of camera variety (wide establishing shots, low hero angles looking up at giant things, over-the-shoulder, close-ups on faces for reactions), strong scale contrast, dramatic sky/lighting changes, every beat a clear readable image at phone size.
Read these first:
- ${P}/SPEC.md (module contracts) and the header comments of ${P}/src/engine.js (ctx API), ${P}/src/characters.js (poses/params/faces), ${P}/src/world.js (town/room anchors, lighting presets 'day' | 'dusk' | 'quiet_night' | 'party_night'), ${P}/src/props.js, ${P}/src/ep2/props2.js, ${P}/src/ep3/props3.js (makeCrack, makeSack, ...), ${P}/src/ep9/props9.js, ${P}/src/cards.js (quoteCard/top10Card).
- The most recent working examples (copy their helpers and patterns): ${P}/src/ep11/shots.js (town-local coords T(ctx), lamp posts, fill light riding the camera, counters, cat-in-box prop, camera tilt to a sky object), ${P}/src/ep10/shots.js (room set, label() canvas text props, sky orb with moods, sky crack, iris ending), ${P}/src/ep9/shots.js (corkboard, big props), ${P}/src/ep4/shots.js (stage, crowds).
- The script + timing: ${P}/episodes/${EP}/script.json (beats with 'visual' notes, 'newProps') and ${P}/episodes/${EP}/timeline.json (word times, HUSS times, markers). Shot starts are anchors like 'b05', 'b05.w2', 'b03.h1', marker names, with +/- offsets.
Write ONLY: ${P}/src/${EP}/shots.js (and optionally ${P}/src/${EP}/props.js for new props). Do not modify any other file in the repo (other episodes' files are read-only; copy helpers instead of importing if you need to change them).
Preview: cd ${P} && node render.mjs --timeline episodes/${EP}/timeline.json --shots /src/${EP}/shots.js --preview 1.5 --previewDir ${PV} --workers 1 --timeout 1500
  → ${PV}/contact.jpg (look at it with the Read tool); single frames: --times 12.3,40.1 (→ ${PV}/t_*.png). Always pass --previewDir ${PV} (other renders may be running). ~1–2 min per preview.
HARD-WON LESSONS (follow them):
1. Pose params like tableY/seatHeight are ROOT-relative (body space), not world.
2. The frame is portrait 9:16: horizontal FOV ≈ 0.56 × vertical FOV. A full-body shot of one character needs the camera ~5 m away at fov 40; two subjects 1 m apart ~4 m+. Heads are big (0.64 m wide): a close-up is ~2–3 m at fov 30–36.
3. Never put the camera inside or right behind a character/prop. Check every preview frame for blank brown/red/black frames (= camera inside something) and for subjects hidden behind houses, lamp heads or trees — look at what is actually between the camera and the subject (town houses line the street; lamp heads sit at y≈4.4 on the posts).
4. Every shot change detaches all cast and restores snapshots; place() attaches; props must be ctx.add()-ed in setup; animate from time alone in update() (deterministic).
5. Faces: human face point = joints.head.localToWorld(V(0,0.3,0.28)). Blinking: face(expr, t) blinks when (t+blinkPhase) mod period < 0.12 — hold eyes with a fixed t.
6. Town coordinates: use the set root's local frame (T(ctx) in ep11): main street runs along x, centre line z=0, pavements at z=±5.15 (curb height 0.12), north lamp posts at x=-33,-21,-9,3,15,27 (z=-5.15), south at x=-27,-15,-3,9,21 (z=+5.15). Anchors: street.center, street.crowdA, street.crowdB, street.camHigh, square.stage (S frame, +z toward the audience), square.banner, square.bannerCam, park.table, park.cam, town.overview. Looking down the street along -x gives open sky (good for sky objects); looking across the street you hit house fronts.
7. Night shots get dark: add a soft PointLight that rides with the camera (fill() in ep11) for faces.
8. Canvas text on props: size fonts so the text fits the texture (see label() in ep10) — overflowing text gets cropped.
9. Text overlays: ctx.fx.text(str,{x,y,size,fill,stroke,bg,rot,scale}); keep y 0.1–0.3 so the word captions (centre) stay readable. quoteCard hides captions while up; pass byAt for the attribution timing.
10. HUSS beats: one cut per HUSS (start 'bNN.h0-0.12' then 'bNN.hK-0.03'), each with a strong visual hit + ctx.cam.punch(hits, ctx.t, 0.1, 0.2).
11. Giant creatures/monsters/vehicles: build from boxes/cylinders/spheres/cones as bold silhouettes (big glowing eyes = MeshBasicMaterial spheres/boxes with emissive colours, chunky limbs); give them a userData.set(t, ...) animator. Scale contrast sells it: low camera near a small character with the giant filling the sky. Colored skies: change set background / fog colour, or put a big emissive sphere/plane behind the scene.
12. Sky objects can be hidden by the lamp heads, trees and roofs — verify with a single-frame render.
13. THE NARRATOR IS ALWAYS THE SAME CHARACTER: the creator's own avatar, cast id 'me' = MAIN.me from ${P}/src/cast.js (black hoodie with the white knight emblem, grey pants, white shoes, fade haircut, headphones). Whatever the script's visual notes say the narrator wears, use MAIN.me (you may add a hat/raincoat/pyjama colour change only if the story needs it, keep the face, hair and headphones). Other characters are new each episode.
14. QUALITY: make it look rich, not bare. Fill frames with life and atmosphere: extras going about their business, set dressing (signs, crates, plants, lamps, bunting, props on tables), lighting that matches the mood (warm day, golden dusk, cold blue night, eerie coloured sky), fog/particles where it fits (drifting sparkles, rain streaks, embers, dust, bubbles — simple instanced points or small boxes), glows on important objects, smooth camera moves (slow push-ins on reveals, crane-ups for scale, quick snap-zooms on jokes), and screen shake on impacts. Mysterious/mystical worlds should feel magical and beautiful (glowing colours, floating shapes, soft fog), not goth.
15. FACES vs TEXT (the critics' most common complaint): the centre word caption sits at y≈0.5–0.6 of the frame. In every close-up/medium shot aim the camera ~0.3–0.45 m BELOW the face so the face lands in the upper third, never centred; stamps/tags go at y 0.08–0.3 and must not cover eyes or mouths. Show faces front or 3/4 — a side view of a cube head with headphones shows only the ear cup. Never shoot a subject from behind on the beat where we need their reaction.
16. LIGHT and FLASHES: night/dark shots need a key or fill on the subject (no silhouettes unless the beat is about a silhouette); white flashes are pops (≤0.15 s), never a held haze. An iris/fade ending starts only after the last action has played for ≥1.5 s, and no caption/overlay stays on the black.
Make every beat's visual read clearly at phone size and match the script's visual notes as closely as the assets allow (simplify when a note is impossible; never leave a beat without a clear image). Aim for variety: no two consecutive shots from the same angle.`

phase('Build')
const built = await agent(`${BRIEF}
Build the complete shot list (and props), then preview the whole episode and fix framing/visibility problems. Iterate (at least 3 preview rounds) until every frame in the contact sheet clearly shows its beat. Report what you built and any compromises.`, { label: `build ${EP}`, phase: 'Build', effort: 'high' })

phase('Review')
const REVIEW = { type: 'object', properties: { problems: { type: 'array', items: { type: 'object', properties: { time: { type: 'number' }, beat: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['time', 'beat', 'problem', 'fix'] } }, verdict: { type: 'string' } }, required: ['problems', 'verdict'] }
const review = await agent(`${BRIEF}
You are the INDEPENDENT CRITIC (you did not write the shots). Render a fresh full preview (--preview 1.0 for denser sampling, --previewDir ${PV}_critic) and single frames at every quote-card reveal, card pop and HUSS hit. For each problem frame (camera inside something, subject off-frame/too small/hidden, unreadable action, wrong beat visual, text over faces, dead/black frames other than an intended ending, boring repeated angles) report time, beat, problem and a concrete fix. Do NOT edit files.`, { label: 'critic', phase: 'Review', schema: REVIEW })
let fixed = 'no problems reported'
if (review && review.problems && review.problems.length) {
  fixed = await agent(`${BRIEF}
A critic reviewed your ${EP} shots (${P}/src/${EP}/shots.js). Fix every problem below, re-preview the affected times to confirm, then do one final full --preview 1.5 pass. Problems:
${JSON.stringify(review.problems, null, 1)}
Report what you changed and anything you could not fix.`, { label: `fix ${EP}`, phase: 'Review', effort: 'high' })
}
return { built, review, fixed }
