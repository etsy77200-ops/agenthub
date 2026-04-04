import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Resolve the Supabase user for API routes: cookie session first, then Authorization Bearer JWT.
 * The JS client's getUser() does not always infer the user from headers alone — pass the JWT to getUser(jwt).
 */
export async function getSupabaseUserFromRequest(
  req: NextRequest
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieClient = await createServerSupabaseClient();
  const {
    data: { user: cookieUser },
  } = await cookieClient.auth.getUser();
  if (cookieUser) {
    return { user: cookieUser, supabase: cookieClient };
  }

  const auth = req.headers.get("authorization");
  const jwt = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!jwt) return null;

  const bearerClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data, error } = await bearerClient.auth.getUser(jwt);
  if (error || !data.user) return null;
  return { user: data.user, supabase: bearerClient };
}
