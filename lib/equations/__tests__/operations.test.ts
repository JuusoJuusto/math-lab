import { describe, expect, it } from "vitest";
import { frac } from "../fraction";
import { formatAppliedEquation, formatEquation } from "../format";
import {
  MAX_AMOUNT,
  applyOperation,
  inverseOperation,
  operation,
  operationKey,
  validateOperation,
  type Operation,
} from "../operations";
import { mustParseEquation } from "../parse";
import { createRng } from "../round";
import { sameSolution, solveEquation } from "../solve";

const eq = mustParseEquation;

function apply(equationText: string, op: Operation) {
  const result = applyOperation(eq(equationText), op);
  if (!result.ok) throw new Error(`Expected ${op.kind} to be allowed: ${result.problem.message}`);
  return result.step;
}

describe("applying valid operations", () => {
  it("subtracts from both sides", () => {
    const step = apply("2x + 5 = 17", operation("subtract", 5));
    expect(formatEquation(step.after)).toBe("2x = 12");
    expect(formatAppliedEquation(step.before, step.operation)).toBe("2x + 5 − 5 = 17 − 5");
  });

  it("adds to both sides", () => {
    expect(formatEquation(apply("x - 7 = 9", operation("add", 7)).after)).toBe("x = 16");
  });

  it("divides both sides", () => {
    const step = apply("2x = 12", operation("divide", 2));
    expect(formatEquation(step.after)).toBe("x = 6");
    expect(formatAppliedEquation(step.before, step.operation)).toBe("2x ÷ 2 = 12 ÷ 2");
  });

  it("multiplies both sides", () => {
    const step = apply("x/4 = 6", operation("multiply", 4));
    expect(formatEquation(step.after)).toBe("x = 24");
    expect(formatAppliedEquation(step.before, step.operation)).toBe("x/4 × 4 = 6 × 4");
  });

  it("puts brackets around sides with more than one term", () => {
    const step = apply("x/3 + 4 = 9", operation("multiply", 3));
    expect(formatAppliedEquation(step.before, step.operation)).toBe("(x/3 + 4) × 3 = 9 × 3");
    expect(formatEquation(step.after)).toBe("x + 12 = 27");
  });

  it("collects variable terms by subtracting an x term", () => {
    const step = apply("5x + 2 = 3x + 12", operation("subtract", 3, true));
    expect(formatEquation(step.after)).toBe("2x + 2 = 12");
    expect(formatAppliedEquation(step.before, step.operation)).toBe("5x + 2 − 3x = 3x + 12 − 3x");
  });

  it("works with a bare x as the amount", () => {
    expect(formatEquation(apply("-x + 4 = 2x - 8", operation("add", 1, true)).after)).toBe("4 = 3x − 8");
  });
});

describe("negative numbers", () => {
  it("divides by a negative coefficient and flips the sign of the other side", () => {
    const step = apply("-2x = 8", operation("divide", -2));
    expect(formatEquation(step.after)).toBe("x = −4");
    expect(formatAppliedEquation(step.before, step.operation)).toBe("(−2x) ÷ (−2) = 8 ÷ (−2)");
  });

  it("multiplies by -1 to change every sign", () => {
    expect(formatEquation(apply("-x = -6", operation("multiply", -1)).after)).toBe("x = 6");
  });

  it("handles negative constants", () => {
    expect(formatEquation(apply("3x - 4 = -10", operation("add", 4)).after)).toBe("3x = −6");
  });

  it("treats adding a negative number as subtracting", () => {
    const step = apply("x + 5 = 12", operation("add", -5));
    expect(formatEquation(step.after)).toBe("x = 7");
    expect(formatAppliedEquation(step.before, step.operation)).toBe("x + 5 + (−5) = 12 + (−5)");
  });

  it("subtracting a negative number adds it", () => {
    expect(formatEquation(apply("x - 3 = 4", operation("subtract", -3)).after)).toBe("x = 7");
  });
});

describe("operations that would break the equation", () => {
  it("rejects division by zero", () => {
    const result = applyOperation(eq("2x = 12"), operation("divide", 0));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.code).toBe("divide-by-zero");
      expect(result.problem.title).toMatch(/divide by zero/i);
      expect(result.problem.message).toMatch(/never allowed/i);
    }
  });

  it("rejects multiplying by zero, which would turn the equation into 0 = 0", () => {
    const result = applyOperation(eq("2x = 12"), operation("multiply", 0));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem.code).toBe("multiply-by-zero");
  });

  it("rejects multiplying or dividing by an expression containing x", () => {
    for (const kind of ["multiply", "divide"] as const) {
      const result = applyOperation(eq("2x = 12"), operation(kind, 2, true));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.problem.code).toBe("variable-multiplier");
    }
  });

  it("reports variable multipliers before division by zero", () => {
    expect(validateOperation(operation("divide", 0, true))?.code).toBe("variable-multiplier");
  });

  it("allows adding zero but leaves the equation unchanged", () => {
    const step = apply("2x + 5 = 17", operation("add", 0));
    expect(formatEquation(step.after)).toBe("2x + 5 = 17");
  });

  it("does not throw when numbers grow too large; it reports a problem", () => {
    let current = eq("x = 900000");
    let lastProblem: string | null = null;
    for (let i = 0; i < 4 && !lastProblem; i += 1) {
      const result = applyOperation(current, operation("multiply", MAX_AMOUNT));
      if (result.ok) current = result.step.after;
      else lastProblem = result.problem.code;
    }
    expect(lastProblem).toBe("too-large");
  });
});

describe("operation helpers", () => {
  it("finds the inverse of each kind", () => {
    expect(inverseOperation(operation("add", 5)).kind).toBe("subtract");
    expect(inverseOperation(operation("subtract", 5, true)).kind).toBe("add");
    expect(inverseOperation(operation("multiply", 3)).kind).toBe("divide");
    expect(inverseOperation(operation("divide", 3)).kind).toBe("multiply");
  });

  it("builds distinct keys for distinct operations", () => {
    expect(operationKey(operation("add", 5))).not.toBe(operationKey(operation("add", 5, true)));
    expect(operationKey(operation("add", 5))).not.toBe(operationKey(operation("subtract", 5)));
    expect(operationKey(operation("add", 5))).toBe(operationKey(operation("add", frac(5))));
  });
});

describe("equivalence is preserved by every accepted operation (randomised)", () => {
  const rng = createRng(20240601);
  const pick = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
  const kinds = ["add", "subtract", "multiply", "divide"] as const;

  it("never changes the solution", () => {
    let applied = 0;
    let rejected = 0;

    for (let i = 0; i < 1500; i += 1) {
      const text = `${pick(-9, 9)}x + ${pick(-20, 20)} = ${pick(-9, 9)}x + ${pick(-20, 20)}`;
      const equation = eq(text);
      const op = operation(kinds[pick(0, 3)], pick(-12, 12), rng() < 0.3);
      const result = applyOperation(equation, op);

      if (result.ok) {
        applied += 1;
        expect(sameSolution(solveEquation(equation), solveEquation(result.step.after)), `${text} with ${operationKey(op)}`).toBe(true);
      } else {
        rejected += 1;
        expect(["divide-by-zero", "multiply-by-zero", "variable-multiplier"]).toContain(result.problem.code);
      }
    }

    // Make sure the test really exercised both outcomes.
    expect(applied).toBeGreaterThan(500);
    expect(rejected).toBeGreaterThan(100);
  });
});
