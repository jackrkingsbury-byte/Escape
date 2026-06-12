"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function CoachChat({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [limitHit, setLimitHit] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || streaming) return;

    setInput("");
    setLimitHit(null);
    setMessages((prev) => [...prev, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setMessages((prev) => prev.slice(0, -1));
        setLimitHit(data.message ?? "Daily coach limit reached.");
        return;
      }
      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: "Connection hiccup — try again." };
          return next;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const current = acc;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: current };
          return next;
        });
      }
    } finally {
      setStreaming(false);
    }
  }

  const starters = [
    "I keep procrastinating — help",
    "Plan my evening for momentum",
    "I crushed today. What's next?",
  ];

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col lg:h-[calc(100vh-7rem)]">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="glass mx-auto mt-10 max-w-md p-8 text-center">
            <div className="text-4xl">🧠</div>
            <h2 className="mt-3 font-display text-xl font-semibold text-white">Your coach is online</h2>
            <p className="mt-2 text-sm text-slate-400">
              It knows your goals, streak and mission history. Say anything — or start with one of these:
            </p>
            <div className="mt-5 space-y-2">
              {starters.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="btn-ghost w-full !justify-start !text-left !text-xs"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
                m.role === "user"
                  ? "bg-gradient-to-r from-electric-600 to-electric-500 text-white shadow-glow-blue"
                  : "glass text-slate-200"
              }`}
            >
              {m.content || (
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-electric-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-electric-400 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-electric-400 [animation-delay:240ms]" />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {limitHit && (
        <div className="mb-3 rounded-xl border border-ember-500/30 bg-ember-500/10 px-4 py-3 text-sm text-ember-300">
          {limitHit}{" "}
          <Link href="/pricing" className="font-semibold underline">
            Go unlimited →
          </Link>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell your coach what's going on…"
          className="input-dark flex-1"
          maxLength={4000}
        />
        <button type="submit" disabled={streaming || !input.trim()} className="btn-primary shrink-0">
          {streaming ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
