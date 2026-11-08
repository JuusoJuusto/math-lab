/**
 * Realistic algebra mistakes, produced from a correct solution.
 *
 * These power two things: the plausible wrong answers in multiple-choice
 * tasks, and the wrong line in "find the mistake". Because they come from real
 * errors (forgetting a side, using the wrong sign, slipping in the arithmetic)
 * the distractors are the answers a learner would actually arrive at.
 */

import {
  add,
  applyOperation,
  applyOperationToSide,
  frac,
  inverseOperation,
  isZero,
  sameSolution,
  solveEquation,
  solvedValue,
  type AppliedStep,
  type Equation,
  type Fraction,
  type Rng,
} from "../equations";

export type Corruption = "wrong-sign" | "one-side" | "arithmetic";

export const CORRUPTIONS: readonly Corruption[] = ["wrong-sign", "one-side", "arithmetic"];

/**
 * What a learner would write after one faulty step.
 *
 * - `wrong-sign`  the left side is done correctly, the right side gets the opposite operation
 * - `one-side`    the operation is only done on the left side
 * - `arithmetic`  the operation is right, but the number on the right is off by a little
 *
 * Returns `null` when the faulty line would be correct after all.
 */
export function corruptStep(step: AppliedStep, kind: Corruption, rng: Rng): Equation | null {
  const { before, operation: op, after } = step;
  let result: Equation;

  switch (kind) {
    case "wrong-sign":
      result = { left: after.left, right: applyOperationToSide(before.right, inverseOperation(op)) };
      break;
    case "one-side":
      result = { left: after.left, right: before.right };
      break;
    case "arithmetic": {
      const delta = [-2, -1, 1, 2][Math.floor(rng() * 4)];
      result = { left: after.left, right: { x: after.right.x, c: add(after.right.c, frac(delta)) } };
      break;
    }
  }

  // The faulty line must really be wrong, otherwise there would be no mistake to find.
  return sameSolution(solveEquation(before), solveEquation(result)) ? null : result;
}

/** Carries on from a faulty line with the remaining correct operations. */
export function continueWith(state: Equation, steps: readonly AppliedStep[]): Equation[] {
  const lines: Equation[] = [];
  let current = state;
  for (const step of steps) {
    const next = applyOperation(current, step.operation);
    if (!next.ok) break;
    current = next.step.after;
    lines.push(current);
  }
  return lines;
}

function constantSide(eq: Equation): Fraction | null {
  if (isZero(eq.left.x) && !isZero(eq.right.x)) return eq.left.c;
  if (isZero(eq.right.x) && !isZero(eq.left.x)) return eq.right.c;
  return null;
}

/**
 * Whole numbers a learner might wrongly arrive at, most plausible first:
 * stopping one step early, each kind of faulty step carried through to the end,
 * the answer with the wrong sign, and finally numbers close to the answer.
 */
export function plausibleWrongValues(steps: readonly AppliedStep[], solution: number, rng: Rng): number[] {
  const found: number[] = [];
  const remember = (value: Fraction | null) => {
    if (value && value.d === 1 && value.n !== solution && Math.abs(value.n) <= 999 && !found.includes(value.n)) {
      found.push(value.n);
    }
  };

  const last = steps[steps.length - 1];
  if (last) remember(constantSide(last.before));

  steps.forEach((step, index) => {
    for (const kind of CORRUPTIONS) {
      const faulty = corruptStep(step, kind, rng);
      if (!faulty) continue;
      const rest = continueWith(faulty, steps.slice(index + 1));
      remember(solvedValue(rest.length ? rest[rest.length - 1] : faulty));
    }
  });

  if (solution !== 0) remember(frac(-solution));
  for (const delta of [1, -1, 2, -2, 3]) remember(frac(solution + delta));
  return found;
}
