import Anthropic from "@anthropic-ai/sdk";

/**
 * Lazily-constructed Anthropic client shared by all AI features.
 * Model: claude-sonnet-4-6 — adaptive thinking, structured outputs, streaming.
 */
let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

export const AI_MODEL = "claude-sonnet-4-6";
