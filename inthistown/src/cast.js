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

// v2 narrator (style bible v2): the same boy with the v2 TOY FINISH (round head, bigger bolder face with sclera, 1024 px
// face, toy-plastic sheen, ball joints) and HEADPHONES ON THE HEAD ('headphonesOn'; pose param cupBack: 'L' | 'R' pushes
// one cup back). Hair lifted to dark brown so the rim light gives it shape. Same id 'me'. MAIN.me is untouched.
export const MAIN_V2 = {
  me: { ...ME, hair: { style: 'fade', color: '#3a2a20' }, accessories: ['headphonesOn'], v2: true },
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

// ════════════════════════════════════════════════════════════════════════════════════════════════════
//  v2 FAMILY CAST (style bible v2 §8 + upgrade 9; ep30 'cast').  Additive: nothing above changed.
// ════════════════════════════════════════════════════════════════════════════════════════════════════
//  FAMILY        = { mom, dad, pip }            day outfits
//  FAMILY_NIGHT  = { mom, dad, pip }            night outfits (same ids as the day versions → one character each;
//                                               use different cast keys if both outfits appear in one film, e.g.
//                                               cast: { mom: FAMILY.mom, momNight: FAMILY_NIGHT.mom })
//  familySpec(who, outfit = 'day' | 'night', overrides = {}) → a fresh deep-merged spec (safe to mutate)
//  COUSINS       = [7 specs]  child rig (scale 0.7) in seven colourways, ids cousin1…cousin7
//  NEIGHBOUR_MOM               the Mom rig recoloured (their mom on the path)
//  BAKER                       bun, blue tee, white bib apron (accessory 'apron')
//  FAMILY_IDS = ['mom', 'dad', 'pip']
//
//  MAIN_V2.me   the narrator with the v2 toy finish + headphones ON the head (see above MAIN). Use it in every v2 film.
//  v2 TOY FINISH: every FAMILY / FAMILY_NIGHT spec carries v2: true (characters.js: head.round 0.16, face { scale 1.2,
//    stroke 1.3, res 1024, sclera }, finish { roughness 0.6, hair 0.5 }, joints 'ball', thin glasses temples, smoother
//    puffs). Hair colours are dark BROWN (#4a3324 Pip, #3a2a20 Dad/me, #5a3424 Mom) so rim light models them.
//  IDS AND CHAT BUBBLES (trap): a timeline bubble { who: 'pip' } resolves ctx.cast['pip']. In ep30 most shots are at
//    NIGHT, so give the NIGHT outfits the plain ids and re-id the day ones:
//      cast: { me: MAIN_V2.me, pip: FAMILY_NIGHT.pip, mom: FAMILY_NIGHT.mom, dad: FAMILY_NIGHT.dad,
//              pipDay: familySpec('pip', 'day', { id: 'pipDay' }), momDay: …, dadDay: … }
//    (or export bubbleAnchor(ctx, who) from the shots module mapping 'pip' to whichever Pip is in the shot — see
//    src/kits/showcase.js).
//  Silhouettes (they must read backlit, e.g. Mom in the fridge light):
//    Mom  scale 1.06, slim (build 0.95), TALL ROUND BUN ('tallBun', ~0.45 m above the head) — day: teal cardigan,
//         plum A-line skirt, teal flats; night: long CORAL ROBE (#e8837a; top style 'robe': flared skirt to mid-shin,
//         shawl collar, cream tie belt) — saturated so it never reads beige-on-beige against the wainscot, pink slippers.
//    Dad  scale 1.06, BROAD (build 1.32), beard + glasses — day: mustard knit 'jumper', dark jeans, brown 'boots';
//         night: blue 'pyjamas' with pale vertical stripes (top + bottom), slippers.
//    Pip  CHILD scale 0.7, two round PUFF buns ('puffs') — day: yellow star tee, blue trousers, yellow 'wellies';
//         night: pale-yellow 'pyjamas' with orange stars, pink slippers, and a lilac quilted 'blanket' she drags
//         (accessory 'blanket'; shape it per frame with pose params blanket: 'drag' | 'clutch', blanketHand 'L'|'R').
//    All share the narrator's skin tone (#f1c7a1). MAIN.me is untouched.
//  New spec fields used here (all handled in src/characters.js, additive): hair.style 'puffs' | 'tallBun',
//    hair.tie (band colour); top.style 'jumper' | 'pyjamas' | 'robe'; top.pattern 'stripes' | 'stars',
//    top.patternColor, top.piping, top.belt (robe); bottom.style 'pyjamas', bottom.pattern, bottom.patternColor,
//    bottom.piping; shoeStyle 'wellies' | 'boots' | 'slippers'; blanketColor; apronColor;
//    accessories 'blanket', 'apron'.
const FAMILY_SKIN = '#f1c7a1';
const FAMILY_DEFS = {
  mom: {
    day: {
      id: 'mom', skin: FAMILY_SKIN, hair: { style: 'tallBun', color: '#5a3424', tie: '#f2c14e' },
      top: { style: 'cardigan', color: '#1f8f8a', accent: '#f3ecd8' }, bottom: { style: 'skirt', color: '#6b3f5e' },
      shoes: '#1f8f8a', accessories: [], scale: 1.06, build: 0.95, v2: true,
    },
    night: {
      id: 'mom', skin: FAMILY_SKIN, hair: { style: 'tallBun', color: '#5a3424', tie: '#f2c14e' },
      top: { style: 'robe', color: '#e8837a', accent: '#f3e6cc', belt: '#f3e6cc' }, bottom: { style: 'skirt', color: '#e8837a' },
      shoes: '#e7a6b5', shoeStyle: 'slippers', accessories: [], scale: 1.06, build: 0.95, v2: true,
    },
  },
  dad: {
    day: {
      id: 'dad', skin: FAMILY_SKIN, hair: { style: 'short', color: '#3a2a20' },
      top: { style: 'jumper', color: '#d9a62e', accent: '#ffffff' }, bottom: { style: 'pants', color: '#3c4a63' },
      shoes: '#6b4428', shoeStyle: 'boots', accessories: ['beard', 'glasses'], scale: 1.06, build: 1.32, v2: true,
    },
    night: {
      id: 'dad', skin: FAMILY_SKIN, hair: { style: 'short', color: '#3a2a20' },
      top: { style: 'pyjamas', color: '#3f6fb8', accent: '#ffffff', pattern: 'stripes', patternColor: '#dce8f7', piping: '#dce8f7' },
      bottom: { style: 'pyjamas', color: '#3f6fb8', pattern: 'stripes', patternColor: '#dce8f7' },
      shoes: '#4a3b35', shoeStyle: 'slippers', accessories: ['beard', 'glasses'], scale: 1.06, build: 1.32, v2: true,
    },
  },
  pip: {
    day: {
      id: 'pip', skin: FAMILY_SKIN, hair: { style: 'puffs', color: '#4a3324', tie: '#ff5fa2' },
      top: { style: 'tee', color: '#ffd23f', accent: '#ffffff', emblem: 'star' }, bottom: { style: 'pants', color: '#4f7cc9' },
      shoes: '#ffd23f', shoeStyle: 'wellies', accessories: [], scale: 0.7, v2: true,
    },
    night: {
      id: 'pip', skin: FAMILY_SKIN, hair: { style: 'puffs', color: '#4a3324', tie: '#ff5fa2' },
      top: { style: 'pyjamas', color: '#ffe680', accent: '#ffffff', pattern: 'stars', patternColor: '#ff8c1a', piping: '#ff8c1a' },
      bottom: { style: 'pyjamas', color: '#ffe680', pattern: 'stars', patternColor: '#ff8c1a' },
      shoes: '#ff9fc4', shoeStyle: 'slippers', accessories: ['blanket'], blanketColor: '#9b8bd6', scale: 0.7, v2: true,
    },
  },
};
function cloneSpec(o) { return JSON.parse(JSON.stringify(o)); }
function mergeSpec(a, b) {
  const o = { ...a };
  for (const k of Object.keys(b || {})) {
    const v = b[k];
    o[k] = (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) ? mergeSpec(a[k], v) : v;
  }
  return o;
}
export function familySpec(who, outfit = 'day', overrides = {}) {
  const d = FAMILY_DEFS[who];
  if (!d) throw new Error(`familySpec: unknown family member '${who}' (mom, dad, pip)`);
  const base = d[outfit] || d.day;
  return mergeSpec(cloneSpec(base), cloneSpec(overrides));
}
export const FAMILY_IDS = ['mom', 'dad', 'pip'];
export const FAMILY = { mom: familySpec('mom', 'day'), dad: familySpec('dad', 'day'), pip: familySpec('pip', 'day') };
export const FAMILY_NIGHT = { mom: familySpec('mom', 'night'), dad: familySpec('dad', 'night'), pip: familySpec('pip', 'night') };

const COUSIN_LOOKS = [
  ['puffs', '#1a120c', '#ff4fa3', '#2f4d8a'], ['curly', '#1a120c', '#3ee0c8', '#3a3d46'], ['spiky', '#3b2416', '#ff7a2f', '#2f4d8a'],
  ['bun', '#1a120c', '#8a5cff', '#55575e'], ['afro', '#111111', '#5bd65b', '#3a3d46'], ['short', '#3b2416', '#4fb3ff', '#7a6a58'],
  ['fade', '#1a120c', '#ff5a5a', '#2f4d8a'],
];
export const COUSINS = COUSIN_LOOKS.map(([hair, hc, tc, bc], i) => ({
  id: `cousin${i + 1}`, skin: '#d9a074', hair: { style: hair, color: hc, tie: '#ffd23f' },
  top: { style: 'tee', color: tc, accent: '#ffffff', emblem: [null, 'star', 'stripe', 'heart', null, 'star', 'stripe'][i] },
  bottom: { style: i % 3 === 1 ? 'shorts' : 'pants', color: bc }, shoes: ['#f2f2f2', '#ffd23f', '#f2f2f2', '#ff4fa3', '#4fb3ff', '#f2f2f2', '#1d1d22'][i],
  accessories: [], scale: 0.66 + 0.02 * (i % 3), build: 0.95 + 0.03 * (i % 2),
}));
export const NEIGHBOUR_MOM = {
  id: 'neighbourMom', skin: '#d9a074', hair: { style: 'tallBun', color: '#1a120c', tie: '#ff4fa3' },
  top: { style: 'cardigan', color: '#d6496b', accent: '#f3ecd8' }, bottom: { style: 'skirt', color: '#2f3e6b' },
  shoes: '#2f3e6b', accessories: [], scale: 1.04, build: 0.95,
};
export const BAKER = {
  id: 'baker', skin: '#e9b99a', hair: { style: 'bun', color: '#bdb3a6' },
  top: { style: 'tee', color: '#7fa8d6', accent: '#ffffff' }, bottom: { style: 'pants', color: '#5a5048' },
  shoes: '#5a4030', accessories: ['apron', 'glasses'], apronColor: '#f4f1ea', scale: 1.0, build: 1.1,
};
