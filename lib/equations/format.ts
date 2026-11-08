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

import { abs, isNegative, isOne, isZero, type Fraction } from "./fraction";
import { termCount, type Equation, type LinearExpr } from "./expression";
import type { Operation } from "./operations";

export const MINUS = "−";
export const TIMES = "×";
export const DIVIDE = "÷";

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

const OPERATOR_TEXTS = new Set(["+", MINUS, TIMES, DIVIDE]);

/** Formats a fraction such as 5, -3 or 7/2. */
export function formatFraction(value: Fraction): string {
  const sign = isNegative(value) ? MINUS : "";
  const magnitude = abs(value);
  return magnitude.d === 1 ? `${sign}${magnitude.n}` : `${sign}${magnitude.n}/${magnitude.d}`;
}

function magnitudeToken(value: Fraction, withVariable: boolean, applied?: boolean): Token {
  const magnitude = abs(value);
  const numerator = withVariable ? (magnitude.n === 1 ? "x" : `${magnitude.n}x`) : String(magnitude.n);
  return magnitude.d === 1
    ? { text: numerator, applied }
    : { text: numerator, denominator: String(magnitude.d), applied };
}

function withPrefix(token: Token, prefix: string): Token {
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

function operandTokens(op: Operation): Token[] {
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

function operatorSymbol(op: Operation): string {
  switch (op.kind) {
    case "add":
      return "+";
    case "subtract":
      return MINUS;
    case "multiply":
      return TIMES;
    case "divide":
      return DIVIDE;
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
export function sideTokens(side: LinearExpr, op?: Operation): Token[] {
  const base = expressionTokens(side);
  if (!op) return base;

  const symbol: Token = { text: operatorSymbol(op), applied: true };

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
    const isBinaryOperator = OPERATOR_TEXTS.has(token.text) && !token.prefix && !token.denominator;
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
export function formatSideWithOperation(side: LinearExpr, op: Operation): string {
  return tokensToText(sideTokens(side, op));
}

/** The whole equation with the operation written on both sides, before simplifying. */
export function formatAppliedEquation(eq: Equation, op: Operation): string {
  return `${formatSideWithOperation(eq.left, op)} = ${formatSideWithOperation(eq.right, op)}`;
}

/** The amount of an operation: `5`, `3x`, `x`, `−2` or `1/2`. */
export function formatAmount(op: Operation): string {
  const magnitude = abs(op.amount);
  const sign = isNegative(op.amount) ? MINUS : "";
  if (op.withVariable) {
    const coefficient = isOne(magnitude) ? "" : formatFraction(magnitude);
    return `${sign}${coefficient}x`;
  }
  return formatFraction(op.amount);
}

/** A short symbol-and-number label such as `− 5` or `÷ 2`. */
export function operationLabel(op: Operation): string {
  const amount = isNegative(op.amount) ? `(${formatAmount(op)})` : formatAmount(op);
  return `${operatorSymbol(op)} ${amount}`;
}

/** A lower-case sentence fragment such as `subtract 5 from both sides`. */
export function operationPhrase(op: Operation): string {
  const amount = formatAmount(op);
  switch (op.kind) {
    case "add":
      return `add ${amount} to both sides`;
    case "subtract":
      return `subtract ${amount} from both sides`;
    case "multiply":
      return `multiply both sides by ${amount}`;
    case "divide":
      return `divide both sides by ${amount}`;
  }
}

/** A gerund phrase for use as a sentence subject, such as `Subtracting 5 from both sides`. */
export function operationGerund(op: Operation): string {
  const amount = formatAmount(op);
  switch (op.kind) {
    case "add":
      return `Adding ${amount} to both sides`;
    case "subtract":
      return `Subtracting ${amount} from both sides`;
    case "multiply":
      return `Multiplying both sides by ${amount}`;
    case "divide":
      return `Dividing both sides by ${amount}`;
  }
}

/** A sentence-case version of {@link operationPhrase}, such as `Subtract 5 from both sides`. */
export function describeOperation(op: Operation): string {
  const phrase = operationPhrase(op);
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** Rewrites maths text so that screen readers pronounce it sensibly. */
export function toSpeech(text: string): string {
  return text
    .replace(/(\d|x)\/(\d)/g, "$1 over $2")
    .replace(/=/g, " equals ")
    .replace(new RegExp(MINUS, "g"), " minus ")
    .replace(new RegExp(TIMES, "g"), " times ")
    .replace(new RegExp(DIVIDE, "g"), " divided by ")
    .replace(/\+/g, " plus ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}
