// Environment + character drawing for the 2.5D world.
import type { CatalogItem, Rarity } from '../backend/types';
import { itemCanvas, shade, VEHICLE_KINDS, WALL_KINDS, DESK_KINDS } from '../art/items';
import { RARITY, rainbow } from '../game/rarity';
import { PLOT_W, PLOT_H, signPos, type PlotDef, type Rect } from './layout';

type Ctx = CanvasRenderingContext2D;

export function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
}

export function glow(c: Ctx, x: number, y: number, r: number, color: string, alpha = 0.5) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

export function text(c: Ctx, s: string, x: number, y: number, size: number, color: string, opts: { align?: CanvasTextAlign; weight?: number; stroke?: string; font?: string } = {}) {
  c.font = `${opts.weight ?? 800} ${size}px ${opts.font ?? "'Rajdhani', 'Segoe UI', system-ui, sans-serif"}`;
  c.textAlign = opts.align ?? 'center';
  c.textBaseline = 'middle';
  if (opts.stroke) {
    c.lineWidth = Math.max(2, size / 5);
    c.strokeStyle = opts.stroke;
    c.lineJoin = 'round';
    c.strokeText(s, x, y);
  }
  c.fillStyle = color;
  c.fillText(s, x, y);
}

// ── Ground ──────────────────────────────────────────────────────────────
export function drawGround(c: Ctx, view: Rect, t: number, quality: 'high' | 'low') {
  const T = 80;
  const x0 = Math.floor(view.x / T) * T;
  const y0 = Math.floor(view.y / T) * T;
  for (let y = y0; y < view.y + view.h + T; y += T) {
    for (let x = x0; x < view.x + view.w + T; x += T) {
      const k = ((x / T) * 7 + (y / T) * 13) & 7;
      c.fillStyle = k === 0 ? '#0e1426' : k === 1 ? '#0c1222' : '#0b1020';
      c.fillRect(x, y, T, T);
    }
  }
  c.strokeStyle = 'rgba(56,189,248,0.07)';
  c.lineWidth = 1;
  c.beginPath();
  for (let x = x0; x < view.x + view.w + T; x += T) {
    c.moveTo(x, view.y);
    c.lineTo(x, view.y + view.h);
  }
  for (let y = y0; y < view.y + view.h + T; y += T) {
    c.moveTo(view.x, y);
    c.lineTo(view.x + view.w, y);
  }
  c.stroke();
  if (quality === 'high') {
    // slow pulsing light pools
    const p = (Math.sin(t * 0.6) + 1) / 2;
    glow(c, 1800, 1400, 700, 'rgba(34,211,238,0.10)', 0.6 + p * 0.3);
  }
}

export function drawRoads(c: Ctx, t: number) {
  const road = (x: number, y: number, w: number, h: number) => {
    c.fillStyle = '#151b2e';
    c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(250,204,21,0.35)';
    c.lineWidth = 3;
    c.setLineDash([26, 22]);
    c.lineDashOffset = -t * 20;
    c.beginPath();
    if (w > h) {
      c.moveTo(x, y + h / 2);
      c.lineTo(x + w, y + h / 2);
    } else {
      c.moveTo(x + w / 2, y);
      c.lineTo(x + w / 2, y + h);
    }
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = 'rgba(56,189,248,0.25)';
    c.lineWidth = 2;
    c.strokeRect(x, y, w, h);
  };
  road(60, 560, 3480, 70); // north ring
  road(60, 2170, 3480, 70); // south ring
  road(620, 560, 60, 1680); // west ring
  road(2920, 560, 60, 1680); // east ring
  road(1765, 960, 70, 1080); // north-south spine
  road(680, 1365, 2240, 70); // east-west spine
}

export function drawPlaza(c: Ctx, t: number, hero: CatalogItem | undefined, quality: 'high' | 'low') {
  const { x, y } = { x: 1800, y: 1400 };
  c.save();
  c.fillStyle = '#121a31';
  c.beginPath();
  c.ellipse(x, y, 240, 200, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(34,211,238,0.35)';
  c.lineWidth = 3;
  c.stroke();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + t * 0.1;
    c.fillStyle = i % 2 ? 'rgba(34,211,238,0.5)' : 'rgba(232,121,249,0.5)';
    c.beginPath();
    c.arc(x + Math.cos(a) * 225, y + Math.sin(a) * 186, 3, 0, Math.PI * 2);
    c.fill();
  }
  // fountain basin
  c.fillStyle = '#0a2a3a';
  c.beginPath();
  c.ellipse(x, y + 10, 110, 70, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#38bdf8';
  c.lineWidth = 4;
  c.stroke();
  for (let i = 0; i < 3; i++) {
    const r = ((t * 30 + i * 30) % 90) + 10;
    c.strokeStyle = `rgba(125,211,252,${0.5 - r / 200})`;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x, y + 10, r, r * 0.6, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

export function drawPlazaHologram(c: Ctx, t: number, hero: CatalogItem | undefined, quality: 'high' | 'low') {
  const x = 1800;
  const y = 1400;
  // pedestal + beam
  c.fillStyle = '#1e293b';
  rr(c, x - 26, y - 6, 52, 22, 6);
  c.fill();
  if (quality === 'high') glow(c, x, y - 90, 140, 'rgba(192,132,252,0.35)');
  c.save();
  c.globalAlpha = 0.18;
  c.fillStyle = '#a5f3fc';
  c.beginPath();
  c.moveTo(x - 22, y);
  c.lineTo(x - 60, y - 170);
  c.lineTo(x + 60, y - 170);
  c.lineTo(x + 22, y);
  c.fill();
  c.restore();
  if (hero) {
    const cv = itemCanvas(hero, 128);
    const s = 1 + Math.sin(t * 1.5) * 0.04;
    c.save();
    c.translate(x, y - 105 + Math.sin(t * 2) * 6);
    c.scale(Math.cos(t * 0.8) * s, s);
    c.globalAlpha = 0.9;
    c.drawImage(cv, -64, -64, 128, 128);
    c.restore();
    text(c, 'THE ONE EVERYONE WANTS', x, y - 190, 13, '#e9d5ff', { stroke: '#0b1020' });
    text(c, hero.name, x, y - 172, 16, '#ffffff', { stroke: '#0b1020' });
  }
}

// ── Buildings ───────────────────────────────────────────────────────────
function building(c: Ctx, x: number, y: number, w: number, h: number, depth: number, wall: string, roof: string) {
  // roof (top face)
  c.fillStyle = roof;
  c.fillRect(x, y - h - depth, w, depth);
  // front wall
  const g = c.createLinearGradient(0, y - h, 0, y);
  g.addColorStop(0, shade(wall, 0.1));
  g.addColorStop(1, shade(wall, -0.3));
  c.fillStyle = g;
  c.fillRect(x, y - h, w, h);
}

export function drawMarket(c: Ctx, t: number, ticker: { name: string; change: number; price: string }[], quality: 'high' | 'low') {
  const x = 1440;
  const y = 950;
  const w = 720;
  building(c, x, y, w, 210, 70, '#1e2a4a', '#27355c');
  // glass panels
  for (let i = 0; i < 9; i++) {
    const px = x + 20 + i * 78;
    const g = c.createLinearGradient(px, y - 190, px + 60, y - 70);
    g.addColorStop(0, 'rgba(125,211,252,0.35)');
    g.addColorStop(1, 'rgba(30,64,175,0.25)');
    c.fillStyle = g;
    c.fillRect(px, y - 190, 62, 110);
  }
  // ticker screen
  c.fillStyle = '#020617';
  c.fillRect(x + 20, y - 62, w - 40, 30);
  c.save();
  c.beginPath();
  c.rect(x + 20, y - 62, w - 40, 30);
  c.clip();
  let off = x + w - ((t * 90) % 2400);
  for (let k = 0; k < 2; k++) {
    for (const it of ticker) {
      const s = `${it.name}  ${it.price}  `;
      text(c, s, off, y - 47, 15, '#e2e8f0', { align: 'left', weight: 700 });
      off += c.measureText(s).width;
      const ch = `${it.change >= 0 ? '▲' : '▼'} ${Math.abs(it.change).toFixed(1)}%     `;
      text(c, ch, off, y - 47, 15, it.change >= 0 ? '#4ade80' : '#f87171', { align: 'left', weight: 800 });
      off += c.measureText(ch).width;
    }
  }
  c.restore();
  // door
  c.fillStyle = '#0b1020';
  c.fillRect(x + w / 2 - 60, y - 28, 120, 28);
  c.fillStyle = 'rgba(34,211,238,0.5)';
  c.fillRect(x + w / 2 - 60, y - 30, 120, 3);
  // sign
  if (quality === 'high') glow(c, x + w / 2, y - 250, 260, 'rgba(34,211,238,0.35)');
  text(c, 'CENTRAL MARKET', x + w / 2, y - 240, 44, '#67e8f9', { stroke: '#0b1020', weight: 900 });
  text(c, 'BUY · SELL · WATCH THE PRICES MOVE', x + w / 2, y - 205, 14, '#bae6fd', { weight: 700 });
}

export interface DropMachineInfo {
  id: string;
  name: string;
  price: string;
  locked: boolean;
  tokens: number;
}

const DROP_COLORS: Record<string, [string, string]> = {
  basic: ['#64748b', '#94a3b8'],
  premium: ['#1d4ed8', '#38bdf8'],
  elite: ['#6d28d9', '#a855f7'],
  ultra: ['#be185d', '#e879f9'],
  event: ['#c2410c', '#fb923c'],
  secret: ['#0b0612', '#c084fc'],
};

export function drawCrate(c: Ctx, x: number, y: number, s: number, dropId: string, t: number) {
  const [a, b] = DROP_COLORS[dropId] || DROP_COLORS.basic;
  c.save();
  c.translate(x, y);
  // top
  c.fillStyle = shade(b, 0.2);
  c.beginPath();
  c.moveTo(-s / 2, -s / 2);
  c.lineTo(-s / 2 + s * 0.2, -s / 2 - s * 0.18);
  c.lineTo(s / 2 + s * 0.2, -s / 2 - s * 0.18);
  c.lineTo(s / 2, -s / 2);
  c.fill();
  c.fillStyle = shade(a, -0.3);
  c.beginPath();
  c.moveTo(s / 2, -s / 2);
  c.lineTo(s / 2 + s * 0.2, -s / 2 - s * 0.18);
  c.lineTo(s / 2 + s * 0.2, s / 2 - s * 0.18);
  c.lineTo(s / 2, s / 2);
  c.fill();
  const g = c.createLinearGradient(0, -s / 2, 0, s / 2);
  g.addColorStop(0, b);
  g.addColorStop(1, a);
  c.fillStyle = g;
  c.fillRect(-s / 2, -s / 2, s, s);
  c.strokeStyle = 'rgba(255,255,255,0.5)';
  c.lineWidth = Math.max(1, s / 18);
  c.strokeRect(-s / 2 + s * 0.08, -s / 2 + s * 0.08, s * 0.84, s * 0.84);
  c.fillStyle = dropId === 'secret' ? '#c084fc' : '#ffffff';
  c.fillRect(-s * 0.08, -s / 2, s * 0.16, s);
  if (dropId === 'ultra') {
    c.globalAlpha = 0.35;
    c.fillStyle = rainbow(t);
    c.fillRect(-s / 2, -s / 2, s, s);
  }
  c.restore();
}

export function drawDropZone(c: Ctx, t: number, machines: DropMachineInfo[], quality: 'high' | 'low') {
  // floor pad
  c.fillStyle = '#131a33';
  rr(c, 2340, 1180, 680, 440, 30);
  c.fill();
  c.strokeStyle = 'rgba(232,121,249,0.35)';
  c.lineWidth = 3;
  c.stroke();
  text(c, 'DROP ZONE', 2680, 1140, 40, '#f0abfc', { stroke: '#0b1020', weight: 900 });
  // conveyor belt
  const bx = 2360;
  const by = 1470;
  const bw = 640;
  c.fillStyle = '#1f2937';
  c.fillRect(bx, by, bw, 46);
  c.fillStyle = '#0f172a';
  c.fillRect(bx, by + 46, bw, 12);
  c.strokeStyle = '#334155';
  c.lineWidth = 2;
  for (let i = 0; i < 28; i++) {
    const px = bx + ((i * 26 + t * 60) % bw);
    c.beginPath();
    c.moveTo(px, by + 2);
    c.lineTo(px, by + 44);
    c.stroke();
  }
  const order = ['basic', 'premium', 'elite', 'ultra', 'event', 'secret'];
  for (let i = 0; i < 6; i++) {
    const px = bx + ((i * 110 + t * 60) % bw);
    drawCrate(c, px, by + 18, 26, order[(i + Math.floor(t / 11)) % 6], t);
  }
}

export function drawDropMachine(c: Ctx, m: DropMachineInfo, x: number, y: number, t: number, quality: 'high' | 'low') {
  const [a, b] = DROP_COLORS[m.id] || DROP_COLORS.basic;
  const w = 80;
  const h = 150;
  if (quality === 'high' && !m.locked) glow(c, x, y - 80, 110, b, m.id === 'secret' ? 0.5 : 0.28);
  // body
  c.fillStyle = shade(a, -0.35);
  c.fillRect(x - w / 2 + 6, y - h - 8, w, h);
  const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, shade(a, -0.1));
  g.addColorStop(0.5, a);
  g.addColorStop(1, shade(a, -0.4));
  c.fillStyle = g;
  rr(c, x - w / 2, y - h, w, h, 10);
  c.fill();
  // glass dome with crate
  c.fillStyle = 'rgba(15,23,42,0.85)';
  rr(c, x - 30, y - h + 12, 60, 64, 10);
  c.fill();
  drawCrate(c, x - 4, y - h + 50 + Math.sin(t * 2 + x) * 4, 30, m.id, t);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  rr(c, x - 28, y - h + 14, 20, 58, 8);
  c.fill();
  // label
  c.fillStyle = '#020617';
  rr(c, x - 36, y - 64, 72, 40, 6);
  c.fill();
  text(c, m.name.replace(' DROP', ''), x, y - 52, 13, m.id === 'ultra' ? rainbow(t) : b, { weight: 900 });
  text(c, m.locked ? '🔒' : m.price, x, y - 34, 12, '#e2e8f0', { weight: 800 });
  if (m.tokens > 0) {
    c.fillStyle = '#22c55e';
    c.beginPath();
    c.arc(x + w / 2 - 6, y - h + 6, 11, 0, Math.PI * 2);
    c.fill();
    text(c, String(m.tokens), x + w / 2 - 6, y - h + 6, 12, '#052e16', { weight: 900 });
  }
  // slot light
  c.fillStyle = m.locked ? '#475569' : b;
  c.fillRect(x - 20, y - 14, 40, 4);
}

export function drawRaidBoard(c: Ctx, t: number, targets: { name: string; value: string; sec: number; bot: boolean }[], quality: 'high' | 'low') {
  const x = 700;
  const y = 1220;
  const w = 460;
  const h = 170;
  c.fillStyle = '#1f2937';
  c.fillRect(x + 40, y - 20, 12, 30);
  c.fillRect(x + w - 52, y - 20, 12, 30);
  if (quality === 'high') glow(c, x + w / 2, y - h / 2 - 20, 280, 'rgba(244,63,94,0.28)');
  c.fillStyle = '#120a14';
  rr(c, x, y - h - 20, w, h, 10);
  c.fill();
  c.strokeStyle = '#f43f5e';
  c.lineWidth = 4;
  c.stroke();
  text(c, '🥷 RAID BOARD', x + w / 2, y - h - 42, 34, '#fda4af', { stroke: '#0b1020', weight: 900 });
  const n = Math.min(4, targets.length);
  for (let i = 0; i < n; i++) {
    const tg = targets[i];
    const cx = x + 20 + i * ((w - 40) / 4);
    const cw = (w - 40) / 4 - 10;
    c.fillStyle = '#f5f5dc';
    rr(c, cx, y - h - 6, cw, h - 26, 4);
    c.fill();
    text(c, 'WANTED', cx + cw / 2, y - h + 8, 12, '#7f1d1d', { weight: 900 });
    c.fillStyle = `hsl(${(i * 70 + 200) % 360},60%,45%)`;
    c.beginPath();
    c.arc(cx + cw / 2, y - h + 42, 18, 0, Math.PI * 2);
    c.fill();
    text(c, tg.bot ? '🤖' : '🙂', cx + cw / 2, y - h + 43, 18, '#fff');
    text(c, tg.name.slice(0, 11), cx + cw / 2, y - h + 76, 11, '#111827', { weight: 800 });
    text(c, tg.value, cx + cw / 2, y - h + 94, 12, '#15803d', { weight: 900 });
    text(c, 'SEC ' + tg.sec, cx + cw / 2, y - h + 112, 10, '#7f1d1d', { weight: 800 });
  }
  // spotlight sweep
  if (quality === 'high') {
    c.save();
    c.globalAlpha = 0.08 + 0.04 * Math.sin(t * 3);
    c.fillStyle = '#fecdd3';
    const sx = x + w / 2 + Math.sin(t * 0.8) * 180;
    c.beginPath();
    c.moveTo(sx, y + 80);
    c.lineTo(sx - 60, y - h - 20);
    c.lineTo(sx + 60, y - h - 20);
    c.fill();
    c.restore();
  }
}

export function drawTradeHub(c: Ctx, t: number, quality: 'high' | 'low') {
  const x = 720;
  const y = 1630;
  const w = 420;
  building(c, x, y, w, 80, 30, '#1c3a2e', '#245240');
  // awning
  for (let i = 0; i < 12; i++) {
    c.fillStyle = i % 2 ? '#22c55e' : '#f8fafc';
    c.beginPath();
    c.moveTo(x + i * (w / 12), y - 80);
    c.lineTo(x + (i + 1) * (w / 12), y - 80);
    c.lineTo(x + (i + 1) * (w / 12) - 4, y - 60);
    c.lineTo(x + i * (w / 12) + 4, y - 60);
    c.fill();
  }
  c.fillStyle = '#0f172a';
  c.fillRect(x + 30, y - 50, 150, 40);
  c.fillRect(x + w - 180, y - 50, 150, 40);
  if (quality === 'high') glow(c, x + w / 2, y - 140, 160, 'rgba(74,222,128,0.35)');
  text(c, '🤝 TRADE HUB', x + w / 2, y - 140, 32, '#86efac', { stroke: '#0b1020', weight: 900 });
  text(c, '⇄', x + w / 2, y - 30 + Math.sin(t * 3) * 2, 30, '#4ade80', { weight: 900 });
}

export function drawStage(c: Ctx, t: number, ev: { title: string; icon: string; left: string } | null, next: string, quality: 'high' | 'low') {
  const x = 1500;
  const y = 2030;
  const w = 600;
  c.fillStyle = '#1e1b3a';
  c.fillRect(x, y - 40, w, 40);
  c.fillStyle = '#2e2a5a';
  c.fillRect(x, y - 60, w, 20);
  // screen
  c.fillStyle = '#020617';
  rr(c, x + 110, y - 250, w - 220, 170, 10);
  c.fill();
  c.strokeStyle = ev ? '#fb923c' : '#475569';
  c.lineWidth = 4;
  c.stroke();
  if (ev) {
    if (quality === 'high') glow(c, x + w / 2, y - 170, 260, 'rgba(251,146,60,0.35)');
    text(c, ev.icon, x + w / 2, y - 205, 46, '#fff');
    text(c, ev.title, x + w / 2, y - 150, 30, '#fed7aa', { weight: 900 });
    text(c, 'LIVE · ' + ev.left + ' left', x + w / 2, y - 115, 15, '#fdba74', { weight: 800 });
  } else {
    text(c, 'NEXT EVENT', x + w / 2, y - 190, 20, '#94a3b8', { weight: 900 });
    text(c, next, x + w / 2, y - 150, 34, '#e2e8f0', { weight: 900 });
  }
  // speakers
  for (const sx of [x + 20, x + w - 90]) {
    c.fillStyle = '#111827';
    c.fillRect(sx, y - 200, 70, 140);
    for (const oy of [-170, -110]) {
      c.fillStyle = '#334155';
      c.beginPath();
      c.arc(sx + 35, y + oy, 20 + (ev ? Math.sin(t * 12) * 2 : 0), 0, Math.PI * 2);
      c.fill();
    }
  }
  if (ev && quality === 'high') {
    for (let i = 0; i < 3; i++) {
      c.save();
      c.globalAlpha = 0.12;
      c.fillStyle = ['#f472b6', '#22d3ee', '#fde047'][i];
      const a = Math.sin(t * (1 + i * 0.3) + i) * 0.5;
      c.translate(x + 100 + i * 200, y - 40);
      c.rotate(a);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-50, -320);
      c.lineTo(50, -320);
      c.fill();
      c.restore();
    }
  }
  text(c, '🎪 EVENT STAGE', x + w / 2, y - 280, 30, '#fdba74', { stroke: '#0b1020', weight: 900 });
}

export function drawObelisk(c: Ctx, t: number, top: string[], quality: 'high' | 'low') {
  const x = 1525;
  const y = 1215;
  if (quality === 'high') glow(c, x, y - 120, 120, 'rgba(251,191,36,0.35)');
  c.fillStyle = '#1f2937';
  c.beginPath();
  c.moveTo(x - 28, y);
  c.lineTo(x - 18, y - 190);
  c.lineTo(x + 18, y - 190);
  c.lineTo(x + 28, y);
  c.fill();
  c.fillStyle = '#fbbf24';
  c.beginPath();
  c.moveTo(x - 18, y - 190);
  c.lineTo(x, y - 225);
  c.lineTo(x + 18, y - 190);
  c.fill();
  top.slice(0, 3).forEach((n, i) => {
    text(c, `${i + 1}. ${n}`, x, y - 160 + i * 34, 11, ['#fde68a', '#e2e8f0', '#fdba74'][i], { weight: 900, stroke: '#0b1020' });
  });
  text(c, '🏆 HALL OF FAME', x, y - 250, 16, '#fde68a', { stroke: '#0b1020' });
}

export function drawKiosk(c: Ctx, t: number, claimable: number, quality: 'high' | 'low') {
  const x = 2080;
  const y = 1210;
  c.fillStyle = '#1e3a8a';
  rr(c, x - 34, y - 90, 68, 90, 8);
  c.fill();
  c.fillStyle = '#020617';
  rr(c, x - 26, y - 80, 52, 36, 4);
  c.fill();
  text(c, '🎯', x, y - 62, 20, '#fff');
  if (claimable > 0) {
    const b = Math.abs(Math.sin(t * 4)) * 8;
    if (quality === 'high') glow(c, x, y - 125 - b, 50, 'rgba(250,204,21,0.6)');
    text(c, '!', x, y - 125 - b, 40, '#facc15', { stroke: '#0b1020', weight: 900 });
  }
  text(c, 'MISSIONS', x, y - 105, 14, '#bfdbfe', { stroke: '#0b1020' });
}

export function drawMuseum(c: Ctx, t: number, pct: number, quality: 'high' | 'low') {
  const x = 2085;
  const y = 1615;
  c.fillStyle = '#3f2f0c';
  c.fillRect(x - 46, y - 70, 92, 70);
  c.fillStyle = '#fbbf24';
  c.beginPath();
  c.moveTo(x - 54, y - 70);
  c.lineTo(x, y - 100);
  c.lineTo(x + 54, y - 70);
  c.fill();
  for (let i = 0; i < 4; i++) {
    c.fillStyle = '#e7e5e4';
    c.fillRect(x - 38 + i * 24, y - 64, 8, 60);
  }
  text(c, 'COLLECTION', x, y - 118, 14, '#fde68a', { stroke: '#0b1020' });
  text(c, pct + '%', x, y - 84, 12, '#422006', { weight: 900 });
}

export function drawLamp(c: Ctx, x: number, y: number, t: number, color: string, quality: 'high' | 'low') {
  c.fillStyle = '#1f2937';
  c.fillRect(x - 3, y - 90, 6, 90);
  c.fillRect(x - 3, y - 92, 22, 5);
  if (quality === 'high') glow(c, x + 16, y - 84, 60, color, 0.45 + Math.sin(t * 2 + x) * 0.05);
  c.fillStyle = color;
  c.beginPath();
  c.arc(x + 16, y - 84, 5, 0, Math.PI * 2);
  c.fill();
}

export function drawTree(c: Ctx, x: number, y: number, t: number, hue: number) {
  c.fillStyle = '#3b2a1a';
  c.fillRect(x - 4, y - 40, 8, 40);
  const sway = Math.sin(t + x) * 2;
  for (let i = 0; i < 3; i++) {
    c.fillStyle = `hsla(${hue},70%,${30 + i * 8}%,0.95)`;
    c.beginPath();
    c.arc(x + sway, y - 50 - i * 14, 26 - i * 6, 0, Math.PI * 2);
    c.fill();
  }
}

// ── Plots / bases ──────────────────────────────────────────────────────
export interface ThemeColors {
  floor: string;
  wall: string;
  wallPattern: string;
  glow: string;
  pattern: string;
  light: string;
  platform: string;
}

function drawBackWall(c: Ctx, p: PlotDef, th: ThemeColors) {
  // A low display wall along the side opposite the entrance (the "wall" cosmetic).
  const h = 22;
  const y = p.door === 'top' ? p.y + PLOT_H - h : p.y;
  c.save();
  rr(c, p.x, p.y, PLOT_W, PLOT_H, 22);
  c.clip();
  c.fillStyle = th.wall;
  c.fillRect(p.x, y, PLOT_W, h);
  if (th.wallPattern === 'brick') {
    c.strokeStyle = 'rgba(0,0,0,0.35)';
    c.lineWidth = 1;
    for (let r = 0; r < 2; r++) {
      c.beginPath();
      c.moveTo(p.x, y + r * 11);
      c.lineTo(p.x + PLOT_W, y + r * 11);
      c.stroke();
      for (let bx = p.x + (r % 2) * 14; bx < p.x + PLOT_W; bx += 28) {
        c.beginPath();
        c.moveTo(bx, y + r * 11);
        c.lineTo(bx, y + r * 11 + 11);
        c.stroke();
      }
    }
  } else if (th.wallPattern === 'glass') {
    c.fillStyle = 'rgba(186,230,253,0.25)';
    c.fillRect(p.x, y, PLOT_W, h);
    c.fillStyle = 'rgba(255,255,255,0.25)';
    for (let bx = p.x; bx < p.x + PLOT_W; bx += 60) c.fillRect(bx + 10, y + 3, 14, h - 6);
  } else {
    c.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let bx = p.x; bx < p.x + PLOT_W; bx += 36) {
      c.beginPath();
      c.moveTo(bx, y);
      c.lineTo(bx, y + h);
      c.stroke();
    }
  }
  c.fillStyle = th.light === 'rainbow' ? '#e879f9' : th.light;
  c.globalAlpha = 0.8;
  c.fillRect(p.x, p.door === 'top' ? y : y + h - 2, PLOT_W, 2);
  c.restore();
}

export function drawPlotFloor(c: Ctx, p: PlotDef, th: ThemeColors, t: number, mine: boolean, occupied: boolean) {
  const { x, y } = p;
  // outer shadow
  c.fillStyle = 'rgba(0,0,0,0.35)';
  rr(c, x + 6, y + 10, PLOT_W, PLOT_H, 22);
  c.fill();
  c.fillStyle = th.floor;
  rr(c, x, y, PLOT_W, PLOT_H, 22);
  c.fill();
  c.save();
  rr(c, x, y, PLOT_W, PLOT_H, 22);
  c.clip();
  const light = th.light === 'rainbow' ? rainbow(t, 80, 60) : th.light;
  c.strokeStyle = shade(th.floor.startsWith('#') ? th.floor : '#131a2e', 0.12);
  c.lineWidth = 1;
  if (th.pattern === 'hex') {
    for (let yy = y; yy < y + PLOT_H + 30; yy += 26) {
      for (let xx = x + ((yy - y) / 26) % 2 * 15; xx < x + PLOT_W + 30; xx += 30) {
        c.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          c.lineTo(xx + Math.cos(a) * 14, yy + Math.sin(a) * 14);
        }
        c.closePath();
        c.stroke();
      }
    }
  } else if (th.pattern === 'checker') {
    c.fillStyle = 'rgba(255,255,255,0.05)';
    for (let yy = y; yy < y + PLOT_H; yy += 40) for (let xx = x + (((yy - y) / 40) % 2) * 40; xx < x + PLOT_W; xx += 80) c.fillRect(xx, yy, 40, 40);
  } else if (th.pattern === 'marble') {
    c.strokeStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 12; i++) {
      c.beginPath();
      c.moveTo(x + i * 50, y);
      c.bezierCurveTo(x + i * 50 + 60, y + 120, x + i * 50 - 40, y + 260, x + i * 50 + 30, y + PLOT_H);
      c.stroke();
    }
  } else {
    for (let xx = x; xx < x + PLOT_W; xx += 40) {
      c.beginPath();
      c.moveTo(xx, y);
      c.lineTo(xx, y + PLOT_H);
      c.stroke();
    }
    for (let yy = y; yy < y + PLOT_H; yy += 40) {
      c.beginPath();
      c.moveTo(x, yy);
      c.lineTo(x + PLOT_W, yy);
      c.stroke();
    }
  }
  c.restore();
  drawBackWall(c, p, th);
  // curb with entrance gap
  c.strokeStyle = light;
  c.lineWidth = mine ? 5 : 3;
  c.globalAlpha = occupied ? 0.9 : 0.35;
  const gap = 110;
  c.beginPath();
  const mx = x + PLOT_W / 2;
  const my = y + PLOT_H / 2;
  // walk the rectangle, skipping the door side's middle
  const pts: [number, number][] = [[x, y], [x + PLOT_W, y], [x + PLOT_W, y + PLOT_H], [x, y + PLOT_H]];
  const sides: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % 4];
    if (sides[i] === p.door) {
      if (ay === by) {
        const dir = bx > ax ? 1 : -1;
        c.moveTo(ax, ay);
        c.lineTo(mx - (gap / 2) * dir, ay);
        c.moveTo(mx + (gap / 2) * dir, ay);
        c.lineTo(bx, by);
      } else {
        const dir = by > ay ? 1 : -1;
        c.moveTo(ax, ay);
        c.lineTo(ax, my - (gap / 2) * dir);
        c.moveTo(ax, my + (gap / 2) * dir);
        c.lineTo(bx, by);
      }
    } else {
      c.moveTo(ax, ay);
      c.lineTo(bx, by);
    }
  }
  c.stroke();
  c.globalAlpha = 1;
}

export function drawPad(c: Ctx, x: number, y: number, cell: number, rarity: Rarity | null, style: string, t: number, empty: boolean, highlight: boolean) {
  const rw = cell * 0.42;
  const rh = cell * 0.16;
  const col = rarity ? RARITY[rarity].color : '#334155';
  const tier = rarity ? RARITY[rarity].tier : 0;
  c.save();
  if (style === 'glass') {
    c.fillStyle = 'rgba(148,163,184,0.25)';
  } else if (style === 'holo') {
    c.fillStyle = 'rgba(34,211,238,0.18)';
  } else if (style === 'screen') {
    c.fillStyle = 'rgba(30,41,59,0.9)';
  } else {
    c.fillStyle = '#1e293b';
  }
  c.beginPath();
  c.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = empty ? 'rgba(148,163,184,0.25)' : tier >= 3 ? col : '#475569';
  c.lineWidth = tier >= 5 ? 3 : 2;
  if (empty) c.setLineDash([5, 5]);
  c.stroke();
  c.setLineDash([]);
  if (style === 'holo' && !empty) {
    c.strokeStyle = 'rgba(34,211,238,0.6)';
    c.beginPath();
    c.ellipse(x, y - 4 - Math.sin(t * 2) * 3, rw * 0.8, rh * 0.8, 0, 0, Math.PI * 2);
    c.stroke();
  }
  if (highlight) {
    c.strokeStyle = '#facc15';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(x, y, rw + 6, rh + 4, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

/** Special display platform for Mythic+ items. */
export function drawSpecialPlatform(c: Ctx, x: number, y: number, cell: number, rarity: Rarity, t: number) {
  const col = RARITY[rarity].color;
  const rw = cell * 0.46;
  c.save();
  c.fillStyle = '#0f172a';
  c.beginPath();
  c.ellipse(x, y + 4, rw, rw * 0.36, 0, 0, Math.PI * 2);
  c.fill();
  const g = c.createLinearGradient(x - rw, 0, x + rw, 0);
  if (rarity === 'ultra') {
    g.addColorStop(0, rainbow(t));
    g.addColorStop(0.5, rainbow(t + 1));
    g.addColorStop(1, rainbow(t + 2));
  } else if (rarity === 'secret') {
    g.addColorStop(0, '#1e1b4b');
    g.addColorStop(0.5, '#c084fc');
    g.addColorStop(1, '#1e1b4b');
  } else {
    g.addColorStop(0, shade(col, -0.3));
    g.addColorStop(0.5, col);
    g.addColorStop(1, shade(col, -0.3));
  }
  c.strokeStyle = g;
  c.lineWidth = 4;
  c.beginPath();
  c.ellipse(x, y, rw, rw * 0.34, 0, 0, Math.PI * 2);
  c.stroke();
  // rising beams
  c.globalAlpha = 0.25;
  c.fillStyle = rarity === 'ultra' ? rainbow(t) : col;
  for (let i = 0; i < 3; i++) {
    const a = t * 1.5 + (i / 3) * Math.PI * 2;
    const bx = x + Math.cos(a) * rw * 0.8;
    c.fillRect(bx - 1.5, y - cell * 0.9, 3, cell * 0.9);
  }
  c.restore();
}

export function drawItemGlow(c: Ctx, x: number, y: number, size: number, rarity: Rarity, t: number) {
  const tier = RARITY[rarity].tier;
  if (tier < 3) return;
  const col = rarity === 'ultra' ? rainbow(t) : rarity === 'secret' ? '#c084fc' : RARITY[rarity].color;
  const pulse = 0.35 + 0.15 * Math.sin(t * 2.5 + x);
  glow(c, x, y, size * (0.7 + tier * 0.06), col, pulse * (tier >= 6 ? 1.2 : 0.8));
}

export function drawFixture(c: Ctx, it: CatalogItem, x: number, y: number, size: number) {
  // Furniture that makes items feel "placed": wall panel for screens, desk for gear.
  if (WALL_KINDS.has(it.kind)) {
    c.fillStyle = '#1e293b';
    c.fillRect(x - size * 0.52, y - size * 0.95, size * 1.04, size * 0.72);
    c.fillStyle = '#0f172a';
    c.fillRect(x - size * 0.06, y - size * 0.25, size * 0.12, size * 0.25);
  } else if (DESK_KINDS.has(it.kind)) {
    c.fillStyle = '#3f3f46';
    c.fillRect(x - size * 0.46, y - size * 0.2, size * 0.92, size * 0.08);
    c.fillStyle = '#27272a';
    c.fillRect(x - size * 0.42, y - size * 0.12, size * 0.05, size * 0.14);
    c.fillRect(x + size * 0.37, y - size * 0.12, size * 0.05, size * 0.14);
  } else if (VEHICLE_KINDS.has(it.kind)) {
    // garage turntable
    c.save();
    c.strokeStyle = 'rgba(250,204,21,0.5)';
    c.lineWidth = 2;
    c.setLineDash([8, 6]);
    c.beginPath();
    c.ellipse(x, y - 2, size * 0.62, size * 0.2, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
}

export function itemDrawSize(it: CatalogItem, cell: number) {
  if (VEHICLE_KINDS.has(it.kind)) return cell * 1.25;
  if (it.kind === 'gaming_setup') return cell * 1.1;
  return cell * 0.92;
}

export function drawPlacedItem(c: Ctx, it: CatalogItem, x: number, y: number, cell: number, t: number, quality: 'high' | 'low', fx: string, hot: boolean) {
  const size = itemDrawSize(it, cell);
  const rarity = it.rarity as Rarity;
  const tier = RARITY[rarity].tier;
  const lift = tier >= 6 ? 6 + Math.sin(t * 2 + x * 0.01) * 4 : 0;
  const cy = y - size * 0.42 - lift;
  if (tier >= 6) drawSpecialPlatform(c, x, y, cell, rarity, t);
  drawFixture(c, it, x, y, size);
  if (quality === 'high') drawItemGlow(c, x, cy, size, rarity, t);
  const px = size > 90 ? 128 : size > 45 ? 96 : 64;
  const cv = itemCanvas(it, px);
  c.drawImage(cv, x - size / 2, cy - size / 2, size, size);
  if (fx === 'orbit' && tier >= 3) {
    c.strokeStyle = RARITY[rarity].color;
    c.globalAlpha = 0.6;
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(x, cy, size * 0.55, size * 0.18, Math.sin(t) * 0.3, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }
  if (hot) text(c, '🔥', x + size * 0.35, cy - size * 0.35, 14, '#fff');
  return { cx: x, cy, size };
}

export function drawSecurity(c: Ctx, p: PlotDef, level: number, t: number, quality: 'high' | 'low') {
  // Gadgets at the entrance reflect the base's security level.
  const gate = (() => {
    switch (p.door) {
      case 'top': return { x1: p.x + PLOT_W / 2 - 55, y1: p.y, x2: p.x + PLOT_W / 2 + 55, y2: p.y };
      case 'bottom': return { x1: p.x + PLOT_W / 2 - 55, y1: p.y + PLOT_H, x2: p.x + PLOT_W / 2 + 55, y2: p.y + PLOT_H };
      case 'left': return { x1: p.x, y1: p.y + PLOT_H / 2 - 55, x2: p.x, y2: p.y + PLOT_H / 2 + 55 };
      case 'right': return { x1: p.x + PLOT_W, y1: p.y + PLOT_H / 2 - 55, x2: p.x + PLOT_W, y2: p.y + PLOT_H / 2 + 55 };
    }
  })();
  // pillars
  for (const [px, py] of [[gate.x1, gate.y1], [gate.x2, gate.y2]]) {
    c.fillStyle = '#334155';
    c.fillRect(px - 7, py - 46, 14, 50);
    const blink = Math.sin(t * 6 + px) > 0;
    c.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    c.beginPath();
    c.arc(px, py - 50, 5, 0, Math.PI * 2);
    c.fill();
    if (level >= 2) {
      // camera
      const a = Math.sin(t + px) * 0.6;
      c.save();
      c.translate(px, py - 36);
      c.rotate(a);
      c.fillStyle = '#e2e8f0';
      c.fillRect(0, -4, 14, 8);
      c.fillStyle = '#0f172a';
      c.fillRect(12, -2, 4, 4);
      c.restore();
    }
  }
  if (level >= 3) {
    c.strokeStyle = '#64748b';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(gate.x1, gate.y1 - 46);
    c.lineTo(gate.x2, gate.y2 - 46);
    c.stroke();
  }
  if (level >= 4) {
    // scanner beam sweeping across the entrance
    const k = (Math.sin(t * 2) + 1) / 2;
    const sx = gate.x1 + (gate.x2 - gate.x1) * k;
    const sy = gate.y1 + (gate.y2 - gate.y1) * k;
    c.strokeStyle = 'rgba(34,211,238,0.8)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(sx, sy - 44);
    c.lineTo(sx, sy);
    c.stroke();
  }
  if (level >= 5) {
    c.strokeStyle = `rgba(239,68,68,${0.4 + 0.3 * Math.sin(t * 10)})`;
    c.lineWidth = 1.5;
    for (let i = 1; i <= 3; i++) {
      c.beginPath();
      c.moveTo(gate.x1, gate.y1 - i * 12);
      c.lineTo(gate.x2, gate.y2 - i * 12);
      c.stroke();
    }
  }
  if (level >= 6 && quality === 'high') {
    c.save();
    c.globalAlpha = 0.1 + 0.04 * Math.sin(t * 2);
    c.strokeStyle = '#a78bfa';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(p.x + PLOT_W / 2, p.y + PLOT_H / 2, PLOT_W * 0.55, PLOT_H * 0.62, 0, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#7c3aed';
    c.fill();
    c.restore();
  }
}

export function drawShield(c: Ctx, p: PlotDef, t: number) {
  c.save();
  const cx = p.x + PLOT_W / 2;
  const cy = p.y + PLOT_H / 2;
  c.globalAlpha = 0.16 + 0.05 * Math.sin(t * 3);
  const g = c.createRadialGradient(cx, cy, 40, cx, cy, PLOT_W * 0.6);
  g.addColorStop(0, 'rgba(59,130,246,0)');
  g.addColorStop(1, 'rgba(59,130,246,0.9)');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(cx, cy, PLOT_W * 0.58, PLOT_H * 0.62, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export function drawSign(c: Ctx, p: PlotDef, name: string, value: string, sub: string, color: string, isBot: boolean, mine: boolean) {
  const { x, y } = signPos(p);
  c.fillStyle = 'rgba(2,6,23,0.85)';
  rr(c, x - 150, y - 26, 300, 56, 12);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.stroke();
  text(c, (mine ? '🏠 ' : isBot ? '🤖 ' : '') + name, x, y - 8, 20, '#f8fafc', { weight: 900 });
  text(c, `${value}  ·  ${sub}`, x, y + 14, 13, color, { weight: 800 });
}

// ── Characters ─────────────────────────────────────────────────────────
export interface AvatarDraw {
  x: number;
  y: number;
  hue: number;
  dir: number; // -1 left, 1 right
  walk: number; // animation phase
  moving: boolean;
  name: string;
  level?: number;
  nameplate?: string;
  bot?: boolean;
  npcHat?: string;
  emote?: string | null;
  carrying?: CatalogItem | null;
  stealing?: number | null; // 0..1 progress
  me?: boolean;
}

export function drawAvatar(c: Ctx, a: AvatarDraw, t: number, showName: boolean) {
  const bob = a.moving ? Math.abs(Math.sin(a.walk * 2)) * 3 : Math.sin(t * 2) * 0.8;
  const { x, y } = a;
  c.save();
  // shadow
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.beginPath();
  c.ellipse(x, y, 16, 6, 0, 0, Math.PI * 2);
  c.fill();
  // legs
  const legA = a.moving ? Math.sin(a.walk * 2) * 6 : 0;
  c.fillStyle = '#1e293b';
  c.fillRect(x - 8 + legA * 0.4, y - 16, 6, 16);
  c.fillRect(x + 2 - legA * 0.4, y - 16, 6, 16);
  // body
  const body = `hsl(${a.hue},70%,50%)`;
  const g = c.createLinearGradient(x - 14, 0, x + 14, 0);
  g.addColorStop(0, `hsl(${a.hue},70%,62%)`);
  g.addColorStop(1, `hsl(${a.hue},70%,38%)`);
  c.fillStyle = g;
  rr(c, x - 14, y - 44 - bob, 28, 32, 11);
  c.fill();
  // arms
  c.fillStyle = body;
  const arm = a.moving ? Math.sin(a.walk * 2 + Math.PI) * 5 : 0;
  rr(c, x - 19, y - 40 - bob + arm, 7, 18, 3);
  c.fill();
  rr(c, x + 12, y - 40 - bob - arm, 7, 18, 3);
  c.fill();
  // head
  c.fillStyle = '#f1f5f9';
  c.beginPath();
  c.arc(x, y - 56 - bob, 13, 0, Math.PI * 2);
  c.fill();
  // visor
  c.fillStyle = a.bot ? '#f43f5e' : '#0f172a';
  rr(c, x - 10 + a.dir * 2, y - 60 - bob, 20, 8, 4);
  c.fill();
  c.fillStyle = a.bot ? '#fecdd3' : `hsl(${a.hue},90%,70%)`;
  c.fillRect(x - 6 + a.dir * 4, y - 58 - bob, 6, 3);
  if (a.bot) {
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y - 69 - bob);
    c.lineTo(x, y - 78 - bob);
    c.stroke();
    c.fillStyle = '#f43f5e';
    c.beginPath();
    c.arc(x, y - 79 - bob, 3, 0, Math.PI * 2);
    c.fill();
  }
  if (a.npcHat) text(c, a.npcHat, x, y - 74 - bob, 18, '#fff');
  // carried loot
  if (a.carrying) {
    const cv = itemCanvas(a.carrying, 64);
    c.drawImage(cv, x - 20, y - 110 - bob, 40, 40);
  }
  c.restore();
  if (a.stealing != null) {
    c.strokeStyle = 'rgba(15,23,42,0.8)';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(x, y - 100, 16, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = '#f43f5e';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(x, y - 100, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * a.stealing);
    c.stroke();
    text(c, '🥷', x, y - 100, 14, '#fff');
  }
  if (showName) {
    const label = a.name + (a.level ? `  ·  Lv${a.level}` : '');
    c.font = "800 13px 'Rajdhani', system-ui, sans-serif";
    const w = c.measureText(label).width + 16;
    const ny = y - 84 - (a.bot ? 10 : 0) - (a.npcHat ? 10 : 0);
    const plate = a.nameplate || 'default';
    c.fillStyle = plate === 'gold' ? 'rgba(120,53,15,0.9)' : plate === 'legend' ? 'rgba(76,29,149,0.9)' : 'rgba(2,6,23,0.75)';
    rr(c, x - w / 2, ny - 10, w, 20, 10);
    c.fill();
    if (plate !== 'default' || a.me) {
      c.strokeStyle = plate === 'gold' ? '#fbbf24' : plate === 'legend' ? rainbow(t) : plate === 'neon' ? '#22d3ee' : '#facc15';
      c.lineWidth = 2;
      c.stroke();
    }
    text(c, label, x, ny, 13, a.me ? '#fde047' : '#f8fafc', { weight: 800 });
  }
  if (a.emote) {
    c.fillStyle = 'rgba(255,255,255,0.95)';
    rr(c, x + 10, y - 120, 40, 34, 12);
    c.fill();
    text(c, a.emote, x + 30, y - 103, 22, '#000');
  }
}
