// End-to-end: plays the built game in a real browser (offline mode, which runs the
// real SQL game server in PGlite inside the page) and checks the core loop works.
//   npm run build && npm run test:e2e
// Screenshots land in ./test-results/.
import { chromium } from 'playwright-core';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const OUT = join(here, '..', 'test-results');
mkdirSync(OUT, { recursive: true });
const PORT = 4199;
const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROME_PATH].find((p) => p && existsSync(p));

let failures = 0;
const step = async (name, fn) => {
  const t = Date.now();
  try {
    await fn();
    console.log(`  ✓ ${name} (${Date.now() - t}ms)`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name}\n      ${e.message.split('\n')[0]}`);
  }
};

async function run(viewport, label, mobile = false) {
  console.log(`\n${label} ${viewport.width}×${viewport.height}`);
  const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  // WebGL runs on the CPU here (SwiftShader), so test on the light renderer; screenshots still show the real scene.
  await ctx.addInitScript((q) => { if (!localStorage.getItem('stt.settings')) localStorage.setItem('stt.settings', JSON.stringify({ quality: q, muted: true })); }, process.env.E2E_QUALITY || 'low');
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errors.push(m.text());
  });
  const shot = (n) => page.screenshot({ path: join(OUT, `${label}-${n}.png`) });
  const click = async (sel) => page.locator(sel).first().click();

  await page.goto(`http://localhost:${PORT}/`);
  await step('title screen', async () => {
    await page.getByTestId('play-offline').waitFor();
    await shot('01-title');
  });
  await step('boots the offline server and asks for a name', async () => {
    await click('[data-testid=play-offline]');
    await page.getByTestId('username').waitFor({ timeout: 60000 });
    await shot('02-join');
  });
  await step('joins the city', async () => {
    await page.getByTestId('username').fill(mobile ? 'PhoneThief' : 'DeskRaider');
    await click('[data-testid=join]');
    await page.getByTestId('world').waitFor({ timeout: 30000 });
    await page.getByTestId('tutorial').waitFor();
    await page.waitForTimeout(1500);
    await shot('03-world-tutorial');
  });
  // helpers that drive the 3D world directly (the sandbox GPU is too slow to walk everywhere)
  const E = (fn, arg) => page.evaluate(fn, arg);
  const tutText = (re, timeout = 15000) => page.getByTestId('tutorial').filter({ hasText: re }).waitFor({ timeout });
  const teleport = (x, z) => E(([x, z]) => window.__stt_engine.teleport(x, z), [x, z]);
  const until = async (fn, timeout = 20000, what = 'condition') => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      if (await E(fn)) return;
      await page.waitForTimeout(250);
    }
    throw new Error('timed out waiting for ' + what);
  };

  await step('tutorial: welcome → your base (3D podium with your TV)', async () => {
    await click('[data-testid=tutorial-next]');
    await tutText(/This is your base/);
    await page.waitForTimeout(1200);
    await shot('04-my-base');
    await click('[data-testid=tutorial-next]');
    await tutText(/Collect your cash/);
  });
  await step('collect: stepping on the plate banks the podium cash', async () => {
    const plate = await E(() => { const pv = window.__stt_engine.plots.get(0); const pod = pv.podiums.find((p) => p.piid); return { x: pod.plate.x, z: pod.plate.z }; });
    await page.waitForTimeout(1500);
    await teleport(plate.x, plate.z);
    await page.waitForTimeout(500);
    await shot('05-collect');
    await tutText(/The Tech Belt/);
    await until(() => window.__stt_state().me.stats.collects > 0, 10000, 'collect');
  });
  await step('belt: walk up to a gadget and BUY it', async () => {
    let bought = false;
    for (let tries = 0; tries < 12 && !bought; tries++) {
      const t = await E(() => {
        const s = window.__stt_state();
        const list = window.__stt_engine.debugState().belt.filter((b) => !b.sold && b.price <= s.me.cash && b.x > -45 && b.x < 35);
        list.sort((a, b) => a.price - b.price);
        return list[0] || null;
      });
      if (!t) { await page.waitForTimeout(1500); continue; }
      await teleport(t.x + 1.6, 2.6);
      await page.waitForTimeout(400);
      const pr = await E(() => window.__stt_engine.debugState().prompt);
      if (pr?.kind === 'belt') {
        await E(() => window.__stt_engine.interact());
        await page.waitForTimeout(700);
        await shot('06-belt-buy');
        bought = await E(() => window.__stt_state().me.stats.belt_buys > 0).catch(() => false);
        if (!bought) { await page.waitForTimeout(1500); bought = await E(() => window.__stt_state().me.stats.belt_buys > 0); }
      }
    }
    if (!bought) throw new Error('could not buy anything off the belt');
    await tutText(/Rarities & mutations/);
  });
  await step('lock: the red pad raises the door lasers', async () => {
    await click('[data-testid=tutorial-next]');
    await tutText(/Lock your base/);
    await page.waitForTimeout(800); // let the tutorial's walk-home land first
    const lp = await E(() => { const d = window.__stt_engine.plots.get(0).def; return { x: d.cx - 6.6 * d.side, z: d.side * (6 + 2.2) }; });
    await teleport(lp.x, lp.z);
    await until(() => { const m = window.__stt_state().me; return !!m.lock_until && new Date(m.lock_until).getTime() > Date.now() + window.__stt_state().serverOffset - 5000; }, 10000, 'lock');
    await page.waitForTimeout(600);
    await shot('07-locked');
    await tutText(/Mystery drops/);
  });
  await step('first drop with the full animation', async () => {
    await click('[data-testid=tutorial-next]');
    await page.getByTestId('open-basic').waitFor();
    await click('[data-testid=open-basic]');
    await page.getByTestId('drop-overlay').waitFor();
    await page.waitForTimeout(700);
    await shot('08-drop-charging');
    await page.getByTestId('drop-close').waitFor({ timeout: 15000 });
    await page.waitForTimeout(500);
    await shot('09-drop-reveal');
    await click('[data-testid=drop-close]');
    await page.keyboard.press('Escape');
    await tutText(/Meet your neighbour/);
  });
  await step('beginner raid: GRAB at RookieRick\'s podium, RUN home, STOLEN', async () => {
    await click('[data-testid=tutorial-next]');
    await tutText(/Grab something/);
    await page.waitForTimeout(1200);
    const t = await E(() => {
      const e = window.__stt_engine;
      const s = window.__stt_state();
      const rk = s.world.find((p) => p.username === 'RookieRick');
      const pv = e.plots.get(e.ownerPlot.get(rk.id).index);
      const pod = pv.podiums.find((p) => p.piid && !p.hidden);
      return { x: pod.plate.x, z: pod.plate.z };
    });
    await teleport(t.x, t.z);
    await until(() => window.__stt_engine.debugState().prompt?.kind === 'steal', 15000, 'steal prompt');
    await shot('10-steal-prompt');
    await click('[data-testid=interact]');
    await page.getByTestId('steal-box').waitFor();
    await page.waitForTimeout(600);
    await shot('11-grabbing');
    await until(() => window.__stt_state().steal?.phase === 'carry', 25000, 'carry phase');
    await page.getByTestId('carry-hud').waitFor();
    await page.waitForTimeout(600);
    await shot('12-carry');
    await tutText(/RUN HOME/);
    await E(() => window.__stt_engine.travelHome());
    await page.getByTestId('steal-result').waitFor({ timeout: 25000 });
    await page.waitForTimeout(500);
    await shot('13-stolen');
    const txt = await page.getByTestId('steal-result').innerText();
    if (!/ITEM STOLEN/.test(txt)) throw new Error('beginner raid did not succeed: ' + txt.slice(0, 80));
    await page.getByText('CONTINUE').first().click();
  });
  await step('tutorial finishes', async () => {
    await tutText(/The market/);
    await click('[data-testid=tutorial-next]');
    await page.waitForTimeout(800);
    await shot('14-market');
    await click('[data-testid=tutorial-next]');
    await page.getByTestId('tutorial').waitFor({ state: 'detached', timeout: 5000 });
  });
  await step('base panel shows displayed items and upgrades', async () => {
    await page.keyboard.press('Escape');
    await click('[data-testid=nav-base]');
    await page.getByText('Base value').first().waitFor();
    await shot('15-base');
    await page.getByText('Upgrades').first().click();
    await page.waitForTimeout(300);
    await shot('16-upgrades');
  });
  await step('every nav panel opens', async () => {
    for (const id of ['drops', 'collection', 'market', 'raid', 'trade', 'leaderboard', 'profile', 'settings']) {
      // On phones Profile and Settings live on the HUD (avatar + gear) to keep the nav bar fitting.
      if (mobile && (id === 'profile' || id === 'settings')) await page.keyboard.press('Escape');
      if (mobile && id === 'profile') await click('.hud-me');
      else if (mobile && id === 'settings') await click('button[title=Settings]');
      else await click(`[data-testid=nav-${id}]`);
      await page.waitForTimeout(700);
      await shot(`17-panel-${id}`);
    }
    await page.keyboard.press('Escape');
  });
  await step('market item page draws a price chart', async () => {
    await click('[data-testid=nav-market]');
    await page.locator('table.tbl tr.click').first().click();
    await page.locator('svg[aria-label="Price history"]').waitFor({ timeout: 10000 });
    await page.getByRole('tab', { name: '30D' }).click();
    await page.waitForTimeout(1200);
    await shot('18-market-item');
    await page.keyboard.press('Escape');
  });
  await step('world walks with the keyboard, zones are reachable', async () => {
    if (mobile) return;
    await E(() => window.__stt_engine.travelHome());
    await page.waitForTimeout(600);
    const before = await E(() => [window.__stt_engine.pos.x, window.__stt_engine.pos.z]);
    await page.keyboard.down('w');
    await page.waitForTimeout(3000);
    await page.keyboard.up('w');
    const after = await E(() => [window.__stt_engine.pos.x, window.__stt_engine.pos.z]);
    if (Math.hypot(after[0] - before[0], after[1] - before[1]) < 0.3) throw new Error(`did not move: ${before} → ${after}`);
    await E(() => window.__stt_engine.travelToZone('drops'));
    await page.waitForTimeout(1200);
    await shot('19-world-drops');
    await E(() => window.__stt_engine.travelToZone('market'));
    await page.waitForTimeout(1200);
    await shot('20-world-market');
    await E(() => window.__stt_engine.travelHome());
  });
  const hold = async (loc, ms = 1300) => {
    const box = await loc.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.mouse.up();
  };
  await step('daily reward can be claimed once', async () => {
    if (mobile) return;
    await click('button[title="Missions & daily reward"]');
    await page.getByTestId('claim-daily').click();
    await page.getByText('CLAIMED — COME BACK TOMORROW').waitFor({ timeout: 8000 });
    await shot('21-quests');
    await page.keyboard.press('Escape');
  });
  await step('list an item on the market, then cancel it', async () => {
    if (mobile) return;
    await click('[data-testid=nav-base]');
    const card = page.locator('.icard').filter({ hasNotText: 'Starter' }).filter({ hasNotText: 'SLOT' }).filter({ hasNotText: '🔥' }).filter({ hasNotText: '★' }).first();
    await card.click();
    await page.getByRole('button', { name: '🏷️ SELL' }).click();
    await page.getByRole('button', { name: 'MARKET', exact: true }).click();
    await page.getByRole('button', { name: /^LIST FOR/ }).click();
    await page.getByText('Listed on the market').first().waitFor({ timeout: 8000 });
    await click('[data-testid=nav-market]');
    await page.getByRole('tab', { name: 'My listings' }).click();
    await page.getByRole('button', { name: 'CANCEL' }).first().waitFor({ timeout: 8000 });
    await shot('22-my-listings');
    await page.getByRole('button', { name: 'CANCEL' }).first().click();
    await page.getByText('You have no active listings').waitFor({ timeout: 8000 });
    await page.keyboard.press('Escape');
  });
  await step('trade with an NPC: two confirmations, NPC answers by itself', async () => {
    if (mobile) return;
    await click('[data-testid=nav-trade]');
    await page.getByRole('tab', { name: 'New trade' }).click();
    await page.locator('.li.click').filter({ hasText: 'PixelPip' }).first().click();
    await page.locator('.icard').nth(0).waitFor();
    // request their cheapest displayed item and offer 3x its value in cash
    const theirs = page.locator('h3:has-text("You request") + .grid .icard').first();
    await theirs.click();
    const val = await theirs.locator('.val').innerText();
    const n = Number(val.replace(/[^0-9.KMB]/g, '').replace('K', 'e3').replace('M', 'e6')) || 1000;
    const me = await page.evaluate(() => window.__stt_state().me.cash);
    await page.getByPlaceholder(/\+ cash \(you have/).fill(String(Math.min(me, Math.ceil(Number(n) * 3))));
    await page.getByRole('button', { name: 'REVIEW OFFER' }).click();
    await page.getByText('FINAL CONFIRMATION').waitFor();
    await shot('23-trade-confirm');
    await hold(page.getByRole('button', { name: 'HOLD TO SEND OFFER' }));
    await page.getByText('Offer sent').first().waitFor({ timeout: 8000 });
    await page.getByRole('tab', { name: 'History' }).click();
    await page.locator('.card .tag', { hasText: /accepted|declined/ }).first().waitFor({ timeout: 40000 });
    await shot('24-trade-history');
    await page.keyboard.press('Escape');
  });
  await step('raid alarm: GRAB (alarm/vault/tag) then CARRY (chase & tag) with a thief in 3D', async () => {
    await E(() => window.__stt_engine.travelHome());
    await page.waitForTimeout(500);
    const set = (phase) => E((phase) => {
      const st = window.__stt_state();
      const pi = st.myItems.find((i) => i.location === 'display' && !i.soulbound) || st.myItems.find((i) => i.location === 'display');
      const bot = st.world.find((p) => p.is_bot && p.username !== 'RookieRick');
      const now = Date.now() + st.serverOffset;
      const iso = (ms) => new Date(now + ms).toISOString();
      window.__stt_store.setState({ last: { ...st.last, incoming_raids: [{ id: '00000000-0000-4000-8000-00000000abcd', attacker: bot.username, attacker_id: bot.id, attacker_bot: true, item_id: pi.item_id, player_item_id: pi.id, started_at: iso(-2000), ends_at: iso(phase === 'grab' ? 10000 : -1000), defended: false, revenge: false, phase, grabbed_at: phase === 'carry' ? iso(-800) : null, carry_until: phase === 'carry' ? iso(40000) : null, deliver_after: phase === 'carry' ? iso(12000) : null }] } });
    }, phase);
    await set('grab');
    await page.getByTestId('raid-alarm').waitFor();
    await page.getByTestId('defend').waitFor();
    await page.waitForTimeout(900);
    await set('grab');
    await shot('25-raid-alarm-grab');
    await set('carry');
    await page.getByTestId('chase').waitFor();
    await page.waitForTimeout(900);
    await set('carry');
    await shot('26-raid-alarm-carry');
    await E(() => { const st = window.__stt_state(); window.__stt_store.setState({ last: { ...st.last, incoming_raids: [] } }); });
  });
  await step('progress survives a reload (IndexedDB save)', async () => {
    const before = await page.evaluate(() => ({ items: window.__stt_state().myItems.length, name: window.__stt_state().me.username }));
    await page.reload();
    await click('[data-testid=play-offline]');
    await page.getByTestId('world').waitFor({ timeout: 60000 });
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => ({ items: window.__stt_state().myItems.length, name: window.__stt_state().me.username }));
    if (after.name !== before.name || after.items !== before.items) throw new Error(`save mismatch ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  });
  await step('no page errors', async () => {
    if (errors.length) throw new Error(errors.slice(0, 5).map((e) => e.slice(0, 300)).join(' || '));
  });
  await browser.close();
}

const server = await serve(PORT, { localPglite: true });
try {
  await run({ width: 1440, height: 900 }, 'desktop');
  await run({ width: 390, height: 844 }, 'mobile', true);
} finally {
  server.close();
}
console.log(failures ? `\n${failures} step(s) failed` : '\nall E2E steps passed');
process.exit(failures ? 1 : 0);
