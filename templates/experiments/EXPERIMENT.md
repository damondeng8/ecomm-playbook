# <NNNN> · <short name>

> Copy to `experiments/NNNN-short-name.md`. Fill in everything above "Ticks" before any traffic moves.

| | |
|---|---|
| Status | proposed · running · won · lost · inconclusive · halted |
| Surface | <paywall · onboarding · abandon offer · web> at placement `<placement>` |
| Primary metric | <trial start · purchase> |
| Superwall | campaign `<id>` · audience `<id>` |
| Started | <YYYY-MM-DD>, approved by <name> |

## Hypothesis

<Changing X will raise Y because Z.>

Source: <the review, support message, funnel number, or reference app this came from>

## Arms

| Arm | Variant id | Paywall | What is different |
|---|---|---|---|
| Control | `<id>` | `<paywall id>` | Current version |
| B | `<id>` | `<paywall id>` | <the one change> |

Checklist for each challenger (chapter 07): price, period, trial length and renewal shown · Terms and Privacy links · Restore Purchases · visible close button · no fake urgency · checked at phone width in light and dark.

## Ticks

One row per `/experiment-tick`. Numbers are for the current epoch (since the last weight change).

| Date | Stage | Weights | Exposures (ctrl / B) | Conversions (ctrl / B) | P(B beats ctrl) | Action | Applied by |
|---|---|---|---|---|---|---|---|

## Epoch snapshots

The cumulative readout saved at each weight change, so the next tick can subtract it.

```json
[]
```

## Result

<Winner, lift, P(beats control), proceeds per exposure for each arm, trial → paid for each arm. Or why it stopped.>

One-line learning (copy to `learnings.md`): <what this says about these users, not about this screen>
