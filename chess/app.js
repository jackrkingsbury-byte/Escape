// Chess Lens — screen/screenshot → board → Stockfish best move.
import { detectBoard, warpBoard, loadModel, classifyBoard, readPosition, toFen, LABELS } from './vision.js';
import { Engine } from './engine.js';
import { PIECE_SVG } from './pieces.js';
import { Chess } from './vendor/chess.js';

const $ = (id) => document.getElementById(id);
const ENGINE_URL = 'engine/stockfish-17.1-lite-single-03e3232.js';
const FILES = 'abcdefgh';
const NAMES = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };

/* ------------------------------------------------------------------ state */

const store = {
  get(k, d) { try { const v = localStorage.getItem('chesslens.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('chesslens.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const S = {
  settings: { time: 3000, pv: 3, side: 'auto', voice: 'off', ...store.get('settings', {}) },
  model: null,
  engine: new Engine(ENGINE_URL),
  stream: null,
  image: null,       // ImageData of the last screenshot
  quad: null,        // board corners in image pixels
  cells: null,       // classifier output
  board: null,       // board[r][f], r=0 → rank 8
  conf: null,
  orientation: 'white',
  turn: 'w',
  turnWhy: '',
  lastMove: null,
  analysis: null,    // { fen, lines, best, done }
  editing: false,
  runId: 0,
};

/* ------------------------------------------------------------------ boot */

const modelReady = fetch('model.bin').then((r) => {
  if (!r.ok) throw new Error('model.bin ' + r.status);
  return r.arrayBuffer();
}).then((b) => { S.model = loadModel(b); S.modelKey = 'm' + b.byteLength; loadMemory(); renderMemory(); });

S.engine.start().then(() => {
  $('engineChip').textContent = 'Stockfish 17.1 ready';
  $('engineChip').title = S.engine.name;
}).catch(() => { $('engineChip').textContent = 'Engine failed'; });
S.engine.on((m) => {
  if (m.type === 'error') { $('engineChip').textContent = 'Engine failed'; setStatus('Could not start Stockfish: ' + m.message, 'bad'); }
  if (m.type === 'info' && S.analysis && m.id === S.analysis.id) { S.analysis.lines = m.lines; renderAnalysis(); }
});

if ('serviceWorker' in navigator && location.protocol !== 'file:' && !window.ChessLensAndroid) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
let installEvt = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; $('installBtn').hidden = false; });
$('installBtn').onclick = async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; $('installBtn').hidden = true; };

/* --------------------------------------------------------------- capture */

const canCapture = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

/* ------------------------------------------------- phones: Android app + iPhone shortcut */
// Inside the Android app the page talks to native code through window.ChessLensAndroid.
// The app's floating "Scan" button runs a hidden copy of this page with ?overlay=1:
// native code calls window.chessLensScan(url) with a fresh screenshot and gets results
// back through ChessLensAndroid.onResult(json).
const PARAMS = new URLSearchParams(location.search);
const bridge = window.ChessLensAndroid || null;
const OVERLAY = PARAMS.has('overlay') && !!bridge;
const IN_ANDROID_APP = !!bridge;
const IS_ANDROID = /Android/i.test(navigator.userAgent);
const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function report(obj) {
  if (!bridge || !bridge.onResult) return;
  try { bridge.onResult(JSON.stringify(obj)); } catch { /* native side gone */ }
}

window.chessLensScan = async (url) => {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('screenshot ' + res.status);
    await processImage(await blobToImageData(await res.blob()));
  } catch (e) {
    report({ type: 'error', message: String(e && e.message || e) });
  }
};
if (!canCapture) {
  $('scanLabel').textContent = 'Open screenshot';
  $('scanHint').innerHTML = 'Screen capture isn\'t available in this browser. Take a screenshot, then <b>Open image</b> or <b>Paste</b> it here.';
}

async function ensureStream() {
  if (S.stream && S.stream.active) return;
  S.stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { ideal: 5 }, cursor: 'never' },
    audio: false,
    selfBrowserSurface: 'exclude',
    surfaceSwitching: 'include',
  });
  const v = $('video');
  v.srcObject = S.stream;
  await v.play();
  S.stream.getVideoTracks()[0].addEventListener('ended', () => { S.stream = null; updateScanLabel(); });
  updateScanLabel();
}

function updateScanLabel() {
  if (!canCapture) return;
  $('scanLabel').textContent = S.stream ? 'Scan again' : 'Scan screen';
}

async function grabFrame() {
  const track = S.stream.getVideoTracks()[0];
  // Sharing the whole screen can include this window: hide our own boards for a moment so
  // the scan can't pick them up instead of the real one.
  const whole = (track.getSettings().displaySurface || 'monitor') === 'monitor';
  if (whole) {
    document.body.classList.add('capturing');
    await nextFrame(); await nextFrame();
    await new Promise((r) => setTimeout(r, 150));
  }
  try {
    return await grabFrameNow(track);
  } finally {
    document.body.classList.remove('capturing');
  }
}

// Take the current picture of the shared screen. A screen share only sends a new frame when
// something changes, so never wait for one: give a fresh frame a moment to arrive, then use the
// latest frame the video element is already showing.
async function grabFrameNow(track) {
  const v = $('video');
  if (v.paused) { try { await v.play(); } catch { /* keeps last frame */ } }
  await new Promise((r) => {
    const t = setTimeout(r, 300);
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(() => { clearTimeout(t); r(); });
  });
  if (v.videoWidth) return bitmapToImageData(v, v.videoWidth, v.videoHeight);
  // video not ready yet (very first scan): ask the track directly, but don't hang on a still screen
  if ('ImageCapture' in window) {
    const bmp = await Promise.race([
      new ImageCapture(track).grabFrame().catch(() => null),
      new Promise((r) => setTimeout(() => r(null), 3000)),
    ]);
    if (bmp) return bitmapToImageData(bmp);
  }
  throw new Error('the shared screen has not sent a picture yet — try again');
}

function bitmapToImageData(src, w = src.width, h = src.height) {
  const max = 3200;
  const k = Math.min(1, max / Math.max(w, h));
  const cw = Math.round(w * k), ch = Math.round(h * k);
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, cw, ch);
  return ctx.getImageData(0, 0, cw, ch);
}

async function blobToImageData(blob) {
  const bmp = await createImageBitmap(blob);
  return bitmapToImageData(bmp);
}

async function scanScreen() {
  if (!canCapture) { $('fileInput').click(); return; }
  try {
    await ensureStream();
  } catch (e) {
    if (e && e.name === 'NotAllowedError') setStatus('Screen sharing was cancelled.', 'warn');
    else setStatus('Screen capture failed: ' + (e && e.message), 'bad');
    return;
  }
  setStatus('Capturing…', 'busy');
  let img;
  try {
    img = await grabFrame();
  } catch (e) {
    setStatus('Could not read the shared screen: ' + (e && e.message), 'warn');
    return;
  }
  await processImage(img);
}

/* ------------------------------------------------------------- pipeline */

async function processImage(img, quad = null) {
  const run = ++S.runId;
  S.image = img;
  setStatus('Finding the board…', 'busy');
  await nextFrame();
  if (!quad) {
    const det = detectBoard(img);
    if (!det) {
      const s = Math.min(img.width, img.height) * 0.6;
      S.quad = [[(img.width - s) / 2, (img.height - s) / 2], [(img.width + s) / 2, (img.height - s) / 2], [(img.width + s) / 2, (img.height + s) / 2], [(img.width - s) / 2, (img.height + s) / 2]];
      showShot();
      setStatus('No chessboard found. Drag the green corners onto the board, or try a closer screenshot.', 'warn');
      report({ type: 'noboard' });
      return;
    }
    quad = det.quad;
  }
  S.quad = quad;
  showShot();
  setStatus('Reading the pieces…', 'busy');
  await nextFrame();
  await modelReady;
  if (run !== S.runId) return;
  const rgb = warpBoard(img, quad);
  S.cells = classifyBoard(S.model, rgb);
  S.recalled = recall(S.cells);
  const side = S.settings.side;
  const pos = readPosition(S.cells, rgb, { orientation: side === 'auto' ? 'auto' : side });
  S.orientation = pos.orientation;
  S.board = pos.board;
  S.conf = pos.conf;
  S.lastMove = pos.lastMove;
  S.turn = pos.turn;
  S.turnWhy = pos.turnWhy;
  repair();
  render();
  analyse();
}

// Use probabilities to make the position legal where the picture was ambiguous:
// one king per side, no pawns on the first/last rank.
function repair() {
  if (!S.cells) return;
  const at = (r, f) => {
    const [rr, ff] = S.orientation === 'black' ? [7 - r, 7 - f] : [r, f];
    return S.cells[rr * 8 + ff];
  };
  const fixes = [];
  const relabel = (r, f, banned) => {
    const c = at(r, f);
    const order = c.probs.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]);
    const pick = order.find(([, i]) => !banned.includes(LABELS[i]));
    S.board[r][f] = LABELS[pick[1]];
    S.conf[r][f] = Math.min(S.conf[r][f], 0.5);
    fixes.push(FILES[f] + (8 - r));
  };
  for (let r of [0, 7]) for (let f = 0; f < 8; f++) if ('Pp'.includes(S.board[r][f]) && S.board[r][f]) relabel(r, f, ['P', 'p']);
  const byKing = (k) => {
    const sq = [];
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) sq.push([at(r, f).probs[LABELS.indexOf(k)], r, f]);
    return sq.sort((a, b) => b[0] - a[0]);
  };
  // keep the most king-like of each colour; extra "kings" become their best non-king reading
  for (const k of ['K', 'k']) {
    const have = byKing(k).filter(([, r, f]) => S.board[r][f] === k);
    have.slice(1).forEach(([, r, f]) => relabel(r, f, ['K', 'k']));
  }
  // a missing king is most likely the square that looked most like one
  for (const k of ['K', 'k']) {
    if (S.board.some((row) => row.includes(k))) continue;
    const best = byKing(k).find(([, r, f]) => !'Kk'.includes(S.board[r][f]) || !S.board[r][f]);
    if (best && best[0] > 0.02) {
      const [, r, f] = best;
      S.board[r][f] = k;
      S.conf[r][f] = Math.min(S.conf[r][f], 0.5);
      fixes.push(FILES[f] + (8 - r));
    }
  }
  S.fixes = fixes;
}

function currentFen() { return toFen(S.board, S.turn); }

function checkPosition(fen) {
  let g;
  try { g = new Chess(fen); } catch (e) { return { ok: false, why: e.message.replace(/^Invalid FEN: /, '') }; }
  // The side that just moved can't be in check.
  const other = fen.replace(/ ([wb]) /, (m, t) => ` ${t === 'w' ? 'b' : 'w'} `);
  try { if (new Chess(other).inCheck() && g.inCheck()) return { ok: false, why: 'both kings are in check' }; } catch { /* other side invalid: fine */ }
  try { if (new Chess(other).inCheck()) return { ok: false, flip: true }; } catch { /* ignore */ }
  return { ok: true, game: g };
}

async function analyse() {
  if (!S.board) return;
  let fen = currentFen();
  let chk = checkPosition(fen);
  if (chk.flip) {
    S.turn = S.turn === 'w' ? 'b' : 'w';
    S.turnWhy = 'the other king is in check';
    fen = currentFen();
    chk = checkPosition(fen);
    renderTurn();
  }
  S.analysis = null;
  renderAnalysis();
  $('links').hidden = false;
  $('lichessLink').href = 'https://lichess.org/analysis/standard/' + fen.replace(/ /g, '_');
  if (!chk.ok) {
    S.engine.latest = -1;
    S.engine.stop();
    setStatus(`That position isn't legal (${chk.why || 'check the pieces'}). Tap “Fix squares” and correct the highlighted ones.`, 'bad');
    report({ type: 'illegal', why: chk.why || 'check the pieces', fen });
    return;
  }
  const g = chk.game;
  if (g.isGameOver()) {
    S.engine.latest = -1;
    S.engine.stop();
    $('bestMove').textContent = g.isCheckmate() ? 'Checkmate' : 'Draw';
    $('bestSub').textContent = g.isCheckmate() ? `${S.turn === 'w' ? 'White' : 'Black'} is mated.` : 'No legal moves — stalemate or a dead position.';
    setStatus('Game over in this position.', '');
    report({ type: 'gameover', text: $('bestMove').textContent + ' — ' + $('bestSub').textContent, fen });
    return;
  }
  const doubt = countDoubtful();
  const why = S.turnWhy && S.turnWhy !== 'chosen' ? ` (${S.turnWhy})` : '';
  setStatus(`Thinking… ${S.turn === 'w' ? 'White' : 'Black'} to move${why}.`, 'busy');
  const job = S.engine.analyse(fen, { movetime: S.settings.time, multipv: S.settings.pv });
  S.analysis = { id: job.id, fen, lines: [], done: false };
  const res = await job;
  if (res.stale || !S.analysis || S.analysis.id !== res.id) return;
  S.analysis.done = true;
  S.analysis.lines = res.lines.length ? res.lines : S.analysis.lines;
  renderAnalysis();
  const top = S.analysis.lines[0];
  const msg = [`Depth ${top ? top.depth : '?'} · ${S.turn === 'w' ? 'White' : 'Black'} to move${why}.`];
  if (S.fixes && S.fixes.length) msg.push(`Auto-corrected ${S.fixes.join(', ')}.`);
  if (S.recalled) msg.push(`${S.recalled} square${S.recalled > 1 ? 's' : ''} read using your earlier fixes.`);
  if (doubt) msg.push(`${doubt} square${doubt > 1 ? 's' : ''} looked unclear (outlined) — check them.`);
  setStatus(msg.join(' '), doubt ? 'warn' : '');
  if (top) report(resultPayload('done'));
  if (S.settings.voice === 'on' && top) speak(top);
}

function countDoubtful() {
  let n = 0;
  if (!S.conf) return 0;
  for (const row of S.conf) for (const c of row) if (c < 0.7) n++;
  return n;
}

/* ------------------------------------------------ learning from fixes */
// When you fix a square, every piece on that board is remembered (its CNN feature vector + the
// label you confirmed). Later scans that look almost the same take the remembered label — so a
// piece style the model finds hard gets read right after you've corrected it once.

const MEM_MAX = 400, MEM_SIM = 0.88;
S.memory = [];

function loadMemory() {
  const m = store.get('memory', null);
  S.memory = m && m.key === S.modelKey ? m.items.map((it) => ({ l: it.l, f: Int8Array.from(atob(it.f), (c) => (c.charCodeAt(0) << 24) >> 24) })) : [];
}

function saveMemory() {
  const items = S.memory.map((it) => ({ l: it.l, f: btoa(String.fromCharCode(...new Uint8Array(it.f.buffer))) }));
  store.set('memory', { key: S.modelKey, items });
  renderMemory();
}

function unit(feat) {
  let n = 0;
  for (const v of feat) n += v * v;
  n = Math.sqrt(n) || 1;
  return Int8Array.from(feat, (v) => Math.round((v / n) * 127));
}

function cellAt(r, f) {
  const [rr, ff] = S.orientation === 'black' ? [7 - r, 7 - f] : [r, f];
  return S.cells[rr * 8 + ff];
}

function learn() {
  if (!S.cells || !S.modelKey) return;
  const fresh = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const c = cellAt(r, f);
      if (c.feat && S.board[r][f]) fresh.push({ l: LABELS.indexOf(S.board[r][f]), f: unit(c.feat) });
    }
  }
  // replace what we remembered from this same scan, keep the rest (newest last)
  S.memory = S.memory.filter((m) => m.scan !== S.runId).concat(fresh.map((m) => ({ ...m, scan: S.runId })));
  if (S.memory.length > MEM_MAX) S.memory = S.memory.slice(-MEM_MAX);
  saveMemory();
}

function recall(cells) {
  if (!S.memory.length) return 0;
  let n = 0;
  for (const c of cells) {
    if (!c.feat || c.label === 0) continue;
    const u = unit(c.feat);
    let best = -1, lab = 0;
    for (const m of S.memory) {
      let d = 0;
      for (let k = 0; k < u.length; k++) d += u[k] * m.f[k];
      if (d > best) { best = d; lab = m.l; }
    }
    if (best / (127 * 127) > MEM_SIM && lab !== c.label) {
      c.probs = c.probs.map((p, i) => (i === lab ? 0.9 : p * 0.1));
      c.label = lab;
      c.conf = 0.9;
      n++;
    }
  }
  return n;
}

function renderMemory() {
  const n = S.memory.length;
  $('memText').textContent = n ? `${n} piece${n > 1 ? 's' : ''} learned from your fixes` : 'Fix a square once and similar pieces are read right next time.';
  $('forgetBtn').hidden = !n;
}

/* ----------------------------------------------------------- formatting */

function sanLine(fen, pv, max = 14) {
  const g = new Chess(fen);
  const out = [];
  for (const u of pv.slice(0, max)) {
    try {
      const m = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      out.push(m);
    } catch { break; }
  }
  return out;
}

function fmtScore(score, turn) {
  if (!score) return '';
  const sgn = turn === 'w' ? 1 : -1;
  if (score.type === 'mate') {
    const v = score.value * sgn;
    return v === 0 ? '#' : (v > 0 ? '+M' : '−M') + Math.abs(v);
  }
  const v = (score.value * sgn) / 100;
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
}

function whiteShare(score, turn) {
  if (!score) return 0.5;
  const sgn = turn === 'w' ? 1 : -1;
  if (score.type === 'mate') return score.value * sgn > 0 ? 1 : score.value * sgn < 0 ? 0 : (turn === 'w' ? 0 : 1);
  const cp = score.value * sgn;
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}

function describe(m) {
  if (m.san.startsWith('O-O-O')) return 'Castle queenside';
  if (m.san.startsWith('O-O')) return 'Castle kingside';
  const name = NAMES[m.piece];
  let s = `${name} ${m.from} ${m.captured ? '× ' : '→ '}${m.to}`;
  if (m.captured) s += ` (takes ${NAMES[m.captured].toLowerCase()})`;
  if (m.promotion) s += `, promotes to ${NAMES[m.promotion].toLowerCase()}`;
  if (m.san.endsWith('#')) s += ' — checkmate';
  else if (m.san.endsWith('+')) s += ', check';
  return s;
}

function spokenText(line) {
  const [m] = sanLine(S.analysis.fen, line.pv, 1);
  if (!m) return '';
  let s;
  if (m.san.startsWith('O-O-O')) s = 'Castle queen side';
  else if (m.san.startsWith('O-O')) s = 'Castle king side';
  else s = `${NAMES[m.piece]} ${m.captured ? 'takes' : 'to'} ${m.to.toUpperCase().split('').join(' ')}`;
  if (m.promotion) s += `, promote to ${NAMES[m.promotion]}`;
  if (m.san.endsWith('#')) s += ', checkmate';
  else if (m.san.endsWith('+')) s += ', check';
  return s;
}

function speak(line) {
  const s = spokenText(line);
  if (!s) return;
  if (bridge && bridge.speak) { try { bridge.speak(s); } catch { /* ignore */ } return; }
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(s));
}

// Compact result for the Android floating card.
function resultPayload(type) {
  const a = S.analysis;
  const top = a && a.lines[0];
  if (!top) return { type };
  const [m] = sanLine(a.fen, top.pv, 1);
  const lines = a.lines.filter(Boolean).map((l) => {
    const ms = sanLine(a.fen, l.pv, 6);
    return `${fmtScore(l.score, S.turn)}  ${ms.map((x) => x.san).join(' ')}`;
  });
  return {
    type,
    best: m ? m.san : '',
    desc: m ? describe(m) : '',
    eval: fmtScore(top.score, S.turn),
    depth: top.depth,
    turn: S.turn,
    turnWhy: S.turnWhy,
    lines,
    fen: a.fen,
    doubt: countDoubtful(),
    fixes: (S.fixes || []).length,
  };
}

/* --------------------------------------------------------------- render */

const SQ_LIGHT = '#ebecd0', SQ_DARK = '#739552';
const pieceImg = (ch) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PIECE_SVG[ch]);

function squareXY(sq) {
  const f = FILES.indexOf(sq[0]), r = 8 - +sq[1];
  return S.orientation === 'black' ? [7 - f, 7 - r] : [f, r];
}

function arrow(from, to, color, width, opacity) {
  const [x0, y0] = squareXY(from).map((v) => v + 0.5);
  const [x1, y1] = squareXY(to).map((v) => v + 0.5);
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const head = 0.42, hw = width * 2.3;
  const ex = x1 - ux * head, ey = y1 - uy * head;
  const sx = x0 + ux * 0.18, sy = y0 + uy * 0.18;
  const px = -uy, py = ux;
  return `<g opacity="${opacity}"><line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>` +
    `<polygon points="${x1 - ux * 0.08},${y1 - uy * 0.08} ${ex + px * hw / 2},${ey + py * hw / 2} ${ex - px * hw / 2},${ey - py * hw / 2}" fill="${color}"/></g>`;
}

function renderBoard() {
  const el = $('board');
  const b = S.board || startBoard();
  let svg = `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">`;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const [r, f] = S.orientation === 'black' ? [7 - y, 7 - x] : [y, x];
      svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${(x + y) % 2 ? SQ_DARK : SQ_LIGHT}" data-sq="${FILES[f]}${8 - r}"/>`;
    }
  }
  if (S.lastMove && S.board) for (const sq of [S.lastMove.from, S.lastMove.to]) {
    const [x, y] = squareXY(sq);
    svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(255,255,51)" opacity=".38" pointer-events="none"/>`;
  }
  // coordinates
  for (let i = 0; i < 8; i++) {
    const file = S.orientation === 'black' ? FILES[7 - i] : FILES[i];
    const rank = S.orientation === 'black' ? i + 1 : 8 - i;
    svg += `<text x="${i + 0.95}" y="7.94" font-size=".19" text-anchor="end" font-family="system-ui,sans-serif" font-weight="700" fill="${i % 2 ? SQ_DARK : SQ_LIGHT}" pointer-events="none">${file}</text>`;
    svg += `<text x=".05" y="${i + 0.21}" font-size=".19" font-family="system-ui,sans-serif" font-weight="700" fill="${i % 2 ? SQ_LIGHT : SQ_DARK}" pointer-events="none">${rank}</text>`;
  }
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const ch = b[r][f];
      const [x, y] = S.orientation === 'black' ? [7 - f, 7 - r] : [f, r];
      if (S.conf && S.board && S.conf[r][f] < 0.7) {
        svg += `<rect x="${x + 0.04}" y="${y + 0.04}" width=".92" height=".92" fill="none" stroke="#f2b33d" stroke-width=".07" stroke-dasharray=".12 .08" pointer-events="none"/>`;
      }
      if (ch) svg += `<image href="${pieceImg(ch)}" x="${x}" y="${y}" width="1" height="1" pointer-events="none"/>`;
    }
  }
  const a = S.analysis;
  if (a && a.lines.length && S.board) {
    a.lines.slice(1).reverse().forEach((l) => {
      if (l && l.pv[0]) svg += arrow(l.pv[0].slice(0, 2), l.pv[0].slice(2, 4), '#4a90d9', 0.1, 0.55);
    });
    const best = a.lines[0];
    if (best && best.pv[0]) svg += arrow(best.pv[0].slice(0, 2), best.pv[0].slice(2, 4), '#15781b', 0.16, 0.85);
  }
  svg += '</svg>';
  el.querySelector('svg')?.remove();
  el.insertAdjacentHTML('afterbegin', svg);
  $('emptyMsg').hidden = !!S.board;
  el.classList.toggle('editing', S.editing);
  $('evalbar').classList.toggle('flipped', S.orientation === 'black');
}

function startBoard() {
  return ['rnbqkbnr', 'pppppppp', '', '', '', '', 'PPPPPPPP', 'RNBQKBNR'].map((r) => (r ? r.split('') : Array(8).fill('')));
}

function renderTurn() {
  $('turnW').setAttribute('aria-pressed', S.turn === 'w');
  $('turnB').setAttribute('aria-pressed', S.turn === 'b');
}

let lastReport = 0;
function renderAnalysis() {
  const a = S.analysis;
  if (OVERLAY && a && a.lines.length && !a.done && performance.now() - lastReport > 250) {
    lastReport = performance.now();
    report(resultPayload('info'));
  }
  const ul = $('lines');
  ul.innerHTML = '';
  if (!a || !a.lines.length) {
    $('bestMove').textContent = a ? '…' : '—';
    $('bestEval').hidden = true;
    $('bestSub').textContent = a ? 'Stockfish is thinking…' : (S.board ? '' : 'Waiting for a position.');
    $('evalfill').style.height = '50%';
    renderBoard();
    return;
  }
  const top = a.lines[0];
  const moves = sanLine(a.fen, top.pv, 1);
  $('bestMove').textContent = moves[0] ? moves[0].san : '—';
  $('bestEval').hidden = false;
  $('bestEval').textContent = fmtScore(top.score, S.turn);
  $('bestSub').textContent = moves[0] ? describe(moves[0]) + (a.done ? '' : ` · depth ${top.depth}`) : '';
  $('evalfill').style.height = (whiteShare(top.score, S.turn) * 100).toFixed(1) + '%';
  const fenMove = 1;
  a.lines.forEach((l, i) => {
    if (!l) return;
    const ms = sanLine(a.fen, l.pv);
    let n = fenMove, txt = '';
    ms.forEach((m, k) => {
      if (m.color === 'w') txt += `${n}. `;
      else if (k === 0) txt += `${n}… `;
      txt += k === 0 ? `<b>${m.san}</b> ` : `${m.san} `;
      if (m.color === 'b') n++;
    });
    const li = document.createElement('li');
    li.innerHTML = `<span class="sc">${fmtScore(l.score, S.turn)}</span><span class="pv">${txt}</span>`;
    li.title = 'Line ' + (i + 1);
    ul.appendChild(li);
  });
  renderBoard();
}

function render() {
  renderTurn();
  renderBoard();
  renderAnalysis();
}

function setStatus(text, kind = '') {
  $('status').className = 'status ' + kind;
  $('statusText').textContent = text;
}

function toast(t) {
  const el = $('toast');
  el.textContent = t;
  el.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('on'), 1600);
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

/* ------------------------------------------------- screenshot + corners */

function showShot() {
  const card = $('shotCard');
  card.hidden = false;
  const img = S.image;
  const cv = $('shotCanvas');
  const k = Math.min(1, 900 / img.width);
  cv.width = Math.round(img.width * k);
  cv.height = Math.round(img.height * k);
  const tmp = document.createElement('canvas');
  tmp.width = img.width; tmp.height = img.height;
  tmp.getContext('2d').putImageData(img, 0, 0);
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tmp, 0, 0, cv.width, cv.height);
  S.shotBase = ctx.getImageData(0, 0, cv.width, cv.height);
  S.shotScale = k;
  drawQuad();
}

function drawQuad() {
  const cv = $('shotCanvas');
  const ctx = cv.getContext('2d');
  ctx.putImageData(S.shotBase, 0, 0);
  const k = S.shotScale;
  const q = S.quad.map(([x, y]) => [x * k, y * k]);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath();
  ctx.rect(0, 0, cv.width, cv.height);
  ctx.moveTo(q[0][0], q[0][1]);
  for (const p of q.slice(1).reverse()) ctx.lineTo(p[0], p[1]);
  ctx.closePath();
  ctx.fill('evenodd');
  ctx.strokeStyle = '#6fbf4a';
  ctx.lineWidth = Math.max(2, cv.width / 300);
  ctx.beginPath();
  q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  // handles
  const shot = $('shot');
  shot.querySelectorAll('.handle').forEach((h) => h.remove());
  q.forEach((p, i) => {
    const h = document.createElement('div');
    h.className = 'handle';
    h.style.left = (p[0] / cv.width) * 100 + '%';
    h.style.top = (p[1] / cv.height) * 100 + '%';
    h.dataset.i = i;
    h.addEventListener('pointerdown', startDrag);
    shot.appendChild(h);
  });
}

function startDrag(e) {
  e.preventDefault();
  const i = +e.target.dataset.i;
  const cv = $('shotCanvas');
  const rect = cv.getBoundingClientRect();
  const move = (ev) => {
    const x = ((ev.clientX - rect.left) / rect.width) * S.image.width;
    const y = ((ev.clientY - rect.top) / rect.height) * S.image.height;
    S.quad[i] = [Math.max(0, Math.min(S.image.width, x)), Math.max(0, Math.min(S.image.height, y))];
    drawQuad();
  };
  const up = () => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    processImage(S.image, S.quad.map((p) => p.slice()));
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
}

/* -------------------------------------------------------------- editing */

function closePicker() { document.querySelector('.picker')?.remove(); }

$('board').addEventListener('click', (e) => {
  if (!S.board) return;
  const target = e.target.closest('[data-sq]');
  if (!S.editing) {
    if (target) { toggleEdit(true); } else return;
  }
  if (!target) return;
  const sq = target.dataset.sq;
  closePicker();
  const pk = document.createElement('div');
  pk.className = 'picker';
  const opts = ['K', 'Q', 'R', 'B', 'N', 'P', '', 'k', 'q', 'r', 'b', 'n', 'p'];
  pk.innerHTML = opts.map((ch) => (ch
    ? `<button data-ch="${ch}" title="${ch === ch.toUpperCase() ? 'White' : 'Black'} ${NAMES[ch.toLowerCase()].toLowerCase()}">${PIECE_SVG[ch]}</button>`
    : '<button data-ch="" class="clear" title="Empty square">✕</button>')).join('');
  const wrap = $('board').getBoundingClientRect();
  const r = target.getBoundingClientRect();
  document.body.appendChild(pk);
  const pw = pk.offsetWidth, ph = pk.offsetHeight;
  let left = r.left + r.width / 2 - pw / 2 + scrollX;
  let top = r.bottom + 6 + scrollY;
  if (r.bottom + ph + 6 > innerHeight) top = r.top - ph - 6 + scrollY;
  left = Math.max(8 + scrollX, Math.min(left, scrollX + document.documentElement.clientWidth - pw - 8));
  pk.style.left = left + 'px';
  pk.style.top = top + 'px';
  void wrap;
  pk.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const f = FILES.indexOf(sq[0]), rr = 8 - +sq[1];
    S.board[rr][f] = btn.dataset.ch;
    S.conf[rr][f] = 1;
    learn();
    S.fixes = [];
    closePicker();
    renderBoard();
    analyse();
  });
  e.stopPropagation();
});
document.addEventListener('click', (e) => { if (!e.target.closest('.picker') && !e.target.closest('#board')) closePicker(); });

function toggleEdit(on = !S.editing) {
  S.editing = on;
  $('editBtn').setAttribute('aria-pressed', on);
  if (!on) closePicker();
  if (on && S.board) setStatus('Tap a square to change its piece. Press E or the button again when done.', '');
  renderBoard();
}

/* --------------------------------------------------------------- inputs */

$('scanBtn').onclick = scanScreen;
$('fileBtn').onclick = () => $('fileInput').click();
$('cameraBtn').onclick = () => $('cameraInput').click();
for (const id of ['fileInput', 'cameraInput']) {
  $(id).onchange = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) processImage(await blobToImageData(f));
  };
}
$('pasteBtn').onclick = async () => {
  try {
    const items = await navigator.clipboard.read();
    for (const it of items) {
      const type = it.types.find((t) => t.startsWith('image/'));
      if (type) { processImage(await blobToImageData(await it.getType(type))); return; }
    }
    toast('No image on the clipboard');
  } catch {
    toast('Press Ctrl+V (⌘V) to paste');
  }
};
addEventListener('paste', async (e) => {
  const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith('image/'));
  if (file) { e.preventDefault(); processImage(await blobToImageData(file)); }
});
let dragDepth = 0;
addEventListener('dragenter', (e) => { if (e.dataTransfer?.types.includes('Files')) { dragDepth++; $('drop').classList.add('on'); } });
addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('drop').classList.remove('on'); } });
addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', async (e) => {
  e.preventDefault();
  dragDepth = 0;
  $('drop').classList.remove('on');
  const f = [...e.dataTransfer.files].find((x) => x.type.startsWith('image/'));
  if (f) processImage(await blobToImageData(f));
});

$('turnW').onclick = () => setTurn('w');
$('turnB').onclick = () => setTurn('b');
function setTurn(t) {
  if (S.turn === t && S.turnWhy === 'chosen') return;
  S.turn = t;
  S.turnWhy = 'chosen';
  renderTurn();
  if (S.board) analyse();
}
$('flipBtn').onclick = flip;
function flip() {
  if (!S.board) { S.orientation = S.orientation === 'white' ? 'black' : 'white'; renderBoard(); return; }
  // The picture was read the wrong way round: rotate the read position 180°.
  S.board = S.board.map((row) => row.slice().reverse()).reverse();
  S.conf = S.conf.map((row) => row.slice().reverse()).reverse();
  S.orientation = S.orientation === 'white' ? 'black' : 'white';
  if (S.lastMove) S.lastMove = null;
  S.settings.side = S.orientation;
  saveSettings();
  if (S.turnWhy !== 'chosen' && S.turnWhy !== 'last-move highlight') S.turn = S.orientation === 'white' ? 'w' : 'b';
  renderTurn();
  renderBoard();
  analyse();
}
$('editBtn').onclick = () => toggleEdit();
$('copyFen').onclick = async () => {
  try { await navigator.clipboard.writeText(currentFen()); toast('FEN copied'); } catch { prompt('FEN', currentFen()); }
};

addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 's') { e.preventDefault(); scanScreen(); }
  else if (k === 'f') flip();
  else if (k === 't' && S.board) setTurn(S.turn === 'w' ? 'b' : 'w');
  else if (k === 'e' && S.board) toggleEdit();
  else if (k === 'escape') { closePicker(); if (S.editing) toggleEdit(false); }
});

/* ------------------------------------------------------------- settings */

function saveSettings() { store.set('settings', S.settings); renderSettings(); }
function renderSettings() {
  for (const [id, key] of [['timeSeg', 'time'], ['pvSeg', 'pv'], ['sideSeg', 'side'], ['voiceSeg', 'voice']]) {
    $(id).querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v) === String(S.settings[key])));
  }
}
for (const [id, key, num] of [['timeSeg', 'time', true], ['pvSeg', 'pv', true], ['sideSeg', 'side', false], ['voiceSeg', 'voice', false]]) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    S.settings[key] = num ? +b.dataset.v : b.dataset.v;
    saveSettings();
    if (key === 'side' && S.board && S.settings.side !== 'auto' && S.settings.side !== S.orientation) { flip(); return; }
    if ((key === 'time' || key === 'pv') && S.board) analyse();
  });
}

/* ------------------------------------------------- shared (PWA share target) */

async function takeShared() {
  if (!new URLSearchParams(location.search).has('shared')) return;
  history.replaceState(null, '', location.pathname);
  try {
    const cache = await caches.open('chesslens-share');
    const res = await cache.match('shared-image');
    if (res) { await cache.delete('shared-image'); processImage(await blobToImageData(await res.blob())); }
  } catch { /* nothing shared */ }
}

$('forgetBtn').onclick = () => { S.memory = []; saveMemory(); toast('Forgot learned pieces'); };

function setupPhones() {
  if (IN_ANDROID_APP) {
    $('phoneCard').hidden = false;
    $('androidApp').hidden = false;
    const btn = $('overlayBtn');
    const refresh = () => {
      const on = bridge.isOverlayRunning && bridge.isOverlayRunning();
      btn.textContent = on ? 'Stop the floating Scan button' : 'Start the floating Scan button';
      btn.classList.toggle('scan', !on);
    };
    btn.onclick = () => { bridge.toggleOverlay(); setTimeout(refresh, 600); };
    addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    refresh();
    // "Fix in app" from the floating card: open the screenshot it just read.
    if (PARAMS.has('shot')) {
      history.replaceState(null, '', location.pathname);
      window.chessLensScan('/shot.jpg?t=' + Date.now());
    }
    return;
  }
  // In a normal browser: explain how to use Chess Lens with chess apps on a phone.
  $('phoneCard').hidden = false;
  $('phoneHelp').hidden = false;
  $('pasteUrl').textContent = location.origin + location.pathname + '?paste=1';
  if (IS_IOS) $('iosHelp').open = true;
  else if (IS_ANDROID) $('androidHelp').open = true;
  if (PARAMS.has('paste')) {
    // Opened by the iPhone shortcut: the screenshot is on the clipboard, one tap reads it.
    history.replaceState(null, '', location.pathname);
    const b = $('pasteNow');
    b.hidden = false;
    b.onclick = async () => { b.hidden = true; await $('pasteBtn').onclick(); };
    b.scrollIntoView({ block: 'center' });
  }
}

renderSettings();
if (!OVERLAY) setupPhones();
render();
takeShared();
if (OVERLAY) report({ type: 'ready' });

// test hook
window.__chessLens = { S, processImage, analyse };
window.chessLensToggleTurn = () => { if (S.board) setTurn(S.turn === 'w' ? 'b' : 'w'); };
window.chessLensFlip = () => { if (S.board) flip(); };
