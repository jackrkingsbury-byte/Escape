// A page that looks like a chess site: dark UI, side panels, a board with a highlighted last move.
const SITE = (fen, flip, theme, hl = []) => `<!doctype html><html><head><title>FakeChessSite</title></head>
<body style="margin:0;background:#302e2b;font:14px sans-serif;color:#ccc">
<div style="position:absolute;left:0;top:0;width:180px;height:100%;background:#262421">Play · Puzzles · Learn</div>
<div style="position:absolute;left:230px;top:18px">Opponent (1612)</div>
<canvas id=c width=640 height=640 style="position:absolute;left:230px;top:44px"></canvas>
<div style="position:absolute;left:230px;top:692px">You (1590)</div>
<div style="position:absolute;left:900px;top:44px;width:300px;height:640px;background:#262421;padding:12px">1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6??</div>
<script type=module>
import { PIECE_SVG } from '/pieces.js';
const fen = ${JSON.stringify(fen)}, flip = ${flip}, [L, D] = ${JSON.stringify(theme)}, hl = ${JSON.stringify(hl)};
const ctx = document.getElementById('c').getContext('2d');
const s = 80;
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { ctx.fillStyle = (x + y) % 2 ? D : L; ctx.fillRect(x * s, y * s, s, s); }
for (const sq of hl) { const f = 'abcdefgh'.indexOf(sq[0]), r = 8 - +sq[1]; const [x, y] = flip ? [7 - f, 7 - r] : [f, r]; ctx.fillStyle = 'rgba(255,255,51,0.5)'; ctx.fillRect(x * s, y * s, s, s); }
const rows = fen.split(' ')[0].split('/');
const jobs = [];
rows.forEach((row, r) => { let f = 0; for (const ch of row) { if (/\\d/.test(ch)) { f += +ch; continue; }
  const [x, y] = flip ? [7 - f, 7 - r] : [f, r];
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PIECE_SVG[ch]);
  jobs.push(img.decode().then(() => ctx.drawImage(img, x * s, y * s, s, s))); f++; } });
// coordinates like real sites
ctx.font = 'bold 14px sans-serif';
for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? L : D; ctx.fillText('abcdefgh'[flip ? 7 - i : i], i * s + 68, 636); ctx.fillText(String(flip ? i + 1 : 8 - i), 3, i * s + 15); }
Promise.all(jobs).then(() => { document.title = 'ready'; });
</script></body></html>`;

module.exports = { SITE };
