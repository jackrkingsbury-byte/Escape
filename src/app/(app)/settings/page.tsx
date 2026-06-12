import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth";
import { isPremium } from "@/lib/entitlements";
import { ProfileForm } from "@/components/settings/profile-form";
import { ReferralCard } from "@/components/settings/referral-card";
import { ManageBillingButton } from "@/components/settings/billing-buttons";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await getAuthedContext();
  if (!ctx) redirect("/login");
  const { supabase, user, profile } = ctx;

  const { count: converted } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .eq("status", "converted");

  const premium = isPremium(profile);

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-6">
      <h1 className="font-display text-3xl font-bold text-white">Settings</h1>

      <ProfileForm
        userId={user.id}
        fullName={profile.full_name ?? ""}
        focusAreas={profile.focus_areas}
        intensity={profile.intensity}
      />

      {/* Billing */}
      <div className="glass p-6">
        <h2 className="font-display text-lg font-semibold text-white">Plan & billing</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300">
              Current plan:{" "}
              {premium ? (
                <span className="font-semibold text-ember-300">✨ Premium</span>
              ) : (
                <span className="font-semibold text-slate-400">Free</span>
              )}
            </p>
            {premium && profile.current_period_end && (
              <p className="mt-1 text-xs text-slate-500">
                Renews {new Date(profile.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          {premium ? (
            <ManageBillingButton />
          ) : (
            <Link href="/pricing" className="btn-ember">
              ✨ Upgrade to Premium
            </Link>
          )}
        </div>
      </div>

      <ReferralCard code={profile.referral_code} converted={converted ?? 0} />

      {/* Account */}
      <div className="glass p-6">
        <h2 className="font-display text-lg font-semibold text-white">Account</h2>
        <p className="mt-2 text-sm text-slate-400">Signed in as {user.email}</p>
      </div>
    </div>
  );
}
