import { NextRequest, NextResponse } from "next/server";
import { parseDemoUrl } from "@/lib/demo-url";
import { getConnectPayoutFlags } from "@/lib/stripe-connect-payout";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const PRICE_TYPES = new Set(["fixed", "hourly", "custom"]);
const STATUSES = new Set(["active", "draft"]);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;

    const title = String(body.title ?? "").trim();
    const short_description = String(body.short_description ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category_id =
      body.category_id === null || body.category_id === ""
        ? null
        : String(body.category_id);
    const price = Number(body.price);
    const price_type = String(body.price_type ?? "fixed");
    const status = body.status === "active" ? "active" : "draft";

    const tagsRaw = body.tags;
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw.map((t) => String(t).trim()).filter(Boolean)
      : String(tagsRaw ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

    if (!title || title.length > 100) {
      return NextResponse.json({ error: "Title is required (max 100 characters)." }, { status: 400 });
    }
    if (!short_description || short_description.length > 150) {
      return NextResponse.json(
        { error: "Short description is required (max 150 characters)." },
        { status: 400 }
      );
    }
    if (!description) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }
    if (!category_id) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Price must be a positive number." }, { status: 400 });
    }
    if (!PRICE_TYPES.has(price_type)) {
      return NextResponse.json({ error: "Invalid pricing type." }, { status: 400 });
    }
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const demoParsed = parseDemoUrl(String(body.demo_url ?? ""));
    if (status === "active") {
      if (!demoParsed) {
        return NextResponse.json(
          {
            error:
              "A valid https demo URL is required to publish. Buyers must be able to open a preview before paying.",
          },
          { status: 400 }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_account_id")
        .eq("id", user.id)
        .single();

      const { payout_ready } = await getConnectPayoutFlags(profile?.stripe_account_id ?? null);
      if (!payout_ready) {
        return NextResponse.json(
          {
            error:
              "Finish Stripe payout setup before publishing. Connect your bank in the dashboard (Connect Stripe), complete onboarding, then try again. You can still save a draft.",
          },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        title,
        short_description,
        description,
        category_id,
        price,
        price_type,
        tags,
        demo_url: demoParsed,
        status,
      })
      .select("id")
      .single();

    if (error) {
      console.error("listings insert:", error);
      return NextResponse.json({ error: error.message || "Failed to create listing" }, { status: 400 });
    }

    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error("POST /api/listings:", e);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
