---
description: Propose and build the next A/B test variation
argument-hint: "[surface or idea, optional]"
---

Propose and build the next experiment. Follow playbook chapter 14. Focus, if given: $ARGUMENTS

1. Read `experiments/learnings.md`, `experiments/policy.json`, and every record with status `running`. If the surface already has a running experiment, stop and say so.
2. Find the weakest funnel step from the Tinybird funnel dashboard and `superwall campaigns audiences readout`. State the numbers you used.
3. Write three candidate hypotheses in the form "Changing X will raise Y because Z". Each cites a source: a store review, a support message, a funnel number, or a reference app in `docs/references/`. Drop any that `learnings.md` shows already lost, unless you can say what is different.
4. Pick the one with the largest expected effect on the weakest step. Add the other two to "Ideas not yet tested".
5. Build the challenger in `superwall/` with `superwall create`, changing only the one thing the hypothesis names. Use the project's design tokens. Prices, trial lengths, and store products are not yours to change: if the hypothesis needs one, write the record and stop for the human.
6. Run `superwall dev` and look at the challenger at phone width, light and dark. Go through the paywall checklist in chapter 07 item by item.
7. `superwall push` (this saves a version and sends it to no one).
8. Write `experiments/NNNN-short-name.md` from the template with status `proposed`.
9. Report: the hypothesis and its source, a screenshot of control and challenger, the checklist result, and the exact commands that would start it at stage 0 (`campaigns variants create`, then `campaigns variants weights` with the stage 0 split). Do not run those commands. Starting an experiment is the human's decision.
