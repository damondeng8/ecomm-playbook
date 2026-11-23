# 13 · Security, privacy, and selling rules

> **Default:** secrets out of the browser, the server decides every price, card data never touches your Worker, marketing email only with consent, every claim provable.
> **Agent: read this when** touching checkout, customer data, email, or claims on a page, or preparing a launch. This is a checklist, not legal advice. **[HUMAN]** confirms the rules for each country sold to.

## Security

1. Secrets: `wrangler secret put` and `.dev.vars` (gitignored). Never in the browser or git. Rotate leaks.
2. Card details go straight to Stripe. Your Worker never sees them.
3. The server computes price, discount, stock, shipping, and tax. Never trust amounts from the browser.
4. Webhooks verify signatures and are idempotent.
5. Rate-limit auth, checkout creation, discount-code attempts, and email forms. Turnstile on forms.
6. Admin routes need the admin session. Refunds and live email sends are logged with who did them.
7. Validate input. SQL only via `prepare().bind()`.
8. Uploads (reviews with photos): presigned R2 URLs with size and type limits, moderated before display.
9. Model-read content is data. Acting tools need confirmation.
10. Few dependencies, pinned, updated.

## Privacy

- Collect the minimum. Order records, an email, an address.
- Privacy Policy and Terms on your domain, served from Workers.
- GDPR/CCPA: export and deletion on request, no data selling, consent before non-essential cookies and ad pixels for EU and UK visitors.
- First-party analytics go to your own `/events` ([08](08-analytics-observability.md)). Ad pixels load only after consent where consent is required.

## Email and SMS

| Rule | Do this |
|---|---|
| **Consent** | Marketing only to people who opted in, or recent customers where the law allows it. Record when and how. Canada (CASL) and the EU are stricter than the US |
| **Identify yourself** | Real From name, physical mailing address in every marketing email |
| **Unsubscribe** | One click, no login, honored at once. `List-Unsubscribe` headers ([10](10-email.md)) |
| **Honest subject lines** | The subject matches the content |
| **Transactional stays transactional** | No promotion in order and shipping emails beyond a light footer |

## Selling rules

| Area | Do this |
|---|---|
| **Claims** | Every claim provable. No "cures", no guaranteed results. Health and income claims need evidence and a disclaimer |
| **Reviews and testimonials** | Real, unedited in meaning, typical results stated. Paid or gifted reviewers disclosed |
| **Creators and affiliates** | Clear "ad" or "paid partnership" disclosure on every post |
| **Prices** | The "was" price is one you really charged. Deadlines and stock counts are real |
| **Subscriptions** | Terms next to the button, a reminder before renewal, cancel online in as few steps as signing up |
| **Policies** | Shipping times, returns, and refunds stated before payment and honored |
| **Product safety** | Category rules, labels, and testing ([00](00-product-and-offer.md) domain guide) |
| **Tax and duty** | Stripe Tax for collection. Say who pays import duty |

## Launch checklist

- [ ] SPF, DKIM, DMARC set on sending domains
- [ ] Privacy, Terms, Shipping, Returns pages live and linked in the footer and at checkout
- [ ] Cookie consent where required
- [ ] A real test order: paid, confirmed by email, fulfilled, refunded
- [ ] Unsubscribe works from a real inbox
- [ ] Every claim on the product page has its source written in `docs/copy-brief.md`

## Resources

- [FTC: advertising and marketing basics](https://www.ftc.gov/business-guidance/advertising-marketing) · [FTC endorsement guides](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking) · [CAN-SPAM guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [Canada's anti-spam legislation](https://fightspam-combattrelepourriel.ised-isde.canada.ca/site/canada-anti-spam-legislation/en) · [Stripe security](https://docs.stripe.com/security)
