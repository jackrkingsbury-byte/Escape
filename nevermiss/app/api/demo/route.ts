import { NextResponse, type NextRequest } from "next/server";
import { runAgent } from "@/lib/agent/runAgent";
import { applyGuardrails } from "@/lib/agent/guardrails";
import { DEMO_PROFILE } from "@/lib/agent/types";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import type { ConversationTurn } from "@/lib/agent/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_MESSAGE_LEN = 500;
const MAX_HISTORY = 8;

/**
 * Public "Try it live" demo endpoint — no auth. Always uses the demo profile.
 * Guards: message length cap + limited history to bound token cost.
 * (For higher traffic, add rate limiting keyed on IP.)
 */
export async function POST(request: NextRequest) {
  // Protect AI credit: 8 messages/min per visitor, 60/min across everyone.
  const ip = clientIp(request.headers);
  const perIp = rateLimit(`demo:${ip}`, 8, 60_000);
  const global = rateLimit("demo:*", 60, 60_000);
  if (!perIp.allowed || !global.allowed) {
    const retry = Math.max(perIp.retryAfterSeconds, global.retryAfterSeconds, 5);
    return NextResponse.json(
      { error: "Whoa — the demo is popular right now. Try again in a few seconds." },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  let body: { message?: string; history?: ConversationTurn[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const message = (body.message ?? "").toString().trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      { error: `Please keep it under ${MAX_MESSAGE_LEN} characters.` },
      { status: 400 },
    );
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter((t) => t && typeof t.text === "string")
        .slice(-MAX_HISTORY)
    : [];

  const outcome = await runAgent(DEMO_PROFILE, history, message);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: 502 });
  }

  const { result, flags } = applyGuardrails(outcome.result, {
    priceRanges: DEMO_PROFILE.priceRanges,
    customerMessage: message,
  });

  return NextResponse.json({ result, guardrails: flags, usingDemoProfile: true });
}
