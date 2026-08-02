# SBC Autopilot

Solve FC 26 Squad Building Challenges from your own club. Two front ends over one engine:

| | |
|---|---|
| **`/fc26/`** | Solver page. Paste your club and the SBC as text. |
| **`/fc26/install.html`** | Bookmarklet. Runs inside the FUT Web App, reads your club and the SBC on screen, solves it there. |

No build step for the pages, no backend, no dependencies. `build.mjs` exists only to pack the
bookmarklet.

## Files

```
engine.js            shared core — parsing, rating, chemistry, search. No DOM.
index.html           solver page (loads engine.js)
pilot.src.js         bookmarklet payload: harvester + panel UI
build.mjs            engine.js + pilot.src.js → install.html + sbc-autopilot.user.js
install.template.html  source for install.html — edit this, not install.html
install.html         GENERATED
sbc-autopilot.user.js  GENERATED (Tampermonkey)
test/                Playwright suites + a mock FUT Web App
```

After editing `engine.js` or `pilot.src.js`, run `node fc26/build.mjs` to regenerate the
bookmarklet, or the installed copy goes stale.

## The bookmarklet

Drag one link to the bookmarks bar; a panel opens on the web app. It **reads the page and
nothing else** — no clicking, dragging, submitting or automating, and no network calls at all.

- **Harvest** collects players as you scroll your club. The web app virtualises the list, so it
  can only see what has been rendered — you have to scroll through.
- **Read requirements** scrapes the SBC panel into an editable box, then parses it.
- **Solve** runs the shared engine and lists the eleven players and their slots.
- **Copy club** dumps everything harvested as TSV for the solver page.

Reading is heuristic by design. Rather than EA's class names, which change every year, a player
tile is found by shape: a 40–99 rating, a position token, a crest. Club, league and nation come
from the numeric ids in crest/flag URLs — chemistry only needs identity, not names — falling back
to image `alt` text when the app provides it. Requirements are scoped to the ancestor shared by
the most requirement-shaped lines, which keeps the club list and reward text out of the rules.

**EA's terms ban third-party FUT tools**, including this one. It was built read-only partly for
that reason: it never acts for you, so there are no automated actions. Risk is on your account.

## Known limitations

- **Prices in the bookmarklet are estimated from rating.** The club list shows no market values
  and the tool won't call a price site, so "cost" is a proxy for how painful a player is to spend.
  Use the solver page with pasted prices if you want real coins.
- **Identical duplicate cards collapse into one.** Dedupe is by name + rating + club + nation,
  and nothing in the DOM reliably distinguishes two copies of the same card.
- **Rare / TOTW detection is unreliable.** The web app signals card type visually; only class-name
  and text hints are available.
- **The harvester has never run against the live web app.** That needs an EA login. It passes
  against a deliberately awkward mock (see below), which proves the machinery, not the selectors.

## The maths

**Squad rating** — sum the 11 ratings, take the average, sum how far each player sits above that
average, add the excess to the sum, divide by 11, round down. The exact decimal is shown, and
squads landing on `.0x` are flagged `tight`; the safety-margin option only accepts squads clearing
the target by 0.5 in case EA rounds differently.

**Chemistry** — a player earns points only when played in a position he's listed for. Points come
from squadmates sharing his club (2/4/7 → 1/2/3), league (3/5/8 → 1/2/3) and nation (2/5/8 →
1/2/3), capped at 3 per player and 33 per squad. Out-of-position players still count toward
everyone else's tallies. Icons get 3 in position and count double toward their nation; heroes get
3 in position and count double toward their league.

**Card quality** is derived from rating: bronze under 65, silver 65–74, gold 75+.

## Search design

Feasibility is lexicographically ahead of price. An earlier version weighted unmet rules in coins,
which meant the search returned a cheap squad that failed the SBC — a 1-point rating shortfall
priced at 9,000 coins loses to a 400k upgrade. Now one unmet rule costs more than the most
expensive squad you could field, so a passing squad always beats a failing one. Each restart runs
two phases: repair (satisfy the rules, cost as tie-breaker) then trim (get it cheap, refusing any
move that breaks a rule).

It's a heuristic, not a proof of optimality — a cheaper squad may exist. Raise the effort setting
and run it again if the price looks high.

## Tests

```
node fc26/test/page.test.mjs      solver page: parsing, phrasings, solve, verification
node fc26/test/options.test.mjs   options, repeatability, formations, persistence, mobile
node fc26/test/pilot.test.mjs     bookmarklet against the mock web app
```

Real Chromium via Playwright. The solve tests recompute rating and chemistry independently from
the rendered squad rather than trusting the tool's own numbers, and an unsatisfiable SBC is
checked to fail loudly instead of faking a pass.

`test/mock-webapp.html` is a deliberately unhelpful stand-in for the FUT Web App: obfuscated class
names, a virtualised list that only keeps a window of tiles in the DOM, requirement rows split
across label and value elements, a "Reward: Premium Gold Pack" line next to the rules, and decoy
numbers in the rating range scattered around the header. It caught real bugs — tiles picked up
metadata instead of names, multi-position text nodes not being split, reward text parsed as a
quality rule, and a debounced observer that starved while the list was being scrolled. **Passing
it proves the harvest → parse → solve pipeline works on DOM shaped like the real thing. It is not
proof it works on the live web app.**

## Notes

Unofficial fan-made tool. Not affiliated with, endorsed by, or connected to EA Sports or the FC
series. Nothing is uploaded — club data stays in `localStorage` (page) or memory (bookmarklet).
Demo club players are fictional. Always sanity-check a squad in game before submitting it.
