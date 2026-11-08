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
  type OperationKind,
  type OperationProblem,
} from "./operations";
import { hasNoVariable, terminalState } from "./solve";
import {
  MINUS,
  formatAppliedEquation,
  formatEquation,
  formatExpression,
  formatFraction,
  formatSideWithOperation,
  operationGerund,
  operationPhrase,
} from "./format";

/* -------------------------------------------------------------------------- */
/* Measuring progress                                                         */
/* -------------------------------------------------------------------------- */

/** Moves needed to undo a coefficient: 0 for x, 1 for 3x or x/3, 2 for 2x/3. */
function coefficientCost(coefficient: Fraction): number {
  if (isOne(coefficient)) return 0;
  return isInteger(coefficient) || isUnitFraction(coefficient) ? 1 : 2;
}

type Side = "left" | "right";

/**
 * Moves still needed if x is to end up alone on `target`:
 *  - one move if there is an x term on the other side,
 *  - one move if there is a constant next to x,
 *  - one or two moves to undo the coefficient of x.
 * If collecting the x terms makes x vanish, only the collecting move remains.
 */
function costForTarget(eq: Equation, target: Side): number {
  const near = eq[target];
  const far = eq[target === "left" ? "right" : "left"];
  const misplacedVariable = isZero(far.x) ? 0 : 1;
  const coefficient = sub(near.x, far.x);

  if (isZero(coefficient)) return misplacedVariable;
  return misplacedVariable + (isZero(near.c) ? 0 : 1) + coefficientCost(coefficient);
}

/**
 * How many moves an equation still needs along its shortest route.
 * A solved equation (or one where x has vanished) has distance 0.
 */
export function distanceToSolved(eq: Equation): number {
  if (hasNoVariable(eq)) return 0;
  return Math.min(costForTarget(eq, "left"), costForTarget(eq, "right"));
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
  if (!isZero(before.left.x) && !isZero(before.right.x)) {
    return (["left", "right"] as const).some((target) => costForTarget(after, target) < costForTarget(before, target));
  }
  return distanceToSolved(after) < distanceToSolved(before);
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

export type Goal = "collect-variable" | "remove-constant" | "remove-coefficient";

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
  // A coefficient such as 2/3 needs two moves: multiply by 3, then divide by 2.
  return { goal: "remove-coefficient", operation: operation("multiply", a.d) };
}

/** Numbers worth trying, taken from the equation itself. */
export function candidateOperations(eq: Equation): Operation[] {
  const found = new Map<string, Operation>();
  const remember = (op: Operation) => {
    found.set(`${op.kind}|${op.withVariable}|${op.amount.n}/${op.amount.d}`, op);
  };

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

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The side that still contains x when it lives on exactly one side. */
function variableSideOf(eq: Equation): LinearExpr {
  return isZero(eq.right.x) ? eq.left : eq.right;
}

/** `+ 5` or `− 4`: the constant attached to x. */
function attachedConstantText(constant: Fraction): string {
  return `${isNegative(constant) ? MINUS : "+"} ${formatFraction(abs(constant))}`;
}

/** Plain words for what has been done to x, e.g. "multiplied by 2" or "divided by 3". */
function coefficientWords(coefficient: Fraction): string {
  if (isUnitFraction(coefficient)) {
    return `divided by ${isNegative(coefficient) ? MINUS : ""}${coefficient.d}`;
  }
  return `multiplied by ${formatFraction(coefficient)}`;
}

function sideWork(side: LinearExpr, after: LinearExpr, op: Operation): string {
  return `${formatSideWithOperation(side, op)} = ${formatExpression(after)}`;
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

const PRAISE = ["Nice choice!", "Exactly right!", "That works!", "Well spotted!", "Good thinking!"] as const;

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

function explainWhy(step: AppliedStep): { why: string; note?: string } {
  const { before, operation: op, after } = step;

  if (op.kind === "add" || op.kind === "subtract") {
    if (op.withVariable) {
      const removed = cancelledVariable(before, after);
      if (removed) {
        const term = formatExpression(expr(removed.x, 0));
        return {
          why: `${capitalise(operationGerund(op))} cancels the ${term} on one side, so the x-terms now end up on a single side.`,
        };
      }
    } else {
      const removed = cancelledConstant(before, after);
      if (removed) {
        const amount = formatFraction(abs(removed.c));
        return {
          why: isNegative(removed.c)
            ? `The ${attachedConstantText(removed.c)} is subtracted. Adding is the inverse of subtracting, so ${MINUS} ${amount} and + ${amount} cancel each other out.`
            : `The ${attachedConstantText(removed.c)} is added. Subtracting is the inverse of adding, so + ${amount} and ${MINUS} ${amount} cancel each other out.`,
        };
      }
    }
    return { why: "This keeps both sides equal and moves the equation closer to x = a number." };
  }

  const variableSide = isZero(before.left.x) ? before.right : before.left;
  const coefficient = variableSide.x;
  const signNote = isNegative(op.amount)
    ? "Multiplying or dividing by a negative number flips the sign of every term."
    : undefined;
  const orderNote = isZero(variableSide.c)
    ? undefined
    : "Undoing the multiplication or division first also works here. Many people undo the + or − first because it keeps the numbers simple.";
  const note = [signNote, orderNote].filter(Boolean).join(" ") || undefined;

  const cancelsCoefficient = isOne(after.left.x) || isOne(after.right.x);
  if (cancelsCoefficient) {
    return {
      why:
        op.kind === "divide"
          ? `x is ${coefficientWords(coefficient)}. Dividing is the inverse of multiplying, so dividing by ${formatFraction(op.amount)} leaves x on its own.`
          : `x is ${coefficientWords(coefficient)}. Multiplying is the inverse of dividing, so multiplying by ${formatFraction(op.amount)} leaves x on its own.`,
      note,
    };
  }
  return { why: "This keeps both sides equal and makes the equation simpler.", note };
}

/** Explains a move that was accepted. `stepIndex` only varies the encouragement. */
export function explainStep(step: AppliedStep, stepIndex = 0): StepExplanation {
  const { before, operation: op, after } = step;
  const { why, note } = explainWhy(step);
  return {
    title: PRAISE[((stepIndex % PRAISE.length) + PRAISE.length) % PRAISE.length],
    why,
    leftWork: sideWork(before.left, after.left, op),
    rightWork: sideWork(before.right, after.right, op),
    note,
  };
}

/** What to do next after a step has been simplified. */
export function describeNextStep(eq: Equation): string {
  const state = terminalState(eq);
  if (state === "solved") {
    const value = isOne(eq.left.x) ? eq.right.c : eq.left.c;
    return `x is on its own, so x = ${formatFraction(value)}${isOne(eq.right.x) ? ` (${formatEquation(eq)} means the same as x = ${formatFraction(value)})` : ""}. Check it by putting it back into the original equation.`;
  }
  if (state === "no-solution") {
    return `x has disappeared, and ${formatEquation(eq)} is never true. No value of x can work, so this equation has no solution.`;
  }
  if (state === "infinite-solutions") {
    return `x has disappeared, and ${formatEquation(eq)} is always true. Every value of x works, so there are infinitely many solutions.`;
  }

  const suggestion = suggestNextMove(eq);
  if (!suggestion) return "";
  switch (suggestion.goal) {
    case "collect-variable":
      return "Next: x is still on both sides, so collect the x-terms on one side.";
    case "remove-constant":
      return "Next: there is still a number added to or subtracted from the x-term. Undo it.";
    case "remove-coefficient":
      return `Next: x is still ${coefficientWords(variableSideOf(eq).x)}. Undo that with the inverse operation.`;
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
  title: string,
  message: string,
  step: AppliedStep,
): MoveEvaluation {
  return {
    verdict: "not-helpful",
    reason,
    severity,
    title,
    message,
    preview: { applied: formatAppliedEquation(step.before, step.operation), result: formatEquation(step.after) },
  };
}

/**
 * Judges an operation on the current equation.
 *
 * @param stepIndex only used to vary the praise shown for good moves.
 */
export function evaluateMove(eq: Equation, op: Operation, stepIndex = 0): MoveEvaluation {
  const outcome = applyOperation(eq, op);
  if (!outcome.ok) return { verdict: "invalid", problem: outcome.problem };

  const { step } = outcome;
  const { after } = step;

  if (equalsEquation(eq, after)) {
    return notHelpful(
      "no-change",
      "warning",
      "That changes nothing",
      "Adding or subtracting 0, or multiplying or dividing by 1, leaves the equation exactly as it was. Choose an amount that brings x closer to being alone.",
      step,
    );
  }

  const analysis = analyseCandidates(eq);

  if (makesProgress(eq, after)) {
    if (analysis.tidyMoveExists && !isTidy(after)) {
      return notHelpful(
        "awkward",
        "warning",
        "Allowed, but it gets messy",
        `${operationGerund(op)} is a valid move, but it leaves fractions: ${formatEquation(after)}. Whole numbers are easier to work with. Try a move that keeps the numbers whole, which often means dealing with a number added to or subtracted from x first.`,
        step,
      );
    }
    return { verdict: "helpful", step, explanation: explainStep(step, stepIndex) };
  }

  // A valid move that does not help. Work out the most useful thing to say.
  const recommended = analysis.recommended;

  const reversed = recommended.find((rec) => operationsEqual(inverseOperation(rec), op));
  if (reversed) {
    const additive = op.kind === "add" || op.kind === "subtract";
    return notHelpful(
      "wrong-direction",
      "error",
      "Almost — try the opposite operation",
      additive
        ? `${operationGerund(op)} keeps the equation balanced, but it adds to the problem instead of cancelling it. To cancel a term, do the opposite of what it does.`
        : `${operationGerund(op)} keeps the equation balanced, but it does even more of what was done to x. To undo multiplying, divide; to undo dividing, multiply.`,
      step,
    );
  }

  const sameKind = recommended.filter((rec) => rec.kind === op.kind);
  if (sameKind.some((rec) => rec.withVariable !== op.withVariable && equals(rec.amount, op.amount))) {
    return notHelpful(
      "wrong-term",
      "error",
      "Check what you are cancelling",
      op.withVariable
        ? "The term you want to cancel is a plain number, with no x. Try again without the x."
        : "The term you want to remove contains x, so the amount you use needs an x as well.",
      step,
    );
  }

  if (sameKind.some((rec) => rec.withVariable === op.withVariable)) {
    return notHelpful(
      "wrong-amount",
      "error",
      "Right idea, different number",
      "That is the right kind of move, but the number is not the one attached to x, so nothing cancels. Look closely at the number you want to remove.",
      step,
    );
  }

  if (distanceToSolved(after) > distanceToSolved(eq)) {
    return notHelpful(
      "moves-away",
      "warning",
      "That makes it harder",
      `The equation stays balanced, but x ends up further from being alone. Think about what is attached to x and how to undo it${recommended.some((rec) => !sameFamily(rec, op)) ? " — a different kind of operation may be needed" : ""}.`,
      step,
    );
  }

  return notHelpful(
    "no-progress",
    "warning",
    "Balanced, but not helpful",
    "Both sides are still equal, but x is no closer to being alone. Think about what is attached to x and which operation undoes it.",
    step,
  );
}

/* -------------------------------------------------------------------------- */
/* Hints                                                                      */
/* -------------------------------------------------------------------------- */

export type HintSet = readonly [string, string, string];

const KIND_LABEL: Record<OperationKind, string> = {
  add: "Add",
  subtract: "Subtract",
  multiply: "Multiply",
  divide: "Divide",
};

/** Tells the learner which controls to use, matching the labels in the workspace. */
function howToEnter(op: Operation): string {
  const amount = formatFraction(op.amount);
  return op.withVariable
    ? `Choose “${KIND_LABEL[op.kind]}”, type ${amount} and turn on the x button.`
    : `Choose “${KIND_LABEL[op.kind]}” and type ${amount}.`;
}

/**
 * Three progressively stronger hints for the current equation, or `null`
 * when there is nothing left to do.
 *
 *  1. A nudge about what is in the way.
 *  2. The inverse operation to use.
 *  3. A worked explanation of the exact move.
 */
export function getHints(eq: Equation): HintSet | null {
  const suggestion = suggestNextMove(eq);
  if (!suggestion) return null;

  const result = applyOperation(eq, suggestion.operation);
  if (!result.ok) return null;
  const { after } = result.step;
  const op = suggestion.operation;

  const worked = `Try this: ${operationPhrase(op)}. Left side: ${sideWork(eq.left, after.left, op)}. Right side: ${sideWork(eq.right, after.right, op)}. ${howToEnter(op)}`;

  switch (suggestion.goal) {
    case "collect-variable":
      return [
        "x appears on both sides. First, get all the x-terms onto one side of the equals sign.",
        `Choose one x-term to remove. Removing the smaller one keeps the remaining x-term positive. ${
          op.kind === "subtract" ? "It is added on its side, so subtract it from both sides." : "It is subtracted on its side, so add it to both sides."
        }`,
        worked,
      ];
    case "remove-constant": {
      const constant = variableSideOf(eq).c;
      return [
        "Look at the side with x. Is a number being added or subtracted there? That number is in the way of getting x alone.",
        isNegative(constant)
          ? `The number is subtracted (${attachedConstantText(constant)}). Subtraction is undone by addition, so use the opposite operation.`
          : `The number is added (${attachedConstantText(constant)}). Addition is undone by subtraction, so use the opposite operation.`,
        worked,
      ];
    }
    case "remove-coefficient": {
      const coefficient = variableSideOf(eq).x;
      return [
        "Now x is multiplied or divided by a number. Which operation would undo that?",
        isUnitFraction(coefficient)
          ? `x is ${coefficientWords(coefficient)}. Division is undone by multiplication, so multiply both sides by that number.`
          : `x is ${coefficientWords(coefficient)}. Multiplication is undone by division, so divide both sides by that number.`,
        worked,
      ];
    }
  }
}
