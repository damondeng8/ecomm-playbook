# Customers and accounts

> **Default:** guest checkout. An email is the only thing a shopper must give. Accounts are optional, passwordless, and made from the order. [Better Auth](https://www.better-auth.com) in the Worker.

## Rules

1. **Never require an account to buy.**
2. **A visitor id from the first page view:** a first-party cookie, random, set by the Worker. Cart, events, and experiment assignment hang off it (`ecomm-experiments`).
3. **Ask for the email first at checkout.** It ties the visitor id to a person and makes an abandoned checkout recoverable (`ecomm-email`). Ask for marketing consent separately, unticked.
4. **Order lookup by magic link.** "Where is my order?" sends a link to the email on the order. No password.
5. **Account = the same email, later.** Subscriptions and reorders use a magic link sign-in. Orders made as a guest attach to the account by email.
6. **Admin** (orders, refunds, email sends) is a separate sign-in limited to your own domain, with its own rate limits.
7. Rate-limit `/api/auth/*`. Turnstile on email forms.
8. No custom crypto or sessions. No hosted auth vendor (Clerk, Auth0, Firebase, Supabase).

## Setup

1. `bun add better-auth`
2. Copy [`templates/auth.ts`](../templates/auth.ts) to `apps/api/src/auth.ts`. Keep the [`magicLink`](https://www.better-auth.com/docs/plugins/magic-link) plugin, sent through Cloudflare Email Service. Add Google only if customers ask.
3. Auth tables as a D1 migration: generate the SQL with `npx @better-auth/cli generate`, save it as `migrations/0001_auth.sql`, apply with `wrangler d1 migrations apply`.
4. Route it:
   ```ts
   if (url.pathname.startsWith("/api/auth/")) return auth.handler(request);
   const session = await auth.api.getSession({ headers: request.headers });
   ```
5. Secrets: `wrangler secret put BETTER_AUTH_SECRET` (`openssl rand -base64 32`).

## Deleting data

A customer can ask for their data to be deleted. Remove the account and marketing data. Keep the order records the law requires you to keep, and say so (`ecomm-stack` (`references/compliance.md`)).

## Resources

- [Better Auth docs](https://www.better-auth.com/docs) · [Database (D1)](https://www.better-auth.com/docs/concepts/database) · [Magic link](https://www.better-auth.com/docs/plugins/magic-link)
