import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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

    // Don't allow buying your own listing
    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: "Cannot buy your own listing" }, { status: 400 });
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
      success_url: `${req.nextUrl.origin}/dashboard/orders?success=true`,
      cancel_url: `${req.nextUrl.origin}/listing/${listing.id}?cancelled=true`,
    };

    // If seller has Stripe account, use Connect with application fee
    if (listing.seller?.stripe_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: listing.seller.stripe_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Create order in database
    await supabase.from("orders").insert({
      buyer_id: user.id,
      listing_id: listing.id,
      seller_id: listing.seller_id,
      amount: listing.price,
      platform_fee: listing.price * (PLATFORM_FEE_PERCENT / 100),
      requirements: requirements || "",
      stripe_payment_id: session.id,
      status: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
