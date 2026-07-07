import { site, whatsappLink, mailtoLink } from "@/lib/site";

/* ----------------------------- shared UI ----------------------------- */

function CtaButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={whatsappLink()}
        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white shadow-card transition hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
      >
        Book a 10-minute demo
      </a>
      {!compact && (
        <a
          href="/demo"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] px-5 py-3 font-semibold text-[var(--text)] transition hover:border-brand-400"
        >
          Try the AI live →
        </a>
      )}
    </div>
  );
}

function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`py-16 sm:py-24 ${className}`}>
      <div className="container-page">{children}</div>
    </section>
  );
}

/* ------------------------------- nav -------------------------------- */

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
            N
          </span>
          <span>{site.name}</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--muted)] sm:flex">
          <a href="#how" className="hover:text-[var(--text)]">How it works</a>
          <a href="#pricing" className="hover:text-[var(--text)]">Pricing</a>
          <a href="#faq" className="hover:text-[var(--text)]">FAQ</a>
        </nav>
        <a
          href={whatsappLink()}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Book a demo
        </a>
      </div>
    </header>
  );
}

/* ------------------------------- hero ------------------------------- */

export function Hero() {
  return (
    <Section id="top" className="pt-14 sm:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <span className="inline-block rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
            For plumbers, electricians &amp; service businesses
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Stop losing jobs to whoever answers first.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
            {site.name} replies to every WhatsApp enquiry in seconds — day or
            night — qualifies it, quotes a ballpark, and books the job. Then it
            shows you the Rand you would have lost.
          </p>
          <div className="mt-8">
            <CtaButtons />
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Built in South Africa · Set up in a day · Cancel anytime
          </p>
        </div>

        {/* Chat mockup */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 border-b border-[var(--line)] pb-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
              N
            </span>
            <div>
              <div className="text-sm font-semibold">Your business · WhatsApp</div>
              <div className="text-xs text-brand-500">answering now</div>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <Bubble side="in">Hi, do you fix burst geysers? Mine is leaking 😩</Bubble>
            <Bubble side="in">It&apos;s 8pm, are you open?</Bubble>
            <Bubble side="out">
              Hi! Yes — we handle burst geysers, including after hours. Roughly
              where are you, and is it leaking now or fully burst?
            </Bubble>
            <Bubble side="in">Fully burst, Table View</Bubble>
            <Bubble side="out">
              Got it. A geyser replacement in Table View is usually R4,500–R7,000
              depending on the unit. I can book you for 8am tomorrow — shall I
              lock it in and send our plumber your address?
            </Bubble>
            <Bubble side="in">Yes please 🙏</Bubble>
          </div>
          <div className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            Lead captured · booked · ~R6,000 job you would have missed
          </div>
        </div>
      </div>
    </Section>
  );
}

function Bubble({ side, children }: { side: "in" | "out"; children: React.ReactNode }) {
  const isOut = side === "out";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
          isOut
            ? "bg-brand-500 text-white"
            : "bg-[var(--bg)] text-[var(--text)] border border-[var(--line)]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ proof ------------------------------- */

export function Proof() {
  const stats = [
    { n: "62%", l: "of calls to home-service businesses go unanswered" },
    { n: "R6,000+", l: "typical value of one captured job" },
    { n: "< 10s", l: "to reply, any time of day or night" },
  ];
  return (
    <Section className="border-y border-[var(--line)] bg-[var(--surface)]">
      <div className="grid gap-8 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-4xl font-extrabold text-brand-500">{s.n}</div>
            <p className="mt-2 text-[var(--muted)]">{s.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-[var(--muted)]">
        Every missed message is a job your competitor gets. NeverMiss makes sure
        you answer first.
      </p>
    </Section>
  );
}

/* --------------------------- how it works --------------------------- */

export function HowItWorks() {
  const steps = [
    {
      t: "Connect your WhatsApp",
      d: "Point your enquiry line at NeverMiss in a few minutes. No new app for your customers.",
    },
    {
      t: "It answers, quotes & books",
      d: "NeverMiss replies instantly in your voice, asks the right questions, gives a ballpark price, and books the slot — or hands a hot lead straight to you.",
    },
    {
      t: "You get a daily 'Rand captured' report",
      d: "Every morning: how many leads came in, how many were booked, and the money you would have lost.",
    },
  ];
  return (
    <Section id="how">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.t}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card"
          >
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-brand-500 font-bold text-white">
              {i + 1}
            </div>
            <h3 className="text-lg font-semibold">{s.t}</h3>
            <p className="mt-2 text-[var(--muted)]">{s.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------- ROI -------------------------------- */

export function Roi() {
  return (
    <Section className="bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          One saved job pays for a year.
        </h2>
        <p className="mt-4 text-lg text-[var(--muted)]">
          Miss one R6,000 geyser because you were on a roof and didn&apos;t see
          the message? That&apos;s more than a year of NeverMiss — gone in one
          unanswered WhatsApp. We make sure it never happens.
        </p>
        <div className="mt-8">
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            <a
              href={whatsappLink()}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-card transition hover:bg-brand-600"
            >
              Book a demo — watch it capture a lead live
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------- pricing ------------------------------ */

export function Pricing() {
  const tiers = [
    {
      name: "Done-for-you",
      price: "From R750/mo",
      tagline: "We run it for you",
      features: [
        "We set up and manage your AI front desk",
        "Perfect while you get started",
        "Weekly captured-revenue report",
      ],
      highlighted: false,
    },
    {
      name: "Core",
      price: "R499/mo",
      tagline: "Owner-operator",
      features: [
        "AI replies to every lead, 24/7",
        "Qualify, ballpark quote & book",
        "Daily 'Rand captured' report",
        "1 WhatsApp number",
      ],
      highlighted: true,
    },
    {
      name: "Pro",
      price: "R1,299/mo",
      tagline: "Small team",
      features: [
        "Everything in Core",
        "Multiple team members",
        "Calendar & quote ranges",
        "Priority support",
      ],
      highlighted: false,
    },
  ];
  return (
    <Section id="pricing">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple pricing. Priced against a job you can&apos;t afford to lose.
        </h2>
        <p className="mt-3 text-[var(--muted)]">14-day trial. No card up front.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-2xl border p-6 shadow-card ${
              t.highlighted
                ? "border-brand-400 bg-[var(--surface)] ring-2 ring-brand-400"
                : "border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            {t.highlighted && (
              <span className="mb-3 w-fit rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{t.name}</h3>
            <p className="text-sm text-[var(--muted)]">{t.tagline}</p>
            <div className="mt-4 text-3xl font-extrabold">{t.price}</div>
            <ul className="mt-5 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1 text-brand-500">✓</span>
                  <span className="text-[var(--muted)]">{f}</span>
                </li>
              ))}
            </ul>
            <a
              href={whatsappLink()}
              className={`mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition ${
                t.highlighted
                  ? "bg-brand-500 text-white hover:bg-brand-600"
                  : "border border-[var(--line)] hover:border-brand-400"
              }`}
            >
              Get started
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------- FAQ -------------------------------- */

export function Faq() {
  const qs = [
    {
      q: "Will it sound like a robot?",
      a: "No. NeverMiss replies in your business's voice and only handles the routine questions. Anything high-value or unusual is flagged straight to you.",
    },
    {
      q: "Do my customers need to install anything?",
      a: "No. They message your normal WhatsApp number like always. NeverMiss answers behind the scenes.",
    },
    {
      q: "Can I take over a conversation?",
      a: "Any time. You can jump into any chat, and you can set NeverMiss to draft replies for your approval instead of sending automatically.",
    },
    {
      q: "What does it cost to try?",
      a: "There's a 14-day trial with no card required, or we can run it for you as a managed service while you get going.",
    },
  ];
  return (
    <Section id="faq" className="bg-[var(--surface)] border-t border-[var(--line)]">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Questions</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {qs.map((item) => (
          <div key={item.q} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-5">
            <h3 className="font-semibold">{item.q}</h3>
            <p className="mt-2 text-[var(--muted)]">{item.a}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------ CTA band ---------------------------- */

export function CtaBand() {
  return (
    <Section className="bg-brand-600">
      <div className="mx-auto max-w-2xl text-center text-white">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Never miss another job.
        </h2>
        <p className="mt-3 text-brand-50">
          Book a 10-minute demo and we&apos;ll show NeverMiss capturing a real
          lead — live.
        </p>
        <div className="mt-7 flex justify-center">
          <a
            href={whatsappLink()}
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow-card transition hover:bg-brand-50"
          >
            Book a demo on WhatsApp
          </a>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------ footer ------------------------------ */

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-10">
      <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-[var(--muted)] sm:flex-row">
        <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
          <span className="grid h-6 w-6 place-items-center rounded bg-brand-500 text-xs text-white">
            N
          </span>
          {site.name}
        </div>
        <p>© {new Date().getFullYear()} {site.name}. Built in South Africa.</p>
        <a href={mailtoLink()} className="hover:text-[var(--text)]">
          {site.email}
        </a>
      </div>
    </footer>
  );
}
