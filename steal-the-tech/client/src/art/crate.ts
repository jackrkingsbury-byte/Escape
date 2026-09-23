// Drop crate artwork (2D canvas) used by the drop-opening overlay.
import { shade } from './items';
import { rainbow } from '../game/rarity';

type Ctx = CanvasRenderingContext2D;

export const DROP_COLORS: Record<string, [string, string]> = {
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
