import { NextRequest, NextResponse } from "next/server";
import { parseAgentAccessUrl, parseDemoUrl } from "@/lib/demo-url";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const BILLING_TYPES = new Set(["one_time", "monthly", "both"]);
const PRICE_TYPES = new Set(["fixed", "hourly", "custom"]);
const STATUSES = new Set(["active", "draft", "paused"]);

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    return NextResponse.json({ listing: data });
  } catch {
    return NextResponse.json({ error: "Failed to load listing" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: existing, error: existingErr } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();
    if (existingErr || !existing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (existing.seller_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await req.json()) as Record<string, unknown>;
    const title = String(body.title ?? existing.title).trim();
    const short_description = String(body.short_description ?? existing.short_description).trim();
    const description = String(body.description ?? existing.description).trim();
    const category_id = String(body.category_id ?? existing.category_id).trim();
    const price_type = String(body.price_type ?? existing.price_type);
    const billing_type = String(body.billing_type ?? existing.billing_type ?? "one_time");
    const status = String(body.status ?? existing.status);
    const price = Number(body.price ?? existing.price ?? 0);
    const monthly_price_raw = body.monthly_price ?? existing.monthly_price;
    const monthly_price =
      monthly_price_raw === null || monthly_price_raw === undefined || String(monthly_price_raw).trim() === ""
        ? null
        : Number(monthly_price_raw);
    const tagsRaw = body.tags ?? existing.tags ?? [];
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw.map((x) => String(x).trim()).filter(Boolean)
      : String(tagsRaw).split(",").map((x) => x.trim()).filter(Boolean);
    const demo_url = parseDemoUrl(String(body.demo_url ?? existing.demo_url ?? ""));
    const agent_access_url = parseAgentAccessUrl(
      String(body.agent_access_url ?? existing.agent_access_url ?? "")
    );

    if (!title || title.length > 100) return NextResponse.json({ error: "Invalid title." }, { status: 400 });
    if (!short_description || short_description.length > 150) {
      return NextResponse.json({ error: "Invalid short description." }, { status: 400 });
    }
    if (!description) return NextResponse.json({ error: "Description is required." }, { status: 400 });
    if (!category_id) return NextResponse.json({ error: "Category is required." }, { status: 400 });
    if (!PRICE_TYPES.has(price_type)) return NextResponse.json({ error: "Invalid pricing type." }, { status: 400 });
    if (!STATUSES.has(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    if (!BILLING_TYPES.has(billing_type)) return NextResponse.json({ error: "Invalid billing type." }, { status: 400 });

    const needsOneTime = billing_type === "one_time" || billing_type === "both";
    const needsMonthly = billing_type === "monthly" || billing_type === "both";
    if (needsOneTime && (!Number.isFinite(price) || price <= 0)) {
      return NextResponse.json({ error: "One-time price must be > 0." }, { status: 400 });
    }
    if (needsMonthly && (!Number.isFinite(monthly_price) || (monthly_price ?? 0) <= 0)) {
      return NextResponse.json({ error: "Monthly price must be > 0." }, { status: 400 });
    }
    if (status === "active") {
      if (!demo_url) return NextResponse.json({ error: "A valid demo URL is required." }, { status: 400 });
      if (!agent_access_url) {
        return NextResponse.json({ error: "A valid agent access URL is required." }, { status: 400 });
      }
    }

    // Save version snapshot before update (best effort).
    await supabase.from("listing_revisions").insert({
      listing_id: existing.id,
      edited_by: user.id,
      snapshot: existing,
    });

    const { error: updateErr } = await supabase
      .from("listings")
      .update({
        title,
        short_description,
        description,
        category_id,
        price,
        monthly_price: needsMonthly ? monthly_price : null,
        price_type,
        billing_type,
        tags,
        demo_url,
        agent_access_url,
        status,
      })
      .eq("id", existing.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message || "Failed to update listing" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/listings/[id]:", e);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
