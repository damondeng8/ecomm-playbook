# 07 · Payments & pricing

> **Default:** **Superwall** on iOS/Android, **Stripe** on web, **one entitlements table** in D1. About **$30/year with a free trial**.
> **Agent: read this when** building paywalls, purchases, webhooks, or any "is this user Pro?" check.

## Funnel (benchmark estimates, not targets)

```
downloads ──30%──▶ start a free trial ──30%──▶ pay $30/year
                 ≈ 9% of downloads become paying subscribers ≈ $2.70 per download
```

Measure your own ([12](12-costs.md)).

## Infra and fees (Oct 2026)

| Platform | Use | Fees |
|---|---|---|
| iOS / Android | **[Superwall](https://superwall.com)**: remote paywalls and A/B tests | Free to $10k/mo paywall revenue, then 1%\* |
| Web | **[Stripe](https://stripe.com)**: Checkout + Billing + Customer Portal | 2.9% + 30¢, plus 0.7% for Billing |
| iOS web checkout | **[Superwall web checkout](https://superwall.com/docs/web-checkout)** (Stripe) | As above |
| **Apple** | Subscriptions | **15%** in the [Small Business Program](https://developer.apple.com/app-store/small-business-program/) (≤ $1M/yr). Otherwise 30% year one, 15% after |
| **Google Play** | Subscriptions | **10% + 5% billing** in US, EEA, UK (since Jun 30, 2026). 15% elsewhere |

\*Superwall's pricing pages disagreed. Confirm at [superwall.com/pricing](https://superwall.com/pricing).

- **[HUMAN] Enroll in Apple's Small Business Program on day one.**
- US storefront apps may link to web checkout. Apple's commission on those is still in court (Oct 2026). Test it.

## Pricing

1. Lead with yearly, ~$30/year, shown per week ("$0.58/week").
2. At most one short option (weekly or monthly).
3. Always a free trial (3 or 7 days) with a reminder before it ends.
4. Hard paywall after the aha moment: onboarding → personalized result → paywall. Any free tier is capped daily.
5. One abandon offer: a discounted yearly, shown once.
6. Localize prices by storefront.
7. Test price, trial length, and design in Superwall, one experiment at a time ([14](14-experiments.md)).

These are the starting defaults. What LiftLike learned changing them is below.

## Changing prices (from LiftLike)

A price change is always the founder's decision ([14](14-experiments.md), Tier B).

1. **Approve a ladder once.** A few rungs per plan and a floor, written in `docs/EXPERIMENTS.md`. Rungs at or above the floor can be tested without a new approval. LiftLike's: weekly $2.99 / $3.99 / $4.99 · monthly $12.99 / $19.99 (no trial), $19.99 / $29.99 (trial) · annual $89.99 / $119.99 / $179.99 / $239.99, floor $89.99.
2. **Discount with an anchor.** Set the list price at exactly twice the first-year price and apply a 50% first-year coupon: $359.98 → $179.99. An anchor of $359.99 bills $180.00. Show the renewal price.
3. **Trials on annual only.** No free trial on weekly plans.
4. **Judge a price on paying users and cash.** Primary metric: new paying users 7 days after the trial ends. Guardrail: cash per exposed user at least 80% of control. A trial-versus-no-trial test is judged on revenue per paywall viewer. Trial starts alone will mislead you.
5. **Start a price test on at most 20% of traffic.** 50/50 only on a clear win. 100% needs a new approval.
6. **A user keeps the price they first saw.** Sticky assignment on, before launch.
7. **Only test a price where the traffic can finish it.** At 34 paywall views a day a price test takes a month.
8. **Work out who pays for a cheaper rung.** With a flat platform fee plus a percentage, a lower price comes out of the partner's payout, not the platform's. Tell partners before the test starts.
9. **One offer is a legitimate paywall.** If you cut to a single plan, pin the CTA to the bottom of the screen. A lone card leaves the button floating mid-screen.

### Reprice checklist

- [ ] Create the new price as a new object. Never edit a live price.
- [ ] Preview an invoice against the live price and coupon. Check the amount to the cent.
- [ ] Deploy the server before the clients.
- [ ] Search for the old amount everywhere: paywall, emails, receipts, store screenshots, tests, deploy checks. An email that hardcodes the old number will keep sending it.
- [ ] Derive per-week and per-month display prices from the real price in one place.
- [ ] Make one real purchase and refund it.
- [ ] Record the change in `docs/EXPERIMENTS.md`.

## Entitlements

The `entitlements` table ([03](03-database.md)) is written **only** by verified webhooks:
- `POST /webhooks/stripe`: verify with `stripe.webhooks.constructEventAsync`.
- `POST /webhooks/superwall`: App Store and Play events via Superwall. Verify the signature.

Writes are idempotent (keyed by event id). All clients call `GET /me/entitlements`, so a purchase on any platform unlocks all.

## Paywall checklist (App Store review)

- [ ] Price, period, trial length, "auto-renews until cancelled" shown
- [ ] Links to Terms (EULA) and Privacy
- [ ] **Restore Purchases**
- [ ] Visible close button, no dark patterns
- [ ] Trial-ending reminder scheduled
- [ ] `paywall_viewed`, `trial_started`, `subscription_started` fire with the variant id

## Resources

- [Superwall docs](https://superwall.com/docs) · [Superwall paywall gallery](https://superwall.com/applications) · [Superwall blog](https://superwall.com/blog)
- [Stripe Billing](https://docs.stripe.com/billing) · [Stripe webhooks](https://docs.stripe.com/webhooks)
- [App Store subscriptions](https://developer.apple.com/app-store/subscriptions/)
