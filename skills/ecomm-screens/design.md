# Design & UX

> **Priority #1.** UX comes before every other decision here.

## Reference stores

Pick 2–3 that match your product. Study them on a phone.

| Product | Copy this pattern |
|---|---|
| **One hero product** | A long product page that is the whole store: result first, mechanism, proof, offer |
| **Consumable or refill** | Bundles, subscribe and save, a routine builder |
| **Apparel** | Fit guidance, photos on different bodies, easy returns stated early |
| **Beauty and skincare** | Before/after, ingredients explained, a quiz that picks the product |
| **Gadget** | Demo video first, comparison table, what's in the box |
| **Gift** | Occasion landing pages, delivery-by dates, gift notes |

Screens and flows: **[Mobbin](https://mobbin.com)** (web), the **[Meta Ads Library](https://www.facebook.com/ads/library)** for the ads and landing pages category leaders are running now, and **[Baymard](https://baymard.com/research)** for what the research says.

## Finding UI to replicate (agent steps)

1. **List the leaders:** the best-selling stores in the category and the ones running the most ads (Meta Ads Library, TikTok Creative Center).
2. **Save screenshots** at phone width to `docs/references/<store>/`: landing page, product page, cart, checkout, thank-you, and their emails (sign up and abandon a cart to receive them).
3. **Write a teardown** per reference in `docs/references/<store>.md`: section order, layout, visual (type, spacing, radius, palette), copy, the offer.
4. **Pick one reference per screen**, not per store.
5. **Rebuild in your design system** and compare side by side at phone width until it matches.

Copy patterns, not assets: no logos, photos, illustrations, written copy, or brand names.

## Principles

1. Fast: optimistic UI, skeletons, streaming text, tap response under 100 ms.
2. One primary action per screen.
3. No account before buying (`ecomm-stack` (`references/customers.md`)).
4. Motion only where it explains something: the cart opening, an item added.
5. Show the product in use, on real people, in real light.
6. Web conventions: the cart is top right, the logo goes home, links look like links.
7. Accessible: Dynamic Type, contrast, VoiceOver labels, 44 pt tap targets.
8. Honest: real prices, real stock, real deadlines, easy returns.

## The funnel

1. Ad: one promise, the result shown.
2. Landing or product page: the same promise in the headline, proof within one scroll.
3. Optional quiz: 3–6 questions, then a product picked for them.
4. Add to cart: bundle chosen, cart drawer opens.
5. Checkout: email, wallet, done.
6. Thank-you: one upsell, then what happens next.

Track each step (`ecomm-stack` (`references/analytics.md`)). Build each screen from `ecomm-screens`.

## Design system

- Tokens: color (light and dark), type scale, 4/8 pt spacing, radius, shadows, motion durations.
- Kit: Button, ProductCard, Gallery, VariantPicker, BundlePicker, CartDrawer, ReviewCard, FAQ, Input, Toast.
- The same tokens in the store's CSS variables and in the email shell (`ecomm-email`).
- The first product image and the headline do most of the selling.

## Resources

- [Baymard Institute](https://baymard.com/research) · [Laws of UX](https://lawsofux.com) · [Mobbin](https://mobbin.com)
- [Meta Ads Library](https://www.facebook.com/ads/library) · [Really Good Emails](https://reallygoodemails.com)
