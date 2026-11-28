"""A/B test background beds under a finished cinematic mix (does not touch the episode):
   python3 tools/audio_ab.py cine01  → out/audio_ab/<ep>_{1_current,2_musicbox,3_musicbox_haunted,4_dark_underscore}.wav
Layers are ducked under the narration and muted in the script's cine_silence moments; each variant is mastered to the
episode's LUFS target with the same true-peak limiter as the real build."""
import sys, os, json, numpy as np, soundfile as sf
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, 'audio'))
import real as RL, bed as BED
ep = sys.argv[1]; E = os.path.join(ROOT, 'episodes', ep); O = os.path.join(ROOT, 'out', 'audio_ab'); os.makedirs(O, exist_ok=True)
script = json.load(open(os.path.join(E, 'script.json'))); tl = json.load(open(os.path.join(E, 'timeline.json')))
SR = 48000
raw, sr = sf.read(os.path.join(E, 'stems', 'mix_raw.wav'), dtype='float32', always_2d=True); assert sr == SR
voice, _ = sf.read(os.path.join(E, 'stems', 'voice.wav'), dtype='float32')
if voice.ndim > 1: voice = voice.mean(1)
N = len(raw); voice = voice[:N]
act = RL.sidechain(voice); vl = RL.loudness(np.stack([voice, voice], 1))
# mute mask for the dramatic silences (cine_silence segments), 60 ms fades
mus = tl['music']; tt = np.arange(N) / SR; mask = np.ones(N, np.float32)
for k, m in enumerate(mus):
    if m['mode'] in ('cine_silence', 'none'):
        t0 = m['t']; t1 = mus[k + 1]['t'] if k + 1 < len(mus) else tl['duration']
        mask *= 1 - np.clip(np.minimum((tt - t0) / 0.06 + 1, (t1 - tt) / 0.06 + 1), 0, 1)
def level(x, rel_db):   # scale a stereo layer so its loudness sits rel_db under the narration (before ducking)
    L = RL.loudness(x); return x * RL.db(vl + rel_db - L)
def lp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2)); return signal.lfilter(b, a, x, axis=0).astype(np.float32)
def finish(name, layer):
    mix = raw + (layer if layer is not None else 0)
    mm, rep = RL.master(mix, script.get('lufs', -16.0), script.get('ceiling', -1.5))
    p = os.path.join(O, f'{ep}_{name}.wav'); sf.write(p, mm, SR, subtype='PCM_16'); print(name, rep)
finish('1_current', None)
bedx = BED.load_tiled(BED.DEFAULT_BED, SR, N + SR * 4)
# 2: the series' music-box loop as it is, quiet, under everything except the silences
b2 = RL.duck(level(bedx[:N], -12.0), act, 7.0, 4.0) * mask[:, None]
finish('2_musicbox', b2.astype(np.float32))
# 3: the same loop made haunted: slowed to 0.8x (lower, slower), dark low-pass, slow tape warble, big hall reverb
slow = signal.resample_poly(bedx, 100, 80, axis=0).astype(np.float32)[: N + SR * 2]
wob = 1 + 0.004 * np.sin(2 * np.pi * 0.35 * np.arange(len(slow)) / SR)             # gentle pitch warble
idx = np.clip(np.cumsum(wob) - 1, 0, len(slow) - 1); i0 = idx.astype(int); fr = (idx - i0)[:, None]
i1 = np.minimum(i0 + 1, len(slow) - 1); slow = (slow[i0] * (1 - fr) + slow[i1] * fr).astype(np.float32)
h = RL.space(lp(slow, 2200), 'hall', wet=0.55, dry=0.7)[:N]
b3 = RL.duck(level(np.asarray(h, np.float32), -11.0), act, 7.0, 4.0) * mask[:, None]
finish('3_musicbox_haunted', b3.astype(np.float32))
# 4: my own underscore: a continuous dark drone pad (the film's cine_drone voice) under the whole film except the silences
pad = RL.score('cine_drone', N / SR + 1, seed=777)[:N]
b4 = RL.duck(level(np.asarray(pad, np.float32), -14.0), act, 6.0, 3.0) * mask[:, None]
finish('4_dark_underscore', b4.astype(np.float32))
