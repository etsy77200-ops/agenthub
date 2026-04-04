import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function isAdminEmail(email: string | undefined): boolean {
  const admin = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  return Boolean(email && admin && email.toLowerCase().trim() === admin);
}

/**
 * Admin-only aggregate data. Requires ADMIN_EMAIL to match the session user
 * and profiles.is_admin = true in Supabase (see supabase-admin-secure.sql).
 */
export async function GET() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!adminEmail) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [usersRes, ordersRes, listingsRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("listings").select("*").order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    users: usersRes.data ?? [],
    orders: ordersRes.data ?? [],
    listings: listingsRes.data ?? [],
  });
}
