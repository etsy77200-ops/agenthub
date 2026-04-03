import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Create Stripe Connect account for sellers
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // If seller already has a Stripe account, create a new login link
    if (profile.stripe_account_id) {
      const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id);
      return NextResponse.json({ url: loginLink.url });
    }

    // Create new Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      metadata: {
        user_id: user.id,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Save Stripe account ID to profile
    await supabase
      .from("profiles")
      .update({ stripe_account_id: account.id })
      .eq("id", user.id);

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.nextUrl.origin}/dashboard?stripe=refresh`,
      return_url: `${req.nextUrl.origin}/dashboard?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe Connect error:", err);
    return NextResponse.json({ error: "Failed to setup Stripe Connect" }, { status: 500 });
  }
}
