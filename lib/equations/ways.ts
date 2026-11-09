/**
 * Two ways to solve the same equation ("Tapa 1" and "Tapa 2").
 *
 * Finnish textbooks point out that the steps of a solution do not have to come
 * in one fixed order: `4x − 1 = x − 7` can start by taking x away from both
 * sides or by adding 1, and both end at x = −2. The tutor already accepts
 * every move that makes progress, so this only *shows* a second route.
 *
 * Both routes are produced by the engine, never written by hand: the first
 * follows the tutor's own suggestions, the second begins with a different
 * move the tutor also recommends and then follows its suggestions. A route is
 * only returned when it really ends with x alone.
 */

import type { Equation } from "./expression";
import { applyOperation, operationsEqual, type AppliedStep } from "./operations";
import { isSolved } from "./solve";
import { recommendedMoves, suggestNextMove } from "./tutor";

export interface Way {
  readonly steps: readonly AppliedStep[];
}

const LIMIT = 12;

function follow(start: Equation, firstMove?: AppliedStep): Way | null {
  const steps: AppliedStep[] = [];
  let current = start;

  if (firstMove) {
    steps.push(firstMove);
    current = firstMove.after;
  }

  while (!isSolved(current)) {
    if (steps.length >= LIMIT) return null;
    const next = suggestNextMove(current);
    if (!next) return null;
    const result = applyOperation(current, next.operation);
    if (!result.ok) return null;
    steps.push(result.step);
    current = result.step.after;
  }
  return { steps };
}

function sameRoute(a: Way, b: Way): boolean {
  return a.steps.length === b.steps.length && a.steps.every((step, index) => operationsEqual(step.operation, b.steps[index].operation));
}

/**
 * The tutor's route, and, when one exists, a second route that starts with a
 * different recommended move. An equation that can only be solved in one
 * order (`2x + 5 = 17` still has two: subtract 5 first, or divide by 2 first)
 * returns a single way when nothing else is recommended.
 */
export function waysToSolve(start: Equation): readonly Way[] {
  const first = follow(start);
  if (!first) return [];

  const ways: Way[] = [first];
  for (const move of recommendedMoves(start)) {
    if (operationsEqual(move, first.steps[0].operation)) continue;
    const applied = applyOperation(start, move);
    if (!applied.ok) continue;
    const other = follow(start, applied.step);
    if (other && !sameRoute(first, other)) {
      ways.push(other);
      break;
    }
  }
  return ways;
}
