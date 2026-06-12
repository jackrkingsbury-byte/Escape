"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FOCUS_AREAS } from "@/lib/types";

const INTENSITIES = [
  { id: "chill", icon: "🌊", label: "Chill", body: "Gentle, low-friction missions. Build the habit first." },
  { id: "standard", icon: "⚡", label: "Standard", body: "Real challenge, sustainable pace. The sweet spot." },
  { id: "hardcore", icon: "🔥", label: "Hardcore", body: "Genuinely demanding. For when you want the pressure." },
] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<"chill" | "standard" | "hardcore">("standard");
  const [goalTitle, setGoalTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleArea(id: string) {
    setAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }

  async function finish() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        focusAreas: areas,
        intensity,
        goal: { title: goalTitle.trim(), category: areas[0] },
      }),
    });
    if (!res.ok) {
      setError("Something went wrong — try again.");
      setLoading(false);
      return;
    }
    router.push("/dashboard?welcome=1");
    router.refresh();
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Progress dots */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-electric-500" : i < step ? "w-4 bg-electric-700" : "w-4 bg-white/10"
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="glass animate-fade-up p-8">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            What do you want to <span className="text-gradient">change</span>?
          </h1>
          <p className="mt-2 text-sm text-slate-400">Pick up to 4. Your missions are built around these.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {FOCUS_AREAS.map((f) => {
              const active = areas.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleArea(f.id)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                    active
                      ? "border-electric-500/60 bg-electric-500/10 shadow-glow-blue"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-sm font-medium text-slate-200">{f.label}</span>
                </button>
              );
            })}
          </div>
          <button
            disabled={areas.length === 0}
            onClick={() => setStep(1)}
            className="btn-primary mt-8 w-full"
          >
            Continue →
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="glass animate-fade-up p-8">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Choose your <span className="text-ember-400">intensity</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">You can change this anytime in settings.</p>
          <div className="mt-6 space-y-3">
            {INTENSITIES.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setIntensity(opt.id)}
                className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                  intensity === opt.id
                    ? "border-ember-500/60 bg-ember-500/10 shadow-glow-ember"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span>
                  <span className="block font-display font-semibold text-white">{opt.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-400">{opt.body}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-8 flex gap-3">
            <button onClick={() => setStep(0)} className="btn-ghost flex-1">← Back</button>
            <button onClick={() => setStep(2)} className="btn-primary flex-1">Continue →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass animate-fade-up p-8">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Name your <span className="text-gradient">first goal</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            One sentence. Specific beats grand: &ldquo;Hold a 5-minute conversation with someone new every week.&rdquo;
          </p>
          <textarea
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            rows={3}
            placeholder="In 12 weeks I want to…"
            className="input-dark mt-6 resize-none"
            maxLength={200}
          />
          {error && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <div className="mt-8 flex gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost flex-1">← Back</button>
            <button
              disabled={goalTitle.trim().length < 3 || loading}
              onClick={finish}
              className="btn-primary flex-1"
            >
              {loading ? "Building your OS…" : "Launch Life OS 🚀"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
