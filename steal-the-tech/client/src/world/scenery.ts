// The static city: ground, the Tech Belt conveyor with its two portals, the
// hub buildings (drop machines, market, raid board, trade hub, stage…),
// street lamps and a neon skyline. Live screens are canvas textures the
// engine redraws every few seconds.
import * as THREE from 'three';
import { BELT, WORLD, ZONES } from './layout';
import { canvasTex, gBox, gCyl, gRBox, gSph, gTor, gPlane, glow, std } from './models';

export interface Screen {
  tex: THREE.CanvasTexture;
  c: CanvasRenderingContext2D;
  w: number;
  h: number;
}

function screen(w: number, h: number): Screen {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, c, w, h };
}

export interface DropMachine {
  id: string;
  group: THREE.Group;
  crate: THREE.Mesh;
  light: THREE.MeshBasicMaterial;
  pos: THREE.Vector3;
}

export interface Scenery {
  group: THREE.Group;
  beltTex: THREE.Texture;
  portalTexA: THREE.Texture;
  portalTexB: THREE.Texture;
  screens: { market: Screen; raid: Screen; stage: Screen; fame: Screen; kiosk: Screen; museum: Screen };
  machines: DropMachine[];
  zoneLabelPos: Record<string, THREE.Vector3>;
  spinners: THREE.Object3D[];
  update(t: number, dt: number): void;
}

const DROP_COLORS: Record<string, [string, string]> = {
  basic: ['#64748b', '#94a3b8'],
  premium: ['#1d4ed8', '#38bdf8'],
  elite: ['#6d28d9', '#a855f7'],
  ultra: ['#be185d', '#e879f9'],
  event: ['#c2410c', '#fb923c'],
  secret: ['#0b0612', '#c084fc'],
};

function add(parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, shadow = true) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = shadow;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

export function buildScenery(dropIds: string[]): Scenery {
  const group = new THREE.Group();
  const spinners: THREE.Object3D[] = [];

  // ── Ground ──────────────────────────────────────────────────────────
  const groundTex = canvasTex(
    256,
    256,
    (c) => {
      c.fillStyle = '#0d1326';
      c.fillRect(0, 0, 256, 256);
      c.strokeStyle = 'rgba(56,189,248,0.16)';
      c.lineWidth = 2;
      for (let i = 0; i <= 256; i += 64) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i, 256);
        c.stroke();
        c.beginPath();
        c.moveTo(0, i);
        c.lineTo(256, i);
        c.stroke();
      }
      c.fillStyle = 'rgba(232,121,249,0.08)';
      c.fillRect(0, 0, 4, 4);
    },
    true,
  );
  groundTex.repeat.set((WORLD.maxX - WORLD.minX + 80) / 8, (WORLD.maxZ - WORLD.minZ + 80) / 8);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.maxX - WORLD.minX + 80, WORLD.maxZ - WORLD.minZ + 80), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.9, metalness: 0.1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'ground';
  group.add(ground);

  // walkways along the belt
  const walk = std('#161d36', { rough: 0.8 });
  for (const s of [-1, 1]) {
    const w = add(group, gBox(BELT.x1 - BELT.x0 + 30, 0.04, 4.2), walk, 0, 0.02, s * 3.8, false);
    w.receiveShadow = true;
    add(group, gBox(BELT.x1 - BELT.x0 + 30, 0.05, 0.12), glow(s > 0 ? '#22d3ee' : '#e879f9', 0.9), 0, 0.03, s * 5.95, false);
  }

  // ── The Tech Belt ───────────────────────────────────────────────────
  const beltTex = canvasTex(
    128,
    128,
    (c) => {
      c.fillStyle = '#1a1f33';
      c.fillRect(0, 0, 128, 128);
      c.strokeStyle = 'rgba(250,204,21,0.75)';
      c.lineWidth = 10;
      for (let i = -1; i < 3; i++) {
        c.beginPath();
        c.moveTo(20 + i * 64, 20);
        c.lineTo(52 + i * 64, 64);
        c.lineTo(20 + i * 64, 108);
        c.stroke();
      }
    },
    true,
  );
  const beltLen = BELT.x1 - BELT.x0 + 8;
  beltTex.repeat.set(beltLen / 3.4, 1);
  const beltTop = new THREE.Mesh(new THREE.BoxGeometry(beltLen, BELT.height, BELT.width), [
    std('#11152a'), std('#11152a'),
    new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.6, metalness: 0.3, emissive: '#3b2f00', emissiveIntensity: 0.25 }),
    std('#11152a'), std('#11152a'), std('#11152a'),
  ]);
  beltTop.position.set(0, BELT.height / 2, 0);
  beltTop.receiveShadow = true;
  group.add(beltTop);
  for (const s of [-1, 1]) {
    add(group, gBox(beltLen, 0.16, 0.18), std('#2b3552', { metal: 0.8, rough: 0.3 }), 0, BELT.height + 0.05, s * (BELT.width / 2 + 0.05));
    add(group, gBox(beltLen, 0.04, 0.05), glow('#22d3ee'), 0, BELT.height + 0.14, s * (BELT.width / 2 + 0.05), false);
  }
  // rollers underneath (visual rhythm)
  for (let x = BELT.x0; x <= BELT.x1; x += 6) add(group, gCyl(0.18, 0.18, BELT.width + 0.4, 10), std('#394260', { metal: 0.8 }), x, 0.12, 0, false).rotation.x = Math.PI / 2;

  // portals: TECH FACTORY (start) and RECYCLER (end)
  const portal = (x: number, color: string, label: string, dir: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, 0);
    group.add(g);
    for (const s of [-1, 1]) {
      add(g, gRBox(4.2, 7.5, 2.4, 0.2), std('#1b2238', { metal: 0.7, rough: 0.35 }), 0, 3.75, s * 3.4);
      add(g, gBox(0.15, 7, 0.15), glow(color), -2.15 * dir, 3.6, s * 2.25, false);
    }
    add(g, gRBox(4.2, 1.6, 9.2, 0.2), std('#1b2238', { metal: 0.7, rough: 0.35 }), 0, 7.9, 0);
    add(g, gBox(4.3, 0.18, 9.3), glow(color), 0, 7.05, 0, false);
    const swirl = canvasTex(
      256,
      256,
      (c) => {
        const gr = c.createRadialGradient(128, 128, 10, 128, 128, 128);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(0.3, color);
        gr.addColorStop(1, '#05030a');
        c.fillStyle = gr;
        c.fillRect(0, 0, 256, 256);
        c.strokeStyle = 'rgba(255,255,255,0.35)';
        c.lineWidth = 6;
        for (let i = 0; i < 6; i++) {
          c.beginPath();
          c.arc(128, 128, 20 + i * 18, i, i + 2.4);
          c.stroke();
        }
      },
      true,
    );
    const pm = new THREE.MeshBasicMaterial({ map: swirl, toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
    const plane = new THREE.Mesh(gPlane(4.4, 6.4), pm);
    plane.rotation.y = Math.PI / 2;
    plane.position.set(0.3 * dir, 3.4, 0);
    g.add(plane);
    return { tex: swirl, label, pos: new THREE.Vector3(x, 9.8, 0) };
  };
  const pa = portal(BELT.x0 - 3.5, '#22d3ee', 'TECH FACTORY', 1);
  const pb = portal(BELT.x1 + 3.5, '#f43f5e', 'RECYCLER', -1);

  // ── Drop Zone machines ─────────────────────────────────────────────
  const machines: DropMachine[] = [];
  const nMach = dropIds.length;
  dropIds.forEach((id, i) => {
    const z = -12 + (24 * i) / Math.max(1, nMach - 1);
    const g = new THREE.Group();
    g.position.set(-81, 0, z);
    g.rotation.y = Math.PI / 2;
    group.add(g);
    const [a, b] = DROP_COLORS[id] || DROP_COLORS.basic;
    add(g, gRBox(3.0, 1.4, 2.6, 0.2), std('#1b2238', { metal: 0.6, rough: 0.35 }), 0, 0.7, 0);
    add(g, gRBox(3.1, 0.12, 2.7, 0.05), glow(b), 0, 1.45, 0, false);
    const dome = add(g, gSph(1.25, 24, 16), std('#bfe7ff', { rough: 0.05, opacity: 0.18 }), 0, 2.4, 0, false);
    dome.scale.set(1, 1.1, 1);
    const cm = new THREE.MeshStandardMaterial({ color: a, emissive: b, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.3 });
    const crate = add(g, gRBox(1.1, 1.1, 1.1, 0.12), cm, 0, 2.35, 0);
    add(crate, gBox(1.14, 0.18, 1.14), glow(id === 'secret' ? '#c084fc' : '#ffffff'), 0, 0, 0, false);
    const lm = glow(b);
    add(g, gTor(1.3, 0.05, Math.PI * 2, 6, 36), lm, 0, 1.52, 0, false).rotation.x = Math.PI / 2;
    add(g, gBox(2.2, 0.5, 0.1), glow('#0b1020'), 0, 0.85, 1.32, false);
    spinners.push(crate);
    machines.push({ id, group: g, crate, light: lm, pos: new THREE.Vector3(-81, 3.9, z) });
  });

  // ── Market building ─────────────────────────────────────────────────
  const market = new THREE.Group();
  market.position.set(-105, 0, 0);
  group.add(market);
  add(market, gBox(10, 12, 44), std('#141b33', { metal: 0.5, rough: 0.5 }), 0, 6, 0);
  for (let y = 2; y < 12; y += 2.5) add(market, gBox(10.2, 0.12, 44.2), glow('#22d3ee', 0.8), 0, y, 0, false);
  const mk = screen(1024, 256);
  const mScreen = new THREE.Mesh(gPlane(30, 7.5), new THREE.MeshBasicMaterial({ map: mk.tex, toneMapped: false }));
  mScreen.rotation.y = Math.PI / 2;
  mScreen.position.set(5.08, 7.2, 0);
  market.add(mScreen);
  // counters
  for (const z of [-7, 0, 7]) {
    add(group, gRBox(3, 1.1, 4, 0.1), std('#1f2a4a', { metal: 0.5 }), -97.5, 0.55, z);
    add(group, gBox(3.05, 0.08, 4.05), glow('#fbbf24'), -97.5, 1.12, z, false);
  }

  // ── Raid board ──────────────────────────────────────────────────────
  const rb = screen(512, 384);
  const raidBoard = new THREE.Group();
  raidBoard.position.set(81.5, 0, -16);
  group.add(raidBoard);
  add(raidBoard, gBox(1, 9, 1), std('#2b3552', { metal: 0.8 }), 0, 4.5, -5.5);
  add(raidBoard, gBox(1, 9, 1), std('#2b3552', { metal: 0.8 }), 0, 4.5, 5.5);
  add(raidBoard, gBox(0.6, 7, 12.5), std('#1b0f16'), 0, 5.5, 0);
  const rbm = new THREE.Mesh(gPlane(12, 6.6), new THREE.MeshBasicMaterial({ map: rb.tex, toneMapped: false }));
  rbm.rotation.y = -Math.PI / 2;
  rbm.position.set(-0.32, 5.5, 0);
  raidBoard.add(rbm);
  add(raidBoard, gBox(0.7, 0.2, 12.6), glow('#f43f5e'), 0, 9.05, 0, false);

  // ── Trade hub ───────────────────────────────────────────────────────
  const trade = new THREE.Group();
  trade.position.set(81.5, 0, 16);
  group.add(trade);
  add(trade, gRBox(3, 1.2, 10, 0.15), std('#1f2a4a', { metal: 0.5 }), 0, 0.6, 0);
  add(trade, gBox(3.05, 0.1, 10.05), glow('#4ade80'), 0, 1.22, 0, false);
  add(trade, gBox(0.4, 6, 0.4), std('#2b3552', { metal: 0.8 }), 1, 3, -4.6);
  add(trade, gBox(0.4, 6, 0.4), std('#2b3552', { metal: 0.8 }), 1, 3, 4.6);
  add(trade, gBox(0.6, 1.2, 9.6), std('#12301f'), 1, 6.2, 0);
  const holo = new THREE.Group();
  holo.position.set(-0.5, 3.2, 0);
  trade.add(holo);
  add(holo, gTor(0.9, 0.12, Math.PI * 1.6, 8, 30), glow('#4ade80'), 0, 0, 0, false);
  add(holo, gTor(0.6, 0.1, Math.PI * 1.6, 8, 30), glow('#22d3ee'), 0, 0, 0, false).rotation.z = Math.PI;
  spinners.push(holo);

  // ── Event stage ─────────────────────────────────────────────────────
  const stage = new THREE.Group();
  stage.position.set(103.5, 0, 0);
  group.add(stage);
  add(stage, gBox(13, 1.4, 24), std('#1b2238', { metal: 0.5 }), 0, 0.7, 0);
  add(stage, gBox(13.1, 0.1, 24.1), glow('#e879f9'), 0, 1.42, 0, false);
  for (const z of [-11, 11]) add(stage, gBox(0.5, 12, 0.5), std('#475569', { metal: 0.9 }), -5, 6, z);
  add(stage, gBox(0.5, 0.5, 22.5), std('#475569', { metal: 0.9 }), -5, 12, 0);
  const st = screen(768, 384);
  const stm = new THREE.Mesh(gPlane(18, 9), new THREE.MeshBasicMaterial({ map: st.tex, toneMapped: false }));
  stm.rotation.y = -Math.PI / 2;
  stm.position.set(4, 7.5, 0);
  stage.add(stm);
  add(stage, gBox(0.4, 9.4, 18.4), std('#0b0f19'), 4.25, 7.5, 0);

  // ── Hall of fame obelisk ────────────────────────────────────────────
  const fame = screen(256, 512);
  const ob = new THREE.Group();
  ob.position.set(-73, 0, -30);
  group.add(ob);
  add(ob, gCyl(1.6, 2.4, 1, 6), std('#1b2238', { metal: 0.7 }), 0, 0.5, 0);
  add(ob, gCyl(0.9, 1.4, 11, 4), std('#141b33', { metal: 0.7, rough: 0.3 }), 0, 6.5, 0).rotation.y = Math.PI / 4;
  const fm = new THREE.Mesh(gPlane(1.8, 3.6), new THREE.MeshBasicMaterial({ map: fame.tex, toneMapped: false }));
  fm.position.set(0, 6, 1.18);
  fm.rotation.x = 0.05;
  ob.add(fm);
  const crown = add(ob, gCyl(0.6, 0.8, 0.8, 8), glow('#fbbf24'), 0, 12.6, 0, false);
  spinners.push(crown);

  // ── Missions kiosk ──────────────────────────────────────────────────
  const kiosk = screen(256, 256);
  const kg = new THREE.Group();
  kg.position.set(-73, 0, 30);
  group.add(kg);
  add(kg, gRBox(3.4, 3, 3.4, 0.3), std('#1b2238', { metal: 0.6 }), 0, 1.5, 0);
  const km = new THREE.Mesh(gPlane(2.6, 2.6), new THREE.MeshBasicMaterial({ map: kiosk.tex, toneMapped: false }));
  km.position.set(0, 1.6, -1.72);
  km.rotation.y = Math.PI;
  kg.add(km);
  const bang = add(kg, gBox(0.5, 1.6, 0.5), glow('#fde047'), 0, 5, 0, false);
  add(kg, gBox(0.5, 0.5, 0.5), glow('#fde047'), 0, 3.8, 0, false);
  spinners.push(bang);

  // ── Collection museum ───────────────────────────────────────────────
  const museum = screen(256, 128);
  const mu = new THREE.Group();
  mu.position.set(84, 0, 33);
  group.add(mu);
  add(mu, gBox(8, 0.8, 10), std('#e2e8f0', { rough: 0.8 }), 0, 0.4, 0);
  for (const z of [-4, -1.35, 1.35, 4]) add(mu, gCyl(0.35, 0.35, 5.5, 12), std('#f1f5f9', { rough: 0.7 }), -3.4, 3.5, z);
  add(mu, gBox(8.4, 0.8, 10.4), std('#e2e8f0', { rough: 0.8 }), 0, 6.6, 0);
  const roof = add(mu, gCyl(0.01, 6, 2.2, 4), std('#cbd5e1'), 0, 8.1, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 1, 1.2);
  const mum = new THREE.Mesh(gPlane(4, 2), new THREE.MeshBasicMaterial({ map: museum.tex, toneMapped: false }));
  mum.rotation.y = -Math.PI / 2;
  mum.position.set(-4.25, 6.6, 0);
  mu.add(mum);

  // ── Street lamps & trees ────────────────────────────────────────────
  const pole = std('#2b3552', { metal: 0.8, rough: 0.3 });
  for (let x = BELT.x0 + 4; x <= BELT.x1 - 4; x += 11) {
    for (const s of [-1, 1]) {
      add(group, gCyl(0.08, 0.1, 4.2, 8), pole, x, 2.1, s * 5.6, false);
      add(group, gBox(0.9, 0.12, 0.3), pole, x, 4.2, s * 5.3, false);
      add(group, gBox(0.7, 0.06, 0.22), glow(s > 0 ? '#a5f3fc' : '#f5d0fe'), x, 4.12, s * 5.2, false);
    }
  }
  const treeCol = ['#22d3ee', '#e879f9', '#a3e635'];
  const treeSpots: [number, number][] = [
    [-66, -14], [-66, 14], [66, -8], [66, 8], [-92, -30], [-92, 30], [95, -30], [95, 30], [-60, -38], [60, 38], [-30, 38], [30, -38],
  ];
  treeSpots.forEach(([x, z], i) => {
    add(group, gCyl(0.25, 0.35, 2, 8), std('#3b2a1a'), x, 1, z);
    add(group, gCyl(0, 1.6, 3.6, 6), std(treeCol[i % 3], { emissive: treeCol[i % 3], ei: 0.45, flat: true }), x, 3.8, z);
  });

  // ── Skyline (instanced towers with lit windows) ─────────────────────
  const winTex = canvasTex(
    64,
    128,
    (c) => {
      c.fillStyle = '#0a0f22';
      c.fillRect(0, 0, 64, 128);
      for (let y = 4; y < 128; y += 10)
        for (let x = 4; x < 64; x += 12) {
          const on = Math.random() < 0.45;
          c.fillStyle = on ? (Math.random() < 0.5 ? '#fde68a' : '#7dd3fc') : '#141b33';
          c.fillRect(x, y, 7, 5);
        }
    },
    true,
  );
  const towerMat = new THREE.MeshBasicMaterial({ map: winTex, color: '#b8c4e8' });
  const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), towerMat, 70);
  const m4 = new THREE.Matrix4();
  let k = 0;
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  for (let i = 0; i < 70; i++) {
    const side = i % 4;
    let x = 0;
    let z = 0;
    if (side === 0) { x = rnd(-150, 150); z = rnd(-95, -70); }
    else if (side === 1) { x = rnd(-150, 150); z = rnd(70, 95); }
    else if (side === 2) { x = rnd(-160, -135); z = rnd(-70, 70); }
    else { x = rnd(135, 160); z = rnd(-70, 70); }
    const h = rnd(18, 70);
    const w = rnd(8, 16);
    m4.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, w));
    towers.setMatrixAt(k++, m4);
  }
  group.add(towers);

  // stars
  const starGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = 0.15 + Math.random() * 1.2;
    const r = 320;
    sp[i * 3] = Math.cos(a) * Math.cos(e) * r;
    sp[i * 3 + 1] = Math.sin(e) * r;
    sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#dbeafe', size: 1.4, sizeAttenuation: false, fog: false }));
  group.add(stars);

  const zoneLabelPos: Record<string, THREE.Vector3> = {
    drops: new THREE.Vector3(-81, 7.5, 0),
    market: new THREE.Vector3(-100, 13.5, 0),
    leaderboard: new THREE.Vector3(-73, 14.5, -30),
    quests: new THREE.Vector3(-73, 7, 30),
    raid: new THREE.Vector3(81.5, 10.5, -16),
    trade: new THREE.Vector3(81.5, 7.8, 16),
    event: new THREE.Vector3(103.5, 13.5, 0),
    collection: new THREE.Vector3(84, 10.2, 33),
    factory: pa.pos,
    recycler: pb.pos,
  };
  for (const z of ZONES) if (!zoneLabelPos[z.id]) zoneLabelPos[z.id] = new THREE.Vector3(z.anchor.x, 6, z.anchor.z);

  return {
    group,
    beltTex,
    portalTexA: pa.tex,
    portalTexB: pb.tex,
    screens: { market: mk, raid: rb, stage: st, fame, kiosk, museum },
    machines,
    zoneLabelPos,
    spinners,
    update(t: number, dt: number) {
      beltTex.offset.x -= dt * (1 / 3.4) * ((BELT.x1 - BELT.x0) / 36);
      pa.tex.rotation = t * 0.8;
      pa.tex.center.set(0.5, 0.5);
      pb.tex.rotation = -t * 0.8;
      pb.tex.center.set(0.5, 0.5);
      for (const s of spinners) s.rotation.y += dt * 1.2;
    },
  };
}
