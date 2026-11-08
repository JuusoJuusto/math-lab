import { describe, expect, it } from "vitest";
import { frac } from "@/lib/equations";
import {
  KIND_TOPICS,
  MODES,
  TOPIC_ORDER,
  buildSession,
  dateSeed,
  difficultyOf,
  generateTask,
  getMode,
  gradeChoice,
  gradeNumber,
  groupOf,
  isInvalid,
  parseAnswer,
  specKey,
  taskFingerprint,
  topicsForMode,
  type ModeId,
  type TaskSpec,
} from "..";

const build = (mode: ModeId, topic = "all", count?: number, seed = 1, missed?: TaskSpec[]) =>
  buildSession({ mode, topic, count: count ?? getMode(mode)!.defaultCount, seed, missed });

describe("practice modes", () => {
  it("offers a wide variety of ways to practise", () => {
    expect(MODES.map((mode) => mode.id)).toEqual(["daily", "quiz", "solve", "truefalse", "step", "mistake", "equation", "time", "exam", "mistakes"]);
    const kinds = new Set(MODES.flatMap((mode) => mode.kinds));
    expect(kinds.size).toBe(7);
  });

  it("only lists topics a mode can really produce tasks for", () => {
    expect(topicsForMode(getMode("mistake")!)).toEqual(["two-step", "both", "fractions"]);
    expect(topicsForMode(getMode("equation")!)).toEqual(["word"]);
    expect(topicsForMode(getMode("exam")!)).toEqual([...TOPIC_ORDER]);
  });
});

describe("buildSession", () => {
  it.each(MODES.filter((mode) => mode.id !== "mistakes").map((mode) => [mode.id] as const))("%s: builds a full session of valid, different tasks", (modeId) => {
    const mode = getMode(modeId)!;
    for (const seed of [1, 2, 3, 4, 5]) {
      const specs = build(modeId, "all", mode.defaultCount, seed);
      expect(specs).toHaveLength(mode.defaultCount);

      const tasks = specs.map((spec) => generateTask(spec));
      expect(new Set(tasks.map(taskFingerprint)).size, `${modeId} seed ${seed} repeats a task`).toBe(tasks.length);
      for (const spec of specs) expect(mode.kinds).toContain(spec.kind);
    }
  });

  it("is repeatable and varies with the seed", () => {
    expect(build("exam", "all", 20, 99)).toEqual(build("exam", "all", 20, 99));
    expect(build("exam", "all", 20, 99)).not.toEqual(build("exam", "all", 20, 100));
  });

  it.each(["one-step", "two-step", "both", "brackets", "proportion", "word", "basics"])("respects the topic filter: %s", (topic) => {
    const specs = build("exam", topic, 12, 7);
    expect(specs.length).toBeGreaterThan(0);
    for (const spec of specs) expect(spec.topic).toBe(topic);
  });

  it("only mixes in kinds that exist for the chosen topic", () => {
    for (const spec of build("exam", "proportion", 12, 3)) expect(KIND_TOPICS[spec.kind]).toContain("proportion");
    expect(build("mistake", "proportion", 5, 1)).toEqual([]);
  });

  it("uses every kind of task in exam practice", () => {
    const kinds = new Set(build("exam", "all", 30, 11).map((spec) => spec.kind));
    expect(kinds.size).toBe(7);
  });

  it("makes exam practice climb from easy topics to hard ones", () => {
    const specs = build("exam", "all", 30, 5);
    const average = (part: TaskSpec[]) => part.reduce((total, spec) => total + difficultyOf(spec.topic), 0) / part.length;
    expect(average(specs.slice(20))).toBeGreaterThan(average(specs.slice(0, 10)) + 1);
  });

  it("never repeats a fixed quiz question within a session", () => {
    const ids = build("quiz", "two-step", 10, 4).flatMap((spec) => (spec.bankId ? [spec.bankId] : []));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives everyone the same daily challenge on the same day, and a new one the next day", () => {
    const today = buildSession({ mode: "daily", topic: "all", count: 5, seed: dateSeed("2026-11-08") });
    expect(today).toEqual(buildSession({ mode: "daily", topic: "all", count: 5, seed: dateSeed("2026-11-08") }));
    expect(today).not.toEqual(buildSession({ mode: "daily", topic: "all", count: 5, seed: dateSeed("2026-11-09") }));
    expect(today).toHaveLength(5);
    expect(new Set(today.map((spec) => spec.kind)).size).toBeGreaterThanOrEqual(4);
  });

  it("builds the mistakes session from the queue", () => {
    const queue: TaskSpec[] = [
      { kind: "solve", topic: "two-step", seed: 5 },
      { kind: "check", topic: "both", seed: 6 },
    ];
    expect(build("mistakes", "all", 10, 1, queue)).toEqual(queue);
    expect(build("mistakes", "all", 1, 1, queue)).toEqual([queue[0]]);
    expect(build("mistakes", "all", 10, 1, [])).toEqual([]);
  });

  it("returns nothing for an unknown mode", () => {
    expect(buildSession({ mode: "nope" as ModeId, topic: "all", count: 5, seed: 1 })).toEqual([]);
  });
});

describe("dateSeed and keys", () => {
  it("turns a date into a stable positive seed", () => {
    expect(dateSeed("2026-11-08")).toBe(dateSeed("2026-11-08"));
    expect(dateSeed("2026-11-08")).not.toBe(dateSeed("2026-11-09"));
    expect(dateSeed("2026-11-08")).toBeGreaterThan(0);
  });

  it("makes a stable key per recipe", () => {
    const a: TaskSpec = { kind: "bank", topic: "basics", seed: 1, bankId: "q11" };
    expect(specKey(a)).toBe(specKey({ ...a }));
    expect(specKey(a)).not.toBe(specKey({ ...a, seed: 2 }));
  });

  it("groups kinds for the progress overview", () => {
    expect(groupOf("bank")).toBe("quiz");
    expect(groupOf("choose")).toBe("quiz");
    expect(groupOf("mistake")).toBe("mistake");
  });
});

describe("reading typed answers", () => {
  it.each([
    ["6", 6, 1],
    ["  6  ", 6, 1],
    ["x = 6", 6, 1],
    ["X=6", 6, 1],
    ["6.0", 6, 1],
    ["-3", -3, 1],
    ["−3", -3, 1],
    ["x = −3", -3, 1],
    ["7/2", 7, 2],
    ["12/2", 6, 1],
    ["2,5", 5, 2],
    ["2.5", 5, 2],
    ["15 €", 15, 1],
    ["30 km", 30, 1],
    ["6 hours.", 6, 1],
  ])("accepts %j", (text, n, d) => {
    expect(parseAnswer(text)).toEqual({ ok: true, value: frac(n, d) });
  });

  it.each([[""], ["   "], ["abc"], ["x"], ["x ="], ["1/0"], ["2 3"], ["6x"], ["--3"], ["6 + 1"]])("rejects %j without throwing", (text) => {
    expect(parseAnswer(text).ok).toBe(false);
  });
});

describe("grading", () => {
  const solveTask = generateTask({ kind: "solve", topic: "two-step", seed: 3 });
  const answer = solveTask.answerValue!;

  it("accepts the right answer in any equivalent form", () => {
    const text = `${answer.n}`;
    expect(gradeNumber(solveTask, text)).toMatchObject({ correct: true });
    expect(gradeNumber(solveTask, `x = ${answer.n}`)).toMatchObject({ correct: true });
    expect(gradeNumber(solveTask, `${answer.n * 2}/2`)).toMatchObject({ correct: true });
    expect(gradeNumber(solveTask, `${answer.n}.0`)).toMatchObject({ correct: true });
  });

  it("rejects a wrong answer and shows by substitution why it fails", () => {
    const result = gradeNumber(solveTask, String(answer.n + 1));
    expect(isInvalid(result)).toBe(false);
    if (isInvalid(result)) return;
    expect(result.correct).toBe(false);
    expect(result.feedback[0]).toMatch(/Check: with x = .* the left side is .* and the right side is .*They are not equal/);
  });

  it("asks again, without marking it wrong, when the answer cannot be read", () => {
    const result = gradeNumber(solveTask, "banana");
    expect(isInvalid(result)).toBe(true);
    expect(isInvalid(result) && result.invalid).toMatch(/number/);
  });

  it("grades a negative answer correctly", () => {
    for (let seed = 1; seed < 400; seed += 1) {
      const task = generateTask({ kind: "solve", topic: "two-step", seed });
      if (task.answerValue!.n < 0) {
        expect(gradeNumber(task, String(task.answerValue!.n))).toMatchObject({ correct: true });
        expect(gradeNumber(task, String(-task.answerValue!.n))).toMatchObject({ correct: false });
        return;
      }
    }
    throw new Error("No negative-answer task found");
  });

  it("grades choices", () => {
    const task = generateTask({ kind: "check", topic: "one-step", seed: 2 });
    if (task.input.type !== "choice") throw new Error("expected a choice");
    expect(gradeChoice(task, task.input.correct).correct).toBe(true);
    expect(gradeChoice(task, 1 - task.input.correct).correct).toBe(false);
    expect(gradeChoice(task, task.input.correct).given).toBe(task.input.options[task.input.correct]);
  });

  it("refuses to grade a task the wrong way", () => {
    const choice = generateTask({ kind: "check", topic: "one-step", seed: 2 });
    expect(() => gradeNumber(choice, "1")).toThrow();
    expect(() => gradeChoice(solveTask, 0)).toThrow();
  });
});
