import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth";
import { isPremium } from "@/lib/entitlements";
import { RoadmapBuilder } from "@/components/roadmap/roadmap-builder";
import type { RoadmapContent } from "@/lib/types";

export const metadata = { title: "Roadmap" };
export const dynamic = "force-dynamic";

interface RoadmapRow {
  id: string;
  title: string;
  horizon_weeks: number;
  content: RoadmapContent;
  created_at: string;
}

export default async function RoadmapPage() {
  const ctx = await getAuthedContext();
  if (!ctx) redirect("/login");
  const { supabase, user, profile } = ctx;

  const { data: roadmaps } = await supabase
    .from("roadmaps")
    .select("id, title, horizon_weeks, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <h1 className="font-display text-3xl font-bold text-white">Roadmaps</h1>
      <p className="mt-1 text-sm text-slate-400">
        Week-by-week plans where every milestone compounds on the last.
      </p>

      <RoadmapBuilder premium={isPremium(profile)} />

      {((roadmaps ?? []) as RoadmapRow[]).map((r) => (
        <section key={r.id} className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-white">{r.title}</h2>
            <span className="text-xs text-slate-500">{r.horizon_weeks} weeks</span>
          </div>
          <div className="mt-4 space-y-0">
            {r.content.milestones.map((m, i) => (
              <div key={i} className="relative pl-10 pb-8 last:pb-0">
                {/* Timeline spine */}
                {i < r.content.milestones.length - 1 && (
                  <span className="absolute left-[15px] top-8 h-full w-px bg-gradient-to-b from-electric-500/50 to-transparent" />
                )}
                <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-electric-500/40 bg-void-800 font-display text-xs font-bold text-electric-300 shadow-glow-blue">
                  {m.week}
                </span>
                <div className="glass p-5">
                  <h3 className="font-display font-semibold text-white">{m.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{m.description}</p>
                  {m.missions.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {m.missions.map((mission, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-slate-500">
                          <span className="mt-0.5 text-electric-400">▸</span>
                          {mission}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
