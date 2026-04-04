"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MOCK_LISTINGS } from "@/lib/constants";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ListingData {
  id: string;
  title: string;
  short_description: string;
  description: string;
  price: number;
  price_type: string;
  tags: string[];
  rating: number;
  review_count: number;
  order_count: number;
  demo_url?: string;
  status: string;
  created_at: string;
  seller: {
    id: string;
    name: string;
    bio?: string;
    created_at: string;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      const { data } = await supabase
        .from("listings")
        .select("*, seller:profiles!listings_seller_id_fkey(id, name, bio, created_at), category:categories(name, slug)")
        .eq("id", id)
        .single();

      if (data) {
        setListing(data as unknown as ListingData);
      } else {
        // Fallback to mock data for demo
        const mock = MOCK_LISTINGS.find((l) => l.id === id);
        if (mock) {
          setListing({
            ...mock,
            seller: mock.seller ? { ...mock.seller, id: mock.seller.id } : null,
            category: null,
          } as unknown as ListingData);
        }
      }
      setLoading(false);
    };
    fetchListing();
  }, [id, supabase]);

  const handleOrder = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setOrdering(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing!.id,
          requirements,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout");
        setOrdering(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Agent not found</h1>
        <Link href="/browse" className="text-primary hover:text-primary-dark">
          &larr; Back to browse
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/browse" className="text-muted hover:text-foreground text-sm mb-6 inline-block">
        &larr; Back to browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {listing.category?.name || "AI Agent"}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-4">{listing.title}</h1>

          {listing.demo_url ? (
            <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Try the demo first</p>
                <p className="text-xs text-muted">
                  See how this agent works before you pay. Opens in a new tab.
                </p>
              </div>
              <a
                href={listing.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark shrink-0"
              >
                Open demo
              </a>
            </div>
          ) : listing.status === "active" ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This listing has no demo link yet, so checkout is disabled. Contact the seller or choose another agent.
            </div>
          ) : null}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {listing.seller?.name?.charAt(0)}
                </span>
              </div>
              <span className="font-medium">{listing.seller?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium">{listing.rating}</span>
              <span className="text-muted">({listing.review_count} reviews)</span>
            </div>
            <span className="text-muted">{listing.order_count} orders</span>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-3">About This Agent</h2>
            <p className="text-muted leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {listing.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-secondary text-muted text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Reviews</h2>
            <div className="space-y-4">
              {[
                { name: "David L.", rating: 5, comment: "Incredible agent! Set it up in minutes and it's handling 80% of our support tickets automatically.", date: "2 weeks ago" },
                { name: "Rachel M.", rating: 5, comment: "Best investment we've made this year. The agent is smart, fast, and our customers can't tell it's AI.", date: "1 month ago" },
                { name: "Tom K.", rating: 4, comment: "Great agent overall. Took a bit of fine-tuning but the developer was very responsive.", date: "1 month ago" },
              ].map((review, i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-muted">{review.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-sm">{review.name}</span>
                    </div>
                    <span className="text-xs text-muted">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Order Card */}
        <div className="lg:col-span-1">
          <div className="border border-border rounded-xl p-6 sticky top-24">
            <div className="text-3xl font-bold mb-1">${listing.price}</div>
            <p className="text-sm text-muted mb-6">One-time payment</p>

            {!showOrderForm ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowOrderForm(true)}
                  disabled={!listing.demo_url || listing.status !== "active"}
                  className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Order Now
                </button>
                {(!listing.demo_url || listing.status !== "active") && (
                  <p className="text-xs text-muted mb-3 text-center">
                    {!listing.demo_url && listing.status === "active"
                      ? "A demo is required before purchase."
                      : "This listing is not available for purchase."}
                  </p>
                )}
                <button className="w-full py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  Contact Seller
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Your Requirements</label>
                  <textarea
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Describe what you need this agent to do for your business..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                  />
                </div>
                <button
                  onClick={handleOrder}
                  disabled={ordering}
                  className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {ordering ? "Redirecting to payment..." : `Pay $${listing.price}`}
                </button>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="w-full py-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="border-t border-border mt-6 pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Delivery time</span>
                <span className="font-medium">3-5 days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Revisions</span>
                <span className="font-medium">2 included</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Support</span>
                <span className="font-medium">30 days</span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="border-t border-border mt-6 pt-6">
              <h3 className="font-semibold mb-3">About the Seller</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {listing.seller?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{listing.seller?.name}</div>
                  <div className="text-xs text-muted">Member since {listing.seller?.created_at?.slice(0, 7)}</div>
                </div>
              </div>
              <p className="text-sm text-muted">{listing.seller?.bio}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
