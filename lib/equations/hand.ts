/**
 * Solving by hand: the learner writes every line of the solution themselves.
 *
 * There are no buttons to press and no numbers to pick, so what was typed has
 * to be judged. A new line is accepted when it follows from the line above by
 * one thing done to both sides (or by flipping a term, which is the same thing
 * written shorter), or when it is the same equation tidied up (brackets opened,
 * like terms put together). It is told apart from the lines that are not:
 *
 *   ok          follows from the line above in one step
 *   tidy        the same equation, written more simply
 *   same        nothing new: the line above again
 *   skips       a true line, but more than one step away: write the steps one at a time
 *   wrong       a different equation: it has a different solution
 *   unreadable  cannot be read as an equation
 *
 * Nothing here knows the answer is x = 6. The judgement only compares what was
 * typed with what each possible single step gives, so a correct but unexpected
 * route is accepted as readily as the tutor's own.
 */

import type { Lang } from "../lang";
import { frac } from "./fraction";
import { equalsEquation, type Equation } from "./expression";
import { formatEquation } from "./format";
import { mirror, readWritten, type WrittenProblem } from "./build";
import { applyOperation, operation, type Operation } from "./operations";
import { sameSolution, solveEquation } from "./solve";
import { candidateOperations } from "./tutor";

export type LineVerdict =
  | { readonly kind: "ok"; readonly equation: Equation; readonly operation: Operation }
  | { readonly kind: "tidy"; readonly equation: Equation }
  | { readonly kind: "same" }
  | { readonly kind: "skips" }
  | { readonly kind: "wrong" }
  | { readonly kind: "unreadable"; readonly problem: WrittenProblem };

/** Every single step worth trying: the tutor's candidates, small numbers, and multiples of x. */
function stepsToTry(eq: Equation): Operation[] {
  const found = new Map<string, Operation>();
  const remember = (op: Operation) => found.set(`${op.kind}|${op.withVariable}|${op.amount.n}/${op.amount.d}`, op);
  for (const op of candidateOperations(eq)) remember(op);
  for (let n = 1; n <= 40; n += 1) {
    remember(operation("add", n));
    remember(operation("subtract", n));
  }
  for (let n = 1; n <= 12; n += 1) {
    remember(operation("add", n, true));
    remember(operation("subtract", n, true));
  }
  for (let n = 2; n <= 20; n += 1) {
    remember(operation("multiply", n));
    remember(operation("divide", n));
  }
  remember(operation("multiply", -1));
  remember(operation("divide", -1));
  for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]) {
    remember(operation("divide", -n));
    remember(operation("multiply", -n));
  }
  return [...found.values()];
}

/** The equation without a `|| − 5` note at the end, which learners may write as in a notebook. */
export function withoutNote(text: string): string {
  const at = text.indexOf("||");
  return (at === -1 ? text : text.slice(0, at)).trim();
}

/**
 * Judges one typed line against the line above it.
 *
 * `aboveIsSimple` says whether the line above is already written in its simplest
 * form. A line that is merely that equation again is "same" then, but "tidy"
 * when the line above still has brackets or fractions to deal with.
 */
export function judgeLine(above: Equation, typed: string, aboveIsSimple: boolean, lang: Lang = "en"): LineVerdict {
  const read = readWritten(withoutNote(typed));
  if (!read.ok) return { kind: "unreadable", problem: read.problem };
  const line = read.equation;

  if (equalsEquation(line, above)) return aboveIsSimple ? { kind: "same" } : { kind: "tidy", equation: line };
  if (equalsEquation(line, mirror(above))) return { kind: "same" };

  for (const step of stepsToTry(above)) {
    const result = applyOperation(above, step, lang);
    if (!result.ok) continue;
    const after = result.step.after;
    if (equalsEquation(after, line) || equalsEquation(mirror(after), line)) return { kind: "ok", equation: line, operation: step };
  }

  return sameSolution(solveEquation(above), solveEquation(line)) ? { kind: "skips" } : { kind: "wrong" };
}

/** True when an equation is written the way the engine writes it, so there is nothing left to tidy. */
export function isWrittenSimply(text: string, eq: Equation): boolean {
  const compact = (value: string) => value.replace(/\s+/g, "").replace(/[−–]/g, "-").replace(/,/g, ".").toLowerCase();
  return compact(withoutNote(text)) === compact(formatEquation(eq));
}

/** `x = 6` is the end of a solution; so is `6 = x`. */
export { isSolved as isFinishedLine } from "./solve";

/** A note written beside a line, such as `|| − 5` or `|| : 2`, read as the step it names, or `null`. */
export function readNote(text: string): Operation | null {
  const at = text.indexOf("||");
  if (at === -1) return null;
  const note = text
    .slice(at + 2)
    .replace(/[−–]/g, "-")
    .replace(/[·×]/g, "*")
    .replace(/[÷:]/g, "/")
    .replace(/\s+/g, "");
  const match = note.match(/^([+\-*/])(-?)(\d+)(x?)$/);
  if (!match) return null;
  const [, sign, negative, digits, withX] = match;
  const amount = frac((negative ? -1 : 1) * Number(digits));
  const kind = sign === "+" ? "add" : sign === "-" ? "subtract" : sign === "*" ? "multiply" : "divide";
  if (withX && (kind === "multiply" || kind === "divide")) return null;
  return operation(kind, amount, withX === "x");
}
