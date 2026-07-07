import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null | undefined;

/**
 * Anthropic client, or null if no API key is configured yet.
 * Callers degrade gracefully (return a clear error) rather than crash,
 * so the app builds and runs before the key is added.
 */
export function getAnthropic(): Anthropic | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  cached = apiKey ? new Anthropic({ apiKey }) : null;
  return cached;
}

/** The model used for the reply agent. Override with ANTHROPIC_MODEL. */
export function anthropicModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
