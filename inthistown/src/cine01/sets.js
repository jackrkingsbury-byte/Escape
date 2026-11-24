/*
 * src/cine01/sets.js — the four locations of "The Other Me". All built at init (lazySets = false), in this order.
 *
 *   beachNight   night storm beach: black sand, surf + glowing foam line, overturned wreck, campfire, debris, rocks,
 *                jungle edge, the cliff headland with the cave mouth at the far end, rain, fog banks, lightning.   b1,2,4–15
 *   beachDusk    the SAME world (shared geometry) under blue-black storm dusk, no fire.                              b3
 *   cave         inside the sea cave: wet rock chamber, the still mirror pool (planar reflection rig), drips, the
 *                mouth with rain and sea outside.                                                                    b16–19, b26–27
 *   boat         dawn: fishing-boat deck in silver fog, calm swell, the island astern dissolving.                    b20–25
 *
 * World axes of the beach: the shoreline runs along X at z = 0. SEA = −Z, INLAND / jungle = +Z, the CLIFF + CAVE are at
 * the −X end (x ≈ −62). The film's cameras look toward −X ("up-frame" = −X): sea on screen right, wreck / jungle left.
 * Every set exposes: anchors (THREE.Vector3, world), heightAt(x, z), options + set(k, v) (engine-restored per shot:
 * use `options: {…}` on the shot or ctx.set.set(k, v) in setup), post (set-level post config → K.shotPost), rig,
 * flashLight / flashDir / bolts (driven by K.flash).
 *
 * beachNight / beachDusk   anchors: kidA, double18/12/9/7/5/4, camp, fire, campCam, wreck, wash, washFeet, phoneSpot,
 *     wideCam, highCam, cave, caveLook, treeLine, mid1..3, cut1..3. extras: campYaw, heightAt, washEdge(x, t), rain, fire,
 *     foam, ocean, wreck, moon (dim rig), bolts[0..3]. options: fire (−1 | 0 | 0..1), rain, rainBack, wash, jungle, wet.
 * cave   anchors: poolCenter, kneel, stand, entry, poolCam, phoneRest, mouth, strike, backCam. extras: pool (mirror rig),
 *     waterY, heightAt, bolts[0..1]. options: pool ('mirror' | 'glass'), ripple, spill, mist, wet (0.8).
 * boat   anchors: seat, deck, wheel, stern, sternCam, railCam, island, rail. extras: deckY, seatH, island, boat.
 *     options: island (true), wet (0.35).  Bow = −Z (bright fog break), stern rail = +Z, island astern at z ≈ 120–250.
 */
import * as THREE from 'three';
import * as K from './kit.js';
import { rng, clamp, lerp, hash } from '../lib/util.js';
import { makeOcean, makeBeach, makeCave, makeCampfire, makeLightRig, makeContactShadow } from '../real/env.js';
import { makeRain, makeSplashes, makeDrips, makeFogCards, makeLightShafts, makeLightning } from '../real/weather.js';
import { RU, triplanar, wetSurface, windSway } from '../real/materials.js';
import { makePerlin, fbm, getPBR, getNoiseTex } from '../real/textures.js';
import { instance, part, pbrMaterial, textureSet, getAsset } from '../real/assets.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const SEA = 0.0;
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// place a Blender asset; `sink` lowers it into the ground
function put(root, name, pos, rotY = 0, scale = 1, o = {}) {
  const obj = o.part ? part(name, o.part, { position: pos, rotationY: rotY, scale }) : instance(name, { position: pos, rotationY: rotY, scale });
  if (o.rot) obj.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
  if (o.shadow === false) obj.traverse((m) => { if (m.isMesh) m.castShadow = false; });
  root.add(obj);
  return obj;
}
// wet look for GLB materials (shared per asset): lower roughness, darker albedo
function wetGLB(obj, { rough = 0.6, dark = 0.75, env = 1 } = {}) {
  const seen = new Set();
  obj.traverse((m) => {
    if (!m.isMesh) return;
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      if (seen.has(mat) || mat.userData.cineWet) continue;
      seen.add(mat); mat.userData.cineWet = true;
      mat.roughness *= rough; mat.color.multiplyScalar(dark); mat.envMapIntensity = env;
    }
  });
  return obj;
}

// ═════════════════════════════════════════════ shore foam band ════════════════════════════════════════════════════
const FOAM_V = /* glsl */`varying vec3 vWP; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const FOAM_F = /* glsl */`
precision highp float;
varying vec3 vWP;
uniform sampler2D tFoam, tNoise; uniform float uTime, uFlash, uAmbient, uGlow, uWash, uFlashK; uniform vec3 uFirePos; uniform vec3 uFireCol;
float washEdge(float x, float t) { return 0.25 + 0.8 * sin(t * 0.52 + x * 0.11) + 0.45 * sin(t * 0.83 + x * 0.29 + 1.7) + 0.2 * sin(t * 1.9 + x * 0.7); }
void main() {
  float n = texture2D(tNoise, vWP.xz * 0.06 + vec2(0.0, uTime * 0.01)).r;
  float n2 = texture2D(tNoise, vWP.xz * 0.23 + vec2(uTime * 0.013, 0.0)).g;
  float edge = washEdge(vWP.x, uTime) + uWash + (n - 0.5) * 1.1;
  float d = edge - vWP.z;                                     // > 0: under the wash
  vec2 q = vec2(vWP.x * 0.21, vWP.z * 0.3 + edge * 0.3);
  float lace = texture2D(tFoam, q).a * 0.55 + texture2D(tFoam, q * 2.7 + vec2(0.3, uTime * 0.02)).a * 0.45;
  float band = smoothstep(-0.03, 0.16, d) * smoothstep(2.6, 0.3, d);
  // milky sheet + brighter lace on top (soft thresholds: foam, not cracks)
  float a = band * (0.3 * smoothstep(0.3, 0.75, n2 + band * 0.3) + 0.7 * smoothstep(0.35, 0.9, lace * 0.75 + n2 * 0.35 + band * 0.25));
  a = max(a, smoothstep(-0.02, 0.05, d) * smoothstep(0.34, 0.07, d) * (0.65 + 0.35 * lace));   // bright leading lip
  a *= smoothstep(-3.6, -2.4, vWP.z) ;
  float fd = length(vWP - uFirePos);
  vec3 lit = vec3(0.78, 0.86, 0.95) * (uAmbient + uGlow) + vec3(0.9, 0.95, 1.0) * uFlash * uFlashK + uFireCol / (1.0 + fd * fd * 0.6);
  gl_FragColor = vec4(lit * a, a * 0.92);
}`;
/** CPU mirror of the wash line: z of the foam's leading edge at x, time t (without the fine noise) */
export const washEdge = (x, t) => 0.25 + 0.8 * Math.sin(t * 0.52 + x * 0.11) + 0.45 * Math.sin(t * 0.83 + x * 0.29 + 1.7) + 0.2 * Math.sin(t * 1.9 + x * 0.7);
function makeFoamBand(heightAt, { x0 = -150, x1 = 70 } = {}) {
  const g = new THREE.PlaneGeometry(x1 - x0, 7.6, Math.round((x1 - x0) * 1.2), 14);
  g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, 0.1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, Math.max(heightAt(p.getX(i), p.getZ(i)), SEA) + 0.02);
  const uniforms = { tFoam: { value: getPBR('foam').map }, tNoise: { value: getNoiseTex(4, 256) }, uTime: RU.uTime, uFlash: RU.uFlash, uAmbient: { value: 0.05 },
    uGlow: { value: 0.03 }, uWash: { value: 0 }, uFlashK: { value: 0.55 }, uFirePos: { value: V3(0, -100, 0) }, uFireCol: { value: new THREE.Color(0, 0, 0) } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: FOAM_V, fragmentShader: FOAM_F, uniforms, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, fog: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.renderOrder = 5; m.name = 'foamBand'; m.frustumCulled = false;
  return { root: m, mesh: m, uniforms };
}

// ═════════════════════════════════════════════ the beach world (shared by beachNight / beachDusk) ═════════════════
// the wreck: centre [x, z] and the yaw of its open side (the lean-to opens toward CN: inland and a little toward frame A)
const WRECK = [-8.2, 4.6], CAMP_YAW = 0.7, CN = [Math.sin(CAMP_YAW), Math.cos(CAMP_YAW)];
let _world = null;
function beachWorld(ctx) {
  if (_world) return _world;
  const root = new THREE.Group(); root.name = 'beachWorld';
  const parts = [];
  const add = (p) => { if (!p) return p; if (p.root) root.add(p.root); else if (p.isObject3D) root.add(p); if (p.update) parts.push(p); return p; };
  const r = rng(101);

  // ── ground + sea
  const BS = [280, 160];
  const beach = add(makeBeach({ size: BS, center: [-40, 48], shoreZ: 0, slope: 0.07, wetBand: 6.5, segments: 220, seed: 2 }));
  // flatten the dune noise near the waterline: a straight shore, so the foam band runs dead straight up frame A
  const slopeAt = (z) => 0.07 * z + Math.max(0, z - 25) * 0.05;
  // (and a steeper sea bed below the waterline, so wave troughs never expose sand)
  const H0 = (x, z) => { const b = slopeAt(z); return b + (beach.heightAt(x, z) - b) * lerp(0.1, 1, sstep(1.5, 13, Math.abs(z))) - 0.24 * Math.max(0, -z - 1.2); };
  { const p = beach.mesh.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, H0(p.getX(i), p.getZ(i))); p.needsUpdate = true; beach.mesh.geometry.computeVertexNormals(); }
  const H = (x, z) => Math.max(H0(x, z), SEA - 0.05);          // standing height (never below the wash)
  { // Blender wet-sand albedo + normal on the kit's wet-band / puddle shader; volcanic black sand
    const ts = textureSet('wet_sand');
    const cl = (t) => { const c = t.clone(); c.repeat.set(BS[0] / 2.2, BS[1] / 2.2); c.anisotropy = 8; c.needsUpdate = true; return c; };
    beach.sand.map = cl(ts.map); beach.sand.normalMap = cl(ts.normalMap); beach.sand.normalScale.set(1.1, 1.1);
    beach.sand.color.set('#b4b7bd'); beach.sand.envMapIntensity = 1.0; beach.sand.needsUpdate = true;
  }
  const ocean = add(makeOcean({ size: 760, segments: 300, level: SEA, shore: { z: 0, slope: 0.2 }, scale: 1.15, color: '#060b0e', deepColor: '#020405', foam: 0.9, roughness: 0.1 }));
  const foam = add(makeFoamBand(H0));

  // ── marks
  const P = (x, z, dy = 0) => V3(x, H(x, z) + dy, z);
  const A = {
    kidA: P(0, 0.75),                                       // frame A: the kid, facing −X (yaw −π/2)
    double18: P(-18, 0.55), double12: P(-12, 0.6), double9: P(-9, 0.75), double7: P(-7, 0.95), double5: P(-5, 1.3), double4: P(-3.6, 2.4),
    camp: P(WRECK[0] + CN[0] * 0.75, WRECK[1] + CN[1] * 0.75),   // huddle spot under the raised gunwale, facing the fire (yaw set.campYaw)
    fire: P(WRECK[0] + CN[0] * 2.7, WRECK[1] + CN[1] * 2.7),
    campCam: P(WRECK[0] + CN[0] * 5.3, WRECK[1] + CN[1] * 5.3, 0.5),   // beat 7: low behind the flames, looking back at the kid, hull and sea
    wash: P(8, 1.4),                                        // beat 3: where he lies among the debris (head toward +X, yaw π/2)
    washFeet: P(8.5, -1.3),                                 // the double's sneakers in the foam at the top of the beat 3 frame
    phoneSpot: P(1.2, 2.2),                                 // beats 4–6: standing a few steps up from the foam, facing +X-ish
    wideCam: P(15, 0.4, 1.1),                               // beat 12: from the waterline toward the cliff (look at anchors.cave)
    highCam: V3(17, 10.5, 5.5),                             // beat 15: high side wide down the beach to the cave
    cave: P(-57.6, 1.0),                                    // the cave mouth threshold (stand here = "inside the mouth"); the hole faces +X
    caveLook: V3(-60, 3.0, 1.0),
    treeLine: P(-20, 13.5),
    mid1: P(-22, 3.2), mid2: P(-36, 2.6), mid3: P(-50, 1.8),                     // the kid's three flash positions of beat 15
    cut1: P(-20.5, 7.6), cut2: P(-34, 8.2), cut3: P(-49.5, 7.2),                 // the double: always between him and the trees
  };

  // ── the wreck: overturned rowing boat as a lean-to (keel up, seaward gunwale in the sand, inland gunwale raised)
  const wreck = new THREE.Group(); wreck.name = 'wreck';
  {
    const hull = part('wreck_boat', 'wreck_boat', { scale: 1.3 });
    hull.rotation.set(-2.6, 0, 0);
    const piv = new THREE.Group(); piv.add(hull); piv.rotation.y = CAMP_YAW;
    wreck.add(piv);
    wreck.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(wreck), c = bb.getCenter(V3());
    const wx = WRECK[0], wz = WRECK[1];
    wreck.position.set(wx - c.x, H(wx, wz - 1.2) - 0.14 - bb.min.y, wz - c.z);
    wetGLB(wreck, { rough: 0.7, dark: 0.8 });
    wreck.traverse((m) => { if (m.isMesh && /fabric|cloth|sail|canvas/i.test(m.material.name || '')) { m.material.roughnessMap = null; m.material.roughness = 1; m.material.normalScale.set(0.2, 0.2); m.material.needsUpdate = true; } });
    root.add(wreck);
    A.wreck = V3(wx, H(wx, wz) + 1.2, wz);
    // a driftwood prop under the raised gunwale

  }
  // ── campfire (level driven by the `fire` option)
  const fire = add(makeCampfire({ scale: 0.8, intensity: 1.0, embers: 50, seed: 12 }));
  fire.root.position.copy(A.fire); fire.root.position.y += 0.02;
  const fireFill = fire.root.children.find((o) => o.isPointLight && o !== fire.light);
  const fireAsh = fire.root.children.find((o) => o.isMesh && o.geometry.type === 'CircleGeometry');
  fire.light.distance = 16; fire.light.decay = 2;

  // ── debris
  const deb = [
    ['planks', 'plank_broken', [6.8, 2.2], 0.5], ['planks', 'hull_fragment', [9.4, 1.9], 2.1], ['planks', 'plank_long', [8.9, 3.3], -0.3],
    ['planks', 'plank_splintered', [6.1, 0.6], 1.2], ['planks', 'plank_short', [10.2, 0.7], 0.2], ['planks', 'plank_long', [-2.3, 3.0], 1.3],
    ['planks', 'plank_broken', [-11.7, 7.4], -0.6], ['planks', 'plank_short', [-3.1, 6.3], 0.9], ['planks', 'plank_splintered', [-12.8, 2.6], 0.3],
    ['driftwood_logs', 'driftwood_log', [-14.5, 8.5], 0.4], ['driftwood_logs', 'driftwood_twisted', [3.5, 6.4], 1.9], ['driftwood_logs', 'driftwood_log', [-27, 6.2], -0.2],
  ];
  for (const [n, pn, [x, z], ry] of deb) wetGLB(put(root, n, [x, H(x, z) + 0.01, z], ry, 1, { part: pn }), { rough: 0.7, dark: 0.8 });
  { const m = part('wreck_boat', 'wreck_mast', { scale: 1.2 }); m.position.set(9.2, H(9.2, 0.4) + 0.04, 0.4); m.rotation.y = 0.35; wetGLB(m, { rough: 0.7, dark: 0.85 }); root.add(m); }
  wetGLB(put(root, 'rope_coil', [6.6, H(6.6, 3.0) + 0.01, 3.0], 0.4, 1.0), { rough: 0.8, dark: 0.8 });
  wetGLB(put(root, 'crate', [-9.6, H(-9.6, 8.2) - 0.06, 8.2], 0.5, 1.0, { rot: [0.05, 0.5, 0.12] }), { rough: 0.7, dark: 0.8 });
  wetGLB(put(root, 'crate', [11.2, H(11.2, 2.6) - 0.1, 2.6], 1.9, 0.9, { rot: [0.3, 1.9, 0.1] }));

  // ── rocks (in the surf and up the beach; the foam line itself stays clear for frame A)
  const rocks = [
    ['rock_boulder', [-13, -3.2], 2.4, 0.4], ['rock_slab', [-9.5, -4.6], 2.2, 1.1], ['rock_spire', [-24, -4.2], 2.6, 2.0], ['rock_block', [-31, -2.6], 3.4, 0.7],
    ['rock_mossy_big', [-44, -3.5], 2.2, 1.6], ['rock_boulder', [-52, -2.2], 2.8, 2.7], ['rock_spire', [-55, -6.5], 3.0, 0.3], ['rock_slab', [-47, 6.5], 2.6, 0.2],
    ['rock_mossy', [-17, 9.5], 1.5, 0.9], ['rock_boulder', [-33, 9.8], 1.9, 2.2], ['rock_mossy_big', [-53, 10.5], 2.4, 0.4], ['rock_block', [-57, 9.6], 3.4, 1.3],
    ['rock_boulder', [5.5, -3.4], 1.8, 1.0], ['rock_slab', [13, 6.2], 1.8, 0.6], ['rock_spire', [-58.5, -3.4], 3.2, 1.2], ['rock_mossy', [20, 8], 1.6, 2.6],
  ];
  for (const [n, [x, z], s, ry] of rocks) wetGLB(put(root, n, [x, Math.min(H0(x, z), SEA) - 0.12 * s, z], ry, s), { rough: 0.55, dark: 0.7 });

  // ── cliff headland + cave mouth at the −X end
  {
    const arch = put(root, 'cave_arch', [-66.5, H0(-60, 3.6) - 2.3, -1.6], Math.PI / 2, 1.75);
    arch.traverse((m) => { if (m.isMesh) { const mt = m.material; mt.color.multiplyScalar(0.5); mt.roughnessMap = null; mt.metalnessMap = null; mt.roughness = 0.9; mt.metalness = 0; mt.envMapIntensity = 0.4; mt.needsUpdate = true; } });
    // the headland: sea stacks side by side (jagged, stratified faces) on a base of low cliff blocks; all matte, fog does the rest
    const matte = (o) => { o.traverse((m) => { if (m.isMesh && !m.material.userData.cineMatte) { const mt = m.material; mt.userData.cineMatte = true; mt.color.multiplyScalar(0.55); mt.roughnessMap = null; mt.metalnessMap = null; mt.roughness = 0.97; mt.metalness = 0; mt.envMapIntensity = 0.35; mt.needsUpdate = true; } }); return o; };
    const stacks = [[-84, -6, 38, 2.4, [4.0, 3.9, 4.4]], [-89, -4, 6, 1.2, [4.6, 4.6, 5.0]], [-92, -6, 74, 5.0, [4.6, 4.2, 5.0]], [-79, -5, 22, 4.1, [2.6, 2.7, 3.0]],
      [-98, -6, 112, 2.0, [5.2, 3.6, 5.4]], [-84, -6, -15, 0.6, [2.8, 2.2, 3.0]]];
    for (const [x, y, z, ry, sc] of stacks) matte(put(root, 'sea_stack', [x, y, z], ry, sc));
    for (const [x, y, z, ry, sc] of [[-74, -3, 30, 0.2, [1.8, 1.5, 2.0]], [-76, -2, 58, 0.1, [2.4, 1.8, 2.4]]]) matte(put(root, 'cliff_wall', [x, y, z], Math.PI / 2 + ry, sc));
    matte(put(root, 'sea_stack', [-70, -2, -30], 0.4, 1.7));           // the headland's last tooth, off the point
    matte(put(root, 'sea_stack', [-150, -3, -70], 2.1, 2.8));
    // the void behind the mouth: nothing may show through the arch
    const voidM = new THREE.Mesh(new THREE.BoxGeometry(9, 9, 8), new THREE.MeshBasicMaterial({ color: '#000000', fog: false }));
    voidM.position.set(-70, 4, 0.6); root.add(voidM);
  }

  // ── jungle edge: palms on the sand, kapok / fig giants behind, undergrowth at their feet
  const veg = new THREE.Group(); veg.name = 'jungle'; root.add(veg);
  const palms = [[-44, 22, 0.95], [-36, 15, 1.2], [-29.5, 19.5, 1.0], [-23, 15.5, 1.15], [-16, 20, 0.9], [-9.5, 16.5, 1.1], [-3, 21, 1.0], [4, 16, 1.2],
    [10.5, 20.5, 0.95], [17, 15.5, 1.05], [24, 19, 1.1], [31, 16, 0.9], [-12.5, 24.5, 1.2], [-33, 25, 1.1], [7, 26, 1.0]];
  palms.forEach(([x, z, s], i) => put(veg, i % 2 ? 'palm_b' : 'palm_a', [x, H(x, z) - 0.25, z], r() * 6.28, s));
  const giants = [[-58, 34, 'tree_kapok', 0.95], [-38, 38, 'tree_fig', 1.05], [-21, 33, 'tree_kapok', 1.0], [-4, 40, 'tree_fig', 0.95], [13, 34, 'tree_kapok', 1.05], [30, 39, 'tree_fig', 1.0],
    [-48, 52, 'tree_kapok', 1.15], [-12, 55, 'tree_kapok', 1.2], [22, 54, 'tree_kapok', 1.1]];
  giants.forEach(([x, z, n, s]) => put(veg, n, [x, H(x, z) - 0.4, z], r() * 6.28, s, { shadow: false }));
  for (let i = 0; i < 46; i++) {
    const x = -62 + r() * 98, z = 12.5 + r() * 12, n = ['fern_a', 'fern_b', 'undergrowth_broadleaf'][i % 3];
    put(veg, n, [x, H(x, z) - 0.03, z], r() * 6.28, 0.9 + r() * 0.9, { shadow: false });
  }
  // storm wind in the foliage (GLB foliage materials are shared → patch once)
  // (fronds only; small amplitudes so crowns never leave their static trunks: palms ≤ 0.2 m at 12 m, canopies ≤ 0.2 m at 30 m)
  { const seen = new Set(); veg.traverse((m) => { if (m.isMesh && m.material.alphaTest > 0 && !seen.has(m.material)) { seen.add(m.material);
    const n = m.material.name || '', amp = /palm/i.test(n) ? 0.0012 : /under|fern|banana|heart/i.test(n) ? 0.02 : 0.00022;
    windSway(m.material, { amp, freq: 1.7, heightScale: 1, flutter: 0.025 }); } }); }

  // ── weather
  const rain = add(makeRain({ count: 6500, box: [26, 17, 26], speed: 10.5, wind: [-3.2, 1.2], length: 0.62, opacity: 0.32, lightDir: [-0.75, 0.3, -0.5], backlight: 3.2, far: 24 }));
  const splashes = add(makeSplashes({ count: 650, radius: 9, heightAt: (x, z) => Math.max(H0(x, z), SEA), size: 0.1, opacity: 0.4 }));
  const fogSea = add(makeFogCards({ count: 18, area: [150, 70], center: [-55, -22], y: [1.0, 7], size: [22, 46], opacity: 0.16, drift: [0.12, 0, 0.04], color: '#59646b', seed: 7, fadeNear: 6 }));
  const fogLand = add(makeFogCards({ count: 12, area: [120, 26], center: [-40, 20], y: [1.5, 9], size: [18, 34], opacity: 0.12, drift: [0.08, 0, -0.02], color: '#4d575d', seed: 17, fadeNear: 6 }));

  // ── light
  const rig = makeLightRig('night', { shadows: false, target: [-3, 1, 3], keyDir: [-0.7, 0.5, -0.5] });
  root.add(rig.root);
  const flashLight = new THREE.DirectionalLight('#dfe9ff', 0);
  flashLight.castShadow = true; flashLight.shadow.mapSize.set(2048, 2048); flashLight.shadow.bias = -0.0005; flashLight.shadow.normalBias = 0.03; flashLight.shadow.radius = 2;
  Object.assign(flashLight.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 140 });
  flashLight.target.position.set(-5, 0, 3); flashLight.position.set(-50, 25, -28);
  root.add(flashLight, flashLight.target);
  // bolts over the sea up-frame (index 0, 1) and inland behind the palms (2), behind the cliff (3)
  const lightning = makeLightning({ light: false, strikes: [
    { t: 0, pos: [-134, 88, -36], ground: [-126, 0, -25], seed: 3, power: 1, width: 0.3 }, { t: 0, pos: [-116, 84, -64], ground: [-126, 0, -46], seed: 9, power: 1, width: 0.3 },
    { t: 0, pos: [-60, 150, 150], ground: [-48, 20, 120], seed: 5, power: 1 }, { t: 0, pos: [-190, 170, 20], ground: [-170, 30, 8], seed: 14, power: 1 } ] });
  root.add(lightning.root);
  const bolts = lightning.bolts.map((b) => b.mesh);

  _world = { root, parts, beach, ocean, foam, fire, fireFill, fireAsh, rain, splashes, fogSea, fogLand, rig, flashLight, bolts, wreck, anchors: A, heightAt: H, veg };
  return _world;
}

const BEACH_STATES = {
  night: { key: 0.3, fill: 0.1, rim: 0.35, foamAmb: 0.15, fog: '#59646b', fogOp: [0.22, 0.16], rain: 0.3, seaFoam: 0.9 },
  dusk: { key: 2.2, fill: 0.7, rim: 0.9, seaFoam: 0.45, foamAmb: 0.3, fog: '#8d99a1', fogOp: [0.2, 0.14], rain: 0.4 },
};
function beachSet(ctx, state, cfg) {
  const world = beachWorld(ctx);
  const S = BEACH_STATES[state];
  const set = K.realSet(ctx, {
    ...cfg,
    build: ({ set }) => {
      set.flashLight = world.flashLight; set.bolts = world.bolts; set.defaultBolt = null; set.flashDir = [-0.55, 0.38, -0.75]; set.flashPower = 2.0; set.flashPost = 0.75;
      set.wind = [-3.0, 1.0];
      return { world, campYaw: CAMP_YAW, anchors: world.anchors, heightAt: world.heightAt, rain: world.rain, fire: world.fire, foam: world.foam, ocean: world.ocean, wreck: world.wreck, washEdge };
    },
  });
  /**
   * options (shot `options: {…}` or ctx.set.set(k, v) in setup; restored by the engine at every shot change):
   *   fire   −1 no campfire at all · 0 dead (charred logs, a wisp of smoke) · 0..1 burning level (light + flames)
   *   rain   × on the rain opacity (1) ; rainBack: backlight × (1)
   *   wash   extra reach of the foam wash up the beach, metres (0)
   *   jungle true: palms / giants visible
   *   wet    rain-soak 0..1 of the kid and the double (0.95)
   */
  set.options = { fire: state === 'dusk' ? -1 : 1, rain: 1, rainBack: 1, wash: 0, jungle: true, wet: 0.95 };
  set.set = (k, v) => { set.options[k] = v; };
  const baseUpdate = set.update;
  const fc = new THREE.Color();
  set.update = (t) => {
    if (world.root.parent !== set.root) set.root.add(world.root);
    baseUpdate(t);
    for (const p of world.parts) p.update(t, ctx.camera);
    const o = set.options, w = world;
    w.rig.key.intensity = S.key; w.rig.fill.intensity = S.fill; w.rig.rim.intensity = S.rim;
    w.foam.uniforms.uAmbient.value = S.foamAmb; w.foam.uniforms.uWash.value = o.wash; w.ocean.uniforms.uFoam.value = S.seaFoam;
    w.fogSea.uniforms.uColor.value.set(S.fog); w.fogSea.uniforms.uOpacity.value = S.fogOp[0]; w.fogLand.uniforms.uColor.value.set(S.fog); w.fogLand.uniforms.uOpacity.value = S.fogOp[1];
    w.rain.uniforms.uOpacity.value = S.rain * o.rain; w.rain.uniforms.uBacklight.value = 3.2 * o.rainBack;
    w.veg.visible = !!o.jungle;
    // campfire level (fire.update(t) already ran with level 1)
    const lv = o.fire;
    w.fire.root.visible = lv >= 0;
    const L = clamp(lv, 0, 1);
    w.fire.light.intensity *= L; if (w.fireFill) w.fireFill.intensity *= L;
    w.fire.flames.visible = L > 0.02; w.fire.flames.material.uniforms.uIntensity.value = 0.6 * L;
    if (w.fireAsh) w.fireAsh.material.emissiveIntensity = 0.6 * (0.12 + 0.88 * L);
    w.fire.flames.scale.set(1, 0.35 + 0.65 * L, 1);
    if (w.fire.embers) w.fire.embers.visible = L > 0.02;
    if (w.fire.smoke) w.fire.smoke.material.uniforms.uOpacity.value = lerp(0.2, 0.32, L);
    fc.setRGB(1.0, 0.42, 0.12).multiplyScalar(0.5 * L * (lv >= 0 ? 1 : 0));
    w.foam.uniforms.uFireCol.value.copy(fc); w.foam.uniforms.uFirePos.value.copy(w.anchors.fire);
  };
  set.moon = world.rig;      // dim moon/sky rig (not touched by K.flash: the flash is set.flashLight)
  return set;
}

// ═════════════════════════════════════════════ cave ═══════════════════════════════════════════════════════════════
function caveSet(ctx) {
  const POOL = { c: [0, -2.6], rx: 3.0, rz: 2.3, y: -0.14 };
  return K.realSet(ctx, {
    hdr: 'storm_night',
    env: { intensity: 0.1, rotation: 0, flash: 0.25 }, bg: { intensity: 0.9, rotation: 0.6, flash: 6 },
    exposure: 1.15,
    post: {
      // fog only beyond the chamber: the mouth becomes a soft grey veil (and goes white in a flash)
      fog: { color: [0.11, 0.135, 0.16], density: 0.07, height: 0, falloff: 0.05, start: 12.5, noise: 0.5, noiseScale: 0.08, wind: [0.2, 0, 0.3], sunDir: [0, 0.25, 1], sunColor: [0.8, 0.9, 1], glow: 0.7, glowPower: 3, sky: 1 },
      bloom: { strength: 0.1, threshold: 1.25 },
      grade: { saturation: 0.3, temperature: -0.34 },
    },
    build: ({ add, set, root }) => {
      const R = 9, L = 1.6, HT = 0.62;
      const cave = add(makeCave({ radius: R, length: L, height: HT, seed: 8, pool: false, drips: 12 }));
      cave.root.traverse((o) => { if (o.isMesh && o.geometry.type === 'CircleGeometry') o.visible = false; });   // the kit's flat floor → ours with a basin
      // floor with the pool basin
      const N = makePerlin(88);
      const ell = (x, z) => Math.hypot((x - POOL.c[0]) / POOL.rx, (z - POOL.c[1]) / POOL.rz);
      const heightAt = (x, z) => {
        const base = -0.02 + 0.13 * fbm(N, x * 0.18 + 3.1, z * 0.18 + 1.7, 4, 256) + 0.03 * fbm(N, x * 0.9, z * 0.9, 2, 256);
        const d = ell(x, z);
        const basin = d < 1.12 ? -2.6 * Math.pow(clamp((1.12 - d) / 0.55, 0, 1), 1.4) : 0;
        const lip = 0.04 * Math.exp(-Math.pow((d - 1.28) / 0.16, 2));
        return base + basin + lip;
      };
      const fg = new THREE.PlaneGeometry(24, 34, 150, 200); fg.rotateX(-Math.PI / 2);
      const fp = fg.attributes.position;
      for (let i = 0; i < fp.count; i++) fp.setY(i, heightAt(fp.getX(i), fp.getZ(i)));
      fg.computeVertexNormals();
      const floorMat = new THREE.MeshStandardMaterial({ color: '#8a8782', roughness: 0.9 });
      triplanar(floorMat, 'rock', { scale: 0.4, bump: 1.6 });
      wetSurface(floorMat, { wet: 0.9, puddles: 0.4, puddleScale: 0.14, puddleLevel: 0.5, ripples: 0.5 });
      const floor = new THREE.Mesh(fg, floorMat); floor.receiveShadow = true; floor.name = 'caveFloor'; root.add(floor);
      // the pool
      const pool = K.makeMirrorPool(ctx, { rx: POOL.rx * 1.1, rz: POOL.rz * 1.1, y: POOL.y, center: POOL.c, color: '#010304', res: 0.6,
        drips: [[-1.9, -1.5, 3.3, 0.15], [1.7, -1.75, 4.6, 0.6], [0.2, -2.1, 5.9, 0.85]] });
      root.add(pool.root);
      // wet rocks walling the pool (gaps: the kneel edge at +z and the camera edge at −z) + stalagmites
      const rr = rng(31), names = ['rock_boulder', 'rock_slab', 'rock_block', 'rock_mossy', 'rock_spire', 'rock_boulder'];
      for (let i = 0; i < 15; i++) {
        const a = (i / 15) * Math.PI * 2 + 0.2;
        if (Math.abs(Math.sin(a)) > 0.9 && Math.abs(Math.cos(a)) < 0.42) continue;       // keep the two ends of the z axis open
        const k = 1.2 + rr() * 0.16, x = POOL.c[0] + Math.cos(a) * POOL.rx * k, z = POOL.c[1] + Math.sin(a) * POOL.rz * k;
        const n = names[i % names.length], s = n === 'rock_block' ? 1.6 + rr() : n === 'rock_spire' ? 0.8 + rr() * 0.5 : 0.75 + rr() * 0.6;
        wetGLB(put(root, n, [x, heightAt(x, z) - 0.12, z], rr() * 6.28, s), { rough: 0.45, dark: 0.55 });
      }
      for (const [x, z, s] of [[-5.2, -6.8, 2.2], [5.6, -4.4, 2.8], [-6.4, 1.6, 1.8], [6.3, 3.4, 2.4], [-4.3, 6.5, 1.6], [3.8, 8.6, 2.0], [-2.6, -9.6, 3.0], [2.2, -10.8, 2.2]])
        wetGLB(put(root, 'rock_spire', [x, heightAt(x, z) - 0.2, z], rr() * 6.28, s), { rough: 0.45, dark: 0.55 });
      for (const [x, z, s, n] of [[-6.8, -2.6, 1.8, 'rock_mossy_big'], [6.9, -0.6, 1.5, 'rock_boulder'], [-3.4, 3.2, 1.1, 'rock_slab'], [4.2, 4.6, 1.4, 'rock_block']])
        wetGLB(put(root, n, [x, heightAt(x, z) - 0.15, z], rr() * 6.28, s), { rough: 0.45, dark: 0.55 });
      // drips from the stalactites; mist over the water
      add(makeDrips({ points: cave.dripTips.filter((p) => ell(p.x, p.z) > 0.8), floorY: (i, p) => heightAt(p.x, p.z) + 0.02, period: [1.4, 3.6] }));
      const mist = add(makeFogCards({ count: 9, area: [9, 9], center: [0, -1.5], y: [0.15, 1.5], size: [3.5, 6], opacity: 0.07, drift: [0.03, 0, 0.02], color: '#5a6870', seed: 3, fadeNear: 1.2 }));
      // outside the mouth: sea, rain curtain, fog bank
      const mz = cave.mouth.z;
      const ocean = add(makeOcean({ size: 500, segments: 150, level: -0.9, scale: 0.9, color: '#060b0e', deepColor: '#020405', foam: 1.3 }));
      ocean.mesh.position.z = mz + 245;
      const shelf = new THREE.Mesh(new THREE.PlaneGeometry(60, 12, 1, 1).rotateX(-Math.PI / 2), floorMat); shelf.position.set(0, -0.35, mz + 3); root.add(shelf);
      add(makeRain({ count: 5000, box: [34, 16, 36], speed: 10, wind: [1.2, 0.4], length: 0.65, opacity: 0.5, lightDir: [0, 0.2, 1], backlight: 3.5, far: 34, clip: { min: [-60, -5, mz - 0.6], max: [60, 40, 220] } }));
      add(makeFogCards({ count: 8, area: [50, 24], center: [0, mz + 20], y: [0.5, 6], size: [12, 22], opacity: 0.2, drift: [0.1, 0, 0.02], color: '#6c7880', seed: 23, fadeNear: 3 }));
      // lights: a cold spill from the mouth, the flash from outside, bolt in the sea just beyond the mouth
      const rig = makeLightRig('cave', { target: [0, 1, 0], intensity: 0.55 });
      root.add(rig.root); set.rig = rig;
      const spill = new THREE.PointLight('#9fb8d0', 9, 30, 1.6); spill.position.set(0, 2.6, mz - 2.5); root.add(spill);
      const flashLight = new THREE.DirectionalLight('#e2ecff', 0);
      flashLight.target.position.set(0, 0.5, -2); flashLight.position.set(0, 14, 50); root.add(flashLight, flashLight.target);
      const lightning = makeLightning({ light: false, strikes: [{ t: 0, pos: [6, 90, mz + 62], ground: [1.5, -0.9, mz + 26], seed: 21, power: 1, width: 1.3 }, { t: 0, pos: [-30, 120, mz + 150], ground: [-18, -0.9, mz + 110], seed: 4, power: 1 }] });
      root.add(lightning.root);
      set.flashLight = flashLight; set.bolts = lightning.bolts.map((b) => b.mesh); set.defaultBolt = null; set.flashDir = [0, 0.27, 1]; set.flashPower = 2.2;
      const kz = POOL.c[1] + POOL.rz * 1.1 + 0.12, yk = heightAt(0, kz);
      const anchors = {
        poolCenter: V3(POOL.c[0], POOL.y, POOL.c[1]),
        kneel: V3(0, yk, kz),                                    // kneel here facing −Z (yaw π): knees at the water's edge
        stand: V3(0.5, heightAt(0.5, 2.2), 2.2),                 // beat 16: standing with the torch, mouth behind him
        entry: V3(0.6, heightAt(0.6, 8.5), 8.5),
        poolCam: V3(0, POOL.y + 0.2, POOL.c[1] - POOL.rz + 0.3),    // over the water at the far edge, a hand above the surface (split-level camera)
        phoneRest: V3(0.5, heightAt(0.5, kz - 0.02) + 0.02, kz - 0.02),   // beside his knees, at the water's edge
        mouth: cave.mouth.clone(), strike: V3(1.5, -0.9, mz + 26),
        backCam: V3(-0.6, 1.5, -8.2),                            // deep in the cave looking out past the pool to the mouth
      };
      set.options = { pool: 'mirror', ripple: 1, spill: 1, mist: 1, wet: 0.8 };
      set.set = (k, v) => { set.options[k] = v; };
      set.onUpdate = () => {
        const o = set.options;
        pool.begin();
        if (pool.mode !== o.pool) pool.setMode(o.pool);
        pool.uniforms.uRipple.value = o.ripple;
        spill.intensity = 9 * o.spill;
        mist.uniforms.uOpacity.value = 0.07 * o.mist;
      };
      return { cave, pool, waterY: POOL.y, heightAt, anchors, spill, mist, poolSpec: POOL };
    },
  });
}

// ═════════════════════════════════════════════ boat (dawn) ════════════════════════════════════════════════════════
function boatSet(ctx) {
  const DECK = 1.15;
  return K.realSet(ctx, {
    hdr: 'storm_day',
    // storm_day's bright break is at −Z = over the bow: the wheelhouse and the captain are backlit silhouettes
    env: { intensity: 0.85, rotation: 0, flash: 0 }, bg: { intensity: 1.0, rotation: 0, flash: 0 },
    exposure: 1.05,
    post: {
      fog: { color: [0.62, 0.66, 0.69], density: 0.016, height: 0, falloff: 0.012, start: 3, noise: 0.45, noiseScale: 0.02, wind: [0.6, 0, 0.2], sunDir: [0, 0.14, -1], sunColor: [1, 0.98, 0.95], glow: 0.5, glowPower: 5, sky: 0.85 },
      bloom: { strength: 0.14, threshold: 1.1 },
      grade: { saturation: 0.3, temperature: -0.22, contrast: 1.32, blackPoint: 0.03 },
    },
    build: ({ add, set, root }) => {
      set.rainAmount = 0; set.wind = [0.6, 0.2];
      const ocean = add(makeOcean({ size: 900, segments: 260, level: 0, scale: 0.34, color: '#141c20', deepColor: '#070b0d', foam: 0.1, roughness: 0.16 }));
      const boat = new THREE.Group(); boat.name = 'boat'; root.add(boat);
      const wood = (o = {}) => { const m = pbrMaterial('wood_planks', { roughness: 0.62, color: '#8d9297', ...o }); return m; };
      const box = (w, h, d, mat, x, y, z, ry = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.castShadow = true; m.receiveShadow = true; boat.add(m); return m; };
      const HW = 2.25, ZB = -5.6, ZS = 5.0;                     // half beam, bow end, stern end (deck)
      // deck: planks run fore-aft (texture U → Z)
      { const g = new THREE.PlaneGeometry(ZS - ZB, HW * 2, 1, 1); g.rotateX(-Math.PI / 2); g.rotateY(Math.PI / 2);
        const m = new THREE.Mesh(g, wood({ repeat: [(ZS - ZB) / 1.2, HW * 2 / 1.2], roughness: 0.45 })); m.position.set(0, DECK, (ZS + ZB) / 2); m.receiveShadow = true; boat.add(m); }
      const dark = wood({ repeat: [3, 0.5], color: '#5d6166', roughness: 0.6 }), mid = wood({ repeat: [4, 0.6], color: '#787d82', roughness: 0.6 });
      const steel = new THREE.MeshStandardMaterial({ color: '#2a2e33', roughness: 0.45, metalness: 0.6 });
      // bulwarks port / starboard + cap rails + stanchions
      for (const sx of [-1, 1]) {
        const g = new THREE.BoxGeometry(0.07, 0.62, ZS - ZB); const b = new THREE.Mesh(g, wood({ repeat: [0.5, (ZS - ZB) / 1.2], color: '#6c7176' }));
        b.material.map.rotation = Math.PI / 2; b.material.normalMap.rotation = Math.PI / 2; b.material.roughnessMap.rotation = Math.PI / 2;
        b.position.set(sx * HW, DECK + 0.31, (ZS + ZB) / 2); b.castShadow = true; b.receiveShadow = true; boat.add(b);
        box(0.16, 0.06, ZS - ZB, dark, sx * HW, DECK + 0.65, (ZS + ZB) / 2);
        for (let z = ZB + 0.6; z < ZS; z += 1.25) box(0.09, 0.66, 0.09, dark, sx * (HW - 0.08), DECK + 0.33, z);
      }
      // stern: open rail (posts + two rails) so the sea and the island show through
      for (let x = -HW; x <= HW + 0.01; x += HW / 2) box(0.09, 0.95, 0.09, dark, x, DECK + 0.475, ZS);
      box(HW * 2 + 0.16, 0.07, 0.14, dark, 0, DECK + 0.96, ZS); box(HW * 2, 0.05, 0.06, mid, 0, DECK + 0.52, ZS); box(HW * 2, 0.16, 0.08, dark, 0, DECK + 0.08, ZS);
      // hull sides below the deck (seen only over the rail)
      box(HW * 2 + 0.3, 1.6, ZS - ZB + 0.3, new THREE.MeshStandardMaterial({ color: '#16191c', roughness: 0.6 }), 0, DECK - 0.83, (ZS + ZB) / 2);
      // wheelhouse at the bow end: open toward the stern, windows forward (bright fog) → captain in silhouette
      { const z0 = -3.1, z1 = -5.0, hw = 1.25, top = DECK + 2.15;
        box(hw * 2, 0.95, 0.08, mid, 0, DECK + 0.475, z1); box(hw * 2, 0.22, 0.08, dark, 0, top - 0.11, z1);            // front: sill panel + header
        for (const x of [-hw, -hw / 3, hw / 3, hw]) box(0.09, top - DECK, 0.09, dark, x, (top + DECK) / 2, z1);        // mullions
        for (const sx of [-1, 1]) { box(0.08, 0.95, z0 - z1, mid, sx * hw, DECK + 0.475, (z0 + z1) / 2); box(0.08, 0.22, z0 - z1, dark, sx * hw, top - 0.11, (z0 + z1) / 2); box(0.09, top - DECK, 0.09, dark, sx * hw, (top + DECK) / 2, z0); }
        box(hw * 2 + 0.5, 0.09, z0 - z1 + 0.7, dark, 0, top + 0.04, (z0 + z1) / 2 + 0.15);                           // roof
        box(0.5, 0.95, 0.4, dark, 0, DECK + 0.475, z1 + 0.5);                                                          // helm console
        const wheel = new THREE.Group(); wheel.position.set(0, DECK + 1.12, z1 + 0.74);
        wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 28), dark));
        for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.78, 6), dark); s.rotation.z = (i / 6) * Math.PI; wheel.add(s); }
        boat.add(wheel);
        // mast + boom + stays
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5.2, 10), steel); mast.position.set(0, top + 2.6, (z0 + z1) / 2); boat.add(mast);
        const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 8), steel); boom.rotation.x = Math.PI / 2 - 0.35; boom.position.set(0, top + 1.6, (z0 + z1) / 2 + 1.9); boat.add(boom);
        for (const [x, z] of [[-HW, -1.5], [HW, -1.5], [0, ZS]]) {
          const a = V3(0, top + 5.1, (z0 + z1) / 2), b = V3(x, DECK + 0.7, z), d = b.clone().sub(a), len = d.length();
          const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 4), steel); st.position.copy(a).addScaledVector(d, 0.5); st.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); boat.add(st);
        }
      }
      // hatch with the rope coil on it = the kid's seat; crates, fish boxes, a buoy
      const seatH = 0.46;
      box(1.25, seatH - 0.05, 1.25, mid, 0.55, DECK + (seatH - 0.05) / 2, 0.9);
      wetGLB(put(boat, 'rope_coil', [0.55, DECK + seatH - 0.05, 0.9], 0.6, 0.9), { rough: 0.85, dark: 0.9 });
      wetGLB(put(boat, 'crate', [-1.45, DECK, 2.2], 0.3, 1.05), { rough: 0.8, dark: 0.9 });
      wetGLB(put(boat, 'crate', [-1.5, DECK, 0.95], -0.2, 0.9));
      put(boat, 'crate', [-1.42, DECK + 0.72, 1.6], 0.5, 0.7);
      put(boat, 'rope_coil', [1.4, DECK + 0.01, 3.6], 2.2, 0.8);
      for (const [x, z] of [[1.55, -1.2], [1.6, -0.2]]) box(0.75, 0.3, 0.5, new THREE.MeshStandardMaterial({ color: '#3d4c57', roughness: 0.5 }), x, DECK + 0.15, z, 0.1);
      const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), new THREE.MeshStandardMaterial({ color: '#9aa0a4', roughness: 0.5 })); buoy.position.set(-1.85, DECK + 0.86, 4.2); buoy.castShadow = true; boat.add(buoy);
      // gentle roll / heave of the whole boat (the camera rides with set.deckY(t); the horizon rocks instead)
      // the island astern (+Z), three layers of silhouettes with fog between them
      const island = new THREE.Group(); island.name = 'island'; root.add(island);
      const darkRock = (o) => wetGLB(o, { rough: 0.9, dark: 0.32 });
      darkRock(put(island, 'sea_stack', [22, -2, 118], 0.7, 3.0, { shadow: false }));
      darkRock(put(island, 'sea_stack', [-34, -2, 150], 2.2, 2.2, { shadow: false }));
      const noSh = (o) => { o.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return o; };
      noSh(put(island, 'sea_stack', [-4, -6, 196], 1.2, [7.5, 6.2, 8])); noSh(put(island, 'sea_stack', [52, -6, 222], 4.1, [8.5, 5.0, 9])); noSh(put(island, 'sea_stack', [-62, -6, 232], 2.6, [9, 5.6, 9]));
      put(island, 'cliff_wall', [4, -4, 170], Math.PI, [7, 3.2, 6], { shadow: false });
      for (const [x, y, z, sc] of [[-44, 40, 214, 0.9], [-22, 52, 205, 1.0], [2, 60, 208, 1.1], [26, 52, 214, 0.95], [50, 40, 232, 1.0], [-70, 46, 240, 1.1], [78, 34, 244, 1.0], [14, 48, 190, 0.7], [-12, 44, 188, 0.75]])
        put(island, 'tree_kapok', [x, y, z], x * 0.37, sc, { shadow: false });
      add(makeFogCards({ count: 16, area: [240, 110], center: [0, 165], y: [2, 40], size: [50, 110], opacity: 0.2, drift: [0.15, 0, 0.03], color: '#b9c2c7', seed: 9, fadeNear: 20 }));
      add(makeFogCards({ count: 12, area: [80, 40], center: [0, -34], y: [1, 9], size: [16, 34], opacity: 0.2, drift: [0.12, 0, 0.02], color: '#c3cbcf', seed: 19, fadeNear: 6 }));
      add(makeLightShafts({ origins: [[-40, 120, 150], [10, 120, 175], [48, 120, 195]], dir: [0.12, -1, -0.2], length: 130, radius: [9, 22], intensity: 0.12, color: '#e6ecee' }));
      const rig = makeLightRig('forest', { shadows: true, shadowBox: 7, shadowMap: 2048, target: [0, DECK + 0.8, 0.5], keyDir: [0.1, 0.55, -1], intensity: 0.75 });
      root.add(rig.root); set.rig = rig;
      const anchors = {
        seat: V3(0.55, DECK, 0.9),                         // kid on the coil: place here, yaw as needed, pose 'sit' { seatHeight: set.seatH }
        deck: V3(0, DECK, 0), wheel: V3(0, DECK, -4.05),   // captain at the helm, facing −Z (yaw π)
        stern: V3(0, DECK, ZS), sternCam: V3(-0.5, DECK + 1.45, 4.3),   // beat 20: from the stern looking forward (−Z)
        railCam: V3(0.2, DECK + 1.3, 3.9),                 // beat 21: over the stern rail looking aft (+Z) at the island
        island: V3(0, 30, 190), rail: V3(1.2, DECK, 4.55), // standing at the stern rail
      };
      set.options = { island: true, wet: 0.35 };
      set.set = (k, v) => { set.options[k] = v; };
      set.onUpdate = () => { island.visible = !!set.options.island; };
      return { boat, island, ocean, anchors, deckY: DECK, seatH, heightAt: () => DECK };
    },
  });
}

// ═════════════════════════════════════════════ export ═════════════════════════════════════════════════════════════
const NIGHT_MOON = [-0.7, 0.5, -0.5];
export const sets = {
  beachNight: (ctx) => beachSet(ctx, 'night', {
    hdr: 'storm_night',
    env: { intensity: 0.75, rotation: 1.48, flash: 0.22 }, bg: { intensity: 1.0, flash: 2.0 },
    exposure: 1.9,
    post: {
      fog: { color: [0.055, 0.07, 0.085], density: 0.012, height: 0, falloff: 0.045, start: 9, sky: 0.9, noise: 0.6, noiseScale: 0.02, wind: [-2, 0, 0.5], sunDir: NIGHT_MOON, sunColor: [0.8, 0.9, 1.0], glow: 0.9, glowPower: 6 },
      bloom: { strength: 0.2, threshold: 0.9 },
      grade: { saturation: 0.28 },
    },
  }),
  beachDusk: (ctx) => beachSet(ctx, 'dusk', {
    hdr: 'storm_night',
    env: { intensity: 1.8, rotation: 1.48, flash: 0.4 }, bg: { intensity: 1.8, flash: 2.0 },
    exposure: 2.5,
    post: {
      fog: { color: [0.1, 0.125, 0.15], density: 0.012, height: 0, falloff: 0.04, start: 5, sky: 0.9, noise: 0.6, noiseScale: 0.02, wind: [-2, 0, 0.5], sunDir: NIGHT_MOON, sunColor: [0.8, 0.9, 1.0], glow: 0.8, glowPower: 6 },
      bloom: { strength: 0.16, threshold: 0.95 },
      grade: { saturation: 0.34, temperature: -0.4 },
    },
  }),
  cave: caveSet,
  boat: boatSet,
};
export const setNames = Object.keys(sets);
/** soft dark blob under a character / prop (night scenes have no cast shadow except in a flash): ctx.add(K blob) */
export function groundBlob(ctx, pos, radius = 0.7, opacity = 0.6) {
  const b = makeContactShadow(radius, opacity); const p = ctx.point(pos); b.position.set(p.x, p.y + 0.025, p.z); ctx.add(b); return b;
}
