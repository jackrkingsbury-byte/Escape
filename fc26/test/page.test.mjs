import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));

const URL = 'file://' + path.join(dir, '..', 'index.html');
let failures = 0;
const ok = (c, m, extra='') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}${extra ? '  ← ' + extra : ''}`); if (!c) failures++; };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
// the sandbox has no network, so the Google Fonts <link> fails — not a code fault
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });

await page.goto(URL);
await page.waitForTimeout(300);

// ── 1. demo load + club parsing ──────────────────────────────────
await page.click('#demoBtn');
await page.waitForTimeout(600);

const clubInfo = await page.evaluate(() => ({
  pills: [...document.querySelectorAll('#clubPills .pill')].map(p => p.textContent.trim()),
  rows: document.querySelectorAll('#clubTable tbody tr').length,
}));
console.log('\n── club ──');
console.log(clubInfo.pills.join('\n'));
ok(clubInfo.rows === 45, `all 45 demo players parsed`, `got ${clubInfo.rows}`);
ok(!clubInfo.pills.some(p => p.includes('skipped')), 'no skipped lines');
ok(!clubInfo.pills.some(p => p.includes('missing')), 'no missing club/league/nation');

// spot-check a parsed row: fields must land in the right columns
const row = await page.evaluate(() => {
  const tds = [...document.querySelectorAll('#clubTable tbody tr')][0].querySelectorAll('td');
  return [...tds].map(td => td.textContent.trim());
});
console.log('first row:', JSON.stringify(row));
ok(row[0] === 'K. Oduya' && row[1] === '88' && row[2] === 'ST' && row[3] === 'Nigeria'
   && row[4] === 'Premier League' && row[5] === 'Arsenal' && row[6] === 'UT' && row[7].includes('R'),
   'columns map correctly (name/ovr/pos/nation/league/club/price/tags)');

// ── 2. SBC requirement parsing ───────────────────────────────────
const parsed = await page.evaluate(() =>
  [...document.querySelectorAll('#reqList .req')].map(r => ({
    kind: r.querySelector('[data-f=kind]').value,
    op: r.querySelector('[data-f=op]').value,
    value: r.querySelector('[data-f=value]').value,
    param: r.querySelector('[data-f=param]')?.value ?? '',
  })));
console.log('\n── parsed SBC rules ──');
parsed.forEach(p => console.log(' ', JSON.stringify(p)));
const has = (kind, op, value) => parsed.some(p => p.kind === kind && p.op === op && String(p.value) === String(value));
ok(has('rating', 'min', 84), 'Squad Rating: Min. 84');
ok(has('chem', 'min', 26), 'Team Chemistry: Min. 26');
ok(has('sameLeague', 'min', 4), 'Same League Count: Min. 4');
ok(has('sameNation', 'min', 2), 'Same Nation Count: Min. 2');
ok(has('rare', 'min', 5), 'Rare: Min. 5');
ok(has('size', 'exactly', 11), 'Number of players in the Squad: 11');
ok(parsed.length === 6, 'exactly 6 rules, no junk', `got ${parsed.length}`);

// ── 3. other requirement phrasings ───────────────────────────────
const phrasings = await page.evaluate(async () => {
  const ta = document.querySelector('#sbcIn');
  const set = v => { ta.value = v; ta.dispatchEvent(new Event('input', { bubbles: true })); };
  const read = () => [...document.querySelectorAll('#reqList .req')].map(r => ({
    kind: r.querySelector('[data-f=kind]').value, op: r.querySelector('[data-f=op]').value,
    value: r.querySelector('[data-f=value]').value, param: r.querySelector('[data-f=param]')?.value ?? '' }));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const cases = [
    'Min. Squad Rating: 87',
    'Same League Count: Max. 3',
    'Nations: Max. 4',
    'Clubs: Min. 5',
    'Premier League Players: Min. 3',
    'Nationality: Brazil  Min. 1',
    '85+ OVR Players: Min. 2',
    'Player Quality: Exactly Gold',
    'Team of the Week Players: Min. 1',
  ];
  const out = [];
  for (const c of cases) { set(c); await wait(340); out.push({ input: c, rules: read() }); }
  return out;
});
console.log('\n── phrasings ──');
phrasings.forEach(p => console.log(`  "${p.input}"  →  ${p.rules.map(r => `${r.kind}/${r.op}/${r.value}${r.param ? '/' + r.param : ''}`).join(', ') || 'NOTHING'}`));
const m = (i, kind, op, value, param) => {
  const r = phrasings[i].rules[0];
  return r && r.kind === kind && r.op === op && String(r.value) === String(value) && (param === undefined || r.param === param);
};
ok(m(0, 'rating', 'min', 87), '"Min. Squad Rating: 87"');
ok(m(1, 'sameLeague', 'max', 3), '"Same League Count: Max. 3"');
ok(m(2, 'distinctNations', 'max', 4), '"Nations: Max. 4"');
ok(m(3, 'distinctClubs', 'min', 5), '"Clubs: Min. 5"');
ok(m(4, 'namedLeague', 'min', 3, 'Premier League'), '"Premier League Players: Min. 3"');
ok(m(5, 'namedNation', 'min', 1, 'Brazil'), '"Nationality: Brazil Min. 1"');
ok(m(6, 'ovr', 'min', 2, '85'), '"85+ OVR Players: Min. 2"');
ok(m(7, 'quality', 'min', 11, 'gold'), '"Player Quality: Exactly Gold"');
ok(m(8, 'special', 'min', 1), '"Team of the Week Players: Min. 1"');

// ── 4. solve the demo SBC ────────────────────────────────────────
await page.evaluate(() => { document.querySelector('#demoBtn').click(); });
await page.waitForTimeout(500);
const t0 = Date.now();
await page.click('#solveBtn');
await page.waitForSelector('#result.on', { timeout: 60000 });
await page.waitForFunction(() => !document.querySelector('#solveBtn').disabled, { timeout: 60000 });
const elapsed = Date.now() - t0;

const res = await page.evaluate(() => ({
  scores: [...document.querySelectorAll('#scoreline .score')].map(s => s.querySelector('.k').textContent + '=' + s.querySelector('.v').textContent + ' (' + s.querySelector('.s').textContent + ')'),
  checks: [...document.querySelectorAll('#checklist .cl')].map(c => c.querySelector('.mk').textContent + ' · ' + c.querySelector('.lbl').textContent + ' · ' + c.querySelector('.val').textContent),
  cards: [...document.querySelectorAll('#pitch .card')].map(c => ({
    slot: c.querySelector('.slot').textContent.trim(),
    ovr: c.querySelector('.ovr')?.textContent,
    name: c.querySelector('.nm')?.textContent,
    chem: c.querySelectorAll('.chem i.on').length,
    oop: c.classList.contains('oop'),
  })),
  note: document.querySelector('#solveNote').textContent,
}));
console.log(`\n── solve (${elapsed} ms) ──`);
console.log(res.scores.join('\n'));
console.log(res.checks.join('\n'));
console.log('squad:'); res.cards.forEach(c => console.log(`  ${c.slot.padEnd(6)} ${c.ovr} ${c.name}  chem ${c.chem}${c.oop ? '  OOP' : ''}`));
console.log('note:', res.note);

ok(res.cards.length === 11, '11 cards on the pitch', `got ${res.cards.length}`);
ok(res.cards.every(c => c.name), 'every slot filled');
ok(res.checks.length === 5, '5 checkable rules (size is structural)', `got ${res.checks.length}`);
ok(res.checks.every(c => c.startsWith('PASS')), 'every rule passes');
ok(elapsed < 30000, 'solves in under 30s', `${elapsed} ms`);

// ── 5. independently verify the reported rating & chemistry ──────
const verify = await page.evaluate(() => {
  const names = [...document.querySelectorAll('#pitch .card .nm')].map(n => n.textContent);
  const rows = [...document.querySelectorAll('#clubTable tbody tr')].map(tr => {
    const td = [...tr.querySelectorAll('td')].map(x => x.textContent.trim());
    return { name: td[0], ovr: +td[1], nation: td[3], league: td[4], club: td[5] };
  });
  const sq = names.map(n => rows.find(r => r.name === n));
  const sum = sq.reduce((a, p) => a + p.ovr, 0), avg = sum / 11;
  const excess = sq.reduce((a, p) => a + Math.max(0, p.ovr - avg), 0);
  const cnt = (f, v) => sq.filter(p => p[f] === v).length;
  return {
    rating: Math.floor((sum + excess) / 11),
    exact: ((sum + excess) / 11).toFixed(2),
    maxLeague: Math.max(...sq.map(p => cnt('league', p.league))),
    maxNation: Math.max(...sq.map(p => cnt('nation', p.nation))),
    reportedRating: +document.querySelectorAll('#scoreline .score')[1].querySelector('.v').textContent,
    reportedExact: document.querySelectorAll('#scoreline .score')[1].querySelector('.s').textContent,
    reportedChem: +document.querySelectorAll('#scoreline .score')[2].querySelector('.v').textContent,
    cardChemSum: [...document.querySelectorAll('#pitch .card')].reduce((a, c) => a + c.querySelectorAll('.chem i.on').length, 0),
  };
});
console.log('\n── independent check ──');
console.log(verify);
ok(verify.rating === verify.reportedRating, 'squad rating matches recomputation', `${verify.reportedRating} vs ${verify.rating}`);
ok(verify.reportedExact.includes(verify.exact), 'exact decimal matches', `${verify.reportedExact} vs ${verify.exact}`);
ok(verify.reportedChem === verify.cardChemSum, 'headline chemistry equals sum of per-card chem');
ok(verify.maxLeague >= 4, 'same-league rule genuinely satisfied in the squad', `max league group ${verify.maxLeague}`);
ok(verify.maxNation >= 2, 'same-nation rule genuinely satisfied', `max nation group ${verify.maxNation}`);

// ── 6. loose-format club parsing (no header, mixed separators) ───
const loose = await page.evaluate(async () => {
  const ta = document.querySelector('#clubIn');
  ta.value = `L. Moreau  86  CM,CAM  France  Ligue 1  Paris  74k
D. Vasquez | 83 | CB | Spain | LALIGA | Sevilla | 1.9k | rare
U. Kalu\t78\tGK\tNigeria\tPremier League\tBrentford\t500\tut`;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
  return [...document.querySelectorAll('#clubTable tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(x => x.textContent.trim()));
});
console.log('\n── loose formats ──');
loose.forEach(r => console.log(' ', JSON.stringify(r)));
ok(loose.length === 3, 'all three loose lines parsed', `got ${loose.length}`);
ok(loose[0] && loose[0][1] === '86' && loose[0][2] === 'CM/CAM' && loose[0][4] === 'Ligue 1' && loose[0][6] === '74K', 'space-separated + 74k price');
ok(loose[1] && loose[1][5] === 'Sevilla' && loose[1][6] === '1,900', 'pipe-separated + 1.9k price');
ok(loose[2] && loose[2][6] === 'UT' && loose[2][2] === 'GK', 'tab-separated + ut tag');

// ── 7. an impossible SBC must fail loudly, not silently ──────────
const impossible = await page.evaluate(async () => {
  document.querySelector('#demoBtn').click();
  await new Promise(r => setTimeout(r, 400));
  const ta = document.querySelector('#sbcIn');
  ta.value = 'Squad Rating: Min. 99';
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
  document.querySelector('#solveBtn').click();
  await new Promise(res => {
    const iv = setInterval(() => { if (!document.querySelector('#solveBtn').disabled) { clearInterval(iv); res(); } }, 200);
  });
  return {
    note: document.querySelector('#solveNote').textContent,
    checks: [...document.querySelectorAll('#checklist .cl')].map(c => c.querySelector('.mk').textContent),
    sub: document.querySelector('#resultSub').textContent,
  };
});
console.log('\n── impossible SBC ──');
console.log(impossible);
ok(impossible.checks.includes('FAIL'), 'unreachable rule reported as FAIL, not a fake pass');
ok(/closest|short|No fully passing/i.test(impossible.note + impossible.sub), 'user is told it did not fully pass');

console.log('\n── console errors ──');
console.log(errors.length ? errors.join('\n') : '(none)');
ok(errors.length === 0, 'no page/console errors');

await browser.close();
console.log(`\n${failures ? `${failures} FAILURE(S)` : 'ALL CHECKS PASSED'}`);
process.exit(failures ? 1 : 0);
