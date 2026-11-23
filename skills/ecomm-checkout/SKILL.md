---
name: ecomm-checkout
description: "Build cart, checkout, orders and offers for a store on Stripe: guest checkout with wallets first, an orders table written only by verified webhooks, server-side prices, bundles, order bump, post-purchase upsell, free-shipping threshold, subscribe and save, guarantees, and the LiftLike rules for changing prices (approved ladder and floor, anchor pricing, reprice checklist). Use when building or changing cart, checkout, discounts, order handling, any price display, or when planning a price or offer change."
---

# Checkout, offers, and pricing

Stripe Checkout with wallets first, guest checkout, an `orders` table written only by verified webhooks. Sell an offer, not a product: bundle, bonus, guarantee.

## The math (measure your own)

```
visitors × conversion rate × average order value = revenue
revenue − product cost − shipping − payment fees − ad spend = contribution margin
```

The levers: a higher conversion rate (`ecomm-screens`, `ecomm-experiments`), a higher order value (this skill), repeat orders (`ecomm-email`).

## Infra

| Job | Use |
|---|---|
| Payment | **[Stripe Checkout](https://docs.stripe.com/payments/checkout)** or the Payment Element, with Apple Pay, Google Pay, and Link on |
| Tax | **[Stripe Tax](https://docs.stripe.com/tax)** |
| Subscriptions and refills | **[Stripe Billing](https://docs.stripe.com/billing)** + Customer Portal |
| Discounts | Stripe coupons and promotion codes |
| Fulfilment | Your 3PL or label provider's API, called from a Queue. The user picks it |

Check [stripe.com/pricing](https://stripe.com/pricing) for current fees before putting a number in a plan.

## The offer

1. **Lead with a bundle.** Three options, the middle or largest marked best value, priced so the bundle is the obvious choice.
2. **One order bump** in the cart: a small add-on, one tap.
3. **One post-purchase upsell** on the thank-you page, charged to the same payment method with one tap. Never before payment.
4. **A free-shipping threshold** set just above the current average order value.
5. **Subscribe and save** for anything that runs out. Cancelling takes two taps.
6. **A guarantee that reverses the risk.** Say it plainly and honor it without argument.
7. **Bonuses beat discounts.** A discount lowers the price people expect. A bonus doesn't.
8. **One abandon offer,** shown once, by email (`ecomm-email`).
9. **Show the total early,** shipping and tax included, as soon as you know them.

## Changing prices (from LiftLike)

A price change is always the founder's decision (`ecomm-experiments`, Tier B).

1. **Approve a ladder once.** A few price points per product or bundle and a floor, written in `docs/EXPERIMENTS.md`. Rungs at or above the floor can be tested without a new approval. The floor is never below landed cost plus payment fees plus the cost to acquire the order.
2. **Discount with an anchor.** Set the list price so the discounted price lands on the exact number you want. Half of $359.98 is $179.99; half of $359.99 bills $180.00. Only use an anchor price you really charge.
3. **Judge a price on profit, not on orders.** Primary metric: contribution margin per visitor. Guardrail: cash per exposed visitor at least 80% of control, and refund rate not above control.
4. **Start a price test on at most 20% of traffic.** 50/50 only on a clear win. 100% needs a new approval.
5. **A visitor keeps the price they first saw,** on every screen and in every email, until the test ends.
6. **Only test a price where the traffic can finish it.** Do the traffic math first (`ecomm-experiments`).
7. **Work out who pays for a cheaper price.** If a creator or affiliate earns a percentage, tell them before the test starts.
8. **One offer is a legitimate page.** If you cut to a single option, pin the button to the bottom of the screen.

### Reprice checklist

- [ ] Create the new price as a new Stripe object. Never edit a live price.
- [ ] Check the charged amount to the cent in test mode, with tax and shipping.
- [ ] Deploy the server before the pages.
- [ ] Search for the old amount everywhere: pages, emails, ads, receipts, tests. An email that hardcodes the old number will keep sending it.
- [ ] Derive every "per unit" and "you save" number from the real price in one place.
- [ ] Make one real purchase and refund it.
- [ ] Record the change in `docs/EXPERIMENTS.md`.

## Orders

The `orders` table (`ecomm-stack` (`references/database.md`)) is written **only** by `POST /webhooks/stripe`, verified with `stripe.webhooks.constructEventAsync`. Writes are idempotent, keyed by event id.

- The browser never decides that an order is paid. The thank-you page reads the order from the server.
- Prices, stock, discounts, and shipping are computed on the server. The cart the browser sends is a request, not a fact.
- Refunds and disputes arrive by webhook and update the order.
- Fulfilment is a Queue job triggered by the paid order, safe to run twice.

## Checkout checklist

- [ ] Guest checkout, email asked first
- [ ] Wallet buttons above the card form
- [ ] Total, shipping, tax, and delivery estimate visible before payment
- [ ] Returns and guarantee one tap away
- [ ] Subscription terms stated next to the button: price, how often, how to cancel
- [ ] Failed payment shows a clear message and keeps the cart
- [ ] `checkout_started`, `payment_submitted`, `order_placed` fire with the experiment and variant
- [ ] Works in the Instagram and TikTok in-app browsers on a real phone

## Resources

- [Stripe Checkout](https://docs.stripe.com/payments/checkout) · [Stripe webhooks](https://docs.stripe.com/webhooks) · [Stripe Tax](https://docs.stripe.com/tax)
- [Baymard: checkout usability](https://baymard.com/research/checkout-usability) · *$100M Offers* (`ecomm-copy`)
