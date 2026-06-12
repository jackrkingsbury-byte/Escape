import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropic, AI_MODEL } from "@/lib/ai/client";
import { COACH_SYSTEM, userContextBlock } from "@/lib/ai/prompts";
import { getAuthedContext } from "@/lib/auth";
import { consumeUsage, FREE_LIMITS, isPremium } from "@/lib/entitlements";

export const maxDuration = 120;

const BodySchema = z.object({ message: z.string().min(1).max(4000) });

/**
 * AI life coach. Streams the reply as plain text chunks; persists both
 * sides of the conversation when the stream completes.
 */
export async function POST(request: Request) {
  const ctx = await getAuthedContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, profile } = ctx;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const userMessage = parsed.data.message;

  if (!isPremium(profile)) {
    const usage = await consumeUsage(user.id, "coach_messages", FREE_LIMITS.coachMessagesPerDay);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: `Free plan includes ${usage.limit} coach messages per day. Upgrade for unlimited coaching.`,
        },
        { status: 402 }
      );
    }
  }

  // Conversation memory: last 20 turns + live progress context.
  const [{ data: history }, { data: goals }, { data: recentMissions }] = await Promise.all([
    supabase
      .from("coach_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("goals")
      .select("title, category, progress")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(5),
    supabase
      .from("missions")
      .select("title, status, difficulty")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const turns = (history ?? []).reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const contextNote = `<user_context>\n${userContextBlock(profile, goals ?? [], recentMissions ?? [])}\n</user_context>`;

  await supabase.from("coach_messages").insert({
    user_id: user.id,
    role: "user",
    content: userMessage,
  });

  const stream = getAnthropic().messages.stream({
    model: AI_MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: [{ type: "text", text: COACH_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [...turns, { role: "user", content: `${contextNote}\n\n${userMessage}` }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          const note = "I can't help with that one — let's get back to your goals.";
          full = full || note;
          controller.enqueue(encoder.encode(full === note ? note : ""));
        }
        if (full.trim()) {
          await supabase.from("coach_messages").insert({
            user_id: user.id,
            role: "assistant",
            content: full,
          });
        }
      } catch (err) {
        console.error("coach stream failed", err);
        controller.enqueue(encoder.encode("\n\n[Connection interrupted — try again.]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
