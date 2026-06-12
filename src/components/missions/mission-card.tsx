"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Mission } from "@/lib/types";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  medium: "border-electric-500/30 bg-electric-500/10 text-electric-300",
  hard: "border-ember-500/30 bg-ember-500/10 text-ember-300",
  epic: "border-purple-500/30 bg-purple-500/10 text-purple-300",
};

export function MissionCard({ mission }: { mission: Mission }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done">(
    mission.status === "completed" ? "done" : "idle"
  );
  const [reward, setReward] = useState<{ xp: number; streak: number; unlocked: string[] } | null>(null);

  async function complete() {
    setState("loading");
    const res = await fetch("/api/missions/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: mission.id }),
    });
    if (!res.ok) {
      setState("idle");
      return;
    }
    const data = await res.json();
    setReward({ xp: data.xp_awarded, streak: data.streak, unlocked: data.unlocked ?? [] });
    setState("done");
    router.refresh();
  }

  const done = state === "done";

  return (
    <div
      className={`glass relative overflow-hidden p-5 transition-all duration-500 ${
        done ? "border-emerald-500/30 opacity-80" : "glass-hover"
      }`}
    >
      {mission.cadence === "weekly" && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
      )}
      <div className="flex items-start justify-between gap-3">
        <span className={`chip ${DIFFICULTY_STYLES[mission.difficulty]}`}>
          {mission.cadence === "weekly" ? "🐉 Weekly Challenge" : mission.difficulty}
        </span>
        <span className="shrink-0 text-sm font-bold text-electric-400">+{mission.xp_reward} XP</span>
      </div>

      <h3 className={`mt-3 font-display text-lg font-semibold ${done ? "text-slate-400 line-through" : "text-white"}`}>
        {mission.title}
      </h3>
      {mission.description && (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{mission.description}</p>
      )}
      {mission.why_it_matters && (
        <p className="mt-2 border-l-2 border-electric-500/40 pl-3 text-xs italic text-slate-500">
          {mission.why_it_matters}
        </p>
      )}

      <div className="mt-4">
        {done ? (
          reward ? (
            <div className="animate-level-pop rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300">
              ✓ +{reward.xp} XP earned · 🔥 {reward.streak}-day streak
              {reward.unlocked.length > 0 && (
                <span className="ml-2 text-ember-300">🏆 Achievement unlocked!</span>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300">
              ✓ Completed
            </div>
          )
        ) : (
          <button onClick={complete} disabled={state === "loading"} className="btn-primary w-full">
            {state === "loading" ? "Logging…" : "Mark complete"}
          </button>
        )}
      </div>
    </div>
  );
}
