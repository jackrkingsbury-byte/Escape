import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth";
import { MissionCard } from "@/components/missions/mission-card";
import { GenerateMissionsButton } from "@/components/missions/generate-button";
import type { Mission } from "@/lib/types";

export const metadata = { title: "Missions" };
export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const ctx = await getAuthedContext();
  if (!ctx) redirect("/login");
  const { supabase, user } = ctx;

  const { data: missions } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  const all = (missions ?? []) as Mission[];
  const active = all.filter((m) => m.status === "active");
  const weekly = active.filter((m) => m.cadence === "weekly");
  const daily = active.filter((m) => m.cadence === "daily");
  const history = all.filter((m) => m.status !== "active").slice(0, 20);

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Missions</h1>
          <p className="mt-1 text-sm text-slate-400">
            Concrete actions, generated from your goals. Complete them in the real world, log them here.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <GenerateMissionsButton />
          <GenerateMissionsButton cadence="weekly" />
        </div>
      </div>

      {weekly.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-purple-300">🐉 Weekly challenge</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {weekly.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-white">Active</h2>
        {daily.length === 0 ? (
          <div className="glass mt-3 p-8 text-center text-sm text-slate-400">
            Nothing active. Generate a fresh mission drop above. ⚡
          </div>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {daily.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-slate-400">History</h2>
          <div className="glass mt-3 divide-y divide-white/5">
            {history.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className={`truncate text-sm font-medium ${m.status === "completed" ? "text-slate-300" : "text-slate-500 line-through"}`}>
                    {m.status === "completed" ? "✓" : "✕"} {m.title}
                  </p>
                  <p className="text-xs text-slate-600">
                    {m.category} · {m.difficulty} · {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                {m.status === "completed" && (
                  <span className="shrink-0 text-xs font-semibold text-electric-400">+{m.xp_reward} XP</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
