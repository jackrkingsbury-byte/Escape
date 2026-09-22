# STEAL THE TECH

An online collection / base-building / trading / raiding game set in **Tech City**.

**FIND → COLLECT → DISPLAY → EARN → PROTECT → RAID → STEAL → TRADE → SELL → UPGRADE → REPEAT**

You own a base. Tech you put on display earns money every second. Money buys drops;
drops give better tech. Better tech is worth more, earns more, and makes other
players want it. They can walk into your base and try to steal it. You get warned,
you can sound the alarm or lock it in your vault, and if they get away with it you
can take revenge. Everything has a live market price driven by supply and demand.

All brands (NOVA, VOLT, NEXUS, APEX, ZENITH, QUANTUM, ORBIT, PULSE, KRYO, LUMA, ONYX,
VERTEX), item names and artwork are fictional and drawn in code. The economy is
fictional in-game cash only: no real-money purchases, trading, betting, deposits,
withdrawals, cash-outs or crypto.

---

## Play it

| Where | How |
|---|---|
| GitHub Pages (after this branch is merged to `main`) | `https://jackrkingsbury-byte.github.io/Escape/steal-the-tech/` |
| Locally | `cd steal-the-tech && npm install && npm run build && node scripts/serve.mjs` → http://localhost:4173 |
| Dev server (hot reload) | `npm run dev` → http://localhost:5173 |

With no server configured the game starts in **offline practice mode**: the real game
server (the same SQL that runs on Supabase) runs inside your browser in
[PGlite](https://pglite.dev) and your save lives in IndexedDB. The other bases belong
to NPC players, clearly labelled **NPC** / 🤖 everywhere. Configure Supabase (below)
and a **PLAY ONLINE** button appears for real multiplayer.

Controls — desktop: WASD / arrows to walk, click the ground to walk there, click
buildings or items, **E** to enter, scroll to zoom, hotkeys B/O/C/M/R/T/L/P/Q for
panels, Esc to close. Mobile: drag on the left half for the joystick, tap to walk or
pick items, big buttons for everything.

---

## What's in the game

| # | Requirement | Where / status |
|---|---|---|
| 1 | Personal Tech Base, 160 fictional items with rarity, base value, live market value, income/s, supply, demand, owner, protected & tradeable flags | `scripts/catalog-data.mjs` → generated SQL; `game.items`, `game.player_items`, `game.market_state` |
| 2 | Core loop: start small (starter TV, $500, basic security), earn, upgrade | `game.act_join`, `game._settle` (server-side income, 12h offline cap) |
| 3 | World with bases, central market, drop area, raid board, trading area, event area; walk around | `client/src/world/*` — 2.5D canvas city, 18 base plots, NPC shopkeepers, wandering NPCs, minimap |
| 4 | Base levels 4 → 8 → 12 → 16 → 24 → 32 → 40 → 50 slots; items physically on display (TVs on wall panels, PCs on desks, cars on garage turntables, Mythic+ on special platforms) | `game.upgrade_levels`, `world/draw.ts` |
| 5 | Base value & income, live | `stt_sync` computes both; HUD interpolates cash between syncs (display only) |
| 6 | 9 rarities with escalating effects (plain → glow → purple → gold → animated → rainbow → dramatic Secret → Limited supply badge) | `styles.css` `.r-*`, world glows/platforms |
| 7 | Secret items (supply 5–10 each) + server-wide 🚨 SECRET DISCOVERED | `secret_found` event → full-screen overlay for everyone |
| 8 | Limited items with hard supply caps & serials (`SUPPLY 73/100`) | `game.limited_item_supply` (row-locked mint, never exceeded — tested) |
| 9 | Basic / Premium / Elite / Ultra / Event / Secret drops, bought only with earned cash, odds published on every machine | `game.drop_types`; prices = 1.06 × expected value |
| 10 | Drop animation: focus, shake, lights, rarity flashes, open, reveal, rotate, add; Secret/Ultra flash + particles + big text + server notice | `ui/overlays.tsx` `DropOverlay` |
| 11–13 | Stealing with STEALING… progress, owner warning + response, raid board with base value / security / top item, success moves the item, failure = cooldown + small fine paid to the defender | `act_start_steal` / `act_defend` / `act_finish_steal` / `_resolve_raid` |
| 14 | Vault (3 → 5 → 10 → 15 → 25 → 40); vaulting mid-raid foils the theft | `act_vault` |
| 15 | Security levels 1–6 (Basic Alarm … Quantum Security) cut odds & slow steals; visible gadgets at base entrances | `_raid_chance`, `drawSecurity` |
| 16 | Revenge after a theft (24h, +15% odds, ignores shields) | `q_revenge`, raid panel |
| 17–19 | Player market (list, buy, cancel, 5% fee, price bounds), dynamic prices from supply/demand/events, graphs 1H/24H/7D/30D/ALL with sales/supply/demand/owners/listed | `act_list`, `act_buy_listing`, `_tick_market`, `q_market_item`, `PriceChart` |
| 20 | Direct trades: items + cash both ways, both players confirm, final hold-to-confirm screen, safe failure if anything changed | `act_trade_propose` / `_execute_trade` |
| 21 | Market events: Tech Boom, Car Week, Gaming Festival, Fashion Week, Secret Hunt, Market Crash | `game.event_types`, `_tick_events` |
| 22 | Global live feed: discoveries, big pulls, steals, raid alerts, market alerts, supply alerts | `game.server_events` (+ Supabase Realtime) |
| 23–24 | Collection book (6 categories, ??? for unknown, %), choose a collection focus | `CollectionPanel`, `act_set_focus` |
| 25 | XP & levels with titles (Rookie → Collector → Trader → Raider → … → Tech Legend) and level rewards | `game._xp`, `game.level_titles` |
| 26 | Prestige at level 25: +5% income & luck per prestige, keep vault/collection/cosmetics | `act_prestige` |
| 27 | Daily & weekly quests with cash/drop/XP/cosmetic/secret-key rewards | `game.quests`, `act_claim_quest` |
| 28 | 7-day daily reward streak | `act_claim_daily` |
| 29 | 8 leaderboards | `q_leaderboard` |
| 30 | Profiles with visit / trade / raid / view collection | `q_profile`, `ProfilePanel` |
| 31 | Cosmetics (themes, floors, walls, lighting, platforms, trails, nameplates, emotes, item animations) — visual only | `game.cosmetics`, `act_buy_cosmetic`, `act_equip` |
| 32 | Mobile + desktop, large touch targets | responsive CSS, joystick, tap-to-move |
| 33–35 | Real backend, server validation, anti-cheat | see **Security model** |
| 36 | Economy safety | fictional cash only; odds shown; drops never EV-positive to resell (tested) |
| 39 | 12-step first-time tutorial incl. a guaranteed beginner raid | `Tutorial` + `act_tutorial` |

---

## Architecture

```
 Browser (React + Canvas)                         Server (Postgres)
 ┌──────────────────────────────┐   stt_* RPC    ┌───────────────────────────────────┐
 │ world/  2.5D city renderer    │ ─────────────▶ │ public.stt_*   (SECURITY DEFINER)  │
 │ ui/     HUD, panels, overlays │                │   └▶ game.act_* / game.q_*          │
 │ game/   store, session, sound │ ◀───────────── │ game.world_tick (market, events,   │
 └───────────────┬──────────────┘   jsonb state   │   NPC bots) — lazily every 10s      │
                 │ Backend interface               │ game.* tables: RLS on, no policies │
       ┌─────────┴──────────┐                      └───────────────────────────────────┘
       │ OfflineBackend      │  PGlite in a Web Worker, same migrations, IndexedDB save
       │ SupabaseBackend     │  Supabase Auth + RPC + Realtime (feed + avatar presence)
       └─────────────────────┘
```

* **One rules engine.** Every rule lives once, in SQL (`supabase/migrations`). Online it
  runs on Supabase; offline the *same files* run in PGlite inside the browser.
* **Stack.** React 19 + Vite + TypeScript, zustand, HTML canvas (2.5D). Supabase
  (Postgres, Auth, Realtime). Vite was chosen over Next.js because the game is a single
  canvas-heavy SPA that deploys as static files anywhere (GitHub Pages, Vercel,
  Netlify) and talks to Supabase directly — there is no server rendering to do.
* **The living world.** `game.world_tick()` runs at most every 10 seconds, triggered
  by any player request (or by pg_cron). It moves prices, rotates events, records
  price history, resolves raids and runs NPC players: they open drops, trade on the
  market, answer trade offers, make offers of their own, rob each other, and
  occasionally raid *active* human players (never during the tutorial, never twice in
  8 minutes, always with at least 12 seconds to react).

### Security model (anti-cheat)

* Game tables live in schema `game` with **row-level security enabled and no client
  policies** — a browser can't read or write them at all (tested: `permission denied`).
* Clients can only call `public.stt_*` functions. Each one identifies the caller with
  `auth.uid()` (never an id from the request), locks the rows it touches
  (`SELECT … FOR UPDATE`, two-party actions lock both players in id order) and
  computes every outcome on the server: prices, loot rolls, raid results, fees.
* Timing is server time: income accrues from `last_income_at`, steals can't finish
  before `ends_at`, cooldowns and shields are server timestamps. Speeding up the
  browser does nothing.
* Limited/secret supply is minted with a guarded `UPDATE … WHERE minted < max_supply`.
* Every cash change is written to `game.transactions`; every item creation, transfer
  and burn to `game.item_log`.
* Tests prove: no reading/writing tables, no minting, no calling engine functions,
  no overspending under 10 parallel requests, exactly one winner when two players buy
  the same listing, trades fail safely if anything changed hands, feed privacy.
* Offline mode is a single-player practice sandbox on your own device, so its data is
  yours to tamper with. Only online mode is competitive.

---

## Going online with Supabase

1. Create a Supabase project.
2. Run the migrations **in order** (SQL editor, or `supabase db push` with the CLI):
   `supabase/migrations/20260922000001_schema.sql` … `…000005_api.sql`.
   They're idempotent: safe to re-run after updates. **Never** run
   `supabase/local/shim.sql` on Supabase; it only fakes Supabase for local testing.
3. Authentication → Providers: enable **Anonymous sign-ins** (for "Play as guest").
   Email sign-in works too; guests can save their account with an email later.
4. (Recommended) Database → Extensions → enable `pg_cron`, then run
   `select cron.schedule('stt-tick', '* * * * *', 'select game.world_tick()');`
   so the world keeps ticking even when nobody's online.
5. Put your project URL and **anon** key in `play/config.js` (or `client/public/config.js`
   before building). The anon key is designed to be public.
6. Reload: the title screen now shows **PLAY ONLINE**.

Realtime: the migration adds `game.server_events` to the `supabase_realtime`
publication, and RLS limits each player to global events plus their own. Avatars
walking around the city are shared through a Realtime broadcast channel.

---

## Development

```bash
npm install
npm run dev          # client with hot reload
npm run build        # regenerate catalog SQL, typecheck, build into ./play
npm run catalog      # regenerate the catalog migration + print drop economics
npm run test:sql     # 53 server tests on a real Postgres (TEST_DATABASE_URL, default postgres://postgres:postgres@localhost:5432/stt_test)
npm run test:pglite  # the same migrations inside PGlite (offline engine)
npm run test:e2e     # plays the built game in Chromium, desktop + mobile, with screenshots in ./test-results
```

`scripts/serve.mjs --local-pglite` serves the build with PGlite from `node_modules`,
for machines that can't reach the jsDelivr CDN.

### Layout

```
supabase/migrations/   schema · catalog (generated) · engine · world · api
supabase/local/        shim that fakes Supabase auth for local Postgres/PGlite
scripts/               catalog data + generator, dev server, test suites
client/src/backend/    Backend interface, offline (PGlite worker) + Supabase adapters
client/src/game/       store, session/sync loop, actions, sounds, formatting
client/src/world/      map layout, renderer, input, camera
client/src/art/        procedural item artwork
client/src/ui/         HUD, overlays, panels
play/                  built static site (served by GitHub Pages)
```

### Economy at a glance

* Drops cost 1.06× their expected value; quick-sell pays 60% of market; market sales
  pay 95% (5% fee); NPC buyers only pay ≤ 95% of market. Reselling pulls always loses
  (tested), so income from displayed items drives progress.
* Prices follow demand (drifts toward 50, pushed by events and purchases), relative
  scarcity against same-rarity peers, listing pressure, and event multipliers.
  Numbered runs get pricier as they sell out.

---

## Honest status & next steps

* Verified here: the SQL engine on PostgreSQL 16 (53 tests) and PGlite (7 tests), and
  the built game played end to end in Chromium at desktop and phone sizes (tutorial,
  drops, beginner raid, every panel, market chart, listing, NPC trade, daily reward,
  reload persistence).
* **Not yet exercised against a live Supabase project** from this build environment:
  the Supabase adapter (auth, RPC, Realtime feed and presence) is written against
  supabase-js v2 and type-checks, but needs a project to run for real.
* The world is 2.5D canvas, not full 3D.
* Not built yet: chat, reporting/moderation, username filtering, server-side rate
  limits beyond the game's own cooldowns (Supabase's defaults apply).
