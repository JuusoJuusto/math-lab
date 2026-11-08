/**
 * Turning equations and operations into text and display tokens.
 *
 * `Token`s are the single source of truth for presentation. The UI renders
 * them as styled spans (and stacked fractions), while `tokensToText` flattens
 * the same tokens into plain text for screen readers, tests and feedback
 * messages. This guarantees that what is read out matches what is shown.
 *
 * Expressions are always written in standard form, with the x term first:
 * `2x + 5`, `-x + 4`, `x/3 - 2`. Negative numbers use the true minus sign.
 */

import type { Lang } from "../lang";
import { abs, isNegative, isZero, type Fraction } from "./fraction";
import { termCount, type Equation, type LinearExpr } from "./expression";
import type { Operation } from "./operations";
import { engineText } from "./text";

export const MINUS = "−";

export interface Token {
  /** Visible text, or the numerator when `denominator` is set. */
  readonly text: string;
  /** When present, the token is a fraction `text / denominator`. */
  readonly denominator?: string;
  /** A sign glued to the front of the token, such as the minus in -x/3. */
  readonly prefix?: string;
  /** True for the part of a side that was added by the learner's operation. */
  readonly applied?: boolean;
}

/** Every symbol that can stand between two terms, in any language. */
const OPERATOR_TEXTS = new Set(["+", MINUS, "×", "÷", "·", ":"]);

/** True for a token that is an operator between terms rather than part of a term. */
export function isOperatorText(text: string): boolean {
  return OPERATOR_TEXTS.has(text);
}

/** Formats a fraction such as 5, -3 or 7/2. */
export function formatFraction(value: Fraction): string {
  const sign = isNegative(value) ? MINUS : "";
  const magnitude = abs(value);
  return magnitude.d === 1 ? `${sign}${magnitude.n}` : `${sign}${magnitude.n}/${magnitude.d}`;
}

export function magnitudeToken(value: Fraction, withVariable: boolean, applied?: boolean): Token {
  const magnitude = abs(value);
  const numerator = withVariable ? (magnitude.n === 1 ? "x" : `${magnitude.n}x`) : String(magnitude.n);
  return magnitude.d === 1
    ? { text: numerator, applied }
    : { text: numerator, denominator: String(magnitude.d), applied };
}

export function withPrefix(token: Token, prefix: string): Token {
  return { ...token, prefix };
}

/** Tokens for an expression in standard form. */
export function expressionTokens(expression: LinearExpr): Token[] {
  const tokens: Token[] = [];

  if (!isZero(expression.x)) {
    const term = magnitudeToken(expression.x, true);
    tokens.push(isNegative(expression.x) ? withPrefix(term, MINUS) : term);
  }

  if (!isZero(expression.c)) {
    const term = magnitudeToken(expression.c, false);
    if (tokens.length === 0) {
      tokens.push(isNegative(expression.c) ? withPrefix(term, MINUS) : term);
    } else {
      tokens.push({ text: isNegative(expression.c) ? MINUS : "+" }, term);
    }
  }

  return tokens.length === 0 ? [{ text: "0" }] : tokens;
}

export function operandTokens(op: Operation): Token[] {
  const body = magnitudeToken(op.amount, op.withVariable, true);
  if (isNegative(op.amount)) {
    return [
      { text: "(", applied: true },
      { ...withPrefix(body, MINUS), applied: true },
      { text: ")", applied: true },
    ];
  }
  return [body];
}

/** The sign written for an operation: + − and the language's own × or · and ÷ or :. */
export function operatorSymbol(op: Operation, lang: Lang = "en"): string {
  const text = engineText(lang);
  switch (op.kind) {
    case "add":
      return "+";
    case "subtract":
      return MINUS;
    case "multiply":
      return text.times;
    case "divide":
      return text.divide;
  }
}

/** True when a side must be wrapped in brackets before multiplying or dividing it. */
function needsBrackets(side: LinearExpr): boolean {
  if (termCount(side) > 1) return true;
  // A single negative term such as -2x or -3 also reads better in brackets: (-2x) × 3.
  return isNegative(side.x) || (isZero(side.x) && isNegative(side.c));
}

/**
 * Tokens for one side of the equation, optionally with an operation written
 * out but not yet simplified, for example `2x + 5 − 5`.
 */
export function sideTokens(side: LinearExpr, op?: Operation, lang: Lang = "en"): Token[] {
  const base = expressionTokens(side);
  if (!op) return base;

  const symbol: Token = { text: operatorSymbol(op, lang), applied: true };

  if (op.kind === "add" || op.kind === "subtract") {
    return [...base, symbol, ...operandTokens(op)];
  }

  const wrapped = needsBrackets(side) ? [{ text: "(" }, ...base, { text: ")" }] : base;
  return [...wrapped, symbol, ...operandTokens(op)];
}

/** Flattens tokens into plain text, for example `2x + 5 − 5`. */
export function tokensToText(tokens: readonly Token[]): string {
  let text = "";
  for (const token of tokens) {
    const body = `${token.prefix ?? ""}${token.text}${token.denominator ? `/${token.denominator}` : ""}`;
    const isBinaryOperator = isOperatorText(token.text) && !token.prefix && !token.denominator;
    text += isBinaryOperator ? ` ${body} ` : body;
  }
  return text.replace(/\s+/g, " ").trim();
}

export function formatExpression(expression: LinearExpr): string {
  return tokensToText(expressionTokens(expression));
}

export function formatEquation(eq: Equation): string {
  return `${formatExpression(eq.left)} = ${formatExpression(eq.right)}`;
}

/** One side with the operation written out, such as `2x + 5 − 5`. */
export function formatSideWithOperation(side: LinearExpr, op: Operation, lang: Lang = "en"): string {
  return tokensToText(sideTokens(side, op, lang));
}

/** The whole equation with the operation written on both sides, before simplifying. */
export function formatAppliedEquation(eq: Equation, op: Operation, lang: Lang = "en"): string {
  return `${formatSideWithOperation(eq.left, op, lang)} = ${formatSideWithOperation(eq.right, op, lang)}`;
}

/** The amount of an operation: `5`, `3x`, `x`, `−2` or `1/2`. */
export function formatAmount(op: Operation): string {
  const magnitude = abs(op.amount);
  const sign = isNegative(op.amount) ? MINUS : "";
  if (op.withVariable) {
    // x/4 and 3x/4, never 1/4x (which would read as 1 over 4x).
    const top = magnitude.n === 1 ? "" : String(magnitude.n);
    return `${sign}${top}x${magnitude.d === 1 ? "" : `/${magnitude.d}`}`;
  }
  return formatFraction(op.amount);
}

/** A short symbol-and-number label such as `− 5` or `÷ 2`. */
export function operationLabel(op: Operation, lang: Lang = "en"): string {
  const amount = isNegative(op.amount) ? `(${formatAmount(op)})` : formatAmount(op);
  return `${operatorSymbol(op, lang)} ${amount}`;
}

/**
 * The operation written beside the equation, the way it is in a notebook:
 * `3x − 5 = 6 || + 5`, the way Finnish textbooks write it. This returns the `|| + 5` part.
 */
export function formatBar(op: Operation, lang: Lang = "en"): string {
  return `|| ${operationLabel(op, lang)}`;
}

/** A lower-case sentence fragment such as `subtract 5 from both sides`. */
export function operationPhrase(op: Operation, lang: Lang = "en"): string {
  return engineText(lang).phrase(op.kind, formatAmount(op));
}

/** A sentence-case version of {@link operationPhrase}, such as `Subtract 5 from both sides`. */
export function describeOperation(op: Operation, lang: Lang = "en"): string {
  const phrase = operationPhrase(op, lang);
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** Rewrites maths text so that screen readers pronounce it sensibly. */
export function toSpeech(text: string, lang: Lang = "en"): string {
  return engineText(lang).speech(text);
}
