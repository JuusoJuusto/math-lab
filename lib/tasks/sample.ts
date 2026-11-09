/**
 * Random equations with a whole-number solution, one family per topic.
 *
 * Every sample is parsed and solved by the engine before it is returned, and a
 * mismatch throws. The tests run thousands of seeds, so a template that could
 * produce a wrong or fractional answer is caught long before a learner sees it.
 */

import { formatEquation, isSolution, isSolved, frac, makePrelude, mustParseEquation, solveEquation, type Equation, type Rng } from "../equations";

export interface Sample {
  /** Equation text as authored by the template, e.g. "2x + 5 = 17" or "3(x - 2) = 9". */
  readonly text: string;
  readonly equation: Equation;
  /** The whole-number solution. */
  readonly solution: number;
}

export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** `3x`, `x`, `-x`, `-2x`. */
function xTerm(coefficient: number): string {
  if (coefficient === 1) return "x";
  if (coefficient === -1) return "-x";
  return `${coefficient}x`;
}

/** ` + 5` or ` - 5`, or nothing for zero. */
function signed(n: number): string {
  if (n === 0) return "";
  return n > 0 ? ` + ${n}` : ` - ${-n}`;
}

function finish(text: string, expected: number): Sample {
  const equation = mustParseEquation(text);
  // An equation that already says x = 3 once simplified (2(x - 2) - 1(x - 4) = 10) has nothing left to do.
  if (isSolved(equation)) throw new Error(`Sampler bug: "${text}" is already solved`);
  const result = solveEquation(equation);
  if (result.kind !== "one" || result.value.d !== 1 || result.value.n !== expected || !isSolution(equation, frac(expected))) {
    throw new Error(`Sampler bug: "${text}" should have the whole-number solution ${expected}`);
  }
  return { text, equation, solution: expected };
}

/** A non-zero whole number between `min` and `max`. */
function nonZero(rng: Rng, min: number, max: number): number {
  let n = 0;
  while (n === 0) n = int(rng, min, max);
  return n;
}

/** Plus or minus one, with the same chance for each: positive and negative numbers are met equally often. */
function sign(rng: Rng): 1 | -1 {
  return rng() < 0.5 ? 1 : -1;
}

function oneStep(rng: Rng): Sample {
  switch (int(rng, 0, 3)) {
    case 0: {
      // x + 7 = 3 and x - 4 = -9: the number added may be negative, and so may the answer.
      const a = nonZero(rng, -15, 15);
      const s = nonZero(rng, -20, 20);
      return finish(`x${signed(a)} = ${s + a}`, s);
    }
    case 1: {
      // -x = 7: the minus in front of x is undone by multiplying by -1.
      const s = nonZero(rng, -15, 15);
      return finish(`-x = ${-s}`, s);
    }
    case 2: {
      // 3x = 21, -3x = 18, 7x = -35.
      const a = sign(rng) * int(rng, 2, 9);
      const s = nonZero(rng, -12, 12);
      return finish(`${xTerm(a)} = ${a * s}`, s);
    }
    default: {
      // x/4 = -3 and -x/2 = 4.
      const a = int(rng, 2, 9);
      const b = nonZero(rng, -10, 10);
      const negative = rng() < 0.5;
      return finish(`${negative ? "-" : ""}x/${a} = ${b}`, (negative ? -1 : 1) * a * b);
    }
  }
}

function twoStep(rng: Rng): Sample {
  switch (int(rng, 0, 3)) {
    case 0: {
      // ax + b = c with signs everywhere: 2x + 5 = -7, -3x + 4 = 19.
      const a = sign(rng) * int(rng, 2, 9);
      const b = nonZero(rng, -15, 15);
      const s = nonZero(rng, -12, 12);
      return finish(`${xTerm(a)}${signed(b)} = ${a * s + b}`, s);
    }
    case 1: {
      // b - ax = c: the number comes first, and the x term is taken away.
      const a = int(rng, 2, 9);
      const b = nonZero(rng, -15, 15);
      const s = nonZero(rng, -12, 12);
      return finish(`${b} - ${a}x = ${b - a * s}`, s);
    }
    case 2: {
      // x/a + b = c, or -x/a + b = c.
      const a = int(rng, 2, 6);
      const k = nonZero(rng, -10, 10);
      const b = nonZero(rng, -12, 12);
      const negative = rng() < 0.5;
      return finish(`${negative ? "-" : ""}x/${a}${signed(b)} = ${k + b}`, (negative ? -1 : 1) * a * k);
    }
    default: {
      // ax - b = c with a negative answer or a negative right side.
      const a = int(rng, 2, 9);
      const s = nonZero(rng, -12, 12);
      const b = int(rng, 1, 15);
      return finish(`${a}x - ${b} = ${a * s - b}`, s);
    }
  }
}

function bothSides(rng: Rng): Sample {
  if (rng() < 0.3) {
    // A negative coefficient on its own side: -2x + 7 = 1.
    const a = int(rng, 1, 6);
    const b = nonZero(rng, -15, 15);
    const s = nonZero(rng, -9, 9);
    return finish(`${xTerm(-a)}${signed(b)} = ${-a * s + b}`, s);
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    // Either coefficient may be negative: -3x + 7 = -4x + 1.
    const a = sign(rng) * int(rng, 1, 9);
    const c = sign(rng) * int(rng, 1, 8);
    if (a === c) continue;
    const s = nonZero(rng, -9, 12);
    const b = nonZero(rng, -12, 12);
    const d = (a - c) * s + b;
    if (Math.abs(d) > 40) continue;
    return finish(`${xTerm(a)}${signed(b)} = ${xTerm(c)}${signed(d)}`, s);
  }
  return finish("5x + 2 = 3x + 12", 5);
}

function brackets(rng: Rng): Sample {
  const inner = (b: number) => (b < 0 ? `x - ${-b}` : `x + ${b}`);
  switch (int(rng, 0, 2)) {
    case 0: {
      // a(x + b) = c with a, b and the answer of either sign: -2(x - 3) = 10.
      const a = sign(rng) * int(rng, 2, 6);
      const b = nonZero(rng, -8, 8);
      const s = nonZero(rng, -10, 10);
      return finish(`${a}(${inner(b)}) = ${a * (s + b)}`, s);
    }
    case 1: {
      // c + a(x + b) = d: a number in front of the bracket.
      const a = sign(rng) * int(rng, 2, 5);
      const b = nonZero(rng, -7, 7);
      const c = nonZero(rng, -9, 9);
      const s = nonZero(rng, -9, 9);
      return finish(`${c} ${a < 0 ? "-" : "+"} ${Math.abs(a)}(${inner(b)}) = ${c + a * (s + b)}`, s);
    }
    default: {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const a = sign(rng) * int(rng, 2, 6);
        const c = sign(rng) * int(rng, 1, 5);
        if (a === c) continue;
        const b = nonZero(rng, -7, 7);
        const s = nonZero(rng, -9, 9);
        const d = a * (s + b) - c * s;
        if (Math.abs(d) > 40) continue;
        return finish(`${a}(${inner(b)}) = ${xTerm(c)}${signed(d)}`, s);
      }
      return finish("3(x - 2) = 2x + 5", 11);
    }
  }
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

/** An equation text with the expected whole-number solution, or `null` if it is not exactly that. */
function attempt(text: string, expected: number): Sample | null {
  try {
    return finish(text, expected);
  } catch {
    return null;
  }
}

/** Fractions: the common denominator is the first move, and brackets with a division are opened first. */
function fractions(rng: Rng): Sample {
  for (let tries = 0; tries < 100; tries += 1) {
    let sample: Sample | null = null;
    switch (int(rng, 0, 4)) {
      case 0: {
        // x/a + x/b = c
        const [a, b] = pick(rng, [[2, 3], [2, 4], [3, 6], [2, 6], [3, 4], [4, 6], [2, 5]] as const);
        const s = lcm(a, b) * nonZero(rng, -4, 4);
        sample = attempt(`x/${a} + x/${b} = ${s / a + s / b}`, s);
        break;
      }
      case 1: {
        // (x + p)/a = q
        const a = int(rng, 2, 6);
        const q = nonZero(rng, -8, 8);
        const p = nonZero(rng, -9, 9);
        sample = attempt(`(${p < 0 ? `x - ${-p}` : `x + ${p}`})/${a} = ${q}`, a * q - p);
        break;
      }
      case 2: {
        // (x - p)/a = q
        const a = int(rng, 2, 6);
        const q = nonZero(rng, -8, 8);
        const p = int(rng, 1, 9);
        sample = attempt(`(x - ${p})/${a} = ${q}`, a * q + p);
        break;
      }
      case 3: {
        // ax/b + p = q
        const b = int(rng, 2, 5);
        const a = pick(rng, [2, 3, 4, 5].filter((value) => value !== b));
        const k = nonZero(rng, -6, 6);
        const p = nonZero(rng, -9, 9);
        sample = attempt(`${a}x/${b}${signed(p)} = ${a * k + p}`, b * k);
        break;
      }
      default: {
        // x/a = x/b + c with a < b
        const [a, b] = pick(rng, [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]] as const);
        const s = lcm(a, b) * nonZero(rng, -3, 3);
        sample = attempt(`x/${a} = x/${b}${signed(s / a - s / b)}`, s);
      }
    }
    if (sample) return sample;
  }
  return finish("x/2 + x/3 = 5", 6);
}

/** The hardest equations: brackets on both sides, brackets after a minus, fractions together. */
function challenge(rng: Rng): Sample {
  for (let tries = 0; tries < 300; tries += 1) {
    const s = int(rng, -4, 12) || 1;
    let sample: Sample | null = null;
    if (rng() < 0.65) {
      // a(x + b) - c(x + d) = e x + f
      const a = int(rng, 2, 5);
      const c = int(rng, 1, 4);
      const b = int(rng, 1, 6) * (rng() < 0.5 ? 1 : -1);
      const d = int(rng, 1, 6) * (rng() < 0.5 ? 1 : -1);
      const e = int(rng, 0, 3);
      const f = a * (s + b) - c * (s + d) - e * s;
      if (a - c - e !== 0 && Math.abs(f) <= 40) {
        const bracket = (n: number) => (n < 0 ? `x - ${-n}` : `x + ${n}`);
        sample = attempt(`${a}(${bracket(b)}) - ${c}(${bracket(d)}) = ${e === 0 ? "" : `${e}x`}${e === 0 ? f : signed(f)}`, s);
      }
    } else {
      // (x + p)/a + (x - q)/b = r, with r a whole number
      const a = int(rng, 2, 5);
      const b = int(rng, 2, 5);
      const p = int(rng, 1, 8);
      const q = int(rng, 1, 8);
      const total = (s + p) * b + (s - q) * a;
      if (a !== b && total % (a * b) === 0) sample = attempt(`(x + ${p})/${a} + (x - ${q})/${b} = ${total / (a * b)}`, s);
    }
    if (sample) return sample;
  }
  return finish("4(x - 3) - 2(x - 5) = x + 6", 8);
}

/** Topics that have generated equations. */
export type EquationTopic = "basics" | "one-step" | "two-step" | "both" | "brackets" | "fractions" | "challenge";

export function isEquationTopic(topic: string): topic is EquationTopic {
  return ["basics", "one-step", "two-step", "both", "brackets", "fractions", "challenge"].includes(topic);
}

export function sampleEquation(topic: EquationTopic, rng: Rng): Sample {
  switch (topic) {
    case "basics":
      return rng() < 0.6 ? oneStep(rng) : twoStep(rng);
    case "one-step":
      return oneStep(rng);
    case "two-step":
      return twoStep(rng);
    case "both":
      return bothSides(rng);
    case "brackets":
      return brackets(rng);
    case "fractions":
      return fractions(rng);
    case "challenge":
      return challenge(rng);
  }
}

/**
 * The equation as the learner should see it. Equations that are already in
 * simple form are shown in the same standard form as the solver; equations with
 * brackets or fractions to deal with keep the way they are written, since
 * simplifying them would hide the first steps.
 */
export function displayEquation(sample: Sample): string {
  return makePrelude(sample.text).steps.length > 0 ? sample.text.replace(/-/g, "−") : formatEquation(sample.equation);
}
