// Screenshot a dev page.  Usage:
//   node tools/snap.mjs dev/characters.html out/preview/chars.png [--w=540] [--h=960] [--q="a=1&b=2"] [--timeout=60000]
// The page must set `window.__ready = true` once it has rendered the frame to capture.
// Console errors from the page are printed so you can debug.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, CHROME_ARGS, ROOT } from './serve.mjs';

const [page_, out, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => { const m = a.match(/^--([^=]+)=(.*)$/); return m ? [m[1], m[2]] : [a, true]; }));
const W = +(opt.w || 540), H = +(opt.h || 960);
const { srv, url } = await startServer();
const browser = await chromium.launch({ args: CHROME_ARGS });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log(`[page ${m.type()}]`, m.text()); });
page.on('pageerror', (e) => console.log('[page error]', e.message));
const t0 = Date.now();
await page.goto(`${url}/${page_}${opt.q ? '?' + opt.q : ''}`);
await page.waitForFunction('window.__ready === true', null, { timeout: +(opt.timeout || 60000) });
fs.mkdirSync(path.dirname(path.resolve(ROOT, out)), { recursive: true });
await page.screenshot({ path: path.resolve(ROOT, out) });
console.log('saved', out, `${Date.now() - t0}ms`);
await browser.close(); srv.close();
