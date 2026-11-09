import { describe, expect, it } from "vitest";
import { isWorkedOut, needsWorkingOut } from "../answer";

describe("isWorkedOut: has everything been counted?", () => {
  it("accepts a line where each side is one x term and one number at most", () => {
    for (const line of ["2x = 12", "x = 6", "x/2 = 5", "2x + 3 = 17", "12 = 2x", "0,5x = 3", "3x/4 = 6", "x = -3", "x = −3", "3 − x = 1", "x = 3/2", "−2x + 5 = 1", "x/3 + 2 = 9"]) {
      expect(isWorkedOut(line), line).toBe(true);
    }
  });

  it("ignores a note written beside the line", () => {
    expect(isWorkedOut("2x = 12 || − 5")).toBe(true);
    expect(isWorkedOut("x = 6 || : 2")).toBe(true);
  });

  it("refuses a side with arithmetic still to do", () => {
    for (const line of ["2x = 17 − 5", "2x + 3 − 3 = 17 − 3", "5 + 7 = x", "x = 12 : 2", "x = 12/2 + 1", "x = 2 · 3", "x = 12 ÷ 2"]) {
      expect(isWorkedOut(line), line).toBe(false);
    }
  });

  it("refuses like terms that have not been put together", () => {
    expect(isWorkedOut("2x + 3x = 10")).toBe(false);
    expect(isWorkedOut("5x − 2x = 9")).toBe(false);
    expect(isWorkedOut("x + 3 + 4 = 9")).toBe(false);
  });

  it("refuses brackets, because they are not opened yet", () => {
    expect(isWorkedOut("3(x + 1) = 9")).toBe(false);
    expect(isWorkedOut("(x + 1)/2 = 4")).toBe(false);
  });

  it("refuses a fraction that is not in its simplest form", () => {
    for (const line of ["2x/4 = 3", "x = 6/4", "x = 4/2", "x = 3/1", "x/1 = 5", "x = 0/5"]) {
      expect(isWorkedOut(line), line).toBe(false);
    }
  });

  it("refuses what is not an equation, or is unfinished", () => {
    for (const line of ["", "2x", "= 5", "2x = ", "x = 5 = 5", "2x = 5 −", "x = abc"]) {
      expect(isWorkedOut(line), line).toBe(false);
    }
  });
});

describe("needsWorkingOut: is the number in the last line counted?", () => {
  it("is not needed for a plain number, a decimal or a fraction in its simplest form", () => {
    for (const line of ["x = 6", "6 = x", "x = −2", "x = -2", "x = 0,5", "x = 0.5", "x = 3/2", "x = −7/3", "x = 0", "x = 12"]) {
      expect(needsWorkingOut(line), line).toBe(false);
    }
  });

  it("is needed while a sum, a quotient or a product is still to be worked out", () => {
    for (const line of ["x = 12 : 2", "x = 17 − 5", "x = 3 + 4", "x = 2 · 3", "x = 12/2 + 1", "x = 1/2 + 1/3"]) {
      expect(needsWorkingOut(line), line).toBe(true);
    }
  });

  it("is needed for a fraction that can be reduced, and for a fraction that is a whole number", () => {
    for (const line of ["x = 6/4", "x = 4/2", "x = 3/1", "x = 0/5", "x = −10/4"]) {
      expect(needsWorkingOut(line), line).toBe(true);
    }
  });

  it("works whichever side x is on, and ignores a note beside the line", () => {
    expect(needsWorkingOut("12 : 2 = x")).toBe(true);
    expect(needsWorkingOut("x = 12 : 2 || : 2")).toBe(true);
    expect(needsWorkingOut("x = 6 || : 2")).toBe(false);
  });

  it("has nothing to say about a line that is not x alone", () => {
    expect(needsWorkingOut("2x = 12")).toBe(false);
    expect(needsWorkingOut("garbage")).toBe(false);
    expect(needsWorkingOut("")).toBe(false);
  });
});
