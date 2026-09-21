import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Read the PUBLIC Supabase credentials (these are safe to ship to the browser).
// Unlike the server client (supabase.client.ts), this file intentionally does
// NOT import the service-role key — that secret must never leave the server.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let client: SupabaseClient | null = null;

/**
 * Browser-only Supabase client used for Realtime.
 *
 * Realtime opens a WebSocket to Supabase and pushes INSERT / UPDATE / DELETE
 * events for the `requests` table straight into the dashboard, so students and
 * admins see changes instantly without refreshing the page.
 *
 * It returns null when the public env vars are missing so the UI can degrade
 * gracefully (the dashboards keep working with server-rendered data).
 *
 * NOTE: Realtime events are filtered by Row Level Security using the anon key,
 * so the `requests` table needs an anon SELECT policy (see database/schema.sql)
 * or no events will be delivered to the browser.
 */
export function getRealtimeSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Realtime disabled: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.",
    );
    return null;
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }

  return client;
}