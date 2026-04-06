"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { parseAgentAccessUrl, parseDemoUrl } from "@/lib/demo-url";

type Category = { id: string; name: string };

type Listing = {
  id: string;
  seller_id: string;
  title: string;
  short_description: string;
  description: string;
  category_id: string;
  price: number;
  monthly_price?: number | null;
  price_type: "fixed" | "hourly" | "custom";
  billing_type?: "one_time" | "monthly" | "both";
  tags: string[];
  demo_url?: string | null;
  agent_access_url?: string | null;
  status: "active" | "draft" | "paused";
};

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<Listing | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [{ data: listing }, { data: cats }] = await Promise.all([
          supabase.from("listings").select("*").eq("id", id).single(),
          supabase.from("categories").select("id,name").order("name"),
        ]);
        if (cancelled) return;
        if (!listing || listing.seller_id !== user.id) {
          setError("Listing not found or you do not own it.");
          setLoading(false);
          return;
        }
        setForm({
          ...listing,
          billing_type: listing.billing_type ?? "one_time",
          tags: Array.isArray(listing.tags) ? listing.tags : [],
        } as Listing);
        setCategories((cats ?? []) as Category[]);
      } catch {
        if (!cancelled) setError("Failed to load listing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, supabase, id]);

  const tagsText = useMemo(() => (form?.tags ?? []).join(", "), [form?.tags]);

  if (authLoading || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-muted animate-pulse">Loading...</div>;
  }
  if (!form) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-red-600">{error || "Listing unavailable."}</div>;
  }

  const update = <K extends keyof Listing>(k: K, v: Listing[K]) =>
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));

  const onSave = async () => {
    setError("");
    if (!parseDemoUrl(form.demo_url || "")) return setError("Please enter a valid demo URL.");
    if (!parseAgentAccessUrl(form.agent_access_url || "")) {
      return setError("Please enter a valid https agent access URL.");
    }
    const needsOneTime = form.billing_type === "one_time" || form.billing_type === "both";
    const needsMonthly = form.billing_type === "monthly" || form.billing_type === "both";
    if (needsOneTime && (!Number.isFinite(form.price) || form.price <= 0)) {
      return setError("One-time price must be greater than 0.");
    }
    if (needsMonthly && (!Number.isFinite(Number(form.monthly_price ?? 0)) || Number(form.monthly_price ?? 0) <= 0)) {
      return setError("Monthly price must be greater than 0.");
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Failed to save changes.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit listing</h1>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">Back to dashboard</Link>
      </div>
      {error && <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input className="w-full px-4 py-2.5 border rounded-lg" value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Short description</label>
          <input className="w-full px-4 py-2.5 border rounded-lg" value={form.short_description} onChange={(e) => update("short_description", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea className="w-full px-4 py-2.5 border rounded-lg" rows={6} value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select className="w-full px-4 py-2.5 border rounded-lg" value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select className="w-full px-4 py-2.5 border rounded-lg" value={form.status} onChange={(e) => update("status", e.target.value as Listing["status"])}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Billing</label>
          <select className="w-full px-4 py-2.5 border rounded-lg" value={form.billing_type ?? "one_time"} onChange={(e) => update("billing_type", e.target.value as Listing["billing_type"])}>
            <option value="one_time">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="both">Both</option>
          </select>
        </div>
        {(form.billing_type === "one_time" || form.billing_type === "both") && (
          <div>
            <label className="block text-sm font-medium mb-1">One-time price</label>
            <input type="number" className="w-full px-4 py-2.5 border rounded-lg" value={form.price} onChange={(e) => update("price", Number(e.target.value))} />
          </div>
        )}
        {(form.billing_type === "monthly" || form.billing_type === "both") && (
          <div>
            <label className="block text-sm font-medium mb-1">Monthly price</label>
            <input type="number" className="w-full px-4 py-2.5 border rounded-lg" value={form.monthly_price ?? ""} onChange={(e) => update("monthly_price", e.target.value ? Number(e.target.value) : null)} />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input className="w-full px-4 py-2.5 border rounded-lg" value={tagsText} onChange={(e) => update("tags", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Demo URL</label>
          <input className="w-full px-4 py-2.5 border rounded-lg" value={form.demo_url ?? ""} onChange={(e) => update("demo_url", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Agent access URL</label>
          <input className="w-full px-4 py-2.5 border rounded-lg" value={form.agent_access_url ?? ""} onChange={(e) => update("agent_access_url", e.target.value)} />
        </div>
      </div>

      <button onClick={onSave} disabled={saving} className="px-6 py-3 rounded-lg bg-primary text-white font-medium disabled:opacity-50">
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}
