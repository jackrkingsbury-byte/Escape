import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth";
import { ReviewPanel } from "@/components/review/review-panel";
import type { WeeklyReviewContent } from "@/lib/types";

export const metadata = { title: "Weekly Review" };
export const dynamic = "force-dynamic";

function startOfWeek(d = new Date()): string {
  const date = new Date(d);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

export default async function ReviewPage() {
  const ctx = await getAuthedContext();
  if (!ctx) redirect("/login");
  const { supabase, user } = ctx;

  const { data: existing } = await supabase
    .from("weekly_reviews")
    .select("content")
    .eq("user_id", user.id)
    .eq("week_start", startOfWeek())
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <h1 className="font-display text-3xl font-bold text-white">Weekly Review</h1>
      <p className="mt-1 text-sm text-slate-400">
        An honest AI debrief of your week — generated from what you actually did.
      </p>
      <ReviewPanel existing={(existing?.content as WeeklyReviewContent) ?? null} />
    </div>
  );
}
