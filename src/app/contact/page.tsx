import type { Metadata } from "next";
import Link from "next/link";

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@agenthub.com";

export const metadata: Metadata = {
  title: "Contact | AgentHub",
  description: "Reach the AgentHub team for support, partnerships, or press inquiries.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-2">Contact</h1>
      <p className="text-muted mb-10">
        We read every message. For fastest help with an order, include your account email and order details.
      </p>

      <div className="space-y-8">
        <section className="border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">Email</h2>
          <p className="text-muted text-sm mb-4">
            General support, billing questions, and listing issues:
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=AgentHub%20support`}
            className="text-primary font-medium hover:text-primary-dark"
          >
            {CONTACT_EMAIL}
          </a>
        </section>

        <section className="border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">What to include</h2>
          <ul className="text-sm text-muted space-y-2 list-disc list-inside">
            <li>The email address on your AgentHub account</li>
            <li>For orders: approximate date and listing title</li>
            <li>For sellers: link to your listing if relevant</li>
          </ul>
        </section>

        <section className="border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">Response time</h2>
          <p className="text-sm text-muted">
            We aim to reply within two business days. Complex disputes may take longer while we review order details.
          </p>
        </section>

        <p className="text-sm text-muted">
          <Link href="/" className="text-primary hover:text-primary-dark">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
