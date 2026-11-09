import { describe, expect, it } from "vitest";
import { formatEquation } from "../format";
import { isWrittenSimply, judgeLine, readNote, withoutNote } from "../hand";
import { mustParseEquation } from "../parse";
import { add, frac } from "../fraction";
import { createRng } from "../rng";
import { isSolved, solveEquation, sameSolution } from "../solve";
import { solveWithTutor } from "../tutor";

const eq = mustParseEquation;
const judge = (above: string, typed: string, simple = true) => judgeLine(eq(above), typed, simple);

describe("judging a line written by hand", () => {
  it("accepts the next step of a solution, written however the learner writes it", () => {
    expect(judge("2x + 5 = 17", "2x = 12").kind).toBe("ok");
    expect(judge("2x + 5 = 17", "2x+5-5=17-5").kind).toBe("ok");
    expect(judge("2x + 5 = 17", "12 = 2x").kind).toBe("ok");
    expect(judge("2x = 12", "x = 6").kind).toBe("ok");
    expect(judge("2x = 12", "x = 12 : 2").kind).toBe("ok");
    expect(judge("x/3 = 4", "x = 12").kind).toBe("ok");
    expect(judge("-x = 5", "x = -5").kind).toBe("ok");
  });

  it("names the step that was taken", () => {
    const verdict = judge("2x + 5 = 17", "2x = 12");
    expect(verdict.kind === "ok" && verdict.operation).toMatchObject({ kind: "subtract", amount: { n: 5, d: 1 }, withVariable: false });
  });

  it("accepts a step that is not the tutor's: any valid route works", () => {
    // Dividing by 2 first leaves a fraction, but it is a true step.
    expect(judge("2x + 6 = 18", "x + 3 = 9").kind).toBe("ok");
    expect(judge("5x + 2 = 3x + 12", "2x + 2 = 12").kind).toBe("ok");
    expect(judge("5x + 2 = 3x + 12", "5x = 3x + 10").kind).toBe("ok");
  });

  it("says a line is the same as the one above, and that a jump skips steps", () => {
    expect(judge("2x + 5 = 17", "2x + 5 = 17").kind).toBe("same");
    expect(judge("2x + 5 = 17", "17 = 2x + 5").kind).toBe("same");
    expect(judge("2x + 5 = 17", "x = 6").kind).toBe("skips");
    expect(judge("3x - 5 = 7", "x = 4").kind).toBe("skips");
  });

  it("rejects a line that changes the solution", () => {
    expect(judge("2x + 5 = 17", "2x = 22").kind).toBe("wrong");
    expect(judge("2x + 5 = 17", "2x = 13").kind).toBe("wrong");
    expect(judge("2x + 5 = 17", "x = 7").kind).toBe("wrong");
  });

  it("accepts brackets opened and terms put together as a tidy line, but only when there is something to tidy", () => {
    expect(judgeLine(eq("3(x - 2) = 2x + 5"), "3x - 6 = 2x + 5", false).kind).toBe("tidy");
    expect(judgeLine(eq("x/2 + x/3 = 5"), "5x/6 = 5", false).kind).toBe("tidy");
    expect(judgeLine(eq("x/2 + x/3 = 5"), "3x + 2x = 30", false).kind).toBe("ok");
    expect(judgeLine(eq("3x - 6 = 2x + 5"), "3x - 6 = 2x + 5", true).kind).toBe("same");
  });

  it("works with decimals and negative numbers", () => {
    expect(judge("0.5x + 1.2 = 3.7", "5x + 12 = 37").kind).toBe("ok");
    expect(judge("-3x + 7 = -4x + 1", "x + 7 = 1").kind).toBe("ok");
    expect(judge("x + 7 = 1", "x = -6").kind).toBe("ok");
  });

  it("can follow the x terms to the other side and end with nothing left of x", () => {
    expect(judge("2x + 3 = 2x + 7", "3 = 7").kind).toBe("ok");
  });

  it("says what could not be read", () => {
    expect(judge("2x + 5 = 17", "").kind).toBe("unreadable");
    expect(judge("2x + 5 = 17", "2x + 5").kind).toBe("unreadable");
    expect(judge("2x + 5 = 17", "2y = 12")).toEqual({ kind: "unreadable", problem: "unknown-letter" });
  });

  it("ignores a note written beside the line, as in a notebook, and reads it as a step", () => {
    expect(withoutNote("2x + 5 = 17  || − 5")).toBe("2x + 5 = 17");
    expect(judge("2x + 5 = 17", "2x + 5 = 17 || − 5").kind).toBe("same");
    expect(readNote("2x + 5 = 17 || − 5")).toMatchObject({ kind: "subtract", amount: { n: 5, d: 1 } });
    expect(readNote("x/2 = 4 || · 2")).toMatchObject({ kind: "multiply", amount: { n: 2, d: 1 } });
    expect(readNote("2x = 12 || : 2")).toMatchObject({ kind: "divide" });
    expect(readNote("5x = 3x + 2 || − 3x")).toMatchObject({ kind: "subtract", withVariable: true });
    expect(readNote("2x = 12")).toBeNull();
  });

  it("knows when a line is already written simply", () => {
    expect(isWrittenSimply("2x + 5 = 17", eq("2x + 5 = 17"))).toBe(true);
    expect(isWrittenSimply("2x+5=17", eq("2x + 5 = 17"))).toBe(true);
    expect(isWrittenSimply("3(x - 2) = 2x + 5", eq("3(x - 2) = 2x + 5"))).toBe(false);
  });
});

describe("by hand, over thousands of equations", () => {
  it("accepts every line of the tutor's own solution, and rejects a changed version of each line", () => {
    const rng = createRng(555);
    const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
    let accepted = 0;
    let rejected = 0;
    for (let i = 0; i < 1500; i += 1) {
      const text = `${int(2, 9)}x ${int(0, 1) ? "+" : "-"} ${int(1, 15)} = ${int(-3, 8)}x ${int(0, 1) ? "+" : "-"} ${int(1, 30)}`;
      const start = eq(text);
      const solution = solveEquation(start);
      if (solution.kind !== "one") continue;

      let above = start;
      for (const step of solveWithTutor(start)) {
        const typed = formatEquation(step.after).replace(/−/g, "-");
        expect(judgeLine(above, typed, true).kind, `${formatEquation(above)} -> ${typed}`).toBe("ok");
        accepted += 1;

        // The same line with a number changed on one side only is a different equation.
        const changed = { left: step.after.left, right: { x: step.after.right.x, c: add(step.after.right.c, frac(1)) } };
        if (!sameSolution(solveEquation(step.after), solveEquation(changed))) {
          const verdict = judgeLine(above, formatEquation(changed).replace(/−/g, "-"), true).kind;
          expect(verdict, `${formatEquation(above)} -> ${formatEquation(changed)}`).not.toBe("ok");
          rejected += 1;
        }
        above = step.after;
      }
      expect(isSolved(above)).toBe(true);
    }
    expect(accepted).toBeGreaterThan(2500);
    expect(rejected).toBeGreaterThan(500);
  });
});

import { LEVELS } from "../levels";
import { startEquation } from "../prelude";
import { terminalState } from "../solve";

describe("every exercise of every level can be finished by hand", () => {
  it("accepts each line of the tutor's solution and ends in a terminal state, including no solution and infinitely many", () => {
    let finished = 0;
    for (const level of LEVELS.filter((item) => item.kind === "equations")) {
      for (const exercise of level.exercises) {
        let above = startEquation(exercise.equation);
        for (const step of solveWithTutor(above)) {
          const typed = formatEquation(step.after).replace(/−/g, "-");
          expect(judgeLine(above, typed, true).kind, `${exercise.id}: ${formatEquation(above)} -> ${typed}`).toBe("ok");
          above = step.after;
        }
        expect(terminalState(above), exercise.id).not.toBeNull();
        finished += 1;
      }
    }
    expect(finished).toBeGreaterThan(150);
  });
});

import { afterStep, planHand } from "../hand";
import { equalsEquation } from "../expression";

describe("the ways a task can be solved by hand", () => {
  it("is the whole equation when it is asked for in full, or when the equation is solved in one step", () => {
    const full = planHand("2x + 5 = 17", "full");
    expect(full).toMatchObject({ variant: "full", source: "2x + 5 = 17", given: [], step: null });
    expect(planHand("x + 5 = 17", "continue").variant).toBe("full");
    expect(planHand("x + 5 = 17", "write").variant).toBe("full");
  });

  it("gives the first lines of the tutor's solution and leaves the rest, for continuing", () => {
    const plan = planHand("3x + 2 = 5x - 8", "continue");
    expect(plan.variant).toBe("continue");
    expect(plan.given.length).toBeGreaterThanOrEqual(1);
    const path = solveWithTutor(plan.original);
    expect(plan.given.length).toBeLessThan(path.length);
    plan.given.forEach((line, index) => expect(equalsEquation(line.equation, path[index].after)).toBe(true));
  });

  it("asks for one step and knows the equation that step gives, for writing", () => {
    const plan = planHand("2x + 5 = 17", "write", 0);
    expect(plan.variant).toBe("write");
    expect(plan.step).toMatchObject({ kind: "subtract", amount: { n: 5, d: 1 } });
    expect(formatEquation(afterStep(plan.equation, plan.step!)!)).toBe("2x = 12");
    // A later step starts from the line before it.
    const later = planHand("2x + 5 = 17", "write", 1);
    expect(formatEquation(later.equation)).toBe("2x = 12");
    expect(later.step).toMatchObject({ kind: "divide" });
  });

  it("works for every exercise of every level, whatever step is asked for", () => {
    let plans = 0;
    for (const level of LEVELS.filter((item) => item.kind === "equations")) {
      for (const exercise of level.exercises) {
        for (const variant of ["full", "continue", "write"] as const) {
          for (const pick of [0, 1, 2]) {
            const plan = planHand(exercise.equation, variant, pick);
            expect(sameSolution(solveEquation(plan.equation), solveEquation(plan.original)), `${exercise.id} ${variant}`).toBe(true);
            for (const line of plan.given) expect(sameSolution(solveEquation(line.equation), solveEquation(plan.original))).toBe(true);
            if (plan.step) expect(afterStep(plan.equation, plan.step)).not.toBeNull();
            plans += 1;
          }
        }
      }
    }
    expect(plans).toBeGreaterThan(1000);
  });
});

import { pickFrom, roundVariant } from "../hand";

describe("how a round is shared between the buttons and writing by hand", () => {
  it("uses the buttons for the first exercise and writing by hand for four in five, in rotating formats", () => {
    const variants = [0, 1, 2, 3, 4].map((index) => roundVariant(index, 5));
    expect(variants).toEqual([null, "continue", "full", "write", "full"]);
    expect(variants.filter((variant) => variant !== null).length / variants.length).toBe(0.8);
  });

  it("writes whole solutions most of the time, so the learner has to solve fully", () => {
    const variants = Array.from({ length: 20 }, (_, index) => roundVariant(index, 20)).filter((variant) => variant !== null);
    expect(variants.filter((variant) => variant === "full").length).toBeGreaterThanOrEqual(variants.length * 0.45);
    expect(new Set(variants)).toEqual(new Set(["continue", "full", "write"]));
  });

  it("keeps a one-exercise round on the buttons, and picks a stable number from a name", () => {
    expect(roundVariant(0, 1)).toBeNull();
    expect(pickFrom("both-03")).toBe(pickFrom("both-03"));
    expect(pickFrom("both-03")).not.toBe(pickFrom("both-04"));
  });
});
