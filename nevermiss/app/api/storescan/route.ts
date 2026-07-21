import { NextRequest, NextResponse } from "next/server";
import { buildScan, normalizeStoreUrl, type PublicProduct } from "@/lib/storescan";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 3_000_000;

/**
 * Public endpoint behind the StoreBrief landing page's "scan my store" box.
 * Reads only the store's public /products.json — the same data any visitor
 * sees — and returns a plain-English scan.
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  const perIp = rateLimit(`scan:${ip}`, 6, 60_000);
  const global = rateLimit("scan:global", 40, 60_000);
  if (!perIp.allowed || !global.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many scans right now — try again in a minute." },
      { status: 429 },
    );
  }

  const url = normalizeStoreUrl(req.nextUrl.searchParams.get("url") ?? "");
  if (!url) {
    return NextResponse.json(
      { ok: false, error: "That doesn't look like a store link — try something like mystore.co.za or mystore.myshopify.com." },
      { status: 400 },
    );
  }

  const target = `https://${url.hostname}/products.json?limit=250`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(target, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "StoreBriefScan/1.0 (+storebrief)" },
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Couldn't read that store — it may not be a Shopify storefront, or its catalog is private." },
        { status: 422 },
      );
    }
    const text = await res.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: "That store's catalog is too large for the instant scan." },
        { status: 422 },
      );
    }
    let products: PublicProduct[];
    try {
      const parsed = JSON.parse(text) as { products?: PublicProduct[] };
      if (!Array.isArray(parsed.products)) throw new Error("no products array");
      products = parsed.products;
    } catch {
      return NextResponse.json(
        { ok: false, error: "That link responded, but not like a Shopify store — is it definitely on Shopify?" },
        { status: 422 },
      );
    }

    const report = buildScan(products, url.hostname);
    return NextResponse.json({ ok: true, report });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Couldn't reach that store — check the link and try again." },
      { status: 422 },
    );
  }
}
