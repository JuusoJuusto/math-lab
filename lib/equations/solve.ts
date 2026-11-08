/**
 * Solving and classifying linear equations.
 *
 * Moving everything to one side gives `(a1 - a2) * x = b2 - b1`, which has
 * exactly one of three outcomes:
 *   - one solution          when the x coefficient is not zero
 *   - no solution           when x disappears and the constants differ
 *   - infinitely many       when x disappears and the constants match
 */

import { div, equals, isOne, isZero, sub, type Fraction } from "./fraction";
import { evaluate, type Equation } from "./expression";

export type Solution =
  | { readonly kind: "one"; readonly value: Fraction }
  | { readonly kind: "none" }
  | { readonly kind: "infinite" };

export function solveEquation(eq: Equation): Solution {
  const coefficient = sub(eq.left.x, eq.right.x);
  const constant = sub(eq.right.c, eq.left.c);

  if (isZero(coefficient)) {
    return isZero(constant) ? { kind: "infinite" } : { kind: "none" };
  }
  return { kind: "one", value: div(constant, coefficient) };
}

export function sameSolution(a: Solution, b: Solution): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "one" && b.kind === "one") return equals(a.value, b.value);
  return true;
}

/** True when neither side contains x any more, e.g. `3 = 5` or `4 = 4`. */
export function hasNoVariable(eq: Equation): boolean {
  return isZero(eq.left.x) && isZero(eq.right.x);
}

/** True for `x = number` or `number = x`, with x alone and not multiplied. */
export function isSolved(eq: Equation): boolean {
  const { left, right } = eq;
  const leftAlone = isOne(left.x) && isZero(left.c) && isZero(right.x);
  const rightAlone = isOne(right.x) && isZero(right.c) && isZero(left.x);
  return leftAlone || rightAlone;
}

/** The number x is equal to in a solved equation, or `null` if it is not solved yet. */
export function solvedValue(eq: Equation): Fraction | null {
  if (!isSolved(eq)) return null;
  return isOne(eq.left.x) ? eq.right.c : eq.left.c;
}

export type TerminalState = "solved" | "no-solution" | "infinite-solutions";

/**
 * Describes whether an equation has reached an end point.
 *
 * `null` means there is still work to do. When x has vanished from both sides,
 * the remaining statement (`3 = 5` or `4 = 4`) decides the outcome.
 */
export function terminalState(eq: Equation): TerminalState | null {
  if (isSolved(eq)) return "solved";
  if (hasNoVariable(eq)) {
    return equals(eq.left.c, eq.right.c) ? "infinite-solutions" : "no-solution";
  }
  return null;
}

/** True when `value` makes both sides of the equation equal. */
export function isSolution(eq: Equation, value: Fraction): boolean {
  return equals(evaluate(eq.left, value), evaluate(eq.right, value));
}
