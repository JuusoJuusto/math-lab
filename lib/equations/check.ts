/**
 * Verifying a solution by substitution.
 *
 * Replacing x with a candidate value and working out both sides is the
 * definition of "x is a solution". The check is exact (no rounding) and is
 * laid out as the lines a learner would write in their notebook.
 */

import { abs, equals, isNegative, isOne, isUnitFraction, isZero, mul, type Fraction } from "./fraction";
import { evaluate, type Equation, type LinearExpr } from "./expression";
import { MINUS, formatEquation, formatFraction } from "./format";

export interface SubstitutionLine {
  /** Short description of what happened on this line. */
  readonly label: string;
  /** The line itself, for example `2(6) + 5 = 17`. */
  readonly text: string;
}

export interface SubstitutionCheck {
  readonly value: Fraction;
  readonly lines: readonly SubstitutionLine[];
  readonly leftValue: Fraction;
  readonly rightValue: Fraction;
  /** True when both sides are equal, meaning `value` really solves the equation. */
  readonly holds: boolean;
}

interface Part {
  readonly negative: boolean;
  readonly text: string;
}

/** Joins signed parts: `2(6) + 5`, `−4 − 3`. */
function joinParts(parts: readonly Part[]): string {
  if (parts.length === 0) return "0";
  return parts
    .map((part, index) => {
      if (index === 0) return `${part.negative ? MINUS : ""}${part.text}`;
      return `${part.negative ? MINUS : "+"} ${part.text}`;
    })
    .join(" ");
}

function bracketed(value: Fraction): string {
  return `(${formatFraction(value)})`;
}

/** `x` replaced by the value, still showing the multiplication: `2(6) + 5`. */
function substituteSide(side: LinearExpr, value: Fraction): string {
  const parts: Part[] = [];

  if (!isZero(side.x)) {
    const magnitude = abs(side.x);
    const negative = isNegative(side.x);
    // Leading-term negatives show the value in brackets only when it is negative itself.
    const shown = isNegative(value) || value.d !== 1 ? bracketed(value) : formatFraction(value);

    if (isOne(magnitude)) {
      parts.push({ negative, text: negative ? bracketed(value) : shown });
    } else if (isUnitFraction(magnitude)) {
      parts.push({ negative, text: `${shown}/${magnitude.d}` });
    } else if (magnitude.d === 1) {
      parts.push({ negative, text: `${magnitude.n}${bracketed(value)}` });
    } else {
      parts.push({ negative, text: `${bracketed(magnitude)}${bracketed(value)}` });
    }
  }

  if (!isZero(side.c)) {
    parts.push({ negative: isNegative(side.c), text: formatFraction(abs(side.c)) });
  }

  return joinParts(parts);
}

/** The multiplication carried out, leaving only numbers: `12 + 5`. */
function productSide(side: LinearExpr, value: Fraction): string {
  const parts: Part[] = [];
  const product = mul(side.x, value);

  if (!isZero(side.x)) {
    parts.push({ negative: isNegative(product), text: formatFraction(abs(product)) });
  }
  if (!isZero(side.c)) {
    parts.push({ negative: isNegative(side.c), text: formatFraction(abs(side.c)) });
  }
  return joinParts(parts);
}

/**
 * Substitutes `value` for x in both sides of `eq` and reports every line of
 * working. Consecutive identical lines are merged so the layout stays short.
 */
export function checkSolution(eq: Equation, value: Fraction): SubstitutionCheck {
  const leftValue = evaluate(eq.left, value);
  const rightValue = evaluate(eq.right, value);

  const candidates: SubstitutionLine[] = [
    { label: "Original equation", text: formatEquation(eq) },
    {
      label: `Replace x with ${formatFraction(value)}`,
      text: `${substituteSide(eq.left, value)} = ${substituteSide(eq.right, value)}`,
    },
    {
      label: "Do the multiplication first",
      text: `${productSide(eq.left, value)} = ${productSide(eq.right, value)}`,
    },
    {
      label: "Work out each side",
      text: `${formatFraction(leftValue)} = ${formatFraction(rightValue)}`,
    },
  ];

  const lines = candidates.filter((line, index) => index === 0 || line.text !== candidates[index - 1].text);

  return { value, lines, leftValue, rightValue, holds: equals(leftValue, rightValue) };
}
