import Link from "next/link";
import { FOCUS_AREAS } from "@/lib/types";

const FEATURES = [
  {
    icon: "🎯",
    title: "AI Daily Missions",
    body: "Every morning, your AI drops concrete missions calibrated to your goals — not vague advice, real actions you can finish today.",
  },
  {
    icon: "🔥",
    title: "Streaks & XP",
    body: "Every completed mission earns XP. Daily action builds streaks with compounding bonuses. Miss a day and the flame dies.",
  },
  {
    icon: "🧠",
    title: "AI Life Coach",
    body: "An always-on coach that knows your goals, your streak and your history. Stuck? It shrinks the task until you can't say no.",
  },
  {
    icon: "🗺️",
    title: "Custom Roadmaps",
    body: "Tell it where you want to be in 12 weeks. Get a week-by-week plan where each milestone compounds on the last.",
  },
  {
    icon: "🪞",
    title: "AI Weekly Reviews",
    body: "Honest end-of-week debriefs: real wins, real misses, and at most three focus points for next week. No fluff.",
  },
  {
    icon: "🏆",
    title: "Achievements",
    body: "From First Blood to Perfect Week — badges that mark real milestones in your actual life, not just in an app.",
  },
];

const STEPS = [
  { n: "01", title: "Pick your outcomes", body: "Confidence, fitness, friends, money, discipline — choose what you actually want to change." },
  { n: "02", title: "Receive your missions", body: "AI generates daily missions and weekly challenges built around your goals and intensity." },
  { n: "03", title: "Execute & level up", body: "Complete missions, earn XP, protect the streak, unlock achievements — and watch real life change." },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-void-950/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric-500 to-electric-700 text-sm shadow-glow-blue">
              ⚡
            </span>
            Life<span className="text-electric-400">OS</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary !px-4 !py-2">
              Start free
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 pt-20 text-center sm:px-6 sm:pt-28">
        <div className="animate-fade-up">
          <span className="chip mb-6 border-electric-500/30 bg-electric-500/10 text-electric-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-electric-400" />
            Your life, gamified by AI
          </span>
        </div>
        <h1 className="animate-fade-up font-display text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl [animation-delay:80ms]">
          Stop drifting.
          <br />
          <span className="text-gradient">Start leveling up.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-slate-400 [animation-delay:160ms]">
          Life OS turns self-improvement into a game you actually want to play. AI-generated daily
          missions, XP, streaks and an always-on coach — pointed at your real life.
        </p>
        <div className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-4 sm:flex-row [animation-delay:240ms]">
          <Link href="/signup" className="btn-primary !px-8 !py-3.5 !text-base">
            Begin your first mission →
          </Link>
          <Link href="/pricing" className="btn-ghost !px-8 !py-3.5 !text-base">
            See Premium
          </Link>
        </div>

        {/* Hero mock: mission card */}
        <div className="mx-auto mt-16 max-w-lg animate-fade-up [animation-delay:320ms]">
          <div className="glass animate-pulse-glow p-6 text-left">
            <div className="flex items-center justify-between">
              <span className="chip border-ember-500/30 bg-ember-500/10 text-ember-300">⚡ Today&apos;s Mission</span>
              <span className="text-xs font-semibold text-electric-400">+25 XP</span>
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold text-white">
              Start a conversation with one stranger
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              While ordering coffee, ask one genuine question. Confidence is built in 30-second reps,
              not breakthroughs.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="animate-flame-flicker">🔥</span> 12-day streak protected
              </div>
              <span className="btn-primary !px-4 !py-1.5 !text-xs">Complete</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Outcomes strip ── */}
      <section className="border-y border-white/5 bg-void-900/50 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4">
          {FOCUS_AREAS.map((f) => (
            <span key={f.id} className="chip !px-4 !py-2 text-sm">
              {f.icon} {f.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold text-white sm:text-4xl">
          A complete operating system <span className="text-gradient">for your life</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
          Notion meets Habitica. Duolingo for life. Mission control for the person you&apos;re becoming.
        </p>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass glass-hover p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-electric-500/20 to-electric-700/20 text-xl">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="border-t border-white/5 bg-void-900/40 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold text-white sm:text-4xl">
            Three steps to <span className="text-ember-400">momentum</span>
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span className="font-display text-6xl font-bold text-white/5">{s.n}</span>
                <h3 className="-mt-6 font-display text-xl font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <div className="glass relative overflow-hidden p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-electric-500/10 via-transparent to-ember-500/10" />
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            The version of you at <span className="text-gradient">level 50</span> is waiting.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-slate-400">
            Free to start. Your first missions drop in under two minutes.
          </p>
          <Link href="/signup" className="btn-primary mt-8 !px-8 !py-3.5 !text-base">
            Create your account
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Life OS. Level up responsibly.</span>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-slate-300">Pricing</Link>
            <Link href="/login" className="hover:text-slate-300">Log in</Link>
            <Link href="/signup" className="hover:text-slate-300">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
