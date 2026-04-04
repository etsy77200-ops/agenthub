import { Suspense } from "react";
import type { Metadata } from "next";
import BrowseContent from "./BrowseContent";

export const metadata: Metadata = {
  title: "Browse AI Agents | AgentHub",
  description:
    "Explore AI agents for support, data, code, sales, and more. Compare listings and hire builders on AgentHub.",
};

function BrowseFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-muted">
      Loading browse…
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowseContent />
    </Suspense>
  );
}
