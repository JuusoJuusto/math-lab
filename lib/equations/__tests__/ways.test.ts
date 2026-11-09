import { describe, expect, it } from "vitest";
import { formatBar, formatEquation } from "../format";
import { mustParseEquation } from "../parse";
import { createRng } from "../round";
import { isSolved, sameSolution, solveEquation } from "../solve";
import { waysToSolve } from "../ways";

const eq = mustParseEquation;

function written(text: string): string[] {
  return waysToSolve(eq(text)).map((way) => way.steps.map((step) => `${formatEquation(step.before)} ${formatBar(step.operation)}`).join(" / "));
}

describe("two ways to solve one equation", () => {
  it("starts with taking x away or adding 1: the same answer in a different order", () => {
    const ways = waysToSolve(eq("4x - 1 = x - 7"));
    expect(ways).toHaveLength(2);
    const firstMoves = ways.map((way) => formatBar(way.steps[0].operation));
    expect(new Set(firstMoves).size).toBe(2);
    for (const way of ways) expect(formatEquation(way.steps.at(-1)!.after)).toBe("x = −2");
  });

  it("lets x stay on the right when that is shorter", () => {
    const ways = waysToSolve(eq("5x + 8 = 6x + 2"));
    expect(ways).toHaveLength(2);
    const endings = ways.map((way) => formatEquation(way.steps.at(-1)!.after));
    expect(endings.every((ending) => ending === "x = 6" || ending === "6 = x")).toBe(true);
  });

  it("writes every line with the double bar", () => {
    for (const line of written("2x + 5 = 17")[0].split(" / ")) expect(line).toContain("||");
  });

  it("clears the denominator first on one route and last on the other", () => {
    const ways = waysToSolve(eq("3x/4 + 5 = 2"));
    expect(ways).toHaveLength(2);
    const firsts = ways.map((way) => formatBar(way.steps[0].operation));
    expect(firsts).toContain("|| × 4");
  });

  it("gives nothing for an equation that is already solved or has no way to finish", () => {
    expect(waysToSolve(eq("x = 4"))).toEqual([{ steps: [] }]);
  });

  it("every route of thousands of equations ends with x alone and keeps the solution", () => {
    const rng = createRng(77);
    const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
    let routes = 0;
    let twoWays = 0;

    for (let i = 0; i < 2000; i += 1) {
      const text = `${int(2, 9)}x ${int(0, 1) ? "+" : "-"} ${int(1, 12)} = ${int(-4, 8)}x ${int(0, 1) ? "+" : "-"} ${int(1, 20)}`;
      const equation = eq(text);
      if (isSolved(equation)) continue;
      const before = solveEquation(equation);
      const ways = waysToSolve(equation);
      if (before.kind !== "one") {
        continue;
      }
      expect(ways.length).toBeGreaterThan(0);
      if (ways.length === 2) twoWays += 1;
      for (const way of ways) {
        routes += 1;
        expect(isSolved(way.steps.at(-1)!.after)).toBe(true);
        expect(sameSolution(before, solveEquation(way.steps.at(-1)!.after))).toBe(true);
        let current = equation;
        for (const step of way.steps) {
          expect(formatEquation(step.before)).toBe(formatEquation(current));
          current = step.after;
        }
      }
    }
    expect(routes).toBeGreaterThan(2500);
    expect(twoWays).toBeGreaterThan(1000);
  });
});
