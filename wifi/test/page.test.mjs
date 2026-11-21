/* WiFi Check page test: drives the real page in a real browser.
   A local mock stands in for Cloudflare's speed servers (throttled to about
   200 Mbps), so the speed test runs end to end with the real engine.
   Run: node wifi/test/page.test.mjs        (screenshots land in $SHOTS if set) */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const SHOTS = process.env.SHOTS || '';

let failures = 0;
const ok = (c, m, extra = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}${extra !== '' ? '  ← ' + extra : ''}`);
  if (!c) failures++;
};

/* static server for wifi/ */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.txt': 'text/plain', '.css': 'text/css' };
const site = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

/* mock speed server: /__down?bytes=N and /__up, ~25 MB/s each way */
const RATE = 25e6; // bytes per second
const CHUNK = Buffer.alloc(256 * 1024, 120);
const cors = { 'access-control-allow-origin': '*', 'timing-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'cache-control': 'no-store' };
let downs = 0, ups = 0;
const speed = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (u.pathname === '/__down') {
    downs++;
    let left = Number(u.searchParams.get('bytes') || 0);
    res.writeHead(200, { ...cors, 'content-type': 'application/octet-stream', 'content-length': String(left) });
    if (!left) return setTimeout(() => res.end(), 12); // ~12 ms "ping"
    const pump = () => {
      if (left <= 0) return res.end();
      const n = Math.min(left, CHUNK.length);
      left -= n;
      res.write(n === CHUNK.length ? CHUNK : CHUNK.subarray(0, n));
      setTimeout(pump, (n / RATE) * 1000);
    };
    return setTimeout(pump, 12);
  }
  if (u.pathname === '/__up') {
    ups++;
    const start = Date.now();
    let got = 0;
    req.on('data', (c) => { got += c.length; });
    req.on('end', () => {
      const wait = Math.max(0, (got / RATE) * 1000 - (Date.now() - start));
      setTimeout(() => { res.writeHead(200, { ...cors, 'content-type': 'text/plain' }); res.end('ok'); }, wait + 12);
    });
    return;
  }
  res.writeHead(404, cors); res.end();
});

await new Promise((r) => site.listen(0, '127.0.0.1', r));
await new Promise((r) => speed.listen(0, '127.0.0.1', r));
const SITE = `http://127.0.0.1:${site.address().port}`;
const SPEED = `http://127.0.0.1:${speed.address().port}`;
const URL_ = `${SITE}/index.html?speedtarget=${encodeURIComponent(SPEED)}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const errors = [];
const outside = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('request', (r) => {
  const h = new URL(r.url()).host;
  if (!/^127\.0\.0\.1/.test(h) && !/fonts\.(googleapis|gstatic)\.com/.test(h)) outside.push(r.url());
});
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: '' }));

await page.goto(URL_);
await page.waitForTimeout(300);

console.log('── first load ──');
ok(await page.isVisible('#v-speed'), 'speed view shows first');
ok(/run a test/i.test(await page.textContent('#diagHead')), 'diagnosis asks for a test');
ok(await page.isHidden('#histPanel'), 'no history yet');
ok(await page.isHidden('#roomField'), 'room box hidden while "next to router"');

console.log('── speed test next to the router ──');
await page.fill('#plan', '500');
await page.click('#runBtn');
ok((await page.textContent('#runBtn')) === 'Stop', 'button turns into Stop while running');
await page.waitForFunction(() => /Done|No result|Timed out/.test(document.querySelector('#phase').textContent), null, { timeout: 95000 });
ok((await page.textContent('#phase')) === 'Done', 'test finishes', await page.textContent('#phase'));
ok(downs > 10 && ups > 5, 'engine really hit the download and upload endpoints', `${downs} down, ${ups} up`);
const down = await page.evaluate(() => JSON.parse(localStorage.getItem('wifiCheck.v1')).tests.at(-1));
ok(down.down > 60 && down.down < 400, 'download measured near the mock’s ~200 Mbps', down.down.toFixed(1));
ok(down.up > 30 && down.up < 400, 'upload measured', down.up.toFixed(1));
ok(down.ping > 0 && down.ping < 200, 'ping measured', down.ping);
ok(down.near === true && down.room === 'Next to router', 'saved as next to router');
ok(await page.isVisible('#histPanel') && (await page.$$('#histBody tr')).length === 1, 'history shows one test');
ok(/% of your plan/.test(await page.textContent('#results')), 'compares with the plan');
ok((await page.$$('.acts li')).length === 5, 'five "good for" lines');
ok(/next to the router/i.test(await page.textContent('#diagHead')), 'diagnosis: slow next to router on a 500 plan', await page.textContent('#diagHead'));
ok((await page.$$('#topFixes a')).length === 3, 'three top fixes linked');
if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'speed.png'), fullPage: true });

console.log('── second test from the bedroom ──');
await page.click('#whereFar');
ok(await page.isVisible('#roomField'), 'room box appears');
await page.fill('#room', 'Bedroom');
// Make the next test slower so the app sees a big drop away from the router.
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('wifiCheck.v1'));
  s.plan = 0; s.tests.push({ t: Date.now(), near: false, room: 'Bedroom', down: 22, up: 6, ping: 30, jitter: 8, loadedPing: 60 });
  localStorage.setItem('wifiCheck.v1', JSON.stringify(s));
});
await page.reload();
await page.waitForTimeout(300);
ok(/doesn.t reach the bedroom/i.test(await page.textContent('#diagHead')), 'diagnosis blames the signal in the bedroom', await page.textContent('#diagHead'));
ok((await page.$$('#histBody tr')).length === 2, 'two tests in history');
ok(await page.isVisible('#roomField') && (await page.inputValue('#room')) === 'Bedroom', 'room choice remembered');

console.log('── fixes ──');
await page.click('#topFixes a >> nth=0');
await page.waitForTimeout(400);
ok(await page.isVisible('#v-fix'), 'top fix opens the fixes view');
ok((await page.textContent('.sec-title')) === 'Recommended for you', 'recommended section first');
const firstFix = await page.getAttribute('#fixList article', 'id');
ok(firstFix === 'fix-move', 'first recommended fix is moving the router', firstFix);
ok((await page.$$('#fixList article')).length === 12, 'all 12 fixes listed');
ok(/I.m getting \d+ Mbps download/.test(await page.textContent('#fix-isp')), 'provider script filled in with real numbers');
await page.check('[data-done="restart"]');
await page.reload();
await page.waitForTimeout(300);
ok(await page.isChecked('[data-done="restart"]'), 'done tick survives a reload');
ok(await page.$eval('#fix-restart', (e) => e.classList.contains('done')), 'done fix is struck through');

console.log('── who’s on it ──');
await page.click('.tab[data-view="devices"]');
await page.waitForTimeout(200);
ok(await page.isVisible('#v-devices'), 'devices view opens');
await page.click('[data-r="sky"]');
ok(/Broadband Buddy/.test(await page.textContent('#routerCard')), 'router guide for Sky');
ok((await page.getAttribute('#routerCard a.btn-primary', 'href')) === 'http://192.168.0.1', 'router page button');
await page.click('#osWin');
ok(/Get-NetNeighbor/.test(await page.textContent('#script')), 'Windows scan script shown');
await page.click('#osMac');
const macScript = await page.textContent('#script');
ok(/arp -a/.test(macScript) && /\$\{gw%\.\*\}/.test(macScript), 'Mac scan script shown, shell syntax intact');
await page.click('#copyScript');
ok(/arp -a/.test(await page.evaluate(() => navigator.clipboard.readText())), 'Copy puts the script on the clipboard');

const scan1 = `GATEWAY 192.168.0.1
192.168.0.1 00-19-FB-11-22-33
192.168.0.12 F0-B4-79-AA-BB-CC Jacks-iPhone
192.168.0.20 7C-BB-8A-01-02-03
192.168.0.31 DA-A1-19-44-55-66
192.168.0.40 24-A1-60-01-02-03`;
await page.evaluate((t) => navigator.clipboard.writeText(t), scan1);
await page.click('#pasteBtn');
await page.waitForSelector('#devPanel:not([hidden])');
await page.waitForTimeout(300);
const cards = await page.$$eval('.dev', (els) => els.map((e) => e.innerText));
ok(cards.length === 5, 'five devices listed', cards.length);
ok(/Your router/.test(cards[0]) && /Router/.test(cards[0]), 'router first and labelled');
ok(cards.some((c) => /Jacks-iPhone/.test(c) && /Apple/.test(c)), 'hostname + Apple maker');
ok(cards.some((c) => /Nintendo Switch/.test(c)), 'Nintendo → Switch');
ok(cards.some((c) => /private address/i.test(c)), 'private address explained');
ok(cards.some((c) => /Smart home gadget/.test(c) && /Espressif/.test(c)), 'Espressif → smart home gadget');
ok(!cards.some((c) => /New/.test(c.split('\n').slice(0, 4).join(' ')) && !/Router/.test(c)), 'nothing "new" on the first scan');

await page.fill('.dev[data-mac="7C:BB:8A:01:02:03"] [data-nick]', 'Living room Switch');
await page.press('.dev[data-mac="7C:BB:8A:01:02:03"] [data-nick]', 'Enter');
await page.click('.dev[data-mac="7C:BB:8A:01:02:03"] [data-mine="yes"]');
await page.click('.dev[data-mac="24:A1:60:01:02:03"] [data-mine="no"]');
ok(/1 marked yours|2 marked yours/.test(await page.textContent('#devSummary')), 'summary counts yours', await page.textContent('#devSummary'));
ok(/1 you don.t know/.test(await page.textContent('#devSummary')), 'summary counts unknown');
ok(await page.$eval('.dev[data-mac="24:A1:60:01:02:03"]', (e) => e.classList.contains('unsure')), 'unknown device highlighted');

await page.reload();
await page.waitForTimeout(200);
await page.click('.tab[data-view="devices"]');
await page.fill('#scanText', scan1 + '\n192.168.0.55 B8-27-EB-77-88-99 raspberrypi');
await page.click('#showDevs');
await page.waitForTimeout(300);
const cards2 = await page.$$eval('.dev', (els) => els.map((e) => e.innerText));
ok(cards2.some((c) => /Living room Switch/.test(c)), 'nickname remembered across reloads');
ok(cards2.some((c) => /raspberrypi/.test(c) && /New/.test(c)), 'device not seen before is flagged New');
ok(/1 new since last scan/.test(await page.textContent('#devSummary')), 'summary counts new devices');
if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'devices.png'), fullPage: true });

await page.fill('#scanText', 'nothing useful here');
await page.click('#showDevs');
ok(await page.isVisible('#devErr'), 'junk paste shows a helpful error');

console.log('── phone layout + dark mode ──');
const phone = await browser.newPage({ viewport: { width: 375, height: 800 } });
await phone.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: '' }));
for (const v of ['speed', 'devices', 'fix']) {
  await phone.goto(`${SITE}/index.html#${v}`);
  await phone.waitForTimeout(250);
  const over = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(over <= 0, `no sideways scroll on a phone (${v})`, over);
}
await phone.click('#themeBtn');
ok((await phone.getAttribute('html', 'data-theme')) === 'dark' || (await phone.getAttribute('html', 'data-theme')) === 'light', 'theme toggles');
if (SHOTS) {
  await phone.goto(`${SITE}/index.html#speed`);
  await phone.evaluate(() => { const s = JSON.parse(localStorage.getItem('wifiCheck.v1') || '{}'); s.theme = 'dark'; localStorage.setItem('wifiCheck.v1', JSON.stringify(s)); });
  await phone.reload(); await phone.waitForTimeout(300);
  await phone.screenshot({ path: path.join(SHOTS, 'phone-dark.png'), fullPage: true });
}

console.log('── hygiene ──');
ok(errors.length === 0, 'no page errors', errors.join(' | '));
ok(outside.length === 0, 'no requests to anywhere but the page, the test server and fonts', outside.slice(0, 3).join(' '));

await browser.close();
site.close(); speed.close();
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
