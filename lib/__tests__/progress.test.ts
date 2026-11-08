import { describe, expect, it } from "vitest";
import type { TaskSpec } from "../tasks";
import {
  type Progress,
  EMPTY_PROGRESS,
  MAX_MISSED,
  STORAGE_KEY,
  XP,
  accuracyOf,
  addXp,
  finishedTopics,
  levelOf,
  overallProgress,
  parseProgress,
  recordDailyDone,
  recordSolverLevel,
  recordTask,
  recordTimeAttack,
  recordTopicsCompleted,
  serialiseProgress,
  weakestTopic,
  xpIntoLevel,
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
    expect(parseProgress(saved)).toEqual({ ...EMPTY_PROGRESS, completed: ["basics", "both"], attempts: 9, correct: 7 });
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
    expect(result).toEqual({ ...EMPTY_PROGRESS, completed: ["a"] });
  });

  it("never reports more correct answers than answers", () => {
    expect(parseProgress(JSON.stringify({ attempts: 2, correct: 50 })).correct).toBe(2);
  });

  it("round-trips through serialisation", () => {
    const progress: Progress = {
      completed: ["basics"],
      attempts: 4,
      correct: 3,
      solverLevels: ["one-step", "two-step"],
      xp: 130,
      byTopic: { basics: { attempts: 4, correct: 3 } },
      byGroup: { solve: { attempts: 4, correct: 3 } },
      missed: [{ kind: "solve", topic: "basics", seed: 4 }],
      dailyDone: "2026-11-08",
      bestTime: 12,
    };
    expect(parseProgress(serialiseProgress(progress))).toEqual(progress);
  });
});

const spec = (seed: number, topic = "two-step"): TaskSpec => ({ kind: "solve", topic, seed });

describe("recording tasks", () => {
  it("counts answers, tallies by topic and kind, and awards XP only when correct", () => {
    let progress = recordTask(EMPTY_PROGRESS, { spec: spec(1), correct: true, xp: XP.correctTask });
    progress = recordTask(progress, { spec: spec(2), correct: false, xp: XP.correctTask });
    progress = recordTask(progress, { spec: { kind: "check", topic: "both", seed: 3 }, correct: true, xp: XP.correctTask });

    expect(progress).toMatchObject({ attempts: 3, correct: 2, xp: 20 });
    expect(progress.byTopic).toEqual({ "two-step": { attempts: 2, correct: 1 }, both: { attempts: 1, correct: 1 } });
    expect(progress.byGroup).toEqual({ solve: { attempts: 2, correct: 1 }, check: { attempts: 1, correct: 1 } });
    expect(EMPTY_PROGRESS.attempts).toBe(0);
  });

  it("queues a missed task once, newest first, and removes it when answered correctly", () => {
    let progress = recordTask(EMPTY_PROGRESS, { spec: spec(1), correct: false, xp: 10 });
    progress = recordTask(progress, { spec: spec(2), correct: false, xp: 10 });
    progress = recordTask(progress, { spec: spec(1), correct: false, xp: 10 });
    expect(progress.missed.map((item) => item.seed)).toEqual([1, 2]);

    progress = recordTask(progress, { spec: spec(2), correct: true, xp: 10 });
    expect(progress.missed.map((item) => item.seed)).toEqual([1]);
  });

  it("keeps the queue at a sensible size", () => {
    let progress = EMPTY_PROGRESS;
    for (let seed = 1; seed <= MAX_MISSED + 10; seed += 1) {
      progress = recordTask(progress, { spec: spec(seed), correct: false, xp: 10 });
    }
    expect(progress.missed).toHaveLength(MAX_MISSED);
    expect(progress.missed[0].seed).toBe(MAX_MISSED + 10);
  });

  it("drops damaged entries from a stored queue", () => {
    const saved = JSON.stringify({
      missed: [
        { kind: "solve", topic: "two-step", seed: 5 },
        { kind: "nonsense", topic: "two-step", seed: 5 },
        { kind: "solve", topic: "two-step", seed: -1 },
        { kind: "bank", topic: "basics", seed: 2 },
        { kind: "bank", topic: "basics", seed: 2, bankId: "q11" },
        "text",
        null,
      ],
    });
    expect(parseProgress(saved).missed).toEqual([
      { kind: "solve", topic: "two-step", seed: 5 },
      { kind: "bank", topic: "basics", seed: 2, bankId: "q11" },
    ]);
  });

  it("repairs damaged tallies", () => {
    const saved = JSON.stringify({ byTopic: { a: { attempts: 3, correct: 99 }, b: "x", c: { attempts: "many" } }, byGroup: [] });
    expect(parseProgress(saved).byTopic).toEqual({ a: { attempts: 3, correct: 3 }, c: { attempts: 0, correct: 0 } });
    expect(parseProgress(saved).byGroup).toEqual({});
  });
});

describe("XP and levels", () => {
  it("starts at level 1 and gains a level every 100 XP", () => {
    expect([0, 99, 100, 250].map(levelOf)).toEqual([1, 1, 2, 3]);
    expect([0, 99, 100, 250].map(xpIntoLevel)).toEqual([0, 99, 0, 50]);
  });

  it("awards the solver level bonus once", () => {
    let progress = recordSolverLevel(EMPTY_PROGRESS, "one-step");
    progress = recordSolverLevel(progress, "one-step");
    expect(progress.solverLevels).toEqual(["one-step"]);
    expect(progress.xp).toBe(XP.solverLevel);
  });

  it("awards the daily challenge once per day", () => {
    let progress = recordDailyDone(EMPTY_PROGRESS, "2026-11-08");
    progress = recordDailyDone(progress, "2026-11-08");
    expect(progress.xp).toBe(XP.dailyChallenge);
    expect(recordDailyDone(progress, "2026-11-09").xp).toBe(XP.dailyChallenge * 2);
  });

  it("never adds negative or fractional XP", () => {
    expect(addXp(EMPTY_PROGRESS, -5).xp).toBe(0);
    expect(addXp(EMPTY_PROGRESS, 7.9).xp).toBe(7);
  });

  it("keeps only the best time attack score", () => {
    expect(recordTimeAttack(recordTimeAttack(EMPTY_PROGRESS, 8), 5).bestTime).toBe(8);
    expect(recordTimeAttack(recordTimeAttack(EMPTY_PROGRESS, 8), 11).bestTime).toBe(11);
  });
});

describe("overview", () => {
  it("records completed topics once", () => {
    let progress = recordTopicsCompleted(EMPTY_PROGRESS, ["basics", "basics"]);
    progress = recordTopicsCompleted(progress, ["basics", "both"]);
    expect(progress.completed).toEqual(["basics", "both"]);
  });

  it("computes accuracy as a rounded percentage", () => {
    expect(accuracyOf({ attempts: 0, correct: 0 })).toBe(0);
    expect(accuracyOf({ attempts: 3, correct: 2 })).toBe(67);
  });

  it("counts a topic as finished through the solver, an old quiz round, or good practice", () => {
    let progress = recordSolverLevel(EMPTY_PROGRESS, "one-step");
    progress = recordTopicsCompleted(progress, ["basics"]);
    for (let seed = 1; seed <= 5; seed += 1) progress = recordTask(progress, { spec: spec(seed, "both"), correct: seed !== 1, xp: 10 });
    expect(finishedTopics(progress).sort()).toEqual(["basics", "both", "one-step"]);
    expect(overallProgress(progress, 7)).toBe(43);
  });

  it("does not count a topic with too few or too poor answers", () => {
    let progress = EMPTY_PROGRESS;
    for (let seed = 1; seed <= 4; seed += 1) progress = recordTask(progress, { spec: spec(seed), correct: true, xp: 10 });
    expect(finishedTopics(progress)).toEqual([]);
    for (let seed = 5; seed <= 10; seed += 1) progress = recordTask(progress, { spec: spec(seed), correct: false, xp: 10 });
    expect(finishedTopics(progress)).toEqual([]);
    expect(overallProgress(EMPTY_PROGRESS, 0)).toBe(0);
  });

  it("suggests the weakest topic once there is enough to go on", () => {
    expect(weakestTopic(EMPTY_PROGRESS)).toBeNull();
    let progress = EMPTY_PROGRESS;
    for (let seed = 1; seed <= 4; seed += 1) progress = recordTask(progress, { spec: spec(seed, "both"), correct: seed > 2, xp: 10 });
    for (let seed = 5; seed <= 8; seed += 1) progress = recordTask(progress, { spec: spec(seed, "one-step"), correct: true, xp: 10 });
    expect(weakestTopic(progress)).toBe("both");
    expect(weakestTopic(progress, 5)).toBeNull();
  });
});
