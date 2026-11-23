# 12 · Unit economics

> **Default:** know the contribution margin per order and the cost to acquire a customer before spending on ads. The stack costs little; product, shipping, and ads decide whether the store makes money.
> **Agent: read this when** checking a product idea, setting a price, or planning ad spend. Every number here comes from the human or from live vendor pricing. Never invent one.

## Per order

```
  average order value (AOV)
− landed product cost (product, packaging, freight, duty)
− pick, pack, and shipping
− payment fees
− returns and refunds (rate × cost)
= contribution margin before ads
− cost to acquire the order (ad spend ÷ orders)
= contribution margin
```

## Per customer

```
lifetime value = contribution margin before ads × orders per customer over 12 months
```

Use your own repeat rate from D1. Before you have one, assume one order.

## Tests

| Question | Pass |
|---|---|
| Does the first order pay for itself? | Contribution margin before ads ≥ cost to acquire the customer |
| If not, does the customer? | 12-month lifetime value ≥ 3 × cost to acquire, and you can fund the gap |
| What can I pay for a customer? | The break-even is the contribution margin before ads. Bid below it |
| What does a 10% lift in conversion do? | 10% more orders for the same ad spend: all of it is margin |

## Worked template (`docs/unit-economics.md`)

| Line | Yours |
|---|---|
| Price / AOV | |
| Landed cost | |
| Shipping and fulfilment | |
| Payment fees | |
| Refund allowance | |
| **Margin before ads** | |
| Visitors per order (1 ÷ conversion rate) | |
| Cost per visitor | |
| **Cost to acquire** | |
| **Contribution margin** | |
| Repeat orders in 12 months | |

## The levers, in order

1. **Average order value** ([07](07-payments-pricing.md)): bundles and the order bump move margin fastest, because the ad cost is already paid.
2. **Conversion rate** ([06](06-screens.md), [14](14-experiments.md)).
3. **Repeat orders** ([10](10-email.md)): email costs almost nothing per order.
4. **Cost per visitor** ([11](11-distribution.md)): better creative, not higher bids.
5. **Landed cost:** renegotiate at volume.

## Stack costs

Small next to product and ads. Check live pricing before planning:

[Cloudflare Workers](https://developers.cloudflare.com/workers/platform/pricing/) · [D1](https://developers.cloudflare.com/d1/platform/pricing/) · [R2](https://developers.cloudflare.com/r2/pricing/) · [Email Service](https://developers.cloudflare.com/email-service/) · [Stripe](https://stripe.com/pricing) · [Tinybird](https://www.tinybird.co/pricing) · [OpenRouter](https://openrouter.ai/models)

One account, one bill for hosting. R2 has no egress fees, which matters for product images and video.
