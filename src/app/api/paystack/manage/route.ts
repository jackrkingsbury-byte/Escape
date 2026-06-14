import { NextResponse } from "next/server";
import { getAuthedContext } from "@/lib/auth";
import { generateSubscriptionManageLink } from "@/lib/paystack";

/** Returns a Paystack-hosted link to manage/cancel the subscription. */
export async function POST() {
  const ctx = await getAuthedContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profile } = ctx;

  if (!profile.paystack_subscription_code) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }

  try {
    const link = await generateSubscriptionManageLink(profile.paystack_subscription_code);
    return NextResponse.json({ url: link });
  } catch (err) {
    console.error("paystack manage link failed", err);
    return NextResponse.json({ error: "manage_failed" }, { status: 502 });
  }
}
