import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropic, AI_MODEL } from "@/lib/ai/client";
import { MISSION_SYSTEM, CHALLENGE_SYSTEM, MISSION_SCHEMA, userContextBlock } from "@/lib/ai/prompts";
import { getAuthedContext } from "@/lib/auth";
import { consumeUsage, FREE_LIMITS, isPremium } from "@/lib/entitlements";
import { XP_BY_DIFFICULTY } from "@/lib/gamification";

export const maxDuration = 120;

const BodySchema = z.object({
  cadence: z.enum(["daily", "weekly"]).default("daily"),
  count: z.number().int().min(1).max(5).default(3),
});

const GeneratedMission = z.object({
  title: z.string().min(1).max(120),
  description: z.string(),
  why_it_matters: z.string(),
  category: z.enum(["friends", "confidence", "fitness", "money", "discipline", "focus", "communication"]),
  difficulty: z.enum(["easy", "medium", "hard", "epic"]),
});

export async function POST(request: Request) {
  const ctx = await getAuthedContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, profile } = ctx;

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { cadence, count } = parsed.data;

  const premium = isPremium(profile);

  // Weekly challenges are a premium feature.
  if (cadence === "weekly" && !premium) {
    return NextResponse.json(
      { error: "upgrade_required", message: "Weekly AI challenges are a Premium feature." },
      { status: 402 }
    );
  }

  // Free tier: limited daily generations.
  if (!premium) {
    const usage = await consumeUsage(user.id, "mission_generations", FREE_LIMITS.missionGenerationsPerDay);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: `Free plan includes ${usage.limit} AI mission drops per day. Upgrade for unlimited.`,
        },
        { status: 402 }
      );
    }
  }

  // Gather context: goals + recent missions (dedup signal for the model).
  const [{ data: goals }, { data: recent }] = await Promise.all([
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
      .limit(15),
  ]);

  const system = cadence === "weekly" ? CHALLENGE_SYSTEM : MISSION_SYSTEM;
  const ask =
    cadence === "weekly"
      ? "Design this week's epic challenge (return it as a single mission in the array)."
      : `Generate exactly ${count} missions for today.`;

  let generated: z.infer<typeof GeneratedMission>[];
  try {
    const response = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: MISSION_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `${userContextBlock(profile, goals ?? [], recent ?? [])}\n\n${ask}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "generation_declined" }, { status: 502 });
    }
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("no text block");
    const payload = JSON.parse(text.text) as { missions: unknown[] };
    generated = payload.missions
      .map((m) => GeneratedMission.safeParse(m))
      .filter((r) => r.success)
      .map((r) => r.data);
  } catch (err) {
    console.error("mission generation failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  if (generated.length === 0) {
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const dueDate =
    cadence === "weekly"
      ? new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const rows = generated.slice(0, cadence === "weekly" ? 1 : count).map((m) => ({
    user_id: user.id,
    title: m.title,
    description: m.description,
    why_it_matters: m.why_it_matters,
    category: m.category,
    cadence,
    difficulty: cadence === "weekly" ? ("epic" as const) : m.difficulty,
    xp_reward: cadence === "weekly" ? 100 : (XP_BY_DIFFICULTY[m.difficulty] ?? 25),
    source: "ai",
    due_date: dueDate,
  }));

  const { data: inserted, error } = await supabase.from("missions").insert(rows).select("*");
  if (error) {
    console.error("mission insert failed", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ missions: inserted });
}
