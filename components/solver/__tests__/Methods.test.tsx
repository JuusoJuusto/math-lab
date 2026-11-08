import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/hooks/useLang";
import { mustParseEquation } from "@/lib/equations";
import { SolverWorkspace } from "../SolverWorkspace";
import { spokenEquation } from "./helpers";

function setup(equation: string, lang: "en" | "fi" = "en") {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  render(
    <LangProvider lang={lang}>
      <SolverWorkspace equation={mustParseEquation(equation)} continueLabel="Next equation" onContinue={onContinue} />
    </LangProvider>,
  );
  return { user, onContinue };
}

const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("three ways to solve", () => {
  it("offers work backwards only when x appears once", () => {
    setup("2x + 5 = 17");
    expect(screen.getByRole("radio", { name: /Work backwards/ })).toBeTruthy();
    document.body.innerHTML = "";
    setup("5x + 2 = 3x + 12");
    expect(screen.queryByRole("radio", { name: /Work backwards/ })).toBeNull();
    expect(screen.getByRole("radio", { name: /Flip a term/ })).toBeTruthy();
  });

  it("shows what is done to x as a chain, and how to undo it from the end", async () => {
    const { user } = setup("2x + 5 = 17");
    await user.click(screen.getByRole("radio", { name: /Work backwards/ }));

    const rows = Array.from(document.querySelectorAll(".chain-flow"));
    expect(rows[0].textContent).toBe("x× 2+ 517");
    expect(rows[1].textContent).toContain("17");
    expect(rows[1].textContent).toContain("− 5");
    expect(rows[1].textContent).toContain("÷ 2");
    expect(screen.queryByRole("button", { name: "Apply to both sides" })).toBeNull();
  });

  it("solves 2x + 5 = 17 by working backwards: 17 − 5 = 12, 12 ÷ 2 = 6", async () => {
    const { user, onContinue } = setup("2x + 5 = 17");
    await user.click(screen.getByRole("radio", { name: /Work backwards/ }));
    fill(/Undo step 1/, "12");
    fill(/The value of x/, "6");
    await user.click(screen.getByRole("button", { name: "Check" }));

    expect(spokenEquation()).toBe("Current equation: x equals 6");
    expect(screen.getByText("Solved")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    expect(screen.getByText(/Both sides are equal, so x = 6 is correct!/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 0, mistakes: 0, hints: 0 });
  });

  it("says which step is wrong, counts it as a mistake, and lets the learner try again", async () => {
    const { user, onContinue } = setup("2x + 5 = 17");
    await user.click(screen.getByRole("radio", { name: /Work backwards/ }));
    fill(/Undo step 1/, "22");
    fill(/The value of x/, "11");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByRole("alert").textContent).toBe("Step 1 is not right yet. Work out 17 − 5 and try again.");
    expect(document.querySelector(".chain-input.wrong")).toBeTruthy();

    fill(/Undo step 1/, "12");
    fill(/The value of x/, "6");
    await user.click(screen.getByRole("button", { name: "Check" }));
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 0, mistakes: 1, hints: 0 });
  });

  it("asks for every box before checking, and accepts negative answers", async () => {
    const { user } = setup("-2x + 3 = 11");
    await user.click(screen.getByRole("radio", { name: /Work backwards/ }));
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByRole("alert").textContent).toBe("Fill in every box first.");
    fill(/Undo step 1/, "8");
    fill(/The value of x/, "−4");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(spokenEquation()).toBe("Current equation: x equals minus 4");
  });

  it("switches back to the usual way when a step has changed the equation so it no longer fits", async () => {
    const { user } = setup("5x + 2 = 3x + 12");
    await user.click(screen.getByRole("radio", { name: /Both sides/ }));
    expect(screen.getByRole("button", { name: "Apply to both sides" })).toBeTruthy();
  });

  it("is in Finnish when the page is", async () => {
    const { user } = setup("2x + 5 = 17", "fi");
    await user.click(screen.getByRole("radio", { name: /Käänteisoperaatiot/ }));
    expect(screen.getByText("Mitä x:lle tehdään")).toBeTruthy();
    expect(document.querySelectorAll(".chain-flow")[0].textContent).toBe("x· 2+ 517");
    expect(document.querySelectorAll(".chain-flow")[1].textContent).toContain(": 2");
  });
});

describe("the graph", () => {
  async function solved(equation: string, steps: (user: ReturnType<typeof userEvent.setup>) => Promise<void>) {
    const { user } = setup(equation);
    await steps(user);
    return user;
  }

  it("shows the two sides as lines crossing at the solution once the equation is solved", async () => {
    const user = await solved("2x + 5 = 17", async (u) => {
      await u.click(screen.getByRole("radio", { name: /Work backwards/ }));
      fill(/Undo step 1/, "12");
      fill(/The value of x/, "6");
      await u.click(screen.getByRole("button", { name: "Check" }));
    });
    expect(document.querySelector(".graph-svg")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Show it on a graph" }));
    expect(screen.getByRole("img", { name: /two lines that cross at one point/ })).toBeTruthy();
    expect(screen.getByText("The lines cross at x = 6. That is the solution.")).toBeTruthy();
    expect(screen.getByText("Left side: y = 2x + 5")).toBeTruthy();
    expect(screen.getByText("Right side: y = 17")).toBeTruthy();
    expect(document.querySelector(".graph-meet-label")?.textContent).toBe("x = 6");

    await user.click(screen.getByRole("button", { name: "Hide the graph" }));
    expect(document.querySelector(".graph-svg")).toBeNull();
  });

  it("explains no solution with two parallel lines", async () => {
    const { user } = setup("2x + 3 = 2x + 7");
    await user.click(screen.getByRole("radio", { name: "Subtract" }));
    fireEvent.change(screen.getByLabelText("By how much?"), { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: /Amount is an x term/ }));
    await user.click(screen.getByRole("button", { name: "Apply to both sides" }));
    await user.click(screen.getByRole("button", { name: "Simplify both sides" }));
    expect(screen.getByText("This equation has no solution")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Show it on a graph" }));
    expect(screen.getByText("The lines are parallel. They never cross, so there is no solution.")).toBeTruthy();
    expect(screen.getByRole("img", { name: /two parallel lines/ })).toBeTruthy();
  });
});
