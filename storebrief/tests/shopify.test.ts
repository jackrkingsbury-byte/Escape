import { computeBrief } from "../lib/metrics";
import { mapShopifyOrders, ordersSinceFilter, type ShopifyOrderNode } from "../lib/shopify";

let failures = 0;
function eq(name: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${pass ? "" : `  → got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
  if (!pass) failures++;
}

const bag = (amount: string) => ({ shopMoney: { amount } });

// Real payload shape from the Escape store (2026-07-20) — all four were
// Yoco test-mode orders, which is exactly what the adapter must drop.
const escapeStoreNodes: ShopifyOrderNode[] = [
  {
    id: "gid://shopify/Order/6655668551723",
    createdAt: "2026-07-02T20:35:50Z",
    test: true,
    cancelledAt: null,
    currentTotalPriceSet: bag("199.0"),
    lineItems: { nodes: [{ title: "The Reset", quantity: 1, discountedUnitPriceSet: bag("199.0") }] },
  },
  {
    id: "gid://shopify/Order/6655407259691",
    createdAt: "2026-07-02T18:07:31Z",
    test: true,
    cancelledAt: null,
    currentTotalPriceSet: bag("199.0"),
    lineItems: { nodes: [{ title: "The Reset", quantity: 1, discountedUnitPriceSet: bag("199.0") }] },
  },
];

eq("test orders are dropped", mapShopifyOrders(escapeStoreNodes), []);

const mixed: ShopifyOrderNode[] = [
  ...escapeStoreNodes,
  {
    id: "real-1",
    createdAt: "2026-07-15T10:00:00Z",
    test: false,
    cancelledAt: null,
    currentTotalPriceSet: bag("398.0"),
    lineItems: { nodes: [{ title: "The Reset", quantity: 2, discountedUnitPriceSet: bag("199.0") }] },
  },
  {
    id: "cancelled-1",
    createdAt: "2026-07-15T11:00:00Z",
    test: false,
    cancelledAt: "2026-07-15T12:00:00Z",
    currentTotalPriceSet: bag("299.0"),
    lineItems: { nodes: [{ title: "Reset + Lifetime Toolkit", quantity: 1, discountedUnitPriceSet: bag("299.0") }] },
  },
];

const mapped = mapShopifyOrders(mixed);
eq("only the real order survives", mapped.length, 1);
eq("money string parsed to number", mapped[0]?.total, 398);
eq("line item mapped", mapped[0]?.lineItems, [{ title: "The Reset", quantity: 2, price: 199 }]);

// Malformed money must not poison the metrics.
const malformed = mapShopifyOrders([
  {
    id: "bad-1",
    createdAt: "2026-07-15T10:00:00Z",
    currentTotalPriceSet: bag("not-a-number"),
    lineItems: { nodes: [{ title: "X", quantity: 1, discountedUnitPriceSet: null }] },
  },
]);
eq("malformed money becomes 0, not NaN", malformed[0]?.total, 0);
eq("null line-item money becomes 0", malformed[0]?.lineItems[0]?.price, 0);

// End-to-end: mapped orders flow into the engine.
const NOW = new Date("2026-07-17T12:00:00Z");
const brief = computeBrief(mapped, { now: NOW, shopName: "Escape", currency: "R" });
eq("engine consumes mapped orders", [brief.revenue, brief.orderCount], [398, 1]);
eq("top product from mapped data", brief.topProducts[0]?.title, "The Reset");

// Window filter covers current + baseline periods.
const filter = ordersSinceFilter(7, new Date("2026-07-20T00:00:00Z"));
eq("since-filter spans 14 days", filter, "created_at:>='2026-07-06T00:00:00.000Z'");

console.log(failures === 0 ? "\nSHOPIFY ADAPTER: ALL TESTS PASSED" : `\nSHOPIFY ADAPTER: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
