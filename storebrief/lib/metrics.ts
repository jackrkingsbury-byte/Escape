import type {
  BriefData,
  BriefOptions,
  Order,
  ProductStat,
  SlumpingProduct,
  Suggestion,
} from "./types";

/**
 * Deterministic analytics over raw orders. This module is the single source
 * of truth for every number in a brief — the AI is only ever allowed to
 * rephrase what this file computed.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

/** Minimum previous-period revenue before we call something a slump. */
const SLUMP_BASELINE_REVENUE = 200;
/** Current revenue at or below this fraction of previous = slumping. */
const SLUMP_FRACTION = 0.4;

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // no baseline
  return round1(((current - previous) / previous) * 100);
}

interface ProductAgg {
  quantity: number;
  revenue: number;
}

function aggregateProducts(orders: Order[]): Map<string, ProductAgg> {
  const map = new Map<string, ProductAgg>();
  for (const order of orders) {
    for (const item of order.lineItems) {
      const prev = map.get(item.title) ?? { quantity: 0, revenue: 0 };
      map.set(item.title, {
        quantity: prev.quantity + item.quantity,
        revenue: round2(prev.revenue + item.quantity * item.price),
      });
    }
  }
  return map;
}

function inRange(order: Order, startMs: number, endMs: number): boolean {
  const t = new Date(order.createdAt).getTime();
  return t >= startMs && t < endMs;
}

function formatPeriod(startMs: number, endMs: number): string {
  const fmt = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCDate()} ${d.toLocaleString("en-ZA", { month: "short", timeZone: "UTC" })}`;
  };
  return `${fmt(startMs)} – ${fmt(endMs - 1)}`;
}

function pickSuggestion(
  orderCount: number,
  topProducts: ProductStat[],
  slumping: SlumpingProduct[],
  bestDay: string | null,
): Suggestion {
  if (orderCount === 0) return { code: "no_sales_share_store" };
  const slump = slumping[0];
  if (slump) return { code: "investigate_slump", productTitle: slump.title };
  const top = topProducts[0];
  if (top && bestDay)
    return { code: "push_top_product_on_best_day", productTitle: top.title, bestDay };
  if (top) return { code: "push_top_product", productTitle: top.title };
  return { code: "keep_momentum" };
}

export function computeBrief(orders: Order[], options: BriefOptions = {}): BriefData {
  const windowDays = options.windowDays ?? 7;
  const now = options.now ?? new Date();
  const endMs = now.getTime();
  const startMs = endMs - windowDays * DAY_MS;
  const prevStartMs = startMs - windowDays * DAY_MS;

  const current = orders.filter((o) => inRange(o, startMs, endMs));
  const previous = orders.filter((o) => inRange(o, prevStartMs, startMs));

  const revenue = round2(current.reduce((s, o) => s + o.total, 0));
  const previousRevenue = round2(previous.reduce((s, o) => s + o.total, 0));
  const orderCount = current.length;
  const previousOrderCount = previous.length;
  const averageOrderValue = orderCount === 0 ? 0 : round2(revenue / orderCount);
  const previousAverageOrderValue =
    previousOrderCount === 0 ? 0 : round2(previousRevenue / previousOrderCount);

  // Products
  const curProducts = aggregateProducts(current);
  const prevProducts = aggregateProducts(previous);

  const topProducts: ProductStat[] = [...curProducts.entries()]
    .map(([title, agg]) => ({ title, ...agg }))
    .filter((p) => p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue || a.title.localeCompare(b.title))
    .slice(0, 3);

  const slumpingProducts: SlumpingProduct[] = [...prevProducts.entries()]
    .map(([title, prev]) => {
      const cur = curProducts.get(title) ?? { quantity: 0, revenue: 0 };
      return { title, prev, cur };
    })
    .filter(
      ({ prev, cur }) =>
        prev.revenue >= SLUMP_BASELINE_REVENUE && cur.revenue <= prev.revenue * SLUMP_FRACTION,
    )
    .map(({ title, prev, cur }) => ({
      title,
      quantity: cur.quantity,
      revenue: cur.revenue,
      previousRevenue: prev.revenue,
      dropPercent: round1(((prev.revenue - cur.revenue) / prev.revenue) * 100),
    }))
    .sort((a, b) => b.previousRevenue - a.previousRevenue)
    .slice(0, 2);

  // Best weekday by revenue
  const byDay = new Map<number, number>();
  for (const o of current) {
    const day = new Date(o.createdAt).getUTCDay();
    byDay.set(day, round2((byDay.get(day) ?? 0) + o.total));
  }
  let bestDay: string | null = null;
  let bestDayRevenue = 0;
  for (let d = 0; d < 7; d++) {
    const rev = byDay.get(d) ?? 0;
    if (rev > bestDayRevenue) {
      bestDayRevenue = rev;
      bestDay = WEEKDAYS[d] ?? null;
    }
  }

  return {
    shopName: options.shopName ?? "your store",
    currency: options.currency ?? "R",
    windowDays,
    periodLabel: formatPeriod(startMs, endMs),
    revenue,
    previousRevenue,
    revenueChangePercent: pctChange(revenue, previousRevenue),
    orderCount,
    previousOrderCount,
    averageOrderValue,
    previousAverageOrderValue,
    aovChangePercent: pctChange(averageOrderValue, previousAverageOrderValue),
    topProducts,
    slumpingProducts,
    bestDay,
    bestDayRevenue,
    suggestion: pickSuggestion(orderCount, topProducts, slumpingProducts, bestDay),
  };
}
