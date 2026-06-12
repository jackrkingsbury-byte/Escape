import { NextResponse } from "next/server";
import { getAnthropic, AI_MODEL } from "@/lib/ai/client";
import { REVIEW_SYSTEM, REVIEW_SCHEMA, userContextBlock } from "@/lib/ai/prompts";
import { getAuthedContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { grantAchievement } from "@/lib/achievements";
import type { WeeklyReviewContent } from "@/lib/types";

export const maxDuration = 120;

function startOfWeek(d = new Date()): string {
  const date = new Date(d);
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

/** Generates (or returns the cached) AI review for the current week. */
export async function POST() {
  const ctx = await getAuthedContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, profile } = ctx;

  const weekStart = startOfWeek();

  const { data: existing } = await supabase
    .from("weekly_reviews")
    .select("content")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ review: existing.content, cached: true });
  }

  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data: missions } = await supabase
    .from("missions")
    .select("title, category, difficulty, status, completed_at, due_date")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at");

  if (!missions || missions.length === 0) {
    return NextResponse.json(
      { error: "no_data", message: "Complete a few missions first — then your review unlocks." },
      { status: 400 }
    );
  }

  const missionLog = missions
    .map((m) => `- [${m.status}] (${m.difficulty}) ${m.title} — ${m.category}`)
    .join("\n");

  let review: WeeklyReviewContent;
  try {
    const response = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: REVIEW_SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: REVIEW_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `${userContextBlock(profile)}\n\nThis week's mission log:\n${missionLog}\n\nWrite my weekly review.`,
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "generation_declined" }, { status: 502 });
    }
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("no text block");
    review = JSON.parse(text.text) as WeeklyReviewContent;
  } catch (err) {
    console.error("review generation failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  // Persist with the service role (reviews are server-written, user-read).
  const admin = createAdminClient();
  await admin.from("weekly_reviews").insert({
    user_id: user.id,
    week_start: weekStart,
    content: review,
  });
  await grantAchievement(user.id, "first_review");

  return NextResponse.json({ review, cached: false });
}
