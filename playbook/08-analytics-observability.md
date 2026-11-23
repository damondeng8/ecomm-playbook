# 08 · Analytics & errors: all in Tinybird

> **Default:** **[Tinybird](https://www.tinybird.co)** for events, orders, email, experiments, and errors. Workers Observability for raw server logs. No separate error tracker or analytics tool.
> **Agent: read this when** adding a screen or an email (each gets its events) or debugging production.

## Pipeline

```
Web ──▶ POST /events (Worker) ──▶ Queue ──▶ Tinybird Events API ──▶ SQL pipes ──▶ dashboards + alerts
Worker (orders, email, errors) ──────────┘
```

- The browser sends events to your own Worker: one schema, first-party, no ad-blocker loss. The Worker adds visitor id, country, device, and the ad source.
- **Money events come from the server.** `order_placed` and `order_refunded` are written by the Stripe webhook, never by the browser.
- The Worker batches through **Queues** and posts NDJSON to the [Events API](https://www.tinybird.co/docs/get-data-in/ingest-apis/events-api) with a write-only token.
- Every record carries `env` (staging or production). Filter on it.

## Events

```
page_viewed             {screen, path, referrer, utm_source, utm_campaign, utm_content, landing_angle}
product_viewed          {product_id}
section_viewed          {screen, section}                 ← which part of the page people reach
experiment_exposed      {experiment_id, variant}          ← from the browser, once, when the surface is on screen
add_to_cart             {product_id, variant_id, quantity, price}
cart_viewed             {items, value}
order_bump_added        {product_id}
checkout_started        {value, items}
email_captured          {source}
payment_submitted       {method}
order_placed            {order_id, value, margin, items, discount, first_order}     ← server
upsell_accepted         {product_id, value}
order_refunded          {order_id, value}                                           ← server
email_sent / email_delivered / email_bounced / email_clicked / email_unsubscribed / email_complained
                        {email_id, flow, experiment_id, variant}
error                   {source: api|web, message, stack, route}
```

`snake_case`, same names everywhere. Every event carries `visitor_id`, and `customer_id` once the email is known. Every screen and every email ships with its events.

## Attribution

- Save the first and the latest `utm_*` and click ids on the visitor, and copy them onto the order.
- A visitor who moves from an in-app browser to Safari looks like a new person. Carry the visitor id in the link when you send them across.
- Ad platforms each claim the same order. Your own orders table is the count. Compare total ad spend with total new-customer orders.

## Errors

- **Worker:** `try/catch` around `fetch`; send an `error` event with `ctx.waitUntil()` ([`templates/worker.ts`](../templates/worker.ts)).
- **Web:** a global handler posts to `/events`, batched.
- **Alerts:** a Cron Trigger queries Tinybird every few minutes (error rate, webhook failures, checkout failures, email bounce and complaint rate) and emails on threshold.

## Daily dashboards

1. Funnel: visit → product view → add to cart → checkout → order, by screen, by ad source, and by device.
2. Revenue: orders, average order value, margin, refunds, new versus returning customers.
3. Experiments: exposed visitors, add to cart, checkout starts, orders, and margin per exposed visitor by `experiment_id` and `variant` ([14](14-experiments.md)), from the [`experiment_readout`](../templates/experiments/experiment_readout.pipe) endpoint.
4. Email: sends, clicks, orders, revenue per recipient, unsubscribes, by flow and variant ([10](10-email.md)).
5. Repeat: second-order rate at 30, 60, 90 days by first-order cohort.
6. Health: error rate, checkout failure rate, page speed.

## Resources

- [Tinybird docs](https://www.tinybird.co/docs) · [Events API](https://www.tinybird.co/docs/get-data-in/ingest-apis/events-api) · [ClickHouse docs](https://clickhouse.com/docs)
- [Workers Observability](https://developers.cloudflare.com/workers/observability/) · [Queues](https://developers.cloudflare.com/queues/)
