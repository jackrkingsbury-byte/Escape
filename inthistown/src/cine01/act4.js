/*
 * act4.js — "The Other Me", ACT 4: dawn. The wrong boy goes home. Beats b20–b27, swap (71.15 s) → end (101.36 s).
 * From the swap cut the narrator is the COPY (cast 'copy': whole body mirrored → knight nose screen-right, white rag on
 * his LEFT hand) until the last two beats, which go back under the pool to the real kid ('me').
 *
 *    1  b20     71.15 → 73.50  boat deck from the stern: the boy on the rope coil in a grey blanket, three-quarter back,
 *                               perfectly still; the captain a backlit blur at the wheel. "6:51 AM".
 *    2  b21     73.50 → 77.84  over the stern rail: the island (stacks, cliff, kapok ridge) dissolves layer by layer.
 *    3  b22     77.84 → 80.93  the slip. Three-quarter close on the coil; on "Just like I said" one corner of his mouth
 *                               lifts. The blanket hides the knight and both hands.
 *    4  b23     80.93 → 85.63  the call. He lifts the radio handset to his ear with the RAG hand — now screen-right.
 *                               Captain soft behind. Mom: "Sweetheart? Oh... is that really you?"
 *    5  b24     85.63 → 89.79  slow push on his eyes; he does not blink. Mom: "You sound different."
 *    6  b25 a   89.79 → 91.91  he lowers the handset, turns to the lens, the pool smile; the blanket drops off him.
 *    7  b25 b   91.91 → 94.65  MATCH CUT to the b06 macro (K.emblemFrame, same dy): the knight's nose points
 *                               SCREEN-RIGHT, the rag hand comes in from SCREEN-RIGHT and smooths it. 1.5 s clean hold.
 *    8  b26     94.65 → 97.33  flash, hard cut: locked top-down on the black pool. The real kid under the surface,
 *                               palms on the glass, rag on his RIGHT, knight the original way. "3:12 AM".
 *    9  b27 a   97.33 → 99.03  same axis, tighter: his face and palms under the glass, mouth moving on the words.
 *   10  b27 b   99.03 → 101.36 the locked wide again: the torch gutters out, the palms slide off and he sinks into
 *                               black; drip rings; the cave-mouth flash ramps to ~60 % and cuts into frame 0 (the loop).
 *
 * Props built here (init): the grey blanket (procedural cloth: seated wrap / one-shoulder wrap / slide-off), the radio
 * handset with its coiled cord and the radio box, and two "talking" face decals for the kid under the pool.
 * Determinism: per-shot objects go through ctx.add; everything else is recomputed from time in update().
 */
import * as THREE from 'three';
import * as K from './kit.js';
import { canvasTexture, rbox } from '../lib/util.js';
import { textureSet } from '../real/assets.js';

const A1 = await import('./act1.js').catch(() => ({}));
const EMBLEM_DY = A1.EMBLEM_DY ?? -0.055;         // the b06 macro's vertical offset: b25 must match it exactly

const PI = Math.PI, TAU = PI * 2;
const A = (ctx, n) => ctx.set.anchors[n];
const real = (ctx) => ctx.props.real;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const { clamp, lerp, smooth } = K;
const ramp = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
const sramp = (x, a, b) => smooth(ramp(x, a, b));

// ═════════════════════════════════════════════ the grey blanket ═══════════════════════════════════════════════════
// A strip of cloth wrapped once round the body, in TORSO-local metres (origin = hip pivot, +Z = chest, +Y up). It is
// recomputed every frame from three numbers: seated (drapes over the lap and pools on the seat), toga (0 = closed round
// both shoulders; 1 = slipped off the rig-right shoulder and passed under that arm, so the rag arm is free) and fall
// (0..1: slides off and drops to the deck).
const BL = { NU: 76, NV: 38, PHS: -0.6, OV: 0.55, S1: 0.27, YN: 0.508, YS: 0.43, AN: 0.25, AS: 0.535, BFN: 0.2, BFS: 0.335, BBN: 0.2, BBS: 0.255 };
const SE = (c, n = 3) => Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
function makeBlanket() {
  const { NU, NV } = BL, n = (NU + 1) * (NV + 1);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3), idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const k = j * (NU + 1) + i, v = j / NV;
    uv[k * 2] = (i / NU) * 12; uv[k * 2 + 1] = v * 5;
    // two darker woven bands near the hem (a ship's wool blanket)
    const band = Math.max(sramp(v, 0.76, 0.775) * (1 - sramp(v, 0.83, 0.845)), sramp(v, 0.875, 0.885) * (1 - sramp(v, 0.905, 0.915)));
    const c = lerp(1, 0.42, band); col[k * 3] = c; col[k * 3 + 1] = c; col[k * 3 + 2] = c;
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
  const ts = textureSet('wet_fabric');
  const nm = ts.normalMap.clone(); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set(1, 1); nm.needsUpdate = true;
  const mat = new THREE.MeshPhysicalMaterial({ color: '#90969c', roughness: 0.94, metalness: 0, normalMap: nm, normalScale: new THREE.Vector2(0.75, 0.75),
    sheen: 0.7, sheenRoughness: 0.55, sheenColor: new THREE.Color('#b9c1c8'), vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 0.9 });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'a4blanket'; mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  return { mesh, geo };
}
function blanketUpdate(B, o = {}) {
  const { NU, NV, PHS, OV, S1, YN, YS, AN, AS, BFN, BFS, BBN, BBS } = BL;
  const seated = o.seated ? 1 : 0, toga = o.toga ?? 0, fall = o.fall ?? 0;
  const L = seated ? 0.9 : 1.22, Y_SEAT = -0.068, Y_LAP = 0.135;
  const p = B.geo.attributes.position;
  for (let j = 0; j <= NV; j++) {
    const v = j / NV, s = v * L, kk = Math.min(1, s / S1), h = Math.max(0, s - S1);
    const y0 = YN - (YN - YS) * kk * kk - h, ke = Math.sin(kk * PI / 2);
    const open = toga * sramp(y0, -0.05, 0.24);
    const pa = lerp(PHS, lerp(-0.6, -0.2, ramp(y0, 0.1, 0.5)), toga), pb = lerp(PHS + TAU + OV, PI + 0.35, open);
    const a = lerp(AN, AS, ke) - 0.04 * ramp(h, 0, 0.6);
    const bf = lerp(BFN, BFS, ke) + seated * 0.07 * Math.exp(-Math.pow((y0 - 0.18) / 0.17, 2)) * ramp(h, 0, 0.1);
    const bb = lerp(BBN, BBS, ke), fa = 0.028 * kk + 0.095 * sramp(h, 0.0, 0.4);
    for (let i = 0; i <= NU; i++) {
      const u = i / NU, ph = lerp(pa, pb, u);
      const f6 = Math.sin(6 * ph + 0.9 + 1.3 * h);
      const F = 0.55 * Math.sign(f6) * Math.pow(Math.abs(f6), 0.7) + 0.3 * Math.sin(11 * ph + 2.3 - 2.2 * h) + 0.15 * Math.sin(17 * ph + 4.1 + 0.7 * h);
      const m = 1 + fa * (F + 0.35) + 0.006 * Math.sin(31 * y0 + 3 * ph) * ramp(h, 0, 0.2), sn = Math.sin(ph), cs = Math.cos(ph);
      let x = a * SE(sn) * m, z = (cs >= 0 ? bf : bb) * SE(cs) * m, y = y0 + 0.022 * Math.sin(5 * ph + 1.7) * v * v + 0.012 * kk * (1 - kk) * 4 * Math.sin(9 * ph + 0.4);
      if (toga > 0 && sn < 0) x *= 1 - 0.3 * toga * sramp(-sn, 0.15, 0.7) * sramp(h, 0.0, 0.25);    // tucked in under the free arm
      const e = sramp(ph, PHS + TAU - 0.1, PHS + TAU + 0.12);               // the outer flap lies over the inner one
      x *= 1 + 0.05 * e; z *= 1 + 0.05 * e;
      if (seated) {
        const fw = sramp(z, 0.06, 0.22) * (1 - sramp(Math.abs(x), 0.3, 0.44));        // over the thighs
        const level = lerp(Y_SEAT, Y_LAP, fw);
        if (y < level) {
          const d = level - y, r = Math.hypot(x, z) || 1, dx = x / r, dz = z / r;
          const sp = lerp(0.55, 0.85, fw);
          x += lerp(dx, dx * 0.25, fw) * d * sp; z += lerp(dz, 1, fw) * d * sp;
          y = level + 0.012 + 0.014 * (0.5 + 0.5 * Math.sin(ph * 7 + 1.1)) * Math.min(1, d * 5);
          if (z > 0.5) { const over = z - 0.5; z = 0.5 + 0.06 * (1 - Math.exp(-over * 6)); y -= 0.5 * over; }   // off the knees
        }
      }
      if (fall > 0) {
        const f1 = sramp(fall, 0, 0.35), f2 = clamp((fall - 0.12) / 0.88, 0, 1), top = ramp(y0, 0.15, 0.5);
        x *= 1 + 0.22 * f1 * top + 0.14 * f2; z = z * (1 + 0.12 * f2) - 0.14 * f1 * top;
        y -= 0.1 * f1 * top + 1.6 * f2 * f2 * (0.85 + 0.15 * Math.sin(ph * 3 + 0.7));
        const floor = -0.9 + 0.03 + 0.05 * (0.5 + 0.5 * Math.sin(ph * 7 + v * 9));
        if (y < floor) { const d = Math.min(0.5, floor - y), r = Math.hypot(x, z) || 1; y = floor + 0.02 * Math.sin(d * 14 + ph * 5); x += (x / r) * d * 0.5; z += (z / r) * d * 0.5; }
      }
      p.setXYZ(j * (NU + 1) + i, x, y, z);
    }
  }
  p.needsUpdate = true;
  B.geo.computeVertexNormals();
}

// ═════════════════════════════════════════════ the radio ══════════════════════════════════════════════════════════
function makeHandset() {
  // telephone-style marine handset. Local frame: long axis Y (earpiece at +Y, mouthpiece and cord at −Y), cups toward +X
  const g = new THREE.Group(); g.name = 'a4handset';
  const plastic = new THREE.MeshPhysicalMaterial({ color: '#1b1d20', roughness: 0.48, clearcoat: 0.4, clearcoatRoughness: 0.4 });
  const worn = new THREE.MeshStandardMaterial({ color: '#40444a', roughness: 0.65, metalness: 0.25 });
  const add = (geo, mat, x, y, z, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  add(rbox(0.04, 0.2, 0.05, 0.05), plastic, -0.012, 0, 0);                                    // grip
  add(rbox(0.058, 0.066, 0.062, 0.06), plastic, 0.012, 0.094, 0, 0.18);                       // earpiece
  add(rbox(0.058, 0.06, 0.062, 0.06), plastic, 0.016, -0.094, 0, -0.22);                      // mouthpiece
  add(rbox(0.008, 0.07, 0.03, 0.03), worn, -0.034, 0.012, 0);                                  // push-to-talk bar
  add(new THREE.CylinderGeometry(0.008, 0.011, 0.03, 10), worn, -0.004, -0.135, 0);            // cord gland
  return g;
}
function makeRadioBox() {
  const g = new THREE.Group(); g.name = 'a4radio';
  const body = new THREE.MeshPhysicalMaterial({ color: '#1a1c1f', roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const m = new THREE.Mesh(rbox(0.3, 0.17, 0.11, 0.05), body); m.castShadow = true; m.receiveShadow = true; g.add(m);
  const face = canvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = '#131517'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2f3a36'; c.fillRect(20, 20, 110, 46);                                     // dead-grey LCD
    c.fillStyle = 'rgba(190,215,200,0.55)'; c.font = '700 30px monospace'; c.fillText('16', 30, 54);
    c.fillStyle = '#08090a'; for (let i = 0; i < 5; i++) c.fillRect(150 + i * 18, 22, 9, 44);     // speaker slots
    c.fillStyle = '#2b2e32'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(34 + i * 30, 98, 9, 0, TAU); c.fill(); }
  });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.15), new THREE.MeshStandardMaterial({ map: face, roughness: 0.5, emissive: new THREE.Color('#9fb5aa'), emissiveMap: face, emissiveIntensity: 0.25 }));
  f.position.z = 0.0565; g.add(f);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 14), new THREE.MeshStandardMaterial({ color: '#2a2d31', roughness: 0.4, metalness: 0.5 }));
  knob.rotation.x = PI / 2; knob.position.set(0.11, -0.04, 0.066); g.add(knob);
  return g;
}
/** coiled handset cord: a helix round a sagging line from a → b (world points), rebuilt in place every frame */
function makeCord(turns = 34, per = 9, sides = 5) {
  const n = turns * per + 1, pos = new Float32Array(n * sides * 3), idx = [];
  for (let k = 0; k < n - 1; k++) for (let s = 0; s < sides; s++) {
    const a = k * sides + s, b = k * sides + ((s + 1) % sides), c = a + sides, d = b + sides; idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#0f1012', roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
  mesh.name = 'a4cord'; mesh.castShadow = true; mesh.frustumCulled = false;
  const c0 = V(), c1 = V(), T = V(), N = V(), Bn = V(), R = V(), UP = V(0, 1, 0), q = V();
  const centre = (s, a, b, sag, out) => out.lerpVectors(a, b, s).addScaledVector(UP, -sag * 4 * s * (1 - s));
  return { mesh, update(a, b, sag = 0.25, rc = 0.0125, rt = 0.0036) {
    for (let k = 0; k < n; k++) {
      const s = k / (n - 1);
      centre(s, a, b, sag, c0); centre(Math.min(1, s + 0.01), a, b, sag, c1); centre(Math.max(0, s - 0.01), a, b, sag, q);
      T.subVectors(c1, q).normalize(); N.crossVectors(T, UP); if (N.lengthSq() < 1e-6) N.set(1, 0, 0); N.normalize(); Bn.crossVectors(T, N).normalize();
      const ang = s * turns * TAU, rr = rc * sramp(Math.min(s, 1 - s), 0.0, 0.05);
      R.copy(N).multiplyScalar(Math.cos(ang)).addScaledVector(Bn, Math.sin(ang));
      c0.addScaledVector(R, rr);
      for (let j = 0; j < sides; j++) {
        const th = (j / sides) * TAU, o = (k * sides + j) * 3;
        pos[o] = c0.x + (R.x * Math.cos(th) + T.x * Math.sin(th)) * rt; pos[o + 1] = c0.y + (R.y * Math.cos(th) + T.y * Math.sin(th)) * rt; pos[o + 2] = c0.z + (R.z * Math.cos(th) + T.z * Math.sin(th)) * rt;
      }
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
  } };
}

// ═════════════════════════════════════════════ faces ══════════════════════════════════════════════════════════════
const faceMesh = (ch) => ch.root.getObjectByName('face');
/** a time at which this character's blink cycle is open (ch.face(expr, t) never blinks at it) */
const noBlinkT = (ch) => 1.5 - (ch.blinkPhase || 0);
/** the 'sad' face of the kid with the mouth open (two sizes): alternated with 'sad' on the syllables under the pool */
function buildTalkFaces(ctx) {
  const me = ctx.cast.me, fm = faceMesh(me);
  me.face('sad', noBlinkT(me));
  const src = fm.material.map.image;
  const mk = (rx, ry) => canvasTexture(512, 512, (g) => {
    g.drawImage(src, 0, 0);
    g.clearRect(186, 350, 140, 70);                                         // the frown
    g.beginPath(); g.ellipse(256, 386, rx, ry, 0, 0, TAU); g.fillStyle = '#5a1622'; g.fill();
    g.lineWidth = 12; g.strokeStyle = '#151515'; g.lineJoin = 'round'; g.stroke();
  });
  const out = [mk(17, 11), mk(24, 25)];
  me.face('neutral', 0);
  return out;
}
/** 0 closed · 1 small · 2 wide: syllable flaps on the words of the given beats */
function mouthAt(ctx, beats) {
  for (const id of beats) {
    for (const w of ctx.beat(id).words || []) {
      const lt = ctx.t - w.start, d = w.end - w.start;
      if (lt < 0 || lt >= d) continue;
      const k = (lt / 0.17) % 1;
      return k < 0.62 ? (lt < 0.17 ? 2 : 1) : 0;
    }
  }
  return 0;
}

// ═════════════════════════════════════════════ act props (built once) ═════════════════════════════════════════════
export async function init(ctx) {
  ctx.props.a4 = { blanket: makeBlanket(), handset: makeHandset(), radio: makeRadioBox(), cord: makeCord(), film: makeFilm(), talk: buildTalkFaces(ctx) };
}
const P = (ctx) => ctx.props.a4;

// ═════════════════════════════════════════════ helpers ════════════════════════════════════════════════════════════
const _h = V();
function handWorld(ch, side, out = V()) { const h = ch.joints['hand' + side]; h.updateWorldMatrix(true, false); return h.getWorldPosition(out); }
/** two-bone reach (same solver as act 1): put a hand on a world point; fixed iteration count → deterministic */
function reach(ch, side, target, guess = [-1.0, 0.0, 0.2, -1.6], iters = 26) {
  const p = guess.slice(), lo = [-3.0, -1.6, -1.6, -2.6], hi = [0.6, 1.6, 1.6, 0];
  const err = () => {
    K.joint(ch, 'arm' + side, p[0], p[1], p[2]); K.joint(ch, 'foreArm' + side, p[3], 0, 0);
    let e = handWorld(ch, side, _h).distanceToSquared(target);
    for (let i = 0; i < 4; i++) e += 0.0012 * (p[i] - guess[i]) * (p[i] - guess[i]);
    return e;
  };
  let e = err(), step = 0.35;
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < 4; i++) for (const s of [1, -1]) { const old = p[i]; p[i] = clamp(old + s * step, lo[i], hi[i]); const e2 = err(); if (e2 < e) { e = e2; break; } p[i] = old; }
    step *= 0.72;
  }
  err();
  return p;
}
/** torso-local point → world (goes through the copy's mirror, so "rig right" lands on his visible LEFT) */
function torsoPoint(ch, x, y, z, out = V()) { ch.root.updateWorldMatrix(true, true); return ch.joints.torso.localToWorld(out.set(x, y, z)); }
/** gentle swell: camera bob + the horizon rocking ±2° */
function seaCam(ctx, spec, k = 1) {
  const t = ctx.t;
  const pos = Array.isArray(spec.pos) ? spec.pos.slice() : [spec.pos.x, spec.pos.y, spec.pos.z];
  pos[1] += 0.035 * k * Math.sin(t * 0.9 + 0.4); pos[0] += 0.012 * k * Math.sin(t * 0.63 + 1.9);
  ctx.cam.set({ ...spec, pos, roll: (spec.roll || 0) + 0.035 * k * Math.sin(t * 0.7) });
}
/** the copy on the hatch, wrapped: perfectly still (pose time frozen), hands folded under the blanket */
function seatCopy(ctx, headYaw = 0, headPitch = 0) {
  const c = ctx.cast.copy;
  c.pose('sit', 0, { seatHeight: ctx.set.seatH, hands: 'none', headYaw, headPitch });
  for (const s of ['L', 'R']) { const sg = s === 'L' ? 1 : -1; K.joint(c, 'arm' + s, 0.12, 0, -sg * 0.3); K.joint(c, 'foreArm' + s, -1.78, 0, 0); }
  if (c.rag) c.rag.visible = false;                     // both hands stay under the blanket (the engine restores visibility per shot)
  blanketUpdate(P(ctx).blanket, { seated: 1 });
}
/** the captain at the wheel (a silhouette: only the outline matters) */
function helm(ctx) {
  const c = ctx.cast.captain; if (!c) return;
  c.pose('idle', ctx.t * 0.6, {});
  K.joint(c, 'armL', -1.05, 0, -0.12); K.joint(c, 'foreArmL', -0.35, 0, 0); K.joint(c, 'armR', -1.05, 0, 0.12); K.joint(c, 'foreArmR', -0.35, 0, 0);
}

// where he stands for the call (deck coordinates), and where the radio hangs (the wheelhouse's starboard aft post)
const CALL = { x: 0.9, z: -2.3, yaw: -0.5 };
const RADIO = { x: 1.25, y: 1.4, z: -3.0 };
const CALL_AZ = 0.5;                                   // the call is shot from his handset side (rad off his facing)
/** kid → camera direction at azimuth az off his facing (toward his visible left = the rag hand), and screen-right */
function callView(ctx, az, d) {
  const a = CALL.yaw + az, dir = [Math.sin(a), Math.cos(a)], right = [dir[1], -dir[0]];
  return { dir, right, cam: [CALL.x + dir[0] * d, ctx.set.deckY + 1.7, CALL.z + dir[1] * d] };
}
function callSetup(ctx, { captain = [0, -4.05, PI] } = {}) {
  const dy = ctx.set.deckY, p = P(ctx), c = ctx.cast.copy;
  ctx.place('copy', [CALL.x, dy, CALL.z], { yaw: CALL.yaw });
  if (captain) ctx.place('captain', [captain[0], dy, captain[1]], { yaw: captain[2] });
  ctx.add(p.blanket.mesh, c.joints.torso);
  ctx.add(p.handset, c.joints.torso);
  ctx.add(p.radio); p.radio.position.set(RADIO.x - 0.02, dy + RADIO.y, RADIO.z); p.radio.rotation.set(0, 0, 0);
  ctx.add(p.cord.mesh);
}
// handset poses in torso space [x, y, z, rotX, rotY, rotZ] (rig right = −x = the copy's visible LEFT = screen-right)
const HS_CHEST = [-0.33, 0.27, 0.47, -0.25, 0.5, 0.1], HS_EAR = [-0.385, 0.735, 0.13, -0.72, 0.12, 0.0], HS_DOWN = [-0.5, 0.02, 0.22, 0.25, 0.9, 0.1];
const mix6 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
/**
 * The standing copy on the call. up 0..1 = handset from chest height to his ear (rag hand = rig R = his visible LEFT),
 * lower 0..1 = down to his side again, fall 0..1 = the blanket sliding off. Call every frame; returns the head's world position.
 */
const _a = V(), _b = V(), _hd = V();
function callPose(ctx, { up = 1, fall = 0, headYaw = 0, headPitch = 0, breathe = 0.35, lower = 0 } = {}) {
  const c = ctx.cast.copy, p = P(ctx), t = ctx.t;
  K.filmPose(c, 'stand', t, { breathe, headYaw, headPitch });
  K.joint(c, 'armL', 0.04, 0, 0.05); K.joint(c, 'foreArmL', -0.3, 0, 0);       // the other hand stays under the blanket
  const e = smooth(up), lo = smooth(lower);
  const hs = mix6(mix6(HS_CHEST, HS_EAR, e), HS_DOWN, lo);
  hs[2] += 0.1 * Math.sin(PI * e) * (1 - lo);                                // the lift swings out round the blanket
  p.handset.position.set(hs[0], hs[1], hs[2]); p.handset.rotation.set(hs[3], hs[4], hs[5]);
  // the rag hand grips the handset from outside
  torsoPoint(c, hs[0] - 0.085, hs[1] - 0.005, hs[2] + 0.005, _a);
  reach(c, 'R', _a, [lerp(-0.6, -0.9, e), lerp(0.2, 0.5, e), lerp(-0.1, -0.5, e), lerp(-1.7, -2.3, e)]);
  blanketUpdate(p.blanket, { toga: 1, fall });
  // cord: handset gland → radio box
  c.root.updateWorldMatrix(true, true); p.handset.updateWorldMatrix(true, false);
  p.handset.localToWorld(_a.set(-0.004, -0.15, 0)); p.radio.localToWorld(_b.set(-0.1, -0.09, 0.02));
  p.cord.update(_a, _b, 0.16 + 0.1 * (1 - e) + 0.2 * lo);
  return c.joints.head.getWorldPosition(_hd);
}

// ═════════════════════════════════════════════ the pool (b26 / b27) ═══════════════════════════════════════════════
const POOL_SINK0 = 0.56;                               // depth of the kid's back under the surface while he presses on it
const POOL_TOP = { height: 3.3, dz: 1.62 };            // the locked top-down: this high, looking this far shoreward of the pool centre
const POOL_KID_Z = 1.6, POOL_TILT = 0.2;              // he hangs just off the shore he knelt on; his legs go down into the dark
const FILM_V = /* glsl */`varying vec2 vW; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const FILM_F = /* glsl */`
precision highp float;
uniform vec3 uPhone; uniform vec4 uPool; uniform vec4 uSrc[3]; uniform vec4 uPalm; uniform vec3 uRel; uniform float uTime, uFlash, uRings, uLight;
varying vec2 vW;
float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
void main() {
  float mask = 1.0 - smoothstep(0.93, 0.995, length((vW - uPool.xy) / uPool.zw));
  float d = length(vW - uPhone.xy);
  float glow = uPhone.z * exp(-d * 1.15) * (0.5 + 0.5 * n2(vW * 2.6 + 4.0));           // the torch skimming the surface
  // where the palms press on the underside: a thin bright meniscus round each, and a soft dimple of light
  float pm = 0.0, rel = 0.0;
  for (int k = 0; k < 2; k++) {
    vec2 q = abs(vW - (k == 0 ? uPalm.xy : uPalm.zw)) - vec2(0.066);
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.012;
    pm += exp(-sd * sd * 30000.0) * 0.55 + exp(-max(sd, 0.0) * 22.0) * 0.16;
    float rr2 = length(vW - (k == 0 ? uPalm.xy : uPalm.zw)), x2 = rr2 - 0.07 - uRel.x * 0.38;       // the release: one slow ring each
    rel += (exp(-x2 * x2 * 2600.0) + 0.5 * exp(-(x2 + 0.07) * (x2 + 0.07) * 2600.0)) * exp(-uRel.x * 1.1) * smoothstep(0.0, 0.1, uRel.x);
  }
  float rg = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 dd = vW - uSrc[i].xy; float rr = length(dd);
    float age = fract(uTime / uSrc[i].z + uSrc[i].w) * uSrc[i].z, x = rr - age * 0.4;
    float e = exp(-age * 0.75) * smoothstep(0.0, 0.12, age);
    float wob = 0.75 + 0.25 * n2(vW * 5.0 + float(i) * 3.7);
    rg += (exp(-x * x * 3200.0) + 0.5 * exp(-(x + 0.06) * (x + 0.06) * 3200.0)) * e * wob + 0.6 * exp(-rr * rr * 4000.0) * exp(-age * 9.0);
  }
  float lit = 0.035 + 0.3 * glow + 0.02 * uLight + 0.16 * uFlash;
  vec3 col = vec3(0.72, 0.84, 1.0) * (0.22 * glow * glow + uRings * rg * lit + (uPalm.x > -900.0 ? 1.0 : 0.0) * (pm * uRel.y * 0.16 + rel * uRel.z * 0.12) * (0.25 + 0.75 * uLight)
    + 0.1 * uFlash * n2(vW * 1.3 + 9.0));
  gl_FragColor = vec4(col * mask, 1.0);
}`;
/** a faint film on the pool surface: torch spill, dust specks, and (b27) drip rings spreading from the shore edge */
function makeFilm() {
  const uniforms = { uPhone: { value: V() }, uPool: { value: new THREE.Vector4() }, uSrc: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
    uPalm: { value: new THREE.Vector4(-999, 0, -999, 0) }, uRel: { value: V(0, 1, 0) }, uTime: { value: 0 }, uFlash: { value: 0 }, uRings: { value: 0 }, uLight: { value: 1 } };
  const m = new THREE.Mesh(new THREE.PlaneGeometry(8, 7).rotateX(-PI / 2), new THREE.ShaderMaterial({ vertexShader: FILM_V, fragmentShader: FILM_F, uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  m.renderOrder = 9; m.name = 'a4film'; m.frustumCulled = false;
  return { mesh: m, uniforms };
}
function poolSetup(ctx) {
  const c = A(ctx, 'poolCenter'), ph = ctx.props.phone, ps = ctx.set.poolSpec, H = ctx.set.heightAt, f = P(ctx).film;
  ctx.place('me', [c.x, ctx.set.waterY - POOL_SINK0, c.z + POOL_KID_Z], { yaw: 0 });
  { const me = ctx.cast.me; K.filmPose(me, 'supine', 0, { reach: 1, spread: 0.09, breathe: 0, tilt: POOL_TILT });
    const l = handWorld(me, 'L', V()), r = handWorld(me, 'R', V()); ctx.store.palm = [l.x, l.z, r.x, r.z]; }
  // his phone on the rock at the water's edge, LED up, dying
  const px = c.x + 0.52, pz = c.z + ps.rz * 1.1 + 0.3;
  ctx.add(ph.root); ph.root.position.set(px, H(px, pz) + 0.012, pz); ph.root.rotation.set(PI / 2, 0, 0.5); ph.setMode('torch').setSpill(1.3).setLevel(0.5);   // face down: LED up
  ph.beam.visible = false;                              // seen from straight above the beam cone is only a hoop (setMode restores it)
  ctx.store.phone = [px, pz];
  // the torch off the ceiling onto the wet rock round the phone, and the flash raking in from the cave mouth
  const bo = ctx.store.bounce = ctx.add(new THREE.PointLight('#cfdcf0', 0, 5, 2)); bo.position.set(px - 0.3, H(px, pz) + 2.0, pz + 0.1);
  const rk = ctx.store.rake = ctx.add(new THREE.PointLight('#e2ecff', 0, 30, 2)); rk.position.set(c.x + 1.6, ctx.set.waterY + 1.5, c.z + 8.5);
  // his light: from ABOVE the water and off the lens axis, cold; a weaker one from the other side so the far palm reads
  const k = ctx.store.key = ctx.add(new THREE.PointLight('#a9c6e6', 0, 7, 2)); k.position.set(c.x + 1.9, ctx.set.waterY + 1.3, c.z + 0.9);
  const fl = ctx.store.fill = ctx.add(new THREE.PointLight('#7f9fc4', 0, 6, 2)); fl.position.set(c.x - 1.7, ctx.set.waterY + 1.0, c.z + 0.5);
  ctx.add(f.mesh); f.mesh.position.set(c.x, ctx.set.waterY + 0.004, c.z);
  f.uniforms.uPool.value.set(c.x, c.z, ps.rx * 1.1, ps.rz * 1.1);
  const S = [[-0.62, 2.18, 2.3, 0.05], [0.4, 2.3, 3.1, 0.45], [0.95, 2.05, 2.7, 0.8]];
  S.forEach((q, i) => f.uniforms.uSrc.value[i].set(c.x + q[0], c.z + q[1], q[2], q[3]));
}
/** per-frame film state: torch level, flash, drip rings 0..1 (ring clocks start at t0) */
function poolFilm(ctx, level, { rings = 0, t0 = 0, light = 1, release = -1 } = {}) {
  const u = P(ctx).film.uniforms, p = ctx.store.phone, me = ctx.cast.me;
  // palms: pressed on the underside until `release` (seconds since they let go; < 0 = still pressing)
  handWorld(me, 'L', _a); handWorld(me, 'R', _b);
  const pp = release < 0 ? [_a.x, _a.z, _b.x, _b.z] : ctx.store.palm;        // after the release: where they were (from setup)
  u.uPalm.value.set(pp[0], pp[1], pp[2], pp[3]);
  u.uRel.value.set(Math.max(0, release), release < 0 ? 1 : Math.max(0, 1 - release / 0.25), release < 0 ? 0 : 1);
  ctx.store.bounce.intensity = 34 * level; ctx.store.rake.intensity = 380 * (ctx.store.flash || 0);
  u.uPhone.value.set(p[0], p[1], level * 2); u.uTime.value = Math.max(0, ctx.t - t0); u.uFlash.value = ctx.store.flash || 0; u.uRings.value = rings; u.uLight.value = light;
}
/** torch level: a tired LED, then guttering out between g0 and g1 (seconds, film time) */
function torchLevel(t, g0 = 1e9, g1 = 1e9) {
  const base = 0.5 * (0.86 + 0.14 * K.noise1(t * 7.3, 5)) * (K.hash(Math.floor(t * 9.1) + 3) < 0.08 ? 0.55 : 1);
  if (t < g0) return base;
  const u = ramp(t, g0, g1);
  const gut = (1 - u) * (0.55 + 0.45 * Math.sin(t * 41)) * (K.hash(Math.floor(t * 15.7) + 11) < 0.3 + 0.5 * u ? 0.15 : 1);
  return base * Math.max(0, gut) * (u >= 1 ? 0 : 1);
}
const _zero = new THREE.Matrix4().makeScale(0, 0, 0);
/** hide a character's falling drips for this frame (real.update rewrites them; un-updated they are 1 m spheres) */
function noDrips(r) { const d = r && r.drips; if (!d) return; for (let i = 0; i < d.count; i++) d.setMatrixAt(i, _zero); d.instanceMatrix.needsUpdate = true; }
/** the kid under the glass. sink 0..1 = palms sliding off and the body going down into the murk. */
function poolKid(ctx, { sink = 0, light = 1 } = {}) {
  const me = ctx.cast.me, t = ctx.t, c = A(ctx, 'poolCenter'), wy = ctx.set.waterY;
  const s = smooth(sink);
  K.filmPose(me, 'supine', t, { reach: lerp(1, 0.5, s), spread: lerp(0.09, 0.3, s), breathe: 0.3, tilt: POOL_TILT * (1 - 0.6 * s) });
  // hang him from his palms: flat against the underside of the surface (the supine pose alone leaves them 20 cm above it)
  me.root.position.set(c.x, wy - 1, c.z + POOL_KID_Z + 0.1 * s);
  const hy = handWorld(me, 'L', _a).y;
  me.root.position.y += (wy - 0.078) - hy - 1.2 * s * s - 0.01 * Math.sin(t * 1.3) * s;
  real(ctx).me.update(t); noDrips(real(ctx).me);
  me.face('sad', t);
  const m = mouthAt(ctx, ['b26', 'b27']);
  if (m) faceMesh(me).material.map = P(ctx).talk[m - 1];
  ctx.store.key.intensity = 24 * light * (1 - 0.75 * s); ctx.store.fill.intensity = 7 * light * (1 - 0.8 * s);
}

// ═════════════════════════════════════════════ shots ══════════════════════════════════════════════════════════════
export const shots = [
  // ─────────────────────────────────────────── 1 · b20 · the deck at sunrise ───────────────────────────────────────
  {
    name: 'a4.1 a fishing boat at sunrise (b20)', start: 'swap', set: 'boat', cast: ['copy', 'captain'],
    setup(ctx) {
      ctx.place('copy', 'seat', { yaw: PI + 0.25 });
      ctx.place('captain', 'wheel', { yaw: PI });
      ctx.add(P(ctx).blanket.mesh, ctx.cast.copy.joints.torso);
      const s = A(ctx, 'seat');
      const sky = ctx.add(new THREE.PointLight('#cfd9e2', 15, 8, 2)); sky.position.set(s.x - 1.9, s.y + 2.3, s.z + 1.5);   // the sky astern, raking across his back
    },
    update(ctx, lt) {
      seatCopy(ctx, 0.3, 0.05); helm(ctx);
      const dy = ctx.set.deckY, u = smooth(lt / 2.4);
      seaCam(ctx, { pos: [-0.6, dy + 1.36, 4.82 - 0.14 * u], look: [0.71, dy + 1.08, -1.2], fov: 46 });
      K.stamp(ctx, '6:51 AM', { at: 'tl', alpha: ramp(lt, 0.05, 0.4) * (1 - ramp(lt, 1.95, 2.3)) });
    },
    post: K.shotPost((ctx) => ({ dof: { focus: K.dist(ctx, [A(ctx, 'seat').x, ctx.set.deckY + 1.1, A(ctx, 'seat').z]), aperture: 0.6, maxBlur: 12 } })),
  },

  // ─────────────────────────────────────────── 2 · b21 · the island melts ──────────────────────────────────────────
  {
    name: 'a4.2 the island melts into the fog (b21)', start: 'b21-0.13', set: 'boat', cast: [],
    setup(ctx) {},
    update(ctx, lt) {
      const dy = ctx.set.deckY, u = lt / 4.3;
      seaCam(ctx, { pos: [-0.85, dy + 1.12, 3.15 - 0.3 * u], look: [-6, 24 - 2 * u, 190], fov: 38 }, 1.2);
    },
    // the fog thickens geometrically: the far ridge goes first, then the cliff, then the near stacks
    post: K.shotPost((ctx, lt) => ({ fog: { density: 0.003 * Math.pow(3.0, sramp(lt, 0.25, 3.2)) * (1 + 2.4 * sramp(lt, 2.9, 4.0)) } })),
  },

  // ─────────────────────────────────────────── 3 · b22 · the slip ──────────────────────────────────────────────────
  {
    name: 'a4.3 "just like I said" (b22)', start: 'b22-0.12', set: 'boat', cast: ['copy', 'captain'],
    setup(ctx) {
      ctx.place('copy', 'seat', { yaw: 0.32 });
      ctx.place('captain', 'wheel', { yaw: PI });
      ctx.add(P(ctx).blanket.mesh, ctx.cast.copy.joints.torso);
      ctx.store.fill = ctx.add(new THREE.PointLight('#dfe6ee', 4.2, 5, 2));
    },
    update(ctx, lt) {
      const c = ctx.cast.copy, t = ctx.t;
      seatCopy(ctx, 0.1, 0.02); helm(ctx);
      c.face(t >= ctx.time('b22.w4') - 0.05 ? 'smug' : 'neutral', noBlinkT(c));
      const e = K.eyePoint(c), u = smooth(lt / 3.1), d = lerp(3.5, 3.3, u);
      const dir = [Math.sin(-0.55), Math.cos(-0.55)], right = [dir[1], -dir[0]];       // kid → camera, and screen-right
      const H = 2 * d * Math.tan(15 * PI / 180);
      const look = [e.x - right[0] * 0.02, e.y - 0.19 * H, e.z - right[1] * 0.02];
      seaCam(ctx, { pos: [look[0] + dir[0] * d, e.y - 0.42, look[2] + dir[1] * d], look, fov: 30 }, 0.7);
      ctx.store.fill.position.set(e.x + dir[0] * 0.9 + right[0] * 1.0, e.y + 0.35, e.z + dir[1] * 0.9 + right[1] * 1.0);
      ctx.store.focus = K.dist(ctx, e);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 3.8, aperture: 1.3, maxBlur: 18 } })),
  },

  // ─────────────────────────────────────────── 4 · b23 · the call ──────────────────────────────────────────────────
  {
    // a slow rising push from his handset side: it starts wide enough to hold the captain at the wheel, cut out against the
    // wheelhouse windows, and ends close and a little above him as Mom answers. The rag hand is SCREEN-RIGHT.
    name: 'a4.4 the captain let me call Mom (b23)', start: 'b23-0.12', set: 'boat', cast: ['copy', 'captain'],
    setup(ctx) {
      callSetup(ctx);
      const dy = ctx.set.deckY;
      const key = ctx.add(new THREE.PointLight('#dfe6ee', 7.5, 5.5, 2)); key.position.set(CALL.x - 1.25, dy + 2.35, CALL.z + 1.35);
    },
    update(ctx, lt) {
      const c = ctx.cast.copy, t = ctx.t, dy = ctx.set.deckY;
      const up = sramp(lt, 0.15, 1.35);
      callPose(ctx, { up, headYaw: 0.1, headPitch: -0.02 });
      c.face('neutral', t);
      helm(ctx);
      const e = K.eyePoint(c), push = sramp(lt, 0.0, 3.4), d = lerp(4.7, 2.85, push), H = 2 * d * Math.tan(17 * PI / 180);
      const lookX = lerp(CALL.x - 0.33, e.x + 0.19, push);
      const look = [lookX, e.y - lerp(0.2 * H, 0.2, push), e.z];
      seaCam(ctx, { pos: [lookX, dy + lerp(1.72, 2.5, push), e.z + d], look, fov: 34 }, 0.6);
      ctx.store.focus = K.dist(ctx, e); ctx.store.ap = lerp(0.42, 1.3, push);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 3, aperture: ctx.store.ap || 1.3, maxBlur: 18 } })),
  },

  // ─────────────────────────────────────────── 5 · b24 · "You sound different." ────────────────────────────────────
  {
    name: 'a4.5 then she went quiet (b24)', start: 'b24-0.11', set: 'boat', cast: ['copy'],
    setup(ctx) {
      callSetup(ctx, { captain: null });
      const dy = ctx.set.deckY;
      const key = ctx.add(new THREE.PointLight('#dfe6ee', 5.5, 5, 2)); key.position.set(CALL.x - 1.15, dy + 2.2, CALL.z + 1.2);
    },
    update(ctx, lt) {
      const c = ctx.cast.copy;
      callPose(ctx, { up: 1, headYaw: 0.1, headPitch: -0.02, breathe: 0.15 });
      c.face('neutral', noBlinkT(c));                                        // he does not blink
      const e = K.eyePoint(c), d = 2.5 * (1 - 0.05 * (lt / 4.2)), v = callView(ctx, CALL_AZ * 0.6, d);   // the slow push: 5 %
      const look = [e.x + v.right[0] * 0.02, e.y - 0.14, e.z + v.right[1] * 0.02];
      ctx.cam.set({ pos: [look[0] + v.dir[0] * d, e.y + 0.12, look[2] + v.dir[1] * d], look, fov: 20 });
      ctx.cam.shake(0.01, ctx.t, 7);
      ctx.store.focus = K.dist(ctx, e);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 2.3, aperture: 1.6, maxBlur: 20 } })),
  },

  // ─────────────────────────────────────────── 6 · b25a · "I'm not different, Mom." ────────────────────────────────
  {
    name: 'a4.6 he turns to the lens (b25a)', start: 'b25-0.11', set: 'boat', cast: ['copy', 'captain'],
    setup(ctx) {
      callSetup(ctx);
      const dy = ctx.set.deckY;
      const key = ctx.add(new THREE.PointLight('#dfe6ee', 7.5, 5.5, 2)); key.position.set(CALL.x - 1.2, dy + 2.2, CALL.z + 1.5);
    },
    update(ctx, lt) {
      const c = ctx.cast.copy, dy = ctx.set.deckY;
      const turn = sramp(lt, 0.5, 1.1), lower = sramp(lt, 0.25, 1.2), fall = ramp(lt, 1.28, 1.95);
      const camP = [CALL.x + 0.04, dy + 1.5, CALL.z + 3.15];
      // body and head come round from the far-off look of the call to dead on the lens
      const yaw = lerp(CALL.yaw, -0.1, turn), yawToLens = Math.atan2(camP[0] - CALL.x, camP[2] - CALL.z) - yaw;
      c.root.rotation.y = yaw;
      callPose(ctx, { up: 1, lower, fall, headYaw: lerp(0.1, yawToLens, turn), headPitch: lerp(-0.02, 0.04, turn), breathe: 0.25 });
      c.face(lt > 0.98 ? 'grin' : 'neutral', noBlinkT(c));
      helm(ctx);
      seaCam(ctx, { pos: camP, look: [CALL.x + 0.05, dy + 1.22, CALL.z], fov: 34 }, 0.5);
      ctx.store.focus = K.dist(ctx, K.eyePoint(c));
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 3.1, aperture: 1.2, maxBlur: 16 } })),
  },

  // ─────────────────────────────────────────── 7 · b25b · the knight, nose screen-right (match cut to b06) ─────────
  {
    name: 'a4.7 the knight, nose screen-right (b25b)', start: 'match25-0.08', set: 'boat', cast: ['copy'],
    setup(ctx) {
      ctx.place('copy', [CALL.x, ctx.set.deckY, CALL.z], { yaw: 0 });
      ctx.store.kick = ctx.add(new THREE.PointLight('#dfe8f2', 4.4, 6, 2));
      ctx.store.low = ctx.add(new THREE.PointLight('#a9c4ff', 1.0, 3, 2));
    },
    update(ctx, lt) {
      const c = ctx.cast.copy, t = ctx.t;
      K.filmPose(c, 'stand', t, { breathe: 0.6 });
      const f = K.emblemFrame(c, { dy: EMBLEM_DY });
      // the smoothing hand: his rag hand (rig R → his visible LEFT) comes in from SCREEN-RIGHT, crosses the knight once, leaves
      const e = V(f.look[0], f.look[1] - EMBLEM_DY, f.look[2]);
      const n = V(f.pos[0] - f.look[0], 0, f.pos[2] - f.look[2]).normalize(), sr = V(n.z, 0, -n.x);   // sr = screen-right
      const inn = sramp(lt, 0.12, 0.5), out = sramp(lt, 0.98, 1.4), k = inn * (1 - out), s = sramp(lt, 0.42, 1.0);
      if (k > 0) {
        const tgt = e.clone().addScaledVector(sr, lerp(0.14, -0.09, s)).addScaledVector(V(0, 1, 0), lerp(0.025, -0.03, s)).addScaledVector(n, 0.075);
        const p = reach(c, 'R', tgt, [-0.9, 1.45, 0.0, -1.6]);
        const r0 = [0.02, 0, -0.1, -0.12];
        K.joint(c, 'armR', lerp(r0[0], p[0], k), lerp(r0[1], p[1], k), lerp(r0[2], p[2], k)); K.joint(c, 'foreArmR', lerp(r0[3], p[3], k), 0, 0);
      }
      ctx.cam.set(f); ctx.store.focus = f.focus;
      // b06's two lights, mirrored left ↔ right with the rest of him
      ctx.store.kick.position.set(f.look[0], f.look[1] + 0.75, f.look[2]).addScaledVector(n, 0.5).addScaledVector(sr, 1.1);
      ctx.store.low.position.set(f.look[0], f.look[1] - 0.45, f.look[2]).addScaledVector(n, 0.45).addScaledVector(sr, 0.5);
    },
    post: K.shotPost((ctx) => ({ dof: { focus: ctx.store.focus || 1.7, aperture: 1.2, maxBlur: 16 } })),
  },

  // ─────────────────────────────────────────── 8 · b26 · under the glass ───────────────────────────────────────────
  {
    name: 'a4.8 Mom... that\'s not me (b26)', start: 'flash26', set: 'cave', cast: ['me'], options: { pool: 'glass', ripple: 0, mist: 0 },
    setup(ctx) { poolSetup(ctx); ctx.cam.set(K.poolTop(ctx.set, POOL_TOP)); },
    update(ctx, lt) {
      const lv = torchLevel(ctx.t), light = 0.25 + 0.75 * sramp(lt, 0.1, 0.75);
      poolKid(ctx, { light });
      ctx.props.phone.setLevel(lv);
      K.flash(ctx, [{ at: 'flash26', power: 0.9 }], { bolt: null });
      poolFilm(ctx, lv, { light });
      K.stamp(ctx, '3:12 AM', { at: 'tl', alpha: ramp(lt, 0.5, 0.9) });
    },
    post: K.shotPost({}),
  },

  // ─────────────────────────────────────────── 9 · b27a · palms on the glass ───────────────────────────────────────
  {
    name: 'a4.9 they stopped looking for me (b27a)', start: 'b27-0.1', set: 'cave', cast: ['me'], options: { pool: 'glass', ripple: 0, mist: 0 },
    setup(ctx) { poolSetup(ctx); },
    update(ctx, lt) {
      const lv = torchLevel(ctx.t);
      poolKid(ctx, { light: 1.15 });
      ctx.props.phone.setLevel(lv);
      poolFilm(ctx, lv, { light: 1.15 });
      ctx.cam.set(K.poolTop(ctx.set, { height: POOL_TOP.height, fov: 32 - 0.7 * (lt / 1.7), dz: 1.24 }));
      K.stamp(ctx, '3:12 AM', { at: 'tl' });
    },
    post: K.shotPost({}),
  },

  // ─────────────────────────────────────────── 10 · b27b · he sinks; the loop flash ────────────────────────────────
  {
    name: 'a4.10 because they think they found me (b27b)', start: 'b27.w5-0.12', set: 'cave', cast: ['me'], options: { pool: 'glass', ripple: 0, mist: 0 },
    setup(ctx) { poolSetup(ctx); ctx.cam.set(K.poolTop(ctx.set, POOL_TOP)); },
    update(ctx, lt) {
      const t = ctx.t, t0 = ctx.time('b27.w5'), tl = ctx.time('loopflash'), end = ctx.timeline.duration;
      const sink = ramp(t, t0 + 0.55, t0 + 2.0), lv = torchLevel(t, t0 + 0.15, t0 + 1.25);
      poolKid(ctx, { sink });
      ctx.props.phone.setLevel(lv);
      // the flash that starts in the cave mouth and is cut off at ~60 %: frame 0 of the film is its peak
      const u = ramp(t, tl, end - 1 / 30);
      ctx.store.loop = u;
      if (u > 0) K.applyFlash(ctx, 0.62 * Math.pow(u, 1.4), { bolt: null });
      poolFilm(ctx, lv, { rings: sramp(t, t0 + 0.2, t0 + 0.6), t0: t0 + 0.2, light: 1 - 0.75 * smooth(sink), release: sink > 0 ? t - (t0 + 0.55) : -1 });   // only the drip rings remain
      K.stamp(ctx, '3:12 AM', { at: 'tl' });
    },
    post: K.shotPost((ctx) => (ctx.store.loop > 0 ? { fade: { color: '#dfe6ee', amount: 0.3 * Math.pow(ctx.store.loop, 2) } } : {})),
  },
];
