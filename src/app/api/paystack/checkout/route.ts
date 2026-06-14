import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthedContext } from "@/lib/auth";
import { initializeTransaction, PLAN_CODES } from "@/lib/paystack";

const BodySchema = z.object({ interval: z.enum(["monthly", "yearly"]).default("monthly") });

export async function POST(request: Request) {
  const ctx = await getAuthedContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { user } = ctx;

  if (!user.email) {
    return NextResponse.json({ error: "no_email" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const planCode = PLAN_CODES[parsed.data.interval]();

  try {
    const { authorizationUrl } = await initializeTransaction({
      email: user.email,
      planCode,
      callbackUrl: `${appUrl}/dashboard?upgraded=1`,
      userId: user.id,
    });
    return NextResponse.json({ url: authorizationUrl });
  } catch (err) {
    console.error("paystack checkout init failed", err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
  }
}
