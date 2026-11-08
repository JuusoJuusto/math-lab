import { describe, expect, it } from "vitest";
import { formatEquation } from "../format";
import { operation, type Operation } from "../operations";
import { mustParseEquation } from "../parse";
import { createRng } from "../round";
import { terminalState } from "../solve";
import {
  describeNextStep,
  distanceToSolved,
  evaluateMove,
  getHints,
  isTidy,
  recommendedMoves,
  solveWithTutor,
  suggestNextMove,
  type MoveEvaluation,
} from "../tutor";

const eq = mustParseEquation;

function judge(equationText: string, op: Operation): MoveEvaluation {
  return evaluateMove(eq(equationText), op);
}

function expectNotHelpful(evaluation: MoveEvaluation, reason: string, severity?: "error" | "warning") {
  expect(evaluation.verdict).toBe("not-helpful");
  if (evaluation.verdict === "not-helpful") {
    expect(evaluation.reason).toBe(reason);
    if (severity) expect(evaluation.severity).toBe(severity);
  }
}

describe("distanceToSolved", () => {
  it.each([
    ["x = 7", 0],
    ["7 = x", 0],
    ["x + 5 = 12", 1],
    ["3x = 21", 1],
    ["x/4 = 6", 1],
    ["2x + 5 = 17", 2],
    ["x/3 + 4 = 9", 2],
    ["2x/3 = 4", 2],
    ["5x + 2 = 3x + 12", 3],
    ["-x + 4 = 2x - 8", 3],
    ["3 = 5", 0],
  ])("%s needs %i move(s)", (text, expected) => {
    expect(distanceToSolved(eq(text))).toBe(expected);
  });
});

describe("suggestNextMove", () => {
  const suggested = (text: string) => {
    const suggestion = suggestNextMove(eq(text));
    return suggestion && `${suggestion.operation.kind} ${suggestion.operation.amount.n}${suggestion.operation.withVariable ? "x" : ""} (${suggestion.goal})`;
  };

  it("undoes the constant before the coefficient (reverse order of operations)", () => {
    expect(suggested("2x + 5 = 17")).toBe("subtract 5 (remove-constant)");
    expect(suggested("3x - 4 = 20")).toBe("add 4 (remove-constant)");
    expect(suggested("2x = 12")).toBe("divide 2 (remove-coefficient)");
    expect(suggested("x/3 = 5")).toBe("multiply 3 (remove-coefficient)");
  });

  it("collects the smaller x term first", () => {
    expect(suggested("5x + 2 = 3x + 12")).toBe("subtract 3x (collect-variable)");
    expect(suggested("2x + 3 = 5x - 9")).toBe("subtract 2x (collect-variable)");
    expect(suggested("-x + 4 = 2x - 8")).toBe("add 1x (collect-variable)");
  });

  it("divides by a negative coefficient", () => {
    expect(suggested("-2x = 8")).toBe("divide -2 (remove-coefficient)");
    expect(suggested("-x = 6")).toBe("divide -1 (remove-coefficient)");
  });

  it("works on an equation where x is only on the right", () => {
    expect(suggested("12 = 2x + 4")).toBe("subtract 4 (remove-constant)");
  });

  it("returns nothing when there is nothing left to do", () => {
    expect(suggestNextMove(eq("x = 6"))).toBeNull();
    expect(suggestNextMove(eq("6 = x"))).toBeNull();
    expect(suggestNextMove(eq("3 = 5"))).toBeNull();
  });
});

describe("accepting good moves", () => {
  it("accepts the textbook step and explains it", () => {
    const evaluation = judge("2x + 5 = 17", operation("subtract", 5));
    expect(evaluation.verdict).toBe("helpful");
    if (evaluation.verdict !== "helpful") return;
    expect(formatEquation(evaluation.step.after)).toBe("2x = 12");
    expect(evaluation.explanation.leftWork).toBe("2x + 5 − 5 = 2x");
    expect(evaluation.explanation.rightWork).toBe("17 − 5 = 12");
    expect(evaluation.explanation.why).toContain("inverse");
    expect(evaluation.explanation.why).toContain("cancel");
  });

  it("explains undoing a subtraction by adding", () => {
    const evaluation = judge("3x - 4 = 20", operation("add", 4));
    expect(evaluation.verdict).toBe("helpful");
    if (evaluation.verdict === "helpful") expect(evaluation.explanation.why).toContain("subtracted");
  });

  it("explains dividing by the coefficient", () => {
    const evaluation = judge("2x = 12", operation("divide", 2));
    expect(evaluation.verdict).toBe("helpful");
    if (evaluation.verdict === "helpful") {
      expect(evaluation.explanation.why).toContain("multiplied by 2");
      expect(evaluation.explanation.leftWork).toBe("2x ÷ 2 = x");
      expect(evaluation.explanation.rightWork).toBe("12 ÷ 2 = 6");
    }
  });

  it("warns about signs when dividing by a negative number", () => {
    const evaluation = judge("-2x = 8", operation("divide", -2));
    expect(evaluation.verdict).toBe("helpful");
    if (evaluation.verdict === "helpful") expect(evaluation.explanation.note).toContain("flips the sign");
  });

  it("accepts every sensible route when x is on both sides", () => {
    const start = "5x + 2 = 3x + 12";
    for (const op of [
      operation("subtract", 3, true), // keep x on the left
      operation("subtract", 5, true), // keep x on the right (negative coefficient)
      operation("subtract", 2), // constants first
      operation("subtract", 12),
    ]) {
      expect(judge(start, op).verdict, `${op.kind} ${op.amount.n}${op.withVariable ? "x" : ""}`).toBe("helpful");
    }
  });

  it("accepts dividing first when every term divides evenly, and mentions the alternative", () => {
    const evaluation = judge("2x + 6 = 18", operation("divide", 2));
    expect(evaluation.verdict).toBe("helpful");
    if (evaluation.verdict === "helpful") expect(evaluation.explanation.note).toContain("also works");
  });

  it("accepts multiplying first for x/3 + 4 = 9 because the numbers stay whole", () => {
    expect(judge("x/3 + 4 = 9", operation("multiply", 3)).verdict).toBe("helpful");
  });

  it("accepts adding a negative number as a way of subtracting", () => {
    expect(judge("x + 5 = 12", operation("add", -5)).verdict).toBe("helpful");
  });

  it("lets the learner finish a fractional answer, because no whole-number route exists", () => {
    expect(judge("7x = 3", operation("divide", 7)).verdict).toBe("helpful");
  });

  it("rotates the encouragement so it is not repetitive", () => {
    const titles = new Set<string>();
    for (let index = 0; index < 5; index += 1) {
      const evaluation = evaluateMove(eq("x + 5 = 12"), operation("subtract", 5), index);
      if (evaluation.verdict === "helpful") titles.add(evaluation.explanation.title);
    }
    expect(titles.size).toBe(5);
  });
});

describe("diagnosing wrong moves", () => {
  it("catches the opposite operation on a constant", () => {
    const evaluation = judge("2x + 5 = 17", operation("add", 5));
    expectNotHelpful(evaluation, "wrong-direction", "error");
    if (evaluation.verdict === "not-helpful") {
      expect(evaluation.preview.applied).toBe("2x + 5 + 5 = 17 + 5");
      expect(evaluation.preview.result).toBe("2x + 10 = 22");
      expect(evaluation.message).not.toContain("2x = 12"); // does not give the answer away
    }
  });

  it("catches multiplying when dividing was needed", () => {
    expectNotHelpful(judge("2x = 12", operation("multiply", 2)), "wrong-direction", "error");
    expectNotHelpful(judge("x/4 = 6", operation("divide", 4)), "wrong-direction", "error");
  });

  it("catches the right operation with the wrong number", () => {
    expectNotHelpful(judge("2x + 5 = 17", operation("subtract", 7)), "wrong-amount", "error");
    expectNotHelpful(judge("2x = 12", operation("divide", 3)), "wrong-amount", "error");
  });

  it("catches an x term where a plain number was needed, and vice versa", () => {
    expectNotHelpful(judge("2x + 5 = 17", operation("subtract", 5, true)), "wrong-term", "error");
    // The learner needed 3x (an x term) but typed a plain 3.
    expectNotHelpful(judge("5x + 2 = 3x + 12", operation("subtract", 3)), "wrong-term", "error");
    // A plain number was needed but the amount does not match any number in the equation.
    expectNotHelpful(judge("5x + 2 = 3x + 12", operation("subtract", 7)), "wrong-amount", "error");
  });

  it("explains that dividing everything first is allowed but leaves fractions", () => {
    const evaluation = judge("2x + 5 = 17", operation("divide", 2));
    expectNotHelpful(evaluation, "awkward", "warning");
    if (evaluation.verdict === "not-helpful") {
      expect(evaluation.message).toContain("x + 5/2 = 17/2");
      expect(evaluation.preview.result).toBe("x + 5/2 = 17/2");
    }
  });

  it("treats a pointless but valid move as balanced and not helpful", () => {
    expectNotHelpful(judge("2x + 5 = 17", operation("multiply", 2)), "no-progress", "warning");
    expectNotHelpful(judge("2x + 5 = 17", operation("add", 3)), "no-progress", "warning");
  });

  it("says when a move changes nothing", () => {
    expectNotHelpful(judge("2x + 5 = 17", operation("add", 0)), "no-change", "warning");
    expectNotHelpful(judge("2x + 5 = 17", operation("multiply", 1)), "no-change", "warning");
  });

  it("says when a move makes things worse", () => {
    expectNotHelpful(judge("2x + 5 = 17", operation("divide", 5)), "moves-away", "warning");
  });

  it("rejects operations that would break the equation", () => {
    const zero = judge("2x = 12", operation("divide", 0));
    expect(zero.verdict).toBe("invalid");
    if (zero.verdict === "invalid") expect(zero.problem.code).toBe("divide-by-zero");

    const times = judge("2x = 12", operation("multiply", 0));
    expect(times.verdict).toBe("invalid");

    expect(judge("2x = 12", operation("multiply", 2, true)).verdict).toBe("invalid");
  });

  it("never reveals the finished solution while correcting a mistake", () => {
    const evaluation = judge("2x + 5 = 17", operation("add", 5));
    if (evaluation.verdict === "not-helpful") {
      expect(evaluation.message).not.toMatch(/x = 6/);
      expect(evaluation.message).not.toMatch(/subtract 5/i);
    }
  });
});

describe("special outcomes", () => {
  it("leads to 'no solution' when x vanishes and the statement is false", () => {
    const start = eq("2x + 3 = 2x + 5");
    const steps = solveWithTutor(start);
    expect(steps).toHaveLength(1);
    expect(formatEquation(steps[0].after)).toBe("3 = 5");
    expect(terminalState(steps[0].after)).toBe("no-solution");
    expect(describeNextStep(steps[0].after)).toContain("no solution");
  });

  it("leads to 'infinitely many solutions' when x vanishes and the statement is true", () => {
    const steps = solveWithTutor(eq("3x + 1 = 3x + 1"));
    expect(terminalState(steps[0].after)).toBe("infinite-solutions");
    expect(describeNextStep(steps[0].after)).toContain("infinitely many");
  });

  it("describes a solved equation, including the mirrored form", () => {
    expect(describeNextStep(eq("x = 6"))).toContain("x = 6");
    expect(describeNextStep(eq("6 = x"))).toContain("6 = x means the same as x = 6");
  });
});

describe("hints", () => {
  it("gives three progressively more specific hints", () => {
    const hints = getHints(eq("2x + 5 = 17"));
    expect(hints).not.toBeNull();
    const [nudge, inverse, worked] = hints!;

    expect(nudge).toMatch(/added or subtracted/);
    expect(nudge).not.toMatch(/subtract(ing)? 5/i);

    expect(inverse).toMatch(/Addition is undone by subtraction/);
    expect(inverse).not.toMatch(/\b5\b.*\b12\b/);

    expect(worked).toContain("subtract 5 from both sides");
    expect(worked).toContain("2x + 5 − 5 = 2x");
    expect(worked).toContain("17 − 5 = 12");
    expect(worked).toContain("Choose “Subtract” and type 5.");
  });

  it("gives hints for undoing a coefficient", () => {
    const [, inverse] = getHints(eq("2x = 12"))!;
    expect(inverse).toContain("multiplied by 2");
    expect(inverse).toContain("divide");
    const [, inverseDiv] = getHints(eq("x/3 = 5"))!;
    expect(inverseDiv).toContain("divided by 3");
    expect(inverseDiv).toContain("multiply");
  });

  it("gives hints for collecting x terms, including how to enter an x amount", () => {
    const [nudge, inverse, worked] = getHints(eq("5x + 2 = 3x + 12"))!;
    expect(nudge).toContain("both sides");
    expect(inverse).toContain("subtract");
    expect(worked).toContain("turn on the x button");
  });

  it("has no hints for a finished equation", () => {
    expect(getHints(eq("x = 6"))).toBeNull();
    expect(getHints(eq("3 = 5"))).toBeNull();
  });
});

describe("the tutor's route is always accepted by the tutor's own judge (randomised)", () => {
  const rng = createRng(7);
  const pick = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
  const nonZero = (min: number, max: number) => {
    let n = 0;
    while (n === 0) n = pick(min, max);
    return n;
  };

  it("solves hundreds of generated equations in a handful of steps", () => {
    let solvedCount = 0;
    for (let i = 0; i < 600; i += 1) {
      const kind = pick(0, 2);
      const text =
        kind === 0
          ? `${nonZero(-9, 9)}x + ${pick(-20, 20)} = ${pick(-30, 30)}`
          : kind === 1
            ? `${nonZero(-9, 9)}x + ${pick(-20, 20)} = ${nonZero(-9, 9)}x + ${pick(-20, 20)}`
            : `x/${nonZero(2, 6)} + ${pick(-9, 9)} = ${pick(-9, 9)}`;
      const start = eq(text);

      let current = start;
      for (let step = 0; step < 6; step += 1) {
        const suggestion = suggestNextMove(current);
        if (!suggestion) break;
        const verdict = evaluateMove(current, suggestion.operation, step);
        expect(verdict.verdict, `${formatEquation(current)} -> ${suggestion.operation.kind}`).toBe("helpful");
        if (verdict.verdict !== "helpful") break;
        expect(recommendedMoves(current)[0]).toEqual(suggestion.operation);
        current = verdict.step.after;
      }

      const end = terminalState(current);
      expect(end, `${text} ended as ${formatEquation(current)}`).not.toBeNull();
      if (end === "solved") solvedCount += 1;
    }
    expect(solvedCount).toBeGreaterThan(300);
  });
});

describe("isTidy", () => {
  it("treats whole numbers and unit fractions as tidy", () => {
    expect(isTidy(eq("x/3 + 4 = 9"))).toBe(true);
    expect(isTidy(eq("-2x + 3 = 11"))).toBe(true);
  });

  it("treats other fractions as untidy", () => {
    expect(isTidy(eq("x + 5/2 = 17/2"))).toBe(false);
    expect(isTidy(eq("2x/3 = 4"))).toBe(false);
  });
});
