import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

export async function GET(req: NextRequest) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) {
      return NextResponse.redirect(new URL("/auth/login", req.nextUrl.origin));
    }

    const svc = createServiceSupabaseClient();
    if (!svc) {
      const u = new URL("/dashboard/purchases", req.nextUrl.origin);
      u.searchParams.set("portal", "server_misconfigured");
      return NextResponse.redirect(u);
    }

    const orderId = req.nextUrl.searchParams.get("order_id")?.trim() || "";
    if (!orderId) {
      const u = new URL("/dashboard/purchases", req.nextUrl.origin);
      u.searchParams.set("portal", "missing_order");
      return NextResponse.redirect(u);
    }

    const { data: order, error } = await svc
      .from("orders")
      .select("id, buyer_id, purchase_type, stripe_subscription_id")
      .eq("id", orderId)
      .eq("buyer_id", got.user.id)
      .maybeSingle();

    if (error || !order) {
      const u = new URL("/dashboard/purchases", req.nextUrl.origin);
      u.searchParams.set("portal", "order_not_found");
      return NextResponse.redirect(u);
    }

    const purchaseType = String((order as { purchase_type?: string | null }).purchase_type ?? "");
    const subscriptionId = String(
      (order as { stripe_subscription_id?: string | null }).stripe_subscription_id ?? ""
    ).trim();
    if (purchaseType !== "monthly" || !subscriptionId) {
      const u = new URL("/dashboard/purchases", req.nextUrl.origin);
      u.searchParams.set("portal", "not_subscription");
      return NextResponse.redirect(u);
    }

    const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as {
      customer?: string | { id?: string } | null;
    };
    const customer =
      typeof sub.customer === "string"
        ? sub.customer
        : sub.customer && typeof sub.customer === "object" && sub.customer.id
          ? String(sub.customer.id)
          : "";

    if (!customer) {
      const u = new URL("/dashboard/purchases", req.nextUrl.origin);
      u.searchParams.set("portal", "missing_customer");
      return NextResponse.redirect(u);
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${req.nextUrl.origin}/dashboard/purchases`,
    });
    return NextResponse.redirect(portal.url);
  } catch (e) {
    console.error("GET /api/stripe/billing-portal:", e);
    const u = new URL("/dashboard/purchases", req.nextUrl.origin);
    u.searchParams.set("portal", "error");
    return NextResponse.redirect(u);
  }
}
