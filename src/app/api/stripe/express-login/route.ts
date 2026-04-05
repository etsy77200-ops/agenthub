import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Opens Stripe Express in a new tab via a normal link (no async window.open).
 * Requires Supabase session cookies (same as the rest of the dashboard).
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    const login = new URL("/auth/login", req.nextUrl.origin);
    login.searchParams.set("next", "/dashboard");
    return NextResponse.redirect(login);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  const accountId = String(profile?.stripe_account_id ?? "").trim();
  if (!accountId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return NextResponse.redirect(loginLink.url);
  } catch (e) {
    console.error("GET /api/stripe/express-login:", e);
    const dash = new URL("/dashboard", req.nextUrl.origin);
    dash.searchParams.set("stripe", "express_error");
    return NextResponse.redirect(dash);
  }
}
