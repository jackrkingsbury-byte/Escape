"""The sampled background bed (the bouncy music-box loop from the user's reference clip) as the episode soundtrack.

audio/beds/reference_bed.wav is one seamless 10.2175 s loop (48 kHz stereo, peak −3 dBFS, RMS ≈ −18.7 dBFS),
isolated from the reference with UVR-MDX instrumental models (no narrator left in it).

When a bed is on it REPLACES the procedural party/lo-fi music and follows the same music modes:
  party   → the bed, full
  muffled → the bed through a wall (2× 380 Hz low-pass), like the party heard from the bedroom
  lofi    → the bed softened (1.4 kHz low-pass), a bit quieter
  night   → night ambience + a faint muffled bed
  none    → silence (dramatic stops stay dramatic)
It keeps playing under the HUSS runs (it is what sits under the HUSSes in the reference), so the synthetic
held organ chord is not added when a bed is on.  Default level: ~11 dB under the narration while it talks.
"""
import os
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_BED = os.path.join(HERE, 'beds', 'reference_bed.wav')
GAIN = 0.8           # → bed ≈ 11 dB under the narration while it talks (the reference sits 10-12 dB under), louder in gaps


def _lp(x, fc, sr):
    b, a = signal.butter(2, fc / (sr / 2))
    return signal.lfilter(b, a, x, axis=0).astype(np.float32)


def load_tiled(path, sr, n, offset=0.0):
    b, bsr = sf.read(path, dtype='float32', always_2d=True)
    if b.shape[1] == 1:
        b = np.repeat(b, 2, 1)
    if bsr != sr:
        b = signal.resample_poly(b, sr, bsr, axis=0).astype(np.float32)
    reps = int(np.ceil(n / len(b))) + 1
    off = int(offset * sr) % len(b)
    return np.tile(b, (reps, 1))[off: off + n].copy()


def modes(sr, n, path=None, gain=GAIN, offset=0.0):
    """→ dict mode → (stereo source, gain) matching build_episode's music `gains` table (night handled by caller)."""
    full = load_tiled(path or DEFAULT_BED, sr, n, offset)
    muff = _lp(_lp(full, 380, sr), 380, sr) * 1.6
    soft = _lp(full, 1400, sr)
    return {'party': (full, gain), 'muffled': (muff, gain * 0.9), 'lofi': (soft, gain * 0.8), 'night_bed': (muff, gain * 0.35)}


def enabled(cfg):
    """cfg = script.json 'bed' entry (dict / True / None).  BED=0 in the environment turns every bed off."""
    if os.environ.get('BED', '1') == '0' or not cfg:
        return None
    if cfg is True:
        cfg = {}
    p = cfg.get('path', DEFAULT_BED)
    if not os.path.isabs(p):
        p = os.path.join(os.path.dirname(HERE), p)
    return {'path': p, 'gain': cfg.get('gain', GAIN), 'offset': cfg.get('offset', 0.0)}
