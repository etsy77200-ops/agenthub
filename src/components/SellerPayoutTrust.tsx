type TrustState =
  | { kind: "loading" }
  | { kind: "ok"; payout_ready: boolean; setup_started: boolean }
  | { kind: "hidden" };

export function SellerPayoutTrust({ state }: { state: TrustState }) {
  if (state.kind === "hidden") return null;
  if (state.kind === "loading") {
    return (
      <span className="text-xs text-muted animate-pulse tabular-nums">Checking payout setup…</span>
    );
  }

  const { payout_ready, setup_started } = state;

  if (payout_ready) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
        title="Seller completed Stripe payout setup. Payments can be sent to their connected account according to our payment partner."
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Payout ready
      </span>
    );
  }

  if (setup_started) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200"
        title="Seller started payment setup; Stripe may still need more information before payouts are enabled."
      >
        Payout setup in progress
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted border border-border"
      title="This seller has not connected Stripe for payouts. Checkout may still be available depending on platform settings."
    >
      Payout not connected
    </span>
  );
}
