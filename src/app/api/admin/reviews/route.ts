import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";

function isAdminEmail(email: string | undefined): boolean {
  const admin = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  return Boolean(email && admin && email.toLowerCase().trim() === admin);
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const svc = createServiceSupabaseClient();
  if (!svc) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data, error } = await svc
    .from("reviews")
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      verified_purchase,
      listing_id,
      reviewer_id,
      listing:listings!reviews_listing_id_fkey(title),
      reviewer:profiles!reviews_reviewer_id_fkey(name, email)
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to load reviews" }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}
