import { readFileSync } from "node:fs";
import { computeBrief } from "../lib/metrics";
import { renderBriefText } from "../lib/render";
import type { Order } from "../lib/types";

// Renders a brief from a JSON file of orders in the engine's Order[] shape.
// Lets us run the real product against exported store data before the
// Shopify OAuth shell exists.
const [, , file, windowArg, shopName = "Your Store", currency = "R"] = process.argv;
if (!file) {
  console.error(
    "Usage: tsx scripts/brief-from-json.ts <orders.json> [windowDays] [shopName] [currency]",
  );
  process.exit(1);
}

// Shopify marks test-gateway checkouts with test: true and excludes them from
// its own analytics — a brief that counted them would report money that never
// existed, so they are dropped here too.
const orders = (JSON.parse(readFileSync(file, "utf8")) as Array<Order & { test?: boolean }>)
  .filter((o) => !o.test);
const windowDays = windowArg ? Number(windowArg) : 7;
const data = computeBrief(orders, { windowDays, shopName, currency });
console.log(renderBriefText(data));
