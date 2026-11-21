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
