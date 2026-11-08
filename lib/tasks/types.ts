/**
 * Practice tasks: the shapes shared by generators, grading and the interface.
 *
 * A task is never stored. What is stored is its `TaskSpec`, a tiny recipe
 * (kind, topic, seed) from which the identical task is generated again. That is
 * what makes a "fix your mistakes" queue and shareable sessions possible.
 */

import type { Fraction } from "../equations";

export type TaskKind = "bank" | "choose" | "solve" | "check" | "step" | "mistake" | "equation" | "hand";

/** Kinds that count together in the progress overview. */
export type TaskGroup = "quiz" | "solve" | "check" | "step" | "mistake" | "equation";

export interface TaskSpec {
  readonly kind: TaskKind;
  readonly topic: string;
  readonly seed: number;
  /** Only for `bank` tasks: the id of the fixed question. */
  readonly bankId?: string;
}

export interface WorkedLine {
  readonly text: string;
  /** What was supposedly done on this line, e.g. "Subtract 5 from both sides". */
  readonly note?: string;
}

export type TaskDisplay =
  | { readonly type: "equation"; readonly text: string }
  /** Two equations, before and after an unknown operation. */
  | { readonly type: "change"; readonly from: string; readonly to: string }
  /** A worked solution, one line per step. */
  | { readonly type: "lines"; readonly lines: readonly WorkedLine[] };

export type TaskInput =
  | { readonly type: "choice"; readonly options: readonly string[]; readonly correct: number }
  | { readonly type: "number"; readonly unit?: string }
  /** Solve the whole equation by writing every line. `source` is the equation as it is written. */
  | { readonly type: "hand"; readonly source: string };

export interface Task {
  readonly spec: TaskSpec;
  readonly kind: TaskKind;
  readonly topic: string;
  readonly prompt: string;
  readonly display?: TaskDisplay;
  readonly input: TaskInput;
  /** The correct answer, in words the learner can read. */
  readonly answerText: string;
  /** For typed tasks, the exact value that is accepted. */
  readonly answerValue?: Fraction;
  /** For typed tasks, an equation used to show why a wrong answer fails. */
  readonly checkEquation?: string;
  /** Shown after answering: why the answer is what it is. */
  readonly explanation: readonly string[];
}

export interface Grade {
  readonly correct: boolean;
  /** What the learner answered, as text. */
  readonly given: string;
  /** Extra lines for a wrong answer, such as a substitution check. */
  readonly feedback: readonly string[];
}

/** The result of reading a typed answer: a value, or a reason it cannot be used. */
export type ParsedAnswer = { readonly ok: true; readonly value: Fraction } | { readonly ok: false; readonly message: string };

export const TASK_GROUPS: Record<TaskKind, TaskGroup> = {
  bank: "quiz",
  choose: "quiz",
  solve: "solve",
  check: "check",
  step: "step",
  mistake: "mistake",
  equation: "equation",
  // Solving by hand counts with the other ways of solving.
  hand: "solve",
};

export function groupOf(kind: TaskKind): TaskGroup {
  return TASK_GROUPS[kind];
}

/** A stable text key for a spec, used to find it again in the mistake queue. */
export function specKey(spec: TaskSpec): string {
  return `${spec.kind}|${spec.topic}|${spec.seed}|${spec.bankId ?? ""}`;
}
