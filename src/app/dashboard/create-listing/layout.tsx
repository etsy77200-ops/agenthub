import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "List Your Agent",
  description:
    "Publish a new AI agent on AgentHub: title, pricing, category, and what buyers receive. Clear listings help the right customers find you.",
};

export default function CreateListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
