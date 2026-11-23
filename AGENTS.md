# AGENTS.md: build a profitable online store

You are a coding agent (Claude Code, OpenCode, Codex, …). The human wants to sell a physical or digital product online, at a profit, on this stack: a fast store, an honest offer, email that brings people back, and experiments that keep improving it.

If you were told to read this file: read all of it, then start **Phase 0** by asking the Phase 0 questions.

Walk the human through every phase in order. Do **[AGENT]** steps yourself. Give exact instructions for **[HUMAN]** steps. Don't skip **Gate A**.

---

## Rules

1. **Helpful first.** Sell something that does what the page says. True claims, real prices, real deadlines, easy returns, easy unsubscribe. No dark patterns.
2. **UX first.** Pick the faster, simpler option. Phone first.
3. **Use only this stack:**

| Job | Use |
|---|---|
| Server, data, files, jobs, email, hosting | **Cloudflare**: Workers (plain `fetch` handler), D1 (plain SQL), R2, KV, Durable Objects, Queues, Workflows, AI Gateway, Email Service, Turnstile |
| Store front end | **React + Vite** on Workers static assets |
| Checkout, tax, subscriptions | **Stripe** |
| Customers and admin sign-in | **Better Auth** (a library in the Worker), guest checkout first |
| Database at scale | **PlanetScale** via Hyperdrive |
| Email | **Cloudflare Email Service**, HTML from `templates/email/shell.ts` |
| Analytics, experiments, errors | **Tinybird** |
| AI helpers | **OpenRouter**, **DeepSeek** by default |
| Fulfilment | The human's 3PL or label provider, called from a Queue |
| Coding | **Claude Code** (max performance) · **OpenCode + DeepSeek** (efficiency) |

4. **Do not use:** Vercel, Netlify, Lovable, Bolt, v0, Replit (hosting), Bubble, Firebase, Supabase, Heroku, Render, Railway, AWS Amplify, Clerk, Auth0, Sentry, PostHog, Next.js, Hono, Drizzle, Prisma, or a hosted store builder or email platform. If the stack can't do something, stop and ask.
5. Ask before adding a dependency. Prefer platform APIs (fetch, SQL, CSS variables).
6. All server logic runs on Cloudflare. Keys never ship in the browser. The server decides every price.
7. Staging first. Never touch production data or run production deploys or migrations.
8. Before saying done: run checks and tests, and look at the running store on a phone.
9. **Copy** (chapter 15): fill in `docs/copy-brief.md` before writing a headline, a page, or an email. Every claim has a source.
10. **Email** (chapter 10): the agent drafts. A human approves the copy and makes every live send. New automations start in rehearsal.
11. **Experiments** (chapter 14): **Tier A** (copy, button labels, subject lines, order of approved sections, rollout weights) is the agent's to draft, ramp, and ship after a 24-hour veto window. **Tier B** (screens, sections, prices, discounts, bundles, shipping, guarantees, new emails, Stripe) needs a founder `APPROVED` line in `docs/EXPERIMENTS.md` first. A `VETO` line stops the agent. New features ramp only when the founder says so.
12. Ad spend is the human's. The agent never raises a budget.
13. Build fast (chapter 01): product page → cart → test payment → confirmation email on day 1, fake what isn't built, copy flows from references, park other ideas in `docs/later.md`.

## Chapters by phase

| Phase | Read |
|---|---|
| 0 Product | [00 · Product and offer](playbook/00-product-and-offer.md), [12 · Unit economics](playbook/12-costs.md) |
| 1 Brief | [15 · Copy](playbook/15-copy.md), [09 · Design & UX](playbook/09-design-ux.md), [11 · Distribution](playbook/11-distribution.md) |
| 2 Repo | [01 · Building with agents](playbook/01-building-with-agents.md) |
| 3 Backend | [02 · Backend](playbook/02-backend-cloudflare.md), [03 · Database](playbook/03-database.md) |
| 4 Screens | [06 · Screens](playbook/06-screens.md) |
| 5 Checkout | [07 · Checkout, offers, pricing](playbook/07-payments-pricing.md), [04 · Customers](playbook/04-auth.md) |
| 6 Analytics | [08 · Analytics & errors](playbook/08-analytics-observability.md) |
| 7 Email | [10 · Email](playbook/10-email.md) |
| 8 Polish | [09 · Design & UX](playbook/09-design-ux.md), [05 · AI](playbook/05-ai.md) |
| 9 Launch | [13 · Security, privacy, selling rules](playbook/13-security-privacy-compliance.md) |
| 10–11 Grow | [11 · Distribution](playbook/11-distribution.md), [14 · Experiments](playbook/14-experiments.md) |

Templates in [`templates/`](templates/): `AGENTS.app.md`, `worker.ts`, `auth.ts`, `wrangler.jsonc`, `dev.vars.example`, `email/` (`shell.ts` and its tests), `experiments/` (`EXPERIMENTS.md` ledger, `SCAN.md` and `DRAFT.md` routine prompts, `experiment_readout.pipe` for Tinybird). Prefer linked docs over memory. Cloudflare's agent index: <https://developers.cloudflare.com/llms.txt>.

---

## Checklist

Copy into the store's `docs/progress.md`. Update it and show it after every phase.

### Phase 0: Product and offer (1–7 days) · GATE A

- [ ] **[AGENT]** Ask in one message: What do you want to sell, or who can you reach? What does it cost you landed? What do those people already buy and complain about? Who do they listen to?
- [ ] **[AGENT]** Score the product, or propose 3 (chapter 00): one-liner, 2–3 reference stores, domain watch-outs, scorecard (7 criteria, 1–5 each).
- [ ] **[AGENT]** Read competitors' 1–3★ reviews into `docs/voice-of-customer.md`. Write 10 short-form video hooks. Draft a presale or waitlist page (Worker + D1) with the real price.
- [ ] **[HUMAN]** Post the videos and the page for one week.
- [ ] **[AGENT]** Run chapter 12 unit economics with the human's real costs in `docs/unit-economics.md`.
- **Gate A, build only if:** scorecard ≥ 25/35 with no 1s · demand signal (saves, shares, "where can I buy this?", ≥ 10% of visitors leave an email, or presale orders) · contribution margin before ads clearly above the expected cost to acquire a customer.

### Phase 1: Brief

- [ ] **[AGENT]** `docs/copy-brief.md` (chapter 15): customer, desire in their words, awareness level, sophistication stage, mechanism, proof, offer, objections, voice. Every line sourced.
- [ ] **[AGENT]** Reference stores (chapter 09): screenshots at phone width in `docs/references/`, a teardown each, their emails. One reference per screen.
- [ ] **[AGENT]** `docs/brief.md`: one-liner, the offer (bundles, bonus, guarantee, shipping), price ladder and floor, the six screens, the email flows, distribution plan (chapter 11), unit economics.
- **Done when:** the human approves both briefs.

### Phase 2: Accounts & repo

- [ ] **[HUMAN]** Create accounts (send only the ones needed):
  [Cloudflare](https://dash.cloudflare.com/sign-up) (Workers Paid + domain) · [GitHub](https://github.com) · [Stripe](https://dashboard.stripe.com/register) · [Tinybird](https://www.tinybird.co) · [OpenRouter](https://openrouter.ai) (only if using AI helpers) · a fulfilment provider
- [ ] **[HUMAN]** Run `npx wrangler login` and `gh auth login`.
- [ ] **[AGENT]** Scaffold `apps/api` (from `templates/worker.ts` + `templates/wrangler.jsonc`), `apps/web` (`npm create cloudflare@latest -- apps/web --framework=react`), `emails/` (from `templates/email/`), `docs/decisions`. Copy `templates/AGENTS.app.md` to `AGENTS.md` and fill it in; add `CLAUDE.md` containing `@AGENTS.md`. Copy `templates/experiments/EXPERIMENTS.md` to `docs/EXPERIMENTS.md`. Root scripts: `dev`, `check`, `test`, `deploy:staging`, `deploy:production`. Gitignore `.dev.vars*`, `.wrangler`, `node_modules`.
- **Done when:** `bun run check && bun test` passes and the first commit is pushed.

### Phase 3: Backend + database

- [ ] **[AGENT]** D1, KV, R2, Queues for staging and production; ids in `wrangler.jsonc`.
- [ ] **[AGENT]** Migrations (plain SQL, chapter 03): products, variants, carts, orders, experiment assignments, email consent and ledger, Better Auth tables.
- [ ] **[AGENT]** `GET /health`, catalog and cart routes with server-side prices, a visitor-id cookie, JSON errors with an `error` event to Tinybird. Deploy to staging.
- **Done when:** `curl https://api-staging.<domain>/health` returns 200, migrations are applied on staging, and the cart total is computed by the server.

### Phase 4: Screens

- [ ] **[AGENT]** Design tokens first (chapter 09). Then the product page, cart drawer, and thank-you page from chapter 06, as section lists fed by data, with copy from the brief.
- [ ] **[AGENT]** One landing page for the first ad angle. Policies pages.
- **Done when:** at 390 px on staging, a visitor can land, read the product page, and add a bundle to the cart, with every state handled.

### Phase 5: Checkout & orders

- [ ] **[HUMAN]** In Stripe: turn on Apple Pay, Google Pay, Link, and Stripe Tax. Set secrets with `wrangler secret put` (agent gives the commands).
- [ ] **[AGENT]** Guest checkout in **test mode**, email first. `/webhooks/stripe` with verified signatures and idempotent writes; it is the only writer of `orders`. Order bump, post-purchase upsell, discount codes.
- [ ] **[AGENT]** Order lookup by magic link, admin sign-in, refund handling, fulfilment job on the Queue.
- **Done when:** a test-mode wallet order on a phone lands in `orders`, reaches the fulfilment job, and a test refund updates it.

### Phase 6: Analytics & experiments plumbing

- [ ] **[AGENT]** `POST /events` → Queue → Tinybird, with chapter 08 events from every screen; `order_placed` from the webhook; `error` from Worker and web. First and latest ad source saved on the visitor and copied to the order.
- [ ] **[AGENT]** Experiment plumbing (chapter 14): KV weights, D1 assignments, `experiment_exposed` from the browser, `copy()` lookup with fail-closed control, `templates/experiments/experiment_readout.pipe` deployed to Tinybird.
- [ ] **[AGENT]** Tinybird dashboards: funnel, revenue and margin, experiments, email, repeat rate, health. Cron alerts.
- **Done when:** a staging run-through shows every event, a thrown test error appears in Tinybird, and a dummy experiment returns a readout with both arms.

### Phase 7: Email

- [ ] **[HUMAN]** Verify sending subdomains in Cloudflare Email Service; SPF, DKIM, DMARC.
- [ ] **[AGENT]** `emails/shell.ts` with the brand tokens. Signed one-click unsubscribe, suppression list, consent records, `List-Unsubscribe` headers, send limits.
- [ ] **[AGENT]** Order emails (confirmation, shipped, delivered). Lists synced from D1 on a cron. Automations with the sent ledger, in rehearsal.
- [ ] **[AGENT]** Draft the flows from chapter 10: welcome, browse abandon, cart and checkout abandon (three angles each), post-purchase, win-back. Rendered previews for the human at desktop, phone, and plain text.
- [ ] **[HUMAN]** Approve the copy. Smoke-send each to yourself. Take automations live.
- **Done when:** a staging order sends the confirmation email, an abandoned staging cart would send exactly one email per step in rehearsal, and unsubscribe works from a real inbox.

### Phase 8: Polish

- [ ] **[AGENT]** Loading, empty, out-of-stock, and payment-failed states. Page speed: prerender, image sizes, no layout shift. Accessibility.
- [ ] **[AGENT]** Test in the Instagram and TikTok in-app browsers.
- [ ] **[HUMAN]** Buy from the store on a real phone. Taste is the human's call.
- **Done when:** the human signs off on a device.

### Phase 9: Launch

- [ ] **[AGENT]** Chapter 13 launch checklist. Every claim on the page traced to its source.
- [ ] **[HUMAN]** Publish Privacy, Terms, Shipping, and Returns. Switch Stripe to live keys. Run the production deploy (agent prepares commands and a rollback plan). Make one real order and refund it.
- **Done when:** a real order is paid, confirmed by email, fulfilled, and refunded, and the production health check is green.

### Phase 10: First 100 orders

- [ ] **[AGENT]** A 30-day content plan (5 formats × daily posts), hooks written per awareness level, a creator brief, one landing page per ad angle, tracked links and codes.
- [ ] **[AGENT]** Creator list (chapter 11): handle, followers, average views, niche, contact. Draft DMs.
- [ ] **[HUMAN]** Post daily, send the DMs, ship product to creators, set the ad budget and target cost per order.
- **Done when:** content is live, tracked links show orders, and real numbers replace the estimates in `docs/unit-economics.md`.

### Phase 11: Grow to profit (weekly)

- [ ] **[AGENT]** Weekly report: visitors, conversion rate, average order value, margin, cost per order by source, email revenue per recipient, repeat rate, refunds, top errors, best and worst creative.
- [ ] **[AGENT]** Set up the optimizer (chapter 14): copy `templates/experiments/SCAN.md` and `DRAFT.md` to `.claude/routines/optimizer/`, fill them in, and give the human the two routines to create. DRAFT proposes one Tier A copy test a day from the biggest drop-off. SCAN launches at 10%, ramps to 50/50, and ships winners after a 24-hour veto window.
- [ ] **[HUMAN]** Create the two routines, with a Tinybird read token and a Cloudflare token scoped to the experiments KV namespace. Merge and deploy drafts. Write `APPROVED` and `VETO` lines. Decide every Tier B change.
- [ ] **[AGENT]** Propose one offer improvement (bundle, bump, upsell, threshold) and one product-page improvement from reviews and support, with the numbers.
- [ ] **[HUMAN]** Scale what works: more creators, more angles, then more ad spend.

---

## Report format (end of every phase)

```
Phase N: <name>: ✅ done | ⚠️ partially done | ⛔ blocked
Done: <what changed>
Verified: <the exact checks you ran and their result>
Your turn: <numbered human steps with links>, or "nothing, starting Phase N+1"
Money: <any new recurring cost> · <orders, AOV, margin, cost per order, from Phase 10 on>
```
