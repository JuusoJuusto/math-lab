import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mustParseEquation } from "@/lib/equations";
import { SolverWorkspace } from "../SolverWorkspace";
import { applyOperation, spokenEquation } from "./helpers";

function setup(text: string) {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  render(<SolverWorkspace equation={mustParseEquation(text)} continueLabel="Next equation" onContinue={onContinue} />);
  return { onContinue, user };
}

const feedback = () => screen.getByRole("status");
const historyItems = () => within(screen.getByRole("region", { name: "Your steps" })).getAllByRole("listitem");

describe("SolverWorkspace: a learner solving 2x + 5 = 17", () => {
  it("shows the equation and an invitation to act before anything has happened", () => {
    setup("2x + 5 = 17");
    expect(spokenEquation()).toBe("Current equation: 2x plus 5 equals 17");
    expect(feedback().textContent).toMatch(/Your move/);
    expect(historyItems()).toHaveLength(1);
  });

  it("explains a mistake, keeps the equation, and does not give the solution away", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Add", 5);

    expect(feedback().textContent).toContain("Almost — try the opposite operation");
    expect(feedback().textContent).toContain("2x + 5 + 5 = 17 + 5");
    expect(feedback().textContent).toContain("2x + 10 = 22");
    expect(feedback().textContent).not.toMatch(/2x = 12|x = 6/);
    expect(spokenEquation()).toBe("Current equation: 2x plus 5 equals 17");
    expect(historyItems()).toHaveLength(1);
  });

  it("explains why division by zero is not allowed", async () => {
    const { user } = setup("2x = 12");
    await applyOperation(user, "Divide", 0);
    expect(feedback().textContent).toContain("You can't divide by zero");
    expect(spokenEquation()).toBe("Current equation: 2x equals 12");
  });

  it("reveals hints one at a time, getting more specific, then stops", async () => {
    const { user } = setup("2x + 5 = 17");
    expect(screen.queryByText(/Hint 1 of 3/)).toBeNull();

    await user.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByText(/Hint 1 of 3/)).toBeTruthy();
    expect(screen.queryByText(/Hint 2 of 3/)).toBeNull();

    await user.click(screen.getByRole("button", { name: "More help (1/3)" }));
    expect(screen.getByText(/Addition is undone by subtraction/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "More help (2/3)" }));
    expect(screen.getByText(/Choose “Subtract” and type 5/)).toBeTruthy();

    const done = screen.getByRole("button", { name: "All hints shown" }) as HTMLButtonElement;
    expect(done.disabled).toBe(true);
  });

  it("shows the operation on both sides, explains it, and moves focus to the next action", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);

    expect(spokenEquation()).toBe("Current equation: 2x plus 5 minus 5 equals 17 minus 5");
    expect(feedback().textContent).toContain("Left side: 2x + 5 − 5 = 2x");
    expect(feedback().textContent).toContain("Right side: 17 − 5 = 12");
    expect(feedback().textContent).toContain("inverse");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Simplify both sides" }));
    expect(screen.queryByRole("radio")).toBeNull(); // cannot pile a second move on top
  });

  it("simplifies into the next equation, records the step and says what comes next", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));

    expect(spokenEquation()).toBe("Current equation: 2x equals 12");
    expect(feedback().textContent).toContain("x is still multiplied by 2");
    expect(historyItems()).toHaveLength(2);
    expect(historyItems()[1].textContent).toContain("2x + 5 − 5 = 17 − 5");
    expect(historyItems()[1].textContent).toContain("2x = 12");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Add" }));
  });

  it("goes from mistake to verified solution and reports the effort", async () => {
    const { onContinue, user } = setup("2x + 5 = 17");

    await applyOperation(user, "Add", 5); // a mistake
    await user.click(screen.getByRole("button", { name: "Hint" }));
    await applyOperation(user, "Subtract", 5);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    await applyOperation(user, "Divide", 2);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));

    expect(spokenEquation()).toBe("Current equation: x equals 6");
    expect(screen.getByText("Solved")).toBeTruthy();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Check by substituting" }));

    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    const check = screen.getByRole("region", { name: "Substitution check" });
    expect(within(check).getByText("Both sides are equal, so x = 6 is correct!")).toBeTruthy();
    expect(Array.from(check.querySelectorAll("code")).map((line) => line.textContent)).toEqual([
      "2x + 5 = 17",
      "2(6) + 5 = 17",
      "12 + 5 = 17",
      "17 = 17",
    ]);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Next equation/ }));

    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 2, mistakes: 1, hints: 1 });
  });

  it("lets a learner skip the check", async () => {
    const { onContinue, user } = setup("x + 5 = 12");
    await applyOperation(user, "Subtract", 5);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    await user.click(screen.getByRole("button", { name: /Skip the check/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 1, mistakes: 0, hints: 0 });
  });

  it("can undo a step and start over without losing the record of effort", async () => {
    const { onContinue, user } = setup("2x + 5 = 17");
    await user.click(screen.getByRole("button", { name: "Hint" }));
    await applyOperation(user, "Subtract", 5);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    expect(spokenEquation()).toContain("2x equals 12");

    await user.click(screen.getByRole("button", { name: /Undo/ }));
    expect(spokenEquation()).toBe("Current equation: 2x plus 5 equals 17");

    await applyOperation(user, "Subtract", 5);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    await user.click(screen.getByRole("button", { name: /Start over/ }));
    expect(spokenEquation()).toBe("Current equation: 2x plus 5 equals 17");
    expect(historyItems()).toHaveLength(1);

    // Finish quickly and confirm the hint is still remembered.
    await applyOperation(user, "Subtract", 5);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    await applyOperation(user, "Divide", 2);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    await user.click(screen.getByRole("button", { name: /Skip the check/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 2, mistakes: 0, hints: 1 });
  });

  it("can cancel an applied step before simplifying", async () => {
    const { user } = setup("2x + 5 = 17");
    await applyOperation(user, "Subtract", 5);
    await user.click(screen.getByRole("button", { name: "Choose again" }));
    expect(spokenEquation()).toBe("Current equation: 2x plus 5 equals 17");
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });
});

describe("SolverWorkspace: other kinds of equation", () => {
  it("collects x terms with an x amount, then finishes with negative numbers handled", async () => {
    const { user } = setup("-2x + 3 = 11");
    await applyOperation(user, "Subtract", 3);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    expect(spokenEquation()).toBe("Current equation: minus 2x equals 8");

    await applyOperation(user, "Divide", -2);
    expect(feedback().textContent).toContain("flips the sign");
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    expect(spokenEquation()).toBe("Current equation: x equals minus 4");
    expect(screen.getByText("Solved")).toBeTruthy();
  });

  it("accepts an x term as the amount when x is on both sides", async () => {
    const { user } = setup("5x + 2 = 3x + 12");
    await applyOperation(user, "Subtract", 3, true);
    expect(feedback().textContent).toContain("Left side: 5x + 2 − 3x = 2x + 2");
    expect(feedback().textContent).toContain("Right side: 3x + 12 − 3x = 12");
  });

  it("accepts the answer written with x on the right", async () => {
    const { user } = setup("2x + 3 = 5x - 9");
    await applyOperation(user, "Subtract", 2, true);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    await applyOperation(user, "Add", 9);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    await applyOperation(user, "Divide", 3);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));

    expect(spokenEquation()).toBe("Current equation: 4 equals x");
    expect(feedback().textContent).toContain("4 = x means the same as x = 4");
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    expect(screen.getByText("Both sides are equal, so x = 4 is correct!")).toBeTruthy();
  });

  it("reports an equation with no solution instead of pretending there is an answer", async () => {
    const { onContinue, user } = setup("2x + 3 = 2x + 5");
    await applyOperation(user, "Subtract", 2, true);
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));

    expect(feedback().textContent).toContain("This equation has no solution");
    expect(screen.queryByRole("button", { name: "Check by substituting" })).toBeNull();
    expect(screen.queryByText("Solved")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalled();
  });
});
