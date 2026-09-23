# STEAL THE TECH

A 3D online collect / defend / steal / trade game set in **Tech City**, played like
*Steal a Brainrot*, but with tech. The items are gadgets with googly eyes that walk
along a conveyor on little legs.

**BUY OFF THE BELT → DISPLAY → COLLECT → LOCK → GRAB → RUN → STEAL → TRADE → SELL → UPGRADE → REPEAT**

Gadgets walk along the **Tech Belt** through the middle of the city. Run up and buy
one before anyone else does, and it hops off and runs into your base. Every item on a
podium piles up cash, and you walk over its glowing plate to collect. Other players
(and NPC robots) can walk into your base, **grab** your best item and **carry it home**
over their head. Chase them down and **tag** them to get it back, or step on the red
pad to **lock** your door with lasers. Do the same to everyone else: grab, run, and
don't get caught.

All brands (NOVA, VOLT, NEXUS, APEX, ZENITH, QUANTUM, ORBIT, PULSE, KRYO, LUMA, ONYX,
VERTEX), item names and models are fictional and built in code. The economy is
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
to NPC players, who are robots in the world and are labelled 🤖 everywhere. Configure
Supabase (below) and a **PLAY ONLINE** button appears for real multiplayer.

**Controls**
- **Desktop:** WASD / arrows to run, **Shift** to sprint, **Space** to jump, drag to
  look around, scroll to zoom, and **E** for the big action button (buy · steal ·
  tag · enter). Click the ground to walk there, or click an item for details.
  B/O/C/M/R/T/L/P/Q open panels and Esc closes them.
- **Phone:** the left side is a joystick; drag the right side to look around and
  pinch to zoom. ⤒ jumps, ⚡ sprints, and the big button does the action.
- Walk over a **green plate** to collect that podium's cash. The 💰 pad by your door
  collects everything, and the red 🔒 pad locks your base.

---

## How it plays

| Mechanic | What happens | Server side |
|---|---|---|
| **Tech Belt** | A shared conveyor of gadgets scheduled 25s ahead so every client sees the same smooth stream (~1 item every 3s, 36s ride). Commons are common; Legendary+ get light beams and a city-wide banner; Ultra/Secret get a countdown *before* they roll out. Anyone can buy what's on it, and exactly one buyer wins. NPCs shop too, but only after an item is 15s along, so humans get first pick. | `game.belt`, `_belt_fill`, `act_buy_belt`, `_bot_belt` |
| **Podium cash** | Each displayed item piles up cash on its own podium: a live counter plus a stack of gold coins on its plate, capped at 12 hours. Step on the plate and coins fly into you with a cha-ching whose pitch climbs with your combo. Anything leaving a podium (stored, sold, stolen, traded) banks its pile for the owner first. | `player_items.accrued_at`, `_pending`, `act_collect`, `_items_accrual` trigger |
| **Base lock** | The red pad at your door raises laser gates for 30s + 10s per security level. Nobody can start a raid on a locked base, and the lasers physically block the doorway. The lock needs 10s to recharge after it drops. NPCs lock their bases now and then too. | `bases.lock_until`, `act_lock_base`, `_raid_block_reason` |
| **Grab → carry** | Stand at a podium and press STEAL. The **grab** takes 3–14s depending on security and rarity; then a server roll decides whether you beat the lasers. If you win, the item goes over your head and you **run it home**. The owner (and a security drone at SEC 2+) chases you, you get 45s, and it's only yours once you're inside your base. Owners can **tag** a thief to take the item back and collect a bounty. Take too long and it snaps back. | `raids.phase`, `act_start_steal`, `act_finish_steal`, `act_deliver_steal`, `act_abort_steal`, `act_defend(tag)` |
| **NPC thieves** | Robots walk into your base, grab and run for their own base. You see them coming, can sound the alarm or vault the item during the grab, and can chase and tag them during the run. | `_bot_raid_human`, carry timeline in sync |
| **Mutations** | GOLD ×1.25 · DIAMOND ×1.5 · NEON ×2 · HOLO ×3 · GLITCH ×5 · RAINBOW ×10 to income *and* value. 15% of belt items and 3% of drop pulls are mutated, and the multiplier is priced in. Mutated items get their own materials (chrome gold, iridescent holo, flickering glitch, hue-cycling rainbow). | `game.mutations`, `player_items.mutation` |

Everything from the first version is still here: drops with a full reveal animation,
Secret and Limited items with serial numbers, the live market with price charts, NPC
trades with hold-to-confirm, raid board and revenge, vault, security levels, quests,
the 7-day daily reward, 8 leaderboards, profiles, cosmetics, prestige, events and the
live feed.

**Tutorial (12 steps):** welcome → your base → collect your cash → buy off the belt
(you get $600) → rarities & mutations → lock your base → first drop (on us) → meet
RookieRick → grab something (the beginner raid always works) → RUN HOME → market →
done.

---

## Architecture

```
 Browser (React + Three.js)                        Server (Postgres)
 ┌──────────────────────────────┐   stt_* RPC    ┌───────────────────────────────────┐
 │ world/  3D engine, models, FX │ ─────────────▶ │ public.stt_*   (SECURITY DEFINER)  │
 │ ui/     HUD, panels, overlays │                │   └▶ game.act_* / game.q_*          │
 │ game/   store, session, sound │ ◀───────────── │ game.world_tick (belt, market,     │
 └───────────────┬──────────────┘   jsonb state   │   events, raids, NPC bots) ≤ 10s    │
                 │ Backend interface               │ game.* tables: RLS on, no policies │
       ┌─────────┴──────────┐                      └───────────────────────────────────┘
       │ OfflineBackend      │  PGlite in a Web Worker, same migrations, IndexedDB save
       │ SupabaseBackend     │  Supabase Auth + RPC + Realtime (feed + avatar presence)
       └─────────────────────┘
```

* **One rules engine.** Every rule lives once, in SQL (`supabase/migrations`). Online it
  runs on Supabase; offline the *same files* run in PGlite inside the browser.
* **Stack.** React 19 + Vite + TypeScript, zustand, **Three.js** (WebGL). Supabase
  (Postgres, Auth, Realtime). The game is a single canvas-heavy SPA that deploys as
  static files anywhere and talks to Supabase directly.
* **The 3D world** (`client/src/world`):
  * `models.ts` builds every one of the 44 item kinds procedurally, plus avatars
    (people for players, robots for NPCs), podiums, and the mutation materials. Each
    item's parts are baked into one mesh per material, so a whole base draws in a few
    dozen calls.
  * `scenery.ts` holds the belt and its portals, drop machines, market, raid board,
    stage, obelisk, and skyline, with live canvas screens.
  * `engine.ts` has the controller, camera, bases, belt, NPC AI, thieves and chasers,
    and interactions.
  * `fx.ts` does sparks, flying coins, confetti and shockwaves; `labels.ts` does the
    crisp HTML name tags, price tags and cash counters.
  * High quality adds bloom and shadows. Phones start on the lighter renderer.
* **The living world.** `game.world_tick()` runs at most every 10 seconds, triggered by
  any player request (or pg_cron). It refills the belt, moves prices, rotates events,
  records price history, resolves raids and runs NPC players.
* **Multiplayer layout.** Each client puts its own base at the centre of the south row.
  Presence therefore sends positions *relative to the base you're standing in*
  (`plot` = owner id), so everyone sees each other in the right base.

### Security model (anti-cheat)

* Game tables live in schema `game` with **row-level security enabled and no client
  policies**, so a browser can't read or write them at all (tested: `permission denied`).
* Clients can only call `public.stt_*` functions. Each one identifies the caller with
  `auth.uid()` (never an id from the request), locks the rows it touches, and computes
  every outcome on the server: prices, belt purchases, loot rolls, raid rolls, fees and
  cash piles.
* Timing is server time: podium cash accrues from `accrued_at`, grabs can't finish
  before `ends_at`, deliveries can't happen before `deliver_after` or after
  `carry_until`, and locks, cooldowns and shields are all server timestamps.
* Limited/secret supply is minted with a guarded `UPDATE … WHERE minted < max_supply`,
  including items bought off the belt.
* Every cash change goes to `game.transactions`; every item creation, transfer and burn
  goes to `game.item_log`.
* **Trusted from the client, by design:** *where* you are. The server doesn't simulate
  physics, so standing next to a belt item, reaching your base with loot, an NPC
  drone catching you, and tagging a thief are reported by the client. The server still
  enforces everything else: cash, timing windows, ownership, and one buyer per belt
  item. A cheater could skip walking. They couldn't mint, overspend, speed up timers,
  or take anything outside the raid rules.
* Offline mode is a single-player sandbox on your own device, so its data is yours to
  tamper with. Only online mode is competitive.

---

## Going online with Supabase

1. Create a Supabase project.
2. Run the migrations **in order** (SQL editor, or `supabase db push` with the CLI):
   `supabase/migrations/20260922000001_schema.sql` … `20260923000006_belt.sql`.
   They're idempotent, so they're safe to re-run after updates. **Never** run
   `supabase/local/shim.sql` on Supabase; it only fakes Supabase for local testing.
3. Authentication → Providers: enable **Anonymous sign-ins** (for "Play as guest").
   Email sign-in works too, and guests can save their account with an email later.
4. (Recommended) Database → Extensions → enable `pg_cron`, then run
   `select cron.schedule('stt-tick', '* * * * *', 'select game.world_tick()');`
   so the world (and the belt) keeps going even when nobody's online.
5. Put your project URL and **anon** key in `play/config.js` (or `client/public/config.js`
   before building). The anon key is designed to be public.
6. Reload: the title screen now shows **PLAY ONLINE**.

---

## Development

```bash
npm install
npm run dev          # client with hot reload
npm run build        # regenerate catalog SQL, typecheck, build into ./play
npm run catalog      # regenerate the catalog migration + print drop economics
npm run test:sql     # 62 server tests on a real Postgres (TEST_DATABASE_URL, default postgres://postgres:postgres@localhost:5432/stt_test)
npm run test:pglite  # the same migrations inside PGlite (offline engine), 8 tests
npm run test:e2e     # plays the built 3D game in Chromium, desktop + phone, screenshots in ./test-results
```

`scripts/serve.mjs --local-pglite` serves the build with PGlite from `node_modules`,
for machines that can't reach the jsDelivr CDN. The E2E runs WebGL on SwiftShader
(CPU), on the light renderer by default. Set `E2E_QUALITY=high` for bloom and shadows.

### Layout

```
supabase/migrations/   schema · catalog (generated) · engine · world · api · belt (Tech Belt update)
supabase/local/        shim that fakes Supabase auth for local Postgres/PGlite
scripts/               catalog data + generator, dev server, test suites
client/src/backend/    Backend interface, offline (PGlite worker) + Supabase adapters
client/src/game/       store, session/sync loop (+ belt polling), actions, sounds, formatting
client/src/world/      3D: layout, models, scenery, engine, fx, labels
client/src/art/        2D item icons for panels, drop crates
client/src/ui/         HUD, overlays, panels
play/                  built static site
```

### Economy at a glance

* Belt items cost **1.05 × market × mutation**. Drops cost 1.06× their expected value.
  Quick-sell pays 60% of (mutated) market value, market sales pay 95% (5% fee), and
  NPC buyers only pay ≤ 95% of market. So flipping belt items or drop pulls always
  loses (tested); income from your podiums drives progress.
* Prices follow demand, relative scarcity against same-rarity peers, listing pressure
  and event multipliers. Numbered runs get pricier as they sell out.
* Failed grabs cost a small fine (≤ 3% of your cash, ≤ 5% of the item's value), paid to
  the owner, plus a 20–30s cooldown.

---

## Honest status & next steps

* Verified here: the SQL engine on PostgreSQL 16 (62 tests), PGlite (8 tests), and the
  built 3D game played end to end in Chromium at desktop and phone sizes. That run
  covers the tutorial (collect, belt purchase, lock, drop, grab, carry home), every
  panel, the market chart, a listing, an NPC trade, the daily reward, raid alarms in
  both phases, and reload persistence.
* **Not yet exercised against a live Supabase project** from this build environment:
  the Supabase adapter (auth, RPC, Realtime feed and presence) is written against
  supabase-js v2 and type-checks, but needs a project to run for real.
* The sandbox renders WebGL on the CPU, so frame rate couldn't be measured on a real
  GPU here. Draw calls are ~170–420 per frame on the light renderer.
* Not built yet: chat, reporting/moderation, username filtering, server-side rate
  limits beyond the game's own cooldowns (Supabase's defaults apply).
