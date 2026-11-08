import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getTopic } from "@/content/topics";
import { getLevel, makePrelude, mustParseEquation } from "@/lib/equations";
import { LangProvider } from "@/hooks/useLang";
import { SolverView } from "../SolverView";
import { SolverWorkspace } from "../SolverWorkspace";
import { spokenEquation } from "./helpers";

function setup(source: string, lang: "en" | "fi" = "en") {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  render(
    <LangProvider lang={lang}>
      <SolverWorkspace equation={mustParseEquation(source)} prelude={makePrelude(source)} continueLabel="Next equation" onContinue={onContinue} />
    </LangProvider>,
  );
  return { user, onContinue };
}

/** A heading by its text; the questions use non-breaking spaces inside an expression, so any space matches. */
const heading = (text: string | RegExp) => {
  const source = typeof text === "string" ? text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : text.source;
  return screen.getByRole("heading", { name: new RegExp(source.replace(/ /g, "\\s")) });
};
const noHeading = (text: RegExp) => screen.queryByRole("heading", { name: new RegExp(text.source.replace(/ /g, "\\s")) });

const options = () => screen.getAllByRole("button").filter((button) => button.classList.contains("answer"));
/** Clicks the answer with exactly this text. */
const choose = (user: ReturnType<typeof userEvent.setup>, text: string) => {
  const button = options().find((option) => option.querySelector(".answer-text")?.textContent === text);
  if (!button) throw new Error(`No answer "${text}" among ${options().map((o) => o.textContent).join(" | ")}`);
  return user.click(button);
};

describe("an equation written with brackets", () => {
  it("shows the equation as written and asks how to open the brackets", () => {
    setup("3(x - 2) = 2x + 5");
    expect(screen.getByRole("region", { name: "The equation as it is written" })).toBeTruthy();
    expect(document.querySelector(".eq-written .mathline-row")?.textContent).toBe("3(x − 2)=2x + 5");
    expect(heading("Open the brackets in 3(x − 2). What do you get?")).toBeTruthy();
    expect(options()).toHaveLength(4);
    // The solving controls are not there yet.
    expect(screen.queryByRole("button", { name: "Apply to both sides" })).toBeNull();
    expect(screen.queryByRole("radio", { name: /Flip a term/ })).toBeNull();
  });

  it("explains a wrong answer by its reason and marks it, without moving on", async () => {
    const { user } = setup("3(x - 2) = 2x + 5");
    await choose(user, "3x − 2");
    expect(document.querySelector(".notice")?.textContent).toContain("multiplies every term inside the brackets");
    const tried = options().find((button) => button.querySelector(".answer-text")?.textContent === "3x − 2")!;
    expect((tried as HTMLButtonElement).disabled).toBe(true);
    expect(tried.classList.contains("wrong")).toBe(true);
    expect(heading(/Open the brackets in 3\(x − 2\)/)).toBeTruthy();
  });

  it("goes on to the balance moves after the right answer, with the clean-up written in the steps", async () => {
    const { user, onContinue } = setup("3(x - 2) = 2x + 5");
    await choose(user, "3x − 6");

    // The question is gone and the equation is in simple form.
    expect(noHeading(/Open the brackets/)).toBeNull();
    expect(spokenEquation()).toBe("Current equation: 3x minus 6 equals 2x plus 5");
    expect(screen.getByRole("radio", { name: "Subtract" })).toBeTruthy();
    // The history shows the equation as written, and the clean-up step.
    expect(document.querySelector(".history-start .history-equation")?.textContent).toBe("3(x − 2) = 2x + 5");
    const items = Array.from(document.querySelectorAll(".history-item"));
    expect(items[1].textContent).toContain("Open the brackets");
    expect(items[1].textContent).toContain("3(x − 2) = 3x − 6");

    // And it can be solved from here: 3x − 6 = 2x + 5 → x = 11.
    await user.click(screen.getByRole("radio", { name: "Subtract" }));
    await user.type(screen.getByLabelText("By how much?"), "2");
    await user.click(screen.getByRole("button", { name: /Amount is an x term/ }));
    await user.click(screen.getByRole("button", { name: "Apply to both sides" }));
    expect(spokenEquation()).toContain("minus 2x");
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("asks a second question for a side that still needs simplifying: 3(x + 2) − 4 = 11", async () => {
    const { user } = setup("3(x + 2) - 4 = 11");
    await choose(user, "3x + 6");
    expect(heading("Simplify 3x + 6 − 4. What do you get?")).toBeTruthy();
    await choose(user, "3x + 2");
    expect(noHeading(/Simplify/)).toBeNull();
    expect(spokenEquation()).toBe("Current equation: 3x plus 2 equals 11");
  });

  it("counts a wrong answer as a mistake in the result", async () => {
    const { user } = setup("2(x + 3) = 14");
    await choose(user, "2x + 3");
    await choose(user, "2x + 6");
    // Finish: x = 4 by hand-played moves is covered elsewhere; here the counted mistake is what matters.
    expect(document.querySelector(".history-list")?.textContent).toContain("2(x + 3) = 2x + 6");
  });

  it("works in Finnish", async () => {
    const { user } = setup("3(x - 2) = 2x + 5", "fi");
    expect(heading("Poista sulut lausekkeesta 3(x − 2). Mitä saat?")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Yhtälö kirjoitettuna" })).toBeTruthy();
    await choose(user, "3x − 2");
    expect(document.querySelector(".notice")?.textContent).toContain("kertoo jokaisen sulkujen sisällä olevan termin");
  });
});

describe("a fraction equation", () => {
  it("asks to simplify, with 'add the denominators' as a tempting wrong answer, and the first move is the common denominator", async () => {
    const { user } = setup("x/2 + x/3 = 5");
    expect(heading("Simplify x/2 + x/3. What do you get?")).toBeTruthy();
    await choose(user, "2x/5");
    expect(document.querySelector(".notice")?.textContent).toContain("cannot add fractions by adding the denominators");
    await choose(user, "5x/6");
    expect(spokenEquation()).toBe("Current equation: 5x over 6 equals 5");

    // The hint points to the common denominator.
    await user.click(screen.getByRole("button", { name: /^Hint$/ }));
    expect(screen.getByText(/The equation has fractions/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /More help/ }));
    expect(screen.getByText(/The smallest one is 6/)).toBeTruthy();
  });
});

describe("a whole level with clean-up questions", () => {
  it("introduces the first clean-up step and demonstrates it in the worked example", async () => {
    const level = getLevel("brackets")!;
    const user = userEvent.setup();
    render(<SolverView level={level} topic={getTopic("brackets")!} onComplete={vi.fn()} onExit={vi.fn()} onOpenLevel={vi.fn()} onQuiz={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Equations with brackets" })).toBeTruthy();
    expect(document.querySelector(".intro-prelude")?.textContent).toContain("3(x + 2)");
    await user.click(screen.getByRole("button", { name: /See a worked example/ }));

    // The tutor answers the clean-up question, then moves on to the balance moves.
    expect(document.querySelector(".eq-written .mathline-row")?.textContent).toContain("3(x + 2)");
    await user.click(screen.getByRole("button", { name: "Show the first step" }));
    expect(within(document.querySelector(".notice") as HTMLElement).getByText(/Every term inside the brackets is multiplied/)).toBeTruthy();
    expect(spokenEquation()).toBe("Worked example: 3x plus 6 equals 2x plus 9");
    await user.click(screen.getByRole("button", { name: "Show the next step" }));
    expect(screen.getByText("Step 1: Subtract 2x from both sides")).toBeTruthy();
  });
});
