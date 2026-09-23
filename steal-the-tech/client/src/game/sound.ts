// Tiny synthesized sound engine (WebAudio) — every effect is generated in code,
// no audio files. `play(name)` is the hook the whole game calls.
import type { Rarity } from '../backend/types';

type SoundName =
  | 'click' | 'coin' | 'cash' | 'error' | 'open' | 'shake' | 'whoosh' | 'levelup' | 'notify'
  | 'alarm' | 'steal_ok' | 'steal_fail' | 'defend' | 'trade' | 'buy' | 'tick' | 'step'
  | 'zap' | 'grab' | 'jump' | 'land' | 'laser' | 'spawn' | 'hype' | 'pop' | 'tag' | 'run' | 'mutation';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.6;
let muted = false;
let musicOn = false;
let musicTimer: number | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (master) master.gain.value = muted ? 0 : volume;
}
export function setMuted(m: boolean) {
  muted = m;
  if (master) master.gain.value = muted ? 0 : volume;
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; delay?: number; slide?: number; attack?: number } = {}) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + (opts.delay || 0);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * opts.slide), t0 + dur);
  const peak = opts.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + (opts.attack ?? 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(dur: number, opts: { gain?: number; delay?: number; freq?: number } = {}) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + (opts.delay || 0);
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = opts.freq || 1200;
  const g = c.createGain();
  g.gain.value = opts.gain ?? 0.15;
  s.connect(f);
  f.connect(g);
  g.connect(master);
  s.start(t0);
}

const chord = (notes: number[], dur: number, type: OscillatorType = 'triangle', gain = 0.12, spread = 0.06) =>
  notes.forEach((n, i) => tone(n, dur, { type, gain, delay: i * spread }));

export function play(name: SoundName) {
  switch (name) {
    case 'click': return tone(660, 0.06, { type: 'square', gain: 0.05 });
    case 'tick': return tone(1200, 0.03, { type: 'square', gain: 0.03 });
    case 'step': return noise(0.04, { gain: 0.03, freq: 400 });
    case 'coin': tone(988, 0.08, { type: 'square', gain: 0.06 }); return tone(1319, 0.18, { type: 'square', gain: 0.06, delay: 0.07 });
    case 'cash': return chord([784, 988, 1319, 1568], 0.25, 'square', 0.05, 0.05);
    case 'error': tone(220, 0.15, { type: 'sawtooth', gain: 0.08 }); return tone(160, 0.2, { type: 'sawtooth', gain: 0.08, delay: 0.12 });
    case 'open': noise(0.4, { gain: 0.2, freq: 3000 }); return tone(220, 0.5, { type: 'sawtooth', gain: 0.1, slide: 4 });
    case 'shake': return noise(0.12, { gain: 0.12, freq: 600 });
    case 'whoosh': return noise(0.35, { gain: 0.12, freq: 2200 });
    case 'levelup': return chord([523, 659, 784, 1047, 1319], 0.5, 'triangle', 0.12, 0.08);
    case 'notify': tone(880, 0.1, { gain: 0.08 }); return tone(1175, 0.15, { gain: 0.08, delay: 0.1 });
    case 'alarm':
      for (let i = 0; i < 4; i++) {
        tone(880, 0.22, { type: 'square', gain: 0.07, delay: i * 0.45 });
        tone(660, 0.22, { type: 'square', gain: 0.07, delay: i * 0.45 + 0.22 });
      }
      return;
    case 'steal_ok': return chord([392, 523, 659, 784, 1047], 0.4, 'square', 0.07, 0.07);
    case 'steal_fail': tone(300, 0.3, { type: 'sawtooth', gain: 0.1, slide: 0.4 }); return noise(0.3, { gain: 0.1, freq: 300, delay: 0.1 });
    case 'defend': return chord([330, 440, 660], 0.3, 'square', 0.08, 0.04);
    case 'trade': return chord([523, 784, 1047], 0.3, 'triangle', 0.1, 0.1);
    case 'buy': return chord([659, 880], 0.2, 'square', 0.06, 0.06);
    case 'zap':
      noise(0.5, { gain: 0.22, freq: 4200 });
      tone(1400, 0.35, { type: 'sawtooth', gain: 0.09, slide: 0.15 });
      return tone(90, 0.4, { type: 'square', gain: 0.1, delay: 0.05 });
    case 'grab': tone(300, 0.12, { type: 'square', gain: 0.06, slide: 2 }); return noise(0.1, { gain: 0.08, freq: 900 });
    case 'jump': return tone(330, 0.16, { type: 'square', gain: 0.05, slide: 2.2 });
    case 'land': return noise(0.08, { gain: 0.06, freq: 300 });
    case 'laser':
      for (let i = 0; i < 3; i++) tone(1600 - i * 300, 0.18, { type: 'sawtooth', gain: 0.05, slide: 0.3, delay: i * 0.08 });
      return;
    case 'spawn': return chord([784, 1047, 1319], 0.22, 'triangle', 0.08, 0.05);
    case 'hype':
      chord([392, 523, 659, 784, 1047, 1319], 0.6, 'sawtooth', 0.06, 0.06);
      return noise(0.9, { gain: 0.07, freq: 6000, delay: 0.1 });
    case 'pop': return tone(900, 0.07, { type: 'triangle', gain: 0.08, slide: 1.8 });
    case 'tag': chord([220, 440], 0.15, 'square', 0.12, 0.02); return noise(0.2, { gain: 0.2, freq: 800 });
    case 'run': return chord([523, 659, 784], 0.14, 'square', 0.06, 0.03);
    case 'mutation': chord([659, 831, 988, 1319, 1661], 0.45, 'triangle', 0.09, 0.05); return noise(0.6, { gain: 0.06, freq: 7000, delay: 0.1 });
  }
}

/** Cha-ching whose pitch climbs with your collect combo. */
export function coinCombo(n: number) {
  const k = Math.min(12, n);
  const f = 880 * Math.pow(2, k / 12);
  tone(f, 0.07, { type: 'square', gain: 0.06 });
  tone(f * 1.335, 0.2, { type: 'square', gain: 0.06, delay: 0.06 });
  if (n >= 3) tone(f * 2, 0.12, { type: 'triangle', gain: 0.04, delay: 0.12 });
}

// Rarity-scaled reveal fanfare.
export function reveal(r: Rarity) {
  const base: Record<Rarity, number[]> = {
    common: [523],
    uncommon: [523, 659],
    rare: [523, 659, 784],
    epic: [523, 659, 784, 988],
    legendary: [523, 659, 784, 1047, 1319],
    mythic: [440, 554, 659, 880, 1109, 1319],
    ultra: [392, 494, 587, 784, 988, 1175, 1568],
    limited: [440, 554, 659, 880, 1109, 1319],
    secret: [262, 330, 392, 523, 659, 784, 1047, 1319, 1568],
  };
  const notes = base[r] || base.common;
  const tier = notes.length;
  chord(notes, 0.35 + tier * 0.08, tier > 5 ? 'sawtooth' : 'triangle', tier > 5 ? 0.07 : 0.11, 0.07);
  if (tier >= 6) noise(1.2, { gain: 0.08, freq: 5000, delay: 0.2 });
  if (r === 'secret') {
    tone(65, 2.5, { type: 'sine', gain: 0.35, attack: 0.3 });
    tone(98, 2.5, { type: 'sine', gain: 0.2, attack: 0.5, delay: 0.3 });
  }
}

// Optional ambient synth loop.
export function setMusic(on: boolean) {
  musicOn = on;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (!on) return;
  const seq = [110, 110, 131, 147, 110, 165, 147, 131];
  let i = 0;
  musicTimer = window.setInterval(() => {
    if (!musicOn || muted) return;
    const n = seq[i % seq.length];
    tone(n, 0.5, { type: 'triangle', gain: 0.035 });
    if (i % 2 === 0) tone(n * 4, 0.12, { type: 'square', gain: 0.012, delay: 0.25 });
    i++;
  }, 420);
}

export function unlockAudio() {
  ac();
}
