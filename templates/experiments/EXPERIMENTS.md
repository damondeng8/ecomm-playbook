# Experiments: governance ledger

> Copy to `docs/EXPERIMENTS.md`. This is the approval ledger for experiments and price changes (playbook chapter 14).

- **Tier A** (headlines, body copy, button labels, order of approved sections, email subject lines and angle variants of an approved email, rollout weights): the agent runs these on its own.
- **Tier B** (new, removed, or redesigned screens or sections; prices, discounts, bundles, shipping, guarantee terms; a new email, a new list, send frequency; Stripe): needs a founder `APPROVED` line in this file before any traffic is routed.

One line per decision. Do not delete lines; supersede them.

- `- **<date> — ⛔ PROPOSED (agent, Tier A copy): <title>.**` blocks are written by the DRAFT routine. SCAN launches them at 10% once the code is live in production.
- `VETO — <experiment-key> — <date> — <reason>` lines are founder-only. SCAN never ships or changes a vetoed experiment. SCAN records `RECOMMEND SHIP` and waits 24 hours before it ships a proven Tier A winner, so a `VETO` inside that window stops the ship.
- Routines never write `APPROVED` or `VETO` lines and never touch Tier B.

## Price ladder

Rungs at or above the floor are pre-approved for testing. A standing price still needs its own `APPROVED` line.

| Product | Rungs | Floor |
|---|---|---|
| <product or bundle> | <…> | <…> |
| <product or bundle> | <…> | <…> |

## Decisions

<!-- Newest first. Examples of each line: -->

<!--
VETO — offer-bundle-low — 2026-01-12 — founder-controlled price test; ramp and ship by APPROVED line only.

- **2026-01-12 — APPROVED (founder): auto-ramp to 50/50 for `offer-bundle-low`.**
  SCAN may move this from 80/20 to 50/50 once: after 7 full days, a significant win on margin per exposed visitor (p < 0.05), cash per exposed visitor at least 80% of control, and a clean sample ratio. Never more than 50%. A standing price needs a new APPROVED line.

- **2026-01-10 — ⛔ PROPOSED (agent, Tier A copy): product page headline.**
  Control: "<string>". Test: "<string>".
  Hypothesis: <drop-off step and what people did there, with numbers>. <Metric expected to move and why>.
  Primary: exposure → add to cart. Secondary: exposure → checkout started, exposure → order placed.
  Tier A (copy only). Fail-closed to control. Experiment key `pdp-headline-v1`. Deploy marker: <file or sha that proves it is live>.
  Launch rollout: 10% test / 90% control, ramp to 50/50 after 100 clean test exposures (SCAN).

- **2026-01-08 — ENDED (founder): `landing-hero-v1`.**
  Inconclusive after 30 days. Control stays. <numbers per arm>.
-->
