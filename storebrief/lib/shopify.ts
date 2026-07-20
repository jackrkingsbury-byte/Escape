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
  customer?: { id: string } | null;
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
export const ORDERS_QUERY = `query StoreBriefOrders($first: Int!, $query: String, $after: String) {
  orders(first: $first, query: $query, after: $after, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id
      createdAt
      test
      cancelledAt
      customer { id }
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

/**
 * Search-syntax filter for "orders created in the last N windows" — default 4
 * to feed the engine's momentum trend (current window + 3 back).
 */
export function ordersSinceFilter(windowDays: number, now: Date = new Date(), windows = 4): string {
  const since = new Date(now.getTime() - windowDays * windows * 24 * 60 * 60 * 1000);
  return `created_at:>='${since.toISOString()}'`;
}

export interface OrdersPage {
  nodes: ShopifyOrderNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

/**
 * Drains all order pages. `runQuery` executes ORDERS_QUERY with the given
 * variables against whatever transport the caller has (app shell, MCP, tests).
 */
export async function fetchAllOrders(
  runQuery: (variables: { first: number; query?: string; after?: string | null }) => Promise<OrdersPage>,
  query?: string,
  pageSize = 50,
  maxPages = 20,
): Promise<ShopifyOrderNode[]> {
  const nodes: ShopifyOrderNode[] = [];
  let after: string | null = null;
  for (let i = 0; i < maxPages; i++) {
    const page = await runQuery({ first: pageSize, query, after });
    nodes.push(...page.nodes);
    if (!page.pageInfo.hasNextPage || !page.pageInfo.endCursor) break;
    after = page.pageInfo.endCursor;
  }
  return nodes;
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
      customerId: n.customer?.id ?? null,
      lineItems: n.lineItems.nodes.map((li) => ({
        title: li.title,
        quantity: li.quantity,
        price: parseMoney(li.discountedUnitPriceSet),
      })),
    }));
}
