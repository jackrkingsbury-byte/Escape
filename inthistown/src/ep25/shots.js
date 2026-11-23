// TEMP prop test
import * as THREE from 'three';
import { buildTown } from '../world.js';
import { MAIN, EXTRAS } from '../cast.js';
import { makeBiscuit } from '../ep20/props.js';
import { makeChicken, makeTriceratops, makeRaptor, makeStego, makeLongneck, makeFence, makeTower, makeEgg, makeRaceStage, makeStartLine, makeJungleTree } from './props.js';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
export const cast = {
  me: MAIN.me, mayor: MAIN.mayor,
  maya: { id: 'maya', skin: '#c68642', hair: { style: 'long', color: '#1a120c' }, top: { style: 'tee', color: '#ffd23f', accent: '#ff4fa3' }, bottom: { style: 'shorts', color: '#2f4d8a' }, shoes: '#ff4fa3', accessories: ['sash'], sashColor: '#ff4fa3', scale: 0.9 },
  bigm: { id: 'bigm', skin: '#8d5a3b', hair: { style: 'fade', color: '#1a120c' }, top: { style: 'tee', color: '#1d1d22', accent: '#8a5cff', emblem: 'stripe' }, bottom: { style: 'pants', color: '#2a2a30' }, shoes: '#ffffff', accessories: ['sunglasses', 'chain'], scale: 1.08, build: 1.3 },
  mail: { id: 'mail', skin: '#f1c7a1', hair: { style: 'short', color: '#7a4a24' }, top: { style: 'tee', color: '#2f6fc0', accent: '#ffd23f', emblem: 'stripe' }, bottom: { style: 'shorts', color: '#1d3a6a' }, shoes: '#1d1d22', accessories: ['cap', 'mustache'], capColor: '#2f6fc0' },
};
export const lazySets = true;
export const sets = { town: () => buildTown({ seed: 25, banner: ['THE GREAT', 'DINO', 'RACE'] }) };
export function init(ctx) {
  const P = ctx.props;
  P.nug = makeChicken(); P.nug2 = makeChicken(); P.tri = makeTriceratops(); P.rap = makeRaptor(); P.stego = makeStego(); P.ln = makeLongneck();
  P.rex = makeBiscuit(); P.fence = makeFence(); P.tower = makeTower(); P.egg = makeEgg(); P.stage = makeRaceStage(); P.start = makeStartLine();
  P.trees = [1, 2, 3].map((i) => makeJungleTree(i, 11 + i));
}
function addTo(ctx, o, x, y, z, ry = 0, s = null) { ctx.add(o, ctx.set.root); o.position.set(x, y, z); o.rotation.set(0, ry, 0); if (s) o.scale.setScalar(s); return o; }
function ride(ctx, id, seat) { const ch = ctx.cast[id]; ctx.add(ch.root, seat); ch.root.position.set(0, 0, 0); ch.root.rotation.set(0, 0, 0); return ch; }
function straddle(ch, t, o = {}) {
  ch.pose(o.action || 'idle', t, { intensity: 0.3, ...o.params });
  const J = ch.joints; J.legL.rotation.z = 0.4; J.legR.rotation.z = -0.4; if (J.shinL) { J.shinL.rotation.x = 0.15; J.shinR.rotation.x = 0.15; }
}
export const shots = [
  { name: 'kid+nugget', start: 0, set: 'town', setup(ctx) {
      ctx.set.setLighting('day'); ctx.set.set('partyProps', false); ctx.set.set('windowGlow', 0);
      const P = ctx.props; addTo(ctx, P.nug, 0, 0, 0, 0.5); addTo(ctx, P.nug2, 1.6, 0, 0, 0);
      ctx.place('me', V(0, -0.07, 0)); ctx.use('me');
    }, update(ctx) { const P = ctx.props, t = ctx.t; P.nug.userData.set(t, { bob: -0.06 }); P.nug2.userData.set(t, { lid: 0.5, smug: 1 }); straddle(ctx.cast.me, t); ctx.cast.me.root.position.set(0, -0.07, 0); ctx.cast.me.root.rotation.y=0.5; ctx.cast.me.face('smile', 0.5);
      ctx.cam.set({ pos: V(1.5, 1.2, 5.5), look: V(0.8, 0.9, 0), fov: 36 }); } },
  { name: 'riders', start: 1, set: 'town', setup(ctx) {
      ctx.set.setLighting('day'); ctx.set.set('partyProps', false);
      const P = ctx.props; addTo(ctx, P.tri, -4, 0, -2, 0.5); addTo(ctx, P.rap, 1, 0, -2, 0.2); addTo(ctx, P.stego, 5.5, 0, -2, -0.3);
      ride(ctx, 'maya', P.tri.userData.seat); ride(ctx, 'bigm', P.rap.userData.seat);
    }, update(ctx) { const P = ctx.props, t = ctx.t; P.tri.userData.set(t, {}); P.rap.userData.set(t, {}); P.stego.userData.set(t, {});
      ctx.cast.maya.pose('wave', t, { seated: true }); ctx.cast.maya.face('grin', 0.5); ctx.cast.bigm.pose('crossArms', t, { seated: true }); ctx.cast.bigm.face('smug', 0.5);
      ctx.cam.set({ pos: V(4.5, 2.3, 4), look: V(0.0, 1.9, -2), fov: 60 }); } },
  { name: 'giants', start: 2, set: 'town', setup(ctx) {
      ctx.set.setLighting('day'); ctx.set.set('partyProps', false);
      const P = ctx.props; addTo(ctx, P.ln, -8, 0, -1, -PI/2); addTo(ctx, P.rex, 12, 0, 0, -PI/2, 0.85);
      ride(ctx, 'mail', P.ln.userData.seat);
    }, update(ctx) { const P = ctx.props, t = ctx.t; P.ln.userData.set(t, {}); P.rex.userData.set(t, { sit: 0 }); P.rex.userData.parts.tagG.visible = false;
      ctx.cast.mail.pose('wave', t, { seated: true });
      ctx.cam.set({ pos: V(-32, 4, 2), look: V(0, 5, 0), fov: 50 }); } },
  { name: 'fence', start: 3, set: 'town', setup(ctx) {
      ctx.set.setLighting('day'); ctx.set.set('partyProps', false);
      const P = ctx.props; addTo(ctx, P.fence, -37, 0, 0, PI / 2); P.trees.forEach((tr, i) => addTo(ctx, tr, -42 - i * 2, 0, -6 + i * 6));
    }, update(ctx) { ctx.props.fence.userData.set(ctx.t, { fixed: 1 }); ctx.cam.set({ pos: V(-14, 1.6, 3), look: V(-37, 4, 0), fov: 50 }); } },
  { name: 'tower', start: 4, set: 'town', setup(ctx) {
      ctx.set.setLighting('day');
      const P = ctx.props; addTo(ctx, P.tower, 66, 0, -2, -PI / 2); addTo(ctx, P.egg, 40, 0, 0, -PI / 2, 2); addTo(ctx, P.stage, 34, 0, 8, 0); addTo(ctx, P.start, 32, 0, 0, 0);
    }, update(ctx) { const P = ctx.props; P.egg.userData.set(ctx.t, { crack: 1 }); P.tower.userData.set(ctx.t, { swing: 0.3 }); ctx.cam.set({ pos: V(22, 3, 4), look: V(50, 8, 0), fov: 56 }); } },
];
