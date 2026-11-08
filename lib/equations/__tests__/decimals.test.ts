import { describe, expect, it } from "vitest";
import { formatEquation, localiseDecimals } from "../format";
import { getLevel } from "../levels";
import { mustParseEquation, parseEquation } from "../parse";
import { decimalFactor, hasDecimals, makePrelude, preludeTarget, startEquation } from "../prelude";
import { preludeWords } from "../prelude-words";
import { createSession, sessionReducer, currentPreludeStep } from "../session";
import { solveEquation, sameSolution } from "../solve";

const level = getLevel("fractions")!;
const decimalExercises = level.exercises.filter((exercise) => hasDecimals(exercise.equation));

describe("equations written with decimals", () => {
  it("are recognised by a point or a comma between digits, and nothing else", () => {
    expect(hasDecimals("0.5x + 1.2 = 3.7")).toBe(true);
    expect(hasDecimals("0,5x + 1,2 = 3,7")).toBe(true);
    for (const text of ["x/2 + 1 = 4", "2x + 5 = 17", "3(x - 2) = 6", "x = 4"]) expect(hasDecimals(text), text).toBe(false);
  });

  it("use 10 for one decimal place and 100 for two", () => {
    expect(decimalFactor("0.5x + 1.2 = 3.7")).toBe(10);
    expect(decimalFactor("0.25x + 1 = 2.5")).toBe(100);
    expect(() => decimalFactor("x + 1 = 2")).toThrow();
  });

  it("start the balance moves from the same equation with every term multiplied: 0.5x + 1.2 = 3.7 becomes 5x + 12 = 37", () => {
    expect(formatEquation(startEquation("0.5x + 1.2 = 3.7"))).toBe("5x + 12 = 37");
    expect(formatEquation(startEquation("0.25x + 1 = 2.5"))).toBe("25x + 100 = 250");
    expect(formatEquation(startEquation("2.4 - 0.3x = 0.9"))).toBe("−3x + 24 = 9");
  });

  it("are the same equation as the one the learner started with: the answer does not change", () => {
    for (const exercise of decimalExercises) {
      const written = parseEquation(exercise.equation);
      expect(written.ok).toBe(true);
      if (!written.ok) continue;
      expect(sameSolution(solveEquation(written.value), solveEquation(startEquation(exercise.equation))), exercise.id).toBe(true);
    }
  });

  it("has one clean-up question each, with the right answer and three wrong ones that are all different equations", () => {
    expect(decimalExercises.length).toBeGreaterThanOrEqual(4);
    for (const exercise of decimalExercises) {
      const { steps, source } = makePrelude(exercise.equation);
      expect(steps, exercise.id).toHaveLength(1);
      const [step] = steps;
      expect(step.kind).toBe("decimals");
      expect(step.factor).toBe(decimalFactor(exercise.equation));
      expect(step.options).toHaveLength(4);
      expect(source).toBe(exercise.equation.replace(/-/g, "−"));

      const right = step.options[step.correct];
      expect(right.reason).toBeNull();
      expect(right.text).toBe(step.result);
      expect(parseEquation(right.text.replace(/−/g, "-")).ok).toBe(true);
      expect(mustParseEquation(right.text.replace(/−/g, "-"))).toEqual(preludeTarget(exercise.equation));

      const texts = step.options.map((option) => option.text);
      expect(new Set(texts).size, exercise.id).toBe(4);
      // A wrong answer is a different equation with a different solution, never an alternative right answer.
      const answer = solveEquation(preludeTarget(exercise.equation));
      step.options.forEach((option, index) => {
        if (index === step.correct) return;
        const parsed = parseEquation(option.text.replace(/−/g, "-"));
        expect(parsed.ok, option.text).toBe(true);
        if (parsed.ok) expect(sameSolution(answer, solveEquation(parsed.value)), `${exercise.id}: ${option.text}`).toBe(false);
        expect(["decimal-term", "decimal-point", "sign", "arithmetic"]).toContain(option.reason);
      });
    }
  });

  it("are worked through in a session: answer the question, then solve the whole-number equation", () => {
    const source = "0.5x + 1.2 = 3.7";
    let state = createSession(preludeTarget(source), "en", makePrelude(source));
    const step = currentPreludeStep(state)!;
    expect(step.kind).toBe("decimals");

    // A wrong choice is a mistake, explained by its reason, and tried again.
    const wrong = step.options.findIndex((option) => option.reason === "decimal-term");
    state = sessionReducer(state, { type: "prelude", choice: wrong });
    expect(state.mistakes).toBe(1);
    expect(state.notice?.body[0]).toContain("Every term on both sides must be multiplied");

    state = sessionReducer(state, { type: "prelude", choice: step.correct });
    expect(state.preludeIndex).toBe(1);
    expect(state.notice?.body[0]).toContain("Multiplying every term by 10");
    expect(formatEquation(state.current)).toBe("5x + 12 = 37");
  });

  it("explain themselves in Finnish with decimal commas", () => {
    const [step] = makePrelude("0.5x + 1.2 = 3.7").steps;
    const words = preludeWords("fi");
    expect(words.stage(step)).toBe("Poista desimaalit");
    expect(words.question(step)).toBe("Kerro yhtälön 0,5x + 1,2 = 3,7 jokainen termi luvulla 10, jotta desimaalit häviävät. Mitä saat?");
    expect(words.right(step)).toContain("0,5x + 1,2 = 3,7 muuttuu muotoon 5x + 12 = 37");
    expect(words.right(step)).not.toMatch(/\d\.\d/);
    expect(localiseDecimals("0.5x + 1.2 = 3.7", "fi")).toBe("0,5x + 1,2 = 3,7");
    expect(localiseDecimals("0.5x + 1.2 = 3.7", "en")).toBe("0.5x + 1.2 = 3.7");
  });

  it("do not change other equations: no decimals means no decimal step", () => {
    for (const text of ["3(x - 2) = 6", "x/2 + x/3 = 5", "2x + 5 = 17"]) {
      expect(makePrelude(text).steps.every((step) => step.kind !== "decimals"), text).toBe(true);
    }
  });
});
