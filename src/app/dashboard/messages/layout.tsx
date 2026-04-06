import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | AgentHub",
  description:
    "Message buyers and sellers about listings from inside AgentHub.",
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
