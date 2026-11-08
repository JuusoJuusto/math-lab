import { describe, expect, it } from "vitest";
import {
  FRACTION_LIMIT,
  FractionRangeError,
  add,
  compare,
  div,
  equals,
  frac,
  isInteger,
  isUnitFraction,
  mul,
  neg,
  sign,
  sub,
  toNumber,
} from "../fraction";

describe("frac", () => {
  it("reduces to lowest terms", () => {
    expect(frac(2, 4)).toEqual({ n: 1, d: 2 });
    expect(frac(-6, 9)).toEqual({ n: -2, d: 3 });
  });

  it("keeps the sign on the numerator", () => {
    expect(frac(3, -4)).toEqual({ n: -3, d: 4 });
    expect(frac(-3, -4)).toEqual({ n: 3, d: 4 });
  });

  it("represents zero in a single form, never as -0", () => {
    expect(frac(0, 5)).toEqual({ n: 0, d: 1 });
    expect(Object.is(frac(0, -5).n, 0)).toBe(true);
    expect(Object.is(neg(frac(0)).n, 0)).toBe(true);
  });

  it("rejects a zero denominator", () => {
    expect(() => frac(1, 0)).toThrow(RangeError);
  });

  it("rejects non-integer parts", () => {
    expect(() => frac(0.5)).toThrow(TypeError);
    expect(() => frac(1, 0.5)).toThrow(TypeError);
    expect(() => frac(Number.NaN)).toThrow(TypeError);
    expect(() => frac(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });

  it("refuses values too large to stay exact", () => {
    expect(() => frac(FRACTION_LIMIT + 1)).toThrow(FractionRangeError);
    expect(() => frac(1, FRACTION_LIMIT + 1)).toThrow(FractionRangeError);
    expect(frac(FRACTION_LIMIT)).toEqual({ n: FRACTION_LIMIT, d: 1 });
  });
});

describe("arithmetic", () => {
  it("is exact where floating point is not", () => {
    // 0.1 + 0.2 !== 0.3 in floating point.
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(equals(add(frac(1, 10), frac(2, 10)), frac(3, 10))).toBe(true);
  });

  it("adds, subtracts, multiplies and divides", () => {
    expect(add(frac(1, 2), frac(1, 3))).toEqual(frac(5, 6));
    expect(sub(frac(1, 2), frac(3, 4))).toEqual(frac(-1, 4));
    expect(mul(frac(-2, 3), frac(9, 4))).toEqual(frac(-3, 2));
    expect(div(frac(3, 4), frac(-3, 8))).toEqual(frac(-2));
  });

  it("throws on division by zero", () => {
    expect(() => div(frac(1), frac(0))).toThrow(RangeError);
  });

  it("compares and signs correctly", () => {
    expect(compare(frac(1, 3), frac(1, 2))).toBe(-1);
    expect(compare(frac(2, 4), frac(1, 2))).toBe(0);
    expect(compare(frac(-1, 3), frac(-1, 2))).toBe(1);
    expect(sign(frac(-7))).toBe(-1);
    expect(sign(frac(0))).toBe(0);
    expect(sign(frac(7))).toBe(1);
  });

  it("describes its shape", () => {
    expect(isInteger(frac(4, 2))).toBe(true);
    expect(isInteger(frac(1, 2))).toBe(false);
    expect(isUnitFraction(frac(1, 3))).toBe(true);
    expect(isUnitFraction(frac(-1, 3))).toBe(true);
    expect(isUnitFraction(frac(2, 3))).toBe(false);
    expect(isUnitFraction(frac(1))).toBe(false);
    expect(toNumber(frac(3, 4))).toBe(0.75);
  });
});
