#!/usr/bin/env bash
# Replace the soundtrack of a rendered episode with a rebuilt mix (picture untouched, no re-render).
#   tools/remux_audio.sh out/inthistown_ep2_bingo.mp4 episodes/ep2/mix.wav [out.mp4]
set -euo pipefail
vid="$1"; mix="$2"; out="${3:-${vid%.mp4}_bed.mp4}"
dur=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$vid")
ffmpeg -hide_banner -loglevel error -y -i "$vid" -i "$mix" -map 0:v:0 -map 1:a:0 -c:v copy \
  -af "apad" -t "$dur" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$out"
echo "$out ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out") s)"
