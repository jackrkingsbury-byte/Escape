"""Ultra-realistic procedural audio for cinematic episodes (lost-on-an-island, storms, caves, night jungle...).

Everything is synthesized from scratch with seeded numpy (fully deterministic), stereo float32 at SR = 48 kHz
(the project rate, same as synth.py / build_episode.py).  No samples, no network.

  AMBIENCE BEDS   amb(name, dur, seed)            → (n, 2)   long, evolving, layered; render_loop() makes seamless loops
  SCORE           score(mode, dur, seed)          → (n, 2)   cinematic cues: drone / swell / heartbeat / sad piano
  SFX             sfx(name, params, seed, ...)    → (n, 2)   foley + cinematic hits, optional acoustic space
  SPACES          space(x, name, wet)                        synthetic-IR convolution reverb (cave, forest, hall, ...)
  MIX HELPERS     sidechain(), amb_track(), score_track(), master()   used by build_episode.py

How the realism is built (short version of the research notes):
  * Rain = three scales of events, not just noise: a pink/brown 'wash' (the sum of millions of distant drops), thousands
    of tiny droplet ticks per second (Poisson impulse trains convolved with a bank of short resonant kernels), and
    fewer, louder taps on broad leaves (damped modes 0.6-3.5 kHz with a slight downward glide), plus heavy canopy drips.
  * Drops falling into water ring because they trap a small air bubble: a Minnaert resonance f0 ~ 3.26 m/s / radius,
    i.e. 1-14 kHz for raindrops, whose pitch RISES as the bubble nears the surface.  That rising 'plink' is what makes
    puddles, rain on the sea and cave drips read as water instead of clicks.
  * Surf = a cycle (8-12 s): low build as the swell rises, a broadband crash with a fast-closing low-pass, a long white
    hiss with dense micro-bubble fizz, then the backwash: a bell-shaped burst of pebble clicks and a falling 'suck'.
  * Wind is a turbulence spectrum whose level AND spectral centroid follow a gust envelope; branches add narrow
    aeolian whistles that only appear in strong gusts; leaves add fast flutter.  L/R are offset in time (wind travels).
  * Reverb uses synthetic impulse responses: discrete early reflections (cave walls are close and hard → strong,
    sparse flutter echoes), then a diffuse tail with frequency-dependent RT60 (caves keep the lows, forests eat them).
  * Cinematic score: detuned supersaw strings (poly-BLEP, no aliasing) under a slowly moving resonant low-pass, a sub
    octave, a semitone 'tension' note that comes and goes; heartbeat = pitch-dropping sine thumps with saturation so
    phone speakers (which cannot play 45 Hz) still hear the beat through its harmonics; piano = inharmonic partials
    (f_k = k f0 sqrt(1 + B k^2)), hammer-position comb, two-stage decay, detuned string pairs (beating).

CLI:  python3 audio/real.py preview      → out/audio_real/*.wav + spectrogram PNGs of every bed, cue and sfx
"""
import os
import sys
import zlib
import numpy as np
from scipy import signal
from scipy.interpolate import CubicSpline
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TAU = 2 * np.pi


# =============================================================================================== basics
def seed_of(*parts):
    """Stable seed from any parts (Python's hash() is salted per process, crc32 is not)."""
    return zlib.crc32('|'.join(str(p) for p in parts).encode()) & 0x7fffffff


def R(seed):
    return np.random.default_rng(seed)


def ns(dur):
    return max(1, int(round(dur * SR)))


def tvec(n):
    return np.arange(n) / SR


def note_hz(m):
    return 440.0 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)


def db(x):
    return 10 ** (x / 20)


def rms(x):
    return float(np.sqrt(np.mean(np.square(x))) + 1e-12)


def layer(x, gain_db):
    """Normalize a layer to unit RMS, then set its level in dB (so mixes are written as explicit dB balances)."""
    return x * (db(gain_db) / rms(x))


def layer_ev(x, gain_db, floor_db=-30.0):
    """Like layer() but for SPARSE events: normalizes by the RMS of the active parts only (short-term energy within
    floor_db of the loudest moment), so gain_db means 'how loud each event is when it happens'."""
    m = np.asarray(x, float)
    e = uniform_filter1d(np.sum(m * m, 1) if m.ndim == 2 else m * m, ns(0.02))
    act = e > e.max() * db(floor_db) ** 2
    if not act.any():
        return x
    return x * (db(gain_db) / rms(m[act]))


def peak_norm(x, p=0.9):
    return (x * (p / (np.abs(x).max() + 1e-12))).astype(np.float32)


def stereo(x, pan=0.5):
    """Mono → stereo, constant-power pan (0 = left, 1 = right)."""
    if x.ndim == 2:
        return x
    return np.stack([x * np.cos(pan * np.pi / 2), x * np.sin(pan * np.pi / 2)], 1) * np.sqrt(2)


def add_at(buf, x, i0):
    """buf[i0:i0+len(x)] += x, clipped to the buffer at both ends (1-D or 2-D)."""
    i0 = int(i0)
    a, b = max(0, i0), min(len(buf), i0 + len(x))
    if b > a:
        buf[a:b] += x[a - i0: b - i0]


def fades(x, fin=0.0, fout=0.0, curve='cos'):
    n = len(x)
    e = np.ones(n)
    if fin > 0:
        k = min(n, ns(fin))
        r = np.linspace(0, 1, k)
        e[:k] = np.sin(r * np.pi / 2) ** 2 if curve == 'cos' else r
    if fout > 0:
        k = min(n, ns(fout))
        r = np.linspace(1, 0, k)
        e[n - k:] *= np.sin(r * np.pi / 2) ** 2 if curve == 'cos' else r
    return x * (e[:, None] if x.ndim == 2 else e)


def fit(x, n):
    """Pad with zeros / cut to exactly n samples."""
    if len(x) >= n:
        return x[:n]
    pad = [(0, n - len(x))] + [(0, 0)] * (x.ndim - 1)
    return np.pad(x, pad)


# =============================================================================================== noise
_SLOPES = {'white': 0.0, 'pink': -3.0103, 'brown': -6.0206, 'blue': 3.0103}


def noise(n, rng, color='white'):
    """Unit-variance coloured noise (FFT spectral shaping; brown is floored at 15 Hz so it has no DC drift)."""
    x = rng.standard_normal(n)
    if color == 'white' or n < 8:
        return x
    X = np.fft.rfft(x)
    f = np.maximum(np.fft.rfftfreq(n, 1 / SR), 15.0)
    X *= (f / 1000.0) ** (_SLOPES[color] / 6.0206)
    y = np.fft.irfft(X, n)
    return y / (y.std() + 1e-12)


def noise2(n, rng, color='pink', corr=0.3):
    """Stereo noise with partial L/R correlation (0 = fully wide, 1 = mono)."""
    c, l, r = noise(n, rng, color), noise(n, rng, color), noise(n, rng, color)
    a, b = np.sqrt(corr), np.sqrt(1 - corr)
    return np.stack([a * c + b * l, a * c + b * r], 1)


# ============================================================================================= filters
def _sos(kind, f, order):
    nyq = SR / 2
    if kind == 'band':
        wn = [max(f[0], 1) / nyq, min(f[1] / nyq, 0.999)]
    else:
        wn = min(f / nyq, 0.999)
    return signal.butter(order, wn, btype=kind, output='sos')


def lp(x, f, order=2):
    return signal.sosfilt(_sos('low', f, order), x, axis=0)


def hp(x, f, order=2):
    return signal.sosfilt(_sos('high', f, order), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos('band', (lo, hi), order), x, axis=0)


def _coefs(kind, fc, Q, gain_db=0.0):
    """RBJ cookbook biquads; fc may be an array (one coefficient set per entry). → b (k,3), a (k,3) normalized."""
    fc = np.clip(np.atleast_1d(np.asarray(fc, dtype=float)), 5.0, SR * 0.49)
    w0 = TAU * fc / SR
    cw, sw = np.cos(w0), np.sin(w0)
    al = sw / (2 * Q)
    one = np.ones_like(fc)
    if kind == 'lp':
        b = np.stack([(1 - cw) / 2, 1 - cw, (1 - cw) / 2], 1); a = np.stack([1 + al, -2 * cw, 1 - al], 1)
    elif kind == 'hp':
        b = np.stack([(1 + cw) / 2, -(1 + cw), (1 + cw) / 2], 1); a = np.stack([1 + al, -2 * cw, 1 - al], 1)
    elif kind == 'bp':   # constant 0 dB peak gain
        b = np.stack([al, 0 * al, -al], 1); a = np.stack([1 + al, -2 * cw, 1 - al], 1)
    elif kind == 'peak':
        A = 10 ** (gain_db / 40)
        b = np.stack([1 + al * A, -2 * cw, 1 - al * A], 1); a = np.stack([1 + al / A, -2 * cw, 1 - al / A], 1)
    elif kind in ('lowshelf', 'highshelf'):
        A = 10 ** (gain_db / 40)
        s = 1 if kind == 'lowshelf' else -1
        sq = 2 * np.sqrt(A) * al
        b = np.stack([A * ((A + 1) - s * (A - 1) * cw + sq), s * 2 * A * ((A - 1) - s * (A + 1) * cw),
                      A * ((A + 1) - s * (A - 1) * cw - sq)], 1)
        a = np.stack([(A + 1) + s * (A - 1) * cw + sq, -s * 2 * ((A - 1) + s * (A + 1) * cw),
                      (A + 1) + s * (A - 1) * cw - sq], 1)
    else:
        raise ValueError(kind)
    del one
    return b / a[:, :1], a / a[:, :1]


def bq(x, kind, fc, Q=0.707, gain_db=0.0):
    """Static biquad (works on mono or stereo along axis 0)."""
    b, a = _coefs(kind, fc, Q, gain_db)
    return signal.lfilter(b[0], a[0], x, axis=0)


def tvf(x, kind, fc, Q=0.707, block=256):
    """Time-varying biquad: fc is a per-sample curve (or scalar); coefficients update every `block` samples with the
    filter state carried across blocks, so sweeps are smooth (this is how wind, surf and risers move)."""
    if x.ndim == 2:
        fc2 = fc if np.ndim(fc) == 2 else np.stack([np.broadcast_to(fc, (len(x),))] * 2, 1)
        return np.stack([tvf(x[:, c], kind, fc2[:, c], Q, block) for c in range(x.shape[1])], 1)
    n = len(x)
    fcv = np.broadcast_to(np.asarray(fc, dtype=float), (n,))
    centers = np.minimum(np.arange(0, n, block) + block // 2, n - 1)
    B, A = _coefs(kind, fcv[centers], Q)
    out = np.empty(n)
    zi = np.zeros(2)
    for k, i in enumerate(range(0, n, block)):
        out[i:i + block], zi = signal.lfilter(B[k], A[k], x[i:i + block], zi=zi)
    return out


# ============================================================================================ control
def ctrl(n, rate, rng, lo=0.0, hi=1.0):
    """Smooth random control curve (cubic spline through random knots, `rate` knots per second)."""
    dur = n / SR
    k = int(dur * rate) + 5
    tk = (np.arange(k) - 2) / rate
    cs = CubicSpline(tk, rng.uniform(lo, hi, k))
    tc = np.arange(0, dur + 0.02, 0.005)
    return np.clip(np.interp(tvec(n), tc, cs(tc)), min(lo, hi) - 0.1 * abs(hi - lo), max(lo, hi) + 0.1 * abs(hi - lo))


def gusts(n, rng, base=(0.25, 0.55), every=(5.0, 12.0), amp=(0.3, 0.75), att=(0.8, 2.5), dec=(2.0, 5.0)):
    """Gust envelope: a slow wandering base plus discrete gusts (raised-cosine rise, exponential fall)."""
    dur = n / SR
    g = ctrl(n, 0.12, rng, *base)
    t = -rng.uniform(0, every[1])
    while t < dur:
        a, at, de = rng.uniform(*amp), rng.uniform(*att), rng.uniform(*dec)
        tt = tvec(ns(at + 5 * de))
        e = np.where(tt < at, 0.5 - 0.5 * np.cos(np.pi * tt / at), np.exp(-(tt - at) / de)) * a
        add_at(g, e, t * SR)
        t += rng.uniform(*every)
    return np.clip(g, 0, 1.4)


def poisson(dur, rate, rng, env=None):
    """Event times of a Poisson process; `env` (per-sample, any scale) modulates the rate by thinning."""
    if env is None:
        return np.sort(rng.uniform(0, dur, rng.poisson(max(rate * dur, 0))))
    mx = float(np.max(env)) + 1e-12
    ts = np.sort(rng.uniform(0, dur, rng.poisson(max(rate * dur, 0))))
    idx = np.minimum((ts * SR).astype(int), len(env) - 1)
    return ts[rng.random(len(ts)) < env[idx] / mx]


def render_events(n, times, amps, pans, kernels, rng=None, groups=None):
    """Stereo signal of many short events: impulse trains (one per kernel) convolved with the kernel bank.
    Thousands of events per second cost a few FFT convolutions instead of a Python loop."""
    out = np.zeros((n, 2))
    if len(times) == 0:
        return out
    if groups is None:
        groups = (rng or R(0)).integers(0, len(kernels), len(times))
    idx = np.clip((np.asarray(times) * SR).astype(int), 0, n - 1)
    gl, gr = amps * np.cos(pans * np.pi / 2), amps * np.sin(pans * np.pi / 2)
    for g, k in enumerate(kernels):
        sel = groups == g
        if not sel.any():
            continue
        imp = np.zeros((n, 2))
        np.add.at(imp[:, 0], idx[sel], gl[sel])
        np.add.at(imp[:, 1], idx[sel], gr[sel])
        out += signal.oaconvolve(imp, k[:, None], axes=0)[:n]
    return out * np.sqrt(2)


def saw(f, n, phase=0.0):
    """Band-limited sawtooth (poly-BLEP). f = scalar or per-sample array (Hz)."""
    f = np.broadcast_to(np.asarray(f, dtype=float), (n,))
    dt = f / SR
    p = (phase + np.cumsum(dt)) % 1.0
    y = 2 * p - 1
    m = p < dt
    x = p[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = p > 1 - dt
    x = (p[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def sine(f, n, phase=0.0):
    f = np.broadcast_to(np.asarray(f, dtype=float), (n,))
    return np.sin(TAU * (phase + np.cumsum(f) / SR))


def sat(x, drive=2.0):
    """Soft saturation (adds the harmonics phones need to 'hear' sub-bass)."""
    return np.tanh(x * drive) / np.tanh(drive)


# ============================================================================================ kernels
def _dsine(f, decay, n, glide=0.0, rise=0.0):
    """Damped sinusoid; glide = exponential pitch offset (neg = falls), rise = linear Minnaert-style rise per decay."""
    t = tvec(n)
    fi = f * (1 + glide * (1 - np.exp(-t / decay)) + rise * np.minimum(t / decay, 5))
    return np.sin(TAU * np.cumsum(fi) / SR) * np.exp(-t / decay)


def _loguni(rng, lo, hi):
    return float(np.exp(rng.uniform(np.log(lo), np.log(hi))))


def _unit(x):
    return x / (np.abs(x).max() + 1e-12)


def k_droplet(rng, flo=2500, fhi=9000):
    """Tiny raindrop tick: a sub-millisecond noise burst through a resonant band-pass."""
    n = ns(rng.uniform(0.0015, 0.005))
    x = rng.standard_normal(n) * np.exp(-tvec(n) / rng.uniform(0.0002, 0.0009))
    return _unit(bq(x, 'bp', _loguni(rng, flo, fhi), rng.uniform(0.8, 3.0)))


def k_leaf(rng, flo=600, fhi=3200, dlo=0.003, dhi=0.012):
    """Drop on a broad leaf: two damped membrane modes with a small downward glide + a contact click."""
    f, d = _loguni(rng, flo, fhi), rng.uniform(dlo, dhi)
    n = ns(d * 7)
    x = _dsine(f, d, n, glide=-rng.uniform(0.02, 0.1)) + 0.45 * _dsine(f * rng.uniform(2.1, 2.9), d * 0.55, n)
    c = min(n, ns(0.0004))
    x[:c] += hp(rng.standard_normal(c), 2000) * 0.5
    return _unit(x)


def k_bubble(rng, flo, fhi, dlo=0.004, dhi=0.02, rlo=0.1, rhi=0.5, click=0.25):
    """Minnaert bubble 'plink': a damped sine whose pitch rises as the bubble nears the surface."""
    f0, d = _loguni(rng, flo, fhi), rng.uniform(dlo, dhi)
    n = ns(d * 6)
    x = _dsine(f0, d, n, rise=rng.uniform(rlo, rhi) * 0.25)
    a = min(n, ns(0.0003))
    x[:a] *= np.linspace(0, 1, a)
    if click:
        c = min(n, ns(0.0005))
        x[:c] += hp(rng.standard_normal(c), 3000) * click
    return _unit(x)


def k_click(rng, flo=1800, fhi=7000):
    """Hard click (stone on stone / debris): short burst exciting two stiff modes."""
    n = ns(rng.uniform(0.004, 0.01))
    t = tvec(n)
    x = rng.standard_normal(n) * np.exp(-t / rng.uniform(0.0001, 0.0005))
    f = _loguni(rng, flo, fhi)
    x = x + 0.6 * _dsine(f, rng.uniform(0.0006, 0.0025), n) + 0.3 * _dsine(f * rng.uniform(1.6, 2.7), 0.0008, n)
    return _unit(x)


def k_pop(rng):
    """Fire crackle: a micro-explosion of steam in wood (resonant burst, sometimes with a woody thump)."""
    n = ns(rng.uniform(0.003, 0.012))
    t = tvec(n)
    x = rng.standard_normal(n) * np.exp(-t / rng.uniform(0.0002, 0.0016))
    x = bq(x, 'bp', _loguni(rng, 900, 7000), rng.uniform(1.0, 5.0))
    if rng.random() < 0.3:
        x = x + 0.5 * _dsine(rng.uniform(250, 700), 0.003, n)
    return _unit(x)


# ============================================================================================= spaces
SPACES = {
    #          RT60 s, RT multipliers per band (<250, 250-1k, 1-4k, >4k), predelay, early reflections, ER window s,
    #          ER level, band limits, mix time
    'cave':   dict(rt=3.6, rtm=(1.25, 1.0, 0.72, 0.38), pre=0.021, er=18, erw=(0.006, 0.26), erg=1.0, lo=60, hi=7000),
    'forest': dict(rt=0.9, rtm=(0.55, 0.85, 1.0, 0.75), pre=0.007, er=26, erw=(0.003, 0.09), erg=0.55, lo=110, hi=11000),
    'beach':  dict(rt=0.4, rtm=(0.5, 0.8, 0.9, 0.7), pre=0.012, er=3, erw=(0.01, 0.05), erg=0.25, lo=140, hi=9000),
    'hall':   dict(rt=2.7, rtm=(1.2, 1.0, 0.85, 0.55), pre=0.028, er=14, erw=(0.008, 0.12), erg=0.45, lo=50, hi=9500),
    'room':   dict(rt=0.5, rtm=(0.8, 1.0, 0.9, 0.7), pre=0.004, er=10, erw=(0.002, 0.03), erg=0.6, lo=80, hi=10000),
    'ship':   dict(rt=0.75, rtm=(1.0, 1.15, 0.8, 0.5), pre=0.003, er=12, erw=(0.002, 0.025), erg=0.8, lo=70, hi=6500),
}
_IR = {}


def make_ir(name, seed=0):
    """Synthetic stereo impulse response: sparse early reflections + diffuse tail with per-band RT60."""
    key = (name, seed)
    if key in _IR:
        return _IR[key]
    p = SPACES[name]
    n = ns(p['pre'] + p['erw'][1] + p['rt'] * max(p['rtm']) * 1.05)
    t = tvec(n)
    rng = R(seed_of('ir', name, seed))
    bands = ((25, 250), (250, 1000), (1000, 4000), (4000, 16000))
    mix_t = 0.03 + 0.04 * p['rt']
    ir = np.zeros((n, 2))
    for ch in (0, 1):
        nz = rng.standard_normal(n)
        tail = np.zeros(n)
        for (lo_, hi_), m in zip(bands, p['rtm']):
            tail += bp(nz, lo_, hi_) * np.exp(-6.9078 * t / (p['rt'] * m))
        tail *= np.clip((t - p['pre']) / mix_t, 0, 1) ** 1.5
        tail /= np.sqrt(np.sum(tail ** 2)) + 1e-12
        er = np.zeros(n)
        tk = p['pre'] + np.sort(rng.uniform(*p['erw'], p['er']) ** 1.3 / p['erw'][1] ** 0.3)
        for k, tt in enumerate(tk):
            i = int(tt * SR)
            if i < n:
                er[i] += rng.choice((-1, 1)) * rng.uniform(0.4, 1.0) * (1 - k / (len(tk) + 2))
        er = lp(er, p['hi'] * 0.7)
        er *= p['erg'] / (np.sqrt(np.sum(er ** 2)) + 1e-12)
        ir[:, ch] = hp(lp(tail + er, p['hi']), p['lo'])
    ir /= np.sqrt(np.sum(ir ** 2, 0, keepdims=True)) + 1e-12
    _IR[key] = ir
    return ir


def space(x, name, wet=0.3, dry=1.0, tail=True, seed=0):
    """Put a sound into an acoustic space (convolution with a synthetic IR). Mono or stereo in → stereo out."""
    if not name or wet <= 0:
        return stereo(x) * dry
    ir = make_ir(name, seed)
    xs = stereo(x) if x.ndim == 1 else x
    y = np.stack([signal.oaconvolve(xs[:, 0], ir[:, 0]), signal.oaconvolve(xs[:, 1], ir[:, 1])], 1)
    out = y * wet
    out[:len(xs)] += xs * dry
    return out if tail else out[:len(xs)]


def voice_in_space(a, name, wet=None):
    """Mono narration placed subtly in a space (keeps intelligibility; returns mono with the reverb tail)."""
    w = {'cave': 0.16, 'forest': 0.06, 'hall': 0.12, 'ship': 0.08, 'room': 0.06, 'beach': 0.04}.get(name, 0.08) if wet is None else wet
    y = space(a, name, wet=w, dry=1.0)
    return y.mean(1).astype(np.float32)


# ======================================================================================== AMBIENCE BEDS
def bed_rain_forest(dur, seed, intensity=1.0):
    """Heavy tropical rain on leaves: wash + droplets + leaf taps + canopy drips + runoff, in a forest space."""
    n, rng = ns(dur), R(seed)
    inten = np.clip(intensity * ctrl(n, 0.07, rng, 0.75, 1.1) + 0.25 * intensity * gusts(n, rng, (0, 0.05), (9, 20), (0.2, 0.6)), 0.05, 2)
    ie = inten[:, None]
    wash = bq(bp(noise2(n, rng, 'pink', 0.25), 280, 11000), 'peak', 4200, 0.8, 3.0) * ie
    body = bp(noise2(n, rng, 'brown', 0.6), 40, 450) * ie
    ts = poisson(dur, 2200 * intensity, rng, inten)
    drops = render_events(n, ts, 0.25 + np.minimum(rng.pareto(2.5, len(ts)), 3), rng.uniform(0, 1, len(ts)),
                          [k_droplet(rng) for _ in range(8)], rng)
    ts = poisson(dur, 150 * intensity, rng, inten)
    near = rng.random(len(ts)) < 0.35
    a = np.exp(rng.normal(0, 0.5, len(ts))) * np.where(near, 1.0, 0.45)
    pans = rng.uniform(0, 1, len(ts))
    taps_n = render_events(n, ts[near], a[near], pans[near], [k_leaf(rng) for _ in range(10)], rng)
    taps_f = lp(render_events(n, ts[~near], a[~near], pans[~near], [k_leaf(rng) for _ in range(8)], rng), 3500)
    ts = poisson(dur, 2.8 * intensity, rng)
    kd = [k_leaf(rng, 220, 700, 0.015, 0.04) for _ in range(5)] + [k_bubble(rng, 700, 2600, 0.008, 0.02, 0.2, 0.5) for _ in range(5)]
    drips = render_events(n, ts, np.exp(rng.normal(0, 0.4, len(ts))), rng.uniform(0.1, 0.9, len(ts)), kd, rng)
    ts = poisson(dur, 40, rng)
    runoff = lp(render_events(n, ts, rng.uniform(0.3, 1, len(ts)), rng.uniform(0.3, 0.7, len(ts)),
                              [k_bubble(rng, 500, 1800, 0.006, 0.015, 0.2, 0.6, 0) for _ in range(6)], rng), 2500)
    x = (layer(wash, 0) + layer(body, -9) + layer(drops, -6) + layer(taps_n, -5) + layer(taps_f, -11)
         + layer(drips, -9) + layer(runoff, -20))
    return space(x, 'forest', wet=0.22, tail=False, seed=seed)


def bed_rain_beach(dur, seed, intensity=1.0):
    """Rain on sand and on the sea surface (micro-bubble 'sizzle'), soft distant surf behind it."""
    n, rng = ns(dur), R(seed)
    inten = np.clip(intensity * ctrl(n, 0.08, rng, 0.8, 1.1), 0.05, 2)
    ie = inten[:, None]
    wash = bp(noise2(n, rng, 'pink', 0.2), 400, 12500) * ie
    ts = poisson(dur, 1600 * intensity, rng, inten)
    water = render_events(n, ts, np.exp(rng.normal(0, 0.5, len(ts))), rng.uniform(0, 1, len(ts)),
                          [k_bubble(rng, 3000, 14000, 0.0015, 0.006, 0.2, 0.8, 0.15) for _ in range(12)], rng)
    ts = poisson(dur, 700 * intensity, rng, inten)
    ks = [_unit(lp(rng.standard_normal(ns(0.004)) * np.exp(-tvec(ns(0.004)) / 0.0008), rng.uniform(900, 1800))) for _ in range(6)]
    sand = render_events(n, ts, rng.uniform(0.3, 1, len(ts)), rng.uniform(0, 1, len(ts)), ks, rng)
    surf = lp(bed_surf(dur, seed + 7), 1300)
    x = layer(wash, 0) + layer(water, -5) + layer(sand, -9) + layer(surf, -4)
    return space(x, 'beach', wet=0.15, tail=False, seed=seed)


def bed_storm_wind(dur, seed, leaves=True, whistle=1.0):
    """Storm gusts through trees: turbulent roar following a gust envelope, aeolian whistles in strong gusts,
    thrashing leaves, debris ticks and the odd distant trunk creak."""
    n, rng = ns(dur), R(seed)
    g = gusts(n, rng)
    sh = ns(rng.uniform(0.2, 0.6))
    G = np.stack([g, np.concatenate([g[sh:], np.full(sh, g[-1])])], 1)   # the gust reaches the right ear later
    roar = tvf(noise2(n, rng, 'brown', 0.5), 'lp', 140 + 1100 * G ** 1.3, 0.8) * (0.25 + G) ** 1.6
    howl = tvf(noise2(n, rng, 'pink', 0.4), 'bp', 280 + 520 * G, 3.0) * G ** 2
    wh = np.zeros((n, 2))
    for k, ratio in enumerate((1.0, 1.47)):
        fw = (850 + 650 * G) * ratio * (1 + 0.04 * np.stack([ctrl(n, 2.5, rng, -1, 1)] * 2, 1))
        wh += tvf(noise2(n, rng, 'white', 0.7), 'bp', fw, 28.0) * np.clip(G - 0.45, 0, 1) ** 1.5 * (1 - 0.4 * k)
    x = layer(roar, 0) + layer(howl, -7) + layer(wh, -16 + 20 * np.log10(max(whistle, 1e-3)))
    if leaves:
        flut = np.stack([ctrl(n, 14, rng, 0.35, 1.0), ctrl(n, 14, rng, 0.35, 1.0)], 1)
        rust = bp(noise2(n, rng, 'pink', 0.2), 1800, 10000) * G ** 2.2 * flut
        ts = poisson(dur, 90, rng, g ** 2)
        flaps = render_events(n, ts, rng.uniform(0.3, 1, len(ts)), rng.uniform(0, 1, len(ts)),
                              [k_leaf(rng, 1500, 5000, 0.002, 0.006) for _ in range(6)], rng)
        x += layer(rust, -6) + layer(flaps, -14)
    ts = poisson(dur, 6, rng, g ** 3)
    x += layer(render_events(n, ts, rng.uniform(0.2, 1, len(ts)), rng.uniform(0, 1, len(ts)),
                             [k_click(rng, 1200, 5000) for _ in range(5)], rng), -22)
    cr = np.zeros((n, 2))
    t = rng.uniform(3, 10)
    while t < dur - 2:
        if g[int(t * SR)] > 0.6:
            c = sfx_wood_creak({'dur': rng.uniform(1.0, 2.0)}, seed_of(seed, 'creak', t))
            add_at(cr, lp(c, 2200) * rng.uniform(0.5, 1.0), t * SR)
            t += rng.uniform(10, 18)
        else:
            t += 0.5
    if np.any(cr):
        x += layer_ev(cr, -17)
    return space(x, 'forest', wet=0.15, tail=False, seed=seed)


def _wave(rng, size=1.0):
    """One surf cycle: build → crash → hiss/fizz → backwash with pebble rattle. → (stereo, crash time)."""
    tc = rng.uniform(2.2, 3.4)
    n = ns(tc + 8.5)
    t = tvec(n)
    pc = rng.uniform(0.3, 0.7)
    u = np.clip(t / tc, 0, 1)
    after = np.maximum(t - tc, 0)
    on = (t >= tc).astype(float)
    env_b = np.where(t < tc, u ** 2.2, np.exp(-after / 0.25))
    build = tvf(noise2(n, rng, 'brown', 0.7), 'lp', 120 + 650 * u ** 2, 0.9) * env_b[:, None]
    att = rng.uniform(0.12, 0.3)
    env_c = on * np.minimum(after / att, 1) ** 1.5 * np.exp(-np.maximum(after - att, 0) / (0.9 * size))
    crash = tvf(noise2(n, rng, 'pink', 0.15), 'lp', 1400 + 8500 * np.exp(-after / 1.1), 0.7) * env_c[:, None]
    thump = lp(noise2(n, rng, 'brown', 0.8), 150) * (on * np.minimum(after / 0.05, 1) * np.exp(-after / 0.5))[:, None]
    w0 = np.maximum(after - 0.2, 0)
    env_w = (t >= tc + 0.2) * np.minimum(w0 / 0.5, 1) * np.exp(-w0 / 1.9)
    hiss = bp(noise2(n, rng, 'white', 0.2), 1200, 11000) * env_w[:, None]
    ts = poisson(n / SR, 2200, rng, env_w)
    fizz = render_events(n, ts, rng.uniform(0.2, 1, len(ts)), np.clip(rng.normal(pc, 0.3, len(ts)), 0, 1),
                         [k_bubble(rng, 2500, 12000, 0.001, 0.004, 0.2, 0.6, 0.1) for _ in range(8)], rng)
    env_r = np.exp(-0.5 * ((t - tc - rng.uniform(4.0, 5.2)) / rng.uniform(1.2, 1.8)) ** 2)
    ts = poisson(n / SR, 1100, rng, env_r)
    pebbles = render_events(n, ts, np.exp(rng.normal(0, 0.6, len(ts))), np.clip(rng.normal(pc, 0.25, len(ts)), 0, 1),
                            [k_click(rng, 1800, 7500) for _ in range(10)], rng)
    suck = tvf(noise2(n, rng, 'pink', 0.5), 'lp', 900 - 600 * np.clip((t - tc - 3) / 4, 0, 1), 0.8) * env_r[:, None]
    x = (layer(build, -8) + layer(crash, 0) + layer(thump, -6) + layer(hiss, -6) + layer(fizz, -15)
         + layer(pebbles, -13) + layer(suck, -14)) * size
    x[:, 0] *= np.sqrt(2) * np.cos(pc * np.pi / 2) * 0.5 + 0.5
    x[:, 1] *= np.sqrt(2) * np.sin(pc * np.pi / 2) * 0.5 + 0.5
    return x, tc


def bed_surf(dur, seed):
    """Ocean surf on a pebbly beach: wave cycles every 8-12 s (every few waves a bigger set), distant roar."""
    n, rng = ns(dur), R(seed)
    out = np.zeros((n, 2))
    bg = lp(noise2(n, rng, 'brown', 0.5), 500) * np.stack([ctrl(n, 0.15, rng, 0.6, 1.0)] * 2, 1)
    bg2 = bp(noise2(n, rng, 'pink', 0.3), 300, 2500) * np.stack([ctrl(n, 0.1, rng, 0.5, 1.0)] * 2, 1)
    t, k = -rng.uniform(4, 9), 0
    wl = []
    while t < dur:
        size = rng.uniform(0.85, 1.15) if k % 3 else rng.uniform(1.1, 1.35)
        w, _ = _wave(rng, size)
        add_at(out, w, t * SR)
        wl.append(rms(w))
        t += rng.uniform(8, 12)
        k += 1
    ref = np.mean(wl) if wl else 1.0
    return out / ref + layer(bg, -9) + layer(bg2, -16)


def bed_storm_sea(dur, seed):
    """Storm at sea from a small boat: screaming wind, rain hammering the deck, swells slamming the hull, creaks."""
    n, rng = ns(dur), R(seed)
    wind = bed_storm_wind(dur, seed + 1, leaves=False, whistle=1.6)
    ts = poisson(dur, 2600, rng)
    deck = render_events(n, ts, 0.3 + np.minimum(rng.pareto(2.5, len(ts)), 3), rng.uniform(0, 1, len(ts)),
                         [k_click(rng, 2000, 8000) for _ in range(8)], rng)
    rain = bp(noise2(n, rng, 'pink', 0.3), 500, 12000)
    roar = lp(noise2(n, rng, 'brown', 0.6), 300) * np.stack([0.6 + 0.4 * np.sin(TAU * 0.11 * tvec(n))] * 2, 1)
    hits = np.zeros((n, 2))
    t = rng.uniform(0.5, 2)
    while t < dur:
        m = ns(3.0)
        tt = tvec(m)
        boom = sat(np.sin(TAU * np.cumsum(42 + 30 * np.exp(-tt / 0.08)) / SR) * np.exp(-tt / 0.35), 1.8)
        slosh = tvf(noise2(m, rng, 'pink', 0.4), 'lp', 800 + 5500 * np.exp(-tt / 0.7), 0.7) * (np.minimum(tt / 0.08, 1) * np.exp(-tt / 1.1))[:, None]
        add_at(hits, layer(stereo(boom), 0) + layer(slosh, 1), t * SR)
        t += rng.uniform(4, 7)
    hits = layer_ev(hits, 0)
    cr = np.zeros((n, 2))
    t = rng.uniform(2, 5)
    while t < dur:
        add_at(cr, sfx_wood_creak({'dur': rng.uniform(1.2, 2.4), 'pitch': rng.uniform(0.7, 1.0)}, seed_of(seed, 'hull', t)), t * SR)
        t += rng.uniform(6, 12)
    x = layer(wind, 0) + layer(rain, -6) + layer(deck, -9) + layer(roar, -5) + hits * db(-1)
    if np.any(cr):
        x += layer_ev(space(cr, 'ship', 0.4, tail=False), -10)
    return x


def bed_cave(dur, seed):
    """Cave: low room tone with modal resonances, faint air movement, a few 'drip spots' with their own pitch and
    rhythm (Minnaert plinks, sometimes double), sporadic drips, a distant underground stream, rare deep settling."""
    n, rng = ns(dur), R(seed)
    tone = bp(noise2(n, rng, 'brown', 0.8), 25, 180) * np.stack([ctrl(n, 0.05, rng, 0.7, 1.0)] * 2, 1)
    for f in (41, 58, 87):
        tone += bp(noise2(n, rng, 'brown', 0.9), f * 0.96, f * 1.04) * 0.6
    air = bp(noise2(n, rng, 'pink', 0.3), 150, 700) * np.stack([ctrl(n, 0.08, rng, 0.2, 1.0)] * 2, 1)
    drips = np.zeros((n, 2))
    for s in range(4):
        f0, per, pan = _loguni(rng, 800, 2600), rng.uniform(1.4, 4.5), rng.uniform(0.15, 0.85)
        dist = rng.uniform(0.35, 1.0)
        t = rng.uniform(0, per)
        while t < dur:
            k = k_bubble(rng, f0 * 0.97, f0 * 1.03, 0.008, 0.022, 0.15, 0.45, 0.3) * rng.uniform(0.6, 1.0) / dist
            if dist > 0.7:
                k = lp(k, 3500)
            add_at(drips, stereo(k, pan), t * SR)
            if rng.random() < 0.15:
                add_at(drips, stereo(k * 0.4, pan), (t + rng.uniform(0.06, 0.15)) * SR)
            t += per * rng.uniform(0.75, 1.25)
    for t in poisson(dur, 0.3, rng):
        add_at(drips, stereo(lp(k_bubble(rng, 600, 3000, 0.006, 0.02, 0.1, 0.5, 0.2), 3000) * rng.uniform(0.2, 0.5), rng.uniform(0, 1)), t * SR)
    drips = space(drips, 'cave', wet=1.3, dry=0.5, tail=False, seed=seed)
    ts = poisson(dur, 25, rng)
    stream = bp(noise2(n, rng, 'pink', 0.5), 250, 1400) * np.stack([ctrl(n, 0.6, rng, 0.5, 1.0)] * 2, 1)
    stream = layer(stream, 0) + layer(render_events(n, ts, rng.uniform(0.3, 1, len(ts)), rng.uniform(0.3, 0.7, len(ts)),
                                                    [k_bubble(rng, 250, 900, 0.008, 0.02, 0.2, 0.5, 0) for _ in range(6)], rng), -3)
    stream = space(lp(stream, 1500), 'cave', wet=1.0, dry=0.0, tail=False, seed=seed + 1)
    rum = np.zeros((n, 2))
    t = rng.uniform(6, 20)
    while t < dur:
        m = ns(2.5)
        e = np.minimum(tvec(m) / 0.3, 1) * np.exp(-tvec(m) / 0.6)
        add_at(rum, lp(noise2(m, rng, 'brown', 0.8), 80) * e[:, None], t * SR)
        t += rng.uniform(18, 35)
    x = layer_ev(drips, 0) + layer(tone, -20) + layer(air, -28) + layer(stream, -19)
    if np.any(rum):
        x += layer_ev(space(rum, 'cave', 0.8, tail=False), -10)
    return x


def bed_jungle_night(dur, seed, rain=0.35):
    """Night jungle in light rain (subtle): katydid/cicada buzzes in phrases, crickets, coqui-like tree frogs,
    a couple of low croaking frogs far off, all in a forest space, over soft rain."""
    n, rng = ns(dur), R(seed)
    t = tvec(n)
    crit = np.zeros((n, 2))
    for k in range(4):   # pulsed insect buzz in on/off phrases
        fc, pr, sharp = rng.uniform(3800, 7200), rng.uniform(35, 110), rng.uniform(3, 6)
        car = sine(fc * (1 + 0.004 * np.sin(TAU * rng.uniform(0.2, 0.6) * t)), n, rng.random())
        pulse = (0.5 + 0.5 * np.sin(TAU * pr * t)) ** sharp
        gate = np.zeros(n)
        tt = rng.uniform(0, 3)
        while tt < dur:
            on = rng.uniform(1.0, 4.0)
            seg = np.sin(np.pi * np.clip((t[ns(tt):ns(tt + on)] - tt) / on, 0, 1)) ** 0.5 if ns(tt) < n else np.zeros(0)
            gate[ns(tt):ns(tt) + len(seg)] = seg
            tt += on + rng.uniform(1.0, 3.5)
        x = car * pulse * gate * rng.uniform(0.4, 1.0)
        if k >= 2:
            x = lp(x, 4000)
        crit += stereo(x, rng.uniform(0.1, 0.9))
    for k in range(2):   # crickets: 3-4 pulse chirps
        f = rng.uniform(4200, 5000)
        m = ns(0.16)
        tt = tvec(m)
        kern = np.zeros(m)
        for p in range(int(rng.integers(3, 5))):
            c = np.clip((tt - p * 0.032) / 0.018, 0, 1)
            kern += np.sin(np.pi * c) ** 2 * (c > 0) * (c < 1) * np.sin(TAU * f * tt)
        per = rng.uniform(0.6, 1.1)
        ts = np.arange(rng.uniform(0, per), dur, per)
        ts = ts + rng.normal(0, 0.02, len(ts))
        crit += render_events(n, np.clip(ts, 0, dur), rng.uniform(0.5, 1, len(ts)), np.full(len(ts), rng.uniform(0.1, 0.9)), [kern], rng)
    for k in range(3):   # coqui: 'ko' then a rising 'KEE'
        f1, f2 = rng.uniform(1050, 1250), rng.uniform(1750, 1900)
        m = ns(0.29)
        tt = tvec(m)
        e1 = np.sin(np.pi * np.clip(tt / 0.09, 0, 1)) ** 2 * (tt < 0.09)
        e2 = np.sin(np.pi * np.clip((tt - 0.11) / 0.15, 0, 1)) ** 2 * (tt > 0.11) * (tt < 0.26)
        fi = np.where(tt < 0.1, f1, f2 + 300 * np.clip((tt - 0.11) / 0.15, 0, 1))
        kern = np.sin(TAU * np.cumsum(fi) / SR) * (e1 + e2)
        kern += 0.15 * np.sin(2 * TAU * np.cumsum(fi) / SR) * (e1 + e2)
        ts = np.cumsum(rng.uniform(1.8, 4.5, int(dur / 1.8) + 2)) - rng.uniform(0, 2)
        ts = ts[(ts > 0) & (ts < dur)]
        crit += render_events(n, ts, rng.uniform(0.5, 1, len(ts)), np.full(len(ts), rng.uniform(0.1, 0.9)), [kern], rng)
    croak = np.zeros((n, 2))
    for k in range(2):   # far croakers: pulsed low tone with formant-ish harmonics
        f0 = rng.uniform(380, 520)
        m = ns(0.38)
        tt = tvec(m)
        car = sum(np.sin(TAU * f0 * h * tt) * a for h, a in ((1, 1), (2, 0.6), (3, 0.5), (4, 0.25), (5, 0.15)))
        kern = car * (0.5 + 0.5 * np.sin(TAU * 25 * tt)) ** 2 * np.sin(np.pi * tt / 0.38)
        ts = np.cumsum(rng.uniform(2.5, 7, int(dur / 2.5) + 2)) - rng.uniform(0, 3)
        ts = ts[(ts > 0) & (ts < dur)]
        croak += render_events(n, ts, rng.uniform(0.5, 1, len(ts)), np.full(len(ts), rng.uniform(0.1, 0.9)), [kern], rng)
    creatures = space(layer(crit, 0) + layer(lp(croak, 1500), -6), 'forest', wet=0.4, tail=False, seed=seed)
    x = layer(creatures, 0) + layer(bed_rain_forest(dur, seed + 3, rain), -3) + layer(lp(noise2(n, rng, 'brown', 0.6), 300), -16)
    return x


def bed_campfire(dur, seed):
    """Campfire: flame roar with flicker, hiss, clustered crackles, sharp snaps, sap sizzles and log settles."""
    n, rng = ns(dur), R(seed)
    flick = (ctrl(n, 3.0, rng, 0.55, 1.15) * ctrl(n, 0.2, rng, 0.8, 1.1))[:, None]
    roar = bp(noise2(n, rng, 'brown', 0.7), 40, 300) * flick
    hiss = bp(noise2(n, rng, 'pink', 0.4), 1500, 7000) * np.stack([ctrl(n, 0.5, rng, 0.6, 1.0)] * 2, 1)
    base = poisson(dur, 9, rng)
    ts = [base]
    for t0 in base[rng.random(len(base)) < 0.35]:
        ts.append(t0 + np.cumsum(rng.uniform(0.005, 0.06, int(rng.integers(1, 6)))))
    ts = np.sort(np.concatenate(ts))
    ts = ts[ts < dur]
    crack = render_events(n, ts, np.exp(rng.normal(0, 0.9, len(ts))), np.clip(rng.normal(0.5, 0.18, len(ts)), 0, 1),
                          [k_pop(rng) for _ in range(12)], rng)
    snaps = np.zeros((n, 2))
    for t0 in poisson(dur, 0.35, rng):
        m = ns(0.08)
        tt = tvec(m)
        s = rng.standard_normal(m) * np.exp(-tt / 0.0006) + 0.8 * _dsine(rng.uniform(120, 200), 0.015, m) + 0.4 * _dsine(rng.uniform(2000, 4000), 0.006, m)
        add_at(snaps, stereo(_unit(s) * rng.uniform(0.5, 1.0), rng.uniform(0.35, 0.65)), t0 * SR)
    siz = np.zeros((n, 2))
    for t0 in poisson(dur, 0.06, rng):
        m = ns(rng.uniform(0.6, 1.8))
        e = np.sin(np.pi * tvec(m) / (m / SR)) * ctrl(m, 18, rng, 0.2, 1.0)
        add_at(siz, stereo(bq(rng.standard_normal(m), 'bp', rng.uniform(3000, 6000), 6) * e, rng.uniform(0.4, 0.6)), t0 * SR)
    x = layer(roar, -6) + layer(hiss, -16) + layer(crack, -3) + layer_ev(snaps, -6)
    if np.any(siz):
        x += layer_ev(siz, -18)
    return space(x, 'forest', wet=0.1, tail=False, seed=seed)


BEDS = {
    'rain_forest':  (bed_rain_forest, 'heavy tropical rain on leaves: wash, thousands of droplets, leaf taps, canopy drips, runoff', 0.0),
    'rain_beach':   (bed_rain_beach, 'rain on sand and sea surface (micro-bubble sizzle) with soft distant surf', 0.0),
    'storm_wind':   (bed_storm_wind, 'storm gusts through trees: roar, aeolian whistles, thrashing leaves, distant trunk creaks', -1.0),
    'storm_sea':    (bed_storm_sea, 'storm at sea from a small boat: wind, rain on deck, swells slamming the hull, creaks', 1.0),
    'surf':         (bed_surf, 'ocean surf cycles 8-12 s: build, crash, hiss/fizz, backwash with pebble rattle', 0.0),
    'cave':         (bed_cave, 'cave: room tone, echoing drip spots, distant underground stream, rare deep settling', -2.0),
    'jungle_night': (bed_jungle_night, 'night jungle in light rain (subtle): insects, crickets, tree frogs, far croakers', -4.0),
    'campfire':     (bed_campfire, 'campfire: flame roar, hiss, crackles, snaps, sap sizzles', -2.0),
}


def amb(name, dur, seed=None, preroll=3.0):
    """Render an ambience bed (stereo, normalized to about -23 LUFS + the bed's trim). Beds are rendered with a
    pre-roll that is cut off, so reverbs and gust envelopes are already 'running' at sample 0."""
    if '+' in name:   # layered beds: "rain_forest+storm_wind"
        parts = [amb(p.strip(), dur, seed, preroll) for p in name.split('+')]
        return sum(parts) / np.sqrt(len(parts))
    fn, _, trim = BEDS[name]
    seed = seed_of('amb', name) if seed is None else seed
    x = fn(dur + preroll, seed)[ns(preroll):][:ns(dur)]
    x = fit(x, ns(dur))
    return (x * db(-23 + trim - loudness(x))).astype(np.float32)


def loopable(x, xf=2.0):
    """Make a seamless loop: the last `xf` seconds are equal-power crossfaded into the head (length shrinks by xf)."""
    k = ns(xf)
    body, tail = x[:-k].copy(), x[-k:]
    r = np.linspace(0, 1, k)[:, None] if x.ndim == 2 else np.linspace(0, 1, k)
    body[:k] = body[:k] * np.sin(r * np.pi / 2) + tail * np.cos(r * np.pi / 2)
    return body


def render_loop(name, dur, seed=None, xf=2.0):
    return loopable(amb(name, dur + xf, seed), xf)


# ============================================================================================== SCORE
def _pad(notes, n, rng, voices=5, detune=12.0, fc=None, Q=1.2):
    """Detuned poly-BLEP saw ensemble (strings/synth pad), stereo, optional moving low-pass."""
    out = np.zeros((n, 2))
    t = tvec(n)
    for m, a in notes:
        for ch in (0, 1):
            x = np.zeros(n)
            for v in range(voices):
                d = ((v - (voices - 1) / 2) / ((voices - 1) / 2 or 1)) * detune * rng.uniform(0.85, 1.15) + (3 if ch else -3)
                x += saw(note_hz(m) * 2 ** (d / 1200), n, rng.random())
            amp = a * (0.75 + 0.25 * np.sin(TAU * rng.uniform(0.03, 0.09) * t + rng.uniform(0, TAU)))
            out[:, ch] += x * amp / voices
    if fc is not None:
        out = tvf(out, 'lp', fc, Q)
    return out


def cue_drone(dur, seed, root=38, bright=0.5):
    """Tension drone: low minor string cluster under a slowly breathing resonant low-pass, sub octave, a semitone
    'tension' note that swells in and out, bowed-air noise on the harmonics, a glassy beating high pair and a rare
    metallic groan. Hall reverb."""
    n, rng = ns(dur), R(seed)
    t = tvec(n)
    w = np.clip(0.5 + 0.35 * np.sin(TAU * t / rng.uniform(18, 26) + rng.uniform(0, TAU)) + 0.15 * ctrl(n, 0.1, rng, -1, 1), 0, 1)
    fc = 260 * 2 ** ((1.6 + 1.4 * bright) * w)
    pad = _pad([(root, 1.0), (root + 7, 0.7), (root + 12, 0.55), (root + 15, 0.45)], n, rng, fc=fc, Q=1.4)
    ten = 0.5 * np.maximum(0, np.sin(TAU * t / rng.uniform(14, 20) - 1.2)) ** 3
    tens = _pad([(root + 13, 1.0)], n, rng, voices=3, detune=8) * ten[:, None]
    tens = lp(tens, 900)
    fsub = note_hz(root - 12)
    sub = sat(sine(fsub * (1 + 0.002 * np.sin(TAU * 0.07 * t)), n) * (0.75 + 0.25 * np.sin(TAU * 0.05 * t)), 1.5)
    air = np.zeros((n, 2))
    nz = noise2(n, rng, 'white', 0.3)
    for h in (2, 3, 4, 5, 6):
        air += bq(nz, 'bp', note_hz(root + 12) * h, 45.0) / h
    air *= np.stack([ctrl(n, 0.15, rng, 0.3, 1.0)] * 2, 1)
    gl = np.stack([sine(note_hz(root + 43), n), sine(note_hz(root + 43) + 0.7, n)], 1) * (0.6 + 0.4 * np.sin(TAU * 0.13 * t))[:, None]
    groan = np.zeros((n, 2))
    tg = rng.uniform(6, 14)
    while tg < dur - 3:
        m = ns(rng.uniform(2.5, 4.0))
        tt = tvec(m)
        f = note_hz(root + 24) * (1 - 0.06 * tt / tt[-1]) * (1 + 0.01 * np.sin(TAU * 5.3 * tt))
        g = bq(saw(f, m), 'bp', 700, 4.0) * np.sin(np.pi * tt / tt[-1]) ** 2
        add_at(groan, stereo(g, rng.uniform(0.2, 0.8)), tg * SR)
        tg += rng.uniform(16, 26)
    x = layer(pad, 0) + layer(tens, -9) + layer(stereo(sub), -5) + layer(air, -24) + layer(gl, -32)
    if np.any(groan):
        x += layer_ev(groan, -18)
    return fades(space(x, 'hall', wet=0.35, tail=False, seed=seed), 2.0)


def heartbeat(strength=1.0, gap=0.28, seed=0):
    """One 'lub-dub': pitch-dropping sine thumps + a soft valve click, saturated so it reads on small speakers."""
    rng = R(seed)
    n = ns(gap + 0.35)
    out = np.zeros(n)
    for t0, f0, f1, d, a in ((0.0, 78, 44, 0.09, 1.0), (gap, 92, 55, 0.07, 0.7)):
        m = ns(0.3)
        tt = tvec(m)
        x = np.sin(TAU * np.cumsum(f1 + (f0 - f1) * np.exp(-tt / 0.035)) / SR) * np.minimum(tt / 0.006, 1) * np.exp(-tt / d)
        x += lp(rng.standard_normal(m), 260) * np.exp(-tt / 0.012) * 0.25
        add_at(out, x * a * strength, t0 * SR)
    return (sat(lp(out, 400) * 1.2, 2.2) * 0.9).astype(np.float32)


def heartbeat_loop(dur, bpm0=72, bpm1=None, seed=0, strength=1.0):
    bpm1 = bpm1 or bpm0
    n = ns(dur)
    out = np.zeros(n)
    t, k = 0.05, 0
    while t < dur:
        bpm = bpm0 + (bpm1 - bpm0) * (t / dur) ** 1.5
        per = 60 / bpm
        hb = heartbeat(strength * (0.9 + 0.1 * ((k % 2) == 0)), gap=min(0.3, per * 0.36), seed=seed + k)
        add_at(out, hb, t * SR)
        t += per
        k += 1
    return out


def cue_heart(dur, seed, root=38):
    """Heartbeat pulse layer (accelerating 70 → 100 bpm over the cue) over a darker, quieter drone."""
    n = ns(dur)
    hb = heartbeat_loop(dur, 70, 100, seed)
    x = layer(stereo(hb), 0) + layer(cue_drone(dur, seed + 1, root, bright=0.25), -7)
    return fades(x, 0.4)


def cue_swell(dur, seed, root=38):
    """Rising swell: the drone, a tremolo string cluster that crescendos and opens up (tremolo accelerates),
    a noise riser, a Shepard-style rising tone and a growing sub. Builds right to the end of the cue."""
    n, rng = ns(dur), R(seed)
    t = tvec(n)
    u = np.clip(t / max(dur, 1e-3), 0, 1)
    cres = u ** 2.2
    cl = _pad([(root + 24 + k, 1.0) for k in (0, 1, 3, 6, 7)], n, rng, voices=4, detune=10, fc=400 * 2 ** (3.6 * u), Q=1.0)
    trem = 0.55 + 0.45 * np.sin(TAU * np.cumsum(5 + 9 * u) / SR)
    strings = cl * (cres * trem)[:, None]
    riser = tvf(noise2(n, rng, 'white', 0.4), 'bp', 300 * 2 ** (4.3 * u), 2.0) * (u ** 3)[:, None]
    shep = np.zeros(n)
    for o in range(5):
        lf = np.log2(55) + o + u
        amp = np.exp(-0.5 * ((lf - np.log2(440)) / 1.1) ** 2)
        shep += np.sin(TAU * np.cumsum(2 ** lf) / SR) * amp
    sub = sat(sine(note_hz(root - 12), n) * u ** 1.5, 1.6)
    x = (layer(cue_drone(dur, seed + 1, root, 0.4), -4) + layer(strings, -1) + layer(riser, -8)
         + layer(stereo(shep * u ** 2), -12) + layer(stereo(sub), -8))
    return fades(space(x, 'hall', 0.3, tail=False, seed=seed), 0.3)


def piano_note(midi, vel=0.6, dur=2.0, seed=0, pedal_tail=0.4):
    """Synthesized piano note: inharmonic partials, hammer-position comb, per-partial two-stage decay, detuned
    string pairs, hammer thump; released by a damper after `dur`."""
    rng = R(seed)
    f0 = float(note_hz(midi))
    n = ns(dur + pedal_tail)
    t = tvec(n)
    B = 1.2e-4 * 2 ** ((midi - 48) / 12)
    tau1 = float(np.clip(7.0 * 2 ** (-(midi - 45) / 24), 1.2, 9.0))
    pos = 7.3 + rng.uniform(-0.3, 0.3)
    out = np.zeros(n)
    for k in range(1, 40):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > 11000:
            break
        ak = abs(np.sin(np.pi * k / pos)) / k ** (1.3 - 0.6 * vel)
        tk = tau1 / (1 + 0.35 * (k - 1) ** 1.1)
        m = min(n, ns(tk * 7))
        tt = t[:m]
        env = 0.65 * np.exp(-tt / (tk * 0.18)) + 0.35 * np.exp(-tt / tk)
        d = rng.uniform(0.3, 1.2) / 1200
        s = np.sin(TAU * fk * tt + rng.uniform(0, TAU)) + np.sin(TAU * fk * 2 ** d * tt + rng.uniform(0, TAU))
        out[:m] += ak * env * s * 0.5
    h = ns(0.012)
    out[:h] += lp(rng.standard_normal(h), 1500 + 4000 * vel) * np.exp(-t[:h] / 0.004) * 0.12 * vel
    out *= np.minimum(t / 0.0015, 1)
    rel = t > dur
    out[rel] *= np.exp(-(t[rel] - dur) / 0.12)
    out = lp(out, 2500 + 6000 * vel, order=1)
    return out * vel ** 1.6


_SAD_CHORDS = {   # left hand, pad
    'Am': ((45, 52, 57), (57, 60, 64)), 'F': ((41, 48, 53), (57, 60, 65)), 'C': ((48, 55, 60), (55, 60, 64)),
    'G': ((43, 50, 55), (55, 59, 62)), 'E': ((40, 47, 56), (56, 59, 64)),
}
_SAD_PROG = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'E']
_SAD_MEL = [(0, 76, 2), (2, 74, 1), (3, 72, 1), (4, 72, 3), (7, 69, 1), (8, 67, 2), (10, 76, 2), (12, 74, 4),
            (16, 76, 2), (18, 74, 1), (19, 72, 1), (20, 81, 2), (22, 79, 1), (23, 77, 1), (24, 76, 2), (26, 74, 1),
            (27, 72, 1), (28, 71, 3), (31, 68, 1)]


def cue_sad(dur, seed, bpm=66):
    """Sad emotional motif in A minor (i-VI-III-VII ... V): sparse piano melody with pedalled broken chords,
    a soft string pad underneath. Hall reverb."""
    n, rng = ns(dur), R(seed)
    beat = 60 / bpm
    bar = 4 * beat
    piano = np.zeros(n + ns(4))
    pad = np.zeros((n + ns(4), 2))
    nb = int(np.ceil(dur / bar)) + 1
    for b in range(nb):
        ch = _SAD_PROG[b % 8]
        lh, pc = _SAD_CHORDS[ch]
        tb = b * bar
        for (off, note, v) in ((0, lh[0], 0.5), (1.5, lh[1], 0.33), (2.5, lh[2], 0.3)):
            add_at(piano, piano_note(note, v * rng.uniform(0.92, 1.05), bar - off * beat + 0.2, seed_of(seed, b, off)), (tb + off * beat) * SR)
        m = ns(bar + 1.5)
        seg = _pad([(p, 1.0) for p in pc], m, rng, voices=3, detune=7, fc=900)
        seg = fades(seg, 1.2, 1.4)
        add_at(pad, seg, tb * SR)
    for cyc in range(int(np.ceil(dur / (8 * bar))) + 1):
        for (bt, note, ln) in _SAD_MEL:
            t0 = cyc * 8 * bar + bt * beat
            if t0 < dur:
                add_at(piano, piano_note(note, rng.uniform(0.55, 0.7), ln * beat + 0.15, seed_of(seed, cyc, bt)), t0 * SR)
    x = layer(stereo(piano[:n], 0.5) * np.array([[1.0, 0.92]]), 0) + layer(pad[:n], -11)
    return fades(space(x, 'hall', 0.4, tail=False, seed=seed), 0.6)


SCORE = {
    'cine_drone':   (cue_drone, 'tension drone: detuned low strings, slow filter movement, sub, semitone tension note', 0.0),
    'cine_swell':   (cue_swell, 'rising swell: tremolo string cluster crescendo + riser + Shepard tone, builds to the cue end', 1.0),
    'cine_heart':   (cue_heart, 'heartbeat pulse (accelerating 70→100 bpm) over a darker drone', 0.0),
    'cine_sad':     (cue_sad, 'sad emotional piano motif in A minor with a soft string pad', 0.0),
    'cine_silence': (None, 'true silence (music stops dead; add amb "none" to drop the ambience too)', 0.0),
}


def score(mode, dur, seed=None):
    fn, _, trim = SCORE[mode]
    if fn is None:
        return np.zeros((ns(dur), 2), np.float32)
    seed = seed_of('score', mode) if seed is None else seed
    x = fit(fn(dur, seed), ns(dur))
    return (x * db(-23 + trim - loudness(x))).astype(np.float32)


# ================================================================================================ SFX
def sfx_thunder_far(p, seed):
    """Distant rolling thunder: staggered low rumbles, no crack, wide and heavily low-passed."""
    rng = R(seed)
    dur = p.get('dur', 7.0)
    n = ns(dur)
    out = np.zeros((n, 2))
    for k in range(int(rng.integers(4, 8))):
        t0, at, de = rng.uniform(0, dur * 0.45), rng.uniform(0.3, 1.0), rng.uniform(0.8, 2.5)
        m = ns(at + de * 4)
        tt = tvec(m)
        e = np.where(tt < at, (tt / at) ** 2, np.exp(-(tt - at) / de)) * rng.uniform(0.5, 1.0)
        r = lp(noise2(m, rng, 'brown', 0.3), rng.uniform(120, 300)) * e[:, None]
        add_at(out, r, t0 * SR)
    crack = bp(noise2(n, rng, 'pink', 0.3), 300, 1200) * np.stack([ctrl(n, 6, rng, 0, 1) ** 3] * 2, 1) * np.exp(-tvec(n) / (dur * 0.3))[:, None]
    x = sat(layer(out, 0) + layer(crack, -14), 1.4)
    return peak_norm(fades(space(x, 'hall', 0.35, seed=seed), 0, 0.5), 0.8)


def sfx_thunder_crack(p, seed):
    """Close lightning strike: instant crack, a tearing ripple of crackles, a massive boom, then the roll."""
    rng = R(seed)
    dur = p.get('dur', 6.0)
    n = ns(dur)
    t = tvec(n)
    x = np.zeros((n, 2))
    c = ns(0.012)
    x[:c] += noise2(c, rng, 'white', 0.6) * np.exp(-tvec(c) / 0.004)[:, None] * 3
    env_rip = np.exp(-0.5 * ((t - 0.15) / 0.12) ** 2) + 0.4 * np.exp(-0.5 * ((t - 0.45) / 0.15) ** 2)
    ts = poisson(dur, 900, rng, env_rip)
    rip = render_events(n, ts, np.exp(rng.normal(0, 0.6, len(ts))), rng.uniform(0, 1, len(ts)),
                        [k_click(rng, 800, 6000) for _ in range(8)], rng)
    boom = lp(noise2(n, rng, 'brown', 0.5), 150) * (np.minimum(t / 0.03, 1) * np.exp(-t / 1.2))[:, None]
    sub = stereo(np.sin(TAU * np.cumsum(32 + 60 * np.exp(-t / 0.15)) / SR) * np.exp(-t / 0.9))
    roll = fit(sfx_thunder_far({'dur': dur - 0.8}, seed + 1), n - ns(0.8))
    y = layer(x, 2) + layer(rip, -3) + layer(boom, 0) + layer(sub, -4)
    y[ns(0.8):] += layer(roll, -5)
    return peak_norm(fades(space(sat(y, 1.3), 'hall', 0.3, seed=seed), 0, 0.6), 0.95)


def sfx_impact(p, seed):
    """Trailer impact hit: sub drop, noise crack, inharmonic metal ring, saturation, hall tail."""
    rng = R(seed)
    n = ns(p.get('dur', 3.0))
    t = tvec(n)
    sub = np.sin(TAU * np.cumsum(35 + 90 * np.exp(-t / 0.07)) / SR) * np.exp(-t / 0.7)
    crack = hp(rng.standard_normal(n), 800) * np.exp(-t / 0.015)
    metal = sum(np.sin(TAU * f * t + rng.uniform(0, TAU)) * np.exp(-t / d) * a
                for f, d, a in ((182, 0.9, 1), (471, 0.6, 0.6), (1130, 0.35, 0.4), (2210, 0.2, 0.25), (3720, 0.12, 0.15)))
    x = layer(stereo(sat(sub, 2.0)), 0) + layer(stereo(crack), -4) + layer(stereo(metal * np.exp(-t / 0.5)), -10)
    return peak_norm(space(x, 'hall', 0.35, seed=seed), 0.95)


def sfx_braam(p, seed):
    """'Braam': massive brassy low cluster with a growl, filter opening then closing, sub boom, long tail."""
    rng = R(seed)
    dur = p.get('dur', 3.5)
    n = ns(dur)
    t = tvec(n)
    root = p.get('root', 33)
    growl = 1 + 0.012 * np.sin(TAU * 31 * t) * np.exp(-t / 0.8)
    x = np.zeros((n, 2))
    for m, a in ((root, 1.0), (root + 12, 0.8), (root + 19, 0.55), (root + 24, 0.4), (root + 27, 0.25)):
        for ch in (0, 1):
            for v in range(4):
                f = note_hz(m) * (1 - 0.03 * np.exp(-t / 0.08)) * growl * 2 ** (((v - 1.5) * 9 + (4 if ch else -4)) / 1200)
                x[:, ch] += saw(f, n, rng.random()) * a / 4
    fc = 250 + 2600 * np.minimum(t / 0.12, 1) * np.exp(-t / 0.9)
    x = tvf(x, 'lp', fc, 2.0) * (np.minimum(t / 0.02, 1) * np.exp(-t / 1.4))[:, None]
    sub = stereo(np.sin(TAU * np.cumsum(30 + 50 * np.exp(-t / 0.1)) / SR) * np.exp(-t / 1.0))
    y = sat(layer(x, 0) + layer(sub, -3), 2.2)
    return peak_norm(fades(space(y, 'hall', 0.4, seed=seed), 0, 0.8), 0.95)


def sfx_whoosh_low(p, seed):
    """Low airy pass-by: band sweeps up then down with a Doppler-like envelope, panning across."""
    rng = R(seed)
    dur = p.get('dur', 1.3)
    n = ns(dur)
    u = tvec(n) / dur
    e = np.exp(-0.5 * ((u - 0.55) / 0.2) ** 2)
    fc = 150 + 800 * np.exp(-0.5 * ((u - 0.55) / 0.18) ** 2)
    x = tvf(noise2(n, rng, 'pink', 0.6), 'bp', fc, 1.5) * e[:, None]
    flutter = 1 + 0.25 * np.sin(TAU * np.cumsum(8 + 25 * e) / SR)
    x *= flutter[:, None]
    pan = np.clip(u, 0, 1)
    x[:, 0] *= np.cos(pan * np.pi / 2) * 1.2
    x[:, 1] *= np.sin(pan * np.pi / 2) * 1.2
    return peak_norm(space(x, 'hall', 0.15, seed=seed), 0.8)


def sfx_riser(p, seed):
    """Horror riser: noise band climbing 4 octaves, Shepard tone, accelerating tremolo; peaks at the very end."""
    rng = R(seed)
    dur = p.get('dur', 4.0)
    n = ns(dur)
    u = tvec(n) / dur
    nz = tvf(noise2(n, rng, 'white', 0.4), 'bp', 250 * 2 ** (4.6 * u), 2.5)
    shep = np.zeros(n)
    for o in range(5):
        lf = np.log2(80) + o + 1.5 * u
        shep += np.sin(TAU * np.cumsum(2 ** lf) / SR) * np.exp(-0.5 * ((lf - np.log2(600)) / 1.0) ** 2)
    trem = 0.6 + 0.4 * np.sin(TAU * np.cumsum(4 + 22 * u ** 2) / SR)
    x = (layer(nz, 0) + layer(stereo(shep), -4)) * (u ** 2.5 * trem)[:, None]
    x[-ns(0.01):] *= np.linspace(1, 0, ns(0.01))[:, None]
    return peak_norm(x, 0.85)


def sfx_heartbeat(p, seed):
    return stereo(heartbeat(p.get('strength', 1.0), p.get('gap', 0.28), seed))


def sfx_heartbeat_loop(p, seed):
    return stereo(heartbeat_loop(p.get('dur', 6.0), p.get('bpm', 72), p.get('bpm_end'), seed))


def sfx_footsteps_mud(p, seed):
    """Footsteps in mud: heel thud, squelch (low bubbly suction), small splash, and the sucking lift of the foot."""
    rng = R(seed)
    steps = int(p.get('n', 6))
    per = 60 / p.get('bpm', 105)
    n = ns(steps * per + 1.0)
    out = np.zeros((n, 2))
    for k in range(steps):
        t0 = k * per + rng.normal(0, 0.02)
        m = ns(0.6)
        tt = tvec(m)
        thud = lp(rng.standard_normal(m), 300) * np.exp(-tt / 0.04) * 1.2
        ts = 0.01 + np.cumsum(rng.uniform(0.004, 0.02, int(rng.integers(4, 9))))
        sq = render_events(m, ts, rng.uniform(0.4, 1, len(ts)), np.full(len(ts), 0.5),
                           [k_bubble(rng, 180, 700, 0.01, 0.03, 0.3, 0.8, 0.1) for _ in range(4)], rng)[:, 0]
        splash = hp(rng.standard_normal(m), 900) * np.exp(-tt / 0.03) * 0.3
        lift = bq(rng.standard_normal(m), 'bp', 400, 3) * np.exp(-0.5 * ((tt - 0.3) / 0.05) ** 2) * 0.5
        st = layer(thud, 0) + layer(sq, -2) + layer(splash, -8) + layer(lift, -8)
        add_at(out, stereo(st * rng.uniform(0.8, 1.0), 0.44 + 0.12 * (k % 2)), t0 * SR)
    return peak_norm(space(out, p.get('space') or 'forest', 0.15, seed=seed), 0.85)


def sfx_branch_snap(p, seed):
    """Branch snap: sharp fibre cracks (2-4 within 30 ms), woody resonances, then a rustle of leaves."""
    rng = R(seed)
    n = ns(1.2)
    t = tvec(n)
    x = np.zeros(n)
    for k in range(int(rng.integers(2, 5))):
        i = ns(rng.uniform(0, 0.03)) if k else 0
        m = ns(0.12)
        tt = tvec(m)
        c = rng.standard_normal(m) * np.exp(-tt / 0.0008) * (1.0 if k == 0 else rng.uniform(0.3, 0.7))
        wood = sum(_dsine(f, d, m) * a for f, d, a in ((rng.uniform(380, 520), 0.05, 0.6), (rng.uniform(900, 1300), 0.03, 0.5), (rng.uniform(1700, 2400), 0.015, 0.3)))
        add_at(x, c * 2 + wood * (0.5 if k == 0 else 0.2), i)
    rust = bp(rng.standard_normal(n), 1500, 9000) * np.exp(-np.maximum(t - 0.05, 0) / 0.18) * (t > 0.04) * 0.25
    return peak_norm(space(stereo(x + rust, p.get('pan', 0.5)), p.get('space') or 'forest', 0.3, seed=seed), 0.9)


def sfx_wood_creak(p, seed):
    """Wood creak (stick-slip friction): micro-impulses at a wandering 'pitch' exciting woody resonances."""
    rng = R(seed)
    dur = p.get('dur', 1.6)
    n = ns(dur)
    u = tvec(n) / dur
    rate = (30 + 110 * np.sin(np.pi * u) ** 1.3 * rng.uniform(0.6, 1.0) + 15 * ctrl(n, 3, rng, -1, 1)) * p.get('pitch', 1.0)
    ph = np.cumsum(np.maximum(rate, 5)) / SR
    idx = np.nonzero(np.diff(np.floor(ph)) > 0)[0]
    amps = np.sin(np.pi * u[idx]) ** 0.7 * rng.uniform(0.6, 1.0, len(idx))
    m = ns(0.06)
    kern = [_unit(sum(_dsine(f * rng.uniform(0.95, 1.05), d, m) * a for f, d, a in ((240, 0.02, 1.0), (610, 0.012, 0.7), (1150, 0.008, 0.5), (2350, 0.004, 0.3)))) for _ in range(3)]
    x = render_events(n, idx / SR, amps, np.full(len(idx), 0.5), kern, rng)[:, 0]
    x = sat(x * 1.5, 1.5)
    return peak_norm(stereo(x, p.get('pan', 0.5)), 0.8)


def sfx_drip(p, seed):
    """A single water drip into a pool, in an echoing space (cave by default)."""
    rng = R(seed)
    k = k_bubble(rng, p.get('f_lo', 900), p.get('f_hi', 2200), 0.01, 0.022, 0.2, 0.45, 0.35)
    k = np.concatenate([k, np.zeros(ns(0.1))])
    return peak_norm(space(stereo(k, p.get('pan', 0.5)), p.get('space') or 'cave', p.get('wet', 1.1), 0.6, seed=seed), 0.8)


def radio_chain(v, rng, snr_db=8.0):
    """Process a voice like a weak handheld radio: band-limit, drive, decimate, fading drop-outs."""
    v = bp(v / (np.abs(v).max() + 1e-9), 380, 2900, order=3)
    v = bq(v, 'peak', 1500, 1.0, 6.0)
    v = sat(v * 3.0, 2.0)
    hold = 4   # 12 kHz sample-and-hold (crunchy)
    v = np.repeat(v[::hold], hold)[:len(v)]
    fade = np.clip(ctrl(len(v), 3.0, rng, 0.1, 1.6), 0, 1)
    gate = (ctrl(len(v), 9.0, rng, 0, 1) > 0.18).astype(float)
    gate = uniform_filter1d(gate, ns(0.01))
    return v * fade * gate * db(-snr_db / 2)


def _babble(n, rng):
    """Unintelligible voice-like babble: jittered glottal pulse train through moving vowel formants."""
    t = tvec(n)
    f0 = 118 * (1 + 0.12 * ctrl(n, 4, rng, -1, 1) - 0.08 * t / max(t[-1], 1e-3))
    src = saw(f0, n) + 0.1 * rng.standard_normal(n)
    vowels = np.array([(730, 1090, 2440), (270, 2290, 3010), (300, 870, 2240), (530, 1840, 2480), (570, 840, 2410)])
    syl = rng.uniform(0.14, 0.24, int(n / SR / 0.14) + 2)
    tk = np.concatenate([[0], np.cumsum(syl)])
    vk = vowels[rng.integers(0, 5, len(tk))]
    F = np.stack([np.interp(t, tk, vk[:, j]) for j in range(3)], 1)
    y = sum(tvf(src, 'bp', F[:, j], 6.0 + 2 * j) * a for j, a in enumerate((1.0, 0.7, 0.35)))
    env = np.zeros(n)
    for a, b in zip(tk[:-1], tk[1:]):
        if rng.random() < 0.85:
            i0, i1 = ns(a), min(n, ns(b))
            if i1 > i0:
                env[i0:i1] = np.sin(np.pi * np.linspace(0, 1, i1 - i0)) ** 0.8
    return y * env


def sfx_radio(p, seed, voice=None):
    """Radio: squelch open, crackling static with a drifting heterodyne whistle, a filtered voice burst (TTS voice
    if given, else synthetic babble), squelch tail."""
    rng = R(seed)
    vdur = len(voice) / SR if voice is not None else p.get('voice_dur', 1.4)
    dur = p.get('dur', max(1.8, vdur + 0.9))
    n = ns(dur)
    t = tvec(n)
    st = bp(rng.standard_normal(n), 400, 5200) * (0.55 + 0.45 * ctrl(n, 12, rng, 0, 1))
    cr = np.zeros(n)
    ii = rng.integers(0, n, int(dur * 40))
    cr[ii] = rng.uniform(-1, 1, len(ii))
    cr = bp(cr, 1000, 6000) * 4
    het = sine(1400 + 500 * ctrl(n, 0.6, rng, -1, 1), n) * 0.06
    sq = np.zeros(n)
    k = ns(0.12)
    sq[:k] = bp(rng.standard_normal(k), 800, 4000) * 1.6
    sq[-k:] = bp(rng.standard_normal(k), 800, 4000) * 1.6
    vt = 0.35
    if voice is not None:
        v = np.zeros(n)
        add_at(v, radio_chain(np.asarray(voice, float), rng), vt * SR)
    else:
        v = np.zeros(n)
        add_at(v, radio_chain(_babble(ns(vdur), rng), rng), vt * SR)
    x = layer(st, -2) + layer(cr, -10) + het + sq * 0.5
    x = x * fades(np.ones(n), 0.01, 0.05) + layer(v, 3)
    return peak_norm(stereo(x, p.get('pan', 0.5)), 0.85)


def sfx_stinger(p, seed):
    """Jump-scare stinger: dissonant orchestral stab (semitone clusters high + low), screeching violin glissando,
    impact slam, hall tail."""
    rng = R(seed)
    dur = p.get('dur', 2.6)
    n = ns(dur)
    t = tvec(n)
    env = np.minimum(t / 0.008, 1) * np.exp(-t / 0.6)
    st = _pad([(m, 1.0) for m in (72, 73, 74, 78, 79)] + [(36, 1.2), (37, 0.9)], n, rng, voices=4, detune=14, fc=6000, Q=0.8) * env[:, None]
    f = note_hz(88) * 2 ** (0.5 * np.minimum(t / 0.5, 1)) * (1 + 0.02 * np.sin(TAU * 11 * t))
    screech = stereo(bq(saw(f, n), 'bp', 3000, 1.5) * np.minimum(t / 0.02, 1) * np.exp(-t / 0.7), 0.6)
    imp = sfx_impact({'dur': dur}, seed + 1)[:n]
    x = layer(st, 0) + layer(screech, -6) + layer(fit(imp, n), -2)
    return peak_norm(space(sat(x, 1.6), 'hall', 0.35, seed=seed), 0.97)


def sfx_splash(p, seed):
    """Splash: surface slap, cavity 'plunk' (big Minnaert bubble), spray falling back, slosh."""
    rng = R(seed)
    size = p.get('size', 1.0)
    n = ns(1.8)
    t = tvec(n)
    slap = hp(rng.standard_normal(n), 600) * np.exp(-t / (0.012 * size))
    m = ns(0.25)
    plunk = np.zeros(n)
    plunk[ns(0.02):ns(0.02) + m] = _dsine(rng.uniform(150, 380) / size, 0.05, m, rise=0.2)
    ts = 0.15 + rng.gamma(2.0, 0.15, int(220 * size))
    ts = ts[ts < 1.6]
    spray = render_events(n, ts, rng.uniform(0.2, 1, len(ts)), rng.uniform(0.2, 0.8, len(ts)),
                          [k_bubble(rng, 1500, 9000, 0.002, 0.008, 0.2, 0.6, 0.4) for _ in range(6)] + [k_droplet(rng) for _ in range(4)], rng)
    slosh = lp(rng.standard_normal(n), 700) * np.minimum(t / 0.05, 1) * np.exp(-t / 0.4)
    x = layer(stereo(slap), 0) + layer(stereo(plunk), -2) + layer(spray, -6) + layer(stereo(slosh), -5)
    return peak_norm(space(x, p.get('space') or 'beach', 0.2, seed=seed), 0.9)


def sfx_wave_crash(p, seed):
    """One big wave crashing (the surf cycle as a one-shot)."""
    rng = R(seed)
    w, tc = _wave(rng, p.get('size', 1.3))
    return peak_norm(w[ns(max(tc - p.get('pre', 1.0), 0)):], 0.9)


def sfx_fire_ignite(p, seed):
    """Fire catching: match scratch, a 'fwoomp' flare with a low thump, the first crackles."""
    rng = R(seed)
    n = ns(2.5)
    t = tvec(n)
    scratch = bp(rng.standard_normal(n), 2000, 6500) * (t < 0.18) * (0.5 + 0.5 * ctrl(n, 60, rng, 0, 1))
    fl = np.maximum(t - 0.22, 0)
    flare = tvf(noise(n, rng, 'pink'), 'lp', 300 + 2500 * np.exp(-fl / 0.4) * (t > 0.22), 0.8) * (t > 0.22) * np.minimum(fl / 0.08, 1) * np.exp(-fl / 0.6)
    thump = lp(rng.standard_normal(n), 120) * (t > 0.22) * np.exp(-fl / 0.12)
    cr = bed_campfire(2.5, seed)[:, 0] * np.clip((t - 0.4) / 1.0, 0, 1)
    x = layer(scratch, -4) + layer(flare, 0) + layer(thump, -6) + layer(cr, -6)
    return peak_norm(stereo(x, 0.5), 0.85)


SFX = {
    'thunder_far':    (sfx_thunder_far, 'distant rolling thunder, no crack (dur)'),
    'thunder_crack':  (sfx_thunder_crack, 'close lightning strike: crack, ripping crackle, boom, roll (dur)'),
    'impact':         (sfx_impact, 'cinematic trailer impact: sub drop + crack + metal ring'),
    'braam':          (sfx_braam, "massive brassy 'braam' with growl and long tail (dur, root)"),
    'whoosh_low':     (sfx_whoosh_low, 'low airy pass-by whoosh panning across (dur)'),
    'riser':          (sfx_riser, "horror riser peaking at its end (dur; use \"align\": \"end\" to land on the anchor)"),
    'heartbeat':      (sfx_heartbeat, "single 'lub-dub' (strength, gap)"),
    'heartbeat_loop': (sfx_heartbeat_loop, 'heartbeat run (dur, bpm, bpm_end for acceleration)'),
    'footsteps_mud':  (sfx_footsteps_mud, 'footsteps squelching in mud (n, bpm)'),
    'branch_snap':    (sfx_branch_snap, 'dry branch snapping + leaf rustle (pan)'),
    'wood_creak':     (sfx_wood_creak, 'wood creak, stick-slip friction (dur, pitch, pan)'),
    'drip':           (sfx_drip, 'single water drip with cave echo (space, wet, pan)'),
    'radio':          (sfx_radio, "radio static + squelch + filtered voice burst (text/voice for a real line, else babble)"),
    'stinger':        (sfx_stinger, 'jump-scare stinger: dissonant stab + screech + slam'),
    'splash':         (sfx_splash, 'splash into water (size)'),
    'wave_crash':     (sfx_wave_crash, 'single big wave crash (size, pre)'),
    'fire_ignite':    (sfx_fire_ignite, 'match strike + fire catching'),
}


def sfx(name, p=None, seed=0, voice=None, space_name=None):
    """Render an sfx by name → stereo float32. p = the script's sfx dict (dur, n, bpm, pan, space, wet, ...).
    space_name (or p['space']) adds an acoustic space on top (drip/footsteps/branch already use theirs)."""
    p = dict(p or {})
    fn = SFX[name][0]
    x = fn(p, seed, voice=voice) if name == 'radio' else fn(p, seed)
    sp = p.get('space', space_name)
    if sp and name not in ('drip', 'footsteps_mud', 'branch_snap') and sp in SPACES:
        x = space(x, sp, wet=p.get('wet', 0.3), seed=seed)
    return np.asarray(x, np.float32)


# ===================================================================================== loudness / mixing
_KB1, _KA1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
_KB2, _KA2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]


def loudness(x, gated=True):
    """ITU-R BS.1770-4 integrated loudness (K-weighting, 400 ms blocks, 75 % overlap, -70 / -10 LU gates). LUFS."""
    x = np.asarray(x, float)
    x = x[:, None] if x.ndim == 1 else x
    y = signal.lfilter(_KB2, _KA2, signal.lfilter(_KB1, _KA1, x, axis=0), axis=0)
    p = np.sum(y * y, 1)
    blk, hop = ns(0.4), ns(0.1)
    if len(p) < blk:
        return -0.691 + 10 * np.log10(np.mean(p) + 1e-12)
    c = np.concatenate([[0], np.cumsum(p)])
    st = np.arange(0, len(p) - blk + 1, hop)
    z = (c[st + blk] - c[st]) / blk
    if not gated:
        return -0.691 + 10 * np.log10(np.mean(z) + 1e-12)
    lj = -0.691 + 10 * np.log10(z + 1e-12)
    za = z[lj > -70]
    if len(za) == 0:
        return -70.0
    gam = -0.691 + 10 * np.log10(np.mean(za)) - 10
    zr = z[lj > gam]
    return float(-0.691 + 10 * np.log10(np.mean(zr) + 1e-12))


def true_peak(x, os_=4):
    up = signal.resample_poly(np.asarray(x, float), os_, 1, axis=0)
    return float(np.abs(up).max())


def sidechain(voice, thr_db=-42.0, knee_db=12.0, hold=0.05, smooth=0.09):
    """Narration activity 0..1 for ducking: RMS follower → soft knee → max-hold (look-ahead AND hold, so the duck
    starts just before a word and does not pump between words) → forward-backward smoothing."""
    e = np.sqrt(uniform_filter1d(np.asarray(voice, float) ** 2, ns(0.02)) + 1e-12)
    act = np.clip((20 * np.log10(e) - thr_db) / knee_db, 0, 1)
    act = maximum_filter1d(act, 2 * ns(hold) + 1)
    a = np.exp(-1 / (smooth * SR))
    act = signal.filtfilt([1 - a], [1, -a], act)
    return np.clip(act, 0, 1)


def duck(x, act, depth_db, mid_db=0.0):
    """Sidechain duck: broadband by depth_db at full narration, plus an extra dip of mid_db in the speech band
    (0.9-4.5 kHz) so consonants cut through even when the bed is busy."""
    y = x * db(-depth_db * act)[:, None]
    if mid_db > 0:
        mid = bp(y, 900, 4500)
        y = y - mid * (1 - db(-mid_db * act))[:, None]
    return y


def amb_track(segs, N, act, voice_lufs, rel_db=-14.0, depth_db=6.0, mid_db=4.0):
    """Build the ambience stem. segs = [(t0, t1, spec, fade)] where fade is the crossfade INTO that segment and
    spec = name | 'a+b' | {'name', 'gain'} | 'none'. Each bed sits rel_db under the narration while it talks (after
    the duck) and rises depth_db in the gaps. Equal-power crossfades centred on each change."""
    out = np.zeros((N, 2))
    T = N / SR
    for k, (t0, t1, spec, fade) in enumerate(segs):
        name, gain = (spec, 1.0) if isinstance(spec, str) else (spec.get('name'), spec.get('gain', 1.0))
        if not name or name == 'none':
            continue
        fin = fade if t0 > 0.05 else 0.0
        fout = segs[k + 1][3] if k + 1 < len(segs) else 0.0
        a, b = max(0.0, t0 - fin / 2), min(T, t1 + fout / 2)
        x = amb(name, b - a, seed=seed_of('amb', name, round(t0, 2)))
        x = fades(x, fin if a > 0 else 0.0, fout if b < T else 0.0)
        g = db(voice_lufs + rel_db + depth_db - (-23.0)) * gain
        add_at(out, x * g, a * SR)
    return duck(out, act, depth_db, mid_db).astype(np.float32)


CUE_FADE_IN = {'cine_drone': 1.5, 'cine_swell': 0.4, 'cine_heart': 0.5, 'cine_sad': 0.8}


def score_track(segs, N, act, voice_lufs, rel_db=-16.0, depth_db=6.0, mid_db=3.0):
    """Build the cinematic score stem from music segments [(t0, t1, mode, next_mode)]. Cues fade out over 1.2 s,
    or cut dead (60 ms) into 'cine_silence' / 'none' so a silence lands like a held breath."""
    out = np.zeros((N, 2))
    for t0, t1, mode, nxt in segs:
        if mode not in SCORE or mode == 'cine_silence':
            continue
        fout = 0.06 if nxt in ('cine_silence', 'none') else 1.2
        a = max(0.0, t0)
        x = score(mode, (t1 - a) + fout, seed=seed_of('score', mode, round(t0, 2)))
        x = fades(x, CUE_FADE_IN.get(mode, 0.5), fout)
        g = db(voice_lufs + rel_db + depth_db - (-23.0))
        add_at(out, x * g, a * SR)
    return duck(out, act, depth_db, mid_db).astype(np.float32)


def limiter(x, ceiling_db=-1.5, window=0.04):
    """Look-ahead brick-wall limiter on the 4x-oversampled (true) peak. The gain curve is a min-filter of the
    required gain smoothed by a box half its width, which is provably never above the required gain → no overs."""
    c = db(ceiling_db)
    up = signal.resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up).max(1)
    pk = pk[:len(pk) // 4 * 4].reshape(-1, 4).max(1)
    pk = fit(pk, len(x))
    need = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    w = ns(window)
    g = minimum_filter1d(need, 2 * w + 1)
    g = uniform_filter1d(g, w + 1)
    return x * g[:, None]


def master(mix, target_lufs=-16.0, ceiling_db=-1.5, seed=0):
    """Loudness-normalize to target (BS.1770 integrated) with a true-peak limiter, two passes. → (out, report)."""
    x = np.asarray(mix, float)
    for _ in range(3):
        x = x * db(target_lufs - loudness(x))
        x = limiter(x, ceiling_db - 0.3)
    rng = R(seed)
    d = (rng.random(x.shape) - rng.random(x.shape)) / 32768.0   # TPDF dither for 16-bit
    x = np.clip(x + d, -1, 1)
    return x.astype(np.float32), {'lufs': round(loudness(x), 2), 'true_peak_db': round(20 * np.log10(true_peak(x) + 1e-12), 2),
                                  'sample_peak_db': round(20 * np.log10(np.abs(x).max() + 1e-12), 2)}


# ============================================================================================ preview
def spectrogram_png(items, path, fmax=16000, title=None):
    """items = [(label, stereo or mono array)] → one PNG with a log-magnitude spectrogram per item."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    k = len(items)
    cols = 2 if k > 3 else 1
    rows = int(np.ceil(k / cols))
    fig, axs = plt.subplots(rows, cols, figsize=(8 * cols, 2.4 * rows), squeeze=False)
    for i, (lab, x) in enumerate(items):
        ax = axs[i // cols][i % cols]
        m = np.asarray(x, float)
        m = m.mean(1) if m.ndim == 2 else m
        f, tt, S = signal.spectrogram(m, SR, nperseg=2048, noverlap=1536)
        Sd = 10 * np.log10(S + 1e-14)
        vmax = np.percentile(Sd, 99.7)
        ax.pcolormesh(tt, f, Sd, vmin=vmax - 80, vmax=vmax, shading='auto', cmap='magma')
        ax.set_ylim(20, fmax)
        ax.set_yscale('symlog', linthresh=500)
        ax.set_title(f'{lab}   (LUFS {loudness(x):.1f}, peak {20 * np.log10(np.abs(x).max() + 1e-12):.1f} dBFS)', fontsize=9)
        ax.tick_params(labelsize=7)
    for j in range(k, rows * cols):
        axs[j // cols][j % cols].axis('off')
    if title:
        fig.suptitle(title)
    fig.tight_layout()
    fig.savefig(path, dpi=80)
    plt.close(fig)


def preview(outdir=None, bed_dur=20.0, cue_dur=14.0):
    import soundfile as sf
    outdir = outdir or os.path.join(ROOT, 'out', 'audio_real')
    os.makedirs(outdir, exist_ok=True)
    items = []
    for name in BEDS:
        x = amb(name, bed_dur)
        sf.write(os.path.join(outdir, f'amb_{name}.wav'), x, SR)
        items.append((f'amb {name}', x))
        print('bed', name, round(loudness(x), 1))
    spectrogram_png(items, os.path.join(outdir, 'spec_beds.png'))
    items = []
    for mode in SCORE:
        if mode == 'cine_silence':
            continue
        x = score(mode, cue_dur)
        sf.write(os.path.join(outdir, f'score_{mode}.wav'), x, SR)
        items.append((mode, x))
        print('cue', mode, round(loudness(x), 1))
    spectrogram_png(items, os.path.join(outdir, 'spec_score.png'))
    items = []
    for name in SFX:
        x = sfx(name, {}, seed_of('preview', name))
        sf.write(os.path.join(outdir, f'sfx_{name}.wav'), x, SR)
        items.append((name, x))
        print('sfx', name, f'{len(x) / SR:.2f}s')
    spectrogram_png(items, os.path.join(outdir, 'spec_sfx.png'))


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        preview()
    else:
        print(__doc__)
