export function money(n: number | null | undefined): string {
  const v = Math.floor(Number(n) || 0);
  return '$' + v.toLocaleString('en-US');
}

export function short(n: number | null | undefined): string {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const units: [number, string][] = [
    [1e15, 'Q'],
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [d, s] of units) {
    if (a >= d) {
      const x = v / d;
      return (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.0+$/, '') + s;
    }
  }
  return Math.floor(v).toString();
}

export const shortMoney = (n: number | null | undefined) => '$' + short(n);

export function perSec(n: number | null | undefined): string {
  const v = Number(n) || 0;
  if (v < 100) return '$' + v.toFixed(v % 1 === 0 ? 0 : 1) + '/s';
  return '$' + (v < 1e6 ? Math.round(v).toLocaleString('en-US') : short(v)) + '/s';
}

export function pct(n: number, digits = 1): string {
  const s = (n > 0 ? '+' : '') + n.toFixed(digits) + '%';
  return s;
}

export function duration(ms: number): string {
  if (ms <= 0) return '0s';
  const s = Math.ceil(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export function ago(iso: string | number, now = Date.now()): string {
  const t = typeof iso === 'number' ? iso : new Date(iso).getTime();
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

export function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export function demandLabel(d: number): { label: string; cls: string } {
  if (d >= 85) return { label: 'EXTREME', cls: 'up' };
  if (d >= 65) return { label: 'HIGH', cls: 'up' };
  if (d >= 35) return { label: 'MEDIUM', cls: 'flat' };
  return { label: 'LOW', cls: 'down' };
}
