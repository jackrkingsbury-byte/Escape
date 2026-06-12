import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * OAuth / email-confirmation callback. Exchanges the auth code for a
 * session, attributes referrals, then routes to onboarding or dashboard.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const ref = url.searchParams.get("ref");
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("onboarded, referred_by")
    .eq("id", data.user.id)
    .single();

  // Referral attribution: only on first touch, never self-referral.
  if (ref && profile && !profile.referred_by) {
    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", ref.toUpperCase())
      .single();
    if (referrer && referrer.id !== data.user.id) {
      await admin.from("profiles").update({ referred_by: referrer.id }).eq("id", data.user.id);
      await admin
        .from("referrals")
        .insert({ referrer_id: referrer.id, referred_id: data.user.id })
        .select()
        .single();
    }
  }

  const destination = profile?.onboarded ? next : "/onboarding";
  return NextResponse.redirect(`${origin}${destination}`);
}
