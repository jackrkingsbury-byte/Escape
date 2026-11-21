// Director's helpers used by shots.js: chess move playback, crowds, prop placement.
// Everything is a pure function of time (see SPEC.md §2).
import * as THREE from 'three';
import { clamp, hash } from './lib/util.js';

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
