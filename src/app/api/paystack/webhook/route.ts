import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/server";
import { grantAchievement } from "@/lib/achievements";

/**
 * Paystack → Supabase billing sync. The webhook is the single source of
 * truth for `profiles.plan`; the app never flips it client-side.
 *
 * Handled events:
 *   charge.success         — payment captured (initial + renewals)
 *   subscription.create    — subscription started; captures codes + period end
 *   subscription.disable   — auto-renew off / cancelled (premium kept until period end)
 *   subscription.not_renew — user turned off renewal
 */

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

interface PaystackCustomer {
  email?: string;
  customer_code?: string;
}
interface PaystackPlan {
  interval?: string;
}
interface PaystackEvent {
  event: string;
  data: {
    status?: string;
    subscription_code?: string;
    email_token?: string;
    next_payment_date?: string;
    customer?: PaystackCustomer;
    plan?: PaystackPlan;
    metadata?: { supabase_user_id?: string };
  };
}

function periodEndFromInterval(interval?: string): string {
  const now = new Date();
  switch (interval) {
    case "weekly":
      now.setDate(now.getDate() + 7);
      break;
    case "annually":
      now.setFullYear(now.getFullYear() + 1);
      break;
    case "monthly":
    default:
      now.setMonth(now.getMonth() + 1);
      break;
  }
  return now.toISOString();
}

/** Once a referred user goes premium, the referrer earns XP a single time. */
async function convertReferral(admin: SupabaseAdmin, profileId: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", profileId)
    .single();
  if (!profile?.referred_by) return;

  const { data: referral } = await admin
    .from("referrals")
    .select("id, status, referrer_id")
    .eq("referred_id", profileId)
    .single();
  if (!referral || referral.status !== "pending") return;

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
    await admin.from("profiles").update({ xp: referrer.xp + 500 }).eq("id", referral.referrer_id);
  }
  await grantAchievement(referral.referrer_id, "referral_1");
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaystackEvent;
  const admin = createAdminClient();
  const { data } = event;
  const customerCode = data.customer?.customer_code ?? null;

  // Resolve the profile: prefer our metadata, fall back to stored customer code.
  async function resolveProfileId(): Promise<string | null> {
    const metaId = data.metadata?.supabase_user_id;
    if (metaId) return metaId;
    if (customerCode) {
      const { data: p } = await admin
        .from("profiles")
        .select("id")
        .eq("paystack_customer_code", customerCode)
        .maybeSingle();
      return p?.id ?? null;
    }
    return null;
  }

  switch (event.event) {
    case "charge.success": {
      const profileId = await resolveProfileId();
      if (!profileId) break;
      await admin
        .from("profiles")
        .update({
          plan: "premium",
          subscription_status: "active",
          paystack_customer_code: customerCode,
          current_period_end: periodEndFromInterval(data.plan?.interval),
        })
        .eq("id", profileId);
      await convertReferral(admin, profileId);
      break;
    }

    case "subscription.create": {
      const profileId = await resolveProfileId();
      if (!profileId) break;
      await admin
        .from("profiles")
        .update({
          plan: "premium",
          subscription_status: "active",
          paystack_customer_code: customerCode,
          paystack_subscription_code: data.subscription_code ?? null,
          paystack_email_token: data.email_token ?? null,
          current_period_end:
            data.next_payment_date ?? periodEndFromInterval(data.plan?.interval),
        })
        .eq("id", profileId);
      await convertReferral(admin, profileId);
      break;
    }

    case "subscription.disable":
    case "subscription.not_renew": {
      // Don't revoke immediately — isPremium() honours current_period_end,
      // so access lasts until the paid period actually ends.
      if (!customerCode) break;
      await admin
        .from("profiles")
        .update({ subscription_status: "cancelled" })
        .eq("paystack_customer_code", customerCode);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
