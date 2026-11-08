import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import { formatFraction } from "../format";
import { mustParseEquation, parseEquation } from "../parse";
import { solveEquation } from "../solve";
import { chainOf, graphOf, guessVerdict, sidesDifference } from "../methods";
import { frac } from "../fraction";

const eq = mustParseEquation;
const forward = (text: string) => chainOf(eq(text))!.forward.map((step) => `${step.kind} ${formatFraction(step.amount)}`);
const backward = (text: string) =>
  chainOf(eq(text))!.backward.map((step) => `${step.operation.kind} ${formatFraction(step.operation.amount)}: ${formatFraction(step.from)} -> ${formatFraction(step.to)}`);

describe("working backwards (the chain)", () => {
  it("writes what is done to x, in order", () => {
    expect(forward("2x + 5 = 17")).toEqual(["multiply 2", "add 5"]);
    expect(forward("x - 7 = 9")).toEqual(["subtract 7"]);
    expect(forward("x/4 = 6")).toEqual(["divide 4"]);
    expect(forward("x/3 + 4 = 9")).toEqual(["divide 3", "add 4"]);
    expect(forward("-2x + 3 = 11")).toEqual(["multiply −2", "add 3"]);
    expect(forward("2x/3 - 1 = 5")).toEqual(["multiply 2", "divide 3", "subtract 1"]);
    expect(forward("17 = 2x + 5")).toEqual(["multiply 2", "add 5"]);
  });

  it("undoes it from the end, with the number after each undo", () => {
    expect(backward("2x + 5 = 17")).toEqual(["subtract 5: 17 -> 12", "divide 2: 12 -> 6"]);
    expect(backward("x/3 + 4 = 9")).toEqual(["subtract 4: 9 -> 5", "multiply 3: 5 -> 15"]);
    expect(backward("-2x + 3 = 11")).toEqual(["subtract 3: 11 -> 8", "divide −2: 8 -> −4"]);
    expect(backward("2x/3 - 1 = 5")).toEqual(["add 1: 5 -> 6", "multiply 3: 6 -> 18", "divide 2: 18 -> 9"]);
  });

  it("has no chain when x is on both sides, or not there", () => {
    expect(chainOf(eq("5x + 2 = 3x + 12"))).toBeNull();
    expect(chainOf(eq("3 = 5"))).toBeNull();
    expect(chainOf(eq("x = x + 1"))).toBeNull();
  });

  it("always ends at the solution of the equation (random equations)", () => {
    const rng = createRng(77);
    const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
    let checked = 0;
    for (let i = 0; i < 2000; i += 1) {
      const a = int(-9, 9) || 2;
      const d = int(1, 5);
      const text = `${a}x/${d} + ${int(-15, 15)} = ${int(-30, 30)}`;
      const parsed = parseEquation(text);
      if (!parsed.ok) continue;
      const chain = chainOf(parsed.value);
      const solution = solveEquation(parsed.value);
      if (!chain || solution.kind !== "one") continue;
      const last = chain.backward.at(-1)?.to ?? chain.result;
      expect(formatFraction(last), text).toBe(formatFraction(solution.value));
      checked += 1;
    }
    expect(checked).toBeGreaterThan(1500);
  });
});

describe("the graph", () => {
  it("draws each side as a line that crosses at the solution", () => {
    const graph = graphOf(eq("2x + 5 = 17"));
    expect(graph.kind).toBe("one");
    expect(graph.meet).toMatchObject({ x: 6, y: 17 });
    // The left line passes through (6, 17) and the right one is level at 17.
    expect(graph.right.from.y).toBe(17);
    expect(graph.right.to.y).toBe(17);
    expect(graph.left.from.y).toBeLessThan(graph.left.to.y);
    // The picture has room around the crossing and shows the axes.
    expect(graph.xMin).toBeLessThanOrEqual(-2);
    expect(graph.xMax).toBeGreaterThanOrEqual(8);
    expect(graph.yMin).toBeLessThan(0);
    expect(graph.yMax).toBeGreaterThan(17);
  });

  it("works with x on both sides, a negative answer and fractions", () => {
    expect(graphOf(eq("5x + 2 = 3x + 12")).meet).toMatchObject({ x: 5, y: 27 });
    expect(graphOf(eq("2x + 3 = 5x - 9")).meet?.x).toBe(4);
    expect(graphOf(eq("-2x + 3 = 11")).meet).toMatchObject({ x: -4, y: 11 });
    expect(graphOf(eq("-2x + 3 = 11")).xMin).toBeLessThanOrEqual(-6);
    expect(graphOf(eq("2x/3 = 4")).meet?.x).toBe(6);
  });

  it("shows parallel lines for no solution and the same line for infinitely many", () => {
    const none = graphOf(eq("2x + 3 = 2x + 7"));
    expect(none.kind).toBe("none");
    expect(none.meet).toBeNull();
    expect(none.left.to.y - none.left.from.y).toBe(none.right.to.y - none.right.from.y);
    expect(none.left.from.y).not.toBe(none.right.from.y);

    const same = graphOf(eq("2(x + 3) = 2x + 6"));
    expect(same.kind).toBe("infinite");
    expect(same.left.from.y).toBe(same.right.from.y);
    expect(same.left.to.y).toBe(same.right.to.y);
  });

  it("agrees with the equation: at the crossing the two sides are equal, nowhere else", () => {
    for (const text of ["2x + 5 = 17", "5x + 2 = 3x + 12", "-2x + 3 = 11", "x/3 + 4 = 9"]) {
      const equation = eq(text);
      const graph = graphOf(equation);
      expect(formatFraction(sidesDifference(equation, graph.meet!.value))).toBe("0");
      expect(formatFraction(sidesDifference(equation, frac(graph.meet!.x + 1)))).not.toBe("0");
    }
  });
});

describe("guess and check: which way a guess should move", () => {
  it("says larger when the sides are too small and smaller when they are too big", () => {
    const eq = mustParseEquation("3x + 4 = 19");
    expect(guessVerdict(eq, frac(2))).toBe("larger");
    expect(guessVerdict(eq, frac(8))).toBe("smaller");
    expect(guessVerdict(eq, frac(5))).toBe("right");
  });

  it("turns around when x falls faster on the left: 10 − x = 4", () => {
    const eq = mustParseEquation("10 - x = 4");
    expect(guessVerdict(eq, frac(2))).toBe("larger");
    expect(guessVerdict(eq, frac(9))).toBe("smaller");
    expect(guessVerdict(eq, frac(6))).toBe("right");
  });

  it("has no direction when there is not exactly one solution", () => {
    expect(guessVerdict(mustParseEquation("2x + 3 = 2x + 7"), frac(1))).toBeNull();
    expect(guessVerdict(mustParseEquation("2x + 3 = 2x + 3"), frac(1))).toBeNull();
  });

  it("always points toward the real solution, for thousands of random equations and guesses", () => {
    const rng = createRng(404);
    const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
    let checked = 0;
    for (let i = 0; i < 4000; i += 1) {
      const equation = mustParseEquation(`${int(-9, 9) || 3}x + ${int(-12, 12)} = ${int(-9, 9)}x + ${int(-30, 30)}`);
      const answer = solveEquation(equation);
      if (answer.kind !== "one") continue;
      const guess = frac(int(-40, 40));
      const verdict = guessVerdict(equation, guess);
      const target = answer.value.n / answer.value.d;
      const at = guess.n / guess.d;
      expect(verdict).toBe(target === at ? "right" : target > at ? "larger" : "smaller");
      checked += 1;
    }
    expect(checked).toBeGreaterThan(3000);
  });
});

describe("the graph of an equation whose answer is not a whole number", () => {
  it("does not fail for x = 3/2, and puts the crossing at the right height", () => {
    const graph = graphOf(mustParseEquation("2x = 3"));
    expect(graph.kind).toBe("one");
    expect(graph.meet).toMatchObject({ x: 1.5, y: 3 });
  });

  it("crosses where both sides are equal, for thousands of equations with fractional answers", () => {
    const rng = createRng(11);
    const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
    let fractional = 0;
    for (let i = 0; i < 3000; i += 1) {
      const equation = mustParseEquation(`${int(2, 9)}x + ${int(-9, 9)} = ${int(-9, 1)}x + ${int(-20, 20)}`);
      const answer = solveEquation(equation);
      if (answer.kind !== "one") continue;
      const graph = graphOf(equation);
      expect(graph.meet).not.toBeNull();
      if (answer.value.d !== 1) fractional += 1;
      // y at the crossing is what both sides evaluate to at x.
      const x = answer.value;
      const left = equation.left.x.n / equation.left.x.d * (x.n / x.d) + equation.left.c.n / equation.left.c.d;
      expect(Math.abs(graph.meet!.y - left)).toBeLessThan(1e-9);
      expect(graph.yMin).toBeLessThan(graph.yMax);
    }
    expect(fractional).toBeGreaterThan(500);
  });
});
