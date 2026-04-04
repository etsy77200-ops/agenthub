import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";

function webhookSupabase() {
  const admin = createServiceSupabaseClient();
  if (admin) return admin;
  console.warn(
    "Stripe webhook: SUPABASE_SERVICE_ROLE_KEY is not set. Order updates will fail under RLS; set the service role key from Supabase Project Settings → API."
  );
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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
    const session = event.data.object as Stripe.Checkout.Session;
    const { listing_id, buyer_id } = session.metadata || {};

    if (listing_id && buyer_id) {
      const supabase = webhookSupabase();
      const pi = session.payment_intent;
      const paymentIntentId =
        typeof pi === "string"
          ? pi
          : pi && typeof pi === "object" && "id" in pi
            ? String((pi as { id: string }).id)
            : null;

      const updatePayload: {
        status: string;
        updated_at: string;
        stripe_payment_id?: string;
      } = {
        status: "accepted",
        updated_at: new Date().toISOString(),
      };
      if (paymentIntentId) {
        updatePayload.stripe_payment_id = paymentIntentId;
      }

      const { data: updatedRows, error: orderErr } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("stripe_payment_id", session.id)
        .select("id");

      if (orderErr) {
        console.error("Webhook order update:", orderErr);
      } else if (updatedRows && updatedRows.length > 0) {
        const { error: rpcErr } = await supabase.rpc("increment_order_count", {
          listing_id_input: listing_id,
        });
        if (rpcErr) {
          console.error("Webhook increment_order_count:", rpcErr);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
