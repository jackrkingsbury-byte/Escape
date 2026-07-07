"use client";

import { useState } from "react";
import type { AgentResult, ConversationTurn } from "@/lib/agent/types";

type Msg = { role: "customer" | "business"; text: string; meta?: AgentResult };

/**
 * "Test the AI" — a live sandbox in the dashboard. Type what a customer
 * would send and watch NeverMiss reply, using your real business profile
 * (or a demo profile before onboarding). This is also your demo tool.
 */
export default function TestAgent() {
  const [input, setInput] = useState("");
  const [thread, setThread] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  async function send() {
    const message = input.trim();
    if (!message || loading) return;
    setError(null);
    setLoading(true);

    const history: ConversationTurn[] = thread.map((m) => ({ role: m.role, text: m.text }));
    const nextThread: Msg[] = [...thread, { role: "customer", text: message }];
    setThread(nextThread);
    setInput("");

    try {
      const res = await fetch("/api/agent/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const result = data.result as AgentResult;
      setDemo(Boolean(data.usingDemoProfile));
      setThread([...nextThread, { role: "business", text: result.reply_text, meta: result }]);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Test the AI</h2>
        {demo && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            Using demo profile — finish onboarding for your own
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Type a message like a customer would send. Watch NeverMiss reply.
      </p>

      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
        {thread.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            e.g. &ldquo;Hi, do you fix burst geysers? Mine&apos;s leaking&rdquo;
          </p>
        )}
        {thread.map((m, i) => (
          <div key={i} className={`flex ${m.role === "business" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "business"
                  ? "bg-brand-500 text-white"
                  : "border border-[var(--line)] bg-[var(--bg)]"
              }`}
            >
              {m.text || <em className="opacity-70">(no reply — flagged for you)</em>}
              {m.meta && (m.meta.needs_human || m.meta.estimated_value > 0) && (
                <div
                  className={`mt-1 text-xs ${
                    m.role === "business" ? "text-brand-50" : "text-[var(--muted)]"
                  }`}
                >
                  {m.meta.estimated_value > 0 && <>~R{m.meta.estimated_value.toLocaleString("en-ZA")} · </>}
                  {m.meta.needs_human ? "flagged for you" : m.meta.intent}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a customer message…"
          className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </section>
  );
}
