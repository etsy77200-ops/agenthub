"use client";

import { useState } from "react";
import { MOCK_LISTINGS } from "@/lib/constants";

const allOrders = [
  { id: "o1", listing: MOCK_LISTINGS[0].title, buyer: "John Davidson", amount: 499, status: "in_progress", date: "2026-03-28", requirements: "Need multilingual support for English, Spanish, and French. Integrate with our Zendesk account." },
  { id: "o2", listing: MOCK_LISTINGS[2].title, buyer: "Anna Schmidt", amount: 599, status: "completed", date: "2026-03-25", requirements: "Connect to our PostgreSQL database and generate weekly revenue reports." },
  { id: "o3", listing: MOCK_LISTINGS[4].title, buyer: "Chris Park", amount: 399, status: "pending", date: "2026-04-01", requirements: "Set up for our GitHub org. Focus on Python and TypeScript repos." },
  { id: "o4", listing: MOCK_LISTINGS[1].title, buyer: "Maria Lopez", amount: 799, status: "accepted", date: "2026-03-30", requirements: "B2B SaaS targeting companies with 50-200 employees in the fintech space." },
  { id: "o5", listing: MOCK_LISTINGS[3].title, buyer: "David Kim", amount: 299, status: "completed", date: "2026-03-20", requirements: "10 SEO blog posts per month on cloud computing topics." },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filtered = filter === "all" ? allOrders : allOrders.filter((o) => o.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">Orders</h1>
      <p className="text-muted mb-8">Manage all your incoming orders</p>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "accepted", "in_progress", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === status
                ? "bg-primary text-white"
                : "bg-secondary text-muted hover:text-foreground"
            }`}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
            {status === "all" && ` (${allOrders.length})`}
            {status !== "all" && ` (${allOrders.filter((o) => o.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filtered.map((order) => (
          <div key={order.id} className="border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{order.listing}</h3>
                <p className="text-sm text-muted mt-1">Buyer: {order.buyer} &middot; {order.date}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">${order.amount}</div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                  {order.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {selectedOrder === order.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Requirements:</h4>
                <p className="text-sm text-muted mb-4">{order.requirements}</p>
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <>
                      <button className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors">
                        Accept Order
                      </button>
                      <button className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors">
                        Decline
                      </button>
                    </>
                  )}
                  {order.status === "accepted" && (
                    <button className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors">
                      Mark as In Progress
                    </button>
                  )}
                  {order.status === "in_progress" && (
                    <button className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-green-600 transition-colors">
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
              className="text-sm text-primary hover:text-primary-dark font-medium mt-2"
            >
              {selectedOrder === order.id ? "Hide details" : "View details"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
