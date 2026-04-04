import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client that bypasses RLS. Use for Stripe webhooks and other trusted backends.
 * Set SUPABASE_SERVICE_ROLE_KEY in .env.local / Vercel (never expose to the browser).
 */
export function createServiceSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
