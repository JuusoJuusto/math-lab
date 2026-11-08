/**
 * Flipping a term across the equals sign.
 *
 *     3x − 5 = 6      tap the − 5      3x = 6 + 5
 *
 * "Move it over and change its sign" is the shortcut every textbook teaches.
 * It is not a new rule. It is the balance rule written briefly: moving − 5
 * is the same as adding 5 to both sides, and on the side it left the + 5 and
 * the − 5 cancel. So a flip is never applied by its own arithmetic. It becomes
 * the ordinary operation it stands for, `applyOperation` validates it, and the
 * tutor judges it like any other move. The only extra work here is *showing*
 * the move the way a learner writes it.
 *
 * Three kinds of term can move:
 *   - a plain number          −5 on the left of 3x − 5 = 6
 *   - an x term               3x on the right of 5x + 2 = 3x + 12
 *   - the factor of x         the 3 in 3x = 6, which crosses as a division
 */

import type { Lang } from "../lang";
import { abs, isInteger, isNegative, isOne, isUnitFraction, isZero, neg, type Fraction } from "./fraction";
import type { Equation, LinearExpr } from "./expression";
import {
  MINUS,
  formatAmount,
  formatBar,
  formatFraction,
  magnitudeToken,
  operationPhrase,
  operatorSymbol,
  sideTokens,
  tokensToText,
  withPrefix,
  type Token,
} from "./format";
import { operation, operationsEqual, type Operation } from "./operations";
import { engineText } from "./text";
import {
  evaluateMove,
  explainStep,
  getHints,
  suggestNextMove,
  type HintSet,
  type MoveEvaluation,
  type StepExplanation,
} from "./tutor";

export type Side = "left" | "right";

export type FlipTarget =
  | { readonly kind: "constant"; readonly side: Side }
  | { readonly kind: "variable"; readonly side: Side }
  /** The number that multiplies or divides x, when x stands alone on its side. */
  | { readonly kind: "factor" };

export function flipTargetsEqual(a: FlipTarget, b: FlipTarget): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind === "factor" || (b.kind !== "factor" && a.side === b.side);
}

/** The operation that cancels `term` when it is applied to both sides. */
function cancelling(term: Fraction, withVariable: boolean): Operation {
  return isNegative(term) ? operation("add", abs(term), withVariable) : operation("subtract", term, withVariable);
}

/** The side holding x when x is on exactly one side, with nothing else beside it. */
function factorSide(eq: Equation): Side | null {
  const hasLeft = !isZero(eq.left.x);
  const hasRight = !isZero(eq.right.x);
  if (hasLeft === hasRight) return null;
  const side: Side = hasLeft ? "left" : "right";
  const expression = eq[side];
  if (!isZero(expression.c) || isOne(expression.x)) return null;
  return side;
}

/**
 * The ordinary operation a flip stands for, or `null` when there is nothing to
 * flip (the term is not there, or x is already alone).
 */
export function flipOperation(eq: Equation, target: FlipTarget): Operation | null {
  if (target.kind === "constant") {
    const value = eq[target.side].c;
    return isZero(value) ? null : cancelling(value, false);
  }
  if (target.kind === "variable") {
    const value = eq[target.side].x;
    return isZero(value) ? null : cancelling(value, true);
  }

  const side = factorSide(eq);
  if (!side) return null;
  const coefficient = eq[side].x;
  if (isUnitFraction(coefficient)) return operation("multiply", isNegative(coefficient) ? -coefficient.d : coefficient.d);
  if (isInteger(coefficient)) return operation("divide", coefficient);
  // A coefficient such as 2/3 needs two moves, so it is not a single flip.
  return null;
}

/* -------------------------------------------------------------------------- */
/* Terms the learner can tap                                                  */
/* -------------------------------------------------------------------------- */

export interface FlipTerm {
  /** What tapping the term flips, or `null` for a term that cannot move on its own (such as the 2/3 in 2x/3 = 4). */
  readonly target: FlipTarget | null;
  /** How the term is drawn, with its operator in front unless it starts the side. */
  readonly tokens: readonly Token[];
  /** The term as text, e.g. `− 5` or `3x`. */
  readonly text: string;
  /** What it becomes on the other side, e.g. `+ 5`, or `÷ 3` for a factor. Empty when it cannot move. */
  readonly becomes: string;
  /** The ordinary operation the flip stands for. */
  readonly operation: Operation | null;
}

interface Part {
  readonly value: Fraction;
  readonly variable: boolean;
  readonly applied?: boolean;
}

function partsOf(side: LinearExpr): Part[] {
  const parts: Part[] = [];
  if (!isZero(side.x)) parts.push({ value: side.x, variable: true });
  if (!isZero(side.c)) parts.push({ value: side.c, variable: false });
  return parts;
}

function partTokens(part: Part, first: boolean): Token[] {
  const magnitude = magnitudeToken(part.value, part.variable, part.applied);
  if (first) return [isNegative(part.value) ? withPrefix(magnitude, MINUS) : magnitude];
  return [{ text: isNegative(part.value) ? MINUS : "+", applied: part.applied }, magnitude];
}

function allTokens(parts: readonly Part[]): Token[] {
  if (parts.length === 0) return [{ text: "0" }];
  return parts.flatMap((part, index) => partTokens(part, index === 0));
}

/** `+ 5` or `− 5`: a term written with its sign, as it appears after something else. */
function signedText(value: Fraction, variable: boolean): string {
  const magnitude = formatAmount(operation("add", abs(value), variable));
  return `${isNegative(value) ? MINUS : "+"} ${magnitude}`;
}

/**
 * Every term of both sides, in reading order, with what flipping it would do.
 * A term that cannot move is still listed (so the equation can be drawn in
 * full) but has no target.
 */
export function flipTerms(eq: Equation, lang: Lang = "en"): { readonly left: FlipTerm[]; readonly right: FlipTerm[] } {
  const alone = factorSide(eq);
  const result: Record<Side, FlipTerm[]> = { left: [], right: [] };

  for (const side of ["left", "right"] as const) {
    const parts = partsOf(eq[side]);
    parts.forEach((part, index) => {
      const target: FlipTarget = part.variable
        ? alone === side
          ? { kind: "factor" }
          : { kind: "variable", side }
        : { kind: "constant", side };
      const op = flipOperation(eq, target);
      const tokens = partTokens(part, index === 0);
      const text = tokensToText(tokens);
      if (!op) {
        result[side].push({ target: null, tokens, text, becomes: "", operation: null });
        return;
      }

      const becomes =
        target.kind === "factor"
          ? `${operatorSymbol(op, lang)} ${isNegative(op.amount) ? `(${formatFraction(op.amount)})` : formatFraction(op.amount)}`
          : signedText(neg(part.value), part.variable);
      result[side].push({ target, tokens, text, becomes, operation: op });
    });
  }
  return result;
}

/** The term a target refers to in `eq`, if it can be flipped. */
export function findFlipTerm(eq: Equation, target: FlipTarget, lang: Lang = "en"): FlipTerm | null {
  const { left, right } = flipTerms(eq, lang);
  return [...left, ...right].find((term) => term.target !== null && flipTargetsEqual(term.target, target)) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Showing the flipped equation                                               */
/* -------------------------------------------------------------------------- */

export interface FlipPreview {
  readonly left: Token[];
  readonly right: Token[];
}

/**
 * The equation after the term has crossed the equals sign but before it has
 * been worked out: `3x = 6 + 5`. The moved part is marked `applied` so it can
 * be highlighted.
 */
export function flipPreview(eq: Equation, target: FlipTarget, lang: Lang = "en"): FlipPreview | null {
  const op = flipOperation(eq, target);
  if (!op) return null;

  if (target.kind === "factor") {
    const side = factorSide(eq);
    if (!side) return null;
    const other: Side = side === "left" ? "right" : "left";
    const alone: Token[] = [{ text: "x" }];
    const crossed = sideTokens(eq[other], op, lang);
    return side === "left" ? { left: alone, right: crossed } : { left: crossed, right: alone };
  }

  const from = target.side;
  const to: Side = from === "left" ? "right" : "left";
  const variable = target.kind === "variable";

  const original = partsOf(eq[from]).find((part) => part.variable === variable);
  if (!original) return null;

  const remaining = partsOf(eq[from]).filter((part) => part.variable !== variable);
  const moved: Part = { value: neg(original.value), variable, applied: true };
  const destination = partsOf(eq[to]);
  // x terms stay in front of plain numbers, so 5x + 2 = 3x + 12 becomes 5x − 3x + 2 = 12.
  const at = variable ? destination.filter((part) => part.variable).length : destination.length;
  const landed = [...destination.slice(0, at), moved, ...destination.slice(at)];

  const fromTokens = allTokens(remaining);
  const toTokens = allTokens(landed);
  return from === "left" ? { left: fromTokens, right: toTokens } : { left: toTokens, right: fromTokens };
}

/** The flipped equation as plain text, e.g. `3x = 6 + 5`. */
export function formatFlipPreview(eq: Equation, target: FlipTarget, lang: Lang = "en"): string | null {
  const preview = flipPreview(eq, target, lang);
  return preview ? `${tokensToText(preview.left)} = ${tokensToText(preview.right)}` : null;
}

/* -------------------------------------------------------------------------- */
/* Judging and explaining a flip                                              */
/* -------------------------------------------------------------------------- */

/** Explains a flip that was accepted. */
export function explainFlip(eq: Equation, target: FlipTarget, stepIndex = 0, lang: Lang = "en"): StepExplanation | null {
  const op = flipOperation(eq, target);
  const term = findFlipTerm(eq, target, lang);
  if (!op || !term) return null;

  const text = engineText(lang).flip;
  const outcome = evaluateMove(eq, op, stepIndex, lang);
  if (outcome.verdict !== "helpful") return null;
  const base = explainStep(outcome.step, stepIndex, lang);

  const why =
    target.kind !== "factor"
      ? text.term(term.text, term.becomes, formatBar(op, lang), operationPhrase(op, lang))
      : op.kind === "divide"
        ? text.factorDivide(formatFraction(op.amount))
        : text.factorMultiply(formatFraction(op.amount));
  return { ...base, why };
}

/**
 * Judges a flip. A good flip is explained as a flip; a flip that does not help
 * gets flip wording ("flipping that does not help yet") instead of talk about
 * adding to both sides, which the learner never asked for.
 */
export function evaluateFlip(eq: Equation, target: FlipTarget, stepIndex = 0, lang: Lang = "en"): MoveEvaluation | null {
  const op = flipOperation(eq, target);
  const term = findFlipTerm(eq, target, lang);
  if (!op || !term) return null;

  const evaluation = evaluateMove(eq, op, stepIndex, lang);
  const text = engineText(lang).flip;

  if (evaluation.verdict === "helpful") {
    const explanation = explainFlip(eq, target, stepIndex, lang);
    return explanation ? { ...evaluation, explanation } : evaluation;
  }

  if (evaluation.verdict === "not-helpful" && evaluation.reason !== "awkward") {
    return {
      ...evaluation,
      title: text.notHelpfulTitle,
      message: text.notHelpful(term.text),
      preview: { applied: formatFlipPreview(eq, target, lang) ?? evaluation.preview.applied, result: evaluation.preview.result },
    };
  }
  return evaluation;
}

/**
 * The three hints for an equation, with the flip shortcut added to the last
 * one when the tutor's suggested move is something a learner could also do by
 * flipping a term: "Shortcut: tap − 5 in flip mode; it crosses over as + 5".
 */
export function hintsWithFlip(eq: Equation, lang: Lang = "en"): HintSet | null {
  const hints = getHints(eq, lang);
  const suggestion = suggestNextMove(eq);
  if (!hints || !suggestion) return hints;

  const { left, right } = flipTerms(eq, lang);
  const term = [...left, ...right].find((candidate) => candidate.operation && operationsEqual(candidate.operation, suggestion.operation));
  if (!term) return hints;
  return [hints[0], hints[1], `${hints[2]} ${engineText(lang).tutor.flipTip(term.text, term.becomes)}`];
}
