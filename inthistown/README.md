# In This Town — your own "HUSS! HUSS!" TikTok

An original 3D animated TikTok (1080×1920, 30 fps, ~97 s) in the style of the viral
*"In this town, everybody goes out partying… except me. HUSS! HUSS!"* stories, starring **your avatar**.

**The episode:** everybody in town parties every night, except you. You play chess (HUSS!). Then
comes the Summer Party Chess Match against the mayor, who's been undefeated for 40 years. Checkmate in
four moves. *"When did you get so good?" "While you were out partying."* Now the whole town grinds,
and your only opponent is the mayor's pigeon. (He might be winning.)

Everything is made from scratch: our own characters, town, story, voice and music. No footage, voice
or art from other creators.

## Make it look like you

Edit `ME` at the top of [`src/cast.js`](src/cast.js) (skin, hair style and colour, hoodie colour,
emblem, glasses, cap, chain…), then re-render.

## Change the story

1. Edit the lines in [`story/script.json`](story/script.json). Each beat is a narration line, a quote
   by another character, or a run of `HUSS!`.
2. `python3 audio/build_audio.py` regenerates the narration, HUSS hits, music and `audio/timeline.json`.
3. Adjust the matching shots in [`src/shots.js`](src/shots.js). Shots are anchored to words
   (`'b14.w5'` is word 5 of beat 14), so small timing changes follow automatically.

## Render

```bash
npm install                      # three + fonts
pip install kokoro-onnx soundfile scipy
bash tools/get_models.sh         # Kokoro TTS model (≈120 MB, from GitHub releases)
python3 audio/build_audio.py     # → audio/mix.wav + audio/timeline.json
node render.mjs --workers 2      # → out/inthistown.mp4
node render.mjs --preview 2      # quick contact sheet of frames every 2 s → out/preview/
```

Open `index.html?ui=1` through `node tools/serve.mjs` to scrub through the film in a browser.

## How it works

| Part | File |
|---|---|
| Story, beat by beat | `story/script.json` |
| Narration (Kokoro-82M, offline), HUSS synthesis, music + SFX (procedural), mix | `audio/build_audio.py`, `audio/synth.py` |
| Blocky characters with poses + painted faces | `src/characters.js` |
| Party town, town square, bedrooms | `src/world.js` |
| Chess set, clock, cake, party hats… | `src/props.js` |
| Timeline + shot player + word-by-word captions | `src/engine.js` |
| The film: cast, sets, shot list | `src/cast.js`, `src/shots.js`, `src/direct.js` |
| Frame capture → ffmpeg | `render.mjs` |

Rendering uses Three.js in headless Chromium, captured frame by frame, so every frame is deterministic.

## Episodes

Each episode is a script (`episodes/<ep>/script.json`), a shot list (`src/<ep>/shots.js`) and, if needed,
extra props. All of them use the same jinxy narrator voice, the real HUSS sample, weird quote cards and the
"Top 10 respectful moments" bit.

Every episode plays the sampled background loop (`audio/beds/reference_bed.wav`, `"bed": true` in the
script) in place of the procedural music; `BED=0` turns it off.

| # | Title | Narrator | Video |
|---|-------|----------|-------|
| 1 | Chess (60 s) | the kid | `out/inthistown_v3_60s.mp4` |
| 2 | Bingo | Grandad | `out/inthistown_ep2_bingo.mp4` |
| 3 | Don't Blink | the kid | `out/inthistown_ep3_dontblink.mp4` |
| 4 | Pigeon for Mayor | the pigeon | `out/inthistown_ep4_pigeon.mp4` |
| 5 | Freeze Dance | Brenda | `out/inthistown_ep5_freeze.mp4` |
| 6 | Gravity | the cat | `out/inthistown_ep6_gravity.mp4` |
| 7 | Limbo | Marcus | `out/inthistown_ep7_limbo.mp4` |
| 8 | Pet Rock | DJ Hip Replacement (91) | `out/inthistown_ep8_petrock.mp4` |
| 9 | The Heist | the burglar | `out/inthistown_ep9_heist.mp4` |
| 10 | Snooze | DJ Hip Replacement | `out/inthistown_ep10_snooze.mp4` |
| 11 | Hide and Seek | the kid | `out/inthistown_ep11_hideandseek.mp4` |

Build one:

```bash
python3 audio/build_episode.py ep4                     # narration + HUSS + music → episodes/ep4/{mix.wav,timeline.json}
node render.mjs --timeline episodes/ep4/timeline.json --shots /src/ep4/shots.js --preview 1.5   # contact sheet
node render.mjs --timeline episodes/ep4/timeline.json --shots /src/ep4/shots.js --out out/ep4.mp4 --workers 2
```

`--from/--to` re-render a time range (handy for patching one shot into a finished video).
