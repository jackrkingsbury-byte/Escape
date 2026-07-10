import type { Anthropic } from "@anthropic-ai/sdk";
import type { BusinessProfile, ConversationTurn } from "./types";

/**
 * System prompt: NeverMiss acts as the business's front desk on WhatsApp.
 * Goal — answer fast, qualify, give a price RANGE, and book the job.
 */
export function buildSystemPrompt(p: BusinessProfile): string {
  const hours = safeJson(p.hours);
  const faq = safeJson(p.faq);
  const prices = safeJson(p.priceRanges);
  return `You are the front desk for "${p.name}", a ${p.vertical ?? "service"} business in ${p.city ?? "South Africa"}.
You reply to customer WhatsApp messages in the owner's voice: ${p.tone ?? "warm, professional, concise"}.
Write like a real South African business texting a customer — short, friendly, human. No corporate tone. Rands (R) for money.

WHAT YOU KNOW
- Working hours: ${hours}
- Service area: ${p.serviceArea ?? "local area"}
- FAQ: ${faq}
- Price ranges (give a RANGE from here — never a single hard price): ${prices}

EVERY MESSAGE, DO THIS
1. Acknowledge instantly and warmly.
2. Ask ONLY the 2-3 questions needed to qualify: what's the job, where are they, how urgent, rough timing.
3. If you can, give a realistic PRICE RANGE from the list and say a firm quote is confirmed on site.
4. Push to book: offer a time / ask for their address.

RULES
- Keep replies to WhatsApp length (1-4 short sentences). Use at most one emoji.
- NEVER invent a firm price. Always a range, "confirmed on site".
- AMBIGUOUS JOBS: if the request could match MORE THAN ONE price item (e.g.
  "drain problem" could be an unblock OR a full pipe replacement), do NOT pick
  one. Ask ONE short question to find out which it is — or give the honest
  span across both items ("from R1,000 for an unblock up to R3,000+ if it
  needs replacing") and say the price depends on what we find on site.
- If the job isn't in the price list at all, give NO number: say we'll confirm
  with a quick look, capture the lead, and set needs_human = true.
- NEVER take payment or promise anything you can't (exact times, guarantees).
- Set needs_human = true if: the job is high-value/complex/unusual, it's a complaint, it's out of scope/area, or you're unsure. Then reassure the customer a team member will confirm shortly.
- If the message is spam or not a real enquiry, set intent = "spam", needs_human = false, and keep reply_text empty.
- estimated_value: your best guess of the job's Rand value (0 if unknown).

You MUST answer by calling the draft_reply tool with structured fields. Do not write anything outside the tool call.`;
}

/** The Anthropic tool that forces structured output. */
export const DRAFT_REPLY_TOOL: Anthropic.Tool = {
  name: "draft_reply",
  description:
    "Return the reply to send to the customer plus structured metadata about the lead.",
  input_schema: {
    type: "object",
    properties: {
      reply_text: {
        type: "string",
        description: "The message to send to the customer (empty string if spam).",
      },
      intent: {
        type: "string",
        enum: ["quote_request", "booking", "question", "complaint", "spam", "other"],
      },
      qualification: {
        type: "object",
        properties: {
          job_type: { type: "string" },
          location: { type: "string" },
          urgency: { type: "string" },
          timing: { type: "string" },
          budget_signal: { type: "string" },
        },
      },
      suggested_slots: {
        type: "array",
        items: { type: "string" },
        description: "Human-readable time slots offered, e.g. 'Tomorrow 8am'.",
      },
      estimated_value: {
        type: "number",
        description: "Best estimate of the job value in Rand, 0 if unknown.",
      },
      confidence: { type: "string", enum: ["high", "low"] },
      needs_human: { type: "boolean" },
      internal_note: {
        type: "string",
        description: "One short line for the business owner about this lead.",
      },
    },
    required: [
      "reply_text",
      "intent",
      "qualification",
      "suggested_slots",
      "estimated_value",
      "confidence",
      "needs_human",
      "internal_note",
    ],
  },
};

/** Build the message list: prior turns + the new inbound customer message. */
export function buildMessages(
  history: ConversationTurn[],
  incoming: string,
): Anthropic.MessageParam[] {
  const msgs: Anthropic.MessageParam[] = [];
  for (const turn of history) {
    msgs.push({
      role: turn.role === "customer" ? "user" : "assistant",
      content: turn.text,
    });
  }
  msgs.push({ role: "user", content: incoming });
  return msgs;
}

function safeJson(v: unknown): string {
  try {
    if (v == null) return "none";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return s.length ? s : "none";
  } catch {
    return "none";
  }
}
