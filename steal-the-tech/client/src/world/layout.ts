// Tech City in 3D (units are metres). The Tech Belt runs west → east through
// the middle of the city; ten bases line both sides of it, doors facing the
// belt. The hub (drops, market, raid board, trades, events…) sits at the ends.

export const BELT = { x0: -60, x1: 60, z: 0, width: 3.4, height: 0.32 };
export const WORLD = { minX: -114, maxX: 114, minZ: -44, maxZ: 44 };

export const PLOT_W = 20; // across (x)
export const PLOT_D = 24; // deep (z), measured from the door
export const DOOR_Z = 6; // |z| of every base's door line

export interface PlotDef {
  index: number;
  cx: number;
  side: 1 | -1; // +1 = south row (z > 0), -1 = north row
}

// Plot 0 is always my base: south row, centre, right where you spawn.
const XS = [0, 22, -22, 44, -44];
export const PLOTS: PlotDef[] = [
  ...XS.map((cx) => ({ cx, side: 1 as const })),
  ...XS.map((cx) => ({ cx, side: -1 as const })),
].map((p, index) => ({ ...p, index }));

export interface V2 {
  x: number;
  z: number;
}

/** Local plot coords → world. lx: −10…10 across, ld: 0 (door) … 24 (back wall). */
export function plotToWorld(p: PlotDef, lx: number, ld: number): V2 {
  return { x: p.cx + lx * p.side, z: p.side * (DOOR_Z + ld) };
}

export function worldToPlot(p: PlotDef, x: number, z: number): { lx: number; ld: number } {
  return { lx: (x - p.cx) * p.side, ld: z * p.side - DOOR_Z };
}

export function inPlot(p: PlotDef, x: number, z: number, pad = 0): boolean {
  const { lx, ld } = worldToPlot(p, x, z);
  return Math.abs(lx) <= PLOT_W / 2 + pad && ld >= -pad && ld <= PLOT_D + pad;
}

export function plotCenter(p: PlotDef): V2 {
  return plotToWorld(p, 0, PLOT_D / 2);
}

/** Just inside the door. */
export function plotInside(p: PlotDef): V2 {
  return plotToWorld(p, 0, 3);
}

/** On the walkway in front of the door. */
export function plotDoor(p: PlotDef): V2 {
  return plotToWorld(p, 0, -2.2);
}

export const lockPad = (p: PlotDef) => plotToWorld(p, -6.6, 2.2);
export const collectPad = (p: PlotDef) => plotToWorld(p, 6.6, 2.2);
export const vaultPos = (p: PlotDef) => plotToWorld(p, 8, 22.2);

/** Display-slot grid for a base with `slots` slots. */
export function slotGrid(slots: number): { cols: number; rows: number } {
  if (slots <= 4) return { cols: 2, rows: 2 };
  if (slots <= 8) return { cols: 4, rows: 2 };
  if (slots <= 12) return { cols: 4, rows: 3 };
  if (slots <= 16) return { cols: 4, rows: 4 };
  if (slots <= 24) return { cols: 6, rows: 4 };
  if (slots <= 32) return { cols: 8, rows: 4 };
  if (slots <= 40) return { cols: 8, rows: 5 };
  return { cols: 10, rows: 5 };
}

/** Podium centre (world) + podium size for slot `i`. */
export function slotPos(p: PlotDef, slots: number, i: number): V2 & { size: number; lx: number; ld: number } {
  const { cols, rows } = slotGrid(slots);
  const w = 16;
  const d = 15.5;
  const sx = w / cols;
  const sd = d / rows;
  const c = i % cols;
  const r = Math.floor(i / cols);
  const lx = -w / 2 + sx * (c + 0.5);
  const ld = 5.2 + sd * (r + 0.5);
  const size = Math.min(1.9, Math.min(sx, sd) * 0.62);
  return { ...plotToWorld(p, lx, ld), size, lx, ld };
}

/** The glowing collect plate in front of a podium (between it and the door). */
export function platePos(p: PlotDef, slots: number, i: number): V2 {
  const s = slotPos(p, slots, i);
  const { rows } = slotGrid(slots);
  const sd = 15.5 / rows;
  return plotToWorld(p, s.lx, s.ld - Math.min(1.25, sd * 0.42));
}

// ── Hub zones ────────────────────────────────────────────────────────────
export type ZoneId = 'market' | 'drops' | 'raid' | 'trade' | 'event' | 'leaderboard' | 'quests' | 'collection';

export interface Zone {
  id: ZoneId;
  label: string;
  icon: string;
  /** trigger rectangle (world) */
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  anchor: V2;
}

export const ZONES: Zone[] = [
  { id: 'drops', label: 'DROP ZONE', icon: '📦', x0: -84, x1: -70, z0: -15, z1: 15, anchor: { x: -72, z: 0 } },
  { id: 'market', label: 'CENTRAL MARKET', icon: '📈', x0: -99, x1: -89, z0: -11, z1: 11, anchor: { x: -91, z: 0 } },
  { id: 'leaderboard', label: 'HALL OF FAME', icon: '🏆', x0: -80, x1: -66, z0: -34, z1: -24, anchor: { x: -73, z: -25 } },
  { id: 'quests', label: 'MISSIONS', icon: '🎯', x0: -80, x1: -66, z0: 24, z1: 34, anchor: { x: -73, z: 25 } },
  { id: 'raid', label: 'RAID BOARD', icon: '🥷', x0: 68, x1: 82, z0: -22, z1: -10, anchor: { x: 72, z: -14 } },
  { id: 'trade', label: 'TRADE HUB', icon: '🤝', x0: 68, x1: 82, z0: 10, z1: 22, anchor: { x: 72, z: 14 } },
  { id: 'event', label: 'EVENT STAGE', icon: '🎪', x0: 86, x1: 96, z0: -10, z1: 10, anchor: { x: 88, z: 0 } },
  { id: 'collection', label: 'COLLECTION MUSEUM', icon: '🎒', x0: 68, x1: 82, z0: 26, z1: 38, anchor: { x: 72, z: 30 } },
];

export function inZone(z: Zone, x: number, zz: number) {
  return x >= z.x0 && x <= z.x1 && zz >= z.z0 && zz <= z.z1;
}

// ── Collision ────────────────────────────────────────────────────────────
export interface Box2 {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

const WALL = 0.5;

/** Solid things you can't walk through (buildings, machines, base walls). */
export function staticColliders(): Box2[] {
  const out: Box2[] = [
    { x0: -110, x1: -100, z0: -22, z1: 22 }, // market building
    { x0: -83, x1: -79, z0: -14, z1: 14 }, // drop machines
    { x0: -66, x1: -61, z0: -4.5, z1: -2.2 }, // factory pillars
    { x0: -66, x1: -61, z0: 2.2, z1: 4.5 },
    { x0: 61, x1: 66, z0: -4.5, z1: -2.2 }, // recycler pillars
    { x0: 61, x1: 66, z0: 2.2, z1: 4.5 },
    { x0: 80, x1: 83, z0: -21, z1: -11 }, // raid board
    { x0: 80, x1: 83, z0: 11, z1: 21 }, // trade booth
    { x0: 97, x1: 110, z0: -12, z1: 12 }, // stage
    { x0: -75, x1: -71, z0: -32, z1: -28 }, // obelisk
    { x0: -75, x1: -71, z0: 28, z1: 32 }, // kiosk
    { x0: 80, x1: 88, z0: 28, z1: 38 }, // museum
  ];
  for (const p of PLOTS) {
    // side walls + back wall, open door facing the belt
    const a = plotToWorld(p, -PLOT_W / 2, 0);
    const b = plotToWorld(p, -PLOT_W / 2, PLOT_D);
    out.push(box(a.x, b.x, a.z, b.z, WALL));
    const c = plotToWorld(p, PLOT_W / 2, 0);
    const d = plotToWorld(p, PLOT_W / 2, PLOT_D);
    out.push(box(c.x, d.x, c.z, d.z, WALL));
    const e = plotToWorld(p, -PLOT_W / 2, PLOT_D);
    const f = plotToWorld(p, PLOT_W / 2, PLOT_D);
    out.push(box(e.x, f.x, e.z, f.z, WALL));
  }
  return out;
}

function box(ax: number, bx: number, az: number, bz: number, pad: number): Box2 {
  return { x0: Math.min(ax, bx) - pad / 2, x1: Math.max(ax, bx) + pad / 2, z0: Math.min(az, bz) - pad / 2, z1: Math.max(az, bz) + pad / 2 };
}

/** The laser gate across a base's door (used when the base is locked). */
export function doorGate(p: PlotDef): Box2 {
  const a = plotToWorld(p, -PLOT_W / 2, 0.2);
  const b = plotToWorld(p, PLOT_W / 2, 0.2);
  return box(a.x, b.x, a.z, b.z, 0.6);
}

export function circleHitsBox(x: number, z: number, r: number, b: Box2): boolean {
  const cx = Math.max(b.x0, Math.min(x, b.x1));
  const cz = Math.max(b.z0, Math.min(z, b.z1));
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < r * r;
}

export const SPAWN: V2 = plotToWorld(PLOTS[0], 0, 1.8);

/** Position along the belt for progress t ∈ [0,1]. */
export function beltX(t: number) {
  return BELT.x0 + (BELT.x1 - BELT.x0) * t;
}
