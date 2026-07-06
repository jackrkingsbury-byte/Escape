import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicSupabaseEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Server Supabase client bound to the request cookies (App Router).
 * Returns null if Supabase isn't configured. Cookie writes are wrapped in
 * try/catch because Server Components cannot set cookies — the middleware
 * refreshes the session instead.
 */
export function createSupabaseServerClient() {
  const env = publicSupabaseEnv();
  if (!env) return null;

  const cookieStore = cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware handles refresh.
        }
      },
    },
  });
}
