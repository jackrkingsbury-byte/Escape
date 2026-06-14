import crypto from "crypto";

/**
 * Paystack helper. Paystack is the payment processor for Life OS —
 * built for African businesses, supports ZAR subscriptions and webhooks.
 *
 * All amounts are in the smallest currency unit (kobo/cents): R99.00 = 9900.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

/** Plan codes are created in the Paystack dashboard (Products → Plans). */
export const PLAN_CODES = {
  monthly: () => process.env.PAYSTACK_PLAN_MONTHLY!,
  yearly: () => process.env.PAYSTACK_PLAN_YEARLY!,
} as const;

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

async function paystackFetch<T>(
  path: string,
  init?: RequestInit
): Promise<PaystackResponse<T>> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const json = (await res.json()) as PaystackResponse<T>;
  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack request failed (${res.status})`);
  }
  return json;
}

/**
 * Starts a subscription checkout. Returns a hosted Paystack URL to redirect
 * the user to. After payment, Paystack redirects back to `callbackUrl`.
 */
export async function initializeTransaction(params: {
  email: string;
  planCode: string;
  callbackUrl: string;
  userId: string;
}): Promise<{ authorizationUrl: string; reference: string }> {
  const json = await paystackFetch<{ authorization_url: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        plan: params.planCode,
        callback_url: params.callbackUrl,
        metadata: { supabase_user_id: params.userId },
      }),
    }
  );
  return {
    authorizationUrl: json.data.authorization_url,
    reference: json.data.reference,
  };
}

/**
 * Generates a one-time link the customer can use to manage (or cancel) their
 * subscription on Paystack — the closest equivalent to Stripe's portal.
 */
export async function generateSubscriptionManageLink(
  subscriptionCode: string
): Promise<string> {
  const json = await paystackFetch<{ link: string }>(
    `/subscription/${subscriptionCode}/manage/link`,
    { method: "GET" }
  );
  return json.data.link;
}

/** Verifies a webhook payload's `x-paystack-signature` (HMAC-SHA512). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");
  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
