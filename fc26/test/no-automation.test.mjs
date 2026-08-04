/* THE SAFETY TEST.

   Everything that gets a FUT account banned is an *action*: talking to EA's
   servers on your behalf, clicking things for you, submitting a squad, opening
   a pack. This tool's whole defence is that it does none of that — it reads the
   page you already opened and does maths on what it read.

   That defence is only worth something if it is enforced, so this suite does two
   things: it greps the payload for the constructs that would break the promise,
   and then it proves the promise at runtime — inject the real payload into the
   mock web app, drive it, and assert that not one network request left the page
   and not one synthetic click landed on the host document.

   If you are adding a feature and this suite fails, the feature is the problem.  */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const fc26 = path.join(dir, '..');
let failures = 0;
const ok = (c, m, extra = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}${extra ? '  ← ' + extra : ''}`);
  if (!c) failures++;
};

/* ── 1. static scan ────────────────────────────────────────────────
   Source files that end up running inside EA's page. Comments are stripped
   first so that *describing* the ban in a comment doesn't trip the scan. */
const IN_PAGE_FILES = ['engine.js', 'hq.js', 'pilot.src.js', 'sbc-autopilot.user.js'];

const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n');

/* Each rule is a thing that would turn "reads the page" into "acts for you". */
const BANNED = [
  { re: /\bfetch\s*\(/,                 why: 'fetch() — a request to EA on your behalf' },
  { re: /\bXMLHttpRequest\b/,           why: 'XMLHttpRequest — a request to EA on your behalf' },
  { re: /\bWebSocket\b/,                why: 'WebSocket — a live connection to EA' },
  { re: /sendBeacon\s*\(/,              why: 'sendBeacon — data leaving the page' },
  { re: /\.\s*submit\s*\(/,             why: 'form submit — acting for you' },
  { re: /\bnew\s+Image\s*\(\s*\)[\s\S]{0,80}\.src\s*=/, why: 'image-pixel exfiltration' },
  { re: /\bimportScripts\s*\(/,         why: 'importScripts — loading remote code' },
  { re: /\beval\s*\(/,                  why: 'eval — arbitrary code execution' },
  { re: /new\s+Function\s*\(/,          why: 'new Function — arbitrary code execution' },
];

/* Clicking is the sharpest line: reading is fine, clicking is automation. The
   panel legitimately clicks its OWN controls, so a bare `.click()` is only a
   failure when it targets the host page rather than the panel's shadow root. */
const CLICK_RE = /\.click\s*\(\s*\)/g;

console.log('── static scan ──');
for (const f of IN_PAGE_FILES) {
  const full = path.join(fc26, f);
  if (!fs.existsSync(full)) { ok(false, `${f} exists to be scanned`); continue; }
  const src = stripComments(fs.readFileSync(full, 'utf8'));

  const hits = BANNED.filter((b) => b.re.test(src));
  ok(hits.length === 0, `${f} contains no network or code-execution calls`,
    hits.map((h) => h.why).join('; '));

  // any .click() must be on something the panel owns, not on EA's DOM
  const clicks = [...src.matchAll(CLICK_RE)].map((m) => {
    const before = src.slice(Math.max(0, m.index - 90), m.index);
    return { before, ours: /shadowRoot|\$\(|getElementById\(['"](?:sbc-|hq-)/.test(before) };
  });
  const foreign = clicks.filter((c) => !c.ours);
  ok(foreign.length === 0, `${f} never clicks anything on the host page`,
    foreign.length ? `${foreign.length} suspicious click(s)` : `${clicks.length} own-control click(s)`);
}

/* The userscript header must not grant itself cross-origin powers. */
const userscript = fs.readFileSync(path.join(fc26, 'sbc-autopilot.user.js'), 'utf8');
const header = userscript.slice(0, userscript.indexOf('==/UserScript=='));
ok(/@grant\s+none/.test(header), 'userscript grants no privileged APIs');
ok(!/@connect\b/.test(header), 'userscript declares no @connect hosts');
ok(!/GM_xmlhttpRequest|GM\.xmlHttpRequest/.test(userscript), 'userscript never uses GM_xmlhttpRequest');

/* Auditing the source proves nothing if the shipped artifact was built from
   something else. build.mjs only strips comments and indentation, so every
   function declared in the sources must survive verbatim into the userscript —
   if it doesn't, the artifact is stale or was hand-edited. Either way the scan
   above was checking the wrong bytes. */
const declared = (src) => [...stripComments(src).matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]);
const shipped = new Set(declared(userscript));
const missing = ['engine.js', 'pilot.src.js']
  .flatMap((f) => declared(fs.readFileSync(path.join(fc26, f), 'utf8')).map((n) => ({ f, n })))
  .filter(({ n }) => !shipped.has(n));
ok(missing.length === 0, 'the shipped bookmarklet was built from these exact sources',
  missing.length ? `missing: ${missing.slice(0, 5).map((m) => `${m.n} (${m.f})`).join(', ')} — run node fc26/build.mjs` : 'in sync');

/* ── 2. runtime proof ──────────────────────────────────────────────
   Static scans can be fooled by string-built names. Actually run the thing. */
console.log('\n── runtime proof ──');
const payload = fs.readFileSync(path.join(fc26, 'engine.js'), 'utf8')
  + '\n' + fs.readFileSync(path.join(fc26, 'pilot.src.js'), 'utf8');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

/* Record every request the page attempts. The mock is a file:// page with no
   assets of its own, so anything here came from the payload. */
const requests = [];
context.on('request', (r) => {
  const u = r.url();
  if (u.startsWith('file://') || u === 'about:blank') return;  // the page itself
  requests.push(`${r.method()} ${u}`);
});

const page = await context.newPage();
await page.goto('file://' + path.join(dir, 'mock-webapp.html'));
await page.waitForTimeout(200);

/* Fingerprint the host page BEFORE injection so we can prove afterwards that
   the tool read it without rearranging it. */
const before = await page.evaluate(() => ({
  players: window.__PLAYERS.length,
  bodyChildren: document.body.children.length,
  inputs: [...document.querySelectorAll('input')].map((i) => i.value).join('|'),
}));

/* Count clicks the payload fires at the host document. Real user clicks come
   through Playwright and are not isTrusted:false, so this only catches synthetic
   ones — which is exactly what automation would use. */
await page.evaluate(() => {
  window.__synthetic = 0;
  document.addEventListener('click', (e) => {
    const host = document.getElementById('sbc-autopilot-host');
    if (e.isTrusted) return;                      // a genuine user click
    if (host && e.composedPath().includes(host)) return;  // the panel's own UI
    window.__synthetic++;
  }, true);
});

await page.evaluate(payload);
await page.waitForTimeout(300);

const host = await page.evaluate(() => !!document.getElementById('sbc-autopilot-host'));
ok(host, 'payload injected and the panel is up');

// Drive the tool the way a user would: harvest the club, then solve.
const click = (sel) => page.evaluate(
  (s) => document.getElementById('sbc-autopilot-host').shadowRoot.getElementById(s).click(), sel);
await click('harv');
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(180);
}
await click('harv');
await click('reparse').catch(() => {});
await click('solve').catch(() => {});
await page.waitForTimeout(2500);

const synthetic = await page.evaluate(() => window.__synthetic);

ok(requests.length === 0, 'the payload made ZERO network requests',
  requests.length ? requests.slice(0, 4).join(' | ') : 'none');
ok(synthetic === 0, 'the payload fired ZERO synthetic clicks at the host page',
  `${synthetic} synthetic`);

/* The host page must be left as it was found. The panel mounts on
   <html>, deliberately outside <body>, so body must be untouched. */
const after = await page.evaluate(() => ({
  players: window.__PLAYERS.length,
  bodyChildren: document.body.children.length,
  inputs: [...document.querySelectorAll('input')].map((i) => i.value).join('|'),
  hostOutsideBody: (() => {
    const h = document.getElementById('sbc-autopilot-host');
    return !!h && h.parentElement === document.documentElement;
  })(),
}));
ok(after.players === before.players, "the club list was read, not modified",
  `${before.players} → ${after.players}`);
ok(after.bodyChildren === before.bodyChildren, 'nothing was added to or removed from <body>',
  `${before.bodyChildren} → ${after.bodyChildren}`);
ok(after.inputs === before.inputs, 'no input on the host page was written to');
ok(after.hostOutsideBody, 'the panel mounts outside <body>, so it cannot disturb the app');

await browser.close();
console.log(`\n${failures ? `${failures} FAILURE(S)` : 'ALL CHECKS PASSED — read-only, no network, no automation'}`);
process.exit(failures ? 1 : 0);
