"""Whisper check of the non-narration lines (timeline 'subs', e.g. radio/phone voices) on the full mix.
   python3 tools/asr_subs.py <ep>"""
import sys, json, numpy as np, soundfile as sf, sherpa_onnx
from scipy import signal
ep = sys.argv[1]; R = '/home/user/Escape/inthistown/episodes/' + ep
M = '/tmp/claude-0/-home-user-Escape/7c739366-3c1e-5f55-ba88-90a34b5c1b47/scratchpad/models/sherpa-onnx-whisper-small.en/small.en-'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M + 'encoder.int8.onnx', decoder=M + 'decoder.int8.onnx', tokens=M + 'tokens.txt', num_threads=4)
for stem in ('mix.wav',):
    v, sr = sf.read(R + '/' + stem, dtype='float32')
    if v.ndim > 1: v = v.mean(1)
    v = signal.resample_poly(v, 16000, sr).astype(np.float32)
    tl = json.load(open(R + '/timeline.json'))
    for sb in tl.get('subs', []):
        a, e = int((sb['t0'] - 0.15) * 16000), int((sb['t1'] + 0.25) * 16000)
        s = rec.create_stream(); s.accept_waveform(16000, v[max(0, a):e]); rec.decode_stream(s)
        print(sb['beat'], sb['style'], f"{sb['t0']:.2f}-{sb['t1']:.2f}", '|', sb['text'], '\n     →', s.result.text.strip())
