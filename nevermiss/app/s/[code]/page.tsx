/**
 * Public store scorecard — /s/<code>.
 *
 * This is the page a store owner shares and a stranger lands on. Everything it
 * renders is rebuilt from the code in the URL, so the link works forever with
 * no database behind it, and the page can be statically rendered per code.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { daysSinceScan, scorecardFromCode, type Scorecard } from "@/lib/scorecard";
import { absoluteUrl } from "@/lib/site";
import { ShareRow } from "@/components/ShareRow";

export const dynamic = "force-static";
export const revalidate = false;

type Props = { params: { code: string } };

function scoreTone(score: number): { ring: string; text: string; chip: string } {
  if (score >= 80) return { ring: "#0fa063", text: "text-brand-600", chip: "bg-brand-50 text-brand-700" };
  if (score >= 60) return { ring: "#0a7f4f", text: "text-brand-700", chip: "bg-brand-50 text-brand-800" };
  if (score >= 45) return { ring: "#d97706", text: "text-amber-600", chip: "bg-amber-50 text-amber-700" };
  return { ring: "#dc2626", text: "text-red-600", chip: "bg-red-50 text-red-700" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = scorecardFromCode(params.code);
  if (!card) {
    return {
      title: "Store scorecard — StoreBrief",
      robots: { index: false, follow: false },
    };
  }
  const title = `${card.shopHost} scores ${card.score}/100`;
  const description = `${card.headline} ${card.topFix}`;
  const image = absoluteUrl(`/api/og?c=${encodeURIComponent(params.code)}`);

  return {
    title: `${title} — StoreBrief`,
    description,
    alternates: { canonical: absoluteUrl(`/s/${params.code}`) },
    openGraph: {
      title,
      description,
      type: "article",
      url: absoluteUrl(`/s/${params.code}`),
      images: [{ url: image, width: 1200, height: 630, alt: `${card.shopHost} scored ${card.score} out of 100` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

function ScoreRing({ card }: { card: Scorecard }) {
  const tone = scoreTone(card.score);
  const size = 168;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (card.score / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={`Score ${card.score} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(11,18,32,.09)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-5xl font-extrabold tabular-nums ${tone.text}`}>{card.score}</div>
        <div className="text-xs font-semibold uppercase tracking-widest text-ink-soft">out of 100</div>
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  points,
  max,
  verdict,
  explain,
}: {
  label: string;
  points: number;
  max: number;
  verdict: string;
  explain: string;
}) {
  const filled = max > 0 ? Math.round((points / max) * 100) : 0;
  return (
    <li className="border-t border-[var(--line)] py-4 first:border-t-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-semibold">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-ink-soft">
          {points}<span className="opacity-60">/{max}</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(11,18,32,.08)]">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${filled}%` }} />
      </div>
      <p className="mt-2 text-sm leading-relaxed">{verdict}</p>
      <p className="mt-1 text-xs text-ink-soft">{explain}</p>
    </li>
  );
}

export default function ScorecardPage({ params }: Props) {
  const card = scorecardFromCode(params.code);

  if (!card) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold">That scorecard link isn&apos;t readable.</h1>
        <p className="mt-3 text-ink-soft">
          It may have been cut short when it was copied. Scan your own store — it takes about five seconds.
        </p>
        <Link
          href="/storebrief.html#scan"
          className="mt-6 rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          Score my store free
        </Link>
      </main>
    );
  }

  const tone = scoreTone(card.score);
  const age = daysSinceScan(card.scannedDay);
  const shareUrl = absoluteUrl(`/s/${params.code}`);

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
      <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
        StoreBrief · Store Scorecard
      </p>

      <section className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card sm:p-9">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          <ScoreRing card={card} />
          <div className="min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${tone.chip}`}>
                Grade {card.grade}
              </span>
              <span className="truncate text-sm font-medium text-ink-soft">{card.shopHost}</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{card.headline}</h1>
            <p className="mt-2 text-ink-soft">{card.subhead}</p>
          </div>
        </div>

        <div className="mt-7 rounded-2xl bg-brand-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Do this first</p>
          <p className="mt-1.5 font-semibold leading-relaxed text-brand-900">{card.topFix}</p>
        </div>

        <ul className="mt-7">
          {card.categories.map((c) => (
            <CategoryRow
              key={c.key}
              label={c.label}
              points={c.points}
              max={c.max}
              verdict={c.verdict}
              explain={c.explain}
            />
          ))}
        </ul>

        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          Scored from {card.productCount} product{card.productCount === 1 ? "" : "s"} on the public
          storefront{age === 0 ? " today" : age === 1 ? " yesterday" : ` ${age} days ago`}. Every point
          above is arithmetic on what any visitor can see — no sales data, no login, nothing private.
        </p>
      </section>

      <ShareRow url={shareUrl} host={card.shopHost} score={card.score} />

      <section className="mt-10 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-card sm:p-8">
        <h2 className="text-xl font-extrabold">Score your own store</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">
          Paste your store link and get this same card in about five seconds. No signup, no install.
        </p>
        <Link
          href="/storebrief.html#scan"
          className="mt-5 inline-block rounded-full bg-brand-500 px-7 py-3.5 font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          Score my store free
        </Link>
      </section>
    </main>
  );
}
