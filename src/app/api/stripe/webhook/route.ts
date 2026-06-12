import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { grantAchievement } from "@/lib/achievements";

/**
 * Stripe → Supabase billing sync. The webhook is the single source of
 * truth for `profiles.plan`; the app never flips it client-side.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("webhook signature verification failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  async function syncSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.supabase_user_id;
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    const query = userId
      ? admin.from("profiles").select("id, referred_by").eq("id", userId)
      : admin.from("profiles").select("id, referred_by").eq("stripe_customer_id", customerId);
    const { data: profile } = await query.single();
    if (!profile) {
      console.error("webhook: no profile for subscription", subscription.id);
      return;
    }

    const active = subscription.status === "active" || subscription.status === "trialing";
    const periodEnd = subscription.items.data[0]?.current_period_end;

    await admin
      .from("profiles")
      .update({
        plan: active ? "premium" : "free",
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      })
      .eq("id", profile.id);

    // Referral conversion: when a referred user goes premium, the
    // referrer earns XP once.
    if (active && profile.referred_by) {
      const { data: referral } = await admin
        .from("referrals")
        .select("id, status, referrer_id")
        .eq("referred_id", profile.id)
        .single();
      if (referral && referral.status === "pending") {
        await admin.from("referrals").update({ status: "converted" }).eq("id", referral.id);
        await admin.from("xp_events").insert({
          user_id: referral.referrer_id,
          amount: 500,
          reason: "referral",
          ref_id: referral.id,
        });
        const { data: referrer } = await admin
          .from("profiles")
          .select("xp")
          .eq("id", referral.referrer_id)
          .single();
        if (referrer) {
          await admin
            .from("profiles")
            .update({ xp: referrer.xp + 500 })
            .eq("id", referral.referrer_id);
        }
        await grantAchievement(referral.referrer_id, "referral_1");
      }
    }
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string" ? session.subscription : session.subscription.id
        );
        await syncSubscription(sub);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
