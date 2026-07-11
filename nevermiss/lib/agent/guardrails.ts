import type { AgentResult } from "./types";

/**
 * Deterministic safety layer that runs AFTER the AI and BEFORE anything is
 * sent. The system prompt asks for safe behaviour; this code ENFORCES it.
 * Any tripped rule forces needs_human = true, so in auto mode the reply is
 * downgraded to a draft for the owner instead of being sent.
 *
 * Rules:
 *  1. price_not_in_pricebook — the reply quotes a Rand amount that doesn't
 *     fall inside any price range the owner configured.
 *  2. price_without_pricebook — the reply quotes money but the owner has no
 *     price list at all.
 *  3. firm_price_risk — the reply mentions exactly one amount with no range
 *     wording ("R2,500" alone reads like a firm quote).
 *  4. ambiguous_job_priced — the customer's message matches 2+ different
 *     price-book items (e.g. "drain" hits both "Blocked drain" and "Drain
 *     pipe replacement") yet the reply already quotes money instead of
 *     asking which job it is.
 *  5. forbidden_promise — guarantees/warranties/refunds the AI must never make.
 *  6. payment_request — the AI must never ask for money or bank details.
 *  7. empty_reply — a non-spam turn produced no reply text.
 */

export interface GuardrailInput {
  priceRanges: unknown;
  customerMessage: string;
}

export interface GuardrailReport {
  flags: string[];
  result: AgentResult;
}

const FORBIDDEN_PROMISES =
  /\b(guaranteed?|warranty|refund|money.?back|free of charge|no charge|100% (?:safe|sure|certain))\b/i;

const PAYMENT_REQUESTS =
  /\b(pay(?:ment)? (?:now|upfront|first)|deposit of|bank details|account number|banking details|send (?:the )?money|card (?:number|details)|\beft\b)\b/i;

const RANGE_WORDING = /(?:–|—|\bto\b|\bbetween\b|\bfrom\b|\bup to\b|-\s?R)/i;

/** Pull every R-prefixed amount out of a piece of text. */
export function extractRandAmounts(text: string): number[] {
  const out: number[] = [];
  const re = /R\s?(\d[\d\s,.']*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = Number(m[1].replace(/[\s,.']/g, ""));
    if (Number.isFinite(n) && n >= 50) out.push(n); // ignore tiny non-price artifacts
  }
  return out;
}

interface ParsedItem {
  item: string;
  min: number;
  max: number;
  tokens: string[];
}

const GENERIC_TOKENS = new Set([
  "replacement", "replace", "repair", "install", "installation", "service",
  "callout", "call", "job", "fix", "unit", "standard", "small", "large",
]);

/** Parse the owner's price book into numeric ranges + match tokens. */
export function parsePriceBook(priceRanges: unknown): ParsedItem[] {
  if (!Array.isArray(priceRanges)) return [];
  const items: ParsedItem[] = [];
  for (const raw of priceRanges) {
    if (!raw || typeof raw !== "object") continue;
    const item = String((raw as { item?: unknown }).item ?? "").trim();
    const range = String((raw as { range?: unknown }).range ?? "");
    if (!item) continue;
    const nums = extractRandAmounts(range.startsWith("R") ? range : `R${range.replace(/R/gi, " R")}`);
    // Fall back: grab bare numbers if the owner didn't prefix with R.
    const bare = nums.length
      ? nums
      : (range.match(/\d[\d\s,.']*/g) ?? [])
          .map((s) => Number(s.replace(/[\s,.']/g, "")))
          .filter((n) => Number.isFinite(n) && n >= 50);
    const min = bare.length ? Math.min(...bare) : NaN;
    const max = bare.length ? Math.max(...bare) : NaN;
    const tokens = item
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3 && !GENERIC_TOKENS.has(t));
    items.push({ item, min, max, tokens });
  }
  return items;
}

/** Is this amount inside any configured range (with 10% tolerance)? */
function amountSupported(amount: number, book: ParsedItem[]): boolean {
  return book.some(
    (p) =>
      Number.isFinite(p.min) &&
      Number.isFinite(p.max) &&
      amount >= p.min * 0.9 &&
      amount <= p.max * 1.1,
  );
}

/**
 * True ambiguity: a single word in the customer's message maps to two or
 * more different price-book items (e.g. "drain" hits both "Blocked drain"
 * and "Drain pipe replacement"). Different words matching different items
 * ("geyser" + "burst") is NOT ambiguous — the customer just described one job.
 */
function hasAmbiguousToken(message: string, book: ParsedItem[]): boolean {
  const msg = message.toLowerCase();
  const tokenHits = new Map<string, number>();
  for (const p of book) {
    for (const t of new Set(p.tokens)) {
      if (msg.includes(t)) tokenHits.set(t, (tokenHits.get(t) ?? 0) + 1);
    }
  }
  for (const count of tokenHits.values()) {
    if (count >= 2) return true;
  }
  return false;
}

export function applyGuardrails(result: AgentResult, input: GuardrailInput): GuardrailReport {
  const flags: string[] = [];
  const reply = result.reply_text ?? "";
  const book = parsePriceBook(input.priceRanges);
  const amounts = extractRandAmounts(reply);

  if (!reply.trim() && result.intent !== "spam") flags.push("empty_reply");

  if (amounts.length > 0) {
    if (book.length === 0) {
      flags.push("price_without_pricebook");
    } else {
      const unsupported = amounts.filter((a) => !amountSupported(a, book));
      if (unsupported.length > 0) flags.push("price_not_in_pricebook");
    }

    if (amounts.length === 1 && !RANGE_WORDING.test(reply)) {
      flags.push("firm_price_risk");
    }

    if (hasAmbiguousToken(input.customerMessage, book)) {
      // One customer word fits multiple jobs, yet we're already quoting.
      flags.push("ambiguous_job_priced");
    }
  }

  if (FORBIDDEN_PROMISES.test(reply)) flags.push("forbidden_promise");
  if (PAYMENT_REQUESTS.test(reply)) flags.push("payment_request");

  if (flags.length === 0) return { flags, result };

  return {
    flags,
    result: {
      ...result,
      needs_human: true,
      confidence: "low",
      internal_note: [result.internal_note, `guardrails: ${flags.join(", ")}`]
        .filter(Boolean)
        .join(" | "),
    },
  };
}
