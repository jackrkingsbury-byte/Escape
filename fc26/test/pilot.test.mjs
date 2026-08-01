/* Bookmarklet tests: inject the built payload into a mock FUT Web App and check it
   harvests a virtualised club, reads split label/value requirement rows, ignores decoy
   numbers, and solves. See mock-webapp.html for what this does and does not prove. */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const fc26 = path.join(dir, '..');
let failures = 0;
const ok = (c, m, extra = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}${extra ? '  ← ' + extra : ''}`); if (!c) failures++; };

const payload = fs.readFileSync(path.join(fc26, 'engine.js'), 'utf8') + '\n' + fs.readFileSync(path.join(fc26, 'pilot.src.js'), 'utf8');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });

await page.goto('file://' + path.join(dir, 'mock-webapp.html'));
await page.waitForTimeout(200);

const expected = await page.evaluate(() => window.__PLAYERS.length);
console.log(`mock club: ${expected} players in a virtualised list\n`);

// ── inject, exactly as the bookmarklet would ──
await page.evaluate(payload);
const panelUp = await page.evaluate(() => !!document.getElementById('sbc-autopilot-host'));
ok(panelUp, 'panel injects');

const P = async (sel) => page.evaluate(s => {
  const r = document.getElementById('sbc-autopilot-host').shadowRoot;
  const el = r.getElementById(s);
  return el ? (el.value !== undefined && el.tagName !== 'BUTTON' ? el.value : el.textContent.trim()) : null;
}, sel);
const click = async (sel) => page.evaluate(s => document.getElementById('sbc-autopilot-host').shadowRoot.getElementById(s).click(), sel);

// ── harvest while scrolling the virtualised list ──
await click('harv');
for (let y = 0; y <= 64 * 104; y += 400) {
  await page.evaluate(v => { document.getElementById('vp').scrollTop = v; }, y);
  await page.waitForTimeout(150);
}
await page.waitForTimeout(900);
await click('harv'); // stop

const club = await page.evaluate(() => window.__SBC_PILOT__.store.list.map(p => ({
  name: p.name, rating: p.rating, pos: p.pos, club: p.club, league: p.league, nation: p.nation, rare: p.rare, price: p.price })));
console.log(`harvested ${club.length} players`);
console.log('sample:', JSON.stringify(club.slice(0, 3), null, 1));
console.log('status:', await P('clubSt'));

ok(club.length === expected, `harvested every player from the virtualised list`, `${club.length}/${expected}`);
ok(club.every(p => p.rating >= 40 && p.rating <= 99), 'no decoy numbers became players');
ok(club.every(p => p.pos.length > 0), 'every player has a position');
ok(club.every(p => /^club#\d+$/.test(p.club)), 'club id pulled from the crest URL');
ok(club.every(p => /^league#\d+$/.test(p.league)), 'league id pulled from the league URL');
ok(club.every(p => /^nation#\d+$/.test(p.nation)), 'nation id pulled from the flag URL');
ok(club.every(p => p.price > 0), 'every player has an estimated value');

// harvested data must match the source of truth, not just look plausible
const truth = await page.evaluate(() => window.__PLAYERS.map(p => ({ name: p.name, rating: p.rating, club: 'club#' + p.club, league: 'league#' + p.league, nation: 'nation#' + p.nation })));
const byName = Object.fromEntries(club.map(p => [p.name, p]));
const mismatch = truth.filter(t => { const h = byName[t.name]; return !h || h.rating !== t.rating || h.club !== t.club || h.league !== t.league || h.nation !== t.nation; });
ok(mismatch.length === 0, 'harvested rating/club/league/nation match the mock data exactly', mismatch.length ? JSON.stringify(mismatch[0]) : '');

// ── requirements off split label/value rows ──
await click('read');
await page.waitForTimeout(400);
const sbcTxt = await P('sbcTxt');
const sbcSt = await P('sbcSt');
console.log('\nscraped lines:\n' + sbcTxt.split('\n').map(l => '  ' + l).join('\n'));
console.log('parsed:', sbcSt);
const rules = await page.evaluate(() => {
  const t = document.getElementById('sbc-autopilot-host').shadowRoot.getElementById('sbcSt').textContent;
  return t;
});
ok(/rating at least 84/i.test(rules), 'squad rating read off a split label/value row');
ok(/chemistry at least 26/i.test(rules), 'chemistry read');
ok(/league count at least 4/i.test(rules), 'same league count read');
ok(/nation count at least 2/i.test(rules), 'same nation count read');
ok(/rare players at least 5/i.test(rules), 'rare read');

// ── formation autodetect ──
const form = await page.evaluate(() => { const r = document.getElementById('sbc-autopilot-host').shadowRoot; const s = r.getElementById('form'); return s.options[s.selectedIndex].textContent; });
ok(form === '4-3-3', 'formation detected from the page text', form);

// ── solve ──
await click('solve');
await page.waitForFunction(() => !document.getElementById('sbc-autopilot-host').shadowRoot.getElementById('solve').disabled, { timeout: 90000 });
await page.waitForTimeout(200);
const res = await page.evaluate(() => {
  const r = document.getElementById('sbc-autopilot-host').shadowRoot;
  return {
    status: r.getElementById('solveSt').textContent.trim(),
    summary: r.querySelector('#res .st').textContent.trim(),
    rows: [...r.querySelectorAll('#res table tr')].map(tr => [...tr.children].map(td => td.textContent.trim())),
    checks: [...r.querySelectorAll('#res .cl')].map(c => c.textContent.trim()),
  };
});
console.log('\n' + res.summary);
res.rows.forEach(r => console.log('  ' + r.join('  ')));
res.checks.forEach(c => console.log('  ' + c));
console.log('status:', res.status);

ok(res.rows.length === 11, 'eleven players returned', `${res.rows.length}`);
ok(res.checks.length === 5, 'five rules checked');
ok(res.checks.every(c => c.startsWith('PASS')), 'every rule passes');

// the squad must be real players from the mock club, at their real ratings
const squadNames = res.rows.map(r => r[2]);
const bad = squadNames.filter(n => !byName[n]);
ok(bad.length === 0, 'every returned player exists in the harvested club', bad.join(', '));
const ratingsMatch = res.rows.every(r => byName[r[2]] && String(byName[r[2]].rating) === r[1]);
ok(ratingsMatch, 'displayed ratings match the harvested players');
ok(new Set(squadNames).size === 11, 'no player used twice');

// independently recompute the squad rating from the mock's own data
const verify = await page.evaluate(names => {
  const src = window.__PLAYERS.filter(p => names.includes(p.name));
  const sum = src.reduce((a, p) => a + p.rating, 0), avg = sum / 11;
  const excess = src.reduce((a, p) => a + Math.max(0, p.rating - avg), 0);
  return { rating: Math.floor((sum + excess) / 11), n: src.length };
}, squadNames);
const shown = +(res.summary.match(/rating (\d+)/) || [])[1];
console.log('\nindependent check:', verify, 'shown:', shown);
ok(verify.n === 11, 'all eleven resolve back to mock players');
ok(verify.rating === shown, 'squad rating recomputed from source data matches', `${shown} vs ${verify.rating}`);
ok(verify.rating >= 84, 'the 84 rating requirement is genuinely met');

// ── re-running the bookmarklet toggles rather than stacking panels ──
await page.evaluate(payload);
const hosts = await page.evaluate(() => document.querySelectorAll('#sbc-autopilot-host').length);
ok(hosts === 1, 'running it twice does not stack a second panel', `${hosts} hosts`);

// ── it must not have touched the host page ──
const untouched = await page.evaluate(() => ({
  players: window.__PLAYERS.length,
  sbcRows: document.querySelectorAll('#sbc .r7f').length,
  tiles: document.querySelectorAll('.k2p').length > 0,
}));
ok(untouched.players === expected && untouched.sbcRows === 6 && untouched.tiles, 'host page left intact');

console.log('\nconsole errors:', errors.length ? errors.join('\n') : '(none)');
ok(errors.length === 0, 'no page/console errors');

await page.screenshot({ path: path.join(dir, 'shot-pilot.png') });
await browser.close();
console.log(`\n${failures ? `${failures} FAILURE(S)` : 'ALL CHECKS PASSED'}`);
process.exit(failures ? 1 : 0);
