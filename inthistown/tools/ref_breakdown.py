"""Break down reference TikToks for analysis: contact sheets (1 fps), cut list, Whisper transcript with times.
   python3 tools/ref_breakdown.py <outdir> <video>..."""
import sys, os, re, json, subprocess, numpy as np, soundfile as sf
from scipy import signal
O = sys.argv[1]; vids = sys.argv[2:]
M = '/tmp/claude-0/-home-user-Escape/7c739366-3c1e-5f55-ba88-90a34b5c1b47/scratchpad/models/sherpa-onnx-whisper-small.en/small.en-'
import sherpa_onnx
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M + 'encoder.int8.onnx', decoder=M + 'decoder.int8.onnx', tokens=M + 'tokens.txt', num_threads=4)
summary = []
for i, v in enumerate(vids, 1):
    tag = f'ref{i:02d}'; d = os.path.join(O, tag); os.makedirs(d, exist_ok=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout)
    # 1 fps thumbnails with timestamps -> sheets of 24 (6x4)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', v, '-vf', "fps=1,scale=240:-2,drawtext=text='%{pts\\:gmtime\\:0\\:%M\\\\\\:%S}':x=6:y=h-26:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6", os.path.join(d, 't_%04d.jpg')], check=True)
    n = len([f for f in os.listdir(d) if f.startswith('t_')])
    for k in range(0, n, 24):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-start_number', str(k + 1), '-i', os.path.join(d, 't_%04d.jpg'), '-vf', 'tile=6x4:padding=3:color=black', '-frames:v', '1', os.path.join(d, f'sheet_{k // 24:02d}.jpg')], check=True)
    for f in os.listdir(d):
        if f.startswith('t_'): os.remove(os.path.join(d, f))
    # full-res stills at 0.5 s and 3 s (the hook)
    for t in (0.5, 3.0):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', v, '-frames:v', '1', os.path.join(d, f'still_{t:04.1f}.jpg')])
    # cuts
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', v, '-vf', "select='gt(scene,0.30)',showinfo", '-f', 'null', '-'], capture_output=True, text=True).stderr
    cuts = [round(float(x), 2) for x in re.findall(r'pts_time:([0-9.]+)', r)]
    # audio -> transcript in 12 s windows (with times)
    wav = os.path.join(d, 'audio16k.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', v, '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
    a, sr = sf.read(wav, dtype='float32'); lines = []
    W = 12
    for s in np.arange(0, len(a) / sr, W):
        seg = a[int(s * sr): int((s + W) * sr)]
        if len(seg) < sr * 0.5: continue
        st = rec.create_stream(); st.accept_waveform(sr, seg); rec.decode_stream(st)
        lines.append(f'[{int(s // 60):02d}:{int(s % 60):02d}] {st.result.text.strip()}')
    os.remove(wav)
    open(os.path.join(d, 'transcript.txt'), 'w').write('\n'.join(lines))
    sl = np.diff([0] + cuts + [dur]) if cuts else np.array([dur])
    info = {'tag': tag, 'file': v, 'duration': round(dur, 1), 'cuts': len(cuts), 'avg_shot_s': round(float(np.mean(sl)), 2), 'median_shot_s': round(float(np.median(sl)), 2), 'cut_times': cuts}
    json.dump(info, open(os.path.join(d, 'info.json'), 'w'), indent=1)
    summary.append({k: info[k] for k in ('tag', 'duration', 'cuts', 'avg_shot_s', 'median_shot_s')} | {'file': os.path.basename(v)})
    print(tag, os.path.basename(v)[:20], round(dur, 1), 's', len(cuts), 'cuts', flush=True)
json.dump(summary, open(os.path.join(O, 'summary.json'), 'w'), indent=1)
