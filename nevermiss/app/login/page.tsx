"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { site } from "@/lib/site";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus({
        kind: "error",
        message: "Sign-in isn't configured yet. Add your Supabase keys to enable it.",
      });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    setStatus({ kind: "sent" });
  }

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-card">
        <div className="mb-6 flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
            N
          </span>
          {site.name}
        </div>

        {status.kind === "sent" ? (
          <div>
            <h1 className="text-xl font-semibold">Check your email</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              We sent a magic sign-in link to <strong>{email}</strong>. Open it on
              this device to continue.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              We&apos;ll email you a magic link — no password needed.
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <label htmlFor="email" className="block text-sm font-medium">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.co.za"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20"
              />
              <button
                type="submit"
                disabled={status.kind === "sending"}
                className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {status.kind === "sending" ? "Sending…" : "Send magic link"}
              </button>
              {status.kind === "error" && (
                <p className="text-sm text-red-500">{status.message}</p>
              )}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
