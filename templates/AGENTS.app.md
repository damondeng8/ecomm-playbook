# <Store name>: agent guide

> Copy to your store repo root as `AGENTS.md`, add `CLAUDE.md` containing `@AGENTS.md`, fill in every `<…>`.

## Store

<One-liner: For [who], [product] gets [result] without [the thing they hate].>
Offer: <bundles, bonus, guarantee, shipping threshold>. Price ladder and floor: `docs/EXPERIMENTS.md`.
Customer, awareness level, mechanism, proof, voice: `docs/copy-brief.md`. Reference stores: <2–3 from playbook/09>. Domain watch-outs: <from playbook/00>.

## Stack (nothing else)

- API: one Cloudflare Worker (`apps/api/src/index.ts`), no router framework
- Data: D1 plain SQL (`apps/api/migrations/*.sql`) · R2 images · KV flags and experiment weights · Queues
- Store: React + Vite (`apps/web`) on Workers static assets; screens are section lists fed by data
- Checkout: Stripe; the `orders` table is written only by the verified webhook
- Customers: guest checkout, visitor-id cookie, Better Auth magic links (`apps/api/src/auth.ts`)
- Email: Cloudflare Email Service; every email built with `emails/shell.ts`
- Analytics, experiments, errors: Tinybird via `POST /events`
- Experiments: approvals in `docs/EXPERIMENTS.md`; routine prompts in `.claude/routines/optimizer/`

## Commands

| Do | Run |
|---|---|
| Install | `bun install` |
| Dev (API + store) | `bun dev` |
| Typecheck + lint | `bun run check` |
| Tests | `bun test` |
| Preview an email | `bun emails/preview.ts <name>` (writes HTML and text to `.preview/`) |
| New migration | `wrangler d1 migrations create DB <name>` |
| Apply migrations (staging) | `wrangler d1 migrations apply DB --env staging --remote` |
| Deploy staging | `bun run deploy:staging` |
| Deploy production | `bun run deploy:production` (**humans only**) |

## Rules

1. Run `bun run check && bun test` before done. Screen changes: run the store and look at 390 px. Email changes: render it and look at desktop, phone, and plain text.
2. Ask before adding dependencies or vendors. Never Vercel, Netlify, Lovable, Bolt, v0, Replit, Firebase, Supabase, Clerk, Auth0, Sentry, PostHog, Next.js, Hono, an ORM, or a hosted store or email platform.
3. All server logic on Cloudflare. The server decides every price, discount, and stock level.
4. Copy comes from `docs/copy-brief.md`. Every claim has a source there. No fake urgency, no invented reviews.
5. Use existing design tokens and components (`<path>`).
6. Every screen and every email emits its events.
7. Schema changes are SQL migrations, staging first.
8. Never touch production data, deploy to production, send a live email, change a Stripe price, or commit secrets.
9. Email: you draft, the human approves and sends. New automations start in rehearsal. Never write a raw merge field or skip the suppression list.
10. Experiments: Tier A (copy, button labels, subject lines, order of approved sections, weights) is yours. Tier B (screens, sections, prices, discounts, bundles, shipping, guarantees, new emails, Stripe) needs an `APPROVED` line in `docs/EXPERIMENTS.md`. Never act against a `VETO` line. Never ramp a feature until the founder says so.
11. Decisions go in `docs/decisions/NNNN-title.md`.

## Done means

Works on a phone in the running store, checks and tests pass, events fire, PR says how you verified.
