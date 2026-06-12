import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthedContext } from "@/lib/auth";
import { grantAchievement } from "@/lib/achievements";

const BodySchema = z.object({
  focusAreas: z.array(z.string()).min(1).max(4),
  intensity: z.enum(["chill", "standard", "hardcore"]),
  goal: z.object({
    title: z.string().min(3).max(200),
    category: z.string(),
  }),
});

export async function POST(request: Request) {
  const ctx = await getAuthedContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user } = ctx;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { focusAreas, intensity, goal } = parsed.data;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ focus_areas: focusAreas, intensity, onboarded: true })
    .eq("id", user.id);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: goalError } = await supabase.from("goals").insert({
    user_id: user.id,
    title: goal.title,
    category: goal.category,
  });
  if (!goalError) {
    await grantAchievement(user.id, "first_goal");
  }

  return NextResponse.json({ ok: true });
}
