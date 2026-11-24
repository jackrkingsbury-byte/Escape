# Cinematic audio kit report (audio/real.py)

The cinematic sound layer is built and working, and old episodes are unaffected. ep22 rebuilds bit-identical to its existing mix, and the demo episode (realdemo) builds at -16.0 LUFS with no clipping.

**What I built**
- `audio/real.py` (about 1,540 lines): seeded numpy, stereo, 48 kHz (the project rate), fully deterministic, no samples.
- **Reverb helper:** `space(x, name, wet)` convolves with a synthetic impulse response: discrete early reflections plus a tail whose decay time differs per frequency band. Spaces: `cave` (3.6 s, keeps the lows), `forest`, `hall`, `ship`, `room`, `beach`.
- **Ducking:** a narration-driven duck with look-ahead and hold so it doesn't pump. Ambience ducks 6 dB plus a 4 dB dip at 0.9–4.5 kHz, score 6 + 3 dB, sfx 4 + 2 dB.
- **Mastering:** my own BS.1770 loudness measurement (it matches ffmpeg's EBU R128 meter) and a true-peak limiter that can't overshoot.
- **Preview:** `python3 audio/real.py preview` writes every bed, cue and sfx to `out/audio_real/` as WAVs plus spectrogram PNGs.

**Ambience beds** (`"amb"` on a beat)
- `rain_forest`: heavy rain on leaves, made of a noise wash, thousands of droplet ticks per second, leaf taps, canopy drips (rising-pitch "plink" when a drop hits water) and runoff.
- `rain_beach`: rain on sand and on the sea surface (fizzy micro-bubbles), soft distant surf.
- `storm_wind`: gusts through trees, with whistles that only appear in strong gusts, thrashing leaves, debris ticks and distant trunk creaks.
- `storm_sea`: storm from a small boat: screaming wind, rain hammering the deck, swells slamming the hull, creaks.
- `surf`: wave cycles every 8–12 s (build, crash, hiss/fizz, backwash with pebble rattle), with a bigger set every few waves.
- `cave`: low room tone, 3 drip spots each with its own pitch and rhythm under long echo, a distant underground stream, rare deep rumbles.
- `jungle_night`: subtle insects, crickets, coqui-like tree frogs and far croakers over light rain.
- `campfire`: flame roar, hiss, clustered crackles, snaps, sap sizzles.

**Music modes** (`"music"` on a beat)
- `cine_drone`: tension drone of detuned low strings with a slowly moving filter, a sub octave, and a clashing note that swells in and out.
- `cine_swell`: tremolo string-cluster crescendo with a noise riser and an endlessly rising tone; it builds exactly to the next music change.
- `cine_heart`: heartbeat accelerating 70 → 100 bpm over a darker drone.
- `cine_sad`: sparse sad piano motif in A minor with a soft string pad.
- `cine_silence`: true silence; the previous cue cuts dead in 60 ms.

**SFX** (`"type"`)
- `thunder_far`: distant rolling thunder, no crack.
- `thunder_crack`: close lightning: crack, ripping crackle, boom, then the roll.
- `impact`: trailer hit (sub drop, crack, metal ring).
- `braam`: huge brassy low hit with a growl and long tail.
- `whoosh_low`: low airy pass-by panning across.
- `riser`: horror riser that peaks at its end.
- `heartbeat` / `heartbeat_loop`: single lub-dub / a run with optional acceleration (`dur`, `bpm`, `bpm_end`).
- `footsteps_mud`: squelching steps (`n`, `bpm`).
- `branch_snap`: snap plus leaf rustle.
- `wood_creak`: creaking wood (`dur`, `pitch`).
- `drip`: single drip with cave echo.
- `radio`: squelch, static and a filtered voice burst. With `"text"` (and optional `"voice"` / `"speaker"`) a real TTS line plays through the radio; otherwise unintelligible babble.
- `stinger`: jump-scare stab with screech and slam.
- `splash`: object or body into water (`size`).
- `wave_crash`: one big wave.
- `fire_ignite`: match strike and fire catching.

**Using them in script.json**
- `"amb"` takes a name, `"a+b"` to layer two beds, `{"name": "...", "gain": 0.8}`, or `"none"`. The bed continues until the next `"amb"`. The crossfade lasts `"ambFade"` seconds (default 1.5; use about 0.4 for a hard cut).
- `"music"` takes the `cine_*` modes above.
- `"space": "cave"` adds subtle reverb to that beat's narration and becomes the default space for that beat's sfx.
- SFX accept the existing `at` / `gain` plus `dur`, `n`, `bpm`, `bpm_end`, `pan`, `size`, `space`, `wet`. `"align": "peak"` lands the climax on the anchor (a riser's end, a whoosh's centre).
- Script-level `"lufs"` sets the master target (default -16).
- Example: `{"id": "b08", "text": "Into a cave...", "amb": "cave", "ambFade": 0.4, "music": "cine_drone", "space": "cave", "sfx": [{"type": "drip", "at": "w:cave+0.6"}]}`

**How it fits into `audio/build_episode.py`**
Everything new only switches on when a script uses an `amb` key, a `cine_*` music mode, a new sfx type or `"master": "cine"`. Then the beds and score are added and ducked, the sfx bus is ducked, and the mix is mastered by `real.py` (no soft-clip; 16-bit) instead of the ffmpeg loudnorm pass. It also writes `stems/amb.wav` and an `amb` list in `timeline.json`. Old scripts take exactly the old code path, and the docstring documents the new fields.

**Test results**
- **Demo:** `episodes/realdemo/script.json` has 12 beats and uses every bed, mode and sfx. The story runs storm at sea → beach → rain forest → snap → run → cave → radio ("Is anyone... out there?") → fire → night jungle → "footprints... Not mine." The mix is 48.1 s.
- **Loudness:** ffmpeg EBU R128 reads -16.0 LUFS integrated, loudness range 7.3 LU, peak -1.8 dB (true peak). There are 0 clipped samples.
- **Narration on top:** in the speech band (0.3–4 kHz), the voice sits 6.6–18.6 dB above everything else during each line. Ambience is about 14 dB under while speaking and comes back up 5–15 dB in the gaps.
- **Spectrograms:** I checked them all. They caught and I fixed: tonal whistles in the dense rain/fizz/deck layers (each 0.25 s now gets fresh drop sounds), clicks where sounds were cut off before their reverb tail, campfire peaks reaching +5.9 dBFS (beds are now held under -6 dBFS), and a ringing 900 Hz tone in the cave.
- **Old episodes:** ep22 rebuilt with the new code is bit-identical (`np.array_equal` = True) to the mix it had before my changes. I also confirmed the unchanged code already reproduced it exactly. It was compared against the on-disk mix because mix.wav is gitignored, so `git show HEAD:.../mix.wav` doesn't exist. The committed ep22 `timeline.json` is unchanged.

**Caveats**
- Big hits that overlap words still compete even with the 4 dB sfx duck. Place them in gaps (`end+0.1`) or use `align: peak` before a line; that's what I did in the demo.
- Build time goes up: realdemo takes about 2.5–3 min, mostly bed rendering, and there's no disk cache.
- The demo narration is fast and the beats are short. A real ~90 s episode should use `gapAfter` of 1.5–3 s so the beds can breathe.
- Cinematic episodes master to -16 LUFS by default, while older episodes stay at -14. Set `"lufs": -14` if the episode should match the other TikTok uploads.
- matplotlib was pip-installed to make the spectrograms; `real.py` only needs it for `preview`.
- Commit e4071a0 (someone else's "Cinematic one-off: story scout research…") already holds an earlier snapshot of my `real.py`. The working tree has the final version. Nothing is committed by me: the `build_episode.py` changes, the newer `real.py` and `episodes/realdemo/` are all uncommitted.

Files are in `/home/user/Escape/inthistown/`:
- `audio/real.py`
- `audio/build_episode.py`
- `episodes/realdemo/script.json`
- `episodes/realdemo/mix.wav`
- `episodes/realdemo/timeline.json`
- `episodes/realdemo/stems/`
- `out/audio_real/` (WAVs, `spec_beds.png`, `spec_score.png`, `spec_sfx.png`, `spec_realdemo_mix.png`, `spec_realdemo_part1.png`…`part4.png`, plus `realdemo_mix.wav`)