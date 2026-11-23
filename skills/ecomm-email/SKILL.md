---
name: ecomm-email
description: "Build HTML marketing and transactional emails for a store the way LiftLike does: one 640px table-based shell (shell.ts), first-person voice, three angle variants per send, merge fields with fallbacks, padded preheader, signed one-click unsubscribe, lists computed from the database, exactly-once automations that start in rehearsal. Use when writing, rendering, previewing, testing or sending an email, building a flow (welcome, cart abandon, post-purchase, win-back), or splitting a list for a test."
---

# Email: HTML emails the LiftLike way

One HTML shell, copy in a real person's voice, three angles per send, lists computed from the database, every automation sends exactly once. You draft; the user approves the copy and makes every live send. Tools in this folder: `shell.ts` (render, merge fields, list split), `shell.test.ts`, `preview.ts`.

## Pipeline

```
D1 (customers, carts, orders) ──cron──▶ lists ──▶ automation or campaign ──▶ Queue ──▶ Cloudflare Email Service
                                                         │                                   │
                                  sent ledger (D1) ◀─────┘        email_sent / clicked / unsubscribed ──▶ Tinybird
```

- Sending: **[Cloudflare Email Service](https://developers.cloudflare.com/email-service/)** from the Worker, through a Queue.
- Marketing and transactional mail go out from different subdomains (`news.` and `orders.`), so a marketing complaint never hurts order emails.
- SPF, DKIM, and DMARC must be set on both before the first send. Ask the user to confirm; you can't verify inbox placement yourself.

## The shell

Copy `shell.ts`, `shell.test.ts` and `preview.ts` from this folder into the project's `emails/`. One function, blocks in, HTML and plain text out. Render a draft with `bun emails/preview.ts <module> [fields.json]` and look at the files before showing the user.

- **640 px** wide, one column, tables for layout, every style inline. No web fonts, no CSS in `<head>` that the layout depends on.
- System font stack. Body 16–17 px, line height 1.5.
- Brand tokens: canvas, ink, accent. Nothing else.
- **Preheader:** a hidden line after the subject, padded with 100 `&nbsp;&zwnj;` pairs so the inbox preview doesn't run into the body text.
- **One button**, built from a table cell so it renders everywhere. Links are full `https://` URLs.
- Images: hosted on a public URL (R2), with `width`, `alt`, and `display:block`. The email must make sense with images off.
- **Footer:** company name, physical mailing address, one-click unsubscribe.
- Limits: subject ≤ 200 characters, no line breaks. HTML ≤ 60 KB (Gmail clips long emails). Always send a plain-text part.
- Look at it three ways before sending: desktop, phone width, plain text. And in dark mode.

## Voice and copy

1. **A person writes it.** First person, from the founder or a creator, "From: Maya at <brand>". Reply-To is an inbox someone reads.
2. **StoryBrand roles, fixed:** the customer is the hero, the sender is the guide, the product is the plan.
3. **Three angles per send (A / B / C).** For example: the problem, the proof, the identity. Split the list and compare (`ecomm-experiments`).
4. **One idea, one call to action.**
5. **Subject and preheader are written together.** The preheader finishes the thought the subject starts.
6. **Plain writing** (`ecomm-copy`): no em dashes, no machine vocabulary, short sentences.
7. **State the offer exactly:** price, what the discount applies to, when it ends. The same words on the page it links to.

## Merge fields

`{{first_name}}`, `{{product_name}}`, `{{cart_url}}`, `{{unsubscribe_url}}`, and so on.

- Every field has a fallback (`{{first_name|there}}`) or the send is refused. A raw `{{…}}` must never reach an inbox.
- `{{unsubscribe_url}}` is filled by the server per recipient. The client never holds the signing key.

## Lists

- Lists are **computed from D1 on a schedule** (every 15 minutes), not kept by hand: subscribers, browsed-not-bought, cart-abandoned, checkout-abandoned, first-time buyers, repeat buyers, lapsed.
- A synced list is replaced on every sync. Never hand-edit one. Derive from it.
- **Day-N cohorts:** "day 3 of abandoned cart" means people whose cart was created exactly three days ago, not everyone who ever abandoned.
- **Splitting for a test:** `sha256(email + experiment) mod N`. Deterministic, so a re-split puts everyone in the same arm.

## Automations

An automation watches a list and emails each **new** member **exactly once**.

1. Write the recipient into the sent ledger **before** the send attempt. At most once, by design.
2. A failed send is logged and never retried automatically.
3. Creating an automation grandfathers the current members. Only people who join afterward get it, unless catch-up is chosen on purpose.
4. Leaving the list and rejoining does not send again.
5. Pause keeps the ledger. Delete drops it.
6. Every automation starts in **rehearsal**: it counts who it would send to and delivers nothing. Going live is a human action, after the copy is approved.

## Flows

| Flow | Sends | Lead with |
|---|---|---|
| **Welcome** | Now, day 2, day 5 | Who we are and the plan. The best seller. The proof |
| **Browse abandon** | 4 hours | The product they looked at, one reason to believe |
| **Cart / checkout abandon** | 1 hour, day 1, day 3, then 7, 14, 21, 28, 45, 60 | The objection that stopped them. A different angle each send, not a louder one |
| **Order** (transactional) | Confirmation, shipped, delivered | The facts. No selling in the confirmation |
| **Post-purchase** | Day 3 after delivery, day 14, day 30 | How to get the result. Review request. The next product |
| **Replenishment** | When the product should run out | "Running low?" and one tap to reorder |
| **Win-back** | Day 60, 90, 120 since last order | What is new. Then an offer |
| **Campaigns** | 1–2 a week | A launch, a story, a real deadline |

The long abandon tail (day 7 to day 60) is cheap and still converts. Stop a flow the moment the person buys.

## Sending rules

1. **The agent drafts, a human sends.** A live send needs a typed confirmation that equals the subject line.
2. **Smoke first:** send to yourself, read it on a phone, click every link. Then the list.
3. **Suppression is enforced at send time.** Unsubscribed and bounced addresses are skipped whatever the list says.
4. **One-click unsubscribe:** a signed link in the footer and the `List-Unsubscribe` and `List-Unsubscribe-Post` headers. It works without logging in.
5. **Consent:** marketing email goes only to people who opted in or bought from you, and only as long as the law allows that (`ecomm-stack` (`references/compliance.md`)).
6. **Throttle** large sends through the Queue. Watch bounces and complaints as they come in.
7. **Never send twice.** One writer per list and per ledger at a time.

## Measuring

Events to Tinybird (`ecomm-stack` (`references/analytics.md`)): `email_sent`, `email_delivered`, `email_bounced`, `email_clicked`, `email_unsubscribed`, `email_complained`, each with `email_id`, `flow`, `experiment_id`, `variant`.

- Judge on **clicks and orders**, not opens. Mail privacy features open every email automatically.
- Revenue per recipient within 5 days of a click is the number that matters.
- Watch per send: bounce rate, complaint rate, unsubscribe rate. A spike stops the flow.

## Checklist before a live send

- [ ] Copy approved by a human
- [ ] Subject, preheader, and From name read well together in an inbox
- [ ] Every merge field filled, every link opens the right page with tracking
- [ ] Price and offer match the landing page
- [ ] Desktop, phone, plain text, dark mode checked
- [ ] Footer has the address and a working unsubscribe
- [ ] Suppression list applied, list count looks right
- [ ] Smoke send received and read on a phone

## Resources

- [Cloudflare Email Service](https://developers.cloudflare.com/email-service/) · [Queues](https://developers.cloudflare.com/queues/)
- [Google sender guidelines](https://support.google.com/a/answer/81126) · [RFC 8058 one-click unsubscribe](https://www.rfc-editor.org/rfc/rfc8058)
- [Can I email](https://www.caniemail.com) · [Really Good Emails](https://reallygoodemails.com)
