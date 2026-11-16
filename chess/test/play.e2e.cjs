// Play vs Stockfish, in a real browser: tap and drag moves, Stockfish replies, hints, coach
// ratings, take back, checkmate, promotion, playing Black, resume after reload.
// Run: node test/play.e2e.cjs   (needs Playwright)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.bin': 'application/octet-stream', '.webmanifest': 'application/manifest+json' };

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

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch();
  let failed = 0;
  const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failed++; };
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const center = async (sq) => {
    const box = await page.locator('#board').boundingBox();
    const o = await page.evaluate(() => window.__play.S.orientation);
    let f = 'abcdefgh'.indexOf(sq[0]), r = 8 - +sq[1];
    if (o === 'black') { f = 7 - f; r = 7 - r; }
    return { x: box.x + (f + 0.5) * box.width / 8, y: box.y + (r + 0.5) * box.height / 8 };
  };
  const tap = async (sq) => { const c = await center(sq); await page.mouse.click(c.x, c.y); };
  const drag = async (a, b) => {
    const p = await center(a), q = await center(b);
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    await page.mouse.move((p.x + q.x) / 2, (p.y + q.y) / 2, { steps: 4 });
    await page.mouse.move(q.x, q.y, { steps: 4 }); await page.mouse.up();
  };
  const plies = () => page.evaluate(() => window.__play.game.history().length);
  const waitPlies = (n) => page.waitForFunction((k) => window.__play.game.history().length >= k && !window.__play.S.thinking, n, { timeout: 30000 });
  const open = async (url) => {
    await page.goto(base + url);
    await page.waitForFunction(() => window.__play && window.__play.S.ready && /Your move|thinking|win|Draw|Checkmate/i.test(document.getElementById('status').textContent), null, { timeout: 60000 });
  };

  try {
    // fresh start: Beginner level, play White
    await page.goto(base + 'play.html');
    await page.evaluate(() => localStorage.clear());
    await open('play.html');
    await page.locator('#level').fill('1');
    await page.click('#colorSeg button[data-v="w"]');
    await page.click('#newBtn');
    await page.waitForFunction(() => /Your move/.test(document.getElementById('status').textContent));

    // tap-to-move e2 → e4, Stockfish answers
    await tap('e2');
    const dots = await page.locator('#board circle').count();
    await tap('e4');
    await waitPlies(2);
    const h1 = await page.evaluate(() => window.__play.game.history());
    check(dots === 2 && h1[0] === 'e4' && h1.length === 2, `tap to move: e2 showed ${dots} move dots, played ${h1[0]}, Stockfish answered ${h1[1]}`);

    // drag-and-drop Ng1 → f3
    await drag('g1', 'f3');
    await waitPlies(4);
    const h2 = await page.evaluate(() => window.__play.game.history());
    check(h2[2] === 'Nf3' && h2.length === 4, `drag and drop: ${h2[2]}, Stockfish answered ${h2[3]}`);

    // illegal move is refused
    const beforeIllegal = await plies();
    await drag('f3', 'f6');
    await page.waitForTimeout(300);
    check(await plies() === beforeIllegal, 'an illegal drag (Nf3→f6) is refused');

    // hint: piece first, then the move with an arrow
    await page.click('#hintBtn');
    await page.waitForFunction(() => /look at your/.test(document.getElementById('hintText').textContent), null, { timeout: 15000 });
    const hintA = await page.textContent('#hintText');
    await page.click('#hintBtn');
    await page.waitForFunction(() => /^Hint: \S+ —/.test(document.getElementById('hintText').textContent), null, { timeout: 15000 });
    const hintB = await page.textContent('#hintText');
    const arrow = await page.locator('#board polygon[fill="#4a90d9"]').count();
    check(arrow === 1, `hint: “${hintA.split('.')[0]}” then “${hintB}” with an arrow on the board`);

    // coach rates moves: a blunder…
    await open('play.html?fen=' + encodeURIComponent('4k3/8/8/3q4/8/8/8/3QK3 w - - 0 1'));
    await tap('e1'); await tap('f2'); // Kf2?? leaves the queen to be taken; Qxd5 wins Black's queen
    await page.waitForFunction(() => window.__play.S.labels[0], null, { timeout: 30000 });
    const blunder = await page.evaluate(() => ({ q: window.__play.S.labels[0], coach: document.getElementById('coach').textContent }));
    check(blunder.q === 'blunder' && /Better was Qxd5/.test(blunder.coach), `coach: Kf2 rated “${blunder.q}” — ${blunder.coach.trim()}`);

    // …and the best move
    await open('play.html?fen=' + encodeURIComponent('4k3/8/8/3q4/8/8/8/3QK3 w - - 0 1'));
    await tap('d1'); await tap('d5');
    await page.waitForFunction(() => window.__play.S.labels[0], null, { timeout: 30000 });
    const best = await page.evaluate(() => window.__play.S.labels[0]);
    check(best === 'best', `coach: Qxd5 rated “${best}”`);

    // take back: undoes Stockfish's reply and your move
    await waitPlies(2);
    await page.click('#undoBtn');
    await page.waitForTimeout(200);
    const afterUndo = await page.evaluate(() => ({ n: window.__play.game.history().length, labels: window.__play.S.labels.length, turn: window.__play.game.turn() }));
    check(afterUndo.n === 0 && afterUndo.labels === 0 && afterUndo.turn === 'w', `take back: back to the start (${afterUndo.n} moves, your turn)`);

    // checkmate
    await open('play.html?fen=' + encodeURIComponent('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1'));
    await drag('d1', 'd8');
    await page.waitForSelector('#board .result', { timeout: 10000 });
    const result = await page.textContent('#board .result b');
    check(/Checkmate — you win/.test(result), `checkmate: “${result}”`);

    // promotion picker
    await open('play.html?fen=' + encodeURIComponent('8/P6k/8/8/8/8/7K/8 w - - 0 1'));
    await tap('a7'); await tap('a8');
    await page.waitForSelector('#board .cl-promo');
    await page.click('#board .cl-promo button[data-p="n"]');
    await page.waitForTimeout(200);
    const promo = await page.evaluate(() => window.__play.game.history()[0]);
    check(promo === 'a8=N', `promotion: picked a knight → ${promo}`);

    // play Black: Stockfish moves first, board turns around
    await open('play.html');
    await page.click('#colorSeg button[data-v="b"]');
    await page.click('#newBtn');
    await waitPlies(1);
    const asBlack = await page.evaluate(() => ({ n: window.__play.game.history().length, o: window.__play.S.orientation, turn: window.__play.game.turn() }));
    check(asBlack.n === 1 && asBlack.o === 'black' && asBlack.turn === 'b', `play Black: Stockfish opened, board shows Black at the bottom`);

    // resume after reload
    await tap('e7'); await tap('e5');
    await waitPlies(3);
    const movesBefore = await page.evaluate(() => window.__play.game.history().join(' '));
    await open('play.html');
    await page.waitForTimeout(300);
    const movesAfter = await page.evaluate(() => window.__play.game.history().join(' '));
    check(movesAfter === movesBefore, `reload resumes the game: ${movesAfter}`);

    const pgn = await page.evaluate(() => decodeURIComponent(document.getElementById('lichessLink').href.split('/pgn/')[1]));
    check(/\[White "Stockfish 17\.1/.test(pgn) && /\[Black "You"\]/.test(pgn) && pgn.includes(movesAfter.split(' ')[0]), 'PGN for Lichess review has the players and moves');

    // the scan page links here with the scanned position
    const scan = await ctx.newPage();
    await scan.goto(base + 'index.html');
    const nav = await scan.getAttribute('a[href="play.html"]', 'href');
    check(nav === 'play.html', 'scan page links to Play vs Stockfish');
    check(!errors.length, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
  } finally {
    await browser.close();
    srv.close();
  }
  process.exitCode = failed ? 1 : 0;
})();
