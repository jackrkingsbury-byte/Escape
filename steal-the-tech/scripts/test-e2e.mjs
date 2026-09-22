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
  const browser = await chromium.launch({ executablePath: exe });
  const ctx = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1 });
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
  await step('tutorial steps 1–5 and the first-drop cash', async () => {
    for (let i = 0; i < 5; i++) {
      await click('[data-testid=tutorial-next]');
      await page.waitForTimeout(500);
    }
    await page.getByTestId('open-basic').waitFor();
    await shot('04-drops-panel');
  });
  await step('opens the first drop with the full animation', async () => {
    await click('[data-testid=open-basic]');
    await page.getByTestId('drop-overlay').waitFor();
    await page.waitForTimeout(700);
    await shot('05-drop-charging');
    await page.getByTestId('drop-close').waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);
    await shot('06-drop-reveal');
    await click('[data-testid=drop-close]');
  });
  await step('tutorial advances after the drop and walks to a neighbour', async () => {
    await page.getByText('Rarities').first().waitFor({ timeout: 10000 });
    await click('[data-testid=tutorial-next]'); // rarities → neighbour
    await page.waitForTimeout(1200);
    await shot('07-neighbour');
    await click('[data-testid=tutorial-next]'); // → stealing
    await click('[data-testid=tutorial-next]'); // → beginner raid (opens visit panel)
    await page.getByTestId('steal').first().waitFor({ timeout: 15000 });
    await shot('08-visit-base');
  });
  await step('beginner raid: STEALING… then ITEM STOLEN', async () => {
    await page.getByTestId('steal').first().click();
    await page.getByTestId('steal-box').waitFor();
    await page.waitForTimeout(1500);
    await shot('09-stealing');
    await page.getByTestId('steal-result').waitFor({ timeout: 20000 });
    await shot('10-steal-result');
    const txt = await page.getByTestId('steal-result').innerText();
    if (!/ITEM STOLEN/.test(txt)) throw new Error('beginner raid did not succeed: ' + txt.slice(0, 80));
    await page.getByText('CONTINUE').first().click();
  });
  await step('tutorial finishes', async () => {
    await page.getByText('The market').first().waitFor({ timeout: 10000 });
    await click('[data-testid=tutorial-next]');
    await page.waitForTimeout(800);
    await shot('11-market');
    await click('[data-testid=tutorial-next]');
    await page.getByTestId('tutorial').waitFor({ state: 'detached', timeout: 5000 });
  });
  await step('base panel shows displayed items and upgrades', async () => {
    await page.keyboard.press('Escape');
    await click('[data-testid=nav-base]');
    await page.getByText('Base value').first().waitFor();
    await shot('12-base');
    await page.getByText('Upgrades').first().click();
    await page.waitForTimeout(300);
    await shot('13-upgrades');
  });
  await step('every nav panel opens', async () => {
    for (const id of ['drops', 'collection', 'market', 'raid', 'trade', 'leaderboard', 'profile', 'settings']) {
      // On phones Profile and Settings live on the HUD (avatar + gear) to keep the nav bar fitting.
      if (mobile && (id === 'profile' || id === 'settings')) await page.keyboard.press('Escape');
      if (mobile && id === 'profile') await click('.hud-me');
      else if (mobile && id === 'settings') await click('button[title=Settings]');
      else await click(`[data-testid=nav-${id}]`);
      await page.waitForTimeout(700);
      await shot(`14-panel-${id}`);
    }
    await page.keyboard.press('Escape');
  });
  await step('market item page draws a price chart', async () => {
    await click('[data-testid=nav-market]');
    await page.locator('table.tbl tr.click').first().click();
    await page.locator('svg[aria-label="Price history"]').waitFor({ timeout: 10000 });
    await page.getByRole('tab', { name: '30D' }).click();
    await page.waitForTimeout(1200);
    await shot('15-market-item');
    await page.keyboard.press('Escape');
  });
  await step('world walks with the keyboard', async () => {
    if (mobile) return;
    const before = await page.evaluate(() => [window.__stt_engine.px, window.__stt_engine.py]);
    await page.keyboard.down('w');
    await page.waitForTimeout(900);
    await page.keyboard.up('w');
    const after = await page.evaluate(() => [window.__stt_engine.px, window.__stt_engine.py]);
    if (!(after[1] < before[1] - 50)) throw new Error(`did not move: ${before} → ${after}`);
    await page.evaluate(() => window.__stt_engine.travelToZone('drops'));
    await page.waitForTimeout(900);
    await shot('16-world-drops');
    await page.evaluate(() => window.__stt_engine.travelToZone('market'));
    await page.waitForTimeout(900);
    await shot('17-world-market');
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
    await shot('18-quests');
    await page.keyboard.press('Escape');
  });
  await step('list an item on the market, then cancel it', async () => {
    if (mobile) return;
    await click('[data-testid=nav-base]');
    const card = page.locator('.icard').filter({ hasNotText: 'Starter' }).filter({ hasNotText: 'SLOT' }).first();
    await card.click();
    await page.getByRole('button', { name: '🏷️ SELL' }).click();
    await page.getByRole('button', { name: 'MARKET', exact: true }).click();
    await page.getByRole('button', { name: /^LIST FOR/ }).click();
    await page.getByText('Listed on the market').first().waitFor({ timeout: 8000 });
    await click('[data-testid=nav-market]');
    await page.getByRole('tab', { name: 'My listings' }).click();
    await page.getByRole('button', { name: 'CANCEL' }).first().waitFor({ timeout: 8000 });
    await shot('19-my-listings');
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
    await shot('20-trade-confirm');
    await hold(page.getByRole('button', { name: 'HOLD TO SEND OFFER' }));
    await page.getByText('Offer sent').first().waitFor({ timeout: 8000 });
    await page.getByRole('tab', { name: 'History' }).click();
    await page.locator('.card .tag', { hasText: /accepted|declined/ }).first().waitFor({ timeout: 40000 });
    await shot('21-trade-history');
    await page.keyboard.press('Escape');
  });
  await step('raid alarm renders with DEFEND / VAULT buttons', async () => {
    await page.evaluate(() => {
      const st = window.__stt_state();
      const pi = st.myItems.find((i) => i.location === 'display' && !i.soulbound) || st.myItems[0];
      const now = Date.now() + st.serverOffset;
      window.__stt_store.setState({ last: { ...st.last, incoming_raids: [{ id: '00000000-0000-4000-8000-00000000abcd', attacker: 'ChromeCobra', attacker_id: 'x', attacker_bot: true, item_id: pi.item_id, player_item_id: pi.id, started_at: new Date(now).toISOString(), ends_at: new Date(now + 12000).toISOString(), defended: false, revenge: false }] } });
    });
    await page.getByTestId('raid-alarm').waitFor();
    await page.waitForTimeout(600);
    await shot('22-raid-alarm');
    await page.evaluate(() => { const st = window.__stt_state(); window.__stt_store.setState({ last: { ...st.last, incoming_raids: [] } }); });
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
