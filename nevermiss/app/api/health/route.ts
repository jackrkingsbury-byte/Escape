import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Liveness probe, hit daily by Vercel Cron (see vercel.json).
 * The touch query keeps the free-tier Supabase project from hitting its
 * 7-day inactivity pause, which would silently break sign-in and webhooks.
 */
export async function GET() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, db: "unconfigured" });
  }
  try {
    const { error } = await supabase.from("businesses").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: false, db: "error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, db: "up" });
  } catch {
    return NextResponse.json({ ok: false, db: "unreachable" }, { status: 500 });
  }
}
