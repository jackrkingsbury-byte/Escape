import { createAdminClient } from "@/lib/supabase/server";

/**
 * Evaluates milestone achievements for a user and unlocks any newly earned
 * ones. Returns the codes unlocked in this pass (for toast notifications).
 * Runs with the service role; call from server routes only.
 */
export async function evaluateAchievements(userId: string): Promise<string[]> {
  const admin = createAdminClient();

  const [{ data: profile }, { count: completed }, { data: unlockedRows }, { count: coachCount }] =
    await Promise.all([
      admin.from("profiles").select("level, current_streak, plan").eq("id", userId).single(),
      admin
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed"),
      admin.from("user_achievements").select("achievement_code").eq("user_id", userId),
      admin
        .from("coach_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("role", "user"),
    ]);

  if (!profile) return [];
  const unlocked = new Set((unlockedRows ?? []).map((r) => r.achievement_code));
  const done = completed ?? 0;

  const earned: string[] = [];
  const check = (code: string, condition: boolean) => {
    if (condition && !unlocked.has(code)) earned.push(code);
  };

  check("first_mission", done >= 1);
  check("missions_10", done >= 10);
  check("missions_50", done >= 50);
  check("missions_200", done >= 200);
  check("streak_3", profile.current_streak >= 3);
  check("streak_7", profile.current_streak >= 7);
  check("streak_30", profile.current_streak >= 30);
  check("level_5", profile.level >= 5);
  check("level_10", profile.level >= 10);
  check("coach_devotee", (coachCount ?? 0) >= 100 && profile.plan === "premium");

  if (earned.length === 0) return [];

  // Respect premium-only flags
  const { data: catalog } = await admin
    .from("achievements")
    .select("code, xp_reward, premium_only")
    .in("code", earned);

  const grantable = (catalog ?? []).filter(
    (a) => !a.premium_only || profile.plan === "premium"
  );
  if (grantable.length === 0) return [];

  await admin.from("user_achievements").insert(
    grantable.map((a) => ({ user_id: userId, achievement_code: a.code }))
  );

  const bonusXp = grantable.reduce((sum, a) => sum + a.xp_reward, 0);
  if (bonusXp > 0) {
    await admin.from("xp_events").insert(
      grantable.map((a) => ({ user_id: userId, amount: a.xp_reward, reason: "achievement" }))
    );
    const { data: p } = await admin.from("profiles").select("xp").eq("id", userId).single();
    if (p) {
      await admin
        .from("profiles")
        .update({ xp: p.xp + bonusXp })
        .eq("id", userId);
    }
  }

  return grantable.map((a) => a.code);
}

/** Grant a single achievement by code (e.g. event-driven unlocks). */
export async function grantAchievement(userId: string, code: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_achievements")
    .insert({ user_id: userId, achievement_code: code });
  if (error) return false; // already unlocked (PK conflict) or invalid code

  const { data: a } = await admin
    .from("achievements")
    .select("xp_reward")
    .eq("code", code)
    .single();
  if (a?.xp_reward) {
    await admin.from("xp_events").insert({ user_id: userId, amount: a.xp_reward, reason: "achievement" });
    const { data: p } = await admin.from("profiles").select("xp").eq("id", userId).single();
    if (p) await admin.from("profiles").update({ xp: p.xp + a.xp_reward }).eq("id", userId);
  }
  return true;
}
