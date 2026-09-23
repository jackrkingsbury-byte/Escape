// Full server test-suite against a real PostgreSQL (the same engine Supabase runs).
//   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/stt_test npm run test:sql
// The database is wiped (schema game + auth dropped) and rebuilt from the migrations.
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { loadSql, test, summary, assert, eq, rejects } from './sql-harness.mjs';

const url = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stt_test';
const pool = new pg.Pool({ connectionString: url, max: 12 });
pg.types.setTypeParser(20, (v) => Number(v)); // bigint → number (test values are small)

async function su(sql, params = []) {
  const r = await pool.query(sql, params);
  return r.rows;
}
async function one(sql, params = []) {
  return (await su(sql, params))[0];
}

// Call a public RPC as a signed-in player (exactly like PostgREST does).
async function rpc(uid, fn, p = {}) {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query('set local role authenticated');
    if (uid) await c.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid]);
    const r = await c.query(`select public.${fn}($1::jsonb) as r`, [JSON.stringify(p)]);
    await c.query('commit');
    return r.rows[0].r;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
// Run arbitrary SQL as an authenticated player (for anti-cheat probes).
async function asPlayer(uid, sql, params = []) {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query('set local role authenticated');
    await c.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid]);
    const r = await c.query(sql, params);
    await c.query('commit');
    return r.rows;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

const cash = async (id) => (await one('select cash from game.profiles where id = $1', [id])).cash;
const ownerOf = async (piid) => (await one('select owner_id from game.player_items where id = $1', [piid]))?.owner_id;
async function giveItem(uid, itemId, place = true) {
  const r = await one('select game._grant($1, $2, $3) as id', [uid, itemId, 'test']);
  if (place) await su('select game._autoplace($1, $2)', [uid, r.id]);
  return r.id;
}
async function expireRaid(raidId) {
  await su(`update game.raids set ends_at = now() - interval '1 second' where id = $1`, [raidId]);
}

async function reset() {
  await su('drop schema if exists game cascade');
  await su('drop schema if exists auth cascade');
  await su(`do $$ declare f record; begin
    for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname like 'stt\\_%' loop
      execute 'drop function ' || f.sig; end loop; end $$`);
  for (const { file, sql } of loadSql(true)) {
    try {
      await su(sql);
    } catch (e) {
      throw new Error(`${file}: ${e.message}`);
    }
  }
  // Running the migrations twice must be harmless (idempotent).
  for (const { file, sql } of loadSql(false)) {
    try {
      await su(sql);
    } catch (e) {
      throw new Error(`re-run ${file}: ${e.message}`);
    }
  }
}

const A = randomUUID();
const B = randomUUID();
const C = randomUUID();

async function main() {
  console.log('Resetting database and applying migrations (twice)…');
  await reset();

  console.log('\nJoining');
  await test('anonymous callers are rejected', async () => {
    await rejects(rpc(null, 'stt_sync'), /signed in|permission/i);
  });
  await test('anon role cannot execute RPCs at all', async () => {
    const c = await pool.connect();
    try {
      await c.query('begin');
      await c.query('set local role anon');
      await rejects(c.query(`select public.stt_catalog('{}'::jsonb)`), /permission denied/);
    } finally {
      await c.query('rollback');
      c.release();
    }
  });
  await test('sync before joining asks to join', async () => {
    const s = await rpc(A, 'stt_sync');
    eq(s.needs_join, true);
  });
  await test('join validates usernames', async () => {
    await rejects(rpc(A, 'stt_join', { username: 'x' }), /3–16/);
    await rejects(rpc(A, 'stt_join', { username: 'bad name!' }), /3–16/);
    await rejects(rpc(A, 'stt_join', { username: 'techghost' }), /taken/);
  });
  await test('join creates a player with a starter TV on display', async () => {
    const s = await rpc(A, 'stt_join', { username: 'Alice' });
    eq(s.me.username, 'Alice');
    eq(s.me.cash, 500);
    eq(s.items.length, 1);
    eq(s.items[0].item_id, 'nova-starter-tv');
    eq(s.items[0].location, 'display');
    eq(s.items[0].soulbound, true);
    assert(s.me.income > 0, 'income');
    await rpc(B, 'stt_join', { username: 'Bobby' });
    await rpc(C, 'stt_join', { username: 'Carol' });
    await rejects(rpc(randomUUID(), 'stt_join', { username: 'ALICE' }), /taken/, 'case-insensitive');
    await su(`update game.bases set base_level = 5 where player_id in ($1, $2, $3)`, [A, B, C]);
  });
  await test('world is seeded with NPC bases and 30 days of market history', async () => {
    const w = await rpc(A, 'stt_world');
    const bots = w.players.filter((p) => p.is_bot);
    eq(bots.length, 12);
    // (NPCs may already have robbed each other on the first tick, so allow a little churn.)
    assert(bots.filter((b) => b.items.length > 0).length >= 10, 'bots show items');
    const ghost = await one(`select count(*)::int as n from game.player_items pi join game.profiles p on p.id = pi.owner_id
                             where pi.item_id = 'quantum-120-void-oled' and p.is_bot`);
    assert(ghost.n === 1, 'an NPC owns the VOID OLED from day one');
    const h = await one(`select count(*)::int as n, min(ts) as oldest from game.market_history`);
    assert(h.n > 5000, 'history rows ' + h.n);
    assert(Date.now() - new Date(h.oldest).getTime() > 29 * 86400e3, 'history reaches back 30 days');
  });

  console.log('\nAnti-cheat: clients cannot touch tables or internal functions');
  await test('cannot read game tables directly', async () => {
    await rejects(asPlayer(A, 'select * from game.profiles'), /permission denied/);
    await rejects(asPlayer(A, 'select * from game.player_items'), /permission denied/);
  });
  await test('cannot give themselves cash', async () => {
    await rejects(asPlayer(A, `update game.profiles set cash = 999999999 where id = '${A}'`), /permission denied/);
    eq(await cash(A), 500);
  });
  await test('cannot mint items or call engine functions', async () => {
    await rejects(asPlayer(A, `select game._grant('${A}', 'phantom-tv', 'hack')`), /permission denied/);
    await rejects(asPlayer(A, `select game.act_open_drop('${A}', 'secret', false)`), /permission denied/);
    await rejects(asPlayer(A, `insert into game.player_items (item_id, owner_id, acquired_via) values ('phantom-tv', '${A}', 'x')`), /permission denied/);
    await rejects(asPlayer(A, `select game.world_tick(true)`), /permission denied/);
  });
  await test('live feed only exposes global rows and your own', async () => {
    await su(`insert into game.server_events (kind, target_id, payload) values ('secret_note', $1, '{}')`, [B]);
    const rows = await asPlayer(A, `select kind, target_id from game.server_events`);
    assert(rows.length > 0, 'can read global feed');
    assert(rows.every((r) => r.target_id === null || r.target_id === A), 'no foreign private events');
  });

  console.log('\nDrops');
  await test('tutorial grants $600 for the belt (step 4) and one Basic Drop (step 7), once each', async () => {
    const basic = (await one(`select price from game.drop_types where id = 'basic'`)).price;
    const before = await cash(A);
    await rpc(A, 'stt_tutorial', { step: 4 });
    eq(await cash(A), before + 600, 'belt cash');
    await rpc(A, 'stt_tutorial', { step: 5 });
    eq(await cash(A), before + 600, 'no double grant');
    await rpc(A, 'stt_tutorial', { step: 7 });
    eq(await cash(A), before + 600 + basic, 'drop cash');
    await rpc(A, 'stt_tutorial', { step: 8 });
    eq(await cash(A), before + 600 + basic, 'no double grant');
  });
  await test('opening a drop charges the server price and grants a real item', async () => {
    const price = (await one(`select price from game.drop_types where id = 'basic'`)).price;
    const r = await rpc(A, 'stt_open_drop', { drop: 'basic' });
    assert(r.item_id && r.rarity, 'result');
    eq(await ownerOf(r.player_item.id), A);
    const tx = await one(`select amount from game.transactions where player_id = $1 and kind = 'drop' order by id desc limit 1`, [A]);
    eq(tx.amount, -price, 'charged the server price');
    eq(r.placed, true, 'auto-placed into a free slot');
  });
  await test('cannot open drops without cash, level, key or event', async () => {
    await su(`update game.profiles set cash = 0 where id = $1`, [A]);
    await rejects(rpc(A, 'stt_open_drop', { drop: 'basic' }), /Not enough cash/);
    await rejects(rpc(A, 'stt_open_drop', { drop: 'elite' }), /unlocks at level/);
    await rejects(rpc(A, 'stt_open_drop', { drop: 'basic', use_token: true }), /no free/);
    await su(`update game.profiles set level = 30, cash = 999999999999 where id = $1`, [A]);
    await rejects(rpc(A, 'stt_open_drop', { drop: 'secret' }), /Secret Key/);
    await su(`delete from game.events`);
    await rejects(rpc(A, 'stt_open_drop', { drop: 'event' }), /live events/);
    await rejects(rpc(A, 'stt_open_drop', { drop: 'nope' }), /Unknown drop/);
  });
  await test('tokens, keys and event drops work', async () => {
    await su(`update game.profiles set drop_tokens = '{"premium": 1}', secret_keys = 1 where id = $1`, [A]);
    const c0 = await cash(A);
    await rpc(A, 'stt_open_drop', { drop: 'premium', use_token: true });
    assert((await cash(A)) >= c0, 'token open is free');
    const s = await rpc(A, 'stt_open_drop', { drop: 'secret' });
    assert(['mythic', 'ultra', 'limited', 'secret'].includes(s.rarity), 'secret drop rarity ' + s.rarity);
    eq((await one('select secret_keys from game.profiles where id = $1', [A])).secret_keys, 0);
    await su(`insert into game.events (type_id, category, starts_at, ends_at) values ('car_week', 'CARS', now(), now() + interval '5 minutes')`);
    const e = await rpc(A, 'stt_open_drop', { drop: 'event' });
    assert(e.item_id, 'event drop');
    await su(`delete from game.events`);
  });
  await test('limited supply can never be exceeded', async () => {
    await su(`update game.limited_item_supply set minted = max_supply - 1 where item_id = 'phantom-tv'`);
    await one(`select game._grant($1, 'phantom-tv', 'test')`, [C]);
    await rejects(su(`select game._grant($1, 'phantom-tv', 'test')`, [C]), /SOLD_OUT/);
    const s = await one(`select minted, max_supply from game.limited_item_supply where item_id = 'phantom-tv'`);
    eq(s.minted, s.max_supply);
    // drops fall back to other items instead of failing when a run is sold out
    await su(`update game.limited_item_supply set minted = max_supply`);
    for (let i = 0; i < 25; i++) {
      await one(`select game._roll_drop($1, 'secret', false) as it`, [C]);
    }
    await su(`update game.limited_item_supply set minted = (select count(*) from game.player_items pi where pi.item_id = limited_item_supply.item_id)`);
  });
  await test('drop odds roughly match the published weights', async () => {
    const n = 3000;
    const rows = await su(`select game._roll_rarity((select weights from game.drop_types where id = 'basic'), 0, 1) as r from generate_series(1, $1)`, [n]);
    const counts = {};
    for (const { r } of rows) counts[r] = (counts[r] || 0) + 1;
    const common = counts.common / n;
    assert(common > 0.64 && common < 0.76, 'common share ' + common);
    assert(!counts.mythic && !counts.secret, 'no out-of-table rarities');
  });

  console.log('\nBase, vault & income');
  await test('podium cash piles up server-side and is banked by collecting', async () => {
    await su(`select game._check_achievements($1)`, [B]); // settle one-off rewards from test setup first
    await su(`update game.profiles set cash = 1000 where id = $1`, [B]);
    await su(`update game.player_items set accrued_at = now() - interval '100 seconds' where owner_id = $1 and location = 'display'`, [B]);
    let s = await rpc(B, 'stt_sync');
    eq(s.me.cash, 1000, 'income waits on the podium');
    const rate = s.me.income;
    assert(Math.abs(s.me.pending - rate * 100) <= 2, `pending ${s.me.pending} vs ${rate * 100}`);
    const starter = s.items.find((i) => i.soulbound);
    const one1 = await rpc(B, 'stt_collect', { player_item_id: starter.id });
    assert(one1.collected > 0 && one1.items.length === 1, 'collect one podium');
    const all = await rpc(B, 'stt_collect', {});
    s = await rpc(B, 'stt_sync');
    assert(Math.abs(s.me.cash - (1000 + one1.collected + all.collected)) <= 1, `banked: cash ${s.me.cash}, collected ${one1.collected}+${all.collected}`);
    assert(Math.abs(one1.collected + all.collected - rate * 100) <= 3, 'banked everything once');
    const again = await rpc(B, 'stt_collect', {});
    assert(again.collected <= rate * 2 + 2, 'nothing left to double-collect');
    await rejects(rpc(B, 'stt_collect', { player_item_id: 'nope' }), /Invalid/);
  });
  await test('offline income is capped at 12 hours per podium', async () => {
    await su(`update game.player_items set accrued_at = now() - interval '3 days' where owner_id = $1 and location = 'display'`, [B]);
    const s = await rpc(B, 'stt_sync');
    assert(s.me.pending <= s.me.income * 43200 + 5, 'capped');
    assert(s.me.pending >= s.me.income * 43200 - 5, 'full 12h');
  });
  await test('an item leaving its podium banks its cash for the owner', async () => {
    const id = await giveItem(B, 'nova-55-4k-tv');
    await su(`update game.player_items set accrued_at = now() - interval '60 seconds' where id = $1`, [id]);
    const before = await cash(B);
    await rpc(B, 'stt_store', { player_item_id: id });
    const inc = (await one(`select base_income from game.items where id = 'nova-55-4k-tv'`)).base_income;
    const got = (await cash(B)) - before;
    assert(got >= inc * 59 && got <= inc * 62, 'auto-banked ' + got);
    await rpc(B, 'stt_quick_sell', { player_item_id: id });
  });
  let bobItem;
  await test('place / store / vault / auto-arrange', async () => {
    bobItem = await giveItem(B, 'nova-75-oled-tv', false);
    let s = await rpc(B, 'stt_place', { player_item_id: bobItem, slot: 2 });
    eq(s.slot, 2);
    s = await rpc(B, 'stt_sync');
    eq(s.items.find((i) => i.id === bobItem).location, 'display');
    await rejects(rpc(B, 'stt_place', { player_item_id: bobItem, slot: 99 }), /doesn't exist/);
    await rejects(rpc(A, 'stt_place', { player_item_id: bobItem, slot: 1 }), /isn't yours/);
    await rpc(B, 'stt_store', { player_item_id: bobItem });
    await rpc(B, 'stt_vault', { player_item_id: bobItem });
    eq((await one('select location from game.player_items where id = $1', [bobItem])).location, 'vault');
    await rpc(B, 'stt_auto_arrange');
    eq((await one('select location from game.player_items where id = $1', [bobItem])).location, 'vault', 'vault untouched');
    await rpc(B, 'stt_place', { player_item_id: bobItem });
    eq((await one('select location from game.player_items where id = $1', [bobItem])).location, 'display');
  });
  await test('vault capacity is enforced', async () => {
    const cap = (await one(`select game._vault_capacity($1) as c`, [C])).c;
    for (let i = 0; i < cap; i++) {
      const id = await giveItem(C, 'volt-pocket-phone', false);
      await rpc(C, 'stt_vault', { player_item_id: id });
    }
    const extra = await giveItem(C, 'volt-pocket-phone', false);
    await rejects(rpc(C, 'stt_vault', { player_item_id: extra }), /vault is full/);
  });
  await test('upgrades cost server-side cash and raise capacity', async () => {
    await su(`update game.bases set base_level = 1 where player_id = $1`, [C]);
    await su(`update game.profiles set cash = 3000, last_income_at = now() where id = $1`, [C]);
    await rpc(C, 'stt_upgrade', { kind: 'base' });
    eq((await one(`select game._slots($1) as s`, [C])).s, 8);
    await rejects(rpc(C, 'stt_upgrade', { kind: 'base' }), /Not enough cash/);
    await rejects(rpc(C, 'stt_upgrade', { kind: 'rocket' }), /Unknown upgrade/);
  });
  await test('quick sell pays 60% of market and removes the item; starter is unsellable', async () => {
    const id = await giveItem(C, 'nova-55-4k-tv', false);
    const m = (await one(`select price from game.market_state where item_id = 'nova-55-4k-tv'`)).price;
    const before = await cash(C);
    const r = await rpc(C, 'stt_quick_sell', { player_item_id: id });
    eq(r.price, Math.floor(m * 0.6));
    eq(await cash(C) - before >= r.price, true);
    eq(await ownerOf(id), undefined);
    const starter = (await one(`select id from game.player_items where owner_id = $1 and soulbound`, [C])).id;
    await rejects(rpc(C, 'stt_quick_sell', { player_item_id: starter }), /starter/);
  });

  console.log('\nTech Belt & mutations');
  await test('the belt is stocked ahead of time with fairly priced items', async () => {
    const b = await rpc(C, 'stt_belt');
    eq(b.seconds, 36);
    assert(b.items.length >= 10, 'belt stocked: ' + b.items.length);
    const now = Date.now();
    assert(b.items.some((i) => new Date(i.spawned_at) > now), 'items scheduled ahead');
    assert(b.items.some((i) => new Date(i.spawned_at) <= now && new Date(i.ends_at) > now), 'items on the belt now');
    // Fresh rows are priced at market × mutation × 1.05, so buying and reselling can never profit.
    await su(`update game.world set belt_next_at = now()`);
    await su(`select game._belt_fill()`);
    const rows = await su(`select b.price, ms.price as m, game._mut_mult(b.mutation)::float as mult from game.belt b
                           join game.market_state ms on ms.item_id = b.item_id where b.spawned_at >= now() - interval '1 second'`);
    assert(rows.length > 3, 'new rows');
    for (const r of rows) eq(r.price, Math.ceil(r.m * r.mult * 1.05), 'belt price');
  });
  await test('buying off the belt: one buyer wins, it lands on your podium, mutation included', async () => {
    const row = await one(`insert into game.belt (item_id, mutation, price, spawned_at, ends_at)
                           values ('nova-55-4k-tv', 'gold', 777, now() - interval '5 seconds', now() + interval '30 seconds') returning id`);
    await su(`update game.profiles set cash = 5000 where id in ($1, $2)`, [B, C]);
    const before = await cash(C);
    const results = await Promise.allSettled([
      rpc(B, 'stt_buy_belt', { belt_id: row.id }),
      rpc(C, 'stt_buy_belt', { belt_id: row.id }),
    ]);
    const won = results.filter((r) => r.status === 'fulfilled');
    eq(won.length, 1, 'exactly one buyer');
    assert(/Too slow/.test(results.find((r) => r.status === 'rejected').reason.message), 'loser told');
    const r = won[0].value;
    eq(r.mutation, 'gold');
    eq(r.price, 777);
    const pi = await one('select owner_id, mutation, location from game.player_items where id = $1', [r.player_item.id]);
    eq(pi.mutation, 'gold');
    const winner = pi.owner_id;
    eq((await one('select sold_to from game.belt where id = $1', [row.id])).sold_to, winner);
    if (winner === C) eq(await cash(C), before - 777);
    const view = await rpc(A, 'stt_belt');
    const sold = view.items.find((i) => i.id === row.id);
    assert(sold && sold.sold_to === winner && sold.buyer, 'others see who bought it');
    await rpc(winner, 'stt_quick_sell', { player_item_id: r.player_item.id }).catch(() => {});
  });
  await test('belt purchases are validated: timing, cash, sold out', async () => {
    const fut = await one(`insert into game.belt (item_id, price, spawned_at, ends_at)
                           values ('volt-pocket-phone', 100, now() + interval '10 seconds', now() + interval '46 seconds') returning id`);
    await rejects(rpc(C, 'stt_buy_belt', { belt_id: fut.id }), /hasn't rolled/);
    const gone = await one(`insert into game.belt (item_id, price, spawned_at, ends_at)
                            values ('volt-pocket-phone', 100, now() - interval '50 seconds', now() - interval '14 seconds') returning id`);
    await rejects(rpc(C, 'stt_buy_belt', { belt_id: gone.id }), /left the belt/);
    const pricey = await one(`insert into game.belt (item_id, price, spawned_at, ends_at)
                              values ('volt-pocket-phone', 999999999, now() - interval '1 second', now() + interval '30 seconds') returning id`);
    const c0 = await cash(C);
    await rejects(rpc(C, 'stt_buy_belt', { belt_id: pricey.id }), /Not enough cash/);
    eq(await cash(C), c0, 'nothing charged');
    await su(`update game.limited_item_supply set minted = max_supply where item_id = 'phantom-tv'`);
    const lim = await one(`insert into game.belt (item_id, price, spawned_at, ends_at)
                           values ('phantom-tv', 10, now() - interval '1 second', now() + interval '30 seconds') returning id`);
    await rejects(rpc(C, 'stt_buy_belt', { belt_id: lim.id }), /sold out/);
    eq(await cash(C), c0, 'refunded atomically');
    await rejects(rpc(C, 'stt_buy_belt', { belt_id: 'x' }), /Invalid/);
  });
  await test('mutations multiply income and value', async () => {
    const id = await giveItem(C, 'orbit-air-laptop');
    const s0 = await rpc(C, 'stt_sync');
    await su(`update game.player_items set mutation = 'rainbow' where id = $1`, [id]);
    const s1 = await rpc(C, 'stt_sync');
    const it = await one(`select base_income from game.items where id = 'orbit-air-laptop'`);
    const m = (await one(`select price from game.market_state where item_id = 'orbit-air-laptop'`)).price;
    assert(Math.abs(s1.me.income - s0.me.income - it.base_income * 9) < 0.5, 'income ×10');
    assert(Math.abs(s1.me.base_value - s0.me.base_value - m * 9) <= 2, 'value ×10');
    eq(s1.items.find((i) => i.id === id).mutation, 'rainbow');
    const q = await rpc(C, 'stt_quick_sell', { player_item_id: id });
    eq(q.price, Math.floor(m * 10 * 0.6), 'quick sell pays the mutated value');
  });
  await test('NPCs shop the belt, but only after humans had first pick', async () => {
    await su(`update game.profiles set cash = 400000000 where is_bot`);
    await su(`update game.belt set sold_to = $1, sold_at = now() where sold_to is null`, [A]);
    const fresh = await one(`insert into game.belt (item_id, price, spawned_at, ends_at)
                             values ('zenith-tourbillon', 1000, now() - interval '2 seconds', now() + interval '34 seconds') returning id`);
    for (let i = 0; i < 20; i++) await su('select game._bot_belt()');
    eq((await one('select sold_to from game.belt where id = $1', [fresh.id])).sold_to, null, 'humans get first pick');
    await su(`update game.belt set spawned_at = now() - interval '20 seconds' where id = $1`, [fresh.id]);
    for (let i = 0; i < 40; i++) {
      await su('select game._bot_belt()');
      if ((await one('select sold_to from game.belt where id = $1', [fresh.id])).sold_to) break;
    }
    const buyer = (await one('select sold_to from game.belt where id = $1', [fresh.id])).sold_to;
    assert(buyer, 'an NPC bought it');
    assert((await one('select is_bot from game.profiles where id = $1', [buyer])).is_bot, 'buyer is an NPC');
  });

  console.log('\nRaids');
  let aItem;
  await test('new players are protected; self-steal and starter-steal are rejected', async () => {
    aItem = await giveItem(A, 'apex-titan-gpu');
    await su(`update game.profiles set level = 1 where id = $1`, [A]);
    await rejects(rpc(B, 'stt_start_steal', { player_item_id: aItem }), /new-player protection/);
    await su(`update game.profiles set level = 5 where id = $1`, [A]);
    await rejects(rpc(A, 'stt_start_steal', { player_item_id: aItem }), /yourself/);
    const starter = (await one(`select id from game.player_items where owner_id = $1 and soulbound`, [A])).id;
    await rejects(rpc(B, 'stt_start_steal', { player_item_id: starter }), /Starter/);
  });
  let raidId;
  await test('stealing takes time: finishing early is rejected', async () => {
    await su(`update game.profiles set level = 5 where id = $1`, [B]);
    const r = await rpc(B, 'stt_start_steal', { player_item_id: aItem });
    raidId = r.raid_id;
    assert(r.duration >= 6, 'humans get ≥6s to react');
    eq(r.phase, 'grab');
    assert(r.chance > 0 && r.chance < 1, 'chance');
    await rejects(rpc(B, 'stt_finish_steal', { raid_id: raidId }), /Still grabbing/);
    await rejects(rpc(B, 'stt_deliver_steal', { raid_id: raidId }), /Grab it first/);
    await rejects(rpc(B, 'stt_start_steal', { player_item_id: aItem }), /already in the middle/);
    await rejects(rpc(C, 'stt_start_steal', { player_item_id: aItem }), /new-player protection|already stealing/);
  });
  await test('the owner is warned and can sound the alarm', async () => {
    const s = await rpc(A, 'stt_sync', { since: 0 });
    eq(s.incoming_raids.length, 1);
    eq(s.incoming_raids[0].attacker, 'Bobby');
    assert(s.feed.some((e) => e.kind === 'raid_warning'), 'warning event');
    await rejects(rpc(C, 'stt_defend', { raid_id: raidId }), /not found/);
    await rpc(A, 'stt_defend', { raid_id: raidId });
    eq((await one('select defended from game.raids where id = $1', [raidId])).defended, true);
  });
  await test('grab → carry → deliver moves ownership, shields the victim, enables revenge', async () => {
    await su(`update game.raids set chance = 1, defended = false where id = $1`, [raidId]);
    await expireRaid(raidId);
    const g = await rpc(B, 'stt_finish_steal', { raid_id: raidId });
    eq(g.status, 'active');
    eq(g.phase, 'carry', 'grabbed — now carrying');
    eq(await ownerOf(aItem), A, 'not theirs until they get home');
    let s0 = await rpc(A, 'stt_sync', { since: 0 });
    eq(s0.incoming_raids[0].phase, 'carry');
    assert(s0.feed.some((e) => e.kind === 'raid_grabbed'), 'owner told to chase');
    await rejects(rpc(A, 'stt_vault', { player_item_id: aItem }), /out the door/);
    await rejects(rpc(A, 'stt_store', { player_item_id: aItem }), /chase them/);
    await rejects(rpc(A, 'stt_defend', { raid_id: raidId }), /catch them/);
    await rejects(rpc(B, 'stt_deliver_steal', { raid_id: raidId }), /Keep running/);
    await su(`update game.raids set deliver_after = now() - interval '1 second' where id = $1`, [raidId]);
    const r = await rpc(B, 'stt_deliver_steal', { raid_id: raidId });
    eq(r.status, 'success');
    eq(await ownerOf(aItem), B);
    const it = await one('select hot_until, stolen_from from game.player_items where id = $1', [aItem]);
    assert(new Date(it.hot_until) > new Date(), 'stolen items are hot');
    eq(it.stolen_from, A);
    const s = await rpc(A, 'stt_sync', { since: 0 });
    eq(s.revenge, 1);
    assert(s.feed.some((e) => e.kind === 'item_stolen'), 'victim notified');
    assert(new Date(s.me.shield_until) > new Date(), 'victim shielded');
    // hot items can't be flipped
    await rejects(rpc(B, 'stt_quick_sell', { player_item_id: aItem }), /too hot/);
    await rejects(rpc(B, 'stt_list', { player_item_id: aItem, price: 5000 }), /too hot/);
  });
  await test('shield blocks normal raids but revenge goes through', async () => {
    const other = await giveItem(A, 'orbit-mirrorless-cam');
    await su(`update game.profiles set raid_cooldown_until = null where id in ($1, $2)`, [A, B]);
    await su(`update game.profiles set raid_cooldown_until = null where id = $1`, [C]);
    await su(`update game.profiles set level = 5 where id = $1`, [C]);
    await rejects(rpc(C, 'stt_start_steal', { player_item_id: other }), /shielded/);
    // Bob now displays Alice's GPU; Alice takes revenge
    const bobShow = await rpc(A, 'stt_base', { player_id: B });
    eq(bobShow.revenge_available, true);
    const target = bobShow.items.find((i) => !i.soulbound);
    const r = await rpc(A, 'stt_start_steal', { player_item_id: target.id, revenge: true });
    eq(r.revenge, true);
    await su(`update game.raids set chance = 0 where id = $1`, [r.raid_id]);
    await expireRaid(r.raid_id);
    const res = await rpc(A, 'stt_finish_steal', { raid_id: r.raid_id });
    eq(res.status, 'failed');
    await rejects(rpc(A, 'stt_start_steal', { player_item_id: target.id, revenge: true }), /laying low|no revenge/);
  });
  await test('a failed raid fines the attacker and pays the defender', async () => {
    await su(`update game.profiles set raid_cooldown_until = null, cash = 100000 where id = $1`, [C]);
    await su(`update game.bases set shield_until = null where player_id = $1`, [B]);
    const target = (await rpc(C, 'stt_base', { player_id: B })).items.find((i) => !i.soulbound);
    const r = await rpc(C, 'stt_start_steal', { player_item_id: target.id });
    await su(`update game.raids set chance = 0 where id = $1`, [r.raid_id]);
    await expireRaid(r.raid_id);
    const bBefore = await cash(B);
    const res = await rpc(C, 'stt_finish_steal', { raid_id: r.raid_id });
    eq(res.status, 'failed');
    assert(res.fine > 0, 'fine');
    assert((await cash(B)) >= bBefore + res.fine, 'defender paid');
    eq(await ownerOf(target.id), B);
    await rejects(rpc(C, 'stt_start_steal', { player_item_id: target.id }), /laying low/);
  });
  await test('the owner can tag a thief who is running off with their item', async () => {
    await su(`update game.profiles set raid_cooldown_until = null, cash = 100000 where id = $1`, [C]);
    const id = await giveItem(B, 'nexus-gaming-laptop');
    const r = await rpc(C, 'stt_start_steal', { player_item_id: id });
    await su(`update game.raids set chance = 1 where id = $1`, [r.raid_id]);
    await expireRaid(r.raid_id);
    eq((await rpc(C, 'stt_finish_steal', { raid_id: r.raid_id })).phase, 'carry');
    const bBefore = await cash(B);
    const t = await rpc(B, 'stt_defend', { raid_id: r.raid_id, tag: true });
    eq(t.tagged, true);
    eq(t.status, 'failed');
    assert(t.fine > 0, 'thief fined');
    assert((await cash(B)) >= bBefore + t.fine, 'owner paid the bounty');
    eq(await ownerOf(id), B, 'item stays home');
    await rejects(rpc(C, 'stt_deliver_steal', { raid_id: r.raid_id }).then((x) => { if (x.status !== 'success') throw new Error('over'); }), /over/);
    await rpc(B, 'stt_quick_sell', { player_item_id: id });
  });
  await test('taking too long to carry it home snaps the item back', async () => {
    await su(`update game.profiles set raid_cooldown_until = null where id = $1`, [C]);
    const id = await giveItem(B, 'kryo-rgb-keyboard');
    const r = await rpc(C, 'stt_start_steal', { player_item_id: id });
    await su(`update game.raids set chance = 1 where id = $1`, [r.raid_id]);
    await expireRaid(r.raid_id);
    await rpc(C, 'stt_finish_steal', { raid_id: r.raid_id });
    await su(`update game.raids set carry_until = now() - interval '10 seconds' where id = $1`, [r.raid_id]);
    await su(`update game.world set last_tick_at = now() - interval '60 seconds'`);
    await su(`select game.world_tick(true)`);
    const row = await one('select status, fine from game.raids where id = $1', [r.raid_id]);
    eq(row.status, 'failed');
    eq(row.fine, 0, 'no fine for being slow');
    eq(await ownerOf(id), B);
    await su(`update game.profiles set raid_cooldown_until = null where id = $1`, [C]);
    const r2 = await rpc(C, 'stt_start_steal', { player_item_id: id });
    const ab = await rpc(C, 'stt_abort_steal', { raid_id: r2.raid_id });
    eq(ab.status, 'failed');
    eq(ab.fine, 0, 'backing off is free');
    await su(`update game.profiles set raid_cooldown_until = null where id = $1`, [C]);
    const r3 = await rpc(C, 'stt_start_steal', { player_item_id: id });
    const caught = await rpc(C, 'stt_abort_steal', { raid_id: r3.raid_id, reason: 'caught' });
    eq(caught.status, 'failed');
    eq(caught.defended, true);
    await rpc(B, 'stt_quick_sell', { player_item_id: id });
  });
  await test('locking a base blocks raids, then needs a recharge', async () => {
    await su(`update game.profiles set raid_cooldown_until = null where id = $1`, [C]);
    await su(`update game.bases set shield_until = null, lock_until = null where player_id = $1`, [B]);
    const id = await giveItem(B, 'volt-pocket-phone');
    const l = await rpc(B, 'stt_lock_base');
    const sec = (await one('select security_level from game.bases where player_id = $1', [B])).security_level;
    eq(l.seconds, 30 + 10 * sec);
    await rejects(rpc(C, 'stt_start_steal', { player_item_id: id }), /LOCKED/);
    await rejects(rpc(B, 'stt_lock_base'), /Already locked/);
    await su(`update game.bases set lock_until = now() - interval '3 seconds' where player_id = $1`, [B]);
    await rejects(rpc(B, 'stt_lock_base'), /recharging/);
    const w = await rpc(C, 'stt_world');
    assert('lock_until' in w.players.find((p) => p.id === B), 'lock visible to others');
    const r = await rpc(C, 'stt_start_steal', { player_item_id: id });
    await rpc(C, 'stt_abort_steal', { raid_id: r.raid_id });
    await su(`update game.profiles set raid_cooldown_until = null where id = $1`, [C]);
    await rpc(B, 'stt_quick_sell', { player_item_id: id });
  });
  await test('vaulting the item mid-grab blocks the theft', async () => {
    await su(`update game.profiles set raid_cooldown_until = null where id = $1`, [C]);
    const id = await giveItem(B, 'nexus-gaming-laptop');
    const r = await rpc(C, 'stt_start_steal', { player_item_id: id });
    const v = await rpc(B, 'stt_vault', { player_item_id: id });
    eq(v.saved_from_raid, true);
    await su(`update game.raids set chance = 1 where id = $1`, [r.raid_id]);
    await expireRaid(r.raid_id);
    const res = await rpc(C, 'stt_finish_steal', { raid_id: r.raid_id });
    eq(res.status, 'blocked');
    eq(await ownerOf(id), B);
  });
  await test('abandoned raids are resolved fairly by the world tick', async () => {
    await su(`update game.profiles set raid_cooldown_until = null where id = $1`, [C]);
    const id = await giveItem(B, 'kryo-rgb-keyboard');
    const r = await rpc(C, 'stt_start_steal', { player_item_id: id });
    await su(`update game.raids set ends_at = now() - interval '20 seconds' where id = $1`, [r.raid_id]);
    await su(`select game.world_tick(true)`);
    let row = await one('select status, phase from game.raids where id = $1', [r.raid_id]);
    assert(row.status !== 'active' || row.phase === 'carry', 'grab resolved: ' + row.status);
    // a thief who grabbed it and then vanished drops it when the carry window closes
    await su(`update game.raids set carry_until = now() - interval '10 seconds' where id = $1`, [r.raid_id]);
    await su(`update game.world set last_tick_at = now() - interval '60 seconds'`);
    await su(`select game.world_tick(true)`);
    row = await one('select status from game.raids where id = $1', [r.raid_id]);
    assert(row.status !== 'active', 'resolved: ' + row.status);
    eq(await ownerOf(id), B);
  });
  await test('the beginner raid in the tutorial is near-certain', async () => {
    await su(`update game.profiles set tutorial_step = 9, raid_cooldown_until = null where id = $1`, [C]);
    const rick = (await one(`select id from game.profiles where username = 'RookieRick'`)).id;
    await su(`update game.bases set shield_until = null where player_id = $1`, [rick]);
    const base = await rpc(C, 'stt_base', { player_id: rick });
    const r = await rpc(C, 'stt_start_steal', { player_item_id: base.items[0].id });
    eq(r.tutorial, true);
    assert(r.chance >= 0.95, 'chance');
    eq(Number(r.duration), 3, 'quick grab');
    await expireRaid(r.raid_id);
    const g = await rpc(C, 'stt_finish_steal', { raid_id: r.raid_id });
    eq(g.phase, 'carry');
    await su(`update game.raids set deliver_after = now() - interval '1 second' where id = $1`, [r.raid_id]);
    eq((await rpc(C, 'stt_deliver_steal', { raid_id: r.raid_id })).status, 'success');
    const flags = (await one('select tutorial_flags from game.profiles where id = $1', [C])).tutorial_flags;
    eq(flags.tutorial_raid, true);
  });

  console.log('\nMarket');
  let listing;
  await test('listing enforces ownership, price bounds and removes the item from display', async () => {
    const id = await giveItem(A, 'zenith-diver-watch');
    const m = (await one(`select price from game.market_state where item_id = 'zenith-diver-watch'`)).price;
    await rejects(rpc(B, 'stt_list', { player_item_id: id, price: m }), /isn't yours/);
    await rejects(rpc(A, 'stt_list', { player_item_id: id, price: 1 }), /between/);
    await rejects(rpc(A, 'stt_list', { player_item_id: id, price: m * 50 }), /between/);
    await rejects(rpc(A, 'stt_list', { player_item_id: id, price: -5 }), /between/);
    const r = await rpc(A, 'stt_list', { player_item_id: id, price: m });
    listing = { id: r.listing_id, item: id, price: m };
    eq((await one('select location from game.player_items where id = $1', [id])).location, 'listed');
    await rejects(rpc(A, 'stt_place', { player_item_id: id, slot: 0 }), /Cancel the market listing/);
  });
  await test('buying a listing moves cash (5% fee) and the item atomically', async () => {
    await rejects(rpc(A, 'stt_buy_listing', { listing_id: listing.id }), /own listing/);
    await su(`update game.profiles set cash = $2 where id = $1`, [C, listing.price * 3]);
    const aBefore = await cash(A);
    const cBefore = await cash(C);
    await rpc(C, 'stt_buy_listing', { listing_id: listing.id });
    eq(await ownerOf(listing.item), C);
    const fee = Math.ceil(listing.price * 0.05);
    assert((await cash(A)) >= aBefore + listing.price - fee, 'seller paid minus fee');
    assert((await cash(C)) <= cBefore - listing.price + 5, 'buyer charged');
    await rejects(rpc(B, 'stt_buy_listing', { listing_id: listing.id }), /no longer available/);
  });
  await test('two buyers racing for one listing: exactly one wins', async () => {
    const id = await giveItem(A, 'pulse-tower-speaker', false);
    const m = (await one(`select price from game.market_state where item_id = 'pulse-tower-speaker'`)).price;
    const { listing_id } = await rpc(A, 'stt_list', { player_item_id: id, price: m });
    await su(`update game.profiles set cash = $2 where id in ($1, $3)`, [B, m * 10, C]);
    const results = await Promise.allSettled([
      rpc(B, 'stt_buy_listing', { listing_id }),
      rpc(C, 'stt_buy_listing', { listing_id }),
    ]);
    eq(results.filter((r) => r.status === 'fulfilled').length, 1);
    eq((await one(`select count(*)::int as n from game.market_sales where kind = 'listing' and item_id = 'pulse-tower-speaker'`)).n, 1);
  });
  await test('cancel returns the item', async () => {
    const id = await giveItem(A, 'vertex-hi-top-sneakers', false);
    const m = (await one(`select price from game.market_state where item_id = 'vertex-hi-top-sneakers'`)).price;
    const { listing_id } = await rpc(A, 'stt_list', { player_item_id: id, price: m });
    await rejects(rpc(B, 'stt_cancel_listing', { listing_id }), /not found/);
    await rpc(A, 'stt_cancel_listing', { listing_id });
    eq((await one('select location from game.player_items where id = $1', [id])).location, 'inventory');
  });
  await test('market reads: overview, item detail with history & graph ranges', async () => {
    const m = await rpc(A, 'stt_market');
    assert(m.items.length > 150, 'all items');
    for (const range of ['1H', '24H', '7D', '30D', 'ALL']) {
      const d = await rpc(A, 'stt_market_item', { item_id: 'quantum-oled-85', range });
      assert(Array.isArray(d.history), range);
      if (range !== '1H') assert(d.history.length > 3, `${range} points ${d.history.length}`);
    }
    const l = await rpc(A, 'stt_listings', {});
    assert(Array.isArray(l), 'listings');
  });

  console.log('\nTrades');
  await test('trade validation', async () => {
    const mine = await giveItem(A, 'apex-roadster', false);
    const theirs = await giveItem(B, 'volt-cafe-racer');
    await rejects(rpc(A, 'stt_trade_propose', { to: A, offer_items: [mine] }), /someone else/);
    await rejects(rpc(A, 'stt_trade_propose', { to: B, offer_items: [theirs] }), /own items/);
    await rejects(rpc(A, 'stt_trade_propose', { to: B, request_items: [mine] }), /must belong/);
    await rejects(rpc(A, 'stt_trade_propose', { to: B, offer_items: [mine], offer_cash: -5 }), /negative/);
    await rejects(rpc(A, 'stt_trade_propose', { to: B, offer_items: [mine], offer_cash: 1e15 }), /that much cash/);
    await rejects(rpc(A, 'stt_trade_propose', { to: B, offer_items: [mine, mine] }), /Duplicate/);
    await rejects(rpc(A, 'stt_trade_propose', { to: 'not-a-uuid', offer_items: [mine] }), /Invalid trade/);
  });
  await test('both sides confirm, then items and cash swap atomically', async () => {
    const mine = await giveItem(A, 'zenith-electric-suv', false);
    const theirs = await giveItem(B, 'pulse-pro-road-bike');
    await su(`update game.profiles set cash = 50000 where id in ($1, $2)`, [A, B]);
    const { trade_id } = await rpc(A, 'stt_trade_propose', { to: B, offer_items: [mine], offer_cash: 1000, request_items: [theirs] });
    await rejects(rpc(A, 'stt_trade_respond', { trade_id, accept: true }), /not found/, 'proposer cannot self-accept');
    const list = await rpc(B, 'stt_trades');
    assert(list.some((t) => t.id === trade_id && t.incoming), 'incoming trade listed');
    const r = await rpc(B, 'stt_trade_respond', { trade_id, accept: true });
    eq(r.ok, true);
    eq(await ownerOf(mine), B);
    eq(await ownerOf(theirs), A);
    const sums = await su(`select player_id, sum(amount)::bigint as s from game.transactions
                            where kind = 'trade' and ref->>'trade_id' = $1 group by player_id`, [trade_id]);
    eq(sums.find((r) => r.player_id === A).s, -1000);
    eq(sums.find((r) => r.player_id === B).s, 1000);
    await rejects(rpc(B, 'stt_trade_respond', { trade_id, accept: true }), /no longer pending/);
  });
  await test('trade fails safely if an item changed hands in the meantime', async () => {
    const mine = await giveItem(A, 'orbit-air-laptop', false);
    const { trade_id } = await rpc(A, 'stt_trade_propose', { to: B, offer_items: [mine], request_cash: 10 });
    await rpc(A, 'stt_quick_sell', { player_item_id: mine });
    const r = await rpc(B, 'stt_trade_respond', { trade_id, accept: true });
    eq(r.ok, false);
    eq((await one('select status from game.trades where id = $1', [trade_id])).status, 'failed');
  });
  await test('NPCs answer trades: fair offers accepted, lowballs declined with a counter', async () => {
    const ghost = (await one(`select id from game.profiles where username = 'VoltVixen'`)).id;
    const botItem = (await one(`select pi.id, ms.price from game.player_items pi join game.market_state ms using (item_id)
                                where owner_id = $1 and location = 'display' and not soulbound order by ms.price limit 1`, [ghost]));
    await su(`update game.profiles set cash = $2 where id = $1`, [A, botItem.price * 3]);
    const low = await rpc(A, 'stt_trade_propose', { to: ghost, offer_cash: 1, request_items: [botItem.id] });
    const fair = await rpc(A, 'stt_trade_propose', { to: ghost, offer_cash: Math.ceil(botItem.price * 1.2), request_items: [botItem.id] });
    await su(`update game.trades set created_at = now() - interval '10 seconds' where id in ($1, $2)`, [low.trade_id, fair.trade_id]);
    await su(`select game._bot_answer_trade($1)`, [low.trade_id]);
    await su(`select game._bot_answer_trade($1)`, [fair.trade_id]);
    const l = await one('select status, note from game.trades where id = $1', [low.trade_id]);
    eq(l.status, 'declined');
    assert(/more/.test(l.note), 'counter note');
    eq((await one('select status from game.trades where id = $1', [fair.trade_id])).status, 'accepted');
    eq(await ownerOf(botItem.id), A);
  });

  console.log('\nProgression');
  await test('quests track progress and pay out once', async () => {
    const q = await rpc(A, 'stt_quests');
    const open5 = q.quests.find((x) => x.id === 'd_open5');
    await su(`update game.profiles set cash = 99999999 where id = $1`, [A]);
    for (let i = open5.progress; i < 5; i++) await rpc(A, 'stt_open_drop', { drop: 'basic' });
    const q2 = await rpc(A, 'stt_quests');
    eq(q2.quests.find((x) => x.id === 'd_open5').progress, 5);
    const r = await rpc(A, 'stt_claim_quest', { quest_id: 'd_open5' });
    assert(r.cash >= 4000, 'cash reward');
    await rejects(rpc(A, 'stt_claim_quest', { quest_id: 'd_open5' }), /Already claimed/);
    await rejects(rpc(A, 'stt_claim_quest', { quest_id: 'w_trades20' }), /not complete/);
  });
  await test('daily rewards: once per day, streak continues from yesterday, resets after a gap', async () => {
    const r1 = await rpc(B, 'stt_claim_daily');
    eq(r1.day, 1);
    await rejects(rpc(B, 'stt_claim_daily'), /Already claimed/);
    await su(`update game.profiles set last_daily_day = (now() at time zone 'utc')::date - 1, daily_streak = 3 where id = $1`, [B]);
    const r4 = await rpc(B, 'stt_claim_daily');
    eq(r4.day, 4);
    eq(r4.type, 'item');
    await su(`update game.profiles set last_daily_day = (now() at time zone 'utc')::date - 1, daily_streak = 6 where id = $1`, [B]);
    const r7 = await rpc(B, 'stt_claim_daily');
    eq(r7.day, 7);
    eq(r7.secret_keys, 1);
    await su(`update game.profiles set last_daily_day = (now() at time zone 'utc')::date - 3 where id = $1`, [B]);
    eq((await rpc(B, 'stt_claim_daily')).day, 1);
  });
  await test('XP levels up and pays level rewards', async () => {
    const before = await one('select level, cash from game.profiles where id = $1', [C]);
    await su(`select game._xp($1, 5000, 'test')`, [C]);
    const after = await one('select level, cash from game.profiles where id = $1', [C]);
    assert(after.level > before.level, 'level up');
    assert(after.cash > before.cash, 'reward');
  });
  await test('cosmetics: buy, lock rules, equip', async () => {
    await su(`update game.profiles set cash = 100000, level = 5 where id = $1`, [C]);
    await rpc(C, 'stt_buy_cosmetic', { cosmetic_id: 'theme-garage' });
    await rejects(rpc(C, 'stt_buy_cosmetic', { cosmetic_id: 'theme-garage' }), /already own/);
    await rejects(rpc(C, 'stt_buy_cosmetic', { cosmetic_id: 'theme-void' }), /prestige/);
    await rejects(rpc(C, 'stt_equip', { cosmetic_id: 'theme-gold' }), /don't own/);
    await rpc(C, 'stt_equip', { cosmetic_id: 'theme-garage' });
    const s = await rpc(C, 'stt_sync');
    eq(s.me.cosmetics.theme, 'theme-garage');
  });
  await test('collection focus unlocks at level 5', async () => {
    await su(`update game.profiles set level = 2 where id = $1`, [B]);
    await rejects(rpc(B, 'stt_set_focus', { focus: 'CARS' }), /level 5/);
    await su(`update game.profiles set level = 6 where id = $1`, [B]);
    eq((await rpc(B, 'stt_set_focus', { focus: 'cars' })).focus, 'CARS');
  });
  await test('prestige resets progression, keeps vault + collection, grants bonuses', async () => {
    await rejects(rpc(B, 'stt_prestige'), /level 25/);
    const vaulted = await giveItem(B, 'zenith-tourbillon', false);
    await rpc(B, 'stt_vault', { player_item_id: vaulted }).catch(async () => {
      await su(`update game.bases set vault_level = 3 where player_id = $1`, [B]);
      await rpc(B, 'stt_vault', { player_item_id: vaulted });
    });
    const shown = await giveItem(B, 'apex-supercar-s');
    const col = (await one('select count(*)::int as n from game.player_collection where player_id = $1', [B])).n;
    await su(`update game.profiles set level = 25 where id = $1`, [B]);
    const r = await rpc(B, 'stt_prestige');
    eq(r.prestige, 1);
    eq(await ownerOf(vaulted), B);
    eq(await ownerOf(shown), undefined);
    const s = await rpc(B, 'stt_sync');
    eq(s.me.level, 1);
    eq(s.me.prestige, 1);
    eq(s.me.income_bonus, 0.05);
    assert(s.me.luck > 0, 'luck bonus');
    eq((await one('select count(*)::int as n from game.player_collection where player_id = $1', [B])).n, col);
    assert(s.me.owned_cosmetics.includes('theme-void'), 'prestige cosmetic');
  });

  console.log('\nSocial & reads');
  await test('leaderboards, profiles, collections, raid board, revenge, activity', async () => {
    for (const kind of ['richest', 'base_value', 'items', 'secrets', 'raids', 'trades', 'level', 'collection']) {
      const lb = await rpc(A, 'stt_leaderboard', { kind });
      assert(lb.rows.length > 5, kind);
      assert(lb.me && lb.me.rank >= 1, 'my rank ' + kind);
    }
    await rejects(rpc(A, 'stt_leaderboard', { kind: 'nope' }), /Unknown/);
    const prof = await rpc(A, 'stt_profile', { player_id: B });
    eq(prof.username, 'Bobby');
    const me = await rpc(A, 'stt_profile');
    eq(me.is_me, true);
    const col = await rpc(A, 'stt_collection', { player_id: B });
    assert(col.discovered.length > 0, 'collection');
    const targets = await rpc(A, 'stt_raid_targets', { sort: 'value' });
    assert(targets.length >= 12, 'targets');
    assert(targets.every((t) => t.id !== A), 'excludes self');
    await rpc(A, 'stt_revenge');
    const act = await rpc(A, 'stt_activity');
    assert(act.transactions.length > 0, 'transactions logged');
    const cat = await rpc(A, 'stt_catalog');
    assert(cat.items.length > 150 && cat.drops.length === 6, 'catalog');
  });

  console.log('\nThe living world');
  await test('ticks advance the market, start events and run bots without errors', async () => {
    const before = await su('select item_id, price from game.market_state order by item_id');
    await su(`update game.world set next_event_at = now() - interval '1 second'`);
    await su(`delete from game.events`);
    for (let i = 0; i < 6; i++) {
      await su(`update game.world set last_tick_at = now() - interval '60 seconds'`);
      await su('select game.world_tick(true)');
    }
    const after = await su('select item_id, price from game.market_state order by item_id');
    const moved = after.filter((r, i) => r.price !== before[i].price).length;
    assert(moved > 50, 'prices moved: ' + moved);
    const ev = await one(`select count(*)::int as n from game.events`);
    eq(ev.n, 1, 'an event started');
    const s = await rpc(A, 'stt_sync', { since: 0 });
    assert(s.event && s.event.title, 'event visible in sync');
  });
  await test('economy: reselling drop pulls can never beat the drop price', async () => {
    // After the market has moved for a while, the expected resale value of every drop
    // (sold to an NPC at <=95% of market, minus the 5% fee) must stay below its price.
    // Measured outside events: events are *meant* to create short-lived opportunities.
    await su(`delete from game.events`);
    for (let i = 0; i < 30; i++) {
      await su(`update game.world set last_tick_at = now() - interval '5 minutes'`);
      await su('select game._tick_market(300)');
    }
    const drops = await su(`select id, price, weights from game.drop_types where not event_only`);
    // drops come out mutated 3% of the time, which multiplies value
    const mutAvg = (await one(`select (sum(weight * mult) / sum(weight))::float as m from game.mutations`)).m;
    const mutEV = 0.97 + 0.03 * mutAvg;
    for (const d of drops) {
      let total = 0;
      let ev = 0;
      for (const w of Object.values(d.weights)) total += Number(w);
      for (const [rarity, w] of Object.entries(d.weights)) {
        const row = await one(
          `select avg(ms.price)::float as p from game.items i join game.market_state ms on ms.item_id = i.id
           where i.rarity = $1 and i.droppable`, [rarity]);
        ev += (Number(w) / total) * row.p;
      }
      ev *= mutEV;
      const resale = ev * 0.95 * 0.95;
      assert(resale < d.price, `${d.id}: expected resale ${Math.round(resale)} >= price ${d.price}`);
      assert(ev * 0.6 < d.price, `${d.id}: quick-sell EV too high`);
    }
  });
  await test('an NPC raid on an active human warns them and resolves on time', async () => {
    await su(`update game.profiles set level = 8, tutorial_step = 99, last_seen_at = now() where id = $1`, [A]);
    await su(`update game.bases set shield_until = null where player_id = $1`, [A]);
    await su(`delete from game.raids where defender_id = $1`, [A]);
    await su(`update game.profiles set raid_cooldown_until = null where is_bot`);
    await su('select game._bot_raid_human()');
    let s = await rpc(A, 'stt_sync', { since: 0 });
    eq(s.incoming_raids.length, 1, 'incoming raid');
    assert(s.incoming_raids[0].attacker_bot, 'from a bot');
    const secs = (new Date(s.incoming_raids[0].ends_at) - new Date(s.incoming_raids[0].started_at)) / 1000;
    assert(secs >= 8, 'at least 8s to respond: ' + secs);
    const rid = s.incoming_raids[0].id;
    await su(`update game.raids set ends_at = now() - interval '1 second', chance = 1 where id = $1`, [rid]);
    s = await rpc(A, 'stt_sync', { since: 0 });
    eq(s.incoming_raids.length, 1, 'still running with it');
    eq(s.incoming_raids[0].phase, 'carry');
    const carrySecs = (new Date(s.incoming_raids[0].deliver_after) - new Date(s.incoming_raids[0].grabbed_at)) / 1000;
    assert(carrySecs >= 9, 'time to chase the NPC: ' + carrySecs);
    await su(`update game.raids set deliver_after = now() - interval '1 second' where id = $1`, [rid]);
    s = await rpc(A, 'stt_sync', { since: 0 });
    eq(s.incoming_raids.length, 0, 'resolved during sync');
    assert(s.feed.some((e) => e.kind === 'item_stolen' || e.kind === 'raid_over'), 'result delivered');
    // Tag an NPC thief mid-run: the item comes home.
    await su(`delete from game.raids where defender_id = $1 and status = 'active'`, [A]);
    await su(`update game.bases set shield_until = null, lock_until = null where player_id = $1`, [A]);
    await su(`update game.profiles set raid_cooldown_until = null where is_bot`);
    await su(`delete from game.raids where defender_id = $1`, [A]);
    await su('select game._bot_raid_human()');
    s = await rpc(A, 'stt_sync', { since: 0 });
    const r2 = s.incoming_raids[0];
    await su(`update game.raids set ends_at = now() - interval '1 second', chance = 1 where id = $1`, [r2.id]);
    s = await rpc(A, 'stt_sync', { since: 0 });
    eq(s.incoming_raids[0].phase, 'carry');
    const t = await rpc(A, 'stt_defend', { raid_id: r2.id, tag: true });
    eq(t.status, 'failed');
    eq(await ownerOf(r2.player_item_id), A, 'tagged the NPC, item back home');
    // A locked base keeps NPC raiders out.
    await su(`update game.profiles set raid_cooldown_until = null where is_bot`);
    await su(`delete from game.raids where defender_id = $1`, [A]);
    await su(`update game.bases set lock_until = now() + interval '60 seconds' where player_id = $1`, [A]);
    for (let i = 0; i < 5; i++) await su('select game._bot_raid_human()');
    eq((await one(`select count(*)::int as n from game.raids where defender_id = $1 and status = 'active'`, [A])).n, 0, 'locked out');
    await su(`update game.bases set lock_until = null where player_id = $1`, [A]);
  });
  await test('bots trade on the market and propose trades to players', async () => {
    for (let i = 0; i < 10; i++) {
      for (const b of await su(`select id from game.profiles where is_bot and bot->>'style' in ('trader','whale','collector')`)) {
        await su('select game._bot_market($1)', [b.id]);
      }
    }
    const listed = (await one(`select count(*)::int as n from game.market_listings l join game.profiles p on p.id = l.seller_id where p.is_bot and l.status = 'active'`)).n;
    assert(listed > 0, 'bots list items');
    await su(`delete from game.trades where to_id = $1`, [A]);
    for (let i = 0; i < 5; i++) await su('select game._bot_offer_trade()');
    const offers = (await one(`select count(*)::int as n from game.trades where to_id = $1 and status = 'pending'`, [A])).n;
    assert(offers >= 1, 'bot offered a trade');
    for (let i = 0; i < 5; i++) await su('select game._bot_heist()');
  });

  console.log('\nConcurrency & invariants');
  await test('parallel drop spam can never overspend', async () => {
    // A fresh player with every achievement unlocked and no level-ups pending, so the only
    // cash source during the burst is the Starter TV's trickle of income.
    const D = randomUUID();
    await rpc(D, 'stt_join', { username: 'Dave' });
    await su(`update game.profiles set level = 40, xp = game.xp_for_level(40) where id = $1`, [D]);
    await su(`insert into game.player_achievements (player_id, achievement_id) select $1, id from game.achievements on conflict do nothing`, [D]);
    const price = (await one(`select price from game.drop_types where id = 'basic'`)).price;
    await su(`update game.profiles set cash = $2, last_income_at = now() where id = $1`, [D, price * 3 + 10]);
    const before = (await one('select count(*)::int as n from game.player_items where owner_id = $1', [D])).n;
    const rs = await Promise.allSettled(Array.from({ length: 10 }, () => rpc(D, 'stt_open_drop', { drop: 'basic' })));
    const ok = rs.filter((r) => r.status === 'fulfilled').length;
    eq(ok, 3, 'exactly 3 drops paid for');
    assert(rs.filter((r) => r.status === 'rejected').every((r) => /Not enough cash/.test(r.reason.message)), 'rest rejected for cash');
    const after = (await one('select count(*)::int as n from game.player_items where owner_id = $1', [D])).n;
    eq(after - before, ok, 'one item per successful drop');
    assert((await cash(D)) >= 0, 'never negative');
  });
  await test('global invariants hold', async () => {
    const neg = await one(`select count(*)::int as n from game.profiles where cash < 0`);
    eq(neg.n, 0, 'negative cash');
    const dupSlots = await one(`select count(*)::int as n from (select owner_id, slot from game.player_items where location = 'display' group by 1, 2 having count(*) > 1) x`);
    eq(dupSlots.n, 0, 'duplicate slots');
    const overSlots = await one(`select count(*)::int as n from game.player_items pi where location = 'display' and slot >= game._slots(owner_id)`);
    eq(overSlots.n, 0, 'items beyond slot count');
    const over = await one(`select count(*)::int as n from game.limited_item_supply s where s.minted > s.max_supply
                              or (select count(*) from game.player_items pi where pi.item_id = s.item_id) > s.minted`);
    eq(over.n, 0, 'limited supply');
    const multiActive = await one(`select count(*)::int as n from (select attacker_id from game.raids where status = 'active' group by 1 having count(*) > 1) x`);
    eq(multiActive.n, 0, 'one raid per attacker');
    const listedWrong = await one(`select count(*)::int as n from game.market_listings l join game.player_items pi on pi.id = l.player_item_id
                                     where l.status = 'active' and (pi.location <> 'listed' or pi.owner_id <> l.seller_id)`);
    eq(listedWrong.n, 0, 'listings consistent');
    const txMismatch = await one(`select count(*)::int as n from game.transactions t where t.balance_after < 0`);
    eq(txMismatch.n, 0);
  });

  const ok = summary();
  await pool.end();
  process.exit(ok ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
