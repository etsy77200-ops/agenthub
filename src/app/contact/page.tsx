import type { Metadata } from "next";
import Link from "next/link";

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@agenthub.com";

export const metadata: Metadata = {
  title: "Contact | AgentHub",
  description: "Reach the AgentHub team for support, partnerships, or press inquiries.",
};

type ContactSearchParams = Record<string, string | string[] | undefined>;

function firstQueryValue(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] || "");
  return String(v || "");
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<ContactSearchParams>;
}) {
  const q = await searchParams;
  const intent = firstQueryValue(q.intent);
  const listingId = firstQueryValue(q.listing_id);
  const listingTitle = firstQueryValue(q.listing_title);
  const sellerName = firstQueryValue(q.seller_name);

  const isSellerContact = intent === "contact-seller" && Boolean(listingId);
  const subject = isSellerContact
    ? `AgentHub inquiry about "${listingTitle || "a listing"}"`
    : "AgentHub support";
  const body = isSellerContact
    ? [
        "Hi AgentHub team,",
        "",
        "I want to contact the seller about this listing.",
        "",
        `Listing: ${listingTitle || "Unknown listing"}`,
        `Listing ID: ${listingId}`,
        `Seller: ${sellerName || "Unknown seller"}`,
        "",
        "My question:",
        "",
      ].join("\n")
    : "";
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}${
    body ? `&body=${encodeURIComponent(body)}` : ""
  }`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-2">Contact</h1>
      <p className="text-muted mb-10">
        We read every message. For fastest help with an order, include your account email and order details.
      </p>

      <div className="space-y-8">
        {isSellerContact && (
          <section className="border border-indigo-200 bg-indigo-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2 text-indigo-950">Contact seller request</h2>
            <p className="text-sm text-indigo-900 mb-3">
              We will route this message to the seller and keep a support trail.
            </p>
            <dl className="text-sm text-indigo-950 space-y-1">
              <div>
                <dt className="inline font-medium">Listing:</dt>{" "}
                <dd className="inline">{listingTitle || "Unknown listing"}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Seller:</dt>{" "}
                <dd className="inline">{sellerName || "Unknown seller"}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Listing ID:</dt>{" "}
                <dd className="inline">{listingId}</dd>
              </div>
            </dl>
            <p className="text-xs text-indigo-900/90 mt-3">
              Tip: include your preferred contact method and what you need the agent to do.
            </p>
          </section>
        )}

        <section className="border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">Email</h2>
          <p className="text-muted text-sm mb-4">
            General support, billing questions, and listing issues:
          </p>
          <a
            href={mailtoHref}
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
