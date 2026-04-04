import { stripe } from "@/lib/stripe";

export type ConnectPayoutFlags = {
  setup_started: boolean;
  payout_ready: boolean;
};

/**
 * Stripe Connect Express: payouts are allowed when onboarding submitted and Stripe enables payouts.
 */
export async function getConnectPayoutFlags(
  stripeAccountId: string | null | undefined
): Promise<ConnectPayoutFlags> {
  const id = typeof stripeAccountId === "string" ? stripeAccountId.trim() : "";
  if (!id) {
    return { setup_started: false, payout_ready: false };
  }
  try {
    const account = await stripe.accounts.retrieve(id);
    return {
      setup_started: true,
      payout_ready: Boolean(account.details_submitted && account.payouts_enabled),
    };
  } catch {
    return { setup_started: true, payout_ready: false };
  }
}
