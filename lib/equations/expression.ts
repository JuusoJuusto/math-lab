/**
 * Linear expressions and equations in one variable, `x`.
 *
 * An expression is stored as `x * coefficient + constant`. Anything that is
 * linear in x collapses into this shape, which keeps simplification trivially
 * correct: like terms are combined by construction.
 */

import { ZERO, add, equals, frac, isZero, mul, sub, type Fraction } from "./fraction";

export interface LinearExpr {
  /** Coefficient of x. */
  readonly x: Fraction;
  /** Constant term. */
  readonly c: Fraction;
}

export interface Equation {
  readonly left: LinearExpr;
  readonly right: LinearExpr;
}

function asFraction(value: Fraction | number): Fraction {
  return typeof value === "number" ? frac(value) : value;
}

/** Builds `coefficient * x + constant`. Numbers are treated as whole numbers. */
export function expr(coefficient: Fraction | number, constant: Fraction | number = 0): LinearExpr {
  return { x: asFraction(coefficient), c: asFraction(constant) };
}

/** A plain number with no x term. */
export function constant(value: Fraction | number): LinearExpr {
  return { x: ZERO, c: asFraction(value) };
}

export function equation(left: LinearExpr, right: LinearExpr): Equation {
  return { left, right };
}

export function addExpr(a: LinearExpr, b: LinearExpr): LinearExpr {
  return { x: add(a.x, b.x), c: add(a.c, b.c) };
}

export function subExpr(a: LinearExpr, b: LinearExpr): LinearExpr {
  return { x: sub(a.x, b.x), c: sub(a.c, b.c) };
}

/** Multiplies an expression by a number. */
export function scaleExpr(a: LinearExpr, factor: Fraction): LinearExpr {
  return { x: mul(a.x, factor), c: mul(a.c, factor) };
}

export function equalsExpr(a: LinearExpr, b: LinearExpr): boolean {
  return equals(a.x, b.x) && equals(a.c, b.c);
}

export function equalsEquation(a: Equation, b: Equation): boolean {
  return equalsExpr(a.left, b.left) && equalsExpr(a.right, b.right);
}

/** True when the expression has no x term. */
export function isConstantExpr(a: LinearExpr): boolean {
  return isZero(a.x);
}

/** Number of non-zero terms (0, 1 or 2). */
export function termCount(a: LinearExpr): number {
  return (isZero(a.x) ? 0 : 1) + (isZero(a.c) ? 0 : 1);
}

/** Evaluates an expression at a given value of x. */
export function evaluate(a: LinearExpr, value: Fraction): Fraction {
  return add(mul(a.x, value), a.c);
}
