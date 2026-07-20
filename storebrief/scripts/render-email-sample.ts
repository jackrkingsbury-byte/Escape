import { writeFileSync } from "node:fs";
import { computeBrief } from "../lib/metrics";
import { renderBriefEmailHtml } from "../lib/email";
import type { Order } from "../lib/types";

// Writes a demo weekly-brief email to the given path (default: ./brief-email.html)
// so the template can be eyeballed in a browser or emailed to yourself.
const out = process.argv[2] ?? "brief-email.html";

const orders: Order[] = [
  { id: "1", createdAt: "2026-07-16T09:00:00Z", total: 900, lineItems: [{ title: "Blue Hoodie", quantity: 3, price: 300 }] },
  { id: "2", createdAt: "2026-07-14T10:00:00Z", total: 600, lineItems: [{ title: "Blue Hoodie", quantity: 2, price: 300 }] },
  { id: "3", createdAt: "2026-07-14T15:00:00Z", total: 500, lineItems: [{ title: "Sneakers", quantity: 1, price: 500 }] },
  { id: "4", createdAt: "2026-07-16T11:00:00Z", total: 200, lineItems: [{ title: "Cap", quantity: 2, price: 100 }] },
  { id: "p1", createdAt: "2026-07-04T09:00:00Z", total: 500, lineItems: [{ title: "Sneakers", quantity: 1, price: 500 }] },
  { id: "p2", createdAt: "2026-07-06T09:00:00Z", total: 600, lineItems: [{ title: "Beanie", quantity: 6, price: 100 }] },
];

const data = computeBrief(orders, {
  now: new Date("2026-07-17T12:00:00Z"),
  shopName: "Thabo's Streetwear (demo)",
  currency: "R",
});

writeFileSync(out, renderBriefEmailHtml(data));
console.log(`wrote ${out}`);
