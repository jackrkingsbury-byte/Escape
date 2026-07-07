import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/agent/runAgent";
import { profileFromBusiness, DEMO_PROFILE } from "@/lib/agent/types";
import type { BusinessRow } from "@/lib/supabase/types";
import type { ConversationTurn } from "@/lib/agent/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Powers the dashboard "Test the AI" box. Runs the reply agent against a
 * typed message using the signed-in owner's business profile (or a demo
 * profile if they haven't onboarded yet). Auth-required.
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { message?: string; history?: ConversationTurn[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);

  const business = businesses?.[0] as BusinessRow | undefined;
  const profile = business ? profileFromBusiness(business) : DEMO_PROFILE;
  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

  const outcome = await runAgent(profile, history, message);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: 502 });
  }

  return NextResponse.json({
    result: outcome.result,
    usingDemoProfile: !business,
  });
}
