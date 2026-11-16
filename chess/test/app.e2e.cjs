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

const { SITE } = require('./fake-site.cjs');

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

    // iPhone shortcut flow: Back Tap → Take Screenshot → Copy to Clipboard → open ?paste=1 → one tap.
    {
      const tc = CASES[0];
      const site = await browser.newPage({ viewport: { width: 1280, height: 760 } });
      await site.route('**/site.html', (r) => r.fulfill({ contentType: 'text/html', body: SITE(tc.fen, tc.flip, tc.theme, tc.hl) }));
      await site.goto(base + '/site.html');
      await site.waitForFunction(() => document.title === 'ready');
      const shot = (await site.screenshot()).toString('base64');
      await site.close();
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        permissions: ['clipboard-read', 'clipboard-write'],
      });
      const app = await ctx.newPage();
      await app.goto(base + '/index.html?paste=1');
      await app.waitForFunction(() => document.getElementById('engineChip').textContent.includes('ready'), null, { timeout: 60000 });
      const before = await app.evaluate(() => ({ btn: !document.getElementById('pasteNow').hidden, ios: document.getElementById('iosHelp').open, url: document.getElementById('pasteUrl').textContent }));
      await app.evaluate(async (b64) => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': new Blob([bytes], { type: 'image/png' }) })]);
      }, shot);
      await app.click('#pasteNow');
      await app.waitForFunction(() => /Depth \d+/.test(document.getElementById('statusText').textContent), null, { timeout: 60000 });
      const best = await app.textContent('#bestMove');
      const ok = before.btn && before.ios && before.url.endsWith('/index.html?paste=1') && best === tc.best;
      console.log(`${ok ? 'PASS' : 'FAIL'} iPhone shortcut: “Read screenshot” shown ${before.btn}, iPhone steps open ${before.ios}, pasted → ${best}`);
      if (!ok) failed++;
      await ctx.close();
    }

    // Installable app: the service worker caches everything, so a reload works offline.
    {
      const ctx = await browser.newContext();
      const app = await ctx.newPage();
      await app.goto(base + '/index.html');
      await app.evaluate(async () => { await navigator.serviceWorker.ready; });
      await app.waitForFunction(async () => (await (await caches.open('chesslens-v3')).keys()).length >= 14, null, { timeout: 60000 });
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
