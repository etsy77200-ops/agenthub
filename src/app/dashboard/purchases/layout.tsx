import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My purchases | AgentHub",
  description: "Agents you bought — open your production access links after payment.",
};

export default function PurchasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
