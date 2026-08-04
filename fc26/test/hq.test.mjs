/* Club HQ logic tests — pure, no browser.
   engine.js and hq.js are plain IIFEs that attach to globalThis, so we can
   evaluate them straight into this context and call them directly. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const load = (f) => vm.runInThisContext(fs.readFileSync(path.join(dir, '..', f), 'utf8'), { filename: f });
load('engine.js');
load('hq.js');

const E = globalThis.SBCEngine;
const HQ = globalThis.ClubHQ;

let failures = 0;
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${extra ? '  ← ' + extra : ''}`);
  if (!cond) failures++;
};

/* A deliberately small, fully-known club so every expectation below is one we
   can count by hand rather than trust the code to tell us. */
const CLUB_TEXT = `Name, Rating, Positions, Nation, League, Club, Price, Tags
K. Oduya, 88, ST, Nigeria, Premier League, Arsenal, 0, untradeable rare
L. Moreau, 87, CAM/CM, France, Ligue 1, Paris, 0, untradeable rare
D. Vasquez, 86, CB, Spain, LALIGA, Sevilla, 168000, rare
M. Halvorsen, 86, ST, Norway, Bundesliga, Dortmund, 154000, rare
T. Bianchi, 85, CM, Italy, Serie A, Napoli, 96000, rare
A. Ferreira, 85, RW, Brazil, LALIGA, Real Betis, 88000, rare
S. Nakamura, 85, CDM, Japan, Serie A, Lazio, 74000, rare
J. Okonkwo, 84, CB, Nigeria, Premier League, Chelsea, 21000, rare
P. Lindqvist, 84, GK, Sweden, Premier League, Everton, 19500, rare
R. Delgado, 84, LB, Argentina, Serie A, Inter, 18800, rare
C. Whitfield, 84, RB, England, Premier League, Arsenal, 22000, rare
N. Boateng, 84, CM, Ghana, Bundesliga, Leverkusen, 17400, rare
E. Kovacs, 84, LW, Croatia, Ligue 1, Marseille, 16900, rare
V. Sorokin, 84, ST, Ukraine, LALIGA, Villarreal, 20100, rare
H. Aziz, 83, CDM, Morocco, Ligue 1, Lyon, 4200, rare
B. Adeyemi, 83, RM, Nigeria, Premier League, Brighton, 3900, rare
F. Rossi, 83, CB, Italy, Serie A, Roma, 3600, rare
G. Mensah, 83, LB, Ghana, Premier League, Arsenal, 4100, rare
I. Duarte, 83, GK, Portugal, Liga Portugal, Benfica, 3400, rare
O. Lindberg, 83, CM, Denmark, Bundesliga, Frankfurt, 3300
Q. Martins, 83, ST, Brazil, Liga Portugal, Porto, 5100, rare
W. Achebe, 82, CB, Nigeria, LALIGA, Valencia, 1500
Y. Tanaka, 82, RB, Japan, Bundesliga, Stuttgart, 1400
Z. Petrov, 82, LM, Bulgaria, Serie A, Atalanta, 1350
A. Mbeki, 82, CAM, South Africa, Premier League, Fulham, 1900, rare
B. Sorensen, 82, GK, Denmark, Eredivisie, Ajax, 1250
C. Nwosu, 82, ST, Nigeria, Ligue 1, Nice, 2200, rare
D. Keller, 82, CM, Germany, Bundesliga, Wolfsburg, 1300
E. Silva, 81, CB, Brazil, Ligue 1, Rennes, 800
F. Oyelaran, 81, RW, Nigeria, Eredivisie, PSV, 950, rare
G. Novak, 81, CDM, Czech Republic, Serie A, Torino, 780
H. Bakker, 81, LB, Netherlands, Eredivisie, Feyenoord, 760
I. Costa, 81, ST, Portugal, Liga Portugal, Sporting, 1100, rare
J. Fischer, 81, GK, Germany, Bundesliga, Union Berlin, 750
K. Adebayo, 80, CB, Nigeria, EFL Championship, Leeds, 700, rare
L. Hansen, 80, RM, Norway, Eredivisie, AZ, 650
M. Ricci, 80, CM, Italy, Serie A, Bologna, 640
N. Diallo, 80, LW, Senegal, Ligue 1, Lens, 690
O. Byrne, 80, RB, Republic of Ireland, Premier League, Wolves, 700
P. Estrada, 80, ST, Mexico, LALIGA, Girona, 720
Q. Nilsen, 79, CB, Norway, Eredivisie, Twente, 550
R. Ibe, 79, CDM, Nigeria, Liga Portugal, Braga, 600, rare
S. Wagner, 79, LM, Germany, Bundesliga, Mainz, 540
T. Moreno, 79, CAM, Spain, LALIGA, Osasuna, 580
U. Kalu, 78, GK, Nigeria, Premier League, Brentford, 500`;

const { players: club, bad } = E.parseClub(CLUB_TEXT);
const F433 = E.FORMATIONS.find((f) => f.name === '4-3-3');

console.log('── club parsing ──');
ok(bad.length === 0, 'every fixture line parses', `${club.length} players, ${bad.length} rejected`);
ok(club.length === 45, 'club size is 45', `got ${club.length}`);

/* ── club report ──────────────────────────────────────────────── */
console.log('\n── club report ──');
const rep = HQ.clubReport(club);
// counted by hand from the fixture: 88, 87, 86, 86, 85, 85, 85
ok(rep.atLeast[85] === 7, 'seven players rated 85+', `got ${rep.atLeast[85]}`);
ok(rep.atLeast[84] === 14, 'fourteen players rated 84+', `got ${rep.atLeast[84]}`);
ok(rep.atLeast[99] === 0, 'nobody is rated 99', `got ${rep.atLeast[99]}`);
ok(rep.topRating === 88, 'top card is 88', `got ${rep.topRating}`);
ok(rep.untradeables === 2, 'two untradeables', `got ${rep.untradeables}`);
ok(rep.size === club.length, 'report size matches club size');
// value must ignore nothing and match a straight sum of prices
const handValue = club.reduce((s, p) => s + p.price, 0);
ok(rep.value === handValue, 'club value equals the sum of prices', `${rep.value} vs ${handValue}`);
ok(rep.leagues[0].key === 'Premier League' && rep.leagues[0].count === 9,
  'deepest league is Premier League with 9', `${rep.leagues[0].key} ${rep.leagues[0].count}`);

/* Untradeables priced at zero must drop out of the valuation. */
const repFree = HQ.clubReport(club, { untradeMul: 0 });
ok(repFree.value === handValue, 'untradeables already cost 0 here, so value is unchanged', `${repFree.value}`);

/* ── gap analysis ─────────────────────────────────────────────── */
console.log('\n── gap analysis ──');
// "10 players rated 85+" — the club has 7, so this is provably impossible.
const tenEightyFive = [E.newReq('ovr', 'min', 10, '85'), E.newReq('size', 'exact', 11)];
const gap = HQ.explainGap(club, tenEightyFive);
ok(gap.blocking.length === 1, 'a 10x85 requirement is flagged as blocking', `${gap.blocking.length} blocking`);
ok(/Get 3 more/.test(gap.blocking[0].advice), 'advice says exactly how many more are needed', gap.blocking[0].advice);
ok(gap.rows[0].best === 7, 'upper bound is the 7 cards actually owned', `best ${gap.rows[0].best}`);

// 7x85 is exactly reachable, so it must NOT be blocking.
const sevenEightyFive = [E.newReq('ovr', 'min', 7, '85'), E.newReq('size', 'exact', 11)];
ok(HQ.explainGap(club, sevenEightyFive).blocking.length === 0, 'a 7x85 requirement is reachable');

// A rating floor above anything the club can field is blocking.
const rating90 = [E.newReq('rating', 'min', 90), E.newReq('size', 'exact', 11)];
const g90 = HQ.explainGap(club, rating90);
ok(g90.blocking.length === 1, 'an unreachable squad rating is blocking');
ok(g90.rows[0].best < 90, 'reported best possible rating is below the ask', `best ${g90.rows[0].best}`);

// The bound must be the true best XI rating, not a guess.
const top11 = club.map((p) => p.rating).sort((a, b) => b - a).slice(0, 11);
ok(g90.rows[0].best === E.squadRating(top11).rating, 'rating bound equals the top-11 squad rating',
  `${g90.rows[0].best} vs ${E.squadRating(top11).rating}`);

/* ── fodder picks ─────────────────────────────────────────────── */
console.log('\n── fodder ──');
const fod = HQ.fodderPicks(club, 83, 5);
ok(fod.length === 5, 'returns the requested number of fodder cards');
ok(fod.every((p) => p.rating >= 83), 'every fodder card clears the rating floor');
const costs = fod.map((p) => p.price);
ok(costs.every((c, i) => i === 0 || c >= costs[i - 1]), 'fodder is cheapest-first', costs.join(','));

/* ── evolutions ───────────────────────────────────────────────── */
console.log('\n── evolutions ──');
const target = club.find((p) => p.name === 'T. Moreno');   // 79 CAM
const before = { rating: target.rating, pos: target.pos.slice() };
const evolved = HQ.applyEvo(target, 'st');                  // +2 rating, add ST
ok(evolved.rating === 81, 'evolution raises the rating', `${target.rating} → ${evolved.rating}`);
ok(evolved.pos.includes('ST') && evolved.pos.includes('CAM'), 'evolution adds a position and keeps the old one', evolved.pos.join('/'));
ok(evolved.untradeable === true, 'evolved cards are untradeable');
ok(target.rating === before.rating && target.pos.length === before.pos.length,
  'the original card is NOT mutated', `still ${target.rating} ${target.pos.join('/')}`);
ok(HQ.applyEvo(target, 'none').rating === target.rating, '"no evolution" is a no-op');
// rating is capped at 99
const capped = HQ.applyEvo(Object.assign({}, target, { rating: 98 }), 'plus3');
ok(capped.rating === 99, 'evolution cannot push a card past 99', `got ${capped.rating}`);

/* ── collection ───────────────────────────────────────────────── */
console.log('\n── collection ──');
const col = HQ.collectionStats(club);
const pl = col.leagues.find((l) => l.key === 'Premier League');
ok(pl && pl.count === 9 && pl.complete, 'Premier League is complete at 9 of 8', pl && `${pl.count}/${pl.target}`);
ok(col.leagues.every((l) => l.percent <= 100), 'completion never exceeds 100%');

/* ── best XI for a budget (async) ─────────────────────────────── */
console.log('\n── squad builder ──');
const buildOnce = (opts) => new Promise((res) => HQ.buildBestSquad(club, F433, opts, () => {}, res));

const BUDGET = 60000;
const cheap = await buildOnce({ budget: BUDGET, effort: 'fast', untradeMul: 1 });
ok(!cheap.error, 'builds a squad inside a 60k budget', cheap.error || '');
if (cheap.best) {
  ok(cheap.best.squad.length === 11, 'fields 11 players', `${cheap.best.squad.length}`);
  ok(cheap.best.cost <= BUDGET, 'never exceeds the budget', `${cheap.best.cost} ≤ ${BUDGET}`);
  const ids = cheap.best.squad.map((p) => p.id);
  ok(new Set(ids).size === 11, 'never picks the same player twice');
  console.log(`   → rating ${cheap.best.rating.rating} chem ${cheap.best.chem.total} cost ${E.coins(cheap.best.cost)}`);
}

// A bigger budget must not produce a worse squad than a smaller one.
const rich = await buildOnce({ budget: 5000000, effort: 'fast', untradeMul: 1 });
ok(!rich.error && rich.best.rating.rating >= cheap.best.rating.rating,
  'a larger budget is never worse', `${cheap.best.rating.rating} → ${rich.best.rating.rating}`);
console.log(`   → unlimited: rating ${rich.best.rating.rating} chem ${rich.best.chem.total} cost ${E.coins(rich.best.cost)}`);

// An impossible budget must fail honestly rather than return an unaffordable squad.
const broke = await buildOnce({ budget: 1, effort: 'fast', untradeMul: 1 });
ok(!!broke.error || broke.best.cost <= 1, 'an impossible budget errors instead of overspending', broke.error || `cost ${broke.best && broke.best.cost}`);

/* ── multi-SBC planner ────────────────────────────────────────── */
console.log('\n── planner ──');
// Note the two shapes here: sbcA passes the bare array, sbcB passes the whole
// parseSbc result. Both are things a caller will reasonably do, so both must work.
const sbcA = { name: 'League Starter', reqs: E.parseSbc('Squad Rating: Min. 82\nSame League Count: Min. 4\nNumber of players in the Squad: 11', club).reqs };
const sbcB = { name: 'Nation Builder', reqs: E.parseSbc('Squad Rating: Min. 81\nSame Nation Count: Min. 2\nNumber of players in the Squad: 11', club) };
ok(Array.isArray(sbcA.reqs) && sbcA.reqs.length > 0, 'the fixture SBCs actually parsed', `${sbcA.reqs.length} reqs`);
ok(HQ.explainGap(club, E.parseSbc('Squad Rating: Min. 82', club)).rows.length === 1,
  'explainGap accepts a raw parseSbc result as well as an array');
const plan = await new Promise((res) => HQ.planSbcs(club, [sbcA, sbcB], F433, { effort: 'fast' }, () => {}, res));

ok(plan.steps.length === 2, 'the plan covers every SBC given', `${plan.steps.length} steps`);
const solvedSteps = plan.steps.filter((s) => s.solved);
console.log(`   → solved ${plan.solved}/${plan.steps.length}, total ${E.coins(plan.totalCost)}, ${plan.leftover} players left`);
// The whole reason this function exists: no card may be spent twice.
const allUsed = solvedSteps.flatMap((s) => s.squad.map((p) => p.id));
ok(new Set(allUsed).size === allUsed.length, 'no player is spent in two different SBCs',
  `${allUsed.length} used, ${new Set(allUsed).size} distinct`);
ok(plan.leftover === club.length - allUsed.length, 'leftover count matches what the plan consumed',
  `${plan.leftover} = ${club.length} - ${allUsed.length}`);

// An impossible SBC must be reported, not silently dropped.
const impossible = { name: 'Ten 85s', reqs: tenEightyFive };
const plan2 = await new Promise((res) => HQ.planSbcs(club, [impossible], F433, { effort: 'fast' }, () => {}, res));
ok(plan2.steps.length === 1 && !plan2.steps[0].solved, 'an impossible SBC is reported as unsolved');
ok(/can't be met|only have/i.test(plan2.steps[0].reason), 'and says why', plan2.steps[0].reason);

console.log(`\n${failures ? `${failures} FAILURE(S)` : 'ALL CHECKS PASSED'}`);
process.exit(failures ? 1 : 0);
