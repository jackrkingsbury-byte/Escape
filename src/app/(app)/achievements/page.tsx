import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth";
import { isPremium } from "@/lib/entitlements";
import type { Achievement } from "@/lib/types";
import Link from "next/link";

export const metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const ctx = await getAuthedContext();
  if (!ctx) redirect("/login");
  const { supabase, user, profile } = ctx;

  const [{ data: catalog }, { data: unlockedRows }] = await Promise.all([
    supabase.from("achievements").select("*").order("sort_order"),
    supabase.from("user_achievements").select("achievement_code, unlocked_at").eq("user_id", user.id),
  ]);

  const unlocked = new Map((unlockedRows ?? []).map((r) => [r.achievement_code, r.unlocked_at]));
  const achievements = (catalog ?? []) as Achievement[];
  const premium = isPremium(profile);
  const unlockedCount = unlocked.size;

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Achievements</h1>
          <p className="mt-1 text-sm text-slate-400">
            {unlockedCount} of {achievements.length} unlocked
          </p>
        </div>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-ember-500 to-ember-400"
            style={{ width: `${achievements.length ? (unlockedCount / achievements.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const isUnlocked = unlocked.has(a.code);
          const lockedPremium = a.premium_only && !premium;
          return (
            <div
              key={a.code}
              className={`glass relative overflow-hidden p-5 transition-all duration-300 ${
                isUnlocked ? "border-ember-500/40 shadow-glow-ember" : "opacity-70"
              }`}
            >
              {a.premium_only && (
                <span className="absolute right-3 top-3 text-[10px] font-bold uppercase tracking-wider text-ember-400">
                  Premium
                </span>
              )}
              <div className={`text-4xl ${isUnlocked ? "" : "opacity-40 grayscale"}`}>{a.icon}</div>
              <h3 className={`mt-3 font-display font-semibold ${isUnlocked ? "text-white" : "text-slate-400"}`}>
                {a.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{a.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-electric-400">+{a.xp_reward} XP</span>
                {isUnlocked ? (
                  <span className="text-emerald-400">
                    ✓ {new Date(unlocked.get(a.code)!).toLocaleDateString()}
                  </span>
                ) : lockedPremium ? (
                  <Link href="/pricing" className="text-ember-400 hover:underline">
                    Unlock with Premium →
                  </Link>
                ) : (
                  <span className="text-slate-600">🔒 Locked</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
