import { describe, expect, test } from "bun:test";
import { decide, defaultPolicy, normalCdf, probabilityBeats, sampleRatioMismatch, type Arm, type State } from "./ramp";

const arm = (id: string, role: Arm["role"], exposures: number, conversions: number, extra: Partial<Arm> = {}): Arm => ({
  id, role, exposures, conversions, ...extra,
});

describe("statistics", () => {
  test("normalCdf matches known values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 4);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 4);
  });

  test("equal arms give 50%, a clearly better arm gives near 100%", () => {
    expect(probabilityBeats(arm("b", "challenger", 1000, 100), arm("a", "control", 1000, 100))).toBeCloseTo(0.5, 6);
    expect(probabilityBeats(arm("b", "challenger", 2000, 300), arm("a", "control", 2000, 200))).toBeGreaterThan(0.99);
    expect(probabilityBeats(arm("b", "challenger", 2000, 200), arm("a", "control", 2000, 300))).toBeLessThan(0.01);
  });

  test("sample ratio mismatch fires only when exposures disagree with weights", () => {
    const weights = { a: 90, b: 10 };
    expect(sampleRatioMismatch([arm("a", "control", 9000, 0), arm("b", "challenger", 1000, 0)], weights)).toBe(false);
    expect(sampleRatioMismatch([arm("a", "control", 9000, 0), arm("b", "challenger", 1300, 0)], weights)).toBe(true);
    expect(sampleRatioMismatch([arm("a", "control", 60, 0), arm("b", "challenger", 40, 0)], weights)).toBe(false); // too little data to say
  });
});

describe("safety stages", () => {
  const state: State = { stage: 0, weights: { a: 90, b: 10 }, epochDays: 3 };

  test("holds until the stage has enough exposures and days", () => {
    const d = decide([arm("a", "control", 900, 90), arm("b", "challenger", 100, 10)], state);
    expect(d.action).toBe("hold");
    expect(d.weights).toEqual(state.weights);
    expect(decide([arm("a", "control", 2700, 270), arm("b", "challenger", 300, 30)], { ...state, epochDays: 1 }).action).toBe("hold");
  });

  test("advances up the ladder when the challenger is not clearly worse", () => {
    const d = decide([arm("a", "control", 2700, 270), arm("b", "challenger", 300, 30)], state);
    expect(d.action).toBe("advance");
    expect(d.stage).toBe(1);
    expect(d.weights).toEqual({ a: 75, b: 25 });
    expect(d.requiresHuman).toBe(true); // default policy proposes, it does not apply
  });

  test("the last safety stage advances to an equal split", () => {
    const d = decide([arm("a", "control", 2250, 225), arm("b", "challenger", 750, 75)], { stage: 1, weights: { a: 75, b: 25 }, epochDays: 2 });
    expect(d.stage).toBe(2);
    expect(d.weights).toEqual({ a: 50, b: 50 });
  });

  test("autoRamp lets the agent apply ladder moves", () => {
    const d = decide([arm("a", "control", 2700, 270), arm("b", "challenger", 300, 30)], state, { ...defaultPolicy, autoRamp: true });
    expect(d.requiresHuman).toBe(false);
  });

  test("with three challengers the ladder never takes more than an equal share", () => {
    const arms = [arm("a", "control", 1000, 100), arm("b", "challenger", 1000, 100), arm("c", "challenger", 1000, 100), arm("d", "challenger", 1000, 100)];
    const d = decide(arms, { stage: 1, weights: { a: 25, b: 25, c: 25, d: 25 }, epochDays: 2 });
    expect(d.weights).toEqual({ a: 25, b: 25, c: 25, d: 25 });
  });
});

describe("kills and guardrails", () => {
  test("stops a challenger that is clearly losing and returns its traffic to control", () => {
    const d = decide([arm("a", "control", 4500, 450), arm("b", "challenger", 500, 20)], { stage: 0, weights: { a: 90, b: 10 }, epochDays: 3 });
    expect(d.action).toBe("kill");
    expect(d.weights).toEqual({ a: 100, b: 0 });
  });

  test("keeps the surviving challenger running at its stage", () => {
    const arms = [arm("a", "control", 2000, 200), arm("b", "challenger", 2000, 205), arm("c", "challenger", 2000, 120)];
    const d = decide(arms, { stage: 2, weights: { a: 34, b: 33, c: 33 }, epochDays: 4 });
    expect(d.action).toBe("kill");
    expect(d.weights).toEqual({ a: 50, b: 50, c: 0 });
  });

  test("stops a challenger that converts as well but earns far less", () => {
    const arms = [arm("a", "control", 2000, 200, { proceeds: 6000 }), arm("b", "challenger", 2000, 210, { proceeds: 3000 })];
    const d = decide(arms, { stage: 2, weights: { a: 50, b: 50 }, epochDays: 4 });
    expect(d.action).toBe("kill");
    expect(d.arms.find((r) => r.id === "b")!.why).toContain("proceeds");
  });

  test("stops a challenger with a much higher refund rate", () => {
    const arms = [arm("a", "control", 2000, 200, { refunds: 4 }), arm("b", "challenger", 2000, 210, { refunds: 40 })];
    expect(decide(arms, { stage: 2, weights: { a: 50, b: 50 }, epochDays: 4 }).action).toBe("kill");
  });

  test("halts on sample ratio mismatch before reading results", () => {
    const d = decide([arm("a", "control", 9000, 900), arm("b", "challenger", 1400, 400)], { stage: 0, weights: { a: 90, b: 10 }, epochDays: 3 });
    expect(d.action).toBe("halt");
    expect(d.requiresHuman).toBe(true);
  });
});

describe("decision stage", () => {
  const state: State = { stage: 2, weights: { a: 50, b: 50 }, epochDays: 8 };

  test("promotes a clear winner, and asks a human first", () => {
    const d = decide([arm("a", "control", 3000, 300), arm("b", "challenger", 3000, 390)], state);
    expect(d.action).toBe("promote");
    expect(d.weights).toEqual({ a: 0, b: 100 });
    expect(d.requiresHuman).toBe(true);
    expect(d.arms.find((r) => r.id === "b")!.verdict).toBe("winner");
  });

  test("does not call a winner before a full week, whatever the numbers", () => {
    const d = decide([arm("a", "control", 3000, 300), arm("b", "challenger", 3000, 390)], { ...state, epochDays: 4 });
    expect(d.action).toBe("hold");
  });

  test("does not call a winner on a small difference", () => {
    expect(decide([arm("a", "control", 3000, 300), arm("b", "challenger", 3000, 315)], state).action).toBe("hold");
  });

  test("two challengers need a stricter threshold than one", () => {
    // b beats control with P of about 96%: enough alone (95%), not enough with a second challenger (97.5%).
    const b = arm("b", "challenger", 3000, 342);
    expect(probabilityBeats(b, arm("a", "control", 3000, 300))).toBeGreaterThan(0.95);
    expect(probabilityBeats(b, arm("a", "control", 3000, 300))).toBeLessThan(0.975);
    expect(decide([arm("a", "control", 3000, 300), b], state).action).toBe("promote");
    const three = decide([arm("a", "control", 3000, 300), b, arm("c", "challenger", 3000, 305)], { stage: 2, weights: { a: 34, b: 33, c: 33 }, epochDays: 8 });
    expect(three.action).toBe("hold");
  });

  test("ends as inconclusive after the maximum run time", () => {
    const d = decide([arm("a", "control", 9000, 900), arm("b", "challenger", 9000, 910)], { ...state, epochDays: 28 });
    expect(d.action).toBe("stop_inconclusive");
    expect(d.weights).toEqual({ a: 100, b: 0 });
  });
});

describe("input checks", () => {
  test("rejects impossible or incomplete input", () => {
    expect(() => decide([arm("b", "challenger", 10, 1)], { stage: 0, weights: { b: 100 }, epochDays: 1 })).toThrow("control");
    expect(() => decide([arm("a", "control", 10, 1), arm("b", "challenger", 10, 11)], { stage: 0, weights: { a: 90, b: 10 }, epochDays: 1 })).toThrow("conversions");
    expect(() => decide([arm("a", "control", 10, 1), arm("b", "challenger", 10, 1)], { stage: 0, weights: { a: 100, b: 0 }, epochDays: 1 })).toThrow("no challenger");
  });
});
