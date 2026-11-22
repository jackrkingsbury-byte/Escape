// On-screen cards for later episodes: weird quote cards and the "TOP 10 RESPECTFUL MOMENTS" ranking card.
// Pure functions of time; call from a shot's update().
import { clamp, ease } from './lib/util.js';

export function wrap(text, max = 20) {
  const out = []; let line = '';
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out.join('\n');
}

/** Full-screen weird quote card, visible in [t0, t1]. Hides the captions while up (the card IS the caption). */
export function quoteCard(ctx, quote, by, t0, t1, { y = 0.36, size = 78, tint = '#000000' } = {}) {
  const t = ctx.t;
  if (t < t0 || t > t1) return false;
  const d = t - t0, out = t1 - t;
  const a = clamp(Math.min(d / 0.12, out / 0.12), 0, 1);
  ctx.fx.overlay(tint, 0.62 * a);
  ctx.fx.vignette(0.5 * a);
  const pop = d < 0.2 ? ease.outBack(clamp(d / 0.2, 0, 1)) : 1;
  const lines = wrap(`“${quote}”`, 19);
  const nl = lines.split('\n').length;
  ctx.fx.text(lines, { y, size, font: 'narr', fill: '#ffffff', stroke: '#000000', line: 10, scale: 0.6 + 0.4 * pop, alpha: a, rot: -0.02 });
  ctx.fx.text(`— ${by}`, { y: y + (nl * 0.5 + 0.7) * size * 1.05 / 1920, size: size * 0.62, font: 'narr', fill: '#ffe14a', stroke: '#000000', line: 8, alpha: clamp((d - 0.25) / 0.15, 0, 1) * a, rot: -0.02 });
  ctx.caption.hide(true);
  return true;
}

/** "TOP 10 MOST RESPECTFUL MOMENTS — #n" ranking card from t0 (optionally until t1). */
export function top10Card(ctx, n, t0, t1 = Infinity, { title = 'TOP 10 MOST\nRESPECTFUL MOMENTS' } = {}) {
  const t = ctx.t;
  if (t < t0 || t > t1) return false;
  const d = t - t0;
  const slide = ease.outCubic(clamp(d / 0.25, 0, 1));
  ctx.fx.text(title, { y: 0.12 - (1 - slide) * 0.15, size: 92, fill: '#ffffff', stroke: '#000000', bg: 'rgba(200,0,40,0.85)', rot: -0.03 });
  const pop = d < 0.45 ? 0 : ease.outBack(clamp((d - 0.45) / 0.22, 0, 1));
  if (pop > 0) ctx.fx.text(`#${n}`, { y: 0.27, size: 230, fill: '#ffe14a', stroke: '#000000', scale: pop, rot: 0.05 });
  return true;
}
