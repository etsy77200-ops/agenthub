"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { getStoredAccessToken } from "@/lib/supabase-rest";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  const navLinkBase =
    "relative px-4 py-2 text-sm rounded-lg text-muted transition-all duration-200 hover:text-foreground hover:-translate-y-0.5 hover:bg-primary/5";
  const navLinkActive = "text-primary bg-primary/10 shadow-sm shadow-primary/10";
  const navUnderline =
    "after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100";
  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const topNavLink = `${navLinkBase} ${navUnderline}`;

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
            <Link
              href="/browse"
              className={`${topNavLink} ${isActive("/browse") ? navLinkActive : ""}`}
            >
              Browse Agents
            </Link>
            <Link
              href="/dashboard/create-listing"
              className={`${topNavLink} ${isActive("/dashboard/create-listing") ? navLinkActive : ""}`}
            >
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
                  className={`${topNavLink} ${isActive("/dashboard") ? navLinkActive : ""}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/purchases"
                  className={`${topNavLink} ${isActive("/dashboard/purchases") ? navLinkActive : ""}`}
                >
                  My purchases
                </Link>
                <Link
                  href="/dashboard/messages"
                  className={`${topNavLink} inline-flex items-center gap-2 ${isActive("/dashboard/messages") ? navLinkActive : ""}`}
                >
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-semibold leading-none animate-pulse-soft">
                      {unreadLabel}
                    </span>
                  )}
                </Link>
                {showAdmin && (
                  <Link
                    href="/admin"
                    className={`${topNavLink} font-medium ${isActive("/admin") ? navLinkActive : "text-primary hover:text-primary-dark"}`}
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
                    className="px-3 py-1.5 text-sm text-muted rounded-lg transition-all duration-200 hover:text-red-600 hover:bg-red-50 hover:-translate-y-0.5"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={`${topNavLink} ${isActive("/auth/login") ? navLinkActive : ""}`}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm bg-primary text-white rounded-lg transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg transition-all duration-200 hover:bg-primary/10 hover:-translate-y-0.5"
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
            <Link
              href="/browse"
              className={`block px-3 py-2 rounded-lg transition-all duration-200 hover:bg-primary/5 hover:-translate-y-0.5 ${isActive("/browse") ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}
            >
              Browse Agents
            </Link>
            <Link
              href="/dashboard/create-listing"
              className={`block px-3 py-2 rounded-lg transition-all duration-200 hover:bg-primary/5 hover:-translate-y-0.5 ${isActive("/dashboard/create-listing") ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}
            >
              Sell Your Agent
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`block px-3 py-2 rounded-lg transition-all duration-200 hover:bg-primary/5 hover:-translate-y-0.5 ${isActive("/dashboard") ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/purchases"
                  className={`block px-3 py-2 rounded-lg transition-all duration-200 hover:bg-primary/5 hover:-translate-y-0.5 ${isActive("/dashboard/purchases") ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}
                >
                  My purchases
                </Link>
                <Link
                  href="/dashboard/messages"
                  className={`block px-3 py-2 rounded-lg transition-all duration-200 hover:bg-primary/5 hover:-translate-y-0.5 ${isActive("/dashboard/messages") ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}
                >
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
                  <Link
                    href="/admin"
                    className={`block px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-primary/5 hover:-translate-y-0.5 ${isActive("/admin") ? "bg-primary/10 text-primary" : "text-primary"}`}
                  >
                    Admin
                  </Link>
                )}
                <button onClick={handleSignOut} className="block px-3 py-2 text-red-600">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={`block px-3 py-2 rounded-lg transition-all duration-200 hover:bg-primary/5 hover:-translate-y-0.5 ${isActive("/auth/login") ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-2 rounded-lg text-primary font-medium transition-all duration-200 hover:bg-primary/10 hover:-translate-y-0.5"
                >
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
