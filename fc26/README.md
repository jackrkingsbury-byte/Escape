# SBC Autopilot

Paste an FC 26 Squad Building Challenge, paste your club, get the cheapest 11 that passes.

Live at `/fc26/` once GitHub Pages publishes the branch.

Single self-contained `index.html` — no build step, no dependencies, no backend. Same shape as `/grow/`.

## What it does

1. **Paste your club.** One player per line. It sniffs the format rather than demanding one:
   CSV, tab-separated, pipe-separated, or just spaced out. A header row is used if present,
   otherwise fields are identified by content — a number in 40–99 is a rating, `ST`/`CM,CAM`
   is a position list, known nations and leagues are matched against a built-in lexicon,
   `12k` / `1.4m` is a price, and `untradeable` / `rare` / `totw` / `icon` / `hero` are tags
   picked up anywhere on the line.
2. **Paste the SBC.** Requirements are parsed straight from EA's phrasing into editable rules —
   `Squad Rating: Min. 84`, `Same League Count: Max. 3`, `Nations: Max. 4`, `85+ OVR Players: Min. 2`,
   `Player Quality: Exactly Gold`, `Premier League Players: Min. 3`, and so on. Anything it can't
   read is listed so you can add it by hand; every parsed rule is editable.
3. **Solve.** Randomised swap search with restarts, then the result is shown on a pitch with a
   per-rule pass/fail checklist.

Named leagues, nations and clubs are resolved against *your* club data, so
`Premier League Players: Min. 3` works without hardcoding every league in the game.

## The maths

**Squad rating** — sum the 11 ratings, take the average, sum how far each player sits above that
average, add the excess to the sum, divide by 11, round down. The exact decimal is displayed, and
squads landing on `.0x` are flagged `tight`; the safety-margin option only accepts squads clearing
the target by 0.5 in case EA rounds differently.

**Chemistry** — a player earns points only when played in a position he's listed for. Points come
from squadmates sharing his club (2/4/7 → 1/2/3), league (3/5/8 → 1/2/3) and nation (2/5/8 → 1/2/3),
capped at 3 per player and 33 per squad. Out-of-position players still count toward everyone else's
tallies. Icons get 3 in position and count double toward their nation; heroes get 3 in position and
count double toward their league.

**Card quality** is derived from rating: bronze under 65, silver 65–74, gold 75+.

## Search design

Feasibility is lexicographically ahead of price. An earlier version weighted unmet rules in coins,
which meant the search happily returned a cheap squad that failed the SBC — a 1-point rating
shortfall priced at 9,000 coins loses to a 400k upgrade. Now one unmet rule costs more than the most
expensive squad you could field, so a passing squad always beats a failing one. Each restart runs
two phases: repair (satisfy the rules, cost as tie-breaker) then trim (get it cheap, refusing any
move that breaks a rule).

It's a heuristic, not a proof of optimality — a cheaper squad may exist. Raise the effort setting
and run it again if the price looks high.

## Tests

Driven through real Chromium with Playwright — club parsing across formats, SBC phrasings, an
end-to-end solve whose rating and chemistry are recomputed independently from the rendered squad,
option toggles, an unsatisfiable SBC (must fail loudly, not fake a pass), reload persistence, and
mobile overflow.

## Notes

Unofficial fan-made tool. Not affiliated with, endorsed by, or connected to EA Sports or the FC
series. Nothing is uploaded — club data is kept in `localStorage` only. Demo club players are
fictional. Always sanity-check a squad in game before submitting it.
