import { NextRequest, NextResponse } from "next/server";
import { getConnectPayoutFlags } from "@/lib/stripe-connect-payout";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

/** Authenticated: current user's Connect payout status (for dashboard / create listing). */
export async function GET(req: NextRequest) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { user, supabase } = got;
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    const flags = await getConnectPayoutFlags(profile?.stripe_account_id ?? null);
    return NextResponse.json(flags);
  } catch (e) {
    console.error("payout-readiness:", e);
    return NextResponse.json({ error: "Failed to load payout status" }, { status: 500 });
  }
}
