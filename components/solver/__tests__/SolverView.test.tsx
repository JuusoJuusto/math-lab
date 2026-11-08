import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { topics } from "@/content/topics";
import { createRng, getLevel, type LevelId } from "@/lib/equations";
import { SolverView } from "../SolverView";
import { solveOnScreenEquation, spokenEquation } from "./helpers";

function setup(levelId: LevelId = "one-step") {
  const level = getLevel(levelId)!;
  const topic = topics.find((item) => item.id === levelId)!;
  const handlers = { onComplete: vi.fn(), onExit: vi.fn(), onOpenLevel: vi.fn(), onQuiz: vi.fn() };
  const user = userEvent.setup();
  render(<SolverView level={level} topic={topic} {...handlers} />);
  return { ...handlers, user, level };
}

/** Solves every equation of a round and returns what was on screen at the start of each. */
async function playRound(user: ReturnType<typeof userEvent.setup>) {
  const seen: string[] = [];
  for (let n = 1; n <= 5; n += 1) {
    await screen.findByText(`Equation ${n} of 5`);
    // The last equation of a round is solved by hand, and is shown as it is written.
    seen.push(spokenEquation() || document.querySelector(".hand .eq-written")?.getAttribute("data-source") || "");
    await solveOnScreenEquation(user);
    await user.click(screen.getByRole("button", { name: n === 5 ? /Finish level/ : /Next equation/ }));
  }
  return seen;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SolverView: a level from introduction to completion", () => {
  it("starts with a short introduction and the balance rule", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1, name: "One-step equations" })).toBeTruthy();
    expect(screen.getByText("The big idea")).toBeTruthy();
    expect(screen.getByText(/Whatever you do to one side, you must do to the other side too/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Learn" }).getAttribute("aria-current")).toBe("step");
    // The introduction itself demonstrates the rule on a real equation.
    expect(spokenEquation()).toBe("Example: x plus 5 minus 5 equals 12 minus 5");
  });

  it("walks through a worked example one step at a time, ending in a substitution check", async () => {
    const { user } = setup("two-step");
    await user.click(screen.getByRole("button", { name: /See a worked example/ }));
    expect(screen.getByRole("button", { name: "Example" }).getAttribute("aria-current")).toBe("step");
    expect(screen.getByText(/x was multiplied by 2 and then 5 was added/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Show the first step" }));
    expect(screen.getByText("Step 1: Subtract 5 from both sides")).toBeTruthy();
    expect(spokenEquation()).toBe("Worked example: 2x plus 5 minus 5 equals 17 minus 5");

    await user.click(screen.getByRole("button", { name: "Work out both sides" }));
    await user.click(screen.getByRole("button", { name: "Show the next step" }));
    expect(screen.getByText("Step 2: Divide both sides by 2")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Work out both sides" }));

    expect(spokenEquation()).toBe("Worked example: x equals 6");
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    expect(screen.getByText("Both sides are equal, so x = 6 is correct!")).toBeTruthy();
    // The check ends the way a textbook does, with the verdict "true" ("tosi" in Finnish).
    expect(document.querySelector(".verify-verdict")?.textContent).toBe("true");
    expect(screen.getByRole("button", { name: /Try it yourself/ })).toBeTruthy();
  });

  it("shows a second way to solve the example once it is solved, written with the double bar", async () => {
    const { user } = setup("both");
    await user.click(screen.getByRole("button", { name: /See a worked example/ }));
    expect(screen.queryByText("Another way to solve it")).toBeNull();

    // 6x − 4 = 2x + 8 takes three steps; let the tutor do each one.
    for (let step = 1; step <= 3; step += 1) {
      await user.click(screen.getByRole("button", { name: step === 1 ? "Show the first step" : "Show the next step" }));
      await user.click(screen.getByRole("button", { name: "Work out both sides" }));
    }

    const card = screen.getByRole("region", { name: "Another way to solve it" });
    const bars = [...card.querySelectorAll(".history-bar")].map((bar) => bar.textContent);
    // The tutor collected the x terms first; the other way adds 4 first. Same answer.
    expect(bars).toEqual(["|| + 4", "|| − 2x", "|| ÷ 4"]);
    expect(card.textContent).toContain("x equals 3");
  });

  it("lets the learner replay the worked example", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /See a worked example/ }));
    await user.click(screen.getByRole("button", { name: "Show the first step" }));
    await user.click(screen.getByRole("button", { name: "Work out both sides" }));
    await user.click(screen.getByRole("button", { name: "Watch again" }));
    expect(screen.getByRole("button", { name: "Show the first step" })).toBeTruthy();
    expect(spokenEquation()).toBe("Worked example: x plus 5 equals 12");
  });

  it("moves focus to the new stage so keyboard and screen-reader users are not left behind", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /See a worked example/ }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Example" }));

    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Practise" }));
  });

  it("lets the learner jump between stages", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Example" }));
    expect(screen.getByRole("button", { name: /Show the first step/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Learn" }));
    expect(screen.getByText("The big idea")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Practise" }));
    expect(screen.getByText("Equation 1 of 5")).toBeTruthy();
  });

  it("completes a five-equation round, reports it once, and shows a recap", async () => {
    vi.spyOn(Math, "random").mockImplementation(createRng(42));
    const { user, onComplete } = setup();
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));

    const seen = await playRound(user);

    expect(new Set(seen).size).toBe(5);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("one-step");

    expect(screen.getByRole("heading", { name: "One-step equations: done!" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "One-step equations: done!" }));
    expect(screen.getByText("LEVEL 1 COMPLETE")).toBeTruthy();
    expect(screen.getAllByRole("listitem").filter((item) => item.querySelector(".recap-answer")).length).toBe(5);
    expect(screen.getByRole("button", { name: /Next: Two-step equations/ })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Level steps" })).toBeNull();
  });

  it("offers a fresh set of equations when practising again", async () => {
    vi.spyOn(Math, "random").mockImplementation(createRng(7));
    const { user, onComplete } = setup();
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    const firstRound = await playRound(user);

    await user.click(screen.getByRole("button", { name: /Practise again/ }));
    const secondRound = await playRound(user);

    expect(secondRound.some((equation) => firstRound.includes(equation))).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("completes a two-step round and a both-sides round too", async () => {
    for (const levelId of ["two-step", "both"] as const) {
      vi.spyOn(Math, "random").mockImplementation(createRng(3));
      const { user, onComplete } = setup(levelId);
      await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
      await playRound(user);
      expect(onComplete).toHaveBeenCalledWith(levelId);
      document.body.innerHTML = "";
    }
  });

  it("links on to the next level, the quiz and the topic list", async () => {
    vi.spyOn(Math, "random").mockImplementation(createRng(1));
    const { user, onOpenLevel, onQuiz, onExit } = setup();
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    await playRound(user);

    await user.click(screen.getByRole("button", { name: /Next: Two-step equations/ }));
    expect(onOpenLevel).toHaveBeenCalledWith("two-step");

    await user.click(screen.getByRole("button", { name: /Take the quiz/ }));
    expect(onQuiz).toHaveBeenCalledWith("one-step");

    await user.click(screen.getByRole("button", { name: /All topics/ }));
    expect(onExit).toHaveBeenCalled();
  });

  it("leads from the both-sides level on to forming equations, as the chapters do", async () => {
    vi.spyOn(Math, "random").mockImplementation(createRng(1));
    const { user, onOpenLevel } = setup("both");
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    await playRound(user);
    await user.click(screen.getByRole("button", { name: /Next: Word problems/ }));
    expect(onOpenLevel).toHaveBeenCalledWith("word");
  });

  it("can leave a round part-way without recording completion", async () => {
    const { user, onComplete, onExit } = setup();
    await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
    await user.click(screen.getByRole("button", { name: /Leave practice/ }));
    expect(onExit).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
