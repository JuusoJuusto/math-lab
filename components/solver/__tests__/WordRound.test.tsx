import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getTopic } from "@/content/topics";
import { createRng, getLevel } from "@/lib/equations";
import { explainBuild, pickStoryRound } from "@/lib/tasks";
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

  describe("the worked example: from the story to the equation, in six steps", () => {
    const next = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Next step" }));
    const heads = () => Array.from(document.querySelectorAll(".walk-step-head")).map((node) => node.textContent);

    it("starts with the story, and says nothing yet about what x is", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("button", { name: /See a worked example/ }));
      expect(screen.getByRole("heading", { name: "From story to equation" })).toBeTruthy();
      expect(heads()).toEqual(["1Read the story"]);
      expect(screen.getByText(/A taxi charges €3 to start and €2 for every kilometre/)).toBeTruthy();
      expect(screen.queryByText(/Let x be the number of kilometres/)).toBeNull();
      expect(screen.queryByText(/2x \+ 3 = 15/)).toBeNull();
    });

    it("goes on one step at a time, and keeps the steps already taken in view", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("button", { name: /See a worked example/ }));

      await next(user);
      // The first step is done (a tick, then its name); the second is the current one, with its number.
      expect(heads()).toEqual(["Read the story", "2Say what x is"]);
      expect(screen.getByText("Let x be the number of kilometres.")).toBeTruthy();
      // The step that has been taken stays, the story is still there.
      expect(screen.getByText(/A taxi charges €3 to start/)).toBeTruthy();
      expect(document.querySelectorAll(".walk-step-done")).toHaveLength(1);
      expect(document.querySelector(".walk-step-current")?.getAttribute("aria-current")).toBe("step");

      await next(user);
      // What is equal to what: the story's own explanation, without the equation.
      expect(screen.getByText(/The start fee €3 is added once, and €2 is paid for each of the x kilometres\./)).toBeTruthy();
      expect(screen.queryByText(/2x \+ 3 = 15/)).toBeNull();

      await next(user);
      // Now the equation, big, with the explanation that goes with it.
      expect(document.querySelector(".walk-equation .mathline")?.textContent).toContain("2x");
      // (The sentence that explained it is not said again: it was said in the step before.)
      expect(document.querySelector(".walk-equation .walk-text")).toBeNull();
    });

    it("moves the focus to each new step, so a keyboard or a screen reader arrives with it", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("button", { name: /See a worked example/ }));
      await next(user);
      expect(document.activeElement?.textContent).toContain("Say what x is");
      await next(user);
      expect(document.activeElement?.textContent).toContain("Find what is equal");
    });

    it("solves the equation with the tutor, then answers in a sentence with the number marked", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("button", { name: /See a worked example/ }));
      for (let n = 0; n < 4; n += 1) await next(user);
      expect(heads().at(-1)).toContain("Solve it");

      await user.click(screen.getByRole("button", { name: "Show the first step" }));
      await user.click(screen.getByRole("button", { name: "Work out both sides" }));
      await user.click(screen.getByRole("button", { name: "Show the next step" }));
      await user.click(screen.getByRole("button", { name: "Work out both sides" }));
      // The example's own way out is not offered in the middle of the walk; the one at the bottom is the walk's.
      expect(screen.queryAllByRole("button", { name: /Skip to practice/ })).toHaveLength(1);
      await next(user);

      expect(heads().at(-1)).toContain("Answer in a sentence");
      expect(document.querySelector(".walk-answer mark")?.textContent).toBe("6");
      expect(document.querySelector(".walk-answer .answer-sentence")?.textContent).toBe("The ride was 6 km long.");
      expect(screen.getByText("Put the answer back into the story. Does it fit?")).toBeTruthy();
      expect(screen.queryByRole("button", { name: /Skip to practice/ })).toBeNull();
    });

    it("ends by offering to try it, which starts the practice", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("button", { name: /See a worked example/ }));
      for (let n = 0; n < 4; n += 1) await next(user);
      await user.click(screen.getByRole("button", { name: "Show the first step" }));
      await user.click(screen.getByRole("button", { name: "Work out both sides" }));
      await user.click(screen.getByRole("button", { name: "Show the next step" }));
      await user.click(screen.getByRole("button", { name: "Work out both sides" }));
      await next(user);
      await user.click(screen.getByRole("button", { name: "Try it yourself" }));
      expect(await screen.findByText("Problem 1 of 5")).toBeTruthy();
    });

    it("can be left at any step, to practise", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("button", { name: /See a worked example/ }));
      await next(user);
      await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
      expect(await screen.findByText("Problem 1 of 5")).toBeTruthy();
    });
  });

  describe("learning to write the equation from the story", () => {
    const first = pickStoryRound(createRng(7), 5)[0];
    const words = first.i18n.en;

    async function start() {
      vi.spyOn(Math, "random").mockImplementation(createRng(7));
      const { user } = setup();
      await user.click(screen.getByRole("button", { name: /Skip to practice/ }));
      await screen.findByText("Problem 1 of 5");
      return user;
    }

    it("helps with the story's own words: first what x is, then how the equation is built, and only then the equation", async () => {
      const user = await start();
      const hints = () => Array.from(document.querySelectorAll(".hint p")).map((node) => node.textContent ?? "");

      await user.click(screen.getByRole("button", { name: /^Hint/ }));
      expect(hints()[0]).toContain(words.letX);
      expect(hints()[0]).toContain("Start with x.");

      await user.click(screen.getByRole("button", { name: /^More help/ }));
      const explain = explainBuild(words.build, first.equations[0]);
      // The second hint says how the story builds its equation, and still not the equation.
      if (explain !== null) expect(hints()[1]).toBe(explain);
      expect(hints()[1]).not.toContain("=");
      expect(hints().join(" ")).not.toContain(first.equations[0]);

      await user.click(screen.getByRole("button", { name: /^More help/ }));
      expect(hints()[2]).toContain("Here is the equation the story gives:");
    });

    it("explains why the equation is the equation, in the story's words, when it is right", async () => {
      const user = await start();
      writeEquation(first.equations[0]);
      await user.click(screen.getByRole("button", { name: "Check my equation" }));
      const notice = document.querySelector(".notice")!;
      expect(notice.textContent).toContain("That is the equation!");
      expect(notice.textContent).toContain(`Why this equation: ${words.build}`);
    });

    it("asks for the answer as a sentence with a gap, and sends a wrong number back to the story", async () => {
      const user = await start();
      writeEquation(first.equations[0]);
      await user.click(screen.getByRole("button", { name: "Check my equation" }));
      await user.click(screen.getByRole("button", { name: /Solve it/ }));
      await solveOnScreenEquation(user);
      await user.click(screen.getByRole("button", { name: /Now answer the question/ }));
      // This round's first story asks for x itself, so the answer is the sentence (the others ask for something worked out from x).
      expect(first.final).toBeUndefined();

      expect(screen.getByRole("heading", { name: "Answer in a sentence" })).toBeTruthy();
      // The sentence is the story's own, with the number left out for the learner to put in.
      const frame = document.querySelector(".answer-frame")!;
      expect(frame.textContent?.replace(String(first.solution), "")).toBe(words.answer.replace(String(first.solution), ""));
      expect(frame.querySelector("input")).toBeTruthy();
      expect(document.body.textContent).not.toContain(words.answer);

      const field = screen.getByLabelText(words.question);
      await user.type(field, String(first.solution + 1));
      await user.click(screen.getByRole("button", { name: "Check my answer" }));
      expect(document.querySelector(".final-feedback")?.textContent).toContain("Put your number into the story");
      expect(screen.queryByRole("button", { name: /Next problem/ })).toBeNull();

      await user.clear(field);
      await user.type(field, String(first.solution));
      await user.click(screen.getByRole("button", { name: "Check my answer" }));
      // Now the finished sentence is shown, and the learner can go on.
      expect(screen.getByText(words.answer)).toBeTruthy();
      expect(screen.getByRole("button", { name: /Next problem/ })).toBeTruthy();
    });

    it("does not accept a sentence without a number", async () => {
      const user = await start();
      writeEquation(first.equations[0]);
      await user.click(screen.getByRole("button", { name: "Check my equation" }));
      await user.click(screen.getByRole("button", { name: /Solve it/ }));
      await solveOnScreenEquation(user);
      await user.click(screen.getByRole("button", { name: /Now answer the question/ }));
      // This round's first story asks for x itself, so the answer is the sentence (the others ask for something worked out from x).
      expect(first.final).toBeUndefined();
      await user.type(screen.getByLabelText(words.question), "abc");
      await user.click(screen.getByRole("button", { name: "Check my answer" }));
      expect(document.querySelector(".final-feedback")?.textContent).toContain("Type a number to finish the sentence");
    });
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
      } else {
        // The answer is said in a sentence, with the number put in by the learner.
        await user.type(screen.getByLabelText(story.i18n.en.question), String(story.solution));
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
