import { site, whatsappLink, mailtoLink } from "@/lib/site";

/* ----------------------------- primitives ----------------------------- */

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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
      {children}
    </span>
  );
}

function PrimaryCta({ children = "Book a 10-minute demo" }: { children?: React.ReactNode }) {
  return (
    <a
      href={whatsappLink()}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white shadow-card transition hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
    >
      {children}
    </a>
  );
}

function DemoCta({ children = "Try the AI live" }: { children?: React.ReactNode }) {
  return (
    <a
      href="/demo"
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3 font-semibold text-[var(--text)] transition hover:border-brand-400"
    >
      {children} <span aria-hidden>→</span>
    </a>
  );
}

/* -------------------------------- icons -------------------------------- */

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d={path} />
    </svg>
  );
}
const I = {
  bolt: "M13 2 3 14h7l-1 8 10-12h-7l1-8Z",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  clock: "M12 6v6l4 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
  money: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
};

/* ------------------------------- nav ---------------------------------- */

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">N</span>
          <span>{site.name}</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--muted)] md:flex">
          <a href="#how" className="hover:text-[var(--text)]">How it works</a>
          <a href="#compare" className="hover:text-[var(--text)]">Why it works</a>
          <a href="#pricing" className="hover:text-[var(--text)]">Pricing</a>
          <a href="#faq" className="hover:text-[var(--text)]">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] sm:block">
            Sign in
          </a>
          <a href="/demo" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text)] hover:text-brand-600 sm:block">
            Try it live
          </a>
          <a href={whatsappLink()} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">
            Book a demo
          </a>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------- hero --------------------------------- */

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
      <Section id="top" className="relative pt-14 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Badge>
              <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-[10px] text-white">✓</span>
              For plumbers, electricians &amp; service businesses
            </Badge>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-5xl lg:text-6xl">
              Stop losing jobs to <span className="text-gradient">whoever answers first.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
              {site.name} replies to every WhatsApp enquiry in seconds — day or
              night — qualifies it, quotes a ballpark, and books the job. Then it
              shows you the Rand you would have lost.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryCta />
              <DemoCta />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
              <span className="inline-flex items-center gap-2"><span className="text-brand-500"><Icon path={I.check} /></span> Set up in a day</span>
              <span className="inline-flex items-center gap-2"><span className="text-brand-500"><Icon path={I.check} /></span> Works on your normal WhatsApp</span>
              <span className="inline-flex items-center gap-2"><span className="text-brand-500"><Icon path={I.check} /></span> Cancel anytime</span>
            </div>
          </div>

          <ChatMock />
        </div>
      </Section>
    </div>
  );
}

function ChatMock() {
  return (
    <div className="animate-floaty rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2 border-b border-[var(--line)] pb-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">N</span>
        <div>
          <div className="text-sm font-semibold">Your business · WhatsApp</div>
          <div className="flex items-center gap-1 text-xs text-brand-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" /> answering now
          </div>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <Bubble side="in">Hi, do you fix burst geysers? Mine is leaking 😩</Bubble>
        <Bubble side="in">It&apos;s 8pm, are you open?</Bubble>
        <Bubble side="out">Hi! Yes — we handle burst geysers, including after hours. Roughly where are you, and is it leaking now or fully burst?</Bubble>
        <Bubble side="in">Fully burst, Table View</Bubble>
        <Bubble side="out">Got it. A geyser replacement in Table View is usually R4,500–R7,000 depending on the unit. I can book you for 8am tomorrow — shall I lock it in?</Bubble>
        <Bubble side="in">Yes please 🙏</Bubble>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
        <span><Icon path={I.money} /></span> Lead captured · booked · ~R6,000 job you would have missed
      </div>
    </div>
  );
}

function Bubble({ side, children }: { side: "in" | "out"; children: React.ReactNode }) {
  const isOut = side === "out";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${isOut ? "bg-brand-500 text-white" : "border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]"}`}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ proof --------------------------------- */

export function Proof() {
  const stats = [
    { n: "62%", l: "of calls to home-service businesses go unanswered", icon: I.chat },
    { n: "R6,000+", l: "typical value of one captured job", icon: I.money },
    { n: "< 10s", l: "to reply, any time of day or night", icon: I.bolt },
  ];
  return (
    <Section className="border-y border-[var(--line)] bg-[var(--surface)]">
      <div className="grid gap-8 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
              <Icon path={s.icon} />
            </div>
            <div className="text-4xl font-extrabold text-brand-500">{s.n}</div>
            <p className="mt-2 text-[var(--muted)]">{s.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-[var(--muted)]">
        Every missed message is a job your competitor gets. {site.name} makes sure you answer first.
      </p>
    </Section>
  );
}

/* ----------------------------- problem -------------------------------- */

export function Problem() {
  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <Badge>The hidden leak</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            You&apos;re on the tools. The messages pile up. The jobs walk.
          </h2>
          <p className="mt-4 text-lg text-[var(--muted)]">
            You can&apos;t answer WhatsApp with your hands in a geyser. By the time
            you check, the customer already booked whoever replied first. That&apos;s
            not a small leak — it&apos;s your best jobs, gone silently, every week.
          </p>
          <div className="mt-6">
            <DemoCta>See how fast it answers</DemoCta>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card">
          <div className="text-sm font-semibold text-[var(--muted)]">A normal week without NeverMiss</div>
          <ul className="mt-4 space-y-3">
            {[
              "9pm burst-geyser lead — seen at 7am, already booked elsewhere",
              "Saturday enquiry — replied Monday, gone cold",
              "3 quotes you meant to send, never did",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[var(--muted)]">
                <span className="mt-0.5 text-red-500"><Icon path={I.x} /></span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
            Easily R10,000+ in lost work — in one quiet week.
          </div>
          <a
            href="/tools/missed-call-calculator"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
          >
            Work out your own number with the free calculator <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </Section>
  );
}

/* --------------------------- how it works ----------------------------- */

export function HowItWorks() {
  const steps = [
    { icon: I.chat, t: "Connect your WhatsApp", d: "Point your enquiry line at NeverMiss in minutes. No new app for your customers — they message you like always." },
    { icon: I.bolt, t: "It answers, quotes & books", d: "NeverMiss replies instantly in your voice, asks the right questions, gives a ballpark, and books the slot — or hands a hot lead to you." },
    { icon: I.money, t: "You see the Rand captured", d: "Every morning: how many leads came in, how many booked, and the money you would have lost." },
  ];
  return (
    <Section id="how">
      <div className="max-w-2xl">
        <Badge>How it works</Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Answering, done for you.</h2>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.t} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-white"><Icon path={s.icon} /></span>
              <span className="text-3xl font-extrabold text-[var(--line)]">{i + 1}</span>
            </div>
            <h3 className="text-lg font-semibold">{s.t}</h3>
            <p className="mt-2 text-[var(--muted)]">{s.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------------------- comparison ------------------------------ */

export function Comparison() {
  const rows = [
    ["After-hours enquiries", "Missed until morning", "Answered in seconds"],
    ["Reply speed", "Hours — if at all", "Instant, 24/7"],
    ["Quoting", "When you get to it", "Ballpark on the spot"],
    ["Follow-up", "Easy to forget", "Automatic"],
    ["Your evenings", "Buried in WhatsApp", "Yours again"],
  ];
  return (
    <Section id="compare" className="bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="max-w-2xl">
        <Badge>Why it works</Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">You, but you never miss.</h2>
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-sm text-[var(--muted)]">
              <th className="p-4"></th>
              <th className="p-4 font-semibold">On your own</th>
              <th className="rounded-t-xl bg-brand-50 p-4 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">With {site.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, without, wth], i) => (
              <tr key={label} className="align-top">
                <td className="border-t border-[var(--line)] p-4 font-medium">{label}</td>
                <td className="border-t border-[var(--line)] p-4 text-[var(--muted)]">
                  <span className="mr-2 inline-block align-middle text-red-500"><Icon path={I.x} /></span>{without}
                </td>
                <td className={`border-t border-[var(--line)] bg-brand-50/60 p-4 font-medium dark:bg-brand-900/20 ${i === rows.length - 1 ? "rounded-b-xl" : ""}`}>
                  <span className="mr-2 inline-block align-middle text-brand-500"><Icon path={I.check} /></span>{wth}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ---------------------------- demo band ------------------------------- */

export function DemoBand() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-card sm:p-12">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr_.8fr]">
          <div>
            <Badge>Live demo</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Don&apos;t take our word for it — <span className="text-gradient">message it yourself.</span>
            </h2>
            <p className="mt-3 max-w-lg text-[var(--muted)]">
              Ask it about a burst geyser or a blocked drain and watch how fast it
              answers, quotes, and books. Same thing it&apos;ll do for your customers.
            </p>
            <div className="mt-6"><DemoCta>Open the live demo</DemoCta></div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <Bubble side="in">How much to unblock a drain?</Bubble>
            <div className="mt-3">
              <Bubble side="out">Usually R650–R1,800 depending on the blockage — we confirm on site. Where are you, and when suits you?</Bubble>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------- pricing -------------------------------- */

export function Pricing() {
  const tiers = [
    {
      name: "Done-for-you",
      price: "From R750",
      per: "/mo",
      tagline: "We run it for you",
      features: ["We set up & manage your AI front desk", "Perfect while you get started", "Weekly captured-revenue report"],
      highlighted: false,
      buyMessage:
        "Hi! I want the Done-for-you plan (from R750/month) — please set NeverMiss up for my business. My business is: ",
    },
    {
      name: "Core",
      price: "R499",
      per: "/mo",
      tagline: "Owner-operator",
      features: ["AI replies to every lead, 24/7", "Qualify, ballpark quote & book", "Daily 'Rand captured' report", "1 WhatsApp number"],
      highlighted: true,
      buyMessage:
        "Hi! I want to start the Core plan (R499/month) for my business. My business is: ",
    },
    {
      name: "Pro",
      price: "R1,299",
      per: "/mo",
      tagline: "Small team",
      features: ["Everything in Core", "Multiple team members", "Calendar & quote ranges", "Priority support"],
      highlighted: false,
      buyMessage:
        "Hi! I'm interested in the Pro plan (R1,299/month) for my team. My business is: ",
    },
  ];
  return (
    <Section id="pricing">
      <div className="text-center">
        <Badge>Pricing</Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Priced against a job you can&apos;t afford to lose.</h2>
        <p className="mt-3 text-[var(--muted)]">14-day trial. No card up front. One captured job pays for months.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.name} className={`relative flex flex-col rounded-2xl border p-6 shadow-card ${t.highlighted ? "border-brand-400 bg-[var(--surface)] ring-2 ring-brand-400" : "border-[var(--line)] bg-[var(--surface)]"}`}>
            {t.highlighted && <span className="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">Most popular</span>}
            <h3 className="text-lg font-semibold">{t.name}</h3>
            <p className="text-sm text-[var(--muted)]">{t.tagline}</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-extrabold">{t.price}</span>
              <span className="mb-1 text-[var(--muted)]">{t.per}</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-500"><Icon path={I.check} /></span>
                  <span className="text-[var(--muted)]">{f}</span>
                </li>
              ))}
            </ul>
            <a href={whatsappLink(t.buyMessage)} className={`mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition ${t.highlighted ? "bg-brand-500 text-white hover:bg-brand-600" : "border border-[var(--line)] hover:border-brand-400"}`}>
              Get started — {t.price}{t.per}
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------- FAQ ---------------------------------- */

export function Faq() {
  const qs = [
    { q: "Will it sound like a robot?", a: "No. NeverMiss replies in your business's voice and only handles routine questions. Anything high-value or unusual is flagged straight to you." },
    { q: "Do my customers need to install anything?", a: "No. They message your normal WhatsApp number like always. NeverMiss answers behind the scenes." },
    { q: "Can I take over a conversation?", a: "Any time. You can jump into any chat, and you can set NeverMiss to draft replies for your approval instead of sending automatically." },
    { q: "What does it cost to try?", a: "A 14-day trial with no card required, or we run it for you as a managed service while you get going." },
    { q: "Is it built for South Africa?", a: "Yes — Rands, local pricing, and WhatsApp-first, because that's where your customers already are." },
  ];
  return (
    <Section id="faq" className="bg-[var(--surface)] border-t border-[var(--line)]">
      <div className="max-w-2xl">
        <Badge>Questions</Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Good questions, straight answers.</h2>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {qs.map((item) => (
          <details key={item.q} className="group rounded-xl border border-[var(--line)] bg-[var(--bg)] p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              {item.q}
              <span className="text-brand-500 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-[var(--muted)]">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------ CTA band ------------------------------ */

export function CtaBand() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-14 text-center text-white">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Never miss another job.</h2>
          <p className="mt-3 text-brand-50">Book a 10-minute demo and we&apos;ll show NeverMiss capturing a real lead — live.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={whatsappLink()} className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow-card transition hover:bg-brand-50">
              Book a demo on WhatsApp
            </a>
            <a href="/demo" className="inline-flex items-center justify-center rounded-xl border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
              Try it live →
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------- trades bar ----------------------------- */

export function TradesBar() {
  const trades = ["Plumbers", "Electricians", "HVAC", "Mobile mechanics", "Movers", "Roofers", "Handymen"];
  return (
    <div className="border-b border-[var(--line)] bg-[var(--bg)] py-6">
      <div className="container-page">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Built for South African service businesses
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[var(--muted)]">
          {trades.map((t) => (
            <span key={t} className="text-sm font-semibold">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- guarantee ------------------------------- */

export function Guarantee() {
  return (
    <Section>
      <div className="mx-auto max-w-3xl rounded-3xl border border-brand-200 bg-brand-50 p-8 text-center dark:border-brand-800 dark:bg-brand-900/30 sm:p-12">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-white">
          <Icon path={I.check} />
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
          If it doesn&apos;t catch you a job, you don&apos;t pay.
        </h2>
        <p className="mt-3 text-[var(--muted)]">
          Try {site.name} for your first month. If it doesn&apos;t catch you at
          least one job you&apos;d have missed, month two is on us. All the upside,
          none of the risk.
        </p>
        <div className="mt-6 flex justify-center"><PrimaryCta>Start risk-free</PrimaryCta></div>
      </div>
    </Section>
  );
}

/* --------------------------- founder note ----------------------------- */

export function FounderNote() {
  return (
    <Section className="bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-lg font-bold text-white">N</div>
        <blockquote className="mt-5 text-xl font-medium leading-relaxed">
          &ldquo;Every tradesperson I spoke to had the same story — a big job that
          got away because they were on the tools and missed the message. {site.name}
          exists so that never happens to you again.&rdquo;
        </blockquote>
        <p className="mt-4 text-sm font-semibold text-[var(--muted)]">— The {site.name} team, South Africa</p>
      </div>
    </Section>
  );
}

/* ------------------------- sticky mobile CTA -------------------------- */

export function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--bg)]/95 p-3 backdrop-blur sm:hidden">
      <div className="flex gap-2">
        <a href="/demo" className="flex-1 rounded-xl border border-[var(--line)] px-4 py-3 text-center font-semibold">
          Try it live
        </a>
        <a href={whatsappLink()} className="flex-1 rounded-xl bg-brand-500 px-4 py-3 text-center font-semibold text-white">
          Book a demo
        </a>
      </div>
    </div>
  );
}

/* ------------------------------ footer -------------------------------- */

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-10">
      <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-[var(--muted)] sm:flex-row">
        <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
          <span className="grid h-6 w-6 place-items-center rounded bg-brand-500 text-xs text-white">N</span>
          {site.name}
        </div>
        <p>© {new Date().getFullYear()} {site.name}. Built in South Africa.</p>
        <div className="flex items-center gap-4">
          <a href="/tools/missed-call-calculator" className="hover:text-[var(--text)]">
            Missed-call calculator
          </a>
          <a href="/login" className="hover:text-[var(--text)]">Sign in</a>
          <a href={mailtoLink()} className="hover:text-[var(--text)]">{site.email}</a>
        </div>
      </div>
    </footer>
  );
}
