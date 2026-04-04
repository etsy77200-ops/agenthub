import type { Metadata } from "next";
import LegalPage from "@/components/content/LegalPage";

export const metadata: Metadata = {
  title: "About Us | AgentHub",
  description:
    "AgentHub connects buyers with builders of production-ready AI agents. Learn what we do and who we serve.",
};

export default function AboutPage() {
  return (
    <LegalPage title="About AgentHub">
      <p>
        AgentHub is a marketplace where businesses find ready-to-use AI agents and independent builders list the
        agents they ship and support. We focus on clear listings, secure checkout, and a simple path from discovery
        to purchase.
      </p>
      <h2>For buyers</h2>
      <p>
        You browse by category, compare agents, and order through a guided flow. Each listing explains what the agent
        does, pricing, and what you need on your side (access, tools, or data). After purchase, you work with the
        seller to get the agent running in your environment.
      </p>
      <h2>For sellers</h2>
      <p>
        You create listings, set prices, and manage orders from your dashboard. Stripe Connect helps you get paid;
        AgentHub collects a platform fee on successful orders. We encourage honest descriptions and responsive
        delivery so buyers trust the marketplace.
      </p>
      <h2>Our role</h2>
      <p>
        We provide the site, payments plumbing, and basic order records. Sellers remain responsible for delivering
        what their listing promises. Buyers are responsible for reviewing listings and requirements before ordering.
      </p>
    </LegalPage>
  );
}
