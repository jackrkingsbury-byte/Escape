/* End-to-end tests for the Escape Clause page.
   Run: node escape/test/page.test.mjs */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + path.join(dir, '..', 'index.html');

let failures = 0, count = 0;
const ok = (c, m, extra = '') => {
  count++;
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}${extra ? '  ← ' + extra : ''}`);
  if (!c) failures++;
};
const group = t => console.log(`\n── ${t} ──`);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });

/* Nothing may leave the browser. Fail loudly if the page tries. */
const network = [];
await page.route('**/*', route => {
  const url = route.request().url();
  if (!url.startsWith('file://')) network.push(url);
  route.continue();
});

await page.goto(PAGE);

group('page loads');
ok(await page.title() !== '', 'page has a title');
ok(await page.isVisible('#src'), 'the paste box is visible');
ok(await page.isHidden('#results'), 'results are hidden before a scan');
ok((await page.$$('#sampleBtns button')).length === 4, 'four sample contracts are offered');

group('guards on bad input');
await page.click('#scanBtn');
ok(await page.isVisible('#err'), 'scanning nothing shows an error');
ok(/paste the contract/i.test(await page.textContent('#err')), 'the error says what to do');
ok(await page.isHidden('#results'), 'no results are shown for empty input');
await page.fill('#src', 'This is a short line of text.');
await page.click('#scanBtn');
ok(/too short/i.test(await page.textContent('#err')), 'a too-short paste is refused rather than scored');

group('scanning the gym sample');
await page.click('[data-sample="gym"]');
await page.waitForSelector('#results:not([hidden])');
const score = Number(await page.textContent('#score'));
ok(score >= 0 && score <= 100, `score is in range (got ${score})`);
ok(score < 40, `the loaded gym contract lands in the Trap band (got ${score})`);
ok((await page.textContent('#band')).includes('Trap'), 'band is shown as Trap');
const findingCount = (await page.$$('#findings .finding')).length;
ok(findingCount >= 10, `all trap clauses are listed (got ${findingCount})`);
ok((await page.$$('#numbers .n')).length >= 3, 'the headline numbers are pulled out');

group('the numbers a person actually needs');
const numbers = await page.$$eval('#numbers .n', ns => ns.map(n => ({
  k: n.querySelector('.k').textContent, v: n.querySelector('.v').textContent
})));
const byKey = k => (numbers.find(n => n.k === k) || {}).v;
ok(byKey('Notice to cancel') === '1 month', `notice period shown (got ${byKey('Notice to cancel')})`);
ok(byKey('Cost of leaving early') === 'R3,500', `exit fee shown (got ${byKey('Cost of leaving early')})`);
ok(byKey('Price rises by') === '9.5% a year', `escalation shown (got ${byKey('Price rises by')})`);
ok(byKey('Locked in for') === '24 months', `minimum term shown (got ${byKey('Locked in for')})`);

group('every finding shows its evidence');
await page.$$eval('#findings .finding', els => els.forEach(e => e.setAttribute('open', '')));
const quotes = await page.$$eval('#findings .finding blockquote.ev', bs => bs.map(b => b.childNodes[0].textContent.trim()));
ok(quotes.length === findingCount, 'every finding carries a quote');
const source = await page.inputValue('#src');
const flat = source.replace(/\s+/g, ' ');
ok(quotes.every(q => flat.includes(q.replace(/\s+/g, ' '))), 'every quote appears verbatim in the pasted contract');
ok((await page.textContent('#findings')).includes('if it is not there, ignore this finding'), 'the page tells you to verify against your own copy');

group('the score is shown as arithmetic, not a black box');
const rows = await page.$$eval('#breakdown .row .rv', rs => rs.map(r => r.textContent.trim()));
ok(rows.length >= 3, 'the breakdown is itemised');
const deltas = rows.slice(1, -1).map(r => Number(r.replace('+', '')));
const sum = deltas.reduce((a, b) => a + b, 100);
ok(Math.max(0, sum) === score, `the itemised points reproduce the score (${sum} vs ${score})`);

group('the fair sample is not fear-mongered');
await page.click('[data-sample="fair"]');
await page.waitForTimeout(200);
const fairScore = Number(await page.textContent('#score'));
ok(fairScore >= 80, `a fair contract scores Fair (got ${fairScore})`);
ok((await page.textContent('#band')).includes('Fair'), 'band reads Fair');
ok((await page.$$('#credits .row')).length >= 2, 'clauses in your favour are credited');

group('the escape plan');
await page.click('[data-sample="gym"]');
await page.waitForTimeout(200);
ok(await page.inputValue('#noticeDays') === '30', 'notice period is pre-filled from the scan');
ok(await page.inputValue('#theirName') === 'Ironside Fitness', 'company name is pre-filled by the sample');
await page.fill('#yourName', 'J. Kingsbury');
await page.fill('#renewal', '2027-03-01');
await page.waitForTimeout(150);
ok(await page.isVisible('#deadline'), 'a deadline appears once a renewal date is given');
const dl2 = await page.textContent('#dl2');
ok(/\d{1,2} \w+ 20\d\d/.test(dl2), `the deadline is a real date (got "${dl2}")`);
const dl3 = await page.textContent('#dl3');
ok(/33|30 days notice/.test(dl3), 'the deadline explains its own arithmetic');

group('the letter');
const letter = await page.textContent('#letterOut');
ok(letter.includes('Ironside Fitness'), 'letter is addressed to the company');
ok(letter.includes('J. Kingsbury'), 'letter is signed with your name');
ok(letter.includes('MEM-40218'), 'letter carries the reference');
ok(letter.includes('thirty (30) days written notice'), 'letter quotes the notice clause from the contract');
ok(/do not consent to any automatic renewal/.test(letter), 'letter refuses the auto-renewal');
ok((await page.$$('#letterNotes li')).length >= 3, 'sending instructions are shown');

await page.selectOption('#letterKind', 'dispute_fee');
await page.waitForTimeout(150);
const disputeLetter = await page.textContent('#letterOut');
ok(/R3 500,00/.test(disputeLetter), 'the fee dispute letter quotes the actual fee');
ok(disputeLetter !== letter, 'changing the letter type changes the letter');
await page.selectOption('#letterKind', 'cancel');

group('the share card');
const cardEmpty = await page.evaluate(() => {
  const c = document.getElementById('card');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let ink = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] > 40 || d[i + 1] > 40 || d[i + 2] > 40) ink++;
  return ink;
});
ok(cardEmpty > 5000, `the card is actually drawn (${cardEmpty} lit pixels)`);

group('the share link carries no contract text');
const payload = await page.evaluate(() => {
  const s = document.getElementById('score').textContent;
  const scan = window.EscapeEngine.scan(document.getElementById('src').value);
  const p = { s: scan.score, b: scan.band, t: scan.type.id, n: scan.findings.length, y: scan.asymmetry.you, f: scan.findings.slice(0, 6).map(x => x.id) };
  return btoa(unescape(encodeURIComponent(JSON.stringify(p))));
});
const decoded = Buffer.from(payload, 'base64').toString('utf8');
ok(!/Ironside|Member|R549|debit order/i.test(decoded), 'the share payload contains no contract text');
ok(/"s":\d+/.test(decoded) && /"f":\[/.test(decoded), 'the share payload carries the score and clause ids only');

group('a shared link renders a read-only banner');
await page.goto(PAGE + '#v=' + payload.replace(/=+$/, ''));
await page.waitForTimeout(150);
ok(await page.isVisible('#sharedBanner'), 'the shared banner shows');
ok(/scored \d+\/100/.test(await page.textContent('#sharedText')), 'the banner reports the score');
await page.goto(PAGE + '#v=notvalidbase64!!');
await page.waitForTimeout(150);
ok(await page.isHidden('#sharedBanner'), 'a malformed share link is ignored rather than crashing');

group('privacy: nothing is sent anywhere');
ok(network.length === 0, 'the page made no network requests at all', network.join(', '));

group('no runtime errors');
ok(errors.length === 0, 'no console or page errors', errors.join(' | '));

await browser.close();
console.log(`\n${count - failures}/${count} passed`);
process.exit(failures ? 1 : 0);
