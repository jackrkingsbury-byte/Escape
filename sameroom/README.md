# Same Room

**Chat that only opens when you're actually there.**

A room belongs to an event and a place. Walk inside the venue and it unlocks. Walk out and it
closes behind you — you keep seeing that the room is busy, and nothing that was said in it.
Connect with someone while you're both inside, and that one thread stays open wherever you both
go afterwards.

That's the whole idea: **distance decides what you can read, until you've met someone. Then it
stops mattering.**

| | |
|---|---|
| **`/sameroom/`** | The app. One page, no build step, no dependencies. |
| **`supabase/0001_init.sql`** | Schema, row-level security and the fence, enforced in Postgres. |
| **`test/core.test.mjs`** | The rules, tested. `node --test sameroom/test/*.test.mjs` |

## The three screens that matter

**The gate** — what you see when you're not there. The room's name, how many people are inside,
how many messages a minute, your distance and a compass arrow. Four blurred lines where the
conversation would be. It is a door you can hear through.

**The room** — unlocked, because you're standing in it. Group chat, plus everyone else checked in
right now, described as *"a few steps away"* or *"across the room"*. Never a map, never a dot,
never a coordinate.

**The thread** — you waved, they waved back. Now you have a private conversation that survives the
event ending and either of you going home.

## How "being there" is decided

One function, `fenceCheck()` in `core.js`, mirrored exactly by `sr_gate()` in the SQL. You're in
when all four hold:

1. **The doors are open** — from an hour before the start to 90 minutes after the end.
2. **You're inside the circle** — the host sets a radius, 25 m to 2 km, plus 15 m of slack for
   GPS jitter around a doorway.
3. **Your fix is precise enough to prove it** — a fix vaguer than `max(60 m, the radius)`, capped
   at 250 m, proves nothing about a venue-sized circle and is refused rather than trusted.
4. **You keep saying so** — a heartbeat every 20 seconds. Stop, and you drop off the room in 75
   seconds. Step outside, and you keep your seat for a 150-second grace window (smoke, toilet,
   phone call) before the room closes.

Both halves of the app run that check. The browser runs it to decide what to draw; the database
runs it again, on the coordinates it was handed, to decide what to return. Skipping the client is
useless.

### What this cannot do

Any phone can be told to report a false position — dev tools, a mock-location app, a rooted
device. **No web app can prove a stranger is really standing where their phone says they are.**
Same Room narrows it and is honest about the rest:

- the distance check runs in Postgres, not in the page, so a patched client gains nothing;
- imprecise fixes are rejected instead of given the benefit of the doubt;
- movement faster than a passenger jet between two fixes is flagged as a spoof;
- presence decays, so a single forged fix buys 75 seconds, not an evening.

Treat the fence as a good door, not a lock. For a room where that isn't enough, a host should be
handing out the code at the actual door.

## Privacy, concretely

- Your coordinates are stored as **one row: your latest fix for the room you're in**, and deleted
  when you leave. They exist to answer "inside or outside", nothing else.
- **No one is ever sent another person's coordinates.** `sr_people()` converts them to a band —
  `here` / `steps` / `across` / `edge` — inside the database. Raw columns aren't selectable by
  anyone but you; RLS enforces it.
- **Messages are readable only while you're present.** That's an RLS policy calling
  `sr_is_present()`, not a screen that hides things. Supabase Realtime honours RLS too, so walking
  out doesn't just hide the feed — the rows stop being sent.
- **Rooms are temporary.** Messages and check-ins are purged 24 hours after an event ends.
  Threads you made are kept: those are yours.
- No account, no phone number, no email, no photo. A name and an emoji.

## Running it

It's a static page. Open it over HTTP (geolocation needs a secure context — `localhost` counts):

```sh
cd sameroom && python3 -m http.server 8000   # then http://localhost:8000
```

On first run it seeds two **demo rooms** pinned to wherever you are: one you're standing inside,
one 2.4 km away. That pair is the whole product on one screen. Demo rooms and demo people are
labelled as such, live only in this browser's `localStorage`, and can be wiped from Settings.

### Real rooms, real strangers

1. Create a Supabase project and run `supabase/0001_init.sql` in the SQL editor.
2. Turn on **anonymous sign-ins** (Authentication → Providers → Anonymous). Same Room has no
   accounts; every visitor is an anonymous auth user.
3. Optionally schedule the purge:
   `select cron.schedule('sameroom-purge', '17 * * * *', $$select sr_purge()$$);`
4. In the app: **⚙ → Supabase project URL + anon key → Save**. The anon key is meant to be
   public; RLS is what protects the data.

The app falls back to on-device rooms if the project can't be reached, rather than showing a blank
screen.

## Files

```
index.html   page shell, three script tags
core.js      the rules: geofence, phases, distance language, codes, validation. No DOM, no network.
store.js     two backends behind one interface — LocalBackend, SupabaseBackend
app.js       screens, geolocation watcher, heartbeat loop
app.css      one stylesheet, phone first
supabase/0001_init.sql   tables, RLS, and sr_* functions — every write goes through one
test/core.test.mjs       23 tests over core.js
```

`core.js` is the only place the rules live, and it's loaded by the browser and by node the same
way — so the tests check what the app runs. The SQL deliberately restates the same constants; if
you change `RULES` in `core.js`, change `sr_rules()` too.

## Tests

```sh
node --test sameroom/test/*.test.mjs
```

Covers the geometry, the gate (inside, outside, edge slack, vague fixes, right place at the wrong
time), spoof detection, distance banding, code normalisation, presence expiry and the grace
window.
