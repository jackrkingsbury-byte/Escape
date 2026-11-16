// Android app, minus the Android: runs the app's own Java web server (AssetServer) on a desktop
// JVM and drives the hidden scanner page exactly like ScanService does — window.chessLensScan()
// in, ChessLensAndroid.onResult(json) out. Also checks the in-app page (floating-button switch,
// "Fix in app" reopening the last screenshot).
// Run: node test/android-bridge.e2e.cjs   (needs a JDK and Playwright)
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { SITE } = require('./fake-site.cjs');

const ROOT = path.join(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chesslens-android-'));

function startServer(shot) {
  execFileSync('javac', ['-d', tmp, path.join(ROOT, 'android/src/com/escape/chesslens/AssetServer.java'), path.join(__dirname, 'android/ServeDir.java')], { stdio: 'pipe' });
  const p = spawn('java', ['-cp', tmp, 'ServeDir', ROOT, shot], { stdio: ['pipe', 'pipe', 'inherit'] });
  return new Promise((resolve) => {
    let buf = '';
    const on = (d) => {
      buf += d;
      const m = buf.match(/^(\d+)\n/);
      if (m) { p.stdout.off('data', on); resolve({ proc: p, port: +m[1] }); }
    };
    p.stdout.on('data', on);
  });
}

function setShot(proc, file) {
  return new Promise((resolve) => {
    proc.stdout.once('data', () => resolve());
    proc.stdin.write(file + '\n');
  });
}

const BRIDGE = () => {
  window.__results = [];
  window.__calls = [];
  window.ChessLensAndroid = {
    onResult: (j) => window.__results.push(JSON.parse(j)),
    speak: (t) => window.__calls.push('speak:' + t),
    isOverlayRunning: () => false,
    toggleOverlay: () => window.__calls.push('toggleOverlay'),
  };
};

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failed++; };
  let srv;
  try {
    // two "phone screenshots" of a chess app
    const shots = [];
    for (const [fen, flip] of [['r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', false], ['3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1', true]]) {
      const site = await browser.newPage({ viewport: { width: 1280, height: 760 } });
      await site.route('**/site.html', (r) => r.fulfill({ contentType: 'text/html', body: SITE(fen, flip, ['#f0d9b5', '#b58863']) }));
      await site.route('**/pieces.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(ROOT, 'pieces.js')) }));
      await site.goto('https://fake.site/site.html');
      await site.waitForFunction(() => document.title === 'ready');
      const file = path.join(tmp, `shot${shots.length}.jpg`);
      fs.writeFileSync(file, await site.screenshot({ type: 'jpeg', quality: 93 }));
      if (!shots.length) fs.writeFileSync(path.join(tmp, 'blank.jpg'), await site.screenshot({ type: 'jpeg', clip: { x: 900, y: 40, width: 360, height: 640 } }));
      shots.push(file);
      await site.close();
    }

    srv = await startServer(shots[0]);
    const base = `http://127.0.0.1:${srv.port}/`;

    // content types matter: WebAssembly needs application/wasm
    const ctx = await browser.newContext();
    const probe = await ctx.newPage();
    const wasm = await probe.request.get(base + 'engine/stockfish-17.1-lite-single-03e3232.wasm');
    const missing = await probe.request.get(base + 'nope.js');
    const escape = await probe.request.get(base + '..%2fREADME.md');
    check(wasm.headers()['content-type'] === 'application/wasm' && missing.status() === 404 && escape.status() === 403,
      `AssetServer: wasm ${wasm.headers()['content-type']}, missing → ${missing.status()}, path escape → ${escape.status()}`);
    await probe.close();

    // the hidden scanner page (ScanService)
    const page = await ctx.newPage();
    await page.addInitScript(BRIDGE);
    page.on('pageerror', (e) => { console.log('pageerror', e.message); failed++; });
    await page.goto(base + 'index.html?overlay=1');
    await page.waitForFunction(() => window.__results.some((r) => r.type === 'ready'), null, { timeout: 30000 });
    await page.evaluate(() => { document.querySelector('#timeSeg button[data-v="1000"]').click(); });
    const scan = async (url) => {
      await page.evaluate(() => { window.__results = []; });
      await page.evaluate((u) => window.chessLensScan(u), url);
      await page.waitForFunction(() => window.__results.some((r) => ['done', 'noboard', 'illegal', 'error', 'gameover'].includes(r.type)), null, { timeout: 60000 });
      return page.evaluate(() => window.__results);
    };
    let res = await scan('/shot.jpg?t=1');
    let done = res.find((r) => r.type === 'done');
    check(done && done.best === 'Qxf7#' && res.some((r) => r.type === 'info'),
      `overlay scan 1: ${done ? `${done.best} ${done.eval} — ${done.desc} (${res.filter((r) => r.type === 'info').length} live updates first)` : JSON.stringify(res.slice(-1))}`);

    await setShot(srv.proc, shots[1]);
    res = await scan('/shot.jpg?t=2');
    done = res.find((r) => r.type === 'done');
    check(done && done.best === 'Rd1#' && done.turn === 'b', `overlay scan 2 (flipped board, new screenshot): ${done ? done.best + ' ' + done.eval : JSON.stringify(res.slice(-1))}`);

    // card buttons: "Other side to move" and "Flip board"
    await page.evaluate(() => { window.__results = []; window.chessLensToggleTurn(); });
    await page.waitForFunction(() => window.__results.some((r) => r.type === 'done'), null, { timeout: 60000 });
    done = await page.evaluate(() => window.__results.find((r) => r.type === 'done'));
    check(done && done.turn === 'w', `“Other side to move” re-analyses for ${done && done.turn === 'w' ? 'White' : '?'}: ${done && done.best}`);
    await page.evaluate(() => { window.__results = []; window.chessLensFlip(); });
    await page.waitForFunction(() => window.__results.some((r) => ['done', 'illegal'].includes(r.type)), null, { timeout: 60000 });
    const flipped = await page.evaluate(() => ({ r: window.__results.slice(-1)[0], side: window.__chessLens.S.settings.side }));
    check(flipped.side === 'white' && flipped.r, `“Flip board” re-reads the other way round and remembers the side (${flipped.side}, ${flipped.r.type})`);

    // a picture with no board
    await setShot(srv.proc, path.join(tmp, 'blank.jpg'));
    res = await scan('/shot.jpg?t=3');
    check(res.some((r) => r.type === 'noboard' || r.type === 'illegal'), `no board on screen → ${res.slice(-1)[0].type}`);
    await page.close();

    // the app's main screen
    await setShot(srv.proc, shots[0]);
    const app = await ctx.newPage();
    await app.addInitScript(BRIDGE);
    await app.goto(base + 'index.html?shot=1');
    await app.waitForFunction(() => /Depth \d+/.test(document.getElementById('statusText').textContent), null, { timeout: 60000 });
    const ui = await app.evaluate(() => ({
      best: document.getElementById('bestMove').textContent,
      card: !document.getElementById('androidApp').hidden,
      help: !document.getElementById('phoneHelp').hidden,
      label: document.getElementById('overlayBtn').textContent,
      sw: !!navigator.serviceWorker && !!navigator.serviceWorker.controller,
    }));
    await app.click('#overlayBtn');
    const calls = await app.evaluate(() => window.__calls);
    check(ui.best === 'Qxf7#' && ui.card && !ui.help && calls.includes('toggleOverlay') && !ui.sw,
      `in-app page: “Fix in app” opened the last screenshot (${ui.best}), button “${ui.label}” → ${calls.join(',')}`);
    await ctx.close();
  } finally {
    await browser.close();
    if (srv) srv.proc.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  process.exitCode = failed ? 1 : 0;
})();
