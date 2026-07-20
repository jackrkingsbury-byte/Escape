import { computeBrief } from "../lib/metrics";
import { renderBriefEmailHtml, escapeHtml } from "../lib/email";
import type { Order } from "../lib/types";

let failures = 0;
function ok(name: string, pass: boolean, extra = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${pass ? "" : `  ${extra}`}`);
  if (!pass) failures++;
}

const NOW = new Date("2026-07-17T12:00:00Z");
const orders: Order[] = [
  { id: "1", createdAt: "2026-07-12T09:00:00Z", total: 4500, customerId: "c1", lineItems: [{ title: "Geyser <install>", quantity: 1, price: 4500 }] },
  { id: "2", createdAt: "2026-07-05T09:00:00Z", total: 1000, customerId: "c1", lineItems: [{ title: "Geyser <install>", quantity: 1, price: 1000 }] },
];

const data = computeBrief(orders, { now: NOW, shopName: "Thabo's <Store>", currency: "R" });
const html = renderBriefEmailHtml(data);

ok("escapes shop name", html.includes("Thabo&#39;s &lt;Store&gt;"));
ok("no raw merchant markup leaks through", !html.includes("<Store>") && !html.includes("Geyser <install>"));
ok("shows revenue", html.includes("R4"));
ok("shows suggestion block", html.includes("THIS WEEK"));
ok("no undefined/NaN in output", !html.includes("undefined") && !html.includes("NaN"));
ok("escapeHtml handles quotes", escapeHtml(`a"b'c`) === "a&quot;b&#39;c");
ok("shows 4-week trend", html.includes("4-WEEK TREND"));
ok("shows repeat customers row", html.includes("Repeat customers") && html.includes("1 of 1 orders"));

// Empty store still renders a valid email.
const empty = renderBriefEmailHtml(computeBrief([], { now: NOW }));
ok("empty store email renders", empty.includes("StoreBrief") && !empty.includes("NaN"));

console.log(failures === 0 ? "\nEMAIL: ALL TESTS PASSED" : `\nEMAIL: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
