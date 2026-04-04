"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  stripe_account_id: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
}

interface ListingRow {
  id: string;
  title: string;
  price: number;
  status: string;
  order_count: number;
  seller_id: string;
  created_at: string;
}

/**
 * Route access: middleware + ADMIN_EMAIL + Supabase cookies.
 * Data: GET /api/admin/data (same checks + RLS is_admin — see supabase-admin-secure.sql).
 */
export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "orders" | "listings">("overview");
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (fetched) return;

    const load = async () => {
      const res = await fetch("/api/admin/data", { credentials: "same-origin" });
      if (!res.ok) {
        router.replace("/");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as {
        users: UserRow[];
        orders: OrderRow[];
        listings: ListingRow[];
      };
      setUsers(data.users ?? []);
      setOrders(data.orders ?? []);
      setListings(data.listings ?? []);
      setLoading(false);
      setFetched(true);
    };

    void load();
  }, [fetched, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-muted">Loading admin dashboard...</div>
      </div>
    );
  }

  const totalUsers = users.length;
  const totalSellers = users.filter((u) => u.role === "seller" || u.role === "both").length;
  const totalBuyers = users.filter((u) => u.role === "buyer" || u.role === "both").length;
  const totalListings = listings.length;
  const activeListings = listings.filter((l) => l.status === "active").length;
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount), 0);
  const platformEarnings = orders.reduce((sum, o) => sum + Number(o.platform_fee), 0);
  const completedPlatformEarnings = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.platform_fee), 0);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    in_progress: "bg-indigo-100 text-indigo-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
    buyer: "bg-blue-100 text-blue-800",
    seller: "bg-purple-100 text-purple-800",
    both: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted mt-1">Platform overview — owner only (server + database enforced)</p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-border">
        {(["overview", "users", "orders", "listings"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Your Earnings (15% commission)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="border border-border rounded-xl p-5 bg-primary/5">
              <div className="text-sm text-muted mb-1">Total Platform Earnings</div>
              <div className="text-2xl font-bold text-primary">${platformEarnings.toFixed(2)}</div>
              <div className="text-xs text-muted mt-1">From all orders</div>
            </div>
            <div className="border border-border rounded-xl p-5 bg-green-50">
              <div className="text-sm text-muted mb-1">Confirmed Earnings</div>
              <div className="text-2xl font-bold text-green-700">${completedPlatformEarnings.toFixed(2)}</div>
              <div className="text-xs text-muted mt-1">From completed orders</div>
            </div>
            <div className="border border-border rounded-xl p-5">
              <div className="text-sm text-muted mb-1">Total GMV</div>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <div className="text-xs text-muted mt-1">Gross merchandise value</div>
            </div>
            <div className="border border-border rounded-xl p-5">
              <div className="text-sm text-muted mb-1">Avg Order Value</div>
              <div className="text-2xl font-bold">${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"}</div>
              <div className="text-xs text-muted mt-1">Per order</div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-3">Platform Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="border border-border rounded-xl p-5">
              <div className="text-sm text-muted mb-1">Total Users</div>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <div className="text-xs text-muted mt-1">{totalBuyers} buyers, {totalSellers} sellers</div>
            </div>
            <div className="border border-border rounded-xl p-5">
              <div className="text-sm text-muted mb-1">Total Listings</div>
              <div className="text-2xl font-bold">{totalListings}</div>
              <div className="text-xs text-muted mt-1">{activeListings} active</div>
            </div>
            <div className="border border-border rounded-xl p-5">
              <div className="text-sm text-muted mb-1">Total Orders</div>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <div className="text-xs text-muted mt-1">{pendingOrders} pending, {completedOrders} completed</div>
            </div>
            <div className="border border-border rounded-xl p-5">
              <div className="text-sm text-muted mb-1">Sellers with Stripe</div>
              <div className="text-2xl font-bold">{users.filter((u) => u.stripe_account_id).length}</div>
              <div className="text-xs text-muted mt-1">Can receive payouts</div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-3">Recent Signups</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.slice(0, 5).map((u) => (
                  <tr key={u.id} className="hover:bg-card-hover">
                    <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-muted hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No users yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div>
          <h2 className="text-lg font-semibold mb-3">All Users ({totalUsers})</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden md:table-cell">Stripe</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-card-hover">
                    <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-muted hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">
                      {u.stripe_account_id ? (
                        <span className="text-green-600 font-medium">Connected</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No users yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div>
          <h2 className="text-lg font-semibold mb-3">All Orders ({totalOrders})</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Order ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden sm:table-cell">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden md:table-cell">Your Cut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-card-hover">
                    <td className="px-4 py-3 text-sm font-mono text-xs">{o.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm font-medium hidden sm:table-cell">${Number(o.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium hidden md:table-cell">${Number(o.platform_fee).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[o.status]}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "listings" && (
        <div>
          <h2 className="text-lg font-semibold mb-3">All Listings ({totalListings})</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden sm:table-cell">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden md:table-cell">Orders</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-card-hover">
                    <td className="px-4 py-3 text-sm font-medium">{l.title}</td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">${Number(l.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{l.order_count}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[l.status]}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{new Date(l.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {listings.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No listings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
