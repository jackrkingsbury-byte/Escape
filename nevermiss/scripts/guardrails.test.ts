/**
 * Deterministic tests for the guardrails safety layer.
 * Run: npx tsx scripts/guardrails.test.ts
 */
import { applyGuardrails, extractRandAmounts, parsePriceBook } from "../lib/agent/guardrails";
import type { AgentResult } from "../lib/agent/types";

const PRICE_BOOK = [
  { item: "Geyser replacement (150L)", range: "R4,500 - R7,000" },
  { item: "Blocked drain", range: "R650 - R1,800" },
  { item: "Drain pipe replacement", range: "R2,500 - R4,000" },
  { item: "Burst pipe repair", range: "R850 - R2,500" },
];

function agentReply(partial: Partial<AgentResult>): AgentResult {
  return {
    reply_text: "",
    intent: "quote_request",
    qualification: {},
    suggested_slots: [],
    estimated_value: 0,
    confidence: "high",
    needs_human: false,
    internal_note: "",
    ...partial,
  };
}

let failures = 0;
function check(name: string, actual: string[], expectedToInclude: string[], expectEmpty = false) {
  const pass = expectEmpty
    ? actual.length === 0
    : expectedToInclude.every((f) => actual.includes(f));
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  → flags: [${actual.join(", ")}]`);
  if (!pass) failures++;
}

// --- unit: extraction & parsing ---
{
  const nums = extractRandAmounts("Usually R4,500 – R7 000, confirmed on site at 08:00, 24/7.");
  console.log(
    (nums.length === 2 && nums[0] === 4500 && nums[1] === 7000 ? "PASS" : "FAIL") +
      `  extractRandAmounts ignores times/ratios → ${JSON.stringify(nums)}`,
  );
  if (!(nums.length === 2 && nums[0] === 4500 && nums[1] === 7000)) failures++;

  const book = parsePriceBook(PRICE_BOOK);
  const geyser = book[0];
  const ok = geyser.min === 4500 && geyser.max === 7000 && geyser.tokens.includes("geyser");
  console.log((ok ? "PASS" : "FAIL") + `  parsePriceBook → min ${geyser.min}, max ${geyser.max}`);
  if (!ok) failures++;
}

// --- 1. good reply: in-book range, unambiguous job → no flags ---
check(
  "in-range geyser quote passes clean",
  applyGuardrails(
    agentReply({ reply_text: "A geyser replacement is usually R4,500 – R7,000, confirmed on site. Where are you?" }),
    { priceRanges: PRICE_BOOK, customerMessage: "my geyser burst" },
  ).flags,
  [],
  true,
);

// --- 2. invented price → price_not_in_pricebook ---
check(
  "invented R12,000 gets caught",
  applyGuardrails(
    agentReply({ reply_text: "That will be R12,000 – R15,000 depending on the unit." }),
    { priceRanges: PRICE_BOOK, customerMessage: "my geyser burst" },
  ).flags,
  ["price_not_in_pricebook"],
);

// --- 3. THE DRAIN TRAP: ambiguous job already priced → ambiguous_job_priced ---
check(
  "ambiguous 'drain' + a price gets caught",
  applyGuardrails(
    agentReply({ reply_text: "A drain job is usually R650 – R1,800, confirmed on site." }),
    { priceRanges: PRICE_BOOK, customerMessage: "hi how much for my drain, it's giving problems" },
  ).flags,
  ["ambiguous_job_priced"],
);

// --- 3b. ambiguous 'drain' but AI asks first (no price) → clean ---
check(
  "ambiguous 'drain' with a clarifying question passes",
  applyGuardrails(
    agentReply({
      reply_text: "We can help! Is the drain blocked, or does the pipe need replacing? Big price difference.",
      intent: "question",
    }),
    { priceRanges: PRICE_BOOK, customerMessage: "hi how much for my drain, it's giving problems" },
  ).flags,
  [],
  true,
);

// --- 4. single number, no range wording → firm_price_risk ---
check(
  "lone firm-sounding price gets caught",
  applyGuardrails(
    agentReply({ reply_text: "A blocked drain costs R1,000." }),
    { priceRanges: PRICE_BOOK, customerMessage: "blocked drain help" },
  ).flags,
  ["firm_price_risk"],
);

// --- 5. money quoted with empty price book → price_without_pricebook ---
check(
  "price with no price book gets caught",
  applyGuardrails(
    agentReply({ reply_text: "That's about R2,000 – R3,000." }),
    { priceRanges: [], customerMessage: "how much to paint a wall" },
  ).flags,
  ["price_without_pricebook"],
);

// --- 6. forbidden promise ---
check(
  "guarantee gets caught",
  applyGuardrails(
    agentReply({ reply_text: "It's guaranteed to be fixed the same day!" }),
    { priceRanges: PRICE_BOOK, customerMessage: "can you fix my pipe" },
  ).flags,
  ["forbidden_promise"],
);

// --- 7. payment request ---
check(
  "asking for banking details gets caught",
  applyGuardrails(
    agentReply({ reply_text: "Please send the deposit of R500 to our account number 12345." }),
    { priceRanges: PRICE_BOOK, customerMessage: "ok book me" },
  ).flags,
  ["payment_request"],
);

// --- 8. empty reply on a real enquiry ---
check(
  "empty non-spam reply gets caught",
  applyGuardrails(agentReply({ reply_text: "", intent: "question" }), {
    priceRanges: PRICE_BOOK,
    customerMessage: "hello?",
  }).flags,
  ["empty_reply"],
);

// --- 9. flags force needs_human + note ---
{
  const r = applyGuardrails(
    agentReply({ reply_text: "That will be R12,000.", internal_note: "big job" }),
    { priceRanges: PRICE_BOOK, customerMessage: "geyser quote please" },
  );
  const ok = r.result.needs_human === true && r.result.internal_note.includes("guardrails:");
  console.log((ok ? "PASS" : "FAIL") + `  tripped guardrails force needs_human + note → "${r.result.internal_note}"`);
  if (!ok) failures++;
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
