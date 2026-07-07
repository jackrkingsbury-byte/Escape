import { NextResponse, type NextRequest } from "next/server";
import { validateTwilioSignature } from "@/lib/twilio";
import { handleMissedCall } from "@/lib/inbound";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Twilio Voice webhook — the missed-call text-back entry point.
 * The business forwards their line (on no-answer) to this Twilio number.
 * We register the missed call, immediately SMS the caller to open a
 * conversation, and tell the caller (briefly) that a text is on the way.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : "";

  const signature = request.headers.get("x-twilio-signature");
  const url =
    (process.env.APP_BASE_URL?.replace(/\/$/, "") ?? new URL(request.url).origin) +
    "/api/voice/incoming";
  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const from = params.From ?? "";
  const to = params.To ?? "";
  if (from) {
    await handleMissedCall({ from, to, callSid: params.CallSid || null });
  }

  // Brief spoken message, then hang up. The SMS does the real work.
  const say =
    "Sorry we missed your call. We are sending you a text message right now so we can help you quickly. Thank you.";
  const voiceTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">${say}</Say><Hangup/></Response>`;
  return new NextResponse(voiceTwiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
