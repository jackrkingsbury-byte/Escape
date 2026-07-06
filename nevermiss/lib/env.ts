/**
 * Environment access with safe, phased behaviour.
 *
 * Supabase may not be configured yet (early in the build-out). Rather than
 * crash the app — and the revenue-critical landing page — these helpers return
 * `null` when env vars are absent, and callers degrade gracefully.
 */

export type PublicSupabaseEnv = { url: string; anonKey: string };

/** Browser-safe Supabase config, or null if not configured. */
export function publicSupabaseEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** True when Supabase is wired up. */
export function isSupabaseConfigured(): boolean {
  return publicSupabaseEnv() !== null;
}

/** Server-only service-role key (bypasses RLS). Never expose to the browser. */
export function supabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}
