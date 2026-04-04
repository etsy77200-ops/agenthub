import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Dashboard",
  description:
    "View your AgentHub listings, earnings, and recent orders. Connect Stripe to get paid when buyers purchase your AI agents.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
