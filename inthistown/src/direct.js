// Director's helpers used by shots.js: chess move playback, crowds, prop placement.
// Everything is a pure function of time (see SPEC.md §2).
//
// ═══ v2 CAMERA + HUSS HELPERS (style bible v2 §3, §7; ep30 engine_features 4 and 8) — ADDITIVE, nothing above changed ═══
// Look-dev of every helper: src/kits/test_direction.js (+ test_direction_timeline.json).
// The frame is 9:16 portrait: the engine's fov is VERTICAL, horizontal fov ≈ 0.56 × vertical. Captions sit at 58–60 %
// of the frame height, so every character helper puts the subject's FACE at frame [0.5, 0.30] (upper third) by default.
// Call the helpers in shot.update every frame (they set ctx.cam for this frame and return what they did); they are
// pure functions of ctx.t / ctx.lt / ctx.u plus the scene, so random access and re-renders give identical frames.
//
//   configureDirect({ focusOn, bounds })  once at module load:
//       focusOn  look.js's focusOn → every helper also sets depth of field on its subject (closer = shallower):
//                import { focusOn } from '../lib/look.js'; configureDirect({ focusOn });  (without it: no DOF)
//       bounds   boxBounds([x0,y0,z0], [x1,y1,z1]) | (ctx) => box | null — keep helper cameras inside the room: a
//                camera outside the box slides toward its subject along the subject→camera ray (angle kept, the
//                subject just gets bigger). e.g. the home kit hall: (ctx) => ctx.set.__name === 'home' ?
//                boxBounds([-1.15, 0.12, 0.15], [1.15, 3.25, 9.85]) : null. Per call: bounds: box | null.
//   boxBounds(min, max) → { min, max }
//
// Common options (every camera helper accepts them):
//   fov            vertical fov (deg)                     frame  [sx, sy] screen position (0..1 from top-left) of the
//   dutch          roll in degrees (+ = clockwise)               subject point; default [0.5, 0.30] for faces
//   handheld       shake amount (default 0.06; false = locked off): cam.shake + a slow positional drift
//   drift          drift amplitude in m (default 0.035)   seed   noise seed (default from the shot index)
//   push           slow push-in: fraction of the camera→subject distance travelled over the shot (default 0.06;
//                  0 = none; negative = pull out)          u      progress used for push (default ctx.u)
//   dof            aperture for the auto DOF (number) or false (no DOF); part  'face' | 'head' | 'chest' | 'hands' |
//                  'feet' | 'top' | 'root' (which point of a character is framed / focused)
//   offset         [x,y,z] world metres added to the subject point (e.g. insert on a photo standing on a table anchor)
//   bounds         camera box for this call (overrides configureDirect; null = none)
//   apply          false → compute and return the spec without touching ctx.cam
// Every camera helper returns { pos, look, fov, roll, target } (Vector3s, fov deg, roll rad) — the cam spec it set.
// Subjects ("who") may be a cast id ('me'), a Character, an Object3D, a Vector3, [x,y,z] or a set anchor name.
//
//   aimLook(pos, target, { fov, frame, roll }) → look Vector3 so that `target` lands exactly on frame [sx, sy]
//   projectFrom(pos, look, fov, roll, point) → [sx, sy, ndcZ]   where a world point lands for that camera
//   subjectPoint(ctx, who, part = 'face') → world Vector3 of a subject (parts as `part` above)
//   shoot(ctx, { pos, target, fov, frame, look?, … })   the core: push / drift / bounds / aim / dutch / handheld / DOF,
//            then ctx.cam.set. Use it for any custom placement (pos + target Vector3s) to get the same treatment.
//   closeUp(ctx, who, { size = 0.34 (head height as a fraction of frame height), angle = 0.25 (rad around the
//            subject, 0 = straight in front, + = toward the subject's left), elev = 4 (deg above face height),
//            dist (overrides size), yaw (absolute world yaw of the camera direction from the subject), fov = 36,
//            dof 0.7 })                medium close-up; size 0.2 ≈ medium shot, 0.45 ≈ tight close-up
//   ecu(ctx, who, o)                     extreme close-up on the face: size 0.6, fov 30, frame [0.5, 0.33], dof 1.2
//   ots(ctx, over, at, { side = 'R' (over's right shoulder) | 'L', back = 1.8, up = 0.1, overEdge = 0.3 / 0.7,
//            sideOff = 0.72 (used only with overEdge:false), fov = 34 })
//            over-the-shoulder PAST THE HEADPHONES: camera behind `over`'s head, aimed at `at` (framed at x 0.62 / 0.38,
//            y 0.32); the sideways offset is solved so the inner edge of `over`'s 0.64 m block head sits at frame x
//            overEdge — head + headphones fill the near third, soft (focus on `at`).
//   pov(ctx, who, { at (subject to look at) | pitch = -30 (deg, without `at`), yaw = 0 (rad, rel. to facing),
//            fov = 70, hideHead = true, eye = [0, 0.34, 0.33] (head-joint local), hands = true, handsY = 0.86 })
//            first-person from `who`'s eyes. hideHead hides his head joint for the shot (headphones included; the
//            engine restores visibility at the next shot change). hands: if his hands would fall below frame y
//            handsY the camera tilts down until they sit there (the `at` subject never goes above y 0.12). Put his
//            hands forward with the pose, e.g. ch.pose('idle', t, { reachL: 'out', reachR: 'out' }) or reach to a
//            world point.
//   insert(ctx, target, { size = 0.3 (m: subject size that fills `fill` of the frame height), fill = 0.45,
//            fov = 24 (clamped 20–28), angle (world yaw the camera looks ALONG; default: facing the target's +Z
//            front), elev = 18 (deg down onto it), track = 0.05 (m lateral slide over the shot), frame [0.5, 0.36],
//            dof = 1.3 })              macro prop insert
//   lowHero(ctx, who, { height = 0.45 (camera m above the subject's feet), dist = 2.3·scale, angle = 0.3, fov = 42,
//            frame [0.5, 0.28] })      low hero from kid height, looking up at the face
//   topDown(ctx, target, { height = 3.0 (m above the target point), maxY (ceiling clamp, e.g. 3.25 indoors),
//            heading (world yaw that points to the TOP of the frame; default subject facing), spin = 0 (rad/s),
//            fov = 50 })               "god" shot straight down
//   wide(ctx, who, { size = 0.065, angle = 0.4, elev = 8, fov = 40, frame = [0.5, 0.34] })   character-in-room wide
//            (indoors it is usually limited by `bounds`: the camera backs up to the wall)
//   dutch(ctx, deg = 8, { sway = 1.5 (deg), rate = 0.35 (Hz) })  roll the camera set this frame (re-aims the last
//            helper call so its subject stays framed)
//   pushIn(ctx, amount = 0.12, { u, ease = 'inOutSine' })          re-applies the last helper call with a push-in;
//   pushIn(ctx, spec, amount, { u })                               or pushes a raw {pos, look, fov} toward its look
//   handheld(ctx, amount = 0.06, { drift = 0.035, seed })           shake + drift on whatever ctx.cam holds
//   whipIn(ctx, { at = shot start (anchor|seconds), dur = 0.3, angle = 0.75 (rad yaw), dir = 1, shake = 1.2,
//            smear = true })  frame-0 whip: a fast yaw settling onto the framed camera + heavy decaying shake + a
//            fov kick, plus a cheap horizontal smear (2D, fx.draw) as motion blur. Call AFTER the framing helper.
//            Returns k (1 at the start of the whip → 0 settled). Skipped inside bookend().
//   dipWhite(ctx, at, { dur = 0.5 (total s), hold = 0.06, color = '#fff', peak = 1 }) → alpha
//            time-jump dip through white centred on anchor `at`; fx.overlay. Call it in BOTH shots around the cut.
//   bookend(ctx, ref, { lt, u })   replays shot 1's camera with a changed scene: ref = a camera function
//            (ctx, lt, u) => void | a shot def with a `camera(ctx, lt, u)` field | a shot name or index (ctx.shots).
//            Write shot 1's camera as such a function and call it from both shots. whipIn is skipped inside it.
//
//   hussBeat(ctx, t = ctx.t, { who = 'me', beat (HUSS beat id; default: the HUSS beat nearest t), double = false,
//            face = 'huss', faceHold = 0.32, punch = 0.11, shake = 0.35, slow = 0.3, rate = 0.3, ramp = 0.07,
//            stamp = 'caption' | 'fx' | false, stampY = 0.59 })
//            → { t (WARPED time: drive the body/prop animation with it), raw, hits, on, k, since, beat }
//            The HUSS ritual (bible §3): cam.punch on the hit(s) (+ a short impact shake), ~0.3 s of ramped slow
//            motion after the hit (rate 0.3×; returned as warped time — time-warp only what you animate with it),
//            the 'huss' strain face on `who` from just before the first hit to faceHold after the last, and the
//            yellow HUSS! stamp: the captions already draw it for HUSS words ('caption'); 'fx' draws it via fx.draw
//            (use when captions are hidden in the shot). double:false → only the FIRST hit of the beat is treated;
//            double:true → every hit (H1 / H4) and the slow-mo spans first → last hit + slow.
//            The music dip is audio (audio/build_episode.py); the foley impact is a script sfx.
import * as THREE from 'three';
import { clamp, hash, ease, noise1, lerp } from './lib/util.js';
import { drawHussStamp } from './engine.js';

// ───────────────────────────────────────────────────────────────────────────────── chess (no rules)
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

function fenToGrid(fen) {
  const rows = fen.split(' ')[0].split('/');
  const g = [];
  for (let r = 0; r < 8; r++) {           // r = 0 is rank 8
    const row = [];
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) for (let k = 0; k < +ch; k++) row.push(null);
      else row.push(ch);
    }
    g.push(row);
  }
  return g;
}

function gridToFen(g) {
  return g.map((row) => {
    let s = '', e = 0;
    for (const c of row) { if (!c) e++; else { if (e) s += e; e = 0; s += c; } }
    return s + (e || '');
  }).join('/');
}

const sqRC = (sq) => [8 - +sq[1], sq.charCodeAt(0) - 97];

export function applyMove(fen, from, to) {
  const g = fenToGrid(fen);
  const [fr, fc] = sqRC(from), [tr, tc] = sqRC(to);
  g[tr][tc] = g[fr][fc];
  g[fr][fc] = null;
  return gridToFen(g);
}

/**
 * A timed move list: [{ from, to, at, dur }] — the piece lands exactly at `at` (seconds, global).
 * play(chess, t) puts the board in the right state for time t (pure: setFEN + one move + slam).
 */
export function moveTrack(moves, startFen = START_FEN, { slamDur = 0.32 } = {}) {
  const ms = moves.map((m) => ({ dur: 0.2, ...m })).sort((a, b) => a.at - b.at);
  const fens = [startFen];
  for (const m of ms) fens.push(applyMove(fens[fens.length - 1], m.from, m.to));
  return {
    moves: ms, fens,
    fenAt(t) { let i = 0; while (i < ms.length && ms[i].at <= t) i++; return fens[i]; },
    play(chess, t) {
      let i = 0;
      while (i < ms.length && ms[i].at <= t) i++;
      const next = ms[i];
      if (next && t > next.at - next.dur) {
        chess.setFEN(fens[i]);
        chess.move(next.from, next.to, clamp((t - (next.at - next.dur)) / next.dur, 0, 1));
      } else {
        chess.setFEN(fens[i]);
        const last = ms[i - 1];
        if (last && t - last.at < slamDur && chess.slam && !last.noSlam) chess.slam(last.to, clamp((t - last.at) / slamDur, 0, 1));
      }
      return i;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────── placement
const _q = new THREE.Quaternion(), _e = new THREE.Euler();

export function yawOf(obj) {
  obj.updateWorldMatrix(true, false);
  obj.getWorldQuaternion(_q);
  _e.setFromQuaternion(_q, 'YXZ');
  return _e.y;
}

/** World position of `anchor` + local offset (in the anchor's frame). */
export function rel(anchor, off = [0, 0, 0]) {
  anchor.updateWorldMatrix(true, false);
  return anchor.localToWorld(new THREE.Vector3(off[0], off[1], off[2]));
}

/** ctx.add(obj) and put it at anchor (+ local offset), rotated with the anchor (+ extra yaw). */
export function putProp(ctx, obj, anchorName, { offset = [0, 0, 0], yaw = 0, faceAnchor = null, scale } = {}) {
  const root = obj.root && obj.root.isObject3D ? obj.root : obj;
  ctx.add(root);
  const a = typeof anchorName === 'string' ? ctx.anchor(anchorName) : anchorName;
  root.position.copy(rel(a, offset));
  const base = faceAnchor ? yawOf(typeof faceAnchor === 'string' ? ctx.anchor(faceAnchor) : faceAnchor) : yawOf(a);
  root.rotation.set(0, base + yaw, 0);
  if (scale != null) root.scale.setScalar(scale);
  return obj;
}

// ────────────────────────────────────────────────────────────────────────────────────────── crowds
/**
 * Place characters in a loose grid around an anchor (offsets in the anchor frame; rows go along +Z
 * unless rowDir = -1). Returns [{ ch, phase, k }] for animateCrowd().
 */
export function crowdGrid(ctx, ids, anchorName, { cols = 5, dx = 1.15, dz = 1.2, jitter = 0.3, yaw = 0, yawJitter = 0.5,
  offset = [0, 0, 0], seed = 1, rowDir = 1, hats = false } = {}) {
  const out = [];
  ids.forEach((id, i) => {
    const ch = ctx.cast[id];
    if (!ch) return;
    const col = i % cols, row = Math.floor(i / cols);
    const jx = (hash(i * 7.1 + seed) - 0.5) * 2 * jitter, jz = (hash(i * 3.3 + seed * 2) - 0.5) * 2 * jitter;
    const x = (col - (cols - 1) / 2) * dx + jx + (row % 2 ? dx * 0.5 : 0) + offset[0];
    const z = row * dz * rowDir + jz + offset[2];
    ctx.place(ch, anchorName, { offset: [x, offset[1], z], yaw: yaw + (hash(i * 5.7 + seed) - 0.5) * yawJitter });
    if (hats && ch.setAccessory) ch.setAccessory('partyHat', true);
    out.push({ ch, phase: hash(i * 1.9 + seed) * 3, k: i });
  });
  return out;
}

export function animateCrowd(list, t, { action = null, face = 'grin', speed = 1, faces = null, params = {} } = {}) {
  for (const c of list) {
    const act = action || (c.k % 3 === 0 ? 'dance2' : 'dance');
    c.ch.pose(act, t + c.phase, { speed: speed * (0.88 + 0.24 * hash(c.k + 0.5)), ...params });
    c.ch.face(faces ? faces[c.k % faces.length] : face, t + c.phase);
  }
}


// ═══════════════════════════════════════════════════════════════════════════════════════ v2 camera helpers
const DIRECT = { focusOn: null, bounds: null };
export function configureDirect(o = {}) {
  if ('focusOn' in o) DIRECT.focusOn = o.focusOn;
  if ('bounds' in o) DIRECT.bounds = o.bounds;
  return DIRECT;
}
/** A camera box for `bounds`: boxBounds([x0, y0, z0], [x1, y1, z1]). */
export const boxBounds = (min, max) => ({ min, max });
// Keep the camera inside the room: slide it toward the subject along the subject→camera ray (so the angle is kept and
// the subject just gets bigger) until it is inside `box`. A subject outside the box falls back to a per-axis clamp.
function clipToBox(pos, T, box) {
  const mn = box.min, mx = box.max, P = [pos.x, pos.y, pos.z], Q = [T.x, T.y, T.z];
  const inside = (v) => v.every((x, i) => x >= mn[i] - 1e-6 && x <= mx[i] + 1e-6);
  if (inside(P)) return pos;
  if (!inside(Q)) return new THREE.Vector3(clamp(P[0], mn[0], mx[0]), clamp(P[1], mn[1], mx[1]), clamp(P[2], mn[2], mx[2]));
  let sMax = 1;
  for (let i = 0; i < 3; i++) {
    const d = P[i] - Q[i];
    if (d > 1e-9 && P[i] > mx[i]) sMax = Math.min(sMax, (mx[i] - Q[i]) / d);
    if (d < -1e-9 && P[i] < mn[i]) sMax = Math.min(sMax, (mn[i] - Q[i]) / d);
  }
  return T.clone().add(pos.clone().sub(T).multiplyScalar(Math.max(0.05, sMax)));
}

const ASPECT = 9 / 16;
const D2R = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);
const FACE_L = [0, 0.3, 0.3], HEAD_L = [0, 0.3, 0];

function charOf(ctx, who) {
  if (typeof who === 'string' && ctx.cast && ctx.cast[who]) return ctx.cast[who];
  return who && who.joints && who.root ? who : null;
}
/** World point of a subject: character part ('face' default) | Object3D | Vector3 | [x,y,z] | anchor name. */
export function subjectPoint(ctx, who, part = 'face') {
  const ch = charOf(ctx, who);
  if (ch) {
    const J = ch.joints;
    ch.root.updateMatrixWorld(true);
    if (part === 'face' || part === 'head') { const l = part === 'face' ? FACE_L : HEAD_L; return J.head.localToWorld(new THREE.Vector3(l[0], l[1], l[2])); }
    if (part === 'top') return J.head.localToWorld(new THREE.Vector3(0, 0.62, 0));
    if (part === 'chest') return (J.torso || J.hips).localToWorld(new THREE.Vector3(0, 0.35, 0.18));
    if (part === 'hands') { const a = (J.handR || J.armR).getWorldPosition(new THREE.Vector3()); return a.add((J.handL || J.armL).getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5); }
    if (part === 'feet') { const a = (J.footR || J.legR).getWorldPosition(new THREE.Vector3()); return a.add((J.footL || J.legL).getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5); }
    if (part === 'root') return ch.root.getWorldPosition(new THREE.Vector3());
    return J.head.getWorldPosition(new THREE.Vector3());
  }
  if (who && who.isObject3D) { who.updateMatrixWorld(true); return who.getWorldPosition(new THREE.Vector3()); }
  if (who && who.root && who.root.isObject3D) { who.root.updateMatrixWorld(true); return who.root.getWorldPosition(new THREE.Vector3()); }
  if (who && who.isVector3) return who.clone();
  if (Array.isArray(who)) return new THREE.Vector3(who[0], who[1], who[2]);
  return ctx.point(who);
}
/** World yaw a subject faces (+Z of its root / object), radians, three.js convention (0 = facing +Z). */
function facingOf(ctx, who) {
  const ch = charOf(ctx, who);
  const o = ch ? ch.root : (who && who.isObject3D ? who : (who && who.root && who.root.isObject3D ? who.root : (typeof who === 'string' ? ctx.anchor(who) : null)));
  return o && o.isObject3D ? yawOf(o) : 0;
}
/** World size of a character's block head (m): 0.64 × its scale. */
function headSize(ctx, who) {
  const ch = charOf(ctx, who);
  if (!ch) return 0.64;
  const s = new THREE.Vector3(); ch.joints.head.getWorldScale(s);
  return 0.64 * s.y;
}
// subject point + optional world offset o.offset [x,y,z]
const pt = (ctx, who, part, o) => { const p = subjectPoint(ctx, who, part); if (o && o.offset) p.add(new THREE.Vector3(...o.offset)); return p; };
const dirFromYaw = (yaw) => new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));   // yaw 0 → +Z

/**
 * look point so that `target` projects to frame [sx, sy] (0..1, from top-left) for a camera at `pos` with vertical
 * `fov` (deg), 9:16 aspect and roll `roll` (rad, applied after lookAt like the engine does). Exact (no iteration).
 */
export function aimLook(pos, target, { fov = 40, frame = [0.5, 0.5], roll = 0, aspect = ASPECT } = {}) {
  const P = pos.isVector3 ? pos : new THREE.Vector3(...pos), T = target.isVector3 ? target : new THREE.Vector3(...target);
  const d = T.clone().sub(P); const len = d.length();
  if (len < 1e-6) return P.clone().add(new THREE.Vector3(0, 0, -1));
  d.divideScalar(len);
  const ty = Math.tan(fov * D2R / 2), tx = ty * aspect;
  const nx = (2 * frame[0] - 1) * tx, ny = (1 - 2 * frame[1]) * ty;
  const c = Math.cos(roll), s = Math.sin(roll);
  const a = nx * c - ny * s, b = nx * s + ny * c;          // camera-frame direction before the roll
  const n = Math.sqrt(a * a + b * b + 1);
  const phi = Math.asin(clamp(n * d.y / Math.sqrt(1 + b * b), -1, 1)) - Math.atan(b);
  const beta = Math.atan2(a, Math.cos(phi) - b * Math.sin(phi));
  const alphaT = Math.atan2(d.x, -d.z);
  const ac = alphaT - beta;
  return P.clone().add(new THREE.Vector3(Math.sin(ac) * Math.cos(phi), Math.sin(phi), -Math.cos(ac) * Math.cos(phi)));
}

const _pc = new THREE.PerspectiveCamera(40, ASPECT, 0.05, 1000);
/** Screen position [sx, sy] (0..1 from top-left) of world point `p` for a camera { pos, look, fov, roll } (no shake). */
export function projectFrom(pos, look, fov, roll, p) {
  _pc.fov = fov; _pc.aspect = ASPECT; _pc.updateProjectionMatrix();
  _pc.position.copy(pos); _pc.up.set(0, 1, 0); _pc.lookAt(look); if (roll) _pc.rotateZ(roll);
  _pc.updateMatrixWorld(true);
  const v = p.clone().project(_pc);
  return [(v.x + 1) / 2, (1 - v.y) / 2, v.z];
}

const easeFn = (e) => (typeof e === 'function' ? e : (ease[e] || ease.inOutSine || ease.linear));

/** The core of every helper. req: { pos, target, fov, frame, dutch|roll, handheld, drift, push, u, seed, dof, focus,
 *  part, apply }. pos/target: Vector3. */
export function shoot(ctx, req) {
  const r = { fov: 40, frame: [0.5, 0.3], handheld: 0.06, drift: 0.035, push: 0.06, ...req };
  const seed = r.seed ?? (ctx.shotIndex * 7.31 + 3);
  const target = r.target.clone();
  let pos = r.pos.clone();
  const u = r.u ?? ctx.u ?? 0;
  if (r.push) {
    const k = easeFn(r.pushEase || 'inOutSine')(clamp(u, 0, 1));
    pos = target.clone().add(pos.clone().sub(target).multiplyScalar(1 - r.push * k));
  }
  if (r.drift && r.handheld !== false) {
    const t = ctx.t;
    pos.x += r.drift * noise1(t * 0.23, seed + 21);
    pos.y += r.drift * 0.6 * noise1(t * 0.19, seed + 22);
    pos.z += r.drift * noise1(t * 0.21, seed + 23);
  }
  const bnd = r.bounds !== undefined ? r.bounds : (typeof DIRECT.bounds === 'function' ? DIRECT.bounds(ctx) : DIRECT.bounds);
  if (bnd && r.look == null) pos = clipToBox(pos, target, bnd);
  const roll = r.roll != null ? r.roll : (r.dutch ? r.dutch * D2R : 0);
  const look = r.look ? r.look.clone() : aimLook(pos, target, { fov: r.fov, frame: r.frame, roll });
  const spec = { pos, look, fov: r.fov, roll, target, focus: r.focus || target };
  if (r.apply !== false) {
    ctx.cam.set({ pos, look, fov: r.fov, roll });
    if (r.handheld && !r.__reapply) ctx.cam.shake(r.handheld, ctx.t, seed);
    if (DIRECT.focusOn && r.dof !== false && r.dof != null) DIRECT.focusOn(ctx, r.focusTarget ?? spec.focus, { aperture: r.dof, part: r.part || 'face' });
  }
  return spec;
}

function around(ctx, who, o, defs) {
  const r = { ...defs, ...o };
  const part = r.part || 'face';
  const T = pt(ctx, who, part, r);
  const hs = headSize(ctx, who);
  const dist = r.dist ?? hs / (r.size * 2 * Math.tan(r.fov * D2R / 2));
  const yaw = (r.yaw != null ? r.yaw : facingOf(ctx, who) + (r.angle || 0));
  const el = (r.elev || 0) * D2R;
  const dir = dirFromYaw(yaw).multiplyScalar(Math.cos(el)); dir.y = Math.sin(el);
  const pos = T.clone().add(dir.multiplyScalar(dist));
  if (r.minY != null) pos.y = Math.max(pos.y, r.minY);
  if (r.maxY != null) pos.y = Math.min(pos.y, r.maxY);
  const focusTarget = charOf(ctx, who) ? (charOf(ctx, who)) : T;
  return shoot(ctx, { ...r, pos, target: T, focusTarget, part });
}

function closeUp_(ctx, who, o = {}) {
  return around(ctx, who, o, { size: 0.34, angle: 0.25, elev: 4, fov: 36, frame: [0.5, 0.3], dof: 0.7 });
}
function ecu_(ctx, who, o = {}) {
  return around(ctx, who, o, { size: 0.6, angle: 0.12, elev: 2, fov: 30, frame: [0.5, 0.33], dof: 1.2, push: 0.04, drift: 0.015, handheld: 0.05 });
}
function wide_(ctx, who, o = {}) {
  return around(ctx, who, o, { size: 0.065, angle: 0.4, elev: 8, fov: 40, frame: [0.5, 0.34], dof: 0.25, push: 0.05 });
}

function ots_(ctx, over, at, o = {}) {
  const r = { side: 'R', back: 1.8, sideOff: 0.72, up: 0.1, fov: 34, dof: 0.75, ...o };
  const H = subjectPoint(ctx, over, 'head');
  const atCh = charOf(ctx, at);
  const T = pt(ctx, at, r.part || 'face', r);
  const f = T.clone().sub(H); f.y = 0;
  if (f.lengthSq() < 1e-8) f.copy(dirFromYaw(facingOf(ctx, over)));
  f.normalize();
  const right = new THREE.Vector3().crossVectors(f, UP).normalize();   // the over character's right (looking along f)
  const sgn = r.side === 'L' ? -1 : 1;
  const s = headSize(ctx, over) / 0.64;
  const frame = r.frame || [sgn > 0 ? 0.62 : 0.38, atCh ? 0.32 : 0.4];
  const at_ = (side) => H.clone().addScaledVector(f, -r.back * s).addScaledVector(right, sgn * side * s).addScaledVector(UP, r.up * s);
  let side = r.sideOff;
  if (r.overEdge !== false) {
    // slide sideways until the INNER edge of `over`'s block head (the side toward the frame centre) sits at frame
    // x = overEdge (default 0.3 / 0.7): head + headphones fill the near third of the frame without covering `at`
    const want = r.overEdge ?? (sgn > 0 ? 0.3 : 0.7);
    const Hin = H.clone().addScaledVector(right, sgn * 0.34 * s);
    let lo = 0, hi = 3;
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2, P = at_(mid);
      const L = aimLook(P, T, { fov: r.fov, frame, roll: r.dutch ? r.dutch * D2R : 0 });
      const x = projectFrom(P, L, r.fov, r.dutch ? r.dutch * D2R : 0, Hin)[0];
      // more side offset moves the head toward the near edge (x → 0 for side R)
      if ((sgn > 0 ? x > want : x < want)) lo = mid; else hi = mid;
    }
    side = (lo + hi) / 2;
  }
  const pos = at_(side);
  return shoot(ctx, { ...r, pos, target: T, frame, focusTarget: atCh || T, part: atCh ? 'face' : r.part });
}

function pov_(ctx, who, o = {}) {
  const r = { pitch: -30, yaw: 0, fov: 70, hideHead: true, eye: [0, 0.34, 0.33], handheld: 0.05, drift: 0.02, push: 0, dof: 0.35, ...o };
  const ch = charOf(ctx, who);
  if (!ch) throw new Error('pov(): `who` must be a character');
  ch.root.updateMatrixWorld(true);
  const eye = ch.joints.head.localToWorld(new THREE.Vector3(...r.eye));
  if (r.hideHead) ch.joints.head.visible = false;
  let target, frame;
  if (r.at != null) { target = pt(ctx, r.at, charOf(ctx, r.at) ? 'face' : (r.part || 'face'), r); frame = r.frame || [0.5, 0.3]; }
  else {
    const yaw = facingOf(ctx, ch) + r.yaw, p = r.pitch * D2R;
    target = eye.clone().add(new THREE.Vector3(Math.sin(yaw) * Math.cos(p), Math.sin(p), Math.cos(yaw) * Math.cos(p)));
    frame = r.frame || [0.5, 0.5];
  }
  if (r.hands !== false && ch.joints.handL && ch.joints.handR) {
    // keep both hands in frame: if they would fall below frame y `handsY` (0.86), tilt down until they sit there
    const hp = subjectPoint(ctx, ch, 'hands');
    const L = aimLook(eye, target, { fov: r.fov, frame, roll: r.dutch ? r.dutch * D2R : 0 });
    const sy = projectFrom(eye, L, r.fov, r.dutch ? r.dutch * D2R : 0, hp)[1];
    const hy = r.handsY ?? 0.86;
    if (sy > hy) {
      const roll = r.dutch ? r.dutch * D2R : 0;
      let L2 = aimLook(eye, hp, { fov: r.fov, frame: [projectFrom(eye, L, r.fov, 0, hp)[0], hy], roll });
      // never push the looked-at subject off the top: then it sits at y 0.12 and the hands go as low as they must
      if (r.at != null && projectFrom(eye, L2, r.fov, roll, target)[1] < 0.12) L2 = aimLook(eye, target, { fov: r.fov, frame: [frame[0], 0.12], roll });
      return shoot(ctx, { ...r, pos: eye, target, look: L2, focusTarget: r.focus || (r.at != null ? (charOf(ctx, r.at) || target) : hp), part: r.at != null ? 'face' : 'hands' });
    }
  }
  return shoot(ctx, { ...r, pos: eye, target, frame, focusTarget: r.focus || (r.at != null ? (charOf(ctx, r.at) || target) : ch.joints.handR || target), part: r.at != null ? 'face' : 'hands' });
}

function insert_(ctx, target, o = {}) {
  const r = { size: 0.3, fill: 0.45, fov: 24, elev: 18, track: 0.05, frame: [0.5, 0.36], dof: 1.3, handheld: 0.04, drift: 0.01, push: 0.05, ...o };
  r.fov = clamp(r.fov, 20, 28);
  const T = o.point ? o.point.clone() : pt(ctx, target, r.part || 'face', r);
  const dist = r.dist ?? r.size / (r.fill * 2 * Math.tan(r.fov * D2R / 2));
  const yawFace = r.angle != null ? r.angle + Math.PI : facingOf(ctx, target);   // `angle` = direction the camera looks along
  const el = r.elev * D2R;
  const dir = dirFromYaw(yawFace).multiplyScalar(Math.cos(el)); dir.y = Math.sin(el);
  const pos = T.clone().addScaledVector(dir, dist);
  if (r.track) {
    const side = new THREE.Vector3().crossVectors(dir, UP).normalize();
    pos.addScaledVector(side, r.track * ((r.u ?? ctx.u ?? 0) - 0.5));
  }
  return shoot(ctx, { ...r, pos, target: T, focusTarget: T });
}

function lowHero_(ctx, who, o = {}) {
  const r = { height: 0.45, angle: 0.3, fov: 42, frame: [0.5, 0.28], dof: 0.45, push: 0.07, ...o };
  const s = headSize(ctx, who) / 0.64;
  const dist = r.dist ?? 2.3 * s;
  const ch = charOf(ctx, who);
  const base = ch ? subjectPoint(ctx, ch, 'root') : subjectPoint(ctx, who);
  const T = pt(ctx, who, r.part || 'face', r);
  const yaw = r.yaw != null ? r.yaw : facingOf(ctx, who) + r.angle;
  const pos = base.clone().addScaledVector(dirFromYaw(yaw), dist); pos.y = base.y + r.height;
  return shoot(ctx, { ...r, pos, target: T, focusTarget: ch || T });
}

function topDown_(ctx, target, o = {}) {
  const r = { height: 3.0, fov: 50, spin: 0, handheld: 0.035, drift: 0.015, push: 0.05, dof: 0.3, frame: [0.5, 0.5], ...o };
  const ch = charOf(ctx, target);
  const T = r.point ? r.point.clone() : pt(ctx, target, r.part || (ch ? 'chest' : 'face'), r);
  let y = T.y + r.height;
  if (r.maxY != null) y = Math.min(y, r.maxY);
  const h = Math.max(0.3, y - T.y);
  const heading = (r.heading != null ? r.heading : facingOf(ctx, target)) + r.spin * ctx.lt;
  const fwd = dirFromYaw(heading);
  // a hair off vertical so lookAt is well defined; the frame's top points along `heading`
  const pos = T.clone().addScaledVector(fwd, -h * 0.02); pos.y = T.y + h;
  return shoot(ctx, { ...r, pos, target: T, look: T.clone().addScaledVector(fwd, h * 0.001), focusTarget: ch || T, part: ch ? 'chest' : r.part });
}

// Every framing helper remembers its call for this frame so dutch() / pushIn() can re-run it with extra options
// (re-runs do not add a second shake).
function tracked(fn, nargs) {
  return function (ctx, ...args) {
    const res = fn(ctx, ...args);
    const o = args[nargs] || {};
    if (o.apply !== false && !o.__reapply) ctx.store.__dirCall = { fn, nargs, args, t: ctx.t };
    return res;
  };
}
export const closeUp = tracked(closeUp_, 1), ecu = tracked(ecu_, 1), wide = tracked(wide_, 1), ots = tracked(ots_, 2),
  pov = tracked(pov_, 1), insert = tracked(insert_, 1), lowHero = tracked(lowHero_, 1), topDown = tracked(topDown_, 1);
function reapply(ctx, extra) {
  const last = ctx.store.__dirCall;
  if (!last || last.t !== ctx.t) return null;
  const args = last.args.slice(0, last.nargs);
  while (args.length < last.nargs) args.push(undefined);
  return last.fn(ctx, ...args, { ...(last.args[last.nargs] || {}), ...extra, __reapply: true });
}

export function dutch(ctx, deg = 8, o = {}) {
  const { sway = 1.5, rate = 0.35 } = o;
  const d = deg + sway * Math.sin(ctx.t * rate * Math.PI * 2);
  const re = reapply(ctx, { dutch: d });
  if (re) return re;
  const st = ctx.cam.state;
  ctx.cam.set({ roll: d * D2R });
  return { pos: st.pos, look: st.look, fov: st.fov, roll: d * D2R };
}

export function pushIn(ctx, a = 0.12, b, c) {
  if (a && typeof a === 'object' && a.pos) {          // pushIn(ctx, spec, amount, { u, ease })
    const spec = a, amount = b ?? 0.12, o = c || {};
    const P = ctx.point(spec.pos), L = ctx.point(spec.look);
    const k = easeFn(o.ease || 'inOutSine')(clamp(o.u ?? ctx.u, 0, 1));
    const pos = L.clone().add(P.clone().sub(L).multiplyScalar(1 - amount * k));
    ctx.cam.set({ pos, look: L, fov: spec.fov, roll: spec.roll });
    return { pos, look: L, fov: spec.fov, roll: spec.roll || 0 };
  }
  const o = b || {};
  const re = reapply(ctx, { push: a, ...(o.u != null ? { u: o.u } : {}), ...(o.ease ? { pushEase: o.ease } : {}) });
  if (re) return re;
  const st = ctx.cam.state;
  return pushIn(ctx, { pos: st.pos, look: st.look, fov: st.fov, roll: st.roll }, a, o);
}

export function handheld(ctx, amount = 0.06, o = {}) {
  const seed = o.seed ?? (ctx.shotIndex * 7.31 + 3), dr = o.drift ?? 0.035;
  if (dr) {
    const st = ctx.cam.state, t = ctx.t;
    const off = new THREE.Vector3(dr * noise1(t * 0.23, seed + 21), dr * 0.6 * noise1(t * 0.19, seed + 22), dr * noise1(t * 0.21, seed + 23));
    ctx.cam.set({ pos: st.pos.add(off), look: st.look.add(off) });
  }
  if (amount) ctx.cam.shake(amount, ctx.t, seed);
}

export function whipIn(ctx, o = {}) {
  if (ctx.store.__bookend && o.inBookend !== true) return 0;
  const { dur = 0.3, angle = 0.75, dir = 1, shake = 1.2, smear = true, fovKick = 0.18 } = o;
  const t0 = o.at != null ? ctx.time(o.at) : ctx.t - ctx.lt;
  const x = (ctx.t - t0) / dur;
  if (x < 0 || x >= 1) return 0;
  const k = 1 - ease.outCubic(x);
  const st = ctx.cam.state;
  const v = st.look.clone().sub(st.pos);
  v.applyAxisAngle(UP, -angle * dir * k);
  ctx.cam.set({ look: st.pos.clone().add(v), fov: st.fov * (1 + fovKick * k) });
  ctx.cam.shake(shake * k, ctx.t, 97, 2.5);
  if (smear && k > 0.08) {
    const px = 70 * k * dir;
    ctx.fx.draw((g, W) => {
      const taps = 4;
      for (let i = 1; i <= taps; i++) { g.globalAlpha = 0.5 / (i + 1); g.drawImage(g.canvas, 0, 0, g.canvas.width, g.canvas.height, (px * i / taps) * (W / 1080), 0, W, g.canvas.height * (W / g.canvas.width)); }
      g.globalAlpha = 1;
    });
  }
  return k;
}

export function dipWhite(ctx, at, o = {}) {
  const { dur = 0.5, hold = 0.06, color = '#fff', peak = 1 } = o;
  const tc = typeof at === 'number' ? at : ctx.time(at);
  const d = Math.abs(ctx.t - tc) - hold / 2;
  const a = d <= 0 ? peak : peak * (1 - ease.inOutSine(clamp(d / (dur / 2 - hold / 2), 0, 1)));
  if (a > 0.002) ctx.fx.overlay(color, a);
  return a;
}

export function bookend(ctx, ref, o = {}) {
  let fn = null, start = null, end = null;
  if (typeof ref === 'function') fn = ref;
  else if (ref && typeof ref.camera === 'function') fn = ref.camera;
  else if ((typeof ref === 'string' || typeof ref === 'number') && ctx.shots) {
    const s = ctx.shots.find((x) => (typeof ref === 'number' ? x.index === ref : x.name === ref));
    if (!s) throw new Error(`bookend(): no shot ${JSON.stringify(ref)}`);
    if (typeof s.def.camera !== 'function') throw new Error(`bookend(): shot "${s.name}" has no camera(ctx, lt, u) function`);
    fn = s.def.camera; start = s.start; end = s.end;
  }
  if (!fn) throw new Error('bookend(): ref must be a camera function, a shot def with .camera, or a shot name/index');
  const lt = o.lt ?? ctx.lt;
  const u = o.u ?? (start != null && end > start ? clamp(lt / (end - start), 0, 1) : ctx.u);
  const prev = ctx.store.__bookend;
  ctx.store.__bookend = true;
  try { return fn(ctx, lt, u); } finally { ctx.store.__bookend = prev; }
}


// ═══════════════════════════════════════════════════════════════════════════════════════ HUSS ritual
function nearestHussBeat(ctx, t) {
  let best = null, bd = Infinity;
  for (const b of ctx.beats || []) {
    if (b.kind !== 'huss') continue;
    const d = t < b.start ? b.start - t : (t > b.end ? t - b.end : 0);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}
// ∫ of a smoothstep plateau bump that rises over [a, a+L] and falls over [b−L, b]
function bumpIntegral(t, a, b, L) {
  if (t <= a) return 0;
  const sm = (u) => L * (u * u * u - u * u * u * u / 2);
  if (t < a + L) return sm((t - a) / L);
  if (t < b - L) return L / 2 + (t - a - L);
  if (t < b) return L / 2 + (b - L - a - L) + (L / 2 - sm((b - t) / L));
  return b - a - L;
}

export function hussBeat(ctx, t = ctx.t, o = {}) {
  const r = { who: 'me', double: false, face: 'huss', faceHold: 0.32, punch: 0.11, shake: 0.35, slow: 0.3, rate: 0.3, ramp: 0.07,
    stamp: 'caption', stampY: 0.59, ...o };
  const beat = r.beat ? ctx.beat(r.beat) : nearestHussBeat(ctx, t);
  const out = { t, raw: t, hits: [], on: false, k: 0, since: Infinity, beat: beat ? beat.id : null };
  if (!beat) return out;
  let hits = ctx.hussTimes(beat.id);
  if (!hits.length) hits = [beat.start];
  if (!r.double) hits = hits.slice(0, 1);
  out.hits = hits;
  const h0 = hits[0], h1 = hits[hits.length - 1];
  // time warp (slow motion after the hit, ramped in and out)
  const a = h0 - 0.03, b = Math.max(h1 + r.slow, a + 2 * r.ramp + 0.01);
  out.t = t - (1 - r.rate) * bumpIntegral(t, a, b, r.ramp);
  // punch + impact shake
  if (r.punch) ctx.cam.punch(hits, t, r.punch, 0.22);
  if (r.shake) {
    let env = 0;
    for (const h of hits) { const d = t - h; if (d >= 0 && d < 0.6) env = Math.max(env, Math.exp(-d / 0.09)); }
    if (env > 0.01) ctx.cam.shake(r.shake * env, t, 61, 3);
  }
  // strain face
  const f0 = h0 - 0.06, f1 = h1 + r.faceHold;
  out.on = t >= f0 && t < f1;
  out.k = t < f0 ? 0 : (t < h0 ? (t - f0) / (h0 - f0) : (t < f1 ? 1 : Math.max(0, 1 - (t - f1) / 0.25)));
  const last = hits.filter((h) => h <= t).pop();
  out.since = last != null ? t - last : Infinity;
  const ch = charOf(ctx, r.who);
  if (ch && r.face && out.on) ch.face(r.face, t);
  // stamp
  if (r.stamp === 'fx') {
    hits.forEach((h, i) => {
      const next = hits[i + 1] ?? Infinity;
      const lt = t - h;
      if (lt >= 0 && t < Math.min(next, h + 0.61)) ctx.fx.draw((g) => drawHussStamp(g, { lt, seed: i + 1, y: r.stampY }));
    });
  }
  return out;
}
