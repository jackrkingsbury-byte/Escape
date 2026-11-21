import * as THREE from 'three';
export * from '/src/shots.stubtest.js';
import * as S from '/src/shots.stubtest.js';
const base = S.shots.find((s) => s.name === 'the mayor');
export const shots = [{
  name: 'debug overhead', start: 0, set: 'town',
  setup(ctx) {
    base.setup(ctx);
    for (const n of ['square.chairA', 'square.chairB', 'square.table']) {
      const a = ctx.anchor(n); const p = new THREE.Vector3(); a.getWorldPosition(p);
      const q = new THREE.Quaternion(); a.getWorldQuaternion(q);
      const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      ctx.add(new THREE.ArrowHelper(dir, p.clone().add(new THREE.Vector3(0, 2.2, 0)), 1.2, n.endsWith('A') ? 0x00ff00 : n.endsWith('B') ? 0xff0000 : 0x0000ff, 0.3, 0.2));
    }
  },
  update(ctx) {
    base.update(ctx, 0.5, 0.5);
    const p = ctx.point('square.table');
    ctx.cam.set({ pos: p.clone().add(new THREE.Vector3(0.01, 7, 0.01)), look: p, fov: 45 });
  },
}];
