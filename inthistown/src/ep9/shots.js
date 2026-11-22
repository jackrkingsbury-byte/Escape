// In This Town — Episode 9: "The Heist".  The masked burglar narrates; he has all the beds.
// Film contract: SPEC.md §8.  Timeline: episodes/ep9/timeline.json (audio/build_episode.py ep9).
import * as THREE from 'three';
import { buildTown, buildRoom } from '../world.js';
import { MAIN, EXTRAS, EXTRA_IDS } from '../cast.js';
import { crowdGrid, animateCrowd, rel, yawOf } from '../direct.js';
import { clamp, ease, hash, lerp } from '../lib/util.js';
import { quoteCard, top10Card } from '../cards.js';
import { makeBalloon, makePartyHat, makeTable, makeCake } from '../props.js';
import { init as initEp1, V, headPos, frame, frameAt, lastBefore, partyTown } from '../shots.js';
import { makeDJDecks, makeMicStand, makeTopHatProp, makeToupee, TOPHAT_MATCH_SCALE } from '../ep2/props2.js';
import { makeToaster, makeTrophy, makeSign, makeBriefcase, makeSack, setProps3EnvIntensity } from '../ep3/props3.js';
import { dressBurglar, makeCrowbar, makeFlashlight, makeOffice, makeTV, makeJewelBox, makeCorkboard, makeDoormat,
  makeCatFlapDoor, makeHeart, makeZzz, makePuff, makeRing, makeBeds, makeDuvet, makeFoamHeap, makePillowHeap,
  makeLimboPillow, makePapers } from './props9.js';
import { makeCharacter } from '../characters.js';

// ───────────────────────────────────────────────────────────────────────────────────────── cast
const BURGLAR = { id: 'burglar', skin: '#c68642', hair: { style: 'bald', color: '#c68642' }, top: { style: 'tee', color: '#1d1d22', accent: '#1d1d22' },
  bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#111111', accessories: [], scale: 0.97 };
export const cast = {
  burglar: () => dressBurglar(makeCharacter(BURGLAR)),
  cat: MAIN.cat, mayor: MAIN.mayor, grandad: MAIN.grandad, marcus: MAIN.marcus, brenda: MAIN.brenda, heckler: MAIN.heckler,
  gerald: { id: 'gerald', skin: '#e9b99a', hair: { style: 'bald', color: '#e9b99a' }, top: { style: 'cardigan', color: '#3ee0c8', accent: '#ffffff' },
    bottom: { style: 'pants', color: '#2f4d8a' }, shoes: '#4a3b2f', accessories: ['beard', 'sunglasses', 'headphones'], scale: 0.92 },
  lawyer: { id: 'lawyer', skin: '#e0ac69', hair: { style: 'short', color: '#cfcfcf' }, top: { style: 'suit', color: '#5a5f6b', accent: '#ffffff' },
    bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#111111', accessories: ['glasses', 'bowtie'], scale: 1.0 },
  ...EXTRAS,
};
export const lazySets = true;
export const sets = {
  town: () => buildTown({ seed: 9, banner: ['THE NEVER', 'ENDING', 'PARTY'] }),
  roomB: () => buildRoom({ variant: 'brenda', window: 'dark', poster: 'none' }),
  roomM: () => buildRoom({ variant: 'marcus', window: 'dark' }),
  roomG: () => buildRoom({ variant: 'grandad', window: 'dark' }),
};

const TOWER_NAMES = ['HECKLER', 'CAT', 'VICAR', 'DJ', 'BOB', 'SUE', 'BRENDA', 'KIM', 'DAVE', 'RAJ', 'MARCUS', 'ANA', 'TOM', 'LIZ',
  'GRANDAD', 'MO', 'JO', 'PAT', 'LAWYER', 'PIGEON', 'TED', 'MAYOR'];
const NT = TOWER_NAMES.length, BED_H = 0.6;
const BED_SOFT = 6, BED_HARD = 10, BED_GRAN = 14, BED_TOP = NT - 1;
const NF = 21;   // beds on the plaza after the fall (the last one is the cat's)

export function init(ctx) {
  initEp1(ctx);
  const P = ctx.props;
  P.sack = makeSack(); P.bigSack = makeSack(); P.flungSack = makeSack();
  P.chimney = makeChimney();
  P.crowbar = makeCrowbar(); P.flash = makeFlashlight();
  P.office = makeOffice(); P.miniCase = makeBriefcase(); P.miniCase.scale.setScalar(0.42);
  P.tv = makeTV(); P.jewels = makeJewelBox(); P.trophy9 = makeTrophy(); P.toaster9 = makeToaster(); P.dresser = makeTable({ w: 2.3, d: 0.5 });
  P.cork = makeCorkboard(); P.mat = makeDoormat(); P.flapDoor = makeCatFlapDoor();
  P.hearts = [makeHeart(), makeHeart(), makeHeart()];
  P.pinkPane = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), new THREE.MeshStandardMaterial({ color: '#e9e3d6', emissive: '#ff4fa3', emissiveIntensity: 0, roughness: 0.5 }));
  P.zzz = Array.from({ length: 8 }, () => makeZzz(0.7));
  P.puff = makePuff({ color: '#d8cfc0', count: 22, radius: 1 }); P.soot = makePuff({ color: '#2a2622', count: 22, radius: 0.7, seed: 4 });
  P.ring = makeRing();
  P.tower = makeTower(); P.field = makeBeds(NF, { seed: 5 });
  P.duvet = makeDuvet('#ffd23f');
  P.foamPool = makeFoamHeap(7.2, 3.7, 1.1, 150);
  P.pillows = makePillowHeap(); P.limboPillow = makeLimboPillow(); P.toupee = makeToupee();
  P.papers = makePapers(); P.lawDesk = makeTable({ w: 1.1, d: 0.62 }); P.briefcase = makeBriefcase();
  P.decks = makeDJDecks(); P.mic = makeMicStand({ height: 1.5 });
  P.cakes = [makeCake({ frosting: '#ff8fc8' }), makeCake({ frosting: '#8fd3ff', candles: 3 }), makeCake({ frosting: '#ffe08a', candles: 7 })];
  P.partySign = makeSign({ lines: ['PARTY', 'THIS WAY ->'], w: 0.75, h: 0.48, color: '#ffd23f', stick: 0.6 });
  P.grandHat = makePartyHat('#ff4fa3'); P.handHat = makePartyHat('#ff4fa3');
  P.hatOverEyes = makeTopHatProp({ scale: TOPHAT_MATCH_SCALE * 1.05 });
  P.balloon9 = makeBalloon('#ff4fa3', { string: 0.6 });
}

function makeChimney() {
  const g = new THREE.Group();
  const brick = new THREE.MeshStandardMaterial({ color: '#9a5b48', roughness: 0.9 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.8, 0.75), brick); b.position.y = -0.9; b.castShadow = true; b.receiveShadow = true; g.add(b);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.14, 0.88), new THREE.MeshStandardMaterial({ color: '#5d4a42', roughness: 0.9 })); cap.position.y = -0.07; g.add(cap);
  const hole = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), new THREE.MeshBasicMaterial({ color: '#050505' })); hole.position.y = 0.002; g.add(hole);
  return g;   // origin = centre of the top
}

// The bed tower: an instanced crooked stack.  set({ lean, topple, hop }) poses it (pure).  bed(i) → { pos, quat } world.
function makeTower() {
  const beds = makeBeds(NT, { names: TOWER_NAMES, seed: 2 });
  const root = new THREE.Group(), pivot = new THREE.Group(); root.add(pivot); pivot.add(beds.root);
  const probe = new THREE.Object3D(); pivot.add(probe);
  const jit = TOWER_NAMES.map((_, i) => (i === NT - 1 ? { x: 0, z: 0, y: 0 } : { x: (hash(i * 3.1) - 0.5) * 0.3, z: (hash(i * 5.7) - 0.5) * 0.25, y: (hash(i * 7.3) - 0.5) * 0.4 }));
  const local = [];
  const q = new THREE.Quaternion(), qa = new THREE.Quaternion(), qy = new THREE.Quaternion(), X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
  function set({ lean = 0, topple = 0, hop = 0, sway = 0, hide = [] } = {}) {
    pivot.rotation.set(topple, 0, 0); pivot.position.set(0, hop, 0);
    let x = 0, y = 0;
    for (let i = 0; i < NT; i++) {
      const a = (lean + sway) * (i / NT) * 1.6 + (i ? (hash(i * 9.1) - 0.5) * 0.06 : 0);
      qa.setFromAxisAngle(Z, -a); qy.setFromAxisAngle(Y, -Math.PI / 2 + jit[i].y);
      q.copy(qa).multiply(qy);
      const p = V(x + jit[i].x, y, jit[i].z);
      local[i] = { p, q: q.clone() };
      if (hide.includes(i)) beds.set(i, null); else beds.set(i, p, q);
      x += BED_H * Math.sin(a); y += BED_H * Math.cos(a);
    }
    root.updateMatrixWorld(true);
  }
  function bed(i) {
    const l = local[i]; probe.position.copy(l.p); probe.quaternion.copy(l.q); probe.updateMatrixWorld(true);
    const pos = V(), quat = new THREE.Quaternion(), s = V(); probe.matrixWorld.decompose(pos, quat, s);
    return { pos, quat, at: (x, y, z) => V(x, y, z).applyQuaternion(quat).add(pos) };
  }
  set();
  return { root, pivot, beds, set, bed, height: NT * BED_H };
}

// ────────────────────────────────────────────────────────────────────────────────────── helpers
const up = (y) => V(0, y, 0);
const period = (ch) => (ch.kind === 'cat' ? 3.4 : ch.kind === 'pigeon' ? 2.7 : 3.1);
const OPEN = (ch) => 10 * period(ch) + period(ch) / 2 - (ch.blinkPhase || 0);
const SHUT = (ch) => 10 * period(ch) + 0.05 - (ch.blinkPhase || 0);
function tag(ctx, text, t0, t1 = Infinity, o = {}) {
  const d = ctx.t - t0;
  if (d < 0 || ctx.t > t1) return;
  const pop = d < 0.16 ? ease.outBack(clamp(d / 0.16, 0, 1)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.22, size: 66, fill: '#ffffff', stroke: '#000000', bg: 'rgba(20,20,30,0.8)', rot: -0.03, ...o, scale: Math.max(0.01, pop) });
}
function stamp(ctx, text, t0, o = {}) {
  const d = ctx.t - t0; if (d < 0) return;
  const s = d < 0.12 ? lerp(2.2, 1, ease.outCubic(d / 0.12)) : 1;
  ctx.fx.text(text, { x: 0.5, y: 0.22, size: 190, fill: '#e8232b', stroke: '#ffffff', line: 14, rot: -0.12, scale: s, alpha: clamp(d / 0.06, 0, 1), ...o });
}
function humanFace(ch) { ch.root.updateMatrixWorld(true); return ch.joints.head.localToWorld(V(0, 0.3, 0.28)); }
function catFace(cat) { cat.root.updateMatrixWorld(true); return cat.joints.head.localToWorld(V(0, 0.035, 0.123)); }
const facing = (obj) => V(Math.sin(obj.rotation.y), 0, Math.cos(obj.rotation.y));
function put(ctx, id, pos, yaw = 0) { ctx.place(id, pos, { yaw }); return ctx.cast[id]; }
function armsDown(ch) { ch.joints.armL.rotation.set(0.05, 0, 0.12); ch.joints.armR.rotation.set(0.05, 0, -0.12); }
/** A figure lying on its back on a bed (bed frame from makeBeds / tower.bed): head toward the headboard. */
function lieOnBed(ch, b, { lift = 0, z = 0.05 } = {}) {
  ch.root.position.copy(b.at(0, 0.5 + lift, z)); ch.root.quaternion.copy(b.quat);
}
function lie(ch, t, face, eyesT, { arms = 'down', headYaw = 0 } = {}) {
  ch.pose('crowdSurf', 0, { intensity: 0, headYaw });
  if (arms === 'down') armsDown(ch);
  ch.face(face, eyesT);
}
function sackOnBack(ctx, ch) {
  const s = ctx.props.sack; ctx.add(s, ch.joints.torso); s.rotation.set(2.4, 0, 0.2); s.position.set(-0.18, 0.55, -0.22); s.scale.setScalar(1.2);
}
function zzz(ctx, k, pos, t, t0 = -1) {
  const z = ctx.props.zzz[k]; ctx.add(z);
  const d = Math.max(0, t - t0);
  z.visible = t >= t0; z.position.copy(pos).add(V(0.15 * Math.sin(d * 2 + k), 0.25 + 0.18 * ((d * 0.6 + hash(k)) % 1), 0));
}
function iris(ctx, t0, cy = 0.5) {
  const k = clamp((ctx.t - t0) / 0.5, 0, 1);
  if (k > 0) ctx.fx.draw((g, W, H) => { const r = Math.hypot(W, H) * 0.6 * (1 - ease.inCubic(k)); g.save(); g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W * 0.5, H * cy, Math.max(0.5, r), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore(); });
}
const hits = (ctx, b, d = 0.03) => ctx.hussTimes(b).map((h) => h + d);
const hussShot = (b, i) => (i === 0 ? `${b}.h0-0.12` : `${b}.h${i}-0.03`);

// ── the rooftop: house 1 (north row, gable toward the street).  B = burglar spot on the ridge; chimney in front.
function rooftop(ctx) {
  const houses = ctx.anchor('houses') || [];
  const h = houses.find((x) => x.index === 1) || houses[0];
  ctx.set.root.updateMatrixWorld(true);   // house 1: 'front' kind (ridge along its depth), w = 9.0 → roof rise 3.78
  const Hf = frame(ctx.set.root.localToWorld(h ? h.position.clone() : V(-15, 0, -14)), h ? h.yaw : 0);
  const ridge = 5.8 + 9.0 * 0.42 + 0.12;
  const B = Hf(0, ridge, 1.6), C = Hf(0, ridge + 0.9, 2.35);
  const P = ctx.props; ctx.add(P.chimney); P.chimney.position.copy(C); P.chimney.rotation.set(0, Hf.yaw, 0);
  const b = put(ctx, 'burglar', B, Hf.yaw);
  sackOnBack(ctx, b);
  return { Hf, B, C, b, ridge };
}
// the row of houses that go dark during b03 (visible looking east from the rooftop), one per HUSS
const DARK_ORDER = [6, 2, 7, 3, 8, 4];

// ── the square.  S: stage frame (+z = audience, origin stage floor y 0.8).  ground = S y −0.8.
const G0 = -0.8;
function plazaSlot(k) {
  const col = k % 6, row = Math.floor(k / 6);
  return [(col - 2.5) * 1.35 + (hash(k * 3.3) - 0.5) * 0.4 + (row % 2 ? 0.5 : 0), 5.4 + row * 1.45 + (hash(k * 5.1) - 0.5) * 0.35];
}
function squareScene(ctx, { light = 'party_night', party = true, crowd = true, mains = ['grandad', 'marcus', 'brenda', 'heckler'], tower = true,
  mayorMic = true, dj = true, cakes = true, stands = true, hats = true } = {}) {
  setProps3EnvIntensity(light === 'party_night' ? 0.55 : 0.8);
  ctx.set.setLighting?.(light); ctx.set.set?.('partyProps', party); ctx.set.set?.('fireworks', false); ctx.set.set?.('foam', 0);
  ctx.set.set?.('standsCrowd', stands); ctx.set.set?.('crowdMotion', party ? 0.7 : 0.1); ctx.set.set?.('windowGlow', party ? 1 : 0.2);
  const S = frameAt(ctx, 'square.stage');
  const st = { S, crowd: [], P: ctx.props };
  const P = ctx.props;
  if (crowd) {
    const ids = [...EXTRA_IDS.slice(0, 14), ...mains];
    ids.forEach((id, k) => {
      const [x, z] = plazaSlot(k);
      const ch = put(ctx, id, S(x, G0, z), S.yaw + Math.PI + (hash(k * 1.7) - 0.5) * 0.5);
      if (hats && id !== 'grandad') ch.setAccessory?.('partyHat', true);
      st.crowd.push({ ch, phase: hash(k * 2.3) * 3, k, x, z });
    });
    const rows = ctx.anchor('square.standA.rows');
    if (Array.isArray(rows)) EXTRA_IDS.slice(14, 18).forEach((id, j) => { ctx.place(id, rows[0], { offset: [(j - 1.5) * 1.5, 0, 0] }); if (hats) ctx.cast[id].setAccessory?.('partyHat', true); st.crowd.push({ ch: ctx.cast[id], phase: hash(j + 9) * 3, k: 30 + j, stand: true }); });
  }
  if (tower) { ctx.add(P.tower.root); P.tower.root.position.copy(S(8.6, G0, 0.2)); P.tower.root.rotation.set(0, S.yaw, 0); P.tower.set(); }
  if (mayorMic) { ctx.add(P.mic); P.mic.position.copy(S(0, 0, 2.75)); P.mic.rotation.set(0, S.yaw + Math.PI, 0); put(ctx, 'mayor', S(0, 0, 2.4), S.yaw); }
  if (dj) { ctx.add(P.decks.root); P.decks.root.position.copy(S(-4.3, 0, 1.6)); P.decks.root.rotation.set(0, S.yaw + 0.3, 0); P.decks.setOn(party); put(ctx, 'gerald', S(-4.15, 0, 1.05), S.yaw + 0.3); }
  if (cakes) P.cakes.forEach((c, i) => { ctx.add(c.root); c.root.position.copy(S((i - 1) * 0.55, 0.78, 0.8)); c.root.rotation.set(0, S.yaw, 0); });
  return st;
}
function crowdAnim(ctx, st, { mode = 'party', jumpHits = null } = {}) {
  const hit = jumpHits ? lastBefore(jumpHits, ctx.t) : null;
  for (const c of st.crowd) {
    const t = ctx.t + c.phase;
    if (mode === 'sleepy') { c.ch.pose('idle', t, { intensity: 1, headPitch: 0.35 + 0.15 * Math.sin(t * 1.3) }); c.ch.joints.torso.rotation.z += 0.12 * Math.sin(t * 1.1); c.ch.face('sleepy', t); continue; }
    if (mode === 'cheer' || jumpHits) {
      c.ch.pose('cheer', t); c.ch.face(jumpHits ? 'huss' : 'grin', t);
      if (hit != null && !c.stand) { const d = ctx.t - hit; c.ch.root.position.y = st.S.origin.y + G0 + (d < 0.35 ? 0.55 * Math.sin(Math.PI * d / 0.35) : 0); }
      continue;
    }
    c.ch.pose(c.k % 3 === 0 ? 'dance2' : 'dance', t, { speed: 0.9 + 0.2 * hash(c.k) }); c.ch.face('grin', t);
  }
}
function djAnim(ctx, { asleep = false, slamHits = null } = {}) {
  const g = ctx.cast.gerald; ctx.props.decks.update(ctx.t);
  if (asleep) { g.pose('idle', 0, { intensity: 0, headPitch: 0.75 }); g.face('sleepy', SHUT(g)); }
  else if (slamHits) { g.pose('slam', ctx.t, { hits: slamHits }); g.face('huss', ctx.t); }
  else { g.pose('dance2', ctx.t, { speed: 1.1 }); g.face('grin', ctx.t); }
}
/** The mayor's top hat slid down over his eyes. */
function hatOverEyes(ctx, m) {
  m.setAccessory('topHat', false);
  const h = ctx.props.hatOverEyes; ctx.add(h, m.joints.head); h.position.set(0, 0.2, 0.03); h.rotation.set(0.12, 0, 0);
}

// ── the plaza after the fall: beds in a loose grid; slot 'hole' (the middle) is bare cobbles for the burglar.
function fieldSlots() {
  const out = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    if (r >= 1 && r <= 2 && c >= 2 && c <= 3) continue;
    const k = out.length;
    out.push({ x: (c - 2.5) * 2.25 + (hash(k * 2.1) - 0.5) * 0.5, z: 5.0 + r * 2.7 + (hash(k * 4.3) - 0.5) * 0.5, yaw: (hash(k * 6.1) - 0.5) * 0.7 });
  }
  return out;   // 20 slots
}
const FIELD_WHO = [...EXTRA_IDS.slice(0, 15), 'grandad', 'mayor', 'heckler', 'marcus', 'brenda'];

// ═════════════════════════════════════════════════════════════════════════════════════════ SHOTS
export const shots = [
  // ── b01 "In this town, everybody parties."  crane down the party street → rises to the dark rooftop
  {
    name: 'party crane', start: 0, set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 9, hats: true });
      const rt = rooftop(ctx);
      const c = ctx.point('street.center'), hi = ctx.point('street.camHigh');
      const d = V(hi.x - c.x, 0, hi.z - c.z).normalize();
      ctx.store = { crowd, rt, from: { pos: hi, look: c.clone().add(up(0.5)), fov: 50 }, mid: { pos: c.clone().addScaledVector(d, 9).add(up(3.2)), look: ctx.point('street.crowdA').add(up(1.3)), fov: 42 },
        roof: { pos: rt.Hf(4.2, rt.ridge + 1.4, 8.2), look: rt.Hf(0, rt.ridge + 0.9, 1.9), fov: 34 } };
    },
    update(ctx) {
      const { crowd, rt, from, mid, roof } = ctx.store;
      animateCrowd(crowd, ctx.t);
      rt.b.pose('peer', ctx.t, { intensity: 0.4 }); rt.b.face('squint', ctx.t);
      const tr = ctx.markers.rooftop;
      if (ctx.t < tr) ctx.cam.move(from, mid, clamp(ctx.t / tr, 0, 1), ease.inOutCubic);
      else { const k = clamp((ctx.t - tr) / 0.6, 0, 1); ctx.cam.move(mid, roof, k, ease.inOutCubic); ctx.cam.set({ pos: ctx.cam.state.pos.clone().add(up(6 * Math.sin(Math.PI * k))) }); }
    },
  },
  // ── b02 "Except me. I'm working."  rooftop close-up; tugs the mask on 'working', one flat nod
  {
    name: 'rooftop close', start: 'b02-0.1', set: 'town',
    setup(ctx) { partyTown(ctx); ctx.store = { rt: rooftop(ctx), crowd: crowdGrid(ctx, EXTRA_IDS.slice(0, 12), 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 9, hats: true }) }; },
    update(ctx, lt) {
      const { rt, crowd } = ctx.store, b = rt.b; animateCrowd(crowd, ctx.t);
      const tw = ctx.markers.working;
      const tug = ctx.t > tw - 0.25 && ctx.t < tw + 0.3;
      const nod = ctx.t > tw + 0.3 ? Math.sin(Math.PI * clamp((ctx.t - tw - 0.3) / 0.35, 0, 1)) * 0.35 : 0;
      b.pose(tug ? 'think' : 'peer', ctx.t, { intensity: 0.3, headPitch: nod }); b.face(ctx.t > tw ? 'determined' : 'squint', OPEN(b));
      const hp = humanFace(b);
      ctx.cam.move({ pos: hp.clone().add(rt.Hf.fwd.clone().multiplyScalar(4.4)).addScaledVector(rt.Hf.left, 1.4).add(up(0.3)), look: hp.clone().add(up(-0.55)), fov: 34 },
        { pos: hp.clone().add(rt.Hf.fwd.clone().multiplyScalar(3.7)).addScaledVector(rt.Hf.left, 1.2).add(up(0.25)), look: hp.clone().add(up(-0.5)), fov: 34 }, clamp(lt / 1.6, 0, 1));
    },
  },
  // ── b03 HUSS ×6 — one house goes dark per HUSS, a family dances off to the square; he slams the chimney
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `rooftop huss #${i + 1}`, start: hussShot('b03', i), set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const rt = rooftop(ctx);
      const houses = ctx.anchor('houses') || [];
      const fams = [];
      DARK_ORDER.forEach((hi, k) => {
        const h = houses.find((x) => x.index === hi); if (!h) return;
        const D = frameAt(ctx, `house.${hi}.door`);
        for (let j = 0; j < 3; j++) { const id = EXTRA_IDS[k * 3 + j]; ctx.place(id, D(0, 0, 0)); ctx.cast[id].setAccessory?.('partyHat', true); fams.push({ id, k, j, D }); }
      });
      ctx.store = { rt, fams };
    },
    update(ctx) {
      const { rt, fams } = ctx.store, b = rt.b, hs = hits(ctx, 'b03');
      const n = hs.filter((h) => h <= ctx.t).length;
      const dark = new Set(DARK_ORDER.slice(0, n));
      ctx.set.set?.('windowGlow', (hi) => (dark.has(hi) ? 0 : 1));
      b.pose('slam', ctx.t, { hits: hs, slamTarget: rt.C.clone().add(up(0.02)) }); b.face('huss', OPEN(b));
      for (const f of fams) {
        const ch = ctx.cast[f.id], th = hs[f.k];
        const vis = ctx.t >= th; ch.root.visible = vis; if (!vis) continue;
        const d = ctx.t - th;
        const p = f.D(0, 0, 1.2 + Math.min(d, 0.6) * 2.5).add(V(Math.max(0, d - 0.3) * 1.6 + (f.j - 1) * 0.8, 0, (f.j - 1) * 0.3));
        ch.root.position.copy(p); ch.root.rotation.set(0, Math.PI / 2, 0);
        ch.pose('dance2', ctx.t + f.j * 0.4, { speed: 1.2 }); ch.face('grin', ctx.t + f.j);
      }
      const { Hf, B } = rt;
      if (i % 2 === 0 || i === 5) {
        const k = i === 5 ? 1 : 0;
        ctx.cam.set({ pos: B.clone().add(V(-3.2 - 2 * k, 2.0 + 1.2 * k, -2.0 - 1.5 * k)), look: V(16, 1.5, 0), fov: 46 + 4 * k });
      } else {
        ctx.cam.set({ pos: Hf(3.4, rt.ridge + 1.1, 3.6), look: Hf(0, rt.ridge + 1.05, 2.0), fov: 38 });
      }
      const hit = lastBefore(hs, ctx.t);
      if (hit != null) { const s = ctx.props.soot; ctx.add(s.root); s.root.position.copy(rt.C); s.root.scale.setScalar(0.6); s.update((ctx.t - hit) / 0.45); }
      ctx.cam.punch(hs, ctx.t, 0.1, 0.2); ctx.cam.shake(0.08, ctx.t, i);
    },
  })),
  // ── b04 "A tumbleweed got a job. Rolls in at nine."  day cutaway: OFFICE, the clock tower strikes nine
  {
    name: 'tumbleweed commute', start: 'b04-0.15', set: 'town',
    setup(ctx) {
      setProps3EnvIntensity(1);
      ctx.set.setLighting?.('day'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('windowGlow', 0);
      const F = frameAt(ctx, 'clockTower');
      const P = ctx.props;
      ctx.add(P.office); P.office.position.copy(F(1.6, 0, 9.5)); P.office.rotation.set(0, F.yaw, 0);
      ctx.add(P.tumbleweed); ctx.add(P.miniCase, P.tumbleweed);
      P.miniCase.position.set(0.12, 0.05, 0.2); P.miniCase.rotation.set(0.3, 0.5, 0.2);
      ctx.store = { F, door: F(1.6, 0.45, 11.0), inside: F(1.6, 0.45, 9.2), start: F(6.5, 0.45, 17.5) };
    },
    update(ctx) {
      const { F, door, inside, start } = ctx.store, tw = ctx.props.tumbleweed;
      const t0 = ctx.time('b04') - 0.15, tn = ctx.markers.nine;
      let p;
      if (ctx.t < tn) p = start.clone().lerp(door, clamp((ctx.t - t0) / (tn - t0), 0, 1));
      else p = door.clone().lerp(inside, clamp((ctx.t - tn) / 0.35, 0, 1));
      tw.scale.setScalar(1.4);
      tw.position.copy(p).add(up(Math.abs(Math.sin(ctx.t * 7)) * 0.18));
      const dist = start.distanceTo(p);
      tw.rotation.set(-dist / 0.45, F.yaw + 0.5, 0);
      ctx.cam.set({ pos: F(5.5, 1.7, 20.5), look: F(1.6, 2.6, 9.0), fov: 44 });
      if (ctx.t > tn) { ctx.cam.shake(0.25 * clamp(1 - (ctx.t - tn) / 0.4, 0, 1), ctx.t, 4); tag(ctx, 'DONG ×9', tn, Infinity, { y: 0.14, size: 72, bg: 'rgba(30,60,140,0.85)' }); }
      tag(ctx, '9:00 AM', t0 + 0.2, tn, { y: 0.14, size: 64 });
    },
  },
  // ── b05 "While they're out partying, by the way, I'm in their houses."  Brenda's room, flashlight under the chin
  {
    name: 'flashlight', start: 'b05-0.15', set: 'roomB',
    setup(ctx) {
      setProps3EnvIntensity(0.4);
      ctx.set.setLighting?.('night'); ctx.set.set?.('window', 'dark');
      const R = ctx.set.root; R.updateMatrixWorld(true);
      const W = frame(R.localToWorld(V(0, 0, 0)), yawOf(R));
      const b = put(ctx, 'burglar', W(-0.45, 0, -1.5), W.yaw);
      sackOnBack(ctx, b);
      const P = ctx.props; ctx.add(P.flash.root); P.flash.setOn(1);
      ctx.add(P.balloon9);
      ctx.store = { W, b };
    },
    update(ctx, lt) {
      const { W, b } = ctx.store, P = ctx.props;
      b.pose('think', 0.6, { intensity: 0, headPitch: -0.05 }); b.face('neutral', OPEN(b));
      b.root.updateMatrixWorld(true);
      const hp = b.joints.handR.getWorldPosition(V());
      P.flash.root.position.copy(hp).addScaledVector(W.fwd, 0.04); P.flash.root.lookAt(hp.clone().add(up(1)).addScaledVector(W.fwd, -0.25));
      const th = ctx.markers.houses, k = clamp((ctx.t - (th - 0.5)) / 1.6, 0, 1);
      P.balloon9.visible = k > 0 && k < 1;
      P.balloon9.position.copy(W(lerp(-0.05, -1.75, k), 1.2 + 0.08 * Math.sin(ctx.t * 3), -2.55)); P.balloon9.rotation.set(0, 0, 0.15 * Math.sin(ctx.t * 2));
      const f = humanFace(b);
      const fy = f.y - W.origin.y;
      ctx.cam.move({ pos: W(-0.62, fy + 0.1, 1.6), look: W(-0.62, fy - 0.3, -1.5), fov: 36 },
        { pos: W(-0.6, fy + 0.06, 1.15), look: W(-0.6, fy - 0.25, -1.5), fov: 36 }, clamp(lt / 2.8, 0, 1));
      ctx.fx.vignette(0.45);
    },
  },
  // ── b06 "Every party? I threw it. Haven't slept in a year."  the corkboard
  {
    name: 'corkboard', start: 'b06-0.15', set: 'roomB',
    setup(ctx) {
      setProps3EnvIntensity(0.4);
      ctx.set.setLighting?.('night'); ctx.set.set?.('window', 'dark');
      const R = ctx.set.root; R.updateMatrixWorld(true);
      const W = frame(R.localToWorld(V(0, 0, 0)), yawOf(R));
      const P = ctx.props; ctx.add(P.cork); P.cork.position.copy(W(0.9, 1.62, -2.03)); P.cork.rotation.set(0, W.yaw, 0);
      const b = put(ctx, 'burglar', W(0.05, 0, -1.45), W.yaw);
      sackOnBack(ctx, b);
      ctx.store = { W, b };
    },
    update(ctx) {
      const { W, b } = ctx.store, tt = ctx.markers.threw, ts = ctx.markers.slept;
      const turn = clamp((ctx.t - ts) / 0.25, 0, 1);
      b.root.rotation.set(0, W.yaw + lerp(Math.PI * 0.72, 0.15, ease.inOutCubic(turn)), 0);
      if (ctx.t < ts) {
        const tap = ctx.t > tt - 0.15;
        b.pose(tap ? 'point' : 'idle', ctx.t, { intensity: 0.3, lookAt: W(0.9, 1.6, -2.0) }); b.face(tap ? 'smug' : 'neutral', ctx.t);
      } else { b.pose('idle', ctx.t, { intensity: 0.2 }); b.face('sleepy', OPEN(b)); }
      if (ctx.t < ts) ctx.cam.set({ pos: W(0.45, 1.65, 3.0), look: W(0.5, 1.45, -1.8), fov: 36 });
      else { const f = humanFace(b); ctx.cam.move({ pos: W(0.45, 1.65, 3.0), look: W(0.5, 1.45, -1.8), fov: 36 }, { pos: f.clone().add(V(0, 0, 0)).addScaledVector(W.fwd, 2.4).addScaledVector(W.left, 0.25), look: f.clone().add(up(-0.1)), fov: 32 }, clamp((ctx.t - ts) / 0.35, 0, 1), ease.inOutCubic); }
      tag(ctx, 'LAST SLEPT: LAST YEAR', ts + 0.2, Infinity, { y: 0.2, size: 62, bg: 'rgba(120,20,40,0.9)' });
    },
  },
  // ── b07 quote card "A locked door is just a shy door." → a front door, the crowbar leaning on it, flirting
  ...['card', 'reveal'].map((part) => ({
    name: `crowbar ${part}`, start: part === 'card' ? 'b07-0.1' : 'quote1end+0.05', set: 'town',
    setup(ctx) {
      setProps3EnvIntensity(0.55);
      ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('windowGlow', 0.15);
      const D = frameAt(ctx, 'house.7.door');
      const P = ctx.props;
      ctx.add(P.crowbar); P.crowbar.position.copy(D(0.32, 0.18, -0.55)); P.crowbar.rotation.set(-0.36, D.yaw, 0, 'YXZ');
      ctx.add(P.pinkPane); P.pinkPane.position.copy(D(0, 1.62, -0.815)); P.pinkPane.rotation.set(0, D.yaw, 0);
      P.hearts.forEach((h) => ctx.add(h));
      ctx.store = { D };
    },
    update(ctx) {
      const { D } = ctx.store, P = ctx.props, tf = ctx.markers.flirt;
      const k = clamp((ctx.t - tf) / 0.3, 0, 1);
      P.pinkPane.material.emissiveIntensity = 1.6 * k;
      P.hearts.forEach((h, i) => {
        const d = ctx.t - tf - i * 0.12;
        h.visible = d > 0;
        const top = D(0.36, 0.85, -0.76);
        h.position.copy(top).add(V(0, d * 0.7, 0)).addScaledVector(D.left, (i - 1) * 0.18 + 0.05 * Math.sin(d * 6 + i)).addScaledVector(D.fwd, 0.1);
        const s = 0.28 * ease.outBack(clamp(d / 0.2, 0, 1)); h.scale.set(s + 0.001, s + 0.001, 1);
      });
      if (part === 'card') {
        ctx.cam.set({ pos: D(0.6, 1.25, 2.2), look: D(0.1, 1.1, -0.8), fov: 40 });
        quoteCard(ctx, 'A locked door is just a shy door.', 'a crowbar, flirting', ctx.markers.quote1, ctx.markers.quote1end + 0.05, { y: 0.34, byAt: ctx.markers.quote1end - 0.2 });
      } else {
        ctx.cam.move({ pos: D(0.75, 1.1, 1.9), look: D(0.18, 0.95, -0.8), fov: 40 }, { pos: D(0.6, 1.05, 1.55), look: D(0.18, 1.0, -0.8), fov: 38 }, clamp(ctx.since('quote1end') / 1.2, 0, 1));
        tag(ctx, 'A CROWBAR', ctx.time('b07.w9'), Infinity, { y: 0.17 });
      }
    },
  })),
  // ── b08 HUSS ×3 — break-ins: window / chimney / cat flap
  {
    name: 'breakin window', start: hussShot('b08', 0), set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const Wn = frameAt(ctx, 'house.2.window.0');
      ctx.add(ctx.props.flungSack);
      ctx.store = { Wn };
    },
    update(ctx) {
      const { Wn } = ctx.store, hs = hits(ctx, 'b08'), s = ctx.props.flungSack;
      const h = hs[0];
      ctx.set.set?.('windowGlow', (hi, wi) => (hi === 2 && wi === 0 && ctx.t >= h ? 0 : 1));
      const k = clamp((ctx.t - (h - 0.16)) / 0.16, 0, 1);
      s.visible = k < 1; s.scale.setScalar(1.3);
      const a = Wn(-0.7, -3.2, 3.4), bpt = Wn(0, 0, -0.3);
      s.position.copy(a.lerp(bpt, k)).add(up(Math.sin(Math.PI * k) * 0.8)); s.rotation.set(k * 6, k * 3, 0);
      ctx.cam.set({ pos: Wn(1.0, -1.3, 4.2), look: Wn(0, -0.2, 0), fov: 40 });
      ctx.cam.punch(hs, ctx.t, 0.12, 0.2);
    },
  },
  {
    name: 'breakin chimney', start: hussShot('b08', 1), set: 'town',
    setup(ctx) { partyTown(ctx, { fireworks: false }); ctx.store = { rt: rooftop(ctx) }; ctx.cast.burglar.root.visible = true; },
    update(ctx) {
      const { rt } = ctx.store, b = rt.b, hs = hits(ctx, 'b08'), h = hs[1];
      const d = ctx.t - h;
      b.root.position.copy(rt.C).add(up(d < 0 ? 0.05 : -Math.min(2.4, 6 * d * d + 1.2 * d)));
      b.pose('cheer', 0.3, { intensity: 1 }); b.face('huss', OPEN(b));
      const s = ctx.props.soot; ctx.add(s.root); s.root.position.copy(rt.C).add(up(0.2)); s.root.scale.setScalar(1.1); s.update(d / 0.5);
      ctx.cam.set({ pos: rt.C.clone().addScaledVector(rt.Hf.fwd, 3.0).addScaledVector(rt.Hf.left, 1.2).add(up(1.2)), look: rt.C.clone().add(up(0.6)), fov: 38 });
      ctx.cam.punch(hs, ctx.t, 0.12, 0.2); ctx.cam.shake(0.1, ctx.t, 11);
    },
  },
  {
    name: 'breakin cat flap', start: hussShot('b08', 2), set: 'roomG',
    setup(ctx) {
      setProps3EnvIntensity(0.45);
      ctx.set.setLighting?.('dawn'); ctx.set.set?.('window', 'dark');
      const R = ctx.set.root; R.updateMatrixWorld(true);
      const W = frame(R.localToWorld(V(0, 0, 0)), yawOf(R));
      const P = ctx.props, d = P.flapDoor;
      const Dd = frame(W(0.4, 0, 0.6), W.yaw);          // door frame: +z = the cat's side (towards the camera)
      ctx.add(d.root); d.root.position.copy(Dd(0, 0, 0)); d.root.rotation.set(0, Dd.yaw, 0);
      const b = put(ctx, 'burglar', Dd(0, -0.5, -1.31), Dd.yaw);
      b.root.rotation.set(Math.PI / 2 - 0.6, Dd.yaw, 0, 'YXZ');
      put(ctx, 'cat', Dd(0.0, 0, 0.62), Dd.yaw + Math.PI);
      ctx.store = { Dd };
    },
    update(ctx) {
      const { Dd } = ctx.store, b = ctx.cast.burglar, cat = ctx.cast.cat, hs = hits(ctx, 'b08'), h = hs[2];
      const k = clamp((ctx.t - (h - 0.08)) / 0.12, 0, 1);
      ctx.props.flapDoor.flap.rotation.x = -1.65 * k;
      b.root.position.copy(Dd(0, -0.5, lerp(-1.75, -1.31, ease.outCubic(k))));
      b.pose('idle', 0, { intensity: 0, headPitch: -1.0 }); b.face('sweat', OPEN(b));
      cat.pose('stare', 0); cat.face('stare', OPEN(cat));
      ctx.cam.set({ pos: Dd(1.55, 0.95, 2.1), look: Dd(0.05, 0.5, 0.25), fov: 44 });
      ctx.cam.punch(hs, ctx.t, 0.12, 0.2);
    },
  },
  // ── b09 "Never the telly. Never the jewels. Just one thing."  Marcus's room, the dresser wall
  {
    name: 'never the telly', start: 'b09-0.1', set: 'roomM',
    setup(ctx) {
      setProps3EnvIntensity(0.45);
      ctx.set.setLighting?.('dawn'); ctx.set.set?.('window', 'dark');
      const R = ctx.set.root; R.updateMatrixWorld(true);
      const W = frame(R.localToWorld(V(0, 0, 0)), yawOf(R));
      const P = ctx.props;
      ctx.add(P.dresser); P.dresser.position.copy(W(2.2, 0, 0.55)); P.dresser.rotation.set(0, W.yaw + Math.PI / 2, 0);
      const top = 0.78;
      ctx.add(P.tv.root); P.tv.root.position.copy(W(2.25, top, -0.3)); P.tv.root.rotation.set(0, W.yaw - Math.PI / 2, 0);
      ctx.add(P.jewels.root); P.jewels.root.position.copy(W(2.2, top, 0.35)); P.jewels.root.rotation.set(0, W.yaw - Math.PI / 2, 0); P.jewels.root.scale.setScalar(1.4);
      ctx.add(P.trophy9); P.trophy9.position.copy(W(2.25, top, 0.85)); P.trophy9.rotation.set(0, W.yaw - Math.PI / 2, 0); P.trophy9.scale.setScalar(1.3);
      ctx.add(P.toaster9.root); P.toaster9.root.position.copy(W(2.22, top, 1.3)); P.toaster9.root.rotation.set(0, W.yaw - Math.PI / 2, 0); P.toaster9.root.scale.setScalar(1.3);
      P.toaster9.setTremble?.(0, 0);
      const b = put(ctx, 'burglar', W(1.45, 0, -1.2), W.yaw);
      sackOnBack(ctx, b);
      ctx.store = { W, b, t0: ctx.time('b09') - 0.1 };
    },
    update(ctx) {
      const { W, b, t0 } = ctx.store, P = ctx.props, to = ctx.markers.one;
      P.tv.update(ctx.t); P.jewels.update(ctx.t);
      const walkEnd = to - 0.05;
      const z = lerp(-1.2, 1.25, clamp((ctx.t - t0) / (walkEnd - t0), 0, 1));
      b.root.position.copy(W(1.45, 0, z)); b.root.rotation.set(0, W.yaw, 0);
      if (ctx.t < walkEnd) { b.pose('walk', ctx.t, { speed: 1.0 }); b.face('neutral', OPEN(b)); }
      else { b.pose('idle', ctx.t, { intensity: 0.2, headYaw: -0.25 }); b.face('smug', OPEN(b)); b.joints.armL.rotation.x = -0.9; b.joints.armL.rotation.z = 0.3; }
      const zc = Math.min(z, 0.95) + 0.1;
      ctx.cam.set({ pos: W(-1.15, 1.95, zc - 0.2), look: W(2.2, 0.95, zc), fov: 50 });
      if (Math.abs(ctx.t - ctx.markers.telly) < 0.6) tag(ctx, 'NOPE', ctx.markers.telly, ctx.markers.telly + 0.6, { y: 0.2, size: 60 });
      if (Math.abs(ctx.t - ctx.markers.jewels) < 0.6) tag(ctx, 'NOPE', ctx.markers.jewels, ctx.markers.jewels + 0.6, { y: 0.2, size: 60 });
    },
  },
  // ── b10 "They kept coming home early."  Grandad hangs his party hat on the frozen burglar
  {
    name: 'hat stand', start: 'b10-0.1', set: 'roomG',
    setup(ctx) {
      setProps3EnvIntensity(0.45);
      ctx.set.setLighting?.('night'); ctx.set.set?.('window', 'dark');
      const R = ctx.set.root; R.updateMatrixWorld(true);
      const W = frame(R.localToWorld(V(0, 0, 0)), yawOf(R));
      const b = put(ctx, 'burglar', W(-1.0, 0, 0.35), W.yaw - Math.PI / 2);
      put(ctx, 'grandad', W(-2.1, 0, 1.6), W.yaw + Math.PI);
      const P = ctx.props; ctx.add(P.handHat); ctx.add(P.grandHat);
      ctx.store = { W, b, t0: ctx.time('b10') - 0.1 };
    },
    update(ctx) {
      const { W, b, t0 } = ctx.store, g = ctx.cast.grandad, P = ctx.props;
      const tHang = t0 + 0.65;
      b.pose('point', 0.8, { intensity: 0 }); b.face(ctx.t > tHang + 0.2 ? 'sweat' : 'neutral', OPEN(b));
      b.root.updateMatrixWorld(true);
      const hand = b.joints.handR.getWorldPosition(V());
      // grandad: in from the door, past the hand, out toward the (unseen) bed
      const k = clamp((ctx.t - t0) / 1.45, 0, 1);
      const gp = W(-2.12, 0, lerp(1.7, -0.25, k));
      g.root.position.copy(gp); g.root.rotation.set(0, W.yaw + Math.PI, 0);
      const pat = ctx.t > tHang && ctx.t < tHang + 0.3;
      g.pose(pat ? 'point' : 'walk', ctx.t, { speed: 0.7, intensity: 0.6 }); g.face('sleepy', ctx.t);
      g.root.updateMatrixWorld(true);
      if (ctx.t < tHang) { P.grandHat.visible = true; P.handHat.visible = false; const hp = headPos(g, 0.62); P.grandHat.position.copy(hp); P.grandHat.rotation.set(0, g.root.rotation.y, 0.1); }
      else { P.grandHat.visible = false; P.handHat.visible = true; P.handHat.position.copy(hand).add(up(0.06)); P.handHat.rotation.set(0, 0, 0.25); }
      ctx.cam.set({ pos: W(1.5, 2.1, 4.6), look: W(-1.5, 1.05, 0.55), fov: 48 });
      tag(ctx, '9:04 PM', t0, Infinity, { x: 0.27, y: 0.12, size: 64, bg: 'rgba(10,10,20,0.85)', fill: '#ffe14a', rot: 0 });
      if (ctx.t > t0 + 1.15) tag(ctx, 'Z z z', t0 + 1.15, Infinity, { x: 0.15, y: 0.3, size: 80, bg: null, rot: -0.2 });
    },
  },
  // ── b11 "Bigger parties. Foam. Pool. Foam in the pool."  the burglar points the way in every shot
  {
    name: 'bigger parties', start: 'b11-0.1', set: 'town',
    setup(ctx) {
      partyTown(ctx);
      const crowd = crowdGrid(ctx, EXTRA_IDS, 'street.crowdA', { cols: 6, dx: 1.25, dz: 1.3, seed: 19, hats: true });
      const F = frameAt(ctx, 'street.crowdA');
      const b = put(ctx, 'burglar', F(-2.5, 0, 9.4), F.yaw + Math.PI * 0.85);
      signIn(ctx, b);
      ctx.store = { crowd, F, b };
    },
    update(ctx, lt) {
      const { crowd, F, b } = ctx.store; animateCrowd(crowd, ctx.t, { speed: 1.2 });
      holdSign(ctx, b);
      ctx.cam.move({ pos: F(-1.0, 2.6, 13.5), look: F(-1.2, 1.3, 3.5), fov: 46 }, { pos: F(-1.6, 2.2, 11.5), look: F(-1.6, 1.3, 3.5), fov: 44 }, clamp(lt / 1.3, 0, 1));
    },
  },
  {
    name: 'foam', start: 'foam-0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false }); ctx.set.set?.('foam', 1);
      const crowd = crowdGrid(ctx, EXTRA_IDS.slice(0, 12), 'foam.center', { cols: 4, dx: 1.3, dz: 1.3, seed: 7, hats: true, offset: [0, 0, -1.5] });
      const F = frameAt(ctx, 'foam.center');
      const b = put(ctx, 'burglar', F(1.9, 0, 6.2), F.yaw - 0.4);
      signIn(ctx, b);
      ctx.store = { crowd, F, b };
    },
    update(ctx) {
      const { crowd, F, b } = ctx.store; animateCrowd(crowd, ctx.t, { speed: 1.3 }); holdSign(ctx, b);
      ctx.cam.set({ pos: F(1.0, 2.4, 9.0), look: F(0.8, 1.1, 1.0), fov: 46 });
    },
  },
  {
    name: 'pool', start: 'pool-0.05', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const E = frameAt(ctx, 'pool.edge3');
      const P = ctx.props;
      const jumpers = ['x03', 'x07', 'x11'].map((id, k) => { put(ctx, id, E(0, 0, 0), E.yaw + Math.PI); ctx.cast[id].setAccessory?.('partyHat', true); return { id, k }; });
      const b = put(ctx, 'burglar', E(-1.6, 0, 0.5), E.yaw + Math.PI + 0.6);
      signIn(ctx, b);
      ctx.add(P.splash.root);
      ctx.store = { E, b, jumpers, c: ctx.point('pool.center') };
    },
    update(ctx) {
      const { E, b, jumpers, c } = ctx.store, t0 = ctx.markers.pool - 0.05; holdSign(ctx, b);
      jumpers.forEach(({ id, k }) => {
        const ch = ctx.cast[id], tj = t0 + 0.05 + k * 0.18, u = clamp((ctx.t - tj) / 0.45, 0, 1);
        const from = E((k - 1) * 1.1, 0, -0.3), to = c.clone().addScaledVector(E.left, (k - 1) * 1.6);
        const p = from.clone().lerp(to, u); p.y += 1.6 * Math.sin(Math.PI * u) - (u >= 1 ? 1.5 : 1.2 * u * u);
        ch.root.position.copy(p); ch.root.visible = u < 1 || ctx.t < tj + 0.5;
        ch.pose(u > 0 ? 'cheer' : 'idle', ctx.t, { intensity: 1 }); ch.face('grin', ctx.t + k);
        if (u > 0) { ch.joints.legL.rotation.x = -1.6; ch.joints.legR.rotation.x = -1.6; ch.joints.shinL && (ch.joints.shinL.rotation.x = 2.0); ch.joints.shinR && (ch.joints.shinR.rotation.x = 2.0); }
      });
      const P = ctx.props; P.splash.root.position.copy(c); P.splash.update(ctx.t - (t0 + 0.5));
      ctx.cam.set({ pos: E(-0.6, 2.6, 5.2), look: c.clone().add(up(0.4)), fov: 46 });
    },
  },
  {
    name: 'foam in the pool', start: 'foamPool', set: 'town',
    setup(ctx) {
      partyTown(ctx, { fireworks: false });
      const E = frameAt(ctx, 'pool.edge3'), c = ctx.point('pool.center');
      const P = ctx.props; ctx.add(P.foamPool.root); P.foamPool.root.position.copy(c); P.foamPool.root.rotation.set(0, yawOf(ctx.anchor('pool.edge1')), 0);
      put(ctx, 'x05', E(0.4, 0, -0.4), E.yaw + Math.PI); ctx.cast.x05.setAccessory?.('partyHat', true);
      const b = put(ctx, 'burglar', E(-1.6, 0, 0.5), E.yaw + Math.PI + 0.6);
      signIn(ctx, b);
      ctx.store = { E, b, c };
    },
    update(ctx) {
      const { E, b, c } = ctx.store, P = ctx.props; holdSign(ctx, b);
      P.foamPool.update(ctx.t, 1);
      const x = ctx.cast.x05, tj = ctx.markers.foamPool + 0.15, u = clamp((ctx.t - tj) / 0.5, 0, 1);
      const p = E(0.4, 0, -0.4).lerp(c, u); p.y += 1.4 * Math.sin(Math.PI * u) - 1.6 * u * u;
      x.root.position.copy(p); x.root.rotation.set(-1.2 * u, E.yaw + Math.PI, 0); x.root.visible = u < 0.98;
      x.pose('cheer', ctx.t, { intensity: 1 }); x.face('grin', ctx.t);
      ctx.cam.set({ pos: E(-0.6, 2.8, 5.4), look: c.clone().add(up(0.5)), fov: 46 });
    },
  },
  // ── b12 "Top ten respectful moments. Number seven: I wipe my feet."
  {
    name: 'wipe feet', start: 'b12-0.1', set: 'town',
    setup(ctx) {
      setProps3EnvIntensity(0.55);
      ctx.set.setLighting?.('party_night'); ctx.set.set?.('partyProps', true); ctx.set.set?.('fireworks', false); ctx.set.set?.('windowGlow', 0.1);
      const D = frameAt(ctx, 'house.6.door');
      const P = ctx.props; ctx.add(P.mat); P.mat.position.copy(D(0, 0, -0.05)); P.mat.rotation.set(0, D.yaw, 0);
      const b = put(ctx, 'burglar', D(0, 0.03, 0.3), D.yaw + Math.PI);
      sackOnBack(ctx, b);
      ctx.store = { D, b };
    },
    update(ctx) {
      const { D, b } = ctx.store, tw = ctx.markers.wipe;
      b.pose('idle', ctx.t, { intensity: 0.2, headPitch: 0.45 }); b.face('neutral', OPEN(b));
      const d = ctx.t - (tw - 0.1);
      if (d > 0 && d < 1.2) {   // left, right, left: each foot scrubs back and forth
        const step = Math.floor(d / 0.4), u = (d % 0.4) / 0.4, leg = step % 2 ? 'legR' : 'legL';
        b.joints[leg].rotation.x = 0.35 * Math.sin(u * Math.PI * 4);
        b.root.position.copy(D(0, 0.03, 0.3)).add(up(0.02 * Math.abs(Math.sin(u * Math.PI * 4))));
      }
      if (d >= 1.25) { const n = clamp((d - 1.25) / 0.35, 0, 1); b.pose('idle', ctx.t, { intensity: 0.2, headPitch: 0.45 * Math.sin(Math.PI * n) }); }
      ctx.cam.set({ pos: D(2.3, 2.3, 3.4), look: D(0.0, 0.95, -0.1), fov: 52 });
      top10Card(ctx, 7, ctx.time('b12') + 0.05, Infinity, { popAt: ctx.markers.top7 });
    },
  },
  // ── b13 "Then came the Never-Ending Party."
  {
    name: 'never ending', start: 'b13-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = squareScene(ctx);
      const c = ctx.point('square.center'), cam = ctx.point('square.cam1');
      const d = V(cam.x - c.x, 0, cam.z - c.z).normalize();
      st.from = { pos: c.clone().addScaledVector(d, 22).add(up(9)), look: c.clone().add(up(2)), fov: 44 };
      st.to = { pos: st.S(-1.5, 2.6, 17.5), look: st.S(-1.2, 1.4, 2.0), fov: 46 };
    },
    update(ctx, lt) {
      const st = ctx.store, k = clamp(lt / 1.2, 0, 1);
      crowdAnim(ctx, st); djAnim(ctx); ctx.cast.mayor.pose('wave', ctx.t); ctx.cast.mayor.face('grin', ctx.t);
      for (const c of st.crowd) if (!c.stand) c.ch.root.position.copy(st.S(c.x, G0, c.z + (1 - ease.outCubic(k)) * 7));
      ctx.cam.move(st.from, st.to, ease.inOutCubic(clamp(lt / 1.1, 0, 1)));
    },
  },
  {
    name: 'banner', start: 'banner-0.05', set: 'town',
    setup(ctx) { ctx.store = squareScene(ctx); },
    update(ctx, lt) {
      const st = ctx.store; crowdAnim(ctx, st, { mode: 'cheer' }); djAnim(ctx); ctx.cast.mayor.pose('cheer', ctx.t); ctx.cast.mayor.face('grin', ctx.t);
      const bc = ctx.point('square.bannerCam'), bn = ctx.point('square.banner');
      ctx.cam.move({ pos: bc.clone().add(up(-0.8)), look: bn.clone().add(up(-0.9)), fov: 50 }, { pos: bc.clone().lerp(bn, 0.12).add(up(-0.7)), look: bn.clone().add(up(-0.8)), fov: 50 }, clamp(lt / 1.0, 0, 1));
    },
  },
  // ── b14 mayor: "Nobody goes home!"  → the crowd cheers; at the back, the burglar's slow clap
  {
    name: 'nobody goes home', start: 'b14-0.1', set: 'town',
    setup(ctx) { ctx.store = squareScene(ctx); },
    update(ctx) {
      const st = ctx.store, m = ctx.cast.mayor; crowdAnim(ctx, st, { mode: 'cheer' }); djAnim(ctx);
      m.pose('cheer', ctx.t); m.face('grin', ctx.t);
      ctx.cam.set({ pos: st.S(0.6, 1.75, 6.4), look: st.S(0, 1.75, 2.4), fov: 38 });
    },
  },
  {
    name: 'slow clap', start: 'b14.w1-0.05', set: 'town',
    setup(ctx) {
      const st = ctx.store = squareScene(ctx, { mains: ['grandad', 'marcus', 'brenda'] });
      put(ctx, 'burglar', st.S(0.3, G0, 12.6), st.S.yaw + Math.PI); sackOnBack(ctx, ctx.cast.burglar);
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.burglar; crowdAnim(ctx, st, { mode: 'cheer' }); djAnim(ctx);
      b.pose('clap', ctx.t * 0.35, { intensity: 0.7 }); b.face('neutral', OPEN(b));
      ctx.cam.set({ pos: st.S(0.2, 5.0, 2.9), look: st.S(0.3, 0.5, 11.2), fov: 36 });
    },
  },
  // ── b15 quote card "If nobody's home, it's not stealing. It's tidying." → the cat's lawyer
  ...['card', 'reveal'].map((part) => ({
    name: `lawyer ${part}`, start: part === 'card' ? 'b15-0.1' : 'quote2end', set: 'town',
    setup(ctx) {
      const st = ctx.store = squareScene(ctx, { mayorMic: part === 'card' });
      const P = ctx.props, L = frame(st.S(-7.2, G0, 6.6), st.S.yaw);
      ctx.add(P.lawDesk); P.lawDesk.position.copy(L(0, 0, 0)); P.lawDesk.rotation.set(0, L.yaw, 0);
      ctx.add(P.papers); P.papers.position.copy(L(0.12, 0.78, 0.0)); P.papers.rotation.set(0, L.yaw, 0);
      ctx.add(P.briefcase); P.briefcase.position.copy(L(-0.35, 0.78, -0.05)); P.briefcase.rotation.set(0, L.yaw + 0.2, 0);
      put(ctx, 'lawyer', L(-0.15, 0, -0.62), L.yaw);
      put(ctx, 'cat', L(0.12, 0.78 + 0.15, 0.02), L.yaw);
      st.L = L;
    },
    update(ctx) {
      const st = ctx.store, L = st.L, law = ctx.cast.lawyer, cat = ctx.cast.cat;
      crowdAnim(ctx, st); djAnim(ctx);
      if (part === 'card') { ctx.cast.mayor.pose('cheer', ctx.t); ctx.cast.mayor.face('grin', ctx.t); }
      law.pose('think', ctx.t, { headPitch: 0.25 + 0.2 * Math.sin(ctx.t * 4) }); law.face('determined', ctx.t);
      cat.pose('loaf', 0); cat.face('stare', OPEN(cat));
      if (part === 'card') {
        ctx.cam.set({ pos: st.S(2.5, 2.4, 14.0), look: st.S(-0.5, 0.9, 4.0), fov: 46 });
        quoteCard(ctx, "If nobody's home, it's not stealing. It's tidying.", "the cat's lawyer", ctx.markers.quote2, ctx.markers.quote2end, { y: 0.33, byAt: ctx.markers.quote2end - 0.25 });
      } else {
        const cf = catFace(cat);
        ctx.cam.move({ pos: cf.clone().addScaledVector(L.fwd, 2.7).addScaledVector(L.left, -0.9).add(up(0.3)), look: cf.clone().add(up(0.2)), fov: 38 },
          { pos: cf.clone().addScaledVector(L.fwd, 2.3).addScaledVector(L.left, -0.8).add(up(0.25)), look: cf.clone().add(up(0.2)), fov: 37 }, clamp(ctx.since('quote2end') / 1.0, 0, 1));
        tag(ctx, "THE CAT'S LAWYER", ctx.time('b15.w8'), Infinity, { y: 0.17 });
      }
    },
  })),
  // ── b16 HUSS ×6 — the big heist: one doorstep per HUSS, the sack puffs bigger each time
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    name: `heist huss #${i + 1}`, start: hussShot('b16', i), set: 'town',
    setup(ctx) {
      setProps3EnvIntensity(0.45);
      ctx.set.setLighting?.('quiet_night'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', true); ctx.set.set?.('windowGlow', 0); ctx.set.set?.('foam', 0);
      const door = [2, 3, 7, 4, 8, 3][i];
      const D = frameAt(ctx, `house.${door}.door`);
      const P = ctx.props, S0 = [1.5, 2.4, 3.6, 5.6, 9.0, 24][i];
      const sackPos = D(-0.04 * S0 - (i === 5 ? 1.5 : 0), 0, 0.9 + 0.12 * S0 + (i === 5 ? 3.0 : 0));
      const bp = D(i === 5 ? 4.2 : 0.95 + 0.14 * S0, 0, 0.9 + (i === 5 ? 3.5 : 0));
      const b = put(ctx, 'burglar', bp, Math.atan2(sackPos.x - bp.x, sackPos.z - bp.z) + 0.25);
      ctx.add(P.bigSack); ctx.add(P.puff.root);
      ctx.store = { D, b, S0, sackPos };
    },
    update(ctx) {
      const { D, b, S0, sackPos } = ctx.store, P = ctx.props, hs = hits(ctx, 'b16');
      const hit = lastBefore(hs, ctx.t), d = hit != null ? ctx.t - hit : 9;
      const prev = [1.0, 1.5, 2.4, 3.6, 5.6, 9.0][i];
      const s = d < 0.2 ? lerp(prev, S0, ease.outBack(clamp(d / 0.2, 0, 1))) : (hit == null ? prev : S0);
      const squash = d < 0.25 ? 1 - 0.18 * Math.sin(Math.PI * d / 0.25) : 1;
      P.bigSack.scale.set(s / squash ** 0.5, s * squash, s / squash ** 0.5);
      P.bigSack.position.copy(sackPos).add(up(0.223 * s * squash)); P.bigSack.rotation.set(0, D.yaw + i, 0);
      P.puff.root.position.copy(sackPos); P.puff.root.scale.setScalar(0.35 * S0 + 0.4); P.puff.update(d / 0.55);
      const tgt = sackPos.clone().addScaledVector(V().subVectors(b.root.position, sackPos).normalize(), 0.3 * s).add(up(Math.min(1.0, 0.4 * s)));
      b.pose('slam', ctx.t, { hits: hs, slamTarget: tgt }); b.face('huss', OPEN(b));
      const mid = sackPos.clone().lerp(b.root.position, 0.35);
      const dist = [4.2, 5.0, 6.5, 9.0, 13.0, 30][i], hgt = [1.6, 1.9, 2.4, 3.2, 4.2, 6.5][i];
      if (i < 5) ctx.cam.set({ pos: mid.clone().addScaledVector(D.fwd, dist).addScaledVector(D.left, dist * 0.35 * (i % 2 ? -1 : 1)).add(up(hgt)), look: mid.clone().add(up(Math.min(hgt * 0.75, 0.25 * S0 + 0.8))), fov: 44 });
      else ctx.cam.set({ pos: sackPos.clone().add(V(-28, 5.5, 3)), look: sackPos.clone().add(up(4.5)), fov: 50 });
      ctx.cam.punch(hs, ctx.t, 0.12, 0.2); ctx.cam.shake(0.06 + 0.07 * i, ctx.t, 70 + i);
    },
  })),
  // ── b17 "Ever wonder why nobody goes home?"  DAY 400, everybody asleep on their feet
  {
    name: 'day 400', start: 'b17-0.1', set: 'town',
    setup(ctx) { const st = ctx.store = squareScene(ctx, { light: 'dusk' }); hatOverEyes(ctx, ctx.cast.mayor); ctx.set.set?.('crowdMotion', 0.15);
      const g = st.crowd.find((c) => c.ch.id === 'grandad'); if (g) { g.x = -0.4; g.z = 5.5; g.ch.root.position.copy(st.S(-0.4, G0, 5.5)); }
      const m = put(ctx, 'mayor', st.S(1.6, G0, 6.6), st.S.yaw + Math.PI - 0.3); st.crowd.forEach((c) => { if (!c.stand && Math.abs(c.x - 1.6) < 0.8 && Math.abs(c.z - 6.6) < 0.8) c.ch.root.visible = false; }); },
    update(ctx, lt) {
      const st = ctx.store; crowdAnim(ctx, st, { mode: 'sleepy' }); djAnim(ctx, { asleep: true });
      const m = ctx.cast.mayor; m.pose('idle', ctx.t, { headPitch: 0.15 }); m.face('sleepy', ctx.t);
      const g = ctx.cast.grandad; g.pose('dance', ctx.t * 0.5, { intensity: 0.4 }); g.face('huss', ctx.t);   // the yawn
      ctx.cam.move({ pos: st.S(0.2, 1.5, 0.6), look: st.S(0.2, 0.2, 8.0), fov: 50 }, { pos: st.S(0.2, 1.4, 1.1), look: st.S(0.2, 0.2, 8.0), fov: 48 }, clamp(lt / 1.7, 0, 1));
      ctx.fx.overlay('#ff9a6a', 0.12);
      stamp(ctx, 'DAY 400', ctx.markers.day400 + 0.05, { y: 0.2 });
    },
  },
  // ── b18 "I have all the beds."  flash → tilt up: the bed tower, right beside the stage
  {
    name: 'all the beds', start: 'b18-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = squareScene(ctx, { light: 'dusk', crowd: false });
      put(ctx, 'burglar', st.S(7.0, G0, 4.7), st.S.yaw + 0.35); sackOnBack(ctx, ctx.cast.burglar);
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.burglar, tb = ctx.markers.beds; djAnim(ctx, { asleep: true });
      b.pose('idle', ctx.t, { intensity: 0.3 }); b.face('smug', OPEN(b));
      const f = humanFace(b);
      if (ctx.t < tb) ctx.cam.set({ pos: f.clone().addScaledVector(st.S.fwd, 2.6).addScaledVector(st.S.left, -0.6).add(up(0.05)), look: f.clone().add(up(-0.1)), fov: 32 });
      else {
        const k = ease.inOutCubic(clamp((ctx.t - tb) / 0.5, 0, 1));
        const top = st.S(8.6, G0 + ctx.props.tower.height, 0.2);
        ctx.cam.move({ pos: st.S(5.2, -0.2, 9.8), look: f, fov: 52 }, { pos: st.S(4.6, -0.3, 11.5), look: top.clone().add(up(-3.5)), fov: 60 }, k);
        ctx.fx.overlay('#ffffff', clamp(1 - (ctx.t - tb) / 0.3, 0, 1));
      }
      ctx.fx.overlay('#ff9a6a', 0.1);
    },
  },
  // ── b19 "Too soft. Too hard. Too Grandad."  night, three beds inside the tower
  ...[['soft', BED_SOFT, 'b19-0.1'], ['hard', BED_HARD, 'b19.w2-0.05'], ['grandad', BED_GRAN, 'b19.w4-0.05']].map(([which, bi, start]) => ({
    name: `too ${which}`, start, set: 'town',
    setup(ctx) {
      const st = ctx.store = squareScene(ctx, { light: 'quiet_night', party: false, crowd: false, mayorMic: false, cakes: false });
      const T = ctx.props.tower, P = ctx.props; T.set({ hide: [bi + 1] }); const bed = T.bed(bi);
      put(ctx, 'burglar', bed.pos, 0);
      if (which === 'soft') { ctx.add(P.pillows); P.pillows.position.copy(bed.at(0, 0.45, 0.25)); P.pillows.quaternion.copy(bed.quat); P.pillows.scale.set(0.9, 0.75, 0.75); }
      if (which === 'hard') { ctx.add(P.limboPillow); P.limboPillow.position.copy(bed.at(0, 0.66, -0.78)); P.limboPillow.quaternion.copy(bed.quat); }
      if (which === 'grandad') { ctx.add(P.toupee); P.toupee.position.copy(bed.at(0.27, 0.63, -0.68)); P.toupee.quaternion.copy(bed.quat); P.toupee.rotateY(-0.4); }
      st.bed = bed;
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.burglar, bed = st.bed;
      const tw = ctx.markers[which];
      if (which === 'soft') { const k = clamp((ctx.t - tw - 0.25) / 0.5, 0, 1); lieOnBed(b, bed, { lift: 0.55 - 1.15 * ease.inQuad(k), z: 0.1 }); lie(b, ctx.t, 'smile', OPEN(b)); }
      if (which === 'hard') {
        const k = clamp((ctx.t - (tw - 0.25)) / 0.25, 0, 1);
        lieOnBed(b, bed, { lift: 0.28 * (1 - ease.inQuad(k)) + 0.08, z: 0.02 }); lie(b, ctx.t, ctx.t > tw ? 'squint' : 'neutral', OPEN(b));
        ctx.cam.punch([tw], ctx.t, 0.14, 0.2);
      }
      if (which === 'grandad') { lieOnBed(b, bed, { lift: 0.02, z: 0.08 }); lie(b, ctx.t, 'sweat', OPEN(b), { headYaw: 0.9 }); }
      const f = humanFace(b);
      const side = bed.at(1, 0, 0).sub(bed.pos).normalize();
      const head = bed.at(0, 0, -1).sub(bed.pos).normalize();
      ctx.cam.set({ pos: bed.at(0, 0.6, -0.2).addScaledVector(side, 2.6).addScaledVector(head, -1.3).add(up(1.4)), look: bed.at(0.1, 0.55, -0.45), fov: 42 });
      ctx.fx.vignette(0.35);
    },
  })),
  // ── b20 "Now in this town, everybody parties. Except me."  the top bed: JUST RIGHT
  {
    name: 'just right', start: 'b20-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = squareScene(ctx, { light: 'quiet_night', party: true, crowd: true, mayorMic: true, cakes: false });
      ctx.set.setLighting?.('party_night');
      const T = ctx.props.tower, bed = T.bed(BED_TOP), P = ctx.props;
      put(ctx, 'burglar', bed.pos, 0);
      ctx.add(P.duvet.root); P.duvet.root.position.copy(bed.pos); P.duvet.root.quaternion.copy(bed.quat);
      st.bed = bed;
    },
    update(ctx, lt) {
      const st = ctx.store, b = ctx.cast.burglar, bed = st.bed, P = ctx.props; crowdAnim(ctx, st); djAnim(ctx);
      const t0 = ctx.time('b20');
      const k = clamp((ctx.t - t0) / 1.4, 0, 1);
      lieOnBed(b, bed, { lift: 0.04, z: 0.08 }); lie(b, ctx.t, 'smile', OPEN(b));
      P.duvet.setCover(lerp(0.55, -0.42, ease.inOutCubic(k)), 1.02, 0.86);
      const side = bed.at(1, 0, 0).sub(bed.pos).normalize();
      ctx.cam.move({ pos: bed.at(0, 0.5, 0.3).addScaledVector(side, 3.4).add(up(2.2)), look: bed.at(0, 0.2, -0.1), fov: 44 },
        { pos: bed.at(0, 0.5, 0.0).addScaledVector(side, 2.6).add(up(1.5)), look: bed.at(0, 0.45, -0.25), fov: 42 }, clamp(lt / 3.2, 0, 1), ease.inOutSine);
      tag(ctx, 'JUST RIGHT', t0 + 0.35, Infinity, { y: 0.17, bg: 'rgba(20,130,60,0.92)' });
    },
  },
  // ── b21 "I'm trying to sleep."  eyes wide; a bass thump hops the bed
  {
    name: 'trying to sleep', start: 'b21-0.1', set: 'town',
    setup(ctx) {
      const st = ctx.store = squareScene(ctx, { light: 'party_night', crowd: false, cakes: false, mayorMic: false });
      const P = ctx.props; put(ctx, 'burglar', V(), 0); ctx.add(P.duvet.root);
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.burglar, P = ctx.props, T = P.tower, th = ctx.markers.thump;
      const d = ctx.t - th;
      const hop = d > 0 && d < 0.25 ? 0.06 * Math.sin(Math.PI * d / 0.25) : 0;
      T.set({ hop, sway: d > 0 ? 0.05 * Math.sin(d * 9) * Math.exp(-d * 2) : 0 });
      const bed = T.bed(BED_TOP);
      lieOnBed(b, bed, { lift: 0.04 + (d > 0 && d < 0.3 ? 0.04 * Math.sin(Math.PI * d / 0.3) : 0), z: 0.08 });
      lie(b, ctx.t, ctx.t < ctx.time('b21.w2') ? 'squint' : 'sweat', OPEN(b));
      P.duvet.root.position.copy(bed.pos); P.duvet.root.quaternion.copy(bed.quat); P.duvet.setCover(-0.42, 1.02, 0.86);
      const f = humanFace(b), head = bed.at(0, 0, -1).sub(bed.pos).normalize();
      const sd = bed.at(1, 0, 0).sub(bed.pos).normalize();
      ctx.cam.set({ pos: f.clone().add(up(1.25)).addScaledVector(head, -1.3).addScaledVector(sd, 0.5), look: f.clone().add(up(0.05)), fov: 38 });
      if (d > 0) ctx.cam.shake(0.3 * Math.exp(-d * 4), ctx.t, 12);
    },
  },
  // ── b22 HUSS ×3 (town) — the crowd jumps; the tower leans left, right, and falls over the square
  ...[0, 1, 2].map((i) => ({
    name: `topple huss #${i + 1}`, start: hussShot('b22', i), set: 'town',
    setup(ctx) {
      const st = ctx.store = squareScene(ctx, { mayorMic: true, cakes: true });
      const P = ctx.props; ctx.add(P.ring.root); P.ring.root.position.copy(st.S(0, G0 + 0.03, 6.5));
    },
    update(ctx) {
      const st = ctx.store, P = ctx.props, hs = hits(ctx, 'b22');
      crowdAnim(ctx, st, { jumpHits: hs }); djAnim(ctx, { slamHits: hs });
      const m = ctx.cast.mayor; m.pose('cheer', ctx.t); m.face('huss', ctx.t);
      const n = hs.filter((h) => h <= ctx.t).length, hit = lastBefore(hs, ctx.t), d = hit != null ? ctx.t - hit : 0;
      P.ring.update(hit != null ? d / 0.7 : -1);
      const leanTo = [0, -0.35, 0.4, 0.4][n], leanFrom = [0, 0, -0.35, 0.4][n];
      const lean = lerp(leanFrom, leanTo, ease.outBack(clamp(d / 0.3, 0, 1)));
      const topple = n >= 3 ? 1.45 * ease.inQuad(clamp(d / 0.5, 0, 1)) : 0;
      P.tower.set({ lean, topple });
      if (i < 2) ctx.cam.set({ pos: st.S(-3.5, 1.4, 19.5), look: st.S(3.5, 4.8, 2.0), fov: 54 });
      else ctx.cam.set({ pos: st.S(-6.5, 1.2, 21.5), look: st.S(2.5, 3.8, 6.0), fov: 58 });
      ctx.cam.punch(hs, ctx.t, 0.12, 0.2); ctx.cam.shake(i === 2 ? 0.25 + 0.5 * clamp(d / 0.4, 0, 1) : 0.12, ctx.t, 90 + i);
    },
  })),
  // ── b23 "Now everybody sleeps. Except me."  beds rain down: three hero landings, then the aftermath
  ...[['grandad', 'b22.end+0.13'], ['mayor', 'b23.w1-0.1'], ['heckler', 'b23.w1+0.22']].map(([who, start], i) => ({
    name: `landing ${who}`, start, set: 'town',
    setup(ctx) {
      const st = ctx.store = fieldScene(ctx, { who: [who] });
      const slot = FIELD_WHO.indexOf(who);
      st.slot = slot; st.tl = ctx.time(start) + 0.17;
      if (who === 'grandad') { const h = ctx.props.grandHat; ctx.add(h, ctx.cast.grandad.joints.head); h.position.set(0, 0.62, 0); h.rotation.set(-0.2, 0, 0.15); }
      if (who === 'mayor') ctx.cast.mayor.setAccessory('topHat', true);
    },
    update(ctx) {
      const st = ctx.store, ch = ctx.cast[who];
      const bed = fieldBed(ctx, st, st.slot, st.tl);
      lieOnBed(ch, bed, { z: 0.08 });
      const landed = ctx.t > st.tl;
      lie(ch, ctx.t, 'sleepy', landed ? SHUT(ch) : OPEN(ch), { arms: who === 'heckler' ? 'point' : 'down' });
      if (who === 'heckler') { armsDown(ch); ch.joints.armR.rotation.set(-1.55, 0, 0); }
      if (who === 'mayor' && landed) { const k = clamp((ctx.t - st.tl) / 0.15, 0, 1); hatOverEyes(ctx, ch); ctx.props.hatOverEyes.position.set(0, lerp(0.58, 0.2, k), 0.03); }
      const f = humanFace(ch), side = bed.at(1, 0, 0).sub(bed.pos).normalize();
      const hd = bed.at(0, 0, -1).sub(bed.pos).normalize(), fp = st.slots[st.slot] ? st.S(st.slots[st.slot].x, G0 + 0.6, st.slots[st.slot].z) : f;
      ctx.cam.set({ pos: fp.clone().addScaledVector(side, 1.4).addScaledVector(hd, -2.0).add(up(1.6)), look: fp.clone().addScaledVector(hd, 0.75), fov: 46 });
      if (landed) { zzz(ctx, 0, f.clone().add(up(0.3)), ctx.t, st.tl + 0.05); ctx.cam.shake(0.25 * Math.exp(-(ctx.t - st.tl) * 8), ctx.t, 30 + i); }
    },
  })),
  {
    name: 'everybody sleeps', start: 'b23.w2-0.03', set: 'town',
    captions: true,
    setup(ctx) {
      const st = ctx.store = fieldScene(ctx, { who: FIELD_WHO, burglar: true });
      st.tl = -1;
    },
    update(ctx) {
      const st = ctx.store, b = ctx.cast.burglar, cat = ctx.cast.cat, tE = ctx.markers.exceptMe;
      FIELD_WHO.forEach((id, k) => {
        const ch = ctx.cast[id], bed = fieldBed(ctx, st, k, -1);
        lieOnBed(ch, bed, { z: 0.08 }); lie(ch, ctx.t, 'sleepy', SHUT(ch));
        if (id === 'mayor') hatOverEyes(ctx, ch);
        if (k < 7) zzz(ctx, k, humanFace(ch).add(up(0.3)), ctx.t + k * 0.4);
      });
      // the cat's bed floats down beside him on 'Except'
      const tl = tE + 0.65, catBed = fieldBed(ctx, st, NF - 1, tl, { float: true, t0: tE });
      lieOnBed(cat, catBed, { z: 0.15 }); cat.root.position.copy(catBed.at(0, 0.52, 0.1));
      cat.root.quaternion.copy(catBed.quat); cat.root.rotateY(Math.PI / 2 + 0.5);
      cat.pose('stare', 0); cat.face('stare', OPEN(cat));
      cat.root.visible = ctx.t > tE - 0.05;
      b.root.position.copy(st.hole); b.root.rotation.set(0, st.S.yaw + 0.3, 0);
      b.pose('crowdSurf', 0, { intensity: 0 }); armsDown(b); b.face('neutral', OPEN(b));
      djAnim(ctx, { asleep: true }); ctx.cast.gerald.pose('peer', 0, { intensity: 0, headPitch: 0.8 }); ctx.cast.gerald.face('sleepy', SHUT(ctx.cast.gerald));
      const f = humanFace(b);
      const k = clamp((ctx.t - tE) / 1.4, 0, 1);
      const bs = V(Math.cos(b.root.rotation.y), 0, -Math.sin(b.root.rotation.y)), bh = V(-Math.sin(b.root.rotation.y), 0, -Math.cos(b.root.rotation.y));
      ctx.cam.move({ pos: f.clone().addScaledVector(bs, -5.2).addScaledVector(bh, -2.5).add(up(4.2)), look: f, fov: 50 },
        { pos: f.clone().addScaledVector(bs, -2.6).addScaledVector(bh, -1.3).add(up(2.1)), look: f, fov: 46 }, ease.inOutCubic(k));
      iris(ctx, ctx.time('b23.end') + 0.25, 0.5);
    },
  },
];

// ── the plaza after the fall
function fieldScene(ctx, { who = [], burglar = false } = {}) {
  setProps3EnvIntensity(0.45);
  ctx.set.setLighting?.('quiet_night'); ctx.set.set?.('partyProps', false); ctx.set.set?.('fireworks', false); ctx.set.set?.('windowGlow', 0.25);
  ctx.set.set?.('standsCrowd', false);
  const S = frameAt(ctx, 'square.stage');
  const P = ctx.props, slots = fieldSlots();
  ctx.add(P.field.root);
  for (let k = 0; k < NF; k++) P.field.set(k, null);
  const st = { S, slots, hole: S(0.1, G0 + 0.02, 8.6) };
  { const y = S.yaw + 0.3; st.catPos = st.hole.clone().add(V(Math.cos(y), 0, -Math.sin(y)).multiplyScalar(1.75)); st.catPos.y = S.origin.y + G0; }
  slots.forEach((s, k) => { const yaw = S.yaw + Math.PI / 2 + s.yaw; P.field.set(k, S(s.x, G0, s.z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw)); });
  who.forEach((id) => { put(ctx, id, V(), 0); });
  if (burglar) { put(ctx, 'burglar', st.hole, S.yaw); put(ctx, 'cat', V(), 0); }
  ctx.add(P.decks.root); P.decks.root.position.copy(S(-4.3, 0, 1.6)); P.decks.root.rotation.set(0, S.yaw + 0.3, 0); P.decks.setOn(false);
  put(ctx, 'gerald', S(-4.15, 0, 1.05), S.yaw + 0.3);
  return st;
}
/** Field bed k at time t: falls in and lands at tl (or floats down slowly with float). Returns a bed frame. */
function fieldBed(ctx, st, k, tl, { float = false, t0 = 0 } = {}) {
  const S = st.S, P = ctx.props;
  const s = k < st.slots.length ? st.slots[k] : { x: 1.9, z: 8.4, yaw: 0.25 };
  const yaw = S.yaw + Math.PI / 2 + s.yaw;
  const quat = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw);
  let y = 0;
  if (float) { if (ctx.t < t0) y = 99; else y = ctx.t < tl ? 3.5 * Math.pow((tl - ctx.t) / (tl - t0), 1.5) : 0; quat.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), 0.15 * Math.sin(ctx.t * 5) * clamp((tl - ctx.t) / 0.6, 0, 1))); }
  else if (ctx.t < tl) y = 90 * (tl - ctx.t) ** 2;
  else { const d = ctx.t - tl; y = d < 0.18 ? 0.12 * Math.sin(Math.PI * d / 0.18) : 0; }
  const pos = k >= st.slots.length && st.catPos ? st.catPos.clone().add(up(y)) : S(s.x, G0 + y, s.z);
  if (y > 50) P.field.set(k, null); else P.field.set(k, pos, quat);
  return { pos, quat, at: (x, yy, z) => V(x, yy, z).applyQuaternion(quat).add(pos) };
}

// the PARTY THIS WAY sign: held in the right hand, board beside the head
function signIn(ctx, b) { ctx.add(ctx.props.partySign); }
function holdSign(ctx, b) {
  b.pose('cheer', 0.4, { intensity: 0.0 });
  b.joints.armL.rotation.set(0.05, 0, 0.12);
  b.joints.armR.rotation.set(-0.35, 0, -0.35);
  b.face('neutral', OPEN(b));
  b.root.updateMatrixWorld(true);
  const s = ctx.props.partySign, hp = b.joints.handR.getWorldPosition(V());
  s.position.copy(hp).add(up(-0.42)); s.rotation.set(0, b.root.rotation.y, 0);
}
