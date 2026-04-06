import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const svc = createServiceSupabaseClient();
    if (!svc) return NextResponse.json({ reviews: [] });
    const { id } = await context.params;
    const { data, error } = await svc
      .from("reviews")
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        verified_purchase,
        reviewer:profiles!reviews_reviewer_id_fkey(name)
      `
      )
      .eq("listing_id", id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("GET reviews:", error);
      return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
    }
    return NextResponse.json({ reviews: data ?? [] });
  } catch (e) {
    console.error("GET /api/listings/[id]/reviews:", e);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const svc = createServiceSupabaseClient();
    if (!svc) {
      return NextResponse.json({ error: "Server misconfigured (missing service role)." }, { status: 503 });
    }

    const { id: listingId } = await context.params;
    const body = (await req.json()) as { rating?: number; comment?: string };
    const rating = Number(body.rating ?? 0);
    const comment = String(body.comment ?? "").trim();
    if (![1, 2, 3, 4, 5].includes(rating)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }
    if (!comment || comment.length > 2000) {
      return NextResponse.json({ error: "Comment is required (max 2000 chars)." }, { status: 400 });
    }

    const { data: existingReview } = await svc
      .from("reviews")
      .select("id")
      .eq("listing_id", listingId)
      .eq("reviewer_id", got.user.id)
      .maybeSingle();
    if (existingReview?.id) {
      return NextResponse.json({ error: "You already reviewed this listing." }, { status: 400 });
    }

    const { data: order, error: orderErr } = await svc
      .from("orders")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", got.user.id)
      .in("status", ["completed", "accepted", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderErr || !order?.id) {
      return NextResponse.json({ error: "Only verified buyers can leave a review." }, { status: 403 });
    }

    const { error } = await svc.from("reviews").insert({
      order_id: order.id,
      listing_id: listingId,
      reviewer_id: got.user.id,
      rating,
      comment,
      verified_purchase: true,
    });
    if (error) {
      return NextResponse.json({ error: error.message || "Failed to save review." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/listings/[id]/reviews:", e);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
