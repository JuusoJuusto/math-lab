import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { questionsFor } from "@/content/questions";
import { STORAGE_KEY } from "@/lib/progress";
import HomePage from "../page";

function setup(saved?: unknown) {
  if (saved !== undefined) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  const user = userEvent.setup();
  render(<HomePage />);
  return { user };
}

const storedProgress = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
const openLearn = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Learn" }));

/** Answers every question of the quiz on screen, correctly, and returns how many there were. */
async function answerQuizCorrectly(user: ReturnType<typeof userEvent.setup>, topicId: string) {
  const bank = questionsFor(topicId);
  for (let index = 0; index < bank.length; index += 1) {
    const heading = screen.getByRole("heading", { level: 1 });
    const question = bank.find((item) => item.prompt === heading.textContent);
    expect(question, `question "${heading.textContent}"`).toBeDefined();
    await user.click(screen.getByRole("button", { name: new RegExp(`^[A-D]${question!.answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }));
    expect(screen.getByText("Great work!")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: index + 1 === bank.length ? /View results/ : /Next question/ }));
  }
  return bank.length;
}

describe("the learning path", () => {
  it("separates understanding, one-step, two-step and both-sides equations", async () => {
    const { user } = setup();
    await openLearn(user);
    const titles = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(titles).toEqual([
      "Understanding equations",
      "One-step equations",
      "Two-step equations",
      "Variables on both sides",
      "Equations with brackets",
      "Proportional relationships",
      "Word problems",
    ]);
  });

  it("offers the step-by-step solver exactly where a solver level exists", async () => {
    const { user } = setup();
    await openLearn(user);
    expect(screen.getAllByRole("button", { name: /Solve step by step/ })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /^Start practice/ })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: /^Quiz/ })).toHaveLength(3);
  });

  it("opens the solver from the topic list, and a lesson page offers it as the main action", async () => {
    const { user } = setup();
    await openLearn(user);
    await user.click(screen.getAllByRole("button", { name: /Solve step by step/ })[1]);
    expect(screen.getByRole("heading", { level: 1, name: "Two-step equations" })).toBeTruthy();
    expect(screen.getByText("LEVEL 2 · EQUATION SOLVER")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /All topics/ }));
    await user.click(screen.getByRole("button", { name: /Variables on both sides/ }));
    expect(screen.getByText("QUICK LESSON")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Solve step by step/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Take the quiz/ })).toBeTruthy();
  });

  it("keeps the lesson for topics without a solver exactly as before", async () => {
    const { user } = setup();
    await openLearn(user);
    await user.click(screen.getByRole("button", { name: /Equations with brackets/ }));
    expect(screen.queryByRole("button", { name: /Solve step by step/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Practise this topic/ })).toBeTruthy();
  });
});

describe("the home page", () => {
  it("starts the first level for a new learner", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Start learning/ }));
    expect(screen.getByRole("heading", { level: 1, name: "One-step equations" })).toBeTruthy();
  });

  it("continues with the first level that is not finished yet", async () => {
    const { user } = setup({ completed: [], attempts: 0, correct: 0, solverLevels: ["one-step"] });
    await user.click(screen.getByRole("button", { name: /Continue learning/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Two-step equations" })).toBeTruthy();
  });

  it("goes to the topic list once every level is finished", async () => {
    const { user } = setup({ completed: [], attempts: 0, correct: 0, solverLevels: ["one-step", "two-step", "both"] });
    await user.click(screen.getByRole("button", { name: /Continue learning/ }));
    expect(screen.getByText("Choose a topic to explore")).toBeTruthy();
  });

  it("still starts the mixed practice round from the bottom call to action", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Practise now/ }));
    expect(screen.getByText(`QUESTION 1 / ${questionsFor("all").length}`)).toBeTruthy();
  });
});

describe("existing practice rounds and progress", () => {
  it("runs a quiz round, saves answers, and shows the results screen", async () => {
    const { user } = setup();
    await openLearn(user);
    const twoStepCard = screen.getByRole("button", { name: /Two-step equations/ }).closest(".topic-card-wrap") as HTMLElement;
    await user.click(within(twoStepCard).getByRole("button", { name: /^Quiz/ }));

    const total = await answerQuizCorrectly(user, "two-step");

    expect(screen.getByText("PRACTICE COMPLETE")).toBeTruthy();
    expect(screen.getByText(`You answered ${total} out of ${total} questions correctly.`)).toBeTruthy();
    expect(storedProgress()).toMatchObject({ attempts: total, correct: total, completed: ["two-step"] });
  });

  it("shows practice and solver status for each topic on the progress page", async () => {
    const { user } = setup({ completed: ["basics", "two-step"], attempts: 5, correct: 4, solverLevels: ["two-step", "both"] });
    await user.click(screen.getByRole("button", { name: "Progress" }));

    const row = (title: string) => screen.getByText(title).closest(".progress-topic") as HTMLElement;
    expect(row("Understanding equations").textContent).toContain("Practice round completed");
    expect(row("One-step equations").textContent).toContain("Not practised yet");
    expect(row("Two-step equations").textContent).toContain("Step-by-step solver and quiz completed");
    expect(row("Variables on both sides").textContent).toContain("Step-by-step solver completed");
    expect(screen.getByText("80 %")).toBeTruthy();
  });

  it("keeps progress saved before the topic split: the old 'simple' topic counts as one-step", async () => {
    const { user } = setup({ completed: ["simple"], attempts: 3, correct: 3 });
    await user.click(screen.getByRole("button", { name: "Progress" }));
    const row = screen.getByText("One-step equations").closest(".progress-topic") as HTMLElement;
    expect(row.textContent).toContain("Practice round completed");
  });

  it("resets all progress, including solver levels", async () => {
    const { user } = setup({ completed: ["basics"], attempts: 5, correct: 4, solverLevels: ["one-step"] });
    await user.click(screen.getByRole("button", { name: "Progress" }));
    await user.click(screen.getByRole("button", { name: /Reset progress/ }));

    expect(storedProgress()).toEqual({ completed: [], attempts: 0, correct: 0, solverLevels: [] });
    expect(screen.queryByText("Practice round completed")).toBeNull();
    expect(screen.queryByText("Step-by-step solver completed")).toBeNull();
  });

  it("survives unreadable saved data", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    const user = userEvent.setup();
    render(<HomePage />);
    await user.click(screen.getByRole("button", { name: "Progress" }));
    expect(screen.getByText("Your progress")).toBeTruthy();
  });
});
