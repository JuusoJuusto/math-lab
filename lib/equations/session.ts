/**
 * The state machine behind the interactive workspace.
 *
 * It is a pure reducer with no React or DOM code, so every learning
 * interaction (apply, simplify, hint, undo, check) can be unit tested.
 *
 * A step has two visible moments, which is what makes "the same operation on
 * both sides" concrete for learners:
 *   1. apply     the operation is written on both sides: 2x + 5 − 5 = 17 − 5
 *                (or, for a flip, the term has crossed over: 2x = 17 − 5)
 *   2. simplify  the learner collapses it into the next equation: 2x = 12
 *
 * A flip is the same step in a shorter form (see flip.ts), so both ways of
 * moving share the validation, the tutor and the history.
 */

import type { Lang } from "../lang";
import { expr, type Equation } from "./expression";
import { evaluateFlip, flipOperation, formatFlipPreview, type FlipTarget } from "./flip";
import { formatBar, formatEquation } from "./format";
import { operationKey, type AppliedStep, type Operation } from "./operations";
import type { Prelude, PreludeStep } from "./prelude";
import { isSolution, solvedValue, terminalState, type TerminalState } from "./solve";
import { engineText } from "./text";
import { preludeWords } from "./prelude-words";
import {
  describeNextStep,
  evaluateMove,
  type MoveEvaluation,
  type MovePreview,
  type StepExplanation,
} from "./tutor";
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
  /** Present when the step was made by flipping a term across the equals sign. */
  readonly flip?: FlipTarget;
}

export type HintLevel = 0 | 1 | 2 | 3;

export interface SessionState {
  /** The language of every message in this session. */
  readonly lang: Lang;
  /** The clean-up questions (open brackets, simplify) that come before the balance moves, if the equation has any. */
  readonly prelude: Prelude | null;
  /** How many of the prelude's questions have been answered. */
  readonly preludeIndex: number;
  /** The wrong options already tried on the current prelude question. */
  readonly preludeWrong: readonly number[];
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
  /** The learner found x another way (working backwards). Accepted only when it really is the solution. */
  | { readonly type: "answer"; readonly value: Fraction }
  /** A wrong try in another way of solving, which counts as a mistake. */
  | { readonly type: "miss" }
  /** Answer the current prelude question by choosing one of its options. */
  | { readonly type: "prelude"; readonly choice: number }
  | { readonly type: "apply"; readonly operation: Operation }
  /** Flip a term across the equals sign. */
  | { readonly type: "flip"; readonly target: FlipTarget }
  | { readonly type: "simplify" }
  | { readonly type: "hint" }
  | { readonly type: "undo" }
  | { readonly type: "restart" }
  | { readonly type: "check" };

export function createSession(start: Equation, lang: Lang = "en", prelude: Prelude | null = null): SessionState {
  return {
    lang,
    prelude: prelude && prelude.steps.length > 0 ? prelude : null,
    preludeIndex: 0,
    preludeWrong: [],
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

/** The prelude question waiting to be answered, or `null` once the equation is in simple form. */
export function currentPreludeStep(state: SessionState): PreludeStep | null {
  return state.prelude?.steps[state.preludeIndex] ?? null;
}

/** The equation as it is written right now, while the prelude is being worked through. */
export function preludeShown(state: SessionState): string | null {
  if (!state.prelude || state.preludeIndex >= state.prelude.steps.length) return null;
  return state.preludeIndex === 0 ? state.prelude.source : state.prelude.steps[state.preludeIndex - 1].after;
}

export function canUndo(state: SessionState): boolean {
  return currentPreludeStep(state) === null && (state.pending !== null || state.steps.length > 0);
}

export function canGetHint(state: SessionState): boolean {
  return state.outcome === "solving" && state.pending === null && currentPreludeStep(state) === null && state.hintLevel < 3;
}

function terminalNotice(outcome: TerminalState, equation: Equation, lang: Lang): Notice {
  const text = engineText(lang).session;
  if (outcome === "solved") {
    return { tone: "success", title: text.alone, body: [describeNextStep(equation, lang)] };
  }
  return {
    tone: "info",
    title: outcome === "no-solution" ? text.noSolution : text.infinite,
    body: [describeNextStep(equation, lang)],
  };
}

/** Turns the tutor's verdict on a move into the next state. */
function resolveMove(state: SessionState, evaluation: MoveEvaluation, key: string, flip?: FlipTarget): SessionState {
  const text = engineText(state.lang);

  if (evaluation.verdict === "helpful") {
    const { explanation } = evaluation;
    const operation = evaluation.step.operation;
    const moved = flip ? formatFlipPreview(state.current, flip, state.lang) : null;
    return {
      ...state,
      pending: { ...evaluation.step, explanation, ...(flip ? { flip } : {}) },
      hintLevel: 0,
      lastRejected: null,
      notice: {
        tone: "success",
        title: explanation.title,
        body: [explanation.why, ...(explanation.note ? [explanation.note] : [])],
        work:
          flip && moved
            ? [text.flip.movedLine(moved), text.flip.sameAs(formatBar(operation, state.lang))]
            : [text.session.leftSide(explanation.leftWork), text.session.rightSide(explanation.rightWork)],
      },
    };
  }

  // The same rejected choice twice in a row gets a shorter, kinder message.
  if (state.lastRejected === key) {
    return {
      ...state,
      notice: { tone: "warning", title: text.session.repeatedTitle, body: [text.session.repeatedBody] },
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

function applyMove(state: SessionState, operation: Operation): SessionState {
  const evaluation = evaluateMove(state.current, operation, state.steps.length, state.lang);
  return resolveMove(state, evaluation, operationKey(operation));
}

function applyFlip(state: SessionState, target: FlipTarget): SessionState {
  const evaluation = evaluateFlip(state.current, target, state.steps.length, state.lang);
  if (!evaluation) return state;
  const operation = flipOperation(state.current, target);
  return resolveMove(state, evaluation, `flip|${operation ? operationKey(operation) : target.kind}`, target);
}

function answerPrelude(state: SessionState, choice: number): SessionState {
  const step = currentPreludeStep(state);
  if (!step || !step.options[choice] || state.preludeWrong.includes(choice)) return state;
  const text = engineText(state.lang);

  if (choice !== step.correct) {
    const reason = step.options[choice].reason ?? "arithmetic";
    return {
      ...state,
      mistakes: state.mistakes + 1,
      preludeWrong: [...state.preludeWrong, choice],
      notice: { tone: "error", title: text.prelude.wrongTitle, body: [text.prelude.wrong[reason]] },
    };
  }

  const index = state.preludeIndex + 1;
  const last = index >= (state.prelude?.steps.length ?? 0);
  return {
    ...state,
    preludeIndex: index,
    preludeWrong: [],
    notice: {
      tone: "success",
      title: text.tutor.praise[(index - 1) % text.tutor.praise.length],
      body: [preludeWords(state.lang).right(step), ...(last ? [text.prelude.done] : [])],
    },
  };
}

/** The learner reached x some other way. If it is the solution, the equation is solved. */
function acceptAnswer(state: SessionState, value: Fraction): SessionState {
  if (!isSolution(state.current, value)) return { ...state, mistakes: state.mistakes + 1 };
  const solved: Equation = { left: expr(1, 0), right: expr(0, value) };
  return {
    ...state,
    current: solved,
    outcome: "solved",
    hintLevel: 0,
    lastRejected: null,
    notice: terminalNotice("solved", solved, state.lang),
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
      ? terminalNotice(terminal, current, state.lang)
      : {
          tone: "info",
          title: engineText(state.lang).session.nowWeHave(formatEquation(current)),
          body: [describeNextStep(current, state.lang)],
        },
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
  // Until the equation is in simple form, only the prelude's questions can be answered.
  if (currentPreludeStep(state) !== null && action.type !== "prelude" && action.type !== "restart") return state;

  switch (action.type) {
    case "prelude":
      return answerPrelude(state, action.choice);
    case "miss":
      return state.outcome === "solving" && state.pending === null ? { ...state, mistakes: state.mistakes + 1 } : state;
    case "answer":
      return state.outcome === "solving" && state.pending === null ? acceptAnswer(state, action.value) : state;
    case "apply":
      return state.outcome === "solving" && state.pending === null ? applyMove(state, action.operation) : state;
    case "flip":
      return state.outcome === "solving" && state.pending === null ? applyFlip(state, action.target) : state;
    case "simplify":
      return simplifyPending(state);
    case "hint":
      return canGetHint(state)
        ? { ...state, hintLevel: (state.hintLevel + 1) as HintLevel, hintsUsed: state.hintsUsed + 1 }
        : state;
    case "undo":
      return undoLast(state);
    case "restart":
      // Starting over keeps the effort so far, and skips the prelude that has already been done.
      return {
        ...createSession(state.start, state.lang),
        prelude: state.prelude,
        preludeIndex: state.prelude?.steps.length ?? 0,
        hintsUsed: state.hintsUsed,
        mistakes: state.mistakes,
      };
    case "check":
      return state.outcome === "solved" ? { ...state, checked: true } : state;
  }
}
