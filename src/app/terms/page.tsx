import type { Metadata } from "next";
import LegalPage from "@/components/content/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | AgentHub",
  description:
    "Terms for using AgentHub: accounts, listings, orders, fees, and responsibilities of buyers and sellers.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms govern your use of AgentHub. By creating an account, listing an agent, or placing an order, you
        agree to these Terms.
      </p>
      <h2>The marketplace</h2>
      <p>
        AgentHub is a platform that connects independent sellers with buyers. We are not the seller of every agent
        unless we say otherwise. Sellers are responsible for their listings, delivery, and support unless a listing
        states differently.
      </p>
      <h2>Accounts</h2>
      <p>
        You must provide accurate information and keep your login secure. You are responsible for activity under your
        account.
      </p>
      <h2>Listings and orders</h2>
      <p>
        Listings must be truthful and must not violate law or others’ rights. When a buyer places an order and payment
        succeeds, a contract is between buyer and seller; AgentHub facilitates payment and records the order. Delivery
        timelines and scope are as described in the listing and any agreed requirements.
      </p>
      <h2>Fees</h2>
      <p>
        AgentHub may charge a platform fee on transactions. Fees and taxes (if any) are shown or calculated at
        checkout. Sellers receive payouts according to our payment partner’s rules and their connected account status.
      </p>
      <h2>Prohibited use</h2>
      <p>
        You may not use AgentHub for illegal activity, to distribute malware, to harass others, to mislead users, or
        to circumvent payments or fees.
      </p>
      <h2>Disclaimers</h2>
      <p>
        The service is provided “as is” to the extent allowed by law. We do not guarantee uninterrupted operation or
        that every listing will meet your needs. AI agents carry inherent limitations; evaluate listings carefully.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, AgentHub is not liable for indirect or consequential damages arising
        from use of the marketplace. Our total liability for a claim is limited to the platform fees we earned from you
        in the twelve months before the claim, or one hundred dollars, whichever is greater.
      </p>
      <h2>Changes</h2>
      <p>
        We may change these Terms. Continued use after changes means you accept the updated Terms. Material changes may
        be announced on the site or by email.
      </p>
    </LegalPage>
  );
}
