"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function GenerateMissionsButton({
  cadence = "daily",
  label,
}: {
  cadence?: "daily" | "weekly";
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; upgrade: boolean } | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/missions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cadence }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError({
        message: data.message ?? "Generation failed — try again in a moment.",
        upgrade: res.status === 402,
      });
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className={cadence === "weekly" ? "btn-ember" : "btn-primary"}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Your AI is thinking…
          </>
        ) : (
          label ?? (cadence === "weekly" ? "🐉 Generate weekly challenge" : "⚡ Drop new missions")
        )}
      </button>
      {error && (
        <p className="mt-3 rounded-lg border border-ember-500/30 bg-ember-500/10 px-3 py-2 text-sm text-ember-300">
          {error.message}{" "}
          {error.upgrade && (
            <Link href="/pricing" className="font-semibold underline">
              Upgrade →
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
