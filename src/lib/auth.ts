import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface AuthedContext {
  supabase: SupabaseClient;
  user: User;
  profile: Profile;
}

/**
 * Resolves the current user + profile for API routes.
 * Returns null when unauthenticated — callers respond 401.
 */
export async function getAuthedContext(): Promise<AuthedContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return { supabase, user, profile: profile as Profile };
}
