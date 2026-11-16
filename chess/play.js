// Chess Lens — play Stockfish at any strength, with hints and a coach that rates your moves.
import { Chess } from './vendor/chess.js';
import { Engine } from './engine.js';
import { Board } from './board.js';

const $ = (id) => document.getElementById(id);
const ENGINE_URL = 'engine/stockfish-17.1-lite-single-03e3232.js';
const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

// Ratings are rough. Below Stockfish's 1320 rating floor, weaker play comes from
// Skill Level plus a shallow search.
const LEVELS = [
  null,
  { name: 'Beginner', elo: '≈400', options: { UCI_LimitStrength: false, 'Skill Level': 0 }, go: { depth: 1 } },
  { name: 'Novice', elo: '≈700', options: { UCI_LimitStrength: false, 'Skill Level': 2 }, go: { depth: 2 } },
  { name: 'Casual', elo: '≈1000', options: { UCI_LimitStrength: false, 'Skill Level': 4 }, go: { depth: 4 } },
  { name: 'Club player', elo: '1350', options: { 'Skill Level': 20, UCI_LimitStrength: true, UCI_Elo: 1350 }, go: { movetime: 500 } },
  { name: 'Strong club', elo: '1600', options: { 'Skill Level': 20, UCI_LimitStrength: true, UCI_Elo: 1600 }, go: { movetime: 600 } },
  { name: 'Expert', elo: '1850', options: { 'Skill Level': 20, UCI_LimitStrength: true, UCI_Elo: 1850 }, go: { movetime: 700 } },
  { name: 'Candidate master', elo: '2100', options: { 'Skill Level': 20, UCI_LimitStrength: true, UCI_Elo: 2100 }, go: { movetime: 800 } },
  { name: 'Master', elo: '2400', options: { 'Skill Level': 20, UCI_LimitStrength: true, UCI_Elo: 2400 }, go: { movetime: 1000 } },
  { name: 'Grandmaster', elo: '2700', options: { 'Skill Level': 20, UCI_LimitStrength: true, UCI_Elo: 2700 }, go: { movetime: 1200 } },
  { name: 'Stockfish', elo: 'full strength', options: { UCI_LimitStrength: false, 'Skill Level': 20 }, go: { movetime: 1500 } },
];

const QUALITY = {
  best: { text: 'Best', mark: '★' },
  excellent: { text: 'Excellent', mark: '!' },
  good: { text: 'Good', mark: '' },
  inaccuracy: { text: 'Inaccuracy', mark: '?!' },
  mistake: { text: 'Mistake', mark: '?' },
  blunder: { text: 'Blunder', mark: '??' },
};

const store = {
  get(k, d) { try { const v = localStorage.getItem('chesslens.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('chesslens.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

/* ------------------------------------------------------------------ state */

const S = {
  level: 4, colorChoice: 'w', coachOn: true, evalOn: true,
  ...store.get('playSettings', {}),
  color: 'w', orientation: 'white', startFen: null, labels: [], notes: [],
  over: null, thinking: false, hintStep: 0, hintsUsed: 0, ready: false,
};
let G = new Chess();
let token = 0;                  // bumps on new game / take back: stale async work checks it
let rating = Promise.resolve(); // the coach rating the last move (hints wait for it)
const evals = new Map();        // fen → { white (cp, White's view), best (uci), depth }
const opp = new Engine(ENGINE_URL);
const coach = new Engine(ENGINE_URL);
let coachJob = null;

const board = new Board($('board'), {
  dests: (sq) => {
    if (!S.ready || S.over || S.thinking || G.turn() !== S.color) return [];
    return [...new Set(G.moves({ square: sq, verbose: true }).map((m) => m.to))];
  },
  onMove: onUserMove,
});

/* ----------------------------------------------------------------- engines */

function toWhiteCp(score, turn) {
  let cp;
  if (score.type === 'mate') cp = score.value > 0 ? 10000 - score.value * 10 : -10000 - score.value * 10;
  else cp = score.value;
  return turn === 'w' ? cp : -cp;
}

coach.on((m) => {
  if (m.type !== 'info' || !coachJob || m.id !== coachJob.id || !m.lines[0]) return;
  const l = m.lines[0];
  const turn = coachJob.fen.split(' ')[1];
  evals.set(coachJob.fen, { white: toWhiteCp(l.score, turn), score: l.score, turn, best: l.pv[0], depth: l.depth });
  if (coachJob.fen === G.fen()) renderEval();
});

function coachAnalyse(fen, ms) {
  const job = coach.analyse(fen, { movetime: ms, multipv: 1 });
  coachJob = { id: job.id, fen };
  return job;
}

const winChance = (cp) => 2 / (1 + Math.exp(-0.00368208 * Math.max(-1000, Math.min(1000, cp)))) - 1;

function classify(before, after, uci, color) {
  if (uci === before.best) return 'best';
  const sign = color === 'w' ? 1 : -1;
  const drop = sign * (winChance(before.white) - winChance(after.white));
  if (drop >= 0.3) return 'blunder';
  if (drop >= 0.2) return 'mistake';
  if (drop >= 0.1) return 'inaccuracy';
  return drop < 0.02 ? 'excellent' : 'good';
}

async function rateMove(before, after, mv, ply, t) {
  let e0 = evals.get(before);
  if (!e0 || e0.depth < 10) {
    await coachAnalyse(before, 500);
    if (t !== token) return;
    e0 = evals.get(before);
  }
  await coachAnalyse(after, 900);
  if (t !== token) return;
  const e1 = evals.get(after);
  if (!e0 || !e1) return;
  const q = classify(e0, e1, mv.from + mv.to + (mv.promotion || ''), mv.color);
  let better = '';
  if (q !== 'best' && e0.best) {
    try { better = new Chess(before).move({ from: e0.best.slice(0, 2), to: e0.best.slice(2, 4), promotion: e0.best[4] }).san; } catch { /* ignore */ }
  }
  S.labels[ply] = q;
  S.notes[ply] = { san: mv.san, better, before: e0.white, after: e1.white };
  save();
  renderMoves();
  renderCoach();
}

async function engineMove() {
  const t = token;
  const fen = G.fen();
  S.thinking = true;
  render();
  const L = LEVELS[S.level];
  const start = performance.now();
  await opp.start();
  const res = await opp.analyse(fen, { ...L.go, multipv: 1, options: L.options });
  if (res.stale || t !== token || G.fen() !== fen) return;
  const wait = 450 - (performance.now() - start); // a beat, so the reply doesn't feel instant
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  if (t !== token) return;
  S.thinking = false;
  if (!res.bestmove) { render(); return; }
  G.move({ from: res.bestmove.slice(0, 2), to: res.bestmove.slice(2, 4), promotion: res.bestmove[4] });
  save();
  next();
}

async function startPlayerTurn() {
  const t = token;
  const fen = G.fen();
  render();
  await rating;
  if (t !== token || G.fen() !== fen || S.over) return;
  if (!evals.has(fen) || evals.get(fen).depth < 18) coachAnalyse(fen, 3000); // ready for hints, keeps the eval bar honest
}

function next() {
  if (G.isGameOver()) { finish(); return; }
  if (G.turn() === S.color) startPlayerTurn();
  else engineMove();
}

/* ------------------------------------------------------------------- moves */

async function onUserMove(from, to) {
  if (!S.ready || S.over || S.thinking || G.turn() !== S.color) return false;
  const piece = G.get(from);
  let promotion;
  if (piece && piece.type === 'p' && (to[1] === '8' || to[1] === '1')) {
    promotion = await board.choosePromotion(to, piece.color);
    if (!promotion) { render(); return false; }
  }
  const before = G.fen();
  let mv;
  try { mv = G.move({ from, to, promotion }); } catch { render(); return false; }
  const ply = G.history().length - 1;
  S.hintStep = 0; S.hintMove = null;
  $('hintText').textContent = '';
  save();
  if (S.coachOn) rating = rateMove(before, G.fen(), mv, ply, token);
  next();
  return true;
}

function finish(resigned = false) {
  S.thinking = false;
  let msg, sub = '';
  if (resigned) { msg = 'You resigned'; sub = 'Stockfish wins.'; }
  else if (G.isCheckmate()) {
    const winner = G.turn() === 'w' ? 'b' : 'w';
    msg = winner === S.color ? 'Checkmate — you win! 🎉' : 'Checkmate — Stockfish wins';
  } else if (G.isStalemate()) msg = 'Draw — stalemate';
  else if (G.isThreefoldRepetition()) msg = 'Draw — threefold repetition';
  else if (G.isInsufficientMaterial()) msg = 'Draw — not enough material';
  else if (G.isDraw()) msg = 'Draw — 50-move rule';
  else msg = 'Game over';
  const rated = S.labels.filter(Boolean);
  if (rated.length) {
    const c = (q) => rated.filter((x) => x === q).length;
    sub += ` Your moves: ${c('best') + c('excellent')} best/excellent, ${c('inaccuracy')} inaccuracies, ${c('mistake')} mistakes, ${c('blunder')} blunders.`;
  }
  if (S.hintsUsed) sub += ` Hints used: ${S.hintsUsed}.`;
  S.over = { msg, sub: sub.trim() };
  save();
  render();
}

function newGame(fen = null) {
  token++;
  opp.latest = -1;
  opp.stop();
  const c = S.colorChoice === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : S.colorChoice;
  G = fen ? new Chess(fen) : new Chess();
  S.startFen = fen;
  S.color = fen ? G.turn() : c;
  S.orientation = S.color === 'w' ? 'white' : 'black';
  S.labels = [];
  S.notes = [];
  S.over = null;
  S.thinking = false;
  S.hintStep = 0; S.hintMove = null;
  S.hintsUsed = 0;
  $('hintText').textContent = '';
  rating = Promise.resolve();
  save();
  renderCoach();
  next();
}

function takeBack() {
  if (!G.history().length) return;
  token++;
  opp.latest = -1;
  opp.stop();
  S.thinking = false;
  S.over = null;
  do { G.undo(); } while (G.history().length && G.turn() !== S.color);
  S.labels.length = Math.min(S.labels.length, G.history().length);
  S.notes.length = Math.min(S.notes.length, G.history().length);
  S.hintStep = 0; S.hintMove = null;
  $('hintText').textContent = '';
  rating = Promise.resolve();
  save();
  renderCoach();
  next();
}

async function hint() {
  if (!S.ready || S.over || S.thinking || G.turn() !== S.color) return;
  const fen = G.fen();
  const t = token;
  let e = evals.get(fen);
  if (!e || e.depth < 12) {
    $('hintText').textContent = 'Thinking…';
    await rating;
    if (t !== token || G.fen() !== fen) return;
    if (!coachJob || coachJob.fen !== fen) coachAnalyse(fen, 3000);
    const until = performance.now() + 2500;
    while (performance.now() < until && !((evals.get(fen) || {}).depth >= 12)) await new Promise((r) => setTimeout(r, 100));
    if (t !== token || G.fen() !== fen) return;
    e = evals.get(fen);
    if (!e) { $('hintText').textContent = 'No hint yet — try again in a moment.'; return; }
  }
  if (!S.hintStep || !S.hintMove) S.hintMove = e.best; // keep the same move across both hint steps
  S.hintStep = Math.min(2, S.hintStep + 1);
  S.hintsUsed++;
  const u = S.hintMove;
  const m = new Chess(fen).move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
  $('hintText').textContent = S.hintStep === 1
    ? `Hint: look at your ${NAMES[m.piece]} on ${m.from}. Press Hint again for the move.`
    : `Hint: ${m.san} — ${NAMES[m.piece]} ${m.from} → ${m.to}.`;
  render();
}

/* ------------------------------------------------------------------ render */

function pieceMap() {
  const out = {};
  G.board().forEach((row) => row.forEach((p) => {
    if (p) out[p.square] = p.color === 'w' ? p.type.toUpperCase() : p.type;
  }));
  return out;
}

function render() {
  const hist = G.history({ verbose: true });
  const last = hist[hist.length - 1];
  let check = null;
  if (G.inCheck()) check = G.findPiece({ type: 'k', color: G.turn() })[0];
  const arrows = [];
  let hintFrom = null;
  const hm = S.hintMove;
  if (S.hintStep && hm && G.turn() === S.color) {
    if (S.hintStep === 1) hintFrom = hm.slice(0, 2);
    else arrows.push({ from: hm.slice(0, 2), to: hm.slice(2, 4), color: '#4a90d9' });
  }
  board.set({
    pieces: pieceMap(),
    orientation: S.orientation,
    lastMove: last ? { from: last.from, to: last.to } : null,
    check, hintFrom, arrows,
    interactive: !S.over,
  });
  renderPlayers();
  renderStatus();
  renderMoves();
  renderEval();
  renderResult();
  $('undoBtn').disabled = !hist.some((m) => m.color === S.color);
  $('hintBtn').disabled = !S.ready || !!S.over || S.thinking || G.turn() !== S.color;
  $('resignBtn').disabled = !!S.over || !hist.length;
}

function renderPlayers() {
  const L = LEVELS[S.level];
  const sf = `<span>Stockfish</span><span class="tag">${L.name} · ${L.elo}</span>${S.thinking ? '<span class="think">thinking</span>' : ''}`;
  const you = `<span>You</span><span class="tag">${S.color === 'w' ? 'White' : 'Black'}</span>`;
  const youBottom = (S.orientation === 'white') === (S.color === 'w');
  $('topPlayer').innerHTML = youBottom ? sf : you;
  $('bottomPlayer').innerHTML = youBottom ? you : sf;
}

function renderStatus() {
  let s, sub = '';
  if (!S.ready) s = 'Loading Stockfish…';
  else if (S.over) { s = S.over.msg; sub = 'Start a new game below, or review this one.'; }
  else if (S.thinking) s = 'Stockfish is thinking…';
  else if (G.turn() === S.color) {
    s = 'Your move';
    sub = G.inCheck() ? 'You are in check!' : `You play ${S.color === 'w' ? 'White' : 'Black'}. Drag a piece or tap it, then tap where it goes.`;
  } else s = '…';
  $('status').innerHTML = `${s}${sub ? `<small>${sub}</small>` : ''}`;
}

function renderMoves() {
  const hist = G.history({ verbose: true });
  const startMove = S.startFen ? +S.startFen.split(' ')[5] : 1;
  const blackFirst = S.startFen && S.startFen.split(' ')[1] === 'b';
  let html = '';
  let n = startMove;
  const cell = (m, i) => {
    if (!m) return '<span></span>';
    const q = S.labels[i];
    const mark = q ? `<i class="q-${q}" title="${QUALITY[q].text}">${QUALITY[q].mark || '·'}</i>` : '';
    return `<span class="m${i === hist.length - 1 ? ' last' : ''}">${m.san}${mark}</span>`;
  };
  let i = 0;
  if (blackFirst && hist.length) { html += `<span class="n">${n}.</span><span>…</span>${cell(hist[0], 0)}`; i = 1; n++; }
  for (; i < hist.length; i += 2, n++) html += `<span class="n">${n}.</span>${cell(hist[i], i)}${cell(hist[i + 1], i + 1)}`;
  const el = $('moves');
  el.innerHTML = html || '<span class="muted" style="grid-column:1/-1">No moves yet.</span>';
  el.scrollTop = el.scrollHeight;
  const pgn = pgnText();
  $('lichessLink').href = 'https://lichess.org/analysis/pgn/' + encodeURIComponent(pgn);
}

function pgnText() {
  const g = new Chess(S.startFen || undefined);
  for (const m of G.history({ verbose: true })) g.move(m.san);
  const L = LEVELS[S.level];
  const sf = `Stockfish 17.1 (${L.name}, ${L.elo})`;
  g.setHeader('Event', 'Chess Lens — Play vs Stockfish');
  g.setHeader('White', S.color === 'w' ? 'You' : sf);
  g.setHeader('Black', S.color === 'b' ? 'You' : sf);
  return g.pgn();
}

function renderEval() {
  const bar = $('evalbar');
  bar.classList.toggle('off', !S.evalOn);
  bar.classList.toggle('flipped', S.orientation === 'black');
  const e = evals.get(G.fen());
  if (!e) return;
  $('evalfill').style.height = ((1 + winChance(e.white)) * 50).toFixed(1) + '%';
}

function fmt(cp) {
  if (Math.abs(cp) >= 9000) return (cp > 0 ? '+M' : '−M') + Math.round((10000 - Math.abs(cp)) / 10);
  const v = cp / 100;
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
}

function renderCoach() {
  const el = $('coach');
  let i = S.labels.length - 1;
  while (i >= 0 && !S.labels[i]) i--;
  if (!S.coachOn) { el.innerHTML = '<span class="muted">Move ratings are off.</span>'; return; }
  if (i < 0) { el.innerHTML = '<span class="muted">Play a move — the coach rates every one of yours: Best, Excellent, Good, Inaccuracy, Mistake or Blunder.</span>'; return; }
  const q = S.labels[i], n = S.notes[i];
  const pov = (cp) => fmt(S.color === 'w' ? cp : -cp);
  let text;
  if (q === 'best') text = `<b>${n.san}</b> is exactly what Stockfish would play.`;
  else if (q === 'excellent' || q === 'good') text = `<b>${n.san}</b> keeps things about level${n.better ? ` — Stockfish slightly preferred <b>${n.better}</b>` : ''}.`;
  else text = `<b>${n.san}</b> costs you (${pov(n.before)} → ${pov(n.after)}).${n.better ? ` Better was <b>${n.better}</b>.` : ''}`;
  el.innerHTML = `<span class="badge q-${q}">${QUALITY[q].text}</span><div>${text}</div>`;
}

function renderResult() {
  const el = $('board');
  el.querySelector('.result')?.remove();
  if (!S.over) return;
  const box = document.createElement('div');
  box.className = 'result';
  box.innerHTML = `<b>${S.over.msg}</b><span>${S.over.sub || ''}</span>
    <div class="row"><button class="btn primary" data-a="new">New game</button><a class="btn" style="text-decoration:none;color:inherit" target="_blank" rel="noopener" href="${$('lichessLink').href}">Review ↗</a></div>`;
  box.addEventListener('pointerdown', (e) => e.stopPropagation());
  box.querySelector('[data-a="new"]').onclick = () => newGame();
  el.appendChild(box);
}

function renderSettings() {
  $('colorSeg').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === S.colorChoice));
  $('level').value = S.level;
  const L = LEVELS[S.level];
  $('levelName').innerHTML = `${S.level}. ${L.name}<span>${L.elo}</span>`;
  $('coachToggle').checked = S.coachOn;
  $('evalToggle').checked = S.evalOn;
}

/* ------------------------------------------------------------- persistence */

function save() {
  store.set('playSettings', { level: S.level, colorChoice: S.colorChoice, coachOn: S.coachOn, evalOn: S.evalOn });
  store.set('playGame', {
    startFen: S.startFen, color: S.color, orientation: S.orientation,
    moves: G.history({ verbose: true }).map((m) => m.from + m.to + (m.promotion || '')),
    labels: S.labels, notes: S.notes, over: S.over, hintsUsed: S.hintsUsed,
  });
}

function restore() {
  const g = store.get('playGame', null);
  if (!g) return false;
  try {
    const game = new Chess(g.startFen || undefined);
    for (const u of g.moves) game.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    G = game;
    Object.assign(S, { startFen: g.startFen, color: g.color, orientation: g.orientation, labels: g.labels || [], notes: g.notes || [], over: g.over, hintsUsed: g.hintsUsed || 0 });
    return true;
  } catch { return false; }
}

/* ------------------------------------------------------------------ inputs */

$('hintBtn').onclick = hint;
$('undoBtn').onclick = takeBack;
$('flipBtn').onclick = () => { S.orientation = S.orientation === 'white' ? 'black' : 'white'; save(); render(); };
$('resignBtn').onclick = () => { if (!S.over && confirm('Resign this game?')) { token++; opp.latest = -1; opp.stop(); finish(true); } };
$('newBtn').onclick = () => newGame();
$('colorSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  S.colorChoice = b.dataset.v;
  save();
  renderSettings();
});
$('level').addEventListener('input', () => { S.level = +$('level').value; save(); renderSettings(); renderPlayers(); });
$('coachToggle').onchange = () => { S.coachOn = $('coachToggle').checked; save(); renderCoach(); };
$('evalToggle').onchange = () => { S.evalOn = $('evalToggle').checked; save(); renderEval(); };
$('copyPgn').onclick = async () => {
  const pgn = pgnText();
  try { await navigator.clipboard.writeText(pgn); $('copyPgn').textContent = 'Copied!'; setTimeout(() => { $('copyPgn').textContent = 'Copy PGN'; }, 1400); } catch { prompt('PGN', pgn); }
};
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'h') hint();
  else if (k === 'u') takeBack();
  else if (k === 'f') $('flipBtn').click();
  else if (k === 'n') newGame();
});

/* -------------------------------------------------------------------- boot */

if ('serviceWorker' in navigator && location.protocol !== 'file:' && !window.ChessLensAndroid) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

renderSettings();
const params = new URLSearchParams(location.search);
const startFen = params.get('fen');
history.replaceState(null, '', location.pathname);
Promise.all([opp.start(), coach.start()]).then(() => {
  S.ready = true;
  if (startFen) {
    // "Play from here" on the scan page: you take the side to move.
    try { newGame(startFen); return; } catch { /* bad FEN: fall through */ }
  }
  if (restore() && !S.over) { renderCoach(); next(); return; }
  if (S.over) { renderCoach(); render(); return; }
  newGame();
}).catch((e) => { $('status').textContent = 'Could not start Stockfish: ' + (e && e.message); });
render();

window.__play = { S, get game() { return G; }, evals, newGame, hint, takeBack };
