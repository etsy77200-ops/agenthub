 "use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ListingCard from "@/components/listings/ListingCard";
import { CATEGORIES, MOCK_LISTINGS } from "@/lib/constants";
import type { Listing } from "@/types";

function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -30px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

function CountUp({
  end,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let raf = 0;
    let started = false;
    const durationMs = 1100;

    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries[0]?.isIntersecting) return;
        started = true;
        const startAt = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - startAt) / durationMs, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(end * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [end]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function Home() {
  const featuredListings = MOCK_LISTINGS as unknown as Listing[];
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [flow, setFlow] = useState<"buyers" | "sellers">("buyers");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [teamSize, setTeamSize] = useState(3);
  const [hoursSaved, setHoursSaved] = useState(6);
  const [hourlyRate, setHourlyRate] = useState(85);

  const sectionNav = [
    { id: "hero", label: "Overview" },
    { id: "why-agenthub", label: "Why AgentHub" },
    { id: "capabilities", label: "Capabilities" },
    { id: "categories", label: "Categories" },
    { id: "featured", label: "Featured" },
    { id: "roi-calculator", label: "ROI" },
    { id: "how-it-works", label: "How it works" },
    { id: "faq", label: "FAQ" },
  ];

  const filteredListings = useMemo(() => {
    if (selectedCategory === "all") return featuredListings;
    return featuredListings.filter((listing) =>
      String(listing.category || "").toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [featuredListings, selectedCategory]);

  const flowSteps =
    flow === "buyers"
      ? [
          {
            step: "1",
            title: "Discover Agents",
            desc: "Browse verified agents by category, compare ratings, and shortlist what fits your workflow.",
          },
          {
            step: "2",
            title: "Purchase Securely",
            desc: "Checkout with one-time or subscription pricing and get clear access details after payment.",
          },
          {
            step: "3",
            title: "Launch Fast",
            desc: "Use your access link, deploy quickly, and keep billing and renewals managed from your dashboard.",
          },
        ]
      : [
          {
            step: "1",
            title: "Create Listing",
            desc: "Publish your agent with clear pricing, demo URL, and buyer access details.",
          },
          {
            step: "2",
            title: "Connect Stripe",
            desc: "Complete Stripe Connect onboarding so payouts are ready before going live.",
          },
          {
            step: "3",
            title: "Sell & Iterate",
            desc: "Manage messages, track purchases, and improve listings using revision history snapshots.",
          },
        ];

  const faqs = [
    {
      q: "Can I sell one-time and monthly plans?",
      a: "Yes. Listings support one-time, monthly, or both billing models so you can offer flexible monetization.",
    },
    {
      q: "How do buyers get agent access after purchase?",
      a: "After successful checkout, buyers receive an access link from their purchases dashboard. Access is revoked if a subscription becomes inactive.",
    },
    {
      q: "Is messaging built in?",
      a: "Yes. Buyers can contact sellers from listings and continue conversations in the in-app inbox with unread indicators.",
    },
  ];

  const weeklySavings = teamSize * hoursSaved * hourlyRate;
  const monthlySavings = weeklySavings * 4.33;
  const yearlySavings = weeklySavings * 52;
  const capabilities = [
    {
      title: "Monetization Built In",
      desc: "One-time, monthly, or both billing models with subscription lifecycle webhooks ready.",
      badge: "Stripe-ready",
    },
    {
      title: "Seller Payout Safety",
      desc: "Connect onboarding and payout readiness gates prevent risky publish/checkout states.",
      badge: "Risk-aware",
    },
    {
      title: "Buyer Access Control",
      desc: "Post-purchase access links unlock instantly and revoke automatically on inactive subscriptions.",
      badge: "Automated",
    },
    {
      title: "In-App Messaging",
      desc: "Conversations, unread badges, and optional email notifications keep buyers and sellers in sync.",
      badge: "Realtime UX",
    },
    {
      title: "Trust Layer",
      desc: "Verified-purchase reviews with admin moderation for safer marketplace quality.",
      badge: "Moderated",
    },
    {
      title: "Listing Versioning",
      desc: "Revision snapshots + history viewer support safe iteration by sellers.",
      badge: "Audit trail",
    },
  ];
  const integrations = ["Supabase", "Stripe", "Vercel", "Resend", "Next.js", "Postgres"];
  const socialProof = [
    {
      quote:
        "We launched two new AI offers in one month. The billing and access controls just worked.",
      name: "Mina K.",
      role: "Founder, PromptOps Studio",
    },
    {
      quote:
        "The messaging and verified review flow increased buyer trust without adding manual overhead.",
      name: "Arjun P.",
      role: "Marketplace Lead, AgentForge",
    },
    {
      quote:
        "Revision history saved us during a listing update mistake. We could quickly compare and recover details.",
      name: "Selena R.",
      role: "Growth Engineer, Buildwise AI",
    },
  ];

  useEffect(() => {
    const elements = sectionNav
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0.15, 0.4, 0.75],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <div className="site-ambient-bg" aria-hidden="true">
        <div className="ambient-orb ambient-orb-a" />
        <div className="ambient-orb ambient-orb-b" />
        <div className="ambient-orb ambient-orb-c" />
        <div className="ambient-grid" />
      </div>
      {/* Hero */}
      <section id="hero" className="home-section relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 lg:py-28">
        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-primary/15 blur-2xl animate-pulse-soft" />
        <div className="pointer-events-none absolute top-12 right-0 h-32 w-32 rounded-full bg-accent/15 blur-2xl animate-float-slow" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Reveal delayMs={20}>
            <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
              The #1 Marketplace for AI Agents
            </div>
          </Reveal>
          <Reveal delayMs={80}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Find & Hire AI Agents<br />
              <span className="text-primary">Built by Top Developers</span>
            </h1>
          </Reveal>
          <Reveal delayMs={140}>
            <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10">
              Browse hundreds of production-ready AI agents for customer support, sales, data analysis, content creation, and more. Deploy in minutes.
            </p>
          </Reveal>
          <Reveal delayMs={200}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/browse"
                className="px-8 py-3.5 bg-primary text-white rounded-xl text-lg font-medium hover:bg-primary-dark transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25"
              >
                Browse Agents
              </Link>
              <Link
                href="/auth/signup"
                className="px-8 py-3.5 bg-white text-foreground rounded-xl text-lg font-medium hover:bg-secondary transition-all hover:-translate-y-0.5 border border-border"
              >
                Start Selling
              </Link>
            </div>
          </Reveal>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-16">
            <Reveal delayMs={30}>
              <div className="text-3xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted">AI Agents</div>
            </Reveal>
            <Reveal delayMs={80}>
              <div className="text-3xl font-bold text-foreground">2,000+</div>
              <div className="text-sm text-muted">Businesses Served</div>
            </Reveal>
            <Reveal delayMs={130}>
              <div className="text-3xl font-bold text-foreground">150+</div>
              <div className="text-sm text-muted">Expert Developers</div>
            </Reveal>
            <Reveal delayMs={180}>
              <div className="text-3xl font-bold text-foreground">4.7/5</div>
              <div className="text-sm text-muted">Avg Rating</div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-10 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-center text-xs uppercase tracking-[0.2em] text-muted mb-5">
              Trusted stack
            </p>
          </Reveal>
          <div className="integrations-marquee">
            <div className="integrations-track">
              {[...integrations, ...integrations].map((item, idx) => (
                <div key={`${item}-${idx}`} className="integration-pill">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="why-agenthub" className="home-section py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-center mb-3">Why teams choose AgentHub</h2>
          </Reveal>
          <Reveal delayMs={80}>
            <p className="text-muted text-center mb-10 max-w-2xl mx-auto">
              Built for shipping AI products with less operational overhead and better buyer trust.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: 5, suffix: "x", label: "Faster go-live cycles" },
              { value: 80, suffix: "%", label: "Less repetitive admin work" },
              { value: 99.9, suffix: "%", label: "Stable checkout uptime target", decimals: 1 },
              { value: 2, suffix: "x", label: "More listings shipped monthly" },
            ].map((item, idx) => (
              <Reveal key={item.label} delayMs={idx * 70}>
                <div className="premium-card rounded-2xl border border-border p-5 text-center">
                  <div className="text-3xl font-bold text-foreground">
                    <CountUp end={item.value} suffix={item.suffix} decimals={item.decimals ?? 0} />
                  </div>
                  <div className="text-sm text-muted mt-1">{item.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="home-section py-16 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-center mb-3">Platform Capabilities</h2>
          </Reveal>
          <Reveal delayMs={80}>
            <p className="text-muted text-center mb-10 max-w-2xl mx-auto">
              Everything needed to run a premium AI marketplace experience, from onboarding to retention.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((item, idx) => (
              <Reveal key={item.title} delayMs={idx * 70}>
                <div className="premium-card rounded-2xl border border-border bg-white p-5 h-full">
                  <div className="inline-flex px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                    {item.badge}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-40 border-y border-border/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {sectionNav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  activeSection === item.id
                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                    : "bg-white text-muted border-border hover:text-foreground hover:-translate-y-0.5"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="home-section py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Browse by Category</h2>
          <p className="text-muted text-center mb-10 max-w-xl mx-auto">
            Find the perfect AI agent for your business needs
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, idx) => (
              <Reveal key={cat.id} delayMs={Math.min(idx * 40, 280)}>
                <Link
                  href={`/browse?category=${cat.slug}`}
                  className="block p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all text-center group"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <span className="text-primary text-lg font-bold">{cat.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground">{cat.name}</h3>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section id="featured" className="home-section py-16 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold">Featured Agents</h2>
              <p className="text-muted mt-2">Top-rated agents trusted by businesses worldwide</p>
            </div>
            <Link href="/browse" className="text-primary hover:text-primary-dark font-medium hidden sm:block">
              View all &rarr;
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedCategory === "all"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-muted border-border hover:text-foreground"
              }`}
            >
              All
            </button>
            {CATEGORIES.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all hover:-translate-y-0.5 ${
                  selectedCategory === cat.name
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-muted border-border hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing, idx) => {
              return (
                <Reveal key={listing.id} delayMs={idx * 80} className="transition-transform hover:-translate-y-1">
                  <ListingCard listing={listing} />
                </Reveal>
              );
            })}
          </div>
          {filteredListings.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-muted">
              No featured agents in this category yet.
            </div>
          )}
          <div className="text-center mt-8 sm:hidden">
            <Link href="/browse" className="text-primary font-medium">View all agents &rarr;</Link>
          </div>
        </div>
      </section>

      <section id="roi-calculator" className="home-section py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-center mb-3">Calculate Time and Revenue Lift</h2>
          </Reveal>
          <Reveal delayMs={80}>
            <p className="text-muted text-center mb-10 max-w-2xl mx-auto">
              Model how much operational value your team can unlock by shipping and managing faster.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            <Reveal className="lg:col-span-3">
              <div className="premium-card rounded-2xl border border-border p-6 bg-white h-full">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Team members</label>
                      <span className="text-sm text-muted">{teamSize}</span>
                    </div>
                    <input type="range" min={1} max={20} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Hours saved per member / week</label>
                      <span className="text-sm text-muted">{hoursSaved}h</span>
                    </div>
                    <input type="range" min={1} max={20} value={hoursSaved} onChange={(e) => setHoursSaved(Number(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Hourly value (USD)</label>
                      <span className="text-sm text-muted">${hourlyRate}</span>
                    </div>
                    <input type="range" min={25} max={250} step={5} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full" />
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal className="lg:col-span-2" delayMs={100}>
              <div className="rounded-2xl bg-primary text-white p-6 h-full shadow-xl shadow-primary/30">
                <div className="text-sm text-indigo-100 mb-4">Estimated value created</div>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase text-indigo-200">Weekly</div>
                    <div className="text-2xl font-bold">${weeklySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-indigo-200">Monthly</div>
                    <div className="text-2xl font-bold">${monthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-indigo-200">Yearly</div>
                    <div className="text-3xl font-bold">${yearlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
                <p className="text-xs text-indigo-100/90 mt-5">
                  Estimate based on internal productivity assumptions. Adjust inputs to match your team.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="home-section py-16 bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-center mb-3">Before vs After AgentHub</h2>
          </Reveal>
          <Reveal delayMs={90}>
            <p className="text-muted text-center mb-10 max-w-2xl mx-auto">
              Move from fragmented operations to a single conversion-optimized marketplace flow.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Reveal>
              <div className="premium-card rounded-2xl border border-border bg-white p-6 h-full">
                <div className="text-sm font-semibold text-red-600 mb-3">Before</div>
                <ul className="space-y-2 text-sm text-muted">
                  <li>Multiple tools for checkout, messaging, and fulfillment</li>
                  <li>Manual subscription follow-ups and access cleanups</li>
                  <li>Low trust due to weak social proof controls</li>
                  <li>Listing changes without version visibility</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delayMs={120}>
              <div className="premium-card rounded-2xl border border-primary/30 bg-white p-6 h-full">
                <div className="text-sm font-semibold text-green-600 mb-3">After</div>
                <ul className="space-y-2 text-sm text-muted">
                  <li>Unified browse, checkout, messaging, and seller workflow</li>
                  <li>Automated webhooks for billing lifecycle and access gating</li>
                  <li>Verified-purchase reviews + admin moderation controls</li>
                  <li>Revision snapshots and history for safer listing iteration</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="home-section py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted text-center mb-12 max-w-xl mx-auto">
            Switch perspective to see the flow for buyers and sellers
          </p>
          <div className="flex justify-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => setFlow("buyers")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                flow === "buyers" ? "bg-primary text-white border-primary" : "border-border text-muted hover:text-foreground"
              }`}
            >
              For buyers
            </button>
            <button
              type="button"
              onClick={() => setFlow("sellers")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                flow === "sellers" ? "bg-primary text-white border-primary" : "border-border text-muted hover:text-foreground"
              }`}
            >
              For sellers
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {flowSteps.map((item) => (
              <Reveal key={`${flow}-${item.step}`} className="text-center" delayMs={Number(item.step) * 90}>
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 animate-float-slow">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="home-section py-16 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Frequently Asked Questions</h2>
          <p className="text-muted text-center mb-8">Quick answers before you browse or publish.</p>
          <div className="space-y-3">
            {faqs.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <div key={item.q} className="border border-border rounded-xl bg-white overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenFaq((prev) => (prev === idx ? null : idx))}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-4 hover:bg-secondary/60 transition-colors"
                  >
                    <span className="font-medium">{item.q}</span>
                    <span className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>{open ? "−" : "+"}</span>
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 text-sm text-muted">{item.a}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-y border-border/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              "Verified-purchase review system",
              "Payout-readiness publish protection",
              "Access revocation on inactive subscriptions",
              "Secure auth + scoped API helpers",
            ].map((item, idx) => (
              <Reveal key={item} delayMs={idx * 50}>
                <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted premium-card">
                  <span className="text-primary mr-2">✓</span>
                  {item}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-center mb-3">What teams say</h2>
          </Reveal>
          <Reveal delayMs={80}>
            <p className="text-muted text-center mb-10">Proof from teams shipping AI products on AgentHub.</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {socialProof.map((item, idx) => (
              <Reveal key={item.name} delayMs={idx * 90}>
                <div className="premium-card rounded-2xl border border-border p-5 bg-white h-full">
                  <p className="text-sm text-foreground leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                  <div className="mt-5 pt-4 border-t border-border/70">
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-xs text-muted">{item.role}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Sellers */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Build AI Agents? Start Earning Today.
          </h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of AI developers selling their agents to businesses worldwide. Set your own prices, work on your terms.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-3.5 bg-white text-primary rounded-xl text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Become a Seller
            </Link>
            <Link
              href="/browse"
              className="inline-block px-8 py-3.5 bg-primary-dark text-white rounded-xl text-lg font-medium border border-white/25 hover:bg-indigo-700 transition-colors"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
