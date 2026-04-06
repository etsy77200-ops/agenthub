"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { getStoredAccessToken } from "@/lib/supabase-rest";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  const showAdmin =
    Boolean(user) &&
    (profile?.is_admin === true ||
      Boolean(adminEmail && user?.email?.toLowerCase().trim() === adminEmail));

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const headers: HeadersInit = { Accept: "application/json" };
        const token = getStoredAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/messages/unread-count", {
          headers,
          credentials: "include",
        });
        const data = (await res.json().catch(() => ({}))) as { unread?: number };
        if (!cancelled) setUnreadCount(Number(data.unread ?? 0));
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    };
    void load();
    const t = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [user?.id]);

  const unreadLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : "";

  return (
    <nav className="border-b border-border bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold text-foreground">AgentHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/browse" className="text-muted hover:text-foreground transition-colors">
              Browse Agents
            </Link>
            <Link href="/dashboard/create-listing" className="text-muted hover:text-foreground transition-colors">
              Sell Your Agent
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-secondary rounded-lg animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/purchases"
                  className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  My purchases
                </Link>
                <Link
                  href="/dashboard/messages"
                  className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-semibold leading-none">
                      {unreadLabel}
                    </span>
                  )}
                </Link>
                {showAdmin && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {profile?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 text-sm text-muted hover:text-red-600 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/browse" className="block px-3 py-2 text-muted hover:text-foreground">
              Browse Agents
            </Link>
            <Link href="/dashboard/create-listing" className="block px-3 py-2 text-muted hover:text-foreground">
              Sell Your Agent
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 text-muted hover:text-foreground">
                  Dashboard
                </Link>
                <Link href="/dashboard/purchases" className="block px-3 py-2 text-muted hover:text-foreground">
                  My purchases
                </Link>
                <Link href="/dashboard/messages" className="block px-3 py-2 text-muted hover:text-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-semibold leading-none">
                        {unreadLabel}
                      </span>
                    )}
                  </span>
                </Link>
                {showAdmin && (
                  <Link href="/admin" className="block px-3 py-2 text-primary font-medium">
                    Admin
                  </Link>
                )}
                <button onClick={handleSignOut} className="block px-3 py-2 text-red-600">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block px-3 py-2 text-muted hover:text-foreground">
                  Log in
                </Link>
                <Link href="/auth/signup" className="block px-3 py-2 text-primary font-medium">
                  Sign up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
