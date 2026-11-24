/*
 * src/cine01/shots.js — film entry for "The Other Me" (cine01).
 *   node render.mjs --timeline episodes/cine01/timeline.json --shots /src/cine01/shots.js --scale 0.5 --preview 2 \
 *        --previewDir out/<dir> --workers 1 --timeout 2400 [--times 3.2,7.5] [--query "act=2"]
 * Acts are loaded with dynamic imports so a broken act file cannot break the others; ?act=N renders one act only.
 * Shared code: kit.js (look, flash chain, captions, cast, props, pool rig, framings) and sets.js (the four locations).
 */
import * as K from './kit.js';
import { sets as filmSets } from './sets.js';

await K.loadFilm();                         // Blender assets + HDR skies + fonts must exist before the sets are built

export const cast = K.castSpecs;            // me · copy (mirrored double) · captain
export const lazySets = false;              // every set is built at init, in declaration order (bit-exact determinism)
export const captionOptions = { y: 0.62, momY: 0.665 };
export const sets = filmSets;
export const renderFrame = K.makeFilmRenderFrame();
export const drawCaptions = K.drawCaptions;

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const ACT = QS.get('act');
const acts = [];
for (const n of [1, 2, 3, 4]) {
  if (ACT && String(ACT) !== String(n)) continue;
  acts.push(await import(`./act${n}.js`).catch((e) => { console.error(`[cine01] act${n}.js failed to load`, e); return { shots: [] }; }));
}

export async function init(ctx) {
  await K.loadFilm();
  K.initCast(ctx);                          // ctx.props.real.{me, copy, captain} + the white rag on handR
  K.initFilmFaces(ctx);                     // 'creep1' / 'creep' / 'shout' face decals (K.filmFace)
  ctx.props.phone = K.makePhone();          // the kid's phone (map / torch): K.hold(ch, ctx.props.phone, 'R', ctx)
  for (const a of acts) if (typeof a.init === 'function') { try { await a.init(ctx); } catch (e) { console.error('[cine01] act init failed', e); } }
}

const list = acts.flatMap((a) => (Array.isArray(a.shots) ? a.shots : []));
export const shots = list.length ? list : [{
  name: 'fallback (no act loaded)', start: 0, set: 'beachNight', cast: ['me'],
  setup(ctx) { ctx.place('me', 'kidA', { yaw: -Math.PI / 2 }); ctx.cam.set(K.frameA(ctx.set)); },
  update(ctx) { K.filmPose(ctx.cast.me, 'stand', ctx.t); },
  post: K.shotPost({}),
}];
