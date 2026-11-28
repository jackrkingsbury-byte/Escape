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
                 "sfx": [ { "type": "laugh|knock|whoosh|coo|thump|cheer|boom|scratch|ding|pop|thunder|siren|static|rumble|airhorn|dundun|sting|wahwah", "at": "w:<word>|start|end[+x]", "gain": 0.8 } ],
                 "card": {...}, "visual": "..." } ],   # passed through untouched for the shot list
    "bed": true | { "path": "audio/beds/reference_bed.wav", "gain": 0.8, "offset": 0 },   # optional
    "lufs": -16, "master": "cine" }                       # optional, cinematic episodes only (see below)
      # bed = the sampled background loop (audio/bed.py). It REPLACES the procedural music and follows the music
      # modes (party full / muffled through the wall / lofi soft / night faint / none silent), keeps playing under
      # the HUSS runs (no synthetic organ then). BED=0 in the environment disables it.

CINEMATIC LAYER (audio/real.py) — used only when a script asks for it, so older episodes build exactly as before:
  beat "amb":  "rain_forest" | "rain_beach" | "storm_wind" | "storm_sea" | "surf" | "cave" | "jungle_night" | "campfire"
               | "a+b" (layered) | {"name": "...", "gain": 0.8} | "none"      ambience bed from this beat on; equal-power
               crossfade of "ambFade" s (default 1.5) centred just before the beat; sits ~14 dB under the narration
               while it talks (sidechain duck + speech-band dip) and swells back ~6 dB in the gaps.
  beat "music": also "cine_drone" | "cine_swell" | "cine_heart" | "cine_sad" | "cine_silence"   (cinematic score; cues are
               rendered for their own segment length, so a swell builds exactly to the next music change; a cue cuts
               dead into "cine_silence"/"none").
  beat "space": "cave" | "forest" | "hall" | "ship" | "room" | "beach"   subtle reverb on that beat's narration, and the
               default acoustic space of that beat's real.py sfx.
  sfx types from real.py: thunder_far thunder_crack impact braam whoosh_low riser heartbeat heartbeat_loop footsteps_mud
               branch_snap wood_creak drip radio stinger splash wave_crash fire_ignite   (extra keys: dur, n, bpm, bpm_end,
               pan, size, space, wet, "align": "peak" = the climax (riser end, whoosh centre) lands on "at";
               radio: "text" (+ "speaker" or a Kokoro "voice") = a real line through the radio, else babble; "clean": true =
               no drop-outs (phone line); "sub": "<style>" = subtitle style written to timeline "subs" [{t0,t1,text,style,beat}]).
  beat "echo": [delay_s, gain]   a faint doubled copy of that beat's voice (e.g. [0.08, 0.35]).
  When any of this is used the sfx bus is also ducked ~4 dB under the narration, and the master is BS.1770 loudness-normalized to "lufs" (default -16) with a -1.5 dBTP
  true-peak limiter instead of the ffmpeg loudnorm pass, and an "amb" stem is written.

HUSS MUSIC DIP (style bible v2 §3; opt-in per script, so older episodes build exactly as before):
  script "hussDip": true | false | { "db": -6, "dur": 0.3, "attack": 0.02, "release": 0.06, "speakers": ["me", "pip"] }
               With the background loop on ("bed"), the whole music bus (bed + cinematic score) is multiplied by a
               -6 dB dip at every HUSS word of speaker me / pip: 20 ms attack from the HUSS onset, held, released over
               60 ms so it is back at 0 dB 0.3 s after the onset; overlapping dips do not stack. A beat with
               "dip": false is skipped (e.g. the music slams back in on that HUSS). Default: ON for v2 scripts (they
               carry a "huss_plan"), OFF for everything else.
  --out DIR    (command line, after the episode id) write timeline.json, mix.wav and stems/ into DIR instead of
               episodes/<ep>/ (dry runs; the timeline's "audio" field still names episodes/<ep>/mix.wav).

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
import bed as BED          # noqa: E402  (sampled background bed → soundtrack)
import real as RL          # noqa: E402  (cinematic ambience beds / score / sfx — only used when a script asks)

SR = BA.SR
DEFAULT_GAP = 0.28


def parse_at(spec, beat):
    """'w:laughed+0.1' | 'start' | 'end-0.2' → seconds."""
    m = re.match(r'^(we?:[^+\-]+|start|end)([+\-][0-9.]+)?$', spec.strip())
    if not m:
        raise ValueError(f'bad anchor {spec!r} in {beat["id"]}')
    base, off = m.group(1), float(m.group(2) or 0)
    if base == 'start':
        t = beat['start']
    elif base == 'end':
        t = beat['end']
    else:
        exact = base.startswith('we:')
        word = base.split(':', 1)[1].lower()
        key = re.sub(r'[^a-z0-9]', '', word)
        norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())  # noqa: E731
        hits = [w for w in beat['words'] if (norm(w['text']) == key if exact else norm(w['text']).startswith(key))]
        if not hits:
            raise KeyError(f'word {word!r} not in {beat["id"]}: {[w["text"] for w in beat["words"]]}')
        t = hits[0]['start']
    return t + off


def huss_dip_cfg(script):
    """The script's HUSS music-dip settings, or None when the dip is off (see the module doc)."""
    cfg = script.get('hussDip')
    if cfg is None:
        cfg = bool(script.get('huss_plan'))
    if not cfg:
        return None
    base = {'db': -6.0, 'dur': 0.3, 'attack': 0.02, 'release': 0.06, 'speakers': ['me', 'pip']}
    return {**base, **(cfg if isinstance(cfg, dict) else {})}


def huss_dip_gain(N, events, cfg):
    """Gain curve (N samples) with a dip of cfg['db'] at each event time: linear attack, hold, linear release."""
    g = np.ones(N, np.float32)
    floor = 10 ** (cfg['db'] / 20)
    a, rl, d = cfg['attack'], cfg['release'], cfg['dur']
    for th in events:
        i0, i1 = max(0, int(th * SR)), min(N, int((th + d) * SR) + 1)
        if i1 <= i0:
            continue
        x = np.arange(i0, i1) / SR - th
        env = np.clip(np.minimum(x / a, (d - x) / rl), 0, 1)
        g[i0:i1] = np.minimum(g[i0:i1], 1 - (1 - floor) * env)
    return g


def main(ep, outdir=None):
    epdir = os.path.join(ROOT, 'episodes', ep)
    script = json.load(open(os.path.join(epdir, 'script.json')))
    outdir = os.path.abspath(outdir) if outdir else epdir
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
                if b.get('pitch'):
                    h = BA.real_huss(i, b['pitch'] * [1.0, 1.03, 0.98][i % 3])
                elif b['speaker'] == 'town':
                    h = S.reverb(S.lp(BA.real_huss(i, [1.0, 1.12, 0.92][i % 3]), 3200) * 0.8, 0.7, 0.4, 20 + i)
                elif b['speaker'] == 'pigeon':
                    h = BA.real_huss(i, [1.45, 1.5, 1.42][i % 3])
                elif b['speaker'] == 'grandad':
                    h = BA.real_huss(i, [0.86, 0.88, 0.85][i % 3])
                else:
                    h = BA.real_huss(i)
                th = t + onsets[i]
                if b.get('space'):   # cinematic: the shout rings out in a space ("spaceWet" sets how much)
                    h = RL.voice_in_space(h, b['space'], b.get('spaceWet'))
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
                av = a
                if b.get('echo'):   # [delay_s, gain]: a faint doubled copy of the voice (an "other me" speaking along)
                    ed, eg = b['echo']; k = int(ed * SR)
                    av = np.zeros(len(a) + k, np.float32); av[:len(a)] += a; av[k:] += eg * a
                voice_track.append((t, RL.voice_in_space(av, b['space']) if b.get('space') else av))
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
    subs = []   # on-screen subtitles for lines that are not narration (radio/phone voices): {t0, t1, text, style, beat}
    cine_sfx = False
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
            elif typ == 'boom':
                put(S.vine_boom(), at, g)
            elif typ == 'scratch':
                put(S.record_scratch(seed=int(at * 10)), at, g)
            elif typ == 'ding':
                put(S.ding(), at, g)
            elif typ == 'pop':
                put(S.pop(seed=int(at * 10)), at, g)
            elif typ == 'thunder':
                put(S.thunder(seed=int(at * 10)), at, g)
            elif typ == 'siren':
                put(S.siren(fx.get('dur', 2.6)), at, g)
            elif typ == 'static':
                put(S.static_burst(fx.get('dur', 0.8), seed=int(at * 10)), at, g)
            elif typ == 'rumble':
                put(S.rumble(fx.get('dur', 2.0), seed=int(at * 10)), at, g)
            elif typ == 'airhorn':
                put(S.airhorn(), at, g)
            elif typ == 'dundun':
                put(S.dun_dun(), at, g)
            elif typ == 'sting':
                put(S.sting(), at, g)
            elif typ == 'wahwah':
                put(S.bruh_drop(), at, g)
            elif typ == 'whistle':
                put(S.whistle_tune(), at, g)
            elif typ == 'windwhistle':
                put(S.wind_whistle(fx.get('dur', 2.5)), at, g)
            elif typ in RL.SFX:   # cinematic foley / hits (audio/real.py)
                vx = None
                if typ == 'radio' and fx.get('text'):
                    if fx.get('voice'):
                        vx = BA.tts_voice(fx['text'], fx['voice'], fx.get('speed', 1.0), fx.get('lang', 'en-us'))
                    else:
                        vx = BA.tts(fx['text'], fx.get('speaker', 'narr'))
                    vx = BA.trim(BA.up(vx))
                x = RL.sfx(typ, fx, seed=RL.seed_of(typ, round(at, 3)), voice=vx, space_name=b0.get('space'))
                if fx.get('align') == 'peak':
                    at -= RL.peak_time(typ, fx)
                if vx is not None:
                    v0 = at + RL.RADIO_VOICE_AT
                    subs.append({'t0': round(v0, 3), 't1': round(v0 + len(vx) / SR, 3), 'text': fx['text'], 'style': fx.get('sub', 'radio'), 'beat': b0['id']})
                put(x, at, g, fx.get('pan', 0.5))
                cine_sfx = True
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
    bedcfg = BED.enabled(script.get('bed'))
    if bedcfg:   # the sampled bed replaces the procedural music and follows the same modes
        bm = BED.modes(SR, int(N), bedcfg['path'], bedcfg['gain'], bedcfg['offset'])
        nb, gnb = bm.pop('night_bed')
        gains = {**bm, 'night': (amb[:N] + nb * gnb, 1.0)}
    gains['spooky'] = (S.spooky_drone(duration + 1)[:N] + (gains['night'][0][:N] if gains['night'][0].ndim == 2 else np.stack([gains['night'][0][:N]] * 2, 1)) * 0.25, 1.0)
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
        if not bedcfg and b['kind'] == 'huss' and b['speaker'] in ('me', 'narr', 'grandad', 'pigeon') and b.get('gate', True):
            t0, t1 = b['words'][0]['start'] - 0.12, b['words'][-1]['end'] + 0.12
            gate *= 1 - np.clip(np.minimum((tt - t0) / 0.04 + 1, (t1 - tt) / 0.04 + 1), 0, 1)
            hold = S.organ((69, 76, 81, 84), dur=t1 - t0 + 0.6)
            hold[: int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))
            put(np.stack([hold, hold], 1), t0, 0.3)
    music *= gate[:, None]

    bed = np.zeros((N, 2), np.float32)   # (the bed now lives inside `music`; stem kept for compatibility)

    # cinematic layer (audio/real.py): ambience beds + cinematic score cues, both sidechain-ducked under the narration.
    # Only when the script uses it — older episodes never enter this block and keep their exact mix.
    amb_segs = []
    for b0 in beats:
        if 'amb' in b0:
            t0 = 0.0 if not amb_segs and beat[b0['id']]['start'] < 0.6 else max(0.0, beat[b0['id']]['start'] - 0.1)
            if amb_segs and amb_segs[-1][1] == b0['amb']:
                continue
            amb_segs.append((t0, b0['amb'], float(b0.get('ambFade', 1.5))))
    cine_music = any(md in RL.SCORE for _, md in seg)
    cine = bool(amb_segs) or cine_music or cine_sfx or script.get('master') == 'cine'
    ambst = None
    if cine:
        act = RL.sidechain(voice)
        vl = RL.loudness(np.stack([voice, voice], 1))
        if cine_music:
            ssegs = [(t0, seg[k + 1][0] if k + 1 < len(seg) else duration, md, seg[k + 1][1] if k + 1 < len(seg) else None)
                     for k, (t0, md) in enumerate(seg)]
            music = music + RL.score_track(ssegs, N, act, vl)
        if amb_segs:
            asegs = [(t0, amb_segs[k + 1][0] if k + 1 < len(amb_segs) else duration, spec, fd) for k, (t0, spec, fd) in enumerate(amb_segs)]
            ambst = RL.amb_track(asegs, N, act, vl)
        sfx = RL.duck(sfx, act, 4.0, 2.0).astype(np.float32)   # effects stay under the words (hits in the gaps keep their punch)

    dipcfg = huss_dip_cfg(script) if bedcfg else None
    if dipcfg:   # v2 HUSS dip: the music bus ducks ~6 dB for 0.3 s at every HUSS of me / pip (beat "dip": false skips)
        dips = [th for (th, bid, i, spk) in huss_events if spk in dipcfg['speakers'] and beat[bid].get('dip', True)]
        music = music * huss_dip_gain(N, dips, dipcfg)[:, None]
        print('huss dip', round(dipcfg['db'], 1), 'dB at', [round(x, 3) for x in dips])

    if cine:
        mix = music + bed + sfx + np.stack([voice, voice], 1) + (ambst if ambst is not None else 0)
    else:
        mix = np.tanh((music + bed + sfx + np.stack([voice, voice], 1)) * 1.1) / 1.1
    os.makedirs(os.path.join(outdir, 'stems'), exist_ok=True)
    for name, arr in (('voice', voice), ('music', music), ('bed', bed), ('sfx', sfx)):
        sf.write(os.path.join(outdir, f'stems/{name}.wav'), arr, SR)
    out = os.path.join(outdir, 'mix.wav')
    raw = os.path.join(outdir, 'stems/mix_raw.wav')
    if cine:   # BS.1770 loudness + true-peak limiter (audio/real.py), no soft-clip: cinematic dynamics survive
        if ambst is not None:
            sf.write(os.path.join(outdir, 'stems/amb.wav'), ambst, SR)
        sf.write(raw, mix, SR, subtype='FLOAT')
        mm, rep = RL.master(mix, script.get('lufs', -16.0), script.get('ceiling', -1.5))
        sf.write(out, mm, SR, subtype='PCM_16')
        print('master', rep)
    else:
        sf.write(raw, mix, SR)
        m = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                           capture_output=True, text=True).stderr
        js = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
        af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
              f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le', out], check=True)

    words = [{**w, 'beat': b['id'], 'kind': b['kind'], 'speaker': b['speaker'], 'i': i} for b in tl_beats for i, w in enumerate(b['words'])]
    tl = {'fps': 30, 'duration': duration, 'audio': f'episodes/{ep}/mix.wav', 'beats': tl_beats, 'words': words,
          'music': [{'t': round(t0, 3), 'mode': m} for t0, m in seg], 'markers': markers, 'title': script.get('title')}
    if amb_segs:
        tl['amb'] = [{'t': round(t0, 3), 'bed': spec} for t0, spec, _ in amb_segs]
    if subs:
        tl['subs'] = subs
    json.dump(tl, open(os.path.join(outdir, 'timeline.json'), 'w'), indent=1)
    print('duration', duration, 'words', len(words), 'markers', markers)


if __name__ == '__main__':
    args = sys.argv[1:]
    od = None
    if '--out' in args:
        k = args.index('--out'); od = args[k + 1]; del args[k:k + 2]
    main(args[0] if args else 'ep2', od)
