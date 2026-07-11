"use client";

import { useState } from "react";

export interface DraftItem {
  id: string;
  draft: string;
  customerMessage: string | null;
  note: string | null;
  when: string;
}

/**
 * "Waiting for you" — the approve-mode loop. Each card shows the customer's
 * message and the AI's drafted reply; the owner sends it with one tap or
 * dismisses it and replies themselves.
 */
export default function DraftInbox({ drafts }: { drafts: DraftItem[] }) {
  const [items, setItems] = useState(drafts);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function act(id: string, action: "approve" | "dismiss") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Waiting for you</h2>
        <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-bold text-white">
          {items.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">
        The AI drafted these replies — nothing sends until you approve it.
      </p>
      {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}

      <div className="mt-4 space-y-4">
        {items.map((d) => (
          <div key={d.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card">
            {d.customerMessage && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm">
                  {d.customerMessage}
                </div>
              </div>
            )}
            <div className="mt-2 flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-brand-500/15 px-3 py-2 text-sm">
                <span className="mb-1 block text-xs font-semibold text-brand-600">AI draft</span>
                {d.draft}
              </div>
            </div>
            {d.note && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                <span className="font-semibold">Why it&apos;s waiting:</span> {d.note}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--muted)]">{d.when}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => act(d.id, "dismiss")}
                  disabled={busy === d.id}
                  className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium transition hover:border-red-400 hover:text-red-500 disabled:opacity-60"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => act(d.id, "approve")}
                  disabled={busy === d.id}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {busy === d.id ? "…" : "Approve & send"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
