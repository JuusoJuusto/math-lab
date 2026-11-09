import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { solveByHand, solveCleanly } from "@/components/solver/__tests__/helpers";
import { buildSession, generateTask, type Task } from "@/lib/tasks";
import { STORAGE_KEY, XP_PER_LEVEL, addXp, recordSolverLevel, type Progress } from "@/lib/progress";
import { parseHash, toPath } from "@/lib/routes";
import { resetProgress, updateProgress } from "@/hooks/useProgress";
import { reportProgress } from "@/src/studyHubProgress";
import { App } from "../App";

// The module itself is tested on its own; here the question is which moments of the app report, and what they say.
vi.mock("@/src/studyHubProgress", () => ({ initStudyHub: vi.fn(() => false), reportProgress: vi.fn() }));

const report = vi.mocked(reportProgress);

/** Everything reported so far, as `[kind, details]` pairs. */
const reported = () => report.mock.calls.map(([kind, details]) => [kind, details] as const);
const kinds = () => report.mock.calls.map(([kind]) => kind);

function open(hash: string, saved?: Partial<Progress>) {
  if (saved) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  window.history.replaceState(null, "", toPath(parseHash(hash), "en"));
  render(<App />);
  return userEvent.setup();
}

function answer(task: Task) {
  const options = document.querySelectorAll<HTMLButtonElement>(".answer");
  if (task.input.type === "choice") {
    fireEvent.click(options[task.input.correct]);
  } else {
    fireEvent.change(document.querySelector(".answer-field input")!, { target: { value: String(task.answerValue!.n) } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
  }
}

beforeEach(() => {
  report.mockClear();
  window.sessionStorage.clear();
  window.localStorage.clear();
});

afterEach(() => {
  act(() => resetProgress());
  vi.restoreAllMocks();
});

describe("what a lesson reports", () => {
  it("says it started, passes a quarter, a half and three quarters of the way, and gives the score", async () => {
    const user = open("#/solve/one-step");
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    expect(kinds()).toEqual(["started"]);
    expect(report).toHaveBeenLastCalledWith("started", { label: "One-step equations", ref: "lesson-one-step" });

    for (let n = 1; n <= 5; n += 1) {
      await screen.findByText(`Equation ${n} of 5`);
      await solveCleanly(user);
      await user.click(screen.getByRole("button", { name: n === 5 ? /Finish level/ : /Next equation/ }));
    }

    // The lesson's own quarters, not the overall progress that finishing the lesson also moves.
    const progress = reported().filter(([kind, details]) => kind === "progress" && details?.ref === "lesson-one-step");
    expect(progress.map(([, details]) => details?.value)).toEqual([25, 50, 75]);
    for (const [, details] of progress) expect(details).toMatchObject({ label: "One-step equations", ref: "lesson-one-step" });

    const score = reported().find(([kind]) => kind === "score")!;
    expect(score[1]).toMatchObject({ label: "One-step equations", ref: "lesson-one-step", max: 5 });
    expect(score[1]!.value).toBeGreaterThanOrEqual(0);
    expect(score[1]!.value).toBeLessThanOrEqual(5);
  });

  it("reports a finished lesson, and the chapter it completes, only the first time", async () => {
    const user = open("#/solve/one-step");
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    for (let n = 1; n <= 5; n += 1) {
      await screen.findByText(`Equation ${n} of 5`);
      await solveCleanly(user);
      await user.click(screen.getByRole("button", { name: n === 5 ? /Finish level/ : /Next equation/ }));
    }
    const completed = reported().filter(([kind]) => kind === "completed");
    // "Solving an equation" has only this one lesson, so it is done as well.
    expect(completed.map(([, details]) => details?.ref)).toEqual(["lesson-one-step", "chapter-solving"]);
    expect(completed[1][1]).toMatchObject({ label: "Solving an equation" });

    // Practising the same lesson again is not a second completion.
    report.mockClear();
    await user.click(screen.getByRole("button", { name: /Practise again/ }));
    for (let n = 1; n <= 5; n += 1) {
      await screen.findByText(`Equation ${n} of 5`);
      await solveCleanly(user);
      await user.click(screen.getByRole("button", { name: n === 5 ? /Finish level/ : /Next equation/ }));
    }
    expect(kinds()).toContain("started");
    expect(kinds()).toContain("score");
    expect(kinds()).not.toContain("completed");
  });

  it("does not mention a chapter that still has lessons left", async () => {
    // "Practising solving" has two lessons, and the learner has done neither.
    const user = open("#/solve/two-step");
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    for (let n = 1; n <= 5; n += 1) {
      await screen.findByText(`Equation ${n} of 5`);
      await solveCleanly(user);
      await user.click(screen.getByRole("button", { name: n === 5 ? /Finish level/ : /Next equation/ }));
    }
    const refs = reported()
      .filter(([kind]) => kind === "completed")
      .map(([, details]) => details?.ref);
    expect(refs).toEqual(["lesson-two-step"]);
  });

  it("sends nothing the learner typed, only fixed labels and ids", async () => {
    const user = open("#/solve/one-step");
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    await screen.findByText("Equation 1 of 5");
    await solveCleanly(user);
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    const allowed = new Set(["label", "ref", "value", "max"]);
    for (const [, details] of reported()) {
      expect(Object.keys(details ?? {}).every((key) => allowed.has(key))).toBe(true);
      expect(String(details?.ref ?? "")).toMatch(/^[a-z0-9-]*$/);
    }
  });
});

describe("what a practice session reports", () => {
  it("starts once, passes a quarter, a half and three quarters, and gives the score", async () => {
    const tasks = buildSession({ mode: "truefalse", topic: "one-step", count: 4, seed: 3, missed: [] }).map((spec) => generateTask(spec));
    const user = open("#/practice/truefalse?topic=one-step&n=4&seed=3");

    for (const [index, task] of tasks.entries()) {
      await screen.findByText(`Task ${index + 1} / 4`);
      answer(task);
      await user.click(screen.getByRole("button", { name: /^(Next|See results)/ }));
    }
    await screen.findByText(/correct/i);

    expect(kinds().filter((kind) => kind === "started")).toHaveLength(1);
    expect(reported()[0]).toEqual(["started", expect.objectContaining({ ref: "practice-truefalse" })]);
    expect(reported().filter(([kind]) => kind === "progress").map(([, details]) => details?.value)).toEqual([25, 50, 75]);
    const score = reported().find(([kind]) => kind === "score")!;
    expect(score[1]).toMatchObject({ ref: "practice-truefalse", value: 4, max: 4 });
    // It is called by its name, the same one every time.
    expect(reported()[0][1]!.label).toBe(score[1]!.label);
    expect(String(score[1]!.label).length).toBeGreaterThan(0);
  });

  it("gives no 'out of' for time attack, which has no fixed length, and no progress marks", async () => {
    open("#/practice/time?topic=one-step&n=5&seed=3");
    await screen.findByRole("timer");
    expect(kinds()).toEqual(["started"]);
    expect(reported()[0][1]).toMatchObject({ ref: "practice-time" });
  });

  it("reports whole by-hand tasks the same way as others, without what was written", async () => {
    const tasks = buildSession({ mode: "exam", topic: "one-step", count: 3, seed: 5, missed: [] }).map((spec) => generateTask(spec));
    const user = open("#/practice/exam?topic=one-step&n=3&seed=5");
    for (const [index, task] of tasks.entries()) {
      await screen.findByText(`Task ${index + 1} / 3`);
      if (task.input.type === "hand") {
        await solveByHand(user);
        await user.click(screen.getByRole("button", { name: "See how you did" }));
        await screen.findByText("Correct!");
      } else {
        answer(task);
      }
      await user.click(screen.getByRole("button", { name: /^(Next|See results)/ }));
    }
    expect(JSON.stringify(reported())).not.toMatch(/x\s*=|[0-9]\s*[+−-]\s*x/);
    expect(kinds()).toContain("score");
  });
});

describe("what finishing a topic reports, however it was finished", () => {
  it("reports a topic that is finished by practising it, not only by a lesson round", async () => {
    const tasks = buildSession({ mode: "quiz", topic: "one-step", count: 5, seed: 7, missed: [] }).map((spec) => generateTask(spec));
    const user = open("#/practice/quiz?topic=one-step&n=5&seed=7");
    for (const [index, task] of tasks.entries()) {
      await screen.findByText(`Task ${index + 1} / 5`);
      answer(task);
      await user.click(screen.getByRole("button", { name: /^(Next|See results)/ }));
    }
    const completed = reported()
      .filter(([kind]) => kind === "completed")
      .map(([, details]) => details?.ref);
    expect(completed).toEqual(["lesson-one-step", "chapter-solving"]);
    // ...and how far along the student is now.
    expect(reported().find(([, details]) => details?.ref === "overall")?.[1]).toMatchObject({ label: "Overall progress", value: 9 });
  });

  it("gives the overall progress when a lesson is finished, and the level when the XP goes up", () => {
    act(() => updateProgress((old) => addXp(recordSolverLevel(old, "one-step"), XP_PER_LEVEL)));
    expect(reported().map(([kind, details]) => `${kind}:${details?.ref}`)).toEqual([
      "completed:lesson-one-step",
      "completed:chapter-solving",
      "progress:overall",
      "level:xp-level",
    ]);
  });

  it("does not report anything about progress that was only loaded, not earned", () => {
    open("#/learn", { solverLevels: ["one-step", "two-step"], xp: 450 });
    expect(report).not.toHaveBeenCalled();
  });
});

describe("what a student who comes from Study Hub already has", () => {
  it("is reported when the app opens, once for the visit", () => {
    window.sessionStorage.setItem("studyhub_token", "TKN");
    open("#/learn", { solverLevels: ["one-step"], xp: 250 });
    expect(reported().map(([kind, details]) => `${kind}:${details?.ref}`)).toEqual([
      "completed:lesson-one-step",
      "completed:chapter-solving",
      "progress:overall",
      "level:xp-level",
    ]);

    // A second page of the same visit is not a second report.
    report.mockClear();
    document.body.innerHTML = "";
    open("#/learn", { solverLevels: ["one-step"], xp: 250 });
    expect(report).not.toHaveBeenCalled();
  });

  it("is not reported for anyone who did not come from Study Hub", () => {
    window.sessionStorage.removeItem("studyhub_token");
    open("#/learn", { solverLevels: ["one-step"], xp: 250 });
    expect(report).not.toHaveBeenCalled();
  });
});

describe("what a level-up reports", () => {
  it("tells Study Hub when the XP level goes up, once per level", () => {
    act(() => updateProgress((old) => addXp(old, XP_PER_LEVEL - 10)));
    expect(report).not.toHaveBeenCalled();

    act(() => updateProgress((old) => addXp(old, 10)));
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenLastCalledWith("level", { label: "Level 2", ref: "xp-level", value: 2 });

    act(() => updateProgress((old) => addXp(old, 5)));
    expect(report).toHaveBeenCalledTimes(1);

    act(() => updateProgress((old) => addXp(old, XP_PER_LEVEL)));
    expect(report).toHaveBeenLastCalledWith("level", { label: "Level 3", ref: "xp-level", value: 3 });
  });

  it("does not report when progress is reset to nothing", () => {
    act(() => updateProgress((old) => addXp(old, XP_PER_LEVEL * 3)));
    report.mockClear();
    act(() => resetProgress());
    expect(report).not.toHaveBeenCalled();
  });
});
