/* Club HQ — planning tools that sit on top of the SBC engine.

   Pure logic: no DOM, no globals beyond window.ClubHQ. engine.js owns the
   football rules (rating, chemistry, requirement parsing); this file owns the
   questions you ask *about a club* rather than about one squad:

     clubReport      what is in my club, and how deep is it?
     buildBestSquad  the best XI I can field for a budget
     explainGap      why can't I complete this SBC, and what would fix it?
     planSbcs        do several SBCs without spending the same player twice
     applyEvo        what does this player become if I evolve him?
     collectionStats how complete is my collection?

   Everything here is deliberately synchronous except the two searches, which
   yield to the event loop so the page stays responsive. */
(function (root) {
"use strict";

const E = root.SBCEngine;
if (!E) throw new Error('ClubHQ needs engine.js to load first');

const { squadRating, chemistry, squadCost, effCost, evaluate, quality, norm, coins,
        reqActual, reqShortfall, reqLabel, RELATED } = E;

/* ══════════════════ small helpers ══════════════════ */

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
/* Sorted [count, key] pairs, biggest group first. Blank values are ignored so a
   club with no league recorded doesn't report a phantom "" league. */
function tally(players, field) {
  const m = new Map();
  for (const p of players) {
    const k = String(p[field] || '').trim();
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/* engine.parseSbc returns {reqs, unparsed}, so callers reasonably hand us either
   that object or the bare array. Accept both rather than failing on `.find`. */
function asReqs(reqs) {
  if (Array.isArray(reqs)) return reqs;
  if (reqs && Array.isArray(reqs.reqs)) return reqs.reqs;
  return [];
}

function eligibleFor(p, slot, relPos) {
  if (!relPos) return p.pos.includes(slot);
  return p.pos.some((pp) => (RELATED[pp] || [pp]).includes(slot));
}

/* ══════════════════ club report ══════════════════ */

/* What the club is worth and how deep it runs. `atLeast[r]` is the headline
   number: SBCs are written as "10 players rated 85+", so the cumulative count
   is what you actually need to check, not the per-rating histogram. */
function clubReport(players, opts = {}) {
  const untradeMul = opts.untradeMul === undefined ? 1 : opts.untradeMul;
  const byRating = new Map();
  let value = 0, tradeableValue = 0, untradeables = 0, rares = 0, specials = 0, icons = 0;

  for (const p of players) {
    byRating.set(p.rating, (byRating.get(p.rating) || 0) + 1);
    const c = p.untradeable ? p.price * untradeMul : p.price;
    value += c;
    if (p.untradeable) untradeables++; else tradeableValue += p.price;
    if (p.rare) rares++;
    if (p.special) specials++;
    if (p.icon || p.hero) icons++;
  }

  // cumulative "how many are rated at least r", walked down from 99 in one pass
  const atLeast = {};
  let running = 0;
  for (let r = 99; r >= 40; r--) {
    running += byRating.get(r) || 0;
    atLeast[r] = running;
  }

  // duplicates: engine keys a card by name+rating, so this is "same card twice"
  const dupeMap = new Map();
  for (const p of players) dupeMap.set(p.key, (dupeMap.get(p.key) || 0) + 1);
  const duplicates = [...dupeMap.entries()]
    .filter(([, n]) => n > 1)
    .map(([key, n]) => ({ key, count: n, name: (players.find((p) => p.key === key) || {}).name || key }))
    .sort((a, b) => b.count - a.count);

  const ratings = players.map((p) => p.rating).sort((a, b) => b - a);

  return {
    size: players.length,
    value: Math.round(value),
    tradeableValue: Math.round(tradeableValue),
    untradeables, rares, specials, icons,
    byRating: [...byRating.entries()].map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => b.rating - a.rating),
    atLeast,
    topRating: ratings[0] || 0,
    medianRating: ratings.length ? ratings[Math.floor(ratings.length / 2)] : 0,
    leagues: tally(players, 'league'),
    nations: tally(players, 'nation'),
    clubs: tally(players, 'club'),
    duplicates,
    quality: {
      gold: players.filter((p) => quality(p.rating) === 'gold').length,
      silver: players.filter((p) => quality(p.rating) === 'silver').length,
      bronze: players.filter((p) => quality(p.rating) === 'bronze').length,
    },
  };
}

/* The cheapest players that still clear a rating floor — what you actually feed
   an SBC. Untradeables come first at equal price because spending them costs
   nothing you could have sold. */
function fodderPicks(players, minRating, count, opts = {}) {
  const untradeMul = opts.untradeMul === undefined ? 1 : opts.untradeMul;
  return players
    .filter((p) => p.rating >= minRating)
    .sort((a, b) => {
      const ca = a.untradeable ? a.price * untradeMul : a.price;
      const cb = b.untradeable ? b.price * untradeMul : b.price;
      return ca - cb || a.rating - b.rating;
    })
    .slice(0, count);
}

/* ══════════════════ gap analysis ══════════════════ */

/* An upper bound on each requirement across the whole club. If the best the
   club could *possibly* do still falls short, no search will ever find a squad —
   so we can say "impossible, get N more" instead of spinning the solver.
   Returns null for requirements we can't bound honestly (chemistry depends on
   which XI you pick, so it is left to the solver). */
function bestPossible(players, r, size) {
  const n = (f) => players.filter(f).length;
  switch (r.kind) {
    case 'size':            return players.length;
    case 'ovr':             return n((p) => p.rating >= Number(r.param || 0));
    case 'rare':            return n((p) => p.rare);
    case 'special':         return n((p) => p.special);
    case 'quality':         return n((p) => quality(p.rating) === r.param);
    case 'namedLeague':     return n((p) => norm(p.league) === norm(r.param));
    case 'namedNation':     return n((p) => norm(p.nation) === norm(r.param));
    case 'namedClub':       return n((p) => norm(p.club) === norm(r.param));
    case 'sameLeague':      return Math.max(0, ...tally(players, 'league').map((t) => t.count), 0);
    case 'sameNation':      return Math.max(0, ...tally(players, 'nation').map((t) => t.count), 0);
    case 'sameClub':        return Math.max(0, ...tally(players, 'club').map((t) => t.count), 0);
    case 'distinctLeagues': return Math.min(size, tally(players, 'league').length);
    case 'distinctNations': return Math.min(size, tally(players, 'nation').length);
    case 'distinctClubs':   return Math.min(size, tally(players, 'club').length);
    case 'rating': {
      // best squad rating achievable = your top `size` cards
      const top = players.map((p) => p.rating).sort((a, b) => b - a).slice(0, size);
      return top.length < size ? 0 : squadRating(top).rating;
    }
    default: return null; // chem and anything new: no honest bound
  }
}

/* Human-readable "you are short X" for every requirement the club cannot meet.
   `blocking` means provably impossible from this club, not merely unsolved. */
function explainGap(players, reqsIn, opts = {}) {
  const reqs = asReqs(reqsIn);
  const size = (reqs.find((r) => r.kind === 'size') || { value: 11 }).value || 11;
  const pool = opts.excludeIcons ? players.filter((p) => !p.icon && !p.hero) : players;
  const rows = [];

  for (const r of reqs) {
    if (r.kind === 'size') continue;
    const best = bestPossible(pool, r, size);
    if (best === null) { rows.push({ req: r, label: reqLabel(r), best: null, blocking: false, advice: null }); continue; }
    const short = r.op === 'min' ? Math.max(0, r.value - best) : 0;
    rows.push({
      req: r, label: reqLabel(r), best, short,
      blocking: short > 0,
      advice: short > 0 ? adviceFor(r, short, best) : null,
    });
  }

  const blocking = rows.filter((x) => x.blocking);
  return {
    size,
    clubSize: pool.length,
    tooFewPlayers: pool.length < size,
    rows,
    blocking,
    verdict: pool.length < size
      ? `You only have ${pool.length} usable player(s); this SBC needs ${size}.`
      : blocking.length
        ? `Not possible from this club yet — ${blocking.length} requirement(s) can't be met by any squad.`
        : 'Every requirement is reachable from your club. Run the solver to find the cheapest squad.',
  };
}

function adviceFor(r, short, best) {
  switch (r.kind) {
    case 'ovr':         return `You have ${best} rated ${r.param}+. Get ${short} more.`;
    case 'rare':        return `You have ${best} rare card(s). Get ${short} more.`;
    case 'special':     return `You have ${best} special card(s). Get ${short} more.`;
    case 'quality':     return `You have ${best} ${r.param} card(s). Get ${short} more.`;
    case 'rating':      return `Your best possible XI rates ${best}. You need higher-rated cards to reach ${r.value}.`;
    case 'namedLeague': return `You have ${best} from ${r.param}. Get ${short} more.`;
    case 'namedNation': return `You have ${best} from ${r.param}. Get ${short} more.`;
    case 'namedClub':   return `You have ${best} from ${r.param}. Get ${short} more.`;
    case 'sameLeague':  return `Your deepest league has ${best}. Get ${short} more from one league.`;
    case 'sameNation':  return `Your deepest nation has ${best}. Get ${short} more from one nation.`;
    case 'sameClub':    return `Your deepest club has ${best}. Get ${short} more from one club.`;
    default:            return `Short by ${short}.`;
  }
}

/* ══════════════════ best XI for a budget ══════════════════ */

/* The solver in engine.js answers "cheapest squad that satisfies these rules".
   This answers the opposite question: "best squad I can field for this money".
   Same shape of search — multi-restart simulated annealing — but the budget is
   a hard constraint rather than the thing being minimised. */
function buildBestSquad(club, formation, opts, onProgress, onDone) {
  const o = Object.assign(
    { budget: Infinity, relPos: true, excludeIcons: false, untradeMul: 1, effort: 'deep', objective: 'balanced' },
    opts || {},
  );
  const progress = onProgress || function () {};
  const slots = formation.rows.flat();
  const size = slots.length;

  let pool = club.filter((p) => p.rating > 0);
  if (o.excludeIcons) pool = pool.filter((p) => !p.icon && !p.hero);
  if (pool.length < size) {
    onDone({ error: `Only ${pool.length} usable player(s) in your club — need ${size}.` });
    return;
  }

  const restarts = { fast: 4, deep: 10, max: 20 }[o.effort] || 10;
  const iters = { fast: 2200, deep: 6000, max: 14000 }[o.effort] || 6000;

  // Quality is what we maximise; the weights just decide what "best" means.
  function qualityOf(rating, chem) {
    if (o.objective === 'chem') return chem.total * 1000 + rating.exact;
    if (o.objective === 'rating') return rating.exact * 1000 + chem.total;
    return rating.exact * 1000 + chem.total * 30; // balanced
  }

  function score(sq) {
    const rating = squadRating(sq.map((p) => p.rating));
    const chem = chemistry(sq, formation, o.relPos);
    const cost = squadCost(sq, o.untradeMul);
    const over = Math.max(0, cost - o.budget);
    const outOfPos = chem.detail.filter((d) => !d.inPos).length;
    const q = qualityOf(rating, chem);
    // minimised: out-of-position players are a real cost, quality is the payoff
    return { rating, chem, cost, over, outOfPos, q, total: outOfPos * 40000 - q };
  }

  function seed() {
    const picked = new Array(size);
    const used = new Set();
    const order = [...slots.keys()].sort(() => Math.random() - 0.5);
    for (const si of order) {
      const slot = slots[si];
      let cands = pool.filter((p) => !used.has(p.id) && eligibleFor(p, slot, o.relPos));
      if (!cands.length) cands = pool.filter((p) => !used.has(p.id));
      if (!cands.length) return null;
      cands.sort((a, b) => b.rating - a.rating || effCost(a, o) - effCost(b, o));
      const p = cands[Math.floor(Math.random() * Math.min(cands.length, 6))];
      picked[si] = p; used.add(p.id);
    }
    // Walk the most expensive pick down until the squad fits the budget.
    let guard = 0;
    while (squadCost(picked, o.untradeMul) > o.budget && guard++ < 300) {
      let idx = 0, dearest = -1;
      picked.forEach((p, i) => { const c = effCost(p, o); if (c > dearest) { dearest = c; idx = i; } });
      const cheaper = pool
        .filter((p) => !picked.some((x) => x.id === p.id) && eligibleFor(p, slots[idx], o.relPos) && effCost(p, o) < dearest)
        .sort((a, b) => b.rating - a.rating);
      if (!cheaper.length) break;
      picked[idx] = cheaper[0];
    }
    return picked;
  }

  function propose(sq) {
    const i = Math.floor(Math.random() * size);
    const slot = slots[i];
    // mostly swap in someone who can actually play the slot; occasionally anyone
    const strict = Math.random() < 0.8;
    const src = strict ? pool.filter((p) => eligibleFor(p, slot, o.relPos)) : pool;
    if (!src.length) return null;
    const inP = src[Math.floor(Math.random() * src.length)];
    if (!inP || sq.some((p) => p.id === inP.id)) return null;
    const trial = sq.slice();
    trial[i] = inP;
    return trial;
  }

  let best = null, run = 0;
  const record = (sq, sc) => {
    if (sc.over > 0) return;                       // never report a squad you can't afford
    if (!best || sc.q > best.q) best = { squad: sq.slice(), rating: sc.rating, chem: sc.chem, cost: sc.cost, q: sc.q, outOfPos: sc.outOfPos };
  };

  function runOne() {
    let sq = seed();
    if (!sq) return;
    let cur = score(sq);
    record(sq, cur);
    for (let it = 0; it < iters; it++) {
      const trial = propose(sq);
      if (!trial) continue;
      const sc = score(trial);
      if (cur.over === 0 && sc.over > 0) continue; // never trade away an affordable squad
      const delta = sc.total - cur.total;
      const T = 30000 * (1 - it / iters) + 1;
      if (delta < 0 || Math.random() < Math.exp(-delta / T)) { sq = trial; cur = sc; record(sq, cur); }
    }
  }

  function step() {
    const chunk = Math.max(1, Math.round(restarts / 6));
    for (let k = 0; k < chunk && run < restarts; k++, run++) runOne();
    progress(run / restarts, best);
    if (run < restarts) setTimeout(step, 0);
    else if (best) onDone({ best });
    else onDone({ error: 'No squad fits that budget. Raise it, or price your untradeables at 0.' });
  }
  setTimeout(step, 0);
}

/* ══════════════════ multi-SBC planner ══════════════════ */

/* Solve several SBCs back to back against ONE club, removing each solution's
   players before the next solve. That is the whole point: solving them
   independently happily spends the same card three times, which you cannot do.
   `order` decides who gets first pick of the club. */
function planSbcs(club, sbcs, formation, opts, onProgress, onDone) {
  const o = Object.assign({ relPos: true, excludeIcons: false, untradeMul: 1, effort: 'deep', safe: false }, opts || {});
  const progress = onProgress || function () {};
  const list = sbcs.slice();
  const results = [];
  let remaining = club.slice();
  let i = 0;

  function next() {
    if (i >= list.length) {
      onDone({
        steps: results,
        totalCost: sum(results.filter((r) => r.solved).map((r) => r.cost)),
        solved: results.filter((r) => r.solved).length,
        failed: results.filter((r) => !r.solved).length,
        leftover: remaining.length,
      });
      return;
    }
    const entry = list[i];
    const reqs = asReqs(entry.reqs);
    const form = entry.formation || formation;
    progress(i / list.length, entry.name);

    // Cheap pre-check: if the club provably can't do it, don't burn a solve.
    const gap = explainGap(remaining, reqs, o);
    if (gap.blocking.length || gap.tooFewPlayers) {
      results.push({ name: entry.name, solved: false, reason: gap.verdict, gap, squad: [], cost: 0 });
      i++; next(); return;
    }

    E.solveAsync(remaining, reqs, form, o, () => {}, (res) => {
      if (res.error || !res.best || res.best.__partial) {
        results.push({
          name: entry.name, solved: false,
          reason: res.error || 'Solver could not satisfy every requirement with the players left.',
          gap, squad: [], cost: 0,
        });
      } else {
        const used = res.best.squad;
        const usedIds = new Set(used.map((p) => p.id));
        remaining = remaining.filter((p) => !usedIds.has(p.id));
        results.push({ name: entry.name, solved: true, squad: used, cost: res.best.cost, ev: res.best.ev, reason: null, gap: null });
      }
      i++;
      setTimeout(next, 0);
    });
  }
  setTimeout(next, 0);
}

/* ══════════════════ evolutions ══════════════════ */

/* Evolutions in FC raise a card's rating and can add positions. We model the
   part that changes SBC eligibility — rating and positions — and deliberately
   not the per-stat detail, which we have no data for and would be guessing at. */
const EVO_PRESETS = [
  { id: 'none',      name: 'No evolution',        rating: 0, addPos: [] },
  { id: 'plus1',     name: '+1 rating',           rating: 1, addPos: [] },
  { id: 'plus2',     name: '+2 rating',           rating: 2, addPos: [] },
  { id: 'plus3',     name: '+3 rating',           rating: 3, addPos: [] },
  { id: 'cb',        name: '+1 rating, add CB',   rating: 1, addPos: ['CB'] },
  { id: 'cdm',       name: '+1 rating, add CDM',  rating: 1, addPos: ['CDM'] },
  { id: 'st',        name: '+2 rating, add ST',   rating: 2, addPos: ['ST'] },
  { id: 'wing',      name: '+2 rating, add LW/RW', rating: 2, addPos: ['LW', 'RW'] },
];

/* Returns a NEW player object; evolving must never mutate the club in place or
   the club report and the solver start disagreeing about what you own. */
function applyEvo(player, evo) {
  const e = typeof evo === 'string' ? EVO_PRESETS.find((x) => x.id === evo) : evo;
  if (!e) return Object.assign({}, player);
  const out = Object.assign({}, player);
  out.rating = Math.min(99, player.rating + (e.rating || 0));
  out.pos = [...new Set([...(player.pos || []), ...(e.addPos || [])])];
  out.untradeable = true;                 // evolved cards are locked to your club
  out.evolved = (e.rating || 0) > 0 || (e.addPos || []).length > 0;
  out.key = norm(out.name) + '|' + out.rating;
  return out;
}

/* Which of these SBCs an evolution newly unlocks — the reason to spend one. */
function evoUnlocks(club, player, evo, sbcs, opts = {}) {
  const before = club;
  const after = club.map((p) => (p.id === player.id ? applyEvo(p, evo) : p));
  const out = [];
  for (const s of sbcs) {
    const b = explainGap(before, s.reqs, opts);
    const a = explainGap(after, s.reqs, opts);
    out.push({
      name: s.name,
      wasBlocked: b.blocking.length > 0 || b.tooFewPlayers,
      nowBlocked: a.blocking.length > 0 || a.tooFewPlayers,
      unlocked: (b.blocking.length > 0 || b.tooFewPlayers) && !(a.blocking.length > 0 || a.tooFewPlayers),
    });
  }
  return out;
}

/* ══════════════════ collection ══════════════════ */

/* How close each league / nation / club is to the counts SBCs keep asking for.
   The thresholds mirror the chemistry tiers in engine.js, so "complete" here
   means "enough to max that link", not "every card in the game". */
function collectionStats(players, opts = {}) {
  const targets = opts.targets || { league: 8, nation: 8, club: 7 };
  const build = (field, target) => tally(players, field).map((t) => ({
    key: t.key, count: t.count, target,
    percent: Math.min(100, Math.round((t.count / target) * 100)),
    complete: t.count >= target,
  }));
  const leagues = build('league', targets.league);
  const nations = build('nation', targets.nation);
  const clubs = build('club', targets.club);
  return {
    leagues, nations, clubs,
    completeLeagues: leagues.filter((x) => x.complete).length,
    completeNations: nations.filter((x) => x.complete).length,
    completeClubs: clubs.filter((x) => x.complete).length,
  };
}

/* ══════════════════ exports ══════════════════ */
root.ClubHQ = {
  clubReport, fodderPicks,
  explainGap, bestPossible,
  buildBestSquad,
  planSbcs,
  EVO_PRESETS, applyEvo, evoUnlocks,
  collectionStats,
  // re-exported so the page can format without reaching into two namespaces
  coins,
};
})(typeof window !== 'undefined' ? window : globalThis);
