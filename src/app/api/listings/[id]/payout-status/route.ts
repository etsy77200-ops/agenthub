import { NextRequest, NextResponse } from "next/server";
import { getConnectPayoutFlags } from "@/lib/stripe-connect-payout";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Public read: whether the listing's seller can receive Connect payouts (Stripe onboarding).
 * Does not expose stripe_account_id to the client.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await context.params;
    const supabase = await createServerSupabaseClient();

    const { data: listing, error } = await supabase
      .from("listings")
      .select("id, seller:profiles!listings_seller_id_fkey(stripe_account_id)")
      .eq("id", listingId)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rawSeller = listing.seller as
      | { stripe_account_id: string | null }
      | { stripe_account_id: string | null }[]
      | null;
    const seller = Array.isArray(rawSeller) ? rawSeller[0] ?? null : rawSeller;
    const flags = await getConnectPayoutFlags(seller?.stripe_account_id ?? null);
    return NextResponse.json(flags);
  } catch (e) {
    console.error("payout-status:", e);
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}
