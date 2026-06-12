"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function RoadmapBuilder({ premium }: { premium: boolean }) {
  const router = useRouter();
  const [objective, setObjective] = useState("");
  const [weeks, setWeeks] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!premium) {
    return (
      <div className="glass relative mt-6 overflow-hidden p-10 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ember-500/10 via-transparent to-electric-500/10" />
        <div className="text-4xl">🗺️</div>
        <h2 className="mt-3 font-display text-xl font-semibold text-white">
          Custom roadmaps are a Premium feature
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
          Tell the AI where you want to be in 12 weeks and get a compounding, week-by-week plan with
          example missions for every milestone.
        </p>
        <Link href="/pricing" className="btn-ember mt-6">
          ✨ Unlock with Premium
        </Link>
      </div>
    );
  }

  async function build() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objective: objective.trim(), horizonWeeks: weeks }),
    });
    if (res.ok) {
      setObjective("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Roadmap generation failed — try again.");
    }
    setLoading(false);
  }

  return (
    <div className="glass mt-6 p-6">
      <h2 className="font-display text-lg font-semibold text-white">Build a new roadmap</h2>
      <textarea
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        rows={2}
        placeholder="Where do you want to be? e.g. “Run a 10k without stopping” or “Host a dinner party with 6 new friends”"
        className="input-dark mt-4 resize-none"
        maxLength={500}
      />
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 text-sm text-slate-400">
          Horizon
          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="input-dark !w-auto !py-1.5"
          >
            {[4, 8, 12, 16, 26].map((w) => (
              <option key={w} value={w}>{w} weeks</option>
            ))}
          </select>
        </label>
        <button
          onClick={build}
          disabled={loading || objective.trim().length < 3}
          className="btn-primary ml-auto"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Architecting…
            </>
          ) : (
            "Build roadmap"
          )}
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-lg border border-ember-500/30 bg-ember-500/10 px-3 py-2 text-sm text-ember-300">
          {error}
        </p>
      )}
    </div>
  );
}
