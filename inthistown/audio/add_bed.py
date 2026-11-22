"""Re-mix a finished episode from its stems with the sampled background bed underneath.

  python3 audio/add_bed.py <stems_dir> <out_mix.wav> [--bed audio/beds/reference_bed.wav]
                           [--gain 0.3] [--duck 0.4] [--music-gain 0.6] [--offset 0]

Uses the same mix law as build_audio.py / build_episode.py (sum → tanh soft clip → 2-pass loudnorm to −14 LUFS),
so the voice, HUSS timing and SFX are untouched; only the bed is added (and the procedural music turned down).
The bed loops under the whole episode — HUSS runs included — and dips under the voice by `duck`.
"""
import argparse, json, os, subprocess
import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def voice_env(voice, sr):
    win = int(0.05 * sr)
    v = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode='same'))
    v = np.clip(v / 0.08, 0, 1)
    a = np.exp(-1 / (0.18 * sr))
    return signal.lfilter([1 - a], [1, -a], v).astype(np.float32)


def load_bed(path, sr, n, offset=0.0):
    b, bsr = sf.read(path, dtype='float32', always_2d=True)
    if b.shape[1] == 1: b = np.repeat(b, 2, 1)
    if bsr != sr: b = signal.resample_poly(b, sr, bsr, axis=0).astype(np.float32)
    reps = int(np.ceil(n / len(b))) + 1
    off = int(offset * sr) % len(b)
    out = np.tile(b, (reps, 1))[off: off + n].copy()
    fi, fo = min(n, int(0.25 * sr)), min(n, int(0.6 * sr))
    out[:fi] *= np.linspace(0, 1, fi)[:, None]; out[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return out


def loudnorm(raw, out, sr):
    m = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    js = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af', af, '-ar', str(sr), '-c:a', 'pcm_s16le', out], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stems'); ap.add_argument('out')
    ap.add_argument('--bed', default=os.path.join(ROOT, 'audio/beds/reference_bed.wav'))
    ap.add_argument('--gain', type=float, default=0.3); ap.add_argument('--duck', type=float, default=0.4)
    ap.add_argument('--music-gain', type=float, default=0.6); ap.add_argument('--offset', type=float, default=0.0)
    a = ap.parse_args()
    voice, sr = sf.read(os.path.join(a.stems, 'voice.wav'), dtype='float32')
    if voice.ndim > 1: voice = voice.mean(1)
    music, _ = sf.read(os.path.join(a.stems, 'music.wav'), dtype='float32', always_2d=True)
    sfx, _ = sf.read(os.path.join(a.stems, 'sfx.wav'), dtype='float32', always_2d=True)
    n = min(len(voice), len(music), len(sfx))
    voice, music, sfx = voice[:n], music[:n], sfx[:n]
    bed = load_bed(a.bed, sr, n, a.offset) * (a.gain * (1 - a.duck * np.clip(voice_env(voice, sr) * 3, 0, 1)))[:, None]
    mix = np.tanh((music * a.music_gain + bed + sfx + np.stack([voice, voice], 1)) * 1.1) / 1.1
    sf.write(os.path.join(a.stems, 'bed.wav'), bed, sr)
    raw = os.path.join(a.stems, 'mix_bed_raw.wav'); sf.write(raw, mix, sr)
    loudnorm(raw, a.out, sr)
    print(f'{a.out}: {n / sr:.2f}s  bed gain {a.gain} duck {a.duck} music×{a.music_gain}')


if __name__ == '__main__':
    main()
