"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function StripeConnectButton() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to connect Stripe");
      }
    } catch {
      alert("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
        profile?.stripe_account_id
          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {loading
        ? "Loading..."
        : profile?.stripe_account_id
        ? "Stripe Connected — Manage"
        : "Connect Stripe to Get Paid"}
    </button>
  );
}
