import { describe, expect, it } from "vitest";
import { equalsEquation } from "../expression";
import { formatEquation } from "../format";
import { parseEquation, parseExpression } from "../parse";
import { operation } from "../operations";
import { makePrelude, preludeTarget, splitTerms } from "../prelude";
import {
  canGetHint,
  canUndo,
  createSession,
  currentPreludeStep,
  preludeShown,
  sessionReducer,
  type SessionState,
} from "../session";

const plain = (text: string) => text.replace(/−/g, "-");

describe("splitTerms", () => {
  it("splits at the top level only", () => {
    expect(splitTerms("x/2 - 3 + x")).toEqual(["x/2", "-3", "x"]);
    expect(splitTerms("-2x + 5")).toEqual(["-2x", "5"]);
    expect(splitTerms("3(x - 2) + 1")).toEqual(["3(x-2)", "1"]);
    expect(splitTerms("x")).toEqual(["x"]);
  });
});

describe("the prelude of an equation as written", () => {
  it("has no steps for an equation that is already simple", () => {
    for (const text of ["2x + 5 = 17", "x/3 + 4 = 9", "5x - 8 = 2x - 2", "x = 4"]) {
      expect(makePrelude(text).steps, text).toEqual([]);
    }
  });

  it("opens brackets first, then simplifies: 3(x − 2) = 2x + 5", () => {
    const prelude = makePrelude("3(x - 2) = 2x + 5");
    expect(prelude.source).toBe("3(x − 2) = 2x + 5");
    expect(prelude.steps).toHaveLength(1);
    const [step] = prelude.steps;
    expect(step.kind).toBe("expand");
    expect(step.part).toBe("3(x − 2)");
    expect(step.result).toBe("3x − 6");
    expect(step.options[step.correct].text).toBe("3x − 6");
    expect(step.after).toBe("3x − 6 = 2x + 5");
  });

  it("gives the typical wrong answers for brackets, each with its reason", () => {
    const [step] = makePrelude("3(x - 2) = 2x + 5").steps;
    const byText = Object.fromEntries(step.options.map((option) => [option.text, option.reason]));
    expect(byText["3x − 2"]).toBe("forgot-term");
    expect(byText["x − 6"]).toBe("forgot-term");
    expect(byText["3x + 6"]).toBe("sign");
    expect(step.options).toHaveLength(4);
    expect(step.options.filter((option) => option.reason === null)).toHaveLength(1);
  });

  it("opens every bracket, and handles a negative number outside", () => {
    const prelude = makePrelude("-2(x - 3) = 3(x + 1)");
    expect(prelude.steps.map((step) => [step.part, step.result])).toEqual([
      ["−2(x − 3)", "−2x + 6"],
      ["3(x + 1)", "3x + 3"],
    ]);
    expect(prelude.steps.at(-1)!.after).toBe("−2x + 6 = 3x + 3");
  });

  it("opens a division by a number: (x + 1)/2 = 4", () => {
    const [step] = makePrelude("(x + 1)/2 = 4").steps;
    expect(step.kind).toBe("expand");
    expect(step.result).toBe("x/2 + 1/2");
    expect(step.options.map((option) => option.text)).toContain("x/2 + 1");
  });

  it("simplifies a side that is still written out: 3(x + 2) − 4 = 11", () => {
    const prelude = makePrelude("3(x + 2) - 4 = 11");
    expect(prelude.steps.map((step) => step.kind)).toEqual(["expand", "simplify"]);
    expect(prelude.steps[0].after).toBe("3x + 6 - 4 = 11".replace(/-/g, "−"));
    const simplify = prelude.steps[1];
    expect(simplify.part).toBe("3x + 6 − 4");
    expect(simplify.result).toBe("3x + 2");
    expect(simplify.after).toBe("3x + 2 = 11");
    // Adding the 4 instead of taking it away is one of the wrong answers.
    expect(simplify.options.map((option) => option.text)).toContain("3x + 10");
  });

  it("combines fractions, with 'add the denominators' as a wrong answer: x/2 + x/3 = 5", () => {
    const [step] = makePrelude("x/2 + x/3 = 5").steps;
    expect(step.kind).toBe("simplify");
    expect(step.result).toBe("5x/6");
    const wrong = step.options.find((option) => option.reason === "denominators");
    expect(wrong?.text).toBe("2x/5");
  });

  it("does not ask about a side that is only in a different order", () => {
    expect(makePrelude("5 + 2x = 17").steps).toEqual([]);
  });

  it("is the same every time, so a reload shows the same question", () => {
    expect(makePrelude("3(x - 2) = 2x + 5")).toEqual(makePrelude("3(x - 2) = 2x + 5"));
  });

  it.each([
    "2(x + 3) = 14",
    "3(x - 2) = 2x + 5",
    "5(x - 1) = 3(x + 3)",
    "-2(x - 3) = 10",
    "4(2x + 1) - 3 = 29",
    "(x + 1)/2 = 4",
    "x/2 + x/3 = 5",
    "x/2 - x/3 + 1 = 4",
    "2(x + 1) + 3(x - 2) = 4x + 9",
    "(2x - 1)/3 + 1 = x/2",
  ])("always ends at the equation the parser reads: %s", (source) => {
    const prelude = makePrelude(source);
    const target = preludeTarget(source);
    expect(prelude.steps.length).toBeGreaterThan(0);

    let shown = source;
    for (const step of prelude.steps) {
      // Every step is a true restatement of the equation, and each option text is a real expression.
      const after = parseEquation(plain(step.after));
      expect(after.ok, step.after).toBe(true);
      if (after.ok) expect(equalsEquation(after.value, target), `${shown} -> ${step.after}`).toBe(true);
      shown = step.after;
      step.options.forEach((option) => expect(parseExpression(plain(option.text)).ok, option.text).toBe(true));
      // Only the right option equals the part it replaces.
      const part = parseExpression(plain(step.part));
      const equalOptions = step.options.filter((option) => {
        const value = parseExpression(plain(option.text));
        return part.ok && value.ok && value.value.x.n * part.value.x.d === part.value.x.n * value.value.x.d &&
          value.value.c.n * part.value.c.d === part.value.c.n * value.value.c.d;
      });
      expect(equalOptions, step.part).toHaveLength(1);
    }
    const last = parseEquation(plain(prelude.steps.at(-1)!.after));
    expect(last.ok && formatEquation(last.value)).toBe(formatEquation(target));
  });
});

describe("the prelude in a session", () => {
  const source = "3(x + 2) - 4 = 11";
  const start = () => createSession(preludeTarget(source), "en", makePrelude(source));
  const right = (state: SessionState) => currentPreludeStep(state)!.correct;
  const wrong = (state: SessionState) => currentPreludeStep(state)!.options.findIndex((option) => option.reason !== null);

  it("asks the questions first, showing the equation as written", () => {
    const state = start();
    expect(currentPreludeStep(state)?.kind).toBe("expand");
    expect(preludeShown(state)).toBe("3(x + 2) − 4 = 11");
  });

  it("does not allow balance moves, flips, hints or undo until the equation is simple", () => {
    const state = start();
    expect(sessionReducer(state, { type: "apply", operation: operation("subtract", 4) })).toBe(state);
    expect(sessionReducer(state, { type: "flip", target: { kind: "constant", side: "left" } })).toBe(state);
    expect(sessionReducer(state, { type: "hint" })).toBe(state);
    expect(canGetHint(state)).toBe(false);
    expect(canUndo(state)).toBe(false);
  });

  it("explains a wrong choice by its reason, counts it, and lets the learner try again", () => {
    let state = start();
    const index = state.prelude!.steps[0].options.findIndex((option) => option.reason === "forgot-term");
    state = sessionReducer(state, { type: "prelude", choice: index });
    expect(state.notice?.tone).toBe("error");
    expect(state.notice?.body[0]).toContain("multiplies every term inside the brackets");
    expect(state.mistakes).toBe(1);
    expect(state.preludeIndex).toBe(0);
    // The same wrong choice twice is not counted twice.
    expect(sessionReducer(state, { type: "prelude", choice: index })).toBe(state);
  });

  it("moves on after each right answer and ends at the equation the balance moves start from", () => {
    let state = start();
    state = sessionReducer(state, { type: "prelude", choice: right(state) });
    expect(state.notice?.tone).toBe("success");
    expect(preludeShown(state)).toBe("3x + 6 − 4 = 11");
    expect(currentPreludeStep(state)?.kind).toBe("simplify");

    state = sessionReducer(state, { type: "prelude", choice: right(state) });
    expect(currentPreludeStep(state)).toBeNull();
    expect(state.notice?.body.join(" ")).toContain("simple form");
    expect(state.mistakes).toBe(0);

    // Now the usual moves work, on the equation the parser read.
    state = sessionReducer(state, { type: "apply", operation: operation("subtract", 2) });
    expect(state.pending).not.toBeNull();
    state = sessionReducer(state, { type: "simplify" });
    expect(formatEquation(state.current)).toBe("3x = 9");
  });

  it("keeps the written equation, but skips the questions already answered, when starting over", () => {
    let state = start();
    state = sessionReducer(state, { type: "prelude", choice: wrong(state) });
    state = sessionReducer(state, { type: "restart" });
    expect(currentPreludeStep(state)).toBeNull();
    expect(state.prelude?.source).toBe("3(x + 2) − 4 = 11");
    expect(state.mistakes).toBe(1);
  });

  it("answers in Finnish", () => {
    let state = createSession(preludeTarget(source), "fi", makePrelude(source));
    state = sessionReducer(state, { type: "prelude", choice: state.prelude!.steps[0].options.findIndex((o) => o.reason === "sign") });
    expect(state.notice?.title).toBe("Ei ihan");
    expect(state.notice?.body[0]).toContain("miinus kertaa plus");
  });

  it("does nothing for a choice that does not exist", () => {
    const state = start();
    expect(sessionReducer(state, { type: "prelude", choice: 9 })).toBe(state);
  });
});

describe("brackets after a minus", () => {
  it("opens - 2(x + 4) with the sign carried inside: 7 − 2(x − 3) = 3x − 7", () => {
    const prelude = makePrelude("7 - 2(x - 3) = 3x - 7");
    const [expand, simplify] = prelude.steps;
    expect(expand.part).toBe("− 2(x − 3)");
    expect(expand.result).toBe("−2x + 6");
    expect(expand.after).toBe("7 − 2x + 6 = 3x − 7");
    expect(simplify.kind).toBe("simplify");
    expect(simplify.result).toBe("−2x + 13");
    expect(simplify.after).toBe("−2x + 13 = 3x − 7");
  });

  it("opens a division after a minus: x/2 − (x + 1)/3", () => {
    const [expand] = makePrelude("x/2 - (x + 1)/3 = 2").steps;
    expect(expand.part).toBe("− (x + 1)/3");
    expect(expand.result).toBe("−x/3 − 1/3");
    expect(expand.after).toBe("x/2 − x/3 − 1/3 = 2");
  });

  it.each(["10 - 2(x + 1) = 4", "6x - 3 - 2(x + 4) = 5", "2x/3 - (x - 3)/2 = 1", "4(x - 3) - 2(x - 5) = 14"])(
    "stays a true restatement at every step: %s",
    (source) => {
      const target = preludeTarget(source);
      for (const step of makePrelude(source).steps) {
        const after = parseEquation(plain(step.after));
        expect(after.ok, step.after).toBe(true);
        if (after.ok) expect(equalsEquation(after.value, target), `${source} -> ${step.after}`).toBe(true);
      }
    },
  );
});
