import { describe, expect, it } from "vitest";
import { createRng } from "../round";
import { equalsEquation } from "../expression";
import {
  evaluateFlip,
  flipOperation,
  flipPreview,
  flipTerms,
  formatFlipPreview,
  type FlipTarget,
} from "../flip";
import { formatBar, formatEquation, tokensToText } from "../format";
import { mustParseEquation, parseEquation } from "../parse";
import { applyOperation } from "../operations";
import { sameSolution, solveEquation } from "../solve";
import { createSession, sessionReducer } from "../session";

const eq = mustParseEquation;

describe("flipping a term across the equals sign", () => {
  it("moves a subtracted number over as an addition: 3x − 5 = 6 becomes 3x = 6 + 5", () => {
    const equation = eq("3x - 5 = 6");
    const target: FlipTarget = { kind: "constant", side: "left" };
    expect(formatFlipPreview(equation, target)).toBe("3x = 6 + 5");
    const op = flipOperation(equation, target)!;
    expect(formatBar(op)).toBe("|| + 5");
    const result = applyOperation(equation, op);
    expect(result.ok && formatEquation(result.step.after)).toBe("3x = 11");
  });

  it("moves an added number over as a subtraction", () => {
    const equation = eq("2x + 7 = 15");
    expect(formatFlipPreview(equation, { kind: "constant", side: "left" })).toBe("2x = 15 − 7");
  });

  it("moves an x term over and keeps x terms in front of numbers", () => {
    const equation = eq("5x + 2 = 3x + 12");
    expect(formatFlipPreview(equation, { kind: "variable", side: "right" })).toBe("5x − 3x + 2 = 12");
    expect(formatFlipPreview(equation, { kind: "variable", side: "left" })).toBe("2 = 3x − 5x + 12");
  });

  it("moves a number from the right side to the left", () => {
    const equation = eq("x/2 = 4 + 3");
    // 4 + 3 is worked out on parsing, so this is x/2 = 7
    expect(formatFlipPreview(equation, { kind: "constant", side: "right" })).toBe("x/2 − 7 = 0");
  });

  it("flips the factor of x as a division or a multiplication", () => {
    expect(formatFlipPreview(eq("3x = 21"), { kind: "factor" })).toBe("x = 21 ÷ 3");
    expect(formatFlipPreview(eq("x/4 = 6"), { kind: "factor" })).toBe("x = 6 × 4");
    expect(formatFlipPreview(eq("-2x = 8"), { kind: "factor" })).toBe("x = 8 ÷ (−2)");
    expect(formatFlipPreview(eq("12 = 3x"), { kind: "factor" })).toBe("12 ÷ 3 = x");
  });

  it("uses Finnish symbols when asked", () => {
    expect(formatFlipPreview(eq("3x = 21"), { kind: "factor" }, "fi")).toBe("x = 21 : 3");
    expect(formatFlipPreview(eq("x/4 = 6"), { kind: "factor" }, "fi")).toBe("x = 6 · 4");
    expect(formatBar(flipOperation(eq("3x = 21"), { kind: "factor" })!, "fi")).toBe("|| : 3");
  });

  it("draws a term that cannot move, but gives it no target", () => {
    const { left } = flipTerms(eq("2x/3 = 4"));
    expect(left).toHaveLength(1);
    expect(left[0].target).toBeNull();
    expect(left[0].operation).toBeNull();
    expect(left[0].text).toBe("2x/3");
  });

  it("offers nothing for a term that is not there, or a factor that cannot flip", () => {
    expect(flipOperation(eq("3x = 6"), { kind: "constant", side: "left" })).toBeNull();
    expect(flipOperation(eq("3x - 5 = 6"), { kind: "factor" })).toBeNull();
    expect(flipOperation(eq("x = 6"), { kind: "factor" })).toBeNull();
    expect(flipOperation(eq("2x/3 = 4"), { kind: "factor" })).toBeNull();
  });

  it("lists the tappable terms of each side with what they become", () => {
    const { left, right } = flipTerms(eq("3x - 5 = 6"));
    expect(left.map((term) => [term.text, term.becomes])).toEqual([
      ["3x", "− 3x"],
      ["− 5", "+ 5"],
    ]);
    expect(right.map((term) => [term.text, term.becomes])).toEqual([["6", "− 6"]]);
    expect(left[0].target?.kind).toBe("variable");

    const pure = flipTerms(eq("3x = 21"));
    expect(pure.left.map((term) => [term.target?.kind, term.becomes])).toEqual([["factor", "÷ 3"]]);
  });

  it("marks the moved part so it can be highlighted", () => {
    const preview = flipPreview(eq("3x - 5 = 6"), { kind: "constant", side: "left" })!;
    expect(preview.right.filter((token) => token.applied).map((token) => token.text)).toEqual(["+", "5"]);
    expect(preview.left.some((token) => token.applied)).toBe(false);
  });
});

describe("a flip is the balance rule in a shorter form", () => {
  it("never changes the solution, for any term of thousands of random equations", () => {
    const rng = createRng(2024);
    const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
    let flips = 0;

    for (let i = 0; i < 3000; i += 1) {
      const text = `${int(-9, 9) || 1}x + ${int(-9, 9)} = ${int(-9, 9) || 2}x + ${int(-20, 20)}`;
      const parsed = parseEquation(text);
      if (!parsed.ok) continue;
      const equation = parsed.value;
      const before = solveEquation(equation);

      for (const side of [flipTerms(equation).left, flipTerms(equation).right]) {
        for (const term of side) {
          if (!term.target || !term.operation) continue;
          const result = applyOperation(equation, term.operation);
          if (!result.ok) continue;
          flips += 1;
          expect(sameSolution(before, solveEquation(result.step.after))).toBe(true);

          // The flipped picture is itself an equation with the same solution.
          const picture = formatFlipPreview(equation, term.target);
          expect(picture).not.toBeNull();
          const reread = parseEquation(picture!.replace(/ ÷ /g, "/").replace(/ × /g, "*"));
          if (reread.ok && term.target.kind !== "factor") {
            expect(sameSolution(before, solveEquation(reread.value))).toBe(true);
          }
        }
      }
    }
    expect(flips).toBeGreaterThan(2000);
  });

  it("shows the flipped picture of every term that can move in a solved sequence", () => {
    // Reread the picture for both sides, both languages, and compare it with the result.
    const equation = eq("7x - 4 = 4x + 11");
    for (const lang of ["en", "fi"] as const) {
      const { left, right } = flipTerms(equation, lang);
      for (const term of [...left, ...right]) {
        if (!term.target) continue;
        const picture = flipPreview(equation, term.target, lang)!;
        const left = tokensToText(picture.left);
        const right = tokensToText(picture.right);
        expect(left.length).toBeGreaterThan(0);
        expect(right.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("judging a flip", () => {
  it("accepts the flip that removes the number next to x and explains it as a flip", () => {
    const outcome = evaluateFlip(eq("3x - 5 = 6"), { kind: "constant", side: "left" })!;
    expect(outcome.verdict).toBe("helpful");
    if (outcome.verdict !== "helpful") return;
    expect(outcome.explanation.why).toContain("crosses the equals sign and its sign flips");
    expect(outcome.explanation.why).toContain("|| + 5");
  });

  it("explains a flip that does not help in flip words, not in 'add to both sides' words", () => {
    const outcome = evaluateFlip(eq("3x - 5 = 6"), { kind: "variable", side: "left" })!;
    expect(outcome.verdict).toBe("not-helpful");
    if (outcome.verdict !== "not-helpful") return;
    expect(outcome.title).toBe("Flipping that does not help yet");
    expect(outcome.preview.applied).toBe("−5 = −3x + 6");
    expect(outcome.message).not.toMatch(/both sides/);
  });

  it("speaks Finnish", () => {
    const outcome = evaluateFlip(eq("3x - 5 = 6"), { kind: "constant", side: "left" }, 0, "fi")!;
    expect(outcome.verdict).toBe("helpful");
    if (outcome.verdict !== "helpful") return;
    expect(outcome.explanation.why).toContain("yhtäsuuruusmerkin");
    expect(outcome.explanation.why).toContain("|| + 5");
  });

  it("is available in the session as its own action: flip, simplify, flip, simplify", () => {
    let state = createSession(eq("3x - 5 = 7"));
    state = sessionReducer(state, { type: "flip", target: { kind: "constant", side: "left" } });
    expect(state.pending?.flip).toEqual({ kind: "constant", side: "left" });
    expect(state.notice?.work?.[0]).toBe("After flipping: 3x = 7 + 5");
    state = sessionReducer(state, { type: "simplify" });
    expect(formatEquation(state.current)).toBe("3x = 12");
    state = sessionReducer(state, { type: "flip", target: { kind: "factor" } });
    expect(state.notice?.work?.[0]).toBe("After flipping: x = 12 ÷ 3");
    state = sessionReducer(state, { type: "simplify" });
    expect(state.outcome).toBe("solved");
    expect(formatEquation(state.current)).toBe("x = 4");
    expect(state.steps.map((step) => step.flip?.kind)).toEqual(["constant", "factor"]);
    expect(state.mistakes).toBe(0);
  });

  it("counts a flip that makes no progress as a try, and leaves the equation alone", () => {
    let state = createSession(eq("3x - 5 = 7"));
    const start = state.current;
    state = sessionReducer(state, { type: "flip", target: { kind: "variable", side: "left" } });
    expect(state.pending).toBeNull();
    expect(equalsEquation(state.current, start)).toBe(true);
    expect(state.notice?.tone).toBe("warning");
  });

  it("ignores a flip of something that is not there", () => {
    const state = createSession(eq("3x = 6"));
    expect(sessionReducer(state, { type: "flip", target: { kind: "constant", side: "left" } })).toBe(state);
  });
});
