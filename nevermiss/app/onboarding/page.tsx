import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { site } from "@/lib/site";
import OnboardingForm from "@/components/OnboardingForm";
import type { BusinessRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = createSupabaseServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  const existing = (data?.[0] as BusinessRow | undefined) ?? null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500 text-sm text-white">N</span>
            {site.name}
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="container-page max-w-2xl py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {existing ? "Your business settings" : "Tell NeverMiss about your business"}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          This is everything the AI uses to answer your customers — it only ever
          works from what you put here. Takes about 5 minutes.
        </p>
        <div className="mt-8">
          <OnboardingForm userId={user.id} existing={existing} />
        </div>
      </main>
    </div>
  );
}
