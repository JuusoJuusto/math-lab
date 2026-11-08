/**
 * The solver's learning progression and exercise catalogue.
 *
 * Exercises are authored as plain strings in standard form (x term first), for
 * example "3x - 4 = 20". The parser turns them into exact equations at run
 * time, and the automated tests prove that every exercise parses, has a single
 * whole-number solution and can be solved in the number of steps the level
 * promises. To add an exercise, add a line to a pool; see docs/CONTENT_GUIDE.md.
 *
 * Pools are ordered from easier to harder. A round picks a random subset and
 * keeps this order, so each round ramps up gently.
 */

import type { Equation } from "./expression";
import { mustParseEquation } from "./parse";

export type LevelId = "one-step" | "two-step" | "both";

export interface ExerciseDefinition {
  /** Stable identifier. Never reuse an id for a different equation. */
  readonly id: string;
  /** Equation text in standard form, for example "2x + 5 = 17". */
  readonly equation: string;
}

export interface LevelDefinition {
  /** Matches the id of the topic that hosts this level. */
  readonly id: LevelId;
  readonly number: 1 | 2 | 3;
  readonly title: string;
  readonly tagline: string;
  readonly intro: {
    readonly lead: string;
    readonly points: readonly string[];
    readonly keyIdea: string;
  };
  readonly example: {
    readonly equation: string;
    readonly lead: string;
  };
  /** How many equations a practice round contains. */
  readonly roundSize: number;
  readonly exercises: readonly ExerciseDefinition[];
}

const one = (n: number, equation: string): ExerciseDefinition => ({ id: `one-step-${String(n).padStart(2, "0")}`, equation });
const two = (n: number, equation: string): ExerciseDefinition => ({ id: `two-step-${String(n).padStart(2, "0")}`, equation });
const both = (n: number, equation: string): ExerciseDefinition => ({ id: `both-${String(n).padStart(2, "0")}`, equation });

export const LEVELS: readonly LevelDefinition[] = [
  {
    id: "one-step",
    number: 1,
    title: "One-step equations",
    tagline: "Undo one operation to find x",
    intro: {
      lead: "In a one-step equation, x has just one operation attached to it. Undo that operation and x is on its own.",
      points: [
        "Addition and subtraction undo each other.",
        "Multiplication and division undo each other.",
        "Whatever you do to one side, you must do to the other side too.",
      ],
      keyIdea: "An equation is like a balanced scale. Do the same thing to both sides and it stays balanced.",
    },
    example: {
      equation: "x + 5 = 12",
      lead: "Here, 5 has been added to x. To get x alone, we undo the addition.",
    },
    roundSize: 5,
    exercises: [
      one(1, "x + 9 = 15"),
      one(2, "x - 7 = 9"),
      one(3, "3x = 21"),
      one(4, "x/4 = 6"),
      one(5, "x - 3 = 11"),
      one(6, "5x = 40"),
      one(7, "x/2 = 9"),
      one(8, "x + 12 = 20"),
      one(9, "x - 12 = 8"),
      one(10, "4x = 36"),
      one(11, "x/5 = 4"),
      one(12, "x + 8 = 17"),
    ],
  },
  {
    id: "two-step",
    number: 2,
    title: "Two-step equations",
    tagline: "Undo two operations, in the right order",
    intro: {
      lead: "In a two-step equation, x has two operations attached to it. Undo them in reverse order: first the adding or subtracting, then the multiplying or dividing.",
      points: [
        "In 2x + 5, x is multiplied by 2 first and then 5 is added.",
        "To undo that, work backwards: subtract 5 first, then divide by 2.",
        "After every step, look at what is still attached to x.",
      ],
      keyIdea: "The last thing done to x is the first thing to undo.",
    },
    example: {
      equation: "2x + 5 = 17",
      lead: "Here, x was multiplied by 2 and then 5 was added. We undo the + 5 first.",
    },
    roundSize: 5,
    exercises: [
      two(1, "3x + 4 = 19"),
      two(2, "5x + 2 = 27"),
      two(3, "4x + 3 = 19"),
      two(4, "3x - 4 = 20"),
      two(5, "6x - 5 = 25"),
      two(6, "2x - 9 = 5"),
      two(7, "x/3 + 4 = 9"),
      two(8, "x/2 - 3 = 4"),
      two(9, "x/4 + 2 = 6"),
      two(10, "7x + 1 = 50"),
      two(11, "x/5 - 2 = 3"),
      two(12, "4x - 10 = 22"),
    ],
  },
  {
    id: "both",
    number: 3,
    title: "Variables on both sides",
    tagline: "Collect the x terms, then solve",
    intro: {
      lead: "Sometimes x appears on both sides. Collect the x terms on one side first, then solve as before. Take care with the signs when negative numbers appear.",
      points: [
        "Remove one x term by doing the opposite operation to both sides.",
        "A minus sign belongs to the term after it: in 3x − 5, the number being subtracted is 5.",
        "Dividing by a negative number changes the sign of the number on the other side too.",
      ],
      keyIdea: "Get all the x terms on one side and all the plain numbers on the other.",
    },
    example: {
      equation: "6x - 4 = 2x + 8",
      lead: "x is on both sides, so first we collect the x terms on one side.",
    },
    roundSize: 5,
    exercises: [
      both(1, "4x + 1 = 2x + 9"),
      both(2, "6x + 1 = 4x + 11"),
      both(3, "7x - 3 = 4x + 12"),
      both(4, "3x - 5 = x + 7"),
      both(5, "8x - 6 = 5x + 9"),
      both(6, "6x + 4 = 2x + 20"),
      both(7, "5x - 8 = 2x - 2"),
      both(8, "2x + 3 = 5x - 9"),
      both(9, "9x + 2 = 6x - 7"),
      both(10, "-x + 4 = 2x - 8"),
      both(11, "-2x + 7 = 1"),
      both(12, "-2x + 3 = 11"),
    ],
  },
];

export function getLevel(id: string): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function isLevelId(id: string): id is LevelId {
  return LEVELS.some((level) => level.id === id);
}

/** The level that follows `id`, if any. */
export function getNextLevel(id: LevelId): LevelDefinition | undefined {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index >= 0 ? LEVELS[index + 1] : undefined;
}

/** An exercise ready for the workspace: the parsed equation plus its identity. */
export interface Exercise {
  readonly id: string;
  readonly source: string;
  readonly equation: Equation;
}

export function toExercise(definition: ExerciseDefinition): Exercise {
  return { id: definition.id, source: definition.equation, equation: mustParseEquation(definition.equation) };
}
