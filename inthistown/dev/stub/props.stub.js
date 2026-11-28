// TEMPORARY stand-in for src/props.js (boxes), only for camera-framing tests before props.js exists.
import * as THREE from 'three';
const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
const box = (w, h, d, c, y = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.y = y; m.castShadow = true; return m; };
export function makeChessSet(opts = {}) {
  const size = opts.size || 0.62, sq = size / 8;
  const root = new THREE.Group();
  const board = box(size + 0.04, 0.03, size + 0.04, '#b58863', -0.015); root.add(board);
  const pieces = {};
  const files = 'abcdefgh';
  const sqToLocal = (s) => new THREE.Vector3((files.indexOf(s[0]) - 3.5) * sq, 0, (+s[1] - 4.5) * sq);
  const map = new Map();
  function setFEN(fen) {
    for (const p of root.children.slice(1)) p.visible = false;
    let i = 1; const rows = fen.split(' ')[0].split('/');
    rows.forEach((row, r) => { let f = 0; for (const ch of row) { if (/\d/.test(ch)) { f += +ch; continue; }
      let m = root.children[i]; if (!m) { m = box(sq * 0.6, sq * 1.2, sq * 0.6, '#fff'); root.add(m); }
      m.material = M(ch === ch.toUpperCase() ? '#f5efe0' : '#2a2626'); m.visible = true; m.rotation.set(0, 0, 0);
      const p = sqToLocal(files[f] + (8 - r)); m.position.set(p.x, sq * 0.6, p.z); map.set(files[f] + (8 - r), m); f++; i++; } });
  }
  const api = { root, squareSize: sq, reset() { map.clear(); setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'); },
    setFEN(f) { map.clear(); setFEN(f); }, squareToLocal: sqToLocal, pieceAt: (s) => map.get(s) || null,
    move(from, to, u) { const m = map.get(from); if (!m) return; const a = sqToLocal(from), b = sqToLocal(to); m.position.set(a.x + (b.x - a.x) * u, sq * 0.6 + Math.sin(Math.PI * u) * 0.08, a.z + (b.z - a.z) * u); },
    slam(sq_, u) { const m = map.get(sq_); if (m) m.scale.y = 1 - 0.25 * Math.sin(Math.PI * u); },
    topple(s, u) { const m = map.get(s); if (m) m.rotation.z = u * Math.PI / 2; },
    knockAll(u) { let k = 0; for (const m of map.values()) { m.rotation.z = u * (k % 2 ? 1.5 : -1.5); m.position.x += u * 0.1 * Math.sin(k); k++; } },
    highlight() {} };
  api.reset(); return api;
}
export function makeChessClock() { const root = new THREE.Group(); root.add(box(0.22, 0.1, 0.08, '#6b4a3a', 0.05)); return { root, press() {}, setTimes() {}, update() {} }; }
export function makePartyHat(c) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 12), M(c)); return m; }
export function makeCake() { const root = new THREE.Group(); root.add(box(0.25, 0.12, 0.25, '#ffb6d9', 0.06)); return { root, update() {} }; }
export function makeTable(o = {}) { const g = new THREE.Group(); g.add(box(o.w || 0.9, 0.05, o.d || 0.8, '#a0703a', 0.755)); g.add(box(0.08, 0.73, 0.08, '#7a5230', 0.365)); return g; }
export function makeChair() { const g = new THREE.Group(); g.add(box(0.45, 0.05, 0.45, '#c04040', 0.525)); g.add(box(0.45, 0.5, 0.05, '#c04040', 0.8)); g.children[1].position.z = -0.22; return g; }
export function makeBed() { const g = new THREE.Group(); g.add(box(1.0, 0.45, 2.0, '#4a6bd8', 0.225)); return g; }
export function makePlate() { const root = new THREE.Group(); const food = new THREE.Group(); food.add(box(0.12, 0.02, 0.12, '#ffd23f', 0.02)); root.add(box(0.22, 0.015, 0.22, '#fff', 0.008)); root.add(food); return { root, food }; }
export function makeSpeaker() { const root = new THREE.Group(); root.add(box(0.5, 0.9, 0.4, '#222', 0.45)); return { root, update() {} }; }
export function makeBalloon(c) { return new THREE.Mesh(new THREE.SphereGeometry(0.2), M(c)); }
export function makeConfetti() { return { root: new THREE.Group(), update() {} }; }
export function makeSweatDrop() { return new THREE.Mesh(new THREE.SphereGeometry(0.03), M('#4fb3ff')); }
export function makeImpactBurst() { const root = new THREE.Group(); root.add(new THREE.Mesh(new THREE.RingGeometry(0.05, 0.08, 16), M('#ffe14a'))); root.children[0].rotation.x = -Math.PI / 2; return { root, update(u) { root.scale.setScalar(0.5 + u * 2); } }; }
