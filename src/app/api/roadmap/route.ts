import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropic, AI_MODEL } from "@/lib/ai/client";
import { ROADMAP_SYSTEM, ROADMAP_SCHEMA, userContextBlock } from "@/lib/ai/prompts";
import { getAuthedContext } from "@/lib/auth";
import { isPremium } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/server";
import { grantAchievement } from "@/lib/achievements";

export const maxDuration = 180;

const BodySchema = z.object({
  goalId: z.string().uuid().optional(),
  objective: z.string().min(3).max(500),
  horizonWeeks: z.number().int().min(4).max(26).default(12),
});

/** Premium: builds a custom week-by-week roadmap toward a goal. */
export async function POST(request: Request) {
  const ctx = await getAuthedContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { user, profile } = ctx;

  if (!isPremium(profile)) {
    return NextResponse.json(
      { error: "upgrade_required", message: "Custom AI roadmaps are a Premium feature." },
      { status: 402 }
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { goalId, objective, horizonWeeks } = parsed.data;

  let roadmap: { title: string; horizon_weeks: number; milestones: unknown[] };
  try {
    const response = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: ROADMAP_SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: ROADMAP_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `${userContextBlock(profile)}\n\nGoal: ${objective}\nHorizon: ${horizonWeeks} weeks.\n\nBuild my roadmap.`,
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "generation_declined" }, { status: 502 });
    }
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("no text block");
    roadmap = JSON.parse(text.text);
  } catch (err) {
    console.error("roadmap generation failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const admin = createAdminClient();
  const { data: saved, error } = await admin
    .from("roadmaps")
    .insert({
      user_id: user.id,
      goal_id: goalId ?? null,
      title: roadmap.title,
      horizon_weeks: roadmap.horizon_weeks,
      content: { milestones: roadmap.milestones },
    })
    .select("*")
    .single();
  if (error) {
    console.error("roadmap save failed", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  await grantAchievement(user.id, "roadmap_created");

  return NextResponse.json({ roadmap: saved });
}
