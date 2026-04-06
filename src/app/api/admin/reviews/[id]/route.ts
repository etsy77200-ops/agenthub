import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createServiceSupabaseClient } from "@/lib/supabase-admin";

function isAdminEmail(email: string | undefined): boolean {
  const admin = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  return Boolean(email && admin && email.toLowerCase().trim() === admin);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  const { error } = await svc.from("reviews").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message || "Failed to delete review" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
