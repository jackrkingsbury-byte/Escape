import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth";
import { CoachChat } from "@/components/coach/chat";

export const metadata = { title: "AI Coach" };
export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const ctx = await getAuthedContext();
  if (!ctx) redirect("/login");
  const { supabase, user } = ctx;

  const { data: history } = await supabase
    .from("coach_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  const initialMessages = (history ?? [])
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <h1 className="font-display text-3xl font-bold text-white">AI Coach</h1>
      <p className="mt-1 text-sm text-slate-400">
        Always on. Knows your goals, your streak and your history.
      </p>
      <div className="mt-6">
        <CoachChat initialMessages={initialMessages} />
      </div>
    </div>
  );
}
