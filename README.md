# Ecommerce playbook

How I build and grow an online store with coding agents: one stack, a phase-by-phase checklist, HTML email the way LiftLike does it, copy grounded in the classic advertising books, and an experiment system that tests and ramps variations of every screen and email.

Based on Blake Anderson's [ai-app-playbook](https://github.com/blakeandersonw/ai-app-playbook) (MIT) for the stack and the way of building with agents. The ecommerce chapters, the email system, the copy chapter, and the experiment ownership rules are added here.

To start a store, open Claude Code in an empty folder and say:

```
Read ~/ecomm-playbook/AGENTS.md and start Phase 0
```

## The path

| Phase | What | Check |
|---|---|---|
| 0 · Product | A product a reachable group already wants, with margin. Test it with 10 videos and a presale page | Score ≥ 25/35, real demand, the math works |
| 1 · Brief | Copy brief, reference stores, the offer | Human approves |
| 2–9 · Build | Repo, backend, screens, checkout, analytics, email, polish, launch | "Done when" per phase |
| 10 · First 100 orders | Short-form video, creators, one landing page per angle | Tracked links show orders |
| 11 · Grow | Agent drafts and ramps copy tests (10% → 50/50 → ship after a 24-hour veto window). Founder approves screens, prices, and offers | Weekly report, experiment ledger |

## The stack

| Job | Use |
|---|---|
| Backend, data, files, jobs, email | [Cloudflare](https://developers.cloudflare.com/workers/) (Workers, D1, R2, KV, Durable Objects, Queues, Email Service) |
| Store | React + Vite on Workers static assets |
| Checkout | [Stripe](https://stripe.com) |
| Customers | [Better Auth](https://www.better-auth.com), guest checkout first |
| Analytics, experiments, errors | [Tinybird](https://www.tinybird.co) |
| AI helpers | [OpenRouter](https://openrouter.ai), DeepSeek by default |
| Building | [Claude Code](https://claude.com/claude-code), or [OpenCode](https://opencode.ai) + DeepSeek |

**Don't use:** Vercel, Netlify, Lovable, Bolt, v0, Replit hosting, Bubble, Firebase, Supabase, Clerk, Auth0, Sentry, PostHog, Next.js, ORMs, hosted store builders, hosted email platforms.

## Chapters

| # | Chapter | |
|---|---|---|
| 00 | [Product and offer](playbook/00-product-and-offer.md) | Scorecard, validation, domains |
| 01 | [Building with agents](playbook/01-building-with-agents.md) | Harnesses, building fast, what not to use |
| 02 | [Backend](playbook/02-backend-cloudflare.md) | One Worker, no framework |
| 03 | [Database](playbook/03-database.md) | D1 with plain SQL; store tables |
| 04 | [Customers and accounts](playbook/04-auth.md) | Guest checkout, magic links |
| 05 | [AI](playbook/05-ai.md) | Helpers: quiz, summaries, support |
| 06 | [Screens](playbook/06-screens.md) | The six screens, build order, built to be tested |
| 07 | [Checkout, offers, pricing](playbook/07-payments-pricing.md) | Stripe, bundles, price ladder, reprice checklist |
| 08 | [Analytics & errors](playbook/08-analytics-observability.md) | All in Tinybird |
| 09 | [Design & UX](playbook/09-design-ux.md) | Finding UI to copy, the funnel |
| 10 | [Email](playbook/10-email.md) | The HTML shell, voice, lists, automations, flows |
| 11 | [Distribution](playbook/11-distribution.md) | Short-form, creators, ads, referrals |
| 12 | [Unit economics](playbook/12-costs.md) | Margin per order, cost to acquire |
| 13 | [Security, privacy, selling rules](playbook/13-security-privacy-compliance.md) | Consent, claims, policies |
| 14 | [Experiments](playbook/14-experiments.md) | Variation testing, who owns what, SCAN and DRAFT routines, the ramp |
| 15 | [Copy](playbook/15-copy.md) | Breakthrough Advertising, Propaganda, the sales books |

**Templates:** [`worker.ts`](templates/worker.ts) · [`auth.ts`](templates/auth.ts) · [`wrangler.jsonc`](templates/wrangler.jsonc) · [`AGENTS.app.md`](templates/AGENTS.app.md) · [`dev.vars.example`](templates/dev.vars.example) · [`email/`](templates/email/) · [`experiments/`](templates/experiments/)

---

MIT © Blake Anderson, with modifications © Damon Deng
