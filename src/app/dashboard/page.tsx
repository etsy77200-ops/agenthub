"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { restGetJson } from "@/lib/supabase-rest";
import { useRouter } from "next/navigation";
import StripeConnectButton from "@/components/StripeConnectButton";

interface DashboardListing {
  id: string;
  title: string;
  price: number;
  order_count: number;
  status: string;
}

interface DashboardOrder {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  listings: { title: string } | null;
  buyer: { name: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
};

export default function DashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stripe = new URLSearchParams(window.location.search).get("stripe");
    if (stripe !== "success" && stripe !== "refresh") return;
    void (async () => {
      await refreshProfile();
      router.replace("/dashboard");
    })();
  }, [refreshProfile, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      router.replace("/auth/login");
      return;
    }
    if (fetched) return;

    const seller = encodeURIComponent(user.id);

    const fetchData = async () => {
      try {
        const listingsRows = await restGetJson<DashboardListing[]>(
          `listings?select=id,title,price,order_count,status&seller_id=eq.${seller}&order=created_at.desc`
        );

        let orderData: DashboardOrder[] = [];
        try {
          const orderRows = await restGetJson<
            Array<{
              id: string;
              amount: number;
              status: string;
              created_at: string;
              listing_id: string;
              buyer_id: string;
            }>
          >(
            `orders?select=id,amount,status,created_at,listing_id,buyer_id&seller_id=eq.${seller}&order=created_at.desc&limit=5`
          );
          orderData = (orderRows || []).map((o) => ({
            ...o,
            listings: null,
            buyer: null,
          })) as DashboardOrder[];
        } catch {
          // Orders query failed, continue with empty
        }

        setListings(Array.isArray(listingsRows) ? listingsRows : []);
        setOrders(orderData);
      } catch {
        // Fetch failed, show empty dashboard
      }
      setLoading(false);
      setFetched(true);
    };

    fetchData();
  }, [authLoading, user, fetched, router]);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-muted">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted">
        Redirecting to login…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-muted">Loading dashboard...</div>
      </div>
    );
  }

  const totalEarnings = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.amount * 0.85, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted mt-1">
            Welcome back, {profile?.name || user?.email?.split("@")[0] || "there"}!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <StripeConnectButton />
            <p className="text-xs text-muted max-w-[14rem] text-right leading-snug max-sm:hidden">
              Stripe opens in a new tab. When your account is linked, you&apos;ll see a green &quot;Stripe connected&quot;
              label and can open Express anytime.
            </p>
          </div>
          <Link
            href="/dashboard/create-listing"
            className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            + New Listing
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Total Earnings</div>
          <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
          <div className="text-xs text-muted mt-1">After 15% platform fee</div>
        </div>
        <div className="border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Active Listings</div>
          <div className="text-2xl font-bold">{listings.filter((l) => l.status === "active").length}</div>
          <div className="text-xs text-muted mt-1">{listings.filter((l) => l.status === "draft").length} drafts</div>
        </div>
        <div className="border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Total Orders</div>
          <div className="text-2xl font-bold">{orders.length}</div>
          <div className="text-xs text-muted mt-1">{orders.filter((o) => o.status === "pending").length} pending</div>
        </div>
        <div className="border border-border rounded-xl p-5">
          <div className="text-sm text-muted mb-1">Role</div>
          <div className="text-2xl font-bold capitalize">{profile?.role}</div>
          <div className="text-xs text-muted mt-1">Account type</div>
        </div>
      </div>

      {/* My Listings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">My Listings</h2>
        {listings.length > 0 ? (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Agent</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden sm:table-cell">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden md:table-cell">Orders</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-card-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/listing/${listing.id}`} className="font-medium text-sm hover:text-primary">
                          {listing.title}
                        </Link>
                        <Link
                          href={`/dashboard/listings/${listing.id}/edit`}
                          className="text-xs text-primary hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">${listing.price}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{listing.order_count}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[listing.status]}`}>
                        {listing.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-border rounded-xl p-8 text-center">
            <p className="text-muted mb-4">You haven&apos;t created any listings yet</p>
            <Link href="/dashboard/create-listing" className="text-primary font-medium hover:text-primary-dark">
              Create your first listing &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-primary text-sm font-medium hover:text-primary-dark">
            View all &rarr;
          </Link>
        </div>
        {orders.length > 0 ? (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Order</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden sm:table-cell">Buyer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden md:table-cell">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-card-hover">
                    <td className="px-4 py-3 text-sm font-medium">{order.listings?.title || "—"}</td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">{order.buyer?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">${order.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-border rounded-xl p-8 text-center">
            <p className="text-muted">No orders yet. They&apos;ll appear here when buyers order your agents.</p>
          </div>
        )}
      </div>
    </div>
  );
}
