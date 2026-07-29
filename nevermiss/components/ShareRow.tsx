"use client";

import { useState } from "react";

/**
 * The share row under a scorecard.
 *
 * This is the growth loop: a scanned store owner posts their score, someone
 * else sees the number, scans theirs. WhatsApp is first because that's where
 * South African business chat actually happens.
 */
export function ShareRow({ url, host, score }: { url: string; host: string; score: number }) {
  const [copied, setCopied] = useState(false);

  const brag =
    score >= 80
      ? `My store scored ${score}/100 on StoreBrief 💪`
      : `My store scored ${score}/100 on StoreBrief. Fixing it this week — what does yours get?`;
  const message = `${brag}\n${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Clipboard is blocked in some in-app browsers; the input below is the fallback.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const btn =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition";

  return (
    <section className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card">
      <h2 className="text-center text-base font-extrabold">Share this score</h2>
      <p className="mx-auto mt-1 max-w-sm text-center text-sm text-ink-soft">
        Post it and dare another store owner to beat it — {host} set the bar at {score}.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        <a
          className={`${btn} bg-[#25D366] text-white hover:brightness-95`}
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
        <a
          className={`${btn} bg-ink text-white hover:opacity-90`}
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(brag)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Post on X
        </a>
        <button type="button" onClick={copy} className={`${btn} bg-brand-500 text-white hover:bg-brand-600`}>
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>

      <label className="mt-5 block">
        <span className="sr-only">Your scorecard link</span>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-center text-sm text-ink-soft"
        />
      </label>
    </section>
  );
}

export default ShareRow;
