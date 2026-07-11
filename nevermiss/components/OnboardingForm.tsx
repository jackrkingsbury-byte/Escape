"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BusinessRow } from "@/lib/supabase/types";

/**
 * Self-serve onboarding: the owner tells NeverMiss everything the AI needs —
 * business basics, tone, hours, price list, house rules. Deliberately minimal:
 * only the fields the reply agent actually uses. Prices are free-form lines
 * ("Job name: R500 - R1500") so an owner can paste or thumb-type them.
 */

const VERTICALS = [
  "plumbing", "electrical", "HVAC / aircon", "mobile mechanic", "building / renovations",
  "salon / beauty", "cleaning", "moving", "catering", "photography", "other",
];

const TONES = [
  { v: "friendly, professional, down-to-earth", l: "Friendly & professional (recommended)" },
  { v: "formal and businesslike", l: "Formal" },
  { v: "casual and warm, like texting a mate", l: "Casual" },
];

type PriceLine = { item: string; range: string };

function parsePrices(text: string): PriceLine[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(":");
      return i > 0
        ? { item: line.slice(0, i).trim(), range: line.slice(i + 1).trim() }
        : { item: line, range: "" };
    });
}

function pricesToText(v: unknown): string {
  if (!Array.isArray(v)) return "";
  return (v as PriceLine[])
    .filter((p) => p && typeof p.item === "string")
    .map((p) => (p.range ? `${p.item}: ${p.range}` : p.item))
    .join("\n");
}

export default function OnboardingForm({
  userId,
  existing,
}: {
  userId: string;
  existing: BusinessRow | null;
}) {
  const router = useRouter();
  const hoursInit =
    existing?.hours && typeof existing.hours === "object" && "text" in (existing.hours as object)
      ? String((existing.hours as { text?: string }).text ?? "")
      : "";
  const notesInit = (() => {
    const f = existing?.faq;
    if (Array.isArray(f) && f[0] && typeof f[0] === "object" && "a" in (f[0] as object)) {
      return String((f[0] as { a?: string }).a ?? "");
    }
    return "";
  })();

  const [name, setName] = useState(existing?.name ?? "");
  const [vertical, setVertical] = useState(existing?.vertical ?? "plumbing");
  const [city, setCity] = useState(existing?.city ?? "");
  const [area, setArea] = useState(existing?.service_area ?? "");
  const [tone, setTone] = useState(existing?.tone ?? TONES[0].v);
  const [hours, setHours] = useState(hoursInit);
  const [prices, setPrices] = useState(pricesToText(existing?.price_ranges));
  const [notes, setNotes] = useState(notesInit);
  const [aiMode, setAiMode] = useState<"approve" | "auto">(existing?.ai_mode ?? "approve");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Give your business a name.");
    if (!parsePrices(prices).length)
      return setError("Add at least one service with a price range — the AI needs it to quote.");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("Supabase isn't configured.");

    setSaving(true);
    const payload = {
      owner_user_id: userId,
      name: name.trim(),
      vertical,
      city: city.trim() || null,
      service_area: area.trim() || null,
      tone,
      hours: { text: hours.trim() },
      price_ranges: parsePrices(prices),
      faq: notes.trim() ? [{ q: "house rules & notes", a: notes.trim() }] : [],
      ai_mode: aiMode,
    };

    // Hand-written Database generic over-narrows write types; cast for the mutation.
    const table = supabase.from("businesses") as unknown as {
      update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
      insert: (v: object) => Promise<{ error: { message: string } | null }>;
    };
    const { error: dbError } = existing
      ? await table.update(payload).eq("id", existing.id)
      : await table.insert(payload);

    setSaving(false);
    if (dbError) return setError(dbError.message);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <Section title="Your business" hint="Who is the AI answering for?">
        <Field label="Business name *">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sipho's Plumbing" className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trade">
            <select value={vertical ?? "plumbing"} onChange={(e) => setVertical(e.target.value)} className={inputCls}>
              {VERTICALS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="City / town">
            <input value={city ?? ""} onChange={(e) => setCity(e.target.value)} placeholder="Cape Town" className={inputCls} />
          </Field>
        </div>
        <Field label="Areas you cover">
          <input value={area ?? ""} onChange={(e) => setArea(e.target.value)} placeholder="Northern suburbs, Table View, Milnerton" className={inputCls} />
        </Field>
      </Section>

      <Section title="How it should talk" hint="The AI writes like you would.">
        <Field label="Tone">
          <select value={tone ?? TONES[0].v} onChange={(e) => setTone(e.target.value)} className={inputCls}>
            {TONES.map((t) => (
              <option key={t.v} value={t.v}>{t.l}</option>
            ))}
          </select>
        </Field>
        <Field label="Working hours">
          <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Mon–Fri 07:00–17:00, Sat mornings, 24/7 for emergencies" className={inputCls} />
        </Field>
      </Section>

      <Section
        title="Your prices *"
        hint="One per line — Job name: price range. Your top 10 jobs is plenty. The AI only quotes from this list, always as a range 'confirmed on site'. Anything not here gets no price and comes to you."
      >
        <textarea
          value={prices}
          onChange={(e) => setPrices(e.target.value)}
          rows={7}
          placeholder={"Geyser replacement (150L): R4,500 - R7,000\nBurst pipe repair: R850 - R2,500\nBlocked drain: R650 - R1,800"}
          className={inputCls + " font-mono text-sm"}
        />
      </Section>

      <Section title="House rules & notes" hint="Anything the AI should know or never do.">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder={"Call-out fee R350, waived if the job is booked.\nNo jobs in the CBD.\nAlways ask if it's a complex or a house."}
          className={inputCls}
        />
      </Section>

      <Section title="Safety" hint="How much freedom does the AI get?">
        <div className="space-y-3">
          <Radio
            checked={aiMode === "approve"}
            onChange={() => setAiMode("approve")}
            title="Approve mode (recommended to start)"
            desc="The AI drafts every reply — nothing sends until you tap approve."
          />
          <Radio
            checked={aiMode === "auto"}
            onChange={() => setAiMode("auto")}
            title="Auto mode"
            desc="The AI replies instantly on its own. Unusual or big jobs still come to you first."
          />
        </div>
      </Section>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
      >
        {saving ? "Saving…" : existing ? "Save changes" : "Finish setup →"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        You can change all of this later. Next: test the AI on your own business in the dashboard.
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20";

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Radio({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
        checked ? "border-brand-400 ring-2 ring-brand-400/40" : "border-[var(--line)]"
      }`}
    >
      <input type="radio" checked={checked} onChange={onChange} className="mt-1 accent-[#0fa063]" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-[var(--muted)]">{desc}</span>
      </span>
    </label>
  );
}
