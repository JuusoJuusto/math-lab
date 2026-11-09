import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/hooks/useLang";
import { mustParseEquation } from "@/lib/equations";
import { SolverWorkspace } from "../SolverWorkspace";
import { applyOperation, spokenEquation } from "./helpers";

function setup(text: string, lang: "en" | "fi" = "en") {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  render(
    <LangProvider lang={lang}>
      <SolverWorkspace equation={mustParseEquation(text)} continueLabel="Next equation" onContinue={onContinue} />
    </LangProvider>,
  );
  return { onContinue, user };
}

const open = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "I will count it myself" }));
const field = () => screen.getByLabelText("The new equation") as HTMLInputElement;
const write = (text: string) => fireEvent.change(field(), { target: { value: text } });
const check = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Check my counting" }));
const countNotice = () => document.querySelector(".count .notice")?.textContent ?? "";
const historyItems = () => {
  const region = screen.queryByRole("region", { name: "Your solution so far" });
  return region ? within(region).queryAllByRole("listitem") : [];
};

describe("counting both sides yourself, with the buttons", () => {
  it("is offered next to the button that counts for you, and is not there before a move", async () => {
    const { user } = setup("2x + 5 = 17");
    expect(screen.queryByRole("button", { name: "I will count it myself" })).toBeNull();
    await applyOperation(user, "Subtract", 5);
    expect(screen.getByRole("button", { name: "Work out both sides" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "I will count it myself" })).toBeTruthy();
    expect(screen.queryByLabelText("The new equation")).toBeNull();
  });

  describe("the switch, so the choice is made before the answer is on the screen", () => {
    const toggle = () => screen.getByRole("checkbox", { name: "I will count the results myself" }) as HTMLInputElement;
    const work = () => document.querySelector(".notice-work")?.textContent ?? "";

    it("is there before any move, and off", () => {
      setup("2x + 5 = 17");
      expect(toggle().checked).toBe(false);
    });

    it("leaves the explanation as it was when it is off: how each side goes is shown", async () => {
      const { user } = setup("2x + 5 = 17");
      await applyOperation(user, "Subtract", 5);
      expect(work()).toContain("2x + 5 − 5 = 2x");
      expect(work()).toContain("17 − 5 = 12");
    });

    it("keeps how each side goes off the screen when it is on, and opens the field at once", async () => {
      const { user } = setup("2x + 5 = 17");
      await user.click(toggle());
      await applyOperation(user, "Subtract", 5);

      // Nothing on the screen says 2x or 12 for the learner to copy.
      expect(document.querySelector(".notice-work")).toBeNull();
      expect(document.querySelector(".simplify-explain")).toBeNull();
      expect(document.querySelector(".action-card")?.textContent).not.toMatch(/becomes|= 12|= 2x/);
      // The field is already open: no second click needed.
      expect(screen.getByLabelText("The new equation")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "I will count it myself" })).toBeNull();

      write("2x = 12");
      await check(user);
      expect(historyItems()).toHaveLength(1);
    });

    it("stays on for the next step of the equation, and can be turned off again", async () => {
      const { user } = setup("2x + 5 = 17");
      await user.click(toggle());
      await applyOperation(user, "Subtract", 5);
      write("2x = 12");
      await check(user);
      expect(toggle().checked).toBe(true);
      await applyOperation(user, "Divide", 2);
      expect(screen.getByLabelText("The new equation")).toBeTruthy();

      await user.click(screen.getByRole("button", { name: "Choose again" }));
      await user.click(toggle());
      await applyOperation(user, "Divide", 2);
      expect(screen.queryByLabelText("The new equation")).toBeNull();
      expect(work()).toContain("2x ÷ 2 = x");
      expect(work()).toContain("12 ÷ 2 = 6");
    });

    it("is offered when flipping terms too, and in Finnish", async () => {
      const { user } = setup("2x + 5 = 17", "fi");
      expect(screen.getByRole("checkbox", { name: "Lasken tulokset itse" })).toBeTruthy();
      await user.click(screen.getByRole("radio", { name: /Siirrä termi/ }));
      expect(screen.getByRole("checkbox", { name: "Lasken tulokset itse" })).toBeTruthy();
    });
  });

  it("takes the equation that is left when both sides are counted, and moves on", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);
    await open(user);
    write("2x = 12");
    await check(user);
    expect(spokenEquation()).toBe("Current equation: 2x equals 12");
    expect(historyItems()).toHaveLength(1);
    expect(screen.queryByLabelText("The new equation")).toBeNull();
  });

  it("takes the two sides the other way round", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);
    await open(user);
    write("12 = 2x");
    await check(user);
    expect(historyItems()).toHaveLength(1);
  });

  it("does not take an equation that is right but not counted: 2x = 17 − 5 still has a subtraction to do", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);
    await open(user);
    write("2x = 17 − 5");
    await check(user);
    expect(countNotice()).toContain("Right, but not counted yet");
    expect(historyItems()).toHaveLength(0);
    expect(screen.getByLabelText("The new equation")).toBeTruthy();
  });

  it("does not show what each side becomes while the learner is counting it, because that is the answer", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);
    // Before: the choice is explained, as it always was.
    expect(document.querySelector(".simplify-explain")?.textContent).toContain("17 − 5 becomes 12");
    await open(user);
    expect(document.querySelector(".simplify-explain")).toBeNull();
    expect(document.querySelector(".action-card")?.textContent).not.toContain("becomes 12");
    expect(screen.getByText("Count each side, then write the equation that is left.")).toBeTruthy();
  });

  it("says when it is not what you get, and shows how each side goes after the second wrong try", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);
    await open(user);
    write("2x = 10");
    await check(user);
    expect(countNotice()).toContain("That is not what you get");
    expect(countNotice()).not.toContain("becomes");
    write("2x = 11");
    await check(user);
    expect(countNotice()).toContain("Left side: 2x + 5 − 5 becomes 2x");
    expect(countNotice()).toContain("Right side: 17 − 5 becomes 12");
    expect(historyItems()).toHaveLength(0);
  });

  it("tells a line that cannot be read what is wrong with it, without counting a mistake", async () => {
    const { user, onContinue } = setup("x + 5 = 12");
    await applyOperation(user, "Subtract", 5);
    await open(user);
    write("x ==");
    await check(user);
    expect(document.querySelector(".count .notice-warning")).toBeTruthy();
    write("x = 7");
    await check(user);
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 1, mistakes: 0, hints: 0 });
  });

  it("counts a wrong try as a mistake in the end", async () => {
    const { user, onContinue } = setup("x + 5 = 12");
    await applyOperation(user, "Subtract", 5);
    await open(user);
    write("x = 8");
    await check(user);
    write("x = 7");
    await check(user);
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 1, mistakes: 1, hints: 0 });
  });

  it("leaves the button that counts for you where it was, and it still works with the field open", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);
    await open(user);
    await user.click(screen.getByRole("button", { name: "Work out both sides" }));
    expect(spokenEquation()).toBe("Current equation: 2x equals 12");
  });

  it("stays open for the next step of the same equation", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);
    await open(user);
    write("2x = 12");
    await check(user);
    await applyOperation(user, "Divide", 2);
    // No need to ask again.
    expect(screen.queryByRole("button", { name: "I will count it myself" })).toBeNull();
    write("x = 6");
    await check(user);
    expect(screen.getByRole("button", { name: "Check by substituting" })).toBeTruthy();
    expect(historyItems()).toHaveLength(2);
  });

  it("has the number pad, with the fraction key, for counting", async () => {
    const { user } = setup("x/2 + 1 = 4");
    await applyOperation(user, "Subtract", 1);
    await open(user);
    await user.click(screen.getByRole("button", { name: /^Fraction: / }));
    await user.click(screen.getByRole("button", { name: "x" }));
    await user.click(screen.getByRole("button", { name: /^Bottom of the fraction/ }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Put in the line" }));
    await user.click(screen.getByRole("button", { name: "equals" }));
    await user.click(screen.getByRole("button", { name: "3" }));
    expect(field().value).toBe("x/2 = 3");
    await check(user);
    expect(historyItems()).toHaveLength(1);
  });

  it("speaks Finnish", async () => {
    const { user } = setup("2x + 5 = 17", "fi");
    await user.click(screen.getByRole("radio", { name: /Vähennä/ }));
    fireEvent.change(screen.getByLabelText(/Kuinka paljon/), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: /Tee molemmille puolille/ }));
    await user.click(screen.getByRole("button", { name: "Lasken itse" }));
    fireEvent.change(screen.getByLabelText("Uusi yhtälö"), { target: { value: "2x = 17 − 5" } });
    await user.click(screen.getByRole("button", { name: "Tarkista laskuni" }));
    expect(document.querySelector(".count .notice")?.textContent).toContain("ei vielä laskettu");
  });
});
