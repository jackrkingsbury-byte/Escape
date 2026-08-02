import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const URL = 'file://' + path.join(dir, '..', 'index.html');
let failures = 0;
const ok = (c, m, extra='') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}${extra ? '  ← ' + extra : ''}`); if (!c) failures++; };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(URL);

const solve = async () => {
  await page.click('#solveBtn');
  await page.waitForFunction(() => !document.querySelector('#solveBtn').disabled, { timeout: 90000 });
  return page.evaluate(() => ({
    cost: document.querySelectorAll('#scoreline .score')[0].querySelector('.v').textContent,
    rating: +document.querySelectorAll('#scoreline .score')[1].querySelector('.v').textContent,
    exact: document.querySelectorAll('#scoreline .score')[1].querySelector('.s').textContent,
    chem: +document.querySelectorAll('#scoreline .score')[2].querySelector('.v').textContent,
    pass: [...document.querySelectorAll('#checklist .cl')].every(c => c.querySelector('.mk').textContent === 'PASS'),
    names: [...document.querySelectorAll('#pitch .card .nm')].map(n => n.textContent),
    ut: [...document.querySelectorAll('#pitch .card .prc')].filter(p => p.textContent === 'UNTRADEABLE').length,
  }));
};

await page.click('#demoBtn'); await page.waitForTimeout(500);

// ── stability across repeated runs ──
console.log('── repeatability (deep, default options) ──');
const runs = [];
for (let i = 0; i < 3; i++) runs.push(await solve());
runs.forEach((r, i) => console.log(`  run ${i + 1}: ${r.cost}  rating ${r.rating} (${r.exact})  chem ${r.chem}  ${r.pass ? 'all pass' : 'FAILING'}`));
ok(runs.every(r => r.pass), 'every run produces a fully passing squad');
ok(runs.every(r => r.rating >= 84 && r.chem >= 26), 'every run clears rating 84 and chem 26');

// ── safety margin ──
await page.check('#safeChk');
const safe = await solve();
console.log(`\n── rating safety margin on ──\n  ${safe.cost}  rating ${safe.rating} (${safe.exact})  chem ${safe.chem}  ${safe.pass ? 'all pass' : 'FAILING'}`);
const exactNum = parseFloat(safe.exact);
ok(safe.pass, 'safety-margin squad still passes every rule');
ok(exactNum >= 84.5, 'safety margin genuinely clears 84.5', `exact ${exactNum}`);
await page.uncheck('#safeChk');

// ── untradeables valued at full price ──
await page.selectOption('#untradeSel', '1');
const full = await solve();
console.log(`\n── untradeables at full price ──\n  ${full.cost}  untradeables used: ${full.ut}  ${full.pass ? 'all pass' : 'FAILING'}`);
ok(full.pass, 'still passes when untradeables are priced');
await page.selectOption('#untradeSel', '0');

// ── formation change ──
await page.selectOption('#formationSel', { label: '3-5-2' });
const f352 = await solve();
const slots352 = await page.evaluate(() => [...document.querySelectorAll('#pitch .card .slot')].map(s => s.textContent.replace(/\s*⚠/, '')));
console.log(`\n── 3-5-2 ──\n  ${f352.cost}  chem ${f352.chem}  slots: ${slots352.join(' ')}`);
ok(slots352.filter(s => s === 'CB').length === 3 && slots352.filter(s => s === 'ST').length === 2, '3-5-2 renders the right slots');
ok(f352.names.length === 11, '3-5-2 fills 11 slots');
await page.selectOption('#formationSel', { label: '4-3-3' });

// ── strict positions (related positions off) ──
await page.uncheck('#relPosChk');
const strict = await solve();
console.log(`\n── strict positions ──\n  ${strict.cost}  chem ${strict.chem}  ${strict.pass ? 'all pass' : 'not all met'}`);
ok(strict.names.length === 11, 'strict-position run still returns 11');
await page.check('#relPosChk');

// ── exclude icons/heroes on a club that has one ──
const iconTest = await page.evaluate(async () => {
  const ta = document.querySelector('#clubIn');
  ta.value = ta.value + '\nZ. Legend, 91, ST, Brazil, Icons, Icons, 0, icon untradeable';
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
  return document.querySelectorAll('#clubTable tbody tr').length;
});
ok(iconTest === 46, 'icon line parsed', `rows ${iconTest}`);
await page.check('#lockChk');
const noIcon = await solve();
ok(!noIcon.names.includes('Z. Legend'), 'icon excluded when the box is ticked');
await page.uncheck('#lockChk');
const withIcon = await solve();
console.log(`\n── icons ──\n  excluded: ${noIcon.cost} / included: ${withIcon.cost} (icon used: ${withIcon.names.includes('Z. Legend')})`);

// ── persistence across reload ──
await page.reload();
await page.waitForTimeout(600);
const persisted = await page.evaluate(() => ({
  club: document.querySelectorAll('#clubTable tbody tr').length,
  rules: document.querySelectorAll('#reqList .req').length,
}));
ok(persisted.club === 46 && persisted.rules === 6, 'club and SBC survive a reload', JSON.stringify(persisted));

// ── screenshots ──
await page.click('#demoBtn'); await page.waitForTimeout(400);
await solve();
await page.screenshot({ path: path.join(dir, 'shot-desktop.png'), fullPage: true });
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await mob.goto(URL); await mob.waitForTimeout(400);
await mob.click('#demoBtn'); await mob.waitForTimeout(500);
await mob.click('#solveBtn');
await mob.waitForFunction(() => !document.querySelector('#solveBtn').disabled, { timeout: 90000 });
await mob.waitForTimeout(300);
const overflow = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(overflow <= 1, 'no horizontal overflow on a 390px phone', `overflow ${overflow}px`);
await mob.screenshot({ path: path.join(dir, 'shot-mobile.png'), fullPage: true });

// light theme
await page.click('#themeBtn'); await page.waitForTimeout(400);
await page.screenshot({ path: path.join(dir, 'shot-light.png'), fullPage: true });

console.log('\n── console errors ──');
console.log(errors.length ? errors.join('\n') : '(none)');
ok(errors.length === 0, 'no page/console errors');
await browser.close();
console.log(`\n${failures ? `${failures} FAILURE(S)` : 'ALL CHECKS PASSED'}`);
process.exit(failures ? 1 : 0);
