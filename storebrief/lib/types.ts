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
  | "investigate_slump"
  | "push_top_product_on_best_day"
  | "push_top_product"
  | "keep_momentum";

export interface Suggestion {
  code: SuggestionCode;
  productTitle?: string;
  bestDay?: string;
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
  suggestion: Suggestion;
}

export interface BriefOptions {
  windowDays?: number; // default 7
  now?: Date; // injectable for tests
  shopName?: string;
  currency?: string;
}
