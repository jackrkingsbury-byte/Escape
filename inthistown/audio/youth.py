"""Turn an adult TTS voice into a younger, brighter, more expressive one (WORLD vocoder).

f0_scale: pitch multiplier · formant: vocal-tract shortening (>1 = smaller/younger) ·
expr: exaggerate the pitch contour around its median (1 = unchanged).
"""
import numpy as np
import pyworld as pw


def youthify(y, sr, f0_scale=1.5, formant=1.1, expr=1.15, period=5.0):
    x = y.astype(np.float64)
    f0, t = pw.harvest(x, sr, f0_floor=60, f0_ceil=520, frame_period=period)
    f0 = pw.stonemask(x, f0, t, sr)
    sp = pw.cheaptrick(x, f0, t, sr)
    ap = pw.d4c(x, f0, t, sr)
    v = f0 > 0
    f0n = f0.copy()
    if v.any():
        lf = np.log(f0[v]); m = np.median(lf)
        f0n[v] = np.exp(m + (lf - m) * expr) * f0_scale
    nb = sp.shape[1]
    bins = np.arange(nb, dtype=np.float64)
    src = np.clip(bins / formant, 0, nb - 1)
    sp2 = np.empty_like(sp); ap2 = np.empty_like(ap)
    for i in range(sp.shape[0]):
        sp2[i] = np.interp(src, bins, sp[i])
        ap2[i] = np.interp(src, bins, ap[i])
    out = pw.synthesize(f0n, sp2, ap2, sr, period)
    out = out[: len(y)] if len(out) >= len(y) else np.pad(out, (0, len(y) - len(out)))
    pk = np.abs(out).max() + 1e-9
    return (out / pk * min(0.95, np.abs(y).max() / (np.abs(y).max() + 1e-9))).astype(np.float32)
