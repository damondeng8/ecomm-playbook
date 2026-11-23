# 06 · Screens: building the store

> **Default:** React + Vite on Workers static assets, phone width first. Six screens, each built from one reference, each with one job and one metric.
> **Agent: read this when** building or changing any page a shopper sees.

## The screens

| Screen | Its one job | Metric |
|---|---|---|
| **Landing page** (per ad angle) | Turn a click into interest in one product | Visitors who reach the product page or add to cart |
| **Product page** | Get the add to cart | Add-to-cart rate |
| **Cart** (drawer) | Raise the order value, get to checkout | Checkout-start rate, average order value |
| **Checkout** | Take the payment | Orders per checkout started |
| **Thank-you page** | One more offer, then set expectations | Upsell take rate |
| **Order status** | Answer "where is it?" | Support emails per order |

Also: collection page (only past about 8 products), policies, a quiz if the product needs choosing.

## Build order

1. **Design tokens** ([09](09-design-ux.md)): color, type, spacing, radius as CSS variables.
2. **Product page**, with fake data. It is the store. Get it right on a phone.
3. **Cart and checkout** in Stripe test mode, end to end, to a thank-you page.
4. **Landing page** for the first ad angle.
5. Order emails ([10](10-email.md)), then the rest.

One real purchase on a real phone on day 1 or 2, before polish.

## Product page, top to bottom

1. **Gallery:** first image shows the result or the product in use. Video second. Swipeable, fast.
2. **Name, star rating with count, price.** The price shown is the price charged.
3. **The promise** in one line, in the customer's words ([15](15-copy.md)).
4. **Variant and quantity pickers.** Bundles here, best value marked ([07](07-payments-pricing.md)).
5. **Add to cart.** Stays pinned to the bottom of the screen once the main button scrolls away.
6. **Reassurance row:** shipping time, returns, guarantee.
7. **How it works:** the mechanism, three steps or one diagram.
8. **Proof:** reviews with photos, numbers, experts.
9. **Objections:** a short FAQ. Each answer ends a reason not to buy.
10. **The offer again,** and the button again.

## Cart and checkout

- Cart is a drawer, not a page. The shopper never leaves the product.
- Show the total with shipping as early as you know it. Surprise costs at checkout are the top reason carts are abandoned.
- A progress bar to free shipping, if you offer it.
- One order bump in the cart: a small add-on, one tap.
- **Guest checkout.** No account required ([04](04-auth.md)). Email first, so an abandoned checkout can be followed up.
- Wallets first: Apple Pay, Google Pay, Link ([07](07-payments-pricing.md)).
- No navigation, no new selling at checkout. Reassurance only.

## Rules for every screen

1. **Phone first.** Build and check at 390 px. Most traffic is a phone inside a social app's browser.
2. **Fast.** Prerender landing and product pages to static HTML. Images as WebP or AVIF from R2, sized, lazy below the fold, the first image preloaded. No layout shift.
3. **One primary action per screen.** It is always visible or one scroll away.
4. **Every state:** loading, empty cart, out of stock, payment failed, slow network.
5. **Test in the in-app browser** of Instagram and TikTok on a real phone. Wallets, cookies, and redirects behave differently there.
6. **Accessible:** contrast, 44 px targets, labels on inputs, alt text.
7. **Every screen sends its events** ([08](08-analytics-observability.md)) and can carry an experiment ([14](14-experiments.md)).
8. **Copy comes from the brief** ([15](15-copy.md)), not from placeholder text.

## Built to be tested

Each screen is a list of sections. Each section takes its copy and options as data.

```ts
// apps/web/src/screens/product.ts
export const productPage = {
  hero: { headline: copy("pdp.headline"), image: "…" },
  sections: ["promise", "bundles", "reassurance", "mechanism", "reviews", "faq", "offer"],
};
```

- `copy("pdp.headline")` returns the control string, or the test arm's string when the visitor is in an experiment. Unknown arm → control.
- A copy test changes a string. A layout test changes the section list. Neither needs a new page.
- The exposure event fires when the section is on screen, not when the page loads.

## Web: React + Vite on Cloudflare

- [Static assets on Workers](https://developers.cloudflare.com/workers/static-assets/) with the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/). API and site ship in one deploy.
- Plain CSS with tokens as CSS variables, `fetch`, one small router. No UI kit or state library until you can name the problem.
- Catalog in D1, read through KV cache. Prices and stock always come from the server.
- No Next.js, no Vercel ([01](01-building-with-agents.md)).

## Done means

A stranger on a phone can land, understand the product in five seconds, add to cart, pay with a wallet, and get the confirmation email. You watched it happen on a real device.

## Resources

- [Baymard Institute](https://baymard.com/research) (checkout and product page research) · [web.dev: Core Web Vitals](https://web.dev/articles/vitals)
- [Stripe Checkout](https://docs.stripe.com/payments/checkout) · [Mobbin](https://mobbin.com)
