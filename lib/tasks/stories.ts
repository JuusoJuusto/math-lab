/**
 * Word problems and proportion problems with whole-number answers.
 *
 * Story templates carry the correct equation and three tempting wrong ones.
 * `sampleStory` re-checks every option with the engine, so a template whose
 * wrong equation accidentally has the right solution is rejected, not shown.
 */

import { frac, parseEquation, solveEquation, type Rng } from "../equations";
import { int, pick } from "./sample";

export interface Story {
  /** The situation, ending with what x stands for. */
  readonly text: string;
  /** The typed-answer version of the question. */
  readonly question: string;
  /** Shown next to the answer box, e.g. "km". */
  readonly unit: string;
  /** Equation options. The first one is correct. */
  readonly equations: readonly string[];
  readonly solution: number;
  /** One sentence on how the correct equation is built. */
  readonly build: string;
}

type Template = (rng: Rng) => Story | null;

const taxi: Template = (rng) => {
  const a = int(rng, 2, 8);
  const b = int(rng, 2, 5);
  const s = int(rng, 3, 12);
  if (a === b) return null;
  const c = a + b * s;
  return {
    text: `A taxi charges €${a} to start and €${b} for every kilometre. One ride costs €${c} in total. Let x be the number of kilometres.`,
    question: "How many kilometres was the ride?",
    unit: "km",
    equations: [`${b}x + ${a} = ${c}`, `${b}x - ${a} = ${c}`, `${a + b}x = ${c}`, `${a}x + ${b} = ${c}`],
    solution: s,
    build: `The start fee €${a} is added once, and €${b} is paid for each of the x kilometres: ${b}x + ${a} = ${c}.`,
  };
};

const saving: Template = (rng) => {
  const a = int(rng, 5, 30);
  const b = int(rng, 2, 9);
  const s = int(rng, 3, 10);
  if (a === b) return null;
  const c = a + b * s;
  return {
    text: `Leo has €${a} saved. Each week he adds €${b}. After some weeks he has €${c}. Let x be the number of weeks.`,
    question: `After how many weeks does Leo have €${c}?`,
    unit: "weeks",
    equations: [`${b}x + ${a} = ${c}`, `${b}x = ${c} + ${a}`, `${a}x + ${b} = ${c}`, `${b}x - ${a} = ${c}`],
    solution: s,
    build: `Leo starts with €${a} and adds €${b} for each of the x weeks: ${b}x + ${a} = ${c}.`,
  };
};

const notebooks: Template = (rng) => {
  const n = int(rng, 3, 8);
  const p = int(rng, 2, 9);
  const c = n * p;
  return {
    text: `${n} identical notebooks cost €${c} altogether. Let x be the price of one notebook in euros.`,
    question: "What does one notebook cost?",
    unit: "€",
    equations: [`${n}x = ${c}`, `x/${n} = ${c}`, `x + ${n} = ${c}`, `x - ${n} = ${c}`],
    solution: p,
    build: `${n} notebooks at x euros each cost ${n} times x: ${n}x = ${c}.`,
  };
};

const puzzle: Template = (rng) => {
  const n = int(rng, 2, 6);
  const s = int(rng, 2, 10);
  const m = int(rng, 1, Math.min(9, n * s - 1));
  const k = n * s - m;
  return {
    text: `I think of a number, multiply it by ${n} and then subtract ${m}. The result is ${k}. Let x be my number.`,
    question: "What number am I thinking of?",
    unit: "",
    equations: [`${n}x - ${m} = ${k}`, `${n}x + ${m} = ${k}`, `${n}(x - ${m}) = ${k}`, `x/${n} - ${m} = ${k}`],
    solution: s,
    build: `Multiply x by ${n}, then subtract ${m}, and the result is ${k}: ${n}x − ${m} = ${k}.`,
  };
};

const plans: Template = (rng) => {
  const b = int(rng, 1, 3);
  const e = int(rng, 1, 3);
  const d = b + e;
  const s = int(rng, 3, 10);
  const a = e * s;
  return {
    text: `Plan A costs €${a} a month plus €${b} for each GB. Plan B costs €${d} for each GB and has no monthly fee. Let x be the number of GB.`,
    question: "For how many GB do both plans cost the same?",
    unit: "GB",
    equations: [`${b}x + ${a} = ${d}x`, `${b}x = ${d}x + ${a}`, `${b}x + ${a} = ${d}`, `${b + d}x = ${a}`],
    solution: s,
    build: `Plan A costs ${b}x + ${a} and plan B costs ${d}x. They are equal when ${b}x + ${a} = ${d}x.`,
  };
};

const rectangle: Template = (rng) => {
  const s = int(rng, 3, 12);
  const n = int(rng, 2, 8);
  if (s === n) return null;
  const perimeter = 4 * s + 2 * n;
  return {
    text: `A rectangle is ${n} cm longer than it is wide. Its perimeter is ${perimeter} cm. Let x be the width in centimetres.`,
    question: "How wide is the rectangle?",
    unit: "cm",
    equations: [
      `2x + 2(x + ${n}) = ${perimeter}`,
      `x + (x + ${n}) = ${perimeter}`,
      `2x + (x + ${n}) = ${perimeter}`,
      `4x + ${n} = ${perimeter}`,
    ],
    solution: s,
    build: `The width is x and the length is x + ${n}. The perimeter is two widths plus two lengths: 2x + 2(x + ${n}) = ${perimeter}.`,
  };
};

const TEMPLATES: readonly Template[] = [taxi, saving, notebooks, puzzle, plans, rectangle];

/** True when the equation text has exactly one solution and it equals `expected`. */
function solvesTo(text: string, expected: number): boolean {
  const parsed = parseEquation(text);
  if (!parsed.ok) return false;
  const solution = solveEquation(parsed.value);
  return solution.kind === "one" && solution.value.d === 1 && solution.value.n === expected;
}

/** A verified word problem: the first option is the only one that gives the intended answer. */
export function sampleStory(rng: Rng): Story {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const story = pick(rng, TEMPLATES)(rng);
    if (!story) continue;
    const [correct, ...wrong] = story.equations;
    if (solvesTo(correct, story.solution) && wrong.every((text) => !solvesTo(text, story.solution))) return story;
  }
  throw new Error("Could not build a valid word problem");
}

export interface Proportion {
  readonly text: string;
  readonly unit: string;
  readonly solution: number;
  readonly explanation: readonly string[];
}

/** Direct and inverse proportion with whole-number answers. */
export function sampleProportion(rng: Rng): Proportion {
  switch (int(rng, 0, 3)) {
    case 0: {
      const unitPrice = int(rng, 2, 9);
      const k = int(rng, 2, 5);
      const m = int(rng, k + 1, 12);
      return {
        text: `${k} kg of apples cost €${k * unitPrice}. How much do ${m} kg cost at the same price per kilogram?`,
        unit: "€",
        solution: m * unitPrice,
        explanation: [`One kilogram costs €${k * unitPrice} ÷ ${k} = €${unitPrice}.`, `${m} kg cost ${m} × €${unitPrice} = €${m * unitPrice}.`],
      };
    }
    case 1: {
      const kmPerCm = int(rng, 2, 9);
      const m = int(rng, 2, 15);
      return {
        text: `On a map, 1 cm represents ${kmPerCm} km. A road is ${m} cm long on the map. How long is the road in real life?`,
        unit: "km",
        solution: m * kmPerCm,
        explanation: [`Every centimetre stands for ${kmPerCm} km.`, `${m} cm stand for ${m} × ${kmPerCm} km = ${m * kmPerCm} km.`],
      };
    }
    case 2: {
      const workers = pick(rng, [2, 3, 4, 5, 6, 8]);
      const hours = int(rng, 2, 12);
      const total = workers * hours;
      const options = [1, 2, 3, 4, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24].filter((w) => w !== workers && total % w === 0 && w <= 24);
      const other = pick(rng, options.length ? options : [workers * 2]);
      return {
        text: `${workers} workers finish a job in ${hours} hours. How many hours would ${other} workers need at the same rate?`,
        unit: "hours",
        solution: total / other,
        explanation: [
          `The job needs ${workers} × ${hours} = ${total} worker-hours. More workers means less time.`,
          `${other} workers need ${total} ÷ ${other} = ${total / other} hours.`,
        ],
      };
    }
    default: {
      const people = int(rng, 2, 5);
      const perPerson = int(rng, 20, 60);
      const m = int(rng, people + 1, 12);
      return {
        text: `A recipe for ${people} people needs ${people * perPerson} g of flour. How many grams are needed for ${m} people?`,
        unit: "g",
        solution: m * perPerson,
        explanation: [
          `One person needs ${people * perPerson} g ÷ ${people} = ${perPerson} g.`,
          `${m} people need ${m} × ${perPerson} g = ${m * perPerson} g.`,
        ],
      };
    }
  }
}

/** Exposed so tests can state the intended answer as an exact fraction. */
export function storySolution(story: Story) {
  return frac(story.solution);
}
