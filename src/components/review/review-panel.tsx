"use client";

import { useState } from "react";
import type { WeeklyReviewContent } from "@/lib/types";

export function ReviewPanel({ existing }: { existing: WeeklyReviewContent | null }) {
  const [review, setReview] = useState<WeeklyReviewContent | null>(existing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/review", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setReview(data.review);
    } else {
      setError(data.message ?? "Couldn't generate your review — try again.");
    }
    setLoading(false);
  }

  if (!review) {
    return (
      <div className="glass mt-6 p-10 text-center">
        <div className="text-4xl">🪞</div>
        <h2 className="mt-3 font-display text-xl font-semibold text-white">Face the mirror</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
          Your AI reads this week&apos;s mission log and writes an honest debrief: real wins, real
          misses, and what to focus on next.
        </p>
        {error && (
          <p className="mx-auto mt-4 max-w-sm rounded-lg border border-ember-500/30 bg-ember-500/10 px-3 py-2 text-sm text-ember-300">
            {error}
          </p>
        )}
        <button onClick={generate} disabled={loading} className="btn-primary mt-6">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Reviewing your week…
            </>
          ) : (
            "Generate this week's review"
          )}
        </button>
      </div>
    );
  }

  const scoreColor =
    review.score >= 75 ? "text-emerald-400" : review.score >= 45 ? "text-electric-400" : "text-ember-400";

  return (
    <div className="mt-6 animate-fade-up space-y-5">
      <div className="glass flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={scoreColor}
              strokeDasharray={`${(review.score / 100) * 264} 264`}
            />
          </svg>
          <span className={`absolute font-display text-2xl font-bold ${scoreColor}`}>{review.score}</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{review.summary}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="glass p-6">
          <h3 className="font-display font-semibold text-emerald-400">✓ Wins</h3>
          <ul className="mt-3 space-y-2">
            {review.wins.map((w, i) => (
              <li key={i} className="text-sm text-slate-300">• {w}</li>
            ))}
          </ul>
        </div>
        <div className="glass p-6">
          <h3 className="font-display font-semibold text-ember-400">⚠ Struggles</h3>
          <ul className="mt-3 space-y-2">
            {review.struggles.map((s, i) => (
              <li key={i} className="text-sm text-slate-300">• {s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass border-electric-500/30 p-6">
        <h3 className="font-display font-semibold text-electric-300">🎯 Next week&apos;s focus</h3>
        <ul className="mt-3 space-y-2">
          {review.focus_next_week.map((f, i) => (
            <li key={i} className="text-sm text-slate-200">
              <span className="mr-2 font-bold text-electric-400">{i + 1}.</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
