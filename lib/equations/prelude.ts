/**
 * The first moves of a harder equation: writing it out in simple form.
 *
 * Equations such as `3(x − 2) = 2x + 5` or `x/2 + x/3 = 5` are not yet in the
 * form the balance moves work on. Finnish teaching starts with that clean-up:
 *
 *   1. open the brackets (sulut auki): multiply every term inside by the number outside,
 *   2. simplify each side (sievennä): combine like terms and fractions.
 *
 * Each of these is a small question with plausible wrong answers, so the
 * learner practises exactly the places where signs and fractions go wrong. The
 * prelude is derived from the authored equation text, and a test checks that
 * following it always ends at the equation the engine parsed.
 */

import { add, frac, isZero, mul, type Fraction } from "./fraction";
import { equation as makeEquation, expr, scaleExpr, type Equation, type LinearExpr } from "./expression";
import { formatEquation, formatExpression, MINUS } from "./format";
import { parseEquation, parseExpression } from "./parse";
import { createRng, shuffle } from "./rng";

export type PreludeKind = "expand" | "simplify" | "decimals";

/** Why a wrong option is wrong. The tutor explains each reason in the learner's language. */
export type WrongReason = "forgot-term" | "sign" | "denominators" | "arithmetic" | "decimal-term" | "decimal-point";

export interface PreludeOption {
  readonly text: string;
  /** `null` for the right answer. */
  readonly reason: WrongReason | null;
}

export interface PreludeStep {
  readonly kind: PreludeKind;
  /** The part of the equation to work on, as it is shown: `3(x − 2)` or `x/2 + x/3`. */
  readonly part: string;
  /** What it becomes: `3x − 6`. */
  readonly result: string;
  /** The right answer and three wrong ones, shuffled. */
  readonly options: readonly PreludeOption[];
  readonly correct: number;
  /** The whole equation once this step is done: `3x − 6 = 2x + 5`. */
  readonly after: string;
  /** For the decimals step: what every term is multiplied by (10 or 100). */
  readonly factor?: number;
}

export interface Prelude {
  /** The equation as written, with true minus signs. */
  readonly source: string;
  readonly steps: readonly PreludeStep[];
}

const show = (text: string) => text.replace(/-/g, MINUS);
const plain = (text: string) => text.replace(/[−–]/g, "-");

function hash(text: string): number {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return (value >>> 0) % 2147483647 || 1;
}

function formatted(a: Fraction, c: Fraction): string {
  return formatExpression(expr(a, c));
}

function parsed(text: string): LinearExpr {
  const result = parseExpression(text);
  if (!result.ok) throw new Error(`Cannot read "${text}": ${result.message}`);
  return result.value;
}

/** Splits one side into its terms at the top level: `x/2 - 3 + x` gives three terms. */
export function splitTerms(side: string): string[] {
  const terms: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of plain(side).replace(/\s+/g, "")) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if ((char === "+" || char === "-") && depth === 0 && current !== "") {
      terms.push(current);
      current = char === "-" ? "-" : "";
    } else {
      current += char;
    }
  }
  if (current !== "") terms.push(current);
  return terms;
}

/** Up to three distinct wrong options, each with the reason it is wrong. */
function pickWrong(correctText: string, candidates: readonly (readonly [string, WrongReason])[]): PreludeOption[] {
  const seen = new Set([correctText]);
  const options: PreludeOption[] = [];
  for (const [text, reason] of candidates) {
    if (seen.has(text)) continue;
    seen.add(text);
    options.push({ text, reason });
    if (options.length === 3) break;
  }
  return options;
}

function arrange(seed: string, correctText: string, wrong: readonly PreludeOption[]): { options: PreludeOption[]; correct: number } {
  const options = shuffle([{ text: correctText, reason: null } as PreludeOption, ...wrong], createRng(hash(seed)));
  return { options, correct: options.findIndex((option) => option.reason === null) };
}

/**
 * `3(x − 2)`, `-2(x - 3)`, `(x + 1)/2`, and any of them after a minus: `- 2(x + 4)`.
 * Groups: 1 a minus between terms, 2 the number outside, 3 what is inside, 4 what is inside a division, 5 the divisor.
 */
const BRACKET = /(-\s+)?(?:(-?\d+)\(([^()]*)\)|\(([^()]*)\)\/(\d+))/;

function expandStep(part: string, whole: string): PreludeStep {
  const match = part.match(BRACKET)!;
  const between = match[1] !== undefined ? -1 : 1;
  const base = match[2] !== undefined ? frac(Number(match[2])) : frac(1, Number(match[5]));
  const factor = mul(frac(between), base);
  const inner = parsed(match[3] ?? match[4]);
  const resultText = formatExpression(parsed(part));

  const a = inner.x;
  const b = inner.c;
  const times = (value: Fraction) => mul(factor, value);
  const minus = frac(-1);
  const one = frac(1);
  const candidates: [string, WrongReason][] = [
    // Only the first term is multiplied: 3(x − 2) = 3x − 2.
    [formatted(times(a), b), "forgot-term"],
    // Only the number is multiplied: 3(x − 2) = x − 6.
    [formatted(a, times(b)), "forgot-term"],
    // The sign of the number is lost: 3(x − 2) = 3x + 6.
    [formatted(times(a), mul(minus, times(b))), "sign"],
    // The number outside is added instead of multiplied: 3(x − 2) = 3x + 1.
    [formatted(times(a), add(factor, b)), "arithmetic"],
    [formatted(mul(minus, times(a)), times(b)), "sign"],
    // Slips of one, so there are always enough options.
    [formatted(times(a), add(times(b), one)), "arithmetic"],
    [formatted(times(a), add(times(b), minus)), "arithmetic"],
  ];

  const { options, correct } = arrange(`${whole}|${part}`, resultText, pickWrong(resultText, candidates));
  return { kind: "expand", part: show(part), result: resultText, options, correct, after: "" };
}

function simplifyStep(part: string, whole: string): PreludeStep {
  const value = parsed(part);
  const resultText = formatExpression(value);
  const terms = splitTerms(part).map((term) => parsed(term));
  const xTerms = terms.filter((term) => !isZero(term.x));
  const constants = terms.filter((term) => isZero(term.x));

  const candidates: [string, WrongReason][] = [];
  // Fractions added by adding the tops and the bottoms: 1/2 + 1/3 = 2/5.
  if (xTerms.length >= 2 && xTerms.every((term) => term.x.d > 1)) {
    const top = xTerms.reduce((sum, term) => sum + term.x.n, 0);
    const bottom = xTerms.reduce((sum, term) => sum + term.x.d, 0);
    candidates.push([formatted(frac(top, bottom), value.c), "denominators"]);
  }
  // Constants added without their signs: 6 − 4 = 10.
  const absolute = constants.reduce((sum, term) => sum + Math.abs(term.c.n / term.c.d), 0);
  if (constants.length >= 2 && Number.isInteger(absolute)) candidates.push([formatted(value.x, frac(absolute)), "arithmetic"]);
  if (!isZero(value.c)) candidates.push([formatted(value.x, frac(-value.c.n, value.c.d)), "sign"]);
  if (!isZero(value.x)) candidates.push([formatted(frac(-value.x.n, value.x.d), value.c), "sign"]);
  // A number that is off by one: a slip in the arithmetic.
  candidates.push([formatted(value.x, frac(value.c.n + value.c.d, value.c.d)), "arithmetic"]);
  candidates.push([formatted(value.x, frac(value.c.n - value.c.d, value.c.d)), "arithmetic"]);
  if (value.x.d === 1) candidates.push([formatted(frac(value.x.n + 1), value.c), "arithmetic"]);
  else candidates.push([formatted(frac(value.x.n + 1, value.x.d), value.c), "arithmetic"]);

  const wrong = pickWrong(resultText, candidates);
  const { options, correct } = arrange(`${whole}|${part}`, resultText, wrong);
  return { kind: "simplify", part: show(part), result: resultText, options, correct, after: "" };
}

/** True when the written side has more terms than its simple form, so there is something to simplify. */
function needsSimplifying(side: string): boolean {
  const value = parsed(side);
  const simple = (isZero(value.x) ? 0 : 1) + (isZero(value.c) ? 0 : 1);
  return splitTerms(side).length > Math.max(simple, 1);
}


/* -------------------------------------------------------------------------- */
/* Decimals                                                                   */
/* -------------------------------------------------------------------------- */

const DECIMAL = /\d[.,]\d/;

/** True when the equation is written with decimal numbers, such as `0.5x + 1.2 = 3.7`. */
export function hasDecimals(source: string): boolean {
  return DECIMAL.test(plain(source));
}

/** The most digits after a decimal point: 1 for `0.5`, 2 for `0.25`. */
function decimalPlaces(source: string): number {
  let most = 0;
  for (const match of plain(source).matchAll(/\d*[.,](\d+)/g)) most = Math.max(most, match[1].length);
  return most;
}

/** 10 for one decimal place, 100 for two: the number that turns every decimal into a whole number. */
export function decimalFactor(source: string): number {
  const places = decimalPlaces(source);
  if (places < 1 || places > 3) throw new Error(`Cannot remove the decimals of "${source}"`);
  return 10 ** places;
}

/** A number written the way a learner writes it: `1.2`, `3`, `0.25`. */
function numberText(value: Fraction): string {
  return value.d === 1 ? String(value.n) : String(value.n / value.d);
}

/** One side of an equation written out with decimals where there are any: `1.5x − 2`. */
function sideText(x: Fraction, c: Fraction): string {
  const xText = isZero(x) ? "" : x.n === x.d ? "x" : x.n === -x.d ? "-x" : `${numberText(x)}x`;
  if (xText === "") return numberText(c);
  if (isZero(c)) return xText;
  return `${xText} ${c.n < 0 ? "-" : "+"} ${numberText(frac(Math.abs(c.n), c.d))}`;
}

function decimalsStep(source: string): PreludeStep {
  const parsedEquation = preludeParse(source);
  const factor = decimalFactor(source);
  const scale = frac(factor);
  const scaled = makeEquation(scaleExpr(parsedEquation.left, scale), scaleExpr(parsedEquation.right, scale));
  const resultText = formatEquation(scaled);

  const { left, right } = parsedEquation;
  const times = (value: Fraction) => mul(value, scale);
  const one = frac(1);
  const make = (lx: Fraction, lc: Fraction, rx: Fraction, rc: Fraction): string => show(`${sideText(lx, lc)} = ${sideText(rx, rc)}`);
  const [lx, lc, rx, rc] = [times(left.x), times(left.c), times(right.x), times(right.c)];

  const candidates: [string, WrongReason][] = [];
  // A term that was left as it was written: only the decimals were multiplied.
  if (!isZero(left.c)) candidates.push([make(lx, left.c, rx, rc), "decimal-term"]);
  if (!isZero(left.x)) candidates.push([make(left.x, lc, rx, rc), "decimal-term"]);
  if (!isZero(right.c)) candidates.push([make(lx, lc, rx, right.c), "decimal-term"]);
  if (!isZero(right.x)) candidates.push([make(lx, lc, right.x, rc), "decimal-term"]);
  // The point moved one place too far on one term.
  if (!isZero(left.c)) candidates.push([make(lx, mul(lc, frac(10)), rx, rc), "decimal-point"]);
  if (!isZero(right.c)) candidates.push([make(lx, lc, rx, mul(rc, frac(10))), "decimal-point"]);
  if (!isZero(left.x)) candidates.push([make(mul(lx, frac(10)), lc, rx, rc), "decimal-point"]);
  // A sign lost, and a slip of one.
  if (!isZero(left.c)) candidates.push([make(lx, mul(lc, frac(-1)), rx, rc), "sign"]);
  if (!isZero(left.c)) candidates.push([make(lx, add(lc, one), rx, rc), "arithmetic"]);
  if (!isZero(right.c)) candidates.push([make(lx, lc, rx, add(rc, one)), "arithmetic"]);

  const { options, correct } = arrange(`decimals|${source}`, resultText, pickWrong(resultText, candidates));
  return { kind: "decimals", part: show(plain(source).replace(/\s+/g, " ").trim()), result: resultText, options, correct, after: resultText, factor };
}

/** The equation read exactly, with decimals as fractions (0.5 is 1/2). */
function preludeParse(source: string): Equation {
  const result = parseEquation(source);
  if (!result.ok) throw new Error(`Cannot read "${source}": ${result.message}`);
  return result.value;
}

/**
 * The equation the balance moves start from. Usually that is the equation
 * itself. An equation written with decimals starts from the same equation with
 * every term multiplied by 10 or 100, which is what the clean-up question asks.
 */
export function startEquation(source: string): Equation {
  const equation = preludeParse(source);
  if (!hasDecimals(source)) return equation;
  const scale = frac(decimalFactor(source));
  return makeEquation(scaleExpr(equation.left, scale), scaleExpr(equation.right, scale));
}

/**
 * The questions that lead from an equation as written to the one the balance
 * moves start from. Brackets are opened first, left to right, then each side
 * that is still written out is simplified. Equations that are already in simple
 * form have no prelude.
 */
export function makePrelude(source: string): Prelude {
  const written = plain(source).replace(/\s+/g, " ").trim();
  // Decimals come first and need one question: multiply every term by 10 or 100.
  if (hasDecimals(written)) return { source: show(written), steps: [decimalsStep(written)] };
  const steps: PreludeStep[] = [];
  let current = written;

  const apply = (step: PreludeStep, part: string, result: string): void => {
    // A part that stood after a minus goes back after a minus or a plus: "6x - 3 - 2(x + 4)" becomes "6x - 3 - 2x - 8".
    const between = /^-\s+/.test(part);
    const flat = plain(result);
    const put = between ? (flat.startsWith("-") ? `- ${flat.slice(1).trim()}` : `+ ${flat}`) : flat;
    current = current.replace(part, put);
    steps.push({ ...step, after: show(current) });
  };

  // 1. Open the brackets.
  for (let guard = 0; guard < 8; guard += 1) {
    const match = current.match(new RegExp(BRACKET.source));
    if (!match) break;
    const part = match[0];
    const step = expandStep(part, written);
    apply(step, part, step.result);
  }

  // 2. Simplify each side that is still written out.
  const [left, right] = current.split("=").map((side) => side.trim());
  for (const side of [left, right]) {
    if (side !== undefined && side !== "" && needsSimplifying(side)) {
      const step = simplifyStep(side, written);
      apply(step, side, step.result);
    }
  }

  return { source: show(written), steps };
}

/** The equation the prelude ends at, for checking against the parser. */
export function preludeTarget(source: string): Equation {
  return startEquation(source);
}

/** A number multiplying a bracket: in `3(x − 2)` the factor is 3 and the terms are x and −2. */
export interface Distribution {
  readonly factor: string;
  readonly terms: readonly string[];
}

/**
 * Reads a part such as `3(x − 2)`, `−2(x − 3)` or `− 2(x + 4)` for the arrows
 * textbooks draw from the number to each term inside the bracket. A minus in
 * front of the whole product belongs to the factor (`− 2(x + 4)` multiplies by
 * −2). Anything else, such as a division `(x + 1)/2`, has no arrows.
 */
export function distributionOf(part: string): Distribution | null {
  const match = plain(part).replace(/\s+/g, "").match(/^(-?)(-?\d+)\(([^()]+)\)$/);
  if (!match) return null;
  const [, front, digits, inside] = match;
  const factor = (front ? -1 : 1) * Number(digits);
  const terms = splitTerms(inside);
  if (terms.length === 0 || terms.length > 3) return null;
  const minus = (text: string) => text.replace(/-/g, "−");
  return { factor: minus(String(factor)), terms: terms.map(minus) };
}
