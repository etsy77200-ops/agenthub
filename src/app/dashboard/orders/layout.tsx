import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Orders",
  description:
    "Track buyer orders for your listings: amounts, status, and requirements. Fulfill work and mark progress from this dashboard.",
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
