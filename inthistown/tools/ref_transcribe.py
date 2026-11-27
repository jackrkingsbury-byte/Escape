"""Re-transcribe reference videos robustly (music beds make Whisper emit [MUSIC] for whole windows).
   6 s windows; when a window comes back empty or as a bracketed tag, retry shifted/longer windows.
   python3 tools/ref_transcribe.py <refs_dir>   (reads <refs_dir>/refNN/info.json 'file', rewrites transcript.txt)"""
import sys, os, re, json, subprocess, numpy as np, soundfile as sf, sherpa_onnx
M = '/tmp/claude-0/-home-user-Escape/7c739366-3c1e-5f55-ba88-90a34b5c1b47/scratchpad/models/sherpa-onnx-whisper-small.en/small.en-'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M + 'encoder.int8.onnx', decoder=M + 'decoder.int8.onnx', tokens=M + 'tokens.txt', num_threads=4)
O = sys.argv[1]; SR = 16000
TAG = re.compile(r'^[\[\(\*♪].*[\]\)\*♪]$|^$')
def dec(a, s, W):
    seg = a[max(0, int(s * SR)):int((s + W) * SR)]
    if len(seg) < SR * 0.6: return ''
    seg = (seg / (np.abs(seg).max() + 1e-6) * 0.7).astype(np.float32)
    st = rec.create_stream(); st.accept_waveform(SR, seg); rec.decode_stream(st); return st.result.text.strip()
for tag in sorted(t for t in os.listdir(O) if t.startswith('ref')):
    info = json.load(open(os.path.join(O, tag, 'info.json'))); v = info['file']
    if not os.path.isabs(v): v = os.path.join(sys.argv[2] if len(sys.argv) > 2 else '.', v)
    wav = os.path.join(O, tag, 'a.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', v, '-vn', '-ac', '1', '-ar', str(SR), wav], check=True)
    a, _ = sf.read(wav, dtype='float32'); os.remove(wav); dur = len(a) / SR; lines = []
    for s in np.arange(0, dur, 6.0):
        txt = ''
        for ds, W in ((0, 6), (-0.7, 7), (0.6, 6.5), (-1.5, 9), (1.2, 8)):
            txt = dec(a, s + ds, W)
            if not TAG.match(txt): break
        lines.append(f'[{int(s // 60):02d}:{s % 60:04.1f}] {txt if not TAG.match(txt) else "(no speech / music only)"}')
    open(os.path.join(O, tag, 'transcript.txt'), 'w').write('\n'.join(lines) + '\n(6 s windows: words at window edges may repeat or be cut)\n')
    print(tag, 'done', flush=True)
