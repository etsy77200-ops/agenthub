# AgentHub — Product Requirements Document (PRD)

**Version:** 1.0  
**Last updated:** April 2026  
**Stack:** Next.js 16, Supabase (Auth + DB), Stripe Connect (Express), Vercel  

---

## 1. Executive summary

AgentHub is a **two-sided marketplace** where independent **sellers** list **AI agents** for a fixed price and **buyers** discover agents, try a **demo**, pay through **Stripe Checkout**, and receive a **production access URL** after payment succeeds. The platform **facilitates payments** and records orders; **delivery and support** are primarily between buyer and seller, as described in listings and Terms.

---

## 2. Goals

| Goal | Success signal |
|------|----------------|
| Sellers can onboard payments safely | Stripe Connect Express completed; payout-ready state visible |
| Buyers can evaluate before paying | Every purchasable listing exposes an https demo link |
| Payment is trustworthy | Checkout uses Connect transfers + application fee; webhook confirms payment |
| Post-purchase access is clear | Paid buyers see agent access URL only after successful payment |
| Platform revenue | Configurable application fee (default **15%**) on successful charges |

---

## 3. Personas

- **Seller:** Lists agents, connects Stripe, manages orders, receives payouts per Stripe rules.  
- **Buyer:** Browses (or discovers listings), opens demo, submits requirements, pays, accesses agent URL from **My purchases**.  
- **Platform admin:** Operates site, support, optional admin tools (env-gated).  

---

## 4. Scope — in product today

### 4.1 Authentication & session

- Supabase Auth; session available via **cookies** and optionally **Authorization: Bearer** for API calls.  
- Server routes resolve user via shared helper (cookies first, then Bearer JWT).

### 4.2 Listings

- Fields include title, descriptions, category, price, pricing type (fixed / hourly / custom), tags, status (draft / active / paused).  
- **Demo URL:** Valid http(s) URL; **required to publish** and **required for checkout** on active listings.  
- **Agent access URL:** Valid **https** URL; **required to publish**; stored on `listings`; **not** returned in public listing queries.  
- **Publish gating:** Active publish requires Stripe Connect **payout-ready** state for the seller.

### 4.3 Discovery & listing detail

- Listing detail page loads public listing fields + seller profile snippet + payout trust indicators.  
- Checkout disabled if seller is not payout-ready or demo/access URL requirements are not met.

### 4.4 Checkout & orders

- Authenticated buyer initiates checkout with optional **requirements** text.  
- Stripe Checkout Session with Connect **transfer_data.destination** to seller account and **application_fee_amount** for platform.  
- Order row created **pending** with Checkout Session id stored for webhook correlation.  
- On **`checkout.session.completed`**, webhook updates matching order to **accepted** (and stores payment intent id when present); runs idempotent **`increment_order_count`** only when the order row update affects a row.

### 4.5 Buyer post-purchase

- **My purchases** page lists buyer’s orders; **agent access URL** shown only when order is in a **paid** state (accepted / in_progress / completed) and listing has a URL.  
- Listing page shows **“You own this agent”** with access link when the same conditions hold.  
- Server APIs use **service role** to read `agent_access_url` only for authorized buyers (never rely on exposing the column in public client selects).

### 4.6 Seller dashboard

- Stripe Connect: connect flow, **Stripe connected** badge, **Open Stripe Express** via server redirect route (reliable new-tab behavior).  
- Listings summary; recent orders (subject to data wiring).  
- Create listing flow with validation aligned to API.

### 4.7 Platform & compliance

- Terms, Privacy, About, Contact pages.  
- Environment secrets: Stripe keys, webhook secret, Supabase URL/anon key, **service role** server-only.  

---

## 5. Functional requirements (numbered)

1. **FR-1** — User can sign up / log in and remain signed in across dashboard and checkout APIs.  
2. **FR-2** — Seller can create draft or active listing; active listing must satisfy demo URL, agent access URL, category, payout readiness.  
3. **FR-3** — Buyer can open demo from listing in a new tab before purchase.  
4. **FR-4** — Buyer cannot complete checkout if seller is not payout-ready or listing is inactive or URLs invalid.  
5. **FR-5** — Successful payment results in order moving to **accepted** via verified webhook (when webhook secret configured).  
6. **FR-6** — Buyer sees production access link only after **FR-5** (or equivalent paid state); pending payment shows processing messaging.  
7. **FR-7** — Seller receives funds per Stripe Connect; platform fee applied per configuration.  
8. **FR-8** — Webhook handler uses service role for DB updates that RLS would otherwise block.  

---

## 6. Non-functional requirements

- **Security:** Service role and webhook secret never exposed to client bundles; no secrets in `NEXT_PUBLIC_*`.  
- **Reliability:** Webhook processing tolerant of `payment_intent` string vs object shape; order insert failure expires Checkout session and returns error without silent charge mismatch.  
- **Performance:** REST/timeouts patterns for auth-adjacent reads where applicable.  
- **Deploy:** Production URL + env vars documented; redeploy after env changes.  

---

## 7. Explicit non-goals / future (vNext ideas)

- **Escrow** or hold funds until buyer confirms delivery.  
- **Edit listing** UI for existing rows (today: recreate or SQL for migrations).  
- **Buyer–seller messaging** beyond contact flows.  
- **Dispute resolution** workflow inside the product.  
- **Tokenized or per-buyer agent URLs** (access control at the agent host).  
- **Browse** fully backed by live Supabase for all environments (may still use mock data in some views).  
- **Seller orders dashboard** fully wired to live `orders` (verify vs mock in codebase).  

---

## 8. Dependencies & configuration

| Dependency | Purpose |
|------------|---------|
| Supabase | Auth, Postgres, RLS (as configured) |
| Stripe | Checkout, Connect Express, webhooks |
| Vercel | Hosting, env, HTTPS |

**Required env (representative):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, optional `STRIPE_PLATFORM_FEE_PERCENT`.  

**Webhook:** `checkout.session.completed` → `https://<production-domain>/api/stripe/webhook` (path must be exact).  

---

## 9. Success metrics (suggested)

- Checkout completion rate (started → paid).  
- Webhook success rate (2xx) and latency.  
- Time from payment to **accepted** order & visible access link.  
- Seller Connect onboarding completion rate.  
- Support tickets related to “did not receive access link.”  

---

## 10. Open questions

- Should **hourly** / **custom** pricing types change checkout (today: single line item fixed-style flow per implementation)?  
- When to surface **in_progress** / **completed** from seller workflow vs webhook-only **accepted**?  
- Legal: refund and chargeback policy UX copy beyond Terms.  

---

## 11. Document ownership

Update this PRD when schema, checkout, or access-control rules change. Reference implementation lives in the AgentHub repository (`src/app`, `src/lib`, Supabase SQL migrations).
