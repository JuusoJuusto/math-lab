/**
 * The state machine behind the interactive workspace.
 *
 * It is a pure reducer with no React or DOM code, so every learning
 * interaction (apply, simplify, hint, undo, check) can be unit tested.
 *
 * A step has two visible moments, which is what makes "the same operation on
 * both sides" concrete for learners:
 *   1. apply     the operation is written on both sides: 2x + 5 − 5 = 17 − 5
 *   2. simplify  the learner collapses it into the next equation: 2x = 12
 */

import type { Equation } from "./expression";
import { formatEquation } from "./format";
import { operationKey, type AppliedStep, type Operation } from "./operations";
import { solvedValue, terminalState, type TerminalState } from "./solve";
import { describeNextStep, evaluateMove, type MovePreview, type StepExplanation } from "./tutor";
import type { Fraction } from "./fraction";

export type NoticeTone = "success" | "error" | "warning" | "info";

/** A message for the feedback panel. */
export interface Notice {
  readonly tone: NoticeTone;
  readonly title: string;
  /** Short paragraphs of explanation. */
  readonly body: readonly string[];
  /** Lines of working, such as the arithmetic on each side. */
  readonly work?: readonly string[];
  /** What a rejected move would have produced. */
  readonly preview?: MovePreview;
}

export interface StepRecord extends AppliedStep {
  readonly explanation: StepExplanation;
}

export type HintLevel = 0 | 1 | 2 | 3;

export interface SessionState {
  /** The equation the exercise started with. */
  readonly start: Equation;
  readonly current: Equation;
  /** Completed (simplified) steps. */
  readonly steps: readonly StepRecord[];
  /** A step that has been applied but not yet simplified. */
  readonly pending: StepRecord | null;
  readonly notice: Notice | null;
  readonly hintLevel: HintLevel;
  /** Hints revealed over the whole exercise (survives undo and restart). */
  readonly hintsUsed: number;
  /** Clear mis-steps over the whole exercise (survives undo and restart). */
  readonly mistakes: number;
  readonly lastRejected: string | null;
  readonly outcome: "solving" | TerminalState;
  /** True once the learner has verified the answer by substitution. */
  readonly checked: boolean;
}

export type SessionAction =
  | { readonly type: "apply"; readonly operation: Operation }
  | { readonly type: "simplify" }
  | { readonly type: "hint" }
  | { readonly type: "undo" }
  | { readonly type: "restart" }
  | { readonly type: "check" };

export function createSession(start: Equation): SessionState {
  return {
    start,
    current: start,
    steps: [],
    pending: null,
    notice: null,
    hintLevel: 0,
    hintsUsed: 0,
    mistakes: 0,
    lastRejected: null,
    outcome: terminalState(start) ?? "solving",
    checked: false,
  };
}

/** The value of x once the equation is solved, otherwise `null`. */
export function solutionOf(state: SessionState): Fraction | null {
  return state.outcome === "solved" ? solvedValue(state.current) : null;
}

export function canUndo(state: SessionState): boolean {
  return state.pending !== null || state.steps.length > 0;
}

export function canGetHint(state: SessionState): boolean {
  return state.outcome === "solving" && state.pending === null && state.hintLevel < 3;
}

function terminalNotice(outcome: TerminalState, equation: Equation): Notice {
  if (outcome === "solved") {
    return { tone: "success", title: "x is on its own!", body: [describeNextStep(equation)] };
  }
  return {
    tone: "info",
    title: outcome === "no-solution" ? "This equation has no solution" : "This equation has infinitely many solutions",
    body: [describeNextStep(equation)],
  };
}

function applyMove(state: SessionState, operation: Operation): SessionState {
  const evaluation = evaluateMove(state.current, operation, state.steps.length);
  const key = operationKey(operation);

  if (evaluation.verdict === "helpful") {
    const { explanation } = evaluation;
    return {
      ...state,
      pending: { ...evaluation.step, explanation },
      hintLevel: 0,
      lastRejected: null,
      notice: {
        tone: "success",
        title: explanation.title,
        body: [explanation.why, ...(explanation.note ? [explanation.note] : [])],
        work: [`Left side: ${explanation.leftWork}`, `Right side: ${explanation.rightWork}`],
      },
    };
  }

  // The same rejected choice twice in a row gets a shorter, kinder message.
  if (state.lastRejected === key) {
    return {
      ...state,
      notice: {
        tone: "warning",
        title: "You have tried that one already",
        body: ["Look at what is attached to x, or use the hint button if you would like some help."],
      },
    };
  }

  if (evaluation.verdict === "invalid") {
    return {
      ...state,
      mistakes: state.mistakes + 1,
      lastRejected: key,
      notice: { tone: "error", title: evaluation.problem.title, body: [evaluation.problem.message] },
    };
  }

  return {
    ...state,
    mistakes: state.mistakes + (evaluation.severity === "error" ? 1 : 0),
    lastRejected: key,
    notice: {
      tone: evaluation.severity,
      title: evaluation.title,
      body: [evaluation.message],
      preview: evaluation.preview,
    },
  };
}

function simplifyPending(state: SessionState): SessionState {
  const { pending } = state;
  if (!pending) return state;

  const current = pending.after;
  const terminal = terminalState(current);
  return {
    ...state,
    current,
    steps: [...state.steps, pending],
    pending: null,
    outcome: terminal ?? "solving",
    lastRejected: null,
    notice: terminal
      ? terminalNotice(terminal, current)
      : { tone: "info", title: `Now we have ${formatEquation(current)}`, body: [describeNextStep(current)] },
  };
}

function undoLast(state: SessionState): SessionState {
  if (state.pending) {
    return { ...state, pending: null, notice: null, lastRejected: null };
  }
  const last = state.steps[state.steps.length - 1];
  if (!last) return state;
  return {
    ...state,
    current: last.before,
    steps: state.steps.slice(0, -1),
    outcome: terminalState(last.before) ?? "solving",
    hintLevel: 0,
    lastRejected: null,
    notice: null,
    checked: false,
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "apply":
      return state.outcome === "solving" && state.pending === null ? applyMove(state, action.operation) : state;
    case "simplify":
      return simplifyPending(state);
    case "hint":
      return canGetHint(state)
        ? { ...state, hintLevel: (state.hintLevel + 1) as HintLevel, hintsUsed: state.hintsUsed + 1 }
        : state;
    case "undo":
      return undoLast(state);
    case "restart":
      return { ...createSession(state.start), hintsUsed: state.hintsUsed, mistakes: state.mistakes };
    case "check":
      return state.outcome === "solved" ? { ...state, checked: true } : state;
  }
}
