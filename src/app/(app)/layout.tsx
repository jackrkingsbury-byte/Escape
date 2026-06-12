import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";
import { levelProgress, levelTitle } from "@/lib/gamification";
import { isPremium } from "@/lib/entitlements";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthedContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile.onboarded) redirect("/onboarding");

  const { profile } = ctx;
  const progress = levelProgress(profile.xp);

  return (
    <div className="flex min-h-screen">
      <AppNav
        name={profile.full_name ?? "Operator"}
        level={progress.level}
        levelTitle={levelTitle(progress.level)}
        levelPercent={progress.percent}
        streak={profile.current_streak}
        premium={isPremium(profile)}
      />
      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-8 lg:pb-10">{children}</main>
    </div>
  );
}
