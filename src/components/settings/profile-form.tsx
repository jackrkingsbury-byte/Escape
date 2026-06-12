"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FOCUS_AREAS } from "@/lib/types";

interface Props {
  userId: string;
  fullName: string;
  focusAreas: string[];
  intensity: string;
}

export function ProfileForm({ userId, fullName, focusAreas, intensity }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(fullName);
  const [areas, setAreas] = useState<string[]>(focusAreas);
  const [level, setLevel] = useState(intensity);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleArea(id: string) {
    setAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }

  async function save() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ full_name: name.trim(), focus_areas: areas, intensity: level })
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    router.refresh();
  }

  return (
    <div className="glass p-6">
      <h2 className="font-display text-lg font-semibold text-white">Profile</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-dark mt-1.5" />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Focus areas (max 4)
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {FOCUS_AREAS.map((f) => {
              const active = areas.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleArea(f.id)}
                  className={`chip transition-all ${
                    active ? "!border-electric-500/60 !bg-electric-500/15 !text-electric-300" : "hover:border-white/25"
                  }`}
                >
                  {f.icon} {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Intensity</label>
          <div className="mt-2 flex gap-2">
            {(["chill", "standard", "hardcore"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setLevel(opt)}
                className={`chip capitalize transition-all ${
                  level === opt ? "!border-ember-500/60 !bg-ember-500/15 !text-ember-300" : "hover:border-white/25"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <button onClick={save} disabled={saving || areas.length === 0} className="btn-primary">
          {saved ? "Saved ✓" : saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
