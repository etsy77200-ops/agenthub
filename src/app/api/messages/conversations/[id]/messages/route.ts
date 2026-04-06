import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

type ConversationMeta = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
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

async function sendMessageEmailIfConfigured(args: {
  toEmail: string;
  toName: string;
  fromName: string;
  listingTitle: string;
  message: string;
  conversationId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MESSAGE_FROM_EMAIL;
  if (!apiKey || !from) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agenthub-bice.vercel.app";
  const threadUrl = `${appUrl}/dashboard/messages/${args.conversationId}`;
  const body = {
    from,
    to: [args.toEmail],
    subject: `New AgentHub message about "${args.listingTitle}"`,
    html: `<p>Hi ${args.toName || "there"},</p>
<p><strong>${args.fromName || "Someone"}</strong> sent you a new message on AgentHub:</p>
<blockquote>${args.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</blockquote>
<p><a href="${threadUrl}">Open conversation</a></p>`,
  };
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Non-blocking notification
  }
}

async function loadConversationForUser(
  conversationId: string,
  userId: string
) {
  const svc = createServiceSupabaseClient();
  if (!svc) return { svc: null, error: "missing_service_role" as const, meta: null };

  const { data: meta, error } = await svc
    .from("conversations")
    .select(
      `
      id,
      listing_id,
      buyer_id,
      seller_id,
      listings!conversations_listing_id_fkey(id, title),
      buyer:profiles!conversations_buyer_id_fkey(id, name),
      seller:profiles!conversations_seller_id_fkey(id, name)
    `
    )
    .eq("id", conversationId)
    .single();

  if (error || !meta) return { svc, error: "not_found" as const, meta: null };
  if (meta.buyer_id !== userId && meta.seller_id !== userId) {
    return { svc, error: "forbidden" as const, meta: null };
  }
  return { svc, error: null, meta: meta as ConversationMeta };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await context.params;
    const conversationId = String(id ?? "").trim();
    if (!conversationId) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const loaded = await loadConversationForUser(conversationId, got.user.id);
    if (!loaded.svc) {
      return NextResponse.json(
        { error: "Server is not configured to load messages. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }
    if (loaded.error === "not_found") {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (loaded.error === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: rows, error } = await loaded.svc
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("messages list:", error);
      return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    }

    const listing = first(loaded.meta.listings);
    const buyer = first(loaded.meta.buyer);
    const seller = first(loaded.meta.seller);
    const isBuyer = loaded.meta.buyer_id === got.user.id;
    await loaded.svc
      .from("conversations")
      .update({
        ...(isBuyer
          ? { buyer_last_read_at: new Date().toISOString() }
          : { seller_last_read_at: new Date().toISOString() }),
      })
      .eq("id", conversationId);

    return NextResponse.json({
      conversation: {
        id: loaded.meta.id,
        listing_id: loaded.meta.listing_id,
        listing_title: listing?.title ?? "Listing",
        counterpart_name: isBuyer ? seller?.name ?? "Seller" : buyer?.name ?? "Buyer",
        role: isBuyer ? "buyer" : "seller",
      },
      messages: rows ?? [],
    });
  } catch (e) {
    console.error("GET /api/messages/conversations/[id]/messages:", e);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await context.params;
    const conversationId = String(id ?? "").trim();
    const body = (await req.json()) as { body?: string };
    const text = String(body.body ?? "").trim();

    if (!conversationId) return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    if (!text) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    if (text.length > 4000) return NextResponse.json({ error: "Message is too long." }, { status: 400 });

    const loaded = await loadConversationForUser(conversationId, got.user.id);
    if (!loaded.svc) {
      return NextResponse.json(
        { error: "Server is not configured to send messages. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }
    if (loaded.error === "not_found") {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (loaded.error === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: created, error } = await loaded.svc
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: got.user.id,
        body: text,
      })
      .select("id, sender_id, body, created_at")
      .single();

    if (error || !created) {
      console.error("messages insert:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    const isBuyer = loaded.meta.buyer_id === got.user.id;
    const recipientId = isBuyer ? loaded.meta.seller_id : loaded.meta.buyer_id;
    const senderId = got.user.id;
    const listing = first(loaded.meta.listings);
    const [recipientProfile, senderProfile] = await Promise.all([
      loaded.svc.from("profiles").select("email,name").eq("id", recipientId).maybeSingle(),
      loaded.svc.from("profiles").select("name").eq("id", senderId).maybeSingle(),
    ]);
    const recipientEmail = String(recipientProfile.data?.email ?? "").trim();
    if (recipientEmail) {
      await sendMessageEmailIfConfigured({
        toEmail: recipientEmail,
        toName: String(recipientProfile.data?.name ?? "").trim(),
        fromName: String(senderProfile.data?.name ?? "").trim() || "AgentHub user",
        listingTitle: listing?.title ?? "a listing",
        message: text,
        conversationId,
      });
    }

    return NextResponse.json({ message: created });
  } catch (e) {
    console.error("POST /api/messages/conversations/[id]/messages:", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
