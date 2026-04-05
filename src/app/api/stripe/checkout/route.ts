import { NextRequest, NextResponse } from "next/server";
import { parseAgentAccessUrl } from "@/lib/demo-url";
import { getConnectPayoutFlags } from "@/lib/stripe-connect-payout";
import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

export async function POST(req: NextRequest) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { user, supabase } = got;

    const { listing_id, requirements } = await req.json();

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*, seller:profiles!listings_seller_id_fkey(*)")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "active") {
      return NextResponse.json({ error: "This listing is not available for purchase." }, { status: 400 });
    }

    // Don't allow buying your own listing
    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: "Cannot buy your own listing" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const demo = String((listing as any).demo_url ?? "").trim();
    if (listing.status === "active" && !demo) {
      return NextResponse.json(
        { error: "This listing does not include a demo URL and cannot be purchased." },
        { status: 400 }
      );
    }

    const agentAccess = parseAgentAccessUrl(String((listing as any).agent_access_url ?? ""));
    if (listing.status === "active" && !agentAccess) {
      return NextResponse.json(
        {
          error:
            "This listing is missing a valid agent access URL. The seller must add an https link buyers receive after purchase.",
        },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSeller = (listing as any).seller as
      | { stripe_account_id?: string | null }
      | { stripe_account_id?: string | null }[]
      | null
      | undefined;
    const sellerRow = Array.isArray(rawSeller) ? rawSeller[0] : rawSeller;
    const sellerStripeAccountId = sellerRow?.stripe_account_id?.trim() || null;
    const { payout_ready } = await getConnectPayoutFlags(sellerStripeAccountId);
    if (!payout_ready) {
      return NextResponse.json(
        {
          error:
            "This listing cannot be purchased yet because the seller has not finished Stripe payout setup.",
        },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(listing.price * 100);
    const platformFee = Math.round(amountInCents * (PLATFORM_FEE_PERCENT / 100));

    // Create Stripe Checkout Session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: any = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listing.title,
              description: listing.short_description,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        requirements: requirements || "",
        platform_fee: platformFee.toString(),
      },
      success_url: `${req.nextUrl.origin}/dashboard/purchases?checkout=success`,
      cancel_url: `${req.nextUrl.origin}/listing/${listing.id}?cancelled=true`,
    };

    // Use normalized seller row — PostgREST may return seller as an array; listing.seller?.stripe_account_id would be wrong.
    if (sellerStripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: sellerStripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    const { error: insertError } = await supabase.from("orders").insert({
      buyer_id: user.id,
      listing_id: listing.id,
      seller_id: listing.seller_id,
      amount: listing.price,
      platform_fee: listing.price * (PLATFORM_FEE_PERCENT / 100),
      requirements: requirements || "",
      stripe_payment_id: session.id,
      status: "pending",
    });

    if (insertError) {
      console.error("Checkout order insert:", insertError);
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        { error: "Could not create your order. You were not charged. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
