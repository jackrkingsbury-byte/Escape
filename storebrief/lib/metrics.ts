import type {
  BriefData,
  BriefOptions,
  Order,
  ProductStat,
  SlumpingProduct,
  Suggestion,
  TrendStreak,
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
/** Windows in the momentum trend (current + 3 back). Callers must supply orders covering all of them. */
export const TREND_WINDOWS = 4;

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

interface SuggestionInputs {
  orderCount: number;
  topProducts: ProductStat[];
  slumping: SlumpingProduct[];
  bestDay: string | null;
  returningOrderCount: number | null;
  pastCustomerCount: number | null;
  isBestWeek: boolean;
}

/** Minimum past customers before "win them back" beats generic advice. */
const WIN_BACK_MIN_CUSTOMERS = 3;

function pickSuggestion(s: SuggestionInputs): Suggestion {
  if (s.orderCount === 0) return { code: "no_sales_share_store" };
  const slump = s.slumping[0];
  if (slump) return { code: "investigate_slump", productTitle: slump.title };
  const top = s.topProducts[0];
  if (
    s.returningOrderCount === 0 &&
    s.pastCustomerCount !== null &&
    s.pastCustomerCount >= WIN_BACK_MIN_CUSTOMERS
  ) {
    return { code: "win_back_customers", count: s.pastCustomerCount };
  }
  if (s.isBestWeek && top) {
    return { code: "celebrate_best_week", productTitle: top.title };
  }
  if (top && s.bestDay)
    return { code: "push_top_product_on_best_day", productTitle: top.title, bestDay: s.bestDay };
  if (top) return { code: "push_top_product", productTitle: top.title };
  return { code: "keep_momentum" };
}

/** Local hour (0-23) of a date in an IANA timezone; falls back to UTC on bad input. */
function localHour(date: Date, timezone: string | undefined): number {
  if (!timezone) return date.getUTCHours();
  try {
    const h = new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: timezone,
    }).format(date);
    const n = Number.parseInt(h, 10);
    return Number.isFinite(n) ? n : date.getUTCHours();
  } catch {
    return date.getUTCHours();
  }
}

const HOUR_BLOCK = 3;

/** Highest-revenue 3-hour local block, requiring ≥2 orders so one sale can't define it. */
function computeBestHours(current: Order[], timezone: string | undefined): string | null {
  const blocks = new Map<number, { revenue: number; orders: number }>();
  for (const o of current) {
    const block = Math.floor(localHour(new Date(o.createdAt), timezone) / HOUR_BLOCK);
    const prev = blocks.get(block) ?? { revenue: 0, orders: 0 };
    blocks.set(block, { revenue: round2(prev.revenue + o.total), orders: prev.orders + 1 });
  }
  let best: number | null = null;
  let bestRevenue = 0;
  for (const [block, agg] of blocks) {
    if (agg.orders >= 2 && agg.revenue > bestRevenue) {
      bestRevenue = agg.revenue;
      best = block;
    }
  }
  if (best === null) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(best * HOUR_BLOCK)}:00–${pad((best + 1) * HOUR_BLOCK)}:00`;
}

function computeTrendStreak(trend: number[]): TrendStreak {
  let up = 0;
  for (let i = trend.length - 1; i > 0 && (trend[i] ?? 0) > (trend[i - 1] ?? 0); i--) up++;
  if (up > 0) return { direction: "up", weeks: up };
  let down = 0;
  for (let i = trend.length - 1; i > 0 && (trend[i] ?? 0) < (trend[i - 1] ?? 0); i--) down++;
  if (down > 0) return { direction: "down", weeks: down };
  return { direction: "flat", weeks: 0 };
}

/**
 * "Returning" = this customer has any earlier order (any window). Orders
 * without a customerId can't be classified and sit outside both counts.
 */
function computeReturning(
  current: Order[],
  allOrders: Order[],
): { identified: number | null; returning: number | null } {
  const identified = current.filter((o) => o.customerId != null);
  if (identified.length === 0) return { identified: null, returning: null };
  const returning = identified.filter((o) =>
    allOrders.some(
      (p) =>
        p.id !== o.id &&
        p.customerId === o.customerId &&
        new Date(p.createdAt).getTime() < new Date(o.createdAt).getTime(),
    ),
  ).length;
  return { identified: identified.length, returning };
}

/** Distinct known customers whose first contact was before the current window. */
function computePastCustomers(orders: Order[], windowStartMs: number): number | null {
  if (!orders.some((o) => o.customerId != null)) return null;
  const past = new Set<string>();
  for (const o of orders) {
    if (o.customerId != null && new Date(o.createdAt).getTime() < windowStartMs) {
      past.add(o.customerId);
    }
  }
  return past.size;
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

  // Momentum: revenue per window, oldest → newest (last = current window).
  const weeklyTrend: number[] = [];
  for (let k = TREND_WINDOWS - 1; k >= 0; k--) {
    const winEnd = endMs - k * windowDays * DAY_MS;
    const winStart = winEnd - windowDays * DAY_MS;
    weeklyTrend.push(
      round2(orders.filter((o) => inRange(o, winStart, winEnd)).reduce((s, o) => s + o.total, 0)),
    );
  }
  const trendStreak = computeTrendStreak(weeklyTrend);
  const { identified, returning } = computeReturning(current, orders);
  const pastCustomerCount = computePastCustomers(orders, startMs);
  const bestHours = computeBestHours(current, options.timezone);
  const olderMax = Math.max(...weeklyTrend.slice(0, -1));
  const isBestWeek = revenue > 0 && olderMax > 0 && revenue >= olderMax;

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
    weeklyTrend,
    trendStreak,
    identifiedOrderCount: identified,
    returningOrderCount: returning,
    pastCustomerCount,
    bestHours,
    isBestWeek,
    suggestion: pickSuggestion({
      orderCount,
      topProducts,
      slumping: slumpingProducts,
      bestDay,
      returningOrderCount: returning,
      pastCustomerCount,
      isBestWeek,
    }),
  };
}
