"""Builds the soundtrack + timeline for In This Town.

  python3 audio/build_audio.py            → audio/mix.wav, audio/timeline.json, audio/stems/*.wav

Narration: Kokoro-82M (ONNX, offline; models in ./models). HUSS!, SFX and music are synthesized
(audio/synth.py). Word timings come from synthesizing each phrase separately (so phrase boundaries are
exact) and spreading words inside a phrase by phoneme count.
"""
import json, re, os, subprocess, sys
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import synth as S  # noqa: E402

SR = S.SR          # 48 kHz final
TSR = 24000        # Kokoro output rate

from kokoro_onnx import Kokoro  # noqa: E402
K = Kokoro(os.path.join(ROOT, 'models/kokoro-v1.0.int8.onnx'), os.path.join(ROOT, 'models/voices-v1.0.bin'))


def style(*mix):
    """Blend Kokoro voice styles: style(('am_michael', .6), ('am_puck', .4))."""
    return sum(K.get_voice_style(v) * w for v, w in mix)


# Narrator = the hero: a young, bright, expressive voice (matched to the user's reference clip:
# F0 ≈ 200 Hz, ~13 semitone range). Kokoro has no young male voice, so we take am_fenrir and
# youthify it with the WORLD vocoder (pitch ×1.45, vocal tract ×1.12, contour ×1.1).
VOICES = {  # speaker → (voice style or name, speed, lang, youth=(f0_scale, formant, expr) | None)
    'narr': ('am_fenrir', 1.05, 'en-us', (1.45, 1.12, 1.1)),
    'me': ('am_fenrir', 0.97, 'en-us', (1.45, 1.12, 1.12)),
    'heckler': ('bm_george', 1.1, 'en-gb', None),
    'marcus': ('am_liam', 1.04, 'en-us', (1.3, 1.07, 1.1)),
}
HERO_HUSS = ('am_fenrir', (1.45, 1.12, 1.0))
# HUSS rhythm from the reference: tight triplets (0, .21, .40 s), next triplet starts .98 s later.
TRIPLET = (0.0, 0.21, 0.40)
TRIPLET_PERIOD = 0.98

# Extra silence AFTER each beat (seconds). Default 0.30.
GAP_AFTER = {
    'b01': 0.2, 'b02': 0.22, 'b03': 0.3, 'b04': 0.15, 'b05': 0.32, 'b06': 0.3, 'b07': 0.15, 'b08': 0.3,
    'b09': 0.4, 'b10': 0.35, 'b11': 0.35, 'b12': 0.2, 'b13': 0.1, 'b14': 0.35, 'b15': 0.4,
    'b16': 0.35, 'b17': 0.42, 'b18': 0.5, 'b19': 0.38, 'b20': 0.65,
    'b21': 0.15, 'b22': 0.4, 'b23': 0.45, 'b24': 0.3, 'b25': 0.45, 'b26': 0.45, 'b27': 1.15,
}
# Pause after a phrase-final punctuation INSIDE a beat.
PHRASE_PAUSE = {',': 0.1, '.': 0.28, '?': 0.32, '!': 0.26, '...': 0.34, ';': 0.2}
PHRASE_PAUSE_OVERRIDE = {('b04', 0): 0.12, ('b09', 0): 0.45, ('b13', 0): 0.8, ('b15', 0): 0.35, ('b15', 1): 0.3,
                         ('b15', 2): 0.4, ('b17', 0): 0.4, ('b17', 1): 0.4, ('b23', 0): 0.45, ('b23', 1): 0.35,
                         ('b25', 0): 0.35}
LEAD_IN = 0.3


CACHE = os.path.join(ROOT, 'cache', 'tts')
os.makedirs(CACHE, exist_ok=True)


def _cached(key, fn):
    import hashlib
    p = os.path.join(CACHE, hashlib.sha1(key.encode()).hexdigest() + '.npy')
    if os.path.exists(p):
        return np.load(p)
    a = fn().astype(np.float32)
    np.save(p, a)
    return a


from youth import youthify  # noqa: E402


def tts(text, speaker):
    v, speed, lang, yo = VOICES[speaker]
    vkey = v if isinstance(v, str) else f'blend{float(np.asarray(v).sum()):.4f}'
    raw = _cached(f'{text}|{vkey}|{speed}|{lang}', lambda: K.create(text, voice=v, speed=speed, lang=lang)[0])
    if not yo:
        return raw
    return _cached(f'Y|{text}|{vkey}|{speed}|{lang}|{yo}', lambda: youthify(raw, TSR, *yo))


def tts_voice(text, voice, speed=1.0, lang='en-us', phonemes=False):
    return _cached(f'{text}|{voice}|{speed:.4f}|{lang}|{phonemes}',
                   lambda: K.create(text, voice=voice, speed=speed, lang=lang, is_phonemes=phonemes)[0])


def up(a):
    return signal.resample_poly(a, SR // TSR, 1).astype(np.float32)


def trim(a, thr=0.012, pad_s=0.015):
    win = int(0.01 * SR)
    e = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, mode='same'))
    idx = np.where(e > thr)[0]
    if len(idx) == 0:
        return a
    i0 = max(0, idx[0] - int(pad_s * SR)); i1 = min(len(a), idx[-1] + int(pad_s * SR))
    out = a[i0:i1].copy()
    f = min(int(0.006 * SR), len(out) // 4)
    out[:f] *= np.linspace(0, 1, f); out[-f:] *= np.linspace(1, 0, f)
    return out


def split_phrases(text):
    parts = re.findall(r'[^,.?!;…]+(?:\.\.\.|[,.?!;…])?', text)
    return [p.strip() for p in parts if p.strip()]


def phone_weight(word):
    w = re.sub(r"[^A-Za-z0-9'\-]", '', word)
    if not w:
        return 1.0
    if w.isdigit():
        return 3.0 * len(w)
    try:
        ph = K.tokenizer.phonemize(w, 'en-us')
        n = len([c for c in ph if c not in "ˈˌː "])
    except Exception:
        n = len(w)
    return max(1.5, n) + 0.8


def display(word):
    return re.sub(r'(\.\.\.|[,.;:…])+$', '', word)


# ---------------------------------------------------------------------------------------------- HUSS
_HUSS_CACHE = {}


def make_huss(voice='am_fenrir', pitch=1.0, seed=0, grit=1.0, youth=None):
    key = (voice, round(pitch, 3), seed, grit, youth)
    if key in _HUSS_CACHE:
        return _HUSS_CACHE[key]
    rng = np.random.default_rng(100 + seed)
    raw = tts_voice('hˈʌs!', voice, speed=1.2, phonemes=True)
    if voice == HERO_HUSS[0] and youth:
        raw = _cached(f'YH|{voice}|{youth}', lambda: youthify(raw, TSR, *youth))
    v = trim(up(raw), thr=0.02)
    # tighten: keep at most 0.26 s of the TTS syllable
    v = v[: int(0.22 * SR)]
    v[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    if pitch != 1.0:
        n = int(len(v) / pitch)
        v = signal.resample(v, n).astype(np.float32)
    n = len(v) + int(0.2 * SR)
    out = np.zeros(n, np.float32)
    # breathy attack
    hb = S.bp(rng.standard_normal(int(0.05 * SR)).astype(np.float32), 700, 3200)
    hb *= np.minimum(1, np.arange(len(hb)) / (0.006 * SR)) * S.env_exp(len(hb), 0.025)
    out[: len(hb)] += hb * 0.15 * grit
    vv = v / (np.abs(v).max() + 1e-9)
    out[int(0.008 * SR): int(0.008 * SR) + len(vv)] += vv * 1.25
    # short 'ss' tail (kept subtle: the reference HUSS is mostly a voiced, breathy bark)
    sl = int(0.09 * SR)
    ss = S.bp(rng.standard_normal(sl).astype(np.float32), 3500, 8000) * S.env_exp(sl, 0.03)
    ss *= np.minimum(1, np.arange(sl) / (0.008 * SR))
    st = int(0.008 * SR) + int(len(vv) * 0.6)
    out[st: st + sl] += ss[: len(out) - st] * 0.2 * grit
    # chest thump for impact
    th = S.thump(0.2) * 0.85      # the reference HUSS carries a heavy low-end hit
    out[: len(th)] += th
    out = np.tanh(out * 1.8) / np.tanh(1.8)
    # crisp bark like the reference: ~60 ms body then a fast decay, gone by 150 ms
    n = int(0.15 * SR)
    out = out[:n] if len(out) >= n else np.pad(out, (0, n - len(out)))
    env = np.ones(n, np.float32)
    h = int(0.06 * SR)
    env[h:] = np.exp(-np.arange(n - h) / (0.03 * SR))
    out *= env
    out = S.reverb(out, room=0.08, wet=0.04, seed=7 + seed)
    out /= np.abs(out).max() + 1e-9
    _HUSS_CACHE[key] = out.astype(np.float32)
    return _HUSS_CACHE[key]


_REAL = None


def real_huss(i, pitch=1.0):
    """The shared meme HUSS sound (cut from the user's reference clip), i cycles through the 3 takes."""
    global _REAL
    if _REAL is None:
        _REAL = [sf.read(os.path.join(HERE, f'sfx/huss_{k}.wav'))[0].astype(np.float32) for k in (1, 2, 3)]
    x = _REAL[i % 3]
    if pitch != 1.0:
        x = signal.resample(x, int(len(x) / pitch)).astype(np.float32)
    return x


def say(text, voice, speed=1.0, lang='en-us', pitch=1.0, rev=0.0):
    a = trim(up(tts_voice(text, voice, speed=speed, lang=lang)))
    if pitch != 1.0:
        a = signal.resample(a, int(len(a) / pitch)).astype(np.float32)
    if rev:
        a = S.reverb(a, room=0.6, wet=rev, seed=5)
    return a / (np.abs(a).max() + 1e-9)


def crowd(text_list, seed=61, n=8):
    rng = np.random.default_rng(seed)
    voices = [('af_bella', 'en-us'), ('am_puck', 'en-us'), ('bf_emma', 'en-gb'), ('am_eric', 'en-us'),
              ('af_nicole', 'en-us'), ('bm_lewis', 'en-gb'), ('af_sarah', 'en-us'), ('am_adam', 'en-us')]
    L = np.zeros(int(2.0 * SR), np.float32); R = np.zeros_like(L)
    for i, (v, lang) in enumerate(voices[:n]):
        a = trim(up(tts_voice(text_list[i % len(text_list)], v, speed=rng.uniform(0.9, 1.1), lang=lang)))
        a /= np.abs(a).max() + 1e-9
        off, pan, g = rng.uniform(0, 0.15), rng.uniform(0.15, 0.85), rng.uniform(0.35, 0.55)
        S.place(L, a, off, g * (1 - pan)); S.place(R, a, off, g * pan)
    return np.stack([S.reverb(L, 0.6, 0.35, 1), S.reverb(R, 0.6, 0.35, 2)], 1)


def crowd_laugh(seed=60):
    rng = np.random.default_rng(seed)
    voices = [('af_bella', 'en-us'), ('am_puck', 'en-us'), ('bf_emma', 'en-gb'), ('am_eric', 'en-us'),
              ('af_nicole', 'en-us'), ('bm_lewis', 'en-gb'), ('af_sarah', 'en-us'), ('am_adam', 'en-us'),
              ('af_sky', 'en-us'), ('bm_fable', 'en-gb')]
    lines = ['Ha ha ha ha!', 'Hahaha!', 'Ha ha ha!', 'Ha! Ha ha ha!', 'Hahahaha!']
    L = np.zeros(int(2.4 * SR), np.float32); R = np.zeros_like(L)
    for i, (v, lang) in enumerate(voices):
        a = trim(up(tts_voice(lines[i % len(lines)], v, speed=rng.uniform(1.05, 1.3), lang=lang)))
        a /= np.abs(a).max() + 1e-9
        off = rng.uniform(0, 0.35)
        pan = rng.uniform(0.15, 0.85)
        g = rng.uniform(0.35, 0.6)
        S.place(L, a, off, g * (1 - pan)); S.place(R, a, off, g * pan)
    L = S.reverb(L, 0.6, 0.35, 1); R = S.reverb(R, 0.6, 0.35, 2)
    fade = np.ones_like(L); fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR))
    return np.stack([L * fade, R * fade], 1)


# ------------------------------------------------------------------------------------------- build
def main():
    script = json.load(open(os.path.join(ROOT, 'story/script.json')))
    beats = script['beats']
    voice_track = []           # (t, mono array) at SR
    timeline_beats = []
    t = LEAD_IN
    huss_events = []           # (t, beat_id, i, speaker)
    for b in beats:
        bid = b['id']
        tb0 = t
        words_out = []
        if b['kind'] == 'huss':
            n = b['n']
            onsets = [(i // 3) * TRIPLET_PERIOD + TRIPLET[i % 3] for i in range(n)]
            for i in range(n):
                if b['speaker'] == 'town':       # heard from the windows: distant + roomy
                    h = S.reverb(S.lp(real_huss(i, [1.0, 1.12, 0.92][i % 3]), 3200) * 0.8, 0.7, 0.4, 20 + i)
                elif b['speaker'] == 'pigeon':   # pitched up — the pigeon's own HUSS
                    h = real_huss(i, [1.45, 1.5, 1.42][i % 3])
                else:
                    h = real_huss(i)
                th = t + onsets[i]
                voice_track.append((th, h))
                words_out.append({'text': 'HUSS!', 'start': round(th, 3), 'end': round(th + 0.26, 3)})
                huss_events.append((th, bid, i, b['speaker']))
            t = t + onsets[-1] + 0.3
        else:
            phrases = split_phrases(b['text'])
            for pi, ph in enumerate(phrases):
                a = trim(up(tts(ph, b['speaker'])))
                dur = len(a) / SR
                voice_track.append((t, a))
                ws = ph.split()
                wts = np.array([phone_weight(w) for w in ws])
                edges = np.concatenate([[0], np.cumsum(wts) / wts.sum()]) * (dur - 0.03) + 0.015
                for wi, w in enumerate(ws):
                    words_out.append({'text': display(w), 'start': round(t + edges[wi], 3), 'end': round(t + edges[wi + 1], 3)})
                t += dur
                if pi < len(phrases) - 1:
                    m = re.search(r'(\.\.\.|[,.?!;…])$', ph)
                    t += PHRASE_PAUSE_OVERRIDE.get((bid, pi), PHRASE_PAUSE.get(m.group(1) if m else ',', 0.12))
        tb1 = words_out[-1]['end'] if words_out else t
        timeline_beats.append({'id': bid, 'speaker': b['speaker'], 'kind': b['kind'], 'text': b['text'],
                               'start': round(tb0, 3), 'end': round(tb1, 3), 'words': words_out})
        t = max(t, tb1) + GAP_AFTER.get(bid, 0.3)
        print(f"{bid} {tb0:6.2f}-{tb1:6.2f}  {b['text']}")

    duration = round(t, 3)
    N = int(duration * SR) + 1
    beat = {b['id']: b for b in timeline_beats}

    def wstart(bid, wi):
        return beat[bid]['words'][wi]['start']

    # ----------------------------------------------------------------------------------- voice bus
    voice = np.zeros(N, np.float32)
    for at, a in voice_track:
        S.place(voice, a, at, 0.9)
    voice = voice + 0.35 * S.bp(voice, 2200, 6500)   # presence: crisp phone-speaker narration

    # ------------------------------------------------------------------------------------ sfx bus
    sfx = np.zeros((N, 2), np.float32)

    def put(x, at, g=1.0, pan=0.5):
        if x.ndim == 2:
            S.place(sfx[:, 0], x[:, 0], at, g); S.place(sfx[:, 1], x[:, 1], at, g)
        else:
            S.place(sfx[:, 0], x, at, g * (1 - pan) * 2 ** 0.5); S.place(sfx[:, 1], x, at, g * pan * 2 ** 0.5)

    def wend(bid, wi=-1):
        return beat[bid]['words'][wi]['end']

    gags = {}
    for (th, bid, i, spk) in huss_events:
        if bid in ('b03', 'b08', 'b11', 'b16'):
            put(S.wood_knock(seed=i, pitch=1 + 0.05 * (i % 3))[: int(0.09 * SR)] * np.exp(-np.arange(int(0.09 * SR)) / (0.025 * SR)), th + 0.02, 0.4, 0.45 + 0.1 * (i % 2))
        if bid == 'b16' and i in (1, 4):
            put(S.clock_click(), th + 0.05, 0.5, 0.65)
    # Meme words ("goon", "top ten", "respect", "bruh") are narrated lines in the script — no fake effects.
    # The only meme SOUND EFFECT is the real HUSS. Markers below drive the visual gags (zooms, text).
    def wfind(bid, word):
        for i, w in enumerate(beat[bid]['words']):
            if w['text'].lower().startswith(word.lower()):
                return i
        raise KeyError(f'{word} not in {bid}')
    gags['boomExcept'] = wstart('b02', 1)
    gags['boomPigeon'] = wstart('b05', -1)
    gags['hornGrandad'] = wstart('b06', 3) - 0.05
    gags['bruh1'] = wend('b09') + 0.15
    gags['top10'] = wstart('b15', wfind('b15', 'Top'))
    gags['checkmate'] = wstart('b17', 0)
    gags['respect1'] = wstart('b17', wfind('b17', 'Respect'))
    gags['shades'] = wend('b20') + 0.05
    gags['bruh2'] = wstart('b23', wfind('b23', 'Bro'))
    gags['boomWinning'] = wstart('b25', -1)
    gags['hornEnd'] = beat['b26']['words'][-1]['end'] + 0.1
    gags['respect2'] = wstart('b27', 0)
    put(S.whoosh(0.3, up=True), wstart('b09', 5) - 0.05, 0.3)                   # plate flies (foley)
    for k in range(2):                                                          # cat hops (foley)
        put(S.whoosh(0.18, seed=8 + k), wstart('b10', 5) + k * 0.28, 0.2, 0.4 + 0.2 * k)
    put(crowd_laugh(), wend('b13', wfind('b13', 'laughed')) + 0.05, 0.85)        # "Everybody laughed."
    put(S.thump(0.3), gags['checkmate'] + 0.1, 0.45); put(S.wood_knock(seed=77, pitch=0.8), gags['checkmate'] + 0.12, 0.55)
    music_stop = beat['b18']['start'] - 0.12                                   # the music just cuts out
    put(S.coo(), beat['b27']['words'][-1]['end'] + 0.25, 0.6, 0.55)

    # ---------------------------------------------------------------------------------- music bus
    party = S.party_track(duration + 1)
    lofi = S.lofi_track(duration + 1)
    amb = S.night_ambience(duration + 1)
    muff = np.stack([S.lp(S.lp(party[:, 0], 380), 380), S.lp(S.lp(party[:, 1], 380), 380)], 1) * 1.3

    tt = np.arange(N) / SR

    def ramp(t0, t1, fade=0.25):
        """1 inside [t0, t1], with linear fades of `fade` s at both ends."""
        return np.clip(np.minimum((tt - t0) / fade + 1, (t1 - tt) / fade + 1), 0, 1).astype(np.float32)

    B = lambda bid: beat[bid]['start']  # noqa: E731
    g_party = 0.27 * ramp(0, B('b02') - 0.05, 0.12) + 0.27 * ramp(B('b04') - 0.05, B('b07') - 0.05, 0.12) \
        + 0.26 * ramp(B('b12') - 0.1, music_stop, 0.02)
    g_muff = 0.22 * ramp(B('b02') - 0.05, B('b04') - 0.05, 0.12) + 0.22 * ramp(B('b07') - 0.05, B('b12') - 0.1, 0.12)
    g_amb = 1.0 * ramp(music_stop + 0.2, B('b23'), 0.6)
    g_lofi = 0.4 * ramp(B('b23') - 0.2, duration - 0.6, 1.2)
    import bed as BED
    bedcfg = BED.enabled(True)
    if bedcfg:   # the sampled background bed replaces the procedural music, following the same envelopes
        bm = BED.modes(SR, int(N), bedcfg['path'], bedcfg['gain'])
        (bf, gf), (bmu, gmu), (bs, gs), (bn, gn) = bm['party'], bm['muffled'], bm['lofi'], bm['night_bed']
        music = (bf * (g_party / 0.27 * gf)[:, None] + bmu * (g_muff / 0.22 * gmu)[:, None] + bs * (g_lofi / 0.4 * gs)[:, None]
                 + bn * (g_amb * gn)[:, None])
    else:
        music = (party[:N] * g_party[:, None] + muff[:N] * g_muff[:, None] + lofi[:N] * g_lofi[:, None])
    # duck music under the voice
    win = int(0.05 * SR)
    venv = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode='same'))
    venv = np.clip(venv / 0.08, 0, 1)
    alpha = np.exp(-1 / (0.18 * SR))  # ~180 ms smoothing so the music doesn't pump between words
    venv = signal.lfilter([1 - alpha], [1, -alpha], venv).astype(np.float32)
    duck = 1 - 0.45 * np.clip(venv * 3, 0, 1)
    music *= duck[:, None]
    # the reference drops the music out completely for each HUSS run (hard, punchy)
    gate = np.ones(N, np.float32)
    for bid in ('b03', 'b08', 'b11', 'b16'):
        ws = beat[bid]['words']
        t0, t1 = ws[0]['start'] - 0.12, ws[-1]['end'] + 0.12
        if bedcfg:
            continue   # the bed keeps playing under the HUSS run (as in the reference); no synthetic organ
        gate *= 1 - ramp(t0, t1, 0.04)
        hold = S.organ((69, 76, 81, 84), dur=t1 - t0 + 0.6)          # bright sustained A-minor chord under the HUSSes
        hold[: int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))
        put(np.stack([hold, hold], 1), t0, 0.3)
    music *= gate[:, None]
    music += amb[:N] * g_amb[:, None]

    mix = music + sfx + np.stack([voice, voice], 1)
    mix = np.tanh(mix * 1.1) / 1.1
    os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
    sf.write(os.path.join(HERE, 'stems/voice.wav'), voice, SR)
    sf.write(os.path.join(HERE, 'stems/music.wav'), music, SR)
    sf.write(os.path.join(HERE, 'stems/sfx.wav'), sfx, SR)
    raw = os.path.join(HERE, 'stems/mix_raw.wav')
    sf.write(raw, mix, SR)
    out = os.path.join(HERE, 'mix.wav')
    # loudness normalize for TikTok (~ -14 LUFS), 2-pass linear
    m = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True).stderr
    js = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR),
                    '-c:a', 'pcm_s16le', out], check=True)

    words = []
    for b in timeline_beats:
        for i, w in enumerate(b['words']):
            words.append({**w, 'beat': b['id'], 'kind': b['kind'], 'speaker': b['speaker'], 'i': i})
    music_cues = [{'t': 0, 'mode': 'party'}, {'t': B('b02'), 'mode': 'muffled'}, {'t': B('b04'), 'mode': 'party'},
                  {'t': B('b07'), 'mode': 'muffled'}, {'t': B('b12'), 'mode': 'party'},
                  {'t': round(music_stop, 3), 'mode': 'silence'}, {'t': B('b23'), 'mode': 'lofi'}]
    tl = {'fps': 30, 'duration': duration, 'audio': 'audio/mix.wav', 'beats': timeline_beats, 'words': words,
          'music': music_cues, 'markers': {'musicStop': round(music_stop, 3), **{k: round(v, 3) for k, v in gags.items()}}}
    json.dump(tl, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
    print('duration', duration, 'words', len(words))


if __name__ == '__main__':
    main()
