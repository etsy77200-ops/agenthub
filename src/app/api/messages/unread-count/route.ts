import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";
import { getSupabaseUserFromRequest } from "@/lib/supabase-route-user";

type ConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const got = await getSupabaseUserFromRequest(req);
    if (!got) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const svc = createServiceSupabaseClient();
    if (!svc) return NextResponse.json({ unread: 0 });

    const uid = got.user.id;
    const { data: convos, error } = await svc
      .from("conversations")
      .select("id,buyer_id,seller_id,buyer_last_read_at,seller_last_read_at")
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`);
    if (error || !convos) return NextResponse.json({ unread: 0 });

    let unread = 0;
    for (const c of convos as ConversationRow[]) {
      const lastRead = c.buyer_id === uid ? c.buyer_last_read_at : c.seller_last_read_at;
      const q = svc
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .neq("sender_id", uid);
      if (lastRead) q.gt("created_at", lastRead);
      const { count } = await q;
      unread += count ?? 0;
    }

    return NextResponse.json({ unread });
  } catch {
    return NextResponse.json({ unread: 0 });
  }
}
