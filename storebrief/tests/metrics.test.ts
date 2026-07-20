import { computeBrief } from "../lib/metrics";
import type { Order } from "../lib/types";

let failures = 0;
function eq(name: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${pass ? "" : `  → got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
  if (!pass) failures++;
}

// Fixed "now": Friday 2026-07-17T12:00Z. Current window: Jul 10–17. Previous: Jul 3–10.
const NOW = new Date("2026-07-17T12:00:00Z");
const o = (id: string, iso: string, total: number, items: Array<[string, number, number]>): Order => ({
  id,
  createdAt: iso,
  total,
  lineItems: items.map(([title, quantity, price]) => ({ title, quantity, price })),
});

const orders: Order[] = [
  // --- current window (Jul 10–17) ---
  o("c1", "2026-07-11T09:00:00Z", 900, [["Blue Hoodie", 3, 300]]), // Saturday
  o("c2", "2026-07-14T10:00:00Z", 600, [["Blue Hoodie", 2, 300]]), // Tuesday
  o("c3", "2026-07-14T15:00:00Z", 500, [["Sneakers", 1, 500]]),   // Tuesday
  o("c4", "2026-07-16T11:00:00Z", 200, [["Cap", 2, 100]]),        // Thursday
  // --- previous window (Jul 3–10) ---
  o("p1", "2026-07-04T09:00:00Z", 500, [["Sneakers", 1, 500]]),
  o("p2", "2026-07-06T09:00:00Z", 600, [["Beanie", 6, 100]]),     // Beanie slumps to 0
  o("p3", "2026-07-08T09:00:00Z", 300, [["Blue Hoodie", 1, 300]]),
  // --- outside both windows (ignored) ---
  o("x1", "2026-06-20T09:00:00Z", 9999, [["Old Thing", 1, 9999]]),
];

const b = computeBrief(orders, { now: NOW, shopName: "Test Shop", currency: "R" });

eq("revenue current", b.revenue, 2200);
eq("revenue previous", b.previousRevenue, 1400);
eq("revenue change %", b.revenueChangePercent, 57.1);
eq("order counts", [b.orderCount, b.previousOrderCount], [4, 3]);
eq("AOV current", b.averageOrderValue, 550);
eq("AOV previous", b.previousAverageOrderValue, 466.67);
eq("top product is Blue Hoodie", b.topProducts[0]?.title, "Blue Hoodie");
eq("top product revenue", b.topProducts[0]?.revenue, 1500);
eq("top products length", b.topProducts.length, 3);
eq("slump detected: Beanie", b.slumpingProducts[0]?.title, "Beanie");
eq("slump drop %", b.slumpingProducts[0]?.dropPercent, 100);
eq("best day is Tuesday", b.bestDay, "Tuesday");
eq("best day revenue", b.bestDayRevenue, 1100);
eq("suggestion prioritises slump", b.suggestion.code, "investigate_slump");
eq("ignores orders outside windows", b.revenue + b.previousRevenue < 9999, true);

// --- empty store ---
const empty = computeBrief([], { now: NOW });
eq("empty: revenue 0", empty.revenue, 0);
eq("empty: change % is 0 (no baseline, no sales)", empty.revenueChangePercent, 0);
eq("empty: AOV 0 (no div-by-zero)", empty.averageOrderValue, 0);
eq("empty: bestDay null", empty.bestDay, null);
eq("empty: suggestion", empty.suggestion.code, "no_sales_share_store");

// --- new store with sales but no previous baseline ---
const fresh = computeBrief(
  [o("f1", "2026-07-15T09:00:00Z", 400, [["Mug", 4, 100]])],
  { now: NOW },
);
eq("fresh: change % null (no baseline)", fresh.revenueChangePercent, null);
eq("fresh: suggestion pushes top product", fresh.suggestion.code, "push_top_product_on_best_day");

// --- momentum trend (4 windows back from 17 Jul: 19–26 Jun, 26 Jun–3 Jul, 3–10, 10–17) ---
// x1 (20 Jun, 9999) lands in the oldest trend bucket.
eq("trend: 4 buckets oldest→newest", b.weeklyTrend, [9999, 0, 1400, 2200]);
eq("trend: streak counts rises ending at current window", b.trendStreak, { direction: "up", weeks: 2 });
const rising = computeBrief(
  [
    o("w4", "2026-06-21T09:00:00Z", 100, [["Mug", 1, 100]]),
    o("w3", "2026-06-28T09:00:00Z", 200, [["Mug", 2, 100]]),
    o("w2", "2026-07-05T09:00:00Z", 300, [["Mug", 3, 100]]),
    o("w1", "2026-07-12T09:00:00Z", 400, [["Mug", 4, 100]]),
  ],
  { now: NOW },
);
eq("trend: full rising streak", rising.trendStreak, { direction: "up", weeks: 3 });
const falling = computeBrief(
  [
    o("w4", "2026-06-21T09:00:00Z", 400, [["Mug", 4, 100]]),
    o("w3", "2026-06-28T09:00:00Z", 300, [["Mug", 3, 100]]),
    o("w2", "2026-07-05T09:00:00Z", 200, [["Mug", 2, 100]]),
    o("w1", "2026-07-12T09:00:00Z", 100, [["Mug", 1, 100]]),
  ],
  { now: NOW },
);
eq("trend: falling streak", falling.trendStreak, { direction: "down", weeks: 3 });
eq("trend: empty store is flat", empty.trendStreak, { direction: "flat", weeks: 0 });

// --- returning customers ---
const wc = (id: string, iso: string, total: number, customerId: string | null): Order => ({
  ...o(id, iso, total, [["Mug", 1, total]]),
  customerId,
});
const repeat = computeBrief(
  [
    wc("r1", "2026-07-15T09:00:00Z", 100, "cust-A"), // returning: bought 1 Jul
    wc("r2", "2026-07-16T09:00:00Z", 100, "cust-B"), // new
    wc("r3", "2026-07-16T12:00:00Z", 100, null),     // unidentified
    wc("r0", "2026-07-01T09:00:00Z", 100, "cust-A"), // history
  ],
  { now: NOW },
);
eq("returning: identified count", repeat.identifiedOrderCount, 2);
eq("returning: repeat count", repeat.returningOrderCount, 1);
const anonymous = computeBrief(
  [o("a1", "2026-07-15T09:00:00Z", 100, [["Mug", 1, 100]])],
  { now: NOW },
);
eq("returning: null when no customer ids", [anonymous.identifiedOrderCount, anonymous.returningOrderCount], [null, null]);
// Same customer twice inside one window: second order counts as returning.
const sameWindow = computeBrief(
  [
    wc("s1", "2026-07-14T09:00:00Z", 100, "cust-C"),
    wc("s2", "2026-07-16T09:00:00Z", 100, "cust-C"),
  ],
  { now: NOW },
);
eq("returning: repeat within the window counts", sameWindow.returningOrderCount, 1);

// --- busiest hours (timezone-aware) ---
// Two orders at 16:xx UTC: block 15:00–18:00 in UTC, but 18:xx SAST → 18:00–21:00 local.
const hoursOrders: Order[] = [
  o("h1", "2026-07-14T16:10:00Z", 300, [["Mug", 3, 100]]),
  o("h2", "2026-07-16T16:40:00Z", 300, [["Mug", 3, 100]]),
  o("h3", "2026-07-16T08:00:00Z", 900, [["Mug", 9, 100]]), // big but single order in its block
];
const utcHours = computeBrief(hoursOrders, { now: NOW });
eq("busiest hours: needs ≥2 orders, so 16:xx UTC block wins", utcHours.bestHours, "15:00–18:00");
const sastHours = computeBrief(hoursOrders, { now: NOW, timezone: "Africa/Johannesburg" });
eq("busiest hours: SAST shifts 16:xx UTC into the evening block", sastHours.bestHours, "18:00–21:00");
eq("busiest hours: null when no block has 2 orders", fresh.bestHours, null);
const badTz = computeBrief(hoursOrders, { now: NOW, timezone: "Not/AZone" });
eq("busiest hours: invalid timezone falls back to UTC", badTz.bestHours, "15:00–18:00");

// --- best week + celebrate suggestion ---
eq("best week: rising store flags it", rising.isBestWeek, true);
eq("best week: celebration suggestion fires", rising.suggestion.code, "celebrate_best_week");
eq("best week: falling store does not", falling.isBestWeek, false);
eq("best week: fresh store (no prior weeks) does not", fresh.isBestWeek, false);

// --- win-back suggestion: 3+ past customers, none returned this week ---
const winBack = computeBrief(
  [
    wc("n1", "2026-07-15T09:00:00Z", 100, "cust-new"),
    wc("h1", "2026-06-25T09:00:00Z", 100, "cust-1"),
    wc("h2", "2026-06-26T09:00:00Z", 100, "cust-2"),
    wc("h3", "2026-07-05T09:00:00Z", 100, "cust-3"),
  ],
  { now: NOW },
);
eq("win-back: past customer count", winBack.pastCustomerCount, 3);
eq("win-back: suggestion fires with count", winBack.suggestion, {
  code: "win_back_customers",
  count: 3,
});

console.log(failures === 0 ? "\nMETRICS: ALL TESTS PASSED" : `\nMETRICS: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
