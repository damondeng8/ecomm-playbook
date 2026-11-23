# 14 · Experiments: Claude writes the variations, the numbers ramp them

> **Default:** one experiment running per surface at all times. **Claude Code** writes each variation as code, **Superwall** splits the traffic, [`ramp.ts`](../templates/experiments/ramp.ts) decides the next split, and a human approves anything that reaches 100%.
> **Agent: read this when** proposing, building, checking, or ending an A/B test on a paywall, onboarding flow, or offer.

## The loop

```
learnings + funnel data ──▶ Claude writes a hypothesis and one variation ──▶ human approves the start
        ▲                                                                            │
        │                                                                            ▼
record the result ◀── winner to 100% (human) ◀── 50/50 for a week ◀── 25% ◀── 10% of traffic
```

1. **Create.** `/experiment-new` reads `experiments/learnings.md` and the funnel, picks the weakest step, and writes one hypothesis and one variation.
2. **Ramp.** `/experiment-tick` runs daily. It reads the numbers, runs `ramp.ts`, and applies or proposes the next split.
3. **Decide.** A winner needs a full week at an equal split. A human promotes it.
4. **Learn.** Every result, including losses and inconclusive runs, goes into `experiments/learnings.md`. The next variation starts from that file.

## What to test, in order

Test the biggest drop in the funnel first ([08](08-analytics-observability.md), dashboard 1).

| Order | Surface | Variations Claude can build alone | Needs a human |
|---|---|---|---|
| 1 | Paywall | Layout, headline, benefit order, plan order, trial timeline, social proof, close-button timing | New prices or trial lengths (new store products) |
| 2 | Onboarding | Question order, number of steps, the personalized result screen, where the paywall sits | Anything that changes what the app promises |
| 3 | Abandon offer | Copy, timing, design | The discount itself |
| 4 | Web landing and checkout | Headline, hero, plan layout | Prices |

Build every tested screen as a Superwall code surface (`superwall/` in the app repo) behind a placement, so a variation ships without an app release. Native screens can only be tested once per release.

## Creating a variation

1. **One hypothesis, one change.** "Showing the trial timeline will raise trial starts because 1–3★ reviews say people fear a surprise charge." If two things change, the result teaches nothing.
2. **Source it.** Each hypothesis cites a review, a support message, a funnel number, or a reference app ([09](09-design-ux.md)). No sourceless ideas.
3. **Check the log first.** Never rebuild a variation that already lost unless the record says what is different this time.
4. **Build it** with `superwall create` and the project's design tokens. Look at it in `superwall dev` at phone width, light and dark.
5. **Pass the paywall checklist** in [07](07-payments-pricing.md). A variation with a hidden close button, fake urgency, or a missing price never ships, however well it might convert.
6. **Write the record** from [`EXPERIMENT.md`](../templates/experiments/EXPERIMENT.md) before any traffic moves.

Up to three challengers can run against one control. Each extra arm slows the test, so default to one.

## Ramping

`ramp.ts` is a pure function: numbers in, decision out. Thresholds live in `experiments/policy.json`.

| Stage | Each challenger gets | Runs until | Question |
|---|---|---|---|
| 0 | 10% | 2 days and 200 exposures | Is it broken or clearly worse? |
| 1 | 25% | 2 days and 200 exposures | Still not clearly worse? |
| Decision | Equal split | 7 to 28 days, 1,000 exposures and 30 conversions per arm | Is it better? |

- **Winner:** P(beats control) ≥ 95%, tightened when several challengers run (97.5% for two).
- **Stopped early:** P(beats control) under 5%, proceeds per exposure more than 20% below control, or refund rate 5 points above control.
- **Halted:** exposures don't match the weights (sample ratio mismatch). Assignment or tracking is broken. Fix it before reading anything.
- **Inconclusive:** no winner after 28 days. Control stays. Write it down as inconclusive, not as a loss.

Rules the engine depends on:

1. **Judge each stage only on data collected at that stage's weights.** Mixing data from a 10% week and a 50% week biases the result when conversion drifts over time. `/experiment-tick` snapshots the cumulative readout at every weight change and passes the difference.
2. **Never call a winner before 7 days**, whatever the numbers say. Weekdays and weekends convert differently.
3. **Don't peek and stop.** The engine is the only thing that ends a test.
4. **The primary metric is trial start** (or purchase, with no trial). It is immediate, so the stage difference is clean.
5. **Check the money before promoting.** Trial starts can rise while revenue falls. Before 100%, compare proceeds per exposure and trial → paid on the full cohort (`superwall campaigns audiences readout`). For price tests this is the deciding number, and it needs the trial length plus a few days.

## Who may do what

Moving weights changes what real users see and pay. `policy.json` sets the limits.

| Action | Default | With `autoRamp: true` | With `autoPromote: true` |
|---|---|---|---|
| Write a variation, push it (no traffic) | Agent | Agent | Agent |
| Start an experiment at stage 0 | Human approves | Human approves | Human approves |
| Move up the ladder, stop a loser | Agent proposes, human applies | Agent | Agent |
| Promote a winner to 100% | Human | Human | Agent |
| New price, trial length, or store product | Human | Human | Human |
| Halt on mismatch | Agent freezes and reports | same | same |

Start with both flags off. Turn on `autoRamp` after two or three ticks have matched what you would have done.

## Commands (Superwall)

```bash
superwall campaigns audiences readout <campaign> <audience> --json      # users, trial starts, proceeds per variant (cumulative)
superwall campaigns variants create <campaign> <audience> --type treatment --paywall <paywall> --json
superwall campaigns variants weights <campaign> <audience> -d 'weights:=[{"variant_id":"<id>","percentage":10},{"variant_id":"<id>","percentage":90}]' --json
superwall query --file experiments/readout.sql --app <id> --json        # anything the readout doesn't cover
```

- `variants weights` replaces every treatment's weight in one call, in whole percentages, and changes live traffic. The control is a treatment too; send every arm.
- Run `superwall <command> --help` before a write. Never guess a flag.
- Check with a test user that assignment is sticky across a weight change before relying on stage differences.

Web experiments use the same engine. Assign the arm in the Worker (hash of user id, weights in KV), send `experiment_id` and `variant` on every event, and read the numbers from Tinybird.

## Running it on a schedule

The tick is one command, so anything that can start Claude Code can run it:

- **By hand:** `/experiment-tick` each morning. Start here.
- **Scheduled:** a Claude Code routine, or `claude -p "/experiment-tick"` from cron or CI with `SUPERWALL_API_KEY` set.

A scheduled tick with both flags off only writes a proposal to `experiments/<id>.md` and tells you. It cannot move traffic.

## Files in the app repo

```
experiments/
  policy.json        thresholds and what the agent may do alone
  ramp.ts            the decision engine (and ramp.test.ts)
  learnings.md       one line per finished experiment; read before every new one
  0001-trial-timeline.md   one record per experiment: hypothesis, arms, every tick, the result
superwall/           the paywalls and flows themselves, as code
.claude/commands/    experiment-new.md, experiment-tick.md
```

## Resources

- [Superwall docs](https://superwall.com/docs) · `superwall api docs experiment`
- [Trustworthy Online Controlled Experiments](https://experimentguide.com) (Kohavi, Tang, Xu): sample ratio mismatch, peeking, guardrails
- [Evan Miller: How not to run an A/B test](https://www.evanmiller.org/how-not-to-run-an-ab-test.html)
