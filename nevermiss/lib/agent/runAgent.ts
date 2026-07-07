import { getAnthropic, anthropicModel } from "@/lib/anthropic";
import { buildSystemPrompt, buildMessages, DRAFT_REPLY_TOOL } from "./prompt";
import type { AgentOutcome, AgentResult, BusinessProfile, ConversationTurn } from "./types";

/**
 * Run the reply agent for one inbound customer message.
 * Uses Anthropic tool-use to guarantee structured output.
 * Never throws — returns { ok: false, error } on any failure so callers stay robust.
 */
export async function runAgent(
  profile: BusinessProfile,
  history: ConversationTurn[],
  incoming: string,
): Promise<AgentOutcome> {
  const client = getAnthropic();
  if (!client) {
    return { ok: false, error: "AI is not configured yet (missing ANTHROPIC_API_KEY)." };
  }
  if (!incoming?.trim()) {
    return { ok: false, error: "Empty message." };
  }

  try {
    const response = await client.messages.create({
      model: anthropicModel(),
      max_tokens: 700,
      system: buildSystemPrompt(profile),
      tools: [DRAFT_REPLY_TOOL],
      tool_choice: { type: "tool", name: DRAFT_REPLY_TOOL.name },
      messages: buildMessages(history, incoming),
    });

    const toolUse = response.content.find(
      (block): block is Extract<typeof block, { type: "tool_use" }> =>
        block.type === "tool_use" && block.name === DRAFT_REPLY_TOOL.name,
    );

    if (!toolUse) {
      return { ok: false, error: "Agent did not return a structured reply." };
    }

    return { ok: true, result: normalize(toolUse.input as Partial<AgentResult>) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    console.error("[runAgent] error:", message);
    return { ok: false, error: message };
  }
}

/** Defensive normalisation so downstream code always gets a complete result. */
function normalize(input: Partial<AgentResult>): AgentResult {
  return {
    reply_text: typeof input.reply_text === "string" ? input.reply_text : "",
    intent: input.intent ?? "other",
    qualification: input.qualification ?? {},
    suggested_slots: Array.isArray(input.suggested_slots) ? input.suggested_slots : [],
    estimated_value:
      typeof input.estimated_value === "number" && Number.isFinite(input.estimated_value)
        ? input.estimated_value
        : 0,
    confidence: input.confidence === "high" ? "high" : "low",
    needs_human: Boolean(input.needs_human),
    internal_note: typeof input.internal_note === "string" ? input.internal_note : "",
  };
}
