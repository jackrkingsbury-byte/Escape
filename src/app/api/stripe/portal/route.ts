import { NextResponse } from "next/server";
import { getAuthedContext } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const ctx = await getAuthedContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profile } = ctx;

  if (!profile.stripe_customer_id) {
    return NextResponse.json({ error: "no_billing_account" }, { status: 400 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
