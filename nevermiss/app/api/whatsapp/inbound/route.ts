import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateTwilioSignature, sendWhatsApp } from "@/lib/twilio";
import { runAgent } from "@/lib/agent/runAgent";
import { profileFromBusiness } from "@/lib/agent/types";
import type { BusinessRow, ConversationRow, LeadRow, MessageRow } from "@/lib/supabase/types";
import type { ConversationTurn } from "@/lib/agent/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMPTY_TWIML =
  '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twiml() {
  return new NextResponse(EMPTY_TWIML, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

const digits = (s: string) => s.replace(/\D/g, "");

/**
 * Twilio WhatsApp inbound webhook.
 * Persists the message, runs the AI reply agent, and either auto-replies
 * (ai_mode = 'auto') or stores a draft for the owner to approve
 * (ai_mode = 'approve'). Always returns 200 TwiML so Twilio never errors.
 */
export async function POST(request: NextRequest) {
  // Parse Twilio's form-encoded payload.
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : "";

  // Verify the request really came from Twilio.
  const signature = request.headers.get("x-twilio-signature");
  const webhookUrl =
    (process.env.APP_BASE_URL?.replace(/\/$/, "") ?? new URL(request.url).origin) +
    "/api/whatsapp/inbound";
  if (!validateTwilioSignature(signature, webhookUrl, params)) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const fromRaw = params.From ?? ""; // "whatsapp:+27..."
  const toRaw = params.To ?? ""; // business's NeverMiss number
  const bodyText = (params.Body ?? "").trim();
  const waMessageId = params.MessageSid || null;
  if (!fromRaw || !bodyText) return twiml();

  const admin = createSupabaseAdminClient();
  if (!admin) return twiml(); // not configured yet — acknowledge and drop

  const customerWa = digits(fromRaw);
  const toDigits = digits(toRaw);

  try {
    // Identify the business by its NeverMiss number; fall back to the first
    // business (single-tenant sandbox where every message hits one number).
    let business: BusinessRow | null = null;
    if (toDigits) {
      const { data } = await admin
        .from("businesses")
        .select("*")
        .eq("whatsapp_number", toDigits)
        .limit(1);
      business = (data?.[0] as BusinessRow | undefined) ?? null;
    }
    if (!business) {
      const { data } = await admin
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1);
      business = (data?.[0] as BusinessRow | undefined) ?? null;
    }
    if (!business) return twiml();

    // Find or create the lead (open conversation with this customer).
    let lead = await findOpenLead(admin, business.id, customerWa);
    if (!lead) {
      const { data } = await admin
        .from("leads")
        .insert({
          business_id: business.id,
          customer_wa: customerWa,
          status: "new",
          source: "whatsapp",
        })
        .select("*")
        .single();
      lead = data as LeadRow;
    }

    // Find or create the conversation.
    let conversation = await findConversation(admin, business.id, customerWa);
    if (!conversation) {
      const { data } = await admin
        .from("conversations")
        .insert({
          business_id: business.id,
          lead_id: lead.id,
          wa_conversation_id: customerWa,
        })
        .select("*")
        .single();
      conversation = data as ConversationRow;
    }

    // Persist the inbound message.
    await admin.from("messages").insert({
      conversation_id: conversation.id,
      direction: "in",
      sender: "customer",
      body: bodyText,
      wa_message_id: waMessageId,
    });

    // Build conversation history for context.
    const { data: historyRows } = await admin
      .from("messages")
      .select("direction, body")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(12);
    const history: ConversationTurn[] = (historyRows ?? [])
      .slice(0, -1) // exclude the message we just inserted (it's the "incoming")
      .filter((m) => m.body)
      .map((m) => ({
        role: (m as Pick<MessageRow, "direction">).direction === "in" ? "customer" : "business",
        text: (m as Pick<MessageRow, "body">).body as string,
      }));

    // Run the agent.
    const outcome = await runAgent(profileFromBusiness(business), history, bodyText);
    if (!outcome.ok) {
      await admin.from("events").insert({
        business_id: business.id,
        type: "agent_error",
        payload: { error: outcome.error, lead_id: lead.id },
      });
      return twiml();
    }
    const result = outcome.result;

    // Update lead qualification / value.
    const nextStatus =
      result.intent === "booking" ? "booked" : lead.status === "new" ? "qualifying" : lead.status;
    await admin
      .from("leads")
      .update({
        status: nextStatus,
        estimated_value: Math.max(Number(lead.estimated_value ?? 0), result.estimated_value),
      })
      .eq("id", lead.id);

    await admin
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    if (result.intent === "spam") {
      return twiml();
    }

    const canAutoSend =
      business.ai_mode === "auto" && !result.needs_human && result.reply_text.trim().length > 0;

    if (canAutoSend) {
      const sid = await sendWhatsApp(fromRaw, result.reply_text);
      await admin.from("messages").insert({
        conversation_id: conversation.id,
        direction: "out",
        sender: "ai",
        body: result.reply_text,
        wa_message_id: sid,
        ai_meta: result as unknown as Record<string, unknown>,
      });
      await admin.from("events").insert({
        business_id: business.id,
        type: "auto_reply_sent",
        payload: { lead_id: lead.id, needs_human: result.needs_human },
      });
    } else {
      // Manual / approve mode (or needs_human): store a draft, don't send.
      await admin.from("messages").insert({
        conversation_id: conversation.id,
        direction: "out",
        sender: "ai",
        body: result.reply_text,
        ai_meta: { draft: true, ...(result as unknown as Record<string, unknown>) },
      });
      await admin.from("events").insert({
        business_id: business.id,
        type: "draft_ready",
        payload: { lead_id: lead.id, needs_human: result.needs_human },
      });
    }

    return twiml();
  } catch (err) {
    console.error("[whatsapp inbound] error:", err instanceof Error ? err.message : err);
    return twiml(); // never fail the webhook
  }
}

type Admin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

async function findOpenLead(
  admin: Admin,
  businessId: string,
  customerWa: string,
): Promise<LeadRow | null> {
  const { data } = await admin
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .eq("customer_wa", customerWa)
    .not("status", "in", "(won,lost)")
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0] as LeadRow | undefined) ?? null;
}

async function findConversation(
  admin: Admin,
  businessId: string,
  customerWa: string,
): Promise<ConversationRow | null> {
  const { data } = await admin
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .eq("wa_conversation_id", customerWa)
    .limit(1);
  return (data?.[0] as ConversationRow | undefined) ?? null;
}
