import { readFileSync } from "node:fs";
import { computeBrief } from "../lib/metrics";
import { findUnsupportedNumbers } from "../lib/writer";
import type { Order } from "../lib/types";

// Guardrail check for a hand- or AI-written brief: every number in the text
// must be derivable from the orders. Used by the weekly concierge run, where
// Claude writes the prose in-session instead of via the API.
// Usage: tsx scripts/check-brief-text.ts <orders.json> <brief.txt> [windowDays] [shopName] [currency]
const [, , ordersFile, textFile, windowArg, shopName = "Escape", currency = "R"] = process.argv;
if (!ordersFile || !textFile) {
  console.error("Usage: tsx scripts/check-brief-text.ts <orders.json> <brief.txt> [windowDays] [shopName] [currency]");
  process.exit(2);
}

const orders = (JSON.parse(readFileSync(ordersFile, "utf8")) as Array<Order & { test?: boolean }>)
  .filter((o) => !o.test);
const text = readFileSync(textFile, "utf8");
const data = computeBrief(orders, {
  windowDays: windowArg ? Number(windowArg) : 7,
  shopName,
  currency,
});

const unsupported = findUnsupportedNumbers(text, data);
if (unsupported.length > 0) {
  console.error(`GUARDRAIL FAIL — numbers not derivable from the data: ${unsupported.join(", ")}`);
  process.exit(1);
}
console.log("GUARDRAIL PASS — every number in the text is backed by the data.");
