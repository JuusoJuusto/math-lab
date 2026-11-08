/**
 * Operations a learner can apply to both sides of an equation.
 *
 * Correctness rules, enforced here rather than in the UI:
 *  - Adding or subtracting the same quantity (a number, or a multiple of x)
 *    on both sides always keeps the solution unchanged.
 *  - Multiplying or dividing both sides by a non-zero number keeps the
 *    solution unchanged.
 *  - Multiplying by zero, dividing by zero, or multiplying/dividing by an
 *    expression containing x can change or destroy the solution, so they are
 *    rejected and never presented as valid moves.
 *
 * As a final safety net, `applyOperation` checks that the solution of the
 * result matches the solution of the original equation and refuses to return
 * a step that does not.
 */

import type { Lang } from "../lang";
import { FractionRangeError, ONE, div, frac, isZero, type Fraction } from "./fraction";
import { addExpr, expr, scaleExpr, subExpr, type Equation, type LinearExpr } from "./expression";
import { sameSolution, solveEquation } from "./solve";
import { engineText } from "./text";

export type OperationKind = "add" | "subtract" | "multiply" | "divide";

export interface Operation {
  readonly kind: OperationKind;
  /** The size of the amount, for example 5 in "subtract 5" or 3 in "add 3x". */
  readonly amount: Fraction;
  /** True when the amount is a multiple of x ("3x") instead of a plain number. */
  readonly withVariable: boolean;
}

/** Largest amount a learner can type. Keeps every intermediate value exact. */
export const MAX_AMOUNT = 999;

/** Convenience constructor. Whole numbers are accepted directly. */
export function operation(kind: OperationKind, amount: Fraction | number, withVariable = false): Operation {
  return { kind, amount: typeof amount === "number" ? frac(amount) : amount, withVariable };
}

export function operationsEqual(a: Operation, b: Operation): boolean {
  return a.kind === b.kind && a.withVariable === b.withVariable && a.amount.n === b.amount.n && a.amount.d === b.amount.d;
}

/** Stable identifier, useful for noticing that a learner repeated a choice. */
export function operationKey(op: Operation): string {
  return `${op.kind}:${op.amount.n}/${op.amount.d}:${op.withVariable ? "x" : "n"}`;
}

/** The operation that reverses `op` (add <-> subtract, multiply <-> divide). */
export function inverseOperation(op: Operation): Operation {
  const inverse: Record<OperationKind, OperationKind> = {
    add: "subtract",
    subtract: "add",
    multiply: "divide",
    divide: "multiply",
  };
  return { ...op, kind: inverse[op.kind] };
}

export type InvalidOperationCode =
  | "divide-by-zero"
  | "multiply-by-zero"
  | "variable-multiplier"
  | "too-large"
  | "not-equivalent";

export interface OperationProblem {
  readonly code: InvalidOperationCode;
  /** Learner-facing title. */
  readonly title: string;
  /** Learner-facing explanation of why the operation is not allowed. */
  readonly message: string;
}

/** The result of applying an operation: both the starting point and the outcome. */
export interface AppliedStep {
  readonly before: Equation;
  readonly operation: Operation;
  /** The simplified equation after the operation. */
  readonly after: Equation;
}

export type ApplyResult =
  | { readonly ok: true; readonly step: AppliedStep }
  | { readonly ok: false; readonly problem: OperationProblem };

function problem(code: InvalidOperationCode, lang: Lang): OperationProblem {
  return { code, ...engineText(lang).problems[code] };
}

/**
 * Checks whether an operation is mathematically allowed, without applying it.
 * Returns `null` when the operation is allowed.
 */
export function validateOperation(op: Operation, lang: Lang = "en"): OperationProblem | null {
  if (op.withVariable && (op.kind === "multiply" || op.kind === "divide")) return problem("variable-multiplier", lang);
  if (op.kind === "divide" && isZero(op.amount)) return problem("divide-by-zero", lang);
  if (op.kind === "multiply" && isZero(op.amount)) return problem("multiply-by-zero", lang);
  return null;
}

/** The amount as an expression: `3` becomes the number 3, `3x` becomes 3 times x. */
export function amountExpression(op: Operation): LinearExpr {
  return op.withVariable ? expr(op.amount, 0) : expr(0, op.amount);
}

/**
 * Applies an operation to a single side.
 *
 * `applyOperation` always does this to both sides. Exposing the one-side
 * version lets exercises show what happens when a learner forgets a side.
 */
export function applyOperationToSide(side: LinearExpr, op: Operation): LinearExpr {
  switch (op.kind) {
    case "add":
      return addExpr(side, amountExpression(op));
    case "subtract":
      return subExpr(side, amountExpression(op));
    case "multiply":
      return scaleExpr(side, op.amount);
    case "divide":
      return scaleExpr(side, div(ONE, op.amount));
  }
}

/**
 * Applies an operation to both sides of an equation.
 *
 * The same operation is always applied to the left and the right side, which
 * is what keeps the equation balanced.
 */
export function applyOperation(eq: Equation, op: Operation, lang: Lang = "en"): ApplyResult {
  const invalid = validateOperation(op, lang);
  if (invalid) return { ok: false, problem: invalid };

  let after: Equation;
  try {
    after = { left: applyOperationToSide(eq.left, op), right: applyOperationToSide(eq.right, op) };
  } catch (error) {
    if (error instanceof FractionRangeError) {
      return { ok: false, problem: problem("too-large", lang) };
    }
    throw error;
  }

  // Safety net: a valid operation must never change what x is allowed to be.
  if (!sameSolution(solveEquation(eq), solveEquation(after))) {
    return { ok: false, problem: problem("not-equivalent", lang) };
  }

  return { ok: true, step: { before: eq, operation: op, after } };
}
