/**
 * Regression tests for the inbound pipeline's non-AI logic: conversation
 * history windowing and the rate limiter.
 *
 * Every case here pins behaviour that was previously wrong. Run:
 *   npx tsx scripts/pipeline.test.ts
 */
import { selectHistoryWindow, type HistoryRow } from "../lib/inbound";
import { rateLimit, clientIp, __resetRateLimitForTests } from "../lib/ratelimit";
import { expect, expectEqual, finish } from "./harness";

/* ---------------------- conversation history window ---------------------- */

/** Build `n` alternating turns, oldest first, ids "m1".."mN". */
function conversation(n: number): HistoryRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `m${i + 1}`,
    direction: (i % 2 === 0 ? "in" : "out") as HistoryRow["direction"],
    body: `turn ${i + 1}`,
  }));
}

/** What the DB returns: newest first, capped at the query limit. */
function newestFirst(rows: HistoryRow[], limit: number): HistoryRow[] {
  return [...rows].reverse().slice(0, limit);
}

{
  // A short conversation: 4 prior turns + the message we just inserted.
  const all = conversation(5);
  const justInserted = all[all.length - 1];
  const turns = selectHistoryWindow(newestFirst(all, 13), justInserted.id);

  expectEqual(
    "short conversation keeps all prior turns in chronological order",
    turns.map((t) => t.text),
    ["turn 1", "turn 2", "turn 3", "turn 4"],
  );
  expect(
    "the just-inserted message is excluded from history",
    !turns.some((t) => t.text === "turn 5"),
  );
  expectEqual(
    "inbound rows map to the customer role, outbound to business",
    turns.map((t) => t.role),
    ["customer", "business", "customer", "business"],
  );
}

{
  // THE REGRESSION. A long conversation: 40 turns, the 40th just inserted.
  // The old code ordered ascending and sliced positionally, so it fed the
  // agent turns 1-11 forever — it never saw anything the customer said after
  // turn 12 and would re-ask for details already given.
  const all = conversation(40);
  const justInserted = all[all.length - 1];
  const turns = selectHistoryWindow(newestFirst(all, 13), justInserted.id);

  expectEqual(
    "long conversation returns the 12 most RECENT prior turns",
    turns.map((t) => t.text),
    [
      "turn 27", "turn 28", "turn 29", "turn 30", "turn 31", "turn 32",
      "turn 33", "turn 34", "turn 35", "turn 36", "turn 37", "turn 38",
      "turn 39",
    ].slice(-12),
  );
  expect(
    "long conversation no longer replays the opening turns",
    !turns.some((t) => t.text === "turn 1"),
    `first turn shown: ${turns[0]?.text}`,
  );
  expect("history stays bounded at 12 turns", turns.length === 12, `${turns.length} turns`);
}

{
  // Fallback path: the insert didn't return an id, so the newest row is
  // dropped positionally instead.
  const all = conversation(6);
  const turns = selectHistoryWindow(newestFirst(all, 13), null);
  expectEqual(
    "without an id, the newest row is still excluded",
    turns.map((t) => t.text),
    ["turn 1", "turn 2", "turn 3", "turn 4", "turn 5"],
  );
}

{
  const rows: HistoryRow[] = [
    { id: "m3", direction: "in", body: "latest" },
    { id: "m2", direction: "out", body: null }, // media-only message
    { id: "m1", direction: "in", body: "first" },
  ];
  const turns = selectHistoryWindow(rows, "m3");
  expectEqual(
    "messages with no text body are skipped",
    turns.map((t) => t.text),
    ["first"],
  );
}

{
  expectEqual("an empty conversation yields no turns", selectHistoryWindow([], null), []);
  expectEqual(
    "a conversation of only the new message yields no turns",
    selectHistoryWindow([{ id: "m1", direction: "in", body: "hi" }], "m1"),
    [],
  );
}

/* ------------------------------ rate limiter ----------------------------- */

{
  __resetRateLimitForTests();
  const results = Array.from({ length: 4 }, () => rateLimit("k", 3, 60_000));
  expectEqual(
    "allows up to the limit, then blocks",
    results.map((r) => r.allowed),
    [true, true, true, false],
  );
  expect(
    "a blocked caller gets a retry hint of at least one second",
    results[3].retryAfterSeconds >= 1,
    `retryAfter=${results[3].retryAfterSeconds}`,
  );
}

{
  __resetRateLimitForTests();
  expect("separate keys hold separate budgets", rateLimit("a", 1, 60_000).allowed);
  expect("...so a second key is unaffected", rateLimit("b", 1, 60_000).allowed);
  expect("...and the first stays blocked", !rateLimit("a", 1, 60_000).allowed);
}

{
  // THE REGRESSION. The limiter used to call buckets.clear() once the map
  // exceeded MAX_BUCKETS, so spraying junk keys reset every live counter —
  // including the global demo budget the limiter exists to protect.
  __resetRateLimitForTests();
  expect("victim key consumes its only slot", rateLimit("victim", 1, 60_000).allowed);
  for (let i = 0; i < 5200; i++) rateLimit(`flood:${i}`, 100, 60_000);
  expect(
    "flooding distinct keys does NOT reset an existing limit",
    !rateLimit("victim", 1, 60_000).allowed,
  );
}

{
  __resetRateLimitForTests();
  const past = rateLimit("expiring", 1, 1); // 1ms window
  expect("first call in a tiny window is allowed", past.allowed);
  const later = Date.now() + 5;
  while (Date.now() < later) {
    /* spin briefly so the window elapses */
  }
  expect("the slot frees once the window elapses", rateLimit("expiring", 1, 1).allowed);
}

/* -------------------------------- clientIp ------------------------------- */

{
  const h = (init: Record<string, string>) => new Headers(init);
  expectEqual(
    "clientIp takes the first x-forwarded-for entry",
    clientIp(h({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" })),
    "203.0.113.5",
  );
  expectEqual(
    "clientIp falls back to x-real-ip",
    clientIp(h({ "x-real-ip": "198.51.100.7" })),
    "198.51.100.7",
  );
  expectEqual("clientIp degrades to a constant", clientIp(h({})), "unknown");
}

finish("pipeline");
