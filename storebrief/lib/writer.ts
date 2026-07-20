import type { BriefData } from "./types";
import { renderBriefText } from "./render";

/**
 * AI brief writer with a hard numeric guardrail.
 *
 * Rule: Claude may only REPHRASE the computed numbers — it may not invent,
 * recompute, or round differently. We enforce this in code: every number in
 * the generated text must exist in a whitelist derived from BriefData.
 * If verification fails (or no API key is set), we fall back to the
 * deterministic template so the product always works and is never wrong.
 */

export interface WriteResult {
  text: string;
  source: "ai" | "template";
  guardrailFlags: string[];
}

/** Numbers that may appear in prose without being data ("top 3", "7 days"). */
const FREE_NUMBERS = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "10", "12", "24"]);

function addNumberVariants(set: Set<string>, n: number): void {
  if (!Number.isFinite(n)) return;
  const abs = Math.abs(n);
  const variants = new Set<string>();
  variants.add(String(abs));
  variants.add(abs.toFixed(0));
  variants.add(abs.toFixed(1));
  variants.add(abs.toFixed(2));
  variants.add(Math.round(abs).toString());
  for (const v of variants) {
    set.add(v.replace(/\.0+$/, ""));
    set.add(v);
  }
}

/** Build the set of every number Claude is allowed to mention. */
export function numberWhitelist(data: BriefData): Set<string> {
  const set = new Set<string>(FREE_NUMBERS);
  addNumberVariants(set, data.windowDays);
  addNumberVariants(set, data.revenue);
  addNumberVariants(set, data.previousRevenue);
  if (data.revenueChangePercent !== null) addNumberVariants(set, data.revenueChangePercent);
  addNumberVariants(set, data.orderCount);
  addNumberVariants(set, data.previousOrderCount);
  addNumberVariants(set, data.averageOrderValue);
  addNumberVariants(set, data.previousAverageOrderValue);
  if (data.aovChangePercent !== null) addNumberVariants(set, data.aovChangePercent);
  addNumberVariants(set, data.bestDayRevenue);
  for (const p of data.topProducts) {
    addNumberVariants(set, p.quantity);
    addNumberVariants(set, p.revenue);
  }
  for (const s of data.slumpingProducts) {
    addNumberVariants(set, s.quantity);
    addNumberVariants(set, s.revenue);
    addNumberVariants(set, s.previousRevenue);
    addNumberVariants(set, s.dropPercent);
  }
  for (const v of data.weeklyTrend) addNumberVariants(set, v);
  addNumberVariants(set, data.trendStreak.weeks);
  if (data.identifiedOrderCount !== null) addNumberVariants(set, data.identifiedOrderCount);
  if (data.returningOrderCount !== null) addNumberVariants(set, data.returningOrderCount);
  if (data.pastCustomerCount !== null) addNumberVariants(set, data.pastCustomerCount);
  if (data.revenueChangeDrivers) {
    addNumberVariants(set, data.revenueChangeDrivers.ordersEffect);
    addNumberVariants(set, data.revenueChangeDrivers.aovEffect);
    addNumberVariants(set, data.orderCount - data.previousOrderCount);
  }
  for (const r of data.stockRisks) {
    addNumberVariants(set, r.unitsLeft);
    addNumberVariants(set, r.daysLeft);
  }
  // Hour digits from the busiest-time label (e.g. "17:00–20:00" → 17, 00, 20).
  if (data.bestHours) {
    for (const m of data.bestHours.matchAll(/\d+/g)) {
      set.add(m[0]);
      set.add(String(Number(m[0])));
    }
  }
  // Period label day numbers (e.g. "10 – 17 Jul").
  for (const m of data.periodLabel.matchAll(/\d+/g)) set.add(m[0]);
  return set;
}

/** Extract every number mentioned in a piece of text, normalised. */
export function extractNumbers(text: string): string[] {
  const out: string[] = [];
  // Grab digit groups incl. thousands separators and decimals.
  for (const m of text.matchAll(/\d[\d\s,'’]*(?:\.\d+)?/g)) {
    const raw = m[0].replace(/[\s,'’]/g, "");
    out.push(raw.replace(/\.0+$/, ""));
  }
  return out;
}

/** Returns the numbers in `text` that are NOT justified by the data. */
export function findUnsupportedNumbers(text: string, data: BriefData): string[] {
  const whitelist = numberWhitelist(data);
  return extractNumbers(text).filter((n) => !whitelist.has(n));
}

const SYSTEM_PROMPT = `You are StoreBrief, writing a short, friendly weekly sales brief for a small Shopify merchant.
Rules:
- Use ONLY the numbers given in the DATA JSON. Never invent, estimate, recompute, or re-round any number.
- Keep the same facts as the reference text; you may improve tone, order, and wording.
- Plain English, warm, concise (under 160 words). A few fitting emoji are welcome.
- End with the single suggested action for the week.
- Output plain text only.`;

export async function writeBrief(data: BriefData): Promise<WriteResult> {
  const template = renderBriefText(data);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { text: template, source: "template", guardrailFlags: ["no_api_key"] };
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `DATA:\n${JSON.stringify(data, null, 2)}\n\nREFERENCE TEXT:\n${template}`,
        },
      ],
    });
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? b.text : ""))
      .join("")
      .trim();

    const unsupported = findUnsupportedNumbers(text, data);
    if (!text || unsupported.length > 0) {
      return {
        text: template,
        source: "template",
        guardrailFlags: unsupported.length
          ? [`unsupported_numbers:${unsupported.join("|")}`]
          : ["empty_ai_text"],
      };
    }
    return { text, source: "ai", guardrailFlags: [] };
  } catch (err) {
    return {
      text: template,
      source: "template",
      guardrailFlags: [`ai_error:${err instanceof Error ? err.message : "unknown"}`],
    };
  }
}
