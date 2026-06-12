import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { getAuthedContext } from "@/lib/auth";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const ctx = await getAuthedContext();
  if (!ctx) redirect("/login");
  if (ctx.profile.onboarded) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <OnboardingWizard />
    </main>
  );
}
