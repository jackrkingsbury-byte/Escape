// Procedural 2.5D item artwork. Everything is drawn in code from the item's
// kind + fictional brand palette — no copyrighted logos or images.
// Drawing space: centered at (0,0), fits in a 100×100 box.
import type { CatalogItem, Rarity } from '../backend/types';

type Ctx = CanvasRenderingContext2D;

export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r += (255 - r) * amt;
    g += (255 - g) * amt;
    b += (255 - b) * amt;
  } else {
    r *= 1 + amt;
    g *= 1 + amt;
    b *= 1 + amt;
  }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
}

function lin(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}

function fillRR(c: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke?: string, lw = 1.5) {
  rr(c, x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
}

// A box with visible front, right side and top faces (2.5D).
function box(c: Ctx, x: number, y: number, w: number, h: number, d: number, col: string, r = 3) {
  c.fillStyle = shade(col, -0.45);
  c.beginPath();
  c.moveTo(x + w, y);
  c.lineTo(x + w + d, y - d * 0.6);
  c.lineTo(x + w + d, y + h - d * 0.6);
  c.lineTo(x + w, y + h);
  c.closePath();
  c.fill();
  c.fillStyle = shade(col, 0.2);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + d, y - d * 0.6);
  c.lineTo(x + w + d, y - d * 0.6);
  c.lineTo(x + w, y);
  c.closePath();
  c.fill();
  fillRR(c, x, y, w, h, r, lin(c, x, y, x, y + h, [[0, shade(col, 0.08)], [1, shade(col, -0.25)]]));
}

function gloss(c: Ctx, x: number, y: number, w: number, h: number) {
  c.save();
  c.globalAlpha = 0.28;
  c.fillStyle = lin(c, x, y, x + w * 0.6, y + h, [[0, '#ffffff'], [0.45, 'rgba(255,255,255,0.15)'], [0.46, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]);
  c.fillRect(x, y, w, h);
  c.restore();
}

function screenFill(c: Ctx, x: number, y: number, w: number, h: number, it: CatalogItem, r = 2) {
  const secret = it.rarity === 'secret';
  const g = secret
    ? lin(c, x, y, x + w, y + h, [[0, '#050208'], [0.5, '#12061f'], [1, '#000000']])
    : lin(c, x, y, x + w, y + h, [[0, shade(it.color, 0.25)], [0.55, it.accent], [1, shade(it.accent, -0.5)]]);
  fillRR(c, x, y, w, h, r, g);
  if (secret) {
    c.save();
    c.strokeStyle = 'rgba(192,132,252,0.9)';
    c.lineWidth = 1.5;
    c.shadowColor = '#c084fc';
    c.shadowBlur = 10;
    rr(c, x + 1, y + 1, w - 2, h - 2, r);
    c.stroke();
    c.restore();
  } else {
    // soft UI blobs on the screen
    c.save();
    rr(c, x, y, w, h, r);
    c.clip();
    c.globalAlpha = 0.35;
    c.fillStyle = shade(it.color, 0.6);
    c.beginPath();
    c.arc(x + w * 0.3, y + h * 0.65, h * 0.35, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.25;
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(x + w * 0.72, y + h * 0.35, h * 0.22, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  gloss(c, x, y, w, h);
}

function circle(c: Ctx, x: number, y: number, r: number, fill: string | CanvasGradient, stroke?: string, lw = 1.5) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
}

function fan(c: Ctx, x: number, y: number, r: number, glow: string) {
  circle(c, x, y, r, '#0b0f19', shade(glow, 0.1), 1.8);
  c.save();
  c.strokeStyle = glow;
  c.shadowColor = glow;
  c.shadowBlur = 6;
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(x, y, r * 0.82, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  c.fillStyle = '#334155';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    c.beginPath();
    c.ellipse(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.4, r * 0.16, a + 0.6, 0, Math.PI * 2);
    c.fill();
  }
  circle(c, x, y, r * 0.22, shade(glow, -0.2));
}

function wheel(c: Ctx, x: number, y: number, r: number, rim = '#cbd5e1') {
  circle(c, x, y, r, '#0f172a');
  circle(c, x, y, r * 0.62, lin(c, x - r, y - r, x + r, y + r, [[0, shade(rim, 0.3)], [1, shade(rim, -0.4)]]));
  c.strokeStyle = '#1e293b';
  c.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
    c.stroke();
  }
  circle(c, x, y, r * 0.15, '#0f172a');
}

// ── Kinds ───────────────────────────────────────────────────────────────
function tv(c: Ctx, it: CatalogItem, wide = 1) {
  const big = ['legendary', 'mythic', 'ultra', 'secret', 'limited'].includes(it.rarity);
  const w = 88 * wide;
  const h = 52;
  const x = -w / 2;
  const y = -34;
  // stand
  c.fillStyle = '#1f2937';
  c.beginPath();
  c.moveTo(-18, 26);
  c.lineTo(18, 26);
  c.lineTo(24, 32);
  c.lineTo(-24, 32);
  c.closePath();
  c.fill();
  c.fillStyle = '#374151';
  c.fillRect(-4, 16, 8, 12);
  box(c, x, y, w, h, 4, '#111827', 3);
  const b = big ? 1.5 : 3.5;
  screenFill(c, x + b, y + b, w - 2 * b, h - 2 * b, it, 2);
  c.fillStyle = it.color;
  c.fillRect(-3, y + h - 2, 6, 1.5);
}

function monitor(c: Ctx, it: CatalogItem) {
  const ultra = /ultrawide|49/i.test(it.name);
  const w = ultra ? 92 : 72;
  const h = ultra ? 36 : 44;
  const x = -w / 2;
  const y = -36;
  c.fillStyle = '#1f2937';
  c.fillRect(-4, y + h - 2, 8, 22);
  fillRR(c, -20, 22, 40, 7, 3, '#111827');
  if (ultra) {
    c.save();
    c.beginPath();
    c.moveTo(x, y + 4);
    c.quadraticCurveTo(0, y - 4, x + w, y + 4);
    c.lineTo(x + w, y + h + 4);
    c.quadraticCurveTo(0, y + h - 4, x, y + h + 4);
    c.closePath();
    c.fillStyle = '#0b1120';
    c.fill();
    c.clip();
    screenFill(c, x + 2, y - 2, w - 4, h + 6, it, 1);
    c.restore();
  } else {
    box(c, x, y, w, h, 3, '#0b1120', 3);
    screenFill(c, x + 2.5, y + 2.5, w - 5, h - 5, it, 2);
  }
  c.save();
  c.strokeStyle = it.color;
  c.shadowColor = it.color;
  c.shadowBlur = 6;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-14, 29);
  c.lineTo(14, 29);
  c.stroke();
  c.restore();
}

function phone(c: Ctx, it: CatalogItem) {
  const fold = /fold/i.test(it.name);
  const w = fold ? 50 : 36;
  const h = 70;
  box(c, -w / 2, -h / 2, w, h, 3, '#0f172a', 7);
  screenFill(c, -w / 2 + 2.5, -h / 2 + 2.5, w - 5, h - 5, it, 5);
  if (fold) {
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, -h / 2 + 3);
    c.lineTo(0, h / 2 - 3);
    c.stroke();
  }
  fillRR(c, -6, -h / 2 + 5, 12, 3.5, 2, '#020617');
  c.fillStyle = shade(it.color, -0.2);
  c.fillRect(w / 2 + 2, -12, 1.8, 10);
}

function tablet(c: Ctx, it: CatalogItem) {
  box(c, -40, -28, 80, 56, 3, '#111827', 6);
  screenFill(c, -36, -24, 72, 48, it, 3);
  circle(c, 0, -26, 1.2, '#334155');
}

function laptop(c: Ctx, it: CatalogItem) {
  const gaming = /gaming/i.test(it.name);
  // lid
  c.fillStyle = '#111827';
  c.beginPath();
  c.moveTo(-36, -30);
  c.lineTo(36, -30);
  c.lineTo(40, 12);
  c.lineTo(-40, 12);
  c.closePath();
  c.fill();
  c.save();
  c.beginPath();
  c.moveTo(-32, -26);
  c.lineTo(32, -26);
  c.lineTo(35.5, 9);
  c.lineTo(-35.5, 9);
  c.closePath();
  c.clip();
  screenFill(c, -36, -27, 72, 37, it, 0);
  c.restore();
  // base
  c.fillStyle = lin(c, 0, 12, 0, 28, [[0, '#94a3b8'], [1, '#475569']]);
  c.beginPath();
  c.moveTo(-42, 12);
  c.lineTo(42, 12);
  c.lineTo(50, 26);
  c.lineTo(-50, 26);
  c.closePath();
  c.fill();
  c.fillStyle = '#1e293b';
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 10; k++) {
      const t = k / 10;
      const x0 = -38 - r * 2 + t * (76 + r * 4);
      c.fillRect(x0, 14.5 + r * 3.4, 6.4 + r * 0.3, 2.3);
    }
  }
  if (gaming) {
    c.save();
    c.shadowColor = it.color;
    c.shadowBlur = 8;
    c.strokeStyle = it.color;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-50, 26.5);
    c.lineTo(50, 26.5);
    c.stroke();
    c.restore();
  }
}

function camera(c: Ctx, it: CatalogItem) {
  const cine = /cinema|rig|12k/i.test(it.name);
  box(c, -38, -20, 76, 44, 5, cine ? '#1f2937' : '#334155', 6);
  fillRR(c, -26, -30, 24, 12, 3, '#1f2937');
  fillRR(c, -38, -20, 16, 44, 5, '#111827');
  circle(c, 8, 2, 20, '#0f172a', '#475569', 3);
  circle(c, 8, 2, 14, lin(c, -6, -12, 22, 16, [[0, shade(it.color, 0.3)], [0.5, it.accent], [1, '#020617']]));
  circle(c, 3, -3, 4, 'rgba(255,255,255,0.55)');
  circle(c, 28, -14, 3, it.color);
  if (cine) {
    fillRR(c, 26, -36, 20, 14, 2, '#111827');
    screenFill(c, 28, -34, 16, 10, it, 1);
  }
}

function speaker(c: Ctx, it: CatalogItem) {
  const tall = /tower/i.test(it.name);
  const boom = /boom/i.test(it.name);
  if (boom) {
    box(c, -46, -22, 92, 44, 5, it.accent, 8);
    circle(c, -24, 0, 15, '#0f172a', shade(it.color, 0.2), 2.5);
    circle(c, 24, 0, 15, '#0f172a', shade(it.color, 0.2), 2.5);
    circle(c, -24, 0, 7, it.color);
    circle(c, 24, 0, 7, it.color);
    fillRR(c, -8, -14, 16, 8, 2, shade(it.color, 0.4));
    c.strokeStyle = '#cbd5e1';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-30, -22);
    c.quadraticCurveTo(0, -44, 30, -22);
    c.stroke();
    return;
  }
  const h = tall ? 82 : 58;
  box(c, -22, -h / 2, 44, h, 5, '#1f2937', 6);
  circle(c, 0, -h / 2 + 16, 9, '#0f172a', '#475569', 2);
  circle(c, 0, -h / 2 + 16, 4, it.color);
  circle(c, 0, h / 2 - 22, 15, '#0f172a', '#475569', 2.5);
  circle(c, 0, h / 2 - 22, 7, it.color);
  c.save();
  c.strokeStyle = it.color;
  c.shadowColor = it.color;
  c.shadowBlur = 6;
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, h / 2 - 22, 12, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

function smartwatch(c: Ctx, it: CatalogItem) {
  fillRR(c, -12, -44, 24, 30, 5, shade(it.accent, -0.2));
  fillRR(c, -12, 14, 24, 30, 5, shade(it.accent, -0.2));
  box(c, -20, -22, 40, 44, 3, '#1f2937', 10);
  screenFill(c, -16, -18, 32, 36, it, 8);
  c.save();
  c.strokeStyle = '#ffffff';
  c.globalAlpha = 0.85;
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 0, 10, -Math.PI / 2, Math.PI * 0.9);
  c.stroke();
  c.restore();
  fillRR(c, 22, -6, 4, 10, 2, '#64748b');
}

function headphones(c: Ctx, it: CatalogItem) {
  c.strokeStyle = shade(it.accent, -0.3);
  c.lineWidth = 7;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 4, 34, Math.PI * 1.05, Math.PI * 1.95);
  c.stroke();
  c.strokeStyle = shade(it.color, 0.1);
  c.lineWidth = 3;
  c.beginPath();
  c.arc(0, 4, 34, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  for (const s of [-1, 1]) {
    fillRR(c, s * 34 - 11, -8, 22, 36, 10, lin(c, 0, -8, 0, 28, [[0, shade(it.color, 0.1)], [1, shade(it.accent, -0.3)]]));
    fillRR(c, s * 34 - 7, -3, 14, 26, 7, '#0f172a');
    circle(c, s * 34, 10, 3, it.color);
  }
}

function drone(c: Ctx, it: CatalogItem) {
  c.strokeStyle = '#334155';
  c.lineWidth = 5;
  for (const [dx, dy] of [[-30, -18], [30, -18], [-30, 18], [30, 18]]) {
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(dx, dy);
    c.stroke();
  }
  for (const [dx, dy] of [[-30, -18], [30, -18], [-30, 18], [30, 18]]) {
    circle(c, dx, dy, 5, '#1f2937');
    c.save();
    c.globalAlpha = 0.45;
    c.fillStyle = it.color;
    c.beginPath();
    c.ellipse(dx, dy - 3, 17, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  fillRR(c, -16, -12, 32, 24, 8, lin(c, 0, -12, 0, 12, [[0, shade(it.color, 0.25)], [1, it.accent]]));
  circle(c, 0, 13, 6, '#0f172a', '#475569', 1.5);
  circle(c, 0, 13, 3, shade(it.color, 0.4));
  gloss(c, -16, -12, 32, 12);
}

function gamingPc(c: Ctx, it: CatalogItem) {
  const big = /titan|rig x/i.test(it.name);
  const w = big ? 52 : 44;
  const h = big ? 86 : 78;
  box(c, -w / 2, -h / 2, w, h, 10, '#0f172a', 4);
  fillRR(c, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 3, 'rgba(15,23,42,0.6)', 'rgba(148,163,184,0.35)', 1);
  const r = (w - 12) / 4.2;
  fan(c, -w / 4 + 1, -h / 2 + 16, r, it.color);
  fan(c, w / 4 - 1, -h / 2 + 16, r, it.color);
  fan(c, 0, -h / 2 + 16 + r * 2.4, r * 1.1, shade(it.color, 0.2));
  // motherboard + gpu
  fillRR(c, -w / 2 + 7, h / 2 - 26, w - 14, 7, 1.5, '#1e293b');
  c.save();
  c.fillStyle = it.color;
  c.shadowColor = it.color;
  c.shadowBlur = 8;
  c.fillRect(-w / 2 + 7, h / 2 - 20, w - 14, 2);
  c.fillRect(-w / 2 + 2, -h / 2 + 6, 1.8, h - 12);
  c.restore();
  gloss(c, -w / 2, -h / 2, w, h);
}

function consoleArt(c: Ctx, it: CatalogItem) {
  const proto = /prototype|phantom/i.test(it.name);
  box(c, -44, -14, 88, 30, 9, proto ? '#0b0b12' : '#e5e7eb', 5);
  if (!proto) fillRR(c, -44, -14, 88, 9, 4, shade(it.color, 0.2));
  c.save();
  c.fillStyle = proto ? '#c084fc' : it.color;
  c.shadowColor = c.fillStyle as string;
  c.shadowBlur = 10;
  c.fillRect(-36, 6, 72, 2.2);
  c.restore();
  fillRR(c, 14, -4, 22, 3, 1.5, '#1f2937');
  circle(c, -32, 1, 2.2, proto ? '#c084fc' : '#22c55e');
  gloss(c, -44, -14, 88, 30);
}

function controller(c: Ctx, it: CatalogItem) {
  const body = lin(c, 0, -20, 0, 24, [[0, shade(it.color, 0.15)], [1, shade(it.accent, -0.25)]]);
  c.beginPath();
  c.moveTo(-30, -16);
  c.bezierCurveTo(-12, -22, 12, -22, 30, -16);
  c.bezierCurveTo(44, -12, 50, 18, 42, 26);
  c.bezierCurveTo(34, 34, 24, 20, 16, 14);
  c.lineTo(-16, 14);
  c.bezierCurveTo(-24, 20, -34, 34, -42, 26);
  c.bezierCurveTo(-50, 18, -44, -12, -30, -16);
  c.closePath();
  c.fillStyle = body;
  c.fill();
  c.strokeStyle = shade(it.accent, -0.5);
  c.lineWidth = 1.5;
  c.stroke();
  // d-pad
  c.fillStyle = '#1e293b';
  c.fillRect(-32, -6, 14, 4.5);
  c.fillRect(-27.3, -11, 4.5, 14);
  // face buttons
  const cols = ['#22d3ee', '#f43f5e', '#facc15', '#4ade80'];
  [[26, -10], [32, -4], [26, 2], [20, -4]].forEach(([x, y], i) => circle(c, x, y, 3, cols[i]));
  circle(c, -10, 6, 6, '#0f172a', '#334155', 2);
  circle(c, 10, 6, 6, '#0f172a', '#334155', 2);
  gloss(c, -44, -20, 88, 16);
}

function gpu(c: Ctx, it: CatalogItem) {
  box(c, -46, -16, 92, 34, 7, '#111827', 4);
  fillRR(c, -50, -18, 5, 40, 1, '#94a3b8');
  const n = /founders|frostbite/i.test(it.name) ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const x = -46 + (92 / (n + 1)) * (i + 1);
    fan(c, x, 1, 13, it.color);
  }
  c.save();
  c.fillStyle = it.color;
  c.shadowColor = it.color;
  c.shadowBlur = 10;
  c.fillRect(-44, -15, 88, 2);
  c.restore();
  fillRR(c, -40, 18, 60, 4, 1, '#b45309');
}

function gamingSetup(c: Ctx, it: CatalogItem) {
  // desk
  c.fillStyle = '#1f2937';
  c.fillRect(-46, 18, 4, 22);
  c.fillRect(42, 18, 4, 22);
  box(c, -48, 12, 96, 7, 6, '#334155', 2);
  // monitors
  const drawMon = (x: number, y: number, w: number, h: number) => {
    c.fillStyle = '#111827';
    c.fillRect(x + w / 2 - 1.5, y + h, 3, 12 - (y + h - 0));
    fillRR(c, x, y, w, h, 2, '#0b1120');
    screenFill(c, x + 1.5, y + 1.5, w - 3, h - 3, it, 1);
  };
  drawMon(-44, -16, 28, 20);
  drawMon(-15, -24, 34, 26);
  drawMon(20, -16, 28, 20);
  // tower
  box(c, 30, -6, 14, 18, 4, '#0f172a', 2);
  c.save();
  c.fillStyle = it.color;
  c.shadowColor = it.color;
  c.shadowBlur = 8;
  c.fillRect(32, -3, 1.5, 12);
  // desk strip
  c.fillRect(-46, 19.5, 92, 1.5);
  c.restore();
  fillRR(c, -14, 6, 26, 5, 1.5, '#0f172a');
  fillRR(c, 16, 6, 7, 5, 2, '#475569');
}

function vr(c: Ctx, it: CatalogItem) {
  c.strokeStyle = '#1f2937';
  c.lineWidth = 6;
  c.beginPath();
  c.ellipse(0, -6, 42, 26, 0, Math.PI, Math.PI * 2);
  c.stroke();
  box(c, -40, -14, 80, 36, 6, shade(it.accent, -0.2), 14);
  fillRR(c, -35, -10, 70, 26, 12, lin(c, -35, -10, 35, 16, [[0, '#020617'], [0.5, shade(it.accent, -0.3)], [1, '#020617']]));
  c.save();
  c.globalAlpha = 0.8;
  c.fillStyle = it.color;
  c.shadowColor = it.color;
  c.shadowBlur = 12;
  c.fillRect(-26, 1, 52, 2.5);
  c.restore();
  gloss(c, -35, -10, 70, 26);
}

function keyboard(c: Ctx, it: CatalogItem) {
  c.fillStyle = '#111827';
  c.beginPath();
  c.moveTo(-40, -14);
  c.lineTo(40, -14);
  c.lineTo(48, 16);
  c.lineTo(-48, 16);
  c.closePath();
  c.fill();
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 11; k++) {
      const t = (r + 0.5) / 4;
      const left = -40 - 8 * t;
      const width = 80 + 16 * t;
      const x = left + (k / 11) * width + 0.8;
      const hue = (k * 30 + r * 40) % 360;
      c.fillStyle = /rgb|kryo/i.test(it.name) ? `hsl(${hue},80%,60%)` : '#334155';
      c.fillRect(x, -11 + r * 6.6, width / 11 - 1.6, 4.8);
    }
  }
  c.save();
  c.strokeStyle = it.color;
  c.shadowColor = it.color;
  c.shadowBlur = 8;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-48, 17);
  c.lineTo(48, 17);
  c.stroke();
  c.restore();
}

function handheld(c: Ctx, it: CatalogItem) {
  fillRR(c, -48, -20, 96, 40, 18, lin(c, 0, -20, 0, 20, [[0, shade(it.color, 0.1)], [1, shade(it.accent, -0.3)]]));
  fillRR(c, -26, -14, 52, 28, 3, '#0b1120');
  screenFill(c, -24, -12, 48, 24, it, 2);
  circle(c, -37, -2, 5, '#0f172a', '#334155', 1.5);
  [[36, -8], [41, -3], [36, 2], [31, -3]].forEach(([x, y]) => circle(c, x, y, 2.4, '#1e293b'));
}

function carBody(c: Ctx, it: CatalogItem, kind: string) {
  const col = it.color;
  const body = lin(c, 0, -20, 0, 20, [[0, shade(col, 0.35)], [0.5, col], [1, shade(col, -0.45)]]);
  c.beginPath();
  if (kind === 'suv') {
    c.moveTo(-48, 14); c.lineTo(-48, -2); c.lineTo(-40, -6); c.lineTo(-30, -24); c.lineTo(24, -24);
    c.lineTo(36, -6); c.lineTo(48, -2); c.lineTo(48, 14);
  } else if (kind === 'car') {
    c.moveTo(-46, 14); c.lineTo(-46, -2); c.lineTo(-38, -5); c.lineTo(-26, -22); c.lineTo(14, -22);
    c.lineTo(30, -6); c.lineTo(46, -2); c.lineTo(46, 14);
  } else if (kind === 'sports_car') {
    c.moveTo(-48, 12); c.lineTo(-48, 0); c.lineTo(-30, -4); c.quadraticCurveTo(-14, -20, 8, -18);
    c.lineTo(26, -6); c.lineTo(48, -2); c.lineTo(48, 12);
  } else {
    // supercar / hypercar wedge
    c.moveTo(-50, 10); c.lineTo(-50, -2); c.lineTo(-32, -6); c.quadraticCurveTo(-10, -18, 10, -14);
    c.lineTo(30, -6); c.lineTo(50, 0); c.lineTo(50, 10);
  }
  c.closePath();
  c.fillStyle = body;
  c.fill();
  c.strokeStyle = shade(col, -0.6);
  c.lineWidth = 1.2;
  c.stroke();
  // windows
  c.beginPath();
  if (kind === 'suv') { c.moveTo(-36, -7); c.lineTo(-28, -21); c.lineTo(22, -21); c.lineTo(32, -7); }
  else if (kind === 'car') { c.moveTo(-34, -6); c.lineTo(-24, -19); c.lineTo(12, -19); c.lineTo(25, -6); }
  else if (kind === 'sports_car') { c.moveTo(-26, -5); c.quadraticCurveTo(-12, -16, 6, -15); c.lineTo(20, -6); }
  else { c.moveTo(-26, -6); c.quadraticCurveTo(-8, -15, 8, -12); c.lineTo(22, -6); }
  c.closePath();
  c.fillStyle = lin(c, 0, -20, 0, -5, [[0, '#94a3b8'], [1, '#0f172a']]);
  c.fill();
  // lights
  circle(c, 46, 2, 2.5, '#fef9c3');
  c.fillStyle = '#ef4444';
  c.fillRect(-49, 1, 3, 4);
  if (kind === 'hypercar') {
    c.fillStyle = shade(col, -0.5);
    c.fillRect(-50, -16, 16, 3);
    c.fillRect(-44, -13, 2, 8);
    c.save();
    c.strokeStyle = it.rarity === 'secret' ? '#c084fc' : shade(col, 0.6);
    c.shadowColor = c.strokeStyle as string;
    c.shadowBlur = 8;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-40, 6);
    c.lineTo(40, 4);
    c.stroke();
    c.restore();
  }
  const wr = kind === 'suv' ? 11 : kind === 'car' ? 10 : 10.5;
  wheel(c, -28, 13, wr);
  wheel(c, 30, 13, wr);
  gloss(c, -48, -22, 96, 18);
}

function motorbike(c: Ctx, it: CatalogItem) {
  const moped = /moped|scoot/i.test(it.name);
  wheel(c, -30, 16, 14);
  wheel(c, 32, 16, 14);
  c.strokeStyle = '#475569';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-30, 16);
  c.lineTo(-6, -2);
  c.lineTo(22, -2);
  c.lineTo(32, 16);
  c.stroke();
  c.beginPath();
  c.moveTo(24, -2);
  c.lineTo(28, -20);
  c.stroke();
  c.fillStyle = '#1f2937';
  c.fillRect(22, -23, 14, 3);
  const g = lin(c, 0, -14, 0, 6, [[0, shade(it.color, 0.3)], [1, it.accent]]);
  c.beginPath();
  if (moped) {
    c.moveTo(-18, 8); c.lineTo(-10, -8); c.lineTo(10, -8); c.lineTo(16, 8); c.closePath();
  } else {
    c.moveTo(-14, -2); c.quadraticCurveTo(-2, -18, 18, -10); c.lineTo(22, 2); c.lineTo(-12, 4); c.closePath();
  }
  c.fillStyle = g;
  c.fill();
  fillRR(c, -26, -8, 20, 6, 3, '#111827');
  if (/neon|superbike|track/i.test(it.name)) {
    c.save();
    c.strokeStyle = it.color;
    c.shadowColor = it.color;
    c.shadowBlur = 10;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(-30, 16, 14, 0, Math.PI * 2);
    c.arc(32, 16, 14, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
}

function sneakers(c: Ctx, it: CatalogItem) {
  const g = lin(c, 0, -20, 0, 14, [[0, shade(it.color, 0.25)], [1, shade(it.accent, -0.1)]]);
  c.beginPath();
  c.moveTo(-44, 10);
  c.lineTo(-44, -6);
  c.quadraticCurveTo(-42, -20, -26, -20);
  c.lineTo(-10, -14);
  c.quadraticCurveTo(8, -2, 30, -2);
  c.quadraticCurveTo(46, 0, 46, 10);
  c.closePath();
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = shade(it.accent, -0.5);
  c.lineWidth = 1.2;
  c.stroke();
  // sole
  fillRR(c, -46, 8, 94, 9, 4, it.rarity === 'secret' ? '#1e1b4b' : '#f8fafc');
  c.fillStyle = shade(it.color, -0.3);
  c.fillRect(-44, 14, 90, 2);
  // bolt stripe (original design)
  c.fillStyle = it.rarity === 'secret' ? '#c084fc' : '#ffffff';
  c.beginPath();
  c.moveTo(-30, 2);
  c.lineTo(-6, -8);
  c.lineTo(-10, -2);
  c.lineTo(16, -6);
  c.lineTo(-8, 6);
  c.lineTo(-4, 0);
  c.closePath();
  c.fill();
  // laces
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.moveTo(-22 + i * 5, -17 + i * 2.2);
    c.lineTo(-17 + i * 5, -13 + i * 2.2);
    c.stroke();
  }
  if (/zero-g|hover|glow/i.test(it.name)) {
    c.save();
    c.fillStyle = it.rarity === 'secret' ? '#c084fc' : it.color;
    c.shadowColor = c.fillStyle as string;
    c.shadowBlur = 14;
    c.globalAlpha = 0.7;
    c.fillRect(-42, 19, 86, 2);
    c.restore();
  }
}

function top(c: Ctx, it: CatalogItem, jacket: boolean) {
  const g = lin(c, 0, -30, 0, 36, [[0, shade(it.color, 0.2)], [1, shade(it.accent, -0.2)]]);
  c.beginPath();
  c.moveTo(-18, -30);
  c.lineTo(-40, -18);
  c.lineTo(-48, 16);
  c.lineTo(-36, 18);
  c.lineTo(-30, -2);
  c.lineTo(-28, 36);
  c.lineTo(28, 36);
  c.lineTo(30, -2);
  c.lineTo(36, 18);
  c.lineTo(48, 16);
  c.lineTo(40, -18);
  c.lineTo(18, -30);
  c.quadraticCurveTo(0, -18, -18, -30);
  c.closePath();
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = shade(it.accent, -0.5);
  c.lineWidth = 1.2;
  c.stroke();
  if (jacket) {
    c.strokeStyle = '#e2e8f0';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, -22);
    c.lineTo(0, 36);
    c.stroke();
    c.fillStyle = shade(it.color, 0.4);
    c.fillRect(-28, 30, 56, 6);
    c.fillStyle = shade(it.color, -0.3);
    c.beginPath();
    c.moveTo(-18, -30); c.lineTo(-6, -14); c.lineTo(0, -22); c.lineTo(6, -14); c.lineTo(18, -30);
    c.quadraticCurveTo(0, -24, -18, -30);
    c.fill();
    if (/reflect|aurora/i.test(it.name)) {
      c.save();
      c.fillStyle = /aurora/i.test(it.name) ? '#a5f3fc' : '#e2e8f0';
      c.globalAlpha = 0.8;
      c.fillRect(-28, 10, 56, 3);
      c.fillRect(-44, 8, 8, 3);
      c.fillRect(36, 8, 8, 3);
      c.restore();
    }
  } else {
    // hood + pocket + strings
    c.strokeStyle = shade(it.accent, -0.4);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-16, -30);
    c.quadraticCurveTo(0, -6, 16, -30);
    c.stroke();
    fillRR(c, -16, 14, 32, 12, 4, shade(it.color, -0.12));
    c.strokeStyle = '#f8fafc';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-5, -16); c.lineTo(-6, -2);
    c.moveTo(5, -16); c.lineTo(6, -2);
    c.stroke();
  }
  gloss(c, -40, -30, 80, 30);
}

function cap(c: Ctx, it: CatalogItem) {
  c.beginPath();
  c.moveTo(-34, 8);
  c.quadraticCurveTo(-34, -30, 0, -30);
  c.quadraticCurveTo(34, -30, 34, 8);
  c.closePath();
  c.fillStyle = lin(c, 0, -30, 0, 8, [[0, shade(it.color, 0.3)], [1, it.accent]]);
  c.fill();
  c.beginPath();
  c.moveTo(-10, 6);
  c.quadraticCurveTo(30, 0, 52, 14);
  c.quadraticCurveTo(28, 18, -10, 14);
  c.closePath();
  c.fillStyle = shade(it.accent, -0.3);
  c.fill();
  circle(c, 0, -29, 3, shade(it.accent, -0.3));
  fillRR(c, -10, -16, 20, 10, 3, '#f8fafc');
  c.fillStyle = it.accent;
  c.font = 'bold 7px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText(it.brand[0], 0, -8.5);
}

function sunglasses(c: Ctx, it: CatalogItem) {
  c.strokeStyle = '#1f2937';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-46, -8);
  c.lineTo(-40, -6);
  c.moveTo(46, -8);
  c.lineTo(40, -6);
  c.moveTo(-6, -4);
  c.quadraticCurveTo(0, -9, 6, -4);
  c.stroke();
  for (const s of [-1, 1]) {
    c.beginPath();
    c.ellipse(s * 22, 2, 19, 13, 0, 0, Math.PI * 2);
    c.fillStyle = lin(c, s * 22 - 19, -11, s * 22 + 19, 15, [[0, shade(it.color, 0.2)], [0.6, it.accent], [1, '#020617']]);
    c.fill();
    c.strokeStyle = '#111827';
    c.lineWidth = 2.5;
    c.stroke();
    gloss(c, s * 22 - 19, -11, 38, 13);
  }
}

function backpack(c: Ctx, it: CatalogItem) {
  c.strokeStyle = shade(it.accent, -0.4);
  c.lineWidth = 5;
  c.beginPath();
  c.arc(0, -30, 10, Math.PI, Math.PI * 2);
  c.stroke();
  fillRR(c, -30, -32, 60, 70, 18, lin(c, 0, -32, 0, 38, [[0, shade(it.color, 0.2)], [1, it.accent]]), shade(it.accent, -0.5));
  fillRR(c, -20, 6, 40, 24, 8, shade(it.color, -0.15));
  c.strokeStyle = '#f8fafc';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-14, 10);
  c.lineTo(14, 10);
  c.stroke();
  if (/holo/i.test(it.name)) {
    c.save();
    c.globalAlpha = 0.55;
    c.fillStyle = lin(c, -30, -32, 30, 38, [[0, '#f0abfc'], [0.5, '#67e8f9'], [1, '#fde68a']]);
    rr(c, -30, -32, 60, 70, 18);
    c.fill();
    c.restore();
  }
  gloss(c, -30, -32, 60, 40);
}

function watch(c: Ctx, it: CatalogItem) {
  const gold = /gold|royal|tourbillon|gala|chrono/i.test(it.name);
  const band = gold ? '#b45309' : '#475569';
  fillRR(c, -13, -48, 26, 30, 4, band);
  fillRR(c, -13, 18, 26, 30, 4, band);
  for (let i = 0; i < 4; i++) {
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(-13, -44 + i * 7, 26, 1.2);
    c.fillRect(-13, 22 + i * 7, 26, 1.2);
  }
  const rim = gold ? lin(c, -26, -26, 26, 26, [[0, '#fde68a'], [0.5, '#f59e0b'], [1, '#78350f']]) : lin(c, -26, -26, 26, 26, [[0, '#f1f5f9'], [1, '#475569']]);
  circle(c, 0, 0, 26, rim);
  const face = /skeleton|tourbillon/i.test(it.name);
  circle(c, 0, 0, 21, face ? '#0f172a' : lin(c, 0, -21, 0, 21, [[0, shade(it.color, 0.3)], [1, it.accent]]));
  if (face) {
    c.strokeStyle = gold ? '#fbbf24' : '#94a3b8';
    c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.arc(0, 0, 5 + i * 2.6, i, i + 2.5);
      c.stroke();
    }
    circle(c, 0, 8, 6, 'rgba(251,191,36,0.3)', '#fbbf24', 1);
  }
  c.fillStyle = gold ? '#fef3c7' : '#f8fafc';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    c.fillRect(Math.cos(a) * 17 - 1, Math.sin(a) * 17 - 1, 2, 2);
  }
  c.strokeStyle = gold ? '#fef3c7' : '#f8fafc';
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -13);
  c.moveTo(0, 0);
  c.lineTo(9, 5);
  c.stroke();
  fillRR(c, 25, -4, 5, 8, 2, gold ? '#f59e0b' : '#94a3b8');
  gloss(c, -21, -21, 42, 21);
}

function chain(c: Ctx, it: CatalogItem) {
  const gold = !/silver/i.test(it.name);
  const metal = gold ? '#fbbf24' : '#e2e8f0';
  c.lineWidth = 2.5;
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI * 0.12 + (i / 18) * Math.PI * 0.76;
    const x = Math.cos(a) * 40;
    const y = -32 + Math.sin(a) * 50;
    c.strokeStyle = i % 2 ? shade(metal, -0.25) : metal;
    c.beginPath();
    c.ellipse(x, y, 4, 2.6, a, 0, Math.PI * 2);
    c.stroke();
  }
  // pendant
  const crown = /crown/i.test(it.name);
  const g = lin(c, -14, 16, 14, 42, [[0, shade(metal, 0.4)], [1, shade(metal, -0.4)]]);
  c.fillStyle = g;
  c.beginPath();
  if (crown) {
    c.moveTo(-14, 36); c.lineTo(-14, 20); c.lineTo(-7, 28); c.lineTo(0, 16); c.lineTo(7, 28); c.lineTo(14, 20); c.lineTo(14, 36);
  } else {
    c.moveTo(0, 16); c.lineTo(13, 29); c.lineTo(0, 42); c.lineTo(-13, 29);
  }
  c.closePath();
  c.fill();
  if (/diamond|crown/i.test(it.name)) {
    circle(c, 0, 29, 4, '#e0f2fe');
    circle(c, -1, 28, 1.5, '#ffffff');
  }
}

function ring(c: Ctx, it: CatalogItem) {
  c.lineWidth = 7;
  c.strokeStyle = lin(c, -26, 0, 26, 0, [[0, '#fde68a'], [0.5, '#b45309'], [1, '#fde68a']]);
  c.beginPath();
  c.ellipse(0, 12, 26, 20, 0, 0, Math.PI * 2);
  c.stroke();
  gem(c, 0, -16, 13, it.color);
}

function gem(c: Ctx, x: number, y: number, s: number, col: string) {
  const pts: [number, number][] = [[-1, -0.35], [-0.55, -0.9], [0.55, -0.9], [1, -0.35], [0, 1]];
  c.beginPath();
  pts.forEach(([px, py], i) => (i ? c.lineTo(x + px * s, y + py * s) : c.moveTo(x + px * s, y + py * s)));
  c.closePath();
  c.fillStyle = lin(c, x - s, y - s, x + s, y + s, [[0, shade(col, 0.6)], [0.5, col], [1, shade(col, -0.5)]]);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(x - s, y - 0.35 * s);
  c.lineTo(x + s, y - 0.35 * s);
  c.moveTo(x - 0.55 * s, y - 0.9 * s);
  c.lineTo(x - 0.3 * s, y - 0.35 * s);
  c.lineTo(x, y + s);
  c.lineTo(x + 0.3 * s, y - 0.35 * s);
  c.lineTo(x + 0.55 * s, y - 0.9 * s);
  c.stroke();
}

function diamond(c: Ctx, it: CatalogItem) {
  const col = it.rarity === 'secret' ? '#1e1b4b' : /emerald/i.test(it.name) ? '#34d399' : /studs/i.test(it.name) ? '#e0f2fe' : it.color;
  if (/studs/i.test(it.name)) {
    gem(c, -20, 0, 18, col);
    gem(c, 20, 0, 18, col);
    return;
  }
  gem(c, 0, 4, 42, col);
  if (it.rarity === 'secret') {
    c.save();
    c.strokeStyle = '#c084fc';
    c.shadowColor = '#c084fc';
    c.shadowBlur = 16;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 4, 20, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
}

function goldBar(c: Ctx) {
  const bar = (x: number, y: number) => {
    c.beginPath();
    c.moveTo(x - 20, y + 10);
    c.lineTo(x - 14, y - 6);
    c.lineTo(x + 14, y - 6);
    c.lineTo(x + 20, y + 10);
    c.closePath();
    c.fillStyle = lin(c, x, y - 6, x, y + 10, [[0, '#fde68a'], [0.5, '#f59e0b'], [1, '#92400e']]);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.fillRect(x - 12, y - 4, 24, 2);
  };
  bar(-21, 22);
  bar(21, 22);
  bar(0, 6);
  bar(-10, -10);
  bar(12, -10);
}

function perfume(c: Ctx, it: CatalogItem) {
  fillRR(c, -8, -44, 16, 14, 3, '#fbbf24');
  fillRR(c, -5, -32, 10, 8, 1, '#d97706');
  c.beginPath();
  c.moveTo(-24, -24);
  c.lineTo(24, -24);
  c.lineTo(30, 30);
  c.quadraticCurveTo(0, 40, -30, 30);
  c.closePath();
  c.fillStyle = 'rgba(226,232,240,0.35)';
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = 1.5;
  c.stroke();
  c.save();
  c.clip();
  c.fillStyle = lin(c, 0, -10, 0, 36, [[0, shade(it.color, 0.2)], [1, it.accent]]);
  c.fillRect(-32, -8, 64, 46);
  c.restore();
  fillRR(c, -14, 2, 28, 14, 2, '#f8fafc');
  c.fillStyle = '#0f172a';
  c.font = 'bold 7px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText(it.brand, 0, 12);
  gloss(c, -24, -24, 48, 60);
}

function ball(c: Ctx, it: CatalogItem) {
  const infinity = it.rarity === 'secret';
  circle(c, 0, 0, 36, infinity ? lin(c, -36, -36, 36, 36, [[0, '#1e1b4b'], [1, '#020617']]) : lin(c, -36, -36, 36, 36, [[0, shade(it.color, 0.5)], [0.6, it.color], [1, shade(it.accent, -0.3)]]));
  c.strokeStyle = infinity ? '#c084fc' : shade(it.accent, -0.4);
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, 36, 0, Math.PI * 2);
  c.moveTo(-36, 0);
  c.quadraticCurveTo(0, 14, 36, 0);
  c.moveTo(0, -36);
  c.quadraticCurveTo(-14, 0, 0, 36);
  c.stroke();
  if (/championship|signature|golden/i.test(it.name)) {
    c.fillStyle = '#fbbf24';
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 5 : 11;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      c.lineTo(Math.cos(a) * r - 14, Math.sin(a) * r - 12);
    }
    c.closePath();
    c.fill();
  }
  c.save();
  c.globalAlpha = 0.35;
  circle(c, -12, -14, 12, '#ffffff');
  c.restore();
}

function skateboard(c: Ctx, it: CatalogItem) {
  const hover = /hover/i.test(it.name);
  c.save();
  c.rotate(-0.18);
  if (hover) {
    c.save();
    c.fillStyle = it.color;
    c.shadowColor = it.color;
    c.shadowBlur = 18;
    c.globalAlpha = 0.6;
    c.beginPath();
    c.ellipse(0, 14, 40, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  } else {
    wheel(c, -30, 12, 5.5, '#fde68a');
    wheel(c, 30, 12, 5.5, '#fde68a');
  }
  fillRR(c, -48, -2, 96, 10, 5, lin(c, 0, -2, 0, 8, [[0, shade(it.color, 0.3)], [1, it.accent]]), shade(it.accent, -0.5));
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.fillRect(-30, 0, 60, 2);
  c.restore();
}

function bicycle(c: Ctx, it: CatalogItem) {
  const r = 18;
  for (const x of [-28, 28]) {
    c.strokeStyle = '#0f172a';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(x, 14, r, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 0.8;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(x, 14);
      c.lineTo(x + Math.cos(a) * r, 14 + Math.sin(a) * r);
      c.stroke();
    }
  }
  c.strokeStyle = it.color;
  c.lineWidth = 4;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(-28, 14);
  c.lineTo(-8, -10);
  c.lineTo(20, -10);
  c.lineTo(0, 14);
  c.lineTo(-28, 14);
  c.moveTo(0, 14);
  c.lineTo(-10, -16);
  c.moveTo(20, -10);
  c.lineTo(28, 14);
  c.moveTo(20, -10);
  c.lineTo(18, -20);
  c.stroke();
  fillRR(c, -18, -21, 16, 5, 2.5, '#111827');
  c.strokeStyle = '#111827';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(12, -21);
  c.lineTo(26, -20);
  c.stroke();
}

function racket(c: Ctx, it: CatalogItem) {
  c.save();
  c.rotate(-0.5);
  const frame = /golden/i.test(it.name) ? '#fbbf24' : it.color;
  c.beginPath();
  c.ellipse(0, -14, 22, 28, 0, 0, Math.PI * 2);
  c.strokeStyle = frame;
  c.lineWidth = 5;
  c.stroke();
  c.save();
  c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = 0.8;
  for (let i = -22; i <= 22; i += 5) {
    c.beginPath();
    c.moveTo(i, -44);
    c.lineTo(i, 16);
    c.stroke();
    c.beginPath();
    c.moveTo(-24, i - 14);
    c.lineTo(24, i - 14);
    c.stroke();
  }
  c.restore();
  c.fillStyle = frame;
  c.fillRect(-2.5, 14, 5, 12);
  fillRR(c, -4, 24, 8, 24, 3, '#1f2937');
  c.restore();
}

function golf(c: Ctx, it: CatalogItem) {
  c.strokeStyle = '#cbd5e1';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-26, -40);
  c.lineTo(10, 26);
  c.stroke();
  fillRR(c, -32, -46, 10, 14, 3, '#111827');
  c.beginPath();
  c.moveTo(6, 22);
  c.quadraticCurveTo(30, 18, 30, 30);
  c.lineTo(8, 32);
  c.closePath();
  c.fillStyle = lin(c, 6, 18, 30, 32, [[0, shade(it.color, 0.4)], [1, it.accent]]);
  c.fill();
  if (/set/i.test(it.name)) {
    c.strokeStyle = '#94a3b8';
    c.beginPath();
    c.moveTo(20, -40);
    c.lineTo(-6, 26);
    c.stroke();
    fillRR(c, 16, -46, 10, 12, 3, '#111827');
  }
  circle(c, 34, 36, 6, '#f8fafc', '#cbd5e1', 1);
}

function surfboard(c: Ctx, it: CatalogItem) {
  c.save();
  c.rotate(0.6);
  c.beginPath();
  c.ellipse(0, 0, 16, 48, 0, 0, Math.PI * 2);
  c.fillStyle = lin(c, -16, 0, 16, 0, [[0, shade(it.color, 0.3)], [1, it.accent]]);
  c.fill();
  c.strokeStyle = '#f8fafc';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, -46);
  c.lineTo(0, 46);
  c.stroke();
  c.fillStyle = '#0f172a';
  c.beginPath();
  c.moveTo(-3, 36);
  c.lineTo(0, 46);
  c.lineTo(3, 36);
  c.fill();
  c.restore();
}

function trophy(c: Ctx, it: CatalogItem) {
  const plat = /platinum/i.test(it.name);
  const metal = plat ? ['#f1f5f9', '#94a3b8', '#475569'] : ['#fef3c7', '#f59e0b', '#78350f'];
  const g = lin(c, -24, -40, 24, 10, [[0, metal[0]], [0.5, metal[1]], [1, metal[2]]]);
  c.strokeStyle = metal[1];
  c.lineWidth = 5;
  c.beginPath();
  c.arc(-24, -18, 10, Math.PI * 0.5, Math.PI * 1.5);
  c.arc(24, -18, 10, -Math.PI * 0.5, Math.PI * 0.5);
  c.stroke();
  c.beginPath();
  c.moveTo(-26, -40);
  c.lineTo(26, -40);
  c.quadraticCurveTo(24, 0, 0, 6);
  c.quadraticCurveTo(-24, 0, -26, -40);
  c.closePath();
  c.fillStyle = g;
  c.fill();
  c.fillStyle = metal[1];
  c.fillRect(-4, 6, 8, 14);
  box(c, -20, 20, 40, 14, 5, '#1f2937', 2);
  fillRR(c, -12, 24, 24, 6, 1, metal[1]);
  c.fillStyle = plat ? '#e879f9' : it.color;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 4 : 9;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    c.lineTo(Math.cos(a) * r, -20 + Math.sin(a) * r);
  }
  c.closePath();
  c.fill();
  gloss(c, -26, -40, 52, 20);
}

const DRAW: Record<string, (c: Ctx, it: CatalogItem) => void> = {
  tv: (c, it) => tv(c, it, /120|150|98|holo|hyper/i.test(it.name) ? 1.08 : 1),
  monitor,
  phone,
  tablet,
  laptop,
  camera,
  speaker,
  smartwatch,
  headphones,
  drone,
  gaming_pc: gamingPc,
  console: consoleArt,
  controller,
  gpu,
  gaming_setup: gamingSetup,
  vr_headset: vr,
  keyboard,
  handheld,
  car: (c, it) => carBody(c, it, 'car'),
  suv: (c, it) => carBody(c, it, 'suv'),
  sports_car: (c, it) => carBody(c, it, 'sports_car'),
  supercar: (c, it) => carBody(c, it, 'supercar'),
  hypercar: (c, it) => carBody(c, it, 'hypercar'),
  motorbike,
  sneakers,
  hoodie: (c, it) => top(c, it, false),
  jacket: (c, it) => top(c, it, true),
  cap,
  sunglasses,
  backpack,
  luxury_watch: watch,
  chain,
  ring,
  diamond,
  gold_bar: (c) => goldBar(c),
  perfume,
  ball,
  skateboard,
  bicycle,
  racket,
  golf,
  surfboard,
  trophy,
};

export const VEHICLE_KINDS = new Set(['car', 'suv', 'sports_car', 'supercar', 'hypercar', 'motorbike']);
export const WALL_KINDS = new Set(['tv', 'monitor']);
export const DESK_KINDS = new Set(['gaming_pc', 'console', 'laptop', 'keyboard', 'gpu', 'handheld', 'gaming_setup', 'tablet', 'vr_headset', 'controller']);

/** Draw an item centred at (0,0) scaled so the 100-unit design box becomes `size` pixels. */
export function drawItem(c: Ctx, it: CatalogItem, size: number) {
  c.save();
  c.scale(size / 100, size / 100);
  c.lineJoin = 'round';
  const fn = DRAW[it.kind] || DRAW.tablet;
  try {
    fn(c, it);
  } catch (e) {
    console.warn('art failed', it.kind, e);
  }
  c.restore();
}

// ── Caches ─────────────────────────────────────────────────────────────
const canvasCache = new Map<string, HTMLCanvasElement>();
const urlCache = new Map<string, string>();

export function itemCanvas(it: CatalogItem, px: number): HTMLCanvasElement {
  const key = it.id + '@' + px;
  let cv = canvasCache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = px;
  cv.height = px;
  const c = cv.getContext('2d')!;
  c.translate(px / 2, px / 2);
  drawItem(c, it, px * 0.86);
  canvasCache.set(key, cv);
  return cv;
}

export function itemUrl(it: CatalogItem, px = 128): string {
  const key = it.id + '@' + px;
  let u = urlCache.get(key);
  if (!u) {
    u = itemCanvas(it, px).toDataURL('image/png');
    urlCache.set(key, u);
  }
  return u;
}

export function rarityOf(it: CatalogItem | undefined): Rarity {
  return (it?.rarity || 'common') as Rarity;
}
