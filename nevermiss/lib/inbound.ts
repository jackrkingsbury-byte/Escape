import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendByChannel, type Channel } from "@/lib/twilio";
import { runAgent } from "@/lib/agent/runAgent";
import { profileFromBusiness } from "@/lib/agent/types";
import type { BusinessRow, ConversationRow, LeadRow, MessageRow } from "@/lib/supabase/types";
import type { ConversationTurn } from "@/lib/agent/types";

const digits = (s: string) => s.replace(/\D/g, "");

type Admin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

/**
 * Core inbound-message pipeline, shared by the WhatsApp and SMS webhooks.
 * Persists the message, runs the AI agent, then auto-sends (ai_mode='auto')
 * or stores a draft (ai_mode='approve'). Channel-aware for replies.
 * Never throws.
 */
export async function handleInboundMessage(opts: {
  channel: Channel;
  from: string; // caller/sender (may carry a "whatsapp:" prefix)
  to: string; // the business's tracking/contact number
  body: string;
  messageId: string | null;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const customer = digits(opts.from);
  const toDigits = digits(opts.to);
  const convKey = `${opts.channel}:${customer}`;

  try {
    const business = await findBusiness(admin, toDigits);
    if (!business) return;

    const lead = await findOrCreateLead(admin, business.id, customer, "whatsapp_or_sms");
    const conversation = await findOrCreateConversation(admin, business.id, lead.id, convKey);

    await admin.from("messages").insert({
      conversation_id: conversation.id,
      direction: "in",
      sender: "customer",
      body: opts.body,
      wa_message_id: opts.messageId,
    });

    const history = await loadHistory(admin, conversation.id);
    const outcome = await runAgent(profileFromBusiness(business), history, opts.body);
    if (!outcome.ok) {
      await admin.from("events").insert({
        business_id: business.id,
        type: "agent_error",
        payload: { error: outcome.error, lead_id: lead.id, channel: opts.channel },
      });
      return;
    }
    const result = outcome.result;

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

    if (result.intent === "spam") return;

    const canAutoSend =
      business.ai_mode === "auto" && !result.needs_human && result.reply_text.trim().length > 0;

    if (canAutoSend) {
      const sid = await sendByChannel(opts.channel, opts.from, result.reply_text);
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
        payload: { lead_id: lead.id, channel: opts.channel },
      });
    } else {
      await admin.from("messages").insert({
        conversation_id: conversation.id,
        direction: "out",
        sender: "ai",
        body: result.reply_text,
        ai_meta: { draft: true, channel: opts.channel, ...(result as unknown as Record<string, unknown>) },
      });
      await admin.from("events").insert({
        business_id: business.id,
        type: "draft_ready",
        payload: { lead_id: lead.id, needs_human: result.needs_human, channel: opts.channel },
      });
    }
  } catch (err) {
    console.error("[handleInboundMessage] error:", err instanceof Error ? err.message : err);
  }
}

/** Register a missed call and text the caller back to start an SMS conversation. */
export async function handleMissedCall(opts: {
  from: string; // caller
  to: string; // business tracking number
  callSid: string | null;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const customer = digits(opts.from);
  const toDigits = digits(opts.to);
  const convKey = `sms:${customer}`;

  try {
    const business = await findBusiness(admin, toDigits);
    if (!business) return;

    const lead = await findOrCreateLead(admin, business.id, customer, "missed_call");
    const conversation = await findOrCreateConversation(admin, business.id, lead.id, convKey);

    const greeting = `Hi! This is ${business.name}. Sorry we missed your call 🙏 How can we help? Reply here and we'll sort you out.`;
    const sid = await sendByChannel("sms", opts.from, greeting);

    await admin.from("messages").insert({
      conversation_id: conversation.id,
      direction: "out",
      sender: "ai",
      body: greeting,
      wa_message_id: sid,
      ai_meta: { missed_call: true, call_sid: opts.callSid },
    });
    await admin.from("events").insert({
      business_id: business.id,
      type: "missed_call_textback",
      payload: { lead_id: lead.id, call_sid: opts.callSid },
    });
  } catch (err) {
    console.error("[handleMissedCall] error:", err instanceof Error ? err.message : err);
  }
}

/* ------------------------------ helpers ------------------------------ */

async function findBusiness(admin: Admin, toDigits: string): Promise<BusinessRow | null> {
  if (toDigits) {
    const { data } = await admin
      .from("businesses")
      .select("*")
      .eq("whatsapp_number", toDigits)
      .limit(1);
    const match = (data?.[0] as BusinessRow | undefined) ?? null;
    if (match) return match;
  }
  // Fallback: single-tenant sandbox where every message hits one number.
  const { data } = await admin
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  return (data?.[0] as BusinessRow | undefined) ?? null;
}

async function findOrCreateLead(
  admin: Admin,
  businessId: string,
  customer: string,
  source: string,
): Promise<LeadRow> {
  const { data } = await admin
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .eq("customer_wa", customer)
    .not("status", "in", "(won,lost)")
    .order("created_at", { ascending: false })
    .limit(1);
  const existing = data?.[0] as LeadRow | undefined;
  if (existing) return existing;

  const { data: created } = await admin
    .from("leads")
    .insert({ business_id: businessId, customer_wa: customer, status: "new", source })
    .select("*")
    .single();
  return created as LeadRow;
}

async function findOrCreateConversation(
  admin: Admin,
  businessId: string,
  leadId: string,
  convKey: string,
): Promise<ConversationRow> {
  const { data } = await admin
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .eq("wa_conversation_id", convKey)
    .limit(1);
  const existing = data?.[0] as ConversationRow | undefined;
  if (existing) return existing;

  const { data: created } = await admin
    .from("conversations")
    .insert({ business_id: businessId, lead_id: leadId, wa_conversation_id: convKey })
    .select("*")
    .single();
  return created as ConversationRow;
}

async function loadHistory(admin: Admin, conversationId: string): Promise<ConversationTurn[]> {
  const { data } = await admin
    .from("messages")
    .select("direction, body")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(12);
  return (data ?? [])
    .slice(0, -1) // exclude the just-inserted incoming message
    .filter((m) => (m as Pick<MessageRow, "body">).body)
    .map((m) => ({
      role: (m as Pick<MessageRow, "direction">).direction === "in" ? "customer" : "business",
      text: (m as Pick<MessageRow, "body">).body as string,
    }));
}
