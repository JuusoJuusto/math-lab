import { describe, expect, it } from "vitest";
import { checkSolution, frac, mustParseEquation, parseEquation } from "@/lib/equations";
import { questionDefinitions } from "../questions";

const byId = (id: string) => questionDefinitions.find((question) => question.id === id)!;
const correctChoice = (id: string, lang: "en" | "fi") => byId(id).text[lang].choices[byId(id).correct];

/** The review questions about substituting a value (chapter "Yhtälön kertausta"): the answer key is checked with the engine. */
describe("the 'is it a solution' questions", () => {
  const cases: ReadonlyArray<{ id: string; equation: string; value: number; holds: boolean }> = [
    { id: "q28", equation: "2x - 1 = x + 2", value: 3, holds: true },
    { id: "q29", equation: "3x - 5 = x + 2", value: 4, holds: false },
    { id: "q30", equation: "3x + 4 = x", value: -2, holds: true },
  ];

  for (const { id, equation, value, holds } of cases) {
    it(`${id}: x = ${value} in ${equation} is ${holds ? "true" : "false"}, and the right choice gives both side values`, () => {
      const result = checkSolution(mustParseEquation(equation), frac(value));
      expect(result.holds).toBe(holds);
      const left = String(result.leftValue.n / result.leftValue.d).replace("-", "−");
      const right = String(result.rightValue.n / result.rightValue.d).replace("-", "−");
      for (const lang of ["en", "fi"] as const) {
        const prompt = byId(id).text[lang].prompt;
        expect(prompt).toContain(equation.replace(/-/g, "−").replace(/(\d)x/g, "$1x"));
        const choice = correctChoice(id, lang);
        if (holds) expect(choice).toContain(left);
        else {
          expect(choice).toContain(left);
          expect(choice).toContain(right);
        }
      }
    });
  }
});

describe("the other review questions", () => {
  it("q26: exactly one choice has no equals sign", () => {
    const choices = byId("q26").text.en.choices;
    expect(choices.filter((choice) => !choice.includes("="))).toEqual([correctChoice("q26", "en")]);
  });

  it("q27: the right side is what comes after the equals sign", () => {
    const [, right] = "4x − 5 = −2x + 9".split(" = ");
    expect(correctChoice("q27", "en")).toBe(right);
  });

  it("q31: the right way to write it gives the value −11", () => {
    expect(correctChoice("q31", "en")).toBe("4 · (−3) + 1");
    expect(4 * -3 + 1).toBe(-11);
  });

  it("q32: the balance shows the equation with 3x + 2 on the left and x + 8 on the right", () => {
    const equation = mustParseEquation(correctChoice("q32", "en"));
    expect(equation.left.x).toEqual(frac(3));
    expect(equation.left.c).toEqual(frac(2));
    expect(equation.right.x).toEqual(frac(1));
    expect(equation.right.c).toEqual(frac(8));
  });

  it("q33: the right choice is the equation with the given sides, and no wrong choice is", () => {
    const sides = (text: string) => {
      const parsed = parseEquation(text);
      return parsed.ok ? [parsed.value.left, parsed.value.right] : null;
    };
    const given = [mustParseEquation("5x - 2 = -x + 7").left, mustParseEquation("5x - 2 = -x + 7").right];
    const choices = byId("q33").text.en.choices;
    const matching = choices.filter((choice) => {
      const read = sides(choice);
      return read !== null && JSON.stringify(read) === JSON.stringify(given);
    });
    expect(matching).toEqual([correctChoice("q33", "en")]);
  });

  it("every one of these questions has the same correct position in both languages", () => {
    for (const id of ["q26", "q27", "q28", "q29", "q30", "q31", "q32", "q33"]) {
      expect(byId(id).text.fi.choices).toHaveLength(byId(id).text.en.choices.length);
    }
  });
});
