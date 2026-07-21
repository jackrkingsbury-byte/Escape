import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Real self-serve checkout for StoreBrief founding plans (Yoco Online Checkout).
 * Click a plan → this server creates a Yoco checkout → we redirect the buyer
 * to Yoco's hosted card page → after payment Yoco returns them to the
 * thank-you page. The secret key never leaves the server.
 *
 * Until YOCO_SECRET_KEY is set, this gracefully falls back to WhatsApp so the
 * buttons always do something real.
 */

const SITE = "https://escape-nevermiss3.vercel.app";
const WA_NUMBER = "27826118749";

const PLANS: Record<string, { amountCents: number; label: string; wa: string }> = {
  "6mo": {
    amountCents: 15000, // R150
    label: "StoreBrief Founding — 6 months of Pro",
    wa: "Hi%21%20I%27d%20like%20the%20StoreBrief%20Founding%20plan%20%28R150%20-%206%20months%20of%20Pro%29.%20My%20store%20is%3A%20",
  },
  "1yr": {
    amountCents: 29900, // R299
    label: "StoreBrief Founding Year — 12 months of Pro",
    wa: "Hi%21%20I%27d%20like%20the%20StoreBrief%20Founding%20Year%20%28R299%20-%2012%20months%20of%20Pro%29.%20My%20store%20is%3A%20",
  },
};

export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`checkout:${ip}`, 8, 60_000).allowed) {
    return NextResponse.redirect(`${SITE}/storebrief.html#pricing`, 303);
  }

  const planKey = req.nextUrl.searchParams.get("plan") ?? "";
  const plan = PLANS[planKey];
  if (!plan) {
    return NextResponse.redirect(`${SITE}/storebrief.html#pricing`, 303);
  }

  const secret = process.env.YOCO_SECRET_KEY;
  // No key yet → fall back to WhatsApp so the button still works.
  if (!secret) {
    return NextResponse.redirect(`https://wa.me/${WA_NUMBER}?text=${plan.wa}`, 303);
  }

  try {
    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${planKey}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: JSON.stringify({
        amount: plan.amountCents,
        currency: "ZAR",
        successUrl: `${SITE}/storebrief-thanks.html?plan=${planKey}`,
        cancelUrl: `${SITE}/storebrief.html#pricing`,
        failureUrl: `${SITE}/storebrief.html?checkout=failed#pricing`,
        metadata: { product: plan.label },
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { redirectUrl?: string; message?: string };
    if (res.ok && data.redirectUrl) {
      return NextResponse.redirect(data.redirectUrl, 303);
    }
    // Payment provider hiccup → don't lose the sale, hand off to WhatsApp.
    return NextResponse.redirect(`https://wa.me/${WA_NUMBER}?text=${plan.wa}`, 303);
  } catch {
    return NextResponse.redirect(`https://wa.me/${WA_NUMBER}?text=${plan.wa}`, 303);
  }
}
