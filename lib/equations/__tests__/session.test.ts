import { describe, expect, it } from "vitest";
import { frac } from "../fraction";
import { formatEquation } from "../format";
import { operation, type Operation } from "../operations";
import { mustParseEquation } from "../parse";
import {
  canGetHint,
  canUndo,
  createSession,
  sessionReducer,
  solutionOf,
  type SessionAction,
  type SessionState,
} from "../session";

function run(state: SessionState, ...actions: SessionAction[]): SessionState {
  return actions.reduce(sessionReducer, state);
}

const apply = (op: Operation): SessionAction => ({ type: "apply", operation: op });
const start = (text: string) => createSession(mustParseEquation(text));
const shown = (state: SessionState) => formatEquation(state.current);

describe("a complete, correct solution of 2x + 5 = 17", () => {
  it("walks through apply, simplify, apply, simplify and solves", () => {
    let state = start("2x + 5 = 17");
    expect(state.outcome).toBe("solving");

    state = run(state, apply(operation("subtract", 5)));
    expect(state.pending).not.toBeNull();
    expect(formatEquation(state.pending!.after)).toBe("2x = 12");
    expect(shown(state)).toBe("2x + 5 = 17"); // not simplified until the learner says so
    expect(state.notice?.tone).toBe("success");
    expect(state.notice?.work).toEqual(["Left side: 2x + 5 − 5 = 2x", "Right side: 17 − 5 = 12"]);

    state = run(state, { type: "simplify" });
    expect(shown(state)).toBe("2x = 12");
    expect(state.pending).toBeNull();
    expect(state.steps).toHaveLength(1);
    expect(state.notice?.body[0]).toContain("x is still multiplied by 2");

    state = run(state, apply(operation("divide", 2)), { type: "simplify" });
    expect(shown(state)).toBe("x = 6");
    expect(state.outcome).toBe("solved");
    expect(solutionOf(state)).toEqual(frac(6));
    expect(state.notice?.title).toBe("x is on its own!");
    expect(state.mistakes).toBe(0);
    expect(state.hintsUsed).toBe(0);
  });

  it("lets the learner verify by substitution once solved", () => {
    let state = run(start("2x + 5 = 17"), apply(operation("subtract", 5)), { type: "simplify" });
    expect(run(state, { type: "check" }).checked).toBe(false); // not solved yet

    state = run(state, apply(operation("divide", 2)), { type: "simplify" }, { type: "check" });
    expect(state.checked).toBe(true);
  });
});

describe("wrong choices", () => {
  it("rejects the opposite operation without changing the equation", () => {
    const state = run(start("2x + 5 = 17"), apply(operation("add", 5)));
    expect(state.pending).toBeNull();
    expect(shown(state)).toBe("2x + 5 = 17");
    expect(state.mistakes).toBe(1);
    expect(state.notice).toMatchObject({ tone: "error", title: "Almost — try the opposite operation" });
    expect(state.notice?.preview).toEqual({ applied: "2x + 5 + 5 = 17 + 5", result: "2x + 10 = 22" });
  });

  it("does not repeat the full message or count a second mistake for an identical retry", () => {
    const once = run(start("2x + 5 = 17"), apply(operation("add", 5)));
    const twice = run(once, apply(operation("add", 5)));
    expect(twice.mistakes).toBe(1);
    expect(twice.notice?.title).toBe("You have tried that one already");
    expect(twice.notice?.body[0]).toMatch(/hint/);
  });

  it("explains division by zero without counting it as applied", () => {
    const state = run(start("2x = 12"), apply(operation("divide", 0)));
    expect(state.notice).toMatchObject({ tone: "error", title: "You can't divide by zero" });
    expect(state.pending).toBeNull();
    expect(shown(state)).toBe("2x = 12");
  });

  it("treats a valid-but-awkward move as a warning, not a mistake", () => {
    const state = run(start("2x + 5 = 17"), apply(operation("divide", 2)));
    expect(state.notice?.tone).toBe("warning");
    expect(state.mistakes).toBe(0);
    expect(shown(state)).toBe("2x + 5 = 17");
  });

  it("lets the learner try again after a mistake and then succeed", () => {
    const state = run(start("2x + 5 = 17"), apply(operation("add", 5)), apply(operation("subtract", 5)));
    expect(state.pending).not.toBeNull();
    expect(state.mistakes).toBe(1);
    expect(state.lastRejected).toBeNull();
  });

  it("ignores new moves while a step is waiting to be simplified", () => {
    const pending = run(start("2x + 5 = 17"), apply(operation("subtract", 5)));
    const ignored = run(pending, apply(operation("add", 5)));
    expect(ignored).toBe(pending);
  });
});

describe("hints", () => {
  it("reveals one level at a time up to three, then stops", () => {
    let state = start("2x + 5 = 17");
    expect(canGetHint(state)).toBe(true);

    state = run(state, { type: "hint" });
    expect(state.hintLevel).toBe(1);
    state = run(state, { type: "hint" }, { type: "hint" });
    expect(state.hintLevel).toBe(3);
    expect(state.hintsUsed).toBe(3);
    expect(canGetHint(state)).toBe(false);

    state = run(state, { type: "hint" });
    expect(state.hintLevel).toBe(3);
    expect(state.hintsUsed).toBe(3);
  });

  it("starts again from level one for the next step but remembers the total", () => {
    const state = run(
      start("2x + 5 = 17"),
      { type: "hint" },
      { type: "hint" },
      apply(operation("subtract", 5)),
      { type: "simplify" },
    );
    expect(state.hintLevel).toBe(0);
    expect(state.hintsUsed).toBe(2);
  });

  it("is unavailable while a step is pending and once solved", () => {
    const pending = run(start("x + 5 = 12"), apply(operation("subtract", 5)));
    expect(canGetHint(pending)).toBe(false);
    expect(canGetHint(run(pending, { type: "simplify" }))).toBe(false);
  });
});

describe("undo and restart", () => {
  it("cancels a pending step", () => {
    const state = run(start("2x + 5 = 17"), apply(operation("subtract", 5)), { type: "undo" });
    expect(state.pending).toBeNull();
    expect(shown(state)).toBe("2x + 5 = 17");
    expect(canUndo(state)).toBe(false);
  });

  it("goes back one completed step", () => {
    const state = run(
      start("2x + 5 = 17"),
      apply(operation("subtract", 5)),
      { type: "simplify" },
      apply(operation("divide", 2)),
      { type: "simplify" },
      { type: "check" },
      { type: "undo" },
    );
    expect(shown(state)).toBe("2x = 12");
    expect(state.steps).toHaveLength(1);
    expect(state.outcome).toBe("solving");
    expect(state.checked).toBe(false);
  });

  it("does nothing when there is nothing to undo", () => {
    const initial = start("2x + 5 = 17");
    expect(run(initial, { type: "undo" })).toBe(initial);
  });

  it("restarts from the original equation but keeps the effort record", () => {
    const state = run(
      start("2x + 5 = 17"),
      { type: "hint" },
      apply(operation("add", 5)),
      apply(operation("subtract", 5)),
      { type: "simplify" },
      { type: "restart" },
    );
    expect(shown(state)).toBe("2x + 5 = 17");
    expect(state.steps).toHaveLength(0);
    expect(state.mistakes).toBe(1);
    expect(state.hintsUsed).toBe(1);
  });
});

describe("variables on both sides", () => {
  it("collects x, then solves", () => {
    const state = run(
      start("5x + 2 = 3x + 12"),
      apply(operation("subtract", 3, true)),
      { type: "simplify" },
      apply(operation("subtract", 2)),
      { type: "simplify" },
      apply(operation("divide", 2)),
      { type: "simplify" },
    );
    expect(shown(state)).toBe("x = 5");
    expect(state.outcome).toBe("solved");
    expect(state.steps).toHaveLength(3);
  });

  it("accepts the answer with x on the right-hand side", () => {
    // Removing the smaller x term (2x) keeps x on the right: 3 = 3x − 9, then 12 = 3x, then 4 = x.
    const state = run(
      start("2x + 3 = 5x - 9"),
      apply(operation("subtract", 2, true)),
      { type: "simplify" },
      apply(operation("add", 9)),
      { type: "simplify" },
      apply(operation("divide", 3)),
      { type: "simplify" },
    );
    expect(shown(state)).toBe("4 = x");
    expect(state.outcome).toBe("solved");
    expect(solutionOf(state)).toEqual(frac(4));
  });

  it("also accepts keeping x on the left with a negative coefficient", () => {
    const state = run(
      start("2x + 3 = 5x - 9"),
      apply(operation("subtract", 5, true)),
      { type: "simplify" },
      apply(operation("subtract", 3)),
      { type: "simplify" },
      apply(operation("divide", -3)),
      { type: "simplify" },
    );
    expect(shown(state)).toBe("x = 4");
    expect(state.outcome).toBe("solved");
  });
});

describe("equations without a single solution", () => {
  it("finishes with 'no solution' when x disappears from a false statement", () => {
    const state = run(start("2x + 3 = 2x + 5"), apply(operation("subtract", 2, true)), { type: "simplify" });
    expect(shown(state)).toBe("3 = 5");
    expect(state.outcome).toBe("no-solution");
    expect(state.notice?.title).toBe("This equation has no solution");
    expect(solutionOf(state)).toBeNull();
    expect(canGetHint(state)).toBe(false);
    expect(run(state, apply(operation("add", 1)))).toBe(state);
    expect(run(state, { type: "check" }).checked).toBe(false);
  });

  it("finishes with 'infinitely many solutions' when x disappears from a true statement", () => {
    const state = run(start("2x + 3 = 2x + 3"), apply(operation("subtract", 2, true)), { type: "simplify" });
    expect(state.outcome).toBe("infinite-solutions");
    expect(state.notice?.title).toBe("This equation has infinitely many solutions");
  });

  it("can undo out of a dead end", () => {
    const state = run(
      start("2x + 3 = 2x + 5"),
      apply(operation("subtract", 2, true)),
      { type: "simplify" },
      { type: "undo" },
    );
    expect(state.outcome).toBe("solving");
    expect(shown(state)).toBe("2x + 3 = 2x + 5");
  });
});

describe("starting states", () => {
  it("recognises an equation that is already solved", () => {
    expect(start("x = 4").outcome).toBe("solved");
  });
});
