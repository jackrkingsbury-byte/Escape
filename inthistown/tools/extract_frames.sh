#!/usr/bin/env bash
# Extract review frames from a rendered film:  tools/extract_frames.sh <video.mp4> <outdir> [timeline.json]
#   <outdir>/f_<sec>.png       full-res frame at every whole second
#   <outdir>/f_<t>.png         extra full-res frames at every timeline marker (+0.05 s, i.e. on the flash peak)
#   <outdir>/sheet_<nn>.jpg    labelled contact sheets, 2 fps, 6x2 frames each (12 frames = 6 s per sheet)
set -euo pipefail
V="$1"; O="$2"; TL="${3:-}"
mkdir -p "$O" "$O/_s"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
N=$(python3 -c "import math;print(int(math.floor($DUR)))")
for s in $(seq 0 "$N"); do
  t=$(printf "%03d" "$s")
  ffmpeg -v error -y -ss "$s" -i "$V" -frames:v 1 "$O/f_$t.png" || true
done
if [ -n "$TL" ]; then
  python3 - "$TL" > "$O/_markers.txt" <<'PY'
import json,sys
tl=json.load(open(sys.argv[1]))
for k,v in sorted(tl.get('markers',{}).items(), key=lambda kv: kv[1]): print(f"{float(v)+0.05:.2f} {k}")
PY
  while read -r t name; do ffmpeg -v error -y -ss "$t" -i "$V" -frames:v 1 "$O/f_$(printf '%06.2f' "$t")_$name.png" || true; done < "$O/_markers.txt"
fi
# 2 fps labelled thumbnails → sheets of 12
ffmpeg -v error -y -i "$V" -vf "fps=2,scale=360:-2,drawtext=text='%{pts\:hms}':x=8:y=h-32:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6" "$O/_s/s_%04d.jpg"
python3 - "$O" <<'PY'
import sys,glob,subprocess,os
O=sys.argv[1]; fs=sorted(glob.glob(O+'/_s/s_*.jpg'))
for k in range(0,len(fs),12):
    n=len(fs[k:k+12])
    subprocess.run(['ffmpeg','-v','error','-y','-start_number',str(k+1),'-i',O+'/_s/s_%04d.jpg','-frames:v',str(n),
                    '-vf','tile=6x2:padding=4:color=black','-frames:v','1',f"{O}/sheet_{k//12:02d}.jpg"],check=True)
print(len(fs),'thumbs',(len(fs)+11)//12,'sheets')
PY
