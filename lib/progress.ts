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

import { TASK_GROUPS, groupOf, specKey, type TaskKind, type TaskSpec } from "./tasks/types";

export const STORAGE_KEY = "mathlab:progress:v1";

/** Experience points, as in GeoMaster and MasterModus. */
export const XP = {
  correctTask: 10,
  correctTimeAttack: 5,
  solverEquation: 10,
  solverLevel: 20,
  dailyChallenge: 25,
} as const;

export const XP_PER_LEVEL = 100;
export const MAX_MISSED = 30;

export interface Tally {
  attempts: number;
  correct: number;
}

export interface Progress {
  /** Topic ids whose multiple-choice practice round has been finished. */
  completed: string[];
  /** Number of practice answers submitted. */
  attempts: number;
  /** Number of those answers that were correct. */
  correct: number;
  /** Interactive solver levels that have been finished. */
  solverLevels: string[];
  xp: number;
  byTopic: Record<string, Tally>;
  /** Tallies by kind of task, using the groups in lib/tasks/types.ts. */
  byGroup: Record<string, Tally>;
  /** Tasks answered wrongly, newest first, as recipes that regenerate the same task. */
  missed: TaskSpec[];
  /** The date (YYYY-MM-DD) the daily challenge was last completed. */
  dailyDone: string | null;
  /** Best score in time attack. */
  bestTime: number;
}

export const EMPTY_PROGRESS: Progress = Object.freeze({
  completed: [],
  attempts: 0,
  correct: 0,
  solverLevels: [],
  xp: 0,
  byTopic: {},
  byGroup: {},
  missed: [],
  dailyDone: null,
  bestTime: 0,
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

function toTallies(value: unknown): Record<string, Tally> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const result: Record<string, Tally> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw !== "object" || raw === null) continue;
    const { attempts, correct } = raw as Record<string, unknown>;
    const a = toCount(attempts);
    result[key] = { attempts: a, correct: Math.min(toCount(correct), a) };
  }
  return result;
}

function toSpecs(value: unknown): TaskSpec[] {
  if (!Array.isArray(value)) return [];
  const kinds = Object.keys(TASK_GROUPS);
  const specs: TaskSpec[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const { kind, topic, seed, bankId } = raw as Record<string, unknown>;
    if (typeof kind !== "string" || !kinds.includes(kind) || typeof topic !== "string") continue;
    if (typeof seed !== "number" || !Number.isInteger(seed) || seed < 1) continue;
    if (kind === "bank" && typeof bankId !== "string") continue;
    specs.push({ kind: kind as TaskKind, topic, seed, ...(typeof bankId === "string" ? { bankId } : {}) });
  }
  return specs.slice(0, MAX_MISSED);
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
      xp: toCount(record.xp),
      byTopic: toTallies(record.byTopic),
      byGroup: toTallies(record.byGroup),
      missed: toSpecs(record.missed),
      dailyDone: typeof record.dailyDone === "string" ? record.dailyDone : null,
      bestTime: toCount(record.bestTime),
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function serialiseProgress(progress: Progress): string {
  return JSON.stringify(progress);
}

/** Percentage of answers that were correct, or 0 when nothing has been answered. */
export function accuracyOf(tally: Tally): number {
  return tally.attempts ? Math.round((tally.correct / tally.attempts) * 100) : 0;
}

/** Level 1 starts at 0 XP; every 100 XP is a new level. */
export function levelOf(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpIntoLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

function bump(tallies: Record<string, Tally>, key: string, correct: boolean): Record<string, Tally> {
  const old = tallies[key] ?? { attempts: 0, correct: 0 };
  return { ...tallies, [key]: { attempts: old.attempts + 1, correct: old.correct + (correct ? 1 : 0) } };
}

export interface TaskResult {
  readonly spec: TaskSpec;
  readonly correct: boolean;
  /** XP earned when correct. */
  readonly xp: number;
}

/**
 * Records one answered practice task: totals, per-topic and per-kind tallies,
 * XP, and the mistake queue. A task answered wrongly joins the queue (newest
 * first, no duplicates); answering it correctly later takes it out.
 */
export function recordTask(progress: Progress, result: TaskResult): Progress {
  const key = specKey(result.spec);
  const rest = progress.missed.filter((spec) => specKey(spec) !== key);
  return {
    ...progress,
    attempts: progress.attempts + 1,
    correct: progress.correct + (result.correct ? 1 : 0),
    xp: progress.xp + (result.correct ? result.xp : 0),
    byTopic: bump(progress.byTopic, result.spec.topic, result.correct),
    byGroup: bump(progress.byGroup, groupOf(result.spec.kind), result.correct),
    missed: result.correct ? rest : [result.spec, ...rest].slice(0, MAX_MISSED),
  };
}

export function addXp(progress: Progress, amount: number): Progress {
  return { ...progress, xp: progress.xp + Math.max(0, Math.floor(amount)) };
}

export function recordTopicsCompleted(progress: Progress, topicIds: readonly string[]): Progress {
  return { ...progress, completed: [...new Set([...progress.completed, ...topicIds])] };
}

/** Marks a solver level finished. The first time only, it also awards the level bonus. */
export function recordSolverLevel(progress: Progress, levelId: string): Progress {
  if (progress.solverLevels.includes(levelId)) return progress;
  return { ...progress, solverLevels: [...progress.solverLevels, levelId], xp: progress.xp + XP.solverLevel };
}

export function recordDailyDone(progress: Progress, date: string): Progress {
  return progress.dailyDone === date ? progress : { ...progress, dailyDone: date, xp: progress.xp + XP.dailyChallenge };
}

export function recordTimeAttack(progress: Progress, score: number): Progress {
  return score > progress.bestTime ? { ...progress, bestTime: Math.floor(score) } : progress;
}

/** A topic counts as practised once at least five answers are in and 70% were right. */
export function practisedTopics(progress: Progress): string[] {
  return Object.entries(progress.byTopic)
    .filter(([, tally]) => tally.attempts >= 5 && tally.correct / tally.attempts >= 0.7)
    .map(([topic]) => topic);
}

/** Topics finished by the solver, an old-style quiz round, or enough good practice. */
export function finishedTopics(progress: Progress): string[] {
  return [...new Set([...progress.completed, ...progress.solverLevels, ...practisedTopics(progress)])];
}

/** Share of the topics that are finished, as a whole percentage. */
export function overallProgress(progress: Progress, totalTopics: number): number {
  if (totalTopics <= 0) return 0;
  const finished = finishedTopics(progress).length;
  return Math.min(100, Math.round((finished / totalTopics) * 100));
}

/** The topic with the lowest accuracy among those with enough answers, to suggest what to revise. */
export function weakestTopic(progress: Progress, minAttempts = 3): string | null {
  const candidates = Object.entries(progress.byTopic).filter(([, tally]) => tally.attempts >= minAttempts);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => accuracyOf(a[1]) - accuracyOf(b[1]) || b[1].attempts - a[1].attempts);
  const [topic, tally] = candidates[0];
  return accuracyOf(tally) < 100 ? topic : null;
}
