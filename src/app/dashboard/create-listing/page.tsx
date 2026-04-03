"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
  const [priceType, setPriceType] = useState("fixed");
  const [tags, setTags] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [catsFetched, setCatsFetched] = useState(false);

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
  }, [user, authLoading, router, catsFetched]);

  const handleSubmit = async (e: React.FormEvent, status: "active" | "draft") => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("listings").insert({
      seller_id: user.id,
      title,
      short_description: shortDesc,
      description,
      category_id: category || null,
      price: Number(price),
      price_type: priceType,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      demo_url: demoUrl || null,
      status,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
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

        <div>
          <label className="block text-sm font-medium mb-1.5">Price (USD) *</label>
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
            You&apos;ll receive 85% (${price ? (Number(price) * 0.85).toFixed(2) : "0.00"}). AgentHub takes a 15% platform fee.
          </p>
        </div>

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
          <label className="block text-sm font-medium mb-1.5">Demo URL (optional)</label>
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://demo.youragent.com"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
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
