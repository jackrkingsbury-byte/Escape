import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isTwilioConfigured, sendByChannel, type Channel } from "@/lib/twilio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const digits = (s: string) => s.replace(/\D/g, "");

/**
 * Approve or dismiss an AI draft reply (the approve-mode loop).
 * Auth-required; RLS guarantees the caller owns the message's business.
 * POST body: { action: "approve" | "dismiss" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let action: string;
  try {
    action = ((await request.json()) as { action?: string }).action ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (action !== "approve" && action !== "dismiss") {
    return NextResponse.json({ error: "action must be approve or dismiss." }, { status: 400 });
  }

  // RLS scopes this to the owner's businesses; the join gives us the address.
  const { data: rows } = await supabase
    .from("messages")
    .select("id, body, ai_meta, conversation_id, conversations!inner(business_id, wa_conversation_id)")
    .eq("id", params.id)
    .limit(1);
  const row = (rows as unknown as Array<{
    id: string;
    body: string | null;
    ai_meta: Record<string, unknown> | null;
    conversations: { business_id: string; wa_conversation_id: string | null };
  }> | null)?.[0];

  if (!row) return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  if (!row.ai_meta || row.ai_meta.draft !== true) {
    return NextResponse.json({ error: "Message is not a pending draft." }, { status: 409 });
  }

  // Untyped handle for jsonb updates (hand-written Database generic over-narrows writes).
  const messages = supabase.from("messages") as unknown as {
    update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
  };
  const events = supabase.from("events") as unknown as {
    insert: (v: object) => Promise<{ error: { message: string } | null }>;
  };

  if (action === "dismiss") {
    const { error } = await messages
      .update({ ai_meta: { ...row.ai_meta, draft: false, dismissed: true } })
      .eq("id", row.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "dismissed" });
  }

  // ---- approve & send ----
  if (!row.body?.trim()) {
    return NextResponse.json({ error: "Draft has no text to send." }, { status: 409 });
  }
  if (!isTwilioConfigured()) {
    return NextResponse.json(
      { error: "Sending isn't connected yet (Twilio not configured). The draft was kept." },
      { status: 503 },
    );
  }

  const convKey = row.conversations.wa_conversation_id ?? "";
  const m = convKey.match(/^(sms|whatsapp):(\d+)$/);
  const channel: Channel =
    (m?.[1] as Channel | undefined) ??
    ((row.ai_meta.channel as Channel | undefined) ?? "whatsapp");
  const number = m?.[2] ?? digits(convKey);
  if (!number) {
    return NextResponse.json({ error: "No customer number on this conversation." }, { status: 409 });
  }
  const to = channel === "whatsapp" ? `whatsapp:+${number}` : `+${number}`;

  const sid = await sendByChannel(channel, to, row.body);
  if (!sid) {
    return NextResponse.json({ error: "Send failed — check the Twilio setup." }, { status: 502 });
  }

  const { error } = await messages
    .update({
      ai_meta: { ...row.ai_meta, draft: false, approved: true },
      wa_message_id: sid,
    })
    .eq("id", row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await events.insert({
    business_id: row.conversations.business_id,
    type: "draft_approved",
    payload: { message_id: row.id, channel },
  });

  return NextResponse.json({ ok: true, action: "sent" });
}
