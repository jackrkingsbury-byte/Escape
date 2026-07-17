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

console.log(failures === 0 ? "\nMETRICS: ALL TESTS PASSED" : `\nMETRICS: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
