"use client";

import { useMemo, useState } from "react";

function rand(n: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Missed Call Cost Calculator — engineering-as-marketing.
 * A business owner enters three numbers and sees the Rand they lose to
 * unanswered enquiries. Pure client-side math; funnels to the live demo.
 */
export default function MissedCallCalculator() {
  const [missedPerWeek, setMissedPerWeek] = useState(5);
  const [closeRate, setCloseRate] = useState(30);
  const [jobValue, setJobValue] = useState(2500);

  const { monthly, yearly } = useMemo(() => {
    const perMonth = missedPerWeek * 4.33 * (closeRate / 100) * jobValue;
    return { monthly: perMonth, yearly: perMonth * 12 };
  }, [missedPerWeek, closeRate, jobValue]);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card sm:p-8">
      <div className="grid gap-6 sm:grid-cols-3">
        <Field
          label="Enquiries you miss per week"
          hint="Calls + messages you never answer or answer too late"
          value={missedPerWeek}
          min={1}
          max={50}
          step={1}
          onChange={setMissedPerWeek}
          format={(v) => `${v}`}
        />
        <Field
          label="How many would have booked"
          hint="Be conservative — even 2 in 10 counts"
          value={closeRate}
          min={5}
          max={80}
          step={5}
          onChange={setCloseRate}
          format={(v) => `${v}%`}
        />
        <Field
          label="Average job value"
          hint="A geyser swap is R4,500+; a small repair R850"
          value={jobValue}
          min={250}
          max={20000}
          step={250}
          onChange={setJobValue}
          format={(v) => rand(v)}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ResultCard label="You're losing every month" value={rand(monthly)} />
        <ResultCard label="That's every year" value={rand(yearly)} emphasize />
      </div>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Based on your numbers: {missedPerWeek} missed enquiries a week ×{" "}
        {closeRate}% that would have booked × {rand(jobValue)} per job.
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      <span className="mt-0.5 block text-xs text-[var(--muted)]">{hint}</span>
      <div className="mt-3 text-2xl font-extrabold text-brand-500">{format(value)}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#0fa063]"
        aria-label={label}
      />
    </label>
  );
}

function ResultCard({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 text-center ${
        emphasize
          ? "bg-brand-600 text-white"
          : "border border-[var(--line)] bg-[var(--bg)]"
      }`}
    >
      <div className={`text-sm font-semibold ${emphasize ? "text-brand-50" : "text-[var(--muted)]"}`}>
        {label}
      </div>
      <div className="mt-1 text-4xl font-extrabold">{value}</div>
    </div>
  );
}
