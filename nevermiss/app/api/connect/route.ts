import { NextRequest, NextResponse } from "next/server";
import { computeQuickBrief, normalizeShopDomain, type RestOrder } from "@/lib/shopifybrief";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const FETCH_TIMEOUT_MS = 9000;
const API_VERSION = "2024-10";

/**
 * "Connect your store, see your REAL numbers." The merchant pastes their
 * myshopify domain + a read-only Admin API access token they generated
 * themselves. We fetch their recent orders once, compute the brief, and
 * return it. The token is used in-request only — never stored, never logged.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`connect:${ip}`, 5, 60_000).allowed) {
    return NextResponse.json({ ok: false, error: "Too many tries — wait a minute and go again." }, { status: 429 });
  }

  let body: { shop?: string; token?: string };
  try {
    body = (await req.json()) as { shop?: string; token?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const shop = normalizeShopDomain(body.shop ?? "");
  const token = (body.token ?? "").trim();
  if (!shop) {
    return NextResponse.json(
      { ok: false, error: "That needs to be your myshopify.com address — like yourstore.myshopify.com (find it in your Shopify admin URL)." },
      { status: 400 },
    );
  }
  if (!/^shp(at|ca|pa)_[A-Za-z0-9]+$/.test(token)) {
    return NextResponse.json(
      { ok: false, error: "That doesn't look like an Admin API token — it should start with shpat_ and come from your custom app." },
      { status: 400 },
    );
  }

  // Only current + previous 30-day windows.
  const sinceIso = new Date(Date.now() - 62 * 86_400_000).toISOString();
  const url =
    `https://${shop}/admin/api/${API_VERSION}/orders.json` +
    `?status=any&limit=250&created_at_min=${encodeURIComponent(sinceIso)}` +
    `&fields=id,created_at,total_price,currency,test,cancelled_at,line_items`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "X-Shopify-Access-Token": token, accept: "application/json" },
    });
    clearTimeout(timer);

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { ok: false, error: "That key didn't work, or it can't read orders. In your custom app, tick the read_orders scope, reinstall, and copy the token again." },
        { status: 422 },
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Shopify wouldn't return your orders — double-check the store address and try again." },
        { status: 422 },
      );
    }

    const json = (await res.json().catch(() => ({}))) as { orders?: RestOrder[] };
    const orders = Array.isArray(json.orders) ? json.orders : [];
    const brief = computeQuickBrief(orders, shop, 30);
    return NextResponse.json({ ok: true, brief });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Couldn't reach your store — check the address and try again." },
      { status: 422 },
    );
  }
}
