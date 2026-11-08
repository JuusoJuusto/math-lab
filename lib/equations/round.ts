/**
 * Choosing the equations for a practice round, and summarising how it went.
 *
 * Randomness is injected (`Rng`) so tests are deterministic and the UI can
 * simply pass `Math.random` at the moment a learner starts a round, which
 * keeps server-rendered HTML identical to the first client render.
 */

import { toExercise, type Exercise, type LevelDefinition } from "./levels";

/** A function returning a number in [0, 1), like `Math.random`. */
export type Rng = () => number;

/** Small, fast, seedable generator (mulberry32). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle that returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Picks `level.roundSize` different exercises.
 *
 * Exercises listed in `avoid` (for example those from the previous round) are
 * only reused when the pool is too small to fill a round without them. The
 * chosen exercises keep the pool's easy-to-hard order.
 */
export function pickRound(level: LevelDefinition, rng: Rng, avoid: readonly string[] = []): Exercise[] {
  const order = new Map(level.exercises.map((exercise, index) => [exercise.id, index]));
  const fresh = level.exercises.filter((exercise) => !avoid.includes(exercise.id));
  const used = level.exercises.filter((exercise) => avoid.includes(exercise.id));

  const chosen = [...shuffle(fresh, rng), ...shuffle(used, rng)].slice(0, level.roundSize);
  chosen.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return chosen.map(toExercise);
}

/** What happened while solving one equation. */
export interface ExerciseResult {
  readonly id: string;
  readonly steps: number;
  readonly mistakes: number;
  readonly hints: number;
}

export interface RoundSummary {
  readonly solved: number;
  readonly hintsUsed: number;
  /** Equations solved without any hint and without a wrong move. */
  readonly cleanSolves: number;
}

export function summariseRound(results: readonly ExerciseResult[]): RoundSummary {
  return {
    solved: results.length,
    hintsUsed: results.reduce((total, result) => total + result.hints, 0),
    cleanSolves: results.filter((result) => result.hints === 0 && result.mistakes === 0).length,
  };
}
