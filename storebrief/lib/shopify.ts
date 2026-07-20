import type { Order } from "./types";

/**
 * Shopify Admin GraphQL adapter. This is the only file that knows Shopify's
 * shapes; everything downstream works on the engine's own Order type.
 * Drops test-gateway and cancelled orders — Shopify excludes both from its
 * own analytics, and a brief that counts them reports money that never
 * existed.
 */

interface MoneyBag {
  shopMoney: { amount: string; currencyCode?: string };
}

export interface ShopifyOrderNode {
  id: string;
  createdAt: string;
  test?: boolean;
  cancelledAt?: string | null;
  currentTotalPriceSet: MoneyBag | null;
  lineItems: {
    nodes: Array<{
      title: string;
      quantity: number;
      discountedUnitPriceSet: MoneyBag | null;
    }>;
  };
}

/**
 * The query the app shell (and the concierge runs) execute against the Admin
 * API. Variables: $first (page size), $query (Shopify search syntax, e.g.
 * "created_at:>=2026-07-06").
 */
export const ORDERS_QUERY = `query StoreBriefOrders($first: Int!, $query: String) {
  orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id
      createdAt
      test
      cancelledAt
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 50) {
        nodes {
          title
          quantity
          discountedUnitPriceSet { shopMoney { amount } }
        }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

/** Search-syntax filter for "orders created in the last N*2 days" (current + baseline window). */
export function ordersSinceFilter(windowDays: number, now: Date = new Date()): string {
  const since = new Date(now.getTime() - windowDays * 2 * 24 * 60 * 60 * 1000);
  return `created_at:>='${since.toISOString()}'`;
}

function parseMoney(bag: MoneyBag | null | undefined): number {
  const n = Number(bag?.shopMoney?.amount);
  return Number.isFinite(n) ? n : 0;
}

export function mapShopifyOrders(nodes: ShopifyOrderNode[]): Order[] {
  return nodes
    .filter((n) => !n.test && !n.cancelledAt)
    .map((n) => ({
      id: n.id,
      createdAt: n.createdAt,
      total: parseMoney(n.currentTotalPriceSet),
      lineItems: n.lineItems.nodes.map((li) => ({
        title: li.title,
        quantity: li.quantity,
        price: parseMoney(li.discountedUnitPriceSet),
      })),
    }));
}
