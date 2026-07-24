import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The browser client, and only the browser client.
 *
 * The anon key is designed to be public — every row is protected by row level
 * security in Postgres, so a stolen key still cannot read anyone's planner. The
 * service-role key must never appear in this app.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSyncConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  client ??= createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "peony.auth",
    },
  });
  return client;
}

/** The single table this app touches. */
export const PLANNER_TABLE = "planner_states";
