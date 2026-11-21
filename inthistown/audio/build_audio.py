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


NARRATOR = style(('am_michael', 0.6), ('am_puck', 0.4))
VOICES = {  # speaker → (voice style or name, speed, lang)
    'narr': (NARRATOR, 1.08, 'en-us'),
    'me': (NARRATOR, 1.0, 'en-us'),
    'heckler': ('bm_george', 1.1, 'en-gb'),
    'marcus': ('am_liam', 1.04, 'en-us'),
}

# Extra silence AFTER each beat (seconds). Default 0.30.
GAP_AFTER = {
    'b01': 0.22, 'b02': 0.22, 'b03': 0.32, 'b04': 0.18, 'b05': 0.12, 'b06': 0.16, 'b07': 0.35,
    'b08': 0.16, 'b09': 0.16, 'b10': 0.38, 'b11': 0.18, 'b12': 0.32, 'b13': 0.22, 'b14': 0.4,
    'b15': 0.3, 'b16': 0.4, 'b17': 0.16, 'b18': 0.4, 'b19': 0.2, 'b20': 0.35, 'b21': 0.2,
    'b22': 1.15,  # crowd laugh plays here, heckler cuts in on top of its tail
    'b23': 0.45, 'b24': 0.3, 'b25': 0.16, 'b26': 0.38, 'b27': 0.4, 'b28': 1.1, 'b29': 0.12,
    'b30': 0.5, 'b31': 0.42, 'b32': 1.0, 'b33': 0.3, 'b34': 0.55, 'b35': 0.45, 'b36': 0.5,
    'b37': 0.15, 'b38': 0.15, 'b39': 0.45, 'b40': 0.6, 'b41': 0.35, 'b42': 0.6, 'b43': 0.25,
    'b44': 0.25, 'b45': 0.45, 'b46': 1.6,
}
# Pause after a phrase-final punctuation INSIDE a beat.
PHRASE_PAUSE = {',': 0.1, '.': 0.3, '?': 0.34, '!': 0.28, '...': 0.36, ';': 0.2}
PHRASE_PAUSE_OVERRIDE = {('b14', 0): 0.45, ('b24', 0): 0.38, ('b24', 1): 0.35, ('b27', 0): 0.42,
                         ('b28', 0): 0.65, ('b34', 0): 0.35, ('b34', 1): 0.35, ('b35', 0): 0.45,
                         ('b41', 0): 0.3, ('b45', 0): 0.5}
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


def tts(text, speaker):
    v, speed, lang = VOICES[speaker]
    vkey = v if isinstance(v, str) else f'blend{float(np.asarray(v).sum()):.4f}'
    return _cached(f'{text}|{vkey}|{speed}|{lang}', lambda: K.create(text, voice=v, speed=speed, lang=lang)[0])


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


def make_huss(voice='am_fenrir', pitch=1.0, seed=0, grit=1.0):
    key = (voice, round(pitch, 3), seed, grit)
    if key in _HUSS_CACHE:
        return _HUSS_CACHE[key]
    rng = np.random.default_rng(100 + seed)
    v = trim(up(tts_voice('hˈʌs!', voice, speed=1.2, phonemes=True)), thr=0.02)
    # tighten: keep at most 0.26 s of the TTS syllable
    v = v[: int(0.26 * SR)]
    v[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    if pitch != 1.0:
        n = int(len(v) / pitch)
        v = signal.resample(v, n).astype(np.float32)
    n = len(v) + int(0.2 * SR)
    out = np.zeros(n, np.float32)
    # breathy attack
    hb = S.bp(rng.standard_normal(int(0.05 * SR)).astype(np.float32), 700, 3200)
    hb *= np.minimum(1, np.arange(len(hb)) / (0.006 * SR)) * S.env_exp(len(hb), 0.025)
    out[: len(hb)] += hb * 0.25 * grit
    vv = v / (np.abs(v).max() + 1e-9)
    out[int(0.008 * SR): int(0.008 * SR) + len(vv)] += vv * 0.9
    # short 'ss' tail (kept subtle: the reference HUSS is mostly a voiced, breathy bark)
    sl = int(0.09 * SR)
    ss = S.bp(rng.standard_normal(sl).astype(np.float32), 3500, 8000) * S.env_exp(sl, 0.03)
    ss *= np.minimum(1, np.arange(sl) / (0.008 * SR))
    st = int(0.008 * SR) + int(len(vv) * 0.6)
    out[st: st + sl] += ss[: len(out) - st] * 0.2 * grit
    # chest thump for impact
    th = S.thump(0.16) * 0.45
    out[: len(th)] += th
    out = np.tanh(out * 1.8) / np.tanh(1.8)
    out = out[: int(0.25 * SR)]
    out[-int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR))
    out = S.reverb(out, room=0.12, wet=0.06, seed=7 + seed)
    out /= np.abs(out).max() + 1e-9
    _HUSS_CACHE[key] = out.astype(np.float32)
    return _HUSS_CACHE[key]


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
            gap = b.get('gap', 0.34)
            for i in range(n):
                if b['speaker'] == 'town':
                    vlist = ['am_liam', 'af_bella', 'bm_daniel', 'am_onyx', 'am_fenrir']
                    h = make_huss(vlist[i % len(vlist)], pitch=[1.0, 1.25, 0.9, 0.95, 1.05][i % 5], seed=10 + i)
                    h = S.lp(h, 2600) * 0.75
                    h = S.reverb(h, 0.7, 0.4, 20 + i)
                elif b['speaker'] == 'pigeon':
                    h = make_huss('am_puck', pitch=1.75, seed=99)
                else:
                    h = make_huss('am_fenrir', pitch=[1.0, 1.04, 0.97, 1.06][i % 4], seed=i)
                th = t + i * gap
                voice_track.append((th, h))
                words_out.append({'text': 'HUSS!', 'start': round(th, 3), 'end': round(th + 0.26, 3)})
                huss_events.append((th, bid, i, b['speaker']))
            t = t + (n - 1) * gap + 0.3
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

    # ------------------------------------------------------------------------------------ sfx bus
    sfx = np.zeros((N, 2), np.float32)

    def put(x, at, g=1.0, pan=0.5):
        if x.ndim == 2:
            S.place(sfx[:, 0], x[:, 0], at, g); S.place(sfx[:, 1], x[:, 1], at, g)
        else:
            S.place(sfx[:, 0], x, at, g * (1 - pan) * 2 ** 0.5); S.place(sfx[:, 1], x, at, g * pan * 2 ** 0.5)

    for (th, bid, i, spk) in huss_events:
        if bid in ('b03', 'b12', 'b18', 'b26'):
            put(S.wood_knock(seed=i, pitch=1 + 0.05 * (i % 3)), th + 0.03, 0.55, 0.45 + 0.1 * (i % 2))
        if bid == 'b26':
            put(S.clock_click(), th + 0.17, 0.5, 0.65)
        if bid == 'b36':
            put(S.wood_knock(seed=20 + i), th + 0.04, 0.12, 0.2 + 0.15 * i)
    put(S.whoosh(0.3, up=True), wstart('b14', 5) - 0.05, 0.35)                 # sacrifice → toast flies
    put(S.whoosh(0.32, seed=5, up=False), wstart('b15', 1) - 0.05, 0.35)        # castled
    put(S.thump(0.3), wstart('b15', 3) + 0.1, 0.5)
    for k in range(2):                                                          # cat L-hop boings
        put(S.whoosh(0.18, seed=8 + k), wstart('b16', 5) + k * 0.28, 0.25, 0.4 + 0.2 * k)
    laugh = crowd_laugh()
    put(laugh, beat['b22']['end'] + 0.05, 0.9)
    put(S.thump(0.4), wstart('b27', 0), 0.6)
    put(S.wood_knock(seed=77, pitch=0.8), wstart('b27', 0) + 0.12, 0.6)
    music_stop = wstart('b28', 2) + 0.08                                        # "The music STOPPED"
    put(S.record_scratch(), music_stop - 0.05, 0.55)
    for k in range(9):                                                          # pigeon knocks pieces over
        put(S.wood_knock(seed=200 + k, pitch=0.9 + 0.08 * (k % 4)), wstart('b44', 1) + k * 0.07, 0.3, 0.3 + 0.05 * k)
    put(S.coo(), beat['b46']['words'][0]['end'] + 0.12, 0.7, 0.55)
    put(S.sting((65, 69, 72, 77)), beat['b46']['words'][0]['end'] + 0.25, 0.35)

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
    g_party = 0.27 * ramp(0, B('b02') - 0.05, 0.12) + 0.27 * ramp(B('b04') - 0.05, B('b11') - 0.05, 0.12) \
        + 0.26 * ramp(B('b19') - 0.1, music_stop, 0.02)
    g_muff = 0.22 * ramp(B('b02') - 0.05, B('b04') - 0.05, 0.12) + 0.22 * ramp(B('b11') - 0.05, B('b19') - 0.1, 0.12)
    g_amb = 1.0 * ramp(B('b33') - 0.3, B('b38'), 0.8)
    g_lofi = 0.4 * ramp(B('b37') - 0.2, duration - 0.6, 1.2)
    music = (party[:N] * g_party[:, None] + muff[:N] * g_muff[:, None] + lofi[:N] * g_lofi[:, None])
    # duck music under the voice
    win = int(0.05 * SR)
    venv = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode='same'))
    venv = np.clip(venv / 0.08, 0, 1)
    alpha = np.exp(-1 / (0.18 * SR))  # ~180 ms smoothing so the music doesn't pump between words
    venv = signal.lfilter([1 - alpha], [1, -alpha], venv).astype(np.float32)
    duck = 1 - 0.45 * np.clip(venv * 3, 0, 1)
    music *= duck[:, None]
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
                  {'t': B('b11'), 'mode': 'muffled'}, {'t': B('b19'), 'mode': 'party'},
                  {'t': round(music_stop, 3), 'mode': 'silence'}, {'t': B('b33'), 'mode': 'night'},
                  {'t': B('b37'), 'mode': 'lofi'}]
    tl = {'fps': 30, 'duration': duration, 'audio': 'audio/mix.wav', 'beats': timeline_beats, 'words': words,
          'music': music_cues, 'markers': {'musicStop': round(music_stop, 3)}}
    json.dump(tl, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
    print('duration', duration, 'words', len(words))


if __name__ == '__main__':
    main()
