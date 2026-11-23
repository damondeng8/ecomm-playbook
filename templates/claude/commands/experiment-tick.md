---
description: Check running experiments and ramp, stop, or propose a winner
---

Run one tick for every experiment with status `running`. Follow playbook chapter 14.

For each record in `experiments/`:

1. Fetch the cumulative numbers per variant: `superwall campaigns audiences readout <campaign> <audience> --json`. Use users as exposures and the record's primary metric as conversions. Take proceeds and refunds if present.
2. Subtract the latest epoch snapshot in the record to get this epoch's numbers. Epoch days = days since that snapshot.
3. Run the engine with the record's stage and weights:
   `bun experiments/ramp.ts '{"arms":[...],"state":{"stage":N,"weights":{...},"epochDays":N},"policy":<experiments/policy.json>}'`
4. Add a row to the record's Ticks table with the numbers, P(beats control), and the action.
5. Act on the decision:
   - `hold`: nothing else.
   - `halt`: change nothing. Set status `halted` and tell the human what the exposure counts were against the weights.
   - `advance`, `kill`, `stop_inconclusive` with `requiresHuman: false`: apply the weights with `superwall campaigns variants weights` (every arm in one call), read the audience back to confirm, save a new epoch snapshot, update the stage.
   - Anything with `requiresHuman: true`: do not apply. Write the exact command into the record and show it to the human with the reasons.
   - `promote`: first compare proceeds per exposure and trial → paid for each arm on the full cohort. If the winner earns less than control, say so and recommend against promoting. Otherwise follow `requiresHuman`.
6. When an experiment ends (promoted, all challengers stopped, or inconclusive), fill in Result, set the status, and add one line to `experiments/learnings.md`.

Never change thresholds in `policy.json`, never end a test the engine says to hold, and never move weights outside what the engine returned.

Finish with one table: experiment, stage, action, applied or waiting on the human. If nothing is running, say so and suggest `/experiment-new`.
