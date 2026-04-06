"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  agentAccessUrlErrorMessage,
  demoUrlErrorMessage,
  parseAgentAccessUrl,
  parseDemoUrl,
} from "@/lib/demo-url";
import { getStoredAccessToken } from "@/lib/supabase-rest";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CreateListingPage() {
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [priceType, setPriceType] = useState("fixed");
  const [billingType, setBillingType] = useState<"one_time" | "monthly" | "both">("one_time");
  const [tags, setTags] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [agentAccessUrl, setAgentAccessUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [catsFetched, setCatsFetched] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(true);
  const [payoutReady, setPayoutReady] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (catsFetched) return;

    const supabase = createClient();
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      setCategories(data || []);
      setCatsFetched(true);
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, catsFetched]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const headers: HeadersInit = { Accept: "application/json" };
        const t = getStoredAccessToken();
        if (t) headers.Authorization = `Bearer ${t}`;
        const res = await fetch("/api/seller/payout-readiness", {
          headers,
          credentials: "include",
        });
        if (cancelled) return;
        if (res.ok) {
          const j = (await res.json()) as { payout_ready?: boolean };
          setPayoutReady(Boolean(j.payout_ready));
        } else {
          setPayoutReady(false);
        }
      } catch {
        if (!cancelled) setPayoutReady(false);
      } finally {
        if (!cancelled) setPayoutLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const handleSubmit = async (e: React.FormEvent, status: "active" | "draft") => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setLoading(true);

    const demoParsed = parseDemoUrl(demoUrl);
    const agentParsed = parseAgentAccessUrl(agentAccessUrl);
    const oneTimeValue = Number(price);
    const monthlyValue = Number(monthlyPrice);
    const needsOneTime = billingType === "one_time" || billingType === "both";
    const needsMonthly = billingType === "monthly" || billingType === "both";
    if (needsOneTime && (!Number.isFinite(oneTimeValue) || oneTimeValue <= 0)) {
      setError("Add a valid one-time price greater than 0.");
      setLoading(false);
      return;
    }
    if (needsMonthly && (!Number.isFinite(monthlyValue) || monthlyValue <= 0)) {
      setError("Add a valid monthly price greater than 0.");
      setLoading(false);
      return;
    }
    if (status === "active") {
      if (!demoParsed) {
        setError(
          "A demo URL is required to publish. Buyers must be able to open a preview (video, live app, or interactive sandbox)."
        );
        setLoading(false);
        return;
      }
      if (!agentParsed) {
        setError(
          "An agent access URL (https) is required to publish. This is the link buyers get after they pay — your live app, API portal, or invite URL."
        );
        setLoading(false);
        return;
      }
    }
    if (agentAccessUrl.trim() && !agentParsed) {
      setError(agentAccessUrlErrorMessage());
      setLoading(false);
      return;
    }

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        short_description: shortDesc,
        description,
        category_id: category || null,
        price: needsOneTime ? oneTimeValue : 0,
        monthly_price: needsMonthly ? monthlyValue : null,
        price_type: priceType,
        billing_type: billingType,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        demo_url: demoUrl,
        agent_access_url: agentAccessUrl,
        status,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(payload.error || "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">Create a New Listing</h1>
      <p className="text-muted mb-8">List your AI agent on the marketplace</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!payoutLoading && !payoutReady && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-950 text-sm">
          <p className="font-medium mb-1">Finish payout setup to publish</p>
          <p className="text-amber-900/90 mb-3">
            Connect Stripe from your dashboard and complete onboarding so buyers can pay you. Until then, you can still
            save listings as <strong className="font-medium">draft</strong>.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex text-sm font-medium text-amber-950 underline hover:no-underline"
          >
            Go to dashboard &rarr; Connect Stripe
          </Link>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, "active")} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Agent Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., AI Customer Support Agent - 24/7 Multilingual"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
            maxLength={100}
          />
          <p className="text-xs text-muted mt-1">{title.length}/100 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Short Description *</label>
          <input
            type="text"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            placeholder="A brief one-liner about what your agent does"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
            maxLength={150}
          />
          <p className="text-xs text-muted mt-1">{shortDesc.length}/150 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Full Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your agent in detail. What does it do? What platforms does it integrate with? What makes it special?"
            rows={6}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Pricing Type *</label>
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly Rate</option>
              <option value="custom">Custom Quote</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Billing model *</label>
            <select
              value={billingType}
              onChange={(e) => setBillingType(e.target.value as "one_time" | "monthly" | "both")}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="one_time">One-time only</option>
              <option value="monthly">Monthly only</option>
              <option value="both">Offer both</option>
            </select>
          </div>
        </div>

        {(billingType === "one_time" || billingType === "both") && (
          <div>
            <label className="block text-sm font-medium mb-1.5">One-time price (USD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="499"
                min="1"
                className="w-full pl-8 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
            <p className="text-xs text-muted mt-1">
              Seller receives 85% (${price ? (Number(price) * 0.85).toFixed(2) : "0.00"}) per one-time purchase.
            </p>
          </div>
        )}

        {(billingType === "monthly" || billingType === "both") && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Monthly price (USD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
              <input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="49"
                min="1"
                className="w-full pl-8 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
            <p className="text-xs text-muted mt-1">
              Seller receives 85% (${monthlyPrice ? (Number(monthlyPrice) * 0.85).toFixed(2) : "0.00"}) per monthly renewal.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="customer-support, multilingual, zendesk (comma-separated)"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Demo URL {`(required to publish)`}</label>
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://codesandbox.io/... or https://www.loom.com/share/..."
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-muted mt-1">
            Use a public <strong className="font-medium text-foreground">https</strong> link buyers can open in a new tab: Loom/YouTube walkthrough, a staging app, or an{" "}
            <strong className="font-medium text-foreground">interactive sandbox</strong> (e.g. CodeSandbox, StackBlitz, Replit) so they can try the agent themselves.
            Drafts can be saved without a demo; publishing requires a valid URL.
          </p>
          {demoUrl.trim() && !parseDemoUrl(demoUrl) && (
            <p className="text-xs text-amber-700 mt-1">{demoUrlErrorMessage()}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Agent access URL {`(required to publish)`}</label>
          <input
            type="url"
            value={agentAccessUrl}
            onChange={(e) => setAgentAccessUrl(e.target.value)}
            placeholder="https://app.youragent.com/... or https://platform.openai.com/..."
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-muted mt-1">
            <strong className="font-medium text-foreground">https</strong> only. Buyers never see this on the listing
            page — it unlocks on <strong className="font-medium text-foreground">My purchases</strong> after payment
            succeeds. Use your production app link, hosted agent UI, or a sign-up / invite URL.
          </p>
          {agentAccessUrl.trim() && !parseAgentAccessUrl(agentAccessUrl) && (
            <p className="text-xs text-amber-700 mt-1">{agentAccessUrlErrorMessage()}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || payoutLoading || !payoutReady}
            title={
              !payoutReady && !payoutLoading
                ? "Complete Stripe Connect payout setup before publishing"
                : undefined
            }
            className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish Listing"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, "draft")}
            className="px-8 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}
