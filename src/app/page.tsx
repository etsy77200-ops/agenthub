import Link from "next/link";
import ListingCard from "@/components/listings/ListingCard";
import { CATEGORIES, MOCK_LISTINGS } from "@/lib/constants";
import type { Listing } from "@/types";

export default function Home() {
  const featuredListings = MOCK_LISTINGS as unknown as Listing[];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
            The #1 Marketplace for AI Agents
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Find & Hire AI Agents<br />
            <span className="text-primary">Built by Top Developers</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10">
            Browse hundreds of production-ready AI agents for customer support, sales, data analysis, content creation, and more. Deploy in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="px-8 py-3.5 bg-primary text-white rounded-xl text-lg font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
            >
              Browse Agents
            </Link>
            <Link
              href="/auth/signup"
              className="px-8 py-3.5 bg-white text-foreground rounded-xl text-lg font-medium hover:bg-secondary transition-colors border border-border"
            >
              Start Selling
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-16">
            <div>
              <div className="text-3xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted">AI Agents</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">2,000+</div>
              <div className="text-sm text-muted">Businesses Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">150+</div>
              <div className="text-sm text-muted">Expert Developers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">4.7/5</div>
              <div className="text-sm text-muted">Avg Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Browse by Category</h2>
          <p className="text-muted text-center mb-10 max-w-xl mx-auto">
            Find the perfect AI agent for your business needs
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/browse?category=${cat.slug}`}
                className="p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all text-center group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary text-lg font-bold">{cat.name.charAt(0)}</span>
                </div>
                <h3 className="text-sm font-medium text-foreground">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 bg-secondary/50">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link href="/browse" className="text-primary font-medium">View all agents &rarr;</Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted text-center mb-12 max-w-xl mx-auto">
            Get an AI agent up and running for your business in 3 simple steps
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Browse & Choose",
                desc: "Explore our marketplace of AI agents. Filter by category, price, and ratings to find the perfect fit.",
              },
              {
                step: "2",
                title: "Place Your Order",
                desc: "Share your requirements with the developer. They'll customize the agent for your specific needs.",
              },
              {
                step: "3",
                title: "Deploy & Scale",
                desc: "Get your AI agent delivered and deployed. Scale it across your business with ongoing support.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted">{item.desc}</p>
              </div>
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
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3.5 bg-white text-primary rounded-xl text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Become a Seller
          </Link>
        </div>
      </section>
    </div>
  );
}
