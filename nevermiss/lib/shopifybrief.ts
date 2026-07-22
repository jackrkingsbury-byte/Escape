/**
 * Compute a real sales brief from a merchant's own Shopify orders, fetched
 * with a read-only Admin API access token THEY generate and paste in. This is
 * the "paste your store + key, see your real numbers" flow — permissioned, no
 * Partner account, no OAuth app. The token is used in-request and never stored
 * or logged.
 */

export interface RestOrder {
  id?: number | string;
  created_at?: string;
  total_price?: string;
  currency?: string;
  test?: boolean;
  cancelled_at?: string | null;
  line_items?: Array<{ title?: string; quantity?: number; price?: string }>;
}

export interface QuickBrief {
  shopHost: string;
  currency: string;
  windowDays: number;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  previousRevenue: number;
  revenueChangePercent: number | null;
  topTitle: string | null;
  topQuantity: number;
  topRevenue: number;
  bestDay: string | null;
  lines: string[];
  action: string;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** myshopify.com host only — required by the Admin API and a hard SSRF guard. */
export function normalizeShopDomain(input: string): string | null {
  let raw = (input || "").trim().toLowerCase();
  raw = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(raw)) return raw;
  return null;
}

function money(currency: string, n: number): string {
  const sym = currency === "ZAR" ? "R" : currency === "USD" ? "$" : "";
  return `${sym}${Math.round(n).toLocaleString("en-ZA")}${sym ? "" : " " + currency}`.trim();
}

export function computeQuickBrief(
  orders: RestOrder[],
  shopHost: string,
  windowDays = 30,
  now: Date = new Date(),
): QuickBrief {
  const clean = orders.filter((o) => !o.test && !o.cancelled_at);
  const currency = clean.find((o) => o.currency)?.currency ?? "ZAR";
  const endMs = now.getTime();
  const startMs = endMs - windowDays * 86_400_000;
  const prevStartMs = startMs - windowDays * 86_400_000;

  const inRange = (o: RestOrder, a: number, b: number) => {
    const t = Date.parse(o.created_at ?? "");
    return Number.isFinite(t) && t >= a && t < b;
  };
  const total = (o: RestOrder) => {
    const n = Number(o.total_price);
    return Number.isFinite(n) ? n : 0;
  };

  const cur = clean.filter((o) => inRange(o, startMs, endMs));
  const prev = clean.filter((o) => inRange(o, prevStartMs, startMs));

  const revenue = round2(cur.reduce((s, o) => s + total(o), 0));
  const previousRevenue = round2(prev.reduce((s, o) => s + total(o), 0));
  const orderCount = cur.length;
  const averageOrderValue = orderCount ? round2(revenue / orderCount) : 0;
  const revenueChangePercent =
    previousRevenue === 0 ? (revenue === 0 ? 0 : null) : round1(((revenue - previousRevenue) / previousRevenue) * 100);

  // Top product by revenue
  const prod = new Map<string, { qty: number; rev: number }>();
  for (const o of cur) {
    for (const li of o.line_items ?? []) {
      const title = li.title ?? "Item";
      const qty = Number(li.quantity) || 0;
      const price = Number(li.price) || 0;
      const p = prod.get(title) ?? { qty: 0, rev: 0 };
      prod.set(title, { qty: p.qty + qty, rev: round2(p.rev + qty * price) });
    }
  }
  let topTitle: string | null = null;
  let topQuantity = 0;
  let topRevenue = 0;
  for (const [title, p] of prod) {
    if (p.rev > topRevenue) {
      topRevenue = p.rev;
      topQuantity = p.qty;
      topTitle = title;
    }
  }

  // Best weekday
  const byDay = new Map<number, number>();
  for (const o of cur) {
    const d = new Date(Date.parse(o.created_at ?? "")).getUTCDay();
    byDay.set(d, round2((byDay.get(d) ?? 0) + total(o)));
  }
  let bestDay: string | null = null;
  let bestDayRev = 0;
  for (let d = 0; d < 7; d++) {
    const rev = byDay.get(d) ?? 0;
    if (rev > bestDayRev) {
      bestDayRev = rev;
      bestDay = WEEKDAYS[d];
    }
  }

  const lines: string[] = [];
  const changePhrase =
    revenueChangePercent === null
      ? "up from nothing"
      : revenueChangePercent === 0
        ? "flat"
        : revenueChangePercent > 0
          ? `up ${revenueChangePercent}%`
          : `down ${Math.abs(revenueChangePercent)}%`;
  lines.push(`💰 ${money(currency, revenue)} from ${orderCount} order${orderCount === 1 ? "" : "s"} in the last ${windowDays} days — ${changePhrase} on the ${windowDays} before.`);
  if (orderCount > 0) lines.push(`🧾 Average basket: ${money(currency, averageOrderValue)}.`);
  if (topTitle) lines.push(`⭐ Top seller: "${topTitle}" — ${topQuantity} sold for ${money(currency, topRevenue)}.`);
  if (bestDay) lines.push(`📅 Best day: ${bestDay} (${money(currency, bestDayRev)}).`);

  let action: string;
  if (orderCount === 0) {
    action = "No sales in this window — share your store link somewhere new this week to get eyes on it.";
  } else if (topTitle && bestDay) {
    action = `"${topTitle}" is your winner and ${bestDay} is your best day — line up a post or promo for it this ${bestDay}.`;
  } else if (topTitle) {
    action = `"${topTitle}" is your winner — give it more visibility this week.`;
  } else {
    action = "Keep doing what's working, and test one new product photo or headline.";
  }

  return {
    shopHost,
    currency,
    windowDays,
    revenue,
    orderCount,
    averageOrderValue,
    previousRevenue,
    revenueChangePercent,
    topTitle,
    topQuantity,
    topRevenue,
    bestDay,
    lines,
    action,
  };
}
