import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Use service-level client for webhooks (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    // If webhook secret is configured, verify signature
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  // Handle checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { listing_id, buyer_id, seller_id } = session.metadata || {};

    if (listing_id && buyer_id) {
      // Update order status
      await supabase
        .from("orders")
        .update({
          status: "accepted",
          stripe_payment_id: session.payment_intent,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_id", session.id);

      // Increment order count on listing
      await supabase.rpc("increment_order_count", { listing_id_input: listing_id });
    }
  }

  return NextResponse.json({ received: true });
}
