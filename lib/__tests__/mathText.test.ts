import { describe, expect, it } from "vitest";
import { keepMathTogether } from "../mathText";

const NB = " ";

describe("keepMathTogether", () => {
  it("ties a whole equation into one unbreakable piece", () => {
    expect(keepMathTogether("In 2x + 5 = 17, x is multiplied")).toBe(`In 2x${NB}+${NB}5${NB}=${NB}17, x is multiplied`);
  });

  it("handles brackets, minus signs and a negative start", () => {
    expect(keepMathTogether("−(x − 4) = −x + 4.")).toBe(`−(x${NB}−${NB}4)${NB}=${NB}−x${NB}+${NB}4.`);
    expect(keepMathTogether("5x + 2 = 3x + 12 gives 5x − 3x = 12 − 2")).toBe(
      `5x${NB}+${NB}2${NB}=${NB}3x${NB}+${NB}12 gives 5x${NB}−${NB}3x${NB}=${NB}12${NB}−${NB}2`,
    );
  });

  it("ties a division written with a colon, as in Finnish", () => {
    expect(keepMathTogether("ja sitten x = 12 : 2.")).toBe(`ja sitten x${NB}=${NB}12${NB}:${NB}2.`);
  });

  it("splits two expressions at the comma, so a line can still wrap there", () => {
    const out = keepMathTogether("x + 2.5 = 8.5, not x + 5 = 8.5");
    expect(out).toBe(`x${NB}+${NB}2.5${NB}=${NB}8.5, not x${NB}+${NB}5${NB}=${NB}8.5`);
    expect(out).toContain(", not");
  });

  it("leaves words, numbers and punctuation that are not maths alone", () => {
    for (const text of ["Do the same thing to both sides.", "Chapter 3 · Practising solving", "A fraction such as 3/4 stays", "Read: 25 % off"]) {
      expect(keepMathTogether(text)).toBe(text);
    }
  });

  it("does not change what is shown, only how it may wrap", () => {
    const text = "2x + 5 = 17 becomes 2x = 17 − 5, and then x = 12 : 2.";
    expect(keepMathTogether(text).replace(/ /g, " ")).toBe(text);
  });
});
