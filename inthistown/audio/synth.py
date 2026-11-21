"""Procedural music + sound effects for In This Town (all original, generated from scratch).

Everything renders at SR = 48 kHz, float32, mono unless noted. Deterministic (seeded numpy RNG).
"""
import numpy as np
from scipy import signal

SR = 48000


def _t(dur):
    return np.arange(int(dur * SR)) / SR


def env_exp(n, decay_s):
    return np.exp(-np.arange(n) / (decay_s * SR)).astype(np.float32)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi / (SR / 2), 0.999)], btype='band')
    return signal.lfilter(b, a, x).astype(np.float32)


def lp(x, f, order=2):
    b, a = signal.butter(order, min(f / (SR / 2), 0.999), btype='low')
    return signal.lfilter(b, a, x).astype(np.float32)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), btype='high')
    return signal.lfilter(b, a, x).astype(np.float32)


def place(buf, x, at, gain=1.0):
    i = int(round(at * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    if i < 0:
        x = x[-i:]; j = min(len(buf), len(x)); i = 0
    buf[i:j] += gain * x[: j - i]


def note_hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def saw(f, t, phase=0.0):
    return (2 * ((f * t + phase) % 1.0) - 1).astype(np.float32)


def reverb(x, room=0.5, wet=0.25, seed=3):
    """Cheap convolution reverb with a synthetic exponentially decaying noise IR."""
    rng = np.random.default_rng(seed)
    n = int(SR * (0.25 + 1.6 * room))
    ir = rng.standard_normal(n).astype(np.float32) * env_exp(n, 0.12 + 0.5 * room)
    ir = lp(ir, 6000)
    ir[: int(0.012 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum()) + 1e-9
    y = signal.fftconvolve(x, ir)[: len(x)].astype(np.float32)
    return x * (1 - wet) + y * wet * 1.4


# ---------------------------------------------------------------------------------------------- drums
def kick(dur=0.35, f0=130, f1=42, decay=0.22, click=0.3):
    t = _t(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env_exp(len(t), decay)
    x[: int(0.004 * SR)] += click * np.random.default_rng(1).standard_normal(int(0.004 * SR))
    return np.tanh(1.6 * x).astype(np.float32)


def clap(seed=2):
    rng = np.random.default_rng(seed)
    n = int(0.25 * SR)
    noise = rng.standard_normal(n).astype(np.float32)
    e = np.zeros(n, np.float32)
    for k, off in enumerate([0, 0.011, 0.022, 0.034]):
        i = int(off * SR)
        e[i:] += (0.8 if k < 3 else 1.0) * env_exp(n - i, 0.012 if k < 3 else 0.09)
    return bp(noise * e, 900, 3500) * 1.6


def hat(open_=False, seed=4):
    rng = np.random.default_rng(seed)
    n = int((0.18 if open_ else 0.05) * SR)
    x = hp(rng.standard_normal(n).astype(np.float32), 7000) * env_exp(n, 0.06 if open_ else 0.012)
    return x * (0.5 if open_ else 0.45)


def snare_soft(seed=5):
    rng = np.random.default_rng(seed)
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 190 * t) * env_exp(n, 0.05)
    nz = lp(rng.standard_normal(n).astype(np.float32), 5000) * env_exp(n, 0.08)
    return (0.6 * body + 0.5 * nz).astype(np.float32)


# --------------------------------------------------------------------------------------------- tracks
def party_track(dur, bpm=118, seed=10):
    """Bouncy original house groove in A minor: Am F C G."""
    beat = 60 / bpm
    out_l = np.zeros(int(dur * SR) + SR, np.float32)
    out_r = np.zeros_like(out_l)
    K, C, CH, OH = kick(), clap(), hat(False), hat(True)
    prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (55, [55, 59, 62])]  # root, chord
    nbeats = int(dur / beat) + 2
    # side-chain pump curve (per sample), dips after every kick
    pump = np.ones_like(out_l)
    for b in range(nbeats):
        i = int(b * beat * SR)
        n = min(int(beat * SR), len(pump) - i)
        if n <= 0:
            break
        x = np.arange(n) / SR
        pump[i:i + n] = 0.35 + 0.65 * (1 - np.exp(-x / 0.09))
    for b in range(nbeats):
        tb = b * beat
        bar = b // 4
        root, chord = prog[bar % 4]
        place(out_l, K, tb, 0.9); place(out_r, K, tb, 0.9)
        if b % 2 == 1:
            place(out_l, C, tb, 0.42); place(out_r, C, tb, 0.42)
        place(out_l, CH, tb + beat * 0.0, 0.18)
        place(out_r, OH, tb + beat * 0.5, 0.22)
        place(out_l, CH, tb + beat * 0.75, 0.10)
        # offbeat bass (house)
        for off in (0.5,):
            n = int(beat * 0.42 * SR)
            t = np.arange(n) / SR
            f = note_hz(root - 24 + 12)
            x = lp(saw(f, t) + 0.5 * saw(f * 1.005, t), 700) * env_exp(n, 0.18)
            place(out_l, x, tb + beat * off, 0.33); place(out_r, x, tb + beat * off, 0.33)
        # chord stab on the "and" of 2 and 4
        if b % 2 == 1:
            n = int(beat * 0.45 * SR)
            t = np.arange(n) / SR
            x = np.zeros(n, np.float32)
            for m in chord:
                for d in (-0.08, 0.0, 0.08):
                    x += saw(note_hz(m + 12) * (1 + d / 100), t, phase=abs(d))
            x = lp(x, 2600) * env_exp(n, 0.16) / 9
            place(out_l, x, tb + beat * 0.5, 0.55); place(out_r, x, tb + beat * 0.52, 0.55)
        # pluck arpeggio 16ths (quiet sparkle)
        for s in range(4):
            m = chord[(b * 4 + s) % 3] + 24
            n = int(beat * 0.24 * SR)
            t = np.arange(n) / SR
            x = (np.sign(np.sin(2 * np.pi * note_hz(m) * t)) * 0.5 + np.sin(2 * np.pi * note_hz(m) * t)) * env_exp(n, 0.05)
            x = lp(x.astype(np.float32), 4000)
            pan = 0.35 + 0.3 * (s % 2)
            place(out_l, x, tb + s * beat / 4, 0.06 * (1 - pan) * 2)
            place(out_r, x, tb + s * beat / 4, 0.06 * pan * 2)
    # pad with pump
    t = np.arange(len(out_l)) / SR
    pad = np.zeros_like(out_l)
    for bar in range(int(nbeats / 4) + 1):
        root, chord = prog[bar % 4]
        i0, i1 = int(bar * 4 * beat * SR), int((bar + 1) * 4 * beat * SR)
        i1 = min(i1, len(pad))
        if i0 >= len(pad):
            break
        tt = t[i0:i1]
        seg = np.zeros(i1 - i0, np.float32)
        for m in chord:
            seg += saw(note_hz(m), tt) + saw(note_hz(m) * 1.003, tt, 0.3)
        seg = lp(seg, 1200) / 8
        fade = np.minimum(1, np.minimum(np.arange(len(seg)), len(seg) - np.arange(len(seg))) / (0.02 * SR))
        pad[i0:i1] += seg * fade
    out_l += pad * pump * 0.55
    out_r += pad * pump * 0.55
    n = int(dur * SR)
    return np.stack([out_l[:n], out_r[:n]], 1) * 0.8


def lofi_track(dur, bpm=80, seed=20):
    """Original chill lo-fi loop: Fmaj7 Em7 Dm7 Cmaj7, swung hats, soft keys, vinyl crackle."""
    rng = np.random.default_rng(seed)
    beat = 60 / bpm
    N = int(dur * SR) + SR
    L = np.zeros(N, np.float32); R = np.zeros(N, np.float32)
    chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
    K = kick(f0=90, f1=45, decay=0.18, click=0.1) * 0.8
    S = snare_soft()
    nbeats = int(dur / beat) + 2
    for b in range(nbeats):
        tb = b * beat
        bar = b // 4
        ch = chords[bar % 4]
        if b % 4 in (0,) or (b % 4 == 2 and bar % 2 == 1):
            place(L, K, tb, 0.7); place(R, K, tb, 0.7)
        if b % 4 == 2 and bar % 2 == 0:
            place(L, K, tb + beat * 0.5, 0.5); place(R, K, tb + beat * 0.5, 0.5)
        if b % 2 == 1:
            place(L, S, tb, 0.32); place(R, S, tb, 0.32)
        for k, sw in enumerate((0.0, 0.62)):
            h = hat(False, seed=30 + b) * (0.8 if k == 0 else 0.55)
            place(R, h, tb + beat * sw, 0.35); place(L, h, tb + beat * sw, 0.18)
        if b % 4 == 0:  # keys: soft electric-piano chord once per bar, with a little strum
            n = int(beat * 4 * SR)
            t = np.arange(n) / SR
            for j, m in enumerate(ch):
                f = note_hz(m)
                x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.3)
                     + 0.12 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / 0.15))
                x = x * env_exp(n, 1.6) * (1 + 0.12 * np.sin(2 * np.pi * 4.5 * t))
                place(L, x.astype(np.float32), tb + j * 0.018, 0.075)
                place(R, x.astype(np.float32), tb + j * 0.022, 0.075)
            # bass
            n2 = int(beat * 1.8 * SR)
            t2 = np.arange(n2) / SR
            fb = note_hz(ch[0] - 12)
            xb = np.sin(2 * np.pi * fb * t2) * env_exp(n2, 0.6)
            place(L, xb.astype(np.float32), tb, 0.28); place(R, xb.astype(np.float32), tb, 0.28)
            place(L, xb.astype(np.float32), tb + 2.5 * beat, 0.2); place(R, xb.astype(np.float32), tb + 2.5 * beat, 0.2)
    # vinyl crackle + hiss
    hiss = lp(rng.standard_normal(N).astype(np.float32), 3000) * 0.006
    clicks = np.zeros(N, np.float32)
    idx = rng.integers(0, N, int(dur * 9))
    clicks[idx] = rng.uniform(-0.25, 0.25, len(idx))
    clicks = bp(clicks, 1500, 8000)
    L += hiss + clicks; R += hiss + clicks * 0.8
    out = np.stack([L, R], 1)
    out[:, 0] = lp(out[:, 0], 6500); out[:, 1] = lp(out[:, 1], 6500)
    n = int(dur * SR)
    return out[:n] * 0.9


def night_ambience(dur, seed=40):
    rng = np.random.default_rng(seed)
    N = int(dur * SR)
    wind = lp(rng.standard_normal(N).astype(np.float32), 400) * 0.05
    wind *= 0.6 + 0.4 * np.sin(2 * np.pi * np.arange(N) / SR / 5.3)
    L = wind.copy(); R = wind.copy()
    t = 0.2
    while t < dur - 0.5:
        f = rng.uniform(4200, 5200)
        n_chirps = rng.integers(2, 4)
        for c in range(n_chirps):
            n = int(0.045 * SR)
            tt = np.arange(n) / SR
            x = np.sin(2 * np.pi * f * tt) * np.sin(np.pi * tt / 0.045) ** 2 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 60 * tt)))
            pan = rng.uniform(0.2, 0.8)
            place(L, x.astype(np.float32), t + c * 0.07, 0.035 * (1 - pan))
            place(R, x.astype(np.float32), t + c * 0.07, 0.035 * pan)
        t += rng.uniform(0.35, 0.9)
    return np.stack([L, R], 1)


# ------------------------------------------------------------------------------------------------ sfx
def wood_knock(seed=50, pitch=1.0):
    """Chess piece slammed on a wooden board."""
    rng = np.random.default_rng(seed)
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for f, d, a in ((640, 0.05, 1.0), (1330, 0.035, 0.6), (2210, 0.02, 0.4), (3400, 0.012, 0.25)):
        x += a * np.sin(2 * np.pi * f * pitch * t) * np.exp(-t / d)
    x += 0.9 * np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.05)
    nz = rng.standard_normal(int(0.006 * SR)).astype(np.float32)
    x[: len(nz)] += hp(nz, 1500) * 0.8
    return np.tanh(x * 0.9).astype(np.float32) * 0.8


def clock_click(seed=51):
    rng = np.random.default_rng(seed)
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.008) * 0.5
    x[: int(0.002 * SR)] += rng.standard_normal(int(0.002 * SR)) * 0.6
    return x.astype(np.float32)


def thump(dur=0.3):
    t = _t(dur)
    f = 40 + 60 * np.exp(-t / 0.05)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)).astype(np.float32)


def whoosh(dur=0.35, seed=52, up=True):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = rng.standard_normal(n).astype(np.float32)
    out = np.zeros(n, np.float32)
    # sweep a bandpass by processing in small blocks
    blk = 512
    for i in range(0, n, blk):
        u = i / n
        fc = 300 + 3500 * (u if up else 1 - u)
        out[i:i + blk] = bp(x[i:i + blk + 256], fc * 0.6, fc * 1.6)[:len(out[i:i + blk])]
    e = np.sin(np.pi * np.arange(n) / n) ** 2
    return (out * e * 0.6).astype(np.float32)


def record_scratch(seed=53):
    rng = np.random.default_rng(seed)
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    # pitch slides down fast (record slowing) with a wobble
    f = 900 * np.exp(-t / 0.18) + 60 + 220 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.1)
    tone = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3
    nz = bp(rng.standard_normal(n).astype(np.float32), 600, 4000)
    x = (tone + 0.8 * nz) * np.exp(-t / 0.22)
    return np.tanh(x * 1.2).astype(np.float32) * 0.7


def sting(chord=(60, 64, 67, 72), dur=1.6):
    t = _t(dur)
    x = np.zeros(len(t), np.float32)
    for m in chord:
        f = note_hz(m)
        x += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.7)
    return (x / len(chord) * 0.6).astype(np.float32)


def coo(seed=54):
    """Pigeon 'coo-roo' (two soft warbles)."""
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 330 + 60 * np.sin(2 * np.pi * 18 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = np.exp(-((t - 0.15) / 0.08) ** 2) + 0.8 * np.exp(-((t - 0.4) / 0.1) ** 2)
    return lp((x * e).astype(np.float32), 1200) * 0.6
