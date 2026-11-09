import { describe, expect, it } from "vitest";
import { formatEquation } from "../format";
import { LEVELS as ALL_LEVELS, getLevel, getNextLevel, isLevelId, levelText, toExercise, type LevelDefinition } from "../levels";
import { mustParseEquation } from "../parse";
import { hasDecimals, makePrelude, startEquation } from "../prelude";
import { createRng, pickRound, shuffle, summariseRound, thinksYouKnow } from "../round";
import { isSolution, solveEquation, terminalState } from "../solve";
import { evaluateMove, solveWithTutor } from "../tutor";
import { isInteger } from "../fraction";

const level = (id: string): LevelDefinition => {
  const found = getLevel(id);
  if (!found) throw new Error(`Missing level ${id}`);
  return found;
};

/** The levels that draw from a pool of equations. Word problems are covered in the story tests. */
const LEVELS = ALL_LEVELS.filter((l) => l.kind === "equations");

/** Authors type "-" and "x/4"; the workspace shows "−" and "x/4". Compare ignoring that. */
const asAuthored = (text: string) => text.replace(/−/g, "-");

/** The only levels whose exercises are plain equations in simple form, shown exactly as authored. */
const SIMPLE = new Set(["one-step", "two-step", "both"]);

describe("level catalogue", () => {
  it("defines the nine levels in order, from one step to the hardest", () => {
    expect(ALL_LEVELS.map((l) => l.id)).toEqual([
      "one-step",
      "two-step",
      "both",
      "word",
      "brackets",
      "fractions",
      "hard-word",
      "special",
      "challenge",
    ]);
    expect(ALL_LEVELS.map((l) => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(ALL_LEVELS.filter((l) => l.kind === "stories").map((l) => l.id)).toEqual(["word", "hard-word"]);
    expect(getNextLevel("one-step")?.id).toBe("two-step");
    expect(getNextLevel("both")?.id).toBe("word");
    expect(getNextLevel("word")?.id).toBe("brackets");
    expect(getNextLevel("fractions")?.id).toBe("hard-word");
    expect(getNextLevel("challenge")).toBeUndefined();
    expect(isLevelId("two-step")).toBe(true);
    expect(isLevelId("brackets")).toBe(true);
    expect(isLevelId("banana")).toBe(false);
  });

  it("has unique exercise ids across all levels", () => {
    const ids = LEVELS.flatMap((l) => l.exercises.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate equations", () => {
    const equations = LEVELS.flatMap((l) => l.exercises.map((e) => e.equation));
    expect(new Set(equations).size).toBe(equations.length);
  });

  it("offers enough exercises for several different rounds", () => {
    for (const l of LEVELS) expect(l.exercises.length).toBeGreaterThanOrEqual(l.roundSize * 2);
  });

  it("keeps the worked example out of the practice pool", () => {
    for (const l of LEVELS) {
      expect(l.exercises.map((e) => e.equation)).not.toContain(l.example.equation);
    }
  });

  it("writes every intro in plain, short copy, in both languages", () => {
    for (const l of ALL_LEVELS) {
      for (const lang of ["en", "fi"] as const) {
        const { intro } = levelText(l, lang);
        expect(intro.points).toHaveLength(3);
        expect(intro.lead.length).toBeLessThan(300);
        for (const point of intro.points) expect(point.length).toBeLessThan(140);
      }
    }
  });

  it("has a Finnish version of every text that differs from the English one", () => {
    for (const l of ALL_LEVELS) {
      const en = levelText(l, "en");
      const fi = levelText(l, "fi");
      expect(fi.title).not.toBe(en.title);
      expect(fi.intro.lead).not.toBe(en.intro.lead);
      expect(fi.intro.points).toHaveLength(en.intro.points.length);
      expect(fi.exampleLead).not.toBe(en.exampleLead);
    }
  });

  it("has a worked example that parses and has a whole-number solution, for every level", () => {
    for (const l of ALL_LEVELS) {
      const solution = solveEquation(mustParseEquation(l.example.equation));
      expect(solution.kind).toBe(l.expects === "special" ? "none" : "one");
    }
  });
});

/** What the tutor ends at for an equation whose x cancels only after a move. */
function terminalAfterTutor(equation: ReturnType<typeof mustParseEquation>) {
  return terminalState(solveWithTutor(equation).at(-1)?.after ?? equation);
}

describe.each(LEVELS.map((l) => [l.id, l] as const))("exercises in %s", (_id, l) => {
  const all = [{ id: "worked example", equation: l.example.equation }, ...l.exercises];

  it.each(all.map((e) => [e.id, e.equation] as const))("%s (%s) is valid, solvable and well-formed", (_name, text) => {
    const equation = mustParseEquation(text);

    const prelude = makePrelude(text);
    if (SIMPLE.has(l.id)) {
      // Displayed exactly as authored, so authors see what learners see.
      expect(asAuthored(formatEquation(equation))).toBe(text);
      expect(prelude.steps).toEqual([]);
    } else if (prelude.steps.length === 0) {
      expect(asAuthored(formatEquation(equation)).replace(/\s/g, "")).toBe(text.replace(/\s/g, ""));
    }

    if (l.expects === "special") {
      // x disappears: the equation has no solution, or every number is one.
      expect(["no-solution", "infinite-solutions"]).toContain(terminalState(equation) ?? terminalAfterTutor(equation));
      return;
    }

    // One whole-number solution, and substituting it works.
    const solution = solveEquation(equation);
    expect(solution.kind).toBe("one");
    if (solution.kind === "one") {
      expect(isInteger(solution.value)).toBe(true);
      expect(isSolution(equation, solution.value)).toBe(true);
    }

    // Following the tutor reaches x = number, and every step is accepted as helpful.
    const steps = solveWithTutor(equation);
    expect(steps.length).toBeGreaterThan(0);
    expect(terminalState(steps.at(-1)!.after)).toBe("solved");
    steps.forEach((step, index) => {
      expect(evaluateMove(step.before, step.operation, index).verdict).toBe("helpful");
    });
  });
});

describe("level difficulty matches the promise", () => {
  const stepCounts = (l: LevelDefinition) => l.exercises.map((e) => solveWithTutor(mustParseEquation(e.equation)).length);

  it("level 1 needs exactly one step and uses all four inverse operations", () => {
    const l = level("one-step");
    expect(stepCounts(l).every((n) => n === 1)).toBe(true);
    const kinds = new Set(l.exercises.map((e) => solveWithTutor(mustParseEquation(e.equation))[0].operation.kind));
    expect(kinds).toEqual(new Set(["add", "subtract", "multiply", "divide"]));
  });

  it("level 2 needs exactly two steps, undoing the constant before the coefficient", () => {
    const l = level("two-step");
    expect(stepCounts(l).every((n) => n === 2)).toBe(true);
    for (const e of l.exercises) {
      const [first, second] = solveWithTutor(mustParseEquation(e.equation));
      expect(["add", "subtract"]).toContain(first.operation.kind);
      expect(["multiply", "divide"]).toContain(second.operation.kind);
    }
  });

  it("level 2 includes both subtraction and division-style equations", () => {
    const texts = level("two-step").exercises.map((e) => e.equation);
    expect(texts.some((t) => t.includes(" - "))).toBe(true);
    expect(texts.some((t) => t.includes("x/"))).toBe(true);
  });

  it("level 3 collects variables on both sides and covers negative numbers", () => {
    const l = level("both");
    const equations = l.exercises.map((e) => mustParseEquation(e.equation));

    // x appears on both sides for most exercises.
    const bothSides = equations.filter((eq) => eq.left.x.n !== 0 && eq.right.x.n !== 0);
    expect(bothSides.length).toBeGreaterThanOrEqual(8);

    // At least one negative solution and one negative coefficient.
    const negativeSolutions = equations.filter((eq) => {
      const s = solveEquation(eq);
      return s.kind === "one" && s.value.n < 0;
    });
    expect(negativeSolutions.length).toBeGreaterThanOrEqual(2);
    expect(equations.some((eq) => eq.left.x.n < 0)).toBe(true);

    // The first collecting step is always the first of two to four steps.
    for (const eq of equations) {
      const steps = solveWithTutor(eq);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.length).toBeLessThanOrEqual(4);
    }
  });

  it("level 3 includes an equation whose x term is larger on the right", () => {
    const equations = level("both").exercises.map((e) => mustParseEquation(e.equation));
    expect(equations.some((eq) => eq.left.x.n !== 0 && eq.right.x.n > eq.left.x.n)).toBe(true);
  });
});

describe("pickRound", () => {
  const l = level("two-step");

  it("returns the right number of different exercises, in easy-to-hard order", () => {
    const round = pickRound(l, createRng(1));
    expect(round).toHaveLength(l.roundSize);
    expect(new Set(round.map((e) => e.id)).size).toBe(l.roundSize);

    const position = (id: string) => l.exercises.findIndex((e) => e.id === id);
    const positions = round.map((e) => position(e.id));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("is deterministic for a given seed and varies between seeds", () => {
    const ids = (seed: number) => pickRound(l, createRng(seed)).map((e) => e.id);
    expect(ids(5)).toEqual(ids(5));
    const distinct = new Set([1, 2, 3, 4, 5, 6].map((seed) => ids(seed).join()));
    expect(distinct.size).toBeGreaterThan(2);
  });

  it("avoids repeating the previous round when it can", () => {
    const first = pickRound(l, createRng(3));
    const second = pickRound(l, createRng(4), first.map((e) => e.id));
    expect(second.some((e) => first.some((f) => f.id === e.id))).toBe(false);
  });

  it("still fills a round when everything has been seen", () => {
    const everything = l.exercises.map((e) => e.id);
    expect(pickRound(l, createRng(9), everything)).toHaveLength(l.roundSize);
  });

  it("produces exercises with parsed equations", () => {
    const [first] = pickRound(l, createRng(2));
    expect(first.source).toBe(l.exercises.find((e) => e.id === first.id)?.equation);
    expect(first.equation).toEqual(toExercise({ id: first.id, equation: first.source }).equation);
  });
});

describe("shuffle and rng", () => {
  it("keeps every element", () => {
    const shuffled = shuffle([1, 2, 3, 4, 5, 6, 7, 8], createRng(11));
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("does not mutate its input", () => {
    const input = [1, 2, 3, 4];
    shuffle(input, createRng(1));
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it("generates numbers in [0, 1)", () => {
    const rng = createRng(123);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("summariseRound", () => {
  it("counts clean solves and hints", () => {
    const summary = summariseRound([
      { id: "a", steps: 1, mistakes: 0, hints: 0 },
      { id: "b", steps: 2, mistakes: 1, hints: 0 },
      { id: "c", steps: 2, mistakes: 0, hints: 2 },
    ]);
    expect(summary).toEqual({ solved: 3, hintsUsed: 2, cleanSolves: 1 });
  });
});

describe("the harder levels deliver what they promise", () => {
  const equationsOf = (id: string) => level(id).exercises.map((e) => mustParseEquation(e.equation));

  it("brackets: every exercise has brackets, and opening them is a question", () => {
    for (const e of level("brackets").exercises) {
      expect(e.equation, e.id).toContain("(");
      expect(makePrelude(e.equation).steps.length, e.id).toBeGreaterThan(0);
      // The unsupported shape: a bracket after a minus with no space ("-(x+1)") is not authored.
      expect(e.equation, e.id).not.toMatch(/-\(/);
    }
    // Both a bracket on one side and brackets on both sides, and a negative number in front.
    const texts = level("brackets").exercises.map((e) => e.equation);
    expect(texts.some((t) => (t.match(/\(/g) ?? []).length === 2)).toBe(true);
    expect(texts.some((t) => /^-\d\(/.test(t))).toBe(true);
    expect(texts.some((t) => /- \d\(/.test(t))).toBe(true);
  });

  it("fractions: every exercise has a fraction, and the tutor clears them with one multiplication first", () => {
    for (const e of level("fractions").exercises) {
      // Fractions, or decimals (which are fractions written another way).
      expect(e.equation.includes("/") || hasDecimals(e.equation), e.id).toBe(true);
      const equation = startEquation(e.equation);
      const [first] = solveWithTutor(equation);
      // An equation that is only x/3 + 4 = 9 style needs no clearing, so look at the untidy ones.
      if (first.operation.kind === "multiply" && first.before.left.c.d * first.before.right.c.d * first.before.left.x.d * first.before.right.x.d > 1) {
        const after = first.after;
        for (const value of [after.left.x, after.left.c, after.right.x, after.right.c]) expect(value.d, e.id).toBe(1);
      }
    }
  });

  it("fractions: the first move is the common denominator, as taught", () => {
    const first = (text: string) => solveWithTutor(mustParseEquation(text))[0].operation;
    expect(first("x/2 + x/3 = 5")).toMatchObject({ kind: "multiply", amount: { n: 6, d: 1 } });
    expect(first("2x/3 = x/2 + 1")).toMatchObject({ kind: "multiply", amount: { n: 6, d: 1 } });
    expect(first("x/2 + 1/3 = 5/6")).toMatchObject({ kind: "multiply", amount: { n: 6, d: 1 } });
    expect(first("x/6 = 4/3")).toMatchObject({ kind: "multiply", amount: { n: 6, d: 1 } });
  });

  it("special: both kinds are there, and a learner who solves it gets the right explanation", () => {
    const kinds = new Set(
      equationsOf("special").map((equation) => terminalState(equation) ?? terminalState(solveWithTutor(equation).at(-1)!.after)),
    );
    expect(kinds).toEqual(new Set(["no-solution", "infinite-solutions"]));
  });

  it("challenge: has long equations (several steps), negative answers and brackets with fractions", () => {
    // The work is the clean-up questions plus the balance moves.
    const work = level("challenge").exercises.map(
      (e) => makePrelude(e.equation).steps.length + solveWithTutor(mustParseEquation(e.equation)).length,
    );
    expect(Math.max(...work)).toBeGreaterThanOrEqual(6);
    const solutions = equationsOf("challenge").map((equation) => solveEquation(equation));
    expect(solutions.some((s) => s.kind === "one" && s.value.n < 0)).toBe(true);
    const texts = level("challenge").exercises.map((e) => e.equation);
    expect(texts.some((t) => t.includes("(") && t.includes("/"))).toBe(true);
  });

  it("each level is harder than the one before, by the number of moves its equations need on average", () => {
    // The work is the clean-up questions plus the balance moves.
    const moves = (id: string) => {
      const counts = level(id).exercises.map(
        (e) => makePrelude(e.equation).steps.length + solveWithTutor(mustParseEquation(e.equation)).length,
      );
      return counts.reduce((a, b) => a + b, 0) / counts.length;
    };
    expect(moves("one-step")).toBeLessThan(moves("two-step"));
    expect(moves("two-step")).toBeLessThan(moves("both"));
    expect(moves("both")).toBeLessThan(moves("brackets"));
    expect(moves("brackets")).toBeLessThan(moves("challenge"));
  });
});

describe("the word-problem levels", () => {
  it("each has a worked example that is the story's own equation", async () => {
    const { EXAMPLE_STORIES } = await import("../../tasks/stories");
    for (const id of ["word", "hard-word"] as const) {
      const story = EXAMPLE_STORIES[id];
      const fromStory = mustParseEquation(story.equations[0]);
      const fromLevel = mustParseEquation(level(id).example.equation);
      expect(fromLevel).toEqual(fromStory);
      expect(level(id).kind).toBe("stories");
    }
  });

  it("climb through different tiers", () => {
    expect(level("word").tiers).toEqual([1, 2, 3]);
    expect(level("hard-word").tiers).toEqual([4, 5, 6]);
  });
});

describe("when the app thinks a lesson is known", () => {
  const round = (clean: number, size = 5) => ({ solved: size, hintsUsed: size - clean, cleanSolves: clean });
  it("needs a finished round with at least four in five solved without a hint or a wrong move", () => {
    expect(thinksYouKnow(round(5), 5)).toBe(true);
    expect(thinksYouKnow(round(4), 5)).toBe(true);
    expect(thinksYouKnow(round(3), 5)).toBe(false);
    expect(thinksYouKnow(round(0), 5)).toBe(false);
    // An unfinished round proves nothing.
    expect(thinksYouKnow({ solved: 4, hintsUsed: 0, cleanSolves: 4 }, 5)).toBe(false);
    expect(thinksYouKnow(round(0, 0), 0)).toBe(false);
  });
});
