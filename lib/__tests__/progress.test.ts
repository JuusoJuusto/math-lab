import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  STORAGE_KEY,
  accuracyOf,
  parseProgress,
  recordAnswer,
  recordSolverLevel,
  recordTopicsCompleted,
  serialiseProgress,
} from "../progress";

describe("parseProgress", () => {
  it("starts empty when nothing is stored", () => {
    expect(parseProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(parseProgress("")).toEqual(EMPTY_PROGRESS);
  });

  it("keeps the storage key stable so existing learners keep their progress", () => {
    expect(STORAGE_KEY).toBe("mathlab:progress:v1");
  });

  it("reads progress saved before the solver existed (no solverLevels field)", () => {
    const saved = JSON.stringify({ completed: ["basics", "both"], attempts: 9, correct: 7 });
    expect(parseProgress(saved)).toEqual({ completed: ["basics", "both"], attempts: 9, correct: 7, solverLevels: [] });
  });

  it("maps the retired 'simple' topic to 'one-step'", () => {
    const saved = JSON.stringify({ completed: ["simple", "basics"], attempts: 3, correct: 3 });
    expect(parseProgress(saved).completed).toEqual(["one-step", "basics"]);
  });

  it("does not map 'simple' inside solver levels, which never used that id", () => {
    expect(parseProgress(JSON.stringify({ solverLevels: ["simple"] })).solverLevels).toEqual(["simple"]);
  });

  it.each([
    ["not json at all", "{{{"],
    ["a JSON string", '"hello"'],
    ["a JSON number", "42"],
    ["null", "null"],
    ["an array", "[1,2,3]"],
  ])("falls back safely for %s", (_name, raw) => {
    const result = parseProgress(raw);
    expect(result.completed).toEqual([]);
    expect(result.attempts).toBe(0);
    expect(result.solverLevels).toEqual([]);
  });

  it("sanitises bad values field by field", () => {
    const result = parseProgress(
      JSON.stringify({ completed: ["a", 7, null, "a"], attempts: -4, correct: "lots", solverLevels: "one-step" }),
    );
    expect(result).toEqual({ completed: ["a"], attempts: 0, correct: 0, solverLevels: [] });
  });

  it("never reports more correct answers than answers", () => {
    expect(parseProgress(JSON.stringify({ attempts: 2, correct: 50 })).correct).toBe(2);
  });

  it("round-trips through serialisation", () => {
    const progress = { completed: ["basics"], attempts: 4, correct: 3, solverLevels: ["one-step", "two-step"] };
    expect(parseProgress(serialiseProgress(progress))).toEqual(progress);
  });
});

describe("updating progress", () => {
  it("records answers without mutating the original", () => {
    const next = recordAnswer(recordAnswer(EMPTY_PROGRESS, true), false);
    expect(next).toMatchObject({ attempts: 2, correct: 1 });
    expect(EMPTY_PROGRESS.attempts).toBe(0);
  });

  it("records completed topics and solver levels once", () => {
    let progress = recordTopicsCompleted(EMPTY_PROGRESS, ["basics", "basics"]);
    progress = recordTopicsCompleted(progress, ["basics", "both"]);
    expect(progress.completed).toEqual(["basics", "both"]);

    progress = recordSolverLevel(progress, "one-step");
    progress = recordSolverLevel(progress, "one-step");
    expect(progress.solverLevels).toEqual(["one-step"]);
  });

  it("computes accuracy as a rounded percentage", () => {
    expect(accuracyOf(EMPTY_PROGRESS)).toBe(0);
    expect(accuracyOf({ ...EMPTY_PROGRESS, attempts: 3, correct: 2 })).toBe(67);
  });
});
