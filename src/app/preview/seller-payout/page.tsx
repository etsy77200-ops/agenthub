import { SellerPayoutTrust } from "@/components/SellerPayoutTrust";

/**
 * Local UI preview for seller payout trust badges (not linked from the main nav).
 * Visit: /preview/seller-payout
 */
export default function SellerPayoutPreviewPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-2">Payout trust badges</h1>
        <p className="text-sm text-muted mb-8">
          How they appear next to a seller on a real listing (after the API loads). Hover each pill for the full
          tooltip.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Loading</h2>
        <div className="p-6 border border-border rounded-xl bg-card">
          <SellerPayoutTrust state={{ kind: "loading" }} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Payout ready</h2>
        <div className="p-6 border border-border rounded-xl bg-card">
          <SellerPayoutTrust
            state={{ kind: "ok", payout_ready: true, setup_started: true }}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Setup in progress</h2>
        <div className="p-6 border border-border rounded-xl bg-card">
          <SellerPayoutTrust
            state={{ kind: "ok", payout_ready: false, setup_started: true }}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Not connected</h2>
        <div className="p-6 border border-border rounded-xl bg-card">
          <SellerPayoutTrust
            state={{ kind: "ok", payout_ready: false, setup_started: false }}
          />
        </div>
      </section>
    </div>
  );
}
