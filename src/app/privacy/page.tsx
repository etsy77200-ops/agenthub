import type { Metadata } from "next";
import LegalPage from "@/components/content/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | AgentHub",
  description:
    "How AgentHub collects, uses, and protects your information when you use our AI agent marketplace.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy describes how AgentHub (“we”, “us”) handles information when you use our website and services. By
        using AgentHub, you agree to this policy. If you do not agree, please do not use the site.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email, and profile details you provide when you sign up or update your
          profile.
        </li>
        <li>
          <strong>Listing and order data:</strong> text you submit for listings, order requirements, and messages
          needed to complete a transaction.
        </li>
        <li>
          <strong>Payment data:</strong> processed by our payment provider (e.g. Stripe). We do not store full card
          numbers on our servers.
        </li>
        <li>
          <strong>Technical data:</strong> basic logs and cookies needed to keep you signed in and to secure the
          service.
        </li>
      </ul>
      <h2>How we use information</h2>
      <p>
        We use your information to run the marketplace: accounts, listings, orders, payouts, fraud prevention, and
        support. We may email you about your account or important service changes.
      </p>
      <h2>Sharing</h2>
      <p>
        We share data with service providers who help us operate the site (for example hosting, authentication, and
        payments), only as needed for those services. We may disclose information if required by law or to protect
        rights and safety.
      </p>
      <h2>Retention</h2>
      <p>
        We keep information as long as your account is active or as needed for legal, tax, and dispute resolution
        purposes.
      </p>
      <h2>Your choices</h2>
      <p>
        You may update profile information in your account where the product allows. You can contact us (see Contact)
        to ask about access or deletion, subject to legal exceptions.
      </p>
      <h2>Children</h2>
      <p>AgentHub is not directed at children under 13, and we do not knowingly collect their personal information.</p>
      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. We will post the new version on this page and update the date
        above.
      </p>
    </LegalPage>
  );
}
