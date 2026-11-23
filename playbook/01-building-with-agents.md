# 01 · Building with coding agents

> **Default:** Claude Code (subscription) for hard work. OpenCode + DeepSeek for volume.
> **Agent: read this when** setting up the repo, the dev loop, or parallel work.

## Harness

| Job | Harness |
|---|---|
| Architecture, hard bugs, new features, risky work | **[Claude Code](https://claude.com/claude-code)** on a Max plan |
| Refactors, tests, migrations, copy, translations | **[OpenCode](https://opencode.ai)** + **DeepSeek** |

## Stack

| Job | Use |
|---|---|
| Server | **Cloudflare**: Workers, D1, R2, KV, Durable Objects, Queues, Workflows, AI Gateway, Email |
| Auth | **Better Auth** (library in your Worker) |
| Database at scale | **PlanetScale** |
| AI | **OpenRouter** (DeepSeek default), models picked with **Artificial Analysis** |
| GPU workflows at volume | **Vast.ai** / **RunPod** |
| Payments | **Stripe** |
| Analytics + errors | **Tinybird** |
| Store | **React + Vite** on Workers static assets |
| Email | **Cloudflare Email Service** |

Plain platform APIs: Workers `fetch` handler, SQL, CSS variables. No router framework, ORM, or UI kit.

## Do not use

**Vercel · Netlify · Lovable · Bolt · v0 · Replit (hosting) · Bubble · FlutterFlow · Firebase · Supabase · Heroku · Render · Railway · AWS Amplify · Clerk · Auth0 · Sentry · PostHog · Next.js · Hono · Drizzle / Prisma**

Solve it with the stack. If that's impossible, ask the human.

## Repo setup

1. `AGENTS.md` at the root: stack, commands, rules, "never" list. `CLAUDE.md` contains `@AGENTS.md`. Start from [`templates/AGENTS.app.md`](../templates/AGENTS.app.md).
2. One-command loops: `bun dev`, `bun test`, `bun run check`, `bun run deploy:staging`.
3. `docs/decisions/`: one short file per decision.
4. Small files with obvious names: `catalog.ts`, `cart.ts`, `orders.ts`, `email.ts`, `events.ts`.

## Build fast

1. Day 1: the core loop (product page → cart → test payment → confirmation email) end to end on a real phone.
2. Fake the catalog, reviews, and stock until the screens are right.
3. Copy flows from a reference ([09](09-design-ux.md)).
4. Start from [`templates/`](../templates/).
5. Fast loops: `wrangler dev` + Vite hot reload at phone width, `curl`, the email shell rendered to a local file.
6. Parallel agents on separate parts (API, screens, emails, copy), each in its own worktree.
7. Deploy to staging daily. Buy from your own store on your phone each evening.
8. Park non-launch ideas in `docs/later.md`.
9. No abstractions until the third copy.
10. Timebox:
    - Week 1: product page, checkout, orders.
    - Week 2: landing pages, email flows, analytics.
    - Week 3: polish, policies, first creators.
    - Week 4: launch.

## Dev loop

- Typecheck plus tests in seconds.
- Run the app and check the screen you changed.
- One task per branch. PR says how it was verified.

## Parallel agents

- One task, one branch, one git worktree per agent (`git worktree add ../wt/feature-x -b feature-x`).
- No two agents on the same files.
- The human reviews and merges.

## Prompting

- Goal plus "done when": "Shoppers can pay with Apple Pay. Done when a test-mode wallet order lands in `orders` and the confirmation email arrives."
- Point at files and docs; don't paste them.
- Name constraints: "no new dependencies", "Cloudflare only", "use the existing tokens".

## Resources

- [Claude Code docs](https://docs.claude.com/en/docs/claude-code/overview) · [Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [OpenCode docs](https://opencode.ai/docs) · [agents.md](https://agents.md)
- [Cloudflare docs index for agents (llms.txt)](https://developers.cloudflare.com/llms.txt)
