/**
 * Instant public storefront scan for StoreBrief's landing page.
 * Reads a Shopify store's public /products.json (no permissions needed) and
 * produces deterministic, plain-English findings — the live "AI reads your
 * store" demo. Sales/order insights still require the app install; this scan
 * only ever sees what any visitor to the storefront can see.
 */

interface PublicVariant {
  price?: string;
  available?: boolean;
}

interface PublicImage {
  src?: string;
}

export interface PublicProduct {
  title?: string;
  body_html?: string;
  published_at?: string;
  created_at?: string;
  images?: PublicImage[];
  variants?: PublicVariant[];
}

export interface ScanReport {
  shopHost: string;
  productCount: number;
  missingImages: number;
  thinDescriptions: number;
  priceMin: number | null;
  priceMax: number | null;
  newestDays: number | null;
  lines: string[];
  action: string;
}

const THIN_DESCRIPTION_WORDS = 30;
const STALE_DAYS = 45;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildScan(
  products: PublicProduct[],
  shopHost: string,
  now: Date = new Date(),
): ScanReport {
  const productCount = products.length;
  let missingImages = 0;
  let thinDescriptions = 0;
  let priceMin: number | null = null;
  let priceMax: number | null = null;
  let newestMs: number | null = null;

  for (const p of products) {
    if (!p.images || p.images.length === 0) missingImages++;
    const words = stripHtml(p.body_html ?? "").split(" ").filter(Boolean).length;
    if (words < THIN_DESCRIPTION_WORDS) thinDescriptions++;
    for (const v of p.variants ?? []) {
      const price = Number(v.price);
      if (Number.isFinite(price) && price > 0) {
        priceMin = priceMin === null ? price : Math.min(priceMin, price);
        priceMax = priceMax === null ? price : Math.max(priceMax, price);
      }
    }
    const created = Date.parse(p.published_at ?? p.created_at ?? "");
    if (Number.isFinite(created)) {
      newestMs = newestMs === null ? created : Math.max(newestMs, created);
    }
  }

  const newestDays =
    newestMs === null ? null : Math.max(0, Math.floor((now.getTime() - newestMs) / 86_400_000));

  const lines: string[] = [];
  lines.push(
    `🔎 Read ${shopHost}: ${productCount} product${productCount === 1 ? "" : "s"} live on the storefront.`,
  );
  if (priceMin !== null && priceMax !== null) {
    lines.push(
      priceMin === priceMax
        ? `💰 Everything is priced at ${priceMin.toFixed(0)}.`
        : `💰 Prices run from ${priceMin.toFixed(0)} to ${priceMax.toFixed(0)}.`,
    );
  }
  if (missingImages > 0) {
    lines.push(
      `⚠️ ${missingImages} product${missingImages === 1 ? " has" : "s have"} no photo — products without photos barely sell.`,
    );
  }
  if (thinDescriptions > 0) {
    lines.push(
      `📝 ${thinDescriptions} product${thinDescriptions === 1 ? " has" : "s have"} a very short description — thin pages convert poorly and rank worse on Google.`,
    );
  }
  if (newestDays !== null && newestDays > STALE_DAYS) {
    lines.push(
      `🕸️ Nothing new in ${newestDays} days — fresh drops give past customers a reason to come back.`,
    );
  }
  if (missingImages === 0 && thinDescriptions === 0 && productCount > 0) {
    lines.push(`✨ Storefront basics look solid — photos and descriptions are in place.`);
  }

  let action: string;
  if (productCount === 0) {
    action = "Your storefront has no visible products — publish at least one so people have something to buy.";
  } else if (missingImages > 0) {
    action = `Add photos to the ${missingImages} bare product${missingImages === 1 ? "" : "s"} first — it's the fastest conversion win on this list.`;
  } else if (thinDescriptions > 0) {
    action = `Rewrite the ${thinDescriptions} short description${thinDescriptions === 1 ? "" : "s"} — two sentences on who it's for and why it's good.`;
  } else if (newestDays !== null && newestDays > STALE_DAYS) {
    action = "Ship one new product or bundle this month and announce it — give people a reason to return.";
  } else {
    action = "Storefront looks healthy — your next wins are in the sales data. That's what the weekly brief reads.";
  }

  return {
    shopHost,
    productCount,
    missingImages,
    thinDescriptions,
    priceMin,
    priceMax,
    newestDays,
    lines,
    action,
  };
}

/** Reject anything that could point the server at internal networks. */
export function normalizeStoreUrl(input: string): URL | null {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  if (
    isIp ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    !host.includes(".")
  ) {
    return null;
  }
  return url;
}
