/**
 * Judging an equation that a learner wrote from a word problem.
 *
 * Writing the equation is the hard part of a word problem, so it is checked on
 * its own, before any solving. The intended equation comes from the story
 * template. The learner's equation is compared with it in four ways, from most
 * to least welcome:
 *
 *   exact        the same equation (sides in either order, terms in any order)
 *   equivalent   a different equation with the same solution that does not
 *                just state the answer, for example 2x = 12 for 2x + 5 = 17
 *   answer-given x is already alone, so nothing is left to solve
 *   wrong        a different solution; a hint says which part to look at
 */

import { equals, isZero, neg } from "./fraction";
import { equalsEquation, type Equation } from "./expression";
import { parseEquation } from "./parse";
import { isSolved, sameSolution, solveEquation } from "./solve";

/** Why what a learner wrote cannot be read as an equation. */
export type WrittenProblem = "empty" | "no-equals" | "many-equals" | "unknown-letter" | "not-linear" | "unreadable";

export type Written = { readonly ok: true; readonly equation: Equation } | { readonly ok: false; readonly problem: WrittenProblem };

/**
 * Reads an equation the learner typed from scratch. It accepts what people
 * actually write: `2x+3=15`, `3(x + 1)`, `0,75x`, `x/2`, `x·2`, `x : 2`, a capital X.
 */
export function readWritten(text: string): Written {
  const cleaned = text
    .trim()
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/[·×]/g, "*")
    .replace(/[÷:]/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/X/g, "x");

  if (cleaned === "") return { ok: false, problem: "empty" };
  const equals = cleaned.split("=").length - 1;
  if (equals === 0) return { ok: false, problem: "no-equals" };
  if (equals > 1) return { ok: false, problem: "many-equals" };
  if (/[a-wyzA-WYZ]/.test(cleaned)) return { ok: false, problem: "unknown-letter" };

  const parsed = parseEquation(cleaned);
  if (parsed.ok) return { ok: true, equation: parsed.value };
  if (/non-linear|expression with x/.test(parsed.message)) return { ok: false, problem: "not-linear" };
  return { ok: false, problem: "unreadable" };
}

export type BuildHint = "sign" | "swapped" | "total" | "general";

export type BuildVerdict =
  | { readonly kind: "no-variable" }
  | { readonly kind: "exact" }
  | { readonly kind: "equivalent" }
  | { readonly kind: "answer-given" }
  | { readonly kind: "wrong"; readonly hint: BuildHint };

export function mirror(eq: Equation): Equation {
  return { left: eq.right, right: eq.left };
}

/** True when two equations say the same thing, allowing the sides to be swapped. */
export function sameEquation(a: Equation, b: Equation): boolean {
  return equalsEquation(a, b) || equalsEquation(a, mirror(b));
}

function hasVariable(eq: Equation): boolean {
  return !isZero(eq.left.x) || !isZero(eq.right.x);
}

/** Turns the learner's equation round so x sits on the same side as in the intended one. */
function sameOrientation(built: Equation, intended: Equation): Equation {
  const intendedLeft = !isZero(intended.left.x);
  const builtLeft = !isZero(built.left.x);
  return intendedLeft === builtLeft ? built : mirror(built);
}

function diagnose(built: Equation, intended: Equation): BuildHint {
  const b = sameOrientation(built, intended);

  const sameX = equals(b.left.x, intended.left.x) && equals(b.right.x, intended.right.x);
  const sameLeftConstant = equals(b.left.c, intended.left.c);
  const sameRightConstant = equals(b.right.c, intended.right.c);

  // Everything is right except the sign of a number: 2x − 3 = 15 for 2x + 3 = 15.
  const flipped =
    sameX &&
    ((sameRightConstant && equals(b.left.c, neg(intended.left.c)) && !isZero(intended.left.c)) ||
      (sameLeftConstant && equals(b.right.c, neg(intended.right.c)) && !isZero(intended.right.c)));
  if (flipped) return "sign";

  // The two numbers on the x side are the wrong way round: 3x + 2 for 2x + 3.
  if (
    equals(b.left.x, intended.left.c) &&
    equals(b.left.c, intended.left.x) &&
    !isZero(intended.left.x) &&
    !isZero(intended.left.c) &&
    sameRightConstant
  ) {
    return "swapped";
  }

  // The left side is right but the total is not.
  if (sameX && sameLeftConstant && !sameRightConstant) return "total";

  return "general";
}

/**
 * Compares the learner's equation with the story's equation.
 * Both must be exact equations (the builder only produces whole numbers).
 */
export function judgeBuiltEquation(built: Equation, intended: Equation): BuildVerdict {
  if (!hasVariable(built)) return { kind: "no-variable" };
  if (sameEquation(built, intended)) return { kind: "exact" };

  if (sameSolution(solveEquation(built), solveEquation(intended))) {
    return isSolved(built) ? { kind: "answer-given" } : { kind: "equivalent" };
  }
  return { kind: "wrong", hint: diagnose(built, intended) };
}
