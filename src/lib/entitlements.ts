import { createAdminClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Free-tier daily limits. Premium is unlimited. */
export const FREE_LIMITS = {
  missionGenerationsPerDay: 2,
  coachMessagesPerDay: 10,
  activeGoals: 2,
} as const;

export function isPremium(profile: Pick<Profile, "plan" | "current_period_end">): boolean {
  if (profile.plan !== "premium") return false;
  // Grace: treat as premium until the paid period actually ends.
  if (profile.current_period_end && new Date(profile.current_period_end) < new Date()) {
    return false;
  }
  return true;
}

export type UsageKind = "mission_generations" | "coach_messages";

/**
 * Atomically increments today's usage counter and reports whether the
 * request is within the free-tier limit. Premium users skip this entirely.
 */
export async function consumeUsage(
  userId: string,
  kind: UsageKind,
  limit: number
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await admin
    .from("ai_usage")
    .select("mission_generations, coach_messages")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();

  const used = existing ? existing[kind] : 0;
  if (used >= limit) {
    return { allowed: false, used, limit };
  }

  await admin
    .from("ai_usage")
    .upsert(
      { user_id: userId, day: today, [kind]: used + 1 },
      { onConflict: "user_id,day" }
    );

  return { allowed: true, used: used + 1, limit };
}
