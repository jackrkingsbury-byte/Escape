import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth";
import { levelProgress, levelTitle } from "@/lib/gamification";
import { isPremium } from "@/lib/entitlements";
import { MissionCard } from "@/components/missions/mission-card";
import { GenerateMissionsButton } from "@/components/missions/generate-button";
import type { Goal, Mission } from "@/lib/types";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getAuthedContext();
  if (!ctx) redirect("/login");
  const { supabase, user, profile } = ctx;

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: missions }, { data: goals }, { count: totalCompleted }, { count: badges }] =
    await Promise.all([
      supabase
        .from("missions")
        .select("*")
        .eq("user_id", user.id)
        .gte("due_date", today)
        .order("status")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at"),
      supabase
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed"),
      supabase
        .from("user_achievements")
        .select("achievement_code", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const progress = levelProgress(profile.xp);
  const activeMissions = (missions ?? []).filter((m: Mission) => m.status === "active");
  const doneToday = (missions ?? []).filter((m: Mission) => m.status === "completed");
  const firstName = (profile.full_name ?? "Operator").split(" ")[0];
  const premium = isPremium(profile);

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">
            Mission control, <span className="text-gradient">{firstName}</span>
          </h1>
        </div>
        {!premium && (
          <Link href="/pricing" className="chip border-ember-500/30 bg-ember-500/10 !text-ember-300 transition-all hover:shadow-glow-ember">
            ✨ Free plan — upgrade for unlimited AI
          </Link>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Level</p>
          <p className="mt-1 font-display text-3xl font-bold text-white">
            {progress.level}
            <span className="ml-2 text-sm font-medium text-electric-400">{levelTitle(progress.level)}</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-electric-500 to-electric-400"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {profile.xp.toLocaleString()} / {progress.nextLevelXp.toLocaleString()} XP
          </p>
        </div>
        <div className="glass p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Streak</p>
          <p className="mt-1 font-display text-3xl font-bold text-white">
            <span className={profile.current_streak > 0 ? "animate-flame-flicker inline-block" : "opacity-30 grayscale"}>🔥</span>{" "}
            {profile.current_streak}
            <span className="text-sm font-medium text-slate-500"> days</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">Best: {profile.longest_streak} days</p>
        </div>
        <div className="glass p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Missions done</p>
          <p className="mt-1 font-display text-3xl font-bold text-white">{totalCompleted ?? 0}</p>
          <p className="mt-2 text-xs text-slate-500">{doneToday.length} today</p>
        </div>
        <Link href="/achievements" className="glass glass-hover p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Achievements</p>
          <p className="mt-1 font-display text-3xl font-bold text-white">🏆 {badges ?? 0}</p>
          <p className="mt-2 text-xs text-electric-400">View collection →</p>
        </Link>
      </div>

      {/* ── Today's missions ── */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-white">Today&apos;s missions</h2>
          <GenerateMissionsButton />
        </div>
        {activeMissions.length === 0 && doneToday.length === 0 ? (
          <div className="glass mt-4 p-10 text-center">
            <div className="text-4xl">🛰️</div>
            <p className="mt-3 font-display text-lg font-semibold text-white">No active missions</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
              Hit the button above and your AI will generate today&apos;s mission set from your goals.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[...activeMissions, ...doneToday].map((m: Mission) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        )}
      </section>

      {/* ── Goals ── */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white">Active goals</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(goals ?? []).map((g: Goal) => (
            <div key={g.id} className="glass p-5">
              <div className="flex items-center justify-between">
                <span className="chip">{g.category}</span>
                <span className="text-sm font-semibold text-electric-400">{g.progress}%</span>
              </div>
              <h3 className="mt-3 font-display font-semibold text-white">{g.title}</h3>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-ember-500 to-ember-400"
                  style={{ width: `${g.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <Link href="/coach" className="glass glass-hover p-5">
          <span className="text-2xl">🧠</span>
          <h3 className="mt-2 font-display font-semibold text-white">Talk to your coach</h3>
          <p className="mt-1 text-xs text-slate-500">Stuck or winning — either way, check in.</p>
        </Link>
        <Link href="/review" className="glass glass-hover p-5">
          <span className="text-2xl">🪞</span>
          <h3 className="mt-2 font-display font-semibold text-white">Weekly review</h3>
          <p className="mt-1 text-xs text-slate-500">An honest AI debrief of your week.</p>
        </Link>
        <Link href="/roadmap" className="glass glass-hover p-5">
          <span className="text-2xl">🗺️</span>
          <h3 className="mt-2 font-display font-semibold text-white">Build a roadmap</h3>
          <p className="mt-1 text-xs text-slate-500">Week-by-week plan to your goal.</p>
        </Link>
      </section>
    </div>
  );
}
