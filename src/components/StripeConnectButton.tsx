"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getStoredAccessToken } from "@/lib/supabase-rest";

export default function StripeConnectButton() {
  const { profile, user, refreshProfile } = useAuth();
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingExpress, setLoadingExpress] = useState(false);
  /** Server-backed link state — profile from REST is often null even when Supabase has stripe_account_id. */
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const fetchLinkStatus = useCallback(async () => {
    if (!user) {
      setApiConnected(null);
      return;
    }
    try {
      const headers: HeadersInit = { Accept: "application/json" };
      const t = getStoredAccessToken();
      if (t) headers.Authorization = `Bearer ${t}`;
      const res = await fetch("/api/seller/stripe-link-status", {
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        setApiConnected(null);
        return;
      }
      const j = (await res.json()) as { connected?: boolean };
      setApiConnected(Boolean(j.connected));
    } catch {
      setApiConnected(null);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchLinkStatus();
    if (!user?.id) return;
    const retry = window.setTimeout(() => void fetchLinkStatus(), 500);
    return () => clearTimeout(retry);
  }, [fetchLinkStatus, user?.id]);

  useEffect(() => {
    if (!user) return;
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void fetchLinkStatus();
        void refreshProfile();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user?.id, fetchLinkStatus, refreshProfile]);

  const isConnected = Boolean(profile?.stripe_account_id) || apiConnected === true;

  const requestStripePortalUrl = useCallback(async (): Promise<string | null> => {
    const headers: HeadersInit = { Accept: "application/json" };
    const t = getStoredAccessToken();
    if (t) headers.Authorization = `Bearer ${t}`;
    const res = await fetch("/api/stripe/connect", {
      method: "POST",
      headers,
      credentials: "include",
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) {
      alert(data.error || "Failed to reach Stripe");
      return null;
    }
    if (data.url) return data.url;
    alert(data.error || "No Stripe URL returned");
    return null;
  }, []);

  const openStripeInNewTab = async (afterOpen: () => Promise<string | null>) => {
    const w = window.open("about:blank", "_blank", "noopener,noreferrer");
    if (!w) {
      alert("Please allow pop-ups for this site so Stripe can open in a new tab.");
      return;
    }
    try {
      const url = await afterOpen();
      if (url) {
        w.location.href = url;
      } else {
        w.close();
      }
    } catch {
      w.close();
      alert("Something went wrong");
    }
  };

  const handleConnect = async () => {
    setLoadingConnect(true);
    try {
      await openStripeInNewTab(requestStripePortalUrl);
    } finally {
      setLoadingConnect(false);
    }
  };

  const handleOpenExpress = async () => {
    setLoadingExpress(true);
    try {
      await openStripeInNewTab(requestStripePortalUrl);
    } finally {
      setLoadingExpress(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {isConnected ? (
        <>
          <div
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-800 border border-green-200"
            role="status"
          >
            <svg className="w-4 h-4 shrink-0 text-green-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Stripe connected
          </div>
          <button
            type="button"
            onClick={handleOpenExpress}
            disabled={loadingExpress}
            className="px-5 py-2.5 rounded-lg font-medium border border-indigo-200 text-indigo-800 bg-white hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingExpress ? "Opening…" : "Open Stripe Express"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={loadingConnect}
          className="px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {loadingConnect ? "Opening…" : "Connect Stripe to Get Paid"}
        </button>
      )}
    </div>
  );
}
