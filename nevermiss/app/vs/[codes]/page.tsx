/**
 * Head-to-head scorecard — /vs/<you>.<them>.
 *
 * Both stores are read from their public storefronts, so this page shows
 * nothing either owner hasn't already published. It stays factual on purpose:
 * two scores and where the gap is, no jeering. The numbers are the story.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { versusFromCodes, type Versus } from "@/lib/scorecard";
import { absoluteUrl } from "@/lib/site";
import { ShareRow } from "@/components/ShareRow";

export const dynamic = "force-static";
export const revalidate = false;

type Props = { params: { codes: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vs = versusFromCodes(decodeURIComponent(params.codes));
  if (!vs) {
    return { title: "Head-to-head — StoreBrief", robots: { index: false, follow: false } };
  }
  const title = `${vs.you.shopHost} ${vs.you.score} — ${vs.them.score} ${vs.them.shopHost}`;
  const description = `${vs.headline} Both stores scored on their public storefronts: photos, descriptions, freshness, stock and range.`;
  const [a, b] = decodeURIComponent(params.codes).split(".");
  const image = absoluteUrl(`/api/og?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);

  return {
    title: `${title} — StoreBrief`,
    description,
    alternates: { canonical: absoluteUrl(`/vs/${params.codes}`) },
    openGraph: {
      title,
      description,
      type: "article",
      url: absoluteUrl(`/vs/${params.codes}`),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: { index: true, follow: true },
  };
}

function Side({
  host,
  score,
  grade,
  winning,
  align,
}: {
  host: string;
  score: number;
  grade: string;
  winning: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={`min-w-0 flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
      <div className={`text-5xl font-extrabold tabular-nums sm:text-6xl ${winning ? "text-brand-600" : "text-ink-soft"}`}>
        {score}
      </div>
      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-ink-soft sm:text-sm">
        Grade {grade}
      </div>
      <div className="mt-1 truncate text-xs font-medium sm:text-sm" title={host}>
        {host}
      </div>
    </div>
  );
}

function GapRow({ gap, vs }: { gap: Versus["gaps"][number]; vs: Versus }) {
  const diff = gap.you - gap.them;
  const youPct = gap.max > 0 ? (gap.you / gap.max) * 100 : 0;
  const themPct = gap.max > 0 ? (gap.them / gap.max) * 100 : 0;

  return (
    <li className="border-t border-[var(--line)] py-3.5 first:border-t-0">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold tabular-nums">{gap.you}</span>
        <span className="font-semibold">{gap.label}</span>
        <span className="font-semibold tabular-nums text-ink-soft">{gap.them}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-[rgba(11,18,32,.08)]">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${youPct}%` }} />
        </div>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(11,18,32,.08)]">
          <div className="h-full rounded-full bg-ink-soft opacity-60" style={{ width: `${themPct}%` }} />
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-ink-soft">
        {diff === 0
          ? "Level here."
          : diff > 0
            ? `You lead by ${diff} on ${gap.label.toLowerCase()}.`
            : `${vs.them.shopHost} leads by ${-diff} on ${gap.label.toLowerCase()}.`}
      </p>
    </li>
  );
}

export default function VersusPage({ params }: Props) {
  const codes = decodeURIComponent(params.codes);
  const vs = versusFromCodes(codes);

  if (!vs) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold">That comparison link isn&apos;t readable.</h1>
        <p className="mt-3 text-ink-soft">
          It may have been cut short when it was copied. Run the comparison again — it takes about ten seconds.
        </p>
        <Link
          href="/storebrief.html#scan"
          className="mt-6 rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          Compare my store free
        </Link>
      </main>
    );
  }

  const shareUrl = absoluteUrl(`/vs/${encodeURIComponent(codes)}`);
  const behind = vs.lead < 0;
  const biggest = vs.gaps[0];

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
      <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
        StoreBrief · Head-to-head
      </p>

      <section className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card sm:p-9">
        <div className="flex items-start gap-3 sm:gap-4">
          <Side host={vs.you.shopHost} score={vs.you.score} grade={vs.you.grade} winning={vs.lead >= 0} align="left" />
          <div className="shrink-0 pt-4 text-sm font-bold uppercase tracking-widest text-ink-soft">vs</div>
          <Side host={vs.them.shopHost} score={vs.them.score} grade={vs.them.grade} winning={vs.lead <= 0} align="right" />
        </div>

        <h1 className="mt-7 break-words text-center text-2xl font-extrabold leading-tight sm:text-3xl">
          {vs.headline}
        </h1>

        <div className="mt-6 rounded-2xl bg-brand-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
            {behind ? "Close the gap here first" : "Where you win"}
          </p>
          <p className="mt-1.5 font-semibold leading-relaxed text-brand-900">
            {biggest && biggest.you !== biggest.them
              ? `${biggest.label}: ${biggest.you} vs ${biggest.them}. ${behind ? vs.you.topFix : "Hold it — it's the biggest single gap between the two stores."}`
              : vs.you.topFix}
          </p>
        </div>

        <ul className="mt-7">
          {vs.gaps.map((g) => (
            <GapRow key={g.label} gap={g} vs={vs} />
          ))}
        </ul>

        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          Both stores are scored the same way, from their public storefronts —
          the pages any shopper can already load. No sales figures, no private data, nothing either
          owner hasn&apos;t published.
        </p>
      </section>

      <ShareRow url={shareUrl} host={vs.you.shopHost} score={vs.you.score} versus={vs.them.shopHost} versusScore={vs.them.score} />

      <section className="mt-10 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-card sm:p-8">
        <h2 className="text-xl font-extrabold">See how your store compares</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">
          Paste your link and a rival&apos;s. Both get scored in about ten seconds. No signup, no install.
        </p>
        <Link
          href="/storebrief.html#scan"
          className="mt-5 inline-block rounded-full bg-brand-500 px-7 py-3.5 font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          Compare my store free
        </Link>
      </section>
    </main>
  );
}
