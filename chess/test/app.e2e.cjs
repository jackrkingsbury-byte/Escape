// End-to-end: a fake "chess site" page is screenshotted, fed to Chess Lens, and the
// read position + Stockfish's answer are checked. Run: node test/app.e2e.cjs  (needs Playwright)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.bin': 'application/octet-stream' };

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(0, () => r(srv)));
}

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

const CASES = [
  // scholar's mate threat: white to move mates with Qxf7#
  { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', flip: false, theme: ['#f0d9b5', '#b58863'], turn: 'w', best: 'Qxf7#' },
  // black at the bottom, black to move: back-rank mate with Rd1#
  { fen: '3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1', flip: true, theme: ['#eeeed2', '#769656'], turn: 'b', best: 'Rd1#', setTurn: 'b' },
  // white at the bottom but white just played e4 (highlighted) → black to move, read from the highlight
  { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', flip: false, theme: ['#dee3e6', '#8ca2ad'], hl: ['e2', 'e4'], turn: 'b', why: 'last-move highlight' },
];

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch();
  let failed = 0;
  try {
    for (const tc of CASES) {
      const site = await browser.newPage({ viewport: { width: 1280, height: 760 } });
      await site.route('**/site.html', (r) => r.fulfill({ contentType: 'text/html', body: SITE(tc.fen, tc.flip, tc.theme, tc.hl) }));
      await site.goto(base + '/site.html');
      await site.waitForFunction(() => document.title === 'ready');
      const shot = await site.screenshot();
      await site.close();

      const app = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      app.on('pageerror', (e) => errors.push(e.message));
      await app.goto(base + '/index.html');
      await app.waitForFunction(() => document.getElementById('engineChip').textContent.includes('ready'), null, { timeout: 60000 });
      await app.evaluate(() => { document.querySelector('#timeSeg button[data-v="1000"]').click(); });
      await app.setInputFiles('#fileInput', { name: 'shot.png', mimeType: 'image/png', buffer: shot });
      await app.waitForFunction(() => /Depth \d+/.test(document.getElementById('statusText').textContent) || document.getElementById('status').classList.contains('bad'), null, { timeout: 60000 });
      if (tc.setTurn) {
        const st = await app.evaluate(() => window.__chessLens.S.turn);
        if (st !== tc.setTurn) {
          await app.click(tc.setTurn === 'w' ? '#turnW' : '#turnB');
          await app.waitForFunction(() => /Depth \d+/.test(document.getElementById('statusText').textContent), null, { timeout: 60000 });
        }
      }
      const got = await app.evaluate(() => {
        const S = window.__chessLens.S;
        return { board: S.board.map((r) => r.map((c) => c || '.').join('')).join('/'), orientation: S.orientation, turn: S.turn, why: S.turnWhy, best: document.getElementById('bestMove').textContent, status: document.getElementById('statusText').textContent };
      });
      const want = tc.fen.split(' ')[0].split('/').map((r) => r.replace(/\d/g, (d) => '.'.repeat(+d))).join('/');
      const ok = got.board === want && (!tc.best || got.best === tc.best) && got.turn === tc.turn && (!tc.why || got.why === tc.why) && got.orientation === (tc.flip ? 'black' : 'white') && !errors.length;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${tc.best || tc.why}: read ${got.board === want ? 'exact' : got.board} | orientation ${got.orientation} | turn ${got.turn} | best ${got.best} | ${got.status}${errors.length ? ' | errors: ' + errors.join('; ') : ''}`);
      if (!ok) failed++;
      // Rapid re-analysis (side-to-move toggled three times) must still settle on a finished search.
      for (let i = 0; i < 3; i++) await app.keyboard.press('t');
      await app.waitForFunction(() => /Depth \d+/.test(document.getElementById('statusText').textContent), null, { timeout: 30000 })
        .then(() => console.log('PASS rapid toggling settles'))
        .catch(async () => { failed++; console.log('FAIL rapid toggling: ' + (await app.textContent('#statusText'))); });
      await app.screenshot({ path: path.join(process.env.SHOT_DIR || '/tmp', `chesslens-${(tc.best || tc.why).replace(/\W/g, '')}.png`) });
      await app.close();
    }

    // "Scan screen" path: getDisplayMedia is simulated with a canvas stream showing the fake site,
    // then the screen changes and "Scan again" must read the new position.
    {
      const shots = [];
      for (const tc of CASES.slice(0, 2)) {
        const site = await browser.newPage({ viewport: { width: 1280, height: 760 } });
        await site.route('**/site.html', (r) => r.fulfill({ contentType: 'text/html', body: SITE(tc.fen, tc.flip, tc.theme, tc.hl) }));
        await site.goto(base + '/site.html');
        await site.waitForFunction(() => document.title === 'ready');
        shots.push((await site.screenshot()).toString('base64'));
        await site.close();
      }
      const app = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await app.addInitScript(() => {
        const cv = document.createElement('canvas');
        cv.width = 1280; cv.height = 760;
        window.__showScreen = async (b64) => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + b64;
          await img.decode();
          cv.getContext('2d').drawImage(img, 0, 0);
        };
        let calls = 0;
        window.__captureCalls = () => calls;
        navigator.mediaDevices.getDisplayMedia = async () => {
          calls++;
          const st = cv.captureStream(10);
          // keep frames flowing like a real screen
          setInterval(() => { const c = cv.getContext('2d'); const d = c.getImageData(0, 0, 1, 1); c.putImageData(d, 0, 0); }, 100);
          return st;
        };
      });
      await app.goto(base + '/index.html');
      await app.waitForFunction(() => document.getElementById('engineChip').textContent.includes('ready'), null, { timeout: 60000 });
      await app.evaluate(() => { document.querySelector('#timeSeg button[data-v="1000"]').click(); });
      const scanAndRead = async (b64) => {
        await app.evaluate((b) => window.__showScreen(b), b64);
        await app.waitForTimeout(300);
        await app.evaluate(() => { window.__chessLens.S.analysis = null; document.getElementById('statusText').textContent = ''; });
        await app.click('#scanBtn');
        await app.waitForFunction(() => /Depth \d+/.test(document.getElementById('statusText').textContent), null, { timeout: 60000 });
        return app.evaluate(() => ({ best: document.getElementById('bestMove').textContent, label: document.getElementById('scanLabel').textContent, calls: window.__captureCalls() }));
      };
      const a = await scanAndRead(shots[0]);
      const b = await scanAndRead(shots[1]);
      const ok = a.best === CASES[0].best && b.best === CASES[1].best && b.calls === 1 && b.label === 'Scan again';
      console.log(`${ok ? 'PASS' : 'FAIL'} scan screen: first ${a.best}, rescan ${b.best}, capture prompts ${b.calls}, button "${b.label}"`);
      if (!ok) failed++;
      await app.close();
    }

    // Learning from fixes: correct a square, scan the same picture again, the fix is remembered.
    {
      const tc = CASES[0];
      const site = await browser.newPage({ viewport: { width: 1280, height: 760 } });
      await site.route('**/site.html', (r) => r.fulfill({ contentType: 'text/html', body: SITE(tc.fen, tc.flip, tc.theme, tc.hl) }));
      await site.goto(base + '/site.html');
      await site.waitForFunction(() => document.title === 'ready');
      const shot = await site.screenshot();
      await site.close();
      const app = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await app.goto(base + '/index.html');
      await app.waitForFunction(() => document.getElementById('engineChip').textContent.includes('ready'), null, { timeout: 60000 });
      await app.evaluate(() => { document.querySelector('#timeSeg button[data-v="1000"]').click(); });
      const load = async () => {
        await app.evaluate(() => { document.getElementById('statusText').textContent = ''; });
        await app.setInputFiles('#fileInput', { name: 'shot.png', mimeType: 'image/png', buffer: shot });
        await app.waitForFunction(() => /Depth \d+/.test(document.getElementById('statusText').textContent), null, { timeout: 60000 });
      };
      await load();
      await app.keyboard.press('e');
      await app.click('#board rect[data-sq="f6"]');
      await app.click('.picker button[data-ch="b"]');
      await app.waitForFunction(() => /Depth \d+/.test(document.getElementById('statusText').textContent), null, { timeout: 60000 });
      const learned = await app.evaluate(() => window.__chessLens.S.memory.length);
      await app.keyboard.press('e');
      await load();
      const after = await app.evaluate(() => ({ f6: window.__chessLens.S.board[2][5], recalled: window.__chessLens.S.recalled, status: document.getElementById('statusText').textContent }));
      await app.click('#forgetBtn');
      const forgot = await app.evaluate(() => window.__chessLens.S.memory.length);
      const ok = learned > 10 && after.f6 === 'b' && after.recalled >= 1 && forgot === 0;
      console.log(`${ok ? 'PASS' : 'FAIL'} learning: remembered ${learned} pieces, rescan f6=${after.f6}, recalled ${after.recalled}, after forget ${forgot} | ${after.status}`);
      if (!ok) failed++;
      await app.close();
    }

    // Installable app: the service worker caches everything, so a reload works offline.
    {
      const ctx = await browser.newContext();
      const app = await ctx.newPage();
      await app.goto(base + '/index.html');
      await app.evaluate(async () => { await navigator.serviceWorker.ready; });
      await app.waitForFunction(async () => (await (await caches.open('chesslens-v1')).keys()).length >= 14, null, { timeout: 60000 });
      await ctx.setOffline(true);
      await app.reload();
      const ok = await app.waitForFunction(() => document.getElementById('engineChip').textContent.includes('ready'), null, { timeout: 60000 }).then(() => true, () => false);
      const manifest = await app.evaluate(async () => (await fetch('manifest.webmanifest')).json()).catch(() => null);
      console.log(`${ok && manifest ? 'PASS' : 'FAIL'} offline reload: engine ${ok ? 'ready' : 'missing'}, manifest ${manifest ? manifest.short_name : 'missing'}`);
      if (!ok || !manifest) failed++;
      await ctx.close();
    }
  } finally {
    await browser.close();
    srv.close();
  }
  process.exitCode = failed ? 1 : 0;
})();
