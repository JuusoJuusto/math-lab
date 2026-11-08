import { describe, expect, it } from "vitest";
import { frac } from "../fraction";
import {
  describeOperation,
  expressionTokens,
  formatAmount,
  formatEquation,
  formatFraction,
  operationLabel,
  sideTokens,
  toSpeech,
  tokensToText,
} from "../format";
import { operation } from "../operations";
import { mustParseEquation } from "../parse";

const eq = mustParseEquation;

describe("formatEquation", () => {
  it.each([
    ["2x + 5 = 17", "2x + 5 = 17"],
    ["x/3 + 4 = 9", "x/3 + 4 = 9"],
    ["-x + 4 = 2x - 8", "−x + 4 = 2x − 8"],
    ["-2x + 3 = 11", "−2x + 3 = 11"],
    ["x = -6", "x = −6"],
    ["2x/3 - 1 = 5", "2x/3 − 1 = 5"],
    ["-x/3 = 2", "−x/3 = 2"],
    ["3 = 5", "3 = 5"],
    ["0 = 0", "0 = 0"],
    ["x - x = 0", "0 = 0"],
    ["7x = 3", "7x = 3"],
  ])("writes %s as %s", (input, expected) => {
    expect(formatEquation(eq(input))).toBe(expected);
  });

  it("uses the true minus sign, never a hyphen", () => {
    expect(formatEquation(eq("3x - 5 = x - 7"))).not.toContain("-");
  });

  it("never prints floating-point artefacts", () => {
    const text = formatEquation(eq("0.1x + 0.2 = 0.3"));
    expect(text).not.toMatch(/\d\.\d/);
    expect(text).toBe("x/10 + 1/5 = 3/10");
  });
});

describe("tokens", () => {
  it("represents a fractional term as a stacked fraction", () => {
    expect(expressionTokens(eq("x/3 = 0").left)).toEqual([{ text: "x", denominator: "3", applied: undefined }]);
  });

  it("keeps the minus of a negative fraction in a prefix", () => {
    const [token] = expressionTokens(eq("-2x/3 = 0").left);
    expect(token).toMatchObject({ text: "2x", denominator: "3", prefix: "−" });
  });

  it("marks only the learner's operation as applied", () => {
    const tokens = sideTokens(eq("2x + 5 = 17").left, operation("subtract", 5));
    expect(tokens.filter((t) => t.applied).map((t) => t.text)).toEqual(["−", "5"]);
    expect(tokens.filter((t) => !t.applied).map((t) => t.text)).toEqual(["2x", "+", "5"]);
    expect(tokensToText(tokens)).toBe("2x + 5 − 5");
  });

  it("wraps negative operands in brackets and marks them applied", () => {
    const tokens = sideTokens(eq("x = 3").left, operation("multiply", -2));
    expect(tokensToText(tokens)).toBe("x × (−2)");
    expect(tokens.every((t, i) => (i === 0 ? !t.applied : t.applied))).toBe(true);
  });
});

describe("operation wording", () => {
  it("describes each kind of operation", () => {
    expect(describeOperation(operation("subtract", 5))).toBe("Subtract 5 from both sides");
    expect(describeOperation(operation("add", 3, true))).toBe("Add 3x to both sides");
    expect(describeOperation(operation("multiply", 4))).toBe("Multiply both sides by 4");
    expect(describeOperation(operation("divide", -2))).toBe("Divide both sides by −2");
  });

  it("formats amounts", () => {
    expect(formatAmount(operation("add", 1, true))).toBe("x");
    expect(formatAmount(operation("add", -2, true))).toBe("−2x");
    expect(formatAmount(operation("add", frac(1, 2)))).toBe("1/2");
    // A fraction of x is written x/4, never 1/4x, which would read as one over four x.
    expect(formatAmount(operation("subtract", frac(1, 4), true))).toBe("x/4");
    expect(formatAmount(operation("add", frac(3, 4), true))).toBe("3x/4");
    expect(formatAmount(operation("add", frac(-1, 2), true))).toBe("−x/2");
    expect(operationLabel(operation("divide", -2))).toBe("÷ (−2)");
    expect(operationLabel(operation("subtract", 5))).toBe("− 5");
  });

  it("formats fractions", () => {
    expect(formatFraction(frac(-7, 2))).toBe("−7/2");
    expect(formatFraction(frac(4, 2))).toBe("2");
  });
});

describe("toSpeech", () => {
  it("makes equations readable aloud", () => {
    expect(toSpeech("2x + 5 = 17")).toBe("2x plus 5 equals 17");
    expect(toSpeech("x/3 − 4 = 9")).toBe("x over 3 minus 4 equals 9");
    expect(toSpeech("(2x + 5) ÷ 2 = 12 × 3")).toBe("(2x plus 5) divided by 2 equals 12 times 3");
    expect(toSpeech("(−2x) ÷ (−2) = 8 ÷ (−2)")).toBe("(minus 2x) divided by (minus 2) equals 8 divided by (minus 2)");
  });
});
