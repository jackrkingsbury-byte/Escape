import { NextResponse, type NextRequest } from "next/server";
import { validateTwilioSignature } from "@/lib/twilio";
import { handleInboundMessage } from "@/lib/inbound";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
const twiml = () =>
  new NextResponse(EMPTY_TWIML, { status: 200, headers: { "Content-Type": "text/xml" } });

/**
 * Twilio SMS inbound webhook. Handles the follow-up conversation after a
 * missed-call text-back (or any SMS lead). Replies over SMS.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : "";

  const signature = request.headers.get("x-twilio-signature");
  const url =
    (process.env.APP_BASE_URL?.replace(/\/$/, "") ?? new URL(request.url).origin) +
    "/api/sms/inbound";
  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const from = params.From ?? "";
  const body = (params.Body ?? "").trim();
  if (from && body) {
    await handleInboundMessage({
      channel: "sms",
      from,
      to: params.To ?? "",
      body,
      messageId: params.MessageSid || null,
    });
  }
  return twiml();
}
