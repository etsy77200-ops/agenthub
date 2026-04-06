"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ListingCard from "@/components/listings/ListingCard";
import { CATEGORIES, MOCK_LISTINGS } from "@/lib/constants";
import { CATEGORY_INTROS } from "@/lib/category-intros";
import type { Listing } from "@/types";

function categorySlugFromUrl(raw: string | null): string | null {
  if (!raw) return null;
  return CATEGORIES.some((c) => c.slug === raw) ? raw : null;
}

export default function BrowseContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() =>
    categorySlugFromUrl(searchParams.get("category"))
  );
  const [sortBy, setSortBy] = useState<"rating" | "price-low" | "price-high" | "popular">("popular");

  useEffect(() => {
    const next = categorySlugFromUrl(searchParams.get("category"));
    setSelectedCategory(next);
  }, [searchParams]);

  const listings = MOCK_LISTINGS as unknown as Listing[];

  const filtered = useMemo(() => {
    let results = [...listings];

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.short_description.toLowerCase().includes(q) ||
          l.tags?.some((t) => t.includes(q))
      );
    }

    if (selectedCategory) {
      const cat = CATEGORIES.find((c) => c.slug === selectedCategory);
      if (cat) {
        results = results.filter((l) => l.category_id === cat.id);
      }
    }

    switch (sortBy) {
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        results.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        results.sort((a, b) => b.order_count - a.order_count);
        break;
    }

    return results;
  }, [listings, search, selectedCategory, sortBy]);

  const intro = selectedCategory ? CATEGORY_INTROS[selectedCategory] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{intro?.title ?? "Browse AI Agents"}</h1>
        <p className="text-muted max-w-3xl">
          {intro?.description ?? "Discover production-ready AI agents for your business."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-xl bg-white/90 backdrop-blur-sm transition-all duration-200 hover:border-primary/35 hover:shadow-md hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:-translate-y-0.5"
          />
        </div>
        <select
          value={selectedCategory || ""}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-4 py-2.5 border border-border rounded-xl bg-white/90 backdrop-blur-sm transition-all duration-200 hover:border-primary/35 hover:shadow-md hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:-translate-y-0.5"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2.5 border border-border rounded-xl bg-white/90 backdrop-blur-sm transition-all duration-200 hover:border-primary/35 hover:shadow-md hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:-translate-y-0.5"
        >
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
            !selectedCategory
              ? "bg-primary text-white shadow-md shadow-primary/30"
              : "bg-secondary text-muted hover:text-foreground hover:bg-primary/10"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.slug === selectedCategory ? null : cat.slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
              selectedCategory === cat.slug
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "bg-secondary text-muted hover:text-foreground hover:bg-primary/10"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <>
          <p className="text-sm text-muted mb-4">{filtered.length} agents found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((listing) => (
              <div key={listing.id} className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 rounded-2xl">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No agents found</h3>
          <p className="text-muted">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
