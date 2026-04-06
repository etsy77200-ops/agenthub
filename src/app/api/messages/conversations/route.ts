import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

type ConversationRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  listings:
    | { id: string; title: string }
    | { id: string; title: string }[]
    | null;
  buyer:
    | { id: string; name: string | null }
    | { id: string; name: string | null }[]
    | null;
  seller:
    | { id: string; name: string | null }
    | { id: string; name: string | null }[]
    | null;
};

function first<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const svc = createServiceSupabaseClient();
    if (!svc) {
      return NextResponse.json(
        { error: "Server is not configured to load messages. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const uid = got.user.id;
    const { data: rows, error } = await svc
      .from("conversations")
      .select(
        `
        id,
        listing_id,
        buyer_id,
        seller_id,
        created_at,
        updated_at,
        last_message_at,
        listings!conversations_listing_id_fkey(id, title),
        buyer:profiles!conversations_buyer_id_fkey(id, name),
        seller:profiles!conversations_seller_id_fkey(id, name)
      `
      )
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("messages conversations list:", error);
      return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
    }

    const conversations = (rows as ConversationRow[] | null | undefined ?? []).map((r) => {
      const listing = first(r.listings);
      const buyer = first(r.buyer);
      const seller = first(r.seller);
      const isBuyer = r.buyer_id === uid;
      const otherParty = isBuyer ? seller : buyer;
      return {
        id: r.id,
        listing_id: r.listing_id,
        listing_title: listing?.title ?? "Listing",
        counterpart_id: otherParty?.id ?? "",
        counterpart_name: otherParty?.name ?? (isBuyer ? "Seller" : "Buyer"),
        role: isBuyer ? "buyer" : "seller",
        created_at: r.created_at,
        updated_at: r.updated_at,
        last_message_at: r.last_message_at,
      };
    });

    return NextResponse.json({ conversations });
  } catch (e) {
    console.error("GET /api/messages/conversations:", e);
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const svc = createServiceSupabaseClient();
    if (!svc) {
      return NextResponse.json(
        { error: "Server is not configured to create messages. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as { listing_id?: string };
    const listingId = String(body.listing_id ?? "").trim();
    if (!listingId) {
      return NextResponse.json({ error: "listing_id is required" }, { status: 400 });
    }

    const { data: listing, error: listingErr } = await svc
      .from("listings")
      .select("id, seller_id")
      .eq("id", listingId)
      .single();
    if (listingErr || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.seller_id === got.user.id) {
      return NextResponse.json({ error: "Cannot message yourself on your own listing." }, { status: 400 });
    }

    const { data: existing, error: existingErr } = await svc
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", got.user.id)
      .eq("seller_id", listing.seller_id)
      .maybeSingle();
    if (existingErr) {
      console.error("messages conversation existing:", existingErr);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }
    if (existing?.id) {
      return NextResponse.json({ id: existing.id, existed: true });
    }

    const { data: created, error: createErr } = await svc
      .from("conversations")
      .insert({
        listing_id: listingId,
        buyer_id: got.user.id,
        seller_id: listing.seller_id,
      })
      .select("id")
      .single();
    if (createErr || !created) {
      console.error("messages conversation insert:", createErr);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    return NextResponse.json({ id: created.id, existed: false });
  } catch (e) {
    console.error("POST /api/messages/conversations:", e);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
