/**
 * Store Scorecard — the shareable half of the public storefront scan.
 *
 * The scan (lib/storescan.ts) tells one owner what to fix. The scorecard turns
 * that same read into something they'd actually post: a score out of 100, a
 * grade, and a link that unfurls with the number in it.
 *
 * Two rules carried over from the brief engine:
 *  1. Numbers live in code. Every point is derived from the storefront, never
 *     guessed, and `explain` states the arithmetic behind it.
 *  2. The share code carries *facts*, not prose. Wording is re-derived on
 *     render, so a link made today still reads in today's voice — and stays
 *     short enough to paste into WhatsApp.
 */

import type { PublicProduct } from "./storescan";

export const THIN_DESCRIPTION_WORDS = 30;

export type CategoryKey = "photos" | "descriptions" | "freshness" | "stock" | "range";

export interface ScoreCategory {
  key: CategoryKey;
  label: string;
  points: number;
  max: number;
  /** One plain-English line an owner can act on. */
  verdict: string;
  /** The arithmetic, so the score is never a black box. */
  explain: string;
}

/** The raw storefront readings a scorecard is rebuilt from. */
export interface StoreFacts {
  shopHost: string;
  /** Products live on the storefront. */
  total: number;
  /** Products with at least one photo. */
  withImage: number;
  /** Products with two or more photos. */
  withMultiImage: number;
  /** Products whose description clears THIN_DESCRIPTION_WORDS. */
  withGoodDescription: number;
  /** Products with at least one buyable variant. */
  inStock: number;
  /** Days since the newest product went live; null when undatable. */
  newestDays: number | null;
  /** Whole days since the Unix epoch — when the scan ran. */
  scannedDay: number;
}

export interface Scorecard {
  shopHost: string;
  score: number;
  grade: string;
  /** The feeling, not the feature — what this score means for them. */
  headline: string;
  subhead: string;
  productCount: number;
  categories: ScoreCategory[];
  /** The single highest-leverage next move. */
  topFix: string;
  /** Days since the scan; 0 = today. */
  scannedDay: number;
}

const MAX_POINTS: Record<CategoryKey, number> = {
  photos: 30,
  descriptions: 25,
  freshness: 20,
  stock: 15,
  range: 10,
};

const EPOCH_DAY_MS = 86_400_000;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

/** Read a storefront's public product list into the facts a score is built on. */
export function readFacts(
  products: PublicProduct[],
  shopHost: string,
  now: Date = new Date(),
): StoreFacts {
  let withImage = 0;
  let withMultiImage = 0;
  let withGoodDescription = 0;
  let inStock = 0;
  let newestMs: number | null = null;

  for (const p of products) {
    const images = p.images ?? [];
    if (images.length >= 1) withImage++;
    if (images.length >= 2) withMultiImage++;

    const words = stripHtml(p.body_html ?? "").split(" ").filter(Boolean).length;
    if (words >= THIN_DESCRIPTION_WORDS) withGoodDescription++;

    if ((p.variants ?? []).some((v) => v.available)) inStock++;

    const created = Date.parse(p.published_at ?? p.created_at ?? "");
    if (Number.isFinite(created)) {
      newestMs = newestMs === null ? created : Math.max(newestMs, created);
    }
  }

  return {
    shopHost,
    total: products.length,
    withImage,
    withMultiImage,
    withGoodDescription,
    inStock,
    newestDays:
      newestMs === null
        ? null
        : Math.max(0, Math.floor((now.getTime() - newestMs) / EPOCH_DAY_MS)),
    scannedDay: Math.floor(now.getTime() / EPOCH_DAY_MS),
  };
}

function photosCategory(f: StoreFacts): ScoreCategory {
  const max = MAX_POINTS.photos;
  if (f.total === 0) {
    return {
      key: "photos",
      label: "Photos",
      points: 0,
      max,
      verdict: "No products live, so there's nothing to photograph yet.",
      explain: "0 products on the storefront.",
    };
  }
  // A photo is the price of entry (24); a second angle is what closes (6).
  const bare = f.total - f.withImage;
  const primary = Math.round(24 * (f.withImage / f.total));
  const secondary = Math.round(6 * (f.withMultiImage / f.total));
  const points = Math.min(max, primary + secondary);

  let verdict: string;
  if (bare > 0) {
    verdict = `${bare} product${bare === 1 ? "" : "s"} still have no photo — those almost never sell.`;
  } else if (f.withMultiImage < f.total) {
    const single = f.total - f.withMultiImage;
    verdict = `Every product has a photo. ${single} could use a second angle — shoppers who see two images buy more.`;
  } else {
    verdict = "Every product is photographed, most from more than one angle.";
  }

  return {
    key: "photos",
    label: "Photos",
    points,
    max,
    verdict,
    explain: `${f.withImage}/${f.total} have a photo (${pct(f.withImage, f.total)}%), ${f.withMultiImage}/${f.total} have two or more.`,
  };
}

function descriptionsCategory(f: StoreFacts): ScoreCategory {
  const max = MAX_POINTS.descriptions;
  if (f.total === 0) {
    return {
      key: "descriptions",
      label: "Descriptions",
      points: 0,
      max,
      verdict: "Nothing to describe until a product is live.",
      explain: "0 products on the storefront.",
    };
  }
  const points = Math.round(max * (f.withGoodDescription / f.total));
  const thin = f.total - f.withGoodDescription;
  const verdict =
    thin === 0
      ? "Every product has a real description — good for buyers and for Google."
      : `${thin} description${thin === 1 ? " is" : "s are"} too thin to sell or to rank on Google.`;

  return {
    key: "descriptions",
    label: "Descriptions",
    points,
    max,
    verdict,
    explain: `${f.withGoodDescription}/${f.total} clear ${THIN_DESCRIPTION_WORDS} words (${pct(f.withGoodDescription, f.total)}%).`,
  };
}

function freshnessCategory(f: StoreFacts): ScoreCategory {
  const max = MAX_POINTS.freshness;
  const days = f.newestDays;
  if (f.total === 0) {
    return {
      key: "freshness",
      label: "Freshness",
      points: 0,
      max,
      verdict: "Nothing has been published yet.",
      explain: "0 products on the storefront.",
    };
  }
  if (days === null) {
    // Undatable catalog: score the midpoint rather than punish a data gap.
    return {
      key: "freshness",
      label: "Freshness",
      points: Math.round(max * 0.5),
      max,
      verdict: "Couldn't date your newest product, so this is scored neutrally.",
      explain: "No publish dates on the public catalog.",
    };
  }

  let points: number;
  if (days <= 14) points = max;
  else if (days <= 30) points = 16;
  else if (days <= 45) points = 12;
  else if (days <= 90) points = 7;
  else if (days <= 180) points = 3;
  else points = 0;

  let verdict: string;
  if (days <= 14) verdict = "Something new went up in the last two weeks — that's the rhythm that brings people back.";
  else if (days <= 45) verdict = `Newest product is ${days} days old. Still fresh, but a drop this month would help.`;
  else verdict = `Nothing new in ${days} days — past customers have no reason to come back.`;

  return {
    key: "freshness",
    label: "Freshness",
    points,
    max,
    verdict,
    explain: `Newest product published ${days} day${days === 1 ? "" : "s"} ago.`,
  };
}

function stockCategory(f: StoreFacts): ScoreCategory {
  const max = MAX_POINTS.stock;
  if (f.total === 0) {
    return {
      key: "stock",
      label: "In stock",
      points: 0,
      max,
      verdict: "Nothing is buyable yet.",
      explain: "0 products on the storefront.",
    };
  }
  const points = Math.round(max * (f.inStock / f.total));
  const out = f.total - f.inStock;
  const verdict =
    out === 0
      ? "Everything on the storefront can actually be bought right now."
      : `${out} product${out === 1 ? " is" : "s are"} sold out — every visitor who lands there leaves empty-handed.`;

  return {
    key: "stock",
    label: "In stock",
    points,
    max,
    verdict,
    explain: `${f.inStock}/${f.total} have a buyable variant (${pct(f.inStock, f.total)}%).`,
  };
}

function rangeCategory(f: StoreFacts): ScoreCategory {
  const max = MAX_POINTS.range;
  let points: number;
  if (f.total === 0) points = 0;
  else if (f.total <= 2) points = 4;
  else if (f.total <= 9) points = 7;
  else points = max;

  let verdict: string;
  if (f.total === 0) verdict = "No products are live on the storefront.";
  else if (f.total <= 2) verdict = `${f.total} product${f.total === 1 ? "" : "s"} live — too few for a shopper to browse and find their fit.`;
  else if (f.total <= 9) verdict = `${f.total} products live — enough to browse, not yet enough to bundle.`;
  else verdict = `${f.total} products live — a real catalog to browse and bundle.`;

  return {
    key: "range",
    label: "Range",
    points,
    max,
    verdict,
    explain: `${f.total} product${f.total === 1 ? "" : "s"} visible on the storefront.`,
  };
}

export function gradeFor(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "E";
}

function headlineFor(score: number, total: number): { headline: string; subhead: string } {
  if (total === 0) {
    return {
      headline: "Nothing's live yet.",
      subhead: "Publish one product and scan again — the score moves the moment it's visible.",
    };
  }
  if (score >= 85) {
    return {
      headline: "This store is ready to sell.",
      subhead: "The basics are done. From here, growth comes from your sales data, not your storefront.",
    };
  }
  if (score >= 70) {
    return {
      headline: "Strong store, two wins left.",
      subhead: "You're past the point where most stores stall. Close the gaps below and you're at the top.",
    };
  }
  if (score >= 55) {
    return {
      headline: "Good bones. Three fixes from strong.",
      subhead: "Nothing here is hard — it's an afternoon of work between this score and a store that converts.",
    };
  }
  if (score >= 40) {
    return {
      headline: "You're leaving money on the table.",
      subhead: "Visitors are arriving and bouncing on fixable things. Start at the top of the list.",
    };
  }
  return {
    headline: "Your storefront is costing you sales.",
    subhead: "The good news: everything below is under your control, and the first fix takes an hour.",
  };
}

/** The one move with the most points behind it, phrased as an instruction. */
function topFixFor(f: StoreFacts, categories: ScoreCategory[]): string {
  if (f.total === 0) {
    return "Publish at least one product so people have something to buy.";
  }
  const worst = [...categories]
    .filter((c) => c.points < c.max)
    .sort((a, b) => b.max - b.points - (a.max - a.points))[0];
  if (!worst) return "Storefront is fully dialled in — your next wins are hiding in your sales data.";

  const bare = f.total - f.withImage;
  const thin = f.total - f.withGoodDescription;
  const out = f.total - f.inStock;

  switch (worst.key) {
    case "photos":
      return bare > 0
        ? `Photograph the ${bare} product${bare === 1 ? "" : "s"} with no image — it's the fastest conversion win you have.`
        : "Add a second photo to your best sellers — a second angle lifts conversion more than any copy change.";
    case "descriptions":
      return `Rewrite the ${thin} thin description${thin === 1 ? "" : "s"} — two sentences on who it's for and why it's worth it.`;
    case "freshness":
      return "Ship one new product or bundle this month and announce it to past customers.";
    case "stock":
      return `Restock or hide the ${out} sold-out product${out === 1 ? "" : "s"} — a dead end costs you the whole visit.`;
    case "range":
      return "Add a couple more products or bundles so shoppers have something to compare against.";
  }
}

export function buildScorecard(facts: StoreFacts): Scorecard {
  const categories: ScoreCategory[] = [
    photosCategory(facts),
    descriptionsCategory(facts),
    freshnessCategory(facts),
    stockCategory(facts),
    rangeCategory(facts),
  ];
  const score = Math.max(
    0,
    Math.min(100, categories.reduce((sum, c) => sum + c.points, 0)),
  );
  const { headline, subhead } = headlineFor(score, facts.total);

  return {
    shopHost: facts.shopHost,
    score,
    grade: gradeFor(score),
    headline,
    subhead,
    productCount: facts.total,
    categories,
    topFix: topFixFor(facts, categories),
    scannedDay: facts.scannedDay,
  };
}

export function scoreStorefront(
  products: PublicProduct[],
  shopHost: string,
  now: Date = new Date(),
): { facts: StoreFacts; scorecard: Scorecard } {
  const facts = readFacts(products, shopHost, now);
  return { facts, scorecard: buildScorecard(facts) };
}

/* ------------------------------------------------------------------ *
 * Share codes — the whole scorecard travels in the URL, no database.
 * ------------------------------------------------------------------ */

const CODE_VERSION = "1";

function base64UrlEncode(input: string): string {
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(input, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string | null {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  try {
    return typeof Buffer !== "undefined"
      ? Buffer.from(padded, "base64").toString("utf8")
      : decodeURIComponent(escape(atob(padded)));
  } catch {
    return null;
  }
}

/** Small non-cryptographic checksum so a mistyped link fails cleanly. */
function checksum(payload: string): string {
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 4);
}

/** Hosts are the only free text in a code; keep them to what a domain can be. */
function safeHost(host: string): string {
  return host.toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, 80);
}

export function encodeFacts(facts: StoreFacts): string {
  const payload = [
    CODE_VERSION,
    safeHost(facts.shopHost),
    facts.total,
    facts.withImage,
    facts.withMultiImage,
    facts.withGoodDescription,
    facts.inStock,
    facts.newestDays === null ? -1 : facts.newestDays,
    facts.scannedDay,
  ].join("~");
  return base64UrlEncode(`${payload}~${checksum(payload)}`);
}

export function decodeFacts(code: string): StoreFacts | null {
  if (!code || code.length > 400) return null;
  const raw = base64UrlDecode(code);
  if (!raw) return null;

  const parts = raw.split("~");
  if (parts.length !== 10) return null;

  const sum = parts.pop() as string;
  if (checksum(parts.join("~")) !== sum) return null;

  const [version, host, ...nums] = parts;
  if (version !== CODE_VERSION) return null;

  const cleanHost = safeHost(host);
  if (!cleanHost || !cleanHost.includes(".")) return null;

  const parsed = nums.map((n) => Number(n));
  if (parsed.some((n) => !Number.isFinite(n) || !Number.isInteger(n))) return null;

  const [total, withImage, withMultiImage, withGoodDescription, inStock, newestDays, scannedDay] =
    parsed;

  // A code is untrusted input: nothing may exceed the catalog it describes.
  if (total < 0 || total > 100_000) return null;
  if (scannedDay < 0 || scannedDay > 100_000) return null;
  const cap = (n: number) => Math.max(0, Math.min(total, n));

  return {
    shopHost: cleanHost,
    total,
    withImage: cap(withImage),
    withMultiImage: cap(Math.min(withMultiImage, cap(withImage))),
    withGoodDescription: cap(withGoodDescription),
    inStock: cap(inStock),
    newestDays: newestDays < 0 ? null : Math.min(newestDays, 40_000),
    scannedDay,
  };
}

/** Rebuild a full scorecard from a share code. Null when the code is junk. */
export function scorecardFromCode(code: string): Scorecard | null {
  const facts = decodeFacts(code);
  return facts === null ? null : buildScorecard(facts);
}

/** Whole days between the scan and now, for "scanned 3 days ago". */
export function daysSinceScan(scannedDay: number, now: Date = new Date()): number {
  return Math.max(0, Math.floor(now.getTime() / EPOCH_DAY_MS) - scannedDay);
}

/* ------------------------------------------------------------------ *
 * Head-to-head — one store against another.
 *
 * A rival's storefront is as public as your own, so a comparison needs no
 * permission and no data either side hasn't already published. Two share codes
 * joined by a dot: `/vs/<you>.<them>`. Dots never appear in base64url, so the
 * separator can't collide with a code.
 * ------------------------------------------------------------------ */

export interface Versus {
  you: Scorecard;
  them: Scorecard;
  /** Your score minus theirs. Positive means you're ahead. */
  lead: number;
  headline: string;
  /** Where the gap actually is, strongest difference first. */
  gaps: { label: string; you: number; them: number; max: number }[];
}

export function encodeVersus(you: StoreFacts, them: StoreFacts): string {
  return `${encodeFacts(you)}.${encodeFacts(them)}`;
}

export function buildVersus(you: Scorecard, them: Scorecard): Versus {
  const lead = you.score - them.score;
  const size = Math.abs(lead);

  let headline: string;
  if (lead > 0) {
    headline =
      size >= 15
        ? `${you.shopHost} is well ahead.`
        : `${you.shopHost} is ahead by ${size}.`;
  } else if (lead < 0) {
    headline =
      size >= 15
        ? `${them.shopHost} is well ahead — for now.`
        : `${them.shopHost} leads by ${size}. That's one afternoon of work.`;
  } else {
    headline = "Dead heat.";
  }

  // Pair categories by key so a future category can't silently misalign them.
  const gaps = you.categories
    .map((mine) => {
      const theirs = them.categories.find((c) => c.key === mine.key);
      return {
        label: mine.label,
        you: mine.points,
        them: theirs ? theirs.points : 0,
        max: mine.max,
      };
    })
    .sort((a, b) => Math.abs(b.you - b.them) - Math.abs(a.you - a.them));

  return { you, them, lead, headline, gaps };
}

/** Rebuild a head-to-head from a `<you>.<them>` code pair. Null when junk. */
export function versusFromCodes(codes: string): Versus | null {
  if (!codes || codes.length > 900) return null;
  const parts = codes.split(".");
  if (parts.length !== 2) return null;
  const you = scorecardFromCode(parts[0]);
  const them = scorecardFromCode(parts[1]);
  if (!you || !them) return null;
  return buildVersus(you, them);
}
