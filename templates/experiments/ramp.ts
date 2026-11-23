// experiments/ramp.ts: decides what happens to an A/B test's traffic split. Pure function, no I/O.
// The agent fetches numbers (Superwall readout or Tinybird), calls decide(), and applies or proposes the result.
// Method and reasoning: playbook/14-experiments.md.

export type Arm = {
  id: string; // the vendor's variant id
  role: "control" | "challenger";
  exposures: number; // users who saw this arm in the current epoch (since the last weight change)
  conversions: number; // users who hit the primary metric in the current epoch
  proceeds?: number; // net revenue from this arm in the epoch, if known
  refunds?: number; // refunded purchases in the epoch, if known
};

export type Policy = {
  ladder: number[]; // percent of traffic each challenger gets at each safety stage, e.g. [10, 25]
  minStageDays: number; // days a safety stage must run
  minStageExposures: number; // exposures per challenger before a safety stage can advance
  advanceAbove: number; // P(beats control) needed to advance a safety stage ("not clearly worse")
  killBelow: number; // P(beats control) under which a challenger is stopped
  minKillExposures: number; // exposures per arm before a kill on conversion is allowed
  minDecisionDays: number; // days the decision stage must run (7+ covers a weekly cycle)
  minDecisionExposures: number; // exposures per arm before a winner can be called
  minDecisionConversions: number; // conversions per arm before a winner can be called
  winAbove: number; // P(beats control) needed to win, before the multiple-arm correction
  maxDecisionDays: number; // call it inconclusive after this many days in the decision stage
  maxProceedsDrop: number; // guardrail: stop a challenger whose proceeds per exposure fall this far below control (0.2 = 20%)
  maxRefundRateIncrease: number; // guardrail: stop a challenger whose refund rate exceeds control's by this much (absolute)
  autoRamp: boolean; // may the agent move weights up the ladder and stop losers without asking
  autoPromote: boolean; // may the agent send a winner to 100% without asking
};

export const defaultPolicy: Policy = {
  ladder: [10, 25],
  minStageDays: 2,
  minStageExposures: 200,
  advanceAbove: 0.2,
  killBelow: 0.05,
  minKillExposures: 500,
  minDecisionDays: 7,
  minDecisionExposures: 1000,
  minDecisionConversions: 30,
  winAbove: 0.95,
  maxDecisionDays: 28,
  maxProceedsDrop: 0.2,
  maxRefundRateIncrease: 0.05,
  autoRamp: false,
  autoPromote: false,
};

export type State = {
  stage: number; // index into policy.ladder; ladder.length means the decision stage (equal split)
  weights: Record<string, number>; // whole percentages by arm id, summing to 100, in force during this epoch
  epochDays: number; // days since the weights last changed
};

export type Action = "hold" | "advance" | "kill" | "promote" | "stop_inconclusive" | "halt";

export type ArmReport = {
  id: string;
  rate: number;
  pBeatsControl: number | null; // null for the control
  lift: number | null; // relative lift in conversion rate over control
  verdict: "control" | "running" | "killed" | "winner";
  why: string;
};

export type Decision = {
  action: Action;
  stage: number; // the stage after this decision
  weights: Record<string, number>; // the split to apply; equal to state.weights on hold and halt
  requiresHuman: boolean; // true when policy does not let the agent apply this on its own
  arms: ArmReport[];
  reasons: string[];
};

// Standard normal CDF (Abramowitz and Stegun 26.2.17, error under 1e-7).
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

// P(challenger's true rate > control's), Beta(1,1) priors, normal approximation of each posterior.
// Accurate enough once both arms have a few hundred exposures, which the policy minimums enforce.
export function probabilityBeats(challenger: Arm, control: Arm): number {
  const post = (a: Arm) => {
    const alpha = 1 + a.conversions;
    const beta = 1 + a.exposures - a.conversions;
    const n = alpha + beta;
    return { mean: alpha / n, variance: (alpha * beta) / (n * n * (n + 1)) };
  };
  const c = post(challenger);
  const k = post(control);
  return normalCdf((c.mean - k.mean) / Math.sqrt(c.variance + k.variance));
}

// Sample ratio mismatch: do exposures match the weights that were set? A mismatch means assignment or
// tracking is broken and no comparison can be trusted. Chi-square critical values at p = 0.001.
const CHI2_P001 = [10.83, 13.82, 16.27, 18.47, 20.52, 22.46, 24.32];
export function sampleRatioMismatch(arms: Arm[], weights: Record<string, number>): boolean {
  const live = arms.filter((a) => (weights[a.id] ?? 0) > 0);
  const total = live.reduce((s, a) => s + a.exposures, 0);
  if (live.length < 2 || total < 200) return false;
  const weightSum = live.reduce((s, a) => s + weights[a.id]!, 0);
  const chi2 = live.reduce((s, a) => {
    const expected = (total * weights[a.id]!) / weightSum;
    return s + (a.exposures - expected) ** 2 / expected;
  }, 0);
  const critical = CHI2_P001[live.length - 2] ?? CHI2_P001[CHI2_P001.length - 1]!;
  return chi2 > critical;
}

// Whole-percent split: each challenger gets `each`, the control gets the rest.
export function split(controlId: string, challengerIds: string[], each: number): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const id of challengerIds) weights[id] = each;
  weights[controlId] = 100 - each * challengerIds.length;
  return weights;
}

function weightsFor(policy: Policy, stage: number, controlId: string, challengerIds: string[]) {
  const equal = Math.floor(100 / (challengerIds.length + 1));
  const each = stage >= policy.ladder.length ? equal : Math.min(policy.ladder[stage]!, equal);
  return split(controlId, challengerIds, each);
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export function decide(arms: Arm[], state: State, policy: Policy = defaultPolicy): Decision {
  const controls = arms.filter((a) => a.role === "control");
  if (controls.length !== 1) throw new Error("exactly one control arm is required");
  const control = controls[0]!;
  const live = arms.filter((a) => a.role === "challenger" && (state.weights[a.id] ?? 0) > 0);
  if (live.length === 0) throw new Error("no challenger has traffic; nothing to decide");
  for (const a of arms) {
    if (a.conversions > a.exposures) throw new Error(`arm ${a.id}: more conversions than exposures`);
  }

  const reports = new Map<string, ArmReport>();
  const rate = (a: Arm) => (a.exposures ? a.conversions / a.exposures : 0);
  reports.set(control.id, { id: control.id, rate: rate(control), pBeatsControl: null, lift: null, verdict: "control", why: "" });
  for (const a of live) {
    const lift = rate(control) > 0 ? rate(a) / rate(control) - 1 : null;
    reports.set(a.id, { id: a.id, rate: rate(a), pBeatsControl: probabilityBeats(a, control), lift, verdict: "running", why: "" });
  }
  const out = (action: Action, stage: number, weights: Record<string, number>, requiresHuman: boolean, reasons: string[]): Decision => ({
    action, stage, weights, requiresHuman, arms: [...reports.values()], reasons,
  });

  if (sampleRatioMismatch([control, ...live], state.weights)) {
    return out("halt", state.stage, state.weights, true, [
      "Exposure counts do not match the configured weights (sample ratio mismatch, p < 0.001). Assignment or tracking is broken; fix that before reading any result.",
    ]);
  }

  // 1. Stop challengers that are losing or tripping a guardrail.
  const killed: Arm[] = [];
  for (const a of live) {
    const r = reports.get(a.id)!;
    const enough = a.exposures >= policy.minKillExposures && control.exposures >= policy.minKillExposures;
    let why = "";
    if (enough && r.pBeatsControl! < policy.killBelow) {
      why = `P(beats control) ${pct(r.pBeatsControl!)} is under ${pct(policy.killBelow)}`;
    } else if (enough && a.proceeds !== undefined && control.proceeds !== undefined && control.proceeds > 0) {
      const drop = 1 - a.proceeds / a.exposures / (control.proceeds / control.exposures);
      if (drop > policy.maxProceedsDrop) why = `proceeds per exposure are ${pct(drop)} below control`;
    }
    if (!why && enough && a.refunds !== undefined && control.refunds !== undefined && a.conversions > 0 && control.conversions > 0) {
      const increase = a.refunds / a.conversions - control.refunds / control.conversions;
      if (increase > policy.maxRefundRateIncrease) why = `refund rate is ${pct(increase)} above control`;
    }
    if (why) {
      r.verdict = "killed";
      r.why = why;
      killed.push(a);
    }
  }
  const survivors = live.filter((a) => !killed.includes(a));
  if (killed.length > 0) {
    const reasons = killed.map((a) => `Stop ${a.id}: ${reports.get(a.id)!.why}.`);
    if (survivors.length === 0) {
      reasons.push("No challenger left. Control keeps 100%.");
      return out("kill", state.stage, { ...split(control.id, [], 0), ...Object.fromEntries(killed.map((a) => [a.id, 0])) }, !policy.autoRamp, reasons);
    }
    const weights = { ...weightsFor(policy, state.stage, control.id, survivors.map((a) => a.id)), ...Object.fromEntries(killed.map((a) => [a.id, 0])) };
    reasons.push("Weights changed, so a new epoch starts for the remaining arms.");
    return out("kill", state.stage, weights, !policy.autoRamp, reasons);
  }

  const ids = live.map((a) => a.id);

  // 2. Safety stages: small traffic, only checking the challenger is not clearly worse.
  if (state.stage < policy.ladder.length) {
    const blockers: string[] = [];
    if (state.epochDays < policy.minStageDays) blockers.push(`stage has run ${state.epochDays} of ${policy.minStageDays} days`);
    for (const a of live) {
      if (a.exposures < policy.minStageExposures) blockers.push(`${a.id} has ${a.exposures} of ${policy.minStageExposures} exposures`);
      else if (reports.get(a.id)!.pBeatsControl! < policy.advanceAbove) blockers.push(`${a.id} P(beats control) ${pct(reports.get(a.id)!.pBeatsControl!)} is under ${pct(policy.advanceAbove)}`);
    }
    if (blockers.length) return out("hold", state.stage, state.weights, false, [`Hold at stage ${state.stage}: ${blockers.join("; ")}.`]);
    const next = state.stage + 1;
    const label = next >= policy.ladder.length ? "the decision stage (equal split)" : `stage ${next}`;
    return out("advance", next, weightsFor(policy, next, control.id, ids), !policy.autoRamp, [`Advance to ${label}. Safety checks passed.`]);
  }

  // 3. Decision stage: equal split, judged only on data from this epoch.
  const threshold = 1 - (1 - policy.winAbove) / live.length; // Bonferroni correction for several challengers
  const blockers: string[] = [];
  if (state.epochDays < policy.minDecisionDays) blockers.push(`decision stage has run ${state.epochDays} of ${policy.minDecisionDays} days`);
  for (const a of [control, ...live]) {
    if (a.exposures < policy.minDecisionExposures) blockers.push(`${a.id} has ${a.exposures} of ${policy.minDecisionExposures} exposures`);
    if (a.conversions < policy.minDecisionConversions) blockers.push(`${a.id} has ${a.conversions} of ${policy.minDecisionConversions} conversions`);
  }
  if (blockers.length === 0) {
    const best = [...live].sort((x, y) => reports.get(y.id)!.pBeatsControl! - reports.get(x.id)!.pBeatsControl!)[0]!;
    const r = reports.get(best.id)!;
    if (r.pBeatsControl! >= threshold) {
      r.verdict = "winner";
      r.why = `P(beats control) ${pct(r.pBeatsControl!)} is at or above ${pct(threshold)}`;
      const weights: Record<string, number> = { [control.id]: 0, ...Object.fromEntries(ids.map((id) => [id, 0])), [best.id]: 100 };
      return out("promote", state.stage, weights, !policy.autoPromote, [
        `${best.id} wins: ${r.why}, lift ${r.lift === null ? "n/a" : pct(r.lift)}.`,
        "Before promoting, confirm proceeds per exposure and trial-to-paid on the full cohort agree.",
      ]);
    }
  }
  if (state.epochDays >= policy.maxDecisionDays) {
    return out("stop_inconclusive", state.stage, { ...split(control.id, [], 0), ...Object.fromEntries(ids.map((id) => [id, 0])) }, !policy.autoRamp, [
      `No winner after ${state.epochDays} days in the decision stage. Control keeps 100%. Record it as inconclusive, not as a loss.`,
    ]);
  }
  return out("hold", state.stage, state.weights, false, [
    blockers.length ? `Hold in the decision stage: ${blockers.join("; ")}.` : `Hold in the decision stage: no challenger has reached ${pct(threshold)} yet.`,
  ]);
}

// CLI: bun experiments/ramp.ts '<json>' where json = { arms, state, policy? }. Prints the Decision as JSON.
if (import.meta.main) {
  const input = JSON.parse(process.argv[2] ?? "{}");
  console.log(JSON.stringify(decide(input.arms, input.state, { ...defaultPolicy, ...input.policy }), null, 2));
}
