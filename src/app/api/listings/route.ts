import { NextRequest, NextResponse } from "next/server";
import {
  agentAccessUrlErrorMessage,
  parseAgentAccessUrl,
  parseDemoUrl,
} from "@/lib/demo-url";
import { getConnectPayoutFlags } from "@/lib/stripe-connect-payout";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const PRICE_TYPES = new Set(["fixed", "hourly", "custom"]);
const STATUSES = new Set(["active", "draft"]);
const BILLING_TYPES = new Set(["one_time", "monthly", "both"]);

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
    const monthly_price_raw = body.monthly_price;
    const monthly_price =
      monthly_price_raw === null || monthly_price_raw === undefined || String(monthly_price_raw).trim() === ""
        ? null
        : Number(monthly_price_raw);
    const price_type = String(body.price_type ?? "fixed");
    const billing_type = String(body.billing_type ?? "one_time");
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
    if (!BILLING_TYPES.has(billing_type)) {
      return NextResponse.json({ error: "Invalid billing model." }, { status: 400 });
    }
    const needsOneTime = billing_type === "one_time" || billing_type === "both";
    const needsMonthly = billing_type === "monthly" || billing_type === "both";
    if (needsOneTime && (!Number.isFinite(price) || price <= 0)) {
      return NextResponse.json({ error: "One-time price must be a positive number." }, { status: 400 });
    }
    if (!needsOneTime && !Number.isFinite(price)) {
      return NextResponse.json({ error: "Invalid one-time price value." }, { status: 400 });
    }
    if (needsMonthly && (!Number.isFinite(monthly_price) || (monthly_price ?? 0) <= 0)) {
      return NextResponse.json({ error: "Monthly price must be a positive number." }, { status: 400 });
    }
    if (!needsMonthly && monthly_price !== null && !Number.isFinite(monthly_price)) {
      return NextResponse.json({ error: "Invalid monthly price value." }, { status: 400 });
    }
    if (!PRICE_TYPES.has(price_type)) {
      return NextResponse.json({ error: "Invalid pricing type." }, { status: 400 });
    }
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const demoParsed = parseDemoUrl(String(body.demo_url ?? ""));
    const agentAccessRaw = String(body.agent_access_url ?? "").trim();
    const agentAccessParsed = parseAgentAccessUrl(String(body.agent_access_url ?? ""));
    if (agentAccessRaw && !agentAccessParsed) {
      return NextResponse.json({ error: agentAccessUrlErrorMessage() }, { status: 400 });
    }
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
      if (!agentAccessParsed) {
        return NextResponse.json(
          {
            error:
              "A valid https agent access URL is required to publish. This is the link buyers receive after they pay (production app, portal, or invite).",
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
        monthly_price: needsMonthly ? monthly_price : null,
        price_type,
        billing_type,
        tags,
        demo_url: demoParsed,
        agent_access_url: agentAccessParsed,
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
