import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Browser Supabase client. Returns null if Supabase isn't configured yet,
 * so UI can show a "connect Supabase" state instead of crashing.
 * Construct lazily inside event handlers / effects (never at module top level).
 */
export function createSupabaseBrowserClient() {
  const env = publicSupabaseEnv();
  if (!env) return null;
  return createBrowserClient<Database>(env.url, env.anonKey);
}
