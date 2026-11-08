import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mustParseEquation } from "@/lib/equations";
import { SolverWorkspace } from "../SolverWorkspace";
import { spokenEquation } from "./helpers";

function setup(equation: string) {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  render(<SolverWorkspace equation={mustParseEquation(equation)} continueLabel="Next equation" onContinue={onContinue} />);
  return { user, onContinue };
}

const feedback = () => document.querySelector(".feedback-region") as HTMLElement;
const historyItems = () => Array.from(document.querySelectorAll(".history-item")) as HTMLElement[];

async function openFlipMode(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("radio", { name: /Flip a term/ }));
}

describe("flipping a term across the equals sign", () => {
  it("offers two ways to move and starts with the balance operations", () => {
    setup("3x - 5 = 6");
    expect(screen.getByRole("radio", { name: /Both sides/ })).toHaveProperty("checked", true);
    expect(screen.getByRole("radio", { name: /Flip a term/ })).toHaveProperty("checked", false);
    expect(screen.getByRole("button", { name: "Apply to both sides" })).toBeTruthy();
    expect(document.querySelector(".eq-flip")).toBeNull();
  });

  it("turns the terms into buttons in flip mode and hides the operation picker", async () => {
    const { user } = setup("3x - 5 = 6");
    await openFlipMode(user);

    expect(screen.queryByRole("button", { name: "Apply to both sides" })).toBeNull();
    const buttons = Array.from(document.querySelectorAll<HTMLElement>(".eq-flip"));
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Flip 3x. It becomes − 3x on the other side.",
      "Flip − 5. It becomes + 5 on the other side.",
      "Flip 6. It becomes − 6 on the other side.",
    ]);
    // Every term is a comfortable touch target (the stylesheet sets min 44px; the elements are real buttons).
    buttons.forEach((button) => expect(button.tagName).toBe("BUTTON"));
  });

  it("flips − 5 to the other side: 3x − 5 = 6 becomes 3x = 6 + 5, then 3x = 11", async () => {
    const { user } = setup("3x - 5 = 6");
    await openFlipMode(user);
    await user.click(screen.getByRole("button", { name: /^Flip − 5/ }));

    expect(spokenEquation()).toBe("Current equation: 3x equals 6 plus 5");
    // The part that crossed over is highlighted where it landed.
    expect(document.querySelector(".eq-applied")?.textContent).toBe("+5");
    expect(feedback().textContent).toContain("After flipping: 3x = 6 + 5");
    expect(feedback().textContent).toContain("crosses the equals sign and its sign flips");
    expect(document.querySelector(".eq-caption")?.textContent).toContain("flipped across the equals sign");
    // While the flip is waiting to be worked out, nothing else can be started.
    expect(screen.queryByRole("radio")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Simplify both sides" }));

    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    expect(spokenEquation()).toBe("Current equation: 3x equals 11");
  });

  it("writes a flip in the notebook, with the operation beside the equation", async () => {
    const { user } = setup("3x - 5 = 6");
    await openFlipMode(user);
    await user.click(screen.getByRole("button", { name: /^Flip − 5/ }));
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));

    const step = historyItems()[1];
    expect(step.querySelector(".history-label")?.textContent).toBe("Step 1 · Flip − 5 across the = sign");
    expect(step.querySelector(".history-notebook")?.textContent).toContain("3x − 5 = 6");
    expect(step.querySelector(".history-bar")?.textContent).toBe("|| + 5");
    expect(step.querySelector(".history-applied")?.textContent).toBe("3x = 6 + 5");
    expect(step.querySelector(".history-equation")?.textContent).toBe("3x = 11");
  });

  it("writes a balance step in the notebook the same way", async () => {
    const { user } = setup("2x + 5 = 17");
    await user.click(screen.getByRole("radio", { name: "Subtract" }));
    await user.type(screen.getByLabelText("By how much?"), "5");
    await user.click(screen.getByRole("button", { name: "Apply to both sides" }));

    // The operation is also written beside the equation while it is applied.
    expect(document.querySelector(".eq-bar")?.textContent).toBe("|| − 5");
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    expect(historyItems()[1].querySelector(".history-bar")?.textContent).toBe("|| − 5");
    expect(historyItems()[1].querySelector(".history-label")?.textContent).toBe("Step 1 · Subtract 5 from both sides");
  });

  it("solves a whole equation by flipping: 3x − 5 = 7 → 3x = 12 → x = 4", async () => {
    const { user, onContinue } = setup("3x - 5 = 7");
    await openFlipMode(user);
    await user.click(screen.getByRole("button", { name: /^Flip − 5/ }));
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));

    // The mode stays on flip, and focus lands on the first flippable term.
    expect(document.activeElement?.className).toContain("eq-flip");
    await user.click(screen.getByRole("button", { name: /^Flip 3x\. It moves to the other side as ÷ 3/ }));
    expect(spokenEquation()).toBe("Current equation: x equals 12 divided by 3");
    expect(feedback().textContent).toContain("both sides are divided by 3");
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));

    expect(spokenEquation()).toBe("Current equation: x equals 4");
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    expect(screen.getByText(/Both sides are equal, so x = 4 is correct!/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 2, mistakes: 0, hints: 0 });
  });

  it("flips an x term to collect the x terms: 5x + 2 = 3x + 12 becomes 5x − 3x + 2 = 12", async () => {
    const { user } = setup("5x + 2 = 3x + 12");
    await openFlipMode(user);
    await user.click(screen.getByRole("button", { name: /^Flip 3x/ }));
    expect(spokenEquation()).toBe("Current equation: 5x minus 3x plus 2 equals 12");
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    expect(spokenEquation()).toBe("Current equation: 2x plus 2 equals 12");
  });

  it("explains a flip that does not help, in flip words, and changes nothing", async () => {
    const { user, onContinue } = setup("3x - 5 = 6");
    await openFlipMode(user);
    await user.click(screen.getByRole("button", { name: /^Flip 3x/ }));

    expect(spokenEquation()).toBe("Current equation: 3x minus 5 equals 6");
    expect(within(feedback()).getByText("Flipping that does not help yet")).toBeTruthy();
    expect(feedback().textContent).not.toMatch(/to both sides/);
    expect(screen.queryByRole("button", { name: "Simplify both sides" })).toBeNull();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("works from the keyboard", async () => {
    const { user } = setup("3x - 5 = 6");
    await openFlipMode(user);
    screen.getByRole("button", { name: /^Flip − 5/ }).focus();
    await user.keyboard("{Enter}");
    expect(spokenEquation()).toBe("Current equation: 3x equals 6 plus 5");
  });

  it("shows hints in both modes and points to the flip shortcut in the last one", async () => {
    const { user } = setup("3x - 5 = 6");
    await openFlipMode(user);
    for (let i = 0; i < 3; i += 1) await user.click(screen.getByRole("button", { name: /^(Hint|More help)/ }));
    const worked = screen.getByText(/^Try this: add 5 to both sides/).textContent ?? "";
    expect(worked).toContain("Shortcut: in “Flip a term” mode, tap − 5. It crosses the equals sign as + 5.");
  });

  it("cannot be used once x is on its own", async () => {
    const { user } = setup("x - 2 = 3");
    await openFlipMode(user);
    await user.click(screen.getByRole("button", { name: /^Flip − 2/ }));
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    expect(spokenEquation()).toBe("Current equation: x equals 5");
    expect(document.querySelector(".eq-flip")).toBeNull();
  });
});
