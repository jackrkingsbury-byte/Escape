/** Core data shapes for the StoreBrief engine (Shopify-agnostic on purpose). */

export interface LineItem {
  title: string;
  quantity: number;
  /** Unit price in major currency units (e.g. rand/dollars). */
  price: number;
}

export interface Order {
  id: string;
  /** ISO timestamp of order creation. */
  createdAt: string;
  /** Order total in major currency units, after discounts. */
  total: number;
  lineItems: LineItem[];
  /** Stable customer identifier when the platform provides one. */
  customerId?: string | null;
}

export interface ProductStat {
  title: string;
  quantity: number;
  revenue: number;
}

export interface SlumpingProduct extends ProductStat {
  previousRevenue: number;
  /** Percentage drop vs the previous period, 0–100. */
  dropPercent: number;
}

export type SuggestionCode =
  | "no_sales_share_store"
  | "restock_winner"
  | "investigate_slump"
  | "win_back_customers"
  | "celebrate_best_week"
  | "push_top_product_on_best_day"
  | "push_top_product"
  | "keep_momentum";

export interface Suggestion {
  code: SuggestionCode;
  productTitle?: string;
  bestDay?: string;
  /** Supporting count (e.g. past customers to win back). */
  count?: number;
}

export interface TrendStreak {
  direction: "up" | "down" | "flat";
  /** Consecutive week-over-week moves in `direction`, ending at the current window. */
  weeks: number;
}

/** Everything the brief needs — every number here is computed, never guessed. */
export interface BriefData {
  shopName: string;
  currency: string; // symbol, e.g. "R" or "$"
  windowDays: number;
  periodLabel: string; // e.g. "10–17 Jul"
  revenue: number;
  previousRevenue: number;
  /** Percent change vs previous period; null when there is no baseline. */
  revenueChangePercent: number | null;
  orderCount: number;
  previousOrderCount: number;
  averageOrderValue: number;
  previousAverageOrderValue: number;
  aovChangePercent: number | null;
  topProducts: ProductStat[]; // up to 3, by revenue
  slumpingProducts: SlumpingProduct[]; // up to 2
  bestDay: string | null; // weekday name with highest revenue
  bestDayRevenue: number;
  /**
   * Revenue per window, oldest → newest; last entry is the current window.
   * Always TREND_WINDOWS entries — callers must supply orders covering all
   * of them, or the leading entries read as real zero-sales weeks.
   */
  weeklyTrend: number[];
  trendStreak: TrendStreak;
  /** Current-window orders that carry a customerId; null when none do. */
  identifiedOrderCount: number | null;
  /** Of those, orders whose customer had bought before; null when none identified. */
  returningOrderCount: number | null;
  /** Distinct known customers who bought BEFORE the current window; null when the platform has no ids. */
  pastCustomerCount: number | null;
  /** Local-time block with the most revenue (≥2 orders), e.g. "17:00–20:00". */
  bestHours: string | null;
  /** Current window beat every other (non-zero) week in the trend. */
  isBestWeek: boolean;
  /**
   * Why revenue moved, in currency: order-count effect + basket-size effect
   * sum exactly to the revenue change. Null without a previous-window baseline.
   */
  revenueChangeDrivers: { ordersEffect: number; aovEffect: number } | null;
  /** Top sellers on pace to sell out soon (needs options.inventory). */
  stockRisks: StockRisk[];
  suggestion: Suggestion;
}

export interface StockRisk {
  title: string;
  unitsLeft: number;
  /** Days until sold out at the current window's sales pace. */
  daysLeft: number;
}

export interface BriefOptions {
  windowDays?: number; // default 7
  now?: Date; // injectable for tests
  shopName?: string;
  currency?: string;
  /** IANA timezone for local-time insights (busiest hours); defaults to UTC. */
  timezone?: string;
  /** Units on hand by product title, for stock-out forecasting. */
  inventory?: Record<string, number>;
}
