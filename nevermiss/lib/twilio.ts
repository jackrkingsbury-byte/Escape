import twilio from "twilio";

/**
 * Twilio helpers for WhatsApp. All are defensive: if Twilio isn't configured
 * the functions no-op or return false, so the app builds and runs without it.
 */

function authToken(): string | undefined {
  return process.env.TWILIO_AUTH_TOKEN;
}

function whatsappFrom(): string | undefined {
  return process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && whatsappFrom(),
  );
}

function client() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = authToken();
  if (!sid || !token) return null;
  return twilio(sid, token);
}

/**
 * Validate an inbound Twilio webhook signature.
 * If no auth token is set (early dev), returns true so testing isn't blocked —
 * tighten this once Twilio is live in production.
 */
export function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>,
): boolean {
  const token = authToken();
  if (!token) return true;
  if (!signature) return false;
  try {
    return twilio.validateRequest(token, signature, url, params);
  } catch {
    return false;
  }
}

function smsFrom(): string | undefined {
  return process.env.TWILIO_SMS_FROM; // an SMS-capable Twilio number, e.g. "+27..."
}

/** Send a WhatsApp message. Returns the message SID, or null on failure/no-config. */
export async function sendWhatsApp(to: string, body: string): Promise<string | null> {
  const c = client();
  const from = whatsappFrom();
  if (!c || !from || !body.trim()) return null;

  // `to` may already be "whatsapp:+27..." (from Twilio) or a bare number.
  const toAddress = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  try {
    const msg = await c.messages.create({ from, to: toAddress, body });
    return msg.sid;
  } catch (err) {
    console.error("[sendWhatsApp] error:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Send an SMS. Returns the message SID, or null on failure/no-config. */
export async function sendSms(to: string, body: string): Promise<string | null> {
  const c = client();
  const from = smsFrom();
  if (!c || !from || !body.trim()) return null;

  const toAddress = to.replace(/^whatsapp:/, "");
  try {
    const msg = await c.messages.create({ from, to: toAddress, body });
    return msg.sid;
  } catch (err) {
    console.error("[sendSms] error:", err instanceof Error ? err.message : err);
    return null;
  }
}

export type Channel = "whatsapp" | "sms";

/** Send a message over the given channel. */
export async function sendByChannel(
  channel: Channel,
  to: string,
  body: string,
): Promise<string | null> {
  return channel === "whatsapp" ? sendWhatsApp(to, body) : sendSms(to, body);
}
