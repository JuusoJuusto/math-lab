import { describe, expect, it } from "vitest";
import { frac } from "../fraction";
import { mustParseEquation } from "../parse";
import { hasNoVariable, isSolution, isSolved, sameSolution, solveEquation, solvedValue, terminalState } from "../solve";

const eq = mustParseEquation;

describe("solveEquation", () => {
  it("finds a single whole-number solution", () => {
    expect(solveEquation(eq("2x + 5 = 17"))).toEqual({ kind: "one", value: frac(6) });
    expect(solveEquation(eq("x/4 = 6"))).toEqual({ kind: "one", value: frac(24) });
  });

  it("finds a solution with variables on both sides", () => {
    expect(solveEquation(eq("5x + 2 = 3x + 12"))).toEqual({ kind: "one", value: frac(5) });
    expect(solveEquation(eq("2x + 3 = 5x - 9"))).toEqual({ kind: "one", value: frac(4) });
  });

  it("finds negative solutions", () => {
    expect(solveEquation(eq("9x + 2 = 6x - 7"))).toEqual({ kind: "one", value: frac(-3) });
    expect(solveEquation(eq("-2x + 3 = 11"))).toEqual({ kind: "one", value: frac(-4) });
  });

  it("finds exact fractional solutions", () => {
    expect(solveEquation(eq("7x = 3"))).toEqual({ kind: "one", value: frac(3, 7) });
    expect(solveEquation(eq("0.1x = 0.03"))).toEqual({ kind: "one", value: frac(3, 10) });
  });

  it("recognises equations with no solution", () => {
    expect(solveEquation(eq("2x + 3 = 2x + 5"))).toEqual({ kind: "none" });
    expect(solveEquation(eq("3 = 5"))).toEqual({ kind: "none" });
    expect(solveEquation(eq("0x = 4"))).toEqual({ kind: "none" });
  });

  it("recognises equations with infinitely many solutions", () => {
    expect(solveEquation(eq("2x + 3 = 2x + 3"))).toEqual({ kind: "infinite" });
    expect(solveEquation(eq("2(x + 1) = 2x + 2"))).toEqual({ kind: "infinite" });
    expect(solveEquation(eq("4 = 4"))).toEqual({ kind: "infinite" });
  });

  it("compares solutions", () => {
    expect(sameSolution(solveEquation(eq("x = 3")), solveEquation(eq("2x = 6")))).toBe(true);
    expect(sameSolution(solveEquation(eq("x = 3")), solveEquation(eq("x = 4")))).toBe(false);
    expect(sameSolution(solveEquation(eq("x = 3")), solveEquation(eq("3 = 5")))).toBe(false);
    expect(sameSolution(solveEquation(eq("3 = 5")), solveEquation(eq("1 = 2")))).toBe(true);
  });
});

describe("solved and terminal states", () => {
  it("accepts x = number and number = x", () => {
    expect(isSolved(eq("x = 6"))).toBe(true);
    expect(isSolved(eq("6 = x"))).toBe(true);
    expect(isSolved(eq("x = -6"))).toBe(true);
    expect(solvedValue(eq("x = 6"))).toEqual(frac(6));
    expect(solvedValue(eq("6 = x"))).toEqual(frac(6));
  });

  it("does not treat partly simplified equations as solved", () => {
    expect(isSolved(eq("2x = 12"))).toBe(false);
    expect(isSolved(eq("x/3 = 5"))).toBe(false);
    expect(isSolved(eq("x + 1 = 5"))).toBe(false);
    expect(isSolved(eq("x = x + 1"))).toBe(false);
    expect(isSolved(eq("-x = 6"))).toBe(false);
    expect(solvedValue(eq("2x = 12"))).toBeNull();
  });

  it("classifies terminal states", () => {
    expect(terminalState(eq("x = 6"))).toBe("solved");
    expect(terminalState(eq("2x = 12"))).toBeNull();
    expect(terminalState(eq("3 = 5"))).toBe("no-solution");
    expect(terminalState(eq("4 = 4"))).toBe("infinite-solutions");
    expect(hasNoVariable(eq("3 = 5"))).toBe(true);
    expect(hasNoVariable(eq("x = 5"))).toBe(false);
  });
});

describe("isSolution", () => {
  it("checks a candidate by substitution", () => {
    expect(isSolution(eq("2x + 5 = 17"), frac(6))).toBe(true);
    expect(isSolution(eq("2x + 5 = 17"), frac(5))).toBe(false);
    expect(isSolution(eq("2x + 3 = 2x + 3"), frac(100))).toBe(true);
    expect(isSolution(eq("2x + 3 = 2x + 5"), frac(0))).toBe(false);
  });
});
