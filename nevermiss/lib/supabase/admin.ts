import { createClient } from "@supabase/supabase-js";
import { publicSupabaseEnv, supabaseServiceRoleKey } from "@/lib/env";

/**
 * Service-role Supabase client for server-side jobs and webhooks.
 * Bypasses RLS — NEVER import this into client components.
 * Returns null if Supabase or the service-role key isn't configured.
 *
 * Intentionally untyped: this client performs inserts/updates in webhooks
 * where the hand-written Database generic over-narrows write types. Read
 * results are explicitly cast to row types at each call site.
 */
export function createSupabaseAdminClient() {
  const env = publicSupabaseEnv();
  const serviceKey = supabaseServiceRoleKey();
  if (!env || !serviceKey) return null;

  return createClient(env.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
