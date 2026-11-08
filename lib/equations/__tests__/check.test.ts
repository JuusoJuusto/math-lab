import { describe, expect, it } from "vitest";
import { checkSolution } from "../check";
import { frac } from "../fraction";
import { mustParseEquation } from "../parse";

const eq = mustParseEquation;
const texts = (equationText: string, value: number | [number, number]) =>
  checkSolution(eq(equationText), Array.isArray(value) ? frac(value[0], value[1]) : frac(value)).lines.map((line) => line.text);

describe("checkSolution", () => {
  it("verifies the example from the lesson: 2x + 5 = 17 with x = 6", () => {
    const check = checkSolution(eq("2x + 5 = 17"), frac(6));
    expect(check.lines.map((line) => line.text)).toEqual(["2x + 5 = 17", "2(6) + 5 = 17", "12 + 5 = 17", "17 = 17"]);
    expect(check.holds).toBe(true);
    expect(check.leftValue).toEqual(frac(17));
    expect(check.rightValue).toEqual(frac(17));
  });

  it("labels each line", () => {
    const labels = checkSolution(eq("2x + 5 = 17"), frac(6)).lines.map((line) => line.label);
    expect(labels).toEqual(["Original equation", "Replace x with 6", "Do the multiplication first", "Work out each side"]);
  });

  it("detects a wrong answer instead of confirming it", () => {
    const check = checkSolution(eq("2x + 5 = 17"), frac(5));
    expect(check.holds).toBe(false);
    expect(check.lines.at(-1)?.text).toBe("15 = 17");
  });

  it("verifies variables on both sides", () => {
    expect(texts("5x + 2 = 3x + 12", 5)).toEqual([
      "5x + 2 = 3x + 12",
      "5(5) + 2 = 3(5) + 12",
      "25 + 2 = 15 + 12",
      "27 = 27",
    ]);
  });

  it("brackets negative values and handles negative constants", () => {
    expect(texts("9x + 2 = 6x - 7", -3)).toEqual([
      "9x + 2 = 6x − 7",
      "9(−3) + 2 = 6(−3) − 7",
      "−27 + 2 = −18 − 7",
      "−25 = −25",
    ]);
  });

  it("handles a coefficient of -1 and an x-term that cancels to zero", () => {
    expect(texts("-x + 4 = 2x - 8", 4)).toEqual([
      "−x + 4 = 2x − 8",
      "−(4) + 4 = 2(4) − 8",
      "−4 + 4 = 8 − 8",
      "0 = 0",
    ]);
  });

  it("handles divided coefficients", () => {
    expect(texts("x/3 + 4 = 9", 15)).toEqual(["x/3 + 4 = 9", "15/3 + 4 = 9", "5 + 4 = 9", "9 = 9"]);
  });

  it("merges identical lines for the simplest equation", () => {
    expect(texts("x = 6", 6)).toEqual(["x = 6", "6 = 6"]);
  });

  it("checks fractional solutions exactly", () => {
    const check = checkSolution(eq("7x = 3"), frac(3, 7));
    expect(check.holds).toBe(true);
    expect(check.lines[1].text).toBe("7(3/7) = 3");
  });

  it("agrees with the equality of both sides, for any candidate", () => {
    for (let candidate = -10; candidate <= 10; candidate += 1) {
      const check = checkSolution(eq("3x - 4 = 20"), frac(candidate));
      expect(check.holds).toBe(candidate === 8);
    }
  });
});
