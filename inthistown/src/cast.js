// The cast of "In This Town — Chess".
//
// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │  YOUR AVATAR: edit `ME` to look like you, then re-render (node render.mjs).                   │
// │  skin / hair.style ('short' 'fade' 'curly' 'spiky' 'bun' 'long' 'afro' 'bald') / hair.color   │
// │  top.style ('hoodie' 'tee' 'cardigan' 'suit' 'dress') / top.color / top.emblem ('knight' …)   │
// │  bottom.color / shoes / accessories ('headphones' 'glasses' 'sunglasses' 'cap' 'chain' …)     │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘
import { rng } from './lib/util.js';

export const ME = {
  id: 'me',
  skin: '#f1c7a1',
  hair: { style: 'fade', color: '#2b1d14' },
  top: { style: 'hoodie', color: '#1d1d22', accent: '#ffffff', emblem: 'knight' },
  bottom: { style: 'pants', color: '#55575e' },
  shoes: '#f2f2f2',
  accessories: ['headphones'],
  scale: 1.0,
};

export const MAIN = {
  me: ME,
  marcus: { id: 'marcus', skin: '#8d5a3b', hair: { style: 'curly', color: '#1a120c' },
    top: { style: 'tee', color: '#ff7a2f', accent: '#ffffff', emblem: 'stripe' }, bottom: { style: 'shorts', color: '#2f4d8a' },
    shoes: '#ffffff', accessories: ['chain'], scale: 1.0 },
  brenda: { id: 'brenda', skin: '#f4d0b5', hair: { style: 'bun', color: '#c0392b' },
    top: { style: 'dress', color: '#8a5cff', accent: '#ffd23f', emblem: 'heart' }, bottom: { style: 'skirt', color: '#8a5cff' },
    shoes: '#ff4fa3', accessories: ['sunglasses'], scale: 0.97 },
  grandad: { id: 'grandad', skin: '#e9b99a', hair: { style: 'grandpa', color: '#e8e8e8' },
    top: { style: 'cardigan', color: '#6b8e5a', accent: '#f3e3a5' }, bottom: { style: 'pants', color: '#7a6a58' },
    shoes: '#4a3b2f', accessories: ['glasses', 'mustache'], scale: 0.97 },
  mayor: { id: 'mayor', skin: '#f0c8a8', hair: { style: 'short', color: '#5a4a3a' },
    top: { style: 'suit', color: '#7a1f2b', accent: '#ffd23f' }, bottom: { style: 'pants', color: '#2a1a1f' },
    shoes: '#1a1a1a', accessories: ['topHat', 'sash', 'mustache', 'bowtie'], build: 1.2, scale: 1.05 },
  heckler: { id: 'heckler', skin: '#f7d6b8', hair: { style: 'spiky', color: '#f0c419' },
    top: { style: 'tee', color: '#3ee0c8', accent: '#ffffff', emblem: 'star' }, bottom: { style: 'shorts', color: '#ff4fa3' },
    shoes: '#ffffff', accessories: ['partyHat'], partyHatColor: '#ffd23f', scale: 0.92 },
  pigeon: { creature: 'pigeon', id: 'pigeon' },
  cat: { creature: 'cat', id: 'cat' },
};

// Party-goers: deterministic random specs.
const SKINS = ['#f1c7a1', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#f4d0b5', '#a86b4a', '#6b4226'];
const HAIRS = ['short', 'curly', 'spiky', 'bun', 'long', 'afro', 'fade', 'short', 'long'];
const HAIRC = ['#1a120c', '#3b2416', '#7a4a24', '#c0392b', '#e8c46a', '#2b1d14', '#d97b2b', '#111111'];
const TOPS = ['tee', 'tee', 'hoodie', 'dress', 'tee', 'cardigan'];
const BRIGHT = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff', '#5bd65b', '#ff5a5a', '#f2f2f2', '#ffa6d1'];
const BOTTOMS = ['#2f4d8a', '#3a3d46', '#55575e', '#7a6a58', '#1d1d22', '#4a7a4a'];
const EMB = [null, 'star', 'stripe', 'heart', 'number', null];
const HATC = ['#ff4fa3', '#ffd23f', '#3ee0c8', '#8a5cff', '#ff7a2f', '#4fb3ff'];

export function extraSpecs(n, seed = 11) {
  const r = rng(seed);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const out = {};
  for (let i = 0; i < n; i++) {
    const id = `x${String(i).padStart(2, '0')}`;
    const top = pick(TOPS);
    out[id] = {
      id, skin: pick(SKINS), hair: { style: pick(HAIRS), color: pick(HAIRC) },
      top: { style: top, color: pick(BRIGHT), accent: pick(BRIGHT), emblem: pick(EMB) },
      bottom: { style: top === 'dress' ? 'skirt' : (r() < 0.4 ? 'shorts' : 'pants'), color: pick(BOTTOMS) },
      shoes: pick(['#f2f2f2', '#1d1d22', '#ff4fa3', '#4fb3ff']),
      accessories: r() < 0.25 ? [pick(['sunglasses', 'glasses', 'cap', 'chain', 'headphones'])] : [],
      partyHatColor: pick(HATC),
      scale: 0.86 + r() * 0.16, build: 0.92 + r() * 0.18,
    };
  }
  return out;
}

export const EXTRAS = extraSpecs(18);
export const EXTRA_IDS = Object.keys(EXTRAS);
