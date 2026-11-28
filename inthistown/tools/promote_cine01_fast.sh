#!/usr/bin/env bash
# The user chose pacing B (faster narration, 94 s) + sound 2 (the series' music-box bed, quiet).
# Make that the real cine01: archive the 101 s version as cine01_slow, copy the fast script/timeline/stems in,
# and use the music-box master as cine01/mix.wav. Shots are anchored to beats/words/markers, so they follow.
set -euo pipefail
cd /home/user/Escape/inthistown
[ -d episodes/cine01_slow ] || cp -r episodes/cine01 episodes/cine01_slow
python3 - <<'PY'
import json
for ep in ('cine01_slow',):
    p=f'episodes/{ep}/timeline.json'; t=json.load(open(p)); t['audio']=f'episodes/{ep}/mix.wav'; json.dump(t,open(p,'w'),indent=1)
PY
cp episodes/cine01_fast/script.json episodes/cine01/script.json
rm -rf episodes/cine01/stems && cp -r episodes/cine01_fast/stems episodes/cine01/stems
python3 - <<'PY'
import json
t=json.load(open('episodes/cine01_fast/timeline.json')); t['audio']='episodes/cine01/mix.wav'
json.dump(t,open('episodes/cine01/timeline.json','w'),indent=1)
PY
cp out/audio_ab/cine01_fast_2_musicbox.wav episodes/cine01/mix.wav
python3 -c "import json;t=json.load(open('episodes/cine01/timeline.json'));print('cine01 now', t['duration'], 's', t['audio'])"
