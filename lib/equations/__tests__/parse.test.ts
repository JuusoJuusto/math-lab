import { describe, expect, it } from "vitest";
import { frac } from "../fraction";
import { formatEquation } from "../format";
import { mustParseEquation, parseEquation, parseExpression } from "../parse";

function parsed(text: string) {
  const result = parseEquation(text);
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

describe("parseEquation", () => {
  it("parses a two-step equation", () => {
    const eq = parsed("2x + 5 = 17");
    expect(eq.left).toEqual({ x: frac(2), c: frac(5) });
    expect(eq.right).toEqual({ x: frac(0), c: frac(17) });
  });

  it("parses division as a fractional coefficient", () => {
    expect(parsed("x/3 + 4 = 9").left.x).toEqual(frac(1, 3));
    expect(parsed("2x/3 = 4").left.x).toEqual(frac(2, 3));
    expect(parsed("x ÷ 4 = 6").left.x).toEqual(frac(1, 4));
  });

  it("expands brackets with the distributive property", () => {
    const eq = parsed("3(x - 2) = 2x + 5");
    expect(eq.left).toEqual({ x: frac(3), c: frac(-6) });
    expect(eq.right).toEqual({ x: frac(2), c: frac(5) });
  });

  it("accepts typographic symbols and spacing variations", () => {
    expect(formatEquation(parsed("2 × x − 3 = 7"))).toBe("2x − 3 = 7");
    expect(formatEquation(parsed("2*x-3=7"))).toBe("2x − 3 = 7");
    expect(formatEquation(parsed("  X+1  =  2 "))).toBe("x + 1 = 2");
  });

  it("combines like terms and handles unary minus", () => {
    expect(formatEquation(parsed("x + 2x - 4 + 1 = 0"))).toBe("3x − 3 = 0");
    expect(formatEquation(parsed("-x + 4 = 2x - 8"))).toBe("−x + 4 = 2x − 8");
    expect(formatEquation(parsed("--x = 3"))).toBe("x = 3");
    expect(formatEquation(parsed("5 - (x - 2) = 1"))).toBe("−x + 7 = 1");
  });

  it("parses decimals exactly", () => {
    expect(parsed("0.5x = 2").left.x).toEqual(frac(1, 2));
    expect(parsed("0.25x + 0.75 = 1").left.c).toEqual(frac(3, 4));
  });

  it.each([
    ["", "Type an equation"],
    ["2x + 5", "equals sign"],
    ["2x + 5 = 17 = 3", "unexpected"],
    ["x * x = 4", "non-linear"],
    ["x * (x + 1) = 4", "non-linear"],
    ["4 / x = 2", "x is not supported"],
    ["x / 0 = 2", "zero"],
    ["x / (3 - 3) = 2", "zero"],
    ["y + 1 = 2", "not part of an equation"],
    ["(x + 1 = 2", "not closed"],
    ["2x + = 3", "missing"],
    ["2 3 = x", "unexpected"],
    ["1.23456x = 1", "decimal places"],
    ["1..2x = 3", "not a valid number"],
    ["999999999999x = 1", "too large"],
  ])("rejects %j", (text, fragment) => {
    const result = parseEquation(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message.toLowerCase()).toContain(fragment.toLowerCase());
  });
});

describe("parseExpression", () => {
  it("parses a single expression", () => {
    const result = parseExpression("3x - 4");
    expect(result.ok && result.value).toEqual({ x: frac(3), c: frac(-4) });
  });

  it("rejects an equals sign", () => {
    expect(parseExpression("3x = 4").ok).toBe(false);
  });
});

describe("mustParseEquation", () => {
  it("returns the equation for valid text", () => {
    expect(formatEquation(mustParseEquation("x + 5 = 12"))).toBe("x + 5 = 12");
  });

  it("throws a descriptive error for invalid text", () => {
    expect(() => mustParseEquation("x +")).toThrow(/Invalid equation "x \+"/);
  });
});
