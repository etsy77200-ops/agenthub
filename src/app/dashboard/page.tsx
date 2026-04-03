"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
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
  const { user, profile, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      const listingsRes = await supabase
        .from("listings")
        .select("id, title, price, order_count, status")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      let orderData: DashboardOrder[] = [];
      try {
        const ordersRes = await supabase
          .from("orders")
          .select("id, amount, status, created_at, listing_id, buyer_id")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        orderData = (ordersRes.data || []).map((o: Record<string, unknown>) => ({
          ...o,
          listings: null,
          buyer: null,
        })) as unknown as DashboardOrder[];
      } catch {
        // Orders table might be empty
      }

      setListings(listingsRes.data || []);
      setOrders(orderData);
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, router, supabase]);

  if (authLoading || loading) {
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
          <p className="text-muted mt-1">Welcome back, {profile?.name || "there"}!</p>
        </div>
        <div className="flex items-center gap-3">
          <StripeConnectButton />
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
                      <Link href={`/listing/${listing.id}`} className="font-medium text-sm hover:text-primary">
                        {listing.title}
                      </Link>
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
