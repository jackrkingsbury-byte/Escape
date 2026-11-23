// In This Town — Episode 26 "Who Bit the Town?": new props.
//
//   makeVoxHouse(o)      a town house built from 0.5 m blocks (same footprint/height as world.js houses: w × 7 m, walls 5.8 m,
//                        stepped gable roof along X, front faces +Z).  Bites = spheres (house-local {x,y,z,r}) carved out
//                        of walls + roof as stepped craters; the inside is CAKE (sponge, jam layer, cream caps).
//                        o: { w, wall, roof, trim, door, shutters, bites, roofBites2 (extra bites for the 'bitten roof'
//                        variant), chimney, chimneyBitten, crumbs, sign:{text,bg,fg}, awning:[c1,c2], seed }
//                        userData: { roof (Group), roofB (Group | null, bitten roof variant, hidden), H, rh, top,
//                          paint(u, color, from = -1|1), setLit(k), setRoof(hex, glow), roofMat }
//   makeBiteWall()       pink cake wall 4 × 3 m with a stepped tooth-notch bite out of the top and ONE square tab where a
//                        front tooth is missing.  origin bottom centre, faces +Z.  userData.gap = local point of the tab.
//   makeGarage()         Mrs. Plum's garage cut clean in half: the left half only, cut face = cake layers (faces +X).
//   makeFork(o)          giant silver fork, tines point −Y, origin = tine tips centre.  Unit metres (≈ 34 m long).
//   makeGiantKid()       blocky giant kid head + shoulders, unit = head height 1 (origin head centre, faces +Z).
//                        userData.set(t, { eyes:'open'|'shut'|'happy'|'side', mouth:'smile'|'grin'|'open'|'o'|'flat',
//                        tongue 0..1, cheeks 0..1, sweat bool, hat bool, brows 0 | 'worried' | 'up', look [x,y] })
//   makeMatch()          giant match, unit length 1 along +Y (head at +Y).  userData.set(t, { lit 0..1, flare 0..1 })
//   makeWick()           black candle wick ~3.2 m (origin at its base).  userData.set(t, ember 0..1)
//   makePlateCake(o)     the town's plate + cake: frosting top disc, cake band, silver plate + rim, giant sprinkles.
//                        userData.parts { top, band, plate, rim, sprinkles }; userData.rimOnly(on)
//   makeSprinkles(n, w, d, size)   instanced rainbow sprinkles in a w × d rectangle (origin centre, y = 0)
//   makeCrumbs(n, w, d, cols)      instanced cake crumbs
//   makeHotSauce()       GRANDMA'S EXTRA SPICY bottle, 2.1 m tall, origin bottom centre, label faces +Z
//   makeRoller(len, color)   paint roller on a pole (pole along −Y from the grip at origin; roller at the far end)
//   makePancakes(n)      Big Gus's tall pancake stack on a plate, origin bottom centre
//   makeDetectiveCap()   checked deerstalker; parent to joints.head at y ≈ 0.6
//   makeMagnifier()      magnifying glass, handle along −Y from origin (grip), lens at +Y
//   makeCorkboard26()    corkboard 1.5 × 1.1 with bitten-house photos + red string; userData.photo = the loose photo
//   makeLawnChair()      striped lawn chair, seat height 0.42, faces +Z
//   makeTeeth(gap)       a bright row of big teeth (for Big Gus's grin), width 0.36, origin centre, faces +Z
//   makeTongue()         small pink tongue (for the lick), origin at the root, sticks out along +Z
//   makeRedRing()        red highlight ring (plane, faces +Z, always on top), radius 1
//   makeShadowShape()    dark fork-silhouette plane (passes behind the bedroom window)
//   makeSteam(n)         rising puffs (spicy steam), userData.set(t, k)
import * as THREE from 'three';
import { clamp, lerp, hash, canvasTexture } from '../lib/util.js';
import { std, box, cyl, sph, glowSprite, labelPlane } from '../ep18/props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _c = new THREE.Color();
const FONT_D = (s) => `${s}px "ITT Luckiest", "Luckiest Guy", "ITT World Display", Impact, "DejaVu Sans", sans-serif`;
const FONT_T = (s) => `900 ${s}px "ITT Nunito", "Nunito", "ITT World Text", "DejaVu Sans", sans-serif`;
function fit(g, text, font, maxW, s0) { let s = s0; g.font = font(s); while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = font(s); } return s; }
function shadeHex(hex, k) { _c.set(hex); return '#' + _c.multiplyScalar(k).getHexString(); }

export const CAKE = { sponge: '#f3cf86', cream: '#fff4e6', jam: '#e8456f' };

/** InstancedMesh of unit boxes from items [{x,y,z,sx,sy,sz,c,rx,ry,rz}] */
function boxes(items, mat, { cast = true, receive = true } = {}) {
  const im = new THREE.InstancedMesh(UNIT, mat, Math.max(1, items.length));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  items.forEach((it, i) => {
    e.set(it.rx || 0, it.ry || 0, it.rz || 0); q.setFromEuler(e);
    m4.compose(V(it.x, it.y, it.z), q, V(it.sx, it.sy, it.sz)); im.setMatrixAt(i, m4);
    im.setColorAt(i, _c.set(it.c || '#ffffff'));
  });
  im.count = items.length; im.castShadow = cast; im.receiveShadow = receive;
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere(); im.userData.items = items;
  return im;
}

// ═════════════════════════════════════════════════════════════════════════════ voxel house
function columnSegs(cx, cz, H, bites, q = 0.5) {
  let segs = [[0, H]];
  for (const b of bites) {
    const dx = cx - b.x, dz = cz - b.z, d2 = dx * dx + dz * dz;
    if (d2 >= b.r * b.r) continue;
    const h = Math.sqrt(b.r * b.r - d2), lo = b.y - h, hi = b.y + h;
    const out = [];
    for (const [a, c] of segs) {
      if (hi <= a || lo >= c) { out.push([a, c]); continue; }
      if (lo > a) out.push([a, Math.floor(lo / q) * q]);
      if (hi < c) out.push([Math.ceil(hi / q) * q, c]);
    }
    segs = out.filter(([a, c]) => c - a > 0.01);
  }
  return segs;
}
const inside = (x, y, z, bites) => bites.some((b) => (x - b.x) ** 2 + (y - b.y) ** 2 + (z - b.z) ** 2 < b.r * b.r);

function roofGroup({ w, d, H, roof, nL, ov, s, bites, chimney, chimneyX, chimneyBitten, mat }) {
  const g = new THREE.Group(); g.name = 'roof';
  const rh = d * 0.42, ly = rh / nL, L = w + 2 * ov, nx = Math.round(L / s), cxs = L / nx;
  const items = [];
  for (let k = 0; k < nL; k++) {
    const hw = (d / 2 + ov) * (1 - k / nL) - (k ? 0 : 0);
    const nz = Math.max(1, Math.round((2 * hw) / s)), czs = (2 * hw) / nz;
    const y = H + (k + 0.5) * ly;
    const col = k % 2 ? shadeHex(roof, 0.88) : roof;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = -L / 2 + (i + 0.5) * cxs, z = -hw + (j + 0.5) * czs;
      if (inside(x, y, z, bites)) continue;
      items.push({ x, y, z, sx: cxs, sy: ly, sz: czs, c: col });
    }
  }
  // ridge cap
  for (let i = 0; i < nx; i++) {
    const x = -L / 2 + (i + 0.5) * cxs, y = H + rh + 0.08;
    if (!inside(x, y, 0, bites)) items.push({ x, y, z: 0, sx: cxs, sy: 0.16, sz: 0.5, c: shadeHex(roof, 0.75) });
  }
  if (chimney) {
    const cx = chimneyX * w, cz = -d * 0.18, ch = chimneyBitten ? rh * 0.62 : rh * 1.3;
    items.push({ x: cx, y: H + rh * 0.4 + ch / 2, z: cz, sx: 0.7, sy: ch, sz: 0.7, c: '#b5543f' });
    if (!chimneyBitten) items.push({ x: cx, y: H + rh * 0.4 + ch + 0.07, z: cz, sx: 0.84, sy: 0.14, sz: 0.84, c: '#5d4a42' });
    else {
      // jagged bite: three stepped stumps with cake inside
      const top = H + rh * 0.4 + ch;
      [[-0.2, 0.25, 0.3], [0.05, 0.05, 0.35], [0.22, -0.2, 0.3]].forEach(([ox, dy, sw]) => items.push({ x: cx + ox, y: top + dy / 2 + 0.1, z: cz, sx: sw, sy: 0.2 + Math.max(0, dy), sz: 0.7, c: '#b5543f' }));
      items.push({ x: cx, y: top + 0.02, z: cz, sx: 0.66, sy: 0.08, sz: 0.66, c: CAKE.sponge });
    }
  }
  const im = boxes(items, mat);
  g.add(im);
  g.userData = { im, items, rh };
  return g;
}

export function makeVoxHouse(o = {}) {
  const {
    w = 9, d = 7, H = 5.8, s = 0.5, wall = '#ffb3d1', roof = '#ff5c9a', trim = '#ffffff', door = '#ffd23f', shutters = null,
    bites = [], roofBites2 = null, chimney = true, chimneyX = 0.28, chimneyBitten = false, crumbs = 0, seed = 1, sign = null, awning = null,
    nL = 6, ov = 0.42, doorX = 0, base = '#8c7b6b', windowsBack = true,
  } = o;
  const g = new THREE.Group(); g.name = 'voxHouse';
  const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.82 });
  const roofMat = new THREE.MeshStandardMaterial({ roughness: 0.7, emissive: '#000000' });
  const trimMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  // ── body columns
  const items = [], extra = [];
  const gx = Math.round(w / s), gz = Math.round(d / s), sx = w / gx, sz = d / gz;
  const segAt = new Map();
  for (let i = 0; i < gx; i++) for (let k = 0; k < gz; k++) {
    const cx = -w / 2 + (i + 0.5) * sx, cz = -d / 2 + (k + 0.5) * sz;
    const edge = i === 0 || k === 0 || i === gx - 1 || k === gz - 1;
    const segs = columnSegs(cx, cz, H, bites);
    segAt.set(i + ',' + k, segs);
    for (const [a, c] of segs) {
      const cut = c < H - 0.01;
      const top = cut ? c - 0.12 : c;
      if (cut && edge && top - a > 0.6) {   // the bite contour shows cake layers on the facade: wall | jam | sponge | cream
        items.push({ x: cx, y: (a + top - 0.4) / 2, z: cz, sx, sy: top - 0.4 - a, sz, c: wall, base: wall, edge, i, k });
        extra.push({ x: cx, y: top - 0.36, z: cz, sx: sx * 1.002, sy: 0.08, sz: sz * 1.002, c: CAKE.jam });
        extra.push({ x: cx, y: top - 0.16, z: cz, sx: sx * 1.002, sy: 0.32, sz: sz * 1.002, c: CAKE.sponge });
      } else items.push({ x: cx, y: (a + top) / 2, z: cz, sx, sy: top - a, sz, c: edge && !cut ? wall : (edge ? CAKE.sponge : CAKE.sponge), base: edge && !cut ? wall : CAKE.sponge, edge: edge && !cut, i, k });
      if (cut) extra.push({ x: cx, y: top + 0.06, z: cz, sx: sx * 1.002, sy: 0.12, sz: sz * 1.002, c: CAKE.cream });
      if (!edge && a < 2.75 && top > 3.25) extra.push({ x: cx, y: 3.0, z: cz, sx: sx * 1.004, sy: 0.24, sz: sz * 1.004, c: CAKE.jam });
      // trim bands on the outside of edge columns
      if (edge) {
        const outs = [];
        if (k === gz - 1) outs.push([0, 1]); if (k === 0) outs.push([0, -1]); if (i === gx - 1) outs.push([1, 0]); if (i === 0) outs.push([-1, 0]);
        for (const [nx, nz] of outs) {
          const ex = cx + nx * (sx / 2 + 0.03), ez = cz + nz * (sz / 2 + 0.03);
          const bw = nx ? 0.08 : sx + 0.002, bd = nz ? 0.08 : sz + 0.002;
          if (a <= 2.92 && top >= 3.08) extra.push({ x: ex, y: 3.0, z: ez, sx: bw, sy: 0.16, sz: bd, c: trim });
          if (!cut && c >= H - 0.01) extra.push({ x: ex, y: H - 0.08, z: ez, sx: bw + (nx ? 0.04 : 0), sy: 0.16, sz: bd + (nz ? 0.04 : 0), c: trim });
        }
      }
    }
  }
  const body = boxes(items, bodyMat); g.add(body);
  const deco = boxes(extra, trimMat, { cast: false }); g.add(deco);
  g.add(box(w + 0.12, 0.44, d + 0.12, base, 0, 0.22, 0));
  // full-height test for openings on a face
  const covered = (lx, ly0, ly1, front) => {
    const i = clamp(Math.floor((lx + w / 2) / sx), 0, gx - 1), k = front ? gz - 1 : 0;
    const segs = segAt.get(i + ',' + k) || [];
    return segs.some(([a, c]) => a <= ly0 + 0.01 && c >= ly1 + 0.13);
  };
  // ── windows, door
  const glassMat = new THREE.MeshBasicMaterial({ color: '#9cc8ec' });
  const frameItems = [];
  const glasses = [];
  const addWin = (lx, ly, ww, wh, front, side = 0) => {
    if (!side) {
      if (!covered(lx - ww / 2, ly - wh / 2 - 0.15, ly + wh / 2 + 0.15, front) || !covered(lx + ww / 2, ly - wh / 2 - 0.15, ly + wh / 2 + 0.15, front)) return;
    }
    const sg = front ? 1 : -1, z = sg * (d / 2);
    if (side) {   // window on the ±X wall, centred at z = lx
      const x = side * (w / 2);
      frameItems.push({ x: x + side * 0.035, y: ly, z: lx, sx: 0.1, sy: wh + 0.2, sz: ww + 0.2, c: trim });
      frameItems.push({ x: x + side * 0.1, y: ly - wh / 2 - 0.12, z: lx, sx: 0.2, sy: 0.08, sz: ww + 0.36, c: trim });
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), glassMat); gm.position.set(x + side * 0.092, ly, lx); gm.rotation.y = side * PI / 2; g.add(gm); glasses.push(gm);
      frameItems.push({ x: x + side * 0.1, y: ly, z: lx, sx: 0.03, sy: wh, sz: 0.06, c: trim });
      return;
    }
    frameItems.push({ x: lx, y: ly, z: z + sg * 0.035, sx: ww + 0.2, sy: wh + 0.2, sz: 0.1, c: trim });
    frameItems.push({ x: lx, y: ly - wh / 2 - 0.12, z: z + sg * 0.1, sx: ww + 0.36, sy: 0.08, sz: 0.2, c: trim });
    frameItems.push({ x: lx, y: ly, z: z + sg * 0.1, sx: 0.06, sy: wh, sz: 0.03, c: trim });
    frameItems.push({ x: lx, y: ly + wh * 0.12, z: z + sg * 0.1, sx: ww, sy: 0.06, sz: 0.03, c: trim });
    if (shutters) for (const s2 of [-1, 1]) frameItems.push({ x: lx + s2 * (ww / 2 + 0.26), y: ly, z: z + sg * 0.05, sx: 0.34, sy: wh + 0.1, sz: 0.06, c: shutters });
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), glassMat); gm.position.set(lx, ly, z + sg * 0.092); if (!front) gm.rotation.y = PI; g.add(gm); glasses.push(gm);
  };
  for (const x of [-w * 0.32, 0, w * 0.32]) addWin(x, 4.35, 0.96, 1.2, true);
  for (const s2 of [-1, 1]) addWin(doorX + s2 * Math.max(w * 0.3, 1.7), 1.55, 1.05, 1.3, true);
  if (windowsBack) { for (const s2 of [-1, 1]) { addWin(s2 * w * 0.26, 4.35, 0.96, 1.2, false); addWin(s2 * w * 0.26, 1.55, 1.05, 1.3, false); } }
  for (const s2 of [-1, 1]) if (covered(s2 * (w / 2 - 0.1), 3.6, 5.1, true) && !bites.some((b) => Math.abs(b.x - s2 * w / 2) < b.r + 0.3 && b.y - b.r < 5.2)) addWin(0, 4.35, 0.9, 1.1, true, s2);
  const dz = d / 2;
  frameItems.push({ x: doorX, y: 1.14, z: dz + 0.03, sx: 1.36, sy: 2.36, sz: 0.1, c: trim });
  frameItems.push({ x: doorX, y: 1.08, z: dz + 0.07, sx: 1.06, sy: 2.14, sz: 0.08, c: door });
  frameItems.push({ x: doorX, y: 1.62, z: dz + 0.12, sx: 0.6, sy: 0.5, sz: 0.02, c: '#f4efe4' });
  frameItems.push({ x: doorX, y: 0.09, z: dz + 0.42, sx: 1.7, sy: 0.18, sz: 0.78, c: '#a8a196' });
  frameItems.push({ x: doorX, y: 2.62, z: dz + 0.42, sx: 1.9, sy: 0.1, sz: 0.95, c: roof, rx: -0.18 });
  const knob = sph(0.06, std('#ffd23f', { metalness: 0.3, roughness: 0.4 }), 10, 8); knob.position.set(doorX + 0.36, 1.05, dz + 0.14); g.add(knob);
  const porch = [];
  for (const s2 of [-1, 1]) {
    frameItems.push({ x: doorX + s2 * 0.92, y: 2.0, z: dz + 0.12, sx: 0.2, sy: 0.3, sz: 0.14, c: '#2b2b2b' });
    const pl = new THREE.Mesh(UNIT, new THREE.MeshBasicMaterial({ color: '#ffd27a' })); pl.position.set(doorX + s2 * 0.92, 1.98, dz + 0.2); pl.scale.set(0.13, 0.2, 0.05); g.add(pl); porch.push(pl);
  }
  g.add(boxes(frameItems, trimMat, { cast: false }));
  if (awning) {
    const aw = [];
    const n = 8, wd = 3.6;
    for (let i = 0; i < n; i++) aw.push({ x: doorX - wd / 2 + (i + 0.5) * (wd / n), y: 3.45, z: dz + 0.62, sx: wd / n, sy: 0.08, sz: 1.2, c: i % 2 ? awning[1] : awning[0], rx: 0.35 });
    g.add(boxes(aw, trimMat, { cast: true }));
  }
  if (sign) {
    const sp = labelPlane([sign.text], sign.w ?? 4.2, sign.h ?? 0.95, { bg: sign.bg ?? '#fff4e0', fg: sign.fg ?? '#7a1f2b', border: sign.fg ?? '#7a1f2b', glow: 0.3 });
    sp.position.set(doorX, sign.y ?? 2.95, dz + 0.12); g.add(sp);
    if (sign.y == null) { frameItems.length; }
  }
  // ── roof (+ optional bitten variant)
  const rcfg = { w, d, H, roof, nL, ov, s, chimney, chimneyX, chimneyBitten, mat: roofMat };
  const roofG = roofGroup({ ...rcfg, bites }); g.add(roofG);
  let roofB = null;
  if (roofBites2) { roofB = roofGroup({ ...rcfg, bites: [...bites, ...roofBites2] }); roofB.visible = false; g.add(roofB); }
  // ── crumbs on the lawn
  if (crumbs > 0) {
    const ci = [];
    const bx = bites.length ? bites[0].x : 0;
    for (let i = 0; i < crumbs; i++) {
      const r = 0.12 + 0.28 * hash(i * 3.1 + seed) ** 2;
      const x = clamp(bx + (hash(i * 1.7 + seed) - 0.5) * 5, -w / 2 - 1, w / 2 + 1), z = d / 2 + 0.4 + hash(i * 2.3 + seed) * 2.4;
      const cc = [CAKE.sponge, wall, CAKE.cream, roof, CAKE.sponge][i % 5];
      ci.push({ x, y: r / 2, z, sx: r, sy: r * 0.8, sz: r, c: cc, ry: hash(i * 5.5) * 3 });
    }
    g.add(boxes(ci, bodyMat, { cast: false }));
  }
  const rh = roofG.userData.rh;
  g.userData = {
    roof: roofG, roofB, H, rh, top: H + rh, body, glassMat, roofMat, porch, w, d,
    /** recolour the outer wall columns: columns left of u (0..1 along x from `from`) get `color` */
    paint(u, color = null, from = -1) {
      const it = body.userData.items;
      for (let n = 0; n < it.length; n++) {
        const c = it[n];
        const f = from < 0 ? (c.i + 0.5) / gx : 1 - (c.i + 0.5) / gx;
        const col = color && c.edge && f <= u ? color : c.base;
        body.setColorAt(n, _c.set(col));
      }
      body.instanceColor.needsUpdate = true;
    },
    setLit(k = 0, lit = '#ffd27a', day = false) { glassMat.color.set(day ? '#9cc8ec' : '#26324f').lerp(_c.set(lit), k); porch.forEach((p) => p.material.color.set('#3a3020').lerp(_c.set('#ffd27a'), day ? 0.4 : k)); },
    setRoof(hex = null, glow = 0) {
      for (const R of [roofG, roofB]) {
        if (!R) continue;
        const im = R.userData.im, its = R.userData.items;
        for (let n = 0; n < its.length; n++) im.setColorAt(n, _c.set(hex && its[n].c !== '#b5543f' && its[n].c !== '#5d4a42' && its[n].c !== CAKE.sponge ? (n % 3 === 0 ? shadeHex(hex, 0.86) : hex) : its[n].c));
        im.instanceColor.needsUpdate = true;
      }
      roofMat.emissive.set(hex || '#000000').multiplyScalar(glow);
    },
  };
  g.userData.setLit(0, '#ffd27a', true);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ bite wall (close-ups)
export function makeBiteWall({ wall = '#ffb3d1', W = 4, Hh = 3, T = 0.5 } = {}) {
  const g = new THREE.Group(); g.name = 'biteWall';
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const items = [];
  const cw = 0.1, n = Math.round(W / cw);
  const R = 1.45, cx0 = 1.25, cy0 = Hh + 0.35;       // bite circle
  const tooth = 0.3, gapX = cx0 - 0.02, gapW = 0.62;
  let gapTop = 0;
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + (i + 0.5) * cw;
    let top = Hh;
    const dx = x - cx0;
    if (Math.abs(dx) < R) {
      let cut = cy0 - Math.sqrt(R * R - dx * dx);
      cut = Math.floor(cut / 0.1) * 0.1;
      // tooth notches: each tooth bites 0.14 deeper, square
      const ph = ((x - cx0 + 10 * tooth) % tooth) / tooth;
      const ag = Math.abs(x - gapX);
      if (ag < gapW / 2) { cut += 0.06; gapTop = Math.max(gapTop, cut); }                 // missing tooth: a wide FLAT un-notched section
      else if (ag < gapW / 2 + 0.2) cut -= 0.42;                                          // flanked by two deep tooth notches
      else if (ph > 0.14 && ph < 0.86) cut -= 0.24;
      top = Math.min(Hh, cut);
    }
    const cutCol = top < Hh - 0.01;
    if (cutCol) {   // pink wall | jam | sponge | cream along the bite contour
      const b0 = top - 0.5;
      items.push({ x, y: b0 / 2, z: 0, sx: cw * 1.001, sy: b0, sz: T, c: wall });
      items.push({ x, y: b0 + 0.04, z: 0, sx: cw * 1.001, sy: 0.08, sz: T, c: CAKE.jam });
      items.push({ x, y: b0 + 0.23, z: 0, sx: cw * 1.001, sy: 0.3, sz: T, c: CAKE.sponge });
      items.push({ x, y: top - 0.06, z: 0, sx: cw * 1.001, sy: 0.12, sz: T, c: CAKE.cream });
    } else items.push({ x, y: top / 2, z: 0, sx: cw * 1.001, sy: top, sz: T, c: wall });
  }
  g.add(boxes(items, mat));
  // trim band + base
  g.add(box(W + 0.06, 0.36, T + 0.06, '#8c7b6b', 0, 0.18, 0));
  const win = box(0.9, 1.0, 0.06, std('#9cc8ec', { roughness: 0.25 }), -0.9, 1.45, T / 2 + 0.01); g.add(win);
  g.add(box(1.1, 1.2, 0.05, '#ffffff', -0.9, 1.45, T / 2));
  g.userData = { gap: V(gapX, gapTop + 0.05, T / 2), circle: { x: cx0, y: cy0, r: R } };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ half garage (cut face = cake)
function cakeLayersTex() {
  return canvasTexture(512, 512, (g, w, h) => {
    const bands = [['#fff4e6', 0.1], ['#f3cf86', 0.22], ['#e8456f', 0.06], ['#fff4e6', 0.05], ['#f3cf86', 0.22], ['#e8456f', 0.06], ['#fff4e6', 0.05], ['#f3cf86', 0.24]];
    let y = 0;
    for (const [c, f] of bands) { g.fillStyle = c; g.fillRect(0, y, w, f * h + 1); y += f * h; }
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(160,110,40,${0.15 + 0.2 * hash(i)})`; g.beginPath(); g.arc(hash(i * 1.3) * w, hash(i * 2.9) * h, 2 + 5 * hash(i * 4.1), 0, PI * 2); g.fill(); }
  });
}
export function makeGarage({ wall = '#c9a7f0', roof = '#6a4a9a', door = '#ffffff' } = {}) {
  const g = new THREE.Group(); g.name = 'halfGarage';
  const W = 4.4, D = 6, H = 3.0, half = W / 2;
  g.add(box(half, H, D, wall, -half / 2, H / 2, 0));
  // flat roof slab with lip
  g.add(box(half + 0.25, 0.25, D + 0.4, roof, -half / 2 - 0.12, H + 0.12, 0));
  // half of the roll-up door (stripes) on the front (+Z)
  for (let i = 0; i < 6; i++) g.add(box(half - 0.3, 0.3, 0.06, i % 2 ? shadeHex(door, 0.9) : door, -half / 2 + 0.15, 0.25 + i * 0.36, D / 2 + 0.03));
  g.add(box(0.2, H, 0.12, '#ffffff', -half + 0.1, H / 2, D / 2 + 0.02));
  // the cut face: cake layers (faces +X)
  const cut = new THREE.Mesh(new THREE.PlaneGeometry(D, H + 0.25), new THREE.MeshStandardMaterial({ map: cakeLayersTex(), roughness: 0.85 }));
  cut.position.set(0.005, (H + 0.25) / 2, 0); cut.rotation.y = PI / 2; g.add(cut);
  // crumbs on the floor where the other half was
  const ci = [];
  for (let i = 0; i < 26; i++) { const r = 0.1 + 0.22 * hash(i * 1.9) ** 2; ci.push({ x: 0.3 + hash(i * 3.3) * 2.2, y: r / 2, z: (hash(i * 5.1) - 0.5) * D, sx: r, sy: r * 0.8, sz: r, c: [CAKE.sponge, wall, CAKE.cream][i % 3], ry: i }); }
  g.add(boxes(ci, new THREE.MeshStandardMaterial({ roughness: 0.85 }), { cast: false }));
  // oil stain + concrete floor of the missing half
  g.add(box(half, 0.04, D, '#b9b3a8', half / 2, 0.02, 0));
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ giant fork
export function makeFork({ tineL = 9, tineW = 0.8, gap = 2.2, handleL = 26 } = {}) {
  const g = new THREE.Group(); g.name = 'giantFork';
  const m = new THREE.MeshStandardMaterial({ color: '#d9dee8', metalness: 0.55, roughness: 0.22, emissive: '#5a6070', emissiveIntensity: 0.35, fog: false });
  const dark = new THREE.MeshStandardMaterial({ color: '#9aa2b2', metalness: 0.6, roughness: 0.3, emissive: '#30343e', emissiveIntensity: 0.3, fog: false });
  const xs = [-1.5, -0.5, 0.5, 1.5].map((k) => k * gap);
  const tines = [];
  xs.forEach((x) => {
    const t = new THREE.Group(); t.position.x = x; g.add(t); tines.push(t);
    const b = new THREE.Mesh(UNIT, m); b.scale.set(tineW, tineL - 1, tineW * 0.7); b.position.y = (tineL - 1) / 2 + 1; b.castShadow = true; t.add(b);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(tineW * 0.62, 1.2, 4), m); tip.rotation.set(PI, PI / 4, 0); tip.position.y = 0.6; tip.scale.z = 0.7; t.add(tip);
  });
  const bridgeW = xs[3] - xs[0] + tineW;
  const neck = new THREE.Mesh(UNIT, m); neck.scale.set(bridgeW, 1.6, tineW * 0.8); neck.position.y = tineL + 0.7; neck.castShadow = true; g.add(neck);
  const taper = new THREE.Mesh(new THREE.CylinderGeometry(0.75, bridgeW / 2, 4, 4, 1), m); taper.rotation.y = PI / 4; taper.scale.z = 0.45; taper.position.y = tineL + 3.5; g.add(taper);
  // curved neck: a chain of short segments bending back, then the handle continues at the bent angle
  let par = new THREE.Group(); par.position.y = tineL + 5.5; g.add(par);
  for (let k = 0; k < 4; k++) {
    const seg = new THREE.Mesh(UNIT, m); seg.scale.set(1.5 - 0.05 * k, 1.7, 0.62); seg.position.y = 0.85; seg.castShadow = true; par.add(seg);
    const nx = new THREE.Group(); nx.position.y = 1.6; nx.rotation.x = -0.11; par.add(nx); par = nx;
  }
  const handle = new THREE.Mesh(UNIT, m); handle.scale.set(1.5, handleL - 6, 0.6); handle.position.y = (handleL - 6) / 2; handle.castShadow = true; par.add(handle);
  const stripe = new THREE.Mesh(UNIT, dark); stripe.scale.set(0.5, (handleL - 6) * 0.8, 0.62); stripe.position.y = (handleL - 6) / 2; par.add(stripe);
  const end = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.6, 16), m); end.rotation.x = PI / 2; end.scale.set(1, 1, 1); end.position.y = handleL - 6; par.add(end);
  const glint = glowSprite('#ffffff', 5, 0.8); glint.position.set(xs[2], 2.5, 0.6); g.add(glint);
  g.userData = { tines, m, glint, height: tineL + 5.5 + handleL };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ giant kid
function hatTex() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#3ec8ff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffe14a';
    for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * 40, h); g.lineTo(i * 40 + 20, h); g.lineTo(i * 40 + 120, 0); g.lineTo(i * 40 + 100, 0); g.fill(); }
    g.fillStyle = '#ff4fa3'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(hash(i * 1.7) * w, hash(i * 3.3) * h, 9, 0, PI * 2); g.fill(); }
  });
}
export function makeGiantKid() {
  const g = new THREE.Group(); g.name = 'giantKid';
  const E = (c, ei = 0.32, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, emissive: c, emissiveIntensity: ei, fog: false, ...o });
  const skin = E('#f7c49b', 0.3), hairM = E('#6b3a1c', 0.22), dark = E('#1d1414', 0.05), white = E('#ffffff', 0.45), mouthM = E('#5a0f1a', 0.15);
  const cheekM = E('#ff8aa0', 0.4), tongueM = E('#ff5a7a', 0.4), shirt = E('#3f86e0', 0.3), sweatM = E('#8fd8ff', 0.6, { transparent: true, opacity: 0.95 });
  const B = (w, h, d, m, x, y, z, r = 0) => { const o = box(w, h, d, m, x, y, z, r); o.castShadow = false; o.receiveShadow = false; return o; };
  const head = new THREE.Group(); g.add(head);
  head.add(B(1.05, 1.0, 0.95, skin, 0, 0, 0, 0.07));
  // ears
  for (const s of [-1, 1]) head.add(B(0.1, 0.24, 0.18, skin, s * 0.56, 0.0, 0.0, 0.03));
  // hair: cap + messy blocks + fringe
  head.add(B(1.12, 0.2, 1.02, hairM, 0, 0.5, -0.02, 0.04));
  head.add(B(1.12, 0.55, 0.22, hairM, 0, 0.18, -0.42, 0.04));
  for (const s of [-1, 1]) head.add(B(0.14, 0.42, 0.7, hairM, s * 0.55, 0.26, -0.12, 0.03));
  [[-0.32, 0.66, 0.1, 0.26, 0.22, -0.2], [0.05, 0.7, -0.05, 0.3, 0.26, 0.15], [0.36, 0.64, 0.18, 0.24, 0.2, 0.3], [-0.1, 0.62, 0.32, 0.22, 0.16, -0.1], [0.25, 0.6, -0.3, 0.3, 0.2, 0.05]].forEach(([x, y, z, sw, sh, rz]) => { const b = B(sw, sh, sw, hairM, x, y, z, 0.03); b.rotation.z = rz; head.add(b); });
  [[-0.3, 0.37, 0.18], [-0.06, 0.4, 0.14], [0.2, 0.36, 0.2], [0.4, 0.4, 0.12]].forEach(([x, y, hh]) => head.add(B(0.22, hh, 0.12, hairM, x, y, 0.47, 0.02)));
  const FZ = 0.48;
  // eyes
  const eyes = { open: new THREE.Group(), shut: new THREE.Group(), happy: new THREE.Group() };
  const pupils = [];
  for (const s of [-1, 1]) {
    const ex = s * 0.23, ey = 0.08;
    eyes.open.add(B(0.21, 0.24, 0.03, white, ex, ey, FZ));
    const p = B(0.11, 0.13, 0.03, dark, ex, ey - 0.02, FZ + 0.015); eyes.open.add(p); pupils.push(p);
    eyes.open.add(B(0.04, 0.04, 0.02, white, ex + 0.03, ey + 0.03, FZ + 0.03));
    // shut: > <
    for (const k of [-1, 1]) { const b = B(0.17, 0.045, 0.03, dark, ex - s * 0.0, ey + k * 0.035, FZ + 0.01); b.rotation.z = k * s * 0.45; eyes.shut.add(b); }
    // happy: ^ ^
    for (const k of [-1, 1]) { const b = B(0.13, 0.045, 0.03, dark, ex + k * 0.05, ey + 0.0, FZ + 0.01); b.rotation.z = -k * 0.6; eyes.happy.add(b); }
  }
  Object.values(eyes).forEach((e) => head.add(e));
  const brows = [];
  for (const s of [-1, 1]) { const b = B(0.24, 0.05, 0.03, hairM, s * 0.23, 0.28, FZ + 0.01); head.add(b); brows.push(b); }
  head.add(B(0.13, 0.11, 0.08, E('#f0a880', 0.3), 0, -0.07, FZ + 0.02, 0.02));
  const cheeks = [];
  for (const s of [-1, 1]) { const c = B(0.18, 0.1, 0.02, cheekM, s * 0.33, -0.12, FZ + 0.005); head.add(c); cheeks.push(c); }
  // mouth: dark box (scaled), top teeth with a gap, tongue
  const mouth = new THREE.Group(); mouth.position.set(0, -0.29, FZ + 0.006); head.add(mouth);
  const hole = B(1, 1, 0.02, mouthM, 0, 0, 0); mouth.add(hole);
  const teeth = new THREE.Group(); mouth.add(teeth);
  for (let k = 0; k < 6; k++) { const x = -0.2 + k * 0.08; if (k === 2) { teeth.add(B(0.07, 0.09, 0.02, dark, x, 0, 0.014)); continue; } teeth.add(B(0.072, 0.09, 0.02, white, x, 0, 0.012)); }
  const smile = new THREE.Group(); mouth.add(smile);
  const sm = B(0.34, 0.05, 0.02, dark, 0, 0, 0.01); smile.add(sm);
  for (const s of [-1, 1]) { const c = B(0.1, 0.05, 0.02, dark, s * 0.2, 0.03, 0.01); c.rotation.z = s * 0.6; smile.add(c); }
  const tongue = B(0.2, 0.28, 0.06, tongueM, 0, -0.08, 0.04, 0.03); mouth.add(tongue);
  // sweat drop
  const sweat = new THREE.Group(); sweat.position.set(0.5, 0.3, 0.35); head.add(sweat);
  sweat.add(sph(0.07, sweatM, 10, 8)); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 8), sweatM); cone.position.y = 0.07; sweat.add(cone);
  // party hat
  const hat = new THREE.Group(); hat.position.set(0.12, 0.6, 0); hat.rotation.z = -0.22; head.add(hat);
  const hm = new THREE.MeshStandardMaterial({ map: hatTex(), roughness: 0.6, emissive: '#ffffff', emissiveMap: hatTex(), emissiveIntensity: 0.25, fog: false });
  const hc = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.72, 20), hm); hc.position.y = 0.36; hat.add(hc);
  const pom = sph(0.09, E('#ffe14a', 0.5), 12, 10); pom.position.y = 0.74; hat.add(pom);
  // neck + shoulders
  g.add(B(0.46, 0.3, 0.4, skin, 0, -0.62, -0.05));
  g.add(B(1.9, 0.9, 0.8, shirt, 0, -1.2, -0.1, 0.12));
  g.add(B(0.5, 0.12, 0.06, E('#ffffff', 0.4), 0, -0.78, 0.31));
  g.userData = {
    head, mouth, hole, teeth, tongue, hat, sweat, cheeks, brows, eyes,
    set(t = 0, { eyes: ey = 'open', mouth: mo = 'smile', open = null, tongue: tg = 0, cheeks: ck = 0, sweat: sw = false, hat: ht = false, brows: br = 0, look = [0, 0] } = {}) {
      eyes.open.visible = ey === 'open' || ey === 'side'; eyes.shut.visible = ey === 'shut'; eyes.happy.visible = ey === 'happy';
      pupils.forEach((p, i) => p.position.set((i ? 1 : -1) * 0.23 + 0.05 * look[0] + (ey === 'side' ? 0.05 : 0), 0.06 + 0.05 * look[1], FZ + 0.015));
      brows.forEach((b, i) => { const s = i ? 1 : -1; b.position.y = 0.28 + (br === 'up' ? 0.06 : 0); b.rotation.z = br === 'worried' ? -s * 0.35 : br === 'angry' ? s * 0.35 : 0; });
      const op = open != null ? open : mo === 'open' ? 1 : mo === 'grin' ? 0.55 : mo === 'o' ? 0.6 : 0;
      const wdt = mo === 'grin' ? 0.56 : mo === 'o' ? 0.24 : mo === 'open' ? 0.46 : 0.34;
      hole.visible = op > 0.02; hole.scale.set(wdt, 0.04 + 0.3 * op, 1); hole.position.y = -0.15 * op + 0.02;
      teeth.visible = op > 0.2 && mo !== 'o'; teeth.position.y = 0.02 + 0.15 * op * 0 + (0.04 + 0.3 * op) / 2 - 0.15 * op + 0.02 - 0.05;
      smile.visible = op <= 0.02 && mo !== 'flat'; if (mo === 'flat') { hole.visible = true; hole.scale.set(0.3, 0.04, 1); }
      tongue.visible = tg > 0.02; tongue.position.set(0, -0.15 * op - 0.05 - 0.12 * tg, 0.04 + 0.1 * tg); tongue.scale.set(1, 0.4 + 0.8 * tg, 1);
      tongue.rotation.x = 0.4 * tg + 0.08 * Math.sin(t * 9) * tg;
      cheeks.forEach((c) => { c.scale.set(1 + 0.5 * ck, 1 + 0.8 * ck, 1); c.material.color.set('#ff8aa0').lerp(_c.set('#ff1a1a'), ck); c.material.emissive.copy(c.material.color); c.material.emissiveIntensity = 0.4 + 0.5 * ck; });
      sweat.visible = !!sw; sweat.position.y = 0.3 - 0.05 * ((t * 0.8) % 1);
      hat.visible = !!ht;
    },
  };
  g.userData.set(0, {});
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ match + wick
export function makeMatch() {
  const g = new THREE.Group(); g.name = 'giantMatch';
  const wood = new THREE.MeshStandardMaterial({ color: '#e8c48a', roughness: 0.8, emissive: '#3a2410', emissiveIntensity: 0.3, fog: false });
  const red = new THREE.MeshStandardMaterial({ color: '#d4202a', roughness: 0.6, emissive: '#5a0808', emissiveIntensity: 0.4, fog: false });
  const stick = new THREE.Mesh(UNIT, wood); stick.scale.set(0.06, 1, 0.06); stick.position.y = 0.5; g.add(stick);
  const head = box(0.1, 0.13, 0.1, red, 0, 1.03, 0, 0.04); g.add(head);
  const flame = new THREE.Group(); flame.position.y = 1.08; g.add(flame);
  // teardrop: round bottom (half sphere) + tall cone, outer orange, inner yellow-white core
  const om = new THREE.MeshBasicMaterial({ color: '#ff8a10', transparent: true, opacity: 0.95, fog: false, toneMapped: false });
  const im2 = new THREE.MeshBasicMaterial({ color: '#ffe86a', fog: false, toneMapped: false });
  const cm = new THREE.MeshBasicMaterial({ color: '#fffbe0', fog: false, toneMapped: false });
  const fb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 8, 0, PI * 2, PI / 2, PI / 2), om); fb.position.y = 0.1; flame.add(fb);
  const fo = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.42, 14), om); fo.position.y = 0.1 + 0.21; flame.add(fo);
  const fib = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 6, 0, PI * 2, PI / 2, PI / 2), im2); fib.position.set(0, 0.09, 0.01); flame.add(fib);
  const fi = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.27, 12), im2); fi.position.set(0, 0.09 + 0.135, 0.01); flame.add(fi);
  const fc = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.12, 8), cm); fc.position.set(0, 0.11, 0.02); flame.add(fc);
  const glow = glowSprite('#ff9a3a', 0.75, 0.6); glow.position.y = 0.22; flame.add(glow);
  const sparks = [];
  for (let i = 0; i < 14; i++) { const s = sph(0.012, new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffe08a' : '#ff7a1a', fog: false, toneMapped: false }), 6, 4); flame.add(s); sparks.push(s); }
  g.userData = {
    flame, head, glow, sparks,
    set(t = 0, { lit = 1, flare = 0 } = {}) {
      flame.visible = lit > 0.01;
      const fl = 1 + 0.12 * Math.sin(t * 23) + 0.08 * Math.sin(t * 37 + 1);
      flame.scale.set(lit * (1 + 0.4 * flare), lit * fl * (1 + 0.6 * flare), lit * (1 + 0.4 * flare));
      glow.material.opacity = 0.6 * lit; glow.scale.setScalar(0.75 + 1.2 * flare);
      head.material.emissive.set('#5a0808').lerp(_c.set('#c01008'), lit);
      sparks.forEach((s, i) => {
        const u = (hash(i * 1.3) + t * (1.2 + hash(i * 2.2))) % 1;
        s.visible = flare > 0.05 || lit > 0.5;
        const a = hash(i * 3.7) * PI * 2, r = 0.08 + 0.45 * u * (0.4 + flare);
        s.position.set(Math.cos(a) * r, 0.05 + 0.6 * u, Math.sin(a) * r); s.scale.setScalar(1 - u);
      });
    },
  };
  g.userData.set(0, { lit: 0 });
  return g;
}
export function makeWick() {
  const g = new THREE.Group(); g.name = 'wick';
  const m = new THREE.MeshStandardMaterial({ color: '#2a2628', roughness: 0.9, emissive: '#1a1418', emissiveIntensity: 0.3 });
  const a = cyl(0.13, 0.15, 2.4, m, 10); a.position.y = 1.2; g.add(a);
  const b = cyl(0.11, 0.13, 1.0, m, 10); b.position.set(0.18, 2.75, 0); b.rotation.z = -0.4; g.add(b);
  const tip = sph(0.12, m, 10, 8); tip.position.set(0.37, 3.2, 0); g.add(tip);
  const ember = glowSprite('#ff7a2a', 1.2, 0); ember.position.set(0.37, 3.2, 0); g.add(ember);
  g.userData = { m, set(t, ember01 = 0) { ember.material.opacity = ember01 * (0.8 + 0.2 * Math.sin(t * 17)); } };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ plate + cake
function bandTex() {
  return canvasTexture(1024, 256, (g, w, h) => {
    const layers = [['#ffb3d1', 0.18], ['#fff4e6', 0.06], ['#f3cf86', 0.24], ['#e8456f', 0.07], ['#f3cf86', 0.24], ['#fff4e6', 0.06], ['#f3cf86', 0.15]];
    let y = 0; for (const [c, f] of layers) { g.fillStyle = c; g.fillRect(0, y, w, f * h + 1); y += f * h; }
    g.fillStyle = '#ffb3d1';
    for (let i = 0; i < 40; i++) { const x = (i + 0.5) * w / 40, dl = 18 + 40 * hash(i * 2.3); g.fillRect(x - 9, 0, 18, 0.18 * h + dl); g.beginPath(); g.arc(x, 0.18 * h + dl, 9, 0, PI * 2); g.fill(); }
  }, (t) => { t.wrapS = THREE.RepeatWrapping; t.repeat.set(10, 1); });
}
function frostTex() {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#ffc6dc'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { const v = 0.04 + 0.08 * hash(i); g.fillStyle = `rgba(255,255,255,${v})`; g.beginPath(); g.arc(hash(i * 1.7) * w, hash(i * 2.9) * h, 3 + 10 * hash(i * 4.4), 0, PI * 2); g.fill(); }
  }, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); });
}
export const SPRINKLE_COLS = ['#ff4f6a', '#ffd23f', '#3ee0c8', '#8a5cff', '#4fb3ff', '#5bd65b', '#ff8a2a', '#ffffff'];
export function makeSprinkles(n = 400, w = 10, d = 6, size = 0.12, { seed = 1, avoid = null } = {}) {
  const geo = new THREE.CapsuleGeometry(size * 0.28, size, 2, 6); geo.rotateZ(PI / 2);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.45, emissive: '#ffffff', emissiveIntensity: 0.08 });
  const im = new THREE.InstancedMesh(geo, mat, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let k = 0;
  for (let i = 0; k < n && i < n * 3; i++) {
    const x = (hash(i * 1.37 + seed) - 0.5) * w, z = (hash(i * 2.71 + seed) - 0.5) * d;
    if (avoid && avoid(x, z)) continue;
    e.set(0, hash(i * 4.4 + seed) * PI * 2, 0); q.setFromEuler(e);
    m4.compose(V(x, size * 0.28, z), q, V(1, 1, 1)); im.setMatrixAt(k, m4);
    im.setColorAt(k, _c.set(SPRINKLE_COLS[Math.floor(hash(i * 5.9 + seed) * SPRINKLE_COLS.length)])); k++;
  }
  im.count = k; im.castShadow = false; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere();
  return im;
}
export function makeCrumbs(n = 30, w = 4, d = 2, cols = [CAKE.sponge, CAKE.cream, '#ffb3d1'], { seed = 3, size = 0.3 } = {}) {
  const items = [];
  for (let i = 0; i < n; i++) { const r = size * (0.35 + 0.65 * hash(i * 1.9 + seed) ** 2); items.push({ x: (hash(i * 3.3 + seed) - 0.5) * w, y: r * 0.4, z: (hash(i * 5.1 + seed) - 0.5) * d, sx: r, sy: r * 0.8, sz: r, c: cols[i % cols.length], ry: hash(i) * 3 }); }
  return boxes(items, new THREE.MeshStandardMaterial({ roughness: 0.85 }), { cast: false });
}
export function makePlateCake({ R = 98, plateR = 128, depth = 7, cx = 4, cz = 0 } = {}) {
  const g = new THREE.Group(); g.name = 'plateCake';
  const top = new THREE.Mesh(new THREE.CircleGeometry(R, 96).rotateX(-PI / 2), new THREE.MeshLambertMaterial({ map: frostTex(), color: '#ffffff' }));
  top.position.set(cx, -0.03, cz); top.receiveShadow = true; g.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R, R, depth, 96, 1, true), new THREE.MeshLambertMaterial({ map: bandTex(), side: THREE.DoubleSide }));
  band.position.set(cx, -depth / 2 - 0.03, cz); g.add(band);
  const silver = new THREE.MeshStandardMaterial({ color: '#dfe4ee', metalness: 0.45, roughness: 0.22, emissive: '#6a7080', emissiveIntensity: 0.35, fog: false });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(plateR - 8, plateR * 0.86, 1.2, 96), silver); plate.position.set(cx, -depth - 0.6, cz); g.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(plateR, 4.2, 12, 120).rotateX(PI / 2), silver); rim.position.set(cx, 0.4, cz); g.add(rim);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(plateR, plateR - 8, depth + 0.6, 96, 1, true), new THREE.MeshStandardMaterial({ color: '#cfd5e0', metalness: 0.45, roughness: 0.25, emissive: '#5a6070', emissiveIntensity: 0.3, fog: false, side: THREE.DoubleSide }));
  lip.position.set(cx, -depth / 2 + 0.1, cz); g.add(lip);
  // giant sprinkles all over the frosting (avoid the streets a bit)
  const spr = makeSprinkles(1400, 2 * R, 2 * R, 1.6, { seed: 7, avoid: (x, z) => x * x + z * z > R * R * 0.96 });
  spr.position.set(cx, 0.05, cz); g.add(spr);
  const glints = [];
  for (let i = 0; i < 6; i++) { const a = -PI * 0.9 + i * 0.35; const s = glowSprite('#ffffff', 14, 0.0); s.position.set(cx + Math.cos(a) * plateR, 4.2, cz + Math.sin(a) * plateR); g.add(s); glints.push(s); }
  g.userData = {
    parts: { top, band, plate, rim, lip, sprinkles: spr }, glints, silver, depth,
    rimOnly(on) { top.visible = band.visible = spr.visible = !on; plate.visible = lip.visible = !on; },
    glint(t, k = 1) { glints.forEach((s, i) => { s.material.opacity = k * Math.max(0, Math.sin(t * 2.2 + i * 1.7)) ** 6; }); },
  };
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════ small props
function sauceLabel() {
  return canvasTexture(1024, 512, (g, w, h) => {
    g.fillStyle = '#fff4e0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#7a0a10'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16);
    // flame icon
    const fx = w * 0.5, fy = h * 0.56;
    g.fillStyle = '#ff3a1a'; g.beginPath(); g.moveTo(fx, fy - 150); g.bezierCurveTo(fx + 110, fy - 40, fx + 90, fy + 80, fx, fy + 90); g.bezierCurveTo(fx - 90, fy + 80, fx - 110, fy - 40, fx, fy - 150); g.fill();
    g.fillStyle = '#ffc21a'; g.beginPath(); g.moveTo(fx, fy - 60); g.bezierCurveTo(fx + 55, fy + 10, fx + 45, fy + 70, fx, fy + 75); g.bezierCurveTo(fx - 45, fy + 70, fx - 55, fy + 10, fx, fy - 60); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    fit(g, "GRANDMA'S", FONT_D, w * 0.3, 70); g.fillStyle = '#7a0a10'; g.fillText("GRANDMA'S", w * 0.18, h * 0.42); g.fillText('SAUCE', w * 0.82, h * 0.42);
    fit(g, 'EXTRA SPICY', FONT_D, w * 0.86, 120); g.fillStyle = '#e8232b'; g.fillText('EXTRA SPICY', w / 2, h * 0.16);
    fit(g, 'XXXXX HOT', FONT_D, w * 0.3, 60); g.fillStyle = '#7a0a10'; g.fillText('XXXXX', w * 0.18, h * 0.66); g.fillText('HOT!!', w * 0.82, h * 0.66);
  });
}
export function makeHotSauce() {
  const g = new THREE.Group(); g.name = 'hotSauce';
  const glass = new THREE.MeshStandardMaterial({ color: '#d4141e', roughness: 0.25, emissive: '#6a0008', emissiveIntensity: 0.45 });
  const body = cyl(0.42, 0.42, 1.4, glass, 24); body.position.y = 0.7; g.add(body);
  const shoulder = cyl(0.16, 0.42, 0.35, glass, 24); shoulder.position.y = 1.575; g.add(shoulder);
  const neck = cyl(0.14, 0.16, 0.25, glass, 16); neck.position.y = 1.87; g.add(neck);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.3, 16), std('#2f9a3a', { roughness: 0.5 })); cap.position.y = 2.13; g.add(cap);
  const ring = cyl(0.18, 0.18, 0.08, std('#2f9a3a'), 16); ring.position.y = 1.98; g.add(ring);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.425, 0.425, 0.8, 32, 1, true, -PI / 2, PI), new THREE.MeshStandardMaterial({ map: sauceLabel(), roughness: 0.7, emissive: '#ffffff', emissiveMap: sauceLabel(), emissiveIntensity: 0.18 }));
  lab.position.y = 0.72; lab.rotation.y = 0; g.add(lab);
  const hl = box(0.06, 1.0, 0.02, std('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 }), -0.24, 0.85, 0.36); hl.rotation.y = -0.6; g.add(hl);
  return g;
}
export function makeRoller(len = 2.2, color = '#5bd65b') {
  const g = new THREE.Group(); g.name = 'roller';
  const pole = cyl(0.025, 0.025, len, std('#b07a4a'), 8); pole.position.y = -len / 2; g.add(pole);
  const grip = cyl(0.035, 0.035, 0.25, std('#e8232b'), 8); grip.position.y = -0.05; g.add(grip);
  const frame = box(0.04, 0.3, 0.04, std('#9aa3ad', { metalness: 0.4 }), 0, -len - 0.12, 0); g.add(frame);
  const arm = box(0.34, 0.035, 0.035, std('#9aa3ad', { metalness: 0.4 }), 0.15, -len - 0.27, 0); g.add(arm);
  const rollM = std(color, { roughness: 0.95 });
  const roll = cyl(0.085, 0.085, 0.42, new THREE.MeshStandardMaterial({ color, roughness: 0.95 }), 14); roll.rotation.z = PI / 2; roll.position.set(0.3, -len - 0.32, 0); g.add(roll);
  g.userData = { roll, tip: V(0.3, -len - 0.32, 0), setColor(c) { roll.material.color.set(c); } };
  return g;
}
export function makePancakes(n = 12) {
  const g = new THREE.Group(); g.name = 'pancakes';
  const plate = cyl(0.3, 0.26, 0.04, std('#ffffff'), 24); plate.position.y = 0.02; g.add(plate);
  for (let i = 0; i < n; i++) { const p = cyl(0.21, 0.21, 0.055, std(i % 2 ? '#e0a050' : '#d4913e'), 18); p.position.set(0.008 * Math.sin(i * 2.1), 0.07 + i * 0.058, 0.008 * Math.cos(i * 1.7)); g.add(p); }
  const top = 0.07 + n * 0.058;
  const syrup = cyl(0.19, 0.19, 0.03, std('#8a4a12', { roughness: 0.2 }), 18); syrup.position.y = top - 0.01; g.add(syrup);
  for (let i = 0; i < 5; i++) { const d = box(0.04, 0.12 + 0.15 * hash(i), 0.03, std('#8a4a12', { roughness: 0.2 }), Math.cos(i * 1.3) * 0.2, top - 0.08 - 0.06 * hash(i), Math.sin(i * 1.3) * 0.2); g.add(d); }
  const butter = box(0.09, 0.06, 0.09, std('#ffe58a'), 0, top + 0.03, 0, 0.01); g.add(butter);
  g.userData = { top };
  return g;
}
function checkTex() {
  return canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#8a6a3a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(60,40,20,0.55)'; for (let i = 0; i < 8; i++) { g.fillRect(i * 16, 0, 6, h); g.fillRect(0, i * 16, w, 6); }
  }, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); });
}
export function makeDetectiveCap() {
  const g = new THREE.Group(); g.name = 'deerstalker';
  const m = new THREE.MeshStandardMaterial({ map: checkTex(), roughness: 0.85 });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.37, 18, 10, 0, PI * 2, 0, PI / 2), m); crown.scale.set(1, 0.62, 0.95); g.add(crown);
  const band = cyl(0.365, 0.37, 0.06, m, 20); band.position.y = 0.01; g.add(band);
  for (const s of [1, -1]) { const b = box(0.36, 0.035, 0.2, m, 0, 0.0, s * 0.4); b.rotation.x = s * 0.25; g.add(b); }
  const btn = sph(0.035, m, 8, 6); btn.position.y = 0.23; g.add(btn);
  for (const s of [-1, 1]) { const f = box(0.04, 0.16, 0.2, m, s * 0.33, 0.06, 0); f.rotation.z = s * 0.35; g.add(f); }
  const bow = box(0.1, 0.04, 0.04, std('#5a3a1a'), 0, 0.27, 0); g.add(bow);
  return g;
}
export function makeMagnifier() {
  const g = new THREE.Group(); g.name = 'magnifier';
  const handle = cyl(0.03, 0.035, 0.24, std('#5a3a1a'), 10); handle.position.y = -0.04; g.add(handle);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 28), std('#d8c060', { metalness: 0.5, roughness: 0.3 })); ring.position.y = 0.2; g.add(ring);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.115, 28), new THREE.MeshStandardMaterial({ color: '#cfefff', roughness: 0.05, transparent: true, opacity: 0.45, emissive: '#bfe8ff', emissiveIntensity: 0.3, side: THREE.DoubleSide }));
  lens.position.y = 0.2; g.add(lens);
  const glint = glowSprite('#ffffff', 0.12, 0.8); glint.position.set(0.05, 0.25, 0.02); g.add(glint);
  return g;
}
function polaroidTex(kind) {
  return canvasTexture(256, 300, (g, w, h) => {
    g.fillStyle = '#fbfbf6'; g.fillRect(0, 0, w, h);
    const sky = g.createLinearGradient(0, 0, 0, 220); sky.addColorStop(0, '#8cc8f6'); sky.addColorStop(1, '#dff1fc'); g.fillStyle = sky; g.fillRect(16, 16, w - 32, 210);
    g.fillStyle = '#5bb04a'; g.fillRect(16, 190, w - 32, 36);
    const wallC = { house: '#c9a7f0', bakery: '#ffb3cf', post: '#9fd4ff', garage: '#ffe08a' }[kind] || '#c9a7f0';
    g.fillStyle = wallC; g.fillRect(56, 110, 144, 84);
    g.fillStyle = '#7a3a5a'; g.beginPath(); g.moveTo(44, 112); g.lineTo(128, 62); g.lineTo(212, 112); g.fill();
    // the bite (sky-coloured scallops)
    g.fillStyle = '#bfe2fa'; g.beginPath(); g.arc(196, 76, 46, 0, PI * 2); g.fill();
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(196 + Math.cos(2.4 + i * 0.32) * 46, 76 + Math.sin(2.4 + i * 0.32) * 46, 9, 0, PI * 2); g.fill(); }
    g.fillStyle = '#1d1d22'; g.font = FONT_T(30); g.textAlign = 'center'; fit(g, kind.toUpperCase(), FONT_T, w - 40, 32); g.fillText(kind.toUpperCase(), w / 2, 262);
  });
}
function noteTex(text, bg = '#ffe14a') {
  return canvasTexture(256, 200, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = '#1d1d22'; g.textAlign = 'center'; g.textBaseline = 'middle'; const lines = text.split('\n'); lines.forEach((l, i) => { fit(g, l, FONT_D, w - 30, 64); g.fillText(l, w / 2, h * (i + 0.5) / lines.length + 4); }); });
}
export function makeCorkboard26() {
  const g = new THREE.Group(); g.name = 'corkboard26';
  const W = 1.5, H = 1.1;
  const cork = canvasTexture(512, 380, (c, w, h) => { c.fillStyle = '#b5844f'; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${90 + 60 * hash(i)},${60 + 30 * hash(i * 2)},30,0.35)`; c.fillRect(hash(i * 1.3) * w, hash(i * 2.7) * h, 3, 3); } });
  g.add(box(W + 0.1, H + 0.1, 0.04, '#6b4a2f', 0, 0, -0.02));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: cork, roughness: 0.95 })); board.position.z = 0.002; g.add(board);
  const spots = [['house', -0.5, 0.25, -0.08], ['bakery', 0.0, 0.3, 0.06], ['post', 0.5, 0.22, -0.05], ['garage', -0.45, -0.25, 0.07]];
  const pins = [];
  const photos = spots.map(([k, x, y, r]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.375), new THREE.MeshStandardMaterial({ map: polaroidTex(k), roughness: 0.6 }));
    p.position.set(x, y, 0.01); p.rotation.z = r; g.add(p);
    const pin = sph(0.025, std('#e8232b'), 8, 6); pin.position.set(x, y + 0.15, 0.03); g.add(pin); pins.push(pin.position.clone());
    return p;
  });
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.28), new THREE.MeshStandardMaterial({ map: noteTex('WHO\nBIT US?'), roughness: 0.7 }));
  note.position.set(0.15, -0.28, 0.012); note.rotation.z = -0.05; g.add(note);
  const note2 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), new THREE.MeshStandardMaterial({ map: noteTex('SWEET?', '#9fe8ff'), roughness: 0.7 }));
  note2.position.set(0.52, -0.26, 0.012); note2.rotation.z = 0.08; g.add(note2);
  pins.push(V(0.15, -0.16, 0.03), V(0.52, -0.16, 0.03));
  // red strings between pins
  const sm = new THREE.MeshBasicMaterial({ color: '#e8232b' });
  [[0, 4], [1, 4], [2, 5], [3, 4], [0, 1], [4, 5]].forEach(([a, b]) => {
    const A = pins[a], Bp = pins[b], len = A.distanceTo(Bp);
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, len), sm); s.position.copy(A).lerp(Bp, 0.5); s.lookAt(Bp.clone().add(g.position)); s.lookAt(Bp); g.add(s);
  });
  g.userData = { photo: photos[2], photoHome: photos[2].position.clone(), photoRot: photos[2].rotation.z };
  return g;
}
export function makeLawnChair() {
  const g = new THREE.Group(); g.name = 'lawnChair';
  const metal = std('#e0e4ea', { metalness: 0.4, roughness: 0.35 });
  for (const s of [-1, 1]) { g.add(box(0.04, 0.42, 0.04, metal, s * 0.3, 0.21, 0.25)); g.add(box(0.04, 0.42, 0.04, metal, s * 0.3, 0.21, -0.25)); g.add(box(0.04, 0.04, 0.6, metal, s * 0.3, 0.42, 0)); const bk = box(0.04, 0.9, 0.04, metal, s * 0.3, 0.8, -0.32); bk.rotation.x = -0.3; g.add(bk); const ar = box(0.06, 0.04, 0.5, std('#ffffff'), s * 0.32, 0.62, 0.0); g.add(ar); }
  const fab = ['#3ee0c8', '#ffffff', '#3ee0c8', '#ffffff', '#3ee0c8'];
  fab.forEach((c, i) => g.add(box(0.58, 0.03, 0.12, c, 0, 0.41, -0.24 + i * 0.12)));
  fab.forEach((c, i) => { const b = box(0.58, 0.16, 0.03, c, 0, 0.55 + i * 0.16 * 0.95, -0.34 - i * 0.05); b.rotation.x = -0.3; g.add(b); });
  return g;
}
export function makeTeeth(gap = false) {
  const g = new THREE.Group(); g.name = 'teeth';
  const m = std('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.3 });
  g.add(box(0.36, 0.11, 0.02, std('#6a1020'), 0, -0.01, -0.01));
  for (let i = 0; i < 6; i++) { if (gap && i === 2) continue; g.add(box(0.05, 0.075, 0.025, m, -0.14 + i * 0.056, 0.01, 0.005, 0.008)); }
  const glint = glowSprite('#ffffff', 0.12, 0.9); glint.position.set(0.08, 0.03, 0.03); g.add(glint);
  g.userData = { glint };
  return g;
}
export function makeTongue() {
  const g = new THREE.Group();
  const t = box(0.1, 0.03, 0.14, std('#ff5a7a', { emissive: '#ff5a7a', emissiveIntensity: 0.2 }), 0, 0, 0.07, 0.015); g.add(t);
  return g;
}
export function makeRedRing() {
  const tex = canvasTexture(256, 256, (g, w, h) => { g.strokeStyle = '#ff1a2a'; g.lineWidth = 22; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 16, 0, PI * 2); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 5; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 16, 0, PI * 2); g.stroke(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
  m.renderOrder = 20; return m;
}
export function makeShadowShape() {
  const tex = canvasTexture(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(2,2,8,0.97)';
    for (let i = 0; i < 4; i++) { g.fillRect(30 + i * 62, 0, 40, 150); g.beginPath(); g.moveTo(30 + i * 62, 150); g.lineTo(70 + i * 62, 150); g.lineTo(50 + i * 62, 0); g.fill(); }
    g.fillRect(30, 140, 226, 44); g.beginPath(); g.moveTo(30, 184); g.lineTo(256, 184); g.lineTo(190, 236); g.lineTo(96, 236); g.fill();
    g.fillRect(118, 220, 70, 36); g.fillRect(150, 226, 362, 30);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  return m;
}
export function makeSteam(n = 10) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.7, emissive: '#ffd0c0', emissiveIntensity: 0.4, fog: false });
  const list = [];
  for (let i = 0; i < n; i++) { const s = sph(1, m, 10, 8); g.add(s); list.push(s); }
  g.userData = {
    set(t, k = 1) {
      g.visible = k > 0.01; m.opacity = 0.7 * k;
      list.forEach((s, i) => { const u = (hash(i * 1.7) + t * 0.9) % 1; s.position.set((hash(i * 2.3) - 0.5) * 0.6 + 0.3 * u * Math.sin(i), u * 2.2, (hash(i * 3.1) - 0.5) * 0.3); s.scale.setScalar((0.12 + 0.3 * u) * (1 - u * 0.5)); });
    },
  };
  return g;
}

/** cake crumb burst (cubes flying out + falling): { root, update(u 0..1) } */
export function makeCrumbBurst({ n = 40, radius = 3, cols = [CAKE.sponge, CAKE.cream, '#ff9cc8', '#ff6fae', CAKE.jam], seed = 5, size = 0.35 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ fog: false });
  const im = new THREE.InstancedMesh(UNIT, mat, n); im.frustumCulled = false;
  const root = new THREE.Group(); root.add(im);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), sc = V();
  const parts = Array.from({ length: n }, (_, i) => { const a = hash(i * 1.9 + seed) * PI * 2, el = (hash(i * 3.7 + seed) - 0.25) * 1.3; return { d: V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)), v: 0.6 + 0.6 * hash(i * 5.3 + seed), s: size * (0.5 + hash(i * 7.1 + seed)), r: hash(i * 2.2) * 6 }; });
  parts.forEach((pt, i) => im.setColorAt(i, _c.set(cols[i % cols.length])));
  im.instanceColor.needsUpdate = true;
  return {
    root, update(u) {
      root.visible = u > 0 && u < 1;
      if (!root.visible) return;
      const k = 1 - Math.pow(1 - u, 2.2);
      parts.forEach((pt, i) => {
        p.copy(pt.d).multiplyScalar(radius * pt.v * k); p.y -= radius * 1.4 * u * u;
        e.set(pt.r + u * 6, pt.r * 2 + u * 4, 0); q.setFromEuler(e); sc.setScalar(Math.max(0.001, pt.s * (1 - 0.5 * u)));
        m4.compose(p, q, sc); im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true;
    },
  };
}
/** moonlit night sky card (for behind the bedroom window): pale blue gradient + big moon */
export function makeMoonSky(w = 3.2, h = 2.4) {
  const tex = canvasTexture(512, 384, (g, W, Hh) => {
    const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#3a4f9a'); gr.addColorStop(1, '#8ea6e6'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    const rg = g.createRadialGradient(W * 0.62, Hh * 0.38, 10, W * 0.62, Hh * 0.38, 170); rg.addColorStop(0, 'rgba(255,250,225,1)'); rg.addColorStop(0.3, 'rgba(255,248,220,0.95)'); rg.addColorStop(0.34, 'rgba(220,230,255,0.5)'); rg.addColorStop(1, 'rgba(200,215,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, Hh);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, fog: false, toneMapped: false }));
}

/** fork silhouette from solid black boxes (tines down), ~4 × 3.6 m, origin at the centre */
export function makeForkShadow() {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#04040a', fog: false });
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(UNIT, m); b.scale.set(0.26, 1.7, 0.02); b.position.set(-0.6 + i * 0.4, -0.85, 0); g.add(b); }
  const br = new THREE.Mesh(UNIT, m); br.scale.set(1.5, 0.35, 0.02); br.position.set(0, 0.1, 0); g.add(br);
  const nk = new THREE.Mesh(UNIT, m); nk.scale.set(0.5, 1.0, 0.02); nk.position.set(0.1, 0.7, 0); nk.rotation.z = -0.25; g.add(nk);
  const hd = new THREE.Mesh(UNIT, m); hd.scale.set(0.4, 3.0, 0.02); hd.position.set(0.75, 2.5, 0); hd.rotation.z = -0.35; g.add(hd);
  return g;
}
