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

function toIsoFromUnixSeconds(ts: number | null | undefined): string | null {
  if (!ts || !Number.isFinite(ts)) return null;
  return new Date(ts * 1000).toISOString();
}

function mapSubscriptionToOrderStatus(status: string | null | undefined): "accepted" | "cancelled" {
  // Keep access for active/trialing/past_due; cancel for terminal states.
  if (status === "active" || status === "trialing" || status === "past_due") return "accepted";
  return "cancelled";
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = invoice as unknown as {
    subscription?: string | { id?: string } | null;
    parent?: { subscription_details?: { subscription?: string | { id?: string } | null } } | null;
  };
  const direct = raw.subscription;
  if (typeof direct === "string") return direct;
  if (direct && typeof direct === "object" && direct.id) return String(direct.id);

  const nested = raw.parent?.subscription_details?.subscription;
  if (typeof nested === "string") return nested;
  if (nested && typeof nested === "object" && nested.id) return String(nested.id);
  return null;
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

  const supabase = webhookSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { listing_id, buyer_id, purchase_type } = session.metadata || {};

    if (listing_id && buyer_id) {
      const isMonthly = purchase_type === "monthly";
      const pi = session.payment_intent;
      const paymentIntentId =
        typeof pi === "string"
          ? pi
          : pi && typeof pi === "object" && "id" in pi
            ? String((pi as { id: string }).id)
            : null;

      const rawSub = session.subscription;
      const subscriptionId =
        typeof rawSub === "string"
          ? rawSub
          : rawSub && typeof rawSub === "object" && "id" in rawSub
            ? String((rawSub as { id: string }).id)
            : null;

      let subscriptionStatus: string | null = null;
      let currentPeriodEnd: string | null = null;
      if (isMonthly && subscriptionId) {
        try {
          const sub = (await stripe.subscriptions.retrieve(
            subscriptionId
          )) as unknown as Stripe.Subscription;
          subscriptionStatus = sub.status;
          currentPeriodEnd = toIsoFromUnixSeconds(
            (sub as unknown as { current_period_end?: number }).current_period_end
          );
        } catch (e) {
          console.error("Webhook subscription retrieve:", e);
        }
      }

      const updatePayload: {
        status: string;
        updated_at: string;
        purchase_type: "one_time" | "monthly";
        stripe_payment_id?: string;
        stripe_subscription_id?: string;
        stripe_subscription_status?: string | null;
        subscription_current_period_end?: string | null;
        subscription_cancelled_at?: string | null;
      } = {
        status: "accepted",
        updated_at: new Date().toISOString(),
        purchase_type: isMonthly ? "monthly" : "one_time",
      };
      if (!isMonthly && paymentIntentId) {
        updatePayload.stripe_payment_id = paymentIntentId;
      }
      if (isMonthly && subscriptionId) {
        updatePayload.stripe_subscription_id = subscriptionId;
        updatePayload.stripe_subscription_status = subscriptionStatus;
        updatePayload.subscription_current_period_end = currentPeriodEnd;
        updatePayload.subscription_cancelled_at = null;
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

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = getInvoiceSubscriptionId(invoice);
    if (subscriptionId) {
      let subscriptionStatus: string | null = null;
      let currentPeriodEnd: string | null = null;
      try {
        const sub = (await stripe.subscriptions.retrieve(
          subscriptionId
        )) as unknown as Stripe.Subscription;
        subscriptionStatus = sub.status;
        currentPeriodEnd = toIsoFromUnixSeconds(
          (sub as unknown as { current_period_end?: number }).current_period_end
        );
      } catch (e) {
        console.error("Webhook invoice.paid subscription retrieve:", e);
      }
      const payload: {
        status: string;
        updated_at: string;
        purchase_type: "monthly";
        stripe_subscription_status?: string;
        stripe_last_invoice_id?: string | null;
        subscription_current_period_end?: string | null;
      } = {
        status: "accepted",
        updated_at: new Date().toISOString(),
        purchase_type: "monthly",
      };
      if (subscriptionStatus) payload.stripe_subscription_status = subscriptionStatus;
      payload.stripe_last_invoice_id = invoice.id ?? null;
      payload.subscription_current_period_end = currentPeriodEnd;

      const { error } = await supabase
        .from("orders")
        .update(payload)
        .eq("stripe_subscription_id", subscriptionId);
      if (error) console.error("Webhook invoice.paid order update:", error);
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const orderStatus = mapSubscriptionToOrderStatus(subscription.status);
    const { error } = await supabase
      .from("orders")
      .update({
        purchase_type: "monthly",
        status: orderStatus,
        updated_at: new Date().toISOString(),
        stripe_subscription_status: subscription.status,
        subscription_current_period_end: toIsoFromUnixSeconds(
          (subscription as unknown as { current_period_end?: number }).current_period_end
        ),
        subscription_cancelled_at: toIsoFromUnixSeconds(subscription.canceled_at),
      })
      .eq("stripe_subscription_id", subscription.id);
    if (error) {
      console.error("Webhook subscription update order:", error);
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = getInvoiceSubscriptionId(invoice);
    if (subscriptionId) {
      const { error } = await supabase
        .from("orders")
        .update({
          purchase_type: "monthly",
          status: "cancelled",
          updated_at: new Date().toISOString(),
          stripe_subscription_status: "payment_failed",
          stripe_last_invoice_id: invoice.id ?? null,
        })
        .eq("stripe_subscription_id", subscriptionId);
      if (error) console.error("Webhook invoice.payment_failed order update:", error);
    }
  }

  return NextResponse.json({ received: true });
}
