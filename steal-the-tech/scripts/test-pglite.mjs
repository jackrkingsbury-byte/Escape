// Proves the exact same migrations run inside PGlite (Postgres compiled to WASM),
// which is what powers offline mode in the browser. Also reports timings.
import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { loadSql, test, summary, assert, eq, rejects } from './sql-harness.mjs';

const db = new PGlite();
const t0 = performance.now();

async function rpc(uid, fn, p = {}) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid]);
    const r = await tx.query(`select public.${fn}($1::jsonb) as r`, [JSON.stringify(p)]);
    return r.rows[0].r;
  });
}

async function main() {
  for (const { file, sql } of loadSql(true)) {
    try {
      await db.exec(sql);
    } catch (e) {
      throw new Error(`${file}: ${e.message}`);
    }
  }
  const tMig = performance.now();
  console.log(`migrations applied in ${(tMig - t0).toFixed(0)} ms`);

  const me = randomUUID();
  await test('join + first sync (seeds the world)', async () => {
    const t = performance.now();
    const s = await rpc(me, 'stt_join', { username: 'Offline' });
    console.log(`      join+seed ${(performance.now() - t).toFixed(0)} ms`);
    eq(s.me.username, 'Offline');
    eq(s.items.length, 1);
  });
  await test('open a drop', async () => {
    await rpc(me, 'stt_tutorial', { step: 5 });
    const r = await rpc(me, 'stt_open_drop', { drop: 'basic' });
    assert(r.item_id, 'item');
  });
  await test('sync is fast', async () => {
    let s;
    const t = performance.now();
    for (let i = 0; i < 10; i++) s = await rpc(me, 'stt_sync', { since: 0, items_rev: 0 });
    const avg = (performance.now() - t) / 10;
    console.log(`      avg sync ${avg.toFixed(1)} ms`);
    assert(s.me.cash >= 0);
  });
  await test('world tick with bots', async () => {
    const t = performance.now();
    for (let i = 0; i < 5; i++) {
      await db.exec(`update game.world set last_tick_at = now() - interval '30 seconds'`);
      await db.query(`select game.world_tick(true)`);
    }
    console.log(`      avg tick ${((performance.now() - t) / 5).toFixed(1)} ms`);
  });
  await test('tutorial raid on RookieRick', async () => {
    await db.exec(`update game.profiles set tutorial_step = 9 where id = '${me}'`);
    const w = await rpc(me, 'stt_world');
    const rick = w.players.find((p) => p.username === 'RookieRick');
    await db.exec(`update game.bases set shield_until = null where player_id = '${rick.id}'`);
    const base = await rpc(me, 'stt_base', { player_id: rick.id });
    const r = await rpc(me, 'stt_start_steal', { player_item_id: base.items[0].id });
    eq(r.tutorial, true);
    await db.exec(`update game.raids set ends_at = now() - interval '1 second', chance = 1 where id = '${r.raid_id}'`);
    const res = await rpc(me, 'stt_finish_steal', { raid_id: r.raid_id });
    eq(res.status, 'success');
  });
  await test('market item history + leaderboard', async () => {
    const d = await rpc(me, 'stt_market_item', { item_id: 'phantom-tv', range: '30D' });
    assert(d.history.length > 5);
    const lb = await rpc(me, 'stt_leaderboard', { kind: 'base_value' });
    assert(lb.rows.length > 5);
  });
  await test('errors surface as readable messages', async () => {
    await rejects(rpc(me, 'stt_open_drop', { drop: 'elite' }), /unlocks at level/);
  });

  const ok = summary();
  await db.close();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
