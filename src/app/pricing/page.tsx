import Link from "next/link";
import { UpgradeButton } from "@/components/settings/billing-buttons";

export const metadata = { title: "Pricing" };

const FREE_FEATURES = [
  "2 AI mission drops per day",
  "10 AI coach messages per day",
  "XP, levels & streak tracking",
  "Core achievement badges",
  "Weekly AI review",
];

const PREMIUM_FEATURES = [
  "Unlimited AI missions",
  "Unlimited AI coaching",
  "Weekly epic challenges",
  "Custom AI roadmaps (4–26 weeks)",
  "Advanced analytics & insights",
  "Exclusive premium achievements",
  "Priority access to new features",
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Link href="/" className="mb-12 flex items-center justify-center gap-2 font-display text-xl font-bold">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-electric-500 to-electric-700 shadow-glow-blue">⚡</span>
        Life<span className="text-electric-400">OS</span>
      </Link>

      <h1 className="text-center font-display text-4xl font-bold text-white sm:text-5xl">
        Invest in the <span className="text-gradient">main character</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
        Free gets you moving. Premium removes every limit between you and momentum — for less than
        one coffee a week.
      </p>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="glass p-8">
          <h2 className="font-display text-xl font-semibold text-white">Free</h2>
          <p className="mt-1 text-sm text-slate-400">Build the habit.</p>
          <p className="mt-6 font-display text-4xl font-bold text-white">
            R0<span className="text-base font-medium text-slate-500">/forever</span>
          </p>
          <ul className="mt-8 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="mt-0.5 text-electric-400">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link href="/signup" className="btn-ghost mt-8 w-full">
            Start free
          </Link>
        </div>

        {/* Premium */}
        <div className="glass relative overflow-hidden border-ember-500/40 p-8 shadow-glow-ember">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ember-500/10 via-transparent to-electric-500/10" />
          <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-ember-600 to-ember-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Most popular
          </span>
          <h2 className="font-display text-xl font-semibold text-white">Premium</h2>
          <p className="mt-1 text-sm text-slate-400">Remove every limit.</p>
          <p className="mt-6 font-display text-4xl font-bold text-white">
            R99<span className="text-base font-medium text-slate-500">/month</span>
          </p>
          <p className="mt-1 text-xs text-ember-300">or R899/year — save 24%</p>
          <ul className="mt-8 space-y-3">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
                <span className="mt-0.5 text-ember-400">✦</span> {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 space-y-3">
            <UpgradeButton interval="monthly" className="btn-ember w-full">
              Go Premium — monthly
            </UpgradeButton>
            <UpgradeButton interval="yearly" className="btn-ghost w-full">
              Go Premium — yearly (save 27%)
            </UpgradeButton>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-slate-600">
        Cancel anytime from settings. Payments secured by Paystack.
      </p>
    </main>
  );
}
