---
name: ecomm-stack
description: "Engineering rules and templates for a custom online store on Cloudflare (Workers with a plain fetch handler, D1 plain SQL, R2, KV, Queues, Email Service), Stripe, Better Auth, Tinybird and React + Vite. Covers the Worker route layout, store tables (products, variants, carts, orders, experiment assignments, email ledger), visitor-id and guest-checkout identity, the event schema and dashboards, and security, privacy, email-consent and selling rules. Use when scaffolding or changing the store's backend, database, auth, analytics events or deployment, or checking a launch against compliance rules."
---

# Store stack

One Cloudflare account for API, data, files, jobs, email, and the web store. No framework, no ORM, no hosted store or email platform.

| Job | Use |
|---|---|
| Server, data, files, jobs, email, hosting | **Cloudflare**: Workers (plain `fetch` handler), D1 (plain SQL), R2, KV, Durable Objects, Queues, Email Service, Turnstile |
| Store front end | **React + Vite** on Workers static assets (`ecomm-screens`) |
| Checkout, tax, subscriptions | **Stripe** (`ecomm-checkout`) |
| Customers and admin sign-in | **Better Auth** in the Worker, guest checkout first |
| Email | **Cloudflare Email Service**, HTML from the `ecomm-email` shell |
| Analytics, experiments, errors | **Tinybird** (`ecomm-experiments`) |
| Database at scale | **PlanetScale** via Hyperdrive |

**Do not add:** Vercel, Netlify, Firebase, Supabase, Clerk, Auth0, Sentry, PostHog, Next.js, Hono, Drizzle, Prisma, a hosted store builder, or a hosted email platform. If the stack can't do something, stop and ask. In a project that already uses one of these, the project's own stack wins.

## Rules

1. The server decides every price, discount, stock level, shipping cost, and tax. The cart the browser sends is a request, not a fact.
2. `orders` is written only by the verified Stripe webhook. Writes are idempotent, keyed by event id.
3. Every request carries a first-party visitor id (signed cookie set by the Worker). Cart, events, and experiment assignment hang off it.
4. Never require an account to buy. Ask for the email first at checkout.
5. Plain SQL with `prepare().bind()`. Every schema change is a migration, staging first.
6. Secrets through `wrangler secret put` and gitignored `.dev.vars`. Nothing secret in the browser.
7. Separate staging and production resources. Never touch production data, run a production deploy or migration, switch Stripe to live keys, or send a live email without the user doing it or saying so.
8. Every screen and email emits its events to `POST /events`. Money events come from the server.
9. Await or `ctx.waitUntil()` every promise. Queue jobs are safe to run twice.
10. Ask before adding a dependency.

## Where things are

| Need | Read |
|---|---|
| Building blocks, repo layout, routing, Worker rules | `references/backend.md` |
| Store tables, migrations, when to move off D1 | `references/database.md` |
| Visitor id, guest checkout, magic links, admin | `references/customers.md` |
| Event names, attribution, dashboards, alerts | `references/analytics.md` |
| Security, privacy, email consent, claims, launch checklist | `references/compliance.md` |

## Templates

Copy from `templates/` into the project:

| File | Becomes |
|---|---|
| `worker.ts` | `apps/api/src/index.ts`: every route in one `fetch` handler |
| `auth.ts` | `apps/api/src/auth.ts`: Better Auth with magic links |
| `wrangler.jsonc` | `apps/api/wrangler.jsonc`: dev, staging, production bindings |
| `dev.vars.example` | `apps/api/.dev.vars` (test keys only) |

`worker.ts` imports modules (`./catalog`, `./cart`, `./orders`, `./email`, `./experiments`, `./events`, `./visitor`) that you write for the project.
