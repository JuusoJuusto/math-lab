import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getTopic } from "@/content/topics";
import { createRng, getLevel } from "@/lib/equations";
import { pickStoryRound } from "@/lib/tasks";
import { SolverView } from "../SolverView";
import { solveOnScreenEquation } from "./helpers";

function setup() {
  const level = getLevel("word")!;
  const topic = getTopic("word")!;
  const handlers = { onComplete: vi.fn(), onExit: vi.fn(), onOpenLevel: vi.fn(), onQuiz: vi.fn(), onEquationSolved: vi.fn() };
  const user = userEvent.setup();
  render(<SolverView level={level} topic={topic} {...handlers} />);
  return { ...handlers, user };
}

/** Types the equation into the blank field, as a learner would. */
function writeEquation(text: string) {
  fireEvent.change(screen.getByLabelText("Your equation"), { target: { value: text } });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the word-problem level", () => {
  it("introduces the idea of writing the equation first, and shows the flip shortcut", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1, name: "Word problems" })).toBeTruthy();
    expect(screen.getByText(/First you write the equation yourself, then you solve it/)).toBeTruthy();
    expect(screen.getByText("A shortcut: flip the term")).toBeTruthy();
  });

  it("shows a worked example: the story, the equation it gives, and the solution", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /See a worked example/ }));

    expect(screen.getByText(/A taxi charges €3 to start and €2 for every kilometre/)).toBeTruthy();
    expect(screen.getByText("1. Write the equation")).toBeTruthy();
    expect(screen.getByText(/The start fee €3 is added once/)).toBeTruthy();
    expect(screen.getByText("2. Solve it")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Show the first step" }));
    await user.click(screen.getByRole("button", { name: "Work out both sides" }));
    await user.click(screen.getByRole("button", { name: "Show the next step" }));
    await user.click(screen.getByRole("button", { name: "Work out both sides" }));
    expect(screen.getByText("The ride was 6 km long.")).toBeTruthy();
  });

  it("plays a whole round: write the equation, solve it, answer the question, five times", async () => {
    vi.spyOn(Math, "random").mockImplementation(createRng(7));
    const stories = pickStoryRound(createRng(7), 5);
    const { user, onComplete, onEquationSolved } = setup();
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));

    for (let n = 1; n <= 5; n += 1) {
      await screen.findByText(`Problem ${n} of 5`);
      const story = stories[n - 1];
      // The story is on screen, with what x stands for and the question.
      expect(screen.getByText(story.i18n.en.question)).toBeTruthy();

      writeEquation(story.equations[0]);
      await user.click(screen.getByRole("button", { name: "Check my equation" }));
      expect(document.querySelector(".notice")?.textContent).toContain("That is the equation!");
      await user.click(screen.getByRole("button", { name: /Solve it/ }));

      await solveOnScreenEquation(user);
      await user.click(screen.getByRole("button", { name: /Now answer the question/ }));
      if (story.final !== undefined) {
        // The question asks for something worked out from x, so x alone is not the answer.
        const field = screen.getByLabelText("Your answer");
        await user.type(field, String(story.solution));
        await user.click(screen.getByRole("button", { name: "Check my answer" }));
        expect(document.querySelector(".final-feedback")?.textContent).toContain("is not the answer yet");
        await user.clear(field);
        await user.type(field, String(story.final));
        await user.click(screen.getByRole("button", { name: "Check my answer" }));
      }
      expect(screen.getByText(`x = ${story.solution}`)).toBeTruthy();
      expect(screen.getByText(story.i18n.en.answer)).toBeTruthy();
      await user.click(screen.getByRole("button", { name: n === 5 ? /Finish level/ : /Next problem/ }));
    }

    expect(onEquationSolved).toHaveBeenCalledTimes(5);
    expect(onComplete).toHaveBeenCalledWith("word");
    expect(screen.getByRole("heading", { name: "Word problems: done!" })).toBeTruthy();
    // The test helper asks for hints to play each move, so hints are mentioned.
    expect(screen.getByText(/You solved 5 problems\. You used \d+ hints/)).toBeTruthy();
    // The next level is the special cases.
    expect(screen.getByRole("button", { name: /^Next: Equations with brackets/ })).toBeTruthy();
  });

  it("starts with the easy problems and ends with the ones that have x on both sides or two steps", () => {
    const round = pickStoryRound(createRng(11), 5);
    expect(round.map((story) => story.difficulty)).toEqual([1, 1, 2, 2, 3]);
    expect(new Set(round.map((story) => story.id)).size).toBeGreaterThanOrEqual(4);
    expect(round.every((story) => story.difficulty <= 3)).toBe(true);
  });

  it("does not move on while the equation is wrong", async () => {
    vi.spyOn(Math, "random").mockImplementation(createRng(7));
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    await screen.findByText("Problem 1 of 5");

    writeEquation("9x = 1");
    await user.click(screen.getByRole("button", { name: "Check my equation" }));
    expect(screen.queryByRole("button", { name: /Solve it/ })).toBeNull();
    expect(screen.getByText("Problem 1 of 5")).toBeTruthy();
  });
});
