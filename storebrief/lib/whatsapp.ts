import type { BriefData } from "./types";
import { renderWhatsAppText } from "./render";

/**
 * WhatsApp delivery for the weekly brief (Twilio WhatsApp API).
 *
 * IMPORTANT policy note: a weekly brief is a *business-initiated* message sent
 * outside any customer-initiated 24-hour session window, so Meta requires a
 * pre-approved message **template**. Pass `templateSid` (+ variables) for
 * production. A freeform `Body` only delivers inside an open 24h session
 * (fine for dev/testing against the Twilio sandbox). This mirrors the exact
 * constraint that shaped NeverMiss — proactive WhatsApp is template-gated.
 */

export interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  /** Twilio WhatsApp sender, e.g. "whatsapp:+14155238886". */
  from: string;
  /** Recipient in the same form, e.g. "whatsapp:+27826118749". */
  to: string;
}

export interface SendOptions {
  /** Approved Twilio Content template SID for proactive sends. */
  templateSid?: string;
  templateVariables?: Record<string, string>;
  /** Injectable transport (defaults to global fetch); lets tests avoid the network. */
  fetch?: typeof fetch;
  /** When true, build the payload but do not send. */
  dryRun?: boolean;
}

export interface SendResult {
  ok: boolean;
  status: number;
  sid?: string;
  error?: string;
  /** The exact form fields that were (or would be) POSTed. */
  payload: Record<string, string>;
}

/** The brief as a WhatsApp-formatted string (asterisk bold, tight lines). */
export function briefToWhatsApp(data: BriefData): string {
  return renderWhatsAppText(data);
}

/** Build the Twilio "Create Message" form fields — template if given, else freeform. */
export function buildPayload(
  config: WhatsAppConfig,
  data: BriefData,
  opts: SendOptions = {},
): Record<string, string> {
  const payload: Record<string, string> = { From: config.from, To: config.to };
  if (opts.templateSid) {
    payload.ContentSid = opts.templateSid;
    if (opts.templateVariables) {
      payload.ContentVariables = JSON.stringify(opts.templateVariables);
    }
  } else {
    payload.Body = briefToWhatsApp(data);
  }
  return payload;
}

function basicAuth(sid: string, token: string): string {
  // Buffer is available in the Node runtime the app ships on.
  return Buffer.from(`${sid}:${token}`).toString("base64");
}

export async function sendWhatsAppBrief(
  config: WhatsAppConfig,
  data: BriefData,
  opts: SendOptions = {},
): Promise<SendResult> {
  const payload = buildPayload(config, data, opts);
  if (opts.dryRun) return { ok: true, status: 0, payload };

  const fetchFn = opts.fetch ?? globalThis.fetch;
  if (typeof fetchFn !== "function") {
    return { ok: false, status: 0, error: "no fetch transport available", payload };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`;
  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth(config.accountSid, config.authToken)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(payload).toString(),
    });
    const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    return {
      ok: res.ok,
      status: res.status,
      sid: json.sid,
      error: res.ok ? undefined : json.message ?? `HTTP ${res.status}`,
      payload,
    };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : "unknown", payload };
  }
}
