import { computeBrief } from "../lib/metrics";
import {
  fetchAllOrders,
  mapShopifyOrders,
  ordersSinceFilter,
  type OrdersPage,
  type ShopifyOrderNode,
} from "../lib/shopify";

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
eq("missing customer maps to null id", mapped[0]?.customerId, null);

const withCustomer = mapShopifyOrders([
  { ...mixed[2]!, customer: { id: "gid://shopify/Customer/42" } },
]);
eq("customer id mapped through", withCustomer[0]?.customerId, "gid://shopify/Customer/42");

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

// Window filter defaults to 4 windows for the momentum trend.
const filter = ordersSinceFilter(7, new Date("2026-07-20T00:00:00Z"));
eq("since-filter spans 28 days by default", filter, "created_at:>='2026-06-22T00:00:00.000Z'");
eq(
  "since-filter honours explicit window count",
  ordersSinceFilter(7, new Date("2026-07-20T00:00:00Z"), 2),
  "created_at:>='2026-07-06T00:00:00.000Z'",
);

// Pagination drains every page and stops at the last one.
const pages: OrdersPage[] = [
  { nodes: [mixed[2]!], pageInfo: { hasNextPage: true, endCursor: "c1" } },
  { nodes: [mixed[3]!], pageInfo: { hasNextPage: false, endCursor: null } },
];
const seenCursors: Array<string | null | undefined> = [];
const all = await fetchAllOrders(async ({ after }) => {
  seenCursors.push(after);
  return pages[seenCursors.length - 1]!;
});
eq("pagination collects all pages", all.length, 2);
eq("pagination passes cursors", seenCursors, [null, "c1"]);

console.log(failures === 0 ? "\nSHOPIFY ADAPTER: ALL TESTS PASSED" : `\nSHOPIFY ADAPTER: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
