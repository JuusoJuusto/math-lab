/**
 * Choosing the equations for a practice round, and summarising how it went.
 *
 * Randomness is injected (`Rng`) so tests are deterministic and the UI can
 * simply pass `Math.random` at the moment a learner starts a round, which
 * keeps server-rendered HTML identical to the first client render.
 */

import { toExercise, type Exercise, type LevelDefinition } from "./levels";
import { shuffle, type Rng } from "./rng";

export { createRng, shuffle, type Rng } from "./rng";

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

/**
 * Whether a round shows that the learner knows the level: every equation solved,
 * and at least four in five of them without a hint or a wrong move.
 */
export function thinksYouKnow(summary: RoundSummary, roundSize: number): boolean {
  return roundSize > 0 && summary.solved >= roundSize && summary.cleanSolves / roundSize >= 0.8;
}

export function summariseRound(results: readonly ExerciseResult[]): RoundSummary {
  return {
    solved: results.length,
    hintsUsed: results.reduce((total, result) => total + result.hints, 0),
    cleanSolves: results.filter((result) => result.hints === 0 && result.mistakes === 0).length,
  };
}
