import { describe, expect, it } from "vitest";
import { createRng, frac, solveEquation, mustParseEquation } from "@/lib/equations";
import { pairPricesStory, sampleStory, triangleSidesStory } from "../stories";

const solutionOf = (text: string) => {
  const result = solveEquation(mustParseEquation(text));
  return result.kind === "one" ? result.value : null;
};

describe("stories whose question asks for more than x", () => {
  it("pair of prices: x is the cheaper one, the question asks for the dearer one", () => {
    const story = pairPricesStory(7, 3);
    expect(story.equations[0]).toBe("x + (x + 3) = 17");
    expect(solutionOf(story.equations[0])).toEqual(frac(7));
    expect(story.solution).toBe(7);
    expect(story.final).toBe(10);
    for (const lang of ["en", "fi"] as const) expect(story.i18n[lang].answer).toContain("10");
  });

  it("triangle sides: x is the first side, the question asks for the longest", () => {
    const story = triangleSidesStory(3, 2, 8)!;
    // sides 8, 11 and 2·8 − 2 = 14
    expect(story.equations[0]).toBe("x + (x + 3) + (2x - 2) = 33");
    expect(solutionOf(story.equations[0])).toEqual(frac(8));
    expect(story.final).toBe(14);
    for (const lang of ["en", "fi"] as const) expect(story.i18n[lang].answer).toContain("14 cm");
  });

  it("refuses a triangle that cannot exist or whose two options would be the same", () => {
    expect(triangleSidesStory(4, 4, 8)).toBeNull();
    expect(triangleSidesStory(2, 5, 2)).toBeNull();
  });

  it("every sampled one: the right equation gives x, every wrong equation gives something else, and the asked number is not x", () => {
    const rng = createRng(2025);
    const seen = new Set<string>();
    for (let i = 0; i < 1500; i += 1) {
      const story = sampleStory(rng);
      if (story.final === undefined) continue;
      seen.add(story.id);
      const [right, ...wrong] = story.equations;
      expect(solutionOf(right)).toEqual(frac(story.solution));
      for (const option of wrong) expect(solutionOf(option)).not.toEqual(frac(story.solution));
      expect(story.final).not.toBe(story.solution);
      for (const lang of ["en", "fi"] as const) expect(story.i18n[lang].answer).toContain(String(story.final));
    }
    expect([...seen].sort()).toEqual(["pair-prices", "triangle-sides"]);
  });

  it("the final number is always positive and a whole number", () => {
    const rng = createRng(9);
    for (let i = 0; i < 800; i += 1) {
      const story = sampleStory(rng);
      if (story.final === undefined) continue;
      expect(Number.isInteger(story.final)).toBe(true);
      expect(story.final).toBeGreaterThan(0);
    }
  });
});
