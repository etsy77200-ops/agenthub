import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

const PAID_STATUSES = new Set(["accepted", "in_progress", "completed"]);

/**
 * Returns whether the current user has paid for this listing and may open the agent access URL.
 * Uses service role so agent_access_url is never exposed via public listing reads.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: listingId } = await context.params;
    const svc = createServiceSupabaseClient();
    if (!svc) {
      return NextResponse.json(
        { error: "Server is not configured to unlock purchases. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const { data: order, error: orderErr } = await svc
      .from("orders")
      .select("id, status")
      .eq("buyer_id", got.user.id)
      .eq("listing_id", listingId)
      .in("status", ["pending", "accepted", "in_progress", "completed", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderErr) {
      console.error("buyer-access order:", orderErr);
      return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
    }

    if (!order || order.status === "cancelled") {
      return NextResponse.json({ unlocked: false, reason: "no_order" });
    }

    if (!PAID_STATUSES.has(order.status)) {
      return NextResponse.json({
        unlocked: false,
        reason: "pending_payment",
        status: order.status,
      });
    }

    const { data: listing, error: listErr } = await svc
      .from("listings")
      .select("agent_access_url")
      .eq("id", listingId)
      .single();

    if (listErr || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const url = String((listing as { agent_access_url?: string | null }).agent_access_url ?? "").trim();
    if (!url) {
      return NextResponse.json({
        unlocked: false,
        reason: "missing_url",
        status: order.status,
      });
    }

    return NextResponse.json({
      unlocked: true,
      agent_access_url: url,
      status: order.status,
    });
  } catch (e) {
    console.error("buyer-access:", e);
    return NextResponse.json({ error: "Failed to load access" }, { status: 500 });
  }
}
