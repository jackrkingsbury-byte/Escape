import { computeBrief } from "../lib/metrics";
import { renderBriefText } from "../lib/render";
import { findUnsupportedNumbers, writeBrief } from "../lib/writer";
import type { Order } from "../lib/types";

let failures = 0;
function ok(name: string, pass: boolean, extra = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${pass ? "" : `  ${extra}`}`);
  if (!pass) failures++;
}

const NOW = new Date("2026-07-17T12:00:00Z");
const orders: Order[] = [
  { id: "1", createdAt: "2026-07-12T09:00:00Z", total: 4500, lineItems: [{ title: "Geyser", quantity: 1, price: 4500 }] },
  { id: "2", createdAt: "2026-07-05T09:00:00Z", total: 1000, lineItems: [{ title: "Geyser", quantity: 1, price: 1000 }] },
];
const data = computeBrief(orders, { now: NOW, shopName: "Test", currency: "R" });

// 1. The deterministic template must always pass its own guardrail.
const template = renderBriefText(data);
const templateUnsupported = findUnsupportedNumbers(template, data);
ok("template text has zero unsupported numbers", templateUnsupported.length === 0,
  `→ ${JSON.stringify(templateUnsupported)}`);

// 2. Faithful AI-style rewrite passes.
const faithful = `Sales hit R4,500 from 1 order — up 350% on last period. Average order R4,500.`;
ok("faithful rewrite passes", findUnsupportedNumbers(faithful, data).length === 0);

// 3. Invented number gets caught.
const invented = `Sales hit R9,999 this week — amazing!`;
const caught = findUnsupportedNumbers(invented, data);
ok("invented R9,999 caught", caught.includes("9999"), `→ ${JSON.stringify(caught)}`);

// 4. Re-rounded/altered percentage gets caught.
const rerounded = `Revenue grew about 347% this period.`;
ok("re-rounded 347% caught", findUnsupportedNumbers(rerounded, data).length > 0);

// 5. Thousands separators normalise ("4 500" == 4500).
const spaced = `You made R4 500 in sales.`;
ok("spaced thousands accepted", findUnsupportedNumbers(spaced, data).length === 0);

// 5b. Busiest-hours digits are whitelisted; other times are not.
const hourly = computeBrief(
  [
    { id: "h1", createdAt: "2026-07-14T16:10:00Z", total: 300, lineItems: [{ title: "Mug", quantity: 3, price: 100 }] },
    { id: "h2", createdAt: "2026-07-16T16:40:00Z", total: 300, lineItems: [{ title: "Mug", quantity: 3, price: 100 }] },
  ],
  { now: NOW, shopName: "Test", currency: "R" },
);
ok("busiest-time mention passes", findUnsupportedNumbers("Most sales land between 15:00 and 18:00.", hourly).length === 0);
ok("wrong time is caught", findUnsupportedNumbers("Most sales land around 21:00.", hourly).length > 0);

// 6. Without an API key, writeBrief falls back to the template, flagged.
delete process.env.ANTHROPIC_API_KEY;
const result = await writeBrief(data);
ok("no key → template fallback", result.source === "template");
ok("no key → flagged", result.guardrailFlags.includes("no_api_key"));
ok("fallback text is the reference template", result.text === template);

console.log(failures === 0 ? "\nWRITER: ALL TESTS PASSED" : `\nWRITER: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
