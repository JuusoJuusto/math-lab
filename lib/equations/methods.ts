/**
 * Other ways to see the same solution.
 *
 *   chain   "work backwards" (käänteisoperaatiot): write what is done to x, in
 *           order, as a chain from x to the result, then undo it from the end.
 *   graph   each side of the equation is a line; the solution is where they cross.
 *
 * Both are pure calculations here. The interface draws them and asks the
 * learner, and the session accepts the answer only if the engine agrees.
 */

import { abs, frac, isInteger, isNegative, isOne, isUnitFraction, isZero, sub, type Fraction } from "./fraction";
import { evaluate, type Equation, type LinearExpr } from "./expression";
import { applyOperationToSide, operation, type Operation, type OperationKind } from "./operations";
import { expr } from "./expression";
import { solveEquation } from "./solve";

/* -------------------------------------------------------------------------- */
/* Working backwards                                                          */
/* -------------------------------------------------------------------------- */

export interface ChainStep {
  readonly kind: OperationKind;
  readonly amount: Fraction;
}

export interface Chain {
  /** What is done to x, in order: for 2x + 5 = 17, "multiply by 2" and then "add 5". */
  readonly forward: readonly ChainStep[];
  /** The number the chain ends at: 17. */
  readonly result: Fraction;
  /** Undoing it from the end: "subtract 5" (17 gives 12), then "divide by 2" (12 gives 6). */
  readonly backward: readonly { readonly operation: Operation; readonly from: Fraction; readonly to: Fraction }[];
}

const INVERSE: Record<OperationKind, OperationKind> = { add: "subtract", subtract: "add", multiply: "divide", divide: "multiply" };

/**
 * The chain of an equation where x appears once, on one side, as `a·x + b`.
 * Returns `null` when x is on both sides or the equation has no such chain.
 */
export function chainOf(eq: Equation): Chain | null {
  const hasLeft = !isZero(eq.left.x);
  const hasRight = !isZero(eq.right.x);
  if (hasLeft === hasRight) return null;

  const side: LinearExpr = hasLeft ? eq.left : eq.right;
  const other: LinearExpr = hasLeft ? eq.right : eq.left;
  const a = side.x;
  const b = side.c;

  const forward: ChainStep[] = [];
  if (!isOne(a)) {
    if (isUnitFraction(a) && !isNegative(a)) forward.push({ kind: "divide", amount: frac(a.d) });
    else if (isInteger(a)) forward.push({ kind: "multiply", amount: a });
    else {
      forward.push({ kind: "multiply", amount: frac(a.n) });
      forward.push({ kind: "divide", amount: frac(a.d) });
    }
  }
  if (!isZero(b)) forward.push(isNegative(b) ? { kind: "subtract", amount: abs(b) } : { kind: "add", amount: b });

  const backward: Chain["backward"][number][] = [];
  let value = other.c;
  for (const step of [...forward].reverse()) {
    const undo = operation(INVERSE[step.kind], step.amount);
    const to = applyOperationToSide(expr(0, value), undo).c;
    backward.push({ operation: undo, from: value, to });
    value = to;
  }
  return { forward, result: other.c, backward };
}

/* -------------------------------------------------------------------------- */
/* The graph                                                                  */
/* -------------------------------------------------------------------------- */

export interface GraphPoint {
  readonly x: number;
  readonly y: number;
}

export interface GraphLine {
  readonly side: "left" | "right";
  readonly from: GraphPoint;
  readonly to: GraphPoint;
  /** The side as an expression, for the label: `2x + 5` or `17`. */
  readonly expression: LinearExpr;
}

export interface Graph {
  readonly kind: "one" | "none" | "infinite";
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
  readonly left: GraphLine;
  readonly right: GraphLine;
  /** Where the lines cross, when they cross at one point. */
  readonly meet: (GraphPoint & { readonly value: Fraction }) | null;
}

const num = (value: Fraction) => value.n / value.d;

/**
 * Each side of the equation as a line y = ax + c, over a range that shows the
 * crossing point with room around it. The solution of the equation is the x
 * where the two lines have the same y.
 */
export function graphOf(eq: Equation): Graph {
  const solution = solveEquation(eq);
  const kind = solution.kind === "one" ? "one" : solution.kind === "none" ? "none" : "infinite";
  const s = solution.kind === "one" ? num(solution.value) : 0;

  const xMin = Math.floor(Math.min(0, s)) - 2;
  const xMax = Math.ceil(Math.max(0, s)) + 2;
  const at = (side: LinearExpr, x: number): number => num(evaluate(side, frac(x)));
  const line = (side: LinearExpr, name: "left" | "right"): GraphLine => ({
    side: name,
    from: { x: xMin, y: at(side, xMin) },
    to: { x: xMax, y: at(side, xMax) },
    expression: side,
  });
  const left = line(eq.left, "left");
  const right = line(eq.right, "right");

  // The height at the crossing is worked out exactly from the fraction: x may be 3/2, which is not a whole number.
  const meet = solution.kind === "one" ? { x: s, y: num(evaluate(eq.left, solution.value)), value: solution.value } : null;
  const ys = [left.from.y, left.to.y, right.from.y, right.to.y, 0, ...(meet ? [meet.y] : [])];
  const low = Math.min(...ys);
  const high = Math.max(...ys);
  const pad = Math.max(1, (high - low) * 0.1);
  return { kind, xMin, xMax, yMin: low - pad, yMax: high + pad, left, right, meet };
}

/** The left side minus the right side at x: zero exactly where x is a solution. */
export function sidesDifference(eq: Equation, x: Fraction): Fraction {
  return sub(evaluate(eq.left, x), evaluate(eq.right, x));
}


/* -------------------------------------------------------------------------- */
/* Guess and check (trial and improvement)                                    */
/* -------------------------------------------------------------------------- */

export type GuessVerdict = "right" | "larger" | "smaller";

/**
 * What a guess for x tells you. Put the guess into both sides: if they are
 * equal, it is right. If not, the two sides say which way to go, because each
 * side is a straight line in x. Where the left side is lower and rises faster
 * than the right side, x has to be larger; if it falls faster, smaller.
 *
 * Only an equation with exactly one solution has a direction to follow, so
 * for an equation with no solution or with every x as a solution this returns
 * `null`.
 */
export function guessVerdict(eq: Equation, guess: Fraction): GuessVerdict | null {
  const slope = sub(eq.left.x, eq.right.x);
  if (isZero(slope)) return null;
  const difference = sidesDifference(eq, guess);
  if (isZero(difference)) return "right";
  // The difference changes by `slope` for every step of x. A positive difference with a positive slope means we are past the solution.
  return isNegative(difference) === isNegative(slope) ? "smaller" : "larger";
}
