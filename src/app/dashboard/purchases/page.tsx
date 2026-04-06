"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getStoredAccessToken } from "@/lib/supabase-rest";
import { useRouter, useSearchParams } from "next/navigation";

type PurchaseRow = {
  order_id: string;
  listing_id: string;
  listing_title: string;
  status: string;
  purchase_type: "one_time" | "monthly";
  stripe_subscription_status: string | null;
  created_at: string;
  amount: number;
  agent_access_url: string | null;
  access_pending: boolean;
  payment_pending: boolean;
  subscription_inactive: boolean;
};

function PurchasesContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutOk = searchParams.get("checkout") === "success";

  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    let cancelled = false;
    (async () => {
      setError("");
      try {
        const headers: HeadersInit = { Accept: "application/json" };
        const t = getStoredAccessToken();
        if (t) headers.Authorization = `Bearer ${t}`;
        const res = await fetch("/api/buyer/purchases", { credentials: "include", headers });
        const data = (await res.json().catch(() => ({}))) as {
          purchases?: PurchaseRow[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Could not load purchases");
          setPurchases([]);
        } else {
          setPurchases(Array.isArray(data.purchases) ? data.purchases : []);
        }
      } catch {
        if (!cancelled) setError("Could not load purchases");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!checkoutOk || authLoading || !user) return;
    const t = window.setInterval(() => {
      const headers: HeadersInit = { Accept: "application/json" };
      const tok = getStoredAccessToken();
      if (tok) headers.Authorization = `Bearer ${tok}`;
      void fetch("/api/buyer/purchases", { credentials: "include", headers })
        .then((r) => r.json())
        .then((data: { purchases?: PurchaseRow[] }) => {
          if (Array.isArray(data.purchases)) setPurchases(data.purchases);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(t);
  }, [checkoutOk, authLoading, user]);

  if (authLoading || (loading && !user)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-muted">Loading…</div>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">My purchases</h1>
      <p className="text-muted mb-6">
        After payment completes, your agent access link appears here. If it still says processing, wait a few seconds
        and refresh — we confirm payment before unlocking the link.
      </p>

      {checkoutOk && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Thanks — if checkout succeeded, your purchase will show below once payment is confirmed.
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="animate-pulse text-muted py-8">Loading purchases…</div>
      ) : purchases.length === 0 ? (
        <div className="border border-border rounded-xl p-8 text-center text-muted">
          <p className="mb-4">You don&apos;t have any purchases yet.</p>
          <Link href="/browse" className="text-primary font-medium hover:text-primary-dark">
            Browse agents →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => (
            <div key={p.order_id} className="border border-border rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <Link
                    href={`/listing/${p.listing_id}`}
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    {p.listing_title}
                  </Link>
                  <p className="text-sm text-muted mt-1">
                    ${p.amount}
                    {p.purchase_type === "monthly" ? " / month" : ""}
                    {" · "}
                    {new Date(p.created_at).toLocaleString()} ·{" "}
                    <span className="capitalize">{p.status.replace("_", " ")}</span>
                    {p.purchase_type === "monthly" && p.stripe_subscription_status && (
                      <>
                        {" · "}
                        <span className="capitalize">
                          sub: {p.stripe_subscription_status.replace("_", " ")}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                {p.payment_pending && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Payment processing — your access link will unlock after confirmation (usually under a minute).
                  </p>
                )}
                {!p.payment_pending && p.agent_access_url && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm font-medium text-foreground">Your agent access</p>
                    <a
                      href={p.agent_access_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark shrink-0"
                    >
                      Open agent
                    </a>
                  </div>
                )}
                {!p.payment_pending && p.access_pending && (
                  <p className="text-sm text-muted">
                    This listing has no access URL on file. Contact the seller or{" "}
                    <Link href="/contact" className="text-primary hover:underline">
                      support
                    </Link>
                    .
                  </p>
                )}
                {!p.payment_pending && p.subscription_inactive && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    This monthly subscription is not active right now. Update payment details or renew to keep access.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-pulse text-muted">Loading…</div>
        </div>
      }
    >
      <PurchasesContent />
    </Suspense>
  );
}
