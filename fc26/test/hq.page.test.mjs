/* Club HQ page test — drives the real page in a real browser, the same way
   the solver page is tested. Logic lives in test/hq.test.mjs; this checks the
   page actually wires that logic to something a person can use. */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const URL = 'file://' + path.join(dir, '..', 'hq.html');

let failures = 0;
const ok = (c, m, extra = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}${extra ? '  ← ' + extra : ''}`);
  if (!c) failures++;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text());
});
await page.goto(URL);
await page.waitForTimeout(400);

/* ── club intake ── */
console.log('── club intake ──');
await page.click('#demoBtn');
await page.waitForTimeout(500);
const pills = await page.textContent('#clubPills');
ok(/45 players/.test(pills), 'demo club parses to 45 players', pills.trim());

/* ── report tab ── */
console.log('\n── club report ──');
const tiles = await page.$$eval('#repTiles .tile', (ns) => ns.map((n) => n.querySelector('.k').textContent + '=' + n.querySelector('.v').textContent));
ok(tiles.some((t) => t === 'Rated 85+=7'), 'report shows the 7 cards rated 85+', tiles.join(' '));
ok(tiles.some((t) => /^Players=45$/.test(t)), 'report shows the club size', tiles.join(' '));
const bandCount = await page.$$eval('#repBands .barrow', (n) => n.length);
ok(bandCount > 0, 'rating-depth bars render', `${bandCount} bars`);

/* A bar that renders as an empty track is worse than no bar — assert the fill
   has real width and that it actually scales with the value. */
const fills = await page.$$eval('#repBands .barrow', (rows) => rows.map((r) => ({
  label: r.querySelector('.lbl').textContent,
  n: +r.querySelector('.n').textContent,
  w: Math.round(r.querySelector('.fill').getBoundingClientRect().width),
})));
ok(fills.every((f) => f.w > 0), 'every bar has a visible fill', fills.map((f) => `${f.label}:${f.w}px`).join(' '));
const widest = fills.reduce((a, b) => (b.n > a.n ? b : a));
const narrowest = fills.reduce((a, b) => (b.n < a.n ? b : a));
ok(widest.w > narrowest.w, 'bar width tracks the value', `${narrowest.label}=${narrowest.w}px vs ${widest.label}=${widest.w}px`);
const leagueTop = await page.textContent('#repLeagues .barrow .lbl');
ok(leagueTop.trim() === 'Premier League', 'deepest league is listed first', leagueTop.trim());

/* ── best XI ── */
console.log('\n── best XI ──');
await page.click('#tab-squad');
await page.fill('#budgetIn', '60k');
await page.click('#buildBtn');
await page.waitForFunction(() => !document.querySelector('#buildBtn').disabled, { timeout: 90000 });
await page.waitForTimeout(200);
const squad = await page.evaluate(() => ({
  cards: document.querySelectorAll('#squadOut .card .nm').length,
  cost: (document.querySelector('#squadOut .score .v') || {}).textContent,
  rating: +(document.querySelectorAll('#squadOut .score .v')[1] || {}).textContent,
}));
ok(squad.cards === 11, 'the pitch shows 11 players', `${squad.cards} cards`);
ok(squad.rating >= 80, 'the squad has a sensible rating', `rating ${squad.rating}`);
console.log(`   → ${squad.cost} for a rating-${squad.rating} XI`);

/* Rendering into the DOM is not the same as being on screen — .result is
   display:none until it gets .on, so assert real layout, not just markup. */
const seen = await page.evaluate(() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  };
  return { out: box('#squadOut'), card: box('#squadOut .card'), pitch: box('#squadOut .pitch') };
});
ok(seen.out && seen.out.h > 0, 'the result block actually has height on screen', JSON.stringify(seen.out));
ok(seen.card && seen.card.w > 0 && seen.card.h > 0, 'a player card is genuinely visible', JSON.stringify(seen.card));
await page.locator('#squadOut .card').first().waitFor({ state: 'visible', timeout: 5000 })
  .then(() => ok(true, 'Playwright agrees the squad is visible'))
  .catch((e) => ok(false, 'Playwright agrees the squad is visible', String(e.message).slice(0, 60)));

// A budget nothing can satisfy must say so rather than render an unaffordable squad.
await page.fill('#budgetIn', '1');
await page.click('#buildBtn');
await page.waitForFunction(() => !document.querySelector('#buildBtn').disabled, { timeout: 90000 });
const brokeText = await page.textContent('#squadOut');
ok(/No squad fits/.test(brokeText), 'an impossible budget is reported honestly', brokeText.trim().slice(0, 60));

/* ── planner ── */
console.log('\n── SBC plan ──');
await page.click('#tab-planner');
await page.click('#planBtn');
await page.waitForFunction(() => !document.querySelector('#planBtn').disabled, { timeout: 120000 });
await page.waitForTimeout(200);
const plan = await page.evaluate(() => ({
  verdict: (document.querySelector('#planOut .verdict') || {}).textContent || '',
  steps: document.querySelectorAll('#planOut .pstep').length,
  solved: document.querySelectorAll('#planOut .pstep.ok').length,
  names: [...document.querySelectorAll('#planOut .pstep.ok .names')].map((n) => n.textContent),
}));
ok(plan.steps === 2, 'both example SBCs appear in the plan', `${plan.steps} steps`);
ok(plan.solved === 2, 'both are solved from the demo club', `${plan.solved} solved`);
ok(/Solved/.test(plan.verdict), 'a summary verdict is shown', plan.verdict.trim().slice(0, 70));

// The point of the planner: the two squads must not share a player.
const rosters = plan.names.map((t) => t.split('·').map((s) => s.trim().replace(/\s+\d+$/, '')));
const overlap = rosters.length === 2 ? rosters[0].filter((n) => rosters[1].includes(n)) : ['(missing)'];
ok(overlap.length === 0, 'the two squads share no player', overlap.join(', ') || 'none');

/* ── what am I missing ── */
console.log('\n── what am I missing ──');
await page.click('#tab-gaps');
await page.click('#gapBtn');
await page.waitForTimeout(400);
const gap = await page.evaluate(() => ({
  verdict: (document.querySelector('#gapOut .verdict') || {}).textContent || '',
  short: [...document.querySelectorAll('#gapOut .gaprow.no .adv')].map((n) => n.textContent.trim()),
}));
ok(/Not possible/.test(gap.verdict), 'an impossible SBC is called impossible', gap.verdict.trim().slice(0, 60));
ok(gap.short.some((s) => /Get 3 more/.test(s)), 'it says exactly how many more 85s are needed', gap.short.join(' | '));

/* ── evolutions ── */
console.log('\n── evolutions ──');
await page.click('#tab-evo');
await page.waitForTimeout(200);
await page.selectOption('#evoSel', 'st');           // +2 rating, add ST
const evo = await page.evaluate(() => {
  const v = [...document.querySelectorAll('#evoOut .score .v')].map((n) => n.textContent);
  return { before: +v[0], after: +v[1], gain: v[2], verdict: (document.querySelector('#evoOut .verdict') || {}).textContent || '' };
});
ok(evo.after === evo.before + 2, 'the evolution applies +2 rating', `${evo.before} → ${evo.after}`);
ok(/untradeable/i.test(evo.verdict), 'it warns the card becomes untradeable');

// Applying an evolution must not corrupt the club the other tabs read.
await page.click('#tab-report');
await page.waitForTimeout(200);
const tilesAfter = await page.$$eval('#repTiles .tile', (ns) => ns.map((n) => n.querySelector('.k').textContent + '=' + n.querySelector('.v').textContent));
ok(tilesAfter.some((t) => /^Players=45$/.test(t)), 'the club is unchanged after previewing an evolution', tilesAfter.join(' '));

/* ── collection ── */
console.log('\n── collection ──');
await page.click('#tab-collection');
await page.waitForTimeout(200);
const col = await page.evaluate(() => ({
  tiles: [...document.querySelectorAll('#colTiles .tile .v')].map((n) => +n.textContent),
  rows: document.querySelectorAll('#colLeagues .barrow').length,
}));
ok(col.rows > 0, 'league progress bars render', `${col.rows} rows`);
ok(col.tiles[0] >= 1, 'at least one league is fully linked', `${col.tiles[0]} complete`);

/* ── persistence + the club is shared with the solver page ── */
console.log('\n── persistence ──');
await page.reload();
await page.waitForTimeout(600);
const afterReload = await page.textContent('#clubPills');
ok(/45 players/.test(afterReload), 'the club survives a reload', afterReload.trim());

/* ── mobile ── */
console.log('\n── mobile ──');
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await mob.goto(URL);
await mob.waitForTimeout(400);
await mob.click('#demoBtn');
await mob.waitForTimeout(500);
let worst = 0;
for (const tab of ['report', 'squad', 'planner', 'gaps', 'evo', 'collection']) {
  await mob.click('#tab-' + tab);
  await mob.waitForTimeout(150);
  const o = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (o > worst) worst = o;
  ok(o <= 1, `no horizontal overflow on the ${tab} tab`, `overflow ${o}px`);
}
await mob.screenshot({ path: path.join(dir, 'shot-hq-mobile.png'), fullPage: true });
await page.screenshot({ path: path.join(dir, 'shot-hq.png'), fullPage: true });

console.log('\n── console errors ──');
console.log(errors.length ? errors.join('\n') : '(none)');
ok(errors.length === 0, 'no page/console errors');

await browser.close();
console.log(`\n${failures ? `${failures} FAILURE(S)` : 'ALL CHECKS PASSED'}`);
process.exit(failures ? 1 : 0);
