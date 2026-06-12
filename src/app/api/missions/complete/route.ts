import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthedContext } from "@/lib/auth";
import { evaluateAchievements, grantAchievement } from "@/lib/achievements";

const BodySchema = z.object({ missionId: z.string().uuid() });

export async function POST(request: Request) {
  const ctx = await getAuthedContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user } = ctx;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Atomic XP + streak + level update, owner-validated in SQL.
  const { data, error } = await supabase.rpc("complete_mission", {
    p_mission_id: parsed.data.missionId,
  });
  if (error) {
    const status = /not found/.test(error.message) ? 404 : 409;
    return NextResponse.json({ error: error.message }, { status });
  }

  // Epic completions unlock their own badge.
  const { data: mission } = await supabase
    .from("missions")
    .select("difficulty")
    .eq("id", parsed.data.missionId)
    .single();
  if (mission?.difficulty === "epic") {
    await grantAchievement(user.id, "epic_mission");
  }

  const unlocked = await evaluateAchievements(user.id);

  return NextResponse.json({ ...data, unlocked });
}
