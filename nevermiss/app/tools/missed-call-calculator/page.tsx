import Link from "next/link";
import MissedCallCalculator from "@/components/MissedCallCalculator";
import { site, whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Missed Call Cost Calculator — how much are missed calls costing your business?",
  description:
    "Free calculator for South African service businesses: see the Rand you lose every month to unanswered calls and messages.",
};

export default function CalculatorPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500 text-sm text-white">
              N
            </span>
            {site.name}
          </Link>
          <a
            href={whatsappLink()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Book a demo
          </a>
        </div>
      </header>

      <main className="container-page py-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
            Free tool
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            How much are missed calls costing you?
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Most service businesses miss more enquiries than they think — after
            hours, on the tools, on another call. Slide the numbers and see what
            it actually costs.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <MissedCallCalculator />
        </div>

        <div className="mx-auto mt-10 max-w-2xl text-center">
          <h2 className="text-xl font-bold">Now imagine catching those instead.</h2>
          <p className="mt-2 text-[var(--muted)]">
            {site.name} answers every enquiry in seconds — 24/7 — qualifies it,
            quotes a ballpark, and books the job.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-3 font-semibold transition hover:border-brand-400"
            >
              Try the AI live →
            </Link>
            <a
              href={whatsappLink()}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-card transition hover:bg-brand-600"
            >
              Stop the leak — book a demo
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
