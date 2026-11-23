# Database: D1 → PlanetScale

> **Default:** D1, plain SQL, Wrangler migrations. **Scale path:** PlanetScale Postgres via Hyperdrive. No ORM.

## Where data goes

| Data | Store |
|---|---|
| Products, carts, orders, customers, email ledger | **D1** |
| Stock counters under load | **Durable Object** (SQLite) |
| Config, flags, cached reads | **KV** |
| Product images and video | **R2** (key in D1) |
| Embeddings | **Vectorize** |

## Plain SQL

```ts
const orders = await env.DB
  .prepare("SELECT id, total_cents, status, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50")
  .bind(customer.id)
  .all();
```

- Always `prepare().bind()`. No string-built SQL.
- `env.DB.batch([...])` for multi-statement writes.
- Queries live next to the feature (`orders.ts`), one typed function each.

## Migrations

```bash
wrangler d1 migrations create DB add_orders          # creates migrations/000N_add_orders.sql
wrangler d1 migrations apply DB --local               # dev
wrangler d1 migrations apply DB --env staging --remote
wrangler d1 migrations apply DB --env production --remote   # humans only
```

Every schema change is a migration in git. Never hand-edit production.

## Starter tables

```sql
-- Better Auth creates: user, session, account, verification (see 04)
CREATE TABLE products (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE variants (                                     -- the thing you ship; price lives here
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  price_cents INTEGER NOT NULL, cost_cents INTEGER NOT NULL, stock INTEGER NOT NULL, stripe_price_id TEXT
);
CREATE TABLE carts (                                        -- keyed by visitor; abandoned-cart emails read this
  id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL, email TEXT, items TEXT NOT NULL,   -- JSON
  status TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE orders (                                       -- written only by the Stripe webhook
  id TEXT PRIMARY KEY, visitor_id TEXT, customer_id TEXT, email TEXT NOT NULL,
  status TEXT NOT NULL,                                     -- paid | fulfilled | refunded | disputed
  total_cents INTEGER NOT NULL, margin_cents INTEGER NOT NULL, items TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL, utm TEXT, experiments TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE experiment_assignments (                       -- a visitor keeps their arm (14)
  visitor_id TEXT NOT NULL, experiment_id TEXT NOT NULL, variant TEXT NOT NULL, assigned_at INTEGER NOT NULL,
  PRIMARY KEY (visitor_id, experiment_id)
);
CREATE TABLE email_consent (email TEXT PRIMARY KEY, status TEXT NOT NULL, source TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE email_ledger (                                 -- written BEFORE the send: at most once (10)
  automation_id TEXT NOT NULL, email TEXT NOT NULL, sent_at INTEGER NOT NULL,
  PRIMARY KEY (automation_id, email)
);
```

ULIDs or UUIDv7 for ids. Never expose auto-increment ids.

## Move to PlanetScale when

- D1 is near its size limit or writes queue.
- You need Postgres features: rich joins, JSONB, `pgvector`, heavy analytics.
- You need zero-downtime schema changes on big tables or branches per PR.

Otherwise stay on D1.

## How to move

1. The user creates a [PlanetScale Postgres](https://planetscale.com/docs/postgres) database.
2. Put **[Hyperdrive](https://developers.cloudflare.com/hyperdrive/)** in front of it.
3. Query with [`postgres`](https://github.com/porsager/postgres) over `env.HYPERDRIVE.connectionString`, plain SQL.
4. Port migrations to Postgres; use PlanetScale branches for staging.
5. Dual-write, backfill, verify parity per table, cut over. Keep D1 until parity is proven.

## Resources

- [D1 docs](https://developers.cloudflare.com/d1/) · [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/) · [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [PlanetScale docs](https://planetscale.com/docs) · [Hyperdrive + Postgres](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/)
