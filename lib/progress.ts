/**
 * Learner progress, stored only in this browser.
 *
 * Everything here is pure: parsing, serialising and updating. The React hook
 * that connects it to `localStorage` lives in hooks/useProgress.ts.
 *
 * The storage key stays at v1 because every change so far is additive: new
 * fields are optional when reading, and unknown or malformed data falls back
 * to safe defaults instead of throwing.
 */

export const STORAGE_KEY = "mathlab:progress:v1";

export interface Progress {
  /** Topic ids whose multiple-choice practice round has been finished. */
  completed: string[];
  /** Number of multiple-choice answers submitted. */
  attempts: number;
  /** Number of those answers that were correct. */
  correct: number;
  /** Interactive solver levels that have been finished. */
  solverLevels: string[];
}

export const EMPTY_PROGRESS: Progress = Object.freeze({
  completed: [],
  attempts: 0,
  correct: 0,
  solverLevels: [],
}) as Progress;

/**
 * The topic "simple" was split into "one-step" and "two-step". Its three
 * questions were all one-step questions, so earlier progress maps to that.
 */
const LEGACY_TOPIC_IDS: Readonly<Record<string, readonly string[]>> = {
  simple: ["one-step"],
};

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function toIdList(value: unknown, migrate = false): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter((item): item is string => typeof item === "string");
  const migrated = migrate ? ids.flatMap((id) => LEGACY_TOPIC_IDS[id] ?? [id]) : ids;
  return [...new Set(migrated)];
}

/** Reads stored progress, tolerating missing, old or corrupted data. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return EMPTY_PROGRESS;
    const record = data as Record<string, unknown>;
    return {
      completed: toIdList(record.completed, true),
      attempts: toCount(record.attempts),
      correct: Math.min(toCount(record.correct), toCount(record.attempts)),
      solverLevels: toIdList(record.solverLevels),
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function serialiseProgress(progress: Progress): string {
  return JSON.stringify(progress);
}

/** Percentage of answers that were correct, or 0 when nothing has been answered. */
export function accuracyOf(progress: Progress): number {
  return progress.attempts ? Math.round((progress.correct / progress.attempts) * 100) : 0;
}

export function recordAnswer(progress: Progress, wasCorrect: boolean): Progress {
  return {
    ...progress,
    attempts: progress.attempts + 1,
    correct: progress.correct + (wasCorrect ? 1 : 0),
  };
}

export function recordTopicsCompleted(progress: Progress, topicIds: readonly string[]): Progress {
  return { ...progress, completed: [...new Set([...progress.completed, ...topicIds])] };
}

export function recordSolverLevel(progress: Progress, levelId: string): Progress {
  return { ...progress, solverLevels: [...new Set([...progress.solverLevels, levelId])] };
}
