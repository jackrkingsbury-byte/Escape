// Tech City map layout (world units). The hub zones sit in the middle; player
// bases ring the outside. Camera looks from the south (oblique 2.5D).

export const WORLD_W = 3600;
export const WORLD_H = 2800;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ZoneId = 'market' | 'drops' | 'raid' | 'trade' | 'event' | 'leaderboard' | 'quests' | 'collection';

export interface Zone {
  id: ZoneId;
  label: string;
  icon: string;
  trigger: Rect;
  anchor: { x: number; y: number }; // where to stand / fast-travel to
}

export const ZONES: Zone[] = [
  { id: 'market', label: 'CENTRAL MARKET', icon: '📈', trigger: { x: 1560, y: 960, w: 480, h: 150 }, anchor: { x: 1800, y: 1050 } },
  { id: 'drops', label: 'DROP ZONE', icon: '📦', trigger: { x: 2330, y: 1200, w: 700, h: 420 }, anchor: { x: 2650, y: 1560 } },
  { id: 'raid', label: 'RAID BOARD', icon: '🥷', trigger: { x: 680, y: 1230, w: 500, h: 190 }, anchor: { x: 930, y: 1330 } },
  { id: 'trade', label: 'TRADE HUB', icon: '🤝', trigger: { x: 680, y: 1650, w: 500, h: 190 }, anchor: { x: 930, y: 1740 } },
  { id: 'event', label: 'EVENT STAGE', icon: '🎪', trigger: { x: 1530, y: 2040, w: 540, h: 160 }, anchor: { x: 1800, y: 2130 } },
  { id: 'leaderboard', label: 'HALL OF FAME', icon: '🏆', trigger: { x: 1440, y: 1160, w: 170, h: 150 }, anchor: { x: 1525, y: 1260 } },
  { id: 'quests', label: 'MISSIONS', icon: '🎯', trigger: { x: 1990, y: 1160, w: 170, h: 150 }, anchor: { x: 2075, y: 1260 } },
  { id: 'collection', label: 'COLLECTION MUSEUM', icon: '🎒', trigger: { x: 1990, y: 1560, w: 190, h: 150 }, anchor: { x: 2085, y: 1660 } },
];

export const PLAZA = { x: 1800, y: 1400, r: 230 };

// Solid things the avatar can't walk through.
export const COLLIDERS: Rect[] = [
  { x: 1440, y: 700, w: 720, h: 250 }, // market building
  { x: 2400, y: 1250, w: 580, h: 90 }, // drop machines
  { x: 700, y: 1170, w: 460, h: 50 }, // raid billboard
  { x: 720, y: 1560, w: 420, h: 70 }, // trade booth
  { x: 1500, y: 1880, w: 600, h: 150 }, // stage
  { x: 1500, y: 1175, w: 50, h: 40 }, // obelisk
  { x: 2050, y: 1180, w: 60, h: 30 }, // kiosk
  { x: 2045, y: 1580, w: 80, h: 40 }, // museum
];

export const PLOT_W = 520;
export const PLOT_H = 400;

export interface PlotDef {
  index: number;
  x: number;
  y: number;
  door: 'top' | 'bottom' | 'left' | 'right';
}

const xs = [160, 740, 1320, 1900, 2480, 3060];
const raw: Omit<PlotDef, 'index'>[] = [
  // My base is always plot 0: south row, next to the plaza.
  { x: 1320, y: 2300, door: 'top' },
  { x: 1900, y: 2300, door: 'top' },
  { x: 740, y: 2300, door: 'top' },
  { x: 2480, y: 2300, door: 'top' },
  { x: 160, y: 2300, door: 'top' },
  { x: 3060, y: 2300, door: 'top' },
  ...xs.map((x) => ({ x, y: 120, door: 'bottom' as const })),
  { x: 80, y: 640, door: 'right' },
  { x: 3040, y: 640, door: 'left' },
  { x: 80, y: 1150, door: 'right' },
  { x: 3040, y: 1150, door: 'left' },
  { x: 80, y: 1660, door: 'right' },
  { x: 3040, y: 1660, door: 'left' },
];
export const PLOTS: PlotDef[] = raw.map((p, index) => ({ ...p, index }));

export function plotRect(p: PlotDef): Rect {
  return { x: p.x, y: p.y, w: PLOT_W, h: PLOT_H };
}

/** Where to stand just outside a plot's entrance. */
export function plotDoor(p: PlotDef): { x: number; y: number } {
  switch (p.door) {
    case 'top': return { x: p.x + PLOT_W / 2, y: p.y - 40 };
    case 'bottom': return { x: p.x + PLOT_W / 2, y: p.y + PLOT_H + 40 };
    case 'left': return { x: p.x - 40, y: p.y + PLOT_H / 2 };
    case 'right': return { x: p.x + PLOT_W + 40, y: p.y + PLOT_H / 2 };
  }
}

export function plotInside(p: PlotDef): { x: number; y: number } {
  const d = plotDoor(p);
  const cx = p.x + PLOT_W / 2;
  const cy = p.y + PLOT_H / 2;
  return { x: (d.x + cx * 2) / 3, y: (d.y + cy * 2) / 3 };
}

/** Grid used for display slots inside a plot. */
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

/** Centre point (pad position) and cell size for slot `i` of a plot with `slots` slots. */
export function slotPos(p: PlotDef, slots: number, i: number): { x: number; y: number; cell: number } {
  const { cols, rows } = slotGrid(slots);
  const padL = 46;
  const padR = 46;
  // The owner sign sits on the side opposite the entrance.
  const signBottom = p.door === 'top';
  const padT = signBottom ? 58 : 92;
  const padB = signBottom ? 84 : 44;
  const iw = PLOT_W - padL - padR;
  const ih = PLOT_H - padT - padB;
  const cw = iw / cols;
  const ch = ih / rows;
  const c = i % cols;
  const r = Math.floor(i / cols);
  return { x: p.x + padL + cw * (c + 0.5), y: p.y + padT + ch * (r + 0.5) + ch * 0.18, cell: Math.min(cw, ch * 1.25, 96) };
}

export function inRect(x: number, y: number, r: Rect, pad = 0) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}

export const SPAWN = plotInside(PLOTS[0]);

/** Where the owner's sign hangs (opposite the entrance). */
export function signPos(p: PlotDef): { x: number; y: number } {
  return { x: p.x + PLOT_W / 2, y: p.door === 'top' ? p.y + PLOT_H - 40 : p.y + 36 };
}
