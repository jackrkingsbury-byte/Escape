"""Generic episode soundtrack builder (episode 2 onwards).

  python3 audio/build_episode.py ep2      → episodes/ep2/{timeline.json, mix.wav, stems/}

Everything episode-specific lives in episodes/<ep>/script.json:

  { "title": "...", "lead_in": 0.3,
    "voices": { "<speaker>": ["am_liam", 1.04, "en-us", [1.3, 1.07, 1.1] | null], ... },   # optional extra speakers
    "beats": [ { "id": "b01", "kind": "line|quote|huss", "speaker": "narr", "text": "...",
                 "n": 3,                         # huss only (3 = one triplet, 6 = two)
                 "gapAfter": 0.3,                # silence after the beat (default 0.28)
                 "pauses": [0.4, null],          # pause after phrase k inside the beat (null = default)
                 "music": "party|muffled|lofi|night|none",   # music mode from this beat on
                 "markers": { "name": "w:<wordprefix>[+0.1] | start | end[+0.2]" },
                 "sfx": [ { "type": "laugh|knock|whoosh|coo|thump|cheer", "at": "w:<word>|start|end[+x]", "gain": 0.8 } ],
                 "card": {...}, "visual": "..." } ] }   # passed through untouched for the shot list

Rules (from the user's notes): the only meme SOUND EFFECT is the real HUSS sample. Meme words (top ten,
respect, goon…) are normal narrated words. Foley (crowd laugh, chess knocks, cat whoosh) and music are fine.
"""
import json, os, re, sys, subprocess
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import build_audio as BA  # noqa: E402  (Kokoro, youthify, real_huss, crowd_laugh, trim, …)
import synth as S          # noqa: E402

SR = BA.SR
DEFAULT_GAP = 0.28


def parse_at(spec, beat):
    """'w:laughed+0.1' | 'start' | 'end-0.2' → seconds."""
    m = re.match(r'^(w:[^+\-]+|start|end)([+\-][0-9.]+)?$', spec.strip())
    if not m:
        raise ValueError(f'bad anchor {spec!r} in {beat["id"]}')
    base, off = m.group(1), float(m.group(2) or 0)
    if base == 'start':
        t = beat['start']
    elif base == 'end':
        t = beat['end']
    else:
        word = base[2:].lower()
        hits = [w for w in beat['words'] if re.sub(r'[^a-z0-9]', '', w['text'].lower()).startswith(re.sub(r'[^a-z0-9]', '', word))]
        if not hits:
            raise KeyError(f'word {word!r} not in {beat["id"]}: {[w["text"] for w in beat["words"]]}')
        t = hits[0]['start']
    return t + off


def main(ep):
    epdir = os.path.join(ROOT, 'episodes', ep)
    script = json.load(open(os.path.join(epdir, 'script.json')))
    for spk, v in (script.get('voices') or {}).items():
        BA.VOICES[spk] = (v[0], v[1], v[2], tuple(v[3]) if v[3] else None)
    beats = script['beats']
    voice_track, tl_beats, huss_events = [], [], []
    t = script.get('lead_in', 0.3)
    for b in beats:
        bid = b['id']; tb0 = t; words = []
        if b['kind'] == 'huss':
            n = b['n']
            onsets = [(i // 3) * BA.TRIPLET_PERIOD + BA.TRIPLET[i % 3] for i in range(n)]
            for i in range(n):
                if b['speaker'] == 'town':
                    h = S.reverb(S.lp(BA.real_huss(i, [1.0, 1.12, 0.92][i % 3]), 3200) * 0.8, 0.7, 0.4, 20 + i)
                elif b['speaker'] == 'pigeon':
                    h = BA.real_huss(i, [1.45, 1.5, 1.42][i % 3])
                elif b['speaker'] == 'grandad':
                    h = BA.real_huss(i, [0.86, 0.88, 0.85][i % 3])
                else:
                    h = BA.real_huss(i)
                th = t + onsets[i]
                voice_track.append((th, h))
                words.append({'text': 'HUSS!', 'start': round(th, 3), 'end': round(th + 0.26, 3)})
                huss_events.append((th, bid, i, b['speaker']))
            t += onsets[-1] + 0.3
        else:
            phrases = BA.split_phrases(b['text'])
            pauses = b.get('pauses') or []
            for pi, ph in enumerate(phrases):
                if b.get('ph'):   # explicit phonemes for words the TTS can't say (e.g. a drawn-out "Hisss")
                    v, sp, lang, yo = BA.VOICES[b['speaker']]
                    a = BA.tts_voice(b['ph'], v, speed=sp, lang=lang, phonemes=True)
                    if yo:
                        a = BA._cached(f"YP|{b['ph']}|{v}|{sp}|{yo}", lambda a=a: BA.youthify(a, BA.TSR, *yo))
                    a = BA.trim(BA.up(a))
                else:
                    a = BA.trim(BA.up(BA.tts(ph, b['speaker'])))
                dur = len(a) / SR
                voice_track.append((t, a))
                ws = ph.split()
                wts = np.array([BA.phone_weight(w) for w in ws])
                edges = np.concatenate([[0], np.cumsum(wts) / wts.sum()]) * (dur - 0.03) + 0.015
                for wi, w in enumerate(ws):
                    words.append({'text': BA.display(w), 'start': round(t + edges[wi], 3), 'end': round(t + edges[wi + 1], 3)})
                t += dur
                if pi < len(phrases) - 1:
                    m = re.search(r'(\.\.\.|[,.?!;:…])$', ph)
                    p = pauses[pi] if pi < len(pauses) and pauses[pi] is not None else BA.PHRASE_PAUSE.get(m.group(1) if m else ',', 0.12)
                    t += p
        tb1 = words[-1]['end'] if words else t
        extra = {k: v for k, v in b.items() if k not in ('id', 'kind', 'speaker', 'text', 'n', 'gapAfter', 'pauses', 'sfx', 'markers', 'music')}
        tl_beats.append({'id': bid, 'speaker': b['speaker'], 'kind': b['kind'], 'text': b['text'], 'start': round(tb0, 3), 'end': round(tb1, 3), 'words': words, **extra})
        t = max(t, tb1) + b.get('gapAfter', DEFAULT_GAP)
        print(f"{bid} {tb0:6.2f}-{tb1:6.2f}  [{b['speaker']}] {b['text']}")
    duration = round(t, 3)
    N = int(duration * SR) + 1
    beat = {b['id']: b for b in tl_beats}

    # voice
    voice = np.zeros(N, np.float32)
    for at, a in voice_track:
        S.place(voice, a, at, 0.9)
    voice = voice + 0.35 * S.bp(voice, 2200, 6500)

    # foley + chess knocks under HUSS runs
    sfx = np.zeros((N, 2), np.float32)

    def put(x, at, g=1.0, pan=0.5):
        if x.ndim == 2:
            S.place(sfx[:, 0], x[:, 0], at, g); S.place(sfx[:, 1], x[:, 1], at, g)
        else:
            S.place(sfx[:, 0], x, at, g * (1 - pan) * 2 ** 0.5); S.place(sfx[:, 1], x, at, g * pan * 2 ** 0.5)

    markers = {}
    for b0 in beats:
        tb = beat[b0['id']]
        for name, spec in (b0.get('markers') or {}).items():
            markers[name] = round(parse_at(spec, tb), 3)
        for fx in b0.get('sfx') or []:
            at = parse_at(fx.get('at', 'start'), tb); g = fx.get('gain', 0.8)
            typ = fx['type']
            if typ == 'laugh':
                put(BA.crowd_laugh(), at, g)
            elif typ == 'cheer':
                put(BA.crowd(['Yeaaah!', 'Woo!', 'Let\'s go!', 'Yeah!'], seed=71), at, g)
            elif typ == 'knock':
                put(S.wood_knock(seed=int(at * 10)), at, g)
            elif typ == 'whoosh':
                put(S.whoosh(0.3, seed=int(at * 10)), at, g)
            elif typ == 'coo':
                put(S.coo(), at, g, 0.55)
            elif typ == 'thump':
                put(S.thump(0.35), at, g)
            else:
                raise ValueError(f'unknown sfx type {typ}')
    for (th, bid, i, spk) in huss_events:
        if spk in ('me', 'narr', 'grandad', 'pigeon') and beat[bid].get('knock', True):
            kn = S.wood_knock(seed=i, pitch=1 + 0.05 * (i % 3))[: int(0.09 * SR)] * np.exp(-np.arange(int(0.09 * SR)) / (0.025 * SR))
            put(kn, th + 0.02, 0.35, 0.45 + 0.1 * (i % 2))

    # music: piecewise modes from beat fields
    party = S.party_track(duration + 1); lofi = S.lofi_track(duration + 1); amb = S.night_ambience(duration + 1)
    muff = np.stack([S.lp(S.lp(party[:, 0], 380), 380), S.lp(S.lp(party[:, 1], 380), 380)], 1) * 1.3
    tt = np.arange(N) / SR
    seg = []
    for b0 in beats:
        if 'music' in b0:
            seg.append((beat[b0['id']]['start'] - 0.08, b0['music']))
    seg.sort()
    gains = {'party': (party, 0.27), 'muffled': (muff, 0.22), 'lofi': (lofi, 0.4), 'night': (amb, 1.0)}
    music = np.zeros((N, 2), np.float32)
    for k, (t0, mode) in enumerate(seg):
        t1 = seg[k + 1][0] if k + 1 < len(seg) else duration
        if mode not in gains:
            continue
        src, g = gains[mode]
        fade = 0.06 if mode != 'lofi' else 0.8
        r = np.clip(np.minimum((tt - t0) / fade + 1, (t1 - tt) / fade + 1), 0, 1).astype(np.float32)
        music += src[:N] * (g * r)[:, None]
    win = int(0.05 * SR)
    venv = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode='same'))
    venv = np.clip(venv / 0.08, 0, 1)
    alpha = np.exp(-1 / (0.18 * SR))
    venv = signal.lfilter([1 - alpha], [1, -alpha], venv).astype(np.float32)
    music *= (1 - 0.45 * np.clip(venv * 3, 0, 1))[:, None]
    # HUSS runs: music drops out, bright held chord underneath (like the reference)
    gate = np.ones(N, np.float32)
    for b in tl_beats:
        if b['kind'] == 'huss' and b['speaker'] in ('me', 'narr', 'grandad', 'pigeon') and b.get('gate', True):
            t0, t1 = b['words'][0]['start'] - 0.12, b['words'][-1]['end'] + 0.12
            gate *= 1 - np.clip(np.minimum((tt - t0) / 0.04 + 1, (t1 - tt) / 0.04 + 1), 0, 1)
            hold = S.organ((69, 76, 81, 84), dur=t1 - t0 + 0.6)
            hold[: int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))
            put(np.stack([hold, hold], 1), t0, 0.3)
    music *= gate[:, None]

    mix = np.tanh((music + sfx + np.stack([voice, voice], 1)) * 1.1) / 1.1
    os.makedirs(os.path.join(epdir, 'stems'), exist_ok=True)
    for name, arr in (('voice', voice), ('music', music), ('sfx', sfx)):
        sf.write(os.path.join(epdir, f'stems/{name}.wav'), arr, SR)
    raw = os.path.join(epdir, 'stems/mix_raw.wav'); sf.write(raw, mix, SR)
    out = os.path.join(epdir, 'mix.wav')
    m = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    js = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le', out], check=True)

    words = [{**w, 'beat': b['id'], 'kind': b['kind'], 'speaker': b['speaker'], 'i': i} for b in tl_beats for i, w in enumerate(b['words'])]
    tl = {'fps': 30, 'duration': duration, 'audio': f'episodes/{ep}/mix.wav', 'beats': tl_beats, 'words': words,
          'music': [{'t': round(t0, 3), 'mode': m} for t0, m in seg], 'markers': markers, 'title': script.get('title')}
    json.dump(tl, open(os.path.join(epdir, 'timeline.json'), 'w'), indent=1)
    print('duration', duration, 'words', len(words), 'markers', markers)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'ep2')
