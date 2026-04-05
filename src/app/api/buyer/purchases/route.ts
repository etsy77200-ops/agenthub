import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

const PAID_STATUSES = new Set(["accepted", "in_progress", "completed"]);

export async function GET(req: NextRequest) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const svc = createServiceSupabaseClient();
    if (!svc) {
      return NextResponse.json(
        { error: "Server is not configured to load purchases. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const { data: rows, error } = await svc
      .from("orders")
      .select(
        `
        id,
        listing_id,
        status,
        created_at,
        amount,
        listings (
          title,
          agent_access_url
        )
      `
      )
      .eq("buyer_id", got.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("buyer purchases:", error);
      return NextResponse.json({ error: "Failed to load purchases" }, { status: 500 });
    }

    type Row = {
      id: string;
      listing_id: string;
      status: string;
      created_at: string;
      amount: number;
      listings:
        | { title: string; agent_access_url: string | null }
        | { title: string; agent_access_url: string | null }[]
        | null;
    };

    const purchases = (rows || []).map((raw) => {
      const r = raw as Row;
      const L = r.listings;
      const listing = Array.isArray(L) ? L[0] : L;
      const title = listing?.title ?? "Listing";
      const accessRaw = String(listing?.agent_access_url ?? "").trim();
      const paid = PAID_STATUSES.has(r.status);
      return {
        order_id: r.id,
        listing_id: r.listing_id,
        listing_title: title,
        status: r.status,
        created_at: r.created_at,
        amount: r.amount,
        agent_access_url: paid && accessRaw ? accessRaw : null,
        access_pending: paid && !accessRaw,
        payment_pending: r.status === "pending",
      };
    });

    return NextResponse.json({ purchases });
  } catch (e) {
    console.error("GET /api/buyer/purchases:", e);
    return NextResponse.json({ error: "Failed to load purchases" }, { status: 500 });
  }
}
