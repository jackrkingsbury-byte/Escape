import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on each request so Server Components
 * always see a valid session. No-ops entirely when Supabase isn't configured,
 * so the marketing site keeps working before auth is wired up.
 */
export async function middleware(request: NextRequest) {
  const env = publicSupabaseEnv();
  if (!env) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touch the session so tokens are refreshed and cookies re-set.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Run on pages only — skip static assets, images, and /api. API routes
    // (Twilio webhooks, drafts, demo) do their own auth via the server
    // client; running session refresh on webhook POSTs just adds latency.
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
