/**
 * The tutor: judging a learner's move, explaining it and giving hints.
 *
 * Rather than comparing a move with one scripted answer, the tutor measures
 * how far an equation is from being solved (`distanceToSolved`) and accepts
 * any valid move that gets closer. That means every sensible route is
 * welcome: collecting x on the left or the right, removing the constant
 * first, or dividing first when every term divides evenly.
 *
 * Moves are sorted into three groups:
 *   - invalid       not allowed mathematically (divide by zero, multiply by 0, ...)
 *   - not helpful   allowed and balanced, but it does not move towards x = ...
 *                   (these are explained and are NOT applied, so the learner
 *                   stays on track and never has to untangle a mess)
 *   - helpful       applied, with an explanation of why it works
 */

import type { Lang } from "../lang";
import {
  abs,
  compare,
  equals,
  isInteger,
  isNegative,
  isOne,
  isUnitFraction,
  isZero,
  sub,
  type Fraction,
} from "./fraction";
import { equalsEquation, expr, type Equation, type LinearExpr } from "./expression";
import {
  applyOperation,
  inverseOperation,
  operation,
  operationsEqual,
  type AppliedStep,
  type Operation,
  type OperationProblem,
} from "./operations";
import { hasNoVariable, isSolved, terminalState } from "./solve";
import {
  MINUS,
  formatAmount,
  formatAppliedEquation,
  formatEquation,
  formatExpression,
  formatFraction,
  formatSideWithOperation,
  operationPhrase,
} from "./format";
import { engineText, type EngineText } from "./text";

/* -------------------------------------------------------------------------- */
/* Measuring progress                                                         */
/* -------------------------------------------------------------------------- */

/** Moves needed to undo a coefficient: 0 for x, 1 for anything else (3x, x/3 or 2x/3). */
function coefficientCost(coefficient: Fraction): number {
  return isOne(coefficient) ? 0 : 1;
}

/**
 * True when the equation still has fractions that should be cleared by
 * multiplying through. A finished answer such as x = 3/7 does not count: a
 * fraction is a perfectly good answer.
 */
function needsClearing(eq: Equation): boolean {
  return !isTidy(eq) && !isSolved(eq);
}

/** The smallest number that turns every fraction of an equation into a whole number. */
export function commonDenominator(eq: Equation): number {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  let lcm = 1;
  for (const value of [eq.left.x, eq.left.c, eq.right.x, eq.right.c]) lcm = (lcm / gcd(lcm, value.d)) * value.d;
  return lcm;
}

type Side = "left" | "right";

/**
 * Moves still needed if x is to end up alone on `target`:
 *  - one move if there is an x term on the other side,
 *  - one move if there is a constant next to x,
 *  - one or two moves to undo the coefficient of x.
 * If collecting the x terms makes x vanish, only the collecting move remains.
 */
function costForTarget(eq: Equation, target: Side, clearingCounts = true): number {
  const near = eq[target];
  const far = eq[target === "left" ? "right" : "left"];
  const misplacedVariable = isZero(far.x) ? 0 : 1;
  const coefficient = sub(near.x, far.x);
  // Fractions other than x/3 are cleared first, by multiplying through (one move).
  const clearing = clearingCounts && needsClearing(eq) ? 1 : 0;

  if (isZero(coefficient)) return misplacedVariable + clearing;
  return misplacedVariable + (isZero(near.c) ? 0 : 1) + coefficientCost(coefficient) + clearing;
}

/**
 * How many moves an equation still needs along its shortest route.
 * A solved equation (or one where x has vanished) has distance 0.
 */
export function distanceToSolved(eq: Equation, clearingCounts = true): number {
  if (hasNoVariable(eq)) return 0;
  return Math.min(costForTarget(eq, "left", clearingCounts), costForTarget(eq, "right", clearingCounts));
}

/**
 * Whether going from `before` to `after` is a step in the right direction.
 *
 * With x on one side there is one sensible route, so progress means the
 * shortest route got shorter. With x on both sides there are several equally
 * good routes (keep x on the left or on the right, remove constants first or
 * last), so a move is progress when it advances *any* of them. Otherwise a
 * perfectly valid textbook step could be wrongly judged as unhelpful just
 * because another route happens to be one move shorter.
 */
function makesProgress(before: Equation, after: Equation): boolean {
  if (hasNoVariable(after)) return !hasNoVariable(before);
  // Clearing fractions only counts as a move when the equation has fractions to clear to begin with.
  // A tidy equation that becomes untidy (dividing 2x + 5 = 17 by 2) is judged on the old terms.
  const clearing = needsClearing(before);
  if (!isZero(before.left.x) && !isZero(before.right.x)) {
    return (["left", "right"] as const).some((target) => costForTarget(after, target, clearing) < costForTarget(before, target, clearing));
  }
  return distanceToSolved(after, clearing) < distanceToSolved(before, clearing);
}

/**
 * True when every constant is a whole number and every x coefficient is a
 * whole number or a unit fraction such as x/3. "Tidy" equations are the ones
 * lower-secondary learners are expected to handle comfortably.
 */
export function isTidy(eq: Equation): boolean {
  return [eq.left, eq.right].every(
    (side) => isInteger(side.c) && (isZero(side.x) || isInteger(side.x) || isUnitFraction(side.x)),
  );
}

/* -------------------------------------------------------------------------- */
/* Suggestions                                                                */
/* -------------------------------------------------------------------------- */

export type Goal = "clear-fractions" | "collect-variable" | "remove-constant" | "remove-coefficient";

export interface Suggestion {
  readonly goal: Goal;
  readonly operation: Operation;
}

/** The operation that cancels `term` when it is added to a side. */
function cancel(term: Fraction, withVariable: boolean): Operation {
  return isNegative(term) ? operation("add", abs(term), withVariable) : operation("subtract", term, withVariable);
}

/**
 * The single most natural next move, or `null` when the equation is finished.
 *
 * Order of work: collect x on one side, then remove the constant next to x,
 * then undo the coefficient. This is the "reverse order of operations" idea
 * taught in the two-step level.
 */
export function suggestNextMove(eq: Equation): Suggestion | null {
  if (terminalState(eq) !== null) return null;
  const { left, right } = eq;

  // Fractions first: multiply both sides by the common denominator so everything is whole.
  if (needsClearing(eq)) return { goal: "clear-fractions", operation: operation("multiply", commonDenominator(eq)) };

  if (!isZero(left.x) && !isZero(right.x)) {
    // Remove the smaller x term so the remaining coefficient stays positive.
    const removeFromRight = compare(left.x, right.x) >= 0;
    return { goal: "collect-variable", operation: cancel(removeFromRight ? right.x : left.x, true) };
  }

  const side = isZero(right.x) ? left : right;
  if (!isZero(side.c)) {
    return { goal: "remove-constant", operation: cancel(side.c, false) };
  }

  const a = side.x;
  if (isUnitFraction(a)) {
    return { goal: "remove-coefficient", operation: operation("multiply", isNegative(a) ? -a.d : a.d) };
  }
  if (isInteger(a)) {
    return { goal: "remove-coefficient", operation: operation("divide", a) };
  }
  // Unreachable for tidy equations, but kept total: clear the denominator.
  return { goal: "remove-coefficient", operation: operation("multiply", a.d) };
}

/** Numbers worth trying, taken from the equation itself. */
export function candidateOperations(eq: Equation): Operation[] {
  const found = new Map<string, Operation>();
  const remember = (op: Operation) => {
    found.set(`${op.kind}|${op.withVariable}|${op.amount.n}/${op.amount.d}`, op);
  };

  const lcm = commonDenominator(eq);
  if (lcm > 1 && lcm <= 999) remember(operation("multiply", lcm));

  for (const side of [eq.left, eq.right]) {
    if (!isZero(side.c)) {
      remember(operation("add", abs(side.c)));
      remember(operation("subtract", abs(side.c)));
    }
    if (!isZero(side.x)) {
      remember(operation("add", abs(side.x), true));
      remember(operation("subtract", abs(side.x), true));

      const factors: number[] = [];
      if (side.x.d > 1) factors.push(side.x.d);
      if (commonDenominator(eq) > 1 && !factors.includes(commonDenominator(eq))) factors.push(commonDenominator(eq));
      if (Math.abs(side.x.n) > 1) factors.push(Math.abs(side.x.n));
      factors.push(1);
      for (const factor of factors) {
        for (const signed of factor === 1 ? [-1] : [factor, -factor]) {
          remember(operation("multiply", signed));
          remember(operation("divide", signed));
        }
      }
    }
  }
  return [...found.values()];
}

interface CandidateAnalysis {
  /** Moves that make progress and keep the numbers tidy where possible. */
  readonly recommended: readonly Operation[];
  /** True when a tidy, progress-making move exists. */
  readonly tidyMoveExists: boolean;
}

function analyseCandidates(eq: Equation): CandidateAnalysis {
  const progressing: AppliedStep[] = [];

  for (const candidate of candidateOperations(eq)) {
    const result = applyOperation(eq, candidate);
    if (result.ok && makesProgress(eq, result.step.after)) progressing.push(result.step);
  }

  const tidy = progressing.filter((step) => isTidy(step.after));
  const tidyMoveExists = isTidy(eq) && tidy.length > 0;
  return {
    tidyMoveExists,
    recommended: (tidyMoveExists ? tidy : progressing).map((step) => step.operation),
  };
}

/** Every operation worth recommending right now (the first is the tutor's pick). */
export function recommendedMoves(eq: Equation): Operation[] {
  const suggestion = suggestNextMove(eq);
  const all = [...analyseCandidates(eq).recommended];
  if (!suggestion) return all;
  return [suggestion.operation, ...all.filter((op) => !operationsEqual(op, suggestion.operation))];
}

/**
 * Follows the tutor's suggestions until the equation is finished.
 * Used for worked examples and to prove that every exercise is solvable.
 */
export function solveWithTutor(eq: Equation, maxSteps = 12): AppliedStep[] {
  const steps: AppliedStep[] = [];
  let current = eq;
  for (let i = 0; i < maxSteps; i += 1) {
    const suggestion = suggestNextMove(current);
    if (!suggestion) break;
    const result = applyOperation(current, suggestion.operation);
    if (!result.ok) break;
    steps.push(result.step);
    current = result.step.after;
  }
  return steps;
}

/* -------------------------------------------------------------------------- */
/* Wording helpers                                                            */
/* -------------------------------------------------------------------------- */

/** The side that still contains x when it lives on exactly one side. */
function variableSideOf(eq: Equation): LinearExpr {
  return isZero(eq.right.x) ? eq.left : eq.right;
}

/** `+ 5` or `− 4`: the constant attached to x. */
function attachedConstantText(constant: Fraction): string {
  return `${isNegative(constant) ? MINUS : "+"} ${formatFraction(abs(constant))}`;
}

/** Plain words for what has been done to x, e.g. "multiplied by 2" or "divided by 3". */
function coefficientWords(coefficient: Fraction, text: EngineText): string {
  if (isUnitFraction(coefficient)) {
    return text.tutor.dividedBy(`${isNegative(coefficient) ? MINUS : ""}${coefficient.d}`);
  }
  return text.tutor.multipliedBy(formatFraction(coefficient));
}

function sideWork(side: LinearExpr, after: LinearExpr, op: Operation, lang: Lang): string {
  return `${formatSideWithOperation(side, op, lang)} = ${formatExpression(after)}`;
}

/* -------------------------------------------------------------------------- */
/* Explaining good moves                                                      */
/* -------------------------------------------------------------------------- */

export interface StepExplanation {
  /** A short, varied word of encouragement. */
  readonly title: string;
  /** Why this move is valid and what it cancels. */
  readonly why: string;
  /** What happened to the left side, e.g. `2x + 5 − 5 = 2x`. */
  readonly leftWork: string;
  /** What happened to the right side, e.g. `17 − 5 = 12`. */
  readonly rightWork: string;
  /** An optional extra remark, for example about signs or an alternative route. */
  readonly note?: string;
}

function cancelledConstant(before: Equation, after: Equation): LinearExpr | null {
  for (const key of ["left", "right"] as const) {
    if (!isZero(before[key].c) && isZero(after[key].c)) return before[key];
  }
  return null;
}

function cancelledVariable(before: Equation, after: Equation): LinearExpr | null {
  for (const key of ["left", "right"] as const) {
    if (!isZero(before[key].x) && isZero(after[key].x)) return before[key];
  }
  return null;
}

function explainWhy(step: AppliedStep, lang: Lang): { why: string; note?: string } {
  const text = engineText(lang);
  const { before, operation: op, after } = step;

  if (op.kind === "add" || op.kind === "subtract") {
    if (op.withVariable) {
      const removed = cancelledVariable(before, after);
      if (removed) {
        const term = formatExpression(expr(removed.x, 0));
        return { why: text.tutor.cancelsVariable(op.kind, formatAmount(op), term) };
      }
    } else {
      const removed = cancelledConstant(before, after);
      if (removed) {
        const amount = formatFraction(abs(removed.c));
        const attached = attachedConstantText(removed.c);
        return {
          why: isNegative(removed.c) ? text.tutor.cancelsSubtracted(attached, amount) : text.tutor.cancelsAdded(attached, amount),
        };
      }
    }
    return { why: text.tutor.staysEqual };
  }

  // Multiplying through to clear the fractions is explained as that, whatever else it also cancels.
  if (op.kind === "multiply" && !isTidy(before) && isTidy(after)) {
    return { why: text.tutor.clearsFractions(formatFraction(op.amount)) };
  }

  const variableSide = isZero(before.left.x) ? before.right : before.left;
  const coefficient = variableSide.x;
  const signNote = isNegative(op.amount) ? text.tutor.negativeNote : undefined;
  const orderNote = isZero(variableSide.c) ? undefined : text.tutor.orderNote;
  const note = [signNote, orderNote].filter(Boolean).join(" ") || undefined;

  const cancelsCoefficient = isOne(after.left.x) || isOne(after.right.x);
  if (cancelsCoefficient) {
    const words = coefficientWords(coefficient, text);
    const amount = formatFraction(op.amount);
    return {
      why: op.kind === "divide" ? text.tutor.undoDivide(words, amount) : text.tutor.undoMultiply(words, amount),
      note,
    };
  }
  return { why: text.tutor.simpler, note };
}

/** Explains a move that was accepted. `stepIndex` only varies the encouragement. */
export function explainStep(step: AppliedStep, stepIndex = 0, lang: Lang = "en"): StepExplanation {
  const { before, operation: op, after } = step;
  const { why, note } = explainWhy(step, lang);
  const praise = engineText(lang).tutor.praise;
  return {
    title: praise[((stepIndex % praise.length) + praise.length) % praise.length],
    why,
    leftWork: sideWork(before.left, after.left, op, lang),
    rightWork: sideWork(before.right, after.right, op, lang),
    note,
  };
}

/** What to do next after a step has been simplified. */
export function describeNextStep(eq: Equation, lang: Lang = "en"): string {
  const text = engineText(lang);
  const state = terminalState(eq);
  if (state === "solved") {
    const value = formatFraction(isOne(eq.left.x) ? eq.right.c : eq.left.c);
    return text.tutor.solved(value, isOne(eq.right.x) ? formatEquation(eq) : null);
  }
  if (state === "no-solution") return text.tutor.noSolution(formatEquation(eq));
  if (state === "infinite-solutions") return text.tutor.infinite(formatEquation(eq));

  const suggestion = suggestNextMove(eq);
  if (!suggestion) return "";
  switch (suggestion.goal) {
    case "clear-fractions":
      return text.tutor.nextClear;
    case "collect-variable":
      return text.tutor.nextCollect;
    case "remove-constant":
      return text.tutor.nextConstant;
    case "remove-coefficient":
      return text.tutor.nextCoefficient(coefficientWords(variableSideOf(eq).x, text));
  }
}

/* -------------------------------------------------------------------------- */
/* Judging a move                                                             */
/* -------------------------------------------------------------------------- */

export type NotHelpfulReason =
  | "no-change"
  | "wrong-direction"
  | "wrong-amount"
  | "wrong-term"
  | "awkward"
  | "no-progress"
  | "moves-away";

export interface MovePreview {
  /** The operation written on both sides, e.g. `2x + 5 + 5 = 17 + 5`. */
  readonly applied: string;
  /** The simplified result, e.g. `2x + 10 = 22`. */
  readonly result: string;
}

export type MoveEvaluation =
  | { readonly verdict: "invalid"; readonly problem: OperationProblem }
  | {
      readonly verdict: "not-helpful";
      readonly reason: NotHelpfulReason;
      /** `error` for clear mis-steps, `warning` for valid moves that simply do not help. */
      readonly severity: "error" | "warning";
      readonly title: string;
      readonly message: string;
      readonly preview: MovePreview;
    }
  | { readonly verdict: "helpful"; readonly step: AppliedStep; readonly explanation: StepExplanation };

const sameFamily = (a: Operation, b: Operation) =>
  (a.kind === "add" || a.kind === "subtract") === (b.kind === "add" || b.kind === "subtract");

function notHelpful(
  reason: NotHelpfulReason,
  severity: "error" | "warning",
  wording: { readonly title: string; readonly message: string },
  step: AppliedStep,
  lang: Lang,
): MoveEvaluation {
  return {
    verdict: "not-helpful",
    reason,
    severity,
    title: wording.title,
    message: wording.message,
    preview: { applied: formatAppliedEquation(step.before, step.operation, lang), result: formatEquation(step.after) },
  };
}

/**
 * Judges an operation on the current equation.
 *
 * @param stepIndex only used to vary the praise shown for good moves.
 */
export function evaluateMove(eq: Equation, op: Operation, stepIndex = 0, lang: Lang = "en"): MoveEvaluation {
  const text = engineText(lang).tutor;
  const outcome = applyOperation(eq, op, lang);
  if (!outcome.ok) return { verdict: "invalid", problem: outcome.problem };

  const { step } = outcome;
  const { after } = step;
  const amount = formatAmount(op);

  if (equalsEquation(eq, after)) return notHelpful("no-change", "warning", text.noChange, step, lang);

  const analysis = analyseCandidates(eq);

  if (makesProgress(eq, after)) {
    // The tutor never calls its own suggestion awkward. Collecting 7x and x/2 gives 13x/2, which is untidy, but it is the
    // move the tutor suggests, and the fraction is cleared next.
    const suggestion = suggestNextMove(eq);
    const suggested = suggestion !== null && operationsEqual(suggestion.operation, op);
    if (analysis.tidyMoveExists && !isTidy(after) && !suggested) {
      return notHelpful("awkward", "warning", text.awkward(op.kind, amount, formatEquation(after)), step, lang);
    }
    return { verdict: "helpful", step, explanation: explainStep(step, stepIndex, lang) };
  }

  // A valid move that does not help. Work out the most useful thing to say.
  const recommended = analysis.recommended;

  const reversed = recommended.find((rec) => operationsEqual(inverseOperation(rec), op));
  if (reversed) {
    const additive = op.kind === "add" || op.kind === "subtract";
    return notHelpful(
      "wrong-direction",
      "error",
      additive ? text.wrongDirectionAdditive(op.kind, amount) : text.wrongDirectionMultiplicative(op.kind, amount),
      step,
      lang,
    );
  }

  const sameKind = recommended.filter((rec) => rec.kind === op.kind);
  if (sameKind.some((rec) => rec.withVariable !== op.withVariable && equals(rec.amount, op.amount))) {
    return notHelpful("wrong-term", "error", op.withVariable ? text.wrongTermNumber : text.wrongTermVariable, step, lang);
  }

  if (sameKind.some((rec) => rec.withVariable === op.withVariable)) {
    return notHelpful("wrong-amount", "error", text.wrongAmount, step, lang);
  }

  if (distanceToSolved(after) > distanceToSolved(eq)) {
    return notHelpful("moves-away", "warning", text.movesAway(recommended.some((rec) => !sameFamily(rec, op))), step, lang);
  }

  return notHelpful("no-progress", "warning", text.noProgress, step, lang);
}

/* -------------------------------------------------------------------------- */
/* Hints                                                                      */
/* -------------------------------------------------------------------------- */

export type HintSet = readonly [string, string, string];

/**
 * Three progressively stronger hints for the current equation, or `null`
 * when there is nothing left to do.
 *
 *  1. A nudge about what is in the way.
 *  2. The inverse operation to use.
 *  3. A worked explanation of the exact move, and the flip shortcut.
 */
export function getHints(eq: Equation, lang: Lang = "en"): HintSet | null {
  const suggestion = suggestNextMove(eq);
  if (!suggestion) return null;

  const result = applyOperation(eq, suggestion.operation, lang);
  if (!result.ok) return null;
  const { after } = result.step;
  const op = suggestion.operation;
  const text = engineText(lang);
  const t = text.tutor;

  // The number to type; the x button is turned on separately, so this is not "4x".
  const howTo = t.howToEnter(text.kindNames[op.kind], formatFraction(op.amount), op.withVariable);
  const worked = t.worked(
    operationPhrase(op, lang),
    sideWork(eq.left, after.left, op, lang),
    sideWork(eq.right, after.right, op, lang),
    howTo,
  );

  switch (suggestion.goal) {
    case "clear-fractions":
      return [t.hintClear1, t.hintClear2(formatFraction(op.amount)), worked];
    case "collect-variable":
      return [t.hintCollect1, t.hintCollect2(op.kind === "subtract"), worked];
    case "remove-constant": {
      const constant = variableSideOf(eq).c;
      return [t.hintConstant1, t.hintConstant2(isNegative(constant), attachedConstantText(constant)), worked];
    }
    case "remove-coefficient": {
      const coefficient = variableSideOf(eq).x;
      return [t.hintCoefficient1, t.hintCoefficient2(isUnitFraction(coefficient), coefficientWords(coefficient, text)), worked];
    }
  }
}
