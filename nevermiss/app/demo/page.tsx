import Link from "next/link";
import TestAgent from "@/components/TestAgent";
import { site, whatsappLink } from "@/lib/site";

export const metadata = {
  title: `${site.name} — Try the AI live`,
  description: "See NeverMiss answer a customer enquiry in seconds.",
};

export default function DemoPage() {
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
            Live demo
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Message it like a customer would.
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            This is NeverMiss set up for an example plumbing business. Ask about a
            geyser, a blocked drain, a burst pipe — see how fast it answers,
            quotes, and tries to book you in.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <TestAgent endpoint="/api/demo" showDemoBadge={false} />
        </div>

        <div className="mx-auto mt-8 max-w-2xl text-center">
          <p className="text-[var(--muted)]">
            Imagine this answering <em>your</em> customers, 24/7, in your voice.
          </p>
          <a
            href={whatsappLink()}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-card transition hover:bg-brand-600"
          >
            Set this up for my business
          </a>
        </div>
      </main>
    </div>
  );
}
