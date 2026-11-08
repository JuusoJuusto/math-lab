/**
 * Which kinds of task make sense for which topic.
 *
 * "Which step?" and "find the mistake" rely on the solver's operations, so they
 * are limited to topics that use them. Brackets would need an "expand" step,
 * so they get solving, checking and multiple choice instead.
 */

import type { TaskKind } from "./types";

/** Easiest to hardest, used to order exam practice. */
export const TOPIC_ORDER = ["basics", "one-step", "two-step", "both", "brackets", "proportion", "word"] as const;

const ALL: readonly string[] = TOPIC_ORDER;

export const KIND_TOPICS: Record<TaskKind, readonly string[]> = {
  bank: ALL,
  choose: ["basics", "one-step", "two-step", "both", "brackets"],
  solve: ["one-step", "two-step", "both", "brackets", "proportion", "word"],
  check: ["basics", "one-step", "two-step", "both", "brackets"],
  step: ["one-step", "two-step", "both"],
  mistake: ["two-step", "both"],
  equation: ["word"],
};

export function supports(kind: TaskKind, topic: string): boolean {
  return KIND_TOPICS[kind].includes(topic);
}

/** Position of a topic from easy (0) to hard. Unknown topics sort last. */
export function difficultyOf(topic: string): number {
  const index = TOPIC_ORDER.indexOf(topic as (typeof TOPIC_ORDER)[number]);
  return index === -1 ? TOPIC_ORDER.length : index;
}
