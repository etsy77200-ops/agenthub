import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

/**
 * Whether the current user has a Stripe Connect account id saved on their profile.
 * Supports cookie session (SSR) and `Authorization: Bearer` from the same token the client stores in localStorage.
 */
export async function GET(req: NextRequest) {
  const got = await getSupabaseUserFromRequest(req);
  if (!got) {
    return NextResponse.json({ authenticated: false, connected: false }, { status: 401 });
  }

  const { user, supabase } = got;
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  const connected = Boolean(profile?.stripe_account_id?.trim());
  return NextResponse.json({ authenticated: true, connected });
}
