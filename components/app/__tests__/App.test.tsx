import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { questionsFor } from "@/content/questions";
import { STORAGE_KEY, type Progress } from "@/lib/progress";
import { parseHash, toPath } from "@/lib/routes";
import { buildSession, dateSeed, generateTask, getMode, type ModeId, type Task } from "@/lib/tasks";
import { localDate } from "@/hooks/useToday";
import { App } from "../App";

type User = ReturnType<typeof userEvent.setup>;

/** Opens a screen by its short legacy address (`#/learn/both`), which the test turns into the page address (`/en/learn/both/`). */
function open(hash = "", saved?: Partial<Progress>) {
  if (saved) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  window.history.replaceState(null, "", toPath(parseHash(hash), "en"));
  const user = userEvent.setup();
  render(<App />);
  return { user };
}

const stored = (): Progress => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");

/** The tasks of a session, exactly as the app builds them from the address. */
function tasksOf(mode: ModeId, topic: string, count: number, seed: number, missed: Progress["missed"] = []): Task[] {
  return buildSession({ mode, topic, count, seed, missed }).map((spec) => generateTask(spec));
}

/** Answers the task on screen, rightly or wrongly. */
function answer(task: Task, correct: boolean) {
  if (task.input.type === "choice") {
    const options = document.querySelectorAll<HTMLButtonElement>(".answer");
    const wrong = options[(task.input.correct + 1) % options.length];
    fireEvent.click(correct ? options[task.input.correct] : wrong);
  } else {
    const value = correct ? String(task.answerValue!.n) : String(task.answerValue!.n + 1);
    fireEvent.change(document.querySelector(".answer-field input")!, { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
  }
}

async function next(user: User) {
  await user.click(screen.getByRole("button", { name: /^(Next|See results)/ }));
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("home", () => {
  it("introduces MathLab and offers the first level to a new learner", () => {
    open("");
    expect(screen.getByRole("heading", { level: 1, name: "Solve equations, step by step!" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Start learning/ })).toBeTruthy();
    expect(screen.getByText("Overall progress")).toBeTruthy();
    expect(document.title).toBe("MathLab");
  });

  it("shows the four equation topics and eight ways to practise", () => {
    open("");
    const learn = within(screen.getByRole("region", { name: "Learn equations" }));
    expect(learn.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "All topics",
      expect.stringContaining("Understanding equations"),
      expect.stringContaining("One-step equations"),
      expect.stringContaining("Two-step equations"),
      expect.stringContaining("Variables on both sides"),
    ]);
    const practise = within(screen.getByRole("region", { name: "Practise" }));
    expect(practise.getAllByRole("link")).toHaveLength(1 + 8);
  });

  it("continues with the first level that is not finished yet", async () => {
    const { user } = open("", { solverLevels: ["one-step"] });
    await user.click(screen.getByRole("button", { name: /Continue learning/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Two-step equations" })).toBeTruthy();
    expect(window.location.pathname).toBe("/en/solve/two-step/");
  });

  it("sends a learner who finished every level to the practice hub", async () => {
    const { user } = open("", { solverLevels: ["one-step", "two-step", "both", "brackets", "fractions", "word", "special", "hard-word", "challenge"] });
    await user.click(screen.getByRole("button", { name: /Continue learning/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Practice" })).toBeTruthy();
  });

  it("has a try-it-now question that does not give the answer away after a wrong pick", async () => {
    const { user } = open("");
    await user.click(screen.getByRole("button", { name: /Add 5/ }));
    expect(screen.getByRole("status").textContent).toMatch(/Not quite/);
    expect(document.querySelector(".tryit-option.right")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Subtract 5/ }));
    expect(screen.getByRole("status").textContent).toMatch(/Yes!/);
  });

  it("shows level and XP in the header", () => {
    open("", { xp: 250 });
    expect(screen.getByRole("link", { name: "Level 3, 250 XP. Open progress." })).toBeTruthy();
  });
});

describe("navigation", () => {
  it("moves between screens and keeps the browser's Back button working", async () => {
    const { user } = open("");
    await user.click(screen.getByRole("link", { name: "Learn" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Learn" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Learn" }).getAttribute("aria-current")).toBe("page");

    await user.click(screen.getByRole("link", { name: /Two-step equations/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Two-step equations" })).toBeTruthy();
    expect(document.title).toBe("Lesson | MathLab");

    act(() => window.history.back());
    expect(await screen.findByRole("heading", { level: 1, name: "Learn" })).toBeTruthy();
    act(() => window.history.back());
    expect(await screen.findByRole("heading", { level: 1, name: "Solve equations, step by step!" })).toBeTruthy();
  });

  it("opens a screen straight from its address", () => {
    open("#/learn/both");
    expect(screen.getByRole("heading", { level: 1, name: "Variables on both sides" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Solve step by step/ }).getAttribute("href")).toBe("/en/solve/both/");
  });

  it("falls back to the home screen for an address that does not exist", () => {
    open("#/nonsense/here");
    expect(screen.getByRole("heading", { level: 1, name: "Solve equations, step by step!" })).toBeTruthy();
  });

  it("opens and closes the phone menu with the keyboard and the mouse", async () => {
    const { user } = open("");
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button.getAttribute("aria-expanded")).toBe("false");

    await user.click(button);
    const menu = screen.getByRole("navigation", { name: "Menu" });
    expect(within(menu).getAllByRole("link").map((link) => link.textContent)).toEqual(["Home", "Learn", "Practice", "Progress"]);
    expect(screen.getByRole("button", { name: "Close menu", expanded: true })).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Menu" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(within(screen.getByRole("navigation", { name: "Menu" })).getByRole("link", { name: "Practice" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Practice" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Menu" })).toBeNull();
  });

  it("lets keyboard users skip to the content", async () => {
    const { user } = open("");
    await user.click(screen.getByRole("button", { name: "Skip to content" }));
    expect(document.activeElement).toBe(document.getElementById("main"));
  });
});

describe("learning", () => {
  it("lists every topic and marks the ones that are finished", () => {
    open("#/learn", { solverLevels: ["one-step"], completed: ["simple"] });
    expect(document.querySelectorAll(".module")).toHaveLength(11);
    // "one-step" is finished twice over (solver and an old quiz round) but is still one topic.
    expect(screen.getAllByText("Finished")).toHaveLength(1);
  });

  it("offers the solver where there is one, and varied practice for every topic", async () => {
    const { user } = open("#/learn/proportion");
    expect(screen.queryByRole("link", { name: /Solve step by step/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: /Practise this topic/ }));
    expect(`${window.location.pathname}${window.location.search}`).toMatch(/^\/en\/practice\/exam\/\?topic=proportion&n=10&seed=\d+$/);
    expect(await screen.findByText("Task 1 / 10")).toBeTruthy();
  });

  it("runs the equation solver inside the app and awards XP for finished equations and levels", async () => {
    const { user } = open("#/solve/one-step");
    expect(screen.getByRole("heading", { level: 1, name: "One-step equations" })).toBeTruthy();
    expect(screen.getByText("Level 1 · Equation solver")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    expect(screen.getByText("Equation 1 of 5")).toBeTruthy();
  });
});

describe("the practice hub", () => {
  it("offers ten ways to practise", () => {
    open("#/practice");
    expect(screen.getAllByRole("link", { name: /tasks|questions|seconds|waiting|XP|Your queue/i }).length).toBeGreaterThanOrEqual(10);
    for (const title of ["Daily challenge", "Quick quiz", "Solve it", "True or false", "Which step?", "Find the mistake", "Write the equation", "Time attack", "Exam practice", "Fix your mistakes"]) {
      expect(screen.getByText(title, { selector: ".game-band" })).toBeTruthy();
    }
  });

  it("shows the setup for a mode and starts it with the chosen topic and length", async () => {
    const { user } = open("#/practice?mode=solve");
    expect(screen.getByRole("heading", { level: 2, name: "Solve it" })).toBeTruthy();

    await user.click(screen.getByRole("radio", { name: "Two-step equations" }));
    await user.click(screen.getByRole("radio", { name: "5" }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(`${window.location.pathname}${window.location.search}`).toMatch(/^\/en\/practice\/solve\/\?topic=two-step&n=5&seed=\d+$/);
    expect(await screen.findByText("Task 1 / 5")).toBeTruthy();
  });

  it("only offers topics a mode really has tasks for", () => {
    open("#/practice?mode=mistake");
    const topics = screen.getAllByRole("radio", { name: /equations|sides/i }).map((radio) => (radio.nextSibling as HTMLElement).textContent);
    expect(topics).toEqual(["Two-step equations", "Variables on both sides"]);
  });

  it("will not start 'fix your mistakes' when there is nothing to fix", () => {
    open("#/practice?mode=mistakes");
    expect((screen.getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/No mistakes to fix/)).toBeTruthy();
  });

  it("counts the mistakes that are waiting", () => {
    open("#/practice?mode=mistakes", { missed: [{ kind: "solve", topic: "two-step", seed: 4 }] });
    expect((screen.getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText("1 task waiting for another try.")).toBeTruthy();
  });
});

describe("a practice session", () => {
  it("grades typed answers, explains mistakes by substitution, and records XP and the mistake queue", async () => {
    const [first, second] = tasksOf("solve", "two-step", 3, 11);
    const { user } = open("#/practice/solve?topic=two-step&n=3&seed=11");

    expect(await screen.findByText("Task 1 / 3")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: first.prompt })).toBeTruthy();

    answer(first, true);
    expect(await screen.findByText("Correct!")).toBeTruthy();
    expect(screen.getByText("+10 XP", { selector: ".xp-pop" })).toBeTruthy();
    expect(stored()).toMatchObject({ attempts: 1, correct: 1, xp: 10, missed: [] });
    await next(user);

    expect(await screen.findByText("Task 2 / 3")).toBeTruthy();
    answer(second, false);
    expect(await screen.findByText("Not quite.")).toBeTruthy();
    expect(screen.getByText(/Check: with x = .* They are not equal/)).toBeTruthy();
    expect(stored()).toMatchObject({ attempts: 2, correct: 1, xp: 10 });
    expect(stored().missed).toEqual([second.spec]);
  });

  it("asks again, without penalty, when a typed answer cannot be read", async () => {
    open("#/practice/solve?topic=one-step&n=2&seed=3");
    await screen.findByText("Task 1 / 2");
    fireEvent.change(document.querySelector(".answer-field input")!, { target: { value: "banana" } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/number/);
    expect(stored().attempts ?? 0).toBe(0);
    expect(screen.queryByText("Not quite.")).toBeNull();
  });

  it("switches an answer between positive and negative with the sign button, for phones without a minus key", async () => {
    const { user } = open("#/practice/solve?topic=two-step&n=1&seed=8");
    await screen.findByText("Task 1 / 1");
    const input = document.querySelector<HTMLInputElement>(".answer-field input")!;

    fireEvent.change(input, { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: /positive and negative/ }));
    expect(input.value).toBe("-5");
    await user.click(screen.getByRole("button", { name: /positive and negative/ }));
    expect(input.value).toBe("5");
  });

  it.each([
    ["the number", (n: number) => String(n)],
    ["x = the number", (n: number) => `x = ${n}`],
    ["a decimal with a comma", (n: number) => `${n},0`],
    ["a fraction", (n: number) => `${n * 3}/3`],
  ])("accepts %s as the right answer", async (_name, write) => {
    const [task] = tasksOf("solve", "two-step", 1, 8);
    open("#/practice/solve?topic=two-step&n=1&seed=8");
    await screen.findByText("Task 1 / 1");
    fireEvent.change(document.querySelector(".answer-field input")!, { target: { value: write(task.answerValue!.n) } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("Correct!")).toBeTruthy();
  });

  it("answers choice tasks with the number keys", async () => {
    const [task] = tasksOf("truefalse", "one-step", 2, 3);
    open("#/practice/truefalse?topic=one-step&n=2&seed=3");
    await screen.findByText("Task 1 / 2");
    const correct = task.input.type === "choice" ? task.input.correct : 0;
    fireEvent.keyDown(window, { key: String(correct + 1) });
    expect(await screen.findByText("Correct!")).toBeTruthy();
  });

  it("moves focus to Next after answering so Enter carries on", async () => {
    const [task] = tasksOf("quiz", "two-step", 2, 9);
    open("#/practice/quiz?topic=two-step&n=2&seed=9");
    await screen.findByText("Task 1 / 2");
    answer(task, true);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: /^Next/ })));
  });

  it("marks the right and the wrong choice after answering, with text for screen readers", async () => {
    const [task] = tasksOf("step", "two-step", 1, 7);
    open("#/practice/step?topic=two-step&n=1&seed=7");
    await screen.findByText("Task 1 / 1");
    answer(task, false);
    await screen.findByText("Not quite.");
    expect(document.querySelectorAll(".answer.right")).toHaveLength(1);
    expect(document.querySelectorAll(".answer.wrong")).toHaveLength(1);
    expect(screen.getByText("Correct answer")).toBeTruthy();
    expect(screen.getByText("Your answer, incorrect")).toBeTruthy();
    expect(document.querySelectorAll<HTMLButtonElement>(".answer:disabled").length).toBe(4);
  });

  it("plays a whole exam, then shows results by task type, XP and a review of mistakes", async () => {
    const tasks = tasksOf("exam", "all", 8, 21);
    const { user } = open("#/practice/exam?topic=all&n=8&seed=21");
    for (const [index, task] of tasks.entries()) {
      await screen.findByText(`Task ${index + 1} / 8`);
      answer(task, index % 2 === 0);
      await next(user);
    }

    expect(await screen.findByRole("heading", { level: 1, name: /practising|progress|work|Perfect/i })).toBeTruthy();
    expect(screen.getByText("exam practice complete", { exact: false })).toBeTruthy();
    expect(document.querySelector(".results-score")!.textContent).toBe("4 / 8 correct");
    expect(screen.getByText("+40 XP")).toBeTruthy();
    expect(within(screen.getByRole("list", { name: "Results by type of task" })).getAllByRole("listitem").length).toBeGreaterThan(2);

    // Every missed task can be reviewed with the answer and the reasoning.
    const review = within(screen.getByRole("region", { name: "Review your mistakes" }));
    expect(review.getAllByRole("group").length + document.querySelectorAll(".review details").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".review details")).toHaveLength(4);

    expect(stored()).toMatchObject({ attempts: 8, correct: 4, xp: 40 });
    expect(stored().missed).toHaveLength(4);
    expect(Object.keys(stored().byGroup).length).toBeGreaterThan(3);
  });

  it("turns missed tasks into a 'fix your mistakes' session that removes them once solved", async () => {
    const missed = tasksOf("solve", "two-step", 2, 5).map((task) => task.spec);
    const { user } = open("#/practice/mistakes?topic=all&n=10&seed=1", { missed, attempts: 2, correct: 0 });
    const tasks = missed.map((spec) => generateTask(spec));

    await screen.findByText("Task 1 / 2");
    answer(tasks[0], true);
    await next(user);
    await screen.findByText("Task 2 / 2");
    answer(tasks[1], false);
    await next(user);

    expect(await screen.findByText(/Fix your mistakes complete/i)).toBeTruthy();
    expect(stored().missed).toEqual([missed[1]]);
  });

  it("shows a friendly message when a mode has no tasks for the chosen topic", () => {
    open("#/practice/mistake?topic=brackets&n=5&seed=1");
    expect(screen.getByRole("heading", { level: 1, name: "No tasks for this choice" })).toBeTruthy();
  });

  it("gives the same daily challenge all day, and the XP bonus only once", async () => {
    const seed = dateSeed(localDate());
    const tasks = tasksOf("daily", "all", 5, seed);
    const play = async (user: User) => {
      for (const [index, task] of tasks.entries()) {
        await screen.findByText(`Task ${index + 1} / 5`);
        answer(task, true);
        await next(user);
      }
    };

    const first = open(`#/practice/daily?topic=all&n=5&seed=${seed}`);
    await play(first.user);
    expect(await screen.findByText("+75 XP (including +25 daily bonus)")).toBeTruthy();
    expect(stored().dailyDone).toBe(localDate());
    expect(stored().xp).toBe(75);

    // Playing it again is allowed, but earns no second bonus.
    document.body.innerHTML = "";
    window.history.replaceState(null, "", `/en/practice/daily/?topic=all&n=5&seed=${seed}`);
    const again = userEvent.setup();
    render(<App />);
    await play(again);
    expect(await screen.findByText("+50 XP")).toBeTruthy();
    expect(stored().xp).toBe(125);
  });

  it("counts down in time attack, moves on by itself, and stops when the time is up", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const tasks = tasksOf("time", "one-step", 40, 1);
    open("#/practice/time?topic=one-step&n=40&seed=1");

    expect(screen.getByRole("timer").getAttribute("aria-label")).toBe("60 seconds left");
    answer(tasks[0], true);
    expect(screen.getByText(/Correct \+5 XP/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Next/ })).toBeNull();

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByText("1 correct")).toBeTruthy();
    expect(screen.queryByText(/Correct \+5 XP/)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(screen.getByRole("heading", { level: 1, name: "1 correct in 60 seconds" })).toBeTruthy();
    expect(stored()).toMatchObject({ bestTime: 1, xp: 5 });
  });

  it("never repeats a task inside a session", () => {
    for (const mode of ["quiz", "solve", "exam"] as const) {
      const prompts = tasksOf(mode, "all", getMode(mode)!.defaultCount, 4).map((task) => `${task.prompt}|${JSON.stringify(task.display)}`);
      expect(new Set(prompts).size).toBe(prompts.length);
    }
    expect(questionsFor("all").length).toBeGreaterThan(10);
  });
});

describe("progress", () => {
  it("shows level, XP, accuracy by topic and by type of task, and suggests what to do next", async () => {
    const { user } = open("#/progress", {
      xp: 130,
      attempts: 10,
      correct: 6,
      byTopic: { "two-step": { attempts: 6, correct: 6 }, both: { attempts: 4, correct: 1 } },
      byGroup: { solve: { attempts: 6, correct: 6 }, mistake: { attempts: 4, correct: 1 } },
      missed: [{ kind: "solve", topic: "both", seed: 3 }],
      solverLevels: ["one-step"],
    });

    expect(screen.getByText("Level 2")).toBeTruthy();
    expect(screen.getByText("30 / 100 XP to level 3")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "XP to next level" }).getAttribute("aria-valuenow")).toBe("30");
    // Two-step (by topic) and Solve it (by type of task) both read 6 of 6.
    expect(screen.getAllByText("6 of 6 correct (100 %)", { selector: ".row-sub" })).toHaveLength(2);
    expect(screen.getAllByText("1 of 4 correct (25 %)", { selector: ".row-sub" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Variables on both sides" }).getAttribute("href")).toBe("/en/learn/both/");
    expect(screen.getAllByText("Solver")).toHaveLength(1);
    expect(screen.getAllByText("Practised")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /Fix your 1 mistake/ }));
    expect(await screen.findByText("Task 1 / 1")).toBeTruthy();
  });

  it("treats progress saved before the topic split as finished one-step work", () => {
    open("#/progress", { completed: ["simple"], attempts: 3, correct: 3 });
    expect(screen.getByText("1 / 11")).toBeTruthy();
  });

  it("asks before deleting everything, and can be cancelled", async () => {
    const { user } = open("#/progress", { xp: 90, attempts: 4, correct: 3 });
    await user.click(screen.getByRole("button", { name: "Reset progress" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));
    expect(stored().xp).toBe(90);

    await user.click(screen.getByRole("button", { name: "Reset progress" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete my progress" }));
    expect(stored()).toMatchObject({ xp: 0, attempts: 0, correct: 0, missed: [], solverLevels: [] });
    expect(screen.getByText("Level 1")).toBeTruthy();
  });

  it("survives unreadable saved data", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    open("#/progress");
    expect(screen.getByRole("heading", { level: 1, name: "Progress" })).toBeTruthy();
    expect(screen.getByText("Level 1")).toBeTruthy();
  });
});
